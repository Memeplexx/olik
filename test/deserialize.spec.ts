import { is } from '../src/type-check';
import { deserialize, resetLibraryState } from '../src/utility';

describe('deserialize', () => {

  beforeEach(() => {
    resetLibraryState();
  })

  it('should handle null', () => {
    expect(deserialize(null)).toEqual(null);
  })

  it('should handle undefined', () => {
    expect(deserialize()).toEqual(undefined);
  })

  it(`should handle 'null'`, () => {
    expect(deserialize('null')).toEqual(null);
  })

  it(`should handle 'undefined'`, () => {
    expect(deserialize('undefined')).toEqual(undefined);
  })

  it('should handle empty strings', () => {
    expect(deserialize('')).toEqual('');
  })

  it('should handle normal strings', () => {
    expect(deserialize('test')).toEqual('test');
  })

  it('should handle numbers', () => {
    expect(deserialize('33')).toEqual(33);
  })

  it('should handle a value of "true"', () => {
    expect(deserialize('true')).toEqual(true);
  })

  it('should handle a value of "false"', () => {
    expect(deserialize('false')).toEqual(false);
  })

  it('should handle a shallow object', () => {
    expect(deserialize(`{ str: 'str', boo: true, num: 3 }`)).toEqual({ str: "str", boo: true, num: 3 });
  })

  it('should handle a deep object', () => {
    expect(deserialize(`{ str: 'str', boo: true, num: 3, arr: [1, 2, 3], obj: { one: { two: { three: 3 } } } }`))
      .toEqual({ str: "str", boo: true, num: 3, arr: [1, 2, 3], obj: { one: { two: { three: 3 } } } });
  })

  it('should simply return the same string if it is not valid JSON', () => {
    expect(deserialize(`{ str: str, boo: true }`)).toEqual(`{ str: str, boo: true }`);
  })

  it('arrays may have a tailing comma', () => {
    expect(deserialize(`{ arr: [1, 2, 3], }`)).toEqual({ arr: [1, 2, 3] })
  })

  it('objects may have a tailing comma', () => {
    expect(deserialize(`{ obj: {one: 'test'}, }`)).toEqual({ obj: { one: 'test' } })
  })

});