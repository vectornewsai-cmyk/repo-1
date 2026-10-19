/**
 * effects.ts — Video effects cho video-spec (Phase 3c).
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Mỗi type trong union này tương ứng 1 filter NATIVE của FFmpeg trong
 * `server/render/src/effects.js` và đã được kiểm chứng bằng MP4 thật.
 *
 * ⚠️ MIRROR: validate.js của render worker có bản mirror bằng JS thuần —
 * thêm type mới ở đây thì PHẢI cập nhật cả validate.js và effects.js.
 */

/** Tất cả video effect types hợp lệ. */
export const EFFECT_TYPES = [
  "blur",
  "sharpen",
  "grayscale",
  "sepia",
  "vignette",
  "noise",
  "brightness",
] as const;

export type VideoEffectType = (typeof EFFECT_TYPES)[number];

/** Metadata hiển thị cho UI (tiếng Việt). */
export const EFFECT_META: Record<
  VideoEffectType,
  { label: string; description: string }
> = {
  blur: { label: "Làm mờ", description: "Mờ toàn khung hình (phông nền mộng mơ)" },
  sharpen: { label: "Sắc nét", description: "Tăng độ nét chi tiết" },
  grayscale: { label: "Đen trắng", description: "Chuyển về thang xám cổ điển" },
  sepia: { label: "Nâu cổ điển", description: "Tông nâu vàng hoài cổ" },
  vignette: { label: "Tối góc", description: "Tối dần 4 góc, nổi bật trung tâm" },
  noise: { label: "Nhiễu hạt", description: "Hạt nhiễu kiểu phim cũ" },
  brightness: { label: "Sáng / tối", description: "Tăng giảm độ sáng (0.5 = giữ nguyên)" },
};

/** Cường độ mặc định khi không chỉ định (0..1). */
export const EFFECT_DEFAULT_INTENSITY = 0.5;

/**
 * Một video effect áp lên clip.
 * intensity 0..1 — ý nghĩa cụ thể tùy effect (xem EFFECT_META + effects.js).
 * Riêng "brightness": 0.5 = giữ nguyên, < 0.5 tối đi, > 0.5 sáng lên.
 */
export interface VideoEffect {
  type: VideoEffectType;
  /** 0..1, mặc định 0.5 */
  intensity?: number;
}

/** Kiểm tra một giá trị có phải VideoEffectType hợp lệ không. */
export function isVideoEffectType(v: unknown): v is VideoEffectType {
  return (
    typeof v === "string" &&
    (EFFECT_TYPES as readonly string[]).includes(v)
  );
}

/** Validate một VideoEffect, trả về danh sách lỗi (rỗng = hợp lệ). */
export function validateVideoEffect(v: unknown): string[] {
  const errors: string[] = [];
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return ["effect phải là một object { type, intensity? }"];
  }
  const e = v as Record<string, unknown>;
  if (!isVideoEffectType(e["type"])) {
    errors.push(`effect.type không hỗ trợ: ${JSON.stringify(e["type"])}`);
  }
  if (e["intensity"] !== undefined) {
    const it = e["intensity"];
    if (typeof it !== "number" || !Number.isFinite(it) || it < 0 || it > 1) {
      errors.push(`effect.intensity phải là số trong [0, 1], nhận được: ${JSON.stringify(it)}`);
    }
  }
  return errors;
}

/** Validate mảng effects của một clip. */
export function validateVideoEffects(v: unknown): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return ["effects phải là một mảng"];
  const errors: string[] = [];
  const seen = new Set<string>();
  v.forEach((e, i) => {
    for (const m of validateVideoEffect(e)) errors.push(`effects[${i}]: ${m}`);
    const t = (e as { type?: unknown })?.type;
    if (typeof t === "string") {
      if (seen.has(t)) errors.push(`effects[${i}]: trùng effect "${t}" — mỗi loại chỉ dùng 1 lần`);
      seen.add(t);
    }
  });
  return errors;
}

// ---------------------------------------------------------------------------
// `effects?` được khai báo qua module augmentation (không sửa index.ts trực tiếp).
// ---------------------------------------------------------------------------
import "./index";

declare module "./index" {
  interface VideoClip {
    /** Danh sách video effects áp theo thứ tự (từ đầu đến cuối). */
    effects?: VideoEffect[];
  }
}
