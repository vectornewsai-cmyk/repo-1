/**
 * bridgeUrl.ts — địa chỉ bridge server, dùng chung cho toàn bộ web app.
 *
 * Phase 10 (gộp): trước đây mỗi component tự khai `const BRIDGE_URL =
 * VITE_BRIDGE_URL || "http://127.0.0.1:8787"` — khi app desktop tự
 * khởi động bridge mà cổng 8787 đã bận, bridge chạy ở cổng khác nhưng
 * web UI vẫn gọi 8787 nên hỏng. Giờ BRIDGE_URL là một *live binding*:
 * `setBridgeUrl()` (gọi từ desktop.ts khi app chạy trong Electron, lấy
 * URL thật qua preload `getBridgeUrl()`) đổi giá trị cho mọi file đã
 * import — không cần sửa 48 chỗ dùng.
 *
 * Trên trình duyệt thường (không có preload), giá trị giữ nguyên mặc
 * định 8787 (hoặc VITE_BRIDGE_URL khi build). `window.__VCUT_BRIDGE_URL__`
 * chỉ để chẩn đoán (CDP kiểm tra URL đang dùng), không phải API.
 */
export let BRIDGE_URL: string =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

/** Desktop app gọi khi biết URL thật của bridge (có thể khác 8787). */
export function setBridgeUrl(url: string): void {
  if (!url || typeof url !== "string") return;
  BRIDGE_URL = url.replace(/\/+$/, "");
  try {
    (window as unknown as { __VCUT_BRIDGE_URL__?: string }).__VCUT_BRIDGE_URL__ = BRIDGE_URL;
  } catch {
    /* bỏ qua — chỉ để chẩn đoán */
  }
}
