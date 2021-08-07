import { testState } from '../src/shared-state';
import { createRootStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => testState.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('object.replace()', () => {
    const select = createRootStore({ hello: 'world', another: new Array<string>() });
    const payload = { hello: 'test', another: ['test'] };
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual({ hello: 'test', another: ['test'] });
  })

  it('object.property.update()', () => {
    const select = createRootStore({ x: 0, y: 0 });
    const payload = 3;
    select(s => s.x)
      .replace(payload);
    expect(select().read()).toEqual({ x: 3, y: 0 });
    expect(testState.currentAction).toEqual({
      type: 'x.replace()',
      replacement: payload,
    })
  })

  it('array.insert()', () => {
    const select = createRootStore(new Array<{ id: number, text: string }>());
    const payload = [{ id: 1, text: 'hello' }];
    select().insert(payload);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: payload,
    })
    expect(select().read()).toEqual([{ id: 1, text: 'hello' }]);
  })

  it('number.replace()', () => {
    const select = createRootStore(0);
    const payload = 3;
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual(3);
  })

  it('boolean.replace()', () => {
    const select = createRootStore(false);
    const payload = true;
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual(payload);
  })

  it('union.replace()', () => {
    type union = 'one' | 'two';
    const select = createRootStore('one' as union);
    const payload = 'two' as union;
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual(payload);
  })

  it('string.replace()', () => {
    const select = createRootStore('');
    const payload = 'test';
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual('test');
  })

  it('replaceAll()', () => {
    const select = createRootStore(['one', 'two', 'three']);
    const payload = ['four', 'five', 'six', 'seven'];
    select().replaceAll(payload);
    expect(testState.currentAction).toEqual({
      type: 'replaceAll()',
      replacement: payload,
    })
    expect(select().read()).toEqual(['four', 'five', 'six', 'seven']);
  })

  it('find().replace()', () => {
    const select = createRootStore(['one', 'two', 'three']);
    const payload = 'twoo';
    select()
      .findWhere().eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: payload,
      where: `element === two`,
    })
    expect(select().read()).toEqual(['one', 'twoo', 'three']);
  })

  it('insert()', () => {
    const select = createRootStore(['one']);
    select().insert('two');
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: 'two'
    });
    expect(select().read()).toEqual(['one', 'two']);
  })

  it('find().replace()', () => {
    const select = createRootStore(['hello']);
    select().findWhere().matches(/^h/).replace('another')
    expect(testState.currentAction).toEqual({
      type: 'find().replace()',
      replacement: 'another',
      where: 'element.match(/^h/)',
    });
    expect(select().read()).toEqual(['another']);
  })

});
