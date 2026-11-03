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
  // versions.spec.js runs on the versions side by side (port 4322, see e2e/servers.mjs), the others on one version
  projects: [
    { name: 'chromium', testIgnore: /versions\.spec/, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testIgnore: /versions\.spec/, use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', testIgnore: /versions\.spec/, use: { ...devices['Pixel 7'] } },
    { name: 'versions', testMatch: /versions\.spec/, use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4322' } },
    { name: 'versions-mobile', testMatch: /versions\.spec/, use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4322' } },
  ],
  webServer: {
    command: 'node e2e/servers.mjs',
    url: 'http://127.0.0.1:4321/fr/',
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  },
});
