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
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    setNested(initialStateComp, { storeName });
    expect(select().read()).toEqual({ ...initialState, nested: { [storeName]: { 0: initialStateComp } } });
  })

  it('should revert to a top-level store correctly', () => {
    const select = set({ test: '' });
    const nested = setNested({ test: '' }, { storeName: 'nested' });
    nested(s => s.test).replace('test');
    expect(select().read()).toEqual({ test: '' });
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
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested({ one: '' }, { storeName });
    expect(nestedStore(s => s.one).read()).toEqual('');
    select(s => s.nested.myComp['0'].one).replace('test');
    expect(nestedStore(s => s.one).read()).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested({ one: '' }, { storeName });
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: { one: '' } } } });
    nestedStore().removeFromContainingStore();
    expect(select().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = setNested({ one: '' }, { storeName });
    const nestedStore2 = setNested({ one: '' }, { storeName });
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { '0': { one: '' }, '1': { one: '' } } } });
    nestedStore1().removeFromContainingStore();
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { '1': { one: '' } } } });
    nestedStore2().removeFromContainingStore();
    expect(select().read()).toEqual({ test: '', nested: { } });
  })

  it('should be able to perform an update on a second nested store', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested({ one: '' }, { storeName });
    nestedStore(s => s.one).replace('test1');
    const nestedStore2 = setNested({ one: '' }, { storeName });
    nestedStore2(s => s.one).replace('test2');
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested(new Array<string>(), { storeName });
    nestedStore().insert('test');
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore = setNested(0, { storeName });
    nestedStore().replace(1);
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    setNested(0, { storeName });
    const storeName2 = 'myComp2';
    setNested(0, { storeName: storeName2 });
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: 0 }, [storeName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    expect(() => set(0, { isContainerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    expect(() => set(new Array<string>(), { isContainerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    setNested(0, { storeName });
    const storeName2 = 'myComp2';
    setNested(0, { storeName: storeName2 });
    select().reset();
    expect(select().read()).toEqual(initialState);
  })

  it('should be able to reset the state of a nested store', () => {
    const initialState = {
      test: '',
    };
    const select = set(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nested = setNested(0, { storeName });
    nested().replace(1);
    expect(select().read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested().reset();
    expect(select().read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested().read()).toEqual(0);
    select().reset();
  })

  it('should work without a container store', () => {
    libState.nestedContainerStore = null;
    const select = setNested({
      object: { property: 'a' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      string: 'b',
    }, { storeName: 'dd', dontTrackWithDevtools: true });
    select(s => s.object.property).replace('test');
    expect(select(s => s.object.property).read()).toEqual('test');
  });

});