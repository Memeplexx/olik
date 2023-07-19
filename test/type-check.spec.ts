import { is, mustBe } from '../src/type-check';
import { expect, test } from 'vitest';

test('', () => {
  const arg = 2 as unknown;
  expect(is.number(arg)).toEqual(true);
})

test('', () => {
  const arg = '2' as unknown;
  expect(is.string(arg)).toEqual(true);
})

test('', () => {
  const arg = {} as unknown;
  expect(is.record(arg)).toEqual(true);
})

test('', () => {
  const arg = [] as unknown;
  expect(is.array(arg)).toEqual(true);
})

test('', () => {
  const arg = 2 as unknown;
  expect(is.primitive(arg)).toEqual(true);
})

test('', () => {
  const arg = '2' as unknown;
  expect(is.primitive(arg)).toEqual(true);
})

test('', () => {
  const arg = false as unknown;
  expect(is.primitive(arg)).toEqual(true);
})

test('', () => {
  const arg = () => null as unknown;
  expect(is.function(arg)).toEqual(true);
})

test('', () => {
  const arg = [1, 2];
  expect(is.arrayOf.number(arg)).toEqual(true);
})

test('', () => {
  const arg = ['1', '2'];
  expect(is.arrayOf.string(arg)).toEqual(true);
})

test('', () => {
  const arg = [false, true];
  expect(is.arrayOf.boolean(arg)).toEqual(true);
})

test('', () => {
  const arg = [{}, {}];
  expect(is.arrayOf.record(arg)).toEqual(true);
})

test('', () => {
  const arg = [[], []];
  expect(is.arrayOf.array(arg)).toEqual(true);
})

test('', () => {
  const arg = { a: 1, b: 2 };
  mustBe.record<number>(arg);
})
