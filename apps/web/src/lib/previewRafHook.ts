/**
 * Phase 9 đợt 32, luồng P5 — Hook đo gap rAF RIÊNG vòng preview.
 *
 * TRẠNG THÁI NỐI: module này CHƯA được nối vào preview.tsx trong đợt
 * này. Lý do (ghi rõ, không giấu): luồng P2 cùng đợt đang sửa vùng
 * seek trong preview.tsx; chèn thêm hook vào cùng file lúc này có nguy
 * cơ xung đột ghi đè lẫn nhau, và spec chèn của O5 (§3) đã đủ chính
 * xác để O3/đợt sau implement cơ học. Module này là phần đo "ngoài
 * preview" mà task cho phép khi xung đột: logic đo thuần (đã test
 * bằng số, xem test P5), cộng đúng điểm chèn để đợt sau áp dụng mà
 * không phải đoán lại.
 *
 * Vì sao cần hook trong preview (không làm được từ harness): probe N2
 * bọc window.requestAnimationFrame toàn cục nên đếm cả rAF của vòng
 * khác (~108–118 callback/s lúc rảnh, vượt 60 Hz của 1 vòng) — gap đo
 * được chỉ là CẬN DƯỚI của gap riêng vòng preview, loss do clamp
 * dt 0.1 s chỉ là cận dưới, tốc độ dự báo chỉ là cận trên. Hook này
 * đo ngay trong loop nên gap/lost là số thật của vòng lặp.
 *
 * ĐIỂM CHÈN vào apps/web/src/preview.tsx (mốc neo ở cây hiện tại,
 * kiểm chứng ngày 01/11/2026 — đợt sau đối chiếu lại số dòng trước
 * khi áp vì file này hay đổi):
 * 1. Khai báo, cạnh `idleDebug` (quanh dòng 1968–1975, ngay trước
 *    `const loop = ...`): `const rafDebug = createPreviewRafHook();`
 *    và `(window as ...).__vcutPreviewRaf = rafDebug;` theo đúng mẫu
 *    `__vcutPreviewIdle` đã có.
 * 2. Đầu `loop`, NGAY TRƯỚC dòng clamp hiện tại
 *    `const dt = Math.min(0.1, (now - last) / 1000);` (dòng ~1975):
 *    tính gap TRƯỚC khi `last = now;` (sau dòng này last đã bị ghi
 *    đè nên không đo được gap thật). Gọi:
 *    `rafDebug.record(now, last, st.playing, st.reversePlayback, justWoke, st.playhead);`
 *    rồi `justWoke = false;` — điểm này nằm TRƯỚC nhánh early-return
 *    "chưa có canvas/wrap" nên cả tick chưa vẽ cũng được đếm.
 * 3. Trong `wake()`, cạnh `last = performance.now();`: set
 *    `justWoke = true;` trước khi đặt lịch lại. wake() đã reset last
 *    nên tick đầu sau giấc ngủ có gap nhỏ theo cấu tạo — cờ justWoke
 *    đánh dấu đúng tick đó để phân tích sustained loại nó ra, thay
 *    cho cách N2 phải SUY LUẬN tick biên từ dữ liệu.
 * 4. Cleanup của effect, cạnh dòng xóa `__vcutPreviewIdle`:
 *    xóa `__vcutPreviewRaf` nếu nó vẫn là object của effect này.
 * Không ghi thêm gì vào `__vcutPreviewIdle` (giữ nguyên shape cho
 * script cũ); hook mới là object riêng.
 *
 * Cách harness dùng hook (để đợt sau khỏi đoán):
 * - CẮT MẪU THEO TIMESTAMP, không cắt theo chỉ số tuyệt đối. `samples`
 *   là ring buffer tối đa maxSamples (mặc định 5000): sau ~83 s rAF
 *   (~5000 tick) mẫu cũ bị đẩy ra, nên `samples.length` lúc đầu slot
 *   KHÔNG còn là mốc cắt hợp lệ — `samples.slice(fromIdx)` với fromIdx
 *   vượt độ dài buffer trả về [] → `{ n: 0 }` dù vòng preview vẫn tick
 *   (bug n=0, nợ R64 §8.3 — từng mắc ở clicktest-64r3-fps-long.mjs,
 *   clicktest-61r3-fps-cal.mjs, bench-preview-fps.mjs; đã sửa ở đợt 66
 *   T5 sang cắt theo timestamp). Cách đúng: ghi `performance.now()` ở
 *   đầu/cuối slot (cùng đồng hồ với sample.t) rồi lọc
 *   `x.t >= t0 && x.t <= t1` (kèm `x.playing && !x.justWoke` khi cần).
 *   Mẫu trong slot dài vẫn có thể bị đẩy khỏi buffer nếu slot > ~83 s
 *   — giữ slot ≤ 10–20 s, hoặc đọc mẫu ngay trong slot.
 * - Với mỗi phase (loại mẫu justWoke): gap P50/P95/P99, số gap > 100 ms,
 *   tổng lostMs, tốc độ dự báo = 1 - tổng lost / wall phase, đối chiếu
 *   tốc độ playhead đo được. Vì mẫu chỉ từ vòng preview nên không còn
 *   hiệu chỉnh "cận dưới/cận trên" như probe N2.
 */

// Đợt 53 J5: import kèm đuôi .ts theo quy ước test strip-types của repo
// (xem assetStore.ts: tsc cấm đuôi .ts khi allowImportingTsExtensions
// tắt nên dòng import này mang @ts-ignore có chủ đích — vite và node
// strip-types đều resolve được đuôi .ts).
// @ts-ignore: xem ghi chú trên (TS5097, đuôi .ts cho strip-types)
import { PREVIEW_DT_CAP_S } from "./playheadPacing.ts";

export interface PreviewRafSample {
  /** now (tham số rAF, cùng đồng hồ với dt). */
  t: number;
  /** Gap thô (now - lastTrước), ms — chưa clamp. */
  gapMs: number;
  /** dt đã clamp, ms. */
  dtMs: number;
  /** Thời gian playhead mất ở tick này, ms = max(0, gapMs - dtMs). */
  lostMs: number;
  playing: boolean;
  reverse: boolean;
  /** Tick đầu sau wake() — tick biên, loại khỏi phân tích sustained. */
  justWoke: boolean;
  playhead: number;
}

export interface PreviewRafHook {
  samples: PreviewRafSample[];
  record: (
    now: number,
    lastBefore: number,
    playing: boolean,
    reverse: boolean,
    justWoke: boolean,
    playhead: number,
  ) => PreviewRafSample;
}

/**
 * Tạo hook đo. Ring buffer tối đa maxSamples mẫu (mặc định 5000, như
 * spec O5); mẫu cũ nhất bị đẩy ra. Chi phí: 1 lần push số mỗi tick.
 */
export function createPreviewRafHook(maxSamples = 5000): PreviewRafHook {
  const samples: PreviewRafSample[] = [];
  return {
    samples,
    record(now, lastBefore, playing, reverse, justWoke, playhead) {
      const gapMs = now - lastBefore;
      // Đợt 53 J5 — khớp đúng công thức clamp của loop hiện tại
      // (clampPreviewDt, trần PREVIEW_DT_CAP_S — trước đây clamp 0,1 s).
      const dtMs = Math.min(PREVIEW_DT_CAP_S * 1000, gapMs);
      const sample: PreviewRafSample = {
        t: now,
        gapMs,
        dtMs,
        lostMs: Math.max(0, gapMs - dtMs),
        playing,
        reverse,
        justWoke,
        playhead,
      };
      samples.push(sample);
      if (samples.length > maxSamples) {
        samples.splice(0, samples.length - maxSamples);
      }
      return sample;
    },
  };
}

/** Phân tích sustained của 1 phase: loại mẫu justWoke, như phân tích N2. */
export function analyzePreviewRafPhase(
  samples: PreviewRafSample[],
  wallMs: number,
): {
  count: number;
  gapP50ms: number | null;
  gapP95ms: number | null;
  gapP99ms: number | null;
  over100ms: number;
  lostMs: number;
  /** Tốc độ dự báo từ clamp = 1 - lost/wall (chỉ có nghĩa khi wall > 0). */
  predictedRate: number | null;
} {
  const kept = samples.filter((s) => !s.justWoke);
  const sorted = kept.map((s) => s.gapMs).sort((a, b) => a - b);
  const pct = (p: number): number | null => {
    if (!sorted.length) return null;
    return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  };
  const lostMs = kept.reduce((sum, s) => sum + s.lostMs, 0);
  return {
    count: kept.length,
    gapP50ms: pct(0.5),
    gapP95ms: pct(0.95),
    gapP99ms: pct(0.99),
    over100ms: kept.filter((s) => s.gapMs > 100).length,
    lostMs,
    predictedRate: wallMs > 0 ? 1 - lostMs / wallMs : null,
  };
}
