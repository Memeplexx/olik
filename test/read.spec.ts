import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Read', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should read', () => {
    const select = set({ some: { object: 'test' } });
    const value = select(s => s.some.object).read();
    expect(value).toEqual('test');
  })

  it('should listen to onChange events', () => {
    const select = set({ prop: { value: '', another: '' } });
    let changeCount = 0;
    select(s => s.prop.value)
      .onChange(val => {
        changeCount++;
        expect(val).toEqual('test');
      });
    select(s => s.prop.another).replace('test');
    expect(changeCount).toEqual(0);
    select(s => s.prop.value).replace('test');
    expect(changeCount).toEqual(1);
  });

  it('should listen to onChange events when a find() is included in the selector', () => {
    const select = set({ arr: [{ id: 1, val: '' }, { id: 2, val: '' }] });
    let changeCount = 0;
    select(s => s.arr.find(e => e.id === 2))
      .onChange(val => {
        changeCount++;
        expect(val).toEqual({ id: 2, val: 'test' });
      });
    select(s => s.arr).findWhere(s => s.id).eq(1).patch({ val: 'test' });
    expect(changeCount).toEqual(0);
    select(s => s.arr).findWhere(s => s.id).eq(2).patch({ val: 'test' });
    expect(changeCount).toEqual(1);
  })

});
