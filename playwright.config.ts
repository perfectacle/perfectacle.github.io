import { defineConfig, devices } from '@playwright/test';

// Runs against the built site in dist/ (pnpm build first).
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: { baseURL: 'http://localhost:4322', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /lighthouse/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /lighthouse/ },
    // Performance audits run on their own (pnpm test:lighthouse) so parallel tests don't skew the numbers.
    { name: 'lighthouse', testMatch: /lighthouse\.spec\.ts/, timeout: 120_000 },
  ],
  webServer: {
    command: 'pnpm exec astro preview --port 4322 --ignore-lock',
    url: 'http://localhost:4322',
    reuseExistingServer: !process.env['CI'],
  },
});
