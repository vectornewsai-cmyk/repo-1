// gop-headed-bridge-43y4.mjs — Headed end-to-end qua route bridge Express
// THẬT (Phase 9 đợt 43, luồng Y4; đóng nợ đợt 42 §5.5 "headed qua route
// bridge Express thật" — harness X4 dùng server node:http tối giản).
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gop-headed-bridge-43y4.mjs [fixture-60s]
// Mặc định fixture: /tmp/round43-y4/base60.mp4 (ffmpeg testsrc2 720p
// 60 s, B-frame + audio AAC, faststart — cùng công thức X4, file đo
// 37.100.156 byte).
//
// Giàn đo (khác X4 ở đúng chỗ cần khác):
//  - Bridge THẬT: chạy nguyên vẹn server/bridge/src/index.js (không sửa
//    code bridge, không sửa route) trên cổng Y4_BRIDGE_PORT (mặc định
//    8943) với BRIDGE_WORK_DIR=/tmp/round43-y4/bridge-work và
//    BRIDGE_RATE_GENERAL=5000 (tiền lệ W4, tránh 429 làm nhiễu số đo).
//    Fixture được ĐẶT SẴN vào <work>/proxies/ dưới 2 tên (bridge-a.mp4,
//    bridge-b.mp4) rồi phục vụ qua route thật
//    GET /api/proxy/file/:name (Express sendFile — hỗ trợ Range sẵn).
//    Đây là cách W4 đã dùng để đo bridge; KHÔNG đi qua POST /api/proxy
//    (route đó transcode ra proxy nhẹ, không phải file đo).
//  - Page/bundle vẫn serve từ server harness riêng trên loopback
//    (bridge không có route static cho page) — origin loopback nên
//    CORS bridge (chỉ cấp ACAO cho origin loopback, xem SECURITY.md
//    §3.1) cho phép đọc response; harness kiểm chứng ACAO thật bằng
//    1 fetch HEAD từ page trước khi chạy controller.
//  - Kế toán request/byte phía BROWSER bằng CDP Network (requestWillBeSent
//    + responseReceived + loadingFinished) thay vì log server, vì bridge
//    không log request: đếm theo URL bridge, body byte suy từ
//    Content-Range/Content-Length trong header response (HEAD = 0).
//    Số encodedDataLength (gồm header) cũng ghi ra để đối chiếu, nhưng
//    cổng delta dùng body byte cho khớp cách đếm của X4.
//  - Chromium headed thật, công thức X4 (Xvfb, --disable-gpu, target
//    type=page). Không mạo nhận màn hình vật lý / GPU thật.
//
// Cổng PASS/FAIL (14 cổng: 10 cổng mirror X4 + 4 cổng bridge/CORS/expose):
//  - GOP: gop-range, probe head + size đúng file, 0 GET toàn file,
//    drawn > 0, pixel > 50%; cửa sổ lặp delta 0 request / 0 body byte;
//  - Mặc định: off, đúng 1 GET toàn file, drawn > 0.
//  - Bridge: HEAD trả Content-Length + Accept-Ranges bytes; Range 0-0
//    trả 206 + Content-Range đúng; CORS ACAO có cho origin loopback.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = "/tmp/round43-y4";
const FIXTURE = process.argv[2] || path.join(SCRATCH, "base60.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.Y4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.Y4_DEBUG_PORT || 9364);
const HTTP_PORT = Number(process.env.Y4_HTTP_PORT || 8920);
const BRIDGE_PORT = Number(process.env.Y4_BRIDGE_PORT || 8943);
const BRIDGE_WORK = path.join(SCRATCH, "bridge-work");

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
if (!fs.existsSync(CHROME)) fail("chrome", `không thấy Chrome ${CHROME}`);
const fileBuf = fs.readFileSync(FIXTURE);
const fileSize = fileBuf.length;
console.log(`fixture: ${FIXTURE} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB`);

// ---- 1. Đặt fixture vào proxies/ của bridge + khởi động bridge thật ----
fs.mkdirSync(path.join(BRIDGE_WORK, "proxies"), { recursive: true });
fs.copyFileSync(FIXTURE, path.join(BRIDGE_WORK, "proxies", "bridge-a.mp4"));
fs.copyFileSync(FIXTURE, path.join(BRIDGE_WORK, "proxies", "bridge-b.mp4"));
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
console.log(`bridge lên: HEAD /api/proxy/file/bridge-a.mp4 → ${headResp.status}, content-length=${headResp.headers.get("content-length")}, accept-ranges=${headResp.headers.get("accept-ranges")}, content-type=${headResp.headers.get("content-type")}`);
const range00 = await fetch(`${bridgeBase}/api/proxy/file/bridge-a.mp4`, { headers: { Range: "bytes=0-0" } });
console.log(`bridge Range 0-0 → ${range00.status}, content-range=${range00.headers.get("content-range")}, accept-ranges=${range00.headers.get("accept-ranges")}`);
await range00.arrayBuffer().catch(() => null);

// ---- 2. Bundle + page (mirror X4, URL trỏ sang bridge) ----
fs.mkdirSync(SCRATCH, { recursive: true });
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "bridge-bundle.mjs");
const b = spawnSync(esbuild, [
  path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"),
  "--bundle", "--platform=browser", "--format=esm",
  `--outfile=${bundleOut}`,
], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) fail("esbuild-bundle", ((b.error && b.error.message) || b.stderr || b.stdout || "esbuild lỗi không rõ").slice(0, 500));
const pageHtml = `<!doctype html><meta charset="utf-8"><title>Y4 GOP headed bridge</title>
<canvas id="c" width="1280" height="720"></canvas>
<script type="module">
import { ReversePreviewController } from "./bridge-bundle.mjs";
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
let ctrl = null, ctrl2 = null;
window.__y4bridgeHead = async () => {
  const r = await fetch(BRIDGE + "/api/proxy/file/bridge-a.mp4", { method: "HEAD" });
  return { status: r.status, acao: r.headers.get("access-control-allow-origin"),
    length: r.headers.get("content-length"), acceptRanges: r.headers.get("accept-ranges") };
};
window.__y4stepGop = async () => {
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
window.__y4stepAgain = async () => {
  return { ok: await ctrl.ensureWindowForTime(T), gopMode: ctrl.gopMode, cacheSize: ctrl.cacheSize };
};
window.__y4stepDef = async () => {
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
window.__y4ready = true;
</script>`;
writeFileEpermRetry(path.join(SCRATCH, "bridge-page.html"), pageHtml);
const server = createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname === "/bridge-page.html") {
    res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(path.join(SCRATCH, "bridge-page.html"))); return;
  }
  if (u.pathname === "/bridge-bundle.mjs") {
    res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); return;
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
console.log(`page server: http://127.0.0.1:${HTTP_PORT}/bridge-page.html (origin loopback, fetch sang bridge :${BRIDGE_PORT})`);

// ---- 3. Xvfb + Chrome headed (công thức X4) ----
let xvfb = null;
let display = process.env.DISPLAY || null;
if (!display) {
  for (const num of [97, 96, 93]) {
    xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xvfb.exitCode === null) { display = `:${num}`; break; }
    xvfb = null;
  }
  if (!display) fail("xvfb", "không khởi động được Xvfb (:97/:96/:93 đều bận hoặc lỗi)");
  console.log(`xvfb: DISPLAY=${display}`);
}
const profile = path.join(SCRATCH, "bridge-chrome-profile");
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
      // Network events (không có id): gom ở ngoài qua onNetwork.
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
// Kế toán Network phía browser cho URL bridge (body byte từ header).
const netReq = new Map(); // requestId -> {url, method, range, status, bodyBytes, encoded}
function bodyBytesFromHeaders(headers, status, method) {
  // HEAD không có body dù sendFile vẫn đặt Content-Length = size file:
  // tính body HEAD = 0, nếu không kế toán phình đúng 1 file mỗi HEAD.
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
          status: null, bodyBytes: 0, encoded: 0 });
      }
    } else if (method === "Network.responseReceived") {
      const e = netReq.get(p.requestId);
      if (e) {
        e.status = p.response.status;
        const h = {};
        for (const [k, v] of Object.entries(p.response.headers || {})) h[k.toLowerCase()] = v;
        e.bodyBytes = bodyBytesFromHeaders(h, p.response.status, e.method);
      }
    } else if (method === "Network.loadingFinished") {
      const e = netReq.get(p.requestId);
      if (e) e.encoded = p.encodedDataLength;
    }
  };
  await cdp.send("Network.enable", {});
  await cdp.send("Page.enable", {});
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/bridge-page.html` });
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__y4ready === true").catch(() => false);
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
  const corsHead = await runStep("__y4bridgeHead", "__y4corsResult", 60);
  const s0 = snap("bridge-a.mp4");
  const gop = await runStep("__y4stepGop", "__y4gopResult");
  const s1 = snap("bridge-a.mp4");
  const again = await runStep("__y4stepAgain", "__y4againResult");
  const s2 = snap("bridge-a.mp4");
  const def = await runStep("__y4stepDef", "__y4defResult");
  const s3 = snap("bridge-b.mp4");
  // Chờ loadingFinished xả hết (encoded có thể về sau responseReceived).
  await sleep(1000);
  const s1b = snap("bridge-a.mp4");
  const s3b = snap("bridge-b.mp4");
  const pathA = [...netReq.values()].filter((r) => r.url.endsWith("bridge-a.mp4"));
  const pathB = [...netReq.values()].filter((r) => r.url.endsWith("bridge-b.mp4"));
  const summary = {
    fileSize, fileMiB: +(fileSize / 1048576).toFixed(2),
    bridgeNodeCheck: { headStatus: headResp.status,
      headContentLength: headResp.headers.get("content-length"),
      headAcceptRanges: headResp.headers.get("accept-ranges"),
      range00Status: range00.status, range00ContentRange: range00.headers.get("content-range") },
    corsHead, gop, gopAgain: again, def,
    deltaGopWindow: { requests: s1.n - s0.n, bodyBytes: s1.bodyBytes - s0.bodyBytes, encodedBytes: s1.encodedBytes - s0.encodedBytes },
    deltaAgainWindow: { requests: s2.n - s1.n, bodyBytes: s2.bodyBytes - s1.bodyBytes },
    deltaDefaultWindow: { requests: s3.n, bodyBytes: s3.bodyBytes, encodedBytes: s3.encodedBytes },
    pathA: { requests: pathA.length, bodyBytes: pathA.reduce((s, r) => s + r.bodyBytes, 0),
      encodedBytes: s1b.encodedBytes,
      head: pathA.filter((r) => r.method === "HEAD").length,
      fullGet: pathA.filter((r) => r.method === "GET" && r.range === null).length,
      range206: pathA.filter((r) => r.status === 206).length },
    pathB: { requests: pathB.length, bodyBytes: pathB.reduce((s, r) => s + r.bodyBytes, 0),
      encodedBytes: s3b.encodedBytes,
      head: pathB.filter((r) => r.method === "HEAD").length,
      fullGet: pathB.filter((r) => r.method === "GET" && r.range === null).length,
      range206: pathB.filter((r) => r.status === 206).length },
  };
  writeFileEpermRetry(path.join(SCRATCH, "bridge-result.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  const g = summary.gop;
  record("bridge-head-headers", headResp.status === 200 && headResp.headers.get("content-length") === String(fileSize) && headResp.headers.get("accept-ranges") === "bytes",
    `HEAD: length=${headResp.headers.get("content-length")}, accept-ranges=${headResp.headers.get("accept-ranges")}`);
  record("bridge-range00", range00.status === 206 && range00.headers.get("content-range") === `bytes 0-0/${fileSize}`,
    `Range 0-0: ${range00.status} ${range00.headers.get("content-range")}`);
  // ACAO bản thân nó KHÔNG phải header JS đọc được cross-origin (không
  // safelisted, không exposed) nên acao=null là đúng luật browser, không
  // phải lỗi CORS: bằng chứng CORS cho phép là fetch thành công + đọc
  // được status/length (fetch bị chặn CORS sẽ reject, không trả 200).
  record("bridge-cors-loopback", corsHead.status === 200 && corsHead.length === String(fileSize),
    `fetch HEAD từ page loopback: status=${corsHead.status}, length=${corsHead.length}, ACAO=${corsHead.acao} (null là đúng luật browser — ACAO không exposed; fetch thành công đã chứng minh CORS cho phép)`);
  record("bridge-exposed-headers", corsHead.acceptRanges === "bytes",
    `page đọc được Accept-Ranges=${corsHead.acceptRanges} nhờ Access-Control-Expose-Headers (ROUND43-Y4); trước fix này là null và GOP fallback`);
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
console.log(`\nY4 bridge headed: ${results.filter((r) => r.ok).length}/${results.length} cổng pass (xem ${path.join(SCRATCH, "bridge-result.json")})`);
process.exit(exitCode);
