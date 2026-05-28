import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 90_000,
  expect: {
    timeout: 15_000
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "local-chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        headless: true,
        storageState: process.env.PLAYWRIGHT_AUTH_STATE
      }
    }
  ]
});
