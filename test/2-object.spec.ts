
import { createApplicationStore, libState } from '../src/index';

describe('Object', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should replace a primitive', () => {
    const select = createApplicationStore({ prop: 0, prop2: '' });
    const stateBefore = select.read();
    select.prop
      .replace(1);
    const stateAfter = select.read();
    expect(stateBefore).not.toEqual(stateAfter);
    expect(stateBefore.prop2).toEqual(stateAfter.prop2);
    expect(stateBefore.prop).not.toEqual(stateAfter.prop);
    expect(stateAfter.prop).toEqual(1);
  })

  it('should increment a primitive', () => {
    const select = createApplicationStore({ prop: 0, prop2: '' });
    select.prop
      .increment(1);
    expect(select.read().prop).toEqual(1);
    select.prop.increment(2);
    expect(select.read().prop).toEqual(3);
  })

  it('should find an element from an array of primitives and then remove it', () => {
    const select = createApplicationStore({ arr: [1, 2, 3, 4, 5], });
    select.arr
      .find.eq(3)
      .remove();
    expect(select.arr.read()).toEqual([1, 2, 4, 5]);
  })

  it('should find an element from an array of primitives and then replace it', () => {
    const select = createApplicationStore({ arr: [1, 2, 3, 4, 5], });
    select.arr
      .find.eq(3)
      .replace(6);
    expect(select.arr.read()).toEqual([1, 2, 6, 4, 5]);

    // console.log(select.arr.find.eq(3).read()); // returns undefined!
  })

  it('should find an element from an array of primitives and then increment it', () => {
    const select = createApplicationStore({ arr: [1, 2, 3, 4, 5], });
    select.arr
      .find.eq(3)
      .replace(6);
    expect(select.arr.read()).toEqual([1, 2, 6, 4, 5]);
  })

  it('should find then remove an array element which is an object', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: 'one' }, { id: 2, val: 'two' }], obj: { num: 0 } });
    const stateBefore = select.read();
    select.arr
      .find.id.eq(1)
      .remove();
    const stateAfter = select.read();
    expect(stateBefore).not.toEqual(stateAfter);
    expect(stateBefore.obj).toEqual(stateAfter.obj)
    expect(stateAfter.arr).toEqual([{ id: 2, val: 'two' }]);
  })

  it('should select.arr.find.id.eq(2).patch({ val: 1 })', () => {
    const init = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const select = createApplicationStore(init);
    const stateBefore = select.read();
    select.arr
      .find.id.eq(2)
      .patch({ val: 1 });
    const stateAfter = select.read();
    expect(stateBefore).not.toEqual(stateAfter);
    expect(stateBefore.obj).toEqual(stateAfter.obj);
    expect(stateBefore.arr).not.toEqual(stateAfter.arr);
    expect(select.arr.find.id.eq(1).read()).toEqual(stateBefore.arr.find(e => e.id === 1));
    expect(select.arr.find.id.eq(2).val.read()).toEqual(1);
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

  it('____', () => {
    const init = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const select = createApplicationStore(init);
    const stateBefore = select.read();
    select.arr
      .find.id.eq(2).val
      .replace(1);
    // console.log(select.read());
  });

  it('____', () => {
    const init = { arr: [{ id: 1, val: 0, arr: [{ id: 1, num: 1 }] }, { id: 2, val: 0, arr: [{ id: 1, num: 1 }] }], obj: { num: 0 } };
    const select = createApplicationStore(init);
    const stateBefore = select.read();
    select.arr
      .find.id.eq(2)
      .arr.find.id.eq(1).num
      .replace(9);
    console.log(JSON.stringify(select.read()));
    // console.log(select.arr.find.id.eq(2).arr.find.id.eq(1).num.read());

    // todos.filter.status.eq('todo').status.replace('done');
  });

});
