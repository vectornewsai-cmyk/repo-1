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
export function pushToast(message: string, kind: ToastKind = "info"): number {
  const id = nextId++;
  items = [...items, { id, message, kind }];
  emit();
  return id;
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
 * Trả về hàm hủy đăng ký. Callback được gọi ngay với snapshot hiện tại.
 */
export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn);
  fn([...items]);
  return () => {
    listeners.delete(fn);
  };
}
