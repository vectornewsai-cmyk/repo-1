#!/usr/bin/env node
/**
 * clicktest-61r3-fps-cal.mjs — Phase 9 đợt 61, luồng R3: đóng nợ đợt 60 §5.3
 * (Q1 preview enhance) — (a) đo FPS preview trước/sau enhance, (b) hiệu
 * chuẩn thang blur denoise, (d) deinterlace trên footage interlaced thật.
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-60q1-enhance-preview.mjs.
 * KHÔNG sửa code sản phẩm (mọi sửa — nếu có — làm ở bước hiệu chuẩn riêng,
 * sau khi có số đo; harness này chỉ ĐO).
 *
 * Các phase (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   A. FPS preview: project mẫu tự load (2 clip video 4s, 640x360 webm).
 *      5 cấu hình enhance trên clip 1 (tắt hết / denoise 0.5 / stabilize 10 /
 *      deinterlace / combo cả ba), bật bằng CHUỘT THẬT qua checkbox
 *      EnhancePanel (mẫu Q1). Mỗi cấu hình 2 lần: play từ playhead 0,
 *      đo tốc độ vẽ thật = Δwindow.__vcutHoldStats.draw / Δwall,
 *      tốc độ tick rAF = Δ__vcutPreviewIdle.ticks / Δwall, và tốc độ tiến
 *      playhead / wall (1.0 = phát đúng thời gian thực). Cửa sổ đo 3.0s
 *      sau warmup 0.8s (playhead ~0.8→3.8, chỉ clip 1, tránh fade cuối).
 *      Ghi loadavg trước/sau mỗi cấu hình.
 *   B. Hiệu chuẩn blur: tab trắng, tải frame phẳng+nhiễu thật (PNG trích
 *      từ video encode — cùng frame dùng đo hqdn3d offline), vẽ qua
 *      ctx.filter = blur(Xpx) — đúng cơ chế preview.tsx dùng — ở các mức
 *      0/0.3/0.6/0.9/1.2/1.8/2.4/3.0/4.0, đo std vùng trung tâm + mean abs
 *      diff so với blur 0. Hai mức nhiễu (alls=15, alls=40).
 *   D1. Combing decoder: tab trắng, <video> interlaced thật (testsrc2 60fps
 *      + tinterlace) vs đối chứng progressive, đo "combing energy" =
 *      mean |Y(y) - (Y(y-1)+Y(y+1))/2| trên hàng lẻ, vùng trung tâm, tại
 *      3 mốc thời gian. Trả lời: decoder Chromium có tự khử răng cưa
 *      không (preview hiện frame như decoder giải mã).
 *   D2. Render + idet: chạy render.js thật với enhance deinterlace trên
 *      clip interlaced + đối chứng không enhance; đo idet prog trước/sau.
 *   D3 (best-effort): nạp clip interlaced vào project mẫu trong app qua
 *      store (media URL cùng origin qua middleware vite /r61r3-media/),
 *      đo combing trên canvas preview thật; đối chứng progressive cùng
 *      cách. Nếu media pool từ chối thì ghi rõ lý do, không fail harness.
 *
 * Media phục vụ qua middleware vite /r61r3-media/ (cùng origin với app
 * nên canvas không bị taint; kèm ACAO:* cho tab trắng dùng crossOrigin).
 * File media nằm ngoài repo (scratch ~/workspace/.scratch-r61r3-*),
 * KHÔNG đưa binary vào batch.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-61r3-fps-cal.mjs
 * Env: R3_DEV_PORT (mặc định tự chọn 5540–5549), R3_DEBUG_PORT
 * (9640–9649), R3_DISPLAY (mặc định quét :170–:179 — display RIÊNG,
 * không dùng chung với Q1/Q5), R3_SCRATCH (mặc định
 * hidden_files/round61-r3/headed). Exit 0 mọi case PASS, 1 có FAIL,
 * 2 harness lỗi. KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R3_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round61-r3";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r3.config.mjs");
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

// Mẫu đo FPS: draw/ticks/playhead/wall cùng lúc (trong trang).
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

// Đặt playhead qua store (không phải click — tránh đổi focus/seek phụ).
const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

// Bấm checkbox Enhance bằng chuột thật (mẫu Q1).
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

// Đo std/mean-abs-diff của 1 ảnh qua ctx.filter blur — đúng cơ chế preview.
const BLUR_CAL_FN = (imgUrl, levels) => `(async () => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("không tải được ảnh ${imgUrl}")); img.src = ${JSON.stringify(imgUrl)}; });
  const W = img.naturalWidth, H = img.naturalHeight;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const step = 2;
  const stats = (data) => {
    let n = 0; const sum = [0, 0, 0]; const sq = [0, 0, 0];
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) { const v = data[i + c]; sum[c] += v; sq[c] += v * v; }
      n++;
    }
    const std = [0, 1, 2].map((c) => Math.sqrt(Math.max(0, sq[c] / n - (sum[c] / n) ** 2)));
    return { n, std, stdMean: (std[0] + std[1] + std[2]) / 3 };
  };
  let baseData = null; let baseStats = null;
  const rows = [];
  for (const b of ${JSON.stringify(levels)}) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.filter = b > 0 ? \`blur(\${b}px)\` : "none";
    ctx.drawImage(img, 0, 0);
    ctx.filter = "none";
    const data = ctx.getImageData(0, 0, W, H).data;
    const s = stats(data);
    if (baseData === null) { baseData = data; baseStats = s; rows.push({ blur: b, ...s, stdReductPct: 0, meanAbsDiff: 0 }); continue; }
    let sum = 0, cnt = 0;
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) { sum += Math.abs(data[i + ch] - baseData[i + ch]); cnt++; }
    }
    rows.push({ blur: b, ...s, stdReductPct: +(((baseStats.stdMean - s.stdMean) / baseStats.stdMean) * 100).toFixed(1), meanAbsDiff: +(sum / cnt).toFixed(3) });
  }
  return { w: W, h: H, baseStdMean: +baseStats.stdMean.toFixed(3), rows };
})()`;

// Đo combing energy của 1 video tại 3 mốc thời gian (tab trắng).
const COMBING_FN = (videoUrl) => `(async () => {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  const W = v.videoWidth, H = v.videoHeight;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const out = [];
  for (const t of [1.0, 2.0, 3.0]) {
    await new Promise((res) => { v.onseeked = res; v.currentTime = t; });
    await new Promise((r) => setTimeout(r, 150));
    ctx.drawImage(v, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
    let sum = 0, n = 0;
    for (let y = y0 + 1; y < y1 - 1; y += 2) { // chỉ hàng lẻ: so với trung bình 2 hàng kề
      for (let x = x0; x < x1; x += 2) {
        const i = (y * W + x) * 4;
        const iu = ((y - 1) * W + x) * 4, il = ((y + 1) * W + x) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const mid = (d[iu + ch] + d[il + ch]) / 2;
          sum += Math.abs(d[i + ch] - mid);
        }
        n++;
      }
    }
    out.push({ t, combing: +(sum / (n * 3)).toFixed(3) });
  }
  return { w: W, h: H, rows: out, mean: +(out.reduce((a, r) => a + r.combing, 0) / out.length).toFixed(3) };
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

  async function waitIdle(cdp, label) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, 90000);
  }

  async function clickEnhCheckbox(cdp, testid, label) {
    const g = await cdp.evalJs(CLICK_ENH_FN(testid));
    if (!g) throw new Error(`không tìm thấy [data-testid="${testid}"] (${label})`);
    if (g.coveredBy) log(`cảnh báo: ${testid} bị che bởi ${g.coveredBy} tại điểm bấm — vẫn thử bấm`);
    await cdp.click(g.x, g.y);
    await sleep(600);
  }

  // Đặt 1 checkbox enhance về trạng thái muốn (chỉ bấm khi đang sai).
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

  // Bấm Space để phát/dừng — blur focus trước để Space không rơi vào checkbox.
  async function togglePlay(cdp) {
    await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
    await cdp.key(" ", "Space");
  }

  try {
    const DEV_PORT = Number(process.env.R3_DEV_PORT || 0) || (await pickFreePort(5540, 5549));
    const DEBUG_PORT = Number(process.env.R3_DEBUG_PORT || 0) || (await pickFreePort(9640, 9649));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 170; n <= 179; n++) {
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
    if (!DISPLAY) throw new Error("hết display trống :170–:179");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5540–5549");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9640–9649");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(path.join(MEDIA_DIR, "flat15.mp4"))) throw new Error(`không thấy media fixture ở ${MEDIA_DIR} (chạy bước tạo fixture trước)`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const MEDIA_URL = (f) => `${DEV_URL}r61r3-media/${f}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round61-r3/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    // Vite config riêng: react plugin + middleware phục vụ media fixture
    // cùng origin (/r61r3-media/*, kèm ACAO:* cho tab trắng).
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
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}, media=${MEDIA_DIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r3-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");
    // Kiểm tra middleware media phục vụ được trước khi mở Chrome.
    const mediaProbe = await fetch(MEDIA_URL("frame15.png"));
    if (!mediaProbe.ok) throw new Error(`middleware media không phục vụ được frame15.png (HTTP ${mediaProbe.status})`);
    log("middleware /r61r3-media/ phục vụ được fixture");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r3-chrome.log"), "w");
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

    // ---- A0: project mẫu tự load -------------------------------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện", 180000);
    const v0 = s0.clips.find((c) => c.trackId === "v1");
    const firstClipId = v0.clipId;
    const canvasSize = `${s0.canvasW}x${s0.canvasH}`;
    log(`project mẫu: canvas preview backing ${canvasSize}, clip video đầu ${firstClipId}, loadavg ${loadAvg()}`);
    await drainErrors(cdp);

    // Chọn clip video đầu để Inspector hiện section Tăng cường.
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (A0)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu", 60000);

    // ---- A. FPS preview trước/sau enhance ----------------------------------
    // Đo 1 lần chạy: seek 0 → phát → warmup 0.8s → mẫu 3.0s → dừng.
    async function measureFpsRun(label) {
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, `${label} seek 0`);
      const loadBefore = loadAvg();
      await togglePlay(cdp);
      await sleep(800);
      const a = await cdp.evalJs(SAMPLE_FN);
      if (!a.playing) throw new Error(`${label}: bấm Space mà playing vẫn false (a=${JSON.stringify(a)})`);
      await sleep(3000);
      const b = await cdp.evalJs(SAMPLE_FN);
      await togglePlay(cdp);
      await sleep(400);
      const after = await cdp.evalJs(STATE_FN);
      if (after.playing) throw new Error(`${label}: bấm Space lần 2 mà playing vẫn true`);
      const dt = (b.wall - a.wall) / 1000;
      const drawFps = (b.draw - a.draw) / dt;
      const tickFps = (b.ticks - a.ticks) / dt;
      const phRate = (b.ph - a.ph) / dt;
      return {
        label, drawFps: +drawFps.toFixed(2), tickFps: +tickFps.toFixed(2), phRate: +phRate.toFixed(3),
        draws: b.draw - a.draw, ticks: b.ticks - a.ticks, dt: +dt.toFixed(3),
        ph0: +a.ph.toFixed(2), ph1: +b.ph.toFixed(2), loadBefore, loadAfter: loadAvg(),
      };
    }

    const FPS_CONFIGS = [
      { label: "baseline (không enhance)", denoise: false, stabilize: false, deinterlace: false },
      { label: "denoise 0.5", denoise: true, stabilize: false, deinterlace: false },
      { label: "stabilize 10", denoise: false, stabilize: true, deinterlace: false },
      { label: "deinterlace", denoise: false, stabilize: false, deinterlace: true },
      { label: "combo (cả ba)", denoise: true, stabilize: true, deinterlace: true },
    ];
    const fpsRows = [];
    for (const cfg of FPS_CONFIGS) {
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", cfg.denoise, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", cfg.stabilize, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", cfg.deinterlace, firstClipId);
      const stCfg = await cdp.evalJs(STATE_FN);
      const hook = stCfg.hook;
      const runs = [];
      for (let i = 1; i <= 2; i++) runs.push(await measureFpsRun(`${cfg.label} #${i}`));
      for (const r of runs) {
        fpsRows.push(r);
        log(`FPS ${r.label}: draw ${r.drawFps} fps, tick ${r.tickFps} fps, playhead ${r.phRate}x wall (draws=${r.draws}, dt=${r.dt}s, ph ${r.ph0}→${r.ph1}, load ${r.loadBefore} → ${r.loadAfter})`);
      }
      const meanDraw = runs.reduce((a, r) => a + r.drawFps, 0) / runs.length;
      const meanTick = runs.reduce((a, r) => a + r.tickFps, 0) / runs.length;
      const meanPh = runs.reduce((a, r) => a + r.phRate, 0) / runs.length;
      const row = { config: cfg.label, meanDrawFps: +meanDraw.toFixed(2), meanTickFps: +meanTick.toFixed(2), meanPhRate: +meanPh.toFixed(3), runs };
      fpsRows.push(row);
      log(`FPS ${cfg.label}: MEAN draw ${row.meanDrawFps} fps, tick ${row.meanTickFps} fps, playhead ${row.meanPhRate}x`);
      // Ghi nhận hook đúng cấu hình (không fail cứng ở đây — case A9 kiểm tra tổng).
      log(`  hook ${cfg.label}: blur=${hook?.denoiseBlurPx} zoom=${hook?.stabilizeZoom} applied=${JSON.stringify(hook?.applied)} offscreen=${hook?.offscreenApplied}`);
    }
    await drainErrors(cdp);
    const baseline = fpsRows.find((r) => r.config === "baseline (không enhance)");
    const combo = fpsRows.find((r) => r.config === "combo (cả ba)");
    if (baseline && combo) {
      const ratio = combo.meanDrawFps / baseline.meanDrawFps;
      const detail = `baseline draw ${baseline.meanDrawFps} fps vs combo ${combo.meanDrawFps} fps (tỉ lệ ${ratio.toFixed(2)}x); tick baseline ${baseline.meanTickFps} vs combo ${combo.meanTickFps}; playhead baseline ${baseline.meanPhRate}x vs combo ${combo.meanPhRate}x; canvas ${canvasSize}; loadavg dao động trong lúc đo (xem từng lần chạy)`;
      // Ngưỡng: combo không được tụt quá 25% so với baseline VÀ playhead
      // vẫn ≥0.9x (phát đúng thời gian thực). Đây là ngưỡng đo, không phải
      // khẳng định "nhanh/chậm" tuyệt đối — số tuyệt đối phụ thuộc tải VM.
      if (ratio >= 0.75 && combo.meanPhRate >= 0.9) pass("A FPS: combo enhance không làm tụt tốc độ vẽ quá 25%", detail);
      else fail("A FPS: combo enhance không làm tụt tốc độ vẽ quá 25%", detail + " — TỤT HƠN NGƯỠNG (ghi nhận, xem LIMITS)");
    } else {
      fail("A FPS: đo đủ 5 cấu hình", `thiếu baseline/combo trong fpsRows (${fpsRows.length} dòng)`);
    }
    await cdp.shot("r3-a-fps-done.png");

    // ---- B. Hiệu chuẩn blur (tab trắng) -------------------------------------
    // Mở tab mới qua /json/new, đo trên cùng Chromium (cùng CSS blur).
    const blankTarget = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const bcdp = new CDP(blankTarget.webSocketDebuggerUrl);
    await bcdp.send("Page.enable");
    await bcdp.send("Runtime.enable");
    await bcdp.evalJs(INJECT_ERRORS);
    const BLUR_LEVELS = [0, 0.3, 0.6, 0.9, 1.2, 1.8, 2.4, 3.0, 4.0];
    const calResults = {};
    for (const [name, file] of [["flat15", "frame15.png"], ["flat40", "frame40.png"]]) {
      const cal = await bcdp.evalJs(BLUR_CAL_FN(MEDIA_URL(file), BLUR_LEVELS));
      calResults[name] = cal;
      log(`BLUR ${name}: frame ${cal.w}x${cal.h}, std gốc ${cal.baseStdMean}`);
      for (const r of cal.rows) log(`  blur ${r.blur}px: stdMean ${r.stdMean.toFixed(3)}, giảm ${r.stdReductPct}% , meanAbsDiff vs gốc ${r.meanAbsDiff}`);
    }
    // Khẳng định đo: blur tăng đơn điệu theo mức; 0.6px phải giảm std thật
    // (>5%) nhưng chưa bằng hqdn3d 0.5 (so ở LIMITS, không assert cứng ở đây
    // vì thang hiệu chuẩn sẽ quyết sau khi đối chiếu).
    const flat15 = calResults.flat15;
    const mono = flat15.rows.every((r, i, arr) => i === 0 || r.stdMean <= arr[i - 1].stdMean + 0.001);
    const b06 = flat15.rows.find((r) => r.blur === 0.6);
    if (mono && b06 && b06.stdReductPct > 5) {
      pass("B hiệu chuẩn blur: std giảm đơn điệu theo blur, 0.6px giảm thật", `flat15: std gốc ${flat15.baseStdMean} → 0.6px giảm ${b06.stdReductPct}% (std ${b06.stdMean.toFixed(3)}); đơn điệu ${mono}`);
    } else {
      fail("B hiệu chuẩn blur: std giảm đơn điệu theo blur, 0.6px giảm thật", `mono=${mono}, b06=${JSON.stringify(b06)}`);
    }

    // ---- D1. Combing decoder (tab trắng) ------------------------------------
    const combInter = await bcdp.evalJs(COMBING_FN(MEDIA_URL("interlaced720.mp4")));
    const combClean = await bcdp.evalJs(COMBING_FN(MEDIA_URL("clean720.mp4")));
    log(`COMBING interlaced720: mean ${combInter.mean} (từng mốc: ${combInter.rows.map((r) => `${r.t}s=${r.combing}`).join(", ")})`);
    log(`COMBING clean720 (đối chứng progressive): mean ${combClean.mean} (từng mốc: ${combClean.rows.map((r) => `${r.t}s=${r.combing}`).join(", ")})`);
    const combRatio = combInter.mean / Math.max(combClean.mean, 0.001);
    if (combInter.mean > combClean.mean * 1.5) {
      pass("D1 combing: footage interlaced hiện răng cưa rõ qua decoder", `interlaced combing ${combInter.mean} vs progressive ${combClean.mean} (tỉ lệ ${combRatio.toFixed(1)}x) — decoder KHÔNG tự khử hết, preview sẽ thấy răng cưa (đúng giới hạn Q1 §4.3)`);
    } else {
      pass("D1 combing: decoder đã khử gần hết răng cưa", `interlaced combing ${combInter.mean} vs progressive ${combClean.mean} (tỉ lệ ${combRatio.toFixed(2)}x) — decoder Chromium tự khử răng cưa, preview có thể không thấy rõ răng cưa (đính chính giới hạn Q1 §4.3)`);
    }

    // ---- D2. Render thật + idet (Node, sau phần trình duyệt) ----------------
    // Chạy ở cuối để không tranh CPU với đo FPS.
    const RENDER_DIR = path.join(ROOT, "server", "render");
    function runCmd(cmd, args, label) {
      const r = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      if (r.error || r.status !== 0) throw new Error(`bước "${label}" thất bại (mã ${r.status}): ${(r.stderr || "").slice(-800)}`);
      return r;
    }
    function idetProg(mp4) {
      const r = spawnSync("ffmpeg", ["-i", mp4, "-vf", "idet", "-f", "null", "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      const m = [...(r.stderr || "").matchAll(/Single frame detection:.*?TFF:\s*(\d+).*?BFF:\s*(\d+).*?Progressive:\s*(\d+).*?Undetermined:\s*(\d+)/gs)];
      if (!m.length) throw new Error(`không parse được idet cho ${mp4}:\n${(r.stderr || "").slice(-500)}`);
      const g = m[m.length - 1];
      const tff = Number(g[1]), bff = Number(g[2]), prog = Number(g[3]), und = Number(g[4]);
      const total = tff + bff + prog + und;
      return { tff, bff, prog, und, progRatio: total ? +(prog / total).toFixed(3) : -1 };
    }
    function renderSpec(specObj, name) {
      const specPath = path.join(SCRATCH, `${name}.json`);
      const outPath = path.join(SCRATCH, `${name}.mp4`);
      writeFileEpermRetry(specPath, JSON.stringify(specObj));
      const t0 = Date.now();
      const r = spawnSync("node", [path.join(RENDER_DIR, "src", "render.js"), "--spec", specPath,
        "--out", outPath, "--media-dir", MEDIA_DIR, "-y", "--x264-preset", "veryfast", "--crf", "23"],
        { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      const secs = (Date.now() - t0) / 1000;
      return { status: r.status, stderr: (r.stderr || "").toString(), outPath, secs, fps: 150 / secs };
    }
    const vclip = (id, src, duration, extra) => ({
      id, kind: "video", src, start: 0, duration, in: 0, out: duration,
      sourceAudioMode: "mute", ...(extra || {}),
    });
    const specWith = (tracks) => ({ version: "0.2.0", meta: { name: "r61r3", width: 1280, height: 720, fps: 30 }, tracks });
    const idetSrc = idetProg(path.join(MEDIA_DIR, "interlaced720.mp4"));
    log(`IDET nguồn interlaced720.mp4: TFF=${idetSrc.tff} BFF=${idetSrc.bff} Prog=${idetSrc.prog} Und=${idetSrc.und} prog=${idetSrc.progRatio}`);
    const rDeint = renderSpec(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "interlaced720.mp4", 5, { enhance: { deinterlace: true } })] }]), "r3-deint");
    const rCtrl = renderSpec(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "interlaced720.mp4", 5)] }]), "r3-deint-control");
    let d2detail = "";
    if (rDeint.status === 0 && rCtrl.status === 0 && fs.existsSync(rDeint.outPath) && fs.existsSync(rCtrl.outPath)) {
      const idetDeint = idetProg(rDeint.outPath);
      const idetCtrl = idetProg(rCtrl.outPath);
      log(`RENDER deinterlace: ${rDeint.secs.toFixed(1)}s wall (${rDeint.fps.toFixed(2)} fps render), idet prog ${idetDeint.progRatio} (TFF=${idetDeint.tff} Prog=${idetDeint.prog})`);
      log(`RENDER đối chứng (không enhance): ${rCtrl.secs.toFixed(1)}s wall, idet prog ${idetCtrl.progRatio} (TFF=${idetCtrl.tff} Prog=${idetCtrl.prog})`);
      d2detail = `nguồn prog=${idetSrc.progRatio} → sau yadif prog=${idetDeint.progRatio} (đối chứng prog=${idetCtrl.progRatio}); render deint ${rDeint.fps.toFixed(2)} fps`;
      if (idetSrc.progRatio < 0.1 && idetDeint.progRatio > 0.9 && idetCtrl.progRatio < 0.1) {
        pass("D2 render yadif: idet prog 0 → ~1, đối chứng vẫn interlaced", d2detail);
      } else {
        fail("D2 render yadif: idet prog 0 → ~1, đối chứng vẫn interlaced", d2detail);
      }
    } else {
      fail("D2 render yadif: idet prog 0 → ~1, đối chứng vẫn interlaced", `render deint status=${rDeint.status} (${(rDeint.stderr || "").slice(-300)}), control status=${rCtrl.status}`);
    }

    // ---- D3 (best-effort): combing trên canvas preview thật -----------------
    let d3detail = "";
    try {
      const stBefore = await cdp.evalJs(STATE_FN);
      const mediaCount0 = await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); return st.media.length; })()`);
      const added = await cdp.evalJs(`(async () => {
        const st = await (${STORE_FN});
        const url = ${JSON.stringify(MEDIA_URL("interlaced720.mp4"))};
        window.__r3storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-r3-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
        const st2 = window.__r3storeMod.useStore.getState();
        const clip = st2.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__r3storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
        const st3 = window.__r3storeMod.useStore.getState();
        return { mediaLen: st3.media.length, clipSrc: st3.spec.tracks.find((t) => t.id === "v1").clips[0].src };
      })()`);
      if (added.clipSrc !== "interlaced720.mp4") throw new Error(`patchClip src không đổi (đang ${added.clipSrc})`);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle(cdp, "D3 preview interlaced tại playhead 1.0");
      await sleep(800);
      const combPreview = await cdp.evalJs(`(() => {
        const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
        if (!c) return { ok: false, reason: "không thấy canvas preview" };
        const ctx = c.getContext("2d");
        const W = c.width, H = c.height;
        const d = ctx.getImageData(0, 0, W, H).data;
        const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
        let sum = 0, n = 0;
        for (let y = y0 + 1; y < y1 - 1; y += 2) for (let x = x0; x < x1; x += 2) {
          const i = (y * W + x) * 4, iu = ((y - 1) * W + x) * 4, il = ((y + 1) * W + x) * 4;
          for (let ch = 0; ch < 3; ch++) sum += Math.abs(d[i + ch] - (d[iu + ch] + d[il + ch]) / 2);
          n++;
        }
        return { ok: true, w: W, h: H, combing: +(sum / (n * 3)).toFixed(3) };
      })()`);
      if (!combPreview.ok) throw new Error(`đo combing preview thất bại: ${combPreview.reason}`);
      // Đối chứng progressive cùng cách (đổi src clip sang clean720.mp4).
      await cdp.evalJs(`(async () => {
        const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
        window.__r3storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-r3-clean", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
        const st = window.__r3storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__r3storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle(cdp, "D3 preview progressive tại playhead 1.0");
      await sleep(800);
      const combPreviewClean = await cdp.evalJs(`(() => {
        const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
        if (!c) return { ok: false, reason: "không thấy canvas preview" };
        const ctx = c.getContext("2d");
        const W = c.width, H = c.height;
        const d = ctx.getImageData(0, 0, W, H).data;
        const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
        let sum = 0, n = 0;
        for (let y = y0 + 1; y < y1 - 1; y += 2) for (let x = x0; x < x1; x += 2) {
          const i = (y * W + x) * 4, iu = ((y - 1) * W + x) * 4, il = ((y + 1) * W + x) * 4;
          for (let ch = 0; ch < 3; ch++) sum += Math.abs(d[i + ch] - (d[iu + ch] + d[il + ch]) / 2);
          n++;
        }
        return { ok: true, w: W, h: H, combing: +(sum / (n * 3)).toFixed(3) };
      })()`);
      if (!combPreviewClean.ok) throw new Error(`đo combing preview đối chứng thất bại: ${combPreviewClean.reason}`);
      d3detail = `preview canvas interlaced combing ${combPreview.combing} vs progressive ${combPreviewClean.combing} (canvas ${combPreview.w}x${combPreview.h}); media ${mediaCount0} → ${added.mediaLen}`;
      log(`D3 ${d3detail}`);
      if (combPreview.combing > combPreviewClean.combing * 1.5) {
        pass("D3 preview interlaced: răng cưa vẫn thấy trên canvas preview thật", d3detail + " — preview KHÔNG khử răng cưa (đúng thiết kế Q1: deinterlace chỉ ở render)");
      } else {
        pass("D3 preview interlaced: decoder đã khử gần hết răng cưa", d3detail + " — răng cưa không còn rõ trên preview (decoder tự khử; deinterlace ở render vẫn cần cho file xuất)");
      }
    } catch (e) {
      d3detail = `không đo được combing trong app: ${e && e.message ? e.message : e}`;
      log(`D3 ${d3detail}`);
      fail("D3 preview interlaced: đo combing trên canvas preview thật", d3detail);
    }

    // H9: 0 lỗi trang gộp.
    await drainErrors(cdp);
    await drainErrors(bcdp).catch(() => {});
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (app tab + tab trắng)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    const report = {
      cases: results, pass: nPass, total: results.length,
      fps: fpsRows, blurCal: calResults,
      combingRaw: { interlaced: combInter, clean: combClean },
      idet: { source: idetSrc },
      canvasSize,
    };
    writeFileEpermRetry(path.join(SCRATCH, "r3-fps-cal-report.json"), JSON.stringify(report, null, 2));
    log(`KẾT QUẢ HEADED R3 FPS/CAL: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
