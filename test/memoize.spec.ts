import { make, makeEnforceTags } from '../src/core';
import { deriveFrom } from '../src/memoization';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Memoize', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should deriveFrom() corrrectly', () => {
    const store = make('store', {
      array: ['1', '2'],
      counter: 3,
    });
    const mem = deriveFrom(
      store(s => s.array),
      store(s => s.counter),
    ).usingExpensiveCalc((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = mem.read();
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should deriveFrom() and cache correctly', () => {
    const store = make('store', {
      array: new Array<string>(),
      counter: 3,
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = deriveFrom(
      store(s => s.array),
      store(s => s.counter)
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
    store(s => s.counter).replaceWith(4);
    const result3 = mem.read();
    expect(recalculating).toEqual(2);
    expect(result3.counter).toEqual(4);
    expect(eventReceived).toEqual(1);
  })

  it('should deriveFrom() and emit events only when required', () => {
    const store = make('store', {
      array: new Array<string>(),
      counter: 3,
      string: '',
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = deriveFrom(
      store(s => s.array),
      store(s => s.counter)
    ).usingExpensiveCalc((array, counter) => {
      recalculating++;
    });
    mem.onChange(() => eventReceived++);
    store(s => s.string).replaceWith('hey');
    expect(store(s => s.string).read()).toEqual('hey');
    expect(recalculating).toEqual(0);
    expect(eventReceived).toEqual(0);
    store(s => s.counter).replaceWith(2);
    expect(eventReceived).toEqual(1);
  })

  it('should deriveFrom() and correctly unsubscribe', () => {
    const store = make('store', {
      one: 'x',
      two: 0,
    });
    const mem = deriveFrom(
      store(s => s.one),
      store(s => s.two)
    ).usingExpensiveCalc((one, two) => {
      return one + two;
    });
    let onChangeListenerCallCount = 0;
    const onChangeListener = mem.onChange(() => onChangeListenerCallCount++);
    store(s => s.two).replaceWith(1);
    expect(mem.read()).toEqual('x1');
    expect(onChangeListenerCallCount).toEqual(1);
    onChangeListener.unsubscribe();
    store(s => s.two).replaceWith(2);
    expect(mem.read()).toEqual('x2');
    expect(onChangeListenerCallCount).toEqual(1);
  })

  it('should deriveFrom() on specific array element', () => {
    const store = make('store', {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    });
    let recalculating = 0;
    const mem = deriveFrom(
      store(s => s.array.find(e => e.id === 2))
    ).usingExpensiveCalc(val => {
      recalculating++;
    });
    store(s => s.array.find(e => e.id === 2)!).patchWith({ value: 'twoo' });
    mem.read();
    store(s => s.array.find(e => e.id === 1)!).patchWith({ value: 'onee' });
    mem.read();
    expect(recalculating).toEqual(1);
  })

  it('should deriveFrom() using dispatcher tags', () => {
    const store = makeEnforceTags('store', {
      array: ['1', '2'],
      counter: 3,
    });
    const mem = deriveFrom(
      store(s => s.array),
      store(s => s.counter),
    ).usingExpensiveCalc((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = mem.read();
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should be able to derive from using a derivation as an argument', () => {
    const store = make('my store', { num: 0, str: 'x' });
    let originalMemoCalcCount = 0;
    const mem = deriveFrom(
      store(s => s.num),
      store(s => s.str),
    ).usingExpensiveCalc((num, str) => {
      originalMemoCalcCount++;
      return str + num;
    });
    const mem2 = deriveFrom(
      store(s => s.str),
      mem,
    ).usingExpensiveCalc((s1, s2) => {
      return s1 + s2;
    });
    expect(mem2.read()).toEqual('xx0');
    expect(originalMemoCalcCount).toEqual(1);
  })

});