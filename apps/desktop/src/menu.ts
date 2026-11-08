/**
 * menu.ts — menu native của app (Phase 10, luồng G5; khung ban đầu: G1).
 *
 * Nhãn tiếng Việt mặc định, fallback tiếng Anh (xem i18n-desktop.ts).
 * Ngôn ngữ đổi ở Xem > Ngôn ngữ → lưu vào settings.json, rebuild menu
 * và báo renderer đổi theo (`vcut:language-changed`).
 *
 * Chữ ký: setAppMenu(win) — main.ts gọi qua wireDesktopUx(win) trong
 * createWindow; desktop-ux.ts giữ DesktopUx.rebuildMenu() để main rebuild
 * khi ngôn ngữ đổi từ TopBar. Recent projects đọc từ settings.json
 * (G5 là chủ sở hữu duy nhất — G4 đã xoá kho recent riêng; xem header
 * native-files.ts). Thư mục dialog gần nhất đọc từ LastDirStore (G4).
 *
 * NGUYÊN TẮC SỬA LỖI QUAN TRỌNG (G5): các mục Chỉnh sửa (hoàn tác/làm
 * lại/cắt/sao chép/dán/chọn tất cả) KHÔNG được dùng role native của
 * Electron. Role 'undo'/'copy'/... chỉ tác động lên clipboard/undo của
 * Chromium — editor VCut dùng undo stack và clipboard riêng trong store
 * (apps/web/src/store.ts) nên role sẽ im lặng hoặc làm sai. Các mục này
 * gửi action về renderer qua `vcut:menu-action`, renderer gọi đúng hàm
 * store (xem apps/web/src/desktop.ts). Chỉ các mục thuần cửa sổ (tải lại,
 * zoom, toàn màn hình, thu nhỏ, đóng, thoát) mới dùng role.
 *
 * Phím tắt trong menu KHỚP với phím tắt web app đã có (App.tsx) — xem
 * docs/DESKTOP.md § "Kiểm tra xung đột phím tắt". Renderer chặn (guard)
 * các tổ hợp menu đã nhận ở App.tsx để không chạy trùng hai lần.
 */
import { app, BrowserWindow, Menu, MenuItemConstructorOptions, clipboard, dialog, shell } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import type { MenuActionId } from "./preload";
import { getDesktopLabels, type DesktopLabels, type DesktopLang } from "./i18n-desktop";
import { DESKTOP_MENU_SHORTCUTS } from "./shortcuts";
import { getDesktopSettings } from "./settings";
import { desktopPaths } from "./desktop-paths";
import { LastDirStore } from "./native-files";
import {
  ISSUES_URL,
  USER_GUIDE_URL,
  showAboutDialog,
  showReportBugDialog,
  showShortcutsDialog,
  type AboutInfo,
  type DialogDeps,
} from "./about";

/** Các action gửi về renderer (renderer xử lý ở apps/web/src/desktop.ts). */
export const MENU_ACTIONS = [
  "copy",
  "cut",
  "delete",
  "duplicate",
  "export-video",
  "new-project",
  "paste",
  "redo",
  "save-project",
  "save-project-as",
  "select-all",
  "undo",
] as const;

/** LastDirStore dùng chung cho các dialog của menu (khởi tạo lười). */
let lastDirs: LastDirStore | null = null;

function getLastDirs(): LastDirStore {
  if (!lastDirs) lastDirs = new LastDirStore(app.getPath("userData"));
  return lastDirs;
}

function sendAction(win: BrowserWindow, action: MenuActionId): void {
  win.webContents.send("vcut:menu-action", action);
}

function openProjectDialogFlow(win: BrowserWindow, labels: DesktopLabels): void {
  const dirs = getLastDirs();
  void dialog
    .showOpenDialog(win, {
      defaultPath: dirs.getLastDir(),
      filters: [
        { extensions: ["vcut", "vcut.json", "json"], name: labels.dialogs.projectFilterLong },
        { extensions: ["*"], name: labels.dialogs.allFiles },
      ],
      properties: ["openFile"],
      title: labels.dialogs.openProject,
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        dirs.noteFileSelection(result.filePaths[0]);
        win.webContents.send("vcut:open-file", result.filePaths[0]);
      }
    });
}

function openMediaDialogFlow(win: BrowserWindow, labels: DesktopLabels): void {
  const dirs = getLastDirs();
  void dialog
    .showOpenDialog(win, {
      defaultPath: dirs.getLastDir(),
      filters: [
        {
          extensions: ["mp4", "mov", "webm", "mkv", "avi", "mp3", "wav", "ogg", "flac", "png", "jpg", "jpeg", "webp", "gif"],
          name: labels.dialogs.mediaFilter,
        },
        { extensions: ["*"], name: labels.dialogs.allFiles },
      ],
      properties: ["openFile", "multiSelections"],
      title: labels.dialogs.addMedia,
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        for (const filePath of result.filePaths) {
          dirs.noteFileSelection(filePath);
          win.webContents.send("vcut:open-file", filePath);
        }
      }
    });
}

/** Lấy accelerator của một action từ bảng dùng chung (shortcuts.ts). */
function acceleratorFor(action: string): string | undefined {
  return DESKTOP_MENU_SHORTCUTS.find((s) => s.action === action)?.accelerator;
}

function buildAboutInfo(lang: DesktopLang): AboutInfo {
  const paths = desktopPaths(app.getPath("userData"));
  return {
    lang,
    paths,
    productName: "VCut Studio",
    versions: {
      chrome: process.versions.chrome ?? "",
      electron: process.versions.electron ?? "",
      node: process.versions.node ?? "",
    },
    version: app.getVersion(),
  };
}

export function buildMenu(win: BrowserWindow): Menu {
  const settings = getDesktopSettings(app.getPath("userData"));
  const lang = settings.get().lang;
  const labels = getDesktopLabels(lang);
  const m = labels.menu;
  const dialogDeps: DialogDeps = { clipboard, dialog, shell };
  const aboutInfo = buildAboutInfo(lang);

  const changeLanguage = (next: DesktopLang): void => {
    if (settings.get().lang === next) return;
    settings.setLang(next);
    setAppMenu(win);
    if (!win.isDestroyed()) {
      win.webContents.send("vcut:language-changed", next);
    }
  };

  const openRecentFile = (filePath: string): void => {
    let exists = false;
    try {
      exists = fs.existsSync(filePath);
    } catch {
      exists = false;
    }
    if (!exists) {
      settings.removeRecent(filePath);
      setAppMenu(win);
      void dialog.showMessageBox(win, {
        buttons: ["OK"],
        detail: filePath,
        message: lang === "vi" ? "Không tìm thấy file dự án này nữa." : "This project file no longer exists.",
        type: "warning",
      });
      return;
    }
    win.webContents.send("vcut:open-file", filePath);
    if (win.isMinimized()) win.restore();
    win.focus();
  };

  const recent = settings.get().recentProjects;
  const recentSubmenu: MenuItemConstructorOptions = {
    label: m.recentProjects,
    submenu:
      recent.length === 0
        ? [{ enabled: false, label: m.recentEmpty }]
        : [
            ...recent.map((filePath) => ({
              click: () => openRecentFile(filePath),
              label: path.basename(filePath),
            })),
            { type: "separator" as const },
            {
              click: () => {
                settings.clearRecents();
                setAppMenu(win);
              },
              label: m.recentClear,
            },
          ],
  };

  const template: MenuItemConstructorOptions[] = [
    {
      label: m.file,
      submenu: [
        { accelerator: acceleratorFor("new-project"), click: () => sendAction(win, "new-project"), label: m.newProject },
        { accelerator: acceleratorFor("open-project"), click: () => openProjectDialogFlow(win, labels), label: m.openProject },
        { click: () => openMediaDialogFlow(win, labels), label: m.addMedia },
        recentSubmenu,
        { type: "separator" },
        { accelerator: acceleratorFor("save-project"), click: () => sendAction(win, "save-project"), label: m.saveProject },
        { accelerator: acceleratorFor("save-project-as"), click: () => sendAction(win, "save-project-as"), label: m.saveAs },
        { accelerator: acceleratorFor("export-video"), click: () => sendAction(win, "export-video"), label: m.exportVideo },
        { type: "separator" },
        { label: m.exit, role: "quit" },
      ],
    },
    {
      label: m.edit,
      submenu: [
        { accelerator: acceleratorFor("undo"), click: () => sendAction(win, "undo"), label: m.undo },
        { accelerator: acceleratorFor("redo"), click: () => sendAction(win, "redo"), label: m.redo },
        { type: "separator" },
        { accelerator: acceleratorFor("cut"), click: () => sendAction(win, "cut"), label: m.cut },
        { accelerator: acceleratorFor("copy"), click: () => sendAction(win, "copy"), label: m.copy },
        { accelerator: acceleratorFor("paste"), click: () => sendAction(win, "paste"), label: m.paste },
        { accelerator: acceleratorFor("duplicate"), click: () => sendAction(win, "duplicate"), label: m.duplicate },
        // Xóa KHÔNG gán accelerator: phím Delete đã do web app xử lý
        // (App.tsx); gán thêm ở menu sẽ xóa trùng hai lần.
        { click: () => sendAction(win, "delete"), label: m.delete },
        { type: "separator" },
        { accelerator: acceleratorFor("select-all"), click: () => sendAction(win, "select-all"), label: m.selectAll },
      ],
    },
    {
      label: m.view,
      submenu: [
        { accelerator: "CommandOrControl+R", label: m.reload, role: "reload" },
        { accelerator: "CommandOrControl+Shift+R", label: m.forceReload, role: "forceReload" },
        { accelerator: "F12", label: m.toggleDevTools, role: "toggleDevTools" },
        { type: "separator" },
        { accelerator: "CommandOrControl+0", label: m.zoomReset, role: "resetZoom" },
        { accelerator: "CommandOrControl+Plus", label: m.zoomIn, role: "zoomIn" },
        { accelerator: "CommandOrControl+-", label: m.zoomOut, role: "zoomOut" },
        { type: "separator" },
        { accelerator: "F11", label: m.fullscreen, role: "togglefullscreen" },
        { type: "separator" },
        {
          label: m.language,
          submenu: [
            {
              checked: lang === "vi",
              click: () => changeLanguage("vi"),
              label: "Tiếng Việt",
              type: "radio",
            },
            {
              checked: lang === "en",
              click: () => changeLanguage("en"),
              label: "English",
              type: "radio",
            },
          ],
        },
      ],
    },
    {
      label: m.window,
      submenu: [
        { label: m.minimize, role: "minimize" },
        { label: m.closeWindow, role: "close" },
      ],
    },
    {
      label: m.help,
      submenu: [
        {
          click: () => {
            void showAboutDialog(win, dialogDeps, aboutInfo);
          },
          label: m.about,
        },
        {
          click: () => {
            void showShortcutsDialog(win, dialog, lang);
          },
          label: m.shortcuts,
        },
        { type: "separator" },
        {
          click: () => {
            void shell.openExternal(USER_GUIDE_URL);
          },
          label: m.docs,
        },
        {
          click: () => {
            void showReportBugDialog(win, dialogDeps, aboutInfo);
          },
          label: m.reportBug,
        },
        { type: "separator" },
        {
          click: () => {
            void shell.openExternal(ISSUES_URL);
          },
          label: m.openGithub,
        },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

export function setAppMenu(win: BrowserWindow): void {
  Menu.setApplicationMenu(buildMenu(win));
}
