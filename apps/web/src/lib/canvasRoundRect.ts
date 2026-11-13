/**
 * canvasRoundRect.ts — Phase 9 đợt 73, luồng A7 (audit Safari).
 *
 * `CanvasRenderingContext2D.roundRect` chỉ có từ Safari 16 (09/2022),
 * Chrome 99, Firefox 112. Code cũ trong preview.tsx gọi thẳng
 * `ctx.roundRect(...)` ở 2 chỗ vẽ nền chữ (text clip có backgroundColor):
 * trên Safari < 16 câu lệnh ném TypeError — vòng lặp rAF sống sót nhờ
 * `finally → scheduleNext` (preview.tsx ~dòng 4004) nên app không chết,
 * nhưng frame nào có text clip nền màu cũng ném + không vẽ được hộp nền.
 *
 * Helper này là feature-detect tại chỗ gọi: có `roundRect` thì dùng đúng
 * như cũ (bo góc 10px), không có thì rơi về `ctx.rect` (hộp vuông —
 * chữ vẫn vẽ đủ, chỉ mất bo góc). Không đụng tới CSS hay UA-sniffing.
 *
 * Kiểm chứng: apps/web/src/lib/canvasRoundRect73A7.test.ts (mock ctx,
 * không cần DOM/trình duyệt — chứng minh được trên Chromium/Node).
 */

export function pathRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    // Safari < 16 (và trình duyệt rất cũ): hộp vuông thay vì bo góc.
    ctx.rect(x, y, w, h);
  }
}
