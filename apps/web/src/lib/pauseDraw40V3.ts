// pauseDraw40V3.ts — Đợt 40 V3: sửa lỗi vòng lặp preview "frame pause
// tại t=0 không vẽ" (nợ đợt 39 §5.3, xem
// docs/PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md).
//
// Cơ chế lỗi: tick seek xong ở nhánh pause chạy khi element chưa có
// frame (readyState < 2) nên decideVideoFrame skip, nhưng code cũ vẫn
// gán lastDrawn = t vô điều kiện sau renderFrame → vòng lặp đủ điều
// kiện ngủ (playhead === lastDrawn, lastRequested === playhead) và
// không bao giờ tỉnh lại dù element sau đó đã sẵn sàng — vì không có
// store change nào đánh thức nó, và element sẵn sàng không chạm store.
//
// Sửa gồm 2 nửa, thiếu 1 nửa đều không đủ:
//  (a) chỉ gán lastDrawn khi lần render đó thực sự không skip clip video
//      nào (pauseDrawComplete) — đây là hướng gợi ý trong LIMITS T6
//      §3.3 ("chỉ gán lastDrawn khi renderFrame thực sự vẽ được");
//  (b) tick sau đó, khi seek đã xong cho t nhưng frame chưa vẽ, vẽ lại
//      mà KHÔNG seek mới (pauseTickNeedsRetry) — vì nếu chỉ làm (a)
//      thì vòng lặp tick mãi không vẽ gì: nhánh pause chỉ vẽ trong
//      .then của seek, mà seek đã xong rồi nên không còn .then nào nữa.
//      Tức (a) một mình chỉ đổi "ngủ với nền đen" thành "quay với nền
//      đen". Vẽ lại không seek mới là đủ vì element đã ở đúng target;
//      seek lại chỉ tốn decode lại, còn vẽ lại mỗi tick rẻ (renderFrame
//      trên nền đen + early-return ở clip skip) và dừng ngay khi vẽ
//      được. Không đặt giới hạn số lần vẽ lại: media hỏng vĩnh viễn thì
//      vòng lặp tick rẻ thay vì ngủ — đánh đổi này ghi rõ trong LIMITS
//      (trước đây ngủ với nền đen cũng không phải trạng thái đúng hơn,
//      và giới hạn sẽ phá hội tụ khi element sẵn sàng muộn dưới tải).
//
// Phạm vi: chỉ nhánh pause/seek. Nhánh playing vẫn gán lastDrawn mỗi
// tick như cũ (playing không bao giờ ngủ nên không kẹt); guard 2 s và
// cờ seekCompletedThisTick của T6 (đường stepping) không đụng tới.

/**
 * Lần render vừa rồi có "vẽ được" không, đo bằng delta skip của
 * holdStats trong preview.tsx: snapshot holdStats.skip trước renderFrame,
 * so với sau. true khi không skip thêm clip video nào.
 *
 * Vì sao delta skip là đủ (không cần đếm clip đã vẽ): ở nhánh pause,
 * decideVideoFrame chỉ trả draw hoặc skip cho video (hold chỉ xảy ra
 * khi đang phát/stepping); track ẩn, clip không active, clip ảnh/chữ/
 * sticker, clip thiếu media (vẽ placeholder) và đường WebCodecs đều
 * không chạm holdStats.skip, nên delta 0 nghĩa là không có clip video
 * active nào bị bỏ lại với nền đen. Clip video active mà skip thì delta
 * > 0 → chưa vẽ được, dù các clip khác có vẽ.
 */
export function pauseDrawComplete(beforeSkip: number, afterSkip: number): boolean {
  return afterSkip === beforeSkip;
}

/**
 * Tick pause có cần vẽ lại không (không seek mới)?
 * Đúng khi: seek đã xong cho chính t này (lastRequested === t), frame
 * tại t chưa được đánh dấu đã vẽ (lastDrawn !== t), và không có seek
 * nào đang bay (pendingSeek false — seek đang bay thì chờ .then của nó
 * để khỏi vẽ frame sai vị trí).
 */
export function pauseTickNeedsRetry(
  t: number,
  lastDrawn: number | null,
  lastRequested: number | null,
  pendingSeek: boolean,
): boolean {
  return t === lastRequested && t !== lastDrawn && !pendingSeek;
}
