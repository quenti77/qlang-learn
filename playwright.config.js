import { defineConfig, devices } from '@playwright/test';

// The tests drive the real, built site in a real browser, with the real qlang.wasm.
// Locally: QLANG_REPO=../qlang npm run test:e2e   (see scripts/sync-qlang.mjs)
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4321', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npx astro preview --ignore-lock --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321/fr/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
