import { libState } from '../src';
import { createStore } from '../src/core';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';

beforeEach(() => {
  resetLibraryState();
})

test('should find an element and patch it', () => {
  const state = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
  const store = createStore({ state });
  const payload = { val: 1 };
  store.arr
    .$find.id.$eq(2)
    .$setSome(payload);
  expect(store.$state).toEqual({ ...state, arr: [state.arr[0], { ...state.arr[1], ...payload }] });
})

test('should find an element an replace it', () => {
  const state = { arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }], obj: { num: 0 } };
  const store = createStore({ state });
  const stateBefore = store.$state;
  const payload = { id: 4, val: 2 };
  store.arr
    .$find.id.$eq(2)
    .$set(payload);
  expect(libState.currentAction).toEqual({
    type: 'arr.$find.id.$eq(2).$set()',
    payload,
  });
  const stateAfter = store.$state;
  expect(stateBefore).not.toEqual(stateAfter);
  expect(stateBefore.obj).toEqual(stateAfter.obj);
  expect(stateBefore.arr).not.toEqual(stateAfter.arr);
  expect(store.arr.$find.id.$eq(1).$state).toEqual(stateBefore.arr.find(e => e.id === 1));
  expect(store.$state).toEqual({ arr: [{ id: 1, val: 0 }, { id: 4, val: 2 }], obj: { num: 0 } });
})

test('should filter elements and patch them', () => {
  const state = { arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }, { id: 3, val: 0 }] };
  const store = createStore({ state });
  const payload = { val: 1 };
  store.arr
    .$filter.id.$in([1, 2])
    .$setSome(payload);
  expect(libState.currentAction).toEqual({
    type: 'arr.$filter.id.$in([1,2]).$setSome()',
    payload,
  });
  expect(store.$state).toEqual({ arr: [{ id: 1, val: 1 }, { id: 2, val: 1 }, { id: 3, val: 0 }] });
})

test('should find an element and replace one of its properties', () => {
  const state = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
  const store = createStore({ state });
  const payload = 1;
  store.arr
    .$find.id.$eq(2).val
    .$set(payload);
  expect(libState.currentAction).toEqual({
    type: 'arr.$find.id.$eq(2).val.$set()',
    payload,
  });
  expect(store.$state).toEqual({
    ...state,
    arr: [
      state.arr[0],
      {
        ...state.arr[1],
        val: payload
      }
    ]
  })
});

test('should find an element, find an element in the property array, and replace one if its properties', () => {
  const state = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
  const store = createStore({ state });
  const payload = 9;
  store.arr
    .$find.id.$eq(2)
    .arr.$find.id.$eq(1).num
    .$set(payload);
  expect(libState.currentAction).toEqual({
    type: 'arr.$find.id.$eq(2).arr.$find.id.$eq(1).num.$set()',
    payload,
  });
  expect(store.$state).toEqual({
    ...state,
    arr: [
      state.arr[0], {
        ...state.arr[1],
        arr: [
          {
            ...state.arr[1].arr[0], num: 9
          },
          state.arr[1].arr[1]
        ]
      }]
  })
})

test('should find an element, filter elements in the property array, and all of its properties', () => {
  const state = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
  const store = createStore({ state });
  const payload = 1;
  store.arr
    .$find.id.$eq(2)
    .arr.$filter.id.$in([1, 2]).num
    .$add(payload);
  expect(libState.currentAction).toEqual({
    type: 'arr.$find.id.$eq(2).arr.$filter.id.$in([1,2]).num.$add()',
    payload,
  });
  expect(store.$state).toEqual({
    ...state,
    arr: [
      state.arr[0], {
        ...state.arr[1],
        arr: [
          { ...state.arr[1].arr[0], num: state.arr[1].arr[0].num + payload },
          { ...state.arr[1].arr[1], num: state.arr[1].arr[1].num + payload },
        ]
      }]
  })
})

test('should find an element, filter elements in the property array, and all of its properties', () => {
  const state = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
  const store = createStore({ state });
  const payload = 1;
  store.arr
    .$find.id.$eq(2)
    .arr.num
    .$add(payload);
  expect(libState.currentAction).toEqual({
    type: 'arr.$find.id.$eq(2).arr.num.$add()',
    payload,
  });
  expect(store.$state).toEqual({
    ...state,
    arr: [
      state.arr[0], {
        ...state.arr[1],
        arr: [
          { ...state.arr[1].arr[0], num: state.arr[1].arr[0].num + 1 },
          { ...state.arr[1].arr[1], num: state.arr[1].arr[1].num + 1 },
        ]
      }]
  })
})

test('should filter a list and remove a property from its element(s)', () => {
  const state = {
    user: { name: '', age: 0 },
    todos: [{ id: 1, status: 'done', title: 'one' }, { id: 2, status: 'done', title: 'two' }]
  };
  const store = createStore({ state });
  store.todos.$filter.status.$eq('done').title.$delete();
  expect(store.todos.$state).toEqual(state.todos.map(todo => ({ id: todo.id, status: todo.status })));
})

test('should filter a list a replace a property on its element(s)', () => {
  const state = {
    user: { name: '', age: 0 },
    todos: [{ id: 1, status: 'done', title: 'one', obj: { n: 0 } }, { id: 2, status: 'done', title: 'two', obj: { n: 0 } }, { id: 3, status: 'todo', title: 'three', obj: { n: 0 } }]
  };
  const store = createStore({ state });
  const payload = { n: 1 };
  store.todos.$filter.status.$eq('done').obj.$set(payload);
  expect(store.todos.$state).toEqual(state.todos.map(todo => ({ ...todo, obj: todo.status === 'done' ? payload : todo.obj })));
})

test('should filter a list and replace one of its element(s)', () => {
  const store = createStore({
    state: {
      todos: [{ id: 1, status: 'pending' }, { id: 2, status: 'pending' }, { id: 3, status: 'todo' }],
    }
  });
  const payload = [{ id: 4, status: 'done' }, { id: 5, status: 'done' }];
  store.todos.$filter.status.$eq('pending').$set(payload);
  expect(store.$state.todos).toEqual([{ id: 3, status: 'todo' }, ...payload])
})