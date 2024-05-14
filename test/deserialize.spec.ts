import { configureDevtools } from '../src/devtools';
import { deserialize, resetLibraryState } from '../src/utility';
import { test, expect, beforeEach } from 'vitest';

beforeEach(() => {
  resetLibraryState();
  configureDevtools();
})

test('should handle null', () => {
  expect(deserialize(null)).toEqual(null);
})

test('should handle undefined', () => {
  expect(deserialize()).toEqual(undefined);
})

test(`should handle 'null'`, () => {
  expect(deserialize('null')).toEqual(null);
})

test(`should handle 'undefined'`, () => {
  expect(deserialize('undefined')).toEqual(undefined);
})

test('should handle empty strings', () => {
  expect(deserialize('')).toEqual(undefined);
})

test('should handle normal strings', () => {
  expect(deserialize('test')).toEqual('test');
})

test('should handle numbers', () => {
  expect(deserialize('33')).toEqual(33);
})

test('should handle a value of "true"', () => {
  expect(deserialize('true')).toEqual(true);
})

test('should handle a value of "false"', () => {
  expect(deserialize('false')).toEqual(false);
})

test('should handle a shallow object', () => {
  expect(deserialize(`{ str: 'str', boo: true, num: 3 }`)).toEqual({ str: "str", boo: true, num: 3 });
})

test('should handle a deep object', () => {
  expect(deserialize(`{ str: 'str', boo: true, num: 3, arr: [1, 2, 3], obj: { one: { two: { three: 3 } } } }`))
    .toEqual({ str: "str", boo: true, num: 3, arr: [1, 2, 3], obj: { one: { two: { three: 3 } } } });
})

test('should simply return the same string if it is not valid JSON', () => {
  expect(deserialize(`{ str: str, boo: true }`)).toEqual(`{ str: str, boo: true }`);
})

test('arrays may have a tailing comma', () => {
  expect(deserialize(`{ arr: [1, 2, 3], }`)).toEqual({ arr: [1, 2, 3] })
})

test('objects may have a tailing comma', () => {
  expect(deserialize(`{ obj: {one: 'test'}, }`)).toEqual({ obj: { one: 'test' } })
})