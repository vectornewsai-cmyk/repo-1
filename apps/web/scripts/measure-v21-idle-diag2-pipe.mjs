#!/usr/bin/env node
/**
 * measure-v21-idle-diag2-pipe.mjs — Chẩn đoán tiếp cho T5 đợt 21:
 * (1) gom console/exception của trang trong 20 s idle ban đầu — xem có
 *     lỗi nào ném ra từ đường seek→renderFrame không (giải thích trạng
 *     thái cân bằng lastDrawn=null/lastRequested=0/pendingSeek=false);
 * (2) phát→dừng→ngủ (đối chứng đã biết) rồi phím Home về 0: có vẽ + ngủ
 *     lại không (phân biệt "frame đầu tiên đặc biệt" với "mọi seek về 0
 *     đều kẹt");
 * (3) khi đang ngủ, đổi viewport qua Emulation (wrap resize thật) → xem
 *     canvas có resize + vẽ lại + ngủ lại không (kiểm chứng vá resize T5).
 * Chạy từ gốc repo: node apps/web/scripts/measure-v21-idle-diag2-pipe.mjs
 * Env: V21_PREVIEW_PORT (4185), V21_XVFB_DISPLAYS (:94,:93).
 * Exit 0 khi chạy xong bất kể kết quả đo (phát hiện là kết quả).
 * KHÔNG sửa code sản phẩm, KHÔNG push.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PREVIEW_PORT = Number(process.env.V21_PREVIEW_PORT || 4185);
const DISPLAYS = (process.env.V21_XVFB_DISPLAYS || ":94,:93").split(",").map((s) => s.trim());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    this.events = [];
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const msg = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!msg.trim()) continue;
        let obj;
        try { obj = JSON.parse(msg); } catch { continue; }
        if (obj.method === "Target.attachedToTarget" && obj.params && obj.params.sessionId) {
          this.sessionId = obj.params.sessionId;
        }
        if (obj.method && (obj.method.startsWith("Runtime.") || obj.method.startsWith("Log."))) {
          this.events.push({ method: obj.method, params: obj.params });
        }
        if (obj.id && this.pending.has(obj.id)) {
          const h = this.pending.get(obj.id);
          this.pending.delete(obj.id);
          if (obj.error) h.reject(new Error(`CDP ${obj.error.code}: ${obj.error.message}`));
          else h.resolve(obj.result);
        }
      }
    });
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
  async pressKey(code, key, vk) {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code, key, windowsVirtualKeyCode: vk }, this.sessionId);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code, key, windowsVirtualKeyCode: vk }, this.sessionId);
  }
}

const PROBE_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  if (!canvas) return { ok: false };
  const ctx = canvas.getContext('2d');
  if (window.__v19st) return { ok: true, again: true };
  const orig = ctx.setTransform.bind(ctx);
  const st = { id: 0 };
  window.__v19st = st;
  ctx.setTransform = function (a, b, c, d, e, f) {
    if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) st.id++;
    return orig(a, b, c, d, e, f);
  };
  return { ok: true };
})()
`;

const STATE_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  const nameInput = document.querySelector('.project-name');
  const timeMatch = (document.body.innerText.match(/\\d+:\\d+\\.\\d+ \\/ \\d+:\\d+\\.\\d+/) || [])[0] || null;
  let pxHash = null;
  try {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 64) s = (s + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
      pxHash = s;
    }
  } catch (e) { pxHash = 'tainted'; }
  return { canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    projectName: nameInput ? nameInput.value : null, time: timeMatch, px: pxHash,
    draws: window.__v19st ? window.__v19st.id / 2 : null,
    pTicks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    pSleep: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.sleeping : null,
    dbg: window.__vcutPreviewIdle ? { lastDrawn: window.__vcutPreviewIdle.lastDrawn,
      lastRequested: window.__vcutPreviewIdle.lastRequested,
      pendingSeek: window.__vcutPreviewIdle.pendingSeek,
      redrawFlag: window.__vcutPreviewIdle.redrawFlag } : null };
})()
`;

function startVitePreview() {
  return new Promise((resolve) => {
    const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
    const proc = spawn(process.execPath, [viteBin, "preview", "--port", String(PREVIEW_PORT),
      "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" });
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(proc); } }, 15000);
    (async () => {
      for (let i = 0; i < 30 && !done; i++) {
        await sleep(500);
        try { const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`); if (r.ok) { done = true; clearTimeout(timer); resolve(proc); return; } } catch {}
      }
    })();
    proc.on("exit", () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

function fmtEvents(events) {
  return events.map((e) => {
    if (e.method === "Runtime.exceptionThrown") {
      const d = e.params.exceptionDetails || {};
      const ex = d.exception || {};
      return `EXCEPTION: ${ex.description || ex.value || JSON.stringify(d).slice(0, 300)}`;
    }
    if (e.method === "Runtime.consoleAPICalled") {
      const args = (e.params.args || []).map((a) => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(" ");
      return `CONSOLE.${e.params.type}: ${args.slice(0, 300)}`;
    }
    if (e.method === "Log.entryAdded") {
      const en = e.params.entry || {};
      return `LOG.${en.level}: ${en.text || ""} ${en.url || ""}`.slice(0, 300);
    }
    return e.method;
  });
}

async function main() {
  const preview = await startVitePreview();
  let up = false;
  if (preview) { try { up = (await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`)).ok; } catch {} }
  if (!up) { log("vite preview KHÔNG lên — BLOCKER"); try { preview && preview.kill("SIGKILL"); } catch {} process.exit(2); }
  const previewUrl = `http://127.0.0.1:${PREVIEW_PORT}/`;
  let xvfb = null;
  let display = null;
  try {
    for (const d of DISPLAYS) {
      const num = d.replace(":", "");
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) {
        const anyX = spawnSync("pgrep", ["-x", "Xvfb"]);
        if (anyX.status !== 0) {
          try { fs.unlinkSync(`/tmp/.X11-unix/X${num}`); } catch {}
          try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
        } else continue;
      }
      xvfb = spawn("Xvfb", [d, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
      for (let i = 0; i < 40; i++) { if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) break; await sleep(250); }
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) { display = d; break; }
      try { xvfb.kill("SIGKILL"); } catch {}
      xvfb = null;
    }
    if (!display) throw new Error("không khởi động được Xvfb");
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v21diag2-"));
    const chrome = spawn(PW_CHROME, [
      "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
      "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1080", "about:blank",
    ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
    chrome.stderr.on("data", () => {});
    try {
      const cdp = new PipeCdp(chrome);
      await cdp.send("Target.getTargets", {}, undefined, 30000);
      const target = await cdp.send("Target.createTarget", { url: "about:blank" });
      await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
      for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
      await cdp.send("Page.enable", {}, cdp.sessionId);
      await cdp.send("Runtime.enable", {}, cdp.sessionId);
      try { await cdp.send("Log.enable", {}, cdp.sessionId); } catch (e) { log(`Log.enable lỗi (bỏ qua): ${e.message}`); }
      await cdp.send("Page.navigate", { url: previewUrl }, cdp.sessionId);
      let href = "";
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        try { href = await cdp.evaluate("location.href"); } catch {}
        if (href.startsWith(previewUrl)) break;
        if (href.startsWith("chrome-error")) break;
      }
      if (!href.startsWith(previewUrl)) throw new Error(`navigate thất bại href=${href}`);
      let ready = null;
      for (let i = 0; i < 90; i++) {
        await sleep(1000);
        try {
          const st = await cdp.evaluate(STATE_JS);
          if (st.canvasW && st.projectName === "Dự án mẫu") { ready = st; break; }
        } catch {}
      }
      if (!ready) throw new Error("quá 90s chưa thấy sample");
      log(`sample sẵn sàng: canvas=${ready.canvasW}x${ready.canvasH} time=${ready.time}`);
      await cdp.evaluate(PROBE_JS);
      // 20 s idle, gom event console/exception.
      cdp.events.length = 0;
      await sleep(20000);
      const idle = await cdp.evaluate(STATE_JS);
      log(`IDLE 20s: draws=${idle.draws} pTicks=${idle.pTicks} pSleep=${idle.pSleep} dbg=${JSON.stringify(idle.dbg)} px=${idle.px}`);
      const evs = fmtEvents(cdp.events);
      log(`EVENTS trong 20s idle (${evs.length}):`);
      for (const e of evs.slice(0, 40)) log(`  ${e}`);
      if (evs.length > 40) log(`  ... và ${evs.length - 40} event nữa`);
      // Phát→dừng để ngủ, rồi Home về 0.
      await cdp.pressSpace();
      await sleep(2000);
      await cdp.pressSpace();
      await sleep(2500);
      const paused = await cdp.evaluate(STATE_JS);
      log(`SAU phát→dừng: time=${paused.time} draws=${paused.draws} pTicks=${paused.pTicks} pSleep=${paused.pSleep} dbg=${JSON.stringify(paused.dbg)} px=${paused.px}`);
      cdp.events.length = 0;
      await cdp.pressKey("Home", "Home", 36);
      await sleep(3000);
      const home = await cdp.evaluate(STATE_JS);
      log(`SAU Home: time=${home.time} draws=${home.draws} pTicks=${home.pTicks} pSleep=${home.pSleep} dbg=${JSON.stringify(home.dbg)} px=${home.px}`);
      log(`EVENTS sau Home (${cdp.events.length}):`);
      for (const e of fmtEvents(cdp.events).slice(0, 20)) log(`  ${e}`);
      // Resize thật qua viewport metrics khi đang ngủ.
      const r0 = await cdp.evaluate(STATE_JS);
      try {
        await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false }, cdp.sessionId);
        await sleep(3000);
        const r1 = await cdp.evaluate(STATE_JS);
        log(`RESIZE viewport 1280x720: trước canvas=${r0.canvasW}x${r0.canvasH} draws=${r0.draws} pTicks=${r0.pTicks} pSleep=${r0.pSleep} px=${r0.px} -> sau canvas=${r1.canvasW}x${r1.canvasH} draws=${r1.draws} pTicks=${r1.pTicks} pSleep=${r1.pSleep} px=${r1.px} dbg=${JSON.stringify(r1.dbg)}`);
        await cdp.send("Emulation.clearDeviceMetricsOverride", {}, cdp.sessionId);
        await sleep(3000);
        const r2 = await cdp.evaluate(STATE_JS);
        log(`RESIZE khôi phục 1920x1080: canvas=${r2.canvasW}x${r2.canvasH} draws=${r2.draws} pTicks=${r2.pTicks} pSleep=${r2.pSleep} px=${r2.px}`);
      } catch (e) { log(`RESIZE qua Emulation lỗi: ${e.message}`); }
      log("DIAG2 xong");
    } finally {
      try { chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  } finally {
    try { xvfb && xvfb.kill("SIGKILL"); } catch {}
    try { preview && preview.kill("SIGKILL"); } catch {}
  }
  process.exit(0);
}

main().catch((e) => { console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`); process.exit(2); });
