import { testState } from '../src/constant';
import { createStore } from '../src/core';
import { derive } from '../src/derive';

describe('derivation', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should support derivations', () => {
    const state = {
      array: ['1', '2'],
      counter: 3,
    };
    const store = createStore({ name, state });
    const mem = derive(
      store.array,
      store.counter,
    ).with((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = mem.$state;
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should cache correctly', () => {
    const state = {
      array: new Array<string>(),
      counter: 3,
    };
    const store = createStore({ name, state });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = derive(
      store.array,
      store.counter,
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
    mem.$onChange(() => eventReceived++);
    const result = mem.$state;
    expect(result.array.length).toEqual(10000);
    const result2 = mem.$state;
    expect(result2.array.length).toEqual(10000);
    expect(recalculating).toEqual(1);
    store.counter.$replace(4);
    const result3 = mem.$state;
    expect(recalculating).toEqual(2);
    expect(result3.counter).toEqual(4);
    expect(eventReceived).toEqual(1);
  })

  it('should emit events only when required', () => {
    const state = {
      array: new Array<string>(),
      counter: 3,
      string: '',
    };
    const store = createStore({ name, state });
    let recalculating = 0;
    let eventReceived = 0;
    const mem = derive(
      store.array,
      store.counter,
    ).with((array, counter) => {
      recalculating++;
    });
    mem.$onChange(() => eventReceived++);
    store.string.$replace('hey');
    expect(store.string.$state).toEqual('hey');
    expect(recalculating).toEqual(0);
    expect(eventReceived).toEqual(0);
    store.counter.$replace(2);
    expect(eventReceived).toEqual(1);
  })

  it('should correctly unsubscribe', () => {
    const state = {
      one: 'x',
      two: 0,
    };
    const store = createStore({ name, state });
    const mem = derive(
      store.one,
      store.two,
    ).with((one, two) => {
      return one + two;
    });
    let onChangeListenerCallCount = 0;
    const onChangeListener = mem.$onChange(() => onChangeListenerCallCount++);
    store.two.$replace(1);
    expect(mem.$state).toEqual('x1');
    expect(onChangeListenerCallCount).toEqual(1);
    onChangeListener.unsubscribe();
    store.two.$replace(2);
    expect(mem.$state).toEqual('x2');
    expect(onChangeListenerCallCount).toEqual(1);
  })

  it('should derive on specific array element', () => {
    const state = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { hello: 'world' },
    };
    const store = createStore({ name, state });
    let recalculating = 0;
    const mem = derive(
      store.array
        .$find.id.$eq(2)
    ).with(val => {
      recalculating++;
    });
    store.array
      .$find.id.$eq(2)
      .$patch({ value: 'twoo' });
    mem.$state;
    store.array
      .$find.id.$eq(1)
      .$patch({ value: 'onee' });
    mem.$state;
    expect(recalculating).toEqual(1);
  })

  it('should be able to derive from using a derivation as an argument', () => {
    const state = { num: 0, str: 'x' };
    const store = createStore({ name, state });
    let originalMemoCalcCount = 0;
    const mem = derive(
      store.num,
      store.str,
    ).with((num, str) => {
      originalMemoCalcCount++;
      return str + num;
    });
    const mem2 = derive(
      store.str,
      mem,
    ).with((s1, s2) => {
      return s1 + s2;
    });
    expect(mem2.$state).toEqual('xx0');
    expect(originalMemoCalcCount).toEqual(1);
  })

  it('should derive with a find', () => {
    const state = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = createStore({ name, state });
    let memoCalcCount = 0;
    const mem = derive(
      store.array.$find.id.$eq(2),
    ).with(thing => {
      memoCalcCount++;
      return thing;
    });
    mem.$state;
    mem.$state;
    store.array.$find.id.$eq(1).$patch({ value: 'xxx' });
    expect(memoCalcCount).toEqual(1);
    store.array.$find.id.$eq(2).$patch({ value: 'xxx' });
    mem.$state;
    expect(memoCalcCount).toEqual(2);
  })

  it('should derive with a filter', () => {
    const state = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = createStore({ name, state });
    let memoCalcCount = 0;
    const mem = derive(
      store.array.$filter.id.$lte(2),
    ).with(thing => {
      memoCalcCount++;
      return thing;
    });
    mem.$state;
    mem.$state;
    expect(memoCalcCount).toEqual(1);
    store.array.$find.id.$eq(1).$patch({ value: 'xxx' });
    mem.$state;
    mem.$state;
    expect(memoCalcCount).toEqual(2);
    store.array.$find.id.$eq(2).$patch({ value: 'xxx' });
    mem.$state;
    mem.$state;
    expect(memoCalcCount).toEqual(3);
  })

  it('should invalidate a derivation', () => {
    const state = {
      num: 0,
      str: '',
    };
    const store = createStore({ name, state });
    let memoCalcCount = 0;
    const mem = derive(
      store.num,
    ).with(thing => {
      memoCalcCount++;
      return thing;
    });
    mem.$state;
    mem.$state;
    expect(memoCalcCount).toEqual(1);
    mem.$invalidate();
    mem.$state;
    mem.$state;
    expect(memoCalcCount).toEqual(2);
  })

});

