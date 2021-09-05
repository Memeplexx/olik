import { createApplicationStore } from '../src/store-creators';
import { errorMessages } from '../src/shared-consts';
import { libState, testState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Error', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  it('should throw an error when a method is invoked within a selector', () => {
    const select = createApplicationStore({ arr: new Array<string>() });
    expect(() => {
      select(s => s.arr.some(e => true)).replace(false);
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('select'));
  })

  it('should throw an error when filter() is invoked within a selector', () => {
    const select = createApplicationStore({ arr: new Array<string>() });
    expect(() => {
      select(s => s.arr.filter(e => true)).replaceAll([]);
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('select'));
  })

  it('should throw an error if the initial state has functions in it', () => {
    expect(() => createApplicationStore({
      test: () => null,
    })).toThrowError(errorMessages.INVALID_STATE_INPUT(() => null));
  })

  it('should throw an error if the initial state has a set in it', () => {
    expect(() => createApplicationStore({
      test: new Set(),
    })).toThrowError(errorMessages.INVALID_STATE_INPUT(new Set()));
  })

  it('should throw an error if a function is invoked within a selector where the property is not an object', () => {
    const select = createApplicationStore({ prop: 'a' });
    expect(() => {
      select(s => s.prop.replace('', '')).replace('ss');
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('select'));
  })

});