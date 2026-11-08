/**
 * shortcuts.ts — bảng phím tắt của app desktop (Phase 10, luồng G5).
 *
 * Hai nhóm, dùng chung cho menu (menu.ts) và dialog Phím tắt (about.ts):
 * - DESKTOP_MENU_SHORTCUTS: accelerator của menu native. Các mục thuộc
 *   editor (lưu/hoàn tác/sao chép/...) KHỚP với phím tắt web app đã có
 *   trong apps/web/src/App.tsx — xem docs/DESKTOP.md § "Kiểm tra xung đột
 *   phím tắt" để biết vì sao từng phím an toàn / cần chặn (guard) ở
 *   renderer.
 * - WEB_EDITOR_SHORTCUTS: phím tắt chỉ có trong editor web (không qua
 *   menu), liệt kê trong dialog Phím tắt để user tra cứu một chỗ.
 *
 * Quy ước accelerator: "CommandOrControl" = Ctrl trên Linux/Windows,
 * Cmd trên macOS.
 */
import type { MenuActionId } from "./preload";

/**
 * Action của một mục menu có accelerator. Phần lớn là MenuActionId (gửi
 * về renderer); "open-project" là ngoại lệ — dialog mở file chạy ở main
 * process rồi gửi đường dẫn qua kênh `vcut:open-file`.
 */
export type MenuShortcutAction = MenuActionId | "open-project";

export interface DesktopMenuShortcut {
  accelerator: string;
  action: MenuShortcutAction;
  /** key trong i18n-desktop (menu.*) — nhãn vi/en lấy từ đó. */
  labelKey: string;
}

/** Accelerator của từng action gửi về renderer (đồng bộ với menu.ts). */
export const DESKTOP_MENU_SHORTCUTS: DesktopMenuShortcut[] = [
  { accelerator: "CommandOrControl+N", action: "new-project", labelKey: "menu.newProject" },
  { accelerator: "CommandOrControl+O", action: "open-project", labelKey: "menu.openProject" },
  { accelerator: "CommandOrControl+S", action: "save-project", labelKey: "menu.saveProject" },
  { accelerator: "CommandOrControl+Shift+S", action: "save-project-as", labelKey: "menu.saveAs" },
  { accelerator: "CommandOrControl+E", action: "export-video", labelKey: "menu.exportVideo" },
  { accelerator: "CommandOrControl+Z", action: "undo", labelKey: "menu.undo" },
  { accelerator: "CommandOrControl+Shift+Z", action: "redo", labelKey: "menu.redo" },
  { accelerator: "CommandOrControl+X", action: "cut", labelKey: "menu.cut" },
  { accelerator: "CommandOrControl+C", action: "copy", labelKey: "menu.copy" },
  { accelerator: "CommandOrControl+V", action: "paste", labelKey: "menu.paste" },
  { accelerator: "CommandOrControl+D", action: "duplicate", labelKey: "menu.duplicate" },
  { accelerator: "CommandOrControl+A", action: "select-all", labelKey: "menu.selectAll" },
];

export interface WebEditorShortcut {
  /** Phím hiển thị trong dialog (không phải accelerator Electron). */
  keys: string;
  /** Mô tả tiếng Việt / tiếng Anh. */
  labelEn: string;
  labelVi: string;
}

/** Phím tắt của editor web (apps/web/src/App.tsx) — không qua menu. */
export const WEB_EDITOR_SHORTCUTS: WebEditorShortcut[] = [
  { keys: "Space / K", labelEn: "Play / pause", labelVi: "Phát / dừng" },
  { keys: "J", labelEn: "Reverse playback", labelVi: "Phát ngược" },
  { keys: "L", labelEn: "Jump forward 5s", labelVi: "Tua tới 5 giây" },
  { keys: "S", labelEn: "Split clip at playhead", labelVi: "Cắt clip tại playhead" },
  { keys: "Delete / Backspace", labelEn: "Delete selection", labelVi: "Xóa vùng chọn" },
  { keys: "← / →", labelEn: "Step one frame", labelVi: "Tua từng frame" },
  { keys: "Home / End", labelEn: "Go to start / end", labelVi: "Về đầu / cuối dự án" },
  { keys: "F", labelEn: "Fullscreen preview", labelVi: "Toàn màn hình khung xem trước" },
  { keys: "M", labelEn: "Add marker at playhead", labelVi: "Thêm marker tại playhead" },
  { keys: "Esc", labelEn: "Close open panel", labelVi: "Đóng panel đang mở" },
];
