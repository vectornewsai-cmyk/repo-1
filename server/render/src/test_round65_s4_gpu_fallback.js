#!/usr/bin/env node
/**
 * test_round65_s4_gpu_fallback.js — Đợt 65 S4: fallback libx264 khi encoder
 * GPU đã cache lỗi + xoá cache lỗi.
 *
 * Nợ đóng: đợt 64 R1 §1/§8.4 — cache đĩa probe GPU (TTL 30 ngày) nói GPU còn
 * đó nhưng phần cứng đã tháo trong TTL → render worker chọn encoder GPU từ
 * cache → encode GPU fail → job fail luôn (chưa fallback libx264 ở bước
 * encode chính); cũng chưa có nút "Probe lại GPU" trong UI (phần UI ở
 * apps/web/src/lib/gpuProbe65S4.test.ts).
 *
 * VM này KHÔNG có GPU thật nên toàn bộ kịch bản "GPU đã tháo" được GIẢ LẬP
 * ở tầng ffmpeg CLI (ghi rõ trong log + LIMITS — không claim có GPU thật):
 *   - fake-ffmpeg.sh: wrapper quanh ffmpeg thật; CHỈ fail khi argv chứa
 *     đúng "h264_nvenc" (giả lập "No capable devices found"), còn lại exec
 *     ffmpeg thật. Nhờ đó probe thử 1 frame nvenc cũng fail — nhưng kịch
 *     bản test BYPASS probe bằng cách gieo cache đĩa sẵn encoder=h264_nvenc
 *     (viết bằng writeGpuProbeCache thật, fingerprint đúng file wrapper).
 *   - Render --encoder auto + VCUT_GPU_PROBE_CACHE=<file đã gieo>:
 *     lần 1 đọc cache HIT → chọn h264_nvenc → wrapper fail → render.js
 *     phải (a) thử lại đúng 1 lần bằng libx264 (re-exec --encoder libx264),
 *     (b) xoá file cache lỗi, (c) ra MP4 h264 hợp lệ, exit 0.
 *   - Đối chứng: render --encoder libx264 với wrapper luôn-fail
 *     (fake-ffmpeg-always-fail.sh) → KHÔNG retry (lỗi không phải do GPU),
 *     exit != 0, log không có marker fallback.
 *   - Đối chứng 2: render --encoder auto với cache đã gieo nhưng wrapper
 *     thường (ffmpeg thật, không chặn nvenc — ffmpeg thật trên VM cũng fail
 *     nvenc vì không có GPU, nhưng để chắc chắn kịch bản vẫn đi qua nhánh
 *     fallback thì dùng fake-ffmpeg.sh như kịch bản chính) — bỏ qua, kịch
 *     bản chính đã đủ.
 *
 * Chạy: node server/render/src/test_round65_s4_gpu_fallback.js
 * (cần ffmpeg, ffprobe; ~1-2 phút).
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r65s4-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const ROOT = path.join(__dirname, "..", "..", ".."); // gốc repo (src → render → server → repo)
const RENDER = path.join(__dirname, "..");
const GPUENC = require("./gpuencode");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function run(cmd, args, label, envExtra) {
  const r = spawnSync(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...(envExtra || {}) },
  });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8" });
  const j = JSON.parse(r.stdout || "{}");
  return {
    codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height,
    duration: Number(j.format && j.format.duration),
  };
}

console.log("== Đợt 65 S4 — fallback libx264 khi encoder GPU đã cache lỗi ==");
console.log(`   WORK=${work}`);
console.log("   GIẢ LẬP: VM không có GPU thật — fail nvenc bằng wrapper ffmpeg (xem header file).");

// --- Chuẩn bị media: clip testsrc 640x360 2s --------------------------------
console.log("\n== Chuẩn bị media ==");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc=size=640x360:rate=30:duration=2",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src640.mp4")], "tạo src640.mp4 (testsrc 2s)");
{
  const p = probeVideo(path.join(mediaDir, "src640.mp4"));
  ok(p.codec === "h264" && p.width === 640 && p.height === 360 && Math.abs(p.duration - 2) < 0.15,
    "src640.mp4 tạo xong (2s, 640x360, h264)");
}

// --- Fake ffmpeg: fail chỉ khi argv chứa h264_nvenc --------------------------
const fakeFfmpeg = path.join(work, "fake-ffmpeg.sh");
fs.writeFileSync(fakeFfmpeg, [
  "#!/bin/sh",
  "# GIẢ LẬP GPU đã tháo: fail đúng encoder h264_nvenc, còn lại chạy ffmpeg thật.",
  'for a in "$@"; do',
  '  if [ "$a" = "h264_nvenc" ]; then',
  '    echo "Mock GPU failure: [h264_nvenc @ 0x0] No capable devices found (GIA LAP — VM khong co GPU that)" >&2',
  "    exit 1",
  "  fi",
  "done",
  'exec ffmpeg "$@"',
  "",
].join("\n"));
fs.chmodSync(fakeFfmpeg, 0o755);

// --- Spec render 2s ----------------------------------------------------------
const spec = {
  version: "0.2.0",
  meta: { name: "r65s4", width: 640, height: 360, fps: 30 },
  tracks: [{ id: "v0", kind: "video", clips: [{
    id: "c0", kind: "video", src: "src640.mp4", start: 0, duration: 2,
    in: 0, out: 2, sourceAudioMode: "mute",
  }] }],
};
const specPath = path.join(work, "spec.json");
fs.writeFileSync(specPath, JSON.stringify(spec));

function render(name, ffmpegBin, envExtra, extraArgs) {
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "--ffmpeg", ffmpegBin,
    "-y", "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...(envExtra || {}) } });
  const secs = (Date.now() - t0) / 1000;
  const out = (r.stdout || "").toString();
  const err = (r.stderr || "").toString();
  return { status: r.status, outPath, secs, stdout: out, stderr: err, combined: out + "\n" + err };
}

// --- Kịch bản chính: cache gieo h264_nvenc + wrapper fail nvenc --------------
console.log("\n== Kịch bản chính: cache HIT h264_nvenc (đã gieo) + encode GPU fail → fallback libx264 ==");
const cachePath = path.join(work, "gpu-probe.json");
// Gieo cache bằng hàm thật (fingerprint đúng file wrapper — wrapper không
// được sửa sau bước này, nếu không cache MISS và probe thật sẽ chạy).
const seedOk = GPUENC.writeGpuProbeCache(cachePath,
  { encoder: "h264_nvenc", tried: ["h264_nvenc"], detail: "h264_nvenc encode thử 1 frame thành công (gieo tay)" },
  fakeFfmpeg);
ok(seedOk, "gieo cache đĩa encoder=h264_nvenc (bằng writeGpuProbeCache thật)");
{
  const hit = GPUENC.readGpuProbeCache(cachePath, fakeFfmpeg);
  ok(hit !== null && hit.encoder === "h264_nvenc", "đọc lại cache: HIT, encoder=h264_nvenc");
}
const main = render("fallback", fakeFfmpeg, { VCUT_GPU_PROBE_CACHE: cachePath }, ["--encoder", "auto"]);
console.log(`   render: ${main.secs.toFixed(2)}s wall, exit=${main.status}`);
for (const l of main.combined.split("\n").filter((x) => /encoder|fallback|cache probe/i.test(x))) {
  console.log(`   log: ${l.trim()}`);
}
ok(main.status === 0, "render exit 0 sau fallback (job không fail vì GPU)");
{
  const p = probeVideo(main.outPath);
  ok(p.codec === "h264" && p.width === 640 && p.height === 360 && Math.abs(p.duration - 2) < 0.15,
    `output fallback.mp4 hợp lệ (h264 ${p.width}x${p.height}, ${p.duration}s — encode bằng libx264 thật)`);
}
ok(/encoder video: h264_nvenc/.test(main.combined),
  "lần 1 dùng encoder GPU từ cache (log 'encoder video: h264_nvenc')");
ok(/thử lại bằng libx264/.test(main.combined), "log có marker 'thử lại bằng libx264'");
ok(/fallback libx264 thành công/.test(main.combined), "log có marker 'fallback libx264 thành công'");
ok(!fs.existsSync(cachePath), "file cache lỗi ĐÃ BỊ XOÁ sau fallback (lần render sau probe lại thật)");
ok(!/thử lại bằng libx264.*thử lại bằng libx264/s.test(main.combined),
  "chỉ retry đúng 1 lần (không lặp vô hạn)");

// --- Đối chứng: libx264 fail → KHÔNG retry -----------------------------------
console.log("\n== Đối chứng: --encoder libx264 + ffmpeg luôn-fail → không retry, exit != 0 ==");
const alwaysFail = path.join(work, "fake-ffmpeg-always-fail.sh");
fs.writeFileSync(alwaysFail, [
  "#!/bin/sh",
  'echo "Mock failure: ffmpeg luôn fail (đối chứng — lỗi không phải do GPU)" >&2',
  "exit 1",
  "",
].join("\n"));
fs.chmodSync(alwaysFail, 0o755);
const ctrl = render("control-libx264-fail", alwaysFail, {}, ["--encoder", "libx264"]);
console.log(`   render đối chứng: ${ctrl.secs.toFixed(2)}s wall, exit=${ctrl.status}`);
ok(ctrl.status !== 0, "đối chứng exit != 0 (render fail thật, không che giấu)");
ok(!/thử lại bằng libx264/.test(ctrl.combined), "đối chứng: KHÔNG retry khi encoder đang dùng là libx264");
ok(!/fallback libx264/.test(ctrl.combined), "đối chứng: không có marker fallback");

// --- Đối chứng 2: cache null (đã probe: không GPU) → thẳng libx264, không retry
console.log("\n== Đối chứng 2: cache HIT encoder=null → thẳng libx264, không retry ==");
const nullCache = path.join(work, "gpu-probe-null.json");
GPUENC.writeGpuProbeCache(nullCache,
  { encoder: null, tried: ["h264_nvenc", "h264_qsv", "h264_vaapi"], detail: "không GPU encoder nào encode thử thành công → fallback libx264" },
  "ffmpeg");
const ctrl2 = render("control-null-cache", "ffmpeg", { VCUT_GPU_PROBE_CACHE: nullCache }, ["--encoder", "auto"]);
console.log(`   render đối chứng 2: ${ctrl2.secs.toFixed(2)}s wall, exit=${ctrl2.status}`);
ok(ctrl2.status === 0, "đối chứng 2 exit 0");
{
  const p = probeVideo(ctrl2.outPath);
  ok(p.codec === "h264" && Math.abs(p.duration - 2) < 0.15, "đối chứng 2 output hợp lệ");
}
ok(/encoder video: libx264 \(CPU/.test(ctrl2.combined), "đối chứng 2: thẳng libx264 từ cache null");
ok(!/thử lại bằng libx264/.test(ctrl2.combined), "đối chứng 2: không retry khi đã dùng libx264 ngay từ đầu");
ok(fs.existsSync(nullCache), "đối chứng 2: cache null còn nguyên (chỉ xoá cache khi GPU fail)");

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
console.log(`   WORK=${work}`);
if (fail > 0) process.exit(1);
console.log("✅ Đợt 65 S4 — fallback libx264 khi encoder GPU đã cache lỗi: tất cả check pass");
