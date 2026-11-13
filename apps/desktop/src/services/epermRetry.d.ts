/**
 * epermRetry.d.ts — Kiểu cho epermRetry.js (JS thuần, không compile
 * bằng tsc vì allowJs tắt; file .d.ts này để code TS import được có kiểu).
 * Xem epermRetry.js để biết cơ chế retry EPERM + verify đủ byte.
 * Đợt 85 M5: port JS của apps/web/scripts/eperm-retry.mjs cho desktop.
 */

export interface EpermRetryOptions {
  /** Số lần thử tối đa (mặc định 5). */
  tries?: number;
  /** Thời gian chờ giữa 2 lần thử, ms (mặc định 20000). */
  delayMs?: number;
  /** Nhãn ghi log stderr (mặc định là đường dẫn file). */
  label?: string;
  /** Interface fs giả để fault-injection trong test. */
  fsImpl?: unknown;
}

export interface EpermRetryResult {
  /** Số lần đã thử (1 = thành công ngay lần đầu). */
  attempts: number;
  /** Số byte đã verify trên đĩa sau ghi. */
  bytes: number;
}

export const EPERM_TRIES: number;
export const EPERM_DELAY_MS: number;

export function isEpermError(err: unknown): boolean;
export function isEpermText(text: unknown): boolean;
export function sleepSync(ms: number): void;
export function sleepAsync(ms: number): Promise<void>;

/** Ghi file đồng bộ, retry khi gặp EPERM, verify đủ byte sau ghi. */
export function writeFileEpermRetry(
  file: string,
  data: string | Buffer,
  opts?: EpermRetryOptions,
): EpermRetryResult;

/** Biến thể async: cùng hợp đồng, ngủ bằng setTimeout (không block event loop). */
export function writeFileEpermRetryAsync(
  file: string,
  data: string | Buffer,
  opts?: EpermRetryOptions,
): Promise<EpermRetryResult>;
