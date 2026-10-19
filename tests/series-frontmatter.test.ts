import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listPostDirs, POSTS_ROOT } from '../src/lib/post-files.ts';

// Reads the real posts: a missing or duplicated seriesOrder would silently reorder a series on the site.
const parts = listPostDirs().flatMap(dir => {
  const md = readFileSync(join(dir, 'index.md'), 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '';
  const series = /^series:\s*'((?:[^']|'')*)'\s*$/m.exec(fm)?.[1]?.replaceAll("''", "'");
  const order = /^seriesOrder:\s*(\S+)\s*$/m.exec(fm)?.[1];
  const hasSeriesKey = /^series:/m.test(fm);
  return hasSeriesKey || order ? [{ post: relative(POSTS_ROOT, dir), series, order }] : [];
});

describe('series frontmatter', () => {
  it('finds the series posts', () => {
    expect(parts.length).toBeGreaterThan(0);
  });

  it('gives every series post a quoted series name and a seriesOrder', () => {
    const broken = parts.filter(p => !p.series || p.order === undefined).map(p => p.post);
    expect(broken).toEqual([]);
  });

  it('numbers each series exactly 1..n with no gaps or repeats', () => {
    const bySeries = new Map<string, number[]>();
    for (const p of parts) bySeries.set(p.series ?? '', [...(bySeries.get(p.series ?? '') ?? []), Number(p.order)]);
    for (const [name, orders] of bySeries) {
      const sorted = orders.toSorted((a, b) => a - b);
      expect(sorted, name).toEqual(Array.from({ length: orders.length }, (_, i) => i + 1));
    }
  });
});
