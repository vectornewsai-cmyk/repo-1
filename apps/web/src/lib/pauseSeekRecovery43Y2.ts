// pauseSeekRecovery43Y2.ts — Đợt 43 luồng Y2: phục hồi sau khi cạn cap
// seek của đợt 42 X2 (nợ đợt 42 §5.3, xem
// docs/PHASE9_ROUND42_X2_PAUSE_SEEK_CAP_LIMITS.md §3.4 + §6.3).
//
// Vấn đề: sau khi cạn cap ở playhead t (10 lần seek thất bại liên tiếp),
// scrub sang t mới (vùng dữ liệu còn nguyên) reset đếm đúng nhưng seek
// vẫn timeout cả 10 lần rồi cạn lại — vì element Chrome vẫn kẹt ở trạng
// thái seeking sau lần seek hỏng (seekElement khi element đang seeking
// thì chỉ chờ `seeked`, không gán lại — xem seek.ts đợt 31 N1), nên seek
// mới không bao giờ hoàn tất. Cap dừng vòng lặp vô ích đúng, nhưng không
// tự phục hồi được: cần tạo lại element thì seek sau đó mới có cơ hội
// thành công.
//
// Cơ chế (nối trong preview.tsx, marker ROUND43-Y2): đúng thời điểm cạn
// cap (chuyển false → true, không phải mỗi lần .then chạy), lấy lại
// actives ở t hiện tại qua collectActives rồi drop toàn bộ element của
// chúng khỏi MediaPool. Lần seek sau (scrub sang t mới, phát, redraw)
// gọi pool.videoFor/audioFor sẽ tạo element MỚI với cùng src — trạng
// thái seeking kẹt và bộ giải mã hỏng (nếu có) bị bỏ cùng element cũ.
//
// Vì sao drop TOÀN BỘ actives chứ không chỉ element đang seeking:
//  - Kết quả seek là tổng hợp (seekAll chỉ trả done/timedOut/failed,
//    không cho biết element nào hỏng), nên không quy được lỗi cho một
//    element cụ thể khi nhiều clip cùng active ở t.
//  - Probe element độc lập đợt 43 (trang probe.html, không qua app) cho
//    thấy element ở trạng thái lỗi báo seeking = false nhưng vẫn không
//    bao giờ bắn `seeked` (readyState 0, gán currentTime không ném) —
//    tức "chỉ drop element đang seeking" sẽ BỎ SÓT đúng trường hợp
//    demuxer đã hỏng hẳn. Sau 10 lần thất bại liên tiếp, toàn bộ actives
//    đều đáng ngờ; tạo lại element chỉ tốn một lần nạp metadata từ
//    nguồn local (blob/file), rẻ hơn nhiều so với kẹt vĩnh viễn.
//  - Số element bị drop và số trong đó đang seeking được phơi qua
//    PreviewIdleDebug (seekElementRecreated / seekRecreatedSeeking) để
//    harness headed đọc được trường hợp nào thực sự xảy ra.
//
// Giới hạn (ghi rõ, không giấu):
//  - Chỉ phục hồi cho lần seek SAU: dữ liệu ở t đã cạn vẫn thiếu nên
//    seek lại đúng t đó (nếu user quay lại) vẫn sẽ timeout và cạn lại
//    — đúng, vì media hỏng thật ở t đó, không phải lỗi phục hồi.
//  - Element cũ bị drop có thể còn MediaElementSource trong AudioEngine
//    (nodes Map key theo element, không có API gỡ) — node cũ chỉ còn
//    xuất im lặng (element đã pause + gỡ src), rò rỉ nhỏ, giới hạn bởi
//    số lần cạn cap; element mới được tạo node mới ở tick sau.
//  - Không đụng nhánh playing, cap W2, hay logic reset cap của X2 —
//    recovery chỉ chạy đúng một lần ở thời điểm chuyển sang exhausted.

/** Mặt tối thiểu của element mà kế hoạch phục hồi cần (seeking thật). */
export interface RecoveryElementLike {
  /** Cờ seeking của HTMLMediaElement (mock có thể bỏ qua = undefined). */
  seeking?: boolean;
}

/** Kế hoạch phục hồi: element nào drop + trong đó bao nhiêu cái đang seeking. */
export interface SeekRecoveryPlan<T> {
  /** Toàn bộ actives đã dedup (mỗi element đúng một lần). */
  elements: T[];
  /** Số element trong `elements` có seeking === true lúc lập kế hoạch. */
  seekingCount: number;
}

/**
 * Lập kế hoạch phục hồi từ actives ở playhead đã cạn cap: drop toàn bộ
 * (dedup theo identity — cùng element có thể phục vụ nhiều clip/audio),
 * đồng thời đếm số element đang seeking để harness chẩn đoán được
 * trường hợp nào thực sự xảy ra (kẹt seeking vs demuxer hỏng).
 * Hàm thuần để test khóa được mà không cần DOM hay MediaPool thật.
 */
export function planSeekRecovery<T extends RecoveryElementLike>(
  actives: readonly T[],
): SeekRecoveryPlan<T> {
  const elements: T[] = [];
  const seen = new Set<T>();
  let seekingCount = 0;
  for (const el of actives) {
    if (seen.has(el)) continue;
    seen.add(el);
    elements.push(el);
    if (el.seeking === true) seekingCount++;
  }
  return { elements, seekingCount };
}
