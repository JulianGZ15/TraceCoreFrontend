import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: '**/equipment-photos.spec.ts',
  workers: 1,
  webServer: {
    command: 'node e2e/serve-built-app.mjs',
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
