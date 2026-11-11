import { randomUUID } from "node:crypto";

import { createClerkClient } from "@clerk/backend";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";

import { expect, test as base } from "./fixtures.ts";

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

const nameRequired = "Enter your name.";
const ageNotANumber = "Enter your age as a number.";

const invalidAges = [
  { age: "twenty", message: ageNotANumber },
  { age: "21.5", message: "Enter your age as a whole number." },
  { age: "-3", message: "Age cannot be negative." },
];

const clerkTestVerificationCode = "424242";

const clerkBackend = createClerkClient({ secretKey: process.env["CLERK_SECRET_KEY"] ?? "" });

const usersWithEmail = async (emailAddress: string): Promise<readonly string[]> => {
  const { data } = await clerkBackend.users.getUserList({ emailAddress: [emailAddress] });

  return data.filter((user) => user.emailAddresses.some((address) => address.emailAddress === emailAddress)).map((user) => user.id);
};

const test = base.extend<{ newUserEmail: string }>({
  newUserEmail: async ({ page }, provide, testInfo) => {
    await clerkSetup({ dotenv: false });
    await setupClerkTestingToken({ page });

    const emailAddress = `e2e-${randomUUID()}+clerk_test@example.com`;

    await provide(emailAddress);

    const createdUserIds = await usersWithEmail(emailAddress);

    await Promise.all(createdUserIds.map(async (userId) => clerkBackend.users.deleteUser(userId)));
    testInfo.annotations.push({ type: "deleted Clerk users", description: createdUserIds.length === 0 ? "none" : createdUserIds.join(", ") });

    expect(createdUserIds).toHaveLength(1);
    expect(await usersWithEmail(emailAddress)).toEqual([]);
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

test("a newly signed-up squire can use the roll and swear the oath", async ({ page, request, newUserEmail }) => {
  test.slow();

  await test.step("sign up through Clerk's sign-up form", async () => {
    await page.goto("/sign-up");
    await page.getByLabel("Email address", { exact: true }).fill(newUserEmail);
    await page.getByLabel("Password", { exact: true }).fill(`${randomUUID()}Aa1!`);
    const codeSent = page.waitForResponse((response) => response.url().includes("/prepare_verification") && response.ok());

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await codeSent;
    await page.getByRole("textbox", { name: "Enter verification code", exact: true }).pressSequentially(clerkTestVerificationCode);

    await expect(page.getByRole("button", { name: "Open user menu", exact: true })).toBeVisible();
  });

  const token = await page.evaluate(async () => window.Clerk.session?.getToken());
  const authorization = `Bearer ${token ?? ""}`;
  const prefix = `Sq${randomUUID().slice(0, 8)}`;
  const rowNames = page.getByRole("table", { name: "Sworn squires", exact: true }).getByRole("rowheader");
  const insertionOrder = squires.map((squire) => squire.name);

  await test.step("the squires table shows knights", async () => {
    await squires.reduce(async (previous, squire) => {
      await previous;

      const response = await request.post("/trpc/createUser", { data: { ...squire, name: `${prefix} ${squire.name}` }, headers: { authorization } });

      await expect(response).toBeOK();
    }, Promise.resolve());

    await page.goto(squiresUrl({ filters: { name: prefix } }));

    await expect(rowNames).toHaveText(named(prefix, insertionOrder));
  });

  await test.step("sorting a column cycles ascending, descending, then back to unsorted", async () => {
    await page.goto(squiresUrl({ filters: { name: prefix } }));

    const nameHeader = page.getByRole("columnheader", { name: "Name", exact: true });
    const sortByName = nameHeader.getByRole("button", { name: "Name", exact: true });
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

  await test.step("Next and Previous move between pages and Next is disabled on the last page", async () => {
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

  await test.step("the name filter applies after a typing pause and its pill removes it", async () => {
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

  await test.step("the age range keeps squires between the minimum and maximum age", async () => {
    await page.goto(squiresUrl({ filters: { name: prefix } }));
    await page.getByLabel("Minimum age", { exact: true }).fill("18");
    await page.getByLabel("Maximum age", { exact: true }).fill("30");

    await expect(rowNames).toHaveText(named(prefix, ["Kaladin", "Renarin"]));
    await expect(page.getByRole("button", { name: "Remove filter: Age from 18 to 30", exact: true })).toBeVisible();
  });

  await test.step("checking orders keeps only squires of those orders", async () => {
    await page.goto(squiresUrl({ filters: { name: prefix } }));

    const orders = page.getByRole("group", { name: "Order", exact: true });

    await orders.getByRole("checkbox", { name: "Windrunners", exact: true }).check();
    await orders.getByRole("checkbox", { name: "Bondsmiths", exact: true }).check();

    await expect(rowNames).toHaveText(named(prefix, ["Kaladin", "Dalinar"]));
    await expect(page.getByRole("button", { name: "Remove filter: Order is Windrunners or Bondsmiths", exact: true })).toBeVisible();
  });

  await test.step("Clear filters removes every filter", async () => {
    await page.goto(squiresUrl({ filters: { name: prefix, order: ["Windrunners"] } }));
    await expect(rowNames).toHaveText(named(prefix, ["Kaladin"]));

    await page.getByRole("button", { name: "Clear filters", exact: true }).click();

    await expect(page.getByRole("button", { name: `Remove filter: Name contains ${prefix}`, exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Remove filter: Order is Windrunners", exact: true })).toBeHidden();
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
    await expect(page.getByRole("checkbox", { name: "Windrunners", exact: true })).not.toBeChecked();
  });

  await test.step("an empty state shows when no squire matches the filters", async () => {
    await page.goto(squiresUrl({ filters: { name: `${prefix} nobody` } }));

    await expect(page.getByText("The tower records no squire matching these filters.", { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("No squires match these filters");
  });

  await test.step("filters, sort and page survive a reload", async () => {
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

  const ownKnight = `Squire ${randomUUID()}`;

  await test.step("creating a knight through the form", async () => {
    await page.goto("/");
    await page.getByLabel("Name", { exact: true }).fill(ownKnight);
    await page.getByLabel("Age", { exact: true }).fill("21");
    await page.getByRole("button", { name: "Swear the Oath", exact: true }).click();

    await expect(page.getByRole("listitem").filter({ hasText: ownKnight })).toBeVisible();
  });

  await test.step("submitting an empty form shows both errors and focuses the name field", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Swear the Oath", exact: true }).click();

    const nameField = page.getByLabel("Name", { exact: true });
    const ageField = page.getByLabel("Age", { exact: true });

    await expect(page.getByText(nameRequired, { exact: true })).toBeVisible();
    await expect(page.getByText(ageNotANumber, { exact: true })).toBeVisible();
    await expect(nameField).toHaveAttribute("aria-invalid", "true");
    await expect(nameField).toHaveAccessibleDescription(nameRequired);
    await expect(ageField).toHaveAttribute("aria-invalid", "true");
    await expect(ageField).toHaveAccessibleDescription(ageNotANumber);
    await expect(nameField).toBeFocused();
  });

  await test.step("submitting a blank name shows the name error and focuses the name field", async () => {
    await page.goto("/");

    const nameField = page.getByLabel("Name", { exact: true });
    const ageField = page.getByLabel("Age", { exact: true });

    await nameField.fill("   ");
    await ageField.fill("21");
    await page.getByRole("button", { name: "Swear the Oath", exact: true }).click();

    await expect(page.getByText(nameRequired, { exact: true })).toBeVisible();
    await expect(nameField).toHaveAccessibleDescription(nameRequired);
    await expect(ageField).toHaveAttribute("aria-invalid", "false");
    await expect(nameField).toBeFocused();
  });

  await invalidAges.reduce(async (previous, { age, message }) => {
    await previous;

    await test.step(`submitting the age "${age}" shows "${message}" and focuses the age field`, async () => {
      await page.goto("/");

      const nameField = page.getByLabel("Name", { exact: true });
      const ageField = page.getByLabel("Age", { exact: true });

      await nameField.fill("Kaladin");
      await ageField.fill(age);
      await page.getByRole("button", { name: "Swear the Oath", exact: true }).click();

      await expect(page.getByText(message, { exact: true })).toBeVisible();
      await expect(nameField).toHaveAttribute("aria-invalid", "false");
      await expect(ageField).toHaveAttribute("aria-invalid", "true");
      await expect(ageField).toHaveAccessibleDescription(message);
      await expect(ageField).toBeFocused();
    });
  }, Promise.resolve());

  await test.step("the squire's own knight appears on the roll", async () => {
    await page.goto(squiresUrl({ filters: { name: ownKnight } }));

    await expect(rowNames).toHaveText([ownKnight]);
  });
});
