"use strict";
/**
 * aiProgress.js — Helper dùng chung cho tiến trình + hủy job AI dài
 * (đợt 80 H8, gap N4).
 *
 * Vấn đề (gap §2.7 N4): các job AI (bgremove, caption, TTS...) chạy đồng bộ
 * hoặc chỉ báo phase thô, không có % thật và không hủy được — user tưởng
 * app treo, còn bridge thì cứ chạy tiếp dù client đã ngắt kết nối.
 *
 * Module này chứa 3 mảnh dùng chung, KHÔNG biết gì về từng job cụ thể:
 *   1. Abort: AbortController + lỗi chuẩn AI_JOB_ABORTED để mọi module
 *      Python-spawn đều hủy theo cùng 1 hợp đồng (kill process group).
 *   2. EtaTracker: ước lượng thời gian còn lại từ tốc độ hoàn thành thật
 *      (cửa sổ trượt 8s, giống computeEta của jobQueue.js nhưng làm việc
 *      trên đơn vị "done/total" chung — giây audio, frame, chunk...).
 *   3. attachClientAbort: cầu nối "client ngắt kết nối HTTP → hủy job"
 *      cho các route stream NDJSON (caption/scene/translate/bgremove/TTS).
 *
 * Quy ước tiến trình THẬT (không progress giả):
 *   - progress = done/total từ trạng thái job thật (frame đã xử lý, giây
 *     audio đã transcribe, chunk đã tổng hợp). KHÔNG ước lượng theo thời
 *     gian rồi kẹt ở 99%.
 *   - total = null khi chưa biết tổng (vd: TTS chưa đọc "chia thành N
 *     chunk") → progress = null, UI hiện spinner + phase thay vì % bịa.
 *   - progress đơn điệu không giảm (giữ max như jobQueue.js).
 *   - etaSeconds = null khi chưa đủ 2 sample trong cửa sổ 8s.
 */

const { killProcessTree } = require("./jobQueue");

/** Mã lỗi chuẩn khi job bị hủy (client bấm Hủy / ngắt kết nối). */
const AI_JOB_ABORTED = "AI_JOB_ABORTED";

/** Tạo Error hủy job: có .code để caller phân biệt với lỗi thật. */
function abortError(message) {
  const err = new Error(message || "Job đã bị hủy.");
  err.code = AI_JOB_ABORTED;
  err.aborted = true;
  return err;
}

/** true khi err là lỗi hủy job (không phải lỗi chạy thật). */
function isAbortError(err) {
  return !!err && (err.code === AI_JOB_ABORTED || err.aborted === true ||
    err.name === "AbortError");
}

/**
 * Kill 1 child process + toàn bộ process group của nó (POSIX), đợi tối đa
 * graceMs rồi SIGKILL. Dùng killProcessTree của jobQueue.js (kill group để
 * ffmpeg/python con cũng chết, không mồ côi — cùng lý do như render job).
 * Trả về Promise<boolean>: true khi process đã chết (hoặc vốn đã chết),
 * false khi sau grace + SIGKILL vẫn còn sống (ghi log để caller biết).
 */
function killChildTree(child, graceMs) {
  const grace = Number.isFinite(graceMs) && graceMs >= 0 ? graceMs : 2000;
  return new Promise((resolve) => {
    if (!child || typeof child.pid !== "number") {
      resolve(true);
      return;
    }
    const pid = child.pid;
    const alive = () => {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    };
    if (!alive()) {
      resolve(true);
      return;
    }
    let settled = false;
    const done = (v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.removeListener("exit", onExit);
      resolve(v);
    };
    const onExit = () => done(true);
    child.once("exit", onExit);
    killProcessTree(child, "SIGTERM");
    const timer = setTimeout(() => {
      if (!alive()) {
        done(true);
        return;
      }
      killProcessTree(child, "SIGKILL");
      // Cho SIGKILL một nhịp thở rồi kết luận.
      setTimeout(() => done(!alive()), 250);
    }, grace);
    if (timer.unref) timer.unref();
  });
}

/**
 * Gắn 1 AbortSignal vào 1 child process: khi signal abort → kill cây
 * process. Trả về hàm detach() để gỡ listener (tránh rò rỉ khi job xong).
 * Nếu signal đã abort sẵn thì kill ngay và trả detach rỗng.
 */
function killChildOnAbort(child, signal, graceMs) {
  if (!signal) return () => {};
  if (signal.aborted) {
    killChildTree(child, graceMs).catch(() => {});
    return () => {};
  }
  const onAbort = () => {
    killChildTree(child, graceMs).catch(() => {});
  };
  signal.addEventListener("abort", onAbort, { once: true });
  return () => {
    try {
      signal.removeEventListener("abort", onAbort);
    } catch {
      /* bỏ qua */
    }
  };
}

/**
 * Tính progress 0..1 từ done/total thật. Trả về null khi chưa biết tổng
 * (total null/<=0) hoặc done không phải số — caller KHÔNG được bịa %.
 */
function progressFromDoneTotal(done, total) {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return Math.min(1, Math.max(0, done / total));
}

/** Cửa sổ trượt (ms) để ước lượng tốc độ hoàn thành cho ETA. */
const ETA_WINDOW_MS = 8000;
/** Số sample tối thiểu để tính ETA. */
const ETA_MIN_SAMPLES = 2;

/**
 * Theo dõi tốc độ hoàn thành thật để ước lượng thời gian còn lại.
 * Cách dùng: tracker.push(done) mỗi lần job báo tiến trình (done tăng
 * dần theo đơn vị của job: giây audio, frame, chunk...); etaSeconds(total)
 * trả về số giây còn lại (float) hoặc null khi chưa đủ dữ liệu.
 * progress đơn điệu: push() chỉ nhận sample khi done tăng (done lùi thì
 * chỉ refresh timestamp, giống pushSample của jobQueue.js).
 */
class EtaTracker {
  constructor() {
    /** @type {Array<{at:number, done:number}>} */
    this.samples = [];
    /** Progress cao nhất từng thấy (đơn điệu, không giảm). */
    this.maxProgress = 0;
  }

  /** Thêm 1 sample {at, done}. Trả về progress đơn điệu 0..1 (hoặc null). */
  push(done, total) {
    const now = Date.now();
    const last = this.samples[this.samples.length - 1];
    if (last && done <= last.done) {
      last.at = now;
      return progressFromDoneTotal(done, total);
    }
    this.samples.push({ at: now, done });
    while (this.samples.length > 20) this.samples.shift();
    const cut = now - ETA_WINDOW_MS;
    while (this.samples.length > ETA_MIN_SAMPLES && this.samples[0].at < cut) {
      this.samples.shift();
    }
    const p = progressFromDoneTotal(done, total);
    if (p !== null && p > this.maxProgress) this.maxProgress = p;
    return this.maxProgress;
  }

  /** ETA (giây, float) hoặc null khi chưa đủ dữ liệu. */
  etaSeconds(total) {
    const s = this.samples;
    if (!Number.isFinite(total) || total <= 0 || s.length < ETA_MIN_SAMPLES) {
      return null;
    }
    const a = s[0];
    const b = s[s.length - 1];
    const remain = total - b.done;
    // Đợt 81 I6: đã xong (không còn việc) → còn 0 giây, KHÔNG phụ thuộc
    // dWall/dDone — job nhanh có thể dồn hết progress event trong cùng 1ms
    // (dWall = 0) thì event cuối vẫn phải mang ETA 0 chứ không phải null.
    if (remain <= 0) return 0;
    const dWall = (b.at - a.at) / 1000;
    const dDone = b.done - a.done;
    if (dWall <= 0 || dDone <= 0) return null;
    const speed = dDone / dWall; // đơn vị công việc / giây-thật
    return Math.max(0, remain / speed);
  }
}

/**
 * Cầu nối "client ngắt kết nối HTTP → hủy job" cho route stream NDJSON.
 * Lắng nghe `res` 'close': khi response đóng mà chưa `res.end()` (client
 * abort fetch / đóng tab / mất mạng) thì gọi controller.abort() để module
 * job kill subprocess. Khi job xong bình thường (`res.writableEnded`)
 * thì không abort. Trả về detach() để gỡ listener khi route xong.
 *
 * Vì sao nghe `res` chứ không nghe `req`: body multipart đã được multer
 * đọc xong trước khi handler chạy nên `req` 'close' có thể đã bắn; còn
 * `res` 'close' chỉ bắn khi response kết thúc thật hoặc socket đứt —
 * kết hợp với `res.writableEnded` thì phân biệt được "xong" vs "đứt".
 */
function attachClientAbort(res, controller) {
  if (!res || !controller) return () => {};
  const onClose = () => {
    if (!res.writableEnded) {
      try {
        controller.abort();
      } catch {
        /* bỏ qua */
      }
    }
  };
  res.on("close", onClose);
  return () => {
    try {
      res.removeListener("close", onClose);
    } catch {
      /* bỏ qua */
    }
  };
}

/**
 * Tạo hàm gửi event NDJSON `{type:"progress",...}` cho 1 route stream.
 * Giữ progress ĐƠN ĐIỆU (không giảm) và tính ETA từ EtaTracker — route chỉ
 * cần gọi `sendProgress(phase, done, total, message?)` mỗi lần module job
 * báo tiến trình. done/total theo đơn vị của job (giây audio, frame,
 * chunk, hoặc % với total=100); progress = null khi chưa biết total
 * (UI hiện spinner + phase thay vì % bịa).
 */
function createProgressSender(send) {
  const eta = new EtaTracker();
  let lastProgress = 0;
  return (phase, done, total, message) => {
    eta.push(done, total);
    const raw = progressFromDoneTotal(done, total);
    if (raw !== null && raw > lastProgress) lastProgress = raw;
    send({
      type: "progress",
      phase,
      progress: raw === null ? null : lastProgress,
      done: Number.isFinite(done) ? done : null,
      total: Number.isFinite(total) && total > 0 ? total : null,
      etaSeconds: eta.etaSeconds(total),
      ...(message ? { message } : {}),
    });
  };
}

module.exports = {
  AI_JOB_ABORTED,
  abortError,
  isAbortError,
  killChildTree,
  killChildOnAbort,
  progressFromDoneTotal,
  EtaTracker,
  ETA_WINDOW_MS,
  ETA_MIN_SAMPLES,
  attachClientAbort,
  createProgressSender,
};
