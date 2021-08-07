import { testState } from '../src/shared-state';
import { createRootStore } from '../src/store-creators';
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
    const select = createRootStore(initialState);
    select(s => s.propOne.subPropOne).replace('hey');
    select(s => s.propOne).patch({ subPropOne: 'xxx' });
    select(s => s.propTwo).insert([{ id: 1, value: 'one' }]);
    select(s => s.propTwo).findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    select(s => s.propTwo).upsertMatching(s => s.id).with({ id: 1, value: 'xxx' });
    select(s => s.propTwo).findWhere(s => s.id === 1).returnsTrue().remove();
    select(s => s.propTwo).removeAll();
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const select = createRootStore(initialState);
    select().insert([{ id: 1, value: 'one' }]);
    select().findWhere(e => e.id === 1).returnsTrue().patch({ value: 'test' });
    select().upsertMatching(s => s.id).with({ id: 1, value: 'test' });
    select().findWhere(s => s.id === 1).returnsTrue().remove();
    select().removeAll();
  })

});