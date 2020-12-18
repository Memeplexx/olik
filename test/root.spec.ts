import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should update a top-level object', () => {
    const get = make({ x: 0, y: 0 });
    get(s => s.x).replace(3);
    expect(get().read()).toEqual({ x: 3, y: 0 });
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should update a top-level array', () => {
    const get = make(new Array<{ id: number, text: string }>());
    get().addAfter([{ id: 1, text: 'hello' }]);
    expect(get().read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level number', () => {
    const get = make(0);
    get().replace(3);
    expect(get().read()).toEqual(3);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace a top-level boolean', () => {
    const get = make(false);
    get().replace(true);
    expect(get().read()).toEqual(true);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace top-level object', () => {
    const get = make({ hello: 'world', another: new Array<string>() });
    get().replace({ hello: 'test', another: ['test'] });
    expect(get().read()).toEqual({ hello: 'test', another: ['test'] });
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replace root array', () => {
    const get = make(['one', 'two', 'three']);
    get().replaceAll(['four', 'five', 'six', 'seven']);
    expect(get().read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(tests.currentMutableState).toEqual(get().read());
  })

  it('should replaceWhere root array', () => {
    const get = make(['one', 'two', 'three']);
    get().replaceWhere(e => e === 'two').with('twoo');
    expect(get().read()).toEqual(['one', 'twoo', 'three']);
  })

});
