// decoderErrorRecovery62R6.ts — Phase 9 đợt 62, luồng R6: phục hồi
// element đã lỗi decoder (đóng nợ đợt 61 §5.3 = LIMITS R8 §5.3, xem
// docs/PHASE9_ROUND62_R6_PAUSE_STALL_LIMITS.md).
//
// Vấn đề: lỗi decoder của Chromium là STICKY — element đã `error:3`
// (MEDIA_ERR_DECODE, vd seek quá vùng dữ liệu còn lại của file cắt)
// thì seek/play lại không hồi phục kể cả khi playhead về vùng decode
// được. Cơ chế duy nhất là drop element + tạo mới (pool.videoFor tạo
// lại với cùng src). Cơ chế Y2 (đợt 43) chỉ drop ở lúc CẠN CAP seek
// (10 lần thất bại ≈ 12,8 s) nên scrub về vùng tốt vẫn kẹt ~13 s.
//
// Sửa ở đây (nối trong preview.tsx, nhánh `.then` của seek pause):
// sau mỗi lần seek thất bại ĐÃ CHỨNG MINH (timeout/error, kind khác
// null) mà chưa cạn cap, drop ngay các active có `error !== null` —
// lần retry sau tạo element mới nên hồi phục trong ~1 lần seek thay vì
// ~10 lần. Khi đã cạn cap thì Y2 drop toàn bộ actives như cũ (không
// drop trùng ở đây để khỏi lệch số đếm `seekElementRecreated` của Y2).
//
// Vì sao chỉ drop khi `error !== null` (không drop mọi element
// timeout): timeout có thể chỉ là decode chậm (seek sẽ xong ở lần
// retry sau — X2 §ghi chú: seek chậm ~5 s hội tụ trong ~4 lần
// timeout); drop element chỉ-chậm thì phí lần nạp metadata + phá hội
// tụ. `error !== null` là tín hiệu dính chắc chắn: element đó không
// bao giờ decode lại được nữa, drop là đúng.
// Vì sao drop trong `.then` (sau thất bại) chứ không drop trước khi
// seek: lúc đó seek đã settle, không còn seek nào đang bay trên
// element đó (cùng ngữ cảnh Y2 gọi `releaseElement` — xem comment ở
// điểm nối trong preview.tsx); drop trước seek có thể cắt seek cũ
// đang bay của request đã bị huỷ hoặc cắt fallback proxy đang load.
//
// File thuần TS, không import gì — test được bằng Node với mock
// element (chỉ cần field `error`).
/** Mặt tối thiểu của element mà kế hoạch phục hồi cần (error thật). */
export interface DecoderErrorElementLike {
  /** MediaError của HTMLMediaElement (null = chưa lỗi). Mock có thể bỏ qua. */
  readonly error?: { readonly code?: number } | null;
}

/** Kế hoạch phục hồi: element nào đã lỗi decoder + mã lỗi của chúng. */
export interface DecoderErrorRecoveryPlan<T> {
  /** Toàn bộ active đã lỗi decoder (dedup theo identity). */
  elements: T[];
  /** Mã lỗi tương ứng (null khi mock không đặt code — chỉ để chẩn đoán). */
  errorCodes: (number | null)[];
}

/**
 * Lập kế hoạch phục hồi từ actives ở playhead vừa seek thất bại:
 * chỉ lấy element có `error !== null` (MediaError sticky — decode
 * hỏng hẳn, seek lại không cứu được), dedup theo identity (cùng
 * element có thể phục vụ nhiều clip/audio). Element chưa lỗi (error
 * null/undefined) KHÔNG vào kế hoạch — timeout của nó có thể chỉ là
 * decode chậm, giữ lại để retry hội tụ như cũ.
 * Hàm thuần, không bao giờ throw (đọc `error` trong try/catch từng
 * element để mock lạ không phá được vòng lặp).
 */
export function planDecoderErrorRecovery<T extends DecoderErrorElementLike>(
  actives: readonly T[],
): DecoderErrorRecoveryPlan<T> {
  const elements: T[] = [];
  const errorCodes: (number | null)[] = [];
  const seen = new Set<T>();
  for (const el of actives) {
    if (seen.has(el)) continue;
    seen.add(el);
    let err: { readonly code?: number } | null | undefined;
    try {
      err = el.error;
    } catch {
      continue;
    }
    if (err === null || err === undefined) continue;
    elements.push(el);
    errorCodes.push(typeof err.code === "number" ? err.code : null);
  }
  return { elements, errorCodes };
}

/** Element này đã lỗi decoder (sticky) chưa — kiểm tra đơn lẻ. */
export function hasDecoderError(el: DecoderErrorElementLike): boolean {
  try {
    const err = el.error;
    return err !== null && err !== undefined;
  } catch {
    return false;
  }
}
