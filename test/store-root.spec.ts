import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('object.replace()', () => {
    const { get, read } = createGlobalStore({ hello: 'world', another: new Array<string>() });
    const payload = { hello: 'test', another: ['test'] };
    get()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual({ hello: 'test', another: ['test'] });
    expect(testState.currentMutableState).toEqual(read());
  })

  it('object.property.update()', () => {
    const { get, read } = createGlobalStore({ x: 0, y: 0 });
    const payload = 3;
    get(s => s.x)
      .replace(payload);
    expect(read()).toEqual({ x: 3, y: 0 });
    expect(testState.currentAction).toEqual({
      type: 'x.replace()',
      replacement: payload,
    })
    expect(testState.currentMutableState).toEqual(read());
  })

  it('array.insert()', () => {
    const { get, read } = createGlobalStore(new Array<{ id: number, text: string }>());
    const payload = [{ id: 1, text: 'hello' }];
    get()
      .insert(payload);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: payload,
    })
    expect(read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('number.replace()', () => {
    const { get, read } = createGlobalStore(0);
    const payload = 3;
    get()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual(3);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('boolean.replace()', () => {
    const { get, read } = createGlobalStore(false);
    const payload = true;
    get()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual(payload);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('union.replace()', () => {
    type union = 'one' | 'two';
    const { get, read } = createGlobalStore('one' as union);
    const payload = 'two' as union;
    get()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual(payload);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('string.replace()', () => {
    const { get, read } = createGlobalStore('');
    const payload = 'test';
    get()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual('test');
    expect(testState.currentMutableState).toEqual(read());
  })

  it('replaceAll()', () => {
    const { get, read } = createGlobalStore(['one', 'two', 'three']);
    const payload = ['four', 'five', 'six', 'seven'];
    get()
      .replaceAll(payload);
    expect(testState.currentAction).toEqual({
      type: 'replaceAll()',
      replacement: payload,
    })
    expect(read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('find().replace()', () => {
    const { get, read } = createGlobalStore(['one', 'two', 'three']);
    const payload = 'twoo';
    get()
      .findWhere().eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: payload,
      where: `element === two`,
    })
    expect(read()).toEqual(['one', 'twoo', 'three']);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('insert()', () => {
    const { get, read } = createGlobalStore(['one']);
    get()
      .insert('two');
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: 'two'
    });
    expect(read()).toEqual(['one', 'two']);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('find().replace()', () => {
    const { get, read } = createGlobalStore(['hello']);
    get().findWhere().matches(/^h/).replace('another')
    expect(testState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: 'another',
      where: 'element.match(/^h/)',
    });
    expect(read()).toEqual(['another']);
    expect(testState.currentMutableState).toEqual(read());
  })

});
