import { produce } from 'immer';
import { fromJS } from 'immutable';

import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Perf', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should test native perf', () => {
    const object = {
      anotherProp: {
        some: {
          deeply: {
            nested: {
              number: 0
            }
          }
        }
      },
    };
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      object.anotherProp.some.deeply.nested.number++;
    }
    console.log(`Native: ${Date.now() - before}`);
  })

  it('should test outlik perf', () => {
    const getStore = make('store', {
      anotherProp: {
        some: {
          deeply: {
            nested: {
              number: 0
            }
          }
        }
      },
    })
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      getStore(s => s.anotherProp.some.deeply.nested.number).replaceWith(
        getStore().read().anotherProp.some.deeply.nested.number + 1
      );
    }
    console.log(`Oulik: ${Date.now() - before}`);
  })

  it('should test outlik perf', () => {
    const initialState = { height: 0, width: 0};
    const getStore = make('store', initialState)
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      getStore(s => s.width).replaceWith(
        getStore().read().width + 1
      );
    }
    console.log(`Oulik simple: ${Date.now() - before}`);
  })

  it('should test immutable perf', () => {
    const initialState = {
      anotherProp: {
        some: {
          deeply: {
            nested: {
              number: 0
            }
          }
        }
      },
    };
    const nested = fromJS(initialState);
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      nested.setIn(['another', 'prop', 'some', 'deeply', 'nested', 'object'], (nested.toJS() as typeof initialState).anotherProp.some.deeply.nested.number + 1).toJS();
    }
    console.log(`ImmutableJS: ${Date.now() - before}`);
  })

  it('should test immutable perf', () => {
    let state = {
      anotherProp: {
        some: {
          deeply: {
            nested: {
              number: 0
            }
          }
        }
      },
    }
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      state = produce(state, draft => {
        draft.anotherProp.some.deeply.nested.number = state.anotherProp.some.deeply.nested.number + 1;
      });
    }
    console.log(`Immer: ${Date.now() - before}`);
  })

});