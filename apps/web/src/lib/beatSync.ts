/**
 * beatSync.ts — Cắt clip theo beat (Phase 8 Q5).
 *
 * beat.py trả về beat theo thời gian MEDIA (thời gian trong file nhạc gốc).
 * Clip trên timeline có start (timeline) và in (điểm bắt đầu trong media).
 * Với clip chạy tốc độ 1 (speed mặc định), beat media B ứng với thời gian
 * timeline: start + (B - in). Beat nằm ngoài [start, start+duration] hoặc
 * quá sát mép (< 0.05s, tránh tạo mảnh vụn) thì bỏ qua.
 *
 * Hàm thuần túy, đã có test Node (beatSync.test.ts).
 */

export interface BeatClipLike {
  start: number;
  duration: number;
  /** Điểm bắt đầu trong media (giây, mặc định 0). */
  in?: number;
}

/** Beat media → thời gian timeline, đã lọc mép. */
export function beatsToTimelineTimes(
  beats: number[],
  clip: BeatClipLike,
): number[] {
  const inT = clip.in ?? 0;
  const s = clip.start;
  const e = clip.start + clip.duration;
  const out: number[] = [];
  for (const b of beats) {
    const t = s + (b - inT);
    if (t > s + 0.05 && t < e - 0.05) out.push(Math.round(t * 1000) / 1000);
  }
  return out.sort((a, b) => a - b);
}

/** Định dạng giây → "m:ss.mmm" để hiển thị danh sách điểm cắt. */
export function formatBeatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}
