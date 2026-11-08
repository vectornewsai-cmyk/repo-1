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
} from "./projectHistory.ts";

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
}

/** Xóa toàn bộ danh sách đã bỏ qua (để lần mở sau hỏi lại các chuỗi mơ hồ). */
export function clearDismissedLegacyIds(): void {
  try {
    dismissedStore()?.removeItem(DISMISSED_KEY);
  } catch {
    /* bỏ qua */
  }
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
