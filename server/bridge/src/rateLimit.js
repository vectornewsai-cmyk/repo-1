"use strict";
/**
 * Đợt 64 R7 — Rate limiter sliding-window (thay fixed-window R1-040).
 * Đợt 65 S5 — thêm global cap + persist qua restart + siết env số còn lại.
 *
 * Quirk còn lại sau đợt 63 R5 (R5 chỉ sửa đếm 2 lần — xem
 * docs/PHASE9_ROUND63_R5_SERVER_LITERALS_LIMITS.md §4; §8 của R5 KHÔNG
 * ghi quirk Map bucket nào chưa sửa): bucket fixed-window `{count,
 * resetAt}` cho phép burst 2×max quanh biên cửa sổ — vd max=4: 4 request
 * cuối cửa sổ N + 4 request đầu cửa sổ N+1 = 7–8 request được chấp nhận
 * trong một cửa sổ trượt 60s (đo thật bằng bridge, xem LIMITS đợt này).
 * Module này giữ nguyên Map bucket theo `${scope}:${ip}` (ngữ nghĩa R5:
 * general/render/silence tách budget) nhưng mỗi bucket lưu danh sách
 * thời điểm (ms) của các request ĐÃ ĐƯỢC CHẤP NHẬN trong cửa sổ trượt;
 * request chỉ qua khi số mốc trong `(now-windowMs, now]` < max.
 *
 * Đợt 65 S5 — global cap: ngoài budget từng bucket, còn một budget TỔNG
 * (mọi scope + mọi IP cộng lại trong cùng cửa sổ trượt). Một request chỉ
 * được chấp nhận khi cả hai đều còn slot. Global cap chặn được kiểu tấn
 * công đổi IP / nhiều IP cùng hammer — điều per-IP bucket không chặn được
 * (xem docs/PHASE9_ROUND65_S5_LIMITS.md §1). Mặc định 600 req/cửa sổ
 * (env BRIDGE_RATE_GLOBAL); 0 hoặc không đặt = tắt global cap.
 *
 * Đợt 65 S5 — persist: trạng thái limiter (mốc từng bucket + mốc global)
 * được lưu đĩa (JSON, ghi tạm + rename) định kỳ và khi tắt graceful, nạp
 * lại lúc khởi động; mốc đã hết hạn bị loại lúc lưu và lúc nạp. File hỏng
 * / không đọc được → bỏ qua + cảnh báo, limiter chạy tiếp từ trạng thái
 * rỗng (fail-open có chủ ý, không crash bridge). Đường dẫn mặc định
 * ~/.cache/vcut/rate-limit.json (env BRIDGE_RATE_PERSIST_PATH).
 *
 * Tính chất khóa bằng test (test-rate-limit.cjs):
 *  - Trong BẤT KỲ cửa sổ trượt windowMs nào cũng ≤ max request được chấp
 *    nhận (không còn burst biên); request hợp lệ đúng lúc vẫn qua.
 *  - Request bị 429 KHÔNG ghi mốc → không giữ cửa sổ đầy vĩnh viễn và
 *    không làm mảng bucket phình (kẻ hammer 1000 lần vẫn chỉ ≤ max mốc).
 *  - Bucket rỗng sau khi mọi mốc hết hạn + sweep → không rò rỉ Map.
 *  - Retry-After = thời gian tới khi mốc cũ nhất hết hạn (slot đầu tiên
 *    mở ra), luôn ≥ 1s; message 429 giữ nguyên từng byte như cũ.
 *  - (S5) Global cap: tổng số request được chấp nhận trên MỌI bucket
 *    trong bất kỳ cửa sổ trượt nào cũng ≤ globalMax; request bị chặn bởi
 *    global cap không ghi mốc vào bucket của nó.
 *  - (S5) Persist: save → tạo limiter mới cùng file → bucket + global
 *    khôi phục đúng; mốc hết hạn không hồi sinh sau restart.
 */
const fs = require("fs");
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port CJS của
// apps/web/scripts/eperm-retry.mjs; xem server/eperm-retry.cjs).
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const { apiError } = require("./errorCodes");

/** Đường dẫn persist mặc định (theo mẫu gpu-probe.json đợt 64 R1). */
function defaultPersistPath() {
  const home = os.homedir && os.homedir();
  if (home) return path.join(home, ".cache", "vcut", "rate-limit.json");
  return path.join(os.tmpdir(), "vcut-rate-limit.json");
}

/**
 * Parse giới hạn từ biến môi trường: chỉ nhận số nguyên > 0, còn lại
 * (NaN, 0, âm, rỗng) trả về fallback. Trước đây `parseInt("abc")` = NaN
 * khiến `count > NaN` luôn false → limiter CHẾT HẲN mà không báo gì
 * (đo thật: BRIDGE_RATE_GENERAL=abc, 130 request đều 200).
 *
 * Lưu ý trung thực (đợt 64 R7 §6.3, giữ nguyên): `parseInt` vẫn nhận
 * tiền tố số ("4.9" → 4, "120abc" → 120). Chưa siết thành "số nguyên
 * thuần" để tránh đổi hành vi với env đang chạy.
 */
function parseRateLimitInt(raw, fallback) {
  if (raw === undefined || raw === null) return fallback;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * @param {object} [opts]
 * @param {number} [opts.windowMs=60000] độ dài cửa sổ trượt (ms).
 * @param {() => number} [opts.now=Date.now] đồng hồ (test chích fake clock).
 * @param {number} [opts.sweepIntervalMs=windowMs] chu kỳ dọn bucket hết
 *   hạn; 0 = không chạy sweep (test tự gọi prune()).
 * @param {number} [opts.globalMax=0] giới hạn TỔNG số request được chấp
 *   nhận trên mọi bucket trong một cửa sổ trượt; 0 = tắt global cap.
 * @param {string} [opts.persistPath] file JSON lưu trạng thái; không đặt
 *   = không persist.
 * @param {number} [opts.persistIntervalMs=5000] chu kỳ lưu đĩa định kỳ
 *   (chỉ khi persistPath được đặt); 0 = chỉ lưu khi flush()/destroy().
 */
function createRateLimiter(opts = {}) {
  const windowMs = opts.windowMs || 60 * 1000;
  const nowFn = opts.now || Date.now;
  const sweepIntervalMs = opts.sweepIntervalMs === undefined ? windowMs : opts.sweepIntervalMs;
  const globalMax = Number.isInteger(opts.globalMax) && opts.globalMax > 0 ? opts.globalMax : 0;
  const persistPath = typeof opts.persistPath === "string" && opts.persistPath.length > 0
    ? opts.persistPath : null;
  const persistIntervalMs = opts.persistIntervalMs === undefined ? 5000 : opts.persistIntervalMs;

  /** @type {Map<string, number[]>} key `${scope}:${ip}` → mốc ms đã chấp nhận (tăng dần). */
  const buckets = new Map();
  /** @type {number[]} mốc ms của MỌI request đã chấp nhận, mọi bucket (tăng dần). */
  const globalMarks = [];
  /** true khi có mốc mới chưa lưu đĩa (để save định kỳ khỏi ghi thừa). */
  let dirty = false;

  /** Cắt mốc hết hạn khỏi một mảng mốc (in-place), trả về số mốc còn lại. */
  function pruneMarks(arr, t) {
    const cutoff = t - windowMs;
    let i = 0;
    while (i < arr.length && arr[i] <= cutoff) i++;
    if (i > 0) arr.splice(0, i);
    return arr.length;
  }

  /** Xóa mốc hết hạn trong mọi bucket; xóa bucket rỗng. Trả về số bucket còn lại. */
  function prune(nowMs) {
    const t = nowMs === undefined ? nowFn() : nowMs;
    for (const [k, arr] of buckets) {
      pruneMarks(arr, t);
      if (arr.length === 0) buckets.delete(k);
    }
    pruneMarks(globalMarks, t);
    return buckets.size;
  }

  let sweepTimer = null;
  if (sweepIntervalMs > 0) {
    sweepTimer = setInterval(prune, sweepIntervalMs);
    if (typeof sweepTimer.unref === "function") sweepTimer.unref();
  }

  // --- Persist (đợt 65 S5) -------------------------------------------------
  /** Ghi trạng thái xuống đĩa (ghi tạm + rename). Best-effort: lỗi thì cảnh báo, không throw. */
  function save() {
    if (!persistPath) return false;
    try {
      const t = nowFn();
      const stateBuckets = {};
      for (const [k, arr] of buckets) {
        pruneMarks(arr, t);
        if (arr.length > 0) stateBuckets[k] = arr.slice();
      }
      pruneMarks(globalMarks, t);
      const payload = JSON.stringify({
        version: 1,
        savedAt: t,
        windowMs,
        buckets: stateBuckets,
        global: globalMarks.slice(),
      });
      fs.mkdirSync(path.dirname(persistPath), { recursive: true });
      const tmp = `${persistPath}.tmp-${process.pid}`;
      writeFileEpermRetry(tmp, payload, { label: "bridge-rate-limit-state" });
      fs.renameSync(tmp, persistPath);
      dirty = false;
      return true;
    } catch (err) {
      console.error(`[rate-limit] không lưu được trạng thái xuống ${persistPath}: ${err && err.message || err}`);
      return false;
    }
  }

  /** Nạp trạng thái từ đĩa (chỉ mốc còn hạn trong cửa sổ). File hỏng → rỗng + cảnh báo. */
  function load() {
    if (!persistPath) return false;
    let raw;
    try {
      raw = fs.readFileSync(persistPath, "utf8");
    } catch (err) {
      if (err && err.code !== "ENOENT") {
        console.error(`[rate-limit] không đọc được trạng thái từ ${persistPath}: ${err.message}`);
      }
      return false;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error(`[rate-limit] file trạng thái ${persistPath} hỏng (không phải JSON) — bỏ qua, chạy từ trạng thái rỗng.`);
      return false;
    }
    if (!data || data.version !== 1 || typeof data.buckets !== "object" || !Array.isArray(data.global)) {
      console.error(`[rate-limit] file trạng thái ${persistPath} sai định dạng (version/buckets/global) — bỏ qua.`);
      return false;
    }
    const t = nowFn();
    const cutoff = t - windowMs;
    let restoredBuckets = 0;
    let restoredMarks = 0;
    for (const [k, arr] of Object.entries(data.buckets)) {
      if (typeof k !== "string" || !Array.isArray(arr)) continue;
      const marks = arr.filter((m) => Number.isFinite(m) && m > cutoff && m <= t).sort((a, b) => a - b);
      if (marks.length > 0) {
        buckets.set(k, marks);
        restoredBuckets++;
        restoredMarks += marks.length;
      }
    }
    const g = data.global.filter((m) => Number.isFinite(m) && m > cutoff && m <= t).sort((a, b) => a - b);
    globalMarks.push(...g);
    dirty = false;
    if (restoredMarks > 0 || g.length > 0) {
      console.log(`[rate-limit] đã nạp ${restoredMarks} mốc (${restoredBuckets} bucket) + ${g.length} mốc global từ ${persistPath}.`);
    }
    return true;
  }

  let persistTimer = null;
  if (persistPath && persistIntervalMs > 0) {
    persistTimer = setInterval(() => { if (dirty) save(); }, persistIntervalMs);
    if (typeof persistTimer.unref === "function") persistTimer.unref();
  }

  /** Lưu ngay xuống đĩa (dùng khi tắt graceful). Trả về true nếu đã lưu. */
  function flush() {
    return save();
  }

  // Nạp trạng thái cũ (nếu có) ngay khi tạo limiter.
  load();

  /**
   * Middleware Express: `max` request được chấp nhận mỗi `windowMs`
   * cho mỗi (scope, IP), VÀ tổng mọi bucket không vượt `globalMax`
   * (khi global cap bật). Giữ nguyên header + payload 429 như bản cũ.
   */
  function rateLimit(max, scope) {
    return (req, res, next) => {
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      const key = `${scope || "default"}:${ip}`;
      const t = nowFn();
      let arr = buckets.get(key);
      if (!arr) {
        arr = [];
        buckets.set(key, arr);
      }
      pruneMarks(arr, t);
      if (globalMax > 0) pruneMarks(globalMarks, t);
      res.setHeader("X-RateLimit-Limit", String(max));
      if (globalMax > 0) {
        res.setHeader("X-RateLimit-Global-Remaining", String(Math.max(0, globalMax - globalMarks.length)));
      }
      // Slot đầu tiên mở ra khi mốc cũ nhất hết hạn (của limiter đang chặn).
      let retryAfter = null;
      if (arr.length >= max) {
        retryAfter = Math.max(1, Math.ceil((arr[0] + windowMs - t) / 1000));
      }
      if (globalMax > 0 && globalMarks.length >= globalMax) {
        const globalRetry = Math.max(1, Math.ceil((globalMarks[0] + windowMs - t) / 1000));
        retryAfter = retryAfter === null ? globalRetry : Math.min(retryAfter, globalRetry);
      }
      if (retryAfter !== null) {
        res.setHeader("X-RateLimit-Remaining", "0");
        if (globalMax > 0) res.setHeader("X-RateLimit-Global-Remaining", "0");
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json(apiError(
          "RATE_LIMITED",
          `Quá nhiều request — thử lại sau ${retryAfter}s.`,
          { retryAfter },
        ));
      }
      arr.push(t);
      if (globalMax > 0) globalMarks.push(t);
      dirty = true;
      res.setHeader("X-RateLimit-Remaining", String(max - arr.length));
      if (globalMax > 0) {
        res.setHeader("X-RateLimit-Global-Remaining", String(globalMax - globalMarks.length));
      }
      next();
    };
  }

  function destroy() {
    if (sweepTimer !== null) clearInterval(sweepTimer);
    sweepTimer = null;
    if (persistTimer !== null) clearInterval(persistTimer);
    persistTimer = null;
    try { save(); } catch { /* best-effort */ }
    buckets.clear();
    globalMarks.length = 0;
  }

  return { rateLimit, buckets, globalMarks, prune, destroy, save, load, flush };
}

module.exports = { createRateLimiter, parseRateLimitInt, defaultPersistPath };
