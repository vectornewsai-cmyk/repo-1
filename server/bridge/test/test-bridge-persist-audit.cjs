#!/usr/bin/env node
/**
 * test-bridge-persist-audit.cjs — Đợt 66 T9: khóa quy tắc "mọi test spawn
 * bridge phải đặt BRIDGE_RATE_PERSIST_PATH riêng".
 *
 * Bối cảnh (đợt 65 §3b): từ đợt 65 S5 bridge lưu trạng thái rate limiter ra
 * đĩa (mặc định ~/.cache/vcut/rate-limit.json) và nạp lại lúc khởi động.
 * Test nào spawn bridge mà không đặt persist riêng sẽ (a) nạp mốc của
 * instance trước (cùng IP 127.0.0.1) và (b) ghi mốc của mình đè lên file
 * chung — lần đầu làm e2e bridge-error tụt 165 → 128 pass. Đợt 66 T9 đã rà
 * soát toàn bộ repo và vá mọi site còn sót (xem
 * docs/PHASE9_ROUND66_T9_BRIDGE_PERSIST_LIMITS.md §1).
 *
 * Test này là kiểm tra TĨNH (không spawn bridge, chạy nhanh), gồm 3 phần:
 *  1. INVENTORY: mọi file trong danh sách dưới đây phải chứa
 *     BRIDGE_RATE_PERSIST_PATH trong code (không tính dòng comment nguyên
 *     dòng — nhắc bằng comment mà không set env thì vẫn rò).
 *  1b. VIA_MANAGER: test spawn bridge thật chỉ qua ServiceManager (điểm
 *     cách ly tập trung ở serviceManager.js).
 *  2. DISCOVERY: quét lại repo tìm file spawn bridge mà KHÔNG có trong
 *     inventory/via-manager/allowlist/false-positive → FAIL, bắt người thêm
 *     test mới phải cách ly persist rồi đăng ký vào inventory.
 *
 * Heuristic, không hoàn hảo: nhận diện spawn bằng chuỗi
 * "server/bridge/src/index.js" / "BRIDGE_ENTRY" / "bridgeEntry" kèm
 * "spawn(" (hoặc `node ... src/index.js` với .sh). File nào spawn bridge
 * bằng cách khác (vd: đường dẫn lắp từ biến lạ) sẽ không bị phát hiện —
 * khi đó rà soát tay vẫn cần (xem LIMITS đợt này §1).
 *
 * Chạy: node server/bridge/test/test-bridge-persist-audit.cjs
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");
const SELF = path.relative(ROOT, __filename).split(path.sep).join("/");

// --- 1. INVENTORY: file spawn bridge (đã cách ly persist) -----------------
// Ghi chú ngắn sau mỗi nhóm để lần sau sửa đúng chỗ.
const INVENTORY = [
  // e2e bridge (đã vá từ đợt 65, giữ lại để khóa):
  "server/bridge/test/test-bridge-error-protocol-e2e.cjs",
  "server/bridge/test/test-rate-limit-global-e2e.cjs",
  // e2e bridge (vá đợt 66 T9):
  "server/bridge/test/test-error-detail-structured.cjs",
  "server/bridge/test/test-error-detail-cli-proxy.cjs",
  // shell test trong server/bridge/test (vá đợt 66 T9):
  "server/bridge/test/test-bridge-queue.sh",
  "server/bridge/test/test-cors.sh",
  "server/bridge/test/test-diskstorage.sh",
  "server/bridge/test/test-luts-r5.sh",
  "server/bridge/test/test-p7-bridge-restart.sh",
  "server/bridge/test/test-proxy-q8.sh",
  // shell e2e ở server/bridge (vá đợt 66 T9):
  "server/bridge/test-export-e2e.sh",
  "server/bridge/test_hardening.sh",
  "server/bridge/test-export-progress.sh",
  "server/bridge/test-caption-e2e.sh",
  "server/bridge/test-translate-e2e.sh",
  // render test spawn bridge thật (vá đợt 66 T9):
  "server/render/src/test_round65_s4_gpu_bridge.js",
  // headed/clicktest/probe ở apps/web/scripts (vá đợt 66 T9):
  "apps/web/scripts/check-proxy-auto.mjs",
  "apps/web/scripts/probe-round38-u3-relink-dedup-pipe.mjs",
  "apps/web/scripts/gop-headed-bridge-43y4.mjs",
  "apps/web/scripts/gop-headed-bridge-44z4.mjs",
  "apps/web/scripts/gopHeaded46B4.mjs",
  "apps/web/scripts/gopHeaded47C5.mjs",
  "apps/web/scripts/gopHeaded48D4.mjs",
  "apps/web/scripts/gopHeaded49E2.mjs",
  "apps/web/scripts/gopTail45A4-headed.mjs",
  "apps/web/scripts/probe-54k7-geo.mjs",
  "apps/web/scripts/clicktest-53j5-proxy-persist.mjs",
  "apps/web/scripts/clicktest-54k7-proxy-toolbar-stale.mjs",
  "apps/web/scripts/clicktest-62r10-headed-gaps.mjs",
  "apps/web/scripts/clicktest-62r10-proxy-redo.mjs",
  "apps/web/scripts/clicktest-63r1-modal-headed.mjs",
  "apps/web/scripts/clicktest-64r8-job-note-headed.mjs",
  "apps/web/scripts/clicktest-65s10-job-note-locale-headed.mjs",
  // parent gộp đợt 66: file T8 tạo sau lúc T9 quét xong (audit 75/76) —
  // đã vá persist ở startBridge + đăng ký tại đây.
  "apps/web/scripts/clicktest-66t8-resume-job-headed.mjs",
  // Đợt 67 U7 tạo sau lúc T9 quét (audit 77/78 trước khi đăng ký — file
  // đã set BRIDGE_RATE_PERSIST_PATH ở startBridge, chỉ thiếu đăng ký):
  // V8 đợt 68 đăng ký nốt để audit xanh lại.
  "apps/web/scripts/clicktest-67u7-job-history-headed.mjs",
  // Đợt 68 V8 (mới): HEAD download + headed export-dest (cả 2 file đều
  // set BRIDGE_RATE_PERSIST_PATH riêng). Script Electron
  // (clicktest-68v8-export-dest-electron.mjs) KHÔNG đăng ký ở đây: nó
  // chỉ spawn Electron, bridge do ServiceManager của app khởi động
  // (đã cách ly theo userDataDir) nên không khớp heuristic quét.
  "server/bridge/test/test-download-head-68v8.cjs",
  "apps/web/scripts/clicktest-68v8-export-dest-headed.mjs",
  // Đợt 68 V2 (đăng ký đợt 69 W3 — file đã set BRIDGE_RATE_PERSIST_PATH
  // ở spawn, chỉ thiếu đăng ký nên audit từng báo 83 pass / 1 fail):
  "server/bridge/test/test-stab-single-thread-68v2.cjs",
  // desktop (vá đợt 66 T9):
  "apps/desktop/scripts/verify-desktop.mjs",
  // production: ServiceManager suy ra persist từ userDataDir (mỗi app/test
  // một file riêng; xem serviceManager.js — vẫn tính là "đã cách ly").
  "apps/desktop/src/services/serviceManager.js",
];

// --- VIA_MANAGER: spawn bridge THẬT nhưng chỉ qua ServiceManager ----------
// ServiceManager (apps/desktop/src/services/serviceManager.js, đã ở
// inventory) tự đặt BRIDGE_RATE_PERSIST_PATH theo userDataDir nên các test
// này được cách ly mà không cần set env trực tiếp. Audit chỉ khẳng định
// chúng tồn tại + thật sự đi qua ServiceManager (không spawn bridge trực
// tiếp bằng spawn("node", [bridgeEntry])).
const VIA_MANAGER = [
  "apps/desktop/src/services/serviceManager.test.cjs",
  "apps/desktop/src/services/bridgePidfile.test.cjs",
];

// --- HEURISTIC_FALSE_POSITIVES: heuristic quét nhầm ------------------------
// bridgePidfile.js: chỉ NHẬN DIỆN bridge qua cmdline (BRIDGE_ENTRY_SUFFIX)
// để dọn mồ côi, không spawn bridge.
// electronOrphanCleanup.test.cjs: chỉ spawn process mock (node -e / sleep)
// với argv giả '/fake/server/bridge/src/index.js' để test nhận diện, không
// spawn bridge thật.
const HEURISTIC_FALSE_POSITIVES = new Set([
  "apps/desktop/src/services/bridgePidfile.js",
  "apps/desktop/src/services/electronOrphanCleanup.test.cjs",
]);

// --- ALLOWLIST: spawn bridge nhưng CỐ TÌNH dùng persist mặc định ----------
// scripts/start.sh: dev server — một instance sống lâu duy nhất, persist
// mặc định CHÍNH LÀ tính năng (giữ limiter qua restart khi dev). Không
// phải test, không chạy song song với test suite.
const ALLOWLIST = new Set(["scripts/start.sh"]);

/** Heuristic: file có nhắc tới entry của bridge không? */
function mentionsBridgeEntry(rel, code) {
  if (code.includes("server/bridge/src/index.js")) return true;
  if (code.includes("bridge/src/index.js")) return true;
  if (code.includes("BRIDGE_ENTRY") || code.includes("bridgeEntry")) return true;
  // Dạng path.join("server", "bridge", "src", "index.js") — từng đoạn riêng.
  if (code.includes('"server", "bridge", "src", "index.js"')) return true;
  if (code.includes("'server', 'bridge', 'src', 'index.js'")) return true;
  // Dạng cwd: spawn("node", ["src/index.js"], { cwd: .../server/bridge }).
  if (code.includes("server/bridge") && code.includes("src/index.js")) return true;
  // Dạng cwd lắp từ đoạn: path.join(ROOT, "server", "bridge") + ["src/index.js"].
  if ((code.includes('"server", "bridge"') || code.includes("'server', 'bridge'")) &&
    code.includes("src/index.js")) return true;
  if (rel.endsWith(".sh")) {
    // .sh trong server/bridge chạy `node src/index.js` (cwd đã là bridge),
    // hoặc qua $BRIDGE_DIR/$ROOT trỏ tới server/bridge.
    return code.includes("src/index.js") &&
      (rel.startsWith("server/bridge/") || code.includes("BRIDGE_DIR") ||
        code.includes("server/bridge"));
  }
  return false;
}

// Thư mục không quét (build output / vendor / release đóng gói).
const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", "release", ".git",
  "release-round55-l4", "linux-unpacked",
]);
const SCAN_EXTS = new Set([".cjs", ".mjs", ".js", ".ts", ".sh"]);

let pass = 0, fail = 0;
function ok(cond, msg, extra) {
  if (cond) { pass++; console.log(`   ✅ ${msg}`); }
  else { fail++; console.log(`   ❌ ${msg}${extra !== undefined ? ` (nhận: ${extra})` : ""}`); }
}

/** true nếu file có BRIDGE_RATE_PERSIST_PATH ở dòng code (không phải dòng comment nguyên dòng). */
function hasPersistInCode(src) {
  return src.split("\n").some((line) => {
    const t = line.trim();
    if (!t.includes("BRIDGE_RATE_PERSIST_PATH")) return false;
    if (t.startsWith("//") || t.startsWith("#") || t.startsWith("*")) return false;
    return true;
  });
}

/** Heuristic: file có spawn bridge process không? (xem header). */
function spawnsBridge(rel, src) {
  const codeLines = src.split("\n").filter((line) => {
    const t = line.trim();
    return t && !t.startsWith("//") && !t.startsWith("#") && !t.startsWith("*");
  });
  const code = codeLines.join("\n");
  if (!mentionsBridgeEntry(rel, code)) return false;
  if (rel.endsWith(".sh")) {
    // Dòng lệnh `node ... src/index.js` (kể cả có env prefix VAR=... trước node).
    return codeLines.some((line) =>
      /(^|[\s(])([A-Z_0-9]+=\S+\s+)*node\s+\S*src\/index\.js/.test(line));
  }
  return code.includes("spawn(") || code.includes("spawnSync(");
}

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(path.join(dir, ent.name), out);
    } else if (ent.isFile() && SCAN_EXTS.has(path.extname(ent.name))) {
      out.push(path.join(dir, ent.name));
    }
  }
  return out;
}

console.log("== [1] Inventory: mọi file spawn bridge phải set persist riêng ==");
for (const rel of INVENTORY) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    ok(false, `inventory còn tồn tại: ${rel}`, "file không còn trên đĩa — cập nhật inventory");
    continue;
  }
  const src = fs.readFileSync(abs, "utf8");
  ok(hasPersistInCode(src), `inventory set persist riêng: ${rel}`,
    "thiếu BRIDGE_RATE_PERSIST_PATH trong code");
  if (rel !== SELF) {
    ok(spawnsBridge(rel, src), `inventory thật sự spawn bridge: ${rel}`,
      "không còn spawn bridge — bỏ khỏi inventory hoặc kiểm tra lại");
  }
}

console.log("== [1b] Via ServiceManager: spawn bridge thật qua manager (đã cách ly tập trung) ==");
const managerSrc = fs.readFileSync(path.join(ROOT, "apps/desktop/src/services/serviceManager.js"), "utf8");
ok(hasPersistInCode(managerSrc), "serviceManager.js set BRIDGE_RATE_PERSIST_PATH (điểm cách ly tập trung)");
for (const rel of VIA_MANAGER) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    ok(false, `via-manager còn tồn tại: ${rel}`, "file không còn trên đĩa — cập nhật danh sách");
    continue;
  }
  const src = fs.readFileSync(abs, "utf8");
  ok(src.includes("createServiceManager") || src.includes("ServiceManager"),
    `via-manager đi qua ServiceManager: ${rel}`, "không thấy ServiceManager — kiểm tra lại cách spawn");
  ok(!/spawn\(\s*["'`]node["'`]\s*,\s*\[[^\]]*BRIDGE_ENTRY/.test(src),
    `via-manager không spawn bridge trực tiếp: ${rel}`, "spawn trực tiếp bridge entry — chuyển sang inventory");
}

console.log("== [2] Discovery: quét repo tìm site spawn bridge chưa đăng ký ==");
const candidates = [];
for (const root of ["server", "apps", "scripts", "cli", "mcp-server", "packages"]) {
  const base = path.join(ROOT, root);
  if (!fs.existsSync(base)) continue;
  for (const abs of walk(base, [])) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    if (rel === SELF) continue; // file này chứa pattern dưới dạng string literal
    const src = fs.readFileSync(abs, "utf8");
    if (spawnsBridge(rel, src)) candidates.push(rel);
  }
}
const inventorySet = new Set(INVENTORY);
const knownSet = new Set([...INVENTORY, ...VIA_MANAGER, ...ALLOWLIST, ...HEURISTIC_FALSE_POSITIVES]);
const unknown = candidates.filter((r) => !knownSet.has(r));
ok(unknown.length === 0,
  `không có site spawn bridge mới ngoài inventory/allowlist (quét thấy ${candidates.length} site)`,
  unknown.length ? unknown.join(", ") : undefined);
for (const rel of candidates) {
  if (inventorySet.has(rel) || ALLOWLIST.has(rel)) {
    console.log(`   (đã biết) ${rel}${ALLOWLIST.has(rel) ? " [allowlist: dùng persist mặc định có chủ ý]" : ""}`);
  } else if (VIA_MANAGER.includes(rel)) {
    console.log(`   (đã biết) ${rel} [via ServiceManager]`);
  } else if (HEURISTIC_FALSE_POSITIVES.has(rel)) {
    console.log(`   (đã biết) ${rel} [heuristic false positive: không spawn bridge thật]`);
  }
}

console.log(`\n== KẾT QUẢ: ${pass} pass, ${fail} fail (inventory ${INVENTORY.length} file + via-manager ${VIA_MANAGER.length}, quét thấy ${candidates.length} site spawn bridge) ==`);
process.exit(fail === 0 ? 0 : 1);
