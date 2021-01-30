import { errorMessages } from '../src/consts';
import { set, setNested } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Nested', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should attach a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    const initialStateComp = {
      one: ''
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    setNested(initialStateComp, { name });
    expect(get().read()).toEqual({ ...initialState, nested: { [name]: { 0: initialStateComp } } });
  })

  it('should revert to a top-level store correctly', () => {
    const get = set({ test: '' });
    const nested = setNested({ test: '' }, { name: 'nested' });
    nested(s => s.test).replace('test');
    expect(get().read()).toEqual({ test: '' });
    expect(nested().read()).toEqual({ test: 'test' });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = setNested({ one: '' }, { name });
    expect(nestedStore(s => s.one).read()).toEqual('');
    nestedStore(s => s.one).replace('test');
    expect(tests.currentAction.type).toEqual(`nested.${name}.0.one.replace()`);
    expect(nestedStore(s => s.one).read()).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = setNested({ one: '' }, { name });
    expect(nestedStore(s => s.one).read()).toEqual('');
    get(s => s.nested.myComp['0'].one).replace('test');
    expect(nestedStore(s => s.one).read()).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = setNested({ one: '' }, { name });
    expect(get().read()).toEqual({ test: '', nested: { [name]: { 0: { one: '' } } } });
    nestedStore().removeFromContainingStore();
    expect(get().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore1 = setNested({ one: '' }, { name });
    const nestedStore2 = setNested({ one: '' }, { name });
    expect(get().read()).toEqual({ test: '', nested: { [name]: { '0': { one: '' }, '1': { one: '' } } } });
    nestedStore1().removeFromContainingStore();
    expect(get().read()).toEqual({ test: '', nested: { [name]: { '1': { one: '' } } } });
    nestedStore2().removeFromContainingStore();
    expect(get().read()).toEqual({ test: '', nested: { } });
  })

  it('should be able to perform an update on a second nested store', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = setNested({ one: '' }, { name });
    nestedStore(s => s.one).replace('test1');
    const nestedStore2 = setNested({ one: '' }, { name });
    nestedStore2(s => s.one).replace('test2');
    expect(get().read()).toEqual({ test: '', nested: { [name]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = setNested(new Array<string>(), { name });
    nestedStore().insert('test');
    expect(get().read()).toEqual({ test: '', nested: { [name]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = setNested(0, { name });
    nestedStore().replace(1);
    expect(get().read()).toEqual({ test: '', nested: { [name]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    setNested(0, { name });
    const name2 = 'myComp2';
    setNested(0, { name: name2 });
    expect(get().read()).toEqual({ test: '', nested: { [name]: { 0: 0 }, [name2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    expect(() => set(0, { containerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    expect(() => set(new Array<string>(), { containerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should be able to generate custom keys using a function', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const storeKey = (arg?: string): string => !arg ? 'x' : arg + 'x';
    setNested(0, { name, storeKey });
    setNested(0, { name, storeKey });
    setNested(0, { name, storeKey });
    expect(get().read()).toEqual({ test: '', nested: { [name]: { x: 0, xx: 0, xxx: 0 } } });
  })

  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    setNested(0, { name });
    const name2 = 'myComp2';
    setNested(0, { name: name2 });
    get().reset();
    expect(get().read()).toEqual(initialState);
  })

  it('should be able to reset the state of a nested store', () => {
    const initialState = {
      test: '',
    };
    interface X {
      test: string
    }
    const get = set<X>(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nested = setNested(0, { name });
    nested().replace(1);
    expect(get().read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested().reset();
    expect(get().read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested().read()).toEqual(0);
    get().reset();
  })

});