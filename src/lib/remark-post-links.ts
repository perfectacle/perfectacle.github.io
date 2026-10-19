import { readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';

// Posts link to each other by file path (`../../2017/ES6-Iterator/index.md#anchor`) so editors can
// follow them; the site needs the published URL, which comes from the target's frontmatter date.
const POSTS_ROOT = resolve('src/content/posts');
const dateCache = new Map<string, string>();

function postUrl(postDir: string): string {
  let base = dateCache.get(postDir);
  if (!base) {
    const md = readFileSync(resolve(postDir, 'index.md'), 'utf8');
    const m = md.match(/^---\n[\s\S]*?^date:\s*(\d{4})-(\d{2})-(\d{2})/m);
    if (!m) throw new Error(`no date in ${postDir}/index.md`);
    base = `/${m[1]}/${m[2]}/${m[3]}/${postDir.split(sep).at(-1)}/`;
    dateCache.set(postDir, base);
  }
  return base;
}

function toUrl(href: string, file: VFile): string {
  if (/^([a-z]+:|\/|#)/i.test(href) || !file.path) return href;
  const [path, hash = ''] = href.split('#');
  const target = resolve(dirname(file.path), decodeURI(path));
  const rel = relative(POSTS_ROOT, target).split(sep);
  // <year>/<slug>/<file>
  if (rel[0] === '..' || rel.length !== 3) return href;
  const postDir = resolve(POSTS_ROOT, rel[0], rel[1]);
  let url: string;
  try {
    url = postUrl(postDir);
  } catch {
    // Left as-is; scripts/check-post-links.mjs fails the build on any `.md` href in the output.
    return href;
  }
  const rest = rel[2] === 'index.md' ? '' : encodeURI(rel[2]);
  return url + rest + (hash ? `#${hash}` : '');
}

export function remarkPostLinks() {
  return (tree: Root, file: VFile) => {
    visit(tree, ['link', 'definition'], node => {
      if ('url' in node) node.url = toUrl(node.url, file);
    });
  };
}
