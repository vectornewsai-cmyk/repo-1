// Probe đợt 36 S4 — đo heap thật khi tải file lớn qua
// ReversePreviewController với cờ WebCodecs BẬT, gồm đỉnh heap thoáng
// qua, và kiểm chứng cổng File.size + fallback > 128 MiB về đường
// element (frameAt null + failed).
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/probe-round36-s4-file-heap-pipe.mjs
// Env: S4_NOISE (mặc định fixture noise đợt 34 Q2
// ~/workspace/tmp-round34-q2/sparse-gop-noise.mp4 — file 420 MB ĐÃ CÓ
// từ đợt trước, KHÔNG copy vào repo, KHÔNG tạo binary mới),
// S4_DISPLAY (mặc định :97), S4_PORT (mặc định 4197).
// Kết quả ghi ra benchmarks/results/v36-s4-file-heap.json (file text,
// được stage cùng đợt; noise file KHÔNG nằm trong batch push).
//
// Các phase (cùng 1 file noise, cùng 1 controller mới mỗi phase):
//  - head: server báo Content-Length -> cổng HEAD của R3 chặn trước
//    body (kỳ vọng: HEAD = 1, GET = 0, heap ~ baseline).
//  - filegate: controller nhận knownFileSizeBytes = kích thước thật
//    của file (mô phỏng item.file.size mà preview truyền) -> cổng S4
//    chặn trước cả HEAD (kỳ vọng: 0 request mới, failed ngay).
//  - nohead: server KHÔNG báo Content-Length (chunked) -> cổng sau-tải
//    của R3 buộc phải tải trọn file vào heap rồi mới vứt (kỳ vọng:
//    đỉnh heap/RSS thoáng qua ~ kích thước file, sau đó
//    retainedFileBytes = 0, failed, frameAt null).
// Thêm mini-check Range trên blob URL nhỏ (không liên quan file lớn):
// blob có trả 206 khi fetch kèm header Range hay không — dữ kiện cho
// đánh giá hướng (a) Range-fetch trong LIMITS S4 (không claim hơn).
//
// Đo: RSS cây tiến trình Chrome (poll 100 ms từ Node, như Q2) +
// performance.memory.usedJSHeapSize trong trang (50 ms, Chrome chạy
// kèm --enable-precise-memory-info) + gc() ép buộc cuối mỗi phase
// (--js-flags=--expose-gc) để phân biệt đỉnh thoáng qua với bộ nhớ giữ.
import { spawn, spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const NOISE = process.env.S4_NOISE ||
  path.join(os.homedir(), "workspace/tmp-round34-q2/sparse-gop-noise.mp4");
const DISPLAY = process.env.S4_DISPLAY || ":97";
const PORT = Number(process.env.S4_PORT || 4197);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const OUT = path.join(REPO, "benchmarks/results/v36-s4-file-heap.json");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log(`[${stamp()}]`, ...a); }
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

if (!fs.existsSync(NOISE)) fail(`không có file noise ${NOISE}`);
const NOISE_BYTES = fs.statSync(NOISE).size;
log(`noise file: ${NOISE} (${NOISE_BYTES} byte = ${(NOISE_BYTES / 1048576).toFixed(1)} MiB)`);

// ---- Bundle probe page từ code sản phẩm hiện tại (không sửa dist) ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-s4-"));
const entry = path.join(tmp, "entry.js");
fs.writeFileSync(entry, `
import { ReversePreviewController } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"))};
import { isReverseWebcodecsOptedIn, resolveReverseEngine } from ${JSON.stringify(path.join(REPO, "apps/web/src/lib/reversePlayback.ts"))};
window.__vcutReverseWebcodecs = true;
const NOISE_BYTES = ${NOISE_BYTES};
window.__s4 = { NOISE_BYTES, flag: isReverseWebcodecsOptedIn(), engine: resolveReverseEngine(), hasDecoder: typeof VideoDecoder !== "undefined" };
window.__s4run = async (kind) => {
  const samples = [];
  const iv = setInterval(() => { try { samples.push(performance.memory.usedJSHeapSize); } catch {} }, 50);
  const url = kind === "nohead" ? "/noise-nohead.mp4" : "/noise-head.mp4";
  const t0 = performance.now();
  let ctrl;
  if (kind === "filegate") {
    ctrl = new ReversePreviewController(url, 75, { knownFileSizeBytes: NOISE_BYTES });
  } else {
    ctrl = new ReversePreviewController(url);
  }
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
  };
};
window.__s4range = async () => {
  const blob = new Blob([new Uint8Array(1024).map((_, i) => i % 256)]);
  const url = URL.createObjectURL(blob);
  const r = await fetch(url, { headers: { Range: "bytes=0-99" } });
  const buf = await r.arrayBuffer();
  const r2 = await fetch(url);
  const buf2 = await r2.arrayBuffer();
  return { rangeStatus: r.status, rangeLen: buf.byteLength, plainStatus: r2.status, plainLen: buf2.byteLength };
};
window.__s4ready = true;
`);
const bundle = path.join(tmp, "page.js");
const esbuild = spawnSync(path.join(REPO, "node_modules/.bin/esbuild"), [entry, "--bundle", "--format=esm", `--outfile=${bundle}`], { encoding: "utf8" });
if (esbuild.status !== 0) fail(`esbuild probe page thất bại: ${esbuild.stderr}`);
log(`bundle probe page xong (${fs.statSync(bundle).size} byte)`);

// ---- Server: head (có Content-Length) / nohead (chunked, không length) ----
const reqLog = {};
function count(route, method) {
  const k = `${method} ${route}`;
  reqLog[k] = (reqLog[k] || 0) + 1;
}
function serveNoise(req, res, route, withLength) {
  count(route, req.method);
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
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!doctype html><meta charset="utf-8"><title>s4 probe</title><body>probe</body><script type="module" src="/page.js"></script>`);
  } else if (url === "/page.js") {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    fs.createReadStream(bundle).pipe(res);
  } else if (url === "/noise-head.mp4") serveNoise(req, res, url, true);
  else if (url === "/noise-nohead.mp4") serveNoise(req, res, url, false);
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

function chromeRssKb(rootPid) {
  try {
    const out = execSync("ps -eo pid,ppid,rss", { encoding: "utf8" });
    const children = new Map(); const rss = new Map();
    for (const line of out.trim().split("\n").slice(1)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      const [pid, ppid, r] = parts.map(Number);
      rss.set(pid, r);
      if (!children.has(ppid)) children.set(ppid, []);
      children.get(ppid).push(pid);
    }
    let sum = 0; const stack = [rootPid]; const seen = new Set();
    while (stack.length) {
      const p = stack.pop();
      if (seen.has(p)) continue;
      seen.add(p);
      sum += rss.get(p) || 0;
      for (const c of children.get(p) || []) stack.push(c);
    }
    return sum;
  } catch { return null; }
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
  const profile = path.join(tmp, "chrome-profile");
  if (!fs.existsSync(CHROME)) fail(`không có chrome ${CHROME}`);
  const chrome = spawn(CHROME, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage", "--enable-precise-memory-info", "--js-flags=--expose-gc", `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
  chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} try { server.close(); } catch {} };
  process.on("exit", cleanup);
  await cdp.send("Target.getTargets", {}, undefined, 30000);
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
  if (!cdp.sessionId) fail("không nhận được sessionId");
  await cdp.send("Page.enable", {}, cdp.sessionId);
  await cdp.send("Runtime.enable", {}, cdp.sessionId);
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    await sleep(200);
    try { ready = await cdp.evaluate("window.__s4ready === true", cdp.sessionId); } catch {}
  }
  if (!ready) fail("trang probe không ready");
  const flagInfo = await cdp.evaluate("window.__s4", cdp.sessionId);
  log(`cờ: ${JSON.stringify(flagInfo)}`);

  const baselineHeap = await cdp.evaluate("performance.memory.usedJSHeapSize", cdp.sessionId);
  const baselineRss = [];
  for (let i = 0; i < 3; i++) { baselineRss.push(chromeRssKb(chrome.pid)); await sleep(300); }
  const baselineRssKb = Math.max(...baselineRss.filter((x) => x !== null));

  async function runPhase(kind) {
    const reqBefore = { ...reqLog };
    const rssPeak = { max: 0 };
    const iv = setInterval(() => {
      const rss = chromeRssKb(chrome.pid);
      if (rss !== null && rss > rssPeak.max) rssPeak.max = rss;
    }, 100);
    let result;
    try {
      result = await cdp.evaluate(`window.__s4run(${JSON.stringify(kind)})`, cdp.sessionId);
    } finally {
      clearInterval(iv);
    }
    const reqDelta = {};
    for (const k of new Set([...Object.keys(reqLog), ...Object.keys(reqBefore)])) {
      const d = (reqLog[k] || 0) - (reqBefore[k] || 0);
      if (d !== 0) reqDelta[k] = d;
    }
    return { ...result, rssPeakKb: rssPeak.max, rssDeltaMiB: rssPeak.max ? +((rssPeak.max - baselineRssKb) / 1024).toFixed(1) : null, reqDelta };
  }

  const phases = {};
  for (const kind of ["head", "filegate", "nohead"]) {
    log(`phase ${kind}...`);
    phases[kind] = await runPhase(kind);
    log(`  ${kind}: ${JSON.stringify(phases[kind])}`);
  }
  const rangeBlob = await cdp.evaluate("window.__s4range()", cdp.sessionId);
  log(`range blob: ${JSON.stringify(rangeBlob)}`);
  // Sau phase nohead, heap vẫn ~401 MiB dù __s4run đã gọi gc() 1 lần:
  // thử gc() lặp + chờ để phân biệt "GC chưa kịp thu" với "giữ thật".
  // (Không thay đổi phase đo chính; chỉ thêm quan sát sau đo.)
  const gcRetry = await cdp.evaluate(`(async () => {
    const series = [performance.memory.usedJSHeapSize];
    for (let i = 0; i < 3; i++) {
      if (typeof window.gc === "function") window.gc();
      await new Promise((r) => setTimeout(r, 1000));
      series.push(performance.memory.usedJSHeapSize);
    }
    return { heapSeriesMiB: series.map((b) => +(b / 1048576).toFixed(1)), totalMiB: +(performance.memory.totalJSHeapSize / 1048576).toFixed(1) };
  })()`, cdp.sessionId);
  log(`gc retry: ${JSON.stringify(gcRetry)}`);

  const mib = (b) => b === null || b === undefined ? null : +(b / 1048576).toFixed(1);
  const summary = {
    noiseFile: NOISE,
    noiseBytes: NOISE_BYTES,
    noiseMiB: +(NOISE_BYTES / 1048576).toFixed(1),
    flag: flagInfo,
    baseline: { heapMiB: mib(baselineHeap), rssKb: baselineRssKb },
    phases: Object.fromEntries(Object.entries(phases).map(([k, p]) => [k, {
      ...p,
      heapPeakMiB: mib(p.heapMax),
      heapPeakDeltaMiB: p.heapMax === null ? null : +(p.heapMax / 1048576 - baselineHeap / 1048576).toFixed(1),
      heapAfterMiB: mib(p.heapAfter),
      heapAfterGcMiB: mib(p.heapAfterGc),
    }])),
    rangeBlob,
    gcRetry,
    reqLogTotal: reqLog,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
  log(`kết quả ghi tại ${OUT}`);
  cleanup();
  process.exit(0);
}
main().catch((e) => { console.error("RUNNER FAIL:", e); process.exit(2); });
