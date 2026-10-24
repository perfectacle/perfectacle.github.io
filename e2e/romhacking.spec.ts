import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  GUIDE_CHAPTERS,
  GUIDE_PATH,
  chapterPath,
  notePath,
  readyChapters,
} from '../src/components/romhacking/chapters.ts';
import { GLOSSARY, GLOSSARY_PATH, entryHref, termId } from '../src/components/romhacking/glossary.ts';
import {
  KR_PATCHES,
  KR_PATCH_LIST_PATH,
  KR_PATCH_TOOLKIT_URL,
  OTOGIRISOU_PATCH,
  TOTSUGEKI_PATCH,
  sourceUrl,
} from '../src/lib/kr-patches.ts';

const PAGES = [GUIDE_PATH, ...readyChapters().map(chapterPath), ...KR_PATCHES.map(notePath), GLOSSARY_PATH];
const first = (list: ReturnType<typeof readyChapters>) => {
  const chapter = list[0];
  if (!chapter) throw new Error('no written chapters');
  return chapter;
};
const NUMBERS = '/games/romhacking/numbers/';
const ENDIAN = '/games/romhacking/endian/';
const BANKS = '/games/romhacking/snes/banks/';
const CPU = '/games/romhacking/snes/cpu/';
const ASSEMBLY = '/games/romhacking/snes/assembly/';
const HOOKING = '/games/romhacking/snes/hooking/';
const GRAPHICS = '/games/romhacking/snes/graphics/';
const LZSS = '/games/romhacking/lzss/';
const HUFFMAN = '/games/romhacking/huffman/';
const EXPANSION = '/games/romhacking/snes/expansion/';
const EMULATOR = '/games/romhacking/snes/emulator/';
const SOUND = '/games/romhacking/snes/sound/';
const MUSIC = '/games/romhacking/music-loop/';

const noHorizontalOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
    0,
  );

for (const path of PAGES) {
  test(`${path} renders without errors or overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const d of await page.locator('details.deeper').all())
      await d.evaluate(e => ((e as HTMLDetailsElement).open = true));
    await noHorizontalOverflow(page);
    for (const hash of await page
      .locator('main a[href^="#"]')
      .evaluateAll(links => links.map(a => (a as HTMLAnchorElement).hash))) {
      await expect(page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`)).toHaveCount(1);
    }
    expect(errors).toEqual([]);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} has no serious accessibility violations (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);
      for (const d of await page.locator('details.deeper').all())
        await d.evaluate(e => ((e as HTMLDetailsElement).open = true));
      const { violations } = await new AxeBuilder({ page }).exclude('#waline').analyze();
      const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('the patch hub leads to the guide, which maps every chapter', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(KR_PATCH_LIST_PATH);
  await page.getByRole('link', { name: /롬 해킹 기초/ }).click();
  await expect(page).toHaveURL(GUIDE_PATH);
  const map = page.locator('.chapter-map > li');
  await expect(map).toHaveCount(GUIDE_CHAPTERS.length);
  await expect(page.locator('.chapter-map a')).toHaveCount(readyChapters().length);
  await expect(page.locator('.chapter-map .chapter-soon')).toHaveCount(GUIDE_CHAPTERS.length - readyChapters().length);
  await expect(page.locator('.chapter-map a').first()).toHaveAttribute('href', chapterPath(first(readyChapters())));
});

test('chapters link to each other in reading order', async ({ page }) => {
  const ready = readyChapters();
  await page.goto(chapterPath(first(ready)));
  await expect(page.getByRole('navigation', { name: '이전·다음 장' }).getByRole('link').first()).toHaveAttribute(
    'href',
    GUIDE_PATH,
  );
  for (const next of ready.slice(1)) {
    await page.getByRole('navigation', { name: '이전·다음 장' }).locator('a[rel="next"]').click();
    await expect(page).toHaveURL(chapterPath(next));
    await expect(page.locator('h1')).toContainText(next.title);
  }
  const pager = page.getByRole('navigation', { name: '이전·다음 장' });
  await expect(pager.locator('a[rel="next"]')).toHaveCount(0);
  await expect(pager).toContainText('다음 장은 준비 중');
  await page.getByRole('navigation', { name: '현재 위치' }).getByRole('link', { name: '롬 해킹', exact: true }).click();
  await expect(page).toHaveURL(GUIDE_PATH);
});

test('chapters key comments by their own path and link the patch notes and toolkit', async ({ page }) => {
  await page.goto(BANKS);
  await expect(page.locator('#waline')).toHaveAttribute('data-path', BANKS);
  await expect(
    page.locator(
      '.guide-links a[href="/games/romhacking/snes/notes/dragon-ball-z-super-gokuden-totsugeki/#making-dialogue"]',
    ),
  ).toHaveCount(1);
  await expect(
    page.locator('a[href^="https://github.com/perfectacle/kr-patch-toolkit/blob/v0.2.0/README.ko.md#snes-dis"]'),
  ).toHaveCount(1);
});

test('search finds the guide', async ({ page }) => {
  await page.goto('/search/?q=리틀 엔디안');
  await expect(page.locator(`pagefind-results[instance="page"] .pf-result-link[href*="${ENDIAN}"]`)).toBeVisible();
});

test('bit toggle widget toggles bits with the keyboard and reads typed hex', async ({ page }) => {
  await page.goto(NUMBERS);
  const widget = page.locator('[data-bulb-byte]');
  await expect(widget).toHaveClass(/is-live/);
  const bit7 = widget.getByRole('button', { name: '비트 7, 자릿값 128' });
  await bit7.focus();
  await expect(bit7).toBeFocused();
  await page.keyboard.press('Space');
  await expect(bit7).toHaveAttribute('aria-pressed', 'true');
  await expect(widget.locator('[data-out="hex"]')).toHaveText('$B0');
  await expect(widget.locator('[data-out="dec"]')).toHaveText('176');
  await expect(widget.locator('[data-out="signed"]')).toHaveText('-80');
  await expect(widget.locator('[data-live]')).toContainText('16진수 B0');
  const input = widget.getByLabel('16진수');
  await input.fill('ff');
  await expect(widget.locator('[aria-pressed="true"]')).toHaveCount(8);
  await expect(widget.locator('[data-out="bin"]')).toHaveText('1111 1111');
  await widget.getByRole('button', { name: '+1' }).click();
  await expect(widget.locator('[data-out="hex"]')).toHaveText('$00');
  await input.fill('zz');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(widget.getByRole('alert')).toBeVisible();
});

test('byte order widget lays bytes out in both orders and switches to 24 bits', async ({ page }) => {
  await page.goto(ENDIAN);
  const widget = page.locator('[data-endian]');
  const cells = (order: string) => widget.locator(`[data-order="${order}"] .cell code`);
  await widget.getByLabel(/숫자\(16진수\)/).fill('1234');
  await expect(cells('little')).toHaveText(['34', '12']);
  await expect(cells('big')).toHaveText(['12', '34']);
  await expect(widget.locator('[data-live]')).toContainText('리틀 엔디안 34 12');
  await widget.getByLabel('24비트(3바이트)').check();
  await widget.getByLabel(/숫자\(16진수\)/).fill('208000');
  await expect(cells('little')).toHaveText(['00', '80', '20']);
  await expect(cells('big')).toHaveText(['20', '80', '00']);
  await noHorizontalOverflow(page);
});

test('byte order widget animates the drop, or steps one cell at a time with reduced motion', async ({ page }) => {
  await page.goto(ENDIAN);
  const widget = page.locator('[data-endian]');
  const play = widget.locator('[data-play]');
  await play.click();
  await expect(widget).toHaveClass(/is-playing/);
  await expect(widget).not.toHaveClass(/is-playing/);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await play.focus();
  await page.keyboard.press('Enter');
  await expect(widget).not.toHaveClass(/is-playing/);
  await expect(widget.locator('[data-order="little"] .cell.is-empty')).toHaveCount(1);
  await expect(play).toHaveText('다음 칸 놓기 (1/2)');
  await page.keyboard.press('Enter');
  await expect(widget.locator('.cell.is-empty')).toHaveCount(0);
  await expect(play).toHaveText('순서대로 놓기');
});

test('address calculator converts both ways for each mapper like the toolkit', async ({ page }) => {
  await page.goto(BANKS);
  const widget = page.locator('[data-bank-map]');
  const cpu = widget.getByLabel('CPU 주소');
  const off = widget.getByLabel('파일 오프셋');
  await expect(off).toHaveValue('0x14000C');
  await widget.getByLabel('SA-1').check();
  await cpu.fill('$E2:B400');
  await expect(off).toHaveValue('0x22B400');
  await expect(widget.locator('[data-region]')).toHaveText('롬');
  await widget.getByRole('button', { name: /LoROM식 주소로/ }).click();
  await expect(off).toHaveValue('0x22B400');
  await expect(cpu).toHaveValue('$85:B400');
  await widget.getByLabel('LoROM').focus();
  await page.keyboard.press('Space');
  await off.fill('0x7FC0');
  await expect(cpu).toHaveValue('$80:FFC0');
  await expect(widget.locator('[data-live]')).toContainText('파일 오프셋 0x007FC0');
  await cpu.fill('$80:0A00');
  await expect(widget.locator('[data-warning]')).toBeVisible();
  await expect(widget.locator('.bm-bank.is-current')).toHaveAttribute('data-b', String(0x80));
  await cpu.fill('nope');
  await expect(cpu).toHaveAttribute('aria-invalid', 'true');
  await expect(widget.locator('[data-error]')).toBeVisible();
});

test('instruction stepper runs one instruction per press and switches register width', async ({ page }) => {
  await page.goto(CPU);
  const widget = page.locator('[data-cpu-step="width"]');
  const stepBtn = widget.getByRole('button', { name: '한 줄 실행' });
  await stepBtn.focus();
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-flag="M"]')).not.toHaveClass(/\bon\b/);
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-reg="A"]')).toHaveText('$1234');
  await expect(widget.locator('li[aria-current="step"] .cpu-asm')).toHaveText('STA $0A00');
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-addr="8260096"] code')).toHaveText('34');
  await expect(widget.locator('[data-addr="8260097"] code')).toHaveText('12');
  await expect(widget.locator('[data-addr="8260097"]')).toHaveClass(/is-changed/);
  await expect(widget.locator('[data-live]')).toContainText('$7E:0A01에 12');
  await widget.getByRole('button', { name: '끝까지 실행' }).click();
  await expect(widget.locator('[data-reg="A"]')).toHaveText('B $12 · A $56');
  await expect(stepBtn).toBeDisabled();
  await widget.getByRole('button', { name: '처음 상태로' }).click();
  await expect(stepBtn).toBeEnabled();
  await expect(stepBtn).toBeFocused();
  await expect(widget.locator('[data-reg="A"]')).toHaveText('B $00 · A $00');
});

test('instruction stepper copies the string and follows the subroutine', async ({ page }) => {
  await page.goto(ASSEMBLY);
  const copy = page.locator('[data-cpu-step="copy"]');
  await copy.getByRole('button', { name: '끝까지 실행' }).click();
  await expect(copy.locator('[data-mem] code')).toHaveText(['F3', '08', 'B5', '06', '27', '05']);
  await expect(copy.locator('[data-reg="X"]')).toHaveText('$0006');
  const loop = page.locator('[data-cpu-step="loop"]');
  for (let i = 0; i < 17; i++) await loop.getByRole('button', { name: '한 줄 실행' }).click();
  await expect(loop.locator('li[aria-current="step"] .cpu-asm')).toHaveText('CLC');
  await expect(loop.locator('[data-reg="S"]')).toHaveText('$1FFD');
  await expect(loop.locator('[data-addr="8265726"] code')).toHaveText('10');
});

test('tile painting widget paints pixels with the keyboard and reads typed bytes', async ({ page }) => {
  await page.goto(GRAPHICS);
  const widget = page.getByRole('region', { name: '타일을 칠하며 바이트 보기' });
  await expect(widget).toHaveClass(/is-live/);
  const hex = widget.getByLabel('바이트(16진수, 메모리 순서)');
  await expect(hex).toHaveValue('00 00 F6 12 F6 D2 37 11 37 13 76 32 E6 62 C6 C6');
  await widget.getByRole('button', { name: '가로 0, 세로 0: 색 0' }).focus();
  await page.keyboard.press('ArrowRight');
  const cell = widget.getByRole('button', { name: /^가로 1, 세로 0:/ });
  await expect(cell).toBeFocused();
  await page.keyboard.press('Space');
  await expect(cell).toHaveAccessibleName('가로 1, 세로 0: 색 1');
  await expect(hex).toHaveValue(/^40 00 F6 12/);
  await expect(widget.locator('[data-live]')).toContainText('+00 = 40');
  await expect(widget.locator('tbody tr[data-row="0"]')).toHaveClass(/is-current/);
  await page.keyboard.press('Space');
  await expect(cell).toHaveAccessibleName('가로 1, 세로 0: 색 0');

  await hex.fill('80 80' + ' 00'.repeat(14));
  await expect(widget.getByRole('button', { name: '가로 0, 세로 0: 색 3' })).toBeVisible();
  await hex.fill('00 11');
  await expect(hex).toHaveAttribute('aria-invalid', 'true');
  await expect(widget.getByRole('alert')).toContainText('16바이트');

  await widget.getByLabel('4bpp(16색)').check();
  await expect(hex).toHaveValue(/^(?:[0-9A-F]{2} ){31}[0-9A-F]{2}$/);
  await expect(widget.locator('input[name="tile-ink"]')).toHaveCount(16);
  await expect(widget.locator('thead th')).toHaveCount(5);
  await widget.getByLabel('1bpp(2색)').check();
  await expect(hex).toHaveValue('80 00 00 00 00 00 00 00');
  await widget.getByRole('button', { name: '처음 그림으로' }).click();
  await expect(hex).toHaveValue('00 F6 F6 37 37 76 E6 C6');
  await noHorizontalOverflow(page);
});

test('the hooking chapter links the word-wrap note and the toolkit', async ({ page }) => {
  await page.goto(HOOKING);
  await expect(
    page.locator('.guide-links a[href="/games/romhacking/snes/notes/otogirisou/#making-wordwrap"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('a[href^="https://github.com/perfectacle/kr-patch-toolkit/blob/v0.2.0/README.ko.md#snes-dis"]'),
  ).toHaveCount(1);
});

test('widgets read as static pictures without scripts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ASSEMBLY);
  await expect(page.locator('[data-cpu-step="copy"]')).toContainText('끝까지 실행한 뒤');
  await expect(page.getByRole('button', { name: '한 줄 실행' }).first()).toBeHidden();
  await page.goto(BANKS);
  await expect(page.locator('[data-bank-map] [data-summary-off]')).toHaveText('0x14000C');
  for (const path of [ENDIAN, BANKS, CPU, GRAPHICS, LZSS, HUFFMAN, EXPANSION, EMULATOR, SOUND, MUSIC]) {
    await page.goto(path);
    const help = page.locator('.widget-help .live-only');
    expect(await help.count()).toBeGreaterThan(0);
    for (const hint of await help.all()) await expect(hint).toBeHidden();
  }
  await page.goto(NUMBERS);
  await expect(page.locator('[data-bulb-byte] [data-out="hex"]')).toHaveText('$30');
  await page.goto(GRAPHICS);
  const tile = page.locator('[data-tile-bytes]');
  await expect(tile.locator('[data-static-hex]')).toHaveText('00 00 F6 12 F6 D2 37 11 37 13 76 32 E6 62 C6 C6');
  await expect(tile.locator('textarea')).toBeHidden();
  await expect(tile.locator('.widget-help .live-only')).toBeHidden();
  await expect(tile.getByRole('button', { name: '가로 0, 세로 1: 색 1' })).toBeDisabled();

  await page.goto(LZSS);
  const lzss = page.locator('[data-lzss]');
  await expect(lzss.locator('.lz-static-steps li')).toHaveCount(7);
  await expect(lzss.locator('[data-out] li small')).toHaveText([...'ha␣ha␣ha␣ha␣ha!']);
  await expect(lzss.getByRole('button', { name: '한 단계 풀기' })).toBeHidden();
  await page.goto(HUFFMAN);
  const huff = page.locator('[data-huffman]');
  await expect(huff.locator('[data-table] tbody code')).toHaveText(['110', '0', '111', '10']);
  await expect(huff.locator('[data-bits]')).toHaveAttribute('aria-label', '비트열 11001111001111000');
  await expect(huff.locator('[data-tree] svg')).toBeVisible();
  await expect(huff.getByRole('button', { name: '한 번 묶기' })).toBeHidden();
  await page.goto(EXPANSION);
  const grow = page.locator('[data-rom-grow]');
  await expect(grow.locator('[data-size-byte]')).toHaveText('0A → 0B');
  await expect(grow.locator('[data-row="after"] li.is-new')).toHaveCount(2);
  await expect(grow.locator('select')).toHaveCount(2);
  await expect(grow.locator('select').first()).toBeHidden();
  await page.goto(EMULATOR);
  const run = page.locator('[data-run-script]');
  await expect(run.locator('[data-summary]')).toContainText('300프레임까지');
  await expect(run.locator('[data-lines] li')).toHaveCount(7);
  await expect(run.locator('.rs-static-text')).toBeVisible();
  await expect(run.locator('textarea')).toBeHidden();
  await expect(run.locator('[data-lane="output"] .rs-mark')).toHaveCount(4);
  await page.goto(SOUND);
  const apu = page.locator('[data-apu-log]');
  await expect(apu.locator('[data-step]')).toHaveCount(33);
  await expect(apu.locator('.apu-steps')).toContainText('11 2140 CC pc=8380D4');
  await expect(apu.getByRole('button', { name: '다음 줄' })).toBeHidden();
  await page.goto(MUSIC);
  const seam = page.locator('[data-seam-lab]');
  await expect(seam.locator('[data-out="score"]')).toHaveText('0.887');
  await expect(seam.locator('table')).toHaveCount(2);
  await expect(seam.getByRole('button', { name: '들어 보기' })).toBeHidden();
  await expect(seam.getByLabel('이음매 위치 T')).toBeHidden();
  await context.close();
});

test('LZSS widget decodes one item per press and shows each copy', async ({ page }) => {
  await page.goto(LZSS);
  const widget = page.locator('[data-lzss]');
  await expect(widget).toHaveClass(/is-live/);
  const step = widget.getByRole('button', { name: '한 단계 풀기' });
  await step.focus();
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-counter]')).toHaveText('읽은 항목 1/7');
  await expect(widget.locator('[data-last]')).toContainText('$000F = 15바이트');
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-flags] li.bit-lit')).toHaveCount(4);
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await expect(widget.locator('[data-last]')).toContainText('거리 = $003 = 3, 길이 = 8 + 3 = 11');
  await expect(widget.locator('[data-last]')).toContainText('겹쳐서');
  await expect(widget.locator('[data-live]')).toContainText('출력 3번 칸부터 3칸 앞');
  await expect(widget.locator('[data-out] li.is-new')).toHaveCount(11);
  await expect(widget.locator('[data-out] li.is-src')).toHaveCount(3);
  await expect(widget.locator('[data-copy]')).toBeVisible();
  await expect(widget.locator('[data-copy-from]')).toHaveText('0–10번 칸');
  await expect(widget.locator('[data-flags] li.is-current small').first()).toHaveText('비트 3');
  await widget.getByRole('button', { name: '끝까지 풀기' }).click();
  await expect(widget.locator('[data-out] li small')).toHaveText([...'ha␣ha␣ha␣ha␣ha!']);
  await expect(step).toBeDisabled();
  await expect(widget.locator('[data-last]')).toContainText('다 풀었습니다');

  await widget.getByLabel('돌격편 타이틀 그림 첫머리').check();
  await expect(widget.locator('[data-in] li')).toHaveCount(14);
  await step.click();
  await step.click();
  await step.click();
  await expect(widget.locator('[data-out] li.is-zero')).toHaveText(/18칸/);
  await expect(widget.locator('[data-last]')).toContainText('시작보다 앞은 0으로 읽습니다');
  await widget.getByRole('button', { name: '끝까지 풀기' }).click();
  await expect(widget.locator('[data-counter]')).toHaveText('읽은 항목 10/10');
  await expect(widget.locator('[data-out] li:not(.is-zero)')).toHaveCount(38);
  await expect(widget.locator('[data-last]')).toContainText('실제 데이터는 더 이어집니다');

  const text = widget.getByLabel(/직접 적은 글/);
  await text.fill('abcabcabcabc');
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-note]')).toContainText('12바이트가 8바이트');
  await expect(widget.locator('input[name="lzss-sample"]:checked')).toHaveCount(0);
  await widget.getByRole('button', { name: '끝까지 풀기' }).click();
  await expect(widget.locator('[data-out] li small')).toHaveText([...'abcabcabcabc']);
  await text.fill('가'.repeat(14));
  await widget.getByRole('button', { name: '압축해서 풀기' }).click();
  await expect(text).toHaveAttribute('aria-invalid', 'true');
  await expect(widget.getByRole('alert')).toContainText('지금 42바이트');
  await widget.getByRole('button', { name: '처음부터' }).click();
  await expect(step).toBeFocused();
  await expect(widget.locator('[data-counter]')).toHaveText('읽은 항목 0/6');
  await noHorizontalOverflow(page);
});

test('LZSS widget skips the write animation with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(LZSS);
  const widget = page.locator('[data-lzss]');
  await widget.getByRole('button', { name: '끝까지 풀기' }).click();
  const newest = widget.locator('[data-out] li.is-new').first();
  expect(await newest.evaluate(e => getComputedStyle(e).animationName)).toBe('none');
});

test('Huffman widget merges step by step, then encodes and decodes bit by bit', async ({ page }) => {
  await page.goto(HUFFMAN);
  const widget = page.locator('[data-huffman]');
  await expect(widget).toHaveClass(/is-live/);
  await expect(widget.locator('[data-table] tbody code')).toHaveText(['—', '—', '—', '—']);
  await expect(widget.locator('[data-queue] li')).toHaveText([
    '「간」(1) → 0',
    '「␣」(2) → 1',
    '「공」(2)',
    '「장」(4)',
  ]);
  const merge = widget.getByRole('button', { name: '한 번 묶기' });
  await merge.focus();
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-merge-msg]')).toContainText('「간」(1) + 「␣」(2) → 무게 3');
  await expect(widget.locator('[data-live]')).toContainText('무게 3');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(widget.locator('[data-merge-msg]')).toContainText('트리가 완성됐습니다');
  await expect(merge).toBeDisabled();
  await expect(widget.locator('[data-table] tbody code')).toHaveText(['110', '0', '111', '10']);
  await expect(widget.locator('[data-bits]')).toHaveAttribute('aria-label', '비트열 11001111001111000');
  await expect(widget.locator('[data-sum]')).toContainText('9글자가 17비트');
  await expect(widget.locator('[data-tree] circle')).toHaveCount(3);

  const bit = widget.getByRole('button', { name: '한 비트 읽기' });
  await bit.click();
  await expect(widget.locator('[data-decode-msg]')).toContainText('오른쪽 가지');
  await bit.click();
  await bit.click();
  await expect(widget.locator('[data-decoded]')).toHaveText('간');
  await expect(widget.locator('[data-decode-msg]')).toContainText('「간」에 닿았습니다');
  await expect(widget.locator('[data-tree] .hf-leaf.is-on')).toHaveCount(1);
  await widget.getByRole('button', { name: '끝까지 읽기' }).click();
  await expect(widget.locator('[data-decoded]')).toHaveText('간장 공장 공장장');
  await expect(bit).toBeDisabled();

  const input = widget.getByLabel('문장');
  await input.fill('abracadabra');
  await expect(widget.locator('[data-table] tbody tr')).toHaveCount(5);
  await widget.getByRole('button', { name: '끝까지 묶기' }).click();
  await expect(widget.locator('[data-sum]')).toContainText('11글자가 23비트');
  await input.fill('abcdefghijk');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(widget.getByRole('alert')).toContainText('지금 11개');
  await noHorizontalOverflow(page);
});

test('ROM expansion widget redraws banks, the size byte and the checksum note', async ({ page }) => {
  await page.goto(EXPANSION);
  const widget = page.locator('[data-rom-grow]');
  await expect(widget).toHaveClass(/is-live/);
  const after = widget.locator('[data-row="after"] [data-cells] li');
  await expect(after).toHaveCount(8);
  await expect(widget.locator('[data-row="after"] li.is-new .bank')).toHaveText(['$A0–$AF', '$B0–$BF']);
  await expect(widget.locator('[data-size-byte]')).toHaveText('0A → 0B');
  await expect(widget.locator('[data-checksum]')).toContainText('+1');

  const original = widget.getByLabel('원래 크기');
  const size = widget.getByLabel('늘린 크기');
  await original.selectOption({ label: '1.5MB' });
  await expect(size).toHaveValue(String(0x200000));
  await expect(widget.locator('[data-checksum]')).toContainText('0x100000–0x17FFFF(× 2 → × 1)');
  await expect(widget.locator('[data-live]')).toContainText('1.5MB에서 2MB로');

  await widget.getByLabel('HiROM').focus();
  await page.keyboard.press('Space');
  await original.selectOption({ label: '4MB' });
  await size.selectOption({ label: '6MB' });
  await expect(widget.locator('[data-row="after"] [data-row-title]')).toContainText('ExHiROM');
  await expect(after).toHaveCount(16);
  await expect(widget.locator('[data-size-at]')).toContainText('0x40FFD7');
  await expect(widget.locator('[data-size-byte]')).toHaveText('0C → 0D');
  await expect(widget.locator('[data-notes]')).toContainText('$25');

  await widget.getByLabel('SA-1').check();
  await size.selectOption({ label: '8MB' });
  await expect(widget.locator('[data-row="after"] li.is-switch')).toHaveCount(8);
  await expect(widget.locator('[data-notes]')).toContainText('$2220');

  await widget.getByLabel('LoROM').check();
  await expect(size).toHaveValue(String(0x400000));
  await expect(size.locator('option[value="8388608"]')).toHaveJSProperty('disabled', true);
  await noHorizontalOverflow(page);
});

for (const patch of KR_PATCHES) {
  test(`${patch.title} ROM analysis note lives in the guide and links both ways`, async ({ page }) => {
    const note = `/games/romhacking/snes/notes/${patch.path.slice(patch.path.lastIndexOf('/') + 1)}/`;
    await page.goto(`${patch.path}/`);
    const read = page.locator('#making').getByRole('link', { name: '노트 읽기' });
    await expect(read).toHaveAttribute('href', note);
    const topics = page.getByRole('navigation', { name: '이 노트에서 다루는 것' }).locator('a');
    expect(await topics.count()).toBeGreaterThan(0);
    for (const href of await topics.evaluateAll(links => links.map(a => a.getAttribute('href') ?? ''))) {
      expect(href.startsWith(`${note}#making-`), href).toBe(true);
    }
    await read.click();
    await expect(page).toHaveURL(note);
    await expect(page.locator('h1')).toHaveText(`롬 분석 노트: ${patch.title}`);
    await expect(page.locator('#waline')).toHaveAttribute('data-path', note);
    const toc = page.getByRole('navigation', { name: '이 노트에서' });
    for (const href of await toc.locator('a').evaluateAll(links => links.map(a => (a as HTMLAnchorElement).hash))) {
      await expect(page.locator(`[id="${decodeURIComponent(href.slice(1))}"]`)).toHaveCount(1);
    }
    expect(await page.locator('.note-related a[href^="/games/romhacking/"]').count()).toBeGreaterThan(0);
    const making = page.locator('.making-sources');
    await expect(making.getByRole('link', { name: '패치 소스(GitHub)' })).toHaveAttribute('href', sourceUrl(patch));
    await expect(making.getByRole('link', { name: 'kr-patch-toolkit' })).toHaveAttribute('href', KR_PATCH_TOOLKIT_URL);
    await expect(making.getByRole('link', { name: /롬 분석 문서/ })).toHaveAttribute(
      'href',
      new RegExp(`/blob/[^/]+-v${patch.version.replace('.', '\\.')}/snes/.+/docs/ANALYSIS\\.md$`),
    );
    for (const img of await page.locator('.note-body img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0,
    );
  });
}

for (const patch of KR_PATCHES) {
  test(`${patch.title} ROM analysis note fits a 320px phone`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(notePath(patch));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0,
    );
  });
}

test('the guide index lists the four ROM analysis notes', async ({ page }) => {
  await page.goto(GUIDE_PATH);
  const notes = page.locator('.note-map');
  await expect(notes.locator('li')).toHaveCount(KR_PATCHES.length);
  for (const patch of KR_PATCHES) await expect(notes.getByRole('link', { name: patch.title })).toHaveCount(1);
});

test('the guide index maps every chapter to each game note, and says why a cell is empty', async ({ page }) => {
  await page.goto(GUIDE_PATH);
  const grid = page.getByRole('table', { name: '장 × 게임 노트' });
  const rows = grid.locator('tbody tr');
  await expect(rows).toHaveCount(readyChapters().length);
  for (const [i, chapter] of readyChapters().entries()) {
    const row = rows.nth(i);
    await expect(row.getByRole('rowheader').getByRole('link')).toHaveAttribute('href', chapterPath(chapter));
    const cells = row.getByRole('cell');
    await expect(cells).toHaveCount(KR_PATCHES.length);
    for (const cell of await cells.all()) {
      const links = await cell.locator('a').count();
      const empty = await cell.getByText('해당 절 없음').count();
      expect(links > 0 !== empty > 0).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
    0,
  );
});

test('input script widget reads scripts like the toolkit and shows each frame', async ({ page }) => {
  await page.goto(EMULATOR);
  const widget = page.locator('[data-run-script]');
  await expect(widget).toHaveClass(/is-live/);
  await expect(widget.locator('[data-lines] li')).toHaveCount(7);
  await expect(widget.locator('[data-lines] li.is-poke')).toContainText('$7E:0012');
  const frame = widget.getByLabel('프레임', { exact: true });
  await frame.focus();
  await page.keyboard.press('ArrowRight');
  await expect(widget.locator('[data-frame-out]')).toHaveText('111프레임: A 누름');
  await frame.fill('202');
  await expect(widget.locator('[data-frame-out]')).toContainText('이 프레임 뒤 스크린샷');
  await expect(widget.locator('[data-live]')).toContainText('202프레임');

  await widget.getByLabel('틀린 예: end 뒤의 명령').check();
  const alert = widget.getByRole('alert');
  await expect(alert).toContainText("krpatch: error: line 2: frame is after 'end' at frame 300");
  await expect(alert).toContainText('2번째 줄');
  await expect(widget.locator('[data-result]')).toBeHidden();
  await expect(widget.locator('textarea')).toHaveAttribute('aria-invalid', 'true');

  const text = widget.getByLabel('스크립트');
  await text.fill('10 tap a 0 20\n30 end');
  await expect(alert).toContainText('range() arg 3 must not be zero');
  await text.fill('# 손으로 적은 예\n5 a+B 3\n10 tap start 4 30\n12 poke 7F0000 ABCD\n40 end');
  await expect(alert).toBeHidden();
  await expect(widget.locator('input[name="rs-sample"]:checked')).toHaveCount(0);
  await expect(widget.locator('[data-lines] li')).toHaveCount(4);
  await expect(widget.locator('[data-lines] li.is-tap')).toContainText('모두 5번');
  await expect(widget.locator('[data-lines] li.is-poke')).toContainText('$7F:0000');
  await frame.fill('6');
  await expect(widget.locator('[data-frame-out]')).toHaveText('6프레임: B+A 누름');
  await text.fill('10 shot');
  await expect(alert).toContainText("script has no 'end' command");
  await noHorizontalOverflow(page);
});

test('input script widget moves the frame cursor without animation for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(EMULATOR);
  const cursor = page.locator('[data-run-script] [data-cursor]').first();
  expect(await cursor.evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
});

test('glossary index jumps to each initial and every entry links to a real section', async ({ page }) => {
  await page.goto(GUIDE_PATH);
  await page.getByRole('link', { name: '용어집', exact: true }).first().click();
  await expect(page).toHaveURL(GLOSSARY_PATH);
  await expect(page.locator('.gl-entry')).toHaveCount(GLOSSARY.length);
  for (const e of GLOSSARY) await expect(page.locator(`.gl-entry[id="${termId(e)}"]`)).toHaveCount(1);
  const index = page.getByRole('navigation', { name: '초성 색인' });
  await index.getByRole('link', { name: 'ㅂ', exact: true }).click();
  await expect(page).toHaveURL(/#initial-b$/);
  await expect(page.locator('#initial-b')).toBeInViewport();
  await expect(page.locator('#initial-b + dl dt').first()).toContainText(/^[바-빟]/);
  await index.getByRole('link', { name: '영문·숫자' }).click();
  await expect(page.locator('#initial-latin')).toBeInViewport();
  await expect(index.locator('span[aria-disabled="true"]')).toHaveCount(15 - (await index.getByRole('link').count()));

  const targets = new Map<string, Set<string>>();
  for (const e of GLOSSARY) {
    const [path = '', id = ''] = entryHref(e).split('#');
    targets.set(path, (targets.get(path) ?? new Set()).add(id));
  }
  const missing: string[] = [];
  for (const [path, ids] of targets) {
    await page.goto(path);
    for (const id of ids) await expect(page.locator(`[id="${id}"]`), `${path}#${id}`).toHaveCount(1);
    // Text of each section: the h2 with the id and everything up to the next h2, folded parts included.
    const sections = await page.evaluate(() => {
      const out: Record<string, string> = {};
      for (const h of document.querySelectorAll<HTMLElement>('main h2[id]')) {
        let text = h.textContent ?? '';
        for (let n = h.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling)
          text += ` ${n.textContent}`;
        out[h.id] = text;
      }
      return out;
    });
    for (const e of GLOSSARY.filter(x => entryHref(x).startsWith(`${path}#`))) {
      // 「덤프(롬)」 is 덤프, 「배경 레이어(BG)」 may appear as either part, and 「M 플래그·X 플래그」 as either name.
      const base = e.term.replace(/\(.*\)$/, '');
      const inner = /\((.*)\)$/.exec(e.term)?.[1];
      const names = [
        e.term,
        base,
        ...base.split('·'),
        ...(inner ? [inner] : []),
        ...(e.en ? [e.en, ...e.en.split(/ \/ |, /)] : []),
      ];
      if (!names.some(name => (sections[e.anchor] ?? '').includes(name)))
        missing.push(`${e.term} → ${path}#${e.anchor}`);
    }
  }
  expect(missing).toEqual([]);
});

test('chapters link the glossary, and search finds it', async ({ page }) => {
  await page.goto(EMULATOR);
  await page.getByRole('link', { name: '모르는 용어는 용어집에서' }).click();
  await expect(page).toHaveURL(GLOSSARY_PATH);
  await page.goto('/search/?q=용어집');
  await expect(
    page.locator(`pagefind-results[instance="page"] .pf-result-link[href*="${GLOSSARY_PATH}"]`).first(),
  ).toBeVisible();
});

test('APU port log widget steps through the upload and the song commands with the keyboard', async ({ page }) => {
  await page.goto(SOUND);
  const widget = page.locator('[data-apu-log]');
  await expect(widget).toHaveClass(/is-live/);
  const next = widget.getByRole('button', { name: '다음 줄' });
  const port = (n: number) => widget.locator(`[data-port="${n}"] [data-value]`);
  await expect(port(0)).toHaveText('--');
  await next.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await expect(port(0)).toHaveText('CC');
  await expect(port(1)).toHaveText('01');
  await expect(widget.locator('[data-addr]')).toHaveText('$0800');
  await expect(widget.locator('[data-wait]')).toHaveText('$2140을 읽어 CC가 돌아올 때까지');
  await expect(widget.locator('[data-port="0"]')).toHaveClass(/is-changed/);
  await expect(widget.locator('[data-port="1"]')).not.toHaveClass(/is-changed/);
  await expect(widget.locator('[aria-current="step"]')).toContainText('11 2140 CC pc=8380D4');
  await expect(widget.locator('[data-live]')).toContainText('4/33단계, 올리기. 11프레임, $2140에 CC');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Enter');
  await expect(widget.locator('[aria-current="step"]')).toContainText('18 2140 23 pc=8380D4');
  await expect(widget.locator('[data-addr]')).toHaveText('$1E00');
  for (let i = 0; i < 17; i++) await page.keyboard.press('Enter');
  await expect(next).toBeDisabled();
  await expect(widget.locator('[aria-current="step"]')).toContainText('3161 2141 0A pc=838031');
  await expect(widget.locator('[aria-current="step"]')).toContainText('명령');
  await expect(port(3)).toHaveText('D7');
  await widget.getByRole('button', { name: '이전 줄' }).click();
  await expect(port(1)).toHaveText('0B');
  await widget.getByRole('button', { name: '처음으로' }).click();
  await expect(port(0)).toHaveText('--');
  await expect(widget.getByRole('button', { name: '이전 줄' })).toBeDisabled();
  await noHorizontalOverflow(page);
});

test('APU port log widget drops the highlight transition for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(SOUND);
  const box = page.locator('[data-apu-log] [data-port="0"]');
  expect(await box.evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
});

test('seam widget moves the seam with the keyboard, compares fade shapes and plays on request', async ({ page }) => {
  await page.goto(MUSIC);
  const widget = page.locator('[data-seam-lab]');
  await expect(widget).toHaveClass(/is-live/);
  const slider = widget.getByLabel('이음매 위치 T');
  await expect(widget.locator('[data-seam-out]')).toHaveText('0.770초 · loopEnd 1.520초');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(widget.locator('[data-seam-out]')).toHaveText('0.775초 · loopEnd 1.525초');
  await expect(widget.locator('[data-out="score"]')).toHaveText('0.876');
  await expect(widget.locator('[data-live]')).toContainText('T 0.775초');

  await widget.getByRole('button', { name: '충분히 좋은 가장 이른 곳으로' }).click();
  await expect(slider).toHaveValue('0.47');
  await expect(widget.locator('[data-out="score"]')).toHaveText('0.994');
  await widget.getByLabel('sin·cos로 섞기').check();
  await expect(widget.locator('[data-out="bump"]')).toHaveText('+2.9 dB');
  await expect(widget.locator('[data-verdict]')).toContainText('+2.9 dB 커집니다');
  await widget.getByLabel('sin²으로 섞기').check();
  await expect(widget.locator('[data-out="bump"]')).toHaveText('0.0 dB');
  await expect(widget.locator('[data-out="deviation"]')).toHaveText('2.8%');
  await widget.getByRole('button', { name: '점수가 가장 높은 곳으로' }).click();
  await expect(slider).toHaveValue('0.5');
  await expect(widget.locator('[data-out="score"]')).toHaveText('0.997');

  const play = widget.getByRole('button', { name: '들어 보기' });
  await play.click();
  await expect(widget.getByRole('button', { name: '멈추기' })).toBeVisible();
  await widget.getByRole('button', { name: '멈추기' }).click();
  await expect(play).toBeVisible();
  await noHorizontalOverflow(page);
});

test('seam widget moves its cursor without animation for reduced motion and never plays by itself', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(MUSIC);
  const cursor = page.locator('[data-seam-lab] [data-cursor]');
  expect(await cursor.evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
  await expect(page.locator('[data-seam-lab]').getByRole('button', { name: '들어 보기' })).toBeVisible();
});

const TEXT = '/games/romhacking/snes/text/';
const SMRPG_NOTE = '/games/romhacking/snes/notes/super-mario-rpg/';

test('wide screens keep the contents beside the body and mark the section being read', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(TEXT);
  const toc = page.getByRole('navigation', { name: '이 장에서' });
  await expect(toc).toBeVisible();
  const hashes = await toc.locator('a').evaluateAll(links => links.map(a => (a as HTMLAnchorElement).hash));
  // The h2 list above the body is the narrow-screen copy; the side list adds the h3 under each.
  expect(hashes.length).toBeGreaterThan(await page.locator('.guide-toc li').count());
  for (const hash of hashes) await expect(page.locator(`[id="${decodeURIComponent(hash.slice(1))}"]`)).toHaveCount(1);
  await toc.locator('a[href="#pointers"]').click();
  await expect(toc.locator('a[aria-current="location"]')).toHaveAttribute('href', '#pointers');
  await expect(toc).toBeInViewport();
  // The side column holds only this page's contents; moving between pages is the trail above and the pager below.
  await expect(page.locator('.guide-side a:not([href^="#"])')).toHaveCount(0);
  const pager = page.getByRole('navigation', { name: '이전·다음 장' });
  await expect(pager.locator('a[rel="prev"]')).toHaveCount(1);
  await expect(pager.locator('a[rel="next"]')).toHaveCount(1);

  await page.goto(SMRPG_NOTE);
  await expect(
    page.getByRole('navigation', { name: '이 노트에서' }).getByRole('link', { name: '배경지식' }),
  ).toBeVisible();
  await expect(page.locator('.guide-side a:not([href^="#"])')).toHaveCount(0);
  await noHorizontalOverflow(page);
});

test('phones open the contents from a floating button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(TEXT);
  await expect(page.getByRole('navigation', { name: '이 장에서' })).toBeVisible();
  const open = page.getByRole('button', { name: '목차 열기' });
  await expect(open).toBeHidden();
  await page.locator('#width').scrollIntoViewIfNeeded();
  await open.click();
  const sheet = page.getByRole('dialog', { name: '이 장에서' });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('a:not([href^="#"])')).toHaveCount(0);
  await sheet.locator('a[href="#try"]').click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/#try$/);
  await expect(page.locator('#try')).toBeFocused();
});

test('glossary terms in the body show a preview card on hover and focus, and lead to the glossary', async ({
  page,
  hasTouch,
}) => {
  test.skip(hasTouch, 'touch has its own test');
  await page.goto(TEXT);
  const term = page.locator('.prose a.term').first();
  const href = await term.getAttribute('href');
  expect(href).toMatch(/^\/games\/romhacking\/glossary\/#term-/);
  const card = page.locator('#term-card');
  await term.hover();
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: '설명 장 보기' })).toHaveAttribute('href', /^\/games\/romhacking\/.+#.+/);
  await expect(card.getByRole('link', { name: '용어사전에서 보기' })).toHaveAttribute('href', new RegExp(`${href}$`));
  await expect(term).toHaveAttribute('aria-describedby', 'term-card');
  await page.mouse.move(0, 0);
  await expect(card).toBeHidden();

  await term.focus();
  await expect(card).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(card.getByRole('link', { name: '설명 장 보기' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await expect(term).toBeFocused();

  await term.click();
  await expect(page).toHaveURL(href ?? '');
  const id = decodeURIComponent((href ?? '').split('#')[1] ?? '');
  await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
});

test('on touch the first tap on a term shows its card and a link in the card navigates', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'needs a touch screen');
  await page.goto(SMRPG_NOTE);
  const term = page.locator('.prose a.term').first();
  await term.scrollIntoViewIfNeeded();
  await term.tap();
  const card = page.locator('#term-card');
  await expect(card).toBeVisible();
  await expect(page).toHaveURL(SMRPG_NOTE);
  await noHorizontalOverflow(page);
  await card.getByRole('link', { name: '용어사전에서 보기' }).tap();
  await expect(page).toHaveURL(/\/glossary\/#term-/);
});

test('without scripts terms are plain links to the glossary', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(TEXT);
  const term = page.locator('.prose a.term').first();
  await expect(term).toHaveAttribute('href', /^\/games\/romhacking\/glossary\/#term-/);
  await term.hover();
  await expect(page.locator('#term-card')).toHaveCount(0);
  await term.click();
  await expect(page).toHaveURL(/\/glossary\/#term-/);
  await context.close();
});

const crumbs = (page: Page) => page.getByRole('navigation', { name: '현재 위치' });

test('the trail opens a menu at each step and moves between the guide and the notes', async ({ page }) => {
  await page.goto(TEXT);
  const nav = crumbs(page);
  const guide = nav.getByRole('button', { name: '기초 가이드 펼치기' });
  await expect(guide).toHaveAttribute('aria-expanded', 'false');
  await guide.click();
  await expect(guide).toHaveAttribute('aria-expanded', 'true');
  const menu = page.locator(`#${await guide.getAttribute('aria-controls')}`);
  await expect(menu).toBeVisible();
  await expect(menu.locator('a[aria-current="page"]')).toHaveAttribute('href', TEXT);
  await expect(menu.locator('a')).toHaveCount(readyChapters().length);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(guide).toBeFocused();
  await expect(guide).toHaveAttribute('aria-expanded', 'false');

  // Opening one menu closes the other, and a click outside closes it.
  const top = nav.getByRole('button', { name: '롬 해킹 펼치기' });
  await guide.click();
  await top.click();
  await expect(menu).toBeHidden();
  await page.mouse.click(4, 600);
  await expect(top).toHaveAttribute('aria-expanded', 'false');

  // Keyboard: the arrow key opens the menu on the current chapter and moves through it.
  await guide.focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('a[aria-current="page"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.locator('a[aria-current="page"]')).not.toBeFocused();
  await page.keyboard.press('Escape');

  // The last step lists the notes that use this chapter.
  await nav.getByRole('button', { name: /관련 노트 펼치기$/ }).click();
  await nav
    .getByRole('link', { name: /^돌격편: / })
    .first()
    .click();
  await expect(page).toHaveURL(/\/games\/romhacking\/snes\/notes\/dragon-ball-z-super-gokuden-totsugeki\/#making-/);

  await crumbs(page).getByRole('button', { name: '롬 분석 노트 펼치기' }).click();
  const notes = crumbs(page).locator('.gcrumb-menu:visible');
  for (const p of KR_PATCHES) await expect(notes.locator(`a[href="${p.path}/"]`)).toHaveCount(1);
  await notes.getByRole('link', { name: '제절초', exact: true }).click();
  await expect(page).toHaveURL(notePath(OTOGIRISOU_PATCH));
  await crumbs(page).getByRole('button', { name: '제절초 관련 페이지 펼치기' }).click();
  await crumbs(page)
    .getByRole('link', { name: /^\d+장 / })
    .first()
    .click();
  await expect(page).toHaveURL(/\/games\/romhacking\/(snes\/)?[a-z-]+\/$/);

  await crumbs(page).getByRole('button', { name: '롬 해킹 펼치기' }).click();
  await crumbs(page)
    .getByRole('link', { name: /^용어집/ })
    .click();
  await expect(page).toHaveURL(GLOSSARY_PATH);
});

test('without scripts the trail is plain links to each step', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(SMRPG_NOTE);
  const nav = crumbs(page);
  await expect(nav.getByRole('button')).toHaveCount(0);
  await expect(nav.getByRole('link', { name: '롬 해킹', exact: true })).toHaveAttribute('href', GUIDE_PATH);
  await expect(nav.getByRole('link', { name: '롬 분석 노트' })).toHaveAttribute('href', `${GUIDE_PATH}#notes`);
  await context.close();
});

test('on a phone the trail fits one line and its menus stay on screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [GUIDE_PATH, GLOSSARY_PATH, TEXT, notePath(TOTSUGEKI_PATCH)]) {
    await page.goto(path);
    const nav = crumbs(page);
    const box = await nav.locator('ol').boundingBox();
    expect(box?.height ?? 99, path).toBeLessThan(44);
    for (const toggle of await nav.getByRole('button').all()) {
      await toggle.click();
      const menu = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
      const m = await menu.boundingBox();
      expect(m && m.x >= 0 && m.x + m.width <= 390, `${path} ${await toggle.getAttribute('aria-label')}`).toBe(true);
      await noHorizontalOverflow(page);
      await page.keyboard.press('Escape');
    }
  }
});

test('section titles in chapters, notes and the glossary link to themselves', async ({ page }) => {
  for (const path of [TEXT, SMRPG_NOTE, GLOSSARY_PATH]) {
    await page.goto(path);
    const link = page.locator('.prose h2 > a.heading-link').nth(1);
    const id = await link.evaluate(a => a.parentElement?.id ?? '');
    await expect(link).toHaveAttribute('href', `#${id}`);
    expect(await link.evaluate(a => getComputedStyle(a).cursor), path).toBe('pointer');
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${encodeURIComponent(id).replace(/%/g, '%')}$`));
  }
  await page.goto(TEXT);
  await expect(page.locator('.prose h3 > a.heading-link').first()).toHaveAttribute('href', /^#.+/);
});

const boxOf = async (page: Page, selector: string) => {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`${selector} is not on screen`);
  return box;
};

test('the trail sits under the site header at the top, never across its border', async ({ page }) => {
  for (const path of [GUIDE_PATH, TEXT, SMRPG_NOTE, GLOSSARY_PATH]) {
    await page.goto(path);
    const header = await boxOf(page, '.site-header');
    const trail = await boxOf(page, '.gcrumbs');
    expect(trail.y, path).toBeGreaterThanOrEqual(header.y + header.height - 0.5);
  }
});

test('the trail stays on screen under the header while scrolling, and its menus open over the body', async ({
  page,
}) => {
  await page.goto(SMRPG_NOTE);
  await page.mouse.wheel(0, 3000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000);
  const trail = page.getByRole('navigation', { name: '현재 위치' });
  await expect(trail).toBeInViewport();
  const header = await page.locator('.site-header').boundingBox();
  const box = await boxOf(page, '.gcrumbs');
  // Phones let the header scroll away, so the trail takes the top of the screen there.
  expect(box.y).toBeCloseTo(Math.max(0, (header?.y ?? 0) + (header?.height ?? 0)), 0);
  await trail.getByRole('button', { name: '롬 분석 노트 펼치기' }).click();
  const menu = page.locator('.gcrumb-menu:visible');
  const m = await menu.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(m && m.x >= 0 && m.x + m.width <= width).toBe(true);
  // The menu is what the reader sees at its middle, not the body under it.
  const hit = await menu.evaluate(el => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  });
  expect(hit).toBe(true);
  await noHorizontalOverflow(page);
});

test('a jump to a section leaves its title below the header and the trail', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of [TEXT, SMRPG_NOTE]) {
    await page.goto(path);
    const link = page.locator('.prose h2 > a.heading-link').nth(3);
    const id = await link.evaluate(a => a.parentElement?.id ?? '');
    await link.click();
    const trail = await boxOf(page, '.gcrumbs');
    const title = await boxOf(page, `[id="${id}"]`);
    expect(title.y, `${path}#${id}`).toBeGreaterThanOrEqual(trail.y + trail.height);
    await page.goto(`${path}#${id}`);
    await expect
      .poll(async () => (await boxOf(page, `[id="${id}"]`)).y - (await boxOf(page, '.gcrumbs')).y)
      .toBeGreaterThanOrEqual((await boxOf(page, '.gcrumbs')).height);
  }
});
