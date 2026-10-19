import { describe, expect, it } from 'vitest';
import { ASTRO_SIZES, postImageSizes } from '../src/lib/rehype-post-images.ts';

/** Width the browser picks from a `sizes` list at a viewport, evaluating only the forms postImageSizes emits. */
function slotWidth(sizes: string, viewport: number): number {
  for (const entry of sizes.split(/,\s*(?![^(]*\))/)) {
    const m = /^\(min-width: (\d+)px\) (.+)$/.exec(entry);
    if (m && viewport < Number(m[1])) continue;
    const value = m?.[2] ?? entry;
    const px = /^(\d+)px$/.exec(value);
    if (px) return Number(px[1]);
    const calc = /^calc\((\d+)vw ([+-]) (\d+)px\)$/.exec(value);
    if (!calc) throw new Error(`unexpected size ${value}`);
    const vw = (Number(calc[1]) * viewport) / 100;
    return calc[2] === '+' ? vw + Number(calc[3]) : vw - Number(calc[3]);
  }
  throw new Error('no size matched');
}

// Rendered widths of a 960px-capped post image, measured in Chromium (getBoundingClientRect) on the built site:
// the kenya post (with sidebar) and the JetBrains-License post (without).
const measured = {
  sidebar: { 390: 358, 800: 756, 1101: 697, 1280: 862, 1440: 960, 1920: 960 },
  none: { 390: 358, 800: 756, 1101: 960, 1280: 960, 1920: 960 },
};

describe('postImageSizes', () => {
  it("recognises the sizes Astro writes, whatever the image's width", () => {
    const html = '<img sizes="(min-width: 960px) 960px, 100vw"><img sizes="(min-width: 800px) 800px, 100vw">';
    expect([...html.matchAll(ASTRO_SIZES)].map(m => m[1])).toEqual(['960', '800']);
  });

  it('never claims more than a smaller image is wide', () => {
    for (const vw of [390, 700, 1000, 1101, 1300, 1920]) {
      expect(slotWidth(postImageSizes(true, 600), vw)).toBeLessThanOrEqual(600);
      expect(slotWidth(postImageSizes(false, 800), vw)).toBeLessThanOrEqual(800);
    }
    // Beside the sidebar at 1150px the column (92vw - 316px = 742px) is narrower than an 800px image.
    expect(slotWidth(postImageSizes(true, 800), 1150)).toBeCloseTo(742, -1);
  });

  it('matches the real image width beside the contents sidebar', () => {
    for (const [vw, px] of Object.entries(measured.sidebar))
      expect(slotWidth(postImageSizes(true), Number(vw))).toBeCloseTo(px, -1);
  });

  it('matches the real image width without a sidebar', () => {
    for (const [vw, px] of Object.entries(measured.none))
      expect(slotWidth(postImageSizes(false), Number(vw))).toBeCloseTo(px, -1);
  });
});
