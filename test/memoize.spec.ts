import { deriveFrom, make } from '../src/core';

describe('Memoize', () => {

  it('should deriveFrom() corrrectly', () => {
    const getStore = make('store', {
      array: ['1', '2'],
      counter: 3,
    });
    const eee = deriveFrom(
      getStore(s => s.array),
      getStore(s => s.counter),
    ).usingExpensiveCalc((arr, somenum) => {
      return arr.concat(somenum.toString())
    });
    const result = eee.read();
    expect(result).toEqual(['1', '2', '3']);
  })

  it('should deriveFrom() and cache correctly', () => {
    const getStore = make('store', {
      array: new Array<string>(),
      counter: 3,
    });
    let recalculating = 0;
    const mem = deriveFrom(
      getStore(s => s.array),
      getStore(s => s.counter)
    ).usingExpensiveCalc((array, counter) => {
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
    expect(result.array.length).toEqual(10000);
    const result2 = mem.read();
    expect(result2.array.length).toEqual(10000);
    expect(recalculating).toEqual(1);
    getStore(s => s.counter).replaceWith(4);
  })

  // it('test', () => {
  //   const getStore = make('store', {
  //     array: [{id: 1, text: 'one'}]
  //   });
  //   const res = getStore(s => s.array.find(e => e.id === 1)).patchWith({text: 'ddd'});
  //   console.log('...', res);
  // })

  
});