#!/usr/bin/env node
/**
 * dev-desktop.mjs — chạy VCut Studio ở chế độ dev:
 *   1. Khởi động Vite dev server của apps/web (:5173).
 *   2. Chờ server phản hồi HTTP.
 *   3. Mở Electron với VCUT_DESKTOP_DEV=1 (load http://127.0.0.1:5173).
 * Ctrl+C: dừng cả vite lẫn Electron.
 * (Chạy qua script npm `dev:desktop` ở apps/desktop/package.json.)
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const desktopDir = path.join(repoRoot, "apps", "desktop");

const children = [];
function killAll(signal = "SIGTERM") {
  for (const child of children) {
    // Giết cả process group (vite là cháu của npm — kill npm không đủ,
    // vite sẽ mồ côi và giữ cổng 5173; xem LIMITS G1 §5).
    try {
      process.kill(-child.pid, signal);
    } catch {
      try {
        child.kill(signal);
      } catch {
        // Tiến trình có thể đã thoát.
      }
    }
  }
}
process.on("SIGINT", () => {
  killAll("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  killAll("SIGTERM");
  process.exit(0);
});

async function waitForDevServer(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch("http://127.0.0.1:5173/", { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status === 404) return true;
    } catch {
      // Chưa lên — chờ tiếp.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function main() {
  console.log("[dev-desktop] Khởi động Vite dev server (apps/web :5173)...");
  // Pin --host 127.0.0.1: Vite mặc định trên máy này chỉ bind ::1, trong khi
  // main process load http://127.0.0.1:5173 (xem LIMITS G1 §5).
  const vite = spawn("npm", ["run", "dev", "--workspace=@repo-1/web", "--", "--host", "127.0.0.1"], {
    cwd: repoRoot,
    detached: true,
    stdio: "inherit",
  });
  children.push(vite);

  const ready = await waitForDevServer();
  if (!ready) {
    console.error("[dev-desktop] Vite dev server không lên sau 60s — dừng.");
    killAll();
    process.exit(1);
  }
  console.log("[dev-desktop] Vite đã sẵn sàng — mở Electron...");
  const electronBin = path.join(repoRoot, "node_modules", ".bin", "electron");
  // Chạy dưới quyền root (VM test/CI) thì Chromium từ chối sandbox của hệ
  // điều hành — thêm --no-sandbox chỉ trong trường hợp này. App đóng gói
  // cho user thường (không phải root) không dùng flag này.
  const electronArgs = ["."];
  if (typeof process.getuid === "function" && process.getuid() === 0) {
    electronArgs.push("--no-sandbox");
  }
  const electron = spawn(
    electronBin,
    electronArgs,
    {
      cwd: desktopDir,
      detached: true,
      env: { ...process.env, VCUT_DESKTOP_DEV: "1" },
      stdio: "inherit",
    },
  );
  children.push(electron);
  electron.on("exit", (code) => {
    console.log(`[dev-desktop] Electron thoát (code ${code}) — dừng Vite.`);
    killAll();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("[dev-desktop] Lỗi:", err);
  killAll();
  process.exit(1);
});
