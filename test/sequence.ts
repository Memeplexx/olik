import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Sequence', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should maintain sequence', () => {
    const initialState = {
      propOne: {
        subPropOne: ''
      },
      propTwo: new Array<{ id: number, value: string }>(),
    };
    const store = make('store', initialState);
    store(s => s.propOne.subPropOne).replaceWith('hey');
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.propOne).patchWith({ subPropOne: 'xxx' });
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.propTwo).addAfter([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.propTwo).addBefore([{ id: 0, value: 'zero' }]);
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.propTwo).patchWhere(e => e.id === 1).with({ value: 'test' });
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.propTwo).upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.propTwo).removeWhere(s => s.id === 1);
    expect(tests.currentMutableState).toEqual(store().read());
    store(s => s.propTwo).removeAll();
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const store = make('store', initialState);
    store().addAfter([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(store().read());
    store().addBefore([{ id: 0, value: 'zero' }]);
    expect(tests.currentMutableState).toEqual(store().read());
    store().patchWhere(e => e.id === 1).with({ value: 'test' });
    expect(tests.currentMutableState).toEqual(store().read());
    store().upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    expect(tests.currentMutableState).toEqual(store().read());
    store().removeWhere(s => s.id === 1);
    expect(tests.currentMutableState).toEqual(store().read());
    store().removeAll();
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should maintain sequence on root string', () => {
    const store = make('store', '');
    store().replaceWith('hey');
    expect(tests.currentMutableState).toEqual(store().read());
  })

});