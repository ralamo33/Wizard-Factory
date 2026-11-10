import { expect, test } from "./fixtures.ts";

const nameRequired = "Enter your name.";
const ageNotANumber = "Enter your age as a number.";

test("submitting an empty form shows both errors and focuses the name field", async ({ page }) => {
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

test("submitting a blank name shows the name error and focuses the name field", async ({ page }) => {
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

const invalidAges = [
  { age: "twenty", message: ageNotANumber },
  { age: "21.5", message: "Enter your age as a whole number." },
  { age: "-3", message: "Age cannot be negative." },
];

invalidAges.forEach(({ age, message }) => {
  test(`submitting the age "${age}" shows "${message}" and focuses the age field`, async ({ page }) => {
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
});
