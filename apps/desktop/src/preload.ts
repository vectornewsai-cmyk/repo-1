/**
 * preload.ts — cầu nối duy nhất giữa renderer (web UI) và main process.
 *
 * An toàn: contextIsolation=true, nodeIntegration=false, sandbox=true.
 * Renderer CHỈ thấy `window.vcutDesktop` dưới đây — không có fs, không có
 * require, không có ipcRenderer thô. Mọi thao tác hệ thống (dialog, file)
 * đều đi qua ipcMain.handle ở main process.
 */
import { contextBridge, ipcRenderer } from "electron";
// ROUND54-K4 (D1 argv): `vcut:open-file` gửi từ main ngay sau loadURL có
// thể tới TRƯỚC khi web app đăng ký listener (initDesktopMenuBridge chạy
// ở useEffect sau mount). ipcRenderer không giữ event chưa có listener
// nên event mất → D1 đo được onOpenFile=false. Hàng đợi này đăng ký
// ipcRenderer.on NGAY khi preload chạy (trước mọi script của trang) và
// giữ path lại cho subscriber đầu tiên.
// LƯU Ý QUAN TRỌNG — class hàng đợi được INLINE TẠI ĐÂY, KHÔNG import
// từ ./openFileQueue: preload chạy với sandbox:true nên `require` file
// tương đối LÀM HỎNG TOÀN BỘ preload (window.vcutDesktop = undefined,
// mọi menu action + open-file đều chết — phát hiện ở lượt verify dev
// đợt 54: 17/43 pass, mọi action đều false). openFileQueue.ts giữ bản
// tham chiếu + test (openFileQueue.test.ts) cho cùng thuật toán — sửa
// logic thì sửa CẢ HAI CHỖ cho khớp.
// Phase 10 G4 — preload KHÔNG import gì từ native-files.ts (file đó
// dùng node:fs, preload chạy sandbox). Đọc/ghi project + media đi qua
// kênh file-io.ts của G5 (`desktop:read-file` / `desktop:write-project-file`
// / `desktop:note-project-opened`); chỉ kênh lưu MP4 (`desktop:save-export-file`)
// là của G4 (native-files.ts). MIME suy từ đuôi file bằng bảng nhỏ dưới đây.

/**
 * Kết quả đọc file ở renderer: giống NativeReadProjectResult nhưng bytes
 * zip là ArrayBuffer (Buffer qua IPC thành Uint8Array, preload chuẩn hoá).
 */
export type RendererProjectResult =
  | { data: ArrayBuffer; kind: "zip"; name: string; ok: true; path: string }
  | { kind: "json"; name: string; ok: true; path: string; text: string }
  | { error: string; ok: false };

export type RendererMediaResult =
  | { data: ArrayBuffer; mime: string; name: string; ok: true; path: string; size: number }
  | { error: string; ok: false };

/**
 * Đợt 63 R9 — ngôn ngữ cho chuỗi lỗi của preload (key i18n
 * `desktop.preloadIpcNotBytes`, fragment round63-r9.json).
 * Preload chạy sandbox, KHÔNG import được dict i18n của web (cùng lý
 * do openFileQueue phải inline ở đây) nên 2 chuỗi dưới đây giữ inline
 * và được KHÓA BẰNG TEST với fragment: đổi một chữ ở bên nào test
 * preload63R9 cũng đỏ. Ngôn ngữ do renderer đẩy xuống qua
 * `setLanguage` (desktop.ts gọi mỗi lần đổi ngôn ngữ + lúc khởi
 * động); mặc định "vi" (khớp mặc định của app) nên renderer chưa kịp
 * gọi vẫn ra tiếng Việt.
 */
const IPC_NOT_BYTES_TEXT: Record<DesktopLang, string> = {
  vi: "Dữ liệu file qua IPC không phải bytes.",
  en: "File data over IPC is not bytes.",
};
let preloadLang: DesktopLang = "vi";

/** Buffer/Uint8Array qua IPC có thể mang byteOffset — copy về ArrayBuffer sạch. */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return copy.buffer;
}

/** ArrayBuffer qua IPC có thể về dạng Uint8Array — chuẩn hoá về ArrayBuffer. */
function asArrayBuffer(data: unknown): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (data instanceof Uint8Array) return toArrayBuffer(data);
  throw new Error(IPC_NOT_BYTES_TEXT[preloadLang]);
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

function mimeForPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

function isZipPath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith(".vcut.zip") || lower.endsWith(".zip");
}

export interface ServiceStatus {
  detail?: string;
  name: string;
  ok: boolean;
}

/** ROUND52-I5 — trạng thái 1 model AI (mirror modelDownloader.d.ts). */
export interface ModelStatus {
  id: string;
  label: string;
  service: string;
  license: string;
  sizeLabel: string;
  verified: boolean;
  status: "ready" | "partial" | "missing" | "unverified";
  targetDir: string;
  totalBytes: number;
  presentBytes: number;
  files: Array<{
    path: string;
    state: "ok" | "missing" | "size-mismatch" | "checksum-mismatch" | "unverified";
    size: number;
    expectedSize: number | null;
  }>;
}

/** ROUND52-I5 — tiến độ tải model (event vcut:model-download-progress). */
export interface ModelDownloadProgress {
  modelId: string;
  file: string;
  fileDownloaded: number;
  fileTotal: number;
  totalDownloaded: number;
  totalBytes: number;
}

export interface AppInfo {
  appVersion: string;
  arch: string;
  chrome: string;
  electron: string;
  node: string;
  platform: string;
}

export type MenuActionId =
  | "copy"
  | "cut"
  | "delete"
  | "duplicate"
  | "export-video"
  | "new-project"
  | "paste"
  | "redo"
  | "save-project"
  | "save-project-as"
  | "select-all"
  | "undo";

/** Ngôn ngữ giao diện (đồng bộ với settings.json ở main — G5). */
export type DesktopLang = "vi" | "en";

export interface DesktopPaths {
  logPath: string;
  settingsPath: string;
  userData: string;
}

export interface DesktopApi {
  arch: string;
  /** URL thật của bridge do main chọn (có thể khác 8787) — web UI dùng qua lib/bridgeUrl.ts. */
  getBridgeUrl: () => Promise<string>;
  getInfo: () => Promise<AppInfo>;
  /** Đường dẫn userData / settings.json / logs/main.log (About, báo lỗi) — G5. */
  getPaths: () => Promise<DesktopPaths>;
  getServices: () => Promise<ServiceStatus[]>;
  /**
   * ROUND52-I5 — Model AI tải riêng lần đầu: trạng thái từng model
   * (ready/partial/missing), tải 1 model (progress qua onModelDownloadProgress),
   * huỷ lượt tải đang chạy. App thiếu model thì service AI báo không khả dụng
   * (xem entry "models" trong getServices) chứ không crash.
   */
  getModels: () => Promise<
    | { ok: true; root: { root: string; layout: "unified" | "repo" }; models: Record<string, ModelStatus> }
    | { ok: false; error: string }
  >;
  downloadModel: (modelId: string) => Promise<
    | { ok: true; id: string; downloadedBytes: number; skippedBytes: number; files: number }
    | { ok: false; error: string }
  >;
  cancelModelDownload: () => Promise<{ ok: boolean; modelId?: string; error?: string }>;
  onModelDownloadProgress: (cb: (p: ModelDownloadProgress) => void) => () => void;
  /** Mở dialog chọn file dự án .vcut → trả đường dẫn hoặc null (user huỷ). */
  openMediaDialog: () => Promise<string[] | null>;
  openProjectDialog: () => Promise<string | null>;
  /** Đăng ký nhận file .vcut khi app được mở bằng file (double-click). */
  onMenuAction: (cb: (action: MenuActionId) => void) => () => void;
  onOpenFile: (cb: (filePath: string) => void) => () => void;
  /** Ngôn ngữ đổi ở menu desktop (Xem > Ngôn ngữ) — G5. */
  onLanguageChanged: (cb: (lang: DesktopLang) => void) => () => void;
  /** Báo main biết web app vừa đổi ngôn ngữ (nút ngôn ngữ trên TopBar) — G5. */
  notifyLanguageChanged: (lang: DesktopLang) => Promise<void>;
  /**
   * Đợt 63 R9 — renderer đẩy ngôn ngữ xuống preload để chuỗi lỗi của
   * preload (vd asArrayBuffer) đổi theo locale. Đồng bộ, không qua IPC;
   * renderer gọi mỗi lần đổi ngôn ngữ + lúc khởi động (desktop.ts).
   */
  setLanguage: (lang: DesktopLang) => void;
  /** Trạng thái services đổi (bridge restart/đổi cổng) — web UI cập nhật URL bridge. */
  onServicesStatus: (
    cb: (snap: { bridge: { state: string; url: string | null } }) => void,
  ) => () => void;
  platform: string;
  saveProjectDialog: (defaultName?: string) => Promise<string | null>;
  saveVideoDialog: (defaultName?: string) => Promise<string | null>;
  versions: { chrome: string; electron: string; node: string };
  // --- Phase 10 G4: file native qua IPC (đọc/ghi: kênh G5; lưu MP4: kênh G4) ---
  /** Đọc file project ở main: .vcut/.vcut.json/.json → text, .vcut.zip → bytes. */
  readProjectFile: (filePath: string) => Promise<RendererProjectResult>;
  /** Ghi JSON project ra đường dẫn đã chọn (kênh G5, đồng thời cập nhật recent). */
  writeProjectFile: (
    filePath: string,
    content: string,
  ) => Promise<{ ok: true; path: string } | { error: string; ok: false }>;
  /** Đọc một file media để import (bytes qua IPC, tối đa 2 GiB/file — giới hạn G5). */
  readMediaFile: (filePath: string) => Promise<RendererMediaResult>;
  /**
   * Lưu MP4 đã render xong ra đường dẫn user đã chọn: main tự stream từ
   * bridge, không chở bytes qua IPC (kênh G4 `desktop:save-export-file`).
   */
  saveExportFile: (
    jobId: string,
    destPath: string,
  ) => Promise<{ bytes: number; ok: true; path: string } | { error: string; ok: false }>;
  /** Báo main biết project vừa mở thành công (G5 cập nhật recent + current path). */
  noteProjectOpened: (filePath: string) => Promise<{ ok: boolean }>;
  /** Đường dẫn project hiện tại ở main (để Ctrl+S / menu Lưu biết lưu thẳng hay hỏi). */
  getCurrentProjectPath: () => Promise<string | null>;
  /** Đặt/xoá đường dẫn project hiện tại ở main (vd: project mới → null). */
  setCurrentProjectPath: (filePath: string | null) => Promise<void>;
}

export type OpenFileListener = (filePath: string) => void;

/**
 * Hàng đợi + phân phối event mở file cho subscriber đầu tiên.
 * INLINE trong preload (xem chú thích import ở đầu file): bản sao y hệt
 * openFileQueue.ts — sửa logic thì sửa cả hai chỗ.
 */
class OpenFileQueue {
  private listeners = new Set<OpenFileListener>();
  private queued: string[] = [];

  /** Event từ main tới (gọi từ ipcRenderer.on — luôn chạy, kể cả khi chưa có subscriber). */
  push(filePath: string): void {
    if (this.listeners.size === 0) {
      this.queued.push(filePath);
      return;
    }
    for (const listener of this.listeners) listener(filePath);
  }

  /**
   * Đăng ký nhận file. Subscriber đầu tiên nhận toàn bộ hàng đợi (theo
   * đúng thứ tự tới) rồi hàng đợi được xóa; các subscriber sau chỉ nhận
   * event mới. Trả về hàm huỷ đăng ký.
   */
  subscribe(listener: OpenFileListener): () => void {
    const first = this.listeners.size === 0;
    this.listeners.add(listener);
    if (first && this.queued.length > 0) {
      const pending = this.queued;
      this.queued = [];
      for (const filePath of pending) listener(filePath);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Số event đang chờ subscriber (chỉ để test/chẩn đoán). */
  get pendingCount(): number {
    return this.queued.length;
  }
}

const openFileQueue = new OpenFileQueue();
// Đăng ký NGAY khi preload chạy (trước mọi script của trang): event
// `vcut:open-file` main gửi lúc khởi động (D1 argv) sẽ vào hàng đợi
// thay vì mất khi chưa có subscriber. Subscriber đầu tiên (web bridge)
// nhận hàng đợi; các subscriber sau chỉ nhận event mới — xem
// openFileQueue.ts (không mở cùng file hai lần).
ipcRenderer.on("vcut:open-file", (_e: unknown, filePath: string) => {
  openFileQueue.push(filePath);
});

const api: DesktopApi = {
  arch: process.arch,
  getBridgeUrl: () => ipcRenderer.invoke("desktop:get-bridge-url"),
  getInfo: () => ipcRenderer.invoke("desktop:get-info"),
  // G1 seam fix (06/11): DesktopApi khai getPaths nhưng object thiếu —
  // handler ở main.ts (desktop:get-paths).
  getPaths: () => ipcRenderer.invoke("desktop:get-paths"),
  getServices: () => ipcRenderer.invoke("desktop:get-services"),
  // ROUND52-I5 — Model AI tải riêng lần đầu.
  getModels: () => ipcRenderer.invoke("desktop:get-models"),
  downloadModel: (modelId) => ipcRenderer.invoke("desktop:download-model", modelId),
  cancelModelDownload: () => ipcRenderer.invoke("desktop:cancel-model-download"),
  onModelDownloadProgress: (cb) => {
    const listener = (_e: unknown, p: ModelDownloadProgress) => cb(p);
    ipcRenderer.on("vcut:model-download-progress", listener);
    return () => ipcRenderer.removeListener("vcut:model-download-progress", listener);
  },
  openMediaDialog: () => ipcRenderer.invoke("desktop:dialog-open-media"),
  openProjectDialog: () => ipcRenderer.invoke("desktop:dialog-open-project"),
  onMenuAction: (cb) => {
    const listener = (_e: unknown, action: MenuActionId) => cb(action);
    ipcRenderer.on("vcut:menu-action", listener);
    return () => ipcRenderer.removeListener("vcut:menu-action", listener);
  },
  onOpenFile: (cb) => {
    // ROUND54-K4: đi qua hàng đợi — event tới trước khi web đăng ký
    // (D1 argv lúc khởi động) vẫn được giao khi subscribe, thay vì mất.
    return openFileQueue.subscribe(cb);
  },
  onLanguageChanged: (cb) => {
    const listener = (_e: unknown, lang: DesktopLang) => cb(lang);
    ipcRenderer.on("vcut:language-changed", listener);
    return () => ipcRenderer.removeListener("vcut:language-changed", listener);
  },
  notifyLanguageChanged: (lang) => ipcRenderer.invoke("desktop:language-changed", lang),
  // Đợt 63 R9 — renderer đẩy ngôn ngữ xuống (đồng bộ, không IPC).
  setLanguage: (lang) => {
    preloadLang = lang;
  },
  onServicesStatus: (cb) => {
    const listener = (_e: unknown, snap: { bridge: { state: string; url: string | null } }) =>
      cb(snap);
    ipcRenderer.on("vcut:services-status", listener);
    return () => ipcRenderer.removeListener("vcut:services-status", listener);
  },
  platform: process.platform,
  saveProjectDialog: (defaultName) =>
    ipcRenderer.invoke("desktop:dialog-save-project", defaultName),
  saveVideoDialog: (defaultName) =>
    ipcRenderer.invoke("desktop:dialog-save-video", defaultName),
  // --- Phase 10 G4 (đọc/ghi qua kênh file-io của G5) ---
  readProjectFile: async (filePath) => {
    try {
      const res = (await ipcRenderer.invoke("desktop:read-file", filePath)) as {
        data: unknown;
        name: string;
        size: number;
      };
      const data = asArrayBuffer(res.data);
      const name = res.name || filePath.split(/[\\/]/).pop() || "project";
      if (isZipPath(filePath)) {
        return { data, kind: "zip", name, ok: true, path: filePath };
      }
      const text = new TextDecoder("utf-8").decode(data);
      return { kind: "json", name, ok: true, path: filePath, text };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err), ok: false };
    }
  },
  writeProjectFile: async (filePath, content) => {
    try {
      const res = (await ipcRenderer.invoke(
        "desktop:write-project-file",
        filePath,
        content,
      )) as { ok: true; path: string };
      return res;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err), ok: false };
    }
  },
  readMediaFile: async (filePath) => {
    try {
      const res = (await ipcRenderer.invoke("desktop:read-file", filePath)) as {
        data: unknown;
        name: string;
        size: number;
      };
      return {
        data: asArrayBuffer(res.data),
        mime: mimeForPath(filePath),
        name: res.name || filePath.split(/[\\/]/).pop() || "media",
        ok: true,
        path: filePath,
        size: res.size,
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err), ok: false };
    }
  },
  saveExportFile: async (jobId, destPath) => {
    try {
      const res = (await ipcRenderer.invoke(
        "desktop:save-export-file",
        jobId,
        destPath,
      )) as { bytes: number; ok: true; path: string };
      return res;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err), ok: false };
    }
  },
  noteProjectOpened: (filePath) =>
    ipcRenderer.invoke("desktop:note-project-opened", filePath) as Promise<{ ok: boolean }>,
  getCurrentProjectPath: () =>
    ipcRenderer.invoke("desktop:get-current-project-path") as Promise<string | null>,
  setCurrentProjectPath: (filePath) =>
    ipcRenderer.invoke("desktop:set-current-project-path", filePath) as Promise<void>,
  versions: {
    chrome: process.versions.chrome ?? "",
    electron: process.versions.electron ?? "",
    node: process.versions.node ?? "",
  },
};

contextBridge.exposeInMainWorld("vcutDesktop", api);

declare global {
  interface Window {
    vcutDesktop: DesktopApi;
  }
}
