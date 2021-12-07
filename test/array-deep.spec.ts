import { createApplicationStore } from '../src/index';
import { libState } from '../src/constant';

describe('array-deep', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should select.arr.find.id.eq(2).patch({ val: 1 })', () => {
    const initialState = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    const payload = { val: 1 };
    libState.logLevel = 'debug';
    select.arr
      .find.id.eq(2)
      .patch(payload);
    expect(select.read()).toEqual({ ...initialState, arr: [initialState.arr[0], { ...initialState.arr[1], ...payload }] });
  })

  it('should select.arr.find.id.eq(2).replace({ id: 4, val: 2 })', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }], obj: { num: 0 } });
    const stateBefore = select.read();
    const payload = { id: 4, val: 2 };
    select.arr
      .find.id.eq(2)
      .replace(payload);
    const stateAfter = select.read();
    expect(stateBefore).not.toEqual(stateAfter);
    expect(stateBefore.obj).toEqual(stateAfter.obj);
    expect(stateBefore.arr).not.toEqual(stateAfter.arr);
    expect(select.arr.find.id.eq(1).read()).toEqual(stateBefore.arr.find(e => e.id === 1));
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 0 }, { id: 4, val: 2 }], obj: { num: 0 } });
  })

  it('should select.arr.filter.id.in([1, 2]).patch({ val: 1 })', () => {
    const initialState = { arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }, { id: 3, val: 0 }] };
    const select = createApplicationStore(initialState);
    const payload = { val: 1 };
    select.arr
      .filter.id.in([1, 2])
      .patch(payload);
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 1 }, { id: 2, val: 1 }, { id: 3, val: 0 }] });
  })

  it('should find an element and replace one of its properties', () => {
    const initialState = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    const payload = 1;
    select.arr
      .find.id.eq(2).val
      .replace(payload);
    expect(select.read()).toEqual({
      ...initialState,
      arr: [
        initialState.arr[0],
        {
          ...initialState.arr[1],
          val: payload
        }
      ]
    })
  });

  it('should find an element, find an element in the property array, and replace one if its properties', () => {
    const initialState = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    const payload = 9;
    select.arr
      .find.id.eq(2)
      .arr.find.id.eq(1).num
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'arr.find.id.eq(2).arr.find.id.eq(1).num.replace()',
      payload,
    });
    expect(select.read()).toEqual({
      ...initialState,
      arr: [
        initialState.arr[0], {
          ...initialState.arr[1],
          arr: [
            {
              ...initialState.arr[1].arr[0], num: 9
            },
            initialState.arr[1].arr[1]
          ]
        }]
    })
  })

  it('should find an element, filter elements in the property array, and all of its properties', () => {
    const initialState = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    const payload = 1;
    select.arr
      .find.id.eq(2)
      .arr.filter.id.in([1, 2]).num
      .increment(payload);
    expect(libState.currentAction).toEqual({
      type: 'arr.find.id.eq(2).arr.filter.id.in(1,2).num.increment()',
      payload,
    });
    expect(select.read()).toEqual({
      ...initialState,
      arr: [
        initialState.arr[0], {
          ...initialState.arr[1],
          arr: [
            { ...initialState.arr[1].arr[0], num: initialState.arr[1].arr[0].num + payload },
            { ...initialState.arr[1].arr[1], num: initialState.arr[1].arr[1].num + payload },
          ]
        }]
    })
  })

  it('should find an element, filter elements in the property array, and all of its properties', () => {
    const initialState = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    const payload = 1;
    select.arr
      .find.id.eq(2)
      .arr.num
      .incrementAll(payload);
    expect(libState.currentAction).toEqual({
      type: 'arr.find.id.eq(2).arr.num.incrementAll()',
      payload,
    });
    expect(select.read()).toEqual({
      ...initialState,
      arr: [
        initialState.arr[0], {
          ...initialState.arr[1],
          arr: [
            { ...initialState.arr[1].arr[0], num: initialState.arr[1].arr[0].num + 1 },
            { ...initialState.arr[1].arr[1], num: initialState.arr[1].arr[1].num + 1 },
          ]
        }]
    })
  })

});