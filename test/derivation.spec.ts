import { createApplicationStore, derive } from '../src';
import { libState } from '../src/constant';

describe('derivation', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  // it('should support derivations', () => {
  //   const select = createApplicationStore({ num: 0, str: '', bool: false });
  //   const derivation = derive(
  //     select.num,
  //     select.str,
  //   ).with((num, str) => [num, str]);
  //   expect(derivation.read()).toEqual([0, '']);
  //   let changeCount = 0;
  //   derivation.onChange(() => changeCount++);
  //   select.bool.replace(true);
  //   expect(changeCount).toEqual(0);
  //   select.num.increment(1);
  //   expect(changeCount).toEqual(1);
  //   expect(derivation.read()).toEqual([1, '']);
  // })

  it('should support derivations', () => {
    const select = createApplicationStore({
      array: ['1', '2'],
      counter: 3,
    });
    const mem = derive(
      select.array,
      select.counter,
    ).with((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = mem.read();
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should cache correctly', () => {
    const select = createApplicationStore({
      array: new Array<string>(),
      counter: 3,
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = derive(
      select.array,
      select.counter,
    ).with((array, counter) => {
      recalculating++;
      let result = {
        array: new Array<string>(),
        counter: 0,
      };
      for (let i = 0; i < 10000; i++) {
        result.array.push('');
        result.counter = counter;
      }
      return result;
    });
    mem.onChange(() => eventReceived++);
    const result = mem.read();
    expect(result.array.length).toEqual(10000);
    const result2 = mem.read();
    expect(result2.array.length).toEqual(10000);
    expect(recalculating).toEqual(1);
    select.counter.replace(4);
    const result3 = mem.read();
    expect(recalculating).toEqual(2);
    expect(result3.counter).toEqual(4);
    expect(eventReceived).toEqual(1);
  })

  it('should emit events only when required', () => {
    const select = createApplicationStore({
      array: new Array<string>(),
      counter: 3,
      string: '',
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = derive(
      select.array,
      select.counter,
    ).with((array, counter) => {
      recalculating++;
    });
    mem.onChange(() => eventReceived++);
    select.string.replace('hey');
    expect(select.string.read()).toEqual('hey');
    expect(recalculating).toEqual(0);
    expect(eventReceived).toEqual(0);
    select.counter.replace(2);
    expect(eventReceived).toEqual(1);
  })

  it('should correctly unsubscribe', () => {
    const select = createApplicationStore({
      one: 'x',
      two: 0,
    });
    const mem = derive(
      select.one,
      select.two,
    ).with((one, two) => {
      return one + two;
    });
    let onChangeListenerCallCount = 0;
    const onChangeListener = mem.onChange(() => onChangeListenerCallCount++);
    select.two.replace(1);
    expect(mem.read()).toEqual('x1');
    expect(onChangeListenerCallCount).toEqual(1);
    onChangeListener.unsubscribe();
    select.two.replace(2);
    expect(mem.read()).toEqual('x2');
    expect(onChangeListenerCallCount).toEqual(1);
  })

  it('should derive on specific array element', () => {
    const select = createApplicationStore({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    let recalculating = 0;
    const mem = derive(
      select.array
        .find.id.eq(2)
    ).with(val => {
      recalculating++;
    });
    select.array
      .find.id.eq(2)
      .patch({ value: 'twoo' });
    mem.read();
    select.array
      .find.id.eq(1)
      .patch({ value: 'onee' });
    mem.read();
    expect(recalculating).toEqual(1);
  })

  it('should be able to derive from using a derivation as an argument', () => {
    const select = createApplicationStore({ num: 0, str: 'x' });
    let originalMemoCalcCount = 0;
    const mem = derive(
      select.num,
      select.str,
    ).with((num, str) => {
      originalMemoCalcCount++;
      return str + num;
    });
    const mem2 = derive(
      select.str,
      mem,
    ).with((s1, s2) => {
      return s1 + s2;
    });
    expect(mem2.read()).toEqual('xx0');
    expect(originalMemoCalcCount).toEqual(1);
  })

  it('should derive with a find', () => {
    const select = createApplicationStore({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    let memoCalcCount = 0;
    const mem = derive(
      select.array.find.id.eq(2),
    ).with(thing => {
      memoCalcCount++;
      return thing;
    });
    mem.read();
    mem.read();
    select.array.find.id.eq(1).patch({ value: 'xxx' });
    expect(memoCalcCount).toEqual(1);
    select.array.find.id.eq(2).patch({ value: 'xxx' });
    mem.read();
    expect(memoCalcCount).toEqual(2);
  })

  it('should derive with a filter', () => {
    const select = createApplicationStore({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    let memoCalcCount = 0;
    const mem = derive(
      select.array.filter.id.lte(2),
    ).with(thing => {
      memoCalcCount++;
      return thing;
    });
    mem.read();
    mem.read();
    expect(memoCalcCount).toEqual(1);
    select.array.find.id.eq(1).patch({ value: 'xxx' });
    mem.read();
    mem.read();
    expect(memoCalcCount).toEqual(2);
    select.array.find.id.eq(2).patch({ value: 'xxx' });
    mem.read();
    mem.read();
    expect(memoCalcCount).toEqual(3);
  })

  it('should invalidate a derivation', () => {
    const select = createApplicationStore({
      num: 0,
      str: '',
    });
    let memoCalcCount = 0;
    const mem = derive(
      select.num,
    ).with(thing => {
      memoCalcCount++;
      return thing;
    });
    mem.read();
    mem.read();
    expect(memoCalcCount).toEqual(1);
    mem.invalidate();
    mem.read();
    mem.read();
    expect(memoCalcCount).toEqual(2);
  })

});

