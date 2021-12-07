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
    const patch = { val: 1 };
    libState.logLevel = 'debug';
    select.arr
      .find.id.eq(2)
      .patch(patch);
    expect(select.read()).toEqual({ ...initialState, arr: [initialState.arr[0], { ...initialState.arr[1], ...patch }] });
  })

  it('should select.arr.find.id.eq(2).replace({ id: 4, val: 2 })', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }], obj: { num: 0 } });
    const stateBefore = select.read();
    select.arr
      .find.id.eq(2)
      .replace({ id: 4, val: 2 });
    const stateAfter = select.read();
    expect(stateBefore).not.toEqual(stateAfter);
    expect(stateBefore.obj).toEqual(stateAfter.obj);
    expect(stateBefore.arr).not.toEqual(stateAfter.arr);
    expect(select.arr.find.id.eq(1).read()).toEqual(stateBefore.arr.find(e => e.id === 1));
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 0 }, { id: 4, val: 2 }], obj: { num: 0 } });
  })

  it('should select.arr.filter.id.in([1, 2]).patch({ val: 1 })', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 0 }, { id: 2, val: 0 }, { id: 3, val: 0 }] });
    select.arr
      .filter.id.in([1, 2])
      .patch({ val: 1 });
    expect(select.read()).toEqual({ arr: [{ id: 1, val: 1 }, { id: 2, val: 1 }, { id: 3, val: 0 }] });
  })

  it('should find an element and replace one of its properties', () => {
    const initialState = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(2).val
      .replace(1);
    expect(select.read()).toEqual({
      ...initialState,
      arr: [
        initialState.arr[0],
        {
          ...initialState.arr[1],
          val: 1
        }
      ]
    })
  });

  it('should find an element, find an element in the property array, and replace one if its properties', () => {
    const initialState = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(2)
      .arr.find.id.eq(1).num
      .replace(9);
    expect(libState.currentAction).toEqual({
      type: 'arr.find.id.eq(2).arr.find.id.eq(1).num.replace()',
      replacement: 9
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
    select.arr
      .find.id.eq(2)
      .arr.filter.id.in([1, 2]).num
      .increment(1);
    expect(libState.currentAction).toEqual({
      type: 'arr.find.id.eq(2).arr.filter.id.in(1,2).num.increment()',
      by: 1
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

  it('should find an element, filter elements in the property array, and all of its properties', () => {
    const initialState = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    select.arr
      .find.id.eq(2)
      .arr.num
      .incrementAll(1);
    expect(libState.currentAction).toEqual({
      type: 'arr.find.id.eq(2).arr.num.incrementAll()',
      by: 1
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