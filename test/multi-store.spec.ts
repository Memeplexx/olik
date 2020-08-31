import { make } from "../src";

describe('Multi-store', () => {

  it('should support multiple stores', () => {
    const getStore1 = make('state-1', new Array<string>());
    const getStore2 = make('state-2', 0);
    getStore1().replaceAll(['one']);
    getStore2().replaceWith(2);
    expect(getStore1().read()).toEqual(['one']);
    expect(getStore2().read()).toEqual(2);
  })

});