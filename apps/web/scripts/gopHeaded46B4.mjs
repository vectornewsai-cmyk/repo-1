// gopHeaded46B4.mjs — Headed đợt 46 B4: file trailing trong
// (32, 128] MiB qua controller wiring, qua vite :5173 → bridge :8787
// THẬT (không phải harness origin riêng như A4).
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gopHeaded46B4.mjs
//
// Giàn đo:
//  - Bridge THẬT nguyên vẹn server/bridge/src/index.js trên cổng
//    8787 (cổng mặc định production), work-dir trong scratch,
//    BRIDGE_RATE_GENERAL=5000. Fixture đặt sẵn vào
//    <work>/proxies/trail-b4.mp4 qua route thật
//    GET /api/proxy/file/:name (Express sendFile, Range sẵn).
//  - Vite dev THẬT của apps/web trên cổng 5173 (cổng production):
//    script spawn `vite --host 127.0.0.1 --port 5173 --strictPort`.
//    Page + bundle test được đặt TẠM vào apps/web/public/ trong lúc
//    chạy (vite serve public/ theo từng request, không cần restart)
//    và XÓA SẠCH trong finally — repo cuối cùng không còn file tạm.
//    Nếu cổng 5173/8787 đã có server khác thì script in NOT-MEASURED
//    và thoát mã 2 (không chiếm cổng của server người dùng).
//  - Page gọi controller THẬT (ReversePreviewController, GOP bật
//    tường minh + size đã biết — đúng wiring production: ngưỡng
//    (32, 128] MiB, mặc định GOP tắt nên harness phải bật như
//    preview bật qua registry) rồi gọi T3 trực tiếp ở phase riêng
//    để lấy kinds/sample/GOP (controller không expose log request
//    của T3).
//  - Kế toán phía BROWSER bằng CDP Network, tách 2 phase bằng mốc
//    CDP (controller, rồi T3 trực tiếp). "Full-file GET" = GET không
//    có header Range (HEAD và OPTIONS preflight không tính).
//  - Fixture: ffmpeg testsrc2 320×240 30 fps 2 s, KHÔNG faststart,
//    rồi pad mdat tới đúng 37 MiB (công thức A4: pad nằm sau mọi
//    sample nên sample table không dịch; moov ở cuối file, tiền tố
//    512 KiB mặc định không tới được moov) — file thật trong
//    khoảng wiring, không phải fixture nhỏ + override tiền tố như A4.
//  - Chromium headed thật, Xvfb, --disable-gpu (công thức X4/Z4/A4).
//
// Cổng PASS: xem cuối file. Nếu thiếu ffmpeg hoặc Chrome thì script
// in NOT-MEASURED rõ ràng và thoát mã 2 — KHÔNG bịa số. Mọi số
// headed đều under-load — cấm dùng làm baseline quiet hay claim fps;
// số frame/GOP là bằng chứng chức năng + wiring, không phải tốc độ.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCRATCH = process.env.B4_SCRATCH || path.join(os.homedir(), "scratch-round46-b4");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(REPO, "apps/web");
const CHROME = process.env.B4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.B4_DEBUG_PORT || 9377);
const VITE_PORT = 5173;
const BRIDGE_PORT = 8787;
const BRIDGE_WORK = path.join(SCRATCH, "bridge-work-46b4");
const TARGET_BYTES = 37 * 1024 * 1024;
const PAGE_NAME = "__b4-headed-46b4.html";
const CTRL_BUNDLE = "__b4-headed-46b4-controller.mjs";
const T3_BUNDLE = "__b4-headed-46b4-t3.mjs";

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
// Cổng production phải trống, nếu không thì không chiếm cổng người dùng.
for (const [label, port] of [["vite", VITE_PORT], ["bridge", BRIDGE_PORT]]) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000) });
    await r.arrayBuffer().catch(() => null);
    notMeasured(`cổng ${port} (${label}) đã có server khác trả ${r.status} — không chạy đè`);
  } catch (e) {
    if (e && e.name === "TimeoutError") notMeasured(`cổng ${port} (${label}) timeout khi thăm dò`);
    // Lỗi kết nối = cổng trống, tiếp tục.
  }
}

// ---- 1. Fixture trailing thật, pad tới 37 MiB ----
const rawPath = path.join(SCRATCH, "trailing-raw.mp4");
const fixPath = path.join(SCRATCH, "trailing-b4.mp4");
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
  const pad = TARGET_BYTES - raw.length;
  if (pad <= 0) throw new Error(`fixture raw ${raw.length} đã vượt target ${TARGET_BYTES}`);
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
  const prefixBoxes = topBoxes(inflated.subarray(0, 512 * 1024));
  if (prefixBoxes.some((b) => b.type === "moov")) {
    throw new Error("tiền tố 512 KiB mặc định vẫn thấy moov — fixture không tái hiện được nợ tail-scan ở cỡ wiring");
  }
  console.log(`fixture: raw=${raw.length} byte, inflated=${inflated.length} byte, moov start=${moov.start + pad}, tiền tố 512 KiB không thấy moov, trong (32, 128] MiB=${inflated.length > 32 * 1024 * 1024 && inflated.length <= 128 * 1024 * 1024}`);
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

// ---- 2. Bridge thật :8787 + vite thật :5173 + page/bundle tạm ----
fs.mkdirSync(path.join(BRIDGE_WORK, "proxies"), { recursive: true });
fs.copyFileSync(fixPath, path.join(BRIDGE_WORK, "proxies", "trail-b4.mp4"));
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
      const r = await fetch(`${bridgeBase}/api/proxy/file/trail-b4.mp4`, { method: "HEAD" });
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
const range00 = await fetch(`${bridgeBase}/api/proxy/file/trail-b4.mp4`, { headers: { Range: "bytes=0-0" } });
await range00.arrayBuffer().catch(() => null);
record("bridge-range-0-0", range00.status === 206 &&
  range00.headers.get("content-range") === `bytes 0-0/${fileSize}`,
  `Range 0-0 → ${range00.status}, content-range=${range00.headers.get("content-range")}`);

const viteBin = path.join(REPO, "node_modules/.bin/vite");
let viteLog = "";
const vite = spawn(viteBin, ["--host", "127.0.0.1", "--port", String(VITE_PORT), "--strictPort"], {
  stdio: "pipe", cwd: WEB_DIR,
});
vite.stdout?.on("data", (d) => { viteLog += d.toString(); });
vite.stderr?.on("data", (d) => { viteLog += d.toString(); });
async function waitVite() {
  for (let i = 0; i < 60; i++) {
    if (vite.exitCode !== null) throw new Error(`vite thoát sớm mã ${vite.exitCode} (log: ${viteLog.slice(0, 500)})`);
    try {
      const r = await fetch(`http://127.0.0.1:${VITE_PORT}/`);
      await r.arrayBuffer().catch(() => null);
      if (r.status === 200) return r;
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  throw new Error(`vite không lên sau 30 s (log: ${viteLog.slice(0, 500)})`);
}
await waitVite();
console.log(`vite: http://127.0.0.1:${VITE_PORT}/ lên (log đầu: ${viteLog.slice(0, 200).replace(/\n/g, " ")})`);

const esbuild = path.join(REPO, "node_modules/.bin/esbuild");
const pubDir = path.join(WEB_DIR, "public");
for (const [entry, out] of [
  [path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts"), CTRL_BUNDLE],
  [path.join(REPO, "apps/web/src/lib/gopRangeFetch39T3.ts"), T3_BUNDLE],
]) {
  const b = spawnSync(esbuild, [entry, "--bundle", "--platform=browser", "--format=esm",
    `--outfile=${path.join(pubDir, out)}`], { stdio: "pipe", encoding: "utf8" });
  if (b.status !== 0) throw new Error(`esbuild bundle ${out} thất bại: ${(b.stderr || b.stdout || "").slice(0, 500)}`);
}
const pageHtml = `<!doctype html><meta charset="utf-8"><title>B4 GOP wiring headed</title>
<script type="module">
import { ReversePreviewController } from "./${CTRL_BUNDLE}";
import { fetchVideoTrackByGopRange } from "./${T3_BUNDLE}";
const BRIDGE = ${JSON.stringify(bridgeBase)};
const URL = BRIDGE + "/api/proxy/file/trail-b4.mp4";
const FILE_SIZE = ${fileSize};
window.__b4cors = async () => {
  const h = await fetch(URL, { method: "HEAD" });
  const r = await fetch(URL, { headers: { Range: "bytes=0-0" } });
  await r.arrayBuffer().catch(() => null);
  return { headStatus: h.status, acceptRanges: h.headers.get("accept-ranges"),
    rangeStatus: r.status, contentRange: r.headers.get("content-range") };
};
window.__b4controller = async () => {
  const c = new ReversePreviewController(URL, 15,
    { knownFileSizeBytes: FILE_SIZE, gopRangeEnabled: true });
  const ensureOk = await c.ensureWindowForTime(0);
  const out = { gopMode: c.gopMode, ready: c.ready, cacheSize: c.cacheSize,
    fallbackReason: c.gopFallbackReason, ensureOk, retained: c.retainedFileBytes };
  c.dispose();
  return out;
};
window.__b4t3 = async () => {
  const out = await fetchVideoTrackByGopRange(URL, {});
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
window.__b4ready = true;
</script>`;
fs.writeFileSync(path.join(pubDir, PAGE_NAME), pageHtml);

// ---- 3. Xvfb + Chrome headed (công thức X4/Z4/A4) ----
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
const profile = path.join(SCRATCH, "b4-chrome-profile");
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
const netReq = [];
let exitCode = 0;
try {
  const cdp = new CDP(await getWsUrl());
  cdp.onNetwork = (method, p) => {
    if (method === "Network.requestWillBeSent") {
      if (p.request.url.includes("/api/proxy/file/")) {
        netReq.push({ method: p.request.method,
          range: p.request.headers?.Range ?? p.request.headers?.range ?? null, status: null });
      }
    } else if (method === "Network.responseReceived") {
      const e = [...netReq].reverse().find((x) => x.status === null);
      if (e) e.status = p.response.status;
    }
  };
  await cdp.send("Network.enable", {});
  await cdp.send("Page.enable", {});
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${VITE_PORT}/${PAGE_NAME}` });
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__b4ready === true").catch(() => false);
    if (ready) break;
    if (i === 59) throw new Error("page không sẵn sau 30 s");
    await sleep(500);
  }
  const origin = await cdp.evalJs("location.origin");
  record("vite-page-origin", origin === `http://127.0.0.1:${VITE_PORT}`,
    `page origin=${origin} (vite :5173 thật)`);
  const cors = await cdp.evalJs("window.__b4cors()");
  record("page-cors", cors.headStatus === 200 && cors.acceptRanges === "bytes" &&
    cors.rangeStatus === 206 && cors.contentRange === `bytes 0-0/${fileSize}`,
    `HEAD ${cors.headStatus} accept-ranges=${cors.acceptRanges}; Range 0-0 ${cors.rangeStatus} ${cors.contentRange}`);
  const markCtrl = netReq.length;
  const ctrl = await cdp.evalJs("window.__b4controller()");
  const ctrlReqs = netReq.slice(markCtrl);
  const ctrlFullGets = ctrlReqs.filter((r) => r.method === "GET" && !r.range);
  record("controller-mode", ctrl.gopMode === "gop-range" && ctrl.ready === true,
    `gopMode=${ctrl.gopMode}, ready=${ctrl.ready}, fallbackReason=${ctrl.fallbackReason}`);
  record("controller-decode", ctrl.ensureOk === true && ctrl.cacheSize > 0,
    `ensureWindowForTime(0)=${ctrl.ensureOk}, cacheSize=${ctrl.cacheSize}, retained=${ctrl.retained}`);
  record("controller-requests", ctrlFullGets.length === 0,
    `CDP phase controller: ${ctrlReqs.length} request, full GET không Range=${ctrlFullGets.length}, chi tiết=${JSON.stringify(ctrlReqs)}`);
  const markT3 = netReq.length;
  const t3 = await cdp.evalJs("window.__b4t3()");
  const t3Reqs = netReq.slice(markT3);
  const t3FullGets = t3Reqs.filter((r) => r.method === "GET" && !r.range);
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
  record("page-t3-requests", hasTailKind && gopKindCount === 6 && t3FullGets.length === 0,
    `kinds=${(t3.kinds || []).join(",")}; CDP phase T3: ${t3Reqs.length} request, full GET không Range=${t3FullGets.length}, tail ranges=${JSON.stringify(t3.tailRanges || [])}`);
} catch (e) {
  console.error(`HARNESS ERROR: ${(e && e.message) || e}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { bridge.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { vite.kill("SIGKILL"); } catch { /* bỏ qua */ }
  for (const f of [PAGE_NAME, CTRL_BUNDLE, T3_BUNDLE]) {
    try { fs.rmSync(path.join(pubDir, f), { force: true }); } catch { /* bỏ qua */ }
  }
  await sleep(500);
}
const failed = results.filter((r) => !r.ok);
console.log(`\nB4 headed: ${results.length - failed.length}/${results.length} cổng pass`);
if (failed.length > 0) {
  for (const f of failed) console.log(`  FAIL: ${f.name} — ${f.detail}`);
  process.exit(1);
}
process.exit(exitCode);
