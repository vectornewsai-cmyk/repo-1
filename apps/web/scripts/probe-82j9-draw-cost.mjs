#!/usr/bin/env node
/**
 * probe-82j9-draw-cost.mjs — Phase 9 đợt 82, luồng J9: profile chi phí vẽ
 * preview trên clip 720p trơn (không LUT/effect/deint) để chọn MỘT điểm
 * nghẽn thật trước khi code.
 *
 * Phase 1 — phân rã tick trong lúc phát (12s, clip long720 20s):
 *   bọc drawImage (kiểu G1 đợt 79: key = loại nguồn -> khổ đích), gap rAF
 *   từ __vcutPreviewRaf, delta __vcutHoldStats (draw/hold/skip).
 * Phase 2 — micro-benchmark trong trang (element video riêng, cùng file
 *   long720, không qua pool app — pool element không gắn DOM):
 *   P1: đang phát, vẽ liên tiếp 40× video->1280x720 + 40× video->1991x815
 *       (ghi ms + currentTime từng lần — frame đổi hay giữ nguyên?).
 *   P2: pause + seek từng mốc (10 mốc): sau 'seeked', vẽ 3 lần liên tiếp
 *       (lần 1 sau seek vs lần 2/3 cùng frame — tách decode-wait khỏi blit).
 *   P3: đối chứng canvas->canvas 40× (blit thuần, không video).
 *   P4: pause, cùng frame vẽ 40× video->1991x815 (blit frame đã sẵn).
 *   + getVideoPlaybackQuality (dropped/total) trong P1.
 *
 * Câu hỏi quyết định: drawImage từ video tốn ~2ms (blit) hay ~60-170ms
 * (decode-wait)? Lần vẽ thứ 2 cùng frame có rẻ hơn lần 1 sau seek không?
 * Nếu lần 2 rẻ hẳn → chi phí decode-wait trả 1 lần/frame → bỏ held-copy
 * không cứu được (main draw sẽ trả thay). Nếu cả 2 đều đắt → chi phí
 * theo lần gọi → bỏ 1 trong 2 lần vẽ video/tick sẽ thắng.
 *
 * Chạy (từ gốc repo):
 *   J9_SCRATCH=... J9_DEV_PORT=5598 J9_DEBUG_PORT=9698 J9_DISPLAY=:197 \
 *     node apps/web/scripts/probe-82j9-draw-cost.mjs
 * KHÔNG sửa code sản phẩm. KHÔNG push/tag/binary.
 *
 * Đợt 82 J9 — bài học harness: CDP.evalJs PHẢI mặc định awaitPromise=true
 * (mẫu probe G1): STATE_FN là async IIFE, awaitPromise=false trả về
 * Promise rỗng {} (truthy, không có clips) → lần 1 timeout oan 180s,
 * lần 2 lộ TypeError sau 5s. Đã sửa.
 * Sóng EPERM thoáng qua trên /tmp (ghi 0 byte, rồi tự hết): writeFileRetry
 * thử lại tối đa 5 lần cho các lần ghi file của probe.
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
const SCRATCH = process.env.J9_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round82-j9", "probe-draw-cost");
const WIN = process.env.J9_WINDOW || "2560x1440";
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = path.join(SCRATCH, "vite-cfg");
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.j9.headed.config.mjs");
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir).filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome")).filter((p) => fs.existsSync(p)).sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = findChrome();
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
// Sóng EPERM thoáng qua (ghi 0 byte, rồi tự hết; đợt 81 đã gặp và xác
// nhận hết 2 lần, đợt 82 gặp lại, từng đợt kéo dài >25s): thử lại tối đa
// 12 lần, cách nhau 10s (cửa sổ 2 phút), cho các lần ghi file của probe.
// Không phải lách phê duyệt — chỉ chịu đựng lỗi môi trường thoáng qua;
// hết 12 lần thì throw như cũ.
async function writeFileRetry(file, data) {
  let lastErr = null;
  for (let i = 0; i < 12; i++) {
    try { writeFileEpermRetry(file, data); return; }
    catch (e) { lastErr = e; log(`ghi ${file} lần ${i + 1} lỗi ${e.code || e.message} — thử lại sau 10s`); await sleep(10000); }
  }
  throw lastErr;
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
  async send(method, params = {}, timeoutMs = 60000) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout ${timeoutMs}ms: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression, awaitPromise = true, timeoutMs = 60000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise }, timeoutMs);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
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
  window.__j9errors = [];
  window.addEventListener("error", (e) => { try { window.__j9errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__j9errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__j9errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__j9errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__j9storeMod || (window.__j9storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({ trackId: t.id, clipId: c.id, kind: c.kind, src: c.src, start: c.start, duration: c.duration, in: c.in, out: c.out });
  const canvas = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  return { clips, playhead: st.playhead, playing: st.playing,
    hold: window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null,
    idle: window.__vcutPreviewIdle ? { ticks: window.__vcutPreviewIdle.ticks, sleeping: window.__vcutPreviewIdle.sleeping } : null,
    canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    errors: (window.__j9errors || []).slice() };
})()`;

const DRAW_WRAP_FN = `(() => {
  if (window.__j9draw) return "already";
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  const stats = {};
  window.__j9draw = { stats, reset() { for (const k of Object.keys(stats)) delete stats[k]; } };
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    const t0 = performance.now();
    try { return orig.apply(this, args); } finally {
      const dt = performance.now() - t0;
      const c = this.canvas;
      const src = args[0];
      const srcType = src instanceof HTMLVideoElement ? "video"
        : src instanceof HTMLCanvasElement ? "canvas"
        : src instanceof HTMLImageElement ? "image"
        : (typeof VideoFrame !== "undefined" && src instanceof VideoFrame) ? "videoframe" : "other";
      const key = c ? (srcType + "->" + c.width + "x" + c.height) : "?";
      const s = stats[key] || (stats[key] = { calls: 0, ms: 0 });
      s.calls++; s.ms += dt;
    }
  };
  return "installed";
})()`;
const DRAW_RESET_FN = `window.__j9draw && window.__j9draw.reset(), "reset"`;
const DRAW_READ_FN = `(() => {
  const s = window.__j9draw ? window.__j9draw.stats : {};
  const out = {};
  for (const [k, v] of Object.entries(s)) out[k] = { calls: v.calls, ms: +v.ms.toFixed(1), msPerCall: +(v.ms / Math.max(1, v.calls)).toFixed(2) };
  return out;
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
    gapMax: +gaps[gaps.length - 1].toFixed(1), over100: s.filter((x) => x.gapMs > 100).length };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const CANVAS_STATS_FN = `(() => {
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

// Micro-benchmark drawImage: chạy trong 1 evaluate async (~25s).
const MICROBENCH_FN = (mediaUrl) => `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pct = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
  const mean = (xs) => xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null;
  const summ = (xs) => ({ n: xs.length, mean: mean(xs), p50: pct(xs, 0.5), p95: pct(xs, 0.95), max: xs.length ? +Math.max(...xs).toFixed(2) : null });
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const s720 = mk(1280, 720), sBig = mk(1991, 815);
  // Nguồn canvas đối chứng: vẽ gradient + noise 1 lần.
  const srcCanvas = mk(1280, 720);
  { const x = srcCanvas.getContext("2d"); const g = x.createLinearGradient(0, 0, 1280, 720); g.addColorStop(0, "#224"); g.addColorStop(1, "#842"); x.fillStyle = g; x.fillRect(0, 0, 1280, 720); for (let i = 0; i < 400; i++) { x.fillStyle = "rgba(255,255,255,0.5)"; x.fillRect((i * 37) % 1280, (i * 91) % 720, 6, 6); } }
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto";
  v.src = ${JSON.stringify(mediaUrl)};
  document.body.appendChild(v);
  await v.play().catch((e) => { throw new Error("play microbench video thất bại: " + e.message); });
  await sleep(1500);
  if (!(v.currentTime > 0.5)) throw new Error("video microbench không tiến (currentTime=" + v.currentTime + ")");
  const q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  const timeOne = (fn) => { const t0 = performance.now(); fn(); return performance.now() - t0; };
  // P1: đang phát — vẽ liên tiếp, ghi ms + currentTime từng lần.
  const p1_720 = [], p1_big = [], p1_ct = [];
  for (let i = 0; i < 40; i++) {
    p1_720.push(timeOne(() => s720.getContext("2d").drawImage(v, 0, 0, 1280, 720)));
    p1_ct.push(+v.currentTime.toFixed(3));
  }
  for (let i = 0; i < 40; i++) {
    p1_big.push(timeOne(() => sBig.getContext("2d").drawImage(v, 0, 0, 1991, 815)));
    p1_ct.push(+v.currentTime.toFixed(3));
  }
  const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  // P2: pause + seek từng mốc, vẽ 3 lần liên tiếp sau 'seeked'.
  v.pause();
  const p2_first = [], p2_second = [], p2_third = [];
  for (let k = 0; k < 10; k++) {
    const target = 1 + k * 1.7;
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error("seek timeout target=" + target)), 10000);
      v.onseeked = () => { clearTimeout(to); res(); };
      v.currentTime = target;
    });
    const ctx = s720.getContext("2d");
    p2_first.push(timeOne(() => ctx.drawImage(v, 0, 0, 1280, 720)));
    p2_second.push(timeOne(() => ctx.drawImage(v, 0, 0, 1280, 720)));
    p2_third.push(timeOne(() => ctx.drawImage(v, 0, 0, 1280, 720)));
  }
  // P3: đối chứng canvas->canvas (blit thuần).
  const p3 = [];
  for (let i = 0; i < 40; i++) p3.push(timeOne(() => s720.getContext("2d").drawImage(srcCanvas, 0, 0, 1280, 720)));
  // P4: pause, cùng frame (không seek giữa các lần), video->1991x815.
  const p4 = [];
  for (let i = 0; i < 40; i++) p4.push(timeOne(() => sBig.getContext("2d").drawImage(v, 0, 0, 1991, 815)));
  v.remove();
  const ctChanges = p1_ct.slice(1).filter((c, i) => Math.abs(c - p1_ct[i]) > 0.001).length;
  return {
    video: { w: v.videoWidth, h: v.videoHeight, duration: +v.duration.toFixed(2), endedCt: +v.currentTime.toFixed(2) },
    p1_playing_720: summ(p1_720), p1_playing_big: summ(p1_big),
    p1_currentTimeChanges: ctChanges + " / " + (p1_ct.length - 1) + " lần vẽ đổi currentTime",
    p1_quality: q0 && q1 ? { totalDelta: q1.totalVideoFrames - q0.totalVideoFrames, droppedDelta: q1.droppedVideoFrames - q0.droppedVideoFrames } : null,
    p2_afterSeek_first: summ(p2_first), p2_afterSeek_second: summ(p2_second), p2_afterSeek_third: summ(p2_third),
    p3_canvasControl_720: summ(p3), p4_pausedSameFrame_big: summ(p4),
  };
})()`;

// Phase 3 — so sánh imageSmoothingQuality cho lần vẽ upscale video
// 1280x720 -> 1991x815 (đúng khổ canvas preview ở cửa sổ 2560x1440).
const SMOOTHING_FN = (mediaUrl) => `(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pct = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2); };
  const mean = (xs) => xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : null;
  const summ = (xs) => ({ n: xs.length, mean: mean(xs), p50: pct(xs, 0.5), p95: pct(xs, 0.95), max: xs.length ? +Math.max(...xs).toFixed(2) : null });
  const sBig = document.createElement("canvas"); sBig.width = 1991; sBig.height = 815;
  const ctx = sBig.getContext("2d");
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto";
  v.src = ${JSON.stringify(mediaUrl)};
  document.body.appendChild(v);
  await v.play();
  await sleep(1500);
  if (!(v.currentTime > 0.5)) throw new Error("video smoothing không tiến (currentTime=" + v.currentTime + ")");
  const modes = [["high", true], ["medium", true], ["low", true], ["off", false]];
  const out = {};
  // Đang phát: mỗi lần vẽ là frame mới (kèm upload frame).
  for (const [q, en] of modes) {
    ctx.imageSmoothingEnabled = en;
    if (en) ctx.imageSmoothingQuality = q;
    const xs = [];
    for (let i = 0; i < 30; i++) { const t0 = performance.now(); ctx.drawImage(v, 0, 0, 1991, 815); xs.push(performance.now() - t0); }
    out["playing_" + q] = summ(xs);
  }
  // Pause + seek 1 mốc: cùng frame vẽ lặp (chỉ còn chi phí blit/scale).
  v.pause();
  await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error("seek timeout smoothing")), 10000);
    v.onseeked = () => { clearTimeout(to); res(); };
    v.currentTime = 5;
  });
  for (const [q, en] of modes) {
    ctx.imageSmoothingEnabled = en;
    if (en) ctx.imageSmoothingQuality = q;
    const xs = [];
    for (let i = 0; i < 30; i++) { const t0 = performance.now(); ctx.drawImage(v, 0, 0, 1991, 815); xs.push(performance.now() - t0); }
    out["paused_" + q] = summ(xs);
  }
  v.remove();
  return out;
})()`;

let vite = null, xvfb = null, chrome = null;
function killAll() {
  try { chrome?.kill("SIGKILL"); } catch {}
  try { xvfb?.kill("SIGKILL"); } catch {}
  try { vite?.kill("SIGKILL"); } catch {}
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const DEV_PORT = Number(process.env.J9_DEV_PORT || 0) || (await pickFreePort(5598, 5599));
  const DEBUG_PORT = Number(process.env.J9_DEBUG_PORT || 0) || (await pickFreePort(9698, 9699));
  const DISPLAY = process.env.J9_DISPLAY || ":197";
  if (!DEV_PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["long720.mp4", "long1080.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r82j9-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  // TMPDIR PHẢI NGẮN: Chrome đặt SingletonSocket dưới $TMPDIR, giới hạn
  // socket Unix ~108 ký tự — đường dẫn workspace sâu làm Chrome FATAL
  // "Socket path too long" (lần 7). /tmp/round82-j9/tmp đã chứng minh
  // chạy được (lần 1–2); sóng EPERM trên /tmp chỉ ảnh hưởng ghi file,
  // Chrome ghi temp ít và chịu được.
  const TMPDIR = "/tmp/round82-j9/tmp";
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
  await writeFileRetry(VITE_CFG, `import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});
const react = require("@vitejs/plugin-react").default;
const MEDIA_DIR = ${JSON.stringify(MEDIA_DIR)};
const MIME = { ".mp4": "video/mp4", ".png": "image/png", ".webm": "video/webm", ".jpg": "image/jpeg" };
const mediaPlugin = () => ({ name: "j9-media", configureServer(server) {
  server.middlewares.use("/r82j9-media", (req, res) => {
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

  const viteLogFd = fs.openSync(path.join(SCRATCH, "probe-vite.log"), "w");
  vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    if (vite.exitCode !== null) break;
    try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`vite :${DEV_PORT} không lên (exit ${vite.exitCode})`);
  const mediaProbe = await fetch(MEDIA_URL("long720.mp4"), { headers: { Range: "bytes=0-99" } });
  if (mediaProbe.status !== 206) throw new Error(`media probe trả ${mediaProbe.status} (không phải 206)`);
  log("vite dev + media probe 206 đã lên");

  const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", `${WIN}x24`], { stdio: "ignore" });
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) { if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true; else await sleep(500); }
    if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s`);
    log(`Xvfb ${DISPLAY} đã khởi động`);
  } else log(`Xvfb ${DISPLAY} đã có sẵn (dùng chung)`);
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "probe-chrome.log"), "w");
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

  const result = { script: "probe-82j9-draw-cost.mjs", timestamp: new Date().toISOString(), loadBefore: loadAvg(), window: WIN };
  try {
    // Đóng modal chào.
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) break;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    const s0 = await (async () => {
      // Sample media được sinh bằng MediaRecorder trong trang (mất ≥8s
      // wall ngay cả khi rảnh; dưới tải cao còn lâu hơn) nên chờ tới
      // 300s, log tiến độ mỗi 30s thay vì im lặng như waitFor.
      const t0 = Date.now();
      let lastLog = 0;
      while (Date.now() - t0 < 300000) {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        if (t && t.clips && t.clips.length === 3) return t;
        if (Date.now() - lastLog > 30000) {
          lastLog = Date.now();
          log(`chờ project mẫu… ${Math.round((Date.now() - t0) / 1000)}s, clips=${t && t.clips ? t.clips.length : "?"}, loadavg ${loadAvg()}`);
        }
        await sleep(2000);
      }
      throw new Error("timeout chờ project mẫu tự load (3 clip) sau 300s");
    })();
    const firstClipId = s0.clips.find((c) => c.trackId === "v1").clipId;
    const secondClipId = s0.clips.find((c) => c.trackId === "v1" && c.clipId !== firstClipId).clipId;
    log(`project mẫu: canvas ${s0.canvasW}x${s0.canvasH}, clip1 ${firstClipId}, clip2 ${secondClipId}, loadavg ${loadAvg()}`);
    const drawWrap = await cdp.evalJs(DRAW_WRAP_FN);
    log(`bọc drawImage: ${drawWrap}`);
    // Đổi clip 1 -> long720 (20s), clip 2 cũng sang long720 (source 0-4s)
    // để video active liên tục [0,8s) thay vì chỉ [0,4s) — lần 8 patch
    // chỉ đổi out mà duration clip 1 vẫn 4s nên chỉ thu được 28 draw.
    const patched = await cdp.evalJs(`(async () => {
      const st = await (${STORE_FN});
      const url = ${JSON.stringify(MEDIA_URL("long720.mp4"))};
      window.__j9storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-j9-long720", name: "long720.mp4", kind: "video", url, duration: 20, width: 1280, height: 720 }] }));
      const st2 = window.__j9storeMod.useStore.getState();
      const c1 = st2.spec.tracks.find((t) => t.id === "v1").clips[0];
      const c2 = st2.spec.tracks.find((t) => t.id === "v1").clips[1];
      window.__j9storeMod.useStore.getState().patchClip("v1", c1.id, { src: "long720.mp4", in: 0, out: 20 });
      window.__j9storeMod.useStore.getState().patchClip("v1", c2.id, { src: "long720.mp4", in: 0, out: 4 });
      const st3 = window.__j9storeMod.useStore.getState();
      const d1 = st3.spec.tracks.find((t) => t.id === "v1").clips[0];
      const d2 = st3.spec.tracks.find((t) => t.id === "v1").clips[1];
      return { c1: { src: d1.src, start: d1.start, duration: d1.duration, in: d1.in, out: d1.out }, c2: { src: d2.src, start: d2.start, duration: d2.duration, in: d2.in, out: d2.out } };
    })()`);
    log(`patch clip: ${JSON.stringify(patched)}`);
    if (patched.c1.src !== "long720.mp4" || !(patched.c1.out >= 19)) throw new Error("patch clip1 long720 thất bại: " + JSON.stringify(patched));
    if (patched.c2.src !== "long720.mp4") throw new Error("patch clip2 long720 thất bại: " + JSON.stringify(patched));
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, "preview ngủ sau seek 0", 60000);
    await sleep(500);
    const shot = await cdp.evalJs(CANVAS_STATS_FN);
    log(`canvas @0s: mean=${shot.mean} std=${shot.std}`);
    if (!shot.ok || shot.std < 8) throw new Error(`canvas phẳng/placeholder (std ${shot?.std}) — frame long720 chưa vẽ được`);

    // ---- Phase 1: phát 12s, phân rã tick -------------------------------
    const holdBefore = (await cdp.evalJs(STATE_FN)).hold;
    const idleBefore = (await cdp.evalJs(STATE_FN)).idle;
    // Lần 9+: đếm reseek syncMedia (video) trong cửa sổ phát — kiểm tra
    // decode-wait (~40ms, ~1/3 tick ở lần 8) có phải do syncMedia seek
    // lại không, hay do decoder lag. Đọc qua winHook (tickInner phơi
    // mỗi tick; undefined = chưa từng set → coi là 0).
    const reseekBefore = await cdp.evalJs(`(window.__vcutSyncReseeksVideo ?? 0) + 0`);
    await cdp.evalJs(DRAW_RESET_FN);
    const t0 = await cdp.evalJs(`performance.now()`);
    await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); st.togglePlay(); return st.playing; })()`);
    let started = false;
    for (let k = 0; k < 8 && !started; k++) { await sleep(500); started = (await cdp.evalJs(STATE_FN)).playing; }
    if (!started) throw new Error("togglePlay mà playing vẫn false sau 4s");
    await sleep(12000);
    const t1 = await cdp.evalJs(`performance.now()`);
    const stAfter = await cdp.evalJs(STATE_FN);
    const stillPlaying = stAfter.playing;
    if (stillPlaying) {
      await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); window.__j9storeMod.useStore.setState({ playing: false }); return true; })()`);
      await sleep(1000);
    }
    const drawStats = await cdp.evalJs(DRAW_READ_FN);
    const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(t0, t1));
    const holdAfter = stAfter.hold;
    const reseekAfter = await cdp.evalJs(`(window.__vcutSyncReseeksVideo ?? 0) + 0`);
    const phase1 = {
      wallSec: +((t1 - t0) / 1000).toFixed(1),
      playheadEnd: stAfter.playhead, stillPlayingAtEnd: stillPlaying,
      drawImage: drawStats,
      raf: rafStats,
      holdDelta: holdBefore && holdAfter ? { draw: holdAfter.draw - holdBefore.draw, hold: holdAfter.hold - holdBefore.hold, skip: holdAfter.skip - holdBefore.skip, maxHoldAgeSec: holdAfter.maxHoldAgeSec } : null,
      ticksDelta: idleBefore && stAfter.idle ? stAfter.idle.ticks - idleBefore.ticks : null,
      syncReseekVideoDelta: (reseekAfter ?? 0) - (reseekBefore ?? 0),
      loadBefore: result.loadBefore, loadAfter: loadAvg(),
      errors: stAfter.errors,
    };
    result.phase1_tickDecomposition = phase1;
    log(`PHASE1: wall ${phase1.wallSec}s, playhead→${phase1.playheadEnd}, drawImage ${JSON.stringify(drawStats)}, raf gap mean ${rafStats?.gapMean}ms (n=${rafStats?.n}), hold delta ${JSON.stringify(phase1.holdDelta)}, ticks +${phase1.ticksDelta}, syncReseekVideo +${phase1.syncReseekVideoDelta}, load ${phase1.loadBefore} → ${phase1.loadAfter}`);

    // ---- Phase 2: micro-benchmark ---------------------------------------
    const micro = await cdp.evalJs(MICROBENCH_FN(MEDIA_URL("long720.mp4")), true, 120000);
    result.phase2_microbench = micro;
    log(`PHASE2 microbench: ${JSON.stringify(micro)}`);

    // ---- Phase 3: imageSmoothingQuality của lần vẽ upscale ------------
    // renderFrame đặt ctx.imageSmoothingQuality="high" trên canvas chính
    // (R8 đợt 63, vì parity sharpen). Trong software raster, "high" có
    // thể đắt hơn hẳn "medium"/"low" cho cùng một lần upscale 720p→
    // 1991x815. Test 4 chế độ × 2 trạng thái (phát = frame mới liên tục
    // / pause = cùng frame), mỗi ô 30 lần vẽ, trên element riêng.
    const smooth = await cdp.evalJs(SMOOTHING_FN(MEDIA_URL("long720.mp4")), true, 120000);
    result.phase3_smoothing = smooth;
    log(`PHASE3 smoothing: ${JSON.stringify(smooth)}`);
    result.loadEnd = loadAvg();
    result.errors = (await cdp.evalJs(`(window.__j9errors || []).slice()`)) || [];
    await writeFileRetry(path.join(SCRATCH, "probe-82j9-draw-cost.json"), JSON.stringify(result, null, 2) + "\n");
    log(`kết quả ghi ra ${path.join(SCRATCH, "probe-82j9-draw-cost.json")}`);
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    result.stack = e instanceof Error ? (e.stack || "").slice(0, 2000) : "";
    try { await writeFileRetry(path.join(SCRATCH, "probe-82j9-draw-cost.json"), JSON.stringify(result, null, 2) + "\n"); } catch { /* hết 5 lần thử ghi thì chịu — lỗi gốc đã log */ }
    log(`LỖI: ${result.error}`);
    process.exitCode = 1;
  } finally {
    killAll();
  }
}

main();
