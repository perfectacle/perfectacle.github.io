import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import {
  GUIDE_CHAPTERS,
  chapterPath,
  neighbours,
  noteGrid,
  noteHref,
  noteLabel,
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
  expect(chapterPath({ platform: 'sfc', slug: 'banks' })).toBe('/games/romhacking/sfc/banks/');
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
    for (const n of c.notes)
      expect(noteHref(n)).toMatch(/^\/games\/romhacking\/(sfc|nds)\/notes\/[a-z-]+\/(#making-[a-z0-9-]+)?$/);
    for (const t of c.tools) {
      expect(toolHref(t)).toContain('README.ko.md#');
      expect(decodeURIComponent(toolHref(t).split('#')[1] ?? '')).toBe(t.anchor);
    }
  }
});

test('every chapter-by-game cell links note sections or says why it is empty, never both', () => {
  for (const { chapter, cells } of noteGrid()) {
    for (const cell of cells) {
      const where = `${chapter.slug} × ${cell.patch.theme}`;
      expect(cell.notes.length > 0 !== Boolean(cell.gap), where).toBe(true);
    }
    expect(new Set(chapter.gaps?.map(g => g.patch)).size, chapter.slug).toBe(chapter.gaps?.length ?? 0);
  }
});

test('mixed lists name the game once, so labels leave it out', () => {
  for (const c of readyChapters())
    for (const n of c.notes) {
      expect(n.label, noteLabel(n)).not.toMatch(/^[^:]+: /);
    }
});
