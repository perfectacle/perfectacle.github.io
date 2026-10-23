/** Number formatting shared by the guide's byte widgets. */

export const toHex = (n: number, digits: number) => n.toString(16).toUpperCase().padStart(digits, '0');

/** `0100 0001`: binary in groups of four, one group per hex digit. */
export const toBinary = (n: number, bits = 8) =>
  n
    .toString(2)
    .padStart(bits, '0')
    .replace(/(.{4})(?=.)/g, '$1 ');

/** The same byte read as a two's-complement signed number (-128 to 127). */
export const toSigned8 = (n: number) => (n & 0x80 ? (n & 0xff) - 0x100 : n & 0xff);

/** Reads `41`, `$41`, `0x41` or `41h` as a hex number no wider than `maxDigits`. Returns null otherwise. */
export function parseHex(text: string, maxDigits: number): number | null {
  const t = text
    .trim()
    .replace(/^(\$|0x)/i, '')
    .replace(/h$/i, '');
  if (!new RegExp(`^[0-9a-f]{1,${maxDigits}}$`, 'i').test(t)) return null;
  return parseInt(t, 16);
}

/** Bytes of `value` in memory order. `size` is the number of bytes (2 or 3). */
export function bytesOf(value: number, size: number, order: 'little' | 'big'): number[] {
  const little = Array.from({ length: size }, (_, i) => Math.floor(value / 256 ** i) % 256);
  return order === 'little' ? little : little.reverse();
}
