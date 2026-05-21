import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [
    [
      'html',
      {
        outputFolder: 'out/reports/playwright',
        open: 'never'
      }
    ],
    [
      'list'
    ]
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    }
  ],
  webServer: {
    command: "npx serve . -p 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
