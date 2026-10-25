import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import {
  GUIDE_CHAPTERS,
  TRACKS,
  TRACK_ORDER,
  chapterByKey,
  chapterLabel,
  chapterPath,
  fillChapterRefs,
  neighbours,
  noteGrid,
  noteHref,
  noteLabel,
  readyChapters,
  toolHref,
  trackChapters,
  trackOfPath,
  trackPatches,
} from '../src/components/romhacking/chapters.ts';

const root = resolve(import.meta.dirname, '..');

test('each track numbers its chapters 1..n in order, and paths are unique', () => {
  for (const track of TRACK_ORDER) {
    const chapters = GUIDE_CHAPTERS.filter(c => c.platform === track);
    expect(
      chapters.map(c => c.number),
      track,
    ).toEqual(chapters.map((_, i) => i + 1));
  }
  expect(GUIDE_CHAPTERS.map(c => c.platform)).toEqual(
    [...GUIDE_CHAPTERS.map(c => c.platform)].sort((a, b) => TRACK_ORDER.indexOf(a) - TRACK_ORDER.indexOf(b)),
  );
  expect(new Set(GUIDE_CHAPTERS.map(chapterPath)).size).toBe(GUIDE_CHAPTERS.length);
});

test('a chapter is 「N장」 in its own track and carries the track name elsewhere', () => {
  const banks = chapterByKey('sfc/banks');
  expect(chapterLabel(banks, 'sfc')).toBe('2장');
  expect(chapterLabel(banks, 'nds')).toBe('슈퍼 패미콤 2장');
  expect(chapterLabel(banks)).toBe('슈퍼 패미콤 2장');
  expect(chapterLabel(chapterByKey('nds/filesystem'), 'common')).toBe('DS 2장');
  expect(chapterLabel(chapterByKey('common/endian'), 'sfc')).toBe('공통 3장');
});

test('a guide path tells its track; pages outside the tracks have none', () => {
  expect(trackOfPath('/games/romhacking/endian/')).toBe('common');
  expect(trackOfPath('/games/romhacking/common/')).toBe('common');
  expect(trackOfPath('/games/romhacking/sfc/banks/')).toBe('sfc');
  expect(trackOfPath('/games/romhacking/sfc/notes/otogirisou/')).toBe('sfc');
  expect(trackOfPath('/games/romhacking/nds/')).toBe('nds');
  expect(trackOfPath('/games/romhacking/')).toBeUndefined();
  expect(trackOfPath('/games/romhacking/glossary/')).toBeUndefined();
  expect(trackOfPath('/games/kr-patches/sfc/otogirisou/')).toBeUndefined();
});

test('track contents pages sit under the guide, apart from every chapter', () => {
  for (const id of TRACK_ORDER) {
    expect(TRACKS[id].path).toBe(`/games/romhacking/${id}/`);
    expect(GUIDE_CHAPTERS.map(chapterPath)).not.toContain(TRACKS[id].path);
  }
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

test('previous and next stay within the track', () => {
  for (const track of TRACK_ORDER) {
    const ready = trackChapters(track);
    const first = ready[0];
    const last = ready.at(-1);
    if (!first || !last) throw new Error(`no chapters in ${track}`);
    expect(neighbours(first).prev).toBeUndefined();
    expect(neighbours(last).next).toBeUndefined();
    expect(neighbours(first).next).toBe(ready[1]);
    for (const c of ready) {
      const { prev, next } = neighbours(c);
      for (const n of [prev, next]) if (n) expect(n.platform).toBe(track);
    }
  }
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
  for (const track of TRACK_ORDER) {
    for (const { chapter, cells } of noteGrid(track)) {
      expect(cells.map(c => c.patch)).toEqual(trackPatches(track));
      for (const cell of cells) {
        const where = `${chapter.slug} × ${cell.patch.theme}`;
        expect(cell.notes.length > 0 !== Boolean(cell.gap), where).toBe(true);
      }
      expect(new Set(chapter.gaps?.map(g => g.patch)).size, chapter.slug).toBe(chapter.gaps?.length ?? 0);
      // A reason for a game the track's table does not show would never be read.
      for (const g of chapter.gaps ?? [])
        expect(trackPatches(track), `${chapter.slug} × ${g.patch.theme}`).toContain(g.patch);
    }
  }
});

test('console tracks list only their own games; the common track lists every game', () => {
  expect(trackPatches('common').length).toBeGreaterThan(trackPatches('sfc').length);
  expect(trackPatches('sfc').every(p => p.platform === 'sfc')).toBe(true);
  expect(trackPatches('nds').every(p => p.platform === 'nds')).toBe(true);
});

test('chapter references in reasons name real chapters and leave no hand-typed number', () => {
  for (const c of GUIDE_CHAPTERS)
    for (const g of c.gaps ?? []) {
      const filled = fillChapterRefs(g.why, c.platform);
      expect(filled, `${c.slug} × ${g.patch.theme}`).not.toMatch(/[{}]/);
      expect(g.why.replace(/\{[^}]+\}/g, ''), `${c.slug} × ${g.patch.theme}`).not.toMatch(/\d+장/);
    }
  expect(fillChapterRefs('({sfc/assembly})', 'sfc')).toBe('(3장)');
  expect(fillChapterRefs('({sfc/assembly})', 'common')).toBe('(슈퍼 패미콤 3장)');
});

test('mixed lists name the game once, so labels leave it out', () => {
  for (const c of readyChapters())
    for (const n of c.notes) {
      expect(n.label, noteLabel(n)).not.toMatch(/^[^:]+: /);
    }
});
