// Integrity of the built site: every internal link and asset resolves, every `#anchor` exists on its page,
// the feed and sitemap are well-formed and point at real pages, and every 「N장」 link names the chapter it opens.
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { SyntaxValidator } from 'fast-xml-validator';
import { GUIDE_CHAPTERS, chapterLabel, chapterPath, trackOfPath } from '../src/components/romhacking/chapters.ts';

const DIST = 'dist';
const SITE = 'https://perfectacle.github.io';
// Links that were already dead before the Astro migration; each needs a reason.
const KNOWN_BROKEN = new Set([
  // Table of contents entry for chapter 6, which was never written.
  '/2018/03/31/tcp-ip-book-index-6/#6장-보안',
]);
// Demo pages copied verbatim from public/ are not part of the blog and keep their own link structure. Match the files
// themselves, not their top-level folders: public/games/ also holds assets of the generated /games/ pages.
const STANDALONE = new Set(
  readdirSync('public', { recursive: true, encoding: 'utf8' }).filter(f => f.endsWith('.html')),
);

const fileFor = (urlPath: string): string => {
  const path = decodeURIComponent(urlPath);
  if (path.endsWith('/')) return join(DIST, path, 'index.html');
  return posix.extname(path) ? join(DIST, path) : join(DIST, path, 'index.html');
};

// existsSync ignores case on macOS, but GitHub Pages serves paths case-sensitively.
const distFiles = new Set(readdirSync(DIST, { recursive: true, encoding: 'utf8' }).map(f => join(DIST, f)));
const exists = (file: string) => distFiles.has(file);

const idCache = new Map<string, Set<string>>();
const idsOf = (file: string): Set<string> => {
  let ids = idCache.get(file);
  if (!ids) {
    const html = readFileSync(file, 'utf8');
    ids = new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map(m => decodeEntities(m[1] ?? '')));
    idCache.set(file, ids);
  }
  return ids;
};

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const problems: string[] = [];
const chapterAt = new Map(GUIDE_CHAPTERS.map(c => [chapterPath(c), c]));
const CHAPTER_TEXT = /^(?:(?:공통|슈퍼 패미콤|DS) )?\d+장/;
const pages = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
  .filter(f => f.endsWith('.html'))
  .filter(f => !STANDALONE.has(f));

for (const page of pages) {
  const pageUrl = '/' + page.replace(/index\.html$/, '');
  const html = readFileSync(join(DIST, page), 'utf8')
    // Code samples contain markup-looking text that is not a real link.
    .replace(/<pre[\s\S]*?<\/pre>/g, '');
  // Site pages are templates, where a line break next to a link or code renders as no space at all ("자리는<a>").
  if (pageUrl.startsWith('/games/')) {
    for (const m of html.replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, '').matchAll(/[가-힣]<(?:a|code)\b/g)) {
      const at = m.index;
      problems.push(`${pageUrl}: no space before an inline element (…${html.slice(Math.max(0, at - 20), at + 1)})`);
    }
    // A link written inside another link comes out as an empty one, which screen readers announce without a name.
    for (const [empty] of html.matchAll(/<a\s[^>]*><\/a>/g))
      problems.push(`${pageUrl}: empty link ${empty.slice(0, 120)}`);
    // Chapters are numbered within their track, so a link's 「N장」 must match where it goes, as seen from this page.
    for (const [, href = '', inner = ''] of html.matchAll(/<a\s[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const text = decodeEntities(inner.replace(/<[^>]*>/g, '')).trim();
      const said = CHAPTER_TEXT.exec(text)?.[0];
      if (!said) continue;
      const chapter = chapterAt.get(new URL(decodeEntities(href), SITE + pageUrl).pathname);
      const want = chapter && chapterLabel(chapter, trackOfPath(pageUrl));
      if (said !== want)
        problems.push(`${pageUrl}: link 「${text.slice(0, 40)}」 → ${href} should say ${want ?? '(not a chapter)'}`);
    }
  }
  const refs = [...html.matchAll(/\s(href|src)="([^"]*)"/g)].map(([, attr = '', raw = '']) => [attr, raw]);
  // Each srcset candidate is "<url> <descriptor>"; most screens load these instead of src.
  for (const [, raw = ''] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const candidate of raw.split(',')) refs.push(['srcset', candidate.trim().split(/\s+/)[0] ?? '']);
  }
  for (const [attr, raw = ''] of refs) {
    const ref = decodeEntities(raw);
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue;
    const url = new URL(ref, SITE + pageUrl);
    if (url.origin !== SITE) continue;
    const target = url.pathname + url.hash;
    if (KNOWN_BROKEN.has(decodeURIComponent(target))) continue;
    const file = fileFor(url.pathname);
    if (!exists(file)) {
      problems.push(`${pageUrl}: ${attr} → ${target} (missing)`);
      continue;
    }
    const hash = decodeURIComponent(url.hash.slice(1));
    if (hash && file.endsWith('.html') && !idsOf(file).has(hash)) {
      problems.push(`${pageUrl}: ${attr} → ${target} (no such anchor)`);
    }
  }
}

for (const xml of ['sitemap.xml', 'atom.xml']) {
  const text = readFileSync(join(DIST, xml), 'utf8');
  try {
    SyntaxValidator.validate(text);
  } catch (error) {
    problems.push(`${xml}: not well-formed (${(error as Error).message})`);
  }
  for (const [, loc = ''] of text.matchAll(/<loc>([^<]+)<\/loc>|<link href="([^"]+)"\/>/g)) {
    const url = new URL(decodeEntities(loc || ''), SITE);
    const file = fileFor(url.pathname);
    if (!exists(file)) problems.push(`${xml}: ${url.pathname} (missing)`);
    // A redirect in astro.config.ts silently replaces a real page that has the same path.
    else if (file.endsWith('.html') && readFileSync(file, 'utf8').includes('http-equiv="refresh"')) {
      problems.push(`${xml}: ${url.pathname} (replaced by a redirect)`);
    }
  }
}
const entries = (readFileSync(join(DIST, 'atom.xml'), 'utf8').match(/<entry>/g) ?? []).length;
if (entries !== 20) problems.push(`atom.xml: expected 20 entries, found ${entries}`);

if (problems.length) {
  console.error(`check-dist: ${problems.length} problem(s)\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`check-dist: ok (${pages.length} pages)`);
