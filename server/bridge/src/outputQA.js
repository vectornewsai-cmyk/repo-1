#!/usr/bin/env node
/**
 * outputQA.js — Kiểm tra chất lượng file MP4 sau khi render (R1-043).
 *
 * Render xong là chưa đủ: ffmpeg có thể thoát mã 0 nhưng file bị cụt,
 * thiếu audio, sai độ phân giải... Module này chạy ffprobe (chỉ đọc
 * header, KHÔNG decode toàn bộ → nhanh) và kiểm tra:
 *
 *   1. File tồn tại, size > 0
 *   2. Có video stream, codec h264
 *   3. Có audio stream, codec aac  (đúng hợp đồng H.264+AAC của render worker)
 *   4. Duration ≈ kỳ vọng (±0.5s)
 *   5. Độ phân giải đúng width×height kỳ vọng
 *
 * Nếu bất kỳ check nào fail → job bị đánh dấu lỗi QA, file lỗi KHÔNG
 * được trả cho user (endpoint download chỉ phục vụ khi status === "done").
 *
 * API:
 *   verifyOutput(mp4Path, expected, ffprobeBin)
 *     -> Promise<{ ok: boolean, errors: string[], report: QaReport }>
 *
 * Chạy self-test: node src/outputQA.js --self-test
 *   (cần ffmpeg + ffprobe trên PATH)
 */
"use strict";

const fs = require("fs");
const { execFile } = require("child_process");

const DURATION_TOLERANCE_S = 0.5;
const FFPROBE_TIMEOUT_MS = 15000;

/**
 * Chạy ffprobe lấy streams + format (JSON). Chỉ đọc header, không decode.
 * @returns {Promise<{streams: object[], format: object}>}
 */
function probeFile(ffprobeBin, mp4Path) {
  return new Promise((resolve, reject) => {
    execFile(
      ffprobeBin,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", mp4Path],
      { timeout: FFPROBE_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          reject(new Error(`ffprobe thất bại: ${(err.message || err).split("\n")[0]}`));
          return;
        }
        try {
          const data = JSON.parse(stdout);
          resolve({ streams: data.streams || [], format: data.format || {} });
        } catch (e) {
          reject(new Error("ffprobe trả về JSON không hợp lệ: " + e.message));
        }
      }
    );
  });
}

/**
 * Kiểm tra file MP4 sau render.
 *
 * @param {string} mp4Path đường dẫn file output
 * @param {{duration?: number, width?: number, height?: number}} expected kỳ vọng từ spec
 *        (duration: tổng thời lượng timeline; width/height: spec.meta)
 * @param {string} [ffprobeBin="ffprobe"] đường dẫn ffprobe
 * @returns {Promise<{ok: boolean, errors: string[], report: object}>}
 */
async function verifyOutput(mp4Path, expected, ffprobeBin = "ffprobe") {
  const errors = [];
  const checks = {};
  const exp = expected || {};

  // --- 1. File tồn tại, size > 0 -------------------------------------------
  let size = 0;
  try {
    const stat = fs.statSync(mp4Path);
    size = stat.size;
  } catch {
    errors.push(`không tìm thấy file output: ${mp4Path}`);
    return { ok: false, errors, report: { file: mp4Path, size: 0, ok: false, errorCount: errors.length, checks } };
  }
  checks.fileSize = { ok: size > 0, actual: size, expected: "> 0 byte" };
  if (size <= 0) {
    errors.push("file output rỗng (0 byte)");
    return { ok: false, errors, report: { file: mp4Path, size: 0, ok: false, errorCount: errors.length, checks } };
  }

  // --- 2. ffprobe đọc được ---------------------------------------------------
  let probe;
  try {
    probe = await probeFile(ffprobeBin, mp4Path);
  } catch (e) {
    errors.push(e.message);
    return { ok: false, errors, report: { file: mp4Path, size: 0, ok: false, errorCount: errors.length, checks } };
  }
  const { streams, format } = probe;

  // --- 3. Video stream h264 --------------------------------------------------
  const vs = streams.find((s) => s.codec_type === "video");
  const vCodec = vs ? vs.codec_name : null;
  checks.videoCodec = { ok: vCodec === "h264", actual: vCodec, expected: "h264" };
  if (!vs) {
    errors.push("không có video stream trong file output");
  } else if (vCodec !== "h264") {
    errors.push(`video codec là "${vCodec}", kỳ vọng "h264"`);
  }

  // --- 4. Audio stream aac ---------------------------------------------------
  const as = streams.find((s) => s.codec_type === "audio");
  const aCodec = as ? as.codec_name : null;
  checks.audioCodec = { ok: aCodec === "aac", actual: aCodec, expected: "aac" };
  if (!as) {
    errors.push("không có audio stream trong file output (kỳ vọng aac)");
  } else if (aCodec !== "aac") {
    errors.push(`audio codec là "${aCodec}", kỳ vọng "aac"`);
  }

  // --- 5. Duration ≈ kỳ vọng (±0.5s) -----------------------------------------
  const dur = parseFloat(format.duration);
  if (Number.isFinite(dur) && typeof exp.duration === "number" && exp.duration > 0) {
    const diff = Math.abs(dur - exp.duration);
    const ok = diff <= DURATION_TOLERANCE_S;
    checks.duration = {
      ok,
      actual: +dur.toFixed(3),
      expected: exp.duration,
      tolerance: DURATION_TOLERANCE_S,
    };
    if (!ok) {
      errors.push(
        `duration ${dur.toFixed(2)}s, kỳ vọng ${exp.duration}s (lệch ${diff.toFixed(2)}s, cho phép ±${DURATION_TOLERANCE_S}s)`
      );
    }
  } else {
    checks.duration = { ok: true, actual: Number.isFinite(dur) ? +dur.toFixed(3) : null, expected: exp.duration ?? null, skipped: "không có kỳ vọng duration" };
  }

  // --- 6. Độ phân giải --------------------------------------------------------
  if (vs && typeof exp.width === "number" && typeof exp.height === "number"
      && exp.width > 0 && exp.height > 0) {
    const ok = vs.width === exp.width && vs.height === exp.height;
    checks.resolution = {
      ok,
      actual: `${vs.width}x${vs.height}`,
      expected: `${exp.width}x${exp.height}`,
    };
    if (!ok) {
      errors.push(`độ phân giải ${vs.width}x${vs.height}, kỳ vọng ${exp.width}x${exp.height}`);
    }
  } else {
    checks.resolution = {
      ok: true,
      actual: vs ? `${vs.width}x${vs.height}` : null,
      expected: exp.width && exp.height ? `${exp.width}x${exp.height}` : null,
      skipped: "không có kỳ vọng resolution",
    };
  }

  return {
    ok: errors.length === 0,
    errors,
    report: { file: mp4Path, size, ok: errors.length === 0, errorCount: errors.length, checks },
  };
}

// ---------------------------------------------------------------------------
// Self-test: node src/outputQA.js --self-test
// ---------------------------------------------------------------------------
async function selfTest() {
  const { execFileSync } = require("child_process");
  const os = require("os");
  const path = require("path");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "outputqa-test-"));
  let pass = 0, fail = 0;
  const ok = (name, cond, detail) => {
    if (cond) { pass++; console.log(`  ✅ ${name}`); }
    else { fail++; console.log(`  ❌ ${name}${detail ? " — " + detail : ""}`); }
  };

  const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: "pipe" });

  console.log("== [1] File đúng → QA pass ==");
  const good = path.join(tmp, "good.mp4");
  ff(["-f", "lavfi", "-i", "testsrc=duration=2:size=640x360:rate=30",
      "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", good]);
  let r = await verifyOutput(good, { duration: 2, width: 640, height: 360 });
  ok("file đúng pass", r.ok, JSON.stringify(r.errors));
  ok("report có đủ 5 checks", Object.keys(r.report.checks).length === 5);

  console.log("== [2] Sai duration kỳ vọng → QA fail, message rõ ==");
  r = await verifyOutput(good, { duration: 10, width: 640, height: 360 });
  ok("fail khi duration sai", !r.ok);
  ok("message nêu rõ duration", r.errors.some((e) => e.includes("duration") && e.includes("2.00") && e.includes("10")),
    JSON.stringify(r.errors));

  console.log("== [3] Sai resolution kỳ vọng → QA fail ==");
  r = await verifyOutput(good, { duration: 2, width: 1280, height: 720 });
  ok("fail khi resolution sai", !r.ok);
  ok("message nêu rõ resolution", r.errors.some((e) => e.includes("640x360") && e.includes("1280x720")),
    JSON.stringify(r.errors));

  console.log("== [4] File không có audio → QA fail ==");
  const noaudio = path.join(tmp, "noaudio.mp4");
  ff(["-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=30",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", noaudio]);
  r = await verifyOutput(noaudio, { duration: 1, width: 320, height: 240 });
  ok("fail khi thiếu audio", !r.ok);
  ok("message nêu thiếu audio", r.errors.some((e) => e.includes("audio")), JSON.stringify(r.errors));

  console.log("== [5] File bị cụt (cắt nửa bytes) → QA fail ==");
  const trunc = path.join(tmp, "trunc.mp4");
  const buf = fs.readFileSync(good);
  fs.writeFileSync(trunc, buf.slice(0, Math.floor(buf.length / 2)));
  r = await verifyOutput(trunc, { duration: 2, width: 640, height: 360 });
  ok("fail khi file cụt", !r.ok, JSON.stringify(r.errors));

  console.log("== [6] File không tồn tại → QA fail ==");
  r = await verifyOutput(path.join(tmp, "khong-co.mp4"), { duration: 2, width: 640, height: 360 });
  ok("fail khi file không tồn tại", !r.ok);
  ok("message nêu không tìm thấy file", r.errors.some((e) => e.includes("không tìm thấy")),
    JSON.stringify(r.errors));

  console.log("== [7] Video codec sai (mpeg4) → QA fail ==");
  const wrongcodec = path.join(tmp, "wrongcodec.mp4");
  ff(["-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=30",
      "-f", "lavfi", "-i", "sine=frequency=440:duration=1",
      "-c:v", "mpeg4", "-c:a", "aac", "-shortest", wrongcodec]);
  r = await verifyOutput(wrongcodec, { duration: 1, width: 320, height: 240 });
  ok("fail khi codec sai", !r.ok);
  ok("message nêu codec", r.errors.some((e) => e.includes("h264")), JSON.stringify(r.errors));

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${fail === 0 ? "🎉" : "⚠️"} SELF-TEST: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

if (require.main === module && process.argv.includes("--self-test")) {
  selfTest().catch((e) => { console.error("Self-test crash:", e); process.exit(1); });
}

module.exports = { verifyOutput, probeFile, DURATION_TOLERANCE_S };
