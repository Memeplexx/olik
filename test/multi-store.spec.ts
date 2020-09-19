import { make } from '../src';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Multi-store', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should support multiple stores', () => {
    const getStore1 = make('state-1', new Array<string>());
    const getStore2 = make('state-2', 0);
    getStore1().replaceAll(['one']);
    getStore2().replaceWith(2);
    expect(getStore1().read()).toEqual(['one']);
    expect(getStore2().read()).toEqual(2);
  })

});