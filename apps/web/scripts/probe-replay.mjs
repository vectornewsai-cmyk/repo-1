#!/usr/bin/env node
/**
 * probe-replay.mjs — Đo FPS lần phát THỨ HAI trong cùng phiên (Phase 9 đợt 52 I9).
 *
 * Lần phát đầu có chi phí khởi động lớn (AudioContext ~2s + forceSeek +
 * draw đầu — trace đo được 1 tick 3,9s). Probe này phát lần 1 trong 8s,
 * tạm dừng, phát lại lần 2 rồi đếm rAF 5s — tách FPS ổn định khỏi chi phí
 * khởi động. Nếu lần 2 nhanh hẳn → cần pre-warm; nếu lần 2 vẫn chậm →
 * chi phí nằm ở trạng thái ổn định, không phải khởi động.
 *
 * Dùng: node apps/web/scripts/probe-replay.mjs [--seed-autosave F]
 *        [--profile DIR] [--url URL] [--duration 5]
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
const PROFILE = arg("--profile", "");
const SEED_AUTOSAVE = arg("--seed-autosave", "");
const DURATION = Number(arg("--duration", "5"));
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
  send(method, params = {}, timeoutMs = 60000) {
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
  const dbgPort = 19000 + (process.pid % 1000);
  const userData = PROFILE ? path.resolve(PROFILE) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-replay-"));
  if (PROFILE) fs.mkdirSync(userData, { recursive: true });
  const chrome = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
    "--mute-audio", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900", `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${userData}`,
  ], { stdio: "ignore" });
  try {
    if (!(await waitUrlOk(PAGE_URL, 5000))) throw new Error(`Không tới được ${PAGE_URL}`);
    let targets = [];
    for (let i = 0; i < 45 && targets.length === 0; i++) {
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
      await sleep(800);
      await cdp.evaluate(`localStorage.setItem('vcut-studio:autosave:v1', ${JSON.stringify(seedRaw)}); 'seeded'`);
      await cdp.send("Page.navigate", { url: PAGE_URL });
    }
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash')`);
    }
    if (!ready) throw new Error("Editor chưa sẵn sàng sau 90s.");
    const clickPlay = `document.querySelector('.tbtn.play').click()`;
    const timeExpr = `(document.querySelector('.time-display')||{}).textContent || ''`;
    // Lần 1: phát 8s (qua chi phí khởi động + một đoạn ổn định).
    await cdp.evaluate(clickPlay);
    await sleep(8000);
    const t1 = await cdp.evaluate(timeExpr);
    // Tạm dừng rồi phát lại ngay (AudioContext + media đã ấm).
    await cdp.evaluate(clickPlay);
    await sleep(500);
    const tPaused = await cdp.evaluate(timeExpr);
    await cdp.evaluate(clickPlay);
    await sleep(1000);
    const t2 = await cdp.evaluate(timeExpr);
    const ts = await cdp.evaluate(
      `new Promise((resolve) => { const ts = []; const start = performance.now(); const dur = ${DURATION * 1000}; (function loop(){ ts.push(performance.now()); if (performance.now() - start < dur) requestAnimationFrame(loop); else resolve(ts); })(); })`,
      true, (DURATION + 60) * 1000,
    );
    const t3 = await cdp.evaluate(timeExpr);
    const idle = await cdp.evaluate(`window.__vcutPreviewIdle ? { ticks: window.__vcutPreviewIdle.ticks, sleeping: window.__vcutPreviewIdle.sleeping } : null`);
    cdp.close();
    const intervals = [];
    for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);
    const spanMs = ts[ts.length - 1] - ts[0];
    const sorted = [...intervals].sort((a, b) => a - b);
    const pct = (p) => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].toFixed(1)) : null;
    console.log(JSON.stringify({
      play1End: t1.trim(), pausedAt: tPaused.trim(), play2Start: t2.trim(), play2End: t3.trim(),
      frames2: ts.length, fpsAvg2: Number((((ts.length - 1) * 1000) / spanMs).toFixed(2)),
      frameTimeMs2: { p50: pct(0.5), p95: pct(0.95) }, idle,
    }, null, 2));
  } finally {
    try { chrome.kill("SIGTERM"); } catch { /* noop */ }
  }
}
main().catch((e) => { console.error(`[replay] LỖI: ${e.message}`); process.exit(1); });
