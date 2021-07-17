import { augmentations } from '../src/augmentations';
import { libState, testState } from '../src/shared-state';
import { getSelectedStateFromOperationWithoutUpdatingStore } from '../src/shared-utils';
import { createNestedStore, createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('augmentations', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  beforeEach(() => libState.nestedContainerStore = null);

  it('should be able to augment a selection on a core action', () => {
    augmentations.selection = {
      name: 'myThing',
      action: (selection) => () => {
        return selection.read();
      }
    }
    const select = createGlobalStore({ num: 42 });
    const res = (select(s => s.num) as any).myThing();
    expect(res).toEqual(42);
  })

  it('should be able to augment a selection on an array action', () => {
    augmentations.selection = {
      name: 'myThing',
      action: (selection) => () => {
        return selection.read();
      }
    }
    const select = createGlobalStore({ array: [42] });
    const res = (select(s => s.array) as any).myThing();
    expect(res).toEqual([42]);
  })

  it('should be able to augment a selection on an array element action', () => {
    augmentations.selection = {
      name: 'myThing',
      action: (selection) => () => {
        return selection.read();
      }
    }
    const select = createGlobalStore({ array: [42] });
    const res = (select(s => s.array).findWhere().eq(42) as any).myThing();
    expect(res).toEqual(42);
  })

});