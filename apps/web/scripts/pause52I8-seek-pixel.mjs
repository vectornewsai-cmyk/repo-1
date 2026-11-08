// pause52I8-seek-pixel.mjs — Phase 9 đợt 52, luồng I8:
// fail-fast/quirk — đo pixel landing-0 đủ mẫu + nhân quả seekable.
// Nối nợ đợt 51 H3 (docs/PHASE9_ROUND51_H3_FAILFAST_QUIRK_LIMITS.md
// §2.3, §4.3; docs/PHASE9_ROUND51_LIMITS.md §2.3, §4.3):
//   (1) Pixel của một lần landing-0 THẬT: H3 chỉ có 3 probe pixel
//       nolength đều đáp đúng (0/3 trúng landing-0). Lượt này chạy
//       >=10 probe pixel headed qua server không Content-Length:
//       landing-0 có đáp đúng frame 0.0 (hash d4828fc3) hay frame
//       sai? Ghi tỉ lệ đáp đúng/sai thật.
//   (2) "155 + http chunked" (H3 §3.2 chưa đo trực tiếp): chạy
//       binary meta-chromium 155.0.8059.91 (/opt/meta-chromium)
//       TRỰC TIẾP với server HTTP chunked (không Content-Length),
//       seek trên broken-gap.mp4, ghi hành vi thật. H3 chỉ đo 155
//       qua data: URL (fully-buffered, không phải http chunked).
//       Nếu 155 chặn navigation loopback (D3 §4.2) thì thử một lần
//       với cờ --disable-features=BlockInsecurePrivateNetworkRequests
//       (cờ launch của instance mình, KHÔNG sửa policy hệ thống);
//       nếu vẫn chặn thì ghi NOT_MEASURED + lỗi chính xác, không
//       mạo nhận.
//   (3) Nhân quả seekable=[0,0]: H3 mới có tương quan 6/6. Lượt
//       này can thiệp ở mức hành vi (không đọc code Chrome):
//       - Đối chứng: cùng file qua server CÓ Content-Length vs
//         KHÔNG — ghi seekable + landing mỗi bên.
//       - Can thiệp chờ: đợi tới khi seekable=[0,3] rồi mới seek
//         (arm W) — nếu landing-0 biến mất thì ủng hộ nhân quả.
//       - Liều-đáp ứng: seek ngay tại loadedmetadata (arm E,
//         seekable càng chưa xác định) — nếu tỉ lệ landing-0 tăng
//         thì ủng hộ nhân quả.
//       Nếu các can thiệp không phân biệt được thì kết luận vẫn chỉ
//       là tương quan — ghi rõ, không mạo nhận nhân quả.
//   (4) Kết luận có nên thêm kiểm tra pixel vào đường seek không:
//       H3 kết luận KHÔNG — chỉ đổi nếu bằng chứng mới đủ mạnh.
// Fixture: valid-gop.mp4 / broken-gap.mp4 copy từ scratch H3
// (md5 đã verify khớp H3 §1); hash ref frame 0.0 = d4828fc3,
// frame 2.5 = 8a8a7fa5 (H3 §4.1 — đo lại đối chứng trong lượt).
// Scratch + log ở ~/workspace/tmp-round52-i8-seek-pixel/ (KHÔNG
// /tmp — bài học đợt 51 §4.10, /tmp bị dọn giữa các lượt).
// Chạy từ gốc repo:
//   node apps/web/scripts/pause52I8-seek-pixel.mjs 2>&1 | tee ~/workspace/tmp-round52-i8-seek-pixel/run1.log
// Exit 0 khi mọi probe done (landing sai là OBSERVED, không phải
// FAIL); exit 1 khi đối chứng hỏng; exit 2 khi harness lỗi.

import { spawn, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const CHROME156 = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META155 = "/opt/meta-chromium/chrome";
const H3_SCRATCH = path.join(os.homedir(), "workspace", "tmp-round51-h3-quirk");
const SCRATCH = process.env.I8_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round52-i8-seek-pixel");
const PORT156 = parseInt(process.env.I8_PORT156 || "9251", 10);
const PORT155 = parseInt(process.env.I8_PORT155 || "9254", 10);
const N = parseInt(process.env.I8_N || "10", 10);
const ONLY = process.env.I8_ONLY || null;
const SKIP155 = process.env.I8_SKIP155 === "1";
// Hash ref đã kiểm chứng ở lượt 1 (khớp H3 §4.1): frame 0.0 =
// d4828fc3, frame 2.5 = 8a8a7fa5. Dùng làm hằng số phân loại pixel
// trong summarize() để lượt chạy bù (không có ref) vẫn phân loại
// đúng; CONTROL đo lại ref khi chạy đủ bộ.
const REF0_HASH = "d4828fc3";
const REF25_HASH = "8a8a7fa5";
// I8_ARMS: danh sách prefix arm 156 cần chạy, cách nhau bằng dấu phẩy
// (để chạy bù sau khi VM restart giữa chừng); null = chạy đủ bộ.
// Chỉ áp cho arm 156 — arm 155 luôn chạy đủ (applyArmsFilter=false
// trước lượt 155).
const ARMS = process.env.I8_ARMS ? process.env.I8_ARMS.split(",").map((s) => s.trim()).filter(Boolean) : null;
let applyArmsFilter = true;

const MD5 = { "valid-gop.mp4": "2c2e4771954fd26e1c377ce5900e377d", "broken-gap.mp4": "f0e11b602e714246466f6936e58afcd1" };

function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync("/tmp/.X11-unix/X" + n)) return ":" + n;
  }
  return null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log("[" + stamp() + "]", ...a); }
function fail(msg) { console.error("BLOCKER: " + msg); process.exit(2); }

// ---------- fixture ----------
fs.mkdirSync(SCRATCH, { recursive: true });
for (const [f, md5] of Object.entries(MD5)) {
  const dst = path.join(SCRATCH, f);
  if (!fs.existsSync(dst)) {
    fs.copyFileSync(path.join(H3_SCRATCH, f), dst);
    log("copy fixture " + f + " từ scratch H3");
  }
  const got = crypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
  if (got !== md5) fail("md5 fixture " + f + " sai: " + got + " != " + md5);
}
log("fixture md5 khớp H3 §1: valid-gop + broken-gap");

// ---------- trang probe pixel ----------
const PAGE = "<!doctype html><meta charset=\"utf-8\"><title>I8 pixel probe</title><body>\n"
  + "<script>\n"
  + "window.__px = { done: false, events: [] };\n"
  + "var q = new URLSearchParams(location.search);\n"
  + "var f = q.get('f'); var t = parseFloat(q.get('t') || '2.5');\n"
  + "var base = q.get('base') === 'nolength' ? '/media-nolength/' : '/media/';\n"
  + "var mode = q.get('mode') || 'std';\n"
  + "window.__px.file = f; window.__px.target = t; window.__px.base = base; window.__px.mode = mode;\n"
  + "function ranges(tr) { var a = []; for (var i = 0; i < tr.length; i++) a.push([+tr.start(i).toFixed(3), +tr.end(i).toFixed(3)]); return a; }\n"
  + "function snap() { return { seeking: v.seeking, readyState: v.readyState, currentTime: +v.currentTime.toFixed(3), buffered: ranges(v.buffered), seekable: ranges(v.seekable) }; }\n"
  + "function drawNow() {\n"
  + "  try {\n"
  + "    var c = document.createElement('canvas'); c.width = 160; c.height = 90;\n"
  + "    var ctx = c.getContext('2d');\n"
  + "    ctx.drawImage(v, 0, 0, 160, 90);\n"
  + "    var d = ctx.getImageData(0, 0, 160, 90).data;\n"
  + "    var h = 2166136261 >>> 0; var r = 0, g = 0, b = 0, n = 0;\n"
  + "    for (var i = 0; i < d.length; i += 64) {\n"
  + "      h ^= d[i]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "      h ^= d[i + 1]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "      h ^= d[i + 2]; h = Math.imul(h, 16777619) >>> 0;\n"
  + "      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;\n"
  + "    }\n"
  + "    window.__px.hash = ('0000000' + h.toString(16)).slice(-8);\n"
  + "    window.__px.mean = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];\n"
  + "    window.__px.videoW = v.videoWidth; window.__px.videoH = v.videoHeight;\n"
  + "  } catch (e) { window.__px.drawError = String(e && e.message ? e.message : e); }\n"
  + "}\n"
  + "var v = document.createElement('video');\n"
  + "v.preload = 'auto'; v.muted = true; v.crossOrigin = 'anonymous';\n"
  + "var seekDone = false;\n"
  + "function doSeek() {\n"
  + "  if (seekDone) return; seekDone = true;\n"
  + "  window.__px.preSeek = snap();\n"
  + "  try { v.currentTime = t; } catch (e) { window.__px.setThrew = String(e && e.name); window.__px.done = true; }\n"
  + "}\n"
  + "v.addEventListener('loadedmetadata', function () {\n"
  + "  window.__px.events.push('loadedmetadata');\n"
  + "  window.__px.atMeta = snap();\n"
  + "  if (mode === 'immediate') { doSeek(); return; }\n"
  + "  if (mode === 'wait') {\n"
  + "    var t0 = Date.now();\n"
  + "    var iv = setInterval(function () {\n"
  + "      var s = v.seekable;\n"
  + "      var end = s.length ? +s.end(s.length - 1).toFixed(3) : 0;\n"
  + "      if (end >= 2.9 || Date.now() - t0 > 12000) {\n"
  + "        clearInterval(iv);\n"
  + "        window.__px.waitMs = Date.now() - t0;\n"
  + "        window.__px.waitTimedOut = end < 2.9;\n"
  + "        window.__px.seekableAtWaitEnd = ranges(v.seekable);\n"
  + "        doSeek();\n"
  + "      }\n"
  + "    }, 100);\n"
  + "    return;\n"
  + "  }\n"
  + "  setTimeout(doSeek, 3000);\n"
  + "});\n"
  + "v.addEventListener('seeking', function () { window.__px.events.push('seeking@' + v.currentTime.toFixed(3)); });\n"
  + "v.addEventListener('seeked', function () {\n"
  + "  window.__px.events.push('seeked@' + v.currentTime.toFixed(3));\n"
  + "  window.__px.atSeeked = +v.currentTime.toFixed(3);\n"
  + "  setTimeout(function () { drawNow(); window.__px.atDraw = snap(); window.__px.done = true; }, 500);\n"
  + "});\n"
  + "v.addEventListener('error', function () { var e = v.error; window.__px.error = e ? e.code : null; window.__px.errorMsg = e ? e.message : null; window.__px.events.push('error'); window.__px.done = true; });\n"
  + "v.src = base + f;\n"
  + "document.body.appendChild(v);\n"
  + "setTimeout(function () { if (!window.__px.done) { window.__px.timeout = true; window.__px.done = true; } }, 25000);\n"
  + "</script>\n";
fs.writeFileSync(path.join(SCRATCH, "pixel.html"), PAGE);

// ---------- policy file cho meta-chromium 155 (theo H3 meta155) ----------
function buildPolicy() {
  const content = Buffer.from("hatch-webgl-all-origins-v1\n", "utf8");
  const file = path.join(SCRATCH, "webgl-policy.txt");
  fs.writeFileSync(file, content);
  const sha = crypto.createHash("sha256").update(content).digest("hex");
  const out = execFileSync(META155, ["--hatch-validate-webgl-allowed-domains", "--hatch-webgl-allowed-domains-file=" + file, "--hatch-webgl-allowed-domains-sha256=" + sha, "--version"], { encoding: "utf8", timeout: 30000 });
  log("validator 155: " + JSON.stringify(out.slice(0, 200)));
  return { file, sha };
}

class TabCdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      let d; try { d = JSON.parse(m.data); } catch { return; }
      if (d.id && this.pending.has(d.id)) {
        const { res, rej } = this.pending.get(d.id); this.pending.delete(d.id);
        if (d.error) rej(new Error(JSON.stringify(d.error))); else res(d.result);
      }
    };
  }
  send(method, params = {}, timeoutMs = 30000) {
    const id = this.nextId++;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { this.pending.delete(id); rej(new Error("CDP timeout " + method)); }, timeoutMs);
      this.pending.set(id, { res: (v) => { clearTimeout(timer); res(v); }, rej: (e) => { clearTimeout(timer); rej(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result?.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

async function runProbe(port, origin, query, timeoutMs = 60000) {
  const target = await (await fetch("http://127.0.0.1:" + port + "/json/new", { method: "PUT" })).json();
  if (!target || !target.webSocketDebuggerUrl) throw new Error("json/new không trả webSocketDebuggerUrl: " + JSON.stringify(target).slice(0, 300));
  const cdp = new TabCdp(target.webSocketDebuggerUrl);
  try {
    await cdp.ready;
    await cdp.send("Runtime.enable", {});
    await cdp.send("Page.enable", {});
    const nav = await cdp.send("Page.navigate", { url: origin + "/pixel.html" + query }, 30000);
    if (nav && nav.errorText) throw new Error("Page.navigate errorText: " + nav.errorText);
    await cdp.send("Page.bringToFront", {}).catch(() => {});
    let result = null;
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      await sleep(500);
      result = await cdp.evaluate("window.__px").catch(() => null);
      if (result && result.done) break;
    }
    if (!result || !result.done) throw new Error("probe không done sau " + timeoutMs + " ms: " + JSON.stringify(result)?.slice(0, 300));
    return result;
  } finally {
    cdp.close();
    try { await fetch("http://127.0.0.1:" + port + "/json/close/" + target.id); } catch {}
  }
}

async function startChrome(binary, port, extraFlags = [], expectedVersion = null) {
  const display = pickFreeDisplay();
  if (!display) throw new Error("không còn display trống trong :90-:99");
  const num = display.replace(":", "");
  const sock = "/tmp/.X11-unix/X" + num;
  const xvfb = spawn("Xvfb", [display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
  for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
  if (!fs.existsSync(sock)) throw new Error("Xvfb không tạo socket " + display);
  const profileDir = path.join(SCRATCH, "chrome-profile-" + port + "-" + process.pid);
  const flags = ["--no-sandbox", "--remote-debugging-port=" + port, "--remote-debugging-address=127.0.0.1",
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--force-device-scale-factor=1", "--autoplay-policy=no-user-gesture-required",
    "--user-data-dir=" + profileDir, "--window-size=1280,800", "--window-position=0,0", ...extraFlags, "about:blank"];
  log("khởi động " + binary + " port " + port + " display " + display);
  const chrome = spawn(binary, flags, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DISPLAY: display } });
  let errBuf = "";
  chrome.stderr?.on("data", (d) => { errBuf += d.toString(); });
  chrome.stdout?.on("data", () => {});
  let version = null;
  for (let i = 0; i < 60 && !version; i++) {
    await sleep(500);
    try { const r = await fetch("http://127.0.0.1:" + port + "/json/version"); if (r.ok) version = await r.json(); } catch {}
  }
  const killAll = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb.kill("SIGTERM"); } catch {} };
  if (!version) {
    killAll();
    throw new Error("Chrome không mở được DevTools port " + port + " sau 30 s; stderr cuối: " + errBuf.slice(-800));
  }
  if (expectedVersion && !String(version.Browser || "").includes(expectedVersion)) {
    killAll();
    throw new Error("port " + port + " trả version KHÔNG khớp binary kỳ vọng (" + version.Browser + " != *" + expectedVersion + "*) — cổng đang bị Chrome khác giữ");
  }
  log("Chrome DevTools: " + version.Browser);
  return { chrome, xvfb, version, profileDir };
}
async function startChromeRetry(binary, ports, extraFlags, expectedVersion) {
  let lastErr = null;
  for (const port of ports) {
    try {
      const h = await startChrome(binary, port, extraFlags, expectedVersion);
      return { handle: h, port };
    } catch (e) {
      lastErr = e;
      log("khởi động port " + port + " lỗi: " + String(e && e.message ? e.message : e) + " — thử cổng khác");
      await sleep(1000);
    }
  }
  throw lastErr;
}
function stopChrome(h) {
  try { h.chrome?.kill("SIGKILL"); } catch {}
  try { h.xvfb?.kill("SIGTERM"); } catch {}
  try { if (h.profileDir) fs.rmSync(h.profileDir, { recursive: true, force: true }); } catch {}
}

async function main() {
  if (!fs.existsSync(CHROME156)) fail("không có chrome " + CHROME156);
  if (!SKIP155 && !fs.existsSync(META155)) fail("không có binary " + META155);

  // Server: /media/ CÓ Content-Length; /media-nolength/ KHÔNG
  // (Node tự dùng Transfer-Encoding: chunked khi pipe mà không
  // đặt Content-Length — đúng kiểu serve43 của Y2). Range header
  // được bỏ qua như H3 (trả 200 toàn file) để giữ biến server
  // duy nhất là Content-Length.
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file;
    let noLength = false;
    if (url.pathname.startsWith("/media-nolength/")) { file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(16))); noLength = true; }
    else if (url.pathname.startsWith("/media/")) file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(7)));
    else file = path.join(SCRATCH, decodeURIComponent(url.pathname.slice(1)) === "" ? "pixel.html" : decodeURIComponent(url.pathname.slice(1)));
    if (!file.startsWith(SCRATCH) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const type = file.endsWith(".mp4") ? "video/mp4" : "text/html";
    const size = fs.statSync(file).size;
    if (noLength) res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes" });
    else res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const HOST = process.env.I8_HOST || "127.0.0.1";
  const ORIGIN = "http://" + HOST + ":" + server.address().port;
  log("scratch server tại " + ORIGIN + " (media CÓ Length, media-nolength chunked)");

  const results = {};
  const runArm = async (port, prefix, f, t, base, mode, count) => {
    if (ARMS && applyArmsFilter && !ARMS.includes(prefix)) { log("bỏ qua arm " + prefix + " (I8_ARMS)"); return; }
    for (let i = 1; i <= count; i++) {
      const key = prefix + "-run" + i;
      if (ONLY && !key.includes(ONLY) && !prefix.includes(ONLY)) continue;
      try {
        const r = await runProbe(port, ORIGIN, `?f=${f}&t=${t}&base=${base}&mode=${mode}`);
        results[key] = r;
        log(`PROBE ${key}: atSeeked=${r.atSeeked ?? null} hash=${r.hash ?? null} mean=${JSON.stringify(r.mean ?? null)} preSeekable=${JSON.stringify(r.preSeek?.seekable ?? null)} preBuffered=${JSON.stringify(r.preSeek?.buffered ?? null)} atDrawSeekable=${JSON.stringify(r.atDraw?.seekable ?? null)} waitMs=${r.waitMs ?? null} waitTO=${r.waitTimedOut ?? null} err=${r.error ?? r.drawError ?? r.setThrew ?? r.timeout ?? null} events=${JSON.stringify(r.events ?? null)}`);
      } catch (e) {
        results[key] = { error: String(e && e.message ? e.message : e) };
        log(`PROBE ${key} ERROR: ${results[key].error}`);
      }
    }
  };

  // ---------- LƯỢT 156 ----------
  let c156 = null; let c156Port = null;
  try {
    const started = await startChromeRetry(CHROME156, [PORT156, PORT156 + 10, PORT156 + 20], [], "156.0.8078.4");
    c156 = started.handle; c156Port = started.port;
    // Refs (đối chứng phương pháp, length-server, std).
    await runArm(c156Port, "R-valid-0.0", "valid-gop.mp4", 0.0, "length", "std", 1);
    await runArm(c156Port, "R-valid-2.5", "valid-gop.mp4", 2.5, "length", "std", 1);
    // Arm L: đối chứng CÓ Content-Length — kỳ vọng 0% landing-0.
    await runArm(c156Port, "L-gap-2.5-length", "broken-gap.mp4", 2.5, "length", "std", N);
    // Arm B: nolength, gap — đo pixel landing-0 (>=10 probe).
    await runArm(c156Port, "B-gap-2.5-nolength", "broken-gap.mp4", 2.5, "nolength", "std", N);
    // Arm C: nolength, valid — file lành cũng đáp 0?
    await runArm(c156Port, "C-valid-2.5-nolength", "valid-gop.mp4", 2.5, "nolength", "std", N);
    // Arm W: can thiệp chờ seekable=[0,3] rồi mới seek.
    await runArm(c156Port, "W-gap-2.5-nolength-wait", "broken-gap.mp4", 2.5, "nolength", "wait", N);
    // Arm E: liều-đáp ứng — seek ngay tại loadedmetadata.
    await runArm(c156Port, "E-gap-2.5-nolength-immediate", "broken-gap.mp4", 2.5, "nolength", "immediate", N);
  } catch (e) {
    log("LƯỢT 156 LỖI: " + String(e && e.message ? e.message : e));
    results["C156-START-ERROR"] = String(e && e.message ? e.message : e);
  } finally {
    if (c156) stopChrome(c156);
  }

  // ---------- LƯỢT 155 + http chunked (H3 chưa đo trực tiếp) ----------
  // "155" = binary meta-chromium 155.0.8059.91 + server HTTP chunked
  // (không Content-Length), seek trên file có vấn đề (broken-gap).
  if (!SKIP155) {
    applyArmsFilter = false; // arm 155 luôn chạy đủ, bất kể I8_ARMS
    const policy = buildPolicy();
    log("policy 155 file=" + policy.file + " sha256=" + policy.sha);
    const flags155 = [
      "--hatch-webgl-allowed-domains-file=" + policy.file,
      "--hatch-webgl-allowed-domains-sha256=" + policy.sha,
    ];
    // Một lượt 155: khởi động + ref + 3 arm. Trả về { started,
    // probed, blocked } — probed = số probe tới được trang (có
    // atSeeked), blocked = số probe chết vì ERR_BLOCKED_BY_LOCAL_
    // NETWORK_ACCESS_CHECKS. Lỗi probe KHÔNG ném (runArm bắt từng
    // probe) nên phải đếm từ results, không dựa vào catch.
    const run155Attempt = async (ports, extraFlags, label) => {
      let meta = null; let metaPort = null;
      try {
        const started = await startChromeRetry(META155, ports, [...flags155, ...extraFlags], "155.0.8059.91");
        meta = started.handle; metaPort = started.port;
        // Ref trên chính 155 (length-server): kiểm chứng hash frame
        // 0.0 / 2.5 có giống 156 không, trước khi phân loại pixel 155.
        await runArm(metaPort, "R155-valid-0.0", "valid-gop.mp4", 0.0, "length", "std", 1);
        await runArm(metaPort, "R155-valid-2.5", "valid-gop.mp4", 2.5, "length", "std", 1);
        await runArm(metaPort, "M155-gap-2.5-nolength", "broken-gap.mp4", 2.5, "nolength", "std", 6);
        await runArm(metaPort, "M155-gap-2.5-length", "broken-gap.mp4", 2.5, "length", "std", 3);
        await runArm(metaPort, "M155-valid-2.5-nolength", "valid-gop.mp4", 2.5, "nolength", "std", 3);
      } catch (e) {
        const note = String(e && e.message ? e.message : e);
        log("LƯỢT 155 LỖI (" + label + "): " + note);
        results["META155-START-ERROR-" + label] = note;
      } finally {
        if (meta) stopChrome(meta);
      }
      const mKeys = Object.keys(results).filter((k) => k.startsWith("M155-") || k.startsWith("R155-"));
      const probed = mKeys.filter((k) => typeof results[k]?.atSeeked === "number").length;
      const blocked = mKeys.filter((k) => String(results[k]?.error || "").includes("ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS")).length;
      log("lượt 155 " + label + ": started=" + Boolean(metaPort) + " probed=" + probed + "/" + mKeys.length + " blocked=" + blocked);
      return { started: Boolean(metaPort), probed, blocked, total: mKeys.length };
    };
    // Lượt 1: cờ chuẩn (hoặc ép cờ PNA qua env I8_155_PNA=1).
    const pnaForced = process.env.I8_155_PNA === "1";
    const a1 = await run155Attempt([PORT155, PORT155 + 10, PORT155 + 20], pnaForced ? ["--disable-features=BlockInsecurePrivateNetworkRequests"] : [], "1");
    if (pnaForced) results["META155-PNA-FLAG-USED"] = true;
    // Lượt 2: nếu lượt 1 bị chặn loopback toàn bộ (browser lên
    // được nhưng không probe nào tới được trang), thử một lần với
    // cờ tắt BlockInsecurePrivateNetworkRequests — cờ launch của
    // instance mình, không sửa policy hệ thống.
    if (a1.started && a1.probed === 0 && a1.blocked > 0 && !pnaForced) {
      log("thử lại 155 với --disable-features=BlockInsecurePrivateNetworkRequests");
      results["META155-PNA-FLAG-USED"] = true;
      await run155Attempt([PORT155 + 30, PORT155 + 40], ["--disable-features=BlockInsecurePrivateNetworkRequests"], "2");
    }
    const mKeys = Object.keys(results).filter((k) => k.startsWith("M155-"));
    const probed = mKeys.filter((k) => typeof results[k]?.atSeeked === "number").length;
    if (probed === 0) results["META155-HTTP-CHUNKED"] = "NOT_MEASURED";
  }

  // ---------- tổng hợp ----------
  const h = (k) => results[k]?.hash;
  const ref0 = h("R-valid-0.0-run1");
  const ref25 = h("R-valid-2.5-run1");
  const armKeys = (prefix) => Object.keys(results).filter((k) => k.startsWith(prefix + "-run"));
  const summarize = (prefix) => {
    const keys = armKeys(prefix);
    const landed0 = keys.filter((k) => results[k]?.atSeeked === 0);
    const landedOk = keys.filter((k) => typeof results[k]?.atSeeked === "number" && Math.abs(results[k].atSeeked - 2.5) < 0.01);
    const errored = keys.filter((k) => results[k]?.error != null || results[k]?.timeout);
    const px0 = landed0.filter((k) => results[k]?.hash === REF0_HASH);
    const pxWrong = landed0.filter((k) => results[k]?.hash && results[k]?.hash !== REF0_HASH);
    const pxOk = landedOk.filter((k) => results[k]?.hash === REF25_HASH);
    const seekable00 = keys.filter((k) => JSON.stringify(results[k]?.preSeek?.seekable) === "[[0,0]]");
    const seekableFull = keys.filter((k) => { const s = results[k]?.preSeek?.seekable; return Array.isArray(s) && s.length === 1 && s[0][0] === 0 && s[0][1] >= 2.9; });
    return {
      n: keys.length, landed0: landed0.length, landedOk: landedOk.length, errored: errored.length,
      pixelFrame0OnLanding0: px0.length, pixelOtherOnLanding0: pxWrong.length,
      pixelFrame25OnLandingOk: pxOk.length,
      preSeekable00: seekable00.length, preSeekableFull: seekableFull.length,
      landed0WithSeekable00: landed0.filter((k) => seekable00.includes(k)).length,
      landedOkWithSeekableFull: landedOk.filter((k) => seekableFull.includes(k)).length,
      detail: keys.map((k) => ({ key: k, atSeeked: results[k]?.atSeeked ?? null, hash: results[k]?.hash ?? null, preSeekable: results[k]?.preSeek?.seekable ?? null, waitMs: results[k]?.waitMs ?? null, error: results[k]?.error ?? null })),
    };
  };
  const arms = {
    L_length_gap: summarize("L-gap-2.5-length"),
    B_nolength_gap: summarize("B-gap-2.5-nolength"),
    C_nolength_valid: summarize("C-valid-2.5-nolength"),
    W_nolength_gap_wait: summarize("W-gap-2.5-nolength-wait"),
    E_nolength_gap_immediate: summarize("E-gap-2.5-nolength-immediate"),
    M155_nolength_gap: summarize("M155-gap-2.5-nolength"),
    M155_length_gap: summarize("M155-gap-2.5-length"),
    M155_nolength_valid: summarize("M155-valid-2.5-nolength"),
  };

  const checks = [];
  const check = (name, status, detail) => { checks.push({ name, status, detail }); log(status + " " + name + " " + JSON.stringify(detail ?? null).slice(0, 1200)); };
  const refsDistinct = ref0 && ref25 && ref0 !== ref25;
  const refsMeasured = Boolean(ref0 && ref25);
  check("CONTROL-ref-frames-distinct", !refsMeasured ? "SKIPPED" : refsDistinct ? "PASS" : "FAIL", { ref0, ref25 });
  check("CONTROL-ref-hash-match-H3", !refsMeasured ? "SKIPPED" : ref0 === "d4828fc3" && ref25 === "8a8a7fa5" ? "PASS" : "FAIL", { ref0, ref25, expected: { "0.0": "d4828fc3", "2.5": "8a8a7fa5" } });
  check("I8-arm-L-length", "OBSERVED", arms.L_length_gap);
  check("I8-arm-B-nolength-gap-pixel", "OBSERVED", arms.B_nolength_gap);
  check("I8-arm-C-nolength-valid-pixel", "OBSERVED", arms.C_nolength_valid);
  check("I8-arm-W-wait-seekable", "OBSERVED", arms.W_nolength_gap_wait);
  check("I8-arm-E-immediate", "OBSERVED", arms.E_nolength_gap_immediate);
  check("I8-arm-155-http-chunked", "OBSERVED", { gap: arms.M155_nolength_gap, length: arms.M155_length_gap, valid: arms.M155_nolength_valid, startErrors: { e1: results["META155-START-ERROR-1"] ?? null, e2: results["META155-START-ERROR-2"] ?? null, pnaFlag: results["META155-PNA-FLAG-USED"] ?? false, status: results["META155-HTTP-CHUNKED"] ?? "MEASURED" } });

  const RESULTS_FILE = process.env.I8_RESULTS || "i8-results.json";
  const out = { chrome156: "156.0.8078.4", meta155: "155.0.8059.91", refHashes: { "0.0": ref0, "2.5": ref25 }, arms, checks, results };
  fs.writeFileSync(path.join(SCRATCH, RESULTS_FILE), JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ checks, arms }, null, 2));
  const failed = checks.filter((c) => c.status === "FAIL").length;
  log("tổng: " + checks.length + " kiểm tra, FAIL=" + failed + " | scratch " + SCRATCH + " | results " + RESULTS_FILE);
  try { server.close(); } catch {}
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(2); });
