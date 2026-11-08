/**
 * serviceManager.d.ts — Kiểu cho serviceManager.js (JS thuần, không compile
 * bằng tsc vì allowJs tắt; file .d.ts này để code TS import được có kiểu).
 */
import type { EventEmitter } from 'node:events';
import type { PythonServiceStatus } from './pythonServices';
import type { StaleBridgeCleanupResult } from './bridgePidfile';
import type {
  ElectronPidfileRecord,
  StaleElectronCleanupResult,
} from './electronOrphanCleanup';

export interface BridgeStatus {
  state: 'stopped' | 'starting' | 'running' | 'restarting' | 'failed';
  port: number | null;
  url: string | null;
  pid: number | null;
  restarts: number;
  uptimeSec: number;
  lastError: string | null;
}

export interface RenderStatus {
  /** CLI chạy theo job, do bridge spawn — không có daemon. */
  mode: 'on-demand';
  available: boolean;
  script: string;
  reason?: string;
}

export interface ServiceStatusSnapshot {
  bridge: BridgeStatus;
  render: RenderStatus;
  ai: Record<string, PythonServiceStatus>;
  ffmpeg: { available: boolean; version: string | null };
  updatedAt: string;
}

export interface ServiceManagerOptions {
  /** Thư mục gốc repo (chứa server/bridge, server/render, ...). */
  appRoot: string;
  /** app.getPath('userData') — log + bridge-jobs nằm đây. */
  userDataDir: string;
  /**
   * Binary node để spawn bridge (mặc định env VCUT_NODE hoặc "node" trong PATH).
   * KHÔNG dùng process.execPath của Electron (đó là binary Electron).
   */
  nodeBin?: string;
  /** Cổng bridge ưu tiên; bận thì tự dò cổng trống. Mặc định 8787. */
  preferredPort?: number;
  /** Số lần restart tối đa sau crash. Mặc định 3. */
  maxRestarts?: number;
  /**
   * Cổng CDP của Electron (đợt 51 H7) để cleanupStaleBridge kiểm tra socket
   * CDP có được giải phóng sau khi kill bridge mồ côi không; serviceLifecycle
   * tự lấy từ argv --remote-debugging-port. Mặc định 9222.
   */
  cdpPort?: number;
  /**
   * Callback mỗi khi trạng thái đổi (main forward sang renderer, ví dụ
   * win.webContents.send('vcut:services-status', snap)). Renderer không poll.
   */
  onStatus?: (snap: ServiceStatusSnapshot) => void;
}

export declare class ServiceManager extends EventEmitter {
  constructor(opts: ServiceManagerOptions);
  readonly appRoot: string;
  readonly userDataDir: string;
  start(): Promise<ServiceStatusSnapshot>;
  stop(): Promise<ServiceStatusSnapshot>;
  /**
   * Probe lại AI (ROUND52-I5): sau khi user tải xong model trong app, cập
   * nhật trạng thái AI mà không restart bridge.
   */
  reprobeAi(): Promise<ServiceStatusSnapshot>;
  /**
   * Dọn bridge mồ côi từ lần chạy trước theo pidfile (đợt 51 H7). start()
   * gọi tự động; expose public để scripts/harness gọi trước khi spawn
   * Electron (Electron bind CDP trước khi main.ts chạy).
   */
  cleanupStaleBridge(): Promise<StaleBridgeCleanupResult>;
  /**
   * Dọn renderer/GPU/utility/zygote con mồ côi của Electron VCut (đợt 52
   * I4) theo electron.pid.json — con của lần chạy trước kế thừa socket
   * CDP. start() gọi tự động sau cleanupStaleBridge; expose public để
   * scripts/harness gọi trước khi spawn Electron.
   */
  cleanupStaleElectronChildren(): Promise<StaleElectronCleanupResult>;
  getStatus(): ServiceStatusSnapshot;
  getBridgeUrl(): string | null;
  getBridgePort(): number | null;
  isRunning(): boolean;
  on(event: 'status', listener: (snap: ServiceStatusSnapshot) => void): this;
}

export declare function createServiceManager(opts: ServiceManagerOptions): ServiceManager;

/** Kill cả cây tiến trình (process group POSIX, /T Windows). */
export declare function killProcessGroup(pid: number, signal?: NodeJS.Signals): boolean;

export declare function isPidAlive(pid: number): boolean;
export declare function isPortFree(port: number): Promise<boolean>;
export declare function findFreePort(preferred: number, count?: number): Promise<number>;
export declare function healthCheck(
  port: number,
  timeoutMs?: number,
): Promise<{ ok: boolean; connected: boolean; data?: unknown; error?: string }>;

/**
 * Đợt 52 I4 — timeout khởi động bridge thích ứng theo tải (hàm thuần):
 * 30s × min(load1/cpu, 4), trần 120s. Máy yên (load ≤ cpu) → đúng 30s.
 */
export declare function startTimeoutForLoad(load1: number, cpuCount: number): number;
export declare const START_TIMEOUT_BASE_MS: number;
export declare const START_TIMEOUT_MAX_MS: number;
export declare const START_PROGRESS_EXTENSION_MS: number;

/** Đợt 52 I4 — pidfile Electron + dọn con mồ côi (re-export từ electronOrphanCleanup). */
export declare function cleanupStaleElectronChildren(
  userDataDir: string,
  opts?: { cdpPort?: number; log?: (msg: string) => void },
): Promise<StaleElectronCleanupResult>;
export declare function writeElectronPidfile(
  userDataDir: string,
  record: ElectronPidfileRecord,
  log?: (msg: string) => void,
): boolean;
export declare function readElectronPidfile(userDataDir: string): ElectronPidfileRecord | null;
export declare function removeElectronPidfile(userDataDir: string): boolean;

/** Ném ra khi cổng bị chiếm giữa chừng (để thử cổng khác). */
export declare class PortBusyError extends Error {
  port: number;
  constructor(port: number);
}
