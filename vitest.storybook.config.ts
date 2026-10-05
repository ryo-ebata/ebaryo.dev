import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
  resolve: {
    alias: {
      '@': path.resolve(dirname),
      'next-view-transitions': path.resolve(dirname, 'vitest.next-view-transitions-mock.ts'),
      'next/cache': path.resolve(dirname, 'vitest.next-cache-mock.ts'),
      'server-only': path.resolve(dirname, 'vitest.server-only-mock.ts'),
    },
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright({}),
    },
    exclude: ['**/node_modules/**'],
    name: 'storybook',
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
});
