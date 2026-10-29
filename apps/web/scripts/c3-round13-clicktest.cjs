// c3-round13-clicktest.cjs — C3 (Phase 9 đợt 13): click-test canvas THẬT
// cho 14 type transition V3 + ghost motion blur.
//
// Đây là phần mà đợt 12 còn nợ (PHASE9_ROUND12_LIMITS.md §3):
// harness V11/V12 chỉ chứng minh HÌNH HỌC (composite 2 lớp bằng FFmpeg)
// còn preview canvas thật vẽ 1 clip/lần trên nền đen thì chưa ai chụp.
// Harness này mở editor thật trên Chromium headless qua CDP, click thật
// trên TransitionPanel / MotionPanel / ruler, đọc pixel canvas thật qua
// getImageData, đối chiếu với vùng kỳ vọng.
//
// MÔ HÌNH ĐO (đọc trước khi đọc kết quả — không claim quá):
// - Preview vẽ 1 clip/lần trên nền đen (xem transitionPreview.ts): clip
//   đang transitionOut chỉ hiện lớp A của cặp, phần còn lại là nền khung
//   #0a0c10. Vì vậy "đúng hình học trên canvas" ở đây nghĩa là: pixel
//   trong vùng A = video (sáng), ngoài vùng A = nền khung (tối). Đây là
//   kiểm chứng ĐƯỜNG VẼ CANVAS (applyTransitionLayer + drawVideoClip-
//   WithTransition) áp đúng spec — KHÔNG phải kiểm chứng hình học đúng
//   với render FFmpeg (việc đó V11/V12 đã làm, MAD 0.00–0.52).
// - Vùng kỳ vọng lấy từ chính transitionPreview.ts (bundle bằng esbuild
//   rồi require trong Node): cùng 1 nguồn với code vẽ, nên test này
//   KHÔNG phát hiện được lỗi hình học trong transitionPreview.ts — nó
//   phát hiện lỗi ở tầng áp dụng lên canvas (clip path sai, seek sai,
//   alpha sai, video chưa seek kịp, nền không đen...).
// - Chỉ đo ở p=0.5 duy nhất, khung project 1280×720, máy đo VM 2 CPU.
// - Ghost: đo on-vs-off theo đúng phương pháp P5 đợt 11 (median 3 mẫu
//   trong cửa sổ phát [2.5s, 3.0s), ngưỡng > max(3×baseline, 3.0)) để
//   đối chiếu trực tiếp với FAIL "ghost vô hình" của P5 và sửa T1 đợt 12.
//
// Cửa sổ đo transition: clip 2 mẫu (start 4s, duration 4s), transitionOut
// duration 2.0s (kéo slider thật bằng phím từ 0.5 lên 2.0) → cửa sổ
// [6.0s, 8.0s), p=0.5 đúng tại playhead 7.0s (snap frame 30fps = đúng
// 7.0). Chọn clip 2 vì ở 7.0s clip chữ mẫu (0.5–5.5s) đã hết, clip 1 đã
// hết — canvas chỉ có clip 2, không bị chữ phủ lên vùng đo.
//
// Cách chạy: node apps/web/scripts/c3-round13-clicktest.cjs [smoke|full|diag]
// (mặc định full). Mode diag chỉ chẩn đoán, không tính PASS/FAIL sản phẩm.
// Exit: 0 khi không có FAIL, 1 khi có FAIL,
// 2 khi harness lỗi (không tới được dev server / chrome / bundle).
// KHÔNG push, KHÔNG sửa file sản phẩm (harness chỉ click + đọc pixel).
"use strict";

const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const MODE = process.argv[2] || "full";
const DEBUG_PORT = 9341;
const DEV_PORT = 5193;
const DEV_URL = `http://localhost:${DEV_PORT}/`;
const WEB_DIR = path.join(__dirname, "..");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/c3-cdprof";
const VITE_LOG = "/tmp/c3-vite.log";
const TP_BUNDLE = "/tmp/c3-tp.cjs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ngưỡng "pixel sáng = video": nền khung #0a0c10 có max channel = 16.
// Video mẫu tối nhất (gradient hsl lightness 16%) đo ở smoke mode phải
// cho max channel >> ngưỡng này; ngưỡng mặc định 32, có thể override
// bằng env C3_LIT để khảo sát độ nhạy (xem LIMITS).
const LIT = Number(process.env.C3_LIT || 32);

const V3_TYPES = [
  "diamondclose", "squareopen", "squareclose", "checker-alt",
  "blinds-diag", "split-h", "split-v", "barn-h", "barn-v",
  "rings", "corners", "star", "clock-ccw", "spiral",
];

class AbortRun extends Error {}
const results = [];
function finish() {
  const passed = results.filter((r) => r.status === "PASS");
  const failed = results.filter((r) => r.status === "FAIL");
  const skipped = results.filter((r) => r.status === "SKIP");
  console.log(`\n== TỔNG: ${passed.length} PASS, ${failed.length} FAIL, ${skipped.length} SKIP / ${results.length} ==`);
  if (failed.length) console.log(`CHƯA ĐẠT: ${failed.map((r) => r.name).join(", ")}`);
  process.exit(failed.length ? 1 : 0);
}
function record(name, ok, detail) {
  results.push({ name, status: ok ? "PASS" : "FAIL", detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function skip(name, detail) {
  results.push({ name, status: "SKIP", detail });
  console.log(`SKIP ${name} — ${detail}`);
}

// ---------- point-in-region (phía Node, từ TransitionLayerSpec) ----------
function inRegion(region, x, y) {
  if (!region) return true;
  switch (region.kind) {
    case "rect":
      return x >= region.x && x < region.x + region.w &&
        y >= region.y && y < region.y + region.h;
    case "rects":
      return region.rects.some((r) =>
        x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    case "circle": {
      const dx = x - region.cx, dy = y - region.cy;
      return dx * dx + dy * dy <= region.r * region.r;
    }
    case "circle-inverted": {
      const dx = x - region.cx, dy = y - region.cy;
      return dx * dx + dy * dy > region.r * region.r;
    }
    case "polygon":
      return pointInPolygon(region.points, x, y);
    case "polygon-inverted":
      return !pointInPolygon(region.points, x, y);
    default:
      throw new Error(`region kind lạ: ${region.kind}`);
  }
}
function pointInPolygon(pts, x, y) {
  // Ray casting even-odd.
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ---------- CDP ----------
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error("evaluate failed: " +
        (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)) +
        " | expr-head: " + expression.slice(0, 160).replace(/\n/g, " "));
    }
    return r.result.value;
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x, y, ...extra });
  }
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code, modifiers = 0, text) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown", text });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(150);
  }
  async waitFor(fn, label, timeoutMs = 180000) {
    const t0 = Date.now();
    let last;
    while (Date.now() - t0 < timeoutMs) {
      try { last = await fn(); } catch { last = null; }
      if (last) return last;
      await sleep(500);
    }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const SNAP_JS = `(() => {
  const rect = (el) => { const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top),
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const clips = [...document.querySelectorAll('.tl-clip')].map(el => ({
    track: el.dataset.trackId, id: el.dataset.clipId,
    kind: [...el.classList].find(c => c.startsWith('clip-')) || '?',
    ...rect(el), sel: el.classList.contains('selected') }));
  return { clips,
    rootLen: (document.getElementById('root')?.innerHTML || '').length,
    bodyText: (document.body && document.body.innerText) || '' };
})()`;

// CANVAS_JS(pointsJson, bboxJson|null): đọc pixel canvas thật. Lần đầu
// quét toàn canvas tìm bbox khung hình (pixel khác đen tuyệt đối: ngoài
// khung là #000, trong khung tối thiểu là #0a0c10); các lần sau truyền
// bbox đã đo để KHỎI quét lại — bài học diag: quét 677k px mỗi 500ms
// tranh CPU với chính video decode đang chờ, làm draw càng chậm.
const CANVAS_JS = `(function (ptsJson, bboxJson) {
  const cv = document.querySelector('.preview-canvas');
  if (!cv) return null;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  const W = cv.width, H = cv.height;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  let bbox = null;
  if (bboxJson) {
    bbox = JSON.parse(bboxJson);
  } else {
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (d[i] !== 0 || d[i + 1] !== 0 || d[i + 2] !== 0) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return { cw: W, ch: H, bbox: null, pixels: [] };
    bbox = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  const pts = JSON.parse(ptsJson);
  const pixels = pts.map((p) => {
    const cx = Math.min(W - 1, Math.max(0, Math.round(bbox.x0 + (p.x / 1280) * bbox.w)));
    const cy = Math.min(H - 1, Math.max(0, Math.round(bbox.y0 + (p.y / 720) * bbox.h)));
    const i = (cy * W + cx) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  });
  return { cw: W, ch: H, bbox, pixels };
})`;

// CAPTURE_AT_JS(target, ptsJson): chụp canvas NGAY trong trang khi
// timecode vừa chạm target (rAF poll trong page) — loại jitter do CDP
// round-trip + sleep 50ms ở ngoài (bài học ghost baseline 53 ở lần full 1:
// chụp ngoài page lệch ~0.15s so với target, video chuyển động nhanh nên
// 2 lần "off" đã khác nhau 53 MAD, át tín hiệu ghost).
const CAPTURE_AT_JS = `(function (target, ptsJson) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const parseTc = () => {
      const tc = document.querySelector('.tl-timecode');
      if (!tc) return null;
      const m = (tc.innerText || '').trim().match(/^(\\d+):(\\d+):(\\d+):(\\d+)$/);
      return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 30 : null;
    };
    const shoot = () => {
      const cv = document.querySelector('.preview-canvas');
      if (!cv) return { error: 'no-canvas' };
      const ctx = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const img = ctx.getImageData(0, 0, W, H);
      const d = img.data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (d[i] !== 0 || d[i + 1] !== 0 || d[i + 2] !== 0) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      if (x1 < 0) return { cw: W, ch: H, bbox: null, pixels: [] };
      const bbox = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      const pts = JSON.parse(ptsJson);
      const pixels = pts.map((p) => {
        const cx = Math.min(W - 1, Math.max(0, Math.round(bbox.x0 + (p.x / 1280) * bbox.w)));
        const cy = Math.min(H - 1, Math.max(0, Math.round(bbox.y0 + (p.y / 720) * bbox.h)));
        const i = (cy * W + cx) * 4;
        return [d[i], d[i + 1], d[i + 2]];
      });
      return { cw: W, ch: H, bbox, pixels };
    };
    const tick = () => {
      const ph = parseTc();
      if (ph !== null && ph >= target) {
        const cap = shoot();
        cap.tcAtCapture = ph;
        resolve(cap);
        return;
      }
      if (performance.now() - t0 > 20000) {
        resolve({ error: 'timeout', tc: ph });
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
})`;

const FIND_JS = `((kind, a) => {
  const ctr = (el) => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const ctrNoScroll = (el) => { const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const low = (t) => (t || '').toLowerCase();
  if (kind === 'clipPos') {
    const els = [...document.querySelectorAll('.tl-clip')];
    const el = els[a];
    return el ? ctr(el) : null;
  }
  if (kind === 'transCard') {
    const el = document.querySelector('.tr-card[data-type="' + a + '"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return { hidden: true };
    const pos = ctr(el);
    return { pos, selected: el.classList.contains('selected'),
      selAttr: el.getAttribute('aria-selected') };
  }
  if (kind === 'transDur') {
    const el = document.querySelector('.tr-duration input[type="range"]');
    if (!el) return null;
    return { value: Number(el.value), pos: ctrNoScroll(el) };
  }
  if (kind === 'focusTransDur') {
    const el = document.querySelector('.tr-duration input[type="range"]');
    if (!el) return false;
    el.focus();
    return true;
  }
  if (kind === 'motion') {
    const btns = [...document.querySelectorAll('.ins-section > button')];
    const btn = btns.find(b => low(b.innerText).includes('slow-mo')) ||
      btns.find(b => low(b.innerText).includes('nội suy'));
    const s = btn ? btn.closest('.ins-section') : null;
    if (!s) return { debugSections: btns.map(b => (b.innerText || '').trim()) };
    const checks = [...s.querySelectorAll('input[type="checkbox"]')];
    const labels = checks.map(c => (c.closest('label')?.innerText || '').trim());
    const blurIdx = labels.findIndex(t => low(t).includes('blur') || low(t).includes('mờ'));
    const check = blurIdx >= 0 ? checks[blurIdx] : checks[0];
    if (check) try { check.scrollIntoView({ block: 'center', inline: 'center' }); } catch {}
    const ranges = [...s.querySelectorAll('input[type="range"]')];
    const weightRanges = ranges.filter(r => /^frame [0-9]+:/.test(low((r.closest('label')?.innerText || '').trim())));
    return {
      blurCheck: check ? { checked: check.checked, pos: ctrNoScroll(check),
        label: labels[blurIdx >= 0 ? blurIdx : 0] } : null,
      weightRanges: weightRanges.length,
    };
  }
  if (kind === 'ruler') {
    const ruler = document.querySelector('.tl-ruler');
    const videoClips = [...document.querySelectorAll('.tl-clip.clip-video')];
    // clip video mẫu dài 4s → pxPerSec = chiều rộng rect / 4.
    const pps = videoClips.length
      ? videoClips[0].getBoundingClientRect().width / 4 : null;
    if (!ruler || !pps) return null;
    const rr = ruler.getBoundingClientRect();
    // Playhead đọc từ readout timecode HH:MM:SS:FF (fps 30) — chính xác
    // tuyệt đối, không phụ thuộc geometry. (Bài học smoke: handle
    // .tl-playhead-handle định vị theo ancestor khác nên lấy
    // handle.left - ruler.left cho ra playhead âm giả.)
    let playhead = null;
    const tc = document.querySelector('.tl-timecode');
    if (tc) {
      const m = (tc.innerText || '').trim().match(/^(\\d+):(\\d+):(\\d+):(\\d+)$/);
      if (m) playhead = Number(m[1]) * 3600 + Number(m[2]) * 60 +
        Number(m[3]) + Number(m[4]) / 30;
    }
    return { x: rr.left, y: rr.top + rr.height / 2, w: rr.width,
      pps, playhead, timecode: tc ? (tc.innerText || '').trim() : null };
  }
  if (kind === 'playing') {
    const btn = document.querySelector('.tbtn.play');
    return btn ? btn.getAttribute('aria-pressed') === 'true' : null;
  }
  if (kind === 'pos') {
    let el = null;
    if (a === 'playBtn') el = document.querySelector('.tbtn.play');
    else if (a === 'stopBtn') el = [...document.querySelectorAll('.tbtn')].find(b => (b.innerText || '').includes('⏮')) || null;
    return el ? ctr(el) : null;
  }
  return null;
})`;

function gridPoints(nx, ny) {
  const pts = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      pts.push({ x: (i + 0.5) * 1280 / nx, y: (j + 0.5) * 720 / ny });
  return pts;
}
const madGrid = (a, b) => {
  let s = 0, n = 0;
  for (let i = 0; i < a.length; i++)
    for (let c = 0; c < 3; c++) { s += Math.abs(a[i][c] - b[i][c]); n++; }
  return s / n;
};
const medianGrid = (grids) => grids[0].map((_, i) =>
  [0, 1, 2].map((c) => {
    const v = grids.map((g) => g[i][c]).sort((x, y) => x - y);
    return v[1];
  }));

async function main() {
  // Bundle transitionPreview.ts (nguồn kỳ vọng) bằng esbuild sẵn có.
  const esbuild = path.join(WEB_DIR, "..", "..", "node_modules", ".bin", "esbuild");
  if (!fs.existsSync(esbuild)) throw new Error(`không thấy esbuild tại ${esbuild}`);
  execSync(`${esbuild} ${path.join(WEB_DIR, "src", "lib", "transitionPreview.ts")} --bundle --platform=node --format=cjs --outfile=${TP_BUNDLE}`, { stdio: "pipe" });
  const tp = require(TP_BUNDLE);
  if (typeof tp.describeTransition !== "function") throw new Error("bundle transitionPreview thiếu describeTransition");
  for (const t of V3_TYPES) {
    const v = tp.describeTransition(t, 0.5, 1280, 720);
    if (!v.geometric || v.a.alpha !== 1) throw new Error(`tiền kiểm V3 lạ: ${t} geometric=${v.geometric} a.alpha=${v.a.alpha}`);
  }
  console.log(`Tiền kiểm: 14/14 type V3 geometric=true, lớp A alpha=1 (ngưỡng sáng LIT=${LIT})`);

  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  const viteBin = path.join(WEB_DIR, "..", "..", "node_modules", ".bin", "vite");
  if (!fs.existsSync(viteBin)) throw new Error(`không thấy vite tại ${viteBin}`);
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const logFd = fs.openSync(VITE_LOG, "w");
  const vite = spawn(viteBin, ["--port", String(DEV_PORT), "--strictPort"],
    { cwd: WEB_DIR, stdio: ["ignore", logFd, logFd] });
  const killVite = () => { try { vite.kill("SIGKILL"); } catch {} };
  process.on("exit", killVite);
  try {
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; }
      catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120s (xem ${VITE_LOG})`);
    const chrome = spawn(CHROME, [
      "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${PROFILE}`, "--no-sandbox", "--disable-gpu",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank",
    ], { stdio: "ignore" });
    const killChrome = () => { try { chrome.kill("SIGKILL"); } catch {} };
    process.on("exit", killChrome);
    try {
      let pages = null;
      for (let i = 0; i < 60 && !pages; i++) {
        try { const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`); pages = await r.json(); }
        catch { await sleep(500); }
      }
      const pageTarget = (pages || []).find((p) => p.type === "page");
      if (!pageTarget) throw new Error("không tìm thấy target type=page trong /json/list");
      const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
      await cdp.send("Page.enable");
      await cdp.send("Runtime.enable");
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false,
      });
      await cdp.send("Page.navigate", { url: DEV_URL });
      const find = (kind, a) =>
        cdp.evalJs(`(${FIND_JS})(${JSON.stringify(kind)}, ${JSON.stringify(a ?? null)})`);
      const canvasAt = async (pts, bboxOverride) =>
        cdp.evalJs(`(${CANVAS_JS})(${JSON.stringify(JSON.stringify(pts))}, ${JSON.stringify(bboxOverride ? JSON.stringify(bboxOverride) : null)})`);
      // Bbox đo 1 lần rồi tái dùng (viewport cố định 1440×1200 nên khung
      // không đổi kích thước; mọi lượt chạy tới nay đều ra 872×492@(0,142)).
      let cachedBbox = null;
      const captureGrid = async (pts) => {
        const cap = await canvasAt(pts, cachedBbox);
        if (cap?.bbox && !cachedBbox) cachedBbox = cap.bbox;
        return cap;
      };
      const alive = async () => {
        const s = await cdp.evalJs(SNAP_JS);
        return s.rootLen > 0 && s.clips.length >= 3;
      };
      const playState = async () => find("playing");
      const setPlaying = async (want) => {
        if ((await playState()) !== want) {
          const pos = await find("pos", "playBtn");
          if (!pos) throw new Error("không đo được tọa độ nút play");
          await cdp.click(pos.x, pos.y);
          await sleep(500);
        }
      };
      const selectVideoClip = async (videoOrdinal) => {
        const s = await cdp.evalJs(SNAP_JS);
        const videoIdxs = s.clips
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => c.kind === "clip-video")
          .map(({ i }) => i);
        if (videoIdxs.length <= videoOrdinal) return null;
        const pos = await find("clipPos", videoIdxs[videoOrdinal]);
        if (!pos) return null;
        await cdp.click(pos.x, pos.y);
        await sleep(600);
        return videoIdxs[videoOrdinal];
      };
      const seekRuler = async (t) => {
        const r = await find("ruler");
        if (!r) throw new Error("không đo được ruler/pxPerSec");
        await cdp.click(r.x + t * r.pps, r.y);
        await sleep(600);
        return r;
      };
      const readPlayhead = async () => (await find("ruler"))?.playhead;
      // Chờ canvas ĐỔI frame so với ảnh trước seek (bài học diag D3: chờ
      // "sáng" là chưa đủ — canvas giữ frame cũ sáng trưng trong lúc seek
      // pause chưa xong, khiến lần full 1 đo nhầm frame cũ 100%/100%).
      const waitForGridChange = async (pts, prePixels, timeoutMs = 45000) => {
        const t0 = Date.now();
        let lastMad = null, last = null;
        while (Date.now() - t0 < timeoutMs) {
          const cap = await captureGrid(pts);
          last = cap;
          if (cap && cap.bbox && prePixels) {
            lastMad = madGrid(cap.pixels, prePixels);
            if (lastMad > 5) return { ok: true, pixels: cap.pixels, cap, mad: lastMad, waitedMs: Date.now() - t0 };
          }
          await sleep(1000);
        }
        return { ok: false, pixels: last?.pixels ?? null, cap: last, mad: lastMad, waitedMs: Date.now() - t0 };
      };
      // Chờ canvas "sáng lên" sau seek khi pause: Seeker chỉ vẽ sau khi
      // `seeked` xong, mà element video của clip mới vào có thể chưa tải
      // metadata xong (lần chụp smoke ở 800ms chỉ thấy nền #0a0c10).
      // Vùng A nhỏ nhất ở p=0.5 là star 19.6% nên ngưỡng lit 5% là an toàn.
      const waitCanvasLit = async (pts, timeoutMs = 20000) => {
        const t0 = Date.now();
        let last = null;
        while (Date.now() - t0 < timeoutMs) {
          const cap = await canvasAt(pts);
          last = cap;
          if (cap && cap.bbox) {
            const lit = cap.pixels.filter((p) => Math.max(...p) > LIT).length;
            const frac = lit / cap.pixels.length;
            if (frac > 0.05) return { cap, waitedMs: Date.now() - t0, litFrac: frac };
          }
          await sleep(500);
        }
        const lit = last?.bbox
          ? last.pixels.filter((p) => Math.max(...p) > LIT).length / last.pixels.length : 0;
        return { cap: last, waitedMs: Date.now() - t0, litFrac: lit, timedOut: true };
      };

      // ---- Load mẫu + đóng modal ----
      const snap0 = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(SNAP_JS);
        return s.clips.length >= 3 ? s : null;
      }, "project mẫu >= 3 clip", 180000);
      record("C0 load sample", true,
        `${snap0.clips.length} clip: ${snap0.clips.map((c) => `${c.kind}@${c.track}`).join(", ")}`);
      const modalSel = `.modal-backdrop, .tour-card, .welcome-modal`;
      const modalOpen = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
      if (modalOpen) {
        // Đóng modal: click backdrop góc trái-trên, rồi Escape, rồi nút
        // đóng (×/đóng) nếu có — thử lần lượt vì lần chạy smoke 2 cho
        // thấy click (20,20) một lần đôi khi không đóng được modal.
        await cdp.click(20, 20); await sleep(700);
        let still = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
        if (still) { await cdp.key("Escape", "Escape"); await sleep(700); }
        still = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
        if (still) {
          const closed = await cdp.evalJs(`(() => {
            const root = document.querySelector('${modalSel}');
            if (!root) return false;
            const btn = [...root.querySelectorAll('button')]
              .find(b => (b.innerText || '').trim() === '×' ||
                (b.getAttribute('aria-label') || '').toLowerCase().includes('đóng') ||
                (b.getAttribute('aria-label') || '').toLowerCase().includes('close'));
            if (!btn) return false;
            btn.scrollIntoView({ block: 'center' });
            const r = btn.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()`);
          if (closed) { await cdp.click(closed.x, closed.y); await sleep(700); }
        }
      }
      const modalGone = !(await cdp.evalJs(`!!document.querySelector('${modalSel}')`));
      record("C0b welcome modal", modalGone, modalOpen ? "modal tự mở — đã đóng (click backdrop/Escape/nút đóng)" : "không có modal tự mở");
      if (!modalGone) throw new AbortRun("welcome modal không đóng được");

      if (MODE === "smoke") {
        // Smoke: chỉ chẩn đoán, không đổi transition/blur.
        const v2 = await selectVideoClip(1);
        record("S1 chọn clip video 2", v2 !== null, v2 === null ? "không có clip video thứ 2" : `timeline index ${v2}`);
        const missing = [];
        for (const t of V3_TYPES) {
          const card = await find("transCard", t);
          if (!card || card.hidden) missing.push(t);
        }
        record("S2 đủ 14 card V3 trong TransitionPanel", missing.length === 0,
          missing.length ? `thiếu: ${missing.join(", ")}` : "đủ 14 card, đều hiện (rect > 0)");
        const dur = await find("transDur");
        record("S3 slider duration transition", !!dur, dur ? `value=${dur.value}` : "không tìm thấy slider");
        await seekRuler(5.0);
        await setPlaying(false);
        const ph = await readPlayhead();
        const pts = gridPoints(80, 45);
        const waited = await waitCanvasLit(pts, 20000);
        const cap = waited.cap;
        if (!cap || !cap.bbox) {
          record("S4 canvas + frame bbox", false, "không đọc được canvas/bbox (canvas toàn đen?)");
        } else if (ph === null || Math.abs(ph - 5.0) > 0.04) {
          record("S4 seek ruler tới 5.0s (timecode)", false,
            `playhead đọc được=${ph} (kỳ vọng 5.0 ± 0.04) — seek ruler không tới đích`);
        } else if (waited.timedOut) {
          record("S4 canvas sáng sau seek", false,
            `sau ${waited.waitedMs}ms canvas vẫn chỉ ${Math.round(waited.litFrac * 100)}% điểm sáng (ngưỡng >5%) — video clip 2 không vẽ lên sau seek pause`);
        } else {
          const maxs = cap.pixels.map((p) => Math.max(...p));
          const bins = [0, 0, 0, 0, 0, 0];
          for (const m of maxs) {
            if (m <= 16) bins[0]++;
            else if (m <= 24) bins[1]++;
            else if (m <= 32) bins[2]++;
            else if (m <= 48) bins[3]++;
            else if (m <= 80) bins[4]++;
            else bins[5]++;
          }
          const sorted = [...maxs].sort((a, b) => a - b);
          const p1 = sorted[Math.floor(sorted.length * 0.01)];
          const p50 = sorted[Math.floor(sorted.length * 0.5)];
          record("S4 canvas + frame bbox", true,
            `canvas ${cap.cw}×${cap.ch}, bbox=${JSON.stringify(cap.bbox)}, playhead=${ph?.toFixed(3)}, ` +
            `chờ sáng ${waited.waitedMs}ms lit=${Math.round(waited.litFrac * 100)}%, ` +
            `max-channel: p1=${p1} p50=${p50}, bins[<=16,17-24,25-32,33-48,49-80,81+]=[${bins.join(",")}]`);
        }
        const v1 = await selectVideoClip(0);
        const mo = await find("motion");
        record("S5 MotionPanel clip 1", v1 !== null && !!mo?.blurCheck,
          `chọn clip1=${v1 !== null}, motion=${JSON.stringify(mo)}`);
        finish();
      }

      // ================= DIAG =================
      if (MODE === "diag") {
        const diagFracs = (cap, type) => {
          if (!cap || !cap.bbox) return "no-canvas";
          const vis = tp.describeTransition(type, 0.5, 1280, 720);
          const pts = gridPoints(40, 23);
          let inN = 0, inLit = 0, outN = 0, outLit = 0;
          for (let k = 0; k < pts.length; k++) {
            const inside = inRegion(vis.a.region, pts[k].x, pts[k].y);
            const lit = Math.max(...cap.pixels[k]) > LIT;
            if (inside) { inN++; if (lit) inLit++; }
            else { outN++; if (lit) outLit++; }
          }
          return `trong ${inLit}/${inN} (${(100 * inLit / inN).toFixed(1)}%) ngoài ${outLit}/${outN} (${(100 * outLit / outN).toFixed(1)}%)`;
        };
        const diagState = async (label) => {
          const info = await cdp.evalJs(`(() => ({
            canvases: [...document.querySelectorAll('.preview-canvas')].map(c => {
              const r = c.getBoundingClientRect();
              return { w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height) };
            }),
            videos: [...document.querySelectorAll('video')].map(v => ({
              readyState: v.readyState, currentTime: Math.round(v.currentTime * 100) / 100,
              paused: v.paused, vw: v.videoWidth, vh: v.videoHeight,
              blob: (v.currentSrc || '').startsWith('blob:'),
            })),
            tc: (document.querySelector('.tl-timecode')?.innerText || '').trim(),
            selCard: document.querySelector('.tr-card.selected')?.dataset?.type || null,
            dur: (() => { const el = document.querySelector('.tr-duration input[type="range"]');
              return el ? Number(el.value) : null; })(),
            selClip: [...document.querySelectorAll('.tl-clip')].filter(el => el.classList.contains('selected'))
              .map(el => ({ id: el.dataset.clipId, kind: [...el.classList].find(c => c.startsWith('clip-')) })),
          }))()`);
          console.log(`DIAG ${label} — ${JSON.stringify(info)}`);
          return info;
        };
        const v2d = await selectVideoClip(1);
        console.log(`DIAG chọn clip2: ${v2d !== null ? "ok" : "FAIL"}`);
        let card = await find("transCard", "diamondclose");
        if (card && !card.hidden) {
          await cdp.click(card.pos.x, card.pos.y);
          await sleep(600);
        }
        let dur = await find("transDur");
        if (dur && Math.abs(dur.value - 2.0) > 1e-9) {
          const focused = await find("focusTransDur");
          if (focused) {
            const steps = Math.round((2.0 - dur.value) / 0.1);
            const key = steps > 0 ? "ArrowRight" : "ArrowLeft";
            for (let i = 0; i < Math.abs(steps); i++) await cdp.key(key, key);
            await sleep(500);
          }
        }
        // D1: seek pause tới 7.0, chụp sau 2s.
        await seekRuler(7.0);
        await setPlaying(false);
        await sleep(2000);
        await diagState("D1 pause-seek 7.0 diamondclose (sau 2s)");
        const capD1 = await canvasAt(gridPoints(40, 23));
        console.log(`DIAG D1 fractions diamondclose p=0.5: ${diagFracs(capD1, "diamondclose")}`);
        // D2: phát từ 6.5, chụp trong trang đúng lúc timecode chạm 7.0.
        await seekRuler(6.5);
        await setPlaying(true);
        const capD2 = await cdp.evalJs(`(${CAPTURE_AT_JS})(7.0, ${JSON.stringify(JSON.stringify(gridPoints(40, 23)))})`);
        await setPlaying(false);
        console.log(`DIAG D2 play-through capture tc=${capD2.tcAtCapture} bbox=${JSON.stringify(capD2.bbox)} fractions: ${diagFracs(capD2, "diamondclose")}`);
        await diagState("D2 sau play-through");
        // D3: seek pause lại 7.0 (lần 2), chụp sau khi sáng.
        await seekRuler(7.0);
        await setPlaying(false);
        const lit3 = await waitCanvasLit(gridPoints(40, 23), 20000);
        console.log(`DIAG D3 pause-seek lần 2: timedOut=${!!lit3.timedOut} waited=${lit3.waitedMs}ms lit=${Math.round(lit3.litFrac * 100)}% fractions: ${diagFracs(lit3.cap, "diamondclose")}`);
        await diagState("D3 sau pause-seek lần 2");
        // D4: ghost bằng chụp trong trang (khử jitter CDP).
        const v1d = await selectVideoClip(0);
        console.log(`DIAG chọn clip1: ${v1d !== null ? "ok" : "FAIL"}`);
        let mod = await find("motion");
        if (mod?.blurCheck?.checked) {
          await cdp.click(mod.blurCheck.pos.x, mod.blurCheck.pos.y);
          await sleep(600);
        }
        const ghostInPage = async () => {
          const stopPos = await find("pos", "stopBtn");
          await cdp.click(stopPos.x, stopPos.y);
          await sleep(400);
          await setPlaying(true);
          const cap = await cdp.evalJs(`(${CAPTURE_AT_JS})(2.5, ${JSON.stringify(JSON.stringify(gridPoints(32, 18)))})`);
          await setPlaying(false);
          return cap.pixels;
        };
        const goff1 = await ghostInPage();
        mod = await find("motion");
        await cdp.click(mod.blurCheck.pos.x, mod.blurCheck.pos.y);
        await sleep(600);
        mod = await find("motion");
        console.log(`DIAG ghost blur bật: checked=${mod?.blurCheck?.checked} weightRanges=${mod?.weightRanges}`);
        const gon = await ghostInPage();
        mod = await find("motion");
        await cdp.click(mod.blurCheck.pos.x, mod.blurCheck.pos.y);
        await sleep(600);
        const goff2 = await ghostInPage();
        console.log(`DIAG ghost in-page: baseline off-vs-off=${madGrid(goff1, goff2).toFixed(2)}, signal on-vs-off=${((madGrid(gon, goff1) + madGrid(gon, goff2)) / 2).toFixed(2)}`);
        finish();
      }

      // ================= DIAG2 =================
      // Chẩn đoán MAD=0 ở ghost full2: media mẫu là video thật hay ảnh
      // tĩnh (stillSample khi MediaRecorder hỏng)? Và seek pause có vẽ?
      if (MODE === "diag2") {
        const gp = gridPoints(32, 18);
        const mediaNames = await cdp.evalJs(`[...document.querySelectorAll('.media-name')].map(el => el.innerText)`);
        console.log(`DIAG2 media-bin: ${JSON.stringify(mediaNames)}`);
        const cap0 = await canvasAt(gp);
        console.log(`DIAG2 G0 initial paused: bbox=${JSON.stringify(cap0?.bbox)} lit=${cap0 ? Math.round(100 * cap0.pixels.filter((p) => Math.max(...p) > LIT).length / cap0.pixels.length) : "?"}%`);
        const stopPos = await find("pos", "stopBtn");
        await cdp.click(stopPos.x, stopPos.y);
        await sleep(400);
        await setPlaying(true);
        await sleep(2000);
        const capPlay = await canvasAt(gp);
        console.log(`DIAG2 G1 đang phát (~2s): tc=${await readPlayhead()} MAD vs G0=${cap0 && capPlay ? madGrid(cap0.pixels, capPlay.pixels).toFixed(2) : "?"}`);
        await setPlaying(false);
        await sleep(500);
        await seekRuler(1.0);
        await setPlaying(false);
        await sleep(3000);
        const cap10 = await canvasAt(gp);
        console.log(`DIAG2 G2 pause-seek 1.0 (sau 3s): tc=${await readPlayhead()} MAD vs G1=${capPlay && cap10 ? madGrid(capPlay.pixels, cap10.pixels).toFixed(2) : "?"}`);
        await seekRuler(2.5);
        await setPlaying(false);
        await sleep(3000);
        const cap25 = await canvasAt(gp);
        console.log(`DIAG2 G3 pause-seek 2.5 (sau 3s): tc=${await readPlayhead()} MAD vs G2=${cap10 && cap25 ? madGrid(cap10.pixels, cap25.pixels).toFixed(2) : "?"} lit=${cap25 ? Math.round(100 * cap25.pixels.filter((p) => Math.max(...p) > LIT).length / cap25.pixels.length) : "?"}%`);
        finish();
      }

      // ================= DIAG3 =================
      // Đo thời gian video sẵn sàng: phát clip 1, poll lit% mỗi 2s tới 60s;
      // rồi seek clip 2 tới 5.0, poll tiếp tới 60s.
      if (MODE === "diag3") {
        const gp = gridPoints(32, 18);
        const litPct = async () => {
          const cap = await canvasAt(gp);
          if (!cap || !cap.bbox) return -1;
          return Math.round(100 * cap.pixels.filter((p) => Math.max(...p) > LIT).length / cap.pixels.length);
        };
        await selectVideoClip(0);
        const stopPos = await find("pos", "stopBtn");
        await cdp.click(stopPos.x, stopPos.y);
        await sleep(400);
        await setPlaying(true);
        console.log(`DIAG3 clip1 phát: tc0=${await readPlayhead()}`);
        for (let i = 0; i < 30; i++) {
          await sleep(2000);
          console.log(`DIAG3 clip1 phát +${(i + 1) * 2}s: tc=${await readPlayhead()} lit=${await litPct()}%`);
        }
        await setPlaying(false);
        await selectVideoClip(1);
        await seekRuler(5.0);
        await setPlaying(false);
        console.log(`DIAG3 clip2 seek 5.0: tc=${await readPlayhead()}`);
        for (let i = 0; i < 30; i++) {
          await sleep(2000);
          console.log(`DIAG3 clip2 pause 5.0 +${(i + 1) * 2}s: tc=${await readPlayhead()} lit=${await litPct()}%`);
        }
        finish();
      }

      // ================= DIAG4 =================
      // Kiểm chứng "nudge": seek pause clip2 tới 7.0 (diamondclose, dur
      // 2.0), rồi đảo playhead 7.033/7.0 để ép vẽ lại, xem frame đúng có
      // tới không (diag3: seek pause 1 lần đóng băng ở khung nền/chữ).
      if (MODE === "diag4") {
        const gp = gridPoints(80, 45);
        await selectVideoClip(1);
        let card = await find("transCard", "diamondclose");
        if (card && !card.hidden) { await cdp.click(card.pos.x, card.pos.y); await sleep(600); }
        let dur = await find("transDur");
        if (dur && Math.abs(dur.value - 2.0) > 1e-9) {
          const focused = await find("focusTransDur");
          if (focused) {
            const steps = Math.round((2.0 - dur.value) / 0.1);
            const key = steps > 0 ? "ArrowRight" : "ArrowLeft";
            for (let i = 0; i < Math.abs(steps); i++) await cdp.key(key, key);
            await sleep(500);
          }
        }
        const vis = tp.describeTransition("diamondclose", 0.5, 1280, 720);
        const fracs = (cap) => {
          let inN = 0, inLit = 0, outN = 0, outLit = 0;
          for (let k = 0; k < gp.length; k++) {
            const inside = inRegion(vis.a.region, gp[k].x, gp[k].y);
            const lit = Math.max(...cap.pixels[k]) > LIT;
            if (inside) { inN++; if (lit) inLit++; }
            else { outN++; if (lit) outLit++; }
          }
          return { inPct: 100 * inLit / inN, outPct: 100 * outLit / outN,
            lit: 100 * (inLit + outLit) / gp.length };
        };
        await seekRuler(7.0);
        await setPlaying(false);
        const t0 = Date.now();
        let poll = 0, done = false;
        while (Date.now() - t0 < 60000 && !done) {
          await sleep(1500);
          poll++;
          const tc = await readPlayhead();
          const cap = await canvasAt(gp);
          if (cap && cap.bbox) {
            const f = fracs(cap);
            console.log(`DIAG4 poll ${poll} t+${Math.round((Date.now() - t0) / 1000)}s tc=${tc} lit=${f.lit.toFixed(0)}% trong=${f.inPct.toFixed(1)}% ngoài=${f.outPct.toFixed(1)}%`);
            if (tc !== null && Math.abs(tc - 7.0) <= 0.04 && f.inPct >= 90 && f.outPct <= 10) {
              console.log(`DIAG4 THÀNH CÔNG sau ${poll} poll (${Math.round((Date.now() - t0) / 1000)}s)`);
              done = true;
              break;
            }
          } else console.log(`DIAG4 poll ${poll} t+${Math.round((Date.now() - t0) / 1000)}s tc=${tc} no-canvas`);
          // Nudge: đảo playhead để ép seek+vẽ lại (lần chẵn về 7.0).
          if (poll % 2 === 1) { await seekRuler(7.033); await setPlaying(false); }
          else { await seekRuler(7.0); await setPlaying(false); }
        }
        if (!done) console.log("DIAG4 KHÔNG thành công sau 60s nudge");
        finish();
      }

      // ================= DIAG5 =================
      // Phân biệt đóng băng vs bỏ transition: đặt diamondclose ở 7.0,
      // chụp; đổi sang squareopen ở cùng playhead, chụp; so MAD 2 ảnh.
      // MAD ≈ 0 → canvas đóng băng (không vẽ). MAD lớn + fractions khớp
      // từng type → vẽ + clip đúng. Kèm play-through để đối chiếu.
      if (MODE === "diag5") {
        const gp = gridPoints(80, 45);
        const fracs = (cap, type) => {
          const vis = tp.describeTransition(type, 0.5, 1280, 720);
          let inN = 0, inLit = 0, outN = 0, outLit = 0;
          const mean = [0, 0, 0];
          for (let k = 0; k < gp.length; k++) {
            const inside = inRegion(vis.a.region, gp[k].x, gp[k].y);
            const lit = Math.max(...cap.pixels[k]) > LIT;
            if (inside) { inN++; if (lit) inLit++; }
            else { outN++; if (lit) outLit++; }
            mean[0] += cap.pixels[k][0]; mean[1] += cap.pixels[k][1]; mean[2] += cap.pixels[k][2];
          }
          const n = gp.length;
          // Clip 1 hue ~225 (B trội), clip 2 hue ~160 (G trội) → mean RGB
          // phân biệt frame cũ clip 1 (đóng băng) vs frame clip 2 (vẽ mới).
          return `trong=${(100 * inLit / inN).toFixed(1)}% ngoài=${(100 * outLit / outN).toFixed(1)}% meanRGB=(${Math.round(mean[0] / n)},${Math.round(mean[1] / n)},${Math.round(mean[2] / n)})`;
        };
        const state = async (label) => {
          const s = await cdp.evalJs(`(() => ({
            selCard: document.querySelector('.tr-card.selected')?.dataset?.type || null,
            dur: (() => { const el = document.querySelector('.tr-duration input[type="range"]');
              return el ? Number(el.value) : null; })(),
            tc: (document.querySelector('.tl-timecode')?.innerText || '').trim(),
          }))()`);
          console.log(`DIAG5 ${label}: ${JSON.stringify(s)}`);
        };
        const setType = async (type) => {
          let card = await find("transCard", type);
          if (card && !card.hidden) { await cdp.click(card.pos.x, card.pos.y); await sleep(600); }
          let dur = await find("transDur");
          if (dur && Math.abs(dur.value - 2.0) > 1e-9) {
            const focused = await find("focusTransDur");
            if (focused) {
              const steps = Math.round((2.0 - dur.value) / 0.1);
              const key = steps > 0 ? "ArrowRight" : "ArrowLeft";
              for (let i = 0; i < Math.abs(steps); i++) await cdp.key(key, key);
              await sleep(500);
            }
          }
        };
        await selectVideoClip(1);
        await setType("diamondclose");
        await seekRuler(7.0);
        await setPlaying(false);
        await sleep(3000);
        await state("diamondclose @7.0");
        const capD = await canvasAt(gp);
        console.log(`DIAG5 diamondclose fractions: ${capD ? fracs(capD, "diamondclose") : "no-canvas"}`);
        await setType("squareopen");
        await sleep(3000);
        await state("squareopen @7.0 (không seek lại)");
        const capS = await canvasAt(gp);
        console.log(`DIAG5 squareopen fractions: ${capS ? fracs(capS, "squareopen") : "no-canvas"}`);
        console.log(`DIAG5 MAD diamondclose-vs-squareopen @7.0: ${capD && capS ? madGrid(capD.pixels, capS.pixels).toFixed(2) : "?"}`);
        // Play-through: phát từ 6.5, chụp trong trang khi timecode ≥ 7.0.
        await seekRuler(6.5);
        await setPlaying(true);
        const capP = await cdp.evalJs(`(${CAPTURE_AT_JS})(7.0, ${JSON.stringify(JSON.stringify(gp))})`);
        await setPlaying(false);
        console.log(`DIAG5 play-through tc=${capP.tcAtCapture} fractions diamondclose? (type hiện tại là squareopen): ${capP.bbox ? fracs(capP, "squareopen") : "no-canvas"}`);
        finish();
      }

      // ================= DIAG6 =================
      // Kiểm chứng lại các mục fail ở full5 sau warm-up: (a) diamondclose
      // + split-v (diamondclose fail vì là type đầu tiên khi element còn
      // lạnh; split-v fail sát ngưỡng MAD 3.09); (b) ghost với warm-up
      // phát clip 1 đủ 2 lượt trước khi đo.
      if (MODE === "diag6") {
        const gp = gridPoints(80, 45);
        const waitPts = gridPoints(40, 23);
        const setTypeDur2 = async (type) => {
          let card = await find("transCard", type);
          if (card && !card.hidden) { await cdp.click(card.pos.x, card.pos.y); await sleep(600); }
          let dur = await find("transDur");
          if (dur && Math.abs(dur.value - 2.0) > 1e-9) {
            const focused = await find("focusTransDur");
            if (focused) {
              const steps = Math.round((2.0 - dur.value) / 0.1);
              const key = steps > 0 ? "ArrowRight" : "ArrowLeft";
              for (let i = 0; i < Math.abs(steps); i++) await cdp.key(key, key);
              await sleep(500);
            }
          }
        };
        const testType = async (type) => {
          await selectVideoClip(1);
          await sleep(400);
          await setTypeDur2(type);
          const visPre = tp.describeTransition(type, 0.5, 1280, 720);
          let expIn = 0;
          for (const p of waitPts) if (inRegion(visPre.a.region, p.x, p.y)) expIn++;
          const expFrac = expIn / waitPts.length;
          const preSeek = await captureGrid(waitPts);
          await seekRuler(7.033);
          await setPlaying(false);
          await sleep(500);
          await seekRuler(7.0);
          await setPlaying(false);
          let newFrame = null;
          const t0 = Date.now();
          while (Date.now() - t0 < 45000) {
            const tcNow = await readPlayhead();
            const c = await captureGrid(waitPts);
            if (c && c.bbox && preSeek?.pixels && tcNow !== null && Math.abs(tcNow - 7.0) <= 0.04) {
              const mad = madGrid(c.pixels, preSeek.pixels);
              const lit = c.pixels.filter((p) => Math.max(...p) > LIT).length / c.pixels.length;
              if (mad > 5 && Math.abs(lit - expFrac) <= 0.12) { newFrame = c; break; }
            }
            await sleep(1000);
          }
          if (!newFrame) { console.log(`DIAG6 ${type}: FAIL không thấy frame mới sau 45s`); return; }
          const cap = await captureGrid(gp);
          const vis = tp.describeTransition(type, 0.5, 1280, 720);
          let inN = 0, inLit = 0, outN = 0, outLit = 0;
          for (let k = 0; k < gp.length; k++) {
            const inside = inRegion(vis.a.region, gp[k].x, gp[k].y);
            const lit = Math.max(...cap.pixels[k]) > LIT;
            if (inside) { inN++; if (lit) inLit++; }
            else { outN++; if (lit) outLit++; }
          }
          const inPct = 100 * inLit / inN, outPct = 100 * outLit / outN;
          console.log(`DIAG6 ${type}: ${inPct >= 90 && outPct <= 10 ? "PASS" : "FAIL"} trong=${inPct.toFixed(1)}% ngoài=${outPct.toFixed(1)}% (chờ ${Date.now() - t0}ms)`);
        };
        // Warm-up clip 2: phát từ 4.0 qua 7.0 rồi pause.
        await selectVideoClip(1);
        await seekRuler(4.0);
        await setPlaying(true);
        {
          const t0 = Date.now();
          while (Date.now() - t0 < 20000) {
            const ph = await readPlayhead();
            if (ph !== null && ph >= 7.5) break;
            await sleep(100);
          }
        }
        await setPlaying(false);
        await sleep(500);
        await testType("diamondclose");
        await testType("split-v");
        // Ghost warm-up: phát clip 1 đủ 2 lượt 0→4 rồi đo như full.
        await selectVideoClip(0);
        let mod = await find("motion");
        if (mod?.blurCheck?.checked) {
          await cdp.click(mod.blurCheck.pos.x, mod.blurCheck.pos.y);
          await sleep(600);
        }
        const ghostGridPts = gridPoints(32, 18);
        const playFull = async () => {
          const stopPos = await find("pos", "stopBtn");
          await cdp.click(stopPos.x, stopPos.y);
          await sleep(400);
          await setPlaying(true);
          const t0 = Date.now();
          while (Date.now() - t0 < 30000) {
            const ph = await readPlayhead();
            if (ph !== null && ph >= 3.9) break;
            await sleep(100);
          }
          await setPlaying(false);
          await sleep(300);
        };
        const capPaused = async (t) => {
          for (let attempt = 1; attempt <= 3; attempt++) {
            await seekRuler(1.0);
            await setPlaying(false);
            await sleep(300);
            const pre = await captureGrid(ghostGridPts);
            await seekRuler(t);
            await setPlaying(false);
            const changed = await waitForGridChange(ghostGridPts, pre?.pixels, 20000);
            console.log(`DIAG6 ghost attempt ${attempt} ok=${changed.ok} MAD=${changed.mad?.toFixed(2)}`);
            if (changed.ok) return changed.pixels;
          }
          return null;
        };
        await playFull();
        await playFull();
        const goff1 = await capPaused(2.5);
        const goff2 = await capPaused(2.5);
        mod = await find("motion");
        if (mod?.blurCheck) { await cdp.click(mod.blurCheck.pos.x, mod.blurCheck.pos.y); await sleep(600); }
        mod = await find("motion");
        console.log(`DIAG6 ghost blur bật: checked=${mod?.blurCheck?.checked} weightRanges=${mod?.weightRanges}`);
        await playFull();
        const gon = await capPaused(2.5);
        mod = await find("motion");
        if (mod?.blurCheck?.checked) { await cdp.click(mod.blurCheck.pos.x, mod.blurCheck.pos.y); await sleep(600); }
        const goff3 = await capPaused(2.5);
        if (goff1 && goff2 && gon && goff3) {
          const baseline = madGrid(goff1, goff2);
          const signal = (madGrid(gon, goff2) + madGrid(gon, goff3)) / 2;
          console.log(`DIAG6 ghost: baseline=${baseline.toFixed(2)} signal=${signal.toFixed(2)} ngưỡng=${Math.max(3 * baseline, 3.0).toFixed(2)} -> ${signal > Math.max(3 * baseline, 3.0) ? "PASS" : "FAIL"}`);
        } else {
          console.log(`DIAG6 ghost: KHÔNG ĐO ĐƯỢC (off1=${!!goff1} off2=${!!goff2} on=${!!gon} off3=${!!goff3})`);
        }
        finish();
      }

      // ================= FULL =================
      // ---- G1: ghost probe (clip 1, cửa sổ [2.5, 3.0)) ----
      const v1 = await selectVideoClip(0);
      if (v1 === null) { skip("G ghost motion blur (clip 1)", "không có clip video đầu"); }
      else {
        let mo = await find("motion");
        if (!mo?.blurCheck) skip("G ghost motion blur (clip 1)", "không tìm thấy checkbox motion blur");
        else { try {
          if (mo.blurCheck.checked) {
            await cdp.click(mo.blurCheck.pos.x, mo.blurCheck.pos.y);
            await sleep(600);
            mo = await find("motion");
          }
          // Ghost v2 (PAUSE, khử jitter): chụp khi pause tại playhead
          // chính xác 2.500s — frame hiện tại cố định, chỉ khác snapshot
          // trong ring. Trình tự: phát ~2s (nạp snapshot) → pause →
          // seek 1.0 → seek 2.5 (mỗi seek vẽ 1 lần) → chụp. Khi blur bật,
          // lần vẽ 2.5 blend snapshot lúc phát + frame 2.5; khi tắt thì
          // vẽ đúng frame 2.5. Baseline off-vs-off phải ≈ 0 (cùng 1 frame
          // giải mã 2 lần) — khác hẳn baseline 53/7.89 của cách chụp lúc
          // đang phát (lệch thời gian giữa các lần chạy).
          const ghostGridPts = gridPoints(32, 18);
          const playFromStart = async (untilT) => {
            const stopPos = await find("pos", "stopBtn");
            if (!stopPos) throw new Error("không đo được nút ⏮");
            await cdp.click(stopPos.x, stopPos.y);
            await sleep(400);
            await setPlaying(true);
            const t0 = Date.now();
            while (Date.now() - t0 < 20000) {
              const ph = await readPlayhead();
              if (ph !== null && ph >= untilT) break;
              await sleep(100);
            }
            await setPlaying(false);
            await sleep(300);
          };
          const capturePausedAt = async (t) => {
            // Thử tối đa 3 lần: mỗi lần seek 1.0 → 2.5 là 1 lần ép seek+vẽ;
            // seek pause ở headless có thể không hoàn tất ở lần đầu (bài
            // học full4: 45s 1 lần vẫn MAD=0), thử lại cho element ấm dần.
            let lastErr = null;
            for (let attempt = 1; attempt <= 3; attempt++) {
              await seekRuler(1.0);
              await setPlaying(false);
              await sleep(300);
              const tc1 = await readPlayhead();
              const pre = await captureGrid(ghostGridPts);
              if (!pre || !pre.bbox) throw new Error("ghost: không đọc được canvas trước seek");
              const preLit = Math.round(100 * pre.pixels.filter((p) => Math.max(...p) > LIT).length / pre.pixels.length);
              await seekRuler(t);
              await setPlaying(false);
              const tc2 = await readPlayhead();
              const changed = await waitForGridChange(ghostGridPts, pre.pixels, 20000);
              const lastLit = changed.cap?.bbox
                ? Math.round(100 * changed.cap.pixels.filter((p) => Math.max(...p) > LIT).length / changed.cap.pixels.length) : -1;
              console.log(`GHOST attempt ${attempt} seek 1.0 (tc=${tc1}) pre lit=${preLit}% -> seek ${t} (tc=${tc2}) waited=${changed.waitedMs}ms MAD=${changed.mad?.toFixed(2)} lastLit=${lastLit}% ok=${changed.ok}`);
              if (changed.ok) return changed.pixels;
              lastErr = `ghost: canvas không đổi sau seek tới ${t} (tc=${tc2}, MAD cuối=${changed.mad}, lit cuối=${lastLit}%)`;
            }
            throw new Error(lastErr);
          };
          await playFromStart(2.0);
          const off1 = await capturePausedAt(2.5);
          const off2 = await capturePausedAt(2.5);
          // Bật blur bằng click thật, phát để nạp snapshot, chụp pause.
          mo = await find("motion");
          await cdp.click(mo.blurCheck.pos.x, mo.blurCheck.pos.y);
          await sleep(600);
          mo = await find("motion");
          const weightsOk = mo?.blurCheck?.checked === true && mo.weightRanges === 3;
          await playFromStart(2.0);
          const on = await capturePausedAt(2.5);
          // Tắt blur, chụp lại OFF tại cùng playhead.
          mo = await find("motion");
          await cdp.click(mo.blurCheck.pos.x, mo.blurCheck.pos.y);
          await sleep(600);
          const off3 = await capturePausedAt(2.5);
          const baseline = madGrid(off1, off2);
          const signal = (madGrid(on, off2) + madGrid(on, off3)) / 2;
          const threshold = Math.max(3 * baseline, 3.0);
          record("G ghost on-vs-off (pause 2.5s, P5 ngưỡng)", signal > threshold,
            `blur bật: weightsOk=${weightsOk} (checked, 3 slider); ` +
            `baseline off-vs-off=${baseline.toFixed(2)}, signal on-vs-off=${signal.toFixed(2)}, ` +
            `ngưỡng max(3×baseline, 3.0)=${threshold.toFixed(2)}, app sống=${await alive()}`);
          } catch (e) {
            // Ghost lỗi không được chặn phần transition phía sau (bài học
            // full3: throw ở ghost làm mất cả 14 type).
            record("G ghost on-vs-off (pause 2.5s, P5 ngưỡng)", false,
              `probe lỗi, không đo được signal: ${e.message}`);
          }
        }
      }

      // ---- T: 14 type V3 trên clip 2, p=0.5 tại playhead 7.0s ----
      const v2 = await selectVideoClip(1);
      if (v2 === null) {
        for (const t of V3_TYPES) record(`T ${t} canvas p=0.5`, false, "không có clip video thứ 2");
      } else {
        const pts = gridPoints(80, 45);
        for (const type of V3_TYPES) {
          // Luôn chọn lại clip 2 đầu mỗi type (bài học lần full 1: 3 card
          // cuối "biến mất", nghi selection trôi khỏi clip video — chọn
          // lại tường minh trước mỗi type, không tin selection còn giữ).
          await selectVideoClip(1);
          await sleep(400);
          let card = await find("transCard", type);
          if (!card || card.hidden) {
            const snap = await cdp.evalJs(SNAP_JS);
            const sel = snap.clips.filter((c) => c.sel)
              .map((c) => `${c.kind}@${c.track}`).join(", ");
            record(`T ${type} canvas p=0.5`, false,
              `không tìm thấy card transition (hoặc bị ẩn); clip đang chọn: [${sel || "không có"}]`);
            continue;
          }
          await cdp.click(card.pos.x, card.pos.y);
          await sleep(600);
          card = await find("transCard", type);
          const selOk = card?.selected === true || card?.selAttr === "true";
          // Duration → 2.0s bằng phím thật (từ giá trị hiện tại).
          let dur = await find("transDur");
          if (dur && Math.abs(dur.value - 2.0) > 1e-9) {
            const focused = await find("focusTransDur");
            if (focused) {
              const steps = Math.round((2.0 - dur.value) / 0.1);
              const key = steps > 0 ? "ArrowRight" : "ArrowLeft";
              for (let i = 0; i < Math.abs(steps); i++) await cdp.key(key, key);
              await sleep(500);
              dur = await find("transDur");
            }
          }
          const durOk = dur && Math.abs(dur.value - 2.0) < 1e-9;
          // Vùng kỳ vọng tính TRƯỚC để biết frame mới phải sáng bao nhiêu.
          // Lưới chờ nhỏ (40×23) để poll nhẹ CPU; phân loại cuối vẫn dùng
          // lưới đầy đủ 80×45.
          const waitPts = gridPoints(40, 23);
          const visPre = tp.describeTransition(type, 0.5, 1280, 720);
          let expIn = 0;
          for (const p of waitPts) if (inRegion(visPre.a.region, p.x, p.y)) expIn++;
          const expFrac = expIn / waitPts.length;
          // Chụp frame trước seek. Rồi NUDGE bắt buộc: seek 7.033 rồi về
          // 7.0 — bài học full4: paused path CHỈ vẽ khi playhead đổi,
          // nên đổi type mà playhead vẫn 7.0 thì không bao giờ có frame
          // mới (checker-alt/blinds-diag/split-h chờ vô ích với frame cũ
          // của squareclose). Nudge ép 1 lần seek+vẽ mới cho mỗi type.
          const preSeek = await captureGrid(waitPts);
          await seekRuler(7.033);
          await setPlaying(false);
          await sleep(500);
          await seekRuler(7.0);
          await setPlaying(false);
          let ph = await readPlayhead();
          let waited = 0;
          while ((ph === null || Math.abs(ph - 7.0) > 0.04) && waited < 10000) {
            await sleep(500);
            waited += 500;
            ph = await readPlayhead();
          }
          // Chờ FRAME MỚI (không phải frame sáng bất kỳ): MAD so với
          // frame trước seek > 5 VÀ tỉ lệ sáng khớp vùng kỳ vọng ±12pp,
          // và chỉ chấp nhận khi timecode đang đúng 7.0 (tránh nhận nhầm
          // frame 7.033 trong lúc nudge).
          let newFrame = null, newWaited = 0, lastLit = 0, lastMad = null;
          const t0 = Date.now();
          while (Date.now() - t0 < 45000) {
            const tcNow = await readPlayhead();
            const c = await captureGrid(waitPts);
            if (c && c.bbox && preSeek?.pixels && tcNow !== null && Math.abs(tcNow - 7.0) <= 0.04) {
              lastMad = madGrid(c.pixels, preSeek.pixels);
              const lit = c.pixels.filter((p) => Math.max(...p) > LIT).length / c.pixels.length;
              lastLit = lit;
              if (lastMad > 5 && Math.abs(lit - expFrac) <= 0.12) { newFrame = c; break; }
            }
            await sleep(1000);
          }
          newWaited = Date.now() - t0;
          if (!newFrame) {
            record(`T ${type} canvas p=0.5`, false,
              `sel=${selOk} dur=${dur?.value} playhead=${ph?.toFixed(3)} — sau 45s không thấy frame mới khớp vùng kỳ vọng (lit cuối=${Math.round(lastLit * 100)}% vs kỳ vọng ${Math.round(expFrac * 100)}%, MAD cuối vs frame cũ=${lastMad?.toFixed(2)})`);
            continue;
          }
          // Chụp lại khung hình đã chấp nhận ở lưới đầy đủ để phân loại.
          let cap = await captureGrid(pts);
          // Chờ canvas ổn định: 2 lần chụp cách nhau 500ms, MAD < 0.5.
          let stability = null;
          for (let i = 0; i < 8; i++) {
            await sleep(500);
            const cap2 = await captureGrid(pts);
            if (cap && cap2 && cap.bbox && cap2.bbox) {
              stability = madGrid(cap.pixels, cap2.pixels);
              cap = cap2;
              if (stability < 0.5) break;
            } else cap = cap2;
          }
          if (!cap || !cap.bbox) {
            record(`T ${type} canvas p=0.5`, false, "không đọc được canvas/bbox sau seek");
            continue;
          }
          const vis = tp.describeTransition(type, 0.5, 1280, 720);
          const layer = vis.a;
          let inN = 0, inLit = 0, outN = 0, outLit = 0;
          for (let k = 0; k < pts.length; k++) {
            const inside = inRegion(layer.region, pts[k].x, pts[k].y);
            const lit = Math.max(...cap.pixels[k]) > LIT;
            if (inside) { inN++; if (lit) inLit++; }
            else { outN++; if (lit) outLit++; }
          }
          const inPct = inN ? (100 * inLit / inN) : 0;
          const outPct = outN ? (100 * outLit / outN) : 0;
          const pass = selOk && durOk && ph !== null && Math.abs(ph - 7.0) <= 0.04 &&
            inPct >= 90 && outPct <= 10;
          record(`T ${type} canvas p=0.5`, pass,
            `sel=${selOk} dur=${dur?.value} playhead=${ph?.toFixed(3)} ` +
            `bbox=${cap.bbox.w}×${cap.bbox.h}@(${cap.bbox.x0},${cap.bbox.y0}) ` +
            `chờ frame mới ${newWaited}ms (lit kỳ vọng ${Math.round(expFrac * 100)}%), ổn định MAD=${stability?.toFixed(2)} | trong vùng: ${inLit}/${inN} sáng (${inPct.toFixed(1)}%) | ` +
            `ngoài vùng: ${outLit}/${outN} sáng (${outPct.toFixed(1)}%) | vùng=${layer.region ? layer.region.kind : "FULL"}`);
        }
        // Dọn trạng thái: trả transitionOut clip 2 về none.
        const noneCard = await find("transCard", "none");
        if (noneCard && !noneCard.hidden) {
          await cdp.click(noneCard.pos.x, noneCard.pos.y);
          await sleep(500);
        }
      }
    } finally {
      killChrome();
    }
  } finally {
    killVite();
    try { fs.closeSync(logFd); } catch {}
  }
  finish();
}

main().catch((e) => {
  if (e instanceof AbortRun) { finish(); return; }
  console.error("HARNESS LỖI:", e.message); process.exit(2);
});
