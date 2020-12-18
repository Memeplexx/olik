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
    const select = make(initialState);
    select(s => s.propOne.subPropOne).replace('hey');
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.propOne).patch({ subPropOne: 'xxx' });
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).addAfter([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).addBefore([{ id: 0, value: 'zero' }]);
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).patchWhere(e => e.id === 1).with({ value: 'test' });
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).removeWhere(s => s.id === 1);
    expect(tests.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).removeAll();
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const select = make(initialState);
    select().addAfter([{ id: 2, value: 'two' }]);
    expect(tests.currentMutableState).toEqual(select().read());
    select().addBefore([{ id: 0, value: 'zero' }]);
    expect(tests.currentMutableState).toEqual(select().read());
    select().patchWhere(e => e.id === 1).with({ value: 'test' });
    expect(tests.currentMutableState).toEqual(select().read());
    select().upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    expect(tests.currentMutableState).toEqual(select().read());
    select().removeWhere(s => s.id === 1);
    expect(tests.currentMutableState).toEqual(select().read());
    select().removeAll();
    expect(tests.currentMutableState).toEqual(select().read());
  })

});