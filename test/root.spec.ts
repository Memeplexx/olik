import { make } from "../src";

describe('Root', () => {

  it('should update a top-level object', () => {
    const boundingBox = make('state', { x: 0, y: 0 });
    boundingBox(s => s.x).replace(3);
    expect(boundingBox().read()).toEqual({ x: 3, y: 0 });
  })

  it('should update a top-level array', () => {
    const todos = make('state', new Array<{ id: number, text: string }>());
    todos().insertAfter({ id: 1, text: 'hello' });
    expect(todos().read()).toEqual([{ id: 1, text: 'hello' }]);
  })

  it('should replace a top-level number', () => {
    const number = make('state', 0);
    number().replace(3);
    expect(number().read()).toEqual(3);
  })

  it('should replace a top-level boolean', () => {
    const truefalse = make('state', false);
    truefalse().replace(true);
    expect(truefalse().read()).toEqual(true);
  })

  it('should replace top-level object', () => {
    const store = make('state', { hello: 'world', another: new Array<string>() });
    store().replace({ hello: 'test', another: ['test'] });
    expect(store().read()).toEqual({ hello: 'test', another: ['test'] });
  })

  it('should replace root array', () => {
    const numbers = make('state', ['one', 'two', 'three']);
    numbers().replaceAll(['four', 'five', 'six', 'seven']);
    expect(numbers().read()).toEqual(['four', 'five', 'six', 'seven']);
  })

});
