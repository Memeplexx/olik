import { store } from '../src/store-creators';
import { errorMessages } from '../src/shared-consts';
import { testState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Error', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should throw an error when a method is invoked within a selector', () => {
    const select = store({ arr: new Array<string>() });
    expect(() => {
      select(s => s.arr.some(e => true)).replace(false);
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('select'));
  })

  it('should throw an error when filter() is invoked within a selector', () => {
    const select = store({ arr: new Array<string>() });
    expect(() => {
      select(s => s.arr.filter(e => true)).replaceAll([]);
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('select'));
  })

  it('should throw an error if the initial state has functions in it', () => {
    expect(() => store({
      test: () => null,
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

  it('should throw an error if the initial state has a set in it', () => {
    expect(() => store({
      test: new Set(),
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

  it('should throw an error if a function is invoked within a selector where the property is not an object', () => {
    const select = store({ prop: 'a' });
    expect(() => {
      select(s => s.prop.replace('', '')).replace('ss');
    }).toThrowError(errorMessages.ILLEGAL_CHARACTERS_WITHIN_SELECTOR('select'));
  })

});