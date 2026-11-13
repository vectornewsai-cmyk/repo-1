"use strict";
/**
 * scene.js — Scene detection qua server/scene/scene.py (FFmpeg, 100% local).
 *
 * R1-085: bridge nhận 1 file video (multipart — KHÔNG nhận đường dẫn tuyệt
 * đối từ client, theo chính sách bảo mật của bridge), chạy scene.py bằng
 * child_process.spawn với argv CỐ ĐỊNH (không shell, không lệnh tùy ý),
 * parse JSON output, validate cuts rồi trả về cho UI.
 *
 * Tiến trình được stream về client dạng NDJSON qua onPhase callback:
 *   scan → done
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { redactStderr } = require("./errorDetail"); // Đợt 29 L3: dòng [scene] LỖI có thể chứa đường dẫn
const { codedError } = require("./errorCodes"); // Đợt 62 R5: mã lỗi bridge→web
// Đợt 80 H8 (gap N4): hủy job thật.
const { abortError, killChildOnAbort, killChildTree } = require("./aiProgress");

const DEFAULT_THRESHOLD = 0.4;
const MIN_THRESHOLD = 0.05;
const MAX_THRESHOLD = 0.95;
// Video 10 phút decode+phân tích khoảng 10–60s trên CPU thường; timeout dài
// nhưng vẫn có giới hạn để không treo worker.
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function sceneConfigFromEnv(env = process.env) {
  const t = parseInt(env.SCENE_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.SCENE_PYTHON || "python3",
    scenePy: env.SCENE_PY ||
      path.resolve(__dirname, "..", "..", "scene", "scene.py"),
    timeoutMs: Number.isFinite(t) && t >= 30_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/** Chuẩn hóa + validate ngưỡng; throw → endpoint trả 400. */
function validateThreshold(raw) {
  const t = raw === undefined || raw === null || raw === ""
    ? DEFAULT_THRESHOLD
    : Number(raw);
  if (!Number.isFinite(t) || t < MIN_THRESHOLD || t > MAX_THRESHOLD) {
    throw codedError(
      "SCENE_THRESHOLD_INVALID",
      `Ngưỡng không hợp lệ: "${raw}". Chọn số trong khoảng ${MIN_THRESHOLD}..${MAX_THRESHOLD} (mặc định ${DEFAULT_THRESHOLD}).`,
      { value: raw, min: MIN_THRESHOLD, max: MAX_THRESHOLD, def: DEFAULT_THRESHOLD },
    );
  }
  return t;
}

/** Validate khoảng [start, end] (giây, tuyệt đối theo file); cho phép bỏ trống. */
function validateRange(rawStart, rawEnd) {
  let start = null;
  let end = null;
  if (rawStart !== undefined && rawStart !== null && rawStart !== "") {
    start = Number(rawStart);
    if (!Number.isFinite(start) || start < 0) {
      throw codedError("SCENE_START_INVALID", `start không hợp lệ: "${rawStart}".`, { value: rawStart });
    }
  }
  if (rawEnd !== undefined && rawEnd !== null && rawEnd !== "") {
    end = Number(rawEnd);
    if (!Number.isFinite(end) || end <= 0) {
      throw codedError("SCENE_END_INVALID", `end không hợp lệ: "${rawEnd}".`, { value: rawEnd });
    }
  }
  if (start !== null && end !== null && end <= start) {
    throw codedError("SCENE_RANGE_INVALID", "end phải lớn hơn start.");
  }
  return { start, end };
}

/**
 * Kiểm tra nhanh scene detection có chạy được không (python + file script
 * tồn tại). KHÔNG chạy ffmpeg — lỗi file cụ thể sẽ báo khi chạy thật.
 */
function sceneAvailable(cfg = sceneConfigFromEnv()) {
  if (!fs.existsSync(cfg.scenePy)) {
    return { available: false, reason: `Không tìm thấy scene.py (${cfg.scenePy})` };
  }
  return { available: true, python: cfg.pythonBin, script: cfg.scenePy };
}

/**
 * Validate mảng cuts từ JSON của scene.py.
 * Bỏ qua giá trị hỏng thay vì fail cả job; sắp xếp tăng dần.
 */
function validateCuts(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("Output scene.py thiếu mảng 'cuts'.");
  }
  if (raw.length > 10000) {
    throw new Error(`Quá nhiều điểm cắt (${raw.length}, tối đa 10000).`);
  }
  const out = [];
  for (const c of raw) {
    const t = Number(c);
    if (!Number.isFinite(t) || t < 0) continue;
    out.push(Math.round(t * 1000) / 1000);
  }
  out.sort((a, b) => a - b);
  return out;
}

/**
 * Chạy scene.py cho 1 file video local.
 *
 * @param {object} o
 * @param {string} o.inputPath  đường dẫn TUYỆT ĐỐI tới file video (do bridge
 *   tự lưu từ upload — không bao giờ lấy từ client).
 * @param {number} o.threshold  ngưỡng đã validate.
 * @param {number|null} o.start khoảng bắt đầu (giây tuyệt đối), null = đầu file.
 * @param {number|null} o.end   khoảng kết thúc (giây tuyệt đối), null = cuối file.
 * @param {(phase:string)=>void} [o.onPhase]  callback khi phase đổi.
 * @param {AbortSignal} [o.signal]  Đợt 80 H8: abort → kill cây process
 *   python và reject lỗi AI_JOB_ABORTED (hủy thật, không còn chạy nền).
 * @param {object} [o.config]   override sceneConfigFromEnv() (cho test).
 * @returns {Promise<{cuts:number[], duration:number|null, threshold:number}>}
 */
function runSceneDetect({ inputPath, threshold, start, end, onPhase, signal, config }) {
  const cfg = config || sceneConfigFromEnv();
  return new Promise((resolve, reject) => {
    // Đã bị hủy trước khi spawn → từ chối ngay, không chạy script.
    if (signal && signal.aborted) {
      reject(abortError("Job đã bị hủy trước khi chạy."));
      return;
    }
    const outJson = path.join(
      path.dirname(inputPath),
      `scenes-${Date.now()}-${Math.random().toString(16).slice(2, 10)}.json`
    );
    const args = [
      cfg.scenePy,
      "--input", inputPath,
      "--threshold", String(threshold),
      "--out", outJson,
    ];
    if (start !== null && start !== undefined) args.push("--start", String(start));
    if (end !== null && end !== undefined) args.push("--end", String(end));

    let stdout = "";
    let stderr = "";
    let done = false;
    // Khai báo trước để finish() gọi được cả khi spawn throw đồng bộ
    // (trước lúc detachAbort thật được gán ở dưới).
    let detachAbort = () => {};
    const finish = (err, result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      detachAbort();
      try { fs.unlinkSync(outJson); } catch { /* file có thể chưa được tạo */ }
      if (err) reject(err);
      else resolve(result);
    };
    const timer = setTimeout(() => {
      // Timeout: kill cả cây process thay vì chỉ python.
      killChildTree(child, 0).catch(() => {});
      finish(new Error(
        `Scene detection quá lâu (>${Math.round(cfg.timeoutMs / 1000)}s) — thử video ngắn hơn.`
      ));
    }, cfg.timeoutMs);
    // Tránh timer giữ process bridge sống khi không còn việc gì.
    if (typeof timer.unref === "function") timer.unref();

    let child;
    try {
      child = spawn(cfg.pythonBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        // Đợt 80 H8: group riêng để hủy diệt được cả ffmpeg con.
        detached: process.platform !== "win32",
      });
    } catch (e) {
      finish(new Error(`Không khởi chạy được scene.py: ${e.message}`));
      return;
    }
    // Đợt 80 H8: hủy thật — signal abort → kill cây process, reject lỗi
    // AI_JOB_ABORTED (route phân biệt để gửi event "cancelled").
    detachAbort = killChildOnAbort(child, signal, 2000);
    if (signal) {
      signal.addEventListener("abort", () => {
        finish(abortError("Job đã bị hủy."));
      }, { once: true });
    }
    child.on("error", (e) => {
      finish(new Error(`Không khởi chạy được scene.py: ${e.message}`));
    });
    child.stdout.on("data", (d) => {
      stdout += d.toString();
      // scene.py in "[scene] ..." — báo phase scan 1 lần.
      if (stdout.includes("[scene] quét scene") && onPhase) {
        try { onPhase("scan"); } catch { /* callback của caller */ }
      }
    });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => {
      if (code !== 0) {
        const msg = (stderr.match(/\[scene\] LỖI: ([^\n]+)/) || [])[1]
          || `scene.py thoát với mã ${code}.`;
        finish(new Error(redactStderr(msg).trim()));
        return;
      }
      let data;
      try {
        data = JSON.parse(fs.readFileSync(outJson, "utf-8"));
      } catch (e) {
        finish(new Error(`Không đọc được output scene.py: ${e.message}`));
        return;
      }
      try {
        const cuts = validateCuts(data.cuts);
        const duration = data.duration === null || data.duration === undefined
          ? null
          : Number(data.duration);
        finish(null, {
          cuts,
          duration: Number.isFinite(duration) ? duration : null,
          threshold: Number(data.threshold),
        });
      } catch (e) {
        finish(e);
      }
    });
  });
}

module.exports = {
  DEFAULT_THRESHOLD,
  MIN_THRESHOLD,
  MAX_THRESHOLD,
  sceneConfigFromEnv,
  validateThreshold,
  validateRange,
  sceneAvailable,
  validateCuts,
  runSceneDetect,
};
