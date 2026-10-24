/**
 * audioroute.js — Audio routing cho render worker (Node, zero-deps).
 *
 * Mirror của `packages/video-spec/src/audio.ts`.
 * Định nghĩa cách xử lý audio stream bên trong file video nguồn.
 */
"use strict";

const SOURCE_AUDIO_MODES = ["inherit", "mute", "detach"];

const DEFAULT_SOURCE_AUDIO_MODE = "inherit";

function isSourceAudioMode(v) {
  return typeof v === "string" && SOURCE_AUDIO_MODES.includes(v);
}

/** Validate sourceAudioMode, trả về danh sách lỗi (rỗng = hợp lệ). */
function validateSourceAudioMode(v) {
  if (v === undefined) return [];
  if (!isSourceAudioMode(v)) {
    return [
      `sourceAudioMode phải là một trong ${SOURCE_AUDIO_MODES.map((m) => `"${m}"`).join(" | ")}, ` +
      `nhận được: ${JSON.stringify(v)}`,
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------
// R1-076: Audio effects — mirror của `packages/video-spec/src/audio.ts`
// (AudioEffects). Dựng chuỗi filter FFmpeg cho render worker.
// ---------------------------------------------------------------------------

/** Format số cho filter arg — tránh ký hiệu khoa học và số 0 thừa. */
function fmtNum(v) {
  if (!Number.isFinite(v)) return "0";
  const r = Math.round(v * 1000) / 1000;
  return String(r);
}

/** true nếu có ít nhất 1 effect đang bật. */
function hasAudioEffects(fx) {
  if (!fx || typeof fx !== "object") return false;
  // Phase 8 Q5: voice effects cũng là AudioEffects.
  let voice = false;
  try {
    voice = require("./voicefx").hasVoiceEffect(fx.voice);
  } catch {
    voice = false;
  }
  return (
    Math.abs(Number(fx.bass ?? 0)) > 1e-9 ||
    Math.abs(Number(fx.treble ?? 0)) > 1e-9 ||
    Number(fx.noiseReduction ?? 0) > 1e-9 ||
    fx.compressor !== undefined ||
    Number(fx.reverb ?? 0) > 1e-9 ||
    voice
  );
}

/**
 * Dựng chuỗi filter FFmpeg cho AudioEffects.
 * Trả về "" nếu không có effect nào bật, ngược lại ",bass=g=..,treble=g=..,...".
 *
 * Thứ tự (khớp audio.ts): bass → treble → noiseReduction → compressor → reverb.
 * Ánh xạ filter (đã kiểm chứng trên FFmpeg 8.1.2):
 * - bass/treble (dB, -12..+12) → `bass=g=X` / `treble=g=X`
 * - noiseReduction (0..1) → `afftdn=nr={4+20v}:nf={-50+25v}`
 *   (nr 4..24 trong khoảng cho phép 0.01..97; nf -50..-25 trong -80..-20)
 * - compressor → `acompressor=threshold={linear}:ratio=R:attack=A:release=Rel`
 *   (acompressor dùng threshold LINEAR 0.000976..1 — đổi từ dB: 10^(dB/20))
 * - reverb (0..1) → `aecho` 3 taps (30|60|120ms),
 *   decays={0.15+0.45v}|{0.1+0.3v}|{0.08+0.22v} — 3 taps để tránh notch
 *   comb-filtering triệt tiêu hoàn toàn 1 tần số (vd delay 45ms triệt tiêu sine 100Hz).
 */
function buildAudioEffectsFilters(fx) {
  if (!hasAudioEffects(fx)) return "";
  const parts = [];
  const bass = Number(fx.bass ?? 0);
  if (Math.abs(bass) > 1e-9) parts.push(`bass=g=${fmtNum(bass)}`);
  const treble = Number(fx.treble ?? 0);
  if (Math.abs(treble) > 1e-9) parts.push(`treble=g=${fmtNum(treble)}`);
  const nr = Number(fx.noiseReduction ?? 0);
  if (nr > 1e-9) {
    const nrDb = fmtNum(4 + nr * 20);
    const nfDb = fmtNum(-50 + nr * 25);
    parts.push(`afftdn=nr=${nrDb}:nf=${nfDb}`);
  }
  const comp = fx.compressor;
  if (comp && typeof comp === "object") {
    const thrDb = Number(comp.thresholdDb ?? -20);
    // acompressor threshold là linear (0.000976..1), không phải dB.
    const threshold = Math.min(1, Math.max(0.000976563, Math.pow(10, thrDb / 20)));
    const ratio = Number(comp.ratio ?? 4);
    const attack = Number(comp.attackMs ?? 20);
    const release = Number(comp.releaseMs ?? 250);
    parts.push(
      `acompressor=threshold=${fmtNum(threshold)}:ratio=${fmtNum(ratio)}` +
        `:attack=${fmtNum(attack)}:release=${fmtNum(release)}`,
    );
  }
  const rev = Number(fx.reverb ?? 0);
  if (rev > 1e-9) {
    // 3 taps (30|60|120ms): phân tán notch của comb filtering — delay đơn
    // (vd 45ms) có thể triệt tiêu hoàn toàn sine 100Hz do lệch pha 180°.
    // Xem AUDIOFX_LIMITS.md.
    const d1 = fmtNum(0.15 + 0.45 * rev);
    const d2 = fmtNum(0.1 + 0.3 * rev);
    const d3 = fmtNum(0.08 + 0.22 * rev);
    parts.push(`aecho=in_gain=0.8:out_gain=0.9:delays=30|60|120:decays=${d1}|${d2}|${d3}`);
  }
  // Phase 8 Q5: voice effects đứng sau reverb, trước volume (xem voicefx.js).
  if (fx.voice !== undefined) {
    const { buildVoiceFilters } = require("./voicefx");
    const vf = buildVoiceFilters(fx.voice);
    if (vf) parts.push(vf.slice(1)); // bỏ dấu phẩy đầu (parts tự nối bằng ",")
  }
  return parts.length ? "," + parts.join(",") : "";
}

/** Validate AudioEffects (mirror validateAudioEffects trong audio.ts). */
function validateAudioEffects(v) {
  if (v === undefined || v === null) return [];
  if (typeof v !== "object" || Array.isArray(v)) return ["audioEffects phải là object"];
  const errs = [];
  const numIn = (key, min, max) => {
    const val = v[key];
    if (val === undefined) return;
    if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
      errs.push(
        `audioEffects.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`,
      );
    }
  };
  numIn("bass", -12, 12);
  numIn("treble", -12, 12);
  numIn("noiseReduction", 0, 1);
  numIn("reverb", 0, 1);
  // Phase 8 Q5: voice effects (mirror voicefx.js).
  if (v.voice !== undefined) {
    const { validateVoice } = require("./voicefx");
    for (const m of validateVoice(v.voice)) errs.push(`audioEffects.${m}`);
  }
  const c = v.compressor;
  if (c !== undefined) {
    if (typeof c !== "object" || c === null || Array.isArray(c)) {
      errs.push("audioEffects.compressor phải là object");
    } else {
      const cnum = (key, min, max) => {
        const val = c[key];
        if (val === undefined) return;
        if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
          errs.push(
            `audioEffects.compressor.${key} phải là số trong [${min}, ${max}], ` +
              `nhận được: ${JSON.stringify(val)}`,
          );
        }
      };
      cnum("thresholdDb", -60, 0);
      cnum("ratio", 1, 20);
      cnum("attackMs", 0.1, 2000);
      cnum("releaseMs", 10, 9000);
    }
  }
  return errs;
}

module.exports = {
  SOURCE_AUDIO_MODES,
  DEFAULT_SOURCE_AUDIO_MODE,
  isSourceAudioMode,
  validateSourceAudioMode,
  hasAudioEffects,
  buildAudioEffectsFilters,
  validateAudioEffects,
};
