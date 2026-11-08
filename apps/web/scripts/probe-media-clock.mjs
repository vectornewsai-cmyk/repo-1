#!/usr/bin/env node
/**
 * probe-media-clock.mjs — Chẩn đoán đồng hồ media khi phát (Phase 9 đợt 52 I9).
 *
 * Trong lúc phát project mẫu, lấy mẫu mỗi 500ms trong 8s:
 * - playhead (time-display) và currentTime/paused/seeking/readyState của
 *   mọi <video> trên trang,
 * - số rAF trong cùng cửa sổ (đếm song song),
 * - longtask (PerformanceObserver buffered, cài trước khi bấm Phát).
 *
 * Phân biệt 3 giả thuyết:
 * (a) video.currentTime chạy realtime mà playhead bò → vòng preview/rAF lỗi.
 * (b) video.currentTime cũng bò → pipeline media (decode/seek) nghẽn.
 * (c) longtask nhiều + tổng ms lớn → main thread bận vẽ (khác với 0 longtask
 *     đo bằng getEntriesByType trước đây — cách đó có thể bỏ sót vì không có
 *     observer đăng ký).
 *
 * Dùng: node apps/web/scripts/probe-media-clock.mjs [--seed-autosave F]
 *        [--profile DIR] [--serve] [--url URL]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PAGE_URL = arg("--url", "http://127.0.0.1:5173");
const SERVE = process.argv.includes("--serve");
const PROFILE = arg("--profile", "");
const SEED_AUTOSAVE = arg("--seed-autosave", "");
const CHROME = arg("--chrome", "") || process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  async evaluate(expression, awaitPromise = false, timeoutMs = 30000) {
    const res = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise }, timeoutMs);
    if (res.exceptionDetails) throw new Error(`evaluate failed: ${JSON.stringify(res.exceptionDetails)}`);
    return res.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

async function waitUrlOk(url, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try { const res = await fetch(url); if (res.ok) return true; } catch { /* chưa lên */ }
    await sleep(1000);
  }
  return false;
}

async function main() {
  const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
  let vite = null;
  if (SERVE) {
    const port = new URL(PAGE_URL).port || "5173";
    const viteBin = path.join(ROOT, "node_modules/.bin/vite");
    vite = spawn(viteBin, ["--port", port, "--strictPort", "--host", "127.0.0.1"], { cwd: path.join(ROOT, "apps/web"), stdio: "ignore" });
  }
  const dbgPort = 19000 + (process.pid % 1000);
  const userData = PROFILE ? path.resolve(PROFILE) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-clock-"));
  if (PROFILE) fs.mkdirSync(userData, { recursive: true });
  const chrome = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
    "--mute-audio", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900", `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${userData}`,
  ], { stdio: "ignore" });
  try {
    if (!(await waitUrlOk(PAGE_URL, SERVE ? 60000 : 5000))) throw new Error(`Không tới được ${PAGE_URL}`);
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
    await cdp.send("Page.navigate", { url: PAGE_URL });
    if (SEED_AUTOSAVE) {
      const seedRaw = fs.readFileSync(path.resolve(SEED_AUTOSAVE), "utf8");
      const seedParsed = JSON.parse(seedRaw);
      await sleep(800);
      await cdp.evaluate(`localStorage.setItem('vcut-studio:autosave:v1', ${JSON.stringify(seedRaw)}); 'seeded'`);
      await cdp.send("Page.navigate", { url: PAGE_URL });
      console.log(`[probe] seed: ${seedParsed.spec.meta?.name}`);
    }
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash')`);
    }
    if (!ready) throw new Error("Editor chưa sẵn sàng sau 90s.");
    // Cài longtask observer TRƯỚC khi bấm Phát (buffered lấy cả quá khứ).
    await cdp.evaluate(`window.__vcutLT = { count: 0, totalMs: 0, maxMs: 0 };
      new PerformanceObserver((list) => { for (const e of list.getEntries()) { window.__vcutLT.count++; window.__vcutLT.totalMs += e.duration; if (e.duration > window.__vcutLT.maxMs) window.__vcutLT.maxMs = e.duration; } }).observe({ type: 'longtask', buffered: true });
      window.__vcutRafN = 0;
      (function loop(){ window.__vcutRafN++; requestAnimationFrame(loop); })();
      'ok'`);
    const sampleExpr = `(() => {
      const t = (document.querySelector('.time-display')||{}).textContent || '';
      const vs = [...document.querySelectorAll('video')].map((v) => ({ ct: Number(v.currentTime.toFixed(2)), paused: v.paused, seeking: v.seeking, rs: v.readyState, dur: Number(v.duration.toFixed(1)) }));
      const idle = window.__vcutPreviewIdle ? { ticks: window.__vcutPreviewIdle.ticks, sleeping: window.__vcutPreviewIdle.sleeping } : null;
      return { t, videos: vs, rafN: window.__vcutRafN || 0, lt: window.__vcutLT || null, idle };
    })()`;
    console.log("[probe] mẫu trước Phát:", JSON.stringify(await cdp.evaluate(sampleExpr)));
    await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
    const t0 = Date.now();
    for (let i = 0; i < 16; i++) {
      await sleep(500);
      const s = await cdp.evaluate(sampleExpr);
      console.log(`[probe] +${((Date.now() - t0) / 1000).toFixed(1)}s playhead=${s.t} rafN=${s.rafN} lt=${JSON.stringify(s.lt)} idle=${JSON.stringify(s.idle)} videos=${JSON.stringify(s.videos)}`);
    }
    cdp.close();
  } finally {
    try { chrome.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
  }
}
main().catch((e) => { console.error(`[probe] LỖI: ${e.message}`); process.exit(1); });
