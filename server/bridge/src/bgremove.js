"use strict";
/**
 * bgremove.js — AI background removal qua server/bgremove/bgremove.py (rembg, 100% local).
 *
 * R1-084: bridge nhận 1 file video (multipart — KHÔNG nhận đường dẫn tuyệt đối
 * từ client, theo chính sách bảo mật của bridge), chạy bgremove.py bằng
 * child_process.spawn với argv CỐ ĐỊNH (không shell, không lệnh tùy ý),
 * rồi trả về file video có alpha (MOV PNG) cho UI.
 *
 * Giấy phép stack (đã kiểm chứng trực tiếp ngày 2026-10-19):
 *   - rembg 2.0.38: MIT (PyPI classifier "License :: OSI Approved :: MIT License")
 *   - BiRefNet (gốc weights birefnet-general): MIT (GitHub API ZhengPeng7/BiRefNet)
 *   - File ONNX do project rembg (MIT) phân phối qua GitHub releases.
 * BẪY ĐÃ TRÁNH: session bria-rmbg / rmbg-2.0 là weights NON-COMMERCIAL —
 * bgremove.py từ chối chạy nếu session thuộc danh sách cấm.
 *
 * Tiến trình được stream về client dạng NDJSON qua onPhase callback.
 */

const path = require("path");
const { codedError } = require("./errorCodes"); // Đợt 62 R5: mã lỗi bridge→web
const fs = require("fs");
const { spawn } = require("child_process");
const { redactStderr } = require("./errorDetail"); // Đợt 29 L3
// Đợt 80 H8 (gap N4): hủy job thật + tiến trình thật.
const { abortError, isAbortError, killChildOnAbort, killChildTree, progressFromDoneTotal } = require("./aiProgress");

// rembg birefnet-general ~973MB, CPU có thể mất vài phút cho video ngắn.
// Timeout dài nhưng vẫn có giới hạn để không treo worker.
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

// Session bị CẤM (non-commercial) — phải khớp với FORBIDDEN_SESSIONS trong bgremove.py
const FORBIDDEN_SESSIONS = new Set(["bria-rmbg", "rmbg-2.0", "bria"]);
const DEFAULT_SESSION = "birefnet-general";
// Phase 7 P6: session nặng RAM — kernel OOM-kill (SIGKILL) không bắt được
// trong tiến trình Python, nên bridge retry 1 lần bằng u2net khi lần chạy
// birefnet chết (exit != 0 hoặc bị signal). Timeout thì KHÔNG retry
// (chậm chứ không phải OOM — retry chỉ tốn thêm thời gian).
const BIREFNET_SESSIONS = new Set(["birefnet-general", "birefnet-general-lite"]);
const FALLBACK_SESSION = "u2net";

function bgremoveConfigFromEnv(env = process.env) {
  const t = parseInt(env.BGREMOVE_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.BGREMOVE_PYTHON || "python3",
    bgremovePy: env.BGREMOVE_PY ||
      path.resolve(__dirname, "..", "..", "bgremove", "bgremove.py"),
    modelDir: env.BGREMOVE_MODEL_DIR || null,
    timeoutMs: Number.isFinite(t) && t >= 30_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/** Validate session; throw → endpoint trả 400. "auto" = thử birefnet rồi fallback u2net. */
function validateSession(raw) {
  const s = String(raw ?? DEFAULT_SESSION).trim().toLowerCase() || DEFAULT_SESSION;
  if (s === "auto") return "auto";
  if (FORBIDDEN_SESSIONS.has(s)) {
    throw codedError(
      "BGREMOVE_SESSION_FORBIDDEN",
      `Session "${raw}" BỊ CẤM: weights non-commercial, không được dùng. ` +
      `Dùng "${DEFAULT_SESSION}" (MIT).`,
      { session: raw, fallback: DEFAULT_SESSION },
    );
  }
  if (!/^[a-z0-9_-]+$/.test(s)) {
    throw codedError("BGREMOVE_SESSION_INVALID", `Tên session không hợp lệ: "${raw}".`, { value: raw });
  }
  return s;
}

/** Phase 9 đợt 2: validate tham số smoothing (khớp --temporal/--feather
 * của bgremove.py); throw → endpoint trả 400. Mặc định temporal=0.4,
 * feather=1 — giống mặc định của bgremove.py. */
function validateTemporal(raw) {
  if (raw === undefined || raw === null || raw === "") return 0.4;
  const v = Number(raw);
  if (!Number.isFinite(v) || v < 0 || v > 0.9) {
    throw codedError("BGREMOVE_TEMPORAL_INVALID", `Tham số temporal không hợp lệ: "${raw}" (phải trong [0, 0.9]).`, { value: raw });
  }
  return v;
}

function validateFeather(raw) {
  if (raw === undefined || raw === null || raw === "") return 1;
  const v = Number(raw);
  if (!Number.isInteger(v) || v < 0 || v > 8) {
    throw codedError("BGREMOVE_FEATHER_INVALID", `Tham số feather không hợp lệ: "${raw}" (phải là số nguyên trong [0, 8]).`, { value: raw });
  }
  return v;
}

/** Đọc marker machine-readable mà bgremove.py in ra stderr.
 * Đợt 88 P7: thêm marker RAM guard (ram_guard_from / ram_guard_avail_mb /
 * ram_guard_min_mb) — Python chuyển u2net ngay từ đầu thay vì thử birefnet
 * rồi chết SIGKILL, nên bridge cần báo đúng lý do cho UI thay vì "lỗi trong
 * quá trình chạy". */
function parseSessionMarkers(stderrText) {
  const used = stderrText.match(/\[bgremove\]\s+session_used=([a-z0-9_-]+)/);
  const fb = stderrText.match(/\[bgremove\]\s+fallback_from=([a-z0-9_-]+)/);
  const guard = stderrText.match(/\[bgremove\]\s+ram_guard_from=([a-z0-9_-]+)/);
  const avail = stderrText.match(/\[bgremove\]\s+ram_guard_avail_mb=(\d+)/);
  const min = stderrText.match(/\[bgremove\]\s+ram_guard_min_mb=(\d+)/);
  return {
    sessionUsed: used ? used[1] : null,
    fallbackFrom: fb ? fb[1] : null,
    ramGuardFrom: guard ? guard[1] : null,
    ramGuardAvailMb: avail ? parseInt(avail[1], 10) : null,
    ramGuardMinMb: min ? parseInt(min[1], 10) : null,
  };
}

/**
 * Đợt 80 H8 (gap N4): nhận diện tiến trình THẬT từ 1 dòng stderr của
 * bgremove.py — dạng "[bgremove] 30/90 (33%)" (frame đã xử lý / tổng frame).
 * Trả về { done, total, progress } hoặc null. Đây là tiến trình thật:
 * bgremove.py in 1 dòng sau mỗi frame xong.
 */
function parseBgremoveProgressLine(line) {
  const m = /\[bgremove\]\s+(\d+)\/(\d+|\?)\s+\(([^)]+)\)/.exec(String(line || ""));
  if (!m) return null;
  const done = parseInt(m[1], 10);
  const total = m[2] === "?" ? null : parseInt(m[2], 10);
  if (!Number.isFinite(done)) return null;
  if (total !== null && !Number.isFinite(total)) return null;
  return { done, total, progress: progressFromDoneTotal(done, total) };
}

function bgremoveAvailable(cfg = bgremoveConfigFromEnv()) {
  if (!fs.existsSync(cfg.bgremovePy)) {
    return { available: false, reason: "thiếu server/bgremove/bgremove.py" };
  }
  return { available: true };
}

/**
 * 1 lần chạy bgremove.py. Resolve: { outputPath, sessionUsed, fallbackFrom }.
 * Reject: Error có thêm .code/.signal/.timedOut để caller quyết định retry.
 *
 * Đợt 80 H8 (gap N4): thêm `signal` (AbortSignal) — abort → kill cả cây
 * process python (SIGTERM → SIGKILL sau 2s) và reject lỗi AI_JOB_ABORTED;
 * onPhase({ phase: "processing", done, total, progress, message }) giờ kèm
 * progress thật (done/total frame) để route stream về UI.
 */
function runAttempt({ inputPath, outputPath, session, onPhase, cfg, signal,
                      temporal = 0.4, feather = 1 }) {
  return new Promise((resolve, reject) => {
    // Đã bị hủy trước khi spawn → từ chối ngay, không chạy script.
    if (signal && signal.aborted) {
      reject(abortError("Job đã bị hủy trước khi chạy."));
      return;
    }
    const args = [
      cfg.bgremovePy,
      "--input", inputPath,
      "--output", outputPath,
      "--mode", "alpha",
      "--session", session,
      "--temporal", String(temporal),
      "--feather", String(feather),
    ];
    if (cfg.modelDir) {
      args.push("--model-dir", cfg.modelDir);
    }
    const child = spawn(cfg.pythonBin, args, {
      stdio: ["ignore", "ignore", "pipe"],
      shell: false,
      // Đợt 80 H8: group riêng để hủy diệt được cả process con.
      detached: process.platform !== "win32",
    });

    let stderrBuf = "";
    // Buffer đầy đủ (không cắt) để đọc marker session_used/fallback_from
    // cuối tiến trình — buffer parse progress ở dưới có cắt bớt.
    let stderrAll = "";
    let timedOut = false;
    let settled = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // Timeout: kill cả cây process thay vì chỉ python.
      killChildTree(child, 0).catch(() => {});
    }, cfg.timeoutMs);
    if (timer.unref) timer.unref();

    // Đợt 80 H8: hủy thật — signal abort → kill cây process, reject lỗi
    // AI_JOB_ABORTED (runBgremove phân biệt để KHÔNG fallback retry).
    const detachAbort = killChildOnAbort(child, signal, 2000);
    if (signal) {
      signal.addEventListener("abort", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        detachAbort();
        reject(abortError("Job đã bị hủy."));
      }, { once: true });
    }

    child.stderr.on("data", (d) => {
      stderrBuf += d.toString();
      stderrAll += d.toString();
      // Parse dòng "[bgremove] 30/90 (33%)" để báo tiến trình
      const m = stderrBuf.match(/\[bgremove\]\s+(\d+)\/(\d+|\?)\s+\(([^)]+)\)/);
      if (m && onPhase) {
        const p = parseBgremoveProgressLine(m[0]);
        if (p) {
          onPhase({
            phase: "processing",
            done: p.done, total: p.total, progress: p.progress,
            message: `Đang xóa nền: ${m[3]}`,
          });
        }
        stderrBuf = stderrBuf.slice(m.index + m[0].length);
      }
    });

    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      detachAbort();
      const err = new Error(`Không chạy được bgremove.py: ${e.message}`);
      err.timedOut = timedOut;
      reject(err);
    });

    child.on("close", (code, signal) => {
      if (settled) return; // đã bị abort xử lý trước
      settled = true;
      clearTimeout(timer);
      detachAbort();
      const markers = parseSessionMarkers(stderrAll);
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({
          outputPath,
          sessionUsed: markers.sessionUsed || session,
          fallbackFrom: markers.fallbackFrom || null,
          // Đợt 88 P7: giữ lại marker RAM guard để runBgremove báo đúng lý do.
          ramGuardFrom: markers.ramGuardFrom || null,
          ramGuardAvailMb: markers.ramGuardAvailMb,
          ramGuardMinMb: markers.ramGuardMinMb,
        });
        return;
      }
      const tail = redactStderr(stderrAll).trim().split("\n").slice(-3).join("\n");
      const err = new Error(
        timedOut
          ? "Xóa nền quá thời gian (timeout) — thử video ngắn hơn."
          : `Xóa nền thất bại (exit ${code}${signal ? `, signal ${signal}` : ""}). ${tail}`
      );
      err.code = code;
      err.signal = signal || null;
      err.timedOut = timedOut;
      err.stderrTail = tail;
      reject(err);
    });
  });
}

/**
 * Chạy bgremove.py, tự fallback u2net 1 lần khi session birefnet chết
 * (exit != 0 hoặc bị signal như OOM-kill SIGKILL — trừ timeout).
 * onPhase({phase, message}) được gọi khi có tiến trình.
 * Resolve: { outputPath, sessionUsed, fallbackFrom, fallbackReason }.
 * Reject: Error (đã thử cả 2 session, hoặc lỗi không retry được).
 *
 * Đợt 80 H8 (gap N4): thêm `signal` — job bị hủy thì KHÔNG fallback retry
 * (hủy là ý định của user, chạy lại session khác là làm trái ý họ).
 */
async function runBgremove({ inputPath, outputPath, session, onPhase, signal,
                             temporal = 0.4, feather = 1 }) {
  const cfg = bgremoveConfigFromEnv();
  const requested = session === "auto" ? DEFAULT_SESSION : session;
  const attempt = (s) => runAttempt({ inputPath, outputPath, session: s,
                                      onPhase, cfg, signal, temporal, feather });
  let first;
  try {
    first = await attempt(requested);
  } catch (e) {
    // Đợt 80 H8: bị hủy thì dừng ngay, không fallback (xem docstring trên).
    if (isAbortError(e)) throw e;
    const retryable = BIREFNET_SESSIONS.has(requested) && !e.timedOut;
    if (!retryable) throw e;
    // Xoá output dở dang (nếu có) rồi chạy lại bằng u2net.
    try { fs.unlinkSync(outputPath); } catch { /* chưa có file */ }
    if (onPhase) {
      onPhase({
        phase: "fallback",
        message: `Session ${requested} thất bại (${e.signal ? `bị ${e.signal}` : `exit ${e.code}`}) — tự chuyển sang u2net (nhẹ hơn).`,
      });
    }
    try {
      const second = await attempt(FALLBACK_SESSION);
      return {
        ...second,
        fallbackFrom: requested,
        fallbackReason: e.signal
          ? `session ${requested} bị ${e.signal} (nghi OOM-kill trên máy ít RAM)`
          : `session ${requested} lỗi (exit ${e.code})`,
      };
    } catch (e2) {
      // Đợt 80 H8: hủy giữa lần fallback thì giữ nguyên lỗi hủy (không bọc
      // thành lỗi "thất bại cả 2 session" — route cần mã AI_JOB_ABORTED).
      if (isAbortError(e2)) throw e2;
      throw new Error(
        `Xóa nền thất bại cả 2 session (${requested}: ${e.message}; ` +
        `${FALLBACK_SESSION}: ${e2.message})`
      );
    }
  }
  // Lần đầu thành công — nhưng Python có thể đã tự fallback trong tiến
  // trình (in-process) thì báo luôn để UI/MCP hiển thị đúng. Đợt 88 P7:
  // phân biệt 2 lý do — RAM guard chặn từ đầu (không thử birefnet) khác
  // với birefnet chạy rồi lỗi giữa chừng.
  if (first.fallbackFrom) {
    const guardReason = first.ramGuardFrom
      ? `RAM guard: RAM khả dụng ${first.ramGuardAvailMb ?? "?"} MB < ngưỡng ` +
        `${first.ramGuardMinMb ?? "?"} MB nên không thử ${first.ramGuardFrom} ` +
        `(tránh OOM-kill) — đã dùng u2net ngay từ đầu`
      : `session ${first.fallbackFrom} lỗi trong quá trình chạy — đã tự dùng u2net`;
    return {
      ...first,
      fallbackReason: guardReason,
    };
  }
  return { ...first, fallbackFrom: null, fallbackReason: null };
}

module.exports = {
  bgremoveConfigFromEnv,
  bgremoveAvailable,
  runBgremove,
  validateSession,
  validateTemporal,
  validateFeather,
  parseSessionMarkers,
  parseBgremoveProgressLine, // Đợt 80 H8: parse "[bgremove] done/total (pct)"
  DEFAULT_SESSION,
  FORBIDDEN_SESSIONS,
  BIREFNET_SESSIONS,
  FALLBACK_SESSION,
};
