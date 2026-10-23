import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import {
  GUIDE_CHAPTERS,
  chapterPath,
  neighbours,
  noteHref,
  readyChapters,
  toolHref,
} from '../src/components/romhacking/chapters.ts';

const root = resolve(import.meta.dirname, '..');

test('chapters are numbered 0..n in order with unique paths', () => {
  expect(GUIDE_CHAPTERS.map(c => c.order)).toEqual(GUIDE_CHAPTERS.map((_, i) => i));
  expect(new Set(GUIDE_CHAPTERS.map(chapterPath)).size).toBe(GUIDE_CHAPTERS.length);
});

test('platform-independent chapters sit directly under the guide, console chapters under their platform', () => {
  expect(chapterPath({ platform: 'common', slug: 'endian' })).toBe('/games/romhacking/endian/');
  expect(chapterPath({ platform: 'snes', slug: 'banks' })).toBe('/games/romhacking/snes/banks/');
});

test('every written chapter has a page and the unwritten ones do not', () => {
  for (const c of GUIDE_CHAPTERS) {
    const file = resolve(root, 'src/pages', `.${chapterPath(c).replace(/\/$/, '')}.astro`);
    expect(existsSync(file), file).toBe(c.ready);
  }
});

test('previous and next skip unwritten chapters', () => {
  const ready = readyChapters();
  const first = ready[0];
  const last = ready.at(-1);
  if (!first || !last) throw new Error('no chapters');
  expect(neighbours(first).prev).toBeUndefined();
  expect(neighbours(last).next).toBeUndefined();
  expect(neighbours(first).next).toBe(ready[1]);
});

test('note and toolkit links point at real anchors', () => {
  for (const c of readyChapters()) {
    for (const n of c.notes) expect(noteHref(n)).toMatch(/^\/games\/kr-patches\/sfc\/[a-z-]+\/#making(-[a-z-]+)?$/);
    for (const t of c.tools) {
      expect(toolHref(t)).toContain('README.ko.md#');
      expect(decodeURIComponent(toolHref(t).split('#')[1] ?? '')).toBe(t.anchor);
    }
  }
});
