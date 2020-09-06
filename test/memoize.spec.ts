import { derive, make } from '../src/core';

describe('Memoize', () => {

  it('should derive() and cache correctly', () => {
    const getStore = make('store', {
      array: new Array<string>(),
      counter: 3,
    });
    let recalculating = 0;
    const mem = derive(
      getStore(s => s.array),
      getStore(s => s.counter)
    ).using((array, counter) => {
      recalculating++
      let result = {
        array: new Array<string>(),
        counter: 0,
      };
      for (let i = 0; i < 10000; i++) {
        result.array.push('');
        counter++;
      }
      return result;
    });
    const result = mem.read();
    mem.onChange(value => console.log('...', value));
    expect(result.array.length).toEqual(10000);
    const result2 = mem.read();
    expect(result2.array.length).toEqual(10000);
    expect(recalculating).toEqual(1);
    getStore(s => s.counter).replaceWith(4);
  })

  it('should derive() and track events')
});