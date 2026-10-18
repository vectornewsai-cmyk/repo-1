/**
 * video-spec v0.1.0 — "ngôn ngữ chung" của dự án.
 *
 * Mọi thứ trong editor đều biểu diễn được bằng JSON theo schema này.
 * - apps/web: UI đọc/ghi spec này (project model).
 * - server/render: đọc spec này để render MP4 bằng FFmpeg.
 * - mcp-server (Phase 4): AI agent sinh spec này để tạo video.
 *
 * NGUYÊN TẮC: chỉ đưa vào spec những gì render được THẬT.
 * Thêm field mới = phải implement ở cả preview (web) lẫn render (ffmpeg).
 */

export const SPEC_VERSION = "0.1.0" as const;

export interface VideoMeta {
  /** Tên dự án */
  name: string;
  /** Kích thước khung hình output */
  width: number;
  height: number;
  /** Số frame/giây */
  fps: number;
}

export type TrackKind = "video" | "audio" | "text";

export interface Track {
  id: string;
  kind: TrackKind;
  /** Tên hiển thị trên timeline */
  label?: string;
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
}

/** Clip chữ trên timeline */
export interface TextClip {
  kind: "text";
  id: string;
  text: string;
  start: number;
  duration: number;
  style: TextStyle;
}

export type Clip = VideoClip | AudioClip | TextClip;

export interface Transition {
  /** Phase 1 chỉ hỗ trợ: "fade" | "none". Thêm loại mới phải implement ở cả preview + ffmpeg. */
  type: "fade" | "none";
  /** Độ dài transition (giây) */
  duration: number;
}

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
  /** Phase 1 chỉ hỗ trợ: "none" | "fadeUp" | "typewriter" */
  animation?: "none" | "fadeUp" | "typewriter";
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
