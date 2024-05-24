import { beforeEach, expect, test } from 'vitest';
import { createStore } from '../src/core';
import { configureDevtools } from '../src/devtools';
import { resetLibraryState } from '../src/utility';


beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should allow dates', () => {
  const state = { date: new Date() };
  const store = createStore(state)
  expect(typeof store.$state.date).toEqual('object')
})

test('should correctly parse a stack trace', () => {
  const stack = `
  Error
    at Object.get (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/olik@1.0.63/node_modules/olik/dist/olik.js:91:95)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/olik-react@1.0.12_olik@1.0.63_vite@5.1.3/node_modules/olik-react/dist/olik-react.js:63:74)
    at mountMemo (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:10975:17)
    at Object.useMemo (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:11589:32)
    at useMemo (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react/cjs/react.development.js:1472:31)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/olik-react@1.0.12_olik@1.0.63_vite@5.1.3/node_modules/olik-react/dist/olik-react.js:62:62)
    at useInputs (webpack-internal:///(app-pages-browser)/./components/tags-config/inputs.ts:19:138)
    at TagsConfig (webpack-internal:///(app-pages-browser)/./components/tags-config/index.tsx:25:70)
    at renderWithHooks (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:9745:28)
    at updateForwardRef (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:13758:32)
    at beginWork$1 (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:15982:32)
    at beginWork (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:22789:28)
    at performUnitOfWork (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:21852:24)
    at workLoopSync (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:21617:17)
    at renderRootSync (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:21584:21)
    at performSyncWorkOnRoot (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:21124:30)
    at flushSyncWorkAcrossRoots_impl (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:9119:33)
    at flushSyncWorkOnAllRoots (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:9085:13)
    at processRootScheduleInMicrotask (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:9207:13)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.1.0_@babel+core@7.23.9_react-dom@18.2.0_react@18.2.0/node_modules/next/dist/compiled/react-dom/cjs/react-dom.development.js:9353:21)
  `;
  const frames = stack
    .trim()
    .substring('Error'.length)
    .trim()
    .split('\n')
    .filter(s => !s.includes('node_modules'))
    .map(s => s.trim().substring('at '.length).trim())
    .map(s => {
      const [fn, filePath] = s.split(' ');
      let url: string;
      const fun = fn.substring(fn.indexOf('.') + 1);
      try {
        url = new URL(filePath.replace('(app-pages-browser)/', '').substring(1, filePath.length - 2)).pathname;
      } catch (e) {
        return { fn: fun, filePath: '' };
      }
      return { fn: fun, filePath: url };
    })
    .filter(s => s.filePath !== '')
    .map(s => ({ ...s, filePath: s.filePath.includes(':') ? s.filePath.substring(0, s.filePath.indexOf(':')) : s.filePath }))
    .map(s => ({ ...s, filePath: s.filePath.replace(/\.[^/.]+$/, "") }))
    .map(s => `${s.filePath}.${s.fn}()`)
    .reverse();
  console.log(frames)
})