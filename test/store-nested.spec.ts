import { Deferred } from '../src/shapes-external';
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
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    createNestedStore(initialStateComp, { componentName, instanceName });
    expect(select().read()).toEqual({ ...initialState, nested: { [componentName]: { 0: initialStateComp } } });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      nested: {},
    };
    createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const nestedStore1 = createNestedStore({ one: '' }, { componentName, instanceName });
    expect(nestedStore1().read().one).toEqual('');
    nestedStore1(s => s.one).replace('test');
    expect(testState.currentAction).toEqual({
      type: `nested.${componentName}.0.one.replace()`,
      replacement: 'test',
    })
    expect(nestedStore1().read().one).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const parent = createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const nestedStore1 = createNestedStore({ one: '' }, { componentName, instanceName });
    expect(nestedStore1().read().one).toEqual('');
    parent(s => s.nested.myComp['0'].one).replace('test');
    expect(nestedStore1().read().one).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const nested1 = createNestedStore({ one: '' }, { componentName, instanceName });
    expect(select().read()).toEqual({ test: '', nested: { [componentName]: { 0: { one: '' } } } });
    nested1().detachFromGlobalStore();
    expect(select().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nested1 = createNestedStore({ one: '' }, { componentName, instanceName: '0' });
    const nested2 = createNestedStore({ one: '' }, { componentName, instanceName: '1' });
    expect(select().read()).toEqual({ test: '', nested: { [componentName]: { '0': { one: '' }, '1': { one: '' } } } });
    nested1().detachFromGlobalStore();
    expect(select().read()).toEqual({ test: '', nested: { [componentName]: { '1': { one: '' } } } });
    nested2().detachFromGlobalStore();
    expect(select().read()).toEqual({ test: '', nested: {} });
  })

  it('should be able to perform an update on a second nested store', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const nested1 = createNestedStore({ one: '' }, { componentName, instanceName: '0' });
    nested1(s => s.one).replace('test1');
    const nested2 = createNestedStore({ one: '' }, { componentName, instanceName: '1' });
    nested2(s => s.one).replace('test2');
    expect(select().read()).toEqual({ test: '', nested: { [componentName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support nested store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const nested = createNestedStore(new Array<string>(), { componentName, instanceName });
    nested().insert('test');
    expect(select().read()).toEqual({ test: '', nested: { [componentName]: { 0: ['test'] } } });
  })

  it('should be able to support nested store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const nested = createNestedStore(0, { componentName, instanceName });
    nested().replace(1);
    expect(select().read()).toEqual({ test: '', nested: { [componentName]: { 0: 1 } } });
  })

  it('should be able to support more than one nested store type', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    createNestedStore(0, { componentName, instanceName });
    const componentName2 = 'myComp2';
    createNestedStore(0, { componentName: componentName2, instanceName });
    expect(select().read()).toEqual({ test: '', nested: { [componentName]: { 0: 0 }, [componentName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createGlobalStore(0);
    expect(() => createNestedStore(0, { componentName: 'test', instanceName: '0' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createGlobalStore(new Array<string>());
    expect(() => createNestedStore(0, { componentName: 'test', instanceName: '0' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_NESTED_STORES);
  })

  it('should reset the container store correctly after nested stores have been added', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const instanceName = '0';
    const componentName = 'myComp';
    createNestedStore(0, { componentName, instanceName });
    const componentName2 = 'myComp2';
    createNestedStore(0, { componentName: componentName2, instanceName });
    select().reset();
    expect(select().read()).toEqual(initialState);
  })

  it('should be able to reset the state of a nested store', () => {
    const initialState = {
      test: '',
    };
    const select = createGlobalStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const nested = createNestedStore(0, { componentName, instanceName });
    nested().replace(1);
    expect(select().read()).toEqual({ test: '', nested: { myComp: { '0': 1 } } });
    nested().reset();
    expect(select().read()).toEqual({ test: '', nested: { myComp: { '0': 0 } } });
    expect(nested().read()).toEqual(0);
    select().reset();
  })

  it('should work without a container store', () => {
    libState.nestedContainerStore = null;
    const nested = createNestedStore({
      object: { property: 'a' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      string: 'b',
    }, { componentName: 'dd', instanceName: '0', dontTrackWithDevtools: true });
    nested(s => s.object.property).replace('test');
    expect(nested().read().object.property).toEqual('test');
    nested().detachFromGlobalStore();
  });

  it('should be able to support a custom instance name', () => {
    const parent = createGlobalStore({ hello: '' });
    const componentName = 'MyComponent';
    const instanceName = 'test';
    createNestedStore({ num: 0 }, { componentName, instanceName });
    expect(parent().read()).toEqual({ hello: '', 'nested': { [componentName]: { [instanceName]: { num: 0 } } } })
  })

  it('should be able to reset a nested store inner property', () => {
    const parent = createGlobalStore({ test: '' });
    parent(s => s.test).replace('test');
    const nested = createNestedStore({ array: new Array<string>() }, { componentName: 'test', instanceName: '0' });
    nested(s => s.array).insert('test');
    expect(parent().read()).toEqual({ test: 'test', nested: { test: { '0': { array: ['test'] } } } });
    nested(s => s.array).reset();
    expect(parent().read()).toEqual({ test: 'test', nested: { test: { '0': { array: [] } } } });
    expect(testState.currentAction).toEqual({ type: 'nested.test.0.array.reset()', replacement: [] });
  })

  it('should be able to reset a detached store', () => {
    const nested = createNestedStore({ test: '' }, { componentName: 'testyy', instanceName: '0' });
    nested(s => s.test).replace('test');
    expect(nested().read()).toEqual({ test: 'test' });
    nested(s => s.test).reset();
    expect(nested().read()).toEqual({ test: '' });
  })

  it('should be able to set a deferred instanceName', (done) => {
    const initialRootState = { hello: 'hey' };
    const componentName = 'MyComponent';
    const instanceName = 'MyInstance';
    const root = createGlobalStore(initialRootState);
    const child = createNestedStore({ val: 0 }, { componentName, instanceName: Deferred });
    let count = 0;
    child().onChange(val => {
      count++;
      if (count === 1) {
        expect(val.val).toEqual(1);
      } else if (count === 2) {
        expect(val.val).toEqual(2);
        expect(child().read()).toEqual({
          val: 2
        })
        expect(root().read()).toEqual({
          ...initialRootState,
          nested: {
            [componentName]: {
              [instanceName]: {
                val: 2
              }
            }
          }
        });
        done();
      }
    });
    child(s => s.val).replace(1);
    child().setInstanceName(instanceName);
    child(s => s.val).replace(2);
  })

  it('should be able to set a deferred instanceName with a getor function', (done) => {
    const initialRootState = { hello: 'hey' };
    const componentName = 'MyComponent';
    const instanceName = 'MyInstance';
    const root = createGlobalStore(initialRootState);
    const child = createNestedStore({ val: 0 }, { componentName, instanceName: Deferred });
    let count = 0;
    child(s => s.val).onChange(val => {
      count++;
      if (count === 1) {
        expect(val).toEqual(1);
      } else if (count === 2) {
        expect(val).toEqual(2);
        expect(child().read()).toEqual({
          val: 2
        })
        expect(root().read()).toEqual({
          ...initialRootState,
          nested: {
            [componentName]: {
              [instanceName]: {
                val: 2
              }
            }
          }
        });
        done();
      }
    });
    child(s => s.val).replace(1);
    child().setInstanceName(instanceName);
    child(s => s.val).replace(2);
  })

});
