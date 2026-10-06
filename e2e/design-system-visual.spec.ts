import { expect, test, type Page } from '@playwright/test';

const preparePage = async (page: Page, theme: 'light' | 'dark') => {
  await page.goto(`/design-system?theme=${theme}`);
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
};

test('design system light desktop', async ({ page }) => {
  await preparePage(page, 'light');
  await expect(page).toHaveScreenshot('design-system-light-desktop.png', {
    animations: 'disabled',
    fullPage: true,
  });
});

test('design system dark desktop', async ({ page }) => {
  await preparePage(page, 'dark');
  await expect(page).toHaveScreenshot('design-system-dark-desktop.png', {
    animations: 'disabled',
    fullPage: true,
  });
});

test('design system mobile', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await preparePage(page, 'light');
  await expect(page).toHaveScreenshot('design-system-light-mobile.png', {
    animations: 'disabled',
    fullPage: true,
  });
});
