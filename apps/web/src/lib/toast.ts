/**
 * K5: hệ thống thông báo toast thống nhất, thay cho window.alert rời rạc.
 *
 * Module thuần (không phụ thuộc React) để dễ test: state nằm ở module,
 * component Toasts chỉ subscribe và render. Toast tự đóng sau 4.5s ở phía
 * component; ở đây chỉ quản lý danh sách.
 */
export type ToastKind = "info" | "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
  /**
   * Đợt 71 Y5 — toast dính: component Toasts KHÔNG tự đóng sau 4,5 s
   * mà chỉ đóng khi caller gọi `dismissToast(id)` (hoặc bấm ×). Dùng
   * cho toast trạng thái chạy dài (trial keyframe) — toast thường vẫn
   * tự đóng như cũ. Mặc định false.
   */
  sticky?: boolean;
}

type Listener = (toasts: ToastItem[]) => void;

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  const snapshot = [...items];
  for (const fn of listeners) fn(snapshot);
}

/** Thêm một toast, trả về id để có thể đóng sớm. */
export function pushToast(
  message: string,
  kind: ToastKind = "info",
  opts?: { sticky?: boolean },
): number {
  const id = nextId++;
  items = [...items, { id, message, kind, ...(opts?.sticky ? { sticky: true } : {}) }];
  emit();
  return id;
}

/**
 * Đợt 71 Y5 — cập nhật nội dung toast đang hiện (tại chỗ, giữ nguyên
 * id/vị trí, không tạo toast mới, không reset hẹn giờ tự đóng).
 * Trả false khi id không còn tồn tại (đã đóng) — caller khi đó phải
 * push lại nếu vẫn cần hiện. Dùng để cập nhật số giây đã trôi qua
 * trên toast trạng thái trial keyframe mà không nhấp nháy / spam.
 */
export function updateToast(id: number, message: string): boolean {
  const idx = items.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  if (items[idx].message === message) return true;
  items = items.map((t) => (t.id === id ? { ...t, message } : t));
  emit();
  return true;
}

/** Đóng toast theo id (không có tác dụng nếu id không tồn tại). */
export function dismissToast(id: number): void {
  if (!items.some((t) => t.id === id)) return;
  items = items.filter((t) => t.id !== id);
  emit();
}

/** Xóa toàn bộ toast (dùng cho test / reset). */
export function clearToasts(): void {
  items = [];
  emit();
}

/**
 * Đăng ký nhận danh sách toast hiện tại + mọi thay đổi sau đó.
 * Trả về hàm huỷ đăng ký. Callback được gọi ngay với snapshot hiện tại.
 */
export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn);
  fn([...items]);
  return () => {
    listeners.delete(fn);
  };
}
