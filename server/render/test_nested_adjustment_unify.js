#!/usr/bin/env node
/**
 * test_nested_adjustment_unify.js — Kiểm chứng thống nhất ngữ nghĩa
 * nested/adjustment (Phase 9 đợt 7, luồng U2 — render-side).
 *
 * Chuẩn (render-side, xem src/U2_LIMITS.md):
 *   - VideoSpec.adjustmentLayers cấp project là chuẩn; field tùy chọn
 *     tracks?: number[] là chỉ số track trong spec ĐÃ FLATTEN, vắng = mọi
 *     track. Layer chỉ tách/áp clip thuộc track trong scope.
 *   - Legacy UI shape kind "adjustment" trong track.clips được normalize ở
 *     đầu render entry thành project layer với tracks=[track chứa nó].
 *   - Layer trong subSpec của nested clip được flatten thu thập (không bỏ
 *     qua lặng lẽ): offset thời gian theo cửa sổ nested, scope thu hẹp về
 *     đúng track lá, thứ tự áp: TRONG trước, NGOÀI sau.
 *   - Xung đột không xử lý được (trùng id layer, scope vượt range) → fail
 *     fast, không render sai lặng lẽ.
 *
 * Case:
 *  A. Unit normalize legacy (adjustment.js): host track, filterType →
 *     effects, filters sẵn có, bọc adjustment:{}, legacy trong subSpec
 *     (đệ quy), trùng id → throw, filterType lạ → throw.
 *  B. Unit scope (adjustment.js): validate tracks, split theo trackIndex,
 *     layersForClip theo trackIndex.
 *  C. Unit flatten thu thập layer (nested.js): offset thời gian, scope về
 *     track lá, layer có scope trong subSpec, thứ tự trong-trước-ngoài-sau
 *     (2 cấp), trùng id → throw, scope vượt range → throw, layer ngoài cửa
 *     sổ → bỏ + warning + stats.droppedLayers.
 *  D. Render thật (CLI render.js): legacy UI layer render được (t=3 đổi,
 *     t=1 giữ nguyên).
 *  E. Render thật: layer trong subSpec áp đúng vùng thời gian sau offset
 *     (nested [2,6), layer con [1,3) → vùng ngoài [3,5): t=2.5 giữ, t=4 đổi,
 *     t=5.5 giữ).
 *  F. Render thật: layer tracks=[1] chỉ áp track 1 (clip track 0 giữ nguyên,
 *     clip track 1 đổi); tracks=[0] thì ngược lại.
 *  G. Render thật: thứ tự trong-trước-ngoài-sau — nested (trong: brightness,
 *     ngoài: contrast) khớp project phẳng [brightness, contrast] từng
 *     pixel (mean < 1.5, chỉ nhiễu encoder) và KHÁC project phẳng đảo thứ
 *     tự [contrast, brightness] (mean > 5). Cặp này được chọn vì nó KHÔNG
 *     giao hoán: cả hai đều biến đổi luma Y (eq), contrast scale quanh
 *     điểm giữa nên đổi thứ tự đổi kết quả một lượng ~b*(c-1). Cặp
 *     brightness+grayscale đã thử và LOẠI: chúng giao hoán thật trong
 *     FFmpeg (eq brightness chỉ đụng luma, hue=s=0 chỉ đụng chroma) nên
 *     cả hai thứ tự cho mean = 0.000 — không chứng minh được thứ tự.
 *  H. Fail fast qua CLI: trùng id layer giữa subSpec và ngoài; layer trong
 *     subSpec có tracks vượt range.
 *
 * Chạy: node test_nested_adjustment_unify.js  (cần ffmpeg/ffprobe trên PATH)
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-u2-unify-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function eq(a, b, m) { ok(m, JSON.stringify(a) === JSON.stringify(b),
  `nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`); }
function throws(fn, re, m) {
  let msg = null;
  try { fn(); } catch (e) { msg = e.message; }
  ok(m, msg !== null && (!re || re.test(msg)), msg === null ? "không throw" : `msg=${msg}`);
}
function ff(args) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args]);
}

const adj = require("./src/adjustment");
const { flattenSpecForRender } = require("./src/nested");

const BRIGHT60 = { color: { brightness: 60 } };
const brightLayer = (id, start, duration, extra = {}) =>
  ({ id, start, duration, filters: [BRIGHT60], ...extra });
const grayLayer = (id, start, duration, extra = {}) =>
  ({ id, start, duration, filters: [{ effects: [{ type: "grayscale", intensity: 1 }] }], ...extra });

// ---- A. Unit normalize legacy ----
console.log("== A. Unit normalizeLegacyAdjustmentLayers ==");
{
  const spec = { version: "0.2.0", meta: {}, tracks: [
    { id: "v0", kind: "video", clips: [
      { kind: "video", id: "c", start: 0, duration: 4 },
      { kind: "adjustment", id: "leg", start: 1, duration: 2, filterType: "grayscale", intensity: 1 },
    ] },
    { id: "v1", kind: "video", clips: [
      { kind: "adjustment", id: "leg2", start: 0, duration: 1,
        filters: [{ color: { brightness: 20 } }] },
    ] },
  ] };
  eq(adj.normalizeLegacyAdjustmentLayers(spec), { converted: 2 }, "chuyển đổi 2 legacy clip");
  eq(spec.tracks[0].clips.map((c) => c.id), ["c"], "legacy clip đã gỡ khỏi track 0");
  eq(spec.tracks[1].clips, [], "legacy clip đã gỡ khỏi track 1");
  eq(spec.adjustmentLayers.map((l) => [l.id, l.tracks]), [["leg", [0]], ["leg2", [1]]],
    "tracks = chỉ số track chứa legacy clip");
  eq(spec.adjustmentLayers[0].filters, [{ effects: [{ type: "grayscale", intensity: 1 }] }],
    "filterType → effects entry");
  eq(spec.adjustmentLayers[1].filters, [{ color: { brightness: 20 } }], "filters sẵn có giữ nguyên");
  // Bọc adjustment:{} + đệ quy vào subSpec.
  const sub = { version: "0.2.0", meta: {}, tracks: [
    { id: "sv", kind: "video", clips: [
      { kind: "video", id: "inner", start: 0, duration: 4 },
      { kind: "video", id: "wrapped", start: 0, duration: 2,
        adjustment: { filterType: "grayscale", intensity: 0.5 } },
    ] },
  ] };
  const outer = { version: "0.2.0", meta: {}, tracks: [
    { id: "v", kind: "video", clips: [
      { kind: "video", id: "N", start: 0, duration: 4, subSpec: sub },
    ] },
  ] };
  eq(adj.normalizeLegacyAdjustmentLayers(outer).converted, 1, "legacy trong subSpec được normalize đệ quy");
  eq(sub.adjustmentLayers[0].tracks, [0], "legacy trong subSpec: tracks theo track của project con");
  eq(sub.adjustmentLayers[0].filters, [{ effects: [{ type: "grayscale", intensity: 0.5 }] }],
    "adjustment:{filterType} → effects entry");
  throws(() => adj.normalizeLegacyAdjustmentLayers({ version: "0.2.0", meta: {}, tracks: [
    { id: "v", kind: "video", clips: [
      { kind: "adjustment", id: "dup", start: 0, duration: 1, filterType: "grayscale" },
      { kind: "adjustment", id: "dup", start: 0, duration: 1, filterType: "grayscale" },
    ] },
  ] }), /trùng id/, "2 legacy trùng id → throw");
  throws(() => adj.normalizeLegacyAdjustmentLayers({ version: "0.2.0", meta: {}, tracks: [
    { id: "v", kind: "video", clips: [
      { kind: "adjustment", id: "x", start: 0, duration: 1 },
    ] },
  ] }), /không có filters lẫn filterType/, "legacy không filter → throw (không đoán)");
  throws(() => adj.normalizeLegacyAdjustmentLayers({ version: "0.2.0", meta: {}, tracks: [
    { id: "v", kind: "video", clips: [
      { kind: "adjustment", id: "x", start: 0, duration: 1, filterType: "khong-co" },
    ] },
  ] }), /không chuyển đổi được/, "filterType lạ → throw ở normalize");
}

// ---- B. Unit scope ----
console.log("== B. Unit scope tracks ==");
{
  const scoped = brightLayer("s", 0, 4, { tracks: [1] });
  const unscoped = brightLayer("u", 0, 4);
  eq(adj.adjustmentLayersForClip([scoped, unscoped], { start: 0, duration: 4 }, undefined, 0)
    .map((l) => l.id), ["u"], "track 0 chỉ nhận layer không scope");
  eq(adj.adjustmentLayersForClip([scoped, unscoped], { start: 0, duration: 4 }, undefined, 1)
    .map((l) => l.id), ["s", "u"], "track 1 nhận cả hai, giữ thứ tự");
  eq(adj.splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0 }, [scoped], 0)
    .map((s) => [s.start, s.duration, s.layers.length]), [[0, 4, 0]],
    "clip ngoài scope: 1 đoạn nguyên vẹn, không layer");
  eq(adj.splitClipByLayers({ id: "c", start: 0, duration: 4, in: 0 },
    [{ ...scoped, start: 1, duration: 2 }], 1)
    .map((s) => [s.start, s.duration, s.layers.length]), [[0, 1, 0], [1, 2, 1], [3, 1, 0]],
    "clip trong scope: tách theo biên layer");
  ok("validate: tracks rỗng → lỗi", adj.validateAdjustmentLayer({ ...scoped, tracks: [] }).length > 0);
  ok("validate: tracks trùng → lỗi", adj.validateAdjustmentLayer({ ...scoped, tracks: [1, 1] }).length > 0);
  ok("validate: tracks không nguyên → lỗi",
    adj.validateAdjustmentLayer({ ...scoped, tracks: [1.5] }).length > 0);
  eq(adj.validateAdjustmentLayer(scoped), [], "tracks [1] hợp lệ");
}

// ---- C. Unit flatten thu thập layer ----
console.log("== C. Unit flattenSpecForRender thu thập layer subSpec ==");
{
  const meta = { name: "u2", width: 320, height: 240, fps: 10 };
  const vclip = (id, src, start, duration, inn, out) =>
    ({ kind: "video", id, src, start, duration, in: inn, out });
  const spec = (tracks, extra = {}) => ({ version: "0.2.0", meta, tracks, ...extra });
  const track = (id, kind, clips) => ({ id, kind, clips });

  // C1: offset thời gian + scope về track lá.
  const sub1 = spec([track("sv", "video", [vclip("c", "src.mp4", 0, 4, 0, 4)])],
    { adjustmentLayers: [brightLayer("inner", 1, 2)] });
  const outer1 = spec([track("v", "video", [
    { kind: "video", id: "N", start: 2, duration: 4, in: 0, subSpec: sub1 },
  ])]);
  const flat1 = flattenSpecForRender(outer1);
  const leafTrackIdx = flat1.spec.tracks.findIndex((t) => t.clips.some((c) => c.id === "c"));
  eq(flat1.spec.adjustmentLayers.map((l) => [l.id, l.start, l.duration, l.tracks]),
    [["inner", 3, 2, [leafTrackIdx]]],
    "layer con [1,3) qua cửa sổ nested [2,6) → [3,5), scope = track lá");
  ok("không còn field nội bộ _scopeTrackIds",
    flat1.spec.adjustmentLayers.every((l) => !("_scopeTrackIds" in l)));

  // C2: layer có scope trong subSpec (2 track con, scope track 1).
  const sub2 = spec([
    track("a", "video", [vclip("ca", "src.mp4", 0, 4, 0, 4)]),
    track("b", "video", [vclip("cb", "src.mp4", 0, 4, 0, 4)]),
  ], { adjustmentLayers: [brightLayer("scoped", 0, 4, { tracks: [1] })] });
  const outer2 = spec([track("v", "video", [
    { kind: "video", id: "N", start: 0, duration: 4, in: 0, subSpec: sub2 },
  ])]);
  const flat2 = flattenSpecForRender(outer2);
  const bIdx = flat2.spec.tracks.findIndex((t) => t.clips.some((c) => c.id === "cb"));
  eq(flat2.spec.adjustmentLayers.map((l) => [l.id, l.tracks]), [["scoped", [bIdx]]],
    "scope [1] trong subSpec → đúng track lá chứa cb, không chạm ca");

  // C3: thứ tự trong-trước-ngoài-sau qua 2 cấp.
  const inner3 = spec([track("t", "video", [vclip("leaf", "src.mp4", 0, 4, 0, 4)])],
    { adjustmentLayers: [brightLayer("deep", 0, 4)] });
  const mid3 = spec([track("m", "video", [
    { kind: "video", id: "M", start: 0, duration: 4, in: 0, subSpec: inner3 },
  ])], { adjustmentLayers: [grayLayer("mid", 0, 4)] });
  const outer3 = spec([track("v", "video", [
    { kind: "video", id: "N", start: 0, duration: 4, in: 0, subSpec: mid3 },
  ])], { adjustmentLayers: [brightLayer("top", 0, 4)] });
  const flat3 = flattenSpecForRender(outer3);
  eq(flat3.spec.adjustmentLayers.map((l) => l.id), ["deep", "mid", "top"],
    "thứ tự áp: sâu nhất trước, ngoài cùng sau");

  // C4: layer của level cha áp cả clip phẳng lẫn lá nested trên cùng track.
  const sub4 = spec([track("sv", "video", [vclip("leaf", "src.mp4", 0, 2, 0, 2)])]);
  const outer4 = spec([track("v", "video", [
    vclip("plain", "src.mp4", 0, 2, 0, 2),
    { kind: "video", id: "N", start: 2, duration: 2, in: 0, subSpec: sub4 },
  ])], { adjustmentLayers: [brightLayer("host", 0, 4, { tracks: [0] })] });
  const flat4 = flattenSpecForRender(outer4);
  const hostLayer = flat4.spec.adjustmentLayers.find((l) => l.id === "host");
  const plainIdx = flat4.spec.tracks.findIndex((t) => t.clips.some((c) => c.id === "plain"));
  const leafIdx = flat4.spec.tracks.findIndex((t) => t.clips.some((c) => c.id === "leaf"));
  eq(hostLayer.tracks, [plainIdx, leafIdx].sort((a, b) => a - b),
    "scope lineage: layer track ngoài áp cả clip phẳng lẫn track lá của nó");

  // C5: fail fast.
  throws(() => flattenSpecForRender(spec([track("v", "video", [
    { kind: "video", id: "N", start: 0, duration: 4, in: 0, subSpec: spec(
      [track("sv", "video", [vclip("c", "src.mp4", 0, 4, 0, 4)])],
      { adjustmentLayers: [brightLayer("dup", 0, 4)] }) },
  ])], { adjustmentLayers: [brightLayer("dup", 0, 4)] })),
    /trùng id/, "trùng id layer sub/ngoài → throw");
  throws(() => flattenSpecForRender(spec([track("v", "video", [
    { kind: "video", id: "N", start: 0, duration: 4, in: 0, subSpec: spec(
      [track("sv", "video", [vclip("c", "src.mp4", 0, 4, 0, 4)])],
      { adjustmentLayers: [brightLayer("bad", 0, 4, { tracks: [5] })] }) },
  ])])),
    /vượt quá số track/, "scope subSpec vượt range → throw");

  // C6: layer ngoài cửa sổ → bỏ + warning + stats.
  const sub6 = spec([track("sv", "video", [vclip("c", "src.mp4", 0, 4, 0, 4)])],
    { adjustmentLayers: [brightLayer("outside", 0, 1)] });
  const outer6 = spec([track("v", "video", [
    { kind: "video", id: "N", start: 0, duration: 4, in: 2, subSpec: sub6 },
  ])]);
  const flat6 = flattenSpecForRender(outer6);
  eq(flat6.spec.adjustmentLayers, undefined, "layer nằm ngoài cửa sổ (in=2) → không còn layer nào");
  ok("warning nhắc layer ngoài cửa sổ",
    flat6.warnings.some((w) => w.includes("outside") && w.includes("ngoài cửa sổ")),
    flat6.warnings.join(" | "));
  eq(flat6.stats.droppedLayers, 1, "stats.droppedLayers = 1");
}

// ---- Helpers render thật ----
ff(["-y", "-f", "lavfi", "-i", "testsrc2=s=320x240:d=6:r=10", "-pix_fmt", "yuv420p",
  path.join(MEDIA, "src.mp4")]);
function vclip(id, start, duration, inPt, outPt, extra = {}) {
  return { id, kind: "video", start, duration, in: inPt, out: outPt, src: "src.mp4", ...extra };
}
function specWith(tracks, adjustmentLayers) {
  const spec = {
    version: "0.2.0",
    meta: { name: "u2-render-test", width: 320, height: 240, fps: 10 },
    tracks,
  };
  if (adjustmentLayers !== undefined) spec.adjustmentLayers = adjustmentLayers;
  return spec;
}
let n = 0;
function renderSpec(spec, label) {
  const specPath = path.join(WORK, `spec-${label}.json`);
  const outPath = path.join(WORK, `out-${label}.mp4`);
  fs.writeFileSync(specPath, JSON.stringify(spec));
  const r = spawnSync("node", [path.join(HERE, "src", "render.js"),
    "--spec", specPath, "--out", outPath, "--media-dir", MEDIA,
    "--encoder", "libx264", "-y", "-q"], { encoding: "utf8" });
  return { ok: r.status === 0, outPath, stderr: (r.stderr || "") + (r.stdout || ""), status: r.status };
}
function rawFrame(mp4, t) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-ss", String(t),
    "-i", mp4, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 64 * 1024 * 1024 });
}
function frameStats(mp4A, mp4B, t) {
  const a = rawFrame(mp4A, t);
  const b = rawFrame(mp4B, t);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return { mean: sum / a.length };
}

// ---- D. Render legacy UI layer ----
console.log("== D. Render legacy UI layer kind \"adjustment\" ==");
{
  const base = renderSpec(specWith([
    { id: "v0", kind: "video", clips: [vclip("c1", 0, 6, 0, 6)] },
  ]), "d-base");
  const legacy = renderSpec(specWith([
    { id: "v0", kind: "video", clips: [
      vclip("c1", 0, 6, 0, 6),
      { kind: "adjustment", id: "leg", start: 2, duration: 2, filterType: "grayscale", intensity: 1 },
    ] },
  ]), "d-legacy");
  ok("baseline render OK", base.ok, base.stderr.slice(-300));
  ok("legacy render OK (không bị validator từ chối)", legacy.ok, legacy.stderr.slice(-300));
  const s1 = frameStats(base.outPath, legacy.outPath, 1);
  const s3 = frameStats(base.outPath, legacy.outPath, 3);
  const s5 = frameStats(base.outPath, legacy.outPath, 5);
  console.log(`    mean t=1 ${s1.mean.toFixed(3)} t=3 ${s3.mean.toFixed(3)} t=5 ${s5.mean.toFixed(3)}`);
  ok("t=1 ngoài legacy layer: giữ nguyên (mean < 1.5)", s1.mean < 1.5, `mean=${s1.mean.toFixed(3)}`);
  ok("t=3 trong legacy layer (grayscale): đổi mạnh (mean > 10)", s3.mean > 10, `mean=${s3.mean.toFixed(3)}`);
  ok("t=5 ngoài legacy layer: giữ nguyên (mean < 1.5)", s5.mean < 1.5, `mean=${s5.mean.toFixed(3)}`);
}

// ---- E. Render layer trong subSpec, offset thời gian ----
console.log("== E. Render layer trong subSpec, offset theo cửa sổ nested ==");
{
  const subBase = { version: "0.2.0", meta: { name: "u2", width: 320, height: 240, fps: 10 },
    tracks: [{ id: "sv", kind: "video", clips: [vclip("c", 0, 4, 0, 4)] }] };
  const subLayered = { version: "0.2.0", meta: { name: "u2", width: 320, height: 240, fps: 10 },
    tracks: [{ id: "sv", kind: "video", clips: [vclip("c", 0, 4, 0, 4)] }],
    adjustmentLayers: [brightLayer("inner", 1, 2)] };
  const base = renderSpec(specWith([
    { id: "v", kind: "video", clips: [
      { kind: "video", id: "N", start: 2, duration: 4, in: 0, subSpec: subBase },
    ] },
  ]), "e-base");
  const layered = renderSpec(specWith([
    { id: "v", kind: "video", clips: [
      { kind: "video", id: "N", start: 2, duration: 4, in: 0, subSpec: subLayered },
    ] },
  ]), "e-layered");
  ok("nested baseline OK", base.ok, base.stderr.slice(-300));
  ok("nested layered OK", layered.ok, layered.stderr.slice(-300));
  const s25 = frameStats(base.outPath, layered.outPath, 2.5);
  const s4 = frameStats(base.outPath, layered.outPath, 4);
  const s55 = frameStats(base.outPath, layered.outPath, 5.5);
  console.log(`    mean t=2.5 ${s25.mean.toFixed(3)} t=4 ${s4.mean.toFixed(3)} t=5.5 ${s55.mean.toFixed(3)}`);
  ok("t=2.5 (sub 0.5, ngoài layer con): giữ nguyên", s25.mean < 1.5, `mean=${s25.mean.toFixed(3)}`);
  ok("t=4 (sub 2, trong layer con [1,3)): đổi mạnh", s4.mean > 20, `mean=${s4.mean.toFixed(3)}`);
  ok("t=5.5 (sub 3.5, ngoài layer con): giữ nguyên", s55.mean < 1.5, `mean=${s55.mean.toFixed(3)}`);
}

// ---- F. Render scope tracks ----
console.log("== F. Render layer tracks=[k] chỉ áp track k ==");
{
  // Hai track nối tiếp theo thời gian (không chồng hình): track 0 clip
  // [0,3), track 1 clip [3,6). Layer [0,6) brightness 60.
  const tracks = [
    { id: "v0", kind: "video", clips: [vclip("a", 0, 3, 0, 3)] },
    { id: "v1", kind: "video", clips: [vclip("b", 3, 3, 3, 6)] },
  ];
  const base = renderSpec(specWith(tracks), "f-base");
  const scoped1 = renderSpec(specWith(tracks, [brightLayer("s1", 0, 6, { tracks: [1] })]), "f-s1");
  const scoped0 = renderSpec(specWith(tracks, [brightLayer("s0", 0, 6, { tracks: [0] })]), "f-s0");
  ok("scope baseline OK", base.ok, base.stderr.slice(-300));
  ok("scope tracks=[1] render OK", scoped1.ok, scoped1.stderr.slice(-300));
  ok("scope tracks=[0] render OK", scoped0.ok, scoped0.stderr.slice(-300));
  const a1 = frameStats(base.outPath, scoped1.outPath, 1);
  const a4 = frameStats(base.outPath, scoped1.outPath, 4);
  const b1 = frameStats(base.outPath, scoped0.outPath, 1);
  const b4 = frameStats(base.outPath, scoped0.outPath, 4);
  console.log(`    tracks=[1]: t=1 ${a1.mean.toFixed(3)} t=4 ${a4.mean.toFixed(3)} | ` +
    `tracks=[0]: t=1 ${b1.mean.toFixed(3)} t=4 ${b4.mean.toFixed(3)}`);
  ok("tracks=[1]: t=1 (track 0) giữ nguyên", a1.mean < 1.5, `mean=${a1.mean.toFixed(3)}`);
  ok("tracks=[1]: t=4 (track 1) đổi mạnh", a4.mean > 20, `mean=${a4.mean.toFixed(3)}`);
  ok("tracks=[0]: t=1 (track 0) đổi mạnh", b1.mean > 20, `mean=${b1.mean.toFixed(3)}`);
  ok("tracks=[0]: t=4 (track 1) giữ nguyên", b4.mean < 1.5, `mean=${b4.mean.toFixed(3)}`);
}

// ---- G. Render thứ tự trong-trước-ngoài-sau ----
console.log("== G. Render thứ tự: trong (brightness) trước, ngoài (contrast) sau ==");
{
  const contrastLayer = (id, start, duration) =>
    ({ id, start, duration, filters: [{ color: { contrast: -50 } }] });
  const subG = { version: "0.2.0", meta: { name: "u2", width: 320, height: 240, fps: 10 },
    tracks: [{ id: "sv", kind: "video", clips: [vclip("c", 0, 4, 0, 4)] }],
    adjustmentLayers: [brightLayer("inner", 0, 4)] };
  const nested = renderSpec(specWith([
    { id: "v", kind: "video", clips: [
      { kind: "video", id: "N", start: 0, duration: 4, in: 0, subSpec: subG },
    ] },
  ], [contrastLayer("outer", 0, 4)]), "g-nested");
  const flatBG = renderSpec(specWith([
    { id: "v", kind: "video", clips: [vclip("c", 0, 4, 0, 4)] },
  ], [brightLayer("b", 0, 4), contrastLayer("ct", 0, 4)]), "g-flatbg");
  const flatGB = renderSpec(specWith([
    { id: "v", kind: "video", clips: [vclip("c", 0, 4, 0, 4)] },
  ], [contrastLayer("ct", 0, 4), brightLayer("b", 0, 4)]), "g-flatgb");
  ok("nested order render OK", nested.ok, nested.stderr.slice(-300));
  ok("flat [bright,contrast] render OK", flatBG.ok, flatBG.stderr.slice(-300));
  ok("flat [contrast,bright] render OK", flatGB.ok, flatGB.stderr.slice(-300));
  const mBG = frameStats(nested.outPath, flatBG.outPath, 2);
  const mGB = frameStats(nested.outPath, flatGB.outPath, 2);
  console.log(`    nested vs [bright,contrast] t=2 mean ${mBG.mean.toFixed(3)} | ` +
    `nested vs [contrast,bright] t=2 mean ${mGB.mean.toFixed(3)}`);
  ok("nested (trong bright, ngoài contrast) khớp phẳng [bright,contrast] (mean < 1.5)",
    mBG.mean < 1.5, `mean=${mBG.mean.toFixed(3)}`);
  ok("nested KHÁC phẳng đảo thứ tự [contrast,bright] (mean > 5)",
    mGB.mean > 5, `mean=${mGB.mean.toFixed(3)}`);
}

// ---- H. Fail fast qua CLI ----
console.log("== H. Fail fast qua CLI ==");
{
  const subDup = { version: "0.2.0", meta: { name: "u2", width: 320, height: 240, fps: 10 },
    tracks: [{ id: "sv", kind: "video", clips: [vclip("c", 0, 4, 0, 4)] }],
    adjustmentLayers: [brightLayer("dup", 0, 4)] };
  const r1 = renderSpec(specWith([
    { id: "v", kind: "video", clips: [
      { kind: "video", id: "N", start: 0, duration: 4, in: 0, subSpec: subDup },
    ] },
  ], [brightLayer("dup", 0, 4)]), "h-dup");
  ok("trùng id layer sub/ngoài → render thất bại, nhắc trùng id",
    !r1.ok && /trùng id/.test(r1.stderr), `status=${r1.status} tail=${r1.stderr.slice(-200)}`);
  const subBad = { version: "0.2.0", meta: { name: "u2", width: 320, height: 240, fps: 10 },
    tracks: [{ id: "sv", kind: "video", clips: [vclip("c", 0, 4, 0, 4)] }],
    adjustmentLayers: [brightLayer("bad", 0, 4, { tracks: [5] })] };
  const r2 = renderSpec(specWith([
    { id: "v", kind: "video", clips: [
      { kind: "video", id: "N", start: 0, duration: 4, in: 0, subSpec: subBad },
    ] },
  ]), "h-badrange");
  ok("layer subSpec tracks vượt range → render thất bại",
    !r2.ok, `status=${r2.status} tail=${r2.stderr.slice(-200)}`);
  // Đối chứng: layer subSpec hợp lệ (không scope) render OK — đã có ở §E;
  // legacy filterType lạ fail fast ở normalize.
  const r3 = renderSpec(specWith([
    { id: "v0", kind: "video", clips: [
      vclip("c1", 0, 4, 0, 4),
      { kind: "adjustment", id: "bad", start: 0, duration: 1, filterType: "khong-co" },
    ] },
  ]), "h-badlegacy");
  ok("legacy filterType lạ → render thất bại, nhắc legacy",
    !r3.ok && /[Ll]egacy/.test(r3.stderr), `status=${r3.status} tail=${r3.stderr.slice(-200)}`);
}

console.log(`\n==========================================\n🎉 NESTED-ADJUSTMENT UNIFY TEST (U2): ${pass} pass, ${fail} fail\n==========================================`);
process.exit(fail > 0 ? 1 : 0);
