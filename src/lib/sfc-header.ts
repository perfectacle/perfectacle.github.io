/**
 * Internal header size byte and checksum, ported from kr-patch-toolkit (`kr_patch/snes/header.py`) so the ROM expansion
 * widget shows the numbers `krpatch snes checksum` prints. `tests/sfc-header.test.ts` runs the toolkit's cases.
 *
 * Sizes that are not a power of two are summed the way the cartridge mirrors them: the largest power-of-two part once,
 * then the remainder repeated until it is as big as that part (fullsnes, "ROM Size / Checksum Notes").
 */

const isPow2 = (n: number) => n > 0 && (n & (n - 1)) === 0;

/** Smallest power of two that is at least `n`. */
export const roundUpPow2 = (n: number) => (n <= 1 ? 1 : 2 ** Math.ceil(Math.log2(n)));

/** Largest power of two that is at most `n`. */
const floorPow2 = (n: number) => 2 ** Math.floor(Math.log2(n));

/** The header's ROM size byte ($FFD7): 1 KB << n, rounded up. */
export const sizeByte = (size: number) => Math.ceil(Math.log2(size / 1024));

/** How many bytes the size byte claims: 1 KB << n. */
export const sizeOfByte = (n: number) => 1024 * 2 ** n;

/** A stretch of the file and how many times the checksum adds it. */
export interface ChecksumPart {
  start: number;
  length: number;
  times: number;
}

/** The toolkit's `_mirror_sum` as a list of parts: `checksum = Σ sum(part) × times`. */
export function checksumParts(size: number): ChecksumPart[] {
  const parts: ChecksumPart[] = [];
  const walk = (start: number, n: number, target: number, mult: number) => {
    if (isPow2(n)) {
      parts.push({ start, length: n, times: (target / n) * mult });
      return;
    }
    const big = floorPow2(n);
    const m = mult * (target / (2 * big));
    parts.push({ start, length: big, times: m });
    walk(start + big, n - big, big, m);
  };
  if (size > 0) walk(0, size, roundUpPow2(size), 1);
  return parts;
}

/**
 * The file offset a mirrored cartridge shows at `offset` of its ROM window. Within the rounded-up size the bigger part
 * comes first and the remainder repeats; past it the whole thing repeats.
 */
export function mirrorOffset(offset: number, size: number): number {
  let base = 0;
  let a = offset;
  let n = size;
  for (;;) {
    a %= roundUpPow2(n);
    if (isPow2(n)) return base + a;
    const big = floorPow2(n);
    if (a < big) return base + a;
    base += big;
    a -= big;
    n -= big;
  }
}

/** SFC checksum of a headerless image: the low 16 bits of the mirrored sum. */
export function checksum(rom: ArrayLike<number>): number {
  let total = 0;
  for (const { start, length, times } of checksumParts(rom.length)) {
    let sum = 0;
    for (let i = start; i < start + length; i++) sum += rom[i] ?? 0;
    total = (total + ((sum * times) % 0x10000)) % 0x10000;
  }
  return total;
}

/** The checksum with the complement/checksum fields at `header + $1C` blanked to FF FF 00 00, as the toolkit computes. */
export function computeChecksum(rom: ArrayLike<number>, header: number): number {
  const r = Array.from(rom);
  r.splice(header + 0x1c, 4, 0xff, 0xff, 0x00, 0x00);
  return checksum(r);
}
