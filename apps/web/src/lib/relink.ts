/**
 * relink.ts — Phát hiện media thiếu + relink (R1-033, Batch C).
 *
 * Bối cảnh: project `.vcut.json` chỉ lưu `src` (tên file), KHÔNG lưu binary.
 * Khi mở project ở phiên khác / máy khác, media chưa được import → clip trỏ
 * tới `src` không resolve được. Module này:
 *   1. Quét spec, liệt kê asset thiếu (pure, test được bằng Node).
 *   2. Relink: cập nhật `src` của mọi clip dùng asset cũ sang asset mới (pure).
 *
 * Phần UI nằm ở components/RelinkPanel.tsx; store tích hợp ở store.ts.
 */
import type { Clip, TrackKind, VideoSpec } from "@repo-1/video-spec";

/** Loại asset có thể thiếu (text clip không có src nên không bao giờ thiếu). */
export type RelinkableKind = "video" | "audio" | "image" | "sticker";

export interface MissingAsset {
  /** Giá trị `src` trong clip — tên file gốc khi lưu project. */
  src: string;
  kind: RelinkableKind;
  /** Số clip đang dùng asset này. */
  clipCount: number;
  /** Label các track chứa clip dùng asset này (để user nhận diện). */
  trackLabels: string[];
}

/** Clip có src là các kind video/audio/image/sticker. */
function srcOf(c: Clip): { src: string; kind: RelinkableKind } | null {
  const kind = c.kind as TrackKind;
  if (kind === "video" || kind === "audio" || kind === "image" || kind === "sticker") {
    const src = (c as { src?: unknown }).src;
    if (typeof src === "string" && src.length > 0) return { src, kind };
  }
  return null;
}

/**
 * Quét spec, trả về danh sách asset thiếu (src không có trong `mediaNames`).
 * Gộp theo src (1 file dùng ở nhiều clip chỉ liệt kê 1 lần).
 * Pure — không chạm DOM/store.
 */
export function findMissingAssets(spec: VideoSpec, mediaNames: Set<string>): MissingAsset[] {
  const bySrc = new Map<string, MissingAsset>();
  for (const t of spec.tracks ?? []) {
    for (const c of t.clips ?? []) {
      const hit = srcOf(c as Clip);
      if (!hit) continue;
      // blob: URL của phiên cũ đã chết → coi như thiếu luôn
      if (mediaNames.has(hit.src) && !hit.src.startsWith("blob:")) continue;
      let m = bySrc.get(hit.src);
      if (!m) {
        m = { src: hit.src, kind: hit.kind, clipCount: 0, trackLabels: [] };
        bySrc.set(hit.src, m);
      }
      m.clipCount += 1;
      const label = typeof t.label === "string" && t.label.length > 0 ? t.label : t.id;
      if (!m.trackLabels.includes(label)) m.trackLabels.push(label);
    }
  }
  return [...bySrc.values()].sort((a, b) => a.src.localeCompare(b.src));
}

export interface RelinkResult {
  /** Spec mới (không mutate input). */
  spec: VideoSpec;
  /** Số clip đã được cập nhật src. */
  updatedCount: number;
}

/**
 * Relink: mọi clip có `src === oldSrc` → `src = newSrc`.
 * Trả về spec mới (deep clone phần cần thiết), không mutate input.
 * Pure — không chạm DOM/store.
 */
export function relinkAsset(spec: VideoSpec, oldSrc: string, newSrc: string): RelinkResult {
  if (oldSrc === newSrc) return { spec, updatedCount: 0 };
  let updatedCount = 0;
  const tracks = (spec.tracks ?? []).map((t) => ({
    ...t,
    clips: (t.clips ?? []).map((c) => {
      const hit = srcOf(c as Clip);
      if (hit && hit.src === oldSrc) {
        updatedCount += 1;
        return { ...c, src: newSrc };
      }
      return c;
    }),
  }));
  return { spec: { ...spec, tracks }, updatedCount };
}

/** Icon + label tiếng Việt cho từng loại asset (dùng ở UI). */
export const RELINK_KIND_META: Record<RelinkableKind, { icon: string; label: string }> = {
  video: { icon: "🎬", label: "Video" },
  audio: { icon: "🎵", label: "Âm thanh" },
  image: { icon: "🖼️", label: "Ảnh" },
  sticker: { icon: "⭐", label: "Sticker" },
};

/** Accept attribute cho <input type=file> khi relink từng loại. */
export const RELINK_ACCEPT: Record<RelinkableKind, string> = {
  video: "video/*",
  audio: "audio/*",
  image: "image/*",
  sticker: "image/*",
};
