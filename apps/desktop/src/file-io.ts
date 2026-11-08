/**
 * file-io.ts — đọc/ghi file thật ở main + recent projects (Phase 10, G5).
 *
 * CHỦ SỞ HỮU của: đọc/ghi file project & media qua IPC, recent projects,
 * đường dẫn project hiện tại (để Ctrl+S lưu thẳng), và kênh
 * `desktop:get-paths` (main.ts KHÔNG đăng ký kênh này — đăng ký trùng
 * ipcMain.handle sẽ throw; xem ghi chú của G4 trong main.ts).
 *
 * HỢP ĐỒNG VỚI PRELOAD (apps/desktop/src/preload.ts — G4 đã viết theo
 * đúng các kênh này; đừng đổi tên kênh khi chưa đổi cả hai bên):
 * - `desktop:read-file` (path) → { data: Buffer, name, size } — đọc thô,
 *   dùng chung cho project (.vcut/.json/.zip) và media; preload tự tách
 *   zip/text và suy MIME theo đuôi. Lỗi thì NÉM Error (preload bắt và
 *   trả { ok: false, error }) — không trả object lỗi.
 * - `desktop:write-project-file` (path, content) → { ok: true, path } —
 *   lỗi thì ném. Ghi xong tự thêm vào recent + đặt current path.
 * - `desktop:note-project-opened` (path) → { ok: boolean } — renderer
 *   báo project vừa mở thành công; main cập nhật recent + current path.
 * - `desktop:get-paths` → { logPath, settingsPath, userData }.
 * - `desktop:get-current-project-path` / `desktop:set-current-project-path`
 *   — current path (RAM, fallback về settings.lastProjectPath để reload
 *   trang vẫn Ctrl+S thẳng được).
 *
 * Phân công với G4 (native-files.ts): G4 giữ helper thuần nhận diện
 * đường dẫn (projectKindForPath, isMediaFilePath, MAX_READ_FILE_BYTES),
 * LastDirStore (thư mục dialog gần nhất) và xuất MP4 dạng stream
 * (`desktop:save-export-file`). File này DÙNG các helper đó, không làm
 * lại. G4 đã xoá NativeFileService + kho `vcut-native-files.json` riêng
 * để recent chỉ còn một nguồn sự thật là settings.json (xem header
 * native-files.ts).
 *
 * An toàn: chỉ chấp nhận đuôi project/media đã biết; đọc qua IPC giới
 * hạn 2 GiB/file (tránh tràn RAM khi structured-clone); ghi project
 * nguyên tử (tmp + rename). Renderer KHÔNG bao giờ thấy fs thô.
 */
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type { IpcMain } from "electron";
import {
  MAX_READ_FILE_BYTES,
  isMediaFilePath,
  isProjectFilePath,
  projectKindForPath,
} from "./native-files";
import { desktopPaths, type DesktopPaths } from "./desktop-paths";
import { tDesktopVars, type DesktopLang } from "./i18n-desktop";
import type { SettingsStore } from "./settings";

/** Kênh IPC của file-io — KHỚP preload.ts (đừng đổi một bên). */
export const FILE_CHANNELS = {
  getCurrentProjectPath: "desktop:get-current-project-path",
  getPaths: "desktop:get-paths",
  noteProjectOpened: "desktop:note-project-opened",
  readFile: "desktop:read-file",
  setCurrentProjectPath: "desktop:set-current-project-path",
  writeProjectFile: "desktop:write-project-file",
} as const;

export interface RawFileRead {
  data: Buffer;
  name: string;
  size: number;
}

/** Đường dẫn project hiện tại — chỉ giữ trong RAM (không bền vững). */
export class FileSession {
  private currentProjectPath: string | null = null;

  getCurrentProjectPath(): string | null {
    return this.currentProjectPath;
  }

  setCurrentProjectPath(filePath: string | null): void {
    this.currentProjectPath = filePath;
  }
}

function sizeText(bytes: number): string {
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

/**
 * Đợt 61 R6 — lookup i18n cho lỗi đọc/ghi (mẫu Q4 web). `t` vắng →
 * fallback đúng từng chữ chuỗi VI cũ; có `t` (registerFileIpc nối
 * ngôn ngữ hiện tại từ settings) thì lỗi trả về renderer đã dịch.
 * Key trong i18n-desktop (`fileIo.*`).
 */
export type FileIoLookup = (key: string, vars?: Record<string, string>) => string;
function trKey(
  lookup: FileIoLookup | undefined,
  key: string,
  vars: Record<string, string>,
  fallback: string,
): string {
  if (!lookup) return fallback;
  const out = lookup(key, vars);
  return out === key ? fallback : out;
}

/**
 * Đọc thô một file project hoặc media. Ném Error khi: không phải đuôi
 * cho phép, file quá 2 GiB, hoặc lỗi IO — preload bắt và trả về renderer
 * dạng { ok: false, error }.
 */
export async function readFileBytes(filePath: string, lookup?: FileIoLookup): Promise<RawFileRead> {
  const kind = projectKindForPath(filePath);
  const allowed = kind !== null || isMediaFilePath(filePath);
  if (!allowed) {
    throw new Error(
      trKey(
        lookup,
        "fileIo.cannotOpen",
        { name: path.basename(filePath) },
        `Không mở được file này trong VCut: ${path.basename(filePath)}`,
      ),
    );
  }
  const stat = await fsp.stat(filePath).catch((err: unknown) => {
    throw new Error(
      trKey(
        lookup,
        "fileIo.cannotRead",
        { detail: err instanceof Error ? err.message : String(err) },
        `Không đọc được file: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
  });
  if (stat.size > MAX_READ_FILE_BYTES) {
    throw new Error(
      trKey(
        lookup,
        "fileIo.tooLarge",
        { size: sizeText(stat.size), name: path.basename(filePath) },
        `File quá lớn để mở qua Electron (${sizeText(stat.size)} > 2 GB): ${path.basename(filePath)}`,
      ),
    );
  }
  const data = await fsp.readFile(filePath).catch((err: unknown) => {
    throw new Error(
      trKey(
        lookup,
        "fileIo.cannotRead",
        { detail: err instanceof Error ? err.message : String(err) },
        `Không đọc được file: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
  });
  return { data, name: path.basename(filePath), size: stat.size };
}

/**
 * Ghi JSON project ra file, nguyên tử (tmp + rename). Chỉ đuôi project.
 * Trả về đường dẫn đã ghi; ném Error khi lỗi.
 */
export async function writeProjectFile(
  filePath: string,
  content: string,
  lookup?: FileIoLookup,
): Promise<string> {
  if (!isProjectFilePath(filePath)) {
    throw new Error(
      trKey(
        lookup,
        "fileIo.onlyProject",
        { name: path.basename(filePath) },
        `Chỉ ghi được file dự án (.vcut/.vcut.json): ${path.basename(filePath)}`,
      ),
    );
  }
  try {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp-${process.pid}`;
    await fsp.writeFile(tmp, content, "utf-8");
    await fsp.rename(tmp, filePath);
    return filePath;
  } catch (err) {
    throw new Error(
      trKey(
        lookup,
        "fileIo.cannotWrite",
        { detail: err instanceof Error ? err.message : String(err) },
        `Không ghi được file: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
  }
}

export interface FileIpcOptions {
  /** Thêm vào Recent Documents của hệ điều hành (app.addRecentDocument) — best-effort. */
  addRecentDocument?: (filePath: string) => void;
  /** Gọi khi recent đổi để main rebuild menu (setAppMenu). */
  onRecentChanged?: () => void;
  session: FileSession;
  settings: SettingsStore;
  userDataDir: string;
}

/**
 * Đăng ký toàn bộ kênh file-io ở main process. Gọi MỘT lần từ
 * wireDesktopUx (desktop-ux.ts); gọi lại lần nữa là no-op nhờ cờ module
 * (macOS activate tạo lại cửa sổ vẫn an toàn — xem LIMITS G5 §4).
 */
export function registerFileIpc(ipcMain: IpcMain, opts: FileIpcOptions): void {
  if ((registerFileIpc as unknown as { __registered?: boolean }).__registered) return;
  (registerFileIpc as unknown as { __registered?: boolean }).__registered = true;
  const { addRecentDocument, onRecentChanged, session, settings, userDataDir } = opts;
  const paths: DesktopPaths = desktopPaths(userDataDir);

  const noteOpened = (filePath: string): boolean => {
    if (projectKindForPath(filePath) === null) return false;
    settings.addRecent(filePath);
    settings.setLastProject(filePath);
    session.setCurrentProjectPath(filePath);
    try {
      addRecentDocument?.(filePath);
    } catch {
      // OS recent lỗi thì thôi — danh sách nội bộ vẫn đúng.
    }
    onRecentChanged?.();
    return true;
  };

  ipcMain.handle(FILE_CHANNELS.getPaths, () => paths);

  // Đợt 61 R6 — lỗi file-io dịch theo ngôn ngữ hiện tại trong settings.
  const lookup: FileIoLookup = (key, vars) =>
    tDesktopVars(settings.get().lang as DesktopLang, key, vars ?? {});

  ipcMain.handle(FILE_CHANNELS.readFile, (_e, filePath: string) => readFileBytes(filePath, lookup));

  ipcMain.handle(FILE_CHANNELS.writeProjectFile, async (_e, filePath: string, content: string) => {
    const written = await writeProjectFile(filePath, content, lookup);
    noteOpened(written);
    return { ok: true as const, path: written };
  });

  ipcMain.handle(FILE_CHANNELS.noteProjectOpened, (_e, filePath: string) => ({
    ok: noteOpened(filePath),
  }));

  ipcMain.handle(FILE_CHANNELS.getCurrentProjectPath, () => {
    return session.getCurrentProjectPath() ?? settings.get().lastProjectPath;
  });

  ipcMain.handle(FILE_CHANNELS.setCurrentProjectPath, (_e, filePath: string | null) => {
    session.setCurrentProjectPath(filePath);
    settings.setLastProject(filePath);
  });
}
