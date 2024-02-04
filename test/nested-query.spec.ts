import { libState } from '../src';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';

beforeEach(() => {
  resetLibraryState();
})

test('support nested query with $eq', () => {
  const store = createStore({
    obj: { num: 2 },
    arr: [{
      one: 'x',
      two: 2,
    }],
  });
  const one = store.obj.num;
  const thing = store.arr.$find.two.$eq(one).one;
  store.arr.$find.one.$eq(thing).two.$add(1);
  expect(libState.currentAction?.type).toEqual('arr.$find.one.$eq( arr.$find.two.$eq( obj.num = 2 ).one = "x" ).two.$add()');
  expect(libState.currentAction?.typeOrig).toEqual('arr.$find.one.$eq("x").two.$add()');
})

test('support nested query with $in', () => {
  const store = createStore({
    obj: { num: 2 },
    arr: [{
      one: 'x',
      two: 2,
    }],
  });
  const one = store.obj.num;
  const thing = store.arr.$filter.two.$eq(one).one;
  store.arr.$find.one.$in(thing).two.$add(1);
  expect(libState.currentAction?.type).toEqual('arr.$find.one.$in( arr.$filter.two.$eq( obj.num = 2 ).one = ["x"] ).two.$add()');
  expect(libState.currentAction?.typeOrig).toEqual('arr.$find.one.$in(["x"]).two.$add()');
})
