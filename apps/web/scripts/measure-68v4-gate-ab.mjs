#!/usr/bin/env node
/**
 * measure-68v4-gate-ab.mjs — Phase 9 đợt 68, luồng V4:
 * Điều tra mâu thuẫn gate presented-FPS vs clicktest (U4 §4).
 *
 * Thí nghiệm A/B trong CÙNG phiên app, CÙNG clip long1080, CÙNG gate
 * (setEnh x3 off -> seek 0 -> waitIdle -> draw0 -> Space 6 s -> Space):
 *  - A: gate kiểu presented (KHÔNG đọc canvas trước gate).
 *  - B: gate kiểu clicktest (đọc getImageData canvas mean/std TRƯỚC gate).
 * Thứ tự ABA (mặc định) để tách hiệu ứng canvas-read khỏi warmup theo
 * thứ tự: B >> A và A2 ~= A => canvas-read có tác dụng nhân quả;
 * A2 >> A ~= B => chỉ là warmup / thứ tự.
 * V4_ORDER=BAB chạy thứ tự đảo (phiên thứ 2, kiểm chứng chéo).
 *
 * Mỗi gate lấy mẫu time-course 500 ms trong 6 s phát: draw/hold/skip,
 * ticks, readyState, seeking, currentTime, buffered-end, q.total —
 * để thấy CƠ CHẾ (seek storm? wake-up transient? rs kẹt < 2?).
 * KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary. Exit 0 khi chạy
 * xong cả 3 gate (kể cả gate trượt — trượt cũng là dữ liệu), 2 khi
 * harness lỗi.
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
const SCRATCH = process.env.V4_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v4", "gate-ab");
const ORDER = process.env.V4_ORDER === "BAB" ? ["B", "A", "B"] : ["A", "B", "A"];
const LONG_FILE = "long1080.mp4";
const LONG_W = 1920, LONG_H = 1080, CLIP_DUR = 20;
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
const VITE_CFG_DIR = "/tmp/round68-v4";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.v4-gate-ab.config.mjs");
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");

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
  async mouse(type, x, y, extra = {}) { return this.send("Input.dispatchMouseEvent", { type, x: Math.round(x), y: Math.round(y), ...extra }); }
  async click(x, y, modifiers = 0) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await sleep(400);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
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

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r3storeMod || (window.__r3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({ trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null });
  const hook = window.__vcutPreviewEnhance ? { ...window.__vcutPreviewEnhance } : null;
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const hold = window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null;
  const canvas = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  return { clips, selection: st.selection, playhead: st.playhead, playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled, hook, idle, hold,
    canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    errors: (window.__r3errors || []).slice() };
})()`;

// Mẫu tick đầy đủ cho time-course: draw/hold/skip + ticks + element
// (rs/seeking/ct/buffered/q) + bộ đếm re-seek syncMedia.
const TICK_FN = (fileName) => `(() => {
  const st = window.__r3storeMod ? window.__r3storeMod.useStore.getState() : null;
  const h = window.__vcutHoldStats || null;
  const rec = (window.__vcutMediaEls || []).find((e) => (e.el.currentSrc || "").includes(${JSON.stringify(fileName)}));
  let el = null;
  if (rec) {
    const v = rec.el;
    const q = typeof v.getVideoPlaybackQuality === "function" ? v.getVideoPlaybackQuality() : null;
    let bufEnd = null;
    try { if (v.buffered && v.buffered.length) bufEnd = +v.buffered.end(v.buffered.length - 1).toFixed(2); } catch {}
    el = { rs: v.readyState, ct: +v.currentTime.toFixed(3), seeking: !!v.seeking, paused: v.paused,
      w: v.videoWidth, bufEnd, qTotal: q ? q.totalVideoFrames : null, qDropped: q ? q.droppedVideoFrames : null };
  }
  return { draw: h ? h.draw : null, hold: h ? h.hold : null, skip: h ? h.skip : null,
    ticks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    sleeping: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.sleeping : null,
    ph: st ? +st.playhead.toFixed(3) : null, playing: st ? st.playing : null,
    wall: performance.now(),
    reseeksVideo: window.__vcutSyncReseeksVideo ?? null,
    reseeksAudio: window.__vcutSyncReseeksAudio ?? null, el };
})()`;

// Đọc canvas y hệt clicktest-64r3 (mean/std, lấy mẫu mỗi 2 px) — bước B.
const CANVAS_READ_FN = `(() => {
  const t0 = performance.now();
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0, sum2 = 0, n = 0;
  for (let y = Math.floor(c.height * 0.1); y < Math.floor(c.height * 0.9); y += 2) for (let x = Math.floor(c.width * 0.1); x < Math.floor(c.width * 0.9); x += 2) {
    const i = (y * c.width + x) * 4;
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    sum += l; sum2 += l * l; n++;
  }
  const mean = sum / n;
  return { ok: true, mean: +mean.toFixed(2), std: +Math.sqrt(Math.max(0, sum2 / n - mean * mean)).toFixed(2),
    ms: +(performance.now() - t0).toFixed(1) };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const CLICK_ENH_FN = (testid) => `(() => {
  const el = document.querySelector('[data-testid="${testid}"]');
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const b = el.getBoundingClientRect();
  const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, coveredBy: at === el || el.contains(at) ? null : (at?.tagName + "." + (at?.className || "")) };
})()`;

const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({ trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el) }));
  return { clips };
})()`;

const INJECT_LONG_FN = (mediaUrl, fileName, w, h, dur, clip1Id, clip2Id) => `(async () => {
  const st = await (${STORE_FN});
  const mediaItem = { id: "m-r64-long", name: ${JSON.stringify(fileName)}, kind: "video", url: ${JSON.stringify(mediaUrl)}, duration: ${dur}, width: ${w}, height: ${h} };
  window.__r3storeMod.useStore.setState((s) => ({ media: [...s.media.filter((m) => m.id !== "m-r64-long"), mediaItem], playhead: 0, playing: false, selection: [] }));
  const S = window.__r3storeMod.useStore.getState();
  const patched = S.patchClip("v1", ${JSON.stringify(clip1Id)}, { src: ${JSON.stringify(fileName)}, in: 0, out: ${dur}, duration: ${dur} });
  S.moveClip("v1", ${JSON.stringify(clip2Id)}, ${dur});
  const st2 = window.__r3storeMod.useStore.getState();
  const v1 = st2.spec.tracks.find((t) => t.id === "v1");
  return { patched, tracks: st2.spec.tracks.length,
    clip1: v1.clips.find((c) => c.id === ${JSON.stringify(clip1Id)}),
    clip2: v1.clips.find((c) => c.id === ${JSON.stringify(clip2Id)}),
    mediaLen: st2.media.length };
})()`;

async function main() {
  let vite = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);
  const phaseErrors = [];

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }
  async function waitIdle(cdp, label, timeoutMs = 90000) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, timeoutMs);
  }
  async function clickEnhCheckbox(cdp, testid, label) {
    const g = await cdp.evalJs(CLICK_ENH_FN(testid));
    if (!g) throw new Error(`không tìm thấy [data-testid="${testid}"] (${label})`);
    await cdp.click(g.x, g.y);
    await sleep(600);
  }
  async function setEnhCheckbox(cdp, testid, key, want, clipId) {
    const cur = await cdp.evalJs(STATE_FN);
    const enh = cur.clips.find((c) => c.clipId === clipId)?.enhance;
    const has = !!(enh && enh[key]);
    if (has !== want) await clickEnhCheckbox(cdp, testid, `${key}→${want}`);
    const after = await cdp.evalJs(STATE_FN);
    const enh2 = after.clips.find((c) => c.clipId === clipId)?.enhance;
    const has2 = !!(enh2 && enh2[key]);
    if (has2 !== want) throw new Error(`checkbox ${key} không về ${want} (đang ${has2}, enhance=${JSON.stringify(enh2)})`);
    return after;
  }
  async function togglePlay(cdp) {
    await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
    await cdp.key(" ", "Space");
  }

  try {
    const DEV_PORT = Number(process.env.V4_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
    const DEBUG_PORT = Number(process.env.V4_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
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
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = process.env.V4_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :180–:189");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(path.join(MEDIA_DIR, LONG_FILE))) throw new Error(`không thấy media fixture ${LONG_FILE} ở ${MEDIA_DIR}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const MEDIA_URL = (f) => `${DEV_URL}r61r3-media/${f}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round68-v4/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});
const react = require("@vitejs/plugin-react").default;
const MEDIA_DIR = ${JSON.stringify(MEDIA_DIR)};
const MIME = { ".mp4": "video/mp4", ".png": "image/png", ".webm": "video/webm", ".jpg": "image/jpeg" };
const mediaPlugin = () => ({ name: "r61r3-media", configureServer(server) {
  server.middlewares.use("/r61r3-media", (req, res) => {
    const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\\//, "");
    const fp = path.join(MEDIA_DIR, name);
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!name || name.includes("..") || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.statusCode = 404; res.end("not found"); return; }
    const st = fs.statSync(fp);
    const range = req.headers.range;
    res.setHeader("Content-Type", MIME[path.extname(fp).toLowerCase()] || "application/octet-stream");
    res.setHeader("Accept-Ranges", "bytes");
    if (range) {
      const m = /bytes=(\\d+)-(\\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", \`bytes \${start}-\${end}/\${st.size}\`);
        res.setHeader("Content-Length", String(end - start + 1));
        fs.createReadStream(fp, { start, end }).pipe(res);
        return;
      }
    }
    res.setHeader("Content-Length", String(st.size));
    fs.createReadStream(fp).pipe(res);
  });
} });
export default { plugins: [react(), mediaPlugin()], server: { hmr: false } };
`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, clip ${LONG_FILE}, thứ tự ${ORDER.join("")}, loadavg lúc bắt đầu ${loadAvg()}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "v4-gate-ab-vite.log"), "w");
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
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s (socket ${sock} chưa có)`);
    }
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "v4-gate-ab-chrome.log"), "w");
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
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");
    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng");
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook", 180000);
    log(`project mẫu: canvas preview backing ${s0.canvasW}x${s0.canvasH}, loadavg ${loadAvg()}`);
    const v1Clips = s0.clips.filter((c) => c.trackId === "v1");
    const clip1Id = v1Clips[0].clipId;
    const clip2Id = v1Clips[1].clipId;
    const firstClipId = clip1Id;
    const injected = await cdp.evalJs(INJECT_LONG_FN(MEDIA_URL(LONG_FILE), LONG_FILE, LONG_W, LONG_H, CLIP_DUR, clip1Id, clip2Id));
    log(`đã thay clip mẫu 1 bằng clip dài: ${JSON.stringify(injected)}`);
    if (!injected.clip1 || injected.clip1.src !== LONG_FILE || injected.clip1.duration !== CLIP_DUR) throw new Error(`inject clip dài không đúng kỳ vọng: ${JSON.stringify(injected)}`);
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.clipId === clip1Id);
    if (!vc) throw new Error("không tìm thấy clip dài trên timeline sau inject");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip dài (hook gắn clip 1)", 60000);
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await waitIdle(cdp, "vẽ frame đầu clip dài");
    log(`sẵn sàng: loop đã ngủ ở playhead 0, loadavg ${loadAvg()}`);

    // ---- Một gate A/B: time-course 500 ms trong 6 s phát -------------
    async function gateRun(idx, variant) {
      const label = `${variant}${idx}`;
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, `gate ${label} seek 0`);
      let canvasRead = null;
      if (variant === "B") {
        canvasRead = await cdp.evalJs(CANVAS_READ_FN);
        log(`gate ${label}: canvas read trước gate: ${JSON.stringify(canvasRead)}`);
        if (!canvasRead.ok) throw new Error(`gate ${label}: canvas read lỗi: ${JSON.stringify(canvasRead)}`);
      }
      const loadBefore = loadAvg();
      const t0 = await cdp.evalJs(TICK_FN(LONG_FILE));
      const wall0 = Date.now();
      await togglePlay(cdp);
      const samples = [];
      for (let i = 0; i < 12; i++) {
        await sleep(500);
        samples.push(await cdp.evalJs(TICK_FN(LONG_FILE)));
      }
      await togglePlay(cdp);
      await sleep(400);
      const t1 = await cdp.evalJs(TICK_FN(LONG_FILE));
      const wallSecs = (Date.now() - wall0) / 1000;
      const stGate = await cdp.evalJs(STATE_FN);
      const hookOk = stGate.hook && stGate.hook.denoiseBlurPx === 0 && stGate.hook.denoiseBlendAlpha === 0 && stGate.hook.clipId === firstClipId;
      const drawDelta = t1.draw - t0.draw;
      const holdDelta = t1.hold - t0.hold;
      const skipDelta = t1.skip - t0.skip;
      const ticksDelta = t1.ticks - t0.ticks;
      const qDelta = (t1.el?.qTotal ?? null) !== null && (t0.el?.qTotal ?? null) !== null ? t1.el.qTotal - t0.el.qTotal : null;
      const seekingFrac = samples.filter((s) => s.el?.seeking).length / samples.length;
      const rsHist = {};
      for (const s of samples) { const k = String(s.el?.rs ?? "?"); rsHist[k] = (rsHist[k] || 0) + 1; }
      const ctTrace = samples.map((s) => s.el?.ct ?? null);
      const drawTrace = samples.map((s) => s.draw);
      const reseeksDelta = (t1.reseeksVideo ?? 0) - (t0.reseeksVideo ?? 0);
      const row = { idx, variant, label, canvasRead, loadBefore, loadAfter: loadAvg(),
        draw0: t0.draw, draw1: t1.draw, drawDelta, gatePass: drawDelta >= 20,
        holdDelta, skipDelta, ticksDelta, qDelta, ct0: t0.el?.ct ?? null, ct1: t1.el?.ct ?? null,
        bufEnd0: t0.el?.bufEnd ?? null, bufEnd1: t1.el?.bufEnd ?? null,
        seekingFrac, rsHist, reseeksDelta,
        hookOk, playhead1: stGate.playhead,
        wallSecs: +wallSecs.toFixed(2),
        ctTrace, drawTrace,
        samples: samples.map((s) => ({ t: +((s.wall - t0.wall) / 1000).toFixed(2), draw: s.draw, hold: s.hold, skip: s.skip, ticks: s.ticks, ph: s.ph, rs: s.el?.rs ?? null, seeking: s.el?.seeking ?? null, ct: s.el?.ct ?? null, bufEnd: s.el?.bufEnd ?? null, qTotal: s.el?.qTotal ?? null })) };
      log(`GATE ${label} (${variant === "B" ? "có canvas-read" : "không canvas-read"}): draw ${t0.draw} → ${t1.draw} (delta ${drawDelta}, ${drawDelta >= 20 ? "QUA" : "TRƯỢT"}), hold +${holdDelta}, skip +${skipDelta}, ticks +${ticksDelta}, qTotal +${qDelta}, ct ${t0.el?.ct} → ${t1.el?.ct}, bufEnd ${t0.el?.bufEnd} → ${t1.el?.bufEnd}, seeking ${Math.round(seekingFrac * 100)}% mẫu, rs ${JSON.stringify(rsHist)}, reseeksVideo +${reseeksDelta}, hookOk=${hookOk}, load ${loadBefore} → ${row.loadAfter}`);
      log(`  ct trace: [${ctTrace.map((v) => v === null ? "?" : v.toFixed(2)).join(", ")}]`);
      log(`  draw trace: [${drawTrace.join(", ")}]`);
      return row;
    }

    const rows = [];
    for (let i = 0; i < ORDER.length; i++) {
      rows.push(await gateRun(i + 1, ORDER[i]));
      if (i < ORDER.length - 1) {
        // Reset về trạng thái ngủ ở playhead 0 trước gate tiếp theo.
        await cdp.evalJs(SET_PLAYHEAD_FN(0));
        await waitIdle(cdp, `reset sau gate ${i + 1}`);
        await sleep(500);
      }
    }
    const errs = (await cdp.evalJs(`(window.__r3errors || []).slice()`)) || [];
    phaseErrors.push(...errs);
    const report = { order: ORDER.join(""), clip: LONG_FILE, loadAtStart: loadAvg(), rows, pageErrors: phaseErrors };
    writeFileEpermRetry(path.join(SCRATCH, "gate-ab.json"), JSON.stringify(report, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "gate-ab.log"), logLines.join("\n") + "\n");
    const aRows = rows.filter((r) => r.variant === "A");
    const bRows = rows.filter((r) => r.variant === "B");
    log(`KẾT LUẬN A/B (phiên này): A drawDelta=[${aRows.map((r) => r.drawDelta).join(", ")}], B drawDelta=[${bRows.map((r) => r.drawDelta).join(", ")}], lỗi trang=${phaseErrors.length}`);
    process.exitCode = 0;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { fs.mkdirSync(SCRATCH, { recursive: true }); writeFileEpermRetry(path.join(SCRATCH, "gate-ab.log"), logLines.join("\n") + "\n"); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
