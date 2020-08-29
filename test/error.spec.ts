import { make } from "../src";

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

});