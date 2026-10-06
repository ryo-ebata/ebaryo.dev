import type { Preview } from '@storybook/nextjs-vite';
import { NuqsAdapter } from 'nuqs/adapters/react';
import '../app/globals.css';
import { StorybookThemeProvider } from './ThemeProviderWrapper';

const preview: Preview = {
  decorators: [
    (Story) => (
      <NuqsAdapter>
        <StorybookThemeProvider>
          <Story />
        </StorybookThemeProvider>
      </NuqsAdapter>
    ),
  ],
  parameters: {
    a11y: {
      /*
       * 'todo' - show a11y violations in the test UI only
       * 'error' - fail CI on a11y violations
       * 'off' - skip a11y checks entirely
       */
      test: 'error',
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
