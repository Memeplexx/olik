import { make } from "../src";
import { tests } from "../src/tests";

describe('Error', () => {

  it('should throw an error when a method is invoked within a selector', () => {
    const getStore = make('state', new Array<string>());
    let thrown = false;
    try {
      getStore(s => s.find(e => true)).replaceWith('');
    } catch (e) {
      thrown = true;
    }
    expect(thrown).toEqual(true);
  })

  it('should throw an error when a method is invoked within a selector', () => {
    const getStore = make('state', new Array<string>());
    let thrown = false;
    try {
      getStore(s => s.filter(e => true)).replaceAll([]);
    } catch (e) {
      thrown = true;
    }
    expect(thrown).toEqual(true);
  })

  it('should log an error if no devtools extension could be found', () => {
    process.env.NODE_ENV = 'test devtools';
    const getStore = make('state', new Array<string>());
    expect(tests.errorLogged).toEqual('Cannot find Redux Devtools Extension');
    process.env.NODE_ENV = 'test';
  })

});