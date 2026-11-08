// gopHeaded47C5.mjs — Headed đợt 47 C5: (1) file trailing ENCODE THẬT
// ~37 MiB (không pad) qua controller wiring, qua vite :5173 → bridge
// :8787 THẬT; (2) click-test app thật: toggle TopBar
// "Phát ngược WebCodecs (GOP)" mặc định BẬT trên profile mới, bấm tắt /
// bật lại đổi đúng aria-pressed + localStorage.
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gopHeaded47C5.mjs
//
// Giàn đo (kế thừa B4, khác 2 điểm quyết định):
//  - Fixture ENCODE THẬT: ffmpeg testsrc2 1280×720 30 fps, -g 30,
//    crf 18, KHÔNG faststart, KHÔNG pad — file ~37 MiB là video thật
//    (mọi byte đều là sample/mdat thật, moov ở cuối). Script tự tạo
//    fixture; nếu encode ra ngoài (32, 128] MiB thì in NOT-MEASURED
//    và thoát mã 2 (không pad thêm để ép số — pad là điều B4 đã làm,
//    C5 cấm lặp lại).
//  - Click-test app thật: mở đúng app VCut ở http://127.0.0.1:5173/
//    (vite dev thật), chờ nút toggle xuất hiện, đọc aria-pressed +
//    localStorage `vcut-reverse-webcodecs` trên profile Chrome MỚI
//    (chưa từng set cờ → mặc định BẬT phải hiện true), bấm tắt rồi
//    bấm bật lại, kiểm tra từng trạng thái. Không tạo project, không
//    import file — chỉ kiểm tra toggle mặc định + phản hồi click.
//  - Bridge THẬT nguyên vẹn server/bridge/src/index.js trên cổng
//    8787, work-dir trong scratch, BRIDGE_RATE_GENERAL=5000.
//  - Vite dev THẬT của apps/web trên cổng 5173. Page + bundle test
//    của phase controller/T3 được đặt TẠM vào apps/web/public/ trong
//    lúc chạy và XÓA SẠCH trong finally — repo cuối cùng không còn
//    file tạm. Nếu cổng 5173/8787 đã có server khác thì script in
//    NOT-MEASURED và thoát mã 2 (không chiếm cổng người dùng).
//  - Kế toán phía BROWSER bằng CDP Network, tách phase bằng mốc CDP.
//    "Full-file GET" = GET không có header Range (HEAD và OPTIONS
//    preflight không tính).
//  - Chromium headed thật, Xvfb, --disable-gpu (công thức X4/Z4/A4/B4).
//
// Cổng PASS: xem cuối file. Nếu thiếu ffmpeg hoặc Chrome thì script
// in NOT-MEASURED rõ ràng và thoát mã 2 — KHÔNG bịa số. Mọi số
// headed đều under-load — cấm dùng làm baseline quiet hay claim fps;
// số frame/GOP là bằng chứng chức năng + wiring, không phải tốc độ.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHARED = process.env.C5_USE_SHARED_SERVERS === "1";
const SHARED_PROXY_DIR = process.env.C5_SHARED_PROXY_DIR || "/tmp/vcut-bridge-jobs/proxies";
// Chế độ SHARED (chỉ dùng khi cổng đã bị luồng khác đợt 47 giữ và đã
// chờ đủ lâu — xem LIMITS C5 §2.4): dùng vite :5173 + bridge :8787
// ĐANG CHẠY (cùng code production, cùng cổng, cùng URL), không spawn
// riêng, không kill sau chạy. Fixture được copy tạm vào thư mục
// proxies mặc định của bridge rồi XÓA trong finally. Bridge của luồng
// khác có rate-limit 120/phút chung — nếu harness gặp 429 thì cổng đó
// FAIL/NOT-MEASURED chứ không bịa số. Không dùng chế độ này mặc định.
const SCRATCH = process.env.C5_SCRATCH || path.join(os.homedir(), "scratch-round47-c5");
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(REPO, "apps/web");
const CHROME = process.env.C5_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.C5_DEBUG_PORT || 9378);
const VITE_PORT = 5173;
const BRIDGE_PORT = 8787;
const BRIDGE_WORK = path.join(SCRATCH, "bridge-work-47c5");
const PAGE_NAME = "__c5-headed-47c5.html";
const CTRL_BUNDLE = "__c5-headed-47c5-controller.mjs";
const T3_BUNDLE = "__c5-headed-47c5-t3.mjs";

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
// Ngoại lệ SHARED: dùng ké server đang chạy (xem chú thích ở đầu file).
if (!SHARED) {
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
} else {
  console.log("SHARED: dùng vite :5173 + bridge :8787 đang chạy của luồng khác (cùng code production, cùng cổng); không spawn/kill server.");
}

// ---- 1. Fixture trailing ENCODE THẬT (không pad) ----
const fixPath = path.join(SCRATCH, "trailing-real37.mp4");
{
  const args = ["-y", "-v", "error", "-f", "lavfi", "-i",
    "testsrc2=size=1280x720:rate=30:duration=72",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "30",
    "-crf", "18", "-preset", "veryfast", fixPath];
  const r = spawnSync("ffmpeg", args, { stdio: "pipe", encoding: "utf8", timeout: 600000 });
  if (r.status !== 0) throw new Error(`ffmpeg tạo fixture thất bại: ${(r.stderr || "").slice(0, 300)}`);
}
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
const fileSize = fs.statSync(fixPath).size;
{
  const raw = fs.readFileSync(fixPath);
  const boxes = topBoxes(raw);
  const mdat = boxes.find((b) => b.type === "mdat");
  const moov = boxes[boxes.length - 1];
  if (!mdat || moov.type !== "moov" || !(moov.start > mdat.start)) {
    throw new Error(`fixture ffmpeg không có thứ tự mdat trước moov: ${boxes.map((b) => b.type).join(",")}`);
  }
  const prefixBoxes = topBoxes(raw.subarray(0, 512 * 1024));
  if (prefixBoxes.some((b) => b.type === "moov")) {
    throw new Error("tiền tố 512 KiB mặc định vẫn thấy moov — fixture không tái hiện được nợ tail-scan ở cỡ wiring");
  }
  const inWiring = fileSize > 32 * 1024 * 1024 && fileSize <= 128 * 1024 * 1024;
  console.log(`fixture ENCODE THẬT (không pad): size=${fileSize} byte (${(fileSize / 1048576).toFixed(2)} MiB), moov start=${moov.start}, boxes=${boxes.map((b) => b.type).join(",")}, tiền tố 512 KiB không thấy moov, trong (32, 128] MiB=${inWiring}`);
  if (!inWiring) notMeasured(`fixture encode thật ra ${fileSize} byte, ngoài (32, 128] MiB — không pad để ép số, dừng đo`);
}
let ffprobeFrames = null;
let ffprobeDur = null;
let ffprobeW = null;
let ffprobeH = null;
{
  // JSON (không csv): thứ tự cột csv của ffprobe không khớp thứ tự
  // yêu cầu (lần chạy đầu đọc nhầm width=1280 thành nb_frames).
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=nb_frames,duration,width,height", "-of", "json", fixPath], { encoding: "utf8" });
  try {
    const j = JSON.parse(r.stdout || "{}");
    const s = (j.streams || [])[0] || {};
    const n = Number(s.nb_frames);
    if (Number.isFinite(n) && n > 0) ffprobeFrames = n;
    ffprobeDur = s.duration ?? null;
    ffprobeW = s.width ?? null;
    ffprobeH = s.height ?? null;
  } catch { /* giữ null, cổng frames sẽ SKIP */ }
  console.log(`ffprobe video nb_frames=${ffprobeFrames} duration=${ffprobeDur} ${ffprobeW}x${ffprobeH}`);
}

// ---- 2. Bridge thật :8787 + vite thật :5173 + page/bundle tạm ----
const sharedFixturePath = path.join(SHARED_PROXY_DIR, "trail-c5.mp4");
if (SHARED) {
  fs.mkdirSync(SHARED_PROXY_DIR, { recursive: true });
  fs.copyFileSync(fixPath, sharedFixturePath);
  console.log(`SHARED: fixture copy tạm vào ${sharedFixturePath} (xóa trong finally)`);
} else {
  fs.mkdirSync(path.join(BRIDGE_WORK, "proxies"), { recursive: true });
  fs.copyFileSync(fixPath, path.join(BRIDGE_WORK, "proxies", "trail-c5.mp4"));
}
const bridge = SHARED ? null : spawn("node", [path.join(REPO, "server/bridge/src/index.js")], {
  stdio: "pipe",
  // Đợt 66 T9 — persist riêng theo PID (BRIDGE_WORK cố định giữa các lần chạy): tránh rò mốc limiter sang test khác (đợt 65 §3b).
  env: { ...process.env, BRIDGE_PORT: String(BRIDGE_PORT), BRIDGE_WORK_DIR: BRIDGE_WORK, BRIDGE_RATE_GENERAL: "5000", BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK, `rate-limit-${process.pid}.json`) },
});
let bridgeLog = "";
if (bridge) {
bridge.stdout?.on("data", (d) => { bridgeLog += d.toString(); });
bridge.stderr?.on("data", (d) => { bridgeLog += d.toString(); });
}
const bridgeBase = `http://127.0.0.1:${BRIDGE_PORT}`;
async function waitBridge() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${bridgeBase}/api/proxy/file/trail-c5.mp4`, { method: "HEAD" });
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
const range00 = await fetch(`${bridgeBase}/api/proxy/file/trail-c5.mp4`, { headers: { Range: "bytes=0-0" } });
await range00.arrayBuffer().catch(() => null);
record("bridge-range-0-0", range00.status === 206 &&
  range00.headers.get("content-range") === `bytes 0-0/${fileSize}`,
  `Range 0-0 → ${range00.status}, content-range=${range00.headers.get("content-range")}`);

const viteBin = path.join(REPO, "node_modules/.bin/vite");
let viteLog = "";
const vite = SHARED ? null : spawn(viteBin, ["--host", "127.0.0.1", "--port", String(VITE_PORT), "--strictPort"], {
  stdio: "pipe", cwd: WEB_DIR,
});
if (vite) {
vite.stdout?.on("data", (d) => { viteLog += d.toString(); });
vite.stderr?.on("data", (d) => { viteLog += d.toString(); });
}
async function waitVite() {
  for (let i = 0; i < 60; i++) {
    if (vite && vite.exitCode !== null) throw new Error(`vite thoát sớm mã ${vite.exitCode} (log: ${viteLog.slice(0, 500)})`);
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
const pageHtml = `<!doctype html><meta charset="utf-8"><title>C5 GOP wiring headed</title>
<script type="module">
import { ReversePreviewController } from "./${CTRL_BUNDLE}";
import { fetchVideoTrackByGopRange } from "./${T3_BUNDLE}";
const BRIDGE = ${JSON.stringify(bridgeBase)};
const URL = BRIDGE + "/api/proxy/file/trail-c5.mp4";
const FILE_SIZE = ${fileSize};
window.__c5cors = async () => {
  const h = await fetch(URL, { method: "HEAD" });
  const r = await fetch(URL, { headers: { Range: "bytes=0-0" } });
  await r.arrayBuffer().catch(() => null);
  return { headStatus: h.status, acceptRanges: h.headers.get("accept-ranges"),
    rangeStatus: r.status, contentRange: r.headers.get("content-range") };
};
window.__c5controller = async () => {
  const c = new ReversePreviewController(URL, 15,
    { knownFileSizeBytes: FILE_SIZE, gopRangeEnabled: true });
  const ensureOk = await c.ensureWindowForTime(0);
  const out = { gopMode: c.gopMode, ready: c.ready, cacheSize: c.cacheSize,
    fallbackReason: c.gopFallbackReason, ensureOk, retained: c.retainedFileBytes };
  c.dispose();
  return out;
};
window.__c5t3 = async () => {
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
window.__c5ready = true;
</script>`;
fs.writeFileSync(path.join(pubDir, PAGE_NAME), pageHtml);

// ---- 3. Xvfb + Chrome headed (công thức X4/Z4/A4/B4) ----
let xvfb = null;
let display = process.env.DISPLAY || null;
if (!display) {
  for (const num of [96, 97, 98]) {
    xvfb = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xvfb.exitCode === null) { display = `:${num}`; break; }
    xvfb = null;
  }
  if (!display) notMeasured("không khởi động được Xvfb (:96/:97/:98 đều bận hoặc lỗi)");
  console.log(`xvfb: DISPLAY=${display}`);
}
const profile = path.join(SCRATCH, "c5-chrome-profile");
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
  // ---- Phase A: controller wiring + T3 trực tiếp trên fixture encode thật ----
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${VITE_PORT}/${PAGE_NAME}` });
  for (let i = 0; i < 60; i++) {
    const ready = await cdp.evalJs("window.__c5ready === true").catch(() => false);
    if (ready) break;
    if (i === 59) throw new Error("page test không sẵn sau 30 s");
    await sleep(500);
  }
  const origin = await cdp.evalJs("location.origin");
  record("vite-page-origin", origin === `http://127.0.0.1:${VITE_PORT}`,
    `page origin=${origin} (vite :5173 thật)`);
  const cors = await cdp.evalJs("window.__c5cors()");
  record("page-cors", cors.headStatus === 200 && cors.acceptRanges === "bytes" &&
    cors.rangeStatus === 206 && cors.contentRange === `bytes 0-0/${fileSize}`,
    `HEAD ${cors.headStatus} accept-ranges=${cors.acceptRanges}; Range 0-0 ${cors.rangeStatus} ${cors.contentRange}`);
  const markCtrl = netReq.length;
  const ctrl = await cdp.evalJs("window.__c5controller()");
  const ctrlReqs = netReq.slice(markCtrl);
  const ctrlFullGets = ctrlReqs.filter((r) => r.method === "GET" && !r.range);
  record("controller-mode", ctrl.gopMode === "gop-range" && ctrl.ready === true,
    `gopMode=${ctrl.gopMode}, ready=${ctrl.ready}, fallbackReason=${ctrl.fallbackReason}`);
  record("controller-decode", ctrl.ensureOk === true && ctrl.cacheSize > 0,
    `ensureWindowForTime(0)=${ctrl.ensureOk}, cacheSize=${ctrl.cacheSize}, retained=${ctrl.retained}`);
  record("controller-requests", ctrlFullGets.length === 0,
    `CDP phase controller: ${ctrlReqs.length} request, full GET không Range=${ctrlFullGets.length}, chi tiết=${JSON.stringify(ctrlReqs)}`);
  if (SHARED) {
    // Bridge chia sẻ có rate-limit mặc định 120/phút: phase controller
    // vừa làm ~76 request trong < 1 phút; chờ 65 s cho cửa sổ rate
    // reset rồi mới chạy phase T3 (~76 request nữa), nếu không T3 sẽ
    // ăn 429 giữa chừng và fallback (đúng điều lần chạy đầu gặp).
    console.log("SHARED: chờ 65 s cho cửa sổ rate-limit 120/phút của bridge reset trước phase T3…");
    await sleep(65000);
  }
  const markT3 = netReq.length;
  const t3 = await cdp.evalJs("window.__c5t3()");
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
  const expectedGops = ffprobeFrames !== null ? Math.ceil(ffprobeFrames / 30) : null;
  record("page-t3-requests", t3.mode === "gop-range" && hasTailKind &&
    (expectedGops === null || gopKindCount === expectedGops) && t3FullGets.length === 0,
    `mode=${t3.mode} kinds=${(t3.kinds || []).join(",")}; CDP phase T3: ${t3Reqs.length} request, full GET không Range=${t3FullGets.length}, tail ranges=${JSON.stringify(t3.tailRanges || [])}, GOP kinds=${gopKindCount} (kỳ vọng ${expectedGops})`);

  // ---- Phase B: click-test app thật — toggle mặc định BẬT ----
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${VITE_PORT}/` });
  let toggleFound = false;
  for (let i = 0; i < 120; i++) {
    toggleFound = await cdp.evalJs(`!!document.querySelector('[data-testid="reverse-webcodecs-toggle"]')`).catch(() => false);
    if (toggleFound) break;
    await sleep(500);
  }
  record("app-toggle-present", toggleFound,
    toggleFound ? "nút toggle [data-testid=reverse-webcodecs-toggle] xuất hiện trên app thật" : "không thấy nút toggle sau 60 s chờ app mount");
  if (toggleFound) {
    const before = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="reverse-webcodecs-toggle"]'); return { pressed: b.getAttribute("aria-pressed"), ls: localStorage.getItem("vcut-reverse-webcodecs"), cls: b.className }; })()`);
    record("app-toggle-default-on", before.pressed === "true" && before.ls === null,
      `profile mới: aria-pressed=${before.pressed}, localStorage vcut-reverse-webcodecs=${before.ls}, class=${before.cls} (mặc định BẬT = chưa set cờ, nút sáng)`);
    await cdp.evalJs(`document.querySelector('[data-testid="reverse-webcodecs-toggle"]').click()`);
    await sleep(500);
    const off = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="reverse-webcodecs-toggle"]'); return { pressed: b.getAttribute("aria-pressed"), ls: localStorage.getItem("vcut-reverse-webcodecs") }; })()`);
    record("app-toggle-click-off", off.pressed === "false" && off.ls === "0",
      `sau 1 click: aria-pressed=${off.pressed}, localStorage=${off.ls}`);
    await cdp.evalJs(`document.querySelector('[data-testid="reverse-webcodecs-toggle"]').click()`);
    await sleep(500);
    const on = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="reverse-webcodecs-toggle"]'); return { pressed: b.getAttribute("aria-pressed"), ls: localStorage.getItem("vcut-reverse-webcodecs") }; })()`);
    record("app-toggle-click-on", on.pressed === "true" && on.ls === "1",
      `sau click thứ 2: aria-pressed=${on.pressed}, localStorage=${on.ls}`);
  }
} catch (e) {
  console.error(`HARNESS ERROR: ${(e && e.message) || e}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (bridge) bridge.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (vite) vite.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (SHARED) fs.rmSync(sharedFixturePath, { force: true }); } catch { /* bỏ qua */ }
  for (const f of [PAGE_NAME, CTRL_BUNDLE, T3_BUNDLE]) {
    try { fs.rmSync(path.join(pubDir, f), { force: true }); } catch { /* bỏ qua */ }
  }
  await sleep(500);
}
const failed = results.filter((r) => !r.ok);
console.log(`\nC5 headed: ${results.length - failed.length}/${results.length} cổng pass`);
if (failed.length > 0) {
  for (const f of failed) console.log(`  FAIL: ${f.name} — ${f.detail}`);
  process.exit(1);
}
process.exit(exitCode);
