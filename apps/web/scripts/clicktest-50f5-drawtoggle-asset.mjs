#!/usr/bin/env node
/**
 * clicktest-50f5-drawtoggle-asset.mjs — Phase 9 đợt 50, luồng F5:
 * vòng draw/toggle cho clip `asset:` trên UI app thật (nợ E3 §7.6,
 * nợ B1 §6.4 — tới nay chỉ có kiểm tra code Z1 §4 + khóa logic Node,
 * chưa từng click-test thật).
 *
 * Chuỗi UI thật được chứng minh (không qua eval điều khiển controller):
 *   1. Mở file .vcut.json có clip `asset:` qua nút "Mở file dự án"
 *      của ProjectMenu (file input thật qua CDP DOM.setFileInputFiles)
 *      → loadProject → replaceProject → rehydrateMediaItems (IDB thật)
 *      → restoreMediaBin. Kiểm chứng: tên project đổi, bin có asset,
 *      timeline có 1 clip `.tl-clip`.
 *   2. Chuyển toggle GOP (TopBar [data-testid=reverse-webcodecs-toggle])
 *      TẮT → phát ngược: frame vẫn vẽ bằng đường element-seek (canvas
 *      đổi frame, holdStats.draw tăng, playhead lùi, badge ngược ẨN
 *      vì opt-in tắt).
 *   3. Chuyển toggle GOP BẬT → phát ngược: frame vẽ bằng đường
 *      WebCodecs, badge `.preview-reverse-engine-badge` hiện
 *      "◀ NGƯỢC: WEBCODECS" (hoặc ELEMENT-decode-lỗi nếu controller
 *      failed — ghi rõ, không mạo nhận), canvas đổi frame, draw tăng.
 *   4. Toggle decode-ahead (`.preview-decodeahead-toggle`, cổng S3):
 *      bấm đổi data-status/text (running hoặc blocked đều là phản hồi
 *      thật của cổng; bấm lại về off).
 *   5. Không lỗi console/unhandledrejection trong suốt phiên.
 *
 * Thiết lập (không đổi production, chỉ chuẩn bị dữ liệu như E3/E5):
 *  - Fixture `y1-corrupt-gop30-360p-gop90-420s.mp4` (69.861.131 byte,
 *    640x360, GOP 90, GOP hỏng [900,990) ở 30–33 s — vùng đo 100 s
 *    nằm ngoài GOP hỏng). Seed IDB + autosave bằng raw indexedDB /
 *    localStorage trong page (mẫu E5 SEED_FN, không bundle module app).
 *  - Autosave seed là project RỖNG (tên "F5-seed-empty") để lần mount
 *    đầu KHÔNG chạy loadSample (tránh race B1 §6.2 — race đó là việc
 *    của luồng F6 đợt này, không đo lại ở đây) và để việc mở file là
 *    hành động duy nhất đưa clip lên timeline (tên project đổi từ
 *    "F5-seed-empty" → "F5-drawtoggle" là bằng chứng đường mở file
 *    đã chạy, không phải autosave khôi phục sẵn).
 *  - Build app mới (vite build ra scratch ngoài repo) + static server
 *    cùng origin. F5_SKIP_BUILD=1 thì dùng lại dist đã build.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-50f5-drawtoggle-asset.mjs
 * Biến môi trường: F5_DEBUG_PORT (mặc định 9405), F5_HTTP_PORT
 * (mặc định 4235), F5_SCRATCH (mặc định ~/workspace/tmp-round50-f5/drawtoggle),
 * F5_SKIP_BUILD=1 để dùng lại dist đã build, F5_OUT=tên file kết quả
 * (mặc định f5-result.json).
 * Exit 0 khi mọi case PASS, 1 khi có FAIL, 2 khi harness lỗi / INVALID.
 * KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo.
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.F5_SCRATCH || path.join(os.homedir(), "workspace/tmp-round50-f5/drawtoggle");
const FIXTURE = path.join(os.homedir(), "workspace/tmp-round43-y1/y1-corrupt-gop30-360p-gop90-420s.mp4");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.F5_DEBUG_PORT || 9405);
const HTTP_PORT = Number(process.env.F5_HTTP_PORT || 4235);
const ORIGIN = `http://127.0.0.1:${HTTP_PORT}`;
const OUT_FILE = process.env.F5_OUT || "f5-result.json";
const PROJECT_FILE = path.join(SCRATCH, "f5-drawtoggle.vcut.json");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = [];
function casePass(n, d) { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); }
function caseFail(n, d) { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); }

if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
if (!fs.existsSync(FIXTURE)) throw new Error(`không thấy fixture ${FIXTURE}`);
fs.mkdirSync(SCRATCH, { recursive: true });

// ---- 0. Script injection: thu lỗi trang (window.onerror + unhandledrejection) ----
const INJECT = `(() => {
  window.__f5errors = [];
  window.addEventListener("error", (e) => {
    try { window.__f5errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__f5errors.push("window.onerror: <?>"); }
  });
  window.addEventListener("unhandledrejection", (e) => {
    try { window.__f5errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__f5errors.push("unhandledrejection: <?>"); }
  });
})()`;

// ---- 1. Build app mới ra scratch (không đụng apps/web/dist) ----
const distDir = path.join(SCRATCH, "dist");
if (process.env.F5_SKIP_BUILD === "1" && fs.existsSync(path.join(distDir, "index.html"))) {
  log("F5_SKIP_BUILD=1: dùng lại dist đã build");
} else {
  log("vite build → " + distDir);
  const b = spawnSync(path.join(ROOT, "node_modules/.bin/vite"), ["build", "--outDir", distDir],
    { cwd: WEB_DIR, stdio: "pipe", encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (b.status !== 0) throw new Error("vite build lỗi: " + ((b.stderr || b.stdout || "")).slice(-2000));
  if (!fs.existsSync(path.join(distDir, "index.html"))) throw new Error("vite build xong nhưng thiếu dist/index.html");
  log("vite build OK");
}

// ---- 2. Static server cùng origin (dist + fixture) ----
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webm": "video/webm", ".mp4": "video/mp4", ".wasm": "application/wasm" };
const server = createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
    if (urlPath === "/asset-source.mp4") {
      const st = fs.statSync(FIXTURE);
      res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": st.size, "Accept-Ranges": "bytes" });
      fs.createReadStream(FIXTURE).pipe(res);
      return;
    }
    let file = path.join(distDir, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(distDir)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, "index.html");
    const ext = path.extname(file);
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream", "Content-Length": fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
log(`static server lên tại ${ORIGIN}`);

// ---- 3. CDP (websocket) + Xvfb + Chrome headed (mẫu E6) ----
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
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
    return r.result.value;
  }
  async waitFor(fn, label, timeoutMs = 60000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(300); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

// Seed: ingest fixture vào IDB (raw indexedDB, mẫu E5 SEED_FN) + ghi
// autosave project RỖNG để mount sau reload không chạy loadSample.
const SEED_FN = `
(async () => {
  const buf = await (await fetch("/asset-source.mp4")).arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const sha = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const assetId = "a_" + sha.slice(0, 16);
  const blob = new Blob([buf], { type: "video/mp4" });
  await new Promise((resolve, reject) => {
    const req = indexedDB.open("vcut-studio-assets", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("manifests")) {
        const s = db.createObjectStore("manifests", { keyPath: "assetId" });
        s.createIndex("bySha256", "sha256", { unique: true });
      }
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(["manifests", "blobs"], "readwrite");
      tx.objectStore("manifests").put({ assetId, originalName: "y1-corrupt-gop30-360p-gop90-420s.mp4", sha256: sha, size: buf.byteLength, mimeType: "video/mp4", kind: "video", width: 640, height: 360, duration: 420, ingestedAt: new Date().toISOString(), refCount: 1 });
      tx.objectStore("blobs").put(blob, assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
  const spec = { version: "0.2.0", meta: { name: "F5-seed-empty", width: 1280, height: 720, fps: 30 }, tracks: [] };
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "F5-seed-empty", spec, session: { playhead: 0 } };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(env));
  return { assetId, sha, bytes: buf.byteLength };
})()`;

const STATE_EXPR = `(() => {
  const nameInput = document.querySelector('.project-name');
  const bin = document.querySelector('.mediabin');
  const binText = bin ? bin.textContent : '';
  const clips = document.querySelectorAll('.tl-clip');
  const gopBtn = document.querySelector('[data-testid="reverse-webcodecs-toggle"]');
  const daBtn = document.querySelector('.preview-decodeahead-toggle');
  const badge = document.querySelector('.preview-reverse-engine-badge');
  const canvas = document.querySelector('.preview-canvas');
  const idle = window.__vcutPreviewIdle || null;
  const hold = window.__vcutHoldStats || null;
  return {
    name: nameInput ? nameInput.value : null,
    binHasFixture: typeof window.__f5assetId === 'string' && window.__f5assetId.length > 0 && binText.includes('asset:' + window.__f5assetId),
    binText: binText.slice(0, 200),
    clipCount: clips.length,
    clipText: [...clips].map((c) => c.textContent.slice(0, 80)),
    gopPressed: gopBtn ? gopBtn.getAttribute('aria-pressed') : null,
    gopTitle: gopBtn ? gopBtn.getAttribute('title') : null,
    daStatus: daBtn ? daBtn.getAttribute('data-status') : null,
    daText: daBtn ? daBtn.textContent : null,
    badgeVisible: badge ? (badge.style.display !== 'none' && badge.textContent.length > 0) : false,
    badgeText: badge ? badge.textContent : null,
    badgeTitle: badge ? badge.getAttribute('title') : null,
    canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
    idle: idle ? { ticks: idle.ticks, sleeping: idle.sleeping, lastDrawn: idle.lastDrawn, lastRequested: idle.lastRequested } : null,
    hold: hold ? { draw: hold.draw, hold: hold.hold, skip: hold.skip } : null,
    errors: (window.__f5errors || []).slice(),
  };
})()`;

const SAMPLE_CANVAS_FN = `(() => {
  try {
    const c = document.querySelector('.preview-canvas');
    if (!c) return { ok: false, reason: 'không thấy .preview-canvas' };
    const off = document.createElement('canvas');
    off.width = 64; off.height = 36;
    const ctx = off.getContext('2d');
    ctx.drawImage(c, 0, 0, 64, 36);
    const d = ctx.getImageData(0, 0, 64, 36).data;
    let h = 0; let sum = 0; let n = 0;
    for (let i = 0; i < d.length; i += 16) { h = (h * 31 + d[i]) >>> 0; sum += d[i]; n++; }
    const idle = window.__vcutPreviewIdle || {};
    const hold = window.__vcutHoldStats || {};
    return { ok: true, hash: h, mean: +(sum / n).toFixed(1), lastDrawn: idle.lastDrawn ?? null, lastRequested: idle.lastRequested ?? null, draw: hold.draw ?? null };
  } catch (e) { return { ok: false, reason: String(e && e.message ? e.message : e) }; }
})()`;

const SCRUB_FN = (sec) => `(() => {
  const el = document.querySelector(".tl-ruler");
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const x = rect.left + ${Math.round(sec * 60)};
  const y = rect.top + rect.height / 2;
  el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true }));
  el.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true }));
  return { x, rectLeft: rect.left, rectWidth: rect.width, sec: ${sec} };
})()`;

async function clickSelector(cdp, selector, label) {
  const r = await cdp.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(selector)}); if (!b) return { ok: false, reason: 'không tìm thấy ' + ${JSON.stringify(label)} }; b.click(); return { ok: true }; })()`);
  return r;
}

async function sampleReverseWindow(cdp, label, seconds) {
  // Lấy mẫu canvas mỗi 500 ms trong `seconds` giây, trả về danh sách mẫu.
  const samples = [];
  const steps = Math.max(1, Math.round(seconds * 2));
  for (let i = 0; i < steps; i++) {
    samples.push(await cdp.evalJs(SAMPLE_CANVAS_FN));
    await sleep(500);
  }
  return samples;
}

let display = null, xvfbProc = null, chromeProc = null;
let harnessError = null;
function killAll() {
  try { chromeProc?.kill("SIGKILL"); } catch {}
  try { xvfbProc?.kill("SIGKILL"); } catch {}
  try { server.close(); } catch {}
}
process.on("exit", killAll);
try {
  for (const num of [97, 98, 99, 93, 92, 91, 95, 94]) {
    const xv = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xv.exitCode === null) { display = `:${num}`; xvfbProc = xv; break; }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  log(`xvfb: DISPLAY=${display}`);
  const profile = path.join(SCRATCH, "cdprof-f5");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "f5-chrome.log"), "w");
  chromeProc = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${profile}`, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display } });
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try { const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); pageTarget = (pages || []).find((p) => p.type === "page") || null; } catch {}
    if (!pageTarget) await sleep(500);
  }
  if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT });
  log("đã cài injection thu lỗi trang (__f5errors)");

  // Seed IDB + autosave rỗng, rồi reload để app khôi phục project rỗng
  // (không chạy loadSample — tránh race B1 §6.2, việc của luồng F6).
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` });
  await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector('#root') && document.querySelector('#root').children.length > 0`), "React render lần đầu", 60000);
  const seed = await cdp.evalJs(SEED_FN).catch((e) => ({ error: String(e?.message ?? e) }));
  log(`seed: ${JSON.stringify(seed)}`);
  if (seed.error) throw new Error(`seed thất bại: ${seed.error}`);
  // Ghi file .vcut.json từ assetId thật (Node) rồi mới reload.
  const projectEnv = {
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0",
    savedAt: new Date().toISOString(), name: "F5-drawtoggle",
    spec: {
      version: "0.2.0", meta: { name: "F5-drawtoggle", width: 1280, height: 720, fps: 30 },
      tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "c1", src: "asset:" + seed.assetId, start: 0, duration: 420, in: 0, out: 420 }] }],
    },
    session: { playhead: 0 },
  };
  writeFileEpermRetry(PROJECT_FILE, JSON.stringify(projectEnv, null, 2));
  log(`ghi ${PROJECT_FILE} (asset ${seed.assetId}, ${seed.bytes} byte)`);
  await cdp.evalJs(`location.reload()`);
  await sleep(3000);
  await cdp.evalJs(`window.__f5assetId = ${JSON.stringify(seed.assetId)}`);
  await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector('#root') && document.querySelector('#root').children.length > 0`), "React render sau reload", 60000);
  await sleep(2000);

  // D1: app load với project rỗng (bin chưa có asset — baseline).
  let st = await cdp.evalJs(STATE_EXPR);
  log(`D1 state: ${JSON.stringify(st)}`);
  if (st.name === "F5-seed-empty" && !st.binHasFixture && st.clipCount === 0) {
    casePass("D1 app load project rỗng", `tên "F5-seed-empty", bin chưa có asset, 0 clip — baseline sạch trước khi mở file`);
  } else {
    caseFail("D1 app load project rỗng", JSON.stringify(st));
  }

  // D2: mở file .vcut.json qua file input thật của ProjectMenu.
  const doc = await cdp.send("DOM.getDocument", { depth: -1 });
  const inputQ = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: '.project-menu input[accept*="vcut.json"]' });
  if (!inputQ.nodeId) throw new Error("INVALID: không tìm thấy file input mở project (.project-menu input[accept*=vcut.json])");
  await cdp.send("DOM.setFileInputFiles", { files: [PROJECT_FILE], nodeId: inputQ.nodeId });
  log("đã set file vào input mở project");
  let opened = null;
  for (let i = 0; i < 40 && !opened; i++) {
    await sleep(1000);
    const s2 = await cdp.evalJs(STATE_EXPR);
    if (s2.name === "F5-drawtoggle" && s2.binHasFixture && s2.clipCount === 1) opened = s2;
  }
  if (opened) {
    casePass("D2 mở file .vcut.json qua UI", `tên → "F5-drawtoggle", bin có asset y1-corrupt, timeline 1 clip (${JSON.stringify(opened.clipText)}) — đường mở file + rehydrate IDB chạy thật`);
  } else {
    const endSt = await cdp.evalJs(STATE_EXPR);
    caseFail("D2 mở file .vcut.json qua UI", `sau 40 s không thấy project F5-drawtoggle/bin/clip: ${JSON.stringify(endSt)}`);
  }

  // D3: scrub playhead tới 100 s (vùng GOP lành, ngoài GOP hỏng 30–33 s).
  const scrub = await cdp.evalJs(SCRUB_FN(100));
  await sleep(1500);
  st = await cdp.evalJs(STATE_EXPR);
  const ph = st.idle ? st.idle.lastRequested : null;
  log(`D3 scrub: ${JSON.stringify(scrub)} playhead(lastRequested)=${ph} lastDrawn=${st.idle ? st.idle.lastDrawn : null}`);
  if (ph !== null && Math.abs(ph - 100) <= 3) {
    casePass("D3 scrub playhead tới 100 s", `lastRequested=${ph} (≈100, sai số ≤3 s)`);
  } else {
    caseFail("D3 scrub playhead tới 100 s", `lastRequested=${ph} (muốn ≈100): ${JSON.stringify(st.idle)}`);
  }

  // D4: toggle GOP về TẮT (ghi trạng thái ban đầu — mặc định BẬT theo C5).
  st = await cdp.evalJs(STATE_EXPR);
  const gopInitial = st.gopPressed;
  log(`D4 GOP ban đầu aria-pressed=${gopInitial} title=${st.gopTitle}`);
  if (gopInitial === "true") {
    const c = await clickSelector(cdp, '[data-testid="reverse-webcodecs-toggle"]', "toggle GOP");
    if (!c.ok) { caseFail("D4 toggle GOP về TẮT", c.reason); }
    else {
      await sleep(800);
      st = await cdp.evalJs(STATE_EXPR);
      if (st.gopPressed === "false") casePass("D4 toggle GOP về TẮT", `aria-pressed true → false (ban đầu BẬT đúng mặc định C5); title=${st.gopTitle}`);
      else caseFail("D4 toggle GOP về TẮT", `sau click aria-pressed=${st.gopPressed} (muốn false)`);
    }
  } else if (gopInitial === "false") {
    casePass("D4 toggle GOP đã TẮT sẵn", `aria-pressed=false ngay từ đầu (khác mặc định BẬT của C5 — ghi nhận, không ép; tiếp tục đo ở trạng thái TẮT)`);
  } else {
    caseFail("D4 toggle GOP về TẮT", `không đọc được aria-pressed (gopPressed=${gopInitial})`);
  }

  // D5: phát ngược với GOP TẮT (đường element-seek) — frame phải vẽ + lùi.
  const before5 = await cdp.evalJs(STATE_EXPR);
  const c5 = await clickSelector(cdp, '[aria-label="Phát ngược"]', "nút Phát ngược");
  if (!c5.ok) { caseFail("D5 phát ngược GOP TẮT vẽ frame", c5.reason); }
  else {
    // Chờ draw đầu tiên (tối đa 15 s) rồi lấy mẫu canvas 3 s.
    let drew = false;
    for (let i = 0; i < 30 && !drew; i++) {
      const s5 = await cdp.evalJs(STATE_EXPR);
      if (s5.hold && before5.hold && s5.hold.draw > before5.hold.draw) drew = true;
      else await sleep(500);
    }
    const samples5 = await sampleReverseWindow(cdp, "D5", 3);
    const after5 = await cdp.evalJs(STATE_EXPR);
    await clickSelector(cdp, '[aria-label="Phát ngược"]', "nút Phát ngược (dừng)");
    await sleep(800);
    const hashes5 = [...new Set(samples5.filter((x) => x.ok).map((x) => x.hash))];
    const drawn5 = samples5.map((x) => x.lastDrawn).filter((v) => v !== null && v !== undefined);
    const decreasing5 = drawn5.length >= 2 && drawn5[drawn5.length - 1] < drawn5[0];
    log(`D5 samples: ${JSON.stringify(samples5)} hold ${JSON.stringify(before5.hold)} → ${JSON.stringify(after5.hold)} badgeVisible=${after5.badgeVisible} badgeText=${after5.badgeText}`);
    if (drew && hashes5.length >= 2 && decreasing5 && after5.badgeVisible === false) {
      casePass("D5 phát ngược GOP TẮT vẽ frame (element)", `draw ${before5.hold.draw} → ${after5.hold.draw}, ${hashes5.length} hash canvas khác nhau, lastDrawn ${drawn5[0]} → ${drawn5[drawn5.length - 1]} (lùi), badge ngược ẨN (opt-in tắt đúng thiết kế)`);
    } else {
      caseFail("D5 phát ngược GOP TẮT vẽ frame (element)", `drew=${drew} distinctHashes=${hashes5.length} decreasing=${decreasing5} badgeVisible=${after5.badgeVisible} samples=${JSON.stringify(samples5)} hold=${JSON.stringify(before5.hold)}→${JSON.stringify(after5.hold)}`);
    }
  }

  // D6: toggle GOP về BẬT + phát ngược (đường WebCodecs) — badge phải hiện WEBCODECS.
  const c6 = await clickSelector(cdp, '[data-testid="reverse-webcodecs-toggle"]', "toggle GOP");
  if (!c6.ok) { caseFail("D6 phát ngược GOP BẬT vẽ frame (WebCodecs)", c6.reason); }
  else {
    await sleep(800);
    const before6 = await cdp.evalJs(STATE_EXPR);
    if (before6.gopPressed !== "true") {
      caseFail("D6 phát ngược GOP BẬT vẽ frame (WebCodecs)", `sau click aria-pressed=${before6.gopPressed} (muốn true)`);
    } else {
      // Scrub lại 100 s (D5 đã lùi playhead) rồi phát ngược.
      await cdp.evalJs(SCRUB_FN(100));
      await sleep(1200);
      const c6b = await clickSelector(cdp, '[aria-label="Phát ngược"]', "nút Phát ngược");
      if (!c6b.ok) { caseFail("D6 phát ngược GOP BẬT vẽ frame (WebCodecs)", c6b.reason); }
      else {
        let drew = false;
        for (let i = 0; i < 30 && !drew; i++) {
          const s6 = await cdp.evalJs(STATE_EXPR);
          if (s6.hold && before6.hold && s6.hold.draw > before6.hold.draw) drew = true;
          else await sleep(500);
        }
        const samples6 = await sampleReverseWindow(cdp, "D6", 3);
        const after6 = await cdp.evalJs(STATE_EXPR);
        await clickSelector(cdp, '[aria-label="Phát ngược"]', "nút Phát ngược (dừng)");
        await sleep(800);
        const hashes6 = [...new Set(samples6.filter((x) => x.ok).map((x) => x.hash))];
        const drawn6 = samples6.map((x) => x.lastDrawn).filter((v) => v !== null && v !== undefined);
        const decreasing6 = drawn6.length >= 2 && drawn6[drawn6.length - 1] < drawn6[0];
        const badgeOk = after6.badgeVisible === true && typeof after6.badgeText === "string" && after6.badgeText.includes("NGƯỢC: WEBCODECS");
        const badgeFailed = after6.badgeVisible === true && typeof after6.badgeText === "string" && after6.badgeText.includes("decode WebCodecs lỗi");
        log(`D6 samples: ${JSON.stringify(samples6)} hold ${JSON.stringify(before6.hold)} → ${JSON.stringify(after6.hold)} badge=${after6.badgeText}`);
        if (drew && hashes6.length >= 2 && decreasing6 && badgeOk) {
          casePass("D6 phát ngược GOP BẬT vẽ frame (WebCodecs)", `draw ${before6.hold.draw} → ${after6.hold.draw}, ${hashes6.length} hash canvas khác nhau, lastDrawn ${drawn6[0]} → ${drawn6[drawn6.length - 1]} (lùi), badge "${after6.badgeText}"`);
        } else if (drew && hashes6.length >= 2 && decreasing6 && badgeFailed) {
          caseFail("D6 phát ngược GOP BẬT vẽ frame (WebCodecs)", `frame CÓ vẽ (draw tăng, hash đổi, lùi) nhưng badge báo controller failed: "${after6.badgeText}" — đường WebCodecs không chạy, rơi về element (ghi rõ, không mạo nhận WEBCODECS)`);
        } else {
          caseFail("D6 phát ngược GOP BẬT vẽ frame (WebCodecs)", `drew=${drew} distinctHashes=${hashes6.length} decreasing=${decreasing6} badgeVisible=${after6.badgeVisible} badgeText=${after6.badgeText} samples=${JSON.stringify(samples6)}`);
        }
      }
    }
  }

  // D7: toggle decode-ahead (cổng S3) — bấm đổi trạng thái, bấm lại về off.
  const before7 = await cdp.evalJs(STATE_EXPR);
  const c7 = await clickSelector(cdp, ".preview-decodeahead-toggle", "toggle decode-ahead");
  if (!c7.ok) { caseFail("D7 toggle decode-ahead đổi trạng thái", c7.reason); }
  else {
    await sleep(1000);
    const mid7 = await cdp.evalJs(STATE_EXPR);
    const c7b = await clickSelector(cdp, ".preview-decodeahead-toggle", "toggle decode-ahead (lần 2)");
    await sleep(1000);
    const after7 = await cdp.evalJs(STATE_EXPR);
    log(`D7 decode-ahead: off(${before7.daStatus}/${before7.daText}) → (${mid7.daStatus}/${mid7.daText}) → (${after7.daStatus}/${after7.daText})`);
    const changed = mid7.daStatus !== before7.daStatus || mid7.daText !== before7.daText;
    const backOff = after7.daStatus === "off";
    if (changed && backOff) {
      casePass("D7 toggle decode-ahead đổi trạng thái", `off → ${mid7.daStatus} ("${mid7.daText}") → off ("${after7.daText}") — click đảo cờ qua cổng S3 thật`);
    } else {
      caseFail("D7 toggle decode-ahead đổi trạng thái", `off(${before7.daStatus}) → (${mid7.daStatus}) → (${after7.daStatus}); changed=${changed} backOff=${backOff}`);
    }
  }

  // D8: không lỗi console/unhandledrejection trong phiên.
  const endErrs = await cdp.evalJs(`(window.__f5errors || []).slice()`);
  const cdpErrs = cdp.exceptions.slice();
  log(`D8 errors: window=${endErrs.length} CDP=${cdpErrs.length}`);
  for (const t of [...endErrs, ...cdpErrs]) log(`D8 error text: ${String(t).slice(0, 300)}`);
  if (endErrs.length === 0 && cdpErrs.length === 0) {
    casePass("D8 không lỗi trong phiên", "0 window.onerror + 0 unhandledrejection + 0 Runtime.exceptionThrown");
  } else {
    caseFail("D8 không lỗi trong phiên", `window=${JSON.stringify(endErrs)} CDP=${JSON.stringify(cdpErrs)}`);
  }

  // D9: project vẫn là F5-drawtoggle cuối phiên (không bị revert).
  st = await cdp.evalJs(STATE_EXPR);
  if (st.name === "F5-drawtoggle" && st.binHasFixture && st.clipCount === 1) {
    casePass("D9 project ổn định cuối phiên", `tên vẫn "F5-drawtoggle", bin có asset, 1 clip — không revert (loadSample không chạy)`);
  } else {
    caseFail("D9 project ổn định cuối phiên", JSON.stringify(st));
  }
} catch (e) {
  harnessError = e;
  log(`HARNESS LỖI: ${e.message}`);
  if (results.length === 0) { console.log("\n== F5 clicktest: HARNESS ERROR =="); killAll(); process.exit(2); }
  log("(ghi tiếp các case đã chạy, exit 2 vì harness lỗi — không được đọc thành pass đủ)");
}
writeFileEpermRetry(path.join(SCRATCH, OUT_FILE), JSON.stringify({ results, logLines }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n== F5 clicktest: ${results.length - failed.length}/${results.length} pass ==` + (harnessError ? " (HARNESS ERROR — exit 2)" : ""));
killAll();
process.exit(harnessError ? 2 : (failed.length > 0 ? 1 : 0));
