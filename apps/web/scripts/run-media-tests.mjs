#!/usr/bin/env node
/**
 * run-media-tests.mjs — Phase 9 đợt 96, luồng X8: runner THỐNG NHẤT cho các
 * test media.*.test.ts (nợ W8 §8 / LIMITS gộp đợt 95 §4 mục 8c).
 *
 * Vì sao không chạy thẳng bằng node: media.ts import "./lib" không đuôi
 * (thư mục src/lib/ tồn tại) nên `node --experimental-strip-types` fail
 * resolve import; và bundle CJS fail do top-level await trong test.
 * Cách chạy DUY NHẤT được hỗ trợ: esbuild bundle ESM rồi chạy bằng node:
 *   ./node_modules/.bin/esbuild <test> --bundle --format=esm --platform=node
 *     --outfile=/tmp/<tên>.test.mjs && node /tmp/<tên>.test.mjs
 * (lệnh đầy đủ cũng ghi trong đầu mỗi file test).
 *
 * Chạy: node apps/web/scripts/run-media-tests.mjs [-- <tên-file>|all]
 *   Mặc định chạy cả 3 file media.*.test.ts; exit != 0 nếu có file fail
 *   (kể cả lỗi bundle). Bundle ghi ra /tmp, không đụng repo.
 * KHÔNG push/tag/binary.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ESBUILD = path.join(ROOT, "node_modules", ".bin", "esbuild");

const TESTS = [
  { src: "apps/web/src/media.blobPrefetch90R3.test.ts", out: "/tmp/blob-prefetch-90r3.test.mjs" },
  { src: "apps/web/src/media.captureThumb66T6.test.ts", out: "/tmp/capture-thumb-66t6.test.mjs" },
  { src: "apps/web/src/media.retryPlay95W2.test.ts", out: "/tmp/retry-play-95w2.test.mjs" },
];

const only = process.argv[2] && process.argv[2] !== "--" ? process.argv[2] : null;
const list = only
  ? TESTS.filter((t) => t.src.endsWith(only) || path.basename(t.src) === only)
  : TESTS;
if (only && list.length === 0) {
  console.error(`không có test media.* khớp "${only}" (có: ${TESTS.map((t) => path.basename(t.src)).join(", ")})`);
  process.exit(2);
}
if (!fs.existsSync(ESBUILD)) {
  console.error(`không thấy esbuild tại ${ESBUILD} — chạy từ gốc repo sau khi npm install`);
  process.exit(2);
}

let failed = 0;
for (const t of list) {
  console.log(`\n=== ${t.src} ===`);
  const b = spawnSync(ESBUILD, [t.src, "--bundle", "--format=esm", "--platform=node", `--outfile=${t.out}`],
    { cwd: ROOT, stdio: "inherit" });
  if (b.status !== 0) { console.log(`BUNDLE FAIL (${t.src})`); failed++; continue; }
  const r = spawnSync(process.execPath, [t.out], { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) { console.log(`FAIL (${t.src}) exit=${r.status}`); failed++; }
  else console.log(`PASS (${t.src})`);
}
console.log(`\nmedia.*: ${list.length - failed}/${list.length} PASS${failed ? ` — ${failed} FAIL` : ""}`);
process.exit(failed ? 1 : 0);
