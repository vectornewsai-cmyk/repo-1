/**
 * projectAssetRefs62R7.ts — Sổ tham chiếu liên project: khóa project +
 * kênh thông báo liên tab (Phase 9 đợt 62, luồng R7 — đóng nợ đợt 61
 * R9 §5.1/§5.2/§5.8 về UI "Dọn kho" / IndexedDB cleanup).
 *
 * Bối cảnh: kho AssetStore là toàn cục theo trình duyệt, một file
 * .vcut KHÁC có thể dùng chung bytes mà project hiện tại không tham
 * chiếu. Từ đợt này, mỗi lần project được lưu/mở, app ghi tập assetId
 * project đó dùng vào store `projectRefs` (xem AssetStore:
 * `recordProjectRefs` / `listProjectRefs` / `forgetProjectRefs`);
 * UI dọn kho đọc sổ trước khi xóa và chặn xóa bytes mà project khác
 * còn ghi nhận dùng.
 *
 * Module này thuần + tự chứa (không import value từ file anh em, cùng
 * quy ước idbCleanup61R9.ts — chạy được bằng `node
 * --experimental-strip-types`): chỉ định dạng khóa project và kênh
 * BroadcastChannel để các tab cùng origin báo nhau quét lại panel.
 */

/** Tiền tố khóa project theo tên (khóa duy nhất của sổ ở đợt này). */
export const PROJECT_KEY_PREFIX = "name:";

/** Tên fallback khi project không có tên (khớp serializeProject). */
export const FALLBACK_PROJECT_NAME = "Dự án không tên";

/**
 * Khóa sổ tham chiếu của một project, từ tên của nó (`spec.meta.name`).
 * Tên được trim; rỗng → tên fallback. Hai file .vcut khác nhau mà
 * trùng tên project sẽ CHUNG một khóa (ghi sau thắng) — giới hạn trung
 * thực, xem LIMITS R7 §1.3; muốn hết thì phải thêm projectId ổn định
 * vào envelope (việc lớn, ngoài phạm vi luồng này).
 */
export function projectKeyForName(name: string): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return `${PROJECT_KEY_PREFIX}${trimmed.length > 0 ? trimmed : FALLBACK_PROJECT_NAME}`;
}

/** Tên hiển thị từ khóa sổ (bỏ tiền tố `name:`; khóa lạ thì trả nguyên khóa). */
export function projectDisplayName(projectKey: string): string {
  if (typeof projectKey === "string" && projectKey.startsWith(PROJECT_KEY_PREFIX)) {
    return projectKey.slice(PROJECT_KEY_PREFIX.length);
  }
  return projectKey;
}

/**
 * Kênh BroadcastChannel để các tab cùng origin báo nhau:
 * - `{ type: "refs-changed" }`: một tab vừa ghi/quên sổ tham chiếu →
 *   tab khác mở panel Dọn kho thì quét lại.
 * - `{ type: "storage-changed" }`: một tab vừa xóa bytes ở panel →
 *   tab khác quét lại để không hiện mục đã mất.
 * BroadcastChannel chỉ chạy trong trình duyệt; Node/test không có thì
 * các hàm dưới trở thành no-op an toàn (không throw).
 */
export const PROJECT_REFS_CHANNEL = "vcut-projrefs";

type RefsChannelMessage = { type: "refs-changed" | "storage-changed"; at: number };

function openChannel(): BroadcastChannel | null {
  try {
    const BC = (globalThis as unknown as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel;
    if (typeof BC !== "function") return null;
    return new BC(PROJECT_REFS_CHANNEL);
  } catch {
    return null;
  }
}

function postMessage(type: RefsChannelMessage["type"]): void {
  const ch = openChannel();
  if (!ch) return;
  try {
    ch.postMessage({ type, at: Date.now() } satisfies RefsChannelMessage);
  } catch {
    // bỏ qua lặng lẽ — tab khác chỉ mất một lần quét lại
  } finally {
    try {
      ch.close();
    } catch {
      // bỏ qua
    }
  }
}

/** Báo các tab khác: sổ tham chiếu vừa đổi (ghi mới / quên project). */
export function notifyProjectRefsChanged(): void {
  postMessage("refs-changed");
}

/** Báo các tab khác: kho bytes vừa đổi (đã xóa mục ở panel Dọn kho). */
export function notifyStorageChanged(): void {
  postMessage("storage-changed");
}

/**
 * Đăng ký nhận thông báo đổi sổ/kho từ tab khác. `cb` nhận loại thông
 * báo (`refs-changed` | `storage-changed`) để caller quyết có quét lại
 * không. Trả về hàm hủy đăng ký (đóng channel). Môi trường không có
 * BroadcastChannel → trả về no-op.
 */
export function subscribeProjectRefsChanged(
  cb: (type: RefsChannelMessage["type"]) => void,
): () => void {
  const ch = openChannel();
  if (!ch) return () => undefined;
  ch.onmessage = (ev: MessageEvent) => {
    const data = ev.data as Partial<RefsChannelMessage> | null;
    if (data && (data.type === "refs-changed" || data.type === "storage-changed")) {
      cb(data.type);
    }
  };
  return () => {
    try {
      ch.close();
    } catch {
      // bỏ qua
    }
  };
}
