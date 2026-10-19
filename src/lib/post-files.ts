import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

// Filesystem view of the posts collection, for code that runs outside Astro's content layer
// (remark plugins, build scripts). The URL rule must stay identical to `postPath` in posts.ts.
export const POSTS_ROOT = resolve('src/content/posts');

const visibleDirs = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => join(dir, e.name));

/** Absolute paths of every `<year>/<slug>` post directory. */
export const listPostDirs = (root = POSTS_ROOT): string[] => visibleDirs(root).flatMap(visibleDirs);

const urlCache = new Map<string, string>();

/** `/YYYY/MM/DD/<slug>/` taken literally from the frontmatter `date`, as Hexo did. */
export function postUrlOf(postDir: string): string {
  const cached = urlCache.get(postDir);
  if (cached) return cached;
  const md = readFileSync(join(postDir, 'index.md'), 'utf8');
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '';
  const [, y, m, d] = /^date:\s*(\d{4})-(\d{2})-(\d{2})/m.exec(frontmatter) ?? [];
  if (!y || !m || !d) throw new Error(`no date in ${postDir}/index.md`);
  const url = `/${y}/${m}/${d}/${basename(postDir)}/`;
  urlCache.set(postDir, url);
  return url;
}
