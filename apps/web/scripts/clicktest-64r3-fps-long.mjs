#!/usr/bin/env node
/**
 * clicktest-64r3-fps-long.mjs — Phase 9 đợt 64, luồng R3: đo lại FPS blend +
 * spread FPS enhance trên CLIP DÀI (đóng nợ đợt 63 R3 §6.5 "B-headed cho
 * đường cong piecewise chưa chạy được" một phần + đợt 63 R2 §8 "đo FPS
 * enhance trên clip dài thật (>5s)" + "đo spread jitter + FPS enhance
 * trên clip dài hơn 5s").
 *
 * Khác fps-cal (clicktest-61r3-fps-cal.mjs): clip mẫu 1 (4s/640x360) được
 * thay bằng clip dài 20s (long720.mp4 / long1080.mp4, testsrc2 + noise
 * alls=15, libx264 veryfast crf 23, maxrate 10M/16M, GOP 60 — fixture
 * chỉ giữ file trong scratch media, KHÔNG đưa binary vào batch) bằng
 * patchClip theo mẫu D3 của fps-cal (đã chứng minh nạp được element
 * 720p thật); clip mẫu 2 dời sang start=20s; sample 10s/slot thay cho
 * 3s, lặp lại toàn bộ dãy xen kẽ 3 lần (mỗi lần = 1 "repeat") để báo
 * mean + spread (min/max/std) thay vì 1 con số, và đo thêm FPS decode
 * riêng (requestVideoFrameCallback trên tab trắng, không qua canvas
 * preview). GATE warmup + GATE hook (xem main): element clip dài phải
 * thật sự phát được (draw tăng, readyState ≥ 2, buffered > 0) mới đo —
 * bài học lần chạy đầu (draw 0.2fps + hook lệch 1 slot vì element dài
 * không bao giờ load, canvas chỉ giữ frame mẫu cũ — xem LIMITS đợt 64
 * R3 §1): không đạt gate thì DỪNG, không ghi số FPS rác.
 *
 * Các phase:
 *   A. FPS preview clip dài: thứ tự xen kẽ [B,D,B,S,B,C,B] (B=baseline,
 *      D=denoise, S=stabilize, C=combo), mỗi slot seek 0 → verify hook →
 *      phát → warmup 0.8s → mẫu 10.0s (Δ__vcutHoldStats.draw/Δwall).
 *      Tỉ lệ drift-corrected theo baseline kề. Lặp REPEATS lần.
 *      Ngưỡng A FPS 0.75x GIỮ NGUYÊN (đợt 61–63 đều FAIL theo thiết kế —
 *      xem LIMITS đợt 63 §1.2: blend tốn thêm 1 lần vẽ gốc so với blur
 *      thuần nên combo ~0.5x trên VM CPU-only này).
 *   D. FPS decode riêng (tab trắng): video element phát long clip,
 *      đếm frame qua requestVideoFrameCallback 10s tại 3 vị trí seek
 *      (0s/5s/10s — phủ hết clip 20s), kèm dropped/total từ
 *      getVideoPlaybackQuality. Tách được decode khỏi enhance/draw.
 * Encode FPS KHÔNG đo ở đây — đo bằng ffmpeg ở
 * measure-64r3-encode-fps.mjs (decode-only / encode thuần /
 * encode+hqdn3d, ×3 lần, 720p + 1080p).
 *
 * Chạy (từ gốc repo):
 *   R3_LONG_RES=720 R3_LONG_REPEATS=3 node apps/web/scripts/clicktest-64r3-fps-long.mjs
 * Env: R3_LONG_RES (720|1080, mặc định 720), R3_LONG_REPEATS (mặc định 3),
 *   R3_SAMPLE_SECS (mặc định 10), R3_DEV_PORT (5550–5559), R3_DEBUG_PORT
 *   (9650–9659), R3_DISPLAY (quét :180–:189), R3_SCRATCH (mặc định
 *   hidden_files/round64-r3/headed-long). Exit 0 mọi case PASS, 1 có
 *   FAIL, 2 harness lỗi. KHÔNG sửa code sản phẩm, KHÔNG push/tag/binary.
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
const SCRATCH = process.env.R3_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round64-r3", "headed-long");
const RES = process.env.R3_LONG_RES === "1080" ? "1080" : "720";
const REPEATS = Math.max(1, Number(process.env.R3_LONG_REPEATS || 3));
const SAMPLE_SECS = Math.max(3, Number(process.env.R3_SAMPLE_SECS || 10));
const LONG_FILE = RES === "1080" ? "long1080.mp4" : "long720.mp4";
const LONG_W = RES === "1080" ? 1920 : 1280;
const LONG_H = RES === "1080" ? 1080 : 720;
const CLIP_DUR = 20;
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
const CHROME = findChrome() || (() => { throw new Error("không thấy chrome trong ~/.cache/ms-playwright (cần npx playwright install chromium)"); })();
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round64-r3";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r3-long.config.mjs");
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
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
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
    clips,
    selection: st.selection,
    playhead: st.playhead,
    playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled,
    hook, idle, hold,
    canvasW: canvas ? canvas.width : null,
    canvasH: canvas ? canvas.height : null,
    errors: (window.__r3errors || []).slice(),
  };
})()`;

const SAMPLE_FN = `(() => {
  const st = window.__r3storeMod ? window.__r3storeMod.useStore.getState() : null;
  return {
    draw: window.__vcutHoldStats ? window.__vcutHoldStats.draw : null,
    ticks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    ph: st ? st.playhead : null,
    playing: st ? st.playing : null,
    wall: performance.now(),
  };
})()`;

const RAF_STATS_FN = (fromIdx) => `(() => {
  const h = window.__vcutPreviewRaf;
  if (!h || ${fromIdx} < 0) return null;
  const s = h.samples.slice(${fromIdx}).filter((x) => x.playing && !x.justWoke);
  if (!s.length) return { n: 0 };
  const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
  const p = (q) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  return { n: s.length, gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1),
    gapMax: +gaps[gaps.length - 1].toFixed(1), over100: s.filter((x) => x.gapMs > 100).length,
    lostMs: +s.reduce((a, x) => a + x.lostMs, 0).toFixed(0) };
})()`;

// Đợt 66 T5 — BUG n=0 (nợ R64 §8.3, R65 §8 mục 4): RAF_STATS_FN trên cắt
// theo CHỈ SỐ TUYỆT ĐỐI fromIdx (= samples.length lúc đầu slot), nhưng
// __vcutPreviewRaf.samples là ring buffer tối đa 5000 mẫu (xem
// lib/previewRafHook.ts): sau ~83 s rAF (~5000 tick) mẫu cũ bị đẩy ra,
// fromIdx vượt độ dài buffer → slice(fromIdx) = [] → { n: 0 } ở MỌI slot
// sau đó, dù vòng preview vẫn tick bình thường. Sửa gốc rễ: cắt theo
// TIMESTAMP (x.t trong [t0, t1], cùng đồng hồ performance.now() với
// SAMPLE_FN.wall) như measure-65r8-presented-fps.mjs đã chứng minh
// (n=474 lúc lặng). RAF_STATS_FN cũ giữ lại để test hồi quy đối chiếu
// (previewRafHook66T5.test.ts) — KHÔNG dùng trong vòng đo nữa.
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

// Thay clip mẫu 1 bằng clip dài theo mẫu D3 của fps-cal (đã chứng minh
// nạp được element 720p thật: patchClip trên clip đang có, không thay
// cả spec): clip 1 → long clip (in 0, out 20, duration 20), clip 2
// dời sang start=20 để không chồng lên clip 1 trong lúc mẫu 10s;
// track chữ giữ nguyên như điều kiện đợt 63 (so sánh được với số cũ).
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

// Trạng thái element pool của clip dài (đọc từ snapshot __vcutMediaEls —
// CHỈ tươi sau tick playing; xem gate bên dưới). srcAttr=false + rs 0 +
// ns 0 = element đã bị drop (xác chết, xem LIMITS đợt 64 R3 §1).
const LONG_EL_FN = (fileName) => `(() => {
  const rec = (window.__vcutMediaEls || []).find((e) => (e.el.currentSrc || "").includes(${JSON.stringify(fileName)}));
  if (!rec) return null;
  const el = rec.el;
  return { rs: el.readyState, ns: el.networkState, ct: +el.currentTime.toFixed(2), w: el.videoWidth,
    dur: isFinite(el.duration) ? +el.duration.toFixed(2) : String(el.duration),
    err: el.error ? el.error.code : null, buf: el.buffered.length ? +el.buffered.end(el.buffered.length - 1).toFixed(2) : 0,
    srcAttr: !!el.getAttribute("src") };
})()`;

// FPS decode riêng: video element phát clip, đếm frame trình chiếu qua
// requestVideoFrameCallback (không qua canvas preview). Tab phải ở
// foreground thì frame mới trình chiếu đủ tốc — gọi Page.bringToFront
// trước khi đo.
const DECODE_FPS_FN = (videoUrl, seekTo, secs) => `(async () => {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
  v.style.width = "640px"; v.style.height = "360px";
  document.body.appendChild(v);
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  await new Promise((res) => { v.onseeked = res; v.currentTime = ${seekTo}; });
  const q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  let frames = 0, t0 = 0, t1 = 0, firstMedia = 0, lastMedia = 0, ended = false;
  // Đợt 64 R3: guard 'ended' + timeout tường — seek 10s + cửa sổ 10s trên
  // clip 20s chạm đúng cuối clip: video hết thì rVFC ngừng bắn, promise
  // cũ treo mãi → CDP timeout 60s (1080p seek-10 lần 1). Nay resolve khi
  // hết video hoặc quá (secs+5)s wall-clock, không treo nữa.
  await new Promise((res) => {
    let done = false;
    const finish = () => { if (!done) { done = true; res(); } };
    v.onended = () => { ended = true; finish(); };
    setTimeout(finish, (${secs} + 5) * 1000);
    const cb = (now, meta) => {
      if (frames === 0) { t0 = now; firstMedia = meta.mediaTime; }
      frames++; t1 = now; lastMedia = meta.mediaTime;
      if (t1 - t0 < ${secs} * 1000 && !v.ended) v.requestVideoFrameCallback(cb);
      else finish();
    };
    v.requestVideoFrameCallback(cb);
    v.play();
  });
  await new Promise((r) => setTimeout(r, 200));
  v.pause();
  const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
  const wallSecs = (t1 - t0) / 1000;
  return { frames, wallSecs: +wallSecs.toFixed(3),
    fps: +((frames - 1) / wallSecs).toFixed(2),
    mediaRate: +((lastMedia - firstMedia) / wallSecs).toFixed(3),
    dropped: q1 ? q1.droppedVideoFrames - (q0 ? q0.droppedVideoFrames : 0) : null,
    total: q1 ? q1.totalVideoFrames - (q0 ? q0.totalVideoFrames : 0) : null,
    presented: q1 ? q1.totalVideoFrames : null, ended };
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];

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
    const e = (await cdp.evalJs(`(window.__r3errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r3errors = []`).catch(() => {});
    return e;
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
    if (g.coveredBy) log(`cảnh báo: ${testid} bị che bởi ${g.coveredBy} tại điểm bấm — vẫn thử bấm`);
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
    const DEV_PORT = Number(process.env.R3_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
    const DEBUG_PORT = Number(process.env.R3_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
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
    const DISPLAY = process.env.R3_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :180–:189");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(path.join(MEDIA_DIR, LONG_FILE))) throw new Error(`không thấy media fixture ${LONG_FILE} ở ${MEDIA_DIR}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const MEDIA_URL = (f) => `${DEV_URL}r61r3-media/${f}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round64-r3/tmp";
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
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, clip ${LONG_FILE} ${LONG_W}x${LONG_H} 20s, repeats=${REPEATS}, sample=${SAMPLE_SECS}s, loadavg lúc bắt đầu ${loadAvg()}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r3-long-vite.log"), "w");
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
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s (socket ${sock} chưa có)`);
    }
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r3-long-chrome.log"), "w");
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
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- A0: project mẫu tự load, rồi thay bằng clip dài ------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện", 180000);
    const canvasSize = `${s0.canvasW}x${s0.canvasH}`;
    log(`project mẫu: canvas preview backing ${canvasSize}, loadavg ${loadAvg()}`);
    await drainErrors(cdp);
    const v1Clips = s0.clips.filter((c) => c.trackId === "v1");
    const clip1Id = v1Clips[0].clipId;
    const clip2Id = v1Clips[1].clipId;
    const firstClipId = clip1Id;
    const injected = await cdp.evalJs(INJECT_LONG_FN(MEDIA_URL(LONG_FILE), LONG_FILE, LONG_W, LONG_H, CLIP_DUR, clip1Id, clip2Id));
    log(`đã thay clip mẫu 1 bằng clip dài: ${JSON.stringify(injected)}`);
    if (!injected.clip1 || injected.clip1.src !== LONG_FILE || injected.clip1.duration !== CLIP_DUR || !injected.clip2 || injected.clip2.start !== CLIP_DUR) {
      throw new Error(`inject clip dài không đúng kỳ vọng: ${JSON.stringify(injected)}`);
    }
    // Chọn clip dài trên timeline để panel enhance hiện + hook gắn clip.
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.clipId === clip1Id);
    if (!vc) throw new Error("không tìm thấy clip dài trên timeline sau inject");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip dài (hook gắn clip 1)", 60000);
    // Vẽ 1 frame ở playhead 0 để element media được tạo (chẩn đoán D3).
    // LƯU Ý: std canvas ở đây CHƯA đủ chứng minh frame dài đã vẽ — hold
    // có thể giữ frame mẫu cũ (std cao) trong khi element dài chưa load
    // (xem LIMITS đợt 64 R3 §1). Chứng minh thật nằm ở GATE warmup dưới.
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await waitIdle(cdp, "vẽ frame đầu clip dài");
    const shot0 = await cdp.evalJs(`(() => {
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
      return { ok: true, mean: +mean.toFixed(2), std: +Math.sqrt(Math.max(0, sum2 / n - mean * mean)).toFixed(2) };
    })()`);
    log(`canvas clip dài @0s: mean=${shot0.mean} std=${shot0.std} (chỉ tham khảo — chưa chứng minh frame dài, xem gate)`);
    if (!shot0.ok || shot0.std < 8) throw new Error(`canvas clip dài phẳng/placeholder (std ${shot0.std}) — frame chưa vẽ được`);

    // ---- GATE warmup: chứng minh element clip dài THẬT SỰ phát được ----
    // (bài học lần chạy đầu: draw 0.2fps + hook lệch 1 slot vì element
    // dài không bao giờ load, canvas chỉ giữ frame mẫu cũ — xem LIMITS
    // §1). Phát baseline 6s, rồi yêu cầu: draw tăng ≥ 20 (≥ ~3fps, sàn
    // rất thấp so với baseline kỳ vọng ~50fps), element dài rs ≥ 1 +
    // videoWidth > 0 + buffered > 0 + currentTime đã tiến + còn srcAttr,
    // hook khớp baseline. Không đạt → DỪNG (harness lỗi, exit 2),
    // KHÔNG ghi số FPS rác.
    {
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, "gate seek 0");
      const draw0 = (await cdp.evalJs(STATE_FN)).hold?.draw ?? 0;
      await togglePlay(cdp);
      await sleep(6000);
      await togglePlay(cdp);
      await sleep(400);
      const stGate = await cdp.evalJs(STATE_FN);
      const drawAfter = stGate.hold?.draw ?? 0;
      const drawDelta = drawAfter - draw0;
      const elGate = await cdp.evalJs(LONG_EL_FN(LONG_FILE)).catch(() => null);
      const hookGate = stGate.hook;
      const hookBaselineOk = hookGate && hookGate.denoiseBlurPx === 0 && hookGate.denoiseBlendAlpha === 0 && hookGate.clipId === firstClipId;
      log(`GATE warmup: draw ${draw0} → ${drawAfter} (delta ${drawDelta}, cần ≥20), el=${JSON.stringify(elGate)}, hookOk=${hookBaselineOk}, playhead=${stGate.playhead}, loadavg ${loadAvg()}`);
      // rs ≥ 1 (HAVE_METADATA) là đủ khi kèm ct > 0 + buf > 0: rs là trạng
      // thái tức thời — ngay sau pause/seek nó có thể tạm về 1 dù element
      // vừa phát 6.5s (ct 6.5, buf 20). Bằng chứng phát thật là drawDelta
      // + currentTime đã tiến + buffer đầy, không phải rs tức thời.
      if (drawDelta < 20 || !elGate || elGate.rs < 1 || elGate.w === 0 || elGate.buf <= 0 || elGate.ct <= 0 || !elGate.srcAttr || !hookBaselineOk) {
        throw new Error(`GATE element clip dài KHÔNG đạt: drawDelta=${drawDelta} (cần ≥20), el=${JSON.stringify(elGate)}, hookOk=${hookBaselineOk} — clip dài chưa phát được, dừng để khỏi ghi số FPS rác (xem LIMITS §1)`);
      }
      log("GATE warmup OK: element clip dài phát được, vào vòng đo chính thức");
    }

    // ---- A. FPS preview clip dài, xen kẽ, lặp REPEATS lần ------------------
    const FPS_CONFIGS = {
      baseline: { denoise: false, stabilize: false, deinterlace: false, expect: { blur: 0, alpha: 0, zoom: 1, applied: [], notApproximated: [], offscreen: false } },
      denoise: { denoise: true, stabilize: false, deinterlace: false, expect: { blur: 3.0, alpha: 0.486, zoom: 1, applied: ["denoise"], notApproximated: [], offscreen: true } },
      stabilize: { denoise: false, stabilize: true, deinterlace: false, expect: { blur: 0, alpha: 0, zoom: 1.023, applied: ["stabilize"], notApproximated: [], offscreen: true } },
      combo: { denoise: true, stabilize: true, deinterlace: true, expect: { blur: 3.0, alpha: 0.486, zoom: 1.023, applied: ["stabilize", "denoise"], notApproximated: ["deinterlace"], offscreen: true } },
    };
    const FPS_ORDER = ["baseline", "denoise", "baseline", "stabilize", "baseline", "combo", "baseline"];

    async function measureFpsSlot(key, repIdx, slotIdx) {
      const cfg = FPS_CONFIGS[key];
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", cfg.denoise, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", cfg.stabilize, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", cfg.deinterlace, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, `${key} rep ${repIdx} slot ${slotIdx} seek 0`);
      // GATE hook: hook chỉ tươi sau 1 lần vẽ với cấu hình mới; nếu draw
      // kẹt (element chưa load) hook sẽ lệch 1 slot như lần chạy đầu —
      // chờ tối đa 10s cho hook khớp, không khớp thì DỪNG (không ghi slot rác).
      const exp = cfg.expect;
      const hookMatches = (h) => h && h.denoiseBlurPx === exp.blur
        && h.denoiseBlendAlpha === exp.alpha
        && Math.abs(h.stabilizeZoom - exp.zoom) < 1e-9
        && JSON.stringify(h.applied) === JSON.stringify(exp.applied)
        && JSON.stringify(h.notApproximated) === JSON.stringify(exp.notApproximated)
        && h.offscreenApplied === exp.offscreen;
      let stCfg = await cdp.evalJs(STATE_FN);
      let hook = stCfg.hook;
      let hookOk = hookMatches(hook);
      for (let w = 0; !hookOk && w < 20; w++) {
        await sleep(500);
        stCfg = await cdp.evalJs(STATE_FN);
        hook = stCfg.hook;
        hookOk = hookMatches(hook);
      }
      if (!hookOk) throw new Error(`GATE hook rep ${repIdx} slot ${slotIdx} ${key} KHÔNG khớp sau 10s: hook=${JSON.stringify(hook)} expect=${JSON.stringify(exp)} — dừng để khỏi ghi slot rác (xem LIMITS §1)`);
      const elBefore = await cdp.evalJs(LONG_EL_FN(LONG_FILE)).catch(() => null);
      const loadBefore = loadAvg();
      // Đợt 66 T5: bỏ rafIdx0 (chỉ số tuyệt đối) — cắt RAF stats theo
      // timestamp a.wall/b.wall (xem RAF_STATS_TIME_FN, sửa bug n=0).
      await togglePlay(cdp);
      await sleep(800);
      const a = await cdp.evalJs(SAMPLE_FN);
      if (!a.playing) throw new Error(`${key} rep ${repIdx} slot ${slotIdx}: bấm Space mà playing vẫn false`);
      await sleep(SAMPLE_SECS * 1000);
      const b = await cdp.evalJs(SAMPLE_FN);
      await togglePlay(cdp);
      await sleep(400);
      const after = await cdp.evalJs(STATE_FN);
      if (after.playing) throw new Error(`${key} rep ${repIdx} slot ${slotIdx}: bấm Space lần 2 mà playing vẫn true`);
      const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(a.wall, b.wall));
      const elAfter = await cdp.evalJs(LONG_EL_FN(LONG_FILE)).catch(() => null);
      const dt = (b.wall - a.wall) / 1000;
      const row = {
        rep: repIdx, slot: slotIdx, config: key,
        drawFps: +((b.draw - a.draw) / dt).toFixed(2),
        tickFps: +((b.ticks - a.ticks) / dt).toFixed(2),
        phRate: +((b.ph - a.ph) / dt).toFixed(3),
        draws: b.draw - a.draw, dt: +dt.toFixed(3),
        ph0: +a.ph.toFixed(2), ph1: +b.ph.toFixed(2),
        loadBefore, loadAfter: loadAvg(), rafStats, hookOk,
        elBefore, elAfter,
        hook: hook ? { blur: hook.denoiseBlurPx, alpha: hook.denoiseBlendAlpha, zoom: hook.stabilizeZoom, applied: hook.applied, offscreen: hook.offscreenApplied } : null,
      };
      log(`FPS rep ${repIdx} slot ${slotIdx} ${key}: draw ${row.drawFps} fps, tick ${row.tickFps} fps, playhead ${row.phRate}x, gapP50 ${rafStats ? rafStats.gapP50 : "?"}ms P95 ${rafStats ? rafStats.gapP95 : "?"}ms (n=${rafStats ? rafStats.n : "?"}), load ${loadBefore} → ${row.loadAfter}, hookOk=${hookOk}, el rs=${elAfter ? elAfter.rs : "?"} buf=${elAfter ? elAfter.buf : "?"}`);
      return row;
    }

    const allSlots = [];
    const repSummaries = [];
    for (let rep = 1; rep <= REPEATS; rep++) {
      // Warmup 6s baseline trước mỗi repeat (run-4 fps-cal: slot đầu
      // thấp do máy chưa ấm).
      {
        await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", false, firstClipId);
        await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", false, firstClipId);
        await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
        await cdp.evalJs(SET_PLAYHEAD_FN(0));
        await waitIdle(cdp, `warmup rep ${rep} seek 0`);
        await togglePlay(cdp);
        await sleep(6000);
        await togglePlay(cdp);
        await sleep(400);
        log(`warmup rep ${rep}: phát baseline 6s xong (không tính vào kết quả)`);
      }
      const repSlots = [];
      for (let i = 0; i < FPS_ORDER.length; i++) repSlots.push(await measureFpsSlot(FPS_ORDER[i], rep, i + 1));
      allSlots.push(...repSlots);
      const baseSlots = repSlots.filter((r) => r.config === "baseline");
      const baseMean = baseSlots.reduce((a, r) => a + r.drawFps, 0) / baseSlots.length;
      const repSummary = { rep, baseline: { mean: +baseMean.toFixed(2), min: Math.min(...baseSlots.map((r) => r.drawFps)), max: Math.max(...baseSlots.map((r) => r.drawFps)) } };
      for (const key of ["denoise", "stabilize", "combo"]) {
        const idx = FPS_ORDER.indexOf(key);
        const slot = repSlots[idx];
        const neighbors = [repSlots[idx - 1], repSlots[idx + 1]].filter(Boolean);
        const nbMean = neighbors.reduce((a, r) => a + r.drawFps, 0) / neighbors.length;
        repSummary[key] = { drawFps: slot.drawFps, neighborBaselineMean: +nbMean.toFixed(2), ratio: +(slot.drawFps / nbMean).toFixed(2), phRate: slot.phRate, tickFps: slot.tickFps };
        log(`FPS rep ${rep} ${key}: draw ${slot.drawFps} fps vs baseline kề ${nbMean.toFixed(2)} fps → tỉ lệ ${(slot.drawFps / nbMean).toFixed(2)}x, playhead ${slot.phRate}x`);
      }
      repSummaries.push(repSummary);
      log(`FPS rep ${rep} baseline 4 slot: mean ${baseMean.toFixed(2)} fps, min ${repSummary.baseline.min}, max ${repSummary.baseline.max} (drift ${(repSummary.baseline.max - repSummary.baseline.min).toFixed(2)} fps)`);
    }
    await drainErrors(cdp);
    await cdp.shot("r3-long-a-done.png");

    // Gộp spread qua các repeat: mean/min/max/std của tỉ lệ từng config.
    const stats = (arr) => {
      const mean = arr.reduce((a, v) => a + v, 0) / arr.length;
      const sd = Math.sqrt(arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length);
      return { mean: +mean.toFixed(3), min: Math.min(...arr), max: Math.max(...arr), std: +sd.toFixed(3), n: arr.length };
    };
    const aggregate = {};
    for (const key of ["denoise", "stabilize", "combo"]) {
      aggregate[key] = {
        ratio: stats(repSummaries.map((r) => r[key].ratio)),
        drawFps: stats(repSummaries.map((r) => r[key].drawFps)),
        phRate: stats(repSummaries.map((r) => r[key].phRate)),
      };
      log(`SPREAD ${key} (${REPEATS} repeat): tỉ lệ mean ${aggregate[key].ratio.mean}x min ${aggregate[key].ratio.min} max ${aggregate[key].ratio.max} std ${aggregate[key].ratio.std}; drawFps mean ${aggregate[key].drawFps.mean} min ${aggregate[key].drawFps.min} max ${aggregate[key].drawFps.max} std ${aggregate[key].drawFps.std}`);
    }
    aggregate.baseline = { drawFps: stats(repSummaries.map((r) => r.baseline.mean)) };
    log(`SPREAD baseline (${REPEATS} repeat): drawFps mean ${aggregate.baseline.drawFps.mean} min ${aggregate.baseline.drawFps.min} max ${aggregate.baseline.drawFps.max} std ${aggregate.baseline.drawFps.std}`);
    const hookAllOk = allSlots.every((r) => r.hookOk);
    if (hookAllOk) pass("A-hook: hook khớp cấu hình ở mọi slot clip dài", `${allSlots.length} slot × ${REPEATS} repeat, blur/zoom/applied/notApproximated/offscreen đúng kỳ vọng (alpha 0.486)`);
    else fail("A-hook: hook khớp cấu hình ở mọi slot clip dài", allSlots.filter((r) => !r.hookOk).map((r) => `rep ${r.rep} slot ${r.slot} ${r.config}: hook=${JSON.stringify(r.hook)}`).join(" || "));
    const comboMean = aggregate.combo.ratio.mean;
    const comboPhMean = aggregate.combo.phRate.mean;
    if (comboMean >= 0.75 && comboPhMean >= 0.9) {
      pass("A FPS: combo enhance clip dài không làm tụt tốc độ vẽ quá 25% (drift-corrected)", `combo tỉ lệ mean ${comboMean}x (min ${aggregate.combo.ratio.min}, max ${aggregate.combo.ratio.max}, std ${aggregate.combo.ratio.std}, n=${REPEATS}); playhead mean ${comboPhMean}x; baseline drawFps mean ${aggregate.baseline.drawFps.mean}; canvas ${canvasSize}`);
    } else {
      fail("A FPS: combo enhance clip dài không làm tụt tốc độ vẽ quá 25% (drift-corrected)", `combo tỉ lệ mean ${comboMean}x (min ${aggregate.combo.ratio.min}, max ${aggregate.combo.ratio.max}, std ${aggregate.combo.ratio.std}, n=${REPEATS}); playhead mean ${comboPhMean}x; baseline drawFps mean ${aggregate.baseline.drawFps.mean}; canvas ${canvasSize} — xem LIMITS (ngưỡng 0.75x giữ nguyên, không nới; chi phí blend ~0.5x là giới hạn thật trên VM CPU-only)`);
    }

    // ---- D. FPS decode riêng (tab trắng, rVFC) -----------------------------
    const blankTarget = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const bcdp = new CDP(blankTarget.webSocketDebuggerUrl);
    await bcdp.send("Page.enable");
    await bcdp.send("Runtime.enable");
    await bcdp.send("Page.bringToFront");
    await bcdp.evalJs(INJECT_ERRORS);
    await sleep(1000);
    const decodeRows = [];
    for (const seekTo of [0, 5, 10]) {
      const d = await bcdp.evalJs(DECODE_FPS_FN(MEDIA_URL(LONG_FILE), seekTo, SAMPLE_SECS));
      decodeRows.push({ seek: seekTo, ...d, load: loadAvg() });
      log(`DECODE ${LONG_FILE} seek ${seekTo}s: ${d.fps} fps (frame rVFC ${d.frames}/${d.wallSecs}s), mediaRate ${d.mediaRate}x, dropped ${d.dropped}/${d.total}, load ${loadAvg()}`);
    }
    const decodeAgg = { fps: stats(decodeRows.map((r) => r.fps)), mediaRate: stats(decodeRows.map((r) => r.mediaRate)), droppedTotal: decodeRows.reduce((a, r) => a + (r.dropped || 0), 0), presentedTotal: decodeRows.reduce((a, r) => a + (r.presented || 0), 0) };
    log(`DECODE SPREAD ${LONG_FILE}: fps mean ${decodeAgg.fps.mean} min ${decodeAgg.fps.min} max ${decodeAgg.fps.max} std ${decodeAgg.fps.std} (n=3 vị trí); dropped tổng ${decodeAgg.droppedTotal}/${decodeAgg.presentedTotal}`);
    if (decodeAgg.fps.mean >= 29 && decodeAgg.mediaRate.mean >= 0.95) {
      pass("D decode: video decode riêng đạt ~30fps, không rớt frame đáng kể", `${LONG_FILE} ${LONG_W}x${LONG_H}: decode fps mean ${decodeAgg.fps.mean} (min ${decodeAgg.fps.min}, max ${decodeAgg.fps.max}, std ${decodeAgg.fps.std}); mediaRate mean ${decodeAgg.mediaRate.mean}x; dropped ${decodeAgg.droppedTotal}/${decodeAgg.presentedTotal}`);
    } else {
      fail("D decode: video decode riêng đạt ~30fps, không rớt frame đáng kể", `${LONG_FILE}: decode fps mean ${decodeAgg.fps.mean} (min ${decodeAgg.fps.min}, max ${decodeAgg.fps.max}); mediaRate mean ${decodeAgg.mediaRate.mean}x; dropped ${decodeAgg.droppedTotal}/${decodeAgg.presentedTotal} — xem LIMITS (decode CPU-only có thể không kịp 30fps ở 1080p/bitrate cao)`);
    }

    // H9: 0 lỗi trang gộp.
    await drainErrors(cdp);
    await drainErrors(bcdp).catch(() => {});
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (app tab + tab trắng)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    const report = {
      res: RES, clip: LONG_FILE, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,
      repeats: REPEATS, sampleSecs: SAMPLE_SECS, canvasSize,
      cases: results, pass: nPass, total: results.length,
      slots: allSlots, repSummaries, aggregate,
      decode: { rows: decodeRows, aggregate: decodeAgg },
    };
    writeFileEpermRetry(path.join(SCRATCH, `r3-fps-long-${RES}.json`), JSON.stringify(report, null, 2));
    log(`KẾT QUẢ HEADED R3 FPS LONG ${RES}p: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
