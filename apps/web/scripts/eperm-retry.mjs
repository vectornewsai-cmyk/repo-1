// eperm-retry.mjs — Phase 9 đợt 83, luồng K8: helper dùng chung chống sóng EPERM.
//
// Bối cảnh: VM này có sóng "Operation not permitted" lặp lại (không phải đã
// hết hẳn — xem docs/PHASE9_ROUND82_LIMITS.md §4 mục 9; tái phát 22:50–
// 23:05 +07 ngày 10/11 sau khi đã hết lúc 18:36). Mẫu sóng đã ghi nhận:
// ghi file ra 0 byte (có khi không ném lỗi — J6: python flush bị nuốt lặng,
// log 0 byte), ffmpeg fail "Could not write header … Operation not
// permitted", node writeFileSync fail rải rác; sóng chập chờn theo giây,
// không theo đường dẫn hay filesystem, kéo dài ~15 phút.
//
// Quy tắc dùng helper này:
// - CHỈ retry khi lỗi mang dấu EPERM (code EPERM hoặc chuỗi "Operation not
//   permitted" trong message/stderr) — lỗi khác (ENOENT, sai codec, sai
//   tham số) NÉM NGAY, không thử lại.
// - Sau mỗi lần ghi, VERIFY đủ byte bằng statSync — ghi "thành công" nhưng
//   thiếu byte (mẫu 0-byte) được coi là lỗi EPERM và thử lại.
// - Nhịp retry 5 lần × 20 s — tái dùng đúng pattern của
//   apps/desktop/scripts/package-ship.mjs runSyncRetry (J8). Sóng kéo dài
//   ~15 phút nên retry KHÔNG đảm bảo qua sóng; nó chỉ cứu các sóng ngắn
//   và các lần fail lẻ. Khi hết lượt retry mà vẫn EPERM thì NÉM LỖI —
//   caller quyết định dừng theo luật "bị chặn thì dừng, không cố lách".
// - KHÔNG dùng helper này để giấu lỗi: mọi lần thử fail đều log ra stderr.
//
// Dùng được từ cả ESM (import) và CJS (require — Node ≥ 22.12 cho require
// ESM đồng bộ; VM này chạy Node v24). opts.fsImpl / opts.spawnImpl chỉ
// phục vụ test fault-injection (test_round83_k8_eperm_retry.mjs).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";

export const EPERM_TRIES = 5;
export const EPERM_DELAY_MS = 20000;

export function isEpermError(err) {
  if (!err) return false;
  if (err.code === "EPERM") return true;
  const msg = typeof err === "string" ? err : err.message || "";
  return typeof msg === "string" && msg.includes("Operation not permitted");
}

export function isEpermText(text) {
  return typeof text === "string" && text.includes("Operation not permitted");
}

export function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Ngủ không block event loop (cho biến thể async). */
export function sleepAsync(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Biến thể async của writeFileEpermRetry (đợt 85 M5): cùng hợp đồng
 * (chỉ retry lỗi EPERM, verify đủ byte sau ghi, 5 lần × 20 s mặc định),
 * nhưng ngủ bằng setTimeout thay vì Atomics.wait nên KHÔNG block event
 * loop — dùng cho MCP server / CLI / desktop file-io (đường ghi project
 * của người dùng, chạy trong process có server/event loop). opts.fsImpl
 * là interface promises { writeFile, stat } (mặc định node:fs/promises).
 */
export async function writeFileEpermRetryAsync(file, data, opts = {}) {
  const tries = opts.tries ?? EPERM_TRIES;
  const delayMs = opts.delayMs ?? EPERM_DELAY_MS;
  const label = opts.label || String(file);
  const f = opts.fsImpl || fsp;
  const expected = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
  let lastErr = null;
  for (let i = 1; i <= tries; i += 1) {
    try {
      await f.writeFile(file, data);
      const actual = (await f.stat(file)).size;
      if (actual !== expected) {
        throw Object.assign(
          new Error(`ghi thiếu byte: ${actual}/${expected} byte`),
          { code: "EPERM" },
        );
      }
      if (i > 1) console.error(`[eperm-retry] ${label}: OK ở lần thử ${i}/${tries} (sóng EPERM đã qua)`);
      return { attempts: i, bytes: actual };
    } catch (e) {
      lastErr = e;
      const retryable = isEpermError(e);
      console.error(
        `[eperm-retry] ${label}: lần thử ${i}/${tries} fail: ${e.code || ""} ${e.message}` +
        (retryable ? "" : " (không phải EPERM — không thử lại)"),
      );
      if (!retryable || i >= tries) break;
      await sleepAsync(delayMs);
    }
  }
  throw lastErr;
}

/**
 * Ghi file đồng bộ, retry khi gặp EPERM, verify đủ byte sau ghi.
 * Trả { attempts, bytes }. Ném lỗi cuối cùng khi hết lượt retry hoặc khi
 * lỗi không phải EPERM. opts: { tries, delayMs, label, fsImpl }.
 */
export function writeFileEpermRetry(file, data, opts = {}) {
  const tries = opts.tries ?? EPERM_TRIES;
  const delayMs = opts.delayMs ?? EPERM_DELAY_MS;
  const label = opts.label || String(file);
  const f = opts.fsImpl || fs;
  const expected = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
  let lastErr = null;
  for (let i = 1; i <= tries; i += 1) {
    try {
      f.writeFileSync(file, data);
      const actual = f.statSync(file).size;
      if (actual !== expected) {
        // Ghi "thành công" nhưng thiếu byte — mẫu 0-byte của sóng EPERM
        // (J6: file 0 byte mà không có lỗi). Coi như lỗi EPERM, thử lại.
        throw Object.assign(
          new Error(`ghi thiếu byte: ${actual}/${expected} byte`),
          { code: "EPERM" },
        );
      }
      if (i > 1) console.error(`[eperm-retry] ${label}: OK ở lần thử ${i}/${tries} (sóng EPERM đã qua)`);
      return { attempts: i, bytes: actual };
    } catch (e) {
      lastErr = e;
      const retryable = isEpermError(e);
      console.error(
        `[eperm-retry] ${label}: lần thử ${i}/${tries} fail: ${e.code || ""} ${e.message}` +
        (retryable ? "" : " (không phải EPERM — không thử lại)"),
      );
      if (!retryable || i >= tries) break;
      sleepSync(delayMs);
    }
  }
  throw lastErr;
}

/**
 * Chạy 1 lệnh đồng bộ (spawnSync), retry CHỈ khi lỗi mang dấu EPERM
 * (spawn error code EPERM, hoặc stderr chứa "Operation not permitted").
 * Lỗi khác (sai tham số, codec, timeout) ném ngay sau lần đầu.
 * Trả kết quả spawnSync khi exit 0. opts: { tries, delayMs, label,
 * timeout, spawnImpl }.
 */
export function runSyncEpermRetry(cmd, args, opts = {}) {
  const tries = opts.tries ?? EPERM_TRIES;
  const delayMs = opts.delayMs ?? EPERM_DELAY_MS;
  const label = opts.label || `${cmd} ${args.join(" ")}`;
  const spawn = opts.spawnImpl || spawnSync;
  const spawnOpts = { encoding: "utf8", ...(opts.timeout ? { timeout: opts.timeout } : {}) };
  let lastErr = null;
  for (let i = 1; i <= tries; i += 1) {
    const r = spawn(cmd, args, spawnOpts);
    const errText = (r.error && (r.error.message || "")) + (r.stderr || "");
    const eperm = (r.error && r.error.code === "EPERM") || isEpermText(errText);
    if (!r.error && r.status === 0) {
      if (i > 1) console.error(`[eperm-retry] ${label}: OK ở lần thử ${i}/${tries} (sóng EPERM đã qua)`);
      return r;
    }
    lastErr = new Error(
      `${label}: ${r.error ? `không chạy được ${cmd}: ${r.error.message}` : `thoát mã ${r.status}`}: ${(r.stderr || "").slice(0, 300)}`,
    );
    lastErr.code = r.error ? r.error.code : null;
    console.error(
      `[eperm-retry] ${label}: lần thử ${i}/${tries} fail: ${lastErr.message}` +
      (eperm ? "" : " (không phải EPERM — không thử lại)"),
    );
    if (!eperm || i >= tries) break;
    sleepSync(delayMs);
  }
  throw lastErr;
}
