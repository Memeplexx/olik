import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Sequence', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should maintain sequence', () => {
    const initialState = {
      propOne: {
        subPropOne: ''
      },
      propTwo: new Array<{ id: number, value: string }>(),
    };
    const { select, read } = createGlobalStore(initialState);
    select(s => s.propOne.subPropOne).replace('hey');
    expect(testState.currentMutableState).toEqual(read());
    select(s => s.propOne).patch({ subPropOne: 'xxx' });
    expect(testState.currentMutableState).toEqual(read());
    select(s => s.propTwo).insert([{ id: 1, value: 'one' }]);
    expect(testState.currentMutableState).toEqual(read());
    select(s => s.propTwo).findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    expect(testState.currentMutableState).toEqual(read());
    select(s => s.propTwo).upsertMatching(s => s.id).with({ id: 1, value: 'xxx' });
    expect(testState.currentMutableState).toEqual(read());
    select(s => s.propTwo).findWhere(s => s.id === 1).returnsTrue().remove();
    expect(testState.currentMutableState).toEqual(read());
    select(s => s.propTwo).removeAll();
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const { select, read } = createGlobalStore(initialState);
    select().insert([{ id: 1, value: 'one' }]);
    expect(testState.currentMutableState).toEqual(read());
    select().findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    expect(testState.currentMutableState).toEqual(read());
    select().upsertMatching(s => s.id).with({ id: 1, value: 'test' });
    expect(testState.currentMutableState).toEqual(read());
    select().findWhere(s => s.id === 1).returnsTrue().remove();
    expect(testState.currentMutableState).toEqual(read());
    select().removeAll();
    expect(testState.currentMutableState).toEqual(read());
  })

});