// settle-headed-46b1.mjs — Phase 9 đợt 46, luồng B1: đo headed cho nợ mở
// của đợt 45 A1 (docs/PHASE9_ROUND45_A1_SETTLE_LIMITS.md §6 + đợt 45 §4.2):
//   (1) W2 ở mốc 32,4667 s (targetPos 974) với mirror đầy đủ decodeFrom/
//       decodeTo/key/decoded + lastWindowKey + cacheSize, để phân xử
//       giả thuyết "tràn GOP lành" của Z1: mirror A1 (stss) dự đoán
//       decode [900,974] nằm trọn GOP hỏng; ffprobe-flags dự đoán
//       decodeFrom lùi về 810 (IDR zero mất cờ keyframe) → cửa sổ
//       [810,974] vắt qua GOP lành. Số đo thật từ controller thắng.
//   (2) SUCCESS trên đường asset: vẫn mở hay bắt được (tiêu chí Y1).
//   (3) Tab ẩn 300 s thật (dwell 300.000 ms, poll visibility mỗi 5 s).
// KHÁC Z1: W2 = 32,4667 s (không phải 32,7 s); entry phơi lastWindowKey
// + lastDecodeRange thật của controller (trường private của TS nhưng
// esbuild strip type nên runtime đọc được qua bracket access — chỉ
// harness đọc, KHÔNG sửa production); vòng aim sửa lỗi thứ tự của Z1
// (kiểm tra cache >= target TRƯỚC inFlight < 1); decoded của W2 được
// suy từ cache sau evict (chỉ khi ok=true + range mới) và ghi rõ là
// proxy, không phải trường decoded trực tiếp (controller không phơi
// decoded — xem LIMITS B1 §2). Exit 0 = đo xong có ≥1 quan sát W2
// ultra-tight (kể cả khi SUCCESS vẫn mở); exit 1 = harness lỗi hoặc
// không có quan sát W2 nào. KHÔNG push, KHÔNG sửa production.
//   (A) nhánh thử lại riêng trên đường asset: — giữ aim siêu chặt Z1:
//       aim SIÊU CHẶT (tắt khi cache tới setupCache + prefetchFrames
//       − 3, KHÔNG ngắt sớm do stall-25ms như Y1) + probe asset:
//       TRƯỚC race (manifest size == blob size, restored 1, failed 0,
//       setup ok). Biến duy nhất đổi so với Y1 ở pha asset là aim,
//       nên bắt được / vẫn PARTIAL đều quy được về aim. KHÔNG dùng
//       delay server cho pha asset (blob: nội bộ, không qua server;
//       delayMs = 0) — khác pha GOP của Y1.
//   (B) tab ẩn KÉO DÀI: dwell 60 s trong lúc tab vẫn ẩn (poll
//       visibility mỗi 5 s, phải luôn hidden) rồi mới chạy race
//       trong lúc ẩn; timer probe 100 ms khởi động SAU dwell (đo
//       throttle sau thời gian ẩn dài, không phải timer từ lúc mới
//       ẩn như Y1). Đường chạy là GOP Range (đường đã SUCCESS ở Y1)
//       để biến duy nhất là thời gian ẩn.
//
// Harness KHÔNG lái UI app đầy đủ mà bundle đúng module lib của app
// (ReversePreviewController + AssetStore + rehydrate, cùng code
// preview dùng) vào một page nhỏ, lái bằng CDP — Chromium headed
// thật (không --headless, dưới Xvfb) + VideoDecoder thật + IndexedDB
// thật + HTTP Range thật. Những gì KHÔNG được claim ghi rõ trong
// LIMITS Z1: không lái nút toggle/badge của preview.tsx, không qua
// bridge Express thật, không click mở .vcut.json qua ProjectMenu.
//
// Cách chạy (từ gốc repo; script TỰ lo Xvfb + Chrome headed + server):
//   node apps/web/scripts/settle-headed-46b1.mjs
// Biến môi trường: B1_DEBUG_PORT (mặc định 9386), B1_HTTP_PORT
// (mặc định 8938), B1_FIX (mặc định fixture Y1 y1-corrupt-gop30),
// B1_CHROME (mặc định ms-playwright chromium-1248), B1_SCRATCH
// (mặc định ~/workspace/tmp-round46-b1). Thời gian: pha asset tối đa
// 4 attempt + pha hidden 1 attempt với dwell 300 s thật (~6-9 phút).
// Fixture tái dùng của Y1: 360p GOP 90, 420 s, 69.861.131 byte, bản
// hỏng zero đúng packet IDR của GOP [30,33) (pos 5378169).
// Pha asset chạy tới khi thu đủ 2 quan sát W2 ultra-tight (tối đa 4
// attempt); pha hidden 1 attempt với dwell 300 s thật. Exit 0 khi đo
// xong có ≥1 quan sát W2 ultra-tight (SUCCESS có hay không đều ghi
// rõ trong LIMITS, không ép exit theo SUCCESS). Số đo in ra + ghi
// JSON vào scratch (không vào repo).
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.B1_SCRATCH || path.join(os.homedir(), "workspace/tmp-round46-b1");
const FIX = process.env.B1_FIX || path.join(os.homedir(), "workspace/tmp-round43-y1/y1-corrupt-gop30-360p-gop90-420s.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.B1_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.B1_DEBUG_PORT || 9386);
const HTTP_PORT = Number(process.env.B1_HTTP_PORT || 8938);
const SETUP_T = 417.0;     // cửa sổ setup: GOP lành cuối [417,420)
const PREFETCH_T = 412.0;  // cửa sổ mới để khởi động prefetch
const GATE_RETRY_T = [407.0, 402.0]; // cửa sổ thử cổng thêm (mỗi lần đo lại fps)
const CORRUPT_T = 974 / 30; // 32,4667 s: targetPos 974, mirror A1 [900,974] trọn GOP hỏng [30,33)
const CORRUPT_GOP_T0 = 30.0; // GOP hỏng nằm ĐẦU file (index 10): T3 fetch mọi GOP
const CORRUPT_GOP_T1 = 33.0; // lúc setup rồi cache 32 MiB evict nó chắc chắn,
// nên W2 phải fetch bù lại GOP này (điểm móc delay) thay vì trúng cache.
const W2_DELAY_MS = 800;   // delay server chỉ cho range GOP hỏng trong lúc W2
const MAX_ATTEMPTS = 4;

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function loadavg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; }
}
fs.mkdirSync(SCRATCH, { recursive: true });
if (!fs.existsSync(FIX)) throw new Error(`không thấy fixture ${FIX}`);
if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
const fileBuf = fs.readFileSync(FIX);
const fileSize = fileBuf.length;
console.log(`fixture: ${FIX} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB (ngưỡng GOP 32 MiB, trần S4 128 MiB)`);

// ---- 1. Bundle entry (reverseWebcodecs + assetStore + rehydrate) ----
const entryPath = path.join(SCRATCH, "b1-entry.mjs");
fs.writeFileSync(entryPath, `import {
  getReversePreviewController, reverseDecodeAheadStatus,
  setReverseDecodeAheadWanted, disposeReverseWebcodecsControllers,
} from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"))};
import { AssetStore } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/assetStore.ts"))};
import { mirrorDecodeWindow, classifyW2 } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/settle45A1.ts"))};
import { classifyFailedW2 } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/settle46B1.ts"))};
import { rehydrateMediaItems } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/rehydrate36S5.ts"))};
let ctrl = null;
let assetInfo = null;
const Y = {};
Y.status = () => {
  const s = reverseDecodeAheadStatus();
  return { ...s, ctrl: ctrl ? { gopMode: ctrl.gopMode, fallback: ctrl.gopFallbackReason, failed: ctrl.failed, cacheSize: ctrl.cacheSize, probe: ctrl.gopSizeProbe } : null };
};
Y.disposeAll = () => { try { ctrl?.dispose(); } catch {} ctrl = null; disposeReverseWebcodecsControllers(); return true; };
Y.gopNew = async () => {
  Y.disposeAll();
  // Dùng đúng registry mà preview dùng (getReversePreviewController):
  // bản harness đầu dùng new trực tiếp nên controller không vào
  // registry, status/gate đọc registry rỗng và luôn báo not-measured.
  ctrl = getReversePreviewController("/gop.mp4", undefined, { gopRangeEnabled: true });
  const ok = await ctrl.ensureWindowForTime(${SETUP_T});
  const m = ctrl.lastSoftwareDecodeMeasurement;
  return { ok, gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe, probeReason: ctrl.gopSizeProbeReason, fallback: ctrl.gopFallbackReason, failed: ctrl.failed, cacheSize: ctrl.cacheSize, measurementFps: m ? m.decodeFps : null, resolution: m ? m.resolution : null };
};
Y.blobNew = async () => {
  if (!assetInfo) throw new Error("chưa assetSetup");
  Y.disposeAll();
  ctrl = getReversePreviewController(assetInfo.blobUrl, assetInfo.size, { gopRangeEnabled: true });
  const ok = await ctrl.ensureWindowForTime(${SETUP_T});
  const m = ctrl.lastSoftwareDecodeMeasurement;
  return { ok, gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe, fallback: ctrl.gopFallbackReason, failed: ctrl.failed, cacheSize: ctrl.cacheSize, measurementFps: m ? m.decodeFps : null };
};
Y.wantedOn = () => { const d = setReverseDecodeAheadWanted(true); return d ? { verdict: d.verdict, reasons: d.reasons } : null; };
Y.wantedOff = () => { setReverseDecodeAheadWanted(false); return true; };
Y.windowSync = async (t) => { const ok = await ctrl.ensureWindowForTime(t); return { ok, failed: ctrl.failed }; };
Y.windowAsync = (t) => { const s = performance.now(); Y._w2 = null; void ctrl.ensureWindowForTime(t).then((ok) => { Y._w2 = { durMs: performance.now() - s, ok, failed: ctrl.failed }; }); return "started"; };
Y.w2timing = () => Y._w2;
Y.w2snap = () => {
  // Đọc trường private của controller qua bracket access (esbuild đã
  // strip type nên runtime đây là property thường; harness-only).
  const lk = ctrl ? ctrl["lastWindowKey"] ?? null : null;
  const lr = ctrl ? ctrl["lastDecodeRange"] ?? null : null;
  return { lastWindowKey: lk, lastDecodeRange: lr ? { from: lr.from, to: lr.to } : null, cacheSize: ctrl ? ctrl.cacheSize : null, cacheFrameCount: ctrl ? ctrl.cacheFrameCount : null, failed: ctrl ? ctrl.failed : null };
};
Y.w2classifyReal = (from, to, decoded, ok, cacheBefore, lastKeyBefore) => {
  const w = { targetPos: 974, presentFrom: 900, presentTo: 974, decodeFrom: from, decodeTo: to, key: from + "-" + to, windowFrames: to - from + 1, presentFrames: 75, gopAligned: true };
  return classifyW2({ window: w, decoded, ok, cacheSizeBefore: cacheBefore, lastWindowKey: lastKeyBefore, corrupt: { startFrame: 900, endFrameExclusive: 990 } });
};
Y.w2classifyFail = () => classifyFailedW2();
Y.w2classifyMirror = (decoded, ok, cacheBefore, lastKeyBefore) => {
  const w = mirrorDecodeWindow({ targetTimeSec: ${974 / 30}, fps: 30, effectiveWindow: 75, gopFrames: 90 });
  return { window: w, result: classifyW2({ window: w, decoded, ok, cacheSizeBefore: cacheBefore, lastWindowKey: lastKeyBefore, corrupt: { startFrame: 900, endFrameExclusive: 990 } }) };
};
Y.w2drawn = () => { const idxs = []; ctrl.presentCachedReverse((f, i) => { idxs.push(i); }); idxs.sort((a, b) => a - b); return { count: idxs.length, min: idxs[0] ?? null, max: idxs[idxs.length - 1] ?? null }; };
Y.assetSetup = async () => {
  const resp = await fetch("/asset-source.mp4");
  const blob = await resp.blob();
  const store = new AssetStore();
  const manifest = await store.ingest(blob, { name: "z1-corrupt-gop30-360p-gop90-420s.mp4", width: 640, height: 360, duration: 420 });
  const res = await rehydrateMediaItems(
    { listManifests: () => store.list(), loadBlob: (id) => store.getBlob(id), makeObjectURL: (b) => URL.createObjectURL(b) },
    { tracks: [{ clips: [{ kind: "video", src: "asset:" + manifest.assetId }] }] },
  );
  assetInfo = { assetId: manifest.assetId, blobUrl: res.items.length ? res.items[0].url : null, size: blob.size, manifestSize: manifest.size };
  return { ...assetInfo, restoredSrcs: res.restoredSrcs, failedSrcs: res.failedSrcs, skipped: res.skipped };
};
Y.timerProbeStart = () => {
  Y._t0 = performance.now(); Y._timerActual = null; Y._rafFired = false; Y._rafElapsed = null;
  setTimeout(() => { Y._timerActual = performance.now() - Y._t0; }, 100);
  requestAnimationFrame(() => { Y._rafFired = true; Y._rafElapsed = performance.now() - Y._t0; });
  return "started";
};
Y.timerProbeRead = () => ({ timerActualMs: Y._timerActual, rafFired: Y._rafFired, rafElapsedMs: Y._rafElapsed, elapsedMs: Y._t0 ? performance.now() - Y._t0 : null, visibility: document.visibilityState });
Y.visibility = () => document.visibilityState;
window.__b1 = Y;
`);
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "b1-bundle.mjs");
const b = spawnSync(esbuild, [entryPath, "--bundle", "--platform=browser", "--format=esm", `--outfile=${bundleOut}`], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) throw new Error("esbuild bundle lỗi: " + ((b.stderr || b.stdout || "")).slice(0, 500));
console.log(`bundle: ${bundleOut} (${fs.statSync(bundleOut).size} byte)`);

// ---- 2. Server HTTP: page + bundle + fixture (Range thật, log request) ----
const reqLog = { gop: [], asset: [] };
// Byte-range của GOP hỏng (tính từ ffprobe packets video trong
// [CORRUPT_GOP_T0, CORRUPT_GOP_T1)): W2 fetch bù đúng range này.
let corruptRangeStart = -1;
{
  const fp = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "packet=pts_time,pos,size", "-of", "json", FIX],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  try {
    const pk = JSON.parse(fp.stdout).packets.filter((p) =>
      Number(p.pts_time) >= CORRUPT_GOP_T0 && Number(p.pts_time) < CORRUPT_GOP_T1);
    corruptRangeStart = Math.min(...pk.map((p) => Number(p.pos)));
    console.log(`GOP hỏng [${CORRUPT_GOP_T0},${CORRUPT_GOP_T1}): rangeStart=${corruptRangeStart} packets=${pk.length}`);
  } catch { console.log("cảnh báo: không tính được range GOP hỏng từ ffprobe (delay W2 sẽ không kích hoạt)"); }
}
// Cờ delay do Node bật/tắt quanh W2 (chỉ áp cho request Range đúng
// rangeStart GOP hỏng, sai số cho phép 4 KiB do quy ước offset).
let delayMs = 0;
async function serveRange(req, res, key) {
  const range = req.headers.range;
  if (req.method === "HEAD") {
    res.writeHead(200, { "Content-Length": fileSize, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
    reqLog[key].push({ method: "HEAD", range: null, status: 200, bytes: 0 });
    res.end();
    return;
  }
  if (!range) {
    reqLog[key].push({ method: "GET", range: null, status: 200, bytes: fileSize });
    res.writeHead(200, { "Content-Length": fileSize, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
    res.end(fileBuf);
    return;
  }
  const m = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!m) { reqLog[key].push({ method: "GET", range, status: 416, bytes: 0 }); res.writeHead(416); res.end(); return; }
  const start = Number(m[1]);
  const end = m[2] === "" ? fileSize - 1 : Math.min(Number(m[2]), fileSize - 1);
  // Delay có chọn lọc cho W2: chỉ request Range bắt đầu đúng (sai số
  // 4 KiB) tại rangeStart GOP hỏng mới bị giữ lại delayMs; mọi range
  // khác (prefetch, T3 lúc setup) đi ngay không delay.
  let delayed = 0;
  if (delayMs > 0 && corruptRangeStart >= 0 && Math.abs(start - corruptRangeStart) <= 4096) {
    delayed = delayMs;
    await sleep(delayMs);
  }
  const chunk = fileBuf.subarray(start, end + 1);
  reqLog[key].push({ method: "GET", range, status: 206, bytes: chunk.length, delayedMs: delayed });
  res.writeHead(206, { "Content-Range": `bytes ${start}-${end}/${fileSize}`, "Content-Length": chunk.length, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
  res.end(chunk);
}
const pageHtml = `<!doctype html><meta charset="utf-8"><title>B1 settle headed</title>
<body><div id="ready">loading</div><script type="module">
import "./b1-bundle.mjs";
document.getElementById("ready").textContent = "ready";
</script></body>`;
const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/page.html") { res.writeHead(200, { "Content-Type": "text/html" }); res.end(pageHtml); }
  else if (req.url === "/b1-bundle.mjs") { res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); }
  else if (req.url === "/gop.mp4") serveRange(req, res, "gop");
  else if (req.url === "/asset-source.mp4") serveRange(req, res, "asset");
  else { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
console.log(`server: http://127.0.0.1:${HTTP_PORT}/ (fixture 2 path, Range thật)`);

// ---- 3. CDP helpers (mẫu X1/X4) ----
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
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
  async waitFor(fn, label, timeoutMs = 90000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn(); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

let chromeProc = null, xvfbProc = null, cdpGlobal = null, browserCdp = null;
function killAll() {
  try { cdpGlobal?.ws?.close(); } catch {}
  try { browserCdp?.ws?.close(); } catch {}
  try { chromeProc?.kill("SIGKILL"); } catch {}
  try { xvfbProc?.kill("SIGKILL"); } catch {}
  try { server.close(); } catch {}
}

// ---- 4. Race driver dùng chung cho 3 pha ----
async function attemptRace(cdp, newFn, opts = {}) {
  const log = [];
  const setup = await newFn();
  log.push(`setup: ok=${setup.ok} gopMode=${setup.gopMode} probe=${JSON.stringify(setup.probe)} fallback=${setup.fallback} fps=${setup.measurementFps} cache=${setup.cacheSize}`);
  const setupSnap = await cdp.evalJs(`window.__b1.w2snap()`).catch(() => null);
  log.push(`setupSnap: lastWindowKey=${setupSnap?.lastWindowKey} lastDecodeRange=${JSON.stringify(setupSnap?.lastDecodeRange)}`);
  if (!setup.ok) return { cls: "INVALID-setup", log, setup };
  let dec = await cdp.evalJs(`window.__b1.wantedOn()`);
  let st = await cdp.evalJs(`window.__b1.status()`);
  log.push(`gate lần 1: verdict=${dec?.verdict} reasons=${JSON.stringify(dec?.reasons)} active=${st.active} ui=${st.uiStatus} fps=${st.measurementFps}`);
  // Pha tab ẩn: ẩn TRƯỚC khi khởi động prefetch (độ trễ của
  // activate không được ăn mất prefetch). Timer probe chạy từ lúc
  // ẩn để đo throttle thật lúc ẩn. Đặt ở đây (sau cổng, trước
  // prefetch) — bản trước đặt sau khi bắt prefetch nên prefetch
  // settle mất trong lúc chờ activate (lỗi thứ tự của harness).
  let hiddenNow = false;
  if (opts.hideFirst) {
    await opts.hideFirst();
    hiddenNow = true;
    let vis = await cdp.evalJs(`window.__b1.visibility()`);
    for (let i = 0; i < 10 && vis !== "hidden"; i++) { await sleep(500); vis = await cdp.evalJs(`window.__b1.visibility()`); }
    log.push(`tab ẩn: visibility=${vis}`);
    if (vis !== "hidden") { await opts.unhide(); return { cls: "INVALID-not-hidden", log, setup }; }
    // Z1 dwell dài: giữ tab ẩn dwellMs rồi mới đo — poll visibility
    // mỗi 5 s, bất kỳ lần nào không hidden thì attempt INVALID
    // (chứng minh race chạy suốt trong lúc ẩn, không phải ẩn thoáng).
    // Timer probe khởi động SAU dwell (đo throttle sau thời gian ẩn
    // dài); bản Y1 khởi động timer ngay lúc mới ẩn.
    if (opts.dwellMs) {
      const dwellPolls = [];
      const dwell0 = Date.now();
      while (Date.now() - dwell0 < opts.dwellMs) {
        await sleep(5000);
        const v = await cdp.evalJs(`window.__b1.visibility()`);
        dwellPolls.push(v);
        if (v !== "hidden") { await opts.unhide(); return { cls: "INVALID-unhidden-during-dwell", log, setup, dwellPolls }; }
      }
      log.push(`tab ẩn dwell: ${opts.dwellMs} ms, polls=${dwellPolls.length} đều hidden`);
    }
    await cdp.evalJs(`window.__b1.timerProbeStart()`);
  }
  let prefetchAlreadyStarted = false;
  if (!st.active) {
    // Cổng tự thử lại sau mỗi cửa sổ decode mới (wanted đã đặt, số đo
    // mới mỗi lần — không bypass cổng bằng số đo bịa). Nếu cổng mở
    // nhờ một lần decode trong vòng này thì prefetch của chính cửa sổ
    // đó đã khởi động trong cùng lần decode (aheadRange tính sau
    // auto-apply), nên KHÔNG decode lại cùng mốc (sẽ trúng đường
    // nhanh cache, không sinh prefetch mới).
    for (const gt of [PREFETCH_T, ...GATE_RETRY_T]) {
      const w2 = await cdp.evalJs(`window.__b1.windowSync(${gt})`);
      st = await cdp.evalJs(`window.__b1.status()`);
      log.push(`gate thử lại (cửa sổ ${gt}): windowOk=${w2.ok} active=${st.active} ui=${st.uiStatus} fps=${st.measurementFps} reasons=${JSON.stringify(st.reasons)}`);
      if (st.active) { prefetchAlreadyStarted = true; break; }
    }
    if (!st.active) return { cls: "INVALID-gate-blocked", log, setup, gate: dec };
  }
  // Khởi động prefetch bằng 1 cửa sổ mới (khác cửa sổ setup) — trừ
  // nhánh gate-2 ở trên (prefetch đã chạy từ lần decode đó).
  if (!prefetchAlreadyStarted) await cdp.evalJs(`window.__b1.windowAsync(${PREFETCH_T})`);
  let pre = null;
  const poll0 = Date.now();
  while (Date.now() - poll0 < 90000) {
    const m = await cdp.evalJs(`window.__b1.status()`);
    if ((m?.inFlightPrefetchWindows ?? 0) >= 1) { pre = m; break; }
    await sleep(5);
  }
  if (!pre) return { cls: "INVALID-no-prefetch-inflight", log, setup };
  log.push(`prefetch bay: inFlight=${pre.inFlightPrefetchWindows} cache=${pre.cacheFrames} prefetchFrames=${pre.prefetchFrames} settled=${pre.settledPrefetchDroppedFrames}`);
  // B1 cổng chống coalescing (bài học từ 2 attempt ultra-tight đầu:
  // poll inFlight>=1 nhìn nhầm prefetch của cửa sổ setup nên thoát
  // ngay khi decode cửa sổ 412 s vẫn đang bay; W2 sau đó coalesce
  // vào decode 412 s đó và đo nhầm cửa sổ 412 s thành cửa sổ hỏng).
  // Chờ tới khi decode cửa sổ prefetch HOÀN TẤT thật: lastWindowKey
  // đổi khỏi key setup VÀ không còn decode cửa sổ nào bay. Quá 30 s
  // thì attempt INVALID (không chạy W2 để khỏi đo nhầm lần nữa).
  {
    const wait0 = Date.now();
    let done412 = false;
    while (Date.now() - wait0 < 30000) {
      const snap412 = await cdp.evalJs(`window.__b1.w2snap()`).catch(() => null);
      const st412 = await cdp.evalJs(`window.__b1.status()`).catch(() => null);
      if (snap412 && snap412.lastWindowKey !== setupSnap?.lastWindowKey && !st412?.decodeWindowInFlight) { done412 = true; log.push(`cổng 412: decode cửa sổ prefetch xong, lastWindowKey=${snap412.lastWindowKey} (setup key=${setupSnap?.lastWindowKey})`); break; }
      await sleep(20);
    }
    if (!done412) { if (hiddenNow) await opts.unhide(); return { cls: "INVALID-prefetch-window-not-done", log, setup, aim: "not-started" }; }
  }
  // Z1 aim siêu chặt (chỉ pha asset): tắt khi cache tới
  // setupCache + prefetchFrames − 3 (tối đa 3 frame còn lại) và
  // KHÔNG ngắt sớm do stall — stall-break của Y1 (25 ms) là chỗ rò
  // lớn nhất: decoder output theo burst nên cache đứng yên 25 ms
  // không có nghĩa là sắp settle, và aim chặt Y1 (−20) chừa tới 20
  // frame còn lại, không kịp settle trong W2 blob 232–304 ms.
  // Timeout aim nới tới 15 s (prefetch 360p có thể chậm dưới tải).
  // Pha hidden giữ aim Y1 (cache-near-full −20 + stall-25ms) để
  // biến duy nhất của pha đó là thời gian ẩn, không phải aim.
  let aim = "timeout-15s";
  let aimTarget = null;
  {
    const aim0 = Date.now();
    const firstCache = pre.cacheFrames ?? -1;
    const target = opts.aimUltra
      ? (setup.cacheSize ?? 0) + Math.max(0, (pre.prefetchFrames ?? 0) - 3)
      : (setup.cacheSize ?? 0) + Math.max(0, (pre.prefetchFrames ?? 0) - 20);
    aimTarget = target;
    let lastCache = firstCache;
    let lastGrowAt = Date.now();
    while (Date.now() - aim0 < 15000) {
      const m = await cdp.evalJs(`window.__b1.status()`);
      const c = m.cacheFrames ?? -1;
      if (c > lastCache) { lastCache = c; lastGrowAt = Date.now(); }
      // B1 sửa lỗi thứ tự của Z1: kiểm tra cache >= target TRƯỚC
      // inFlight < 1, để mẫu mà prefetch settle đúng lúc cache vừa
      // chạm target vẫn được tính là đạt aim, không bị ghi nhầm
      // settled-during-aim.
      if (c >= target) { aim = opts.aimUltra ? "cache-ultra-tight" : "cache-near-full"; break; }
      if ((m?.inFlightPrefetchWindows ?? 0) < 1) { aim = "settled-during-aim"; break; }
      if (!opts.aimUltra && Date.now() - lastGrowAt >= 25) { aim = "cache-stall-25ms"; break; }
      await sleep(5);
    }
    log.push(`aim: ${aim} (cache lúc bắt prefetch=${firstCache}, target~${target}, còn lại tối đa lúc tắt=${opts.aimUltra ? 3 : 20} frame)`);
  }
  // Tắt NGAY + khởi động W2 hỏng NGAY (2 eval liên tiếp). Bật delay
  // server cho range GOP hỏng TRƯỚC khi W2 fetch bù (GOP [30,33) đầu
  // file chắc chắn đã bị evict khỏi cache GOP nên W2 phải fetch lại
  // và bị giữ 800 ms — cửa sổ hoãn mở ra xác định).
  const preToggle = await cdp.evalJs(`window.__b1.status()`);
  if ((preToggle?.inFlightPrefetchWindows ?? 0) < 1) { if (hiddenNow) await opts.unhide(); return { cls: "INVALID-settled-before-toggle", log, setup, aim }; }
  // B1 mirror W2: snapshot TRƯỚC W2 (lastWindowKey + lastDecodeRange +
  // cacheSize thật từ controller) để phân biệt fast-path / decode mới.
  const preW2 = await cdp.evalJs(`window.__b1.w2snap()`).catch(() => null);
  const preW2Status = await cdp.evalJs(`window.__b1.status()`).catch(() => null);
  log.push(`preW2 mirror: lastWindowKey=${preW2?.lastWindowKey} lastDecodeRange=${JSON.stringify(preW2?.lastDecodeRange)} cacheSize=${preW2?.cacheSize} failed=${preW2?.failed} decodeWindowInFlight=${preW2Status?.decodeWindowInFlight}`);
  if (preW2Status?.decodeWindowInFlight) { if (hiddenNow) await opts.unhide(); return { cls: "INVALID-decode-in-flight-at-w2", log, setup, aim }; }
  // Ghi số frame còn lại thật lúc tắt (bằng chứng aim có siêu chặt
  // thật không, không chỉ target lý thuyết).
  log.push(`preToggle: cache=${preToggle?.cacheFrames} target~${aimTarget} còn lại~${aimTarget !== null ? Math.max(0, aimTarget - (preToggle?.cacheFrames ?? 0)) : "?"} frame (tính theo target; cache có thể vượt target do burst)`);
  // Delay server CHỈ cho pha GOP/hidden (useDelay): pha asset chạy
  // trên blob: nội bộ nên delayMs phải = 0 — đặt 800 ở đây sẽ là
  // mạo nhận vì không có request server nào cho blob.
  delayMs = opts.useDelay ? W2_DELAY_MS : 0;
  await cdp.evalJs(`window.__b1.wantedOff()`);
  await cdp.evalJs(`window.__b1.windowAsync(${CORRUPT_T})`);
  const tSeek = Date.now();
  // Seed trace bằng mẫu preToggle (inFlight>=1 đã kiểm chứng): nếu
  // prefetch settle đúng khoảng giữa preToggle và mẫu trace đầu
  // tiên thì vẫn tìm được chuyển 1→0, không mất settle oan.
  const trace = [{ t: 0, inFlight: preToggle?.inFlightPrefetchWindows ?? -1, settled: preToggle?.settledPrefetchDroppedFrames ?? -1, winInFlight: false, cache: preToggle?.cacheFrames ?? -1, prefetch: preToggle?.prefetchFrames ?? -1, ui: preToggle?.uiStatus ?? "?" }];
  let w2Seen = false;
  const trace0 = Date.now();
  while (Date.now() - trace0 < 60000) {
    const m = await cdp.evalJs(`window.__b1.status()`);
    const s = { t: Date.now() - tSeek, inFlight: m?.inFlightPrefetchWindows ?? -1, settled: m?.settledPrefetchDroppedFrames ?? -1, winInFlight: m?.decodeWindowInFlight ?? false, cache: m?.cacheFrames ?? -1, prefetch: m?.prefetchFrames ?? -1, ui: m?.uiStatus ?? "?" };
    trace.push(s);
    if (s.winInFlight) w2Seen = true;
    if (w2Seen && !s.winInFlight) break;
    await sleep(5);
  }
  // Sau khi W2 kết thúc, poll thêm tới khi prefetch settle để phân
  // biệt nhánh dọn-ngay (settle sau W2) với nhánh thử lại (settle
  // trong lúc W2) — bản đầu dừng trace ở W2 nên không thấy gì.
  const postTrace = [];
  {
    const post0 = Date.now();
    while (Date.now() - post0 < 10000) {
      const m = await cdp.evalJs(`window.__b1.status()`);
      const s = { t: Date.now() - tSeek, inFlight: m?.inFlightPrefetchWindows ?? -1, settled: m?.settledPrefetchDroppedFrames ?? -1, winInFlight: m?.decodeWindowInFlight ?? false, cache: m?.cacheFrames ?? -1, prefetch: m?.prefetchFrames ?? -1, ui: m?.uiStatus ?? "?" };
      postTrace.push(s);
      if (s.inFlight === 0) break;
      await sleep(5);
    }
  }
  delayMs = 0;
  const w2timing = await cdp.evalJs(`window.__b1.w2timing()`).catch(() => null);
  const w2drawn = await cdp.evalJs(`window.__b1.w2drawn()`).catch(() => null);
  const postW2 = await cdp.evalJs(`window.__b1.w2snap()`).catch(() => null);
  log.push(`W2 timing: ${JSON.stringify(w2timing)} drawn-after-W2: ${JSON.stringify(w2drawn)}`);
  log.push(`postW2 mirror: lastWindowKey=${postW2?.lastWindowKey} lastDecodeRange=${JSON.stringify(postW2?.lastDecodeRange)} cacheSize=${postW2?.cacheSize} failed=${postW2?.failed}`);
  // B1 phân loại W2 từ số thật (xem header: decoded là proxy, không
  // phải trường trực tiếp của controller):
  //  - ok=true + range mới: decodedProxy = cacheSize sau evict (evict
  //    chỉ giữ đúng chỉ số cửa sổ decode; prefetch/setup ở ~412-417 s
  //    không giao cửa sổ 32 s nên cache sau W2 = frame decode được
  //    trong cửa sổ). Cross-check: drawn.count phải == cacheSize và
  //    mọi drawn idx phải nằm trong [from,to].
  //  - ok=true + range không đổi + key trùng + cache>0: fast-path.
  //  - ok=true + range không đổi + key khác: dị thường, decoded=null.
  //  - ok=false: decoded suy ra 0 theo luật production (full-file và
  //    GOP đều return false khi decoded<=0 hoặc pre-resolve/load hỏng;
  //    range không đổi là nhất quán), ghi rõ là suy ra, không đo trực tiếp.
  let w2obs = null;
  {
    const preRange = preW2?.lastDecodeRange ?? null;
    const postRange = postW2?.lastDecodeRange ?? null;
    const rangeChanged = !!postRange && (!preRange || postRange.from !== preRange.from || postRange.to !== preRange.to);
    const w2ok = w2timing?.ok ?? null;
    let decoded = null, decodedKind = null, classification = null;
    if (w2ok === true && rangeChanged) {
      decoded = postW2?.cacheSize ?? null;
      decodedKind = "proxy-cache-after-evict";
      const drawnOk = w2drawn && w2drawn.count === decoded && (w2drawn.min === null || (w2drawn.min >= postRange.from && w2drawn.max <= postRange.to));
      classification = await cdp.evalJs(`window.__b1.w2classifyReal(${postRange.from}, ${postRange.to}, ${decoded}, true, ${preW2?.cacheSize ?? 0}, ${JSON.stringify(preW2?.lastWindowKey ?? null)})`).catch(() => null);
      log.push(`W2 classify (range thật): decodedProxy=${decoded} (${decodedKind}), drawnCrossCheck=${drawnOk} (drawn=${JSON.stringify(w2drawn)}), diagnostic=${classification?.diagnostic} expectedOk=${classification?.expectedOk} consistent=${classification?.consistent} :: ${classification?.detail}`);
    } else if (w2ok === true && !rangeChanged) {
      const isFast = preW2?.lastWindowKey !== null && postW2?.lastWindowKey === preW2?.lastWindowKey && (preW2?.cacheSize ?? 0) > 0;
      decodedKind = isFast ? "fast-path-no-decode" : "anomaly-no-new-range";
      classification = postRange
        ? await cdp.evalJs(`window.__b1.w2classifyReal(${postRange.from}, ${postRange.to}, null, true, ${preW2?.cacheSize ?? 0}, ${JSON.stringify(preW2?.lastWindowKey ?? null)})`).catch(() => null)
        : null;
      log.push(`W2 classify (range KHÔNG đổi): kind=${decodedKind}, diagnostic=${classification?.diagnostic} :: ${classification?.detail}`);
    } else if (w2ok === false) {
      decoded = 0; decodedKind = "inferred-from-fail-law";
      // B1 sửa bẫy range cũ: W2 fail thì KHÔNG dùng postRange (range
      // cũ của cửa sổ trước) làm cửa sổ W2 — dùng classifyFailedW2.
      classification = await cdp.evalJs(`window.__b1.w2classifyFail()`).catch(() => null);
      log.push(`W2 classify (fail): decoded=${decoded} (${decodedKind}), range sau W2 (CŨ, không dùng)=${JSON.stringify(postRange)}, diagnostic=${classification?.diagnostic} :: ${classification?.detail}`);
    } else {
      log.push(`W2 classify: KHÔNG XÁC ĐỊNH (w2timing=${JSON.stringify(w2timing)})`);
    }
    w2obs = { preW2, postW2, w2timing, w2drawn, decoded, decodedKind, classification, aim, decodeInFlightAtW2Start: preW2Status?.decodeWindowInFlight ?? null };
  }
  let timerProbe = null;
  if (hiddenNow) {
    // Đọc timer/rAF TRONG LÚC CÒN ẨN, rồi mới hiện lại.
    timerProbe = await cdp.evalJs(`window.__b1.timerProbeRead()`);
    log.push(`timer/rAF probe lúc còn ẩn: ${JSON.stringify(timerProbe)}`);
    await opts.unhide();
    const visAfter = await cdp.evalJs(`window.__b1.visibility()`);
    log.push(`sau hiện lại: visibility=${visAfter}`);
  }
  const all = [...trace, ...postTrace];
  const settleIdx = all.findIndex((s, i) => i > 0 && s.inFlight === 0 && all[i - 1].inFlight >= 1);
  if (settleIdx < 0) return { cls: `INVALID-no-settle (${all.length} mẫu, w2Seen=${w2Seen})`, log, setup, trace: all, w2timing, timerProbe, w2obs, aim };
  const ss = all[settleIdx];
  const prev = all[settleIdx - 1];
  const finalS = all[all.length - 1];
  const deferredHere = ss.winInFlight === true && ss.settled === prev.settled && ss.cache >= prev.cache;
  const settledDelta = finalS.settled - ss.settled;
  const cacheDrop = ss.cache - finalS.cache;
  const detail = `aim=${aim}; settle +${ss.t} ms: winInFlight=${ss.winInFlight} settled ${prev.settled}→${ss.settled} cache ${prev.cache}→${ss.cache} deferredHere=${deferredHere}; cuối +${finalS.t} ms: winInFlight=${finalS.winInFlight} settled=${finalS.settled} (delta=${settledDelta}) cache=${finalS.cache} (sụt=${cacheDrop}) ui=${finalS.ui} prefetch=${finalS.prefetch}`;
  log.push(detail);
  if (deferredHere && finalS.winInFlight === false && settledDelta >= 1 && cacheDrop === settledDelta && finalS.ui === "off" && finalS.prefetch === 0) {
    return { cls: "SUCCESS", log, setup, trace: all, settleAtMs: ss.t, finalAtMs: finalS.t, settledBefore: prev.settled, settledFinal: finalS.settled, settledDelta, cacheAtSettle: ss.cache, cacheFinal: finalS.cache, cacheDrop, timerProbe, w2timing, w2drawn, w2obs, aim };
  }
  // Nhánh dọn-ngay: settle xảy ra SAU khi W2 kết thúc (hoặc trùng mẫu
  // settle với lần tăng counter) — counter tăng tính từ mẫu TRƯỚC
  // settle (prev), không phải từ mẫu settle (đã chứa lần tăng).
  const immDelta = finalS.settled - prev.settled;
  const immDrop = prev.cache - finalS.cache;
  if (!deferredHere && immDelta >= 1 && immDrop === immDelta && finalS.ui === "off") {
    // Settle-drop CÓ dọn (counter tăng khớp cache sụt) nhưng qua nhánh
    // dọn-ngay, không phải lần thử lại — ghi rõ là bằng chứng một
    // phần, không tính là SUCCESS của pha.
    return { cls: "PARTIAL-immediate-drop", log, setup, trace: all, settleAtMs: ss.t, finalAtMs: finalS.t, settledBefore: prev.settled, settledFinal: finalS.settled, settledDelta: immDelta, cacheAtSettle: ss.cache, cacheFinal: finalS.cache, cacheDrop: immDrop, timerProbe, w2timing, w2drawn, w2obs, aim };
  }
  return { cls: `INVALID-${deferredHere ? "final-mismatch" : "not-deferred"}`, log, setup, trace: all, settledDelta, cacheDrop, timerProbe, w2timing, w2drawn, w2obs, aim };
}

async function runPhase(cdp, label, newFn, opts = {}) {
  const attempts = [];
  const maxAttempts = opts.maxAttempts || MAX_ATTEMPTS;
  const collectUltra = opts.collectUltra || 0;
  let ultraCount = 0;
  let firstSuccess = null;
  for (let a = 1; a <= maxAttempts; a++) {
    const r = await attemptRace(cdp, newFn, opts).catch(async (e) => { if (opts.unhide) await opts.unhide().catch(() => {}); return { cls: "ERROR-" + e.message.slice(0, 200), log: [`lỗi attempt: ${e.message}`] }; });
    attempts.push({ attempt: a, cls: r.cls, log: r.log, aim: r.aim, w2obs: r.w2obs });
    console.log(`  [${label} attempt ${a}] ${r.cls} (aim=${r.aim})`);
    for (const l of r.log || []) console.log(`    ${l}`);
    if (r.cls === "SUCCESS" && !firstSuccess) firstSuccess = r;
    if (r.aim === "cache-ultra-tight" && r.w2obs) ultraCount++;
    await cdp.evalJs(`window.__b1.disposeAll()`).catch(() => {});
    await sleep(500);
    if (collectUltra > 0 && ultraCount >= collectUltra) break;
    if (collectUltra === 0 && firstSuccess) break;
  }
  return { ok: !!firstSuccess, attempts, win: firstSuccess, ultraCount };
}

async function main() {
  console.log(`loadavg lúc bắt đầu: ${loadavg()}`);
  let display = process.env.DISPLAY || null;
  let xvfb = null;
  if (!display) {
    for (const num of [95, 94, 93, 92, 91, 99]) {
      xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
      await sleep(800);
      if (xvfb.exitCode === null) { display = `:${num}`; break; }
      xvfb = null;
    }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  xvfbProc = xvfb;
  console.log(`xvfb: DISPLAY=${display} (headed thật, không cờ --headless)`);
  const profile = path.join(SCRATCH, "cdprof-b1");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "b1-chrome.log"), "w");
  const chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${profile}`, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--force-device-scale-factor=1", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display } });
  chromeProc = chrome;
  process.on("exit", killAll);
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      pageTarget = (pages || []).find((p) => p.type === "page") || null;
    } catch {}
    if (!pageTarget) await sleep(500);
  }
  if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  cdpGlobal = cdp;
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
  // Browser-level CDP (để ẩn/hiện tab bằng Target.activateTarget).
  const version = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json();
  browserCdp = new CDP(version.webSocketDebuggerUrl);
  await browserCdp.send("Target.setDiscoverTargets", { discover: true });
  const pageId = pageTarget.id;
  record("T0 headed chrome + Xvfb + server Range", true, `DISPLAY=${display} debugPort=${DEBUG_PORT} httpPort=${HTTP_PORT}`);

  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/page.html` });
  await cdp.waitFor(async () => { const r = await cdp.evalJs(`!!window.__b1 && document.getElementById("ready")?.textContent === "ready"`); return r || null; }, "page Y1 ready", 90000);

  // Pha A — asset: với aim SIÊU CHẶT (biến duy nhất đổi so với Y1).
  // Probe asset: TRƯỚC race: ingest IDB thật + rehydrate thật (1 lần;
  // race dùng lại blob URL), rồi kiểm tra sẵn sàng trước khi chạy
  // attempt nào: blob size == manifest size, restored 1, failed 0.
  const assetSetup = await cdp.evalJs(`window.__b1.assetSetup()`);
  console.log(`  [asset setup] ${JSON.stringify(assetSetup)}`);
  const assetOk = !!assetSetup.blobUrl && assetSetup.restoredSrcs.length === 1 && assetSetup.failedSrcs.length === 0;
  const probeReady = assetOk && assetSetup.size === assetSetup.manifestSize;
  record("B1(A0) probe asset: trước race (headed, IDB thật)", probeReady,
    `assetId=${assetSetup.assetId} blobUrl=${assetSetup.blobUrl ? "blob:..." : null} size=${assetSetup.size} manifestSize=${assetSetup.manifestSize} restored=${JSON.stringify(assetSetup.restoredSrcs)} failed=${JSON.stringify(assetSetup.failedSrcs)} skipped=${JSON.stringify(assetSetup.skipped)}`);
  let p2 = { ok: false, attempts: [] };
  if (probeReady) {
    p2 = await runPhase(cdp, "ASSET-ULTRA", () => cdp.evalJs(`window.__b1.blobNew()`), { aimUltra: true, useDelay: false, collectUltra: 2 });
    record("B1(A) W2 32,4667 s + nhánh thử lại qua đường asset: với aim siêu chặt (headed)", p2.ok,
      p2.ok ? `settle +${p2.win.settleAtMs} ms, cuối +${p2.win.finalAtMs} ms; settled ${p2.win.settledBefore}→${p2.win.settledFinal} (delta=${p2.win.settledDelta}); cache ${p2.win.cacheAtSettle}→${p2.win.cacheFinal} (sụt=${p2.win.cacheDrop}); gopMode=${p2.win.setup.gopMode} fallback=${p2.win.setup.fallback}`
          : `không bắt được SUCCESS sau ${MAX_ATTEMPTS} attempt: ${p2.attempts.map((a) => a.cls).join(", ")}`);
  }

  // Pha B — tab ẩn 300 s THẬT (đường GOP, race chạy trong lúc tab bị
  // ẩn sau dwell 300.000 ms; aim giữ nguyên Y1 để biến duy nhất so với
  // Z1(B) là thời gian ẩn 60 s → 300 s; W2 cũng đổi sang 32,4667 s
  // theo mốc B1, ghi rõ trong LIMITS để không nhầm là chỉ đổi dwell).
  let blankTargetId = null;
  const hide = async () => {
    const t = await browserCdp.send("Target.createTarget", { url: "about:blank" });
    blankTargetId = t.targetId;
    await browserCdp.send("Target.activateTarget", { targetId: blankTargetId });
    await sleep(800);
  };
  const unhide = async () => {
    await browserCdp.send("Target.activateTarget", { targetId: pageId });
    if (blankTargetId) await browserCdp.send("Target.closeTarget", { targetId: blankTargetId }).catch(() => {});
    blankTargetId = null;
    await sleep(800);
  };
  const skipHidden = process.env.B1_SKIP_HIDDEN === "1";
  const p3 = skipHidden
    ? { ok: false, attempts: [{ attempt: 0, cls: "SKIPPED-by-env (đã SUCCESS ở lần chạy trước, không đo lại 300 s)", log: [] }] }
    : await runPhase(cdp, "HIDDEN-LONG", () => cdp.evalJs(`window.__b1.gopNew()`), { hideFirst: hide, unhide, dwellMs: 300000, useDelay: true, maxAttempts: 1 });
  record("B1(B) settle-drop khi tab bị ẩn 300 s thật (headed)", p3.ok,
    p3.ok ? `settle +${p3.win.settleAtMs} ms, cuối +${p3.win.finalAtMs} ms; settled ${p3.win.settledBefore}→${p3.win.settledFinal} (delta=${p3.win.settledDelta}); cache ${p3.win.cacheAtSettle}→${p3.win.cacheFinal} (sụt=${p3.win.cacheDrop}); timer probe sau dwell=${JSON.stringify(p3.win.timerProbe)}`
        : `không bắt được SUCCESS sau 1 attempt dwell 300 s: ${p3.attempts.map((a) => a.cls).join(", ")}`);

  const out = { fileSize, assetSetup, probeReady, phases: { asset: p2, hidden: p3 } };
  fs.writeFileSync(path.join(SCRATCH, "b1-result.json"), JSON.stringify(out, null, 2));
  console.log(`loadavg lúc kết thúc: ${loadavg()}`);
  // B1 exit theo ĐO LƯỜNG, không theo SUCCESS: 0 khi có ≥1 quan sát W2
  // ultra-tight ở pha asset (kể cả SUCCESS vẫn mở); 1 khi không có.
  const w2ObsCount = (p2.attempts || []).filter((a) => a.aim === "cache-ultra-tight" && a.w2obs).length;
  console.log(`\n== B1 headed: probe=${probeReady} assetSuccess=${p2.ok} ultraW2Obs=${w2ObsCount} hiddenAttempts=${(p3.attempts || []).map((a) => a.cls).join(",")} ==`);
  killAll();
  return w2ObsCount >= 1 ? 0 : 1;
}
main().then((code) => { killAll(); process.exit(code); }).catch((e) => { console.error(`FATAL: ${e.message}`); killAll(); process.exit(1); });
