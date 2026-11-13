#!/usr/bin/env node
/**
 * measure-67u4-app-rvfc-probe.mjs — Phase 9 đợt 67, luồng U4:
 * đo rVFC + presented + mediaRate (2 định nghĩa) + bộ đếm re-seek của
 * syncMedia TRONG APP, trên cùng element clip dài 1080p.
 *
 * Bối cảnh: probe tab trắng (measure-67u4-mediarate-probe.mjs) đã chứng minh:
 * (a) re-anchor kiểu syncMedia ép mediaRate-ct về ~1,0x trong khi presented
 * vẫn thấp (D-vis lần 2: ct 1,002x vs rVFC-meta 0,589x); (b) hai định nghĩa
 * mediaRate (ΔcurrentTime/Δwall vs Δmeta.mediaTime rVFC) PHÂN KỲ khi có seek;
 * (c) detached vs visible không đổi presented/mediaRate, chỉ đổi dropped.
 * Còn thiếu mắt xích cuối: TRONG APP, currentTime tiến mượt hay theo bậc
 * thang seek? rVFC trong app đếm được bao nhiêu so với presented? Bộ đếm
 * __vcutSyncReseeksVideo có tăng trong slot tải nặng không?
 *
 * Thiết kế: boot app như measure-65r8-presented-fps.mjs (vite dev + Xvfb +
 * CDP), patch clip1 → long1080.mp4, tắt enhance (baseline), KHÔNG dùng gate
 * draw (cố tình: vòng vẽ có thể gãy dưới tải nhưng element vẫn phát — xem
 * 3 lần gate fail đợt này, drawDelta 2–4 trong khi ct vẫn tiến 5,9–6,7 s).
 * Mỗi rep 10 s: gắn rVFC lên element pool (__vcutMediaEls) + lấy mẫu
 * currentTime 50 ms + quality đầu/cuối + bộ đếm __vcutSyncReseeks* trước/sau.
 * KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary. Exit 0 khi đo xong,
 * 2 khi harness lỗi.
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
const SCRATCH = process.env.U4_APP_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round67-u4", "app-rvfc-probe");
const REPEATS = Math.max(1, Number(process.env.U4_APP_REPEATS || 2));
const SAMPLE_SECS = Math.max(3, Number(process.env.U4_APP_SECS || 10));
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
const VITE_CFG_DIR = "/tmp/round67-u4";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.u4-app-rvfc.config.mjs");
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
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout 60s: ${method}`));
      }, 60000);
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
  window.__r3boot = Math.random().toString(36).slice(2);
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
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
  });
  const hook = window.__vcutPreviewEnhance ? { ...window.__vcutPreviewEnhance } : null;
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const hold = window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null;
  const canvas = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  return {
    clips, selection: st.selection, playhead: st.playhead, playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled, hook, idle, hold,
    canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    errors: (window.__r3errors || []).slice(),
  };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
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

// Slot đo TRONG APP: rVFC + quality + currentTime trace 50ms + bộ đếm re-seek.
// Chạy sau khi ngoài đã bấm Space (playing=true); tự chờ element phát rồi đo
// `secs` giây tính từ rVFC callback đầu tiên. Không yêu cầu draw (cố tình).
const APP_SLOT_FN = (fileName, secs, mark) => `(async () => {
  const rec = (window.__vcutMediaEls || []).find((e) => (e.el.currentSrc || "").includes(${JSON.stringify(fileName)}));
  if (!rec) return { error: "không tìm thấy element clip dài trong __vcutMediaEls" };
  const el = rec.el;
  el.__u4mark = ${JSON.stringify(mark)};
  const st0 = await (${STORE_FN});
  const ph0 = st0.playhead;
  const counters0 = { total: window.__vcutSyncReseeks ?? null, video: window.__vcutSyncReseeksVideo ?? null, audio: window.__vcutSyncReseeksAudio ?? null };
  const q0 = el.getVideoPlaybackQuality ? el.getVideoPlaybackQuality() : null;
  const ct0 = el.currentTime;
  const wall0 = performance.now();
  // Chờ element thật sự phát (tối đa 5 s); nếu không phát thì trả lỗi thay vì số rác.
  for (let i = 0; i < 50 && el.paused; i++) await new Promise((r) => setTimeout(r, 100));
  if (el.paused) return { error: "element vẫn paused sau 5 s chờ", ct0, counters0 };
  let frames = 0, t0 = 0, t1 = 0, firstMedia = 0, lastMedia = 0;
  const ctTrace = [];
  const traceTimer = setInterval(() => ctTrace.push([+((performance.now() - wall0) / 1000).toFixed(2), +el.currentTime.toFixed(3), el.seeking ? 1 : 0, el.paused ? 1 : 0]), 50);
  const draw0 = window.__vcutHoldStats ? window.__vcutHoldStats.draw : null;
  const ticks0 = window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null;
  await new Promise((res) => {
    let done = false;
    const finish = () => { if (!done) { done = true; res(); } };
    setTimeout(finish, (${secs} + 8) * 1000);
    const cb = (now, meta) => {
      if (frames === 0) { t0 = now; firstMedia = meta.mediaTime; }
      frames++; t1 = now; lastMedia = meta.mediaTime;
      if (t1 - t0 < ${secs} * 1000 && !el.ended) el.requestVideoFrameCallback(cb);
      else finish();
    };
    el.requestVideoFrameCallback(cb);
  });
  clearInterval(traceTimer);
  await new Promise((r) => setTimeout(r, 200));
  const st1 = await (${STORE_FN});
  const q1 = el.getVideoPlaybackQuality ? el.getVideoPlaybackQuality() : null;
  const counters1 = { total: window.__vcutSyncReseeks ?? null, video: window.__vcutSyncReseeksVideo ?? null, audio: window.__vcutSyncReseeksAudio ?? null };
  const wallSecs = frames >= 2 ? (t1 - t0) / 1000 : null;
  const total = q1 ? q1.totalVideoFrames - (q0 ? q0.totalVideoFrames : 0) : null;
  const dropped = q1 ? q1.droppedVideoFrames - (q0 ? q0.droppedVideoFrames : 0) : null;
  return {
    markOk: el.__u4mark === ${JSON.stringify(mark)},
    frames, wallSecs: wallSecs === null ? null : +wallSecs.toFixed(3),
    rvfcFps: wallSecs === null ? null : +((frames - 1) / wallSecs).toFixed(2),
    presentedFps: total === null || wallSecs === null ? null : +(total / wallSecs).toFixed(2),
    droppedFps: dropped === null || wallSecs === null ? null : +(dropped / wallSecs).toFixed(2),
    mediaRateRvfc: wallSecs === null ? null : +((lastMedia - firstMedia) / wallSecs).toFixed(3),
    mediaRateCt: wallSecs === null ? null : +((el.currentTime - ct0) / wallSecs).toFixed(3),
    ct0: +ct0.toFixed(3), ct1: +el.currentTime.toFixed(3),
    ph0: +ph0.toFixed(3), ph1: +st1.playhead.toFixed(3),
    phRate: wallSecs === null ? null : +((st1.playhead - ph0) / wallSecs).toFixed(3),
    dropped, total, counters0, counters1,
    reseeksDelta: (counters1.total ?? 0) - (counters0.total ?? 0),
    reseeksVideoDelta: (counters1.video ?? 0) - (counters0.video ?? 0),
    reseeksAudioDelta: (counters1.audio ?? 0) - (counters0.audio ?? 0),
    drawDelta: (window.__vcutHoldStats && draw0 !== null) ? window.__vcutHoldStats.draw - draw0 : null,
    ticksDelta: (window.__vcutPreviewIdle && ticks0 !== null) ? window.__vcutPreviewIdle.ticks - ticks0 : null,
    attached: el.isConnected === true, inDoc: document.contains(el),
    ctTrace,
  };
})()`;

const CLICK_ENH_FN = (testid) => `(() => {
  const el = document.querySelector('[data-testid="${testid}"]');
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const b = el.getBoundingClientRect();
  const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, coveredBy: at === el || el.contains(at) ? null : (at?.tagName + "." + (at?.className || "")) };
})()`;

let vite = null, xvfb = null, chrome = null;
const results = [];
async function cleanup() {
  try { if (chrome) chrome.kill("SIGTERM"); } catch {}
  try { if (xvfb) xvfb.kill("SIGTERM"); } catch {}
  try { if (vite) vite.kill("SIGTERM"); } catch {}
}
process.on("SIGTERM", async () => { await cleanup(); process.exit(2); });
process.on("SIGINT", async () => { await cleanup(); process.exit(2); });

try {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const DEV_PORT = Number(process.env.U4_APP_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
  const DEBUG_PORT = Number(process.env.U4_APP_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 180; n <= 189; n++) {
      const sock = `/tmp/.X11-unix/X${n}`;
      if (fs.existsSync(sock)) {
        let alive = false;
        try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
        if (alive) continue;
        try { fs.unlinkSync(sock); } catch {}
        try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
        log(`đã dọn socket X mồ côi ${sock}`);
      }
      return `:${n}`;
    }
    return null;
  }
  const DISPLAY = process.env.U4_APP_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
  if (!VITE_BIN) throw new Error("không thấy vite");
  if (!fs.existsSync(path.join(MEDIA_DIR, LONG_FILE))) throw new Error(`không thấy media fixture ${LONG_FILE} ở ${MEDIA_DIR}`);
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r61r3-media/${f}`;
  log(`app-rvfc probe: clip ${LONG_FILE}, ${SAMPLE_SECS}s/rep × ${REPEATS}, loadavg lúc bắt đầu ${loadAvg()}`);

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

  const viteLogFd = fs.openSync(path.join(SCRATCH, "u4-app-rvfc-vite.log"), "w");
  vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
  log("vite dev đã lên");
  const mediaProbe = await fetch(MEDIA_URL("frame15.png"));
  if (!mediaProbe.ok) throw new Error(`middleware media không phục vụ được frame15.png (HTTP ${mediaProbe.status})`);
  log("middleware /r61r3-media/ phục vụ được fixture");

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
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "u4-app-rvfc-chrome.log"), "w");
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
    { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
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
  await cdp.evalJs(INJECT_ERRORS);
  await cdp.send("Page.navigate", { url: DEV_URL });
  await cdp.waitFor(async () => {
    const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
    return s;
  }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
  log("app đã mount");

  async function ensureNoModal() {
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
  if (!(await ensureNoModal())) throw new Error("modal chào vẫn mở sau 3 lần đóng");
  log("modal chào đã đóng");
  async function waitIdle(label, timeoutMs = 90000) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, timeoutMs);
  }
  async function togglePlay() {
    await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
    await cdp.key(" ", "Space");
  }
  async function clickEnhCheckbox(testid, label) {
    const g = await cdp.evalJs(CLICK_ENH_FN(testid));
    if (!g) throw new Error(`không tìm thấy [data-testid="${testid}"] (${label})`);
    if (g.coveredBy) log(`cảnh báo: ${testid} bị che bởi ${g.coveredBy} — vẫn thử bấm`);
    await cdp.click(g.x, g.y);
    await sleep(600);
  }
  async function setEnhCheckbox(testid, key, want, clipId) {
    const cur = await cdp.evalJs(STATE_FN);
    const enh = cur.clips.find((c) => c.clipId === clipId)?.enhance;
    const has = !!(enh && enh[key]);
    if (has !== want) await clickEnhCheckbox(testid, `${key}→${want}`);
    const after = await cdp.evalJs(STATE_FN);
    const enh2 = after.clips.find((c) => c.clipId === clipId)?.enhance;
    if (!!(enh2 && enh2[key]) !== want) throw new Error(`checkbox ${key} không về ${want}`);
    return after;
  }

  const s0 = await cdp.waitFor(async () => {
    const t = await cdp.evalJs(STATE_FN).catch(() => null);
    return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
  }, "project mẫu tự load (3 clip) + hook", 180000);
  log(`project mẫu: canvas preview backing ${s0.canvasW}x${s0.canvasH}, loadavg ${loadAvg()}`);
  const v1Clips = s0.clips.filter((c) => c.trackId === "v1");
  const clip1Id = v1Clips[0].clipId;
  const clip2Id = v1Clips[1].clipId;
  const injected = await cdp.evalJs(INJECT_LONG_FN(MEDIA_URL(LONG_FILE), LONG_FILE, LONG_W, LONG_H, CLIP_DUR, clip1Id, clip2Id));
  log(`đã thay clip mẫu 1 bằng clip dài: ${JSON.stringify(injected)}`);
  if (!injected.clip1 || injected.clip1.src !== LONG_FILE || injected.clip1.duration !== CLIP_DUR) {
    throw new Error(`inject clip dài không đúng kỳ vọng: ${JSON.stringify(injected)}`);
  }
  const g1 = await cdp.evalJs(GEOM_FN);
  const vc = g1.clips.find((c) => c.clipId === clip1Id);
  if (!vc) throw new Error("không tìm thấy clip dài trên timeline sau inject");
  await cdp.click(vc.rect.cx, vc.rect.cy);
  await cdp.waitFor(async () => {
    const t = await cdp.evalJs(STATE_FN).catch(() => null);
    return t && t.hook && t.hook.clipId === clip1Id ? t : null;
  }, "chọn clip dài (hook gắn clip 1)", 60000);
  await cdp.evalJs(SET_PLAYHEAD_FN(0));
  await waitIdle("vẽ frame đầu clip dài");
  // Baseline: tắt enhance (như T5/S8) — chỉ để đồng nhất điều kiện, không đo enhance.
  await setEnhCheckbox("enhance-denoise-toggle", "denoise", false, clip1Id);
  await setEnhCheckbox("enhance-stabilize-toggle", "stabilize", false, clip1Id);
  await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", false, clip1Id);
  log("enhance đã tắt (baseline)");

  for (let rep = 1; rep <= REPEATS; rep++) {
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await waitIdle(`rep ${rep} seek 0`);
    const loadBefore = loadAvg();
    await togglePlay();
    await sleep(300);
    const playing = (await cdp.evalJs(STATE_FN)).playing;
    if (!playing) throw new Error(`rep ${rep}: bấm Space mà playing vẫn false`);
    const r = await cdp.evalJs(APP_SLOT_FN(LONG_FILE, SAMPLE_SECS, `u4-rep${rep}`));
    await togglePlay();
    await sleep(400);
    const after = await cdp.evalJs(STATE_FN);
    if (after.playing) throw new Error(`rep ${rep}: bấm Space lần 2 mà playing vẫn true`);
    if (r.error) throw new Error(`rep ${rep}: ${r.error}`);
    const row = { rep, ...r, loadBefore, loadAfter: loadAvg(), valid: r.markOk !== false };
    results.push(row);
    writeFileEpermRetry(path.join(SCRATCH, "app-rvfc-probe.json"), JSON.stringify({ clip: LONG_FILE, secs: SAMPLE_SECS, results }, null, 2));
    log(`APP-RVFC rep ${rep}: rVFC ${r.rvfcFps} fps (frame ${r.frames}/${r.wallSecs}s), presented ${r.presentedFps} fps (Δtotal ${r.total}), dropped ${r.dropped} (${r.droppedFps} fps), mediaRate rVFC ${r.mediaRateRvfc}x / ct ${r.mediaRateCt}x (ct ${r.ct0}→${r.ct1}), phRate ${r.phRate}x, reseeks +${r.reseeksDelta} (video +${r.reseeksVideoDelta}, audio +${r.reseeksAudioDelta}), drawDelta ${r.drawDelta}, ticksDelta ${r.ticksDelta}, markOk=${r.markOk}, load ${loadBefore} → ${row.loadAfter}`);
  }
  const errs = (await cdp.evalJs(`(window.__r3errors || []).slice()`)) || [];
  if (errs.length) log(`cảnh báo: ${errs.length} lỗi trang: ${errs.slice(0, 3).join(" | ")}`);
  if (cdp.exceptions.length) log(`cảnh báo: ${cdp.exceptions.length} exception CDP: ${cdp.exceptions.slice(0, 3).join(" | ")}`);
  await cleanup();
  writeFileEpermRetry(path.join(SCRATCH, "app-rvfc-probe.log"), logLines.join("\n") + "\n");
  log(`APP-RVFC XONG: ${results.length}/${REPEATS} rep, JSON ${path.join(SCRATCH, "app-rvfc-probe.json")}`);
  process.exit(0);
} catch (e) {
  log(`HARNESS LỖI: ${e.message}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "app-rvfc-probe.json"), JSON.stringify({ clip: LONG_FILE, secs: SAMPLE_SECS, results, error: e.message }, null, 2)); } catch {}
  try { writeFileEpermRetry(path.join(SCRATCH, "app-rvfc-probe.log"), logLines.join("\n") + "\n"); } catch {}
  await cleanup();
  process.exit(2);
}
