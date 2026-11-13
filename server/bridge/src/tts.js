"use strict";
/**
 * tts.js — Text-to-Speech local qua server/tts/tts.py (VieNeu-TTS v3 Turbo 0.5B,
 * 100% local, ONNX trên CPU).
 *
 * R1-083: bridge nhận JSON {text, voice}, chạy tts.py bằng child_process.spawn
 * với argv CỐ ĐỊNH (không shell, không lệnh tùy ý), trả về file WAV.
 *
 * License: Apache 2.0 — verify 2 nguồn độc lập (2026-10-19):
 *  (1) PyPI package `vieneu` (pip show → "License: Apache License Version 2.0");
 *  (2) HF model repo pnnbao-ump/VieNeu-TTS-v3-Turbo (cardData license: apache-2.0).
 * ⚠️ KHÔNG dùng bản 0.3B (CC BY-NC 4.0 — cấm thương mại). tts.py ép mode="v3turbo".
 * Watermark: VieNeu-TTS bật watermark mặc định — tts.py LUÔN gọi
 * infer(..., apply_watermark=False).
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { redactStderr } = require("./errorDetail"); // Đợt 29 L3
const { codedError } = require("./errorCodes"); // Đợt 62 R5: mã lỗi bridge→web
// Đợt 80 H8 (gap N4): hủy job thật + tiến trình thật.
const { abortError, killChildOnAbort } = require("./aiProgress");

// 25 giọng preset của VieNeu-TTS v3 Turbo (mirror từ
// assets/voices_v3_turbo.json của package vieneu; tts.py --list-voices là nguồn thật)
const TTS_VOICES = [
  { name: "Hải Đăng", gender: "nam", desc: "Nam · Bắc · Phong cách tự nhiên" },
  { name: "Trúc Ly", gender: "nữ", desc: "Nữ · Bắc · Phong cách tự nhiên" },
  { name: "Thiện Minh", gender: "nam", desc: "Nam · Bắc · Phong cách kể chuyện" },
  { name: "Mai Anh", gender: "nữ", desc: "Nữ · Bắc · Phong cách tin tức" },
  { name: "Thùy Dung", gender: "nữ", desc: "Nữ · Nam · Phong cách tin tức" },
  { name: "Thiền Tâm Đức", gender: "nam", desc: "Nam · Bắc · Phong cách kể chuyện" },
  { name: "Ngọc Huyền", gender: "nữ", desc: "Nữ · Bắc · Giọng đọc tự nhiên" },
  { name: "Quang Sơn", gender: "nam", desc: "Nam · Trung · Phong cách tự nhiên" },
  { name: "Ngọc Trân", gender: "nữ", desc: "Nữ · Trung · Phong cách tự nhiên" },
  { name: "Minh Đức", gender: "nam", desc: "Nam · Bắc · Phong cách tin tức" },
  { name: "Phạm Tuyên", gender: "nam", desc: "Nam · Bắc · Phong cách tự nhiên" },
  { name: "Thái Sơn", gender: "nam", desc: "Nam · Nam · Phong cách kể chuyện" },
  { name: "Xuân Vĩnh", gender: "nam", desc: "Nam · Bắc · Phong cách tự nhiên" },
  { name: "Thanh Bình", gender: "nam", desc: "Nam · Bắc · Phong cách kể chuyện" },
  { name: "Ngọc Linh", gender: "nữ", desc: "Nữ · Bắc · Phong cách kể chuyện" },
  { name: "Đoan Trang", gender: "nữ", desc: "Nữ · Bắc · Phong cách tự nhiên" },
  { name: "Thục Đoan", gender: "nữ", desc: "Nữ · Nam · Phong cách kể chuyện" },
  { name: "Minh Triết", gender: "nam", desc: "Nam · Nam · Phong cách tin tức" },
  { name: "Mỹ Duyên", gender: "nữ", desc: "Nữ · Nam · Phong cách đọc truyện" },
  { name: "Quỳnh Anh", gender: "nữ", desc: "Nữ · Bắc · Phong cách đọc truyện" },
  { name: "Đức Trí", gender: "nam", desc: "Nam · Nam · Phong cách đọc truyện" },
  { name: "Kim Thanh", gender: "nữ", desc: "Nữ · Nam · Phong cách đọc truyện" },
  { name: "Adam", gender: "nam", desc: "Nam · Nam · Giọng đọc tự nhiên" },
  { name: "Quốc Tuấn", gender: "nam", desc: "Nam · Bắc · Phong cách tự nhiên" },
  { name: "Adam bựa", gender: "nam", desc: "Nam · Bắc · Phong cách tự nhiên" },
];
const DEFAULT_VOICE = "Hải Đăng"; // default_voice của model gốc
const VOICE_NAMES = TTS_VOICES.map((v) => v.name);
// Giới hạn text 1 lần gọi (đồng bộ với tts.py MAX_TEXT_LEN — Phase 9 R4
// nâng 2000 → 5000 vì tts.py tự chia câu + nối crossfade).
const MAX_TEXT_LEN = 5000;
// Giọng mẫu clone: tối đa 20MB (tts.py chặn tiếp ở 120s).
const MAX_REF_AUDIO_BYTES = 20 * 1024 * 1024;
const REF_AUDIO_EXTS = [".wav", ".mp3", ".m4a", ".ogg", ".flac", ".webm"];
// ZeroTTS ~2x realtime trên CPU → text dài 2000 ký tự (~2-3 phút nói)
// có thể mất ~1-2 phút. Timeout 10 phút cho chắc.
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function ttsConfigFromEnv(env = process.env) {
  const t = parseInt(env.TTS_TIMEOUT_MS || "", 10);
  return {
    pythonBin: env.TTS_PYTHON || "python3",
    ttsPy: env.TTS_PY ||
      path.resolve(__dirname, "..", "..", "tts", "tts.py"),
    timeoutMs: Number.isFinite(t) && t >= 30_000 ? t : DEFAULT_TIMEOUT_MS,
  };
}

/** Validate text; throw → endpoint trả 400. */
function validateText(raw) {
  const s = String(raw ?? "").trim();
  if (!s) throw codedError("TTS_TEXT_EMPTY", "Text rỗng — nhập nội dung cần đọc.");
  if (s.length > MAX_TEXT_LEN) {
    throw codedError("TTS_TEXT_TOO_LONG", `Text quá dài (${s.length} > ${MAX_TEXT_LEN} ký tự).`, { length: s.length, max: MAX_TEXT_LEN });
  }
  return s;
}

/** Validate file giọng mẫu clone; throw → endpoint trả 400. */
function validateRefAudio(file) {
  if (!file || !file.path) {
    throw codedError("TTS_REF_AUDIO_MISSING", "Thiếu file giọng mẫu (field 'refAudio').");
  }
  if (file.size > MAX_REF_AUDIO_BYTES) {
    throw codedError("TTS_REF_AUDIO_TOO_LARGE", `File giọng mẫu quá lớn (${(file.size / 1048576).toFixed(1)}MB > 20MB).`, { sizeMb: (file.size / 1048576).toFixed(1) });
  }
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!REF_AUDIO_EXTS.includes(ext)) {
    throw codedError("TTS_REF_AUDIO_TYPE", `File giọng mẫu phải là audio (${REF_AUDIO_EXTS.join(", ")}).`, { exts: REF_AUDIO_EXTS.join(", ") });
  }
  return file.path;
}

/** Validate voice; throw → endpoint trả 400. */
function validateVoice(raw) {
  const v = String(raw ?? "").trim() || DEFAULT_VOICE;
  if (!VOICE_NAMES.includes(v)) {
    throw codedError("UNSUPPORTED_VOICE", `Giọng không hỗ trợ: "${raw}". Chọn một trong: ${VOICE_NAMES.join(", ")}.`, { voice: raw, voices: VOICE_NAMES.join(", ") });
  }
  return v;
}

/**
 * Kiểm tra nhanh TTS có chạy được không (python + file script tồn tại).
 * KHÔNG nạp model (nặng ~0.86GB) — model thiếu sẽ báo lỗi rõ khi chạy thật.
 */
function ttsAvailable(cfg = ttsConfigFromEnv()) {
  if (!fs.existsSync(cfg.ttsPy)) {
    return { available: false, reason: `Không tìm thấy tts.py (${cfg.ttsPy})` };
  }
  return { available: true, python: cfg.pythonBin, script: cfg.ttsPy, voices: VOICE_NAMES };
}

/**
 * Đợt 80 H8 (gap N4): nhãn phase cho stream NDJSON của /api/tts (trước đây
 * route trả WAV trực tiếp nên onPhase của runTts không ai dùng — nay route
 * stream phase/progress → done + downloadUrl nên nhãn này hiện ra UI).
 */
const TTS_PHASE_LABELS = {
  load: "Đang nạp model giọng đọc (lần đầu có thể mất vài phút)…",
  synth: "Đang tổng hợp giọng đọc…",
};

/**
 * Đợt 80 H8: nhận diện tiến trình THẬT từ stdout của tts.py.
 * tts.py chia text thành chunk theo câu và log từng chunk xong:
 *   "[tts]   chunk 2/5 xong (123 ký tự)"
 *   "[tts] chia thành 5 chunk theo câu"
 * Trả về { done, total } (chunk đã xong / tổng chunk) hoặc null. Đây là
 * tiến trình thật: mỗi chunk là 1 lần infer hoàn chỉnh của model.
 */
function parseTtsChunkLine(line) {
  const m = /\[tts\]\s+chunk\s+(\d+)\/(\d+)\s+xong/.exec(String(line || ""));
  if (!m) return null;
  const done = parseInt(m[1], 10);
  const total = parseInt(m[2], 10);
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return { done, total };
}

/** Tổng số chunk từ dòng "[tts] chia thành N chunk theo câu" (biết trước khi infer chunk đầu). */
function parseTtsChunkTotal(line) {
  const m = /\[tts\]\s+chia thành\s+(\d+)\s+chunk/.exec(String(line || ""));
  if (!m) return null;
  const total = parseInt(m[1], 10);
  return Number.isFinite(total) && total > 0 ? total : null;
}

/**
 * Chạy tts.py: text → file WAV.
 * Trả về { outPath, voice, chars, durationSec, synthSec, sampleRate }.
 * Ném Error khi tts.py exit != 0 hoặc timeout.
 *
 * Đợt 80 H8 (gap N4): thêm `signal` (AbortSignal) + `onProgress`:
 * abort → kill cả cây process python (SIGTERM → SIGKILL sau 2s) và reject
 * lỗi AI_JOB_ABORTED; onProgress({ phase: "synth", done, total }) báo
 * chunk thật đã tổng hợp xong (không ước lượng theo thời gian).
 */
/**
 * Phase 9 R4: refAudioPath có thì chạy chế độ clone giọng (tts.py --ref-audio,
 * bỏ --voice). Không có thì chạy giọng preset như cũ.
 */
function runTts({ text, voice, refAudioPath, outDir, onPhase, onProgress, signal, cfg = ttsConfigFromEnv() }) {
  return new Promise((resolve, reject) => {
    // Đã bị hủy trước khi spawn → từ chối ngay, không chạy script.
    if (signal && signal.aborted) {
      reject(abortError("Job đã bị hủy trước khi chạy."));
      return;
    }
    const outPath = path.join(outDir, `tts-${Date.now()}.wav`);
    const args = refAudioPath
      ? [cfg.ttsPy, "--text", text, "--ref-audio", refAudioPath, "--out", outPath]
      : [cfg.ttsPy, "--text", text, "--voice", voice, "--out", outPath];
    const child = spawn(cfg.pythonBin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      timeout: cfg.timeoutMs,
      // Đợt 80 H8: group riêng để hủy diệt được cả process con.
      detached: process.platform !== "win32",
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const phase = (p) => { try { onPhase && onPhase(p); } catch { /* bỏ qua */ } };
    const progress = (done, total) => {
      try { onProgress && onProgress({ phase: "synth", done, total }); } catch { /* bỏ qua */ }
    };
    // Đợt 80 H8: hủy thật — signal abort → kill cây process, reject lỗi
    // AI_JOB_ABORTED (route phân biệt để gửi event "cancelled").
    const detachAbort = killChildOnAbort(child, signal, 2000);
    if (signal) {
      signal.addEventListener("abort", () => {
        if (settled) return;
        settled = true;
        detachAbort();
        reject(abortError("Job đã bị hủy."));
      }, { once: true });
    }

    child.stdout.on("data", (d) => {
      const s = String(d);
      stdout += s;
      for (const line of s.split("\n")) {
        if (line.includes("[tts] nạp model")) phase("load");
        else if (line.includes("[tts] tổng hợp")) phase("synth");
        const total = parseTtsChunkTotal(line);
        if (total !== null) progress(0, total);
        const chunk = parseTtsChunkLine(line);
        if (chunk) progress(chunk.done, chunk.total);
      }
    });
    child.stderr.on("data", (d) => { stderr += String(d); });
    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      detachAbort();
      reject(new Error(`Không chạy được tts.py: ${e.message}`));
    });
    child.on("close", (code) => {
      if (settled) return; // đã bị abort/timeout xử lý trước
      settled = true;
      detachAbort();
      if (code !== 0) {
        const msg = (redactStderr(stderr).trim().split("\n").slice(-3).join(" ") || `tts.py exit ${code}`).slice(0, 500);
        return reject(new Error(`TTS thất bại: ${msg}`));
      }
      // Dòng JSON cuối của stdout chứa kết quả
      const lines = stdout.trim().split("\n").filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const obj = JSON.parse(lines[i]);
          if (obj && obj.ok) {
            return resolve({ ...obj, outPath: obj.out || outPath });
          }
        } catch { /* không phải JSON → bỏ qua */ }
      }
      if (!fs.existsSync(outPath)) {
        return reject(codedError("TTS_NO_WAV", "TTS xong nhưng không thấy file WAV đầu ra."));
      }
      resolve({ outPath, voice, chars: text.length, durationSec: 0, synthSec: 0, sampleRate: 48000 });
    });
  });
}

module.exports = {
  TTS_VOICES,
  DEFAULT_VOICE,
  MAX_TEXT_LEN,
  MAX_REF_AUDIO_BYTES,
  REF_AUDIO_EXTS,
  TTS_PHASE_LABELS, // Đợt 80 H8: nhãn phase cho stream NDJSON
  parseTtsChunkLine, // Đợt 80 H8: parse "[tts] chunk i/N xong"
  parseTtsChunkTotal, // Đợt 80 H8: parse "[tts] chia thành N chunk"
  ttsConfigFromEnv,
  validateText,
  validateVoice,
  validateRefAudio,
  ttsAvailable,
  runTts,
};
