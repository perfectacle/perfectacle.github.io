import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const GOKUDEN = '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-totsugeki/';

for (const path of ['/games/kr-patches/', '/games/kr-patches/sfc/super-mario-rpg/', GOKUDEN]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} guide works in ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
      for (const img of await page.locator('main img').all()) {
        if (!(await img.isVisible())) continue;
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      }
      for (const hash of await page
        .locator('a[href^="#"]')
        .evaluateAll(links => links.map(a => (a as HTMLAnchorElement).hash))) {
        if (hash) await expect(page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`)).toHaveCount(1);
      }
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

const GAME = '/games/kr-patches/sfc/super-mario-rpg/';

test('catalogue opens the game page, which leads with the patch box and plays no media', async ({ page }) => {
  await page.goto('/games/kr-patches/');
  await page.locator(`main a[href="${GAME}"]`).first().click();
  await expect(page).toHaveURL(/\/games\/kr-patches\/sfc\/super-mario-rpg\/$/);
  await expect(page.getByText('일본판 게임 파일 고르기')).toBeInViewport();
  const html = await page.content();
  expect(html).not.toContain('hansicgu/37276');
  expect(html).not.toContain('blog.naver.com');
  await expect(page.locator('audio, video, canvas, iframe')).toHaveCount(0);
  await expect(page.locator(`a[href$=".ips"]`)).toHaveAttribute('download', '');
});

test('patch box explains why a file cannot be patched', async ({ page }) => {
  await page.goto(GAME);
  const input = page.locator('.patch-box input[type=file]');
  const status = page.locator('.patch-status');
  await input.setInputFiles({ name: 'photo.sfc', mimeType: 'application/octet-stream', buffer: Buffer.alloc(1024) });
  await expect(status).toContainText('너무 작습니다');
  await input.setInputFiles({
    name: 'other.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(4 * 1024 * 1024),
  });
  await expect(status).toContainText('다른 게임 파일');
});

test('comparison groups reveal the remaining scenes on demand', async ({ page }) => {
  await page.goto(GAME);
  const more = page.locator('#korean details.more').first();
  const hidden = more.locator('img').first();
  await expect(hidden).not.toBeVisible();
  await more.locator('summary').click();
  await hidden.scrollIntoViewIfNeeded();
  await expect.poll(() => hidden.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
});

test('patch pages describe where they sit and keep analytics off outside the published site', async ({ page }) => {
  const gtag: string[] = [];
  page.on('request', r => {
    if (r.url().includes('googletagmanager.com')) gtag.push(r.url());
  });
  await page.goto(GAME, { waitUntil: 'load' });
  const [block] = await page.locator('script[type="application/ld+json"]').allTextContents();
  const crumbs = JSON.parse(block ?? '{}') as { '@type': string; itemListElement: { item: string }[] };
  expect(crumbs['@type']).toBe('BreadcrumbList');
  expect(crumbs.itemListElement.map(i => new URL(i.item).pathname)).toEqual(['/', '/games/kr-patches/', GAME]);
  await page.waitForTimeout(3500);
  expect(gtag).toEqual([]);
});

test('llms.txt points AI assistants to the patch pages', async ({ request }) => {
  const text = await (await request.get('/llms.txt')).text();
  expect(text).toContain(`https://perfectacle.github.io${GAME}`);
  expect(text).toContain(`https://perfectacle.github.io${GOKUDEN}`);
});

test('catalogue lists every game page', async ({ page }) => {
  await page.goto('/games/kr-patches/');
  for (const path of [GAME, GOKUDEN]) await expect(page.locator(`main h2 a[href="${path}"]`)).toHaveCount(1);
});

test('Super Gokuden patch box checks for its own 2 MB ROM', async ({ page }) => {
  await page.goto(GOKUDEN);
  await expect(page.getByText('일본판 게임 파일 고르기')).toBeInViewport();
  const input = page.locator('.patch-box input[type=file]');
  const status = page.locator('.patch-status');
  await input.setInputFiles({
    name: 'smrpg.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(4 * 1024 * 1024),
  });
  await expect(status).toContainText('크기가 2MB인 파일이 필요합니다');
  await input.setInputFiles({
    name: 'other.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(2 * 1024 * 1024),
  });
  await expect(status).toContainText('초오공전 돌격편 한글판을 만들 수 없습니다');
  for (const link of await page.locator('a[href$=".ips"]').all()) await expect(link).toHaveAttribute('download', '');
});
