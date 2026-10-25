/**
 * markers.ts — Marker/chapter trên timeline (Phase 9, batch "timeline markers").
 *
 * Marker là dữ liệu THUẦN của editor (giống plugin metadata, không phải clip):
 * - Lưu trong `VideoSpec.markers` (xem index.ts), tự động survive save/load
 *   project JSON vì project vốn là JSON thuần — không cần migration.
 * - Render worker HIỆN BỎ QUA field này (không export chapter ra file,
 *   không vẽ marker lên video) — xem MARKERS_LIMITS.md. Thêm field vào spec
 *   là additive-only nên project cũ (không có markers) vẫn load bình thường
 *   và validator của render worker không từ chối field lạ ở top-level.
 *
 * Quy tắc validate (validateMarkers):
 * - markers phải là mảng (undefined = không có marker, hợp lệ).
 * - Mỗi marker: id là chuỗi không rỗng và DUY NHẤT trong mảng.
 * - time là số hữu hạn, >= 0 (giây, tính từ đầu timeline).
 * - label (nếu có) phải là chuỗi; color (nếu có) phải là chuỗi không rỗng.
 * - Trùng time được phép (nhiều marker cùng 1 thời điểm); seek tới time đó
 *   chọn marker đầu tiên theo thứ tự mảng (xem nearestMarkerBefore).
 */

/** Một điểm đánh dấu trên timeline (marker/chapter). */
export interface Marker {
  /** id duy nhất trong project (dạng "m1", "m2", ... — do editor sinh). */
  id: string;
  /** Thời gian tính bằng GIÂY từ đầu timeline, >= 0. */
  time: number;
  /** Nhãn hiển thị trên ruler (không có = dùng nhãn mặc định của UI). */
  label?: string;
  /** Màu vạch marker (hex, vd "#f43f5e"). Không có = màu mặc định của UI. */
  color?: string;
}

/** Bảng màu marker mà UI dùng (đủ phân biệt trên nền timeline tối). */
export const MARKER_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#22c55e",
  "#38bdf8",
  "#a78bfa",
  "#ec4899",
] as const;

/** Màu mặc định khi marker không đặt color. */
export const DEFAULT_MARKER_COLOR = MARKER_COLORS[0];

/**
 * Validate danh sách marker. Trả về danh sách lỗi (rỗng = hợp lệ).
 * undefined = không có marker → hợp lệ (tương thích project cũ).
 */
export function validateMarkers(v: unknown): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return ["markers phải là một mảng"];
  const errors: string[] = [];
  const seen = new Set<string>();
  v.forEach((m, i) => {
    const p = `markers[${i}]`;
    if (typeof m !== "object" || m === null) {
      errors.push(`${p} phải là một object`);
      return;
    }
    const rec = m as Record<string, unknown>;
    if (typeof rec["id"] !== "string" || (rec["id"] as string).trim() === "") {
      errors.push(`${p}.id phải là chuỗi không rỗng`);
    } else if (seen.has(rec["id"] as string)) {
      errors.push(`${p}.id "${rec["id"]}" bị trùng`);
    } else {
      seen.add(rec["id"] as string);
    }
    if (typeof rec["time"] !== "number" || !Number.isFinite(rec["time"]) || (rec["time"] as number) < 0) {
      errors.push(`${p}.time phải là số >= 0, nhận được: ${JSON.stringify(rec["time"])}`);
    }
    if (rec["label"] !== undefined && typeof rec["label"] !== "string") {
      errors.push(`${p}.label phải là chuỗi`);
    }
    if (
      rec["color"] !== undefined &&
      (typeof rec["color"] !== "string" || (rec["color"] as string).trim() === "")
    ) {
      errors.push(`${p}.color phải là chuỗi không rỗng`);
    }
  });
  return errors;
}

/**
 * Thêm 1 marker vào danh sách (hàm thuần — không mutate input).
 * Trả về { markers, marker } hoặc { markers, error } khi marker không hợp lệ
 * (id trùng hoặc validate fail). Danh sách trả về được sắp theo time tăng dần
 * để ruler vẽ theo thứ tự thời gian (thứ tự mảng = thứ tự seek ưu tiên).
 */
export function addMarkerToList(
  list: Marker[],
  marker: Marker,
): { markers: Marker[]; marker: Marker } | { markers: Marker[]; error: string } {
  const errors = validateMarkers([...list, marker]);
  if (errors.length > 0) return { markers: list, error: errors.join("; ") };
  return { markers: [...list, marker].sort((a, b) => a.time - b.time), marker };
}

/** Xoá marker theo id (hàm thuần). Không tìm thấy → trả lại danh sách cũ. */
export function removeMarkerFromList(list: Marker[], id: string): Marker[] {
  if (!list.some((m) => m.id === id)) return list;
  return list.filter((m) => m.id !== id);
}

/**
 * Đổi nhãn/màu của 1 marker (hàm thuần). Patch không hợp lệ (label không phải
 * chuỗi...) → trả lại danh sách cũ. Không tìm thấy id → trả lại danh sách cũ.
 */
export function updateMarkerInList(
  list: Marker[],
  id: string,
  patch: { label?: string; color?: string },
): Marker[] {
  if (patch.label !== undefined && typeof patch.label !== "string") return list;
  if (patch.color !== undefined && typeof patch.color !== "string") return list;
  let changed = false;
  const next = list.map((m) => {
    if (m.id !== id) return m;
    changed = true;
    return { ...m, ...patch };
  });
  return changed ? next : list;
}

/**
 * Marker gần nhất mà playhead có thể seek tới: marker cuối cùng có time <= t,
 * hoặc marker đầu tiên nếu chưa tới marker nào. Trả về null khi không có marker.
 * Dùng cho click marker → seek (UI click trực tiếp vào marker nên hàm này chủ
 * yếu phục vụ phím tắt "tới marker trước/sau" trong tương lai).
 */
export function nearestMarkerBefore(list: Marker[], t: number): Marker | null {
  if (list.length === 0) return null;
  const sorted = [...list].sort((a, b) => a.time - b.time);
  let best: Marker | null = null;
  for (const m of sorted) {
    if (m.time <= t) best = m;
    else break;
  }
  return best ?? sorted[0];
}
