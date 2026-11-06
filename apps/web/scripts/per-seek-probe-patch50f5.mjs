/**
 * Phase 9 đợt 50, luồng F5 — vá probe per-seek lúc chạy: fallback rAF
 * cần XÁC NHẬN LIÊN TIẾP (nợ E5 §6.7 + §6.4: trần 1000 trên B-frame).
 *
 * NGUYÊN TẮC (theo tiền lệ D5/E5): KHÔNG sửa file probe gốc
 * `per-seek-probe-page.js` (file dùng chung nhiều luồng) — mọi bổ sung
 * ở đây là vá chuỗi lúc chạy (string replace có assert anchor), một
 * nguồn duy nhất cho cả script đo lẫn test Node.
 *
 * Vấn đề (E5 §4, 2/2 lượt B-frame hoàn tất tái hiện): tick rAF đầu
 * tiên sau khi gán currentTime có thể thấy `seeking=false` +
 * `currentTime=target` TRƯỚC KHI seek thật bắt đầu (cờ seeking chỉ
 * lật true khi task seek chạy trên main thread — dưới tải, tick đầu
 * chạy trước). Fallback cũ chốt entry ngay tick đó (seekedAtMs sau
 * 5–15 ms, 0 mẫu), trong khi element sau đó `seeking=true` hàng chục
 * giây vì frame B cần frame tham chiếu chưa về qua drip — cửa sổ lấy
 * mẫu đóng trước cả khi element kịp vào trạng thái seeking quan sát
 * được. Đây là hạn chế của probe, không phải của sản phẩm: bằng chứng
 * là pool snapshot cuối S1 vẫn thấy `seeking=true, readyState=1,
 * ct=25` trong khi entry k=0 đã đóng từ lâu.
 *
 * Vá F5 (chỉ đổi nhánh fallback trong tick(), không đổi định nghĩa
 * seek/seeked/mẫu):
 *  - F5a: fallback chỉ chốt khi điều kiện (seeking=false + currentTime
 *    ở target) giữ LIÊN TIẾP đủ `probe.fallbackConfirmTicks` tick
 *    (mặc định 30). Lượt chạy F5a trên B-frame VẪN chốt sớm: element
 *    báo seeking=false + ct=target tới ~8 s (tiền-seek — Chrome chưa
 *    phát range request cho mốc target, xem LIMITS F5 §2) trong khi
 *    30 tick chỉ ~1,6 s. F5a đo được chính xác cửa sổ tiền-seek này
 *    (latency 409 ms, fallbackConfirmTicks=30, 0 mẫu) nên không giữ
 *    nguyên dạng.
 *  - F5b (đang dùng): đếm xác nhận CHỈ KHI `readyState >= 2`
 *    (HAVE_CURRENT_DATA — đã có frame tại mốc hiện tại). Tick nào
 *    seeking=true hoặc currentTime rời target thì reset; tick nào
 *    seeking=false + ct=target nhưng readyState<2 thì KHÔNG đếm
 *    (cũng reset về 0) — cửa sổ tiền-seek (readyState=0) không chốt
 *    được entry, khi seeking lật true sau đó thì mẫu tích bình
 *    thường. Mốc `_fbFirstMs` (để backdate seekedAtMs) vẫn lấy từ
 *    tick đầu tiên thấy positioned (không cần readyState) nên latency
 *    không lệch so với fallback cũ.
 *  - Khi chốt đủ tick, `seekedAtMs` lấy mốc tick ĐẦU TIÊN của chuỗi
 *    positioned (không lấy mốc tick chốt) nên latency đo được không
 *    lệch so với fallback cũ: seek nhanh hoàn tất trước tick đầu vẫn
 *    ghi latency ~1 tick như trước, chỉ quyết định chốt chậm hơn.
 *  - Entry ghi thêm `fallbackConfirmTicks` (số tick liên tiếp lúc
 *    chốt, 30 khi chốt bằng fallback) và `fallbackConfirmed` để
 *    evidence phân biệt được entry đóng bằng fallback đã xác nhận với
 *    entry đóng bằng sự kiện seeked thật (`seekedEvent=true`).
 *
 * Không đổi: điều kiện lấy mẫu (chỉ khi seeking=true và seekedAtMs
 * còn null), trần 1000 mẫu/entry, cơ chế supersede, flush ở read().
 * Vá này CHỒNG lên vá D5+E5 (stack/src/wall + elementIdOf) qua
 * patchProbeSrc49E5 — test Node dùng cùng helper với script đo.
 */

import { patchProbeSrc49E5, matchDropFingerprint } from "./per-seek-probe-patch49e5.mjs";
export { matchDropFingerprint };

/** Vá nguồn probe thô (D5 + E5 + F5). Ném lỗi nếu anchor không còn khớp — dừng thay vì vá mù. */
export function patchProbeSrc50F5(rawSrc) {
  let src = rawSrc;
  // Lớp D5+E5 giữ nguyên (stack/src/wall + elementIdOf).
  src = patchProbeSrc49E5(src);

  // (F5-1) Mặc định số tick xác nhận trên probe object.
  const anchorDefault = "    maxSeekingSamples: DEFAULT_MAX_SEEKING_SAMPLES,";
  if (!src.includes(anchorDefault)) throw new Error("không tìm thấy maxSeekingSamples trong per-seek-probe-page.js — file gốc đã đổi, dừng lại thay vì vá mù");
  src = src.replace(anchorDefault,
    anchorDefault + "\n    // ROUND50-F5: số tick liên tiếp cần để fallback rAF chốt entry.\n    fallbackConfirmTicks: 30,");

  // (F5-2) install() nhận opts.fallbackConfirmTicks.
  const anchorOpt = "    if (typeof opts.maxSeekingSamples === \"number\" && opts.maxSeekingSamples > 0) probe.maxSeekingSamples = opts.maxSeekingSamples;";
  if (!src.includes(anchorOpt)) throw new Error("không tìm thấy opts.maxSeekingSamples trong per-seek-probe-page.js");
  src = src.replace(anchorOpt,
    anchorOpt + "\n    if (typeof opts.fallbackConfirmTicks === \"number\" && opts.fallbackConfirmTicks > 0) probe.fallbackConfirmTicks = opts.fallbackConfirmTicks;");

  // (F5-3) Entry mới mang trường xác nhận fallback (khởi 0/false).
  const anchorEntry = "        seekingSeen: false,";
  if (!src.includes(anchorEntry)) throw new Error("không tìm thấy seekingSeen trong per-seek-probe-page.js");
  src = src.replace(anchorEntry,
    anchorEntry + "\n" +
    "        // ROUND50-F5: bộ đếm xác nhận fallback (xem tick()).\n" +
    "        _fbConfirm: 0,\n" +
    "        _fbFirstMs: null,\n" +
    "        fallbackConfirmTicks: 0,\n" +
    "        fallbackConfirmed: false,");

  // (F5-4) Nhánh fallback trong tick(): xác nhận liên tiếp + reset.
  const anchorTick = `        if (entry.seekedAtMs === null) {
          if (el.seeking) {
            entry.seekingSeen = true;
            // v2: lấy mẫu decoded TRONG lúc seeking, trước khi seeked
            // chốt — tick này seeking vẫn true nên mẫu thuộc về lúc chờ.
            pushSeekingSample(entry, el, now);
          } else if (near(el.currentTime, entry.targetTime)) {
            // Fallback rAF khi sự kiện seeked không tới (seek nhanh hoàn
            // tất trước tick đầu, hoặc listener gắn hụt).
            const q = qualityOf(el);
            entry.seekedAtMs = now;
            entry.seekedEvent = false;
            entry.currentTimeAtSeeked = el.currentTime;
            entry.decodedFramesAtSeeked = q.decoded;
            entry.droppedFramesAtSeeked = q.dropped;
          }
        }`;
  if (!src.includes(anchorTick)) throw new Error("không tìm thấy nhánh fallback trong tick() của per-seek-probe-page.js — file gốc đã đổi, dừng lại thay vì vá mù");
  src = src.replace(anchorTick,
    `        if (entry.seekedAtMs === null) {
          if (el.seeking) {
            entry.seekingSeen = true;
            // ROUND50-F5: seek thật đã bắt đầu — tick trước thấy
            // seeking=false chỉ là trạng thái trước-seek, reset xác nhận.
            entry._fbConfirm = 0;
            entry._fbFirstMs = null;
            entry.fallbackConfirmTicks = 0;
            // v2: lấy mẫu decoded TRONG lúc seeking, trước khi seeked
            // chốt — tick này seeking vẫn true nên mẫu thuộc về lúc chờ.
            pushSeekingSample(entry, el, now);
          } else if (near(el.currentTime, entry.targetTime)) {
            // ROUND50-F5b: fallback cần XÁC NHẬN LIÊN TIẾP + FRAME SẴN
            // SÀNG. Lượt F5a (chỉ đếm tick) vẫn chốt sớm sau 30 tick vì
            // element báo seeking=false + ct=target tới ~8 s (tiền-seek:
            // Chrome chưa phát range request cho mốc target — xem LIMITS
            // F5 §2, range log) trong khi readyState=0. Đếm xác nhận chỉ
            // khi readyState>=2 (HAVE_CURRENT_DATA: đã có frame tại mốc
            // hiện tại) nên cửa sổ tiền-seek không chốt được entry; khi
            // seeking lật true sau đó thì mẫu tích bình thường. Mốc
            // _fbFirstMs (để backdate seekedAtMs) vẫn lấy từ tick đầu
            // tiên thấy positioned (không cần readyState) nên latency
            // không lệch.
            if (entry._fbFirstMs === null || entry._fbFirstMs === undefined) entry._fbFirstMs = now;
            if (el.readyState >= 2) {
              entry._fbConfirm = (entry._fbConfirm || 0) + 1;
            } else {
              entry._fbConfirm = 0;
            }
            entry.fallbackConfirmTicks = entry._fbConfirm;
            if (entry._fbConfirm >= probe.fallbackConfirmTicks) {
              const q = qualityOf(el);
              entry.seekedAtMs = entry._fbFirstMs;
              entry.seekedEvent = false;
              entry.fallbackConfirmed = true;
              entry.currentTimeAtSeeked = el.currentTime;
              entry.decodedFramesAtSeeked = q.decoded;
              entry.droppedFramesAtSeeked = q.dropped;
            }
          } else {
            // seeking=false nhưng currentTime chưa tới target: không phải
            // seek xong, reset xác nhận.
            entry._fbConfirm = 0;
            entry._fbFirstMs = null;
            entry.fallbackConfirmTicks = 0;
          }
        }`);
  return src;
}
