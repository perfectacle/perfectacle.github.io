import { expect, test } from 'vitest';
import { decodeBl, encodeBl, leBytes, parseBytes, parseHex } from '../src/components/romhacking/arm-bl.ts';

// The two words are in Ghost Trick (J)'s unpacked ARM9 program (the first) and in the chapter's hook (the second).
test('BL words match the game and the hook', () => {
  expect(encodeBl(0x020125e8, 0x02012ba0)).toBe(0xeb00016c);
  expect(leBytes(0xeb00016c)).toBe('6C 01 00 EB');
  expect(encodeBl(0x020125e4, 0x02012bc4)).toBe(0xeb000176);
  expect(encodeBl(0x02012674, 0x02012bc4)).toBe(0xeb000152);
});

test('backward branches wrap the 24-bit field and decode back', () => {
  const w = encodeBl(0x02012bc4, 0x020125e4);
  expect(w >>> 24).toBe(0xeb);
  expect(decodeBl(0x02012bc4, w)).toBe(0x020125e4);
  expect(decodeBl(0x020125e8, 0xeb00016c)).toBe(0x02012ba0);
  expect(decodeBl(0, 0xe3a01004)).toBeUndefined();
});

test('targets out of reach or off word boundaries are refused', () => {
  expect(() => encodeBl(0x02000000, 0x06000000)).toThrow('±32MB');
  expect(() => encodeBl(0x02000000, 0x02000002)).toThrow('4의 배수');
  expect(parseHex('0x020125E8')).toBe(0x020125e8);
  expect(parseBytes('6c 01 00 eb')).toBe(0xeb00016c);
  expect(parseBytes('6C 01 00')).toBeNull();
});
