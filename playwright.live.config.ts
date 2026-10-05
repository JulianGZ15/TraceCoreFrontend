import { defineConfig } from '@playwright/test';
const port = process.env['TRACECORE_E2E_FRONT_PORT'] ?? '4310';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './e2e',
  testMatch:
    process.env['TRACECORE_E2E_RECOVERY'] === 'true'
      ? ['**/quality-restart.spec.ts', '**/commerce-restart.spec.ts']
      : '**/live-api.spec.ts',
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: 'list',
  outputDir: 'test-results-live',
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run start -- --host 127.0.0.1 --port ${port} --proxy-config "${process.env['TRACECORE_E2E_PROXY']}"`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
