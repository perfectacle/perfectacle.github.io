import { expect, test } from '@playwright/test';
import { KR_PATCHES, KR_PATCH_LIST_PATH, KR_PATCH_SFC_PATH } from '../src/lib/kr-patches.ts';

for (const path of [KR_PATCH_LIST_PATH, KR_PATCH_SFC_PATH, ...KR_PATCHES.map(patch => `${patch.path}/`)]) {
  test(`${path} keeps Korean pixel text in its web font at native scale`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Platform font inspection uses the Chromium DevTools protocol.');
    await page.goto(path);
    const { groups, sizes, koreanText } = await page.evaluate(async () => {
      const chars = new Set<string>();
      const sizes = new Set<number>();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, template')) continue;
        const style = getComputedStyle(parent);
        if (!style.fontFamily.includes('PatchGalmuri11')) continue;
        if (node.textContent?.trim()) sizes.add(Number.parseFloat(style.fontSize));
        const korean = [...(node.textContent ?? '')].filter(char =>
          /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u.test(char),
        );
        for (const char of korean) chars.add(char);
      }
      const koreanText = [...chars].join('');
      const probes = ['400', '700'].map((weight, index) => {
        const probe = document.createElement('span');
        probe.dataset['fontProbe'] = String(index);
        probe.setAttribute('aria-hidden', 'true');
        Object.assign(probe.style, {
          position: 'absolute',
          left: '0',
          top: '0',
          fontFamily: 'PatchGalmuri11',
          fontWeight: weight,
          fontSize: '12px',
        });
        probe.textContent = koreanText;
        document.body.append(probe);
        return { weight, text: probe.textContent };
      });
      await document.fonts.ready;
      return { groups: probes, sizes: [...sizes], koreanText };
    });
    expect(koreanText.length, 'Korean pixel text on the page').toBeGreaterThan(0);
    expect(sizes.length, 'Pixel text sizes on the page').toBeGreaterThan(0);
    for (const size of sizes) {
      // The font's 12px source grid needs whole multiples to keep pixel strokes even.
      expect(size % 12, `Pixel font size ${size}px`).toBe(0);
    }
    const session = await page.context().newCDPSession(page);
    await session.send('DOM.enable');
    await session.send('CSS.enable');
    const { root } = await session.send('DOM.getDocument');
    for (const [index, group] of groups.entries()) {
      expect(group.text.length, `Korean text at weight ${group.weight}`).toBeGreaterThan(0);
      const { nodeId } = await session.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: `[data-font-probe="${index}"]`,
      });
      const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
      const rendered = fonts.filter(font => font.glyphCount > 0);
      expect(rendered.length, `Rendered Korean font at weight ${group.weight}`).toBeGreaterThan(0);
      expect(
        rendered.filter(font => !font.isCustomFont),
        `System fallback at weight ${group.weight}`,
      ).toEqual([]);
    }
    await session.detach();
  });
}
