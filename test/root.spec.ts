import { make } from '../src/core';
import { tests } from '../src/tests';
import { windowAugmentedWithReduxDevtoolsImpl } from './_devtools';

describe('Root', () => {

  beforeAll(() => tests.windowObject = windowAugmentedWithReduxDevtoolsImpl);

  it('should update a top-level object', () => {
    const store = make('store', { x: 0, y: 0 });
    store(s => s.x).replaceWith(3);
    expect(store().read()).toEqual({ x: 3, y: 0 });
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should update a top-level array', () => {
    const store = make('store', new Array<{ id: number, text: string }>());
    store().addAfter([{ id: 1, text: 'hello' }]);
    expect(store().read()).toEqual([{ id: 1, text: 'hello' }]);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should replace a top-level number', () => {
    const store = make('store', 0);
    store().replaceWith(3);
    expect(store().read()).toEqual(3);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should replace a top-level boolean', () => {
    const store = make('store', false);
    store().replaceWith(true);
    expect(store().read()).toEqual(true);
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should replace top-level object', () => {
    const store = make('store', { hello: 'world', another: new Array<string>() });
    store().replaceWith({ hello: 'test', another: ['test'] });
    expect(store().read()).toEqual({ hello: 'test', another: ['test'] });
    expect(tests.currentMutableState).toEqual(store().read());
  })

  it('should replace root array', () => {
    const store = make('store', ['one', 'two', 'three']);
    store().replaceAll(['four', 'five', 'six', 'seven']);
    expect(store().read()).toEqual(['four', 'five', 'six', 'seven']);
    expect(tests.currentMutableState).toEqual(store().read());
  })

});
