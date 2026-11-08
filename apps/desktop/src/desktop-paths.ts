/**
 * desktop-paths.ts — các đường dẫn userData của app desktop (Phase 10, G5).
 *
 * userData do Electron quyết định theo tên app:
 * - Bản đóng gói (electron-builder, productName "VCut Studio"):
 *   Linux → ~/.config/VCut Studio/
 * - Chạy dev bằng `electron .`: tên lấy từ package.json
 *   (@repo-1/desktop) → Linux → ~/.config/@repo-1/desktop/
 *   (đã kiểm chứng bằng smoke test 06/11: settings.json +
 *   window-state.json nằm ở đó).
 * Code KHÔNG hardcode đường dẫn — luôn dùng app.getPath("userData").
 * - settings.json: cài đặt desktop (xem settings.ts).
 * - window-state.json: kích thước/vị trí cửa sổ (xem windowState.ts, G1).
 * - logs/main.log: log main process + crash (xem crash.ts).
 *
 * About dialog và dialog Báo lỗi hiển thị các đường dẫn này để user gửi
 * kèm báo lỗi — không có đường dẫn nào tự gửi đi đâu.
 */
import * as path from "node:path";
import { settingsFilePath } from "./settings";

export interface DesktopPaths {
  logPath: string;
  settingsPath: string;
  userData: string;
}

export function logFilePath(userDataDir: string): string {
  return path.join(userDataDir, "logs", "main.log");
}

export function desktopPaths(userDataDir: string): DesktopPaths {
  return {
    logPath: logFilePath(userDataDir),
    settingsPath: settingsFilePath(userDataDir),
    userData: userDataDir,
  };
}
