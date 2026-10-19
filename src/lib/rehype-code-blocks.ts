import type { Element, ElementContent, Root } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

const PLAIN = new Set(['plaintext', 'text', 'txt', 'plain']);

/**
 * Wraps each Shiki code block in a frame with a header row (language label and a copy button).
 * Done at build time so the header takes its space before first paint; a header added by script
 * would push the page down after load (CLS). The button stays hidden until the page script wires it up.
 */
export function rehypeCodeBlocks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || index === undefined || !parent) return;
      // Shiki's hast output sets `class` as a plain string rather than hast's `className` list.
      const classes = node.properties['className'] ?? node.properties['class'];
      const list = Array.isArray(classes) ? classes.map(String) : String(classes ?? '').split(/\s+/);
      if (!list.includes('astro-code')) return;
      const lang = String(node.properties['dataLanguage'] ?? node.properties['data-language'] ?? '');
      const head: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-head'], dataPagefindIgnore: 'all' },
        children: [
          ...(lang && !PLAIN.has(lang)
            ? [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: { className: ['code-lang'] },
                  children: [{ type: 'text', value: lang }],
                } satisfies ElementContent,
              ]
            : []),
          {
            type: 'element',
            tagName: 'button',
            properties: { type: 'button', className: ['code-copy'], hidden: true },
            children: [{ type: 'text', value: '복사' }],
          },
        ],
      };
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block'] },
        children: [head, node],
      };
      // Nothing inside a highlighted block needs visiting, and the wrapper must not be wrapped again.
      return [SKIP, index + 1];
    });
  };
}
