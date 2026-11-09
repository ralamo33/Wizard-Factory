import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("a newly sworn squire appears in the list", async ({ page }) => {
  const name = `Squire ${randomUUID()}`;

  await page.goto("/");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Age").fill("21");
  await page.getByRole("button", { name: "Swear the Oath" }).click();

  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();
});
