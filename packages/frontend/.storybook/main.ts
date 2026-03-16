import { resolve, dirname } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const DIR = typeof __dirname !== 'undefined' ? __dirname : dirname(new URL(import.meta.url).pathname);
const ROOT = resolve(DIR, '..');
const API_CLIENT_SRC = resolve(ROOT, '../../packages/api-client/src');

const config: StorybookConfig = {
  stories: [
    '../design-system/**/*.stories.@(ts|tsx)',
    '../src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-essentials'],
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  async viteFinal(viteConfig) {
    const existingAlias = viteConfig.resolve?.alias;
    const baseAlias = Array.isArray(existingAlias) ? existingAlias : [];

    return {
      ...viteConfig,
      resolve: {
        ...viteConfig.resolve,
        alias: [
          ...baseAlias,
          { find: 'next/navigation', replacement: resolve(DIR, 'mocks/next-navigation.ts') },
          { find: /^@\/(.*)$/, replacement: resolve(ROOT, 'src/$1') },
          { find: /^@findog\/design-system\/(.*)$/, replacement: resolve(ROOT, 'design-system/$1') },
          { find: '@findog/design-system', replacement: resolve(ROOT, 'design-system/index') },
          { find: /^@findog\/api-client\/(.*)$/, replacement: resolve(API_CLIENT_SRC, '$1') },
          { find: '@findog/api-client', replacement: resolve(API_CLIENT_SRC, 'index') },
        ],
      },
    };
  },
};

export default config;
