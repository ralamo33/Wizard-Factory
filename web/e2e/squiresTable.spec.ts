import { randomUUID } from "node:crypto";

import type { Locator } from "@playwright/test";

import { expect, test as axeTest } from "./fixtures.ts";

type Squire = Readonly<{ name: string; age: number; order: string }>;

const squires: readonly Squire[] = [
  { name: "Kaladin", age: 20, order: "Windrunners" },
  { name: "Shallan", age: 17, order: "Lightweavers" },
  { name: "Dalinar", age: 53, order: "Bondsmiths" },
  { name: "Jasnah", age: 34, order: "Elsecallers" },
  { name: "Renarin", age: 19, order: "Truthwatchers" },
  { name: "Lift", age: 13, order: "Edgedancers" },
  { name: "Szeth", age: 35, order: "Skybreakers" },
];

const test = axeTest.extend<{ prefix: string; rowNames: Locator }>({
  prefix: async ({ request }, provide) => {
    const prefix = `Sq${randomUUID().slice(0, 8)}`;

    await squires.reduce(async (previous, squire) => {
      await previous;

      const response = await request.post("/trpc/createUser", { data: { ...squire, name: `${prefix} ${squire.name}` } });

      await expect(response).toBeOK();
    }, Promise.resolve());

    await provide(prefix);
  },
  rowNames: async ({ page }, provide) => {
    await provide(page.getByRole("table", { name: "Sworn squires", exact: true }).getByRole("rowheader"));
  },
});

const squiresUrl = (search: Readonly<{ pageLimit?: number; filters: object }>): string => {
  const params = new URLSearchParams({ filters: JSON.stringify(search.filters) });

  if (search.pageLimit !== undefined) {
    params.set("pageLimit", String(search.pageLimit));
  }

  return `/squires?${params.toString()}`;
};

const named = (prefix: string, names: readonly string[]): string[] => names.map((name) => `${prefix} ${name}`);

test("sorting a column cycles ascending, descending, then back to unsorted", async ({ page, prefix, rowNames }) => {
  await page.goto(squiresUrl({ filters: { name: prefix } }));

  const nameHeader = page.getByRole("columnheader", { name: "Name", exact: true });
  const sortByName = nameHeader.getByRole("button", { name: "Name", exact: true });
  const insertionOrder = squires.map((squire) => squire.name);
  const alphabetical = insertionOrder.toSorted((a, b) => a.localeCompare(b));

  await expect(rowNames).toHaveText(named(prefix, insertionOrder));
  await expect(nameHeader).not.toHaveAttribute("aria-sort");

  await sortByName.click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(rowNames).toHaveText(named(prefix, alphabetical));
  await expect(page.getByRole("status")).toContainText("Sorted by Name, ascending");

  await sortByName.click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  await expect(rowNames).toHaveText(named(prefix, alphabetical.toReversed()));

  await sortByName.click();
  await expect(nameHeader).not.toHaveAttribute("aria-sort");
  await expect(rowNames).toHaveText(named(prefix, insertionOrder));
});

test("Next and Previous move between pages and Next is disabled on the last page", async ({ page, prefix, rowNames }) => {
  await page.goto(squiresUrl({ pageLimit: 5, filters: { name: prefix } }));

  const previous = page.getByRole("button", { name: "Previous", exact: true });
  const next = page.getByRole("button", { name: "Next", exact: true });

  await expect(rowNames).toHaveText(named(prefix, ["Kaladin", "Shallan", "Dalinar", "Jasnah", "Renarin"]));
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  await expect(previous).toBeDisabled();

  await next.click();
  await expect(rowNames).toHaveText(named(prefix, ["Lift", "Szeth"]));
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(next).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Showing 2 squires on page 2");

  await previous.click();
  await expect(rowNames).toHaveText(named(prefix, ["Kaladin", "Shallan", "Dalinar", "Jasnah", "Renarin"]));
  await expect(previous).toBeDisabled();
});

test("the name filter applies after a typing pause and its pill removes it", async ({ page, prefix, rowNames }) => {
  await page.goto(squiresUrl({ filters: { name: prefix } }));

  const nameFilter = page.getByLabel("Name", { exact: true });

  await expect(nameFilter).toHaveValue(prefix);
  await nameFilter.fill(`${prefix} kal`);

  await expect(rowNames).toHaveText(named(prefix, ["Kaladin"]));

  const removeName = page.getByRole("button", { name: `Remove filter: Name contains ${prefix} kal`, exact: true });

  await removeName.click();
  await expect(removeName).toBeHidden();
  await expect(nameFilter).toHaveValue("");
});

test("the age range keeps squires between the minimum and maximum age", async ({ page, prefix, rowNames }) => {
  await page.goto(squiresUrl({ filters: { name: prefix } }));
  await page.getByLabel("Minimum age", { exact: true }).fill("18");
  await page.getByLabel("Maximum age", { exact: true }).fill("30");

  await expect(rowNames).toHaveText(named(prefix, ["Kaladin", "Renarin"]));
  await expect(page.getByRole("button", { name: "Remove filter: Age from 18 to 30", exact: true })).toBeVisible();
});

test("checking orders keeps only squires of those orders", async ({ page, prefix, rowNames }) => {
  await page.goto(squiresUrl({ filters: { name: prefix } }));

  const orders = page.getByRole("group", { name: "Order", exact: true });

  await orders.getByRole("checkbox", { name: "Windrunners", exact: true }).check();
  await orders.getByRole("checkbox", { name: "Bondsmiths", exact: true }).check();

  await expect(rowNames).toHaveText(named(prefix, ["Kaladin", "Dalinar"]));
  await expect(page.getByRole("button", { name: "Remove filter: Order is Windrunners or Bondsmiths", exact: true })).toBeVisible();
});

test("Clear filters removes every filter", async ({ page, prefix, rowNames }) => {
  await page.goto(squiresUrl({ filters: { name: prefix, order: ["Windrunners"] } }));
  await expect(rowNames).toHaveText(named(prefix, ["Kaladin"]));

  await page.getByRole("button", { name: "Clear filters", exact: true }).click();

  await expect(page.getByRole("button", { name: `Remove filter: Name contains ${prefix}`, exact: true })).toBeHidden();
  await expect(page.getByRole("button", { name: "Remove filter: Order is Windrunners", exact: true })).toBeHidden();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: "Windrunners", exact: true })).not.toBeChecked();
});

test("an empty state shows when no squire matches the filters", async ({ page, prefix }) => {
  await page.goto(squiresUrl({ filters: { name: `${prefix} nobody` } }));

  await expect(page.getByText("The tower records no squire matching these filters.", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("No squires match these filters");
});

test("filters, sort and page survive a reload", async ({ page, prefix, rowNames }) => {
  await page.goto(squiresUrl({ pageLimit: 2, filters: { name: prefix } }));

  const orders = page.getByRole("group", { name: "Order", exact: true });

  await orders.getByRole("checkbox", { name: "Windrunners", exact: true }).check();
  await orders.getByRole("checkbox", { name: "Bondsmiths", exact: true }).check();
  await orders.getByRole("checkbox", { name: "Lightweavers", exact: true }).check();

  const sortByAge = page.getByRole("button", { name: "Age", exact: true });

  await sortByAge.click();
  await sortByAge.click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(rowNames).toHaveText(named(prefix, ["Shallan"]));

  await page.reload();

  await expect(rowNames).toHaveText(named(prefix, ["Shallan"]));
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Age", exact: true })).toHaveAttribute("aria-sort", "descending");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(prefix);
  await expect(page.getByRole("checkbox", { name: "Bondsmiths", exact: true })).toBeChecked();
});
