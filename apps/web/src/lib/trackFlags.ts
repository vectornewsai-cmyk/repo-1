/**
 * Track controls (R1-054): mute / lock / hide.
 *
 * Logic thuần — không phụ thuộc DOM, test được bằng Node.
 * `locked` chỉ có tác dụng ở editor (store.ts chặn các mutation);
 * `muted`/`hidden` được cả preview (preview.tsx) và render worker
 * (server/render/src/render.js) tôn trọng.
 */
import type { Track, TrackKind } from "@repo-1/video-spec";

export type TrackFlag = "muted" | "locked" | "hidden";

/** Bật/tắt 1 flag trên track (immutable — trả về object mới). */
export function toggleTrackFlag(track: Track, flag: TrackFlag): Track {
  return { ...track, [flag]: !track[flag] };
}

/** Đọc 1 flag (undefined → false). */
export function getTrackFlag(
  track: Track | undefined | null,
  flag: TrackFlag,
): boolean {
  return !!track?.[flag];
}

/** Track có đang bị khóa không. */
export function isTrackLocked(track: Track | undefined | null): boolean {
  return getTrackFlag(track, "locked");
}

/** Track có cho phép chỉnh sửa clip không (ngược với locked). */
export function isTrackEditable(track: Track | undefined | null): boolean {
  return !isTrackLocked(track);
}

/**
 * Các flag được hiển thị trên UI cho từng loại track:
 * - audio: mute + lock (hide vô nghĩa với track tiếng)
 * - video: cả 3 (mute tắt luôn audio kế thừa từ file nguồn)
 * - text/sticker/image: lock + hide (không có tiếng để mute)
 */
export function visibleFlagsFor(kind: TrackKind): TrackFlag[] {
  if (kind === "audio") return ["muted", "locked"];
  if (kind === "video") return ["muted", "locked", "hidden"];
  return ["locked", "hidden"];
}
