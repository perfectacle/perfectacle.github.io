import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const POST = '/2022/06/06/tdd-is-design-activity/';
const MERMAID_POST = '/2022/09/25/hikari-cp-time-config/';

// Third-party embeds (Waline, YouTube) log their own errors; only the site's are ours.
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
      const { violations } = await new AxeBuilder({ page }).exclude('#waline').analyze();
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

test('post describes itself as structured data for search engines', async ({ page }) => {
  await page.goto(POST);
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = blocks.map(b => (JSON.parse(b) as { '@type': string })['@type']);
  expect(types).toEqual(['BlogPosting', 'BreadcrumbList']);
  const article = JSON.parse(blocks[0] ?? '{}') as { url: string; headline: string };
  expect(article.url).toBe(`https://perfectacle.github.io${POST}`);
  expect(article.headline).toBe(await page.locator('h1').textContent());
});

test('llms.txt lists posts for AI assistants', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toMatch(/^# /);
  expect(text).toContain(`https://perfectacle.github.io${POST}`);
});

test('comments load from the Waline server without reaching other services', async ({ page }) => {
  const outside: string[] = [];
  page.on('request', r => {
    const { hostname } = new URL(r.url());
    if (
      !['localhost', '127.0.0.1', 'blog-comments-perfectacle.vercel.app'].includes(hostname) &&
      !r.url().startsWith('data:')
    )
      outside.push(r.url());
  });
  let asked = '';
  await page.route('https://blog-comments-perfectacle.vercel.app/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/comment') asked = url.searchParams.get('path') ?? '';
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        errno: 0,
        errmsg: '',
        data: {
          page: 1,
          totalPages: 1,
          pageSize: 10,
          count: 1,
          data: [
            {
              objectId: '1',
              nick: '손님',
              comment: '<p>옛 댓글</p>',
              avatar: '',
              time: Date.now(),
              link: '',
              like: 0,
              status: 'approved',
              children: [],
            },
          ],
        },
      }),
    });
  });
  await page.goto(POST);
  await page.locator('#waline .load').click();
  await expect(page.locator('#waline').getByText('옛 댓글')).toBeVisible();
  await expect(page.locator('#waline textarea')).toBeVisible();
  expect(asked).toBe(POST);
  expect(outside).toEqual([]);
});

test('analytics stays off outside the published site', async ({ page }) => {
  const gtag: string[] = [];
  page.on('request', r => {
    if (r.url().includes('googletagmanager.com')) gtag.push(r.url());
  });
  await page.goto(POST, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  expect(gtag).toEqual([]);
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
    const { violations } = await new AxeBuilder({ page }).exclude('#waline').analyze();
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

const bubbleCentre = (page: Page, nth: number) =>
  page
    .locator('.cloud.is-live > li')
    .nth(nth)
    .evaluate(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });

test('tags turn into bubbles that keep their links and grow with post count', async ({ page }) => {
  await page.goto('/tags/');
  const items = page.locator('.cloud.is-live > li');
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeGreaterThan(10);
  await expect(items.first().locator('a')).toHaveAttribute('href', /^\/tags\/.+\/$/);
  const width = (i: number) => items.nth(i).evaluate(el => el.getBoundingClientRect().width);
  await expect.poll(async () => (await width(0)) / (await width((await items.count()) - 1))).toBeGreaterThan(1.5);
});

test('a bubble can be dragged without following its link', async ({ page }) => {
  await page.goto('/tags/');
  const before = await bubbleCentre(page, 0);
  await page.mouse.move(before.x, before.y);
  await page.mouse.down();
  await page.mouse.move(before.x + 150, before.y + 120, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => (await bubbleCentre(page, 0)).x).toBeGreaterThan(before.x + 50);
  await expect(page).toHaveURL(/\/tags\/$/);
});

test('clicking a bubble opens its tag page', async ({ page }) => {
  await page.goto('/tags/');
  const href = await page
    .locator('.cloud.is-live > li a')
    .first()
    .evaluate(a => (a as HTMLAnchorElement).href);
  // The bubbles bob forever, so Playwright's wait for a still element would never end; click where it is.
  const { x, y } = await bubbleCentre(page, 0);
  await page.mouse.click(x, y);
  await expect(page).toHaveURL(href);
});

test('searching tags marks the misses and Enter opens the first hit', async ({ page }) => {
  await page.goto('/tags/');
  const search = page.getByRole('searchbox', { name: '태그 찾기' });
  const status = page.locator('.tools').getByRole('status');
  await search.fill('java');
  await expect(status).toHaveText(/태그 \d+개 찾음/);
  const hits = page.locator('.cloud.is-live > li:not(.miss)');
  expect(await hits.count()).toBeGreaterThan(0);
  for (const name of await hits.evaluateAll(els => els.map(el => (el as HTMLElement).dataset.name ?? ''))) {
    expect(name.toLowerCase()).toContain('java');
  }
  await search.fill('없는태그없는태그');
  await expect(status).toHaveText('찾는 태그가 없습니다');
  await search.fill('java');
  const first = await hits
    .first()
    .locator('a')
    .evaluate(a => (a as HTMLAnchorElement).href);
  await search.press('Enter');
  await expect(page).toHaveURL(first);
});

test('with reduced motion the bubbles start at rest', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tags/');
  const first = await bubbleCentre(page, 0);
  await page.waitForTimeout(300);
  expect(await bubbleCentre(page, 0)).toEqual(first);
  const scale = await page
    .locator('.cloud.is-live > li')
    .first()
    .evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
  expect(scale).toBeCloseTo(1, 1);
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

// Pages whose post counts exercise the card distribution: a full page, the last (shorter) page, and the smallest
// category of every size from 2 to 9 posts. Found from the built site so they keep tracking it as posts are added.
const gridPages = async (page: Page) => {
  await page.goto('/');
  const last = Math.max(
    ...(await page.locator('.pagination a').evaluateAll(as => as.map(a => Number(a.textContent?.trim()) || 0))),
  );
  await page.goto('/categories/');
  const categories = await page.locator('.roots a').evaluateAll(as =>
    as.map(a => ({
      href: new URL((a as HTMLAnchorElement).href).pathname,
      count: Number(a.querySelector('.count')?.textContent),
    })),
  );
  const bySize = new Map<number, string>();
  for (const { href, count } of categories) if (count >= 2 && count <= 9 && !bySize.has(count)) bySize.set(count, href);
  return ['/', `/page/${last}/`, ...bySize.values()];
};

for (const width of [1000, 1280, 1920]) {
  test(`card grid never leaves a lone card in a row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const paths = await gridPages(page);
    expect(paths.length).toBeGreaterThan(4);
    for (const path of paths) {
      await page.goto(path);
      const tops = await page
        .locator('.cards > li')
        .evaluateAll(els => els.map(el => Math.round(el.getBoundingClientRect().top)));
      if (tops.length < 2) continue;
      const rows = new Map<number, number>();
      for (const top of tops) rows.set(top, (rows.get(top) ?? 0) + 1);
      expect(
        [...rows.values()].filter(n => n === 1),
        `${path} rows ${[...rows.values()].join(',')}`,
      ).toEqual([]);
    }
  });

  // `sizes` is computed in card-grid.ts from copies of the grid's CSS numbers; this catches the two drifting apart.
  test(`card thumbnails' sizes match their rendered width at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of await gridPages(page)) {
      await page.goto(path);
      const mismatches = await page.locator('.cards img.thumb').evaluateAll(imgs =>
        imgs.flatMap(img => {
          // The first entry whose media condition matches gives the slot width; resolve it as a CSS length.
          const entries = (img as HTMLImageElement).sizes.split(/,\s*(?![^(]*\))/);
          const slot =
            entries.map(e => /^\((.+?)\)\s+(.+)$/.exec(e)).find(m => m && matchMedia(`(${m[1]})`).matches)?.[2] ??
            entries.at(-1);
          const probe = document.createElement('div');
          probe.style.cssText = `position:absolute;left:0;top:0;height:0;width:${slot}`;
          document.body.append(probe);
          const expected = probe.getBoundingClientRect().width;
          probe.remove();
          const actual = img.getBoundingClientRect().width;
          return Math.abs(actual - expected) > 2 ? [`${Math.round(actual)} vs sizes ${Math.round(expected)}`] : [];
        }),
      );
      expect(mismatches, path).toEqual([]);
    }
  });
}

for (const width of [390, 800, 900, 1280, 1920]) {
  test(`posts without an image get a title cover that fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    // A list page is found that holds image-less posts, rather than assuming which page that is.
    let found = false;
    for (let n = 1; n <= 8 && !found; n++) {
      await page.goto(n === 1 ? '/' : `/page/${n}/`);
      found = (await page.locator('[data-cover]').count()) >= 2;
    }
    expect(found).toBe(true);
    const report = await page.locator('.post-list > li:has([data-cover])').evaluateAll(items =>
      items.map(li => {
        const cover = li.querySelector<HTMLElement>('[data-cover]');
        const title = cover?.querySelector<HTMLElement>('.title');
        const frame = cover?.parentElement;
        if (!cover || !title || !frame)
          return { hidden: null, sameTitle: false, visible: false, fitsFrame: false, titleInside: false };
        const box = cover.getBoundingClientRect();
        const f = frame.getBoundingClientRect();
        const t = title.getBoundingClientRect();
        const visible = getComputedStyle(title).display !== 'none';
        return {
          hidden: cover.getAttribute('aria-hidden'),
          sameTitle: title.textContent?.replace(/^#\s*/, '').trim() === li.querySelector('h2')?.textContent?.trim(),
          visible,
          fitsFrame: box.width <= f.width + 1 && box.height <= f.height + 1,
          titleInside: !visible || (t.bottom <= box.bottom + 1 && t.right <= box.right + 1 && t.width > 0),
        };
      }),
    );
    for (const r of report) {
      expect(r.hidden).toBe('true');
      expect(r.sameTitle).toBe(true);
      expect(r.fitsFrame).toBe(true);
      expect(r.titleInside).toBe(true);
    }
    // Phone thumbnails are too small for text, so the cover shows a mark instead of the title.
    expect(report.some(r => r.visible)).toBe(width !== 390);
  });
}

for (const width of [390, 800, 1280]) {
  test(`tapping a title cover opens the post at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/page/4/');
    const item = page.locator('.post-list > li:has([data-cover])').first();
    const href = await item.locator('h2 a').getAttribute('href');
    const cover = item.locator('[data-cover]');
    await cover.scrollIntoViewIfNeeded();
    const box = await cover.boundingBox();
    expect(box).not.toBeNull();
    // A real pointer at the cover's centre, so whatever is painted on top receives it.
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
}

const PATCH_GUIDES = [
  'super-mario-rpg',
  'dragon-ball-z-super-gokuden-totsugeki',
  'dragon-ball-z-super-gokuden-kakusei',
  'otogirisou',
];

for (const game of PATCH_GUIDES) {
  const path = `/games/kr-patches/sfc/${game}/`;

  test(`${game} section navigation moves between the story, play and patch`, async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: '페이지 내 이동', exact: true });
    const menu = nav.locator('details');
    const summary = menu.locator('summary');
    const links = nav.locator('a');
    const hrefs = await links.evaluateAll(items => items.map(item => item.getAttribute('href')));
    expect(hrefs[0]).toBe('#patch');
    expect(hrefs.at(-1)).toBe('#main');
    for (const href of hrefs) {
      expect(href).toMatch(/^#.+/);
      await expect(page.locator(`[id="${href?.slice(1)}"]`)).toHaveCount(1);
    }
    if (game === 'super-mario-rpg') expect(hrefs).toContain('#making');

    for (const hash of ['#story', '#play', '#patch']) {
      if (isMobile) {
        await expect(menu).not.toHaveAttribute('open', '');
        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(menu).toHaveAttribute('open', '');
      }
      const link = nav.locator(`a[href="${hash}"]`);
      const label = (await link.innerText()).trim();
      if (isMobile) {
        await link.focus();
        await page.keyboard.press('Enter');
      } else await link.click();
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
      await expect(nav.locator('[aria-current="location"]')).toHaveCount(1);
      await expect(link).toHaveAttribute('aria-current', 'location');
      await expect(page.locator(hash)).toBeInViewport();
      if (isMobile) {
        await expect(menu).not.toHaveAttribute('open', '');
        await expect(summary).toContainText(label);
        const heading = hash === '#patch' ? page.locator(hash) : page.locator(`${hash} h2`).first();
        await expect
          .poll(async () => {
            const titleBox = await heading.boundingBox();
            const menuBox = await summary.boundingBox();
            return !!titleBox && !!menuBox && titleBox.y >= menuBox.y + menuBox.height;
          })
          .toBe(true);
      }
    }
    await noHorizontalOverflow(page);
  });

  test(`${game} section navigation follows direct links and manual scrolling`, async ({ page, isMobile }) => {
    if (isMobile) await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${path}#story`);
    const nav = page.getByRole('navigation', { name: '페이지 내 이동', exact: true });
    const current = nav.locator('[aria-current="location"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('href', '#story');

    await page.locator('#play').evaluate(element => {
      window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 24);
    });
    await expect(current).toHaveAttribute('href', '#play');
    await page.locator('#story').evaluate(element => {
      window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + 300);
    });
    await expect(current).toHaveAttribute('href', '#story');
    const control = isMobile ? nav.locator('summary') : nav;
    await expect(control).toBeInViewport({ ratio: 1 });
    if (!isMobile) {
      const menuBox = await nav.boundingBox();
      const sectionBox = await page.locator('#story').boundingBox();
      expect(menuBox).not.toBeNull();
      expect(sectionBox).not.toBeNull();
      if (!menuBox || !sectionBox) throw new Error('The navigation and section must have visible bounds.');
      expect(menuBox.width).toBeGreaterThanOrEqual(200);
      expect(menuBox.width).toBeLessThanOrEqual(220);
      expect(sectionBox.x + sectionBox.width).toBeLessThanOrEqual(menuBox.x);
    }
  });
}
