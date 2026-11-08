#!/usr/bin/env node
/**
 * copy-web-dist.mjs — copy bản build web (apps/web/dist) sang
 * apps/desktop/dist-web để đóng gói cùng app Electron.
 * Chạy sau `npm run build --workspace=@repo-1/web` (script build:desktop).
 * dist-web/ là build artifact (đã có trong .gitignore qua dist/), không commit.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const src = path.join(repoRoot, "apps", "web", "dist");
const dest = path.join(repoRoot, "apps", "desktop", "dist-web");

if (!fs.existsSync(path.join(src, "index.html"))) {
  console.error(`[copy-web-dist] Không tìm thấy ${src}/index.html — chạy build web trước.`);
  process.exit(1);
}
fs.rmSync(dest, { force: true, recursive: true });
fs.cpSync(src, dest, { recursive: true });
const count = fs.readdirSync(dest).length;
console.log(`[copy-web-dist] Đã copy apps/web/dist → apps/desktop/dist-web (${count} mục cấp 1).`);
