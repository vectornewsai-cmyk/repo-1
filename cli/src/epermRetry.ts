/**
 * epermRetry.ts — Glue nối helper retry EPERM gốc (đợt 85 M5).
 *
 * Helper dùng chung sống ở apps/web/scripts/eperm-retry.mjs (K8 đợt 83,
 * biến thể async thêm ở M5 đợt 85). CLI build ra dist/ nên KHÔNG import
 * tĩnh được bằng đường tương đối (layout dist khác layout src — xem
 * findRepoRoot trong mcp-server/src/migrateRender.test.ts: lần đầu
 * hard-code đã làm spawn ENOENT). Glue này tìm repo root bằng cách đi
 * lên cho tới khi thấy file helper, rồi dynamic-import nó (cache 1 lần).
 *
 * LƯU Ý: helper chỉ được load khi có thao tác ghi (lazy) — CLI vẫn chạy
 * các lệnh không ghi file bình thường ngay cả khi file helper chưa có
 * trên đĩa; lỗi chỉ nổ ra lúc ghi (khi đó repo đã hỏng nặng hơn EPERM).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Repo root: đi lên từ HERE cho tới khi thấy apps/web/scripts/eperm-retry.mjs. */
function findRepoRoot(): string {
  let dir = HERE;
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "apps", "web", "scripts", "eperm-retry.mjs"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[eperm-retry] không tìm thấy repo root từ ${HERE}`);
}

export interface EpermRetryAsyncOptions {
  tries?: number;
  delayMs?: number;
  label?: string;
}

export interface EpermRetryResult {
  attempts: number;
  bytes: number;
}

interface EpermHelperModule {
  writeFileEpermRetryAsync(
    file: string,
    data: string | Buffer,
    opts?: EpermRetryAsyncOptions,
  ): Promise<EpermRetryResult>;
}

let cached: Promise<EpermHelperModule> | null = null;

function loadHelper(): Promise<EpermHelperModule> {
  if (!cached) {
    const helperPath = path.join(findRepoRoot(), "apps", "web", "scripts", "eperm-retry.mjs");
    cached = import(pathToFileURL(helperPath).href) as Promise<EpermHelperModule>;
  }
  return cached;
}

/**
 * Ghi file async, retry khi gặp EPERM, verify đủ byte sau ghi.
 * Cùng hợp đồng với helper gốc: chỉ retry lỗi EPERM, 5 lần × 20 s mặc
 * định, hết lượt thì ném. Xem apps/web/scripts/eperm-retry.mjs.
 */
export async function writeFileEpermRetryAsync(
  file: string,
  data: string | Buffer,
  opts?: EpermRetryAsyncOptions,
): Promise<EpermRetryResult> {
  const helper = await loadHelper();
  return helper.writeFileEpermRetryAsync(file, data, opts);
}
