import type { Root, Element, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';
import { slugize } from './slugize.ts';

// Hexo's marked renderer derived heading ids with slugize (case kept, Korean kept),
// and old posts link to those anchors. Astro keeps ids that are already set.
const text = (node: ElementContent): string =>
  node.type === 'text' ? node.value : 'children' in node ? node.children.map(text).join('') : '';

export function rehypeHexoHeadingIds() {
  return (tree: Root) => {
    const seen = new Map<string, number>();
    visit(tree, 'element', (node: Element) => {
      if (!/^h[1-6]$/.test(node.tagName) || node.properties.id) return;
      let id = slugize(node.children.map(text).join('').trim());
      const n = seen.get(id);
      if (n) {
        seen.set(id, n + 1);
        id = `${id}-${n}`;
      } else {
        seen.set(id, 1);
      }
      node.properties.id = id;
    });
  };
}
