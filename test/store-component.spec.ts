import { Deferred } from '../src/shapes-external';
import { errorMessages } from '../src/shared-consts';
import { libState, testState } from '../src/shared-state';
import { createRootStore, createComponentStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Component stores', () => {

  const spyInfo = jest.spyOn(console, 'info');

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    spyInfo.mockReset();
  });

  it('should attach a lib store correctly', () => {
    const initialState = {
      test: '',
      components: {},
    };
    const initialStateComp = {
      one: ''
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    createComponentStore(initialStateComp, { componentName, instanceName });
    expect(select().read()).toEqual({ ...initialState, components: { [componentName]: { 0: initialStateComp } } });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      components: {},
    };
    createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const componentStore1 = createComponentStore({ one: '' }, { componentName, instanceName });
    expect(componentStore1().read().one).toEqual('');
    componentStore1(s => s.one).replace('test');
    expect(testState.currentAction).toEqual({
      type: `components.${componentName}.0.one.replace()`,
      replacement: 'test',
    })
    expect(componentStore1().read().one).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      components: {} as { myComp: { [key: string]: { one: string } } },
    };
    const parent = createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const componentStore1 = createComponentStore({ one: '' }, { componentName, instanceName });
    expect(componentStore1().read().one).toEqual('');
    parent(s => s.components.myComp['0'].one).replace('test');
    expect(componentStore1().read().one).toEqual('test');
  })

  it('should be able to stopTracking a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const component1 = createComponentStore({ one: '' }, { componentName, instanceName });
    expect(select().read()).toEqual({ test: '', components: { [componentName]: { 0: { one: '' } } } });
    component1().detachFromRootStore();
    expect(select().read()).toEqual({ test: '', components: {} });
  })

  it('should be able to stopTracking a lib store where there are multiple stores for the same lib', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const component1 = createComponentStore({ one: '' }, { componentName, instanceName: '0' });
    const component2 = createComponentStore({ one: '' }, { componentName, instanceName: '1' });
    expect(select().read()).toEqual({ test: '', components: { [componentName]: { '0': { one: '' }, '1': { one: '' } } } });
    component1().detachFromRootStore();
    expect(select().read()).toEqual({ test: '', components: { [componentName]: { '1': { one: '' } } } });
    component2().detachFromRootStore();
    expect(select().read()).toEqual({ test: '', components: {} });
  })

  it('should be able to perform an update on a second component store', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const component1 = createComponentStore({ one: '' }, { componentName, instanceName: '0' });
    component1(s => s.one).replace('test1');
    const component2 = createComponentStore({ one: '' }, { componentName, instanceName: '1' });
    component2(s => s.one).replace('test2');
    expect(select().read()).toEqual({ test: '', components: { [componentName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support component store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const component = createComponentStore(new Array<string>(), { componentName, instanceName });
    component().insert('test');
    expect(select().read()).toEqual({ test: '', components: { [componentName]: { 0: ['test'] } } });
  })

  it('should be able to support component store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const component = createComponentStore(0, { componentName, instanceName });
    component().replace(1);
    expect(select().read()).toEqual({ test: '', components: { [componentName]: { 0: 1 } } });
  })

  it('should be able to support more than one component store type', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    createComponentStore(0, { componentName, instanceName });
    const componentName2 = 'myComp2';
    createComponentStore(0, { componentName: componentName2, instanceName });
    expect(select().read()).toEqual({ test: '', components: { [componentName]: { 0: 0 }, [componentName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createRootStore(0);
    expect(() => createComponentStore(0, { componentName: 'test', instanceName: '0' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createRootStore(new Array<string>());
    expect(() => createComponentStore(0, { componentName: 'test', instanceName: '0' })).toThrowError(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should reset the container store correctly after component stores have been added', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const instanceName = '0';
    const componentName = 'myComp';
    createComponentStore(0, { componentName, instanceName });
    const componentName2 = 'myComp2';
    createComponentStore(0, { componentName: componentName2, instanceName });
    select().reset();
    expect(select().read()).toEqual(initialState);
  })

  it('should be able to reset the state of a component store', () => {
    const initialState = {
      test: '',
    };
    const select = createRootStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const component = createComponentStore(0, { componentName, instanceName });
    component().replace(1);
    expect(select().read()).toEqual({ test: '', components: { myComp: { '0': 1 } } });
    component().reset();
    expect(select().read()).toEqual({ test: '', components: { myComp: { '0': 0 } } });
    expect(component().read()).toEqual(0);
    select().reset();
  })

  it('should work without a container store', () => {
    libState.rootStore = null;
    const component = createComponentStore({
      object: { property: 'a' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      string: 'b',
    }, { componentName: 'dd', instanceName: '0', dontTrackWithDevtools: true });
    component(s => s.object.property).replace('test');
    expect(component().read().object.property).toEqual('test');
    component().detachFromRootStore();
  });

  it('should be able to support a custom instance name', () => {
    const parent = createRootStore({ hello: '' });
    const componentName = 'MyComponent';
    const instanceName = 'test';
    createComponentStore({ num: 0 }, { componentName, instanceName });
    expect(parent().read()).toEqual({ hello: '', components: { [componentName]: { [instanceName]: { num: 0 } } } })
  })

  it('should be able to reset a component store inner property', () => {
    const parent = createRootStore({ test: '' });
    parent(s => s.test).replace('test');
    const component = createComponentStore({ array: new Array<string>() }, { componentName: 'test', instanceName: '0' });
    component(s => s.array).insert('test');
    expect(parent().read()).toEqual({ test: 'test', components: { test: { '0': { array: ['test'] } } } });
    component(s => s.array).reset();
    expect(parent().read()).toEqual({ test: 'test', components: { test: { '0': { array: [] } } } });
    expect(testState.currentAction).toEqual({ type: 'components.test.0.array.reset()', replacement: [] });
  })

  it('should be able to reset a detached store', () => {
    const component = createComponentStore({ test: '' }, { componentName: 'testyy', instanceName: '0' });
    component(s => s.test).replace('test');
    expect(component().read()).toEqual({ test: 'test' });
    component(s => s.test).reset();
    expect(component().read()).toEqual({ test: '' });
  })

  it('should be able to set a deferred instanceName', (done) => {
    const initialRootState = { hello: 'hey' };
    const componentName = 'MyComponent';
    const instanceName = 'MyInstance';
    const root = createRootStore(initialRootState);
    const child = createComponentStore({ val: 0 }, { componentName, instanceName: Deferred });
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
          components: {
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
    const root = createRootStore(initialRootState);
    const child = createComponentStore({ val: 0 }, { componentName, instanceName: Deferred });
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
          components: {
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
