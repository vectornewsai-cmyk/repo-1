/// <reference types="vite/client" />

/**
 * Kiểu tối thiểu của `window.vcutDesktop` (preload apps/desktop/src/preload.ts).
 * Khai inline ở đây (không import cross-package) để web build độc lập.
 * Đầy đủ xem DesktopApi trong preload.ts.
 */
interface VcutDesktopProjectResult {
  data: ArrayBuffer;
  kind: "zip";
  name: string;
  ok: true;
  path: string;
}
type VcutDesktopProjectResultJson = {
  kind: "json";
  name: string;
  ok: true;
  path: string;
  text: string;
};
type VcutDesktopProjectResultError = { error: string; ok: false };
type VcutDesktopProjectResult =
  | VcutDesktopProjectResult
  | VcutDesktopProjectResultJson
  | VcutDesktopProjectResultError;

type VcutDesktopMediaResult =
  | { data: ArrayBuffer; mime: string; name: string; ok: true; path: string; size: number }
  | { error: string; ok: false };

type VcutDesktopWriteResult = { ok: true; path: string } | { error: string; ok: false };

interface VcutDesktopApi {
  getBridgeUrl?: () => Promise<string>;
  getCurrentProjectPath: () => Promise<string | null>;
  getInfo: () => Promise<unknown>;
  getPaths: () => Promise<unknown>;
  getServices: () => Promise<unknown[]>;
  noteProjectOpened: (filePath: string) => Promise<{ ok: boolean }>;
  onServicesStatus?: (
    cb: (snap: { bridge: { state: string; url: string | null } }) => void,
  ) => () => void;
  setCurrentProjectPath: (filePath: string | null) => Promise<void>;
  /** Đợt 63 R9 — renderer đẩy ngôn ngữ xuống preload (đồng bộ, không IPC). */
  setLanguage?: (lang: "vi" | "en") => void;
  onMenuAction: (cb: (action: string) => void) => () => void;
  onOpenFile: (cb: (filePath: string) => void) => () => void;
  openMediaDialog: () => Promise<string[] | null>;
  openProjectDialog: () => Promise<string | null>;
  readMediaFile: (filePath: string) => Promise<VcutDesktopMediaResult>;
  readProjectFile: (filePath: string) => Promise<VcutDesktopProjectResult>;
  saveExportFile: (
    jobId: string,
    destPath: string,
  ) => Promise<{ bytes: number; ok: true; path: string } | { error: string; ok: false }>;
  saveProjectDialog: (defaultName?: string) => Promise<string | null>;
  saveVideoDialog: (defaultName?: string) => Promise<string | null>;
  writeProjectFile: (filePath: string, content: string) => Promise<VcutDesktopWriteResult>;
}

interface Window {
  vcutDesktop?: VcutDesktopApi;
}
