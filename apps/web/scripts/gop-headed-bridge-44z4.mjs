// gop-headed-bridge-44z4.mjs — Headed qua route bridge Express THẬT:
// (a) kiểm tra lại CORS expose Accept-Ranges/Content-Range của Y4 vẫn
// đúng qua route thật với code T3 mới của Z4; (b) chứng minh đầu-cuối
// thiết kế moov-header mới: file moov 16 MiB thật nay đi đường GOP
// thay vì fallback (Y4: full-file-fallback).
// (Phase 9 đợt 44, luồng Z4.)
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gop-headed-bridge-44z4.mjs <base60.mp4> <moovlarge60.mp4>
// base60: ffmpeg testsrc2 720p 60 s B-frame + audio AAC faststart
// (công thức X4/Y4); moovlarge60: tạo từ base60 bằng script Y4
// make-moov-large-fixture-43y4.py (moov đúng 16 MiB). Scratch:
// $Z4_SCRATCH hoặc ~/scratch-round44-z4 (không dùng /tmp tmpfs 512 MiB
// chung với các luồng đợt 44 khác).
//
// Giàn đo (như Y4, khác ở đúng chỗ cần khác):
//  - Bridge THẬT nguyên vẹn server/bridge/src/index.js (không sửa
//    code bridge trong luồng này — chỉ kiểm chứng fix CORS của Y4 còn
//    hiệu lực) trên cổng Z4_BRIDGE_PORT, work-dir trong scratch,
//    BRIDGE_RATE_GENERAL=5000. Fixture đặt sẵn vào <work>/proxies/
//    (bridge-a/b = base60, bridge-c = moovlarge60) qua route thật
//    GET /api/proxy/file/:name (Express sendFile, Range sẵn).
//  - Page/bundle serve từ server harness riêng trên loopback — đúng
//    cấu hình cross-origin của web UI thật (vite :5173 → bridge
//    :8787): page fetch bridge là cross-origin khác port, nên header
//    Accept-Ranges/Content-Range chỉ đọc được từ JS khi bridge expose
//    chúng (fix Y4). Harness kiểm chứng cả hai header từ JS, không
//    chỉ từ Node (Node không qua CORS nên không lộ lỗi này).
//  - Kế toán phía BROWSER bằng CDP Network (body byte suy từ
//    Content-Range/Content-Length; HEAD = 0, như Y4).
//  - Chromium headed thật, công thức X4 (Xvfb, --disable-gpu, target
//    type=page). Không mạo nhận màn hình vật lý / GPU thật.
//
// Cổng PASS/FAIL (19 cổng: 14 mirror Y4 + CORS Range expose + 4 cổng
// moovlarge): xem cuối file. Mọi số headed đều under-load (các luồng
// đợt 44 khác đang chạy) — cấm dùng làm baseline quiet hay claim fps.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.Z4_SCRATCH || path.join(os.homedir(), "scratch-round44-z4");
const FIXTURE = process.argv[2] || path.join(SCRATCH, "base60.mp4");
const MOOVLARGE = process.argv[3] || path.join(SCRATCH, "moovlarge60.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.Z4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.Z4_DEBUG_PORT || 9374);
const HTTP_PORT = Number(process.env.Z4_HTTP_PORT || 8930);
const BRIDGE_PORT = Number(process.env.Z4_BRIDGE_PORT || 8953);
const BRIDGE_WORK = path.join(SCRATCH, "bridge-work-44z4");

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function fail(name, detail) {
  record(name, false, detail);
  throw new Error(`${name}: ${detail}`);
}

if (!fs.existsSync(FIXTURE)) fail("fixture", `không thấy fixture ${FIXTURE}`);
if (!fs.existsSync(MOOVLARGE)) fail("fixture-moovlarge", `không thấy fixture moov lớn ${MOOVLARGE}`);
if (!fs.existsSync(CHROME)) fail("chrome", `không thấy Chrome ${CHROME}`);
const fileSize = fs.statSync(FIXTURE).size;
const moovSize = fs.statSync(MOOVLARGE).size;
console.log(`fixture base: ${FIXTURE} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB`);
console.log(`fixture moovlarge: ${MOOVLARGE} size=${moovSize} byte = ${(moovSize / 1048576).toFixed(2)} MiB`);

// ---- 1. Đặt fixture vào proxies/ của bridge + khởi động bridge thật ----
fs.mkdirSync(path.join(BRIDGE_WORK, "proxies"), { recursive: true });
fs.copyFileSync(FIXTURE, path.join(BRIDGE_WORK, "proxies", "bridge-a.mp4"));
fs.copyFileSync(FIXTURE, path.join(BRIDGE_WORK, "proxies", "bridge-b.mp4"));
fs.copyFileSync(MOOVLARGE, path.join(BRIDGE_WORK, "proxies", "bridge-c.mp4"));
const bridge = spawn("node", [path.join(REPO, "server/bridge/src/index.js")], {
  stdio: "pipe",
  // Đợt 66 T9 — persist riêng theo PID (BRIDGE_WORK cố định giữa các lần chạy): tránh rò mốc limiter sang test khác (đợt 65 §3b).
  env: { ...process.env, BRIDGE_PORT: String(BRIDGE_PORT), BRIDGE_WORK_DIR: BRIDGE_WORK, BRIDGE_RATE_GENERAL: "5000", BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK, `rate-limit-${process.pid}.json`) },
});
let bridgeLog = "";
bridge.stdout?.on("data", (d) => { bridgeLog += d.toString(); });
bridge.stderr?.on("data", (d) => { bridgeLog += d.toString(); });
const bridgeBase = `http://127.0.0.1:${BRIDGE_PORT}`;
async function waitBridge() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${bridgeBase}/api/proxy/file/bridge-a.mp4`, { method: "HEAD" });
      if (r.status === 200) return r;
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  throw new Error(`bridge không lên sau 30 s (log: ${bridgeLog.slice(0, 500)})`);
}
const headResp = await waitBridge();
console.log(`bridge lên: HEAD /api/proxy/file/bridge-a.mp4 → ${headResp.status}, content-length=${headResp.headers.get("content-length")}, accept-ranges=${headResp.headers.get("accept-ranges")}`);
const range00 = await fetch(`${bridgeBase}/api/proxy/file/bridge-a.mp4`, { headers: { Range: "bytes=0-0" } });
console.log(`bridge Range 0-0 → ${range00.status}, content-range=${range00.headers.get("content-range")}, accept-ranges=${range00.headers.get("accept-ranges")}`);
await range00.arrayBuffer().catch(() => null);

// ---- 2. Bundle + page (mirror Y4 + bước moovlarge + CORS Range check) ----
fs.mkdirSync(SCRATCH, { recursive: true });
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "bridge44-bundle.mjs");
const b = spawnSync(esbuild, [
  path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"),
  "--bundle", "--platform=browser", "--format=esm",
  `--outfile=${bundleOut}`,
], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) fail("esbuild-bundle", ((b.error && b.error.message) || b.stderr || b.stdout || "esbuild lỗi không rõ").slice(0, 500));
const pageHtml = `<!doctype html><meta charset="utf-8"><title>Z4 GOP headed bridge</title>
<canvas id="c" width="1280" height="720"></canvas>
<script type="module">
import { ReversePreviewController } from "./bridge44-bundle.mjs";
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
function pixelStats() {
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let nz = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] || d[i + 1] || d[i + 2]) nz++;
  return { nonZero: nz, total: canvas.width * canvas.height };
}
const BRIDGE = ${JSON.stringify(bridgeBase)};
const T = 59.0;
let ctrl = null, ctrl2 = null, ctrl3 = null;
window.__z4bridgeHead = async () => {
  const r = await fetch(BRIDGE + "/api/proxy/file/bridge-a.mp4", { method: "HEAD" });
  return { status: r.status, acao: r.headers.get("access-control-allow-origin"),
    length: r.headers.get("content-length"), acceptRanges: r.headers.get("accept-ranges") };
};
// Z4 mới: đọc Content-Range từ JS qua Range 0-0 — header này cũng
// phải được expose thì T3/probe mới thấy tổng file cross-origin.
window.__z4bridgeRange = async () => {
  const r = await fetch(BRIDGE + "/api/proxy/file/bridge-a.mp4", { headers: { Range: "bytes=0-0" } });
  await r.arrayBuffer().catch(() => null);
  return { status: r.status, contentRange: r.headers.get("content-range"),
    acceptRanges: r.headers.get("accept-ranges") };
};
window.__z4stepGop = async () => {
  ctrl = new ReversePreviewController(BRIDGE + "/api/proxy/file/bridge-a.mp4", undefined, { gopRangeEnabled: true });
  const ok = await ctrl.ensureWindowForTime(T);
  let drawn = 0, missing = 0;
  if (ok) {
    const r = ctrl.presentCachedReverse((frame) => { ctx.drawImage(frame, 0, 0, canvas.width, canvas.height); });
    drawn = r.drawn; missing = r.missing;
  }
  return { ok, ready: ctrl.ready, gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe,
    fallback: ctrl.gopFallbackReason, cacheSize: ctrl.cacheSize, drawn, missing, pixels: pixelStats(),
    videoDecoder: typeof VideoDecoder !== "undefined" };
};
window.__z4stepAgain = async () => {
  return { ok: await ctrl.ensureWindowForTime(T), gopMode: ctrl.gopMode, cacheSize: ctrl.cacheSize };
};
window.__z4stepDef = async () => {
  ctrl2 = new ReversePreviewController(BRIDGE + "/api/proxy/file/bridge-b.mp4");
  const ok2 = await ctrl2.ensureWindowForTime(T);
  let drawn2 = 0, missing2 = 0;
  if (ok2) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const r2 = ctrl2.presentCachedReverse((frame) => { ctx.drawImage(frame, 0, 0, canvas.width, canvas.height); });
    drawn2 = r2.drawn; missing2 = r2.missing;
  }
  return { ok: ok2, ready: ctrl2.ready, gopMode: ctrl2.gopMode, probe: ctrl2.gopSizeProbe,
    drawn: drawn2, missing: missing2, pixels: pixelStats() };
};
window.__z4stepMoovlarge = async () => {
  ctrl3 = new ReversePreviewController(BRIDGE + "/api/proxy/file/bridge-c.mp4", undefined, { gopRangeEnabled: true });
  const ok3 = await ctrl3.ensureWindowForTime(T);
  let drawn3 = 0, missing3 = 0;
  if (ok3) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const r3 = ctrl3.presentCachedReverse((frame) => { ctx.drawImage(frame, 0, 0, canvas.width, canvas.height); });
    drawn3 = r3.drawn; missing3 = r3.missing;
  }
  return { ok: ok3, ready: ctrl3.ready, gopMode: ctrl3.gopMode, probe: ctrl3.gopSizeProbe,
    fallback: ctrl3.gopFallbackReason, cacheSize: ctrl3.cacheSize,
    drawn: drawn3, missing: missing3, pixels: pixelStats() };
};
window.__z4ready = true;
</script>`;
fs.writeFileSync(path.join(SCRATCH, "bridge44-page.html"), pageHtml);
const server = createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname === "/bridge44-page.html") {
    res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(path.join(SCRATCH, "bridge44-page.html"))); return;
  }
  if (u.pathname === "/bridge44-bundle.mjs") {
    res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); return;
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
console.log(`page server: http://127.0.0.1:${HTTP_PORT}/bridge44-page.html (origin loopback, fetch sang bridge :${BRIDGE_PORT})`);

// ---- 3. Xvfb + Chrome headed (công thức X4) ----
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
const profile = path.join(SCRATCH, "bridge44-chrome-profile");
fs.rmSync(profile, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${profile}`,
  "--no-sandbox", "--disable-dev-shm-usage",
  "--disable-gpu", "--no-first-run",
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
      if (msg.method && this.onNetwork) this.onNetwork(msg.method, msg.params);
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
const netReq = new Map();
function bodyBytesFromHeaders(headers, status, method) {
  if (method === "HEAD") return 0;
  if (status === 200 && headers["content-length"]) return Number(headers["content-length"]);
  const cr = headers["content-range"];
  if (cr) {
    const m = /^bytes (\d+)-(\d+)\//.exec(cr);
    if (m) return Number(m[2]) - Number(m[1]) + 1;
  }
  return 0;
}
let exitCode = 0;
try {
  const cdp = new CDP(await getWsUrl());
  cdp.onNetwork = (method, p) => {
    if (method === "Network.requestWillBeSent") {
      if (p.request.url.includes("/api/proxy/file/")) {
        netReq.set(p.requestId, { url: p.request.url, method: p.request.method,
          range: p.request.headers?.Range ?? p.request.headers?.range ?? null,
          status: null, bodyBytes: 0, encoded: 0, contentRange: null });
      }
    } else if (method === "Network.responseReceived") {
      const e = netReq.get(p.requestId);
      if (e) {
        e.status = p.response.status;
        const h = {};
        for (const [k, v] of Object.entries(p.response.headers || {})) h[k.toLowerCase()] = v;
        e.bodyBytes = bodyBytesFromHeaders(h, p.response.status, e.method);
        e.contentRange = h["content-range"] ?? null;
      }
    } else if (method === "Network.loadingFinished") {
      const e = netReq.get(p.requestId);
      if (e) e.encoded = p.encodedDataLength;
    }
  };
  await cdp.send("Network.enable", {});
  await cdp.send("Page.enable", {});
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/bridge44-page.html` });
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__z4ready === true").catch(() => false);
    if (ready) break;
    if (i === 59) throw new Error("page không sẵn sau 30 s");
    await sleep(500);
  }
  async function runStep(stepFn, resultKey, timeoutS = 300) {
    await cdp.send("Runtime.evaluate", {
      expression: `window.${resultKey} = null; window.${stepFn}().then((r) => { window.${resultKey} = r; }).catch((e) => { window.${resultKey} = { __error: String(e && e.message || e) }; })`,
      returnByValue: true,
    });
    for (let i = 0; i < timeoutS * 2; i++) {
      const v = await cdp.evalJs(`window.${resultKey}`).catch(() => null);
      if (v) {
        if (v.__error) throw new Error(`${stepFn} lỗi trong page: ${v.__error}`);
        return v;
      }
      await sleep(500);
    }
    throw new Error(`${stepFn} không trả kết quả sau ${timeoutS} s`);
  }
  const snap = (pathSuffix) => {
    const arr = [...netReq.values()].filter((r) => r.url.endsWith(pathSuffix));
    return { n: arr.length, bodyBytes: arr.reduce((s, r) => s + r.bodyBytes, 0),
      encodedBytes: arr.reduce((s, r) => s + r.encoded, 0) };
  };
  const corsHead = await runStep("__z4bridgeHead", "__z4corsResult", 60);
  const corsRange = await runStep("__z4bridgeRange", "__z4corsRangeResult", 60);
  const s0 = snap("bridge-a.mp4");
  const gop = await runStep("__z4stepGop", "__z4gopResult");
  const s1 = snap("bridge-a.mp4");
  const again = await runStep("__z4stepAgain", "__z4againResult");
  const s2 = snap("bridge-a.mp4");
  const def = await runStep("__z4stepDef", "__z4defResult");
  const s3 = snap("bridge-b.mp4");
  const sC0 = snap("bridge-c.mp4");
  const moovlarge = await runStep("__z4stepMoovlarge", "__z4moovlargeResult");
  const sC1 = snap("bridge-c.mp4");
  await sleep(1000);
  const pathA = [...netReq.values()].filter((r) => r.url.endsWith("bridge-a.mp4"));
  const pathB = [...netReq.values()].filter((r) => r.url.endsWith("bridge-b.mp4"));
  const pathC = [...netReq.values()].filter((r) => r.url.endsWith("bridge-c.mp4"));
  const moovRangeResps = pathC.filter((r) => {
    if (!r.contentRange) return false;
    const m = /^bytes (\d+)-(\d+)\//.exec(r.contentRange);
    return m && (Number(m[2]) - Number(m[1]) + 1) === 16 * 1024 * 1024;
  });
  const summary = {
    fileSize, fileMiB: +(fileSize / 1048576).toFixed(2),
    moovlargeSize: moovSize, moovlargeMiB: +(moovSize / 1048576).toFixed(2),
    bridgeNodeCheck: { headStatus: headResp.status,
      headContentLength: headResp.headers.get("content-length"),
      headAcceptRanges: headResp.headers.get("accept-ranges"),
      range00Status: range00.status, range00ContentRange: range00.headers.get("content-range") },
    corsHead, corsRange, gop, gopAgain: again, def, moovlarge,
    deltaGopWindow: { requests: s1.n - s0.n, bodyBytes: s1.bodyBytes - s0.bodyBytes, encodedBytes: s1.encodedBytes - s0.encodedBytes },
    deltaAgainWindow: { requests: s2.n - s1.n, bodyBytes: s2.bodyBytes - s1.bodyBytes },
    deltaDefaultWindow: { requests: s3.n, bodyBytes: s3.bodyBytes, encodedBytes: s3.encodedBytes },
    deltaMoovlargeWindow: { requests: sC1.n - sC0.n, bodyBytes: sC1.bodyBytes - sC0.bodyBytes,
      moovSizeResponses: moovRangeResps.length,
      moovSizeRanges: moovRangeResps.map((r) => r.contentRange) },
    pathA: { requests: pathA.length, bodyBytes: pathA.reduce((s, r) => s + r.bodyBytes, 0),
      head: pathA.filter((r) => r.method === "HEAD").length,
      fullGet: pathA.filter((r) => r.method === "GET" && r.range === null).length,
      range206: pathA.filter((r) => r.status === 206).length },
    pathB: { requests: pathB.length, bodyBytes: pathB.reduce((s, r) => s + r.bodyBytes, 0),
      head: pathB.filter((r) => r.method === "HEAD").length,
      fullGet: pathB.filter((r) => r.method === "GET" && r.range === null).length,
      range206: pathB.filter((r) => r.status === 206).length },
    pathC: { requests: pathC.length, bodyBytes: pathC.reduce((s, r) => s + r.bodyBytes, 0),
      head: pathC.filter((r) => r.method === "HEAD").length,
      fullGet: pathC.filter((r) => r.method === "GET" && r.range === null).length,
      range206: pathC.filter((r) => r.status === 206).length },
  };
  fs.writeFileSync(path.join(SCRATCH, "bridge-result-44z4.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  const g = summary.gop;
  const m = summary.moovlarge;
  record("bridge-head-headers", headResp.status === 200 && headResp.headers.get("content-length") === String(fileSize) && headResp.headers.get("accept-ranges") === "bytes",
    `HEAD: length=${headResp.headers.get("content-length")}, accept-ranges=${headResp.headers.get("accept-ranges")}`);
  record("bridge-range00", range00.status === 206 && range00.headers.get("content-range") === `bytes 0-0/${fileSize}`,
    `Range 0-0: ${range00.status} ${range00.headers.get("content-range")}`);
  record("bridge-cors-loopback", corsHead.status === 200 && corsHead.length === String(fileSize),
    `fetch HEAD từ page loopback: status=${corsHead.status}, length=${corsHead.length}, ACAO=${corsHead.acao} (null là đúng luật browser — ACAO không exposed; fetch thành công đã chứng minh CORS cho phép)`);
  record("bridge-exposed-accept-ranges", corsHead.acceptRanges === "bytes",
    `page đọc được Accept-Ranges=${corsHead.acceptRanges} nhờ Access-Control-Expose-Headers (ROUND43-Y4); trước fix này là null và GOP fallback`);
  record("bridge-exposed-content-range", corsRange.status === 206 && corsRange.contentRange === `bytes 0-0/${fileSize}`,
    `page đọc được Content-Range=${corsRange.contentRange} qua Range 0-0 (Z4 mới — Y4 chỉ kiểm HEAD); header này cũng nằm trong exposedHeaders của Y4`);
  record("headed-video-decoder", g.videoDecoder === true, `VideoDecoder có sẵn: ${g.videoDecoder}`);
  record("gop-mode", g.gopMode === "gop-range", `gopMode=${g.gopMode}`);
  record("gop-probe", g.probe && g.probe.source === "head" && g.probe.size === fileSize,
    `probe=${JSON.stringify(g.probe)}`);
  record("gop-no-full-get", summary.pathA.fullGet === 0,
    `path GOP bridge: full GET=${summary.pathA.fullGet}, HEAD=${summary.pathA.head}, 206=${summary.pathA.range206}, bodyBytes=${summary.pathA.bodyBytes} (${(summary.pathA.bodyBytes / fileSize * 100).toFixed(2)}% file)`);
  record("gop-drawn", g.ok === true && g.drawn > 0, `ensure=${g.ok}, drawn=${g.drawn}, missing=${g.missing}, cache=${g.cacheSize}`);
  const pixRatio = g.pixels.total ? g.pixels.nonZero / g.pixels.total : 0;
  record("gop-canvas-pixels", pixRatio > 0.5, `pixel khác 0: ${g.pixels.nonZero}/${g.pixels.total} (${(pixRatio * 100).toFixed(1)}%)`);
  record("gop-again-no-request", again.ok === true && summary.deltaAgainWindow.requests === 0 && summary.deltaAgainWindow.bodyBytes === 0,
    `cửa sổ lặp: ok=${again.ok}, delta=${summary.deltaAgainWindow.requests} request/${summary.deltaAgainWindow.bodyBytes} body byte (tiết kiệm đúng 1 lần tải toàn file = ${fileSize} byte)`);
  record("default-off", def.gopMode === "off", `mặc định: gopMode=${def.gopMode}, probe=${JSON.stringify(def.probe)}`);
  record("default-full-get", summary.pathB.fullGet === 1 && summary.pathB.bodyBytes >= fileSize,
    `path mặc định bridge: full GET=${summary.pathB.fullGet}, bodyBytes=${summary.pathB.bodyBytes}`);
  record("default-drawn", def.ok === true && def.drawn > 0, `mặc định: ensure=${def.ok}, drawn=${def.drawn}, missing=${def.missing}`);
  record("moovlarge-gop-mode", m.gopMode === "gop-range",
    `moov 16 MiB qua bridge thật: gopMode=${m.gopMode} (Y4: full-file-fallback), probe=${JSON.stringify(m.probe)}, fallback=${m.fallback}`);
  record("moovlarge-moov-request", summary.deltaMoovlargeWindow.requests === 64 && summary.deltaMoovlargeWindow.moovSizeResponses === 1,
    `path moovlarge: delta=${summary.deltaMoovlargeWindow.requests} request (1 HEAD + probe + prefix + moov + 60 GOP), response đúng 16 MiB=${summary.deltaMoovlargeWindow.moovSizeResponses} (${summary.deltaMoovlargeWindow.moovSizeRanges.join(",")}), full GET=${summary.pathC.fullGet}, bodyBytes=${summary.pathC.bodyBytes} (${(summary.pathC.bodyBytes / moovSize * 100).toFixed(2)}% file)`);
  record("moovlarge-drawn", m.ok === true && m.drawn > 0, `moovlarge: ensure=${m.ok}, drawn=${m.drawn}, missing=${m.missing}, cache=${m.cacheSize}`);
  const pixRatioM = m.pixels.total ? m.pixels.nonZero / m.pixels.total : 0;
  record("moovlarge-pixels", pixRatioM > 0.5, `moovlarge pixel khác 0: ${m.pixels.nonZero}/${m.pixels.total} (${(pixRatioM * 100).toFixed(1)}%)`);
  if (results.some((r) => !r.ok)) exitCode = 1;
} catch (e) {
  console.error(`FAIL harness — ${e.message}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { xvfb?.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { bridge.kill("SIGKILL"); } catch { /* bỏ qua */ }
  await new Promise((r) => server.close(() => r()));
}
console.log(`\nZ4 bridge headed: ${results.filter((r) => r.ok).length}/${results.length} cổng pass (xem ${path.join(SCRATCH, "bridge-result-44z4.json")})`);
process.exit(exitCode);
