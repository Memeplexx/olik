import { make, deepCopy } from "../src";
import { fromJS } from 'immutable';
import { produce } from 'immer';

describe('Perf', () => {

  it('should test outlik perf', () => {
    const getStore = make('store', {
      anotherProp: {
        some: {
          deeply: {
            nested: {
              object: 'hello'
            }
          }
        }
      },
    })
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      getStore(s => s.anotherProp.some.deeply.nested.object).replaceWith('hey');
    }
    console.log(`Oulik: ${Date.now() - before}`);
  })

  it('should test immutable perf', () => {
    const nested = fromJS({
      anotherProp: {
        some: {
          deeply: {
            nested: {
              object: 'hello'
            }
          }
        }
      },
    });
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      nested.setIn(['another', 'prop', 'some', 'deeply', 'nested', 'object'], 'hey').toJS();
    }
    console.log(`ImmutableJS: ${Date.now() - before}`);
  })

  it('should test immutable perf', () => {
    const state = {
      anotherProp: {
        some: {
          deeply: {
            nested: {
              object: 'hello'
            }
          }
        }
      },
    }
    const before = Date.now();
    for (let i = 0; i < 1000; i++) {
      produce(state, draft => {
        draft.anotherProp.some.deeply.nested.object = 'hey';
      });
    }
    console.log(`Immer: ${Date.now() - before}`);
  })

});