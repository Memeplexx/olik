import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Sequence', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should maintain sequence', () => {
    const initialState = {
      propOne: {
        subPropOne: ''
      },
      propTwo: new Array<{ id: number, value: string }>(),
    };
    const select = set(initialState);
    select(s => s.propOne.subPropOne).replace('hey');
    expect(libState.currentMutableState).toEqual(select().read());
    select(s => s.propOne).patch({ subPropOne: 'xxx' });
    expect(libState.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).insert([{ id: 1, value: 'one' }]);
    expect(libState.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    expect(libState.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).upsertMatching(s => s.id).with({ id: 1, value: 'xxx' });
    expect(libState.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).findWhere(s => s.id === 1).returnsTrue().remove();
    expect(libState.currentMutableState).toEqual(select().read());
    select(s => s.propTwo).removeAll();
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const select = set(initialState);
    select().insert([{ id: 1, value: 'one' }]);
    expect(libState.currentMutableState).toEqual(select().read());
    select().findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    expect(libState.currentMutableState).toEqual(select().read());
    select().upsertMatching(s => s.id).with({ id: 1, value: 'test' });
    expect(libState.currentMutableState).toEqual(select().read());
    select().findWhere(s => s.id === 1).returnsTrue().remove();
    expect(libState.currentMutableState).toEqual(select().read());
    select().removeAll();
    expect(libState.currentMutableState).toEqual(select().read());
  })

});