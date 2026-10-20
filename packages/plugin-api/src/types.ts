/**
 * types.ts — Plugin API và capability registry cho VCut Studio (R1-105).
 *
 * Plugin là 1 file JS duy nhất export `{ manifest, hooks }`. File chạy trong
 * sandbox Node `vm` với API giới hạn (xem sandbox.ts) — plugin KHÔNG được
 * truy cập fs/process/network/require.
 *
 * Hooks (khai báo trong manifest.hooks):
 * - "onClipRender"     — chèn thêm FFmpeg filter vào 1 clip (effect mới).
 * - "onExportStart"    — quan sát/chú thích trước khi export.
 * - "onExportFinish"   — quan sát sau khi export xong (có thể thêm warnings).
 * - "onTimelineAction" — quan sát action trên timeline (undo/redo/split...).
 * - "onProjectValidate"— thêm lỗi/cảnh báo khi validate project.
 *
 * Mọi dữ liệu trao đổi qua biên sandbox đều là JSON thuần (deep-clone),
 * tránh leak object host vào plugin.
 */

/** Tên hook plugin được phép khai báo. */
export type PluginHookName =
  | "onClipRender"
  | "onExportStart"
  | "onExportFinish"
  | "onTimelineAction"
  | "onProjectValidate";

/** Quyền plugin yêu cầu. onClipRender bắt buộc "filter:inject". */
export type PluginPermission =
  | "filter:inject"
  | "timeline:observe"
  | "export:observe"
  | "export:annotate";

/** Một năng lực plugin cung cấp — registry tập hợp để UI liệt kê. */
export interface PluginCapability {
  /** Loại năng lực. */
  kind: "effect" | "transition" | "export-format" | "validator" | "tool";
  /** ID duy nhất trong kind, kebab-case. */
  id: string;
  /** Tên hiển thị. */
  label: string;
}

/** Manifest plugin — nằm trong file plugin.js export. */
export interface PluginManifest {
  /** ID duy nhất, kebab-case, ví dụ "watermark". */
  name: string;
  /** Semver "x.y.z". */
  version: string;
  /** Tác giả. */
  author: string;
  /** Mô tả ngắn (tùy chọn). */
  description?: string;
  /** Phiên bản Plugin API mà plugin viết cho. Hiện tại: 1. */
  apiVersion: 1;
  /** Hooks plugin implement. */
  hooks: PluginHookName[];
  /** Năng lực plugin cung cấp (UI liệt kê). */
  capabilities?: PluginCapability[];
  /** Quyền yêu cầu. */
  permissions?: PluginPermission[];
  /** Config mặc định của plugin (JSON thuần), user có thể override khi load. */
  defaultConfig?: Record<string, unknown>;
}

/** Context cho hook onClipRender. */
export interface ClipRenderContext {
  /** Clip đang render (JSON video-spec thuần). */
  clip: Record<string, unknown>;
  /** Loại clip: "video" | "image" | "sticker" | "text" | "audio". */
  clipKind: string;
  /** Meta project: width/height/fps. */
  project: { width: number; height: number; fps: number };
  /** Config của plugin (defaultConfig + override). */
  config: Record<string, unknown>;
}

/** Kết quả hook onClipRender trả về. */
export interface ClipRenderResult {
  /**
   * Các FFmpeg filter bổ sung, nối vào filter chain của clip.
   * Ví dụ: ["drawtext=text='Demo':fontsize=24:x=16:y=16"].
   * Mỗi filter được validate an toàn (không `;`, không stream-label, không
   * filter đọc file tùy ý như movie=/subtitles=/textfile=).
   */
  filters?: string[];
}

/** Context cho hook onExportStart. */
export interface ExportStartContext {
  /** Tên project. */
  projectName: string;
  /** Preset export (id + width/height). */
  preset: { id: string; width: number; height: number };
  /** Đường dẫn output (đọc, không sửa). */
  outputPath: string;
  config: Record<string, unknown>;
}

/** Context cho hook onExportFinish. */
export interface ExportFinishContext extends ExportStartContext {
  /** Export thành công hay thất bại. */
  success: boolean;
  /** Thời gian render (ms). */
  durationMs: number;
}

/** Kết quả hook onExportFinish có thể trả về. */
export interface ExportFinishResult {
  /** Cảnh báo hiển thị cho user sau export. */
  warnings?: string[];
}

/** Context cho hook onTimelineAction. */
export interface TimelineActionContext {
  /** Tên action, ví dụ "split", "undo", "trim", "addClip". */
  action: string;
  /** Tóm tắt payload (JSON thuần, không chứa File/blob). */
  payload: Record<string, unknown>;
}

/** Context cho hook onProjectValidate. */
export interface ProjectValidateContext {
  /** Spec project (JSON thuần). */
  spec: Record<string, unknown>;
}

/** Kết quả hook onProjectValidate trả về. */
export interface ProjectValidateResult {
  /** Lỗi chặn export. */
  errors?: string[];
  /** Cảnh báo không chặn. */
  warnings?: string[];
}

/** API tối thiểu host cung cấp cho plugin bên trong sandbox. */
export interface PluginHostApi {
  /** Log ra host (stderr, có prefix tên plugin). */
  log(message: string): void;
  /** Phiên bản Plugin API của host (hiện tại 1). */
  readonly apiVersion: 1;
}

/** Cấu trúc plugin.js phải export. */
export interface PluginModule {
  manifest: PluginManifest;
  hooks: Partial<Record<PluginHookName, (...args: never[]) => unknown>>;
}

/** Capability kèm tên plugin sở hữu — registry trả về. */
export interface RegisteredCapability extends PluginCapability {
  plugin: string;
}

/** Lỗi plugin (manifest sai, sandbox chặn, hook timeout...). */
export class PluginError extends Error {
  constructor(message: string) {
    super(`[plugin-api] ${message}`);
    this.name = "PluginError";
  }
}
