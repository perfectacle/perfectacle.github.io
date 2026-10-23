import { dirname, relative, resolve, sep } from 'node:path';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';
import { POSTS_ROOT, postUrlOf } from './post-files.ts';

// Posts link to each other by root URL. A file-path link (`../../2017/ES6-Iterator/index.md#anchor`), as a draft
// may still use, is turned into the published URL from the target's frontmatter date.
export function toPostUrl(href: string, fromFile: string, root = POSTS_ROOT): string {
  if (/^([a-z]+:|\/|#)/i.test(href)) return href;
  const [path = '', hash] = href.split('#');
  const [year, slug, file, ...extra] = relative(root, resolve(dirname(fromFile), decodeURI(path))).split(sep);
  if (!year || year === '..' || !slug || !file || extra.length) return href;
  let url: string;
  try {
    url = postUrlOf(resolve(root, year, slug));
  } catch {
    // Left as-is; scripts/check-post-links.ts fails the build on any `.md` href in the output.
    return href;
  }
  const rest = file === 'index.md' ? '' : encodeURI(file);
  return url + rest + (hash ? `#${hash}` : '');
}

export function remarkPostLinks() {
  return (tree: Root, file: VFile) => {
    if (!file.path) return;
    const from = file.path;
    visit(tree, ['link', 'definition'], node => {
      if ('url' in node) node.url = toPostUrl(node.url, from);
    });
  };
}
