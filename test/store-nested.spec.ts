import { errorMessages } from '../src/shared-consts';
import { libState, testState } from '../src/shared-state';
import { createGlobalStore, createNestedStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Nested', () => {

  const spyInfo = jest.spyOn(console, 'info');

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.nestedStoresAutoGenKeys = {};
    libState.storesRegisteredWithDevtools = {};
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
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    createNestedStore(initialStateComp, { componentName });
    expect(read()).toEqual({ ...initialState, nested: { [componentName]: { 0: initialStateComp } } });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    createGlobalStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = createNestedStore({ one: '' }, { componentName });
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
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = createNestedStore({ one: '' }, { componentName });
    expect(nestedStore1.read().one).toEqual('');
    select(s => s.nested.myComp['0'].one).replace('test');
    expect(nestedStore1.read().one).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = createNestedStore({ one: '' }, { componentName });
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: { one: '' } } } });
    nestedStore1.detachFromAppStore();
    expect(read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = createNestedStore({ one: '' }, { componentName });
    const nestedStore2 = createNestedStore({ one: '' }, { componentName });
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
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = createNestedStore({ one: '' }, { componentName });
    nestedStore1.select(s => s.one).replace('test1');
    const nestedStore2 = createNestedStore({ one: '' }, { componentName });
    nestedStore2.select(s => s.one).replace('test2');
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = createNestedStore(new Array<string>(), { componentName });
    nestedStore1.select().insert('test');
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nestedStore1 = createNestedStore(0, { componentName });
    nestedStore1.select().replace(1);
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    createNestedStore(0, { componentName });
    const componentName2 = 'myComp2';
    createNestedStore(0, { componentName: componentName2 });
    expect(read()).toEqual({ test: '', nested: { [componentName]: { 0: 0 }, [componentName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createGlobalStore(0);
    expect(() => createNestedStore(0, { componentName: 'test' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createGlobalStore(new Array<string>());
    expect(() => createNestedStore(0, { componentName: 'test' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })


  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    createNestedStore(0, { componentName });
    const componentName2 = 'myComp2';
    createNestedStore(0, { componentName: componentName2 });
    select().reset();
    expect(read()).toEqual(initialState);
  })

  it('should be able to reset the state of a nested store', () => {
    const initialState = {
      test: '',
    };
    const { select, read } = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nested = createNestedStore(0, { componentName });
    nested.select().replace(1);
    expect(read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested.select().reset();
    expect(read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested.read()).toEqual(0);
    select().reset();
  })

  it('should work without a container store', () => {
    libState.nestedContainerStore = null;
    const nested = createNestedStore({
      object: { property: 'a' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      string: 'b',
    }, { componentName: 'dd', dontTrackWithDevtools: true });
    nested.select(s => s.object.property).replace('test');
    expect(nested.read().object.property).toEqual('test');
    nested.detachFromAppStore();
  });

  it('should be able to support a custom instance name', () => {
    const parentStore = createGlobalStore({ hello: '' });
    const componentName = 'MyComponent';
    const instanceName = 'test';
    createNestedStore({ num: 0 }, { componentName, instanceName });
    expect(parentStore.read()).toEqual({ hello: '', 'nested': { [componentName]: { [instanceName]: { num: 0 } } } })
  })

  it('should auto-increment state keys after a store has been detached', () => {
    const parentStore = createGlobalStore({ test: '' });
    const componentName = 'MyComponent';
    const store0 = createNestedStore({ num: 0 }, { componentName });
    const store1 = createNestedStore({ num: 0 }, { componentName });
    store0.detachFromAppStore();
    expect(parentStore.read()).toEqual({ test: '', nested: { MyComponent: { '1': { num: 0 } } } });
    const store2 = createNestedStore({ num: 0 }, { componentName });
    expect(parentStore.read()).toEqual({ test: '', nested: { MyComponent: { '1': { num: 0 }, '2': { num: 0 } } } });
    store1.detachFromAppStore();
    store2.detachFromAppStore();
    expect(parentStore.read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to reset a nested store inner property', () => {
    const parentStore = createGlobalStore({ test: '' });
    parentStore.select(s => s.test).replace('test');
    const nestedStore = createNestedStore({ array: new Array<string>() }, { componentName: 'test' });
    nestedStore.select(s => s.array).insert('test');
    expect(parentStore.read()).toEqual({ test: 'test', nested: { test: { '0': { array: ['test'] } } } });
    nestedStore.select(s => s.array).reset();
    expect(parentStore.read()).toEqual({ test: 'test', nested: { test: { '0': { array: [] } } } });
    expect(testState.currentAction).toEqual({ type: 'nested.test.0.array.reset()', replacement: [] });
  })

  it('should be able to reset a detached store', () => {
    const nested = createNestedStore({ test: '' }, { componentName: 'testyy' });
    nested.select(s => s.test).replace('test');
    expect(nested.read()).toEqual({ test: 'test' });
    nested.select(s => s.test).reset();
    expect(nested.read()).toEqual({ test: '' });
  })

  it('should be able to set an instance name', () => {
    const root = createGlobalStore({ });
    const child = createNestedStore({ test: 0 }, { componentName: 'MyComponent' });
    expect(root.read()).toEqual({ nested: { MyComponent: { '0': { test: 0 } } } });
    child.setInstanceName('hello');
    expect(root.read()).toEqual({ nested: { MyComponent: { 'hello': { test: 0 } } } });
  })

});