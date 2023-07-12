import { errorMessages, testState } from '../src/constant';
import { createStore } from '../src/core';
import { Store } from '../src/type';
import { resetLibraryState } from '../src/utility';

describe('misc', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('should work with half-finished writes intermixed with reads', () => {
    const state = { num: 0, str: '', bool: false };
    const store = createStore({ state });
    const changeNum = store.num;
    const changeBool = store.bool;
    store.str.$set('x');
    changeNum.$add(1);
    changeBool.$set(true);
    expect(store.$state).toEqual({ num: 1, str: 'x', bool: true });
  })

  it('should not allow sets or maps', () => {
    const state = { set: new Set() };
    expect(() => createStore({ state })).toThrow(errorMessages.INVALID_STATE_INPUT(new Set().toString()));
  })

  it('should throw an error if a user uses a dollar prop in their state', () => {
    expect(() => createStore({ state: { $hello: 'world' } })).toThrow(errorMessages.DOLLAR_USED_IN_STATE);
  })

  // it('', () => {
  //   const initialState = {
  //     state: {
  //       arr: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }],
  //       arrDeep: [
  //         {
  //           id: 1,
  //           arr: [
  //             {
  //               id: 1,
  //               text: 'one'
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   };
  //   const store = createStore(initialState);
  //   expect((store.arr.$find as any).$state).toEqual(initialState.state.arr);
  //   expect((store.arr.$find as any).id.$state).toEqual(initialState.state.arr);
  //   expect(store.arr.$find.id.$eq(3).$state).toEqual(null);
  //   expect((store.arrDeep.$find.id.$eq(1).arr.$find as any).$state).toEqual(initialState.state.arrDeep.find(e => e.id === 1)!.arr);
  //   expect((store.arrDeep.$find.id.$eq(1).arr.$find.id as any).$state).toEqual(initialState.state.arrDeep.find(e => e.id === 1)!.arr);
  // })

  it('', () => {
    const appStore = createStore({
      state: {
        num: 0,
        obj: {
          one: {
            two: 'hello'
          }
        },
        arr: [
          { id: 1, text: 'one' },
          { id: 2, text: 'two' },
          { id: 3, text: 'three' },
        ],
        arrNum: [1, 2, 3],
      }
    });


    const storeRef = { current: appStore };
    const props = { query: 'arr.$find.id.$eq(1)' };
    let subStore: Store<Record<string, any>> = storeRef.current! as any;
    const stateRef = { current: subStore.$state };
    props.query
      .split('.')
      .forEach(key => {
        const arg = key.match(/\(([^)]+)\)/)?.[1];
        const containsParenthesis = arg !== null && arg !== undefined;
        let subStoreLocal: Store<Record<string, any>>;
        if (containsParenthesis) {
          const functionName = key.split('(')[0];
          const typedArg = !isNaN(Number(arg)) ? parseFloat(arg as any) : arg === 'true' ? true : arg === 'false' ? false : arg;
          subStoreLocal = (subStore[functionName] as any as Function)(typedArg!);
        } else {
          subStoreLocal = subStore[key] as any as Store<Record<string, any>>;
        }
        stateRef.current = subStoreLocal.$state as any;
        subStore = subStoreLocal;
      });
      console.log(stateRef.current);
  })

});
