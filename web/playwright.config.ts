import { defineConfig, devices } from "@playwright/test";

const isCi = process.env["CI"] !== undefined;
const apiPort = "3100";
const webPort = "8180";
const ports = { API_PORT: apiPort, WEB_PORT: webPort };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : "50%",
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @wizard/trpc start",
      url: `http://localhost:${apiPort}/listUsers`,
      env: ports,
      reuseExistingServer: !isCi,
    },
    {
      command: "pnpm build && pnpm preview",
      url: `http://localhost:${webPort}`,
      env: ports,
      reuseExistingServer: !isCi,
    },
  ],
});
