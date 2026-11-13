// eperm-retry.cjs — Phase 9 đợt 85, luồng M5: bản port CJS của helper
// apps/web/scripts/eperm-retry.mjs (K8 đợt 83) cho cây server/.
//
// Vì sao cần port riêng thay vì require thẳng file .mjs gốc:
// - server/bridge và server/render là CommonJS (package.json "type":
//   "commonjs"), chạy cả từ repo (dev) lẫn từ bản đóng gói
//   (apps/desktop/build/bundled-server/server/ — copy-bundled-server.mjs
//   chỉ copy cây server/, KHÔNG có apps/web/scripts). Một require() tới
//   ../../../apps/web/scripts/eperm-retry.mjs sẽ gãy trong AppImage.
// - File này nằm ở gốc server/ nên cả bridge/src lẫn render/src đều
//   require được bằng đường tương đối "../../eperm-retry.cjs", và
//   copy-bundled-server.mjs có rule copy nó vào bundle (mục 1).
//
// GIỮ ĐỒNG BỘ: mọi thay đổi hợp đồng (số lần retry, nhịp delay, luật
// chỉ retry EPERM, verify đủ byte) phải sửa CẢ file này VÀ
// apps/web/scripts/eperm-retry.mjs VÀ apps/desktop/src/services/epermRetry.js.
// Test: node server/eperm-retry.test.cjs (fault-injection + đường thật).
//
// Hợp đồng (giống hệt bản gốc):
// - CHỈ retry khi lỗi mang dấu EPERM (code EPERM hoặc message chứa
//   "Operation not permitted") — lỗi khác ném ngay, không thử lại.
// - Sau mỗi lần ghi, VERIFY đủ byte bằng statSync — ghi "thành công"
//   nhưng thiếu byte (mẫu 0-byte lặng của sóng EPERM) được coi là lỗi
//   EPERM và thử lại.
// - Nhịp retry 5 lần × 20 s (đúng pattern package-ship.mjs của J8).
//   Sóng dài ~15 phút thì retry KHÔNG qua được — helper chỉ cứu sóng
//   ngắn và lần fail lẻ. Hết lượt retry mà vẫn EPERM thì NÉM LỖI,
//   caller quyết định dừng theo luật "bị chặn thì dừng, không cố lách".
// - KHÔNG dùng helper này để giấu lỗi: mọi lần thử fail đều log ra stderr.
"use strict";

const fs = require("node:fs");

const EPERM_TRIES = 5;
const EPERM_DELAY_MS = 20000;

function isEpermError(err) {
  if (!err) return false;
  if (err.code === "EPERM") return true;
  const msg = typeof err === "string" ? err : err.message || "";
  return typeof msg === "string" && msg.includes("Operation not permitted");
}

function isEpermText(text) {
  return typeof text === "string" && text.includes("Operation not permitted");
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Ghi file đồng bộ, retry khi gặp EPERM, verify đủ byte sau ghi.
 * Trả { attempts, bytes }. Ném lỗi cuối cùng khi hết lượt retry hoặc khi
 * lỗi không phải EPERM. opts: { tries, delayMs, label, fsImpl }.
 */
function writeFileEpermRetry(file, data, opts = {}) {
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
        // Ghi "thành công" nhưng thiếu byte — mẫu 0-byte của sóng EPERM.
        // Coi như lỗi EPERM, thử lại.
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

module.exports = {
  EPERM_TRIES,
  EPERM_DELAY_MS,
  isEpermError,
  isEpermText,
  sleepSync,
  writeFileEpermRetry,
};
