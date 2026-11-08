#!/usr/bin/env node
/**
 * Chuẩn bị trước khi electron-builder đóng gói — Phase 10, luồng G3.
 * Chạy tự động qua npm script "prepackage" (npm chạy pre<name> trước <name>).
 *
 * 1. Tạo icon build/icon.png từ nguồn gen_icons.py (scripts/gen-icon.mjs).
 * 2. Copy web UI đã build (apps/web/dist) vào apps/desktop/dist-web
 *    (scripts/copy-web-dist.mjs của luồng G1). Main process phục vụ UI
 *    từ đây qua custom scheme (src/protocol.ts), không phụ thuộc vite dev
 *    server hay thư mục repo lúc chạy.
 *
 * Điều kiện tiên quyết: đã chạy `npm run build` ở apps/web trước
 * (root script package:linux làm việc này).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));

function run(script, label) {
  runArgs(script, [], label);
}

function runArgs(script, args, label) {
  const r = spawnSync("node", [join(desktopDir, "scripts", script), ...args], {
    stdio: "inherit",
  });
  if (r.error) {
    console.error(`[prepackage] FAIL: không chạy được ${script}: ${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`[prepackage] FAIL: ${script} thoát mã ${r.status}`);
    process.exit(1);
  }
  console.log(`[prepackage] OK: ${label}`);
}

run("gen-icon.mjs", "icon build/icon.png");
run("copy-web-dist.mjs", "web UI → dist-web");
// ROUND52-I5 (OPT-IN, mặc định TẮT): bundle venv Python thu gọn vào gói.
// Bật bằng VCUT_BUNDLE_SLIM_VENV=caption,tts,reframe (vd: thêm ~1G vào gói
// — xem docs/PHASE9_ROUND52_I5_SHIP_VENV_MODELS_LIMITS.md §2). Không set thì
// app đóng gói chạy AI bằng venv hệ thống (dev) hoặc báo thiếu venv + hướng
// user tải model (xem modelDownloader.js). Model AI KHÔNG BAO GIỜ bundle
// (2,8G) — luôn tải riêng lần đầu về userData/models.
// Chạy TRƯỚC copy-bundled-server để copy script nhặt được build/slim-venv/*
// ngay trong cùng lượt đóng gói (xem copy-bundled-server.mjs §8).
const slimList = (process.env.VCUT_BUNDLE_SLIM_VENV || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
for (const svc of slimList) {
  runArgs("build-slim-venv.mjs", ["--service", svc], `venv thu gọn ${svc} → build/slim-venv/${svc}`);
}
// ROUND51-H8: stage cây server (bridge + render + node_modules thu gọn +
// LUT) vào build/bundled-server để electron-builder bundle theo
// extraResources "vcut-server" (xem scripts/copy-bundled-server.mjs).
run("copy-bundled-server.mjs", "server/bridge+render → build/bundled-server");
console.log("[prepackage] OK: sẵn sàng đóng gói.");
