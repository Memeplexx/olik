import { errorMessages, libState, testState } from '../src/constant';
import { createStore } from '../src/core';
import { importOlikNestingModule } from '../src/nest';
import { StoreInternal } from '../src/type-internal';
import { currentAction } from './_utility';

describe('nest', () => {

  const hostStoreName = 'ParentStore';

  beforeAll(() => {
    importOlikNestingModule();
  })

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should attach a lib store correctly', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = {
      one: ''
    };
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    expect(selectContainer.$state).toEqual({ ...stateOfContainerStore, nested: { [nameOfNestedStore]: { 0: stateOfNestedStore } } });
  })

  it('should be able to update a lib store correctly', () => {
    const stateOfContainerStore = {
      test: '',
      components: {},
    };
    const stateOfNestedStore = {
      one: ''
    };
    const store = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    expect(selectNested.$state.one).toEqual('');
    selectNested.one.$replace('test');
    expect(currentAction(store)).toEqual({
      type: `nested.${nameOfNestedStore}.0.one.replace()`,
      payload: 'test',
    })
    expect(selectNested.$state.one).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const stateOfContainerStore = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const stateOfNestedStore = {
      one: ''
    }; 
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    expect(selectNested.$state.one).toEqual('');
    selectContainer.nested.myComp['0'].one.$replace('test');
    expect(selectNested.$state.one).toEqual('test');
  })

  it('should be able to create a detached store', () => {
    const stateOfNestedStore = { test: '' };
    const nameOfNestedStore = 'myComp';
    const payload = 'another';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    selectNested.test.$replace(payload);
    expect(selectNested.test.$state).toEqual(payload);
  })

  it('should be able to stopTracking a component store correctly', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = {
      one: ''
    };
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    expect(selectContainer.$state).toEqual({ test: '', nested: { [nameOfNestedStore]: { 0: { one: '' } } } });
    selectNested.$detachStore();
    expect(selectContainer.$state).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a component store where there are multiple stores for the same component', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = { one: '' };
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const selectNested1 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    const selectNested2 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 1 } });
    expect(selectContainer.$state).toEqual({ ...stateOfContainerStore, nested: { [nameOfNestedStore]: { 0: stateOfNestedStore, 1: stateOfNestedStore } } });
    selectNested1.$detachStore();
    expect(selectContainer.$state).toEqual({ ...stateOfContainerStore, nested: { [nameOfNestedStore]: { 1: stateOfNestedStore } } });
    selectNested2.$detachStore();
    expect(selectContainer.$state).toEqual({ ...stateOfContainerStore, nested: {} });
  })

  it('should be able to perform an update on a second component store', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = {
      one: ''
    };
    const nameOfNestedStore = 'myComp';
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const componentName = 'myComp';
    const selectNested1 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    selectNested1.one.$replace('test1');
    const selectNested2 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 1 } });
    selectNested2.one.$replace('test2');
    expect(selectContainer.$state).toEqual({ test: '', nested: { [componentName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support component store which is a top-level array', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = new Array<string>();
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    selectNested.$insertOne('test');
    expect(selectContainer.$state).toEqual({ test: '', nested: { [nameOfNestedStore]: { 0: ['test'] } } });
  })

  it('should be able to support component store which is a top-level number', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = 0;
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    selectNested.$replace(1);
    expect(selectContainer.$state).toEqual({ test: '', nested: { [nameOfNestedStore]: { [stateOfNestedStore]: 1 } } });
  })

  it('should be able to support more than one component store type', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = 0;
    const selectContainer = createStore({ name: hostStoreName, state: stateOfContainerStore });
    const nameOfNestedStore1 = 'myComp';
    const instanceName = '0';
    const selectNested1 = createStore({ name: nameOfNestedStore1, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    const nameOfNestedStore2 = 'myComp2';
    const selectNested2 = createStore({ name: nameOfNestedStore2, state: stateOfNestedStore, nestStore: { hostStoreName, instanceId: 0 } });
    expect(selectContainer.$state).toEqual({ test: '', nested: { [nameOfNestedStore1]: { 0: 0 }, [nameOfNestedStore2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createStore({ name: hostStoreName, state: 0 });
    expect(() => createStore({ name: 'test', state: 0, nestStore: { hostStoreName, instanceId: 0 } }))
      .toThrow(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createStore({ name: hostStoreName, state: new Array<string>() });
    expect(() => createStore({ name: 'test', state: 0, nestStore: { hostStoreName, instanceId: 0 } }))
      .toThrow(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should work without a container store', () => {
    libState.stores = {}
    const selectNested = createStore({
      name: 'test',
      nestStore: { hostStoreName, instanceId: 0 },
      state: {
        object: { property: 'a' },
        array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
        string: 'b',
      }
    });
    selectNested.object.property.$replace('test');
    expect(selectNested.$state.object.property).toEqual('test');
    selectNested.$detachStore();
  });

  it('should remove change listeners when a nested store is detached', () => {
    const store = createStore({ name: hostStoreName, state: { hello: 'world' } });
    const child = createStore({ name: 'child', state: { num: 0 }, nestStore: { hostStoreName, instanceId: 1 } });
    const { changeListeners } = (store as any as StoreInternal<any>).$internals;
    expect(changeListeners.length).toEqual(2); // includes root listener for parent and child store
    child.$detachStore();
    expect(changeListeners.length).toEqual(1); // includes root listener for parent store only
  })

});
