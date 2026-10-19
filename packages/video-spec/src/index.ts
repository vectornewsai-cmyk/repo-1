/**
 * video-spec v0.2.0 — "ngôn ngữ chung" của dự án.
 *
 * Mọi thứ trong editor đều biểu diễn được bằng JSON theo schema này.
 * - apps/web: UI đọc/ghi spec này (project model).
 * - server/render: đọc spec này để render MP4 bằng FFmpeg.
 * - mcp-server (Phase 4): AI agent sinh spec này để tạo video.
 *
 * NGUYÊN TẮC: chỉ đưa vào spec những gì render được THẬT.
 * Thêm field mới = phải implement ở cả preview (web) lẫn render (ffmpeg).
 *
 * ## Versioning (R1-019)
 * Xem ./migrations.ts và ./SCHEMA_VERSIONING.md.
 * - 0.1.0: schema gốc (video/audio/text tracks)
 * - 0.2.0: thêm sticker/image kinds, filter/effects/chroma/keyframes
 */

export const SPEC_VERSION = "0.2.0" as const;

// Schema versioning & migration (R1-019)
export * from "./migrations.js";

// Re-export các module tính năng (Phase 3): transitions, speed, keyframes.
export * from "./transitions.js";
export * from "./speed.js";
export * from "./keyframes.js";
// Phase 3b: chroma key, text animations.
export * from "./chroma.js";
export * from "./textfx.js";
// Phase 3c: LUT filters, video effects, stickers.
export * from "./lut.js";
export * from "./effects.js";
export * from "./sticker.js";
// R1-074/075: chỉnh màu thủ công (color correction/grading).
export * from "./color.js";
// P0-03: image clip (ảnh tĩnh thành media type chính thức).
export * from "./image.js";
// R1-015: audio routing cho video nguồn (inherit/mute/detach).
export * from "./audio.js";
// R1-055: frame-accurate timebase (snap theo frame, timecode).
export * from "./timebase.js";
// Lưu ý: "./transitions" export `Transition` (type mở rộng) — dùng thay cho
// định nghĩa cũ. "./keyframes", "./chroma" và "./lut" gắn `animations?` /
// `chromaKey?` / `filter?` vào VideoClip qua module augmentation.

import type { Transition } from "./transitions.js";
import type { ClipAnimations, KeyframedValue } from "./keyframes.js";
import type { TextAnimation } from "./textfx.js";
import type { VideoFilter } from "./lut.js";
import type { VideoEffect } from "./effects.js";
import type { StickerClip } from "./sticker.js";
import type { ImageClip } from "./image.js";
import type { SourceAudioMode, AudioEffects } from "./audio.js";

export interface VideoMeta {
  /** Tên dự án */
  name: string;
  /** Kích thước khung hình output */
  width: number;
  height: number;
  /** Số frame/giây */
  fps: number;
}

export type TrackKind = "video" | "audio" | "text" | "sticker" | "image";

export interface Track {
  id: string;
  kind: TrackKind;
  /** Tên hiển thị trên timeline */
  label?: string;
  /**
   * Tắt tiếng track (R1-054): audio track bị câm; video track thì audio kế thừa
   * từ file nguồn cũng bị bỏ. Mặc định false.
   */
  muted?: boolean;
  /**
   * Khóa track (R1-054): editor không cho di chuyển/trim/tách/sửa/xóa clip
   * trên track này. Chỉ có tác dụng ở UI, render bỏ qua. Mặc định false.
   */
  locked?: boolean;
  /**
   * Ẩn track (R1-054): track không hiện trong preview và không được render.
   * Chỉ có ý nghĩa với track hình ảnh (video/text/sticker/image). Mặc định false.
   */
  hidden?: boolean;
  clips: Clip[];
}

/** Clip video/ảnh trên timeline. Thời gian tính bằng GIÂY. */
export interface VideoClip {
  kind: "video";
  id: string;
  /** Đường dẫn file nguồn (tương đối từ thư mục media của project) */
  src: string;
  /** Vị trí bắt đầu trên timeline (giây) */
  start: number;
  /** Độ dài hiển thị trên timeline (giây) */
  duration: number;
  /** Điểm cắt vào trong file nguồn (giây) */
  in: number;
  /** Điểm cắt ra trong file nguồn (giây) */
  out: number;
  transitionIn?: Transition;
  transitionOut?: Transition;
  /** 0..1, mặc định 1 */
  opacity?: number;
  /** Tốc độ phát 0.25–4, mặc định 1. duration hiệu dụng = (out - in) / speed */
  speed?: number;
  /** Phát ngược đoạn nguồn (đảo frame), mặc định false */
  reverse?: boolean;
  /** Keyframe animation (x, y, opacity) — xem ClipAnimations */
  animations?: ClipAnimations;
  /** Bộ lọc màu LUT — xem VideoFilter */
  filter?: VideoFilter;
  /** Hiệu ứng video — xem VideoEffect[] */
  effects?: VideoEffect[];
  /**
   * Cách xử lý audio trong file video nguồn — xem SourceAudioMode.
   * "inherit" (mặc định): giữ tiếng gốc; "mute": bỏ tiếng; "detach": chưa hỗ trợ.
   */
  sourceAudioMode?: SourceAudioMode;
  /**
   * Hiệu ứng audio cho tiếng kế thừa (R1-076) — xem AudioEffects.
   * Render worker áp dụng sau aformat, trước volume.
   */
  audioEffects?: AudioEffects;
}

/** Clip audio trên timeline */
export interface AudioClip {
  kind: "audio";
  id: string;
  src: string;
  start: number;
  duration: number;
  in: number;
  out: number;
  /** 0..1, mặc định 1 */
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  /**
   * Keyframe volume (giá trị 0..1, thời gian tính từ ĐẦU CLIP).
   * Khi có, GHI ĐÈ `volume` tĩnh (ngữ nghĩa giống keyframes.ts).
   * R1-063: preview (Web Audio) áp dụng; render worker chưa (validate.js warn).
   */
  volumeKeyframes?: KeyframedValue;
  /** Tốc độ phát 0.25–4, mặc định 1. duration hiệu dụng = (out - in) / speed */
  speed?: number;
  /** Phát ngược đoạn nguồn (đảo mẫu audio), mặc định false */
  reverse?: boolean;
  /**
   * Hiệu ứng audio (R1-076): bass/treble/noise reduction/compressor/reverb.
   * Render worker áp dụng sau aformat, trước volume. Preview áp dụng 1 phần
   * (bass/treble/compressor) qua Web Audio — xem AUDIOFX_LIMITS.md.
   */
  audioEffects?: AudioEffects;
}

/** Clip chữ trên timeline */
export interface TextClip {
  kind: "text";
  id: string;
  text: string;
  start: number;
  duration: number;
  style: TextStyle;
  /** Keyframe animation (x, y, opacity) — xem ClipAnimations */
  animations?: ClipAnimations;
}

export type Clip = VideoClip | AudioClip | TextClip | StickerClip | ImageClip;

// Lưu ý: `Transition` được import từ "./transitions" ở đầu file
// và re-export để các consumer (mcp-server, v.v.) dùng được.
export type { Transition } from "./transitions.js";
// (type mở rộng với 13 loại transition, thay cho "fade" | "none" cũ).

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  /** Hex, ví dụ "#000000" */
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  /** Vị trí tương đối 0..1 (0.5 = giữa) */
  x?: number;
  y?: number;
  /** Phase 1: "none" | "fadeUp" | "typewriter". Phase 3b thêm: fadeIn, slideInLeft, slideInRight, slideUp, bounce */
  animation?: TextAnimation;
}

export interface VideoSpec {
  version: typeof SPEC_VERSION;
  meta: VideoMeta;
  tracks: Track[];
}

/** Kiểm tra nhanh spec có hợp lệ tối thiểu không (validate đầy đủ bằng zod ở render worker). */
export function isVideoSpec(v: unknown): v is VideoSpec {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    s["version"] === SPEC_VERSION &&
    typeof s["meta"] === "object" &&
    Array.isArray(s["tracks"])
  );
}

/** Tính tổng thời lượng project (giây) = clip kết thúc muộn nhất. */
export function projectDuration(spec: VideoSpec): number {
  let max = 0;
  for (const t of spec.tracks) {
    for (const c of t.clips) {
      max = Math.max(max, c.start + c.duration);
    }
  }
  return max;
}
