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
    const { get, read } = createGlobalStore(initialState);
    get(s => s.propOne.subPropOne).replace('hey');
    expect(testState.currentMutableState).toEqual(read());
    get(s => s.propOne).patch({ subPropOne: 'xxx' });
    expect(testState.currentMutableState).toEqual(read());
    get(s => s.propTwo).insert([{ id: 1, value: 'one' }]);
    expect(testState.currentMutableState).toEqual(read());
    get(s => s.propTwo).findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    expect(testState.currentMutableState).toEqual(read());
    get(s => s.propTwo).upsertMatching(s => s.id).with({ id: 1, value: 'xxx' });
    expect(testState.currentMutableState).toEqual(read());
    get(s => s.propTwo).findWhere(s => s.id === 1).returnsTrue().remove();
    expect(testState.currentMutableState).toEqual(read());
    get(s => s.propTwo).removeAll();
    expect(testState.currentMutableState).toEqual(read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const { get, read } = createGlobalStore(initialState);
    get().insert([{ id: 1, value: 'one' }]);
    expect(testState.currentMutableState).toEqual(read());
    get().findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    expect(testState.currentMutableState).toEqual(read());
    get().upsertMatching(s => s.id).with({ id: 1, value: 'test' });
    expect(testState.currentMutableState).toEqual(read());
    get().findWhere(s => s.id === 1).returnsTrue().remove();
    expect(testState.currentMutableState).toEqual(read());
    get().removeAll();
    expect(testState.currentMutableState).toEqual(read());
  })

});