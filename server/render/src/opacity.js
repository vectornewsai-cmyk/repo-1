#!/usr/bin/env node
/**
 * opacity.js — Opacity/alpha cho video clip (R1-011, P0-04).
 *
 * Render THẬT bằng FFmpeg native: chuyển unit sang `format=rgba` rồi nhân
 * kênh alpha bằng `colorchannelmixer=aa=<opacity>`, sau đó overlay lên
 * timeline — overlay dùng alpha của foreground để composite.
 *
 * Vị trí áp dụng (trong render.js, bước đặt unit lên timeline):
 *   <unit> → format=rgba,colorchannelmixer=aa=OP → setpts → overlay
 * Áp SAU khi unit đã qua xfade merge, nên opacity là của toàn bộ unit
 * (xem OPACITY_LIMITS.md về trường hợp clip có transition).
 *
 * NGUYÊN TẮC TRUNG THỰC: chỉ "normal" blend được hỗ trợ; không có blend mode
 * khác, không keyframe opacity cho video clip ở Phase 1.
 */
"use strict";

const assert = require("assert");

/** Sai số so sánh số thực (mirror EPS trong validate.js). */
const EPS = 1e-6;

/** Format số cho filter FFmpeg (mirror num() trong render.js). */
function num(x) {
  if (!Number.isFinite(x)) throw new Error(`số không hợp lệ cho filter: ${x}`);
  return String(Math.round(x * 1e6) / 1e6);
}

/** Chuẩn hoá: undefined → 1 (đục hoàn toàn, hành vi cũ). */
function normalizeOpacity(v) {
  return v === undefined ? 1 : v;
}

/**
 * Validate opacity. Trả về mảng lỗi (rỗng = hợp lệ). Mirror bản TS (không có).
 * @param {unknown} v
 * @returns {string[]}
 */
function validateOpacity(v) {
  if (v === undefined) return [];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return [`opacity phải là số trong khoảng 0..1, nhận được: ${JSON.stringify(v)}`];
  }
  if (v < 0 || v > 1) {
    return [`opacity phải trong khoảng 0..1, nhận được: ${v}`];
  }
  return [];
}

/**
 * Dựng đoạn filter áp opacity cho 1 video unit.
 * @param {number|undefined} opacity
 * @returns {string} "" nếu opacity ≈ 1 (giữ nguyên pipeline cũ),
 *          ngược lại "format=rgba,colorchannelmixer=aa=<op>"
 * @throws nếu opacity không hợp lệ
 */
function buildOpacityFilter(opacity) {
  const errs = validateOpacity(opacity);
  if (errs.length > 0) throw new Error(errs[0]);
  const op = normalizeOpacity(opacity);
  if (op >= 1 - EPS) return "";
  return `format=rgba,colorchannelmixer=aa=${num(op)}`;
}

// ---------------------------------------------------------------------------
// Self-test: node src/opacity.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // 1. undefined / 1 → không đổi pipeline
  assert.strictEqual(buildOpacityFilter(undefined), "");
  assert.strictEqual(buildOpacityFilter(1), "");
  assert.strictEqual(buildOpacityFilter(1 - 1e-7), ""); // trong EPS

  // 2. Giá trị giữa → filter đúng
  assert.strictEqual(
    buildOpacityFilter(0.5),
    "format=rgba,colorchannelmixer=aa=0.5"
  );
  assert.strictEqual(
    buildOpacityFilter(0),
    "format=rgba,colorchannelmixer=aa=0"
  );
  const f = buildOpacityFilter(0.3333333);
  assert.ok(f.startsWith("format=rgba,colorchannelmixer=aa=0.333333"),
    `format số sai: ${f}`);

  // 3. Từ chối input sai
  assert.throws(() => buildOpacityFilter(1.5), /0\.\.1/);
  assert.throws(() => buildOpacityFilter(-0.1), /0\.\.1/);
  assert.throws(() => buildOpacityFilter("0.5"), /phải là số/);
  assert.throws(() => buildOpacityFilter(NaN), /phải là số/);
  assert.throws(() => buildOpacityFilter(null), /phải là số/);

  // 4. validateOpacity
  assert.deepStrictEqual(validateOpacity(undefined), []);
  assert.deepStrictEqual(validateOpacity(0), []);
  assert.deepStrictEqual(validateOpacity(1), []);
  assert.deepStrictEqual(validateOpacity(0.37), []);
  assert.ok(validateOpacity(2).length > 0);
  assert.ok(validateOpacity(-1).length > 0);
  assert.ok(validateOpacity("x").length > 0);
  assert.ok(validateOpacity(NaN).length > 0);

  console.log("✅ opacity.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("opacity.js — module opacity cho render worker. Chạy với --self-test để kiểm tra.");
    process.exit(2);
  }
}

module.exports = {
  EPS,
  normalizeOpacity,
  validateOpacity,
  buildOpacityFilter,
};
