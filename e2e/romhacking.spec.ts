import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  GUIDE_CHAPTERS,
  GUIDE_PATH,
  chapterPath,
  notePath,
  readyChapters,
} from '../src/components/romhacking/chapters.ts';
import { KR_PATCHES, KR_PATCH_TOOLKIT_URL, sourceUrl } from '../src/lib/kr-patches.ts';

const PAGES = [GUIDE_PATH, ...readyChapters().map(chapterPath), ...KR_PATCHES.map(notePath)];
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
  await page.goto('/games/kr-patches/');
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
  await page.getByRole('navigation', { name: '현재 위치' }).getByRole('link', { name: '롬 해킹 기초' }).click();
  await expect(page).toHaveURL(GUIDE_PATH);
});

test('chapters key comments by their own path and link the patch notes and toolkit', async ({ page }) => {
  await page.goto(BANKS);
  await expect(page.locator('#waline')).toHaveAttribute('data-path', BANKS);
  await expect(
    page.locator('a[href="/games/romhacking/snes/notes/dragon-ball-z-super-gokuden-totsugeki/#making-dialogue"]'),
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
  await expect(page.locator('a[href="/games/romhacking/snes/notes/otogirisou/#making-wordwrap"]')).toHaveCount(1);
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
  for (const path of [ENDIAN, BANKS, CPU, GRAPHICS, LZSS, HUFFMAN, EXPANSION]) {
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
  await expect(widget.locator('[data-last]')).toContainText('실제 자료는 더 이어집니다');

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

test('the guide index lists the four ROM analysis notes', async ({ page }) => {
  await page.goto(GUIDE_PATH);
  const notes = page.locator('.note-map');
  await expect(notes.locator('li')).toHaveCount(KR_PATCHES.length);
  for (const patch of KR_PATCHES) await expect(notes.getByRole('link', { name: patch.title })).toHaveCount(1);
});
