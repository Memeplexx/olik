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
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      object.anotherProp.some.deeply.nested.number++;
    }
    console.log(`Native: ${performance.now() - before}`);
  })

  it('should test outlik perf', () => {
    const store = make('store', {
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
    store(s => s.array).onChange(e => null);
    store(s => s.array2).onChange(e => null);
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      store(s => s.anotherProp.some.deeply.nested.number).replaceWith(
        store(s => s.anotherProp.some.deeply.nested.number).read() + 1
      );
    }
    console.log(`Oulik: ${performance.now() - before}`);
  })

  it('should test oulik perf', () => {
    const initialState = { height: 0, width: 0 };
    const store = make('store', initialState)
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      store(s => s.width).replaceWith(
        store(s => s.width).read() + 1
      );
    }
    console.log(`Oulik simple: ${performance.now() - before}`);
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
    for (let i = 0; i < 1000; i++) {
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
    for (let i = 0; i < 1000; i++) {
      state = produce(state, draft => {
        draft.anotherProp.some.deeply.nested.number = state.anotherProp.some.deeply.nested.number + 1;
      });
    }
    console.log(`Immer: ${performance.now() - before}`);
  })

  it('should test native array push perf', () => {
    const state = ['one', 'two'];
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      state.push('three');
    }
    console.log(`native array push: ${performance.now() - before}`);
  });

  it('should test Oulik array push perf', () => {
    const state = ['one', 'two'];
    const store = make('store', state);
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      store().addAfter(['three']);
    }
    console.log(`Oulik array push: ${performance.now() - before}`);
  });

  it('should test Immutable array push perf', () => {
    let state = ['one', 'two'];
    let nested = fromJS(state);
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      nested = nested.push('three');
      nested.toJS();
    }
    console.log(`ImmutableJS array push: ${performance.now() - before}`);
  })

  it('should test Immer array push perf', () => {
    let state = ['one', 'two'];
    const before = performance.now();
    for (let i = 0; i < 1000; i++) {
      state = produce(state, draft => {
        draft.push('three');
      });
    }
    console.log(`Immer array push: ${performance.now() - before}`);
  })


});