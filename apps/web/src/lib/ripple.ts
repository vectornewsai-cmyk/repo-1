/**
 * ripple.ts — Ripple delete/trim (R1-054, Batch E).
 *
 * Pure functions, không chạm DOM — test được bằng Node.
 *
 * Ngữ nghĩa (theo CapCut/Premiere):
 * - Ripple delete: xóa clip → mọi clip đứng SAU nó trên cùng track
 *   dồn về trước đúng bằng độ dài clip bị xóa. Gap tương đối giữa các
 *   clip còn lại được giữ nguyên. Track khác không bị ảnh hưởng.
 * - Ripple trim (mép phải): đổi duration của clip → các clip sau
 *   dồn/đẩy theo đúng delta (rút ngắn = dồn, dài ra = đẩy).
 */
import type { Clip, Track, VideoSpec } from "@repo-1/video-spec";

const EPS = 1e-9;

export interface RippleShift {
  clipId: string;
  oldStart: number;
  newStart: number;
}

/** Sắp xếp clip theo start (copy, không mutate). */
function sortedClips(clips: Clip[]): Clip[] {
  return [...clips].sort((a, b) => a.start - b.start);
}

/**
 * Dịch mọi clip có start >= `fromTime` trên track đi `delta` giây.
 * (delta âm = dồn về trước, delta dương = đẩy ra sau.)
 * Trả về track mới (clips đã sắp xếp) + danh sách clip bị dịch.
 */
export function shiftClipsAfter(
  track: Track,
  fromTime: number,
  delta: number,
): { track: Track; shifted: RippleShift[] } {
  if (Math.abs(delta) < EPS) return { track, shifted: [] };
  const shifted: RippleShift[] = [];
  const clips = track.clips.map((c) => {
    if (c.start + EPS >= fromTime) {
      const newStart = Math.max(0, c.start + delta);
      shifted.push({ clipId: c.id, oldStart: c.start, newStart });
      return { ...c, start: newStart };
    }
    return c;
  });
  return { track: { ...track, clips: sortedClips(clips) }, shifted };
}

export interface RippleDeleteResult {
  spec: VideoSpec;
  /** Clip đã bị xóa. */
  removed: Clip;
  /** Các clip bị dồn về trước. */
  shifted: RippleShift[];
  /** Khoảng gap đã đóng (giây) = duration của clip bị xóa. */
  closedGap: number;
}

/**
 * Ripple delete: xóa clip khỏi track, dồn các clip sau lên trước.
 * Trả về null nếu không tìm thấy track/clip.
 */
export function rippleDelete(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
): RippleDeleteResult | null {
  const track = spec.tracks.find((t) => t.id === trackId);
  if (!track) return null;
  if (track.locked) return null; // R1-054: track khóa — không ripple delete
  const clip = track.clips.find((c) => c.id === clipId);
  if (!clip) return null;

  const end = clip.start + clip.duration;
  const rest = track.clips.filter((c) => c.id !== clipId);
  const { track: shiftedTrack, shifted } = shiftClipsAfter(
    { ...track, clips: rest },
    end,
    -clip.duration,
  );
  return {
    spec: {
      ...spec,
      tracks: spec.tracks.map((t) => (t.id === trackId ? shiftedTrack : t)),
    },
    removed: clip,
    shifted,
    closedGap: clip.duration,
  };
}

export interface RippleTrimResult {
  spec: VideoSpec;
  /** Clip sau khi đổi duration (đã áp patch của caller). */
  clip: Clip;
  /** Các clip bị dồn/đẩy. */
  shifted: RippleShift[];
  /** Delta duration (giây). Âm = rút ngắn (dồn), dương = dài ra (đẩy). */
  delta: number;
}

/**
 * Ripple trim mép phải: caller đã tính `patchedClip` (duration mới, kèm
 * in/out đã chỉnh theo speed qua trimRightTo). Hàm này thay clip cũ bằng
 * patchedClip rồi dồn/đẩy các clip sau theo delta duration.
 * Trả về null nếu không tìm thấy track/clip.
 */
export function rippleTrimRight(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
  patchedClip: Clip,
): RippleTrimResult | null {
  const track = spec.tracks.find((t) => t.id === trackId);
  if (!track) return null;
  if (track.locked) return null; // R1-054: track khóa — không ripple trim
  const clip = track.clips.find((c) => c.id === clipId);
  if (!clip) return null;

  const delta = patchedClip.duration - clip.duration;
  const oldEnd = clip.start + clip.duration;
  const withPatch = track.clips.map((c) => (c.id === clipId ? patchedClip : c));
  const { track: shiftedTrack, shifted } = shiftClipsAfter(
    { ...track, clips: withPatch },
    oldEnd,
    delta,
  );
  return {
    spec: {
      ...spec,
      tracks: spec.tracks.map((t) => (t.id === trackId ? shiftedTrack : t)),
    },
    clip: patchedClip,
    shifted,
    delta,
  };
}
