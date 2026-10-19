#!/usr/bin/env node
/**
 * bridge/index.js — Local bridge server cho VCut Studio.
 *
 * Nhận video-spec JSON + file media từ web UI (multipart/form-data),
 * chạy render worker (server/render/src/render.js) bằng child_process.spawn
 * với argv cố định, theo dõi tiến trình, trả MP4 về cho UI tải xuống.
 *
 * Bảo mật (theo yêu cầu task P0-01 / R1-040):
 *  - KHÔNG chạy shell tùy ý: chỉ spawn `node render.js` với argv cố định.
 *  - Tên file media được sanitize (basename, whitelist ký tự); KHÔNG cho path traversal.
 *  - Giới hạn số job đồng thời (MAX_CONCURRENT_JOBS); job thừa bị từ chối 429.
 *  - Giới hạn kích thước upload (MAX_UPLOAD_BYTES) và tổng dung lượng job dir.
 *  - Job dir là thư mục tạm riêng per-job; DELETE /api/render/:id dọn dẹp.
 *  - Không nhận đường dẫn tuyệt đối từ client — mọi file đều do client upload.
 *
 * API:
 *  POST   /api/render            multipart: field "spec" (JSON string),
 *                                files field "media" (nhiều file, filename = clip.src)
 *                                → 201 { jobId } | 429 | 400
 *  GET    /api/render/:id        → { id, status, progress, error?, outputName? }
 *  GET    /api/render/:id/download → file MP4 (khi status=done)
 *  DELETE /api/render/:id        → hủy job (kill process) + xóa thư mục tạm
 *  GET    /api/health            → { ok: true, version, ffmpeg }
 */
"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { spawn, execFile } = require("child_process");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

// ---------------------------------------------------------------------------
// Cấu hình
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.BRIDGE_PORT || "8787", 10);
const RENDER_JS = path.resolve(__dirname, "..", "..", "render", "src", "render.js");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FFPROBE = process.env.FFPROBE || "ffprobe";
const MAX_CONCURRENT_JOBS = parseInt(process.env.BRIDGE_MAX_JOBS || "2", 10);
const MAX_UPLOAD_BYTES = parseInt(process.env.BRIDGE_MAX_UPLOAD || String(2 * 1024 * 1024 * 1024), 10); // 2GB
const JOB_TTL_MS = parseInt(process.env.BRIDGE_JOB_TTL || String(60 * 60 * 1000), 10); // 1h
const WORK_ROOT = process.env.BRIDGE_WORK_DIR ||
  path.join(os.tmpdir(), "vcut-bridge-jobs");

const VERSION = "0.1.0";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jobId() {
  return crypto.randomBytes(8).toString("hex");
}

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
  return base;
}

/** Parse tiến trình từ stderr của ffmpeg (dòng "time=HH:MM:SS.xx"). */
function parseFfmpegTime(line) {
  const m = /time=(\d+):(\d+):([\d.]+)/.exec(line);
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
}

/** Ước lượng duration từ spec (meta.duration hoặc max end của clip). */
function specDuration(spec) {
  try {
    if (spec.meta && typeof spec.meta.duration === "number" && spec.meta.duration > 0)
      return spec.meta.duration;
    let d = 0;
    for (const t of spec.tracks || [])
      for (const c of t.clips || [])
        d = Math.max(d, (c.start || 0) + (c.duration || 0));
    return d;
  } catch { return 0; }
}

// ---------------------------------------------------------------------------
// Job store (in-memory)
// ---------------------------------------------------------------------------
/** @type {Map<string, Job>} */
const jobs = new Map();

function runningCount() {
  let n = 0;
  for (const j of jobs.values()) if (j.status === "running" || j.status === "queued") n++;
  return n;
}

function cleanupJobDir(j) {
  try { fs.rmSync(j.dir, { recursive: true, force: true }); } catch { /* bỏ qua */ }
}

/** Dọn job hết hạn định kỳ. */
setInterval(() => {
  const now = Date.now();
  for (const [id, j] of jobs) {
    if (now - j.createdAt > JOB_TTL_MS) {
      if (j.proc) { try { j.proc.kill("SIGKILL"); } catch {} }
      cleanupJobDir(j);
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 200 },
});

app.get("/api/health", async (req, res) => {
  let ffmpeg = false;
  try {
    await new Promise((resolve, reject) => {
      execFile(FFMPEG, ["-version"], { timeout: 8000 }, (err) => err ? reject(err) : resolve());
    });
    ffmpeg = true;
  } catch { ffmpeg = false; }
  res.json({ ok: true, version: VERSION, ffmpeg, runningJobs: runningCount() });
});

// --- POST /api/render -------------------------------------------------------
app.post("/api/render", upload.array("media", 200), async (req, res) => {
  // 1. Parse + kiểm tra spec
  let spec;
  try {
    spec = JSON.parse(req.body.spec);
  } catch {
    return res.status(400).json({ error: "Field 'spec' phải là JSON hợp lệ." });
  }
  if (!spec || typeof spec !== "object" || !Array.isArray(spec.tracks)) {
    return res.status(400).json({ error: "Spec thiếu tracks hoặc sai định dạng." });
  }

  // 2. Giới hạn concurrent jobs
  if (runningCount() >= MAX_CONCURRENT_JOBS) {
    return res.status(429).json({
      error: `Đang có ${MAX_CONCURRENT_JOBS} job chạy — thử lại sau.`,
    });
  }

  // 3. Tạo job dir
  const id = jobId();
  const dir = path.join(WORK_ROOT, id);
  const mediaDir = path.join(dir, "media");
  const outPath = path.join(dir, "output.mp4");
  try {
    fs.mkdirSync(mediaDir, { recursive: true });
  } catch (e) {
    return res.status(500).json({ error: "Không tạo được thư mục job: " + e.message });
  }

  // 4. Lưu media (sanitize tên file)
  const savedFiles = [];
  for (const f of req.files || []) {
    const safe = sanitizeFilename(f.originalname);
    if (!safe) {
      cleanupJobDir({ dir });
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    const dest = path.join(mediaDir, safe);
    // Double-check: dest phải nằm trong mediaDir (chống traversal)
    if (!dest.startsWith(mediaDir + path.sep)) {
      cleanupJobDir({ dir });
      return res.status(400).json({ error: `Tên file không hợp lệ: ${f.originalname}` });
    }
    try {
      fs.writeFileSync(dest, f.buffer);
      savedFiles.push(safe);
    } catch (e) {
      cleanupJobDir({ dir });
      return res.status(500).json({ error: "Không lưu được file media: " + e.message });
    }
  }

  // 5. Ghi spec.json
  const specPath = path.join(dir, "spec.json");
  try {
    fs.writeFileSync(specPath, JSON.stringify(spec));
  } catch (e) {
    cleanupJobDir({ dir });
    return res.status(500).json({ error: "Không ghi được spec: " + e.message });
  }

  // 6. Tạo job record
  const job = {
    id, dir, mediaDir, specPath, outPath,
    status: "queued",
    progress: 0,
    error: null,
    outputName: null,
    createdAt: Date.now(),
    proc: null,
    totalDuration: specDuration(spec),
    log: [],
  };
  jobs.set(id, job);

  // 7. Spawn render worker (argv cố định — KHÔNG shell)
  const args = [
    RENDER_JS,
    "--spec", specPath,
    "--out", outPath,
    "--media-dir", mediaDir,
    "--ffmpeg", FFMPEG,
    "--ffprobe", FFPROBE,
    "-y",
  ];
  let proc;
  try {
    proc = spawn(process.execPath, args, {
      cwd: path.dirname(RENDER_JS),
      stdio: ["ignore", "pipe", "pipe"],
      shell: false, // QUAN TRỌNG: không dùng shell
    });
  } catch (e) {
    job.status = "error";
    job.error = "Không khởi động được render worker: " + e.message;
    return res.status(201).json({ jobId: id });
  }
  job.proc = proc;
  job.status = "running";

  let stderrTail = "";
  proc.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    stderrTail += text;
    if (stderrTail.length > 20000) stderrTail = stderrTail.slice(-20000);
    // Parse progress từ ffmpeg
    for (const line of text.split("\n")) {
      const t = parseFfmpegTime(line);
      if (t !== null && job.totalDuration > 0) {
        job.progress = Math.min(0.99, Math.max(0, t / job.totalDuration));
      }
    }
  });
  proc.stdout.on("data", (chunk) => {
    job.log.push(chunk.toString().slice(0, 2000));
    if (job.log.length > 50) job.log.shift();
  });

  proc.on("close", (code, signal) => {
    job.proc = null;
    if (job.status === "cancelled") return; // đã bị DELETE
    if (code === 0 && fs.existsSync(outPath)) {
      job.status = "done";
      job.progress = 1;
      const stat = fs.statSync(outPath);
      job.outputName = `vcut-${id}.mp4`;
      job.outputSize = stat.size;
    } else {
      job.status = "error";
      const reason = signal ? `bị kill bởi signal ${signal}` : `thoát với mã ${code}`;
      job.error = `Render worker ${reason}. ` +
        (stderrTail ? "Chi tiết: " + stderrTail.slice(-1500) : "(không có stderr)");
    }
  });
  proc.on("error", (e) => {
    job.proc = null;
    if (job.status !== "cancelled") {
      job.status = "error";
      job.error = "Lỗi spawn render worker: " + e.message;
    }
  });

  return res.status(201).json({ jobId: id });
});

// --- GET /api/render/:id -----------------------------------------------------
app.get("/api/render/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Không tìm thấy job." });
  res.json({
    id: job.id,
    status: job.status,
    progress: Math.round(job.progress * 100) / 100,
    error: job.error,
    outputName: job.outputName,
    outputSize: job.outputSize || null,
  });
});

// --- GET /api/render/:id/download --------------------------------------------
app.get("/api/render/:id/download", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Không tìm thấy job." });
  if (job.status !== "done" || !fs.existsSync(job.outPath)) {
    return res.status(409).json({ error: `Job chưa xong (status=${job.status}).` });
  }
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="${job.outputName || "vcut-export.mp4"}"`);
  fs.createReadStream(job.outPath).pipe(res);
});

// --- DELETE /api/render/:id --------------------------------------------------
app.delete("/api/render/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Không tìm thấy job." });
  job.status = "cancelled";
  if (job.proc) { try { job.proc.kill("SIGTERM"); } catch {} }
  // Dọn sau 2s để process kịp thoát
  setTimeout(() => { cleanupJobDir(job); jobs.delete(job.id); }, 2000);
  res.json({ ok: true, id: job.id, status: "cancelled" });
});

// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🌉 VCut bridge server v${VERSION} đang chạy tại http://127.0.0.1:${PORT}`);
  console.log(`   render worker: ${RENDER_JS}`);
  console.log(`   work dir: ${WORK_ROOT} | max jobs: ${MAX_CONCURRENT_JOBS}`);
});
