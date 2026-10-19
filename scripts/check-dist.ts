// Integrity of the built site: every internal link and asset resolves, every `#anchor` exists on its page,
// and the feed and sitemap are well-formed and point at real pages.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { XMLValidator } from 'fast-xml-parser';

const DIST = 'dist';
const SITE = 'https://perfectacle.github.io';
// Links that were already dead before the Astro migration; each needs a reason.
const KNOWN_BROKEN = new Set([
  // Table of contents entry for chapter 6, which was never written.
  '/2018/03/31/tcp-ip-book-index-6/#6장-보안',
]);
// Demo pages copied verbatim from public/ are not part of the blog and keep their own link structure.
const STANDALONE = new Set(
  readdirSync('public', { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name),
);

const fileFor = (urlPath: string): string => {
  const path = decodeURIComponent(urlPath);
  if (path.endsWith('/')) return join(DIST, path, 'index.html');
  return posix.extname(path) ? join(DIST, path) : join(DIST, path, 'index.html');
};

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
const pages = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
  .filter(f => f.endsWith('.html'))
  .filter(f => !STANDALONE.has(f.split('/')[0] ?? ''));

for (const page of pages) {
  const pageUrl = '/' + page.replace(/index\.html$/, '');
  const html = readFileSync(join(DIST, page), 'utf8')
    // Code samples contain markup-looking text that is not a real link.
    .replace(/<pre[\s\S]*?<\/pre>/g, '');
  for (const [, attr, raw = ''] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const ref = decodeEntities(raw);
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue;
    const url = new URL(ref, SITE + pageUrl);
    if (url.origin !== SITE) continue;
    const target = url.pathname + url.hash;
    if (KNOWN_BROKEN.has(decodeURIComponent(target))) continue;
    const file = fileFor(url.pathname);
    if (!existsSync(file)) {
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
  const valid = XMLValidator.validate(text);
  if (valid !== true) problems.push(`${xml}: not well-formed (${valid.err.msg})`);
  for (const [, loc = ''] of text.matchAll(/<loc>([^<]+)<\/loc>|<link href="([^"]+)"\/>/g)) {
    const url = new URL(decodeEntities(loc || ''), SITE);
    if (!existsSync(fileFor(url.pathname))) problems.push(`${xml}: ${url.pathname} (missing)`);
  }
}
const entries = (readFileSync(join(DIST, 'atom.xml'), 'utf8').match(/<entry>/g) ?? []).length;
if (entries !== 20) problems.push(`atom.xml: expected 20 entries, found ${entries}`);

if (problems.length) {
  console.error(`check-dist: ${problems.length} problem(s)\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`check-dist: ok (${pages.length} pages)`);
