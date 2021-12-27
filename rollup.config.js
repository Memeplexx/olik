import typescript from 'rollup-plugin-typescript2';
import fs from 'fs';
let pkg = JSON.parse(fs.readFileSync('./package.json'));
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';

const commonConfig = {
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
  onwarn: function (warning) {
    if (warning.code === 'THIS_IS_UNDEFINED') { /* skip this benign warning */ return; }
    console.warn(warning.message);
  }
};

export default [
  {
    input: [
      './out-tsc/core.js',
      './out-tsc/augment.js',
      './out-tsc/derive.js',
      './out-tsc/transact.js',
      './out-tsc/nest.js',
      './out-tsc/redux-devtools.js',
      './out-tsc/merge.js',
      './out-tsc/utility.js'
    ],
    output: [
      {
        dir: pkg.main,
        format: 'cjs',
      },
      {
        dir: pkg.module,
        format: 'esm', // the preferred format
      },
    ].map(e => ({ ...e, sourcemap: true })),
    ...commonConfig
  },
  {
    input: `./out-tsc/index.js`,
    output: [
      {
        file: pkg.browser,
        format: 'umd',
        name: 'olik', // the global which can be used in a browser
      }
    ].map(e => ({ ...e, sourcemap: true })),
    ...commonConfig
  }
];
