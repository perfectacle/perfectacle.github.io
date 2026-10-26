import { describe, expect, it } from 'vitest';
import {
  ALL_KR_PATCHES,
  GHOST_TRICK_PATCH,
  KAKUSEI_PATCH,
  KR_PATCHES,
  analysisUrl,
  downloads,
  formatBytes,
  releaseLabel,
  releaseOf,
  sourceUrl,
  trail,
} from '../src/lib/kr-patches.ts';

describe('kr-patches', () => {
  it('links each patch source to the Korean README of its game folder in perfectacle/kr-patches', () => {
    expect(KR_PATCHES.map(sourceUrl)).toEqual([
      'https://github.com/perfectacle/kr-patches/blob/main/sfc/super-mario-rpg/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/sfc/otogirisou/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/sfc/dragon-ball-z-super-gokuden-totsugeki/README.ko.md',
      'https://github.com/perfectacle/kr-patches/blob/main/sfc/dragon-ball-z-super-gokuden-kakusei/README.ko.md',
    ]);
  });

  it('links the ROM analysis document at the release tag of the served version', () => {
    expect(analysisUrl(KAKUSEI_PATCH)).toBe(
      'https://github.com/perfectacle/kr-patches/blob/dragon-ball-z-super-gokuden-kakusei-v1.4/sfc/dragon-ball-z-super-gokuden-kakusei/docs/ANALYSIS.md',
    );
  });

  it('points the Nintendo DS patch at its nds/ folder and release tag', () => {
    expect(sourceUrl(GHOST_TRICK_PATCH)).toBe(
      'https://github.com/perfectacle/kr-patches/blob/main/nds/ghost-trick/README.ko.md',
    );
    expect(analysisUrl(GHOST_TRICK_PATCH)).toBe(
      'https://github.com/perfectacle/kr-patches/blob/ghost-trick-v1.3/nds/ghost-trick/docs/ANALYSIS.md',
    );
    expect(releaseLabel(GHOST_TRICK_PATCH)).toMatch(/^닌텐도 DS · 2010년 발매 · 한글패치 v1\.3 /);
    expect(trail(GHOST_TRICK_PATCH)[1]).toEqual({ name: '닌텐도 DS', path: '/games/kr-patches/nds/' });
  });

  it('serves xdelta patches for the Nintendo DS', () => {
    expect(downloads(GHOST_TRICK_PATCH).ips).toBe(
      '/games/kr-patches/nds/ghost-trick/downloads/Ghost_Trick_K_v1_3.xdelta',
    );
    expect(releaseOf(GHOST_TRICK_PATCH, '1.1').ips).toMatch(/_v1_1\.xdelta$/);
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
  it.each(ALL_KR_PATCHES.map(patch => [patch.title, patch] as const))(
    '%s lists its releases newest first',
    (_, patch) => {
      const dates = patch.releases.map(r => r.date);
      expect(dates).toEqual([...dates].sort().reverse());
      const versions = patch.releases.map(r => r.version);
      expect(versions).toEqual([...versions].sort((a, b) => b.localeCompare(a, 'en', { numeric: true })));
      expect(new Set(patch.releases.map(r => r.version)).size).toBe(patch.releases.length);
    },
  );

  it.each(ALL_KR_PATCHES.map(patch => [patch.title, patch] as const))(
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
  it('publishes for every release the Korean ROM its patch writes, the same one the web patcher recognizes', () => {
    for (const patch of ALL_KR_PATCHES) {
      const [latest, ...older] = patch.releases;
      const { spec } = patch;
      expect(latest?.rom).toEqual({ size: spec.patchedSize ?? spec.size, ...spec.patched });
      for (const release of older) {
        const known = spec.previous?.find(previous => previous.version === `v${release.version}`);
        expect(known, `${patch.title} v${release.version}`).toMatchObject({
          crc32: release.rom.crc32,
          md5: release.rom.md5,
        });
      }
    }
  });
});
