import GithubSlugger from 'github-slugger';
import type { Element, ElementContent, Root, RootContent, Text } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { GLOSSARY, termHref, type GlossaryEntry } from './glossary.ts';

/**
 * Build-time pass over the rendered body of a guide chapter or ROM analysis note. It reads the h2/h3 outline for the
 * contents lists, so they always match the headings, and links the first mention of each glossary term in every h2
 * section to its glossary entry.
 */

export interface GuideHeading {
  depth: 2 | 3;
  id: string;
  text: string;
}

/** Elements whose text is never linked: headings, code, existing links, controls, drawings and interactive widgets. */
const SKIP_TAGS = new Set([
  'a',
  'button',
  'code',
  'dialog',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'kbd',
  'label',
  'math',
  'noscript',
  'option',
  'pre',
  'samp',
  'script',
  'select',
  'style',
  'summary',
  'svg',
  'template',
  'textarea',
  'var',
]);
const SKIP_CLASSES = ['widget', 'layer-badge', 'note-related'];
/** Headings inside these stay out of the contents: folded parts and widget titles are not places to jump to. */
const OUTLINE_SKIP_TAGS = new Set(['details', 'dialog', 'figure', 'aside']);

const classes = (el: Element): string[] => {
  const c = el.properties['className'];
  return Array.isArray(c) ? c.map(String) : [];
};
const skipsTerms = (el: Element) =>
  SKIP_TAGS.has(el.tagName) ||
  el.properties['hidden'] !== undefined ||
  el.properties['ariaHidden'] === 'true' ||
  el.properties['dataTerms'] === 'off' ||
  classes(el).some(c => SKIP_CLASSES.includes(c));

/** Heading text for the contents: badges repeat the heading and are left out. */
function headingText(node: ElementContent): string {
  if (node.type === 'text') return node.value;
  if (node.type !== 'element' || classes(node).includes('layer-badge')) return '';
  return node.children.map(headingText).join('');
}

const HANGUL = /[가-힣]/;
const WORD = /[A-Za-z0-9_]/;

interface Name {
  name: string;
  entry: GlossaryEntry;
}

/**
 * Names a term is found by. 「덤프(롬)」 reads as 덤프 unless another entry shares that base, 「JSL·RTL」 as either
 * instruction, and the original only when it is an acronym or proper name: plain English words like "mask" would
 * also match code and file names.
 */
export function termNames(glossary: GlossaryEntry[] = GLOSSARY): Name[] {
  const base = (e: GlossaryEntry) => e.term.replace(/\(.*\)$/, '');
  const baseCount = new Map<string, number>();
  for (const e of glossary) baseCount.set(base(e), (baseCount.get(base(e)) ?? 0) + 1);
  const names: Name[] = [];
  for (const e of glossary) {
    const b = base(e);
    const own = [e.term];
    if (b !== e.term && baseCount.get(b) === 1) own.push(b);
    if (b.includes('·') && /[A-Za-z]/.test(b)) own.push(...b.split('·'));
    if (e.en) own.push(...[e.en, ...e.en.split(/ \/ |, /)].filter(n => /[A-Z0-9]/.test(n)));
    for (const name of new Set(own.map(n => n.trim())))
      if (HANGUL.test(name) || /[A-Za-z]{2}/.test(name) || name.length >= 3) names.push({ name, entry: e });
  }
  return names;
}

/** Candidates by first character, longest first, so 「포인터 표」 wins over 「포인터」. */
function indexNames(names: Name[]) {
  const byFirst = new Map<string, Name[]>();
  for (const n of names) {
    const first = n.name[0] ?? '';
    byFirst.set(first, [...(byFirst.get(first) ?? []), n]);
  }
  for (const list of byFirst.values()) list.sort((a, b) => b.name.length - a.name.length);
  return byFirst;
}

/** A name only counts as a whole word: not inside a longer Korean word or a longer Latin identifier. */
function fits(text: string, at: number, name: string): boolean {
  if (!text.startsWith(name, at)) return false;
  const before = text[at - 1] ?? '';
  const after = text[at + name.length] ?? '';
  if (HANGUL.test(name[0] ?? '') && HANGUL.test(before)) return false;
  if (WORD.test(name[0] ?? '') && (WORD.test(before) || before === '-')) return false;
  if (WORD.test(name.at(-1) ?? '') && WORD.test(after)) return false;
  return true;
}

const hasLink = (node: Element): boolean =>
  node.children.some(c => c.type === 'element' && (c.tagName === 'a' || hasLink(c)));

export interface GuideHtml {
  html: string;
  headings: GuideHeading[];
  /** Entries linked on this page, for the preview cards. */
  terms: GlossaryEntry[];
}

export function processGuideHtml(html: string, glossary: GlossaryEntry[] = GLOSSARY): GuideHtml {
  const tree = fromHtml(html, { fragment: true });
  const byFirst = indexNames(termNames(glossary));
  const headings: GuideHeading[] = [];
  const linked = new Set<GlossaryEntry>();
  const ids = new Set<string>();
  const slugger = new GithubSlugger();
  let section = new Set<GlossaryEntry>();

  const collectIds = (node: Root | Element) => {
    for (const child of node.children) {
      if (child.type !== 'element') continue;
      const id = child.properties['id'];
      if (typeof id === 'string') ids.add(id);
      collectIds(child);
    }
  };
  collectIds(tree);

  const link = (text: string): ElementContent[] => {
    const out: ElementContent[] = [];
    let plain = 0;
    for (let i = 0; i < text.length;) {
      const hit = byFirst.get(text[i] ?? '')?.find(n => fits(text, i, n.name));
      if (!hit) {
        i++;
        continue;
      }
      // An entry already linked in this section keeps its later mentions, and the shorter terms inside them, plain.
      if (!section.has(hit.entry)) {
        section.add(hit.entry);
        linked.add(hit.entry);
        if (i > plain) out.push({ type: 'text', value: text.slice(plain, i) });
        out.push({
          type: 'element',
          tagName: 'a',
          properties: { className: ['term'], href: termHref(hit.entry) },
          children: [{ type: 'text', value: hit.name }],
        });
        plain = i + hit.name.length;
      }
      i += hit.name.length;
    }
    if (plain === 0) return [{ type: 'text', value: text }];
    if (plain < text.length) out.push({ type: 'text', value: text.slice(plain) });
    return out;
  };

  const walk = (node: Root | Element, linking: boolean, outline: boolean) => {
    const next: (RootContent | ElementContent)[] = [];
    for (const child of node.children) {
      if (child.type === 'text') {
        next.push(...(linking ? link((child as Text).value) : [child]));
        continue;
      }
      next.push(child);
      if (child.type !== 'element') continue;
      if (child.tagName === 'h2') section = new Set();
      if (outline && (child.tagName === 'h2' || child.tagName === 'h3')) {
        const text = headingText(child).replace(/\s+/g, ' ').trim();
        let id = child.properties['id'];
        if (typeof id !== 'string' || !id) {
          do id = slugger.slug(text);
          while (ids.has(id));
          ids.add(id);
          child.properties['id'] = id;
        }
        headings.push({ depth: child.tagName === 'h2' ? 2 : 3, id, text });
        // The whole heading links to itself, so a reader can take the address of any section from its title. A heading
        // that already holds a link keeps it, since links cannot nest.
        if (!hasLink(child))
          child.children = [
            {
              type: 'element',
              tagName: 'a',
              properties: { className: ['heading-link'], href: `#${id}` },
              children: child.children,
            },
          ];
      }
      const inOutline = outline && !OUTLINE_SKIP_TAGS.has(child.tagName) && !classes(child).includes('widget');
      walk(child, linking && !skipsTerms(child), inOutline);
    }
    node.children = next as typeof node.children;
  };
  walk(tree, true, true);

  return { html: toHtml(tree), headings, terms: glossary.filter(e => linked.has(e)) };
}
