/**
 * desktop-ux.ts — điểm nối UX desktop vào main process (Phase 10, G5).
 *
 * main.ts (G1/G4) gọi `desktopUx = wireDesktopUx(win)` đúng một lần trong
 * createWindow (trước khi load URL) và giữ lại DesktopUx để đồng bộ ngôn
 * ngữ từ TopBar (`desktopUx.settings.setLang` + `desktopUx.rebuildMenu()`).
 *
 * wireDesktopUx làm bốn việc:
 * 1. đăng ký IPC file (file-io.ts): đọc/ghi project & media, recent,
 *    đường dẫn project hiện tại, `desktop:get-paths`;
 * 2. cài xử lý crash (main + render-process-gone) — crash.ts;
 * 3. build menu lần đầu (menu.ts);
 * 4. trả về DesktopUx (settings dùng chung một instance với menu — KHÔNG
 *    tạo store thứ hai, xem ghi chú của G4 trong main.ts).
 *
 * Các phần khác đã có chủ riêng, KHÔNG nhân bản ở đây:
 * - Menu + ngôn ngữ + About + Báo lỗi: menu.ts / about.ts / settings.ts.
 * - Thư mục dialog gần nhất: LastDirStore của G4 (native-files.ts).
 * - Trạng thái cửa sổ: windowState.ts (G1).
 * - IPC dialog/info/services: main.ts registerIpc (G1).
 * - Xuất MP4 dạng stream: registerExportFileIpc của G4 (main.ts).
 */
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { installCrashHandlers, watchWindowForCrash, crashLogPath } from "./crash";
import { setAppMenu } from "./menu";
import { FileSession, registerFileIpc } from "./file-io";
import { getDesktopSettings, type SettingsStore } from "./settings";
import type { DesktopLang } from "./i18n-desktop";

export interface DesktopUx {
  getLogPath: () => string;
  getSettingsPath: () => string;
  rebuildMenu: () => void;
  setLanguage: (lang: DesktopLang) => void;
  /** Store cài đặt dùng chung với menu (main.ts dùng để đồng bộ ngôn ngữ từ TopBar). */
  settings: SettingsStore;
}

export function wireDesktopUx(win: BrowserWindow): DesktopUx {
  const userDataDir = app.getPath("userData");
  const settings = getDesktopSettings(userDataDir);
  const session = new FileSession();
  const logPath = crashLogPath(userDataDir);

  const rebuildMenu = (): void => {
    if (!win.isDestroyed()) setAppMenu(win);
  };

  // File IPC (đăng ký một lần nhờ guard trong registerFileIpc — macOS
  // activate tạo lại cửa sổ vẫn an toàn). Recent đổi → rebuild menu.
  registerFileIpc(ipcMain, {
    addRecentDocument: (p) => app.addRecentDocument(p),
    onRecentChanged: rebuildMenu,
    session,
    settings,
    userDataDir,
  });

  // Crash: process-level (crash.ts tự guard cài trùng) + theo dõi render
  // process của cửa sổ này.
  installCrashHandlers({
    app: { quit: () => app.quit(), relaunch: () => app.relaunch() },
    dialog,
    getMainWindow: () => (win.isDestroyed() ? null : win),
    lang: settings.get().lang,
    logPath,
  });
  watchWindowForCrash(win, {
    app: { quit: () => app.quit(), relaunch: () => app.relaunch() },
    dialog,
    lang: settings.get().lang,
    logPath,
  });

  setAppMenu(win);

  return {
    getLogPath: () => logPath,
    getSettingsPath: () => settings.path,
    rebuildMenu,
    setLanguage: (lang) => {
      if (settings.get().lang === lang) return;
      settings.setLang(lang);
      rebuildMenu();
      if (!win.isDestroyed()) {
        win.webContents.send("vcut:language-changed", lang);
      }
    },
    settings,
  };
}
