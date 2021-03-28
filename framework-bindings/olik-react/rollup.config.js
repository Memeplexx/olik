import typescript from 'rollup-plugin-typescript2';
import fs from 'fs';
let pkg = JSON.parse(fs.readFileSync('./package.json'));
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs'

export default {
  input: `src/index.ts`,
  external: ['react', 'olik'],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es', // the preferred format
    },
    {
      file: pkg.unpkg,
      format: 'iife',
      name: 'oulikreact', // the global which can be used in a browser
    }
  ].map(e => ({
    ...e, sourcemap: true, globals: {
      'react': 'React'
    }
  })),
  plugins: [
    resolve(),
    peerDepsExternal(),
    commonJS({
      include: 'node_modules/**'
    }),
    typescript({
      typescript: require('typescript'),
    }),
  ],
};
