import { testState } from '../src/shared-state';
import { createAppStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('array conversion', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('using isEq', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.id).whenConvertedTo(s => s + '').isEq('2')
      .remove();
    expect(read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

  it('using isMoreThan', () => {
    const initialState = {
      array: [{ id: 1, date: '2020-01-01' }, { id: 2, date: '2020-01-02' }, { id: 3, date: '2020-01-03' }]
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.date).whenConvertedTo(s => new Date(s).getTime()).isMoreThan(new Date('2020-01-02').getTime())
      .remove();
    expect(read().array).toEqual([initialState.array[0], initialState.array[1]]);
  })

  it('using isMoreThanOrEq', () => {
    const initialState = {
      array: [{ id: 1, date: '2020-01-01' }, { id: 2, date: '2020-01-02' }, { id: 3, date: '2020-01-03' }]
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.date).whenConvertedTo(s => new Date(s).getTime()).isMoreThanOrEq(new Date('2020-01-02').getTime())
      .remove();
    expect(read().array).toEqual([initialState.array[0]]);
  })

  it('using isLessThan', () => {
    const initialState = {
      array: [{ id: 1, date: '2020-01-01' }, { id: 2, date: '2020-01-02' }, { id: 3, date: '2020-01-03' }]
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.date).whenConvertedTo(s => new Date(s).getTime()).isLessThan(new Date('2020-01-02').getTime())
      .remove();
    expect(read().array).toEqual([initialState.array[1], initialState.array[2]]);
  })

  it('using isLessThanOrEq', () => {
    const initialState = {
      array: [{ id: 1, date: '2020-01-01' }, { id: 2, date: '2020-01-02' }, { id: 3, date: '2020-01-03' }]
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.date).whenConvertedTo(s => new Date(s).getTime()).isLessThanOrEq(new Date('2020-01-02').getTime())
      .remove();
    expect(read().array).toEqual([initialState.array[2]]);
  })

  it('using isIn', () => {
    const initialState = {
      array: [{ id: 1, date: '2020-01-01' }, { id: 2, date: '2020-01-02' }, { id: 3, date: '2020-01-03' }]
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.date).whenConvertedTo(s => new Date(s).getTime()).isIn([new Date('2020-01-02').getTime()])
      .remove();
    expect(read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

  it('using isNotIn', () => {
    const initialState = {
      array: [{ id: 1, date: '2020-01-01' }, { id: 2, date: '2020-01-02' }, { id: 3, date: '2020-01-03' }]
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.date).whenConvertedTo(s => new Date(s).getTime()).isNotIn([new Date('2020-01-02').getTime()])
      .remove();
    expect(read().array).toEqual([initialState.array[1]]);
  })

  it('using isMatching', () => {
    const initialState = {
      array: [{ id: 1, date: '2020-01-01' }, { id: 2, date: '2020-01-02' }, { id: 3, date: '2020-01-03' }]
    };
    const { select, read } = createAppStore(initialState);
    select(s => s.array)
      .filterWhere(s => s.id).whenConvertedTo(s => s.toString()).isMatching(/2/)
      .remove();
    expect(read().array).toEqual([initialState.array[0], initialState.array[2]]);
  })

});