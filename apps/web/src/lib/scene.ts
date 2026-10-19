/**
 * scene.ts — Logic thuần cho Scene Detection (R1-085).
 *
 * Chuyển đổi điểm cắt (source time, giây tuyệt đối theo file nguồn) thành
 * vị trí timeline để tách clip. Xử lý đúng speed và reverse.
 *
 * Không phụ thuộc DOM — test được bằng Node.
 */

import type { VideoClip } from "@repo-1/video-spec";

/** Biên an toàn: điểm cắt phải cách mép clip ít nhất ngần này giây. */
export const SCENE_SPLIT_MARGIN = 0.05;

/** Hai điểm tách quá gần nhau (< ngần này giây) thì bỏ điểm sau. */
export const SCENE_MIN_SPLIT_GAP = 0.3;

/**
 * Đổi 1 điểm cắt (source time) thành vị trí timeline.
 * - speed > 0, không reverse: timelineT = start + (cut - in) / speed
 * - reverse: timelineT = start + (out - cut) / speed
 * Trả về null nếu cut nằm ngoài [in, out] của clip.
 */
export function sourceCutToTimeline(clip: VideoClip, cut: number): number | null {
  const speed = clip.speed ?? 1;
  if (!(speed > 0)) return null;
  const reverse = clip.reverse ?? false;
  if (cut < clip.in - 1e-6 || cut > clip.out + 1e-6) return null;
  const t = reverse
    ? clip.start + (clip.out - cut) / speed
    : clip.start + (cut - clip.in) / speed;
  return t;
}

/**
 * Lọc + đổi toàn bộ cuts thành vị trí timeline hợp lệ để tách:
 * - chỉ giữ cut nằm hẳn trong clip (cách mép >= SCENE_SPLIT_MARGIN)
 * - sắp xếp tăng dần, bỏ điểm quá gần nhau (< SCENE_MIN_SPLIT_GAP)
 * - làm tròn về 3 chữ số thập phân
 */
export function cutsToTimelineTimes(clip: VideoClip, cuts: number[]): number[] {
  const times: number[] = [];
  for (const cut of cuts) {
    const t = sourceCutToTimeline(clip, cut);
    if (t === null) continue;
    if (t <= clip.start + SCENE_SPLIT_MARGIN) continue;
    if (t >= clip.start + clip.duration - SCENE_SPLIT_MARGIN) continue;
    times.push(Math.round(t * 1000) / 1000);
  }
  times.sort((a, b) => a - b);
  const merged: number[] = [];
  for (const t of times) {
    if (merged.length > 0 && t - merged[merged.length - 1] < SCENE_MIN_SPLIT_GAP) {
      continue;
    }
    merged.push(t);
  }
  return merged;
}

/** Định dạng giây thành timecode HH:MM:SS.mmm để hiện trong modal review. */
export function formatCutTime(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const secStr = ss < 10 ? `0${ss.toFixed(3)}` : ss.toFixed(3);
  return `${pad(h)}:${pad(m)}:${secStr}`;
}

/** Response của POST /api/scene (type dùng chung cho modal). */
export interface SceneDetectResult {
  cuts: number[];
  duration: number | null;
  threshold: number;
  count: number;
}
