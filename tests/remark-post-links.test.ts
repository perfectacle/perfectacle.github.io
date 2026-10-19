import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toPostUrl } from '../src/lib/remark-post-links.ts';

const root = mkdtempSync(join(tmpdir(), 'posts-'));
const post = (year: string, slug: string, date: string) => {
  mkdirSync(join(root, year, slug), { recursive: true });
  writeFileSync(join(root, year, slug, 'index.md'), `---\ntitle: t\ndate: ${date}\n---\nbody\n`);
};
// Folder year and URL date differ on purpose: the URL follows frontmatter `date`.
post('2017', 'ES6-Iterator', '2017-04-22 10:00:00');
post('2017', 'new-year', '2018-01-01 00:30:00');
const from = join(root, '2016', 'ES6-Scope', 'index.md');

describe('toPostUrl', () => {
  it('turns a post file path into its published URL', () => {
    expect(toPostUrl('../../2017/ES6-Iterator/index.md', from, root)).toBe('/2017/04/22/ES6-Iterator/');
  });

  it('keeps the anchor', () => {
    expect(toPostUrl('../../2017/ES6-Iterator/index.md#Iterator', from, root)).toBe(
      '/2017/04/22/ES6-Iterator/#Iterator',
    );
  });

  it('uses the frontmatter date, not the folder year', () => {
    expect(toPostUrl('../../2017/new-year/index.md', from, root)).toBe('/2018/01/01/new-year/');
  });

  it('maps files inside another post to the copied original', () => {
    expect(toPostUrl('../../2017/ES6-Iterator/diagram 1.png', from, root)).toBe(
      '/2017/04/22/ES6-Iterator/diagram%201.png',
    );
  });

  it.each(['https://example.com/a.md', '/tags/JS/', '#local', 'mailto:a@b.c'])('leaves %s alone', href => {
    expect(toPostUrl(href, from, root)).toBe(href);
  });

  it('leaves links to missing posts unchanged so the build check catches them', () => {
    expect(toPostUrl('../../2099/nope/index.md', from, root)).toBe('../../2099/nope/index.md');
  });
});
