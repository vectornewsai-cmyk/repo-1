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
// Phase 7 P3: speed ramp (đường cong tốc độ).
export * from "./speedcurve.js";
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
// Phase 7 P4: mask cho clip video/image.
export * from "./mask.js";
// Phase 8 Q5: motion tracking cho sticker overlay.
export * from "./tracking.js";
// Phase 7 P2: clip enhancement (deinterlace/stabilize/denoise).
export * from "./enhance.js";
// R1-015: audio routing cho video nguồn (inherit/mute/detach).
export * from "./audio.js";
// Phase 9: marker/chapter trên timeline (dữ liệu thuần của editor).
export * from "./markers.js";
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
import type { ClipMask } from "./mask.js";
import type { ClipEnhance } from "./enhance.js";
import type { SourceAudioMode, AudioEffects, FadeCurve } from "./audio.js";
import type { Marker } from "./markers.js";
import type { SpeedCurve } from "./speedcurve.js";

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
   * Phase 7 P3 — Âm lượng tổng của track (0..2, mặc định 1): nhân vào gain
   * của mọi clip audio trên track (và audio kế thừa của clip video).
   * 0 = câm track (tương đương muted nhưng giữ nguyên muted flag).
   */
  volume?: number;
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
  /**
   * Phase 7 P3 — Đường cong tốc độ (speed ramp): khi có, GHI ĐÈ `speed` hằng số.
   * Keyframe t = thời gian output tính từ đầu clip; duration vẫn là thời lượng
   * output, nguồn tiêu thụ = ∫ speed(t) dt. Không dùng chung với reverse.
   */
  speedKeyframes?: SpeedCurve;
  /** Phát ngược đoạn nguồn (đảo frame), mặc định false */
  reverse?: boolean;
  /** Keyframe animation (x, y, opacity) — xem ClipAnimations */
  animations?: ClipAnimations;
  /**
   * Phase 9 D3 — Quỹ đạo motion tracking: TÂM khung hình của clip bám theo
   * vật thể (cùng ngữ nghĩa sticker: tâm unit tại (W*x, H*y) theo thời gian
   * cục bộ t - start). Track thắng keyframes x/y về vị trí nhưng scale/
   * rotation/opacity vẫn áp dụng. Clip dính transition (unit đã merge) thì
   * track bị bỏ qua (validator cảnh báo). Thời gian quỹ đạo gắn với lúc
   * clip xuất hiện, không gắn với thời gian nguồn — trim mép trái sẽ dời
   * gốc thời gian của quỹ đạo theo (xem D3_LIMITS.md).
   */
  track?: import("./tracking.js").TrackAttachment;
  /**
   * Mask che ngoài hình (rect/ellipse + feather) — xem ClipMask.
   * Áp cho clip video; text clip chưa hỗ trợ (validator cảnh báo, bỏ qua).
   */
  mask?: ClipMask;
  /** Bộ lọc màu LUT — xem VideoFilter */
  filter?: VideoFilter;
  /** Hiệu ứng video — xem VideoEffect[] */
  effects?: VideoEffect[];
  /**
   * Enhancement: khử răng cưa / chống rung / khử nhiễu — xem ClipEnhance.
   * Chỉ dùng cho video clip (validator báo lỗi ở track khác).
   */
  enhance?: ClipEnhance;
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
  /** Phase 7 P3 — Đường cong fade (mặc định "linear"). Xem FadeCurve. */
  fadeInCurve?: FadeCurve;
  /** Phase 7 P3 — Đường cong fade (mặc định "linear"). Xem FadeCurve. */
  fadeOutCurve?: FadeCurve;
  /**
   * Keyframe volume (giá trị 0..1, thời gian tính từ ĐẦU CLIP).
   * Khi có, GHI ĐÈ `volume` tĩnh (ngữ nghĩa giống keyframes.ts).
   * Phase 7 P3: render worker đã áp dụng (volume eval=frame), không còn
   * chỉ preview như R1-063.
   */
  volumeKeyframes?: KeyframedValue;
  /** Tốc độ phát 0.25–4, mặc định 1. duration hiệu dụng = (out - in) / speed */
  speed?: number;
  /**
   * Phase 7 P3 — Đường cong tốc độ (speed ramp), giống VideoClip.speedKeyframes.
   * Khi có, GHI ĐÈ `speed` hằng số. Không dùng chung với reverse.
   */
  speedKeyframes?: SpeedCurve;
  /** Phát ngược đoạn nguồn (đảo mẫu audio), mặc định false */
  reverse?: boolean;
  /**
   * Hiệu ứng audio (R1-076): bass/treble/noise reduction/compressor/reverb.
   * Render worker áp dụng sau aformat, trước volume. Preview áp dụng 1 phần
   * (bass/treble/compressor) qua Web Audio — xem AUDIOFX_LIMITS.md.
   */
  audioEffects?: AudioEffects;
}

/**
 * Liên kết phụ đề — Phase 7 P6: câu phụ đề bám theo clip nguồn.
 *
 * Khi có captionOf, editor tự tính lại vị trí timeline của clip chữ từ
 * đoạn media [mediaStart, mediaEnd) của clip nguồn mỗi khi clip nguồn bị
 * trim/move/split/speed-change — phụ đề không còn lệch khỏi tiếng nói.
 * Render worker và preview KHÔNG đọc field này: chúng chỉ vẽ TextClip ở
 * start/duration đã được editor tính sẵn (giống mọi clip chữ khác).
 * CaptionOf trỏ tới clipId không còn tồn tại (clip nguồn đã bị xoá) thì
 * được coi là "mồ côi" — clip chữ đứng yên ở vị trí cuối, không bị xoá.
 */
export interface CaptionLink {
  /** id của clip video/audio nguồn mà câu phụ đề này bám theo */
  clipId: string;
  /** thời gian bắt đầu của câu trong file nguồn (giây, gốc 0 = đầu file) */
  mediaStart: number;
  /** thời gian kết thúc của câu trong file nguồn (giây) */
  mediaEnd: number;
}

/**
 * Một từ trong karaoke — Phase 9 R4.
 * start/end tính theo GIÂY TƯƠNG ĐỐI từ clip.start (timeline local), không
 * phải thời gian media. Render và preview chỉ đọc field này: chúng vẽ
 * TextClip ở start/duration đã được editor tính sẵn, giống captionOf.
 * Khi caption bị refollow (đổi tốc độ clip nguồn), editor scale thời gian
 * từ theo tỉ lệ duration mới/cũ (chính xác khi tốc độ hằng số trên câu,
 * xấp xỉ khi dùng speed curve — xem captionFollow.ts).
 */
export interface KaraokeWord {
  /** từ hiển thị (đã strip khoảng trắng thừa) */
  word: string;
  /** giây từ clip.start tới lúc từ bắt đầu được tô sáng */
  start: number;
  /** giây từ clip.start tới lúc từ hết được tô sáng */
  end: number;
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
  /**
   * Phase 9 D3 — Quỹ đạo motion tracking cho clip chữ: TÂM dòng chữ bám
   * theo vật thể (nội suy tuyến tính, kẹp ngoài khoảng — cùng biểu thức
   * sticker). Áp cho nhánh drawtext và nhánh PNG SR; clip typewriter/
   * karaoke vẽ bằng ASS nên track bị bỏ qua (validator cảnh báo). Track
   * thắng vị trí tĩnh/keyframes x/y nhưng giữ alpha từ animation.
   */
  track?: import("./tracking.js").TrackAttachment;
  /**
   * Liên kết phụ đề (Phase 7 P6, optional). Chỉ caption tạo từ auto-caption
   * mới có field này; chữ gõ tay không có và không bị bám theo clip nào.
   */
  captionOf?: CaptionLink;
  /**
   * Karaoke (Phase 9 R4, optional): danh sách từ kèm thời gian tô sáng.
   * Chỉ caption tạo từ auto-caption (có word timestamps từ Whisper) mới có
   * field này. Render vẽ bằng ASS \k, preview vẽ từng từ đổi màu.
   * Clip có karaoke mà bị split nguồn thì chỉ mảnh nào giữ nguyên duration
   * mới giữ karaoke (mảnh bị cắt dở mất highlight, giữ chữ thường) — xem
   * splitLinkedCaptionsMulti. Clip karaoke bỏ qua keyframes scale/rotation
   * khi render (giống typewriter, ASS không hỗ trợ).
   */
  karaoke?: KaraokeWord[];
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
  /**
   * Màu tô sáng karaoke (Phase 9 R4, hex). Chỉ dùng khi clip có `karaoke`;
   * mặc định "#ffff00" (vàng) nếu không đặt. Preview và render ASS đều đọc.
   */
  highlightColor?: string;
  bold?: boolean;
  italic?: boolean;
  /** Vị trí tương đối 0..1 (0.5 = giữa) */
  x?: number;
  y?: number;
  /** Phase 1: "none" | "fadeUp" | "typewriter". Phase 3b thêm: fadeIn, slideInLeft, slideInRight, slideUp, bounce */
  animation?: TextAnimation;
}

/**
 * Tham chiếu plugin (Batch J — plugin wiring): plugin JS chạy trong sandbox
 * của @repo-1/plugin-api, được render worker nạp khi render. CHỈ khai đúng
 * MỘT trong hai: `id` hoặc `path`.
 */
export interface PluginRef {
  /**
   * Tên plugin đóng gói sẵn trong thư mục `plugins/` của repo:
   * resolve thành `plugins/<id>/plugin.js`. Chỉ gồm chữ thường/số/dấu `-`
   * (validator chặn path traversal).
   */
  id?: string;
  /**
   * Đường dẫn file plugin.js: tuyệt đối, hoặc tương đối so với thư mục
   * chứa file spec.
   */
  path?: string;
  /** Config override cho plugin (JSON thuần, gộp lên defaultConfig). */
  config?: Record<string, unknown>;
}

export interface VideoSpec {
  version: typeof SPEC_VERSION;
  meta: VideoMeta;
  tracks: Track[];
  /**
   * Marker/chapter trên timeline (Phase 9, optional — xem markers.ts).
   * Dữ liệu thuần của editor: lưu cùng project JSON, tự động survive
   * save/load. Render worker hiện BỎ QUA field này (không export chapter
   * ra file, không vẽ lên video) — xem MARKERS_LIMITS.md.
   * Không có field này (project cũ) = không có marker, hoàn toàn hợp lệ.
   */
  markers?: Marker[];
  /**
   * Plugin áp dụng khi render (tùy chọn). Không có trường này = hành vi
   * render cũ 100%. Render worker nạp plugin qua PluginRegistry:
   * onClipRender chèn filter vào từng video clip (sau effects, trước
   * opacity), onProjectValidate thêm lỗi/cảnh báo, onExportStart/
   * onExportFinish chạy quanh lần render. Xem docs/PLUGINS.md.
   */
  plugins?: PluginRef[];
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
