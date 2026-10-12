import { defineConfig, devices } from '@playwright/test';

/* 定数 */
const CI_RETRIES = 2;
const LOCAL_RETRIES = 0;
const CI_WORKERS = 1;
const WEB_SERVER_TIMEOUT = 120000;

const getRetries = () => {
  if (process.env.CI) {
    return CI_RETRIES;
  }
  return LOCAL_RETRIES;
};

const getWorkers = () => {
  if (process.env.CI) {
    return CI_WORKERS;
  }
  return undefined;
};

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  reporter: [['html', { open: 'never' }], ['list']],
  retries: getRetries(),
  testDir: './e2e',
  testIgnore: process.env.VISUAL_TEST ? undefined : '**/design-system-visual.spec.ts',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm run build && pnpm run start',
    reuseExistingServer: !process.env.CI,
    timeout: WEB_SERVER_TIMEOUT,
    url: 'http://localhost:3000',
  },
  workers: getWorkers(),
});
