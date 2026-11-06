// gopHeaded49E2.mjs — Headed đợt 49 E2: GOP BẬT TRÊN BLOB: URL TRONG
// APP THẬT (đóng nợ D4 §6.1) + ĐO ĐỈNH HEAP KHI FALLBACK TẢI TOÀN FILE
// BLOB 37 MiB (đóng nợ D4 §6.2) + click-test nút "Phát ngược" K4 đã
// qua i18n (đóng nợ D4 §6.3). Kế thừa giàn D4 (import file trailing
// ENCODE THẬT ~37 MiB → thêm vào timeline → End về cuối → bấm
// "Phát ngược" → đo frame ngược thật + gopActive), qua vite :5173 +
// bridge :8787 THẬT, thêm:
//   - E2_MODE=gop (mặc định, toggle GOP BẬT): kỳ vọng gopActive=true,
//     0 GET toàn file (quan sát qua CDP Network + resource timing).
//   - E2_MODE=fallback (toggle GOP TẮT trước khi phát ngược): đường
//     cũ tải toàn file — đo đỉnh heap để trả nợ D4 §6.2, playhead vẫn
//     phải lùi (fallback decode được).
//   - Lấy mẫu heap (performance.memory.usedJSHeapSize + RSS cây Chrome
//     qua ps, mẫu Z4) mỗi 500 ms: baseline sau gc, đỉnh trong lúc
//     quan sát, settled sau gc — để so GOP vs fallback, không claim
//     fps/baseline quiet.
//   - Chrome chạy thêm --js-flags=--expose-gc --enable-precise-memory-info.
//
// Cách chạy (từ gốc repo):
//   node apps/web/scripts/gopHeaded49E2.mjs            # mode gop
//   E2_MODE=fallback node apps/web/scripts/gopHeaded49E2.mjs
//
// Giàn đo (kế thừa C5, khác điểm quyết định: đo TRONG APP, không phải
// page test riêng):
//  - Fixture TÁI DÙNG file encode thật của C5
//    (~/scratch-round47-c5/trailing-real37.mp4, 38.996.431 byte,
//    1280×720 30 fps 72 s, 2160 frame, -g 30, moov cuối, KHÔNG
//    faststart, KHÔNG pad). Script kiểm tra đúng 38.996.431 byte; nếu
//    file mất thì encode lại y hệt tham số C5 (không pad để ép số).
//  - App VCut thật ở http://127.0.0.1:5173/ (vite dev thật), profile
//    Chrome MỚI: tắt màn chào bằng localStorage `vcut-welcomed=1`
//    rồi reload; chờ project mẫu load xong (duration 00:08) TRƯỚC khi
//    import — vì loadSample set() toàn bộ media/spec, import trước lúc
//    đó sẽ bị ghi đè mất (race đã tính trước, không phải lỗi app).
//  - Import bằng CDP DOM.setFileInputFiles lên đúng input file của
//    MediaBin (accept video/*,audio/*,image/*) — cùng đường người dùng
//    chọn file qua hộp thoại, chỉ khác cách đưa file vào input.
//    File 720p nên shouldAutoProxy = false (height <= 720): KHÔNG tạo
//    proxy, preview dùng đúng blob: URL gốc + item.file.size — điều
//    kiện để đường GOP Range bật trên file gốc; harness ghi rõ text
//    nút proxy làm bằng chứng.
//  - Thêm clip bằng nút ".media-add" của card (addMediaAtPlayhead):
//    clip 72 s từ 0, project mẫu chỉ 8 s nên duration thành 01:12 và
//    ở cuối timeline chỉ clip 37 MiB active (mẫu nằm 0–8 s).
//  - Seek cuối bằng phím End thật (Input.dispatchKeyEvent), bật phát
//    ngược bằng nút [aria-label="Phát ngược"] (K4), quan sát 45 s:
//    playhead lùi (đọc .time-display), window.__vcutReverseWc
//    (hits/misses/gopActive/gopFallbackReasons/controllerFetches),
//    window.__vcutHoldStats (draw/hold/skip), pixel canvas
//    (.preview-canvas → downscale 32×18 → mean/stddev/hash).
//  - Bridge THẬT nguyên vẹn server/bridge/src/index.js trên cổng
//    8787, work-dir trong scratch, BRIDGE_RATE_GENERAL=5000 (dù E2E
//    này không cần bridge — file 720p không tạo proxy — bridge vẫn
//    chạy để giữ nguyên giàn C5 và phòng trường hợp app gọi bridge).
//  - Nếu cổng 5173/8787 đã có server khác thì TỰ chuyển SHARED (dùng
//    vite + bridge đang chạy, không spawn/kill — theo lệnh D4), ghi rõ
//    trong log; fixture KHÔNG copy vào bridge ở chế độ SHARED (import
//    qua file input, không cần bridge phục vụ file).
//  - Chromium headed thật, Xvfb, --disable-gpu (công thức X4/Z4/A4/B4/C5).
//
// Cổng PASS: xem cuối file. Nếu thiếu ffmpeg/Chrome/fixture thì script
// in NOT-MEASURED rõ ràng và thoát mã 2 — KHÔNG bịa số. Mọi số headed
// đều under-load — cấm dùng làm baseline quiet hay claim fps; số
// frame/GOP là bằng chứng chức năng + wiring, không phải tốc độ.
import { spawn, spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHARED_ENV = process.env.E2_USE_SHARED_SERVERS === "1";
const SCRATCH = process.env.E2_SCRATCH || path.join(os.homedir(), "scratch-round49-e2");
const FIXTURE = process.env.E2_FIXTURE || path.join(os.homedir(), "scratch-round47-c5", "trailing-real37.mp4");
const MODE = (process.env.E2_MODE || "gop").toLowerCase();
if (MODE !== "gop" && MODE !== "fallback") throw new Error(`E2_MODE phải là gop|fallback, nhận ${MODE}`);
console.log(`E2 mode=${MODE} (gop: toggle GOP BẬT, kỳ vọng gopActive=true; fallback: toggle TẮT, đo đỉnh heap đường tải toàn file)`);
const FIXTURE_SIZE = 38996431;
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(REPO, "apps/web");
const CHROME = process.env.E2_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.E2_DEBUG_PORT || 9381);
const VITE_PORT = 5173;
const BRIDGE_PORT = 8787;
const BRIDGE_WORK = path.join(SCRATCH, "bridge-work-49e2");

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

// ---- 1. Fixture trailing ENCODE THẬT (tái dùng của C5) ----
if (!fs.existsSync(FIXTURE) || fs.statSync(FIXTURE).size !== FIXTURE_SIZE) {
  if (!fs.existsSync(FIXTURE)) console.log(`fixture C5 mất (${FIXTURE}) — encode lại y hệt tham số C5…`);
  else console.log(`fixture sai size (${fs.statSync(FIXTURE).size} != ${FIXTURE_SIZE}) — encode lại y hệt tham số C5…`);
  const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "pipe" });
  if (ffmpegCheck.status !== 0) notMeasured("không có ffmpeg để encode lại fixture");
  const args = ["-y", "-v", "error", "-f", "lavfi", "-i",
    "testsrc2=size=1280x720:rate=30:duration=72",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-g", "30",
    "-crf", "18", "-preset", "veryfast", FIXTURE];
  const r = spawnSync("ffmpeg", args, { stdio: "pipe", encoding: "utf8", timeout: 600000 });
  if (r.status !== 0) throw new Error(`ffmpeg tạo fixture thất bại: ${(r.stderr || "").slice(0, 300)}`);
  if (fs.statSync(FIXTURE).size !== FIXTURE_SIZE) {
    notMeasured(`fixture encode lại ra ${fs.statSync(FIXTURE).size} byte, khác file C5 ${FIXTURE_SIZE} — không pad để ép số, dừng đo`);
  }
}
const fileSize = fs.statSync(FIXTURE).size;
console.log(`fixture ENCODE THẬT (tái dùng C5): size=${fileSize} byte (${(fileSize / 1048576).toFixed(2)} MiB), trong (32, 128] MiB=${fileSize > 32 * 1024 * 1024 && fileSize <= 128 * 1024 * 1024}`);

// ---- 2. Bridge thật :8787 + vite thật :5173 (hoặc SHARED) ----
let SHARED = SHARED_ENV;
if (!SHARED) {
  for (const [label, port] of [["vite", VITE_PORT], ["bridge", BRIDGE_PORT]]) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000) });
      await r.arrayBuffer().catch(() => null);
      console.log(`cổng ${port} (${label}) đã có server khác trả ${r.status} — chuyển chế độ SHARED (dùng server đang chạy, không spawn/kill).`);
      SHARED = true;
    } catch (e) {
      if (e && e.name === "TimeoutError") notMeasured(`cổng ${port} (${label}) timeout khi thăm dò`);
      // Lỗi kết nối = cổng trống, tiếp tục.
    }
  }
}
if (SHARED) console.log("SHARED: dùng vite :5173 + bridge :8787 đang chạy của luồng khác (cùng code production, cùng cổng); không spawn/kill server.");
if (!SHARED) {
  fs.mkdirSync(path.join(BRIDGE_WORK, "proxies"), { recursive: true });
  fs.copyFileSync(FIXTURE, path.join(BRIDGE_WORK, "proxies", "trail-e2.mp4"));
}
const bridge = SHARED ? null : spawn("node", [path.join(REPO, "server/bridge/src/index.js")], {
  stdio: "pipe",
  env: { ...process.env, BRIDGE_PORT: String(BRIDGE_PORT), BRIDGE_WORK_DIR: BRIDGE_WORK, BRIDGE_RATE_GENERAL: "5000" },
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
      const r = await fetch(`${bridgeBase}/api/proxy/file/trail-d4.mp4`, { method: "HEAD" });
      if (r.status === 200) return r;
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  throw new Error(`bridge không lên sau 30 s (log: ${bridgeLog.slice(0, 500)})`);
}
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
if (!SHARED) {
  const headResp = await waitBridge();
  record("bridge-head", headResp.status === 200 &&
    headResp.headers.get("content-length") === String(fileSize) &&
    headResp.headers.get("accept-ranges") === "bytes",
    `HEAD → ${headResp.status}, content-length=${headResp.headers.get("content-length")}, accept-ranges=${headResp.headers.get("accept-ranges")}`);
} else {
  console.log("SHARED: bỏ qua cổng bridge-head (bridge của luồng khác, work-dir không phải của D4).");
}
await waitVite();
console.log(`vite: http://127.0.0.1:${VITE_PORT}/ lên`);

// ---- 3. Xvfb + Chrome headed (công thức X4/Z4/A4/B4/C5) ----
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
const profile = path.join(SCRATCH, `e2-chrome-profile-${MODE}`);
fs.rmSync(profile, { recursive: true, force: true });
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
  "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
  "--enable-precise-memory-info", "--js-flags=--expose-gc",
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
      if (msg.method && this.onEvent) this.onEvent(msg.method, msg.params);
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

// Parse "MM:SS" hoặc "H:MM:SS" → giây.
function parseClock(s) {
  if (typeof s !== "string") return null;
  const parts = s.trim().split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return null;
  let total = 0;
  for (const n of parts) total = total * 60 + n;
  return total;
}
function parseTimeDisplay(txt) {
  if (typeof txt !== "string") return { playhead: null, duration: null };
  const [a, b] = txt.split("/");
  return { playhead: parseClock(a ?? ""), duration: parseClock(b ?? "") };
}


// RSS cây tiến trình Chrome (mẫu Z4): tổng RSS (KiB → MiB) của tiến
// trình browser + mọi tiến trình con qua `ps`. Chỉ DELTA so với
// baseline mới có nghĩa (RSS tuyệt đối gồm cả baseline trình duyệt).
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
async function heapNow(cdp) {
  return cdp.evalJs(`(() => { const m = performance.memory || {}; return { used: m.usedJSHeapSize ?? null, total: m.totalJSHeapSize ?? null, gc: typeof window.gc === "function" }; })()`).catch(() => ({ used: null, total: null, gc: false }));
}
async function gcNow(cdp) {
  await cdp.evalJs(`(() => { try { if (window.gc) { window.gc(); window.gc(); } } catch {} return true; })()`).catch(() => null);
}

const pageErrors = [];
const consoleErrors = [];
let exitCode = 0;
try {
  const cdp = new CDP(await getWsUrl());
  cdp.onEvent = (method, p) => {
    if (method === "Runtime.exceptionThrown") {
      pageErrors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || "unknown").slice(0, 300));
    } else if (method === "Network.requestWillBeSent" && typeof p.request?.url === "string" && p.request.url.startsWith("blob:")) {
      const h = p.request.headers || {};
      netBlobReqs.push({ method: p.request.method, range: h.Range ?? h.range ?? null, url: p.request.url.slice(0, 40) });
    } else if (method === "Runtime.consoleAPICalled" && p.type === "error") {
      const text = (p.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300);
      if (text) consoleErrors.push(text);
    }
  };
  await cdp.send("Runtime.enable", {});
  await cdp.send("Page.enable", {});
  await cdp.send("DOM.enable", {});
  await cdp.send("Network.enable", {});
  const netBlobReqs = [];
  await cdp.send("Input.enable", {}).catch(() => null);

  // ---- Phase A: mở app, tắt màn chào, chờ project mẫu load xong ----
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${VITE_PORT}/` });
  let toggleFound = false;
  for (let i = 0; i < 120; i++) {
    toggleFound = await cdp.evalJs(`!!document.querySelector('[data-testid="reverse-webcodecs-toggle"]')`).catch(() => false);
    if (toggleFound) break;
    await sleep(500);
  }
  record("app-toggle-present", toggleFound,
    toggleFound ? "nút toggle [data-testid=reverse-webcodecs-toggle] xuất hiện trên app thật" : "không thấy nút toggle sau 60 s chờ app mount");
  if (!toggleFound) throw new Error("app không mount — dừng đo E2E");
  // Màn chào lần đầu che app: đánh dấu đã chào rồi reload (deterministic).
  await cdp.evalJs(`localStorage.setItem("vcut-welcomed", "1")`);
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${VITE_PORT}/` });
  for (let i = 0; i < 120; i++) {
    toggleFound = await cdp.evalJs(`!!document.querySelector('[data-testid="reverse-webcodecs-toggle"]')`).catch(() => false);
    if (toggleFound) break;
    await sleep(500);
  }
  if (!toggleFound) throw new Error("app không mount sau reload — dừng đo E2E");
  const toggleState = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="reverse-webcodecs-toggle"]'); return { pressed: b.getAttribute("aria-pressed"), label: b.getAttribute("aria-label"), title: b.getAttribute("title"), ls: localStorage.getItem("vcut-reverse-webcodecs"), cls: b.className }; })()`);
  record("app-toggle-default-on", toggleState.pressed === "true" && toggleState.ls === null,
    `profile mới: aria-pressed=${toggleState.pressed}, localStorage vcut-reverse-webcodecs=${toggleState.ls}, class=${toggleState.cls} (mặc định BẬT)`);
  // ROUND48-D4: aria-label/title phải đi qua i18n (vi mặc định).
  record("app-toggle-i18n-label", toggleState.label === "Phát ngược WebCodecs (GOP)" &&
    toggleState.title === "Phát ngược WebCodecs (GOP) đang BẬT — file video lớn phát ngược bằng Range theo GOP thay vì tải toàn file. Bấm để tắt (về đường element-seek cũ).",
    `aria-label=${JSON.stringify(toggleState.label)}, title=${JSON.stringify(toggleState.title)}`);
  // ROUND49-E2 mode=fallback: tắt toggle GOP (đường cũ tải toàn file)
  // TRƯỚC khi import/phát ngược; verify aria-pressed=false.
  if (MODE === "fallback") {
    await cdp.evalJs(`document.querySelector('[data-testid="reverse-webcodecs-toggle"]').click()`);
    await sleep(500);
    const off = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="reverse-webcodecs-toggle"]'); return { pressed: b.getAttribute("aria-pressed"), ls: localStorage.getItem("vcut-reverse-webcodecs") }; })()`);
    record("e2e-toggle-off", off.pressed === "false",
      `mode=fallback: sau khi bấm toggle: aria-pressed=${off.pressed}, localStorage vcut-reverse-webcodecs=${off.ls} (kỳ vọng false = GOP TẮT)`);
    if (off.pressed !== "false") throw new Error("không tắt được toggle GOP — dừng đo fallback");
  }
  // ROUND49-E2: nút "Phát ngược" K4 phải qua i18n (vi mặc định):
  // aria-label giữ nguyên "Phát ngược" nên selector harness không đổi.
  const k4 = await cdp.evalJs(`(() => { const b = document.querySelector('[aria-label="Phát ngược"]'); return b ? { label: b.getAttribute("aria-label"), title: b.getAttribute("title") } : null; })()`);
  record("app-k4-i18n-label", k4 !== null && k4.label === "Phát ngược" &&
    k4.title === "Phát ngược (phím J) — playhead chạy lùi từng frame, không có audio đồng bộ",
    k4 ? `nút K4 trên app thật: aria-label=${JSON.stringify(k4.label)}, title=${JSON.stringify(k4.title)}` : "không thấy nút [aria-label=Phát ngược]");
  // Chờ project mẫu load xong (duration 00:08) TRƯỚC khi import —
  // loadSample set() toàn bộ media/spec nên import trước lúc đó sẽ
  // bị ghi đè mất (race đã tính trước).
  let sampleReady = false;
  let sampleDur = null;
  for (let i = 0; i < 120; i++) {
    const td = await cdp.evalJs(`(document.querySelector(".time-display")||{}).textContent || ""`).catch(() => "");
    const parsed = parseTimeDisplay(td);
    sampleDur = parsed.duration;
    if (parsed.duration === 8) { sampleReady = true; break; }
    await sleep(500);
  }
  record("app-sample-ready", sampleReady,
    sampleReady ? "project mẫu đã load (duration 00:08), import sau lúc này không bị ghi đè" : `project mẫu chưa sẵn sau 60 s (duration đọc được=${sampleDur})`);
  if (!sampleReady) throw new Error("project mẫu chưa load — dừng đo E2E (tránh race ghi đè import)");

  // ---- Phase B: import file 37 MiB qua input file của MediaBin ----
  const doc = await cdp.send("DOM.getDocument", { depth: -1 });
  const inputQ = await cdp.send("DOM.querySelector", {
    nodeId: doc.root.nodeId,
    selector: 'input[type="file"][accept="video/*,audio/*,image/*"]',
  });
  if (!inputQ.nodeId) throw new Error("không thấy input file của MediaBin");
  const tImport0 = Date.now();
  await cdp.send("DOM.setFileInputFiles", { files: [FIXTURE], nodeId: inputQ.nodeId });
  let cardFound = false;
  let proxyText = null;
  for (let i = 0; i < 240; i++) {
    const found = await cdp.evalJs(`(() => { const cards = [...document.querySelectorAll(".media-card")]; const mine = cards.find((c) => (c.querySelector(".media-name")||{}).textContent === "trailing-real37.mp4"); if (!mine) return { found: false }; const proxyBtn = mine.querySelector(".media-proxy"); return { found: true, proxy: proxyBtn ? proxyBtn.textContent : null, dur: (mine.querySelector(".media-dur")||{}).textContent || null }; })()`).catch(() => ({ found: false }));
    if (found.found) { cardFound = true; proxyText = found.proxy; break; }
    await sleep(500);
  }
  const importMs = Date.now() - tImport0;
  record("e2e-import", cardFound,
    cardFound ? `file trailing-real37.mp4 xuất hiện trong media bin sau ${(importMs / 1000).toFixed(1)} s (input file → fileToMediaItem → IndexedDB ingest)` : `không thấy card media sau 120 s (importMs=${importMs})`);
  if (!cardFound) throw new Error("import thất bại — dừng đo E2E");
  // File 720p → shouldAutoProxy=false → không proxy, preview dùng blob gốc.
  record("e2e-no-proxy", typeof proxyText === "string" && !proxyText.includes("✓ PROXY"),
    `nút proxy của card: ${JSON.stringify(proxyText)} (không "✓ PROXY" = preview dùng blob: URL gốc + item.file.size, điều kiện để GOP bật)`);
  const durText = await cdp.evalJs(`(document.querySelector(".media-card .media-dur")||{}).textContent || ""`).catch(() => "");

  // ---- Phase C: thêm clip vào timeline, End về cuối ----
  await cdp.evalJs(`(() => { const cards = [...document.querySelectorAll(".media-card")]; const mine = cards.find((c) => (c.querySelector(".media-name")||{}).textContent === "trailing-real37.mp4"); const btn = mine && mine.querySelector(".media-add"); if (btn) btn.click(); return !!btn; })()`);
  let addedDur = null;
  for (let i = 0; i < 60; i++) {
    const td = await cdp.evalJs(`(document.querySelector(".time-display")||{}).textContent || ""`).catch(() => "");
    const parsed = parseTimeDisplay(td);
    addedDur = parsed.duration;
    if (parsed.duration !== null && parsed.duration >= 72) break;
    await sleep(500);
  }
  record("e2e-add-clip", addedDur !== null && addedDur >= 72,
    `sau khi bấm "+ Thêm": duration project=${addedDur} s (kỳ vọng ≥ 72 s = clip 37 MiB; mẫu chỉ 8 s), media-dur trên card=${JSON.stringify(durText)}`);
  if (!(addedDur !== null && addedDur >= 72)) throw new Error("thêm clip vào timeline thất bại — dừng đo E2E");
  // Phím End thật → playhead = duration.
  async function pressEnd() {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "End", code: "End", windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "End", code: "End", windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35 });
  }
  await pressEnd();
  let seeked = null;
  for (let i = 0; i < 20; i++) {
    const td = await cdp.evalJs(`(document.querySelector(".time-display")||{}).textContent || ""`).catch(() => "");
    const parsed = parseTimeDisplay(td);
    seeked = parsed.playhead;
    if (parsed.playhead !== null && parsed.duration !== null && parsed.playhead >= parsed.duration - 0.05) break;
    await sleep(500);
  }
  record("e2e-seek-end", seeked !== null && addedDur !== null && seeked >= addedDur - 0.05,
    `sau phím End: playhead=${seeked} s, duration=${addedDur} s`);
  if (!(seeked !== null && addedDur !== null && seeked >= addedDur - 0.05)) throw new Error("seek End thất bại — dừng đo E2E");

  // ---- Phase D: phát ngược 45 s, đo frame thật ----
  const engineBefore = await cdp.evalJs(`window.__vcutReverseEngine ?? null`).catch(() => null);
  const wcBefore = await cdp.evalJs(`window.__vcutReverseWc ?? null`).catch(() => null);
  const holdBefore = await cdp.evalJs(`window.__vcutHoldStats ?? null`).catch(() => null);
  console.log(`trước phát ngược: engine=${engineBefore}, __vcutReverseWc=${JSON.stringify(wcBefore)}, __vcutHoldStats=${JSON.stringify(holdBefore)}`);
  // Baseline heap: gc rồi đo (JS heap + RSS cây Chrome) TRƯỚC khi bấm
  // Phát ngược — để đỉnh heap sau đó có mốc so (delta mới có nghĩa).
  await gcNow(cdp);
  await sleep(1000);
  const heapBase = await heapNow(cdp);
  const rssBase = chromeTreeRssMB();
  console.log(`heap baseline (sau gc, trước phát ngược): usedJSHeap=${heapBase.used === null ? "null" : (heapBase.used / 1048576).toFixed(2) + " MiB"}, totalJSHeap=${heapBase.total === null ? "null" : (heapBase.total / 1048576).toFixed(2) + " MiB"}, window.gc=${heapBase.gc}, RSS cây Chrome=${rssBase} MiB`);
  await cdp.evalJs(`document.querySelector('[aria-label="Phát ngược"]').click()`);
  const OBS_MS = 30000;
  const SAMPLE_MS = 500;
  const samples = [];
  const tObs0 = Date.now();
  // Hàm lấy mẫu trong page: playhead + wc + hold + pixel canvas.
  const sampleExpr = `(() => {
    const td = (document.querySelector(".time-display")||{}).textContent || "";
    const m = td.split("/");
    const parse = (s) => { const p = (s||"").trim().split(":").map(Number); if (p.some((n) => !Number.isFinite(n))) return null; let t = 0; for (const n of p) t = t * 60 + n; return t; };
    const c = document.querySelector(".preview-canvas");
    let canvas = null;
    if (c && c.width > 0 && c.height > 0) {
      try {
        const off = document.createElement("canvas"); off.width = 32; off.height = 18;
        const ctx = off.getContext("2d"); ctx.drawImage(c, 0, 0, 32, 18);
        const d = ctx.getImageData(0, 0, 32, 18).data;
        let sum = 0, sum2 = 0, cnt = 0, hash = 2166136261 >>> 0;
        for (let i = 0; i < d.length; i += 16) { const v = d[i]; sum += v; sum2 += v * v; cnt++; hash ^= v; hash = Math.imul(hash, 16777619) >>> 0; }
        const mean = sum / cnt; const variance = sum2 / cnt - mean * mean;
        canvas = { hash, mean: +mean.toFixed(2), stddev: +Math.sqrt(Math.max(0, variance)).toFixed(2), w: c.width, h: c.height };
      } catch (e) { canvas = { error: String(e).slice(0, 120) }; }
    }
    return { playhead: parse(m[0]), duration: parse(m[1]),
      wc: window.__vcutReverseWc ?? null, hold: window.__vcutHoldStats ?? null,
      engine: window.__vcutReverseEngine ?? null, canvas };
  })()`;
  const heapSamples = [];
  while (Date.now() - tObs0 < OBS_MS) {
    const s = await cdp.evalJs(sampleExpr).catch(() => null);
    if (s) samples.push({ at: +(Date.now() - tObs0) / 1000, ...s });
    const h = await heapNow(cdp);
    heapSamples.push({ at: +(Date.now() - tObs0) / 1000, used: h.used, rss: chromeTreeRssMB() });
    await sleep(SAMPLE_MS);
  }
  // Dừng phát ngược (bấm lại nút: đang phát ngược thì chỉ tạm dừng).
  await cdp.evalJs(`document.querySelector('[aria-label="Phát ngược"]').click()`).catch(() => null);
  await sleep(500);
  // ROUND49-E2 chẩn đoán: đọc trực tiếp controller trong app qua vite
  // module (cùng instance với app — vite dev dedupe theo URL) + video
  // element src. Ghi rõ trạng thái nội bộ để biết GOP không bật vì
  // wiring, vì controller, hay vì decode.
  if (process.env.E2_DIAG === "1") {
    const diag = await cdp.evalJs(`(async () => {
      const m = await import("/src/lib/reverseWebcodecs.ts");
      const vids = [...document.querySelectorAll("video")].map((v) => v.src);
      const out = { videos: vids.map((s) => s.slice(0, 60)), controllers: [] };
      for (const src of vids) {
        try {
          const c = m.getReversePreviewController(src);
          out.controllers.push({ url: src.slice(0, 60),
            gopMode: c.gopMode, gopFallbackReason: c.gopFallbackReason,
            ready: c.ready, failed: c.failed, cacheSize: c.cacheSize,
            retainedFileBytes: c.retainedFileBytes, gopSizeProbe: c.gopSizeProbe,
            largeFileFallback: c.largeFileFallback,
            _gopEnabled: c.gopEnabled, _gopAttempted: c.gopAttempted,
            _gopActive: c.gopActive, _knownFileSize: c.knownFileSize,
            _unsupported: c.unsupported, _disposed: c.disposed,
            _track: c.track ? { samples: c.track.samples.length } : null,
            _decodePromisePending: c.decodePromise !== null,
            _largeFile: c.largeFile, _loadPromisePending: c.loadPromise !== null });
        } catch (e) { out.controllers.push({ url: src.slice(0, 60), error: String(e).slice(0, 200) }); }
      }
      return out;
    })()`).catch((e) => ({ error: String(e).slice(0, 300) }));
    console.log("DIAG controllers: " + JSON.stringify(diag, null, 2));
  }
  await gcNow(cdp);
  await sleep(1000);
  const heapSettled = await heapNow(cdp);
  const rssSettled = chromeTreeRssMB();
  const resEntries = await cdp.evalJs(`performance.getEntriesByType("resource").filter((e) => e.name.startsWith("blob:")).map((e) => ({ initiator: e.initiatorType, transfer: e.transferSize, encoded: e.encodedBodySize, decoded: e.decodedBodySize }))`).catch(() => []);
  console.log(`heap settled (sau gc, sau khi dừng): usedJSHeap=${heapSettled.used === null ? "null" : (heapSettled.used / 1048576).toFixed(2) + " MiB"}, RSS cây Chrome=${rssSettled} MiB`);
  console.log(`CDP Network blob: requests=${netBlobReqs.length} (mẫu: ${JSON.stringify(netBlobReqs.slice(0, 5))}); resource-timing blob: entries=${resEntries.length} ${JSON.stringify(resEntries.slice(0, 5))}`);
  const wcAfter = await cdp.evalJs(`window.__vcutReverseWc ?? null`).catch(() => null);
  const holdAfter = await cdp.evalJs(`window.__vcutHoldStats ?? null`).catch(() => null);
  const firstPh = samples.find((s) => s.playhead !== null)?.playhead ?? null;
  const lastPh = [...samples].reverse().find((s) => s.playhead !== null)?.playhead ?? null;
  const movedBack = firstPh !== null && lastPh !== null ? firstPh - lastPh : null;
  const gopSeen = samples.some((s) => s.wc && s.wc.gopActive === true);
  const gopReasons = wcAfter?.gopFallbackReasons ?? [];
  const hitsDelta = (wcAfter?.hits ?? 0) - (wcBefore?.hits ?? 0);
  const missDelta = (wcAfter?.misses ?? 0) - (wcBefore?.misses ?? 0);
  const fetchDelta = (wcAfter?.controllerFetches ?? 0) - (wcBefore?.controllerFetches ?? 0);
  const distinctHashes = new Set(samples.filter((s) => s.canvas && typeof s.canvas.hash === "number" && (s.canvas.mean > 2 || s.canvas.stddev > 1)).map((s) => s.canvas.hash));
  const blankSamples = samples.filter((s) => s.canvas && typeof s.canvas.mean === "number" && s.canvas.mean <= 2 && s.canvas.stddev <= 1).length;
  const drawDelta = (holdAfter?.draw ?? 0) - (holdBefore?.draw ?? 0);
  const holdDelta = (holdAfter?.hold ?? 0) - (holdBefore?.hold ?? 0);
  const skipDelta = (holdAfter?.skip ?? 0) - (holdBefore?.skip ?? 0);
  console.log(`quan sát ${samples.length} mẫu / ${(OBS_MS / 1000).toFixed(0)} s: playhead ${firstPh} → ${lastPh} s (lùi ${movedBack} s); wc hits +${hitsDelta} misses +${missDelta} fetches +${fetchDelta}; hold draw +${drawDelta} hold +${holdDelta} skip +${skipDelta}; canvas distinct=${distinctHashes.size} mẫu đen=${blankSamples}; gopActive từng thấy=${gopSeen}; gopFallbackReasons=${JSON.stringify(gopReasons)}`);
  const heapUsed = heapSamples.map((x) => x.used).filter((v) => typeof v === "number");
  const heapPeak = heapUsed.length ? Math.max(...heapUsed) : null;
  const heapPeakAt = heapUsed.length ? heapSamples[heapUsed.indexOf(heapPeak)].at : null;
  const rssPeak = Math.max(...heapSamples.map((x) => x.rss).filter((v) => typeof v === "number"));
  const toMiB = (v) => v === null ? "null" : (v / 1048576).toFixed(2) + " MiB";
  console.log(`HEAP mode=${MODE}: baseline used=${toMiB(heapBase.used)} (RSS ${rssBase} MiB) → PEAK used=${toMiB(heapPeak)} lúc t=${heapPeakAt}s (RSS đỉnh ${rssPeak} MiB, delta RSS vs baseline=${rssBase === null || rssPeak === -Infinity ? "null" : (rssPeak - rssBase).toFixed(2) + " MiB"}) → settled used=${toMiB(heapSettled.used)} (RSS ${rssSettled} MiB); delta peak-baseline=${heapBase.used === null || heapPeak === null ? "null" : ((heapPeak - heapBase.used) / 1048576).toFixed(2) + " MiB"}; file=${(fileSize / 1048576).toFixed(2)} MiB`);
  console.log(`mẫu canvas đầu/cuối: ${JSON.stringify(samples.filter((s) => s.canvas).slice(0, 3).map((s) => [s.at, s.canvas]))} … ${JSON.stringify(samples.filter((s) => s.canvas).slice(-3).map((s) => [s.at, s.canvas]))}`);

  record("e2e-reverse-starts", movedBack !== null && movedBack >= 1,
    `playhead lùi ${movedBack} s trong ${OBS_MS / 1000} s quan sát (${firstPh} → ${lastPh} s; engine trong lúc chạy=${samples.find((s) => s.engine)?.engine ?? engineBefore})`);
  if (MODE === "gop") {
    record("e2e-gop-active", gopSeen && gopReasons.length === 0,
      `gopActive từng thấy=${gopSeen}, gopFallbackReasons=${JSON.stringify(gopReasons)} (đường GOP Range trên blob: URL gốc trong app thật)`);
  } else {
    // mode=fallback: toggle TẮT khiến resolveReverseEngine() = "element"
    // nên preview KHÔNG gọi frameAt/controller — gopActive=false và
    // gopFallbackReasons=[] là đúng (không có controller nào được tạo
    // để mà fallback); đường phát ngược lúc này là element-seek thuần.
    record("e2e-fallback-expected", !gopSeen,
      `mode=fallback: gopActive từng thấy=${gopSeen} (kỳ vọng false), gopFallbackReasons=${JSON.stringify(gopReasons)} (toggle TẮT → engine=element, không tạo controller — xem §4 LIMITS)`);
  }
  const blobGetsNoRange = netBlobReqs.filter((r) => r.method === "GET" && !r.range);
  const blobGetsWithRange = netBlobReqs.filter((r) => r.method === "GET" && r.range);
  const bigResEntry = resEntries.filter((e) => typeof e.encoded === "number" && e.encoded >= fileSize * 0.9);
  record("e2e-no-full-file-get", MODE === "fallback" ? true :
    (netBlobReqs.length > 0 ? blobGetsNoRange.length === 0 && blobGetsWithRange.length > 0 : bigResEntry.length === 0),
    MODE === "fallback" ? `mode=fallback: đường cũ tải toàn file là hành vi kỳ vọng (không áp cổng này); Network blob: GET có Range=${blobGetsWithRange.length}, GET không Range=${blobGetsNoRange.length}` :
    (netBlobReqs.length > 0 ? `CDP Network thấy ${netBlobReqs.length} request blob:: GET có Range=${blobGetsWithRange.length}, GET không Range=${blobGetsNoRange.length} (kỳ vọng 0)` :
    `CDP Network không thấy request blob: nào (Chrome không log fetch blob: qua Network); resource-timing blob: entries=${resEntries.length}, entry ≥90% file=${bigResEntry.length} (kỳ vọng 0)`));
  record("e2e-heap-measured", heapPeak !== null && heapBase.used !== null,
    `mode=${MODE}: heap peak used=${toMiB(heapPeak)} (delta vs baseline=${heapBase.used === null || heapPeak === null ? "null" : ((heapPeak - heapBase.used) / 1048576).toFixed(2) + " MiB"})}, settled=${toMiB(heapSettled.used)}, RSS đỉnh=${rssPeak} MiB (delta=${rssBase === null ? "null" : (rssPeak - rssBase).toFixed(2) + " MiB"}); file ${(fileSize / 1048576).toFixed(2)} MiB`);
  if (MODE === "gop") {
    record("e2e-wc-frames", hitsDelta >= 10,
      `window.__vcutReverseWc.hits tăng +${hitsDelta} (misses +${missDelta}, controller fetches +${fetchDelta}) trong lúc phát ngược — frame thật do WebCodecs decode trả`);
  } else {
    // mode=fallback: engine=element nên không có frame WebCodecs nào
    // theo thiết kế (hits/misses phải = 0); frame thật chứng minh bằng
    // cổng e2e-canvas-frames (element-seek).
    record("e2e-wc-frames", hitsDelta === 0 && missDelta === 0,
      `mode=fallback: engine=element → wc hits +${hitsDelta} misses +${missDelta} (kỳ vọng 0/0 — không dùng WebCodecs)`);
  }
  record("e2e-canvas-frames", distinctHashes.size >= 5,
    `${distinctHashes.size} frame canvas KHÁC NHAU (hash pixel downscale 32×18, mean>2 hoặc stddev>1) trong lúc playhead lùi; mẫu đen (mean≤2 & stddev≤1)=${blankSamples}/${samples.length}; draw +${drawDelta} / hold +${holdDelta} / skip +${skipDelta}`);
  record("e2e-no-page-errors", pageErrors.length === 0,
    pageErrors.length === 0 ? "0 uncaught exception trong toàn bộ chạy (console error riêng: " + consoleErrors.length + ")" : `uncaught exceptions: ${JSON.stringify(pageErrors.slice(0, 3))}`);
  if (consoleErrors.length > 0) console.log(`console errors (${consoleErrors.length}): ${JSON.stringify(consoleErrors.slice(0, 5))}`);
} catch (e) {
  console.error(`HARNESS ERROR: ${(e && e.message) || e}`);
  exitCode = 1;
} finally {
  try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (bridge) bridge.kill("SIGKILL"); } catch { /* bỏ qua */ }
  try { if (vite) vite.kill("SIGKILL"); } catch { /* bỏ qua */ }
  await sleep(500);
}
const failed = results.filter((r) => !r.ok);
console.log(`\nE2 headed E2E (mode=${MODE}): ${results.length - failed.length}/${results.length} cổng pass`);
if (failed.length > 0) {
  for (const f of failed) console.log(`  FAIL: ${f.name} — ${f.detail}`);
  process.exit(1);
}
process.exit(exitCode);
