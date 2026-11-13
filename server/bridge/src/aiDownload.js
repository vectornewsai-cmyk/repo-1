"use strict";
/**
 * aiDownload.js — File kết quả dùng một lần cho job AI stream (đợt 80 H8,
 * gap N4).
 *
 * Vì sao cần: /api/tts và /api/bgremove trước đây trả file trực tiếp qua
 * res.download nên KHÔNG stream được tiến trình trong cùng 1 response.
 * Nay 2 route này stream NDJSON (phase/progress → done) và event `done`
 * mang `downloadUrl`; client fetch URL đó để lấy file. Module này giữ file
 * kết quả dưới WORK_ROOT/ai-downloads/<token>/ và phục vụ 1 lần:
 *
 *   - token = 16 ký tự hex (newJobId của jobQueue.js), không đoán được.
 *   - GET /api/ai-download/:token → res.download(file) rồi XÓA thư mục
 *     ngay trong callback (kể cả khi download lỗi giữa chừng — file lỗi
 *     không được giữ lại để ai tải lại nhầm).
 *   - Token sai định dạng → 400; không có file → 404 (không lộ đường dẫn).
 *   - Sweep định kỳ (unref, 30 phút) xóa token quá 2h chưa ai tải — tránh
 *     file mồ côi khi client đóng tab sau `done` mà không tải.
 *   - Tên file tải về do bridge đặt (không lấy từ client); content-type
 *     theo đuôi (.wav/.mov/.mp4) từ whitelist nhỏ.
 */

const fs = require("fs");
const path = require("path");
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port CJS của
// apps/web/scripts/eperm-retry.mjs; xem server/eperm-retry.cjs).
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const { newJobId } = require("./jobQueue");

/** Token hợp lệ: đúng 16 ký tự hex do newJobId() tạo. */
const TOKEN_RE = /^[0-9a-f]{16}$/;

/** TTL của file chờ tải (ms): quá hạn thì sweep xóa. */
const DOWNLOAD_TTL_MS = 2 * 60 * 60 * 1000;
/** Chu kỳ sweep (ms). */
const SWEEP_INTERVAL_MS = 30 * 60 * 1000;

/** Thư mục gốc chứa các token download. */
function downloadsRoot(workRoot) {
  return path.join(workRoot, "ai-downloads");
}

/** Content-Type theo đuôi file kết quả (whitelist — đuôi lạ → octet-stream). */
function contentTypeFor(filename) {
  const ext = path.extname(String(filename || "")).toLowerCase();
  if (ext === ".wav") return "audio/wav";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mp3") return "audio/mpeg";
  return "application/octet-stream";
}

/**
 * Đăng ký 1 file kết quả để tải 1 lần. Di chuyển file (rename cùng
 * filesystem, fallback copy+unlink) vào ai-downloads/<token>/.
 * @param {object} [extraHeaders]  header gắn lên response download (vd:
 *   X-TTS-Duration, X-Bgremove-Session-Used — chỉ nhận tên X-* hợp lệ,
 *   giá trị string; để UI cũ đọc được metadata như khi tải trực tiếp).
 * @returns {{ token: string, url: string }} — url là đường dẫn tương đối
 *   "/api/ai-download/<token>" để event `done` gửi cho client.
 */
function registerAiDownload(workRoot, srcPath, downloadName, extraHeaders) {
  const token = newJobId();
  const dir = path.join(downloadsRoot(workRoot), token);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "file");
  try {
    fs.renameSync(srcPath, dest);
  } catch (e) {
    if (e.code !== "EXDEV") throw e;
    fs.copyFileSync(srcPath, dest);
    fs.rmSync(srcPath, { force: true });
  }
  // Chỉ giữ header X-* hợp lệ (tên + giá trị string, không xuống dòng).
  const headers = {};
  if (extraHeaders && typeof extraHeaders === "object") {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (/^X-[A-Za-z0-9-]+$/.test(k) && typeof v === "string" && !/[\r\n]/.test(v)) {
        headers[k] = v;
      }
    }
  }
  writeFileEpermRetry(
    path.join(dir, "meta.json"),
    JSON.stringify({ name: downloadName, createdAt: Date.now(), headers }),
    { label: "bridge-ai-download-meta" },
  );
  return { token, url: `/api/ai-download/${token}` };
}

/** Đọc meta.json của 1 token; null khi không có/hỏng (coi như 404). */
function readMeta(dir) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
    if (!m || typeof m.name !== "string" || !m.name) return null;
    return m;
  } catch {
    return null;
  }
}

/**
 * Phục vụ GET /api/ai-download/:token. Tự validate token + prefix-check,
 * trả 400/404 JSON khi không hợp lệ, download file rồi xóa thư mục token.
 * Trả về true khi đã phục vụ (kể cả lỗi download giữa chừng), false khi
 * token không tồn tại (caller tự trả 404 — hàm này tự trả 400/404 nên
 * caller thường chỉ cần gọi và bỏ qua giá trị trả về).
 */
function serveAiDownload(workRoot, req, res) {
  const token = String((req.params && req.params.token) || "");
  if (!TOKEN_RE.test(token)) {
    res.status(400).json({
      error: "Token download không hợp lệ.",
      errorCode: "INVALID_DOWNLOAD_TOKEN",
    });
    return false;
  }
  const dir = path.join(downloadsRoot(workRoot), token);
  // Prefix-check chống traversal (token đã whitelist hex nên chỉ phòng thủ).
  if (!dir.startsWith(downloadsRoot(workRoot) + path.sep)) {
    res.status(400).json({
      error: "Token download không hợp lệ.",
      errorCode: "INVALID_DOWNLOAD_TOKEN",
    });
    return false;
  }
  const file = path.join(dir, "file");
  const meta = readMeta(dir);
  if (!meta || !fs.existsSync(file)) {
    res.status(404).json({
      error: "File kết quả không còn (đã tải rồi hoặc đã hết hạn).",
      errorCode: "DOWNLOAD_NOT_FOUND",
    });
    return false;
  }
  const cleanup = () => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* bỏ qua */
    }
  };
  res.setHeader("Content-Type", contentTypeFor(meta.name));
  // Header metadata đã đăng ký lúc done (vd X-TTS-Duration) — UI cũ đọc
  // được như khi tải trực tiếp từ route gốc.
  for (const [k, v] of Object.entries(meta.headers || {})) {
    try {
      res.setHeader(k, v);
    } catch {
      /* bỏ qua header lỗi */
    }
  }
  res.download(file, meta.name, (err) => {
    if (err) {
      // Client ngắt giữa chừng hoặc lỗi gửi — vẫn xóa để không giữ file lỗi.
      try {
        console.error(`[bridge] lỗi gửi file ai-download ${token}:`, err.message);
      } catch {
        /* bỏ qua */
      }
    }
    cleanup();
  });
  return true;
}

/**
 * Xóa các token quá TTL (chưa ai tải). Trả về số thư mục đã xóa.
 * Không throw — sweep chạy nền, lỗi từng thư mục thì bỏ qua.
 */
function sweepAiDownloads(workRoot, maxAgeMs) {
  const root = downloadsRoot(workRoot);
  let n = 0;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return 0;
  }
  const ttl = Number.isFinite(maxAgeMs) && maxAgeMs > 0 ? maxAgeMs : DOWNLOAD_TTL_MS;
  const now = Date.now();
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const dir = path.join(root, e.name);
    let mtime = 0;
    try {
      mtime = fs.statSync(dir).mtimeMs;
    } catch {
      continue;
    }
    if (now - mtime < ttl) continue;
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      n++;
    } catch {
      /* bỏ qua */
    }
  }
  return n;
}

/**
 * Bật sweep định kỳ (interval unref — không giữ process bridge khi test
 * thoát). Trả về timer để caller dừng khi cần (test).
 */
function startAiDownloadSweep(workRoot, intervalMs) {
  const timer = setInterval(() => {
    try {
      sweepAiDownloads(workRoot);
    } catch {
      /* bỏ qua */
    }
  }, Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : SWEEP_INTERVAL_MS);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = {
  TOKEN_RE,
  DOWNLOAD_TTL_MS,
  SWEEP_INTERVAL_MS,
  downloadsRoot,
  contentTypeFor,
  registerAiDownload,
  serveAiDownload,
  sweepAiDownloads,
  startAiDownloadSweep,
};
