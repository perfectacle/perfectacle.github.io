import { chromium, expect, test } from '@playwright/test';
import lighthouse from 'lighthouse';

// Auto-merged dependency updates must not quietly make the site slower or heavier.
// Lab numbers from Lighthouse's simulated mobile throttling; thresholds leave headroom over measured values.
const PAGES: Record<string, { scriptKb: number; tbtMs?: number }> = {
  '/': { scriptKb: 60 },
  '/2022/06/06/tdd-is-design-activity/': { scriptKb: 60 },
  // 30+ YouTube embeds and ~150 images: guards the click-to-load facade and responsive images.
  '/2025/12/02/travel-001-kenya-01/': { scriptKb: 60 },
  // Mermaid is loaded only on pages with diagrams.
  '/2022/09/25/hikari-cp-time-config/': { scriptKb: 300, tbtMs: 400 },
  '/search/': { scriptKb: 60 },
};
const MIN_SCORE = { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 0.95 };
const MAX = { lcpMs: 2500, cls: 0.1, tbtMs: 200 };
const PORT = 9333;

let browser: Awaited<ReturnType<typeof chromium.launch>>;
test.beforeAll(async () => {
  browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
});
test.afterAll(async () => browser.close());

for (const [path, budget] of Object.entries(PAGES)) {
  test(`lighthouse ${path}`, async ({ baseURL }) => {
    const result = await lighthouse(new URL(path, baseURL).href, {
      port: PORT,
      logLevel: 'error',
      onlyCategories: Object.keys(MIN_SCORE),
    });
    if (!result) throw new Error(`lighthouse returned no result for ${path}`);
    const { lhr } = result;
    const scores = Object.fromEntries(Object.keys(MIN_SCORE).map(c => [c, lhr.categories[c]?.score ?? 0]));
    const num = (id: string) => lhr.audits[id]?.numericValue ?? Infinity;
    const scriptKb =
      ((
        lhr.audits['resource-summary']?.details as { items?: { resourceType: string; transferSize: number }[] }
      )?.items?.find(i => i.resourceType === 'script')?.transferSize ?? 0) / 1024;
    const measured = {
      ...scores,
      lcpMs: num('largest-contentful-paint'),
      cls: num('cumulative-layout-shift'),
      tbtMs: num('total-blocking-time'),
      scriptKb,
    };
    console.log(path, JSON.stringify(measured));
    for (const [c, min] of Object.entries(MIN_SCORE)) expect.soft(scores[c], c).toBeGreaterThanOrEqual(min);
    expect.soft(measured.lcpMs, 'LCP').toBeLessThanOrEqual(MAX.lcpMs);
    expect.soft(measured.cls, 'CLS').toBeLessThanOrEqual(MAX.cls);
    expect.soft(measured.tbtMs, 'TBT').toBeLessThanOrEqual(budget.tbtMs ?? MAX.tbtMs);
    expect.soft(scriptKb, 'script KB').toBeLessThanOrEqual(budget.scriptKb);
  });
}
