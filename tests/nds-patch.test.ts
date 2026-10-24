import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  GHOST_TRICK,
  NdsPatchOutputHashError,
  classifyNdsRom,
  createPatchedNdsRom,
  hasGameHeader,
  untrim,
  type NdsSpec,
} from '../src/lib/nds-patch.ts';
import { crc32, md5 } from '../src/lib/rom-patch.ts';
import { fakeRoms } from './nds-fixture.ts';

const { source, target, used } = fakeRoms();
const patch = new Uint8Array(readFileSync(new URL('./fixtures/nds/patch.xdelta', import.meta.url)));
const print = (bytes: Uint8Array) => ({ crc32: crc32(bytes), md5: md5(bytes) });

const SPEC: NdsSpec = {
  ...GHOST_TRICK,
  size: source.length,
  patchedSize: target.length,
  original: print(source),
  patched: print(target),
  previous: [],
};

describe('classifyNdsRom', () => {
  it('accepts the full Japanese dump', () => {
    expect(classifyNdsRom(SPEC, source).kind).toBe('original');
  });

  it('fills a trimmed dump back with 0xFF', () => {
    const trimmed = source.slice(0, used);
    const verdict = classifyNdsRom(SPEC, trimmed);
    expect(verdict.kind).toBe('original');
    if (verdict.kind === 'original') expect(verdict.bytes).toEqual(source);
  });

  it('calls a dump cut inside the used area truncated', () => {
    expect(classifyNdsRom(SPEC, source.slice(0, used - 1)).kind).toBe('truncated');
  });

  it('recognises the patched and earlier Korean ROMs', () => {
    expect(classifyNdsRom(SPEC, target).kind).toBe('already-korean');
    const old = target.slice();
    old[0x5000] = 1;
    const spec = { ...SPEC, previous: [{ version: 'v1.1', size: old.length, ...print(old) }] };
    expect(classifyNdsRom(spec, old)).toEqual({ kind: 'old-korean', version: 'v1.1' });
  });

  it('tells another game, another region and a changed dump apart', () => {
    const other = source.slice();
    other.set(new TextEncoder().encode('OTHER GAME'), 0);
    expect(classifyNdsRom(SPEC, other).kind).toBe('wrong-game');
    const usa = source.slice();
    usa[15] = 'E'.charCodeAt(0);
    expect(classifyNdsRom(SPEC, usa).kind).toBe('other-region');
    const changed = source.slice();
    changed[0x3000] = (changed[0x3000] ?? 0) ^ 1;
    expect(classifyNdsRom(SPEC, changed).kind).toBe('different');
    expect(classifyNdsRom(SPEC, new Uint8Array(100)).kind).toBe('too-small');
    expect(classifyNdsRom(SPEC, new Uint8Array(source.length * 2).fill(0)).kind).toBe('wrong-game');
  });

  it('does not untrim when bytes past the used area are not filler', () => {
    const big = new Uint8Array(source.length + 1);
    expect(untrim(SPEC, big)).toBeUndefined();
  });
});

describe('createPatchedNdsRom', () => {
  it('applies the xdelta patch and checks the result', () => {
    expect(createPatchedNdsRom(SPEC, { bytes: source, crc32: crc32(source) }, patch)).toEqual(target);
  });

  it('refuses a changed source unless asked to go on', () => {
    const changed = source.slice();
    changed[0x3000] = (changed[0x3000] ?? 0) ^ 1;
    const checked = { bytes: changed, crc32: crc32(changed) };
    expect(() => createPatchedNdsRom(SPEC, checked, patch)).toThrow('손대지 않은 일본판');
    // The patch checks each window it writes, so a changed byte the patch copies is still caught.
    expect(() => createPatchedNdsRom(SPEC, checked, patch, { allowUnverified: true })).toThrow('원본이 아닙니다');
  });

  it('reports a result that does not match the published checksum', () => {
    const spec = { ...SPEC, patched: { crc32: '00000000', md5: '0'.repeat(32) } };
    expect(() => createPatchedNdsRom(spec, { bytes: source, crc32: crc32(source) }, patch)).toThrow(
      NdsPatchOutputHashError,
    );
  });

  it('keeps the header check for the real spec', () => {
    expect(hasGameHeader(GHOST_TRICK, source)).toBe(true);
  });
});
