import { createGlobalStore } from '../src/store-creators';
import { errorMessages } from '../src/shared-consts';
import { testState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Error', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should throw an error when a method is invoked within a selector', () => {
    const store = createGlobalStore({ arr: new Array<string>() });
    expect(() => {
      store.get(s => s.arr.some(e => true)).replace(false);
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('get'));
  })

  it('should throw an error when filter() is invoked within a selector', () => {
    const store = createGlobalStore({ arr: new Array<string>() });
    expect(() => {
      store.get(s => s.arr.filter(e => true)).replaceAll([]);
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('get'));
  })

  it('should throw an error if the initial state has functions in it', () => {
    expect(() => createGlobalStore({
      test: () => null,
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

  it('should throw an error if the initial state has a set in it', () => {
    expect(() => createGlobalStore({
      test: new Set(),
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

  it('should throw an error if a function is invoked within a selector where the property is not an object', () => {
    const store = createGlobalStore({ prop: 'a' });
    expect(() => {
      store.get(s => s.prop.replace('', '')).replace('ss');
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('get'));
  })

});