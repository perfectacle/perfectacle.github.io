import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/patches/', '/patches/super-mario-rpg/']) {
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

test('catalogue opens the final Korean guide and links to the official patch release', async ({ page }) => {
  await page.goto('/patches/');
  await page.locator('main a[href="/patches/super-mario-rpg/"]').first().click();
  await expect(page).toHaveURL(/\/patches\/super-mario-rpg\/$/);
  await expect(page.locator('main')).toContainText('v1.1');
  await expect(page.locator('a[href="https://cafe.naver.com/hansicgu/37276"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://cafe.naver.com/hansicgu/37278"]').first()).toBeAttached();
  await expect(page.locator('main')).not.toContainText('v1.0');
  await expect(page.locator('audio, video, iframe')).toHaveCount(0);
});
