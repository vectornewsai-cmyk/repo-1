#!/usr/bin/env node
/**
 * probe-78f1-tick-time.mjs — Phase 9 đợt 78, luồng F1: đo FPS deint-only
 * bằng THỜI GIAN TICK TRỰC TIẾP (nợ G5 đợt 77 E1 — mọi đường 2 lần vẽ
 * đều ~0,7–0,8× trong nhiễu đo, ngưỡng 0,75× giữ nguyên).
 *
 * Khác harness E1 (đếm draw/3s — ở ~2 fps mỗi slot chỉ ~6 lần vẽ,
 * lượng tử hoá ±17%): probe này đo 3 thứ độc lập trong cùng slot 10s:
 *   (a) draw fps / tick fps như E1 (đếm __vcutHoldStats.draw và
 *       __vcutPreviewIdle.ticks) — để so trực tiếp với E1/D4 (slot
 *       4,5s vì clip 1 chỉ dài 5s sau khi nới out 4→5: playhead 0→4,5s
 *       vẫn trong clip 1; slot 10s đã thử và FAIL vì phát chạy hết
 *       timeline rồi Space bấm lại thành phát tiếp);
 *   (b) ms/tick TRỰC TIẾP từ hook __vcutPreviewRaf (gapMs giữa các
 *       callback rAF của riêng vòng preview, loại justWoke): gap P50 /
 *       mean — không còn lượng tử hoá theo số lần vẽ;
 *   (c) phân rã chi phí vẽ: bọc CanvasRenderingContext2D.prototype.
 *       drawImage, cộng dồn ms + số lần gọi theo khổ canvas đích
 *       (preview 1991x815 vs intermediate 1280x360) — tách "chi phí
 *       lần vẽ thêm của deint" khỏi "chi phí cố định của tick"
 *       (decode/React/tải).
 * Chỉ chạy G0–G5 + H9 (bỏ G6/G7/G8 của E1 — không cần cho câu hỏi FPS).
 * 11 slot xen kẽ [B,I,B,I,B,I,B,I,B,I,B] × 4,5s, tỉ lệ drift-corrected
 * như E1. KHÔNG sửa code sản phẩm. KHÔNG push/tag/binary.
 *
 * Chạy (từ gốc repo):
 *   F1_SCRATCH=... F1_DEV_PORT=5597 F1_DEBUG_PORT=9697 F1_DISPLAY=:197 \
 *     node apps/web/scripts/probe-78f1-tick-time.mjs
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
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
const SCRATCH = process.env.F1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round78-f1", "headed");
const WIN = process.env.F1_WINDOW || "2560x1440";
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round78-f1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.e1.headed.config.mjs");
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
  window.__f1errors = [];
  window.addEventListener("error", (e) => { try { window.__f1errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__f1errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__f1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__f1errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__f1storeMod || (window.__f1storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
    mask: c.mask ?? null, animations: c.animations ?? null, motion: c.motion ?? null,
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
    errors: (window.__f1errors || []).slice(),
  };
})()`;

const SAMPLE_FN = `(() => {
  const st = window.__f1storeMod ? window.__f1storeMod.useStore.getState() : null;
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
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return { n: s.length, gapMean: +mean.toFixed(1), gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1),
    gapMax: +gaps[gaps.length - 1].toFixed(1), over100: s.filter((x) => x.gapMs > 100).length,
    lostMs: +s.reduce((a, x) => a + x.lostMs, 0).toFixed(0) };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const st2 = window.__f1storeMod.useStore.getState();
  const c = st2.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)}).clips.find((x) => x.id === ${JSON.stringify(clipId)});
  return { patched: n, clip: { enhance: c.enhance ?? null, mask: c.mask ?? null, animations: c.animations ?? null, motion: c.motion ?? null, src: c.src } };
})()`;

// patchClip qua store thật (đúng action panel dùng) — mẫu 61R3 combo.
const SR_ONLY_PATCH = JSON.stringify({
  animations: { scale: { keyframes: [{ t: 0, v: 1.2 }, { t: 4, v: 1.2 }] } },
  motion: { interpolation: "none", motionBlur: { frames: 4, weights: [0.25, 0.25, 0.25, 0.25] } },
});
const MASK_ONLY_PATCH = JSON.stringify({
  mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.2 },
});

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
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

// Combing trên canvas preview thật (mẫu D3 đợt 61 R3).
const PREVIEW_COMBING_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const lum = (x, y) => { const i = (y * W + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
  let cross = 0, same = 0, n = 0;
  for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
    cross += Math.abs(lum(x, y) - lum(x, y + 1));
    same += Math.abs(lum(x, y) - lum(x, y + 2));
    n++;
  }
  const cm = cross / n, sm = same / n;
  return { ok: true, w: W, h: H, cross: +cm.toFixed(3), same: +sm.toFixed(3),
    ratio: +(cm / Math.max(sm, 0.001)).toFixed(2), n };
})()`;

// Thống kê luma canvas preview (cổng frame thật: std ≥ 8).
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

// Snapshot pixel canvas preview (lấy mẫu mỗi 4px, vùng trung tâm) + so MAD.
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
  window.__f1snap = { w: W, h: H, px };
  return { ok: true, w: W, h: H, n: px.length / 3 };
})()`;
const SNAPDIFF_FN = `(() => {
  const snap = window.__f1snap;
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

// Đợt 78 F1 — bọc drawImage để phân rã chi phí vẽ theo khổ canvas đích.
// Bọc prototype nên mọi lần gọi sau khi cài đều bị chặn, kể cả code đã
// load trước. performance.now() quanh lần gọi gốc; chi phí bọc ~µs/lần.
const DRAW_WRAP_FN = `(() => {
  if (window.__f1draw) return "already";
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  const stats = {};
  window.__f1draw = { stats, reset() { for (const k of Object.keys(stats)) delete stats[k]; } };
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    const t0 = performance.now();
    try { return orig.apply(this, args); } finally {
      const dt = performance.now() - t0;
      const c = this.canvas;
      const key = c ? (c.width + "x" + c.height) : "?";
      const s = stats[key] || (stats[key] = { calls: 0, ms: 0 });
      s.calls++; s.ms += dt;
    }
  };
  return "installed";
})()`;
const DRAW_RESET_FN = `window.__f1draw && window.__f1draw.reset(), "reset"`;
const DRAW_READ_FN = `(() => {
  const s = window.__f1draw ? window.__f1draw.stats : {};
  const out = {};
  for (const [k, v] of Object.entries(s)) out[k] = { calls: v.calls, ms: +v.ms.toFixed(1), msPerCall: +(v.ms / Math.max(1, v.calls)).toFixed(2) };
  return out;
})()`;

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
  let DEV_PORT = Number(process.env.F1_DEV_PORT || 0) || (await pickFreePort(5580, 5589));
  let DEBUG_PORT = Number(process.env.F1_DEBUG_PORT || 0) || (await pickFreePort(9680, 9689));
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
  const DISPLAY = process.env.F1_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5580–5589");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9680–9689");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  let DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  let MEDIA_URL = (f) => `${DEV_URL}r78f1-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  const TMPDIR = "/tmp/round78-f1/tmp";
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
const mediaPlugin = () => ({ name: "d4-media", configureServer(server) {
  server.middlewares.use("/r78f1-media", (req, res) => {
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

  const viteLogFd = fs.openSync(path.join(SCRATCH, "c78f1-headed-vite.log"), "w");
  // Thử tối đa 3 lần: vòng 77 nhiều luồng song song, cổng có thể bị luồng
  // khác chiếm giữa lúc pickFreePort và lúc vite bind (E9 đã chiếm 5580
  // ở lần chạy baseline đầu — vite chết EADDRINUSE nhưng fetch(DEV_URL)
  // vẫn "lên" vì trúng server của luồng khác, media probe 200 thay vì
  // 206). Mỗi lần thử lại đều kiểm tra cả vite sống + media probe 206.
  // Đợt 91 S6 (R6 §7 mục 4 — nợ đợt 90 §4 mục 6): chẩn đoán cuối vòng
  // KHÔNG còn "(cổng bị chiếm?)" mặc định — Q7 §3.1 chứng minh chẩn đoán
  // đó SAI khi vite exit 1 do EPERM (cổng trống, log 0 byte). Thứ tự:
  // EPERM trước, port conflict sau (EADDRINUSE trong log hoặc cổng vẫn
  // trả lời sau khi vite thoát). Lưu ý: probe này ghi vite log qua fd
  // file nên dưới sóng EPERM file có thể 0 byte — chẩn đoán khi đó chỉ
  // là "chưa rõ" kèm cờ cổng-vẫn-trả-lời, không khẳng định cổng bị chiếm.
  let viteOk = false;
  const viteAttempts = [];
  for (let attempt = 0; attempt < 3 && !viteOk; attempt++) {
    if (attempt > 0) {
      try { vite?.kill("SIGKILL"); } catch {}
      DEV_PORT = Number(process.env.F1_DEV_PORT || 0) || (await pickFreePort(5580, 5589));
      DEBUG_PORT = Number(process.env.F1_DEBUG_PORT || 0) || (await pickFreePort(9680, 9689));
      if (!DEV_PORT || !DEBUG_PORT) throw new Error("hết cổng trống sau khi thử lại");
      DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
      MEDIA_URL = (f) => `${DEV_URL}r78f1-media/${f}`;
      log(`thử lại vite lần ${attempt + 1}: dev :${DEV_PORT}, debug :${DEBUG_PORT}`);
    }
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      if (vite.exitCode !== null) break;
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    const rec = { port: DEV_PORT, exitCode: vite.exitCode, mediaStatus: null, portStillServes: false };
    if (!up) {
      // Vite đã thoát mà cổng vẫn trả lời → server khác (mồ côi) đang giữ cổng.
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(2000) }); rec.portStillServes = r.ok; } catch {}
      viteAttempts.push(rec);
      log(`vite :${DEV_PORT} không lên (exit ${vite.exitCode}) — thử cổng khác`);
      continue;
    }
    const mediaProbe = await fetch(MEDIA_URL("clean720.mp4"), { headers: { Range: "bytes=0-99" } });
    rec.mediaStatus = mediaProbe.status;
    if (mediaProbe.status !== 206) {
      viteAttempts.push(rec);
      log(`media probe :${DEV_PORT} trả ${mediaProbe.status} (không phải 206 — có thể trúng server luồng khác) — thử cổng khác`);
      continue;
    }
    viteAttempts.push(rec);
    viteOk = true;
  }
  if (!viteOk) {
    let viteLogText = "";
    try { viteLogText = fs.readFileSync(path.join(SCRATCH, "c78f1-headed-vite.log"), "utf8"); } catch {}
    const hasEperm = /Operation not permitted|EPERM|npm error code EPERM/.test(viteLogText);
    // Đợt 92 T6 (S6 §6.11): vite in thông báo thân thiện "Port 5580 is
    // already in use" thay vì EADDRINUSE — mẫu thứ ba khớp cả hai dạng.
    const hasAddrInUse = /EADDRINUSE|address already in use|Port \d+ is already in use/i.test(viteLogText);
    const foreignServer = viteAttempts.some((a) => a.portStillServes) || viteAttempts.some((a) => a.mediaStatus === 200);
    const diagnosis = hasEperm
      ? "EPERM (vite exit 1, log chứa 'Operation not permitted' — sóng EPERM, KHÔNG phải cổng bị chiếm)"
      : hasAddrInUse || foreignServer
        ? "cổng bị chiếm (EADDRINUSE trong log hoặc cổng vẫn trả lời sau khi vite thoát — có server khác/mồ côi giữ cổng)"
        : "chưa rõ nguyên nhân (không thấy dấu EPERM hay EADDRINUSE — xem đuôi log từng lần thử bên dưới; lưu ý: dưới sóng EPERM file log vite có thể 0 byte)";
    const perAttempt = viteAttempts.map((a, i) =>
      `lần ${i + 1}: cổng :${a.port}, exit ${a.exitCode}, media ${a.mediaStatus ?? "—"}, cổng-vẫn-trả-lời=${a.portStillServes}`).join(" | ");
    throw new Error(`vite dev + media probe không lên sau 3 lần thử — chẩn đoán: ${diagnosis}. ${perAttempt}`);
  }
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
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "c78f1-headed-chrome.log"), "w");
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
  await cdp.waitFor(async () => {
    const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
    return s;
  }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
  log("app đã mount");
  const drawWrap = await cdp.evalJs(DRAW_WRAP_FN);
  log(`bọc drawImage: ${drawWrap}`);

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
  async function clickEnhCheckbox(testid, label) {
    const g = await cdp.evalJs(CLICK_ENH_FN(testid));
    if (!g) throw new Error(`không tìm thấy [data-testid="${testid}"] (${label})`);
    if (g.coveredBy) log(`cảnh báo: ${testid} bị che bởi ${g.coveredBy} tại điểm bấm — vẫn thử bấm`);
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
    const has2 = !!(enh2 && enh2[key]);
    if (has2 !== want) throw new Error(`checkbox ${key} không về ${want} (đang ${has2}, enhance=${JSON.stringify(enh2)})`);
    return after;
  }
  // F1 (run E): bật/tắt phát qua store thay vì phím Space — Space/K gọi
  // đúng store.togglePlay (store.ts:923) nhưng phím còn phụ thuộc focus
  // và nhịp tick (run D slot 4: Space 2 lần vẫn playing=true sau 8s).
  // Dừng dùng setState({playing:false}) trực tiếp để không đi qua nhánh
  // "hết video -> phát lại từ đầu" của togglePlay.
  async function togglePlay() {
    await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); st.togglePlay(); return st.playing; })()`);
  }
  async function pausePlayback() {
    await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); window.__f1storeMod.useStore.setState({ playing: false }); return true; })()`);
  }
  async function drainErrors() {
    const e = (await cdp.evalJs(`(window.__f1errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__f1errors = []`).catch(() => {});
    return e;
  }

  try {
    const modalGone = await ensureNoModal();
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- G0: project mẫu + canvas đủ lớn ---------------------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện", 180000);
    const firstClipId = s0.clips.find((c) => c.trackId === "v1").clipId;
    log(`project mẫu: canvas preview backing ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY}, clip video đầu ${firstClipId}, loadavg ${loadAvg()}`);
    // Đợt 76 D4: 2 chế độ trong 1 script — scaleY ≥ 0.9 chạy G1–G5+G7+G8;
    // scaleY < 0.9 (cửa sổ nhỏ F1_WINDOW=1700x1000) chỉ chạy G6 (tap phải
    // TẮT) + H9. Không throw ở G0 nữa (C8 throw vì chỉ có 1 chế độ).
    const mainMode = s0.scaleY !== null && s0.scaleY >= 0.9;
    if (mainMode) {
      pass("G0 canvas đủ lớn cho tap khử răng cưa", `canvas ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY} ≥ 0.9 (ngưỡng đợt 76 D4) — chế độ main`);
    } else {
      pass("G0 chế độ scale075 (tap phải TẮT dưới ngưỡng 0.9)", `canvas ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY} < 0.9 — chạy G6 thay vì G1–G5/G7+G8`);
    }
    await drainErrors();
    let fpsSlots = [];
    if (mainMode) {
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (G0)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu", 60000);

    // ---- Đổi src clip 1 → interlaced720 (mẫu D3 đợt 61 R3) ---------------
    const added = await cdp.evalJs(`(async () => {
      const st = await (${STORE_FN});
      const url = ${JSON.stringify(MEDIA_URL("interlaced720.mp4"))};
      window.__f1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st2 = window.__f1storeMod.useStore.getState();
      const clip = st2.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      const st3 = window.__f1storeMod.useStore.getState();
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

    // ---- G1: baseline deint TẮT --------------------------------------------
    const hookA = (await cdp.evalJs(STATE_FN)).hook;
    const combA = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!combA.ok) throw new Error(`đo combing baseline thất bại: ${combA.reason}`);
    const snapA = await cdp.evalJs(SNAPSHOT_FN);
    if (!snapA.ok) throw new Error(`snapshot A thất bại: ${snapA.reason}`);
    log(`G1 baseline interlaced: R=${combA.ratio} (C=${combA.cross} S=${combA.same}), hook tap=${hookA?.deinterlaceTap} applied=${JSON.stringify(hookA?.applied)} offscreen=${hookA?.offscreenApplied}, snapshot ${snapA.n} pixel`);
    // Đối chứng progressive CÙNG cỡ canvas, deint vẫn TẮT (lần 2 — lần 1
    // so R tuyệt đối với probe 1:1 nên fail oan: app vẽ upscale 1.13x,
    // R gốc chỉ 0.74 thay vì 1.12).
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
      window.__f1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-clean-base", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__f1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview progressive baseline tại playhead 1.0", 60000);
    await sleep(500);
    const combCleanBase = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!combCleanBase.ok) throw new Error(`đo combing đối chứng baseline thất bại: ${combCleanBase.reason}`);
    log(`G1 đối chứng progressive (deint TẮT): R=${combCleanBase.ratio} (C=${combCleanBase.cross} S=${combCleanBase.same})`);
    // Trả clip về interlaced để chụp lại snapshot A (snapshot phải là
    // interlaced baseline, không phải progressive).
    await cdp.evalJs(`(async () => {
      const st = window.__f1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced baseline lại tại playhead 1.0", 60000);
    await sleep(500);
    const snapA2 = await cdp.evalJs(SNAPSHOT_FN);
    if (!snapA2.ok) throw new Error(`snapshot A (lần 2) thất bại: ${snapA2.reason}`);
    const combA2 = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!combA2.ok) throw new Error(`đo combing baseline lần 2 thất bại: ${combA2.reason}`);
    log(`G1 baseline interlaced (lần 2): R=${combA2.ratio}`);
    const gapBase = +(combA2.ratio - combCleanBase.ratio).toFixed(2);
    if (gapBase > 0.1 && hookA && hookA.deinterlaceTap === false && hookA.offscreenApplied === false) {
      pass("G1 baseline: răng cưa thấy được, tap chưa áp", `R interlaced ${combA2.ratio} − R progressive ${combCleanBase.ratio} = gap ${gapBase} > 0.10 (lần 1: R tuyệt đối 0.74 do upscale 1.13x, không phải 1.12 ở 1:1), hook tap=false, offscreen=false, canvas ${combA2.w}x${combA2.h}`);
    } else {
      fail("G1 baseline: răng cưa thấy được, tap chưa áp", `R interlaced ${combA2.ratio} vs progressive ${combCleanBase.ratio} (gap ${gapBase}, kỳ vọng > 0.10), hook=${JSON.stringify(hookA)}`);
    }

    // ---- G2: bật deinterlace bằng chuột thật -------------------------------
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced + deint tại playhead 1.0", 60000);
    await sleep(500);
    const hookB = (await cdp.evalJs(STATE_FN)).hook;
    const combB = await cdp.evalJs(PREVIEW_COMBING_FN);
    const diffB = await cdp.evalJs(SNAPDIFF_FN);
    if (!combB.ok || !diffB.ok) throw new Error(`đo G2 thất bại: combing ${combB.reason || "ok"}, diff ${diffB.reason || "ok"}`);
    log(`G2 deint BẬT: R=${combB.ratio} (C=${combB.cross} S=${combB.same}), hook tap=${hookB?.deinterlaceTap} applied=${JSON.stringify(hookB?.applied)} offscreen=${hookB?.offscreenApplied}, MAD vs A=${diffB.meanAbsDiff} (${diffB.pctChanged}% đổi)`);
    if (combB.ratio < 0.65 && combB.ratio < combA2.ratio * 0.8 && hookB && hookB.deinterlaceTap === true
      && JSON.stringify(hookB.applied) === JSON.stringify(["deinterlace"]) && hookB.offscreenApplied === false
      && diffB.meanAbsDiff > 0.5) {
      pass("G2 bật deinterlace: R giảm, tap áp, pixel đổi thật", `R ${combA2.ratio} → ${combB.ratio} (D4 half-res: 0.74 → 0.51; C8 offscreen: 0.74 → 0.54; yadif 0.57), hook tap=true applied=[deinterlace] offscreen=false (đường intermediate đợt 77 E1), MAD=${diffB.meanAbsDiff}`);
    } else {
      fail("G2 bật deinterlace: R giảm, tap áp, pixel đổi thật", `R ${combA2.ratio} → ${combB.ratio} (kỳ vọng < 0.65 và < 0.8× gốc), hook=${JSON.stringify(hookB)}, MAD=${diffB.meanAbsDiff}`);
    }

    // ---- G3: tắt lại → pixel-identical với baseline -----------------------
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced tắt deint tại playhead 1.0", 60000);
    await sleep(500);
    const hookC = (await cdp.evalJs(STATE_FN)).hook;
    const diffC = await cdp.evalJs(SNAPDIFF_FN);
    if (!diffC.ok) throw new Error(`đo G3 thất bại: ${diffC.reason}`);
    log(`G3 deint TẮT lại: hook tap=${hookC?.deinterlaceTap} offscreen=${hookC?.offscreenApplied}, MAD vs A=${diffC.meanAbsDiff} (${diffC.pctChanged}% đổi)`);
    if (diffC.meanAbsDiff === 0 && hookC && hookC.deinterlaceTap === false) {
      pass("G3 tắt deinterlace: trả đúng khung gốc (pixel-identical)", `MAD vs baseline = 0, hook tap=false (mẫu Q1 A→D)`);
    } else {
      fail("G3 tắt deinterlace: trả đúng khung gốc (pixel-identical)", `MAD vs baseline = ${diffC.meanAbsDiff} (kỳ vọng 0), hook=${JSON.stringify(hookC)}`);
    }

    // ---- G4: đối chứng progressive + deint BẬT ----------------------------
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
      window.__f1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-clean", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__f1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview progressive + deint tại playhead 1.0", 60000);
    await sleep(500);
    const combClean = await cdp.evalJs(PREVIEW_COMBING_FN);
    const hookD = (await cdp.evalJs(STATE_FN)).hook;
    if (!combClean.ok) throw new Error(`đo G4 thất bại: ${combClean.reason}`);
    log(`G4 progressive + deint BẬT: R=${combClean.ratio}, hook tap=${hookD?.deinterlaceTap}`);
    if (combClean.ratio < 0.8 && hookD && hookD.deinterlaceTap === true) {
      pass("G4 đối chứng progressive: tap không tạo thêm răng cưa", `R=${combClean.ratio} < 0.8 (probe clean tap1 0.61), hook tap=true`);
    } else {
      fail("G4 đối chứng progressive: tap không tạo thêm răng cưa", `R=${combClean.ratio} (kỳ vọng < 0.8), hook=${JSON.stringify(hookD)}`);
    }
    // Trả clip về interlaced cho phần FPS (deint vẫn BẬT từ G4).
    await cdp.evalJs(`(async () => {
      const st = window.__f1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);

    // ---- G5: FPS xen kẽ [B,I,B,I,B] ----------------------------------------
    // fpsSlots khai ở ngoài khối mainMode (xem trên G0) để report cuối
    // hàm đọc được cả 2 chế độ; ở đây chỉ dùng, không khai lại.
    async function measureFpsSlot(key, slotIdx) {
      const want = key === "deint";
      await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", want, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(`${key} slot ${slotIdx} seek 0`);
      const stCfg = await cdp.evalJs(STATE_FN);
      const hook = stCfg.hook;
      const hookOk = key === "deint"
        ? hook && hook.deinterlaceTap === true && hook.offscreenApplied === false
        : hook && hook.deinterlaceTap === false && hook.offscreenApplied === false;
      if (!hookOk) log(`cảnh báo hook slot ${slotIdx} ${key} lệch: hook=${JSON.stringify(hook)}`);
      const loadBefore = loadAvg();
      await togglePlay();
      // F1: dưới tải cao tick chậm tới ~700ms nên trạng thái playing có
      // thể chưa lật ngay sau Space — chờ tới 4s thay vì đọc ngay.
      let started = false;
      for (let k = 0; k < 8 && !started; k++) {
        await sleep(500);
        started = (await cdp.evalJs(SAMPLE_FN)).playing;
      }
      if (!started) throw new Error(`${key} slot ${slotIdx}: bấm Space mà playing vẫn false sau 4s`);
      await sleep(300);
      await cdp.evalJs(DRAW_RESET_FN);
      const a = await cdp.evalJs(SAMPLE_FN);
      if (!a.playing) throw new Error(`${key} slot ${slotIdx}: playing tắt giữa chừng trước khi bắt đầu slot`);
      await sleep(4500);
      const b = await cdp.evalJs(SAMPLE_FN);
      const stillPlaying = (await cdp.evalJs(STATE_FN)).playing;
      if (stillPlaying) {
        await pausePlayback();
        // F1: chờ pause thật tới 4s (tick chậm dưới tải cao).
        let paused = false;
        for (let k = 0; k < 8 && !paused; k++) {
          await sleep(500);
          paused = !(await cdp.evalJs(STATE_FN)).playing;
        }
        if (!paused) {
          await pausePlayback();
          for (let k = 0; k < 8 && !paused; k++) {
            await sleep(500);
            paused = !(await cdp.evalJs(STATE_FN)).playing;
          }
        }
        if (!paused) throw new Error(`${key} slot ${slotIdx}: setState playing=false 2 lần mà playing vẫn true sau 8s`);
      } else {
        log(`cảnh báo slot ${slotIdx} ${key}: phát đã tự dừng trước khi hết slot (playhead chạm cuối?) — vẫn tính slot`);
      }
      const after = await cdp.evalJs(STATE_FN);
      if (after.playing) throw new Error(`${key} slot ${slotIdx}: playing vẫn true sau khi dừng`);
      const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(a.wall, b.wall));
      const drawImg = await cdp.evalJs(DRAW_READ_FN);
      const dt = (b.wall - a.wall) / 1000;
      const draws = b.draw - a.draw;
      let drawMsTotal = 0;
      for (const v of Object.values(drawImg)) drawMsTotal += v.ms;
      const row = {
        slot: slotIdx, config: key, hookOk,
        drawFps: +((b.draw - a.draw) / dt).toFixed(2),
        tickFps: +((b.ticks - a.ticks) / dt).toFixed(2),
        playheadRate: +(((b.ph - a.ph) / dt)).toFixed(2),
        raf: rafStats, drawImage: drawImg,
        drawImageMsPerTick: draws > 0 ? +(drawMsTotal / draws).toFixed(1) : null,
        drawImageMsPerSec: +(drawMsTotal / dt).toFixed(1),
        loadBefore, loadAfter: loadAvg(),
      };
      fpsSlots.push(row);
      log(`FPS slot ${slotIdx} ${key}: draw ${row.drawFps} fps, tick ${row.tickFps} fps, playhead ${row.playheadRate}x, raf gap mean ${rafStats?.gapMean ?? "?"}ms P50 ${rafStats?.gapP50 ?? "?"}ms (n=${rafStats?.n ?? 0}), drawImage ${row.drawImageMsPerTick}ms/tick ${JSON.stringify(drawImg)}, load ${loadBefore} → ${row.loadAfter}`);
      return row;
    }
    // Đợt 77 E1: 11 slot (5 tỉ lệ) thay vì 7 slot (3 tỉ lệ) như D4 — tải
    // VM hôm nay rất cao và baseline chỉ ~2 fps nên mỗi slot 3s chỉ có
    // ~6 lần vẽ (lượng tử hoá ±17%); thêm slot để trung bình nhiễu tải
    // và nhiễu đếm. Định nghĩa tỉ lệ drift-corrected không đổi.
    // F1: nới clip 1 out 4 → 5 (media dài 5s) để slot 4,5s nằm trọn
    // trong clip 1 (playhead 0 → 4,5s); không nới thì phát chạm cuối
    // clip rồi chạy sang clip 2/3 làm bẩn phép đo.
    const pOut = await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ out: 5 }"));
    log(`F1: nới clip 1 out → 5 (patch trả về: ${JSON.stringify(pOut.clip).slice(0, 200)})`);
    const FPS_ORDER = ["baseline", "deint", "baseline", "deint", "baseline", "deint", "baseline", "deint", "baseline", "deint", "baseline"];
    for (let i = 0; i < FPS_ORDER.length; i++) await measureFpsSlot(FPS_ORDER[i], i);
    const baseFps = [fpsSlots[0].drawFps, fpsSlots[2].drawFps, fpsSlots[4].drawFps, fpsSlots[6].drawFps, fpsSlots[8].drawFps, fpsSlots[10].drawFps];
    const baseMean = baseFps.reduce((a, b) => a + b, 0) / baseFps.length;
    const ratio = (slot, before, after) => {
      const neighbor = (before + after) / 2;
      return neighbor > 0 ? +(slot / neighbor).toFixed(2) : null;
    };
    const ratios = [1, 3, 5, 7, 9].map((i) => ratio(fpsSlots[i].drawFps, fpsSlots[i - 1].drawFps, fpsSlots[i + 1].drawFps));
    const rMean = +((ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2));
    log(`FPS deint: baseline mean ${baseMean.toFixed(2)} fps, tỉ lệ drift-corrected ${ratios.join(" / ")} → mean ${rMean}x (ngưỡng 0.75x)`);
    if (rMean >= 0.75) {
      pass("G5 FPS deint-only ≥ 0.75x baseline", `tỉ lệ ${ratios.join("/")} → ${rMean}x, baseline ${baseMean.toFixed(2)} fps, load ${loadAvg()}`);
    } else {
      fail("G5 FPS deint-only ≥ 0.75x baseline", `tỉ lệ ${ratios.join("/")} → ${rMean}x < 0.75x, baseline ${baseMean.toFixed(2)} fps — đường deint-only hiện tại vẫn chưa đủ nhanh (D4 half-res: 0.72–0.73x; C8 offscreen: 0.65–0.71x; xem LIMITS §3)`);
    }

    // ---- T1: tỉ lệ từ ms/tick trực tiếp (gap mean rAF) ----------------
    // fps ≈ 1000/gapMean khi vòng rAF-driven và mỗi tick vẽ 1 lần; tỉ lệ
    // fps từ thời gian = gapMean(baseline kề) / gapMean(deint). Độc lập
    // với đếm draw nên không lượng tử hoá.
    const gapRatio = (slot, before, after) => {
      const nb = (before + after) / 2;
      return nb > 0 && slot > 0 ? +(nb / slot).toFixed(2) : null;
    };
    const gapMeans = fpsSlots.map((r) => r.raf?.gapMean ?? null);
    const gapRatios = [1, 3, 5, 7, 9].map((i) => gapRatio(gapMeans[i], gapMeans[i - 1], gapMeans[i + 1]));
    const gapRMean = +((gapRatios.reduce((a, b) => a + b, 0) / gapRatios.length).toFixed(2));
    const diBase = fpsSlots.filter((r) => r.config === "baseline").map((r) => r.drawImageMsPerTick);
    const diDeint = fpsSlots.filter((r) => r.config === "deint").map((r) => r.drawImageMsPerTick);
    const avg = (xs) => +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
    log(`TICK-TIME: tỉ lệ từ gapMean rAF ${gapRatios.join(" / ")} → mean ${gapRMean}x (ngưỡng 0.75x); drawImage ms/tick baseline ${avg(diBase)} (slot: ${diBase.join(",")}) vs deint ${avg(diDeint)} (slot: ${diDeint.join(",")})`);
    if (gapRMean >= 0.75) {
      pass("T1 ms/tick trực tiếp: tỉ lệ gap ≥ 0.75x", `tỉ lệ gap ${gapRatios.join("/")} → ${gapRMean}x; drawImage ${avg(diBase)}ms/tick baseline vs ${avg(diDeint)}ms/tick deint`);
    } else {
      fail("T1 ms/tick trực tiếp: tỉ lệ gap ≥ 0.75x", `tỉ lệ gap ${gapRatios.join("/")} → ${gapRMean}x < 0.75x; drawImage ${avg(diBase)}ms/tick baseline vs ${avg(diDeint)}ms/tick deint`);
    }
    } else {
    // ---- G6: chế độ scale075 — tap KHÔNG áp dưới ngưỡng 0.9 ---------------
    const g6geom = await cdp.evalJs(GEOM_FN);
    const vc6 = g6geom.clips.find((c) => c.trackId === "v1");
    if (!vc6) throw new Error("không tìm thấy clip video trên timeline (G6)");
    await cdp.click(vc6.rect.cx, vc6.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu (G6)", 60000);
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("interlaced720.mp4"))};
      window.__f1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__f1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced scale075 tại playhead 1.0", 60000);
    await sleep(500);
    const shot6 = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
    if (!shot6.ok || shot6.std < 8) throw new Error(`canvas G6 phẳng/placeholder (std ${shot6?.std}) — frame chưa vẽ được`);
    const comb6Off = await cdp.evalJs(PREVIEW_COMBING_FN);
    const snap6Off = await cdp.evalJs(SNAPSHOT_FN);
    if (!comb6Off.ok || !snap6Off.ok) throw new Error(`đo G6-off thất bại: ${comb6Off.reason || snap6Off.reason}`);
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
      window.__f1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-clean6", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__f1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview clean scale075 tại playhead 1.0", 60000);
    await sleep(500);
    const comb6Clean = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!comb6Clean.ok) throw new Error(`đo G6-clean thất bại: ${comb6Clean.reason}`);
    await cdp.evalJs(`(async () => {
      const st = window.__f1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__f1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced + deint scale075 tại playhead 1.0", 60000);
    await sleep(500);
    const hook6 = (await cdp.evalJs(STATE_FN)).hook;
    const diff6 = await cdp.evalJs(SNAPDIFF_FN);
    if (!diff6.ok) throw new Error(`đo G6-on thất bại: ${diff6.reason}`);
    const gap6 = +(comb6Off.ratio - comb6Clean.ratio).toFixed(2);
    log(`G6 scale075 (scaleY=${s0.scaleY}): R interlaced ${comb6Off.ratio} vs clean ${comb6Clean.ratio} (gap ${gap6}; sweep probe C8 ở 0.75: gap 0.12), hook tap=${hook6?.deinterlaceTap}, MAD khi bật deint=${diff6.meanAbsDiff}`);
    if (hook6 && hook6.deinterlaceTap === false && diff6.meanAbsDiff === 0) {
      pass("G6 tỉ lệ 0.75: tap KHÔNG áp dưới ngưỡng 0.9, pixel không đổi", `scaleY=${s0.scaleY}, gap R ${gap6} (sweep probe 0.12), hook tap=false, MAD=0 khi bật deint`);
    } else {
      fail("G6 tỉ lệ 0.75: tap KHÔNG áp dưới ngưỡng 0.9, pixel không đổi", `scaleY=${s0.scaleY}, gap R ${gap6}, hook=${JSON.stringify(hook6)}, MAD=${diff6.meanAbsDiff} (kỳ vọng tap=false, MAD=0)`);
    }
    }

    // ---- H9: 0 lỗi trang ----------------------------------------------------
    await drainErrors();
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    const report = { cases: results, pass: nPass, total: results.length, fpsSlots, canvasSize: `${s0.canvasW}x${s0.canvasH}`, scaleY: s0.scaleY };
    writeFileEpermRetry(path.join(SCRATCH, "c78f1-headed-report.json"), JSON.stringify(report, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "c78f1-headed.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ TICK-TIME F1: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { writeFileEpermRetry(path.join(SCRATCH, "c78f1-headed.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
