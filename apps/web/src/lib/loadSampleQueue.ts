/**
 * Phase 9 đợt 49 E6 — queue/retry thuần cho `loadSample` (tách từ store.ts).
 *
 * Đây là ĐÚNG logic quyết định coalesce + retry có điều kiện của đợt 47 C1
 * / đợt 48 D6, tách ra thành module thuần (không import gì, không DOM) để
 * test được bằng Node — nợ D6 §4.4 ("chưa có unit test Node cho
 * queue/retry"). `store.ts` chỉ còn gọi nó; hành vi giữ nguyên từng dòng
 * (xem đối chiếu ở cuối file + test loadSampleQueue49E6.test.ts).
 *
 * Máy trạng thái (một lượt load tại một thời điểm):
 * - `begin()` — bắt đầu một lượt. Trả `false` nếu đã có lượt đang bay
 *   (caller ghi nhớ yêu cầu chồng rồi return, không chạy song song).
 * - `noteOverlapping(gen)` — ghi nhớ yêu cầu chồng + thế hệ project lúc
 *   yêu cầu tới. Chỉ có nghĩa khi đang có lượt bay (gọi ngoài lúc đó
 *   bị bỏ qua — ở store.ts, hàm này chỉ được gọi trong nhánh
 *   `begin() === false`).
 * - `finish(didSet, currentGen)` — kết thúc lượt đang bay, reset cờ
 *   loading, và trả `true` khi cần chạy lại MỘT lượt mới: có yêu cầu chờ
 *   VÀ lượt vừa xong KHÔNG set được VÀ thế hệ không đổi kể từ khi yêu cầu
 *   chờ tới. Yêu cầu chờ luôn bị xóa TRƯỚC khi trả về — mỗi lần bấm tối
 *   đa tạo 1 yêu cầu chờ nên không có vòng lặp vô hạn; chồng tiếp trong
 *   lúc retry lại coalesce bình thường.
 *
 * Bốn case (theo bảng D6 §1):
 * - A: lượt bay set thành công → finish(true, gen) = false (ý định của
 *   lần gọi chồng đã thỏa, retry chỉ tốn ~10 s build lại mẫu giống hệt).
 * - B: user đổi project SAU lần bấm chồng → finish(false, genMới) =
 *   false (lần đổi mới hơn thắng; retry sẽ revert project vừa mở).
 * - C: user đổi project TRƯỚC lần bấm chồng → noteOverlapping(genMới)
 *   rồi finish(false, genMới) = true (ý định mới nhất phải được thỏa).
 * - D: lượt bay ném lỗi → didSet ở lại false → finish(false, gen) =
 *   true (retry; xem docs/PHASE9_ROUND49_E6_LOADSAMPLE_LIMITS.md).
 */
export class LoadSampleQueue {
  private loading = false;
  private queued = false;
  private queuedGen = -1;

  /** Bắt đầu một lượt load. `false` = đã có lượt đang bay. */
  begin(): boolean {
    if (this.loading) return false;
    this.loading = true;
    return true;
  }

  /** Ghi nhớ yêu cầu chồng nhau + thế hệ lúc yêu cầu tới. */
  noteOverlapping(gen: number): void {
    if (!this.loading) return;
    this.queued = true;
    this.queuedGen = gen;
  }

  /**
   * Kết thúc lượt đang bay. Trả `true` khi cần chạy lại một lượt mới.
   * Luôn xóa yêu cầu chờ trước khi trả về.
   */
  finish(didSet: boolean, currentGen: number): boolean {
    this.loading = false;
    if (!this.queued) return false;
    this.queued = false;
    const gen = this.queuedGen;
    this.queuedGen = -1;
    return !didSet && gen === currentGen;
  }

  /** Đang có lượt bay không (để test / chẩn đoán). */
  get isLoading(): boolean {
    return this.loading;
  }

  /** Đang có yêu cầu chờ không (để test / chẩn đoán). */
  get hasQueued(): boolean {
    return this.queued;
  }
}
