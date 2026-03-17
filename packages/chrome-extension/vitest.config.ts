import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

const wxtVitestPlugin = WxtVitest() as never;

export default defineConfig({
  plugins: [wxtVitestPlugin],
  test: {
    globals: true,
  },
});
