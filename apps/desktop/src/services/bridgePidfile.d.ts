/**
 * bridgePidfile.d.ts — Kiểu cho bridgePidfile.js (JS thuần, không compile
 * bằng tsc vì allowJs tắt; file .d.ts này để code TS import được có kiểu).
 * Xem bridgePidfile.js để biết cơ chế pidfile + dọn bridge mồ côi.
 */

export interface BridgePidfileRecord {
  /** pid của bridge. */
  pid: number;
  /** Cổng bridge đang nghe. */
  port: number;
  /** pid của Electron main đã spawn bridge. */
  appPid?: number;
  /** Đường dẫn tuyệt đối server/bridge/src/index.js. */
  bridgeEntry?: string | null;
  /** ISO timestamp lúc spawn. */
  startedAt?: string;
  version?: number;
}

export type StaleBridgeCleanupAction =
  | 'none'
  | 'invalid-removed'
  | 'stale-pid-dead'
  | 'alive-not-vcut'
  | 'orphan-killed'
  | 'kill-failed';

export interface StaleBridgeCleanupResult {
  action: StaleBridgeCleanupAction;
  pid?: number;
  port?: number;
  reason: string;
  cmdline?: string | null;
  healthOk?: boolean;
  killed?: boolean;
  bridgePortFreed?: boolean;
  cdpPortFreed?: boolean;
  cdpPort?: number;
}

export interface CleanupStaleBridgeOptions {
  /** Cổng CDP cần kiểm tra có được giải phóng không. Mặc định 9222. */
  cdpPort?: number;
  log?: (msg: string) => void;
}

export declare const BRIDGE_PIDFILE_NAME: string;
export declare const BRIDGE_ENTRY_SUFFIX: string;
export declare const DEFAULT_CDP_PORT: number;

export declare function pidfilePath(userDataDir: string): string;
export declare function writeBridgePidfile(
  userDataDir: string,
  record: BridgePidfileRecord,
  log?: (msg: string) => void,
): boolean;
export declare function readBridgePidfile(userDataDir: string): BridgePidfileRecord | null;
export declare function removeBridgePidfile(userDataDir: string): boolean;
export declare function isPidAlive(pid: number): boolean;
export declare function isPortFree(port: number): Promise<boolean>;
export declare function getProcessCmdline(pid: number): string[] | null;
export declare function isVcutBridgeProcess(
  pid: number,
  bridgeEntry?: string,
): { match: boolean; cmdline: string | null; reason: string };
export declare function isProcessGroupLeader(pid: number): boolean;
export declare function killBridgeTree(pid: number): Promise<boolean>;
export declare function healthCheck(
  port: number,
): Promise<{ ok: boolean; data?: unknown; error?: string }>;
export declare function cleanupStaleBridge(
  userDataDir: string,
  opts?: CleanupStaleBridgeOptions,
): Promise<StaleBridgeCleanupResult>;
