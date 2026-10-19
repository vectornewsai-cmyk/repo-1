/**
 * chroma.ts — Chroma key (xoá phông xanh/lục) cho video-spec.
 *
 * Tính năng signature của CapCut, nhưng triển khai 100% local bằng filter
 * `chromakey` có sẵn của FFmpeg — không cần ML, không cần cloud.
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Mỗi field ở đây tương ứng 1 tham số của `server/render/src/chroma.js`
 * và đã được kiểm chứng bằng MP4 thật (xem CHROMA_LIMITS.md).
 *
 * Tích hợp vào VideoClip bằng module augmentation (không sửa index.ts):
 *   clip.chromaKey = { color: "#00FF00", similarity: 0.3, blend: 0.1 }
 */

/** Cấu hình xoá phông cho một video clip. */
export interface ChromaKey {
  /**
   * Màu phông cần xoá, hex #rrggbb.
   * Chuẩn là xanh lá "#00FF00" (green screen) hoặc xanh dương "#0000FF" (blue screen).
   */
  color: string;
  /**
   * Độ tương đồng màu 0..1 (mặc định 0.3).
   * Càng cao càng xoá rộng — nhưng dễ "ăn" vào vật thể nếu vật thể có màu gần phông.
   */
  similarity?: number;
  /**
   * Độ mềm biên 0..1 (mặc định 0.1).
   * Càng cao biên vật thể càng mượt, nhưng vật thể nhỏ/mảnh có thể bị mờ theo.
   */
  blend?: number;
}

/** Giá trị mặc định khi user chỉ bật mà không chỉnh gì. */
export const CHROMA_DEFAULTS: Required<ChromaKey> = {
  color: "#00FF00",
  similarity: 0.3,
  blend: 0.1,
};

/** Các màu phông gợi ý trong UI. */
export const CHROMA_PRESETS: Array<{ color: string; label: string }> = [
  { color: "#00FF00", label: "Xanh lá (green screen)" },
  { color: "#0000FF", label: "Xanh dương (blue screen)" },
];

function isHexColor(s: unknown): s is string {
  return typeof s === "string" && /^#([0-9a-fA-F]{6})$/.test(s);
}

function isUnitInterval(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1;
}

/** Kiểm tra nhanh một giá trị có phải ChromaKey hợp lệ không. */
export function isChromaKey(v: unknown): v is ChromaKey {
  return validateChromaKey(v).length === 0;
}

/**
 * Validate cấu hình chroma key.
 * @returns mảng thông báo lỗi (rỗng = hợp lệ).
 */
export function validateChromaKey(v: unknown): string[] {
  const errors: string[] = [];
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return ["chromaKey phải là một object { color, similarity?, blend? }"];
  }
  const c = v as Record<string, unknown>;
  if (!isHexColor(c["color"])) {
    errors.push(
      `chromaKey.color phải là hex #rrggbb (vd "#00FF00"), nhận được: ${JSON.stringify(c["color"])}`,
    );
  }
  if (c["similarity"] !== undefined && !isUnitInterval(c["similarity"])) {
    errors.push(
      `chromaKey.similarity phải trong khoảng 0..1, nhận được: ${JSON.stringify(c["similarity"])}`,
    );
  }
  if (c["blend"] !== undefined && !isUnitInterval(c["blend"])) {
    errors.push(
      `chromaKey.blend phải trong khoảng 0..1, nhận được: ${JSON.stringify(c["blend"])}`,
    );
  }
  return errors;
}

/** Điền giá trị mặc định cho các field optional. */
export function normalizeChromaKey(c: ChromaKey): Required<ChromaKey> {
  return {
    color: c.color,
    similarity: c.similarity ?? CHROMA_DEFAULTS.similarity,
    blend: c.blend ?? CHROMA_DEFAULTS.blend,
  };
}

/**
 * "#00FF00" → "0x00FF00" (định dạng màu FFmpeg filter chromakey).
 * @throws nếu không phải hex hợp lệ.
 */
export function chromaColorToFFmpeg(hex: string): string {
  if (!isHexColor(hex)) throw new Error(`màu chroma key không hợp lệ: ${JSON.stringify(hex)}`);
  return "0x" + hex.slice(1).toUpperCase();
}

// ---------------------------------------------------------------------------
// Module augmentation: gắn `chromaKey?` vào VideoClip mà KHÔNG sửa index.ts.
// (index.ts thuộc sở hữu của agent chính — khi index.ts chính thức hỗ trợ
// field này thì xóa block này đi.)
// ---------------------------------------------------------------------------
import "./index";

declare module "./index" {
  interface VideoClip {
    chromaKey?: ChromaKey;
  }
}
