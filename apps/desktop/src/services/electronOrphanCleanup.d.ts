/**
 * electronOrphanCleanup.d.ts — Kiểu cho electronOrphanCleanup.js (JS thuần,
 * không compile bằng tsc vì allowJs tắt; file .d.ts này để code TS import
 * được có kiểu). Xem electronOrphanCleanup.js để biết cơ chế pidfile
 * Electron + dọn renderer/GPU con mồ côi giữ socket CDP (đợt 52, I4).
 */

export interface ElectronPidfileRecord {
  /** pid của Electron main đã ghi pidfile. */
  appPid: number;
  /** Process group của main (chỉ để chẩn đoán, KHÔNG dùng để kill). */
  pgid?: number | null;
  /** Binary Electron (dev: .../electron, gói: .../vcut-studio). */
  execPath?: string;
  /** app.getAppPath() (dev: apps/desktop, gói: .../resources/app.asar). */
  appPath?: string | null;
  /** Thư mục userData của lần chạy đó. */
  userDataDir?: string;
  /** Cổng CDP lần chạy đó dùng. */
  cdpPort?: number;
  /** ISO timestamp lúc ghi. */
  startedAt?: string;
  version?: number;
}

export type StaleElectronCleanupAction =
  | 'none'
  | 'stale-pid-dead'
  | 'predecessor-alive'
  | 'orphan-killed'
  | 'kill-failed'
  | 'unsupported-platform';

export interface KilledElectronOrphan {
  pid: number;
  type: 'child' | 'main';
  reason: string;
}

export interface FailedElectronOrphan {
  pid: number;
  type: 'child' | 'main';
}

export interface StaleElectronCleanupResult {
  action: StaleElectronCleanupAction;
  pid?: number;
  cdpPort?: number;
  reason: string;
  killedPids?: KilledElectronOrphan[];
  failedPids?: FailedElectronOrphan[];
  /** Pid lạ còn giữ socket CDP (không khớp marker VCut nên KHÔNG kill). */
  unknownCdpHolders?: number[];
  cdpPortFreed?: boolean;
  scannedPasses?: number;
}

export interface CleanupStaleElectronOptions {
  /** Cổng CDP cần kiểm tra có được giải phóng không. Mặc định 9222. */
  cdpPort?: number;
  log?: (msg: string) => void;
}

export interface ElectronChildIdentification {
  match: boolean;
  type: 'child' | 'main' | null;
  cmdline: string | null;
  reason: string;
}

export interface ElectronChildMarkers {
  userDataDir: string;
  recordedAppPid?: number | null;
}

export declare const ELECTRON_PIDFILE_NAME: string;
export declare const DEFAULT_CDP_PORT: number;

export declare function electronPidfilePath(userDataDir: string): string;
export declare function writeElectronPidfile(
  userDataDir: string,
  record: ElectronPidfileRecord,
  log?: (msg: string) => void,
): boolean;
export declare function readElectronPidfile(userDataDir: string): ElectronPidfileRecord | null;
export declare function removeElectronPidfile(userDataDir: string): boolean;
export declare function isPidAlive(pid: number): boolean;
export declare function isPortFree(port: number): Promise<boolean>;
export declare function getProcessCmdline(pid: number): string[] | null;
/**
 * Parse buffer /proc/<pid>/cmdline thành danh sách arg. Chịu cả NUL-separated
 * (node/python) lẫn space-joined một chuỗi (con Chromium/Electron).
 */
export declare function parseProcessCmdline(raw: Buffer): string[];
export declare function getParentPid(pid: number): number | null;
export declare function isOrphanProcess(pid: number): boolean;
export declare function isInCurrentProcessTree(pid: number): boolean;
export declare function isVcutElectronChildProcess(
  pid: number,
  markers: ElectronChildMarkers,
): ElectronChildIdentification;
export declare function findSocketHolders(
  port: number,
): Array<{ pid: number; fd: string; inode: string }>;
export declare function killOneProcess(pid: number): Promise<boolean>;
export declare function scanOrphanElectronCandidates(markers: {
  userDataDir: string;
  recordedAppPid?: number | null;
  cdpPort?: number;
}): Array<{ pid: number; type: 'child' | 'main'; reason: string; holdsCdpSocket: boolean }>;
export declare function cleanupStaleElectronChildren(
  userDataDir: string,
  opts?: CleanupStaleElectronOptions,
): Promise<StaleElectronCleanupResult>;
