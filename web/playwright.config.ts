import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const rootEnvFile = new URL("../.env", import.meta.url);

if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

const isCi = process.env["CI"] !== undefined;
const apiPort = "3100";
const webPort = "8180";
const webOrigin = `http://localhost:${webPort}`;
const ports = { API_PORT: apiPort, WEB_PORT: webPort };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : "50%",
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: webOrigin,
    reducedMotion: "reduce",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @wizard/trpc start",
      url: `http://localhost:${apiPort}/listUsers`,
      env: { ...ports, WEB_ORIGIN: webOrigin },
      reuseExistingServer: !isCi,
    },
    {
      command: "pnpm build && pnpm preview",
      url: webOrigin,
      env: ports,
      reuseExistingServer: !isCi,
    },
  ],
});
