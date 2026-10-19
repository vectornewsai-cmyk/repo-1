/**
 * playwright.config.ts — Cấu hình Playwright cho smoke test E2E của VCut Studio.
 *
 * Chạy: npx playwright test
 * Cài browser: npx playwright install chromium
 *
 * Ghi chú trung thực:
 * - Đây là smoke test: chỉ kiểm tra app load được và các thao tác UI cơ bản.
 * - KHÔNG test render MP4 thật (đó là integration test của server/render).
 * - KHÔNG test được trên máy local nếu chưa cài Chromium (xem VERIFICATION.md).
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Timeout cho mỗi test: 60s (app cần load sample project).
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  // Chạy tuần tự trong CI để tránh tranh chấp port.
  workers: 1,
  // Retry 1 lần trong CI để loại bỏ flake.
  retries: process.env.CI ? 1 : 0,
  // Báo cáo: list cho console + html để xem sau.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    // Base URL: vite preview server (xem webServer bên dưới).
    baseURL: "http://127.0.0.1:4173",
    // Chụp screenshot khi test fail.
    screenshot: "only-on-failure",
    // Quay video khi test fail (giới hạn kích thước để đỡ tốn disk CI).
    video: "retain-on-failure",
    // Trace khi fail lần đầu (hữu ích để debug).
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Tự động build + start preview server trước khi chạy test.
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Đảm bảo dist/ đã được build trước (CI chạy `npm run build` ở step riêng).
  },
});
