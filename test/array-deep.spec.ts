import { testState } from '../src/constant';
import { createStore } from '../src/core';
import { currentAction } from './_utility';

describe('array-deep', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should select.arr.find.id.eq(2).patch({ val: 1 })', () => {
    const state = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const store = createStore({ name, state });
    const payload = { val: 1 };
    store.arr
      .find.id.eq(2)
      .patch(payload);
    expect(store.state).toEqual({ ...state, arr: [state.arr[0], { ...state.arr[1], ...payload }] });
  })

  it('should select.arr.find.id.eq(2).replace({ id: 4, val: 2 })', () => {
    const state = { arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }], obj: { num: 0 } };
    const store = createStore({ name, state });
    const stateBefore = store.state;
    const payload = { id: 4, val: 2 };
    store.arr
      .find.id.eq(2)
      .replace(payload);
    expect(currentAction(store)).toEqual({
      type: 'arr.find.id.eq(2).replace()',
      payload,
    });
    const stateAfter = store.state;
    expect(stateBefore).not.toEqual(stateAfter);
    expect(stateBefore.obj).toEqual(stateAfter.obj);
    expect(stateBefore.arr).not.toEqual(stateAfter.arr);
    expect(store.arr.find.id.eq(1).state).toEqual(stateBefore.arr.find(e => e.id === 1));
    expect(store.state).toEqual({ arr: [{ id: 1, val: 0 }, { id: 4, val: 2 }], obj: { num: 0 } });
  })

  it('should select.arr.filter.id.in([1, 2]).patch({ val: 1 })', () => {
    const state = { arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }, { id: 3, val: 0 }] };
    const store = createStore({ name, state });
    const payload = { val: 1 };
    store.arr
      .filter.id.in([1, 2])
      .patch(payload);
    expect(currentAction(store)).toEqual({
      type: 'arr.filter.id.in(1,2).patch()',
      payload,
    });
    expect(store.state).toEqual({ arr: [{ id: 1, val: 1 }, { id: 2, val: 1 }, { id: 3, val: 0 }] });
  })

  it('should find an element and replace one of its properties', () => {
    const state = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .find.id.eq(2).val
      .replace(payload);
    expect(currentAction(store)).toEqual({
      type: 'arr.find.id.eq(2).val.replace()',
      payload,
    });
    expect(store.state).toEqual({
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

  it('should find an element, find an element in the property array, and replace one if its properties', () => {
    const state = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const store = createStore({ name, state });
    const payload = 9;
    store.arr
      .find.id.eq(2)
      .arr.find.id.eq(1).num
      .replace(payload);
    expect(currentAction(store)).toEqual({
      type: 'arr.find.id.eq(2).arr.find.id.eq(1).num.replace()',
      payload,
    });
    expect(store.state).toEqual({
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

  it('should find an element, filter elements in the property array, and all of its properties', () => {
    const state = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .find.id.eq(2)
      .arr.filter.id.in([1, 2]).num
      .increment(payload);
    expect(currentAction(store)).toEqual({
      type: 'arr.find.id.eq(2).arr.filter.id.in(1,2).num.increment()',
      payload,
    });
    expect(store.state).toEqual({
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

  it('should find an element, filter elements in the property array, and all of its properties', () => {
    const state = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const store = createStore({ name, state });
    const payload = 1;
    store.arr
      .find.id.eq(2)
      .arr.num
      .incrementAll(payload);
    expect(currentAction(store)).toEqual({
      type: 'arr.find.id.eq(2).arr.num.incrementAll()',
      payload,
    });
    expect(store.state).toEqual({
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

});