#!/usr/bin/env node
/**
 * test_nested_e2e.js — Test tích hợp đầu-cuối cho nested sequence (N6),
 * VIẾT LẠI Ở ĐỢT 6 (R6, cron 20:03 25/10).
 *
 * Khác bản đợt 5 ở 3 điểm quyết định:
 *  1. Flatten DÙNG CODE THẬT: `flattenSpecForRender` từ `./nested.js`
 *     (luồng N2) — không còn hàm flatten tự viết trong file này.
 *     Mọi assert về vị trí clip phẳng đều assert trên output của hàm đó.
 *  2. Render ĐI QUA render.js THẬT: spec nested được đưa thẳng vào
 *     `node src/render.js --spec ...` (render.js tự flatten trước
 *     validate, xem điểm nối N2 ở main()). Không còn tự dựng lệnh
 *     FFmpeg tay cho demo, không còn filter graph hue tự viết.
 *  3. Adjustment layer KHÔNG còn trong đường render của test này:
 *     render.js chưa đọc adjustment (xem NESTED_ROUND_LIMITS.md mục 1
 *     và header adjustment.js) nên test đợt 6 không claim render
 *     adjustment. Bảng phẳng 4 đoạn có cắt tại biên adjustment của
 *     đợt 5 đã bị bỏ: flatten thật cho ra 3 clip, không cắt tại biên
 *     adjustment. Muốn claim adjustment thì phải nối render.js trước.
 *
 * Nội dung test (chạy từ repo root):
 *   node server/render/src/test_nested_e2e.js [--out-dir /tmp/nested-e2e]
 *   A. Flatten thật spec video 2 cấp (demo compound-outer/inner):
 *      leaf-a 1→3, leaf-b1 3→4, leaf-b2 4→5; stats 2 nested / 3 clip /
 *      2 track mới / 0 warning. Render qua render.js → MP4 640x360,
 *      duration ≈ 5s (D = clip kết thúc muộn nhất, không pad theo
 *      duration minh họa 6s của spec mẫu cũ).
 *   B. Flatten thật + render thật spec có AUDIO LỒNG NHAU trong
 *      project con: tone sine 440Hz trong subSpec (1→5s trên timeline
 *      ngoài). Đo bằng volumedetect: đoạn 0→0.9s (trước nested) phải
 *      câm (mean < -60 dB), đoạn 2→4s (trong nested) phải có tiếng
 *      (mean > -40 dB). Không đo được thì test đỏ — không claim miệng.
 *   C. Fail fast thật: 9 field đặt trên nested clip đều phải throw
 *      từ flattenSpecForRender: reverse, speedKeyframes, animations,
 *      mask, filter, effects, enhance, chromaKey, audioEffects.
 *      Chỉ claim "chưa hỗ trợ" cho field nào test này chứng minh throw.
 *
 * Thoát 0 khi mọi kiểm tra xanh, khác 0 khi có kiểm tra đỏ.
 * Output MP4 nằm trong out-dir (mặc định thư mục tạm), KHÔNG ghi binary
 * vào repo.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const { flattenSpecForRender, hasNestedClips } = require("./nested");

const W = 640, H = 360, FPS = 30;
const SRC_DIR = __dirname;

let pass = 0;
let fail = 0;
function check(cond, label, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`); }
}
function run(cmd, args, label, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.error || r.status !== 0) {
    console.error(`❌ ${label} thất bại (mã ${r.status})`);
    if (r.stderr) console.error(String(r.stderr).slice(-2000));
    process.exit(2);
  }
  return r.stdout || "";
}
function eq(a, b, eps = 1e-6) { return Math.abs(a - b) <= eps; }

const meta = { name: "nested-e2e-r6", width: W, height: H, fps: FPS };
const spec = (tracks, name) => ({ version: "0.2.0", meta: { ...meta, name }, tracks });
const vtrack = (id, clips) => ({ id, kind: "video", clips });
const atrack = (id, clips) => ({ id, kind: "audio", clips });
const vclip = (id, src, start, duration, inn, out) =>
  ({ kind: "video", id, src, start, duration, in: inn, out });
const aclip = (id, src, start, duration, inn, out) =>
  ({ kind: "audio", id, src, start, duration, in: inn, out });

function flatClips(flatSpec) {
  const out = [];
  for (const t of flatSpec.tracks) for (const c of (t.clips || [])) out.push(c);
  return out;
}
function findClip(flatSpec, id) {
  return flatClips(flatSpec).find((c) => c.id === id);
}
function probe(file, args) {
  return run("ffprobe", ["-v", "error", ...args, file], "ffprobe");
}
/** mean_volume (dB) của một đoạn audio; -inf → -Infinity (câm thật). */
function meanVolume(file, ss, dur) {
  const r = spawnSync("ffmpeg", ["-v", "info", "-ss", String(ss), "-t", String(dur),
    "-i", file, "-af", "volumedetect", "-vn", "-sn", "-dn", "-f", "null", "/dev/null"],
    { encoding: "utf8" });
  const m = (r.stderr || "").match(/mean_volume:\s*(-inf|[\d.-]+)/);
  if (!m) return NaN;
  return m[1] === "-inf" ? -Infinity : parseFloat(m[1]);
}
function renderViaRenderJs(specObj, outFile, mediaDir, tmp) {
  const specPath = path.join(tmp, `${path.basename(outFile, ".mp4")}.json`);
  fs.writeFileSync(specPath, JSON.stringify(specObj, null, 2));
  const r = spawnSync("node", [path.join(SRC_DIR, "render.js"), "--spec", specPath,
    "--out", outFile, "--media-dir", mediaDir, "-y", "-q",
    "--x264-preset", "ultrafast", "--crf", "28"], { encoding: "utf8", timeout: 300000 });
  return r;
}

function main() {
  const outDir = process.argv.includes("--out-dir")
    ? process.argv[process.argv.indexOf("--out-dir") + 1]
    : fs.mkdtempSync(path.join(os.tmpdir(), "nested-e2e-"));
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`== test_nested_e2e (R6, flatten thật + render.js thật) → out: ${outDir} ==`);

  // --- Sinh media test bằng lavfi ---
  const srcA = path.join(outDir, "a.mp4");
  const srcB = path.join(outDir, "b.mp4");
  const srcC = path.join(outDir, "c.mp4");
  const tone = path.join(outDir, "tone.wav");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    `testsrc2=size=${W}x${H}:rate=${FPS}:duration=4`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", srcA],
    "sinh nguồn testsrc2");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    `color=c=0x3366ff:size=${W}x${H}:rate=${FPS}:duration=2`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", srcB],
    "sinh nguồn màu xanh");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    `color=c=0xff3333:size=${W}x${H}:rate=${FPS}:duration=2`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", srcC],
    "sinh nguồn màu đỏ");
  run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i",
    "sine=frequency=440:duration=4:sample_rate=48000", tone],
    "sinh nguồn tone sine 440Hz");

  // ============ A. Video nested 2 cấp, flatten thật ============
  console.log("[A] flatten thật (nested.js) — spec video 2 cấp");
  const innerSpec = spec([vtrack("inner-v", [
    vclip("leaf-b1", "b.mp4", 0, 1, 0, 1),
    vclip("leaf-b2", "c.mp4", 1, 1, 0, 1),
  ])], "inner");
  const subSpec = spec([vtrack("sub-v", [
    vclip("leaf-a", "a.mp4", 0, 2, 0, 2),
    { kind: "nested", id: "compound-inner", start: 2, duration: 2,
      trim: { in: 0, out: 2 }, subSpec: innerSpec },
  ])], "sub");
  const outerSpec = spec([vtrack("v-out", [
    { kind: "nested", id: "compound-outer", start: 1, duration: 4,
      trim: { in: 0, out: 4 }, subSpec },
  ])], "outer");
  check(hasNestedClips(outerSpec) === true, "hasNestedClips(spec nested) = true");
  const flatA = flattenSpecForRender(outerSpec);
  check(hasNestedClips(flatA.spec) === false, "spec sau flatten không còn nested clip");
  const a = findClip(flatA.spec, "leaf-a");
  const b1 = findClip(flatA.spec, "leaf-b1");
  const b2 = findClip(flatA.spec, "leaf-b2");
  check(Boolean(a) && eq(a.start, 1) && eq(a.duration, 2) && a.in === 0 && a.out === 2,
    "flatten thật: leaf-a start=1 dur=2 in=0 out=2", JSON.stringify(a));
  check(Boolean(b1) && eq(b1.start, 3) && eq(b1.duration, 1) && b1.in === 0 && b1.out === 1,
    "flatten thật: leaf-b1 start=3 dur=1", JSON.stringify(b1));
  check(Boolean(b2) && eq(b2.start, 4) && eq(b2.duration, 1) && b2.in === 0 && b2.out === 1,
    "flatten thật: leaf-b2 start=4 dur=1", JSON.stringify(b2));
  check(flatA.stats.nestedClips === 2 && flatA.stats.outputClips === 3 &&
    flatA.stats.newTracks === 2 && flatA.stats.droppedClips === 0 &&
    flatA.warnings.length === 0,
    "flatten thật: stats 2 nested / 3 clip / 2 track mới / 0 warning",
    JSON.stringify(flatA.stats) + " warnings=" + flatA.warnings.join("|"));
  // Spec gốc không bị flatten sửa (nested.js clone sâu).
  check(outerSpec.tracks[0].clips[0].subSpec !== undefined &&
    outerSpec.tracks[0].clips[0].kind === "nested",
    "spec gốc không bị flatten sửa (vẫn còn clip nested)");

  console.log("[A] render thật qua render.js");
  const outA = path.join(outDir, "nested-video.mp4");
  const rA = renderViaRenderJs(outerSpec, outA, outDir, outDir);
  check(rA.status === 0 && fs.existsSync(outA),
    "render.js spec nested video exit 0 + MP4 tồn tại",
    `status=${rA.status} stderr=${(rA.stderr || "").slice(-300)}`);
  const sizeA = fs.existsSync(outA) ? fs.statSync(outA).size : 0;
  check(sizeA > 10000, `MP4 video > 10KB (thực tế ${sizeA} bytes)`);
  const probeA = fs.existsSync(outA) ? probe(outA, ["-select_streams", "v:0",
    "-show_entries", "stream=width,height,codec_name",
    "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1"]) : "";
  const durA = (probeA.match(/duration=([\d.]+)/) || [])[1];
  check(probeA.includes("width=640") && probeA.includes("height=360"),
    "MP4 video đúng 640x360");
  check(durA !== undefined && Math.abs(parseFloat(durA) - 5) < 0.3,
    `MP4 video duration ≈ 5s (thực tế ${durA}s; D = clip kết thúc muộn nhất)`);

  // ============ B. Audio lồng nhau trong project con ============
  console.log("[B] flatten thật + render thật — audio trong project con");
  const audioSub = spec([
    vtrack("sub-v", [vclip("v1", "a.mp4", 0, 4, 0, 4)]),
    atrack("sub-a", [aclip("au1", "tone.wav", 0, 4, 0, 4)]),
  ], "audio-sub");
  const audioOuter = spec([vtrack("v-out", [
    { kind: "nested", id: "nest-audio", start: 1, duration: 4,
      trim: { in: 0, out: 4 }, subSpec: audioSub },
  ])], "audio-outer");
  const flatB = flattenSpecForRender(audioOuter);
  const au = findClip(flatB.spec, "au1");
  const vv = findClip(flatB.spec, "v1");
  check(Boolean(au) && eq(au.start, 1) && eq(au.duration, 4) && au.in === 0 && au.out === 4,
    "flatten thật: audio con au1 start=1 dur=4 in=0 out=4", JSON.stringify(au));
  check(Boolean(vv) && eq(vv.start, 1) && eq(vv.duration, 4),
    "flatten thật: video con v1 start=1 dur=4", JSON.stringify(vv));
  const outB = path.join(outDir, "nested-audio.mp4");
  const rB = renderViaRenderJs(audioOuter, outB, outDir, outDir);
  check(rB.status === 0 && fs.existsSync(outB),
    "render.js spec nested audio exit 0 + MP4 tồn tại",
    `status=${rB.status} stderr=${(rB.stderr || "").slice(-300)}`);
  const probeB = fs.existsSync(outB) ? probe(outB, ["-show_entries",
    "stream=codec_type,codec_name", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1"]) : "";
  check(probeB.includes("codec_type=audio") && probeB.includes("codec_name=aac"),
    "MP4 có audio stream AAC (từ tone trong project con)");
  const durB = (probeB.match(/duration=([\d.]+)/) || [])[1];
  check(durB !== undefined && Math.abs(parseFloat(durB) - 5) < 0.3,
    `MP4 audio duration ≈ 5s (thực tế ${durB}s)`);
  const volSilent = fs.existsSync(outB) ? meanVolume(outB, 0, 0.9) : NaN;
  const volTone = fs.existsSync(outB) ? meanVolume(outB, 2, 2) : NaN;
  check(Number.isFinite(volSilent) || volSilent === -Infinity,
    "đo được mean_volume đoạn câm", `mean=${volSilent}`);
  check(volSilent < -60,
    `đoạn 0→0.9s (trước nested) câm: mean_volume < -60 dB (thực tế ${volSilent} dB)`);
  check(volTone > -40,
    `đoạn 2→4s (trong nested) có tiếng: mean_volume > -40 dB (thực tế ${volTone} dB)`);

  // ============ C. Fail fast: 8 field chưa hỗ trợ trên nested clip ============
  // Đợt 18: speedKeyframes ĐÃ được hỗ trợ trên nested clip (xem
  // docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md) nên không còn trong danh sách
  // fail fast; case dương C2 dưới đây kiểm chứng flatten thành công.
  console.log("[C] fail fast thật — field chưa hỗ trợ trên nested clip");
  const failFastCases = [
    ["reverse", { reverse: true }],
    ["animations", { animations: { opacity: { keyframes: [{ t: 0, v: 1 }] } } }],
    ["mask", { mask: { type: "rect" } }],
    ["filter", { filter: "hue=s=0" }],
    ["effects", { effects: [{ type: "sharpen" }] }],
    ["enhance", { enhance: { denoise: true } }],
    ["chromaKey", { chromaKey: { color: "green" } }],
    ["audioEffects", { audioEffects: { bass: 1 } }],
  ];
  for (const [field, extra] of failFastCases) {
    const bad = spec([vtrack("v-out", [
      { kind: "nested", id: "bad-nested", start: 0, duration: 1,
        trim: { in: 0, out: 1 }, subSpec: innerSpec, ...extra },
    ])], "bad");
    let threw = false;
    let msg = "";
    try { flattenSpecForRender(bad); } catch (e) { threw = true; msg = e.message; }
    check(threw && /chưa được hỗ trợ|chưa hỗ trợ/.test(msg),
      `nested clip mang "${field}" → flatten throw fail fast`, `msg=${msg}`);
  }

  // ============ C2. Đợt 18: nested clip mang speedKeyframes hợp lệ → flatten OK ============
  console.log("[C2] nested speedKeyframes hợp lệ — flatten thành công (đợt 18)");
  const rampOk = spec([vtrack("v-out", [
    { kind: "nested", id: "ramp-nested", start: 0, duration: 1,
      trim: { in: 0, out: 1 }, subSpec: innerSpec,
      speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }] } },
  ])], "ramp-ok");
  let rampThrew = false;
  let rampMsg = "";
  try { flattenSpecForRender(rampOk); } catch (e) { rampThrew = true; rampMsg = e.message; }
  check(!rampThrew,
    "nested clip mang speedKeyframes hợp lệ → flatten KHÔNG throw", `msg=${rampMsg}`);

  console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail — MP4: ${outDir} ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
