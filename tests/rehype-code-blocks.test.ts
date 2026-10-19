import type { Element, Root } from 'hast';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { rehypeCodeBlocks } from '../src/lib/rehype-code-blocks.ts';

const pre = (lang: string, className = ['astro-code']): Element => ({
  type: 'element',
  tagName: 'pre',
  properties: { className, dataLanguage: lang, tabIndex: 0 },
  children: [{ type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: 'x' }] }],
});

const run = (...children: Element[]) => {
  const tree: Root = { type: 'root', children };
  rehypeCodeBlocks()(tree);
  return unified().use(rehypeStringify).stringify(tree);
};

describe('rehypeCodeBlocks', () => {
  it('wraps a highlighted block with a language label and a hidden copy button', () => {
    const html = run(pre('java'));
    expect(html).toMatch(/^<div class="code-block"><div class="code-head" data-pagefind-ignore="all">/);
    expect(html).toContain('<span class="code-lang">java</span>');
    expect(html).toContain('<button type="button" class="code-copy" hidden>복사</button>');
    expect(html).toContain('<pre class="astro-code"');
  });

  it('recognises Shiki output, which uses a class string and a raw data-language property', () => {
    const shiki: Element = {
      type: 'element',
      tagName: 'pre',
      properties: { class: 'astro-code github-light github-dark', 'data-language': 'kotlin' },
      children: [],
    };
    expect(run(shiki)).toContain('<span class="code-lang">kotlin</span>');
  });

  it('omits the label for plain text but keeps the copy button', () => {
    const html = run(pre('plaintext'));
    expect(html).not.toContain('code-lang');
    expect(html).toContain('code-copy');
  });

  it('wraps every block once and leaves non-Shiki blocks (mermaid) alone', () => {
    const html = run(pre('sql'), pre('mermaid', []), pre('kotlin'));
    expect(html.match(/class="code-block"/g)).toHaveLength(2);
    // The mermaid <pre> sits directly after the closed sql frame, not inside a frame of its own.
    expect(html).toMatch(/<\/pre><\/div><pre[^>]*data-language="mermaid"/);
  });
});
