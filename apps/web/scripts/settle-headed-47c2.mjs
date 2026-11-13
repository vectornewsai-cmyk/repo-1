// settle-headed-47c2.mjs — Phase 9 đợt 47, luồng C2: bắt SUCCESS đường
// asset: (settle-drop dọn đúng entry đang thử lại).
//
// Nợ mở: docs/PHASE9_ROUND46_B1_SETTLE_LIMITS.md §6.1 + §3.3 (SUCCESS
// đường asset: vẫn mở, 0/4 attempt; 2 attempt ultra-tight trượt sau W2
// chỉ ~36–43 ms) và docs/PHASE9_ROUND46_LIMITS.md §4 mục 2.
// Đọc kỹ 2 file đó trước khi sửa harness này.
//
// QUYẾT ĐỊNH ĐỔI BIẾN ĐO (ghi rõ, xem thêm LIMITS C2 §1):
//   (1) AIM CHẶT HƠN VỚI BASELINE ĐÚNG — biến chính của C2. Aim B1
//       dùng gốc setup.cacheSize = 91 (cửa sổ setup đã bị evict) +
//       prefetchFrames của prefetch SETUP (107) trong khi prefetch
//       đang chạy là của cửa sổ 412 (136 frame, 90 frame mới) —
//       mốc đúng cho slack 3 là cache 208 (121 + 90 − 3), B1 tắt ở
//       201–203. C2 tính "còn lại" trực tiếp từ lastDecodeRange +
//       aheadRange hiện tại (module settle47C2.ts, đã khóa test
//       24/24) và chờ tới khi chỉ còn đúng prefetch đó bay mới aim.
//       Slack giữ nguyên 3 ở sóng 1 (chỉ sửa gốc + khung, không đổi
//       2 biến cùng lúc); sóng 2 (slack 1) chỉ chạy khi sóng 1 chứng
//       minh còn lại-lúc-tắt > slack là chỗ nghẽn.
//   (2) W2 CHẬM HƠN — CHỈ ĐO CHẨN ĐOÁN, không áp dụng: pha D1 đo
//       durMs W2 ở mốc 32,4667 s (targetPos 974) vs mốc muộn nhất
//       còn trọn GOP hỏng 32,9667 s (targetPos 989, xem
//       w2WindowInsideCorrupt) trên controller sạch, wanted tắt.
//       Nếu durMs phẳng (~160–180 ms) thì hướng "W2 chậm hơn" bị
//       khóa bằng số đo (đường blob: không có server delay — đặt
//       delay là mạo nhận như B1 đã ghi; thời gian fail chủ yếu là
//       load() fetch lại blob 69 MB + demux, không phải số frame).
//   (3) Timing một đồng hồ: toggle + khởi động W2 gộp trong 1 eval
//       (toggleAndW2), trace lấy mẫu bằng performance.now() trong
//       page (sample()) nên gap settle−W2 không còn sai số vòng
//       CDP (~2 ms) như B1.
//
// Tiêu chí SUCCESS/PARTIAL/INVALID giữ nguyên Y1 (không nới):
// SUCCESS = settle rơi vào trong lúc W2 bay (deferredHere) + cuối
// settled tăng khớp cache sụt + ui off + prefetch 0.
// Exit 0 = đo xong có ≥1 quan sát W2 ultra-tight (kể cả SUCCESS vẫn
// mở); exit 1 = harness lỗi hoặc không có quan sát W2 nào.
// KHÔNG push, KHÔNG sửa production, KHÔNG có pha tab ẩn (B1 đã
// SUCCESS n = 1 ở đó, không đo lại).
//
// Cách chạy (từ gốc repo; script TỰ lo Xvfb + Chrome headed + server):
//   node apps/web/scripts/settle-headed-47c2.mjs
// Biến môi trường: C2_DEBUG_PORT (9486), C2_HTTP_PORT (9038),
// C2_FIX (fixture Y1), C2_CHROME (ms-playwright chromium-1248),
// C2_SCRATCH (~/workspace/tmp-round47-c2), C2_SLACK (3),
// C2_MAX_ATTEMPTS (6), C2_W2PROBE (1), C2_WAVE2 (1).
// Fixture tái dùng của Y1/Z1/B1: 360p GOP 90, 420 s, 69.861.131 byte,
// GOP hỏng zero đúng packet IDR của GOP [30,33) (pos 5378169).
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.C2_SCRATCH || path.join(os.homedir(), "workspace/tmp-round47-c2");
const FIX = process.env.C2_FIX || path.join(os.homedir(), "workspace/tmp-round43-y1/y1-corrupt-gop30-360p-gop90-420s.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.C2_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.C2_DEBUG_PORT || 9486);
const HTTP_PORT = Number(process.env.C2_HTTP_PORT || 9038);
const SETUP_T = 417.0;     // cửa sổ setup: GOP lành cuối [417,420)
const PREFETCH_T = 412.0;  // cửa sổ mới để khởi động prefetch
const GATE_RETRY_T = [407.0, 402.0]; // cửa sổ thử cổng thêm (mỗi lần đo lại fps)
const CORRUPT_T = 974 / 30; // 32,4667 s: targetPos 974, mirror A1 [900,974] trọn GOP hỏng [30,33)
const CORRUPT_T_LATE = 989 / 30; // 32,9667 s: targetPos 989, mốc muộn nhất còn trọn GOP hỏng (probe D1)
const SLACK = Number(process.env.C2_SLACK || 3);
const MAX_ATTEMPTS = Number(process.env.C2_MAX_ATTEMPTS || 6);
const DO_W2PROBE = process.env.C2_W2PROBE !== "0";
const ALLOW_WAVE2 = process.env.C2_WAVE2 !== "0";

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
console.log(`C2 config: slack=${SLACK} maxAttempts=${MAX_ATTEMPTS} w2probe=${DO_W2PROBE} wave2=${ALLOW_WAVE2}`);

// ---- 1. Bundle entry (reverseWebcodecs + assetStore + rehydrate + settle47C2) ----
const entryPath = path.join(SCRATCH, "c2-entry.mjs");
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
// C2: probe sạch thời gian W2 (controller mới, wanted tắt, không
// prefetch): đo trực tiếp bằng performance.now trong page.
Y.w2probe = async (t) => {
  const s = performance.now();
  const ok = await ctrl.ensureWindowForTime(t);
  return { t, durMs: performance.now() - s, ok, failed: ctrl.failed };
};
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
window.__c2 = Y;
`);
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "c2-bundle.mjs");
const b = spawnSync(esbuild, [entryPath, "--bundle", "--platform=browser", "--format=esm", `--outfile=${bundleOut}`], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) throw new Error("esbuild bundle lỗi: " + ((b.stderr || b.stdout || "")).slice(0, 500));
console.log(`bundle: ${bundleOut} (${fs.statSync(bundleOut).size} byte)`);

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
const pageHtml = `<!doctype html><meta charset="utf-8"><title>C2 settle headed</title>
<body><div id="ready">loading</div><script type="module">
import "./c2-bundle.mjs";
document.getElementById("ready").textContent = "ready";
</script></body>`;
const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/page.html") { res.writeHead(200, { "Content-Type": "text/html" }); res.end(pageHtml); }
  else if (req.url === "/c2-bundle.mjs") { res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); }
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

// ---- 4. Race driver C2 (aim theo remaining thật, cổng prefetch đang chạy) ----
async function attemptRace(cdp, newFn, opts = {}) {
  const slack = opts.slack ?? SLACK;
  const log = [];
  const setup = await newFn();
  log.push(`setup: ok=${setup.ok} gopMode=${setup.gopMode} probe=${JSON.stringify(setup.probe)} fallback=${setup.fallback} fps=${setup.measurementFps} cache=${setup.cacheSize}`);
  const setupSnap = await cdp.evalJs(`window.__c2.w2snap()`).catch(() => null);
  log.push(`setupSnap: lastWindowKey=${setupSnap?.lastWindowKey} lastDecodeRange=${JSON.stringify(setupSnap?.lastDecodeRange)}`);
  if (!setup.ok) return { cls: "INVALID-setup", log, setup };
  let dec = await cdp.evalJs(`window.__c2.wantedOn()`);
  let st = await cdp.evalJs(`window.__c2.status()`);
  log.push(`gate lần 1: verdict=${dec?.verdict} reasons=${JSON.stringify(dec?.reasons)} active=${st.active} ui=${st.uiStatus} fps=${st.measurementFps}`);
  let prefetchAlreadyStarted = false;
  if (!st.active) {
    for (const gt of [PREFETCH_T, ...GATE_RETRY_T]) {
      const w2 = await cdp.evalJs(`window.__c2.windowSync(${gt})`);
      st = await cdp.evalJs(`window.__c2.status()`);
      log.push(`gate thử lại (cửa sổ ${gt}): windowOk=${w2.ok} active=${st.active} ui=${st.uiStatus} fps=${st.measurementFps} reasons=${JSON.stringify(st.reasons)}`);
      if (st.active) { prefetchAlreadyStarted = true; break; }
    }
    if (!st.active) return { cls: "INVALID-gate-blocked", log, setup, gate: dec };
  }
  if (!prefetchAlreadyStarted) await cdp.evalJs(`window.__c2.windowAsync(${PREFETCH_T})`);
  let pre = null;
  const poll0 = Date.now();
  while (Date.now() - poll0 < 90000) {
    const m = await cdp.evalJs(`window.__c2.status()`);
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
      const snap412 = await cdp.evalJs(`window.__c2.w2snap()`).catch(() => null);
      const st412 = await cdp.evalJs(`window.__c2.status()`).catch(() => null);
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
      const rk = await cdp.evalJs(`window.__c2.remaining47C2()`).catch(() => null);
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
      const rk = await cdp.evalJs(`window.__c2.remaining47C2()`).catch(() => null);
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
  const preToggle = await cdp.evalJs(`window.__c2.status()`);
  const preToggleR = await cdp.evalJs(`window.__c2.remaining47C2()`).catch(() => null);
  if ((preToggle?.inFlightPrefetchWindows ?? 0) < 1) return { cls: "INVALID-settled-before-toggle", log, setup, aim };
  const aimTarget = (preToggleR?.windowSize ?? 0) + (preToggleR?.newFrames ?? 0) - slack;
  log.push(`preToggle: cache=${preToggle?.cacheFrames} remaining=${preToggleR?.remaining} (mốc cache đúng=${aimTarget}) keys=${JSON.stringify(preToggleR?.keys)}`);
  const preW2 = await cdp.evalJs(`window.__c2.w2snap()`).catch(() => null);
  const preW2Status = await cdp.evalJs(`window.__c2.status()`).catch(() => null);
  log.push(`preW2 mirror: lastWindowKey=${preW2?.lastWindowKey} lastDecodeRange=${JSON.stringify(preW2?.lastDecodeRange)} cacheSize=${preW2?.cacheSize} failed=${preW2?.failed} decodeWindowInFlight=${preW2Status?.decodeWindowInFlight}`);
  if (preW2Status?.decodeWindowInFlight) return { cls: "INVALID-decode-in-flight-at-w2", log, setup, aim };
  // Tắt + khởi động W2 hỏng trong CÙNG 1 eval (toggleAndW2); trace
  // lấy mẫu bằng performance.now trong page.
  await cdp.evalJs(`window.__c2.toggleAndW2(${CORRUPT_T})`);
  const trace = [];
  {
    const trace0 = Date.now();
    let w2Seen = false;
    while (Date.now() - trace0 < 60000) {
      const s = await cdp.evalJs(`window.__c2.sample()`).catch(() => null);
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
      const s = await cdp.evalJs(`window.__c2.sample()`).catch(() => null);
      if (!s) break;
      postTrace.push(s);
      if (s.inFlight === 0) break;
      await sleep(5);
    }
  }
  const w2timing = await cdp.evalJs(`window.__c2.w2timing()`).catch(() => null);
  const w2drawn = await cdp.evalJs(`window.__c2.w2drawn()`).catch(() => null);
  const postW2 = await cdp.evalJs(`window.__c2.w2snap()`).catch(() => null);
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
      classification = await cdp.evalJs(`window.__c2.w2classifyReal(${postRange.from}, ${postRange.to}, ${decoded}, true, ${preW2?.cacheSize ?? 0}, ${JSON.stringify(preW2?.lastWindowKey ?? null)})`).catch(() => null);
      log.push(`W2 classify (range thật): decodedProxy=${decoded} (${decodedKind}), drawnCrossCheck=${drawnOk} (drawn=${JSON.stringify(w2drawn)}), diagnostic=${classification?.diagnostic} expectedOk=${classification?.expectedOk} consistent=${classification?.consistent} :: ${classification?.detail}`);
    } else if (w2ok === true && !rangeChanged) {
      const isFast = preW2?.lastWindowKey !== null && postW2?.lastWindowKey === preW2?.lastWindowKey && (preW2?.cacheSize ?? 0) > 0;
      decodedKind = isFast ? "fast-path-no-decode" : "anomaly-no-new-range";
      classification = postRange
        ? await cdp.evalJs(`window.__c2.w2classifyReal(${postRange.from}, ${postRange.to}, null, true, ${preW2?.cacheSize ?? 0}, ${JSON.stringify(preW2?.lastWindowKey ?? null)})`).catch(() => null)
        : null;
      log.push(`W2 classify (range KHÔNG đổi): kind=${decodedKind}, diagnostic=${classification?.diagnostic} :: ${classification?.detail}`);
    } else if (w2ok === false) {
      decoded = 0; decodedKind = "inferred-from-fail-law";
      classification = await cdp.evalJs(`window.__c2.w2classifyFail()`).catch(() => null);
      log.push(`W2 classify (fail): decoded=${decoded} (${decodedKind}), range sau W2 (CŨ, không dùng)=${JSON.stringify(postRange)}, diagnostic=${classification?.diagnostic} :: ${classification?.detail}`);
    } else {
      log.push(`W2 classify: KHÔNG XÁC ĐỊNH (w2timing=${JSON.stringify(w2timing)})`);
    }
    w2obs = { preW2, postW2, w2timing, w2drawn, decoded, decodedKind, classification, aim, decodeInFlightAtW2Start: preW2Status?.decodeWindowInFlight ?? null };
  }
  const all = [...trace, ...postTrace];
  const settleIdx = all.findIndex((s, i) => i > 0 && s.inFlight === 0 && all[i - 1].inFlight >= 1);
  if (settleIdx < 0) return { cls: `INVALID-no-settle (${all.length} mẫu, w2Seen=${trace.some((s) => s.winInFlight)})`, log, setup, trace: all, w2timing, w2obs, aim, remainingAtToggle: preToggleR?.remaining ?? null, cacheAtToggle: preToggle?.cacheFrames ?? null };
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
    attempts.push({ attempt: a, cls: r.cls, log: r.log, aim: r.aim, slack: opts.slack ?? SLACK, gapMs: r.gapMs ?? null, remainingAtToggle: r.remainingAtToggle ?? null, cacheAtToggle: r.cacheAtToggle ?? null, settleAtMs: r.settleAtMs ?? null, w2obs: r.w2obs, trace: r.trace ?? null });
    // C2-rerun: ghi kết quả từng phần ngay sau mỗi attempt (lượt trước
    // bị daemon restart giết giữa chừng nên mất cả c2-result.json —
    // chỉ còn stdout log). File này là bằng chứng dự phòng, không thay
    // c2-result.json cuối lượt.
    try { writeFileEpermRetry(path.join(SCRATCH, "c2-result-partial.json"), JSON.stringify({ phase: label, successCount, attempts }, null, 2)); } catch {}
    console.log(`  [${label} attempt ${a}] ${r.cls} (aim=${r.aim} slack=${opts.slack ?? SLACK} gap=${r.gapMs ?? "?"} ms remainingAtToggle=${r.remainingAtToggle ?? "?"})`);
    for (const l of r.log || []) console.log(`    ${l}`);
    if (r.cls === "SUCCESS") successCount++;
    await cdp.evalJs(`window.__c2.disposeAll()`).catch(() => {});
    await sleep(500);
    if (successCount >= wantSuccess) break;
  }
  return { ok: successCount > 0, successCount, attempts };
}

// D1: probe sạch thời gian W2 ở 2 mốc trong GOP hỏng (controller mới,
// wanted tắt, không prefetch) — kiểm tra lever "W2 chậm hơn".
async function w2ProbePhase(cdp) {
  const rows = [];
  for (const t of [CORRUPT_T, CORRUPT_T_LATE]) {
    for (let rep = 1; rep <= 2; rep++) {
      await cdp.evalJs(`window.__c2.wantedOff()`);
      const setup = await cdp.evalJs(`window.__c2.blobNew()`);
      const p = await cdp.evalJs(`window.__c2.w2probe(${t})`);
      rows.push({ t, targetPos: Math.floor(t * 30), rep, setupOk: setup.ok, setupFps: setup.measurementFps, ...p });
      console.log(`  [D1 probe t=${t.toFixed(4)}s rep=${rep}] durMs=${p.durMs?.toFixed?.(1) ?? p.durMs} ok=${p.ok} failed=${p.failed} (setup fps=${setup.measurementFps})`);
      await cdp.evalJs(`window.__c2.disposeAll()`).catch(() => {});
      await sleep(300);
    }
  }
  return rows;
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
  const profile = path.join(SCRATCH, "cdprof-c2");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "c2-chrome.log"), "w");
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
  await cdp.waitFor(async () => { const r = await cdp.evalJs(`!!window.__c2 && document.getElementById("ready")?.textContent === "ready"`); return r || null; }, "page C2 ready", 90000);

  const assetSetup = await cdp.evalJs(`window.__c2.assetSetup()`);
  console.log(`  [asset setup] ${JSON.stringify(assetSetup)}`);
  const assetOk = !!assetSetup.blobUrl && assetSetup.restoredSrcs.length === 1 && assetSetup.failedSrcs.length === 0;
  const probeReady = assetOk && assetSetup.size === assetSetup.manifestSize;
  record("C2(A0) probe asset: trước race (headed, IDB thật)", probeReady,
    `assetId=${assetSetup.assetId} blobUrl=${assetSetup.blobUrl ? "blob:..." : null} size=${assetSetup.size} manifestSize=${assetSetup.manifestSize} restored=${JSON.stringify(assetSetup.restoredSrcs)} failed=${JSON.stringify(assetSetup.failedSrcs)} skipped=${JSON.stringify(assetSetup.skipped)}`);

  // Pha D1 — probe W2 chậm hơn (chỉ đo, không áp dụng vào race).
  let w2probeRows = [];
  if (probeReady && DO_W2PROBE) {
    w2probeRows = await w2ProbePhase(cdp);
    const d974 = w2probeRows.filter((r) => r.targetPos === 974).map((r) => r.durMs);
    const d989 = w2probeRows.filter((r) => r.targetPos === 989).map((r) => r.durMs);
    const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    record("C2(D1) W2 durMs theo mốc trong GOP hỏng (974 vs 989)", true,
      `974: [${d974.map((v) => v.toFixed(1)).join(", ")}] ms (tb ${mean(d974)?.toFixed(1)}); 989: [${d989.map((v) => v.toFixed(1)).join(", ")}] ms (tb ${mean(d989)?.toFixed(1)}); ok=false tất cả: ${w2probeRows.every((r) => r.ok === false)}`);
    try { writeFileEpermRetry(path.join(SCRATCH, "c2-result-partial.json"), JSON.stringify({ phase: "D1", w2probe: w2probeRows }, null, 2)); } catch {}
  }

  // Pha C — capture SUCCESS với aim C2 (slack 3), tối đa 6 attempt,
  // dừng khi đủ 2 SUCCESS (1 bắt + 1 xác nhận).
  let capture = { ok: false, successCount: 0, attempts: [] };
  if (probeReady) {
    capture = await runPhase(cdp, "ASSET-C2", () => cdp.evalJs(`window.__c2.blobNew()`), { slack: SLACK, maxAttempts: MAX_ATTEMPTS, wantSuccess: 2 });
    record("C2(C) SUCCESS đường asset: với aim C2 (headed)", capture.ok,
      capture.ok ? `${capture.successCount} SUCCESS sau ${capture.attempts.length} attempt: ${capture.attempts.map((a) => a.cls).join(", ")}`
        : `không bắt được SUCCESS sau ${capture.attempts.length} attempt: ${capture.attempts.map((a) => `${a.cls}(gap=${a.gapMs}ms,rem=${a.remainingAtToggle})`).join(", ")}`);
  }

  // Sóng 2 (slack 1) CHỈ khi sóng 1 chứng minh còn-lại-lúc-tắt > slack
  // là chỗ nghẽn (mọi attempt ultra-tight đều tắt với remaining >
  // slack). Ngược lại (remaining <= slack mà settle vẫn trễ) thì
  // chỗ nghẽn là tốc độ decode sau toggle / W2, siết aim thêm vô ích
  // — khóa kết luận từ số sóng 1, không chạy sóng 2 để khỏi câu cá.
  let wave2 = null;
  if (probeReady && ALLOW_WAVE2 && !capture.ok) {
    const ultra = capture.attempts.filter((a) => a.aim === "remaining-tight" && a.remainingAtToggle !== null && a.remainingAtToggle !== undefined);
    const overshootBinding = ultra.length > 0 && ultra.every((a) => a.remainingAtToggle > SLACK);
    console.log(`  [wave2 decision] ultra-tight attempts=${ultra.length} overshootBinding=${overshootBinding} (remainingAtToggle: ${ultra.map((a) => a.remainingAtToggle).join(", ")})`);
    if (overshootBinding) {
      wave2 = await runPhase(cdp, "ASSET-C2-WAVE2-SLACK1", () => cdp.evalJs(`window.__c2.blobNew()`), { slack: 1, maxAttempts: 4, wantSuccess: 1 });
      record("C2(C2) sóng 2 slack=1 (chỉ vì sóng 1 chứng minh overshoot là nghẽn)", wave2.ok,
        wave2.ok ? `${wave2.successCount} SUCCESS sau ${wave2.attempts.length} attempt`
          : `không bắt được SUCCESS sau ${wave2.attempts.length} attempt: ${wave2.attempts.map((a) => `${a.cls}(gap=${a.gapMs}ms,rem=${a.remainingAtToggle})`).join(", ")}`);
    } else {
      record("C2(C2) sóng 2 slack=1: KHÔNG CHẠY (sóng 1 không chứng minh overshoot là nghẽn)", true,
        "remaining lúc tắt đã <= slack mà settle vẫn trễ → siết aim thêm không cứu được; kết luận khóa từ số sóng 1");
    }
  }

  const out = { fileSize, assetSetup, probeReady, w2probe: w2probeRows, capture, wave2 };
  writeFileEpermRetry(path.join(SCRATCH, "c2-result.json"), JSON.stringify(out, null, 2));
  console.log(`loadavg lúc kết thúc: ${loadavg()}`);
  const w2ObsCount = (capture.attempts || []).filter((a) => a.aim === "remaining-tight" && a.w2obs).length
    + ((wave2?.attempts || []).filter((a) => a.aim === "remaining-tight" && a.w2obs).length);
  console.log(`\n== C2 headed: probe=${probeReady} assetSuccess=${capture.ok} successCount=${capture.successCount} wave2Success=${wave2?.successCount ?? "-"} ultraW2Obs=${w2ObsCount} ==`);
  killAll();
  return w2ObsCount >= 1 ? 0 : 1;
}
main().then((code) => { killAll(); process.exit(code); }).catch((e) => { console.error(`FATAL: ${e.message}`); killAll(); process.exit(1); });
