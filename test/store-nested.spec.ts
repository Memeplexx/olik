import { errorMessages } from '../src/shared-consts';
import { store, nestedStore } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Nested', () => {

  const spyInfo = jest.spyOn(console, 'info');

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach(() => spyInfo.mockReset());

  it('should attach a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    const initialStateComp = {
      one: ''
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    nestedStore(initialStateComp, { storeName });
    expect(select().read()).toEqual({ ...initialState, nested: { [storeName]: { 0: initialStateComp } } });
  })

  it('should revert to a top-level store correctly', () => {
    const select = store({ test: '' });
    const nested = nestedStore({ test: '' }, { storeName: 'nested' });
    nested(s => s.test).replace('test');
    expect(select().read()).toEqual({ test: '' });
    expect(nested().read()).toEqual({ test: 'test' });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = nestedStore({ one: '' }, { storeName });
    expect(nestedStore1(s => s.one).read()).toEqual('');
    nestedStore1(s => s.one).replace('test');
    expect(libState.currentAction).toEqual({
      type: `nested.${storeName}.0.one.replace()`,
      replacement: 'test',
    })
    expect(nestedStore1(s => s.one).read()).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = nestedStore({ one: '' }, { storeName });
    expect(nestedStore1(s => s.one).read()).toEqual('');
    select(s => s.nested.myComp['0'].one).replace('test');
    expect(nestedStore1(s => s.one).read()).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = nestedStore({ one: '' }, { storeName });
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: { one: '' } } } });
    nestedStore1().removeFromContainingStore();
    expect(select().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = nestedStore({ one: '' }, { storeName });
    const nestedStore2 = nestedStore({ one: '' }, { storeName });
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { '0': { one: '' }, '1': { one: '' } } } });
    nestedStore1().removeFromContainingStore();
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { '1': { one: '' } } } });
    nestedStore2().removeFromContainingStore();
    expect(select().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to perform an update on a second nested store', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = nestedStore({ one: '' }, { storeName });
    nestedStore1(s => s.one).replace('test1');
    const nestedStore2 = nestedStore({ one: '' }, { storeName });
    nestedStore2(s => s.one).replace('test2');
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = nestedStore(new Array<string>(), { storeName });
    nestedStore1().insert('test');
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nestedStore1 = nestedStore(0, { storeName });
    nestedStore1().replace(1);
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    nestedStore(0, { storeName });
    const storeName2 = 'myComp2';
    nestedStore(0, { storeName: storeName2 });
    expect(select().read()).toEqual({ test: '', nested: { [storeName]: { 0: 0 }, [storeName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    expect(() => store(0, { isContainerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    expect(() => store(new Array<string>(), { isContainerForNestedStores: true })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    nestedStore(0, { storeName });
    const storeName2 = 'myComp2';
    nestedStore(0, { storeName: storeName2 });
    select().reset();
    expect(select().read()).toEqual(initialState);
  })

  it('should be able to reset the state of a nested store', () => {
    const initialState = {
      test: '',
    };
    const select = store(initialState, { isContainerForNestedStores: true });
    const storeName = 'myComp';
    const nested = nestedStore(0, { storeName });
    nested().replace(1);
    expect(select().read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested().reset();
    expect(select().read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested().read()).toEqual(0);
    select().reset();
  })

  it('should work without a container store', () => {
    libState.nestedContainerStore = null;
    const select = nestedStore({
      object: { property: 'a' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      string: 'b',
    }, { storeName: 'dd', dontTrackWithDevtools: true });
    select(s => s.object.property).replace('test');
    expect(select(s => s.object.property).read()).toEqual('test');
    select().removeFromContainingStore();
    expect(spyInfo).toHaveBeenCalledWith(errorMessages.NO_CONTAINER_STORE);
    spyInfo.mockReset();
    select(s => s.array).reset();
    expect(spyInfo).toHaveBeenCalledWith(errorMessages.NO_CONTAINER_STORE);
  });

});