
import { createStore } from '../src/index';
import { testState } from '../src/constant';

describe.skip('Performance', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('', () => {
    const state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }], obj: { num: 0 } };
    const select = createStore({ name, state });
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      select.arr
        .find.val.eq('')
        .patch({ id: i });
    }
    console.log(`Perf: ${performance.now() - before}`);
  })

  it('', () => {
    const state = { num: 0, str: '' };
    const select = createStore({ name, state });
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      select.num.replace(i);
    }
    console.log(`Perf: ${performance.now() - before}`);
  })

});

