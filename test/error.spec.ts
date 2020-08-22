import { makeStore } from "../src";

describe('Error', () => {

  it('should throw an error when a method is invoked within a selector', () => {
    const store = makeStore(new Array<string>());
    let thrown = false;
    try {
      store.select(s => s.find(e => true)).replace('');
    } catch (e) {
      thrown = true;
    }
    expect(thrown).toEqual(true);
  })

});