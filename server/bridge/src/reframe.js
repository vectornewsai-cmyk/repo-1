"use strict";
/**
 * reframe.js — Auto-reframe qua server/reframe/reframe.py (OpenCV, 100% local).
 *
 * R1-083/R1-085: bridge nhận 1 file VIDEO (multipart — KHÔNG nhận đường dẫn
 * tuyệt đối từ client), chạy reframe.py bằng child_process.spawn với argv
 * CỐ ĐỊNH (không shell, không lệnh tùy ý), parse tiến trình từ stderr,
 * trả về đường dẫn MP4 đích để endpoint download cho client.
 *
 * Python: ưu tiên venv server/reframe/.venv (xem server/reframe/setup.sh),
 * override qua env REFRAME_PYTHON.
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

/** Whitelist aspect đích — reframe.py cũng validate lại phía Python. */
const REFRAME_ASPECTS = ["9:16", "1:1", "4:5"];
const DEFAULT_ASPECT = "9:16";
// Phân tích + encode lại toàn bộ video: chậm hơn caption. 10 phút cho video ngắn.
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function reframeConfigFromEnv(env = process.env) {
  const venvPython = path.resolve(
    __dirname, "..", "..", "reframe", ".venv", "bin", "python"
  );
  const t = parseInt(env.REFRAME_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.REFRAME_PYTHON ||
      (fs.existsSync(venvPython) ? venvPython : "python3"),
    reframePy: env.REFRAME_PY ||
      path.resolve(__dirname, "..", "..", "reframe", "reframe.py"),
    timeoutMs: Number.isFinite(t) && t >= 30_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/** Chuẩn hóa + validate aspect; throw → endpoint trả 400. */
function validateAspect(raw) {
  const aspect = String(raw ?? DEFAULT_ASPECT).trim();
  if (!REFRAME_ASPECTS.includes(aspect)) {
    throw new Error(
      `Tỉ lệ không hỗ trợ: "${raw}". Chọn một trong: ${REFRAME_ASPECTS.join(", ")}.`
    );
  }
  return aspect;
}

/** Kiểm tra nhanh reframe có chạy được không (python + script tồn tại). */
function reframeAvailable(cfg = reframeConfigFromEnv()) {
  if (!fs.existsSync(cfg.reframePy)) {
    return { available: false, reason: `Không tìm thấy reframe.py (${cfg.reframePy})` };
  }
  if (!fs.existsSync(cfg.pythonBin) && cfg.pythonBin !== "python3") {
    return { available: false, reason: `Không tìm thấy python reframe (${cfg.pythonBin})` };
  }
  return { available: true, python: cfg.pythonBin, script: cfg.reframePy };
}

/** Nhận diện % tiến trình từ 1 dòng stderr của reframe.py ("[reframe] 45%"). */
function progressFromLine(line) {
  const m = /\[reframe\]\s+(\d+)\/(\d+)\s+\((\d+)%\)/.exec(String(line || ""));
  if (!m) return null;
  return Math.min(99, Math.max(0, parseInt(m[3], 10)));
}

/**
 * Chạy reframe.py cho 1 file local.
 *
 * @param {object} o
 * @param {string} o.inputPath   đường dẫn TUYỆT ĐỐI tới file video (bridge tự lưu).
 * @param {string} o.outputPath  đường dẫn TUYỆT ĐỐI tới MP4 đích (bridge tự chọn).
 * @param {string} o.aspect      tỉ lệ đích (đã whitelist).
 * @param {(pct:number)=>void} [o.onProgress] callback tiến trình 0..99.
 * @param {object} [o.config]    override reframeConfigFromEnv() (cho test).
 * @returns {Promise<{aspect:string, outPath:string, bytes:number}>}
 */
function runReframe({ inputPath, outputPath, aspect, onProgress, config } = {}) {
  const cfg = config || reframeConfigFromEnv();
  const a = validateAspect(aspect);
  if (typeof inputPath !== "string" || !path.isAbsolute(inputPath)) {
    return Promise.reject(new Error("inputPath phải là đường dẫn tuyệt đối."));
  }
  if (typeof outputPath !== "string" || !path.isAbsolute(outputPath)) {
    return Promise.reject(new Error("outputPath phải là đường dẫn tuyệt đối."));
  }
  if (!fs.existsSync(inputPath)) {
    return Promise.reject(new Error("Không tìm thấy file video để reframe."));
  }

  return new Promise((resolve, reject) => {
    // argv CỐ ĐỊNH — không shell, không ghép chuỗi lệnh.
    const args = [
      cfg.reframePy,
      "--input", inputPath,
      "--output", outputPath,
      "--aspect", a,
    ];
    let child;
    try {
      child = spawn(cfg.pythonBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });
    } catch (e) {
      reject(new Error(`Không khởi động được reframe.py: ${e.message}`));
      return;
    }

    let done = false;
    let stderrBuf = "";
    let stderrTail = "";

    const finish = (fn) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fn();
    };
    const emitProgress = (pct) => {
      try { if (onProgress) onProgress(pct); } catch { /* bỏ qua */ }
    };

    const timer = setTimeout(() => {
      finish(() => {
        try { child.kill("SIGKILL"); } catch { /* bỏ qua */ }
        reject(new Error(
          `Reframe quá thời gian (${Math.round(cfg.timeoutMs / 60000)} phút) — thử video ngắn hơn.`
        ));
      });
    }, cfg.timeoutMs);
    if (timer.unref) timer.unref();

    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderrTail = (stderrTail + s).slice(-2000);
      stderrBuf += s;
      let idx;
      while ((idx = stderrBuf.indexOf("\n")) >= 0) {
        const line = stderrBuf.slice(0, idx);
        stderrBuf = stderrBuf.slice(idx + 1);
        const pct = progressFromLine(line);
        if (pct !== null) emitProgress(pct);
      }
    });
    child.on("error", (e) => {
      finish(() => {
        reject(new Error(`Không chạy được reframe.py: ${e.message}`));
      });
    });
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          reject(new Error(
            `reframe.py thoát mã ${code}: ${(stderrTail || "").slice(-300) || "không rõ lỗi"}`
          ));
          return;
        }
        let bytes = 0;
        try { bytes = fs.statSync(outputPath).size; } catch { /* bỏ qua */ }
        if (bytes === 0) {
          reject(new Error("reframe.py không tạo được file output."));
          return;
        }
        resolve({ aspect: a, outPath: outputPath, bytes });
      });
    });
  });
}

/**
 * Phase 7 P6 — chỉ phân tích + tính trajectory, KHÔNG encode.
 * Chạy reframe.py --analyze-only --json-out <tmp>, đọc JSON trả về.
 * @returns {Promise<object>} summary JSON của reframe.py (gồm trajectory,
 *   crop_window, source_size, detections, duration_sec).
 */
function analyzeReframe({ inputPath, aspect, config } = {}) {
  const cfg = config || reframeConfigFromEnv();
  const a = validateAspect(aspect);
  if (typeof inputPath !== "string" || !path.isAbsolute(inputPath)) {
    return Promise.reject(new Error("inputPath phải là đường dẫn tuyệt đối."));
  }
  if (!fs.existsSync(inputPath)) {
    return Promise.reject(new Error("Không tìm thấy file video để phân tích."));
  }
  const jsonOut = path.join(
    os.tmpdir(),
    `reframe-traj-${Date.now()}-${Math.random().toString(16).slice(2, 10)}.json`
  );
  return new Promise((resolve, reject) => {
    const args = [
      cfg.reframePy,
      "--input", inputPath,
      "--analyze-only",
      "--aspect", a,
      "--json-out", jsonOut,
    ];
    let child;
    try {
      child = spawn(cfg.pythonBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });
    } catch (e) {
      reject(new Error(`Không khởi động được reframe.py: ${e.message}`));
      return;
    }
    let done = false;
    let stderrTail = "";
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try { child.kill("SIGKILL"); } catch { /* bỏ qua */ }
      reject(new Error("Phân tích reframe quá thời gian — thử video ngắn hơn."));
    }, cfg.timeoutMs);
    if (timer.unref) timer.unref();
    child.stderr.on("data", (d) => {
      stderrTail = (stderrTail + d.toString()).slice(-2000);
    });
    child.on("error", (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(new Error(`Không chạy được reframe.py: ${e.message}`));
    });
    child.on("close", (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (code !== 0) {
        try { fs.unlinkSync(jsonOut); } catch { /* bỏ qua */ }
        reject(new Error(
          `reframe.py thoát mã ${code}: ${(stderrTail || "").slice(-300) || "không rõ lỗi"}`
        ));
        return;
      }
      let data;
      try {
        data = JSON.parse(fs.readFileSync(jsonOut, "utf8"));
      } catch (e) {
        try { fs.unlinkSync(jsonOut); } catch { /* bỏ qua */ }
        reject(new Error(`Không đọc được trajectory JSON: ${e.message}`));
        return;
      }
      try { fs.unlinkSync(jsonOut); } catch { /* bỏ qua */ }
      resolve(data);
    });
  });
}

module.exports = {
  REFRAME_ASPECTS,
  DEFAULT_ASPECT,
  reframeConfigFromEnv,
  validateAspect,
  progressFromLine,
  reframeAvailable,
  runReframe,
  analyzeReframe,
};
