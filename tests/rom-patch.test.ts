import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import {
  GOKUDEN_TOTSUGEKI,
  SMRPG,
  applyIps,
  classifyRom,
  crc32,
  createPatchedRom,
  extractRomFromZip,
  hasGameHeader,
  isOtherArchive,
  isZip,
  md5,
  validateOriginal,
  type RomSpec,
} from '../src/lib/rom-patch.ts';

// Most cases hash a full 4 MB ROM, which can exceed the default timeout on a loaded machine.
vi.setConfig({ testTimeout: 30000 });

const encode = (text: string) => new TextEncoder().encode(text);
const patch = (...records: number[]) => new Uint8Array([...encode('PATCH'), ...records, ...encode('EOF')]);

it('computes standard CRC32 check values', () => {
  expect(crc32(encode(''))).toBe('00000000');
  expect(crc32(encode('123456789'))).toBe('CBF43926');
});

describe('MD5 matches independent reference values', () => {
  for (const [input, expected] of [
    ['', 'D41D8CD98F00B204E9800998ECF8427E'],
    ['a', '0CC175B9C0F1B6A831C399E269772661'],
    ['abc', '900150983CD24FB0D6963F7D28E17F72'],
    ['message digest', 'F96B697D7CB7938D525A2F31AAF161D0'],
    ['abcdefghijklmnopqrstuvwxyz', 'C3FCD3D76192E4007DFB496CCA67E13B'],
  ] as const) {
    it(`matches RFC 1321 for ${JSON.stringify(input)}`, () => {
      expect(md5(encode(input))).toBe(expected);
    });
  }
  for (const size of [55, 56, 63, 64, 65, 127, 128, 129, 4194304]) {
    it(`matches Node crypto at ${size} bytes`, () => {
      const data = Uint8Array.from({ length: size }, (_, i) => (i * 37 + 11) & 255);
      expect(md5(data)).toBe(createHash('md5').update(data).digest('hex').toUpperCase());
    });
  }
});

it('applies literal and RLE records without mutating the original', () => {
  const source = new Uint8Array(4194304);
  const result = applyIps(SMRPG, source, patch(0, 0, 1, 0, 3, 9, 8, 7, 0, 0, 8, 0, 0, 0, 3, 170));
  expect(Array.from(result.slice(0, 12))).toEqual([0, 9, 8, 7, 0, 0, 0, 0, 170, 170, 170, 0]);
  expect(source.every(value => value === 0)).toBe(true);
  expect(result.length).toBe(source.length);
});

for (const [name, data] of [
  ['invalid magic', encode('NOTPATCHEOF')],
  ['missing EOF', encode('PATCH')],
  ['truncated literal', new Uint8Array([...encode('PATCH'), 0, 0, 1, 0, 5, 2])],
  ['truncated RLE', new Uint8Array([...encode('PATCH'), 0, 0, 1, 0, 0, 0])],
  ['literal out of bounds', patch(63, 255, 255, 0, 2, 8, 9)],
  ['RLE out of bounds', patch(63, 255, 255, 0, 0, 0, 2, 170)],
  ['unexpected trailing data', new Uint8Array([...patch(), 1])],
  ['zero-length RLE', patch(0, 0, 1, 0, 0, 0, 0, 42)],
  ['changed output size trailer', new Uint8Array([...patch(), 63, 255, 255])],
] as const) {
  it(`rejects ${name}`, () => {
    expect(() => applyIps(SMRPG, new Uint8Array(4194304), data)).toThrow();
  });
}

it('refuses to patch an unidentified original', () => {
  expect(() => createPatchedRom(SMRPG, new Uint8Array(4194304), patch())).toThrow();
});

it('accepts an IPS EOF trailer only when it preserves the fixed output size', () => {
  const source = new Uint8Array(4194304);
  expect(applyIps(SMRPG, source, new Uint8Array([...patch(), 64, 0, 0]))).toEqual(source);
});

const unknownRevision = () => {
  const bytes = new Uint8Array(4194304);
  bytes.set(encode('SUPER MARIO RPG       '), 0x7fc0);
  bytes.set([0x23, 0x35, 0x0c], 0x7fd5);
  return bytes;
};

it('recognizes a plausible game header without claiming the ROM is verified', () => {
  const bytes = unknownRevision();
  expect(hasGameHeader(SMRPG, bytes)).toBe(true);
  expect(validateOriginal(SMRPG, bytes).valid).toBe(false);
  expect(hasGameHeader(SMRPG, new Uint8Array(4194304))).toBe(false);
});

it('normalizes a 512-byte copier header before computing both hashes', () => {
  const bytes = unknownRevision();
  const headered = new Uint8Array(bytes.length + 512);
  headered.fill(170, 0, 512);
  headered.set(bytes, 512);
  const result = validateOriginal(SMRPG, headered);
  expect(result.headered).toBe(true);
  expect(result.bytes).toEqual(bytes);
  expect(result.crc32).toBe(crc32(bytes));
  expect(result.md5).toBe(md5(bytes));
});

it('requires an explicit override to patch a plausible but unknown original', () => {
  const bytes = unknownRevision();
  const ips = patch(0, 0, 1, 0, 1, 42);
  expect(() => createPatchedRom(SMRPG, bytes, ips)).toThrow();
  const result = createPatchedRom(SMRPG, bytes, ips, { allowUnverified: true });
  expect(result[1]).toBe(42);
  expect(bytes[1]).toBe(0);
});

it('still blocks unrelated games, wrong sizes and damaged IPS in override mode', () => {
  expect(() => createPatchedRom(SMRPG, new Uint8Array(4194304), patch(), { allowUnverified: true })).toThrow();
  expect(() => createPatchedRom(SMRPG, new Uint8Array(10), patch(), { allowUnverified: true })).toThrow();
  expect(() => createPatchedRom(SMRPG, unknownRevision(), encode('PATCH'), { allowUnverified: true })).toThrow();
});

it('blocks a structurally invalid patch result even when override is explicit', () => {
  expect(() =>
    createPatchedRom(SMRPG, unknownRevision(), patch(0, 127, 213, 0, 1, 0), { allowUnverified: true }),
  ).toThrow();
});

const fakeRom = (region = 0x00) => {
  const rom = new Uint8Array(4194304);
  rom.set(encode('SUPER MARIO RPG'), 0x7fc0);
  rom[0x7fd5] = 0x23;
  rom[0x7fd6] = 0x35;
  rom[0x7fd7] = 0x0c;
  rom[0x7fd9] = region;
  return rom;
};

describe('classifyRom', () => {
  it('sorts files by size before hashing', () => {
    expect(classifyRom(SMRPG, new Uint8Array(1000)).kind).toBe('too-small');
    expect(classifyRom(SMRPG, new Uint8Array(2097152)).kind).toBe('truncated');
    expect(classifyRom(SMRPG, new Uint8Array(4194305)).kind).toBe('wrong-size');
    expect(classifyRom(SMRPG, new Uint8Array(8388608)).kind).toBe('wrong-size');
  });

  it('tells other games, other regions and modified Japanese dumps apart', () => {
    expect(classifyRom(SMRPG, new Uint8Array(4194304)).kind).toBe('wrong-game');
    expect(classifyRom(SMRPG, fakeRom(0x01)).kind).toBe('other-region');
    expect(classifyRom(SMRPG, fakeRom()).kind).toBe('different');
  });

  it('ignores a 512-byte copier header silently', () => {
    const headered = new Uint8Array(4194816);
    headered.set(fakeRom(), 512);
    const verdict = classifyRom(SMRPG, headered);
    expect(verdict.kind).toBe('different');
    if (verdict.kind === 'different') expect(verdict.bytes.length).toBe(4194304);
  });
});

const zipOf = (entries: { name: string; data: Uint8Array; method: 0 | 8 }[]) => {
  const locals: number[] = [];
  const central: number[] = [];
  const u16 = (v: number) => [v & 255, (v >> 8) & 255];
  const u32 = (v: number) => [...u16(v & 0xffff), ...u16(v >>> 16)];
  for (const entry of entries) {
    const name = [...encode(entry.name)];
    const body = [...(entry.method === 8 ? deflateRawSync(entry.data) : entry.data)];
    const offset = locals.length;
    const common = [...u16(20), ...u16(0), ...u16(entry.method), ...u32(0), ...u32(0), ...u32(body.length)];
    locals.push(
      ...u32(0x04034b50),
      ...common,
      ...u32(entry.data.length),
      ...u16(name.length),
      ...u16(0),
      ...name,
      ...body,
    );
    central.push(...u32(0x02014b50), ...u16(20), ...common, ...u32(entry.data.length), ...u16(name.length));
    central.push(...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name);
  }
  const end = [...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length)];
  end.push(...u32(central.length), ...u32(locals.length), ...u16(0));
  return new Uint8Array([...locals, ...central, ...end]);
};

describe('zip handling', () => {
  const rom = Uint8Array.from({ length: 4096 }, (_, i) => (i * 7) & 255);

  it('recognizes archives by signature or name', () => {
    expect(isZip(zipOf([{ name: 'a.sfc', data: rom, method: 0 }]))).toBe(true);
    expect(isZip(new Uint8Array(4), 'game.ZIP')).toBe(true);
    expect(isOtherArchive(new Uint8Array([0x52, 0x61, 0x72, 0x21]))).toBe(true);
    expect(isOtherArchive(new Uint8Array(4), 'game.7z')).toBe(true);
    expect(isOtherArchive(new Uint8Array(4), 'game.sfc')).toBe(false);
  });

  it('extracts the single ROM from stored and deflated entries', async () => {
    for (const method of [0, 8] as const) {
      const zip = zipOf([
        { name: 'readme.txt', data: encode('hi'), method },
        { name: 'Super Mario RPG (J).sfc', data: rom, method },
      ]);
      const found = await extractRomFromZip(SMRPG, zip);
      expect(found?.name).toBe('Super Mario RPG (J).sfc');
      expect(Array.from(found?.bytes ?? [])).toEqual(Array.from(rom));
    }
  });

  it('asks for manual unzip when there is no ROM or more than one', async () => {
    expect(
      await extractRomFromZip(SMRPG, zipOf([{ name: 'readme.txt', data: encode('hi'), method: 0 }])),
    ).toBeUndefined();
    const two = zipOf([
      { name: 'a.sfc', data: rom, method: 0 },
      { name: 'b.smc', data: rom, method: 0 },
    ]);
    expect(await extractRomFromZip(SMRPG, two)).toBeUndefined();
    expect(await extractRomFromZip(SMRPG, encode('not a zip at all, just text'))).toBeUndefined();
  });
});

const gameRom = (spec: RomSpec) => {
  const rom = new Uint8Array(spec.size);
  rom.set(encode(spec.header.title), 0x7fc0);
  rom.set([spec.header.mapMode, spec.header.cartType, spec.header.romSize], 0x7fd5);
  return rom;
};

describe('Super Gokuden: Totsugeki-hen (2 MB)', () => {
  it('sorts files by its own size', () => {
    expect(classifyRom(GOKUDEN_TOTSUGEKI, new Uint8Array(1000)).kind).toBe('too-small');
    expect(classifyRom(GOKUDEN_TOTSUGEKI, new Uint8Array(1572864)).kind).toBe('truncated');
    expect(classifyRom(GOKUDEN_TOTSUGEKI, new Uint8Array(4194304)).kind).toBe('wrong-size');
    expect(classifyRom(GOKUDEN_TOTSUGEKI, new Uint8Array(2097152)).kind).toBe('wrong-game');
  });

  it('accepts its header with or without a copier header and rejects the other game', () => {
    expect(classifyRom(GOKUDEN_TOTSUGEKI, gameRom(GOKUDEN_TOTSUGEKI)).kind).toBe('different');
    const headered = new Uint8Array(2097152 + 512);
    headered.set(gameRom(GOKUDEN_TOTSUGEKI), 512);
    const verdict = classifyRom(GOKUDEN_TOTSUGEKI, headered);
    expect(verdict.kind).toBe('different');
    if (verdict.kind === 'different') expect(verdict.bytes.length).toBe(2097152);
    expect(hasGameHeader(GOKUDEN_TOTSUGEKI, gameRom(SMRPG))).toBe(false);
    expect(hasGameHeader(SMRPG, gameRom(GOKUDEN_TOTSUGEKI))).toBe(false);
  });

  it('mentions its own size when a patch would grow the ROM', () => {
    expect(() => applyIps(GOKUDEN_TOTSUGEKI, new Uint8Array(2097152), patch(32, 0, 0, 0, 1, 1))).toThrow('2MB');
  });
});
