#!/usr/bin/env node
/**
 * cdp-snapshot.mjs — Kỷ luật snapshot khi treo CDP, dùng chung cho mọi
 * harness click-test pipe CDP (Phase 9 đợt 30, luồng M5).
 *
 * Bối cảnh: lần treo CDP gốc ở K6 (đợt 28) không có snapshot process
 * nên kết luận "nhiễu hạ tầng" của đợt 29 L5 chỉ đạt tin cậy cao chứ
 * không tuyệt đối — bundle đó đã bị build đè nên không tái hiện được.
 * Kỷ luật này ngăn nợ đó tái diễn:
 *
 * QUY TRÌNH BẮT BUỘC cho mọi harness có PipeCdp.send():
 *   1. Trong đúng callback timeout của send() (trước khi reject),
 *      gọi captureCdpHangSnapshot() ĐỒNG BỘ (spawnSync) — không await,
 *      không để chẩn đoán tự nó treo theo.
 *   2. Snapshot phải ghi RA FILE (không chỉ log console): log có thể
 *      mất khi tiến trình harness bị SIGTERM, file thì còn.
 *   3. Mỗi snapshot một file riêng, không ghi đè snapshot cũ:
 *      cdp-hang-<ISO-compact>-<method-sanitized>-<pid>.json
 *   4. Chẩn đoán không bao giờ được che lỗi gốc: nếu snapshot lỗi,
 *      chỉ log thêm, rồi vẫn reject đúng lỗi timeout ban đầu.
 *
 * Nội dung một snapshot (đủ để phân biệt 3 hướng sau này):
 *   - capturedAt, method, timeoutMs: lệnh nào, quá hạn bao lâu.
 *   - proc: pid, exitCode, signalCode, killed của tiến trình Chrome
 *     (Chrome chết thật thì exitCode/signalCode khác null).
 *   - pendingCount: số lệnh CDP đang chờ (pipe tắc thường > 0, page
 *     hang thường chỉ lệnh hiện tại).
 *   - ps: danh sách tiến trình chrome lúc treo (stat/etime/%cpu/%mem)
 *     — Chrome sống nhưng CPU 0% lâu khác với Chrome đang chạy.
 *   - bundle: LUÔN là object, không bao giờ null (đợt 34 Q5 sửa
 *     trường hợp bundle null gây hiểu nhầm). Nếu harness cung cấp
 *     (bắt buộc khi có snapshotDist): { name, sha256_16, status:
 *     "captured" } — để lần treo sau không còn rơi vào cảnh "bundle
 *     đã bị build đè, không tái hiện được". Đợt 35 R5 thêm trường
 *     `dist` (chỉ khi harness cung cấp, tức khi dùng
 *     snapshotBundleFromDist): đường dẫn tuyệt đối của thư mục dist
 *     đang được serve, để snapshot ghi đủ "dist path + sha256".
 *     Nếu harness không cung cấp (harness WS đo trên vite dev/preview, không snapshot dist):
 *     { name: null, sha256_16: null, status: "not-captured", note }
 *     — "not-captured" nghĩa là "bundle đang đo KHÔNG ĐƯỢC GHI LẠI
 *     trong file này", KHÔNG phải "không có bundle nào chạy" và
 *     KHÔNG phải "snapshot rỗng": proc/ps/pendingCount/method vẫn
 *     đầy đủ. Muốn xác định bundle của lần treo đó thì đối chiếu
 *     capturedAt với log của harness / lần build dist gần nhất.
 *     Độc giả cũ từng kiểm `snapshot.bundle == null` nay phải kiểm
 *     `snapshot.bundle.status === "not-captured"`. Các file snapshot
 *     cũ trên đĩa vẫn giữ dạng bundle: null — chỉ snapshot mới
 *     dùng dạng object này.
 *   - extra: harness tự thêm (display, port, case đang chạy...).
 *
 * KHÔNG đổi ngữ nghĩa test: hàm này chỉ quan sát + ghi file, không
 * retry lệnh, không kill Chrome, không đổi giá trị reject.
 *
 * Kiểm chứng (đợt 30 M5): giả lập treo bằng timeout 1ms có chủ đích
 * trên pipe thật (xem clicktest-m5-round30-snapshot-probe.mjs) và
 * xác nhận file snapshot được tạo với đủ trường trên.
 *
 * Nơi ghi bền (đợt 32 O2): thư mục snapshot KHÔNG nằm trong repo (để
 * không lọt vào batch push) và KHÔNG nằm trong /tmp (dễ bị dọn):
 * mặc định là ~/workspace/vcut-cdp-hang-snapshots/<tên-script>/ — thư
 * mục workspace tồn tại qua restart VM. Các harness có SCRATCH riêng
 * vẫn dùng <SCRATCH>/cdp-hang-snapshots/ như trước; nhóm 13 harness
 * không có SCRATCH đã chuyển từ /tmp sang thư mục bền này ở đợt 32.
 * Nếu harness nào quên truyền outDir, module dùng _unspecified/ thay
 * vì throw (đường dẫn bền, không che lỗi timeout gốc).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Thư mục bền mặc định khi harness không truyền outDir (xem ghi chú trên).
const DEFAULT_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "_unspecified");

function sanitizeMethod(method) {
  return String(method || "unknown").replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 80);
}

function psChromeLines() {
  try {
    const ps = spawnSync(
      "sh",
      ["-c", "ps -eo pid,ppid,stat,etime,%cpu,%mem,args | grep -E 'chrome' | grep -v grep | head -20"],
      { encoding: "utf8", timeout: 10000 },
    );
    return (ps.stdout || "").slice(0, 4000);
  } catch (e) {
    return `ps-lỗi: ${e.message}`;
  }
}

/**
 * Chụp snapshot chẩn đoán treo CDP và ghi ra file. Luôn trả về object
 * { file, snapshot } hoặc { file: null, snapshot, error } khi ghi lỗi
 * — caller vẫn phải reject lỗi timeout gốc sau khi gọi hàm này.
 */
export function captureCdpHangSnapshot({
  proc = null,
  pendingCount = null,
  method = "unknown",
  timeoutMs = null,
  outDir = DEFAULT_OUT_DIR,
  bundle = null,
  extra = {},
}) {
  const capturedAt = new Date().toISOString();
  const snapshot = {
    capturedAt,
    method,
    timeoutMs,
    proc: proc
      ? {
          pid: proc.pid ?? null,
          exitCode: proc.exitCode ?? null,
          signalCode: proc.signalCode ?? null,
          killed: proc.killed ?? null,
        }
      : null,
    pendingCount,
    ps: psChromeLines(),
    // Đợt 34 Q5: bundle luôn là object, không null — xem ghi chú ở
    // header. "not-captured" = harness không cung cấp bundle, tức
    // bundle đang đo không được ghi lại; không có nghĩa là không có
    // bundle nào chạy, và snapshot không vì thế mà rỗng.
    bundle: bundle
      ? {
          name: bundle.bundle ?? bundle.name ?? null,
          sha256_16: bundle.sha ?? bundle.sha256_16 ?? null,
          status: "captured",
          // Đợt 35 R5: chỉ ghi dist khi harness cung cấp (qua
          // snapshotBundleFromDist); harness cũ không truyền thì
          // không thêm trường, giữ nguyên hình dạng snapshot cũ.
          ...(bundle.dist ?? bundle.dir ? { dist: bundle.dist ?? bundle.dir } : {}),
        }
      : {
          name: null,
          sha256_16: null,
          status: "not-captured",
          note: "Harness did not provide a bundle (no snapshotDist): the bundle under test was NOT recorded in this file. Correlate capturedAt with the harness log / nearest dist build to identify it. This does NOT mean no bundle was running.",
        },
    extra,
  };
  const compact = capturedAt.replace(/[-:.]/g, "").replace("T", "_").replace("Z", "");
  const fileName = `cdp-hang-${compact}-${sanitizeMethod(method)}-${snapshot.proc?.pid ?? "nopid"}.json`;
  const file = path.join(outDir, fileName);
  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
    return { file, snapshot };
  } catch (e) {
    return { file: null, snapshot, error: e.message };
  }
}
