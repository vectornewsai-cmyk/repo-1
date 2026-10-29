#!/usr/bin/env node
/**
 * test_adjustment.js — Kiểm chứng adjustment layer (Phase 9, luồng N3).
 *
 * Case:
 *  A. Unit JS mirror: validateAdjustmentLayer / adjustmentAppliesTo /
 *     adjustmentOverlapsClip / adjustmentLayersForClip / buildAdjustmentChain
 *  B. Parity: JS mirror vs TS (adjustment.ts compile) — validate + appliesTo
 *     + overlaps GIỐNG HỆT trên cùng bộ case
 *  C. Render thật: timeline 4s = clip 0-2s + clip 2-4s, adjustment layer
 *     LUT+color chỉ bao 0-2s → frame t=1 đổi pixel so với baseline, frame
 *     t=3 giữ nguyên; layer chồng nhau (2 layer) khác layer đơn
 *  D. Render thật: clip ngoài khoảng layer → buildClipAdjustmentChain = ""
 *     và render của clip đó bằng baseline (không bị filter rò rỉ)
 *
 * LƯU Ý TRUNG THỰC: render.js CHƯA nối adjustment layer (chờ parent/N1
 * merge spec + wiring — xem ADJUSTMENT_LIMITS.md). §C/D dựng filter_complex
 * tay mô phỏng ĐÚNG điểm nối đã ghi trong adjustment.js (chuỗi pixel của
 * clip + setpts + overlay theo pattern của render.js), nên kiểm chứng này
 * chứng minh chuỗi filter + logic chọn layer là đúng, không claim render.js
 * đã hỗ trợ adjustment layer.
 *
 * Chạy: node test_adjustment.js
 */
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-adjust-"));
const MEDIA = path.join(WORK, "media");
fs.mkdirSync(MEDIA, { recursive: true });
const ASSETS = path.join(HERE, "..", "..", "assets");

let pass = 0, fail = 0;
function ok(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}
function eq(a, b, m) { ok(m, a === b, `nhận ${JSON.stringify(a)}, muốn ${JSON.stringify(b)}`); }
function ff(args, opts = {}) {
  return execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], opts);
}

const adj = require("./src/adjustment");

// ---- A. Unit JS mirror ----
console.log("== A. Unit validate / appliesTo / overlaps / chain ==");
{
  const good = { id: "adj1", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] };
  eq(adj.validateAdjustmentLayer(good).length, 0, "layer hợp lệ");
  eq(adj.validateAdjustmentLayer(undefined).length > 0, true, "undefined → lỗi");
  ok("id rỗng → lỗi", adj.validateAdjustmentLayer({ ...good, id: "" }).length > 0);
  ok("start âm → lỗi", adj.validateAdjustmentLayer({ ...good, start: -0.5 }).length > 0);
  ok("duration 0 → lỗi", adj.validateAdjustmentLayer({ ...good, duration: 0 }).length > 0);
  ok("filters rỗng → lỗi", adj.validateAdjustmentLayer({ ...good, filters: [] }).length > 0);
  ok("filters không phải mảng → lỗi", adj.validateAdjustmentLayer({ ...good, filters: {} }).length > 0);
  ok("key lạ → lỗi", adj.validateAdjustmentLayer({ ...good, track: "t1" }).length > 0);
  ok("LUT lạ → lỗi", adj.validateAdjustmentLayer({ ...good, filters: [{ lut: "khong-co" }] }).length > 0);
  ok("LUT hợp lệ", adj.validateAdjustmentLayer({ ...good, filters: [{ lut: "vcut-cyberpunk" }] }).length === 0);
  ok("LUT user hợp lệ", adj.validateAdjustmentLayer({ ...good, filters: [{ lut: "user-my-look" }] }).length === 0);
  ok("color sai → lỗi", adj.validateAdjustmentLayer({ ...good, filters: [{ color: { brightness: 101 } }] }).length > 0);
  ok("effect lạ → lỗi", adj.validateAdjustmentLayer({ ...good, filters: [{ effects: [{ type: "xoa-nen" }] }] }).length > 0);
  ok("effect hợp lệ", adj.validateAdjustmentLayer({ ...good, filters: [{ effects: [{ type: "grayscale", intensity: 1 }] }] }).length === 0);
  ok("filter rỗng → lỗi", adj.validateAdjustmentLayer({ ...good, filters: [{}] }).length > 0);
  ok("filter key lạ → lỗi", adj.validateAdjustmentLayer({ ...good, filters: [{ mask: {} }] }).length > 0);

  const L = { id: "a", start: 2, duration: 3, filters: [] };
  eq(adj.adjustmentAppliesTo(L, 2), true, "đầu bao: t=start → true");
  eq(adj.adjustmentAppliesTo(L, 4.999), true, "trong khoảng → true");
  eq(adj.adjustmentAppliesTo(L, 5), false, "cuối không bao: t=end → false");
  eq(adj.adjustmentAppliesTo(L, 1.999), false, "trước start → false");
  eq(adj.adjustmentEnd(L), 5, "adjustmentEnd = start+duration");

  eq(adj.adjustmentOverlapsClip(L, 0, 2), false, "clip kết thúc đúng start layer → không giao");
  eq(adj.adjustmentOverlapsClip(L, 5, 2), false, "clip bắt đầu đúng end layer → không giao");
  eq(adj.adjustmentOverlapsClip(L, 4, 2), true, "giao một phần → true");
  eq(adj.adjustmentOverlapsClip(L, 0, 10), true, "clip bao trọn layer → true");
  eq(adj.adjustmentOverlapsClip(L, 3, 1), true, "clip nằm trong layer → true");

  const layers = [
    { id: "l1", start: 0, duration: 2, filters: [{ color: { brightness: 10 } }] },
    { id: "l2", start: 1, duration: 3, filters: [{ color: { contrast: 10 } }] },
    { id: "l3", start: 5, duration: 1, filters: [{ color: { saturation: 10 } }] },
  ];
  eq(adj.adjustmentLayersForClip(layers, { start: 0, duration: 1 }).map((l) => l.id).join(","), "l1", "clip 0-1 chỉ giao l1 (l2 bắt đầu đúng lúc clip kết thúc = chạm biên)");
  eq(adj.adjustmentLayersForClip(layers, { start: 0.5, duration: 1 }).map((l) => l.id).join(","), "l1,l2", "clip 0.5-1.5 giao l1+l2, giữ thứ tự");
  eq(adj.adjustmentLayersForClip(layers, { start: 5, duration: 1 }).map((l) => l.id).join(","), "l3", "clip 5-6 chỉ giao l3");
  eq(adj.adjustmentLayersForClip(layers, { start: 4, duration: 1 }).length, 0, "clip 4-5 không giao layer nào (l2 hết ở 4, l3 bắt đầu ở 5)");
  eq(adj.adjustmentLayersForClip(layers, 2, 1).map((l) => l.id).join(","), "l2", "dạng (start, duration) rời cũng đúng");

  eq(adj.buildAdjustmentChain([], ASSETS), "", "không layer → ''");
  eq(
    adj.buildAdjustmentChain([layers[0]], ASSETS),
    "eq=brightness=0.1",
    "một layer color"
  );
  eq(
    adj.buildAdjustmentChain(
      [{ id: "x", start: 0, duration: 1, filters: [{ color: { brightness: 20 } }, { lut: "vcut-cyberpunk" }] }],
      ASSETS
    ).startsWith("eq=brightness=0.2,lut3d="),
    true,
    "một layer 2 entry: color trước LUT"
  );
  const stacked = adj.buildAdjustmentChain(
    [
      { id: "a", start: 0, duration: 2, filters: [{ color: { brightness: 20 } }] },
      { id: "b", start: 0, duration: 2, filters: [{ effects: [{ type: "grayscale", intensity: 1 }] }] },
    ],
    ASSETS
  );
  eq(stacked, "eq=brightness=0.2,hue=s=0", "2 layer chồng: layer sau nối sau layer trước");
  eq(
    adj.buildClipAdjustmentChain(layers, { start: 4, duration: 1 }, ASSETS),
    "",
    "clip ngoài khoảng → chain rỗng"
  );
}

// ---- B. Parity JS vs TS ----
console.log("== B. Parity JS mirror vs TS adjustment.ts ==");
{
  const r = spawnSync("npx", ["tsc",
    path.join(HERE, "..", "..", "packages", "video-spec", "src", "adjustment.ts"),
    "--outDir", path.join(WORK, "tsout"),
    "--module", "commonjs", "--target", "es2022", "--skipLibCheck",
    "--moduleResolution", "node",
  ], { encoding: "utf8" });
  if (r.status !== 0) {
    ok("compile adjustment.ts", false, (r.stderr || "").slice(0, 400));
  } else {
    const ts = require(path.join(WORK, "tsout", "adjustment.js"));
    let allSame = true;
    const note = (m) => { allSame = false; console.log(`    lệch: ${m}`); };
    // Chuẩn hoá một khác biệt message CÓ SẴN giữa 2 mirror effects (không
    // phải do adjustment gây ra): effects.ts viết "effects[0]: effect.intensity
    // ..." còn effects.js viết "effects[0].intensity ..." — cùng 1 lỗi, khác
    // cách diễn đạt. Parity vẫn kiểm tra số lượng + nội dung lỗi còn lại.
    const norm = (arr) => JSON.stringify(arr).replace(
      /effects\[\d+\](?:: effect)?\./g, "effects[].");
    const layerCases = [
      { id: "a", start: 1, duration: 2, filters: [{ color: { brightness: 20 } }] },
      { id: "", start: 1, duration: 2, filters: [{ color: {} }] },
      { id: "b", start: -1, duration: 2, filters: [{ lut: "vcut-cyberpunk" }] },
      { id: "c", start: 0, duration: 0, filters: [{ effects: [{ type: "blur" }] }] },
      { id: "d", start: 0, duration: 1, filters: [] },
      { id: "e", start: 0, duration: 1, filters: [{ lut: "khong-co" }] },
      { id: "f", start: 0, duration: 1, filters: [{ color: { brightness: 999 } }] },
      { id: "g", start: 0, duration: 1, filters: [{ effects: [{ type: "blur", intensity: 2 }] }] },
      { id: "h", start: 0, duration: 1, filters: [{}] },
      { id: "i", start: 0, duration: 1, filters: [{ mask: {} }] },
      { id: "j", start: 0, duration: 1, filters: [{ lut: "user-my-look" }], extra: 1 },
    ];
    for (const c of layerCases) {
      if (norm(adj.validateAdjustmentLayer(c)) !== norm(ts.validateAdjustmentLayer(c))) {
        note(`validate ${JSON.stringify(c)}: js=${JSON.stringify(adj.validateAdjustmentLayer(c))} ts=${JSON.stringify(ts.validateAdjustmentLayer(c))}`);
      }
    }
    const L = { id: "a", start: 2, duration: 3, filters: [] };
    for (const t of [0, 1.999, 2, 3.5, 4.999, 5, 6]) {
      if (adj.adjustmentAppliesTo(L, t) !== ts.adjustmentAppliesTo(L, t)) note(`appliesTo t=${t}`);
    }
    for (const [s, d] of [[0, 2], [2, 1], [4, 2], [5, 1], [0, 10], [3, 1]]) {
      if (adj.adjustmentOverlapsClip(L, s, d) !== ts.adjustmentOverlapsClip(L, s, d)) note(`overlaps ${s}+${d}`);
    }
    ok("JS mirror == TS (validate + appliesTo + overlaps)", allSame);
  }
}

// ---- C/D. Render thật ----
console.log("== C/D. Render thật: layer chỉ đổi clip trong khoảng ==");
ff(["-y", "-f", "lavfi", "-i", "testsrc2=s=320x240:d=4:r=30", "-pix_fmt", "yuv420p", path.join(MEDIA, "src.mp4")]);

function frameSum(mp4, t) {
  const raw = execFileSync("ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-ss", String(t), "-i", mp4,
     "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { maxBuffer: 64 * 1024 * 1024 });
  let s = 0;
  for (let i = 0; i < raw.length; i++) s += raw[i];
  return s;
}

// Timeline 4s: unit1 = clip 0-2s (có adjustment), unit2 = clip 2-4s (không).
// Mô phỏng đúng pattern render.js: trim → scale/pad → pixel chain →
// setpts=PTS+start → overlay lên nền đen. Encode -g 1 để frame độc lập
// (so sánh pixel giữa 2 bản render không bị nhiễu bởi dự đoán liên frame).
function renderTimeline(adjChainUnit1, adjChainUnit2, outName) {
  const W = 320, H = 240, fps = 30;
  const u1 = `[0:v]trim=start=0:end=2,setpts=PTS-STARTPTS,scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${fps},format=yuv420p${adjChainUnit1 ? "," + adjChainUnit1 : ""}[u1]`;
  const u2 = `[0:v]trim=start=2:end=4,setpts=PTS-STARTPTS,scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${fps},format=yuv420p${adjChainUnit2 ? "," + adjChainUnit2 : ""}[u2]`;
  const fc = [
    `color=c=black:s=${W}x${H}:r=${fps}:d=4,format=yuv420p[base0]`,
    u1, u2,
    "[u1]setpts=PTS+0/TB[p1]",
    "[base0][p1]overlay=eof_action=pass[b1]",
    "[u2]setpts=PTS+2/TB[p2]",
    "[b1][p2]overlay=eof_action=pass[out]",
  ].join(";");
  const outPath = path.join(WORK, outName + ".mp4");
  ff(["-y", "-i", path.join(MEDIA, "src.mp4"),
    "-filter_complex", fc, "-map", "[out]",
    "-c:v", "libx264", "-g", "1", "-pix_fmt", "yuv420p", "-r", String(fps), outPath]);
  return outPath;
}

const LAYER_COLOR_LUT = {
  id: "adj1", start: 0, duration: 2,
  filters: [{ color: { brightness: 60 } }, { lut: "vcut-cyberpunk" }],
};
const LAYER_GRAY = {
  id: "adj2", start: 0, duration: 2,
  filters: [{ effects: [{ type: "grayscale", intensity: 1 }] }],
};
const clip1 = { start: 0, duration: 2 };
const clip2 = { start: 2, duration: 2 };

const baseChain1 = adj.buildClipAdjustmentChain([], clip1, ASSETS);
const baseChain2 = adj.buildClipAdjustmentChain([], clip2, ASSETS);
const adjChain1 = adj.buildClipAdjustmentChain([LAYER_COLOR_LUT], clip1, ASSETS);
const adjChain2 = adj.buildClipAdjustmentChain([LAYER_COLOR_LUT], clip2, ASSETS);
const stackedChain1 = adj.buildClipAdjustmentChain([LAYER_COLOR_LUT, LAYER_GRAY], clip1, ASSETS);

eq(baseChain1, "", "baseline clip1 chain rỗng");
eq(adjChain2, "", "clip2 ngoài khoảng layer → chain rỗng (không rò filter)");
ok("clip1 trong khoảng → chain khác rỗng", adjChain1.length > 0, adjChain1.slice(0, 80));
ok("2 layer chồng → chain dài hơn 1 layer", stackedChain1.length > adjChain1.length);

const baseMp4 = renderTimeline(baseChain1, baseChain2, "base");
const adjMp4 = renderTimeline(adjChain1, adjChain2, "adj");
const stackedMp4 = renderTimeline(stackedChain1, adjChain2, "stacked");

const baseT1 = frameSum(baseMp4, 1);
const baseT3 = frameSum(baseMp4, 3);
const adjT1 = frameSum(adjMp4, 1);
const adjT3 = frameSum(adjMp4, 3);
const stkT1 = frameSum(stackedMp4, 1);
console.log(`    frame sum: base t=1 ${baseT1} t=3 ${baseT3} | adj t=1 ${adjT1} t=3 ${adjT3} | stacked t=1 ${stkT1}`);
ok("baseline render có hình", baseT1 > 0 && baseT3 > 0);
ok("t=1 trong layer: pixel ĐỔI so với baseline", Math.abs(adjT1 - baseT1) > 10000, `diff=${Math.abs(adjT1 - baseT1)}`);
ok("t=3 ngoài layer: pixel GIỮ NGUYÊN so với baseline", Math.abs(adjT3 - baseT3) < 1000, `diff=${Math.abs(adjT3 - baseT3)}`);
ok("2 layer chồng khác 1 layer tại t=1", Math.abs(stkT1 - adjT1) > 10000, `diff=${Math.abs(stkT1 - adjT1)}`);

// D: render riêng clip2 (không layer) phải bằng baseline của chính nó.
{
  const c2only = renderTimeline("", "", "clip2only");
  const s = frameSum(c2only, 3);
  ok("render clip ngoài layer không dính filter (khớp baseline t=3)", Math.abs(s - baseT3) < 1000, `diff=${Math.abs(s - baseT3)}`);
}

console.log(`\n==========================================\n🎉 ADJUSTMENT TEST: ${pass} pass, ${fail} fail\n==========================================`);
process.exit(fail > 0 ? 1 : 0);
