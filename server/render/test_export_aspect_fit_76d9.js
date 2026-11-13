#!/usr/bin/env node
/**
 * test_export_aspect_fit_76d9.js — Kiểm chứng --aspect-fit end-to-end
 * (Phase 9 đợt 76 D9 — đóng nợ đợt 75 C7 §6: xuất preset 4:5 từ nguồn
 * 16:9 thì letterbox viền đen mà panel không cảnh báo).
 *
 * 1. [dry-run] render.js với clip video 16:9, khung 1080×1350:
 *    mặc định (không cờ) → scale decrease + pad 1080:1350 (hành vi cũ);
 *    --aspect-fit crop → scale increase + crop 1080:1350, không pad;
 *    --aspect-fit bogus → exit 2.
 * 2. [render thật] nguồn testsrc2 640×360 (16:9) → MP4 1080×1350:
 *    fit  → viền trên YAVG ≈ 0 (đen tuyệt đối, giữ letterbox cũ),
 *           dải giữa YAVG > 10 (có nội dung);
 *    crop → viền trên YAVG > 10 (không còn viền đen — lấp đầy khung),
 *           dải giữa YAVG > 10; ffprobe 1080×1350, đủ 60 frame, 2,0s.
 * 3. [render thật] nguồn đã 4:5 (540×675) với fit → viền trên YAVG > 10
 *    (không viền đen thừa — khớp quyết định "không cảnh báo thừa" của UI).
 * 4. [unit] nhánh speed ramp (buildSpeedRampVideo) dùng cùng fitChain:
 *    crop → increase+crop, fit → decrease+pad.
 *
 * Cách dùng: node test_export_aspect_fit_76d9.js [--out-dir /tmp/aspect76d9]
 * Yêu cầu: node, ffmpeg, ffprobe. Không cần browser, không cần bridge.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../eperm-retry.cjs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const args = process.argv.slice(2);
const outDir = path.resolve(args[args.indexOf("--out-dir") + 1] || "/tmp/aspect76d9");
fs.mkdirSync(outDir, { recursive: true });
const mediaDir = path.join(outDir, "media");
fs.mkdirSync(mediaDir, { recursive: true });

const RENDER_JS = path.join(__dirname, "src", "render.js");
const W = 1080, H = 1350, FPS = 30, DUR = 2;
const EXPECTED_FRAMES = FPS * DUR;
// Viền đen trên của letterbox 16:9 → 4:5: nguồn scale vừa rộng 1080 → cao
// 608, đặt giữa khung 1350 → viền trên/dưới mỗi bên (1350-608)/2 = 371px.
// Đo band y=0..270 (nằm gọn trong viền) và band giữa y=270..1080.
const TOP_BAND = { w: 1080, h: 270, x: 0, y: 0 };
const MID_BAND = { w: 1080, h: 810, x: 0, y: 270 };

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
}

/** Spec tối thiểu: 1 clip video, khung xuất 1080×1350 @30fps. */
function makeSpec(srcFile) {
  return {
    version: "0.2.0",
    meta: { name: "aspect-fit-test", width: W, height: H, fps: FPS },
    tracks: [{
      id: "t1", kind: "video", clips: [{
        kind: "video", id: "c1", src: srcFile,
        start: 0, duration: DUR, in: 0, out: DUR,
      }],
    }],
  };
}

function ffprobe(file) {
  const raw = execFileSync("ffprobe",
    ["-v", "error", "-count_frames",
     "-show_entries", "stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_read_frames",
     "-show_entries", "format=duration", "-of", "json", file],
    { encoding: "utf8" });
  return JSON.parse(raw);
}

/** Y trung bình của một band (crop → 1 frame gray → mean) tại thời điểm t. */
function bandYavg(mp4, t, band) {
  const buf = execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-ss", String(t), "-i", mp4,
    "-vf", `crop=${band.w}:${band.h}:${band.x}:${band.y}`,
    "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-",
  ]);
  let sum = 0;
  for (const b of buf) sum += b;
  return sum / buf.length;
}

function render(specFile, outFile, extraArgs) {
  const r = spawnSync("node", [RENDER_JS,
    "--spec", specFile, "--out", outFile, "--media-dir", mediaDir,
    "-y", "-q", "--crf", "28", "--x264-preset", "veryfast", "--audio-bitrate", "96k",
    ...extraArgs],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return r;
}

// ---- Chuẩn bị nguồn: testsrc2 sáng màu (không có viền đen sẵn) ----
console.log("== [0] sinh nguồn test (lavfi testsrc2) ==");
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y",
  "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=2",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(mediaDir, "src169.mp4")]);
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y",
  "-f", "lavfi", "-i", "testsrc2=size=540x675:rate=30:duration=2",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", path.join(mediaDir, "src45.mp4")]);
ok(fs.existsSync(path.join(mediaDir, "src169.mp4")), "nguồn 16:9 640×360 đã sinh");
ok(fs.existsSync(path.join(mediaDir, "src45.mp4")), "nguồn 4:5 540×675 đã sinh");
// Đối chứng: nguồn gốc KHÔNG có viền đen (band trên sáng) — nếu nguồn đã
// đen sẵn thì phép đo letterbox/crop dưới đây vô nghĩa.
const srcTop = bandYavg(path.join(mediaDir, "src169.mp4"), 1, { w: 640, h: 90, x: 0, y: 0 });
console.log(`  (nguồn 16:9, band trên YAVG = ${srcTop.toFixed(1)})`);
ok(srcTop > 10, `nguồn 16:9 band trên sáng (YAVG ${srcTop.toFixed(1)} > 10) — đo viền có nghĩa`);

console.log("== [1] dry-run: filter graph theo --aspect-fit ==");
const drySpec = path.join(outDir, "dry-spec.json");
writeFileEpermRetry(drySpec, JSON.stringify(makeSpec("src169.mp4")));
function dryRun(extraArgs) {
  const r = spawnSync("node", [RENDER_JS, "--spec", drySpec,
    "--out", path.join(outDir, "dry.mp4"), "--media-dir", mediaDir,
    "--crf", "21", "--x264-preset", "medium", "--audio-bitrate", "128k",
    "--dry-run", ...extraArgs], { encoding: "utf8" });
  return r;
}
{
  const r = dryRun([]);
  const cmd = r.stdout || "";
  ok(r.status === 0, "dry-run mặc định exit 0");
  ok(cmd.includes("force_original_aspect_ratio=decrease"), "mặc định: scale decrease (fit)");
  ok(cmd.includes(`pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`), "mặc định: pad 1080:1350 nền đen");
  ok(!cmd.includes(`crop=${W}:${H}`), "mặc định: không crop");
}
{
  const r = dryRun(["--aspect-fit", "crop"]);
  const cmd = r.stdout || "";
  ok(r.status === 0, "dry-run --aspect-fit crop exit 0");
  ok(cmd.includes("force_original_aspect_ratio=increase"), "crop: scale increase (cover)");
  ok(cmd.includes(`crop=${W}:${H}`), "crop: crop 1080:1350");
  ok(!cmd.includes(`pad=${W}:${H}`), "crop: không pad");
}
{
  const r = dryRun(["--aspect-fit", "bogus"]);
  ok(r.status === 2, `--aspect-fit bogus → exit 2 (nhận ${r.status})`);
}

console.log("== [2] render thật: nguồn 16:9 → 4:5, fit vs crop ==");
function renderAndCheck(label, srcFile, extraArgs) {
  const specPath = path.join(outDir, `spec-${label}.json`);
  const outFile = path.join(outDir, `out-${label}.mp4`);
  writeFileEpermRetry(specPath, JSON.stringify(makeSpec(srcFile)));
  const t0 = Date.now();
  const r = render(specPath, outFile, extraArgs);
  if (r.status !== 0) {
    ok(false, `${label}: render exit 0 (stderr: ${(r.stderr || "").slice(-400)})`);
    return null;
  }
  console.log(`  (${label}: render mất ${((Date.now() - t0) / 1000).toFixed(1)}s cho ${DUR}s video)`);
  const p = ffprobe(outFile);
  const vs = p.streams.find((s) => s.codec_name === "h264");
  ok(!!vs, `${label}: có stream video h264`);
  if (vs) {
    ok(vs.width === W && vs.height === H, `${label}: ffprobe ${vs.width}x${vs.height} = ${W}x${H}`);
    const frames = parseInt(vs.nb_read_frames, 10);
    ok(frames === EXPECTED_FRAMES, `${label}: đủ frame ${frames} = ${EXPECTED_FRAMES}`);
  }
  const dur = parseFloat(p.format.duration);
  ok(Math.abs(dur - DUR) < 0.15, `${label}: duration ${dur.toFixed(3)}s ≈ ${DUR}s`);
  return outFile;
}
const fitMp4 = renderAndCheck("fit169", "src169.mp4", []);
if (fitMp4) {
  const top05 = bandYavg(fitMp4, 0.5, TOP_BAND);
  const top15 = bandYavg(fitMp4, 1.5, TOP_BAND);
  const mid05 = bandYavg(fitMp4, 0.5, MID_BAND);
  console.log(`  (fit: viền trên YAVG t=0.5 → ${top05.toFixed(2)}, t=1.5 → ${top15.toFixed(2)}; giữa t=0.5 → ${mid05.toFixed(1)})`);
  ok(top05 < 2 && top15 < 2, `fit: viền trên đen (YAVG ${top05.toFixed(2)} / ${top15.toFixed(2)} < 2) — letterbox giữ nguyên`);
  ok(mid05 > 10, `fit: dải giữa có nội dung (YAVG ${mid05.toFixed(1)} > 10)`);
}
const cropMp4 = renderAndCheck("crop169", "src169.mp4", ["--aspect-fit", "crop"]);
if (cropMp4) {
  const top05 = bandYavg(cropMp4, 0.5, TOP_BAND);
  const top15 = bandYavg(cropMp4, 1.5, TOP_BAND);
  const mid05 = bandYavg(cropMp4, 0.5, MID_BAND);
  console.log(`  (crop: viền trên YAVG t=0.5 → ${top05.toFixed(1)}, t=1.5 → ${top15.toFixed(1)}; giữa t=0.5 → ${mid05.toFixed(1)})`);
  ok(top05 > 10 && top15 > 10, `crop: viền trên CÓ nội dung (YAVG ${top05.toFixed(1)} / ${top15.toFixed(1)} > 10) — lấp đầy khung, hết viền đen`);
  ok(mid05 > 10, `crop: dải giữa có nội dung (YAVG ${mid05.toFixed(1)} > 10)`);
}

console.log("== [3] render thật: nguồn đã 4:5 với fit (không viền thừa) ==");
const fit45Mp4 = renderAndCheck("fit45", "src45.mp4", []);
if (fit45Mp4) {
  const top05 = bandYavg(fit45Mp4, 0.5, TOP_BAND);
  const top15 = bandYavg(fit45Mp4, 1.5, TOP_BAND);
  console.log(`  (fit 4:5: viền trên YAVG t=0.5 → ${top05.toFixed(1)}, t=1.5 → ${top15.toFixed(1)})`);
  ok(top05 > 10 && top15 > 10, `fit 4:5: không viền đen thừa (YAVG ${top05.toFixed(1)} / ${top15.toFixed(1)} > 10)`);
}

console.log("== [4] unit: nhánh speed ramp dùng cùng fitChain ==");
{
  const { buildSpeedRampVideo } = require("./src/speedramp");
  const clip = {
    id: "r1", kind: "video", src: "src169.mp4", start: 0, duration: 2, in: 0,
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 2, v: 1, easing: "linear" }] },
  };
  let n = 0;
  const lbl = (p) => `${p}${n++}`;
  const base = { W, H, fps: FPS, outFormat: "yuv420p", padColor: "black", lbl };
  const fitLines = buildSpeedRampVideo("[0:v]", clip, { ...base, aspectFit: "fit" }).lines.join("\n");
  ok(fitLines.includes("force_original_aspect_ratio=decrease"), "ramp fit: scale decrease");
  ok(fitLines.includes(`pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`), "ramp fit: pad 1080:1350");
  const cropLines = buildSpeedRampVideo("[0:v]", clip, { ...base, aspectFit: "crop" }).lines.join("\n");
  ok(cropLines.includes("force_original_aspect_ratio=increase"), "ramp crop: scale increase");
  ok(cropLines.includes(`crop=${W}:${H}`), "ramp crop: crop 1080:1350");
  ok(!cropLines.includes(`pad=${W}:${H}`), "ramp crop: không pad");
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
process.exit(fail === 0 ? 0 : 1);
