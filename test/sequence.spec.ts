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
    get(s => s.propTwo).insert([{ id: 1, value: 'one' }]);
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.propTwo).findCustom(e => e.id === 1).patch({ value: 'test' });
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.propTwo).match(s => s.id).replaceElseInsert({ id: 1, value: 'xxx' })
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.propTwo).findCustom(s => s.id === 1).remove();
    expect(tests.currentMutableState).toEqual(get().read());
    get(s => s.propTwo).removeAll();
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should maintain sequence on root array', () => {
    const initialState = new Array<{ id: number, value: string }>();
    const get = set(initialState);
    get().insert([{ id: 1, value: 'one' }]);
    expect(tests.currentMutableState).toEqual(get().read());
    get().findCustom(e => e.id === 1).patch({ value: 'test' });
    expect(tests.currentMutableState).toEqual(get().read());
    get().match(s => s.id).replaceElseInsert({ id: 1, value: 'test' })
    expect(tests.currentMutableState).toEqual(get().read());
    get().findCustom(s => s.id === 1).remove();
    expect(tests.currentMutableState).toEqual(get().read());
    get().removeAll();
    expect(tests.currentMutableState).toEqual(get().read());
  })

});