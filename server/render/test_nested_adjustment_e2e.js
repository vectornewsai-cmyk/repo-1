#!/usr/bin/env node
/**
 * test_nested_adjustment_e2e.js — Luồng U5, đợt 7 VCut (Phase 9 round 7:
 * thống nhất ngữ nghĩa nested/adjustment).
 *
 * CHUỖI KIỂM CHỨNG: UI -> spec chuẩn -> render, chạy ĐỘC LẬP với các
 * luồng khác của đợt 7: chỉ dùng entry point HIỆN CÓ (render.js CLI,
 * nested.js flattenSpecForRender, adjustment.js validate/split). Không
 * đợi entry mới của luồng khác; phần nào entry mới chưa có thì ghi vào
 * mục PENDING, không tính là pass.
 *
 * Cách đếm (đọc kỹ trước khi trích số):
 *   - PROVEN: assert trên hành vi hiện có, fail thì exit != 0.
 *   - PENDING: hành vi thuộc ngữ nghĩa thống nhất CHƯA CÓ entry/API,
 *     chỉ in ra để luồng khác khớp sau — KHÔNG tính vào pass, KHÔNG
 *     ảnh hưởng exit code. Exit 0 chỉ có nghĩa "phần đã chứng minh
 *     xanh", không có nghĩa "đã thống nhất xong".
 *
 * Nội dung (render FFmpeg thật qua `node src/render.js`, đo pixel/volume
 * thật; media sinh bằng lavfi, output chỉ trong thư mục tạm):
 *   A. Flatten + validate (đã thống nhất phía render, đợt 7 U2):
 *      A1. Layer trong subSpec được REMAP về timeline ngoài (giao cửa
 *          sổ rồi ánh xạ tuyến tính như clip), nối TRƯỚC layer cấp
 *          project; scope thu hẹp về đúng track lá của clip đó.
 *      A2. Validator: key `track` (số ít) vẫn bị từ chối; `tracks`
 *          không phải mảng chỉ số thì bị từ chối; `tracks` là mảng
 *          chỉ số hợp lệ thì ĐƯỢC chấp nhận (scope, vắng = mọi track).
 *      A3. Shape legacy của nested clip vẫn flatten được: bí danh
 *          `nested` + in/out trực tiếp (không dùng trim).
 *   B. PROVEN — layer cấp project + nested (thời gian tầng ngoài):
 *      nested 0-6s chứa leaf 0-6s, layer [2,4) brightness 60 qua render
 *      thật: t=1 giữ nguyên, t=3 đổi mạnh, t=5 giữ nguyên.
 *   C. PROVEN — thời gian layer là thời gian TIMELINE NGOÀI sau remap:
 *      nested đặt ở start=2 (leaf local 0-4 -> ngoài 2-6), layer [3,5)
 *      ngoài: t=2.5 giữ nguyên, t=4 đổi, t=5.5 giữ nguyên.
 *   D. PROVEN — layer trong subSpec áp đúng cửa sổ sau remap (render
 *      thật): sub layer [1,3) trong nested 0-6s -> t=2 đổi mạnh, t=5
 *      giữ nguyên.
 *   E. PROVEN (hồi quy tương thích) — project nested KHÔNG có layer:
 *      render OK, duration đúng, frame khớp render trực tiếp của spec
 *      phẳng tương đương (mean < 1.5).
 *   F. PROVEN — nested opacity + layer cấp project cùng áp: ngoài layer
 *      thì frame khớp bản chỉ-opacity; trong layer thì khác cả bản
 *      chỉ-opacity lẫn baseline (layer không ghi đè opacity).
 *   G. PROVEN (scope kênh) — layer video KHÔNG chạm audio: nested có
 *      video + tone audio, layer brightness cấp project: mean_volume
 *      các đoạn audio lệch < 2 dB so với baseline không layer.
 *   H. PROVEN (hồi quy cổng fail fast) — layer cắt giữa leaf trong
 *      nested mang opacity keyframes -> render thất bại, stderr nhắc
 *      adjustment (cổng của render.js, không phải của test này).
 *   I. PROVEN — layer KHÔNG scope áp mọi track (theo thiết kế: vắng
 *      scope = mọi track): 2 track nối tiếp nhau, layer [1,3) làm đổi
 *      cả 2 đoạn trong cửa sổ.
 *   J. PROVEN — layer CÓ scope `tracks` (chỉ số track trong spec phẳng)
 *      chỉ áp track trong danh sách: tracks [0] đổi v1 không đổi v2,
 *      tracks [1] đổi v2 không đổi v1 (render thật, đo pixel).
 *
 * LƯU Ý CHẠY SONG SONG: bản đầu của file này viết A1/D/I theo hành vi
 * TRƯỚC đợt 7 (subSpec layer bị bỏ lặng, scope chưa có). Trong lúc U5
 * chạy, luồng U2 đã đẩy remap + scope vào nested.js/adjustment.js/
 * render.js nên A1/D fail — đó là code đích đổi giữa chừng, không phải
 * lỗi test U5. U5 đã đọc code U2 mới và sửa A/D/J thành assert theo
 * hành vi mới đã kiểm chứng. PENDING còn lại duy nhất là đối chiếu
 * không gian chỉ số scope giữa preview (scopeTracks theo level) và
 * render (tracks theo spec phẳng) — xem LIMITS.
 *
 * Chạy: node test_nested_adjustment_e2e.js   (cần ffmpeg/ffprobe, Node >= 20)
 * Output MP4 chỉ nằm trong thư mục tạm, KHÔNG ghi binary vào repo.
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-u5-nested-adj-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0;
const pending = [];
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function pend(name, detail) {
  pending.push(name);
  console.log(`  ⏳ PENDING (chưa thống nhất, không tính là pass): ${name} — ${detail}`);
}
function ff(args, opts = {}) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], opts);
}

const { flattenSpecForRender } = require("./src/nested");
const { validateAdjustmentLayers } = require("./src/adjustment");

// ---- Media test ----
ff(["-y", "-f", "lavfi", "-i", "testsrc2=s=320x240:d=6:r=30", "-pix_fmt", "yuv420p",
  path.join(MEDIA, "src.mp4")]);
ff(["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=6:sample_rate=48000",
  path.join(MEDIA, "tone.wav")]);

const META = { name: "u5-nested-adj", width: 320, height: 240, fps: 30 };
const spec = (tracks, adjustmentLayers) => {
  const s = { version: "0.2.0", meta: { ...META }, tracks };
  if (adjustmentLayers !== undefined) s.adjustmentLayers = adjustmentLayers;
  return s;
};
const vtrack = (id, clips) => ({ id, kind: "video", clips });
const atrack = (id, clips) => ({ id, kind: "audio", clips });
const vclip = (id, start, duration, inn, out, extra = {}) =>
  ({ id, kind: "video", start, duration, in: inn, out, src: "src.mp4", ...extra });
const aclip = (id, start, duration, inn, out) =>
  ({ id, kind: "audio", start, duration, in: inn, out, src: "tone.wav" });
const nestedClip = (id, start, duration, subSpec, extra = {}) =>
  ({ kind: "nested", id, start, duration, trim: { in: 0, out: duration }, subSpec, ...extra });

function renderSpec(specObj, label) {
  const specPath = path.join(WORK, `spec-${label}.json`);
  const outPath = path.join(WORK, `out-${label}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(specObj));
  // Cố ý dùng đúng preset/CRF mặc định của render.js (medium/20) như
  // test_adjustment_render.js: ngưỡng "giữ nguyên" mean < 1.5 được đo
  // với setting này; ultrafast + crf 28 làm nhiễu sau đoạn layer lên
  // ~1.78 (đo thật ở lần chạy đầu), vượt ngưỡng một cách giả tạo.
  const r = spawnSync("node", [path.join(HERE, "src", "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
    "--encoder", "libx264",
    "-y", "-q"], { encoding: "utf8" });
  return { ok: r.status === 0, outPath, stderr: (r.stderr || "") + (r.stdout || ""), status: r.status };
}
function rawFrame(mp4, t, vf) {
  const a = ["-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", mp4,
    "-frames:v", "1"];
  if (vf) a.push("-vf", vf);
  a.push("-f", "rawvideo", "-pix_fmt", "rgb24", "-");
  return execFileSync("ffmpeg", a, { maxBuffer: 64 * 1024 * 1024 });
}
function frameMean(mp4A, mp4B, t) {
  const a = rawFrame(mp4A, t);
  const b = rawFrame(mp4B, t);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}
function durationOf(mp4) {
  return parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries",
    "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" }).trim());
}
function meanVolume(file, ss, dur) {
  const r = spawnSync("ffmpeg", ["-v", "info", "-ss", String(ss), "-t", String(dur),
    "-i", file, "-af", "volumedetect", "-vn", "-sn", "-dn", "-f", "null", "/dev/null"],
    { encoding: "utf8" });
  const m = (r.stderr || "").match(/mean_volume:\s*(-inf|[\d.-]+)/);
  if (!m) return NaN;
  return m[1] === "-inf" ? -Infinity : parseFloat(m[1]);
}
const BRIGHT = (start, duration, id = "adj") =>
  ({ id, start, duration, filters: [{ color: { brightness: 60 } }] });

// Ngưỡng đo thật (theo test_adjustment_render.js): frame ngoài layer chỉ
// lệch do nhiễu dự đoán liên frame của x264 (mean <= ~0.92); frame trong
// layer brightness 60 có mean ~77. Dùng < 1.5 cho "giữ nguyên", > 20 cho "đổi".

// ================= A. Flatten + validate hiện có =================
console.log("== A. Flatten + validate (đợt 7 U2: remap + scope) ==");
{
  const sub = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])],
    [BRIGHT(1, 2, "sub-adj")]);
  const outer = spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])],
    [BRIGHT(2, 2, "proj-adj")]);
  const f = flattenSpecForRender(outer);
  // Spec phẳng: [v1, n1__sv]; layer trong nối TRƯỚC layer ngoài; layer
  // trong không scope -> thu hẹp về đúng track lá [1]; layer ngoài
  // không scope -> không có field tracks (= mọi track).
  const layers = f.spec.adjustmentLayers || [];
  ok("A1a. flatten gộp đủ 2 layer, layer trong nối TRƯỚC layer ngoài",
    layers.length === 2 && layers[0].id === "sub-adj" && layers[1].id === "proj-adj",
    JSON.stringify(layers));
  ok("A1b. layer trong subSpec được remap thời gian + scope về track lá [1]",
    layers[0] && layers[0].start === 1 && layers[0].duration === 2 &&
    Array.isArray(layers[0].tracks) && layers[0].tracks.length === 1 &&
    layers[0].tracks[0] === 1,
    JSON.stringify(layers[0]));
  ok("A1c. layer cấp project không scope thì không có field tracks",
    layers[1] && layers[1].start === 2 && layers[1].duration === 2 &&
    !("tracks" in layers[1]),
    JSON.stringify(layers[1]));
  ok("A1d. flatten layer trong cửa sổ không kèm warning",
    f.warnings.length === 0, `warnings=${JSON.stringify(f.warnings)}`);
  // A1e: layer trong subSpec CÓ scope (tracks [0] theo level con) cũng
  // thu hẹp về đúng track lá [1], không lan sang track ngoài [0].
  const subScoped = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])],
    [{ ...BRIGHT(1, 2, "sub-scoped"), tracks: [0] }]);
  const fScoped = flattenSpecForRender(
    spec([vtrack("v1", [nestedClip("n1", 0, 6, subScoped)])]));
  const ls = (fScoped.spec.adjustmentLayers || [])[0];
  ok("A1e. layer trong subSpec CÓ scope [0] (level con) -> track lá phẳng [1] duy nhất",
    ls && ls.id === "sub-scoped" && JSON.stringify(ls.tracks) === "[1]",
    JSON.stringify(ls));
  // A1f: remap thời gian qua cửa sổ đặt lệch: nested ở start=2, layer
  // con [1,3) (thời gian sub) -> ngoài [3,5), scope track lá [1].
  const subOff = spec([vtrack("sv", [vclip("leaf", 0, 4, 0, 4)])],
    [BRIGHT(1, 2, "sub-off")]);
  const fOff = flattenSpecForRender(
    spec([vtrack("v1", [nestedClip("n1", 2, 4, subOff)])]));
  const lo = (fOff.spec.adjustmentLayers || [])[0];
  ok("A1f. layer con [1,3) qua nested ở start=2 -> ngoài [3,5), tracks [1]",
    lo && lo.start === 3 && lo.duration === 2 && JSON.stringify(lo.tracks) === "[1]",
    JSON.stringify(lo));
  // A1g: layer con nằm ngoài cửa sổ nested -> bỏ + warning (không rơi lặng).
  const subOutside = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])],
    [BRIGHT(10, 2, "sub-out")]);
  const fOut = flattenSpecForRender(
    spec([vtrack("v1", [nestedClip("n1", 0, 6, subOutside)])]));
  ok("A1g. layer con ngoài cửa sổ nested -> bỏ, có warning nêu rõ",
    !(fOut.spec.adjustmentLayers || []).some((l) => l.id === "sub-out") &&
    fOut.warnings.some((w) => /sub-out/.test(w) && /ngoài cửa sổ/.test(w)),
    `layers=${JSON.stringify(fOut.spec.adjustmentLayers)} warnings=${JSON.stringify(fOut.warnings)}`);

  const scopeTrack = validateAdjustmentLayers(
    [{ id: "x", start: 0, duration: 1, filters: [{ color: { brightness: 10 } }], track: "v1" }]);
  const scopeTracksBad = validateAdjustmentLayers(
    [{ id: "x", start: 0, duration: 1, filters: [{ color: { brightness: 10 } }], tracks: ["v1"] }]);
  const scopeTracksOk = validateAdjustmentLayers(
    [{ id: "x", start: 0, duration: 1, filters: [{ color: { brightness: 10 } }], tracks: [0] }]);
  ok("A2a. validator TỪ CHỐI key scope `track` (số ít) trên layer",
    scopeTrack.length > 0 && /track/.test(scopeTrack.join(" ")), JSON.stringify(scopeTrack));
  ok("A2b. validator TỪ CHỐI `tracks` không phải mảng chỉ số",
    scopeTracksBad.length > 0 && /tracks/.test(scopeTracksBad.join(" ")), JSON.stringify(scopeTracksBad));
  ok("A2c. validator CHẤP NHẬN `tracks` là mảng chỉ số hợp lệ (scope mới của U2)",
    scopeTracksOk.length === 0, JSON.stringify(scopeTracksOk));

  // Shape legacy: bí danh `nested` + in/out trực tiếp, không dùng trim.
  const legacySub = spec([vtrack("sv", [vclip("leaf", 0, 2, 0, 2)])]);
  const legacyOuter = spec([vtrack("v1", [
    { kind: "nested", id: "n-leg", start: 0, duration: 2, in: 0, out: 2, nested: legacySub },
  ])]);
  let legacyFlat = null, legacyErr = "";
  try { legacyFlat = flattenSpecForRender(legacyOuter); }
  catch (e) { legacyErr = e.message; }
  const leafLeg = legacyFlat &&
    legacyFlat.spec.tracks.flatMap((t) => t.clips || []).find((c) => c.id === "leaf");
  ok("A3. nested legacy (bí danh `nested` + in/out trực tiếp) flatten được",
    Boolean(leafLeg) && leafLeg.start === 0 && leafLeg.duration === 2, legacyErr);
}

// ================= B. Layer cấp project + nested =================
console.log("== B. Render: layer cấp project [2,4) + nested 0-6s ==");
{
  const sub = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])]);
  const base = renderSpec(spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])]), "b-base");
  const layered = renderSpec(
    spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])], [BRIGHT(2, 2)]), "b-layered");
  ok("B0. baseline + layered đều render exit 0", base.ok && layered.ok,
    `base=${base.status} layered=${layered.status} ${layered.stderr.slice(-200)}`);
  if (base.ok && layered.ok) {
    const m1 = frameMean(base.outPath, layered.outPath, 1);
    const m3 = frameMean(base.outPath, layered.outPath, 3);
    const m5 = frameMean(base.outPath, layered.outPath, 5);
    console.log(`    mean t=1 ${m1.toFixed(3)} t=3 ${m3.toFixed(3)} t=5 ${m5.toFixed(3)}`);
    ok("B1. t=1 ngoài layer: giữ nguyên (mean < 1.5)", m1 < 1.5, `mean=${m1.toFixed(3)}`);
    ok("B2. t=3 trong layer: đổi mạnh (mean > 20)", m3 > 20, `mean=${m3.toFixed(3)}`);
    ok("B3. t=5 ngoài layer: giữ nguyên (mean < 1.5)", m5 < 1.5, `mean=${m5.toFixed(3)}`);
    ok("B4. thời lượng layered vẫn 6s", Math.abs(durationOf(layered.outPath) - 6) < 0.2,
      `dur=${durationOf(layered.outPath)}`);
  }
}

// ================= C. Layer theo timeline ngoài sau remap =================
console.log("== C. Render: nested ở start=2, layer [3,5) theo timeline ngoài ==");
{
  const sub = spec([vtrack("sv", [vclip("leaf", 0, 4, 0, 4)])]);
  const base = renderSpec(spec([vtrack("v1", [nestedClip("n1", 2, 4, sub)])]), "c-base");
  const layered = renderSpec(
    spec([vtrack("v1", [nestedClip("n1", 2, 4, sub)])], [BRIGHT(3, 2)]), "c-layered");
  ok("C0. baseline + layered đều render exit 0", base.ok && layered.ok,
    `base=${base.status} layered=${layered.status} ${layered.stderr.slice(-200)}`);
  if (base.ok && layered.ok) {
    const m25 = frameMean(base.outPath, layered.outPath, 2.5);
    const m4 = frameMean(base.outPath, layered.outPath, 4);
    const m55 = frameMean(base.outPath, layered.outPath, 5.5);
    console.log(`    mean t=2.5 ${m25.toFixed(3)} t=4 ${m4.toFixed(3)} t=5.5 ${m55.toFixed(3)}`);
    ok("C1. t=2.5 (trước layer ngoài): giữ nguyên", m25 < 1.5, `mean=${m25.toFixed(3)}`);
    ok("C2. t=4 (trong layer ngoài, = local 2s của leaf): đổi mạnh", m4 > 20, `mean=${m4.toFixed(3)}`);
    ok("C3. t=5.5 (sau layer ngoài): giữ nguyên", m55 < 1.5, `mean=${m55.toFixed(3)}`);
  }
}

// ================= D. PROVEN: layer trong subSpec sau remap =================
console.log("== D. Render: layer trong subSpec [1,3) áp đúng cửa sổ sau remap ==");
{
  const sub = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])],
    [BRIGHT(1, 2, "sub-adj")]);
  const subBare = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])]);
  const base = renderSpec(spec([vtrack("v1", [nestedClip("n1", 0, 6, subBare)])]), "d-base");
  const withSub = renderSpec(spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])]), "d-sub");
  ok("D0. baseline + sub-layer đều render exit 0", base.ok && withSub.ok,
    `base=${base.status} withSub=${withSub.status} ${withSub.stderr.slice(-200)}`);
  if (base.ok && withSub.ok) {
    const m2 = frameMean(base.outPath, withSub.outPath, 2);
    const m5 = frameMean(base.outPath, withSub.outPath, 5);
    console.log(`    mean t=2 ${m2.toFixed(3)} t=5 ${m5.toFixed(3)}`);
    ok("D1. t=2 (trong cửa sổ layer của subSpec): đổi mạnh (mean > 20)", m2 > 20,
      `mean=${m2.toFixed(3)}`);
    ok("D2. t=5 (ngoài cửa sổ layer của subSpec): giữ nguyên (mean < 1.5)", m5 < 1.5,
      `mean=${m5.toFixed(3)}`);
  }
}

// ================= E. Hồi quy: nested không layer =================
console.log("== E. Hồi quy tương thích — nested không có layer ==");
{
  const sub = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])]);
  const nested = renderSpec(spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])]), "e-nested");
  const flat = renderSpec(spec([vtrack("v1", [vclip("leaf", 0, 6, 0, 6)])]), "e-flat");
  ok("E0. nested không layer + spec phẳng tương đương đều render exit 0",
    nested.ok && flat.ok, `nested=${nested.status} flat=${flat.status}`);
  if (nested.ok && flat.ok) {
    const m3 = frameMean(nested.outPath, flat.outPath, 3);
    console.log(`    mean t=3 nested-vs-phẳng ${m3.toFixed(3)}`);
    ok("E1. frame nested không layer khớp spec phẳng (mean < 1.5)", m3 < 1.5,
      `mean=${m3.toFixed(3)}`);
    ok("E2. thời lượng nested không layer vẫn 6s",
      Math.abs(durationOf(nested.outPath) - 6) < 0.2, `dur=${durationOf(nested.outPath)}`);
  }
}

// ================= F. Nested opacity + layer cùng áp =================
console.log("== F. Render: nested opacity 0.5 + layer cấp project [2,4) ==");
{
  const sub = spec([vtrack("sv", [vclip("leaf", 0, 6, 0, 6)])]);
  const base = renderSpec(spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])]), "f-base");
  const opOnly = renderSpec(
    spec([vtrack("v1", [nestedClip("n1", 0, 6, sub, { opacity: 0.5 })])]), "f-op");
  const both = renderSpec(
    spec([vtrack("v1", [nestedClip("n1", 0, 6, sub, { opacity: 0.5 })])],
      [BRIGHT(2, 2)]), "f-both");
  ok("F0. cả 3 bản đều render exit 0", base.ok && opOnly.ok && both.ok,
    `base=${base.status} op=${opOnly.status} both=${both.status} ${both.stderr.slice(-200)}`);
  if (base.ok && opOnly.ok && both.ok) {
    const opVsBase1 = frameMean(base.outPath, opOnly.outPath, 1);
    const bothVsOp1 = frameMean(opOnly.outPath, both.outPath, 1);
    const bothVsOp3 = frameMean(opOnly.outPath, both.outPath, 3);
    const bothVsBase3 = frameMean(base.outPath, both.outPath, 3);
    console.log(`    opacity-vs-base t=1 ${opVsBase1.toFixed(3)} | both-vs-op t=1 ${bothVsOp1.toFixed(3)} ` +
      `t=3 ${bothVsOp3.toFixed(3)} | both-vs-base t=3 ${bothVsBase3.toFixed(3)}`);
    ok("F1. opacity 0.5 tự nó đã đổi frame (đối chứng)", opVsBase1 > 10,
      `mean=${opVsBase1.toFixed(3)}`);
    ok("F2. ngoài layer: opacity+layer khớp chỉ-opacity (mean < 1.5)", bothVsOp1 < 1.5,
      `mean=${bothVsOp1.toFixed(3)}`);
    ok("F3. trong layer: opacity+layer khác chỉ-opacity (mean > 10)", bothVsOp3 > 10,
      `mean=${bothVsOp3.toFixed(3)}`);
    ok("F4. trong layer: opacity+layer khác baseline (mean > 10)", bothVsBase3 > 10,
      `mean=${bothVsBase3.toFixed(3)}`);
  }
}

// ================= G. Layer video không chạm audio =================
console.log("== G. Render: layer brightness + tone audio trong nested ==");
{
  const sub = spec([
    vtrack("sv", [vclip("leaf", 0, 6, 0, 6)]),
    atrack("sa", [aclip("tone", 0, 6, 0, 6)]),
  ]);
  const base = renderSpec(spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])]), "g-base");
  const layered = renderSpec(
    spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])], [BRIGHT(1, 4)]), "g-layered");
  ok("G0. baseline + layered đều render exit 0", base.ok && layered.ok,
    `base=${base.status} layered=${layered.status} ${layered.stderr.slice(-200)}`);
  if (base.ok && layered.ok) {
    const vb = meanVolume(base.outPath, 2, 2);
    const vl = meanVolume(layered.outPath, 2, 2);
    console.log(`    mean_volume 2-4s: baseline ${vb} dB, layered ${vl} dB`);
    ok("G1. tone trong nested vẫn có tiếng ở cả 2 bản (mean > -40 dB)",
      vb > -40 && vl > -40, `base=${vb} layered=${vl}`);
    ok("G2. layer video không đổi audio (lệch mean_volume < 2 dB)",
      Math.abs(vb - vl) < 2, `base=${vb} layered=${vl}`);
  }
}

// ================= H. Hồi quy cổng fail fast =================
console.log("== H. Hồi quy cổng fail fast — layer cắt leaf mang opacity keyframes ==");
{
  const leafKf = vclip("leaf", 0, 6, 0, 6, {
    animations: { opacity: { keyframes: [
      { t: 0, v: 1, easing: "linear" }, { t: 6, v: 1, easing: "linear" },
    ] } },
  });
  const sub = spec([vtrack("sv", [leafKf])]);
  const r = renderSpec(
    spec([vtrack("v1", [nestedClip("n1", 0, 6, sub)])], [BRIGHT(1, 2)]), "h-kf");
  ok("H1. layer cắt giữa leaf có animations -> render thất bại, stderr nhắc adjustment",
    !r.ok && /adjustment/i.test(r.stderr), `status=${r.status} tail=${r.stderr.slice(-300)}`);
}

// ================= I. Layer không scope áp mọi track (theo thiết kế) =================
console.log("== I. Render: layer KHÔNG scope áp mọi track (vắng scope = mọi track) ==");
{
  // 2 track nối tiếp nhau về thời gian (không chồng hình): v1 clip 0-2s,
  // v2 clip 2-4s. Layer [1,3) giao cả 2 clip.
  const base = renderSpec(spec([
    vtrack("v1", [vclip("a", 0, 2, 0, 2)]),
    vtrack("v2", [vclip("b", 2, 2, 2, 4)]),
  ]), "i-base");
  const layered = renderSpec(spec([
    vtrack("v1", [vclip("a", 0, 2, 0, 2)]),
    vtrack("v2", [vclip("b", 2, 2, 2, 4)]),
  ], [BRIGHT(1, 2)]), "i-layered");
  ok("I0. baseline + layered đều render exit 0", base.ok && layered.ok,
    `base=${base.status} layered=${layered.status} ${layered.stderr.slice(-200)}`);
  if (base.ok && layered.ok) {
    const m15 = frameMean(base.outPath, layered.outPath, 1.5);
    const m25 = frameMean(base.outPath, layered.outPath, 2.5);
    console.log(`    mean t=1.5 (track v1, trong layer) ${m15.toFixed(3)} t=2.5 (track v2, trong layer) ${m25.toFixed(3)}`);
    ok("I1. đoạn track v1 trong layer không scope: đổi", m15 > 20,
      `mean=${m15.toFixed(3)}`);
    ok("I2. đoạn track v2 trong layer không scope: đổi", m25 > 20,
      `mean=${m25.toFixed(3)}`);
  }
}

// ================= J. PROVEN: layer CÓ scope tracks chỉ áp track trong danh sách =================
console.log("== J. Render: layer scope tracks=[0] / [1] chỉ áp đúng track ==");
{
  const clips1 = [vclip("a", 0, 2, 0, 2)];
  const clips2 = [vclip("b", 2, 2, 2, 4)];
  const mk = (layers) => spec([
    vtrack("v1", clips1),
    vtrack("v2", clips2),
  ], layers);
  const base = renderSpec(mk(undefined), "j-base");
  const scoped0 = renderSpec(mk([{ ...BRIGHT(1, 2), tracks: [0] }]), "j-s0");
  const scoped1 = renderSpec(mk([{ ...BRIGHT(1, 2), tracks: [1] }]), "j-s1");
  ok("J0. baseline + 2 bản scope đều render exit 0",
    base.ok && scoped0.ok && scoped1.ok,
    `base=${base.status} s0=${scoped0.status} s1=${scoped1.status} ` +
    `${scoped0.stderr.slice(-200)} ${scoped1.stderr.slice(-200)}`);
  if (base.ok && scoped0.ok && scoped1.ok) {
    const s0t15 = frameMean(base.outPath, scoped0.outPath, 1.5);
    const s0t25 = frameMean(base.outPath, scoped0.outPath, 2.5);
    const s1t15 = frameMean(base.outPath, scoped1.outPath, 1.5);
    const s1t25 = frameMean(base.outPath, scoped1.outPath, 2.5);
    console.log(`    scope[0]: t=1.5 ${s0t15.toFixed(3)} t=2.5 ${s0t25.toFixed(3)} | ` +
      `scope[1]: t=1.5 ${s1t15.toFixed(3)} t=2.5 ${s1t25.toFixed(3)}`);
    ok("J1. scope [0]: đoạn v1 trong layer đổi", s0t15 > 20, `mean=${s0t15.toFixed(3)}`);
    ok("J2. scope [0]: đoạn v2 trong layer giữ nguyên", s0t25 < 1.5, `mean=${s0t25.toFixed(3)}`);
    ok("J3. scope [1]: đoạn v1 trong layer giữ nguyên", s1t15 < 1.5, `mean=${s1t15.toFixed(3)}`);
    ok("J4. scope [1]: đoạn v2 trong layer đổi", s1t25 > 20, `mean=${s1t25.toFixed(3)}`);
  }
  pend("J. PENDING đối chiếu liên phía: không gian chỉ số scope preview vs render",
    "preview scopeTracks là chỉ số theo LEVEL chứa layer, render tracks là " +
    "chỉ số theo SPEC PHẲNG cuối — hai không gian chỉ trùng nhau khi không " +
    "có nested. Cần một test liên phía (cùng project, đo cả preview-spec " +
    "lẫn render) để khẳng định scope của layer trong subSpec cho cùng một " +
    "tập track lá; U5 chỉ chứng minh được từng phía riêng lẻ");
}

console.log(`\n==========================================`);
console.log(`U5 NESTED-ADJUSTMENT E2E: ${pass} PROVEN pass, ${fail} PROVEN fail, ${pending.length} PENDING (không tính là pass)`);
console.log(`MP4 tạm: ${WORK} (không ghi vào repo)`);
console.log(`==========================================`);
process.exit(fail > 0 ? 1 : 0);
