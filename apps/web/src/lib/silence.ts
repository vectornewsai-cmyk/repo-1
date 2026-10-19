/**
 * silence.ts — Silence removal (R1-084, Batch H).
 *
 * Pure functions, không chạm DOM — test được bằng Node.
 *
 * `removeSilenceFromClip(spec, trackId, clipId, silences)`:
 * - silences: các khoảng lặng theo THỜI GIAN LOCAL của clip
 *   (offset giây từ clip.start, đã cắt theo [in,out) của clip và đã sắp xếp).
 * - Chia clip thành các "keep segment" (phần bù), mỗi segment là 1 clip mới
 *   với in/out nguồn đúng (dùng sourceTimeAt — đúng cả speed/reverse).
 * - Các keep segment dồn về trước để khép gap TRONG clip.
 * - Các clip đứng SAU trên cùng track dồn về trước đúng bằng tổng thời
 *   lượng đã cắt (ripple) — track khác không bị ảnh hưởng.
 * - Không mutate input.
 *
 * Chỉ áp dụng cho clip video/audio (có track tiếng). text/sticker/image → null.
 */
import type { Clip, Track, VideoSpec, SpeedableClip } from "@repo-1/video-spec";
import { sourceTimeAt, clipSpeed } from "@repo-1/video-spec";

const EPS = 1e-9;

export interface LocalSilence {
  start: number; // offset từ clip.start (giây), >= 0
  end: number;   // > start
}

export interface SilenceCutResult {
  spec: VideoSpec;
  /** Số khoảng lặng thực sự cắt (sau khi cắt biên + gộp). */
  cutCount: number;
  /** Tổng thời lượng đã cắt (giây timeline). */
  removedTotal: number;
  /** Số clip keep còn lại thay cho clip gốc. */
  keepCount: number;
}

let uidCounter = 0;
/** uid deterministic cho test; store thật truyền uid riêng nếu muốn. */
function defaultUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_sil${uidCounter}`;
}

/**
 * Chuẩn hóa silences: cắt theo [0, duration), bỏ khoảng rỗng, gộp giao nhau,
 * sắp xếp. Trả về mảng rỗng nếu không có gì để cắt.
 */
export function normalizeSilences(
  silences: LocalSilence[],
  duration: number
): LocalSilence[] {
  const clipped: LocalSilence[] = [];
  for (const s of silences) {
    const a = Math.max(0, s.start);
    const b = Math.min(duration, s.end);
    if (b - a > EPS) clipped.push({ start: a, end: b });
  }
  clipped.sort((x, y) => x.start - y.start);
  const merged: LocalSilence[] = [];
  for (const s of clipped) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end + EPS) {
      last.end = Math.max(last.end, s.end);
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

/**
 * Phần bù của silences (đã normalize) trong [0, duration) = các keep segment.
 */
export function keepSegments(
  silences: LocalSilence[],
  duration: number
): Array<{ start: number; end: number }> {
  const keep: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const s of silences) {
    if (s.start > cursor + EPS) keep.push({ start: cursor, end: s.start });
    cursor = Math.max(cursor, s.end);
  }
  if (cursor < duration - EPS) keep.push({ start: cursor, end: duration });
  return keep;
}

function sortedClips(clips: Clip[]): Clip[] {
  return [...clips].sort((a, b) => a.start - b.start);
}

/**
 * Tạo clip con cho keep segment [ks, ke) (local time) của clip gốc.
 * newStart đã bao gồm shift dồn gap.
 */
function subClip(
  clip: Clip,
  ks: number,
  ke: number,
  newStart: number,
  uid: (p: string) => string
): Clip {
  const srcA = sourceTimeAt(clip as SpeedableClip, clip.start + ks);
  const srcB = sourceTimeAt(clip as SpeedableClip, clip.start + ke);
  const speed = clipSpeed(clip as SpeedableClip);
  const base: Record<string, unknown> = {
    ...clip,
    id: uid("c"),
    start: newStart,
    duration: (Math.abs(srcB - srcA) / speed),
    in: Math.min(srcA, srcB),
    out: Math.max(srcA, srcB),
    transitionIn: { type: "none", duration: 0 },
    transitionOut: { type: "none", duration: 0 },
  };
  // keyframes theo local-time: dịch về gốc của clip con.
  if (Array.isArray((clip as { keyframes?: unknown[] }).keyframes)) {
    const kfs = (clip as { keyframes?: Array<{ t: number; [k: string]: unknown }> }).keyframes!;
    base.keyframes = kfs
      .filter((k) => k.t >= ks - EPS && k.t <= ke + EPS)
      .map((k) => ({ ...k, t: k.t - ks }));
  }
  return base as unknown as Clip;
}

/**
 * Đổi 1 khoảng lặng theo THỜI GIAN NGUỒN ([s, e) của file gốc) sang
 * thời gian LOCAL của clip (offset từ clip.start), đã cắt theo [in, out).
 * Trả về null nếu khoảng lặng không giao với đoạn nguồn của clip.
 * Đúng cả speed và reverse.
 */
export function sourceSilenceToLocal(
  clip: Clip,
  s: number,
  e: number
): LocalSilence | null {
  if (clip.kind !== "video" && clip.kind !== "audio") return null;
  const a = Math.max(s, clip.in);
  const b = Math.min(e, clip.out);
  if (b - a <= EPS) return null;
  const speed = clipSpeed(clip as SpeedableClip);
  const reversed = !!(clip as { reverse?: boolean }).reverse;
  let ls: number;
  let le: number;
  if (reversed) {
    // phát ngược: nguồn [a,b) ↔ local [(out-b)/speed, (out-a)/speed)
    ls = (clip.out - b) / speed;
    le = (clip.out - a) / speed;
  } else {
    ls = (a - clip.in) / speed;
    le = (b - clip.in) / speed;
  }
  if (le - ls <= EPS) return null;
  return { start: ls, end: le };
}

/**
 * Cắt các khoảng lặng khỏi 1 clip video/audio.
 * Trả về null nếu không cắt được (clip không tồn tại, không phải video/audio,
 * track khóa, hoặc không có khoảng lặng hợp lệ).
 */
export function removeSilenceFromClip(
  spec: VideoSpec,
  trackId: string,
  clipId: string,
  silences: LocalSilence[],
  uid: (p: string) => string = defaultUid
): SilenceCutResult | null {
  const track = spec.tracks.find((t) => t.id === trackId);
  if (!track) return null;
  if (track.locked) return null;
  const clip = track.clips.find((c) => c.id === clipId);
  if (!clip) return null;
  if (clip.kind !== "video" && clip.kind !== "audio") return null;

  const norm = normalizeSilences(silences, clip.duration);
  if (norm.length === 0) return null;
  const keep = keepSegments(norm, clip.duration);
  if (keep.length === 0) return null; // cả clip là khoảng lặng → không cắt hết

  const removedTotal = norm.reduce((a, s) => a + (s.end - s.start), 0);

  // Dựng các clip keep, dồn về trước (khép gap trong clip).
  let shift = 0;
  let si = 0;
  const newClips: Clip[] = [];
  for (const k of keep) {
    // cộng dồn silence đã qua trước segment này
    while (si < norm.length && norm[si].end <= k.start + EPS) {
      shift += norm[si].end - norm[si].start;
      si++;
    }
    newClips.push(subClip(clip, k.start, k.end, clip.start + k.start - shift, uid));
  }

  // Ripple: các clip đứng sau trên cùng track dồn về trước đúng removedTotal.
  const origEnd = clip.start + clip.duration;
  const restShifted = sortedClips(track.clips)
    .filter((c) => c.id !== clipId)
    .map((c) =>
      c.start >= origEnd - EPS ? { ...c, start: c.start - removedTotal } : c
    );

  const newTrack: Track = {
    ...track,
    clips: sortedClips([...restShifted, ...newClips]),
  };
  const newSpec: VideoSpec = {
    ...spec,
    tracks: spec.tracks.map((t) => (t.id === trackId ? newTrack : t)),
  };
  return {
    spec: newSpec,
    cutCount: norm.length,
    removedTotal,
    keepCount: newClips.length,
  };
}
