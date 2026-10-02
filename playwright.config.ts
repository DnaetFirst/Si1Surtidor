import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.TEST_WEB_URL || 'http://127.0.0.1:5173',
    browserName: 'chromium',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
    locale: 'es-BO',
    timezoneId: 'America/La_Paz',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    { command: 'npm run dev -w @surtidor/api', url: `${process.env.TEST_API_URL || 'http://127.0.0.1:3000/api'}/auth/csrf`, reuseExistingServer: true, timeout: 60_000 },
    { command: 'npm run dev -w @surtidor/web', url: process.env.TEST_WEB_URL || 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 60_000 },
  ],
});
