
import { createStore } from '../src/index';
import { libState, testState } from '../src/constant';

describe('Object', () => {

  const state = { num: 0, str: '', bool: false };
  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should replace an object property', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.num
      .replace(payload);
    expect(libState.currentAction).toEqual({ type: 'num.replace()', payload });
    expect(select.num.read()).toEqual(1);
  })

  it('should patch an object', () => {
    const select = createStore({ name, state });
    const payload = { bool: true, str: 'x' };
    select.patch({ bool: true, str: 'x' });
    expect(libState.currentAction).toEqual({ type: 'patch()', payload });
    expect(select.read()).toEqual({ ...state, ...payload });
  })

  it('should deep merge an object', () => {
    const state = { num: 0, obj: { num: 0, str: '', arr: [{ id: 1, num: 1 }] } };
    const select = createStore({ name, state });
    select.deepMerge({ num: 9, str: 'x', obj: { xxx: '', arr: [{ fff: 's' }] } });
    expect(select.read()).toEqual({ num: 9, str: 'x', obj: { xxx: '', arr: [{ fff: 's' }], num: 0, str: '' } });
  })

  it('should increment an object property', () => {
    const select = createStore({ name, state });
    const payload = 1;
    select.num
      .increment(payload);
    expect(libState.currentAction).toEqual({ type: 'num.increment()', payload });
    expect(select.num.read()).toEqual(1);
  })

  it('should remove an object property', () => {
    const select = createStore({ name, state });
    select.num
      .remove();
    expect(select.read()).toEqual({ str: '', bool: false });
  })


  it('', () => {
    const state = { num1: 0, num2: 0 };
    const select = createStore({ name, state });
    let rootChangeCount = 0;
    let num1ChangeCount = 0;
    let num2ChangeCount = 0;
    select.onChange(() => rootChangeCount++);
    const l1 = select.num1.onChange(() => num1ChangeCount++);
    select.num2.onChange(() => num2ChangeCount++);
    select.num1.increment(1);
    expect(num1ChangeCount).toEqual(1);
    expect(num2ChangeCount).toEqual(0);
    select.num2.increment(2);
    expect(num1ChangeCount).toEqual(1);
    expect(num2ChangeCount).toEqual(1);
    expect(rootChangeCount).toEqual(2);
    l1.unsubscribe();
    select.num1.increment(1);
    expect(num1ChangeCount).toEqual(1);
  })

  it('', () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
    const select = createStore({ name, state });
    let changeCount = 0;
    select.arr.find.id.eq(1).onChange(() => changeCount++);
    select.arr.find.id.eq(2).num.increment(1);
    expect(changeCount).toEqual(0);
    select.arr.find.id.eq(1).num.increment(1);
    expect(changeCount).toEqual(1);
  })

  it('', () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
    const select = createStore({ name, state });
    expect(select.arr.filter.id.eq(1).or.num.eq(2).id.read()).toEqual([1, 2]);
  })

  it('', () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
    const select = createStore({ name, state });
    select.arr
      .filter.id.eq(1).or.num.eq(2)
      .id.increment(1);
    expect(select.arr.read()).toEqual([{ id: 2, num: 1 }, { id: 3, num: 2 }]);
  })

  it('', () => {
    const state = { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] };
    const select = createStore({ name, state });
    select.arr.patchAll({ num: 9 });
    expect(select.arr.read()).toEqual([{ id: 1, num: 9 }, { id: 2, num: 9 }]);
  });

});
