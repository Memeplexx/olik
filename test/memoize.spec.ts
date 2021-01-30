import { set, setEnforceTags } from '../src/core';
import { deriveFrom } from '../src/memoization';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Memoize', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should deriveFrom() corrrectly', () => {
    const get = set({
      array: ['1', '2'],
      counter: 3,
    });
    const mem = deriveFrom(
      get(s => s.array),
      get(s => s.counter),
    ).usingExpensiveCalc((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = mem.read();
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should deriveFrom() and cache correctly', () => {
    const get = set({
      array: new Array<string>(),
      counter: 3,
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = deriveFrom(
      get(s => s.array),
      get(s => s.counter)
    ).usingExpensiveCalc((array, counter) => {
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
    get(s => s.counter).replace(4);
    const result3 = mem.read();
    expect(recalculating).toEqual(2);
    expect(result3.counter).toEqual(4);
    expect(eventReceived).toEqual(1);
  })

  it('should deriveFrom() and emit events only when required', () => {
    const get = set({
      array: new Array<string>(),
      counter: 3,
      string: '',
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = deriveFrom(
      get(s => s.array),
      get(s => s.counter)
    ).usingExpensiveCalc((array, counter) => {
      recalculating++;
    });
    mem.onChange(() => eventReceived++);
    get(s => s.string).replace('hey');
    expect(get(s => s.string).read()).toEqual('hey');
    expect(recalculating).toEqual(0);
    expect(eventReceived).toEqual(0);
    get(s => s.counter).replace(2);
    expect(eventReceived).toEqual(1);
  })

  it('should deriveFrom() and correctly unsubscribe', () => {
    const get = set({
      one: 'x',
      two: 0,
    });
    const mem = deriveFrom(
      get(s => s.one),
      get(s => s.two)
    ).usingExpensiveCalc((one, two) => {
      return one + two;
    });
    let onChangeListenerCallCount = 0;
    const onChangeListener = mem.onChange(() => onChangeListenerCallCount++);
    get(s => s.two).replace(1);
    expect(mem.read()).toEqual('x1');
    expect(onChangeListenerCallCount).toEqual(1);
    onChangeListener.unsubscribe();
    get(s => s.two).replace(2);
    expect(mem.read()).toEqual('x2');
    expect(onChangeListenerCallCount).toEqual(1);
  })

  it('should deriveFrom() on specific array element', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    let recalculating = 0;
    const mem = deriveFrom(
      get(s => s.array).findCustom(e => e.id === 2)
    ).usingExpensiveCalc(val => {
      recalculating++;
    });
    get(s => s.array.find(e => e.id === 2)!).patch({ value: 'twoo' });
    mem.read();
    get(s => s.array.find(e => e.id === 1)!).patch({ value: 'onee' });
    mem.read();
    expect(recalculating).toEqual(1);
  })

  it('should deriveFrom() using dispatcher tags', () => {
    const get = setEnforceTags({
      array: ['1', '2'],
      counter: 3,
    });
    const mem = deriveFrom(
      get(s => s.array),
      get(s => s.counter),
    ).usingExpensiveCalc((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = mem.read();
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should be able to derive from using a derivation as an argument', () => {
    const get = set({ num: 0, str: 'x' });
    let originalMemoCalcCount = 0;
    const mem = deriveFrom(
      get(s => s.num),
      get(s => s.str),
    ).usingExpensiveCalc((num, str) => {
      originalMemoCalcCount++;
      return str + num;
    });
    const mem2 = deriveFrom(
      get(s => s.str),
      mem,
    ).usingExpensiveCalc((s1, s2) => {
      return s1 + s2;
    });
    expect(mem2.read()).toEqual('xx0');
    expect(originalMemoCalcCount).toEqual(1);
  })

  it('should deriveFrom() including a filter()', () => {
    const get = set({
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    });
    let memoCalcCount = 0;
    const mem = deriveFrom(
      get(s => s.array).find(e => e.id).eq(2),
    ).usingExpensiveCalc(thing => {
      memoCalcCount++;
      return thing;
    });
    mem.read();
    mem.read();
    get(s => s.array).find(e => e.id).eq(1).patch({ value: 'xxx' });
    expect(memoCalcCount).toEqual(1);
    get(s => s.array).find(e => e.id).eq(2).patch({ value: 'xxx' });
    mem.read();
    expect(memoCalcCount).toEqual(2);
  })

});