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
const { redactStderr } = require("./errorDetail"); // Đợt 29 L3: tail lỗi phải redact trước khi ra API
const { codedError } = require("./errorCodes"); // Đợt 62 R5: mã lỗi bridge→web
// Đợt 80 H8 (gap N4): hủy job thật + tiến trình thật.
const { abortError, killChildOnAbort, killChildTree } = require("./aiProgress");

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

// --- R1-080: dịch phụ đề (faster-whisper translate task) ----------------------
// faster-whisper "translate" CHỈ dịch sang tiếng Anh — giới hạn của model.
// Không phải lựa chọn thiết kế; muốn cặp khác cần engine MT riêng.
const TRANSLATE_TARGET_LANGS = ["en"];
const DEFAULT_TRANSLATE_TARGET = "en";

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
  const s = String(raw ?? "").trim();
  const lang = (s || DEFAULT_LANG).toLowerCase();
  if (!CAPTION_LANGS.includes(lang)) {
    throw codedError(
      "UNSUPPORTED_LANG",
      `Ngôn ngữ không hỗ trợ: "${raw}". Chọn một trong: ${CAPTION_LANGS.join(", ")}.`,
      { lang: raw, langs: CAPTION_LANGS.join(", ") },
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
  if (l.includes("[caption] nạp model") || l.includes("[caption] dùng model local") ||
      l.includes("[caption] tải model")) return "load";
  if (l.includes("[caption] trích audio")) return "extract";
  if (l.includes("[caption] đang transcribe")) return "transcribe";
  if (l.includes("[caption] xong")) return "group";
  return null;
}

/**
 * Đợt 80 H8 (gap N4): nhận diện tiến trình THẬT từ 1 dòng stdout của
 * caption.py / translate.py — dạng "[caption] progress 12.3/60.0" (giây
 * audio đã transcribe / tổng giây audio). Trả về { done, total } hoặc
 * null khi dòng không phải progress. Đây là tiến trình thật: faster-whisper
 * trả segments theo thứ tự thời gian nên seg.end = vị trí đã xử lý.
 */
function progressFromLine(line, tag) {
  const t = tag || "caption";
  const m = new RegExp(`\\[${t}\\]\\s+progress\\s+([\\d.]+)\\/([\\d.]+)`).exec(String(line || ""));
  if (!m) return null;
  const done = parseFloat(m[1]);
  const total = parseFloat(m[2]);
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return { done, total };
}

/** Nhãn tiếng Việt cho từng phase (hiện trong modal). */
const PHASE_LABELS = {
  upload: "Đã nhận file, chuẩn bị…",
  // Đợt 80 H8: báo rõ khi nạp model chậm — lần đầu tải/khởi tạo model
  // faster-whisper có thể mất vài phút, trước đây UI chỉ hiện "Đang trích
  // xuất audio…" nên user tưởng app treo.
  load: "Đang nạp model nhận diện giọng nói (lần đầu có thể mất vài phút)…",
  extract: "Đang trích xuất audio…",
  transcribe: "Đang nhận diện giọng nói (video dài có thể mất vài phút)…",
  group: "Đang gộp câu phụ đề…",
};

/** R1-080: config cho translate.py — TRANSLATE_PY để test trỏ sang stub. */
function translateConfigFromEnv(env = process.env) {
  const t = parseInt(env.TRANSLATE_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.CAPTION_PYTHON || "python3",
    translatePy: env.TRANSLATE_PY ||
      path.resolve(__dirname, "..", "..", "caption", "translate.py"),
    timeoutMs: Number.isFinite(t) && t >= 30_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Validate ngôn ngữ ĐÍCH — hiện chỉ "en" (giới hạn của faster-whisper
 * translate task). Throw → endpoint trả 400.
 */
function validateTranslateTarget(raw) {
  const s = String(raw ?? "").trim();
  const target = (s || DEFAULT_TRANSLATE_TARGET).toLowerCase();
  if (!TRANSLATE_TARGET_LANGS.includes(target)) {
    throw codedError(
      "UNSUPPORTED_TARGET_LANG",
      `Ngôn ngữ đích chưa hỗ trợ: "${raw}". Hiện chỉ hỗ trợ: ${TRANSLATE_TARGET_LANGS.join(", ")} ` +
      `(giới hạn của faster-whisper translate task).`,
      { lang: raw, langs: TRANSLATE_TARGET_LANGS.join(", ") },
    );
  }
  return target;
}

/** Kiểm tra nhanh translate có chạy được không (python + script tồn tại). */
function translateAvailable(cfg = translateConfigFromEnv()) {
  if (!fs.existsSync(cfg.translatePy)) {
    return { available: false, reason: `Không tìm thấy translate.py (${cfg.translatePy})` };
  }
  return { available: true, python: cfg.pythonBin, script: cfg.translatePy };
}

/** Nhận diện phase từ 1 dòng stdout của translate.py. */
function translatePhaseFromLine(line) {
  const l = String(line || "");
  if (l.includes("[translate] nạp model") || l.includes("[caption] dùng model local") ||
      l.includes("[caption] tải model")) return "load";
  if (l.includes("[translate] trích audio")) return "extract";
  if (l.includes("[translate] đang dịch")) return "translating";
  if (l.includes("[translate] xong")) return "group";
  return null;
}

/** Nhãn tiếng Việt cho từng phase dịch (hiện trong modal). */
const TRANSLATE_PHASE_LABELS = {
  upload: "Đã nhận file, chuẩn bị…",
  // Đợt 80 H8: như PHASE_LABELS.load — báo rõ khi nạp model chậm.
  load: "Đang nạp model dịch giọng nói (lần đầu có thể mất vài phút)…",
  extract: "Đang trích xuất audio…",
  translating: "Đang dịch sang tiếng Anh (video dài có thể mất vài phút)…",
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
 * Phase 9 R4: validate + sanitize mảng words (word timestamps) từ JSON của
 * caption.py. Words hỏng thì bỏ qua (không fail job); thiếu mảng words thì
 * trả [] (caption cũ vẫn chạy, chỉ không có karaoke). Giới hạn 20000 từ.
 */
function validateWords(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const w of raw) {
    const start = Number(w && w.start);
    const end = Number(w && w.end);
    const word = String((w && w.word) || "").trim();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (start < 0 || end <= start) continue;
    if (!word) continue;
    out.push({
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      word: word.slice(0, 100),
    });
    if (out.length >= 20000) break;
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
/**
 * Core chung cho caption.py / translate.py: spawn script python với argv
 * CỐ ĐỊNH (không shell), stream phase từ stdout, đọc JSON output, validate
 * segments. Dùng nội bộ bởi runCaption/runTranslate.
 *
 * Đợt 80 H8 (gap N4) — tiến trình + hủy thật:
 *   - `signal` (AbortSignal): khi abort → kill cả cây process python
 *     (SIGTERM rồi SIGKILL sau 2s) và reject lỗi AI_JOB_ABORTED để route
 *     phân biệt "user hủy" với "lỗi chạy thật".
 *   - `onProgress({ phase, done, total })`: tiến trình THẬT từ dòng
 *     "[caption] progress <giây đã xong>/<tổng giây>" của caption.py
 *     (faster-whisper trả segments theo thứ tự thời gian).
 *   - spawn `detached` (POSIX) để process thành group leader — kill group
 *     mới diệt được cả ffmpeg con của bước trích audio (xem killChildTree).
 *
 * @returns {Promise<{parsed: object, segments: Array}>}
 */
function runPythonScriptJob({
  pythonBin, scriptPy, scriptName, tmpPrefix,
  inputPath, langArg, timeoutMs, onPhase, onProgress, signal,
  phaseFromLineFn, progressTag,
  timeoutMsg, spawnFailMsg, childErrorMsg, emptyErrorMsg,
}) {
  return new Promise((resolve, reject) => {
    // Đã bị hủy trước khi spawn → từ chối ngay, không chạy script.
    if (signal && signal.aborted) {
      reject(abortError("Job đã bị hủy trước khi chạy."));
      return;
    }
    const outPath = path.join(
      os.tmpdir(),
      `${tmpPrefix}${Date.now()}-${process.pid}.json`
    );
    // argv CỐ ĐỊNH — không shell, không ghép chuỗi lệnh.
    const args = [
      scriptPy,
      "--input", inputPath,
      "--lang", langArg,
      "--out", outPath,
    ];
    let child;
    try {
      child = spawn(pythonBin, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        // Đợt 80 H8: group riêng để hủy diệt được cả process con.
        detached: process.platform !== "win32",
      });
    } catch (e) {
      reject(new Error(`${spawnFailMsg}: ${e.message}`));
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
      detachAbort();
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
    const emitProgress = (p) => {
      if (!p) return;
      try {
        if (onProgress) onProgress({ phase: lastPhase, done: p.done, total: p.total });
      } catch { /* callback UI lỗi thì bỏ qua */ }
    };
    // Đợt 80 H8: hủy thật — signal abort → kill cây process rồi reject
    // lỗi AI_JOB_ABORTED (route phân biệt để gửi event "cancelled").
    const detachAbort = killChildOnAbort(child, signal, 2000);
    if (signal) {
      signal.addEventListener("abort", () => {
        finish(() => {
          cleanupOut();
          reject(abortError("Job đã bị hủy."));
        });
      }, { once: true });
    }

    const timer = setTimeout(() => {
      finish(() => {
        // Timeout: kill cả cây process (như abort) thay vì chỉ python —
        // trước đây child.kill("SIGKILL") để lại ffmpeg con mồ côi.
        killChildTree(child, 0).catch(() => {});
        cleanupOut();
        reject(new Error(timeoutMsg));
      });
    }, timeoutMs);
    // unref để timer không giữ process bridge khi test thoát
    if (timer.unref) timer.unref();

    child.stdout.on("data", (d) => {
      stdoutBuf += d.toString();
      let idx;
      while ((idx = stdoutBuf.indexOf("\n")) >= 0) {
        const line = stdoutBuf.slice(0, idx);
        stdoutBuf = stdoutBuf.slice(idx + 1);
        emitPhase(phaseFromLineFn(line));
        emitProgress(progressFromLine(line, progressTag));
      }
    });
    child.stderr.on("data", (d) => {
      stderrTail = (stderrTail + d.toString()).slice(-2000);
    });
    child.on("error", (e) => {
      finish(() => {
        cleanupOut();
        reject(new Error(`${childErrorMsg}: ${e.message}`));
      });
    });
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          cleanupOut();
          reject(new Error(
            `${scriptName} thoát mã ${code}: ${redactStderr(stderrTail).slice(-300) || "không rõ lỗi"}`
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
          reject(new Error(emptyErrorMsg));
          return;
        }
        resolve({ parsed, segments });
      });
    });
  });
}

function runCaption({ inputPath, lang, onPhase, onProgress, signal, config } = {}) {
  const cfg = config || captionConfigFromEnv();
  const language = validateLang(lang);
  if (typeof inputPath !== "string" || !path.isAbsolute(inputPath)) {
    return Promise.reject(new Error("inputPath phải là đường dẫn tuyệt đối."));
  }
  if (!fs.existsSync(inputPath)) {
    return Promise.reject(new Error("Không tìm thấy file media để caption."));
  }

  return runPythonScriptJob({
    pythonBin: cfg.pythonBin,
    scriptPy: cfg.captionPy,
    scriptName: "caption.py",
    tmpPrefix: "vcut-caption-",
    inputPath,
    langArg: language,
    timeoutMs: cfg.timeoutMs,
    onPhase,
    onProgress,
    signal,
    phaseFromLineFn: phaseFromLine,
    progressTag: "caption",
    timeoutMsg:
      `Caption quá thời gian (${Math.round(cfg.timeoutMs / 60000)} phút) — thử video ngắn hơn.`,
    spawnFailMsg: "Không khởi động được caption.py",
    childErrorMsg: "Không chạy được caption.py",
    emptyErrorMsg: "Không nhận diện được lời thoại nào (video câm hoặc quá nhiễu?).",
  }).then(({ parsed, segments }) => ({
    language: parsed.language || language,
    audioDurationSec: Number(parsed.audio_duration_sec) || 0,
    transcribeTimeSec: Number(parsed.transcribe_time_sec) || 0,
    segments,
    // R4: word timestamps để UI gắn karaoke (thiếu thì [] — không karaoke).
    words: validateWords(parsed.words),
  }));
}

/**
 * R1-080: dịch phụ đề sang tiếng Anh bằng translate.py
 * (faster-whisper translate task, 100% local).
 *
 * @param {object} o
 * @param {string} o.inputPath  đường dẫn TUYỆT ĐỐI tới file media.
 * @param {string} o.lang       mã ngôn ngữ NGUỒN (whitelist như caption).
 * @param {string} [o.target]   ngôn ngữ đích — hiện chỉ "en".
 * @param {(phase:string)=>void} [o.onPhase]
 * @param {object} [o.config]   override translateConfigFromEnv() (cho test).
 * @returns {Promise<{sourceLanguage:string, targetLanguage:string,
 *   audioDurationSec:number, translateTimeSec:number,
 *   segments:Array<{start,end,text}>>}}
 */
function runTranslate({ inputPath, lang, target, onPhase, onProgress, signal, config } = {}) {
  const cfg = config || translateConfigFromEnv();
  const sourceLang = validateLang(lang);
  const targetLang = validateTranslateTarget(target);
  if (typeof inputPath !== "string" || !path.isAbsolute(inputPath)) {
    return Promise.reject(new Error("inputPath phải là đường dẫn tuyệt đối."));
  }
  if (!fs.existsSync(inputPath)) {
    return Promise.reject(new Error("Không tìm thấy file media để dịch."));
  }

  return runPythonScriptJob({
    pythonBin: cfg.pythonBin,
    scriptPy: cfg.translatePy,
    scriptName: "translate.py",
    tmpPrefix: "vcut-translate-",
    inputPath,
    langArg: sourceLang,
    timeoutMs: cfg.timeoutMs,
    onPhase,
    onProgress,
    signal,
    phaseFromLineFn: translatePhaseFromLine,
    progressTag: "translate",
    timeoutMsg:
      `Dịch quá thời gian (${Math.round(cfg.timeoutMs / 60000)} phút) — thử video ngắn hơn.`,
    spawnFailMsg: "Không khởi động được translate.py",
    childErrorMsg: "Không chạy được translate.py",
    emptyErrorMsg: "Không dịch được câu nào (video câm hoặc quá nhiễu?).",
  }).then(({ parsed, segments }) => ({
    sourceLanguage: parsed.source_language || sourceLang,
    targetLanguage: parsed.target_language || targetLang,
    audioDurationSec: Number(parsed.audio_duration_sec) || 0,
    translateTimeSec: Number(parsed.translate_time_sec) || 0,
    segments,
  }));
}

module.exports = {
  CAPTION_LANGS,
  DEFAULT_LANG,
  PHASE_LABELS,
  captionConfigFromEnv,
  validateLang,
  validateSegments,
  validateWords,
  phaseFromLine,
  progressFromLine, // Đợt 80 H8: parse "[caption] progress done/total"
  captionAvailable,
  runCaption,
  // R1-080: dịch phụ đề sang tiếng Anh
  TRANSLATE_TARGET_LANGS,
  DEFAULT_TRANSLATE_TARGET,
  TRANSLATE_PHASE_LABELS,
  translateConfigFromEnv,
  validateTranslateTarget,
  translatePhaseFromLine,
  translateAvailable,
  runTranslate,
};
