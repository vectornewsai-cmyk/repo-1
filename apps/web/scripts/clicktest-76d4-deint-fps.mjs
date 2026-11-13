#!/usr/bin/env node
/**
 * clicktest-76d4-deint-fps.mjs — Phase 9 đợt 76, luồng D4: kiểm chứng
 * headed tap khử răng cưa HALF-RES trong preview thật (đóng nợ G5 đợt
 * 75 C8 — FPS deint-only 0.65–0.71× FAIL vì tap đi qua enhanceCanvas).
 *
 * Đợt 76 D4 (lib/enhancePreview.ts + preview.tsx, deintHalfResSource):
 * khi CHỈ có deintTap thì plan.needsOffscreen = false và preview.tsx đưa
 * drawSrc qua canvas trung gian dw×(dh/2) (downscale dọc 2× — mỗi hàng
 * đích đã là trung bình ~2 hàng nguồn, hạt nhân [1,1]/2 như tap C8) rồi
 * vẽ lên khổ đích. Bản inline-shift (cộng +0.5px vào lần vẽ cuối) đã thử
 * và BỎ sau headed lần 1: FPS 0.99× nhưng R 0.74 → 0.74 ở upscale.
 * Tap chỉ áp khi vẽ gần full-res (tỉ lệ vẽ thật ≥ 0.9).
 *
 * Các case (mặc định cửa sổ 2560×1440, scaleY ~1.13):
 *   G0. App mount + project mẫu + canvas đủ lớn (scaleY ≥ 0.9 → chế độ
 *       main; scaleY < 0.9 → chế độ scale075, chỉ chạy G6 + H9).
 *   G1. Baseline deint TẮT: R interlaced cao hơn R progressive đối chứng
 *       cùng cỡ canvas (gap > 0.10), hook tap false / applied [] /
 *       offscreen false; lưu snapshot A.
 *   G2. Bật deinterlace bằng CHUỘT THẬT: hook tap true / applied
 *       [deinterlace] / offscreen FALSE (half-res — khác C8: offscreen
 *       true); R giảm về băng yadif (< 0.65 và < 0.8× R gốc); snapshot B
 *       đổi pixel thật (MAD > 0.5).
 *   G3. Tắt lại bằng chuột thật: snapshot C pixel-identical với A (MAD 0).
 *   G4. Đối chứng progressive (clean720) + deint BẬT: R vẫn < 0.8
 *       (tap không tạo thêm răng cưa).
 *   G5. FPS xen kẽ [B,I,B,I,B,I,B], 3s/slot, tỉ lệ drift-corrected; ngưỡng
 *       0.75x giữ nguyên (mẫu đợt 61 R3 §6.7 — không nới). Hook mỗi slot
 *       deint phải là tap true + offscreen false (half-res).
 *   G6. (chỉ chế độ scale075, cửa sổ nhỏ — D4_WINDOW=1700,1000):
 *       tap KHÔNG áp dưới ngưỡng 0.9: bật deint → hook tap false,
 *       snapshot MAD = 0 so với baseline cùng cỡ; đo gap R interlaced −
 *       clean ở tỉ lệ đó (kỳ vọng ~0.12 như sweep probe C8).
 *   G7a. Tap + scale-keyframes (nhánh SR) + motion-blur đã cấu hình,
 *       ở scaleY ≥ 0.9: R giảm như G2, MAD > 0.5, hook tap true +
 *       offscreen false. Motion-blur chỉ blend khi đang phát (gate đợt
 *       62 R3) nên ở pause case này chỉ khóa nhánh SR; nhánh
 *       blend-motion-blur ghi rõ là chưa đo headed (xem LIMITS).
 *   G7b. Tap + mask rect (không SR): KHÔNG hồi quy — mask unit 640×360
 *       downscale dọc 2× nên răng cưa đã bị trung bình hết ngay cả khi
 *       deint TẮT; tiêu chí: |ΔR| ≤ 0.05, MAD < 0.05, hook tap true.
 *   G8. Footage thật (Big Buck Bunny 720p qua minterpolate 60fps +
 *       tinterlace, idet TFF — KHÔNG phải testsrc2): R off/on + MAD,
 *       đối chứng progressive BBB; so với số testsrc2 (R 0.74 → 0.54).
 *   H9. 0 lỗi trang.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-76d4-deint-fps.mjs
 * Env: D4_DEV_PORT (5560–5569), D4_DEBUG_PORT (9660–9669), D4_DISPLAY
 * (:180–:189), D4_SCRATCH (mặc định hidden_files/round76-d4/headed),
 * D4_WINDOW (mặc định 2560x1440; 1700x1000 cho chế độ scale075).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG sửa code sản phẩm.
 * KHÔNG push/tag/binary.
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
const SCRATCH = process.env.D4_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round76-d4", "headed");
const WIN = process.env.D4_WINDOW || "2560x1440";
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round76-d4";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.c8.headed.config.mjs");
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
  window.__d4errors = [];
  window.addEventListener("error", (e) => { try { window.__d4errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__d4errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__d4errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__d4errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__d4storeMod || (window.__d4storeMod = await import(hit));
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
    errors: (window.__d4errors || []).slice(),
  };
})()`;

const SAMPLE_FN = `(() => {
  const st = window.__d4storeMod ? window.__d4storeMod.useStore.getState() : null;
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

const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const st2 = window.__d4storeMod.useStore.getState();
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
  window.__d4snap = { w: W, h: H, px };
  return { ok: true, w: W, h: H, n: px.length / 3 };
})()`;
const SNAPDIFF_FN = `(() => {
  const snap = window.__d4snap;
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
  const DEV_PORT = Number(process.env.D4_DEV_PORT || 0) || (await pickFreePort(5560, 5569));
  const DEBUG_PORT = Number(process.env.D4_DEBUG_PORT || 0) || (await pickFreePort(9660, 9669));
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
  const DISPLAY = process.env.D4_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5560–5569");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9660–9669");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r76d4-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  const TMPDIR = "/tmp/round76-d4/tmp";
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
  server.middlewares.use("/r76d4-media", (req, res) => {
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

  const viteLogFd = fs.openSync(path.join(SCRATCH, "c76d4-headed-vite.log"), "w");
  vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
  log("vite dev đã lên");
  const mediaProbe = await fetch(MEDIA_URL("clean720.mp4"), { headers: { Range: "bytes=0-99" } });
  if (mediaProbe.status !== 206) throw new Error(`middleware media không phục vụ được clean720.mp4 (HTTP ${mediaProbe.status})`);

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
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "c76d4-headed-chrome.log"), "w");
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
  async function togglePlay() {
    await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
    await cdp.key(" ", "Space");
  }
  async function drainErrors() {
    const e = (await cdp.evalJs(`(window.__d4errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__d4errors = []`).catch(() => {});
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
    // scaleY < 0.9 (cửa sổ nhỏ D4_WINDOW=1700x1000) chỉ chạy G6 (tap phải
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
      window.__d4storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st2 = window.__d4storeMod.useStore.getState();
      const clip = st2.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      const st3 = window.__d4storeMod.useStore.getState();
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
      window.__d4storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-clean-base", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__d4storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
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
      const st = window.__d4storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
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
      pass("G2 bật deinterlace: R giảm, tap áp HALF-RES, pixel đổi thật", `R ${combA2.ratio} → ${combB.ratio} (C8 offscreen: 0.74 → 0.54; yadif 0.57), hook tap=true applied=[deinterlace] offscreen=false (half-res đợt 76 D4), MAD=${diffB.meanAbsDiff}`);
    } else {
      fail("G2 bật deinterlace: R giảm, tap áp HALF-RES, pixel đổi thật", `R ${combA2.ratio} → ${combB.ratio} (kỳ vọng < 0.65 và < 0.8× gốc), hook=${JSON.stringify(hookB)}, MAD=${diffB.meanAbsDiff}`);
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
      window.__d4storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-clean", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__d4storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
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
      const st = window.__d4storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
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
      await sleep(800);
      const a = await cdp.evalJs(SAMPLE_FN);
      if (!a.playing) throw new Error(`${key} slot ${slotIdx}: bấm Space mà playing vẫn false`);
      await sleep(3000);
      const b = await cdp.evalJs(SAMPLE_FN);
      await togglePlay();
      await sleep(400);
      const after = await cdp.evalJs(STATE_FN);
      if (after.playing) throw new Error(`${key} slot ${slotIdx}: bấm Space lần 2 mà playing vẫn true`);
      const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(a.wall, b.wall));
      const dt = (b.wall - a.wall) / 1000;
      const row = {
        slot: slotIdx, config: key, hookOk,
        drawFps: +((b.draw - a.draw) / dt).toFixed(2),
        tickFps: +((b.ticks - a.ticks) / dt).toFixed(2),
        playheadRate: +(((b.ph - a.ph) / dt)).toFixed(2),
        raf: rafStats, loadBefore, loadAfter: loadAvg(),
      };
      fpsSlots.push(row);
      log(`FPS slot ${slotIdx} ${key}: draw ${row.drawFps} fps, tick ${row.tickFps} fps, playhead ${row.playheadRate}x, load ${loadBefore} → ${row.loadAfter}`);
      return row;
    }
    const FPS_ORDER = ["baseline", "deint", "baseline", "deint", "baseline", "deint", "baseline"];
    for (let i = 0; i < FPS_ORDER.length; i++) await measureFpsSlot(FPS_ORDER[i], i);
    const baseFps = [fpsSlots[0].drawFps, fpsSlots[2].drawFps, fpsSlots[4].drawFps, fpsSlots[6].drawFps];
    const baseMean = baseFps.reduce((a, b) => a + b, 0) / baseFps.length;
    const ratio = (slot, before, after) => {
      const neighbor = (before + after) / 2;
      return neighbor > 0 ? +(slot / neighbor).toFixed(2) : null;
    };
    const r1 = ratio(fpsSlots[1].drawFps, fpsSlots[0].drawFps, fpsSlots[2].drawFps);
    const r2 = ratio(fpsSlots[3].drawFps, fpsSlots[2].drawFps, fpsSlots[4].drawFps);
    const r3 = ratio(fpsSlots[5].drawFps, fpsSlots[4].drawFps, fpsSlots[6].drawFps);
    const rMean = +((r1 + r2 + r3) / 3).toFixed(2);
    log(`FPS deint: baseline mean ${baseMean.toFixed(2)} fps, tỉ lệ drift-corrected ${r1} / ${r2} / ${r3} → mean ${rMean}x (ngưỡng 0.75x)`);
    if (rMean >= 0.75) {
      pass("G5 FPS deint-only ≥ 0.75x baseline", `tỉ lệ ${r1}/${r2}/${r3} → ${rMean}x, baseline ${baseMean.toFixed(2)} fps, load ${loadAvg()}`);
    } else {
      fail("G5 FPS deint-only ≥ 0.75x baseline", `tỉ lệ ${r1}/${r2}/${r3} → ${rMean}x < 0.75x, baseline ${baseMean.toFixed(2)} fps — half-res vẫn chưa đủ nhanh (C8 offscreen: 0.65–0.71x; xem LIMITS §3)`);
    }

    // ---- G7a: tap + scale-keyframes (nhánh SR, không mask) -------------
    // Motion-blur đã cấu hình nhưng chỉ blend khi đang phát (gate đợt 62
    // R3) nên ở pause case này khóa nhánh SR; nhánh blend-motion-blur
    // ghi rõ chưa đo headed (xem LIMITS §5).
    const pSr = await cdp.evalJs(PATCH_FN("v1", firstClipId, SR_ONLY_PATCH));
    const srOk = pSr.clip.animations && pSr.clip.animations.scale
      && pSr.clip.motion && pSr.clip.motion.motionBlur && pSr.clip.motion.motionBlur.frames === 4;
    if (!srOk) throw new Error(`patch SR thất bại: ${JSON.stringify(pSr.clip)}`);
    log(`G7a SR-only đã đặt: scale 1.2 + motionBlur 4 frame (deint đang TẮT sau G5)`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview SR deint TẮT tại playhead 1.0", 60000);
    await sleep(500);
    const combG7aOff = await cdp.evalJs(PREVIEW_COMBING_FN);
    const snapG7aOff = await cdp.evalJs(SNAPSHOT_FN);
    if (!combG7aOff.ok || !snapG7aOff.ok) throw new Error(`đo G7a-off thất bại: ${combG7aOff.reason || snapG7aOff.reason}`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview SR deint BẬT tại playhead 1.0", 60000);
    await sleep(500);
    const hookG7a = (await cdp.evalJs(STATE_FN)).hook;
    const combG7aOn = await cdp.evalJs(PREVIEW_COMBING_FN);
    const diffG7a = await cdp.evalJs(SNAPDIFF_FN);
    if (!combG7aOn.ok || !diffG7a.ok) throw new Error(`đo G7a-on thất bại: ${combG7aOn.reason || diffG7a.reason}`);
    log(`G7a SR-only: R ${combG7aOff.ratio} → ${combG7aOn.ratio}, hook tap=${hookG7a?.deinterlaceTap} offscreen=${hookG7a?.offscreenApplied}, MAD=${diffG7a.meanAbsDiff}`);
    if (combG7aOn.ratio < combG7aOff.ratio * 0.85 && hookG7a && hookG7a.deinterlaceTap === true
      && hookG7a.offscreenApplied === false && diffG7a.meanAbsDiff > 0.5) {
      pass("G7a tap + scale-keyframes (SR): R giảm, tap half-res, pixel đổi thật", `R ${combG7aOff.ratio} → ${combG7aOn.ratio} (< 0.85× gốc), hook tap=true offscreen=false, MAD=${diffG7a.meanAbsDiff}`);
    } else {
      fail("G7a tap + scale-keyframes (SR): R giảm, tap half-res, pixel đổi thật", `R ${combG7aOff.ratio} → ${combG7aOn.ratio} (kỳ vọng < 0.85× gốc), hook=${JSON.stringify(hookG7a)}, MAD=${diffG7a.meanAbsDiff}`);
    }

    // ---- G7b: tap + mask rect (không SR) — KHÔNG hồi quy -----------------
    // Nhánh mask vẽ drawSrc xuống unit 640×360 (downscale dọc 2×) nên
    // răng cưa ĐÃ bị trung bình hết ngay cả khi deint TẮT (R_off thấp sẵn);
    // half-res không đổi gì thêm (MAD ≈ 0 là ĐÚNG, không phải lỗi — xem
    // LIMITS §4). Tiêu chí: hook tap true + offscreen false, |ΔR| ≤ 0.05,
    // MAD < 0.05 (không đổi pixel = không phá hình học mask).
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
    const pMask = await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ mask: { shape: \"rect\", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.2 }, animations: undefined, motion: undefined }"));
    if (!pMask.clip.mask || pMask.clip.mask.shape !== "rect") throw new Error(`patch mask thất bại: ${JSON.stringify(pMask.clip)}`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview mask deint TẮT tại playhead 1.0", 60000);
    await sleep(500);
    const combG7bOff = await cdp.evalJs(PREVIEW_COMBING_FN);
    const snapG7bOff = await cdp.evalJs(SNAPSHOT_FN);
    if (!combG7bOff.ok || !snapG7bOff.ok) throw new Error(`đo G7b-off thất bại: ${combG7bOff.reason || snapG7bOff.reason}`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview mask deint BẬT tại playhead 1.0", 60000);
    await sleep(500);
    const hookG7b = (await cdp.evalJs(STATE_FN)).hook;
    const combG7bOn = await cdp.evalJs(PREVIEW_COMBING_FN);
    const diffG7b = await cdp.evalJs(SNAPDIFF_FN);
    if (!combG7bOn.ok || !diffG7b.ok) throw new Error(`đo G7b-on thất bại: ${combG7bOn.reason || diffG7b.reason}`);
    const dR7b = Math.abs(combG7bOn.ratio - combG7bOff.ratio);
    log(`G7b mask-only: R ${combG7bOff.ratio} → ${combG7bOn.ratio} (|ΔR|=${dR7b.toFixed(2)}), hook tap=${hookG7b?.deinterlaceTap} offscreen=${hookG7b?.offscreenApplied}, MAD=${diffG7b.meanAbsDiff}`);
    if (hookG7b && hookG7b.deinterlaceTap === true && hookG7b.offscreenApplied === false
      && dR7b <= 0.05 && diffG7b.meanAbsDiff < 0.05) {
      pass("G7b tap + mask rect: không hồi quy (mask downscale đã khử răng cưa)", `R ${combG7bOff.ratio} → ${combG7bOn.ratio} (|ΔR| ${dR7b.toFixed(2)} ≤ 0.05), hook tap=true offscreen=false, MAD=${diffG7b.meanAbsDiff} < 0.05`);
    } else {
      fail("G7b tap + mask rect: không hồi quy (mask downscale đã khử răng cưa)", `R ${combG7bOff.ratio} → ${combG7bOn.ratio} (|ΔR| ${dR7b.toFixed(2)}, kỳ vọng ≤ 0.05), hook=${JSON.stringify(hookG7b)}, MAD=${diffG7b.meanAbsDiff} (kỳ vọng < 0.05)`);
    }

    // ---- G8: footage thật — Big Buck Bunny 720p qua minterpolate 60fps +
    // tinterlace (idet TFF, KHÔNG phải testsrc2 tổng hợp) --------------------
    const bbbFiles = ["bbb-interlaced720.mp4", "bbb720.mp4"];
    const bbbMissing = bbbFiles.filter((f) => !fs.existsSync(path.join(MEDIA_DIR, f)));
    if (bbbMissing.length) {
      fail("G8 footage thật (BBB interlaced): R off/on + MAD", `thiếu fixture ở media dir: ${bbbMissing.join(", ")} — chưa tạo được bản interlaced từ BBB (xem LIMITS §5)`);
    } else {
      await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ mask: undefined, animations: undefined, motion: undefined }"));
      await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
      await cdp.evalJs(`(async () => {
        const url = ${JSON.stringify(MEDIA_URL("bbb-interlaced720.mp4"))};
        window.__d4storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-bbb-inter", name: "bbb-interlaced720.mp4", kind: "video", url, duration: 10, width: 1280, height: 720 }] }));
        const st = window.__d4storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "bbb-interlaced720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle("preview BBB interlaced tại playhead 1.0", 60000);
      await sleep(500);
      const shotBbb = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
      if (!shotBbb.ok || shotBbb.std < 8) throw new Error(`canvas BBB interlaced phẳng/placeholder (std ${shotBbb?.std}) — frame chưa vẽ được`);
      const combBbbOff = await cdp.evalJs(PREVIEW_COMBING_FN);
      const snapBbbOff = await cdp.evalJs(SNAPSHOT_FN);
      if (!combBbbOff.ok || !snapBbbOff.ok) throw new Error(`đo G8-off thất bại: ${combBbbOff.reason || snapBbbOff.reason}`);
      await cdp.evalJs(`(async () => {
        const url = ${JSON.stringify(MEDIA_URL("bbb720.mp4"))};
        window.__d4storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-bbb-clean", name: "bbb720.mp4", kind: "video", url, duration: 10, width: 1280, height: 720 }] }));
        const st = window.__d4storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "bbb720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle("preview BBB progressive tại playhead 1.0", 60000);
      await sleep(500);
      const combBbbClean = await cdp.evalJs(PREVIEW_COMBING_FN);
      if (!combBbbClean.ok) throw new Error(`đo G8-clean thất bại: ${combBbbClean.reason}`);
      await cdp.evalJs(`(async () => {
        const st = window.__d4storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "bbb-interlaced720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle("preview BBB interlaced + deint tại playhead 1.0", 60000);
      await sleep(500);
      const hookBbb = (await cdp.evalJs(STATE_FN)).hook;
      const combBbbOn = await cdp.evalJs(PREVIEW_COMBING_FN);
      const diffBbb = await cdp.evalJs(SNAPDIFF_FN);
      if (!combBbbOn.ok || !diffBbb.ok) throw new Error(`đo G8-on thất bại: ${combBbbOn.reason || diffBbb.reason}`);
      const gapBbb = +(combBbbOff.ratio - combBbbClean.ratio).toFixed(2);
      log(`G8 BBB thật: R interlaced ${combBbbOff.ratio} (clean đối chứng ${combBbbClean.ratio}, gap ${gapBbb}) → deint ${combBbbOn.ratio}, hook tap=${hookBbb?.deinterlaceTap} offscreen=${hookBbb?.offscreenApplied}, MAD=${diffBbb.meanAbsDiff}`);
      if (combBbbOn.ratio < combBbbOff.ratio && hookBbb && hookBbb.deinterlaceTap === true
        && hookBbb.offscreenApplied === false && diffBbb.meanAbsDiff > 0.3) {
        pass("G8 footage thật (BBB interlaced): R giảm, tap half-res, pixel đổi thật", `R ${combBbbOff.ratio} → ${combBbbOn.ratio} (testsrc2: 0.74 → 0.54; gap vs clean ${gapBbb}), hook tap=true offscreen=false, MAD=${diffBbb.meanAbsDiff}`);
      } else {
        fail("G8 footage thật (BBB interlaced): R giảm, tap half-res, pixel đổi thật", `R ${combBbbOff.ratio} → ${combBbbOn.ratio} (clean ${combBbbClean.ratio}, gap ${gapBbb}), hook=${JSON.stringify(hookBbb)}, MAD=${diffBbb.meanAbsDiff}`);
      }
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
      window.__d4storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__d4storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
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
      window.__d4storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-clean6", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__d4storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview clean scale075 tại playhead 1.0", 60000);
    await sleep(500);
    const comb6Clean = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!comb6Clean.ok) throw new Error(`đo G6-clean thất bại: ${comb6Clean.reason}`);
    await cdp.evalJs(`(async () => {
      const st = window.__d4storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__d4storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
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
    writeFileEpermRetry(path.join(SCRATCH, "c76d4-headed-report.json"), JSON.stringify(report, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "c76d4-headed.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED D4: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { writeFileEpermRetry(path.join(SCRATCH, "c76d4-headed.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
