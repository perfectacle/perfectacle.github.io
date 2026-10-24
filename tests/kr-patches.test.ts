import { describe, expect, it } from 'vitest';
import { KR_PATCHES, downloads, formatBytes, releaseOf, sourceUrl } from '../src/lib/kr-patches.ts';

describe('kr-patches', () => {
  it('links each patch source to the Korean README of its game folder in perfectacle/kr-patches', () => {
    expect(KR_PATCHES.map(sourceUrl)).toEqual([
      'https://github.com/perfectacle/kr-patches/blob/main/snes/super-mario-rpg/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/snes/otogirisou/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/snes/dragon-ball-z-super-gokuden-totsugeki/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/snes/dragon-ball-z-super-gokuden-kakusei/README.ko.md',
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

describe('patch releases', () => {
  it.each(KR_PATCHES.map(patch => [patch.title, patch] as const))('%s lists its releases newest first', (_, patch) => {
    const dates = patch.releases.map(r => r.date);
    expect(dates).toEqual([...dates].sort().reverse());
    const versions = patch.releases.map(r => r.version);
    expect(versions).toEqual([...versions].sort((a, b) => b.localeCompare(a, 'en', { numeric: true })));
    expect(new Set(patch.releases.map(r => r.version)).size).toBe(patch.releases.length);
  });

  it.each(KR_PATCHES.map(patch => [patch.title, patch] as const))(
    '%s takes its version, date and file name from the newest release',
    (_, patch) => {
      const [latest] = patch.releases;
      expect(patch.version).toBe(latest?.version);
      expect(patch.released).toBe(latest?.date);
      expect(patch.stem).toBe(`${patch.fileBase}_v${patch.version.replaceAll('.', '_')}`);
    },
  );

  it('formats a release for the patch notes and refuses an unknown version', () => {
    const [patch] = KR_PATCHES;
    if (!patch) throw new Error('no patch');
    const latest = releaseOf(patch, patch.version);
    expect(latest.latest).toBe(true);
    expect(latest.id).toBe(`release-${patch.version.replace('.', '-')}`);
    expect(latest.dateText).toMatch(/^\d{4}년 \d{1,2}월 \d{1,2}일$/);
    expect(() => releaseOf(patch, '9.9')).toThrow();
  });
});

describe('formatBytes', () => {
  it('shows a ROM size in MB, then the exact bytes', () => {
    expect(formatBytes(2097152)).toBe('2MB(2,097,152바이트)');
    expect(formatBytes(4194304)).toBe('4MB(4,194,304바이트)');
    expect(formatBytes(1572864)).toBe('1.5MB(1,572,864바이트)');
  });
});
