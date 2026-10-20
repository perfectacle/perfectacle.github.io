/** Number of tracks in the list-page card grid; every row size used below must divide it. */
export const GRID_TRACKS = 12;

/** Column counts the card grid uses, with the viewport width each starts at (see PostList.astro). */
export const CARD_COLUMNS = [
  { columns: 2, minViewport: 900 },
  { columns: 3, minViewport: 1148 },
  { columns: 4, minViewport: 1700 },
] as const;

/**
 * How many cards go in each row when `n` cards are laid out about `columns` to a row: as few rows as the column
 * count allows, sizes as even as possible, and the shorter rows first so the top of the page gets the bigger cards.
 * No row is ever a lone card unless there is only one card: at 2 columns an odd count gets one row of 3.
 */
export function rowSizes(n: number, columns: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  const rows = Math.min(Math.ceil(n / columns), Math.floor(n / 2));
  const small = Math.floor(n / rows);
  const bigRows = n % rows;
  return Array.from({ length: rows }, (_, i) => (i < rows - bigRows ? small : small + 1));
}

/** Grid-track span of each card when `n` cards are laid out at most `columns` to a row. */
export function cardSpans(n: number, columns: number): number[] {
  // A single card on its own would stretch across the page; half the width keeps it a card.
  if (n === 1) return [GRID_TRACKS / 2];
  return rowSizes(n, columns).flatMap(size => Array.from({ length: size }, () => GRID_TRACKS / size));
}

// These mirror the card grid's CSS (PostList.astro) and the page frame (global.css) and must change with them;
// the e2e test that compares each card's width with its `sizes` fails when they drift.
export const CARD_GAP = 28;
const FRAME_CAP_VIEWPORT = 1450;
const FRAME_CAP_WIDTH = 1344;

/**
 * `sizes` for one card's thumbnail, given its span at each column count. A card spanning `s` of 12 tracks is as wide
 * as one of 12/s equal cards in a row.
 */
export function thumbSizes(spans: Record<2 | 3 | 4, number>): string {
  const perRow = (span: number) => GRID_TRACKS / span;
  const fixed = (span: number) => `${Math.ceil((FRAME_CAP_WIDTH + CARD_GAP) / perRow(span) - CARD_GAP)}px`;
  const fluid = (span: number) => `calc((92vw + ${20 + CARD_GAP}px) / ${perRow(span)} - ${CARD_GAP}px)`;
  const [two, three, four] = CARD_COLUMNS.map(c => c.minViewport);
  return [
    `(min-width: ${four}px) ${fixed(spans[4])}`,
    `(min-width: ${FRAME_CAP_VIEWPORT}px) ${fixed(spans[3])}`,
    `(min-width: ${three}px) ${fluid(spans[3])}`,
    `(min-width: ${two}px) ${fluid(spans[2])}`,
    '(min-width: 641px) 168px',
    '88px',
  ].join(', ');
}
