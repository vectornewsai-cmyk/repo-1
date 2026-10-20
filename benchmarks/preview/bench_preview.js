/**
 * bench_preview.js — Đo FPS preview trong browser (CHẠY THỦ CÔNG).
 *
 * Subagent không có browser thật nên script này KHÔNG chạy tự động.
 * Cách dùng:
 *   1. Mở VCut Studio (apps/web) trên browser thật, load 1 project có:
 *      - 1 video clip 1080p + 1 text overlay + 1 LUT + 1 effect
 *   2. Mở DevTools Console, paste đoạn code dưới, Enter.
 *   3. Bấm Play, để chạy 10 giây, đọc kết quả trong console.
 *
 * Đo: requestAnimationFrame delta trong 10s khi đang play -> avg FPS, p95 frame time.
 */
(function benchPreview() {
  const samples = [];
  let last = performance.now();
  const t0 = last;
  function tick(now) {
    samples.push(now - last);
    last = now;
    if (now - t0 < 10000) requestAnimationFrame(tick);
    else {
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      const sorted = [...samples].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      console.table({
        "Số frame": samples.length,
        "FPS trung bình": (1000 / avg).toFixed(1),
        "Frame time TB (ms)": avg.toFixed(2),
        "Frame time p95 (ms)": p95.toFixed(2),
      });
      console.log("Ghi các số này vào benchmarks/RESULTS.md (mục Preview FPS).");
    }
  }
  console.log("Bắt đầu đo 10s — hãy bấm Play ngay bây giờ.");
  requestAnimationFrame(tick);
})();
