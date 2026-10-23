import { expect, test } from 'vitest';
import { bytesOf, parseHex, toBinary, toHex, toSigned8 } from '../src/lib/numbers.ts';

test('formats bytes', () => {
  expect(toHex(0x41, 2)).toBe('41');
  expect(toBinary(0x41)).toBe('0100 0001');
  expect(toBinary(0x1234, 16)).toBe('0001 0010 0011 0100');
});

test("two's complement", () => {
  expect([0x00, 0x7f, 0x80, 0xff, 0xfe].map(toSigned8)).toEqual([0, 127, -128, -1, -2]);
});

test('parses hex in the notations the guide shows', () => {
  expect(parseHex('41', 2)).toBe(0x41);
  expect(parseHex('$ff', 2)).toBe(0xff);
  expect(parseHex('0x1F', 2)).toBe(0x1f);
  expect(parseHex('41h', 2)).toBe(0x41);
  expect(parseHex('123', 2)).toBeNull();
  expect(parseHex('g1', 2)).toBeNull();
  expect(parseHex('', 2)).toBeNull();
});

test('memory order', () => {
  // The Super Mario RPG checksum $4575 is stored as 75 45 (kr-patches docs/ANALYSIS.ko.md §0).
  expect(bytesOf(0x4575, 2, 'little')).toEqual([0x75, 0x45]);
  expect(bytesOf(0x4575, 2, 'big')).toEqual([0x45, 0x75]);
  // Otogirisou's v1.2 script start pointer $20:8000 is stored as 00 80 20.
  expect(bytesOf(0x208000, 3, 'little')).toEqual([0x00, 0x80, 0x20]);
});
