/**
 * about.ts — dialog Giới thiệu / Phím tắt / Báo lỗi (Phase 10, luồng G5).
 *
 * Dialog dùng dialog.showMessageBox của Electron (native, không cần cửa
 * sổ riêng). About hiển thị: tên app, version (app.getVersion() — lấy từ
 * apps/desktop/package.json), license MIT, link repo/docs, và các đường
 * dẫn log/config để user gửi kèm báo lỗi. Không có telemetry.
 *
 * Các hàm nhận deps qua tham số (dialog/shell/clipboard/app) để test
 * được mà không cần Electron thật — xem test ở /tmp (không commit).
 */
import type { BrowserWindow, MessageBoxOptions } from "electron";
import { getDesktopLabels, tDesktop, type DesktopLang } from "./i18n-desktop";
import { DESKTOP_MENU_SHORTCUTS, WEB_EDITOR_SHORTCUTS } from "./shortcuts";
import type { DesktopPaths } from "./desktop-paths";

export const REPO_URL = "https://github.com/vectornewsai-cmyk/repo-1";
export const DOCS_URL = `${REPO_URL}/blob/main/docs/DESKTOP.md`;
export const USER_GUIDE_URL = `${REPO_URL}/blob/main/docs/USER_GUIDE.md`;
export const ISSUES_URL = `${REPO_URL}/issues`;

export interface AboutVersions {
  chrome: string;
  electron: string;
  node: string;
}

export interface AboutInfo {
  lang: DesktopLang;
  paths: DesktopPaths;
  productName: string;
  versions: AboutVersions;
  version: string;
}

/** Nội dung detail của About — pure, test được. */
export function buildAboutDetail(info: AboutInfo): string {
  const labels = getDesktopLabels(info.lang);
  return [
    `${info.productName} ${info.version}`,
    labels.about.detailLine1,
    labels.about.detailLine2,
    "",
    `Electron ${info.versions.electron} · Chromium ${info.versions.chrome} · Node.js ${info.versions.node}`,
    "",
    labels.about.repoLine.split("{value}").join(REPO_URL),
    labels.about.docsLine.split("{value}").join(DOCS_URL),
    "",
    labels.about.logHint,
    `Log: ${info.paths.logPath}`,
    labels.about.settingsLine.split("{value}").join(info.paths.settingsPath),
  ].join("\n");
}

/** Nội dung detail của dialog Phím tắt — pure, test được. */
export function buildShortcutsDetail(lang: DesktopLang): string {
  const labels = getDesktopLabels(lang);
  const lines: string[] = [labels.shortcuts.detailIntro, ""];
  for (const s of DESKTOP_MENU_SHORTCUTS) {
    lines.push(`${s.accelerator.replace("CommandOrControl", "Ctrl")} — ${tDesktop(lang, s.labelKey)}`);
  }
  lines.push("");
  for (const s of WEB_EDITOR_SHORTCUTS) {
    lines.push(`${s.keys} — ${lang === "vi" ? s.labelVi : s.labelEn}`);
  }
  return lines.join("\n");
}

export interface DialogDeps {
  clipboard: { writeText(text: string): void };
  dialog: {
    showMessageBox(win: BrowserWindow, options: MessageBoxOptions): Promise<{ response: number }>;
  };
  shell: { openExternal(url: string): Promise<void>; openPath(p: string): Promise<string> };
}

/** Dialog Giới thiệu. Nút: Sao chép thông tin / Mở kho GitHub / Đóng. */
export async function showAboutDialog(
  win: BrowserWindow,
  deps: DialogDeps,
  info: AboutInfo,
): Promise<void> {
  const labels = getDesktopLabels(info.lang);
  const detail = buildAboutDetail(info);
  const result = await deps.dialog.showMessageBox(win, {
    buttons: [labels.about.copyInfo, labels.about.openRepo, labels.common.close],
    detail,
    message: info.productName,
    title: labels.about.title,
    type: "info",
  });
  if (result.response === 0) {
    deps.clipboard.writeText(detail);
  } else if (result.response === 1) {
    await deps.shell.openExternal(REPO_URL);
  }
}

/** Dialog Phím tắt (một nút Đóng). */
export async function showShortcutsDialog(
  win: BrowserWindow,
  dialog: DialogDeps["dialog"],
  lang: DesktopLang,
): Promise<void> {
  const labels = getDesktopLabels(lang);
  await dialog.showMessageBox(win, {
    buttons: [labels.common.close],
    detail: buildShortcutsDetail(lang),
    message: labels.shortcuts.message,
    title: labels.shortcuts.title,
    type: "info",
  });
}

/**
 * Dialog Báo lỗi. Nút: Mở thư mục log / Sao chép thông tin / Mở trang
 * Issues / Đóng. Không gửi gì đi — user tự quyết định gửi file log.
 */
export async function showReportBugDialog(
  win: BrowserWindow,
  deps: DialogDeps,
  info: AboutInfo,
): Promise<void> {
  const labels = getDesktopLabels(info.lang);
  const detail = [
    labels.reportBug.detail,
    "",
    `Log: ${info.paths.logPath}`,
    labels.about.settingsLine.split("{value}").join(info.paths.settingsPath),
    labels.about.versionLine
      .split("{value}")
      .join(`${info.productName} ${info.version}`)
      .split("{electron}")
      .join(info.versions.electron),
  ].join("\n");
  const result = await deps.dialog.showMessageBox(win, {
    buttons: [
      labels.reportBug.openLogDir,
      labels.reportBug.copyInfo,
      labels.reportBug.openIssues,
      labels.common.close,
    ],
    detail,
    message: labels.reportBug.message,
    title: labels.reportBug.title,
    type: "info",
  });
  if (result.response === 0) {
    await deps.shell.openPath(info.paths.userData);
  } else if (result.response === 1) {
    deps.clipboard.writeText(detail);
  } else if (result.response === 2) {
    await deps.shell.openExternal(ISSUES_URL);
  }
}
