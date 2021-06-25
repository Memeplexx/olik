import { testState } from '../src/shared-state';
import { createGlobalStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('object.replace()', () => {
    const store = createGlobalStore({ hello: 'world', another: new Array<string>() });
    const payload = { hello: 'test', another: ['test'] };
    store.replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(store.read()).toEqual({ hello: 'test', another: ['test'] });
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('object.property.update()', () => {
    const store = createGlobalStore({ x: 0, y: 0 });
    const payload = 3;
    store.get(s => s.x)
      .replace(payload);
    expect(store.read()).toEqual({ x: 3, y: 0 });
    expect(testState.currentAction).toEqual({
      type: 'x.replace()',
      replacement: payload,
    })
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('array.insert()', () => {
    const store = createGlobalStore(new Array<{ id: number, text: string }>());
    const payload = [{ id: 1, text: 'hello' }];
    store.insert(payload);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: payload,
    })
    expect(store.read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('number.replace()', () => {
    const store = createGlobalStore(0);
    const payload = 3;
    store.replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(store.read()).toEqual(3);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('boolean.replace()', () => {
    const store = createGlobalStore(false);
    const payload = true;
    store.replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(store.read()).toEqual(payload);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('union.replace()', () => {
    type union = 'one' | 'two';
    const store = createGlobalStore('one' as union);
    const payload = 'two' as union;
    store.replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(store.read()).toEqual(payload);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('string.replace()', () => {
    const store = createGlobalStore('');
    const payload = 'test';
    store.replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(store.read()).toEqual('test');
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('replaceAll()', () => {
    const store = createGlobalStore(['one', 'two', 'three']);
    const payload = ['four', 'five', 'six', 'seven'];
    store.replaceAll(payload);
    expect(testState.currentAction).toEqual({
      type: 'replaceAll()',
      replacement: payload,
    })
    expect(store.read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('find().replace()', () => {
    const store = createGlobalStore(['one', 'two', 'three']);
    const payload = 'twoo';
    store
      .findWhere().eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: payload,
      where: `element === two`,
    })
    expect(store.read()).toEqual(['one', 'twoo', 'three']);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('insert()', () => {
    const store = createGlobalStore(['one']);
    store.insert('two');
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: 'two'
    });
    expect(store.read()).toEqual(['one', 'two']);
    expect(testState.currentMutableState).toEqual(store.read());
  })

  it('find().replace()', () => {
    const store = createGlobalStore(['hello']);
    store.findWhere().matches(/^h/).replace('another')
    expect(testState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: 'another',
      where: 'element.match(/^h/)',
    });
    expect(store.read()).toEqual(['another']);
    expect(testState.currentMutableState).toEqual(store.read());
  })

});
