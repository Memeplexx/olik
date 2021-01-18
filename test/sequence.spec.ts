import { set } from '../src/core';
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
    const get = set(initialState);
    get(s => s.propOne.subPropOne).replace('hey');
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.propOne).patch({ subPropOne: 'xxx' });
    expect(tests.currentMutableState).toEqual(get().read());
    // get(s => s.propTwo).insertAfter([{ id: 2, value: 'two' }]);
    // expect(tests.currentMutableState).toEqual(get().read());
    // get(s => s.propTwo).insertBefore([{ id: 0, value: 'zero' }]);
    // expect(tests.currentMutableState).toEqual(get().read());
    // get(s => s.propTwo).patchWhere(e => e.id === 1).with({ value: 'test' });
    // expect(tests.currentMutableState).toEqual(get().read());
    // get(s => s.propTwo).upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    // expect(tests.currentMutableState).toEqual(get().read());
    // get(s => s.propTwo).removeWhere(s => s.id === 1);
    // expect(tests.currentMutableState).toEqual(get().read());
    // get(s => s.propTwo).removeAll();
    // expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const get = set(initialState);
    // get().insertAfter([{ id: 2, value: 'two' }]);
    // expect(tests.currentMutableState).toEqual(get().read());
    // get().insertBefore([{ id: 0, value: 'zero' }]);
    // expect(tests.currentMutableState).toEqual(get().read());
    // get().patchWhere(e => e.id === 1).with({ value: 'test' });
    // expect(tests.currentMutableState).toEqual(get().read());
    // get().upsertWhere(e => e.id === 1).with({ id: 1, value: 'xxx' })
    // expect(tests.currentMutableState).toEqual(get().read());
    // get().removeWhere(s => s.id === 1);
    // expect(tests.currentMutableState).toEqual(get().read());
    // get().removeAll();
    // expect(tests.currentMutableState).toEqual(get().read());
  })

});