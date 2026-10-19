/**
 * sticker.ts — Định nghĩa sticker overlay cho video-spec.
 *
 * Sticker = ảnh PNG (nền trong suốt) dán lên video tại vị trí/tỉ lệ/độ mờ
 * do người dùng chỉnh, kiểu CapCut.
 *
 * NGUYÊN TẮC (giống index.ts): chỉ đưa vào spec những gì render được THẬT.
 * Render worker triển khai bằng FFmpeg overlay (xem server/render/src/sticker.js).
 *
 * Tích hợp còn thiếu (cho agent chính):
 * - Thêm "sticker" vào union TrackKind trong index.ts
 * - Store/UI: track sticker, panel, preview
 * File này KHÔNG sửa index.ts (theo phân công) — panel UI tự kiểm tra
 * `clip.kind === "sticker"` bằng type guard bên dưới.
 */

/** Clip sticker trên timeline. Thời gian tính bằng GIÂY. */
export interface StickerClip {
  kind: "sticker";
  id: string;
  /** Đường dẫn file PNG (tương đối từ thư mục media của project) */
  src: string;
  /** Vị trí bắt đầu trên timeline (giây) */
  start: number;
  /** Độ dài hiển thị trên timeline (giây) */
  duration: number;
  /** Tâm sticker theo chiều ngang, 0..1 (0.5 = giữa), mặc định 0.5 */
  x?: number;
  /** Tâm sticker theo chiều dọc, 0..1 (0.5 = giữa), mặc định 0.5 */
  y?: number;
  /** Chiều rộng sticker = scale × chiều rộng khung hình, > 0, mặc định 0.25 */
  scale?: number;
  /** 0..1, mặc định 1 */
  opacity?: number;
  /** Góc xoay (độ), mặc định 0 */
  rotation?: number;
}

export interface StickerTrack {
  id: string;
  kind: "sticker";
  label?: string;
  clips: StickerClip[];
}

export const STICKER_DEFAULTS = {
  x: 0.5,
  y: 0.5,
  scale: 0.25,
  opacity: 1,
  rotation: 0,
} as const;

/** Thư viện sticker mẫu đi kèm dự án (tự vẽ 100%, xem assets/stickers/SOURCES.md). */
export const STICKER_LIBRARY = [
  { file: "star.png", label: "Ngôi sao" },
  { file: "heart.png", label: "Trái tim" },
  { file: "arrow-right.png", label: "Mũi tên" },
  { file: "lightning.png", label: "Tia sét" },
  { file: "badge.png", label: "Huy hiệu" },
  { file: "bubble.png", label: "Bong bóng chat" },
] as const;

export type StickerLibraryFile = (typeof STICKER_LIBRARY)[number]["file"];

/** URL phục vụ sticker mẫu trong web app (Vite serve apps/web/public/). */
export function stickerUrl(file: string): string {
  return `/stickers/${file}`;
}

export function isStickerClip(c: unknown): c is StickerClip {
  return (
    typeof c === "object" &&
    c !== null &&
    (c as Record<string, unknown>)["kind"] === "sticker"
  );
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Chuẩn hoá sticker: điền giá trị mặc định cho các trường optional. */
export function normalizeStickerClip(c: StickerClip): Required<StickerClip> {
  return {
    kind: "sticker",
    id: c.id,
    src: c.src,
    start: c.start,
    duration: c.duration,
    x: c.x ?? STICKER_DEFAULTS.x,
    y: c.y ?? STICKER_DEFAULTS.y,
    scale: c.scale ?? STICKER_DEFAULTS.scale,
    opacity: c.opacity ?? STICKER_DEFAULTS.opacity,
    rotation: c.rotation ?? STICKER_DEFAULTS.rotation,
  };
}

/**
 * Validate một sticker clip. Trả về mảng thông báo lỗi (rỗng = hợp lệ).
 * (Không kiểm tra file tồn tại — việc đó thuộc về validateMedia của render worker.)
 */
export function validateStickerClip(c: unknown): string[] {
  const errors: string[] = [];
  if (typeof c !== "object" || c === null) return ["sticker phải là một object"];
  const s = c as Record<string, unknown>;
  const where = `sticker "${String(s["id"] ?? "?")}"`;
  if (s["kind"] !== "sticker") errors.push(`${where}: kind phải là "sticker"`);
  if (typeof s["id"] !== "string" || (s["id"] as string).length === 0)
    errors.push(`${where}: thiếu id`);
  if (typeof s["src"] !== "string" || (s["src"] as string).length === 0)
    errors.push(`${where}: thiếu src (đường dẫn file PNG)`);
  if (!isFiniteNumber(s["start"]) || (s["start"] as number) < 0)
    errors.push(`${where}: start phải là số >= 0`);
  if (!isFiniteNumber(s["duration"]) || (s["duration"] as number) <= 0)
    errors.push(`${where}: duration phải là số > 0`);
  for (const key of ["x", "y"] as const) {
    const v = s[key];
    if (v !== undefined && (!isFiniteNumber(v) || v < 0 || v > 1))
      errors.push(`${where}: ${key} phải trong khoảng 0..1, nhận được: ${String(v)}`);
  }
  if (s["scale"] !== undefined && (!isFiniteNumber(s["scale"]) || (s["scale"] as number) <= 0))
    errors.push(`${where}: scale phải là số > 0, nhận được: ${String(s["scale"])}`);
  if (
    s["opacity"] !== undefined &&
    (!isFiniteNumber(s["opacity"]) || (s["opacity"] as number) < 0 || (s["opacity"] as number) > 1)
  )
    errors.push(`${where}: opacity phải trong khoảng 0..1, nhận được: ${String(s["opacity"])}`);
  if (s["rotation"] !== undefined && !isFiniteNumber(s["rotation"]))
    errors.push(`${where}: rotation phải là số (độ), nhận được: ${String(s["rotation"])}`);
  return errors;
}
