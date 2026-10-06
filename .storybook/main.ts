import type { StorybookConfig } from '@storybook/nextjs-vite';

/*
 * チャンクサイズの閾値
 */
const CHUNK_SIZE_WARNING_LIMIT = 2500;

const shouldSuppressWarning = (message?: string): boolean => {
  if (!message) {
    return false;
  }
  /*
   * "use client" 関連の警告をフィルタリング
   */
  if (
    message.includes('use client') ||
    message.includes('Module level directives') ||
    message.includes("Can't resolve original location")
  ) {
    return true;
  }
  /*
   * チャンクサイズの警告を抑制（Storybookのテスト用エントリーポイントが大きいため）
   */
  if (message.includes('chunks are larger') || message.includes('Some chunks are larger')) {
    return true;
  }
  return false;
};

const config: StorybookConfig = {
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  stories: [
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  viteFinal(viteConfig) {
    viteConfig.build = viteConfig.build || {};
    /*
     * Storybookのテスト用エントリーポイント（vite-inject-mocker-entry.js）が大きいため、閾値を上げる
     */
    viteConfig.build.chunkSizeWarningLimit = CHUNK_SIZE_WARNING_LIMIT;
    viteConfig.build.rollupOptions = viteConfig.build.rollupOptions || {};

    const originalOnwarn = viteConfig.build.rollupOptions.onwarn;
    viteConfig.build.rollupOptions.onwarn = (warning, warn) => {
      if (shouldSuppressWarning(warning.message)) {
        return;
      }
      if (originalOnwarn) {
        originalOnwarn(warning, warn);
      } else {
        warn(warning);
      }
    };

    return viteConfig;
  },
};
export default config;
