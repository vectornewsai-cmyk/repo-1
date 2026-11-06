// gop-headed-heap-43y4.mjs — Đo heap browser headed trên file >= 128 MiB
// thật qua đường GOP (Phase 9 đợt 43, luồng Y4; đóng nợ đợt 42 §5.5).
//
// Câu hỏi quyết định: có mở lại trần 128 MiB của cổng S4 không?
// Quy tắc đo đã chốt TRƯỚC khi chạy (ghi trong LIMITS Y4, không đổi
// sau khi thấy số): GIỮ trần 128 MiB, trừ khi đồng thời thỏa:
//   (a) đỉnh transient JS heap đo được cho file ~140 MiB nằm gọn trong
//       ngân sách còn lại sau khi trừ frame decode + cache GOP, VÀ
//   (b) số đo lặp lại được, không phải một lần under-load duy nhất.
// Một lần đo under-load (các luồng đợt 43 khác đang chạy) KHÔNG đủ
// làm giấy phép mở trần — kết quả kỳ vọng là GIỮ trần, số đo chỉ để
// ghi lại luật scale (transient ~ bao nhiêu × file) cho đợt sau.
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gop-headed-heap-43y4.mjs [fixture-240s]
// Mặc định fixture: /tmp/round43-y4/big240.mp4 (tạo bằng ffmpeg, công
// thức trong LIMITS Y4 §2 — script KHÔNG tự tạo fixture để không giấu
// công thức footage sau lưng số đo).
//
// Giàn đo:
//  - Server node:http tối giản (như X4): 3 path cùng 1 file, Range thật,
//    log mọi request (để chứng minh đường đi, không để mạo nhận bridge).
//  - Chromium headed thật (không --headless, dưới Xvfb, --disable-gpu
//    như X4) + --enable-precise-memory-info + --js-flags=--expose-gc
//    để page gọi được window.gc() và performance.memory chính xác.
//  - Page bundle 1 entry scratch (reverseWebcodecs + T3 + wiring):
//      (1) T3 trực tiếp: fetchVideoTrackByGopRange, giữ outcome trong
//          window (transient giữ mọi chunk GOP) → đo đỉnh lúc giữ.
//      (2) Controller GOP + largeFileBytes override 512 MiB — CHỈ TRONG
//          HARNESS ĐO, KHÔNG đổi mặc định production (128 MiB): đo đỉnh
//          lúc controller chạy GOP trên file > 128 MiB, vẽ ngược, rồi
//          nhả outcome.
//      (3) Đối chứng production: controller GOP bật, trần MẶC ĐỊNH
//          128 MiB, trên cùng file → phải khóa (ensure=false,
//          largeFileFallback=true, không GET toàn file).
//  - Harness poll performance.memory mỗi 100 ms trong lúc promise chạy
//    (qua CDP evaluate) để bắt đỉnh transient, không chỉ đo trước/sau.
//  - Số heap ở đây là JS heap (performance.memory.usedJSHeapSize):
//    KHÔNG bao gồm bộ nhớ native của VideoFrame đã decode — LIMITS Y4
//    cộng thêm ước lượng frame (2,4 MiB/frame × cửa sổ) khi kết luận,
//    không đọc JS heap thành tổng bộ nhớ tiến trình.
//
// Cổng PASS/FAIL (exit 1 khi trượt):
//  - T3 trên file lớn: mode gop-range, sample/chunk byte-khớp logic
//    (chunk data tổng = totalSampleBytes, GOP phủ hết sample).
//  - Controller override: gop-range, drawn > 0, pixel khác 0 > 50%.
//  - Controller mặc định: ensure=false, largeFileFallback=true, 0 GET
//    toàn file trên path đối chứng.
//  - Heap: chỉ IN số (baseline/đỉnh/lúc giữ/sau nhả), KHÔNG làm cổng
//    mở trần — quyết định mở hay giữ nằm ở LIMITS, không nằm ở exit code.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = "/tmp/round43-y4";
const FIXTURE = process.argv[2] || path.join(SCRATCH, "big240.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.Y4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.Y4_DEBUG_PORT || 9363);
const HTTP_PORT = Number(process.env.Y4_HTTP_PORT || 8919);

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function fail(name, detail) {
  record(name, false, detail);
  throw new Error(`${name}: ${detail}`);
}

if (!fs.existsSync(FIXTURE)) fail("fixture", `không thấy fixture ${FIXTURE} (tạo bằng ffmpeg trước, xem LIMITS Y4 §2)`);
if (!fs.existsSync(CHROME)) fail("chrome", `không thấy Chrome ${CHROME}`);
const fileBuf = fs.readFileSync(FIXTURE);
const fileSize = fileBuf.length;
if (fileSize < 128 * 1024 * 1024) fail("fixture-size", `file chỉ ${fileSize} byte (< 128 MiB), không đủ đo câu hỏi trần`);
console.log(`fixture: ${FIXTURE} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB`);

// ---- 1. Entry + bundle ra scratch (harness tự viết, không vào repo) ----
fs.mkdirSync(SCRATCH, { recursive: true });
const entry = `
import { ReversePreviewController } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"))};
import { fetchVideoTrackByGopRange } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/gopRangeFetch39T3.ts"))};
import { resolveGopRangeWiring } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/gopCache40V2.ts"))};
export { ReversePreviewController, fetchVideoTrackByGopRange, resolveGopRangeWiring };
`;
fs.writeFileSync(path.join(SCRATCH, "heap-entry.ts"), entry);
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "heap-bundle.mjs");
const b = spawnSync(esbuild, [
  path.join(SCRATCH, "heap-entry.ts"),
  "--bundle", "--platform=browser", "--format=esm",
  `--outfile=${bundleOut}`,
], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) fail("esbuild-bundle", ((b.error && b.error.message) || b.stderr || b.stdout || "esbuild lỗi không rõ").slice(0, 500));
console.log(`bundle: ${bundleOut} (${fs.statSync(bundleOut).size} byte)`);

// ---- 2. Page HTML ----
const pageHtml = `<!doctype html><meta charset="utf-8"><title>Y4 GOP heap headed</title>
<canvas id="c" width="1280" height="720"></canvas>
<script type="module">
import { ReversePreviewController, fetchVideoTrackByGopRange, resolveGopRangeWiring } from "./heap-bundle.mjs";
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
function pixelStats() {
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let nz = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] || d[i + 1] || d[i + 2]) nz++;
  return { nonZero: nz, total: canvas.width * canvas.height };
}
function heap() {
  const m = performance.memory || {};
  return { used: m.usedJSHeapSize ?? null, total: m.totalJSHeapSize ?? null,
    limit: m.jsHeapSizeLimit ?? null, gc: typeof window.gc === "function" };
}
function gcNow() { try { if (window.gc) { window.gc(); window.gc(); } } catch {} }
window.__y4heap = () => heap();
window.__y4gc = () => { gcNow(); return heap(); };
window.__y4wiring = (size) => ({
  def: resolveGopRangeWiring({ enabled: true, knownSizeBytes: size }),
  raised: resolveGopRangeWiring({ enabled: true, knownSizeBytes: size, largeFileBytes: 512 * 1024 * 1024 }),
});
// (1) T3 trực tiếp, giữ outcome (mọi chunk GOP) trong window.
window.__y4t3 = async (url) => {
  const out = await fetchVideoTrackByGopRange(url, {});
  window.__y4t3out = out;
  if (out.mode !== "gop-range") return { mode: out.mode, reason: out.reason, requests: out.requests };
  let chunkBytes = 0, maxGop = 0;
  for (const g of out.gops) {
    maxGop = Math.max(maxGop, g.rangeBytes);
    for (const c of g.chunks) chunkBytes += c.data.byteLength;
  }
  return { mode: out.mode, sampleCount: out.sampleCount, gopCount: out.gops.length,
    totalGopRangeBytes: out.totalGopRangeBytes, totalSampleBytes: out.totalSampleBytes,
    chunkBytes, maxGop, requests: out.requests };
};
window.__y4t3release = () => { window.__y4t3out = null; gcNow(); return heap(); };
// (2) Controller GOP + override trần test-only 512 MiB (KHÔNG phải production).
window.__y4ctrlOverride = async (url, t) => {
  const ctrl = new ReversePreviewController(url, undefined, { gopRangeEnabled: true, largeFileBytes: 512 * 1024 * 1024 });
  const ok = await ctrl.ensureWindowForTime(t);
  let drawn = 0, missing = 0;
  if (ok) {
    const r = ctrl.presentCachedReverse((frame) => { ctx.drawImage(frame, 0, 0, canvas.width, canvas.height); });
    drawn = r.drawn; missing = r.missing;
  }
  window.__y4ctrlO = ctrl;
  return { ok, ready: ctrl.ready, gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe,
    fallback: ctrl.gopFallbackReason, cacheSize: ctrl.cacheSize,
    retainedFileBytes: ctrl.retainedFileBytes, drawn, missing, pixels: pixelStats() };
};
// (3) Đối chứng production: GOP bật, trần mặc định 128 MiB.
window.__y4ctrlDefault = async (url, t) => {
  const ctrl = new ReversePreviewController(url, undefined, { gopRangeEnabled: true });
  const ok = await ctrl.ensureWindowForTime(t);
  return { ok, ready: ctrl.ready, failed: ctrl.failed, largeFileFallback: ctrl.largeFileFallback,
    gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe, fallback: ctrl.gopFallbackReason };
};
window.__y4ready = true;
</script>`;
fs.writeFileSync(path.join(SCRATCH, "heap-page.html"), pageHtml);

// ---- 3. HTTP server: page/bundle + fixture 3 path, log mọi request ----
const reqLog = [];
const server = createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname === "/heap-page.html") {
    const body = fs.readFileSync(path.join(SCRATCH, "heap-page.html"));
    res.writeHead(200, { "Content-Type": "text/html" }); res.end(body); return;
  }
  if (u.pathname === "/heap-bundle.mjs") {
    const body = fs.readFileSync(bundleOut);
    res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(body); return;
  }
  if (u.pathname.startsWith("/big-") && u.pathname.endsWith(".mp4")) {
    res.setHeader("Accept-Ranges", "bytes");
    if (req.method === "HEAD") {
      res.setHeader("Content-Length", fileSize);
      res.writeHead(200); res.end();
      reqLog.push({ path: u.pathname, method: "HEAD", range: null, status: 200, bytes: 0 });
      return;
    }
    const range = req.headers.range ?? null;
    if (!range) {
      res.setHeader("Content-Length", fileSize);
      res.writeHead(200); res.end(fileBuf);
      reqLog.push({ path: u.pathname, method: "GET", range: null, status: 200, bytes: fileSize });
      return;
    }
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!m) { res.writeHead(400); res.end(); reqLog.push({ path: u.pathname, method: "GET", range, status: 400, bytes: 0 }); return; }
    const start = Number(m[1]);
    const end = m[2] === "" ? fileSize - 1 : Math.min(Number(m[2]), fileSize - 1);
    if (start >= fileSize || start > end) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      res.writeHead(416); res.end();
      reqLog.push({ path: u.pathname, method: "GET", range, status: 416, bytes: 0 }); return;
    }
    const slice = fileBuf.subarray(start, end + 1);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    res.setHeader("Content-Length", slice.length);
    res.writeHead(206); res.end(slice);
    reqLog.push({ path: u.pathname, method: "GET", range, status: 206, bytes: slice.length });
    return;
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
console.log(`server: http://127.0.0.1:${HTTP_PORT}/heap-page.html`);

// ---- 4. Xvfb + Chrome headed (công thức X4 + cờ đo heap) ----
let xvfb = null;
let display = process.env.DISPLAY || null;
if (!display) {
  for (const num of [98, 95, 94]) {
    xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xvfb.exitCode === null) { display = `:${num}`; break; }
    xvfb = null;
  }
  if (!display) fail("xvfb", "không khởi động được Xvfb (:98/:95/:94 đều bận hoặc lỗi)");
  console.log(`xvfb: DISPLAY=${display}`);
}
const profile = path.join(SCRATCH, "heap-chrome-profile");
fs.rmSync(profile, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${profile}`,
  "--no-sandbox", "--disable-dev-shm-usage",
  "--disable-gpu", "--no-first-run",
  "--enable-precise-memory-info",
  "--js-flags=--expose-gc",
  "--window-size=1440,900", "--hide-scrollbars", "about:blank",
], { stdio: "ignore", env: { ...process.env, DISPLAY: display } });
await sleep(2000);
if (chrome.exitCode !== null) fail("chrome-launch", `Chrome thoát sớm với mã ${chrome.exitCode}`);

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
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
}
async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch { /* chưa sẵn */ }
    await sleep(500);
  }
  throw new Error("không lấy được CDP wsUrl của target type=page sau 15 s");
}
const MiB = (n) => n === null ? null : +(n / 1048576).toFixed(2);
let exitCode = 0;
try {
  const cdp = new CDP(await getWsUrl());
  await cdp.send("Page.enable", {});
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/heap-page.html` });
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__y4ready === true").catch(() => false);
    if (ready) break;
    if (i === 59) throw new Error("page không sẵn sau 30 s");
    await sleep(500);
  }
  // Chạy 1 bước kèm poll heap: đặt promise trong page, poll từ harness
  // cho tới khi result xuất hiện; đỉnh = max used trong lúc poll.
  async function runStepPoll(stepFn, resultKey, args, timeoutS = 600) {
    await cdp.send("Runtime.evaluate", {
      expression: `window.${resultKey} = null; window.${stepFn}(${args}).then((r) => { window.${resultKey} = r; }).catch((e) => { window.${resultKey} = { __error: String(e && e.message || e) }; })`,
      returnByValue: true,
    });
    let peak = null;
    for (let i = 0; i < timeoutS * 10; i++) {
      const h = await cdp.evalJs("window.__y4heap()").catch(() => null);
      if (h && h.used !== null) peak = peak === null ? h.used : Math.max(peak, h.used);
      const v = await cdp.evalJs(`window.${resultKey}`).catch(() => null);
      if (v) {
        if (v.__error) throw new Error(`${stepFn} lỗi trong page: ${v.__error}`);
        return { result: v, peakUsed: peak };
      }
      await sleep(100);
    }
    throw new Error(`${stepFn} không trả kết quả sau ${timeoutS} s`);
  }
  const base = `http://127.0.0.1:${HTTP_PORT}`;
  const wiring = await cdp.evalJs(`window.__y4wiring(${fileSize})`);
  const heap0 = await cdp.evalJs("window.__y4gc()");
  console.log(`wiring: default=${JSON.stringify(wiring.def)} raised=${JSON.stringify(wiring.raised)}`);
  console.log(`baseline sau gc: used=${MiB(heap0.used)} MiB total=${MiB(heap0.total)} MiB gc=${heap0.gc}`);

  // (1) T3 trực tiếp
  const t3 = await runStepPoll("__y4t3", "__y4t3Result", `"${base}/big-t3.mp4"`);
  const heapHeld = await cdp.evalJs("window.__y4heap()");
  const heapSettled = await cdp.evalJs("window.__y4t3release()");
  await sleep(500);
  const heapSettled2 = await cdp.evalJs("window.__y4heap()");
  // (2) Controller override
  const ctrlO = await runStepPoll("__y4ctrlOverride", "__y4ctrlOResult", `"${base}/big-ctrl.mp4", 239.0`);
  const heapCtrlAfter = await cdp.evalJs("window.__y4heap()");
  // (3) Đối chứng mặc định
  const ctrlD = await runStepPoll("__y4ctrlDefault", "__y4ctrlDResult", `"${base}/big-def.mp4", 239.0`, 120);
  const summary = {
    fileSize, fileMiB: MiB(fileSize), wiring,
    baseline: { usedMiB: MiB(heap0.used), totalMiB: MiB(heap0.total), gc: heap0.gc },
    t3: { ...t3.result, peakUsedMiB: MiB(t3.peakUsed),
      heldUsedMiB: MiB(heapHeld.used), settledUsedMiB: MiB(heapSettled.used),
      settled2UsedMiB: MiB(heapSettled2.used),
      deltaPeakMiB: heap0.used !== null && t3.peakUsed !== null ? MiB(t3.peakUsed - heap0.used) : null,
      deltaHeldMiB: heap0.used !== null && heapHeld.used !== null ? MiB(heapHeld.used - heap0.used) : null,
      deltaSettledMiB: heap0.used !== null && heapSettled.used !== null ? MiB(heapSettled.used - heap0.used) : null,
      peakOverFile: t3.peakUsed !== null ? +(t3.peakUsed / fileSize).toFixed(3) : null,
      heldOverFile: heapHeld.used !== null && heap0.used !== null ? +((heapHeld.used - heap0.used) / fileSize).toFixed(3) : null },
    ctrlOverride: { ...ctrlO.result, peakUsedMiB: MiB(ctrlO.peakUsed),
      afterUsedMiB: MiB(heapCtrlAfter.used),
      deltaPeakMiB: heap0.used !== null && ctrlO.peakUsed !== null ? MiB(ctrlO.peakUsed - heap0.used) : null,
      peakOverFile: ctrlO.peakUsed !== null ? +(ctrlO.peakUsed / fileSize).toFixed(3) : null },
    ctrlDefault: ctrlD.result,
  };
  const pathSum = (p) => {
    const arr = reqLog.filter((r) => r.path === p);
    return { requests: arr.length, bytes: arr.reduce((s, r) => s + r.bytes, 0),
      head: arr.filter((r) => r.method === "HEAD").length,
      fullGet: arr.filter((r) => r.method === "GET" && r.range === null).length,
      range206: arr.filter((r) => r.status === 206).length };
  };
  summary.paths = { t3: pathSum("/big-t3.mp4"), ctrlOverride: pathSum("/big-ctrl.mp4"), ctrlDefault: pathSum("/big-def.mp4") };
  fs.writeFileSync(path.join(SCRATCH, "heap-result.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  const t = summary.t3;
  record("t3-gop-range", t.mode === "gop-range", `mode=${t.mode} sample=${t.sampleCount} gop=${t.gopCount}`);
  record("t3-chunk-bytes", t.mode === "gop-range" && t.chunkBytes === t.totalSampleBytes,
    `chunkBytes=${t.chunkBytes} totalSampleBytes=${t.totalSampleBytes} maxGop=${t.maxGop}`);
  record("t3-no-full-get", summary.paths.t3.fullGet === 0, `path T3: fullGet=${summary.paths.t3.fullGet}, 206=${summary.paths.t3.range206}`);
  const c = summary.ctrlOverride;
  record("ctrl-override-gop", c.gopMode === "gop-range", `gopMode=${c.gopMode} probe=${JSON.stringify(c.probe)}`);
  record("ctrl-override-drawn", c.ok === true && c.drawn > 0, `ensure=${c.ok} drawn=${c.drawn} missing=${c.missing} retained=${c.retainedFileBytes}`);
  const pixRatio = c.pixels.total ? c.pixels.nonZero / c.pixels.total : 0;
  record("ctrl-override-pixels", pixRatio > 0.5, `pixel khác 0: ${c.pixels.nonZero}/${c.pixels.total} (${(pixRatio * 100).toFixed(1)}%)`);
  const d = summary.ctrlDefault;
  record("ctrl-default-locked", d.ok === false && d.largeFileFallback === true,
    `ensure=${d.ok} failed=${d.failed} largeFileFallback=${d.largeFileFallback} gopMode=${d.gopMode} probe=${JSON.stringify(d.probe)}`);
  record("ctrl-default-no-full-get", summary.paths.ctrlDefault.fullGet === 0,
    `path mặc định: fullGet=${summary.paths.ctrlDefault.fullGet}, HEAD=${summary.paths.ctrlDefault.head}, bytes=${summary.paths.ctrlDefault.bytes}`);
  record("heap-measured", heap0.gc === true && heap0.used !== null && t.peakUsedMiB !== null,
    `gc=${heap0.gc} baseline=${summary.baseline.usedMiB} MiB, đỉnh T3=${t.peakUsedMiB} MiB (delta ${t.deltaPeakMiB} MiB = ${t.peakOverFile}× file), lúc giữ=${t.heldUsedMiB} MiB, sau nhả+gc=${t.settledUsedMiB} MiB`);
  if (results.some((r) => !r.ok)) exitCode = 1;
} catch (e) {
  console.error(`FAIL harness — ${e.message}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { xvfb?.kill("SIGKILL"); } catch { /* bỏ qua */ }
  await new Promise((r) => server.close(() => r()));
}
console.log(`\nY4 heap headed: ${results.filter((r) => r.ok).length}/${results.length} cổng pass (xem ${path.join(SCRATCH, "heap-result.json")})`);
process.exit(exitCode);
