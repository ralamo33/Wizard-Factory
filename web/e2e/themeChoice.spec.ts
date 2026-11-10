import { expect, test } from "./fixtures.ts";

test("choosing the light theme survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radiogroup", { name: "Theme", exact: true }).getByRole("radio", { name: "Light", exact: true }).check();
  await page.reload();

  await expect(page.getByRole("radio", { name: "Light", exact: true })).toBeChecked();
  await expect.poll(async () => page.evaluate(() => document.documentElement.dataset["theme"])).toBe("light");
});
