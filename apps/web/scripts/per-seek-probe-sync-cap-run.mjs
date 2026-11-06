#!/usr/bin/env node
/**
 * Phase 9 đợt 47, luồng C6 — đo seek qua VÒNG SYNC PREVIEW THẬT
 * (đóng nợ đợt 46 §4 mục 7: B5 chỉ gán currentTime trực tiếp lên pool
 * element, chưa đo seek do vòng sync preview tự lái).
 *
 * PHẠM VI TRUNG THỰC — ĐỌC TRƯỚC KHI TRÍCH SỐ:
 * - Seek do VÒNG SYNC PREVIEW tự lái: project có 1 clip 30 s, scrub
 *   qua timeline UI thật (.tl-ruler pointer events, mẫu B2) → store
 *   playhead đổi → preview loop request seek qua Seeker/seekAll (không
 *   gán currentTime trực tiếp từ harness). Probe per-seek v2 chỉ ĐO.
 * - Asset HTTP qua ĐƯỜNG PROXY SẢN PHẨM: MediaPool dùng proxyUrl ??
 *   url; proxyUrl được gắn bằng CÁCH BẤM NÚT "Proxy" THẬT trong
 *   MediaBin (makeProxy → POST /api/proxy → setMediaProxy) — nút bấm
 *   là UI thật, chỉ có "bridge" là server đo của harness (trả proxyUrl
 *   trỏ về file fixture nhỏ giọt/treo, KHÔNG transcode thật như
 *   bridge thật). Pool element src = URL HTTP của server đo, đi đúng
 *   nhánh src mà preview dùng cho asset HTTP.
 * - SEED DÙNG BLOB STAND-IN (ghi rõ, không giấu): asset trong IDB là
 *   file flat 45 KB (10 s) nhưng manifest/spec ghi duration 30 s,
 *   1280x720 (mô tả đúng nội dung PROXY sẽ phát — fixture noise 30 s
 *   qua HTTP). Blob này KHÔNG BAO GIỜ được phát (proxyUrl ghi đè);
 *   nó chỉ để rehydrate dựng được MediaItem + File cho nút Proxy
 *   bấm được. Lý do: nạp blob noise thật 420 MB vào IDB/ArrayBuffer
 *   giữa lúc VM chỉ còn ~250 MB RAM trống (các luồng đợt 47 khác đang
 *   chạy) sẽ OOM; mọi byte PHÁT RA đều là fixture noise thật qua HTTP
 *   nhỏ giọt/treo, mọi số seek/cap đều đo trên element đó.
 * - Server nhỏ giọt 64 KiB/s + endpoint treo: MÔ PHỎNG mạng chậm có
 *   nhật ký range (như Z5/B5), không phải mạng chậm thật. Mọi số đều
 *   under-load (chạy cùng các luồng đợt 47 khác) — cấm dùng làm
 *   baseline quiet.
 * - Probe cài bằng Page.addScriptToEvaluateOnNewDocument nên bắt MỌI
 *   seek từ tick đầu sau reload (kể cả seek settle về 0 của loop);
 *   bản probe là per-seek-probe-page.js + vá chuỗi để ghi thêm stack
 *   gọi + src lúc seek + wall time (chỉ đo, không sửa probe gốc).
 *
 * Chế độ:
 *   --mode sync   (mặc định): seed + gắn proxy drip + scrub 0.5/25/5,
 *                   gắn lại proxy hang + scrub 20; ghi evidence JSON.
 *   --mode origin: KHÔNG seed — profile mới, để loadSample chạy,
 *                   ghi lại MỌI entry k=0..n kèm stack để ghim nguồn
 *                   gốc 4 entry k=0–3 của B5 (đóng nợ đợt 46 §4 mục 7).
 *
 * Cách dùng (từ gốc repo; dist build sẵn với
 * VITE_BRIDGE_URL=http://127.0.0.1:4296):
 *   node apps/web/scripts/per-seek-probe-sync-cap-run.mjs --mode sync \
 *     --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
 *     --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
 *     --dist ~/workspace/tmp-round47-c6/app-dist \
 *     --scratch ~/workspace/tmp-round47-c6/sync1 \
 *     [--display :96] [--port 4295] [--bridge-port 4296] [--rate-kbs 64]
 * Exit 0 khi phiên chạy xong và evidence đã ghi (kể cả khi trần 1000
 * chưa chạm — chưa chạm cũng là kết quả); exit 2 khi blocker hạ tầng.
 * KHÔNG push, KHÔNG tag, KHÔNG ghi qua GitHub connector.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..", "..", "..");
const PROBE_SRC_RAW = fs.readFileSync(path.join(import.meta.dirname, "per-seek-probe-page.js"), "utf8");
const META_CHROME = "/opt/meta-chromium/chrome";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const NOISE_SIZE = 419967521; // byte, fixture sparse-gop-noise.mp4 (đo ls)

function parseArgs(argv) {
  const o = { mode: "sync", display: ":96", port: 4295, bridgePort: 4296, rateKbs: 64, hangPollSec: 45 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--mode") o.mode = argv[++i];
    else if (argv[i] === "--fixture") o.fixture = argv[++i];
    else if (argv[i] === "--flat") o.flat = argv[++i];
    else if (argv[i] === "--dist") o.dist = argv[++i];
    else if (argv[i] === "--scratch") o.scratch = argv[++i];
    else if (argv[i] === "--display") o.display = argv[++i];
    else if (argv[i] === "--port") o.port = Number(argv[++i]);
    else if (argv[i] === "--bridge-port") o.bridgePort = Number(argv[++i]);
    else if (argv[i] === "--rate-kbs") o.rateKbs = Number(argv[++i]);
  }
  return o;
}
const opts = parseArgs(process.argv.slice(2));
if (!["sync", "origin"].includes(opts.mode)) { console.error("mode phải là sync|origin"); process.exit(2); }
if (!opts.dist || !fs.existsSync(path.join(opts.dist, "index.html"))) { console.error("BLOCKER: chưa có dist (build vite với VITE_BRIDGE_URL trỏ bridge-port trước)"); process.exit(2); }
if (opts.mode === "sync" && (!opts.fixture || !opts.flat || !opts.scratch || !fs.existsSync(opts.fixture) || !fs.existsSync(opts.flat))) {
  console.error("Cách dùng: --fixture <noise.mp4> --flat <flat.mp4> --dist <app-dist> --scratch <dir>");
  process.exit(2);
}
if (opts.mode === "origin" && !opts.scratch) { console.error("origin cần --scratch"); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return null; } };
const MIME = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm" };

// ---- Vá probe page: ghi thêm stack gọi + src lúc seek + wall time ----
function patchedProbeSrc() {
  let src = PROBE_SRC_RAW;
  const anchorFn = "  function recordSeek(el, target) {";
  if (!src.includes(anchorFn)) throw new Error("không tìm thấy recordSeek trong per-seek-probe-page.js — file gốc đã đổi, dừng lại thay vì vá mù");
  src = src.replace(anchorFn,
    "  function captureStack47C6() { try { return new Error().stack.split(\"\\n\").slice(2, 8).join(\" | \"); } catch (e) { return \"\"; } }\n" + anchorFn);
  const anchorEl = "        elementId: elementIdFor(el),";
  if (!src.includes(anchorEl)) throw new Error("không tìm thấy elementId trong per-seek-probe-page.js");
  src = src.replace(anchorEl,
    "        elementId: elementIdFor(el),\n" +
    "        stack47C6: captureStack47C6(),\n" +
    "        srcAtSeek47C6: (function () { try { return el.currentSrc || el.src || null; } catch (e) { return null; } })(),\n" +
    "        wallMs47C6: Date.now(),");
  return src;
}
const PROBE_SRC = patchedProbeSrc();
const PROBE_INSTALL_SRC = PROBE_SRC + "\n;window.__c6probeInstall = window.__n2PerSeek.install({fps:30});";

// ---- HTTP: app server + fake bridge (drip/hang) ----
const rangeLog = [];
function parseRange(req, size) {
  let start = 0, end = size - 1;
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) { start = m[1] ? Number(m[1]) : size - Number(m[2]); end = m[2] ? Number(m[2]) : size - 1; }
  }
  return { start, end };
}
function serveVideoFile(file, req, res, mode) {
  const size = fs.statSync(file).size;
  const { start, end } = parseRange(req, size);
  const total = end - start + 1;
  const rec = { t: stamp(), file: path.basename(file), range: `${start}-${end}`, total, mode, bytesSent: 0 };
  rangeLog.push(rec);
  const cors = { "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes", "Cache-Control": "no-store" };
  if (mode === "hang") {
    const ONE_MIB = 1024 * 1024;
    if (start < ONE_MIB) {
      const serveEnd = Math.min(end, ONE_MIB - 1);
      const serveTotal = serveEnd - start + 1;
      res.writeHead(206, { "Content-Type": "video/mp4", ...cors, "Content-Length": serveTotal, "Content-Range": `bytes ${start}-${serveEnd}/${size}` });
      const s = fs.createReadStream(file, { start, end: serveEnd });
      s.on("data", (c) => { rec.bytesSent += c.length; });
      s.pipe(res);
      return;
    }
    if (start >= size - ONE_MIB) {
      res.writeHead(206, { "Content-Type": "video/mp4", ...cors, "Content-Length": total, "Content-Range": `bytes ${start}-${end}/${size}` });
      const s = fs.createReadStream(file, { start, end });
      s.on("data", (c) => { rec.bytesSent += c.length; });
      s.pipe(res);
      return;
    }
    res.writeHead(206, { "Content-Type": "video/mp4", ...cors, "Content-Length": total, "Content-Range": `bytes ${start}-${end}/${size}` });
    req.on("close", () => { try { res.end(); } catch {} });
    return;
  }
  res.writeHead(req.headers.range ? 206 : 200, {
    "Content-Type": "video/mp4", ...cors,
    "Content-Length": total, "Content-Range": `bytes ${start}-${end}/${size}`,
  });
  if (mode === "fast" || total <= 256 * 1024) {
    const s = fs.createReadStream(file, { start, end });
    s.on("data", (c) => { rec.bytesSent += c.length; });
    s.pipe(res);
    return;
  }
  const rateBytesPerSec = opts.rateKbs * 1024;
  const CHUNK = 64 * 1024;
  const stream = fs.createReadStream(file, { start, end, highWaterMark: CHUNK });
  const intervalMs = Math.max(1, Math.round((CHUNK / rateBytesPerSec) * 1000));
  let paused = false;
  const timer = setInterval(() => {
    if (paused) return;
    const chunk = stream.read(CHUNK);
    if (chunk === null) { paused = true; stream.once("readable", () => { paused = false; }); return; }
    rec.bytesSent += chunk.length;
    if (!res.write(chunk)) { paused = true; res.once("drain", () => { paused = false; }); }
  }, intervalMs);
  stream.on("end", () => { clearInterval(timer); res.end(); });
  stream.on("error", () => { clearInterval(timer); try { res.end(); } catch {} });
  req.on("close", () => { clearInterval(timer); try { stream.destroy(); } catch {} });
}
let proxyPostCount = 0;
function makeAppServer(appDist) {
  return http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${opts.port}`).pathname);
      if (urlPath === "/media/flat.mp4") { serveVideoFile(opts.flat, req, res, "fast"); return; }
      if (urlPath === "/media/noise.mp4") { serveVideoFile(opts.fixture, req, res, "fast"); return; }
      if (urlPath === "/sw.js") { res.writeHead(404, { "Cache-Control": "no-store" }); res.end(); return; }
      let file = urlPath === "/" ? path.join(appDist, "index.html") : path.join(appDist, urlPath);
      if (!file.startsWith(appDist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(appDist, "index.html");
      const ext = path.extname(file);
      res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch { try { res.writeHead(500); res.end(); } catch {} }
  });
}
function makeBridgeServer() {
  return http.createServer((req, res) => {
    try {
      const u = new URL(req.url, `http://127.0.0.1:${opts.bridgePort}`);
      if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "*" }); res.end(); return; }
      if (req.method === "POST" && u.pathname === "/api/proxy") {
        // Hút hết body multipart (file upload) rồi bỏ — bridge đo không
        // transcode, chỉ trả proxyUrl trỏ về fixture nhỏ giọt/treo.
        req.on("data", () => {});
        req.on("end", () => {
          proxyPostCount += 1;
          const first = proxyPostCount === 1;
          const body = first
            ? { proxyUrl: "/api/proxy/file/c6-drip.mp4", proxyHeight: 720, proxySizeBytes: NOISE_SIZE }
            : { proxyUrl: "/api/proxy/file/c6-hang.mp4", proxyHeight: 720, proxySizeBytes: NOISE_SIZE };
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(body));
          console.log(`[c6sync] fake-bridge POST /api/proxy #${proxyPostCount} -> ${body.proxyUrl}`);
        });
        return;
      }
      if (req.method === "GET" && u.pathname === "/api/proxy/file/c6-drip.mp4") { serveVideoFile(opts.fixture, req, res, "drip"); return; }
      if (req.method === "GET" && u.pathname === "/api/proxy/file/c6-hang.mp4") { serveVideoFile(opts.fixture, req, res, "hang"); return; }
      res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ error: "fake-bridge c6: không có route này" }));
    } catch { try { res.writeHead(500); res.end(); } catch {} }
  });
}

// ---- CDP pipe ----
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
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    proc.on("error", () => {});
    for (const s of [1, 2, 3, 4]) { try { proc.stdio[s]?.on("error", () => {}); } catch {} }
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression, timeoutMs = 120000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 500)}`);
    return r.result?.value;
  }
}

const FIND_POOL_JS = `(() => {
  const root = document.querySelector("#root");
  if (!root) return { error: "no #root" };
  const contKey = Object.keys(root).find((k) => k.startsWith("__reactContainer$"));
  const fiberKey = Object.keys(root).find((k) => k.startsWith("__reactFiber$"));
  let start = null;
  if (contKey) {
    const v = root[contKey];
    if (v && typeof v === "object" && ("child" in v || "memoizedState" in v)) start = v;
    else if (v && v.current) start = v.current;
  }
  if (!start && fiberKey) start = root[fiberKey];
  if (!start) return { error: "no fiber key", keys: Object.keys(root).slice(0, 12) };
  const seen = new Set(); const stack = [start]; let n = 0; let candidates = 0;
  while (stack.length && n < 30000) {
    const f = stack.pop();
    if (!f || seen.has(f)) continue;
    seen.add(f); n++;
    let h = f.memoizedState; const hseen = new Set();
    while (h && !hseen.has(h)) {
      hseen.add(h);
      try {
        const ms = h.memoizedState;
        if (ms && ms.current && ms.current.videos instanceof Map && typeof ms.current.videoFor === "function") {
          candidates++;
          if (!window.__c6pool) {
            window.__c6pool = ms.current;
            return { found: true, fibers: n, candidates, poolVideosSize: ms.current.videos.size };
          }
        }
      } catch (e) {}
      h = h.next;
    }
    if (f.child) stack.push(f.child);
    if (f.sibling) stack.push(f.sibling);
    if (f.alternate) stack.push(f.alternate);
  }
  return { found: false, fibers: n, candidates };
})()`;

const POOL_SNAPSHOT_JS = `(() => {
  const pool = window.__c6pool; if (!pool) return { error: "no pool" };
  const out = [];
  for (const [id, el] of pool.videos) {
    out.push({ id, srcKey: el.dataset.srcKey || null, currentSrc: (el.currentSrc || el.src || "").slice(0, 120), seeking: el.seeking, ct: el.currentTime, readyState: el.readyState, duration: el.duration });
  }
  return { videos: out };
})()`;

const ENTRIES_SNAP_JS = `(() => { const p = window.__n2PerSeek; if (!p) return { error: "no probe" }; return p.entries.map(e => ({ k: e.k, elementId: e.elementId, targetTime: e.targetTime, status: e.status, samples: e.decodedSamplesWhileSeeking.length, dropped: e.droppedSeekingSamples, seekLatencyMs: e.seekLatencyMs, seekedEvent: e.seekedEvent, phase: e.phase, srcAtSeek: (e.srcAtSeek47C6 || "").slice(0, 90), stack: e.stack47C6 || "" })); })()`;

const IDLE_SNAP_JS = `(() => { const i = window.__vcutPreviewIdle; if (!i) return null; return { ticks: i.ticks, sleeping: i.sleeping, lastDrawn: i.lastDrawn, lastRequested: i.lastRequested, pendingSeek: i.pendingSeek, seekFailureCount: i.seekFailureCount, seekFailureExhausted: i.seekFailureExhausted, seekFailureKind: i.seekFailureKind, seekFailureTarget: i.seekFailureTarget, seekElementRecreated: i.seekElementRecreated, seekRecreatedSeeking: i.seekRecreatedSeeking }; })()`;

const SEED_FN = `
(async () => {
  const buf = await (await fetch("/media/flat.mp4")).arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const sha = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const assetId = "a_" + sha.slice(0, 16);
  const blob = new Blob([buf], { type: "video/mp4" });
  await new Promise((resolve, reject) => {
    const req = indexedDB.open("vcut-studio-assets", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("manifests")) {
        const s = db.createObjectStore("manifests", { keyPath: "assetId" });
        s.createIndex("bySha256", "sha256", { unique: true });
      }
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(["manifests", "blobs"], "readwrite");
      tx.objectStore("manifests").put({ assetId, originalName: "sparse-gop-noise.mp4", sha256: sha, size: buf.byteLength, mimeType: "video/mp4", kind: "video", width: 1280, height: 720, duration: 30, ingestedAt: new Date().toISOString(), refCount: 1 });
      tx.objectStore("blobs").put(blob, assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
  const spec = { version: "0.2.0", meta: { name: "c6-sync", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", clips: [{ kind: "video", id: "c1", src: "asset:" + assetId, start: 0, duration: 30, in: 0, out: 30 }] }] };
  const env = { format: "vcut-project", formatVersion: 1, appVersion: "0.1.0", specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "c6-sync", spec, session: { playhead: 0 } };
  localStorage.setItem("vcut-studio:autosave:v1", JSON.stringify(env));
  return { assetId, sha, bytes: buf.byteLength };
})()`;

async function main() {
  const loadBefore = loadavg();
  fs.mkdirSync(opts.scratch, { recursive: true });
  const indexHtml = fs.readFileSync(path.join(opts.dist, "index.html"), "utf8");
  const bundle = (indexHtml.match(/\/assets\/(index-[^"']+\.js)/) || [])[1] ?? null;
  console.log(`[c6sync] mode=${opts.mode} dist bundle=${bundle} loadBefore=${loadBefore}`);
  const appServer = makeAppServer(opts.dist);
  await new Promise((res) => appServer.listen(opts.port, "127.0.0.1", res));
  let bridgeServer = null;
  if (opts.mode === "sync") {
    bridgeServer = makeBridgeServer();
    await new Promise((res, rej) => { bridgeServer.listen(opts.bridgePort, "127.0.0.1", res); bridgeServer.on("error", rej); });
    console.log(`[c6sync] fake-bridge tại http://127.0.0.1:${opts.bridgePort} (POST /api/proxy #1=drip, #2=hang)`);
  }
  console.log(`[c6sync] app server http://127.0.0.1:${opts.port} rate=${opts.rateKbs} KiB/s`);
  const num = opts.display.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  // 47-C6 (sau restart): socket X11 còn sót KHÔNG chứng minh Xvfb còn
  // sống — lần chạy sync trước chết đúng vì tái dùng socket :99 đã chết
  // (Chrome báo "Missing X server"). Chỉ tái dùng khi có tiến trình
  // Xvfb đúng display đang chạy; còn lại xóa socket chết rồi bật mới.
  if (fs.existsSync(sock)) {
    const ps = spawnSync("sh", ["-c", `ps aux | grep -E "Xvfb ${opts.display} " | grep -v grep`], { encoding: "utf8" });
    if (!ps.stdout || !ps.stdout.trim()) { try { fs.unlinkSync(sock); } catch {} }
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [opts.display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) { console.error("BLOCKER: Xvfb không tạo socket"); process.exit(2); }
  } else {
    console.log(`[c6sync] Xvfb: dùng chung display ${opts.display}`);
  }
  const chromeBin = fs.existsSync(PW_CHROME) ? PW_CHROME : (fs.existsSync(META_CHROME) ? META_CHROME : null);
  if (!chromeBin) { console.error("BLOCKER: không tìm thấy Chrome"); process.exit(2); }
  const chrome = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required", "--disable-gpu",
    `--user-data-dir=${opts.scratch}/chrome-profile`, "--window-size=1280,800", "--window-position=0,0",
    "about:blank"],
    { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: opts.display } });
  chrome.stdout?.on("data", () => {});
  chrome.stdio[2].on("data", (c) => { try { fs.appendFileSync(path.join(opts.scratch, "chrome-stderr.log"), c); } catch {} });
  chrome.stdio[2].on("error", () => {});
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} try { appServer.close(); } catch {} try { bridgeServer?.close(); } catch {} };
  try {
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, cdp.sessionId);
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    // Probe tự cài trên MỌI document mới (kể cả sau reload) để bắt seek
    // từ tick đầu — không phụ thuộc thời điểm evaluate sau load.
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE_INSTALL_SRC }, cdp.sessionId);
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${opts.port}/` }, cdp.sessionId);
    let appReady = null;
    for (let i = 0; i < 45; i++) {
      await sleep(2000);
      appReady = await cdp.evaluate(`(()=>({rs:document.readyState, rootChildren:document.getElementById("root")?.children.length ?? -1, probe: typeof window.__n2PerSeek, install: window.__c6probeInstall ?? null}))()`);
      console.log(`[c6sync] app poll: ${JSON.stringify(appReady)}`);
      if (appReady.rs === "complete" && appReady.rootChildren > 0) break;
    }
    if (!(appReady?.rs === "complete" && appReady?.rootChildren > 0)) throw new Error(`app không sẵn sàng: ${JSON.stringify(appReady)}`);
    if (appReady.probe !== "object") {
      // Dự phòng nếu addScript không chạy (không được im lặng bỏ qua).
      const defined = await cdp.evaluate(PROBE_SRC);
      const inst = await cdp.evaluate(`window.__n2PerSeek.install({fps:30})`);
      console.log(`[c6sync] probe fallback: defined=${defined} install=${inst}`);
      if (inst !== "installed" && inst !== "already-installed") throw new Error(`probe install thất bại: ${inst}`);
    } else {
      console.log(`[c6sync] probe auto-install: ${appReady.install}`);
    }
    const ev = (expr) => cdp.evaluate(expr);
    const snapshot = async () => ({ idle: await ev(IDLE_SNAP_JS), entries: await ev(ENTRIES_SNAP_JS), pool: await ev(POOL_SNAPSHOT_JS) });
    const waitSleeping = async (maxMs) => {
      const t0 = Date.now();
      while (Date.now() - t0 < maxMs) {
        const s = await ev(IDLE_SNAP_JS);
        if (s && s.sleeping) return s;
        await sleep(500);
      }
      return ev(IDLE_SNAP_JS);
    };
    const scrubToSeconds = async (sec) => ev(`(() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const rect = el.getBoundingClientRect(); const x = rect.left + ${Math.round(sec * 60)}; const y = rect.top + rect.height / 2; el.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); el.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true })); return { x, rectLeft: rect.left, rectWidth: rect.width, sec: ${sec} }; })()`);

    if (opts.mode === "origin") {
      // Không seed: để loadSample (project mẫu) chạy hết; probe đã bắt
      // mọi seek từ lúc navigate nhờ addScript.
      console.log("[c6sync] origin: chờ loadSample 45 s (không seed, profile mới)");
      for (let i = 0; i < 9; i++) {
        await sleep(5000);
        const s = await snapshot();
        console.log(`[c6sync] origin +${(i + 1) * 5}s entries=${Array.isArray(s.entries) ? s.entries.length : "?"} idle=${JSON.stringify(s.idle)}`);
      }
      const raw = await ev(`window.__n2PerSeek.read()`);
      const entries = raw.entries.map((e) => { const { _el, ...rest } = e; return rest; });
      const evidence = { mode: "origin", runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port, appBundle: bundle, loadBefore, loadAfter: loadavg(), entryCount: entries.length, entries, counts: raw.counts, droppedOverflow: raw.droppedOverflow, rangeRequests: rangeLog.length };
      fs.writeFileSync(path.join(opts.scratch, "origin-evidence.json"), JSON.stringify(evidence, null, 2));
      console.log(`[c6sync] origin: entries=${entries.length} counts=${JSON.stringify(raw.counts)}`);
      for (const e of entries) console.log(`[c6sync] origin k=${e.k} elId=${e.elementId} target=${e.targetTime} status=${e.status} samples=${(e.decodedSamplesWhileSeeking || []).length} dropped=${e.droppedSeekingSamples} src=${(e.srcAtSeek47C6 || "").slice(0, 60)} stack=${e.stack47C6 || ""}`);
      console.log(`[c6sync] evidence → ${path.join(opts.scratch, "origin-evidence.json")}`);
      return;
    }

    // ---- MODE SYNC ----
    const seed = await ev(SEED_FN).catch((e) => ({ error: String(e?.message ?? e) }));
    console.log(`[c6sync] seed: ${JSON.stringify(seed)}`);
    if (seed.error) throw new Error(`seed thất bại: ${seed.error}`);
    await ev(`location.reload()`);
    await sleep(3000);
    let ready2 = null;
    for (let i = 0; i < 30; i++) {
      await sleep(2000);
      ready2 = await ev(`(()=>({rs:document.readyState, rootChildren:document.getElementById("root")?.children.length ?? -1, probe: typeof window.__n2PerSeek, install: window.__c6probeInstall ?? null}))()`);
      if (ready2.rs === "complete" && ready2.rootChildren > 0) break;
    }
    console.log(`[c6sync] sau reload: ${JSON.stringify(ready2)}`);
    const settle = await waitSleeping(60000);
    console.log(`[c6sync] settle: ${JSON.stringify(settle)}`);
    const poolFound = await ev(FIND_POOL_JS);
    console.log(`[c6sync] pool fiber: ${JSON.stringify(poolFound)}`);
    let snap0 = await snapshot();
    console.log(`[c6sync] entries sau settle: ${JSON.stringify(snap0.entries)} pool=${JSON.stringify(snap0.pool)}`);
    const phases = [];
    const phase = (name, data) => { phases.push({ name, at: stamp(), ...data }); console.log(`[c6sync] PHASE ${name}: ${JSON.stringify(data).slice(0, 1200)}`); };

    // S0: bấm nút Proxy thật trong MediaBin → gắn proxyUrl drip.
    const proxyBtn = await ev(`(() => { const b = document.querySelector(".media-proxy"); if (!b) return null; const r = b.getBoundingClientRect(); return { label: b.getAttribute("aria-label"), disabled: b.disabled, text: b.textContent, visible: r.width > 0 }; })()`);
    console.log(`[c6sync] nút Proxy: ${JSON.stringify(proxyBtn)}`);
    if (!proxyBtn) throw new Error("không thấy nút .media-proxy — MediaBin chưa hiện item / item thiếu file");
    await ev(`(() => { document.querySelector(".media-proxy").click(); return true; })()`);
    let proxyAttached = null;
    for (let i = 0; i < 40; i++) {
      await sleep(1000);
      const p = await ev(POOL_SNAPSHOT_JS);
      const hit = (p.videos || []).find((v) => (v.srcKey || "").includes("c6-drip") || (v.currentSrc || "").includes("c6-drip"));
      if (hit) { proxyAttached = { afterSec: i + 1, hit }; break; }
      if (i === 9) {
        // Gợi vòng lặp tick một lần bằng scrub nhẹ 0.5 (cũng là S0).
        await scrubToSeconds(0.5);
      }
    }
    phase("S0-proxy-attach", { proxyBtn, proxyAttached, proxyPostCount, entries: await ev(ENTRIES_SNAP_JS) });
    if (!proxyAttached) throw new Error("proxy drip chưa gắn vào pool element sau 40 s + scrub 0.5 — dừng để khỏi đo sai đường blob");

    // Hàm chạy 1 lần scrub + poll tới khi ngủ (đã vẽ / cạn cap) hoặc hết giờ.
    async function runScrub(name, sec, maxSec) {
      const t0 = Date.now();
      const scrub = await scrubToSeconds(sec);
      await sleep(1000);
      const samples = [];
      let endSnap = null;
      while (Date.now() - t0 < maxSec * 1000) {
        const s = await snapshot();
        const es = Array.isArray(s.entries) ? s.entries : [];
        const last = es[es.length - 1];
        samples.push({ atSec: +((Date.now() - t0) / 1000).toFixed(1), idle: s.idle, entries: es.length, lastEntry: last ? { k: last.k, elementId: last.elementId, target: last.targetTime, status: last.status, samples: last.samples, dropped: last.dropped } : null });
        if (s.idle && s.idle.sleeping) { endSnap = s; break; }
        await sleep(2000);
      }
      if (!endSnap) endSnap = await snapshot();
      const out = { name, targetSec: sec, scrub, waitSec: +((Date.now() - t0) / 1000).toFixed(1), endIdle: endSnap.idle, endPool: endSnap.pool, entries: endSnap.entries, tailSamples: samples.slice(-8) };
      phase(name, out);
      return out;
    }

    await runScrub("S1-scrub25-drip", 25, 150);
    await runScrub("S2-scrub5-drip", 5, 150);
    // S3: bấm Proxy lần 2 → fake bridge trả hang URL; scrub 20.
    await ev(`(() => { document.querySelector(".media-proxy").click(); return true; })()`);
    let hangAttached = null;
    for (let i = 0; i < 40; i++) {
      await sleep(1000);
      const p = await ev(POOL_SNAPSHOT_JS);
      const hit = (p.videos || []).find((v) => (v.srcKey || "").includes("c6-hang") || (v.currentSrc || "").includes("c6-hang"));
      if (hit) { hangAttached = { afterSec: i + 1, hit }; break; }
      if (i === 9) await scrubToSeconds(0.5);
    }
    phase("S3-proxy-hang-attach", { hangAttached, proxyPostCount });
    if (hangAttached) await runScrub("S3-scrub20-hang", 20, 120);
    else phase("S3-scrub20-hang", { skipped: true, reason: "proxy hang chưa gắn sau 40 s + scrub 0.5" });

    const alive = await ev(`(()=>({onePlusOne:1+1, rs:document.readyState}))()`);
    const raw = await ev(`window.__n2PerSeek.read()`);
    const entries = raw.entries.map((e) => { const { _el, ...rest } = e; return rest; });
    const perEntry = entries.map((e) => ({
      k: e.k, elementId: e.elementId ?? null, targetTime: e.targetTime, status: e.status,
      sampleCount: (e.decodedSamplesWhileSeeking || []).length,
      droppedSeekingSamples: e.droppedSeekingSamples ?? 0,
      keptPlusDropped: (e.decodedSamplesWhileSeeking || []).length + (e.droppedSeekingSamples ?? 0),
      rafTicksWhileWaiting: e.rafTicksWhileWaiting ?? null,
      seekLatencyMs: e.seekLatencyMs, seekedEvent: e.seekedEvent,
      phase: e.phase, srcAtSeek: e.srcAtSeek47C6 ?? null, stack: e.stack47C6 ?? null,
      flushElementSrc: e.flushElementSrc ?? null, flushElementReadyState: e.flushElementReadyState ?? null,
    }));
    const evidence = {
      mode: "sync", runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port, bridgePort: opts.bridgePort,
      rateKbs: opts.rateKbs, fixture: opts.fixture, flat: opts.flat, appBundle: bundle,
      loadBefore, loadAfter: loadavg(),
      loadCondition: "under-load: phiên chạy cùng các luồng đợt 47 khác (load đo ở đầu/cuối phiên, không phải quiet có điều phối)",
      seed, settle, poolFiber: poolFound, phases,
      appAliveAfter: alive, entryCount: entries.length, perEntry,
      maxSamplesPerEntry: Math.max(0, ...perEntry.map((e) => e.sampleCount)),
      maxDroppedSeekingSamples: Math.max(0, ...perEntry.map((e) => e.droppedSeekingSamples)),
      capHit: perEntry.some((e) => e.sampleCount >= 1000),
      counts: raw.counts, droppedOverflow: raw.droppedOverflow,
      rangeRequests: rangeLog.length, rangeLog: rangeLog.slice(-80),
      scope: "SYNC-LOOP: seek do vòng sync preview lái (scrub .tl-ruler -> store playhead -> Seeker/seekAll -> pool element), src HTTP qua proxyUrl gắn bằng nút Proxy thật trong MediaBin (fake bridge chỉ trả proxyUrl, không transcode). Seed dùng blob stand-in flat 45 KB cho IDB (xem đầu file) — mọi byte phát ra là fixture noise thật qua HTTP nhỏ giọt/treo. Server nhỏ giọt là mô phỏng có nhật ký range, không phải mạng chậm thật.",
    };
    fs.writeFileSync(path.join(opts.scratch, "sync-cap-evidence.json"), JSON.stringify(evidence, null, 2));
    fs.writeFileSync(path.join(opts.scratch, "sync-cap-entries.json"), JSON.stringify(entries, null, 2));
    console.log(`[c6sync] entries=${entries.length} maxSamples=${evidence.maxSamplesPerEntry} maxDropped=${evidence.maxDroppedSeekingSamples} capHit=${evidence.capHit} counts=${JSON.stringify(raw.counts)}`);
    console.log(`[c6sync] evidence → ${path.join(opts.scratch, "sync-cap-evidence.json")}`);
  } finally {
    cleanup();
  }
  process.exit(0);
}
main().catch((e) => { console.error(`BLOCKER: ${e.message}`); process.exit(2); });
