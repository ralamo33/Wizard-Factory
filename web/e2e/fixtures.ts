import AxeBuilder from "@axe-core/playwright";
import { expect, test as base } from "@playwright/test";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

export const test = base.extend<{ axe: undefined }>({
  axe: [
    async ({ page }, use): Promise<void> => {
      await use(undefined);

      const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

      expect(results.violations).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
