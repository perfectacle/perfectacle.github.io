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

test('mermaid diagrams render to SVG as they scroll into view', async ({ page }) => {
  await page.goto(MERMAID_POST);
  // Counted in one pass: diagrams near the top may already have been swapped in.
  const total = await page.evaluate(() => document.querySelectorAll('code.language-mermaid, div.mermaid').length);
  expect(total).toBeGreaterThan(0);
  // Diagrams are swapped in as they near the viewport, so walk down the page.
  for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 600) {
    await page.evaluate(top => window.scrollTo(0, top), y);
    await page.waitForTimeout(50);
  }
  await expect(page.locator('div.mermaid svg')).toHaveCount(total);
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

test('home shows post thumbnails at list size', async ({ page, isMobile }) => {
  await page.goto('/');
  const thumbs = page.locator('.post-list img.thumb');
  expect(await thumbs.count()).toBeGreaterThan(0);
  const first = thumbs.first();
  await expect.poll(() => first.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  // List thumbnails are card-sized copies, never the post's full-width images.
  expect(await first.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeLessThanOrEqual(960);
  // A phone shows an 88px thumbnail; anything past the 480w copy means `sizes` stopped matching the layout.
  if (isMobile) {
    const picked = await first.evaluate((el: HTMLImageElement) => {
      const current = new URL(el.currentSrc).pathname;
      const hit = el.srcset
        .split(',')
        .map(c => c.trim().split(/\s+/))
        .find(([url]) => url === current);
      return Number.parseInt(hit?.[1] ?? '', 10);
    });
    expect(picked).toBeLessThanOrEqual(480);
  }
});

test('post header links straight to the comments', async ({ page }) => {
  await page.goto(POST);
  await page.locator('.post-head').getByRole('link', { name: '댓글' }).click();
  await expect(page).toHaveURL(/#comments$/);
  await expect(page.locator('#comments')).toBeInViewport();
});

test('post lists related posts', async ({ page }) => {
  await page.goto(POST);
  await expect(page.getByRole('region', { name: '관련 글' }).getByRole('link').first()).toBeVisible();
});

test('code blocks show the language and copy their code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(MERMAID_POST);
  const block = page
    .locator('.code-block')
    .filter({ has: page.locator('.code-lang', { hasText: 'sql' }) })
    .first();
  await block.scrollIntoViewIfNeeded();
  await block.getByRole('button', { name: '복사' }).click();
  await expect(block.getByRole('button', { name: '복사됨' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe((await block.locator('pre').innerText()).replace(/\n$/, ''));
});

test('series posts list every part and link the neighbours', async ({ page }) => {
  await page.goto('/2018/03/31/tcp-ip-book-index-3/');
  const series = page.getByRole('navigation', { name: '시리즈: TCP/IP 쉽게, 더 쉽게 목차 리뷰', exact: true });
  await expect(series).toContainText('3/5');
  await expect(series.locator('a[aria-current="page"]')).toContainText('3장 트랜스포트 계층');
  await expect(series.getByRole('listitem')).toHaveCount(5);
  await series.getByRole('link', { name: '다음 편 →' }).click();
  await expect(page).toHaveURL(/\/2018\/04\/01\/tcp-ip-book-index-4\/$/);
});

test('posts outside a series show no series box', async ({ page }) => {
  await page.goto(POST);
  await expect(page.getByRole('navigation', { name: /^시리즈/ })).toHaveCount(0);
});

test('table of contents opens as a sheet on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(POST);
  await page.evaluate(() => window.scrollTo(0, 1500));
  const open = page.getByRole('button', { name: '목차 열기' });
  await expect(open).toBeVisible();
  await open.click();
  const sheet = page.getByRole('dialog', { name: '목차' });
  await expect(sheet).toBeVisible();
  await expect(open).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(open).toBeFocused();

  await open.click();
  const link = sheet.getByRole('link').last();
  const hash = await link.evaluate((a: HTMLAnchorElement) => a.hash);
  await link.click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(new RegExp(`${hash}$`));
  // Keyboard and screen reader users continue from the chosen heading, not from the button.
  await expect(page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`)).toBeFocused();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`series box and open contents sheet have no serious accessibility violations (${colorScheme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme });
    await page.goto('/2025/12/10/travel-002-turkiye-01/');
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.getByRole('button', { name: '목차 열기' }).click();
    const sheet = page.getByRole('dialog', { name: '목차' });
    await expect(sheet).toBeVisible();
    // Contrast is sampled from the rendered pixels, so wait out the slide-in fade.
    await sheet.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
    const { violations } = await new AxeBuilder({ page }).exclude('#disqus_thread').analyze();
    const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('tags index lists the most used tags first', async ({ page }) => {
  await page.goto('/tags/');
  const counts = await page.locator('.cloud sup').evaluateAll(els => els.map(el => Number(el.textContent?.trim())));
  expect(counts.length).toBeGreaterThan(10);
  expect(counts).toEqual([...counts].sort((a, b) => b - a));
});

test('series follow seriesOrder, not publish dates', async ({ page }) => {
  // 함수형 JS: the introduction was written after parts 01–06 but is read first.
  await page.goto('/2017/06/26/js-func-01-why-make/');
  const fp = page.getByRole('navigation', { name: '시리즈: 함수형 JS', exact: true });
  // Nine parts: the list starts collapsed.
  await fp.getByText('전체 목록 (9편)').click();
  await expect(fp.getByRole('listitem').first()).toContainText('함수형 프로그래밍(JS)이란');
  await expect(fp.locator('a[aria-current="page"]')).toContainText('왜 쓸까');

  // 자바의 정석: folder 016day (also titled 015일차) comes right after 015day.
  await page.goto('/2017/08/04/Java-study-016day/');
  const java = page.getByRole('navigation', { name: '시리즈: 자바의 정석 3판 스터디', exact: true });
  await expect(java).toContainText('16/16');
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`header cursor blinks only without reduced motion (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    const caret = page.locator('.brand .caret');
    await expect(caret).toBeVisible();
    await expect(caret).toHaveAttribute('aria-hidden', 'true');
    const blinking = await caret.evaluate(el => el.getAnimations().length > 0);
    expect(blinking).toBe(reducedMotion === 'no-preference');
  });
}
