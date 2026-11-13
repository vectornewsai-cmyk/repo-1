#!/usr/bin/env node
/**
 * test_round50_f1_keyframe_null.js — Đợt 50 luồng F1: render mirror hở với
 * keyframe null + guard panel (nợ đợt 49 E4 §7.4 + §7.5).
 *
 * Nợ E4 §7.4: `server/render/src/audiomix.js` `buildVolumeInterpExpr` ném
 * TypeError với `[null]` như preview cũ; sanitize E4 chỉ nằm ở cổng load
 * web. Đường render CLI đọc file thô: validateSpec bắt `[null]` (fail-fast
 * rõ ràng, KHÔNG crash) nhưng từ chối cả job, trong khi cùng project đó
 * web load lại mở được (đã sanitize) — lệch parity web/render. Ngoài ra
 * các builder (`normalizeKeyframes`/`buildInterpExpr`/`buildVolumeInterpExpr`)
 * vẫn ném TypeError khó hiểu (`Cannot read properties of null`) khi gọi
 * trực tiếp, và `normalizeKeyframes` ở tầng chung còn làm panel ném ngay
 * tại dòng derive `kfs` (xem test web keyframeNormalizeRound50F1).
 *
 * Hướng sửa (luồng này):
 *  1. `server/render/src/keyframeSanitize.js` mới — mirror y hệt ngữ nghĩa
 *     sanitize E4 của web (loại entry null/không phải object/t hoặc v
 *     không hữu hạn; easing lạ → linear, speed giữ bezier; field rỗng
 *     sau lọc → xóa field; đệ quy subSpec) — nối vào main() của render.js
 *     TRƯỚC flatten + validate để file thô cũng render được như web load.
 *  2. `normalizeKeyframes` (cả `server/render/src/keyframes.js` lẫn
 *     `packages/video-spec/src/keyframes.ts`) lọc entry lỗi TRƯỚC khi sort
 *     — `[null]` thành mảng rỗng, `interpolateKeyframes`/`buildInterpExpr`
 *     ném lỗi rõ "mảng keyframes rỗng" thay vì TypeError.
 *  3. `buildVolumeInterpExpr` lọc entry lỗi trước khi sort; hết entry hợp
 *     lệ → ném lỗi rõ thay vì TypeError từ comparator.
 *  4. Panel: 2 chỗ E4 nêu (~216, ~325) đã có guard `length > 0` + try/catch
 *     trên đĩa — KHÔNG sửa thêm; lỗ thật là `normalizeKeyframes` ở dòng
 *     127 (khóa bằng test web, không phải file này).
 *
 * Chạy (từ gốc repo): node server/render/test_round50_f1_keyframe_null.js
 * Thoát 0 khi mọi kiểm tra xanh, khác 0 khi có kiểm tra đỏ.
 * MP4 test nằm trong thư mục tạm, KHÔNG ghi binary vào repo.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "src");
const { normalizeKeyframes, interpolateKeyframes, buildInterpExpr } =
  require(path.join(SRC_DIR, "keyframes.js"));
const { buildVolumeInterpExpr, buildGainFilter } =
  require(path.join(SRC_DIR, "audiomix.js"));
const { sanitizeKeyframeArrays } = require(path.join(SRC_DIR, "keyframeSanitize.js"));
const { validateSpec } = require(path.join(SRC_DIR, "validate.js"));

const RENDER_JS = path.join(SRC_DIR, "render.js");
const MEDIA_DIR = path.join(__dirname, "examples", "media");

let pass = 0;
let fail = 0;
const failedNames = [];
function check(cond, label, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else {
    fail++; failedNames.push(label);
    console.error(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`);
  }
}
function throwsClear(fn, pattern, label) {
  try {
    fn();
    check(false, label, "không ném gì");
  } catch (e) {
    const msg = (e && e.message) || String(e);
    check(
      pattern.test(msg) && !/Cannot read properties of null/.test(msg),
      label, `nhận: ${msg}`
    );
  }
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ---------------------------------------------------------------------------
// U. Unit: normalize / interpolate / builder qua code render thật.
// ---------------------------------------------------------------------------
console.log("[U] normalizeKeyframes + interpolate + buildVolumeInterpExpr (code render thật)");

check(eq(normalizeKeyframes([null]), []),
  "U1 normalizeKeyframes([null]) → [] (không ném)");
check(eq(
  normalizeKeyframes([
    null,
    { t: 2, v: 10, easing: "linear" },
    { t: 0, v: 0, easing: "linear" },
    { t: NaN, v: 1, easing: "linear" },
    { t: 1, v: Infinity, easing: "linear" },
    "không phải object",
    { t: 1, v: 5, easing: "linear" },
  ]),
  [
    { t: 0, v: 0, easing: "linear" },
    { t: 1, v: 5, easing: "linear" },
    { t: 2, v: 10, easing: "linear" },
  ]),
  "U2 normalizeKeyframes lọc null/NaN/Infinity/chuỗi, giữ entry hợp lệ + sort");
check(eq(normalizeKeyframes([
  { t: 0, v: 0, easing: "linear" },
  { t: 0, v: 4, easing: "linear" },
]), [{ t: 0, v: 4, easing: "linear" }]),
  "U3 normalizeKeyframes giữ ngữ nghĩa cũ: trùng t thì sau thắng");
throwsClear(() => interpolateKeyframes([null], 0), /rỗng/,
  "U4 interpolateKeyframes([null]) ném lỗi rõ 'rỗng', không TypeError null");
check(interpolateKeyframes([
  null,
  { t: 0, v: 0, easing: "linear" },
  { t: 2, v: 10, easing: "linear" },
], 1) === 5,
  "U5 interpolateKeyframes([null, hợp lệ...]) nội suy trên entry hợp lệ (= 5)");
throwsClear(() => buildInterpExpr({ keyframes: [null] }, "t"), /rỗng/,
  "U6 buildInterpExpr({keyframes:[null]}) ném lỗi rõ 'rỗng'");
throwsClear(() => buildVolumeInterpExpr({ keyframes: [null] }), /không còn keyframe hợp lệ/,
  "U7 buildVolumeInterpExpr({keyframes:[null]}) ném lỗi rõ, không TypeError null");
check(buildVolumeInterpExpr({ keyframes: [
  null,
  { t: 0, v: 1, easing: "linear" },
  { t: 2, v: 0.5, easing: "linear" },
] }) === buildVolumeInterpExpr({ keyframes: [
  { t: 0, v: 1, easing: "linear" },
  { t: 2, v: 0.5, easing: "linear" },
] }),
  "U8 buildVolumeInterpExpr([null, hợp lệ...]) == expr chỉ entry hợp lệ");
check(typeof buildGainFilter({
  duration: 2, volume: 0.8,
  volumeKeyframes: { keyframes: [
    null,
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 0.5, easing: "linear" },
  ] },
}, 1) === "string" &&
  buildGainFilter({
    duration: 2, volume: 0.8,
    volumeKeyframes: { keyframes: [
      null,
      { t: 0, v: 1, easing: "linear" },
      { t: 2, v: 0.5, easing: "linear" },
    ] },
  }, 1).startsWith("volume='max(0,"),
  "U9 buildGainFilter với volumeKeyframes lẫn null → filter volume hợp lệ");

// ---------------------------------------------------------------------------
// S. Sanitize tầng render (mirror E4 web) qua code thật.
// ---------------------------------------------------------------------------
console.log("[S] sanitizeKeyframeArrays (tầng render, mirror E4 web)");

function baseSpec() {
  return {
    version: "0.2.0",
    meta: { name: "f1-sanitize", width: 640, height: 360, fps: 30 },
    tracks: [
      { id: "v1", kind: "video", clips: [
        { id: "c1", kind: "video", src: "clip1.mp4", start: 0, duration: 2, in: 0, out: 2 },
      ] },
      { id: "a1", kind: "audio", clips: [
        { id: "a1c1", kind: "audio", src: "music.m4a", start: 0, duration: 2, in: 0, out: 2, volume: 0.8 },
      ] },
    ],
  };
}
{
  const s = baseSpec();
  s.tracks[1].clips[0].volumeKeyframes = { keyframes: [null] };
  const fixes = sanitizeKeyframeArrays(s);
  check(s.tracks[1].clips[0].volumeKeyframes === undefined && fixes.length === 1,
    "S1 volumeKeyframes [null] → xóa field + 1 fix", JSON.stringify(fixes));
}
{
  const s = baseSpec();
  s.tracks[1].clips[0].volumeKeyframes = { keyframes: [
    null,
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 0.5, easing: "bounce" },
  ] };
  const fixes = sanitizeKeyframeArrays(s);
  check(eq(s.tracks[1].clips[0].volumeKeyframes, { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 0.5, easing: "linear" },
  ] }) && fixes.length === 1,
    "S2 volumeKeyframes [null, hợp lệ, easing lạ] → giữ 2 entry, easing lạ về linear",
    JSON.stringify(s.tracks[1].clips[0].volumeKeyframes));
}
{
  const s = baseSpec();
  s.tracks[0].clips[0].animations = {
    opacity: { keyframes: [null] },
    x: { keyframes: [{ t: 0, v: 0, easing: "linear" }] },
    scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }, null] },
  };
  const fixes = sanitizeKeyframeArrays(s);
  const anims = s.tracks[0].clips[0].animations;
  check(anims.opacity === undefined &&
    eq(anims.x, { keyframes: [{ t: 0, v: 0, easing: "linear" }] }) &&
    eq(anims.scale, { keyframes: [{ t: 0, v: 1, easing: "linear" }] }) &&
    fixes.length === 2,
    "S3 animations: opacity [null] bị xóa, x giữ, scale lọc null (2 fix)",
    JSON.stringify(anims));
}
{
  const s = baseSpec();
  s.tracks[0].clips[0].speedKeyframes = { keyframes: [null] };
  const fixes = sanitizeKeyframeArrays(s);
  check(s.tracks[0].clips[0].speedKeyframes === undefined && fixes.length === 1,
    "S4 speedKeyframes [null] → xóa field + 1 fix");
}
{
  const s = baseSpec();
  s.tracks[0].clips[0].speedKeyframes = { keyframes: [
    { t: 0, v: 1, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
    { t: 2, v: 2, easing: "bezier", bezier: [0.25, 0.1, 0.25, 1] },
  ] };
  const fixes = sanitizeKeyframeArrays(s);
  check(s.tracks[0].clips[0].speedKeyframes.keyframes.length === 2 &&
    s.tracks[0].clips[0].speedKeyframes.keyframes[0].easing === "bezier" &&
    fixes.length === 0,
    "S5 speedKeyframes bezier hợp lệ giữ nguyên, 0 fix");
}
{
  // Nested: entry null nằm trong subSpec của clip nested cũng được sanitize
  // (đệ quy) — flatten sau đó không còn gặp null ở validateNestedRamp.
  const inner = baseSpec();
  inner.tracks[1].clips[0].volumeKeyframes = { keyframes: [null] };
  inner.tracks[0].clips[0].animations = { opacity: { keyframes: [null] } };
  const s = baseSpec();
  s.tracks[0].clips[0] = {
    kind: "nested", id: "n1", start: 0, duration: 2,
    trim: { in: 0, out: 2 }, subSpec: inner,
  };
  const fixes = sanitizeKeyframeArrays(s);
  const leafV = inner.tracks[0].clips[0];
  const leafA = inner.tracks[1].clips[0];
  check(leafA.volumeKeyframes === undefined && leafV.animations.opacity === undefined &&
    fixes.length === 2 && fixes.some((f) => f.includes(".subSpec.")),
    "S6 nested subSpec: volumeKeyframes + animations.opacity [null] đều sanitize (đường dẫn .subSpec.)",
    JSON.stringify(fixes));
}
{
  const s = baseSpec();
  s.tracks[1].clips[0].volumeKeyframes = { keyframes: [
    { t: 0, v: 1, easing: "linear" },
    { t: 2, v: 0.5, easing: "ease-in" },
  ] };
  const before = JSON.stringify(s);
  const fixes = sanitizeKeyframeArrays(s);
  check(fixes.length === 0 && JSON.stringify(s) === before,
    "S7 project lành → 0 fix, spec không đổi (deep-equal)");
}
{
  // Cổng validate vẫn là gate chặn: spec CHƯA sanitize với [null] phải bị
  // từ chối (sanitize là việc của main(), không phải của validateSpec).
  const s = baseSpec();
  s.tracks[1].clips[0].volumeKeyframes = { keyframes: [null] };
  const v = validateSpec(s);
  check(v.ok === false && v.errors.some((m) => m.includes("volumeKeyframes.keyframes[0]")),
    "S8 validateSpec vẫn từ chối spec chưa sanitize có [null] (gate giữ nguyên)",
    JSON.stringify(v.errors));
}

// ---------------------------------------------------------------------------
// C. Render thật qua render.js CLI (file thô có keyframe null).
// ---------------------------------------------------------------------------
console.log("[C] render thật qua render.js CLI (spec thô mang keyframe null)");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "f1-keyframe-null-"));
function renderCli(specObj, outName) {
  const specPath = path.join(tmpDir, `${outName}.json`);
  const outPath = path.join(tmpDir, `${outName}.mp4`);
  writeFileEpermRetry(specPath, JSON.stringify(specObj), "utf8");
  const r = spawnSync(process.execPath,
    [RENDER_JS, "--spec", specPath, "--out", outPath, "--media-dir", MEDIA_DIR, "-y", "-q"],
    { encoding: "utf8", timeout: 120000 });
  return { r, outPath };
}
function probeDuration(file) {
  const p = spawnSync("ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8", timeout: 30000 });
  return p.status === 0 ? parseFloat((p.stdout || "").trim()) : NaN;
}
function checkRender(label, specObj, outName, expectOk) {
  const { r, outPath } = renderCli(specObj, outName);
  const exists = fs.existsSync(outPath);
  const size = exists ? fs.statSync(outPath).size : 0;
  const dur = exists ? probeDuration(outPath) : NaN;
  if (expectOk) {
    check(r.status === 0 && exists && size > 10000 && Math.abs(dur - 2) < 0.3,
      label, `status=${r.status} size=${size} dur=${dur} stderr=${(r.stderr || "").slice(-300)}`);
    check((r.stderr || "").includes("keyframes"),
      `${label} — stderr có cảnh báo keyframes (sanitize đã chạy)`,
      (r.stderr || "").slice(-300));
  } else {
    check(r.status !== 0,
      label, `status=${r.status} (mong != 0)`);
  }
}
{
  const s = baseSpec();
  s.tracks[1].clips[0].volumeKeyframes = { keyframes: [null] };
  checkRender("C1 render thật: audio volumeKeyframes [null] → exit 0, MP4 2s",
    s, "c1-volkf-null", true);
}
{
  const s = baseSpec();
  s.tracks[0].clips[0].animations = { x: { keyframes: [null] } };
  checkRender("C2 render thật: video animations.x [null] → exit 0, MP4 2s",
    s, "c2-anim-null", true);
}
{
  const s = baseSpec();
  s.tracks[0].clips[0].speedKeyframes = { keyframes: [null] };
  checkRender("C3 render thật: video speedKeyframes [null] → exit 0, MP4 2s",
    s, "c3-speed-null", true);
}
{
  // Nested: null nằm ở clip lá trong subSpec — sanitize chạy TRƯỚC flatten
  // nên validateNestedRamp không gặp null; flatten + render đều qua.
  const inner = baseSpec();
  inner.tracks[0].clips[0].animations = { opacity: { keyframes: [null] } };
  inner.tracks[0].clips[0].speedKeyframes = { keyframes: [null] };
  inner.tracks[1].clips[0].volumeKeyframes = { keyframes: [null] };
  const s = baseSpec();
  s.tracks = [{ id: "v-out", kind: "video", clips: [
    { kind: "nested", id: "n1", start: 0, duration: 2, trim: { in: 0, out: 2 }, subSpec: inner },
  ] }];
  checkRender("C4 render thật: nested leaf animations/speed/volume [null] → exit 0, MP4 2s",
    s, "c4-nested-null", true);
}
{
  // Đối chứng: sanitize KHÔNG che lỗi giá trị — v=5 ngoài 0..1 vẫn bị
  // validate chặn (exit != 0), không lặng lẽ render sai.
  const s = baseSpec();
  s.tracks[1].clips[0].volumeKeyframes = { keyframes: [
    { t: 0, v: 5, easing: "linear" },
  ] };
  checkRender("C5 đối chứng: volumeKeyframes v=5 (ngoài 0..1) vẫn bị từ chối",
    s, "c5-volkf-bad-v", false);
}

console.log(`\ntest_round50_f1_keyframe_null: ${pass} pass, ${fail} fail` +
  (fail > 0 ? ` — FAIL: ${failedNames.join(" | ")}` : ""));
if (fail > 0) process.exit(1);
