import { errorMessages } from '../src/shared-consts';
import { libState, testState } from '../src/shared-state';
import { createAppStore, creatNestedStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Nested', () => {

  const spyInfo = jest.spyOn(console, 'info');

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.nestedContainerStore = null;
    libState.nestedStoresAutoGenKeys = {};
    spyInfo.mockReset();
  });

  it('should attach a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    const initialStateComp = {
      one: ''
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    creatNestedStore(initialStateComp, { componentName });
    expect(read()).toEqual({ ...initialState, nested: { [componentName]: { 0: initialStateComp } } });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    createAppStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = creatNestedStore({ one: '' }, { componentName });
    expect(nestedStore1.read().one).toEqual('');
    nestedStore1.select(s => s.one).replace('test');
    expect(testState.currentAction).toEqual({
      type: `nested.${componentName}.0.one.replace()`,
      replacement: 'test',
    })
    expect(nestedStore1.read().one).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = creatNestedStore({ one: '' }, { componentName });
    expect(nestedStore1.read().one).toEqual('');
    select(s => s.nested.myComp['0'].one).replace('test');
    expect(nestedStore1.read().one).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = creatNestedStore({ one: '' }, { componentName });
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: { one: '' } } } });
    nestedStore1.detachFromAppStore();
    expect(read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = creatNestedStore({ one: '' }, { componentName });
    const nestedStore2 = creatNestedStore({ one: '' }, { componentName });
    expect(read()).toEqual({ test: '', nested: { [componentName]: { '0': { one: '' }, '1': { one: '' } } } });
    nestedStore1.detachFromAppStore();
    expect(read()).toEqual({ test: '', nested: { [componentName]: { '1': { one: '' } } } });
    nestedStore2.detachFromAppStore();
    expect(read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to perform an update on a second nested store', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = creatNestedStore({ one: '' }, { componentName });
    nestedStore1.select(s => s.one).replace('test1');
    const nestedStore2 = creatNestedStore({ one: '' }, { componentName });
    nestedStore2.select(s => s.one).replace('test2');
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = creatNestedStore(new Array<string>(), { componentName });
    nestedStore1.select().insert('test');
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = creatNestedStore(0, { componentName });
    nestedStore1.select().replace(1);
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    creatNestedStore(0, { componentName });
    const componentName2 = 'myComp2';
    creatNestedStore(0, { componentName: componentName2 });
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: 0 }, [componentName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createAppStore(0);
    expect(() => creatNestedStore(0, { componentName: 'test' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createAppStore(new Array<string>());
    expect(() => creatNestedStore(0, { componentName: 'test' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })
  

  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    creatNestedStore(0, { componentName });
    const componentName2 = 'myComp2';
    creatNestedStore(0, { componentName: componentName2 });
    select().reset();
    expect(read()).toEqual(initialState);
  })

  it('should be able to reset the state of a nested store', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createAppStore(initialState);
    const componentName = 'myComp';
    const nested = creatNestedStore(0, { componentName });
    nested.select().replace(1);
    expect(read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested.select().reset();
    expect(read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested.read()).toEqual(0);
    select().reset();
  })

  it('should work without a container store', () => {
    const nested = creatNestedStore({
      object: { property: 'a' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      string: 'b',
    }, { componentName: 'dd', dontTrackWithDevtools: true });
    nested.select(s => s.object.property).replace('test');
    expect(nested.read().object.property).toEqual('test');
    nested.detachFromAppStore();
    expect(spyInfo).toHaveBeenCalledWith(errorMessages.NO_CONTAINER_STORE);
    spyInfo.mockReset();
    nested.select(s => s.array).reset();
    expect(spyInfo).toHaveBeenCalledWith(errorMessages.NO_CONTAINER_STORE);
  });

  it('should be able to support a custom instance name', () => {
    const parentStore = createAppStore({ hello: '' });
    const componentName = 'MyComponent';
    const instanceName = 'test';
    creatNestedStore({ num: 0 }, { componentName, instanceName });
    expect(parentStore.read()).toEqual({ hello: '', 'nested': { [componentName]: { [instanceName]: { num: 0 } } } })
  })

  it('should auto-increment state keys after a store has been detached', () => {
    const parentStore = createAppStore({ test: '' });
    const componentName = 'MyComponent';
    const store0 = creatNestedStore({ num: 0 }, { componentName });
    const store1 = creatNestedStore({ num: 0 }, { componentName });
    store0.detachFromAppStore();
    expect(parentStore.read()).toEqual({ test: '', nested: { MyComponent: { '1': { num: 0 } } } });
    const store2 = creatNestedStore({ num: 0 }, { componentName });
    expect(parentStore.read()).toEqual({ test: '', nested: { MyComponent: { '1': { num: 0 }, '2': { num: 0 } } } });
    store1.detachFromAppStore();
    store2.detachFromAppStore();
    expect(parentStore.read()).toEqual({ test: '', nested: {  } });
  })

});