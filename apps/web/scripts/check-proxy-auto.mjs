#!/usr/bin/env node
/**
 * check-proxy-auto.mjs — Kiểm chứng end-to-end proxy tự động (Phase 9 R3).
 *
 * Khởi động bridge + vite + Chromium headless, nạp 1 video 1080p qua input
 * file của MediaBin (DOM.setFileInputFiles), rồi chờ trạng thái proxy tự
 * động chuyển sang "✓ PROXY 720p". Kiểm chứng cả: checkbox tự động mặc
 * định BẬT, và preview dùng proxy (item có proxyUrl qua bridge).
 *
 * Dùng: node apps/web/scripts/check-proxy-auto.mjs [--video /tmp/x.mp4]
 * Cần: bridge (node server/bridge/src/index.js) + vite + Chromium cache.
 * Kết quả in ra stdout, exit 0 khi thấy PROXY 720p, ngược lại exit 1.
 * Đây là script kiểm chứng, không phải tính năng — xem R3_LIMITS.md.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { snapshotBundleFromDist } from "./cdp-bundle.mjs";
import { distManifest, verifyDistManifest } from "./cdp-dist-freeze.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const VIDEO = arg("--video", "/tmp/r3-auto-proxy-test.mp4");
const CHROME = process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
// Đợt 32 O2 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs): module
// snapshot không phụ thuộc transport, chỉ cần tiến trình Chrome do chính
// script này spawn; thư mục bền ngoài repo, ngoài /tmp.
// Đợt 35 R5 — snapshotDist riêng cho harness WS: script chạy trên vite
// dev (không có dist) nên mặc định vẫn bundle null → "not-captured";
// khi chạy đối chứng trên một dist cụ thể thì đặt CHECK_PROXY_DIST_DIR
// trỏ thư mục dist đó, HANG_BUNDLE sẽ ghi bundle thật + dist path.
// Fetch /json mỗi lần có AbortSignal 5000ms (CDP_JSON_ATTEMPT_TIMEOUT_MS);
// ready() chờ mở socket có timeout 30000ms (CDP_WS_OPEN_TIMEOUT_MS).
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "check-proxy-auto");
const CDP_JSON_ATTEMPT_TIMEOUT_MS = Number(process.env.CDP_JSON_ATTEMPT_TIMEOUT_MS || 5000);
const CDP_WS_OPEN_TIMEOUT_MS = Number(process.env.CDP_WS_OPEN_TIMEOUT_MS || 30000);
const HANG_BUNDLE = snapshotBundleFromDist(process.env.CHECK_PROXY_DIST_DIR || null);
// Phase 9 đợt 37 T4 — đóng băng dist cho check-proxy (nợ §3.6 đợt 36).
// LÝ DO trước đây chưa nối được: script này TỰ SPAWN vite dev trên
// 5173, không serve dist nào — đặt CHECK_PROXY_DIST_DIR khi đó chỉ
// cho bundle "trên đĩa", không phải bundle đang đo, nên nối manifest
// trước/sau vào verdict sẽ là claim sai. ĐIỀU KIỆN NỐI (nay đã cài):
// chỉ khi operator bật chế độ preview (--preview-dist hoặc
// CHECK_PROXY_PREVIEW_DIST=1) thì script spawn `vite preview` (serve
// apps/web/dist) thay vì vite dev, VÀ CHECK_PROXY_DIST_DIR phải
// resolve đúng apps/web/dist — lệch thì từ chối chạy exit 2. Khi đó
// manifest trước/sau được đối chiếu lúc kết thúc: lệch → verdict bị
// loại, exit 3 (như bench). Không bật preview → hành vi cũ giữ
// nguyên, frozenDist UNVERIFIED, không claim cùng dist.
const CHECK_PROXY_PREVIEW_DIST = process.argv.includes("--preview-dist") || process.env.CHECK_PROXY_PREVIEW_DIST === "1";
const CHECK_PROXY_DIST_DIR = process.env.CHECK_PROXY_DIST_DIR || "";
const APP_DIST_DIR = path.join(ROOT, "apps/web/dist");
let FROZEN_START = null;
if (CHECK_PROXY_PREVIEW_DIST) {
  if (!CHECK_PROXY_DIST_DIR || path.resolve(CHECK_PROXY_DIST_DIR) !== APP_DIST_DIR) {
    console.error(`[check] --preview-dist yêu cầu CHECK_PROXY_DIST_DIR resolve đúng apps/web/dist (vite preview chỉ serve outDir của config): ${APP_DIST_DIR}`);
    process.exit(2);
  }
  if (!fs.existsSync(path.join(APP_DIST_DIR, "index.html"))) {
    console.error(`[check] --preview-dist nhưng dist thiếu index.html: ${APP_DIST_DIR}`);
    process.exit(2);
  }
  FROZEN_START = distManifest(APP_DIST_DIR);
  console.log(`[check] dist đóng băng (preview): ${APP_DIST_DIR} bundle=${HANG_BUNDLE ? `${HANG_BUNDLE.bundle} sha=${HANG_BUNDLE.sha}` : "không xác định"} files=${FROZEN_START.fileCount} manifest=${FROZEN_START.manifestSha256}`);
} else if (CHECK_PROXY_DIST_DIR) {
  console.log("[check] frozenDist UNVERIFIED: đang chạy vite dev (không serve dist) nên CHECK_PROXY_DIST_DIR chỉ là dist trên đĩa, không đóng băng verdict — muốn đóng băng thì bật --preview-dist.");
}

// Đối chiếu đóng băng lúc kết thúc; trả true khi INVALID (verdict bị loại).
function finishFrozenDist() {
  if (!FROZEN_START) return false;
  const checked = verifyDistManifest(APP_DIST_DIR, FROZEN_START);
  console.log(JSON.stringify({ frozenDist: { validity: checked.valid ? "VALID" : "INVALID", valid: checked.valid, problems: checked.problems, distDir: APP_DIST_DIR, manifestBefore: FROZEN_START.manifestSha256, manifestAfter: checked.manifest.manifestSha256, fileCountBefore: FROZEN_START.fileCount, fileCountAfter: checked.manifest.fileCount, servesDistAssumption: "Manifest này là dist đang đo vì script spawn vite preview serve đúng distDir này." } }));
  return !checked.valid;
}

async function waitOk(url, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try { const r = await fetch(url); if (r.status) return true; } catch { /* chưa lên */ }
    await sleep(1000);
  }
  return false;
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    // Đợt 32 O2: tiến trình Chrome do main() spawn, gán sau khi spawn
    // (cdp.proc = chrome) để timeout handler chụp được snapshot proc/ps.
    this.proc = null;
    this.ws.addEventListener("message", (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  ready() {
    // R5: trước đây chờ open vô hạn (chỉ có error listener); nay có
    // timeout CDP_WS_OPEN_TIMEOUT_MS, reject lỗi rõ ràng thay vì treo.
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("ws open timeout " + CDP_WS_OPEN_TIMEOUT_MS + "ms")), CDP_WS_OPEN_TIMEOUT_MS);
      this.ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
      this.ws.addEventListener("error", (e) => { clearTimeout(t); reject(e); }, { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE, extra: { transport: "websocket", ...(HANG_BUNDLE ? { distDir: HANG_BUNDLE.dist } : {}) },
          });
          if (hangSnap.file) console.log(`[check] CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else console.log(`[check] CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { console.log(`[check] CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", { expression, returnByValue: true });
    if (res.exceptionDetails) throw new Error(`evaluate failed: ${JSON.stringify(res.exceptionDetails)}`);
    return res.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

async function main() {
  if (!fs.existsSync(VIDEO)) { console.error(`Thiếu video test: ${VIDEO}`); process.exit(2); }
  if (!fs.existsSync(CHROME)) { console.error(`Thiếu Chromium: ${CHROME}`); process.exit(2); }
  const bridge = spawn("node", ["src/index.js"], { cwd: path.join(ROOT, "server/bridge"), stdio: "ignore", env: { ...process.env, BRIDGE_PORT: "8787" } });
  const viteBin = path.join(ROOT, "node_modules/.bin/vite");
  // Đợt 37 T4: preview-dist → serve dist đóng băng thay vì vite dev.
  const viteArgs = CHECK_PROXY_PREVIEW_DIST
    ? ["preview", "--port", "5173", "--strictPort", "--host", "127.0.0.1"]
    : ["--port", "5173", "--strictPort", "--host", "127.0.0.1"];
  const vite = spawn(viteBin, viteArgs, { cwd: path.join(ROOT, "apps/web"), stdio: "ignore" });
  let chrome = null;
  try {
    if (!(await waitOk("http://127.0.0.1:8787/", 30000))) throw new Error("Bridge không lên trong 30s.");
    if (!(await waitOk("http://127.0.0.1:5173/", 30000))) throw new Error("Vite không lên trong 30s.");
    const dbgPort = 19000 + (process.pid % 1000);
    const userData = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-proxy-"));
    chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
      "--autoplay-policy=no-user-gesture-required", "--window-size=1440,900",
      `--remote-debugging-port=${dbgPort}`, `--user-data-dir=${userData}`], { stdio: "ignore" });
    let targets = [];
    for (let i = 0; i < 30 && targets.length === 0; i++) {
      await sleep(1000);
      try { const ctrl = new AbortController(); const at = setTimeout(() => ctrl.abort(), CDP_JSON_ATTEMPT_TIMEOUT_MS); try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`, { signal: ctrl.signal })).json(); } finally { clearTimeout(at); } } catch { /* chưa lên */ }
    }
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("Không lấy được target page.");
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    cdp.proc = chrome;
    await cdp.ready();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash')`);
    }
    if (!ready) throw new Error("Editor chưa sẵn sàng sau 90s.");
    const toggleChecked = await cdp.evaluate(
      `[...document.querySelectorAll('label')].find(l => l.textContent.includes('Tự tạo proxy'))?.querySelector('input')?.checked ?? null`);
    console.log(`[check] checkbox tự tạo proxy mặc định: ${toggleChecked}`);
    const doc = await cdp.send("DOM.getDocument", { depth: 0 });
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type='file']" });
    if (!q.nodeId) throw new Error("Không tìm thấy input file của MediaBin.");
    await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [VIDEO] });
    console.log(`[check] đã nạp ${VIDEO}, chờ proxy tự động...`);
    let verdict = null;
    for (let i = 0; i < 60 && !verdict; i++) {
      await sleep(2000);
      const text = await cdp.evaluate(`document.body.innerText || ''`);
      if (text.includes("✓ PROXY 720p")) verdict = "PROXY 720p OK";
      else if (text.includes("Proxy lỗi")) verdict = "PROXY LỖI";
      else if (text.includes("Không cần proxy")) verdict = "SKIPPED (video đã đủ nhỏ)";
      if (i % 10 === 9) console.log(`[check] ...đang chờ (${(i + 1) * 2}s), thấy "Đang tạo": ${text.includes("Đang tạo")}`);
    }
    cdp.close();
    console.log(`[check] kết quả: ${verdict ?? "HẾT 120s VẪN CHƯA THẤY PROXY"}`);
    // Đợt 37 T4: INVALID → verdict bị loại, exit 3 lấn kết quả thường.
    const frozenInvalid = finishFrozenDist();
    if (frozenInvalid) console.log("[check] FROZEN INVALID: dist đổi giữa chừng — verdict bị loại, exit 3");
    process.exitCode = frozenInvalid ? 3 : (verdict === "PROXY 720p OK" ? 0 : 1);
  } catch (e) {
    console.error(`[check] LỖI: ${e instanceof Error ? e.message : e}`);
    const frozenInvalidOnError = finishFrozenDist();
    if (frozenInvalidOnError) console.log("[check] FROZEN INVALID: dist đổi giữa chừng — exit 3");
    process.exitCode = frozenInvalidOnError ? 3 : 1;
  } finally {
    try { chrome?.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
    try { bridge?.kill("SIGTERM"); } catch { /* noop */ }
  }
}

main();
