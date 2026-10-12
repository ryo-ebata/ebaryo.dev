import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['/', '/about', '/blog', '/portfolio', '/design-system', '/sitemap-page'];
const themedPages = ['/', '/blog'];

test.describe('Accessibility', () => {
  for (const path of pages) {
    test(`${path} meets the automated WCAG 2.2 AA baseline`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

      const ids = await page
        .locator('[id]')
        .evaluateAll((elements) => elements.map((element) => element.id));
      expect(ids.length).toBe(new Set(ids).size);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }

  for (const path of themedPages) {
    for (const theme of ['light', 'dark']) {
      test(`${path} preserves text contrast in ${theme} theme`, async ({ page }) => {
        await page.goto(`${path}?theme=${theme}`);

        const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }

  test('keyboard focus starts with the skip link', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '本文へスキップ' })).toBeFocused();
  });
});
