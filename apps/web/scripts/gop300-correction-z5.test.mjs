#!/usr/bin/env node
// Phase 9 đợt 44, luồng Z5 — test giữ đính chính "GOP 300": các file
// từng ghi sai/mơ hồ về sparse-gop-noise phải còn mang ghi chú Z5.
// Đây là test canh chừng tài liệu (không đo lại stss — file fixture
// nằm ngoài repo, ở scratch; số stss ghi trong Z5 LIMITS).
// Chạy: node --test apps/web/scripts/gop300-correction-z5.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("header script: cap + 3 clicktest ghi GOP hiệu dụng 30 + marker Z5", () => {
  for (const f of [
    "apps/web/scripts/per-seek-probe-chrome-cap-run.mjs",
    "apps/web/scripts/clicktest-reverse-hold-pipe.mjs",
    "apps/web/scripts/clicktest-round30-m2-forward-pipe.mjs",
    "apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs",
  ]) {
    const s = read(f);
    assert.ok(s.includes("ROUND44-Z5"), `${f} thiếu marker ROUND44-Z5`);
    assert.ok(s.includes("hiệu dụng 30"), `${f} thiếu "hiệu dụng 30"`);
    assert.ok(!s.includes("sparse-gop-noise (GOP 300"), `${f} còn ghi noise là GOP 300`);
  }
});

test("docs sai/mơ hồ: W5, X5, P5, ROUND33 còn ghi chú đính chính Z5", () => {
  for (const f of [
    "docs/PHASE9_ROUND41_W5_PROBE_V2_LIMITS.md",
    "docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md",
    "docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md",
    "docs/PHASE9_ROUND33_LIMITS.md",
  ]) {
    const s = read(f);
    assert.ok(s.includes("Đính chính Z5"), `${f} thiếu ghi chú đính chính Z5`);
  }
});

test("comment reverseDecodeAhead: làm rõ GOP 300 của P5 là cửa sổ, không phải GOP đều", () => {
  const s = read("apps/web/src/lib/reverseDecodeAhead.ts");
  assert.ok(s.includes("ROUND44-Z5"), "thiếu marker ROUND44-Z5");
  assert.ok(s.includes("cửa sổ decode 300 frame"), "thiếu diễn giải cửa sổ decode");
});
