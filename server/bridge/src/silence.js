"use strict";
/**
 * silence.js — Silence removal qua server/silence/silence.py (R1-084, Batch H).
 *
 * Mirror caption.js: bridge nhận 1 file video/audio (multipart — KHÔNG nhận
 * đường dẫn tuyệt đối từ client), chạy silence.py bằng child_process.spawn
 * với argv CỐ ĐỊNH (không shell, không lệnh tùy ý), parse JSON output,
 * validate rồi trả về cho UI.
 *
 * silence detect rất nhanh (ffmpeg realtime ~10-50x) nên không cần stream
 * tiến trình như caption — trả JSON một lần là đủ.
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const NOISE_DB_MIN = -80;
const NOISE_DB_MAX = 0;
const MIN_DUR_MIN = 0.1;
const MIN_DUR_MAX = 10;
const DEFAULT_NOISE_DB = -35;
const DEFAULT_MIN_DUR = 0.5;
const MAX_SILENCES = 5000;
// silence detect nhanh (không model ML) → timeout ngắn hơn caption nhiều.
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

function silenceConfigFromEnv(env = process.env) {
  const t = parseInt(env.SILENCE_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.SILENCE_PYTHON || env.CAPTION_PYTHON || "python3",
    silencePy: env.SILENCE_PY ||
      path.resolve(__dirname, "..", "..", "silence", "silence.py"),
    timeoutMs: Number.isFinite(t) && t >= 10_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/** Validate ngưỡng dB; throw → endpoint trả 400. */
function validateNoiseDb(raw) {
  const v = raw === undefined || raw === null || raw === ""
    ? DEFAULT_NOISE_DB : Number(raw);
  if (!Number.isFinite(v) || v < NOISE_DB_MIN || v > NOISE_DB_MAX) {
    throw new Error(
      `Ngưỡng noise phải trong [${NOISE_DB_MIN}, ${NOISE_DB_MAX}] dB (nhận "${raw}").`
    );
  }
  return v;
}

/** Validate độ dài tối thiểu; throw → endpoint trả 400. */
function validateMinDur(raw) {
  const v = raw === undefined || raw === null || raw === ""
    ? DEFAULT_MIN_DUR : Number(raw);
  if (!Number.isFinite(v) || v < MIN_DUR_MIN || v > MIN_DUR_MAX) {
    throw new Error(
      `Độ dài tối thiểu phải trong [${MIN_DUR_MIN}, ${MIN_DUR_MAX}] giây (nhận "${raw}").`
    );
  }
  return v;
}

function silenceAvailable(cfg = silenceConfigFromEnv()) {
  if (!fs.existsSync(cfg.silencePy)) {
    return { available: false, reason: `Không tìm thấy silence.py (${cfg.silencePy})` };
  }
  return { available: true, python: cfg.pythonBin, script: cfg.silencePy };
}

/**
 * Validate mảng silences từ JSON của silence.py.
 * Bỏ qua entry hỏng; sắp xếp theo start; chặn quá nhiều entry.
 */
function validateSilences(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("Output silence.py thiếu mảng 'silences'.");
  }
  if (raw.length > MAX_SILENCES) {
    throw new Error(`Quá nhiều khoảng lặng (${raw.length}, tối đa ${MAX_SILENCES}).`);
  }
  const out = [];
  for (const s of raw) {
    const start = Number(s && s.start);
    const end = Number(s && s.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (start < 0 || end <= start) continue;
    out.push({
      start: Math.round(start * 1000) / 1000,
      end: Math.round(end * 1000) / 1000,
      duration: Math.round((end - start) * 1000) / 1000,
    });
  }
  out.sort((a, b) => a.start - b.start);
  // Gộp các khoảng giao nhau (phòng silence.py trả trùng biên).
  const merged = [];
  for (const s of out) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end + 1e-6) {
      last.end = Math.max(last.end, s.end);
      last.duration = Math.round((last.end - last.start) * 1000) / 1000;
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

/**
 * Chạy silence.py cho 1 file local.
 *
 * @param {object} o
 * @param {string} o.inputPath  đường dẫn TUYỆT ĐỐI (do bridge tự lưu từ upload).
 * @param {number} o.noiseDb    ngưỡng dB (đã validate).
 * @param {number} o.minDur     độ dài tối thiểu giây (đã validate).
 * @param {object} [o.config]   override silenceConfigFromEnv() (cho test).
 * @returns {Promise<{audioDurationSec:number, noiseDb:number, minDur:number,
 *   silences:Array<{start,end,duration}>, keep:Array<{start,end}>>}}
 */
function runSilence({ inputPath, noiseDb, minDur, config } = {}) {
  const cfg = config || silenceConfigFromEnv();
  const noise = validateNoiseDb(noiseDb);
  const dur = validateMinDur(minDur);
  if (typeof inputPath !== "string" || !path.isAbsolute(inputPath)) {
    return Promise.reject(new Error("inputPath phải là đường dẫn tuyệt đối."));
  }
  if (!fs.existsSync(inputPath)) {
    return Promise.reject(new Error("Không tìm thấy file media để phân tích."));
  }

  return new Promise((resolve, reject) => {
    const outPath = path.join(
      os.tmpdir(),
      `vcut-silence-${Date.now()}-${process.pid}.json`
    );
    // argv CỐ ĐỊNH — không shell, không ghép chuỗi lệnh.
    const args = [
      cfg.silencePy,
      "--input", inputPath,
      "--noise", String(noise),
      "--min-dur", String(dur),
      "--out", outPath,
    ];
    let child;
    try {
      child = spawn(cfg.pythonBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });
    } catch (e) {
      reject(new Error(`Không khởi động được silence.py: ${e.message}`));
      return;
    }

    let done = false;
    let stderrTail = "";
    const cleanupOut = () => {
      try { fs.unlinkSync(outPath); } catch { /* bỏ qua */ }
    };
    const finish = (fn) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => {
        try { child.kill("SIGKILL"); } catch { /* bỏ qua */ }
        cleanupOut();
        reject(new Error("Phân tích khoảng lặng quá thời gian — thử file ngắn hơn."));
      });
    }, cfg.timeoutMs);
    if (timer.unref) timer.unref();

    child.stderr.on("data", (d) => {
      stderrTail = (stderrTail + d.toString()).slice(-2000);
    });
    child.on("error", (e) => {
      finish(() => {
        cleanupOut();
        reject(new Error(`Không chạy được silence.py: ${e.message}`));
      });
    });
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          cleanupOut();
          reject(new Error(
            `silence.py thoát mã ${code}: ${(stderrTail || "").slice(-300) || "không rõ lỗi"}`
          ));
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(fs.readFileSync(outPath, "utf8"));
        } catch (e) {
          cleanupOut();
          reject(new Error(`Không đọc được output silence: ${e.message}`));
          return;
        }
        cleanupOut();
        let silences;
        try {
          silences = validateSilences(parsed.silences);
        } catch (e) {
          reject(e);
          return;
        }
        resolve({
          audioDurationSec: Number(parsed.audio_duration_sec) || 0,
          noiseDb: noise,
          minDur: dur,
          silences,
          keep: Array.isArray(parsed.keep) ? parsed.keep : [],
        });
      });
    });
  });
}

module.exports = {
  NOISE_DB_MIN,
  NOISE_DB_MAX,
  MIN_DUR_MIN,
  MIN_DUR_MAX,
  DEFAULT_NOISE_DB,
  DEFAULT_MIN_DUR,
  MAX_SILENCES,
  silenceConfigFromEnv,
  validateNoiseDb,
  validateMinDur,
  validateSilences,
  silenceAvailable,
  runSilence,
};
