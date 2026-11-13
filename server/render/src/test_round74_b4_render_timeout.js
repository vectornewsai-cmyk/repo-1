#!/usr/bin/env node
/**
 * test_round74_b4_render_timeout.js — Đợt 74 B4: timeout cho mọi spawnSync
 * trong render pipeline (đóng nợ đợt 73 §4 mục 8).
 *
 * Nợ gốc (A8, docs/PHASE9_ROUND73_A8_GPU_FALLBACK_LIMITS.md §3.5):
 * render.js:1805 chạy ffmpeg bằng spawnSync KHÔNG timeout — ffmpeg treo
 * thì job treo theo, fallback GPU→CPU không kích hoạt. Đợt này thêm
 * timeout cho MỌI điểm spawn đồng bộ trong pipeline (xem timeouts.js).
 *
 * Cách kiểm chứng — GIẢ LẬP treo ở tầng ffmpeg/python CLI (ghi rõ trong
 * log; VM này không có GPU thật, không có driver treo thật):
 *   - Wrapper ffmpeg "treo 1 lần rồi chạy thật": lần đầu exec `sleep 179`
 *     (không thoát), các lần sau exec ffmpeg thật. Chứng minh: job bị
 *     timeout đúng hạn (~5s), fallback kích hoạt, retry thành công, không
 *     còn tiến trình mồ côi.
 *   - Wrapper ffmpeg "luôn treo": chứng minh job libx264 fail rõ (exit 2)
 *     trong ~5s thay vì treo vô hạn, không retry sai, không mồ côi.
 *   - Fake `python3` trong PATH (exec `sleep 173`): chứng minh helper
 *     render_text_png treo → timeout 3s → fallback drawtext, render vẫn
 *     thành công, không mồ côi.
 *   - Wrapper ffmpeg "treo vidstabdetect": chứng minh detect treo →
 *     fail-fast exit 1 với thông điệp timeout, không treo job.
 * Số 179/173/181 là "mùi" riêng để pgrep tìm đúng tiến trình treo của
 * test này (các luồng đợt 74 khác đang chạy song song trên cùng VM).
 *
 * Chạy: node server/render/src/test_round74_b4_render_timeout.js
 * (cần ffmpeg, ffprobe, python3+PIL; ~40-60s).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r74b4-"));
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir, { recursive: true });
const RENDER = path.join(__dirname, "render.js");
const TIMEOUTS = require("./timeouts");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}`); }
}
function info(msg) { console.log(`   ℹ️  ${msg}`); }
function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], timeout: 120000, killSignal: "SIGKILL" });
  if (r.error || r.status !== 0) {
    console.error(`❌ bước "${label}" thất bại (mã ${r.status}):\n${(r.stderr || "").toString().slice(-1500)}`);
    process.exit(2);
  }
  return r;
}
/** Không còn tiến trình nào khớp pattern (pgrep exit 1 = không match). */
function noOrphan(pattern, label) {
  const r = spawnSync("pgrep", ["-f", pattern], { encoding: "utf8" });
  if (r.error) { ok(false, `${label}: không chạy được pgrep (${r.error.message})`); return; }
  ok(r.status !== 0, `${label}: không còn tiến trình mồ côi khớp "${pattern}"` +
    (r.status === 0 ? ` (còn: ${(r.stdout || "").trim().split("\n").slice(0, 3).join(",")})` : ""));
}
function probeVideo(mp4) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height",
    "-show_entries", "format=duration", "-of", "json", mp4], { encoding: "utf8", timeout: 30000 });
  const j = JSON.parse(r.stdout || "{}");
  return {
    codec: j.streams && j.streams[0] && j.streams[0].codec_name,
    width: j.streams && j.streams[0] && j.streams[0].width,
    height: j.streams && j.streams[0] && j.streams[0].height,
    duration: Number(j.format && j.format.duration),
  };
}
function makeSpec(name, tracks, w, h, dur) {
  const p = path.join(work, `${name}.json`);
  writeFileEpermRetry(p, JSON.stringify({
    version: "0.2.0",
    meta: { name, width: w, height: h, fps: 30 },
    tracks,
  }));
  return p;
}
const vclip = (id, src, start, duration, extra = {}) => ({
  id, kind: "video", src, start, duration, in: 0, out: duration,
  sourceAudioMode: "mute", ...extra,
});
const kf = (pairs) => ({ keyframes: pairs.map(([t, v]) => ({ t, v, easing: "linear" })) });
function render(name, specPath, ffmpegBin, envExtra, extraArgs) {
  const outPath = path.join(work, `${name}.mp4`);
  const t0 = Date.now();
  const r = spawnSync("node", [RENDER, "--spec", specPath,
    "--out", outPath, "--media-dir", mediaDir, "--ffmpeg", ffmpegBin,
    "-y", "--x264-preset", "veryfast", "--crf", "23", ...(extraArgs || [])],
    { encoding: "utf8", timeout: 180000, killSignal: "SIGKILL",
      env: { ...process.env, ...(envExtra || {}) } });
  const secs = (Date.now() - t0) / 1000;
  const out = (r.stdout || "").toString();
  const err = (r.stderr || "").toString();
  return { status: r.status, signal: r.signal, outPath, secs, stdout: out, stderr: err, combined: out + "\n" + err };
}
function checkMp4(res, w, h, dur, label) {
  const p = probeVideo(res.outPath);
  ok(p.codec === "h264" && p.width === w && p.height === h && Math.abs(p.duration - dur) < 0.2,
    `${label}: output hợp lệ (h264 ${p.width}x${p.height}, ${p.duration}s)`);
}
/** Chạy fn với env tạm rồi khôi phục (kể cả khi fn throw). */
function withEnv(patch, fn) {
  const saved = {};
  for (const k of Object.keys(patch)) { saved[k] = process.env[k]; }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  try { return fn(); }
  finally {
    for (const k of Object.keys(patch)) {
      if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    }
  }
}

console.log("== Đợt 74 B4 — timeout spawnSync trong render pipeline ==");
console.log(`   WORK=${work}`);
console.log(`   GIẢ LẬP: ffmpeg/python treo bằng wrapper sleep (xem header file).`);
console.log(`   loadavg lúc bắt đầu: ${os.loadavg().map((x) => x.toFixed(2)).join(" / ")} (nproc=${os.cpus().length})`);

// ---------------------------------------------------------------------------
// U: công thức timeout (đơn vị, không chạy render)
// ---------------------------------------------------------------------------
console.log("\n== U: công thức timeouts.js ==");
ok(TIMEOUTS.encodeTimeoutMs(0) === 120000, "U1: encodeTimeoutMs(0s) = 120000ms (phần cố định)");
ok(TIMEOUTS.encodeTimeoutMs(2) === 240000, "U2: encodeTimeoutMs(2s) = 240000ms (120s + 60s/giây × 2)");
ok(TIMEOUTS.encodeTimeoutMs(10) === 720000, "U3: encodeTimeoutMs(10s) = 720000ms");
ok(TIMEOUTS.encodeTimeoutMs(60) === 3720000, "U4: encodeTimeoutMs(60s) = 3720000ms (62 phút — đủ biên cho 4K dài)");
ok(TIMEOUTS.encodeTimeoutMs(2, 5000) === 5000, "U5: override tuyệt đối (CLI --ffmpeg-timeout) thắng công thức");
ok(withEnv({ VCUT_ENCODE_TIMEOUT_MS: "5000" }, () => TIMEOUTS.encodeTimeoutMs(60)) === 5000,
  "U6: env VCUT_ENCODE_TIMEOUT_MS=5000 thắng công thức");
ok(withEnv({ VCUT_ENCODE_TIMEOUT_FACTOR: "10" }, () => TIMEOUTS.encodeTimeoutMs(10)) === 220000,
  "U7: env VCUT_ENCODE_TIMEOUT_FACTOR=10 → 120s + 10s/giây × 10 = 220000ms");
ok(withEnv({ VCUT_ENCODE_TIMEOUT_MS: "abc" }, () => TIMEOUTS.encodeTimeoutMs(2)) === 240000,
  "U8: env override không hợp lệ ('abc') → rơi về mặc định, không crash");
ok(withEnv({ VCUT_ENCODE_TIMEOUT_MS: "-5" }, () => TIMEOUTS.encodeTimeoutMs(2)) === 240000,
  "U9: env override âm → rơi về mặc định");
ok(withEnv({ VCUT_ENCODE_TIMEOUT_MS: "500" }, () => TIMEOUTS.encodeTimeoutMs(2)) === 240000,
  "U10: env override < 1000ms → rơi về mặc định");
ok(TIMEOUTS.helperTimeoutMs(0) === 60000, "U11: helperTimeoutMs(0) = 60000ms");
ok(TIMEOUTS.helperTimeoutMs(10) === 160000, "U12: helperTimeoutMs(10s) = 160000ms (60s + 10s/giây)");
ok(TIMEOUTS.detectTimeoutMs(5) === 110000, "U13: detectTimeoutMs(5s) = 110000ms (60s + 10s/giây)");
ok(TIMEOUTS.retryTimeoutMs(2) === 540000, "U14: retryTimeoutMs(2s) = 540000ms (encode 240s + biên 300s)");
ok(TIMEOUTS.probeTimeoutMs() === 15000, "U15: probeTimeoutMs() = 15000ms (khớp gpuencode tryEncode)");
ok(TIMEOUTS.ffprobeTimeoutMs() === 30000, "U16: ffprobeTimeoutMs() = 30000ms");
ok(TIMEOUTS.measureTimeoutMs() === 300000, "U17: measureTimeoutMs() = 300000ms");
ok(TIMEOUTS.isTimeoutResult({ error: { code: "ETIMEDOUT" } }) === true, "U18: isTimeoutResult nhận diện ETIMEDOUT");
ok(TIMEOUTS.isTimeoutResult({ error: { code: "ENOENT" } }) === false, "U19: isTimeoutResult từ chối ENOENT");
ok(TIMEOUTS.isTimeoutResult({ status: 1 }) === false, "U20: isTimeoutResult từ chối fail thường (status 1)");
ok(TIMEOUTS.KILL_SIGNAL === "SIGKILL", "U21: killSignal mặc định là SIGKILL");

// ---------------------------------------------------------------------------
// Chuẩn bị media
// ---------------------------------------------------------------------------
console.log("\n== Chuẩn bị media ==");
run("ffmpeg", ["-f", "lavfi", "-i", "testsrc=size=640x360:rate=30:duration=2",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-an", "-y", path.join(mediaDir, "src360.mp4")], "tạo src360.mp4 (testsrc 2s)");
{
  const p = probeVideo(path.join(mediaDir, "src360.mp4"));
  ok(p.codec === "h264" && p.width === 640 && p.height === 360 && Math.abs(p.duration - 2) < 0.15,
    "media testsrc tạo xong (360p 2s)");
}
const spec360 = makeSpec("r74b4-360",
  [{ id: "v0", kind: "video", clips: [vclip("c0", "src360.mp4", 0, 2)] }], 640, 360, 2);

// ---------------------------------------------------------------------------
// S1: ffmpeg treo 1 lần (GPU) → timeout 5s → fallback → retry thành công
// ---------------------------------------------------------------------------
console.log("\n== S1: ffmpeg treo 1 lần, --encoder h264_nvenc, timeout 5s ==");
const hangOnceMarker = path.join(work, "hang-once.marker");
const hangOnceFfmpeg = path.join(work, "fake-ffmpeg-hang-once.sh");
writeFileEpermRetry(hangOnceFfmpeg, [
  "#!/bin/sh",
  "# GIẢ LẬP ffmpeg treo 1 lần: probe nvenc (nullsrc) -> exit 0; lần render",
  "# nvenc ĐẦU TIÊN exec `sleep 179` (treo, chờ render.js kill sau timeout);",
  "# mọi lần sau exec ffmpeg thật (retry libx264 đi đường này).",
  "has_nvenc=0; has_nullsrc=0",
  "for a in \"$@\"; do",
  "  [ \"$a\" = \"h264_nvenc\" ] && has_nvenc=1",
  "  case \"$a\" in *nullsrc=s=64x64:d=0.1*) has_nullsrc=1;; esac",
  "done",
  "if [ \"$has_nvenc\" = 1 ] && [ \"$has_nullsrc\" = 1 ]; then exit 0; fi",
  "if [ \"$has_nvenc\" = 1 ]; then",
  `  if [ ! -f "${hangOnceMarker}" ]; then touch "${hangOnceMarker}"; exec sleep 179; fi`,
  "fi",
  "exec ffmpeg \"$@\"",
  "",
].join("\n"));
fs.chmodSync(hangOnceFfmpeg, 0o755);
{
  const res = render("r74b4-s1", spec360, hangOnceFfmpeg,
    { VCUT_ENCODE_TIMEOUT_MS: "5000", VCUT_GPU_PROBE_CACHE: "0" }, ["--encoder", "h264_nvenc"]);
  ok(fs.existsSync(hangOnceMarker), "S1: wrapper thật sự đã treo 1 lần (marker tồn tại — không phải pass giả)");
  ok(res.status === 0, `S1: job thành công sau fallback (status ${res.status})`);
  checkMp4(res, 640, 360, 2, "S1");
  ok(/treo quá timeout 5s/.test(res.combined), "S1: log nêu rõ 'treo quá timeout 5s' (ETIMEDOUT)");
  ok(/thử lại bằng libx264/.test(res.combined), "S1: fallback kích hoạt (marker 'thử lại bằng libx264')");
  ok(/fallback libx264 thành công/.test(res.combined), "S1: fallback thành công");
  ok(!/thử lại bằng libx264.*thử lại bằng libx264/s.test(res.combined), "S1: chỉ retry đúng 1 lần");
  ok(/timeout encode: 5s/.test(res.combined),
    "S1: log 'timeout encode: 5s' (hạn encode tính theo override)");
  ok(res.secs >= 4.5 && res.secs < 60,
    `S1: job kết thúc sau ${res.secs.toFixed(1)}s (chờ đúng ~5s timeout + retry, không treo vô hạn)`);
  info(`S1 wall: ${res.secs.toFixed(1)}s`);
  noOrphan("sleep 179", "S1");
  noOrphan(hangOnceFfmpeg, "S1");
}

// ---------------------------------------------------------------------------
// S1b: treo CẢ hai lần (nvenc + libx264 retry) → chứng minh env override
// truyền xuống tiến trình retry: con cũng tự timeout sau 5s (wall ~10-13s).
// Nếu con dùng mặc định 240s thì wall sẽ ~245s và thông điệp cuối sẽ là
// dạng "treo quá hạn chờ ... của job cha" thay vì "lần retry cũng treo".
// (BẪY: stdout của tiến trình retry bị ignore theo hành vi cũ nên log()
// của con không tới được log job — chỉ stderr của con mới tới; vì vậy
// KHÔNG đếm số lần xuất hiện của dòng log 'timeout encode'.)
// ---------------------------------------------------------------------------
console.log("\n== S1b: treo cả 2 lần, kiểm chứng override tới được retry ==");
const hangTwiceMarker1 = path.join(work, "hang-twice-1.marker");
const hangTwiceMarker2 = path.join(work, "hang-twice-2.marker");
const hangTwiceFfmpeg = path.join(work, "fake-ffmpeg-hang-twice.sh");
writeFileEpermRetry(hangTwiceFfmpeg, [
  "#!/bin/sh",
  "# GIẢ LẬP treo 2 lần: probe nvenc -> exit 0; lần render nvenc ĐẦU và",
  "# lần render libx264 ĐẦU (retry) đều exec `sleep 179`; sau đó ffmpeg thật.",
  "has_nvenc=0; has_nullsrc=0; has_x264=0",
  "for a in \"$@\"; do",
  "  [ \"$a\" = \"h264_nvenc\" ] && has_nvenc=1",
  "  [ \"$a\" = \"libx264\" ] && has_x264=1",
  "  case \"$a\" in *nullsrc=s=64x64:d=0.1*) has_nullsrc=1;; esac",
  "done",
  "if [ \"$has_nvenc\" = 1 ] && [ \"$has_nullsrc\" = 1 ]; then exit 0; fi",
  "if [ \"$has_nvenc\" = 1 ]; then",
  `  if [ ! -f "${hangTwiceMarker1}" ]; then touch "${hangTwiceMarker1}"; exec sleep 179; fi`,
  "fi",
  "if [ \"$has_x264\" = 1 ]; then",
  `  if [ ! -f "${hangTwiceMarker2}" ]; then touch "${hangTwiceMarker2}"; exec sleep 179; fi`,
  "fi",
  "exec ffmpeg \"$@\"",
  "",
].join("\n"));
fs.chmodSync(hangTwiceFfmpeg, 0o755);
{
  const res = render("r74b4-s1b", spec360, hangTwiceFfmpeg,
    { VCUT_ENCODE_TIMEOUT_MS: "5000", VCUT_GPU_PROBE_CACHE: "0" }, ["--encoder", "h264_nvenc"]);
  ok(fs.existsSync(hangTwiceMarker1) && fs.existsSync(hangTwiceMarker2),
    "S1b: cả 2 lần treo đều thật sự xảy ra (2 marker tồn tại — không phải pass giả)");
  ok(res.status === 3, `S1b: job fail rõ với exit 3 = timeout (nhận ${res.status})`);
  ok(/treo quá timeout 5s/.test(res.combined), "S1b: lần 1 timeout đúng 5s");
  ok(/fallback libx264 THẤT BẠI/.test(res.combined), "S1b: retry cũng thất bại (đúng — lần 2 cũng treo)");
  ok(/lần retry libx264 cũng treo quá timeout/.test(res.combined),
    "S1b: thông điệp cuối nói đúng 'lần retry libx264 cũng treo quá timeout' (con tự timeout theo hạn encode của nó)");
  ok(/hạn encode của lần retry: 5s/.test(res.combined),
    "S1b: thông điệp cuối in đúng hạn encode của lần retry (5s, không phải hạn chờ 305s)");
  ok(res.secs >= 9 && res.secs < 45,
    `S1b: job kết thúc sau ${res.secs.toFixed(1)}s (~5s + ~5s hai lần timeout; con dùng 240s mặc định thì sẽ ~245s)`);
  info(`S1b wall: ${res.secs.toFixed(1)}s`);
  noOrphan("sleep 179", "S1b");
  noOrphan(hangTwiceFfmpeg, "S1b");
}

// ---------------------------------------------------------------------------
// S2: ffmpeg luôn treo, libx264 → fail rõ sau ~5s, không retry, không mồ côi
// ---------------------------------------------------------------------------
console.log("\n== S2: ffmpeg luôn treo, --encoder libx264, timeout 5s ==");
const alwaysHangFfmpeg = path.join(work, "fake-ffmpeg-always-hang.sh");
writeFileEpermRetry(alwaysHangFfmpeg, [
  "#!/bin/sh",
  "# GIẢ LẬP ffmpeg luôn treo: mọi lệnh render exec `sleep 179`; probe",
  "# (nullsrc) cho qua bằng ffmpeg thật để khỏi fail ở bước probe.",
  "for a in \"$@\"; do",
  "  case \"$a\" in *nullsrc=s=64x64:d=0.1*) exec ffmpeg \"$@\";; esac",
  "done",
  "exec sleep 179",
  "",
].join("\n"));
fs.chmodSync(alwaysHangFfmpeg, 0o755);
{
  const res = render("r74b4-s2", spec360, alwaysHangFfmpeg,
    { VCUT_ENCODE_TIMEOUT_MS: "5000" }, ["--encoder", "libx264"]);
  ok(res.status === 3, `S2: job fail rõ với exit 3 = timeout (nhận ${res.status}) — không treo vô hạn`);
  ok(/treo quá timeout/.test(res.combined), "S2: log nêu rõ 'treo quá timeout'");
  ok(/nâng hạn bằng --ffmpeg-timeout/.test(res.combined), "S2: log gợi ý cách nâng hạn (--ffmpeg-timeout)");
  ok(!/thử lại bằng libx264/.test(res.combined), "S2: libx264 fail thì KHÔNG retry (đúng thiết kế)");
  ok(res.secs >= 4.5 && res.secs < 30,
    `S2: job kết thúc sau ${res.secs.toFixed(1)}s (đúng ~5s timeout, không phải treo vô hạn)`);
  info(`S2 wall: ${res.secs.toFixed(1)}s`);
  noOrphan("sleep 179", "S2");
  noOrphan(alwaysHangFfmpeg, "S2");
}

// ---------------------------------------------------------------------------
// S3: render thường không bị timeout phá (mặc định + cờ --ffmpeg-timeout)
// ---------------------------------------------------------------------------
console.log("\n== S3: render thường với timeout mặc định + --ffmpeg-timeout ==");
{
  const res = render("r74b4-s3a", spec360, "ffmpeg", {}, ["--encoder", "libx264"]);
  ok(res.status === 0, `S3a: render thường thành công (status ${res.status})`);
  checkMp4(res, 640, 360, 2, "S3a");
  ok(/timeout encode: 240s/.test(res.combined),
    "S3a: log 'timeout encode: 240s' (mặc định 120s + 60s/giây × 2s)");
  ok(res.secs < 60, `S3a: render 2s xong trong ${res.secs.toFixed(1)}s (timeout 240s không cắt render thật)`);
  const resB = render("r74b4-s3b", spec360, "ffmpeg", {}, ["--encoder", "libx264", "--ffmpeg-timeout", "600"]);
  ok(resB.status === 0, `S3b: render với --ffmpeg-timeout 600 thành công (status ${resB.status})`);
  ok(/timeout encode: 600s/.test(resB.combined) && /ghi đè --ffmpeg-timeout/.test(resB.combined),
    "S3b: log 'timeout encode: 600s' + ghi đè --ffmpeg-timeout");
}

// ---------------------------------------------------------------------------
// S4: helper python3 treo → timeout 3s → fallback drawtext, render vẫn chạy
// ---------------------------------------------------------------------------
console.log("\n== S4: python3 (render_text_png) treo, timeout helper 3s ==");
const fakeBinDir = path.join(work, "fakebin");
fs.mkdirSync(fakeBinDir, { recursive: true });
writeFileEpermRetry(path.join(fakeBinDir, "python3"), [
  "#!/bin/sh",
  "# GIẢ LẬP helper python3 treo: exec `sleep 173` (chờ render.js kill).",
  "exec sleep 173",
  "",
].join("\n"));
fs.chmodSync(path.join(fakeBinDir, "python3"), 0o755);
const specTextSr = makeSpec("r74b4-textsr", [
  { id: "v0", kind: "video", clips: [vclip("c0", "src360.mp4", 0, 2)] },
  { id: "t0", kind: "text", clips: [{
    id: "tx", kind: "text", text: "HELLO", start: 0, duration: 2,
    style: { fontFamily: "sans-serif", fontSize: 64, color: "#ffffff", x: 0.5, y: 0.5, animation: "none" },
    animations: { scale: kf([[0, 1], [2, 2]]) },
  }] },
], 640, 360, 2);
{
  const res = render("r74b4-s4", specTextSr, "ffmpeg",
    { VCUT_HELPER_TIMEOUT_MS: "3000", PATH: `${fakeBinDir}:${process.env.PATH}` },
    ["--encoder", "libx264"]);
  ok(res.status === 0, `S4: render vẫn thành công dù helper treo (status ${res.status})`);
  checkMp4(res, 640, 360, 2, "S4");
  ok(/không vẽ được PNG cho scale\/rotation/.test(res.combined),
    "S4: log fallback drawtext ('không vẽ được PNG cho scale/rotation')");
  ok(/ETIMEDOUT/.test(res.combined), "S4: log nêu ETIMEDOUT (đúng nguyên nhân, không báo lỗi chung chung)");
  ok(res.secs >= 2.5 && res.secs < 30,
    `S4: job kết thúc sau ${res.secs.toFixed(1)}s (chờ đúng ~3s helper timeout)`);
  info(`S4 wall: ${res.secs.toFixed(1)}s`);
  noOrphan("sleep 173", "S4");
}

// ---------------------------------------------------------------------------
// S5: vidstabdetect treo → fail-fast exit 1 với thông điệp timeout
// ---------------------------------------------------------------------------
console.log("\n== S5: vidstabdetect treo, timeout detect 5s ==");
const hangDetectFfmpeg = path.join(work, "fake-ffmpeg-hang-detect.sh");
writeFileEpermRetry(hangDetectFfmpeg, [
  "#!/bin/sh",
  "# GIẢ LẬP vidstabdetect treo: argv chứa 'vidstabdetect' -> exec `sleep 181`;",
  "# còn lại (probe -filters, -version, encode) chạy ffmpeg thật.",
  "for a in \"$@\"; do",
  "  case \"$a\" in *vidstabdetect*) exec sleep 181;; esac",
  "done",
  "exec ffmpeg \"$@\"",
  "",
].join("\n"));
fs.chmodSync(hangDetectFfmpeg, 0o755);
const specStab = makeSpec("r74b4-stab", [
  { id: "v0", kind: "video", clips: [vclip("c0", "src360.mp4", 0, 2, {
    enhance: { stabilize: { smoothing: 10, shakiness: 5, accuracy: 15, stepsize: 6, mincontrast: 0.3 } },
  })] },
], 640, 360, 2);
{
  const res = render("r74b4-s5", specStab, hangDetectFfmpeg,
    { VCUT_DETECT_TIMEOUT_MS: "5000" }, ["--encoder", "libx264", "--no-trf-cache"]);
  ok(res.status === 1, `S5: detect treo → fail-fast exit 1 (nhận ${res.status}) — không treo job`);
  ok(/vidstabdetect treo quá timeout 5s/.test(res.combined),
    "S5: log nêu rõ 'vidstabdetect treo quá timeout 5s'");
  ok(res.secs >= 4.5 && res.secs < 30,
    `S5: job kết thúc sau ${res.secs.toFixed(1)}s (đúng ~5s detect timeout)`);
  info(`S5 wall: ${res.secs.toFixed(1)}s`);
  noOrphan("sleep 181", "S5");
  noOrphan(hangDetectFfmpeg, "S5");
}

// ---------------------------------------------------------------------------
console.log(`\n== KẾT QUẢ: ${pass}/${pass + fail} pass ==`);
if (fail > 0) { console.error(`❌ CÒN ${fail} CHECK FAIL`); process.exit(1); }
console.log("✅ test_round74_b4_render_timeout: tất cả pass");
