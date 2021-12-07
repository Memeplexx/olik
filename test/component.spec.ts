import { createApplicationStore, createComponentStore } from '../src/index';
import { libState, errorMessages } from '../src/constant';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';
import { Deferred, Store } from '../src/type';

describe('component', () => {

  const spyInfo = jest.spyOn(console, 'info');

  beforeAll(() => {
    libState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.appStates = {};
    libState.appStores = {};
    libState.logLevel = 'none';
  })

  it('should attach a lib store correctly', () => {
    const initialState = {
      test: '',
    };
    const initialStateComp = {
      one: ''
    };
    const select = createApplicationStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    createComponentStore(initialStateComp, { componentName, instanceName });
    expect(select.read()).toEqual({ ...initialState, cmp: { [componentName]: { [instanceName]: initialStateComp } } });
  })

  it('should be able to update a lib store correctly', () => {
    const initialState = {
      test: '',
      components: {},
    };
    createApplicationStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const componentStore1 = createComponentStore({ one: '' }, { componentName, instanceName });
    expect(componentStore1.read().one).toEqual('');
    componentStore1.one.replace('test');
    expect(libState.currentAction).toEqual({
      type: `cmp.${componentName}.0.one.replace()`,
      payload: 'test',
    })
    expect(componentStore1.read().one).toEqual('test');
  })

  it('should be able to update a lib store via host store correctly', () => {
    const initialState = {
      test: '',
      cmp: {} as { myComp: { [key: string]: { one: string } } },
    };
    const parent = createApplicationStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const componentStore1 = createComponentStore({ one: '' }, { componentName, instanceName });
    expect(componentStore1.read().one).toEqual('');
    parent.cmp.myComp['0'].one.replace('test');
    expect(componentStore1.read().one).toEqual('test');
  })

  it('should be able to create a detached store', () => {
    const componentName = 'myComp';
    const instanceName = '0';
    const payload = 'another';
    const select = createComponentStore({ test: '' }, { componentName, instanceName });
    select.test.replace(payload);
    expect(select.test.read()).toEqual(payload);
  })

  it('should be able to stopTracking a component store correctly', () => {
    const initialState = {
      test: '',
    };
    const select = createApplicationStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const component1 = createComponentStore({ one: '' }, { componentName, instanceName });
    expect(select.read()).toEqual({ test: '', cmp: { [componentName]: { 0: { one: '' } } } });
    component1.removeFromApplicationStore();
    expect(select.read()).toEqual({ test: '', cmp: {} });
  })

  it('should be able to stopTracking a component store where there are multiple stores for the same component', () => {
    const initialState = {
      test: '',
    };
    const select = createApplicationStore(initialState);
    const componentName = 'myComp';
    const component1 = createComponentStore({ one: '' }, { componentName, instanceName: '0' });
    const component2 = createComponentStore({ one: '' }, { componentName, instanceName: '1' });
    expect(select.read()).toEqual({ test: '', cmp: { [componentName]: { '0': { one: '' }, '1': { one: '' } } } });
    component1.removeFromApplicationStore();
    expect(select.read()).toEqual({ test: '', cmp: { [componentName]: { '1': { one: '' } } } });
    component2.removeFromApplicationStore();
    expect(select.read()).toEqual({ test: '', cmp: {} });
  })

  it('should be able to perform an update on a second component store', () => {
    const initialState = {
      test: '',
    };
    const select = createApplicationStore(initialState);
    const componentName = 'myComp';
    const component1 = createComponentStore({ one: '' }, { componentName, instanceName: '0' });
    component1.one.replace('test1');
    const component2 = createComponentStore({ one: '' }, { componentName, instanceName: '1' });
    component2.one.replace('test2');
    expect(select.read()).toEqual({ test: '', cmp: { [componentName]: { 0: { one: 'test1' }, 1: { one: 'test2' } } } });
  })

  it('should be able to support component store which is a top-level array', () => {
    const initialState = {
      test: '',
    };
    const select = createApplicationStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const component = createComponentStore(new Array<string>(), { componentName, instanceName });
    component.insertOne('test');
    expect(select.read()).toEqual({ test: '', cmp: { [componentName]: { 0: ['test'] } } });
  })

  it('should be able to support component store which is a top-level number', () => {
    const initialState = {
      test: '',
    };
    const select = createApplicationStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    const component = createComponentStore(0, { componentName, instanceName });
    component.replace(1);
    expect(select.read()).toEqual({ test: '', cmp: { [componentName]: { 0: 1 } } });
  })

  it('should be able to support more than one component store type', () => {
    const initialState = {
      test: '',
    };
    const select = createApplicationStore(initialState);
    const componentName = 'myComp';
    const instanceName = '0';
    createComponentStore(0, { componentName, instanceName });
    const componentName2 = 'myComp2';
    createComponentStore(0, { componentName: componentName2, instanceName });
    expect(select.read()).toEqual({ test: '', cmp: { [componentName]: { 0: 0 }, [componentName2]: { 0: 0 } } });
  })

  it('should throw an error if the containing stores state is a primitive', () => {
    createApplicationStore(0);
    expect(() => createComponentStore(0, { componentName: 'test', instanceName: '0' }) as Store<number>).toThrow(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should throw an error if the containing stores state is an array', () => {
    createApplicationStore(new Array<string>());
    expect(() => createComponentStore(0, { componentName: 'test', instanceName: '0' }) as Store<number>).toThrowError(errorMessages.INVALID_CONTAINER_FOR_COMPONENT_STORES);
  })

  it('should work without a container store', () => {
    const component = createComponentStore({
      object: { property: 'a' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      string: 'b',
    }, { componentName: 'dd', instanceName: '0' });
    component.object.property.replace('test');
    expect(component.read().object.property).toEqual('test');
    component.removeFromApplicationStore();
  });

  it('should be able to support a custom instance name', () => {
    const parent = createApplicationStore({ hello: '' });
    const componentName = 'MyComponent';
    const instanceName = 'test';
    createComponentStore({ num: 0 }, { componentName, instanceName });
    expect(parent.read()).toEqual({ hello: '', cmp: { [componentName]: { [instanceName]: { num: 0 } } } })
  })

  it('should be able to set a deferred instanceName', (done) => {
    const initialRootState = { hello: 'hey' };
    const componentName = 'MyComponent';
    const instanceName = 'MyInstance';
    const root = createApplicationStore(initialRootState);
    const child = createComponentStore({ val: 0 }, { componentName, instanceName: Deferred });
    let count = 0;
    child.onChange(val => {
      count++;
      if (count === 1) {
        expect(val.val).toEqual(1);
      } else if (count === 2) {
        expect(val.val).toEqual(2);
        expect(child.read()).toEqual({
          val: 2
        })
        expect(root.read()).toEqual({
          ...initialRootState,
          cmp: {
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
    child.val.replace(1);
    child.setDeferredInstanceName(instanceName);
    child.val.replace(2);
  })

  it('should be able to set a deferred instanceName where change listeners were added to an array element', done => {
    const initialRootState = { hello: 'hey' };
    const componentName = 'MyComponent';
    const instanceName = 'MyInstance';
    const root = createApplicationStore(initialRootState);
    const child = createComponentStore({ arr: [{ id: 1, num: 1 }, { id: 2, num: 2 }] }, { componentName, instanceName: Deferred });
    let count = 0;
    child.arr.find.id.eq(1).onChange(val => {
      count++;
      if (count === 1) {
        expect(val).toEqual({ id: 1, num: 3 });
      } else if (count === 2) {
        expect(val).toEqual({ id: 1, num: 4 });
        expect(child.read()).toEqual({ arr: [{ id: 1, num: 4 }, { id: 2, num: 2 }] })
        expect(root.read()).toEqual({
          ...initialRootState,
          cmp: {
            [componentName]: {
              [instanceName]: { arr: [{ id: 1, num: 4 }, { id: 2, num: 2 }] }
            }
          }
        });
        done();
      }
    });
    child.arr.find.id.eq(1).replace({ id: 1, num: 3 });
    child.setDeferredInstanceName(instanceName);
    child.arr.find.id.eq(1).replace({ id: 1, num: 4 });
  })

  it('should be possible to remove a store that was originally deferred', () => {
    const initialRootState = { hello: 'hey' };
    const root = createApplicationStore(initialRootState);
    const componentName = 'MyComponent';
    const instanceName = 'MyInstance';
    const child = createComponentStore({ test: '' }, { componentName, instanceName: Deferred });
    child.setDeferredInstanceName(instanceName);
    expect(root.read()).toEqual({ hello: 'hey', cmp: { MyComponent: { MyInstance: { test: '' } } } });
    child.removeFromApplicationStore();
    expect(root.read()).toEqual({ hello: 'hey', cmp: { } });
  })

});