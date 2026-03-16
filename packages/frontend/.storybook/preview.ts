import type { Preview } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { getAuthMock } from '@findog/api-client/mocks/auth/auth.msw';

import '../src/app/globals.css';

// Start MSW service worker before stories load
initialize();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    msw: {
      handlers: [...getAuthMock()],
    },
  },
  loaders: [mswLoader],
};

export default preview;
