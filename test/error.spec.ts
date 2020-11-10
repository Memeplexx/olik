import { make } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Error', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should throw an error when a method is invoked within a selector', () => {
    const store = make('store', new Array<string>());
    expect(() => store(s => s.some(e => true)).replaceWith(false)).toThrow();
  })

  it('should throw an error when filter() is invoked within a selector', () => {
    const store = make('store', new Array<string>());
    expect(() => store(s => s.filter(e => true)).replaceAll([])).toThrow();
  })

  it('should log an error if no devtools extension could be found', () => {
    tests.windowObject = null;
    make('store', new Array<string>());
    expect(tests.errorLogged).toEqual('Cannot find Redux Devtools Extension');
    tests.errorLogged = '';
    tests.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  })

  it('should throw an error if the initial state has functions in it', () => {
    expect(() => make('store', {
      hey: () => null
    })).toThrow();
  })

});