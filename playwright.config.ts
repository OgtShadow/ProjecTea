import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

// @ts-ignore
const isDocker = typeof process !== 'undefined' && !!process.env.PLAYWRIGHT_ENABLED;

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: 'tests',
  testMatch: /.*\.e2e\.ts/,
  /* Timeout for each test */
  timeout: 30 * 1000,
  /* Retry failed tests 2 times only in CI, not during local dev */
  // @ts-ignore
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel test suite runs */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'], // Simple output during dev
    ['json', { outputFile: 'tests/report/report.json' }], // For CI
    ['html', { outputFolder: 'tests/report/html-report' }], // Human readable report
  ],
  /* Shared settings for all tests in their files */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:8082',
    /* Collect trace when retrying the failed test, taking debugging for granted */
    trace: 'on-first-retry',
    /* Video to keep on failures */
    video: 'retain-on-failure',
    /* Maximum time each action can take */
    actionTimeout: 5 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Folder for test artifacts like screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: isDocker ? undefined:{
    command: 'npm run .',
    url: 'http://localhost:8082/api/status',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
