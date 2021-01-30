import { set } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should update a top-level object', () => {
    const get = set({ x: 0, y: 0 });
    get(s => s.x).replace(3);
    expect(get().read()).toEqual({ x: 3, y: 0 });
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should update a top-level array', () => {
    const get = set(new Array<{ id: number, text: string }>());
    get().insert([{ id: 1, text: 'hello' }]);
    expect(get().read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level number', () => {
    const get = set(0);
    get().replace(3);
    expect(get().read()).toEqual(3);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level boolean', () => {
    const get = set(false);
    get().replace(true);
    expect(get().read()).toEqual(true);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level string', () => {
    const get = set('');
    get().replace('test');
    expect(get().read()).toEqual('test');
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace top-level object', () => {
    const get = set({ hello: 'world', another: new Array<string>() });
    get().replace({ hello: 'test', another: ['test'] });
    expect(get().read()).toEqual({ hello: 'test', another: ['test'] });
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace root array', () => {
    const get = set(['one', 'two', 'three']);
    get().replaceAll(['four', 'five', 'six', 'seven']);
    expect(get().read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  // it('should replaceWhere root array', () => {
  //   const get = set(['one', 'two', 'three']);
  //   get().replaceWhere(e => e === 'two').with('twoo');
  //   expect(get().read()).toEqual(['one', 'twoo', 'three']);
  // })

  // it('should insertAfter root array', () => {
  //   const get = set(['one']);
  //   get().insertAfter('two');
  //   expect(get().read()).toEqual(['one', 'two']);
  //   expect(tests.currentAction.type).toEqual('insertAfter()');
  // })

  it('should replace on a top-level string using a function', () => {
    const get = set('a');
    get().replace(e => e + 'b');
    expect(get().read()).toEqual('ab');
    // expect(tests.currentAction.payload).toEqual('ab');
    expect(tests.currentAction).toEqual({
      type: 'replace()',
      payload: {
        replacement: 'ab',
      },
    });
  });

});
