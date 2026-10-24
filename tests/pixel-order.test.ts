import { expect, test } from 'vitest';
import {
  GAME_ORDER,
  GLYPHS,
  SIZE,
  decode,
  orderLabel,
  permutations,
  ranked,
} from '../src/components/romhacking/pixel-order.ts';

test('the four glyphs are whole 96-byte records at glyph number × 96', () => {
  expect(GLYPHS.map(g => g.char).join('')).toBe('고스트릭');
  for (const g of GLYPHS) {
    expect(g.bytes).toHaveLength(SIZE);
    expect(g.at).toBe(g.id * SIZE);
  }
});

test('there are 24 orders and the game’s one draws the smoothest strokes', () => {
  expect(new Set(permutations([0, 2, 4, 6]).map(orderLabel)).size).toBe(24);
  const list = ranked();
  expect(list[0]?.order).toEqual([...GAME_ORDER]);
  expect(list[0]?.score).toBe(299);
  expect(list[1]?.score).toBe(349);
  // krpatch linear's two orders are both wrong for this font
  const at = (o: number[]) => list.findIndex(r => orderLabel(r.order) === orderLabel(o));
  expect(at([0, 2, 4, 6])).toBeGreaterThan(0);
  expect(at([6, 4, 2, 0])).toBeGreaterThan(0);
});

test('a byte splits into pixels by the chosen bit positions', () => {
  // 4F = 01 00 11 11: bits 7–6 = 1, 5–4 = 0, 3–2 = 3, 1–0 = 3
  const row = new Uint8Array(SIZE);
  row[0] = 0x4f;
  expect(decode(row, GAME_ORDER)[0]?.slice(0, 4)).toEqual([0, 1, 3, 3]);
  expect(decode(row, [6, 4, 2, 0])[0]?.slice(0, 4)).toEqual([1, 0, 3, 3]);
  expect(decode(row, [0, 2, 4, 6])[0]?.slice(0, 4)).toEqual([3, 3, 0, 1]);
});
