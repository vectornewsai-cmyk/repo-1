#!/usr/bin/env node
/**
 * bridge/index.js — Local bridge server cho VCut Studio.
 *
 * Nhận video-spec JSON + file media từ web UI (multipart/form-data),
 * chạy render worker (server/render/src/render.js) bằng child_process.spawn
 * với argv cố định, theo dõi tiến trình, trả MP4 về cho UI tải xuống.
 *
 * R1-041: dùng RenderJobService (src/jobQueue.js) — hàng đợi FIFO đúng nghĩa:
 * job vượt MAX_CONCURRENT_JOBS được xếp hàng (queued) thay vì bị 429.
 *
 * R1-043: sau khi render worker thoát mã 0, service chạy outputQA (ffprobe)
 * kiểm tra codec/duration/resolution trước khi đánh dấu done (xem
 * src/outputQA.js). QA fail → job error, file lỗi không được trả qua download.
 *
 * Bảo mật (theo yêu cầu task P0-01 / R1-040):
 *  - KHÔNG chạy shell tùy ý: chỉ spawn `node render.js` với argv cố định.
 *  - Tên file media được sanitize (basename, whitelist ký tự); KHÔNG cho path traversal.
 *  - Giới hạn số job đồng thời (MAX_CONCURRENT_JOBS) + độ dài hàng đợi (MAX_QUEUE_LENGTH).
 *  - Giới hạn kích thước upload (MAX_UPLOAD_BYTES).
 *  - Job dir là thư mục tạm riêng per-job; cancel dọn dẹp ngay.
 *  - Không nhận đường dẫn tuyệt đối từ client — mọi file đều do client upload.
 *
 * API:
 *  POST   /api/render            multipart: field "spec" (JSON string),
 *                                files field "media" (nhiều file, filename = clip.src)
 *                                → 201 { jobId, status, queuePosition } | 429 (hàng đợi đầy) | 400
 *  GET    /api/render            → { jobs: [...] } (mới nhất trước, ?limit=)
 *  GET    /api/render/:id        → { id, status, progress, etaSeconds, queuePosition, attempts, error?, outputName?, qaReport? }
 *  GET    /api/render/:id/download → file MP4 (khi status=done)
 *  DELETE /api/render/:id        → hủy job (kill cả process group) + xóa thư mục tạm
 *  POST   /api/render/:id/retry  → chạy lại job bị lỗi
 *  POST   /api/caption           multipart: field "media" (video/audio) → NDJSON segments
 *  POST   /api/reframe           multipart: field "media" (video), field "aspect"
 *                                → download MP4 đã crop theo chủ thể (9:16 | 1:1 | 4:5)
 *  POST   /api/tts               JSON { text, voice? } → download file WAV giọng đọc (ZeroTTS, local)
 *  GET    /api/tts/voices        → { voices: [...], default }
 *  GET    /api/openapi.json      → OpenAPI 3.0 spec dạng JSON (R1-092, dùng cho Swagger UI)
 *  GET    /api/health            → { ok: true, version, ffmpeg, runningJobs, queuedJobs }
 */
"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn, execFile } = require("child_process");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const { RenderJobService, newJobId, specDuration } = require("./jobQueue");
// R1-072: auto-caption (faster-whisper, chạy local qua caption.py)
// R1-080: dịch phụ đề sang tiếng Anh (translate.py, faster-whisper translate task)
const {
  runCaption,
  validateLang,
  captionAvailable,
  PHASE_LABELS,
  runTranslate,
  validateTranslateTarget,
  translateAvailable,
  TRANSLATE_PHASE_LABELS,
} = require("./caption");
// R1-083: local TTS tiếng Việt (ZeroTTS, chạy local qua tts.py)
const {
  TTS_VOICES,
  DEFAULT_VOICE,
  validateText,
  validateVoice,
  ttsAvailable,
  runTts,
} = require("./tts");
// R1-083/R1-085: auto-reframe (OpenCV, chạy local qua reframe.py)
const {
  runReframe,
  validateAspect,
  reframeAvailable,
  REFRAME_ASPECTS,
} = require("./reframe");
// R1-084: AI background removal (rembg MIT + birefnet-general MIT, chạy local qua bgremove.py)
const {
  runBgremove,
  validateSession,
  bgremoveAvailable,
  DEFAULT_SESSION,
} = require("./bgremove");
// R1-084: silence removal (FFmpeg silencedetect, chạy local qua silence.py)
const {
  runSilence,
  validateNoiseDb,
  validateMinDur,
  silenceAvailable,
} = require("./silence");
// R1-085: scene detection (FFmpeg select filter, chạy local qua scene.py)
const {
  runSceneDetect,
  validateThreshold,
  validateRange,
  sceneAvailable,
} = require("./scene");

// ---------------------------------------------------------------------------
// Cấu hình
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.BRIDGE_PORT || "8787", 10);
const RENDER_JS = path.resolve(__dirname, "..", "..", "render", "src", "render.js");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FFPROBE = process.env.FFPROBE || "ffprobe";
const MAX_CONCURRENT_JOBS = parseInt(process.env.BRIDGE_MAX_JOBS || "2", 10);
const MAX_QUEUE_LENGTH = parseInt(process.env.BRIDGE_MAX_QUEUE || "100", 10);
const MAX_UPLOAD_BYTES = parseInt(process.env.BRIDGE_MAX_UPLOAD || String(2 * 1024 * 1024 * 1024), 10); // 2GB
const JOB_TTL_MS = parseInt(process.env.BRIDGE_JOB_TTL || String(60 * 60 * 1000), 10); // 1h
const WORK_ROOT = process.env.BRIDGE_WORK_DIR ||
  path.join(os.tmpdir(), "vcut-bridge-jobs");

// --- R1-040 hardening: giới hạn & chính sách ---------------------------------
const SPEC_MAX_BYTES = parseInt(process.env.BRIDGE_SPEC_MAX || String(10 * 1024 * 1024), 10); // 10MB
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_GENERAL = parseInt(process.env.BRIDGE_RATE_GENERAL || "120", 10); // req/phút/IP
const RATE_MAX_RENDER = parseInt(process.env.BRIDGE_RATE_RENDER || "20", 10);     // POST render/phút/IP
const MIN_DISK_FREE_BYTES = parseInt(process.env.BRIDGE_MIN_DISK_FREE || String(256 * 1024 * 1024), 10); // 256MB

/** Whitelist đuôi file media cho phép upload. */
const ALLOWED_MEDIA_EXTS = new Set([
  ".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi",
  ".mp3", ".wav", ".ogg", ".oga", ".m4a", ".flac", ".aac",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp",
]);

/** R1-072: caption chỉ nhận video/audio (cần track tiếng để transcribe). */
const AUDIO_VIDEO_EXTS = new Set([
  ".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi",
  ".mp3", ".wav", ".ogg", ".oga", ".m4a", ".flac", ".aac",
]);

/** R1-083: reframe chỉ nhận VIDEO (cần hình để theo dõi chủ thể). */
const VIDEO_EXTS = new Set([
  ".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi",
]);

/** Magic bytes (đủ để nhận diện, không cần đầy đủ mọi định dạng). */
const MAGIC = [
  { ext: [".mp4", ".mov", ".m4v", ".m4a"], test: (b) => b.length > 12 && b.toString("ascii", 4, 12).includes("ftyp") },
  { ext: [".webm", ".mkv"], test: (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  { ext: [".mp3"], test: (b) => b.length >= 3 && ((b[0] === 0xff && (b[1] & 0xe0) === 0xe0) || b.toString("ascii", 0, 3) === "ID3") },
  { ext: [".wav"], test: (b) => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WAVE" },
  { ext: [".ogg", ".oga"], test: (b) => b.length >= 4 && b.toString("ascii", 0, 4) === "OggS" },
  { ext: [".flac"], test: (b) => b.length >= 4 && b.toString("ascii", 0, 4) === "fLaC" },
  { ext: [".png"], test: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: [".jpg", ".jpeg"], test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: [".gif"], test: (b) => b.length >= 6 && (b.toString("ascii", 0, 6) === "GIF87a" || b.toString("ascii", 0, 6) === "GIF89a") },
  { ext: [".webp"], test: (b) => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  { ext: [".bmp"], test: (b) => b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d },
  { ext: [".avi"], test: (b) => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 11) === "AVI" },
  { ext: [".aac"], test: (b) => b.length >= 2 && b[0] === 0xff && (b[1] & 0xf0) === 0xf0 },
];

const VERSION = "0.1.0";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Sanitize tên file upload: chỉ giữ basename, whitelist ký tự an toàn.
 * Trả về null nếu tên không hợp lệ (chặn path traversal).
 */
function sanitizeFilename(name) {
  if (typeof name !== "string" || !name) return null;
  const base = path.basename(name);
  if (base !== name) return null;               // có dấu / hoặc \ → từ chối
  if (base === "." || base === "..") return null;
  if (!/^[\w\-. ]{1,128}$/.test(base)) return null; // whitelist ký tự
  if (base.startsWith(".")) return null;        // ẩn file
  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_MEDIA_EXTS.has(ext)) return null; // R1-040: whitelist loại file
  return base;
}

/**
 * R1-040: kiểm tra magic bytes của buffer có khớp với đuôi file không.
 * Trả về null nếu OK, message lỗi nếu không khớp.
 */
function checkMagicBytes(safeName, buffer) {
  const ext = path.extname(safeName).toLowerCase();
  const candidates = MAGIC.filter((m) => m.ext.includes(ext));
  if (candidates.length === 0) return null; // không có rule → đã qua whitelist đuôi
  try {
    if (buffer.length < 16) return `File "${safeName}" quá nhỏ hoặc rỗng, không nhận diện được định dạng.`;
    for (const c of candidates) {
      try { if (c.test(buffer)) return null; } catch { /* tiếp tục */ }
    }
    return `File "${safeName}" có đuôi ${ext} nhưng nội dung không khớp định dạng (có thể là file giả mạo).`;
  } catch {
    return `Không đọc được nội dung file "${safeName}".`;
  }
}

/** R1-040: dung lượng đĩa còn trống (bytes) tại WORK_ROOT; -1 nếu không đo được. */
function diskFreeBytes() {
  try {
    if (typeof fs.statfsSync !== "function") return -1;
    try { fs.mkdirSync(WORK_ROOT, { recursive: true }); } catch {}
    const st = fs.statfsSync(WORK_ROOT);
    return Number(st.bfree) * Number(st.bsize);
  } catch {
    return -1;
  }
}

/** R1-040: job id hợp lệ là 16 ký tự hex (do newJobId() tạo ra). */
function isValidJobId(id) {
  return typeof id === "string" && /^[0-9a-f]{16}$/.test(id);
}

// ---------------------------------------------------------------------------
// R1-040: Rate limiter (in-memory, theo IP, fixed window)
// ---------------------------------------------------------------------------
/** @type {Map<string, {count:number, resetAt:number}>} */
const rateBuckets = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) if (v.resetAt <= now) rateBuckets.delete(k);
}, RATE_WINDOW_MS).unref();

function rateLimit(max) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    let b = rateBuckets.get(ip);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + RATE_WINDOW_MS };
      rateBuckets.set(ip, b);
    }
    b.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - b.count)));
    if (b.count > max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: `Quá nhiều request — thử lại sau ${retryAfter}s.`,
      });
    }
    next();
  };
}

/** R1-040: lỗi từ multer (file quá lớn, quá nhiều file...) → JSON rõ ràng. */
// eslint-disable-next-line no-unused-vars
function multerErrorHandler(err, req, res, next) {
  if (!err) return next();
  if (err.code && String(err.code).startsWith("LIMIT_")) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? `File vượt quá giới hạn ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`
      : err.code === "LIMIT_FILE_COUNT"
        ? "Quá nhiều file trong một request (tối đa 200)."
        : "Upload không hợp lệ.";
    return res.status(413).json({ error: msg });
  }
  return next(err);
}

/** R1-040: dọn media của job ngay khi done (giữ output.mp4 + spec.json). */
function pruneJobMedia(job) {
  try {
    if (job.mediaDir && fs.existsSync(job.mediaDir)) {
      fs.rmSync(job.mediaDir, { recursive: true, force: true });
    }
  } catch { /* bỏ qua */ }
}

/** R1-040: validate job id param trước khi tra cứu. */
function validateJobIdParam(req, res, next) {
  if (!isValidJobId(req.params.id)) {
    return res.status(400).json({ error: "Job id không hợp lệ." });
  }
  next();
}

/** R1-040: lấy version ffmpeg (chuỗi ngắn), null nếu không chạy được. */
async function ffmpegVersion() {
  try {
    const out = await new Promise((resolve, reject) => {
      execFile(FFMPEG, ["-version"], { timeout: 8000 }, (err, stdout) =>
        err ? reject(err) : resolve(String(stdout || "")));
    });
    const first = out.split("\n")[0] || "";
    return first.slice(0, 120);
  } catch {
    return null;
  }
}

function cleanupJobDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* bỏ qua */ }
}

// ---------------------------------------------------------------------------
// Export preset (R1-042): quality params từ UI → argv render.js.
// Whitelist nghiêm ngặt — KHÔNG cho client truyền argv tùy ý.
// ---------------------------------------------------------------------------
const X264_PRESETS = [
  "ultrafast", "superfast", "veryfast", "faster", "fast",
  "medium", "slow", "slower", "veryslow",
];

/**
 * Parse + validate field "preset" (JSON string, optional).
 * Trả về { crf, x264Preset, audioBitrate } đã sanitize, hoặc throw Error → 400.
 */
function parsePreset(raw) {
  const defaults = { crf: 20, x264Preset: "medium", audioBitrate: "128k" };
  if (raw === undefined || raw === null || raw === "") return defaults;
  let p;
  try {
    p = JSON.parse(raw);
  } catch {
    throw new Error("Field 'preset' phải là JSON hợp lệ.");
  }
  if (!p || typeof p !== "object" || Array.isArray(p))
    throw new Error("Field 'preset' phải là object.");
  const out = { ...defaults };
  if (p.crf !== undefined) {
    if (!Number.isInteger(p.crf) || p.crf < 0 || p.crf > 51)
      throw new Error("preset.crf phải là số nguyên 0..51.");
    out.crf = p.crf;
  }
  if (p.x264Preset !== undefined) {
    if (typeof p.x264Preset !== "string" || !X264_PRESETS.includes(p.x264Preset))
      throw new Error(`preset.x264Preset phải thuộc: ${X264_PRESETS.join(", ")}.`);
    out.x264Preset = p.x264Preset;
  }
  if (p.audioBitrateKbps !== undefined) {
    if (!Number.isInteger(p.audioBitrateKbps) || p.audioBitrateKbps < 32 || p.audioBitrateKbps > 512)
      throw new Error("preset.audioBitrateKbps phải là số nguyên 32..512.");
    out.audioBitrate = `${p.audioBitrateKbps}k`;
  }
  return out;
}

/** Serialize job record cho API (loại bỏ proc, _stderrTail, _killTimer). */
function publicJob(j) {
  if (!j) return null;
  return {
    id: j.id,
    status: j.status,
    progress: Math.round(j.progress * 100) / 100,
    etaSeconds: j.etaSeconds == null ? null : Math.round(j.etaSeconds * 10) / 10, // R1-065
    queuePosition: j.queuePosition,
    attempts: j.attempts,
    error: j.error,
    outputName: j.outputName,
    outputSize: j.outputSize || null,
    createdAt: j.createdAt,
    startedAt: j.startedAt,
    finishedAt: j.finishedAt,
    recovered: !!j.recovered,
    note: j.note,
    qaReport: j.qaReport || null, // R1-043: chi tiết kiểm tra output
  };
}

// ---------------------------------------------------------------------------
// RenderJobService — spawnJob thật
// ---------------------------------------------------------------------------
const service = new RenderJobService({
  maxConcurrent: MAX_CONCURRENT_JOBS,
  maxQueueLength: MAX_QUEUE_LENGTH,
  jobTtlMs: JOB_TTL_MS,
  ffprobeBin: FFPROBE, // R1-043: QA output sau render
  onDone: pruneJobMedia, // R1-040: dọn media ngay khi done
  spawnJob(job) {
    const args = [
      RENDER_JS,
      "--spec", job.specPath,
      "--out", job.outPath,
      "--media-dir", job.mediaDir,
      "--ffmpeg", FFMPEG,
      "--ffprobe", FFPROBE,
      "-y",
    ];
    // R1-042: quality params đã sanitize ở parsePreset (job recover → dùng default).
    const preset = job.preset || { crf: 20, x264Preset: "medium", audioBitrate: "128k" };
    args.push(
      "--crf", String(preset.crf),
      "--x264-preset", preset.x264Preset,
      "--audio-bitrate", preset.audioBitrate,
    );
    // detached: true → process group riêng, để cancel kill được cả ffmpeg con.
    // (xem killProcessTree trong jobQueue.js)
    return spawn(process.execPath, args, {
      cwd: path.dirname(RENDER_JS),
      stdio: ["ignore", "pipe", "pipe"],
      shell: false, // QUAN TRỌNG: không dùng shell
      detached: process.platform !== "win32",
    });
  },
});

// Phục hồi job dở dang sau restart (best-effort), rồi bật janitor dọn TTL.
try {
  fs.mkdirSync(WORK_ROOT, { recursive: true });
  const n = service.recover(WORK_ROOT);
  if (n > 0) console.log(`♻️  Phục hồi ${n} job dở dang từ lần chạy trước (render lại từ đầu).`);
} catch (e) {
  console.error("⚠️  Không phục hồi được job cũ:", e.message);
}
service.startJanitor();

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.set("trust proxy", false); // R1-040: không tin X-Forwarded-For (chạy local)

// CORS (sửa SECURITY.md §3.1, 2026-10-20): trước đây `cors()` mở toàn bộ origin —
// bất kỳ website nào user mở cũng đọc được response của bridge local. Nay chỉ
// cấp Access-Control-Allow-Origin cho origin loopback (web UI dev :5173, vite
// preview, mọi port local khác). Request không có Origin header (curl, MCP
// server, CLI — client local không phải browser) vẫn qua bình thường. Origin
// lạ: không trả ACAO → trình duyệt tự chặn đọc response.
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
app.use(cors({
  origin(origin, callback) {
    if (!origin || LOCAL_ORIGIN_RE.test(origin)) return callback(null, true);
    return callback(null, false);
  },
}));

// R1-040: security headers cơ bản (không phá API hiện tại)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// R1-040: rate limit chung cho mọi API
app.use("/api/", rateLimit(RATE_MAX_GENERAL));

app.use(express.json({ limit: "50mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 200 },
});

app.get("/api/health", async (req, res) => {
  const fv = await ffmpegVersion();
  const free = diskFreeBytes();
  let workWritable = false;
  try { fs.mkdirSync(WORK_ROOT, { recursive: true }); fs.accessSync(WORK_ROOT, fs.constants.W_OK); workWritable = true; } catch {}
  res.json({
    ok: true,
    version: VERSION,
    ffmpeg: fv !== null,
    ffmpegVersion: fv, // R1-040
    runningJobs: service.runningCount(),
    queuedJobs: service.queuedCount(),
    disk: free >= 0 ? { // R1-040
      freeBytes: free,
      freeGB: Math.round(free / 1024 / 1024 / 1024 * 100) / 100,
      lowDisk: free < MIN_DISK_FREE_BYTES,
    } : null,
    workDirWritable: workWritable, // R1-040
    uptimeSec: Math.round(process.uptime()), // R1-040
    node: process.version, // R1-040
    caption: captionAvailable(), // R1-072: python + caption.py có sẵn không
    bgremove: bgremoveAvailable(), // R1-084: python + bgremove.py có sẵn không
    translate: translateAvailable(), // R1-080: python + translate.py có sẵn không
    reframe: reframeAvailable(), // R1-083: python venv + reframe.py có sẵn không
    silence: silenceAvailable(), // R1-084: python + silence.py có sẵn không
    scene: sceneAvailable(), // R1-085: python + scene.py có sẵn không
  });
});

// --- POST /api/render -------------------------------------------------------
app.post("/api/render",
  rateLimit(RATE_MAX_RENDER), // R1-040: giới hạn riêng, chặt hơn cho render
  (req, res, next) => upload.array("media", 200)(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  }),
  async (req, res) => {
  // R1-040: giới hạn kích thước spec (multipart text field không bị multer giới hạn)
  const specRaw = req.body.spec;
  if (typeof specRaw !== "string") {
    return res.status(400).json({ error: "Thiếu field 'spec'." });
  }
  if (Buffer.byteLength(specRaw, "utf8") > SPEC_MAX_BYTES) {
    return res.status(413).json({
      error: `Spec quá lớn (tối đa ${Math.round(SPEC_MAX_BYTES / 1024 / 1024)}MB).`,
    });
  }

  // 1. Parse + kiểm tra spec
  let spec;
  try {
    spec = JSON.parse(specRaw);
  } catch {
    return res.status(400).json({ error: "Field 'spec' phải là JSON hợp lệ." });
  }
  if (!spec || typeof spec !== "object" || !Array.isArray(spec.tracks)) {
    return res.status(400).json({ error: "Spec thiếu tracks hoặc sai định dạng." });
  }

  // R1-040: kiểm tra dung lượng đĩa trước khi nhận job
  const free = diskFreeBytes();
  if (free >= 0 && free < MIN_DISK_FREE_BYTES) {
    return res.status(507).json({
      error: `Ổ đĩa sắp đầy (còn ${Math.round(free / 1024 / 1024)}MB) — dọn dẹp rồi thử lại.`,
    });
  }

  // 1b. Parse export preset (R1-042, optional) — validate whitelist nghiêm ngặt.
  let preset;
  try {
    preset = parsePreset(req.body.preset);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  // 2. Tạo job dir với id cuối cùng ngay từ đầu (tránh race rename)
  const id = newJobId();
  const dir = path.join(WORK_ROOT, id);
  const mediaDir = path.join(dir, "media");
  const outPath = path.join(dir, "output.mp4");
  try {
    fs.mkdirSync(mediaDir, { recursive: true });
  } catch (e) {
    console.error(`[bridge] không tạo được thư mục job:`, e.message);
    return res.status(500).json({ error: "Lỗi máy chủ khi tạo job — thử lại sau." });
  }

  // 3. Lưu media (sanitize tên file + whitelist loại + magic bytes — R1-040)
  for (const f of req.files || []) {
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      cleanupJobDir(dir);
      return res.status(400).json({ error: `Tên file không hợp lệ hoặc loại file không được phép: ${f.originalname}` });
    }
    const magicErr = checkMagicBytes(safe, f.buffer);
    if (magicErr) {
      cleanupJobDir(dir);
      return res.status(400).json({ error: magicErr });
    }
    const dest = path.join(mediaDir, safe);
    // Double-check: dest phải nằm trong mediaDir (chống traversal)
    if (!dest.startsWith(mediaDir + path.sep)) {
      cleanupJobDir(dir);
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    try {
      fs.writeFileSync(dest, f.buffer);
    } catch (e) {
      console.error(`[bridge] không lưu được file media:`, e.message);
      cleanupJobDir(dir);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu file — thử lại sau." });
    }
  }

  // 4. Ghi spec.json
  const specPath = path.join(dir, "spec.json");
  try {
    fs.writeFileSync(specPath, JSON.stringify(spec));
  } catch (e) {
    console.error(`[bridge] không ghi được spec:`, e.message);
    cleanupJobDir(dir);
    return res.status(500).json({ error: "Lỗi máy chủ khi lưu spec — thử lại sau." });
  }

  // 5. Xếp vào hàng đợi (service tự chạy khi có slot trống)
  let job;
  try {
    job = service.enqueue({
      id, dir, mediaDir, specPath, outPath,
      totalDuration: specDuration(spec),
      preset,
    });
  } catch (e) {
    cleanupJobDir(dir);
    if (e.code === "QUEUE_FULL") {
      return res.status(429).json({ error: e.message });
    }
    console.error(`[bridge] không tạo được job:`, e.message);
    return res.status(500).json({ error: "Lỗi máy chủ khi tạo job — thử lại sau." });
  }

  return res.status(201).json({
    jobId: job.id,
    status: job.status,
    queuePosition: job.queuePosition,
  });
});

// --- POST /api/caption (R1-072) -------------------------------------------------
// Nhận 1 file video/audio (multipart field "media") + field "lang" (optional).
// Chạy caption.py (faster-whisper, 100% local) rồi stream tiến trình về client
// dạng NDJSON: {"type":"phase",...} ... {"type":"done","segments":[...]}.
// Lỗi validate (chưa gửi header) → JSON 4xx bình thường; lỗi khi đang chạy
// → event {"type":"error"} trong stream (header đã gửi nên không đổi status được).
app.post(
  "/api/caption",
  rateLimit(RATE_MAX_RENDER), // R1-040: giới hạn chặt như render (tác vụ nặng)
  (req, res, next) => upload.single("media")(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  }),
  async (req, res) => {
    // 1. Validate (chưa stream → lỗi trả JSON 4xx)
    let lang;
    try {
      lang = validateLang(req.body.lang);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const f = req.file;
    if (!f) {
      return res.status(400).json({ error: "Thiếu file media (field 'media')." });
    }
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    const ext = path.extname(safe).toLowerCase();
    if (!AUDIO_VIDEO_EXTS.has(ext)) {
      return res.status(400).json({
        error: "Caption cần file video hoặc audio (ảnh không có tiếng để nhận diện).",
      });
    }
    const magicErr = checkMagicBytes(safe, f.buffer);
    if (magicErr) return res.status(400).json({ error: magicErr });
    const avail = captionAvailable();
    if (!avail.available) {
      return res.status(503).json({ error: `Caption chưa sẵn sàng: ${avail.reason}` });
    }

    // 2. Lưu file vào thư mục tạm riêng (không bao giờ dùng path từ client)
    const dir = path.join(
      WORK_ROOT,
      `caption-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    );
    const inputPath = path.join(dir, safe);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(inputPath, f.buffer);
    } catch (e) {
      console.error(`[bridge] không lưu được file caption:`, e.message);
      cleanupJobDir(dir);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu file — thử lại sau." });
    }

    // 3. Stream NDJSON: phase... → done | error
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    const send = (obj) => {
      try { res.write(JSON.stringify(obj) + "\n"); } catch { /* client đã ngắt */ }
    };
    send({ type: "phase", phase: "upload", message: PHASE_LABELS.upload });
    try {
      const result = await runCaption({
        inputPath,
        lang,
        onPhase: (p) => send({ type: "phase", phase: p, message: PHASE_LABELS[p] || p }),
      });
      send({
        type: "done",
        language: result.language,
        audioDurationSec: result.audioDurationSec,
        transcribeTimeSec: result.transcribeTimeSec,
        count: result.segments.length,
        segments: result.segments,
      });
    } catch (e) {
      send({ type: "error", error: e.message || "Caption thất bại." });
    } finally {
      cleanupJobDir(dir);
      try { res.end(); } catch { /* bỏ qua */ }
    }
  }
);

// --- POST /api/reframe (R1-083/R1-085) ----------------------------------------
// Nhận 1 file VIDEO (multipart field "media") + field "aspect" (9:16 | 1:1 | 4:5).
// Chạy reframe.py (OpenCV: Haar face → motion fallback, 100% local), crop theo
// chủ thể rồi trả về MP4 đích qua res.download. Đồng bộ (timeout 10 phút).
app.post(
  "/api/reframe",
  rateLimit(RATE_MAX_RENDER), // R1-040: tác vụ nặng, giới hạn như render
  (req, res, next) => upload.single("media")(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  }),
  async (req, res) => {
    let aspect;
    try {
      aspect = validateAspect(req.body.aspect);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const f = req.file;
    if (!f) {
      return res.status(400).json({ error: "Thiếu file video (field 'media')." });
    }
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    const ext = path.extname(safe).toLowerCase();
    if (!VIDEO_EXTS.has(ext)) {
      return res.status(400).json({
        error: `Reframe cần file VIDEO (${[...VIDEO_EXTS].join(", ")}).`,
      });
    }
    const magicErr = checkMagicBytes(safe, f.buffer);
    if (magicErr) return res.status(400).json({ error: magicErr });
    const avail = reframeAvailable();
    if (!avail.available) {
      return res.status(503).json({ error: `Reframe chưa sẵn sàng: ${avail.reason}` });
    }

    const dir = path.join(
      WORK_ROOT,
      `reframe-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    );
    const inputPath = path.join(dir, safe);
    const dot = safe.lastIndexOf(".");
    const outName = `${safe.slice(0, dot > 0 ? dot : undefined)}_${aspect.replace(":", "x")}.mp4`;
    const outputPath = path.join(dir, outName);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(inputPath, f.buffer);
    } catch (e) {
      console.error(`[bridge] không lưu được file reframe:`, e.message);
      cleanupJobDir(dir);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu file — thử lại sau." });
    }

    try {
      const result = await runReframe({ inputPath, outputPath, aspect });
      console.log(`[bridge] reframe xong: ${outName} (${result.bytes} bytes, ${aspect})`);
      res.download(result.outPath, outName, (err) => {
        if (err) console.error(`[bridge] lỗi download reframe:`, err.message);
        cleanupJobDir(dir);
      });
    } catch (e) {
      cleanupJobDir(dir);
      // Chưa gửi header nào → trả JSON lỗi bình thường.
      return res.status(500).json({ error: e.message || "Reframe thất bại." });
    }
  }
);

// --- POST /api/bgremove (R1-084) ------------------------------------------------
// Nhận 1 file VIDEO (multipart field "media") + field "session" (optional).
// Chạy bgremove.py (rembg MIT + birefnet-general MIT, 100% local) rồi trả về
// file MOV PNG có kênh alpha qua res.download. Đồng bộ (timeout 30 phút).
app.post(
  "/api/bgremove",
  rateLimit(RATE_MAX_RENDER), // R1-040: tác vụ nặng, giới hạn như render
  (req, res, next) => upload.single("media")(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  }),
  async (req, res) => {
    let session;
    try {
      session = validateSession(req.body.session);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const f = req.file;
    if (!f) {
      return res.status(400).json({ error: "Thiếu file video (field 'media')." });
    }
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    const ext = path.extname(safe).toLowerCase();
    if (!VIDEO_EXTS.has(ext)) {
      return res.status(400).json({
        error: `Xóa nền cần file VIDEO (${[...VIDEO_EXTS].join(", ")}).`,
      });
    }
    const magicErr = checkMagicBytes(safe, f.buffer);
    if (magicErr) return res.status(400).json({ error: magicErr });
    const avail = bgremoveAvailable();
    if (!avail.available) {
      return res.status(503).json({ error: `Xóa nền chưa sẵn sàng: ${avail.reason}` });
    }

    const dir = path.join(
      WORK_ROOT,
      `bgremove-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    );
    const inputPath = path.join(dir, safe);
    const dot = safe.lastIndexOf(".");
    const outName = `${safe.slice(0, dot > 0 ? dot : undefined)}_no_bg.mov`;
    const outputPath = path.join(dir, outName);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(inputPath, f.buffer);
    } catch (e) {
      console.error(`[bridge] không lưu được file bgremove:`, e.message);
      cleanupJobDir(dir);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu file — thử lại sau." });
    }

    try {
      await runBgremove({ inputPath, outputPath, session });
      console.log(`[bridge] bgremove xong: ${outName} (session=${session})`);
      res.download(outputPath, outName, (err) => {
        if (err) console.error(`[bridge] lỗi download bgremove:`, err.message);
        cleanupJobDir(dir);
      });
    } catch (e) {
      cleanupJobDir(dir);
      // Chưa gửi header nào → trả JSON lỗi bình thường.
      return res.status(500).json({ error: e.message || "Xóa nền thất bại." });
    }
  }
);

// --- POST /api/silence (R1-084) ------------------------------------------------
// Nhận 1 file video/audio (multipart field "media") + field "noiseDb"/"minDur".
// Chạy silence.py (FFmpeg silencedetect, 100% local) → trả JSON một lần:
// { audioDurationSec, noiseDb, minDur, silences: [{start,end,duration}], keep }.
// Detect rất nhanh nên không cần stream tiến trình như caption.
app.post(
  "/api/silence",
  rateLimit(RATE_MAX_GENERAL),
  (req, res, next) => upload.single("media")(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  }),
  async (req, res) => {
    // 1. Validate
    let noiseDb, minDur;
    try {
      noiseDb = validateNoiseDb(req.body.noiseDb);
      minDur = validateMinDur(req.body.minDur);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const f = req.file;
    if (!f) {
      return res.status(400).json({ error: "Thiếu file media (field 'media')." });
    }
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    const ext = path.extname(safe).toLowerCase();
    if (!AUDIO_VIDEO_EXTS.has(ext)) {
      return res.status(400).json({
        error: "Silence removal cần file video hoặc audio (ảnh không có track tiếng).",
      });
    }
    const magicErr = checkMagicBytes(safe, f.buffer);
    if (magicErr) return res.status(400).json({ error: magicErr });
    const avail = silenceAvailable();
    if (!avail.available) {
      return res.status(503).json({ error: `Silence removal chưa sẵn sàng: ${avail.reason}` });
    }

    // 2. Lưu file vào thư mục tạm riêng (không bao giờ dùng path từ client)
    const dir = path.join(
      WORK_ROOT,
      `silence-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    );
    const inputPath = path.join(dir, safe);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(inputPath, f.buffer);
    } catch (e) {
      console.error(`[bridge] không lưu được file silence:`, e.message);
      cleanupJobDir(dir);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu file — thử lại sau." });
    }

    // 3. Chạy detect rồi trả JSON
    try {
      const result = await runSilence({ inputPath, noiseDb, minDur });
      res.json({
        audioDurationSec: result.audioDurationSec,
        noiseDb: result.noiseDb,
        minDur: result.minDur,
        count: result.silences.length,
        silences: result.silences,
        keep: result.keep,
      });
    } catch (e) {
      res.status(500).json({ error: e.message || "Phân tích khoảng lặng thất bại." });
    } finally {
      cleanupJobDir(dir);
    }
  }
);

// --- POST /api/scene (R1-085) --------------------------------------------------
// Nhận 1 file VIDEO (multipart field "media") + field "threshold" (optional,
// 0.05..0.95) + "start"/"end" (optional, giây tuyệt đối theo file).
// Chạy scene.py (FFmpeg select='gt(scene,...)', 100% local) rồi stream tiến
// trình về client dạng NDJSON: {"type":"phase",...} ... {"type":"done","cuts":[...]}.
// Lỗi validate (chưa gửi header) → JSON 4xx bình thường; lỗi khi đang chạy
// → event {"type":"error"} trong stream.
app.post(
  "/api/scene",
  rateLimit(RATE_MAX_RENDER), // R1-040: tác vụ nặng, giới hạn như render
  (req, res, next) => upload.single("media")(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  }),
  async (req, res) => {
    // 1. Validate (chưa stream → lỗi trả JSON 4xx)
    let threshold, start, end;
    try {
      threshold = validateThreshold(req.body.threshold);
      ({ start, end } = validateRange(req.body.start, req.body.end));
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const f = req.file;
    if (!f) {
      return res.status(400).json({ error: "Thiếu file video (field 'media')." });
    }
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    const ext = path.extname(safe).toLowerCase();
    if (!VIDEO_EXTS.has(ext)) {
      return res.status(400).json({
        error: `Tách cảnh cần file VIDEO (${[...VIDEO_EXTS].join(", ")}).`,
      });
    }
    const magicErr = checkMagicBytes(safe, f.buffer);
    if (magicErr) return res.status(400).json({ error: magicErr });
    const avail = sceneAvailable();
    if (!avail.available) {
      return res.status(503).json({ error: `Tách cảnh chưa sẵn sàng: ${avail.reason}` });
    }

    // 2. Lưu file vào thư mục tạm riêng (không bao giờ dùng path từ client)
    const dir = path.join(
      WORK_ROOT,
      `scene-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    );
    const inputPath = path.join(dir, safe);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(inputPath, f.buffer);
    } catch (e) {
      console.error(`[bridge] không lưu được file scene:`, e.message);
      cleanupJobDir(dir);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu file — thử lại sau." });
    }

    // 3. Stream NDJSON: phase... → done | error
    const SCENE_PHASE_LABELS = {
      upload: "Đã nhận file, chuẩn bị…",
      scan: "Đang quét chuyển cảnh (video dài có thể mất vài phút)…",
    };
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    const send = (obj) => {
      try { res.write(JSON.stringify(obj) + "\n"); } catch { /* client đã ngắt */ }
    };
    send({ type: "phase", phase: "upload", message: SCENE_PHASE_LABELS.upload });
    try {
      const result = await runSceneDetect({
        inputPath,
        threshold,
        start,
        end,
        onPhase: (p) => send({ type: "phase", phase: p, message: SCENE_PHASE_LABELS[p] || p }),
      });
      send({
        type: "done",
        cuts: result.cuts,
        duration: result.duration,
        threshold: result.threshold,
        count: result.cuts.length,
      });
    } catch (e) {
      send({ type: "error", error: e.message || "Tách cảnh thất bại." });
    } finally {
      cleanupJobDir(dir);
      try { res.end(); } catch { /* bỏ qua */ }
    }
  }
);

// --- POST /api/caption/translate (R1-080) -------------------------------------
// Dịch phụ đề sang tiếng Anh bằng translate.py (faster-whisper translate task,
// 100% local). Nhận 1 file video/audio (multipart field "media") + field "lang"
// (ngôn ngữ NGUỒN) + field "target" (ngôn ngữ đích — hiện chỉ "en").
// Stream NDJSON giống /api/caption: phase... → done | error.
app.post(
  "/api/caption/translate",
  rateLimit(RATE_MAX_RENDER), // R1-040: giới hạn chặt như render (tác vụ nặng)
  (req, res, next) => upload.single("media")(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  }),
  async (req, res) => {
    // 1. Validate (chưa stream → lỗi trả JSON 4xx)
    let lang, target;
    try {
      lang = validateLang(req.body.lang);
      target = validateTranslateTarget(req.body.target);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const f = req.file;
    if (!f) {
      return res.status(400).json({ error: "Thiếu file media (field 'media')." });
    }
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    const ext = path.extname(safe).toLowerCase();
    if (!AUDIO_VIDEO_EXTS.has(ext)) {
      return res.status(400).json({
        error: "Dịch phụ đề cần file video hoặc audio (ảnh không có tiếng để nhận diện).",
      });
    }
    const magicErr = checkMagicBytes(safe, f.buffer);
    if (magicErr) return res.status(400).json({ error: magicErr });
    const avail = translateAvailable();
    if (!avail.available) {
      return res.status(503).json({ error: `Dịch phụ đề chưa sẵn sàng: ${avail.reason}` });
    }

    // 2. Lưu file vào thư mục tạm riêng (không bao giờ dùng path từ client)
    const dir = path.join(
      WORK_ROOT,
      `translate-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    );
    const inputPath = path.join(dir, safe);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(inputPath, f.buffer);
    } catch (e) {
      console.error(`[bridge] không lưu được file translate:`, e.message);
      cleanupJobDir(dir);
      return res.status(500).json({ error: "Lỗi máy chủ khi lưu file — thử lại sau." });
    }

    // 3. Stream NDJSON: phase... → done | error
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    const send = (obj) => {
      try { res.write(JSON.stringify(obj) + "\n"); } catch { /* client đã ngắt */ }
    };
    send({ type: "phase", phase: "upload", message: TRANSLATE_PHASE_LABELS.upload });
    try {
      const result = await runTranslate({
        inputPath,
        lang,
        target,
        onPhase: (p) => send({ type: "phase", phase: p, message: TRANSLATE_PHASE_LABELS[p] || p }),
      });
      send({
        type: "done",
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        audioDurationSec: result.audioDurationSec,
        translateTimeSec: result.translateTimeSec,
        count: result.segments.length,
        segments: result.segments,
      });
    } catch (e) {
      send({ type: "error", error: e.message || "Dịch phụ đề thất bại." });
    } finally {
      cleanupJobDir(dir);
      try { res.end(); } catch { /* bỏ qua */ }
    }
  }
);

// --- GET /api/render (danh sách job) -----------------------------------------
app.get("/api/render", (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  res.json({
    jobs: service.list({ limit }).map(publicJob),
    running: service.runningCount(),
    queued: service.queuedCount(),
  });
});

// --- GET /api/render/:id -----------------------------------------------------
app.get("/api/render/:id", validateJobIdParam, (req, res) => {
  const job = service.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Không tìm thấy job." });
  res.json(publicJob(job));
});

// --- GET /api/render/:id/download --------------------------------------------
app.get("/api/render/:id/download", validateJobIdParam, (req, res) => {
  const job = service.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Không tìm thấy job." });
  if (job.status !== "done" || !fs.existsSync(job.outPath)) {
    return res.status(409).json({ error: `Job chưa xong (status=${job.status}).` });
  }
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="${job.outputName || "vcut-export.mp4"}"`);
  const stream = fs.createReadStream(job.outPath);
  stream.on("error", (e) => {
    console.error(`[bridge] lỗi đọc output job ${job.id}:`, e.message);
    if (!res.headersSent) res.status(500).json({ error: "Lỗi khi đọc file output." });
    else res.destroy();
  });
  stream.pipe(res);
});

// --- DELETE /api/render/:id (hủy) --------------------------------------------
app.delete("/api/render/:id", validateJobIdParam, (req, res) => {
  const job = service.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Không tìm thấy job." });
  const ok = service.cancel(job.id);
  if (!ok) {
    return res.status(409).json({
      error: `Job đã ở trạng thái cuối ("${job.status}") — không hủy được.`,
    });
  }
  res.json({ ok: true, id: job.id, status: "cancelled" });
});

// --- POST /api/render/:id/retry (chạy lại job lỗi) ----------------------------
app.post("/api/render/:id/retry", validateJobIdParam, (req, res) => {
  try {
    const job = service.retry(req.params.id);
    res.json({ jobId: job.id, status: job.status, queuePosition: job.queuePosition });
  } catch (e) {
    if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
    return res.status(409).json({ error: e.message });
  }
});

// --- GET /api/tts/voices + POST /api/tts (R1-083) --------------------------------
// TTS local tiếng Việt (ZeroTTS, MIT). Nhận JSON {text, voice?}, trả về file WAV.
// Tác vụ nặng (model ~0.86GB, CPU ~2x realtime) → rate-limit như render.
app.get("/api/tts/voices", (req, res) => {
  res.json({ voices: TTS_VOICES, default: DEFAULT_VOICE });
});

app.post("/api/tts", rateLimit(RATE_MAX_RENDER), async (req, res) => {
  let text, voice;
  try {
    text = validateText(req.body && req.body.text);
    voice = validateVoice(req.body && req.body.voice);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const avail = ttsAvailable();
  if (!avail.available) {
    return res.status(503).json({ error: `TTS chưa sẵn sàng: ${avail.reason}` });
  }
  const dir = path.join(
    WORK_ROOT,
    `tts-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
  );
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.error(`[bridge] không tạo được thư mục tts:`, e.message);
    return res.status(500).json({ error: "Lỗi máy chủ khi chuẩn bị TTS — thử lại sau." });
  }
  let result;
  try {
    result = await runTts({ text, voice, outDir: dir });
  } catch (e) {
    cleanupJobDir(dir);
    return res.status(500).json({ error: e.message || "TTS thất bại." });
  }
  const wavPath = result.outPath;
  if (!fs.existsSync(wavPath)) {
    cleanupJobDir(dir);
    return res.status(500).json({ error: "TTS xong nhưng không thấy file WAV." });
  }
  const downloadName = `tts-${voice}-${Date.now()}.wav`;
  res.setHeader("X-TTS-Voice", encodeURIComponent(voice)); // Unicode → %encoded (header chỉ cho phép Latin-1)
  res.setHeader("X-TTS-Duration", String(result.durationSec || 0));
  res.setHeader("X-TTS-Chars", String(result.chars || text.length));
  res.download(wavPath, downloadName, (err) => {
    cleanupJobDir(dir); // xóa file tạm sau khi gửi xong (kể cả lỗi)
    if (err) console.error(`[bridge] lỗi gửi file TTS:`, err.message);
  });
});

// --- GET /api/openapi.json (R1-092) -------------------------------------------
// Trả về OpenAPI 3.0 spec (server/bridge/openapi.yaml) dạng JSON — dùng cho
// Swagger UI, Redoc hoặc codegen client. Đọc file mỗi lần gọi để luôn mới
// sau khi sửa yaml mà không cần restart server.
let openApiSpecCache = null;
let openApiSpecMtime = 0;
app.get("/api/openapi.json", (req, res) => {
  try {
    const specPath = path.join(__dirname, "..", "openapi.yaml");
    const stat = fs.statSync(specPath);
    if (!openApiSpecCache || stat.mtimeMs > openApiSpecMtime) {
      // eslint-disable-next-line global-require
      const yaml = require("js-yaml");
      openApiSpecCache = yaml.load(fs.readFileSync(specPath, "utf8"));
      openApiSpecMtime = stat.mtimeMs;
    }
    res.json(openApiSpecCache);
  } catch (e) {
    console.error("[bridge] không đọc được openapi.yaml:", e.message);
    res.status(500).json({ error: "Không đọc được OpenAPI spec." });
  }
});

// R1-040: 404 cho API không tồn tại → JSON (thay vì HTML của Express)
app.use("/api/", (req, res) => {
  res.status(404).json({ error: "API không tồn tại." });
});

// R1-040: error handler toàn cục — mọi lỗi chưa bắt → JSON gọn, KHÔNG leak stack.
// Chi tiết đầy đủ chỉ log ở server.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[bridge] unhandled error ${req.method} ${req.path}:`, err && err.stack || err);
  if (res.headersSent) return;
  const status = err && err.status && Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ error: "Lỗi máy chủ nội bộ." });
});

// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`🌉 VCut bridge server v${VERSION} đang chạy tại http://127.0.0.1:${PORT}`);
  console.log(`   render worker: ${RENDER_JS}`);
  console.log(`   work dir: ${WORK_ROOT} | max concurrent: ${MAX_CONCURRENT_JOBS} | max queue: ${MAX_QUEUE_LENGTH}`);
  console.log(`   hardening: rate-limit ${RATE_MAX_GENERAL}/phút (render ${RATE_MAX_RENDER}/phút), spec ≤${Math.round(SPEC_MAX_BYTES / 1024 / 1024)}MB`);
});

// Shutdown graceful: hủy job, đóng server.
function shutdown() {
  console.log("\n🛑 Đang tắt bridge server — hủy job...");
  try { service.shutdown(); } catch { /* bỏ qua */ }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
