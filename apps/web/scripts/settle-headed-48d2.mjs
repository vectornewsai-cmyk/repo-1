// settle-headed-48d2.mjs — Phase 9 đợt 48, luồng D2: instrumentation
// tầng harness tách đuôi feed/flush/drain của prefetch + đo decoded
// trực tiếp của W2 (đường asset:).
//
// Nợ mở: docs/PHASE9_ROUND47_C2_SETTLE_LIMITS.md §0.4 + §4 + §6.1
// (SUCCESS đường asset: vẫn mở, 0/9 attempt C2 + 0/2 B1 = 11/11
// PARTIAL, gap settle−W2end luôn dương 36–901 ms; cơ chế trượt suy
// ra từ code — W2 short-circuit khi decoder gặp GOP hỏng, prefetch
// phải feed hết 136 chunk + flush mới resolve — CHƯA có timestamp
// feed/flush trực tiếp, decoded trực tiếp của W2 vẫn không có).
// Đợt 47 §4.2 CẤM siết aim hay dời mốc W2 nữa — đợt này CHỈ đo,
// không đổi biến race: KHÔNG chạy pha D1 probe, KHÔNG chạy sóng 2
// slack=1, aim giữ slack 3 như C2.
//
// Cách đo (mới ở D2, không sửa production): page do harness serve
// bọc window.VideoDecoder bằng subclass TRƯỚC khi bundle module
// load (script classic chạy trước <script type="module">), ghi lại
// mọi sự kiện trên cùng đồng hồ performance.now() của page:
// configure, từng decode(chunk) (feed), flush() gọi + resolve,
// từng output callback (drain), error callback (short-circuit),
// close. Số học tách pha + phân loại instance + đếm decoded W2
// nằm ở apps/web/src/lib/settle48D2.ts (khóa test 24/24), harness
// bundle nó sang scratch rồi import động — một nguồn số học duy
// nhất. Wrapper chỉ ghi + chuyển tiếp y nguyên (output/error gốc
// vẫn chạy, isConfigSupported static bind về native) nên không đổi
// hành vi decode; nếu setup decode hỏng hoặc dạng race đổi thì
// wrapper có vấn đề — dừng và ghi rõ, không đo tiếp.
//
// Tiêu chí SUCCESS/PARTIAL/INVALID giữ nguyên Y1 (không nới).
// Exit 0 = đo xong có ≥1 quan sát W2 ultra-tight + trace vd đầy đủ
// (kể cả SUCCESS vẫn mở); exit 1 = harness lỗi hoặc không có quan
// sát W2 nào. KHÔNG push, KHÔNG sửa production, KHÔNG có pha tab ẩn.
//
// Cách chạy (từ gốc repo; script TỰ lo Xvfb + Chrome headed + server):
//   node apps/web/scripts/settle-headed-48d2.mjs
// Biến môi trường: D2_DEBUG_PORT (9488), D2_HTTP_PORT (9040),
// D2_FIX (fixture Y1), D2_CHROME (ms-playwright chromium-1248),
// D2_SCRATCH (~/workspace/tmp-round48-d2), D2_SLACK (3),
// D2_MAX_ATTEMPTS (6).
// Fixture tái dùng của Y1/Z1/B1/C2: 360p GOP 90, 420 s, 69.861.131
// byte, GOP hỏng zero đúng packet IDR của GOP [30,33) (pos 5378169).
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.D2_SCRATCH || path.join(os.homedir(), "workspace/tmp-round48-d2");
const FIX = process.env.D2_FIX || path.join(os.homedir(), "workspace/tmp-round43-y1/y1-corrupt-gop30-360p-gop90-420s.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.D2_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.D2_DEBUG_PORT || 9488);
const HTTP_PORT = Number(process.env.D2_HTTP_PORT || 9040);
const SETUP_T = 417.0;     // cửa sổ setup: GOP lành cuối [417,420)
const PREFETCH_T = 412.0;  // cửa sổ mới để khởi động prefetch
const GATE_RETRY_T = [407.0, 402.0]; // cửa sổ thử cổng thêm (mỗi lần đo lại fps)
const CORRUPT_T = 974 / 30; // 32,4667 s: targetPos 974, mirror A1 [900,974] trọn GOP hỏng [30,33)
const SLACK = Number(process.env.D2_SLACK || 3);
const MAX_ATTEMPTS = Number(process.env.D2_MAX_ATTEMPTS || 6);

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
console.log(`fixture: ${FIX} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB`);
console.log(`D2 config: slack=${SLACK} maxAttempts=${MAX_ATTEMPTS} (không D1 probe, không sóng 2 — chỉ đo, xem header)`);

// ---- 1. Bundle entry (reverseWebcodecs + assetStore + rehydrate + settle47C2) ----
const entryPath = path.join(SCRATCH, "d2-entry.mjs");
writeFileEpermRetry(entryPath, `import {
  getReversePreviewController, reverseDecodeAheadStatus,
  setReverseDecodeAheadWanted, disposeReverseWebcodecsControllers,
} from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"))};
import { AssetStore } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/assetStore.ts"))};
import { mirrorDecodeWindow, classifyW2 } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/settle45A1.ts"))};
import { classifyFailedW2 } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/settle46B1.ts"))};
import { prefetchNewFrames, remainingNewFrames, operativePrefetchKey } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/settle47C2.ts"))};
import { rehydrateMediaItems } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/rehydrate36S5.ts"))};
let ctrl = null;
let assetInfo = null;
const Y = {};
Y.status = () => {
  const s = reverseDecodeAheadStatus();
  return { ...s, ctrl: ctrl ? { gopMode: ctrl.gopMode, fallback: ctrl.gopFallbackReason, failed: ctrl.failed, cacheSize: ctrl.cacheSize, probe: ctrl.gopSizeProbe } : null };
};
Y.disposeAll = () => { try { ctrl?.dispose(); } catch {} ctrl = null; disposeReverseWebcodecsControllers(); return true; };
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
Y.windowAsync = (t) => { const s = performance.now(); Y._w2 = null; Y._w2startPerf = s; void ctrl.ensureWindowForTime(t).then((ok) => { Y._w2 = { durMs: performance.now() - s, ok, failed: ctrl.failed }; }); return "started"; };
Y.w2timing = () => Y._w2;
// D2: đọc trace VideoDecoder do wrapper ở page ghi (xem pageHtml):
// snapshot() deep-copy danh sách instance + sự kiện; reset() xóa
// để trace mỗi attempt độc lập (gọi sau blobNew, trước wantedOn).
// t0Perf = mốc toggle (performance.now tuyệt đối trong page);
// w2startOffset = W2 bắt đầu sau t0 bao nhiêu ms (cùng 1 eval
// toggleAndW2 nên ~0 ms — dùng để đổi durMs W2 sang đồng hồ t0
// khi tách gap, thay vì bỏ qua như C2).
Y.vdTrace = () => (window.__vdTrace ? window.__vdTrace.snapshot() : null);
Y.vdReset = () => { if (window.__vdTrace) window.__vdTrace.reset(); return true; };
Y.vdInstalled = () => !!(window.__vdTrace && window.__vdTrace.installed === true);
Y.t0Perf = () => Y._t0Perf ?? null;
Y.w2startOffset = () => ((Y._w2startPerf ?? Y._t0Perf ?? 0) - (Y._t0Perf ?? 0));
Y.w2snap = () => {
  const lk = ctrl ? ctrl["lastWindowKey"] ?? null : null;
  const lr = ctrl ? ctrl["lastDecodeRange"] ?? null : null;
  return { lastWindowKey: lk, lastDecodeRange: lr ? { from: lr.from, to: lr.to } : null, cacheSize: ctrl ? ctrl.cacheSize : null, cacheFrameCount: ctrl ? ctrl.cacheFrameCount : null, failed: ctrl ? ctrl.failed : null };
};
// C2: phơi prefetch đang bay (khóa "from:to" trong Set inFlight của
// ReverseDecodeAhead) + aheadRange + settled counter thật — chỉ
// harness đọc qua bracket access, KHÔNG sửa production.
Y.prefetchKeys = () => {
  const da = ctrl ? ctrl["decodeAhead"] : null;
  let keys = [];
  try { const s = da ? da["inFlight"] : null; keys = s ? [...s] : []; } catch {}
  const ar = ctrl ? ctrl["aheadRange"] ?? null : null;
  const lr = ctrl ? ctrl["lastDecodeRange"] ?? null : null;
  return {
    keys,
    aheadRange: ar ? { from: ar.from, to: ar.to } : null,
    lastWindowKey: ctrl ? ctrl["lastWindowKey"] ?? null : null,
    lastDecodeRange: lr ? { from: lr.from, to: lr.to } : null,
    cacheSize: ctrl ? ctrl.cacheSize : null,
    settled: ctrl ? ctrl["settledPrefetchDropped"] ?? null : null,
    decodeInFlight: ctrl ? ctrl.decodeWindowInFlight : false,
  };
};
// C2: số frame mới còn lại của prefetch ĐANG CHẠY, tính từ gốc sống
// (lastDecodeRange) + aheadRange hiện tại, theo đúng settle47C2.ts
// (cùng số học mà test 24/24 đã khóa — không tính lại bằng tay).
Y.remaining47C2 = () => {
  const pk = Y.prefetchKeys();
  const windowRange = pk.lastDecodeRange;
  const windowSize = windowRange ? windowRange.to - windowRange.from + 1 : 0;
  const newFrames = prefetchNewFrames(windowRange, pk.aheadRange);
  const remaining = remainingNewFrames(windowSize, newFrames, pk.cacheSize ?? 0);
  return { ...pk, windowSize, newFrames, remaining, operativeKey: operativePrefetchKey(pk.aheadRange) };
};
// C2: tắt + khởi động W2 hỏng trong CÙNG 1 eval (không còn 2 vòng
// CDP giữa toggle và W2), mốc t0 trên đồng hồ performance.now.
Y.toggleAndW2 = (t) => {
  Y._t0Perf = performance.now();
  setReverseDecodeAheadWanted(false);
  Y._w2startPerf = performance.now();
  Y.windowAsync(t);
  return { t0Perf: Y._t0Perf, w2startPerf: Y._w2startPerf };
};
// C2: một mẫu trace trên cùng đồng hồ performance.now (t tương đối
// theo t0 của toggleAndW2) — gap settle−W2 không còn sai số vòng CDP.
Y.sample = () => {
  const s = reverseDecodeAheadStatus();
  const t0 = Y._t0Perf ?? performance.now();
  return { t: performance.now() - t0, inFlight: s.inFlightPrefetchWindows, settled: s.settledPrefetchDroppedFrames, winInFlight: s.decodeWindowInFlight, cache: s.cacheFrames, prefetch: s.prefetchFrames, ui: s.uiStatus };
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
window.__d2 = Y;
`);
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "d2-bundle.mjs");
const b = spawnSync(esbuild, [entryPath, "--bundle", "--platform=browser", "--format=esm", `--outfile=${bundleOut}`], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) throw new Error("esbuild bundle lỗi: " + ((b.stderr || b.stdout || "")).slice(0, 500));
console.log(`bundle: ${bundleOut} (${fs.statSync(bundleOut).size} byte)`);

// D2: bundle số học tách pha (settle48D2.ts) rồi import động —
// harness Node dùng CHUNG một định nghĩa với test 24/24, không
// tính lại bằng tay trong harness.
const d2SplitPath = path.join(SCRATCH, "d2-split.mjs");
const b2 = spawnSync(esbuild, [path.join(REPO, "apps/web/src/lib/settle48D2.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${d2SplitPath}`], { stdio: "pipe", encoding: "utf8" });
if (b2.status !== 0) throw new Error("esbuild d2-split lỗi: " + ((b2.stderr || b2.stdout || "")).slice(0, 500));
const { analyzeVdTrace } = await import(pathToFileURL(d2SplitPath).href);
console.log(`d2-split: ${d2SplitPath} (${fs.statSync(d2SplitPath).size} byte)`);

// ---- 2. Server HTTP: page + bundle + fixture (Range thật) ----
async function serveRange(req, res) {
  const range = req.headers.range;
  if (req.method === "HEAD") {
    res.writeHead(200, { "Content-Length": fileSize, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
    res.end();
    return;
  }
  if (!range) {
    res.writeHead(200, { "Content-Length": fileSize, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
    res.end(fileBuf);
    return;
  }
  const m = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!m) { res.writeHead(416); res.end(); return; }
  const start = Number(m[1]);
  const end = m[2] === "" ? fileSize - 1 : Math.min(Number(m[2]), fileSize - 1);
  const chunk = fileBuf.subarray(start, end + 1);
  res.writeHead(206, { "Content-Range": `bytes ${start}-${end}/${fileSize}`, "Content-Length": chunk.length, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
  res.end(chunk);
}
const pageHtml = `<!doctype html><meta charset="utf-8"><title>D2 settle headed</title>
<body><div id="ready">loading</div>
<script>
// D2 — bọc window.VideoDecoder TRƯỚC khi bundle module load (script
// classic chạy trước <script type="module">). Subclass ghi lại mọi
// sự kiện trên cùng đồng hồ performance.now() của page rồi chuyển
// tiếp y nguyên cho native (output/error gốc vẫn chạy; static
// isConfigSupported bind về native để probe của production không
// đổi hành vi). KHÔNG sửa production code — chỉ đọc thêm.
// window.__vdTrace.installed = true khi gán window.VideoDecoder
// thành công (harness kiểm tra ở main, fail nhanh nếu không bọc
// được thay vì chạy race mù).
(function () {
  var NativeVD = window.VideoDecoder;
  if (!NativeVD || window.__vdTrace) return;
  var nextId = 1;
  var instances = [];
  window.__vdTrace = {
    instances: instances,
    installed: false,
    snapshot: function () { return { instances: JSON.parse(JSON.stringify(instances)) }; },
    reset: function () { instances.length = 0; }
  };
  function now() { return performance.now(); }
  class TracedVideoDecoder extends NativeVD {
    constructor(init) {
      var rec = { id: nextId++, createdAt: now(), events: [] };
      instances.push(rec);
      var wrapped = {
        output: function (frame) {
          var ts = null;
          try { ts = frame.timestamp; } catch (e) {}
          rec.events.push({ t: now(), kind: "output", ts: ts });
          init.output(frame);
        },
        error: function (e) {
          var detail = "";
          try { detail = (e && e.message) ? e.message : String(e); } catch (_) { detail = "?"; }
          rec.events.push({ t: now(), kind: "error", detail: detail });
          init.error(e);
        }
      };
      super(wrapped);
      this.__vdRec = rec;
    }
    configure(config) {
      this.__vdRec.events.push({ t: now(), kind: "configure" });
      return super.configure(config);
    }
    decode(chunk) {
      var ts = null, ct = null;
      try { ts = chunk.timestamp; } catch (e) {}
      try { ct = chunk.type; } catch (e) {}
      try {
        var r = super.decode(chunk);
        this.__vdRec.events.push({ t: now(), kind: "decode", ts: ts, chunkType: ct });
        return r;
      } catch (e) {
        this.__vdRec.events.push({ t: now(), kind: "decode-throw", ts: ts, chunkType: ct, detail: String(e && e.message ? e.message : e) });
        throw e;
      }
    }
    flush() {
      this.__vdRec.events.push({ t: now(), kind: "flush-call" });
      var rec = this.__vdRec;
      var p = super.flush();
      p.then(function () { rec.events.push({ t: now(), kind: "flush-done" }); },
        function (e) { rec.events.push({ t: now(), kind: "flush-done", detail: "reject: " + String(e && e.message ? e.message : e) }); });
      return p;
    }
    close() {
      this.__vdRec.events.push({ t: now(), kind: "close" });
      return super.close();
    }
  }
  TracedVideoDecoder.isConfigSupported = NativeVD.isConfigSupported.bind(NativeVD);
  window.VideoDecoder = TracedVideoDecoder;
  window.__vdTrace.installed = (window.VideoDecoder === TracedVideoDecoder);
})();
</script>
<script type="module">
import "./d2-bundle.mjs";
document.getElementById("ready").textContent = "ready";
</script></body>`;
const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/page.html") { res.writeHead(200, { "Content-Type": "text/html" }); res.end(pageHtml); }
  else if (req.url === "/d2-bundle.mjs") { res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); }
  else if (req.url === "/asset-source.mp4") serveRange(req, res);
  else { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
console.log(`server: http://127.0.0.1:${HTTP_PORT}/ (fixture asset, Range thật)`);

// ---- 3. CDP helpers (mẫu B1) ----
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

let chromeProc = null, xvfbProc = null, cdpGlobal = null;
function killAll() {
  try { cdpGlobal?.ws?.close(); } catch {}
  try { chromeProc?.kill("SIGKILL"); } catch {}
  try { xvfbProc?.kill("SIGKILL"); } catch {}
  try { server.close(); } catch {}
}

// D2: phân tích trace VideoDecoder — dùng analyzeVdTrace từ
// settle48D2.ts (đã bundle sang d2-split.mjs): phân loại instance,
// đếm decoded trực tiếp của W2, tách gap feed/flush/drain với chốt
// chặn đổi đồng hồ tuyệt đối → tương đối t0 (xem prefetchTailSpans).
// Hàm local cũ đã xóa để khỏi hai nguồn số học lệch nhau.

// ---- 4. Race driver C2 (aim theo remaining thật, cổng prefetch đang chạy) ----
async function attemptRace(cdp, newFn, opts = {}) {
  const slack = opts.slack ?? SLACK;
  const log = [];
  const setup = await newFn();
  log.push(`setup: ok=${setup.ok} gopMode=${setup.gopMode} probe=${JSON.stringify(setup.probe)} fallback=${setup.fallback} fps=${setup.measurementFps} cache=${setup.cacheSize}`);
  const setupSnap = await cdp.evalJs(`window.__d2.w2snap()`).catch(() => null);
  log.push(`setupSnap: lastWindowKey=${setupSnap?.lastWindowKey} lastDecodeRange=${JSON.stringify(setupSnap?.lastDecodeRange)}`);
  if (!setup.ok) return { cls: "INVALID-setup", log, setup };
  // D2: reset trace VideoDecoder sau blobNew (setup decode đã xong)
  // để trace mỗi attempt độc lập: chỉ còn prefetch setup, decode
  // cửa sổ 412, prefetch 412, W2.
  await cdp.evalJs(`window.__d2.vdReset()`).catch(() => {});
  log.push(`vdTrace: reset sau blobNew`);
  let dec = await cdp.evalJs(`window.__d2.wantedOn()`);
  let st = await cdp.evalJs(`window.__d2.status()`);
  log.push(`gate lần 1: verdict=${dec?.verdict} reasons=${JSON.stringify(dec?.reasons)} active=${st.active} ui=${st.uiStatus} fps=${st.measurementFps}`);
  let prefetchAlreadyStarted = false;
  if (!st.active) {
    for (const gt of [PREFETCH_T, ...GATE_RETRY_T]) {
      const w2 = await cdp.evalJs(`window.__d2.windowSync(${gt})`);
      st = await cdp.evalJs(`window.__d2.status()`);
      log.push(`gate thử lại (cửa sổ ${gt}): windowOk=${w2.ok} active=${st.active} ui=${st.uiStatus} fps=${st.measurementFps} reasons=${JSON.stringify(st.reasons)}`);
      if (st.active) { prefetchAlreadyStarted = true; break; }
    }
    if (!st.active) return { cls: "INVALID-gate-blocked", log, setup, gate: dec };
  }
  if (!prefetchAlreadyStarted) await cdp.evalJs(`window.__d2.windowAsync(${PREFETCH_T})`);
  let pre = null;
  const poll0 = Date.now();
  while (Date.now() - poll0 < 90000) {
    const m = await cdp.evalJs(`window.__d2.status()`);
    if ((m?.inFlightPrefetchWindows ?? 0) >= 1) { pre = m; break; }
    await sleep(5);
  }
  if (!pre) return { cls: "INVALID-no-prefetch-inflight", log, setup };
  log.push(`prefetch bay: inFlight=${pre.inFlightPrefetchWindows} cache=${pre.cacheFrames} prefetchFrames=${pre.prefetchFrames} settled=${pre.settledPrefetchDroppedFrames}`);
  // Cổng 412 (giữ nguyên B1): chờ decode cửa sổ prefetch xong.
  {
    const wait0 = Date.now();
    let done412 = false;
    while (Date.now() - wait0 < 30000) {
      const snap412 = await cdp.evalJs(`window.__d2.w2snap()`).catch(() => null);
      const st412 = await cdp.evalJs(`window.__d2.status()`).catch(() => null);
      if (snap412 && snap412.lastWindowKey !== setupSnap?.lastWindowKey && !st412?.decodeWindowInFlight) { done412 = true; log.push(`cổng 412: decode cửa sổ prefetch xong, lastWindowKey=${snap412.lastWindowKey} (setup key=${setupSnap?.lastWindowKey})`); break; }
      await sleep(20);
    }
    if (!done412) return { cls: "INVALID-prefetch-window-not-done", log, setup, aim: "not-started" };
  }
  // C2 cổng prefetch đang chạy: chờ tới khi chỉ còn đúng prefetch
  // của aheadRange hiện tại bay (prefetch setup đã settle). Nếu
  // prefetch đang chạy đã gần xong (remaining <= slack) thì tắt ngay,
  // không chờ thêm (chờ sẽ để nó settle mất). Nếu nó settle mất
  // trong lúc chờ thì attempt INVALID (ghi rõ, không đo nhầm).
  let gateInfo = null;
  {
    const g0 = Date.now();
    let firstKeys = null;
    let outcome = null;
    while (Date.now() - g0 < 20000) {
      const rk = await cdp.evalJs(`window.__d2.remaining47C2()`).catch(() => null);
      if (!rk) { outcome = "error-remaining"; break; }
      if (firstKeys === null) firstKeys = rk.keys;
      const op = rk.operativeKey;
      if (op !== null && rk.keys.length === 1 && rk.keys[0] === op) { outcome = "only-operative"; gateInfo = rk; break; }
      if (rk.remaining <= slack) { outcome = "remaining-critical-bypass"; gateInfo = rk; break; }
      if (op !== null && !rk.keys.includes(op)) { outcome = "operative-settled"; break; }
      if (rk.keys.length === 0) { outcome = "no-prefetch"; break; }
      await sleep(10);
    }
    const gateMs = Date.now() - g0;
    if (!gateInfo) return { cls: `INVALID-operative-gate-${outcome ?? "timeout"}`, log, setup, aim: "not-started", gateFirstKeys: firstKeys };
    log.push(`cổng prefetch C2: ${outcome} sau ${gateMs} ms (keys đầu=${JSON.stringify(firstKeys)} → keys lúc aim=${JSON.stringify(gateInfo.keys)} operative=${gateInfo.operativeKey} aheadRange=${JSON.stringify(gateInfo.aheadRange)} windowSize=${gateInfo.windowSize} newFrames=${gateInfo.newFrames} remaining=${gateInfo.remaining})`);
  }
  // C2 aim: tắt khi frame mới còn lại <= slack (tính trực tiếp từ
  // gốc sống + aheadRange hiện tại, poll 1 ms). Không dùng target
  // cache tĩnh kiểu B1 nữa.
  let aim = "timeout-15s";
  let aimEnd = null;
  {
    const aim0 = Date.now();
    while (Date.now() - aim0 < 15000) {
      const rk = await cdp.evalJs(`window.__d2.remaining47C2()`).catch(() => null);
      if (!rk) { aim = "error-remaining"; break; }
      if (rk.keys.length === 0) { aim = "settled-during-aim"; break; }
      if (rk.operativeKey !== null && !rk.keys.includes(rk.operativeKey)) { aim = "settled-during-aim"; break; }
      if (rk.remaining <= slack) { aim = "remaining-tight"; aimEnd = rk; break; }
      await sleep(1);
    }
    log.push(`aim C2: ${aim} (slack=${slack}, remaining lúc tắt=${aimEnd?.remaining ?? "?"}, cache=${aimEnd?.cacheSize ?? "?"}, keys=${JSON.stringify(aimEnd?.keys ?? null)}, windowSize=${aimEnd?.windowSize ?? "?"}, newFrames=${aimEnd?.newFrames ?? "?"})`);
  }
  if (aim === "settled-during-aim") return { cls: "INVALID-settled-before-toggle", log, setup, aim };
  if (aim !== "remaining-tight") return { cls: `INVALID-aim-${aim}`, log, setup, aim };
  const preToggle = await cdp.evalJs(`window.__d2.status()`);
  const preToggleR = await cdp.evalJs(`window.__d2.remaining47C2()`).catch(() => null);
  if ((preToggle?.inFlightPrefetchWindows ?? 0) < 1) return { cls: "INVALID-settled-before-toggle", log, setup, aim };
  const aimTarget = (preToggleR?.windowSize ?? 0) + (preToggleR?.newFrames ?? 0) - slack;
  log.push(`preToggle: cache=${preToggle?.cacheFrames} remaining=${preToggleR?.remaining} (mốc cache đúng=${aimTarget}) keys=${JSON.stringify(preToggleR?.keys)}`);
  const preW2 = await cdp.evalJs(`window.__d2.w2snap()`).catch(() => null);
  const preW2Status = await cdp.evalJs(`window.__d2.status()`).catch(() => null);
  log.push(`preW2 mirror: lastWindowKey=${preW2?.lastWindowKey} lastDecodeRange=${JSON.stringify(preW2?.lastDecodeRange)} cacheSize=${preW2?.cacheSize} failed=${preW2?.failed} decodeWindowInFlight=${preW2Status?.decodeWindowInFlight}`);
  if (preW2Status?.decodeWindowInFlight) return { cls: "INVALID-decode-in-flight-at-w2", log, setup, aim };
  // Tắt + khởi động W2 hỏng trong CÙNG 1 eval (toggleAndW2); trace
  // lấy mẫu bằng performance.now trong page.
  await cdp.evalJs(`window.__d2.toggleAndW2(${CORRUPT_T})`);
  const trace = [];
  {
    const trace0 = Date.now();
    let w2Seen = false;
    while (Date.now() - trace0 < 60000) {
      const s = await cdp.evalJs(`window.__d2.sample()`).catch(() => null);
      if (!s) break;
      trace.push(s);
      if (s.winInFlight) w2Seen = true;
      if (w2Seen && !s.winInFlight) break;
      await sleep(2);
    }
  }
  const postTrace = [];
  {
    const post0 = Date.now();
    while (Date.now() - post0 < 10000 && postTrace.length < 3000) {
      const s = await cdp.evalJs(`window.__d2.sample()`).catch(() => null);
      if (!s) break;
      postTrace.push(s);
      if (s.inFlight === 0) break;
      await sleep(5);
    }
  }
  const w2timing = await cdp.evalJs(`window.__d2.w2timing()`).catch(() => null);
  const w2drawn = await cdp.evalJs(`window.__d2.w2drawn()`).catch(() => null);
  const postW2 = await cdp.evalJs(`window.__d2.w2snap()`).catch(() => null);
  log.push(`W2 timing: ${JSON.stringify(w2timing)} drawn-after-W2: ${JSON.stringify(w2drawn)}`);
  log.push(`postW2 mirror: lastWindowKey=${postW2?.lastWindowKey} lastDecodeRange=${JSON.stringify(postW2?.lastDecodeRange)} cacheSize=${postW2?.cacheSize} failed=${postW2?.failed}`);
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
      classification = await cdp.evalJs(`window.__d2.w2classifyReal(${postRange.from}, ${postRange.to}, ${decoded}, true, ${preW2?.cacheSize ?? 0}, ${JSON.stringify(preW2?.lastWindowKey ?? null)})`).catch(() => null);
      log.push(`W2 classify (range thật): decodedProxy=${decoded} (${decodedKind}), drawnCrossCheck=${drawnOk} (drawn=${JSON.stringify(w2drawn)}), diagnostic=${classification?.diagnostic} expectedOk=${classification?.expectedOk} consistent=${classification?.consistent} :: ${classification?.detail}`);
    } else if (w2ok === true && !rangeChanged) {
      const isFast = preW2?.lastWindowKey !== null && postW2?.lastWindowKey === preW2?.lastWindowKey && (preW2?.cacheSize ?? 0) > 0;
      decodedKind = isFast ? "fast-path-no-decode" : "anomaly-no-new-range";
      classification = postRange
        ? await cdp.evalJs(`window.__d2.w2classifyReal(${postRange.from}, ${postRange.to}, null, true, ${preW2?.cacheSize ?? 0}, ${JSON.stringify(preW2?.lastWindowKey ?? null)})`).catch(() => null)
        : null;
      log.push(`W2 classify (range KHÔNG đổi): kind=${decodedKind}, diagnostic=${classification?.diagnostic} :: ${classification?.detail}`);
    } else if (w2ok === false) {
      decoded = 0; decodedKind = "inferred-from-fail-law";
      classification = await cdp.evalJs(`window.__d2.w2classifyFail()`).catch(() => null);
      log.push(`W2 classify (fail): decoded=${decoded} (${decodedKind}), range sau W2 (CŨ, không dùng)=${JSON.stringify(postRange)}, diagnostic=${classification?.diagnostic} :: ${classification?.detail}`);
    } else {
      log.push(`W2 classify: KHÔNG XÁC ĐỊNH (w2timing=${JSON.stringify(w2timing)})`);
    }
    w2obs = { preW2, postW2, w2timing, w2drawn, decoded, decodedKind, classification, aim, decodeInFlightAtW2Start: preW2Status?.decodeWindowInFlight ?? null };
  }
  const all = [...trace, ...postTrace];
  const settleIdx = all.findIndex((s, i) => i > 0 && s.inFlight === 0 && all[i - 1].inFlight >= 1);
  // D2: lấy trace VideoDecoder + phân tích (kể cả khi không thấy
  // settle — decoded trực tiếp của W2 vẫn có giá trị chẩn đoán).
  async function fetchD2(settleAtMsOrNull) {
    const vd = await cdp.evalJs(`window.__d2.vdTrace()`).catch(() => null);
    const t0 = await cdp.evalJs(`window.__d2.t0Perf()`).catch(() => null);
    const w2off = await cdp.evalJs(`window.__d2.w2startOffset()`).catch(() => 0);
    const w2endRel = w2timing?.durMs != null ? w2timing.durMs + (w2off || 0) : null;
    const d2 = analyzeVdTrace(vd, t0, w2endRel, settleAtMsOrNull);
    // Giữ raw snapshot để đối chiếu lại sau (audit): vdRaw chỉ ghi
    // file JSON, không dùng để tính toán (tính toán dùng d2).
    const out = { d2, vdRaw: vd };
    if (d2) {
      log.push(`D2 vdTrace: ${d2.instanceCount} decoder instance (w2=${d2.w2Candidates}, prefetch=${d2.prefetchCandidates}, other=${d2.instanceCount - d2.w2Candidates - d2.prefetchCandidates})`);
      if (d2.w2decoded) log.push(`D2 W2 decoded trực tiếp: ${d2.w2decoded.detail}`);
      if (d2.split) log.push(`D2 gap tách pha: ${d2.split.detail}`);
      const pf = d2.instances.find((x) => x.role === "prefetch");
      if (pf) log.push(`D2 prefetch: feed ${pf.feed ? `${pf.feed.count} chunk [${pf.feed.start.toFixed(1)}, ${pf.feed.end.toFixed(1)}]` : "?"}, flush ${pf.flush ? `call ${pf.flush.call.toFixed(1)} done ${pf.flush.done?.toFixed(1) ?? "?"}` : "?"}, output trước W2end=${d2.prefetchOutputsBeforeW2end}/${d2.prefetchOutputsTotal}`);
    } else {
      log.push(`D2 vdTrace: KHÔNG LẤY ĐƯỢC (vd=${vd ? "có" : "null"}, t0=${t0})`);
    }
    return out;
  }
  if (settleIdx < 0) {
    const d2res = await fetchD2(null);
    return { cls: `INVALID-no-settle (${all.length} mẫu, w2Seen=${trace.some((s) => s.winInFlight)})`, log, setup, trace: all, w2timing, w2obs, aim, remainingAtToggle: preToggleR?.remaining ?? null, cacheAtToggle: preToggle?.cacheFrames ?? null, d2: d2res.d2, vdRaw: d2res.vdRaw };
  }
  const ss = all[settleIdx];
  const prev = all[settleIdx - 1];
  const finalS = all[all.length - 1];
  const deferredHere = ss.winInFlight === true && ss.settled === prev.settled && ss.cache >= prev.cache;
  const settledDelta = finalS.settled - ss.settled;
  const cacheDrop = ss.cache - finalS.cache;
  // C2: gap đo trên cùng đồng hồ performance.now: settle.t − durMs W2
  // (t=0 là lúc toggleAndW2 chạy trong page; W2 bắt đầu ngay sau đó,
  // sai số còn lại < 1 ms vì cùng 1 eval).
  const gapMs = w2timing?.durMs != null ? +(ss.t - w2timing.durMs).toFixed(1) : null;
  // C2-rerun: đo tốc độ decode sau toggle từ mẫu TRƯỚC khi
  // settle-drop (prev.cache chưa trừ 90 frame của drop). Dùng
  // ss.cache như bản trước ra số âm sai (cache 211→121 trong lúc
  // settle) — đã sửa, xem LIMITS C2 §5.
  const postToggleRate = prev.t > 0 ? +(((prev.cache - (preToggle?.cacheFrames ?? prev.cache)) / prev.t) * 1000).toFixed(1) : null;
  const detail = `aim=${aim} slack=${slack}; settle +${ss.t.toFixed(1)} ms: winInFlight=${ss.winInFlight} settled ${prev.settled}→${ss.settled} cache ${prev.cache}→${ss.cache} deferredHere=${deferredHere}; cuối +${finalS.t.toFixed(1)} ms: winInFlight=${finalS.winInFlight} settled=${finalS.settled} (delta=${settledDelta}) cache=${finalS.cache} (sụt=${cacheDrop}) ui=${finalS.ui} prefetch=${finalS.prefetch}; gap settle−W2end=${gapMs} ms; tốc độ decode sau toggle=${postToggleRate} frame/s (cache ${preToggle?.cacheFrames}→${prev.cache} trước drop, trong ${prev.t.toFixed(1)} ms)`;
  log.push(detail);
  const base = { log, setup, trace: all, settleAtMs: +ss.t.toFixed(1), finalAtMs: +finalS.t.toFixed(1), settledBefore: prev.settled, settledFinal: finalS.settled, settledDelta, cacheAtSettle: ss.cache, cacheFinal: finalS.cache, cacheDrop, w2timing, w2drawn, w2obs, aim, slack, gapMs, postToggleRateFps: postToggleRate, remainingAtToggle: preToggleR?.remaining ?? null, cacheAtToggle: preToggle?.cacheFrames ?? null };
  const d2res = await fetchD2(ss.t);
  base.d2 = d2res.d2;
  base.vdRaw = d2res.vdRaw;
  if (deferredHere && finalS.winInFlight === false && settledDelta >= 1 && cacheDrop === settledDelta && finalS.ui === "off" && finalS.prefetch === 0) {
    return { cls: "SUCCESS", ...base };
  }
  const immDelta = finalS.settled - prev.settled;
  const immDrop = prev.cache - finalS.cache;
  if (!deferredHere && immDelta >= 1 && immDrop === immDelta && finalS.ui === "off") {
    return { cls: "PARTIAL-immediate-drop", ...base, settledDelta: immDelta, cacheDrop: immDrop };
  }
  return { cls: `INVALID-${deferredHere ? "final-mismatch" : "not-deferred"}`, ...base };
}

async function runPhase(cdp, label, newFn, opts = {}) {
  const attempts = [];
  const maxAttempts = opts.maxAttempts || MAX_ATTEMPTS;
  const wantSuccess = opts.wantSuccess ?? 2; // dừng khi đủ 2 SUCCESS (1 bắt + 1 xác nhận)
  let successCount = 0;
  for (let a = 1; a <= maxAttempts; a++) {
    const r = await attemptRace(cdp, newFn, opts).catch((e) => ({ cls: "ERROR-" + e.message.slice(0, 200), log: [`lỗi attempt: ${e.message}`] }));
    attempts.push({ attempt: a, cls: r.cls, log: r.log, aim: r.aim, slack: opts.slack ?? SLACK, gapMs: r.gapMs ?? null, remainingAtToggle: r.remainingAtToggle ?? null, cacheAtToggle: r.cacheAtToggle ?? null, settleAtMs: r.settleAtMs ?? null, w2obs: r.w2obs, trace: r.trace ?? null, d2: r.d2 ?? null, vdRaw: r.vdRaw ?? null });
    // C2-rerun: ghi kết quả từng phần ngay sau mỗi attempt (lượt trước
    // bị daemon restart giết giữa chừng nên mất cả d2-result.json —
    // chỉ còn stdout log). File này là bằng chứng dự phòng, không thay
    // d2-result.json cuối lượt.
    try { writeFileEpermRetry(path.join(SCRATCH, "d2-result-partial.json"), JSON.stringify({ phase: label, successCount, attempts }, null, 2)); } catch {}
    console.log(`  [${label} attempt ${a}] ${r.cls} (aim=${r.aim} slack=${opts.slack ?? SLACK} gap=${r.gapMs ?? "?"} ms remainingAtToggle=${r.remainingAtToggle ?? "?"})`);
    for (const l of r.log || []) console.log(`    ${l}`);
    if (r.cls === "SUCCESS") successCount++;
    await cdp.evalJs(`window.__d2.disposeAll()`).catch(() => {});
    await sleep(500);
    if (successCount >= wantSuccess) break;
  }
  return { ok: successCount > 0, successCount, attempts };
}

async function main() {
  console.log(`loadavg lúc bắt đầu: ${loadavg()}`);
  let display = process.env.DISPLAY || null;
  let xvfb = null;
  if (!display) {
    for (const num of [96, 97, 98, 99, 92, 91]) {
      xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
      await sleep(800);
      if (xvfb.exitCode === null) { display = `:${num}`; break; }
      xvfb = null;
    }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  xvfbProc = xvfb;
  console.log(`xvfb: DISPLAY=${display} (headed thật, không cờ --headless)`);
  const profile = path.join(SCRATCH, "cdprof-d2");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "d2-chrome.log"), "w");
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
  record("T0 headed chrome + Xvfb + server Range", true, `DISPLAY=${display} debugPort=${DEBUG_PORT} httpPort=${HTTP_PORT}`);

  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/page.html` });
  await cdp.waitFor(async () => { const r = await cdp.evalJs(`!!window.__d2 && document.getElementById("ready")?.textContent === "ready"`); return r || null; }, "page D2 ready", 90000);

  // D2: kiểm tra wrapper VideoDecoder đã bọc thành công TRƯỚC khi
  // đo — nếu không bọc được thì race sẽ mù (không có trace), dừng
  // ngay thay vì chạy 6 attempt rồi mới biết.
  const vdInstalled = await cdp.evalJs(`window.__d2.vdInstalled()`).catch(() => false);
  record("D2(V0) wrapper VideoDecoder đã bọc (installed=true)", vdInstalled === true,
    vdInstalled === true ? "window.VideoDecoder là TracedVideoDecoder, trace sẽ ghi đủ instance" : "KHÔNG bọc được VideoDecoder — dừng, không đo mù");
  if (vdInstalled !== true) { killAll(); process.exit(1); }

  const assetSetup = await cdp.evalJs(`window.__d2.assetSetup()`);
  console.log(`  [asset setup] ${JSON.stringify(assetSetup)}`);
  const assetOk = !!assetSetup.blobUrl && assetSetup.restoredSrcs.length === 1 && assetSetup.failedSrcs.length === 0;
  const probeReady = assetOk && assetSetup.size === assetSetup.manifestSize;
  record("D2(A0) probe asset: trước race (headed, IDB thật)", probeReady,
    `assetId=${assetSetup.assetId} blobUrl=${assetSetup.blobUrl ? "blob:..." : null} size=${assetSetup.size} manifestSize=${assetSetup.manifestSize} restored=${JSON.stringify(assetSetup.restoredSrcs)} failed=${JSON.stringify(assetSetup.failedSrcs)} skipped=${JSON.stringify(assetSetup.skipped)}`);

  // Pha C — race asset: với aim C2 (slack 3), tối đa 6 attempt.
  // D2 KHÔNG săn SUCCESS: wantSuccess đặt cao để chạy đủ 6 attempt
  // lấy mẫu tách pha (kể cả khi 1 attempt SUCCESS thì vẫn đo tiếp).
  // Không có pha D1 probe W2, không có sóng 2 slack=1 (đợt 47 §4.2
  // cấm siết aim/dời mốc W2 — D2 chỉ đo).
  let capture = { ok: false, successCount: 0, attempts: [] };
  if (probeReady) {
    capture = await runPhase(cdp, "ASSET-D2", () => cdp.evalJs(`window.__d2.blobNew()`), { slack: SLACK, maxAttempts: MAX_ATTEMPTS, wantSuccess: 99 });
    record("D2(C) race đường asset: với aim C2 (headed, 6 attempt đo tách pha)", true,
      `${capture.successCount} SUCCESS sau ${capture.attempts.length} attempt: ${capture.attempts.map((a) => `${a.cls}(gap=${a.gapMs}ms,rem=${a.remainingAtToggle})`).join(", ")}`);
  }

  const out = { fileSize, assetSetup, probeReady, capture };
  writeFileEpermRetry(path.join(SCRATCH, "d2-result.json"), JSON.stringify(out, null, 2));
  console.log(`loadavg lúc kết thúc: ${loadavg()}`);
  const w2ObsCount = (capture.attempts || []).filter((a) => a.aim === "remaining-tight" && a.w2obs).length;
  const d2OkCount = (capture.attempts || []).filter((a) => a.d2 && a.d2.w2decoded && a.d2.split).length;
  console.log(`\n== D2 headed: probe=${probeReady} assetSuccess=${capture.ok} successCount=${capture.successCount} ultraW2Obs=${w2ObsCount} d2Complete=${d2OkCount}/${capture.attempts.length} ==`);
  killAll();
  return w2ObsCount >= 1 && d2OkCount >= 1 ? 0 : 1;
}
main().then((code) => { killAll(); process.exit(code); }).catch((e) => { console.error(`FATAL: ${e.message}`); killAll(); process.exit(1); });
