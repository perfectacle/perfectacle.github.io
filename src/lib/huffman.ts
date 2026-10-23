/**
 * Huffman coding for the guide's "make a code" widget: count symbols, merge the two lightest nodes until one tree is
 * left, read codes off the tree, and decode a bitstream one bit at a time.
 *
 * Ties are broken the same way every time so the page and the tests agree: among nodes of equal weight the one created
 * first wins. Leaves are created in order of first appearance in the text, merged nodes after them in merge order. The
 * first node taken becomes the 0 branch, the second the 1 branch.
 */

export interface HuffLeaf {
  id: number;
  symbol: string;
  weight: number;
}

export interface HuffInner {
  id: number;
  weight: number;
  zero: number;
  one: number;
}

export type HuffNode = HuffLeaf | HuffInner;

export interface Merge {
  zero: number;
  one: number;
  made: number;
  /** Ids waiting in the queue before this merge, lightest first. */
  queue: number[];
}

export interface HuffTree {
  /** Indexed by id. */
  nodes: HuffNode[];
  /** Leaves in order of first appearance; their ids are 0..n-1. */
  leaves: HuffLeaf[];
  merges: Merge[];
  root: number;
  codes: Map<string, string>;
}

export const isLeaf = (n: HuffNode): n is HuffLeaf => 'symbol' in n;

/** Symbols in the text: one per code point, so Hangul syllables and emoji count as one. */
export const symbolsOf = (text: string) => Array.from(text);

/** [symbol, count] in order of first appearance. */
export function frequencies(text: string): [string, number][] {
  const counts = new Map<string, number>();
  for (const s of symbolsOf(text)) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts];
}

const byWeight = (nodes: HuffNode[]) => (a: number, b: number) =>
  (nodes[a]?.weight ?? 0) - (nodes[b]?.weight ?? 0) || a - b;

export function build(text: string): HuffTree {
  const freq = frequencies(text);
  if (freq.length === 0) throw new Error('empty text');
  const leaves: HuffLeaf[] = freq.map(([symbol, weight], id) => ({ id, symbol, weight }));
  const nodes: HuffNode[] = [...leaves];
  const merges: Merge[] = [];
  let queue = leaves.map(l => l.id).sort(byWeight(nodes));
  while (queue.length > 1) {
    const [zero, one, ...rest] = queue;
    if (zero === undefined || one === undefined) break;
    const made = nodes.length;
    nodes.push({ id: made, weight: (nodes[zero]?.weight ?? 0) + (nodes[one]?.weight ?? 0), zero, one });
    merges.push({ zero, one, made, queue });
    queue = [...rest, made].sort(byWeight(nodes));
  }
  const root = queue[0] ?? 0;
  const codes = new Map<string, string>();
  const walk = (id: number, path: string) => {
    const n = nodes[id];
    if (!n) return;
    // A text with one distinct symbol still needs one bit per symbol.
    if (isLeaf(n)) codes.set(n.symbol, path || '0');
    else {
      walk(n.zero, `${path}0`);
      walk(n.one, `${path}1`);
    }
  };
  walk(root, '');
  return { nodes, leaves, merges, root, codes };
}

export const encode = (tree: HuffTree, text: string) =>
  symbolsOf(text)
    .map(s => tree.codes.get(s) ?? '')
    .join('');

export interface DecodeStep {
  /** Index of the bit just read. */
  bit: number;
  /** Node reached after reading it. */
  node: number;
  /** Set when the node is a leaf: the symbol written out. */
  symbol?: string;
}

/** One step per bit; a leaf emits its symbol and the next bit starts again from the root. */
export function decodeSteps(tree: HuffTree, bits: string): DecodeStep[] {
  const steps: DecodeStep[] = [];
  const rootNode = tree.nodes[tree.root];
  let at = tree.root;
  for (let i = 0; i < bits.length; i++) {
    const here = tree.nodes[at];
    if (!here || !rootNode) break;
    const next = isLeaf(here) ? here.id : bits[i] === '1' ? here.one : here.zero;
    const n = tree.nodes[next];
    if (!n) break;
    if (isLeaf(n)) {
      steps.push({ bit: i, node: next, symbol: n.symbol });
      at = tree.root;
    } else {
      steps.push({ bit: i, node: next });
      at = next;
    }
  }
  return steps;
}

export const decode = (tree: HuffTree, bits: string) =>
  decodeSteps(tree, bits)
    .map(s => s.symbol ?? '')
    .join('');

/**
 * Canonical codes (RFC 1951, 3.2.2): only the code length of each symbol is stored, and codes are handed out in order of
 * length, then of the given symbol order. Zero means the symbol is unused.
 */
export function canonical(lengths: number[]): (string | null)[] {
  const max = Math.max(0, ...lengths);
  const count = new Array<number>(max + 1).fill(0);
  for (const l of lengths) if (l > 0) count[l] = (count[l] ?? 0) + 1;
  const next = new Array<number>(max + 2).fill(0);
  let code = 0;
  for (let bits = 1; bits <= max; bits++) {
    code = (code + (count[bits - 1] ?? 0)) << 1;
    next[bits] = code;
  }
  return lengths.map(l => {
    if (l === 0) return null;
    const c = next[l] ?? 0;
    next[l] = c + 1;
    return c.toString(2).padStart(l, '0');
  });
}

/** Leaves under a node, in 0-before-1 order; the widget draws the tree with leaves in this order. */
export function leafOrder(tree: HuffTree, id = tree.root): number[] {
  const n = tree.nodes[id];
  if (!n) return [];
  return isLeaf(n) ? [n.id] : [...leafOrder(tree, n.zero), ...leafOrder(tree, n.one)];
}

/** Depth of each node from the root. */
export function depths(tree: HuffTree): Map<number, number> {
  const d = new Map<number, number>();
  const walk = (id: number, depth: number) => {
    const n = tree.nodes[id];
    if (!n) return;
    d.set(id, depth);
    if (!isLeaf(n)) {
      walk(n.zero, depth + 1);
      walk(n.one, depth + 1);
    }
  };
  walk(tree.root, 0);
  return d;
}
