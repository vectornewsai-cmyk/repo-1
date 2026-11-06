// gop-headed-e2e-42x4.mjs — Headed end-to-end thật cho đường GOP
// (Phase 9 đợt 42, luồng X4; đóng nợ đợt 41 §5.5 "headed test proxy →
// probe → GOP → frame ngược trên canvas" + "chia sẻ kết quả probe vào
// T3" ở mức browser thật, sau khi test Node X4 đã khóa việc bỏ HEAD).
//
// Cách chạy (từ gốc repo; KHÔNG cần vite build/preview vì harness tự
// bundle đúng module lib cần dùng, tránh HMR reload khi các luồng đợt
// 42 khác sửa file song song):
//   node apps/web/scripts/gop-headed-e2e-42x4.mjs [fixture-path]
// Mặc định fixture: /tmp/round42-x4/headed-bframe-audio.mp4 (phải tự
// tạo bằng ffmpeg trước, xem LIMITS X4 §3 — script KHÔNG tự tạo
// fixture để không giấu công thức footage sau lưng số đo).
//
// Những gì script làm:
//  1. esbuild bundle apps/web/src/lib/reverseWebcodecs.ts (kèm mọi dep
//     lib) ra scratch, serve kèm page HTML nhỏ qua node:http.
//  2. Server fixture (2 path riêng /proxy-a.mp4, /proxy-b.mp4 cùng trỏ
//     1 file) có hỗ trợ Range thật (HEAD → Content-Length +
//     Accept-Ranges; GET Range → 206 + Content-Range) và ghi log mọi
//     request (method/range/status/bytes) để kế toán byte.
//  3. Chạy Chromium headed THẬT (không cờ --headless; dưới Xvfb khi
//     không có DISPLAY — vẫn là cửa sổ/compositor thật, chỉ hiển thị
//     qua màn hình ảo, ghi rõ trong LIMITS; không mạo nhận màn hình
//     vật lý), lái bằng CDP --remote-debugging-port.
//  4. Trong page: controller GOP (gopRangeEnabled: true, KHÔNG truyền
//     known size — đúng đường proxy chưa biết size) ensureWindow ở
//     t = duration - 1 s, vẽ frame ngược lên canvas bằng
//     presentCachedReverse, đếm pixel khác 0; rồi gọi lại cùng mốc
//     thời gian để đo delta request (cửa sổ lặp lại); rồi controller
//     mặc định (KHÔNG bật GOP) trên path thứ hai để chứng minh mặc
//     định vẫn TẮT (gopMode off + 1 GET toàn file).
//
// Cổng PASS/FAIL (exit 1 khi trượt cổng nào):
//  - GOP: gopMode = gop-range, probe nguồn head + size đúng file,
//    không có GET toàn file trên path GOP, drawn > 0, pixel khác 0
//    > 50% canvas (testsrc2 nhiều màu, ngưỡng rộng để không flake
//    vì 1 frame tối).
//  - Lặp cửa sổ: delta request = 0, delta byte = 0 (tiết kiệm đúng
//    bằng 1 lần tải toàn file so với đường tải lại).
//  - Mặc định: gopMode = off, có đúng 1 GET toàn file, drawn > 0.
// Số byte lượt đầu GOP (~101,5% file, gồm probe + tiền tố + mọi GOP)
// được IN RA chứ không làm cổng tiết kiệm — tiết kiệm chỉ tính từ
// cửa sổ thứ hai trở đi, như W4 đã chốt; cấm đọc số lượt đầu thành
// "tiết kiệm".
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = "/tmp/round42-x4";
const FIXTURE = process.argv[2] || path.join(SCRATCH, "headed-bframe-audio.mp4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.X4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.X4_DEBUG_PORT || 9361);
const HTTP_PORT = Number(process.env.X4_HTTP_PORT || 8917);

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function fail(name, detail) {
  record(name, false, detail);
  throw new Error(`${name}: ${detail}`);
}

if (!fs.existsSync(FIXTURE)) fail("fixture", `không thấy fixture ${FIXTURE} (tạo bằng ffmpeg trước, xem LIMITS X4 §3)`);
if (!fs.existsSync(CHROME)) fail("chrome", `không thấy Chrome ${CHROME}`);
const fileBuf = fs.readFileSync(FIXTURE);
const fileSize = fileBuf.length;
console.log(`fixture: ${FIXTURE} size=${fileSize} byte = ${(fileSize / 1048576).toFixed(2)} MiB`);

// ---- 1. Bundle lib ra scratch ----
fs.mkdirSync(SCRATCH, { recursive: true });
const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "bundle.mjs");
const b = spawnSync(esbuild, [
  path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"),
  "--bundle", "--platform=browser", "--format=esm",
  `--outfile=${bundleOut}`,
], { stdio: "pipe", encoding: "utf8" });
if (b.status !== 0) fail("esbuild-bundle", ((b.error && b.error.message) || b.stderr || b.stdout || "esbuild lỗi không rõ").slice(0, 500));
console.log(`bundle: ${bundleOut} (${fs.statSync(bundleOut).size} byte)`);

// ---- 2. Page HTML (ghi ra scratch, không vào repo) ----
const pageHtml = `<!doctype html><meta charset="utf-8"><title>X4 GOP headed E2E</title>
<canvas id="c" width="1280" height="720"></canvas>
<script type="module">
import { ReversePreviewController } from "./bundle.mjs";
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
function pixelStats() {
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let nz = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] || d[i + 1] || d[i + 2]) nz++;
  return { nonZero: nz, total: canvas.width * canvas.height };
}
const T = 59.0;
let ctrl = null, ctrl2 = null;
// (a) Đường GOP: proxy chưa biết size, GOP bật tường minh.
window.__x4stepGop = async () => {
  ctrl = new ReversePreviewController("/proxy-a.mp4", undefined, { gopRangeEnabled: true });
  const ok = await ctrl.ensureWindowForTime(T);
  let drawn = 0, missing = 0;
  if (ok) {
    const r = ctrl.presentCachedReverse((frame) => { ctx.drawImage(frame, 0, 0, canvas.width, canvas.height); });
    drawn = r.drawn; missing = r.missing;
  }
  return { ok, ready: ctrl.ready, gopMode: ctrl.gopMode, probe: ctrl.gopSizeProbe,
    probeReason: ctrl.gopSizeProbeReason, fallback: ctrl.gopFallbackReason,
    cacheSize: ctrl.cacheSize, drawn, missing, pixels: pixelStats(),
    videoDecoder: typeof VideoDecoder !== "undefined" };
};
// (b) Lặp lại cùng mốc thời gian (pipe snapshot log trước/sau để đo delta).
window.__x4stepAgain = async () => {
  return { ok: await ctrl.ensureWindowForTime(T), gopMode: ctrl.gopMode, cacheSize: ctrl.cacheSize };
};
// (c) Mặc định TẮT: controller không bật GOP, cùng footage, path riêng.
window.__x4stepDef = async () => {
  ctrl2 = new ReversePreviewController("/proxy-b.mp4");
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
window.__x4ready = true;
</script>`;
fs.writeFileSync(path.join(SCRATCH, "page.html"), pageHtml);

// ---- 3. HTTP server: page/bundle + fixture 2 path, log mọi request ----
const reqLog = [];
const server = createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname === "/page.html") {
    const body = fs.readFileSync(path.join(SCRATCH, "page.html"));
    res.writeHead(200, { "Content-Type": "text/html" }); res.end(body); return;
  }
  if (u.pathname === "/bundle.mjs") {
    const body = fs.readFileSync(bundleOut);
    res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(body); return;
  }
  if (u.pathname === "/proxy-a.mp4" || u.pathname === "/proxy-b.mp4") {
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
console.log(`server: http://127.0.0.1:${HTTP_PORT}/page.html`);

// ---- 4. Xvfb (khi chưa có DISPLAY) + Chrome headed ----
let xvfb = null;
let display = process.env.DISPLAY || null;
if (!display) {
  for (const num of [99, 97, 96]) {
    xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xvfb.exitCode === null) { display = `:${num}`; break; }
    xvfb = null;
  }
  if (!display) fail("xvfb", "không khởi động được Xvfb (:99/:97/:96 đều bận hoặc lỗi)");
  console.log(`xvfb: DISPLAY=${display}`);
}
const profile = path.join(SCRATCH, "chrome-profile");
fs.rmSync(profile, { recursive: true, force: true }); // tránh SingletonLock kẹt từ lần chạy bị giết trước
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${profile}`,
  "--no-sandbox", "--disable-dev-shm-usage",
  // Headed thật (không cờ --headless) nhưng render phần mềm: Chrome
  // không --disable-gpu dưới Xvfb này không mở cổng CDP (đã thử, process
  // sống mà /json/list rỗng) — công thức đang chạy tốt của luồng X2
  // cũng dùng --disable-gpu dưới Xvfb, ghi rõ để không mạo nhận GPU.
  "--disable-gpu", "--no-first-run",
  "--window-size=1440,900", "--hide-scrollbars", "about:blank",
], { stdio: "ignore", env: { ...process.env, DISPLAY: display } });
await sleep(2000);
if (chrome.exitCode !== null) fail("chrome-launch", `Chrome thoát sớm với mã ${chrome.exitCode} (không headed được)`);

// ---- 5. CDP ----
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
  // /json/list trả NHIỀU target (webui-toolbar, omnibox, extension…):
  // list[0] KHÔNG phải page — đã từng làm evaluate chạy sai context và
  // page mãi không ready. Chỉ nhận target type === "page".
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
let exitCode = 0;
try {
  const cdp = new CDP(await getWsUrl());
  await cdp.send("Page.enable", {});
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/page.html` });
  // Chờ page sẵn (module import bundle xong).
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__x4ready === true").catch(() => false);
    if (ready) break;
    if (i === 59) throw new Error("page không sẵn sau 30 s");
    await sleep(500);
  }
  // Chạy từng bước, snapshot log server trước/sau mỗi bước để đo delta
  // thật (không gộp 3 bước vào 1 lượt rồi đoán delta từ log tổng).
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
    throw new Error(`${stepFn} không trả kết quả sau ${timeoutS} s (decode/fetch kẹt?)`);
  }
  const snap = () => ({ n: reqLog.length, bytes: reqLog.reduce((s, r) => s + r.bytes, 0) });
  const s0 = snap();
  const gop = await runStep("__x4stepGop", "__x4gopResult");
  const s1 = snap();
  const again = await runStep("__x4stepAgain", "__x4againResult");
  const s2 = snap();
  const def = await runStep("__x4stepDef", "__x4defResult");
  const s3 = snap();
  const result = { videoDecoder: gop.videoDecoder, gop, gopAgain: again, def };
  const pathA = reqLog.filter((r) => r.path === "/proxy-a.mp4");
  const pathB = reqLog.filter((r) => r.path === "/proxy-b.mp4");
  const sum = (arr) => arr.reduce((s, r) => s + r.bytes, 0);
  const summary = {
    fileSize, fileMiB: +(fileSize / 1048576).toFixed(2),
    gop: result.gop, gopAgain: result.gopAgain, def: result.def,
    deltaGopWindow: { requests: s1.n - s0.n, bytes: s1.bytes - s0.bytes },
    deltaAgainWindow: { requests: s2.n - s1.n, bytes: s2.bytes - s1.bytes },
    deltaDefaultWindow: { requests: s3.n - s2.n, bytes: s3.bytes - s2.bytes },
    pathA: { requests: pathA.length, bytes: sum(pathA),
      head: pathA.filter((r) => r.method === "HEAD").length,
      fullGet: pathA.filter((r) => r.method === "GET" && r.range === null).length,
      range206: pathA.filter((r) => r.status === 206).length },
    pathB: { requests: pathB.length, bytes: sum(pathB),
      head: pathB.filter((r) => r.method === "HEAD").length,
      fullGet: pathB.filter((r) => r.method === "GET" && r.range === null).length,
      range206: pathB.filter((r) => r.status === 206).length },
  };
  fs.writeFileSync(path.join(SCRATCH, "result.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  // ---- Cổng ----
  const g = result.gop;
  record("headed-video-decoder", result.videoDecoder === true, `VideoDecoder có sẵn: ${result.videoDecoder}`);
  record("gop-mode", g.gopMode === "gop-range", `gopMode=${g.gopMode} (ngưỡng 32 MiB, file ${summary.fileMiB} MiB)`);
  record("gop-probe", g.probe && g.probe.source === "head" && g.probe.size === fileSize,
    `probe=${JSON.stringify(g.probe)} (chưa biết size từ đầu, probe HEAD ra size thật)`);
  record("gop-no-full-get", summary.pathA.fullGet === 0,
    `path GOP: full GET=${summary.pathA.fullGet}, HEAD=${summary.pathA.head}, 206=${summary.pathA.range206}, bytes=${summary.pathA.bytes} (${(summary.pathA.bytes / fileSize * 100).toFixed(2)}% file)`);
  record("gop-drawn", g.ok === true && g.drawn > 0,
    `ensure=${g.ok}, drawn=${g.drawn}, missing=${g.missing}, cache=${g.cacheSize}`);
  const pixRatio = g.pixels.total ? g.pixels.nonZero / g.pixels.total : 0;
  record("gop-canvas-pixels", pixRatio > 0.5,
    `pixel khác 0: ${g.pixels.nonZero}/${g.pixels.total} (${(pixRatio * 100).toFixed(1)}% — ngưỡng 50%)`);
  record("gop-again-no-request", result.gopAgain.ok === true &&
    summary.deltaAgainWindow.requests === 0 && summary.deltaAgainWindow.bytes === 0,
    `cửa sổ lặp: ok=${result.gopAgain.ok}, delta=${summary.deltaAgainWindow.requests} request/${summary.deltaAgainWindow.bytes} byte (tiết kiệm đúng 1 lần tải toàn file = ${fileSize} byte so với đường tải lại)`);
  record("default-off", result.def.gopMode === "off",
    `mặc định: gopMode=${result.def.gopMode}, probe=${JSON.stringify(result.def.probe)}`);
  record("default-full-get", summary.pathB.fullGet === 1 && summary.pathB.bytes >= fileSize,
    `path mặc định: full GET=${summary.pathB.fullGet}, bytes=${summary.pathB.bytes} (tải toàn file như cũ)`);
  record("default-drawn", result.def.ok === true && result.def.drawn > 0,
    `mặc định: ensure=${result.def.ok}, drawn=${result.def.drawn}, missing=${result.def.missing}`);
  if (results.some((r) => !r.ok)) exitCode = 1;
} catch (e) {
  console.error(`FAIL harness — ${e.message}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { xvfb?.kill("SIGKILL"); } catch { /* bỏ qua */ }
  await new Promise((r) => server.close(() => r()));
}
console.log(`\nX4 headed E2E: ${results.filter((r) => r.ok).length}/${results.length} cổng pass (xem ${path.join(SCRATCH, "result.json")})`);
process.exit(exitCode);
