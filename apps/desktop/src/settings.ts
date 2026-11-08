/**
 * settings.ts — cài đặt desktop lưu ở userData (Phase 10, luồng G5).
 *
 * Lưu trong `userData/settings.json` (Linux: ~/.config/VCut Studio/),
 * KHÔNG đụng IndexedDB/localStorage của web app (ngôn ngữ của web vẫn
 * là localStorage `vcut-lang` — hai bên đồng bộ qua IPC
 * `vcut:language-changed` / `desktop:language-changed`, xem desktop-ux.ts
 * và apps/web/src/desktop.ts).
 *
 * Phạm vi file này:
 * - Ngôn ngữ giao diện (menu + About).
 * - Project mở gần đây (tối đa 10) + project hiện tại — CHỦ SỞ HỮU
 *   DUY NHẤT của recent (G4 đã xoá kho recent riêng của native-files.ts
 *   để tránh hai nguồn sự thật; xem header native-files.ts).
 * - KHÔNG giữ thư mục dialog gần nhất: đó là LastDirStore của G4
 *   (`vcut-last-dirs.json`). Trạng thái cửa sổ là windowState.ts (G1).
 *
 * Ghi nguyên tử (tmp + rename) để app crash giữa chừng không để lại file
 * JSON dở. File hỏng → trả default, không crash app.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import type { DesktopLang } from "./i18n-desktop";

export interface DesktopSettings {
  lang: DesktopLang;
  lastProjectPath: string | null;
  recentProjects: string[];
}

export const DEFAULT_SETTINGS: DesktopSettings = {
  lang: "vi",
  lastProjectPath: null,
  recentProjects: [],
};

/** Số project tối đa trong menu "Dự án gần đây". */
export const MAX_RECENT_PROJECTS = 10;

/** Đường dẫn đầy đủ tới file settings.json trong userData. */
export function settingsFilePath(userDataDir: string): string {
  return path.join(userDataDir, "settings.json");
}

function isDesktopLang(v: unknown): v is DesktopLang {
  return v === "vi" || v === "en";
}

/** Thêm đường dẫn vào đầu danh sách recent: khử trùng, cắt ở max. */
export function normalizeRecentList(
  list: readonly string[],
  filePath: string,
  max: number = MAX_RECENT_PROJECTS,
): string[] {
  const next = [filePath, ...list.filter((p) => p !== filePath)];
  return next.slice(0, Math.max(1, max));
}

/** Validate + chuẩn hóa settings đọc từ đĩa; dữ liệu lạ thì rơi về default. */
export function parseSettings(raw: unknown): DesktopSettings {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_SETTINGS, recentProjects: [] };
  const obj = raw as Record<string, unknown>;
  const recentProjects = Array.isArray(obj.recentProjects)
    ? obj.recentProjects.filter((p): p is string => typeof p === "string" && p.length > 0).slice(0, MAX_RECENT_PROJECTS)
    : [];
  return {
    lang: isDesktopLang(obj.lang) ? obj.lang : "vi",
    lastProjectPath: typeof obj.lastProjectPath === "string" ? obj.lastProjectPath : null,
    recentProjects,
  };
}

export class SettingsStore {
  private readonly filePath: string;
  private settings: DesktopSettings;

  constructor(userDataDir: string) {
    this.filePath = settingsFilePath(userDataDir);
    this.settings = { ...DEFAULT_SETTINGS, recentProjects: [] };
  }

  get path(): string {
    return this.filePath;
  }

  /** Đọc từ đĩa (gọi một lần lúc khởi động). File thiếu/hỏng → default. */
  load(): DesktopSettings {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      this.settings = parseSettings(JSON.parse(raw) as unknown);
    } catch {
      this.settings = { ...DEFAULT_SETTINGS, recentProjects: [] };
    }
    return this.get();
  }

  get(): DesktopSettings {
    return { ...this.settings, recentProjects: [...this.settings.recentProjects] };
  }

  /** Ghi nguyên tử; lỗi ghi thì ném (caller quyết định có chặn hay không). */
  save(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(this.settings, null, 2), "utf-8");
    fs.renameSync(tmp, this.filePath);
  }

  /** Ghi nhưng không ném — dùng ở đường thoát app (không được chặn quit). */
  saveBestEffort(): void {
    try {
      this.save();
    } catch {
      // Bỏ qua lặng: cài đặt không được chặn thoát app.
    }
  }

  setLang(lang: DesktopLang): void {
    this.settings.lang = lang;
    this.saveBestEffort();
  }

  setLastProject(filePath: string | null): void {
    this.settings.lastProjectPath = filePath;
    this.saveBestEffort();
  }

  addRecent(filePath: string): void {
    this.settings.recentProjects = normalizeRecentList(this.settings.recentProjects, filePath);
    this.saveBestEffort();
  }

  removeRecent(filePath: string): void {
    const next = this.settings.recentProjects.filter((p) => p !== filePath);
    if (next.length !== this.settings.recentProjects.length) {
      this.settings.recentProjects = next;
      this.saveBestEffort();
    }
  }

  /** Thay toàn bộ danh sách recent (dùng khi lọc file không còn tồn tại). */
  setRecentProjects(next: string[]): void {
    this.settings.recentProjects = next
      .filter((p): p is string => typeof p === "string" && p.length > 0)
      .slice(0, MAX_RECENT_PROJECTS);
    this.saveBestEffort();
  }

  clearRecents(): void {
    if (this.settings.recentProjects.length === 0) return;
    this.settings.recentProjects = [];
    this.saveBestEffort();
  }
}

/**
 * Singleton theo userDataDir (menu.ts + desktop-ux.ts + main.ts dùng chung
 * một instance để không đọc/ghi lệch nhau — xem ghi chú của G4 trong
 * main.ts về hai bản sao settings trong RAM).
 */
const singletons = new Map<string, SettingsStore>();

export function getDesktopSettings(userDataDir: string): SettingsStore {
  let store = singletons.get(userDataDir);
  if (!store) {
    store = new SettingsStore(userDataDir);
    store.load();
    singletons.set(userDataDir, store);
  }
  return store;
}
