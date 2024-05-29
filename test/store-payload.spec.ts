import { beforeEach, expect, test } from 'vitest';
import { StateAction, libState, readState, testState, updatePropMap } from '../src';
import { createStore } from '../src/core';
import { deserialize, resetLibraryState } from '../src/utility';
import { configureDevtools } from '../src/devtools';


beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('', () => {
  const store = createStore({ hello: 'world' as string | null });
  store.hello.$set(null);
})

test('', () => {
  const store = createStore({
    arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }],
  });
  store.arr.$at(1).$delete();
  expect(store.arr.$state).toEqual([{ id: 1, text: 'one' }, { id: 3, text: 'three' }]);
})

test('', () => {
  const doReadState = (type: string, state: unknown) => {
    if (type === undefined) { return state; }
    const segments = type.split('.');
    // if (type.endsWith(')')) {
    //   segments.pop();
    // }
    const stateActions: StateAction[] = segments
      .map(seg => {
        const arg = seg.match(/\(([^)]*)\)/)?.[1];
        const containsParenthesis = arg !== null && arg !== undefined;
        if (containsParenthesis && !(seg in updatePropMap)) {
          const functionName = seg.split('(')[0];
          const typedArg = deserialize(arg);
          return { name: functionName, arg: typedArg };
        } else {
          return { name: seg, arg: null };
        }
      });
    stateActions.push({ name: '$state' });
    return readState(state, stateActions);
  }
  const appStore = createStore({
    modal: null as 'confirmDeleteGroup' | 'confirmDeleteTag' | 'synonymOptions' | 'groupOptions' | null,
    bool: false,
    flatObj: {
      one: 'hello',
      two: 'world',
      three: 'another',
    },
    num: 0,
    obj: {
      one: {
        two: 'hello'
      }
    },
    arr: [
      { id: 1, text: 'one' },
      { id: 2, text: 'two' },
      { id: 3, text: 'three' },
    ],
    arrNum: [1, 2, 3],
  })
  doReadState('arr.$find.id.$eq(3)', appStore.$state);
})

test('should be able to re-create state', () => {
  createStore({ hello: 'world' });
  libState.initialState = undefined;
  const store2 = createStore({ hello: 'another' });
  expect(store2.$state).toEqual({ hello: 'another' });
})

test('accept dates', () => {
  const store = createStore({ dat: new Date() });
  store.dat.$set(new Date());
})

test('array indices on primitive', () => {
  const store = createStore({ arr: [1, 2, 3] });
  store.arr.$at(1).$set(4);
  expect(store.$state).toEqual({ arr: [1, 4, 3] });
})

test('array indices of object', () => {
  const store = createStore({ arr: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }] });
  store.arr.$at(1).value.$set('four');
  expect(store.$state).toEqual({ arr: [{ id: 1, value: 'one' }, { id: 2, value: 'four' }, { id: 3, value: 'three' }] });
  expect(store.arr.$at(1).$state).toEqual({ id: 2, value: 'four' });
  expect(store.arr.$at(1).value.$state).toEqual('four');
})

test('array indices filter and then at', () => {
  const store = createStore({ arr: [{ id: 1, arr2: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }] }, { id: 2, arr2: [{ id: 3, value: 'three' }, { id: 4, value: 'four' }] }] });
  store.arr.$filter.id.$lte(2).arr2.$at(1).value.$set('xxx');
  expect(store.$state).toEqual({ arr: [{ id: 1, arr2: [{ id: 1, value: 'one' }, { id: 2, value: 'xxx' }] }, { id: 2, arr2: [{ id: 3, value: 'three' }, { id: 4, value: 'xxx' }] }] });
  expect(testState.currentActionType).toEqual('arr.$filter.id.$lte(2).arr2.$at(1).value.$set()');
  expect(testState.currentActionPayload).toEqual('xxx');
});

test('set object key', () => {
  const store = createStore({ hello: 'world', another: 'what' });
  let changed = '';
  store.hello.$onChange(v => changed = v);
  store.hello.$setKey('sss');
  expect(store.$state).toEqual({ sss: 'world', another: 'what' });
  expect(changed).toEqual('world');
})
