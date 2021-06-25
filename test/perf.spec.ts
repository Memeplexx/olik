import { produce } from 'immer';
import { fromJS } from 'immutable';

import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe.skip('Perf', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

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
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      object.anotherProp.some.deeply.nested.number++;
    }
    console.log(`Native: ${performance.now() - before}`);
  })

  it('should test outlik perf', () => {
    const store = createGlobalStore({
      anotherProp: {
        some: {
          deeply: {
            nested: {
              number: 0
            }
          }
        },
      },
      array: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
      array2: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
      array3: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
    });
    store.get(s => s.array).onChange(e => null);
    store.get(s => s.array2).onChange(e => null);
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      store.get(s => s.anotherProp.some.deeply.nested.number).replace(
        store.get(s => s.anotherProp.some.deeply.nested.number).read() + 1
      );
    }
    console.log(`Olik: ${performance.now() - before}`);
  })

  it('should test olik perf', () => {
    const initialState = { height: 0, width: 0 };
    const store = createGlobalStore(initialState)
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      store.get(s => s.width).replace(
        store.read().width + 1
      );
    }
    console.log(`Olik simple: ${performance.now() - before}`);
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
        },
      },
      array: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
      array2: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
      array3: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
    };
    let nested = fromJS(initialState);
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      nested = nested.setIn(['anotherProp', 'some', 'deeply', 'nested', 'number'], (nested.toJS() as typeof initialState).anotherProp.some.deeply.nested.number + 1);
      nested.toJS();
    }
    console.log(`ImmutableJS: ${performance.now() - before}`);
  })

  it('should test Immer perf', () => {
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
      array: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
      array2: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
      array3: new Array(200).fill(null).map(e => ({
        hello: "fddf fdffd dffdffddf",
        one: 1,
        two: "heyyyyyy",
        more: "hey",
        yetMore: "another",
        someNum: 1,
        someBoolean: false,
        someString: "ffdfdfdfd"
      })),
    }
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      state = produce(state, draft => {
        draft.anotherProp.some.deeply.nested.number = state.anotherProp.some.deeply.nested.number + 1;
      });
    }
    console.log(`Immer: ${performance.now() - before}`);
  })

  it('should test native array push perf', () => {
    const state = ['one', 'two'];
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      state.push('three');
    }
    console.log(`native array push: ${performance.now() - before}`);
  });

  it('should test Olik array push perf', () => {
    const store = createGlobalStore(['one', 'two']);
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      store.insert(['three']);
    }
    console.log(`Olik array push: ${performance.now() - before}`);
  });

  it('should test Immutable array push perf', () => {
    let nested = fromJS(['one', 'two']);
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      nested = nested.push('three');
      nested.toJS();
    }
    console.log(`ImmutableJS array push: ${performance.now() - before}`);
  })

  it('should test Immer array push perf', () => {
    let state = ['one', 'two'];
    const before = performance.now();
    for (let i = 0; i < 100; i++) {
      state = produce(state, draft => {
        draft.push('three');
      });
    }
    console.log(`Immer array push: ${performance.now() - before}`);
  })


});