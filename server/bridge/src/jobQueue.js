/**
 * jobQueue.js — RenderJobService: hàng đợi job render FIFO cho bridge server.
 *
 * R1-041: thay thế cơ chế "vượt MAX_CONCURRENT_JOBS → 429" bằng hàng đợi
 * đúng nghĩa: job thừa được xếp hàng (queued), chạy tuần tự khi có slot trống.
 *
 * Trạng thái job: queued → running → done | error | cancelled
 *
 * Thiết kế:
 *  - RenderJobService không biết gì về render worker cụ thể: nó nhận một
 *    `spawnJob(job)` do caller cung cấp, trả về ChildProcess-like
 *    ({ pid, stdin/stdout/stderr, kill(), on() }). Service tự wire
 *    stderr/stdout/close/error và parse tiến trình ffmpeg.
 *  - Cancel job đang chạy: kill cả process GROUP (POSIX) để ffmpeg con
 *    (spawnSync bên trong render.js) cũng chết theo, không bị mồ côi.
 *  - Retry thủ công: chỉ từ trạng thái error (thư mục job còn nguyên).
 *    Cancel xóa thư mục job → không retry được, phải tạo job mới.
 *  - In-memory: restart server làm mất job đang chạy; job queued được
 *    phục hồi best-effort từ WORK_ROOT (render lại từ đầu).
 *
 * Không phụ thuộc bên ngoài (chỉ dùng node builtins).
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { verifyOutput } = require("./outputQA"); // R1-043: QA output sau render

const TERMINAL = new Set(["done", "error", "cancelled"]);

/** Tạo job id ngẫu nhiên (16 ký tự hex). */
function newJobId() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Parse tiến trình từ 1 dòng stderr của ffmpeg (dạng "time=00:00:03.42").
 * Trả về số giây (float) hoặc null nếu không phải dòng progress.
 */
function parseFfmpegTime(line) {
  if (typeof line !== "string") return null;
  const m = /time=(\d+):(\d+):([\d.]+)/.exec(line);
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
}

/** Ước lượng duration từ spec object (meta.duration hoặc max end của clip). */
function specDuration(spec) {
  try {
    if (spec && spec.meta && typeof spec.meta.duration === "number" && spec.meta.duration > 0)
      return spec.meta.duration;
    let d = 0;
    for (const t of (spec && spec.tracks) || [])
      for (const c of t.clips || [])
        d = Math.max(d, (c.start || 0) + (c.duration || 0));
    return d;
  } catch {
    return 0;
  }
}

/**
 * Kill process + toàn bộ process group (POSIX). Cần thiết vì render worker
 * (node render.js) spawn ffmpeg bằng spawnSync — kill node đơn thuần sẽ
 * để lại ffmpeg mồ côi chạy nền.
 *
 * Yêu cầu child được spawn với `detached: true` để là group leader.
 * Trên Windows, kill group không hỗ trợ → fallback kill process đơn.
 *
 * @returns true nếu đã gửi signal (không đảm bảo process đã chết ngay).
 */
function killProcessTree(proc, signal) {
  signal = signal || "SIGTERM";
  if (!proc) return false;
  const pid = proc.pid;
  // 1. Thử kill cả group (POSIX). proc.kill với signal âm không hợp lệ
  //    nên dùng process.kill(-pid).
  if (pid && typeof pid === "number" && pid > 0) {
    try {
      process.kill(-pid, signal);
      return true;
    } catch {
      // Không phải POSIX / không có quyền / group không tồn tại → fallback
    }
  }
  // 2. Fallback: kill process đơn.
  try {
    proc.kill(signal);
    return true;
  } catch {
    return false;
  }
}

/** Kiểm tra process còn sống không (dùng cho test/kill escalation). */
function isAlive(pid) {
  if (!pid || typeof pid !== "number" || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Đọc spec.meta (width/height) từ spec.json của job — dùng cho QA output (R1-043).
 * Lỗi đọc/parse → trả về {} (các check thiếu kỳ vọng sẽ bị skip trong verifyOutput).
 */
function readSpecMeta(specPath) {
  try {
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    const m = (spec && spec.meta) || {};
    return {
      width: typeof m.width === "number" ? m.width : undefined,
      height: typeof m.height === "number" ? m.height : undefined,
    };
  } catch {
    return {};
  }
}

function rmDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* bỏ qua */
  }
}

class RenderJobService {
  /**
   * @param {object} opts
   * @param {number} [opts.maxConcurrent=2]  số job chạy đồng thời tối đa
   * @param {number} [opts.maxQueueLength=100] số job queued tối đa (vượt → enqueue throw)
   * @param {number} [opts.jobTtlMs=3600000]  job terminal giữ lại bao lâu
   * @param {(job: object) => object} opts.spawnJob  hàm spawn worker, trả về ChildProcess-like
   * @param {number} [opts.killGraceMs=5000]  chờ SIGTERM bao lâu trước khi SIGKILL
   * @param {string} [opts.ffprobeBin="ffprobe"]  đường dẫn ffprobe cho QA output (R1-043)
   * @param {boolean} [opts.enableQA=true]  bật/tắt QA output sau render (R1-043).
   *   Đặt false trong unit test để không phụ thuộc ffprobe/file mp4 thật.
   * @param {(job: object) => void} [opts.onDone]  R1-040: callback khi job done
   *   (dùng để dọn media ngay, giữ output+spec).
   */
  constructor(opts) {
    opts = opts || {};
    if (typeof opts.spawnJob !== "function")
      throw new Error("RenderJobService cần opts.spawnJob(job) → ChildProcess");
    this.maxConcurrent = opts.maxConcurrent ?? 2;
    this.maxQueueLength = opts.maxQueueLength ?? 100;
    this.jobTtlMs = opts.jobTtlMs ?? 3600 * 1000;
    this.killGraceMs = opts.killGraceMs ?? 5000;
    this.ffprobeBin = opts.ffprobeBin || "ffprobe"; // R1-043
    this.enableQA = opts.enableQA !== false; // R1-043: tắt trong unit test
    this.onDone = typeof opts.onDone === "function" ? opts.onDone : null; // R1-040
    this.spawnJob = opts.spawnJob;
    /** @type {Map<string, object>} */
    this.jobs = new Map();
    /** @type {string[]} FIFO id */
    this.fifo = [];
    this._janitor = null;
    this._seq = 0; // tiebreak khi createdAt trùng nhau (list mới nhất trước)
  }

  // ------------------------------------------------------------- public API

  /**
   * Xếp job mới vào hàng đợi. Ném lỗi QueueFullError khi hàng đợi đầy.
   * @returns job record (status: "queued")
   */
  enqueue({ id, dir, mediaDir, specPath, outPath, totalDuration, note, preset }) {
    if (this.fifo.length >= this.maxQueueLength) {
      const err = new Error(
        `Hàng đợi đầy (${this.maxQueueLength} job đang chờ) — thử lại sau.`
      );
      err.code = "QUEUE_FULL";
      throw err;
    }
    // Cho phép caller cấp id trước (để đặt tên thư mục job cuối cùng ngay từ
    // đầu, tránh race rename sau khi worker đã spawn). Nếu không cấp, tự sinh.
    if (id !== undefined) {
      if (!/^[0-9a-f]{16}$/.test(id)) {
        const err = new Error("Job id không hợp lệ.");
        err.code = "BAD_ID";
        throw err;
      }
      if (this.jobs.has(id)) {
        const err = new Error("Job id đã tồn tại.");
        err.code = "DUP_ID";
        throw err;
      }
    } else {
      id = newJobId();
    }
    // Mặc định đường dẫn theo quy ước dir/… để caller (nhất là test) không
    // bắt buộc truyền đủ.
    dir = dir || path.join(os.tmpdir(), "vcut-job-" + id);
    mediaDir = mediaDir || path.join(dir, "media");
    specPath = specPath || path.join(dir, "spec.json");
    outPath = outPath || path.join(dir, "output.mp4");
    const job = {
      id,
      dir, mediaDir, specPath, outPath,
      status: "queued",
      progress: 0,
      queuePosition: null,
      attempts: 0,
      error: null,
      outputName: null,
      outputSize: null,
      createdAt: Date.now(),
      seq: ++this._seq, // tiebreak cho list() khi createdAt trùng
      startedAt: null,
      finishedAt: null,
      totalDuration: totalDuration > 0 ? totalDuration : 0,
      note: note || null,
      preset: preset || null, // R1-042: quality params đã sanitize (crf/x264Preset/audioBitrate)
      recovered: false,
      proc: null,       // ChildProcess khi running (không serialize)
      _stderrTail: "",
      _killTimer: null,
    };
    this.jobs.set(id, job);
    this.fifo.push(id);
    this._refreshQueuePositions();
    this._pump();
    return job;
  }

  /** Lấy job theo id (hoặc undefined). */
  get(id) {
    return this.jobs.get(id);
  }

  /** Liệt kê job, mới nhất trước. */
  list({ limit } = {}) {
    const all = [...this.jobs.values()].sort(
      (a, b) => b.createdAt - a.createdAt || b.seq - a.seq
    );
    return typeof limit === "number" ? all.slice(0, limit) : all;
  }

  runningCount() {
    let n = 0;
    for (const j of this.jobs.values()) if (j.status === "running") n++;
    return n;
  }

  queuedCount() {
    return this.fifo.length;
  }

  /**
   * Hủy job. Job queued → gỡ khỏi hàng đợi + xóa thư mục.
   * Job running → SIGTERM cả process group, SIGKILL sau grace period.
   * @returns true nếu đã hủy, false nếu job đã ở trạng thái terminal / không tồn tại.
   */
  cancel(id) {
    const job = this.jobs.get(id);
    if (!job || TERMINAL.has(job.status)) return false;
    job.status = "cancelled";
    job.finishedAt = Date.now();
    job.progress = 0;

    // Gỡ khỏi hàng đợi nếu còn queued
    const qi = this.fifo.indexOf(id);
    if (qi !== -1) this.fifo.splice(qi, 1);

    // Kill process nếu đang chạy (kill group để ffmpeg con cũng chết)
    if (job.proc) {
      killProcessTree(job.proc, "SIGTERM");
      const proc = job.proc;
      job._killTimer = setTimeout(() => {
        if (isAlive(proc.pid)) killProcessTree(proc, "SIGKILL");
      }, this.killGraceMs);
      if (job._killTimer.unref) job._killTimer.unref();
    }

    rmDir(job.dir); // dọn ngay để giải phóng đĩa (→ không retry được sau cancel)
    job.proc = null;
    this._refreshQueuePositions();
    this._pump();
    return true;
  }

  /**
   * Chạy lại job bị lỗi. Chỉ cho phép từ trạng thái "error"
   * (thư mục job còn nguyên sau lỗi; sau cancel thư mục đã bị xóa).
   * @returns job record đã được xếp hàng lại.
   * @throws nếu job không tồn tại hoặc không ở trạng thái cho phép.
   */
  retry(id) {
    const job = this.jobs.get(id);
    if (!job) {
      const err = new Error("Không tìm thấy job.");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (job.status !== "error") {
      const err = new Error(
        `Chỉ retry được job ở trạng thái "error" (hiện tại: "${job.status}").` +
        (job.status === "cancelled"
          ? " Job đã hủy thì thư mục tạm đã bị xóa — hãy tạo job mới."
          : "")
      );
      err.code = "BAD_STATE";
      throw err;
    }
    if (!fs.existsSync(job.specPath)) {
      const err = new Error("Thư mục job đã bị dọn — không retry được, hãy tạo job mới.");
      err.code = "GONE";
      throw err;
    }
    job.status = "queued";
    job.progress = 0;
    job.error = null;
    job.startedAt = null;
    job.finishedAt = null;
    job.note = null;
    job._stderrTail = "";
    this.fifo.push(job.id);
    this._refreshQueuePositions();
    this._pump();
    return job;
  }

  /**
   * Phục hồi best-effort sau khi server restart: quét workRoot, mỗi thư mục
   * có spec.json được xếp hàng lại (render lại từ đầu, xóa output.mp4 cũ
   * nếu có để tránh file dở dang).
   * @returns số job đã phục hồi.
   */
  recover(workRoot) {
    let count = 0;
    let entries = [];
    try {
      entries = fs.readdirSync(workRoot, { withFileTypes: true });
    } catch {
      return 0;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const dir = path.join(workRoot, e.name);
      const specPath = path.join(dir, "spec.json");
      if (!fs.existsSync(specPath)) continue;
      // Xóa output cũ (có thể dở dang do restart giữa chừng)
      const outPath = path.join(dir, "output.mp4");
      try {
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      } catch { /* bỏ qua */ }
      let totalDuration = 0;
      try {
        const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
        totalDuration = specDuration(spec);
      } catch { /* giữ 0 */ }
      // Tránh trùng nếu recover được gọi 2 lần
      let dup = false;
      for (const j of this.jobs.values()) if (j.dir === dir) { dup = true; break; }
      if (dup) continue;
      try {
        const job = this.enqueue({
          dir,
          mediaDir: path.join(dir, "media"),
          specPath,
          outPath,
          totalDuration,
          note: "Phục hồi sau khi server restart — render lại từ đầu.",
        });
        job.recovered = true;
        count++;
      } catch {
        // Hàng đợi đầy → bỏ qua job phục hồi còn lại
        break;
      }
    }
    return count;
  }

  /** Dọn job terminal đã hết TTL. Trả về số job đã xóa. */
  sweep() {
    const now = Date.now();
    let n = 0;
    for (const [id, job] of this.jobs) {
      if (!TERMINAL.has(job.status)) continue;
      if (now - (job.finishedAt || job.createdAt) < this.jobTtlMs) continue;
      if (job.proc) killProcessTree(job.proc, "SIGKILL");
      if (job._killTimer) clearTimeout(job._killTimer);
      rmDir(job.dir);
      const qi = this.fifo.indexOf(id);
      if (qi !== -1) this.fifo.splice(qi, 1);
      this.jobs.delete(id);
      n++;
    }
    return n;
  }

  startJanitor(intervalMs) {
    this.stopJanitor();
    this._janitor = setInterval(() => {
      try { this.sweep(); } catch { /* bỏ qua */ }
    }, intervalMs || 5 * 60 * 1000);
    if (this._janitor.unref) this._janitor.unref();
  }

  stopJanitor() {
    if (this._janitor) clearInterval(this._janitor);
    this._janitor = null;
  }

  /** Hủy toàn bộ job (queued + running) — dùng khi shutdown. */
  shutdown() {
    this.stopJanitor();
    for (const id of [...this.jobs.keys()]) {
      try { this.cancel(id); } catch { /* bỏ qua */ }
    }
  }

  // ------------------------------------------------------------ internals

  _refreshQueuePositions() {
    this.fifo.forEach((id, i) => {
      const j = this.jobs.get(id);
      if (j) j.queuePosition = i + 1; // 1-based cho UI
    });
    for (const j of this.jobs.values()) {
      if (j.status !== "queued") j.queuePosition = null;
    }
  }

  _pump() {
    while (this.runningCount() < this.maxConcurrent && this.fifo.length > 0) {
      const id = this.fifo.shift();
      const job = this.jobs.get(id);
      if (!job || job.status !== "queued") continue; // đã bị cancel giữa chừng
      this._start(job);
    }
    this._refreshQueuePositions();
  }

  _start(job) {
    job.status = "running";
    job.startedAt = Date.now();
    job.attempts += 1;
    job.queuePosition = null;
    job._stderrTail = "";

    let proc;
    try {
      proc = this.spawnJob(job);
    } catch (e) {
      this._onError(job.id, "Không khởi động được render worker: " + (e && e.message));
      return;
    }
    if (!proc || typeof proc.on !== "function") {
      this._onError(job.id, "spawnJob phải trả về ChildProcess.");
      return;
    }
    job.proc = proc;

    proc.stderr && proc.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      job._stderrTail += text;
      if (job._stderrTail.length > 20000) job._stderrTail = job._stderrTail.slice(-20000);
      for (const line of text.split("\n")) {
        const t = parseFfmpegTime(line);
        if (t !== null && job.totalDuration > 0) {
          job.progress = Math.min(0.99, Math.max(0, t / job.totalDuration));
        }
      }
    });
    proc.stdout && proc.stdout.on("data", () => { /* bỏ qua log stdout */ });

    proc.on("error", (e) => {
      if (job.status === "cancelled") return;
      this._onError(job.id, "Lỗi spawn render worker: " + (e && e.message));
    });

    proc.on("close", async (code, signal) => {
      if (job._killTimer) { clearTimeout(job._killTimer); job._killTimer = null; }
      job.proc = null;
      if (job.status === "cancelled") {
        this._pump();
        return; // đã bị DELETE — giữ nguyên trạng thái cancelled
      }
      if (code === 0) {
        let size = 0;
        try { size = fs.statSync(job.outPath).size; } catch { /* không có file */ }
        if (size > 0) {
          // R1-043: QA output bằng ffprobe trước khi đánh dấu done.
          // Fail → job lỗi, file lỗi KHÔNG được trả cho user (download chỉ
          // phục vụ khi status === "done").
          // enableQA=false (unit test): bỏ qua QA, done luôn.
          if (!this.enableQA) {
            this._onDone(job.id, size);
            return;
          }
          try {
            const meta = readSpecMeta(job.specPath);
            const qa = await verifyOutput(job.outPath, {
              duration: job.totalDuration,
              width: meta.width,
              height: meta.height,
            }, this.ffprobeBin);
            job.qaReport = qa.report;
            if (qa.ok) {
              this._onDone(job.id, size);
            } else {
              this._onError(job.id,
                "Kiểm tra chất lượng output thất bại: " + qa.errors.join("; ") +
                " (file lỗi đã bị giữ lại, không trả cho người dùng)");
              // File lỗi giữ lại trong job dir để debug; dọn theo TTL.
            }
          } catch (e) {
            this._onError(job.id, "Lỗi khi kiểm tra chất lượng output: " + e.message);
          }
          return;
        }
        this._onError(job.id, "Render worker thoát mã 0 nhưng không tạo được file output.");
      } else {
        const reason = signal
          ? `bị kill bởi signal ${signal}`
          : `thoát với mã ${code}`;
        const tail = job._stderrTail ? " Chi tiết: " + job._stderrTail.slice(-1500) : "";
        this._onError(job.id, `Render worker ${reason}.${tail}`);
      }
    });

    this._pump(); // thử lấp slot còn lại (nếu maxConcurrent > 1)
  }

  _onDone(id, outputSize) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = "done";
    job.progress = 1;
    job.finishedAt = Date.now();
    job.outputName = `vcut-${id}.mp4`;
    job.outputSize = outputSize;
    if (this.onDone) { try { this.onDone(job); } catch { /* bỏ qua */ } } // R1-040
    this._pump();
  }

  _onError(id, message) {
    const job = this.jobs.get(id);
    if (!job) return;
    if (job.proc) { try { killProcessTree(job.proc, "SIGKILL"); } catch {} }
    job.proc = null;
    job.status = "error";
    // R1-040: log chi tiết ở server, API chỉ nhận tóm tắt (không leak đường dẫn nội bộ)
    console.error(`[bridge] job ${id} lỗi:`, message);
    job.error = String(message).split(" Chi tiết:")[0].split(" (file lỗi")[0];
    job.finishedAt = Date.now();
    this._pump();
  }
}

module.exports = {
  RenderJobService,
  newJobId,
  parseFfmpegTime,
  specDuration,
  killProcessTree,
  isAlive,
  TERMINAL: [...TERMINAL],
};
