import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const getDirname = () => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  return path.dirname(fileURLToPath(import.meta.url));
};

const dirname = getDirname();

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname),
      'next-view-transitions': path.resolve(dirname, 'vitest.next-view-transitions-mock.ts'),
      'next/cache': path.resolve(dirname, 'vitest.next-cache-mock.ts'),
      'server-only': path.resolve(dirname, 'vitest.server-only-mock.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/stories/**'],
    include: ['**/*.test.{ts,tsx}'],
    name: 'unit',
    setupFiles: ['./vitest.setup.ts'],
  },
});
