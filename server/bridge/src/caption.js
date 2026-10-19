"use strict";
/**
 * caption.js — Auto-caption qua server/caption/caption.py (faster-whisper, 100% local).
 *
 * R1-072: bridge nhận 1 file video/audio (multipart — KHÔNG nhận đường dẫn
 * tuyệt đối từ client, theo chính sách bảo mật của bridge), chạy caption.py
 * bằng child_process.spawn với argv CỐ ĐỊNH (không shell, không lệnh tùy ý),
 * parse JSON output, validate segments rồi trả về cho UI.
 *
 * Tiến trình được stream về client dạng NDJSON qua onPhase callback:
 *   extract → transcribe → group
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

/**
 * Whitelist ngôn ngữ — caption.py chỉ nhận mã ISO ngắn; whitelist chặn
 * injection qua argv và typo của client.
 */
const CAPTION_LANGS = [
  "vi", "en", "auto",
  "zh", "ja", "ko", "th", "id", "ms",
  "fr", "de", "es",
];
const DEFAULT_LANG = "vi";
// faster-whisper small ~1-3x realtime trên CPU → video 10 phút có thể mất
// tới ~30 phút. Timeout dài nhưng vẫn có giới hạn để không treo worker.
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

function captionConfigFromEnv(env = process.env) {
  const t = parseInt(env.CAPTION_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.CAPTION_PYTHON || "python3",
    captionPy: env.CAPTION_PY ||
      path.resolve(__dirname, "..", "..", "caption", "caption.py"),
    timeoutMs: Number.isFinite(t) && t >= 30_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/** Chuẩn hóa + validate mã ngôn ngữ; throw → endpoint trả 400. */
function validateLang(raw) {
  const lang = String(raw ?? DEFAULT_LANG).trim().toLowerCase();
  if (!CAPTION_LANGS.includes(lang)) {
    throw new Error(
      `Ngôn ngữ không hỗ trợ: "${raw}". Chọn một trong: ${CAPTION_LANGS.join(", ")}.`
    );
  }
  return lang;
}

/**
 * Kiểm tra nhanh caption có chạy được không (python + file script tồn tại).
 * KHÔNG nạp model (nặng) — model thiếu sẽ báo lỗi rõ khi chạy thật.
 */
function captionAvailable(cfg = captionConfigFromEnv()) {
  if (!fs.existsSync(cfg.captionPy)) {
    return { available: false, reason: `Không tìm thấy caption.py (${cfg.captionPy})` };
  }
  return { available: true, python: cfg.pythonBin, script: cfg.captionPy };
}

/** Nhận diện phase từ 1 dòng stdout của caption.py. */
function phaseFromLine(line) {
  const l = String(line || "");
  if (l.includes("[caption] trích audio")) return "extract";
  if (l.includes("[caption] đang transcribe")) return "transcribe";
  if (l.includes("[caption] xong")) return "group";
  return null;
}

/** Nhãn tiếng Việt cho từng phase (hiện trong modal). */
const PHASE_LABELS = {
  upload: "Đã nhận file, chuẩn bị…",
  extract: "Đang trích xuất audio…",
  transcribe: "Đang nhận diện giọng nói (video dài có thể mất vài phút)…",
  group: "Đang gộp câu phụ đề…",
};

/**
 * Validate + sanitize mảng segments từ JSON của caption.py.
 * Bỏ qua segment hỏng thay vì fail cả job; sắp xếp theo start.
 */
function validateSegments(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("Output caption.py thiếu mảng 'segments'.");
  }
  if (raw.length > 5000) {
    throw new Error(`Quá nhiều segments (${raw.length}, tối đa 5000).`);
  }
  const out = [];
  for (const s of raw) {
    const start = Number(s && s.start);
    const end = Number(s && s.end);
    const text = String((s && s.text) || "").trim();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (start < 0 || end <= start) continue;
    if (!text) continue;
    out.push({
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      text: text.slice(0, 500),
    });
  }
  out.sort((a, b) => a.start - b.start);
  return out;
}

/**
 * Chạy caption.py cho 1 file local.
 *
 * @param {object} o
 * @param {string} o.inputPath  đường dẫn TUYỆT ĐỐI tới file media (do bridge
 *   tự lưu từ upload — không bao giờ lấy từ client).
 * @param {string} o.lang       mã ngôn ngữ (đã whitelist).
 * @param {(phase:string)=>void} [o.onPhase]  callback khi phase đổi.
 * @param {object} [o.config]   override captionConfigFromEnv() (cho test).
 * @returns {Promise<{language:string, audioDurationSec:number,
 *   transcribeTimeSec:number, segments:Array<{start,end,text}>>}}
 */
function runCaption({ inputPath, lang, onPhase, config } = {}) {
  const cfg = config || captionConfigFromEnv();
  const language = validateLang(lang);
  if (typeof inputPath !== "string" || !path.isAbsolute(inputPath)) {
    return Promise.reject(new Error("inputPath phải là đường dẫn tuyệt đối."));
  }
  if (!fs.existsSync(inputPath)) {
    return Promise.reject(new Error("Không tìm thấy file media để caption."));
  }

  return new Promise((resolve, reject) => {
    const outPath = path.join(
      os.tmpdir(),
      `vcut-caption-${Date.now()}-${process.pid}.json`
    );
    // argv CỐ ĐỊNH — không shell, không ghép chuỗi lệnh.
    const args = [
      cfg.captionPy,
      "--input", inputPath,
      "--lang", language,
      "--out", outPath,
    ];
    let child;
    try {
      child = spawn(cfg.pythonBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });
    } catch (e) {
      reject(new Error(`Không khởi động được caption.py: ${e.message}`));
      return;
    }

    let done = false;
    let lastPhase = null;
    let stdoutBuf = "";
    let stderrTail = "";

    const finish = (fn) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fn();
    };
    // Xóa file JSON tạm — gọi SAU khi đã đọc xong (close handler),
    // hoặc ngay khi timeout/lỗi spawn.
    const cleanupOut = () => {
      try { fs.unlinkSync(outPath); } catch { /* bỏ qua */ }
    };
    const emitPhase = (p) => {
      if (p && p !== lastPhase) {
        lastPhase = p;
        try { if (onPhase) onPhase(p); } catch { /* callback UI lỗi thì bỏ qua */ }
      }
    };

    const timer = setTimeout(() => {
      finish(() => {
        try { child.kill("SIGKILL"); } catch { /* bỏ qua */ }
        cleanupOut();
        reject(new Error(
          `Caption quá thời gian (${Math.round(cfg.timeoutMs / 60000)} phút) — thử video ngắn hơn.`
        ));
      });
    }, cfg.timeoutMs);
    // unref để timer không giữ process bridge khi test thoát
    if (timer.unref) timer.unref();

    child.stdout.on("data", (d) => {
      stdoutBuf += d.toString();
      let idx;
      while ((idx = stdoutBuf.indexOf("\n")) >= 0) {
        const line = stdoutBuf.slice(0, idx);
        stdoutBuf = stdoutBuf.slice(idx + 1);
        emitPhase(phaseFromLine(line));
      }
    });
    child.stderr.on("data", (d) => {
      stderrTail = (stderrTail + d.toString()).slice(-2000);
    });
    child.on("error", (e) => {
      finish(() => {
        cleanupOut();
        reject(new Error(`Không chạy được caption.py: ${e.message}`));
      });
    });
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          cleanupOut();
          reject(new Error(
            `caption.py thoát mã ${code}: ${(stderrTail || "").slice(-300) || "không rõ lỗi"}`
          ));
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(fs.readFileSync(outPath, "utf8"));
        } catch (e) {
          cleanupOut();
          reject(new Error(`Không đọc được output caption: ${e.message}`));
          return;
        }
        cleanupOut();
        let segments;
        try {
          segments = validateSegments(parsed.segments);
        } catch (e) {
          reject(e);
          return;
        }
        if (segments.length === 0) {
          reject(new Error("Không nhận diện được lời thoại nào (video câm hoặc quá nhiễu?)."));
          return;
        }
        resolve({
          language: parsed.language || language,
          audioDurationSec: Number(parsed.audio_duration_sec) || 0,
          transcribeTimeSec: Number(parsed.transcribe_time_sec) || 0,
          segments,
        });
      });
    });
  });
}

module.exports = {
  CAPTION_LANGS,
  DEFAULT_LANG,
  PHASE_LABELS,
  captionConfigFromEnv,
  validateLang,
  validateSegments,
  phaseFromLine,
  captionAvailable,
  runCaption,
};
