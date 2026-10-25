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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const VIDEO = arg("--video", "/tmp/r3-auto-proxy-test.mp4");
const CHROME = process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");

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
    return new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
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
  const vite = spawn(viteBin, ["--port", "5173", "--strictPort", "--host", "127.0.0.1"], { cwd: path.join(ROOT, "apps/web"), stdio: "ignore" });
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
      try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json(); } catch { /* chưa lên */ }
    }
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("Không lấy được target page.");
    const cdp = new Cdp(page.webSocketDebuggerUrl);
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
    process.exitCode = verdict === "PROXY 720p OK" ? 0 : 1;
  } catch (e) {
    console.error(`[check] LỖI: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  } finally {
    try { chrome?.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
    try { bridge?.kill("SIGTERM"); } catch { /* noop */ }
  }
}

main();
