#!/usr/bin/env node
/**
 * test_round73_a8_gpu_fallback.js — Đợt 73 A8: audit + kiểm chứng đường
 * fallback encode GPU→CPU (Phase 7 P2) — phần làm được trên VM này.
 *
 * Nợ đóng: đợt 72 §4 mục 8 (GPU thật / Safari thật chưa đo được — mọi kết
 * luận chỉ đúng trên CPU/SwiftShader + Chromium). VM này KHÔNG có GPU thật
 * (/dev/dri vắng, không /dev/nvidia*, probe thật trả null sau 0,41s) nên
 * mọi kịch bản "có GPU" đều GIẢ LẬP ở tầng ffmpeg CLI (ghi rõ trong log +
 * LIMITS — không claim có GPU thật), giống mẫu đợt 65 S4:
 *
 *   Kịch bản MỚI so với đợt 65 S4 (S4 chỉ cover cache lỗi + nvenc):
 *   - S1: probe TƯƠI (không cache gieo) nói h264_nvenc OK rồi render thật
 *         fail → fallback libx264 + xoá cache vừa ghi. (Đường auto mà S4
 *         chưa đi qua: probe thành công rồi encode fail.)
 *   - S2: ép tay --encoder h264_nvenc, probe OK rồi render fail → fallback.
 *   - S3: cache gieo h264_vaapi + wrapper fail vaapi → fallback; kiểm tra
 *         graph hwupload được dựng lại không hwupload ở lần retry.
 *   - S4: cache gieo h264_qsv + wrapper fail qsv → fallback.
 *   - S5: GPU "chết giữa chừng" (wrapper encode thật bằng libx264 rồi
 *         kill -9 sau 2,5s — giả lập driver crash mid-render, spec 1080p 8s
 *         để kill chắc chắn rơi giữa chừng; x264 lookahead ~20 frame nên
 *         kill sớm cho frame=0 dù đã encode): file output dở dang phải được
 *         retry ghi đè (-y), MP4 cuối đủ thời lượng; bằng chứng encode thật
 *         là file ffmpeg -progress (frame cuối 0 < N < 240), không phải
 *         size file (48 byte ở lúc kill là bình thường — buffer avio 32KB).
 *   - S6 (đối chứng): libx264 + ffmpeg luôn-fail → KHÔNG retry, exit != 0.
 *   - Timing: libx264 720p/1080p vs auto-cache-null vs --reprobe-gpu vs
 *         fallback fail-nhanh vs fallback chết-giữa-chừng (GPU path thật
 *         KHÔNG chạy được trên VM này nên không có số GPU để so).
 *   BẪY ĐÃ GẶP (ghi để đợt sau khỏi lặp): wrapper phân biệt probe vs render
 *   KHÔNG được match chuỗi con "nullsrc" — lệnh render thật luôn chứa
 *   `anullsrc=r=48000:cl=stereo:d=...` (render.js:1180, nguồn âm thanh câm)
 *   nên match đó làm wrapper exit 0 giả → render tưởng thành công nhưng
 *   không có file output. Phải match đúng token probe `nullsrc=s=64x64:d=0.1`.
 *
 * Chạy: node server/render/src/test_round73_a8_gpu_fallback.js
 * (cần ffmpeg, ffprobe; ~2-3 phút).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(process.env.HOME, "workspace", ".scratch-r73a8-"));
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
function info(msg) { console.log(`   ℹ️  ${msg}`); }
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
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
function makeSpec(name, w, h, dur, src) {
  const p = path.join(work, `${name}.json`);
  writeFileEpermRetry(p, JSON.stringify({
    version: "0.2.0",
    meta: { name, width: w, height: h, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips: [{
      id: "c0", kind: "video", src, start: 0, duration: dur,
      in: 0, out: dur, sourceAudioMode: "mute",
    }] }],
  }));
  return p;
}
function render(name, specPath, ffmpegBin, envExtra, extraArgs) {
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [path.join(RENDER, "src", "render.js"), "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "--ffmpeg", ffmpegBin,
    "-y", "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { cwd: ROOT, encoding: "utf8", timeout: 300000, env: { ...process.env, ...(envExtra || {}) } });
  const secs = (Date.now() - t0) / 1000;
  const out = (r.stdout || "").toString();
  const err = (r.stderr || "").toString();
  return { status: r.status, outPath, secs, stdout: out, stderr: err, combined: out + "\n" + err };
}
function checkMp4(res, w, h, dur, label) {
  const p = probeVideo(res.outPath);
  ok(p.codec === "h264" && p.width === w && p.height === h && Math.abs(p.duration - dur) < 0.2,
    `${label}: output hợp lệ (h264 ${p.width}x${p.height}, ${p.duration}s)`);
}
function checkFallbackMarkers(res, label) {
  ok(/thử lại bằng libx264/.test(res.combined), `${label}: log có marker 'thử lại bằng libx264'`);
  ok(/fallback libx264 thành công/.test(res.combined), `${label}: log có marker 'fallback libx264 thành công'`);
  ok(!/thử lại bằng libx264.*thử lại bằng libx264/s.test(res.combined),
    `${label}: chỉ retry đúng 1 lần (không lặp vô hạn)`);
}

console.log("== Đợt 73 A8 — fallback encode GPU→CPU (Phase 7 P2) ==");
console.log(`   WORK=${work}`);
console.log(`   GIẢ LẬP: VM không có GPU thật — fail GPU bằng wrapper ffmpeg (xem header file).`);
console.log(`   loadavg lúc bắt đầu: ${os.loadavg().map((x) => x.toFixed(2)).join(" / ")} (nproc=${os.cpus().length})`);

// --- Chuẩn bị media ---------------------------------------------------------
console.log("\n== Chuẩn bị media ==");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc=size=640x360:rate=30:duration=2",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src360.mp4")], "tạo src360.mp4 (testsrc 2s)");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc=size=1280x720:rate=30:duration=5",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src720.mp4")], "tạo src720.mp4 (testsrc 5s)");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=30:duration=5",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src1080.mp4")], "tạo src1080.mp4 (testsrc 5s)");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=30:duration=8",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src1080_8s.mp4")], "tạo src1080_8s.mp4 (testsrc 8s, cho S5)");
{
  const p = probeVideo(path.join(mediaDir, "src720.mp4"));
  ok(p.codec === "h264" && p.width === 1280 && p.height === 720 && Math.abs(p.duration - 5) < 0.15,
    "media testsrc tạo xong (360p 2s / 720p 5s / 1080p 5s)");
}
const spec360 = makeSpec("r73a8-360", 640, 360, 2, "src360.mp4");
const spec720 = makeSpec("r73a8-720", 1280, 720, 5, "src720.mp4");
const spec1080 = makeSpec("r73a8-1080", 1920, 1080, 5, "src1080.mp4");
const spec1080_8s = makeSpec("r73a8-1080-8s", 1920, 1080, 8, "src1080_8s.mp4");

// --- Wrapper 1: probe nvenc OK (nullsrc) nhưng render nvenc fail -----------
const probeOkFfmpeg = path.join(work, "fake-ffmpeg-probe-ok.sh");
writeFileEpermRetry(probeOkFfmpeg, [
  "#!/bin/sh",
  "# GIẢ LẬP probe OK nhưng render fail: nullsrc (probe 1 frame) -> exit 0,",
  "# render thật với h264_nvenc -> exit 1. Còn lại chạy ffmpeg thật.",
  'has_nvenc=0; has_nullsrc=0',
  'for a in "$@"; do',
  '  [ "$a" = "h264_nvenc" ] && has_nvenc=1',
  '  case "$a" in *nullsrc=s=64x64:d=0.1*) has_nullsrc=1;; esac',
  "done",
  'if [ "$has_nvenc" = 1 ]; then',
  '  if [ "$has_nullsrc" = 1 ]; then exit 0; fi',
  '  echo "Mock GPU failure: [h264_nvenc @ 0x0] No capable devices found (GIA LAP — probe OK, render fail)" >&2',
  "  exit 1",
  "fi",
  'exec ffmpeg "$@"',
  "",
].join("\n"));
fs.chmodSync(probeOkFfmpeg, 0o755);

// --- Wrapper 2 (mẫu): fail đúng 1 encoder cho trước -------------------------
function makeFailEncoderWrapper(name, encoder) {
  const p = path.join(work, name);
  writeFileEpermRetry(p, [
    "#!/bin/sh",
    `# GIẢ LẬP encoder ${encoder} đã chết: fail khi argv chứa đúng "${encoder}", còn lại chạy ffmpeg thật.`,
    'for a in "$@"; do',
    `  if [ "$a" = "${encoder}" ]; then`,
    `    echo "Mock GPU failure: [${encoder} @ 0x0] No capable devices found (GIA LAP)" >&2`,
    "    exit 1",
    "  fi",
    "done",
    'exec ffmpeg "$@"',
    "",
  ].join("\n"));
  fs.chmodSync(p, 0o755);
  return p;
}

// --- Wrapper 3: GPU chết giữa chừng (encode thật 2,5s rồi kill -9) ----------
const midkillFfmpeg = path.join(work, "fake-ffmpeg-midkill.sh");
const midkillSidecar = path.join(work, "midkill-partial-bytes.txt");
const midkillProgress = path.join(work, "midkill-progress.txt");
writeFileEpermRetry(midkillFfmpeg, [
  "#!/bin/sh",
  "# GIẢ LẬP driver GPU crash giữa chừng: khi render với h264_nvenc, chạy",
  "# ffmpeg THẬT nhưng đổi encoder thành libx264 (để encode chạy được),",
  "# sau 2,5s kill -9 rồi exit 1. Probe (nullsrc) cho qua (exit 0).",
  "# Ghi kích thước file output dở dang vào sidecar + số frame đã encode",
  "# (-progress) để chứng minh đã encode thật trước khi chết.",
  "# LƯU Ý: ( eval \"exec ffmpeg ...\" ) để $! là PID ffmpeg thật — kill -9",
  "# giết đúng ffmpeg (bản cũ eval thường giết subshell, để ffmpeg mồ côi",
  "# viết tiếp vào file output trong lúc retry chạy — xem LIMITS §3).",
  "# LƯU Ý 2: file MP4 48 byte ở thời điểm kill là BÌNH THƯỜNG (chỉ header",
  "# ftyp đã flush — buffer avio 32KB chưa đầy với bitrate thấp) nên bằng",
  "# chứng 'đã encode thật' là file -progress (frame=N), không phải size file.",
  'has_nvenc=0; has_nullsrc=0',
  'for a in "$@"; do',
  '  [ "$a" = "h264_nvenc" ] && has_nvenc=1',
  '  case "$a" in *nullsrc=s=64x64:d=0.1*) has_nullsrc=1;; esac',
  "done",
  'if [ "$has_nvenc" = 1 ] && [ "$has_nullsrc" = 0 ]; then',
  '  newargs=""',
  '  prev=""',
  '  for a in "$@"; do',
  '    case "$a" in',
  '      h264_nvenc) a="libx264";;',
  '      p1|p2|p3|p4|p5|p6|p7) a="veryfast";;',
  '      -cq) a="-crf";;',
  '    esac',
  '    newargs="$newargs \\"$a\\""',
  '  done',
  '  for last; do true; done',
  '  newargs="$newargs -progress ' + midkillProgress + '"',
  '  # eval trong subshell có exec: subshell THÀNH ffmpeg luôn nên $! chính',
  '  # là PID ffmpeg — kill -9 giết đúng ffmpeg (không giết subshell rồi',
  '  # để ffmpeg mồ côi viết tiếp vào file output trong lúc retry chạy).',
  '  ( eval "exec ffmpeg $newargs" ) & pid=$!',
  '  sleep 2.5',
  '  kill -9 $pid 2>/dev/null',
  '  wait $pid 2>/dev/null',
  '  if [ -f "$last" ]; then stat -c %s "$last" > "' + midkillSidecar + '" 2>/dev/null || echo 0 > "' + midkillSidecar + '"; fi',
  '  echo "Mock GPU failure: encoder died mid-render after 2.5s (GIA LAP — SIGKILL)" >&2',
  "  exit 1",
  "fi",
  'if [ "$has_nvenc" = 1 ]; then exit 0; fi',
  'exec ffmpeg "$@"',
  "",
].join("\n"));
fs.chmodSync(midkillFfmpeg, 0o755);

// --- Wrapper 4: luôn fail (đối chứng) ---------------------------------------
const alwaysFail = path.join(work, "fake-ffmpeg-always-fail.sh");
writeFileEpermRetry(alwaysFail, [
  "#!/bin/sh",
  'echo "Mock failure: ffmpeg luôn fail (đối chứng — lỗi không phải do GPU)" >&2',
  "exit 1",
  "",
].join("\n"));
fs.chmodSync(alwaysFail, 0o755);

// --- S1: probe tươi nvenc OK → render fail → fallback -----------------------
console.log("\n== S1: probe TƯƠI h264_nvenc OK → render fail → fallback libx264 ==");
const cacheS1 = path.join(work, "gpu-probe-s1.json");
const s1 = render("s1-fresh-probe", spec360, probeOkFfmpeg, { VCUT_GPU_PROBE_CACHE: cacheS1 }, ["--encoder", "auto"]);
console.log(`   render: ${s1.secs.toFixed(2)}s wall, exit=${s1.status}`);
for (const l of s1.combined.split("\n").filter((x) => /encoder|fallback|cache probe/i.test(x))) {
  console.log(`   log: ${l.trim()}`);
}
ok(s1.status === 0, "S1 render exit 0 sau fallback (job không fail vì GPU)");
checkMp4(s1, 640, 360, 2, "S1");
ok(/encoder video: h264_nvenc \(GPU auto-detect/.test(s1.combined),
  "S1 lần 1 dùng encoder GPU từ PROBE TƯƠI (không có '(probe cache' trong dòng encoder)");
ok(!/encoder video: h264_nvenc \(GPU auto-detect: [^)]*\(probe cache/.test(s1.combined),
  "S1 xác nhận không đi đường cache HIT");
checkFallbackMarkers(s1, "S1");
ok(!fs.existsSync(cacheS1), "S1 file cache vừa ghi ĐÃ BỊ XOÁ sau fallback (lần render sau probe lại thật)");
ok(/cache probe GPU đã xoá/.test(s1.combined), "S1 log có 'cache probe GPU đã xoá'");

// --- S2: ép tay --encoder h264_nvenc, probe OK → render fail → fallback -----
console.log("\n== S2: ép tay --encoder h264_nvenc, probe OK → render fail → fallback ==");
const cacheS2 = path.join(work, "gpu-probe-s2.json");
// Gieo trước 1 cache null hợp lệ để quan sát: fallback đường ép tay có xoá
// cache dù cache không được dùng tới không (ghi INFO — xem LIMITS).
GPUENC.writeGpuProbeCache(cacheS2,
  { encoder: null, tried: ["h264_nvenc", "h264_qsv", "h264_vaapi"], detail: "không GPU encoder nào encode thử thành công → fallback libx264" },
  "ffmpeg");
const s2 = render("s2-manual", spec360, probeOkFfmpeg, { VCUT_GPU_PROBE_CACHE: cacheS2 }, ["--encoder", "h264_nvenc"]);
console.log(`   render: ${s2.secs.toFixed(2)}s wall, exit=${s2.status}`);
for (const l of s2.combined.split("\n").filter((x) => /encoder|fallback|cache probe/i.test(x))) {
  console.log(`   log: ${l.trim()}`);
}
ok(s2.status === 0, "S2 render exit 0 sau fallback");
checkMp4(s2, 640, 360, 2, "S2");
ok(/encoder video: h264_nvenc \(ép tay, probe OK\)/.test(s2.combined),
  "S2 lần 1 dùng encoder ép tay sau khi probe OK");
checkFallbackMarkers(s2, "S2");
if (!fs.existsSync(cacheS2)) {
  info("S2 fallback đường ÉP TAY cũng xoá file cache probe (dù cache không được dùng) — lãng phí 1 lần probe (~0,4s) ở render auto sau; xem LIMITS §3 (mức nhẹ, không sửa).");
} else {
  info("S2 cache probe còn nguyên sau fallback đường ép tay.");
}

// --- S3: cache gieo h264_vaapi (graph hwupload) → fail → fallback -----------
console.log("\n== S3: cache gieo h264_vaapi (graph hwupload) → fail → fallback ==");
const vaapiFail = makeFailEncoderWrapper("fake-ffmpeg-fail-vaapi.sh", "h264_vaapi");
const cacheS3 = path.join(work, "gpu-probe-s3.json");
GPUENC.writeGpuProbeCache(cacheS3,
  { encoder: "h264_vaapi", tried: ["h264_nvenc", "h264_qsv", "h264_vaapi"], detail: "h264_vaapi encode thử 1 frame thành công (gieo tay)" },
  vaapiFail);
{
  const hit = GPUENC.readGpuProbeCache(cacheS3, vaapiFail);
  ok(hit !== null && hit.encoder === "h264_vaapi", "S3 đọc lại cache: HIT, encoder=h264_vaapi");
}
const s3 = render("s3-vaapi", spec360, vaapiFail, { VCUT_GPU_PROBE_CACHE: cacheS3 }, ["--encoder", "auto"]);
console.log(`   render: ${s3.secs.toFixed(2)}s wall, exit=${s3.status}`);
for (const l of s3.combined.split("\n").filter((x) => /encoder|fallback|cache probe/i.test(x))) {
  console.log(`   log: ${l.trim()}`);
}
ok(s3.status === 0, "S3 render exit 0 sau fallback");
checkMp4(s3, 640, 360, 2, "S3");
ok(/encoder video: h264_vaapi \(GPU auto-detect/.test(s3.combined),
  "S3 lần 1 dùng h264_vaapi từ cache (graph có hwupload)");
ok(/\(probe cache disk HIT\)/.test(s3.combined), "S3 xác nhận đường cache HIT");
checkFallbackMarkers(s3, "S3");
ok(!fs.existsSync(cacheS3), "S3 file cache lỗi ĐÃ BỊ XOÁ sau fallback");

// --- S4: cache gieo h264_qsv → fail → fallback -------------------------------
console.log("\n== S4: cache gieo h264_qsv → fail → fallback ==");
const qsvFail = makeFailEncoderWrapper("fake-ffmpeg-fail-qsv.sh", "h264_qsv");
const cacheS4 = path.join(work, "gpu-probe-s4.json");
GPUENC.writeGpuProbeCache(cacheS4,
  { encoder: "h264_qsv", tried: ["h264_nvenc", "h264_qsv"], detail: "h264_qsv encode thử 1 frame thành công (gieo tay)" },
  qsvFail);
const s4 = render("s4-qsv", spec360, qsvFail, { VCUT_GPU_PROBE_CACHE: cacheS4 }, ["--encoder", "auto"]);
console.log(`   render: ${s4.secs.toFixed(2)}s wall, exit=${s4.status}`);
for (const l of s4.combined.split("\n").filter((x) => /encoder|fallback|cache probe/i.test(x))) {
  console.log(`   log: ${l.trim()}`);
}
ok(s4.status === 0, "S4 render exit 0 sau fallback");
checkMp4(s4, 640, 360, 2, "S4");
ok(/encoder video: h264_qsv \(GPU auto-detect/.test(s4.combined),
  "S4 lần 1 dùng h264_qsv từ cache");
checkFallbackMarkers(s4, "S4");
ok(!fs.existsSync(cacheS4), "S4 file cache lỗi ĐÃ BỊ XOÁ sau fallback");

// --- S5: GPU chết giữa chừng (kill -9 sau 2,5s encode thật) -----------------
// Dùng spec 1080p 8s (240 frame, encode CPU ~6–14s) để kill 2,5s chắc chắn
// rơi GIỮA CHỪNG; kill 1,5s trên 720p 5s (encode ~1,6s) có khi ffmpeg đã
// encode xong, và x264 lookahead (~20 frame) làm frame=0 ở 1,5s dù đã encode.
console.log("\n== S5: GPU chết GIỮA CHỪNG (encode thật 2,5s rồi kill -9) → fallback ==");
const cacheS5 = path.join(work, "gpu-probe-s5.json");
GPUENC.writeGpuProbeCache(cacheS5,
  { encoder: "h264_nvenc", tried: ["h264_nvenc"], detail: "h264_nvenc encode thử 1 frame thành công (gieo tay)" },
  midkillFfmpeg);
const s5 = render("s5-midkill", spec1080_8s, midkillFfmpeg, { VCUT_GPU_PROBE_CACHE: cacheS5 }, ["--encoder", "auto"]);
console.log(`   render: ${s5.secs.toFixed(2)}s wall, exit=${s5.status}`);
for (const l of s5.combined.split("\n").filter((x) => /encoder|fallback|cache probe/i.test(x))) {
  console.log(`   log: ${l.trim()}`);
}
ok(s5.status === 0, "S5 render exit 0 sau fallback (file dở dang không kẹt retry)");
checkMp4(s5, 1920, 1080, 8, "S5");
checkFallbackMarkers(s5, "S5");
ok(!fs.existsSync(cacheS5), "S5 file cache lỗi ĐÃ BỊ XOÁ sau fallback");
{
  let partial = -1;
  try { partial = Number(fs.readFileSync(midkillSidecar, "utf8").trim()); } catch { /* không có sidecar */ }
  ok(partial > 0, `S5 lần 1 đã mở file output trước khi chết (dở dang ${partial} byte > 0)`);
  // Bằng chứng mạnh: file -progress của ffmpeg lần 1 — frame cuối phải nằm
  // GIỮA chừng (0 < N < 240): đã encode thật, chưa encode xong lúc bị kill.
  let lastFrame = -1;
  try {
    const lines = fs.readFileSync(midkillProgress, "utf8").split("\n");
    for (const l of lines) { const m = /^frame=(\d+)\s*$/.exec(l); if (m) lastFrame = Number(m[1]); }
  } catch { /* không có progress */ }
  ok(lastFrame > 0 && lastFrame < 240,
    `S5 lần 1 đã encode thật trước khi chết (progress frame cuối = ${lastFrame}, 0 < N < 240)`);
  info(`S5 wall ${s5.secs.toFixed(2)}s = ~2,5s encode dở (frame ${lastFrame}/240) + render CPU 1080p 8s đầy đủ (xem timing T5).`);
  // Không còn ffmpeg mồ côi viết tiếp vào file output sau khi wrapper thoát.
  const ps = spawnSync("pgrep", ["-af", "ffmpeg.*s5-midkill"], { encoding: "utf8" });
  const orphans = (ps.stdout || "").split("\n").filter((l) => l.includes("s5-midkill.mp4"));
  ok(orphans.length === 0, `S5 không còn ffmpeg mồ côi sau fallback (tìm thấy ${orphans.length})`);
}

// --- S6 (đối chứng): libx264 fail → KHÔNG retry ------------------------------
console.log("\n== S6 (đối chứng): --encoder libx264 + ffmpeg luôn-fail → không retry ==");
const s6 = render("s6-control", spec360, alwaysFail, {}, ["--encoder", "libx264"]);
console.log(`   render đối chứng: ${s6.secs.toFixed(2)}s wall, exit=${s6.status}`);
ok(s6.status !== 0, "S6 đối chứng exit != 0 (render fail thật, không che giấu)");
ok(!/thử lại bằng libx264/.test(s6.combined), "S6 đối chứng: KHÔNG retry khi encoder đang dùng là libx264");
ok(!/fallback libx264/.test(s6.combined), "S6 đối chứng: không có marker fallback");

// --- Timing: CPU fallback vs GPU path (GPU path KHÔNG chạy được trên VM) -----
console.log("\n== Timing (720p 5s = 150 frame, 1080p 5s = 150 frame; preset veryfast, crf 23) ==");
console.log(`   loadavg lúc đo timing: ${os.loadavg().map((x) => x.toFixed(2)).join(" / ")}`);
const nullCacheT = path.join(work, "gpu-probe-timing-null.json");
GPUENC.writeGpuProbeCache(nullCacheT,
  { encoder: null, tried: ["h264_nvenc", "h264_qsv", "h264_vaapi"], detail: "không GPU encoder nào encode thử thành công → fallback libx264" },
  "ffmpeg");
function fpsOf(secs, frames) { return (frames / secs).toFixed(1); }

const t1a = render("t1a-libx264", spec720, "ffmpeg", {}, ["--encoder", "libx264"]);
const t1b = render("t1b-libx264", spec720, "ffmpeg", {}, ["--encoder", "libx264"]);
console.log(`   T1 libx264 720p 5s: run1 ${t1a.secs.toFixed(2)}s (${fpsOf(t1a.secs, 150)} fps), run2 ${t1b.secs.toFixed(2)}s (${fpsOf(t1b.secs, 150)} fps) — exit ${t1a.status}/${t1b.status}`);
ok(t1a.status === 0 && t1b.status === 0, "T1 libx264 720p exit 0 cả 2 lần");
checkMp4(t1a, 1280, 720, 5, "T1a");

const t2 = render("t2-auto-nullcache", spec720, "ffmpeg", { VCUT_GPU_PROBE_CACHE: nullCacheT }, ["--encoder", "auto"]);
console.log(`   T2 auto + cache null 720p 5s: ${t2.secs.toFixed(2)}s (${fpsOf(t2.secs, 150)} fps) — exit ${t2.status}`);
ok(t2.status === 0, "T2 auto + cache null exit 0");
ok(/encoder video: libx264 \(CPU/.test(t2.combined), "T2 thẳng libx264 từ cache null, không retry");
ok(fs.existsSync(nullCacheT), "T2 cache null còn nguyên (chỉ xoá cache khi GPU fail)");

const t3 = render("t3-auto-reprobe", spec720, "ffmpeg", { VCUT_GPU_PROBE_CACHE: nullCacheT }, ["--encoder", "auto", "--reprobe-gpu"]);
console.log(`   T3 auto + --reprobe-gpu 720p 5s: ${t3.secs.toFixed(2)}s (${fpsOf(t3.secs, 150)} fps) — exit ${t3.status}`);
ok(t3.status === 0, "T3 auto + --reprobe-gpu exit 0");
info(`T3-T2 ≈ ${(t3.secs - t2.secs).toFixed(2)}s ≈ chi phí probe tươi 3 encoder (đo rời: 0,41s) + nhiễu tải VM.`);

// T4: fallback fail-nhanh (probe tươi OK → fail ngay) trên 720p 5s.
const cacheT4 = path.join(work, "gpu-probe-t4.json");
const t4 = render("t4-fallback-fastfail", spec720, probeOkFfmpeg, { VCUT_GPU_PROBE_CACHE: cacheT4 }, ["--encoder", "auto"]);
console.log(`   T4 fallback fail-nhanh 720p 5s: ${t4.secs.toFixed(2)}s (${fpsOf(t4.secs, 150)} fps hiệu dụng) — exit ${t4.status}`);
ok(t4.status === 0, "T4 fallback fail-nhanh exit 0");
checkMp4(t4, 1280, 720, 5, "T4");
info(`T4-T1(median) ≈ ${(t4.secs - (t1a.secs + t1b.secs) / 2).toFixed(2)}s = chi phí lần GPU fail-nhanh + chạy lại toàn bộ pipeline (probe + validate + retry spawn).`);

// T5 = S5 wall (đã đo ở trên, 1080p 8s = 240 frame, chết giữa chừng sau 2,5s).
info(`T5 fallback chết-giữa-chừng 1080p 8s (S5): ${s5.secs.toFixed(2)}s (${fpsOf(s5.secs, 240)} fps hiệu dụng) — gồm ~2,5s encode dở bị bỏ.`);

// T6: 1080p 5s libx264 (số headline CPU).
const t6 = render("t6-libx264-1080p", spec1080, "ffmpeg", {}, ["--encoder", "libx264"]);
console.log(`   T6 libx264 1080p 5s: ${t6.secs.toFixed(2)}s (${fpsOf(t6.secs, 150)} fps) — exit ${t6.status}`);
ok(t6.status === 0, "T6 libx264 1080p exit 0");
checkMp4(t6, 1920, 1080, 5, "T6");

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail ==`);
console.log(`   WORK=${work}`);
console.log("   LƯU Ý: GPU path thật KHÔNG chạy được trên VM này (không /dev/dri, không");
console.log("   /dev/nvidia*, probe thật trả null) — không có số fps GPU để so với CPU.");
if (fail > 0) process.exit(1);
console.log("✅ Đợt 73 A8 — fallback encode GPU→CPU: tất cả check pass");
