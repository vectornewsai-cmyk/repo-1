/**
 * audio.ts — Audio routing cho video-spec.
 *
 * Định nghĩa cách xử lý audio stream bên trong file video nguồn:
 * - "inherit": giữ tiếng gốc của video (mặc định) — render sẽ trích audio
 *   từ video source, áp cùng trim/speed/reverse rồi mix vào output.
 * - "mute": bỏ qua audio của video (video câm).
 * - "detach": (chưa hỗ trợ) tách audio thành clip riêng để chỉnh độc lập.
 */

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
}

/** true nếu có ít nhất 1 effect đang bật. */
export function hasAudioEffects(fx?: AudioEffects | null): boolean {
  if (!fx) return false;
  return (
    Math.abs(fx.bass ?? 0) > 1e-9 ||
    Math.abs(fx.treble ?? 0) > 1e-9 ||
    (fx.noiseReduction ?? 0) > 1e-9 ||
    fx.compressor !== undefined ||
    (fx.reverb ?? 0) > 1e-9
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
