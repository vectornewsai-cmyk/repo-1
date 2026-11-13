/**
 * exportPresetSelection.ts — Preset xuất đang được chọn, chia sẻ giữa
 * ExportPanel (nơi user chọn) và PreviewCanvas (overlay safe-area cần
 * biết preset để vẽ đúng vùng của nền tảng đó).
 * (Phase 9 đợt 73 A9, hướng S4.)
 *
 * Vì sao không dùng zustand store: preset chỉ là lựa chọn ở THỜI ĐIỂM
 * RENDER (xem exportPresets.ts) — không thuộc về spec project, không
 * cần persist vào file project. Một pub/sub module-level là đủ, tránh
 * đụng vào store dùng chung. Giá trị mặc định "1080p" khớp với
 * ExportPanel (useState "1080p").
 */

let current = "1080p";
const listeners = new Set<() => void>();

export function getSelectedExportPreset(): string {
  return current;
}

export function setSelectedExportPreset(id: string): void {
  if (typeof id !== "string" || id.length === 0) return;
  if (id === current) return;
  current = id;
  for (const fn of listeners) fn();
}

export function subscribeSelectedExportPreset(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
