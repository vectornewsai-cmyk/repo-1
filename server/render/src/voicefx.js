/**
 * voicefx.js — Voice effects cho render worker (Phase 8 Q5, Node, zero-deps).
 *
 * Đổi giọng bằng filter FFmpeg thật (đã kiểm chứng trên FFmpeg 8.1.2):
 * - pitch (semitone -12..12) → TD-PSOLA tiền xử lý bằng Node (đợt 197 P1,
 *   xem psolaPitch.js — CÙNG code psola.ts với preview, core mặc định
 *   two-stage ở n = −12); buildVoiceFilters bỏ rubberband khi nhận
 *   opts.pitchDone (render.js luôn tiền xử lý trước khi dựng graph).
 *   `rubberband=tempo=1:pitch=2^(n/12)` chỉ còn là đường legacy cho caller
 *   trực tiếp không qua render.js (giữ mặc định để không phá API cũ).
 * - robot → `vibrato=f=rate:d=depth` — điều chế delay tạo âm kim loại,
 *   đo được sideband quanh tần số gốc (xem test_q5.js).
 * - telephone → `highpass=f=300,lowpass=f=3400` — chỉ giữ dải thoại.
 * - echo (giọng vang) → `aecho` 1 tap (khác reverb 3 taps của R1-076).
 *
 * Thứ tự trong chain (sau reverb, trước volume): pitch → robot →
 * telephone → echo. Đổi giọng nên đứng sau các effect âm sắc (bass/treble)
 * để cao độ đo được là cao độ cuối cùng trước volume.
 */
"use strict";

function fmtNum(v) {
  if (!Number.isFinite(v)) return "0";
  const r = Math.round(v * 1000) / 1000;
  return String(r);
}

function isFiniteNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/** true nếu có ít nhất 1 voice effect đang bật. */
function hasVoiceEffect(voice) {
  if (!voice || typeof voice !== "object") return false;
  if (Math.abs(Number(voice.pitch ?? 0)) > 1e-9) return true;
  if (voice.robot !== undefined && voice.robot !== false) return true;
  if (voice.telephone === true) return true;
  if (voice.echo !== undefined && voice.echo !== false) return true;
  return false;
}

/** Validate VoiceEffect. Trả về danh sách lỗi (rỗng = hợp lệ). */
function validateVoice(v) {
  if (v === undefined || v === null) return [];
  if (typeof v !== "object" || Array.isArray(v)) return ["voice phải là object"];
  const errs = [];
  const numIn = (obj, key, min, max, label) => {
    const val = obj[key];
    if (val === undefined) return;
    if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max)
      errs.push(`${label}.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`);
  };
  numIn(v, "pitch", -12, 12, "voice");
  if (v.robot !== undefined && v.robot !== false && v.robot !== true) {
    if (typeof v.robot !== "object" || v.robot === null || Array.isArray(v.robot)) {
      errs.push("voice.robot phải là true hoặc object { rate?, depth? }");
    } else {
      numIn(v.robot, "rate", 5, 60, "voice.robot");
      numIn(v.robot, "depth", 0, 1, "voice.robot");
    }
  }
  if (v.telephone !== undefined && typeof v.telephone !== "boolean")
    errs.push("voice.telephone phải là boolean");
  if (v.echo !== undefined && v.echo !== false && v.echo !== true) {
    if (typeof v.echo !== "object" || v.echo === null || Array.isArray(v.echo)) {
      errs.push("voice.echo phải là true hoặc object { delayMs?, decay? }");
    } else {
      numIn(v.echo, "delayMs", 50, 1000, "voice.echo");
      numIn(v.echo, "decay", 0, 1, "voice.echo");
    }
  }
  return errs;
}

/**
 * Dựng chuỗi filter FFmpeg cho VoiceEffect.
 * Trả về "" nếu không có effect nào bật, ngược lại ",rubberband=...,...".
 * opts.pitchDone = true: pitch đã được tiền xử lý bằng PSOLA (psolaPitch.js)
 * nên KHÔNG thêm rubberband — robot/telephone/echo vẫn thêm như thường.
 */
function buildVoiceFilters(voice, opts = {}) {
  if (!hasVoiceEffect(voice)) return "";
  const parts = [];
  const pitch = Number(voice.pitch ?? 0);
  if (Math.abs(pitch) > 1e-9 && !opts.pitchDone) {
    // LEGACY (caller trực tiếp không qua render.js): rubberband pitch = hệ
    // số tần số (2^(n/12)), tempo giữ 1 = không đổi tốc độ. Render worker
    // (render.js) luôn tiền xử lý PSOLA nên không đi đường này nữa.
    parts.push(`rubberband=tempo=1:pitch=${fmtNum(Math.pow(2, pitch / 12))}`);
  }
  if (voice.robot !== undefined && voice.robot !== false) {
    const rate = voice.robot === true ? 25 : Number(voice.robot.rate ?? 25);
    const depth = voice.robot === true ? 0.6 : Number(voice.robot.depth ?? 0.6);
    parts.push(`vibrato=f=${fmtNum(rate)}:d=${fmtNum(depth)}`);
  }
  if (voice.telephone === true) {
    parts.push("highpass=f=300");
    parts.push("lowpass=f=3400");
  }
  if (voice.echo !== undefined && voice.echo !== false) {
    const delayMs = voice.echo === true ? 200 : Number(voice.echo.delayMs ?? 200);
    const decay = voice.echo === true ? 0.5 : Number(voice.echo.decay ?? 0.5);
    parts.push(`aecho=in_gain=0.8:out_gain=0.9:delays=${fmtNum(delayMs)}:decays=${fmtNum(decay)}`);
  }
  return parts.length ? "," + parts.join(",") : "";
}

module.exports = { hasVoiceEffect, validateVoice, buildVoiceFilters };

// ---------------------------------------------------------------------------
// Self-test: node src/voicefx.js --self-test
// ---------------------------------------------------------------------------
if (require.main === module && process.argv.includes("--self-test")) {
  const assert = require("node:assert");
  assert.strictEqual(buildVoiceFilters(undefined), "");
  assert.strictEqual(buildVoiceFilters({}), "");
  assert.ok(buildVoiceFilters({ pitch: 12 }).includes("rubberband=tempo=1:pitch=2"),
    "pitch +12 phải ra hệ số 2");
  assert.ok(buildVoiceFilters({ pitch: -12 }).includes("pitch=0.5"), "pitch -12 phải ra 0.5");
  // Đợt 197 P1: pitchDone → không rubberband nữa (PSOLA đã tiền xử lý),
  // nhưng robot/telephone/echo vẫn còn trong chain.
  assert.ok(!buildVoiceFilters({ pitch: -12 }, { pitchDone: true }).includes("rubberband"),
    "pitchDone: không được còn rubberband");
  assert.strictEqual(buildVoiceFilters({ pitch: -12 }, { pitchDone: true }), "",
    "pitchDone + chỉ pitch → chain rỗng (pitch đã xong ở pre-process)");
  assert.ok(buildVoiceFilters({ pitch: 7, robot: true }, { pitchDone: true }).includes("vibrato=f=25:d=0.6"),
    "pitchDone: robot vẫn phải có");
  assert.ok(!buildVoiceFilters({ pitch: 7, robot: true }, { pitchDone: true }).includes("rubberband"),
    "pitchDone + robot: không rubberband");
  assert.ok(buildVoiceFilters({ robot: true }).includes("vibrato=f=25:d=0.6"));
  assert.ok(buildVoiceFilters({ telephone: true }).includes("highpass=f=300"));
  assert.ok(buildVoiceFilters({ telephone: true }).includes("lowpass=f=3400"));
  assert.ok(buildVoiceFilters({ echo: true }).includes("aecho="));
  assert.deepStrictEqual(validateVoice({ pitch: 13 }), ["voice.pitch phải là số trong [-12, 12], nhận được: 13"]);
  assert.deepStrictEqual(validateVoice({ robot: { rate: 100 } }), ["voice.robot.rate phải là số trong [5, 60], nhận được: 100"]);
  assert.deepStrictEqual(validateVoice({ pitch: 7, robot: true, telephone: true, echo: true }), []);
  console.log("voicefx.js — self-test pass");
}
