/**
 * native-files.ts — helper file native của app desktop (Phase 10, luồng G4).
 *
 * PHẠM VI (sau khi đối chiếu với G5, 06/11): G5 đã làm ở file-io.ts +
 * settings.ts + menu.ts + desktop-ux.ts: đọc/ghi file project qua IPC
 * (`desktop:read-file`, `desktop:write-project-file`,
 * `desktop:note-project-opened`), Recent Projects trong settings.json,
 * submenu Recent ở menu Tệp. G4 KHÔNG làm lại những thứ đó — file này
 * chỉ giữ phần G5 chưa có:
 *   1. helper thuần nhận diện đường dẫn (project/archive/media, MIME,
 *      argv, tên file mặc định) — dùng chung cho main + test;
 *   2. LastDirStore — nhớ thư mục gần nhất của dialog (file riêng
 *      `vcut-last-dirs.json` trong userData, theo mẫu windowState.ts;
 *      settings.json của G5 không có trường này);
 *   3. saveExportFile — lưu MP4 đã render xong ra đường dẫn user chọn
 *      bằng cách STREAM từ bridge (`/api/render/{jobId}/download`) thay
 *      vì chở cả file qua IPC (video có thể hàng GB).
 *
 * LỊCH SỬ: bản đầu của file này có NativeFileService đọc/ghi/recent
 * riêng (`vcut-native-files.json`) — đã XOÁ vì trùng với file-io.ts +
 * settings.ts của G5; giữ hai kho recent song song sẽ lệch nhau (menu
 * đọc settings.json, renderer đọc kho kia). Xem LIMITS G4 §1.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
// Đợt 85 M5: ghi file qua helper retry EPERM + verify đủ byte (port JS của
// apps/web/scripts/eperm-retry.mjs; xem services/epermRetry.js).
import { writeFileEpermRetry } from "./services/epermRetry.js";
import type { ipcMain as ElectronIpcMain } from "electron";
import { getDesktopLabels, tDesktopVars, type DesktopLang } from "./i18n-desktop";

/** Đợt 61 R6 — lookup i18n cho lỗi lưu MP4 + filter dialog (key trong
 * i18n-desktop: `nativeFiles.*`, `dialogs.*`). `t` vắng → fallback đúng
 * từng chữ chuỗi VI cũ.
 */
export type NativeFilesLookup = (key: string, vars?: Record<string, string>) => string;
function trKey(
  lookup: NativeFilesLookup | undefined,
  key: string,
  vars: Record<string, string>,
  fallback: string,
): string {
  if (!lookup) return fallback;
  const out = lookup(key, vars);
  return out === key ? fallback : out;
}

/** Đuôi file project VCut (`.vcut` trần được coi như JSON, tương thích G1). */
export const PROJECT_EXTENSIONS = ["vcut", "vcut.json", "json"] as const;
export const ARCHIVE_EXTENSIONS = ["vcut.zip", "zip"] as const;

/** Đuôi media mà editor import được (khớp filter dialog của G1). */
export const NATIVE_MEDIA_EXTENSIONS = [
  "mp4",
  "mov",
  "webm",
  "mkv",
  "avi",
  "mp3",
  "wav",
  "ogg",
  "flac",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
] as const;

export const MEDIA_FILTER_EXTENSIONS: string[] = [...NATIVE_MEDIA_EXTENSIONS];

/** Giới hạn đọc file ở main (khớp file-io.ts của G5 — 2 GiB). */
export const MAX_READ_FILE_BYTES = 2 * 1024 * 1024 * 1024;

export type ProjectKind = "json" | "zip";

/** `.vcut` / `.vcut.json` / `.json` → project JSON; `.vcut.zip` / `.zip` → bản nén. */
export function projectKindForPath(filePath: string): ProjectKind | null {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".vcut.zip") || lower.endsWith(".zip")) return "zip";
  if (lower.endsWith(".vcut") || lower.endsWith(".vcut.json") || lower.endsWith(".json")) return "json";
  return null;
}

export function isProjectFilePath(filePath: string): boolean {
  return projectKindForPath(filePath) === "json";
}

export function isArchiveFilePath(filePath: string): boolean {
  return projectKindForPath(filePath) === "zip";
}

export function isMediaFilePath(filePath: string): boolean {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return (NATIVE_MEDIA_EXTENSIONS as readonly string[]).includes(ext);
}

const MIME_BY_EXTENSION: Record<string, string> = {
  avi: "video/x-msvideo",
  flac: "audio/flac",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  ogg: "audio/ogg",
  png: "image/png",
  wav: "audio/wav",
  webm: "video/webm",
  webp: "image/webp",
};

/** MIME theo đuôi file (renderer dùng khi dựng File từ bytes IPC). */
export function mimeForMediaPath(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

/**
 * Tìm file project trong argv (Linux: mở app bằng file, second-instance).
 * Quét toàn bộ argv, trả về file project ĐẦU TIÊN (không chỉ argv[2]).
 */
export function findProjectPathInArgv(argv: readonly string[]): string | null {
  for (const arg of argv) {
    if (typeof arg === "string" && projectKindForPath(arg) !== null) return arg;
  }
  return null;
}

/**
 * Chuẩn hoá tên file: bỏ dấu tiếng Việt (đ → d) thay vì xoá luôn ký tự
 * có dấu — "Đám cưới Lan Hùng" thành "Dam cuoi Lan Hung", không thành
 * "m ci Lan Hng" như regex \w ASCII thuần.
 */
export function toSafeFileBase(name: string, fallback: string): string {
  const ascii = (name || fallback)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  const safe = ascii.replace(/[^\w\- ]+/g, "").trim();
  return safe || fallback;
}

/** Tên file mặc định khi Lưu thành (từ tên project, bỏ ký tự lạ). */
export function defaultProjectFileName(projectName: string): string {
  return `${toSafeFileBase(projectName, "du-an-chua-dat-ten")}.vcut`;
}

/** Tên file mặc định khi Xuất video. */
export function defaultExportFileName(projectName: string): string {
  return `${toSafeFileBase(projectName, "project")}.mp4`;
}

/** Filter dialog mở project (G1 dùng ở menu; giữ một chỗ để khỏi lệch). */
export function projectDialogFilters(
  lang: DesktopLang = "vi",
): { extensions: string[]; name: string }[] {
  const d = getDesktopLabels(lang).dialogs;
  return [
    { extensions: ["vcut", "json"], name: d.projectFilterLong },
    { extensions: ["*"], name: d.allFiles },
  ];
}

// ---------------------------------------------------------------------------
// LastDirStore — nhớ thư mục gần nhất của dialog (G5 chưa có).
// ---------------------------------------------------------------------------

export interface LastDirsState {
  lastDir: string | null;
}

export function lastDirsFilePath(userDataDir: string): string {
  return path.join(userDataDir, "vcut-last-dirs.json");
}

/** Store nhỏ, đồng bộ, fail-soft như windowState.ts (G1). */
export class LastDirStore {
  private readonly filePath: string;
  private lastDir: string | null = null;

  constructor(userDataDir: string) {
    this.filePath = lastDirsFilePath(userDataDir);
    this.load();
  }

  load(): void {
    try {
      const raw = JSON.parse(fs.readFileSync(this.filePath, "utf-8")) as unknown;
      if (typeof raw === "object" && raw !== null) {
        const dir = (raw as Record<string, unknown>).lastDir;
        if (typeof dir === "string" && dir.length > 0) this.lastDir = dir;
      }
    } catch {
      this.lastDir = null; // File thiếu/hỏng → quên thư mục, không crash app.
    }
  }

  saveBestEffort(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.tmp-${process.pid}`;
      writeFileEpermRetry(tmp, JSON.stringify({ lastDir: this.lastDir }), { label: "desktop-last-dirs.json" });
      fs.renameSync(tmp, this.filePath);
    } catch {
      // Ghi lỗi thì thôi — dialog lần sau chỉ mở thư mục mặc định.
    }
  }

  getLastDir(): string | undefined {
    return this.lastDir ?? undefined;
  }

  /** Ghi nhớ thư mục chứa `filePath` (gọi sau mỗi lần user chọn file). */
  noteFileSelection(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!dir || dir === this.lastDir) return;
    this.lastDir = dir;
    this.saveBestEffort();
  }
}

// ---------------------------------------------------------------------------
// Xuất video — stream MP4 từ bridge ra đường dẫn user đã chọn (G5 chưa có).
// ---------------------------------------------------------------------------

export const EXPORT_CHANNEL = "desktop:save-export-file";

export interface ExportSaveResult {
  bytes: number;
  ok: true;
  path: string;
}

/**
 * Tải video đã render (`GET /api/render/{jobId}/download`) và stream ra
 * `destPath`. Không chở bytes qua IPC (video có thể hàng GB). Ném lỗi
 * khi: đuôi đích không phải .mp4, bridge không trả 200, hoặc ghi lỗi.
 */
export async function saveExportFile(
  jobId: string,
  destPath: string,
  bridgeUrl: string,
  fetchImpl: typeof fetch = fetch,
  lookup?: NativeFilesLookup,
): Promise<ExportSaveResult> {
  if (!jobId || typeof jobId !== "string") {
    throw new Error(trKey(lookup, "nativeFiles.missingJobId", {}, "Thiếu jobId render."));
  }
  if (!destPath || typeof destPath !== "string") {
    throw new Error(trKey(lookup, "nativeFiles.missingDest", {}, "Thiếu đường dẫn đích."));
  }
  if (path.extname(destPath).toLowerCase() !== ".mp4") {
    throw new Error(
      trKey(
        lookup,
        "nativeFiles.destMustBeMp4",
        { path: destPath },
        `Đường dẫn đích phải là file .mp4: ${destPath}`,
      ),
    );
  }
  const url = `${bridgeUrl.replace(/\/$/, "")}/api/render/${encodeURIComponent(jobId)}/download`;
  const res = await fetchImpl(url);
  if (!res.ok || !res.body) {
    throw new Error(
      trKey(
        lookup,
        "nativeFiles.downloadFailed",
        { status: String(res.status) },
        `Không tải được video đã render (bridge trả ${res.status}).`,
      ),
    );
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const tmp = `${destPath}.tmp-${process.pid}`;
  try {
    const out = fs.createWriteStream(tmp);
    await pipeline(Readable.fromWeb(res.body as never), out);
    fs.renameSync(tmp, destPath);
  } catch (err) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // File tạm có thể chưa được tạo — bỏ qua.
    }
    throw err;
  }
  // Đếm bytes bằng stat sau khi ghi (WriteStream không phát event "data").
  const bytes = fs.statSync(destPath).size;
  return { bytes, ok: true, path: destPath };
}

/**
 * Đăng ký kênh `desktop:save-export-file` (jobId, destPath) → lưu MP4.
 * Gọi một lần từ main(); đăng ký trùng sẽ throw nên guard bằng cờ module
 * (theo mẫu file-io.ts của G5).
 */
export function registerExportFileIpc(
  ipc: typeof ElectronIpcMain,
  bridgeUrl: string,
  lastDirs?: LastDirStore,
  getLang?: () => DesktopLang,
): void {
  if ((registerExportFileIpc as unknown as { __registered?: boolean }).__registered) return;
  (registerExportFileIpc as unknown as { __registered?: boolean }).__registered = true;
  // Đợt 61 R6 — lỗi lưu MP4 dịch theo ngôn ngữ hiện tại (main truyền getter).
  const lookup: NativeFilesLookup = (key, vars) =>
    tDesktopVars(getLang?.() ?? "vi", key, vars ?? {});
  ipc.handle(EXPORT_CHANNEL, async (_event, jobId: unknown, destPath: unknown) => {
    if (typeof jobId !== "string" || typeof destPath !== "string") {
      throw new Error(
        trKey(lookup, "nativeFiles.invalidParams", {}, "desktop:save-export-file: tham số không hợp lệ."),
      );
    }
    const saved = await saveExportFile(jobId, destPath, bridgeUrl, fetch, lookup);
    lastDirs?.noteFileSelection(destPath);
    return saved;
  });
}
