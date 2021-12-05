import { createApplicationStore } from '../src/index';
import { libState } from '../src/constant';

describe('array-deep', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('should select.arr.find.id.eq(2).patch({ val: 1 })', () => {
    const initialState = { arr: [{ id: 1, val: 0, obj: { num: 0 } }, { id: 2, val: 0, obj: { num: 0 } }], obj: { num: 0 } };
    const select = createApplicationStore(initialState);
    const patch = { val: 1 };
    libState.logLevel = 'debug';
    select.arr
      .find.id.eq(2)
      .patch(patch);
    expect(select.read()).toEqual({ ...initialState, arr: [initialState.arr[0], { ...initialState.arr[1], ...patch }] });
  })

});