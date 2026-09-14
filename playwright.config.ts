import { defineConfig } from "@playwright/test";
import { base } from "./site.config.mjs";

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: `http://127.0.0.1:4321${base}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "mobile-320", use: { browserName: "chromium", viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: "node scripts/serve-dist.mjs",
    url: `http://127.0.0.1:4321${base}`,
    reuseExistingServer: false,
  },
});
