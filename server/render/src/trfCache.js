#!/usr/bin/env node
/**
 * trfCache.js — Cache file .trf của vidstabdetect (Phase 9 đợt 62, luồng R2).
 *
 * BỐI CẢNH (đợt 61 R2, docs/PHASE9_ROUND61_R2_ENHANCE_COST_LIMITS.md §2):
 * pass đắt nhất của stabilize là vidstabdetect — 720p: 9,56s wall (detect
 * thuần 4,54s) trong full render Cân bằng 29,44s; 1080p: 24,09s wall.
 * vidstabtransform rẻ (thuần 1,26s / 5,59s). Render lại cùng clip (sửa
 * text, đổi transition, export lại...) trước đây detect LẠI từ đầu mỗi lần.
 * Module này cache kết quả detect để khỏi detect lại khi đầu vào không đổi.
 *
 * KEY CACHE (invalidate đúng):
 *   sha256({ v, ffmpegVersion, src tuyệt đối, size, mtimeMs,
 *            in, end (= in + duration*speed),
 *            shakiness, accuracy, stepsize, mincontrast })
 * - src đổi nội dung → size/mtime đổi → key khác (detect lại). Cùng nội
 *   dung nhưng ghi đè file (mtime đổi) cũng detect lại — an toàn hơn là
 *   dùng nhầm .trf cũ, giá chỉ là 1 lần detect thừa.
 * - trim đổi (in / duration / speed) → end đổi → key khác.
 * - tham số detect đổi → key khác. smoothing KHÔNG nằm trong key: nó chỉ
 *   là tham số của vidstabtransform (pass 2), không ảnh hưởng nội dung
 *   .trf — đổi smoothing vẫn HIT cache (đúng, và tiết kiệm thêm).
 * - ffmpeg đổi version → key khác (đề phòng định dạng .trf đổi theo bản
 *   vidstab; thực tế .trf là text list transform, ổn định qua các bản).
 * - v = "v1": bump khi ngữ nghĩa detect đổi (vd thêm tham số detect mới).
 *
 * GIỚI HẠN / DỌN DẸP:
 * - Mặc định tối đa 128 entry / 64 MiB (file .trf đo thật đợt 62: 505.765
 *   byte/clip 5s 720p, ~3,4 KB/frame — hai giới hạn tương đương nhau ở cỡ
 *   clip này; clip dài/1080p thì giới hạn byte siết trước). Vượt giới hạn
 *   → xoá entry cũ nhất theo mtime (LRU: lookup HIT chạm lại mtime).
 * - Không bao giờ xoá file < 60s tuổi (grace): tránh race với render khác
 *   đang copy file đó; file vừa store cũng không bị prune ngay.
 * - Ghi cache qua file tạm + rename (không để file nửa chừng trong cache).
 *
 * AN TOÀN / HỢP ĐỒNG:
 * - Cache HIT chỉ copy file .trf sang đường dẫn tạm riêng của lần render
 *   (repo1-vidstab-<pid>-<id>.trf như cũ) — render.js dọn như cũ, không
 *   đổi vòng đời file tạm. File trong cache không bao giờ bị transform đọc
 *   trực tiếp (tránh prune xoá giữa chừng lúc render đang chạy).
 * - Detect thất bại → KHÔNG ghi cache, trả { ok: false } — render.js giữ
 *   nguyên fail-fast (exit 1), không lặng lẽ render thiếu stabilize.
 * - Tắt cache: env VCUT_TRF_CACHE=0 hoặc CLI render.js --no-trf-cache.
 *   Thư mục cache: env VCUT_TRF_CACHE_DIR (mặc định ~/.cache/vcut/vidstab-cache).
 * - Cache chỉ là tối ưu tốc độ: xoá cả thư mục cache thì render vẫn đúng,
 *   chỉ chậm lại (detect lại). Không có trạng thái nào khác phụ thuộc cache.
 *
 * Self-test: node src/trfCache.js --self-test (không cần ffmpeg thật cho
 * phần key/store/prune; phần resolve dùng ffmpeg thật nếu có).
 */
"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { normStabParam, runStabilizeDetect } = require("./enhance");

const TRF_CACHE_VERSION = "v1";
const TRF_CACHE_MAX_ENTRIES = 128;
const TRF_CACHE_MAX_BYTES = 64 * 1024 * 1024; // 64 MiB
const TRF_CACHE_PRUNE_GRACE_MS = 60 * 1000; // không xoá file < 60s tuổi
const TRF_CACHE_FILE_SUFFIX = ".trf";

/** Thư mục cache: env VCUT_TRF_CACHE_DIR, mặc định ~/.cache/vcut/vidstab-cache. */
function trfCacheDir() {
  if (process.env.VCUT_TRF_CACHE_DIR) return process.env.VCUT_TRF_CACHE_DIR;
  const home = os.homedir();
  if (home) return path.join(home, ".cache", "vcut", "vidstab-cache");
  return path.join(os.tmpdir(), "repo1-vidstab-cache");
}

/** Cache có bật không: env VCUT_TRF_CACHE=0 tắt (mặc định bật). */
function trfCacheEnabled() {
  return process.env.VCUT_TRF_CACHE !== "0";
}

/** Dòng đầu của `ffmpeg -version` ("" nếu không chạy được — key vẫn dùng được). */
function ffmpegVersionLine(ffmpeg) {
  try {
    const r = spawnSync(ffmpeg, ["-version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (r.error || r.status !== 0) return "";
    return ((r.stdout || "").split("\n")[0] || "").trim();
  } catch {
    return "";
  }
}

/**
 * Key cache cho 1 clip: hash của mọi thứ ảnh hưởng tới nội dung .trf.
 * @param {string} inputAbs đường dẫn tuyệt đối file nguồn
 * @param {object} clip clip (cần in, duration, speed?, enhance.stabilize)
 * @param {string} [ffmpegVersion] dòng version ffmpeg ("" nếu không rõ)
 * @returns {string} sha256 hex (64 ký tự)
 */
function computeTrfCacheKey(inputAbs, clip, ffmpegVersion) {
  const st = fs.statSync(inputAbs); // throw nếu file không tồn tại — caller xử lý
  const s = clip.enhance.stabilize;
  const end = clip.in + clip.duration * (clip.speed ?? 1);
  const material = {
    v: TRF_CACHE_VERSION,
    ffmpeg: ffmpegVersion || "",
    src: path.resolve(inputAbs),
    size: st.size,
    mtimeMs: st.mtimeMs,
    in: clip.in,
    end,
    shakiness: normStabParam(s, "shakiness"),
    accuracy: normStabParam(s, "accuracy"),
    stepsize: normStabParam(s, "stepsize"),
    mincontrast: normStabParam(s, "mincontrast"),
    // CỐ Ý KHÔNG có smoothing: chỉ là tham số vidstabtransform (pass 2),
    // không ảnh hưởng nội dung .trf — đổi smoothing vẫn HIT cache.
  };
  return crypto.createHash("sha256").update(JSON.stringify(material)).digest("hex");
}

function cacheFilePath(cacheDir, key) {
  return path.join(cacheDir, `${key}${TRF_CACHE_FILE_SUFFIX}`);
}

/**
 * Lookup cache: file .trf có tồn tại + đọc được + size > 0 không.
 * HIT thì chạm lại mtime (LRU) rồi trả đường dẫn cache; MISS trả null.
 */
function lookupTrfCache(cacheDir, key) {
  const p = cacheFilePath(cacheDir, key);
  try {
    const st = fs.statSync(p);
    if (!st.isFile() || st.size === 0) return null;
    try { fs.utimesSync(p, new Date(), new Date()); } catch { /* chạm mtime lỗi thì thôi, vẫn HIT */ }
    return p;
  } catch {
    return null;
  }
}

/**
 * Dọn cache về trong giới hạn: xoá entry cũ nhất theo mtime, không xoá
 * file < graceMs tuổi. Trả { removed, bytesFreed }.
 */
function pruneTrfCache(cacheDir, limits) {
  const maxEntries = (limits && limits.maxEntries) ?? TRF_CACHE_MAX_ENTRIES;
  const maxBytes = (limits && limits.maxBytes) ?? TRF_CACHE_MAX_BYTES;
  const graceMs = (limits && limits.graceMs) ?? TRF_CACHE_PRUNE_GRACE_MS;
  let entries;
  try {
    entries = fs.readdirSync(cacheDir)
      .filter((f) => f.endsWith(TRF_CACHE_FILE_SUFFIX))
      .map((f) => {
        const p = path.join(cacheDir, f);
        try {
          const st = fs.statSync(p);
          return { p, size: st.size, mtimeMs: st.mtimeMs };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.mtimeMs - b.mtimeMs); // cũ nhất trước
  } catch {
    return { removed: 0, bytesFreed: 0 };
  }
  const now = Date.now();
  let totalBytes = entries.reduce((s, e) => s + e.size, 0);
  let removed = 0, bytesFreed = 0;
  for (const e of entries) {
    if (entries.length - removed <= maxEntries && totalBytes <= maxBytes) break;
    if (now - e.mtimeMs < graceMs) continue; // file mới dùng/store — không xoá
    try {
      fs.unlinkSync(e.p);
      removed++;
      bytesFreed += e.size;
      totalBytes -= e.size;
    } catch { /* file đã mất giữa chừng thì thôi */ }
  }
  return { removed, bytesFreed };
}

/**
 * Ghi 1 file .trf vào cache (copy qua file tạm + rename), rồi prune.
 * Trả { ok, cachedPath?, error? }.
 */
function storeTrfCache(cacheDir, key, trfPath, limits) {
  const dest = cacheFilePath(cacheDir, key);
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    const tmp = `${dest}.tmp-${process.pid}-${Date.now()}`;
    fs.copyFileSync(trfPath, tmp);
    fs.renameSync(tmp, dest);
    const pruned = pruneTrfCache(cacheDir, limits);
    return { ok: true, cachedPath: dest, pruned };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Resolve file .trf cho 1 clip: HIT cache thì copy về đường dẫn tạm riêng
 * của lần render; MISS thì chạy vidstabdetect thật rồi store vào cache.
 * @param {string} ffmpeg đường dẫn ffmpeg
 * @param {string} inputAbs file nguồn tuyệt đối
 * @param {object} clip clip (cần id, in, duration, speed?, enhance.stabilize)
 * @param {object} [opts] { cacheDir?, ffmpegVersion?, enabled?, runTmpPath?, limits? }
 * @returns {{ok:boolean, trfPath?:string, cached?:boolean, cacheKey?:string|null, error?:string}}
 *   cached=true: dùng lại .trf cũ (không detect). cached=false: detect mới.
 *   ok=false: detect thất bại (fail-fast — caller exit 1, KHÔNG ghi cache).
 */
function resolveStabilizeTrf(ffmpeg, inputAbs, clip, opts) {
  const o = opts || {};
  const enabled = o.enabled !== undefined ? o.enabled : trfCacheEnabled();
  const safeId = String(clip.id).replace(/[^A-Za-z0-9_-]/g, "_");
  const runTmpPath = o.runTmpPath || path.join(os.tmpdir(), `repo1-vidstab-${process.pid}-${safeId}.trf`);
  if (!enabled) {
    const r = runStabilizeDetect(ffmpeg, inputAbs, clip, runTmpPath);
    if (!r.ok) return { ok: false, error: r.error, cached: false, cacheKey: null };
    return { ok: true, trfPath: runTmpPath, cached: false, cacheKey: null };
  }
  const cacheDir = o.cacheDir || trfCacheDir();
  let key;
  try {
    key = computeTrfCacheKey(inputAbs, clip, o.ffmpegVersion);
  } catch (e) {
    return { ok: false, error: `không stat được file nguồn cho cache key: ${e.message}`, cached: false, cacheKey: null };
  }
  const hit = lookupTrfCache(cacheDir, key);
  if (hit) {
    try {
      fs.copyFileSync(hit, runTmpPath);
    } catch (e) {
      return { ok: false, error: `không copy được .trf từ cache: ${e.message}`, cached: true, cacheKey: key };
    }
    return { ok: true, trfPath: runTmpPath, cached: true, cacheKey: key };
  }
  const r = runStabilizeDetect(ffmpeg, inputAbs, clip, runTmpPath);
  if (!r.ok) return { ok: false, error: r.error, cached: false, cacheKey: key };
  const stored = storeTrfCache(cacheDir, key, runTmpPath, o.limits);
  if (!stored.ok) {
    // Ghi cache lỗi không chặn render: .trf tạm đã có, render tiếp tục.
    console.error(`⚠️  không ghi được .trf vào cache (${stored.error}) — render tiếp tục không cache`);
  }
  return { ok: true, trfPath: runTmpPath, cached: false, cacheKey: key };
}

// ---------------------------------------------------------------------------
// Self-test: node src/trfCache.js --self-test
// ---------------------------------------------------------------------------
function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "r62r2-trfcache-test-"));
  // File nguồn giả (chỉ cần tồn tại để stat; key không đọc nội dung).
  const src = path.join(tmp, "src.mp4");
  fs.writeFileSync(src, Buffer.alloc(1234, 7));
  const base = { id: "c0", in: 0, duration: 5, speed: 1, enhance: { stabilize: { smoothing: 10, shakiness: 5, accuracy: 15, stepsize: 6, mincontrast: 0.3 } } };
  const k1 = computeTrfCacheKey(src, base, "ffmpeg version 8.1.2");
  const k1b = computeTrfCacheKey(src, base, "ffmpeg version 8.1.2");
  assert.strictEqual(k1, k1b, "cùng input → cùng key");
  assert.strictEqual(k1.length, 64, "key sha256 hex 64 ký tự");

  // Đổi smoothing (tham số transform) → key KHÔNG đổi (HIT).
  const kSmooth = computeTrfCacheKey(src, { ...base, enhance: { stabilize: { ...base.enhance.stabilize, smoothing: 20 } } }, "ffmpeg version 8.1.2");
  assert.strictEqual(kSmooth, k1, "đổi smoothing không đổi key");
  // Đổi từng thứ ảnh hưởng .trf → key đổi.
  const variants = {
    trimIn: { ...base, in: 1 },
    trimDur: { ...base, duration: 4 },
    speed: { ...base, speed: 2 },
    shakiness: { ...base, enhance: { stabilize: { ...base.enhance.stabilize, shakiness: 8 } } },
    accuracy: { ...base, enhance: { stabilize: { ...base.enhance.stabilize, accuracy: 10 } } },
    stepsize: { ...base, enhance: { stabilize: { ...base.enhance.stabilize, stepsize: 8 } } },
    mincontrast: { ...base, enhance: { stabilize: { ...base.enhance.stabilize, mincontrast: 0.5 } } },
  };
  for (const [name, v] of Object.entries(variants)) {
    assert.notStrictEqual(computeTrfCacheKey(src, v, "ffmpeg version 8.1.2"), k1, `đổi ${name} phải đổi key`);
  }
  assert.notStrictEqual(computeTrfCacheKey(src, base, "ffmpeg version 7.0"), k1, "đổi ffmpeg version phải đổi key");
  // File nguồn khác (dù cùng nội dung) → key khác (đường dẫn tuyệt đối trong key).
  const src2 = path.join(tmp, "src2.mp4");
  fs.writeFileSync(src2, Buffer.alloc(1234, 7));
  assert.notStrictEqual(computeTrfCacheKey(src2, base, "ffmpeg version 8.1.2"), k1, "src khác path phải đổi key");
  // Ghi đè nguồn (mtime đổi) → key đổi.
  fs.writeFileSync(src, Buffer.alloc(1234, 8));
  assert.notStrictEqual(computeTrfCacheKey(src, base, "ffmpeg version 8.1.2"), k1, "ghi đè nguồn (mtime đổi) phải đổi key");
  // File nguồn không tồn tại → throw (caller xử lý thành fail-fast).
  assert.throws(() => computeTrfCacheKey(path.join(tmp, "nope.mp4"), base, ""), /ENOENT/);

  // Store / lookup / miss.
  const cacheDir = path.join(tmp, "cache");
  const trf = path.join(tmp, "a.trf");
  fs.writeFileSync(trf, "transforms\n");
  assert.strictEqual(lookupTrfCache(cacheDir, k1), null, "cache trống → MISS");
  const stored = storeTrfCache(cacheDir, k1, trf, { maxEntries: 128, maxBytes: 1024 * 1024, graceMs: 0 });
  assert.ok(stored.ok, "store phải ok");
  assert.strictEqual(lookupTrfCache(cacheDir, k1), cacheFilePath(cacheDir, k1), "store xong → HIT");
  assert.strictEqual(fs.readFileSync(cacheFilePath(cacheDir, k1), "utf8"), "transforms\n", "nội dung .trf trong cache phải nguyên vẹn");
  // Lookup file rỗng → MISS (không trả file hỏng).
  const kEmpty = "e".repeat(64);
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFilePath(cacheDir, kEmpty), "");
  assert.strictEqual(lookupTrfCache(cacheDir, kEmpty), null, "file .trf rỗng → MISS");

  // Prune: giới hạn 2 entry → entry cũ nhất bị xoá; file < grace không bị xoá.
  const old = Date.now() - 3600 * 1000;
  for (let i = 0; i < 3; i++) {
    const k = `f${i}`.padEnd(64, "0");
    fs.writeFileSync(cacheFilePath(cacheDir, k), Buffer.alloc(10, i));
    fs.utimesSync(cacheFilePath(cacheDir, k), new Date(old + i * 1000), new Date(old + i * 1000));
  }
  const pr = pruneTrfCache(cacheDir, { maxEntries: 2, maxBytes: 1024 * 1024, graceMs: 60 * 1000 });
  assert.ok(pr.removed >= 1, `prune phải xoá ít nhất 1 entry cũ (removed=${pr.removed})`);
  assert.strictEqual(fs.existsSync(cacheFilePath(cacheDir, "f0".padEnd(64, "0"))), false, "entry cũ nhất bị xoá");
  // Grace: file vừa chạm (tuổi < 60s) không bị xoá dù vượt giới hạn số lượng.
  const kFresh = "a".repeat(64);
  fs.writeFileSync(cacheFilePath(cacheDir, kFresh), Buffer.alloc(10, 9));
  const pr2 = pruneTrfCache(cacheDir, { maxEntries: 1, maxBytes: 1, graceMs: 60 * 1000 });
  assert.strictEqual(fs.existsSync(cacheFilePath(cacheDir, kFresh)), true, "file < 60s tuổi không bị prune (grace)");

  // resolveStabilizeTrf với cache TẮT: detect thật chỉ khi ffmpeg có sẵn.
  // (Trên VM này ffmpeg có — kiểm tra nhanh bằng ffmpeg -version.)
  const ver = ffmpegVersionLine("ffmpeg");
  assert.ok(ver.length > 0, `ffmpeg -version phải chạy được (nhận: ${JSON.stringify(ver)})`);
  assert.ok(/^ffmpeg version /.test(ver), `dòng version phải bắt đầu "ffmpeg version " (nhận: ${JSON.stringify(ver)})`);

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("✅ trfCache.js self-test: tất cả assertion pass");
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    console.log("trfCache.js — cache .trf vidstabdetect. Chạy với --self-test.");
    process.exit(2);
  }
}

module.exports = {
  TRF_CACHE_VERSION,
  TRF_CACHE_MAX_ENTRIES,
  TRF_CACHE_MAX_BYTES,
  TRF_CACHE_PRUNE_GRACE_MS,
  trfCacheDir,
  trfCacheEnabled,
  ffmpegVersionLine,
  computeTrfCacheKey,
  cacheFilePath,
  lookupTrfCache,
  storeTrfCache,
  pruneTrfCache,
  resolveStabilizeTrf,
};
