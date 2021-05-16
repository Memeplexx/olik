import { testState } from '../src/shared-state';
import { createAppStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('object.replace()', () => {
    const { select, read } = createAppStore({ hello: 'world', another: new Array<string>() });
    const payload = { hello: 'test', another: ['test'] };
    select()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual({ hello: 'test', another: ['test'] });
    expect(testState.currentMutableState).toEqual(read());
  })

  it('object.property.update()', () => {
    const { select, read } = createAppStore({ x: 0, y: 0 });
    const payload = 3;
    select(s => s.x)
      .replace(payload);
    expect(read()).toEqual({ x: 3, y: 0 });
    expect(testState.currentAction).toEqual({
      type: 'x.replace()',
      replacement: payload,
    })
    expect(testState.currentMutableState).toEqual(read());
  })

  it('array.insert()', () => {
    const { select, read } = createAppStore(new Array<{ id: number, text: string }>());
    const payload = [{ id: 1, text: 'hello' }];
    select()
      .insert(payload);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: payload,
    })
    expect(read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('number.replace()', () => {
    const { select, read } = createAppStore(0);
    const payload = 3;
    select()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual(3);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('boolean.replace()', () => {
    const { select, read } = createAppStore(false);
    const payload = true;
    select()
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
    const { select, read } = createAppStore('one' as union);
    const payload = 'two' as union;
    select()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual(payload);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('string.replace()', () => {
    const { select, read } = createAppStore('');
    const payload = 'test';
    select()
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(read()).toEqual('test');
    expect(testState.currentMutableState).toEqual(read());
  })

  it('replaceAll()', () => {
    const { select, read } = createAppStore(['one', 'two', 'three']);
    const payload = ['four', 'five', 'six', 'seven'];
    select()
      .replaceAll(payload);
    expect(testState.currentAction).toEqual({
      type: 'replaceAll()',
      replacement: payload,
    })
    expect(read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('find().replace()', () => {
    const { select, read } = createAppStore(['one', 'two', 'three']);
    const payload = 'twoo';
    select()
      .findWhere().isEq('two')
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
    const { select, read } = createAppStore(['one']);
    select()
      .insert('two');
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: 'two'
    });
    expect(read()).toEqual(['one', 'two']);
    expect(testState.currentMutableState).toEqual(read());
  })

  it('find().replace()', () => {
    const { select, read } = createAppStore(['hello']);
    select().findWhere().isMatching(/^h/).replace('another')
    expect(testState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: 'another',
      where: 'element.match(/^h/)',
    });
    expect(read()).toEqual(['another']);
    expect(testState.currentMutableState).toEqual(read());
  })

});
