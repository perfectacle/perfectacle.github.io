import { isLeaf, leafOrder, type HuffTree } from '../../lib/huffman.ts';

export const SAMPLE_TEXT = '간장 공장 공장장';
export const MAX_SYMBOLS = 40;
export const MAX_DISTINCT = 10;

/** How a symbol is shown; the space would otherwise be invisible. */
export const shown = (s: string) => (s === ' ' ? '␣' : s);
/** How a symbol is read aloud. */
export const spoken = (s: string) => (s === ' ' ? '빈칸' : s);

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

export function checkText(text: string): string | null {
  const symbols = Array.from(text);
  if (symbols.length === 0) return '문장을 적어 주세요.';
  if (symbols.length > MAX_SYMBOLS) return `${MAX_SYMBOLS}글자까지 적을 수 있습니다. 지금 ${symbols.length}글자입니다.`;
  const distinct = new Set(symbols).size;
  if (distinct > MAX_DISTINCT)
    return `서로 다른 글자는 ${MAX_DISTINCT}개까지입니다(그림이 화면에 들어가도록). 지금 ${distinct}개입니다.`;
  return null;
}

const COL = 40;
const ROW = 46;
const PAD = 22;

/**
 * The forest after `merges` merges, drawn with every leaf on the bottom row in the finished tree's 0-before-1 order and
 * each merged node one row above its taller child. `path` lists nodes to mark (the decoder's walk).
 */
export function treeSvg(tree: HuffTree, merges: number, path: number[] = [], picked: number[] = []): string {
  const order = leafOrder(tree);
  const x = new Map<number, number>();
  const level = new Map<number, number>();
  order.forEach((id, i) => {
    x.set(id, PAD + i * COL);
    level.set(id, 0);
  });
  const made = tree.merges.slice(0, merges);
  for (const m of tree.merges) {
    x.set(m.made, ((x.get(m.zero) ?? 0) + (x.get(m.one) ?? 0)) / 2);
    level.set(m.made, 1 + Math.max(level.get(m.zero) ?? 0, level.get(m.one) ?? 0));
  }
  const top = Math.max(0, ...tree.merges.map(m => level.get(m.made) ?? 0));
  const y = (id: number) => 20 + (top - (level.get(id) ?? 0)) * ROW;
  const width = Math.max(PAD * 2 + (order.length - 1) * COL, 120);
  const height = 20 + top * ROW + 34;
  const on = new Set(path);
  const pick = new Set(picked);
  const parts: string[] = [];
  for (const m of made) {
    for (const [child, bit] of [
      [m.zero, '0'],
      [m.one, '1'],
    ] as const) {
      const lit = on.has(m.made) && on.has(child);
      const x1 = x.get(m.made) ?? 0;
      const x2 = x.get(child) ?? 0;
      const y1 = y(m.made);
      const y2 = y(child) - (isLeaf(tree.nodes[child] ?? { id: 0, weight: 0, zero: 0, one: 0 }) ? 15 : 11);
      parts.push(`<path class="hf-edge${lit ? ' is-on' : ''}" d="M${x1} ${y1 + 11}L${x2} ${y2}"/>`);
      const lx = (x1 + x2) / 2 + (bit === '0' ? -7 : 7);
      parts.push(
        `<text class="hf-bit${lit ? ' is-on' : ''}" x="${lx}" y="${(y1 + 11 + y2) / 2 + 4}" text-anchor="middle">${bit}</text>`,
      );
    }
  }
  for (const m of made) {
    const cls = on.has(m.made) ? ' is-on' : pick.has(m.made) ? ' is-picked' : '';
    parts.push(
      `<circle class="hf-inner${cls}" cx="${x.get(m.made)}" cy="${y(m.made)}" r="11"/>`,
      `<text class="hf-w" x="${x.get(m.made)}" y="${y(m.made) + 4}" text-anchor="middle">${tree.nodes[m.made]?.weight ?? 0}</text>`,
    );
  }
  for (const id of order) {
    const leaf = tree.nodes[id];
    if (!leaf || !isLeaf(leaf)) continue;
    const cls = on.has(id) ? ' is-on' : pick.has(id) ? ' is-picked' : '';
    const cx = x.get(id) ?? 0;
    const cy = y(id);
    parts.push(
      `<rect class="hf-leaf${cls}" x="${cx - 16}" y="${cy - 15}" width="32" height="36" rx="5"/>`,
      `<text class="hf-sym" x="${cx}" y="${cy + 3}" text-anchor="middle">${esc(shown(leaf.symbol))}</text>`,
      `<text class="hf-w" x="${cx}" y="${cy + 17}" text-anchor="middle">${leaf.weight}</text>`,
    );
  }
  return `<svg viewBox="0 0 ${width} ${height}" style="max-width:${width * 1.1}px" aria-hidden="true">${parts.join('')}</svg>`;
}

/** The tree as a sentence for screen readers. */
export function treeText(tree: HuffTree, merges: number): string {
  if (merges === 0) return `아직 묶지 않은 글자 ${tree.leaves.length}개가 있습니다.`;
  const done = tree.merges.slice(0, merges);
  const name = (id: number): string => {
    const n = tree.nodes[id];
    if (!n) return '';
    return isLeaf(n) ? `「${spoken(n.symbol)}」 ${n.weight}` : `묶음 ${n.weight}`;
  };
  return `묶은 순서: ${done.map(m => `${name(m.zero)} + ${name(m.one)} → ${tree.nodes[m.made]?.weight ?? 0}`).join('; ')}.`;
}
