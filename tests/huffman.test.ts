import { expect, test } from 'vitest';
import {
  build,
  canonical,
  decode,
  decodeSteps,
  depths,
  encode,
  frequencies,
  isLeaf,
  leafOrder,
} from '../src/lib/huffman.ts';

test('counts code points in order of first appearance', () => {
  expect(frequencies('간장 공장 공장장')).toEqual([
    ['간', 1],
    ['장', 4],
    [' ', 2],
    ['공', 2],
  ]);
});

test('the sample sentence builds the same tree every time', () => {
  const t = build('간장 공장 공장장');
  expect(t.merges.map(m => [m.zero, m.one, m.made])).toEqual([
    [0, 2, 4],
    [3, 4, 5],
    [1, 5, 6],
  ]);
  expect(t.merges[0]?.queue).toEqual([0, 2, 3, 1]);
  expect(Object.fromEntries(t.codes)).toEqual({ 장: '0', 공: '10', 간: '110', ' ': '111' });
  // 간 110, 장 0, 빈칸 111, 공 10, 장 0, 빈칸 111, 공 10, 장 0, 장 0
  expect(encode(t, '간장 공장 공장장')).toBe('11001111001111000');
  expect(leafOrder(t)).toEqual([1, 3, 0, 2]);
  expect(depths(t).get(0)).toBe(3);
});

test('ties go to the node made first', () => {
  const t = build('abcd');
  expect(t.merges.map(m => [m.zero, m.one])).toEqual([
    [0, 1],
    [2, 3],
    [4, 5],
  ]);
  expect(Object.fromEntries(t.codes)).toEqual({ a: '00', b: '01', c: '10', d: '11' });
});

test('total length is the minimum for a known example', () => {
  // a:5 b:2 r:2 c:1 d:1 has an optimal total of 23 bits.
  const t = build('abracadabra');
  expect(encode(t, 'abracadabra')).toHaveLength(23);
});

test('codes are prefix-free and decode back', () => {
  for (const text of ['간장 공장 공장장', 'abracadabra', 'mississippi river', '아아아아아', '🙂 하하 🙂']) {
    const t = build(text);
    const codes = [...t.codes.values()];
    for (const a of codes) for (const b of codes) if (a !== b) expect(b.startsWith(a)).toBe(false);
    expect(decode(t, encode(t, text))).toBe(text);
  }
});

test('one distinct symbol still gets one bit', () => {
  const t = build('aaa');
  expect(t.codes.get('a')).toBe('0');
  expect(isLeaf(t.nodes[t.root] ?? { id: 0, weight: 0, zero: 0, one: 0 })).toBe(true);
  expect(decode(t, '000')).toBe('aaa');
});

test('decode steps walk down from the root and restart after each leaf', () => {
  const t = build('간장 공장 공장장');
  const steps = decodeSteps(t, '1100');
  expect(steps).toEqual([
    { bit: 0, node: 5 },
    { bit: 1, node: 4 },
    { bit: 2, node: 0, symbol: '간' },
    { bit: 3, node: 1, symbol: '장' },
  ]);
});

test('an empty text is an error', () => {
  expect(() => build('')).toThrow();
});

test('canonical codes follow RFC 1951 3.2.2', () => {
  // The RFC's example: ABCDEFGH with lengths (3, 3, 3, 3, 3, 2, 4, 4).
  expect(canonical([3, 3, 3, 3, 3, 2, 4, 4])).toEqual(['010', '011', '100', '101', '110', '00', '1110', '1111']);
  expect(canonical([2, 1, 3, 3])).toEqual(['10', '0', '110', '111']);
  expect(canonical([0, 1, 1])).toEqual([null, '0', '1']);
});
