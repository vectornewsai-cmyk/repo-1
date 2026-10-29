/**
 * nestUtils.ts — Logic thuần cho nested clip (compound clip) + adjustment layer.
 *
 * PHẠM VI: TẦNG UI ONLY (luồng N4, Phase 9). File này KHÔNG sửa video-spec,
 * KHÔNG đụng render.js, KHÔNG đụng preview.tsx.
 *
 * Nested clip: dùng THẲNG type NestedClip của spec (luồng N1, xem
 * packages/video-spec/src/nested.ts) — bản ghi UI tạo ra đã đúng spec:
 * subSpec rebase về 0, không đặt trim/speed (mặc định = phát toàn bộ subSpec
 * tốc độ 1) nên duration luôn khớp nestedDuration() và validateNestedClip()
 * phải trả rỗng. Việc preview/render hiểu nested clip thuộc luồng khác
 * (xem NESTED_UI_LIMITS.md).
 *
 * Adjustment layer legacy (trước R7): khi đó spec chưa có type nên layer
 * là bản ghi UI riêng (kind "adjustment") lưu trong track.clips bằng cast
 * — cùng pattern `as unknown as` mà EffectPanel dùng cho `effects`.
 * R7 (Phase 9 round 7): spec ĐÃ có `VideoSpec.adjustmentLayers` nên panel
 * từ nay ghi layer mới vào đó (xem §R7 ở cuối file); bản ghi kind
 * "adjustment" chỉ còn là legacy — vẫn đọc/hiển thị được và chuyển sang
 * chuẩn được bằng converter, không tạo mới nữa. Preview hiện tại bỏ qua
 * kind lạ (if-chain + continue) và projectDuration tính generic theo
 * start/duration nên không crash; việc áp layer trong preview/render thuộc
 * luồng khác.
 *
 * Ngữ nghĩa:
 * - Nested clip: gom >= 2 clip đang chọn thành 1 clip duy nhất trên timeline.
 *   Các clip gốc được giữ nguyên trong `subSpec` (rebase về 0: clip.start
 *   trừ đi start của nested clip). Rã (unnest) khôi phục clip gốc về đúng
 *   track cũ (theo track id trong subSpec), cộng lại offset của nested clip.
 * - Adjustment layer: 1 "clip" effect (filter đã có trong repo — EFFECT_TYPES
 *   của effects.ts, đã có filter FFmpeg native thật) áp cho mọi clip bên
 *   dưới trong khoảng [start, start+duration). Layer KHÔNG nằm chung hàng
 *   với clip thường: Timeline vẽ nó trên hàng FX riêng phía trên các track,
 *   nên overlap chỉ xét giữa các layer với nhau, không xét với clip thường.
 *   Layer được lưu trên track video đầu tiên (host track) chỉ để có chỗ chứa
 *   trong spec — Timeline lọc nó ra khỏi lane thường.
 */
import type { AdjustmentLayer, Clip, ComposedLeafWindow, NestedClip, SpeedCurve, SpeedKeyframe, Track, VideoSpec } from "@repo-1/video-spec";
import {
  composeNestedLeafWindow,
  nestedEffectiveSpeed,
  nestedEffectiveTrim,
  nestedSourceDuration,
  outputDurationForSource,
  sliceSpeedKeyframes,
  sourcePosAt,
  speedAt,
  splitSourceAt,
  splitSpeedKeyframes,
  trimSpeedKeyframes,
  visibleSpeedKeyframes,
} from "@repo-1/video-spec";
import { isVideoEffectType } from "../../../../../packages/video-spec/src/effects.js";

/** Clip compound = type NestedClip của spec (luồng N1). */
export type { NestedClip };

/** Layer hiệu ứng áp cho mọi clip bên dưới trong khoảng thời gian của nó. */
export interface AdjustmentLayerRecord {
  kind: "adjustment";
  id: string;
  start: number;
  duration: number;
  /** Effect type hợp lệ trong repo (EFFECT_TYPES — xem effects.ts). */
  filterType: string;
  /** Cường độ 0..1 (cùng ngữ nghĩa intensity của VideoEffect). */
  intensity: number;
}

/**
 * Guard boolean (KHÔNG dùng type predicate cho "adjustment"): kind đó chưa
 * có trong Clip union của video-spec nên predicate sẽ thu hẹp Clip thành
 * `never` và mọi truy cập field sau đó lỗi tsc. Với "nested" (đã có trong
 * union từ luồng N1) thì code vẫn có thể dùng `clip.kind === "nested"` để
 * thu hẹp trực tiếp; các guard ở đây giữ thống nhất cho cả hai kind và
 * dùng kèm asNestedClip/asAdjustmentLayer để lấy bản ghi đã cast.
 */
export function isNestedClip(c: unknown): boolean {
  return (
    !!c &&
    typeof c === "object" &&
    (c as { kind?: unknown }).kind === "nested" &&
    typeof (c as { id?: unknown }).id === "string" &&
    (c as { subSpec?: unknown }).subSpec !== undefined
  );
}

export function isAdjustmentLayer(c: unknown): boolean {
  return (
    !!c &&
    typeof c === "object" &&
    (c as { kind?: unknown }).kind === "adjustment" &&
    typeof (c as { id?: unknown }).id === "string" &&
    typeof (c as { filterType?: unknown }).filterType === "string"
  );
}

/** Cast có kiểm tra: trả về bản ghi nested hoặc null. */
export function asNestedClip(c: unknown): NestedClip | null {
  return isNestedClip(c) ? (c as NestedClip) : null;
}

/** Cast có kiểm tra: trả về bản ghi adjustment layer hoặc null. */
export function asAdjustmentLayer(c: unknown): AdjustmentLayerRecord | null {
  return isAdjustmentLayer(c) ? (c as AdjustmentLayerRecord) : null;
}

export interface NestSelection {
  trackId: string;
  clipId: string;
}

type IdGen = () => string;

function trackOf(spec: VideoSpec, trackId: string): Track | undefined {
  return spec.tracks.find((t) => t.id === trackId);
}

function clipOf(track: Track, clipId: string): Clip | undefined {
  return track.clips.find((c) => c.id === clipId);
}

function overlapsAt(start: number, dur: number, otherStart: number, otherDur: number): boolean {
  return start < otherStart + otherDur && start + dur > otherStart;
}

function sortTrackClips(track: Track): Track {
  return { ...track, clips: [...track.clips].sort((a, b) => a.start - b.start) };
}

/**
 * Gom các clip đang chọn thành 1 nested clip.
 * - Cần >= 2 clip (compound clip 1 clip là vô nghĩa, giống CapCut).
 * - Từ chối clip đã là nested/adjustment (không nest lồng nhau ở tầng UI).
 * - Từ chối track khóa.
 * Trả về spec mới + nested clip + track chứa nó, hoặc { error }.
 */
export function nestClips(
  spec: VideoSpec,
  selections: NestSelection[],
  idGen: IdGen,
  name: string,
): { spec: VideoSpec; nested: NestedClip; nestedTrackId: string } | { error: string } {
  const seen = new Set<string>();
  const resolved: { track: Track; clip: Clip }[] = [];
  for (const s of selections) {
    const key = `${s.trackId}:${s.clipId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const track = trackOf(spec, s.trackId);
    if (!track) return { error: `Không tìm thấy track ${s.trackId}.` };
    if (track.locked) return { error: `Track "${track.label ?? track.kind}" đang khóa.` };
    const clip = clipOf(track, s.clipId);
    if (!clip) return { error: `Không tìm thấy clip ${s.clipId}.` };
    if (isNestedClip(clip) || isAdjustmentLayer(clip)) {
      return { error: "Không gộp clip đã là nested clip hoặc adjustment layer." };
    }
    resolved.push({ track, clip });
  }
  if (resolved.length < 2) {
    return { error: "Cần chọn ít nhất 2 clip để gộp thành compound clip." };
  }

  const nestedStart = Math.min(...resolved.map((r) => r.clip.start));
  const nestedEnd = Math.max(...resolved.map((r) => r.clip.start + r.clip.duration));
  // Track chứa nested clip = track của clip bắt đầu sớm nhất (ổn định, dễ đoán).
  const hostTrack = [...resolved].sort((a, b) => a.clip.start - b.clip.start)[0].track;

  // Sub-spec: giữ đúng track gốc (id + kind + label), clip rebase về 0.
  const subTracks: Track[] = [];
  for (const t of spec.tracks) {
    const mine = resolved.filter((r) => r.track.id === t.id);
    if (mine.length === 0) continue;
    subTracks.push({
      ...t,
      clips: mine
        .map((r) => ({ ...r.clip, start: r.clip.start - nestedStart }))
        .sort((a, b) => a.start - b.start),
    });
  }
  const subSpec: VideoSpec = {
    version: spec.version,
    meta: { ...spec.meta, name },
    tracks: subTracks,
  };

  const nested: NestedClip = {
    kind: "nested",
    id: idGen(),
    name,
    start: nestedStart,
    duration: nestedEnd - nestedStart,
    subSpec,
  };

  const removedIds = new Set(resolved.map((r) => r.clip.id));
  const tracks = spec.tracks.map((t) => {
    const kept = t.clips.filter((c) => !removedIds.has(c.id));
    if (t.id === hostTrack.id) {
      // NestedClip đã nằm trong Clip union (luồng N1) nên không cần cast.
      return sortTrackClips({ ...t, clips: [...kept, nested] });
    }
    return kept.length === t.clips.length ? t : { ...t, clips: kept };
  });

  return { spec: { ...spec, tracks }, nested, nestedTrackId: hostTrack.id };
}

/**
 * Rã 1 nested clip: khôi phục clip gốc về track cũ (theo track id trong
 * subSpec), cộng lại offset của nested clip. Track gốc đã bị xóa thì tạo
 * lại track cùng kind/label. Clip id bị trùng (do user đã duplicate...) thì
 * cấp id mới. Từ chối nếu clip khôi phục đè lên clip khác trên track đích
 * (giữ bất biến "không chồng clip" của store).
 */
export function unnestClip(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
  idGen: IdGen,
): { spec: VideoSpec; restoredCount: number } | { error: string } {
  const host = trackOf(spec, trackId);
  if (!host) return { error: `Không tìm thấy track ${trackId}.` };
  if (host.locked) return { error: `Track "${host.label ?? host.kind}" đang khóa.` };
  const found = clipOf(host, clipId);
  const nested = found ? asNestedClip(found) : null;
  if (!nested) {
    return { error: "Clip này không phải nested clip." };
  }

  const takenIds = new Set<string>();
  for (const t of spec.tracks) for (const c of t.clips) takenIds.add(c.id);

  // Tính trước toàn bộ clip khôi phục + track đích để kiểm tra overlap.
  interface Restored {
    targetTrackId: string;
    targetKind: string;
    targetLabel?: string;
    clip: Clip;
  }
  const restored: Restored[] = [];
  for (const st of nested.subSpec.tracks) {
    for (const sc of st.clips) {
      let clip: Clip = { ...sc, start: sc.start + nested.start };
      if (takenIds.has(clip.id)) clip = { ...clip, id: idGen() };
      takenIds.add(clip.id);
      restored.push({
        targetTrackId: st.id,
        targetKind: st.kind,
        targetLabel: st.label,
        clip,
      });
    }
  }
  for (const r of restored) {
    const target = trackOf(spec, r.targetTrackId);
    if (!target) continue; // track mới tạo thì không có gì để đè
    for (const c of target.clips) {
      if (c.id === clipId) continue; // chính nested clip sắp bị gỡ
      if (overlapsAt(r.clip.start, r.clip.duration, c.start, c.duration)) {
        return {
          error: `Không rã được: clip khôi phục "${r.clip.id}" đè lên clip khác trên track đích.`,
        };
      }
    }
  }

  const byTrack = new Map<string, Clip[]>();
  for (const r of restored) {
    const list = byTrack.get(r.targetTrackId) ?? [];
    list.push(r.clip);
    byTrack.set(r.targetTrackId, list);
  }

  const tracks: Track[] = [];
  for (const t of spec.tracks) {
    if (t.id === trackId) {
      const kept = t.clips.filter((c) => c.id !== clipId);
      const extra = byTrack.get(t.id) ?? [];
      tracks.push(sortTrackClips({ ...t, clips: [...kept, ...extra] }));
      byTrack.delete(t.id);
    } else if (byTrack.has(t.id)) {
      tracks.push(sortTrackClips({ ...t, clips: [...t.clips, ...byTrack.get(t.id)!] }));
      byTrack.delete(t.id);
    } else {
      tracks.push(t);
    }
  }
  // Track đích không còn tồn tại → tạo lại (id gốc nếu còn trống).
  for (const [tid, clips] of byTrack) {
    const sample = restored.find((r) => r.targetTrackId === tid)!;
    const idFree = !spec.tracks.some((t) => t.id === tid);
    tracks.push({
      id: idFree ? tid : idGen(),
      kind: sample.targetKind as Track["kind"],
      label: sample.targetLabel,
      clips: [...clips].sort((a, b) => a.start - b.start),
    });
  }

  return { spec: { ...spec, tracks }, restoredCount: restored.length };
}

/**
 * Thêm 1 adjustment layer. Layer lưu trên track video đầu tiên (host) nhưng
 * Timeline vẽ nó trên hàng FX riêng — xem header file. Từ chối khi: không
 * có track video, thời gian không hợp lệ, hoặc đè lên layer khác.
 */
export function addAdjustmentLayer(
  spec: VideoSpec,
  filterType: string,
  intensity: number,
  start: number,
  duration: number,
  idGen: IdGen,
): { spec: VideoSpec; layer: AdjustmentLayerRecord; hostTrackId: string } | { error: string } {
  if (!filterType) return { error: "Chưa chọn filter." };
  if (!Number.isFinite(start) || start < 0) return { error: "Start phải >= 0." };
  if (!Number.isFinite(duration) || duration < 0.2) {
    return { error: "Duration phải >= 0.2s." };
  }
  if (!Number.isFinite(intensity) || intensity < 0 || intensity > 1) {
    return { error: "Intensity phải trong khoảng 0..1." };
  }
  const host = spec.tracks.find((t) => t.kind === "video");
  if (!host) return { error: "Cần ít nhất 1 track video để chứa adjustment layer." };
  if (host.locked) return { error: `Track "${host.label ?? host.kind}" đang khóa.` };
  for (const t of spec.tracks) {
    for (const c of t.clips) {
      if (isAdjustmentLayer(c) && overlapsAt(start, duration, c.start, c.duration)) {
        return { error: "Adjustment layer mới đè lên layer khác." };
      }
    }
  }
  const layer: AdjustmentLayerRecord = {
    kind: "adjustment",
    id: idGen(),
    start,
    duration,
    filterType,
    intensity: Math.round(intensity * 100) / 100,
  };
  const tracks = spec.tracks.map((t) =>
    t.id === host.id
      ? sortTrackClips({ ...t, clips: [...t.clips, layer as unknown as Clip] })
      : t,
  );
  return { spec: { ...spec, tracks }, layer, hostTrackId: host.id };
}

/** Xoá 1 adjustment layer (không ripple — chỉ gỡ layer, clip thường giữ nguyên). */
export function deleteAdjustmentLayer(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
): VideoSpec | null {
  const track = trackOf(spec, trackId);
  if (!track) return null;
  const clip = clipOf(track, clipId);
  if (!clip || !isAdjustmentLayer(clip)) return null;
  return {
    ...spec,
    tracks: spec.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t,
    ),
  };
}

/**
 * R5 — Tương tác layer trên hàng FX + sửa clip con (logic thuần, có test).
 *
 * - move/trim/updateAdjustmentLayer: layer CHỈ đè nhau mới bị chặn; layer
 *   được phép đè clip thường (đó là bản chất của adjustment layer) nên
 *   KHÔNG dùng moveSelectionBy/trimClip generic của store (chúng chặn đè
 *   clip thường). Kéo trên hàng FX của Timeline gọi các hàm này qua
 *   store action riêng, mỗi lần kéo tính đích TUYỆT ĐỐI từ snapshot lúc
 *   bắt đầu kéo nên gọi lặp không cộng dồn.
 * - trimAdjustmentLayer nhận target TUYỆT ĐỐI: mép trái = start mới muốn
 *   có, mép phải = end mới muốn có. Không hợp lệ → { error }, Timeline
 *   bỏ qua bước kéo đó (không sửa nửa vời).
 * - updateNestedInnerClip: sửa clip con BÊN TRONG compound clip mà không
 *   cần rã ra. Chỉ đổi vị trí/độ dài ĐẶT trong compound clip và (với clip
 *   chữ) nội dung text; in/out nguồn giữ nguyên — khác với trim clip
 *   thường (trim video thường dịch in/out). Ràng buộc: start >= 0,
 *   duration >= 0.2, end <= duration của nested clip ngoài (giữ bất biến
 *   "clip con nằm trong compound clip"), không đè clip khác cùng track
 *   con, host track không khóa.
 */
function findLayerOnTrack(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
): { track: Track; layer: AdjustmentLayerRecord } | null {
  const track = trackOf(spec, trackId);
  if (!track) return null;
  const found = track.clips.find((c) => c.id === clipId);
  const layer = found ? asAdjustmentLayer(found) : null;
  return layer ? { track, layer } : null;
}

function layerOverlapsOther(
  spec: VideoSpec,
  selfId: string,
  start: number,
  duration: number,
): boolean {
  for (const t of spec.tracks) {
    for (const c of t.clips) {
      if (c.id === selfId || !isAdjustmentLayer(c)) continue;
      if (overlapsAt(start, duration, c.start, c.duration)) return true;
    }
  }
  return false;
}

function replaceLayer(
  spec: VideoSpec,
  trackId: string,
  layer: AdjustmentLayerRecord,
): VideoSpec {
  return {
    ...spec,
    tracks: spec.tracks.map((t) =>
      t.id === trackId
        ? { ...t, clips: t.clips.map((c) => (c.id === layer.id ? (layer as unknown as Clip) : c)) }
        : t,
    ),
  };
}

/** Dời adjustment layer tới start mới (giữ nguyên duration). */
export function moveAdjustmentLayer(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
  newStart: number,
): { spec: VideoSpec; layer: AdjustmentLayerRecord } | { error: string } {
  const found = findLayerOnTrack(spec, trackId, clipId);
  if (!found) return { error: `Không tìm thấy adjustment layer ${clipId}.` };
  if (found.track.locked) return { error: `Track "${found.track.label ?? found.track.kind}" đang khóa.` };
  if (!Number.isFinite(newStart) || newStart < 0) return { error: "Start của layer phải >= 0." };
  if (layerOverlapsOther(spec, clipId, newStart, found.layer.duration)) {
    return { error: "Layer mới đè lên layer khác." };
  }
  const layer = { ...found.layer, start: Math.round(newStart * 100) / 100 };
  return { spec: replaceLayer(spec, trackId, layer), layer };
}

/**
 * Trim adjustment layer theo đích tuyệt đối: edge "left" → target là start
 * mới; edge "right" → target là end mới. Duration tối thiểu 0.2s.
 */
export function trimAdjustmentLayer(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
  edge: "left" | "right",
  target: number,
): { spec: VideoSpec; layer: AdjustmentLayerRecord } | { error: string } {
  const found = findLayerOnTrack(spec, trackId, clipId);
  if (!found) return { error: `Không tìm thấy adjustment layer ${clipId}.` };
  if (found.track.locked) return { error: `Track "${found.track.label ?? found.track.kind}" đang khóa.` };
  if (!Number.isFinite(target)) return { error: "Đích trim không hợp lệ." };
  const oldEnd = found.layer.start + found.layer.duration;
  const newStart = edge === "left" ? target : found.layer.start;
  const newDuration = edge === "left" ? oldEnd - target : target - found.layer.start;
  if (newStart < 0) return { error: "Start của layer phải >= 0." };
  if (newDuration < 0.2) return { error: "Duration của layer phải >= 0.2s." };
  if (layerOverlapsOther(spec, clipId, newStart, newDuration)) {
    return { error: "Layer sau trim đè lên layer khác." };
  }
  const layer = {
    ...found.layer,
    start: Math.round(newStart * 100) / 100,
    duration: Math.round(newDuration * 100) / 100,
  };
  return { spec: replaceLayer(spec, trackId, layer), layer };
}

/** Đặt lại start + duration của layer trong một lần (panel sửa layer). */
export function updateAdjustmentLayer(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
  start: number,
  duration: number,
): { spec: VideoSpec; layer: AdjustmentLayerRecord } | { error: string } {
  const found = findLayerOnTrack(spec, trackId, clipId);
  if (!found) return { error: `Không tìm thấy adjustment layer ${clipId}.` };
  if (found.track.locked) return { error: `Track "${found.track.label ?? found.track.kind}" đang khóa.` };
  if (!Number.isFinite(start) || start < 0) return { error: "Start của layer phải >= 0." };
  if (!Number.isFinite(duration) || duration < 0.2) return { error: "Duration của layer phải >= 0.2s." };
  if (layerOverlapsOther(spec, clipId, start, duration)) {
    return { error: "Layer mới đè lên layer khác." };
  }
  const layer = {
    ...found.layer,
    start: Math.round(start * 100) / 100,
    duration: Math.round(duration * 100) / 100,
  };
  return { spec: replaceLayer(spec, trackId, layer), layer };
}

/** Patch cho 1 clip con trong subSpec (field nào vắng thì giữ nguyên). */
export interface NestedInnerPatch {
  start?: number;
  duration?: number;
  /** Chỉ áp dụng khi clip con là kind "text", clip khác → error. */
  text?: string;
}

/** Sửa 1 clip con trong compound clip (không cần rã ra — xem header R5). */
export function updateNestedInnerClip(
  spec: VideoSpec,
  hostTrackId: string,
  nestedId: string,
  innerTrackId: string,
  innerClipId: string,
  patch: NestedInnerPatch,
): { spec: VideoSpec; nested: NestedClip; curveDropped?: number } | { error: string } {
  const host = trackOf(spec, hostTrackId);
  if (!host) return { error: `Không tìm thấy track ${hostTrackId}.` };
  if (host.locked) return { error: `Track "${host.label ?? host.kind}" đang khóa.` };
  const found = clipOf(host, nestedId);
  const nested = found ? asNestedClip(found) : null;
  if (!nested) return { error: "Clip này không phải nested clip." };
  const innerTrack = nested.subSpec.tracks.find((t) => t.id === innerTrackId);
  if (!innerTrack) return { error: `Không tìm thấy track con ${innerTrackId}.` };
  const inner = innerTrack.clips.find((c) => c.id === innerClipId);
  if (!inner) return { error: `Không tìm thấy clip con ${innerClipId}.` };
  if (patch.text !== undefined && inner.kind !== "text") {
    return { error: "Chỉ clip chữ mới sửa được nội dung text." };
  }
  const newStart = patch.start ?? inner.start;
  const newDuration = patch.duration ?? inner.duration;
  if (!Number.isFinite(newStart) || newStart < 0) return { error: "Start của clip con phải >= 0." };
  if (!Number.isFinite(newDuration) || newDuration < 0.2) {
    return { error: "Duration của clip con phải >= 0.2s." };
  }
  if (newStart + newDuration > nested.duration + 1e-9) {
    return { error: "Clip con vượt ngoài compound clip." };
  }
  for (const other of innerTrack.clips) {
    if (other.id === innerClipId) continue;
    if (overlapsAt(newStart, newDuration, other.start, other.duration)) {
      return { error: "Clip con mới đè lên clip khác trong compound clip." };
    }
  }
  // Phase 9 đợt 19 G2: guard nguồn của cha DỜI TỪ store (đợt 18) XUỐNG
  // HÀM THUẦN này, để caller gọi trực tiếp cũng bị chặn (trước đây
  // guard chỉ ở store action nên đường thuần vẫn bypass được — xem
  // LIMITS đợt 18 §3 và test G1 cũ của store.nestedGuard). Ngữ nghĩa
  // copy đúng guard của hàm deep đợt 17 N3 (cha ở đây là nested ngoài
  // cùng vì R5 chỉ sửa clip con trực tiếp); guard ở store action đợt
  // 18 vẫn giữ nguyên (cùng vị ngữ, chạy trước — dư thừa nhưng vô hại,
  // không xóa để tránh đụng hành vi store đã kiểm chứng). Tính từ giá
  // trị patch CHƯA làm tròn (giống store): patch chỉ đổi text thì
  // newEnd bằng end cũ nên luôn qua, trừ khi cha vốn đã invalid (trim
  // .out vượt nguồn từ trước — cùng giới hạn như hàm deep, cách gỡ là
  // sửa trim/duration của cha trước). Độ dài nguồn = clip kết thúc muộn
  // nhất trên MỌI track của subSpec cha.
  {
    const guardNewEnd = newStart + newDuration;
    let guardOldSource = 0;
    let guardNewSource = 0;
    for (const t of nested.subSpec.tracks) {
      for (const c of t.clips) {
        guardOldSource = Math.max(guardOldSource, c.start + c.duration);
        guardNewSource = Math.max(
          guardNewSource,
          t.id === innerTrackId && c.id === innerClipId ? guardNewEnd : c.start + c.duration,
        );
      }
    }
    if (nested.trim !== undefined) {
      if (nested.trim.out > guardNewSource + 1e-9) {
        return {
          error:
            "Clip con thu ngắn làm độ dài nguồn của compound clip cha co lại dưới trim.out của cha — trim cha trước rồi sửa lại.",
        };
      }
    } else if (Math.abs(guardNewSource - guardOldSource) > 1e-9) {
      return {
        error:
          "Clip con làm đổi độ dài nguồn của compound clip cha (cha không ghi trim nên duration cha bằng đúng độ dài nguồn) — sửa duration/trim của cha trước rồi sửa lại lá.",
      };
    }
  }
  // Phase 9 đợt 14 R5: clip con có speed curve mà patch đổi hình học
  // theo kiểu trim thì curve phải đi theo — nếu không sau patch sẽ còn
  // keyframe mồ côi ngoài duration mới. Phân biệt trim với dời thuần:
  // dời thuần (cả hai mép dịch cùng một lượng, sai số 1e-9) thì curve
  // theo thời gian output của clip không đổi nên giữ nguyên; trim một
  // mép hoặc đổi cả hai mép không đều thì dịch/cắt bằng
  // trimSpeedKeyframes (shift = dịch mép trái, duration mới). Chỉ áp
  // cho video/audio; reverse + curve đã bị validator cấm nên không xử
  // lý riêng. curveDropped trả về để caller biết có điểm bị cắt —
  // từ đợt 15 T6 store chuyển tiếp số này và NestedClipPanel hiển
  // thị cảnh báo cho user (nợ LIMITS đợt 14 đã đóng).
  let innerCurveDropped = 0;
  let innerCurveTouched = false;
  let innerCurveNext: SpeedCurve | undefined;
  const innerCurve = leafCurveOf(inner);
  const oldEnd = inner.start + inner.duration;
  const newEnd = newStart + newDuration;
  const dxStart = newStart - inner.start;
  const dxEnd = newEnd - oldEnd;
  if (
    innerCurve && innerCurve.keyframes.length > 0 &&
    (inner.kind === "video" || inner.kind === "audio") &&
    (Math.abs(dxStart) > 1e-9 || Math.abs(dxEnd) > 1e-9) &&
    Math.abs(dxStart - dxEnd) > 1e-9
  ) {
    const adj = trimSpeedKeyframes(innerCurve.keyframes, dxStart, newDuration);
    innerCurveTouched = true;
    innerCurveDropped = adj.dropped;
    innerCurveNext = adj.keyframes.length > 0 ? { keyframes: adj.keyframes } : undefined;
  }
  const updatedRec: Record<string, unknown> = {
    ...inner,
    start: Math.round(newStart * 100) / 100,
    duration: Math.round(newDuration * 100) / 100,
    ...(patch.text !== undefined ? { text: patch.text } : {}),
  };
  if (innerCurveTouched) {
    if (innerCurveNext) updatedRec["speedKeyframes"] = innerCurveNext;
    else delete updatedRec["speedKeyframes"];
  }
  const updated: Clip = updatedRec as unknown as Clip;
  const newNested: NestedClip = {
    ...nested,
    subSpec: {
      ...nested.subSpec,
      tracks: nested.subSpec.tracks.map((t) =>
        t.id === innerTrackId
          ? { ...t, clips: t.clips.map((c) => (c.id === innerClipId ? updated : c)) }
          : t,
      ),
    },
  };
  const tracks = spec.tracks.map((t) =>
    t.id === hostTrackId
      ? { ...t, clips: t.clips.map((c) => (c.id === nestedId ? newNested : c)) }
      : t,
  );
  return { spec: { ...spec, tracks }, nested: newNested, curveDropped: innerCurveDropped };
}

/** Kết quả curve khả kiến của clip lá dưới cửa sổ trim ngoài. */
export interface LeafVisibleSpeedCurve {
  /** Curve của phần khả kiến, đã rebase về 0. */
  keyframes: SpeedKeyframe[];
  /** Độ dài phần khả kiến (thời gian output của lá). */
  visibleDuration: number;
  /** Điểm bắt đầu phần khả kiến trong thời gian output của lá. */
  visibleStart: number;
  /** Số keyframe gốc ngoài phần khả kiến. */
  dropped: number;
}

/** Đọc speedKeyframes duck-typed (NestedClip/clip lá đều có thể mang field này). */
function leafCurveOf(leaf: Clip): SpeedCurve | undefined {
  return (leaf as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
}

/**
 * Curve khả kiến của clip lá dưới một cửa sổ [winIn, winOut) cho trước
 * (thời gian của project chứa lá) — Phase 9 đợt 14 R5.
 *
 * Lá không có curve → null; lá bị cửa sổ cắt hết → null (giống flatten
 * bỏ lá có giao rỗng). Phần giao được cắt bằng sliceSpeedKeyframes nên
 * mọi keyframe kết quả đều nằm trong [0, visibleDuration] và đánh giá
 * đúng hệt như curve gốc trên đoạn đó (linear/ease-in/ease-out nhờ
 * bezier nâng bậc từ đợt 16 H3, bezier nhờ de Casteljau trừ đoạn con
 * suy biến fallback về bezier gốc — xem speedcurve.ts).
 */
export function leafVisibleSpeedCurveForWindow(
  leaf: Clip,
  winIn: number,
  winOut: number,
): LeafVisibleSpeedCurve | null {
  const curve = leafCurveOf(leaf);
  if (!curve || curve.keyframes.length === 0) return null;
  const vis = visibleSpeedKeyframes(curve.keyframes, leaf.start, leaf.duration, winIn, winOut);
  if (!vis) return null;
  return {
    keyframes: vis.keyframes,
    visibleDuration: vis.visibleDuration,
    visibleStart: vis.visibleStart,
    dropped: vis.dropped,
  };
}

/**
 * Curve khả kiến của clip lá TRỰC TIẾP trong một nested clip
 * (Phase 9 đợt 14 R5 — GIỮ NGUYÊN hợp đồng, xem ghi chú đợt 15 T3).
 *
 * Cửa sổ = trim hiệu dụng của nested clip. Tốc độ của nested clip ngoài
 * chỉ co/giãn vị trí đặt lá trên timeline ngoài, không đổi hình dạng
 * đường cong theo thời gian output của lá nên không xuất hiện ở đây.
 *
 * GHI CHÚ TƯƠNG THÍCH NGƯỢC (đợt 15 T3): hàm này CỐ TÌNH không đi qua
 * composeNestedLeafWindow, vì hợp đồng R5 của nó là hàm thuần theo
 * trim — nó KHÔNG yêu cầu lá phải nằm trong subSpec của nested (test
 * R5 dùng subSpec rỗng vẫn phải ra kết quả). Helper đệ quy mới
 * (deepNestedLeafVisibleSpeedCurve) thì khớp chain/lá theo id trong cây
 * và throw khi không khớp; ép hàm cũ qua đường đó sẽ phá hợp đồng R5
 * nên hai đường được giữ song song: 1 tầng thuần-trim ở đây, đệ quy
 * khớp-cây ở deepNestedLeafVisibleSpeedCurve.
 */
export function nestedLeafVisibleSpeedCurve(
  nested: NestedClip,
  leaf: Clip,
): LeafVisibleSpeedCurve | null {
  const trim = nestedEffectiveTrim(nested);
  return leafVisibleSpeedCurveForWindow(leaf, trim.in, trim.out);
}

// ---- Đợt 15 T3: nested sâu hơn 1 cấp (hợp cửa sổ đệ quy) ----

/**
 * Kết quả đầy đủ cho 1 clip lá ở cấp sâu trong nested clip ngoài cùng:
 * cửa sổ đã hợp qua mọi tầng + curve khả kiến + in/out hiệu dụng.
 *
 * - `window`: kết quả của composeNestedLeafWindow (vị trí/duration tuyệt
 *   đối khớp flattenNested, cửa sổ tính từ đầu lá).
 * - `curve`: curve khả kiến đã rebase về 0 (null khi lá không có curve;
 *   lá bị cắt hết thì cả hàm trả null, không phải curve null).
 * - `effectiveIn`/`effectiveOut`: điểm vào/ra HIỆU DỤNG trong file nguồn
 *   cho đúng phần khả kiến (chỉ video/audio có in/out; clip chữ không có
 *   2 field này). Cách map theo loại lá:
 *   - có speedKeyframes (không reverse): in + ∫speed trên [0, visibleStart)
 *     và [0, visibleEnd) — tức rampTrimLeftIn/rampTrimRightOut của R5;
 *   - tốc độ hằng (không reverse): in + visibleStart × speed,
 *     in + visibleEnd × speed;
 *   - reverse + tốc độ hằng: đoạn nguồn đảo chiều, out − visibleEnd × speed
 *     tới out − visibleStart × speed;
 *   - reverse + speedKeyframes: validator cấm tổ hợp này nên KHÔNG đoán —
 *     2 field vắng (caller không được dùng in/out cũ cho trường hợp này).
 *   Chú ý: đây là map "phần khả kiến", không phải edit phá hủy — trim
 *   ngoài vẫn chỉ là cửa sổ, thu hẹp rồi mở lại không mất keyframe.
 */
export interface DeepLeafMedia {
  window: ComposedLeafWindow;
  curve: LeafVisibleSpeedCurve | null;
  effectiveIn?: number;
  effectiveOut?: number;
}

/** Đọc in/out/speed/reverse duck-typed của clip video/audio (text → null). */
function leafSourceFields(leaf: Clip): {
  in: number;
  out: number;
  speed: number;
  reverse: boolean;
} | null {
  if (leaf.kind !== "video" && leaf.kind !== "audio") return null;
  const rec = leaf as unknown as Record<string, unknown>;
  const srcIn = rec["in"];
  const srcOut = rec["out"];
  if (typeof srcIn !== "number" || !Number.isFinite(srcIn)) return null;
  if (typeof srcOut !== "number" || !Number.isFinite(srcOut)) return null;
  const speed = rec["speed"];
  return {
    in: srcIn,
    out: srcOut,
    speed: typeof speed === "number" && Number.isFinite(speed) ? speed : 1,
    reverse: rec["reverse"] === true,
  };
}

/**
 * Map một thời điểm output của lá (tính từ đầu lá) sang vị trí nguồn.
 * Trả undefined cho clip chữ và cho tổ hợp reverse + speedKeyframes
 * (validator cấm, không đoán — xem DeepLeafMedia). Dùng cho điểm cắt
 * đơn (split): một điểm map ra một điểm, không có chuyện đảo đầu/cuối.
 */
function leafSourceTimeAt(leaf: Clip, outputTime: number): number | undefined {
  const fields = leafSourceFields(leaf);
  if (!fields) return undefined;
  const curve = leafCurveOf(leaf);
  if (curve && curve.keyframes.length > 0) {
    if (fields.reverse) return undefined;
    return fields.in + sourcePosAt(curve, outputTime);
  }
  if (fields.reverse) return fields.out - outputTime * fields.speed;
  return fields.in + outputTime * fields.speed;
}

/**
 * Map cửa sổ khả kiến [visibleStart, visibleEnd) của lá sang đoạn nguồn
 * [in, out) — KHÁC map điểm đơn ở chỗ reverse làm đảo đầu/cuối: đoạn
 * nguồn của reverse là [out − visibleEnd × speed, out − visibleStart ×
 * speed] (đầu đoạn ứng với cuối cửa sổ). Trả {} cho clip chữ và cho
 * tổ hợp reverse + speedKeyframes (validator cấm, không đoán).
 */
function leafSourceRange(
  leaf: Clip,
  visibleStart: number,
  visibleEnd: number,
): { in?: number; out?: number } {
  const fields = leafSourceFields(leaf);
  if (!fields) return {};
  const curve = leafCurveOf(leaf);
  if (curve && curve.keyframes.length > 0) {
    if (fields.reverse) return {};
    return {
      in: fields.in + sourcePosAt(curve, visibleStart),
      out: fields.in + sourcePosAt(curve, visibleEnd),
    };
  }
  if (fields.reverse) {
    return {
      in: fields.out - visibleEnd * fields.speed,
      out: fields.out - visibleStart * fields.speed,
    };
  }
  return {
    in: fields.in + visibleStart * fields.speed,
    out: fields.in + visibleEnd * fields.speed,
  };
}

/**
 * Clip lá ở cấp sâu bất kỳ trong nested clip ngoài cùng: hợp cửa sổ
 * đệ quy qua `chain` (từ con trực tiếp của `top` xuống nested chứa trực
 * tiếp lá), rồi trả curve khả kiến + in/out hiệu dụng cho phần khả kiến.
 * Lá bị trim ngoài cắt hết ở tầng nào → null (giống flatten bỏ lá).
 * Chain/depth/vòng lặp/depth throw theo composeNestedLeafWindow.
 */
export function deepNestedLeafVisibleSpeedCurve(
  top: NestedClip,
  chain: NestedClip[],
  leaf: Clip,
): DeepLeafMedia | null {
  const window = composeNestedLeafWindow(top, chain, leaf);
  if (!window) return null;
  const curve = leafVisibleSpeedCurveForWindow(
    leaf,
    leaf.start + window.visibleStart,
    leaf.start + window.visibleEnd,
  );
  const range = leafSourceRange(leaf, window.visibleStart, window.visibleEnd);
  return {
    window,
    curve,
    ...(range.in !== undefined ? { effectiveIn: range.in } : {}),
    ...(range.out !== undefined ? { effectiveOut: range.out } : {}),
  };
}

/**
 * Điểm cắt qua biên nested: một mốc thời gian trong khung timeline ngoài
 * của `top` (cùng khung với ComposedLeafWindow.absoluteStart, tức đã gồm
 * top.start) được map xuống thời gian output của clip lá ở cấp sâu và
 * tiếp xuống vị trí nguồn của lá đó.
 *
 * Trả null khi: lá bị cắt hết, hoặc mốc cắt nằm ngoài phần khả kiến của
 * lá (split qua biên nested nhưng không rơi vào lá này — caller thử lá
 * khác). `leafLocalTime` luôn nằm trong [visibleStart, visibleEnd];
 * `sourceTime` vắng cho clip chữ và reverse + speedKeyframes (xem
 * DeepLeafMedia). Mốc cắt đúng bằng biên lá vẫn map được (về đầu/cuối
 * phần khả kiến) — caller quyết định nửa nào nhận điểm biên.
 */
export interface NestedSplitPoint {
  /** Thời gian output của lá tại điểm cắt (tính từ đầu lá). */
  leafLocalTime: number;
  /** Vị trí nguồn tương ứng (vắng cho clip chữ / reverse + curve). */
  sourceTime?: number;
  /** Cửa sổ đã hợp của lá (để caller đối chiếu với flattenNested). */
  window: ComposedLeafWindow;
}

export function nestedSplitOffset(
  top: NestedClip,
  chain: NestedClip[],
  leaf: Clip,
  splitTimeTop: number,
): NestedSplitPoint | null {
  const window = composeNestedLeafWindow(top, chain, leaf);
  if (!window) return null;
  if (
    !Number.isFinite(splitTimeTop) ||
    splitTimeTop < window.absoluteStart ||
    splitTimeTop > window.absoluteStart + window.absoluteDuration
  ) {
    return null;
  }
  // mapK = tỉ lệ thời gian ngoài / thời gian output của lá.
  const mapK = window.absoluteDuration / (window.visibleEnd - window.visibleStart);
  const leafLocalTime =
    window.visibleStart + (splitTimeTop - window.absoluteStart) / mapK;
  const sourceTime = leafSourceTimeAt(leaf, leafLocalTime);
  return {
    leafLocalTime,
    ...(sourceTime !== undefined ? { sourceTime } : {}),
    window,
  };
}

// ---- Đợt 16 H2: split/trim thật cho nested clip ngoài cùng (nối vào store) ----
//
// ĐỢT 15 T3 CHỈ LÀM TẦNG THUẦN (composeNestedLeafWindow / nestedSplitOffset)
// MÀ CHƯA NỐI VÀO store.ts: splitClipAt trả null cho kind "nested" (không
// tách được), còn trimClip đi đường generic {start, duration} nên trim
// không hề dời cửa sổ trim của nested — duration đổi mà trim giữ nguyên,
// phá bất biến duration = (trim.out − trim.in) / speed và làm cửa sổ lá sâu
// tính ra sai. Hai hàm thuần dưới đây sửa đúng chỗ đó và store.ts gọi
// thẳng chúng (splitClipAt / trimClip / patchClip — xem store.ts).
//
// NGỮ NGHĨA (cố tình chỉ đụng trim của tầng NGOÀI CÙNG):
// - Split/trim một nested clip KHÔNG viết lại clip lá bên trong: lá giữ
//   nguyên, chỉ cửa sổ trim ngoài thay đổi. Đó chính là ngữ nghĩa "cửa
//   sổ, không phải edit phá hủy" của R5/T3 — cửa sổ lá sâu sau edit được
//   SUY RA bằng composeNestedLeafWindow / deepNestedLeafVisibleSpeedCurve,
//   không cần (và không được) ghi đè lên lá. Test đợt này khóa đúng điều
//   đó: sau split/trim qua store, cửa sổ lá 2–3 cấp tính bằng helper đệ
//   quy phải khớp số tính tay và khớp flattenNested.
// - splitNestedClip giữ nguyên subSpec (cùng tham chiếu), hai nửa chia
//   nhau cửa sổ trim tại điểm cắt; cả hai nửa giữ nguyên name.
// - trimNestedClip không tự ý mở rộng quá nguồn: mép trái không vượt
//   trim.in = 0 (đầu nguồn), mép phải không vượt nestedSourceDuration.
//   Vượt → null (store giữ nguyên clip, không sửa nửa vời).
// - Cả hai hàm đều KHÔNG áp margin 0.05s của splitClipAt: margin là quy
//   ước của store (tránh tách sát mép), hàm thuần chỉ từ chối điểm cắt
//   đúng ngoài clip. Store vẫn giữ margin như cũ cho mọi kind.
//
// ---- Đợt 20 R2: split/trim nested mang speedKeyframes qua ánh xạ τ ----
//
// Đóng nợ đợt 19 G2 §1a/§3: splitNestedClip/trimNestedClip từng trả null
// cho mọi nested có curve vì phép tách/trim dùng ánh xạ tuyến tính theo
// speed hằng. Từ đợt này hai hàm đi đường curve riêng (xem
// splitNestedWithCurve / trimNestedWithCurve), chỉ giữ đường tuyến tính
// cũ cho nested KHÔNG có curve:
// - τ (spec đợt 18 §0): vị trí con tại thời gian output t là
//   u(t) = in + ∫₀ᵗ s = in + sourcePosAt(curve, t). Điểm cắt split tại
//   thời gian output leftDur đổi sang thời gian con bằng chính u(leftDur)
//   (tích phân THUẬN, không phải đảo tích phân — "τ" ở đây là ánh xạ
//   output→con của spec, đảo của nó là outputDurationForSource, chỉ dùng
//   ở chế độ trim-cố-định của G2, không dùng ở đây).
// - Curve của mỗi nửa/đoạn sau cắt = sliceSpeedKeyframes trên đoạn output
//   tương ứng, rebase về 0 (đánh giá đúng hệt curve gốc trên đoạn đó:
//   linear/ease nhờ bezier nâng bậc đợt 16 H3, bezier nhờ de Casteljau,
//   trừ đoạn con suy biến fallback về bezier gốc — xem speedcurve.ts).
//   KHÔNG dùng trimSpeedKeyframes ở đây: hàm đó chỉ dịch/cắt điểm mà
//   không chèn điểm biên nội suy, nên trim phải của ramp linear 1→2 về
//   2s sẽ mất đoạn dốc và ∫ của curve còn lại (2) lệch trim.out mới
//   (2.5) tới 0.5s — phá bất biến render §1.3.
// - Bất biến sau mọi phép: trim.out = in + ∫₀ᴰ curve mới trong 1e-4s
//   (dung sai render §1.3). Split/trim xây trim.out từ ∫ của curve đã
//   cắt nên bất biến giữ theo cấu tạo, không phải kiểm tra hậu kỳ
//   (ngoại trừ clip gốc đã ghi trim tường minh mà lệch tích phân > 1e-4s
//   thì split/trim từ chối ngay — không đoán chế độ sửa nào đúng, giống
//   render fail fast §1.3; clip gốc không ghi trim thì cửa sổ hiệu dụng
//   là [in, in + ∫) theo §1.3 câu cuối, KHÔNG phải nestedSourceDuration
//   (đó là mặc định của tốc độ hằng).
// - Mở rộng (trim ra ngoài duration gốc): curve không có định nghĩa
//   ngoài [0, D] nên dùng đúng quy ước kẹp biên đã có của speedcurve:
//   tốc độ ngoài biên kẹp về giá trị biên (speedAt clamp, cùng quy ước
//   rampTrimLeftIn dùng cho clip ramp thường khi shift < 0). Mở rộng
//   trái thêm đoạn hằng s(0), mở rộng phải thêm đoạn hằng s(D); hai
//   đoạn mở rộng chỉ đúng hệt khi mọi keyframe gốc nằm trong [0, D]
//   (luật validator) nên đường mở rộng từ chối keyframe ngoài khoảng.
// - Vẫn fail-fast (trả null) khi: reverse (render cấm hoàn toàn, spec
//   §1.4 — có hay không có curve cũng vậy); curve có field nhưng rỗng/
//   không hợp lệ (không tính được tích phân hữu hạn); nửa sau cắt rỗng
//   (slice rỗng); trim mới vượt nguồn (mép phải: trim.out mới >
//   nestedSourceDuration; mép trái mở rộng: trim.in mới < 0 — cùng giới
//   hạn đường tốc độ hằng cũ, không nới); duration mới < 0.2s.
// - Curve hằng là trường hợp riêng của đường này, không cần nhánh riêng:
//   sourcePosAt = v·t và slice giữ hằng nên kết quả trùng đúng phép tuyến
//   tính cũ với speed = v (kể cả khi field speed hằng ghi khác v — render
//   §1.5 dùng curve, bỏ qua speed hằng, nên đường curve thắng là đúng).
// - Split/trim vẫn CHỈ đụng trim tầng ngoài cùng, không viết lại lá bên
//   trong (ngữ nghĩa H2 giữ nguyên); field speed hằng (nếu có) giữ nguyên
//   trên các nửa (render bỏ qua nó khi có curve, §1.5).

/** Bản copy của nested clip mang curve cho trước + duration/trim/start mới. */
function withNestedCurve(
  top: NestedClip,
  curve: SpeedCurve,
  duration: number,
  trim: { in: number; out: number },
  start?: number,
): NestedClip {
  const rec = {
    ...top,
    duration,
    trim,
    ...(start !== undefined ? { start } : {}),
  } as unknown as Record<string, unknown>;
  rec["speedKeyframes"] = curve;
  return rec as unknown as NestedClip;
}

/**
 * Cửa sổ con hiệu dụng cho nested mang curve (đợt 20 R2 — khác mặc định
 * tốc độ hằng của nestedEffectiveTrim khi không ghi trim):
 * - Ghi trim tường minh: dùng đúng trim đó, nhưng từ chối khi lệch bất
 *   biến render §1.3 (out ≠ in + ∫₀ᴰ trong 1e-4s) — clip gốc đã không hợp
 *   lệ thì tách/trim không đoán cách sửa.
 * - Không ghi trim: cửa sổ kết thúc tại in + ∫₀ᴰ (spec §1.3 câu cuối).
 * Trả null khi trim/in/duration không hợp lệ hoặc tích phân không hữu hạn.
 */
function nestedCurveWindow(
  top: NestedClip,
  curve: SpeedCurve,
): { in: number; out: number } | null {
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(trim.in) || trim.in < 0) return null;
  if (!Number.isFinite(top.duration) || top.duration <= 0) return null;
  let consumed: number;
  try {
    consumed = sourcePosAt(curve, top.duration);
  } catch {
    return null;
  }
  if (!Number.isFinite(consumed)) return null;
  if (top.trim !== undefined) {
    if (!Number.isFinite(trim.out) || trim.out <= trim.in) return null;
    if (Math.abs(trim.out - (trim.in + consumed)) > 1e-4) return null;
    return { in: trim.in, out: trim.out };
  }
  return { in: trim.in, out: trim.in + consumed };
}

/**
 * Tách 1 nested clip mang curve thành 2 tại thời gian output leftDur
 * (đợt 20 R2): điểm cắt con cutSub = in + ∫₀^leftDur s (ánh xạ τ thuận),
 * curve mỗi nửa = slice trên đoạn output của nửa đó, rebase về 0.
 * Nửa trái giữ id/start gốc, nửa phải nhận id mới + start = t. Bất biến
 * mỗi nửa giữ theo cấu tạo: trái out − in = ∫ nửa trái; phải
 * out − cutSub = ∫ nửa phải (vì cửa sổ gốc khớp tích phân — xem
 * nestedCurveWindow). Trả null khi cửa sổ gốc lệch tích phân, slice
 * rỗng, hoặc điểm cắt không nằm hẳn trong cửa sổ.
 */
function splitNestedWithCurve(
  top: NestedClip,
  curve: SpeedCurve,
  t: number,
  idGen: IdGen,
): [NestedClip, NestedClip] | null {
  const win = nestedCurveWindow(top, curve);
  if (!win) return null;
  const leftDur = t - top.start;
  const rightDur = top.duration - leftDur;
  if (leftDur <= 0 || rightDur <= 0) return null;
  let cutSub: number;
  let leftKfs: SpeedKeyframe[];
  let rightKfs: SpeedKeyframe[];
  try {
    cutSub = win.in + sourcePosAt(curve, leftDur);
    const sp = splitSpeedKeyframes(curve.keyframes, leftDur, top.duration);
    leftKfs = sp.left;
    rightKfs = sp.right;
  } catch {
    return null;
  }
  if (leftKfs.length === 0 || rightKfs.length === 0) return null;
  if (!Number.isFinite(cutSub) || cutSub <= win.in || cutSub >= win.out) return null;
  const left = withNestedCurve(top, { keyframes: leftKfs }, leftDur, {
    in: win.in,
    out: cutSub,
  });
  const rightBase = withNestedCurve(
    top,
    { keyframes: rightKfs },
    rightDur,
    { in: cutSub, out: win.out },
    t,
  );
  const right: NestedClip = { ...rightBase, id: idGen() };
  return [left, right];
}

/**
 * Tách 1 nested clip ngoài cùng thành 2 tại thời điểm t (timeline ngoài).
 * - Không curve: điểm cắt trong subSpec = trim.in + (t − start) × speed
 *   (đường tuyến tính cũ, giữ nguyên).
 * - Có curve (đợt 20 R2): điểm cắt = in + ∫₀^(t−start) s, curve mỗi nửa
 *   = slice trên đoạn output của nửa đó (xem splitNestedWithCurve).
 * Trả null khi t không nằm hẳn trong clip, speed/trim không hợp lệ,
 * clip reverse (render cấm hoàn toàn, spec đợt 18 §1.4), curve rỗng/
 * không tính được tích phân, hoặc cửa sổ gốc lệch tích phân > 1e-4s.
 */
export function splitNestedClip(
  top: NestedClip,
  t: number,
  idGen: IdGen,
): [NestedClip, NestedClip] | null {
  if (!Number.isFinite(t) || t <= top.start || t >= top.start + top.duration) {
    return null;
  }
  const rec = top as unknown as Record<string, unknown>;
  if (rec["reverse"] === true) return null;
  if (rec["speedKeyframes"] !== undefined) {
    const curve = leafCurveOf(top as unknown as Clip);
    if (!curve || curve.keyframes.length === 0) return null;
    return splitNestedWithCurve(top, curve, t, idGen);
  }
  const speed = nestedEffectiveSpeed(top);
  if (!Number.isFinite(speed) || speed <= 0) return null;
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(trim.in) || !Number.isFinite(trim.out) || trim.out <= trim.in) {
    return null;
  }
  const leftDur = t - top.start;
  const rightDur = top.start + top.duration - t;
  // Không áp ngưỡng 0.2s ở đây: nửa tách tuân theo margin 0.05s của
  // splitClipAt trong store (giống mọi kind khác) — hàm thuần chỉ cần
  // điểm cắt nằm hẳn trong clip (đã kiểm tra ở trên).
  const cutSub = trim.in + leftDur * speed;
  if (cutSub <= trim.in || cutSub >= trim.out) return null;
  const left: NestedClip = {
    ...top,
    duration: leftDur,
    trim: { in: trim.in, out: cutSub },
  };
  const right: NestedClip = {
    ...top,
    id: idGen(),
    start: t,
    duration: rightDur,
    trim: { in: cutSub, out: trim.out },
  };
  return [left, right];
}

/**
 * Trim 1 nested clip mang curve (đợt 20 R2 — mọi trim.out đều tính lại
 * theo ∫ của curve đã cắt, giữ bất biến trim.out = in + ∫ trong 1e-4s):
 * - Mép trái, target = start mới: shift > 0 (cắt đầu) → newIn =
 *   in + ∫₀^shift s, curve mới = slice [shift, D); shift < 0 (mở rộng) →
 *   newIn = in + s(0)·shift, curve mới = đoạn hằng s(0) + keyframe gốc
 *   dịch đi −shift (quy ước kẹp biên của speedAt, xem header R2).
 * - Mép phải, target = duration mới: thu ngắn → curve mới =
 *   slice [0, D'), newOut = in + ∫₀^D' curve mới; kéo dài → newOut =
 *   in + ∫₀ᴰ s + s(D)·(D' − D), curve mới = keyframe gốc + điểm cuối
 *   (D', s(D)). Đường mở rộng từ chối keyframe gốc ngoài [0, D].
 * Vẫn null khi: đích không hợp lệ, duration mới < 0.2s, cửa sổ gốc lệch
 * tích phân > 1e-4s, slice rỗng, hoặc trim mới vượt nguồn (mép phải:
 * newOut > nestedSourceDuration; mép trái mở rộng: newIn < 0 — cùng giới
 * hạn đường tốc độ hằng cũ). Đích bằng đúng duration/start hiện tại
 * trả về bản copy không đổi (không viết lại keyframe thừa).
 */
function trimNestedWithCurve(
  top: NestedClip,
  curve: SpeedCurve,
  edge: "left" | "right",
  target: number,
): NestedClip | null {
  const EPS = 1e-9;
  const win = nestedCurveWindow(top, curve);
  if (!win) return null;
  const sourceDuration = nestedSourceDuration(top.subSpec);
  try {
    if (edge === "left") {
      const newStart = target;
      if (newStart < 0) return null;
      const shift = newStart - top.start;
      if (Math.abs(shift) <= 1e-12) return { ...top };
      const newDuration = top.duration - shift;
      if (newDuration < 0.2) return null;
      if (shift > 0) {
        const newIn = win.in + sourcePosAt(curve, shift);
        const sliced = sliceSpeedKeyframes(curve.keyframes, shift, top.duration);
        if (sliced.keyframes.length === 0) return null;
        if (!Number.isFinite(newIn) || newIn >= win.out - EPS) return null;
        return withNestedCurve(
          top,
          { keyframes: sliced.keyframes },
          newDuration,
          { in: newIn, out: win.out },
          newStart,
        );
      }
      // Mở rộng sang trái: keyframe gốc ngoài [0, D] thì từ chối (đoạn
      // mở rộng hằng s(0) chỉ đúng hệt khi curve gốc không vượt D).
      if (
        curve.keyframes.some(
          (k) => !Number.isFinite(k.t) || !Number.isFinite(k.v) || k.t < -EPS || k.t > top.duration + EPS,
        )
      ) {
        return null;
      }
      const v0 = speedAt(curve, 0);
      if (!Number.isFinite(v0)) return null;
      const ext = -shift;
      let newIn = win.in + v0 * shift;
      if (newIn < -EPS) return null;
      if (newIn < 0) newIn = 0;
      const shifted = curve.keyframes.map((k) => ({ ...k, t: k.t + ext }));
      const extCurve: SpeedCurve = {
        keyframes: [{ t: 0, v: v0, easing: "linear" }, ...shifted],
      };
      return withNestedCurve(top, extCurve, newDuration, { in: newIn, out: win.out }, newStart);
    }
    // edge === "right": target = duration mới.
    const newDuration = target;
    if (newDuration < 0.2) return null;
    if (Math.abs(newDuration - top.duration) <= 1e-12) return { ...top };
    if (newDuration < top.duration) {
      const sliced = sliceSpeedKeyframes(curve.keyframes, 0, newDuration);
      if (sliced.keyframes.length === 0) return null;
      let newOut = win.in + sourcePosAt({ keyframes: sliced.keyframes }, newDuration);
      if (!Number.isFinite(newOut)) return null;
      if (newOut > sourceDuration + EPS) return null;
      if (newOut > sourceDuration) newOut = sourceDuration;
      if (newOut <= win.in + EPS) return null;
      return withNestedCurve(top, { keyframes: sliced.keyframes }, newDuration, {
        in: win.in,
        out: newOut,
      });
    }
    // Kéo dài sang phải: keyframe gốc ngoài [0, D] thì từ chối (lý do
    // như mở rộng trái — đoạn hằng s(D) chỉ đúng hệt trong khoảng).
    if (
      curve.keyframes.some(
        (k) => !Number.isFinite(k.t) || !Number.isFinite(k.v) || k.t < -EPS || k.t > top.duration + EPS,
      )
    ) {
      return null;
    }
    const vLast = speedAt(curve, top.duration);
    if (!Number.isFinite(vLast)) return null;
    let newOut = win.in + sourcePosAt(curve, top.duration) + vLast * (newDuration - top.duration);
    if (!Number.isFinite(newOut)) return null;
    if (newOut > sourceDuration + EPS) return null;
    if (newOut > sourceDuration) newOut = sourceDuration;
    if (newOut <= win.in + EPS) return null;
    const extCurve: SpeedCurve = {
      keyframes: [...curve.keyframes, { t: newDuration, v: vLast, easing: "linear" }],
    };
    return withNestedCurve(top, extCurve, newDuration, { in: win.in, out: newOut });
  } catch {
    return null;
  }
}

/**
 * Trim 1 nested clip ngoài cùng theo đích tuyệt đối.
 * - Không curve: mép trái target = start mới, trim.in dời theo
 *   shift × speed (shift âm = mở rộng sang trái, tối đa tới trim.in = 0);
 *   mép phải target = duration mới, trim.out = trim.in + duration ×
 *   speed, tối đa tới nestedSourceDuration(subSpec) (đường cũ, giữ nguyên).
 * - Có curve (đợt 20 R2): xem trimNestedWithCurve — trim.out tính lại
 *   theo ∫ của curve đã cắt, giữ bất biến trim.out = in + ∫ trong 1e-4s.
 * Trả null khi đích không hợp lệ, duration mới < 0.2s, speed/trim không
 * hợp lệ, clip reverse (render cấm, spec §1.4), curve rỗng/không tính
 * được tích phân, hoặc cửa sổ gốc lệch tích phân > 1e-4s. Đổi trim của
 * nested có curve theo chế độ duration-cố-định / trim-cố-định (đổi
 * curve, không đổi trim/duration theo nghĩa trimClip) vẫn ở
 * applyNestedCurveFixedDuration / applyNestedCurveFixedTrim — hai việc
 * khác nhau, không lẫn: hàm này đổi trim/duration và cắt curve theo.
 * Sai số float 1e-9 được dung nạp ở hai biên nguồn (không fail oan vì
 * 0.1 + 0.2 kiểu float).
 */
export function trimNestedClip(
  top: NestedClip,
  edge: "left" | "right",
  target: number,
): NestedClip | null {
  if (!Number.isFinite(target)) return null;
  const rec = top as unknown as Record<string, unknown>;
  if (rec["reverse"] === true) return null;
  if (rec["speedKeyframes"] !== undefined) {
    const curve = leafCurveOf(top as unknown as Clip);
    if (!curve || curve.keyframes.length === 0) return null;
    return trimNestedWithCurve(top, curve, edge, target);
  }
  const speed = nestedEffectiveSpeed(top);
  if (!Number.isFinite(speed) || speed <= 0) return null;
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(trim.in) || !Number.isFinite(trim.out) || trim.out <= trim.in) {
    return null;
  }
  const EPS = 1e-9;
  if (edge === "left") {
    const newStart = target;
    if (newStart < 0) return null;
    const shift = newStart - top.start;
    let newIn = trim.in + shift * speed;
    if (newIn < -EPS) return null;
    if (newIn < 0) newIn = 0;
    const newDuration = top.duration - shift;
    if (newDuration < 0.2) return null;
    if (newIn >= trim.out - EPS) return null;
    return { ...top, start: newStart, duration: newDuration, trim: { in: newIn, out: trim.out } };
  }
  const newDuration = target;
  if (newDuration < 0.2) return null;
  let newOut = trim.in + newDuration * speed;
  const sourceDuration = nestedSourceDuration(top.subSpec);
  if (newOut > sourceDuration + EPS) return null;
  if (newOut > sourceDuration) newOut = sourceDuration;
  if (newOut <= trim.in + EPS) return null;
  return { ...top, duration: newDuration, trim: { in: trim.in, out: newOut } };
}

// ---- Đợt 17 N3: patchClip speed nested + sửa clip con sâu hơn 1 tầng ----
//
// NỢ ĐÓNG (xem docs/PHASE9_ROUND16_H2_NESTED_STORE_LIMITS.md §3):
// - "Đổi speed của nested clip qua patchClip vẫn là nợ mở": patchClip đợt
//   16 chỉ đi theo duration, không tính lại duration theo speed mới.
// - "Sửa clip con ở cấp sâu hơn 1 tầng qua store action vẫn chưa có":
//   updateNestedInnerClip (R5) chỉ sửa clip con trực tiếp của một nested
//   clip; muốn trim/split/đổi speed một lá ở cấp 2–3 mà không rã nested
//   thì vẫn phải đi qua helper thuần rồi tự ghi lại cây.
//
// NGỮ NGHĨA (giữ đúng bất biến đợt 16, không bịa thêm):
// - Nested clip: duration = (trim.out − trim.in) / speed (nestedDuration
//   của spec). applyNestedSpeedDuration nhận một nested clip mà speed/
//   trim đã là giá trị mới và trả về bản copy với duration tính lại;
//   trả null khi speed ngoài [0.25, 4] (= NESTED_MIN/MAX_SPEED của spec)
//   hoặc trim không hợp lệ — store khi đó giữ nguyên duration cũ (không
//   tự kẹp speed, không đoán), xem LIMITS đợt 17 N3.
// - Clip nested mang speedKeyframes (field duck-typed): từ đợt 18 render
//   worker HỖ TRỢ field này (không còn cấm — xem
//   docs/PHASE9_ROUND18_NESTED_SPEED_SPEC.md): duration là thời gian
//   OUTPUT, cửa sổ con là [in, in + ∫₀ᴰ s), và trim.out (nếu ghi) PHẢI
//   khớp tích phân trong 1e-4s nếu không render fail fast. Vì vậy store
//   KHÔNG tính lại duration khi patch đổi speedKeyframes của nested
//   (chế độ duration-cố-định, giống patchCurve của clip thường), mà
//   tính lại trim.out := in + ∫curve (đợt 19 G2, xem
//   applyNestedCurveFixedDuration + nhánh patchClip tương ứng); chế độ
//   trim-cố-định (giữ trim, tính lại duration bằng đảo tích phân) nằm
//   ở applyNestedCurveFixedTrim. Patch đổi speed hằng khi nested đã mang
//   curve cũng không tính lại duration — curve thắng theo spec §1.5,
//   speed hằng bị render bỏ qua (chỉ cảnh báo).
// - Sửa clip con sâu: chainIds = id các nested clip từ con trực tiếp của
//   top xuống nested chứa trực tiếp lá (chain rỗng = lá trực tiếp trong
//   top, tức cùng đích với updateNestedInnerClip nhưng đi đường đệ quy).
//   Mỗi tầng được tìm theo id trong cây thật (clip đầu tiên cùng id
//   thắng, giống composeNestedLeafWindow), KHÔNG tin object caller đưa.
//   Chặn vòng lặp bằng Set các subSpec tổ tiên trên đường đi (dùng lại
//   cùng subSpec ở clip anh em vẫn hợp lệ vì Set chỉ xét đường đi),
//   chặn sâu vượt MAX_NESTED_DEPTH = 8 của spec. Lá đích không được là
//   nested clip (muốn sửa nested con thì nối chain dài hơn).
// - Sửa lá sâu KHÔNG viết lại các tầng tổ tiên ngoài việc thay subSpec:
//   start/duration/trim/speed của mọi nested tổ tiên giữ nguyên. Vì vậy
//   phép sửa bị từ chối khi nó phá bất biến của tầng cha trực tiếp:
//   (a) lá mới vượt khỏi duration của cha trực tiếp; (b) lá mới đè clip
//   khác cùng track cha; (c) lá làm đổi độ dài nguồn của subSpec cha
//   theo cách phá bất biến duration của cha: cha ghi trim tường minh
//   thì chỉ cấm nguồn co dưới trim.out; cha không ghi trim (= "phát
//   toàn bộ", duration cha bằng đúng độ dài nguồn / speed) thì nguồn
//   đổi hướng nào cũng lệch duration cha nên đều bị từ chối.
//   Split lá sâu luôn giữ tổng độ dài và max end của track cha nên không
//   bao giờ rơi vào (c).
// - Đổi speed lá sâu (video/audio, có in/out): speed chỉ đổi thì duration
//   = (out − in) / speed, out giữ nguyên (đoạn nguồn không đổi, giống
//   SpeedPanel cho clip thường); speed + duration cùng có thì out đi
//   theo thành in + duration × speed (giống nhánh duration-nested của
//   patchClip đợt 16). Lá đang có speedKeyframes mà patch chỉ đổi speed
//   hằng (không thay curve) → error, vì duration theo speed hằng sẽ
//   mâu thuẫn với tích phân curve (không đoán cái nào thắng). Patch thay
//   speedKeyframes thì duration giữ nguyên (curve theo thời gian output,
//   giống patchCurve của clip thường).
// - Trim lá sâu có curve đi theo đúng luật R5: dời thuần (cả hai mép
//   dịch cùng lượng) giữ nguyên curve; trim một mép thì dịch/cắt bằng
//   trimSpeedKeyframes, trả curveDropped cho caller (store chuyển tiếp).
// - Split lá sâu theo đúng luật splitClipAt của store cho clip thường:
//   video/audio có curve (không reverse) thì điểm cắt nguồn =
//   in + ∫speed trên nửa trái (kiểu đợt 14: in=10, curve 1→1.25 trên
//   [0,1] mà cắt tại 1s thì điểm cắt = 11,125) và curve chia bằng
//   splitSpeedKeyframes; không curve thì dùng splitSourceAt (đúng cả
//   reverse); text/sticker/image chỉ chia duration, giữ nguyên nội dung.
//   Margin 0.05s của store splitClipAt được áp NGAY TRONG hàm thuần này
//   (khác splitNestedClip đợt 16 vốn để store giữ margin), vì deep
//   split không đi qua splitClipAt — store action gọi thẳng hàm này.

/**
 * Tính lại duration của một nested clip từ speed + trim HIỆN TẠI của nó.
 * Dùng trong patchClip khi patch đổi speed mà không kèm duration: caller
 * đã ghi speed/trim mới vào clip (qua patchOne), hàm này chỉ điền
 * duration = (trim.out − trim.in) / speed. Trả null khi speed/trim
 * không hợp lệ (store giữ nguyên duration cũ, không tự kẹp).
 */
export function applyNestedSpeedDuration(top: NestedClip): NestedClip | null {
  const speed = nestedEffectiveSpeed(top);
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(speed) || speed < 0.25 || speed > 4) return null;
  if (!Number.isFinite(trim.in) || !Number.isFinite(trim.out) || trim.out <= trim.in) {
    return null;
  }
  const duration = (trim.out - trim.in) / speed;
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return { ...top, duration };
}

// ---- Đợt 19 G2: curve hai tầng (fail-fast, KHÔNG hợp sai) + hai chế độ
// sửa curve của nested clip (spec đợt 18 §2/§5) ----
//
// Spec đợt 18 §5 từng CẤM hợp curve hai tầng, nhưng render đợt 20 R1
// đã HỢP thật (tích phân hợp, xem twoLevelCurve.ts) nên từ đợt 21 T2,
// guard hai tầng ở tầng store KHÔNG còn chặn mọi trạng thái hai tầng:
//  - patchClip đặt curve lên một nested clip mà cây con đã có lá mang
//    curve → checkTwoLevelOuterCurve kiểm tra toàn bộ cây con theo
//    luật R1 (chỉ cho qua khi cả hai curve hợp lệ, không reverse,
//    không attachment thời gian, tốc độ hợp trong [0.25, 4]);
//  - updateNestedDeepInnerClip đặt curve lên lá mà một tầng tổ tiên
//    trong chain đã mang curve → checkTwoLevelLeafCurve kiểm tra cặp
//    đó theo cùng luật R1.
// Chặn thừa curve HẰNG của G2 đợt 19 nay đã bỏ: render §1c xử lý hằng
// đúng hệt bằng slice, nên tổ tiên/lá mang curve hằng được cho qua như
// curve thường (miễn là tốc độ hợp vẫn trong [0.25, 4]).
// Lá text/sticker/image mang field speedKeyframes duck-typed vẫn KHÔNG
// được tính là lá hợp lệ dưới ramp (không có trục nguồn) — nay chúng
// là lý do CHẶN khi đặt curve ngoài lên trên (trước đây G2 chỉ bỏ qua
// chúng khi đếm xung đột), đúng luật render R1 §1f.
// Lá text/sticker/image mang field speedKeyframes duck-typed KHÔNG bị
// tính là xung đột (chúng không có trục nguồn; spec §3 chỉ ánh xạ τ
// cho chúng) — chỉ video/audio và nested con mới tính, đúng các kind
// mà render biến thành clip ramp.
//
// Hai chế độ sửa curve của nested (spec §2, cả hai đều giữ bất biến
// render §1.3 out = in + ∫₀ᴰ s trong 1e-4s):
//  - duration-cố-định (applyNestedCurveFixedDuration): giữ D, đặt lại
//    trim.out := in + ∫curve. Đây là chế độ patchClip dùng (giống
//    patchCurve của clip thường).
//  - trim-cố-định (applyNestedCurveFixedTrim): giữ [in, out), tính lại
//    D := outputDurationForSource(curve, out − in) (đảo tích phân).
// Cả hai trả null (không đoán) khi: clip reverse, curve rỗng/không
// hợp lệ (keyframes không phải số hữu hạn), trim không hợp lệ, hoặc
// (chỉ trim-cố-định) duration tính ra < 0.2s / không hữu hạn —
// ngưỡng 0.2s mượn đúng floor duration của trimNestedClip, không phải
// luật mới của render. sourcePosAt/outputDurationForSource throw với
// curve rỗng nên hàm bắt và trả null thay vì để throw lan ra store.
// nestedCurveOutMismatch dùng để BÁO (không tự sửa) khi user tự đặt
// trim tường minh cùng lúc với curve: chênh lệch > 1e-4s là render sẽ
// fail, store phải toast chứ không được nuốt (bài học curveDropped
// đợt 16: cảnh báo phải tới được UI).

/** Curve duck-typed của một clip (nested clip cũng có thể mang field này). */
function nestedOwnCurve(clip: unknown): SpeedCurve | undefined {
  const rec = clip as unknown as { speedKeyframes?: SpeedCurve } | null;
  const curve = rec && typeof rec === "object" ? rec.speedKeyframes : undefined;
  return curve && Array.isArray(curve.keyframes) && curve.keyframes.length > 0
    ? curve
    : undefined;
}

/** out kỳ vọng theo tích phân curve: in + ∫₀ᴰ s; null khi không có curve hợp lệ. */
export function nestedCurveExpectedOut(top: NestedClip): number | null {
  const curve = nestedOwnCurve(top);
  if (!curve) return null;
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(trim.in) || !Number.isFinite(top.duration) || top.duration <= 0) {
    return null;
  }
  try {
    const consumed = sourcePosAt(curve, top.duration);
    if (!Number.isFinite(consumed)) return null;
    return trim.in + consumed;
  } catch {
    return null;
  }
}

/** Chênh lệch trim.out thực tế so với tích phân curve; null khi không có curve hợp lệ. */
export function nestedCurveOutMismatch(top: NestedClip): {
  expectedOut: number;
  actualOut: number;
  diff: number;
} | null {
  const expected = nestedCurveExpectedOut(top);
  if (expected === null) return null;
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(trim.out)) return null;
  return { expectedOut: expected, actualOut: trim.out, diff: trim.out - expected };
}

/** Chế độ duration-cố-định: giữ duration, đặt curve mới + trim.out theo tích phân. */
export function applyNestedCurveFixedDuration(
  top: NestedClip,
  curve: SpeedCurve,
): NestedClip | null {
  if ((top as unknown as { reverse?: boolean }).reverse === true) return null;
  if (!curve || !Array.isArray(curve.keyframes) || curve.keyframes.length === 0) return null;
  if (!Number.isFinite(top.duration) || top.duration <= 0) return null;
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(trim.in)) return null;
  try {
    const consumed = sourcePosAt(curve, top.duration);
    if (!Number.isFinite(consumed)) return null;
    const next = { ...top, trim: { in: trim.in, out: trim.in + consumed } } as unknown as Record<
      string,
      unknown
    >;
    next["speedKeyframes"] = curve;
    return next as unknown as NestedClip;
  } catch {
    return null;
  }
}

/** Chế độ trim-cố-định: giữ trim, đặt curve mới + duration theo đảo tích phân. */
export function applyNestedCurveFixedTrim(
  top: NestedClip,
  curve: SpeedCurve,
): NestedClip | null {
  if ((top as unknown as { reverse?: boolean }).reverse === true) return null;
  if (!curve || !Array.isArray(curve.keyframes) || curve.keyframes.length === 0) return null;
  const trim = nestedEffectiveTrim(top);
  if (!Number.isFinite(trim.in) || !Number.isFinite(trim.out) || trim.out <= trim.in) {
    return null;
  }
  try {
    const duration = outputDurationForSource(curve, trim.out - trim.in);
    if (!Number.isFinite(duration) || duration < 0.2) return null;
    const next = { ...top, duration } as unknown as Record<string, unknown>;
    next["speedKeyframes"] = curve;
    return next as unknown as NestedClip;
  } catch {
    return null;
  }
}

/**
 * Cây con của nested clip có clip video/audio hoặc nested con nào mang
 * speedKeyframes không (đệ quy, chống vòng lặp subSpec). Dùng để chặn
 * sớm việc đặt thêm curve lên chính nested clip này (hợp hai tầng).
 */
export function nestedSubtreeHasSpeedCurve(top: NestedClip): boolean {
  const seen = new Set<object>();
  const walk = (spec: VideoSpec): boolean => {
    if (seen.has(spec)) return false;
    seen.add(spec);
    if (!Array.isArray(spec.tracks)) return false;
    for (const t of spec.tracks) {
      if (!Array.isArray(t.clips)) continue;
      for (const c of t.clips) {
        if (c.kind !== "video" && c.kind !== "audio" && c.kind !== "nested") continue;
        if (nestedOwnCurve(c)) return true;
        if (c.kind === "nested") {
          const child = asNestedClip(c);
          if (child && walk(child.subSpec)) return true;
        }
      }
    }
    return false;
  };
  return walk(top.subSpec);
}

// ---- Đợt 21 T2: nới guard hai tầng theo đúng luật render R1 (đợt 20) ----
//
// Render đợt 20 R1 đã HỢP curve hai tầng thật (lá video/audio mang curve
// riêng dưới nested có curve), nên guard G2 đợt 19 (chặn mọi trạng thái
// hai tầng) nay được nới thành kiểm tra theo luật R1, dùng chung cho cả
// hai đường vào của store: patchClip đặt curve lên nested (kiểm tra toàn
// bộ cây con) và updateNestedDeepInnerClip đặt curve lên lá (kiểm tra
// chain tổ tiên). Một trạng thái chỉ được cho qua khi MỌI điều sau đúng:
//  - Mỗi curve (ngoài + trong) hợp lệ riêng: keyframes không rỗng,
//    ≤ 128, t trong [0, duration của chính tầng đó], v trong [0.25, 4],
//    easing linear | ease-in | ease-out | bezier (bezier có x1, x2
//    trong [0, 1]) — đúng validateNestedRamp của render / validateCurve
//    của twoLevelCurve.ts (không kiểm tra đơn điệu t vì hai module gốc
//    cũng không kiểm tra; normalize sắp xếp lại keyframes).
//  - Không reverse ở tầng mang curve lẫn lá (render cấm reverse dưới
//    ramp và cấm reverse ở chính nested clip).
//  - Không attachment thời gian khác (track.points, karaoke, animations
//    keyframes, volumeKeyframes) trên lá media dưới ramp — render chưa
//    nội suy attachment qua τ phi tuyến (R1 §1f, preview R3 giữ nguyên
//    fail-fast này).
//  - Chỉ lá video/audio mới được mang curve dưới ramp; lá text/sticker/
//    image mang speedKeyframes duck-typed bị chặn (không có trục nguồn).
//  - Tốc độ hợp trong [0.25, 4]: với lá trực tiếp của tầng ngoài, kiểm
//    tra LẤY MẪU ĐÚNG c(T) = s_o(T) · s_i(x(T)) tại 257 điểm đều + mọi
//    knot ngoài + knot trong đã map ngược qua τ (bisection trên
//    sourcePosAt, mirror twoLevelTauOffset/mapChildOffset của render);
//    với lá sâu hơn hoặc nested trung gian mang curve, chỉ kiểm tra
//    BIÊN TÍCH keyframe (min·min ≥ 0.25 và max·max ≤ 4) vì vị trí map
//    qua nhiều tầng không tính bằng một τ đơn. Biên keyframe là điều
//    kiện cần cho linear/ease (speedAt nằm trong [min, max] keyframe)
//    nhưng KHÔNG đủ cho bezier (y1/y2 tự do nên speedAt có thể vượt
//    biên keyframe): trường hợp đó store có thể cho qua nhưng render
//    vẫn fail-fast ở bước mã hoá Hermite — render là chốt chặn cuối,
//    store chỉ là cổng UI, không mạo nhận kiểm tra tuyệt đối. Ngược lại,
//    biên tích vượt thì chặn chắc chắn (không tạo trạng thái render
//    chắc chắn từ chối).
//  - Lá nằm ngoài cửa sổ trim của tầng ngoài hoàn toàn (không có đoạn
//    khả kiến) được bỏ qua ở bước lấy mẫu vì render sẽ drop lá đó, không
//    fail; các kiểm tra hình dạng/reverse/attachment vẫn áp cho nó.
/** Kết quả kiểm tra hai tầng: ok + reason rỗng, hoặc !ok + lý do tiếng Việt để store toast/trả về. */
export interface TwoLevelCheck {
  ok: boolean;
  reason: string;
}

const T2_SPEED_MIN = 0.25;
const T2_SPEED_MAX = 4;
const T2_MAX_KEYFRAMES = 128;

/** Curve có đúng hình dạng luật ramp R1 trên duration của chính nó không. */
export function isValidTwoLevelRampCurve(
  curve: SpeedCurve | undefined,
  duration: number,
): boolean {
  if (!curve || typeof curve !== "object" || !Array.isArray(curve.keyframes)) return false;
  const ks = curve.keyframes;
  if (ks.length === 0 || ks.length > T2_MAX_KEYFRAMES) return false;
  if (!Number.isFinite(duration) || duration <= 0) return false;
  for (const kf of ks) {
    if (!kf || typeof kf !== "object") return false;
    if (!Number.isFinite(kf.t) || kf.t < 0 || kf.t > duration + 1e-6) return false;
    if (!Number.isFinite(kf.v) || kf.v < T2_SPEED_MIN || kf.v > T2_SPEED_MAX) return false;
    if (kf.easing !== "linear" && kf.easing !== "ease-in" && kf.easing !== "ease-out" && kf.easing !== "bezier") {
      return false;
    }
    if (kf.easing === "bezier") {
      const b = kf.bezier;
      if (!Array.isArray(b) || b.length !== 4 || !b.every((x) => Number.isFinite(x))) return false;
      if (b[0] < 0 || b[0] > 1 || b[2] < 0 || b[2] > 1) return false;
    }
  }
  return true;
}

/** Clip có attachment thời gian KHÁC speedKeyframes không (mirror hasNonCurveAttachments của render). */
export function clipHasTimeAttachment(clip: unknown): boolean {
  const rec = clip as unknown as Record<string, unknown> | null;
  if (!rec || typeof rec !== "object") return false;
  const track = rec["track"] as { points?: unknown[] } | undefined;
  if (track && Array.isArray(track.points) && track.points.length > 0) return true;
  if (Array.isArray(rec["karaoke"]) && (rec["karaoke"] as unknown[]).length > 0) return true;
  const anims = rec["animations"] as Record<string, unknown> | undefined;
  if (anims && typeof anims === "object") {
    for (const v of Object.values(anims)) {
      const a = v as { keyframes?: unknown[] } | null;
      if (a && typeof a === "object" && Array.isArray(a.keyframes) && a.keyframes.length > 0) return true;
    }
  }
  if (rec["volumeKeyframes"] !== undefined) return true;
  return false;
}

/** τ ngược: thời gian output T sao cho ∫₀ᵀ s = childOffset (mirror twoLevelTauOffset của web / mapChildOffset của render). */
function twoLevelTauOffsetLocal(curve: SpeedCurve, duration: number, childOffset: number): number {
  const total = sourcePosAt(curve, duration);
  if (childOffset <= 0) return childOffset / speedAt(curve, 0);
  if (childOffset >= total) {
    return duration + (childOffset - total) / speedAt(curve, duration);
  }
  let lo = 0;
  let hi = duration;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sourcePosAt(curve, mid) < childOffset) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Tốc độ hợp lấy mẫu của một lá trực tiếp dưới tầng ngoài có nằm trong [0.25, 4] không. */
function combinedRampSpeedInRange(
  outerCurve: SpeedCurve,
  outerDuration: number,
  outerIn: number,
  innerCurve: SpeedCurve,
  leafStart: number,
  leafDuration: number,
): boolean {
  try {
    const total = sourcePosAt(outerCurve, outerDuration);
    const winStart = outerIn;
    const winEnd = outerIn + total;
    const vs = Math.max(leafStart, winStart);
    const ve = Math.min(leafStart + leafDuration, winEnd);
    if (ve - vs <= 1e-6) return true; // lá ngoài cửa sổ hoàn toàn → render drop, không fail
    const leftCut = vs - leafStart;
    const tStart = twoLevelTauOffsetLocal(outerCurve, outerDuration, vs - outerIn);
    const tEnd = twoLevelTauOffsetLocal(outerCurve, outerDuration, ve - outerIn);
    if (!(tEnd > tStart)) return false;
    const base = sourcePosAt(outerCurve, tStart);
    const points: number[] = [];
    const N = 256;
    for (let i = 0; i <= N; i++) points.push(tStart + (i / N) * (tEnd - tStart));
    for (const k of outerCurve.keyframes) {
      if (k.t > tStart && k.t < tEnd) points.push(k.t);
    }
    const visible = ve - vs;
    for (const k of innerCurve.keyframes) {
      if (k.t > leftCut && k.t < leftCut + visible) {
        const T = twoLevelTauOffsetLocal(outerCurve, outerDuration, (vs - outerIn) + (k.t - leftCut));
        if (T > tStart && T < tEnd) points.push(T);
      }
    }
    for (const T of points) {
      const x = leftCut + (sourcePosAt(outerCurve, T) - base);
      const c = speedAt(outerCurve, T) * speedAt(innerCurve, x);
      if (!Number.isFinite(c) || c < T2_SPEED_MIN - 1e-9 || c > T2_SPEED_MAX + 1e-9) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Biên tích keyframe ngoài × trong có nằm trong [0.25, 4] không (điều kiện cần, xem header T2). */
function keyframeProductInRange(outerCurve: SpeedCurve, innerCurve: SpeedCurve): boolean {
  let oMin = Infinity;
  let oMax = -Infinity;
  for (const k of outerCurve.keyframes) {
    if (!Number.isFinite(k.v)) return false;
    oMin = Math.min(oMin, k.v);
    oMax = Math.max(oMax, k.v);
  }
  let iMin = Infinity;
  let iMax = -Infinity;
  for (const k of innerCurve.keyframes) {
    if (!Number.isFinite(k.v)) return false;
    iMin = Math.min(iMin, k.v);
    iMax = Math.max(iMax, k.v);
  }
  return oMin * iMin >= T2_SPEED_MIN - 1e-9 && oMax * iMax <= T2_SPEED_MAX + 1e-9;
}

/**
 * Đường patchClip / patchNestedCurveFixedTrim: đặt curve ngoài lên một
 * nested clip thì toàn bộ cây con có tạo thành trạng thái hai tầng hợp
 * lệ theo R1 không. Cây con không có curve nào → luôn ok (một tầng).
 * Trả { ok: false, reason } khi bất kỳ điều kiện nào ở header T2 vi phạm.
 */
export function checkTwoLevelOuterCurve(top: NestedClip, outerCurve: SpeedCurve): TwoLevelCheck {
  if ((top as unknown as { reverse?: boolean }).reverse === true) {
    return { ok: false, reason: "Nested clip đang reverse — render cấm kết hợp reverse với speed curve." };
  }
  if (!isValidTwoLevelRampCurve(outerCurve, top.duration)) {
    return {
      ok: false,
      reason:
        "Speed curve ngoài không hợp lệ theo luật render R1 (keyframes rỗng/quá 128, t ngoài [0, duration], v ngoài [0.25, 4] hoặc easing không hợp lệ).",
    };
  }
  const outerTrim = nestedEffectiveTrim(top);
  const seen = new Set<object>();
  const walk = (spec: VideoSpec, direct: boolean): TwoLevelCheck | null => {
    if (seen.has(spec)) return null;
    seen.add(spec);
    if (!Array.isArray(spec.tracks)) return null;
    for (const t of spec.tracks) {
      if (!Array.isArray(t.clips)) continue;
      for (const c of t.clips) {
        if ((c as unknown as { reverse?: boolean }).reverse === true) {
          return { ok: false, reason: `Clip "${c.id}" đang reverse — render cấm lá reverse dưới nested có curve.` };
        }
        if (c.kind === "video" || c.kind === "audio") {
          if (clipHasTimeAttachment(c)) {
            return {
              ok: false,
              reason: `Clip "${c.id}" mang attachment thời gian (track/karaoke/animations/volumeKeyframes) — render chưa nội suy attachment qua τ phi tuyến.`,
            };
          }
          const curve = nestedOwnCurve(c);
          if (curve) {
            if (!isValidTwoLevelRampCurve(curve, c.duration)) {
              return { ok: false, reason: `Speed curve của clip "${c.id}" không hợp lệ theo luật render R1.` };
            }
            if (direct) {
              if (!combinedRampSpeedInRange(outerCurve, top.duration, outerTrim.in, curve, c.start, c.duration)) {
                return {
                  ok: false,
                  reason: `Tốc độ hợp của curve ngoài với curve của clip "${c.id}" vượt khoảng [0.25, 4] (tích hai tốc độ tại điểm mẫu).`,
                };
              }
            } else if (!keyframeProductInRange(outerCurve, curve)) {
              return {
                ok: false,
                reason: `Tích tốc độ keyframe của curve ngoài với curve của clip "${c.id}" vượt khoảng [0.25, 4].`,
              };
            }
          }
        } else if (c.kind === "nested") {
          const child = asNestedClip(c);
          if (child) {
            const cc = nestedOwnCurve(child);
            if (cc) {
              if (!isValidTwoLevelRampCurve(cc, child.duration)) {
                return { ok: false, reason: `Speed curve của nested clip "${child.id}" không hợp lệ theo luật render R1.` };
              }
              if (!keyframeProductInRange(outerCurve, cc)) {
                return {
                  ok: false,
                  reason: `Tích tốc độ keyframe của curve ngoài với curve của nested clip "${child.id}" vượt khoảng [0.25, 4].`,
                };
              }
            }
            const r = walk(child.subSpec, false);
            if (r) return r;
          }
        } else if (nestedOwnCurve(c)) {
          return {
            ok: false,
            reason: `Clip "${c.id}" (${c.kind}) mang speedKeyframes nhưng không có trục nguồn — render chỉ hợp curve cho lá video/audio.`,
          };
        }
      }
    }
    return null;
  };
  return walk(top.subSpec, true) ?? { ok: true, reason: "" };
}

/**
 * Đường updateNestedDeepInnerClip: đặt curve lên một lá mà chain tổ tiên
 * đã có curve thì cặp đó có hợp lệ theo R1 không. Không có tầng tổ tiên
 * nào mang curve → luôn ok (một tầng, đường cũ). effStart/effDuration là
 * hình học của lá SAU patch (patch.start/duration nếu có) để bước lấy
 * mẫu dùng đúng đoạn khả kiến mới.
 */
export function checkTwoLevelLeafCurve(
  levels: NestedClip[],
  leaf: Clip,
  leafCurve: SpeedCurve,
  effStart?: number,
  effDuration?: number,
): TwoLevelCheck {
  const curveLevels = levels.filter((l) => nestedOwnCurve(l));
  if (curveLevels.length === 0) return { ok: true, reason: "" };
  if ((leaf as unknown as { reverse?: boolean }).reverse === true) {
    return { ok: false, reason: "Clip lá đang reverse — render cấm kết hợp reverse với speed curve." };
  }
  if (leaf.kind !== "video" && leaf.kind !== "audio") {
    return { ok: false, reason: "Chỉ lá video/audio mới mang speed curve dưới nested có curve (lá khác không có trục nguồn)." };
  }
  if (clipHasTimeAttachment(leaf)) {
    return {
      ok: false,
      reason: "Clip lá mang attachment thời gian (track/karaoke/animations/volumeKeyframes) — render chưa nội suy attachment qua τ phi tuyến.",
    };
  }
  const leafDuration = effDuration ?? leaf.duration;
  if (!isValidTwoLevelRampCurve(leafCurve, leafDuration)) {
    return { ok: false, reason: "Speed curve của clip lá không hợp lệ theo luật render R1." };
  }
  for (const level of levels) {
    if ((level as unknown as { reverse?: boolean }).reverse === true) {
      return { ok: false, reason: `Nested clip tổ tiên "${level.id}" đang reverse — render cấm reverse ở tầng mang curve.` };
    }
    const ac = nestedOwnCurve(level);
    if (ac) {
      if (!isValidTwoLevelRampCurve(ac, level.duration)) {
        return { ok: false, reason: `Speed curve của nested clip tổ tiên "${level.id}" không hợp lệ theo luật render R1.` };
      }
      if (!keyframeProductInRange(ac, leafCurve)) {
        return {
          ok: false,
          reason: `Tích tốc độ keyframe của curve tổ tiên "${level.id}" với curve của clip lá vượt khoảng [0.25, 4].`,
        };
      }
    }
  }
  // Lấy mẫu đúng khi chỉ có một tầng tổ tiên mang curve và đó là cha
  // trực tiếp (lá nằm trực tiếp trong timeline con của tầng đó).
  if (curveLevels.length === 1) {
    const parent = levels[levels.length - 1];
    const ac = nestedOwnCurve(parent);
    if (ac) {
      const trim = nestedEffectiveTrim(parent);
      const leafStart = effStart ?? leaf.start;
      if (!combinedRampSpeedInRange(ac, parent.duration, trim.in, leafCurve, leafStart, leafDuration)) {
        return {
          ok: false,
          reason: `Tốc độ hợp của curve tổ tiên "${parent.id}" với curve của clip lá vượt khoảng [0.25, 4] (tích hai tốc độ tại điểm mẫu).`,
        };
      }
    }
  }
  return { ok: true, reason: "" };
}

/** Patch cho 1 clip lá ở cấp sâu (mở rộng NestedInnerPatch thêm speed). */
export interface NestedDeepPatch extends NestedInnerPatch {
  /** Tốc độ hằng mới (chỉ video/audio có in/out; xem header N3). */
  speed?: number;
  /** Curve mới thay thế curve cũ (chỉ video/audio; duration giữ nguyên). */
  speedKeyframes?: SpeedCurve;
}

const N3_EPS = 1e-9;
const N3_MAX_DEPTH = 8;
const N3_SPLIT_MARGIN = 0.05;

/** Tìm nested clip con theo id trong mọi track của một subSpec. */
function findNestedChildInSpec(spec: VideoSpec, id: string): NestedClip | null {
  if (!Array.isArray(spec.tracks)) return null;
  for (const t of spec.tracks) {
    if (!Array.isArray(t.clips)) continue;
    for (const c of t.clips) {
      const n = asNestedClip(c);
      if (n && n.id === id) return n;
    }
  }
  return null;
}

/**
 * Đi theo chainIds từ top xuống nested chứa trực tiếp lá.
 * Trả về các tầng [top, ...chain] (mỗi tầng là bản ghi TRONG CÂY) hoặc
 * { error }. Vòng lặp tham chiếu subSpec trên đường đi và sâu vượt 8
 * đều thành error (không throw — hợp đồng store action trả { ok }).
 */
function resolveDeepLevels(
  top: NestedClip,
  chainIds: string[],
): { levels: NestedClip[] } | { error: string } {
  if (!Array.isArray(chainIds)) return { error: "chainIds phải là một mảng." };
  const levels: NestedClip[] = [top];
  const ancestors = new Set<object>();
  ancestors.add(top.subSpec);
  let current: NestedClip = top;
  let depth = 1;
  for (const id of chainIds) {
    if (depth + 1 > N3_MAX_DEPTH) {
      return {
        error: `Vượt độ sâu lồng nhau tối đa ${N3_MAX_DEPTH} tại nested clip "${id}".`,
      };
    }
    if (!Array.isArray(current.subSpec.tracks)) {
      return { error: `subSpec của nested clip "${current.id}" không có tracks.` };
    }
    const child = findNestedChildInSpec(current.subSpec, id);
    if (!child) {
      return {
        error: `Không tìm thấy nested clip "${id}" trong tầng của "${current.id}".`,
      };
    }
    if (ancestors.has(child.subSpec)) {
      return {
        error: `Vòng lặp tham chiếu subSpec tại nested clip "${child.id}".`,
      };
    }
    ancestors.add(child.subSpec);
    levels.push(child);
    current = child;
    depth += 1;
  }
  return { levels };
}

/**
 * Ghi lại cây từ lá đã sửa lên top: levels[i+1] được thay vào track của
 * levels[i].subSpec bằng bản mới (levels[last] mang subSpec đã sửa lá).
 * levels[last] phải là tầng cha trực tiếp của lá; newLeafTrack là track
 * của tầng đó sau khi sửa lá.
 */
function rebuildDeepLevels(levels: NestedClip[], newLeafTrack: Track): NestedClip {
  let currentSpec: VideoSpec = {
    ...levels[levels.length - 1].subSpec,
    tracks: levels[levels.length - 1].subSpec.tracks.map((t) =>
      t.id === newLeafTrack.id ? newLeafTrack : t,
    ),
  };
  let current: NestedClip = { ...levels[levels.length - 1], subSpec: currentSpec };
  for (let i = levels.length - 2; i >= 0; i--) {
    const parent = levels[i];
    const childId = levels[i + 1].id;
    const nextSpec: VideoSpec = {
      ...parent.subSpec,
      tracks: parent.subSpec.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === childId ? (current as unknown as Clip) : c)),
      })),
    };
    current = { ...parent, subSpec: nextSpec };
  }
  return current;
}

/** Đọc in/out/speed của lá video/audio (null khi thiếu in/out). */
function deepLeafSource(leaf: Clip): { in: number; out: number; speed: number } | null {
  if (leaf.kind !== "video" && leaf.kind !== "audio") return null;
  const rec = leaf as unknown as Record<string, unknown>;
  const srcIn = rec["in"];
  const srcOut = rec["out"];
  if (typeof srcIn !== "number" || !Number.isFinite(srcIn)) return null;
  if (typeof srcOut !== "number" || !Number.isFinite(srcOut)) return null;
  const speed = rec["speed"];
  return {
    in: srcIn,
    out: srcOut,
    speed: typeof speed === "number" && Number.isFinite(speed) ? speed : 1,
  };
}

/**
 * Áp patch lên 1 clip lá (đã biết track cha + các clip anh em).
 * Trả về clip mới + curveDropped, hoặc { error }. KHÔNG kiểm tra track
 * khóa (caller kiểm tra ở tầng host) và KHÔNG đụng tầng tổ tiên.
 */
function applyDeepLeafPatch(
  leaf: Clip,
  patch: NestedDeepPatch,
  parentDuration: number,
  siblings: Clip[],
): { clip: Clip; curveDropped: number } | { error: string } {
  if (patch.text !== undefined && leaf.kind !== "text") {
    return { error: "Chỉ clip chữ mới sửa được nội dung text." };
  }
  const oldCurve = leafCurveOf(leaf);
  const hasCurvePatch = patch.speedKeyframes !== undefined;
  if (hasCurvePatch && leaf.kind !== "video" && leaf.kind !== "audio") {
    return { error: "Chỉ clip video/audio mới đặt được speed curve." };
  }
  // --- Tốc độ: tính duration mới TRƯỚC kiểm tra biên/đè (xem header). ---
  let newDuration = patch.duration ?? leaf.duration;
  let newOut: number | undefined;
  if (patch.speed !== undefined) {
    if (leaf.kind !== "video" && leaf.kind !== "audio") {
      return { error: "Chỉ clip video/audio mới đổi được tốc độ." };
    }
    if (!Number.isFinite(patch.speed) || patch.speed < 0.25 || patch.speed > 4) {
      return { error: "Tốc độ của clip con phải trong khoảng 0.25–4." };
    }
    if (!hasCurvePatch && oldCurve && oldCurve.keyframes.length > 0) {
      return {
        error:
          "Clip con đang có speed curve: thay speed curve trước khi đổi tốc độ hằng.",
      };
    }
    const src = deepLeafSource(leaf);
    if (!src) {
      return { error: "Clip con không có đoạn nguồn in/out nên không tính được duration theo tốc độ." };
    }
    if (hasCurvePatch) {
      // Curve mới thắng về ánh xạ thời gian: duration giữ nguyên (hoặc
      // theo duration tường minh của patch), không suy từ speed hằng.
    } else if (patch.duration !== undefined) {
      newOut = src.in + newDuration * patch.speed;
    } else {
      newDuration = (src.out - src.in) / patch.speed;
    }
  }
  const newStart = patch.start ?? leaf.start;
  if (!Number.isFinite(newStart) || newStart < 0) {
    return { error: "Start của clip con phải >= 0." };
  }
  if (!Number.isFinite(newDuration) || newDuration < 0.2) {
    return { error: "Duration của clip con phải >= 0.2s." };
  }
  if (newStart + newDuration > parentDuration + N3_EPS) {
    return { error: "Clip con vượt ngoài compound clip cha trực tiếp." };
  }
  for (const other of siblings) {
    if (overlapsAt(newStart, newDuration, other.start, other.duration)) {
      return { error: "Clip con mới đè lên clip khác trong compound clip." };
    }
  }
  // --- Curve đi theo trim (luật R5, chỉ khi patch không thay curve). ---
  let curveDropped = 0;
  let curveTouched = false;
  let curveNext: SpeedCurve | undefined;
  const oldEnd = leaf.start + leaf.duration;
  const newEnd = newStart + newDuration;
  const dxStart = newStart - leaf.start;
  const dxEnd = newEnd - oldEnd;
  if (
    !hasCurvePatch &&
    oldCurve && oldCurve.keyframes.length > 0 &&
    (leaf.kind === "video" || leaf.kind === "audio") &&
    (Math.abs(dxStart) > N3_EPS || Math.abs(dxEnd) > N3_EPS) &&
    Math.abs(dxStart - dxEnd) > N3_EPS
  ) {
    const adj = trimSpeedKeyframes(oldCurve.keyframes, dxStart, newDuration);
    curveTouched = true;
    curveDropped = adj.dropped;
    curveNext = adj.keyframes.length > 0 ? { keyframes: adj.keyframes } : undefined;
  }
  const updatedRec: Record<string, unknown> = {
    ...leaf,
    start: newStart,
    duration: newDuration,
    ...(patch.text !== undefined ? { text: patch.text } : {}),
    ...(patch.speed !== undefined ? { speed: patch.speed } : {}),
    ...(newOut !== undefined ? { out: newOut } : {}),
  };
  if (hasCurvePatch) {
    updatedRec["speedKeyframes"] = patch.speedKeyframes;
  } else if (curveTouched) {
    if (curveNext) updatedRec["speedKeyframes"] = curveNext;
    else delete updatedRec["speedKeyframes"];
  }
  return { clip: updatedRec as unknown as Clip, curveDropped };
}

/**
 * Sửa 1 clip lá ở cấp sâu trong compound clip ngoài cùng (đợt 17 N3).
 * hostTrackId/topId xác định top trên timeline ngoài; chainIds đi từ
 * con trực tiếp của top xuống nested chứa trực tiếp lá; innerTrackId/
 * innerClipId là track/clip của lá trong tầng cha trực tiếp đó.
 * Trả về spec mới + top mới + curveDropped, hoặc { error }.
 */
export function updateNestedDeepInnerClip(
  spec: VideoSpec,
  hostTrackId: string,
  topId: string,
  chainIds: string[],
  innerTrackId: string,
  innerClipId: string,
  patch: NestedDeepPatch,
): { spec: VideoSpec; nested: NestedClip; curveDropped?: number } | { error: string } {
  const host = trackOf(spec, hostTrackId);
  if (!host) return { error: `Không tìm thấy track ${hostTrackId}.` };
  if (host.locked) return { error: `Track "${host.label ?? host.kind}" đang khóa.` };
  const found = clipOf(host, topId);
  const top = found ? asNestedClip(found) : null;
  if (!top) return { error: "Clip này không phải nested clip." };
  const resolved = resolveDeepLevels(top, chainIds);
  if ("error" in resolved) return resolved;
  const levels = resolved.levels;
  const parent = levels[levels.length - 1];
  const parentTrack = parent.subSpec.tracks.find((t) => t.id === innerTrackId);
  if (!parentTrack) return { error: `Không tìm thấy track con ${innerTrackId}.` };
  const leaf = parentTrack.clips.find((c) => c.id === innerClipId);
  if (!leaf) return { error: `Không tìm thấy clip con ${innerClipId}.` };
  if (isNestedClip(leaf)) {
    return { error: "Clip đích là nested clip — nối chain dài hơn để sửa clip bên trong nó." };
  }
  // Đợt 21 T2 — nới guard hai tầng theo luật render R1 (đợt 20):
  // render nay HỢP curve hai tầng thật nên patch đặt curve lên lá mà
  // một tầng tổ tiên trong chain (kể cả top) đã mang curve chỉ còn bị
  // từ chối khi cặp đó vi phạm R1 (curve không hợp lệ, reverse,
  // attachment thời gian, lá phi-media, tốc độ hợp vượt [0.25, 4]) —
  // xem checkTwoLevelLeafCurve. Cặp hợp lệ được cho qua; chặn thừa
  // curve hằng của G2 đợt 19 nay cũng bỏ vì render §1c xử lý hằng
  // đúng hệt bằng slice.
  if (patch.speedKeyframes !== undefined && patch.speedKeyframes.keyframes.length > 0) {
    const check = checkTwoLevelLeafCurve(
      levels,
      leaf,
      patch.speedKeyframes,
      patch.start ?? leaf.start,
      patch.duration ?? leaf.duration,
    );
    if (!check.ok) {
      return { error: `Không tạo được trạng thái hai tầng: ${check.reason}` };
    }
  }
  const siblings = parentTrack.clips.filter((c) => c.id !== innerClipId);
  const applied = applyDeepLeafPatch(leaf, patch, parent.duration, siblings);
  if ("error" in applied) return applied;
  const newLeafTrack: Track = {
    ...parentTrack,
    clips: parentTrack.clips.map((c) => (c.id === innerClipId ? applied.clip : c)),
  };
  // Guard nguồn của cha trực tiếp: sửa lá không được phá bất biến
  // duration của cha. Tính đủ mọi track của cha (track lá đã sửa + các
  // track khác giữ nguyên) để không kết luận sai khi track lá không
  // phải track dài nhất.
  // - Cha ghi trim tường minh: chỉ cấm nguồn mới co dưới trim.out
  //   (nguồn dài thêm thì trim vẫn nằm trong nguồn, cha vẫn hợp lệ).
  // - Cha không ghi trim (= "phát toàn bộ"): duration của cha bằng
  //   đúng độ dài nguồn / speed, nên nguồn thay đổi theo hướng nào
  //   cũng làm duration cha lệch → từ chối (sửa duration/trim của cha
  //   trước rồi sửa lại lá).
  const oldSource = parent.subSpec.tracks.reduce(
    (m, t) => Math.max(m, ...t.clips.map((c) => c.start + c.duration)),
    0,
  );
  const newSource = parent.subSpec.tracks.reduce(
    (m, t) => Math.max(m, ...(t.id === newLeafTrack.id ? newLeafTrack.clips : t.clips).map((c) => c.start + c.duration)),
    0,
  );
  if (parent.trim !== undefined) {
    if (parent.trim.out > newSource + N3_EPS) {
      return {
        error:
          "Clip con thu ngắn làm độ dài nguồn của compound clip cha co lại dưới trim.out của cha — trim cha trước rồi sửa lại.",
      };
    }
  } else if (Math.abs(newSource - oldSource) > N3_EPS) {
    return {
      error:
        "Clip con làm đổi độ dài nguồn của compound clip cha (cha không ghi trim nên duration cha bằng đúng độ dài nguồn) — sửa duration/trim của cha trước rồi sửa lại lá.",
    };
  }
  const newTop = rebuildDeepLevels(levels, newLeafTrack);
  const tracks = spec.tracks.map((t) =>
    t.id === hostTrackId
      ? { ...t, clips: t.clips.map((c) => (c.id === topId ? (newTop as unknown as Clip) : c)) }
      : t,
  );
  return { spec: { ...spec, tracks }, nested: newTop, curveDropped: applied.curveDropped };
}

/**
 * Tách 1 clip lá ở cấp sâu thành 2 tại splitTime (khung thời gian của
 * tầng cha trực tiếp — cùng khung với leaf.start). Hai nửa vẫn nằm
 * trong track cha, tổng độ dài và max end không đổi nên trim/duration
 * của mọi tầng tổ tiên giữ nguyên. Margin 0.05s áp ngay tại đây (xem
 * header N3). Trả về spec mới + top mới + 2 nửa, hoặc { error }.
 */
export function splitNestedDeepInnerClip(
  spec: VideoSpec,
  hostTrackId: string,
  topId: string,
  chainIds: string[],
  innerTrackId: string,
  innerClipId: string,
  splitTime: number,
  idGen: IdGen,
): { spec: VideoSpec; nested: NestedClip; left: Clip; right: Clip } | { error: string } {
  const host = trackOf(spec, hostTrackId);
  if (!host) return { error: `Không tìm thấy track ${hostTrackId}.` };
  if (host.locked) return { error: `Track "${host.label ?? host.kind}" đang khóa.` };
  const found = clipOf(host, topId);
  const top = found ? asNestedClip(found) : null;
  if (!top) return { error: "Clip này không phải nested clip." };
  const resolved = resolveDeepLevels(top, chainIds);
  if ("error" in resolved) return resolved;
  const levels = resolved.levels;
  const parent = levels[levels.length - 1];
  const parentTrack = parent.subSpec.tracks.find((t) => t.id === innerTrackId);
  if (!parentTrack) return { error: `Không tìm thấy track con ${innerTrackId}.` };
  const leaf = parentTrack.clips.find((c) => c.id === innerClipId);
  if (!leaf) return { error: `Không tìm thấy clip con ${innerClipId}.` };
  if (isNestedClip(leaf)) {
    return { error: "Clip đích là nested clip — nối chain dài hơn để tách clip bên trong nó." };
  }
  if (!Number.isFinite(splitTime)) return { error: "Điểm tách không hợp lệ." };
  if (
    splitTime <= leaf.start + N3_SPLIT_MARGIN ||
    splitTime >= leaf.start + leaf.duration - N3_SPLIT_MARGIN
  ) {
    return { error: "Điểm tách quá sát mép clip con (margin 0.05s)." };
  }
  const leftDur = splitTime - leaf.start;
  const rightDur = leaf.start + leaf.duration - splitTime;
  let left: Clip;
  let right: Clip;
  if (leaf.kind === "text" || leaf.kind === "sticker" || leaf.kind === "image") {
    left = { ...leaf, duration: leftDur };
    right = { ...leaf, id: idGen(), start: splitTime, duration: rightDur };
  } else if (leaf.kind === "video" || leaf.kind === "audio") {
    const src = deepLeafSource(leaf);
    if (!src) return { error: "Clip con không có đoạn nguồn in/out nên không tách được." };
    const curve = leafCurveOf(leaf);
    if (curve && curve.keyframes.length > 0) {
      if ((leaf as unknown as { reverse?: boolean }).reverse === true) {
        return { error: "Không tách được clip con reverse đang có speed curve (validator cấm tổ hợp này)." };
      }
      // Điểm cắt nguồn theo ramp (đợt 14): in + ∫speed trên nửa trái.
      const cutSrc = src.in + sourcePosAt(curve, leftDur);
      const sp = splitSpeedKeyframes(curve.keyframes, leftDur, leaf.duration);
      const baseLeft: Record<string, unknown> = {
        ...leaf, duration: leftDur, in: src.in, out: cutSrc,
        speedKeyframes: { keyframes: sp.left },
      };
      const baseRight: Record<string, unknown> = {
        ...leaf, id: idGen(), start: splitTime, duration: rightDur,
        in: cutSrc, out: src.out, speedKeyframes: { keyframes: sp.right },
      };
      if (leaf.kind === "video") {
        baseLeft["transitionOut"] = { type: "none", duration: 0 };
        baseRight["transitionIn"] = { type: "none", duration: 0 };
      }
      left = baseLeft as unknown as Clip;
      right = baseRight as unknown as Clip;
    } else {
      // Không curve: splitSourceAt đúng cả tốc độ hằng lẫn reverse
      // (cùng hàm store splitClipAt dùng cho clip thường).
      const cut = splitSourceAt(
        leaf as unknown as Parameters<typeof splitSourceAt>[0],
        splitTime,
      );
      const speed = src.speed;
      const lDur = (cut.leftOut - cut.leftIn) / speed;
      const rDur = (cut.rightOut - cut.rightIn) / speed;
      const baseLeft: Record<string, unknown> = {
        ...leaf, duration: lDur, in: cut.leftIn, out: cut.leftOut,
      };
      const baseRight: Record<string, unknown> = {
        ...leaf, id: idGen(), start: splitTime, duration: rDur,
        in: cut.rightIn, out: cut.rightOut,
      };
      if (leaf.kind === "video") {
        baseLeft["transitionOut"] = { type: "none", duration: 0 };
        baseRight["transitionIn"] = { type: "none", duration: 0 };
      }
      left = baseLeft as unknown as Clip;
      right = baseRight as unknown as Clip;
    }
  } else {
    return { error: `Không tách được clip con kind "${leaf.kind}".` };
  }
  const newLeafTrack: Track = {
    ...parentTrack,
    clips: parentTrack.clips.flatMap((c) =>
      c.id === innerClipId ? [left, right] : [c],
    ),
  };
  const newTop = rebuildDeepLevels(levels, newLeafTrack);
  const tracks = spec.tracks.map((t) =>
    t.id === hostTrackId
      ? { ...t, clips: t.clips.map((c) => (c.id === topId ? (newTop as unknown as Clip) : c)) }
      : t,
  );
  return { spec: { ...spec, tracks }, nested: newTop, left, right };
}

/** Liệt kê nested clip trong spec (kèm track chứa nó). */
export function listNestedClips(spec: VideoSpec): { trackId: string; clip: NestedClip }[] {
  const out: { trackId: string; clip: NestedClip }[] = [];
  for (const t of spec.tracks) {
    for (const c of t.clips) {
      const n = asNestedClip(c);
      if (n) out.push({ trackId: t.id, clip: n });
    }
  }
  return out;
}

/** Liệt kê adjustment layer trong spec (kèm track host). */
export function listAdjustmentLayers(
  spec: VideoSpec,
): { trackId: string; clip: AdjustmentLayerRecord }[] {
  const out: { trackId: string; clip: AdjustmentLayerRecord }[] = [];
  for (const t of spec.tracks) {
    for (const c of t.clips) {
      const l = asAdjustmentLayer(c);
      if (l) out.push({ trackId: t.id, clip: l });
    }
  }
  return out.sort((a, b) => a.clip.start - b.clip.start);
}

/** Số clip gốc bên trong 1 nested clip (đếm qua mọi track của subSpec). */
export function nestedInnerCount(clip: NestedClip): number {
  return clip.subSpec.tracks.reduce((n, t) => n + t.clips.length, 0);
}

// ---- R7: thống nhất ngữ nghĩa nested/adjustment (Phase 9 round 7, UI only) ----
//
// QUYẾT ĐỊNH NGỮ NGHĨA (đọc kỹ trước khi sửa — đây là điểm mà R7 thống nhất):
// - CHUẨN LÀ `VideoSpec.adjustmentLayers` (cấp project, xem
//   packages/video-spec/src/adjustment.ts): panel từ R7 chỉ ghi layer mới
//   vào field này, KHÔNG tạo thêm bản ghi kind:"adjustment" trong
//   track.clips nữa. Các hàm legacy (add/move/trim/update/delete +
//   listAdjustmentLayers) vẫn giữ nguyên để hàng FX của Timeline và các
//   project cũ còn chạy — chúng chỉ còn phục vụ layer legacy, không phải
//   đường tạo layer mới.
// - Spec layer KHÁC legacy ở 2 điểm, panel không được áp nhầm luật cũ:
//   (a) các layer spec ĐƯỢC chồng nhau về thời gian (spec nối filter tuần
//   tự, validateAdjustmentLayer không cấm đè nhau) — hàm add/update spec
//   dưới đây KHÔNG chặn overlap; (b) thứ tự mảng = thứ tự áp filter
//   (layer sau ở ngoài cùng) nên update KHÔNG sắp xếp lại mảng theo start.
// - SCOPE (parent tích hợp đợt 7, sau khi U1 thêm field `tracks` vào
//   AdjustmentLayer của video-spec): scope "all" = không ghi field tracks
//   (áp mọi track, tương thích project cũ); scope { trackIndices } = ghi
//   `tracks: [...]` (chỉ số vào spec.tracks cấp project). Render (U2) dịch
//   scope qua lineage khi flatten nên track lồng nhau vẫn đúng tập track
//   lá; preview (U3) xét trackStack[0] cho layer cấp project. Xem
//   docs/PHASE9_ROUND7_NESTED_UNIFY_LIMITS.md — nợ scope của R7 đã đóng.
// - NESTED BOUNDARY: NestedClip của spec KHÔNG có field opacity /
//   transitionIn / transitionOut, nhưng preview (nestedPreview.ts, R3) và
//   render (server/render/src/nested.js, R3) đều đọc chúng bằng duck-typing
//   nên panel ghi chúng qua cast Record — cùng pattern `as unknown as` mà
//   file này vẫn dùng cho layer legacy. R7 validate fail-fast ở tầng ghi:
//   chỉ type "fade", duration < độ dài nested, không đặt cả hai đầu, và
//   transition mỗi đầu BẮT BUỘC có clip kề chạm đúng biên (không gap) —
//   chặt hơn R3 ở chỗ R3 chỉ warning + bỏ qua khi nested là clip đầu
//   track, còn panel từ chối luôn để tránh "đặt xong mà không có tác
//   dụng" lặng lẽ. Các ràng buộc ở tầng lá (lá biên phải là video/text,
//   dài hơn T, không có sẵn keyframes opacity...) KHÔNG kiểm tra được ở
//   đây — preview/render vẫn throw như R3, xem R7_UI_LIMITS.md §2.

/**
 * Phạm vi áp dụng của 1 spec adjustment layer (field `tracks?: number[]`
 * của AdjustmentLayer — chỉ số vào `spec.tracks` cấp project).
 * "all" = mọi track (không ghi field tracks);
 * { trackIndices } = chỉ các track đó.
 */
export type SpecAdjustmentScope = "all" | { trackIndices: number[] };

/** Draft tạo 1 spec adjustment layer từ panel (filter đơn = 1 video effect). */
export interface SpecAdjustmentDraft {
  filterType: string;
  intensity: number;
  start: number;
  duration: number;
  scope: SpecAdjustmentScope;
}

/** Patch sửa 1 spec adjustment layer (field nào vắng thì giữ nguyên). */
export interface SpecAdjustmentPatch {
  start?: number;
  duration?: number;
  /** Chỉ sửa được khi layer hiện tại là filter đơn (xem specLayerToLegacy). */
  filterType?: string;
  intensity?: number;
}

/**
 * Message cũ của U4 khi scope một track còn bị chặn (giữ export để code
 * ngoài không vỡ import; từ parent tích hợp đợt 7, scope một track đã
 * ghi được thật qua field `tracks` nên message này không còn dùng để chặn).
 */
export const SPEC_SCOPE_BLOCKED_MESSAGE =
  "Scope một track đã ghi được qua field tracks của AdjustmentLayer (đợt 7).";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function specLayersOf(spec: VideoSpec): AdjustmentLayer[] {
  return Array.isArray(spec.adjustmentLayers) ? spec.adjustmentLayers : [];
}

/**
 * Kiểm tra scope trước khi ghi: chỉ số phải nằm trong spec.
 * Trả về null khi ghi được, message lỗi khi không.
 */
function validateScopeForWrite(scope: SpecAdjustmentScope, spec: VideoSpec): string | null {
  if (scope === "all") return null;
  if (!Array.isArray(scope.trackIndices) || scope.trackIndices.length === 0) {
    return "Scope một track: cần chọn ít nhất 1 track.";
  }
  for (const i of scope.trackIndices) {
    if (!Number.isInteger(i) || i < 0 || i >= spec.tracks.length) {
      return `Scope một track: chỉ số track ${i} ngoài phạm vi (spec có ${spec.tracks.length} track).`;
    }
  }
  return null;
}

/**
 * Chuyển 1 layer legacy (kind "adjustment" trong track) sang layer chuẩn
 * spec: filterType legacy là 1 video effect nên filters = 1 entry effects
 * duy nhất, intensity giữ nguyên (cùng dải 0..1). Scope khác "all" → ghi
 * `tracks` tương ứng (giữ ngữ nghĩa host-track của legacy).
 */
export function legacyLayerToSpec(
  layer: AdjustmentLayerRecord,
  scope: SpecAdjustmentScope,
): { layer: AdjustmentLayer } | { error: string } {
  if (!isVideoEffectType(layer.filterType)) {
    return { error: `Filter "${layer.filterType}" không phải video effect hợp lệ nên không chuyển sang spec được.` };
  }
  if (!Number.isFinite(layer.intensity) || layer.intensity < 0 || layer.intensity > 1) {
    return { error: "Intensity của layer legacy phải trong khoảng 0..1." };
  }
  if (!Number.isFinite(layer.start) || layer.start < 0) {
    return { error: "Start của layer legacy phải >= 0." };
  }
  if (!Number.isFinite(layer.duration) || layer.duration <= 0) {
    return { error: "Duration của layer legacy phải > 0." };
  }
  // legacyLayerToSpec không nhận spec nên chỉ kiểm tra dạng scope ở đây;
  // kiểm tra chỉ số trong phạm vi thuộc về caller (add/convert) vốn có spec.
  if (scope !== "all" && (!Array.isArray(scope.trackIndices) || scope.trackIndices.length === 0)) {
    return { error: "Scope một track: cần chọn ít nhất 1 track." };
  }
  return {
    layer: {
      id: layer.id,
      start: layer.start,
      duration: layer.duration,
      filters: [{ effects: [{ type: layer.filterType, intensity: round2(layer.intensity) }] }],
      ...(scope === "all" ? {} : { tracks: [...scope.trackIndices] }),
    },
  };
}

/**
 * Đọc 1 spec layer dưới dạng legacy khi có thể: đúng 1 filter entry, chỉ
 * có effects, đúng 1 effect. Layer phức tạp (LUT/color/nhiều effect/không
 * có effect) → null: panel vẫn hiển thị + sửa được thời gian nhưng không
 * sửa được filter (xem updateSpecAdjustmentLayer).
 */
export function specLayerToLegacy(layer: AdjustmentLayer): AdjustmentLayerRecord | null {
  if (layer.filters.length !== 1) return null;
  const f = layer.filters[0];
  if (f.lut !== undefined || f.color !== undefined) return null;
  if (!Array.isArray(f.effects) || f.effects.length !== 1) return null;
  const e = f.effects[0];
  if (!isVideoEffectType(e.type)) return null;
  return {
    kind: "adjustment",
    id: layer.id,
    start: layer.start,
    duration: layer.duration,
    filterType: e.type,
    // EFFECT_DEFAULT_INTENSITY của effects.ts = 0.5 (không import runtime
    // thêm để khỏi phình import — giá trị này là default của spec).
    intensity: typeof e.intensity === "number" ? e.intensity : 0.5,
  };
}

/** Liệt kê layer chuẩn spec, sắp xếp theo start chỉ để hiển thị. */
export function listSpecAdjustmentLayers(spec: VideoSpec): AdjustmentLayer[] {
  return [...specLayersOf(spec)].sort((a, b) => a.start - b.start);
}

/** 1 dòng trong danh sách hợp nhất của panel (spec + legacy). */
export interface UnifiedAdjustmentLayer {
  origin: "spec" | "legacy";
  id: string;
  start: number;
  duration: number;
  /** Layer spec (null khi là legacy). */
  specLayer: AdjustmentLayer | null;
  /** Bản legacy tương đương (null khi spec layer phức tạp). */
  legacyLayer: AdjustmentLayerRecord | null;
  /** Track host của layer legacy (null khi là spec). */
  legacyHostTrackId: string | null;
  /** true khi spec layer phức tạp — panel chỉ sửa được thời gian. */
  complex: boolean;
  /** Nhãn filter hiển thị: tên effect, hoặc "phức tạp". */
  filterLabel: string;
  /** Cường độ hiển thị (null khi phức tạp). */
  intensity: number | null;
}

/** Danh sách hợp nhất spec + legacy, sắp xếp theo start để hiển thị. */
export function listUnifiedAdjustmentLayers(spec: VideoSpec): UnifiedAdjustmentLayer[] {
  const out: UnifiedAdjustmentLayer[] = [];
  for (const l of specLayersOf(spec)) {
    const legacy = specLayerToLegacy(l);
    out.push({
      origin: "spec",
      id: l.id,
      start: l.start,
      duration: l.duration,
      specLayer: l,
      legacyLayer: legacy,
      legacyHostTrackId: null,
      complex: legacy === null,
      filterLabel: legacy ? legacy.filterType : "phức tạp",
      intensity: legacy ? legacy.intensity : null,
    });
  }
  for (const { trackId, clip } of listAdjustmentLayers(spec)) {
    out.push({
      origin: "legacy",
      id: clip.id,
      start: clip.start,
      duration: clip.duration,
      specLayer: null,
      legacyLayer: clip,
      legacyHostTrackId: trackId,
      complex: false,
      filterLabel: clip.filterType,
      intensity: clip.intensity,
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Thêm 1 adjustment layer CHUẨN vào spec.adjustmentLayers.
 * KHÔNG tạo bản ghi kind:"adjustment" trong track.clips, KHÔNG chặn
 * overlap (spec nối filter tuần tự — xem header R7). Trùng id → error.
 */
export function addSpecAdjustmentLayer(
  spec: VideoSpec,
  draft: SpecAdjustmentDraft,
  idGen: IdGen,
): { spec: VideoSpec; layer: AdjustmentLayer } | { error: string } {
  if (!isVideoEffectType(draft.filterType)) {
    return { error: `Filter "${draft.filterType}" không phải video effect hợp lệ.` };
  }
  if (!Number.isFinite(draft.intensity) || draft.intensity < 0 || draft.intensity > 1) {
    return { error: "Intensity phải trong khoảng 0..1." };
  }
  if (!Number.isFinite(draft.start) || draft.start < 0) {
    return { error: "Start phải >= 0." };
  }
  if (!Number.isFinite(draft.duration) || draft.duration < 0.2) {
    return { error: "Duration phải >= 0.2s." };
  }
  const scopeErr = validateScopeForWrite(draft.scope, spec);
  if (scopeErr) return { error: scopeErr };
  const id = idGen();
  if (specLayersOf(spec).some((l) => l.id === id)) {
    return { error: `Trùng id layer "${id}" — thử lại.` };
  }
  const layer: AdjustmentLayer = {
    id,
    start: round2(draft.start),
    duration: round2(draft.duration),
    filters: [{ effects: [{ type: draft.filterType, intensity: round2(draft.intensity) }] }],
    ...(draft.scope === "all" ? {} : { tracks: [...draft.scope.trackIndices] }),
  };
  return { spec: { ...spec, adjustmentLayers: [...specLayersOf(spec), layer] }, layer };
}

/**
 * Sửa 1 spec layer: thời gian luôn sửa được; filter chỉ sửa được khi layer
 * hiện tại là filter đơn (layer phức tạp → error, không sửa nửa vời).
 * Thứ tự mảng giữ nguyên (thứ tự = thứ tự áp filter).
 */
export function updateSpecAdjustmentLayer(
  spec: VideoSpec,
  layerId: string,
  patch: SpecAdjustmentPatch,
): { spec: VideoSpec; layer: AdjustmentLayer } | { error: string } {
  const layers = specLayersOf(spec);
  const idx = layers.findIndex((l) => l.id === layerId);
  if (idx < 0) return { error: `Không tìm thấy adjustment layer ${layerId}.` };
  const cur = layers[idx];
  const newStart = patch.start ?? cur.start;
  const newDuration = patch.duration ?? cur.duration;
  if (!Number.isFinite(newStart) || newStart < 0) {
    return { error: "Start của layer phải >= 0." };
  }
  if (!Number.isFinite(newDuration) || newDuration < 0.2) {
    return { error: "Duration của layer phải >= 0.2s." };
  }
  let filters = cur.filters;
  if (patch.filterType !== undefined || patch.intensity !== undefined) {
    const legacy = specLayerToLegacy(cur);
    if (!legacy) {
      return { error: "Layer này phức tạp (LUT/color/nhiều effect) nên panel chưa sửa được filter — chỉ sửa được thời gian." };
    }
    const ft = patch.filterType ?? legacy.filterType;
    const inten = patch.intensity ?? legacy.intensity;
    if (!isVideoEffectType(ft)) {
      return { error: `Filter "${ft}" không phải video effect hợp lệ.` };
    }
    if (!Number.isFinite(inten) || inten < 0 || inten > 1) {
      return { error: "Intensity phải trong khoảng 0..1." };
    }
    filters = [{ effects: [{ type: ft, intensity: round2(inten) }] }];
  }
  const layer: AdjustmentLayer = {
    ...cur,
    start: round2(newStart),
    duration: round2(newDuration),
    filters,
  };
  const next = [...layers];
  next[idx] = layer;
  return { spec: { ...spec, adjustmentLayers: next }, layer };
}

/** Xoá 1 spec layer (không ripple). Không tìm thấy → null. */
export function deleteSpecAdjustmentLayer(spec: VideoSpec, layerId: string): VideoSpec | null {
  const layers = specLayersOf(spec);
  if (!layers.some((l) => l.id === layerId)) return null;
  return { ...spec, adjustmentLayers: layers.filter((l) => l.id !== layerId) };
}

/**
 * Chuyển 1 layer legacy thành layer chuẩn: gỡ bản ghi kind:"adjustment"
 * khỏi track host, thêm layer spec cùng id (id đã có trong spec thì cấp
 * id mới — panel so sánh layer.id với id cũ để biết). Scope khác "all"
 * → error, không chuyển nửa vời.
 */
export function convertLegacyLayerToSpec(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
  scope: SpecAdjustmentScope,
  idGen: IdGen,
): { spec: VideoSpec; layer: AdjustmentLayer } | { error: string } {
  const track = trackOf(spec, trackId);
  if (!track) return { error: `Không tìm thấy track ${trackId}.` };
  const found = track.clips.find((c) => c.id === clipId);
  const legacy = found ? asAdjustmentLayer(found) : null;
  if (!legacy) return { error: "Clip này không phải adjustment layer legacy." };
  const conv = legacyLayerToSpec(legacy, scope);
  if ("error" in conv) return conv;
  let layer = conv.layer;
  if (specLayersOf(spec).some((l) => l.id === layer.id)) {
    layer = { ...layer, id: idGen() };
  }
  const tracks = spec.tracks.map((t) =>
    t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t,
  );
  return {
    spec: { ...spec, tracks, adjustmentLayers: [...specLayersOf(spec), layer] },
    layer,
  };
}

// ---- R7: transition / opacity trên nested clip (xem header R7) ----

/** Transition qua biên nested, shape tối thiểu mà R3 đọc (duck-typed). */
export interface NestedBoundaryTransition {
  type: string;
  duration: number;
}

/** Patch đặt/xoá field biên trên nested clip (null = xoá field đó). */
export interface NestedBoundaryPatch {
  opacity?: number | null;
  transitionIn?: NestedBoundaryTransition | null;
  transitionOut?: NestedBoundaryTransition | null;
}

/** Field biên hiện tại của 1 nested clip (đọc duck-typed, giống R3). */
export interface NestedBoundaryView {
  opacity?: number;
  transitionIn?: NestedBoundaryTransition;
  transitionOut?: NestedBoundaryTransition;
}

function readTransitionField(
  clip: unknown,
  field: "transitionIn" | "transitionOut",
): NestedBoundaryTransition | undefined {
  if (!clip || typeof clip !== "object") return undefined;
  const rec = clip as Record<string, unknown>;
  const v = rec[field];
  if (!v || typeof v !== "object") return undefined;
  const type = (v as Record<string, unknown>)["type"];
  const duration = (v as Record<string, unknown>)["duration"];
  if (typeof type !== "string" || typeof duration !== "number" || !Number.isFinite(duration)) {
    return undefined;
  }
  return { type, duration };
}

/** Đọc field biên hiện tại của 1 nested clip (field lạ/không hợp lệ → bỏ qua). */
export function readNestedBoundary(clip: NestedClip): NestedBoundaryView {
  const rec = clip as unknown as Record<string, unknown>;
  const view: NestedBoundaryView = {};
  const op = rec["opacity"];
  if (typeof op === "number" && Number.isFinite(op)) view.opacity = op;
  const inT = readTransitionField(clip, "transitionIn");
  if (inT) view.transitionIn = inT;
  const outT = readTransitionField(clip, "transitionOut");
  if (outT) view.transitionOut = outT;
  return view;
}

function validateBoundaryTransition(
  side: "vào" | "ra",
  tr: NestedBoundaryTransition,
  nestedDuration: number,
): string | null {
  if (tr.type !== "fade") {
    return (
      `Transition qua biên nested chỉ hỗ trợ "fade" (R3) — type "${tr.type}" sẽ bị ` +
      "preview/render từ chối nên panel không ghi. Hãy chọn fade hoặc bỏ transition này."
    );
  }
  if (!Number.isFinite(tr.duration) || tr.duration <= 0) {
    return `Duration transition ${side} phải > 0.`;
  }
  if (tr.duration >= nestedDuration) {
    return `Duration transition ${side} (${tr.duration}s) phải nhỏ hơn độ dài nested clip (${nestedDuration}s).`;
  }
  return null;
}

/**
 * Đặt/xoá opacity + transition qua biên trên 1 nested clip (fail-fast).
 * - opacity: 0..1 (null = xoá, về mặc định 1).
 * - transitionIn/Out: chỉ "fade", duration < độ dài nested, không đặt cả
 *   hai đầu, và mỗi đầu BẮT BUỘC có clip kề chạm đúng biên trên cùng track
 *   (không gap) — nếu clip kề cũng khai transition phía đối diện thì phải
 *   khớp type + duration, ngược lại R3 sẽ throw khi phẳng.
 * - host track phải là video (R3 bỏ qua ở track khác) và không khóa.
 * Trả về spec mới + nested đã cập nhật, hoặc { error } (không sửa nửa vời).
 */
export function setNestedClipBoundary(
  spec: VideoSpec,
  hostTrackId: string,
  nestedId: string,
  patch: NestedBoundaryPatch,
): { spec: VideoSpec; nested: NestedClip } | { error: string } {
  const host = trackOf(spec, hostTrackId);
  if (!host) return { error: `Không tìm thấy track ${hostTrackId}.` };
  if (host.locked) return { error: `Track "${host.label ?? host.kind}" đang khóa.` };
  if (host.kind !== "video") {
    return { error: "Transition/opacity qua biên nested chỉ có tác dụng trên track video (R3 bỏ qua ở track khác)." };
  }
  const found = clipOf(host, nestedId);
  const nested = found ? asNestedClip(found) : null;
  if (!nested) return { error: "Clip này không phải nested clip." };
  const cur = readNestedBoundary(nested);
  const nextOpacity = patch.opacity === undefined ? cur.opacity : patch.opacity;
  const nextIn = patch.transitionIn === undefined ? cur.transitionIn : patch.transitionIn;
  const nextOut = patch.transitionOut === undefined ? cur.transitionOut : patch.transitionOut;

  if (
    nextOpacity !== undefined &&
    nextOpacity !== null &&
    (!Number.isFinite(nextOpacity) || nextOpacity < 0 || nextOpacity > 1)
  ) {
    return { error: "Opacity của nested clip phải trong khoảng 0..1." };
  }
  if (nextIn) {
    const err = validateBoundaryTransition("vào", nextIn, nested.duration);
    if (err) return { error: err };
  }
  if (nextOut) {
    const err = validateBoundaryTransition("ra", nextOut, nested.duration);
    if (err) return { error: err };
  }
  if (nextIn && nextOut) {
    return { error: "Nested clip không đặt được transition cả hai đầu cùng lúc (R3 từ chối cặp in + out)." };
  }

  const EPS = 1e-6;
  const nestedEnd = nested.start + nested.duration;
  const prev = host.clips.find(
    (c) => c.id !== nestedId && Math.abs(c.start + c.duration - nested.start) <= EPS,
  );
  const next = host.clips.find(
    (c) => c.id !== nestedId && Math.abs(c.start - nestedEnd) <= EPS,
  );
  if (nextIn) {
    if (!prev) {
      return { error: "Transition vào cần clip kề trước chạm đúng biên của nested clip (không có gap, không phải clip đầu track)." };
    }
    const prevOut = readTransitionField(prev, "transitionOut");
    if (
      prevOut &&
      (prevOut.type !== nextIn.type || Math.abs(prevOut.duration - nextIn.duration) > EPS)
    ) {
      return { error: `transitionIn không khớp transitionOut của clip kề trước (cần cùng type fade và cùng duration ${prevOut.duration}s).` };
    }
  }
  if (nextOut) {
    if (!next) {
      return { error: "Transition ra cần clip kề sau chạm đúng biên của nested clip (không có gap, không phải clip cuối track)." };
    }
    const nextInField = readTransitionField(next, "transitionIn");
    if (
      nextInField &&
      (nextInField.type !== nextOut.type || Math.abs(nextInField.duration - nextOut.duration) > EPS)
    ) {
      return { error: `transitionOut không khớp transitionIn của clip kề sau (cần cùng type fade và cùng duration ${nextInField.duration}s).` };
    }
  }

  const rec: Record<string, unknown> = { ...nested };
  if (nextOpacity === undefined || nextOpacity === null) delete rec["opacity"];
  else rec["opacity"] = nextOpacity;
  if (nextIn === undefined || nextIn === null) delete rec["transitionIn"];
  else rec["transitionIn"] = { type: nextIn.type, duration: nextIn.duration };
  if (nextOut === undefined || nextOut === null) delete rec["transitionOut"];
  else rec["transitionOut"] = { type: nextOut.type, duration: nextOut.duration };
  const updated = rec as unknown as NestedClip;
  const tracks = spec.tracks.map((t) =>
    t.id === hostTrackId
      ? { ...t, clips: t.clips.map((c) => (c.id === nestedId ? updated : c)) }
      : t,
  );
  return { spec: { ...spec, tracks }, nested: updated };
}
