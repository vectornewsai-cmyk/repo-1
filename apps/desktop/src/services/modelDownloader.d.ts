/**
 * modelDownloader.d.ts — Kiểu cho modelDownloader.js (JS thuần, không compile
 * bằng tsc vì allowJs tắt; file .d.ts này để code TS import được có kiểu).
 */

export interface ModelManifestFile {
  path: string;
  url: string;
  sha256: string | null;
  size: number | null;
}

export interface ModelManifestEntry {
  id: string;
  service: string;
  label: string;
  repo: string;
  license: string;
  licenseUrl: string;
  repoDir: string | null;
  /** Thư mục mặc định ở dev khi model không nằm trong repo (vd: ~/.u2net). */
  devDir?: string;
  subdir: string;
  completeMarker: string | null;
  required: string[];
  sizeLabel: string;
  verified: boolean;
  note?: string;
  totalBytes: number;
  files: ModelManifestFile[];
}

export interface ModelManifest {
  version: number;
  generatedAt: string;
  generatedBy: string;
  note: string;
  models: ModelManifestEntry[];
}

/** Layout thư mục model: 'unified' = 1 thư mục chung, 'repo' = theo repo. */
export interface ModelsRootInfo {
  root: string;
  layout: 'unified' | 'repo';
}

export interface ModelFileStatus {
  path: string;
  state: 'ok' | 'missing' | 'size-mismatch' | 'checksum-mismatch' | 'unverified';
  size: number;
  expectedSize: number | null;
}

export interface ModelStatus {
  id: string;
  label: string;
  service: string;
  license: string;
  sizeLabel: string;
  verified: boolean;
  status: 'ready' | 'partial' | 'missing' | 'unverified';
  targetDir: string;
  totalBytes: number;
  presentBytes: number;
  files: ModelFileStatus[];
}

export interface ModelDownloadProgress {
  modelId: string;
  file: string;
  fileDownloaded: number;
  fileTotal: number;
  totalDownloaded: number;
  totalBytes: number;
}

export interface ModelDownloadResult {
  id: string;
  downloadedBytes: number;
  skippedBytes: number;
  files: number;
}

export declare const MODELS_DIR_ENV: string;

export declare function loadManifest(): ModelManifest;
export declare function getModelsDir(userDataDir: string): string;
export declare function repoHasModels(appRoot: string): boolean;
export declare function resolveModelsRoot(opts: {
  appRoot: string;
  userDataDir: string;
  env?: NodeJS.ProcessEnv;
}): ModelsRootInfo;
export declare function modelTargetDir(
  model: ModelManifestEntry,
  rootInfo: ModelsRootInfo,
): string;
export declare function resolveModel(modelOrId: string | ModelManifestEntry): ModelManifestEntry;
export declare function sha256File(file: string): Promise<string>;
export declare function checkModelFile(
  fileEntry: ModelManifestFile,
  dir: string,
  opts?: { verify?: boolean },
): Promise<ModelFileStatus>;
export declare function checkModel(
  rootInfo: ModelsRootInfo,
  modelOrId: string | ModelManifestEntry,
  opts?: { verify?: boolean },
): Promise<ModelStatus>;
export declare function checkAllModels(
  rootInfo: ModelsRootInfo,
  opts?: { verify?: boolean },
): Promise<Record<string, ModelStatus>>;
export interface DiskSpaceCheck {
  neededBytes: number;
  freeBytes: number | null;
}

export declare function freeDiskBytes(dir: string): number | null;
export declare function formatBytes(n: number): string;
export declare function estimateRemainingBytes(
  model: ModelManifestEntry,
  targetDir: string,
): Promise<number>;
export declare function ensureFreeDiskSpace(
  model: ModelManifestEntry,
  targetDir: string,
): Promise<DiskSpaceCheck>;
export declare function downloadFile(
  fileEntry: ModelManifestFile,
  dir: string,
  opts?: {
    onProgress?: (p: { downloaded: number; total: number }) => void;
    signal?: AbortSignal;
  },
): Promise<{ skipped: boolean; bytes: number }>;
export declare function downloadModel(
  rootInfo: ModelsRootInfo,
  modelOrId: string | ModelManifestEntry,
  opts?: {
    onProgress?: (p: ModelDownloadProgress) => void;
    signal?: AbortSignal;
  },
): Promise<ModelDownloadResult>;
