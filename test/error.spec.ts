import { make } from '../src';
import { errorMessages } from '../src/consts';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Error', () => {

  const spyWarn = jest.spyOn(console, 'warn');

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach( () => spyWarn.mockReset()); 

  it('should throw an error when a method is invoked within a selector', () => {
    const store = make(new Array<string>());
    expect(() => store(s => s.some(e => true)).replaceWith(false)).toThrow();
  })

  it('should throw an error when filter() is invoked within a selector', () => {
    const store = make(new Array<string>());
    expect(() => store(s => s.filter(e => true)).replaceAll([])).toThrow();
  })

  it('should log an error if no devtools extension could be found', () => {
    tests.windowObject = null;
    make(new Array<string>());
    expect( spyWarn ).toHaveBeenCalledWith(errorMessages.DEVTOOL_CANNOT_FIND_EXTENSION); 
  })

  it('should throw an error if the initial state has functions in it', () => {
    expect(() => make({
      test: () => null,
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

  it('should throw an error if the initial state has a set in it', () => {
    expect(() => make({
      test: new Set(),
    })).toThrowError(errorMessages.INVALID_STATE_INPUT);
  })

});