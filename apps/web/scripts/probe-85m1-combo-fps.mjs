#!/usr/bin/env node
/**
 * probe-85m1-combo-fps.mjs — Phase 9 đợt 85, luồng M1: đo FPS COMBO
 * deint + chroma key + LUT + canvas effects + denoise + stabilize trên
 * cùng clip interlaced720 (G1 §6.4 — chưa từng đo).
 *
 * Nợ: G1 §6.1/§6.4 (đợt 79) → K3 §7.5 (đợt 83). Câu hỏi: đường
 * intermediate vẫn đọc video — khi bật thêm chroma/LUT/effects thì
 * FPS còn bao nhiêu so với baseline (không enhance)? Deint-only đã
 * đo nhiều (K3 pool 15 lần median 0,84× ở chế độ ~2–5 fps); combo
 * chưa có số nào.
 *
 * Cách đo: tái dùng đúng cơ chế harness E1 (clicktest-77e1-deint-fps.mjs):
 * vite dev + Xvfb + Chrome headed (--disable-gpu), project mẫu 3 clip,
 * clip 1 → interlaced720.mp4, 11 slot × 3s xen kẽ [B,C,B,C,...] với
 * B = baseline (mọi enhance/chroma/LUT/effects TẮT), C = combo
 * (enhance deinterlace + denoise + stabilize smoothing 10,
 * chromaKey mặc định #00FF00/0.3/0.1, filter.lut "vcut-cinematic",
 * effects sharpen 0.5 + noise 0.3), tỉ lệ drift-corrected như G5 E1.
 * Bật/tắt combo qua patchClip (đúng action panel dùng; patch
 * {enhance: undefined, ...} là cách EnhancePanel tắt enhance).
 * Xác nhận combo áp thật: đọc lại state clip + hook tap + snapshot
 * MAD combo-vs-baseline > 0 (pixel đổi thật, không phải toggle chết).
 *
 * Đây là PROBE thăm dò, không phải gate: exit 0 khi đo xong và ghi
 * report (dù tỉ lệ < 0,75× — ghi rõ so ngưỡng để tham khảo, không
 * kết luận PASS/FAIL sản phẩm); exit 1 chỉ khi harness lỗi.
 * KHÔNG sửa code sản phẩm. KHÔNG push/tag/binary.
 *
 * Chạy (từ gốc repo, SAU khi đo 5 lần E1 xong để khỏi nhiễu chéo):
 *   M1_COMBO_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round84-l3/combo \
 *     M1_COMBO_DEV_PORT=5595 M1_COMBO_DEBUG_PORT=9695 M1_COMBO_DISPLAY=:195 \
 *     node apps/web/scripts/probe-84l3-combo-fps.mjs
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
const MEDIA_DIR = path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const SCRATCH = process.env.M1_COMBO_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round85-m1", "combo");
const WIN = process.env.M1_COMBO_WINDOW || "2560x1440";
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round85-m1/combo";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.combo.config.mjs");
const CHROME_PW = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
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
const CHROME = fs.existsSync(CHROME_PW) ? CHROME_PW : findChrome();

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
  window.__l3errors = [];
  window.addEventListener("error", (e) => { try { window.__l3errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__l3errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__l3errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__l3errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__l3storeMod || (window.__l3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
    chromaKey: c.chromaKey ?? null, filter: c.filter ?? null, effects: c.effects ?? null,
    src: c.src ?? null,
  });
  const hook = window.__vcutPreviewEnhance ? { ...window.__vcutPreviewEnhance } : null;
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const hold = window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null;
  const canvas = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  return {
    clips, selection: st.selection, playhead: st.playhead, playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled, hook, idle, hold,
    canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    scaleY: canvas ? +(Math.min(canvas.width / 1280, canvas.height / 720)).toFixed(3) : null,
    errors: (window.__l3errors || []).slice(),
  };
})()`;

const SAMPLE_FN = `(() => {
  const st = window.__l3storeMod ? window.__l3storeMod.useStore.getState() : null;
  return {
    draw: window.__vcutHoldStats ? window.__vcutHoldStats.draw : null,
    ticks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    ph: st ? st.playhead : null,
    playing: st ? st.playing : null,
    wall: performance.now(),
  };
})()`;

const RAF_STATS_TIME_FN = (t0, t1) => `(() => {
  const h = window.__vcutPreviewRaf;
  if (!h) return null;
  const s = h.samples.filter((x) => x.t >= ${t0} && x.t <= ${t1} && x.playing && !x.justWoke);
  if (!s.length) return { n: 0 };
  const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
  const p = (q) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  return { n: s.length, gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1),
    gapMax: +gaps[gaps.length - 1].toFixed(1), over100: s.filter((x) => x.gapMs > 100).length,
    lostMs: +s.reduce((a, x) => a + x.lostMs, 0).toFixed(0) };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

// Đọc lại đúng clip đang đo (đủ field combo để xác nhận áp thật).
const CLIP_FN = (trackId, clipId) => `(async () => {
  const st = await (${STORE_FN});
  const c = st.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)}).clips.find((x) => x.id === ${JSON.stringify(clipId)});
  if (!c) return null;
  return { enhance: c.enhance ?? null, chromaKey: c.chromaKey ?? null, filter: c.filter ?? null,
    effects: c.effects ?? null, src: c.src ?? null };
})()`;

// patchClip qua store thật (đúng action panel dùng). undefined = tắt (mẫu EnhancePanel dropKey).
const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  return { patched: n };
})()`;
// LƯU Ý: JSON.stringify(COMBO_OFF) ra "{}" (undefined bị lược) nên patch
// tắt PHẢI viết literal trực tiếp, không qua JSON.stringify.
const PATCH_OFF_FN = (trackId, clipId) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, { enhance: undefined, chromaKey: undefined, filter: undefined, effects: undefined });
  return { patched: n };
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

const PREVIEW_CANVAS_STATS_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  let sum = 0, sum2 = 0, n = 0;
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
    const i = (y * W + x) * 4;
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    sum += l; sum2 += l * l; n++;
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  return { ok: true, w: W, h: H, mean: +mean.toFixed(2), std: +std.toFixed(2), n };
})()`;

const SNAPSHOT_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const px = [];
  for (let y = y0; y < y1; y += 4) for (let x = x0; x < x1; x += 4) {
    const i = (y * W + x) * 4;
    px.push(d[i], d[i + 1], d[i + 2]);
  }
  window.__l3snap = { w: W, h: H, px };
  return { ok: true, w: W, h: H, n: px.length / 3 };
})()`;
const SNAPDIFF_FN = `(() => {
  const snap = window.__l3snap;
  if (!snap) return { ok: false, reason: "chưa có snapshot" };
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  if (c.width !== snap.w || c.height !== snap.h) return { ok: false, reason: "canvas đổi kích thước" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  let sum = 0, cnt = 0, changed = 0, idx = 0;
  for (let y = y0; y < y1; y += 4) for (let x = x0; x < x1; x += 4) {
    const i = (y * W + x) * 4;
    for (let ch = 0; ch < 3; ch++) {
      const diff = Math.abs(d[i + ch] - snap.px[idx++]);
      sum += diff; cnt++;
      if (diff > 0) changed++;
    }
  }
  return { ok: true, meanAbsDiff: +(sum / cnt).toFixed(4), pctChanged: +(100 * changed / cnt).toFixed(2), n: cnt };
})()`;

// Combo bật (đúng giá trị mặc định panel dùng) / tắt (undefined từng key).
const COMBO_ON = {
  enhance: { deinterlace: true, denoise: true, stabilize: { smoothing: 10 } },
  chromaKey: { color: "#00FF00", similarity: 0.3, blend: 0.1 },
  filter: { lut: "vcut-cinematic" },
  effects: [{ type: "sharpen", intensity: 0.5 }, { type: "noise", intensity: 0.3 }],
};
const COMBO_OFF = { enhance: undefined, chromaKey: undefined, filter: undefined, effects: undefined };

const results = [];
const phaseErrors = [];
function pass(name, detail) { results.push({ name, ok: true, detail }); log(`PASS ${name}: ${detail}`); }
function fail(name, detail) { results.push({ name, ok: false, detail }); log(`FAIL ${name}: ${detail}`); }

let vite = null, xvfb = null, chrome = null;
function killAll() {
  try { chrome?.kill("SIGKILL"); } catch {}
  try { xvfb?.kill("SIGKILL"); } catch {}
  try { vite?.kill("SIGKILL"); } catch {}
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  let DEV_PORT = Number(process.env.M1_COMBO_DEV_PORT || 0) || (await pickFreePort(5580, 5589));
  let DEBUG_PORT = Number(process.env.M1_COMBO_DEBUG_PORT || 0) || (await pickFreePort(9680, 9689));
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 180; n <= 199; n++) {
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
  const DISPLAY = process.env.M1_COMBO_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:199");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5580–5589");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9680–9689");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  let DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  let MEDIA_URL = (f) => `${DEV_URL}r85m1-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  const TMPDIR = "/tmp/round85-m1/combo/tmp";
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
const mediaPlugin = () => ({ name: "l3-media", configureServer(server) {
  server.middlewares.use("/r85m1-media", (req, res) => {
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
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, cửa sổ ${WIN}, loadavg ${loadAvg()}`);

  const viteLogFd = fs.openSync(path.join(SCRATCH, "combo-vite.log"), "w");
  let viteOk = false;
  for (let attempt = 0; attempt < 3 && !viteOk; attempt++) {
    if (attempt > 0) {
      try { vite?.kill("SIGKILL"); } catch {}
      DEV_PORT = Number(process.env.M1_COMBO_DEV_PORT || 0) || (await pickFreePort(5580, 5589));
      DEBUG_PORT = Number(process.env.M1_COMBO_DEBUG_PORT || 0) || (await pickFreePort(9680, 9689));
      if (!DEV_PORT || !DEBUG_PORT) throw new Error("hết cổng trống sau khi thử lại");
      DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
      MEDIA_URL = (f) => `${DEV_URL}r85m1-media/${f}`;
      log(`thử lại vite lần ${attempt + 1}: dev :${DEV_PORT}, debug :${DEBUG_PORT}`);
    }
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      if (vite.exitCode !== null) break;
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) { log(`vite :${DEV_PORT} không lên (exit ${vite.exitCode}) — thử cổng khác`); continue; }
    const mediaProbe = await fetch(MEDIA_URL("clean720.mp4"), { headers: { Range: "bytes=0-99" } });
    if (mediaProbe.status !== 206) { log(`media probe :${DEV_PORT} trả ${mediaProbe.status} (không phải 206) — thử cổng khác`); continue; }
    viteOk = true;
  }
  if (!viteOk) throw new Error("vite dev + media probe không lên sau 3 lần thử");
  log("vite dev đã lên");

  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", `${WIN}x24`], { stdio: "ignore" });
  {
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
      else await sleep(500);
    }
    if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s`);
  }
  if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "combo-chrome.log"), "w");
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
    "--window-size=" + WIN.replace("x", ",") + "", "--hide-scrollbars", "about:blank"],
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
  try {
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
  } catch (e) {
    // Mount nằm ngoài try chính: lỗi ở đây phải tự dọn (killAll) + ghi log,
    // không để process crash không để lại report.
    log(`HARNESS LỖI (mount): ${e.message}`);
    killAll();
    try { writeFileEpermRetry(path.join(SCRATCH, "combo.log"), logLines.join("\n") + "\n"); } catch {}
    return 2;
  }
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
  function drainErrors() {
    return cdp.evalJs(`(window.__l3errors || []).slice()`).then((e) => { phaseErrors.push(...e); return e; }).catch(() => []);
  }

  try {
    const modalGone = await ensureNoModal();
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- C0: project mẫu + canvas đủ lớn ---------------------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện", 180000);
    const firstClipId = s0.clips.find((c) => c.trackId === "v1").clipId;
    log(`project mẫu: canvas preview backing ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY}, clip video đầu ${firstClipId}, loadavg ${loadAvg()}`);
    if (!(s0.scaleY !== null && s0.scaleY >= 0.9)) throw new Error(`canvas scaleY ${s0.scaleY} < 0.9 — không đo combo ở chế độ scale075`);
    pass("C0 canvas đủ lớn cho combo", `canvas ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY} ≥ 0.9 — chế độ main`);
    await drainErrors();
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (C0)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu", 60000);

    // ---- Đổi src clip 1 → interlaced720 ----------------------------------
    const added = await cdp.evalJs(`(async () => {
      const st = await (${STORE_FN});
      const url = ${JSON.stringify(MEDIA_URL("interlaced720.mp4"))};
      window.__l3storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-l3-combo", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st2 = window.__l3storeMod.useStore.getState();
      const clip = st2.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__l3storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      const st3 = window.__l3storeMod.useStore.getState();
      return { mediaLen: st3.media.length, clipSrc: st3.spec.tracks.find((t) => t.id === "v1").clips[0].src };
    })()`);
    if (added.clipSrc !== "interlaced720.mp4") throw new Error(`patchClip src không đổi (đang ${added.clipSrc})`);
    log(`đã đổi src clip 1 → interlaced720.mp4 (media ${added.mediaLen} item)`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced tại playhead 1.0", 60000);
    await sleep(500);
    const shotInter = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
    if (!shotInter.ok) throw new Error(`đọc canvas preview thất bại: ${shotInter.reason}`);
    log(`canvas interlaced @1.0s: mean=${shotInter.mean} std=${shotInter.std} (n=${shotInter.n})`);
    if (shotInter.std < 8) throw new Error(`canvas vẫn phẳng/placeholder (std ${shotInter.std} < 8) — frame interlaced chưa vẽ được`);

    // ---- C1: bật combo, xác nhận áp thật ----------------------------------
    await cdp.evalJs(PATCH_FN("v1", firstClipId, JSON.stringify(COMBO_ON)));
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview combo tại playhead 1.0", 60000);
    await sleep(500);
    const clipOn = await cdp.evalJs(CLIP_FN("v1", firstClipId));
    const hookOn = (await cdp.evalJs(STATE_FN)).hook;
    const comboOk = clipOn
      && clipOn.enhance?.deinterlace === true && clipOn.enhance?.denoise === true
      && clipOn.enhance?.stabilize?.smoothing === 10
      && clipOn.chromaKey?.color === "#00FF00" && clipOn.filter?.lut === "vcut-cinematic"
      && Array.isArray(clipOn.effects) && clipOn.effects.length === 2
      && hookOn && hookOn.deinterlaceTap === true;
    // Snapshot baseline TRƯỚC khi so: chụp baseline rồi bật lại combo để so MAD.
    await cdp.evalJs(PATCH_OFF_FN("v1", firstClipId));
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview baseline lại tại playhead 1.0", 60000);
    await sleep(500);
    const snapBase = await cdp.evalJs(SNAPSHOT_FN);
    if (!snapBase.ok) throw new Error(`snapshot baseline thất bại: ${snapBase.reason}`);
    await cdp.evalJs(PATCH_FN("v1", firstClipId, JSON.stringify(COMBO_ON)));
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview combo lại tại playhead 1.0", 60000);
    await sleep(500);
    const diffCombo = await cdp.evalJs(SNAPDIFF_FN);
    if (!diffCombo.ok) throw new Error(`so snapshot combo thất bại: ${diffCombo.reason}`);
    log(`combo state: enhance=${JSON.stringify(clipOn?.enhance)} chroma=${JSON.stringify(clipOn?.chromaKey)} lut=${clipOn?.filter?.lut} effects=${JSON.stringify(clipOn?.effects)} hookTap=${hookOn?.deinterlaceTap} MADvsBase=${diffCombo.meanAbsDiff} (${diffCombo.pctChanged}% đổi)`);
    if (comboOk && diffCombo.meanAbsDiff > 0.05) {
      pass("C1 combo áp thật (pixel đổi)", `deint+denoise+stabilize+chroma#L00FF00+LUT vcut-cinematic+sharpen/noise, hook tap=true, MAD vs baseline=${diffCombo.meanAbsDiff} (${diffCombo.pctChanged}% pixel đổi)`);
    } else {
      fail("C1 combo áp thật (pixel đổi)", `comboOk=${comboOk} MAD=${diffCombo.meanAbsDiff} clip=${JSON.stringify(clipOn)} hook=${JSON.stringify(hookOn)}`);
    }

    // ---- C2: FPS xen kẽ [B,C,B,C,B,C,B,C,B,C,B] ---------------------------
    async function setCombo(want) {
      if (want) await cdp.evalJs(PATCH_FN("v1", firstClipId, JSON.stringify(COMBO_ON)));
      else await cdp.evalJs(PATCH_OFF_FN("v1", firstClipId));
      const c = await cdp.evalJs(CLIP_FN("v1", firstClipId));
      const on = !!(c?.enhance?.deinterlace && c?.chromaKey && c?.filter?.lut && c?.effects?.length);
      if (on !== want) throw new Error(`combo không về ${want} (clip=${JSON.stringify(c)})`);
    }
    const fpsSlots = [];
    async function measureFpsSlot(key, slotIdx) {
      const want = key === "combo";
      await setCombo(want);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(`${key} slot ${slotIdx} seek 0`);
      const loadBefore = loadAvg();
      await togglePlay();
      await sleep(800);
      const a = await cdp.evalJs(SAMPLE_FN);
      if (!a.playing) throw new Error(`${key} slot ${slotIdx}: bấm Space mà playing vẫn false`);
      const trace = [];
      let b = await cdp.evalJs(SAMPLE_FN);
      trace.push({ t: +((b.wall - a.wall) / 1000).toFixed(2), ph: b.ph, draw: b.draw });
      // Lấy mẫu theo thời gian (tối đa ~3s), KHÔNG theo số lần cố định:
      // evalJs chậm dưới tải làm vòng đếm cố định kéo slot dài quá,
      // playhead chạm cuối timeline → tự dừng → Space sau đó lại PHÁT.
      let guard = 0;
      while ((b.wall - a.wall) < 3000 && guard++ < 20) {
        await sleep(250);
        b = await cdp.evalJs(SAMPLE_FN);
        trace.push({ t: +((b.wall - a.wall) / 1000).toFixed(2), ph: b.ph, draw: b.draw });
      }
      const prePause = await cdp.evalJs(STATE_FN);
      if (prePause.playing) {
        await togglePlay();
        await sleep(400);
      }
      const after = await cdp.evalJs(STATE_FN);
      if (after.playing) throw new Error(`${key} slot ${slotIdx}: bấm Space lần 2 mà playing vẫn true`);
      const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(a.wall, b.wall));
      const dt = (b.wall - a.wall) / 1000;
      const row = {
        slot: slotIdx, config: key,
        drawFps: +((b.draw - a.draw) / dt).toFixed(2),
        tickFps: +((b.ticks - a.ticks) / dt).toFixed(2),
        playheadRate: +(((b.ph - a.ph) / dt)).toFixed(2),
        phTrace: trace,
        phMaxJump: +Math.max(0, ...trace.slice(1).map((x, i) => x.ph - trace[i].ph)).toFixed(2),
        hitEnd: !prePause.playing,
        raf: rafStats, loadBefore, loadAfter: loadAvg(),
      };
      fpsSlots.push(row);
      log(`FPS slot ${slotIdx} ${key}: draw ${row.drawFps} fps, tick ${row.tickFps} fps, playhead ${row.playheadRate}x, gapP50 ${rafStats?.gapP50 ?? "?"}ms, load ${loadBefore} → ${row.loadAfter}`);
      return row;
    }
    const FPS_ORDER = ["baseline", "combo", "baseline", "combo", "baseline", "combo", "baseline", "combo", "baseline", "combo", "baseline"];
    for (let i = 0; i < FPS_ORDER.length; i++) await measureFpsSlot(FPS_ORDER[i], i);
    const baseFps = [fpsSlots[0].drawFps, fpsSlots[2].drawFps, fpsSlots[4].drawFps, fpsSlots[6].drawFps, fpsSlots[8].drawFps, fpsSlots[10].drawFps];
    const baseMean = baseFps.reduce((a, b) => a + b, 0) / baseFps.length;
    const comboFps = [fpsSlots[1].drawFps, fpsSlots[3].drawFps, fpsSlots[5].drawFps, fpsSlots[7].drawFps, fpsSlots[9].drawFps];
    const comboMean = comboFps.reduce((a, b) => a + b, 0) / comboFps.length;
    const ratio = (slot, before, after) => {
      const neighbor = (before + after) / 2;
      return neighbor > 0 ? +(slot / neighbor).toFixed(2) : null;
    };
    const ratios = [1, 3, 5, 7, 9].map((i) => ratio(fpsSlots[i].drawFps, fpsSlots[i - 1].drawFps, fpsSlots[i + 1].drawFps));
    const rMean = +((ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2));
    log(`FPS combo: baseline mean ${baseMean.toFixed(2)} fps, combo mean ${comboMean.toFixed(2)} fps, tỉ lệ drift-corrected ${ratios.join(" / ")} → mean ${rMean}x (ngưỡng tham khảo 0.75x)`);
    // Probe thăm dò: luôn ghi số, không FAIL sản phẩm theo ngưỡng (xem header).
    pass("C2 FPS combo đo được (ghi số, không gate)", `tỉ lệ ${ratios.join("/")} → ${rMean}x, baseline ${baseMean.toFixed(2)} fps, combo ${comboMean.toFixed(2)} fps, load ${loadAvg()} (ngưỡng tham khảo 0.75x: ${rMean >= 0.75 ? "ĐẠT" : "CHƯA ĐẠT"})`);

    // ---- C3: 0 lỗi trang ---------------------------------------------------
    await drainErrors();
    if (phaseErrors.length === 0) {
      pass("C3 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    } else {
      fail("C3 0 lỗi trang", `${phaseErrors.length} lỗi: ${phaseErrors.slice(0, 3).join(" | ")}`);
    }

    const report = { cases: results, pass: results.filter((r) => r.ok).length, total: results.length,
      fpsSlots, baseMean: +baseMean.toFixed(2), comboMean: +comboMean.toFixed(2), ratios, ratioMean: rMean,
      canvasSize: `${s0.canvasW}x${s0.canvasH}`, scaleY: s0.scaleY };
    writeFileEpermRetry(path.join(SCRATCH, "combo-report.json"), JSON.stringify(report, null, 2));
    log(`KẾT QUẢ COMBO L3: ${report.pass}/${report.total} pass, ratioMean ${rMean}x`);
    return report.pass === report.total ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e.message}`);
    try {
      const partial = { cases: results, pass: results.filter((r) => r.ok).length, total: results.length, error: e.message };
      writeFileEpermRetry(path.join(SCRATCH, "combo-report.json"), JSON.stringify(partial, null, 2));
    } catch {}
    return 2;
  } finally {
    killAll();
    try { writeFileEpermRetry(path.join(SCRATCH, "combo.log"), logLines.join("\n") + "\n"); } catch {}
  }
}

process.exitCode = await main();
