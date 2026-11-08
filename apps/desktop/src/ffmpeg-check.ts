/**
 * Kiểm tra ffmpeg hệ thống lúc chạy — Phase 10, luồng G3.
 *
 * QUYẾT ĐỊNH (xem docs/PHASE10_G3_LINUX_PACKAGING_LIMITS.md §4): dùng
 * ffmpeg HỆ THỐNG, không bundle ffmpeg-static. Render pipeline
 * (server/render) vốn đã dùng `ffmpeg` trên PATH (hoặc biến môi trường
 * FFMPEG, xem server/bridge/src/index.js: `FFMPEG = process.env.FFMPEG
 * || "ffmpeg"`), và bridge /api/health đã báo `ffmpeg: true/false` +
 * version. Check này giữ cùng một quy ước: tôn trọng FFMPEG env, kiểm
 * tra bằng `ffmpeg -version`.
 *
 * Main process gọi checkFfmpeg() sau app.whenReady(): nếu thiếu thì hiện
 * dialog hướng dẫn cài đặt (ffmpegInstallHint()) và ghi log — app vẫn mở
 * để xem/sửa project, render/export sau đó báo lỗi rõ ràng thay vì crash
 * với lỗi spawn ENOENT khó hiểu.
 */
import { spawnSync } from "node:child_process";
import { getDesktopLabels, type DesktopLang } from "./i18n-desktop";

export interface FfmpegCheckResult {
  error: string | null;
  ok: boolean;
  path: string;
  version: string | null;
}

export function ffmpegPath(): string {
  return process.env.FFMPEG || "ffmpeg";
}

export function checkFfmpeg(): FfmpegCheckResult {
  const path = ffmpegPath();
  let r;
  try {
    r = spawnSync(path, ["-version"], { encoding: "utf8", timeout: 10000 });
  } catch (e) {
    return {
      error: String((e as Error)?.message ?? e),
      ok: false,
      path,
      version: null,
    };
  }
  if (r.error) {
    return { error: String(r.error.message), ok: false, path, version: null };
  }
  if (r.status !== 0) {
    return {
      error: `ffmpeg thoát mã ${r.status}: ${(r.stderr || "").trim().slice(0, 200)}`,
      ok: false,
      path,
      version: null,
    };
  }
  const firstLine = String(r.stdout || "")
    .split("\n")[0]
    .trim();
  return { error: null, ok: true, path, version: firstLine || null };
}

/**
 * Hướng dẫn cài ffmpeg theo distro, hiển thị khi check thất bại.
 * Đợt 61 R6 — text nay lấy từ i18n-desktop (`ffmpeg.installHint`);
 * mặc định vi để caller cũ không truyền lang vẫn giữ hành vi cũ.
 */
export function ffmpegInstallHint(lang: DesktopLang = "vi"): string {
  return getDesktopLabels(lang).ffmpeg.installHint;
}
