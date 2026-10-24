import { expect, test } from 'vitest';
import { hex16, inBottom, pointer } from '../src/components/romhacking/touch-point.ts';

// Same arithmetic as kr-patches nds/ghost-trick/tools/play.py.
test('bottom-screen points map onto the pointer range of both screens', () => {
  expect(pointer(0, 0)).toEqual({ x: -32640, y: 85 });
  expect(pointer(128, 96)).toEqual({ x: 128, y: 16469 });
  expect(pointer(255, 191)).toEqual({ x: 32640, y: 32682 });
});

test('only whole points inside the bottom screen are touches', () => {
  expect(inBottom(0, 0)).toBe(true);
  expect(inBottom(255, 191)).toBe(true);
  expect(inBottom(256, 0)).toBe(false);
  expect(inBottom(0, -1)).toBe(false);
  expect(inBottom(1.5, 2)).toBe(false);
});

test('pointer values print as 16-bit two’s complement', () => {
  expect(hex16(-32640)).toBe('0x8080');
  expect(hex16(85)).toBe('0x0055');
});
