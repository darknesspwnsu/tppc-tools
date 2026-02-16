import type { PlaywrightTestConfig } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);

const config: PlaywrightTestConfig = {
  testDir: "tests",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: {
    timeout: 20_000
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
    trace: "on-first-retry"
  },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
};

export default config;
