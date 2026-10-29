#!/usr/bin/env node
/**
 * measure-v21-idle-diag-pipe.mjs — Chẩn đoán riêng cho luồng T5 đợt 21
 * (không phải benchmark): vì sao vòng preview KHÔNG ngủ ở idle ban đầu
 * (ticks ~57-60/s, draws = 0) nhưng ngủ hoàn hảo sau phát→dừng?
 *
 * Làm: mở app, chờ sample, rồi lấy mẫu mỗi 5 s trong 60 s idle (không
 * chạm gì): pTicks/pSleep/draws/time/px. Sau đó: phím Home (setPlayhead 0,
 * cùng playhead) → xem loop có vẽ + ngủ lại không; rồi đổi chiều rộng
 * wrap qua runtime DOM (kiểm chứng vá resize T5: canvas resize phải vẽ
 * lại rồi ngủ lại) → khôi phục.
 * Chạy từ gốc repo:
 *   node apps/web/scripts/measure-v21-idle-diag-pipe.mjs
 * Env: V21_PREVIEW_PORT (mặc định 4185), V21_XVFB_DISPLAYS (:94,:93).
 * Exit 0 khi chạy xong (kể cả khi kết quả là "không ngủ" — đó chính là
 * phát hiện cần báo cáo, không phải lỗi script). Exit 2 khi không mở
 * được app. KHÔNG sửa code sản phẩm, KHÔNG push.
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
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; } };

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
        const msg = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!msg.trim()) continue;
        let obj;
        try { obj = JSON.parse(msg); } catch { continue; }
        if (obj.method === "Target.attachedToTarget" && obj.params && obj.params.sessionId) {
          this.sessionId = obj.params.sessionId;
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
  const wrap = document.getElementById('vcut-preview-wrap');
  return { canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    wrapW: wrap ? wrap.clientWidth : null,
    projectName: nameInput ? nameInput.value : null, time: timeMatch, px: pxHash,
    draws: window.__v19st ? window.__v19st.id / 2 : null,
    pTicks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    pSleep: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.sleeping : null,
    dbg: window.__vcutPreviewIdle ? { lastDrawn: window.__vcutPreviewIdle.lastDrawn,
      lastRequested: window.__vcutPreviewIdle.lastRequested,
      pendingSeek: window.__vcutPreviewIdle.pendingSeek,
      redrawFlag: window.__vcutPreviewIdle.redrawFlag } : null,
    mTicks: window.__vcutMixerMeter ? window.__vcutMixerMeter.ticks : null,
    mSleep: window.__vcutMixerMeter ? window.__vcutMixerMeter.sleeping : null };
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
    log(`Xvfb=${display} loadavg=${loadavg()}`);
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v21diag-"));
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
      log(`sample sẵn sàng: canvas=${ready.canvasW}x${ready.canvasH} time=${ready.time} loadavg=${loadavg()}`);
      const probe = await cdp.evaluate(PROBE_JS);
      if (!probe.ok) throw new Error("cài probe thất bại");
      // 60 s idle, mẫu mỗi 5 s.
      let prev = null;
      for (let i = 1; i <= 12; i++) {
        await sleep(5000);
        const s = await cdp.evaluate(STATE_JS);
        const dt = prev ? `dTicks=${s.pTicks - prev.pTicks} dDraws=${s.draws - prev.draws}` : "";
        log(`IDLE t+${i * 5}s: time=${s.time} px=${s.px} draws=${s.draws} pTicks=${s.pTicks} pSleep=${s.pSleep} mTicks=${s.mTicks} mSleep=${s.mSleep} dbg=${JSON.stringify(s.dbg)} ${dt}`);
        prev = s;
      }
      // Phím Home (setPlayhead 0 — cùng playhead): loop có vẽ + ngủ lại không?
      const h0 = await cdp.evaluate(STATE_JS);
      await cdp.pressKey("Home", "Home", 36);
      await sleep(3000);
      const h1 = await cdp.evaluate(STATE_JS);
      log(`HOME cùng-playhead: trước draws=${h0.draws} pTicks=${h0.pTicks} pSleep=${h0.pSleep} px=${h0.px} dbg=${JSON.stringify(h0.dbg)} -> sau draws=${h1.draws} pTicks=${h1.pTicks} pSleep=${h1.pSleep} px=${h1.px} time=${h1.time} dbg=${JSON.stringify(h1.dbg)}`);
      // Đổi chiều rộng wrap qua runtime DOM (kiểm chứng vá resize T5).
      const w0 = await cdp.evaluate(STATE_JS);
      await cdp.evaluate(`(() => { const w = document.getElementById('vcut-preview-wrap'); if (w) w.style.width = '800px'; return !!w; })()`);
      await sleep(3000);
      const w1 = await cdp.evaluate(STATE_JS);
      log(`RESIZE wrap->800px: trước canvas=${w0.canvasW}x${w0.canvasH} draws=${w0.draws} pTicks=${w0.pTicks} pSleep=${w0.pSleep} px=${w0.px} dbg=${JSON.stringify(w0.dbg)} -> sau canvas=${w1.canvasW}x${w1.canvasH} draws=${w1.draws} pTicks=${w1.pTicks} pSleep=${w1.pSleep} px=${w1.px} dbg=${JSON.stringify(w1.dbg)}`);
      await cdp.evaluate(`(() => { const w = document.getElementById('vcut-preview-wrap'); if (w) w.style.width = ''; return true; })()`);
      await sleep(3000);
      const w2 = await cdp.evaluate(STATE_JS);
      log(`RESIZE khôi-phục: canvas=${w2.canvasW}x${w2.canvasH} draws=${w2.draws} pTicks=${w2.pTicks} pSleep=${w2.pSleep} px=${w2.px}`);
      log(`DIAG xong loadavg=${loadavg()}`);
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
