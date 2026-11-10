import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures.ts";

test("a newly sworn squire appears in the list", async ({ page }) => {
  const name = `Squire ${randomUUID()}`;

  await page.goto("/");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Age", { exact: true }).fill("21");
  await page.getByRole("button", { name: "Swear the Oath", exact: true }).click();

  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();
});
