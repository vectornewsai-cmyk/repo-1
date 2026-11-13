#!/usr/bin/env node
/**
 * vite-diagnosis-regex-92t6.test.mjs — Phase 9 đợt 92, luồng T6.
 *
 * Kiểm chứng sửa regex EADDRINUSE (S6 §6.11): vite in thông báo thân
 * thiện "Port 5580 is already in use" thay vì EADDRINUSE — regex cũ
 * (/EADDRINUSE|address already in use/i) KHÔNG khớp dạng này nên
 * chẩn đoán rơi về "chưa rõ nguyên nhân".
 *
 * Test KHÔNG hardcode regex: nó đọc source thật của 3 harness
 * (clicktest-77e1-deint-fps, probe-78f1-tick-time,
 * probe-79g1-tick-time), trích literal regex gán cho hasAddrInUse /
 * hasEperm, rồi assert trên các mẫu log thật. Nếu ai sửa regex trong
 * harness mà làm hỏng một dạng, test này đỏ.
 *
 * Chạy: node --test apps/web/scripts/vite-diagnosis-regex-92t6.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const HARNESSES = [
  "clicktest-77e1-deint-fps.mjs",
  "probe-78f1-tick-time.mjs",
  "probe-79g1-tick-time.mjs",
];

function extractRegex(src, varName) {
  // Dòng dạng: const hasAddrInUse = /.../i.test(...);
  const m = new RegExp(`const ${varName} = (\\/[^\\n]*?\\/[a-z]*)\\.test`).exec(src);
  assert.ok(m, `không trích được regex ${varName} từ source`);
  return eval(m[1]); // eslint-disable-line no-eval — literal lấy từ file repo, không phải input ngoài
}

// Mẫu log thật (vite 5/6, Node):
const CASES_ADDR = [
  // [mô tả, mẫu log, kỳ vọng khớp]
  ["EADDRINUSE dạng node", "Error: listen EADDRINUSE: address already in use 127.0.0.1:5580", true],
  ["address already in use (chữ thường)", "Error: listen EADDRINUSE: address already in use :::5580", true],
  ["thông báo thân thiện của vite, cổng 5580", "Port 5580 is already in use", true],
  ["thông báo thân thiện của vite, cổng khác", "Port 5173 is already in use", true],
  ["vite đầy đủ: error + gợi ý cổng khác", "Error: Port 5580 is already in use\nTry another port or close the process using it", true],
  ["log vite sạch (khởi động OK)", "VITE v6.3.0  ready in 412 ms\n➜  Local:   http://127.0.0.1:5580/", false],
  ["log EPERM — KHÔNG phải port conflict", "Error: EPERM: operation not permitted, open 'node_modules/.vite/deps/_metadata.json'", false],
  ["log trống", "", false],
];

const CASES_EPERM = [
  ["EPERM thật (operation not permitted)", "Error: EPERM: operation not permitted, open 'x'", true],
  ["npm error code EPERM", "npm error code EPERM\nnpm error syscall open", true],
  ["chữ EPERM trần", "EPERM", true],
  ["log port conflict — KHÔNG phải EPERM", "Port 5580 is already in use", false],
  ["log vite sạch", "VITE v6.3.0  ready in 412 ms", false],
];

for (const file of HARNESSES) {
  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const hasAddrInUse = extractRegex(src, "hasAddrInUse");
  const hasEperm = extractRegex(src, "hasEperm");

  test(`${file}: hasAddrInUse khớp cả EADDRINUSE lẫn thông báo thân thiện của vite`, () => {
    for (const [label, sample, expected] of CASES_ADDR) {
      assert.equal(hasAddrInUse.test(sample), expected, `${label}: ${JSON.stringify(sample)}`);
    }
  });

  test(`${file}: hasEperm phân biệt EPERM với port conflict`, () => {
    for (const [label, sample, expected] of CASES_EPERM) {
      assert.equal(hasEperm.test(sample), expected, `${label}: ${JSON.stringify(sample)}`);
    }
  });

  test(`${file}: thứ tự chẩn đoán — EPERM được ưu tiên trước port conflict`, () => {
    // Mô phỏng đúng thứ tự trong harness: hasEperm trước, hasAddrInUse sau.
    const diagnose = (text) =>
      hasEperm.test(text) ? "EPERM" : hasAddrInUse.test(text) ? "port" : "unknown";
    assert.equal(diagnose("Port 5580 is already in use"), "port");
    assert.equal(diagnose("EPERM: operation not permitted"), "EPERM");
    assert.equal(diagnose("EPERM: operation not permitted\nPort 5580 is already in use"), "EPERM");
    assert.equal(diagnose("VITE ready in 412 ms"), "unknown");
  });
}
