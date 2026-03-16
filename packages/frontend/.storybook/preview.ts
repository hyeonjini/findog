import type { Preview } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { getAuthMock, getTrackedProductsMock } from '../../api-client/src/msw';

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
      handlers: [...getAuthMock(), ...getTrackedProductsMock()],
    },
  },
  loaders: [mswLoader],
};

export default preview;
