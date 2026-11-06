// gop-headed-heap-44z4.mjs — Đo heap browser headed ở biên 129 MiB và
// 256 MiB+ qua đường GOP (Phase 9 đợt 44, luồng Z4; đóng nợ Y4 §6.4
// "chỉ có 1 điểm đo 141,52 MiB; luật 1,09× là ngoại suy từ 1 điểm").
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gop-headed-heap-44z4.mjs <fixture> [t]
// Fixture: file MP4 faststart thật (tạo bằng ffmpeg, công thức Y4 §2).
// `t` mặc định = duration(ffprobe) - 1. Scratch: $Z4_SCRATCH hoặc
// ~/scratch-round44-z4 (KHÔNG dùng /tmp: tmpfs máy này chỉ 512 MiB,
// không đủ cho fixture 256 MiB + Chrome profile cùng lúc).
//
// Khác harness Y4 ở 3 chỗ (ghi rõ để khỏi tưởng số Y4 dùng lại được):
//  - Server stream từ đĩa (fs.createReadStream theo range) thay vì đọc
//    cả file vào RAM: tránh Node giữ 256 MiB buffer làm nhiễu RAM máy
//    đo, và tránh OOM khi các luồng đợt 44 khác đang chạy.
//  - Đo thêm RSS cây tiến trình Chrome (browser + mọi tiến trình con
//    qua `ps`): JS heap (performance.memory) KHÔNG bao gồm bộ nhớ
//    native của VideoFrame, nên RSS là số tổng gần nhất đo được ở đây
//    — nhưng RSS vẫn gồm cả baseline của trình duyệt, vì vậy số có
//    nghĩa là DELTA so với baseline (sau gc, trước bước đo), không
//    phải RSS tuyệt đối. Bộ nhớ VideoFrame native RIÊNG LẺ vẫn chưa
//    tách được (không có measureUserAgentSpecificMemory ở cấu hình
//    này) — ghi rõ trong LIMITS Z4, không cộng đoán.
//  - Thời gian cửa sổ controller lấy từ ffprobe (duration - 1) thay
//    vì hard-code 239.0 của file 240 s.
//
// Quy tắc quyết định (đợt 42 §5.5, nhắc lại — không đổi sau khi thấy
// số): mở lại trần > 128 MiB CHỈ khi đủ cả 3: (1) T3 streaming (chỉ
// fetch GOP của cửa sổ — Z4 KHÔNG làm điều này, Z4 chỉ sửa fetch
// moov; T3 vẫn fetch mọi GOP lượt đầu nên luật tuyến tính còn
// nguyên), (2) đo RSS + VideoFrame native, (3) lặp ở cửa sổ quiet.
// Cửa sổ quiet KHÔNG có trong phiên này (các luồng đợt 44 khác đang
// chạy) nên kết quả kỳ vọng là GIỮ trần 128 MiB; số đo chỉ để vẽ
// đường cong heap theo kích thước file (129/141/256 MiB) cho đợt sau.
import { spawn, spawnSync, execSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.Z4_SCRATCH || path.join(os.homedir(), "scratch-round44-z4");
const FIXTURE = process.argv[2];
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.Z4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.Z4_DEBUG_PORT || 9373);
const HTTP_PORT = Number(process.env.Z4_HTTP_PORT || 8939);

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function fail(name, detail) {
  record(name, false, detail);
  throw new Error(`${name}: ${detail}`);
}

if (!FIXTURE || !fs.existsSync(FIXTURE)) fail("fixture", `không thấy fixture ${FIXTURE} (truyền đường dẫn file mp4 faststart thật)`);
if (!fs.existsSync(CHROME)) fail("chrome", `không thấy Chrome ${CHROME}`);
const fileSize = fs.statSync(FIXTURE).size;
const label = path.basename(FIXTURE, ".mp4");
console.log(`fixture: ${FIXTURE} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB`);
// Thời gian cửa sổ: duration ffprobe - 1 (không hard-code 239.0 của Y4).
let T = Number(process.argv[3]);
if (!Number.isFinite(T) || T <= 0) {
  const dur = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${JSON.stringify(FIXTURE)}`, { encoding: "utf8" }).trim());
  if (!Number.isFinite(dur) || dur <= 1) fail("ffprobe-duration", `không đọc được duration của ${FIXTURE}`);
  T = Math.floor(dur) - 1;
}
console.log(`cửa sổ controller: t=${T} s`);

// ---- 1. Entry + bundle ra scratch (harness tự viết, không vào repo) ----
fs.mkdirSync(SCRATCH, { recursive: true });
const entry = `
import { ReversePreviewController } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"))};
import { fetchVideoTrackByGopRange } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/gopRangeFetch39T3.ts"))};
import { resolveGopRangeWiring } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/gopCache40V2.ts"))};
export { ReversePreviewController, fetchVideoTrackByGopRange, resolveGopRangeWiring };
`;
fs.writeFileSync(path.join(SCRATCH, "heap44-entry.ts"), entry);
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "heap44-bundle.mjs");
const b = spawnSync(esbuild, [
  path.join(SCRATCH, "heap44-entry.ts"),
  "--bundle", "--platform=browser", "--format=esm",
  `--outfile=${bundleOut}`,
], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) fail("esbuild-bundle", ((b.error && b.error.message) || b.stderr || b.stdout || "esbuild lỗi không rõ").slice(0, 500));
console.log(`bundle: ${bundleOut} (${fs.statSync(bundleOut).size} byte)`);

// ---- 2. Page HTML (3 bước như Y4, thời gian từ ffprobe) ----
const pageHtml = `<!doctype html><meta charset="utf-8"><title>Z4 GOP heap headed</title>
<canvas id="c" width="1280" height="720"></canvas>
<script type="module">
import { ReversePreviewController, fetchVideoTrackByGopRange, resolveGopRangeWiring } from "./heap44-bundle.mjs";
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
window.__z4heap = () => heap();
window.__z4gc = () => { gcNow(); return heap(); };
window.__z4wiring = (size) => ({
  def: resolveGopRangeWiring({ enabled: true, knownSizeBytes: size }),
  raised: resolveGopRangeWiring({ enabled: true, knownSizeBytes: size, largeFileBytes: 512 * 1024 * 1024 }),
});
window.__z4t3 = async (url) => {
  const out = await fetchVideoTrackByGopRange(url, {});
  window.__z4t3out = out;
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
window.__z4t3release = () => { window.__z4t3out = null; gcNow(); return heap(); };
window.__z4ctrlOverride = async (url, t) => {
  const ctrl = new ReversePreviewController(url, undefined, { gopRangeEnabled: true, largeFileBytes: 512 * 1024 * 1024 });
  const ok = await ctrl.ensureWindowForTime(t);
  let drawn = 0, missing = 0;
  if (ok) {
    const r = ctrl.presentCachedReverse((frame) => { ctx.drawImage(frame, 0, 0, canvas.width, canvas.height); });
    drawn = r.drawn; missing = r.missing;
  }
  window.__z4ctrlO = ctrl;
  return { ok, ready: ctrl.ready, gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe,
    fallback: ctrl.gopFallbackReason, cacheSize: ctrl.cacheSize,
    retainedFileBytes: ctrl.retainedFileBytes, drawn, missing, pixels: pixelStats() };
};
window.__z4ctrlDefault = async (url, t) => {
  const ctrl = new ReversePreviewController(url, undefined, { gopRangeEnabled: true });
  const ok = await ctrl.ensureWindowForTime(t);
  return { ok, ready: ctrl.ready, failed: ctrl.failed, largeFileFallback: ctrl.largeFileFallback,
    gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe, fallback: ctrl.gopFallbackReason };
};
window.__z4ready = true;
</script>`;
fs.writeFileSync(path.join(SCRATCH, "heap44-page.html"), pageHtml);

// ---- 3. HTTP server stream từ đĩa (không load cả file vào RAM) ----
const reqLog = [];
const server = createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname === "/heap44-page.html") {
    res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(path.join(SCRATCH, "heap44-page.html"))); return;
  }
  if (u.pathname === "/heap44-bundle.mjs") {
    res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); return;
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
      res.writeHead(200);
      fs.createReadStream(FIXTURE).pipe(res);
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
    res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    res.setHeader("Content-Length", end - start + 1);
    res.writeHead(206);
    fs.createReadStream(FIXTURE, { start, end }).pipe(res);
    reqLog.push({ path: u.pathname, method: "GET", range, status: 206, bytes: end - start + 1 });
    return;
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
console.log(`server: http://127.0.0.1:${HTTP_PORT}/heap44-page.html`);

// ---- 4. Xvfb + Chrome headed (công thức X4 + cờ đo heap) ----
let xvfb = null;
let display = process.env.DISPLAY || null;
if (!display) {
  for (const num of [92, 91, 90]) {
    xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xvfb.exitCode === null) { display = `:${num}`; break; }
    xvfb = null;
  }
  if (!display) fail("xvfb", "không khởi động được Xvfb (:92/:91/:90 đều bận hoặc lỗi)");
  console.log(`xvfb: DISPLAY=${display}`);
}
const profile = path.join(SCRATCH, `heap44-chrome-profile-${label}`);
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

// RSS cây tiến trình Chrome: tổng RSS (KiB → MiB) của tiến trình
// browser + mọi tiến trình con, qua `ps`. Chỉ DELTA so với baseline
// mới có nghĩa (RSS tuyệt đối gồm cả baseline trình duyệt).
function chromeTreeRssMB() {
  try {
    const out = execSync("ps -eo pid,ppid,rss,comm", { encoding: "utf8" });
    const rows = [];
    for (const line of out.trim().split("\n").slice(1)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;
      rows.push({ pid: Number(parts[0]), ppid: Number(parts[1]), rss: Number(parts[2]) });
    }
    const children = new Map();
    for (const r of rows) {
      if (!children.has(r.ppid)) children.set(r.ppid, []);
      children.get(r.ppid).push(r.pid);
    }
    let total = 0;
    const stack = [chrome.pid];
    const seen = new Set();
    while (stack.length) {
      const pid = stack.pop();
      if (seen.has(pid)) continue;
      seen.add(pid);
      const row = rows.find((r) => r.pid === pid);
      if (row) total += row.rss;
      for (const c of children.get(pid) || []) stack.push(c);
    }
    return +(total / 1024).toFixed(2);
  } catch {
    return null;
  }
}

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
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/heap44-page.html` });
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__z4ready === true").catch(() => false);
    if (ready) break;
    if (i === 59) throw new Error("page không sẵn sau 30 s");
    await sleep(500);
  }
  async function runStepPoll(stepFn, resultKey, args, timeoutS = 600) {
    await cdp.send("Runtime.evaluate", {
      expression: `window.${resultKey} = null; window.${stepFn}(${args}).then((r) => { window.${resultKey} = r; }).catch((e) => { window.${resultKey} = { __error: String(e && e.message || e) }; })`,
      returnByValue: true,
    });
    let peak = null;
    let peakRss = null;
    let iter = 0;
    for (let i = 0; i < timeoutS * 10; i++) {
      const h = await cdp.evalJs("window.__z4heap()").catch(() => null);
      if (h && h.used !== null) peak = peak === null ? h.used : Math.max(peak, h.used);
      if (iter % 10 === 0) {
        const rss = chromeTreeRssMB();
        if (rss !== null) peakRss = peakRss === null ? rss : Math.max(peakRss, rss);
      }
      iter++;
      const v = await cdp.evalJs(`window.${resultKey}`).catch(() => null);
      if (v) {
        if (v.__error) throw new Error(`${stepFn} lỗi trong page: ${v.__error}`);
        return { result: v, peakUsed: peak, peakRss };
      }
      await sleep(100);
    }
    throw new Error(`${stepFn} không trả kết quả sau ${timeoutS} s`);
  }
  const base = `http://127.0.0.1:${HTTP_PORT}`;
  const wiring = await cdp.evalJs(`window.__z4wiring(${fileSize})`);
  const heap0 = await cdp.evalJs("window.__z4gc()");
  const rss0 = chromeTreeRssMB();
  console.log(`wiring: default=${JSON.stringify(wiring.def)} raised=${JSON.stringify(wiring.raised)}`);
  console.log(`baseline sau gc: used=${MiB(heap0.used)} MiB total=${MiB(heap0.total)} MiB gc=${heap0.gc} rssTree=${rss0} MiB`);

  const t3 = await runStepPoll("__z4t3", "__z4t3Result", `"${base}/big-t3.mp4"`);
  const heapHeld = await cdp.evalJs("window.__z4heap()");
  const rssHeld = chromeTreeRssMB();
  const heapSettled = await cdp.evalJs("window.__z4t3release()");
  await sleep(500);
  const heapSettled2 = await cdp.evalJs("window.__z4heap()");
  const rssSettled = chromeTreeRssMB();
  const ctrlO = await runStepPoll("__z4ctrlOverride", "__z4ctrlOResult", `"${base}/big-ctrl.mp4", ${T}`);
  const heapCtrlAfter = await cdp.evalJs("window.__z4heap()");
  const rssCtrlAfter = chromeTreeRssMB();
  const ctrlD = await runStepPoll("__z4ctrlDefault", "__z4ctrlDResult", `"${base}/big-def.mp4", ${T}`, 180);
  const summary = {
    fileSize, fileMiB: MiB(fileSize), windowT: T, wiring,
    baseline: { usedMiB: MiB(heap0.used), totalMiB: MiB(heap0.total), gc: heap0.gc, rssTreeMiB: rss0 },
    t3: { ...t3.result, peakUsedMiB: MiB(t3.peakUsed),
      heldUsedMiB: MiB(heapHeld.used), settledUsedMiB: MiB(heapSettled.used),
      settled2UsedMiB: MiB(heapSettled2.used),
      deltaPeakMiB: heap0.used !== null && t3.peakUsed !== null ? MiB(t3.peakUsed - heap0.used) : null,
      deltaHeldMiB: heap0.used !== null && heapHeld.used !== null ? MiB(heapHeld.used - heap0.used) : null,
      deltaSettledMiB: heap0.used !== null && heapSettled.used !== null ? MiB(heapSettled.used - heap0.used) : null,
      peakOverFile: t3.peakUsed !== null ? +(t3.peakUsed / fileSize).toFixed(3) : null,
      heldOverFile: heapHeld.used !== null && heap0.used !== null ? +((heapHeld.used - heap0.used) / fileSize).toFixed(3) : null,
      peakRssTreeMiB: t3.peakRss, deltaPeakRssMiB: rss0 !== null && t3.peakRss !== null ? +(t3.peakRss - rss0).toFixed(2) : null,
      heldRssTreeMiB: rssHeld, settledRssTreeMiB: rssSettled,
      deltaHeldRssMiB: rss0 !== null && rssHeld !== null ? +(rssHeld - rss0).toFixed(2) : null },
    ctrlOverride: { ...ctrlO.result, peakUsedMiB: MiB(ctrlO.peakUsed),
      afterUsedMiB: MiB(heapCtrlAfter.used),
      deltaPeakMiB: heap0.used !== null && ctrlO.peakUsed !== null ? MiB(ctrlO.peakUsed - heap0.used) : null,
      peakOverFile: ctrlO.peakUsed !== null ? +(ctrlO.peakUsed / fileSize).toFixed(3) : null,
      peakRssTreeMiB: ctrlO.peakRss, afterRssTreeMiB: rssCtrlAfter,
      deltaPeakRssMiB: rss0 !== null && ctrlO.peakRss !== null ? +(ctrlO.peakRss - rss0).toFixed(2) : null },
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
  const outJson = path.join(SCRATCH, `heap-result-${label}.json`);
  fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));
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
  record("rss-measured", rss0 !== null && t.peakRssTreeMiB !== null,
    `RSS cây Chrome: baseline=${rss0} MiB, đỉnh T3=${t.peakRssTreeMiB} MiB (delta ${t.deltaPeakRssMiB} MiB), lúc giữ=${t.heldRssTreeMiB} MiB, sau nhả=${t.settledRssTreeMiB} MiB, đỉnh controller=${c.peakRssTreeMiB} MiB (delta ${c.deltaPeakRssMiB} MiB), sau decode=${c.afterRssTreeMiB} MiB`);
  if (results.some((r) => !r.ok)) exitCode = 1;
} catch (e) {
  console.error(`FAIL harness — ${e.message}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { xvfb?.kill("SIGKILL"); } catch { /* bỏ qua */ }
  await new Promise((r) => server.close(() => r()));
}
console.log(`\nZ4 heap headed: ${results.filter((r) => r.ok).length}/${results.length} cổng pass (xem ${path.join(SCRATCH, `heap-result-${label}.json`)})`);
process.exit(exitCode);
