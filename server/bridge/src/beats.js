"use strict";
/**
 * beats.js — Beat detection qua server/beats/beat.py (numpy-only, 100% local).
 *
 * Phase 8 Q5: bridge nhận 1 file AUDIO/VIDEO (multipart — KHÔNG nhận đường
 * dẫn tuyệt đối từ client), chạy beat.py bằng child_process.spawn với argv
 * CỐ ĐỊNH (không shell, không lệnh tùy ý), trả JSON { bpm, beats, ... }.
 *
 * Python: beat.py chỉ cần numpy + ffmpeg hệ thống nên dùng python3 mặc
 * định, override qua env BEATS_PYTHON.
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

function beatsConfigFromEnv(env = process.env) {
  const t = parseInt(env.BEATS_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.BEATS_PYTHON || "python3",
    beatPy: env.BEATS_PY ||
      path.resolve(__dirname, "..", "..", "beats", "beat.py"),
    timeoutMs: Number.isFinite(t) && t >= 30_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/** Kiểm tra nhanh beats có chạy được không (python + script tồn tại). */
function beatsAvailable(cfg = beatsConfigFromEnv()) {
  if (!fs.existsSync(cfg.beatPy)) {
    return { available: false, reason: `Không tìm thấy beat.py (${cfg.beatPy})` };
  }
  return { available: true, python: cfg.pythonBin, script: cfg.beatPy };
}

/**
 * Chạy beat.py trên 1 file, trả về JSON đã parse.
 * @param {{ inputPath: string, minBpm?: number, maxBpm?: number }} opts
 */
function analyzeBeats(opts, cfg = beatsConfigFromEnv()) {
  const { inputPath, minBpm, maxBpm } = opts;
  return new Promise((resolve, reject) => {
    const outPath = `${inputPath}.beats.json`;
    const args = [cfg.beatPy, "--input", inputPath, "--out", outPath];
    if (minBpm !== undefined) args.push("--min-bpm", String(minBpm));
    if (maxBpm !== undefined) args.push("--max-bpm", String(maxBpm));
    const child = spawn(cfg.pythonBin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch { /* đã chết */ }
      reject(new Error("Phân tích beat quá thời gian (timeout)."));
    }, cfg.timeoutMs);
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(`Không chạy được beat.py: ${e.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`beat.py thất bại (exit ${code}): ${stderr.slice(-500)}`));
        return;
      }
      try {
        const data = JSON.parse(fs.readFileSync(outPath, "utf8"));
        try { fs.unlinkSync(outPath); } catch { /* kệ */ }
        resolve(data);
      } catch (e) {
        reject(new Error(`Không đọc được kết quả beat.py: ${e.message}`));
      }
    });
  });
}

module.exports = { beatsConfigFromEnv, beatsAvailable, analyzeBeats };
