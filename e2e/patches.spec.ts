import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';
import { KR_PATCHES, formatBytes } from '../src/lib/kr-patches.ts';
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

async function loadSpriteImage(sprite: Locator) {
  return sprite.evaluate(async element => {
    const background = getComputedStyle(element).backgroundImage;
    const url = background.match(/^url\(["']?(.+?)["']?\)$/)?.[1];
    if (!url || !new URL(url).pathname.startsWith('/games/kr-patches/catalogue/')) return false;
    const image = new Image();
    image.src = url;
    await image.decode();
    return image.naturalWidth > image.naturalHeight;
  });
}

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

for (const patch of KR_PATCHES) {
  test(`${patch.title} exposes the original and latest Korean file checksums without crowding the patch box`, async ({
    page,
  }) => {
    await page.goto(`${patch.path}/`);
    const details = page.locator('.patch-box .file-checksums');
    const summary = details.locator('summary');
    await expect(details).not.toHaveAttribute('open');
    await expect(summary).toHaveText('롬파일 크기·해시 보기');
    await expect(details.getByRole('heading', { name: '일본판 원본', exact: true })).toBeHidden();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(details).toContainText('일본판 원본 롬파일에만 패치할 수 있습니다.');
    await expect(details).toContainText('헤더 없는 롬파일 기준');
    await expect(details).toContainText('512바이트 헤더');
    for (const file of [
      { name: '일본판 원본', size: patch.spec.size, fingerprint: patch.spec.original },
      { name: `한글판 v${patch.version}`, size: patchedSize(patch.spec), fingerprint: patch.spec.patched },
    ]) {
      const region = details.getByRole('region', { name: file.name, exact: true });
      await expect(region.getByRole('heading', { name: file.name, exact: true })).toBeVisible();
      await expect(region.locator('dd')).toHaveText([
        formatBytes(file.size),
        file.fingerprint.crc32,
        file.fingerprint.md5,
      ]);
    }
    await expect(page.locator('.manual table')).toHaveCount(0);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await details.scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
      for (const hash of await details.locator('code').all()) {
        const bounds = await hash.boundingBox();
        if (!bounds) throw new Error('The file checksum must be visible');
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
    }
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(details).not.toHaveAttribute('open');
  });
}

test('catalogue opens the game page, which leads with the patch box and plays no media', async ({ page }) => {
  await page.goto('/games/kr-patches/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sfc');
  await page.locator(`main a[href="${GAME}"]`).first().click();
  await expect(page).toHaveURL(/\/games\/kr-patches\/sfc\/super-mario-rpg\/$/);
  await expect(page.getByText('일본판 롬파일 고르기')).toBeInViewport();
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
  await expect(status).toContainText('다른 게임 롬파일');
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

test('the story is told one dialog box at a time, paged with ▶', async ({ page }) => {
  await page.goto(GAME);
  const boxes = page.locator('#story .speech');
  const count = await boxes.count();
  expect(count).toBeGreaterThan(1);
  await expect(boxes.nth(1)).toBeHidden();
  for (let i = 1; i < count; i++) {
    await boxes
      .nth(i - 1)
      .getByRole('button', { name: '다음 대사 보기' })
      .click();
    await expect(boxes.nth(i)).toBeVisible();
  }
  await expect(page.locator('#story .next')).toHaveCount(0);
});

test('comparison screens stay at least 1x on a phone so the dialog is readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(GAME);
  const widths = await page
    .locator('#korean .compare-group > .compare-list img')
    .evaluateAll(imgs => imgs.map(img => img.getBoundingClientRect().width));
  expect(widths.length).toBeGreaterThan(0);
  for (const width of widths) expect(width).toBeGreaterThanOrEqual(256);
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
  expect(crumbs.itemListElement.map(i => new URL(i.item).pathname)).toEqual(['/games/kr-patches/', GAME]);
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
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.getByText('한글판 만들기', { exact: true })).toHaveCount(0);
  for (const text of [
    '게임을 고르면 한글패치를 바로 적용할 수 있습니다.',
    'SFC · GAME SELECT',
    '대사·메뉴·전투까지 모두 한국어입니다.',
    'v1.1에서 대사 전체를 원문과 다시 대조했습니다.',
    'v1.2에서 대사를 원문과 다시 대조했습니다.',
    '사운드 노벨의 첫 작품을 플로차트와 장 목록을 더해 한국어로 읽습니다.',
  ])
    await expect(page.locator('main')).not.toContainText(text);
  for (const path of [GAME, GOKUDEN, KAKUSEI, OTOGIRI]) {
    const card = page.locator(`main a[href="${path}"]`);
    await expect(card).toHaveCount(1);
    await expect(card.locator('h2')).toHaveCount(1);
    await expect(card.locator('img')).toHaveCount(1);
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(path);
    await page.goto('/games/kr-patches/');
  }
});

test('catalogue uses the Super Mario RPG title screen', async ({ page }) => {
  await page.goto('/games/kr-patches/');
  const screen = page.locator(`main a[href="${GAME}"] img`);
  await expect(screen).toHaveAttribute('src', '/games/kr-patches/catalogue/super-mario-rpg-title.webp');
  await expect
    .poll(() => screen.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
});

test('Super Mario RPG guide leads with its title screen', async ({ page }) => {
  await page.goto(GAME);
  const screen = page.locator('.hero-shot img');
  await expect(screen).toHaveAttribute('src', '/games/kr-patches/catalogue/super-mario-rpg-title.webp');
  await expect(screen).toHaveAttribute('alt', '슈퍼 마리오 RPG 한글판 타이틀 화면');
});

test('Totsugeki-hen introduces its cast in story order through Piccolo Daimao', async ({ page }) => {
  await page.goto(GOKUDEN);
  await expect(page.locator('#cast h3')).toHaveText([
    '손오공',
    '부르마',
    '무천도사',
    '타오파이파이',
    '천진반',
    '피콜로 대마왕',
  ]);
  await expect(page.locator('#cast .portrait').last()).toHaveAttribute('src', /\/piccolo-daimao\.webp$/);
});

for (const width of [390, 768, 1280]) {
  test(`Kakusei-hen keeps allies and enemies in separate cast groups at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(KAKUSEI);
    const allies = page.locator('#cast').getByRole('list', { name: '주인공과 동료', exact: true });
    const enemies = page.locator('#cast').getByRole('list', { name: '주요 적', exact: true });
    await expect(allies.locator('h3')).toHaveText(['손오공', '손오반', '피콜로']);
    await expect(enemies.locator('h3')).toHaveText(['라데츠', '베지터', '프리더']);
    const allyBounds = await allies.boundingBox();
    const enemyBounds = await enemies.boundingBox();
    if (!allyBounds || !enemyBounds) throw new Error('Cast groups have no visible bounds');
    expect(enemyBounds.y).toBeGreaterThanOrEqual(allyBounds.y + allyBounds.height);
    for (const group of [allies, enemies]) {
      const cards = await group
        .locator('.member')
        .evaluateAll(items =>
          items.map(item => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y })),
        );
      if (width >= 960) {
        expect(new Set(cards.map(card => card.y)).size).toBe(1);
        expect(new Set(cards.map(card => card.x)).size).toBe(3);
      } else if (width === 390) {
        expect(new Set(cards.map(card => card.x)).size).toBe(1);
        const rows = cards.map(card => card.y);
        expect(new Set(rows).size).toBe(3);
        expect(rows).toEqual([...rows].sort((a, b) => a - b));
      }
    }
  });
}

test('catalogue cards show the patch release date and their own game credits', async ({ page }) => {
  await page.goto('/games/kr-patches/');
  for (const [path, version, released, copyright] of [
    [GAME, '1.2', '2026-10-23', '게임 © 1995 Nintendo / SQUARE · 캐릭터 © Nintendo, © SQUARE'],
    [GOKUDEN, '1.2', '2026-10-23', '게임 및 캐릭터 © バードスタジオ/集英社・フジテレビ・東映動画 © BANDAI 1995'],
    [KAKUSEI, '1.3', '2026-10-22', '게임 및 캐릭터 © バードスタジオ/集英社・フジテレビ・東映動画 © BANDAI 1995'],
    [OTOGIRI, '1.2', '2026-10-22', '게임 © 1992 CHUNSOFT'],
  ] as const) {
    const card = page.locator(`main a[href="${path}"]`);
    await expect(card).not.toContainText('한글패치 출시일');
    await expect(card.locator('.game-release')).toContainText(`한글패치 v${version} (${released})`);
    await expect(card.locator('time')).toHaveAttribute('datetime', released);
    await expect(card.locator('time')).toHaveText(`(${released})`);
    await expect(card).toContainText(copyright);
  }
  await expect(page.locator('footer')).not.toContainText('Nintendo');
  await expect(page.locator('footer')).not.toContainText('BANDAI');
  await expect(page.locator('footer')).not.toContainText('CHUNSOFT');
});

for (const width of [390, 1280]) {
  test(`catalogue card titles have balanced vertical spacing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/games/kr-patches/');
    await page.evaluate(() => document.fonts.ready);
    for (const card of await page.locator('main a.game-card').all()) {
      const spacing = await card.evaluate(element => {
        const copy = element.querySelector('.game-card-copy')?.getBoundingClientRect();
        const release = element.querySelector('.game-release')?.getBoundingClientRect();
        const title = element.querySelector('h2')?.getBoundingClientRect();
        if (!copy || !release || !title) throw new Error('Catalogue card has no title bounds');
        return { above: release.top - copy.top, below: copy.bottom - title.bottom };
      });
      expect(spacing.above).toBeGreaterThanOrEqual(18);
      expect(Math.abs(spacing.above - spacing.below)).toBeLessThanOrEqual(1);
    }
  });
}

test('catalogue characters stay on the original forest ground through scrolling and resizing', async ({ page }) => {
  await page.goto('/games/kr-patches/');
  await expect(page.locator('svg.sfc-controller[aria-hidden="true"]')).toBeVisible();
  await expect(page.locator('.world-rail[aria-hidden="true"]')).toHaveCount(2);
  await expect(page.locator('.world-sprite')).toHaveCount(3);
  const background = await page.locator('body').evaluate(async element => {
    const style = getComputedStyle(element, '::before');
    const url = style.backgroundImage.match(/^url\(["']?(.+?)["']?\)$/)?.[1];
    if (!url) throw new Error('The catalogue must have an original game background');
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      path: new URL(url).pathname,
      width: image.naturalWidth,
      height: image.naturalHeight,
      position: style.position,
      size: style.backgroundSize,
      alignment: style.backgroundPosition,
      pointerEvents: style.pointerEvents,
    };
  });
  expect(background).toEqual({
    path: '/games/kr-patches/catalogue/rabite-forest-waterfall.webp',
    width: 512,
    height: 304,
    position: 'fixed',
    size: 'cover',
    alignment: '50% 50%',
    pointerEvents: 'none',
  });
  const layouts: { width: number; height: number; ground: Partial<Record<string, [number, number]>> }[] = [
    { width: 1920, height: 1080, ground: { 'mega-man-x': [43, 194], 'diddy-kong': [60, 96], ryu: [479, 225] } },
    { width: 1280, height: 1080, ground: { 'mega-man-x': [96, 141] } },
    { width: 1280, height: 900, ground: { 'mega-man-x': [70, 135], 'diddy-kong': [60, 96] } },
    { width: 390, height: 844, ground: {} },
  ];
  for (const { width, height, ground } of layouts) {
    await page.setViewportSize({ width, height });
    const scale = Math.max(width / background.width, height / background.height);
    const offsetX = (width - background.width * scale) / 2;
    const offsetY = (height - background.height * scale) / 2;
    for (const scrollY of [0, 700]) {
      await page.evaluate(y => window.scrollTo(0, y), scrollY);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBe(0);
      for (const name of ['mega-man-x', 'diddy-kong', 'ryu'] as const) {
        const sprite = page.locator(`.world-rail .sprite-${name}`);
        const point = ground[name];
        if (!point) {
          await expect(sprite).toBeHidden();
          continue;
        }
        await expect(sprite).toBeVisible();
        expect(await loadSpriteImage(sprite)).toBe(true);
        const bounds = await sprite.evaluate(element => {
          const rect = element.getBoundingClientRect();
          return {
            centerX: (rect.left + rect.right) / 2,
            feetY: rect.bottom - 2 * Number(getComputedStyle(element).getPropertyValue('--sprite-scale')),
            platformContent: getComputedStyle(element, '::after').content,
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            cards: [...document.querySelectorAll('.game-card')].map(card => {
              const box = card.getBoundingClientRect();
              return { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
            }),
          };
        });
        expect(bounds.centerX).toBeCloseTo(offsetX + point[0] * scale, 0);
        expect(bounds.feetY).toBeCloseTo(offsetY + point[1] * scale, 0);
        expect(['none', 'normal']).toContain(bounds.platformContent);
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(width);
        for (const card of bounds.cards) {
          expect(
            bounds.right <= card.left ||
              bounds.left >= card.right ||
              bounds.bottom <= card.top ||
              bounds.top >= card.bottom,
          ).toBe(true);
        }
      }
    }
  }
});

test('Diddy keeps his ground contact fixed across every animation frame', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/games/kr-patches/');
  const contacts = await page.locator('.sprite-diddy-kong').evaluate(async element => {
    const style = getComputedStyle(element);
    const url = style.backgroundImage.match(/^url\(["']?(.+?)["']?\)$/)?.[1];
    if (!url) throw new Error('Diddy must have a sprite sheet');
    const image = new Image();
    image.src = url;
    await image.decode();
    const frameWidth = parseFloat(style.getPropertyValue('--frame-width'));
    const frameHeight = parseFloat(style.getPropertyValue('--frame-height'));
    const frameCount = Number(style.getPropertyValue('--frame-count'));
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Sprite pixels must be readable');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return Array.from({ length: frameCount }, (_, frame) => {
      let left = frameWidth;
      let bottom = -1;
      for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
          if (!pixels[(y * canvas.width + frame * frameWidth + x) * 4 + 3]) continue;
          bottom = Math.max(bottom, y);
          if (y >= frameHeight - 5) left = Math.min(left, x);
        }
      }
      return { left, bottom };
    });
  });
  expect(contacts).toHaveLength(256);
  expect(contacts[0]).toEqual({ left: 22, bottom: 69 });
  for (const contact of contacts) expect(contact).toEqual(contacts[0]);
});

test('catalogue characters change pose in place and return to their initial frame', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/games/kr-patches/');
  for (const { name, expectedFrames, poseFrames } of [
    { name: 'mega-man-x', expectedFrames: 10, poseFrames: [1, 3, 6, 8] },
    { name: 'ryu', expectedFrames: 86, poseFrames: [5, 65, 70, 75, 82] },
    { name: 'diddy-kong', expectedFrames: 256, poseFrames: [136, 158, 159, 250, 254] },
  ]) {
    const sprite = page.locator(`.world-rail .sprite-${name}`);
    await sprite.scrollIntoViewIfNeeded();
    expect(await loadSpriteImage(sprite)).toBe(true);
    const { duration, frameCount } = await sprite.evaluate(element => {
      const animations = element.getAnimations();
      if (animations.length !== 1) throw new Error('A character must have one CSS animation');
      const animation = animations[0];
      if (!animation || !animation.effect) throw new Error('The character animation must have an effect');
      animation.pause();
      animation.currentTime = 0;
      return {
        duration: Number(animation.effect.getTiming().duration),
        frameCount: Number(getComputedStyle(element).getPropertyValue('--frame-count')),
      };
    });
    expect(Number.isInteger(frameCount)).toBe(true);
    expect(frameCount).toBe(expectedFrames);
    expect(duration / frameCount).toBeCloseTo(50, 3);
    const positions = await sprite.evaluate((element, frameDuration) => {
      const animation = element.getAnimations()[0];
      if (!animation) throw new Error('The character animation must exist');
      const positions = [0, frameDuration - 0.01, frameDuration + 0.01].map(time => {
        animation.currentTime = time;
        return getComputedStyle(element).backgroundPositionX;
      });
      animation.currentTime = 0;
      return positions;
    }, duration / frameCount);
    expect(positions[0]).toBe(positions[1]);
    expect(positions[2]).not.toBe(positions[0]);
    const initialBounds = await sprite.boundingBox();
    const initial = await sprite.screenshot();
    const poses = [];
    for (const frame of poseFrames) {
      await sprite.evaluate(
        (element, time) => {
          const animation = element.getAnimations()[0];
          if (!animation) throw new Error('The character animation must exist');
          animation.currentTime = time;
        },
        (duration / frameCount) * (frame + 0.1),
      );
      poses.push(await sprite.screenshot());
      expect(await sprite.boundingBox()).toEqual(initialBounds);
    }
    expect(poses.some(pose => !pose.equals(initial))).toBe(true);
    if (name === 'diddy-kong') {
      const [sitting, jugglingStart, jugglingNext] = poses;
      if (!sitting || !jugglingStart || !jugglingNext) throw new Error('Diddy must have sitting and juggling poses');
      expect(sitting.equals(initial)).toBe(false);
      expect(jugglingStart.equals(jugglingNext)).toBe(false);
      const frameImage = async (frame: number) => {
        await sprite.evaluate(
          (element, time) => {
            const animation = element.getAnimations()[0];
            if (!animation) throw new Error('The character animation must exist');
            animation.currentTime = time;
          },
          (duration / frameCount) * (frame + 0.1),
        );
        return sprite.screenshot();
      };
      for (const frame of [0, 112, 138, 156, 250, 254]) {
        expect((await frameImage(frame)).equals(await frameImage(frame + 1))).toBe(true);
      }
      expect((await frameImage(112)).equals(await frameImage(114))).toBe(false);
      expect((await frameImage(134)).equals(await frameImage(138))).toBe(true);
      expect((await frameImage(116)).equals(await frameImage(156))).toBe(true);
    }
    await sprite.evaluate((element, time) => {
      const animation = element.getAnimations()[0];
      if (!animation) throw new Error('The character animation must exist');
      animation.currentTime = time;
    }, duration);
    expect((await sprite.screenshot()).equals(initial)).toBe(true);
  }
});

test('catalogue respects reduced motion by keeping all characters still', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/kr-patches/');
  for (const sprite of await page.locator('.world-sprite').all()) {
    await sprite.scrollIntoViewIfNeeded();
    expect(await loadSpriteImage(sprite)).toBe(true);
    expect(await sprite.evaluate(element => element.getAnimations().length)).toBe(0);
    const still = await sprite.screenshot();
    await page.waitForTimeout(150);
    expect((await sprite.screenshot()).equals(still)).toBe(true);
  }
});

for (const width of [320, 390]) {
  test(`catalogue cards fit a ${width}px phone without horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/games/kr-patches/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0,
    );
    for (const sprite of await page.locator('.world-sprite').all()) await expect(sprite).toBeHidden();
    for (const card of await page.locator('main a.game-card').all()) {
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator('time')).toBeVisible();
      const bounds = await card.boundingBox();
      if (!bounds) throw new Error('Catalogue card has no visible bounds');
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
  });
}

for (const path of [GAME, GOKUDEN, KAKUSEI, OTOGIRI]) {
  test(`${path} leads with patch instructions and supports choosing a file from the keyboard`, async ({ page }) => {
    await page.goto(path);
    const back = page.locator('header').getByRole('link', { name: '한글패치 목록', exact: true });
    await expect(back).toBeInViewport();
    await expect(back).toHaveAttribute('href', '/games/kr-patches/');
    const box = page.locator('.patch-box');
    await expect(box.getByRole('heading', { name: '여기서 바로 한글패치' })).toBeInViewport();
    const steps = box.getByRole('list', { name: '한글패치 방법' });
    await expect(steps.getByRole('listitem')).toHaveCount(3);
    await expect(steps).toContainText('파일 준비');
    await expect(steps).toContainText('선택하면 자동 패치');
    await expect(steps).toContainText('저장한 파일로 실행');
    await expect(box.getByText('일본판 롬파일 고르기', { exact: true })).toBeInViewport();
    const input = box.locator('input[type=file]');
    await input.focus();
    await expect(input).toBeFocused();
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await (
      await chooser
    ).setFiles({
      name: 'photo.sfc',
      mimeType: 'application/octet-stream',
      buffer: Buffer.alloc(1024),
    });
    await expect(box.locator('.patch-status')).toContainText('너무 작습니다');
    await back.click();
    await expect(page).toHaveURL('/games/kr-patches/');
  });
}

test('Super Gokuden patch box checks for its own 2 MB ROM', async ({ page }) => {
  await page.goto(GOKUDEN);
  await expect(page.getByText('일본판 롬파일 고르기')).toBeInViewport();
  const input = page.locator('.patch-box input[type=file]');
  const status = page.locator('.patch-status');
  await input.setInputFiles({
    name: 'smrpg.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(4 * 1024 * 1024),
  });
  await expect(status).toContainText('일본판 롬파일은 2MB입니다');
  await input.setInputFiles({
    name: 'other.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(2 * 1024 * 1024),
  });
  await expect(status).toContainText('초오공전 돌격편 일본판 롬파일을 골라 주세요');
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
  [SMRPG, `${GAME}downloads/Super_Mario_RPG_K_v1_2.ips`],
  [GOKUDEN_TOTSUGEKI, `${GOKUDEN}downloads/Dragon_Ball_Z_Super_Gokuden_Totsugeki_Hen_K_v1_2.ips`],
  [GOKUDEN_KAKUSEI, `${KAKUSEI}downloads/Dragon_Ball_Z_Super_Gokuden_Kakusei_Hen_K_v1_3.ips`],
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
  await expect(page.getByText('일본판 롬파일 고르기')).toBeInViewport();
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
  await expect(page.locator('.patch-status')).toContainText('초오공전 각성편 일본판 롬파일을 골라 주세요');
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
  await expect(page.locator('.patch-status')).toContainText('예전에 나온 한글판 롬파일입니다');
});

test('Super Gokuden: Kakusei-hen explains how the patch was made and offers the analysis tools', async ({ page }) => {
  await page.goto(KAKUSEI);
  expect(await page.content()).not.toContain('cafe.naver.com/hansicgu');
  const making = page.locator('#making');
  await making.locator('summary').click();
  for (const img of await making.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
    0,
  );
  const tools = making.locator('a[href$="_tools.zip"]');
  await expect(tools).toHaveAttribute('download', '');
  expect((await page.request.get((await tools.getAttribute('href')) ?? '')).status()).toBe(200);
});

test('Otogirisou explains how the patch was made and offers the build tools', async ({ page }) => {
  await page.goto(OTOGIRI);
  expect(await page.content()).not.toContain('cafe.naver.com/hansicgu');
  const making = page.locator('#making');
  await making.locator('summary').click();
  for (const img of await making.locator('img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
    0,
  );
  const tools = making.locator('a[href$="_tools.zip"]');
  await expect(tools).toHaveAttribute('download', '');
  expect((await page.request.get((await tools.getAttribute('href')) ?? '')).status()).toBe(200);
});

test('Otogirisou patch box wants the 1 MB original and turns away a 2 MB Korean build', async ({ page }) => {
  await page.goto(OTOGIRI);
  await expect(page.getByText('일본판 롬파일 고르기')).toBeInViewport();
  const input = page.locator('.patch-box input[type=file]');
  const status = page.locator('.patch-status');
  await input.setInputFiles({
    name: 'other.sfc',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(2 * 1024 * 1024),
  });
  await expect(status).toContainText('일본판 롬파일은 1MB입니다');
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
  await expect(status).toContainText('예전에 나온 한글판 롬파일입니다');
  await expect(status).not.toContainText('v1.');
});

test('Otogirisou title screen reads the opening page by page from the keyboard', async ({ page }) => {
  await page.goto(OTOGIRI);
  const novel = page.locator('[data-novel]');
  const screen = novel.locator('img');
  await novel.getByRole('link', { name: '처음부터 읽기' }).click();
  await expect(screen).toHaveAttribute('src', /opening_ko_1\.webp$/);
  await expect(novel.locator('[data-live]')).toContainText('여름날 해 질 녘');
  await page.keyboard.press('Enter');
  await expect(screen).toHaveAttribute('src', /wake_ko_1\.webp$/);
  // With the Korean IME on, the A key arrives as a jamo; the physical key still turns the page.
  await novel.locator('.novel-screen').dispatchEvent('keydown', { key: 'ㅁ', code: 'KeyA', bubbles: true });
  await expect(screen).toHaveAttribute('src', /driving_ko_1\.webp$/);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(screen).toHaveAttribute('src', /opening_ko_1\.webp$/);
  await page.keyboard.press('Escape');
  await expect(screen).toHaveAttribute('src', /scenes\/title\.webp$/);
  await expect(novel.getByRole('link', { name: '처음부터 읽기' })).toBeFocused();

  await expect(novel.locator('.novel-screen')).not.toHaveAttribute('tabindex');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 8; i++) await page.keyboard.press('a');
  const enter = novel.getByRole('link', { name: /저택에 들어간다/ });
  await expect(enter).toBeFocused();
  await enter.click();
  await expect(page.locator('.patch-box input[type=file]')).toBeFocused();
});

test('Otogirisou title menu points at sections on the page', async ({ page }) => {
  await page.goto(OTOGIRI);
  const hashes = await page
    .locator('[data-menu="title"] a')
    .evaluateAll(as => as.map(a => (a as HTMLAnchorElement).hash));
  expect(hashes.length).toBeGreaterThan(5);
  for (const hash of new Set(hashes)) await expect(page.locator(hash)).toHaveCount(1);
});

for (const patch of KR_PATCHES) {
  test(`${patch.title} opens every screenshot and diagram in the preview`, async ({ page }) => {
    await page.goto(`${patch.path}/`);
    // Portraits are face sprites, ending tiles play videos, and the sound novel's screen turns its pages.
    const loose = await page
      .locator('main img:not([data-patch-preview] img):not(.portrait):not(.ending-video img):not(.novel img)')
      .evaluateAll(images => images.map(image => image.getAttribute('src')));
    expect(loose).toEqual([]);
    const triggers = page.locator('[data-patch-preview]');
    expect(await triggers.count()).toBeGreaterThan(10);
    const preview = page.locator('#patch-image-preview');
    const last = triggers.filter({ visible: true }).last();
    await last.scrollIntoViewIfNeeded();
    const thumbnail = await last.boundingBox();
    await last.click();
    await expect(preview).toBeVisible();
    const enlarged = await preview.locator('.patch-picture').boundingBox();
    const viewport = page.viewportSize();
    if (!thumbnail || !enlarged || !viewport) throw new Error('Missing preview dimensions');
    expect(enlarged.width).toBeGreaterThanOrEqual(Math.min(thumbnail.width, viewport.width - 50) - 1);
    await page.keyboard.press('Escape');
    await expect(preview).not.toBeVisible();
    await expect(last).toBeFocused();
  });
}
