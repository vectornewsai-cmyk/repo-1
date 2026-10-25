/**
 * K5: kiểm tra thả media từ MediaBin vào một lane timeline.
 *
 * Trước K5, Timeline.onDrop gọi thẳng addMediaToTrack và store im lặng
 * bỏ qua khi track khóa / sai loại / chồng clip — user không biết vì sao
 * clip không xuất hiện. Hàm này mirror đúng luật của store (R1-054 khóa,
 * mediaKindForTrack, R1-055 snap về frame) để Timeline báo lý do bằng toast.
 *
 * R6: lý do trả về đã qua i18n (import i18n/index — module này đọc
 * localStorage trong try/catch nên vẫn chạy được dưới node khi react
 * resolve được; lý do hiển thị theo ngôn ngữ hiện tại lúc gọi).
 */

import { t as i18nT } from "../i18n";

export interface DropTrack {
  kind: string;
  locked?: boolean;
  clips: Array<{ start: number; duration: number }>;
}

export interface DropMedia {
  kind: string;
  duration: number;
}

export type DropCheck = { ok: true } | { ok: false; reason: string };

/** Nhãn hiển thị cho loại media/track (qua i18n, dùng trong thông báo). */
function kindLabel(kind: string): string {
  switch (kind) {
    case "video": return i18nT("drop.kindVideo");
    case "image": return i18nT("drop.kindImage");
    case "audio": return i18nT("drop.kindAudio");
    case "text": return i18nT("drop.kindText");
    default: return kind;
  }
}

/** Loại media được phép trên từng loại track — mirror mediaKindForTrack. */
function allowedKinds(trackKind: string): string[] {
  if (trackKind === "video") return ["video", "image"];
  if (trackKind === "audio") return ["audio"];
  if (trackKind === "image") return ["image"];
  return [];
}

/** Độ dài clip sẽ tạo — mirror store (ảnh mặc định 3s, xem IMAGE_CLIP_DEFAULT). */
export function dropClipDuration(item: DropMedia): number {
  return item.kind === "image" ? 3 : Math.max(0.5, item.duration || 5);
}

/** Snap thời gian về frame — mirror R1-055 (snapToFrame, làm tròn xuống). */
export function snapDropTime(at: number, fps: number): number {
  if (!Number.isFinite(fps) || fps <= 0) return Math.max(0, at);
  return Math.max(0, Math.floor(at * fps) / fps);
}

export function validateDrop(
  track: DropTrack,
  item: DropMedia,
  at: number,
  fps: number,
): DropCheck {
  if (track.locked) {
    return { ok: false, reason: i18nT("drop.locked") };
  }
  const allowed = allowedKinds(track.kind);
  if (!allowed.includes(item.kind)) {
    const mediaLabel = kindLabel(item.kind);
    const trackLabel = kindLabel(track.kind);
    return {
      ok: false,
      reason: i18nT("drop.wrongKind", { media: mediaLabel, track: trackLabel }),
    };
  }
  const start = snapDropTime(at, fps);
  const dur = dropClipDuration(item);
  const overlap = track.clips.some(
    (c) => start < c.start + c.duration && start + dur > c.start,
  );
  if (overlap) {
    return { ok: false, reason: i18nT("drop.overlap") };
  }
  return { ok: true };
}
