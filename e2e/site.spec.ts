import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const POST = '/2022/06/06/tdd-is-design-activity/';
const MERMAID_POST = '/2022/09/25/hikari-cp-time-config/';

// Third-party embeds (Disqus, YouTube) log their own errors; only the site's are ours.
const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && m.location().url.startsWith('http://localhost')) errors.push(m.text());
  });
  return errors;
};

const noHorizontalOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
    0,
  );

for (const path of ['/', POST, '/archives/', '/tags/', '/categories/', '/about/', '/search/']) {
  test(`${path} renders without errors or overflow`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
    await noHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} has no serious accessibility violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).exclude('#disqus_thread').analyze();
      const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('home lists 10 posts and paginates', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.post-list > li')).toHaveCount(10);
  await page.getByRole('link', { name: '다음 →' }).click();
  await expect(page).toHaveURL(/\/page\/2\/$/);
});

test('post images load', async ({ page }) => {
  await page.goto(POST);
  const images = page.locator('.prose img');
  await expect(images.first()).toBeVisible();
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
});

test('table of contents links point at headings', async ({ page }) => {
  await page.goto(POST);
  const hrefs = await page.locator('.toc a').evaluateAll(as => as.map(a => (a as HTMLAnchorElement).hash));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const hash of hrefs) await expect(page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`)).toHaveCount(1);
});

test('search returns results', async ({ page }) => {
  await page.goto('/search/?q=트랜잭션');
  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible();
});

test('mermaid diagrams render to SVG', async ({ page }) => {
  await page.goto(MERMAID_POST);
  await expect(page.locator('div.mermaid svg').first()).toBeVisible();
  await expect(page.locator('code.language-mermaid')).toHaveCount(0);
});

test('theme toggle switches and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '다크 모드 전환' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('unknown URL serves the 404 page', async ({ page }) => {
  const res = await page.goto('/no/such/page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
});
