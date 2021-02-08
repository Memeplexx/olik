import { set } from '../src/store-creators';
import { libState } from '../src/shared-state';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => libState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('object.replace()', () => {
    const get = set({ hello: 'world', another: new Array<string>() });
    const payload = { hello: 'test', another: ['test'] };
    get()
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual({ hello: 'test', another: ['test'] });
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('object.property.update()', () => {
    const get = set({ x: 0, y: 0 });
    const payload = 3;
    get(s => s.x)
      .replace(payload);
    expect(get().read()).toEqual({ x: 3, y: 0 });
    expect(libState.currentAction).toEqual({
      type: 'x.replace()',
      replacement: payload,
    })
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('array.insert()', () => {
    const get = set(new Array<{ id: number, text: string }>());
    const payload = [{ id: 1, text: 'hello' }];
    get()
      .insert(payload);
    expect(libState.currentAction).toEqual({
      type: 'insert()',
      insertion: payload,
    })
    expect(get().read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('number.replace()', () => {
    const get = set(0);
    const payload = 3;
    get()
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual(3);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('boolean.replace()', () => {
    const get = set(false);
    const payload = true;
    get()
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual(payload);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('string.replace()', () => {
    const get = set('');
    const payload = 'test';
    get()
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(get().read()).toEqual('test');
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('replaceAll()', () => {
    const get = set(['one', 'two', 'three']);
    const payload = ['four', 'five', 'six', 'seven'];
    get()
      .replaceAll(payload);
    expect(libState.currentAction).toEqual({
      type: 'replaceAll()',
      replacement: payload,
    })
    expect(get().read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('find().replace()', () => {
    const get = set(['one', 'two', 'three']);
    const payload = 'twoo';
    get()
      .find().eq('two')
      .replace(payload);
    expect(libState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: payload,
      query: `element === two`,
    })
    expect(get().read()).toEqual(['one', 'twoo', 'three']);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('insert()', () => {
    const get = set(['one']);
    get()
      .insert('two');
    expect(libState.currentAction).toEqual({
      type: 'insert()',
      insertion: 'two'
    });
    expect(get().read()).toEqual(['one', 'two']);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('replace(() => ...)', () => {
    const get = set('a');
    get()
      .replace(e => e + 'b');
    expect(libState.currentAction).toEqual({
      type: 'replace()',
      replacement: 'ab',
    });
    expect(get().read()).toEqual('ab');
    expect(libState.currentMutableState).toEqual(get().read());
  });

  it('match().replaceElseInsert()', () => {
    const initialState = ['one', 'two', 'three'];
    const get = set(initialState);
    const payload = 'four';
    get()
      .replaceElseInsert(payload)
      .match();
    expect(libState.currentAction).toEqual({
      type: 'replaceElseInsert().match()',
      argument: payload,
      insertionCount: 1,
      replacementCount: 0,
    })
    expect(get().read()).toEqual([...initialState, payload]);
    expect(libState.currentMutableState).toEqual(get().read());
  })

  it('find().replace()', () => {
    const get = set(['hello']);
    get().find().match(/^h/).replace('another')
    expect(libState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: 'another',
      query: 'element.match(/^h/)',
    });
    expect(get().read()).toEqual(['another']);
    expect(libState.currentMutableState).toEqual(get().read());
  })

});
