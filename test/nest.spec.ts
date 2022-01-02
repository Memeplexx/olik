import { errorMessages, libState, testState } from '../src/constant';
import { createStore } from '../src/core';
import { nestStoreIfPossible } from '../src/nest';
import { currentAction } from './_utility';

describe('nest', () => {

  const nameOfContainerStore = 'ParentStore';

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
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const instanceName = '0';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested, containerStoreName: nameOfContainerStore, instanceName });
    expect(selectContainer.state).toEqual({ ...stateOfContainerStore, nested: { [nameOfNestedStore]: { [instanceName]: stateOfNestedStore } } });
  })

  it('should be able to update a lib store correctly', () => {
    const stateOfContainerStore = {
      test: '',
      components: {},
    };
    const stateOfNestedStore = {
      one: ''
    };
    createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const instanceName = '0';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested, containerStoreName: nameOfContainerStore, instanceName });
    expect(selectNested.state.one).toEqual('');
    selectNested.one.replace('test');
    expect(currentAction(selectNested)).toEqual({
      type: `nested.${nameOfNestedStore}.0.one.replace()`,
      payload: 'test',
    })
    expect(selectNested.state.one).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const stateOfContainerStore = {
      test: '',
      nested: {} as { myComp: { [key: string]: { one: string } } },
    };
    const stateOfNestedStore = {
      one: ''
    }; 
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const instanceName = '0';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested, containerStoreName: nameOfContainerStore, instanceName });
    expect(selectNested.state.one).toEqual('');
    selectContainer.nested.myComp['0'].one.replace('test');
    expect(selectNested.state.one).toEqual('test');
  })

  it('should be able to create a detached store', () => {
    const stateOfNestedStore = { test: '' };
    const nameOfNestedStore = 'myComp';
    const instanceName = '0';
    const payload = 'another';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested, containerStoreName: nameOfContainerStore, instanceName });
    selectNested.test.replace(payload);
    expect(selectNested.test.state).toEqual(payload);
  })

  it('should be able to stopTracking a component store correctly', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = {
      one: ''
    };
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const instanceName = '0';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    const ref = nestStoreIfPossible({ store: selectNested, containerStoreName: nameOfContainerStore, instanceName });
    expect(selectContainer.state).toEqual({ test: '', nested: { [nameOfNestedStore]: { [instanceName]: { one: '' } } } });
    ref.detach();
    expect(selectContainer.state).toEqual({ test: '', nested: {} });
  })

  it('should be able to stopTracking a component store where there are multiple stores for the same component', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = { one: '' };
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const selectNested1 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    const ref1 = nestStoreIfPossible({ store: selectNested1, containerStoreName: nameOfContainerStore, instanceName: '0' });
    const selectNested2 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    const ref2 = nestStoreIfPossible( { store: selectNested2, containerStoreName: nameOfContainerStore, instanceName: '1' });
    expect(selectContainer.state).toEqual({ ...stateOfContainerStore, nested: { [nameOfNestedStore]: { '0': stateOfNestedStore, '1': stateOfNestedStore } } });
    ref1.detach();
    expect(selectContainer.state).toEqual({ ...stateOfContainerStore, nested: { [nameOfNestedStore]: { '1': stateOfNestedStore } } });
    ref2.detach();
    expect(selectContainer.state).toEqual({ ...stateOfContainerStore, nested: {} });
  })

  it('should be able to perform an update on a second component store', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = {
      one: ''
    };
    const nameOfNestedStore = 'myComp';
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const componentName = 'myComp';
    const selectNested1 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({store: selectNested1, containerStoreName: nameOfContainerStore, instanceName: '0' });
    selectNested1.one.replace('test1');
    const selectNested2 = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested2, containerStoreName: nameOfContainerStore, instanceName: '1' });
    selectNested2.one.replace('test2');
    expect(selectContainer.state).toEqual({ test: '', nested: { [componentName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support component store which is a top-level array', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = new Array<string>();
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const instanceName = '0';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested as any, containerStoreName: nameOfContainerStore, instanceName });
    selectNested.insertOne('test');
    expect(selectContainer.state).toEqual({ test: '', nested: { [nameOfNestedStore]: { [instanceName]: ['test'] } } });
  })

  it('should be able to support component store which is a top-level number', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = 0;
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore = 'myComp';
    const instanceName = '0';
    const selectNested = createStore({ name: nameOfNestedStore, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested, containerStoreName: nameOfContainerStore, instanceName });
    selectNested.replace(1);
    expect(selectContainer.state).toEqual({ test: '', nested: { [nameOfNestedStore]: { [stateOfNestedStore]: 1 } } });
  })

  it('should be able to support more than one component store type', () => {
    const stateOfContainerStore = {
      test: '',
    };
    const stateOfNestedStore = 0;
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const nameOfNestedStore1 = 'myComp';
    const instanceName = '0';
    const selectNested1 = createStore({ name: nameOfNestedStore1, state: stateOfNestedStore });
    nestStoreIfPossible({ store: selectNested1, containerStoreName: nameOfContainerStore, instanceName });
    const nameOfNestedStore2 = 'myComp2';
    const selectNested2 = createStore({ name: nameOfNestedStore2, state: stateOfNestedStore });
    nestStoreIfPossible({store: selectNested2, containerStoreName: nameOfContainerStore, instanceName });
    expect(selectContainer.state).toEqual({ test: '', nested: { [nameOfNestedStore1]: { 0: 0 }, [nameOfNestedStore2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createStore({ name: nameOfContainerStore, state: 0 });
    const selectNested = createStore({ name: 'test', state: 0 });
    expect(() => nestStoreIfPossible({store: selectNested, containerStoreName: nameOfContainerStore, instanceName: '0' }))
      .toThrow(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createStore({ name: nameOfContainerStore, state: new Array<string>() });
    const selectNested = createStore({ name: 'test', state: 0 });
    expect(() => nestStoreIfPossible({ store: selectNested, containerStoreName: nameOfContainerStore, instanceName: '0' }))
      .toThrow(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should work without a container store', () => {
    libState.stores = {}
    const selectNested = createStore({
      name: 'test',
      state: {
        object: { property: 'a' },
        array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
        string: 'b',
      }
    });
    const ref = nestStoreIfPossible({store: selectNested, containerStoreName: nameOfContainerStore, instanceName: '0' });
    selectNested.object.property.replace('test');
    expect(selectNested.state.object.property).toEqual('test');
    ref.detach();
  });

  it('should be able to set a deferred instanceName', (done) => {
    const stateOfContainerStore = { hello: 'hey' };
    const nameOfNestedStore = 'MyComponent';
    const instanceName = 'MyInstance';
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const selectNested = createStore({ name: nameOfNestedStore, state: { val: 0 } });
    let count = 0;
    selectNested.onChange(val => {
      count++;
      if (count === 1) {
        expect(val.val).toEqual(1);
      } else if (count === 2) {
        expect(val.val).toEqual(2);
        expect(selectNested.state).toEqual({
          val: 2
        })
        expect(selectContainer.state).toEqual({
          ...stateOfContainerStore,
          nested: {
            [nameOfNestedStore]: {
              [instanceName]: {
                val: 2
              }
            }
          }
        });
        done();
      }
    });
    selectNested.val.replace(1);
    nestStoreIfPossible({store: selectNested, containerStoreName: nameOfContainerStore, instanceName: instanceName });
    selectNested.val.replace(2);
  })

  it('should be able to set a deferred instanceName where change listeners were added to an array element', done => {
    const stateOfContainerStore = { hello: 'hey' };
    const nameOfNestedStore = 'MyComponent';
    const instanceName = 'MyInstance';
    const selectContainer = createStore({ name: nameOfContainerStore, state: stateOfContainerStore });
    const selectNested = createStore({ name: nameOfNestedStore, state: { arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] } });
    let count = 0;
    selectNested.arr.find.id.eq(1).onChange(val => {
      count++;
      if (count === 1) {
        expect(val).toEqual({ id: 1, num: 3 });
      } else if (count === 2) {
        expect(val).toEqual({ id: 1, num: 4 });
        expect(selectNested.state).toEqual({ arr: [{ id: 1, num: 4 }, { id: 2, num: 2 }] })
        expect(selectContainer.state).toEqual({
          ...stateOfContainerStore,
          nested: {
            [nameOfNestedStore]: {
              [instanceName]: { arr: [{ id: 1, num: 4 }, { id: 2, num: 2 }] }
            }
          }
        });
        done();
      }
    });
    selectNested.arr.find.id.eq(1).replace({ id: 1, num: 3 });
    nestStoreIfPossible({ store: selectNested, instanceName, containerStoreName: nameOfContainerStore });
    selectNested.arr.find.id.eq(1).replace({ id: 1, num: 4 });
  })

  it('should replace a nested store if it has the same identifiers', () => {})

});
