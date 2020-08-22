import { makeStore } from "../src";

describe('Array', () => {

  it('should insertAfter()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }],
      object: { property: '' },
    };
    const store = makeStore(initialState);
    store.select(s => s.array).insertAfter({ id: 2, value: 'two' }, { id: 3, value: 'three' });
    expect(store.read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should insertBefore()', () => {
    const initialState = {
      array: [{ id: 3, value: 'three' }],
      object: { property: '' },
    };
    const store = makeStore(initialState);
    store.select(s => s.array).insertBefore({ id: 1, value: 'one' }, { id: 2, value: 'two' });
    expect(store.read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should patchWhere()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = makeStore(initialState);
    store.select(s => s.array).patchWhere(e => e.value.startsWith('t')).with({ value: 'test' });
    expect(store.read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'test' }, { id: 3, value: 'test' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE ALL from an array', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }]
    };
    const store = makeStore(initialState);
    store.select(s => s.array).removeAll();
    expect(store.read().array).toEqual([]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE FIRST element from array', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = makeStore(initialState);
    store.select(s => s.array).removeFirst();
    expect(store.read().array).toEqual([{ id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE LAST element from array', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = makeStore(initialState);
    store.select(s => s.array).removeLast();
    expect(store.read().array).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should REMOVE WHERE specific array elements match a criteria', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = makeStore(initialState);
    store.select(s => s.array).removeWhere(a => a.id === 2);
    expect(store.read().array).toEqual([{ id: 1, value: 'one' }, { id: 3, value: 'three' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should replaceAll()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const store = makeStore(initialState);
    store.select(s => s.array).replaceAll([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(store.read().array).toEqual([{ id: 4, value: 'four' }, { id: 5, value: 'five' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should replaceMany()', () => {
    const initialState = {
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
      object: { property: '' },
    };
    const store = makeStore(initialState);
    store.select(s => s.array).replaceMany(e => e.value.startsWith('t')).with({ id: 4, value: 'four' });
    expect(store.read().array).toEqual([{ id: 1, value: 'one' }, { id: 4, value: 'four' }, { id: 4, value: 'four' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should replaceOne()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = makeStore(initialState);
    store.select(s => s.array).replaceOne(a => a.id === 2).with({ id: 5, value: 'hey' });
    expect(store.read().array).toEqual([{ id: 1, value: 'one' }, { id: 5, value: 'hey' }, { id: 3, value: 'three' }]);
    expect(store.read().object === initialState.object).toBeTruthy();
  })

  it('should upsertOne()', () => {
    const initialState = {
      object: { property: '' },
      array: [{ id: 1, value: 'one' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }],
    };
    const store = makeStore(initialState);
    store.select(s => s.array).upsertOne(e => e.id === 1).with({ id: 1, value: 'one updated' });
    expect(store.read().array).toEqual([{ id: 1, value: 'one updated' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }]);
    store.select(s => s.array).upsertOne(e => e.id === 4).with({ id: 4, value: 'four inserted' });
    expect(store.read().array).toEqual([{ id: 1, value: 'one updated' }, { id: 2, value: 'two' }, { id: 3, value: 'three' }, { id: 4, value: 'four inserted' }]);
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
    const store = makeStore(initialState);
    store.select(s => s.orgs).filter(o => o.id === 2).patch({ things: ['hello'] });
    expect(store.read()).toEqual({
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
