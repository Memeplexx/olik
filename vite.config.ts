/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: {
        index: './src/index.ts',
        devtools: './src/devtools.ts',
        derive: './src/derive.ts',
        sort: './src/sort.ts',
      },
      name: 'olik',
      fileName: 'olik',
    },
  },
  plugins: [dts()],
});
