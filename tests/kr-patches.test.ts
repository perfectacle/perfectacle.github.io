import { describe, expect, it } from 'vitest';
import { KR_PATCHES, downloads, sourceUrl } from '../src/lib/kr-patches.ts';

describe('kr-patches', () => {
  it('links each patch source to its game folder at the release tag in perfectacle/kr-patches', () => {
    expect(KR_PATCHES.map(sourceUrl)).toEqual([
      'https://github.com/perfectacle/kr-patches/tree/super-mario-rpg-v1.2/snes/super-mario-rpg',
      'https://github.com/perfectacle/kr-patches/tree/dragon-ball-z-super-gokuden-totsugeki-v1.2/snes/dragon-ball-z-super-gokuden-totsugeki',
      'https://github.com/perfectacle/kr-patches/tree/dragon-ball-z-super-gokuden-kakusei-v1.3/snes/dragon-ball-z-super-gokuden-kakusei',
      'https://github.com/perfectacle/kr-patches/tree/otogirisou-v1.2/snes/otogirisou',
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
