#!/usr/bin/env node
/**
 * test_nested_render.js — Test thật cho nested sequence render (Phase 9 N2).
 *
 * Chạy: node src/test_nested_render.js  (từ server/render/ hoặc bất kỳ đâu)
 * Thoát 0 khi tất cả pass, 1 khi có fail. Không cần tham số, tự tạo media
 * test bằng FFmpeg (testsrc2 + color) trong thư mục tạm rồi dọn dẹp.
 *
 * Bao gồm:
 *  A. Unit flatten (require nested.js, không chạy render worker):
 *     1. làm phẳng 2 cấp đúng offset thời gian (cấp trong rồi cấp ngoài);
 *     2. cắt trái clip media (in' tính theo speed gốc);
 *     3. speed ngoài nhân vào speed clip (duration/out đúng);
 *     4. spec phẳng cũ làm phẳng ra chính nó (deep-equal — hồi quy);
 *     5. vòng lặp subSpec → throw; 6. vượt quá độ sâu → throw;
 *     7. transition bị cửa sổ phá vỡ → strip + warning (không fail);
 *     8. clip audio: fadeOut rút ngắn theo phần bị cắt phải.
 *  B. Render thật bằng FFmpeg qua render.js CLI:
 *     9. project có clip lồng nhau 2 cấp → MP4 tồn tại, 320x240,
 *        duration ≈ 6.5s (2.5 + 2 + 2: xem tính toán trong code);
 *    10. project phẳng tương đương viết tay → MP4 cùng duration; dry-run
 *        của spec phẳng thành công và không chứa xử lý nested.
 * Không test: transition qua biên clip lồng nhau, ducking vào project con,
 * mask/effect toàn sequence (xem NESTED_RENDER_LIMITS.md — chưa hỗ trợ).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SRC_DIR = __dirname;
const { flattenSpecForRender, hasNestedClips } = require("./nested");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "repo1-nst-"));
const MEDIA = path.join(TMP, "media");
fs.mkdirSync(MEDIA, { recursive: true });

let failures = 0;
let checks = 0;
function check(name, cond, extra = "") {
  checks += 1;
  if (cond) console.log(`  PASS ${name}`);
  else { failures += 1; console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`); }
}
function eq(a, b, eps = 1e-6) { return Math.abs(a - b) <= eps; }
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", ...opts });
}
function throws(fn, re) {
  try { fn(); return false; }
  catch (e) { return !re || re.test(e.message); }
}

const meta = { name: "nested-test", width: 320, height: 240, fps: 10 };
const vclip = (id, src, start, duration, inn, out, extra = {}) =>
  ({ kind: "video", id, src, start, duration, in: inn, out, ...extra });
const track = (id, kind, clips, extra = {}) => ({ id, kind, clips, ...extra });
const spec = (tracks) => ({ version: "0.2.0", meta, tracks });

// --- Media test: testsrc2 6s + color xanh 6s, 320x240, 10fps -----------------
console.log(`[media] tmp=${TMP}`);
for (const [file, lavfi] of [
  ["a.mp4", "testsrc2=size=320x240:rate=10:duration=6"],
  ["b.mp4", "color=c=blue:size=320x240:rate=10:duration=6"],
]) {
  const r = run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", lavfi,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(MEDIA, file)]);
  if (r.status !== 0) {
    console.log(`  FAIL tạo media ${file}: ${r.stderr}`);
    failures += 1;
  }
}

// --- A1. Làm phẳng 2 cấp -----------------------------------------------------
// Project con trong (S2): c1 [0,2) a.mp4, c2 [2,4) b.mp4.
// Project giữa (S1): n1 lồng S2 tại start=1, duration=4, in=0
//   → trong S1: c1 [1,3), c2 [3,5).
// Project ngoài: N lồng S1 tại start=2, duration=5, in=0.5, speed=1
//   → cửa sổ con [0.5, 5.5): c1 [1,3) nguyên → ngoài [2.5, 4.5);
//      c2 [3,5) nguyên → ngoài [4.5, 6.5). Tổng project ngoài dài 6.5s.
console.log("[A] unit flatten");
const inner = spec([track("in-v", "video", [
  vclip("c1", "a.mp4", 0, 2, 0, 2),
  vclip("c2", "b.mp4", 2, 2, 0, 2),
])]);
const mid = spec([track("mid-v", "video", [
  { kind: "video", id: "n1", start: 1, duration: 4, in: 0, subSpec: inner },
])]);
const outer = spec([track("out-v", "video", [
  { kind: "video", id: "N", start: 2, duration: 5, in: 0.5, subSpec: mid },
])]);
check("hasNestedClips(outer) = true", hasNestedClips(outer) === true);
check("hasNestedClips(flat) = false",
  hasNestedClips(spec([track("v", "video", [vclip("x", "a.mp4", 0, 1, 0, 1)])])) === false);
const flat1 = flattenSpecForRender(outer);
const flatTracks = flat1.spec.tracks;
check("A1 track ngoài giữ lại đầu tiên", flatTracks[0].id === "out-v" &&
  flatTracks[0].clips.length === 0);
const expTrack = flatTracks.find((t) => t.clips.some((c) => c.id === "c1"));
check("A1 có track mở rộng chứa c1/c2", Boolean(expTrack) &&
  expTrack.clips.length === 2);
if (expTrack) {
  const [f1, f2] = expTrack.clips;
  check("A1 c1 start=2.5 duration=2", eq(f1.start, 2.5) && eq(f1.duration, 2),
    `start=${f1.start} duration=${f1.duration}`);
  check("A1 c1 in/out giữ nguyên", f1.in === 0 && f1.out === 2);
  check("A1 c2 start=4.5 duration=2", eq(f2.start, 4.5) && eq(f2.duration, 2),
    `start=${f2.start} duration=${f2.duration}`);
  check("A1 track mở rộng tên N__n1__in-v", expTrack.id === "N__n1__in-v",
    `id=${expTrack.id}`);
}
check("A1 stats: 2 clip lồng nhau, 2 clip phẳng cuối, 1 track mới cuối",
  flat1.stats.nestedClips === 2 && flat1.stats.outputClips === 2 &&
  flat1.stats.newTracks === 1,
  JSON.stringify(flat1.stats));
// Input không bị sửa (flatten clone sâu).
check("A1 spec gốc không bị sửa",
  outer.tracks[0].clips[0].subSpec !== undefined &&
  JSON.stringify(outer.tracks[0].clips).includes('"id":"N"'));

// --- A2. Cắt trái clip media -------------------------------------------------
// Clip con [0,2), in=0, out=4, speed=2; cửa sổ [1,2) → phần thấy [1,2):
// start'=0, duration'=1, in'=0+1*2=2, out'=2+1*2=4.
const leftTrim = flattenSpecForRender(spec([track("v", "video", [
  { kind: "video", id: "N", start: 0, duration: 1, in: 1,
    subSpec: spec([track("sv", "video", [vclip("m", "a.mp4", 0, 2, 0, 4, { speed: 2 })])]) },
])]));
const lt = leftTrim.spec.tracks.find((t) => t.clips.length > 0).clips[0];
check("A2 cắt trái: start=0 duration=1 in=2 out=4 speed=2",
  eq(lt.start, 0) && eq(lt.duration, 1) && lt.in === 2 && lt.out === 4 && lt.speed === 2,
  JSON.stringify(lt));

// --- A3. Speed ngoài ----------------------------------------------------------
// Clip con [0,4) in=0 out=4; clip lồng nhau speed=2 duration=2
// → cửa sổ [0,4), start'=S, duration'=2, speed'=2, out'=4.
const spd = flattenSpecForRender(spec([track("v", "video", [
  { kind: "video", id: "N", start: 3, duration: 2, in: 0, speed: 2,
    subSpec: spec([track("sv", "video", [vclip("m", "a.mp4", 0, 4, 0, 4)])]) },
])]));
const sp = spd.spec.tracks.find((t) => t.clips.length > 0).clips[0];
check("A3 speed ngoài: start=3 duration=2 speed=2 out=4",
  eq(sp.start, 3) && eq(sp.duration, 2) && sp.speed === 2 && sp.out === 4,
  JSON.stringify(sp));

// --- A4. Spec phẳng làm phẳng ra chính nó ------------------------------------
const flatSpec = spec([track("v", "video", [
  vclip("c1", "a.mp4", 0, 2, 0, 2),
  vclip("c2", "b.mp4", 2, 2, 0, 2),
])]);
const flatAgain = flattenSpecForRender(flatSpec);
check("A4 spec phẳng → deep-equal chính nó",
  JSON.stringify(flatAgain.spec) === JSON.stringify(flatSpec));
check("A4 spec phẳng không warning, không track mới",
  flatAgain.warnings.length === 0 && flatAgain.stats.newTracks === 0);

// --- A5/A6. Vòng lặp + quá sâu -----------------------------------------------
const cyclic = spec([track("v", "video", [
  { kind: "video", id: "N", start: 0, duration: 1, in: 0 },
])]);
cyclic.tracks[0].clips[0].subSpec = cyclic; // object tự trỏ chính nó
check("A5 vòng lặp subSpec → throw", throws(() => flattenSpecForRender(cyclic), /vòng lặp/));
let deep = spec([track("v", "video", [vclip("leaf", "a.mp4", 0, 1, 0, 1)])]);
for (let i = 0; i < 10; i++) {
  deep = spec([track("v", "video", [
    { kind: "video", id: `L${i}`, start: 0, duration: 1, in: 0, subSpec: deep },
  ])]);
}
check("A6 chuỗi 11 cấp → throw quá sâu",
  throws(() => flattenSpecForRender(deep), /độ sâu/));

// --- A7. Transition bị phá vỡ → strip + warning ------------------------------
const trans = flattenSpecForRender(spec([track("v", "video", [
  { kind: "video", id: "N", start: 0, duration: 3, in: 0,
    subSpec: spec([track("sv", "video", [
      { ...vclip("t1", "a.mp4", 0, 2, 0, 2), transitionOut: { type: "fade", duration: 0.5 } },
      { ...vclip("t2", "b.mp4", 2, 2, 0, 2), transitionIn: { type: "fade", duration: 0.5 } },
    ])]) },
])]));
const tclips = trans.spec.tracks.find((t) => t.clips.length > 0).clips;
check("A7 transition vỡ: clip còn lại bị strip transition",
  tclips.length === 2 && tclips[0].transitionOut === undefined &&
  tclips[1].transitionIn === undefined, JSON.stringify(tclips));
check("A7 có warning transition", trans.warnings.some((w) => /transition/.test(w)),
  trans.warnings.join(" | "));

// --- A8. Audio fade rút ngắn --------------------------------------------------
const aud = flattenSpecForRender(spec([track("v", "video", [
  { kind: "video", id: "N", start: 0, duration: 3, in: 0,
    subSpec: spec([track("sa", "audio", [
      { kind: "audio", id: "au", src: "a.mp4", start: 0, duration: 4, in: 1, out: 5,
        volume: 1, fadeOut: 1 },
    ])]) },
])]));
const au = aud.spec.tracks.find((t) => t.clips.length > 0).clips[0];
check("A8 audio cắt phải 1s: duration=3 fadeOut=0",
  eq(au.duration, 3) && au.fadeOut === 0, JSON.stringify(au));

// --- B. Render thật ------------------------------------------------------------
console.log("[B] render thật qua render.js CLI");
function writeSpec(name, obj) {
  const p = path.join(TMP, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}
function probeDuration(file) {
  const r = run("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", file]);
  return r.status === 0 ? parseFloat(r.stdout.trim()) : NaN;
}
function probeSize(file) {
  const r = run("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0", file]);
  return r.status === 0 ? r.stdout.trim() : "";
}
const nestedSpecPath = writeSpec("nested.json", outer);
const nestedOut = path.join(TMP, "nested.mp4");
const rn = run("node", [path.join(SRC_DIR, "render.js"), "--spec", nestedSpecPath,
  "--out", nestedOut, "--media-dir", MEDIA, "-y", "-q",
  "--x264-preset", "ultrafast", "--crf", "28"], { timeout: 300000 });
const nestedDur = fs.existsSync(nestedOut) ? probeDuration(nestedOut) : NaN;
check("B9 render nested exit 0 + MP4 tồn tại", rn.status === 0 && fs.existsSync(nestedOut),
  `status=${rn.status} stderr=${(rn.stderr || "").slice(-300)}`);
check("B9 nested duration ≈ 6.5s", eq(nestedDur, 6.5, 0.4), `duration=${nestedDur}`);
check("B9 nested 320x240", probeSize(nestedOut) === "320,240", probeSize(nestedOut));

// B10: project phẳng tương đương viết tay (c1 [2.5,4.5), c2 [4.5,6.5)).
const flatEq = spec([track("flat-v", "video", [
  vclip("c1", "a.mp4", 2.5, 2, 0, 2),
  vclip("c2", "b.mp4", 4.5, 2, 0, 2),
])]);
const flatSpecPath = writeSpec("flat.json", flatEq);
const flatOut = path.join(TMP, "flat.mp4");
const rf = run("node", [path.join(SRC_DIR, "render.js"), "--spec", flatSpecPath,
  "--out", flatOut, "--media-dir", MEDIA, "-y", "-q",
  "--x264-preset", "ultrafast", "--crf", "28"], { timeout: 300000 });
const flatDur = fs.existsSync(flatOut) ? probeDuration(flatOut) : NaN;
check("B10 render phẳng exit 0 + duration ≈ 6.5s",
  rf.status === 0 && eq(flatDur, 6.5, 0.4),
  `status=${rf.status} duration=${flatDur}`);
const dry = run("node", [path.join(SRC_DIR, "render.js"), "--spec", flatSpecPath,
  "--out", path.join(TMP, "dry.mp4"), "--media-dir", MEDIA, "--dry-run"]);
check("B10 dry-run spec phẳng thành công, không qua nhánh nested",
  dry.status === 0 && dry.stdout.includes("filter_complex") &&
  !dry.stdout.includes("nested"),
  `status=${dry.status} out=${dry.stdout.slice(0, 120)}`);

console.log(`\n${checks - failures}/${checks} check pass, ${failures} fail. tmp=${TMP}`);
// Dọn thư mục tạm khi pass hết (giữ lại khi fail để debug).
if (failures === 0) fs.rmSync(TMP, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
