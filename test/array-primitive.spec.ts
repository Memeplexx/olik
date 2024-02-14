import { createStore } from '../src/core';
import { test, expect, beforeEach } from 'vitest';
import { resetLibraryState } from '../src/utility';
import { libState } from '../src';
import { Brand } from '../src/type';


beforeEach(() => {
  resetLibraryState();
})

test('should merge a number', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge(2);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: 2 });
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2] });
})

test('should merge a branded number', () => { ///////
  const store = createStore({ nums: [1, 4, 5] as Array<Brand<number, 'number'>> });
  store.nums.$merge(2);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: 2 });
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2] });
})

test('should merge a number with duplicate', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge(4);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: 4 });
  expect(store.$state).toEqual({ nums: [1, 4, 5] });
})

test('should merge a number list', () => {
  const store = createStore({ nums: [1, 4, 5] });
  store.nums.$merge([2, 5, 7, 2]);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: [2, 5, 7, 2] });
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2, 7, 2] });
})

test('should merge a branded number list', () => {
  const store = createStore({ nums: [1, 4, 5] as Array<Brand<number, 'number'>> });
  store.nums.$merge([2, 5, 7, 2] as Array<Brand<number, 'number'>>);
  expect(libState.currentAction).toEqual({ type: 'nums.$merge()', payload: [2, 5, 7, 2] });
  expect(store.$state).toEqual({ nums: [1, 4, 5, 2, 7, 2] });
})

test('', () => {
  // const stack = `
  //   Error
  //     at useInputs (webpack-internal:///./components/tags-config/inputs.ts:18:27)
  //     at TagsConfig (webpack-internal:///./components/tags-config/index.tsx:26:70)
  //     at renderWithHooks (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:16305:18)
  //     at updateForwardRef (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:19221:20)
  //     at beginWork (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:21631:16)
  //     at beginWork$1 (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:27421:14)
  //     at performUnitOfWork (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:26552:12)
  //     at workLoopSync (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:26461:5)
  //     at renderRootSync (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:26429:7)
  //     at performSyncWorkOnRoot (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:26080:20)
  //     at flushSyncCallbacks (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:12042:22)
  //     at eval (webpack-internal:///./node_modules/.pnpm/react-dom@18.2.0_react@18.2.0/node_modules/react-dom/cjs/react-dom.development.js:25646:13)
  //   `;
  // console.log('...', new URL('http://localhost:5173/src/demo/index.tsx?t=1707468304526:29:26').pathname)
  const stack = `
  Error
    at Object.get (webpack-internal:///./node_modules/.pnpm/olik@1.0.49/node_modules/olik/dist/olik.js:74:83)
    at _codemirror_view__WEBPACK_IMPORTED_MODULE_3__.ViewPlugin.fromClass.decorations.updateSelection (webpack-internal:///./components/active-editor/shared.ts:200:45)
    at enter (webpack-internal:///./components/active-editor/shared.ts:189:30)
    at Tree.iterate (webpack-internal:///./node_modules/.pnpm/@lezer+common@1.0.4/node_modules/@lezer/common/dist/index.js:471:81)
    at _codemirror_view__WEBPACK_IMPORTED_MODULE_3__.ViewPlugin.fromClass.decorations.getDecorations (webpack-internal:///./components/active-editor/shared.ts:149:94)
    at _codemirror_view__WEBPACK_IMPORTED_MODULE_3__.ViewPlugin.fromClass.decorations.update (webpack-internal:///./components/active-editor/shared.ts:144:37)
    at PluginInstance.update (webpack-internal:///./node_modules/.pnpm/@codemirror+view@6.17.1/node_modules/@codemirror/view/dist/index.js:2052:32)
    at EditorView.updatePlugins (webpack-internal:///./node_modules/.pnpm/@codemirror+view@6.17.1/node_modules/@codemirror/view/dist/index.js:7095:29)
    at EditorView.update (webpack-internal:///./node_modules/.pnpm/@codemirror+view@6.17.1/node_modules/@codemirror/view/dist/index.js:7001:22)
    at EditorView.dispatchTransactions (webpack-internal:///./node_modules/.pnpm/@codemirror+view@6.17.1/node_modules/@codemirror/view/dist/index.js:6905:28)
    at EditorView.dispatch (webpack-internal:///./node_modules/.pnpm/@codemirror+view@6.17.1/node_modules/@codemirror/view/dist/index.js:6927:14)
    at MouseSelection.select (webpack-internal:///./node_modules/.pnpm/@codemirror+view@6.17.1/node_modules/@codemirror/view/dist/index.js:4090:23)
    at MouseSelection.move (webpack-internal:///./node_modules/.pnpm/@codemirror+view@6.17.1/node_modules/@codemirror/view/dist/index.js:4012:14)
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
        url = new URL(filePath.substring(1, filePath.length - 2)).pathname;
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