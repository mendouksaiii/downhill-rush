import { defineConfig, devices } from '@playwright/test';

/* The game boots Three.js + a Rapier WASM bundle before window.DR exists, which
   is slow on a cold CI runner — hence the generous timeouts. Everything runs
   serially: these specs drive one shared dev server and assert on global game
   state, so parallel workers would fight each other. */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 150_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5610',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 940 } } },
    /* iPhone metrics + UA, but forced onto Chromium: these specs assert layout
       and DOM wiring, not engine quirks, and the paths that matter (the isMobile
       UA regex, pointer:coarse, the <=780px media queries) all key off the UA
       and viewport. Keeps CI to a single browser download. */
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx http-server . -p 5610 -c-1 --silent',
    url: 'http://127.0.0.1:5610/play.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
