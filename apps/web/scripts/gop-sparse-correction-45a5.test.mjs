#!/usr/bin/env node
// Phase 9 đợt 45, luồng A5 — test giữ sweep đính chính "GOP thưa"
// (nợ Z5 §2.5: liệt kê hệ quả, chưa sửa từng dòng; A5 đính chính
// bằng bảng trong LIMITS mới, KHÔNG sửa trực tiếp docs cũ).
// Đây là test canh chừng tài liệu + comment (không đo lại stss —
// file fixture nằm ngoài repo, ở scratch; số stss đo lại độc lập
// ở đợt 45 ghi trong LIMITS A5: noise 30 mục cách nhau 30,
// flat [1,301,601], noise-30s [1,301,601]).
// Chạy: node --test apps/web/scripts/gop-sparse-correction-45a5.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Mọi dòng §2.5 của Z5 + các dòng echo tổng hợp phải có mặt trong
// bảng đính chính của LIMITS A5 (file + số dòng, đúng như trên đĩa
// lúc sweep; docs cũ KHÔNG bị sửa nên số dòng này là ảnh chụp).
const CORRECTION_ROWS = [
  ["PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md", "L48"],
  ["PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md", "L112"],
  ["PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md", "L250"],
  ["PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md", "L318"],
  ["clicktest-round37-t5-fallback-pipe.mjs", "L40"],
  ["clicktest-round37-t5-fallback-pipe.mjs", "L308"],
  ["PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md", "L207"],
  ["PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md", "L234"],
  ["PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md", "L283"],
  ["PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md", "L26"],
  ["PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md", "L57"],
  ["PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md", "L25"],
  ["PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md", "L214"],
  ["PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md", "L165"],
  ["PHASE9_ROUND37_LIMITS.md", "L72"],
  ["PHASE9_ROUND37_LIMITS.md", "L153"],
  ["PHASE9_ROUND38_LIMITS.md", "L56"],
  ["PHASE9_ROUND38_LIMITS.md", "L172"],
  ["PHASE9_ROUND39_LIMITS.md", "L92"],
];

test("LIMITS A5: bảng đính chính phủ đủ mọi dòng §2.5 của Z5 + echo tổng hợp", () => {
  const s = read("docs/PHASE9_ROUND45_A5_PROBE_LIMITS.md");
  assert.ok(s.includes("GOP hiệu dụng 30"), "LIMITS A5 thiếu kết luận GOP hiệu dụng 30");
  assert.ok(s.includes("sparse-gop-noise"), "LIMITS A5 thiếu tên file noise");
  for (const [file, line] of CORRECTION_ROWS) {
    assert.ok(s.includes(file), `LIMITS A5 thiếu file ${file}`);
    assert.ok(s.includes(line), `LIMITS A5 thiếu dòng ${line} của ${file}`);
  }
});

test("LIMITS A5: ghi rõ số đo vẫn đứng, chỉ nhãn thưa là sai", () => {
  const s = read("docs/PHASE9_ROUND45_A5_PROBE_LIMITS.md");
  assert.ok(s.includes("số đo vẫn đứng"), "LIMITS A5 thiếu khẳng định số đo vẫn đứng");
});

test("per-seek-probe.mjs: comment mơ hồ đã gọi đúng tên sparse-gop-flat", () => {
  const s = read("apps/web/scripts/per-seek-probe.mjs");
  assert.ok(s.includes("ROUND45-A5"), "thiếu marker ROUND45-A5");
  assert.ok(s.includes("sparse-gop-flat"), "comment chưa gọi đúng tên sparse-gop-flat");
  assert.ok(!s.includes("fixture sparse-gop:"), "còn comment mơ hồ 'fixture sparse-gop:'");
  assert.ok(!s.includes("fixture sparse-gop 10 s"), "còn comment mơ hồ 'fixture sparse-gop 10 s'");
});

test("chain script vẫn dùng freezeDist của Z5 (không hồi quy về cpSync)", () => {
  const s = read("apps/web/scripts/per-seek-probe-chain-run.mjs");
  assert.ok(s.includes("freezeDist"), "chain script mất freezeDist");
  assert.ok(s.includes("ROUND44-Z5"), "chain script mất marker ROUND44-Z5");
});
