/**
 * multiselect.ts — Logic thuần cho multi-select clip (R1-052, Batch E).
 *
 * Tách riêng khỏi store.ts để test được bằng Node (không cần browser/DOM).
 * Mọi hàm đều pure: không mutate input, trả về spec mới.
 */
import type { Clip, Track, VideoSpec } from "@repo-1/video-spec";

/** Một mục chọn: clip nào trên track nào (clipId duy nhất toàn cục nhưng giữ trackId cho tiện). */
export interface Selection {
  trackId: string;
  clipId: string;
}

const key = (s: Selection): string => `${s.trackId}:${s.clipId}`;

/** Loại trùng, giữ thứ tự xuất hiện đầu tiên. */
export function dedupeSelections(sels: Selection[]): Selection[] {
  const seen = new Set<string>();
  const out: Selection[] = [];
  for (const s of sels) {
    const k = key(s);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}

/** Bật/tắt một mục trong selection (Ctrl/Cmd+click). */
export function toggleSelection(sels: Selection[], sel: Selection): Selection[] {
  const k = key(sel);
  if (sels.some((s) => key(s) === k)) {
    return sels.filter((s) => key(s) !== k);
  }
  return [...sels, sel];
}

/** Mục chọn đầu tiên — dùng cho các thao tác chỉ hiểu single-select (split, preview highlight). */
export function primarySelection(sels: Selection[]): Selection | null {
  return sels.length > 0 ? sels[0] : null;
}

export interface DeletedGroup {
  trackId: string;
  clips: Clip[];
}

function sortClipsOf(track: Track): Track {
  return { ...track, clips: [...track.clips].sort((a, b) => a.start - b.start) };
}

/**
 * Xoá mọi clip trong selection. Trả về spec mới + nhóm clip đã xoá
 * (để `restoreClips` hoàn tác 1 cấp — stopgap cho tới khi R1-051 undo/redo xong).
 */
export function deleteClips(
  spec: VideoSpec,
  sels: Selection[],
): { spec: VideoSpec; deleted: DeletedGroup[] } {
  const byTrack = new Map<string, Set<string>>();
  for (const s of sels) {
    let set = byTrack.get(s.trackId);
    if (!set) {
      set = new Set<string>();
      byTrack.set(s.trackId, set);
    }
    set.add(s.clipId);
  }
  const deleted: DeletedGroup[] = [];
  const tracks = spec.tracks.map((t) => {
    const ids = byTrack.get(t.id);
    if (!ids || ids.size === 0) return t;
    if (t.locked) return t; // R1-054: track khóa — không xóa clip
    const gone = t.clips.filter((c) => ids.has(c.id));
    if (gone.length > 0) deleted.push({ trackId: t.id, clips: gone });
    return sortClipsOf({ ...t, clips: t.clips.filter((c) => !ids.has(c.id)) });
  });
  return { spec: { ...spec, tracks }, deleted };
}

/** Hoàn tác 1 cấp của `deleteClips`: đưa clip về đúng track/vị trí cũ. */
export function restoreClips(spec: VideoSpec, deleted: DeletedGroup[]): VideoSpec {
  const byTrack = new Map<string, Clip[]>();
  for (const g of deleted) byTrack.set(g.trackId, g.clips);
  const tracks = spec.tracks.map((t) => {
    const back = byTrack.get(t.id);
    if (!back || back.length === 0) return t;
    return sortClipsOf({ ...t, clips: [...t.clips, ...back] });
  });
  return { ...spec, tracks };
}

export interface MoveItem {
  trackId: string;
  clipId: string;
  /** Vị trí start lúc BẮT ĐẦU kéo (không phải vị trí hiện tại) — tránh trôi số. */
  origStart: number;
}

/** Kiểm tra đoạn [start, start+dur) có chồng clip nào ngoài `ignoreIds` không. */
function overlapsOthers(track: Track, ignoreIds: Set<string>, start: number, dur: number): boolean {
  return track.clips.some(
    (c) => !ignoreIds.has(c.id) && start < c.start + c.duration && start + dur > c.start,
  );
}

/**
 * Di chuyển nhiều clip cùng một delta, giữ offset tương đối.
 * Mỗi clip được kiểm tra overlap độc lập: clip nào bị chặn thì đứng yên,
 * các clip còn lại vẫn di chuyển (không rollback toàn bộ).
 * `snap` (tuỳ chọn): làm tròn vị trí mới (vd. snap về frame — R1-056).
 */
export function moveClipsBy(
  spec: VideoSpec,
  items: MoveItem[],
  dxSec: number,
  snap?: (t: number) => number,
): VideoSpec {
  if (items.length === 0 || dxSec === 0) return spec;
  const byTrack = new Map<string, MoveItem[]>();
  for (const it of items) {
    let arr = byTrack.get(it.trackId);
    if (!arr) {
      arr = [];
      byTrack.set(it.trackId, arr);
    }
    arr.push(it);
  }
  const tracks = spec.tracks.map((t) => {
    const movers = byTrack.get(t.id);
    if (!movers || movers.length === 0) return t;
    if (t.locked) return t; // R1-054: track khóa — không di chuyển clip
    const movingIds = new Set(movers.map((m) => m.clipId));
    const targets = new Map<string, number>();
    for (const m of movers) {
      const clip = t.clips.find((c) => c.id === m.clipId);
      if (!clip) continue;
      const raw = Math.max(0, m.origStart + dxSec);
      const start = snap ? snap(raw) : raw;
      if (!overlapsOthers(t, movingIds, start, clip.duration)) {
        targets.set(m.clipId, start);
      }
      // bị chặn -> giữ nguyên (không set target)
    }
    if (targets.size === 0) return t;
    return sortClipsOf({
      ...t,
      clips: t.clips.map((c) => {
        const ns = targets.get(c.id);
        return ns === undefined ? c : ({ ...c, start: ns } as Clip);
      }),
    });
  });
  return { ...spec, tracks };
}
