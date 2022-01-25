import { testState } from '../src/constant';
import { createStore } from '../src/core';


describe.skip('Performance', () => {

  const name = 'AppStore';

  beforeEach(() => {
    testState.logLevel = 'none';
  })

  it('', () => {
    const state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }], obj: { num: 0 } };
    const store = createStore({ name, state });
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      store.arr
        .$find.val.$eq('')
        .$patch({ id: i });
    }
    console.log(`Perf: ${performance.now() - before}`);
  })

  it('', () => {
    const state = { num: 0, str: '' };
    const select = createStore({ name, state });
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      select.num.$replace(i);
    }
    console.log(`Perf: ${performance.now() - before}`);
  })

});

