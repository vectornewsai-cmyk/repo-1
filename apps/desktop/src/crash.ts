/**
 * crash.ts — xử lý crash ở main process (Phase 10, luồng G5).
 *
 * - uncaughtException / unhandledRejection ở main → ghi log, KHÔNG gửi
 *   crash report đi đâu (local-first, không telemetry — khác hẳn
 *   crashReporter mặc định của Electron, module này KHÔNG dùng nó).
 * - Renderer crash (render-process-gone) → dialog cho user chọn tải lại
 *   trang hoặc đóng app.
 * - Log: userData/logs/main.log, xoay khi > 2 MiB (giữ 1 bản .1 cũ).
 * - Chống đệ quy: nếu crash xảy ra trong lúc đang xử lý crash thì chỉ
 *   ghi log rồi thoát với code 1 (không mở dialog chồng dialog).
 */
import type { BrowserWindow, MessageBoxOptions } from "electron";
import * as fs from "node:fs";
import * as path from "node:path";
import { getDesktopLabels, type DesktopLang } from "./i18n-desktop";
import { logFilePath } from "./desktop-paths";

export const MAX_CRASH_LOG_BYTES = 2 * 1024 * 1024;

export function crashLogPath(userDataDir: string): string {
  return logFilePath(userDataDir);
}

export function formatCrashLogLine(context: string, err: unknown): string {
  const stamp = new Date().toISOString();
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  return `[${stamp}] ${context}: ${message}\n`;
}

/** Xoay log khi vượt giới hạn: main.log → main.log.1 (ghi đè bản cũ). */
export function rotateLogIfNeeded(logPath: string): void {
  try {
    const stat = fs.statSync(logPath);
    if (stat.size <= MAX_CRASH_LOG_BYTES) return;
    fs.renameSync(logPath, `${logPath}.1`);
  } catch {
    // File chưa có hoặc không xoay được — append sẽ tự tạo/xử lý.
  }
}

/** Ghi một dòng log crash (best-effort, không bao giờ ném). */
export function appendCrashLog(logPath: string, context: string, err: unknown): void {
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    rotateLogIfNeeded(logPath);
    fs.appendFileSync(logPath, formatCrashLogLine(context, err), "utf-8");
  } catch {
    // Không ghi được log thì cũng không được làm app chết thêm.
  }
}

export interface CrashHandlerDeps {
  /** App: chỉ cần relaunch/quit — tách riêng để test không cần electron. */
  app: { quit(): void; relaunch(): void };
  dialog: {
    showMessageBox(win: BrowserWindow, options: MessageBoxOptions): Promise<{ response: number }>;
    // G1 seam fix (06/11): Electron's Dialog.showMessageBoxSync KHÔNG nhận
    // window null (BaseWindow bắt buộc) — type cũ `BrowserWindow | null`
    // làm Electron Dialog không assign được. Call site đã guard null.
    showMessageBoxSync(win: BrowserWindow, options: MessageBoxOptions): number;
  };
  getMainWindow: () => BrowserWindow | null;
  lang: DesktopLang;
  logPath: string;
}

/**
 * Cài handler cho main process. Trả về hàm gỡ (dùng cho test / HMR).
 * Dialog crash là đồng bộ (showMessageBoxSync) để chắc chắn user thấy
 * trước khi process thoát. Cài trùng lần 2 (vd: macOS activate tạo lại
 * cửa sổ) sẽ trả về hàm gỡ rỗng — không đăng ký listener trùng.
 */
let crashHandlersInstalled = false;

export function installCrashHandlers(deps: CrashHandlerDeps): () => void {
  if (crashHandlersInstalled) return () => {};
  crashHandlersInstalled = true;
  let handling = false;

  const handleFatal = (context: string, err: unknown): void => {
    appendCrashLog(deps.logPath, context, err);
    if (handling) {
      process.exit(1);
      return;
    }
    handling = true;
    const labels = getDesktopLabels(deps.lang);
    const detail = [
      labels.crash.detail,
      "",
      `Log: ${deps.logPath}`,
      "",
      err instanceof Error ? err.message : String(err),
    ].join("\n");
    try {
      const win = deps.getMainWindow();
      // Không còn cửa sổ nào: mặc định chọn "Thoát" (response 1).
      const response =
        win !== null
          ? deps.dialog.showMessageBoxSync(win, {
              buttons: [labels.crash.restart, labels.crash.quit],
              detail,
              message: labels.crash.message,
              title: labels.crash.title,
              type: "error",
            })
          : 1;
      if (response === 0) {
        deps.app.relaunch();
        deps.app.quit();
      } else {
        deps.app.quit();
      }
    } catch {
      // Dialog cũng lỗi → thoát để không kẹt process nửa sống nửa chết.
      process.exit(1);
    }
  };

  const onUncaught = (err: Error): void => handleFatal("uncaughtException", err);
  const onRejection = (reason: unknown): void => {
    // Unhandled rejection chưa chắc fatal (promise lẻ) — chỉ ghi log,
    // không mở dialog để tránh spam; xem docs/DESKTOP.md.
    appendCrashLog(deps.logPath, "unhandledRejection", reason);
  };

  process.on("uncaughtException", onUncaught);
  process.on("unhandledRejection", onRejection);

  return () => {
    process.off("uncaughtException", onUncaught);
    process.off("unhandledRejection", onRejection);
    crashHandlersInstalled = false;
  };
}

/**
 * Theo dõi renderer crash cho một cửa sổ. Khi render process chết
 * (crash/kill/OOM): ghi log + dialog [Tải lại giao diện / Đóng ứng dụng].
 */
export function watchWindowForCrash(
  win: BrowserWindow,
  deps: Omit<CrashHandlerDeps, "getMainWindow">,
): void {
  win.webContents.on("render-process-gone", (_event, details) => {
    const reason = `render-process-gone (${details.reason})`;
    appendCrashLog(deps.logPath, reason, new Error(reason));
    const labels = getDesktopLabels(deps.lang);
    const detail = [
      labels.crash.detail,
      "",
      `Log: ${deps.logPath}`,
      "",
      labels.crash.reasonLine
        .split("{reason}")
        .join(details.reason)
        .split("{exitPart}")
        .join(details.exitCode !== 0 ? ` (exit code ${details.exitCode})` : ""),
    ].join("\n");
    void deps.dialog
      .showMessageBox(win, {
        buttons: [labels.crash.reload, labels.crash.quit],
        detail,
        message: labels.crash.message,
        title: labels.crash.title,
        type: "error",
      })
      .then((result) => {
        if (result.response === 0) {
          if (!win.isDestroyed()) win.webContents.reload();
        } else {
          deps.app.quit();
        }
      })
      .catch(() => {
        // Dialog lỗi → không làm gì thêm (app vẫn chạy, user tự đóng).
      });
  });
}
