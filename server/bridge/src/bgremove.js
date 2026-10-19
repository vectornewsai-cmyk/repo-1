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

/** Validate session; throw → endpoint trả 400. */
function validateSession(raw) {
  const s = String(raw ?? DEFAULT_SESSION).trim().toLowerCase() || DEFAULT_SESSION;
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

function bgremoveAvailable(cfg = bgremoveConfigFromEnv()) {
  if (!fs.existsSync(cfg.bgremovePy)) {
    return { available: false, reason: "thiếu server/bgremove/bgremove.py" };
  }
  return { available: true };
}

/**
 * Chạy bgremove.py. onPhase({phase, message}) được gọi khi có tiến trình.
 * Resolve: { outputPath }. Reject: Error.
 */
function runBgremove({ inputPath, outputPath, session, onPhase }) {
  const cfg = bgremoveConfigFromEnv();
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
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Xóa nền quá thời gian (timeout) — thử video ngắn hơn."));
    }, cfg.timeoutMs);

    child.stderr.on("data", (d) => {
      stderrBuf += d.toString();
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
      reject(new Error(`Không chạy được bgremove.py: ${e.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({ outputPath });
      } else {
        const tail = stderrBuf.trim().split("\n").slice(-3).join("\n");
        reject(new Error(`Xóa nền thất bại (exit ${code}). ${tail}`));
      }
    });
  });
}

module.exports = {
  bgremoveConfigFromEnv,
  bgremoveAvailable,
  runBgremove,
  validateSession,
  DEFAULT_SESSION,
  FORBIDDEN_SESSIONS,
};
