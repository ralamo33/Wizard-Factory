import { expect, test } from "./fixtures.ts";

test("a signed-out visitor to the squires roll is sent to sign in", async ({ page }) => {
  await page.goto("/squires");

  await expect(page).toHaveURL(/\/sign-in/u);
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
});

test("a signed-out visitor sees a sign-in button instead of the squires", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Swear the Oath", exact: true })).toBeHidden();
});
