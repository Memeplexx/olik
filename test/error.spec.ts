import { make } from "../src";

describe('Error', () => {

  it('should throw an error when a method is invoked within a selector', () => {
    const store = make('state', new Array<string>());
    let thrown = false;
    try {
      store(s => s.find(e => true)).replace('');
    } catch (e) {
      thrown = true;
    }
    expect(thrown).toEqual(true);
  })

});