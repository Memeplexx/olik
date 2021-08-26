import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Sequence', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  it('should maintain sequence', () => {
    const initialState = {
      propOne: {
        subPropOne: ''
      },
      propTwo: new Array<{ id: number, value: string }>(),
    };
    const select = createApplicationStore(initialState);
    select(s => s.propOne.subPropOne).replace('hey');
    select(s => s.propOne).patch({ subPropOne: 'xxx' });
    select(s => s.propTwo).insert([{ id: 1, value: 'one' }]);
    select(s => s.propTwo).find(e => e.id === 1).ex().patch({ value: 'test' });
    select(s => s.propTwo).upsertMatching(s => s.id).with({ id: 1, value: 'xxx' });
    select(s => s.propTwo).find(s => s.id === 1).ex().remove();
    select(s => s.propTwo).removeAll();
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const select = createApplicationStore(initialState);
    select().insert([{ id: 1, value: 'one' }]);
    select().find(e => e.id === 1).ex().patch({ value: 'test' });
    select().upsertMatching(s => s.id).with({ id: 1, value: 'test' });
    select().find(s => s.id === 1).ex().remove();
    select().removeAll();
  })

});