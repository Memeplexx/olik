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
    const getStore = make('state', initialState);
    getStore(s => s.propOne.subPropOne).replaceWith('hey');
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.propOne).patchWith({ subPropOne: 'xxx' });
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.propTwo).addAfter([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.propTwo).addBefore([{ id: 0, value: 'zero' }]);
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.propTwo).patchWhere(e => e.id === 1).with({ value: 'test' });
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.propTwo).upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.propTwo).removeWhere(s => s.id === 1);
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore(s => s.propTwo).removeAll();
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const getStore = make('state', initialState);
    getStore().addAfter([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore().addBefore([{ id: 0, value: 'zero' }]);
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore().patchWhere(e => e.id === 1).with({ value: 'test' });
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore().upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore().removeWhere(s => s.id === 1);
    expect(tests.currentMutableState).toEqual(getStore().read());
    getStore().removeAll();
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

  it('should maintain sequence on root string', () => {
    const getStore = make('state', '');
    getStore().replaceWith('hey');
    expect(tests.currentMutableState).toEqual(getStore().read());
  })

});