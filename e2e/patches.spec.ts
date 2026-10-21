import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  GOKUDEN_KAKUSEI,
  GOKUDEN_TOTSUGEKI,
  OTOGIRISOU,
  SMRPG,
  applyIps,
  hasGameHeader,
  patchedSize,
  type RomSpec,
} from '../src/lib/rom-patch.ts';

const GOKUDEN = '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-totsugeki/';
const KAKUSEI = '/games/kr-patches/sfc/dragon-ball-z-super-gokuden-kakusei/';
const OTOGIRI = '/games/kr-patches/sfc/otogirisou/';

for (const path of ['/games/kr-patches/', '/games/kr-patches/sfc/super-mario-rpg/', GOKUDEN, KAKUSEI, OTOGIRI]) {
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
  expect(html).not.toContain('cafe.naver.com/hansicgu');
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
  expect(text).toContain(`https://perfectacle.github.io${KAKUSEI}`);
  expect(text).toContain(`https://perfectacle.github.io${OTOGIRI}`);
});

test('catalogue lists every game page', async ({ page }) => {
  await page.goto('/games/kr-patches/');
  for (const path of [GAME, GOKUDEN, KAKUSEI, OTOGIRI])
    await expect(page.locator(`main h2 a[href="${path}"]`)).toHaveCount(1);
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

const gameRom = (spec: RomSpec) => {
  const rom = new Uint8Array(spec.size);
  rom.set(
    Array.from(spec.header.title, c => c.charCodeAt(0)),
    0x7fc0,
  );
  rom.set([spec.header.mapMode, spec.header.cartType, spec.header.romSize], 0x7fd5);
  return rom;
};

for (const [spec, path] of [
  [SMRPG, `${GAME}downloads/Super_Mario_RPG_K_v1_1.ips`],
  [GOKUDEN_TOTSUGEKI, `${GOKUDEN}downloads/Dragon_Ball_Z_Super_Gokuden_Totsugeki_Hen_K_v1_1.ips`],
  [GOKUDEN_KAKUSEI, `${KAKUSEI}downloads/Dragon_Ball_Z_Super_Gokuden_Kakusei_Hen_K_v1_2.ips`],
  [OTOGIRISOU, `${OTOGIRI}downloads/Otogirisou_K_v1_2.ips`],
] as const) {
  test(`published ${spec.name} IPS keeps the ROM size and game header`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const output = applyIps(spec, gameRom(spec), new Uint8Array(await response.body()));
    expect(output.length).toBe(patchedSize(spec));
    expect(hasGameHeader(spec, output, 'patched')).toBe(true);
  });
}

test('Super Gokuden: Kakusei-hen patch box tells it apart from Totsugeki-hen', async ({ page }) => {
  await page.goto(KAKUSEI);
  await expect(page.getByText('일본판 게임 파일 고르기')).toBeInViewport();
  const totsugeki = new Uint8Array(GOKUDEN_TOTSUGEKI.size);
  totsugeki.set(
    Array.from(GOKUDEN_TOTSUGEKI.header.title, c => c.charCodeAt(0)),
    0x7fc0,
  );
  await page.locator('.patch-box input[type=file]').setInputFiles({
    name: 'totsugeki.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(totsugeki),
  });
  await expect(page.locator('.patch-status')).toContainText('초오공전 각성편 한글판을 만들 수 없습니다');
  const korean = new Uint8Array(GOKUDEN_KAKUSEI.size);
  korean.set(
    Array.from(GOKUDEN_KAKUSEI.patchedTitle ?? '', c => c.charCodeAt(0)),
    0x7fc0,
  );
  korean.set([GOKUDEN_KAKUSEI.header.mapMode, GOKUDEN_KAKUSEI.header.cartType, GOKUDEN_KAKUSEI.header.romSize], 0x7fd5);
  await page.locator('.patch-box input[type=file]').setInputFiles({
    name: 'kakusei-v1.1.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(korean),
  });
  await expect(page.locator('.patch-status')).toContainText('예전에 나온 한글판 파일입니다');
});

test('Otogirisou patch box wants the 1 MB original and turns away a 2 MB Korean build', async ({ page }) => {
  await page.goto(OTOGIRI);
  await expect(page.getByText('일본판 게임 파일 고르기')).toBeInViewport();
  const input = page.locator('.patch-box input[type=file]');
  const status = page.locator('.patch-status');
  await input.setInputFiles({
    name: 'other.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(2 * 1024 * 1024),
  });
  await expect(status).toContainText('크기가 1MB인 파일이 필요합니다');
  const korean = new Uint8Array(2 * 1024 * 1024);
  korean.set(
    Array.from(OTOGIRISOU.header.title, c => c.charCodeAt(0)),
    0x7fc0,
  );
  korean.set([OTOGIRISOU.header.mapMode, OTOGIRISOU.header.cartType, OTOGIRISOU.header.romSize + 1], 0x7fd5);
  await input.setInputFiles({
    name: 'otogirisou-k.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(korean),
  });
  await expect(status).toContainText('예전에 나온 한글판 파일입니다');
  await expect(status).not.toContainText('v1.');
});
