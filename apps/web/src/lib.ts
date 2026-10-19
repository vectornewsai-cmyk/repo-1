/** Tiện ích dùng chung. */

/** ID ngẫu nhiên ngắn, đủ dùng cho clip/track trong editor. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Định dạng giây -> "mm:ss.d" (ví dụ 75.25 -> "01:15.2"). */
export function fmtTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const mm = String(m).padStart(2, "0");
  const ss = rest < 10 ? `0${rest.toFixed(1)}` : rest.toFixed(1);
  return `${mm}:${ss}`;
}

/** Chọn bước tick "đẹp" cho thước timeline sao cho khoảng cách pixel >= minPx. */
export function tickStep(pxPerSec: number, minPx = 72): number {
  const steps = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
  for (const st of steps) {
    if (st * pxPerSec >= minPx) return st;
  }
  return 600;
}
