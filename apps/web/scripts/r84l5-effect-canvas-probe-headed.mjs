#!/usr/bin/env node
/**
 * r84l5-effect-canvas-probe-headed.mjs — Phase 9 đợt 84, luồng L5: probe ĐỌC TRỰC
 * TIẾP effect canvas (nợ J7 §7.1 / K6 §7 mục 2): tách delta lineart theo khâu
 * pipeline preview của Chrome — (A) video→canvas native, (B) video→viewport
 * trực tiếp, (C) effect-canvas input/output qua hook get/putImageData,
 * (D) snapshot cuối. Không sửa production.
 *
 * Sao chép từ r84l5-fullpixel-headed.mjs (giao thức B1 + D1/D2/D3 + H9), tham số
 * hoá qua env. Thêm: hook get/putImageData (Page.addScriptToEvaluateOnNewDocument)
 * ghi lại frame VÀO/RA effect canvas; DIRECT_FN vẽ video→offscreen ở native
 * và viewport-size. Cổng dev/debug (568x/978x) + display (:180–:189) riêng
 * đợt 84 để không đụng luồng khác.
 *
 * Chạy (từ gốc repo):
 *   R84L5_WIN_W=1920 R84L5_WIN_H=1080 R84L5_PROJ_W=640 R84L5_PROJ_H=360 \
 *     R84L5_SOURCES=lineart640,textsmall640 \
 *     R84L5_VARIANTS=plain,sharp05,sharp10 \
 *     node apps/web/scripts/r84l5-effect-canvas-probe-headed.mjs
 * Env: R84L5_WIN_W/R84L5_WIN_H (mặc định 1920×1080),
 *   R84L5_PROJ_W/R84L5_PROJ_H (mặc định 640×360),
 *   R84L5_SOURCES (mặc định "lineart640,textsmall640"; durations trong 1 phiên
 *   PHẢI khác nhau để D3/raw matching không nhầm element — xem ALL_SOURCES),
 *   R84L5_PLAYHEAD (mặc định 1.0), R84L5_SCRATCH, R84L5_VARIANTS
 *   (mặc định "plain,sharp05,sharp10"), R84L5_DEV_PORT, R84L5_DEBUG_PORT,
 *   R84L5_DISPLAY.
 * Exit 0 mọi case đo xong, 1 có case FAIL, 2 harness lỗi.
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
const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const R65 = path.join(GOAL, "round65-s7");
const Y2 = path.join(GOAL, "round71-y2");
const E9 = path.join(GOAL, "round84-l5");
const U3MEDIA = path.join(GOAL, "round67-u3", "media");
const WIN_W = Number(process.env.R84L5_WIN_W || 1920);
const WIN_H = Number(process.env.R84L5_WIN_H || 1080);
const PROJ_W = Number(process.env.R84L5_PROJ_W || 640);
const PROJ_H = Number(process.env.R84L5_PROJ_H || 360);
// Playhead (giây) — frame đo = playhead*30; đưa lên trước SCRATCH vì
// tên thư mục scratch chứa playhead (đợt 80 H3: run A/B cùng cửa sổ +
// project nhưng khác playhead đã ghi đè lẫn nhau khi chưa có hậu tố này).
const PLAYHEAD = Number(process.env.R84L5_PLAYHEAD || 1.0);
const SCRATCH = process.env.R84L5_SCRATCH || path.join(E9, `headed-w${WIN_W}x${WIN_H}-p${PROJ_W}x${PROJ_H}-ph${PLAYHEAD}`);
const CHROME = process.env.R84L5_CHROME || path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round84-l5";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r84l5.config.mjs");

// Nguồn: tên → file (round84-l5/media, sinh bởi r84l5-make-media.py).
// Thời lượng KHÁC NHAU (4.5/4.6) để khớp video element theo duration
// (fix D3 của F6 — pool giữ element nguồn cũ, duration là khoá phân biệt
// duy nhất khi tên file đều là blob URL). Chỉ 2 nguồn mới: lineart 3px/4px
// (đối chứng độ dày cho nợ I3 §4.4); 1px/2px đã có dữ liệu G5/H3.
const G5MEDIA = path.join(GOAL, "round79-g5", "media");
const H3MEDIA = path.join(GOAL, "round80-h3", "media");
// Durations PHẢI khác nhau trong cùng 1 phiên (D3/raw matching khớp element
// theo duration — 2 nguồn cùng duration trong 1 phiên sẽ nhầm element).
// Chạy 2 phiên: {lineart640 4.4, textsmall640 4.0} và {lineart2px-640 4.4, sqw4-640 4.0}.
const ALL_SOURCES = {
  "lineart640": { name: "lineart640", file: path.join(G5MEDIA, "lineart-640.mp4"), frame: 30, duration: 4.4 },
  "lineart2px-640": { name: "lineart2px-640", file: path.join(H3MEDIA, "lineart2px-640.mp4"), frame: 30, duration: 4.4 },
  "textsmall640": { name: "textsmall640", file: path.join(G5MEDIA, "textsmall-640.mp4"), frame: 30, duration: 4.0 },
  "sqw4-640": { name: "sqw4-640", file: path.join(H3MEDIA, "sqw4-640.mp4"), frame: 30, duration: 4.0 },
};
const SOURCES = (process.env.R84L5_SOURCES || "lineart640,textsmall640").split(",").map((s) => s.trim()).filter(Boolean).map((n) => {
  const s = ALL_SOURCES[n];
  if (!s) throw new Error(`nguồn không biết: ${n} (chọn trong: ${Object.keys(ALL_SOURCES).join(",")})`);
  return s;
});
const SOURCES_RUN = SOURCES;
const VARIANTS = (process.env.R84L5_VARIANTS || "plain,sharp05,sharp10").split(",").map((s) => s.trim()).filter(Boolean);

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

const INJECT_ERRORS = `(() => {
  window.__r84l5errors = [];
  window.addEventListener("error", (e) => { try { window.__r84l5errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r84l5errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r84l5errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r84l5errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r84l5storeMod || (window.__r84l5storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, src: c.src ?? null,
    effects: c.effects ?? null,
  });
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const media = (st.media || []).map((m) => ({ name: m.name, kind: m.kind, proxy: !!m.proxyUrl }));
  return { clips, selection: st.selection, playhead: st.playhead, playing: st.playing, idle, media, errors: (window.__r84l5errors || []).slice() };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const st2 = window.__r84l5storeMod.useStore.getState();
  const c = st2.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)}).clips.find((x) => x.id === ${JSON.stringify(clipId)});
  return { patched: n, src: c.src ?? null, effects: c.effects ?? null };
})()`;

// Snapshot TOÀN BỘ pixel vùng video (cùng công thức hình học Y2).
const SNAP_FN = (slot) => `(window.__r84l5snaps = window.__r84l5snaps || {}, window.__r84l5snaps[${JSON.stringify(slot)}] = (() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  if (!ctx) return { ok: false, reason: "không lấy được ctx 2d" };
  const cw = c.width, ch = c.height;
  if (!cw || !ch) return { ok: false, reason: "canvas 0 kích thước" };
  const W = ${PROJ_W}, H = ${PROJ_H};
  const scale = Math.min(cw / W, ch / H);
  const rect = { x: Math.round((cw - W * scale) / 2), y: Math.round((ch - H * scale) / 2), w: Math.round(W * scale), h: Math.round(H * scale), scale };
  const img = ctx.getImageData(rect.x, rect.y, rect.w, rect.h).data;
  const n = rect.w * rect.h;
  const rgb = new Uint8Array(n * 3);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = img[i * 4]; rgb[i * 3 + 1] = img[i * 4 + 1]; rgb[i * 3 + 2] = img[i * 4 + 2];
    sum += img[i * 4] + img[i * 4 + 1] + img[i * 4 + 2];
  }
  let b64 = "";
  const CH = 0x8000;
  for (let i = 0; i < rgb.length; i += CH) b64 += String.fromCharCode.apply(null, rgb.subarray(i, i + CH));
  return { ok: true, w: rect.w, h: rect.h, n, rect, rgbB64: btoa(b64), mean: +(sum / (n * 3)).toFixed(2) };
})(), { ok: window.__r84l5snaps[${JSON.stringify(slot)}].ok, w: window.__r84l5snaps[${JSON.stringify(slot)}].w, h: window.__r84l5snaps[${JSON.stringify(slot)}].h, n: window.__r84l5snaps[${JSON.stringify(slot)}].n, mean: window.__r84l5snaps[${JSON.stringify(slot)}].mean, rect: window.__r84l5snaps[${JSON.stringify(slot)}].rect, reason: window.__r84l5snaps[${JSON.stringify(slot)}].reason || null })`;

// Giao thức cùng-khung (§b): đọc frame decode thô của <video> element
// qua window.__vcutMediaEls (chỉ công bố ở nhánh playing — xem
// ensureMediaEls). drawImage(video) ra offscreen canvas native-size,
// băm FNV-1a trên kênh R mọi pixel + mean RGB + trạng thái element.
// Đợt 78 F6 — SỬA so với E9: chọn element theo dataset.srcKey của nguồn
// đang đo (pool giữ element của nguồn cũ; bản E9 lấy .find() đầu tiên nên
// ở run đa nguồn, nguồn thứ 2+ bị đọc nhầm element nguồn đầu — Run B
// ocean cho hash y hệt test-pattern ad4be1d3, blob URL y hệt). srcKey là
// URL blob (không chứa tên file) nên khớp theo duration của nguồn
// (6 nguồn G5 đều khác nhau: 4,0 / 4,1 / 4,2 / 4,3 / 4,4 / 6,4 s), fallback về
// element video đầu tiên khi không khớp. Ghi duration ra output để kiểm.
const RAW_FN = (wantSrc, wantDur) => `(() => {
  const els = (window.__vcutMediaEls || []).map((e) => e.el).filter((e) => e && e.tagName === "VIDEO");
  // Đợt 80 H3 — FIX D3 (nợ G5 §9.7): KHÔNG fallback els[0] nữa. Bản cũ
  // fallback im lặng về element đầu tiên khi không khớp (vd duration NaN
  // vì metadata chưa tải — noise v1 G5 §7a: D3 đọc nhầm element textsmall
  // mà vẫn PASS giả). Giờ fail rõ kèm durations thực tế để harness thấy.
  const v = els.find((e) => Math.abs((e.duration || 0) - ${wantDur}) < 0.05) || els.find((e) => (e.dataset?.srcKey || "").includes(${JSON.stringify(wantSrc)}));
  if (!v) return { ok: false, reason: "không khớp video element (wantDur=" + ${wantDur} + ", " + els.length + " element, durations=[" + els.map((e) => Number.isFinite(e.duration) ? +e.duration.toFixed(3) : String(e.duration)).join(",") + "]) — D3 FAIL rõ, không fallback els[0]" };
  const w = v.videoWidth || 0, h = v.videoHeight || 0;
  if (!w || !h) return { ok: false, reason: "videoWidth/Height = 0" };
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(v, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  let h1 = 2166136261 >>> 0, sum = 0;
  for (let i = 0; i < d.length; i += 4) { h1 ^= d[i]; h1 = Math.imul(h1, 16777619) >>> 0; sum += d[i] + d[i + 1] + d[i + 2]; }
  const samples = [];
  for (let k = 0; k < 8; k++) { const p = Math.floor((k + 0.5) * d.length / 8 / 4) * 4; samples.push([d[p], d[p + 1], d[p + 2]]); }
  return { ok: true, hash: h1.toString(16), mean: +(sum / (w * h * 3)).toFixed(2), samples,
    currentTime: +v.currentTime.toFixed(3), paused: v.paused, seeking: v.seeking,
    readyState: v.readyState, vw: w, vh: h, src: (v.currentSrc || v.src || "").slice(-60),
    srcKey: (v.dataset?.srcKey || "").slice(-60), duration: +(v.duration || 0).toFixed(3) };
})()`;

// Phát 1 nhịp ngắn để nhánh playing công bố __vcutMediaEls, rồi dừng.
// Trả về tên cơ chế dùng được ("togglePlay" | null).

// ---- L5: hook đọc trực tiếp effect canvas (không sửa production) ----
// Cài qua Page.addScriptToEvaluateOnNewDocument TRƯỚC khi app load: bọc
// CanvasRenderingContext2D.prototype.getImageData / putImageData, ghi lại
// BẢN SAO cuối cùng theo (canvas, label, kind). Label do harness đặt qua
// window.__r84l5label trước mỗi variant. Chỉ giữ bản sao CUỐI per key nên
// bộ nhớ có chặn trên (1 frame RGBA 640×360 ~0,9MB per key).
// Effect canvas là canvas 640×360 DUY NHẤT có cả get+put trong luồng này
// (chroma/mask không chạy khi clip không có chroma/mask; held-frame chỉ
// drawImage, không get/put; transition offscreen chỉ khi có transition).
const HOOK_JS = `(function () {
  if (window.__r84l5hook) return;
  const ids = new WeakMap();
  let nextId = 1;
  const store = { canvases: {} };
  function cid(cv) { let id = ids.get(cv); if (id === undefined) { id = nextId++; ids.set(cv, id); } return id; }
  function rgb24b64(rgba) {
    const n = rgba.length / 4;
    const rgb = new Uint8Array(n * 3);
    for (let i = 0; i < n; i++) { rgb[i*3] = rgba[i*4]; rgb[i*3+1] = rgba[i*4+1]; rgb[i*3+2] = rgba[i*4+2]; }
    let s = "";
    const CH = 0x8000;
    for (let i = 0; i < rgb.length; i += CH) s += String.fromCharCode.apply(null, rgb.subarray(i, i + CH));
    return btoa(s);
  }
  function rec(cv, kind, data) {
    const id = cid(cv);
    const r = store.canvases[id] || (store.canvases[id] = { w: cv.width, h: cv.height, gets: {}, puts: {} });
    const lab = window.__r84l5label || "?";
    const slot = kind === "get" ? r.gets : r.puts;
    const prev = slot[lab];
    slot[lab] = { n: (prev ? prev.n : 0) + 1, rgba: data.slice() };
  }
  const P = CanvasRenderingContext2D.prototype;
  const origGet = P.getImageData;
  const origPut = P.putImageData;
  P.getImageData = function (sx, sy, sw, sh) {
    const r = origGet.call(this, sx, sy, sw, sh);
    try { rec(this.canvas, "get", r.data); } catch (e) {}
    return r;
  };
  P.putImageData = function (img, dx, dy) {
    try { rec(this.canvas, "put", img.data); } catch (e) {}
    return origPut.call(this, img, dx, dy);
  };
  window.__r84l5hook = store;
  window.__r84l5rgb24b64 = rgb24b64;
})();`;

// DIRECT_FN: vẽ video element thẳng ra offscreen canvas ở (A) native
// 640×360 và (B) viewport-size (rect.w×rect.h) — tách khâu drawImage của
// video khỏi composite của app. Chạy SAU snapshot, cùng frame (paused).
// Đặt label="direct" trước khi gọi để các get này không lẫn vào hook
// effect-canvas (canvas mới mỗi lần gọi, chỉ có get, không có put).
const DIRECT_FN = (wantDur, vw, vh) => `(() => {
  const els = (window.__vcutMediaEls || []).map((e) => e.el).filter((e) => e && e.tagName === "VIDEO");
  const v = els.find((e) => Math.abs((e.duration || 0) - ${wantDur}) < 0.05);
  if (!v) return { ok: false, reason: "không khớp video element (wantDur=" + ${wantDur} + ", durations=[" + els.map((e) => Number.isFinite(e.duration) ? +e.duration.toFixed(3) : String(e.duration)).join(",") + "])" };
  const out = {};
  for (const [key, W, H] of [["native", v.videoWidth, v.videoHeight], ["viewport", ${vw}, ${vh}]]) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    x.drawImage(v, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    const n = W * H;
    const rgb = new Uint8Array(n * 3);
    let sum = 0;
    for (let i = 0; i < n; i++) { rgb[i*3] = d[i*4]; rgb[i*3+1] = d[i*4+1]; rgb[i*3+2] = d[i*4+2]; sum += d[i*4] + d[i*4+1] + d[i*4+2]; }
    let b64 = "";
    const CH = 0x8000;
    for (let i = 0; i < rgb.length; i += CH) b64 += String.fromCharCode.apply(null, rgb.subarray(i, i + CH));
    out[key] = { w: W, h: H, mean: +(sum / (n * 3)).toFixed(2), rgbB64: btoa(b64) };
  }
  return { ok: true, currentTime: +v.currentTime.toFixed(3), paused: v.paused, duration: +(v.duration || 0).toFixed(3), ...out };
})()`;

// HOOKDUMP_FN: xuất hook store về JSON (chuyển RGBA→RGB24 base64 lúc dump).
const HOOKDUMP_FN = `(() => {
  const st = window.__r84l5hook;
  if (!st) return { ok: false, reason: "hook chưa cài (window.__r84l5hook vắng)" };
  const b64 = window.__r84l5rgb24b64;
  const canvases = [];
  for (const [id, r] of Object.entries(st.canvases)) {
    const c = { id: +id, w: r.w, h: r.h, gets: {}, puts: {} };
    for (const [lab, g] of Object.entries(r.gets)) c.gets[lab] = { n: g.n, rgbB64: b64(g.rgba) };
    for (const [lab, g] of Object.entries(r.puts)) c.puts[lab] = { n: g.n, rgbB64: b64(g.rgba) };
    canvases.push(c);
  }
  return { ok: true, label: window.__r84l5label || "?", canvases };
})()`;

const PLAY_TRICK_FN = `(async () => {
  const st = await (${STORE_FN});
  if (typeof st.togglePlay === "function") { st.togglePlay(); return "togglePlay"; }
  return null;
})()`;
const PAUSE_TRICK_FN = (mech) => `(async () => {
  const st = await (${STORE_FN});
  if (${JSON.stringify(mech)} === "togglePlay" && typeof st.togglePlay === "function") { st.togglePlay(); return "togglePlay"; }
  return null;
})()`;

const SEED_SPEC = {
  version: "0.2.0",
  meta: { name: `R84L5 ${SOURCES_RUN[0].name}`, width: PROJ_W, height: PROJ_H, fps: 30 },
  tracks: [{
    id: "v1", kind: "video",
    clips: [{ kind: "video", id: "c1", src: path.basename(SOURCES_RUN[0].file), start: 0, duration: 4, in: 0, out: 4 }],
  }],
};

function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];
  const snaps = {}; // source -> variant -> snapshot (full-pixel)
  const rawFrames = {}; // source -> variant -> raw video frame hash/state
  const directDraws = {}; // source -> variant -> {native, viewport} (video->offscreen)
  const hookDumps = {}; // source -> variant -> hook get/put per canvas
  const proxyUsed = {};

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

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

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r84l5errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r84l5errors = []`).catch(() => {});
    return e;
  }

  async function waitIdle(cdp, label) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, 120000);
  }

  // Chạy nhánh playing 1 nhịp để __vcutMediaEls được công bố (nó chỉ
  // gán ở nhánh playing của preview.tsx), rồi dừng lại. Gọi lại sau
  // mỗi lần đổi nguồn vì pool tạo element mới theo media item.
  async function ensureMediaEls(cdp, label) {
    const mech = await cdp.evalJs(PLAY_TRICK_FN).catch(() => null);
    if (!mech) { log(`CẢNH BÁO ensureMediaEls(${label}): không có togglePlay — giao thức cùng-khung hạ cấp (không có raw hash)`); return false; }
    await sleep(900);
    await cdp.evalJs(PAUSE_TRICK_FN(mech)).catch(() => {});
    await sleep(400);
    const n = await cdp.evalJs(`(window.__vcutMediaEls || []).length`).catch(() => 0);
    log(`ensureMediaEls(${label}): mech=${mech}, __vcutMediaEls=${n}`);
    return n > 0;
  }

  async function rawFrame(cdp, source, slot) {
    const srcDef = SOURCES_RUN.find((s) => s.name === source) || {};
    const wantSrc = path.basename(srcDef.file || source);
    const r = await cdp.evalJs(RAW_FN(wantSrc, srcDef.duration || 0)).catch((e) => ({ ok: false, reason: `eval lỗi: ${e.message}` }));
    rawFrames[source] = rawFrames[source] || {};
    rawFrames[source][slot] = r;
    return r;
  }

  async function snapAt(cdp, source, slot, playhead) {
    await cdp.evalJs(SET_PLAYHEAD_FN(playhead));
    await waitIdle(cdp, `snapshot ${source}/${slot} @${playhead}`);
    const raw = await rawFrame(cdp, source, slot);
    if (!raw.ok) log(`CẢNH BÁO raw frame ${source}/${slot} thất bại: ${raw.reason}`);
    const s = await cdp.evalJs(SNAP_FN(`${source}/${slot}`));
    if (!s.ok) throw new Error(`snapshot ${source}/${slot} thất bại: ${s.reason}`);
    if (s.mean < 5) throw new Error(`snapshot ${source}/${slot} quá tối (mean=${s.mean}) — video chưa load/seek chưa xong?`);
    snaps[source] = snaps[source] || {};
    snaps[source][slot] = await cdp.evalJs(`window.__r84l5snaps[${JSON.stringify(`${source}/${slot}`)}]`);
    return s;
  }

  async function setEffects(cdp, effectsJson, label) {
    const p = await cdp.evalJs(PATCH_FN("v1", "c1", effectsJson));
    const want = JSON.parse(effectsJson).effects ?? null;
    const got = JSON.stringify(p.effects ?? null);
    if (got !== JSON.stringify(want ?? null)) throw new Error(`patch effects ${label} thất bại: muốn ${JSON.stringify(want)}, được ${got}`);
    return p;
  }

  async function setSource(cdp, srcName) {
    const p = await cdp.evalJs(PATCH_FN("v1", "c1", JSON.stringify({ src: srcName })));
    if (p.src !== srcName) throw new Error(`patch src thất bại: muốn ${srcName}, được ${p.src}`);
    return p;
  }

  try {
    for (const s of SOURCES_RUN) if (!fs.existsSync(s.file)) throw new Error(`không thấy media ${s.file}`);
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = Number(process.env.R84L5_DEV_PORT || 0) || (await pickFreePort(5680, 5689));
    const DEBUG_PORT = Number(process.env.R84L5_DEBUG_PORT || 0) || (await pickFreePort(9780, 9789));
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
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return `:${n}`;
      }
      return null;
    }
    const DISPLAY = process.env.R84L5_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :180–:189");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5680–5689");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9780–9789");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round84-l5/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}, window=${WIN_W}x${WIN_H}, sources=${SOURCES_RUN.map((s) => s.name).join(",")}, variants=${VARIANTS.join(",")}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r84l5-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r84l5-chrome.log"), "w");
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
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: HOOK_JS });
    log("hook get/putImageData đã cài (Page.addScriptToEvaluateOnNewDocument)");
    await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");
    await cdp.evalJs(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(SEED_SPEC, `R84L5 ${SOURCES_RUN[0].name}`))});`);
    await cdp.send("Page.reload");
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()`).catch(() => null);
      return s;
    }, "app mount sau reload", 240000);
    await sleep(1500);
    const relink = await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
    if (relink) {
      log("setup: RelinkPanel hiện (media seed thiếu) -> đóng bằng click thật");
      const btn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.title === "Đóng (bỏ qua)"); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (btn) await cdp.click(btn.x, btn.y);
      await cdp.waitFor(async () => !(await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`)), "RelinkPanel đóng", 15000);
    } else log("setup: không thấy RelinkPanel");
    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");

    await cdp.waitFor(async () => (await cdp.evalJs(`!!document.querySelector(".mediabin")`)) ? true : null, "MediaBin sẵn", 30000);
    const doc = await cdp.send("DOM.getDocument", { depth: 0 });
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" });
    if (!q.nodeId) throw new Error("không tìm được file input của MediaBin qua DOM.querySelector");
    for (const s of SOURCES_RUN) {
      await cdp.send("DOM.setFileInputFiles", { files: [s.file], nodeId: q.nodeId });
      const base = path.basename(s.file);
      await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        return t && t.media.some((m) => m.name === base) ? t : null;
      }, `media ${base} vào bin`, 60000);
      log(`media đã vào bin: ${base}`);
    }
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 1 && t.clips[0].clipId === "c1" && t.idle && t.idle.sleeping ? t : null;
    }, "project seed (1 clip c1) + preview ngủ", 120000);
    await drainErrors(cdp);
    for (const s of SOURCES_RUN) {
      const base = path.basename(s.file);
      proxyUsed[s.name] = s0.media.find((m) => m.name === base)?.proxy === true;
    }
    log(`setup: clip c1, proxyUsed=${JSON.stringify(proxyUsed)} (kỳ vọng false hết)`);
    if (Object.values(proxyUsed).some(Boolean)) log("CẢNH BÁO: có nguồn đang dùng proxy — số parity sẽ bao gồm cả sai số proxy, ghi rõ trong LIMITS");

    // ---- Vòng nguồn: plain/plain2/noise05 (+noise05b) ----------------
    for (const src of SOURCES_RUN) {
      const base = path.basename(src.file);
      log(`--- nguồn ${src.name} (${base}, frame render ${src.frame}) ---`);
      // Clip seed mang src của nguồn đầu tiên — mọi nguồn khác đều phải patch src.
      if (src.name !== SOURCES_RUN[0].name) await setSource(cdp, base);
      await setEffects(cdp, JSON.stringify({ effects: [] }), `clear effects ${src.name}`);
      // Công bố __vcutMediaEls cho nguồn này (element mới sau đổi src).
      const elsOk = await ensureMediaEls(cdp, src.name);
      if (!elsOk) log(`CẢNH BÁO: ${src.name} không lấy được video element — giao thức cùng-khung hạ cấp cho nguồn này`);
      for (const variant of VARIANTS) {
        // Gắn label cho hook TRƯỚC khi patch effects để mọi tick của
        // variant này được tag đúng (tick cuối trước khi ngủ mới giữ lại).
        await cdp.evalJs(`window.__r84l5label = ${JSON.stringify(variant)}`);
        if (variant === "plain") {
          await setEffects(cdp, JSON.stringify({ effects: [] }), `plain ${src.name}`);
        } else if (variant === "sharp05") {
          await setEffects(cdp, JSON.stringify({ effects: [{ type: "sharpen", intensity: 0.5 }] }), `sharp05 ${src.name}`);
        } else if (variant === "sharp10") {
          await setEffects(cdp, JSON.stringify({ effects: [{ type: "sharpen", intensity: 1 }] }), `sharp10 ${src.name}`);
        } else {
          throw new Error(`variant không hỗ trợ trong probe L5: ${variant}`);
        }
        const s = await snapAt(cdp, src.name, variant, PLAYHEAD);
        // (A/B) vẽ trực tiếp video element ra offscreen (label "direct" để
        // không lẫn hook effect-canvas), rồi dump hook (C).
        await cdp.evalJs(`window.__r84l5label = "direct"`);
        const dd = await cdp.evalJs(DIRECT_FN(src.duration, s.w, s.h)).catch((e) => ({ ok: false, reason: `eval lỗi: ${e.message}` }));
        directDraws[src.name] = directDraws[src.name] || {};
        directDraws[src.name][variant] = dd;
        await cdp.evalJs(`window.__r84l5label = ${JSON.stringify(variant)}`);
        const hd = await cdp.evalJs(HOOKDUMP_FN).catch((e) => ({ ok: false, reason: `eval lỗi: ${e.message}` }));
        hookDumps[src.name] = hookDumps[src.name] || {};
        hookDumps[src.name][variant] = hd;
        const nHook = hd.ok ? hd.canvases.filter((c) => c.w === PROJ_W && c.h === PROJ_H && Object.keys(c.gets).length && Object.keys(c.puts).length).length : -1;
        log(`${src.name}/${variant}: rect ${s.w}x${s.h} mean ${s.mean} rawHash=${(rawFrames[src.name][variant] || {}).hash || "?"} ct=${(rawFrames[src.name][variant] || {}).currentTime ?? "?"} directOk=${!!dd.ok} hook640getput=${nHook}`);
      }
      // D1 (cùng-khung): raw hash + currentTime khớp nhau giữa các variant.
      const rPlain = rawFrames[src.name]?.plain;
      const rS05 = rawFrames[src.name]?.sharp05;
      const rS10 = rawFrames[src.name]?.sharp10;
      if (rPlain?.ok && rS05?.ok && rS10?.ok) {
        if (rPlain.hash === rS05.hash && rPlain.hash === rS10.hash && rPlain.currentTime === rS05.currentTime && rPlain.currentTime === rS10.currentTime) {
          pass(`D1 ${src.name}: cùng-khung (raw hash + currentTime khớp plain/sharp05/sharp10)`, `hash=${rPlain.hash} ct=${rPlain.currentTime} paused=${rPlain.paused}/${rS05.paused}/${rS10.paused}`);
        } else {
          fail(`D1 ${src.name}: cùng-khung (raw hash + currentTime khớp plain/sharp05/sharp10)`, `plain hash=${rPlain.hash} ct=${rPlain.currentTime} vs sharp05 hash=${rS05.hash} ct=${rS05.currentTime} vs sharp10 hash=${rS10.hash} ct=${rS10.currentTime}`);
        }
      } else {
        fail(`D1 ${src.name}: cùng-khung (raw frame hash)`, `raw plain ok=${!!rPlain?.ok} (${rPlain?.reason || ""}) / sharp05 ok=${!!rS05?.ok} / sharp10 ok=${!!rS10?.ok}`);
      }
      // D2: vẽ trực tiếp video→offscreen native xác định theo variant
      // (cùng frame → cùng pixel): A_plain == A_sharp05 == A_sharp10.
      const dPlain = directDraws[src.name]?.plain;
      const dS05 = directDraws[src.name]?.sharp05;
      const dS10 = directDraws[src.name]?.sharp10;
      if (dPlain?.ok && dS05?.ok && dS10?.ok) {
        if (dPlain.native.rgbB64 === dS05.native.rgbB64 && dPlain.native.rgbB64 === dS10.native.rgbB64) {
          pass(`D2 ${src.name}: direct-draw native pixel-identical qua 3 variant (cùng frame)`, `native ${dPlain.native.w}x${dPlain.native.h} mean ${dPlain.native.mean}`);
        } else {
          fail(`D2 ${src.name}: direct-draw native pixel-identical qua 3 variant`, `plain mean ${dPlain.native.mean} vs sharp05 mean ${dS05.native.mean} vs sharp10 mean ${dS10.native.mean} — b64 khác nhau`);
        }
      } else {
        fail(`D2 ${src.name}: direct-draw native`, `plain ok=${!!dPlain?.ok} / sharp05 ok=${!!dS05?.ok} / sharp10 ok=${!!dS10?.ok}`);
      }
      // D3: hook bắt được effect canvas (get+put, 640×360) ở sharp05/10
      // và KHÔNG bắt được ở plain (ops rỗng → effectCanvasSource null).
      const hookHas = (variant) => {
        const hd = hookDumps[src.name]?.[variant];
        if (!hd?.ok) return false;
        return hd.canvases.some((c) => c.w === PROJ_W && c.h === PROJ_H && c.gets[variant] && c.puts[variant]);
      };
      const hPlain = hookHas("plain"), hS05 = hookHas("sharp05"), hS10 = hookHas("sharp10");
      if (!hPlain && hS05 && hS10) {
        pass(`D3 ${src.name}: hook effect-canvas (get+put 640x360) chỉ có ở sharp05/10, vắng ở plain`, `plain=${hPlain} sharp05=${hS05} sharp10=${hS10}`);
      } else {
        fail(`D3 ${src.name}: hook effect-canvas (get+put 640x360) chỉ có ở sharp05/10, vắng ở plain`, `plain=${hPlain} sharp05=${hS05} sharp10=${hS10}`);
      }
      await drainErrors(cdp);
    }

    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    writeFileEpermRetry(path.join(SCRATCH, `r84l5-snaps-w${WIN_W}x${WIN_H}-p${PROJ_W}x${PROJ_H}.json`), JSON.stringify({
      window: `w${WIN_W}x${WIN_H}`, winW: WIN_W, winH: WIN_H, projW: PROJ_W, projH: PROJ_H,
      sources: SOURCES_RUN.map((s) => ({ name: s.name, file: path.basename(s.file), frame: s.frame })),
      variants: VARIANTS,
      playhead: PLAYHEAD,
      proxyUsed, snaps, rawFrames, directDraws, hookDumps,
    }, null, 2));
    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, `r84l5-headed-report-w${WIN_W}x${WIN_H}-p${PROJ_W}x${PROJ_H}.json`), JSON.stringify({ window: `w${WIN_W}x${WIN_H}`, proj: `${PROJ_W}x${PROJ_H}`, cases: results, pass: nPass, total: results.length, proxyUsed }, null, 2));
    log(`KẾT QUẢ HEADED R84L5 w${WIN_W}x${WIN_H}: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
