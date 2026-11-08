/**
 * openFileQueue.ts — hàng đợi sự kiện `vcut:open-file` ở preload.
 *
 * VẤN ĐỀ (đợt 53 J3 §6.1 / đợt 54 K4 — D1 argv): main process gửi
 * `vcut:open-file` ngay sau `loadURL` (did-finish-load), nhưng web app
 * chỉ đăng ký listener trong `initDesktopMenuBridge` (useEffect lúc App
 * mount — chạy sau paint, có thể muộn hơn did-finish-load). Event gửi
 * trước khi có listener sẽ MẤT (ipcRenderer không giữ lại) → D1 đo được
 * `onOpenFile: false`, tên "Dự án mới", currentPath=null, dù argv có
 * file .vcut. Đường second-instance (D2b) thì hoạt động vì lúc đó
 * renderer đã đăng ký xong — cùng một đường send, chỉ khác thời điểm.
 *
 * GIẢI PHÁP: preload đăng ký `ipcRenderer.on("vcut:open-file")` NGAY
 * khi preload chạy (trước mọi script của trang, chắc chắn trước
 * did-finish-load) và giữ các path chưa có subscriber vào hàng đợi.
 * `onOpenFile(cb)` xả hàng đợi cho subscriber đầu tiên rồi đăng ký
 * nhận event trực tiếp như cũ. Event chỉ được giao cho subscriber đầu
 * tiên (web bridge — luôn đăng ký trước mọi probe vì mount trước) để
 * không mở cùng file hai lần.
 *
 * Module thuần (không import electron/node) để test được bằng
 * node --test mà không cần Electron — xem openFileQueue.test.ts.
 *
 * LƯU Ý: preload.ts KHÔNG import module này — preload chạy sandbox:true
 * nên `require` file tương đối làm hỏng toàn bộ preload
 * (window.vcutDesktop = undefined). preload.ts mang một bản INLINE y hệt
 * class dưới đây; sửa logic thì sửa CẢ HAI CHỖ cho khớp.
 */

export type OpenFileListener = (filePath: string) => void;

/** Hàng đợi + phân phối event mở file cho subscriber đầu tiên. */
export class OpenFileQueue {
  private listeners = new Set<OpenFileListener>();
  private queued: string[] = [];

  /** Event từ main tới (gọi từ ipcRenderer.on — luôn chạy, kể cả khi chưa có subscriber). */
  push(filePath: string): void {
    if (this.listeners.size === 0) {
      this.queued.push(filePath);
      return;
    }
    for (const listener of this.listeners) listener(filePath);
  }

  /**
   * Đăng ký nhận file. Subscriber đầu tiên nhận toàn bộ hàng đợi (theo
   * đúng thứ tự tới) rồi hàng đợi được xóa; các subscriber sau chỉ nhận
   * event mới. Trả về hàm huỷ đăng ký.
   */
  subscribe(listener: OpenFileListener): () => void {
    const first = this.listeners.size === 0;
    this.listeners.add(listener);
    if (first && this.queued.length > 0) {
      const pending = this.queued;
      this.queued = [];
      for (const filePath of pending) listener(filePath);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Số event đang chờ subscriber (chỉ để test/chẩn đoán). */
  get pendingCount(): number {
    return this.queued.length;
  }
}
