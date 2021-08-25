import { libState, testState } from '../src/shared-state';
import { createApplicationStore } from '../src/store-creators';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => {
    testState.windowObject = windowAugmentedWithReduxDevtoolsImpl;
  });

  beforeEach(() => {
    libState.applicationStore = null;
  })

  it('object.replace()', () => {
    const select = createApplicationStore({ hello: 'world', another: new Array<string>() });
    const payload = { hello: 'test', another: ['test'] };
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual({ hello: 'test', another: ['test'] });
  })

  it('object.property.update()', () => {
    const select = createApplicationStore({ x: 0, y: 0 });
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
    const select = createApplicationStore(new Array<{ id: number, text: string }>());
    const payload = [{ id: 1, text: 'hello' }];
    select().insert(payload);
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: payload,
    })
    expect(select().read()).toEqual([{ id: 1, text: 'hello' }]);
  })

  it('number.replace()', () => {
    const select = createApplicationStore(0);
    const payload = 3;
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual(3);
  })

  it('boolean.replace()', () => {
    const select = createApplicationStore(false);
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
    const select = createApplicationStore('one' as union);
    const payload = 'two' as union;
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual(payload);
  })

  it('string.replace()', () => {
    const select = createApplicationStore('');
    const payload = 'test';
    select().replace(payload);
    expect(testState.currentAction).toEqual({
      type: 'replace()',
      replacement: payload,
    })
    expect(select().read()).toEqual('test');
  })

  it('replaceAll()', () => {
    const select = createApplicationStore(['one', 'two', 'three']);
    const payload = ['four', 'five', 'six', 'seven'];
    select().replaceAll(payload);
    expect(testState.currentAction).toEqual({
      type: 'replaceAll()',
      replacement: payload,
    })
    expect(select().read()).toEqual(['four', 'five', 'six', 'seven']);
  })

  it('find().replace()', () => {
    const select = createApplicationStore(['one', 'two', 'three']);
    const payload = 'twoo';
    select()
      .find().eq('two')
      .replace(payload);
    expect(testState.currentAction).toEqual({
      type: `find(element).eq(two).replace()`,
      replacement: payload,
      where: [
        { 'element.eq': 'two' }
      ],
    })
    expect(select().read()).toEqual(['one', 'twoo', 'three']);
  })

  it('insert()', () => {
    const select = createApplicationStore(['one']);
    select().insert('two');
    expect(testState.currentAction).toEqual({
      type: 'insert()',
      insertion: 'two'
    });
    expect(select().read()).toEqual(['one', 'two']);
  })

  it('find().replace()', () => {
    const select = createApplicationStore(['hello']);
    select().find().matches(/^h/).replace('another')
    expect(testState.currentAction).toEqual({
      type: `find(element).match(/^h/).replace()`,
      replacement: 'another',
      where: [
        { 'element.match': /^h/ }
      ],
    });
    expect(select().read()).toEqual(['another']);
  })

});
