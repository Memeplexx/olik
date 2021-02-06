import { set } from '../src/store-creators';
import { errorMessages } from '../src/shared-consts';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Error', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should throw an error when a method is invoked within a selector', () => {
    const get = set(new Array<string>());
    expect(() => get(s => s.some(e => true)).replace(false)).toThrowError(errorMessages.ILLEGAL_FUNCTION_INVOKED_WITHIN_SELECTOR('some'));
  })

  it('should throw an error when filter() is invoked within a selector', () => {
    const get = set(new Array<string>());
    expect(() => get(s => s.filter(e => true)).replaceAll([])).toThrowError(errorMessages.ILLEGAL_FUNCTION_INVOKED_WITHIN_SELECTOR('filter'));
  })

  it('should throw an error if the initial state has functions in it', () => {
    expect(() => set({
      test: () => null,
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

  it('should throw an error if the initial state has a set in it', () => {
    expect(() => set({
      test: new Set(),
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

});