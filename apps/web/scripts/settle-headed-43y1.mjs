// settle-headed-43y1.mjs — Phase 9 đợt 43, luồng Y1: bằng chứng browser
// HEADED cho settle-drop trên 3 đường còn nợ của đợt 42 §5.2:
//   (1) GOP thưa > 32 MiB qua Range (đường GOP Range V2, ngưỡng 32 MiB,
//       trần 128 MiB) với fixture GOP thưa hỏng 1 GOP;
//   (2) đường asset: (project + rehydrate IDB thật → blob: URL);
//   (3) tab ẩn (visibilitychange / background page).
//
// Khác click-test X1 ở chỗ: harness này KHÔNG lái UI app đầy đủ mà
// bundle đúng module lib của app (ReversePreviewController +
// AssetStore + rehydrate, cùng code preview dùng) vào một page nhỏ,
// lái bằng CDP — để race settle-drop bắt được xác định mà vẫn là
// Chromium headed thật (không --headless, dưới Xvfb) + VideoDecoder
// thật + IndexedDB thật + HTTP Range thật. Những gì KHÔNG được claim
// từ harness này ghi rõ trong LIMITS Y1: không lái nút toggle/badge
// của preview.tsx (badge chỉ đọc qua mirror status, cùng mirror mà
// preview.tsx đọc), không qua bridge Express thật (server node:http
// tối giản như X4, chỉ chứng minh hợp đồng HTTP Range).
//
// Cách chạy (từ gốc repo; script TỰ lo Xvfb + Chrome headed + server):
//   node apps/web/scripts/settle-headed-43y1.mjs
// Biến môi trường: Y1_DEV_URL không dùng (không cần vite preview);
// Y1_DEBUG_PORT (mặc định 9371), Y1_HTTP_PORT (mặc định 8923),
// Y1_FIX (mặc định ~/workspace/tmp-round43-y1/y1-corrupt-gop300-...mp4),
// Y1_CHROME (mặc định ms-playwright chromium-1248).
// Fixture phải tự tạo trước bằng ffmpeg (xem LIMITS Y1 §1): file gốc
// 360p GOP 90, 420 s, 69.861.131 byte; bản hỏng zero đúng packet IDR
// của GOP [30,33) (pos 5378169, size 14007) — moov nguyên vẹn.
// (Bản 720p 90 s đầu tiên bị loại: fps decode phần mềm dưới tải nặng
// chỉ 13–48, không qua ngưỡng cổng 60 nên không bao giờ tới được
// prefetch — xem LIMITS Y1 §5. Bản hỏng GOP [300,303) cũng bị loại:
// GOP cuối file còn nằm trong cache GOP 32 MiB lúc W2 nên W2 không
// fetch bù — không móc được delay; GOP [30,33) đầu file thì chắc
// chắn đã bị evict.)
// Delay W2: race tự nhiên trên máy nhanh này quá hẹp (W2 hỏng chỉ
// ~10 ms vì decode chunk hỏng reject ngay, trong khi prefetch còn
// ~200 ms mới settle) nên server delay CÓ CHỌN LỌC đúng 1 range GOP
// hỏng trong lúc W2 (800 ms, chỉ khi Node bật cờ delayMs) để cửa sổ
// hoãn mở ra xác định — cơ chế dọn test là code production nguyên
// vẹn, chỉ timing mạng của test được điều khiển, và điều này được
// ghi rõ trong LIMITS (không mạo nhận race tự nhiên).
// Mỗi pha chạy race tối đa 4 attempt (controller mới mỗi attempt);
// exit 1 khi pha nào không bắt được SUCCESS. Số đo in ra + ghi JSON
// vào scratch (không vào repo).
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.Y1_SCRATCH || path.join(os.homedir(), "workspace/tmp-round43-y1");
const FIX = process.env.Y1_FIX || path.join(SCRATCH, "y1-corrupt-gop30-360p-gop90-420s.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.Y1_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.Y1_DEBUG_PORT || 9371);
const HTTP_PORT = Number(process.env.Y1_HTTP_PORT || 8923);
const SETUP_T = 417.0;     // cửa sổ setup: GOP lành cuối [417,420)
const PREFETCH_T = 412.0;  // cửa sổ mới để khởi động prefetch
const GATE_RETRY_T = [407.0, 402.0]; // cửa sổ thử cổng thêm (mỗi lần đo lại fps)
const CORRUPT_T = 32.7;    // present slice [30.2,32.7] nằm trọn GOP hỏng [30,33)
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
if (!fs.existsSync(FIX)) throw new Error(`không thấy fixture ${FIX}`);
if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
const fileBuf = fs.readFileSync(FIX);
const fileSize = fileBuf.length;
console.log(`fixture: ${FIX} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB (ngưỡng GOP 32 MiB, trần S4 128 MiB)`);

// ---- 1. Bundle entry (reverseWebcodecs + assetStore + rehydrate) ----
const entryPath = path.join(SCRATCH, "y1-entry.mjs");
fs.writeFileSync(entryPath, `import {
  getReversePreviewController, reverseDecodeAheadStatus,
  setReverseDecodeAheadWanted, disposeReverseWebcodecsControllers,
} from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"))};
import { AssetStore } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/assetStore.ts"))};
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
Y.w2drawn = () => { const idxs = []; ctrl.presentCachedReverse((f, i) => { idxs.push(i); }); idxs.sort((a, b) => a - b); return { count: idxs.length, min: idxs[0] ?? null, max: idxs[idxs.length - 1] ?? null }; };
Y.assetSetup = async () => {
  const resp = await fetch("/asset-source.mp4");
  const blob = await resp.blob();
  const store = new AssetStore();
  const manifest = await store.ingest(blob, { name: "y1-corrupt-gop30-360p-gop90-420s.mp4", width: 640, height: 360, duration: 420 });
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
window.__y1 = Y;
`);
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "y1-bundle.mjs");
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
const pageHtml = `<!doctype html><meta charset="utf-8"><title>Y1 settle headed</title>
<body><div id="ready">loading</div><script type="module">
import "./y1-bundle.mjs";
document.getElementById("ready").textContent = "ready";
</script></body>`;
const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/page.html") { res.writeHead(200, { "Content-Type": "text/html" }); res.end(pageHtml); }
  else if (req.url === "/y1-bundle.mjs") { res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); }
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
  if (!setup.ok) return { cls: "INVALID-setup", log, setup };
  let dec = await cdp.evalJs(`window.__y1.wantedOn()`);
  let st = await cdp.evalJs(`window.__y1.status()`);
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
    await cdp.evalJs(`window.__y1.timerProbeStart()`);
    let vis = await cdp.evalJs(`window.__y1.visibility()`);
    for (let i = 0; i < 10 && vis !== "hidden"; i++) { await sleep(500); vis = await cdp.evalJs(`window.__y1.visibility()`); }
    log.push(`tab ẩn: visibility=${vis}`);
    if (vis !== "hidden") { await opts.unhide(); return { cls: "INVALID-not-hidden", log, setup }; }
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
      const w2 = await cdp.evalJs(`window.__y1.windowSync(${gt})`);
      st = await cdp.evalJs(`window.__y1.status()`);
      log.push(`gate thử lại (cửa sổ ${gt}): windowOk=${w2.ok} active=${st.active} ui=${st.uiStatus} fps=${st.measurementFps} reasons=${JSON.stringify(st.reasons)}`);
      if (st.active) { prefetchAlreadyStarted = true; break; }
    }
    if (!st.active) return { cls: "INVALID-gate-blocked", log, setup, gate: dec };
  }
  // Khởi động prefetch bằng 1 cửa sổ mới (khác cửa sổ setup) — trừ
  // nhánh gate-2 ở trên (prefetch đã chạy từ lần decode đó).
  if (!prefetchAlreadyStarted) await cdp.evalJs(`window.__y1.windowAsync(${PREFETCH_T})`);
  let pre = null;
  const poll0 = Date.now();
  while (Date.now() - poll0 < 90000) {
    const m = await cdp.evalJs(`window.__y1.status()`);
    if ((m?.inFlightPrefetchWindows ?? 0) >= 1) { pre = m; break; }
    await sleep(5);
  }
  if (!pre) return { cls: "INVALID-no-prefetch-inflight", log, setup };
  log.push(`prefetch bay: inFlight=${pre.inFlightPrefetchWindows} cache=${pre.cacheFrames} prefetchFrames=${pre.prefetchFrames} settled=${pre.settledPrefetchDroppedFrames}`);
  // (hideFirst đã chạy ở trên, trước khi khởi động prefetch.)
  // Aim kiểu X1: chờ prefetch gần xong (cache đứng yên 60 ms hoặc
  // gần đủ số frame) rồi mới tắt + W2 — nếu tắt lúc prefetch mới
  // bắt đầu thì W2 hỏng nhanh (~10 ms) kết thúc trước khi settle,
  // rơi về nhánh dọn-ngay chứ không phải lần thử lại.
  let aim = "timeout-8s";
  {
    let lastCache = pre.cacheFrames ?? -1;
    let lastGrowAt = Date.now();
    const aim0 = Date.now();
    const firstCache = lastCache;
    // Target dựa trên cache setup + prefetchFrames (trừ 20 vì decode
    // thực tế thường ra ít frame hơn aheadRange — debug thấy thiếu
    // ~16), KHÔNG dựa trên firstCache (đã chứa sẵn frame prefetch).
    // Stall rút còn 25 ms: flush cuối prefetch nhanh hơn 60 ms ở
    // 360p nên stall-60 ms không bao giờ kịp trước settle.
    // aimLoose (chỉ pha asset): tắt khi prefetch mới ~50% — vì W2
    // đường blob tốn 240–300 ms load toàn file trên main thread làm
    // prefetch chững lại, nên aim chặt cho settle rơi SAU W2 ~30–60
    // ms (nhánh dọn-ngay); aim lỏng để phần còn lại của prefetch
    // (~100 ms decode) settle TRONG lúc W2 còn chạy.
    const target = opts.aimLoose
      ? (setup.cacheSize ?? 0) + Math.floor((pre.prefetchFrames ?? 0) * 0.5)
      : (setup.cacheSize ?? 0) + Math.max(0, (pre.prefetchFrames ?? 0) - 20);
    while (Date.now() - aim0 < 8000) {
      const m = await cdp.evalJs(`window.__y1.status()`);
      if ((m?.inFlightPrefetchWindows ?? 0) < 1) { aim = "settled-during-aim"; break; }
      const c = m.cacheFrames ?? -1;
      if (c > lastCache) { lastCache = c; lastGrowAt = Date.now(); }
      if (c >= target) { aim = "cache-near-full"; break; }
      if (Date.now() - lastGrowAt >= 25) { aim = "cache-stall-25ms"; break; }
      await sleep(5);
    }
    log.push(`aim: ${aim} (cache lúc bắt prefetch=${firstCache}, target~${target})`);
  }
  // Tắt NGAY + khởi động W2 hỏng NGAY (2 eval liên tiếp). Bật delay
  // server cho range GOP hỏng TRƯỚC khi W2 fetch bù (GOP [30,33) đầu
  // file chắc chắn đã bị evict khỏi cache GOP nên W2 phải fetch lại
  // và bị giữ 800 ms — cửa sổ hoãn mở ra xác định).
  const preToggle = await cdp.evalJs(`window.__y1.status()`);
  if ((preToggle?.inFlightPrefetchWindows ?? 0) < 1) { if (hiddenNow) await opts.unhide(); return { cls: "INVALID-settled-before-toggle", log, setup }; }
  delayMs = W2_DELAY_MS;
  await cdp.evalJs(`window.__y1.wantedOff()`);
  await cdp.evalJs(`window.__y1.windowAsync(${CORRUPT_T})`);
  const tSeek = Date.now();
  // Seed trace bằng mẫu preToggle (inFlight>=1 đã kiểm chứng): nếu
  // prefetch settle đúng khoảng giữa preToggle và mẫu trace đầu
  // tiên thì vẫn tìm được chuyển 1→0, không mất settle oan.
  const trace = [{ t: 0, inFlight: preToggle?.inFlightPrefetchWindows ?? -1, settled: preToggle?.settledPrefetchDroppedFrames ?? -1, winInFlight: false, cache: preToggle?.cacheFrames ?? -1, prefetch: preToggle?.prefetchFrames ?? -1, ui: preToggle?.uiStatus ?? "?" }];
  let w2Seen = false;
  const trace0 = Date.now();
  while (Date.now() - trace0 < 60000) {
    const m = await cdp.evalJs(`window.__y1.status()`);
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
      const m = await cdp.evalJs(`window.__y1.status()`);
      const s = { t: Date.now() - tSeek, inFlight: m?.inFlightPrefetchWindows ?? -1, settled: m?.settledPrefetchDroppedFrames ?? -1, winInFlight: m?.decodeWindowInFlight ?? false, cache: m?.cacheFrames ?? -1, prefetch: m?.prefetchFrames ?? -1, ui: m?.uiStatus ?? "?" };
      postTrace.push(s);
      if (s.inFlight === 0) break;
      await sleep(5);
    }
  }
  delayMs = 0;
  const w2timing = await cdp.evalJs(`window.__y1.w2timing()`).catch(() => null);
  const w2drawn = await cdp.evalJs(`window.__y1.w2drawn()`).catch(() => null);
  log.push(`W2 timing: ${JSON.stringify(w2timing)} drawn-after-W2: ${JSON.stringify(w2drawn)}`);
  let timerProbe = null;
  if (hiddenNow) {
    // Đọc timer/rAF TRONG LÚC CÒN ẨN, rồi mới hiện lại.
    timerProbe = await cdp.evalJs(`window.__y1.timerProbeRead()`);
    log.push(`timer/rAF probe lúc còn ẩn: ${JSON.stringify(timerProbe)}`);
    await opts.unhide();
    const visAfter = await cdp.evalJs(`window.__y1.visibility()`);
    log.push(`sau hiện lại: visibility=${visAfter}`);
  }
  const all = [...trace, ...postTrace];
  const settleIdx = all.findIndex((s, i) => i > 0 && s.inFlight === 0 && all[i - 1].inFlight >= 1);
  if (settleIdx < 0) return { cls: `INVALID-no-settle (${all.length} mẫu, w2Seen=${w2Seen})`, log, setup, trace: all, w2timing, timerProbe };
  const ss = all[settleIdx];
  const prev = all[settleIdx - 1];
  const finalS = all[all.length - 1];
  const deferredHere = ss.winInFlight === true && ss.settled === prev.settled && ss.cache >= prev.cache;
  const settledDelta = finalS.settled - ss.settled;
  const cacheDrop = ss.cache - finalS.cache;
  const detail = `aim=${aim}; settle +${ss.t} ms: winInFlight=${ss.winInFlight} settled ${prev.settled}→${ss.settled} cache ${prev.cache}→${ss.cache} deferredHere=${deferredHere}; cuối +${finalS.t} ms: winInFlight=${finalS.winInFlight} settled=${finalS.settled} (delta=${settledDelta}) cache=${finalS.cache} (sụt=${cacheDrop}) ui=${finalS.ui} prefetch=${finalS.prefetch}`;
  log.push(detail);
  if (deferredHere && finalS.winInFlight === false && settledDelta >= 1 && cacheDrop === settledDelta && finalS.ui === "off" && finalS.prefetch === 0) {
    return { cls: "SUCCESS", log, setup, trace: all, settleAtMs: ss.t, finalAtMs: finalS.t, settledBefore: prev.settled, settledFinal: finalS.settled, settledDelta, cacheAtSettle: ss.cache, cacheFinal: finalS.cache, cacheDrop, timerProbe, w2timing, w2drawn };
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
    return { cls: "PARTIAL-immediate-drop", log, setup, trace: all, settleAtMs: ss.t, finalAtMs: finalS.t, settledBefore: prev.settled, settledFinal: finalS.settled, settledDelta: immDelta, cacheAtSettle: ss.cache, cacheFinal: finalS.cache, cacheDrop: immDrop, timerProbe, w2timing, w2drawn };
  }
  return { cls: `INVALID-${deferredHere ? "final-mismatch" : "not-deferred"}`, log, setup, trace: all, settledDelta, cacheDrop, timerProbe, w2timing, w2drawn };
}

async function runPhase(cdp, label, newFn, opts = {}) {
  const attempts = [];
  for (let a = 1; a <= MAX_ATTEMPTS; a++) {
    const r = await attemptRace(cdp, newFn, opts).catch(async (e) => { if (opts.unhide) await opts.unhide().catch(() => {}); return { cls: "ERROR-" + e.message.slice(0, 200), log: [`lỗi attempt: ${e.message}`] }; });
    attempts.push({ attempt: a, cls: r.cls, log: r.log });
    console.log(`  [${label} attempt ${a}] ${r.cls}`);
    for (const l of r.log || []) console.log(`    ${l}`);
    if (r.cls === "SUCCESS") return { ok: true, attempts, win: r };
    await cdp.evalJs(`window.__y1.disposeAll()`).catch(() => {});
    await sleep(500);
  }
  return { ok: false, attempts };
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
  const profile = path.join(SCRATCH, "cdprof-y1");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "y1-chrome.log"), "w");
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
  await cdp.waitFor(async () => { const r = await cdp.evalJs(`!!window.__y1 && document.getElementById("ready")?.textContent === "ready"`); return r || null; }, "page Y1 ready", 90000);

  // Pha 1 — GOP Range.
  const gopReqBefore = reqLog.gop.length;
  const p1 = await runPhase(cdp, "GOP", () => cdp.evalJs(`window.__y1.gopNew()`));
  const gopReqs = reqLog.gop.slice(gopReqBefore);
  const gopHeads = gopReqs.filter((r) => r.method === "HEAD").length;
  const gop206 = gopReqs.filter((r) => r.status === 206).length;
  const gopFullGets = gopReqs.filter((r) => r.method === "GET" && r.range === null).length;
  const gopBytes = gopReqs.reduce((a, r) => a + r.bytes, 0);
  console.log(`  [GOP requests] tổng=${gopReqs.length} HEAD=${gopHeads} 206=${gop206} GET-toàn-file=${gopFullGets} bytes=${gopBytes} (${(gopBytes / fileSize * 100).toFixed(2)}% file)`);
  record("Y1(1) settle-drop qua GOP Range > 32 MiB (headed)", p1.ok,
    p1.ok ? `attempt ${p1.win ? "" : ""}thắng: settle +${p1.win.settleAtMs} ms, cuối +${p1.win.finalAtMs} ms; settled ${p1.win.settledBefore}→${p1.win.settledFinal} (delta=${p1.win.settledDelta}); cache ${p1.win.cacheAtSettle}→${p1.win.cacheFinal} (sụt=${p1.win.cacheDrop}); gopMode=${p1.win.setup.gopMode} probe=${JSON.stringify(p1.win.setup.probe)}; requests HEAD=${gopHeads} 206=${gop206} GET-toàn-file=${gopFullGets}`
      : `không bắt được SUCCESS sau ${MAX_ATTEMPTS} attempt: ${p1.attempts.map((a) => a.cls).join(", ")}; requests HEAD=${gopHeads} 206=${gop206} GET-toàn-file=${gopFullGets}`);

  // Pha 2 — asset: (ingest IDB thật + rehydrate thật, 1 lần; race dùng lại blob URL).
  const assetSetup = await cdp.evalJs(`window.__y1.assetSetup()`);
  console.log(`  [asset setup] ${JSON.stringify(assetSetup)}`);
  const assetOk = !!assetSetup.blobUrl && assetSetup.restoredSrcs.length === 1 && assetSetup.failedSrcs.length === 0;
  record("Y1(2a) rehydrate asset: thật ra blob: URL (headed, IDB thật)", assetOk,
    `assetId=${assetSetup.assetId} blobUrl=${assetSetup.blobUrl ? "blob:..." : null} size=${assetSetup.size} restored=${JSON.stringify(assetSetup.restoredSrcs)} failed=${JSON.stringify(assetSetup.failedSrcs)} skipped=${JSON.stringify(assetSetup.skipped)}`);
  let p2 = { ok: false, attempts: [] };
  if (assetOk) {
    p2 = await runPhase(cdp, "ASSET", () => cdp.evalJs(`window.__y1.blobNew()`), { aimLoose: true });
    record("Y1(2b) settle-drop qua đường asset: (headed)", p2.ok,
      p2.ok ? `settle +${p2.win.settleAtMs} ms, cuối +${p2.win.finalAtMs} ms; settled ${p2.win.settledBefore}→${p2.win.settledFinal} (delta=${p2.win.settledDelta}); cache ${p2.win.cacheAtSettle}→${p2.win.cacheFinal} (sụt=${p2.win.cacheDrop}); gopMode=${p2.win.setup.gopMode} fallback=${p2.win.setup.fallback}`
          : `không bắt được SUCCESS sau ${MAX_ATTEMPTS} attempt: ${p2.attempts.map((a) => a.cls).join(", ")}`);
  }

  // Pha 3 — tab ẩn (đường GOP, race chạy trong lúc tab bị ẩn).
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
  const p3 = await runPhase(cdp, "HIDDEN", () => cdp.evalJs(`window.__y1.gopNew()`), { hideFirst: hide, unhide });
  record("Y1(3) settle-drop khi tab bị ẩn (headed)", p3.ok,
    p3.ok ? `settle +${p3.win.settleAtMs} ms, cuối +${p3.win.finalAtMs} ms; settled ${p3.win.settledBefore}→${p3.win.settledFinal} (delta=${p3.win.settledDelta}); cache ${p3.win.cacheAtSettle}→${p3.win.cacheFinal} (sụt=${p3.win.cacheDrop}); timer probe=${JSON.stringify(p3.win.timerProbe)}`
        : `không bắt được SUCCESS sau ${MAX_ATTEMPTS} attempt: ${p3.attempts.map((a) => a.cls).join(", ")}`);

  const out = { fileSize, gopRequests: { total: gopReqs.length, heads: gopHeads, n206: gop206, fullGets: gopFullGets, bytes: gopBytes }, assetSetup, phases: { gop: p1, asset: p2, hidden: p3 } };
  fs.writeFileSync(path.join(SCRATCH, "y1-result.json"), JSON.stringify(out, null, 2));
  console.log(`loadavg lúc kết thúc: ${loadavg()}`);
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== Y1 clicktest: ${results.length - failed.length}/${results.length} pass ==`);
  killAll();
  return failed.length > 0 ? 1 : 0;
}
main().then((code) => { killAll(); process.exit(code); }).catch((e) => { console.error(`FATAL: ${e.message}`); killAll(); process.exit(1); });
