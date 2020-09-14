import { deriveFrom, make } from '../src/core';

describe('Memoize', () => {

  it('should deriveFrom() corrrectly', () => {
    const getStore = make('store', {
      array: ['1', '2'],
      counter: 3,
    });
    const eee = deriveFrom(
      getStore(s => s.array),
      getStore(s => s.counter),
    ).usingExpensiveCalc((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = eee.read();
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should deriveFrom() and cache correctly', () => {
    const getStore = make('store', {
      array: new Array<string>(),
      counter: 3,
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = deriveFrom(
      getStore(s => s.array),
      getStore(s => s.counter)
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
    getStore(s => s.counter).replaceWith(4);
    const result3 = mem.read();
    expect(recalculating).toEqual(2);
    expect(result3.counter).toEqual(4);
    expect(eventReceived).toEqual(1);
  })

  it('should deriveFrom() and emit events only when required', () => {
    const getStore = make('store', {
      array: new Array<string>(),
      counter: 3,
      string: '',
    });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = deriveFrom(
      getStore(s => s.array),
      getStore(s => s.counter)
    ).usingExpensiveCalc((array, counter) => {
      recalculating++;
    });
    mem.onChange(() => eventReceived++);
    getStore(s => s.string).replaceWith('hey');
    expect(getStore(s => s.string).read()).toEqual('hey');
    expect(recalculating).toEqual(0);
    expect(eventReceived).toEqual(0);
    getStore(s => s.counter).replaceWith(2);
    expect(eventReceived).toEqual(1);
  })

  it('should deriveFrom() and correctly unsubscribe', () => {
    const getStore = make('store', {
      one: 'x',
      two: 0,
    });
    const mem = deriveFrom(
      getStore(s => s.one),
      getStore(s => s.two)
    ).usingExpensiveCalc((one, two) => {
      return one + two;
    });
    let onChangeListenerCallCount = 0;
    const onChangeListener = mem.onChange(() => onChangeListenerCallCount++);
    getStore(s => s.two).replaceWith(1);
    expect(mem.read()).toEqual('x1');
    expect(onChangeListenerCallCount).toEqual(1);
    onChangeListener.unsubscribe();
    getStore(s => s.two).replaceWith(2);
    expect(mem.read()).toEqual('x2');
    expect(onChangeListenerCallCount).toEqual(1);
  })

});