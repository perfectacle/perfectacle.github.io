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

test('search page returns results for ?q=', async ({ page }) => {
  await page.goto('/search/?q=트랜잭션');
  await expect(page.locator('pagefind-results[instance="page"] .pf-result-link').first()).toBeVisible();
  await expect(page.locator('pagefind-summary[instance="page"]')).toContainText('결과');
});

test('search modal opens with the shortcut and finds posts', async ({ page, isMobile }) => {
  await page.goto('/');
  // The search UI mounts asynchronously; the shortcut is only bound once the trigger exists.
  await expect(page.locator('pagefind-modal-trigger button')).toBeVisible();
  if (isMobile) await page.locator('pagefind-modal-trigger button').click();
  // The emulated desktop device reports Windows, so Pagefind's `mod` key is Ctrl even on a Mac host.
  else await page.keyboard.press('Control+k');
  const input = page.locator('pagefind-modal input');
  await expect(input).toBeFocused();
  await input.fill('코루틴');
  await expect(page.locator('pagefind-modal .pf-result-link').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(input).toBeHidden();
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
  await page.getByRole('button', { name: '테마 전환' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('unknown URL serves the 404 page', async ({ page }) => {
  const res = await page.goto('/no/such/page/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`open search modal has no serious accessibility violations (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await page.locator('pagefind-modal-trigger button').click();
    await page.locator('pagefind-modal input').fill('코루틴');
    await expect(page.locator('pagefind-modal .pf-result-link').first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).include('pagefind-modal').analyze();
    const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('YouTube embeds load only after clicking the thumbnail', async ({ page }) => {
  await page.goto('/2025/12/02/travel-001-kenya-01/');
  await expect(page.locator('.prose iframe[src*="youtube"]')).toHaveCount(0);
  const facade = page.locator('.yt-facade').first();
  await facade.scrollIntoViewIfNeeded();
  await facade.click();
  await expect(page.locator('.prose iframe[src*="youtube-nocookie.com/embed/"]')).toHaveCount(1);
});

test('YouTube embeds keep their start time', async ({ page }) => {
  await page.goto('/2025/12/02/travel-001-kenya-01/');
  const facade = page.locator('.yt-facade[data-start="512"]');
  await facade.scrollIntoViewIfNeeded();
  await facade.click();
  await expect(page.locator('iframe[src*="G3sbCAv0gBE"][src*="start=512"]')).toHaveCount(1);
});

test('post images open full screen and close with Escape', async ({ page }) => {
  await page.goto('/2025/12/02/travel-001-kenya-01/');
  const img = page.locator('.prose img.zoomable').nth(1);
  await img.scrollIntoViewIfNeeded();
  await img.click();
  const viewer = page.locator('.pswp');
  await expect(viewer).toBeVisible();
  await expect(page.locator('.pswp__counter')).toContainText('2 / ');
  // Keys are ignored while the opening transition runs; it ends once the full-size image is shown.
  await expect(page.locator('.pswp__img').first()).toBeVisible();
  await page.waitForFunction(() => {
    const viewerEl = document.querySelector('.pswp');
    return !!viewerEl && getComputedStyle(viewerEl).opacity === '1';
  });
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
});

test('images inside links keep the link instead of zooming', async ({ page }) => {
  await page.goto('/2016/11/26/Markdown-Badge/');
  await expect(page.locator('.prose a img.zoomable')).toHaveCount(0);
});
