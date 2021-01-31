import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should update a top-level object', () => {
    const get = set({ x: 0, y: 0 });
    const payload = 3;
    get(s => s.x)
      .replace(payload);
    expect(get().read()).toEqual({ x: 3, y: 0 });
    expect(tests.currentAction).toEqual({
      type: 'x.replace()',
      replacement: payload,
    })
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should update a top-level array', () => {
    const get = set(new Array<{ id: number, text: string }>());
    const payload = [{ id: 1, text: 'hello' }];
    get()
      .insert(payload);
    expect(tests.currentAction).toEqual({
      type: 'insert()',
      insertion: payload,
    })
    expect(get().read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level number', () => {
    const get = set(0);
    const payload = 3;
    get()
      .replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual(3);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level boolean', () => {
    const get = set(false);
    const payload = true;
    get()
      .replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual(payload);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level string', () => {
    const get = set('');
    const payload = 'test';
    get()
      .replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual('test');
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace top-level object', () => {
    const get = set({ hello: 'world', another: new Array<string>() });
    const payload = { hello: 'test', another: ['test'] };
    get()
      .replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual({ hello: 'test', another: ['test'] });
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replaceAll()', () => {
    const get = set(['one', 'two', 'three']);
    const payload = ['four', 'five', 'six', 'seven'];
    get()
      .replaceAll(payload);
    expect(tests.currentAction).toEqual({
      type: 'replaceAll()',
      replacement: payload,
    })
    expect(get().read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should find() replace()', () => {
    const get = set(['one', 'two', 'three']);
    const payload = 'twoo';
    get()
      .find().eq('two')
      .replace(payload);
    expect(tests.currentAction).toEqual({
      type: 'find().replace()',
      replacement: payload,
      query: `element === two`,
    })
    expect(get().read()).toEqual(['one', 'twoo', 'three']);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should insert()', () => {
    const get = set(['one']);
    get()
      .insert('two');
    expect(tests.currentAction).toEqual({
      type: 'insert()',
      insertion: 'two'
    });
    expect(get().read()).toEqual(['one', 'two']);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace on a top-level string using a function', () => {
    const get = set('a');
    get()
      .replace(e => e + 'b');
    expect(tests.currentAction).toEqual({
      type: 'replace()',
      replacement: 'ab',
    });
    expect(get().read()).toEqual('ab');
    expect(tests.currentMutableState).toEqual(get().read());
  });

  it('should be able to perform an replaceElseInsert', () => {
    const initialState = ['one', 'two', 'three'];
    const get = set(initialState);
    const payload = 'four';
    get()
      .match()
      .replaceElseInsert(payload);
    expect(tests.currentAction).toEqual({
      type: 'match().replaceElseInsert()',
      argument: payload,
      insertionCount: 1,
      replacementCount: 0,
    })
    expect(get().read()).toEqual([...initialState, payload]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

});
