#!/usr/bin/env node
/**
 * r75c1-fps.mjs — Phase 9 đợt 75, luồng C1: đo FPS preview THẬT khi phát
 * ocean 1920x1080 plain ở w1440x900, TRƯỚC vs SAU khi sửa rò plain
 * (letterbox intermediate dw×dh — thêm 1 drawImage 1920->1280/frame).
 *
 * Dựa trên r74b1-headed-capture.mjs (vite dev + Xvfb + Chromium 1254
 * headed + CDP, seed project qua localStorage, import media bằng
 * DOM.setFileInputFiles, playhead + togglePlay). Đo: cài vòng rAF đếm
 * timestamp 10 s sau warmup 2 s lúc đang phát; báo FPS trung bình,
 * FPS thấp nhất theo cửa sổ 1 s, p95 khoảng cách frame, số frame giật
 * (> 50 ms). rAF dưới Xvfb chạy theo nhịp compositor (~60 Hz) nên số
 * này đo độ bận main-thread (vẽ chậm -> rAF thưa), cùng cách đo với
 * bench-preview-fps.mjs.
 *
 * Chạy (từ gốc repo):
 *   R75C1_LABEL=sau-sua R75C1_WEB_DIR=$PWD/apps/web \
 *     R75C1_OUT=hidden_files/round75-c1/r75c1-fps-sau.json \
 *     node apps/web/scripts/r75c1-fps.mjs
 * Env: R75C1_WEB_DIR (mặc định apps/web), R75C1_LABEL, R75C1_OUT,
 *   R75C1_DURATION (mặc định 10), R75C1_WARMUP (mặc định 2),
 *   R75C1_SCRATCH (mặc định hidden_files/round75-c1/fps-<label>),
 *   R75C1_DEV_PORT/R75C1_DEBUG_PORT/R75C1_DISPLAY (tự chọn nếu trống).
 * Exit 0 khi đo xong. KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.resolve(process.env.R75C1_WEB_DIR || path.join(ROOT, "apps", "web"));
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Y2 = path.join(GOAL, "round71-y2");
const C1 = path.join(GOAL, "round75-c1");
const LABEL = process.env.R75C1_LABEL || "fps";
const DURATION = Number(process.env.R75C1_DURATION || 4);
const WARMUP = Number(process.env.R75C1_WARMUP || 1);
const OUT = process.env.R75C1_OUT || path.join(C1, `r75c1-fps-${LABEL}.json`);
const SCRATCH = process.env.R75C1_SCRATCH || path.join(C1, `fps-${LABEL}`);
const CHROME = process.env.R75C1_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round75-c1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r75c1.config.mjs");
const WIN_W = 1440, WIN_H = 900;
const OCEAN = path.join(Y2, "probe", "ocean06.mp4");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

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
  async click(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(x), y: Math.round(y), button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(x), y: Math.round(y), button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code) {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r75c1storeMod || (window.__r75c1storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const media = (st.media || []).map((m) => ({ name: m.name, kind: m.kind }));
  return { clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => ({ clipId: c.id, src: c.src ?? null, effects: c.effects ?? null }))), playhead: st.playhead, playing: st.playing, idle, media, errors: (window.__r75c1errors || []).slice() };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => { const st = await (${STORE_FN}); st.setPlayhead(${t}); return st.playhead; })()`;
const PATCH_FN = (trackId, clipId, patchJson) => `(async () => { const st = await (${STORE_FN}); st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson}); return true; })()`;
const PLAY_FN = `(async () => { const st = await (${STORE_FN}); if (typeof st.togglePlay === "function") { st.togglePlay(); return st.playing; } return null; })()`;

const SEED_SPEC = {
  version: "0.2.0",
  meta: { name: "R75C1 fps ocean", width: 1280, height: 720, fps: 30 },
  tracks: [{
    id: "v1", kind: "video",
    // ocean06.mp4 dài 6,4 s — clip phải phủ hết cửa sổ đo (warmup +
    // duration) nếu không phát sẽ dừng giữa chừng và số FPS đo được
    // chỉ còn là FPS trang đứng yên (lỗi phương pháp ở lần chạy đầu).
    clips: [{ kind: "video", id: "c1", src: "test-pattern.mp4", start: 0, duration: 6.4, in: 0, out: 6.4 }],
  }],
};
function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}

function fpsStats(ts) {
  const gaps = [];
  for (let i = 1; i < ts.length; i++) gaps.push(ts[i] - ts[i - 1]);
  gaps.sort((a, b) => a - b);
  const span = ts.length > 1 ? (ts[ts.length - 1] - ts[0]) / 1000 : 0;
  const fps = span > 0 ? +((ts.length - 1) / span).toFixed(2) : 0;
  const p95 = gaps.length ? +gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * 0.95))].toFixed(1) : 0;
  const p50 = gaps.length ? +gaps[Math.floor(gaps.length * 0.5)].toFixed(1) : 0;
  const jank = gaps.filter((g) => g > 50).length;
  // FPS thấp nhất theo cửa sổ 1 s.
  let minWin = Infinity;
  for (let w = 0; w < DURATION; w++) {
    const c = ts.filter((t) => t >= ts[0] + w * 1000 && t < ts[0] + (w + 1) * 1000).length;
    if (c > 0) minWin = Math.min(minWin, c);
  }
  return { frames: ts.length, spanSec: +span.toFixed(2), fps, p50GapMs: p50, p95GapMs: p95, jankOver50ms: jank, min1sWindowFps: minWin === Infinity ? 0 : minWin };
}

async function main() {
  let vite = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);
  try {
    if (!fs.existsSync(OCEAN)) throw new Error(`không thấy media ${OCEAN}`);
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = Number(process.env.R75C1_DEV_PORT || 0) || (await pickFreePort(5570, 5579));
    const DEBUG_PORT = Number(process.env.R75C1_DEBUG_PORT || 0) || (await pickFreePort(9670, 9679));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 170; n <= 179; n++) {
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
        }
        return `:${n}`;
      }
      return null;
    }
    const DISPLAY = process.env.R75C1_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :170–:179");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5570–5579");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9670–9679");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round75-c1/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\n// @vitejs/plugin-react nằm ở node_modules GỐC repo (hoisted), không phải
// apps/web/node_modules — resolve từ gốc để bản shadow ở /tmp cũng chạy được.
const require = createRequire(${JSON.stringify(path.join(ROOT, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT} (webDir=${WEB_DIR}), debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, label=${LABEL}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r75c1-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", `${WIN_W}x${WIN_H}x24`], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r75c1-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      `--window-size=${WIN_W},${WIN_H}`, "--hide-scrollbars", "about:blank"],
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
    await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()`).catch(() => null);
      return s;
    }, "app mount", 240000);
    log("app đã mount");
    await cdp.evalJs(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(SEED_SPEC, "R75C1 fps ocean"))});`);
    await cdp.evalJs(`window.__r75c1errors = []; window.addEventListener("error", (e) => { try { window.__r75c1errors.push("window.onerror: " + (e.message || e.type)); } catch {} }); window.addEventListener("unhandledrejection", (e) => { try { window.__r75c1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch {} });`);
    await cdp.send("Page.reload");
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()`).catch(() => null);
      return s;
    }, "app mount sau reload", 240000);
    await sleep(1500);
    const relink = await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
    if (relink) {
      const btn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.title === "Đóng (bỏ qua)"); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (btn) await cdp.click(btn.x, btn.y);
      await cdp.waitFor(async () => !(await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`)), "RelinkPanel đóng", 15000);
    }
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) break;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    await cdp.waitFor(async () => (await cdp.evalJs(`!!document.querySelector(".mediabin")`)) ? true : null, "MediaBin sẵn", 30000);
    const doc = await cdp.send("DOM.getDocument", { depth: 0 });
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" });
    if (!q.nodeId) throw new Error("không tìm được file input của MediaBin");
    await cdp.send("DOM.setFileInputFiles", { files: [OCEAN], nodeId: q.nodeId });
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.media.some((m) => m.name === "ocean06.mp4") ? t : null;
    }, "media ocean06.mp4 vào bin", 60000);
    log("media đã vào bin: ocean06.mp4");
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 1 && t.clips[0].clipId === "c1" && t.idle && t.idle.sleeping ? t : null;
    }, "project seed + preview ngủ", 120000);
    await cdp.evalJs(PATCH_FN("v1", "c1", JSON.stringify({ src: "ocean06.mp4" })));
    await cdp.evalJs(PATCH_FN("v1", "c1", JSON.stringify({ effects: [] })));
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.idle && t.idle.sleeping ? t : null;
    }, "preview ngủ sau patch src", 120000);
    log("setup xong: ocean plain, playhead 0");

    // Cài vòng đếm rAF, phát, warmup, đo.
    await cdp.evalJs(`window.__fpsT = []; window.__fpsRun = true; requestAnimationFrame(function loop(ts) { if (!window.__fpsRun) return; window.__fpsT.push(ts); requestAnimationFrame(loop); });`);
    const playing = await cdp.evalJs(PLAY_FN);
    log(`đang phát: playing=${playing}`);
    await sleep(WARMUP * 1000);
    // Kiểm tra cứng: vẫn đang phát + playhead đã chạy, nếu không thì
    // số đo chỉ là FPS trang đứng yên — từ chối ghi số (fail loudly).
    const midState = await cdp.evalJs(STATE_FN);
    const phBefore = midState.playhead;
    if (!midState.playing) throw new Error(`không còn phát sau warmup (playing=false, playhead=${phBefore}) — từ chối đo`);
    log(`sau warmup: playing=true playhead=${phBefore}`);
    await cdp.evalJs(`window.__fpsT = [];`);
    await sleep(DURATION * 1000);
    const ts = await cdp.evalJs(`window.__fpsRun = false; window.__fpsT.slice()`);
    const endState = await cdp.evalJs(STATE_FN);
    log(`sau đo: playing=${endState.playing} playhead=${endState.playhead} (trước đo ${phBefore})`);
    if (!(endState.playhead > phBefore + 1)) throw new Error(`playhead không chạy trong lúc đo (${phBefore} -> ${endState.playhead}) — số FPS không đáng tin`);
    await cdp.evalJs(PLAY_FN).catch(() => {});
    const stats = fpsStats(ts);
    const errors = await cdp.evalJs(`(window.__r75c1errors || []).slice()`);
    log(`FPS ${LABEL}: ${stats.fps} fps (frames=${stats.frames}, span=${stats.spanSec}s, p50gap=${stats.p50GapMs}ms, p95gap=${stats.p95GapMs}ms, jank>50ms=${stats.jankOver50ms}, min1s=${stats.min1sWindowFps}) errors=${errors.length}`);
    const result = { label: LABEL, webDir: WEB_DIR, window: "1440x900", source: "ocean06.mp4", variant: "plain", warmupSec: WARMUP, durationSec: DURATION, playheadBefore: phBefore, playheadAfter: endState.playhead, playingAtEnd: endState.playing, ...stats, pageErrors: errors };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileEpermRetry(OUT, JSON.stringify(result, null, 2));
    log(`JSON: ${OUT}`);
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
