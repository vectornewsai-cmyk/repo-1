#!/usr/bin/env node
/**
 * probe-raf-control.mjs — Đối chứng rAF (Phase 9 đợt 52 I9).
 *
 * Đếm requestAnimationFrame trong 6s trên trang TRỐNG (data: URL, không
 * video/canvas/app) với cùng binary + cờ Chrome như bench-preview-fps.
 * - Nếu trang trống ~60fps mà VCut ~1.5fps → app/page làm nghẽn rAF.
 * - Nếu trang trống cũng ~1.5fps → nhịp rAF của headless Chromium trên VM
 *   này bị bóp ở tầng compositor/môi trường, không phải lỗi app.
 *
 * Dùng: node apps/web/scripts/probe-raf-control.mjs [--headed]
 *   (headed: chạy dưới xvfb-run như bench).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const HEADED = process.argv.includes("--headed");
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

async function main() {
  if (!fs.existsSync(CHROME)) { console.error(`Không tìm thấy Chromium tại ${CHROME}`); process.exit(2); }
  const dbgPort = 19000 + (process.pid % 1000);
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-raf-ctrl-"));
  const chrome = spawn(CHROME, [
    ...(HEADED ? [] : ["--headless=new"]),
    "--no-sandbox", "--disable-dev-shm-usage",
    "--mute-audio", "--autoplay-policy=no-user-gesture-required",
    ...(HEADED ? ["--disable-gpu-compositing", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-position=0,0"] : []),
    "--window-size=1440,900", `--remote-debugging-port=${dbgPort}`,
    ...(HEADED ? ["--remote-debugging-address=127.0.0.1"] : []),
    `--user-data-dir=${userData}`,
  ], { stdio: "ignore" });
  try {
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
    const blank = "data:text/html,<html><body style='background:#222'><canvas id=c width=800 height=450></canvas><script>const x=document.getElementById('c').getContext('2d');setInterval(()=>{x.fillStyle='#'+Math.floor(Math.random()*16777215).toString(16);x.fillRect(0,0,800,450);},16);</script></body></html>";
    await cdp.send("Page.navigate", { url: blank });
    await sleep(2000);
    const vis = await cdp.evaluate(`document.visibilityState`);
    const ts = await cdp.evaluate(
      `new Promise((resolve) => { const ts = []; const start = performance.now(); (function loop(){ ts.push(performance.now()); if (performance.now() - start < 6000) requestAnimationFrame(loop); else resolve(ts); })(); })`,
      true, 70000,
    );
    const intervals = [];
    for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const pct = (p) => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].toFixed(1)) : null;
    console.log(JSON.stringify({
      headed: HEADED, visibilityState: vis, frames: ts.length,
      fpsAvg: Number((((ts.length - 1) * 1000) / (ts[ts.length - 1] - ts[0])).toFixed(2)),
      frameTimeMs: { p50: pct(0.5), p95: pct(0.95) },
      maxIntervalMs: Number(Math.max(...intervals).toFixed(1)),
    }, null, 2));
    cdp.close();
  } finally {
    try { chrome.kill("SIGTERM"); } catch { /* noop */ }
  }
}
main().catch((e) => { console.error(`[probe] LỖI: ${e.message}`); process.exit(1); });
