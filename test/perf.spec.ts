
import { createApplicationStore } from '../src/index';
import { libState } from '../src/constants';

describe.skip('Performance', () => {

  beforeEach(() => {
    libState.appStates = {};
    libState.logLevel = 'none';
  })

  it('', () => {
    const select = createApplicationStore({ arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }], obj: { num: 0 } });
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      select.arr
        .find.val.eq('')
        .patch({ id: i });
    }
    console.log(`Perf: ${performance.now() - before}`);
  })

  it('', () => {
    const select = createApplicationStore({ num: 0, str: '' });
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      select.num.replace(i);
    }
    console.log(`Perf: ${performance.now() - before}`);
  })

});

