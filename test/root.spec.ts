import { makeStore } from "../src";

describe('Root', () => {

  it('should update a top-level object', () => {
    const boundingBox = makeStore({ x: 0, y: 0 });
    boundingBox.select(s => s.x).replace(3);
    expect(boundingBox.read()).toEqual({ x: 3, y: 0 });
  })

  it('should update a top-level array', () => {
    const todos = makeStore(new Array<{ id: number, text: string }>());
    todos.select().insertAfter({ id: 1, text: 'hello' });
    expect(todos.read()).toEqual([{ id: 1, text: 'hello' }]);
  })

  it('should replace a top-level number', () => {
    const number = makeStore(0);
    number.select().replace(3);
    expect(number.read()).toEqual(3);
  })

  it('should replace a top-level boolean', () => {
    const truefalse = makeStore(false);
    truefalse.select().replace(true);
    expect(truefalse.read()).toEqual(true);
  })

  it('should replace top-level object', () => {
    const store = makeStore({ hello: 'world', another: new Array<string>() });
    store.select().replace({ hello: 'test', another: ['test'] });
    expect(store.read()).toEqual({ hello: 'test', another: ['test'] });
  })

  it('should replace root array', () => {
    const store = makeStore(['one', 'two', 'three']);
    store.select().replaceAll(['four', 'five', 'six', 'seven']);
    expect(store.read()).toEqual(['four', 'five', 'six', 'seven']);
  })

});
