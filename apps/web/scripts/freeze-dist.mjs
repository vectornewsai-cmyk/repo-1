#!/usr/bin/env node
/**
 * Phase 9 đợt 44, luồng Z5 — copy dist đóng băng chống race (sửa nợ
 * đợt 43 Y5 §4.2: chain script cpSync thẳng apps/web/dist vào
 * frozen-dist trong lúc luồng khác build lại dist → ENOENT
 * ".../frozen-dist/stickers" giữa lượt).
 *
 * Vấn đề: fs.cpSync đọc listing rồi copy từng file; nếu build khác
 * xoá/tạo lại file giữa hai bước đó thì cpSync ném ENOENT và toàn
 * bộ lượt chain chết, dù dist đích chỉ là scratch. Sửa:
 *  1. Copy vào thư mục tạm CÙNG thư mục cha với đích (cùng
 *     filesystem nên rename sau đó là nguyên tử).
 *  2. Copy lỗi ENOENT/ENOTDIR/EBUSY thì thử lại từ đầu (tối đa
 *     maxAttempts lần, mỗi lần xoá sạch bản tạm dở dang) — build
 *     khác chỉ làm copy dở, không làm copy hỏng vĩnh viễn.
 *  3. Đổi tên hai bước: đích cũ → .old-<pid> (nếu có), tạm →
 *     đích, rồi xoá đích cũ. Không có thời điểm nào đích chứa
 *     cây dở dang: độc giả chỉ thấy đích cũ nguyên vẹn hoặc đích
 *     mới đầy đủ (cửa sổ giữa hai lần rename chỉ làm đích vắng
 *     mặt thoáng qua, không làm đích dở dang — và đích này là
 *     scratch riêng của lượt chain, không phải dist live).
 * Không sửa dist nguồn, không đụng dist live, không đổi tiêu chí
 * chainVerdict/Q6 — chỉ thay cách copy trong chain script.
 * KHÔNG push, KHÔNG tag/release.
 */
import fs from "node:fs";
import path from "node:path";

const RETRY_CODES = new Set(["ENOENT", "ENOTDIR", "EBUSY"]);

export function freezeDist(srcDir, destDir, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 5;
  const tmpDir = `${destDir}.tmp-${process.pid}`;
  const oldDir = `${destDir}.old-${process.pid}`;
  let attempts = 0;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts = attempt;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.cpSync(srcDir, tmpDir, { recursive: true });
      lastError = null;
      break;
    } catch (e) {
      lastError = e;
      if (!RETRY_CODES.has(e?.code) || attempt === maxAttempts) throw e;
      // Thử lại từ đầu với bản tạm sạch; không giữ cây dở dang.
    }
  }
  // Đổi tên hai bước (cùng thư mục cha → rename nguyên tử từng bước).
  const hadDest = fs.existsSync(destDir);
  try {
    if (hadDest) fs.renameSync(destDir, oldDir);
    fs.renameSync(tmpDir, destDir);
  } catch (e) {
    // Khôi phục đích cũ nếu bước thứ hai trượt (đích mới chưa vào).
    try { if (hadDest && !fs.existsSync(destDir) && fs.existsSync(oldDir)) fs.renameSync(oldDir, destDir); } catch {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    throw e;
  }
  try { fs.rmSync(oldDir, { recursive: true, force: true }); } catch {}
  return { destDir, attempts, retried: attempts > 1, lastErrorCode: lastError?.code ?? null };
}
