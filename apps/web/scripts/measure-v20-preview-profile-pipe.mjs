#!/usr/bin/env node
/**
 * measure-v19-real-project-fps-pipe.mjs — Phase 9 đợt 19, luồng G4:
 * đo FPS preview editor THẬT (project/timeline thật, không tiêm canvas
 * phủ như vòng vitePreview của đợt 18 — vòng đó đã bị cấm trích vì
 * nhiễu composite).
 *
 * Đối tượng đo: build thật apps/web/dist chạy bằng `vite preview`,
 * project mẫu tự load khi mở app lần đầu (App.tsx: chưa có autosave
 * thì loadSample — 2 clip webm 640x360 tự ghi bằng MediaRecorder,
 * mỗi clip 4s, + 1 clip chữ, meta project 1280x720@30fps, tổng 8s).
 * Đây là project/timeline thật của editor, phát bằng vòng lặp preview
 * thật (preview.tsx: rAF loop + renderFrame khi playing).
 *
 * Cách đo (2 kênh độc lập, đối chiếu nhau):
 * (1) PerfOverlay của chính app (nút "📈 FPS", components/PerfOverlay.tsx):
 *     đồng hồ rAF của app, chốt 1 cửa sổ 1s. Đọc text panel mỗi giây
 *     trong khi phát. Giới hạn đã ghi trong file gốc: đây là rAF của
 *     app, KHÔNG phải probe trực tiếp draw call, KHÔNG tách được
 *     decode video khỏi vẽ canvas — số này được báo kèm giới hạn đó.
 * (2) Probe đếm draw độc lập (không sửa code sản phẩm, chỉ wrap runtime):
 *     renderFrame gọi ctx.setTransform(1,0,0,1,0,0) đúng 2 lần/frame
 *     (đầu + cuối hàm, preview.tsx ~1262 và ~1305) trên ctx của canvas
 *     trong #vcut-preview-wrap. Script wrap setTransform của đúng ctx
 *     đó, đếm số lần identity → draws = identity/2. Đối chứng khi
 *     đứng yên: renderFrame KHÔNG chạy nên draws phải ≈ 0 — nếu
 *     không ≈ 0 thì probe sai và số probe bị hủy, chỉ giữ PerfOverlay.
 * Điều khiển phát bằng đường người dùng thật: click nút FPS (chuột CDP)
 * + phím Space (Input.dispatchKeyEvent, App keydown → togglePlay);
 * nếu Space không phát thì fallback click nút play trên TopBar.
 * Bằng chứng phát thật: đồng hồ playhead trên TopBar tăng + pixel
 * canvas đổi giữa 2 mẫu cách nhau 1s (getImageData vùng 32x32 giữa
 * canvas). Video element của MediaPool là detached nên KHÔNG dùng
 * currentTime làm bằng chứng (xem ghi chú trong STATE_JS).
 *
 * Hạ tầng đo: Xvfb + Chromium headed qua --remote-debugging-pipe
 * (kế thừa hướng đợt 18 — cổng CDP TCP không mở được trên VM này).
 * Mỗi lượt chạy (run) là 1 tiến trình Chrome mới, profile mới.
 * Vite preview dùng chung trong 1 lần gọi script; mỗi run đều đo
 * lại từ đầu (mở panel FPS mới, phát lại từ đầu).
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/measure-v19-real-project-fps-pipe.mjs
 *   V19_FPS_RUNS=3 node apps/web/scripts/measure-v19-real-project-fps-pipe.mjs
 *   V19_FPS_PLAY_SECONDS=16 ... (tổng giây phát mục tiêu mỗi run)
 * Exit 0 khi có ít nhất 1 run đo được FPS lúc phát; exit 2 khi không
 * run nào đo được (khi đó KHÔNG có số FPS — ghi rõ blocker).
 * Ghi rõ tải máy (/proc/loadavg) đầu/cuối mỗi run + phương sai giữa
 * các run; KHÔNG chọn run đẹp nhất để báo. KHÔNG sửa code sản phẩm,
 * KHÔNG ghi gì vào repo ngoài stdout, KHÔNG push.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.V20_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const PREVIEW_PORT = Number(process.env.V20_PREVIEW_PORT || 4181);
const DISPLAYS = (process.env.V20_XVFB_DISPLAYS || ":96,:95").split(",").map((s) => s.trim());
const RUNS = Number(process.env.V20_FPS_RUNS || 1);
const PLAY_TARGET_S = Number(process.env.V20_FPS_PLAY_SECONDS || 16);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; } };

/** Client CDP qua pipe (fd 3 ghi JSON+\0, fd 4 đọc tách \0) — như đợt 18. */
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg;
        try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) {
          this.sessionId = msg.params.sessionId;
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
    proc.stdio[4].on("error", () => { /* đóng pipe khi kill */ });
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout ${method} sau ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId, 120000);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    }
    return r.result.value;
  }
  async mouseClick(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, this.sessionId);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }, this.sessionId);
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }, this.sessionId);
  }
  async pressSpace() {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code: "Space", key: " ", text: " ", windowsVirtualKeyCode: 32 }, this.sessionId);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code: "Space", key: " ", windowsVirtualKeyCode: 32 }, this.sessionId);
  }
}

const PROBE_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  if (!canvas) return { ok: false, why: 'không thấy canvas trong #vcut-preview-wrap' };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ok: false, why: 'không lấy được ctx 2d' };
  if (window.__v19st) return { ok: true, again: true, w: canvas.width, h: canvas.height };
  const orig = ctx.setTransform.bind(ctx);
  const st = { id: 0, total: 0 };
  window.__v19st = st;
  ctx.setTransform = function (a, b, c, d, e, f) {
    st.total++;
    // Ma trận identity là (1,0,0,1,0,0) — d = 1, KHÔNG phải 0.
    if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) st.id++;
    return orig(a, b, c, d, e, f);
  };
  // V20 profiling: đếm + đo thời gian các op canvas trên CHÍNH ctx preview.
  // Chỉ wrap runtime, không sửa code sản phẩm. drawImage timing bao gồm
  // raster đồng bộ của backend CPU (ước lượng, không tách được decode video).
  // Lưu ý: STATE_JS của script cũng gọi getImageData 1 lần/mẫu (~1/s) nên
  // số gid thô phải trừ số mẫu khi báo cáo.
  const v = { draw: 0, drawMs: 0, fill: 0, fillText: 0, gid: 0, filterSets: 0, save: 0, restore: 0 };
  window.__v20 = v;
  const od = ctx.drawImage.bind(ctx);
  ctx.drawImage = function (...args) { const t0 = performance.now(); const r = od(...args); v.draw++; v.drawMs += performance.now() - t0; return r; };
  const of = ctx.fillRect.bind(ctx);
  ctx.fillRect = function (...args) { v.fill++; return of(...args); };
  const ot = ctx.fillText.bind(ctx);
  ctx.fillText = function (...args) { v.fillText++; return ot(...args); };
  const og = ctx.getImageData.bind(ctx);
  ctx.getImageData = function (...args) { v.gid++; return og(...args); };
  const os = ctx.save.bind(ctx);
  ctx.save = function (...args) { v.save++; return os(...args); };
  const orr = ctx.restore.bind(ctx);
  ctx.restore = function (...args) { v.restore++; return orr(...args); };
  try {
    let fv = ctx.filter;
    Object.defineProperty(ctx, 'filter', { configurable: true,
      get() { return fv; }, set(x) { v.filterSets++; fv = x; } });
  } catch (e) { v.filterSets = -1; }
  // Vòng rAF riêng + thống kê gap (độ đói main thread) + longtask.
  if (!window.__v19raf) {
    window.__v19raf = { n: 0, t0: performance.now() };
    const tick = () => { window.__v19raf.n++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  if (!window.__v20raf) {
    const r = { n: 0, gapSum: 0, gapMax: 0, gapOver50: 0, last: 0 };
    window.__v20raf = r;
    const tick = (now) => {
      if (r.last) { const g = now - r.last; r.gapSum += g; if (g > r.gapMax) r.gapMax = g; if (g > 50) r.gapOver50++; }
      r.last = now; r.n++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (!window.__v20lt) {
    const lt = [];
    window.__v20lt = lt;
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) lt.push({ start: Math.round(e.startTime), dur: Math.round(e.duration), name: e.name });
      });
      po.observe({ type: 'longtask', buffered: true });
    } catch (e) { lt.push({ error: String(e).slice(0, 80) }); }
  }
  return { ok: true, w: canvas.width, h: canvas.height,
    clientW: canvas.clientWidth, clientH: canvas.clientHeight, dpr: window.devicePixelRatio };
})()
`;

const PANEL_JS = `
(() => {
  const el = document.querySelector('[aria-label="Đồng hồ đo FPS preview"]');
  return el ? el.innerText : null;
})()
`;

const STATE_JS = `
(() => {
  const canvas = document.querySelector('#vcut-preview-wrap canvas');
  // LƯU Ý: video/audio element của MediaPool là DETACHED (media.ts:
  // document.createElement, không append vào DOM) nên querySelectorAll
  // ('video') luôn rỗng — KHÔNG dùng làm tín hiệu sẵn sàng hay bằng
  // chứng phát. Tín hiệu project dùng input tên project trên TopBar
  // (spec.meta.name) + đồng hồ playhead/tổng thời lượng trên TopBar.
  const nameInput = document.querySelector('.project-name');
  // fmtTime (lib.ts) ra "MM:SS.d" — ví dụ "00:00.0 / 00:08.0".
  const timeMatch = (document.body.innerText.match(/\\d+:\\d+\\.\\d+ \\/ \\d+:\\d+\\.\\d+/) || document.body.innerText.match(/\\d+:\\d+ \\/ \\d+:\\d+/) || [])[0] || null;
  let pxHash = null;
  try {
    if (canvas) {
      // Hash toàn canvas theo stride (vùng giữa 32x32 chứa chữ tĩnh
      // "CLIP MẪU" nên hay lặp hash dù frame vẫn đổi — đã gặp ở
      // bản debug). Stride 16 px vẫn bắt được chuyển động vòng tròn
      // + thanh tiến trình.
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 64) s = (s + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
      pxHash = s;
    }
  } catch (e) { pxHash = 'tainted:' + String(e).slice(0, 40); }
  const wrap = document.getElementById('vcut-preview-wrap');
  return { canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    wrapClientW: wrap ? wrap.clientWidth : null, wrapClientH: wrap ? wrap.clientHeight : null,
    projectName: nameInput ? nameInput.value : null, timeText: timeMatch,
    pxHash, probe: window.__v19st ? { id: window.__v19st.id, total: window.__v19st.total } : null,
    v20: window.__v20 ? { ...window.__v20 } : null,
    v20raf: window.__v20raf ? { ...window.__v20raf } : null,
    v20lt: window.__v20lt ? window.__v20lt.slice() : null,
    pageRaf: window.__v19raf ? { n: window.__v19raf.n, ms: Math.round(performance.now() - window.__v19raf.t0) } : null };
})()
`;

const CAPABILITY_JS = `
(() => {
  const c = document.createElement('canvas');
  return {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    vp9: typeof MediaRecorder !== 'undefined' ? MediaRecorder.isTypeSupported('video/webm;codecs=vp9') : false,
    vp8: typeof MediaRecorder !== 'undefined' ? MediaRecorder.isTypeSupported('video/webm;codecs=vp8') : false,
    captureStream: typeof c.captureStream === 'function',
  };
})()
`;

function gpuProbeJs() {
  return `(() => { try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'renderer-masked';
    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'unknown';
  } catch (e) { return 'error:' + String(e).slice(0, 80); } })()`;
}

function startVitePreview() {
  return new Promise((resolve) => {
    if (!fs.existsSync(path.join(WEB_DIR, "dist", "index.html"))) {
      log("vite preview: không có apps/web/dist/index.html, BLOCKER");
      resolve(null);
      return;
    }
    const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
    const proc = fs.existsSync(viteBin)
      ? spawn(process.execPath, [viteBin, "preview", "--port", String(PREVIEW_PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" })
      : spawn("npx", ["vite", "preview", "--port", String(PREVIEW_PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" });
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(proc); } }, 15000);
    (async () => {
      for (let i = 0; i < 30 && !done; i++) {
        await sleep(500);
        try {
          const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`);
          if (r.ok) { done = true; clearTimeout(timer); resolve(proc); return; }
        } catch { /* chưa lên */ }
      }
    })();
    proc.on("exit", () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

function diffV20(a, b, secs) {
  if (!a.v20 || !b.v20) return null;
  const d = {};
  for (const k of Object.keys(b.v20)) d[k] = +(b.v20[k] - a.v20[k]).toFixed(1);
  d.perSec = {};
  for (const k of Object.keys(d)) if (k !== "perSec") d.perSec[k] = +(d[k] / secs).toFixed(2);
  d.drawMsPerSec = +(d.drawMs / secs).toFixed(1);
  return d;
}
function rafGapMean(a, b) {
  if (!a.v20raf || !b.v20raf) return null;
  const n = b.v20raf.n - a.v20raf.n;
  if (!n) return null;
  return +((b.v20raf.gapSum - a.v20raf.gapSum) / n).toFixed(1);
}
function topProfile(profile, n) {
  const nodes = new Map(profile.nodes.map((x) => [x.id, x]));
  const hits = new Map();
  for (const s of profile.samples) hits.set(s, (hits.get(s) || 0) + 1);
  const total = profile.samples.length || 1;
  const agg = new Map();
  for (const [id, h] of hits) {
    const cf = nodes.get(id)?.callFrame;
    if (!cf) continue;
    const key = `${cf.functionName || "(anon)"}@${(cf.url || "").split("/").pop()}:${cf.lineNumber}:${cf.columnNumber}`;
    agg.set(key, (agg.get(key) || 0) + h);
  }
  return [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([k, h]) => ({ fn: k, pct: +((h / total) * 100).toFixed(1) }));
}
function summarizeProfile(profile, label) {
  const totalUs = (profile.timeDeltas || []).reduce((a, b) => a + b, 0);
  log(`${label}: samples=${profile.samples.length} wallMs=${Math.round(totalUs / 1000)}`);
  for (const t of topProfile(profile, 15)) log(`${label}  self ${t.pct}% ${t.fn}`);
}

async function runOne(label, chromeBin, display, previewUrl) {
  const out = { run: label, ok: false };
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v19fps-"));
  const chrome = spawn(chromeBin, [
    "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
    "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
    "--remote-debugging-pipe", `--user-data-dir=${profile}`,
    "--window-size=1920,1080", "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
  chrome.stderr.on("data", () => { /* dbus/gpu noise của VM, bỏ qua */ });
  try {
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId");
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    out.loadavgStart = loadavg();

    await cdp.send("Page.navigate", { url: previewUrl }, cdp.sessionId);
    let href = "";
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      try { href = await cdp.evaluate("location.href"); } catch { href = ""; }
      if (href.startsWith(previewUrl)) break;
      if (href.startsWith("chrome-error")) break;
    }
    if (!href.startsWith(previewUrl)) throw new Error(`navigate thất bại, href=${href}`);
    log(`${label} href: ${href}`);
    const navAt = Date.now();
    const caps = await cdp.evaluate(CAPABILITY_JS);
    log(`${label} năng lực ghi mẫu: ${JSON.stringify(caps)}`);
    out.capabilities = caps;
    // Đợi React render + project mẫu load. Ghi 2 clip webm mất ~8s
    // (2 x 4s record realtime) nếu MediaRecorder chạy; fallback ảnh
    // tĩnh thì gần như tức thì — thời gian load vì vậy là bằng chứng
    // gián tiếp cho biết mẫu là video hay ảnh (ghi rõ là suy luận,
    // không phải đo trực tiếp kind của media).
    let ready = null;
    for (let i = 0; i < 90; i++) {
      await sleep(1000);
      try {
        const st = await cdp.evaluate(STATE_JS);
        if (st.canvasW && st.projectName === "Dự án mẫu") { ready = st; break; }
        if (i % 10 === 9) log(`${label} chờ sample: ${i + 1}s projectName=${JSON.stringify(st.projectName)} time=${st.timeText} canvas=${st.canvasW}x${st.canvasH}`);
      } catch { /* chưa sẵn sàng */ }
    }
    if (!ready) throw new Error("quá 90s chưa thấy project mẫu sẵn sàng (canvas + tên project 'Dự án mẫu')");
    out.sampleLoadMs = Date.now() - navAt;
    log(`${label} sample sẵn sàng sau ${out.sampleLoadMs}ms: canvas=${ready.canvasW}x${ready.canvasH} time=${ready.timeText} (load >=8000ms ⇒ ghi webm thật; <2000ms ⇒ nghi fallback ảnh tĩnh)`);
    out.canvas = `${ready.canvasW}x${ready.canvasH}`;
    out.wrap = `${ready.wrapClientW}x${ready.wrapClientH}`;
    out.gpu = await cdp.evaluate(gpuProbeJs());

    // Cài probe đếm draw.
    const probe = await cdp.evaluate(PROBE_JS);
    if (!probe.ok) throw new Error(`cài probe thất bại: ${probe.why}`);
    log(`${label} probe OK: canvas=${probe.w} x ${probe.h} client=${probe.clientW}x${probe.clientH} dpr=${probe.dpr}`);
    out.canvas = `${probe.w}x${probe.h}`;
    out.dpr = probe.dpr;

    // Mở panel FPS của app (click chuột thật qua CDP).
    const btnRect = await cdp.evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('FPS'));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!btnRect) throw new Error("không thấy nút 📈 FPS của app");
    await cdp.mouseClick(btnRect.x, btnRect.y);
    await sleep(1500);
    let panel = await cdp.evaluate(PANEL_JS);
    if (!panel) throw new Error("click nút FPS nhưng panel không mở");
    log(`${label} panel FPS đã mở`);

    // Đối chứng đứng yên 5s + CPU profile idle: renderFrame không chạy → draws ≈ 0.
    // Nếu rAF idle vẫn ~11 Hz mà CPU profile idle gần như trống thì thủ phạm
    // nằm ngoài JS (raster/decode/throttle); nếu profile idle nặng thì JS là thủ phạm.
    const idle0 = await cdp.evaluate(STATE_JS);
    let idleProf = null;
    try {
      await cdp.send("Profiler.enable", {}, cdp.sessionId);
      await cdp.send("Profiler.start", {}, cdp.sessionId);
      await sleep(5000);
      idleProf = (await cdp.send("Profiler.stop", {}, cdp.sessionId)).profile;
    } catch (e) { log(`${label} profile-idle lỗi: ${e.message}`); }
    const idle1 = await cdp.evaluate(STATE_JS);
    const idleDraws = idle1.probe ? (idle1.probe.id - idle0.probe.id) / 2 : null;
    const idlePanel = await cdp.evaluate(PANEL_JS);
    log(`${label} ĐỨNG-YÊN 5s: draws=${idleDraws} panel=${JSON.stringify(idlePanel)}`);
    log(`${label} IDLE counters: ${JSON.stringify(diffV20(idle0, idle1, 5))} rafGapMean=${rafGapMean(idle0, idle1)}ms rafGapMax=${idle1.v20raf ? idle1.v20raf.gapMax : null}ms`);
    log(`${label} IDLE longtasks: ${JSON.stringify((idle1.v20lt || []).slice((idle0.v20lt || []).length))}`);
    if (idleProf) summarizeProfile(idleProf, `${label} PROFILE-IDLE`);
    out.idleDraws3s = idleDraws;
    out.idlePanel = idlePanel;
    out.idleCounters = diffV20(idle0, idle1, 5);
    out.idleProfile = idleProf ? topProfile(idleProf, 12) : null;

    // Phát bằng Space (đường người dùng thật); fallback nút play TopBar.
    const isPlaying = async () => {
      const p = await cdp.evaluate(PANEL_JS);
      return !!(p && p.includes("Đang phát"));
    };
    const play0 = await cdp.evaluate(STATE_JS);
    let playProf = null;
    try {
      await cdp.send("Profiler.start", {}, cdp.sessionId);
    } catch (e) { log(`${label} profile-play start lỗi: ${e.message}`); }
    await cdp.pressSpace();
    await sleep(1500);
    if (!(await isPlaying())) {
      log(`${label} Space chưa phát, fallback click nút play TopBar`);
      const playRect = await cdp.evaluate(`(() => {
        const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '').length > 0 && (x.textContent.includes('▶') || x.textContent.includes('⏸')));
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: b.getAttribute('aria-label') };
      })()`);
      if (!playRect) throw new Error("không phát được: Space không tác dụng và không thấy nút play");
      await cdp.mouseClick(playRect.x, playRect.y);
      await sleep(1500);
      if (!(await isPlaying())) throw new Error("không phát được: cả Space lẫn nút play đều không chuyển trạng thái Đang phát");
    }
    log(`${label} ĐANG PHÁT (panel xác nhận)`);

    // Đo trong khi phát: mỗi giây đọc panel + probe; hết 1 lượt phát (8s)
    // thì Space lại để phát tiếp cho đủ PLAY_TARGET_S giây phát.
    const perSecond = [];
    let playSeconds = 0;
    let restarts = 0;
    let prevPx = null;
    let pxChanged = 0;
    let pxSamples = 0;
    let prevTime = null;
    let timeAdvanced = 0;
    const wallStart = Date.now();
    while (playSeconds < PLAY_TARGET_S && Date.now() - wallStart < 60000) {
      await sleep(1000);
      const st = await cdp.evaluate(STATE_JS);
      const panelText = await cdp.evaluate(PANEL_JS);
      const playing = !!(panelText && panelText.includes("Đang phát"));
      const m1 = panelText ? panelText.match(/FPS \(1s gần nhất\): ([0-9.]+)/) : null;
      const mAvg = panelText ? panelText.match(/FPS trung bình: ([0-9.]+)/) : null;
      const mTot = panelText ? panelText.match(/Tổng frame: (\d+) \/ (\d+)s/) : null;
      if (playing) {
        playSeconds++;
        perSecond.push({ s: playSeconds, panelFps1s: m1 ? Number(m1[1]) : null,
          panelAvg: mAvg ? Number(mAvg[1]) : null,
          panelTotalFrames: mTot ? Number(mTot[1]) : null,
          panelTotalS: mTot ? Number(mTot[2]) : null,
          probeId: st.probe ? st.probe.id : null,
          pageRafN: st.pageRaf ? st.pageRaf.n : null });
        if (prevPx !== null && st.pxHash !== prevPx) pxChanged++;
        if (prevPx !== null) pxSamples++;
        prevPx = st.pxHash;
        if (prevTime !== null && st.timeText !== null && st.timeText !== prevTime) timeAdvanced++;
        prevTime = st.timeText;
      } else {
        // Phát hết 1 lượt (8s) → Space lại để phát tiếp (togglePlay
        // phát lại từ đầu khi playhead ở cuối).
        if (playSeconds > 0 && playSeconds < PLAY_TARGET_S && restarts < 4) {
          restarts++;
          log(`${label} phát hết lượt, Space lại lần ${restarts} (đã đo ${playSeconds}s)`);
          await cdp.pressSpace();
          await sleep(1200);
          prevPx = null; prevTime = null;
          continue;
        }
        break;
      }
    }
    try { playProf = (await cdp.send("Profiler.stop", {}, cdp.sessionId)).profile; } catch (e) { log(`${label} profile-play stop lỗi: ${e.message}`); }
    const play1 = await cdp.evaluate(STATE_JS);
    log(`${label} PLAY counters (trừ ${playSeconds}s phát; gid thô trừ ~1/mẫu STATE): ${JSON.stringify(diffV20(play0, play1, Math.max(1, playSeconds)))} rafGapMean=${rafGapMean(play0, play1)}ms`);
    log(`${label} PLAY longtasks mới: ${JSON.stringify((play1.v20lt || []).slice((play0.v20lt || []).length))}`);
    if (playProf) summarizeProfile(playProf, `${label} PROFILE-PLAY`);
    out.playCounters = diffV20(play0, play1, Math.max(1, playSeconds));
    out.playProfile = playProf ? topProfile(playProf, 15) : null;
    out.playLongtasks = (play1.v20lt || []).slice((play0.v20lt || []).length);
    // Tính draws/giây từ probe: lấy mẫu cuối trừ mẫu đầu của cửa sổ phát.
    const first = perSecond[0];
    const last = perSecond[perSecond.length - 1];
    const probeDrawsPerSec = (first && last && first.probeId !== null && last.probeId !== null && perSecond.length > 1)
      ? ((last.probeId - first.probeId) / 2) / (perSecond.length - 1) : null;
    const pageRafHz = (first && last && first.pageRafN !== null && last.pageRafN !== null && perSecond.length > 1)
      ? (last.pageRafN - first.pageRafN) / (perSecond.length - 1) : null;
    const panelFpsVals = perSecond.map((r) => r.panelFps1s).filter((v) => v !== null);
    const mean = panelFpsVals.length ? panelFpsVals.reduce((a, b) => a + b, 0) / panelFpsVals.length : null;
    const sorted = [...panelFpsVals].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
    log(`${label} KẾT QUẢ PHÁT: giây-phát=${playSeconds} restarts=${restarts}`);
    for (const r of perSecond) log(`${label}  s=${r.s} panelFps1s=${r.panelFps1s} panelAvg=${r.panelAvg} total=${r.panelTotalFrames}/${r.panelTotalS}s probeId=${r.probeId}`);
    log(`${label} panelFps1s: mean=${mean !== null ? mean.toFixed(2) : null} median=${median} min=${sorted.length ? sorted[0] : null} max=${sorted.length ? sorted[sorted.length - 1] : null}`);
    log(`${label} probe draws/giây=${probeDrawsPerSec !== null ? probeDrawsPerSec.toFixed(2) : null} (identity-setTransform/2)`);
    log(`${label} vòng-rAF-riêng-của-trang=${pageRafHz !== null ? pageRafHz.toFixed(2) : null} Hz (kênh thứ 3, độc lập PerfOverlay)`);
    log(`${label} bằng-chứng phát thật: pixel-đổi ${pxChanged}/${pxSamples} mẫu, đồng-hồ-TopBar-đổi ${timeAdvanced} lần`);
    out.ok = playSeconds >= 5 && panelFpsVals.length >= 5;
    out.playSeconds = playSeconds;
    out.panelMean = mean !== null ? +mean.toFixed(2) : null;
    out.panelMedian = median;
    out.panelMin = sorted.length ? sorted[0] : null;
    out.panelMax = sorted.length ? sorted[sorted.length - 1] : null;
    out.panelSeries = panelFpsVals;
    out.probeDrawsPerSec = probeDrawsPerSec !== null ? +probeDrawsPerSec.toFixed(2) : null;
    out.pageRafHz = pageRafHz !== null ? +pageRafHz.toFixed(2) : null;
    out.pxChanged = `${pxChanged}/${pxSamples}`;
    out.timeAdvanced = timeAdvanced;
    out.loadavgEnd = loadavg();
    return out;
  } finally {
    try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  }
}

/** Pha baseline: đếm rAF của trang TRẦN (about:blank) trong 5s, cùng
 *  binary/display/tải máy với các run editor ngay sau đó — để tách
 *  "trang editor nặng" khỏi "môi trường/Xvfb/Chrome đói rAF". */
async function runBaseline(chromeBin, display) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "v19base-"));
  const chrome = spawn(chromeBin, [
    "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
    "--hide-scrollbars", "--remote-debugging-pipe", `--user-data-dir=${profile}`,
    "--window-size=1920,1080", "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
  chrome.stderr.on("data", () => {});
  try {
    const cdp = new PipeCdp(chrome);
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("baseline: không nhận được sessionId");
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    const res = await cdp.evaluate(`(async () => {
      let n = 0;
      const t0 = performance.now();
      await new Promise((resolve) => {
        const tick = () => {
          n++;
          if (performance.now() - t0 < 5000) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      return { n, ms: Math.round(performance.now() - t0), hz: +(n / ((performance.now() - t0) / 1000)).toFixed(2) };
    })()`);
    log(`BASELINE trang-trần: ${JSON.stringify(res)} loadavg=${loadavg()}`);
    return res;
  } finally {
    try { chrome.kill("SIGKILL"); } catch {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

async function main() {
  log(`binaries thử: ${BINARIES.join(" | ")} | runs=${RUNS} | play-target=${PLAY_TARGET_S}s | preview-port=${PREVIEW_PORT}`);
  log(`dist mtime: ${(() => { try { return fs.statSync(path.join(WEB_DIR, "dist", "index.html")).mtime.toISOString(); } catch { return "n/a"; } })()}`);
  const preview = await startVitePreview();
  let previewUp = false;
  if (preview) {
    try { const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`); previewUp = r.ok; } catch { previewUp = false; }
  }
  log(`vite preview: ${previewUp ? `lên tại 127.0.0.1:${PREVIEW_PORT}` : "KHÔNG lên — BLOCKER, không đo được"}`);
  if (!previewUp) { try { preview && preview.kill("SIGKILL"); } catch { /* bỏ qua */ } process.exit(2); }
  const previewUrl = `http://127.0.0.1:${PREVIEW_PORT}/`;

  let xvfb = null;
  let display = null;
  let exitCode = 0;
  try {
    for (const d of DISPLAYS) {
      const num = d.replace(":", "");
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) {
        // Socket còn sót sau SIGKILL (Xvfb không dọn): chỉ dọn khi KHÔNG
        // còn tiến trình Xvfb nào sống (đã kiểm tra ps trước khi dọn).
        const anyX = spawnSync("pgrep", ["-x", "Xvfb"]);
        if (anyX.status !== 0) {
          try { fs.unlinkSync(`/tmp/.X11-unix/X${num}`); } catch {}
          try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
          log(`Xvfb: dọn socket mồ côi DISPLAY ${d}`);
        } else { log(`Xvfb: DISPLAY ${d} đã có socket (Xvfb khác đang chạy), thử display khác`); continue; }
      }
      xvfb = spawn("Xvfb", [d, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
      for (let i = 0; i < 40; i++) {
        if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) break;
        await sleep(250);
      }
      if (fs.existsSync(`/tmp/.X11-unix/X${num}`)) { display = d; break; }
      try { xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
      xvfb = null;
    }
    if (!display) throw new Error("không khởi động được Xvfb ở display nào");
    log(`Xvfb lên: DISPLAY=${display}`);

    // Baseline trang trần trước các run editor (cùng display, tải kề nhau).
    for (const bin of BINARIES) {
      if (!fs.existsSync(bin)) continue;
      try { await runBaseline(bin, display); break; }
      catch (e) { log(`BASELINE BLOCKER ${bin}: ${e && e.message ? e.message : e}`); }
    }

    const results = [];
    for (let i = 1; i <= RUNS; i++) {
      let done = false;
      for (const bin of BINARIES) {
        if (!fs.existsSync(bin)) { log(`run${i} BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
        try {
          log(`run${i} bắt đầu: binary=${bin} loadavg=${loadavg()}`);
          const r = await runOne(`run${i}`, bin, display, previewUrl);
          results.push(r);
          done = true;
          break;
        } catch (e) {
          log(`run${i} BLOCKER ${bin}: ${e && e.message ? e.message : e}`);
        }
      }
      if (!done) results.push({ run: `run${i}`, ok: false, error: "mọi binary đều lỗi" });
      log(`run${i} xong: loadavg=${loadavg()}`);
    }
    log(`=== TỔNG HỢP ${results.length} run ===`);
    for (const r of results) log(JSON.stringify(r));
    const okRuns = results.filter((r) => r.ok);
    log(`DONE v19-real-project-fps okRuns=${okRuns.length}/${results.length}`);
    if (!okRuns.length) exitCode = 2;
  } finally {
    // process.exit() trong try sẽ bỏ qua finally nên KHÔNG exit ở đây:
    // exit sau finally để vite/Xvfb không bị mồ côi giữ cổng/display.
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { preview && preview.kill("SIGKILL"); } catch { /* bỏ qua */ }
  }
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
  process.exit(2);
});
