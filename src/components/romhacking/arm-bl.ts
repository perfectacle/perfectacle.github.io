/**
 * ARM-state BL: condition AL (0xE), 0b1011 in bits 27–24, and a signed 24-bit word offset counted from the BL's own
 * address + 8. The reach is therefore ±32MB around the instruction.
 */

export const REACH = 0x2000000;

export function encodeBl(from: number, to: number): number {
  const diff = to - (from + 8);
  if (diff % 4 !== 0) throw new Error('목적지와 BL 주소의 차이가 4의 배수가 아닙니다.');
  if (diff < -REACH || diff >= REACH) throw new Error('BL이 닿는 범위(±32MB)를 넘습니다.');
  return (0xeb000000 | ((diff >> 2) & 0xffffff)) >>> 0;
}

/** The target of an ARM BL/B word, or undefined for anything else. */
export function decodeBl(from: number, word: number): number | undefined {
  if (((word >>> 25) & 7) !== 5 || word >>> 28 === 0xf) return undefined;
  let off = word & 0xffffff;
  if (off & 0x800000) off -= 0x1000000;
  return (from + 8 + off * 4) >>> 0;
}

/** The four bytes as stored in the ROM (low byte first). */
export const leBytes = (w: number) =>
  [0, 8, 16, 24].map(s => ((w >>> s) & 0xff).toString(16).toUpperCase().padStart(2, '0')).join(' ');

export const hex8 = (n: number) => `0x${(n >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;

export function parseHex(text: string): number | null {
  const t = text.trim().replace(/^0x/i, '').replace(/\s+/g, '');
  if (!/^[0-9a-f]{1,8}$/i.test(t)) return null;
  return parseInt(t, 16) >>> 0;
}

/** Four bytes typed low byte first ("6C 01 00 EB") back to the 32-bit word. */
export function parseBytes(text: string): number | null {
  const parts = text.trim().split(/\s+/);
  if (parts.length !== 4 || !parts.every(p => /^[0-9a-f]{2}$/i.test(p))) return null;
  return parts.reduce((w, p, i) => w | (parseInt(p, 16) << (8 * i)), 0) >>> 0;
}
