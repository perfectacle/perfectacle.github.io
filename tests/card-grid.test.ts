import { describe, expect, it } from 'vitest';
import { cardSpans, CARD_COLUMNS, GRID_TRACKS, rowSizes, thumbSizes } from '../src/lib/card-grid.ts';

describe('rowSizes', () => {
  it.each([
    [10, 3, [2, 2, 3, 3]],
    [10, 4, [3, 3, 4]],
    [10, 2, [2, 2, 2, 2, 2]],
    [7, 4, [3, 4]],
    [7, 3, [2, 2, 3]],
    [5, 3, [2, 3]],
    [5, 4, [2, 3]],
    [4, 3, [2, 2]],
    [4, 4, [4]],
    [3, 2, [3]],
    [7, 2, [2, 2, 3]],
    [9, 2, [2, 2, 2, 3]],
    [2, 3, [2]],
    [9, 4, [3, 3, 3]],
    [8, 3, [2, 3, 3]],
    [6, 4, [3, 3]],
    [1, 3, [1]],
    [0, 3, []],
  ])('%i cards at %i columns → %j', (n, c, expected) => {
    expect(rowSizes(n, c)).toEqual(expected);
  });

  it('never leaves a lone card, keeps rows within one of each other, and puts short rows first', () => {
    for (let n = 2; n <= 10; n++) {
      for (const { columns } of CARD_COLUMNS) {
        const rows = rowSizes(n, columns);
        expect(
          rows.reduce((a, b) => a + b, 0),
          `${n}/${columns}`,
        ).toBe(n);
        // Only 2 columns may take a third card, to avoid a lone one.
        expect(Math.max(...rows), `${n}/${columns}`).toBeLessThanOrEqual(columns === 2 ? 3 : columns);
        expect(Math.max(...rows) - Math.min(...rows), `${n}/${columns}`).toBeLessThanOrEqual(1);
        expect(rows, `${n}/${columns}`).toEqual(rows.toSorted((a, b) => a - b));
        expect(Math.min(...rows), `${n}/${columns}`).toBeGreaterThan(1);
      }
    }
  });
});

describe('cardSpans', () => {
  it('fills every row exactly, with spans that divide the grid', () => {
    for (let n = 2; n <= 10; n++) {
      for (const { columns } of CARD_COLUMNS) {
        const spans = cardSpans(n, columns);
        expect(spans).toHaveLength(n);
        let filled = 0;
        for (const s of spans) {
          expect(GRID_TRACKS % s).toBe(0);
          filled += s;
        }
        expect(filled % GRID_TRACKS, `${n}/${columns}`).toBe(0);
      }
    }
  });

  it('gives the 10-card page bigger cards on top', () => {
    expect(cardSpans(10, 3)).toEqual([6, 6, 6, 6, 4, 4, 4, 4, 4, 4]);
    expect(cardSpans(10, 4)).toEqual([4, 4, 4, 4, 4, 4, 3, 3, 3, 3]);
    expect(cardSpans(10, 2)).toEqual(Array(10).fill(6));
  });

  it('shows a single card at half width', () => {
    expect(cardSpans(1, 3)).toEqual([6]);
  });
});

describe('thumbSizes', () => {
  it('follows the card width at every column count', () => {
    expect(thumbSizes({ 2: 6, 3: 6, 4: 4 })).toBe(
      [
        '(min-width: 1700px) 430px',
        '(min-width: 1450px) 658px',
        '(min-width: 1148px) calc((92vw + 48px) / 2 - 28px)',
        '(min-width: 900px) calc((92vw + 48px) / 2 - 28px)',
        '(min-width: 641px) 168px',
        '88px',
      ].join(', '),
    );
    expect(thumbSizes({ 2: 4, 3: 4, 4: 3 })).toContain('(min-width: 1700px) 315px');
    expect(thumbSizes({ 2: 4, 3: 4, 4: 3 })).toContain('(min-width: 1148px) calc((92vw + 48px) / 3 - 28px)');
  });
});
