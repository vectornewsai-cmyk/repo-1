#!/usr/bin/env node
/**
 * measure-65r8-perf-overlay.mjs — Phase 9 đợt 65, luồng S8: kiểm chứng
 * headed dòng presented trong FPS meter (PerfOverlay) sau khi nối
 * lib/perfPresented65R8.ts + fragment round65-s8.
 *
 * Kiểm tra thật trên app (không chỉ unit test):
 * 1. Mở panel FPS (nút "📈 FPS") → dòng "Frame trình chiếu (element):"
 *    xuất hiện, lúc đứng yên hiện "…" (không có clip đang phát).
 * 2. Phát project mẫu 6 s → dòng hiện SỐ (vd 28.5), tức sampling qua
 *    __vcutMediaEls + getVideoPlaybackQuality chạy thật trong UI.
 * 3. Dừng phát, chờ 2,5 s → dòng về lại "…" (không còn element phát).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/measure-65r8-perf-overlay.mjs
 * Env: R8_SCRATCH (mặc định hidden_files/round65-r8/overlay).
 * Exit 0 khi cả 3 check pass, 1 khi có check fail, 2 khi harness lỗi.
 * KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round65-r8", "overlay");
const VITE_CFG = "/tmp/round65-r8/vite.r8-presented.config.mjs";
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = findChrome() || (() => { throw new Error("không thấy chrome trong ~/.cache/ms-playwright"); })();
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method: "Page.handleJavaScriptDialog", params: { accept: true } }));
        return;
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params?.exceptionDetails || {};
        this.exceptions.push(d.exception?.description || d.text || JSON.stringify(d).slice(0, 500));
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 60s: ${method}`)); }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x: Math.round(x), y: Math.round(y), ...extra });
  }
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code) {
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyUp" });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const INJECT_ERRORS = `(() => {
  window.__r3errors = [];
  window.addEventListener("error", (e) => { try { window.__r3errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r3errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r3errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r3errors.push("unhandledrejection: <?>"); } });
})()`;

const OVERLAY_TEXT_FN = `(() => {
  const p = document.querySelector('[role="status"][aria-label]');
  if (!p) return null;
  return p.innerText;
})()`;

const FPS_BTN_FN = `(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("FPS"));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
})()`;

const PLAYING_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r3storeMod || (window.__r3storeMod = await import(hit));
  return mod.useStore.getState().playing;
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);
  try {
    const DEV_PORT = await pickFreePort(5550, 5559);
    const DEBUG_PORT = await pickFreePort(9650, 9659);
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 180; n <= 189; n++) {
        const d = `:${n}`;
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock}`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = await pickDisplay();
    if (!DISPLAY) throw new Error("hết display trống :180–:189");
    if (!DEV_PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
    if (!fs.existsSync(VITE_CFG)) throw new Error(`không thấy vite config ${VITE_CFG} (chạy measure-65r8-presented-fps.mjs trước để tạo)`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round65-r8/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, loadavg ${loadAvg()}`);
    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-overlay-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    {
      const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) {
        if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
        else await sleep(500);
      }
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s`);
    }
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-overlay-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error("không lấy được page target CDP");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount", 240000);
    log("app đã mount");
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) break;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    // Chờ project mẫu load (store có clip) rồi mở panel FPS.
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(`(async () => {
        const entries = performance.getEntriesByType("resource").map((e) => e.name);
        const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
        const mod = window.__r3storeMod || (window.__r3storeMod = await import(hit));
        const st = mod.useStore.getState();
        return st.spec.tracks.flatMap((t) => t.clips).length >= 3 ? true : null;
      })()`).catch(() => null);
      return s;
    }, "project mẫu load (≥3 clip)", 180000);
    const btn = await cdp.evalJs(FPS_BTN_FN);
    if (!btn) throw new Error("không tìm thấy nút FPS trên giao diện");
    await cdp.click(btn.x, btn.y);
    await sleep(1500);
    const textPaused = await cdp.evalJs(OVERLAY_TEXT_FN);
    log(`overlay lúc đứng yên: ${JSON.stringify(textPaused)}`);
    const mPaused = textPaused ? /Frame trình chiếu \(element\):\s*(…|\d+\.\d+)/.exec(textPaused) : null;
    if (mPaused && mPaused[1] === "…") pass("O1 presented hiện … khi đứng yên", `dòng "Frame trình chiếu (element): …" có trong panel; không hiện 0 gây hiểu nhầm`);
    else fail("O1 presented hiện … khi đứng yên", `panel text: ${JSON.stringify(textPaused)}`);
    // Phát 6 s rồi đọc lại: dòng presented phải hiện SỐ.
    await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
    await cdp.key(" ", "Space");
    await sleep(600);
    const playing = await cdp.evalJs(PLAYING_FN);
    if (!playing) throw new Error("bấm Space mà playing vẫn false");
    await sleep(6000);
    const textPlaying = await cdp.evalJs(OVERLAY_TEXT_FN);
    log(`overlay lúc đang phát: ${JSON.stringify(textPlaying)}`);
    const mPlaying = textPlaying ? /Frame trình chiếu \(element\):\s*(\d+\.\d+)/.exec(textPlaying) : null;
    if (mPlaying) pass("O2 presented hiện SỐ khi đang phát", `dòng "Frame trình chiếu (element): ${mPlaying[1]}" — sampling getVideoPlaybackQuality chạy thật trong UI`);
    else fail("O2 presented hiện SỐ khi đang phát", `panel text: ${JSON.stringify(textPlaying)}`);
    // Dừng, chờ 2.5 s → về "…".
    await cdp.key(" ", "Space");
    await sleep(2500);
    const textStopped = await cdp.evalJs(OVERLAY_TEXT_FN);
    log(`overlay sau khi dừng: ${JSON.stringify(textStopped)}`);
    const mStopped = textStopped ? /Frame trình chiếu \(element\):\s*(…|\d+\.\d+)/.exec(textStopped) : null;
    if (mStopped && mStopped[1] === "…") pass("O3 presented về … sau khi dừng", `dòng về "…" sau 2.5 s dừng phát`);
    else fail("O3 presented về … sau khi dừng", `panel text: ${JSON.stringify(textStopped)}`);
    const errs = (await cdp.evalJs(`(window.__r3errors || []).slice()`)) || [];
    if (errs.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection");
    else fail("H9 0 lỗi trang", errs.slice(0, 5).join(" || "));
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "overlay.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length, textPaused, textPlaying, textStopped }, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "overlay.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED R8 OVERLAY: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { fs.mkdirSync(SCRATCH, { recursive: true }); writeFileEpermRetry(path.join(SCRATCH, "overlay.log"), logLines.join("\n") + "\n"); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
