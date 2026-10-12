import { expect, test, type Page } from '@playwright/test';

const MOBILE_WIDTH = 390;
const REFLOW_WIDTH = 320;
const MIN_TARGET_SIZE = 44;
const pages = ['/', '/blog', '/about', '/design-system'];

const expectNoHorizontalOverflow = async (page: Page) => {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
};

test.describe('Design quality', () => {
  for (const path of pages) {
    test(`${path} reflows without page-level horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize({ height: 800, width: REFLOW_WIDTH });
      await page.goto(`${path}?theme=light`);
      await expectNoHorizontalOverflow(page);
    });
  }

  for (const path of ['/blog']) {
    test(`${path} keeps form controls at least 44px`, async ({ page }) => {
      await page.setViewportSize({ height: 844, width: MOBILE_WIDTH });
      await page.goto(`${path}?theme=light`);
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      const undersized = await page
        .locator('button, input, select, textarea, [role="button"]')
        .evaluateAll(
          (elements, minimum) =>
            elements
              .filter((element) => {
                const rect = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                return (
                  style.display !== 'none' &&
                  style.visibility !== 'hidden' &&
                  rect.width > 0 &&
                  rect.height > 0 &&
                  (rect.width < minimum || rect.height < minimum)
                );
              })
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  height: Math.round(rect.height),
                  name: element.getAttribute('aria-label') || element.textContent?.trim(),
                  width: Math.round(rect.width),
                };
              }),
          MIN_TARGET_SIZE
        );

      expect(undersized).toEqual([]);
    });
  }

  test('blog tag choices use progressive disclosure', async ({ page }) => {
    await page.goto('/blog?theme=light');
    const expand = page.getByRole('button', { name: /すべてのタグを表示/ });
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    const tagListId = await expand.getAttribute('aria-controls');
    expect(tagListId).toBeTruthy();
    const tagButtons = page.locator(`#${tagListId} > button[aria-pressed]`);
    const visibleTagsBefore = await tagButtons.count();
    expect(visibleTagsBefore).toBeLessThanOrEqual(10);

    await expand.click();

    await expect(page.getByRole('button', { name: 'タグを折りたたむ' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(await tagButtons.count()).toBeGreaterThan(visibleTagsBefore);
  });

  test('article typography keeps a readable measure and line height', async ({ page }) => {
    await page.goto('/blog');
    await page.locator('article h2').first().click();
    const typography = await page.locator('.prose').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        width: element.getBoundingClientRect().width,
      };
    });
    expect(typography.fontSize).toBeGreaterThanOrEqual(16);
    expect(typography.lineHeight / typography.fontSize).toBeGreaterThanOrEqual(1.7);
    expect(typography.width).toBeLessThanOrEqual(672);
  });
});
