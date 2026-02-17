import type { PlaywrightTestConfig } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const PARITY_BASE_PATH = String(process.env.PARITY_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "")
  .trim()
  .replace(/\/+$/, "");
const READY_PATH = PARITY_BASE_PATH ? `${PARITY_BASE_PATH}/` : "/";

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
    url: `http://127.0.0.1:${PORT}${READY_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
};

export default config;
