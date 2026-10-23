/**
 * LZSS with a 12-bit distance and a 4-bit length, ported from kr-patch-toolkit (`kr_patch/lzss.py`). This is the format
 * of the Dragon Ball Z Super Gokuden title graphics, so the guide's step-through shows what `krpatch lzss` reads.
 * `tests/lzss.test.ts` runs the toolkit's own cases and compares compressed bytes with the toolkit's output.
 *
 * Stream: u16 LE output size, then groups of 8 items led by a flag byte read from bit 0 up. Flag 1: one literal byte.
 * Flag 0: a u16 LE word; length = (word & 0xF) + 3, source = output position - (word >> 4). Positions before the start
 * of the output read as zero.
 */

export const MIN_LEN = 3;
export const MAX_LEN = 18;
export const MAX_DIST = 0xfff;

export class LzssError extends Error {}

export type LzssStep =
  | { kind: 'size'; at: number; size: number }
  | { kind: 'flags'; at: number; value: number }
  | { kind: 'literal'; at: number; bit: number; outAt: number; byte: number }
  | {
      kind: 'copy';
      at: number;
      bit: number;
      outAt: number;
      word: number;
      dist: number;
      len: number;
      /** First source position; negative positions are the zeros before the output. */
      src: number;
      bytes: number[];
    };

export interface LzssTrace {
  steps: LzssStep[];
  data: number[];
  /** Compressed bytes read, header included. */
  length: number;
  /** Only with `partial`: the stream ended before `size` bytes came out. */
  truncated: boolean;
}

const hex = (n: number) => `0x${n.toString(16)}`;

/**
 * Every read of the stream, in order. Throws LzssError where the toolkit raises ValueError; with `partial` a stream that
 * stops early (an excerpt of a longer one) returns the steps read so far instead.
 */
export function trace(rom: ArrayLike<number>, off = 0, partial = false): LzssTrace {
  let i = off;
  let ranOut = false;
  const read = () => {
    ranOut = i >= rom.length;
    if (ranOut) throw new LzssError(`LZSS stream at ${hex(off)} is truncated at offset ${hex(i)}`);
    return rom[i++] ?? 0;
  };
  const steps: LzssStep[] = [];
  const out: number[] = [];
  const size = read() | (read() << 8);
  steps.push({ kind: 'size', at: off, size });
  let flags = 0;
  let bits = 0;
  let lastWhole = i;
  try {
    while (out.length < size) {
      if (bits === 0) {
        const at = i;
        flags = read();
        bits = 8;
        steps.push({ kind: 'flags', at, value: flags });
      }
      const bit = 8 - bits;
      bits -= 1;
      const isLiteral = flags & 1;
      flags >>= 1;
      const at = i;
      if (isLiteral) {
        const byte = read();
        steps.push({ kind: 'literal', at, bit, outAt: out.length, byte });
        out.push(byte);
      } else {
        const word = read() | (read() << 8);
        const dist = word >> 4;
        if (dist === 0) throw new LzssError(`LZSS copy with distance 0 at offset ${hex(at)}`);
        const len = (word & 0xf) + MIN_LEN;
        const outAt = out.length;
        const src = outAt - dist;
        const bytes: number[] = [];
        for (let k = 0; k < len; k++) {
          const p = src + k;
          const v = p >= 0 ? (out[p] ?? 0) : 0;
          out.push(v);
          bytes.push(v);
        }
        steps.push({ kind: 'copy', at, bit, outAt, word, dist, len, src, bytes });
      }
      lastWhole = i;
    }
  } catch (e) {
    if (!partial || !ranOut) throw e;
    return { steps, data: out, length: lastWhole - off, truncated: true };
  }
  return { steps, data: out.slice(0, size), length: i - off, truncated: false };
}

/** (data, compressed length) of the stream at `off`, like the toolkit's `decompress`. */
export function decompress(rom: ArrayLike<number>, off = 0): { data: number[]; length: number } {
  const { data, length } = trace(rom, off);
  return { data, length };
}

/** Greedy LZSS with a brute-force search, byte for byte the toolkit's `compress` (inputs are small). */
export function compress(data: ArrayLike<number>): number[] {
  const n = data.length;
  if (n > 0xffff) throw new LzssError('LZSS stream holds at most 65535 bytes');
  const at = (k: number) => data[k] ?? 0;
  const out = [n & 0xff, n >> 8];
  let pos = 0;
  while (pos < n) {
    const flagAt = out.length;
    out.push(0);
    let flags = 0;
    for (let bit = 0; bit < 8; bit++) {
      if (pos >= n) break;
      let bestLen = 0;
      let bestDist = 0;
      const maxlen = Math.min(MAX_LEN, n - pos);
      for (let dist = 1; dist <= Math.min(pos, MAX_DIST); dist++) {
        const s = pos - dist;
        let l = 0;
        while (l < maxlen && at(s + l) === at(pos + l)) l++;
        if (l > bestLen) {
          bestLen = l;
          bestDist = dist;
          if (l === maxlen) break;
        }
      }
      // A copy from position -1 reads the virtual zeros before the buffer, then data[0..].
      if (bestLen < maxlen && pos < MAX_DIST) {
        const dist = pos + 1;
        const src = pos - dist;
        let lz = 0;
        while (lz < maxlen) {
          const v = src + lz >= 0 ? at(src + lz) : 0;
          if (v !== at(pos + lz)) break;
          lz++;
        }
        if (dist <= MAX_DIST && lz > bestLen) {
          bestLen = lz;
          bestDist = dist;
        }
      }
      if (bestLen >= MIN_LEN) {
        const w = (bestDist << 4) | (bestLen - MIN_LEN);
        out.push(w & 0xff, w >> 8);
        pos += bestLen;
      } else {
        flags |= 1 << bit;
        out.push(at(pos));
        pos += 1;
      }
    }
    out[flagAt] = flags;
  }
  return out;
}
