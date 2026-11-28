/**
 * audio.ts — Audio routing cho video-spec.
 *
 * Định nghĩa cách xử lý audio stream bên trong file video nguồn:
 * - "inherit": giữ tiếng gốc của video (mặc định) — render sẽ trích audio
 *   từ video source, áp cùng trim/speed/reverse rồi mix vào output.
 * - "mute": bỏ qua audio của video (video câm).
 * - "detach": (chưa hỗ trợ) tách audio thành clip riêng để chỉnh độc lập.
 */

/**
 * Phase 7 P3 — Đường cong fade (áp cho fadeIn/fadeOut của AudioClip).
 * - "linear": tuyến tính (khớp afade cũ).
 * - "ease-in": p^2 (mở đầu chậm, về cuối nhanh).
 * - "ease-out": 1-(1-p)^2 (mở đầu nhanh, về cuối chậm).
 * - "sine": sin(p·π/2) cho fade-in, sin(q·π/2) cho fade-out (mượt kiểu equal-power).
 * Mặc định khi không khai: "linear".
 */
export const FADE_CURVES = ["linear", "ease-in", "ease-out", "sine"] as const;

/** Đường cong fade cho fadeIn/fadeOut. */
export type FadeCurve = (typeof FADE_CURVES)[number];

export const SOURCE_AUDIO_MODES = ["inherit", "mute", "detach"] as const;

/** Cách xử lý audio trong file video nguồn. */
export type SourceAudioMode = (typeof SOURCE_AUDIO_MODES)[number];

/** Mặc định: giữ tiếng gốc. */
export const DEFAULT_SOURCE_AUDIO_MODE: SourceAudioMode = "inherit";

export function isSourceAudioMode(v: unknown): v is SourceAudioMode {
  return typeof v === "string" && (SOURCE_AUDIO_MODES as readonly string[]).includes(v);
}

/**
 * Validate sourceAudioMode. Trả về danh sách lỗi (rỗng = hợp lệ).
 * "detach" hợp lệ về mặt schema nhưng render worker hiện chưa hỗ trợ
 * (sẽ báo lỗi rõ ràng ở tầng render, không im lặng bỏ qua).
 */
export function validateSourceAudioMode(v: unknown): string[] {
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
// R1-076: Audio effects — bass/treble/noise reduction/compressor/reverb.
// Áp dụng cho AudioClip và audio kế thừa của VideoClip (sourceAudioMode="inherit").
//
// Thứ tự render (server/render/src/render.js, sau aformat, trước volume):
//   bass → treble → noiseReduction → compressor → reverb → volume → afade
// ---------------------------------------------------------------------------

/** Cài đặt compressor (undefined = tắt). */
export interface AudioCompressorSettings {
  /** Ngưỡng nén (dB), -60..0, mặc định -20. Render đổi sang linear cho acompressor. */
  thresholdDb?: number;
  /** Tỉ lệ nén 1..20, mặc định 4. */
  ratio?: number;
  /** Attack (ms) 0.1..2000, mặc định 20. */
  attackMs?: number;
  /** Release (ms) 10..9000, mặc định 250. */
  releaseMs?: number;
}

/** Hiệu ứng audio cho clip. Mọi field đều optional; không có = tắt. */
export interface AudioEffects {
  /** Bass boost/cut (dB), -12..+12, mặc định 0 = tắt. Render: filter `bass`. */
  bass?: number;
  /** Treble boost/cut (dB), -12..+12, mặc định 0 = tắt. Render: filter `treble`. */
  treble?: number;
  /** Giảm nhiễu 0..1, mặc định 0 = tắt. Render: `afftdn`. */
  noiseReduction?: number;
  /** Compressor — undefined = tắt. Render: `acompressor`. */
  compressor?: AudioCompressorSettings;
  /** Reverb 0..1, mặc định 0 = tắt. Render: `aecho` 2 taps. */
  reverb?: number;
  /** Đổi giọng (Phase 8 Q5) — undefined = tắt. Render: xem voicefx.js. */
  voice?: VoiceEffect;
}

/**
 * VoiceEffect — đổi giọng cho clip (Phase 8 Q5).
 * Tất cả field đều optional; không có field nào bật = tắt.
 */
export interface VoiceEffect {
  /** Đổi cao độ (semitone, -12..12, 0 = tắt). Render: rubberband, giữ tốc độ. */
  pitch?: number;
  /** Giọng robot: true hoặc { rate (Hz, 5..60, mặc định 25), depth (0..1, mặc định 0.6) }. Render: vibrato. */
  robot?: boolean | { rate?: number; depth?: number };
  /** Giọng điện thoại: chỉ giữ dải 300–3400 Hz. Render: highpass + lowpass. */
  telephone?: boolean;
  /** Vang giọng: true hoặc { delayMs (50..1000, mặc định 200), decay (0..1, mặc định 0.5) }. Render: aecho 1 tap. */
  echo?: boolean | { delayMs?: number; decay?: number };
}

// ---------------------------------------------------------------------------
// Đợt 191 P1 — Mặc định + resolve cho voice effects (1 nguồn số chung cho
// render FFmpeg và preview Web Audio — cùng preset phải cho cùng tham số).
// Mirror trong server/render/src/voicefx.js (JS) và audio.js (twin viết tay).
// ---------------------------------------------------------------------------

/** Robot mặc định: vibrato f=25 Hz (mirror voicefx.js). */
export const DEFAULT_VOICE_ROBOT_RATE = 25;
/** Robot mặc định: vibrato d=0.6 (mirror voicefx.js). */
export const DEFAULT_VOICE_ROBOT_DEPTH = 0.6;
/** Echo mặc định: aecho delays=200 ms (mirror voicefx.js). */
export const DEFAULT_VOICE_ECHO_DELAY_MS = 200;
/** Echo mặc định: aecho decays=0.5 (mirror voicefx.js). */
export const DEFAULT_VOICE_ECHO_DECAY = 0.5;
/**
 * Hằng số aecho của render (đo thật bằng impulse trên FFmpeg 8.1.2,
 * đợt 191 P1 — xem voicefx.js): out = outGain × (inGain × in +
 * Σ decay × in(t−delay)). Lưu ý dry KHÔNG phải inGain (0.8) mà là
 * inGain × outGain = 0.72; wet = outGain × decay.
 */
export const VOICE_ECHO_IN_GAIN = 0.8;
/** Xem VOICE_ECHO_IN_GAIN. */
export const VOICE_ECHO_OUT_GAIN = 0.9;

/** Tham số voice đã resolve — mọi field đều có giá trị cụ thể. */
export interface ResolvedVoiceEffect {
  /** Có ít nhất 1 voice effect đang bật. */
  active: boolean;
  /** Cao độ (semitone, 0 = tắt). */
  pitchSemitones: number;
  /** Hệ số tần số 2^(n/12) — đúng tham số rubberband=pitch của render. */
  pitchRatio: number;
  /** Robot đã resolve (null = tắt). */
  robot: { rate: number; depth: number } | null;
  /** Telephone đang bật. */
  telephone: boolean;
  /** Echo đã resolve (null = tắt). */
  echo: { delayMs: number; decay: number } | null;
}

/** true nếu có ít nhất 1 voice effect đang bật (mirror voicefx.js hasVoiceEffect). */
export function hasVoiceEffect(voice?: VoiceEffect | null): boolean {
  if (!voice || typeof voice !== "object") return false;
  if (Math.abs(Number(voice.pitch ?? 0)) > 1e-9) return true;
  if (voice.robot !== undefined && voice.robot !== false) return true;
  if (voice.telephone === true) return true;
  if (voice.echo !== undefined && voice.echo !== false) return true;
  return false;
}

/**
 * Resolve VoiceEffect về tham số cụ thể, điền mặc định render khi field thiếu.
 * - pitch: giữ nguyên (0 = tắt); pitchRatio = 2^(n/12).
 * - robot true → { rate: 25, depth: 0.6 }; object thì điền từng field thiếu.
 * - echo true → { delayMs: 200, decay: 0.5 }; object thì điền từng field thiếu.
 * - robot/echo = false hoặc undefined → null (tắt).
 * Không validate khoảng — validateAudioEffects vẫn là cổng chặn giá trị sai.
 */
export function resolveVoiceEffect(voice?: VoiceEffect | null): ResolvedVoiceEffect {
  const pitch = Number(voice?.pitch ?? 0);
  const robotRaw = voice?.robot;
  const robot =
    robotRaw === undefined || robotRaw === false
      ? null
      : {
          rate: robotRaw === true ? DEFAULT_VOICE_ROBOT_RATE : Number(robotRaw.rate ?? DEFAULT_VOICE_ROBOT_RATE),
          depth: robotRaw === true ? DEFAULT_VOICE_ROBOT_DEPTH : Number(robotRaw.depth ?? DEFAULT_VOICE_ROBOT_DEPTH),
        };
  const echoRaw = voice?.echo;
  const echo =
    echoRaw === undefined || echoRaw === false
      ? null
      : {
          delayMs: echoRaw === true ? DEFAULT_VOICE_ECHO_DELAY_MS : Number(echoRaw.delayMs ?? DEFAULT_VOICE_ECHO_DELAY_MS),
          decay: echoRaw === true ? DEFAULT_VOICE_ECHO_DECAY : Number(echoRaw.decay ?? DEFAULT_VOICE_ECHO_DECAY),
        };
  return {
    active: hasVoiceEffect(voice),
    pitchSemitones: pitch,
    pitchRatio: Math.pow(2, pitch / 12),
    robot,
    telephone: voice?.telephone === true,
    echo,
  };
}

/** true nếu có ít nhất 1 effect đang bật. */
export function hasAudioEffects(fx?: AudioEffects | null): boolean {
  if (!fx) return false;
  return (
    Math.abs(fx.bass ?? 0) > 1e-9 ||
    Math.abs(fx.treble ?? 0) > 1e-9 ||
    (fx.noiseReduction ?? 0) > 1e-9 ||
    fx.compressor !== undefined ||
    (fx.reverb ?? 0) > 1e-9 ||
    fx.voice !== undefined
  );
}

/** Validate AudioEffects. Trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateAudioEffects(v: unknown): string[] {
  if (v === undefined || v === null) return [];
  if (typeof v !== "object" || Array.isArray(v)) return ["audioEffects phải là object"];
  const fx = v as Record<string, unknown>;
  const errs: string[] = [];
  const numIn = (key: string, min: number, max: number) => {
    const val = fx[key];
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
  // Phase 8 Q5: voice effects.
  const voice = fx["voice"];
  if (voice !== undefined) {
    if (typeof voice !== "object" || voice === null || Array.isArray(voice)) {
      errs.push("audioEffects.voice phải là object");
    } else {
      const vv = voice as Record<string, unknown>;
      const vnum = (key: string, min: number, max: number) => {
        const val = vv[key];
        if (val === undefined) return;
        if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
          errs.push(
            `audioEffects.voice.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`,
          );
        }
      };
      vnum("pitch", -12, 12);
      const r = vv["robot"];
      if (r !== undefined && r !== true && r !== false) {
        if (typeof r !== "object" || r === null || Array.isArray(r)) {
          errs.push("audioEffects.voice.robot phải là true hoặc object { rate?, depth? }");
        } else {
          const rr = r as Record<string, unknown>;
          const rnum = (key: string, min: number, max: number) => {
            const val = rr[key];
            if (val === undefined) return;
            if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
              errs.push(
                `audioEffects.voice.robot.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`,
              );
            }
          };
          rnum("rate", 5, 60);
          rnum("depth", 0, 1);
        }
      }
      if (vv["telephone"] !== undefined && typeof vv["telephone"] !== "boolean")
        errs.push("audioEffects.voice.telephone phải là boolean");
      const e = vv["echo"];
      if (e !== undefined && e !== true && e !== false) {
        if (typeof e !== "object" || e === null || Array.isArray(e)) {
          errs.push("audioEffects.voice.echo phải là true hoặc object { delayMs?, decay? }");
        } else {
          const ee = e as Record<string, unknown>;
          const enm = (key: string, min: number, max: number) => {
            const val = ee[key];
            if (val === undefined) return;
            if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
              errs.push(
                `audioEffects.voice.echo.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`,
              );
            }
          };
          enm("delayMs", 50, 1000);
          enm("decay", 0, 1);
        }
      }
    }
  }
  const c = fx["compressor"];
  if (c !== undefined) {
    if (typeof c !== "object" || c === null || Array.isArray(c)) {
      errs.push("audioEffects.compressor phải là object");
    } else {
      const cc = c as Record<string, unknown>;
      const cnum = (key: string, min: number, max: number) => {
        const val = cc[key];
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

// ---------------------------------------------------------------------------
// Audio ducking — nhạc tự nhỏ khi có lời thoại (kiểu CapCut "ducking").
// Cấp PROJECT (không phải cấp clip): một cài đặt duy nhất cho toàn project.
// Render: server/render/src/render.js tách mix thành 2 nhánh (voice mix từ
// track giọng + music mix từ các track audio còn lại và audio kế thừa của
// video), áp FFmpeg `sidechaincompress` rồi amix lại — xem DUCKING_LIMITS.md.
// Mặc định TẮT: không khai `ducking`, hoặc `enabled` khác true, thì render
// y hệt cũ (filtergraph không đổi 1 ký tự).
// ---------------------------------------------------------------------------

/**
 * Cài đặt audio ducking cho project.
 * Mọi field đều optional; chỉ `enabled: true` mới bật.
 */
export interface DuckingSettings {
  /** Bật ducking. Mặc định false (tắt). */
  enabled?: boolean;
  /**
   * id của track audio chứa lời thoại (= sidechain source).
   * Bắt buộc khi enabled=true. Chỉ track kind="audio" mới được tính;
   * trỏ tới track video / track không tồn tại / track trống thì render
   * worker cảnh báo và rơi về mix cũ (không ducking) — xem DUCKING_LIMITS.md.
   */
  voiceTrackId?: string;
  /** Ngưỡng kích hoạt (dB), -60..0, mặc định -20. Render đổi sang linear cho sidechaincompress. */
  thresholdDb?: number;
  /** Tỉ lệ nén 1..20, mặc định 4. */
  ratio?: number;
  /** Attack (ms) 0.1..2000, mặc định 20. */
  attackMs?: number;
  /** Release (ms) 10..9000, mặc định 250. */
  releaseMs?: number;
  /**
   * Mức giảm tối đa (dB), 0..24, mặc định 12. Render map sang `mix` của
   * sidechaincompress (mix = 1 - 10^(-duckAmountDb/20)): đây là MỨC TRẦN
   * xấp xỉ qua dry/wet blend, không phải knee cứng — xem DUCKING_LIMITS.md.
   */
  duckAmountDb?: number;
}

/** Giá trị mặc định của ducking khi field bị bỏ trống (enabled vẫn tắt). */
export const DEFAULT_DUCKING_SETTINGS: Required<
  Omit<DuckingSettings, "enabled" | "voiceTrackId">
> = {
  thresholdDb: -20,
  ratio: 4,
  attackMs: 20,
  releaseMs: 250,
  duckAmountDb: 12,
};

/** true khi ducking được bật rõ ràng (enabled === true). */
export function isDuckingEnabled(d?: DuckingSettings | null): boolean {
  return d?.enabled === true;
}

/** Validate DuckingSettings. Trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateDuckingSettings(v: unknown): string[] {
  if (v === undefined || v === null) return [];
  if (typeof v !== "object" || Array.isArray(v)) return ["ducking phải là object"];
  const d = v as Record<string, unknown>;
  const errs: string[] = [];
  if (d["enabled"] !== undefined && typeof d["enabled"] !== "boolean") {
    errs.push(`ducking.enabled phải là boolean, nhận được: ${JSON.stringify(d["enabled"])}`);
  }
  const vt = d["voiceTrackId"];
  if (vt !== undefined && (typeof vt !== "string" || vt.length === 0)) {
    errs.push(
      `ducking.voiceTrackId phải là chuỗi id track khác rỗng, nhận được: ${JSON.stringify(vt)}`,
    );
  }
  if (d["enabled"] === true && vt === undefined) {
    errs.push("ducking.enabled=true nhưng thiếu voiceTrackId (chưa chọn track giọng)");
  }
  const numIn = (key: string, min: number, max: number) => {
    const val = d[key];
    if (val === undefined) return;
    if (typeof val !== "number" || !Number.isFinite(val) || val < min || val > max) {
      errs.push(
        `ducking.${key} phải là số trong [${min}, ${max}], nhận được: ${JSON.stringify(val)}`,
      );
    }
  };
  numIn("thresholdDb", -60, 0);
  numIn("ratio", 1, 20);
  numIn("attackMs", 0.1, 2000);
  numIn("releaseMs", 10, 9000);
  numIn("duckAmountDb", 0, 24);
  return errs;
}

// ---------------------------------------------------------------------------
// Module augmentation: gắn `ducking?` vào VideoSpec mà KHÔNG sửa index.ts.
// (index.ts thuộc sở hữu của agent chính — khi index.ts chính thức hỗ trợ
// field này thì xóa block này đi. Cùng mẫu với chroma.ts / lut.ts.)
// ---------------------------------------------------------------------------
import "./index.js";

declare module "./index.js" {
  interface VideoSpec {
    /**
     * Audio ducking cấp project — xem DuckingSettings.
     * Không có trường này = tắt, render y hệt cũ.
     */
    ducking?: DuckingSettings;
  }
}
