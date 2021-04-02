import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array.filter().and().or()', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  const initialState = {
    object: { property: '' },
    array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
  };

  it('should eq().and().eq()', () => {
    const select = set(initialState);
    select(s => s.array)
      .whereMany(s => s.id).eq(2).and(s => s.value).eq('two')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.whereMany().remove()',
      toRemove: [ initialState.array[1] ],
      query: 'id === 2 && value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().or().eq()', () => {
    const select = set(initialState);
    select(s => s.array)
      .whereMany(s => s.id).eq(1).or(s => s.value).eq('two')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.whereMany().remove()',
      toRemove: [initialState.array[0], initialState.array[1]],
      query: 'id === 1 || value === two',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[2]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().and().eq() not matching', () => {
    const select = set(initialState);
    select(s => s.array)
      .whereMany(s => s.id).eq(1).and(s => s.id).eq(2)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.whereMany().remove()',
      toRemove: [],
      query: 'id === 1 && id === 2',
    });
    expect(select(s => s.array).read()).toEqual(initialState.array);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().and().eq().or().eq()', () => {
    const select = set(initialState);
    select(s => s.array)
      .whereMany(e => e.id).eq(1).and(e => e.id).eq(2).or(e => e.id).eq(3)
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.whereMany().remove()',
      toRemove: [initialState.array[2]],
      query: 'id === 1 && id === 2 || id === 3',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().or().eq().and().eq()', () => {
    const select = set(initialState);
    select(s => s.array)
      .whereMany(e => e.id).eq(4).or(e => e.id).eq(3).and(e => e.value).eq('three')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.whereMany().remove()',
      toRemove: [initialState.array[2]],
      query: 'id === 4 || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[0], initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('should eq().and().eq().or().eq().and().eq()', () => {
    const select = set(initialState);
    select(s => s.array)
      .whereMany(e => e.id).eq(1).and(e => e.value).eq('one').or(e => e.id).eq(3).and(e => e.value).eq('three')
      .remove();
    expect(libState.currentAction).toEqual({
      type: 'array.whereMany().remove()',
      toRemove: [initialState.array[0], initialState.array[2]],
      query: 'id === 1 && value === one || id === 3 && value === three',
    });
    expect(select(s => s.array).read()).toEqual([initialState.array[1]]);
    expect(libState.currentMutableState).toEqual(select().read());
  })

  it('', () => {
    const select = set({ arr: new Array<string>(), obj: { one: 1, two: { three: '' } } });
    // select(s => s.arr).read().filter(e => true);
    // select(s => s.arr).read().slice().sort()
    // const eee = select(s => s.obj);
    // const ttt = select(s => s.obj).read();
    // ttt.arr = [];

    // const sss = select();
    // const ssss = select(s => s.obj);

    // const rrr = select().read().obj.two;

    // select(s => s.arr)
    //   .upsertMatching()
    //   .with('heey');
    // console.log(select().read());

    // select(s => s.arr)
    //   .whereOne().
    //   .and().


  })

});