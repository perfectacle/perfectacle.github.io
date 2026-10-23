import { describe, expect, it } from 'vitest';
import { KR_PATCHES, downloads, sourceUrl } from '../src/lib/kr-patches.ts';

describe('kr-patches', () => {
  it('links each patch source to the Korean README of its game folder in perfectacle/kr-patches', () => {
    expect(KR_PATCHES.map(sourceUrl)).toEqual([
      'https://github.com/perfectacle/kr-patches/blob/main/snes/super-mario-rpg/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/snes/dragon-ball-z-super-gokuden-totsugeki/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/snes/dragon-ball-z-super-gokuden-kakusei/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/snes/otogirisou/README.ko.md',
    ]);
  });

  it('serves only the IPS patches from the blog', () => {
    for (const patch of KR_PATCHES) {
      expect(
        Object.values(downloads(patch))
          .filter(Boolean)
          .every(url => url?.endsWith('.ips')),
      ).toBe(true);
    }
  });
});
