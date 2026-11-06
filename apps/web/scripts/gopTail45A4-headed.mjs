// gopTail45A4-headed.mjs — Headed qua route bridge Express THẬT cho
// tail-scan đợt 45 A4: file trailing (không faststart) + mdat phình
// để tiền tố nhỏ không tới được moov phải đi đường tail-scan mới ra
// gop-range, thay vì fallback như trước A4.
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gopTail45A4-headed.mjs
//
// Giàn đo (harness tương đương Z4, vì production vite :5173 và bridge
// :8787 hiện không chạy trong môi trường này — xem LIMITS A4 §4):
//  - Bridge THẬT nguyên vẹn server/bridge/src/index.js (không sửa
//    code bridge) trên cổng A4_BRIDGE_PORT (mặc định 8955), work-dir
//    trong scratch, BRIDGE_RATE_GENERAL=5000. Fixture đặt sẵn vào
//    <work>/proxies/trail-a4.mp4 qua route thật
//    GET /api/proxy/file/:name (Express sendFile, Range sẵn).
//  - Page/bundle serve từ server harness riêng trên loopback (origin
//    khác port với bridge — đúng cấu hình cross-origin của web UI
//    thật vite :5173 → bridge :8787, cùng luật loopback CORS).
//  - Page gọi TRỰC TIẾP fetchVideoTrackByGopRange (T3) với prefixBytes
//    4096 (override test-only, như test Node): tiền tố nhỏ là cách
//    duy nhất để fixture nhỏ tái hiện "mdat khổng lồ trước moov"
//    mà không cần file 32+ MiB; controller wiring (32, 128] MiB vẫn
//    giữ nguyên và KHÔNG được test ở đây.
//  - Kế toán phía BROWSER bằng CDP Network. "Full-file GET" ở đây
//    nghĩa là GET không có header Range (server trả 200 toàn file);
//    request tail trên fixture nhỏ có range 0-end (do cửa sổ đuôi
//    mặc định 16 MiB lớn hơn file) nhưng vẫn là Range 206, không
//    phải GET toàn file — LIMITS ghi rõ điểm này, không giấu.
//  - Chromium headed thật, Xvfb, --disable-gpu (công thức X4/Z4).
//
// Cổng PASS (7 cổng): xem cuối file. Nếu thiếu ffmpeg hoặc Chrome
// thì script in NOT-MEASURED rõ ràng và thoát mã 2 — KHÔNG bịa số.
// Mọi số headed đều under-load — cấm dùng làm baseline quiet hay
// claim fps; số frame/GOP là bằng chứng chức năng, không phải tốc độ.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.A4_SCRATCH || path.join(os.homedir(), "scratch-round45-a4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const CHROME = process.env.A4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.A4_DEBUG_PORT || 9376);
const HTTP_PORT = Number(process.env.A4_HTTP_PORT || 8932);
const BRIDGE_PORT = Number(process.env.A4_BRIDGE_PORT || 8955);
const BRIDGE_WORK = path.join(SCRATCH, "bridge-work-45a4");

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function notMeasured(reason) {
  console.log(`NOT-MEASURED: ${reason}`);
  process.exit(2);
}

fs.mkdirSync(SCRATCH, { recursive: true });
if (!fs.existsSync(CHROME)) notMeasured(`không thấy Chrome ${CHROME}`);
const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "pipe" });
if (ffmpegCheck.status !== 0) notMeasured("không có ffmpeg để tạo fixture trailing");

// ---- 1. Fixture trailing thật + pad mdat (để prefix 4096 không tới moov) ----
const rawPath = path.join(SCRATCH, "trailing-raw.mp4");
const fixPath = path.join(SCRATCH, "trailing-a4.mp4");
{
  const args = ["-y", "-v", "error", "-f", "lavfi", "-i",
    "testsrc2=size=320x240:rate=30:duration=2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "10", rawPath];
  const r = spawnSync("ffmpeg", args, { stdio: "pipe", encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg tạo fixture thất bại: ${(r.stderr || "").slice(0, 300)}`);
}
const raw = fs.readFileSync(rawPath);
function topBoxes(buf) {
  const boxes = [];
  let off = 0;
  while (off + 8 <= buf.length) {
    let size = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    let header = 8;
    if (size === 1) {
      if (off + 16 > buf.length) break;
      size = Number(buf.readBigUInt64BE(off + 8));
      header = 16;
    } else if (size === 0) { size = buf.length - off; }
    if (size < header || off + size > buf.length) break;
    boxes.push({ type, start: off, size, header });
    off += size;
  }
  return boxes;
}
{
  const boxes = topBoxes(raw);
  const mdat = boxes.find((b) => b.type === "mdat");
  const moov = boxes[boxes.length - 1];
  if (!mdat || moov.type !== "moov" || !(moov.start > mdat.start)) {
    throw new Error(`fixture ffmpeg không có thứ tự mdat trước moov: ${boxes.map((b) => b.type).join(",")}`);
  }
  const pad = 200_000;
  const newSize = mdat.size + pad;
  const header = Buffer.alloc(mdat.header);
  if (mdat.header === 16) {
    header.writeUInt32BE(1, 0); header.write("mdat", 4, "latin1"); header.writeBigUInt64BE(BigInt(newSize), 8);
  } else {
    header.writeUInt32BE(newSize, 0); header.write("mdat", 4, "latin1");
  }
  const inflated = Buffer.concat([
    raw.subarray(0, mdat.start), header,
    raw.subarray(mdat.start + mdat.header, mdat.start + mdat.size),
    Buffer.alloc(pad, 0), raw.subarray(moov.start),
  ]);
  fs.writeFileSync(fixPath, inflated);
  // Khẳng định tiền tố 4096 không tới được moov (điều kiện tái hiện nợ A4).
  const prefixBoxes = topBoxes(inflated.subarray(0, 4096));
  if (prefixBoxes.some((b) => b.type === "moov")) {
    throw new Error("tiền tố 4096 vẫn thấy moov — fixture không tái hiện được nợ tail-scan");
  }
  console.log(`fixture: raw=${raw.length} byte, inflated=${inflated.length} byte, moov start=${moov.start + pad}, prefix 4096 không thấy moov`);
}
const fileSize = fs.statSync(fixPath).size;
let ffprobeFrames = null;
{
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=nb_frames", "-of", "csv=p=0", fixPath], { encoding: "utf8" });
  const n = Number((r.stdout || "").trim());
  if (Number.isFinite(n) && n > 0) ffprobeFrames = n;
  console.log(`ffprobe video nb_frames=${ffprobeFrames}`);
}

// ---- 2. Bridge thật + page/bundle ----
fs.mkdirSync(path.join(BRIDGE_WORK, "proxies"), { recursive: true });
fs.copyFileSync(fixPath, path.join(BRIDGE_WORK, "proxies", "trail-a4.mp4"));
const bridge = spawn("node", [path.join(REPO, "server/bridge/src/index.js")], {
  stdio: "pipe",
  env: { ...process.env, BRIDGE_PORT: String(BRIDGE_PORT), BRIDGE_WORK_DIR: BRIDGE_WORK, BRIDGE_RATE_GENERAL: "5000" },
});
let bridgeLog = "";
bridge.stdout?.on("data", (d) => { bridgeLog += d.toString(); });
bridge.stderr?.on("data", (d) => { bridgeLog += d.toString(); });
const bridgeBase = `http://127.0.0.1:${BRIDGE_PORT}`;
async function waitBridge() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${bridgeBase}/api/proxy/file/trail-a4.mp4`, { method: "HEAD" });
      if (r.status === 200) return r;
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  throw new Error(`bridge không lên sau 30 s (log: ${bridgeLog.slice(0, 500)})`);
}
const headResp = await waitBridge();
record("bridge-head", headResp.status === 200 &&
  headResp.headers.get("content-length") === String(fileSize) &&
  headResp.headers.get("accept-ranges") === "bytes",
  `HEAD → ${headResp.status}, content-length=${headResp.headers.get("content-length")}, accept-ranges=${headResp.headers.get("accept-ranges")}`);
const range00 = await fetch(`${bridgeBase}/api/proxy/file/trail-a4.mp4`, { headers: { Range: "bytes=0-0" } });
await range00.arrayBuffer().catch(() => null);
record("bridge-range-0-0", range00.status === 206 &&
  range00.headers.get("content-range") === `bytes 0-0/${fileSize}`,
  `Range 0-0 → ${range00.status}, content-range=${range00.headers.get("content-range")}`);

const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const bundleOut = path.join(SCRATCH, "tail45-bundle.mjs");
{
  const b = spawnSync(esbuild, [
    path.join(REPO, "apps/web/src/lib/gopRangeFetch39T3.ts"),
    "--bundle", "--platform=browser", "--format=esm", `--outfile=${bundleOut}`,
  ], { stdio: "pipe", encoding: "utf8" });
  if (b.status !== 0) throw new Error(`esbuild bundle thất bại: ${(b.stderr || b.stdout || "").slice(0, 500)}`);
}
const pageHtml = `<!doctype html><meta charset="utf-8"><title>A4 GOP tail headed</title>
<script type="module">
import { fetchVideoTrackByGopRange } from "./tail45-bundle.mjs";
const BRIDGE = ${JSON.stringify(bridgeBase)};
window.__a4cors = async () => {
  const h = await fetch(BRIDGE + "/api/proxy/file/trail-a4.mp4", { method: "HEAD" });
  const r = await fetch(BRIDGE + "/api/proxy/file/trail-a4.mp4", { headers: { Range: "bytes=0-0" } });
  await r.arrayBuffer().catch(() => null);
  return { headStatus: h.status, acceptRanges: h.headers.get("accept-ranges"),
    rangeStatus: r.status, contentRange: r.headers.get("content-range") };
};
window.__a4t3 = async () => {
  const out = await fetchVideoTrackByGopRange(BRIDGE + "/api/proxy/file/trail-a4.mp4",
    { prefixBytes: 4096 });
  if (out.mode !== "gop-range") return { mode: out.mode, reason: out.reason,
    kinds: out.requests.map((q) => q.kind) };
  let totalChunk = 0;
  for (const g of out.gops) for (const c of g.chunks) totalChunk += c.data.length;
  return { mode: out.mode, sampleCount: out.sampleCount, gopCount: out.gops.length,
    totalSampleBytes: out.totalSampleBytes, totalChunkBytes: totalChunk,
    kinds: out.requests.map((q) => q.kind),
    tailRanges: out.requests.filter((q) => q.kind === "tail").map((q) => [q.start, q.end]),
    gopRanges: out.requests.filter((q) => q.kind === "gop").map((q) => [q.start, q.end]) };
};
window.__a4ready = true;
</script>`;
fs.writeFileSync(path.join(SCRATCH, "tail45-page.html"), pageHtml);
const server = createServer((req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname === "/tail45-page.html") {
    res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(path.join(SCRATCH, "tail45-page.html"))); return;
  }
  if (u.pathname === "/tail45-bundle.mjs") {
    res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(bundleOut)); return;
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
console.log(`page server: http://127.0.0.1:${HTTP_PORT}/tail45-page.html (origin loopback, fetch sang bridge :${BRIDGE_PORT})`);

// ---- 3. Xvfb + Chrome headed (công thức X4/Z4) ----
let xvfb = null;
let display = process.env.DISPLAY || null;
if (!display) {
  for (const num of [93, 94, 95]) {
    xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xvfb.exitCode === null) { display = `:${num}`; break; }
    xvfb = null;
  }
  if (!display) notMeasured("không khởi động được Xvfb (:93/:94/:95 đều bận hoặc lỗi)");
  console.log(`xvfb: DISPLAY=${display}`);
}
const profile = path.join(SCRATCH, "tail45-chrome-profile");
fs.rmSync(profile, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
  "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
  "--window-size=1440,900", "--hide-scrollbars", "about:blank",
], { stdio: "ignore", env: { ...process.env, DISPLAY: display } });
await sleep(2000);
if (chrome.exitCode !== null) throw new Error(`Chrome thoát sớm với mã ${chrome.exitCode}`);

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
let exitCode = 0;
try {
  const cdp = new CDP(await getWsUrl());
  cdp.onNetwork = (method, p) => {
    if (method === "Network.requestWillBeSent") {
      if (p.request.url.includes("/api/proxy/file/")) {
        netReq.set(p.requestId, { method: p.request.method,
          range: p.request.headers?.Range ?? p.request.headers?.range ?? null, status: null });
      }
    } else if (method === "Network.responseReceived") {
      const e = netReq.get(p.requestId);
      if (e) e.status = p.response.status;
    }
  };
  await cdp.send("Network.enable", {});
  await cdp.send("Page.enable", {});
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/tail45-page.html` });
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__a4ready === true").catch(() => false);
    if (ready) break;
    if (i === 59) throw new Error("page không sẵn sau 30 s");
    await sleep(500);
  }
  const cors = await cdp.evalJs("window.__a4cors()");
  record("page-cors", cors.headStatus === 200 && cors.acceptRanges === "bytes" &&
    cors.rangeStatus === 206 && cors.contentRange === `bytes 0-0/${fileSize}`,
    `HEAD ${cors.headStatus} accept-ranges=${cors.acceptRanges}; Range 0-0 ${cors.rangeStatus} ${cors.contentRange}`);
  const mark = netReq.size;
  const t3 = await cdp.evalJs("window.__a4t3()");
  const stepReqs = [...netReq.values()].slice(mark);
  const fullGets = stepReqs.filter((r) => r.method === "GET" && !r.range);
  record("page-t3-mode", t3.mode === "gop-range",
    `mode=${t3.mode} ${t3.reason || ""} sampleCount=${t3.sampleCount} gopCount=${t3.gopCount}`);
  record("page-t3-chunks", t3.mode === "gop-range" &&
    t3.totalChunkBytes === t3.totalSampleBytes && t3.totalSampleBytes > 0,
    `chunk bytes tổng=${t3.totalChunkBytes}, sample bytes=${t3.totalSampleBytes}`);
  if (ffprobeFrames !== null) {
    record("page-t3-frames", t3.sampleCount === ffprobeFrames,
      `sampleCount=${t3.sampleCount}, ffprobe nb_frames=${ffprobeFrames}`);
  } else {
    console.log("SKIP page-t3-frames: ffprobe không báo nb_frames");
  }
  const hasTailKind = Array.isArray(t3.kinds) && t3.kinds.includes("tail");
  const gopKindCount = Array.isArray(t3.kinds) ? t3.kinds.filter((k) => k === "gop").length : 0;
  record("page-t3-requests", hasTailKind && gopKindCount === 6 && fullGets.length === 0,
    `kinds=${(t3.kinds || []).join(",")}; CDP bước T3: ${stepReqs.length} request, full GET không Range=${fullGets.length}, tail ranges=${JSON.stringify(t3.tailRanges || [])}`);
} catch (e) {
  console.error(`HARNESS ERROR: ${(e && e.message) || e}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { bridge.kill("SIGKILL"); } catch { /* bỏ qua */ }
  await sleep(500);
  server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\nA4 headed: ${results.length - failed.length}/${results.length} cổng pass`);
if (failed.length > 0) {
  for (const f of failed) console.log(`  FAIL: ${f.name} — ${f.detail}`);
  process.exit(1);
}
process.exit(exitCode);
