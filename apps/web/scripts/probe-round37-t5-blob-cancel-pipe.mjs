// Probe đợt 37 T5 — blob file lớn thật + hủy fetch đang bay khi size
// tới muộn + đo thời gian heap hạ (nợ §5.1–§5.2 của LIMITS đợt 36 S4).
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/probe-round37-t5-blob-cancel-pipe.mjs
// Env: T5_NOISE (mặc định fixture noise đợt 34 Q2
// ~/workspace/tmp-round34-q2/sparse-gop-noise.mp4 — file 420 MB ĐÃ CÓ,
// KHÔNG copy vào repo, KHÔNG tạo binary mới),
// T5_DISPLAY (mặc định :99), T5_PORT (mặc định 4297).
// Kết quả ghi ra benchmarks/results/v37-t5-blob-cancel.json.
//
// Thiết kế đo blob (giải quyết vấn đề S4 §5.2 nêu: tạo blob 400 MB
// trong trang sẽ tự tốn heap đo): file được đưa vào trang bằng
// CDP DOM.setFileInputFiles trên <input type=file> thật — File thu
// được backed-by-disk, KHÔNG qua JS heap — rồi URL.createObjectURL
// như đường production (MediaBin import File -> item.url là blob:).
// Nhờ vậy heap đo được là heap của controller, không phải của việc
// tạo fixture.
//
// Các phase (cùng 1 file noise 419.967.521 byte, controller mới mỗi phase):
//  - blob-gate: blob URL + knownFileSizeBytes = file.size (cổng S4) ->
//    kỳ vọng 0 fetch, heap phẳng, failed + largeFileFallback.
//  - blob-naked: blob URL KHÔNG biết size trước -> ghi nhận hành vi
//    thật của Chrome với fetch HEAD/GET trên blob: (HEAD có trả
//    content-length thì cổng HEAD chặn, không có đỉnh; nếu không thì
//    GET -> arrayBuffer -> đỉnh heap ~401 MiB rồi vứt). Không đoán
//    trước — ghi đúng cái đo được.
//  - http-nohead: http chunked không length (như S4) -> đỉnh heap
//    lúc arrayBuffer + đo thời gian heap về baseline (poll + gc lặp).
//  - late-slow: http route nhỏ giọt (1 MiB / 100 ms, ~42 s) để tạo cửa
//    sổ fetch-đang-bay đủ dài và xác định: controller không biết size,
//    runner chờ GET bắt đầu rồi mới gọi applyKnownFileSize(size thật)
//    -> kỳ vọng fetch bị abort, arrayBuffer không resolve dữ liệu,
//    heap phẳng, failed + fallback, server ngừng gửi byte (đếm byte
//    server đã gửi trước/sau abort).
//  - blob-late: blob URL không biết size, apply size ngay khi GET bắt
//    đầu (detect trong trang, poll 5 ms) -> kỳ vọng hủy được nếu chưa
//    cổng nào chặn trước; nếu HEAD hoặc header GET đã chặn trước
//    (blob luôn báo content-length ở GET — xem kết quả chạy) thì
//    late-abort là không áp dụng và được ghi rõ như vậy, không ép
//    thành "đã hủy".
//
// Đo: performance.memory.usedJSHeapSize trong trang (50 ms trong lúc
// tải, --enable-precise-memory-info) + gc() ép buộc (--js-flags=
// --expose-gc). KHÔNG dùng RSS làm claim (S4 đã chứng minh RSS nhiễu).
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const NOISE = process.env.T5_NOISE ||
  path.join(os.homedir(), "workspace/tmp-round34-q2/sparse-gop-noise.mp4");
const DISPLAY = process.env.T5_DISPLAY || ":99";
const PORT = Number(process.env.T5_PORT || 4297);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const OUT = path.join(REPO, "benchmarks/results/v37-t5-blob-cancel.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log(`[${stamp()}]`, ...a); }
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

if (!fs.existsSync(NOISE)) fail(`không có file noise ${NOISE}`);
const NOISE_BYTES = fs.statSync(NOISE).size;
log(`noise file: ${NOISE} (${NOISE_BYTES} byte = ${(NOISE_BYTES / 1048576).toFixed(1)} MiB)`);

// ---- Bundle probe page từ code sản phẩm hiện tại (không sửa dist) ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-t5-"));
const entry = path.join(tmp, "entry.js");
fs.writeFileSync(entry, `
import { ReversePreviewController } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"))};
import { isReverseWebcodecsOptedIn, resolveReverseEngine } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reversePlayback.ts"))};
window.__vcutReverseWebcodecs = true;
const NOISE_BYTES = ${NOISE_BYTES};
window.__t5 = { NOISE_BYTES, flag: isReverseWebcodecsOptedIn(), engine: resolveReverseEngine(), hasDecoder: typeof VideoDecoder !== "undefined" };
window.__t5fileInfo = () => {
  const input = document.querySelector("#f");
  const file = input && input.files && input.files[0];
  return file ? { name: file.name, size: file.size, type: file.type } : null;
};
function wrapFetch(state) {
  const orig = window.fetch;
  window.fetch = async (url, init) => {
    const method = (init && init.method) || "GET";
    if (method === "HEAD") state.head++;
    else state.get++;
    if (init && init.signal) {
      init.signal.addEventListener("abort", () => { state.aborted = true; }, { once: true });
    }
    const resp = await orig(url, init);
    try {
      const len = resp.headers ? resp.headers.get("content-length") : null;
      if (method === "HEAD") state.headLength = len;
      else state.getLength = len;
    } catch {}
    const origAb = resp.arrayBuffer ? resp.arrayBuffer.bind(resp) : null;
    if (origAb) {
      resp.arrayBuffer = async () => {
        state.arrayBufferStarted = true;
        const buf = await origAb();
        state.arrayBufferResolved = true;
        return buf;
      };
    }
    return resp;
  };
  return () => { window.fetch = orig; };
}
window.__t5run = async (kind) => {
  const samples = [];
  const iv = setInterval(() => { try { samples.push(performance.memory.usedJSHeapSize); } catch {} }, 50);
  const state = { head: 0, get: 0, aborted: false, headLength: null, getLength: null, arrayBufferStarted: false, arrayBufferResolved: false };
  const restore = wrapFetch(state);
  let ctrl, url;
  try {
    const input = document.querySelector("#f");
    const file = input.files[0];
    if (kind === "blob-gate" || kind === "blob-naked") {
      url = URL.createObjectURL(file);
      ctrl = kind === "blob-gate"
        ? new ReversePreviewController(url, 75, { knownFileSizeBytes: file.size })
        : new ReversePreviewController(url);
    } else {
      url = "/noise-nohead.mp4";
      ctrl = new ReversePreviewController(url);
    }
    const t0 = performance.now();
    const ok = await ctrl.ensureWindowForTime(0.1);
    const t1 = performance.now();
    clearInterval(iv);
    const f = ctrl.frameAt(0.1);
    const heapAfter = performance.memory.usedJSHeapSize;
    let heapAfterGc = null;
    try {
      if (typeof window.gc === "function") {
        window.gc();
        await new Promise((r) => setTimeout(r, 300));
        heapAfterGc = performance.memory.usedJSHeapSize;
      }
    } catch {}
    return {
      kind, ok, ms: Math.round(t1 - t0),
      failed: ctrl.failed, largeFileFallback: ctrl.largeFileFallback,
      knownFileSizeBytes: ctrl.knownFileSizeBytes,
      retainedFileBytes: ctrl.retainedFileBytes,
      frameAtNull: f === null,
      heapSamples: samples.length,
      heapMax: samples.length ? Math.max(...samples) : null,
      heapAfter, heapAfterGc,
      fetch: state,
    };
  } finally {
    clearInterval(iv);
    restore();
  }
};
// Đo thời gian heap về gần baseline sau 1 phase gây đỉnh (poll + gc lặp).
window.__t5dropTime = async (baselineBytes) => {
  const series = [];
  const t0 = performance.now();
  for (let i = 0; i < 30; i++) {
    const heap = performance.memory.usedJSHeapSize;
    series.push(+(heap / 1048576).toFixed(1));
    if (heap <= baselineBytes + 5 * 1048576) {
      return { seconds: +((performance.now() - t0) / 1000).toFixed(1), series, reached: true };
    }
    try { if (typeof window.gc === "function") window.gc(); } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return { seconds: +((performance.now() - t0) / 1000).toFixed(1), series, reached: false };
};
// Late-cancel trên route nhỏ giọt: runner gọi start rồi poll getStarted,
// sau đó gọi abort() từ ngoài (mô phỏng size tới muộn từ caller khác).
window.__t5lateStart = () => {
  const samples = [];
  const iv = setInterval(() => { try { samples.push(performance.memory.usedJSHeapSize); } catch {} }, 100);
  const state = { head: 0, get: 0, aborted: false, headLength: null, getLength: null, arrayBufferStarted: false, arrayBufferResolved: false, getStarted: false };
  const restore = wrapFetch(state);
  const origFetch = window.fetch;
  window.fetch = async (url, init) => {
    if (!((init && init.method) === "HEAD")) state.getStarted = true;
    return origFetch(url, init);
  };
  const ctrl = new ReversePreviewController("/noise-slow.mp4");
  const doneP = ctrl.ensureWindowForTime(0.1).then(async (ok) => {
    clearInterval(iv);
    restore();
    window.__t5late.result = {
      ok, failed: ctrl.failed, largeFileFallback: ctrl.largeFileFallback,
      knownFileSizeBytes: ctrl.knownFileSizeBytes,
      retainedFileBytes: ctrl.retainedFileBytes,
      frameAtNull: ctrl.frameAt(0.1) === null,
      heapMax: samples.length ? Math.max(...samples) : null,
      heapSamples: samples.length,
      fetch: state,
    };
    window.__t5late.done = true;
  });
  window.__t5late = { state, ctrl, done: false, result: null,
    abort: () => ctrl.applyKnownFileSize(NOISE_BYTES) };
  void doneP;
  return true;
};
// Late-cancel trên blob: detect GET trong trang (poll 5 ms) rồi abort ngay.
window.__t5blobLate = async () => {
  const samples = [];
  const iv = setInterval(() => { try { samples.push(performance.memory.usedJSHeapSize); } catch {} }, 50);
  const state = { head: 0, get: 0, aborted: false, headLength: null, getLength: null, arrayBufferStarted: false, arrayBufferResolved: false, getStarted: false };
  const restore = wrapFetch(state);
  const file = document.querySelector("#f").files[0];
  const url = URL.createObjectURL(file);
  const ctrl = new ReversePreviewController(url);
  const doneP = ctrl.ensureWindowForTime(0.1);
  // Chờ GET bắt đầu (wrapper đếm) hoặc controller đã khóa (HEAD chặn).
  await new Promise((resolve) => {
    const piv = setInterval(() => {
      if (state.get > 0 || ctrl.failed) { clearInterval(piv); resolve(); }
    }, 5);
    setTimeout(() => { clearInterval(piv); resolve(); }, 15000);
  });
  let abortResult = null;
  let applied = false;
  if (state.get > 0 && !ctrl.failed) {
    abortResult = ctrl.applyKnownFileSize(file.size);
    applied = true;
  }
  const ok = await doneP;
  clearInterval(iv);
  restore();
  const f = ctrl.frameAt(0.1);
  return {
    ok, applied, abortResult,
    headGateBeforeGet: state.get === 0 && ctrl.failed,
    failed: ctrl.failed, largeFileFallback: ctrl.largeFileFallback,
    knownFileSizeBytes: ctrl.knownFileSizeBytes,
    retainedFileBytes: ctrl.retainedFileBytes,
    frameAtNull: f === null,
    heapMax: samples.length ? Math.max(...samples) : null,
    heapAfter: performance.memory.usedJSHeapSize,
    fetch: state,
  };
};
window.__t5ready = true;
`);
const bundle = path.join(tmp, "page.js");
const esbuild = spawnSync(path.join(REPO, "node_modules/.bin/esbuild"), [entry, "--bundle", "--format=esm", `--outfile=${bundle}`], { encoding: "utf8" });
if (esbuild.status !== 0) fail(`esbuild probe page thất bại: ${esbuild.stderr}`);
log(`bundle probe page xong (${fs.statSync(bundle).size} byte)`);

// ---- Server ----
let slowBytesSent = 0;
let slowClosed = false;
function serveNoise(req, res, route, withLength) {
  if (req.method === "HEAD") {
    if (withLength) res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": NOISE_BYTES });
    else res.writeHead(200, { "Content-Type": "video/mp4" });
    res.end();
    return;
  }
  if (req.method !== "GET") { res.writeHead(405); res.end(); return; }
  if (withLength) res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": NOISE_BYTES });
  else res.writeHead(200, { "Content-Type": "video/mp4" });
  fs.createReadStream(NOISE).pipe(res);
}
async function serveSlow(req, res) {
  if (req.method === "HEAD") {
    res.writeHead(200, { "Content-Type": "video/mp4" });
    res.end();
    return;
  }
  if (req.method !== "GET") { res.writeHead(405); res.end(); return; }
  slowBytesSent = 0;
  slowClosed = false;
  res.writeHead(200, { "Content-Type": "video/mp4" });
  const stream = fs.createReadStream(NOISE, { highWaterMark: 1024 * 1024 });
  let stopped = false;
  const onClose = () => {
    if (stopped) return;
    stopped = true;
    slowClosed = true;
    try { stream.destroy(); } catch {}
  };
  req.on("close", onClose);
  res.on("close", onClose);
  try {
    for await (const chunk of stream) {
      if (stopped) break;
      slowBytesSent += chunk.length;
      if (!res.write(chunk)) await new Promise((r) => res.once("drain", r));
      await sleep(100);
      if (stopped) break;
    }
  } catch {}
  if (!stopped) {
    try { res.end(); } catch {}
  }
}
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!doctype html><meta charset="utf-8"><title>t5 probe</title><body><input type="file" id="f"><script type="module" src="/page.js"></script>`);
  } else if (url === "/page.js") {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    fs.createReadStream(bundle).pipe(res);
  } else if (url === "/noise-head.mp4") serveNoise(req, res, url, true);
  else if (url === "/noise-nohead.mp4") serveNoise(req, res, url, false);
  else if (url === "/noise-slow.mp4") void serveSlow(req, res);
  else { res.writeHead(404); res.end("not found"); }
});

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id); this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) { try { proc.stdio[s]?.on("error", () => {}); } catch {} }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 300000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); } catch (e) { this.pending.delete(id); clearTimeout(timer); reject(e); }
    });
  }
  async evaluate(expr, sessionId) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
}

async function main() {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  log(`phục vụ probe tại ${ORIGIN}`);
  const num = DISPLAY.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
    if (!alive) {
      log(`Xvfb: socket ${DISPLAY} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
    } else log(`dùng chung Xvfb ${DISPLAY}`);
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail(`Xvfb không tạo socket ${DISPLAY}`);
  }
  // Profile Chrome đặt ở workspace (KHÔNG đặt ở /tmp: /tmp là tmpfs
  // 512M, 1 lần probe file 420 MB đã phình profile tới 476M và làm
  // đầy /tmp — bài học ghi ở LIMITS T5). Dọn profile + bundle tmp
  // khi xong để khỏi để lại rác lớn.
  const profile = path.join(os.homedir(), "workspace", `tmp-round37-t5-chrome-probe-${process.pid}`);
  if (!fs.existsSync(CHROME)) fail(`không có chrome ${CHROME}`);
  const chrome = spawn(CHROME, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage", "--enable-precise-memory-info", "--js-flags=--expose-gc", `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
  chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} try { server.close(); } catch {} try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} };
  process.on("exit", cleanup);
  await cdp.send("Target.getTargets", {}, undefined, 30000);
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
  if (!cdp.sessionId) fail("không nhận được sessionId");
  await cdp.send("Page.enable", {}, cdp.sessionId);
  await cdp.send("Runtime.enable", {}, cdp.sessionId);
  await cdp.send("DOM.enable", {}, cdp.sessionId);
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    await sleep(200);
    try { ready = await cdp.evaluate("window.__t5ready === true", cdp.sessionId); } catch {}
  }
  if (!ready) fail("trang probe không ready");
  const flagInfo = await cdp.evaluate("window.__t5", cdp.sessionId);
  log(`cờ: ${JSON.stringify(flagInfo)}`);
  if (flagInfo.engine !== "webcodecs") fail(`engine không phải webcodecs: ${flagInfo.engine}`);

  // Đưa file noise vào trang qua input file thật (backed-by-disk).
  const doc = await cdp.send("DOM.getDocument", { depth: 0 }, cdp.sessionId);
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: "#f" }, cdp.sessionId);
  if (!q.nodeId) fail("không tìm thấy input #f");
  await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [NOISE] }, cdp.sessionId, 60000);
  const fileInfo = await cdp.evaluate("window.__t5fileInfo()", cdp.sessionId);
  log(`file trong trang: ${JSON.stringify(fileInfo)}`);
  if (!fileInfo || fileInfo.size !== NOISE_BYTES) fail(`file trong trang sai size: ${JSON.stringify(fileInfo)}`);

  const baselineHeap = await cdp.evaluate("performance.memory.usedJSHeapSize", cdp.sessionId);
  const mib = (b) => b === null || b === undefined ? null : +(b / 1048576).toFixed(1);

  async function runPhase(kind) {
    const r = await cdp.evaluate(`window.__t5run(${JSON.stringify(kind)})`, cdp.sessionId);
    return { ...r, heapMaxMiB: mib(r.heapMax), heapAfterMiB: mib(r.heapAfter), heapAfterGcMiB: mib(r.heapAfterGc) };
  }

  log("phase blob-gate...");
  const blobGate = await runPhase("blob-gate");
  log(`  blob-gate: ${JSON.stringify(blobGate)}`);

  log("phase blob-naked...");
  const blobNaked = await runPhase("blob-naked");
  log(`  blob-naked: ${JSON.stringify(blobNaked)}`);
  // Chờ heap hạ sau blob-naked (nếu có đỉnh) để phase http-nohead sau
  // đó không bị nhiễm đỉnh cũ — ghi riêng thời gian hạ của blob.
  const blobNakedDrop = await cdp.evaluate(`window.__t5dropTime(${baselineHeap})`, cdp.sessionId);
  log(`  blob-naked drop-to-baseline: ${JSON.stringify(blobNakedDrop)}`);

  log("phase http-nohead...");
  const httpNohead = await runPhase("http-nohead");
  log(`  http-nohead: ${JSON.stringify(httpNohead)}`);

  // Thời gian heap về baseline sau đỉnh http-nohead.
  const drop = await cdp.evaluate(`window.__t5dropTime(${baselineHeap})`, cdp.sessionId);
  log(`  drop-to-baseline: ${JSON.stringify(drop)}`);

  log("phase late-slow (size tới muộn trong lúc GET nhỏ giọt)...");
  await cdp.evaluate("window.__t5lateStart()", cdp.sessionId);
  let gotStarted = false;
  for (let i = 0; i < 150 && !gotStarted; i++) {
    await sleep(200);
    try { gotStarted = await cdp.evaluate("window.__t5late.state.getStarted === true", cdp.sessionId); } catch {}
  }
  if (!gotStarted) fail("GET nhỏ giọt không bắt đầu sau 30s");
  const bytesAtAbort = slowBytesSent;
  const abortResult = await cdp.evaluate("window.__t5late.abort()", cdp.sessionId);
  log(`  abort() = ${abortResult}, server đã gửi ${bytesAtAbort} byte lúc abort (tổng ${NOISE_BYTES})`);
  let lateDone = false;
  for (let i = 0; i < 150 && !lateDone; i++) {
    await sleep(200);
    try { lateDone = await cdp.evaluate("window.__t5late.done === true", cdp.sessionId); } catch {}
  }
  if (!lateDone) fail("late-slow không settle sau 30s");
  const lateResult = await cdp.evaluate("window.__t5late.result", cdp.sessionId);
  await sleep(2000);
  const bytesAfterWait = slowBytesSent;
  log(`  late-slow: ${JSON.stringify(lateResult)}, server bytes sau 2s chờ: ${bytesAfterWait} (closed=${slowClosed})`);
  const lateSlow = { ...lateResult, heapMaxMiB: mib(lateResult.heapMax), bytesAtAbort, bytesAfterWait2s: bytesAfterWait, serverClosed: slowClosed };

  log("phase blob-late...");
  const blobLate = await cdp.evaluate("window.__t5blobLate()", cdp.sessionId);
  log(`  blob-late: ${JSON.stringify({ ...blobLate, heapMaxMiB: mib(blobLate.heapMax), heapAfterMiB: mib(blobLate.heapAfter) })}`);
  const blobLateOut = { ...blobLate, heapMaxMiB: mib(blobLate.heapMax), heapAfterMiB: mib(blobLate.heapAfter) };

  const summary = {
    noiseFile: NOISE,
    noiseBytes: NOISE_BYTES,
    noiseMiB: +(NOISE_BYTES / 1048576).toFixed(1),
    flag: flagInfo,
    baseline: { heapMiB: mib(baselineHeap) },
    blobGate,
    blobNaked,
    blobNakedDrop,
    httpNohead,
    dropToBaseline: drop,
    lateSlow,
    blobLate: blobLateOut,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
  log(`kết quả ghi tại ${OUT}`);

  // Tiêu chí pass (ghi rõ, không nới lỏng âm thầm):
  const checks = {
    blobGateZeroFetch: blobGate.fetch.head === 0 && blobGate.fetch.get === 0 && blobGate.failed === true && blobGate.largeFileFallback === true,
    blobNakedFallback: blobNaked.failed === true && blobNaked.largeFileFallback === true && blobNaked.retainedFileBytes === 0 && blobNaked.frameAtNull === true,
    httpNoheadFallback: httpNohead.failed === true && httpNohead.largeFileFallback === true && httpNohead.retainedFileBytes === 0,
    httpHeapReturned: drop.reached === true,
    lateSlowAborted: lateSlow.fetch.aborted === true && lateSlow.failed === true && lateSlow.largeFileFallback === true && lateSlow.fetch.arrayBufferResolved === false && lateSlow.bytesAfterWait2s === lateSlow.bytesAtAbort && lateSlow.bytesAtAbort < NOISE_BYTES,
    // blob-late OK khi: (a) HEAD chặn trước GET, (b) late-abort hủy
    // được GET đang bay, hoặc (c) header GET báo đủ size nên cổng
    // GET của R3 chặn trước khi đọc body (arrayBuffer chưa bắt đầu,
    // heap phẳng) — trường hợp (c) là cái đo được thật với blob:
    // Chrome luôn báo content-length ở GET của blob:, nên cửa sổ
    // cho late-abort trên blob hẹp tới mức cổng GET thắng trước.
    blobLateOk: (blobLateOut.headGateBeforeGet === true) ||
      (blobLateOut.applied === true && blobLateOut.fetch.aborted === true && blobLateOut.failed === true) ||
      (blobLateOut.fetch.get === 1 && blobLateOut.fetch.arrayBufferStarted === false && blobLateOut.failed === true && blobLateOut.largeFileFallback === true),
  };
  for (const [k, v] of Object.entries(checks)) log(`check ${k}: ${v ? "PASS" : "FAIL"}`);
  cleanup();
  const allPass = Object.values(checks).every(Boolean);
  log(allPass ? "T5 PROBE: ALL PASS" : "T5 PROBE: CÓ CHECK FAIL (xem JSON)");
  process.exit(allPass ? 0 : 1);
}
main().catch((e) => { console.error("RUNNER FAIL:", e); process.exit(2); });
