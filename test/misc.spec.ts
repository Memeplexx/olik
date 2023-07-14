import { errorMessages } from '../src/constant';
import { createStore } from '../src/core';
import { RecursiveRecord, Store } from '../src/type';
import { resetLibraryState } from '../src/utility';

describe('misc', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('should work with half-finished writes intermixed with reads', () => {
    // const state = { num: 0, str: '', bool: false };
    // const store = createStore({ state });
    // const changeNum = store.num;
    // const changeBool = store.bool;
    // store.str.$set('x');
    // changeNum.$add(1);
    // changeBool.$set(true);
    // expect(store.$state).toEqual({ num: 1, str: 'x', bool: true });
  })

  // it('should not allow sets or maps', () => {
  //   const state = { set: new Set() };
  //   expect(() => createStore({ state })).toThrow(errorMessages.INVALID_STATE_INPUT(new Set().toString()));
  // })

  it('should throw an error if a user uses a dollar prop in their state', () => {
    expect(() => createStore({ state: { $hello: 'world' } })).toThrow(errorMessages.DOLLAR_USED_IN_STATE);
  })


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
    let subStore = storeRef.current as Store<unknown>;
    const stateRef = { current: subStore.$state as RecursiveRecord };
    props.query
      .split('.')
      .forEach(key => {
        const arg = key.match(/\(([^)]+)\)/)?.[1];
        const containsParenthesis = arg !== null && arg !== undefined;
        let subStoreLocal: Store<RecursiveRecord>;
        if (containsParenthesis) {
          const functionName = key.split('(')[0];
          const typedArg = !isNaN(Number(arg)) ? parseFloat(arg) : arg === 'true' ? true : arg === 'false' ? false : arg;
          subStoreLocal = (subStore as any)[functionName](typedArg!);
        } else {
          subStoreLocal = (subStore as any)[key];
        }
        stateRef.current = subStoreLocal.$state;
        subStore = subStoreLocal;
      });
      // console.log(stateRef.current);
  })

});
