#!/usr/bin/env node
/**
 * gpuencode.js — Encode GPU tự động cho render worker (Phase 7 P2).
 *
 * NGUYÊN TẮC:
 * - Probe BẰNG ENCODE THẬT (1 frame nullsrc), không chỉ liệt kê encoder:
 *   encoder có tên trong `ffmpeg -encoders` vẫn fail nếu không có phần cứng
 *   (VD: h264_nvenc không có GPU NVIDIA → lỗi "No capable devices found").
 * - Thứ tự thử: h264_nvenc (NVIDIA) → h264_qsv (Intel Quick Sync) →
 *   h264_vaapi (VA-API, cần /dev/dri/renderD128 + hwupload ở cuối graph).
 * - KHÔNG BAO GIỜ fail job vì GPU: encoder nào probe fail → bỏ qua;
 *   tất cả fail → fallback libx264. Người dùng ép encoder (--encoder) mà
 *   probe fail → cảnh báo + fallback libx264 (không fail job).
 * - Probe 1 lần / process, cache kết quả (mỗi lần probe ~0.1–0.5s).
 *
 * GIỚI HẠN TRUNG THỰC (xem ENHANCE_LIMITS.md): trên VM test (2vCPU, không
 * GPU) probe luôn trả về null → chỉ kiểm chứng được logic detect +
 * fallback, CHƯA từng encode GPU thật. Đừng claim đã test encode GPU.
 */
"use strict";

const assert = require("assert");
const { spawnSync } = require("child_process");

/** Map x264 preset → nvenc preset p1..p7 (p4 ≈ medium). */
const NVENC_PRESET_MAP = {
  ultrafast: "p1", superfast: "p2", veryfast: "p3", faster: "p4",
  fast: "p4", medium: "p5", slow: "p6", slower: "p7", veryslow: "p7",
};

/** QSV preset dùng tên giống x264 (veryfast..veryslow đều hợp lệ). */
const QSV_PRESETS = new Set([
  "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow",
]);

const GPU_CANDIDATES = ["h264_nvenc", "h264_qsv", "h264_vaapi"];

/**
 * Encode thử 1 frame nullsrc bằng encoder cho trước.
 * @returns {boolean} true nếu encode thành công
 */
function tryEncode(ffmpeg, encoder) {
  const base = ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1"];
  let args;
  if (encoder === "h264_vaapi") {
    // VA-API cần device + upload frame lên hardware.
    if (!require("fs").existsSync("/dev/dri/renderD128")) return false;
    args = [...base, "-vaapi_device", "/dev/dri/renderD128",
      "-vf", "format=nv12,hwupload", "-c:v", "h264_vaapi", "-frames:v", "1", "-f", "null", "-"];
  } else {
    args = [...base, "-c:v", encoder, "-frames:v", "1", "-f", "null", "-"];
  }
  try {
    const r = spawnSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"], timeout: 15000 });
    return !r.error && r.status === 0;
  } catch {
    return false;
  }
}

let probeCache = null;

/**
 * Probe GPU encoder khả dụng (thử theo thứ tự nvenc → qsv → vaapi).
 * @param {string} ffmpeg đường dẫn ffmpeg
 * @param {Function} [tryFn] inject để test (mặc định tryEncode)
 * @returns {{encoder: string|null, tried: string[], detail: string}}
 */
function probeGpuEncoder(ffmpeg, tryFn) {
  if (probeCache && !tryFn) return probeCache;
  const fn = tryFn || tryEncode;
  const tried = [];
  for (const enc of GPU_CANDIDATES) {
    tried.push(enc);
    if (fn(ffmpeg, enc)) {
      const res = { encoder: enc, tried, detail: `${enc} encode thử 1 frame thành công` };
      if (!tryFn) probeCache = res;
      return res;
    }
  }
  const res = { encoder: null, tried, detail: "không GPU encoder nào encode thử thành công → fallback libx264" };
  if (!tryFn) probeCache = res;
  return res;
}

/**
 * Dựng tham số encode video cho encoder đã chọn.
 * @param {string} encoder "libx264" | "h264_nvenc" | "h264_qsv" | "h264_vaapi"
 * @param {{crf:number, preset:string}} opts
 * @returns {{args:string[], pixFmt:string|null, needsHwupload:boolean}}
 *   pixFmt null = không truyền -pix_fmt (vaapi tự quản lý surface).
 */
function buildVideoEncodeArgs(encoder, opts) {
  const crf = opts.crf;
  const preset = opts.preset;
  switch (encoder) {
    case "h264_nvenc":
      return {
        args: ["-c:v", "h264_nvenc", "-preset", NVENC_PRESET_MAP[preset] || "p5", "-cq", String(crf)],
        pixFmt: "yuv420p", needsHwupload: false,
      };
    case "h264_qsv": {
      const p = QSV_PRESETS.has(preset) ? preset : "medium";
      return {
        args: ["-c:v", "h264_qsv", "-preset", p, "-global_quality", String(crf)],
        pixFmt: "yuv420p", needsHwupload: false,
      };
    }
    case "h264_vaapi":
      return {
        args: ["-c:v", "h264_vaapi", "-qp", String(crf)],
        pixFmt: null, needsHwupload: true,
      };
    case "libx264":
    default:
      return {
        args: ["-c:v", "libx264", "-preset", preset, "-crf", String(crf)],
        pixFmt: "yuv420p", needsHwupload: false,
      };
  }
}

// ---------------------------------------------------------------------------
// Self-test: node src/gpuencode.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  // buildVideoEncodeArgs thuần túy (không cần hardware)
  const x = buildVideoEncodeArgs("libx264", { crf: 20, preset: "medium" });
  assert.deepStrictEqual(x.args, ["-c:v", "libx264", "-preset", "medium", "-crf", "20"]);
  assert.strictEqual(x.pixFmt, "yuv420p");
  assert.strictEqual(x.needsHwupload, false);

  const nv = buildVideoEncodeArgs("h264_nvenc", { crf: 20, preset: "medium" });
  assert.deepStrictEqual(nv.args, ["-c:v", "h264_nvenc", "-preset", "p5", "-cq", "20"]);
  const nvFast = buildVideoEncodeArgs("h264_nvenc", { crf: 23, preset: "ultrafast" });
  assert.ok(nvFast.args.includes("p1"));

  const q = buildVideoEncodeArgs("h264_qsv", { crf: 20, preset: "medium" });
  assert.deepStrictEqual(q.args, ["-c:v", "h264_qsv", "-preset", "medium", "-global_quality", "20"]);
  const qBad = buildVideoEncodeArgs("h264_qsv", { crf: 20, preset: "ultrafast" });
  assert.ok(qBad.args.includes("medium"), "preset qsv không hợp lệ phải rơi về medium");

  const v = buildVideoEncodeArgs("h264_vaapi", { crf: 20, preset: "medium" });
  assert.deepStrictEqual(v.args, ["-c:v", "h264_vaapi", "-qp", "20"]);
  assert.strictEqual(v.pixFmt, null);
  assert.strictEqual(v.needsHwupload, true);

  // probe với tryFn giả lập: encoder thứ 2 thành công
  const calls = [];
  const fakeTry = (ff, enc) => { calls.push(enc); return enc === "h264_qsv"; };
  const res = probeGpuEncoder("ffmpeg", fakeTry);
  assert.strictEqual(res.encoder, "h264_qsv");
  assert.deepStrictEqual(calls, ["h264_nvenc", "h264_qsv"]);
  // probe với tất cả fail → null
  const res2 = probeGpuEncoder("ffmpeg", () => false);
  assert.strictEqual(res2.encoder, null);
  assert.deepStrictEqual(res2.tried, GPU_CANDIDATES);

  // probe thật trên máy này: không GPU → null (ghi rõ, không assert cứng
  // encoder cụ thể vì máy khác có thể có GPU; chỉ assert kiểu trả về).
  const real = probeGpuEncoder("ffmpeg");
  assert.ok(real.encoder === null || GPU_CANDIDATES.includes(real.encoder));
  console.log(`   probe thật trên máy này: ${real.encoder || "null (fallback libx264)"} — ${real.detail}`);
  console.log("✅ gpuencode.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("gpuencode.js — module probe + tham số encode GPU. Chạy với --self-test.");
    process.exit(2);
  }
}

module.exports = {
  GPU_CANDIDATES,
  probeGpuEncoder,
  buildVideoEncodeArgs,
  tryEncode,
};
