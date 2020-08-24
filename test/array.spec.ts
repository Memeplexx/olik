import { make } from "../src";

describe('Array', () => {

  it('should insertAfter()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }],
      object: { property: '' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).addAfter({ id: 2, value: 'two' }, { id: 3, value: 'three' });
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should insertBefore()', () => {
    const initialState = {
      array: [{ id: 3, value: 'three' }],
      object: { property: '' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).addBefore({ id: 1, value: 'one' }, { id: 2, value: 'two' });
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should patchWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).patchWhere(e => e.value.startsWith('t')).with({ value: 'test' });
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'test' }, { id: 3, value: 'test' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE ALL from an array', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }]
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeAll();
    expect(getStore().read().array).toEqual([]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE FIRST element from array', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeFirst();
    expect(getStore().read().array).toEqual([{ id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE LAST element from array', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeLast();
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE WHERE specific array elements match a criteria', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).removeWhere(a => a.id === 2);
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should replaceAll()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).replaceAll([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(getStore().read().array).toEqual([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should replaceMany()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).replaceMany(e => e.value.startsWith('t')).with({ id: 4, value: 'four' });
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 4, value: 'four' }, { id: 4, value: 'four' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should replaceWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).replaceWhere(a => a.id === 2).with({ id: 5, value: 'hey' });
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one' }, { id: 5, value: 'hey' }, { id: 3, value: 'three' }]);
    expect(getStore().read().object === initialState.object).toBeTruthy();
  })

  it('should upsertWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const getStore = make('state', initialState);
    getStore(s => s.array).upsertWhere(e => e.id === 1).with({ id: 1, value: 'one updated' });
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one updated' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    getStore(s => s.array).upsertWhere(e => e.id === 4).with({ id: 4, value: 'four inserted' });
    expect(getStore().read().array).toEqual([{ id: 1, value: 'one updated' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }, { id: 4, value: 'four inserted' }]);
  })

  it('should udate deeply nested arrays', () => {
    const initialState = {
      orgs: [
        {
          id: 1,
          things: new Array<string>()
        },
        {
          id: 2,
          things: new Array<string>()
        },
      ]
    };
    const store = make('state', initialState);
    store(s => s.orgs).filter(o => o.id === 2).patchWith({ things: ['hello'] });
    expect(store().read()).toEqual({
      orgs: [
        {
          id: 1,
          things: []
        },
        {
          id: 2,
          things: ['hello']
        },
      ]
    });
  })

});
