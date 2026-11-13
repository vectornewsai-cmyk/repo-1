#!/usr/bin/env node
/**
 * test_round51_h5_speed_keyframe_null.js — Đợt 51 luồng H5:
 * normalizeSpeedKeyframes null + chống lệch mirror video-spec
 * (nợ F1 §7.2/§7.4/§7.5/§7.6).
 *
 * Nợ F1 §7.2: `normalizeSpeedKeyframes` vẫn sort trực tiếp ở cả 3 mirror
 * (packages/video-spec/src/speedcurve.ts, speedcurve.js viết tay,
 * server/render/src/speedramp.js) — entry null ném TypeError khi gọi
 * trực tiếp (`Cannot read properties of null (reading 't')` ở sort,
 * `(reading 'v')` ở speedAt/integrateSpeed). Luồng này lọc entry lỗi
 * (null / không phải object / t hoặc v không hữu hạn) TRƯỚC khi sort
 * ở cả 3 mirror, cùng mẫu `normalizeKeyframes` đợt 50 F1; `speedAt` /
 * `integrateSpeed` hết entry hợp lệ thì ném lỗi rõ "mảng keyframes rỗng".
 * `trimSpeedKeyframes` (TS + .js) cũng bỏ entry lỗi thay vì ném ở `k.t`.
 *
 * Nợ F1 §7.4: không có cơ chế tự động bắt lệch mirror `.js` viết tay so
 * với `.ts` — khóa bằng packages/video-spec/scripts/check-video-spec-mirror.mjs
 * (export-set parity + differential probes). Test này chạy script đó trên
 * src thật (phải exit 0) và đỏ-trước trên 2 bản sao src bị tạo lệch giả
 * (lệch hành vi bezier / thiếu export) để chứng minh script bắt được lệch.
 *
 * Nợ F1 §7.5: Zod `add_keyframe` cho phép Infinity — khóa bằng
 * mcp-server/src/tools/modifyRound51H5.test.ts (chạy qua tsc build),
 * không phải file này.
 *
 * Nợ F1 §7.6: lệch mirror TS/JS về easing lạ GIỮ NGUYÊN có chủ ý (TS trả
 * undefined → NaN, JS ném) vì đổi TS sang ném sẽ biến NaN lặng thành
 * throw giữa tick preview không guard; checker ghi nhận là KNOWN.
 *
 * Chạy (từ gốc repo): node server/render/test_round51_h5_speed_keyframe_null.js
 * Thoát 0 khi mọi kiểm tra xanh, khác 0 khi có kiểm tra đỏ.
 * Không ghi binary vào repo; thư mục tạm của checker-test được dọn sau khi chạy.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "src");
const sr = require(path.join(SRC_DIR, "speedramp.js"));
const CHECKER = path.join(
  __dirname, "..", "..", "packages", "video-spec", "scripts", "check-video-spec-mirror.mjs",
);
const SPEC_SRC = path.join(__dirname, "..", "..", "packages", "video-spec", "src");

let pass = 0;
let fail = 0;
const failedNames = [];
function check(cond, label, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failedNames.push(label);
    console.error(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`);
  }
}
function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function throwsWith(fn, re) {
  try {
    fn();
    return null;
  } catch (e) {
    return re.test(e.message) ? e.message : `sai message: ${e.message}`;
  }
}

const KF = (t, v, easing = "linear") => ({ t, v, easing });

// --- U: normalizeSpeedKeyframes ở render mirror (speedramp.js) ---
check(eq(sr.normalizeSpeedKeyframes([null]), []), "U1 normalizeSpeedKeyframes([null]) → [] (không ném)");
check(
  eq(sr.normalizeSpeedKeyframes([null, KF(2, 2), KF(0, 1)]), [KF(0, 1), KF(2, 2)]),
  "U2 [null, hợp lệ] → chỉ entry hợp lệ, đã sort",
);
check(
  eq(sr.normalizeSpeedKeyframes([undefined, "x", 42, { t: 1, v: NaN }, KF(0, 1)]), [KF(0, 1)]),
  "U3 entry lỗi đủ loại (undefined/string/number/v=NaN) đều bị loại",
);
check(
  eq(sr.normalizeSpeedKeyframes([{ t: Infinity, v: 1 }, KF(0, 1)]), [KF(0, 1)]),
  "U4 t=Infinity bị loại",
);
check(eq(sr.normalizeSpeedKeyframes(null), []), "U5 input không phải mảng (null) → []");
check(eq(sr.normalizeSpeedKeyframes(undefined), []), "U6 input không phải mảng (undefined) → []");
check(
  eq(sr.normalizeSpeedKeyframes([KF(0, 1), KF(0, 2)]), [KF(0, 2)]),
  "U7 trùng t → keyframe đứng sau thắng (ngữ nghĩa cũ giữ nguyên)",
);
{
  const orig = [KF(2, 2), KF(0, 1)];
  const out = sr.normalizeSpeedKeyframes(orig);
  check(eq(orig, [KF(2, 2), KF(0, 1)]) && out !== orig, "U8 không mutate mảng gốc");
}

// --- U: speedAt / integrateSpeed trên entry hợp lệ còn lại ---
check(
  sr.speedAt({ keyframes: [null, KF(0, 1), KF(2, 3)] }, 1) === 2,
  "U9 speedAt [null, hợp lệ] → nội suy trên entry hợp lệ (= 2)",
);
{
  const m = throwsWith(() => sr.speedAt({ keyframes: [null] }, 1), /mảng keyframes rỗng/);
  check(m !== null, "U10 speedAt [null] → ném lỗi rõ 'mảng keyframes rỗng'", m === null ? "không ném hoặc sai message" : m);
}
{
  const m = throwsWith(() => sr.integrateSpeed({ keyframes: [null] }, 0, 1), /mảng keyframes rỗng/);
  check(m !== null, "U11 integrateSpeed [null] → ném lỗi rõ 'mảng keyframes rỗng'", m === null ? "không ném hoặc sai message" : m);
}
check(
  sr.integrateSpeed({ keyframes: [null, KF(0, 1), KF(2, 3)] }, 0, 2) === 4,
  "U12 integrateSpeed [null, hợp lệ] → tích phân trên entry hợp lệ (= 4)",
);
{
  const segs = sr.planSpeedSegments({ keyframes: [null, KF(0, 1), KF(2, 2)] }, 2);
  check(
    Array.isArray(segs) && segs.length > 0 && segs.every((s) => Number.isFinite(s.speed)),
    "U13 planSpeedSegments [null, hợp lệ] → chia đoạn được, speed hữu hạn",
  );
}
{
  const m = throwsWith(
    () => sr.speedAt({ keyframes: [KF(0, 1, "bounce"), KF(2, 3)] }, 1),
    /easing không hỗ trợ/,
  );
  check(m !== null, "U14 contract cũ: easing lạ ở render vẫn ném lỗi rõ", m === null ? "không ném hoặc sai message" : m);
}

// --- M: mirror checker — xanh trên src thật, đỏ trên lệch giả ---
function runChecker(srcDir) {
  return spawnSync(
    process.execPath,
    [CHECKER, "--src-dir", srcDir],
    { encoding: "utf8", timeout: 120000 },
  );
}
{
  const r = runChecker(SPEC_SRC);
  const tail = (r.stdout || "").split("\n").filter(Boolean).pop() || "";
  check(r.status === 0, `M1 checker trên src thật → exit 0 (${tail})`, r.status === null ? `spawn lỗi: ${r.error}` : `exit ${r.status}; stderr: ${(r.stderr || "").slice(-300)}`);
}
function withMutatedSrc(mutate) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "h5-mirror-"));
  try {
    fs.cpSync(SPEC_SRC, tmp, { recursive: true });
    mutate(tmp);
    return runChecker(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
{
  // Lệch giả 1 (hành vi): đổi DEFAULT_SPEED_BEZIER trong speedcurve.js —
  // probe bezier TS-vs-.js phải lệch → checker exit != 0.
  const r = withMutatedSrc((tmp) => {
    const p = path.join(tmp, "speedcurve.js");
    const src = fs.readFileSync(p, "utf8");
    const next = src.replace(
      "DEFAULT_SPEED_BEZIER = [0.25, 0.1, 0.25, 1]",
      "DEFAULT_SPEED_BEZIER = [0.3, 0.1, 0.25, 1]",
    );
    if (next === src) throw new Error("không tìm thấy DEFAULT_SPEED_BEZIER để tạo lệch giả");
    writeFileEpermRetry(p, next);
  });
  check(
    r.status !== 0 && /FAIL/.test(r.stdout || ""),
    "M2 đỏ-trước: lệch bezier giả trong speedcurve.js → checker exit != 0 + in FAIL",
    `exit ${r.status}`,
  );
}
{
  // Lệch giả 2 (export): xóa export cubicBezierY khỏi speedcurve.js —
  // export-set parity phải lệch → checker exit != 0.
  const r = withMutatedSrc((tmp) => {
    const p = path.join(tmp, "speedcurve.js");
    const src = fs.readFileSync(p, "utf8");
    const next = src.replace("export function cubicBezierY", "function cubicBezierY");
    if (next === src) throw new Error("không tìm thấy export cubicBezierY để tạo lệch giả");
    writeFileEpermRetry(p, next);
  });
  check(
    r.status !== 0 && /FAIL/.test(r.stdout || ""),
    "M3 đỏ-trước: thiếu export cubicBezierY giả → checker exit != 0 + in FAIL",
    `exit ${r.status}`,
  );
}

console.log(`\ntest_round51_h5_speed_keyframe_null: ${pass} pass, ${fail} fail` +
  (fail > 0 ? ` — FAIL: ${failedNames.join(" | ")}` : ""));
if (fail > 0) process.exit(1);
