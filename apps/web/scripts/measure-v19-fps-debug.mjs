#!/usr/bin/env node
/**
 * measure-v19-fps-debug.mjs — Phase 9 đợt 19, luồng G4: chẩn đoán 2
 * điều lạ trong lần đo FPS project thật đầu tiên:
 * (1) probe identity-setTransform luôn = 0 dù pixel canvas đổi;
 * (2) PerfOverlay báo rAF chỉ ~4-8 Hz cả khi đứng yên.
 * Script chẩn đoán (KHÔNG phải số benchmark): liệt kê canvas, wrap
 * setTransform/fillRect/drawImage trên MỌI canvas trong wrap, đếm
 * rAF bằng vòng lặp riêng của trang, kiểm tra visibilityState, rồi
 * phát bằng Space và lấy mẫu 6s. Chạy 1 lần, tự dọn Xvfb/vite/Chrome.
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/measure-v19-fps-debug.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PREVIEW_PORT = 4181;
const DISPLAY = ":96";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg;
        try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
    proc.stdio[4].on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, this.sessionId, 120000);
    if (r.exceptionDetails) throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    return r.result.value;
  }
  async pressSpace() {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code: "Space", key: " ", text: " ", windowsVirtualKeyCode: 32 }, this.sessionId);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code: "Space", key: " ", windowsVirtualKeyCode: 32 }, this.sessionId);
  }
}

const DIAG_JS = `
(() => {
  const wraps = [...document.querySelectorAll('#vcut-preview-wrap')];
  const canvases = [...document.querySelectorAll('canvas')].map((c, i) => ({
    i, w: c.width, h: c.height, cls: c.className,
    inWrap: !!c.closest('#vcut-preview-wrap'),
    rect: (() => { const r = c.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
  }));
  return { wraps: wraps.length, canvases, visibility: document.visibilityState,
    hasFocus: document.hasFocus(), bodyTextLen: document.body.innerText.length };
})()
`;

const INSTALL_JS = `
(() => {
  const out = { installed: [], manualCheck: null };
  const list = [...document.querySelectorAll('#vcut-preview-wrap canvas')];
  list.forEach((canvas, i) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || ctx.__v19dbg) return;
    ctx.__v19dbg = true;
    const st = { setId: 0, setTotal: 0, fill: 0, draw: 0 };
    window.__v19dbg = window.__v19dbg || [];
    window.__v19dbg[i] = st;
    const oSet = ctx.setTransform.bind(ctx);
    ctx.setTransform = function (a, b, c, d, e, f) {
      st.setTotal++;
      // Identity là (1,0,0,1,0,0) — d = 1 (bản đầu viết d === 0 nên
      // setId luôn 0; đã sửa sau khi debug chỉ ra).
      if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) st.setId++;
      return oSet(a, b, c, d, e, f);
    };
    const oFill = ctx.fillRect.bind(ctx);
    ctx.fillRect = function (...a) { st.fill++; return oFill(...a); };
    const oDraw = ctx.drawImage.bind(ctx);
    ctx.drawImage = function (...a) { st.draw++; return oDraw(...a); };
    out.installed.push({ i, w: canvas.width, h: canvas.height });
  });
  // Kiểm chứng cơ chế wrap: gọi tay 1 lần rồi đọc counter.
  if (list.length) {
    const ctx = list[0].getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    out.manualCheck = window.__v19dbg[0];
  }
  // Vòng rAF riêng của trang để đo nhịp rAF thật (không qua PerfOverlay).
  if (!window.__v19raf) {
    window.__v19raf = { n: 0, t0: performance.now() };
    const tick = () => { window.__v19raf.n++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  return out;
})()
`;

const SAMPLE_JS = `
(() => {
  const panel = document.querySelector('[aria-label="Đồng hồ đo FPS preview"]');
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  let pxHash = null;
  try {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(Math.floor(canvas.width / 2) - 16, Math.floor(canvas.height / 2) - 16, 32, 32).data;
      let s = 0;
      for (let k = 0; k < d.length; k += 4) s = (s + d[k] + d[k + 1] * 2 + d[k + 2] * 3) % 1000000007;
      pxHash = s;
    }
  } catch (e) { pxHash = 'tainted'; }
  return { panel: panel ? panel.innerText : null, pxHash,
    dbg: window.__v19dbg || null,
    raf: window.__v19raf ? { n: window.__v19raf.n, ms: Math.round(performance.now() - window.__v19raf.t0) } : null };
})()
`;

async function main() {
  const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
  const preview = spawn(process.execPath, [viteBin, "preview", "--port", String(PREVIEW_PORT), "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" });
  let xvfb = null;
  let chrome = null;
  try {
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try { const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`); if (r.ok) break; } catch {}
    }
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40; i++) {
      if (fs.existsSync(`/tmp/.X11-unix/X${DISPLAY.replace(":", "")}`)) break;
      await sleep(250);
    }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v19dbg-"));
    chrome = spawn(PW_CHROME, ["--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
      "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1080", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => {});
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    const url = `http://127.0.0.1:${PREVIEW_PORT}/`;
    await cdp.send("Page.navigate", { url }, cdp.sessionId);
    const navAt = Date.now();
    let ready = false;
    for (let i = 0; i < 60; i++) {
      await sleep(1000);
      try {
        const st = await cdp.evaluate(`(() => { const n = document.querySelector('.project-name'); return { name: n ? n.value : null, canvas: !!document.querySelector('#vcut-preview-wrap canvas') }; })()`);
        if (st.canvas && st.name === "Dự án mẫu") { ready = true; break; }
      } catch {}
    }
    log(`sample sẵn sàng: ${ready} sau ${Date.now() - navAt}ms`);
    if (!ready) throw new Error("sample không sẵn sàng");
    log(`diag: ${JSON.stringify(await cdp.evaluate(DIAG_JS))}`);
    log(`install: ${JSON.stringify(await cdp.evaluate(INSTALL_JS))}`);
    // Đứng yên 3s.
    await sleep(3000);
    log(`đứng-yên: ${JSON.stringify(await cdp.evaluate(SAMPLE_JS))}`);
    // Mở panel FPS + phát.
    const btnRect = await cdp.evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('FPS'));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (btnRect) {
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: btnRect.x, y: btnRect.y }, cdp.sessionId);
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: btnRect.x, y: btnRect.y, button: "left", clickCount: 1 }, cdp.sessionId);
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: btnRect.x, y: btnRect.y, button: "left", clickCount: 1 }, cdp.sessionId);
      await sleep(1200);
    }
    await cdp.pressSpace();
    await sleep(1500);
    for (let s = 1; s <= 6; s++) {
      await sleep(1000);
      log(`phát s=${s}: ${JSON.stringify(await cdp.evaluate(SAMPLE_JS))}`);
    }
    log("DONE v19-fps-debug");
  } finally {
    try { chrome && chrome.kill("SIGKILL"); } catch {}
    try { xvfb && xvfb.kill("SIGKILL"); } catch {}
    try { preview && preview.kill("SIGKILL"); } catch {}
  }
}

main().catch((e) => { console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`); process.exit(2); });
