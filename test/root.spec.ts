import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should update a top-level object', () => {
    const select = make({ x: 0, y: 0 });
    select(s => s.x).replace(3);
    expect(select().read()).toEqual({ x: 3, y: 0 });
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should update a top-level array', () => {
    const select = make(new Array<{ id: number, text: string }>());
    select().addAfter([{ id: 1, text: 'hello' }]);
    expect(select().read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should replace a top-level number', () => {
    const select = make(0);
    select().replace(3);
    expect(select().read()).toEqual(3);
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should replace a top-level boolean', () => {
    const select = make(false);
    select().replace(true);
    expect(select().read()).toEqual(true);
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should replace top-level object', () => {
    const select = make({ hello: 'world', another: new Array<string>() });
    select().replace({ hello: 'test', another: ['test'] });
    expect(select().read()).toEqual({ hello: 'test', another: ['test'] });
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should replace root array', () => {
    const select = make(['one', 'two', 'three']);
    select().replaceAll(['four', 'five', 'six', 'seven']);
    expect(select().read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(tests.currentMutableState).toEqual(select().read());
  })

  it('should replaceWhere root array', () => {
    const select = make(['one', 'two', 'three']);
    select().replaceWhere(e => e === 'two').with('twoo');
    expect(select().read()).toEqual(['one', 'twoo', 'three']);
  })

});
