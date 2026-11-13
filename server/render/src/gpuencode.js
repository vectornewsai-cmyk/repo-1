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
 * - Đợt 64 R1: cache kết quả probe XUỐNG ĐĨA (~/.cache/vcut/gpu-probe.json,
 *   TTL 30 ngày) vì mỗi lần render là 1 process node mới → cache trong
 *   process cũ không bao giờ sống qua 2 lần render. Lần đầu probe thật,
 *   các lần sau đọc file cache (~ms). File vắng = "chưa probe"; file có
 *   encoder=null = "đã probe: không có GPU" — hai trạng thái phân biệt rõ.
 *   Ép probe lại: CLI render.js --reprobe-gpu (hoặc xoá file cache).
 *   Tắt cache đĩa: env VCUT_GPU_PROBE_CACHE=0 hoặc --no-gpu-probe-cache.
 *
 * GIỚI HẠN TRUNG THỰC (xem ENHANCE_LIMITS.md): trên VM test (2vCPU, không
 * GPU) probe luôn trả về null → chỉ kiểm chứng được logic detect +
 * fallback, CHƯA từng encode GPU thật. Đừng claim đã test encode GPU.
 */
"use strict";

const assert = require("assert");
const fs = require("fs");
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port CJS của
// apps/web/scripts/eperm-retry.mjs; xem server/eperm-retry.cjs).
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
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
    // Đợt 74 B4: thêm killSignal SIGKILL cho nhất quán (timeout đã có từ
    // đợt 64; SIGTERM mặc định có thể bị tiến trình treo bỏ qua).
    const r = spawnSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"], timeout: 15000, killSignal: "SIGKILL" });
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

// ---------------------------------------------------------------------------
// Đợt 64 R1 — Cache đĩa cho kết quả probe GPU.
//
// Vấn đề (đợt 63 R2 §2.1/§5.1): probe GPU là overhead wall lớn nhất của
// một lần render (CPU chỉ 0,23s nhưng wall 0,31–2,50s) mà trên máy không
// GPU luôn trả null. Cache trong process (probeCache) vô dụng vì bridge
// spawn `node render.js` mới cho mỗi job → probe chạy lại mỗi lần render.
// Cache đĩa khắc phục đúng chỗ đó: lần đầu probe thật + ghi file, các
// lần sau đọc file (~ms, chỉ stat + đọc JSON nhỏ).
//
// Phân biệt rõ 3 trạng thái:
//   - chưa probe: file cache không tồn tại (hoặc không đọc/validate được)
//   - đã probe, không có GPU: file tồn tại, encoder === null
//   - đã probe, có GPU: file tồn tại, encoder là 1 trong GPU_CANDIDATES
// Cache hết hạn (TTL) hoặc ffmpeg đổi (fingerprint sai) → coi như chưa
// probe → probe lại thật. Xoá file cache không đổi kết quả render, chỉ
// làm render sau chậm lại (probe lại) — cache chỉ là tối ưu tốc độ.
// ---------------------------------------------------------------------------

/** TTL mặc định 30 ngày (đổi bằng env VCUT_GPU_PROBE_TTL_MS, chỉ để test). */
const GPU_PROBE_CACHE_TTL_MS_DEFAULT = 30 * 24 * 3600 * 1000;
const GPU_PROBE_CACHE_VERSION = 1;

/** TTL hiệu lực (ms). */
function gpuProbeCacheTtlMs() {
  const raw = Number(process.env.VCUT_GPU_PROBE_TTL_MS);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return GPU_PROBE_CACHE_TTL_MS_DEFAULT;
}

/**
 * Đường dẫn file cache: env VCUT_GPU_PROBE_CACHE (đường dẫn đầy đủ) hoặc
 * mặc định ~/.cache/vcut/gpu-probe.json; không có home → tmpdir.
 * Lưu ý: VCUT_GPU_PROBE_CACHE=0 có nghĩa TẮT cache (xem gpuProbeCacheEnabled),
 * không phải đường dẫn — hàm này không được gọi khi cache đã tắt.
 */
function getGpuProbeCachePath() {
  if (process.env.VCUT_GPU_PROBE_CACHE && process.env.VCUT_GPU_PROBE_CACHE !== "0") {
    return process.env.VCUT_GPU_PROBE_CACHE;
  }
  const home = typeof os.homedir === "function" ? os.homedir() : "";
  if (home) return path.join(home, ".cache", "vcut", "gpu-probe.json");
  return path.join(os.tmpdir(), "vcut-gpu-probe.json");
}

/** Cache đĩa có bật không: tắt hẳn bằng env VCUT_GPU_PROBE_CACHE=0. */
function gpuProbeCacheEnabled() {
  return process.env.VCUT_GPU_PROBE_CACHE !== "0";
}

/**
 * Fingerprint rẻ của binary ffmpeg (không spawn process — chỉ stat file):
 * đường dẫn đã resolve + size + mtime. Đổi ffmpeg (cài lại/nâng cấp) thì
 * size/mtime đổi → cache coi như hết hạn → probe lại. Bare name "ffmpeg"
 * được resolve bằng cách quét PATH bằng fs (không spawn `which`).
 * Trả null khi không stat được (ffmpeg không tồn tại) → cache MISS.
 */
function ffmpegFingerprint(ffmpeg) {
  try {
    let resolved = ffmpeg;
    if (!ffmpeg.includes(path.sep)) {
      const dirs = (process.env.PATH || "").split(path.delimiter);
      let found = null;
      for (const d of dirs) {
        if (!d) continue;
        const cand = path.join(d, ffmpeg);
        try {
          const st = fs.statSync(cand);
          if (st.isFile()) { found = cand; break; }
        } catch { /* không phải ứng viên */ }
      }
      if (!found) return null;
      resolved = found;
    }
    const st = fs.statSync(resolved);
    if (!st.isFile()) return null;
    return { resolved, size: st.size, mtimeMs: st.mtimeMs };
  } catch {
    return null;
  }
}

/**
 * Đọc + validate cache đĩa.
 * @returns {object|null} kết quả probe đã cache ({encoder, tried, detail, probedAtMs, ...})
 *   hoặc null khi MISS (chưa probe / hết TTL / sai fingerprint / file hỏng).
 *   Không bao giờ throw — mọi lỗi đọc đều là MISS.
 */
function readGpuProbeCache(cachePath, ffmpeg, ttlMs) {
  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    const data = JSON.parse(raw);
    if (!data || data.version !== GPU_PROBE_CACHE_VERSION) return null;
    if (!(data.encoder === null || GPU_CANDIDATES.includes(data.encoder))) return null;
    if (!Array.isArray(data.tried) || typeof data.detail !== "string") return null;
    if (typeof data.probedAtMs !== "number" || !Number.isFinite(data.probedAtMs)) return null;
    const ttl = ttlMs !== undefined ? ttlMs : gpuProbeCacheTtlMs();
    if (Date.now() - data.probedAtMs >= ttl) return null; // hết TTL → probe lại
    const fp = ffmpegFingerprint(ffmpeg);
    if (!fp) return null; // không stat được ffmpeg → không tin cache
    if (data.ffmpegResolved !== fp.resolved || data.ffmpegSize !== fp.size
      || data.ffmpegMtimeMs !== fp.mtimeMs) return null; // ffmpeg đã đổi
    return {
      encoder: data.encoder, tried: data.tried, detail: data.detail,
      probedAtMs: data.probedAtMs,
    };
  } catch {
    return null;
  }
}

/**
 * Ghi kết quả probe xuống đĩa (ghi file tạm + rename, như trfCache.js —
 * không để file nửa chừng trong cache). Best-effort: lỗi ghi (không có
 * quyền, đĩa đầy...) chỉ bỏ qua, không bao giờ fail render vì cache.
 */
function writeGpuProbeCache(cachePath, result, ffmpeg) {
  try {
    const fp = ffmpegFingerprint(ffmpeg);
    const data = {
      version: GPU_PROBE_CACHE_VERSION,
      probedAt: new Date().toISOString(),
      probedAtMs: Date.now(),
      ffmpeg: String(ffmpeg),
      ffmpegResolved: fp ? fp.resolved : null,
      ffmpegSize: fp ? fp.size : null,
      ffmpegMtimeMs: fp ? fp.mtimeMs : null,
      encoder: result.encoder,
      tried: result.tried,
      detail: result.detail,
    };
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    const tmp = `${cachePath}.tmp-${process.pid}`;
    writeFileEpermRetry(tmp, JSON.stringify(data, null, 2), { label: "render-gpu-probe-cache" });
    fs.renameSync(tmp, cachePath);
    return true;
  } catch {
    return false;
  }
}

/** Xoá file cache (ép probe lại lần sau). Best-effort, trả true nếu đã xoá. */
function clearGpuProbeCache(cachePath) {
  try {
    fs.unlinkSync(cachePath || getGpuProbeCachePath());
    return true;
  } catch {
    return false;
  }
}

/**
 * Probe GPU encoder có cache đĩa (hàm render.js gọi — đường auto).
 * Thứ tự: cache trong process → cache đĩa → probe thật (+ ghi cache đĩa).
 * @param {string} ffmpeg đường dẫn ffmpeg
 * @param {object} [opts]
 * @param {Function} [opts.tryFn] inject để test (chỉ test dùng)
 * @param {boolean} [opts.forceReprobe] bỏ qua cả 2 lớp cache, probe lại thật
 * @param {boolean} [opts.cacheEnabled] false = tắt cache đĩa (mặc định true;
 *   env VCUT_GPU_PROBE_CACHE=0 cũng tắt)
 * @param {string} [opts.cachePath] đường dẫn file cache (mặc định getGpuProbeCachePath())
 * @param {number} [opts.ttlMs] TTL cache (mặc định 30 ngày)
 * @returns {{encoder: string|null, tried: string[], detail: string,
 *   cached: boolean, source: "memory"|"disk"|"probe"}}
 *   cached=true + source="disk"|"memory" nghĩa là KHÔNG probe lại.
 */
function probeGpuEncoderCached(ffmpeg, opts) {
  const o = opts || {};
  const tryFn = o.tryFn || undefined;
  const cacheEnabled = o.cacheEnabled !== false && gpuProbeCacheEnabled();
  const cachePath = o.cachePath || getGpuProbeCachePath();
  const ttlMs = o.ttlMs !== undefined ? o.ttlMs : gpuProbeCacheTtlMs();

  if (probeCache && !tryFn && !o.forceReprobe) {
    return { ...probeCache, cached: true, source: "memory" };
  }
  if (cacheEnabled && !o.forceReprobe) {
    const hit = readGpuProbeCache(cachePath, ffmpeg, ttlMs);
    if (hit) {
      if (!tryFn) probeCache = hit;
      return { ...hit, cached: true, source: "disk" };
    }
  }
  const res = probeGpuEncoder(ffmpeg, tryFn);
  if (cacheEnabled) writeGpuProbeCache(cachePath, res, ffmpeg);
  return { ...res, cached: false, source: "probe" };
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
    default: {
      // Đợt 80 H10 (S4): trần bitrate video (VBV maxrate) cho preset
      // mạng xã hội — CRF giữ chất lượng, maxrate kẹp trần (bufsize =
      // 2× maxrate, tỉ lệ chuẩn cho VBV 1-pass). Chỉ libx264: NVENC
      // dùng -cq (không có VBV tương đương trong hàm này), QSV/VAAPI
      // dùng quality/qp riêng — các encoder GPU BỎ QUA maxrate (ghi rõ
      // trong LIMITS đợt 80 H10; preset xã hội render CPU là chủ yếu).
      const args = ["-c:v", "libx264", "-preset", preset, "-crf", String(crf)];
      const maxrate = opts.maxrateKbps;
      if (typeof maxrate === "number" && Number.isInteger(maxrate) && maxrate > 0) {
        args.push("-maxrate", `${maxrate}k`, "-bufsize", `${maxrate * 2}k`);
      }
      return {
        args,
        pixFmt: "yuv420p", needsHwupload: false,
      };
    }
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

  // Đợt 80 H10 (S4): maxrate kẹp VBV bên cạnh CRF (bufsize = 2× maxrate).
  const xMax = buildVideoEncodeArgs("libx264", { crf: 20, preset: "medium", maxrateKbps: 8000 });
  assert.deepStrictEqual(xMax.args, ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "8000k", "-bufsize", "16000k"]);
  // maxrate vắng / sai kiểu / <= 0 → không thêm cờ (CRF-only như trước).
  assert.deepStrictEqual(buildVideoEncodeArgs("libx264", { crf: 20, preset: "medium", maxrateKbps: null }).args, x.args);
  assert.deepStrictEqual(buildVideoEncodeArgs("libx264", { crf: 20, preset: "medium", maxrateKbps: "8000" }).args, x.args);
  assert.deepStrictEqual(buildVideoEncodeArgs("libx264", { crf: 20, preset: "medium", maxrateKbps: 0 }).args, x.args);
  // Encoder GPU bỏ qua maxrate (chưa có VBV tương đương trong hàm này).
  const nvMax = buildVideoEncodeArgs("h264_nvenc", { crf: 20, preset: "medium", maxrateKbps: 8000 });
  assert.deepStrictEqual(nvMax.args, ["-c:v", "h264_nvenc", "-preset", "p5", "-cq", "20"]);

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

  // --- Đợt 64 R1: cache đĩa (dùng thư mục tạm, không đụng cache thật) ---
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-gpu-probe-test-"));
  const cachePath = path.join(tmpDir, "gpu-probe.json");
  const fakeTryQsv = (ff, enc) => enc === "h264_qsv";
  // MISS lần đầu (chưa có file) → probe thật bằng tryFn giả → ghi cache.
  const c1 = probeGpuEncoderCached("ffmpeg", { tryFn: fakeTryQsv, cachePath });
  assert.strictEqual(c1.encoder, "h264_qsv");
  assert.strictEqual(c1.cached, false);
  assert.strictEqual(c1.source, "probe");
  assert.ok(fs.existsSync(cachePath), "probe xong phải ghi file cache");
  // HIT lần 2: tryFn cố tình trả khác (null) nhưng cache phải thắng.
  const c2 = probeGpuEncoderCached("ffmpeg", { tryFn: () => false, cachePath });
  assert.strictEqual(c2.encoder, "h264_qsv", "cache HIT phải trả kết quả cũ, không probe lại");
  assert.strictEqual(c2.cached, true);
  assert.strictEqual(c2.source, "disk");
  // Phân biệt "đã probe: không có GPU" vs "chưa probe": cache encoder=null.
  const nullPath = path.join(tmpDir, "gpu-probe-null.json");
  const n1 = probeGpuEncoderCached("ffmpeg", { tryFn: () => false, cachePath: nullPath });
  assert.strictEqual(n1.encoder, null);
  assert.strictEqual(n1.cached, false);
  const n2 = probeGpuEncoderCached("ffmpeg", { tryFn: fakeTryQsv, cachePath: nullPath });
  assert.strictEqual(n2.encoder, null, "cache null HIT: đã probe không GPU, không probe lại");
  assert.strictEqual(n2.cached, true);
  assert.strictEqual(n2.source, "disk");
  // Ép probe lại: forceReprobe bỏ qua cache, tryFn mới thắng.
  const c3 = probeGpuEncoderCached("ffmpeg", { tryFn: () => false, cachePath, forceReprobe: true });
  assert.strictEqual(c3.encoder, null);
  assert.strictEqual(c3.cached, false);
  assert.strictEqual(c3.source, "probe");
  // Hết TTL → MISS (ttlMs=0 ép hết hạn ngay).
  const c4 = probeGpuEncoderCached("ffmpeg", { tryFn: fakeTryQsv, cachePath, ttlMs: 0 });
  assert.strictEqual(c4.cached, false, "hết TTL phải probe lại");
  assert.strictEqual(c4.encoder, "h264_qsv");
  // File hỏng → MISS, không throw.
  fs.writeFileSync(cachePath, "{json hỏng", "utf8");
  const c5 = probeGpuEncoderCached("ffmpeg", { tryFn: fakeTryQsv, cachePath });
  assert.strictEqual(c5.cached, false);
  assert.strictEqual(c5.encoder, "h264_qsv");
  // Tắt cache đĩa → luôn probe, không ghi file.
  const offPath = path.join(tmpDir, "gpu-probe-off.json");
  const c6 = probeGpuEncoderCached("ffmpeg", { tryFn: fakeTryQsv, cachePath: offPath, cacheEnabled: false });
  assert.strictEqual(c6.cached, false);
  assert.ok(!fs.existsSync(offPath), "tắt cache thì không được ghi file");
  // clearGpuProbeCache: xoá xong lần sau MISS.
  assert.strictEqual(clearGpuProbeCache(cachePath), true);
  assert.ok(!fs.existsSync(cachePath));
  const c7 = probeGpuEncoderCached("ffmpeg", { tryFn: () => false, cachePath });
  assert.strictEqual(c7.cached, false);
  assert.strictEqual(c7.encoder, null);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("   cache đĩa: MISS/HIT/null/force/TTL/file hỏng/tắt/xoá đều đúng");
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
  probeGpuEncoderCached,
  getGpuProbeCachePath,
  gpuProbeCacheEnabled,
  gpuProbeCacheTtlMs,
  readGpuProbeCache,
  writeGpuProbeCache,
  clearGpuProbeCache,
  ffmpegFingerprint,
  buildVideoEncodeArgs,
  tryEncode,
};
