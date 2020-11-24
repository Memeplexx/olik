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
      nested: {},
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested({ one: '' }, { name });
    expect(store().read()).toEqual({ test: '', nested: { [name]: { 0: { one: '' } } } });
    nestedStore().stopTracking();
    expect(store().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    const store = make(initialState, { containerForNestedStores: true });
    const name = 'myComp';
    const nestedStore = makeNested({ one: '' }, { name });
    const nestedStore2 = makeNested({ one: '' }, { name });
    expect(store().read()).toEqual({ test: '', nested: { myComp: { '0': { one: '' }, '1': { one: '' } } } });
    nestedStore().stopTracking();
    expect(store().read()).toEqual({ test: '', nested: { myComp: { '1': { one: '' } } } });
    nestedStore2().stopTracking();
    expect(store().read()).toEqual({ test: '', nested: { } });
  })

});