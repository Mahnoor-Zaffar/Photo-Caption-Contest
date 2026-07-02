import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm start",
    url: "http://localhost:8000/api/health/live",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: "test",
      PORT: "8000",
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgres://localhost:5432/photo_caption_contest",
      JWT_SECRET: process.env.JWT_SECRET || "ci-test-secret",
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "ci-test-refresh-secret",
    },
  },
});
