import { createApplicationStore } from '../src/index';
import { libState } from '../src/constant';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array-deep', () => {

  const spyInfo = jest.spyOn(console, 'info');

  beforeAll(() => {
    libState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should attach a lib store correctly', () => {
    // const initialState = {
    //   test: '',
    // };
    // const initialStateComp = {
    //   one: ''
    // };
    // const select = createApplicationStore(initialState);
    // const componentName = 'myComp';
    // const instanceName = '0';
    // createComponentStore(initialStateComp, { componentName, instanceName });
    // expect(select.read()).toEqual({ ...initialState, cmp: { [componentName]: { [instanceName]: initialStateComp } } });
  })

  // it('should be able to update a lib store correctly', () => {
  //   const initialState = {
  //     test: '',
  //     components: {},
  //   };
  //   createApplicationStore(initialState);
  //   const componentName = 'myComp';
  //   const instanceName = '0';
  //   const componentStore1 = createComponentStore({ one: '' }, { componentName, instanceName });
  //   expect(componentStore1.read().one).toEqual('');
  //   componentStore1.one.replace('test');
  //   expect(libState.currentAction).toEqual({
  //     type: `cmp.${componentName}.0.one.replace()`,
  //     replacement: 'test',
  //   })
  //   expect(componentStore1.read().one).toEqual('test');
  // })

  // it('should be able to update a lib store via host store correctly', () => {
  //   const initialState = {
  //     test: '',
  //     cmp: {} as { myComp: { [key: string]: { one: string } } },
  //   };
  //   const parent = createApplicationStore(initialState);
  //   const componentName = 'myComp';
  //   const instanceName = '0';
  //   const componentStore1 = createComponentStore({ one: '' }, { componentName, instanceName });
  //   expect(componentStore1.read().one).toEqual('');
  //   parent.cmp.myComp['0'].one.replace('test');
  //   expect(componentStore1.read().one).toEqual('test');
  // })

  // it('should be able to create a detached store', () => {
  //   const componentName = 'myComp';
  //   const instanceName = '0';
  //   const payload = 'another';
  //   const select = createComponentStore({ test: '' }, { componentName, instanceName });
  //   select.test.replace(payload);
  //   expect(select.test.read()).toEqual(payload);
  // })

});