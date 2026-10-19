import { chromium, expect, test } from '@playwright/test';
import lighthouse from 'lighthouse';

// Auto-merged dependency updates must not quietly make the site slower or heavier.
// Byte budgets are deterministic and strict. Timing comes from Lighthouse's simulated mobile throttling,
// which still varies with the CI runner's CPU, so each page runs RUNS times and the median is judged.
const RUNS = 3;
const PAGES: Record<string, { scriptKb: number; tbtMs?: number }> = {
  '/': { scriptKb: 60 },
  '/2022/06/06/tdd-is-design-activity/': { scriptKb: 60 },
  // 30+ YouTube embeds and ~150 images: guards the click-to-load facade and responsive images.
  '/2025/12/02/travel-001-kenya-01/': { scriptKb: 60 },
  // Mermaid loads and renders per diagram as it scrolls into view, so the initial page stays light.
  '/2022/09/25/hikari-cp-time-config/': { scriptKb: 60 },
  '/search/': { scriptKb: 60 },
  '/patches/super-mario-rpg/': { scriptKb: 1 },
};
const MIN_SCORE = { performance: 0.8, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };
// Fonts: the site uses system fonts only, so any web font download is a regression.
const MAX = { lcpMs: 3500, cls: 0.1, tbtMs: 300, imageKb: 1500, fontKb: 50 };
const PORT = 9333;

let browser: Awaited<ReturnType<typeof chromium.launch>>;
test.beforeAll(async () => {
  browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
});
test.afterAll(async () => browser.close());

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? NaN;

for (const [path, budget] of Object.entries(PAGES)) {
  test(`lighthouse ${path}`, async ({ baseURL }) => {
    const runs: Record<string, number>[] = [];
    for (let i = 0; i < RUNS; i++) {
      const result = await lighthouse(new URL(path, baseURL).href, {
        port: PORT,
        logLevel: 'error',
        onlyCategories: Object.keys(MIN_SCORE),
      });
      if (!result) throw new Error(`lighthouse returned no result for ${path}`);
      const { lhr } = result;
      const num = (id: string) => lhr.audits[id]?.numericValue ?? Infinity;
      const items =
        (lhr.audits['resource-summary']?.details as { items?: { resourceType: string; transferSize: number }[] })
          ?.items ?? [];
      const kb = (type: string) => (items.find(i => i.resourceType === type)?.transferSize ?? 0) / 1024;
      runs.push({
        ...Object.fromEntries(Object.keys(MIN_SCORE).map(c => [c, lhr.categories[c]?.score ?? 0])),
        lcpMs: num('largest-contentful-paint'),
        cls: num('cumulative-layout-shift'),
        tbtMs: num('total-blocking-time'),
        scriptKb: kb('script'),
        imageKb: kb('image'),
        fontKb: kb('font'),
      });
    }
    const m = Object.fromEntries(Object.keys(runs[0] ?? {}).map(k => [k, median(runs.map(r => r[k] ?? NaN))]));
    console.log(path, JSON.stringify(m));
    for (const [c, min] of Object.entries(MIN_SCORE)) expect.soft(m[c], c).toBeGreaterThanOrEqual(min);
    expect.soft(m['lcpMs'], 'LCP').toBeLessThanOrEqual(MAX.lcpMs);
    expect.soft(m['cls'], 'CLS').toBeLessThanOrEqual(MAX.cls);
    expect.soft(m['tbtMs'], 'TBT').toBeLessThanOrEqual(budget.tbtMs ?? MAX.tbtMs);
    expect.soft(m['scriptKb'], 'script KB').toBeLessThanOrEqual(budget.scriptKb);
    expect.soft(m['imageKb'], 'image KB').toBeLessThanOrEqual(MAX.imageKb);
    expect.soft(m['fontKb'], 'font KB').toBeLessThanOrEqual(MAX.fontKb);
  });
}
