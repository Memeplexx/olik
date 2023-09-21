/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    minify: false,
    lib: {
      // entry: resolve(__dirname, 'src/index.ts'),
      entry: {
        index: './src/index.ts',
        devtools: './src/devtools.ts',
        derive: './src/derive.ts',
        'async-write': './src/write-async.ts',
        'async-query': './src/async-query.ts',
      },
      name: 'olik',
      fileName: 'olik',
    },
  },
  plugins: [dts()],
});



// export default defineConfig({
//   build: {
//     emptyOutDir: false,
//     outDir: "dist",
//     sourcemap: true,
//     lib: {
//       entry: {
//         math: "./src/math.ts",
//         logger: "./src/logger.ts",
//       },
//       formats: ["es", "cjs"],
//     },
//   },
// });