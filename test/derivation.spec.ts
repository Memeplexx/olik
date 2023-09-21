import { testState } from '../src';
import { createInnerStore, createStore } from '../src/core';
import { derive } from '../src/derive';
import { resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';

beforeEach(() => {
  resetLibraryState();
})

test('should support derivations', () => {
  const state = {
    array: ['1', '2'],
    counter: 3,
  };
  const store = createStore(state);
  const mem = derive(
    store.array,
    store.counter,
  ).$withSync((arr, counter) => {
    return arr.concat(counter.toString())
  });
  const result = mem.$state;
  expect(result).toEqual(['1', '2', '3']);
})

test('should cache correctly', () => {
  const state = {
    array: new Array<string>(),
    counter: 3,
  };
  const store = createStore(state);
  let recalculating = 0;
  let eventReceived = 0;
  const mem = derive(
    store.array,
    store.counter,
  ).$withSync((_, counter) => {
    recalculating++;
    const result = {
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
  store.counter.$set(4);
  const result3 = mem.$state;
  expect(recalculating).toEqual(2);
  expect(result3.counter).toEqual(4);
  expect(eventReceived).toEqual(1);
})

test('should emit events only when required', () => {
  const state = {
    array: new Array<string>(),
    counter: 3,
    string: '',
  };
  const store = createStore(state);
  let recalculating = 0;
  let eventReceived = 0;
  const mem = derive(
    store.array,
    store.counter,
  ).$withSync(() => {
    recalculating++;
    return '';
  });
  mem.$onChange(() => eventReceived++);
  store.string.$set('hey');
  expect(store.string.$state).toEqual('hey');
  expect(recalculating).toEqual(0);
  expect(eventReceived).toEqual(0);
  store.counter.$set(2);
  expect(eventReceived).toEqual(1);
})

test('should correctly unsubscribe', () => {
  const state = {
    one: 'x',
    two: 0,
  };
  const store = createStore(state);
  const mem = derive(
    store.one,
    store.two,
  ).$withSync((one, two) => {
    return one + two;
  });
  let onChangeListenerCallCount = 0;
  const onChangeListener = mem.$onChange(() => onChangeListenerCallCount++);
  store.two.$set(1);
  expect(mem.$state).toEqual('x1');
  expect(onChangeListenerCallCount).toEqual(1);
  onChangeListener.unsubscribe();
  store.two.$set(2);
  expect(mem.$state).toEqual('x2');
  expect(onChangeListenerCallCount).toEqual(1);
})

test('should derive on specific array element', () => {
  const state = {
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    object: { hello: 'world' },
  };
  const store = createStore(state);
  let recalculating = 0;
  const mem = derive(
    store.array
      .$find.id.$eq(2)
  ).$withSync(() => {
    recalculating++;
    return '';
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

test('should be able to derive from using a derivation as an argument', () => { ///////// DOUBLE CHECK
  const state = { num: 0, str: 'x' };
  const store = createStore(state);
  let originalMemoCalcCount = 0;
  const mem = derive(
    store.num,
    store.str,
  ).$withSync((num, str) => {
    originalMemoCalcCount++;
    return str + num;
  });
  const mem2 = derive(
    store.str,
    mem,
  ).$with((s1, s2) => {
    return s1 + s2;
  });
  expect(mem2.$state).toEqual('xx0');
  expect(originalMemoCalcCount).toEqual(1);
})

test('should derive with a find', () => {
  const state = {
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };
  const store = createStore(state);
  let memoCalcCount = 0;
  const mem = derive(
    store.array.$find.id.$eq(2),
  ).$withSync(thing => {
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

test('should derive with a filter', () => {
  const state = {
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };
  const store = createStore(state);
  let memoCalcCount = 0;
  const mem = derive(
    store.array.$filter.id.$lte(2),
  ).$withSync(thing => {
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

test('should invalidate a derivation', () => {
  const store = createStore({
    num: 0,
    str: '',
  });
  let memoCalcCount = 0;
  const mem = derive(
    store.num,
  ).$withSync(thing => {
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
  testState.logLevel = 'none';
})

test('should share derivations via cache', () => {
  const store = createStore({
    str: 'a',
    num: 1,
  });
  let memoCalcCount = 0;
  const derivationFunctionShared = (num: number, str: string) => {
    memoCalcCount++;
    return str + num;
  }

  let derivationChangeCount1 = 0;
  derive(
    store.num,
    store.str,
  ).$withSync(
    derivationFunctionShared
  ).$onChange(() => derivationChangeCount1++);

  let derivationChangeCount2 = 0;
  derive(
    store.num,
    store.str,
  ).$withSync(
    derivationFunctionShared
  ).$onChange(() => derivationChangeCount2++);

  store.num.$add(1);

  expect(memoCalcCount).toEqual(1);
  expect(derivationChangeCount1).toEqual(1);
  expect(derivationChangeCount2).toEqual(1);
})

test('should cache results when derive() is called repeatedly', () => {
  const store = createStore({
    str: 'a',
    num: 1,
  });
  let memoCalcCount = 0;
  let derivationChangeCount1 = 0;
  const d1 = () => {
    derive(
      store.num,
      store.str,
    ).$withSync((num: number, str: string) => {
      memoCalcCount++;
      return str + num;
    }).$onChange(() => derivationChangeCount1++);
  }
  d1();
  d1();
  d1();
  store.num.$add(1);
  expect(memoCalcCount).toEqual(1);
})

test('should create cache keys correctly', () => {
  const store = createStore({
    str: 'a',
    obj: { num: 1 }
  })
  const childStore = createInnerStore({ inner: { val: 0 } }).usingAccessor(s => s.inner);
  const parentDerivation = derive(
    store.str,
    store.obj.num,
  ).$withSync((str, num) => {
    return str + num;
  })
  const childDerivation = derive(
    parentDerivation,
    childStore.val,
  ).$withSync((derivation, val) => {
    return derivation + val
  })
  expect(childDerivation.$state).toEqual('a10');
  expect((childDerivation as unknown as { $cacheKey: string }).$cacheKey)
    .toEqual([ { state: 'a1', path: 'str|obj.num' }, { state: 0, path: 'inner.val' } ])
})

test('should create cache keys correctly with a find()', () => {
  const store = createStore({
    str: 'a',
    obj: { things: [{ id: 1, name: 'one' }] }
  })
  const childStore = createInnerStore({ inner: { val: 0 } }).usingAccessor(s => s.inner);
  const parentDerivation = derive(
    store.str,
    store.obj.things.$find.id.$eq(1).name,
  ).$withSync((str, num) => {
    return str + num;
  })
  const childDerivation = derive(
    parentDerivation,
    childStore.val,
  ).$withSync((derivation, val) => {
    return derivation + val
  })
  expect(childDerivation.$state).toEqual('aone0');
  expect((childDerivation as unknown as { $cacheKey: string }).$cacheKey)
    .toEqual([ { state: 'aone', path: 'str|obj.things.$find.id.$eq(1).name' }, { state: 0, path: 'inner.val' } ])
})

test('should create cache keys correctly with a filter()', () => {
  const store = createStore({
    str: 'a',
    obj: { things: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 } ] }
  })
  const childStore = createInnerStore({ inner: { val: 0 } }).usingAccessor(s => s.inner);
  const parentDerivation = derive(
    store.str,
    store.obj.things.$filter.id.$lt(3).id,
  ).$withSync((str, things) => {
    return str + things.join('-');
  })
  const childDerivation = derive(
    parentDerivation,
    childStore.val,
  ).$withSync((derivation, val) => {
    return derivation + val
  })
  expect(childDerivation.$state).toEqual('a1-20');
  expect((childDerivation as unknown as { $cacheKey: string }).$cacheKey)
    .toEqual([ { state: 'a1-2', path: 'str|obj.things.$filter.id.$lt(3).id' }, { state: 0, path: 'inner.val' } ])
})

test('should work with async', async () => {
  const store = createStore({
    num: 0,
    str: ''
  });
  let calcCount = 0;
  let changeCount = 0;
  const derivation = derive(
    store.num,
    store.str,
  ).$with((num, str) => {
    calcCount++;
    return str + num;
  });
  derivation.$onChange(() => {
    changeCount++;
  });
  store.num.$add(1);
  store.str.$set('x');
  store.str.$set('y');
  store.str.$set('z');
  await Promise.resolve();
  expect(calcCount).toEqual(1);
  expect(changeCount).toEqual(1);
  expect(derivation.$state).toEqual('z1');
  store.num.$add(1);
  store.str.$set('p');
  store.num.$add(1);
  await Promise.resolve();
  expect(calcCount).toEqual(2);
  expect(changeCount).toEqual(2);
  expect(derivation.$state).toEqual('p3');
})

