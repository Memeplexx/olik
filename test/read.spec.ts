import { createStore } from '../src';
import { testState } from '../src/constant';

describe('read', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('should read deep array element properties', () => {
    const state = { arr: [{ id: 1, val: 0, obj: { num: 1 } }, { id: 2, val: 0, obj: { num: 2 } }] };
    const select = createStore({ name, state });
    expect(select.arr.obj.num.state).toEqual([1, 2]);
  })

});