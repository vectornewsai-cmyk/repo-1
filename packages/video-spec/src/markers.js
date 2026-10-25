/**
 * markers.js — JS mirror của markers.ts (xem DEVELOPER.md §4: mỗi domain ship
 * cả TS module và JS mirror để render worker zero-dependency require() được).
 * Mirror này được viết tay và giữ khớp với markers.ts; khi sửa markers.ts
 * phải sửa mirror tương ứng (không có bước build tự động cho video-spec).
 *
 * Marker là dữ liệu THUẦN của editor: render worker hiện bỏ qua field này
 * (không export chapter, không vẽ lên video) — xem MARKER_LIMITS.
 */

/** Bảng màu marker mà UI dùng (đủ phân biệt trên nền timeline tối). */
export const MARKER_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#22c55e",
  "#38bdf8",
  "#a78bfa",
  "#ec4899",
];

/** Màu mặc định khi marker không đặt color. */
export const DEFAULT_MARKER_COLOR = MARKER_COLORS[0];

/**
 * Validate danh sách marker. Trả về danh sách lỗi (rỗng = hợp lệ).
 * undefined = không có marker → hợp lệ (tương thích project cũ).
 */
export function validateMarkers(v) {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return ["markers phải là một mảng"];
  const errors = [];
  const seen = new Set();
  v.forEach((m, i) => {
    const p = `markers[${i}]`;
    if (typeof m !== "object" || m === null) {
      errors.push(`${p} phải là một object`);
      return;
    }
    if (typeof m.id !== "string" || m.id.trim() === "") {
      errors.push(`${p}.id phải là chuỗi không rỗng`);
    } else if (seen.has(m.id)) {
      errors.push(`${p}.id "${m.id}" bị trùng`);
    } else {
      seen.add(m.id);
    }
    if (typeof m.time !== "number" || !Number.isFinite(m.time) || m.time < 0) {
      errors.push(`${p}.time phải là số >= 0, nhận được: ${JSON.stringify(m.time)}`);
    }
    if (m.label !== undefined && typeof m.label !== "string") {
      errors.push(`${p}.label phải là chuỗi`);
    }
    if (m.color !== undefined && (typeof m.color !== "string" || m.color.trim() === "")) {
      errors.push(`${p}.color phải là chuỗi không rỗng`);
    }
  });
  return errors;
}

/**
 * Thêm 1 marker vào danh sách (hàm thuần — không mutate input).
 * Trả về { markers, marker } hoặc { markers, error } khi marker không hợp lệ.
 * Danh sách trả về được sắp theo time tăng dần.
 */
export function addMarkerToList(list, marker) {
  const errors = validateMarkers([...list, marker]);
  if (errors.length > 0) return { markers: list, error: errors.join("; ") };
  return { markers: [...list, marker].sort((a, b) => a.time - b.time), marker };
}

/** Xoá marker theo id (hàm thuần). Không tìm thấy → trả lại danh sách cũ. */
export function removeMarkerFromList(list, id) {
  if (!list.some((m) => m.id === id)) return list;
  return list.filter((m) => m.id !== id);
}

/**
 * Đổi nhãn/màu của 1 marker (hàm thuần). Patch không hợp lệ hoặc không tìm
 * thấy id → trả lại danh sách cũ.
 */
export function updateMarkerInList(list, id, patch) {
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
 * hoặc marker đầu tiên nếu chưa tới marker nào. Null khi không có marker.
 */
export function nearestMarkerBefore(list, t) {
  if (list.length === 0) return null;
  const sorted = [...list].sort((a, b) => a.time - b.time);
  let best = null;
  for (const m of sorted) {
    if (m.time <= t) best = m;
    else break;
  }
  return best ?? sorted[0];
}
