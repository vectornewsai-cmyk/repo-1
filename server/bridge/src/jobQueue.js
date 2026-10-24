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
 *  - P7: trạng thái job được LƯU ĐĨA (job.json trong thư mục job, ghi
 *    tmp + rename cho atomic) mỗi lần đổi trạng thái. Restart server:
 *    queued → xếp hàng lại (giữ nguyên id), running → "interrupted"
 *    (trạng thái cuối, retry được, KHÔNG giả vờ chạy tiếp), done/error →
 *    khôi phục nguyên trạng, không render lại. Dir legacy (trước P7,
 *    chưa có job.json) giữ hành vi cũ: quét spec.json, render lại từ đầu.
 *
 * R1-065: tiến trình export thời gian thực — parse time=/frame= từ stderr
 * ffmpeg (chuẩn hóa \r), progress đơn điệu 0→0.99 (1 khi done), ETA ước lượng
 * từ tốc độ render trong cửa sổ trượt 8s, expose qua etaSeconds.
 *
 * Không phụ thuộc bên ngoài (chỉ dùng node builtins).
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { verifyOutput } = require("./outputQA"); // R1-043: QA output sau render

const TERMINAL = new Set(["done", "error", "cancelled", "interrupted"]);

/** P7: các trạng thái job.json hợp lệ khi khôi phục. */
const KNOWN_STATUSES = new Set([
  "queued", "running", "done", "error", "cancelled", "interrupted",
]);

/**
 * P7: trích các field có thể serialize của job record (bỏ proc, timers,
 * stderr tail, samples — progress thời gian thực không cần bền vững).
 */
function serializeJobState(job) {
  return {
    id: job.id,
    dir: job.dir,
    mediaDir: job.mediaDir,
    specPath: job.specPath,
    outPath: job.outPath,
    status: job.status,
    progress: job.progress,
    totalDuration: job.totalDuration,
    attempts: job.attempts,
    error: job.error,
    outputName: job.outputName,
    outputSize: job.outputSize,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    note: job.note,
    preset: job.preset,
    qaReport: job.qaReport || null,
  };
}

/**
 * P7: ghi job.json atomically (tmp + rename). Lỗi ghi KHÔNG được làm
 * hỏng job đang chạy — chỉ log, trạng thái bộ nhớ vẫn đúng.
 */
function saveJobState(job) {
  try {
    fs.mkdirSync(job.dir, { recursive: true });
    const tmp = path.join(job.dir, `.job.json.tmp-${process.pid}`);
    fs.writeFileSync(tmp, JSON.stringify(serializeJobState(job)));
    fs.renameSync(tmp, path.join(job.dir, "job.json"));
  } catch (e) {
    console.error(`[bridge] không ghi được job.json cho job ${job.id}:`, e.message);
  }
}

/**
 * P7: đọc job.json của 1 thư mục job. Trả về object đã validate sơ bộ,
 * hoặc null nếu không có file / file hỏng / id/status không hợp lệ.
 */
function loadJobState(dir) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(dir, "job.json"), "utf8"));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.id !== "string" || !/^[0-9a-f]{16}$/.test(raw.id)) return null;
  if (typeof raw.status !== "string" || !KNOWN_STATUSES.has(raw.status)) return null;
  return raw;
}

/** Tạo job id ngẫu nhiên (16 ký tự hex). */
function newJobId() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Parse 1 dòng stderr của ffmpeg → { time, frame }.
 *  - time: số giây (float) từ "time=HH:MM:SS.ss", null nếu không có.
 *  - frame: số frame từ "frame= 123", null nếu không có.
 * R1-065: frame= là fallback khi ffmpeg không báo time= (một số build/format).
 */
function parseFfmpegProgress(line) {
  let time = null;
  let frame = null;
  if (typeof line === "string") {
    const mt = /time=(\d+):(\d+):([\d.]+)/.exec(line);
    if (mt) time = (+mt[1]) * 3600 + (+mt[2]) * 60 + (+mt[3]);
    const mf = /frame=\s*(\d+)/.exec(line);
    if (mf) frame = +mf[1];
  }
  return { time, frame };
}

/**
 * Parse tiến trình từ 1 dòng stderr của ffmpeg (dạng "time=00:00:03.42").
 * Trả về số giây (float) hoặc null nếu không phải dòng progress.
 * (Giữ API cũ — R1-065 bổ sung parseFfmpegProgress cho frame= fallback.)
 */
function parseFfmpegTime(line) {
  return parseFfmpegProgress(line).time;
}

// --- R1-065: ước lượng ETA từ tốc độ render gần nhất -------------------------
/** Cửa sổ trượt (ms) để ước lượng tốc độ render cho ETA. */
const ETA_WINDOW_MS = 8000;
/** Số sample tối thiểu để tính ETA. */
const ETA_MIN_SAMPLES = 2;

/**
 * Thêm 1 sample {at, time} vào job._samples. time không tiến (chunk lặp)
 * thì chỉ refresh timestamp để cửa sổ trượt không bị cũ.
 */
function pushSample(job, t) {
  const now = Date.now();
  const s = job._samples || (job._samples = []);
  const last = s[s.length - 1];
  if (last && t <= last.time) {
    last.at = now;
    return;
  }
  s.push({ at: now, time: t });
  while (s.length > 20) s.shift();
  const cut = now - ETA_WINDOW_MS;
  while (s.length > ETA_MIN_SAMPLES && s[0].at < cut) s.shift();
}

/**
 * ETA (giây, float) = thời gian-video còn lại / tốc độ gần nhất.
 * Trả về null khi chưa đủ dữ liệu để ước lượng.
 */
function computeEta(job) {
  const s = job._samples || [];
  if (job.totalDuration <= 0 || s.length < ETA_MIN_SAMPLES) return null;
  const a = s[0];
  const b = s[s.length - 1];
  const dWall = (b.at - a.at) / 1000; // giây-thật
  const dTime = b.time - a.time;      // giây-video đã render
  if (dWall <= 0 || dTime <= 0) return null;
  const speed = dTime / dWall;
  const remain = job.totalDuration - b.time;
  if (remain <= 0) return 0;
  return Math.max(0, remain / speed);
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
 * Đọc spec.meta (width/height/fps) từ spec.json của job — dùng cho QA output
 * (R1-043) và frame= fallback của progress (R1-065).
 * Lỗi đọc/parse → trả về {} (các check thiếu kỳ vọng sẽ bị skip trong verifyOutput).
 */
function readSpecMeta(specPath) {
  try {
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    const m = (spec && spec.meta) || {};
    return {
      width: typeof m.width === "number" ? m.width : undefined,
      height: typeof m.height === "number" ? m.height : undefined,
      fps: typeof m.fps === "number" ? m.fps : undefined, // R1-065
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
  enqueue({ id, dir, mediaDir, specPath, outPath, totalDuration, note, preset, createdAt, attempts, recovered }) {
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
      etaSeconds: null,   // R1-065: ước lượng thời gian còn lại (giây)
      totalFps: 0,        // R1-065: fps từ spec.meta (frame= fallback)
      _samples: [],       // R1-065: sample progress cho ETA (không serialize)
      queuePosition: null,
      attempts: attempts || 0, // P7: recover giữ nguyên số lần thử đã lưu
      error: null,
      outputName: null,
      outputSize: null,
      createdAt: createdAt || Date.now(), // P7: recover giữ nguyên thời điểm tạo
      seq: ++this._seq, // tiebreak cho list() khi createdAt trùng
      startedAt: null,
      finishedAt: null,
      totalDuration: totalDuration > 0 ? totalDuration : 0,
      note: note || null,
      preset: preset || null, // R1-042: quality params đã sanitize (crf/x264Preset/audioBitrate)
      recovered: !!recovered, // P7: recover() truyền true để job.json ghi đúng 1 lần
      proc: null,       // ChildProcess khi running (không serialize)
      _stderrTail: "",
      _killTimer: null,
    };
    this.jobs.set(id, job);
    this.fifo.push(id);
    this._refreshQueuePositions();
    saveJobState(job); // P7: bền vững ngay từ lúc xếp hàng
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
    job.etaSeconds = null; // R1-065

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
   * Chạy lại job bị lỗi hoặc bị gián đoạn. Cho phép từ trạng thái "error"
   * và "interrupted" (P7 — cả hai đều còn nguyên thư mục job; sau cancel
   * thư mục đã bị xóa nên không retry được).
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
    if (job.status !== "error" && job.status !== "interrupted") {
      const err = new Error(
        `Chỉ retry được job ở trạng thái "error" hoặc "interrupted" (hiện tại: "${job.status}").` +
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
    job.etaSeconds = null; // R1-065
    job._samples = [];     // R1-065
    job.error = null;
    job.startedAt = null;
    job.finishedAt = null;
    job.note = null;
    job._stderrTail = "";
    this.fifo.push(job.id);
    this._refreshQueuePositions();
    saveJobState(job); // P7
    this._pump();
    return job;
  }

  /**
   * P7: phục hồi sau khi server restart, dựa trên job.json bền vững:
   *  - queued → xếp hàng lại (giữ nguyên id, createdAt, preset), render lại
   *    từ đầu, xóa output.mp4 cũ nếu có (file dở dang).
   *  - running → "interrupted" (trạng thái cuối, retry được): process cũ
   *    đã chết theo server, KHÔNG giả vờ chạy tiếp, KHÔNG tự render lại.
   *    Output dở dang bị xóa để không ai nhầm là file hoàn chỉnh.
   *  - done/error → khôi phục nguyên trạng trong bộ nhớ (không spawn,
   *    không render lại). Riêng done: media có thể đã bị prune (R1-040)
   *    nhưng record + output vẫn phục vụ download bình thường.
   *  - cancelled → thư mục đã bị xóa khi cancel nên không gặp; nếu gặp
   *    (job.json còn sót) thì khôi phục nguyên trạng, không render lại.
   *  - Dir legacy (chưa có job.json, từ trước P7): giữ hành vi cũ —
   *    có spec.json thì xếp hàng lại, render từ đầu; ngoại lệ: có
   *    output.mp4 + media đã bị prune (dấu hiệu job done cũ) thì khôi
   *    phục thành "done" thay vì render lại rồi lỗi thiếu media.
   *  - Dir không có spec.json và không có job.json → bỏ qua.
   *  - job.json hỏng / id sai định dạng → bỏ qua + log cảnh báo.
   *
   * Trả về TỔNG số record đã khôi phục (giữ tương thích test cũ kiểm
   * tra `n === 2`); chi tiết nằm ở `this.recoverStats`
   * ({ queued, interrupted, restored, legacy, skipped }).
   */
  recover(workRoot) {
    const stats = { queued: 0, interrupted: 0, restored: 0, legacy: 0, skipped: 0 };
    this.recoverStats = stats;
    let entries = [];
    try {
      entries = fs.readdirSync(workRoot, { withFileTypes: true });
    } catch {
      return 0;
    }
    const seenDir = (dir) => {
      for (const j of this.jobs.values()) if (j.dir === dir) return true;
      return false;
    };
    const restoreRecord = (saved, dir) => {
      // Khôi phục record terminal/không-chạy vào bộ nhớ, không spawn.
      const job = {
        id: saved.id,
        dir,
        mediaDir: saved.mediaDir || path.join(dir, "media"),
        specPath: saved.specPath || path.join(dir, "spec.json"),
        outPath: saved.outPath || path.join(dir, "output.mp4"),
        status: saved.status,
        progress: typeof saved.progress === "number" ? saved.progress : 0,
        etaSeconds: null,
        totalFps: 0,
        _samples: [],
        queuePosition: null,
        attempts: saved.attempts || 0,
        error: saved.error || null,
        outputName: saved.outputName || null,
        outputSize: saved.outputSize || null,
        createdAt: saved.createdAt || Date.now(),
        seq: ++this._seq,
        startedAt: saved.startedAt || null,
        finishedAt: saved.finishedAt || Date.now(),
        totalDuration: saved.totalDuration || 0,
        note: saved.note || null,
        preset: saved.preset || null,
        qaReport: saved.qaReport || null,
        recovered: true,
        proc: null,
        _stderrTail: "",
        _killTimer: null,
      };
      this.jobs.set(job.id, job);
      return job;
    };
    const dropPartialOutput = (dir) => {
      try {
        const outPath = path.join(dir, "output.mp4");
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      } catch { /* bỏ qua */ }
    };

    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const dir = path.join(workRoot, e.name);
      if (seenDir(dir)) continue; // recover gọi 2 lần → bỏ qua job đã có
      const saved = loadJobState(dir);
      if (saved) {
        if (saved.status === "queued") {
          // Cần spec.json mới render lại được; thiếu spec → lỗi rõ ràng.
          if (!fs.existsSync(saved.specPath || path.join(dir, "spec.json"))) {
            const job = restoreRecord({ ...saved, status: "error",
              error: "spec.json bị thiếu sau khi server restart — không render lại được, hãy tạo job mới." }, dir);
            job.finishedAt = Date.now();
            stats.restored++;
            continue;
          }
          try {
            this.enqueue({
              id: saved.id,
              dir,
              mediaDir: saved.mediaDir || path.join(dir, "media"),
              specPath: saved.specPath || path.join(dir, "spec.json"),
              outPath: saved.outPath || path.join(dir, "output.mp4"),
              totalDuration: saved.totalDuration || 0,
              note: saved.note || "Phục hồi sau khi server restart — render lại từ đầu.",
              preset: saved.preset || null,
              createdAt: saved.createdAt,
              attempts: saved.attempts || 0,
              recovered: true,
            });
            dropPartialOutput(dir);
            stats.queued++;
          } catch {
            // Hàng đợi đầy → bỏ qua job phục hồi còn lại
            break;
          }
        } else if (saved.status === "running") {
          // Process cũ đã chết theo server: đánh dấu gián đoạn, không tự chạy lại.
          dropPartialOutput(dir);
          const job = restoreRecord({ ...saved, status: "interrupted",
            error: "Bị gián đoạn do bridge restart — dùng retry để render lại từ đầu." }, dir);
          job.finishedAt = Date.now();
          saveJobState(job); // ghi đè "running" cũ → "interrupted" bền vững
          stats.interrupted++;
        } else {
          // done / error / cancelled: khôi phục nguyên trạng, không spawn.
          restoreRecord(saved, dir);
          stats.restored++;
        }
        continue;
      }
      // --- Legacy: chưa có job.json ---
      const specPath = path.join(dir, "spec.json");
      if (!fs.existsSync(specPath)) { stats.skipped++; continue; }
      const outPath = path.join(dir, "output.mp4");
      const mediaDir = path.join(dir, "media");
      let outSize = 0;
      try { outSize = fs.statSync(outPath).size; } catch { /* không có output */ }
      let mediaGone = false;
      try { mediaGone = !fs.existsSync(mediaDir); } catch { mediaGone = false; }
      if (outSize > 0 && mediaGone && /^[0-9a-f]{16}$/.test(e.name)) {
        // Dấu hiệu job done cũ (media đã prune theo R1-040): khôi phục "done".
        restoreRecord({ id: e.name, status: "done", outputName: `vcut-${e.name}.mp4`,
          outputSize: outSize, createdAt: Date.now() }, dir);
        stats.legacy++;
        continue;
      }
      // Hành vi cũ: xóa output dở dang, xếp hàng render lại từ đầu.
      dropPartialOutput(dir);
      let totalDuration = 0;
      try {
        const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
        totalDuration = specDuration(spec);
      } catch { /* giữ 0 */ }
      try {
        this.enqueue({
          dir,
          mediaDir,
          specPath,
          outPath,
          totalDuration,
          note: "Phục hồi sau khi server restart — render lại từ đầu.",
          recovered: true,
        });
        stats.legacy++;
      } catch {
        // Hàng đợi đầy → bỏ qua job phục hồi còn lại
        break;
      }
    }
    return stats.queued + stats.interrupted + stats.restored + stats.legacy;
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
    job.etaSeconds = null; // R1-065
    job._samples = [];     // R1-065
    saveJobState(job); // P7: crash sau điểm này → restart thấy "running" → interrupted
    // R1-065: đọc fps từ spec để làm frame= fallback khi ffmpeg thiếu time=
    job.totalFps = 0;
    try {
      const meta = readSpecMeta(job.specPath);
      if (meta.fps > 0) job.totalFps = meta.fps;
    } catch { /* giữ 0 → không fallback */ }

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
      // R1-065: ffmpeg viết progress updates bằng \r (cùng 1 dòng) → chuẩn hóa
      // thành \n trước khi tách dòng, lấy update MỚI NHẤT trong mỗi chunk.
      let bestTime = null;
      let bestFrame = null;
      for (const line of text.replace(/\r/g, "\n").split("\n")) {
        const p = parseFfmpegProgress(line);
        if (p.time !== null) bestTime = p.time;
        if (p.frame !== null) bestFrame = p.frame;
      }
      let t = bestTime;
      if (t === null && bestFrame !== null && job.totalFps > 0 && job.totalDuration > 0) {
        // R1-065 fallback: ffmpeg không báo time= → ước lượng từ frame=
        t = bestFrame / job.totalFps;
      }
      if (t !== null && job.totalDuration > 0) {
        const p = Math.min(0.99, Math.max(0, t / job.totalDuration));
        if (p > job.progress) job.progress = p; // đơn điệu không giảm
        pushSample(job, t);
        job.etaSeconds = computeEta(job);
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
    job.etaSeconds = 0; // R1-065
    job.finishedAt = Date.now();
    job.outputName = `vcut-${id}.mp4`;
    job.outputSize = outputSize;
    if (this.onDone) { try { this.onDone(job); } catch { /* bỏ qua */ } } // R1-040
    saveJobState(job); // P7: restart sau điểm này → khôi phục "done", không render lại
    this._pump();
  }

  _onError(id, message) {
    const job = this.jobs.get(id);
    if (!job) return;
    if (job.proc) { try { killProcessTree(job.proc, "SIGKILL"); } catch {} }
    job.proc = null;
    job.status = "error";
    job.etaSeconds = null; // R1-065
    // R1-040: log chi tiết ở server, API chỉ nhận tóm tắt (không leak đường dẫn nội bộ)
    console.error(`[bridge] job ${id} lỗi:`, message);
    job.error = String(message).split(" Chi tiết:")[0].split(" (file lỗi")[0];
    job.finishedAt = Date.now();
    saveJobState(job); // P7
    this._pump();
  }
}

module.exports = {
  RenderJobService,
  newJobId,
  parseFfmpegTime,
  parseFfmpegProgress, // R1-065
  computeEta,          // R1-065
  specDuration,
  killProcessTree,
  isAlive,
  TERMINAL: [...TERMINAL],
};
