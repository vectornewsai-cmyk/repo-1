#!/usr/bin/env node
/**
 * test_validate_codes.js — Test THẬT Phase 9 đợt 63, luồng R5: mã lỗi có
 * cấu trúc cho validator spec/media (đóng nợ đợt 62 §4 mục 5, phần server).
 *
 * Bao phủ:
 *  (a) Khóa 3 chiều: bảng phân loại server/render/src/validateCodes.js ==
 *      key `validation.*` trong fragment round63-r5 == template vi/en
 *      (placeholder khớp tên tham số, vi≠en, không rỗng).
 *  (b) Mỗi pattern: sample dựng từ template vi của fragment (thay
 *      placeholder bằng giá trị mẫu) → classifyValidationMessage trả đúng
 *      mã + đúng tham số rời (kể cả `detail` = chuỗi gốc).
 *  (c) validateSpec THẬT trên bộ spec hỏng: chuỗi errors/warnings KHÔNG
 *      ĐỔI (so với hành vi cũ — chỉ thêm errorDetails/warningDetails);
 *      mọi thông điệp do chính validate.js tạo đều phân loại được mã cụ
 *      thể; chỉ chuỗi passthrough từ sub-validator khác (mask/chroma/
 *      effects/enhance/image/track/adjustment) mới được generic
 *      VALIDATION_DETAIL — và được liệt kê rõ.
 *  (d) validateMedia THẬT: file thiếu / traversal / asset thiếu → mã đúng;
 *      lỗi "undefined" ở cảnh báo hidden (bug cũ) đã hết.
 *  (e) validationJsonLine: cắt ≤ 1200 ký tự, đếm omitted, rỗng khi không
 *      có entry; marker khớp literal ở errorDetail.js (2 literal trùng
 *      nhau có chủ đích — test này khóa chúng).
 *  (f) buildErrorDetail THẬT trên stderr worker: JSON line → validationDetails
 *      (đủ entries, params đã redact), JSON hỏng không vỡ phân loại,
 *      JSON không lọt vào details/redactedTail.
 *
 * Cách chạy: node server/render/src/test_validate_codes.js
 * (không cần ffmpeg cho (a)–(e); (d) chỉ dùng file thiếu/traversal;
 * (f) không spawn worker — đưa stderr mẫu vào buildErrorDetail).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");

const {
  VALIDATION_DETAIL_CODE,
  VALIDATION_JSON_MARKER,
  VALIDATION_PATTERNS,
  VALIDATION_CODE_LIST,
  classifyValidationMessage,
  makeValidationDetail,
  validationJsonLine,
} = require("./validateCodes");
const { validateSpec, validateMedia } = require("./validate");
const { buildErrorDetail } = require("../../bridge/src/errorDetail");

const ROOT = path.resolve(__dirname, "..", "..", "..");
let pass = 0;
let fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}${extra !== undefined ? ` (nhận: ${JSON.stringify(extra)})` : ""}`); }
}
function eq(a, b, label) { ok(JSON.stringify(a) === JSON.stringify(b), label, a); }

// ---------------------------------------------------------------- (a) khóa 3 chiều
const frag = JSON.parse(fs.readFileSync(
  path.join(ROOT, "apps/web/src/i18n/fragments/round63-r5.json"), "utf8"));
function flatten(d, prefix = "") {
  const out = new Map();
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === "string") out.set(prefix + k, v);
    else if (v && typeof v === "object") for (const [kk, vv] of flatten(v, prefix + k + ".")) out.set(kk, vv);
  }
  return out;
}
const FRAG_VI = flatten(frag.vi);
const FRAG_EN = flatten(frag.en);
const ph = (s) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

console.log("== [a] khóa 3 chiều: classifier == fragment validation.* ==");
{
  eq(VALIDATION_CODE_LIST.length, 109, "classifier có 109 mã");
  eq(new Set(VALIDATION_CODE_LIST).size, 109, "109 mã không trùng nhau");
  const fragCodes = [...FRAG_VI.keys()]
    .filter((k) => k.startsWith("validation.") && k !== "validation.detail")
    .map((k) => k.slice("validation.".length));
  eq(fragCodes.sort(), [...VALIDATION_CODE_LIST].sort(), "fragment validation.* khớp đúng 108 mã classifier");
  for (const p of VALIDATION_PATTERNS) {
    const vi = FRAG_VI.get(`validation.${p.code}`);
    const en = FRAG_EN.get(`validation.${p.code}`);
    ok(typeof vi === "string" && vi.length > 0, `${p.code}: vi không rỗng`);
    ok(typeof en === "string" && en.length > 0, `${p.code}: en không rỗng`);
    ok(vi !== en, `${p.code}: vi≠en`);
    eq(ph(vi), ph(en), `${p.code}: placeholder vi/en khớp`);
    // Template phải dùng HẾT tham số classifier, và chỉ dùng placeholder
    // trong {where} ∪ params ∪ {detail} (detail có trong mọi entry để
    // fallback — vd MEDIA_FFPROBE_FAILED dùng {detail} làm tham số rời).
    for (const name of p.params) {
      ok(ph(vi).includes(name), `${p.code}: template dùng param ${name}`);
    }
    for (const name of ph(vi)) {
      ok(name === "where" || p.params.includes(name) || name === "detail",
        `${p.code}: placeholder ${name} phải thuộc where/params/detail`);
    }
    ok(vi.startsWith("[{where}] "), `${p.code}: vi có tiền tố [{where}]`);
  }
  eq(FRAG_VI.get("validation.detail"), "[{where}] {detail}", "validation.detail vi là passthrough");
  eq(FRAG_EN.get("validation.detail"), "[{where}] {detail}", "validation.detail en là passthrough");
}

// ---------------------------------------------------------------- (b) sample từng pattern
console.log("== [b] mỗi pattern: sample từ template vi → đúng mã + params ==");
const SAMPLE = {
  where: "tracks[0].clips[0]", version: "9.9", supported: "0.1.0, 0.2.0",
  value: "9", min: "0", max: "4", field: "f", id: "x", key: "k",
  index: "5", total: "3", clipA: "c1", startA: "0", endA: "5",
  clipB: "c2", startB: "3", kind: "video", type: "xfade", end: "2",
  out: "2", clip: "c2", in: "1", transition: "2", targetFps: "60",
  projectFps: "30", other: "c2", opacity: "0.5", target: "c2",
  clipKind: "video", trackKind: "audio", duration: "3", speed: "1",
  effective: "10", animation: "typewriter", start: "0",
  consumed: "2.5", asset: "a1", file: "/tmp/x.mp4", detail: "D",
  codec: "png", frames: "1",
};
{
  for (const p of VALIDATION_PATTERNS) {
    const tpl = FRAG_VI.get(`validation.${p.code}`);
    // Bỏ tiền tố [{where}] của template — classifier chỉ nhận message body.
    const body = tpl.replace("[{where}] ", "");
    const sample = body.replace(/\{(\w+)\}/g, (_, n) => SAMPLE[n] ?? `{${n}}`);
    const got = classifyValidationMessage(sample);
    eq(got.code, p.code, `${p.code}: sample phân loại đúng mã`);
    const want = { detail: sample };
    for (const name of p.params) want[name] = SAMPLE[name];
    eq(got.params, want, `${p.code}: params rời đúng`);
  }
  // Không khớp → generic, không bịa mã.
  eq(classifyValidationMessage("chuỗi lạ không theo mẫu nào"), {
    code: VALIDATION_DETAIL_CODE,
    params: { detail: "chuỗi lạ không theo mẫu nào" },
  }, "chuỗi lạ → VALIDATION_DETAIL");
  eq(classifyValidationMessage(""), {
    code: VALIDATION_DETAIL_CODE, params: { detail: "" },
  }, "chuỗi rỗng → VALIDATION_DETAIL");
  // makeValidationDetail giữ where nguyên vẹn.
  eq(makeValidationDetail("meta.width", "phải là số nguyên dương, nhận được: 0"), {
    where: "meta.width", code: "POSITIVE_INTEGER",
    params: { detail: "phải là số nguyên dương, nhận được: 0", value: "0" },
  }, "makeValidationDetail: where + code + params");
}

// ---------------------------------------------------------------- (c) validateSpec thật
console.log("== [c] validateSpec thật: chuỗi cũ không đổi, mã cụ thể ==");
{
  const base = () => ({ version: "0.2.0", meta: { name: "t", width: 640, height: 360, fps: 30 }, tracks: [] });
  const specs = [];
  let s = base(); s.meta.width = 0; specs.push(s);
  s = base(); s.meta.width = 641; specs.push(s);
  s = base(); s.meta.fps = 0; specs.push(s);
  s = base(); s.meta.name = ""; specs.push(s);
  s = base(); delete s.meta; specs.push(s);
  s = base(); s.version = "9.9"; specs.push(s);
  s = base(); s.plugins = [{ id: "Bad_ID" }, { path: "x.txt" }, { id: "a", path: "b.js" }, {}, { config: [] }]; specs.push(s);
  s = base(); s.tracks = []; specs.push(s);
  s = base(); s.tracks = [{ kind: "video", clips: [] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "nope", clips: [] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "audio", hidden: true, clips: [] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: -1, duration: 0, src: "", in: -1, out: 0, speed: 99, reverse: "x" }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [
    { id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 3, speedKeyframes: { keyframes: [] } },
    { id: "c2", kind: "video", start: 3, duration: 5, src: "b.mp4", in: 0, out: 3, reverse: true, speedKeyframes: { keyframes: [{ t: 0, v: 5, easing: "bezier", bezier: [2, 0, 0, 0] }] } },
  ] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [
    { id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 10 },
    { id: "c2", kind: "video", start: 4, duration: 5, src: "b.mp4", in: 0, out: 10 },
  ] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, transitionOut: { type: "nope", duration: -1 } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "audio", clips: [{ id: "c1", kind: "audio", start: 0, duration: 2, src: "a.wav", in: 0, out: 10, volume: 2, fadeIn: 9, fadeInCurve: "bounce", volumeKeyframes: { keyframes: [{ t: 99, v: 2, easing: "zzz" }] } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "text", clips: [{ id: "c1", kind: "text", start: 0, duration: 2, text: 123, style: { fontFamily: "", fontSize: 0, color: "red", backgroundColor: "x", highlightColor: "y", bold: "z", x: 2, animation: "spin" }, karaoke: [{ word: "", start: 0, end: 0 }], captionOf: { clipId: 1 } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, enhance: {}, motion: {}, sourceAudioMode: "detach", mask: {}, track: {} }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "image", clips: [{ id: "c1", kind: "image", start: 0, duration: 2, src: "", mask: {} }] }]; specs.push(s);

  // Thêm: transition pair, opacity/SR + transition, kind mismatch,
  // out/in, speed+ramp, duration-vs-nguồn, keyframes hình dạng, text
  // parity/karaoke, chroma/stabilize/mask/track, plugins/adjustment.
  s = base(); s.plugins = {}; specs.push(s);
  s = base(); s.plugins = ["x"]; specs.push(s);
  s = base(); s.plugins = [{ id: 1 }, { id: "dup" }, { id: "dup" }]; specs.push(s);
  s = base(); s.adjustmentLayers = {}; specs.push(s);
  s = base(); s.adjustmentLayers = [{ id: "l1", start: 0, duration: 1, filters: [], tracks: [9] }, { id: "l1", start: 0, duration: 1, filters: [] }]; specs.push(s);
  s = base(); s.tracks = "x"; specs.push(s);
  s = base(); s.tracks = [null]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: "x" }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [null] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{}] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [] }, { id: "t", kind: "video", clips: [] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "audio", start: 0, duration: 1, src: "a.wav", in: 0, out: 1 }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 0 }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 10, speed: 2, speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 3 }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, transitionIn: "x" }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, transitionIn: { type: "xfade", duration: 5 } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [
    { id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 10, transitionOut: { type: "xfade", duration: 1 } },
    { id: "c2", kind: "video", start: 5, duration: 5, src: "b.mp4", in: 0, out: 10 },
  ] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [
    { id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 10, transitionOut: { type: "xfade", duration: 1 } },
    { id: "c2", kind: "video", start: 6, duration: 5, src: "b.mp4", in: 0, out: 10 },
  ] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [
    { id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 10, opacity: 0.5, transitionOut: { type: "xfade", duration: 1 }, animations: { opacity: { keyframes: [{ t: 0, v: 0.5, easing: "linear" }] }, scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } } },
    { id: "c2", kind: "video", start: 5, duration: 5, src: "b.mp4", in: 0, out: 10 },
  ] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, transitionIn: { type: "xfade", duration: 1 } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, enhance: { stabilize: true }, speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, chromaKey: {}, transitionOut: { type: "xfade", duration: 1 } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "text", clips: [{ id: "c1", kind: "text", start: 0, duration: 2, text: "x", style: { fontFamily: "A", fontSize: 12, color: "#fff", animation: "parity-1" }, animations: { scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } }, karaoke: [{ word: "a", start: 0, end: 1 }] }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "text", clips: [{ id: "c1", kind: "text", start: 0, duration: 2, text: "x", style: { fontFamily: "A", fontSize: 12, color: "#fff" }, animations: { scale: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } }, karaoke: [{ word: "a", start: 0, end: 1 }] }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "text", clips: [{ id: "c1", kind: "text", start: 0, duration: 2, text: "x", style: { fontFamily: "A", fontSize: 12, color: "#fff" }, karaoke: "x" }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "text", clips: [{ id: "c1", kind: "text", start: 0, duration: 2, text: "x", style: { fontFamily: "A", fontSize: 12, color: "#fff" }, karaoke: [{ word: "a", start: 0, end: 5 }] }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "text", clips: [{ id: "c1", kind: "text", start: 0, duration: 2, text: "x", style: { fontFamily: "A", fontSize: 12, color: "#fff" }, karaoke: [{ word: "a", start: 0, end: 1 }, { word: "b", start: 0.5, end: 1.5 }] }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, mask: {}, track: { points: [] } }] }]; specs.push(s);
  // Phase 9 đợt 88 P6: image + track + mask hợp lệ → warn mới TRACK_IMAGE_MASK
  // (không còn "track sẽ bị bỏ qua"); video + track + transitionOut → warn
  // TRACK_TRANSITION (khóa regex đã đồng bộ lại với câu warn closing đợt 87).
  const IMG_MASK = { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 };
  const TRK = { points: [{ t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 }] };
  s = base(); s.tracks = [{ id: "t", kind: "image", clips: [{ id: "c1", kind: "image", start: 0, duration: 2, src: "a.png", mask: IMG_MASK, track: TRK }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [
    { id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 10, transitionOut: { type: "xfade", duration: 1 }, track: TRK },
    { id: "c2", kind: "video", start: 5, duration: 5, src: "b.mp4", in: 0, out: 10 },
  ] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "audio", clips: [{ id: "c1", kind: "audio", start: 0, duration: 2, src: "a.wav", in: 0, out: 10, volumeKeyframes: "x" }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "audio", clips: [{ id: "c1", kind: "audio", start: 0, duration: 2, src: "a.wav", in: 0, out: 10, speedKeyframes: "x" }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "audio", clips: [{ id: "c1", kind: "audio", start: 0, duration: 2, src: "a.wav", in: 0, out: 10, volumeKeyframes: { keyframes: Array.from({ length: 129 }, (_, i) => ({ t: 0, v: 1, easing: "linear" })) } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "audio", clips: [{ id: "c1", kind: "audio", start: 0, duration: 2, src: "a.wav", in: 0, out: 10, volumeKeyframes: { keyframes: ["x"] } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "audio", clips: [{ id: "c1", kind: "audio", start: 0, duration: 2, src: "a.wav", in: 0, out: 10, speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "zzz" }] } }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "text", clips: [{ id: "c1", kind: "text", start: 0, duration: 2, text: "x" }] }]; specs.push(s);
  s = base(); s.tracks = [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 2, src: "a.mp4", in: 0, out: 10, enhance: {}, motion: { interpolation: "minterpolate", targetFps: 60 }, transitionOut: { type: "xfade", duration: 1 } }, { id: "c2", kind: "video", start: 2, duration: 2, src: "b.mp4", in: 0, out: 10 }] }]; specs.push(s);

  const hitCodes = new Set();
  const genericDetails = [];
  let nErr = 0; let nWarn = 0;
  for (const sp of specs) {
    const v = validateSpec(sp);
    eq(v.errors.length, v.errorDetails.length, "số errorDetails == số errors");
    eq(v.warnings.length, v.warningDetails.length, "số warningDetails == số warnings");
    for (let i = 0; i < v.errors.length; i++) {
      nErr++;
      const d = v.errorDetails[i];
      ok(v.errors[i] === `[${d.where}] ${d.params.detail}`, "error string cũ = [where] detail");
      ok(typeof d.code === "string" && d.code.length > 0, "error có code");
      hitCodes.add(d.code);
      if (d.code === VALIDATION_DETAIL_CODE) genericDetails.push(d.params.detail);
    }
    for (let i = 0; i < v.warnings.length; i++) {
      nWarn++;
      const d = v.warningDetails[i];
      ok(v.warnings[i] === `[${d.where}] ${d.params.detail}`, "warning string cũ = [where] detail");
      hitCodes.add(d.code);
      if (d.code === VALIDATION_DETAIL_CODE) genericDetails.push(d.params.detail);
    }
  }
  ok(nErr > 40, `bộ spec hỏng tạo ${nErr} lỗi`, nErr);
  ok(nWarn >= 1, `bộ spec hỏng tạo ${nWarn} cảnh báo`, nWarn);
  ok(hitCodes.size >= 70, `phân loại cụ thể ${hitCodes.size} mã khác nhau qua spec thật`, [...hitCodes].sort());
  // Phase 9 đợt 88 P6: 2 mã mới/khóa lại phải xuất hiện qua spec thật.
  ok(hitCodes.has("TRACK_IMAGE_MASK"), "image+track+mask phân loại TRACK_IMAGE_MASK", [...hitCodes].sort());
  ok(hitCodes.has("TRACK_TRANSITION"), "video+track+transition phân loại TRACK_TRANSITION", [...hitCodes].sort());
  // Câu warn image+track+mask đúng từng chữ, không còn "track sẽ bị bỏ qua".
  {
    const im = base();
    im.tracks = [{ id: "t", kind: "image", clips: [{ id: "c1", kind: "image", start: 0, duration: 2, src: "a.png", mask: { shape: "ellipse", x: 0.5, y: 0.5, w: 0.4, h: 0.5, feather: 0 }, track: { points: [{ t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 }] } }] }];
    const vIm = validateSpec(im);
    ok(vIm.warnings.some((w) => w.includes("track không dịch chuyển clip image (ảnh giữ vị trí tĩnh), nhưng mask vẫn bám theo track (xem D3_LIMITS.md)")), "image+track+mask: câu warn mới đúng chữ", vIm.warnings);
    ok(vIm.warningDetails.some((d) => d.code === "TRACK_IMAGE_MASK"), "image+track+mask: mã TRACK_IMAGE_MASK", vIm.warningDetails);
    ok(!vIm.warnings.some((w) => w.includes("track sẽ bị bỏ qua")), "image+track+mask: không còn câu 'track sẽ bị bỏ qua'", vIm.warnings);
    // Image có track nhưng KHÔNG mask: giữ warn cũ TRACK_UNSUPPORTED_KIND.
    const im2 = base();
    im2.tracks = [{ id: "t", kind: "image", clips: [{ id: "c1", kind: "image", start: 0, duration: 2, src: "a.png", track: { points: [{ t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 }] } }] }];
    const vIm2 = validateSpec(im2);
    ok(vIm2.warningDetails.some((d) => d.code === "TRACK_UNSUPPORTED_KIND" && d.params.kind === "image"), "image+track không mask: vẫn TRACK_UNSUPPORTED_KIND", vIm2.warningDetails);
    // Video + track + transition: câu warn closing đợt 87 phân loại đúng mã
    // (trước khi đồng bộ regex thì rơi về VALIDATION_DETAIL).
    const tr = base();
    tr.tracks = [{ id: "t", kind: "video", clips: [
      { id: "c1", kind: "video", start: 0, duration: 5, src: "a.mp4", in: 0, out: 10, transitionOut: { type: "xfade", duration: 1 }, track: { points: [{ t: 0, x: 0.3, y: 0.5 }, { t: 2, x: 0.7, y: 0.5 }] } },
      { id: "c2", kind: "video", start: 5, duration: 5, src: "b.mp4", in: 0, out: 10 },
    ] }];
    const vTr = validateSpec(tr);
    ok(vTr.warningDetails.some((d) => d.code === "TRACK_TRANSITION"), "video+track+transition: mã TRACK_TRANSITION", vTr.warningDetails);
    ok(vTr.warnings.some((w) => w.includes("mask vẫn bám theo track")), "video+track+transition: câu warn nhắc mask vẫn bám", vTr.warnings);
  }
  // Generic CHỈ được phép từ passthrough sub-validator (không phải chuỗi
  // do chính validate.js tạo): mask/chroma/effects/enhance/image/track/
  // adjustment — liệt kê rõ từng chuỗi.
  const GENERIC_OK = [/^mask\./, /^chromaKey\./, /^effects /, /^enhance\./,
    /^motion\./, /^track: /, /^image "[^"]+": /, /^adjustment layer\./];
  for (const g of genericDetails) {
    ok(GENERIC_OK.some((re) => re.test(g)), `generic chỉ từ sub-validator: ${g.slice(0, 80)}`, g);
  }
  // Bug warn() 1 tham số (đợt 63 R5 sửa): warning hidden không còn "undefined".
  const hv = validateSpec(base());
  hv.tracks = [{ id: "a", kind: "audio", hidden: true, clips: [{ id: "c", kind: "audio", start: 0, duration: 1, src: "a.wav", in: 0, out: 1 }] }];
  const hv2 = validateSpec(hv);
  ok(!hv2.warnings.some((w) => w.includes("undefined")), "warning hidden không còn đuôi 'undefined'");
  ok(hv2.warningDetails.some((d) => d.code === "TRACK_HIDDEN_AUDIO"), "warning hidden có mã TRACK_HIDDEN_AUDIO");
  // Spec không phải object: early-return vẫn có errorDetails.
  const notObj = validateSpec("nope");
  eq(notObj.errors, ["spec phải là một object JSON"], "spec không object: chuỗi cũ");
  eq(notObj.errorDetails, [{ where: "spec", code: "SPEC_NOT_OBJECT", params: { detail: "spec phải là một object JSON" } }], "spec không object: errorDetails");
}

// ---------------------------------------------------------------- (d) validateMedia thật
console.log("== [d] validateMedia thật: file thiếu / traversal / asset ==");
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r63r5-media-"));
  const mediaDir = path.join(tmp, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  const mkSpec = (src) => ({
    version: "0.2.0",
    meta: { name: "t", width: 640, height: 360, fps: 30 },
    tracks: [{ id: "t", kind: "video", clips: [{ id: "c1", kind: "video", start: 0, duration: 1, src, in: 0, out: 1 }] }],
  });
  const missing = validateMedia(mkSpec("khong-co.mp4"), mediaDir, "ffprobe", null);
  ok(!missing.ok, "file thiếu → validateMedia fail");
  ok(missing.errorDetails.some((d) => d.code === "MEDIA_FILE_NOT_FOUND" && d.params.file.endsWith("khong-co.mp4")), "file thiếu → MEDIA_FILE_NOT_FOUND + tên file", missing.errorDetails);
  const trav = validateMedia(mkSpec("../o.mp4"), mediaDir, "ffprobe", null);
  ok(trav.errorDetails.some((d) => d.code === "MEDIA_PATH_TRAVERSAL"), "traversal → MEDIA_PATH_TRAVERSAL", trav.errorDetails);
  const asset = validateMedia(mkSpec("asset:khong-co"), mediaDir, "ffprobe", null);
  ok(asset.errorDetails.some((d) => d.code === "MEDIA_ASSET_NOT_FOUND" && d.params.asset === "khong-co"), "asset thiếu → MEDIA_ASSET_NOT_FOUND", asset.errorDetails);
  const assetBad = validateMedia(mkSpec("asset:"), mediaDir, "ffprobe", null);
  ok(assetBad.errorDetails.some((d) => d.code === "MEDIA_ASSET_INVALID"), "asset rỗng → MEDIA_ASSET_INVALID", assetBad.errorDetails);
  // Chuỗi cũ không đổi: errors[i] == [where] detail.
  for (let i = 0; i < missing.errors.length; i++) {
    ok(missing.errors[i] === `[${missing.errorDetails[i].where}] ${missing.errorDetails[i].params.detail}`, "media: chuỗi cũ = [where] detail");
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (e) validationJsonLine + marker
// [d2] validateMedia thật với media do ffmpeg/ffprobe tạo — bao phủ các
// mã MEDIA còn lại (MEDIA_NO_VIDEO, MEDIA_STILL_AS_VIDEO,
// MEDIA_OUT_EXCEEDS, MEDIA_NO_AUDIO_INHERIT, MEDIA_NO_VIDEO_IMAGE,
// MEDIA_NOT_STILL, MEDIA_NO_AUDIO, MEDIA_NOT_FILE, MEDIA_FFPROBE_FAILED).
console.log("\n== [d2] validateMedia thật với media ffmpeg ==");
{
  const { execFileSync } = require("child_process");
  const ffmpeg = (() => { try { execFileSync("which", ["ffmpeg"]); return true; } catch { return false; } })();
  if (!ffmpeg) {
    console.log("  (bỏ qua: không có ffmpeg trên máy này)");
  } else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-vc-media-"));
    try {
      execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=duration=1:size=64x36:rate=30", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", path.join(tmp, "av.mp4")]);
      execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=duration=1:size=64x36:rate=30", "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(tmp, "v.mp4")]);
      execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=red:size=64x36:duration=0.1", "-frames:v", "1", path.join(tmp, "still.png")]);
      execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", path.join(tmp, "audio.wav")]);
      writeFileEpermRetry(path.join(tmp, "empty.mp4"), "");
      fs.mkdirSync(path.join(tmp, "adir"));
      const specFor = (kind, src, extraClip = {}) => ({
        version: "0.2.0",
        meta: { name: "t", width: 64, height: 36, fps: 30 },
        tracks: [{ id: "t", kind, clips: [{ id: "c1", kind, start: 0, duration: 1, src, in: 0, out: 1, ...extraClip }] }],
      });
      const codesOf = (res) => res.errorDetails.map((d) => d.code);
      // video có audio trong track video: OK.
      let res = validateMedia(specFor("video", "av.mp4"), tmp, "ffprobe", new Map());
      eq(res.ok, true, "media: video có audio OK");
      // video không audio, inherit: MEDIA_NO_AUDIO_INHERIT.
      res = validateMedia(specFor("video", "v.mp4"), tmp, "ffprobe", new Map());
      // Đây là WARNING (không phải error): nằm ở warningDetails.
      ok(res.warningDetails.map((d) => d.code).includes("MEDIA_NO_AUDIO_INHERIT"), "media: video không audio → MEDIA_NO_AUDIO_INHERIT (warning)");
      // audio trong track video: MEDIA_NO_VIDEO.
      res = validateMedia(specFor("video", "audio.wav"), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_NO_VIDEO"), "media: audio trong track video → MEDIA_NO_VIDEO");
      // ảnh tĩnh trong track video: MEDIA_STILL_AS_VIDEO.
      res = validateMedia(specFor("video", "still.png"), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_STILL_AS_VIDEO"), "media: ảnh tĩnh trong track video → MEDIA_STILL_AS_VIDEO");
      // out vượt thời lượng: MEDIA_OUT_EXCEEDS.
      res = validateMedia(specFor("video", "av.mp4", { duration: 1, out: 9 }), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_OUT_EXCEEDS"), "media: out vượt → MEDIA_OUT_EXCEEDS");
      // video trong track image: MEDIA_NOT_STILL.
      res = validateMedia(specFor("image", "av.mp4"), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_NOT_STILL"), "media: video trong track image → MEDIA_NOT_STILL");
      // audio trong track image: MEDIA_NO_VIDEO_IMAGE.
      res = validateMedia(specFor("image", "audio.wav"), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_NO_VIDEO_IMAGE"), "media: audio trong track image → MEDIA_NO_VIDEO_IMAGE");
      // video trong track audio: MEDIA_NO_AUDIO.
      res = validateMedia(specFor("audio", "v.mp4"), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_NO_AUDIO"), "media: video không audio trong track audio → MEDIA_NO_AUDIO");
      // file rỗng: ffprobe lỗi → MEDIA_FFPROBE_FAILED.
      res = validateMedia(specFor("video", "empty.mp4"), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_FFPROBE_FAILED"), "media: file rỗng → MEDIA_FFPROBE_FAILED");
      // thư mục làm src: MEDIA_NOT_FILE.
      res = validateMedia(specFor("video", "adir"), tmp, "ffprobe", new Map());
      ok(codesOf(res).includes("MEDIA_NOT_FILE"), "media: thư mục làm src → MEDIA_NOT_FILE");
      // chuỗi cũ vẫn khớp [where] detail trên mọi entry thật.
      for (const d of res.errorDetails) {
        ok(res.errors.some((e) => e === `[${d.where}] ${d.params.detail}`),
          "media: chuỗi cũ = [where] detail");
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
}

console.log("== [e] validationJsonLine: cắt ≤1200 ký tự, marker khớp errorDetail.js ==");
{
  eq(validationJsonLine([], []), "", "không entry → chuỗi rỗng");
  const many = Array.from({ length: 30 }, (_, i) => ({
    where: `tracks[${i}]`, code: "POSITIVE_INTEGER",
    params: { detail: `phải là số nguyên dương, nhận được: ${i}`, value: String(i) },
  }));
  const line = validationJsonLine(many, []);
  ok(line.startsWith(VALIDATION_JSON_MARKER), "dòng bắt đầu bằng marker");
  ok(line.length <= 1200, `dòng ≤1200 ký tự (nhận ${line.length})`, line.length);
  const parsed = JSON.parse(line.slice(VALIDATION_JSON_MARKER.length));
  ok(parsed.errors.length < 30 && parsed.omitted === 30 - parsed.errors.length,
    `cắt entries, omitted đếm đủ (${parsed.errors.length} giữ, ${parsed.omitted} lược)`, parsed);
  // Marker ở đây PHẢI khớp literal ở errorDetail.js (2 literal trùng nhau
  // có chủ đích — test này khóa chúng).
  const edSrc = fs.readFileSync(path.join(ROOT, "server/bridge/src/errorDetail.js"), "utf8");
  const m = edSrc.match(/const VALIDATION_JSON_MARKER = "([^"]+)";/);
  ok(m !== null, "errorDetail.js có khai VALIDATION_JSON_MARKER");
  eq(m && m[1], VALIDATION_JSON_MARKER, "marker validateCodes.js == marker errorDetail.js");
}

// ---------------------------------------------------------------- (f) buildErrorDetail round-trip
console.log("== [f] buildErrorDetail: JSON line → validationDetails ==");
{
  const stderr = [
    "⚠️  [tracks[0]] hidden không có tác dụng với track audio (chỉ mute mới tắt tiếng)",
    "",
    "❌ Spec không hợp lệ (2 lỗi):",
    "  1. [meta.width] phải là số chẵn (yêu cầu của H.264), nhận được: 641",
    "  2. [tracks] tổng thời lượng project phải > 0",
    validationJsonLine([
      { where: "meta.width", code: "EVEN_INTEGER", params: { detail: "phải là số chẵn (yêu cầu của H.264), nhận được: 641", value: "641" } },
      { where: "tracks", code: "TOTAL_DURATION_ZERO", params: { detail: "tổng thời lượng project phải > 0" } },
    ], [
      { where: "tracks[0]", code: "TRACK_HIDDEN_AUDIO", params: { detail: "hidden không có tác dụng với track audio (chỉ mute mới tắt tiếng)" } },
    ]),
    "",
  ].join("\n");
  const d = buildErrorDetail({ stderr, exitCode: 1 });
  eq(d.code, "SPEC_VALIDATION", "stderr worker → SPEC_VALIDATION");
  eq(d.summaryKey, "specValidation", "summaryKey specValidation");
  eq(d.validationDetailsOmitted, 0, "omitted 0");
  eq(d.validationDetails, [
    { where: "meta.width", code: "EVEN_INTEGER", params: { detail: "phải là số chẵn (yêu cầu của H.264), nhận được: 641", value: "641" } },
    { where: "tracks", code: "TOTAL_DURATION_ZERO", params: { detail: "tổng thời lượng project phải > 0" } },
    { where: "tracks[0]", code: "TRACK_HIDDEN_AUDIO", params: { detail: "hidden không có tác dụng với track audio (chỉ mute mới tắt tiếng)" } },
  ], "validationDetails đủ 3 entries (errors + warnings)");
  ok(!d.redactedTail.includes("VCUT_VALIDATION_JSON"), "redactedTail không lọt JSON");
  ok(!d.details.some((x) => x.includes("VCUT_VALIDATION_JSON")), "details không lọt JSON");
  // JSON hỏng → phân loại cũ vẫn chạy, không vỡ.
  const d2 = buildErrorDetail({ stderr: "❌ Spec không hợp lệ (1 lỗi):\n  1. [x] không tìm thấy file: /home/secret/a.mp4\nVCUT_VALIDATION_JSON {oops\n", exitCode: 1 });
  eq(d2.code, "MISSING_ASSET", "JSON hỏng: phân loại cũ vẫn chạy");
  eq(d2.validationDetails, [], "JSON hỏng: validationDetails rỗng");
  ok(!d2.redactedTail.includes("VCUT_VALIDATION_JSON"), "JSON hỏng: tail không lọt JSON");
  // Params chứa đường dẫn tuyệt đối → redact thành <path>/basename.
  const d3 = buildErrorDetail({ stderr: `VCUT_VALIDATION_JSON {"errors":[{"where":"clip","code":"MEDIA_FILE_NOT_FOUND","params":{"detail":"không tìm thấy file: /home/tranhai/projects/secret/clip.mp4","file":"/home/tranhai/projects/secret/clip.mp4"}}],"warnings":[],"omitted":0}\n`, exitCode: 1 });
  eq(d3.validationDetails[0].params.file, "<path>/clip.mp4", "param file redact thành basename");
  ok(!JSON.stringify(d3.validationDetails).includes("/home/tranhai"), "không lọt home dir vào validationDetails");
  // Không có JSON → field vẫn có (rỗng) để consumer mới không phải check undefined.
  const d4 = buildErrorDetail({ stderr: "lỗi lạ\n", exitCode: 1 });
  eq(d4.validationDetails, [], "không JSON → validationDetails []");
  eq(d4.validationDetailsOmitted, 0, "không JSON → omitted 0");
}

console.log(`\nvalidateCodes round 63 R5: ${pass} pass, ${fail} fail`);
process.exitCode = fail > 0 ? 1 : 0;
