/**
 * legacyAdoptUi.ts — Hàng đợi UI nhận mảnh legacy mơ hồ THỦ CÔNG
 * (Phase 9 đợt 66, luồng T7 — đóng nợ đợt 65 S9 §5.1: mảnh mơ hồ chưa
 * có UI nhận thủ công; autosave-restore/nhập archive chưa nhận chuỗi
 * legacy).
 *
 * Luồng dữ liệu:
 *   adoptLegacyHistoryChain (projectHistory.ts) trả về các mục mơ hồ
 *   (chuỗi con trỏ `pointerAmbiguous` + mảnh quét `fragmentsAmbiguous`,
 *   kèm bằng chứng hiển thị) → `queueAmbiguousFromAdoptResult` gộp +
 *   đưa vào hàng đợi (lọc mục user đã "Bỏ qua" trước đó) →
 *   `LegacyHistoryAdoptModal` (React, subscribe qua useSyncExternalStore)
 *   hiện cho user xem xét từng chuỗi và bấm Nhận / Bỏ qua.
 *
 * Quyết định của user:
 *   - Nhận: modal gọi `adoptLegacyFragmentManually` (projectHistory.ts)
 *     rồi `removeLegacyItem` — dữ liệu chuyển về chuỗi envelope.
 *   - Bỏ qua: `dismissLegacyItem` ghi id chuỗi vào localStorage
 *     (`vcut:legacy-adopt-dismissed-v1`) để lần mở sau KHÔNG hỏi lại —
 *     dữ liệu trong kho KHÔNG bị xóa, chỉ không hiện nữa. Muốn hỏi lại
 *     thì xóa key localStorage đó (xem LIMITS đợt 66 T7 §5).
 *
 * Module thuần + không import React (chạy được bằng node strip-types
 * để test): subscribe/getSnapshot theo mẫu subscribeLoadReport
 * (loadReport.ts). Không chạm localStorage thật khi test Node — kho
 * "đã bỏ qua" inject được qua `setLegacyAdoptDismissedStore`.
 */
import type {
  AdoptLegacyHistoryResult,
  LegacyFragmentAmbiguous,
  ProjectVersion,
} from "./projectHistory.ts";
// Import kèm đuôi .ts theo quy ước strip-types (xem projectHistory.ts):
// vite và node strip-types đều resolve được đuôi .ts, chỉ tsc là báo
// TS5097 nên dòng import này mang @ts-ignore có chủ đích.
// @ts-ignore: TS5097, đuôi .ts cho strip-types (import một dòng để @ts-ignore phủ đúng dòng specifier)
import { legacyChainDisplay } from "./projectNameRegistry64R6.ts";

/** Một chuỗi legacy mơ hồ đang chờ user quyết định (đủ bằng chứng để hiện UI). */
export interface AmbiguousLegacyItem {
  /** Id chuỗi legacy (nguồn) — vd `file-<hash>-<tên>` hoặc `proj-...`. */
  from: string;
  /** Lý do mơ hồ: `ambiguous-*` hoặc `scan-error`. */
  reason: string;
  /** Phần tên trong id `file-`; "" khi chuỗi `proj-` (không có tên file). */
  namePart: string;
  /** Hash nhúng trong id `file-`; null khi chuỗi `proj-` / sai dạng. */
  embeddedHash: string | null;
  /** Số version trong chuỗi. */
  versionCount: number;
  /** createdAt (ms) của version cũ nhất; null khi chuỗi rỗng. */
  firstCreatedAt: number | null;
  /** createdAt (ms) của version mới nhất; null khi chuỗi rỗng. */
  lastCreatedAt: number | null;
  /** true khi đây là chuỗi con trỏ (HISTORY_PROJECT_KEY), false khi là mảnh quét được. */
  isPointerChain: boolean;
  /** Hash spec đang mở (để user so sánh với hash nhúng); null khi không có spec. */
  openedSpecHash: string | null;
}

/**
 * Gộp chuỗi con trỏ mơ hồ + mảnh mơ hồ từ kết quả adopt thành mục UI,
 * khử trùng theo `from` (con trỏ trước, mảnh sau — một chuỗi không bao
 * giờ vừa là con trỏ vừa là mảnh vì quét loại trừ id con trỏ, nhưng
 * khử trùng để an toàn khi caller tự ghép kết quả).
 */
export function collectAmbiguousLegacyItems(
  result: AdoptLegacyHistoryResult,
): AmbiguousLegacyItem[] {
  const out: AmbiguousLegacyItem[] = [];
  const seen = new Set<string>();
  const openedSpecHash = result.openedSpecHash ?? null;
  const push = (a: LegacyFragmentAmbiguous, isPointerChain: boolean): void => {
    if (seen.has(a.from)) return;
    seen.add(a.from);
    out.push({
      from: a.from,
      reason: a.reason,
      namePart: a.namePart,
      embeddedHash: a.embeddedHash,
      versionCount: a.versionCount,
      firstCreatedAt: a.firstCreatedAt,
      lastCreatedAt: a.lastCreatedAt,
      isPointerChain,
      openedSpecHash,
    });
  };
  if (result.pointerAmbiguous) push(result.pointerAmbiguous, true);
  for (const a of result.fragmentsAmbiguous ?? []) push(a, false);
  return out;
}

// ---------------------------------------------------------------------------
// Kho "đã bỏ qua" — localStorage, inject được để test.
// ---------------------------------------------------------------------------

/** Storage tối thiểu cho danh sách id đã bỏ qua (localStorage thật khớp interface này). */
export interface DismissedLegacyStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const DISMISSED_KEY = "vcut:legacy-adopt-dismissed-v1";
const DISMISSED_CAP = 500;

let dismissedStoreOverride: DismissedLegacyStore | null = null;

/** Test inject kho "đã bỏ qua" (Node không có localStorage); null = dùng lại localStorage thật. */
export function setLegacyAdoptDismissedStore(store: DismissedLegacyStore | null): void {
  dismissedStoreOverride = store;
}

function dismissedStore(): DismissedLegacyStore | null {
  if (dismissedStoreOverride) return dismissedStoreOverride;
  try {
    const g = globalThis as unknown as { localStorage?: DismissedLegacyStore };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Danh sách id chuỗi user đã bấm "Bỏ qua" (đọc từ localStorage; lỗi/hỏng → rỗng). */
export function getDismissedLegacyIds(): string[] {
  try {
    const raw = dismissedStore()?.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function saveDismissedLegacyIds(ids: string[]): void {
  try {
    dismissedStore()?.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(0, DISMISSED_CAP)));
  } catch {
    /* storage không ghi được → lần sau hỏi lại, không crash */
  }
}

/** Ghi nhớ một id đã bỏ qua (giữ tối đa DISMISSED_CAP id mới nhất). */
export function dismissLegacyId(id: string): void {
  const ids = getDismissedLegacyIds();
  if (ids.includes(id)) return;
  ids.push(id);
  saveDismissedLegacyIds(ids);
  emitDismissed();
}

/**
 * Đợt 67 U6 — MỞ LẠI một id đã bỏ qua: gỡ khỏi danh sách "đã bỏ qua"
 * để lần adopt/quét sau hỏi lại chuỗi đó (dữ liệu trong kho không đổi).
 * Không tự đưa vào hàng đợi — caller (modal) đưa lại sau khi mở lại.
 */
export function undismissLegacyId(id: string): void {
  const ids = getDismissedLegacyIds();
  if (!ids.includes(id)) return;
  saveDismissedLegacyIds(ids.filter((x) => x !== id));
  emitDismissed();
}

/** Xóa toàn bộ danh sách đã bỏ qua (để lần mở sau hỏi lại các chuỗi mơ hồ). */
export function clearDismissedLegacyIds(): void {
  try {
    dismissedStore()?.removeItem(DISMISSED_KEY);
  } catch {
    /* bỏ qua */
  }
  emitDismissed();
}

// ---------------------------------------------------------------------------
// Theo dõi danh sách "đã bỏ qua" — subscribe/getSnapshot cho React
// (HistoryPanel hiện số lượng; modal mở lại). Cùng mẫu hàng đợi.
// ---------------------------------------------------------------------------

let dismissedSnapshot: string[] = [];
const dismissedListeners = new Set<() => void>();

function emitDismissed(): void {
  dismissedSnapshot = getDismissedLegacyIds();
  dismissedListeners.forEach((fn) => fn());
}

/** Đăng ký nhận thay đổi danh sách "đã bỏ qua". Trả về hàm hủy đăng ký. */
export function subscribeDismissedLegacyIds(cb: () => void): () => void {
  dismissedListeners.add(cb);
  return () => {
    dismissedListeners.delete(cb);
  };
}

/**
 * Ảnh chụp danh sách "đã bỏ qua" hiện tại. Lần gọi đầu đọc từ kho
 * (localStorage / kho đã inject) để snapshot khớp thực tế ngay cả khi
 * chưa có thay đổi nào kể từ lúc nạp module.
 */
export function getDismissedLegacyIdsSnapshot(): string[] {
  if (dismissedSnapshot.length === 0) {
    // Chưa emit lần nào (hoặc danh sách đang rỗng thật): đọc lại từ
    // kho để không kẹt ở snapshot rỗng khởi tạo khi kho đã có dữ liệu.
    const fresh = getDismissedLegacyIds();
    if (fresh.length > 0) dismissedSnapshot = fresh;
    return dismissedSnapshot;
  }
  return dismissedSnapshot;
}

// ---------------------------------------------------------------------------
// Yêu cầu mở modal nhận legacy (để xem lại các mục đã bỏ qua) —
// HistoryPanel gọi khi user bấm nút; modal tự hiện ngay cả khi hàng
// đợi đang rỗng. Cờ này là "yêu cầu mở một lần": modal xóa khi đóng.
// ---------------------------------------------------------------------------

let modalRequested = false;
const modalRequestListeners = new Set<() => void>();

function emitModalRequest(): void {
  modalRequestListeners.forEach((fn) => fn());
}

/** HistoryPanel: yêu cầu mở modal nhận legacy (xem lại mục đã bỏ qua). */
export function requestLegacyAdoptModal(): void {
  if (modalRequested) return;
  modalRequested = true;
  emitModalRequest();
}

/** Modal: đã nhận yêu cầu mở (đóng modal thì xóa cờ). */
export function clearLegacyAdoptModalRequest(): void {
  if (!modalRequested) return;
  modalRequested = false;
  emitModalRequest();
}

/** Đăng ký nhận thay đổi cờ yêu cầu mở modal. */
export function subscribeLegacyAdoptModalRequest(cb: () => void): () => void {
  modalRequestListeners.add(cb);
  return () => {
    modalRequestListeners.delete(cb);
  };
}

/** Cờ yêu cầu mở modal hiện tại (cho useSyncExternalStore). */
export function getLegacyAdoptModalRequested(): boolean {
  return modalRequested;
}

// ---------------------------------------------------------------------------
// Nạp lại các chuỗi đã bỏ qua kèm bằng chứng hiển thị (để UI mở lại).
// ---------------------------------------------------------------------------

/** Nguồn đọc version tối thiểu để nạp lại chuỗi đã bỏ qua (HistoryStore khớp). */
export interface LegacyChainLister {
  listVersions(id: string): Promise<ProjectVersion[]>;
}

/** Một chuỗi đã bỏ qua, kèm bằng chứng hiển thị + cờ còn dữ liệu không. */
export interface DismissedLegacyChain extends AmbiguousLegacyItem {
  /** false khi chuỗi không còn version nào trong kho (đã xóa/prune) hoặc đọc kho lỗi. */
  exists: boolean;
}

/**
 * Đợt 67 U6 — nạp các chuỗi user đã "Bỏ qua" kèm bằng chứng hiển thị
 * (tên/hash/số version/mốc — cùng bộ hiển thị với mục chờ quyết định)
 * để modal hiện danh sách mở lại. Chuỗi nào đọc kho lỗi hoặc không
 * còn version thì `exists` = false (vẫn liệt kê để user gỡ khỏi danh
 * sách, không tự xóa dữ liệu hộ). `pointerChainId` (id chuỗi con trỏ
 * hiện tại, nếu có) để gắn đúng nhãn loại chuỗi.
 */
export async function loadDismissedLegacyItems(
  lister: LegacyChainLister,
  openedSpecHash: string | null,
  pointerChainId?: string | null,
): Promise<DismissedLegacyChain[]> {
  const out: DismissedLegacyChain[] = [];
  for (const from of getDismissedLegacyIds()) {
    let versions: ProjectVersion[] = [];
    let exists = false;
    try {
      versions = await lister.listVersions(from);
      exists = versions.length > 0;
    } catch {
      versions = [];
      exists = false;
    }
    const d = legacyChainDisplay(from, versions);
    out.push({
      from,
      reason: "dismissed",
      namePart: d.namePart,
      embeddedHash: d.embeddedHash,
      versionCount: d.versionCount,
      firstCreatedAt: d.firstCreatedAt,
      lastCreatedAt: d.lastCreatedAt,
      isPointerChain: pointerChainId != null && from === pointerChainId,
      openedSpecHash,
      exists,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hàng đợi — subscribe/getSnapshot cho React (useSyncExternalStore).
// ---------------------------------------------------------------------------

let pending: AmbiguousLegacyItem[] = [];
let snapshot: AmbiguousLegacyItem[] = pending;
const listeners = new Set<() => void>();

function emit(): void {
  snapshot = [...pending];
  listeners.forEach((fn) => fn());
}

/** Đăng ký nhận thay đổi hàng đợi. Trả về hàm hủy đăng ký. */
export function subscribeLegacyAdoptQueue(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Ảnh chụp hàng đợi hiện tại (cùng tham chiếu khi không đổi — cho useSyncExternalStore). */
export function getLegacyAdoptQueue(): AmbiguousLegacyItem[] {
  return snapshot;
}

/**
 * Đưa các mục mơ hồ vào hàng đợi UI: lọc mục user đã "Bỏ qua" trước
 * đó (localStorage) + khử trùng theo `from`. Trả về số mục mới được thêm.
 */
export function queueAmbiguousLegacyItems(items: ReadonlyArray<AmbiguousLegacyItem>): number {
  const dismissed = new Set(getDismissedLegacyIds());
  let added = 0;
  for (const it of items) {
    if (dismissed.has(it.from)) continue;
    if (pending.some((p) => p.from === it.from)) continue;
    pending.push(it);
    added++;
  }
  if (added > 0) emit();
  return added;
}

/** Gộp collect + queue từ kết quả adoptLegacyHistoryChain. Trả về số mục mới được thêm. */
export function queueAmbiguousFromAdoptResult(result: AdoptLegacyHistoryResult): number {
  return queueAmbiguousLegacyItems(collectAmbiguousLegacyItems(result));
}

/**
 * Bỏ qua một mục: ghi nhớ id để lần mở sau không hỏi lại + gỡ khỏi
 * hàng đợi. Dữ liệu trong kho KHÔNG bị xóa.
 */
export function dismissLegacyItem(from: string): void {
  dismissLegacyId(from);
  const before = pending.length;
  pending = pending.filter((p) => p.from !== from);
  if (pending.length !== before) emit();
}

/** Bỏ qua tất cả mục đang chờ (ghi nhớ từng id). */
export function dismissAllLegacyItems(): void {
  for (const p of pending) dismissLegacyId(p.from);
  if (pending.length > 0) {
    pending = [];
    emit();
  }
}

/** Gỡ một mục khỏi hàng đợi sau khi đã nhận thành công (không ghi vào danh sách bỏ qua). */
export function removeLegacyItem(from: string): void {
  const before = pending.length;
  pending = pending.filter((p) => p.from !== from);
  if (pending.length !== before) emit();
}

/** Test-only: dọn hàng đợi trong bộ nhớ (không đụng danh sách đã bỏ qua). */
export function clearLegacyAdoptQueue(): void {
  if (pending.length > 0) {
    pending = [];
    emit();
  }
}
