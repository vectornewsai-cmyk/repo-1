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
const fs = require("fs");
const { spawn } = require("child_process");

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
    throw new Error(
      `Session "${raw}" BỊ CẤM: weights non-commercial, không được dùng. ` +
      `Dùng "${DEFAULT_SESSION}" (MIT).`
    );
  }
  if (!/^[a-z0-9_-]+$/.test(s)) {
    throw new Error(`Tên session không hợp lệ: "${raw}".`);
  }
  return s;
}

/** Đọc marker machine-readable mà bgremove.py in ra stderr. */
function parseSessionMarkers(stderrText) {
  const used = stderrText.match(/\[bgremove\]\s+session_used=([a-z0-9_-]+)/);
  const fb = stderrText.match(/\[bgremove\]\s+fallback_from=([a-z0-9_-]+)/);
  return {
    sessionUsed: used ? used[1] : null,
    fallbackFrom: fb ? fb[1] : null,
  };
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
 */
function runAttempt({ inputPath, outputPath, session, onPhase, cfg }) {
  return new Promise((resolve, reject) => {
    const args = [
      cfg.bgremovePy,
      "--input", inputPath,
      "--output", outputPath,
      "--mode", "alpha",
      "--session", session,
    ];
    if (cfg.modelDir) {
      args.push("--model-dir", cfg.modelDir);
    }
    const child = spawn(cfg.pythonBin, args, { stdio: ["ignore", "ignore", "pipe"] });

    let stderrBuf = "";
    // Buffer đầy đủ (không cắt) để đọc marker session_used/fallback_from
    // cuối tiến trình — buffer parse progress ở dưới có cắt bớt.
    let stderrAll = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, cfg.timeoutMs);

    child.stderr.on("data", (d) => {
      stderrBuf += d.toString();
      stderrAll += d.toString();
      // Parse dòng "[bgremove] 30/90 (33%)" để báo tiến trình
      const m = stderrBuf.match(/\[bgremove\]\s+(\d+)\/(\d+|\?)\s+\(([^)]+)\)/);
      if (m && onPhase) {
        const done = parseInt(m[1], 10);
        const total = m[2] === "?" ? null : parseInt(m[2], 10);
        onPhase({
          phase: "processing",
          done, total,
          message: `Đang xóa nền: ${m[3]}`,
        });
        stderrBuf = stderrBuf.slice(m.index + m[0].length);
      }
    });

    child.on("error", (e) => {
      clearTimeout(timer);
      const err = new Error(`Không chạy được bgremove.py: ${e.message}`);
      err.timedOut = timedOut;
      reject(err);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const markers = parseSessionMarkers(stderrAll);
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({
          outputPath,
          sessionUsed: markers.sessionUsed || session,
          fallbackFrom: markers.fallbackFrom || null,
        });
        return;
      }
      const tail = stderrAll.trim().split("\n").slice(-3).join("\n");
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
 */
async function runBgremove({ inputPath, outputPath, session, onPhase }) {
  const cfg = bgremoveConfigFromEnv();
  const requested = session === "auto" ? DEFAULT_SESSION : session;
  const attempt = (s) => runAttempt({ inputPath, outputPath, session: s, onPhase, cfg });
  let first;
  try {
    first = await attempt(requested);
  } catch (e) {
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
      throw new Error(
        `Xóa nền thất bại cả 2 session (${requested}: ${e.message}; ` +
        `${FALLBACK_SESSION}: ${e2.message})`
      );
    }
  }
  // Lần đầu thành công — nhưng Python có thể đã tự fallback trong tiến
  // trình (in-process) thì báo luôn để UI/MCP hiển thị đúng.
  if (first.fallbackFrom) {
    return {
      ...first,
      fallbackReason: `session ${first.fallbackFrom} lỗi trong quá trình chạy — đã tự dùng u2net`,
    };
  }
  return { ...first, fallbackFrom: null, fallbackReason: null };
}

module.exports = {
  bgremoveConfigFromEnv,
  bgremoveAvailable,
  runBgremove,
  validateSession,
  parseSessionMarkers,
  DEFAULT_SESSION,
  FORBIDDEN_SESSIONS,
  BIREFNET_SESSIONS,
  FALLBACK_SESSION,
};
