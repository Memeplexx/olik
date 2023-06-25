import { createStore } from '../src/core';
import { produce } from 'immer';
import { fromJS, List, Map } from 'immutable';
import { resetLibraryState } from '../src/utility';

describe.skip('Performance', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('Immer Perf (shallow)', () => {
    let state = { num: 0, str: '' };
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      state = produce(state, draftState => {
        draftState.num = i;
      })
    }
    console.log(`Immer Perf (shallow): ${performance.now() - before}`);
  })

  it('Immutable Perf (shallow)', () => {
    const state = Map({ num: 0, str: '' });
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      state.set('num', i);
      state.toJS();
    }
    console.log(`Immutable Perf (shallow): ${performance.now() - before}`);
  })

  it('Olik Perf (shallow)', () => {
    const state = { num: 0, str: '' };
    const select = createStore({ state });
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      select.num.$replace(i);
    }
    console.log(`Olik Perf (shallow): ${performance.now() - before}`);
  })

  

  it('Immer Perf (deep)', () => {
    let state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }], obj: { num: 0 } };
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      state = produce(state, draftState => {
        draftState.arr[draftState.arr.findIndex(e => e.val === '')].id = i;
      })
    }
    console.log(`Immer Perf (deep): ${performance.now() - before}`);
  })

  it('Immutable Perf (deep)', () => {
    const state = fromJS({ arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }], obj: { num: 0 } });
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      state.updateIn(['arr', '0', 'id'], (value: number) => i)
      state.toJS();
    }
    console.log(`Immutable Perf (deep): ${performance.now() - before}`);
  })

  it('Olik Perf (deep)', () => {
    const state = { arr: [{ id: 1, val: '', obj: { num: 0 } }, { id: 2, val: '', obj: { num: 0 } }], obj: { num: 0 } };
    const store = createStore({ state });
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      store.arr
        .$find.val.$eq('')
        .id.$replace(i);
    }
    console.log(`Olik Perf (deep): ${performance.now() - before}`);
  })

});

