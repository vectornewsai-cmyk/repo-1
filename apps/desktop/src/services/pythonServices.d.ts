/**
 * pythonServices.d.ts — Kiểu cho pythonServices.js (JS thuần, không compile
 * bằng tsc vì allowJs tắt; file .d.ts này để code TS import được có kiểu).
 */

export interface PythonServiceDef {
  id: string;
  label: string;
  /** Đường dẫn script tương đối từ repo root. */
  scriptRel: string;
  /** Tên biến env bridge đọc để chọn python. */
  pythonEnv: string;
  /** Venv ưu tiên (tương đối từ repo root), theo thứ tự. */
  venvRel: string[];
  /** Module nặng cần import thử khi deep probe (null = chỉ stdlib/ffmpeg). */
  deepModule: string | null;
}

export interface PythonServiceStatus {
  id: string;
  label: string;
  available: boolean;
  python: string;
  pythonSource: 'env' | 'venv' | 'system';
  script: string;
  reason?: string;
  deps?: { module: string; ok: boolean | null; ms: number };
  /** Trạng thái model AI (ROUND52-I5): service chỉ available khi model đủ. */
  model?: {
    ok: boolean;
    missing: Array<{ modelId: string; label: string; sizeLabel: string; dir: string }>;
  };
  /** Flag nông của bridge /api/health cho cùng service (để đối chiếu). */
  bridgeReports?: unknown;
}

export interface ModelCheck {
  modelId: string;
  subdir: string;
  repoDir: string | null;
  devDir?: string;
  required: string[];
  label: string;
  sizeLabel: string;
}

export declare const MODELS_DIR_ENV: string;
export declare const MODEL_CHECKS: Record<string, ModelCheck[]>;

export declare function resolveModelDir(
  check: ModelCheck,
  appRoot: string,
  env?: NodeJS.ProcessEnv,
): string | null;

export declare function checkServiceModels(
  def: PythonServiceDef,
  appRoot: string,
  env?: NodeJS.ProcessEnv,
): {
  ok: boolean;
  missing: Array<{
    modelId: string;
    label: string;
    sizeLabel: string;
    dir: string;
    files: string[];
  }>;
};

export declare const PYTHON_SERVICES: PythonServiceDef[];

export declare function resolvePythonBin(
  def: PythonServiceDef,
  appRoot: string,
  env?: NodeJS.ProcessEnv,
): { python: string; source: 'env' | 'venv' | 'system' };

export declare function probePythonService(
  def: PythonServiceDef,
  appRoot: string,
  env?: NodeJS.ProcessEnv,
  opts?: { deep?: boolean },
): Promise<PythonServiceStatus>;

export declare function probeAllPythonServices(
  appRoot: string,
  env?: NodeJS.ProcessEnv,
  opts?: { deep?: boolean },
): Promise<Record<string, PythonServiceStatus>>;

export declare function buildBridgeEnv(
  appRoot: string,
  env?: NodeJS.ProcessEnv,
): {
  env: Record<string, string>;
  wired: Array<{ service: string; variable: string; value: string }>;
};
