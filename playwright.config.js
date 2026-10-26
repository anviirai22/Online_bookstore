import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node server/src/server.js', url: 'http://127.0.0.1:5000/api/health', reuseExistingServer: true },
    { command: 'npm run dev --workspace client', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
