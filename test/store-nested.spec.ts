import { errorMessages } from '../src/shared-consts';
import { set, setNested } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Nested', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should attach a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    const initialStateComp = {
      one: ''
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    setNested(initialStateComp, { storeName });
    expect(get().read()).toEqual({ ...initialState, nested: { [storeName]: { 0: initialStateComp } } });
  })

  it('should revert to a top-level store correctly', () => {
    const get = set({ test: '' });
    const nested = setNested({ test: '' }, { storeName: 'nested' });
    nested(s => s.test).replace('test');
    expect(get().read()).toEqual({ test: '' });
    expect(nested().read()).toEqual({ test: 'test' });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested({ one: '' }, { storeName });
    expect(nestedStore(s => s.one).read()).toEqual('');
    nestedStore(s => s.one).replace('test');
    expect(libState.currentAction).toEqual({
      type: `nested.${storeName}.0.one.replace()`,
      replacement: 'test',
    })
    expect(nestedStore(s => s.one).read()).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested({ one: '' }, { storeName });
    expect(nestedStore(s => s.one).read()).toEqual('');
    get(s => s.nested.myComp['0'].one).replace('test');
    expect(nestedStore(s => s.one).read()).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested({ one: '' }, { storeName });
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { 0: { one: '' } } } });
    nestedStore().removeFromContainingStore();
    expect(get().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = setNested({ one: '' }, { storeName });
    const nestedStore2 = setNested({ one: '' }, { storeName });
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { '0': { one: '' }, '1': { one: '' } } } });
    nestedStore1().removeFromContainingStore();
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { '1': { one: '' } } } });
    nestedStore2().removeFromContainingStore();
    expect(get().read()).toEqual({ test: '', nested: { } });
  })

  it('should be able to perform an update on a second nested store', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested({ one: '' }, { storeName });
    nestedStore(s => s.one).replace('test1');
    const nestedStore2 = setNested({ one: '' }, { storeName });
    nestedStore2(s => s.one).replace('test2');
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested(new Array<string>(), { storeName });
    nestedStore().insert('test');
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested(0, { storeName });
    nestedStore().replace(1);
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    setNested(0, { storeName });
    const storeName2 = 'myComp2';
    setNested(0, { storeName: storeName2 });
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { 0: 0 }, [storeName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    expect(() => set(0, { isContainerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    expect(() => set(new Array<string>(), { isContainerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should be able to generate custom keys using a function', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const instanceName = (arg?: string): string => !arg ? 'x' : arg + 'x';
    setNested(0, { storeName, instanceName });
    setNested(0, { storeName, instanceName });
    setNested(0, { storeName, instanceName });
    expect(get().read()).toEqual({ test: '', nested: { [storeName]: { x: 0, xx: 0, xxx: 0 } } });
  })

  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const get = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    setNested(0, { storeName });
    const storeName2 = 'myComp2';
    setNested(0, { storeName: storeName2 });
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
    const get = set<X>(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nested = setNested(0, { storeName });
    nested().replace(1);
    expect(get().read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested().reset();
    expect(get().read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested().read()).toEqual(0);
    get().reset();
  })

});