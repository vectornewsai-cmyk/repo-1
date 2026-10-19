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
// Giới hạn text 1 lần gọi (đồng bộ với tts.py MAX_TEXT_LEN)
const MAX_TEXT_LEN = 2000;
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
  if (!s) throw new Error("Text rỗng — nhập nội dung cần đọc.");
  if (s.length > MAX_TEXT_LEN) {
    throw new Error(`Text quá dài (${s.length} > ${MAX_TEXT_LEN} ký tự). Chia nhỏ ra.`);
  }
  return s;
}

/** Validate voice; throw → endpoint trả 400. */
function validateVoice(raw) {
  const v = String(raw ?? "").trim() || DEFAULT_VOICE;
  if (!VOICE_NAMES.includes(v)) {
    throw new Error(`Giọng không hỗ trợ: "${raw}". Chọn một trong: ${VOICE_NAMES.join(", ")}.`);
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
 * Chạy tts.py: text → file WAV.
 * Trả về { outPath, voice, chars, durationSec, synthSec, sampleRate }.
 * Ném Error khi tts.py exit != 0 hoặc timeout.
 */
function runTts({ text, voice, outDir, onPhase, cfg = ttsConfigFromEnv() }) {
  return new Promise((resolve, reject) => {
    const outPath = path.join(outDir, `tts-${Date.now()}.wav`);
    const args = [
      cfg.ttsPy,
      "--text", text,
      "--voice", voice,
      "--out", outPath,
    ];
    const child = spawn(cfg.pythonBin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      timeout: cfg.timeoutMs,
    });
    let stdout = "";
    let stderr = "";
    const phase = (p) => { try { onPhase && onPhase(p); } catch { /* bỏ qua */ } };

    child.stdout.on("data", (d) => {
      const s = String(d);
      stdout += s;
      for (const line of s.split("\n")) {
        if (line.includes("[tts] nạp model")) phase("load");
        else if (line.includes("[tts] tổng hợp")) phase("synth");
      }
    });
    child.stderr.on("data", (d) => { stderr += String(d); });
    child.on("error", (e) => reject(new Error(`Không chạy được tts.py: ${e.message}`)));
    child.on("close", (code) => {
      if (code !== 0) {
        const msg = (stderr.trim().split("\n").slice(-3).join(" ") || `tts.py exit ${code}`).slice(0, 500);
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
        return reject(new Error("TTS xong nhưng không thấy file WAV đầu ra."));
      }
      resolve({ outPath, voice, chars: text.length, durationSec: 0, synthSec: 0, sampleRate: 48000 });
    });
  });
}

module.exports = {
  TTS_VOICES,
  DEFAULT_VOICE,
  MAX_TEXT_LEN,
  ttsConfigFromEnv,
  validateText,
  validateVoice,
  ttsAvailable,
  runTts,
};
