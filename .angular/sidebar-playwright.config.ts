import { defineConfig } from '@playwright/test';
import config from '../playwright.config';
export default defineConfig({ ...config, testDir: '../e2e', outputDir: '../test-results', webServer: { cwd: process.cwd(), command: 'node .angular/sidebar-static-server.mjs', url: 'http://127.0.0.1:4300', timeout: 30000, reuseExistingServer: false } });
