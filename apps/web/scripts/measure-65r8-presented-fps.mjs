#!/usr/bin/env node
/**
 * measure-65r8-presented-fps.mjs — Phase 9 đợt 65, luồng S8 (nợ #8 R64 §8):
 * đo PRESENTED-frame rate trong preview qua getVideoPlaybackQuality.
 *
 * Nợ gốc (R64 R3 §6.2/§7): draw FPS (đếm qua __vcutHoldStats.draw) KHÔNG
 * bằng số frame thật được trình chiếu — preview có thể vẽ 57 fps trong
 * khi element chỉ present ~15 fps (vẽ lại cùng frame). Cần đo presented
 * thật bằng getVideoPlaybackQuality deltas trong slot đang phát.
 *
 * GIẢ THUYẾT KIỂM CHỨNG (xem lib/presentedFps.ts): element video của
 * preview (MediaPool.videoFor) KHÔNG gắn vào DOM nên compositor không
 * trình chiếu nó — totalVideoFrames có thể đứng yên (presentedFps ≈ 0)
 * trong khi decode vẫn chạy (rVFC vẫn bắn, draw FPS vẫn cao). Script
 * này đo cả 3 số CÙNG 1 slot để phân biệt: drawFps (canvas vẽ) vs
 * presentedFps (API) vs mediaRate (currentTime element) — và chạy thêm
 * ĐỐI CHỨNG tab trắng (element VISIBLE 640×360, cùng clip) để chứng
 * minh API vẫn tăng khi element được trình chiếu thật. Nếu in-app = 0
 * trong khi đối chứng ≈ 30 fps thì kết luận là "API không đo được
 * presented trong preview hiện tại" (do element tách DOM), KHÔNG phải
 * lỗi harness — và KHÔNG được gắn số 0 đó vào FPS meter UI.
 *
 * Mỗi slot (baseline, không enhance): seek 0 → phát 10 s → lấy mẫu
 * quality + draw + playhead ở đầu/cuối slot, cùng 1 lần evaluate để
 * wall khớp nhau. Guard: đánh dấu element bằng __r8mark ở đầu slot;
 * nếu cuối slot mark mất (pool drop/tạo lại element) thì hủy slot,
 * không ghi số rác. RAF stats cắt theo TIMESTAMP (t trong [t0,t1])
 * thay vì chỉ số tuyệt đối — tránh bug n=0 của RAF_STATS_FN R64
 * (ring buffer 5000 mẫu đẩy mẫu cũ, fromIdx vượt độ dài — nợ R64 §8.3,
 * file clicktest-64r3-fps-long.mjs vẫn còn bug đó, không sửa ở đây).
 *
 * Chạy (từ gốc repo):
 *   node apps/web/scripts/measure-65r8-presented-fps.mjs
 * Env: R8_PRES_REPEATS (mặc định 3), R8_PRES_SECS (mặc định 10),
 *   R8_SCRATCH (mặc định hidden_files/round65-r8/presented),
 *   R8_PRES_RES (720|1080, mặc định 720 — đợt 66 T5 thêm để đo
 *   presented 1080p trong app; fixture long1080.mp4 đã có từ R64).
 * Exit 0 khi đo xong (kể cả khi presentedFps = 0 — đó là kết quả, xem
 * LIMITS), 1 khi có slot invalid, 2 khi harness lỗi. KHÔNG sửa code
 * sản phẩm, KHÔNG push/tag/binary.
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
const SCRATCH = process.env.R8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round65-r8", "presented");
const REPEATS = Math.max(1, Number(process.env.R8_PRES_REPEATS || 3));
const SAMPLE_SECS = Math.max(3, Number(process.env.R8_PRES_SECS || 10));
// Đợt 66 T5: chọn độ phân giải fixture qua env (mặc định 720 như S8 —
// không đổi hành vi cũ khi không đặt env).
const RES = process.env.R8_PRES_RES === "1080" ? "1080" : "720";
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
const VITE_CFG_DIR = "/tmp/round65-r8";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r8-presented.config.mjs");
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
    clips, selection: st.selection, playhead: st.playhead, playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled, hook, idle, hold,
    canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    errors: (window.__r3errors || []).slice(),
  };
})()`;

// Mẫu slot KÉP (draw + quality + element, cùng 1 evaluate để wall khớp):
// draw = số lần canvas vẽ (holdStats), q = getVideoPlaybackQuality của
// element pool clip dài, ct = currentTime element, mark = dấu nhận dạng
// element (phát hiện pool drop/tạo lại element giữa slot).
const SLOT_SAMPLE_FN = (fileName) => `(() => {
  const st = window.__r3storeMod ? window.__r3storeMod.useStore.getState() : null;
  const rec = (window.__vcutMediaEls || []).find((e) => (e.el.currentSrc || "").includes(${JSON.stringify(fileName)}));
  let elInfo = null;
  if (rec) {
    const el = rec.el;
    const q = typeof el.getVideoPlaybackQuality === "function" ? el.getVideoPlaybackQuality() : null;
    elInfo = { rs: el.readyState, ct: +el.currentTime.toFixed(3), w: el.videoWidth,
      attached: el.isConnected === true, inDoc: document.contains(el),
      srcAttr: !!el.getAttribute("src"), paused: el.paused,
      mark: el.__r8mark || null,
      q: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames, corrupted: q.corruptedVideoFrames } : null };
  }
  return {
    draw: window.__vcutHoldStats ? window.__vcutHoldStats.draw : null,
    ticks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    ph: st ? st.playhead : null, playing: st ? st.playing : null,
    wall: performance.now(), el: elInfo,
  };
})()`;

// Đánh dấu element pool hiện tại (gọi ở đầu slot, trước khi phát).
const MARK_EL_FN = (fileName, mark) => `(() => {
  const rec = (window.__vcutMediaEls || []).find((e) => (e.el.currentSrc || "").includes(${JSON.stringify(fileName)}));
  if (!rec) return false;
  rec.el.__r8mark = ${JSON.stringify(mark)};
  return true;
})()`;

// RAF stats cắt theo TIMESTAMP (sửa biến thể bug n=0 của R64:
// RAF_STATS_FN dùng chỉ số tuyệt đối fromIdx, ring buffer 5000 mẫu đẩy
// mẫu cũ → slice rỗng ở slot sau; cắt theo t thì không phụ thuộc độ dài).
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

// Đối chứng tab trắng: cùng clip, element VISIBLE — API phải tăng ở đây.
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
  const total = q1 ? q1.totalVideoFrames - (q0 ? q0.totalVideoFrames : 0) : null;
  const dropped = q1 ? q1.droppedVideoFrames - (q0 ? q0.droppedVideoFrames : 0) : null;
  return { frames, wallSecs: +wallSecs.toFixed(3),
    fps: +((frames - 1) / wallSecs).toFixed(2),
    presentedFps: total === null ? null : +(total / wallSecs).toFixed(2),
    droppedFps: dropped === null ? null : +(dropped / wallSecs).toFixed(2),
    mediaRate: +((lastMedia - firstMedia) / wallSecs).toFixed(3),
    dropped, total, ended };
})()`;

async function main() {
  const results = [];
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
    const DEV_PORT = Number(process.env.R8_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
    const DEBUG_PORT = Number(process.env.R8_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
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
    const DISPLAY = process.env.R8_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :180–:189");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(path.join(MEDIA_DIR, LONG_FILE))) throw new Error(`không thấy media fixture ${LONG_FILE} ở ${MEDIA_DIR}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const MEDIA_URL = (f) => `${DEV_URL}r61r3-media/${f}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round65-r8/tmp";
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

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r8-presented-chrome.log"), "w");
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

    // ---- GATE warmup (như R64): element clip dài THẬT SỰ phát được ----
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
      const elGate = await cdp.evalJs(SLOT_SAMPLE_FN(LONG_FILE)).catch(() => null);
      const hookGate = stGate.hook;
      const hookBaselineOk = hookGate && hookGate.denoiseBlurPx === 0 && hookGate.denoiseBlendAlpha === 0 && hookGate.clipId === firstClipId;
      log(`GATE warmup: draw ${draw0} → ${drawAfter} (delta ${drawDelta}, cần ≥20), el=${JSON.stringify(elGate?.el)}, hookOk=${hookBaselineOk}, playhead=${stGate.playhead}, loadavg ${loadAvg()}`);
      if (drawDelta < 20 || !elGate?.el || elGate.el.rs < 1 || elGate.el.w === 0 || elGate.el.ct <= 0 || !elGate.el.srcAttr || !hookBaselineOk) {
        throw new Error(`GATE element clip dài KHÔNG đạt: drawDelta=${drawDelta}, el=${JSON.stringify(elGate?.el)}, hookOk=${hookBaselineOk} — dừng để khỏi ghi số rác`);
      }
      log("GATE warmup OK: element clip dài phát được, vào vòng đo presented");
    }

    // ---- Đo presented: baseline, 10 s/slot, REPEATS lần -------------------
    const stats = (arr) => {
      const mean = arr.reduce((a, v) => a + v, 0) / arr.length;
      const sd = Math.sqrt(arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length);
      return { mean: +mean.toFixed(2), min: Math.min(...arr), max: Math.max(...arr), std: +sd.toFixed(2), n: arr.length };
    };
    const slots = [];
    for (let rep = 1; rep <= REPEATS; rep++) {
      const mark = `r8-rep${rep}`;
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, `presented rep ${rep} seek 0`);
      const marked = await cdp.evalJs(MARK_EL_FN(LONG_FILE, mark));
      if (!marked) throw new Error(`rep ${rep}: không đánh dấu được element clip dài (không tìm thấy trong __vcutMediaEls)`);
      const loadBefore = loadAvg();
      await togglePlay(cdp);
      await sleep(800);
      const a = await cdp.evalJs(SLOT_SAMPLE_FN(LONG_FILE));
      if (!a.playing) throw new Error(`rep ${rep}: bấm Space mà playing vẫn false`);
      if (!a.el || a.el.mark !== mark) throw new Error(`rep ${rep}: element đổi ngay đầu slot (mark=${a.el?.mark}, cần ${mark}) — hủy slot`);
      await sleep(SAMPLE_SECS * 1000);
      const b = await cdp.evalJs(SLOT_SAMPLE_FN(LONG_FILE));
      await togglePlay(cdp);
      await sleep(400);
      const after = await cdp.evalJs(STATE_FN);
      if (after.playing) throw new Error(`rep ${rep}: bấm Space lần 2 mà playing vẫn true`);
      const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(a.wall, b.wall));
      const dt = (b.wall - a.wall) / 1000;
      const elOk = !!b.el && b.el.mark === mark;
      const row = {
        rep, valid: elOk, reason: elOk ? null : `element đổi giữa slot (mark cuối=${b.el?.mark})`,
        dtSecs: +dt.toFixed(3),
        drawFps: a.draw !== null && b.draw !== null ? +((b.draw - a.draw) / dt).toFixed(2) : null,
        draws: a.draw !== null && b.draw !== null ? b.draw - a.draw : null,
        phRate: +((b.ph - a.ph) / dt).toFixed(3),
        mediaRate: a.el && b.el ? +((b.el.ct - a.el.ct) / dt).toFixed(3) : null,
        presentedFps: a.el?.q && b.el?.q ? +((b.el.q.total - a.el.q.total) / dt).toFixed(2) : null,
        droppedFps: a.el?.q && b.el?.q ? +((b.el.q.dropped - a.el.q.dropped) / dt).toFixed(2) : null,
        totalDelta: a.el?.q && b.el?.q ? b.el.q.total - a.el.q.total : null,
        droppedDelta: a.el?.q && b.el?.q ? b.el.q.dropped - a.el.q.dropped : null,
        attached: b.el ? b.el.attached : null,
        inDoc: b.el ? b.el.inDoc : null,
        elRs: b.el ? b.el.rs : null,
        loadBefore, loadAfter: loadAvg(),
        rafStats, q0: a.el?.q ?? null, q1: b.el?.q ?? null,
      };
      slots.push(row);
      log(`PRESENTED rep ${rep}: draw ${row.drawFps} fps, presented ${row.presentedFps} fps (Δtotal ${row.totalDelta}/${row.dtSecs}s), dropped ${row.droppedFps} fps (Δ ${row.droppedDelta}), mediaRate ${row.mediaRate}x, phRate ${row.phRate}x, attached=${row.attached} inDoc=${row.inDoc}, gapP50 ${rafStats?.gapP50}ms (n=${rafStats?.n}), load ${loadBefore} → ${row.loadAfter}, valid=${row.valid}`);
    }
    await drainErrors(cdp);
    await cdp.shot("r8-presented-done.png");
    const valid = slots.filter((s) => s.valid);
    const agg = valid.length ? {
      drawFps: stats(valid.map((s) => s.drawFps)),
      presentedFps: stats(valid.map((s) => s.presentedFps)),
      droppedFps: stats(valid.map((s) => s.droppedFps)),
      mediaRate: stats(valid.map((s) => s.mediaRate)),
      phRate: stats(valid.map((s) => s.phRate)),
    } : null;
    if (agg) {
      log(`PRESENTED TỔNG (${valid.length}/${REPEATS} slot hợp lệ): drawFps mean ${agg.drawFps.mean} (min ${agg.drawFps.min}, max ${agg.drawFps.max}, std ${agg.drawFps.std}); presentedFps mean ${agg.presentedFps.mean} (min ${agg.presentedFps.min}, max ${agg.presentedFps.max}); droppedFps mean ${agg.droppedFps.mean}; mediaRate mean ${agg.mediaRate.mean}x; phRate mean ${agg.phRate.mean}x`);
    } else {
      log(`PRESENTED TỔNG: KHÔNG có slot hợp lệ — tất cả slot đều bị hủy do element đổi giữa chừng`);
    }

    // ---- Đối chứng tab trắng: element VISIBLE, cùng clip ------------------
    const blankTarget = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const bcdp = new CDP(blankTarget.webSocketDebuggerUrl);
    await bcdp.send("Page.enable");
    await bcdp.send("Runtime.enable");
    await bcdp.send("Page.bringToFront");
    await bcdp.evalJs(INJECT_ERRORS);
    await sleep(1000);
    const ctrl = await bcdp.evalJs(DECODE_FPS_FN(MEDIA_URL(LONG_FILE), 0, SAMPLE_SECS));
    log(`ĐỐI CHỨNG tab trắng (element VISIBLE): rVFC ${ctrl.fps} fps, presented ${ctrl.presentedFps} fps (Δtotal ${ctrl.total}/${ctrl.wallSecs}s), dropped ${ctrl.dropped} (${ctrl.droppedFps} fps), mediaRate ${ctrl.mediaRate}x, load ${loadAvg()}`);

    await drainErrors(cdp);
    await drainErrors(bcdp).catch(() => {});
    if (phaseErrors.length === 0) results.push({ name: "H9 0 lỗi trang", ok: true, detail: "không có window.onerror/unhandledrejection (app tab + tab trắng)" });
    else results.push({ name: "H9 0 lỗi trang", ok: false, detail: phaseErrors.slice(0, 5).join(" || ") });
    if (valid.length === REPEATS) results.push({ name: "P presented: mọi slot hợp lệ", ok: true, detail: `${REPEATS}/${REPEATS} slot, element không đổi giữa chừng (mark còn nguyên)` });
    else results.push({ name: "P presented: mọi slot hợp lệ", ok: false, detail: `${valid.length}/${REPEATS} slot hợp lệ — ${slots.filter((s) => !s.valid).map((s) => `rep ${s.rep}: ${s.reason}`).join(" || ")}` });
    // Không đặt ngưỡng PASS/FAIL cho presentedFps: 0 cũng là kết quả thật
    // (element tách DOM) — xem LIMITS. Chỉ ghi nhận số đo.
    const nPass = results.filter((r) => r.ok).length;
    const report = {
      clip: LONG_FILE, clipW: LONG_W, clipH: LONG_H, clipDur: CLIP_DUR,
      repeats: REPEATS, sampleSecs: SAMPLE_SECS, canvasSize,
      cases: results, pass: nPass, total: results.length,
      slots, aggregate: agg, controlBlankTab: { ...ctrl, load: loadAvg() },
    };
    writeFileEpermRetry(path.join(SCRATCH, "presented-fps.json"), JSON.stringify(report, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "presented-fps.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED R8 PRESENTED ${LONG_FILE}: ${nPass}/${results.length} pass (presentedFps không có ngưỡng — xem LIMITS)`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { fs.mkdirSync(SCRATCH, { recursive: true }); writeFileEpermRetry(path.join(SCRATCH, "presented-fps.log"), logLines.join("\n") + "\n"); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
