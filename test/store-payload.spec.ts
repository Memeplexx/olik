import { beforeEach, expect, test } from 'vitest';
import { libState } from '../src';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';


beforeEach(() => {
  resetLibraryState();
})

test('should be able include store object with patch', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.$patch({
    two: 2,
    three: store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).text
  });
  expect(store.$state).toEqual({ one: { two: 2, three: 'element' }, arr: [ { id: 1, text: 'element' } ]});
  expect(libState.currentAction?.payloadOrig).toEqual({
    two: 2,
    three: 'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).text = "element"'
  })
})

test('should be able include store object with set', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.two.$set(store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).id);
  expect(libState.currentAction?.payloadOrig).toEqual(
    'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).id = 1'
  );
})

test('should be able include store object with setNew', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.$setNew(store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).id);
  expect(libState.currentAction?.payloadOrig).toEqual(
    'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).id = 1'
  );
})

test('should be able include nested store object with set', () => {
  const store = createStore({ one: { two: 1, three: '' }, arr: [{ id: 1, text: 'element' }] });
  store.one.$set({
    two: store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).id,
    three: store.arr.$find.id.$eq(store.arr.$find.text.$eq('element').id).text
  });
  expect(libState.currentAction?.payloadOrig).toEqual({
    two: 'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).id = 1',
    three: 'arr.$find.id.$eq( arr.$find.text.$eq("element").id = 1 ).text = "element"'
  });
})

test('', () => {
  const store = createStore({ arr: [{ id: 1, text: 'element' }], arr2: [{ id: 2, text: 'element2' }] });
  store.arr.$set(store.arr2.$filter.id.$eq(2));
  expect(libState.currentAction?.payloadOrig).toEqual('arr2.$filter.id.$eq(2) = [{"id":2,"text":"element2"}]');
})

test('', () => {
  const store = createStore({ arr: [{ id: 1, text: 'element' }], arr2: [{ id: 2, text: 'element2' }] });
  store.arr.$filter.id.$eq(1).text.$set(store.arr2.$find.id.$eq(2).text);
  expect(libState.currentAction?.payloadOrig).toEqual('arr2.$find.id.$eq(2).text = "element2"');
})

test('', () => {
  const store = createStore({ hello: 'world' as string | null });
  store.hello.$set(null);
})

test('', () => {
  const store = createStore({ arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }] });
  store.arr.$set(store.arr.$filter.id.$eq(1));
})

test('', () => {
  const store = createStore({ arr: [1, 2, 3] });
  store.arr.$merge(store.arr.$filter.$eq(2));
})

test('', () => {
  const store = createStore({
    arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }],
    arr2: [{ id: 1, text: 'one2' }]
  });
  store.arr.$mergeMatching.id.$withMany(store.arr2.$filter.id.$eq(1));
  expect(store.arr.$state).toEqual([{ id: 1, text: 'one2' }, { id: 2, text: 'two' }, { id: 3, text: 'three' }]);
})
