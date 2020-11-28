import { errorMessages } from '../src/consts';
import { make, makeNested } from '../src/core';
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
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    makeNested(initialStateComp, { name });
    expect(store().read()).toEqual({ ...initialState, nested: { [name]: { 0: initialStateComp } } });
  })

  it('should revert to a top-level store correctly', () => {
    const store = make({ test: '' });
    const nested = makeNested({ test: '' }, { name: 'nested' });
    expect(store().read()).toEqual({ test: '' });
    expect(nested().read()).toEqual({ test: '' });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested({ one: '' }, { name });
    expect(nestedStore(s => s.one).read()).toEqual('');
    nestedStore(s => s.one).replaceWith('test');
    expect(tests.currentAction.type).toEqual(`nested.${name}.0.one.replaceWith()`);
    expect(nestedStore(s => s.one).read()).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested({ one: '' }, { name });
    expect(nestedStore(s => s.one).read()).toEqual('');
    store(s => s.nested.myComp['0'].one).replaceWith('test');
    expect(nestedStore(s => s.one).read()).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested({ one: '' }, { name });
    expect(store().read()).toEqual({ test: '', nested: { [name]: { 0: { one: '' } } } });
    nestedStore().removeFromContainingStore();
    expect(store().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested({ one: '' }, { name });
    const nestedStore2 = makeNested({ one: '' }, { name });
    expect(store().read()).toEqual({ test: '', nested: { [name]: { '0': { one: '' }, '1': { one: '' } } } });
    nestedStore().removeFromContainingStore();
    expect(store().read()).toEqual({ test: '', nested: { [name]: { '1': { one: '' } } } });
    nestedStore2().removeFromContainingStore();
    expect(store().read()).toEqual({ test: '', nested: { } });
  })

  it('should be able to perform an update on a second nested store', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested({ one: '' }, { name });
    nestedStore(s => s.one).replaceWith('test1');
    const nestedStore2 = makeNested({ one: '' }, { name });
    nestedStore2(s => s.one).replaceWith('test2');
    expect(store().read()).toEqual({ test: '', nested: { [name]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested(new Array<string>(), { name });
    nestedStore().addAfter('test');
    expect(store().read()).toEqual({ test: '', nested: { [name]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested(0, { name });
    nestedStore().replaceWith(1);
    expect(store().read()).toEqual({ test: '', nested: { [name]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested(0, { name });
    const name2 = 'myComp2';
    const nestedStore2 = makeNested(0, { name: name2 });
    expect(store().read()).toEqual({ test: '', nested: { [name]: { 0: 0 }, [name2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    expect(() => make(0, { containerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    expect(() => make(new Array<string>(), { containerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should be able to generate custom keys using a function', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const storeKey = (arg?: string): string => !arg ? 'x' : arg + 'x';
    makeNested(0, { name, storeKey });
    makeNested(0, { name, storeKey });
    makeNested(0, { name, storeKey });
    expect(store().read()).toEqual({ test: '', nested: { [name]: { x: 0, xx: 0, xxx: 0 } } });
  })

  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    makeNested(0, { name });
    const name2 = 'myComp2';
    makeNested(0, { name: name2 });
    store().reset();
    expect(store().read()).toEqual(initialState);
  })

  it('should be able to reset the state of a nested store', () => {
    const initialState = {
      test: '',
    };
    interface X {
      test: string
    }
    const store = make<X>(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nested = makeNested(0, { name });
    nested().replaceWith(1);
    expect(store().read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested().reset();
    expect(store().read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested().read()).toEqual(0);
    store().reset();
  })

});