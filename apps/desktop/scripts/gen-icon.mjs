#!/usr/bin/env node
/**
 * Tạo icon cho electron-builder lúc build (prepackage) — Phase 10, luồng G3.
 *
 * KHÔNG commit file PNG binary vào repo (luật push: push-files không đọc
 * được binary). Icon được vẽ lại từ nguồn duy nhất là
 * apps/web/public/icons/gen_icons.py (PWA icon, Phase 8: rounded square
 * tối + tam giác play trắng + gạch accent tím — thiết kế gốc, không dùng
 * trade dress của CapCut) rồi copy bản 512x512 vào build/icon.png để
 * electron-builder dùng.
 *
 * Chạy tay: node apps/desktop/scripts/gen-icon.mjs
 * Yêu cầu: python3 + Pillow (gen_icons.py dùng PIL).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(dirname(desktopDir));
const genScript = join(repoRoot, "apps/web/public/icons/gen_icons.py");
const webIconsDir = join(repoRoot, "apps/web/public/icons");
const outDir = join(desktopDir, "build");
const outIcon = join(outDir, "icon.png");

function fail(msg) {
  console.error(`[gen-icon] FAIL: ${msg}`);
  process.exit(1);
}

if (!existsSync(genScript)) fail(`không tìm thấy ${genScript}`);

// 1. Chạy script gen icon gốc (ghi PNG vào apps/web/public/icons/ —
//    đây là file sinh ra lúc build, không commit, đúng mẫu Phase 8).
const r = spawnSync("python3", [genScript], { stdio: "inherit" });
if (r.error) fail(`không chạy được python3: ${r.error.message}`);
if (r.status !== 0) fail(`gen_icons.py thoát mã ${r.status}`);

const src = join(webIconsDir, "icon-512.png");
if (!existsSync(src)) fail(`không thấy ${src} sau khi chạy gen_icons.py`);

// 2. Copy bản 512x512 vào build/icon.png cho electron-builder.
mkdirSync(outDir, { recursive: true });
copyFileSync(src, outIcon);
const st = statSync(outIcon);
console.log(`[gen-icon] OK: ${outIcon} (${st.size} bytes, 512x512 PNG)`);
