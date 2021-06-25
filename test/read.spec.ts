import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Read', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should read', () => {
    const store = createGlobalStore({ some: { object: 'test' } });
    const value = store.read().some.object;
    expect(value).toEqual('test');
  })

  it('should listen to onChange events', () => {
    const store = createGlobalStore({ prop: { value: '', another: '' } });
    let changeCount = 0;
    store.get(s => s.prop.value)
      .onChange(val => {
        changeCount++;
        expect(val).toEqual('test');
      });
    store.get(s => s.prop.another).replace('test');
    expect(changeCount).toEqual(0);
    store.get(s => s.prop.value).replace('test');
    expect(changeCount).toEqual(1);
  });

  it('should listen to onChange events when a find() is included in the getor', () => {
    const store = createGlobalStore({ arr: [{ id: 1, val: '' }, { id: 2, val: '' }] });
    let changeCount = 0;
    store.get(s => s.arr.find(e => e.id === 2))
      .onChange(val => {
        changeCount++;
        expect(val).toEqual({ id: 2, val: 'test' });
      });
    store.get(s => s.arr).findWhere(s => s.id).eq(1).patch({ val: 'test' });
    expect(changeCount).toEqual(0);
    store.get(s => s.arr).findWhere(s => s.id).eq(2).patch({ val: 'test' });
    expect(changeCount).toEqual(1);
  })

});
