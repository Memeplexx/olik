import { make } from "../src";

describe('Root', () => {

  it('should update a top-level object', () => {
    const getStore = make('state', { x: 0, y: 0 });
    getStore(s => s.x).replaceWith(3);
    expect(getStore().read()).toEqual({ x: 3, y: 0 });
  })

  it('should update a top-level array', () => {
    const getStore = make('state', new Array<{ id: number, text: string }>());
    getStore().addAfter({ id: 1, text: 'hello' });
    expect(getStore().read()).toEqual([{ id: 1, text: 'hello' }]);
  })

  it('should replace a top-level number', () => {
    const getStore = make('state', 0);
    getStore().replaceWith(3);
    expect(getStore().read()).toEqual(3);
  })

  it('should replace a top-level boolean', () => {
    const getStore = make('state', false);
    getStore().replaceWith(true);
    expect(getStore().read()).toEqual(true);
  })

  it('should replace top-level object', () => {
    const getStore = make('state', { hello: 'world', another: new Array<string>() });
    getStore().replaceWith({ hello: 'test', another: ['test'] });
    expect(getStore().read()).toEqual({ hello: 'test', another: ['test'] });
  })

  it('should replace root array', () => {
    const getStore = make('state', ['one', 'two', 'three']);
    getStore().replaceAll(['four', 'five', 'six', 'seven']);
    expect(getStore().read()).toEqual(['four', 'five', 'six', 'seven']);
  })

});
