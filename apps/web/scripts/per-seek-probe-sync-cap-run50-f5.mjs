#!/usr/bin/env node
/**
 * Phase 9 đợt 50, luồng F5 — PROBE: TRẦN 1000 TRÊN B-FRAME BẰNG FLOW
 * MỚI (nợ E5 §6.4 + §6.7: flow episode không thành lập; probe rAF-fallback
 * đóng seek sau 5–15 ms, 0 mẫu).
 *
 * File này là BẢN SAO của script E5 (per-seek-probe-sync-cap-run49-e5.mjs)
 * với flow mới F5; mọi hạ tầng đo (server drip/hang, fake bridge, CDP pipe,
 * seed blob stand-in, probe v2 vá stack + elementIdOf) giữ nguyên từng dòng
 * — chỉ thêm phần mới, không sửa logic đo cũ. Không sửa file E5 gốc.
 * Không sửa code app trong script này.
 *
 * FLOW MỚI F5 (thay cho flow episode của E5 ở pha S1):
 *  (a) Probe vá thêm lớp F5 (per-seek-probe-patch50f5.mjs): fallback rAF
 *      chỉ chốt entry khi điều kiện (seeking=false + currentTime ở target
 *      + readyState>=2) giữ LIÊN TIẾP đủ 30 tick; tick nào seeking=true
 *      hoặc readyState<2 thì reset. Sửa đúng lỗi E5 §4: tick đầu sau gán
 *      thấy trạng thái tiền-seek nên fallback cũ chốt entry sau 5–15 ms
 *      với 0 mẫu, trong khi element sau đó seeking=true hàng chục giây.
 *      F5a (chỉ đếm tick, không đòi readyState) đã chạy và VẪN chốt sớm
 *      vì cửa sổ tiền-seek dài ~8 s (Chrome chưa phát range request cho
 *      mốc target — xem LIMITS F5 §2); F5b thêm điều kiện readyState>=2.
 *  (b) Pha S1 mới là CAP-WAIT (không chờ vòng lặp ngủ như runScrub cũ):
 *      scrub 25 rồi poll entry k=0 mỗi 2 s cho tới khi chạm trần 1000 mẫu
 *      giữ, hoặc entry hoàn tất (vẽ được), hoặc seeked thật đã chốt mà
 *      mẫu ngừng tăng, hoặc hết --cap-wait-sec (mặc định 120 s). Vòng
 *      lặp preview ngủ giữa chừng KHÔNG dừng poll — probe rAF độc lập
 *      với vòng lặp, element vẫn seeking=true thì mẫu vẫn tích.
 *  (c) Sau cap-wait, episode dài S2a/S2b + S2d của E5 vẫn chạy nguyên để
 *      đối chứng (trên B-frame, E5 đã thấy episode không thành lập).
 *  (d) Đối chứng serve-nhanh: --proxy-mode fast phục vụ file proxy ở
 *      tốc độ đầy đủ (không drip) để kiểm chứng dự đoán "seek hoàn tất
 *      thật → cửa sổ seeking ngắn → không chạm trần" bằng số đo, thay vì
 *      chỉ lập luận. Mặc định drip (giống E5/D5) để so sánh được.
 *
 * BỔ SUNG E5:
 *  (1) FILMSTRIP: IntersectionObserver trong trang bị bọc lúc chạy
 *      (addScriptToEvaluateOnNewDocument, như probe vá prototype): mọi
 *      callback IO bị giữ lại cho tới khi harness gọi
 *      window.__e5ReleaseIO() — gọi đúng lúc episode scrub dài bắt đầu
 *      (sau S2a xác nhận seeking). Nhờ đó filmstrip của Timeline
 *      (getFilmstrip → captureFrame, 10 mốc 1.5–28.5 trên blob flat 30 s)
 *      chạy THẬT qua đường Timeline, TRÙNG thời gian với episode sync,
 *      thay vì chết yểu ở IO race lúc mount như C6 §1.5/D5. Không sửa
 *      app: chỉ hoãn callback IO trong phiên đo (fallback tự nhả sau
 *      600 s — dài hơn cả phiên — để khỏi kẹt vĩnh viễn nếu harness lỗi).
 *  (2) FINGERPRINT: probe được vá thêm `elementIdOf(el)` (qua helper
 *      per-seek-probe-patch49e5.mjs — cùng helper test Node dùng);
 *      snapshot pool cuối phiên ghi `probeElementId` cho từng video.
 *      Harness ghi lịch sử snapshot pool trong lúc chờ ngủ để bắt đúng
 *      thời điểm drop (seekElementRecreated 0→1), rồi phase S2d scrub
 *      sang target mới (10) để ép seek trên element mới — entry sau drop
 *      phải mang đúng elementId mới, khác id đã drop (khóa bằng test
 *      Node pool-element-fingerprint-49e5.test.mjs 9/9).
 *  (3) B-FRAME: fixture phát qua drip lấy từ --fixture như cũ; chạy
 *      2 lượt với cùng flow: lượt 1 fixture noise không B-frame
 *      (has_b_frames=0, baseline so với D5), lượt 2 fixture B-frame
 *      (bframe-gop30-noise.mp4: 630 B / 240 P / 29 I, has_b_frames=2,
 *      GOP 30 — encode lại cùng nội dung noise, xem gen script).
 *      proxySizeBytes lấy từ kích thước file thật, không còn hằng
 *      NOISE_SIZE của D5.
 *
 * PHẠM VI TRUNG THỰC — ĐỌC TRƯỚC KHI TRÍCH SỐ:
 * - Giữ nguyên mọi ghi chú trung thực của D5/C6 (seed blob stand-in,
 *   server nhỏ giọt là mô phỏng có nhật ký range, mọi số under-load,
 *   cấm dùng làm baseline quiet). Riêng lượt này: filmstrip capture
 *   trên blob flat local (nhanh, ~1 s cho 10 frame) nên cửa sổ tranh
 *   chấp với vòng sync là NGẮN — kết luận chỉ trong cửa sổ đó, không
 *   phóng đại thành "filmstrip luôn làm tăng dropped".
 * - KHÔNG đo WebCodecs/Safari/máy thật — không có binary, ghi rõ chưa đo.
 * - Baseline quiet vẫn chờ cửa sổ yên từ main chat — không ép đo.
 *
 * Chế độ:
 *   --mode long-scrub (mặc định ở file này): như D5 + filmstrip release
 *                   ở S2a + S2d ép seek sau drop + fingerprint.
 *   --mode sync / origin: giữ nguyên như D5 (không dùng ở đợt này
 *                   ngoài đối chứng khi cần; origin không có filmstrip
 *                   release vì không có episode).
 *
 * Cách dùng (từ gốc repo; dist đóng băng C6, bridge PHẢI ở 4296 vì
 * VITE_BRIDGE_URL đã bake trong bundle):
 *   node apps/web/scripts/per-seek-probe-sync-cap-run50-f5.mjs --mode long-scrub \
 *     --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
 *     --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
 *     --dist ~/workspace/tmp-round47-c6/app-dist \
 *     --scratch ~/workspace/tmp-round50-f5/sync-bframe \
 *     [--display :94] [--port 4292] [--bridge-port 4296] [--rate-kbs 64] \
 *     [--long-scrub-sec 30] [--scrub-step-sec 1] [--cap-wait-sec 120] \
 *     [--proxy-mode drip|fast]
 *   Đối chứng noise (không B-frame): đổi --fixture sang
 *     ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 và --scratch sang
 *     ~/workspace/tmp-round50-f5/sync-noise.
 *   Đối chứng serve-nhanh: thêm --proxy-mode fast (cùng fixture B-frame).
 *   Lượt B-frame: đổi --fixture sang
 *     ~/workspace/tmp-round49-e5/bframe-gop30-noise.mp4 và --scratch
 *     sang ~/workspace/tmp-round49-e5/sync-bframe.
 * Exit 0 khi phiên chạy xong và evidence đã ghi (kể cả khi trần 1000
 * chưa chạm — chưa chạm cũng là kết quả); exit 2 khi blocker hạ tầng.
 * KHÔNG push, KHÔNG tag, KHÔNG ghi qua GitHub connector.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { patchProbeSrc50F5, matchDropFingerprint } from "./per-seek-probe-patch50f5.mjs";

const REPO = path.resolve(import.meta.dirname, "..", "..", "..");
const PROBE_SRC_RAW = fs.readFileSync(path.join(import.meta.dirname, "per-seek-probe-page.js"), "utf8");
const META_CHROME = "/opt/meta-chromium/chrome";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");

function parseArgs(argv) {
  const o = { mode: "long-scrub", display: ":94", port: 4292, bridgePort: 4296, rateKbs: 64, hangPollSec: 45, longScrubSec: 30, scrubStepSec: 1, capWaitSec: 120, proxyMode: "drip" };
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
    else if (argv[i] === "--long-scrub-sec") o.longScrubSec = Number(argv[++i]);
    else if (argv[i] === "--scrub-step-sec") o.scrubStepSec = Number(argv[++i]);
    else if (argv[i] === "--cap-wait-sec") o.capWaitSec = Number(argv[++i]);
    else if (argv[i] === "--proxy-mode") o.proxyMode = argv[++i];
  }
  return o;
}
const opts = parseArgs(process.argv.slice(2));
if (!["sync", "origin", "long-scrub"].includes(opts.mode)) { console.error("mode phải là sync|origin|long-scrub"); process.exit(2); }
if (!["drip", "fast"].includes(opts.proxyMode)) { console.error("--proxy-mode phải là drip|fast"); process.exit(2); }
if (!opts.dist || !fs.existsSync(path.join(opts.dist, "index.html"))) { console.error("BLOCKER: chưa có dist (build vite với VITE_BRIDGE_URL trỏ bridge-port trước)"); process.exit(2); }
if (opts.mode !== "origin" && (!opts.fixture || !opts.flat || !opts.scratch || !fs.existsSync(opts.fixture) || !fs.existsSync(opts.flat))) {
  console.error("Cách dùng: --fixture <noise.mp4> --flat <flat.mp4> --dist <app-dist> --scratch <dir>");
  process.exit(2);
}
if (opts.mode === "origin" && !opts.scratch) { console.error("origin cần --scratch"); process.exit(2); }
// E5 (3): proxySizeBytes lấy từ kích thước fixture thật (noise 419967521,
// bframe 387572806) thay vì hằng NOISE_SIZE của D5.
const FIXTURE_SIZE = opts.mode === "origin" ? 0 : fs.statSync(opts.fixture).size;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return null; } };
const MIME = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm" };

// ---- Vá probe page: D5 (stack/src/wall) + E5 (elementIdOf) + F5 (fallback
// cần xác nhận liên tiếp) qua helper ----
// Một nguồn duy nhất với test Node (per-seek-probe-patch50f5.mjs); KHÔNG
// sửa file probe gốc dùng chung.
const PROBE_SRC = patchProbeSrc50F5(PROBE_SRC_RAW);
const PROBE_INSTALL_SRC = PROBE_SRC + "\n;window.__c6probeInstall = window.__n2PerSeek.install({fps:30, fallbackConfirmTicks:30});";

// ---- E5 (1) filmstrip: giữ callback IntersectionObserver tới khi harness nhả ----
// Lý do (C6 §1.5): ClipThumb của Timeline đăng ký IO lúc mount; IO bắn
// trước khi rehydrate nạp xong media bin nên doCapture tìm không thấy
// media (m.name === src) rồi disconnect — filmstrip không bao giờ chạy.
// Bọc này chỉ HOÃN callback trong phiên đo (harness nhả đúng lúc episode
// bắt đầu), không sửa app, không sửa hành vi capture. Fallback 600 s tự
// nhả để khỏi kẹt vĩnh viễn nếu harness lỗi (dài hơn cả phiên).
const IO_DELAY_SRC = `(() => {
  if (window.__e5IOWrapped) return "already";
  window.__e5IOWrapped = true;
  window.__e5FilmstripGo = false;
  window.__e5IOQueue = [];
  const OrigIO = window.IntersectionObserver;
  function E5IO(cb, opts) {
    const wrapped = (entries, obs) => {
      const fire = () => { try { cb(entries, obs); } catch (e) {} };
      if (window.__e5FilmstripGo) { fire(); return; }
      window.__e5IOQueue.push(fire);
      setTimeout(() => {
        const i = window.__e5IOQueue.indexOf(fire);
        if (i >= 0) { window.__e5IOQueue.splice(i, 1); fire(); }
      }, 600000);
    };
    return new OrigIO(wrapped, opts);
  }
  window.IntersectionObserver = E5IO;
  window.__e5ReleaseIO = () => {
    window.__e5FilmstripGo = true;
    const q = window.__e5IOQueue.splice(0);
    q.forEach((f) => { try { f(); } catch (e) {} });
    return q.length;
  };
  return "io-delay-installed";
})();`;

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
            ? { proxyUrl: "/api/proxy/file/c6-drip.mp4", proxyHeight: 720, proxySizeBytes: FIXTURE_SIZE }
            : { proxyUrl: "/api/proxy/file/c6-hang.mp4", proxyHeight: 720, proxySizeBytes: FIXTURE_SIZE };
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(body));
          console.log(`[c6sync] fake-bridge POST /api/proxy #${proxyPostCount} -> ${body.proxyUrl}`);
        });
        return;
      }
      if (req.method === "GET" && u.pathname === "/api/proxy/file/c6-drip.mp4") { serveVideoFile(opts.fixture, req, res, opts.proxyMode === "fast" ? "fast" : "drip"); return; }
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
    // E5 (2): fingerprint elementId trực tiếp cho pool element — D5 §4.4
    // chỉ có pool key (giữ nguyên khi tạo lại) nên không chứng minh được
    // element mới là element khác. elementIdOf gán id mới nếu element
    // chưa từng seek (xem helper patch49e5).
    let probeElementId = null;
    try { probeElementId = window.__n2PerSeek && typeof window.__n2PerSeek.elementIdOf === "function" ? window.__n2PerSeek.elementIdOf(el) : null; } catch (e) {}
    out.push({ id, probeElementId, srcKey: el.dataset.srcKey || null, currentSrc: (el.currentSrc || el.src || "").slice(0, 120), seeking: el.seeking, ct: el.currentTime, readyState: el.readyState, duration: el.duration });
  }
  return { videos: out };
})()`;

const ENTRIES_SNAP_JS = `(() => { const p = window.__n2PerSeek; if (!p) return { error: "no probe" }; return p.entries.map(e => ({ k: e.k, elementId: e.elementId, targetTime: e.targetTime, status: e.status, samples: e.decodedSamplesWhileSeeking.length, dropped: e.droppedSeekingSamples, seekLatencyMs: e.seekLatencyMs, seekedEvent: e.seekedEvent, seekedAtMs: e.seekedAtMs, firstDrawAfterSeekAtMs: e.firstDrawAfterSeekAtMs, fallbackConfirmTicks: e.fallbackConfirmTicks ?? null, fallbackConfirmed: e.fallbackConfirmed ?? null, phase: e.phase, srcAtSeek: (e.srcAtSeek47C6 || "").slice(0, 90), stack: e.stack47C6 || "" })); })()`;

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
  if (opts.mode !== "origin") {
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
    // E5 (1): bọc IntersectionObserver TRƯỚC probe để giữ callback
    // filmstrip tới khi harness nhả (xem IO_DELAY_SRC).
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: IO_DELAY_SRC }, cdp.sessionId);
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

    // ---- D5 MODE long-scrub: episode scrub liên tục để thử chạm trần 1000 ----
    // S2a: scrub 5 → tạo entry, chờ element vào seeking=true (tối đa 15 s).
    // Nếu entry bị fallback đóng (như k=0 C6: seeking không bao giờ quan
    // sát được true) thì episode dài không hợp lệ — ghi rõ và dừng, không
    // đo mù. S2b: scrub sang target MỚI mỗi scrubStepSec giây (6→29 rồi
    // quay đầu 28→6, lặp lại): mỗi lần scrub reset cap + supersede lần
    // thử trước nên vòng lặp không cạn cap, entry đầu tiên tích lũy mẫu
    // suốt episode (seekElement không gán lại khi seeking — N1). S2c:
    // dừng scrub, chờ vòng lặp cạn cap + ngủ (tối đa 90 s) rồi đọc entry.
    async function runLongScrub() {
      const t0 = Date.now();
      const scrub5 = await scrubToSeconds(5);
      let seekingSeen = null;
      for (let i = 0; i < 30; i++) {
        await sleep(500);
        const s = await snapshot();
        const v = (s.pool.videos || [])[0];
        const entries = Array.isArray(s.entries) ? s.entries : [];
        const last = entries[entries.length - 1];
        seekingSeen = { afterSec: +((Date.now() - t0) / 1000).toFixed(1), poolVideo: v, entries: entries.length, lastEntry: last ? { k: last.k, elementId: last.elementId, target: last.targetTime, status: last.status, samples: last.samples, dropped: last.dropped } : null };
        if (v && v.seeking === true && last && last.targetTime === 5 && last.status === "pending") break;
      }
      phase("S2a-scrub5-seeking", { scrub: scrub5, seekingSeen });
      if (!seekingSeen || !seekingSeen.poolVideo || seekingSeen.poolVideo.seeking !== true || !seekingSeen.lastEntry || seekingSeen.lastEntry.target !== 5 || seekingSeen.lastEntry.status !== "pending") {
        phase("S2b-long-scrub", { skipped: true, reason: "element không vào trạng thái seeking sau scrub 5 — episode dài không hợp lệ (entry có thể đã bị rAF-fallback đóng như k=0 C6)", seekingSeen });
        return;
      }
      // E5 (1) FILMSTRIP: nhả callback IO đúng lúc episode bắt đầu —
      // filmstrip Timeline (10 mốc 1.5–28.5 trên blob flat 30 s) chạy
      // trùng thời gian với episode sync. Ghi số callback đã giữ + mốc
      // performance.now() để đối chiếu cửa sổ mẫu của entry sync.
      const filmstripRelease = await ev(`(() => { const t = performance.now(); const n = (typeof window.__e5ReleaseIO === "function") ? window.__e5ReleaseIO() : -1; return { releasedCallbacks: n, releasePerfMs: t, ioWrapped: !!window.__e5IOWrapped }; })()`);
      phase("S2a-filmstrip-release", { filmstripRelease });
      const poolHistory = [];
      const recordPoolHistory = async (label) => {
        const s = await snapshot();
        poolHistory.push({ label, atSec: +((Date.now() - t0) / 1000).toFixed(1), recreated: s.idle ? s.idle.seekElementRecreated : null, seekingCount: s.idle ? s.idle.seekRecreatedSeeking : null, sleeping: s.idle ? s.idle.sleeping : null, pool: s.pool });
        return s;
      };
      const targets = [];
      let dir = 1, cur = 6;
      const t1 = Date.now();
      const tails = [];
      const totalSteps = Math.max(1, Math.round(opts.longScrubSec / opts.scrubStepSec));
      for (let i = 0; i < totalSteps; i++) {
        await scrubToSeconds(cur);
        targets.push({ step: i, target: cur, atSec: +((Date.now() - t1) / 1000).toFixed(1) });
        if (i % 2 === 1) {
          const s = await snapshot();
          const es = Array.isArray(s.entries) ? s.entries : [];
          const last = es[es.length - 1];
          tails.push({ atSec: +((Date.now() - t1) / 1000).toFixed(1), idle: s.idle, entries: es.length, lastEntry: last ? { k: last.k, elementId: last.elementId, target: last.targetTime, status: last.status, samples: last.samples, dropped: last.dropped } : null, poolSeeking: (s.pool.videos || []).map((v) => v.seeking) });
        }
        if (dir === 1) { cur++; if (cur > 29) { dir = -1; cur = 28; } }
        else { cur--; if (cur < 6) { dir = 1; cur = 7; } }
        await sleep(opts.scrubStepSec * 1000);
      }
      const scrubWallSec = +((Date.now() - t1) / 1000).toFixed(1);
      let endSnap = null;
      const t2 = Date.now();
      // E5 (2): ghi lịch sử snapshot pool trong lúc chờ ngủ để bắt đúng
      // thời điểm drop (seekElementRecreated 0→1): snapshot ngay trước
      // và ngay sau chuyển đổi là poolBefore/poolAfter của fingerprint.
      await recordPoolHistory("s2b-wait-start");
      while (Date.now() - t2 < 90000) {
        const s = await snapshot();
        poolHistory.push({ label: "s2b-wait", atSec: +((Date.now() - t0) / 1000).toFixed(1), recreated: s.idle ? s.idle.seekElementRecreated : null, seekingCount: s.idle ? s.idle.seekRecreatedSeeking : null, sleeping: s.idle ? s.idle.sleeping : null, pool: s.pool });
        if (s.idle && s.idle.sleeping) { endSnap = s; break; }
        await sleep(2000);
      }
      if (!endSnap) endSnap = await snapshot();
      const out = { name: "S2b-long-scrub", scrubWallSec, steps: targets.length, targets, tailSamples: tails, waitSleepSec: +((Date.now() - t2) / 1000).toFixed(1), endIdle: endSnap.idle, endPool: endSnap.pool, entries: endSnap.entries, filmstripRelease, poolHistory };
      phase("S2b-long-scrub", out);
      // E5 (2) S2d: ép seek trên element MỚI sau drop. Sau S2b vòng lặp
      // đã ngủ (cạn cap, drop el 0 → syncMedia tạo el 1, ct 0, chưa
      // seek). Scrub sang target mới (10) reset cap → seek trên el 1 →
      // entry mới phải mang elementId của el 1, khác id của el 0 đã
      // drop. Seek này cũng sẽ kẹt (drip) rồi cạn cap lần 2 — chỉ cần
      // entry + snapshot, không cần nó hoàn tất.
      const s2d = await runScrub("S2d-scrub10-after-drop", 10, 120);
      phase("S2d-done", { endIdle: s2d.endIdle, endPool: s2d.endPool, entriesCount: Array.isArray(s2d.entries) ? s2d.entries.length : null });
      return out;
    }

    // ---- F5: pha S1 mới là CAP-WAIT (thay runScrub chờ ngủ của E5) ----
    // Scrub 25 rồi poll entry k=0 mỗi 2 s. Dừng khi: chạm trần 1000 mẫu
    // giữ (capHit) / entry hoàn tất (vẽ được) / seeked đã chốt mà mẫu
    // ngừng tăng 3 poll liên tiếp (cửa sổ mẫu đã đóng thật, chờ thêm
    // cũng không tích mẫu) / element bị drop giữa chừng / hết giờ.
    // Vòng lặp preview ngủ giữa chừng KHÔNG dừng poll (probe rAF độc
    // lập; element vẫn seeking=true thì mẫu vẫn tích).
    async function runCapWait() {
      const t0 = Date.now();
      const scrub = await scrubToSeconds(25);
      const series = [];
      let breakReason = null;
      let lastSamples = -1;
      let stillPolls = 0;
      let endSnap = null;
      while (Date.now() - t0 < opts.capWaitSec * 1000) {
        const snap = await snapshot();
        const es = Array.isArray(snap.entries) ? snap.entries : [];
        const e0 = es[0] || null;
        const v0 = (snap.pool.videos || [])[0] || null;
        const row = {
          atSec: +((Date.now() - t0) / 1000).toFixed(1),
          entry: e0 ? { k: e0.k, elementId: e0.elementId, target: e0.targetTime, status: e0.status, samples: e0.samples, dropped: e0.dropped, seekedAtMs: e0.seekedAtMs, seekedEvent: e0.seekedEvent, fallbackConfirmTicks: e0.fallbackConfirmTicks, fallbackConfirmed: e0.fallbackConfirmed, firstDraw: e0.firstDrawAfterSeekAtMs } : null,
          poolVideo: v0 ? { seeking: v0.seeking, ct: v0.ct, readyState: v0.readyState } : null,
          sleeping: snap.idle ? snap.idle.sleeping : null,
          lastDrawn: snap.idle ? snap.idle.lastDrawn : null,
          recreated: snap.idle ? snap.idle.seekElementRecreated : null,
        };
        series.push(row);
        endSnap = snap;
        if (e0 && e0.samples >= 1000) { breakReason = "cap-hit"; break; }
        if (e0 && e0.status === "completed") { breakReason = "entry-completed"; break; }
        if (e0 && e0.status === "superseded") { breakReason = "entry-superseded"; break; }
        if (row.recreated !== null && row.recreated >= 1) { breakReason = "element-dropped-during-wait"; break; }
        if (e0 && e0.seekedAtMs !== null) {
          if (e0.samples === lastSamples) { stillPolls += 1; if (stillPolls >= 3) { breakReason = "seeked-closed-samples-stalled"; break; } }
          else stillPolls = 0;
        }
        lastSamples = e0 ? e0.samples : -1;
        await sleep(2000);
      }
      if (!breakReason) breakReason = "timeout";
      if (!endSnap) endSnap = await snapshot();
      const e0 = (Array.isArray(endSnap.entries) ? endSnap.entries : [])[0] || null;
      const out = {
        name: "S1-cap-wait", scrub, waitSec: +((Date.now() - t0) / 1000).toFixed(1),
        capWaitSec: opts.capWaitSec, proxyMode: opts.proxyMode, breakReason,
        capHit: !!(e0 && e0.samples >= 1000),
        endEntry: e0, endPool: endSnap.pool, endIdle: endSnap.idle,
        series,
      };
      phase("S1-cap-wait", out);
      return out;
    }

    const capWait = await runCapWait();
    if (opts.mode === "long-scrub") {
      await runLongScrub();
    } else {
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
    }

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
    // ---- E5: phân tích filmstrip + fingerprint drop (từ entries đầy đủ + phases) ----
    const e5Filmstrip = (() => {
      const rel = phases.find((x) => x.name === "S2a-filmstrip-release")?.filmstripRelease || null;
      const releasePerfMs = rel?.releasePerfMs ?? null;
      // Filmstrip = seek của captureFrame trên blob URL flat (clip seed
      // 30 s → 10 mốc 1.5–28.5). Entry sync dùng URL proxy http nên tách
      // được bằng tiền tố blob: + stack chứa captureFrame làm đối chứng.
      const fsEntries = entries.filter((e) => typeof e.srcAtSeek47C6 === "string" && e.srcAtSeek47C6.startsWith("blob:"));
      const fsSummary = fsEntries.map((e) => ({
        k: e.k, elementId: e.elementId ?? null, targetTime: e.targetTime, status: e.status,
        sampleCount: (e.decodedSamplesWhileSeeking || []).length,
        droppedSeekingSamples: e.droppedSeekingSamples ?? 0,
        // Đối chứng stack: bundle minified nên tên hàm là QT, không phải
        // "captureFrame" — C6 §2.1 đã ghim captureFrame = QT tại
        // index-D4oCKuDp.js:58:45553. Kiểm tra đúng call site đó.
        stackHasCaptureFrame: typeof e.stack47C6 === "string" && e.stack47C6.includes("58:45553"),
        stackCallSite: typeof e.stack47C6 === "string" ? (e.stack47C6.split(" | ")[2] || "").trim() : null,
      }));
      // Entry sync (target 5, k=1): tốc độ mẫu quanh lúc nhả filmstrip.
      const syncEntry = entries.find((e) => e.targetTime === 5) || null;
      let windows = null;
      if (syncEntry && releasePerfMs !== null) {
        const ts = (syncEntry.decodedSamplesWhileSeeking || []).map((s) => s.tMs);
        const before = ts.filter((t) => t >= releasePerfMs - 5000 && t < releasePerfMs).length;
        const during = ts.filter((t) => t >= releasePerfMs && t < releasePerfMs + 5000).length;
        const after = ts.filter((t) => t >= releasePerfMs + 5000).length;
        const afterSpanSec = ts.length ? Math.max(0, (ts[ts.length - 1] - (releasePerfMs + 5000)) / 1000) : 0;
        windows = {
          releasePerfMs,
          before5s: { samples: before, ratePerSec: +(before / 5).toFixed(2) },
          during5s: { samples: during, ratePerSec: +(during / 5).toFixed(2) },
          after: { samples: after, spanSec: +afterSpanSec.toFixed(1), ratePerSec: afterSpanSec > 0 ? +(after / afterSpanSec).toFixed(2) : null },
        };
      }
      return {
        release: rel,
        ran: fsEntries.length > 0,
        count: fsEntries.length,
        expectedTimestamps: [1.5, 4.5, 7.5, 10.5, 13.5, 16.5, 19.5, 22.5, 25.5, 28.5],
        entries: fsSummary,
        syncEntryWindows: windows,
        syncEntry: syncEntry ? { k: syncEntry.k, elementId: syncEntry.elementId ?? null, sampleCount: (syncEntry.decodedSamplesWhileSeeking || []).length, droppedSeekingSamples: syncEntry.droppedSeekingSamples ?? 0, keptPlusDropped: (syncEntry.decodedSamplesWhileSeeking || []).length + (syncEntry.droppedSeekingSamples ?? 0) } : null,
      };
    })();
    const e5DropFingerprint = (() => {
      const p = phases.find((x) => x.name === "S2b-long-scrub") || null;
      const s2d = phases.find((x) => x.name === "S2d-scrub10-after-drop") || null;
      if (!p || !Array.isArray(p.poolHistory) || !Array.isArray(p.entries)) return { available: false, reason: "thiếu poolHistory/entries S2b" };
      const hist = p.poolHistory;
      const ti = hist.findIndex((h) => typeof h.recreated === "number" && h.recreated >= 1);
      if (ti < 0) return { available: false, reason: "không thấy recreated 0→1 trong poolHistory" };
      const beforeRec = [...hist.slice(0, ti)].reverse().find((h) => h.recreated === 0) || null;
      const afterRec = hist[ti];
      const poolBefore = (beforeRec?.pool?.videos || []).map((v) => ({ poolKey: v.id, probeElementId: v.probeElementId ?? null }));
      const poolAfter = (afterRec?.pool?.videos || []).map((v) => ({ poolKey: v.id, probeElementId: v.probeElementId ?? null }));
      const maxKBeforeS2d = Math.max(-1, ...p.entries.map((e) => e.k));
      const entryAfterDrop = entries.find((e) => e.k > maxKBeforeS2d) || null;
      const droppedElementId = p.entries.length ? (p.entries[p.entries.length - 1].elementId ?? null) : null;
      const match = matchDropFingerprint({
        droppedElementId,
        poolBefore,
        poolAfter,
        entryAfterDropElementId: entryAfterDrop ? (entryAfterDrop.elementId ?? null) : null,
      });
      return {
        available: true,
        firstDropAtSec: afterRec.atSec,
        droppedElementId,
        poolBefore,
        poolAfter,
        entryAfterDrop: entryAfterDrop ? { k: entryAfterDrop.k, elementId: entryAfterDrop.elementId ?? null, targetTime: entryAfterDrop.targetTime, status: entryAfterDrop.status } : null,
        match,
        endPoolAfterS2d: s2d?.endPool ?? null,
        endIdleAfterS2d: s2d?.endIdle ?? null,
      };
    })();
    const evidence = {
      mode: opts.mode, runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port, bridgePort: opts.bridgePort,
      rateKbs: opts.rateKbs, fixture: opts.fixture, fixtureSize: FIXTURE_SIZE, flat: opts.flat, appBundle: bundle,
      loadBefore, loadAfter: loadavg(),
      loadCondition: "under-load: phiên chạy cùng các luồng đợt 49 khác (load đo ở đầu/cuối phiên, không phải quiet có điều phối)",
      seed, settle, poolFiber: poolFound, phases,
      appAliveAfter: alive, entryCount: entries.length, perEntry,
      maxSamplesPerEntry: Math.max(0, ...perEntry.map((e) => e.sampleCount)),
      maxDroppedSeekingSamples: Math.max(0, ...perEntry.map((e) => e.droppedSeekingSamples)),
      capHit: perEntry.some((e) => e.sampleCount >= 1000),
      counts: raw.counts, droppedOverflow: raw.droppedOverflow,
      rangeRequests: rangeLog.length, rangeLog: rangeLog.slice(-80),
      filmstrip49E5: e5Filmstrip,
      dropFingerprint49E5: e5DropFingerprint,
      capWait50F5: (() => {
        const c = (typeof capWait !== "undefined" && capWait) ? capWait : null;
        if (!c) return { available: false, reason: "không chạy pha cap-wait (mode origin/sync)" };
        const e = c.endEntry;
        return {
          available: true,
          proxyMode: c.proxyMode,
          breakReason: c.breakReason,
          waitSec: c.waitSec,
          capHit: c.capHit,
          endEntry: e ? { k: e.k, elementId: e.elementId, targetTime: e.targetTime, status: e.status, samples: e.samples, dropped: e.dropped, keptPlusDropped: e.samples + e.dropped, seekLatencyMs: e.seekLatencyMs, seekedEvent: e.seekedEvent, fallbackConfirmTicks: e.fallbackConfirmTicks, fallbackConfirmed: e.fallbackConfirmed } : null,
          endPool: c.endPool,
          endIdle: c.endIdle,
          series: c.series,
        };
      })(),
      longScrub: opts.mode === "long-scrub" ? (() => {
        const p = phases.find((x) => x.name === "S2b-long-scrub") || null;
        const a = phases.find((x) => x.name === "S2a-scrub5-seeking") || null;
        const top = perEntry.length ? perEntry.reduce((m, e) => (e.sampleCount + e.droppedSeekingSamples > m.sampleCount + m.droppedSeekingSamples ? e : m), perEntry[0]) : null;
        return {
          skipped: p?.skipped ?? false, reason: p?.reason ?? null,
          scrubWallSec: p?.scrubWallSec ?? null, steps: p?.steps ?? null,
          seekStart: a?.seekingSeen ?? null,
          endIdle: p?.endIdle ?? null,
          topEntry: top ? { k: top.k, elementId: top.elementId, targetTime: top.targetTime, status: top.status, sampleCount: top.sampleCount, droppedSeekingSamples: top.droppedSeekingSamples, keptPlusDropped: top.keptPlusDropped, rafTicksWhileWaiting: top.rafTicksWhileWaiting } : null,
        };
      })() : null,
      scope: opts.mode === "long-scrub"
        ? "LONG-SCRUB F5: như E5 (episode scrub liên tục qua vòng sync preview, src HTTP qua proxyUrl gắn bằng nút Proxy thật) NHƯNG pha S1 đổi thành CAP-WAIT: scrub 25 rồi poll entry k=0 mỗi 2 s tới khi chạm trần 1000 mẫu giữ / entry hoàn tất / mẫu ngừng tăng sau seeked / hết --cap-wait-sec; probe vá F5 (fallback cần 30 tick xác nhận liên tiếp) để cửa sổ mẫu không bị đóng sớm như E5. --proxy-mode drip (mặc định, như E5/D5) hoặc fast (đối chứng serve-nhanh). Seed dùng blob stand-in flat 45 KB cho IDB (xem đầu file) — mọi byte phát ra là fixture thật qua HTTP nhỏ giọt/nhanh. Server nhỏ giọt là mô phỏng có nhật ký range, không phải mạng chậm thật."
        : "SYNC-LOOP: seek do vòng sync preview lái (scrub .tl-ruler -> store playhead -> Seeker/seekAll -> pool element), src HTTP qua proxyUrl gắn bằng nút Proxy thật trong MediaBin (fake bridge chỉ trả proxyUrl, không transcode). Seed dùng blob stand-in flat 45 KB cho IDB (xem đầu file) — mọi byte phát ra là fixture noise thật qua HTTP nhỏ giọt/treo. Server nhỏ giọt là mô phỏng có nhật ký range, không phải mạng chậm thật.",
    };
    fs.writeFileSync(path.join(opts.scratch, "sync-cap-evidence.json"), JSON.stringify(evidence, null, 2));
    fs.writeFileSync(path.join(opts.scratch, "sync-cap-entries.json"), JSON.stringify(entries, null, 2));
    console.log(`[c6sync] entries=${entries.length} maxSamples=${evidence.maxSamplesPerEntry} maxDropped=${evidence.maxDroppedSeekingSamples} capHit=${evidence.capHit} counts=${JSON.stringify(raw.counts)}`);
    console.log(`[c6sync] E5 filmstrip ran=${e5Filmstrip.ran} count=${e5Filmstrip.count} syncWindows=${JSON.stringify(e5Filmstrip.syncEntryWindows)}`);
    console.log(`[c6sync] E5 dropFingerprint available=${e5DropFingerprint.available} match=${JSON.stringify(e5DropFingerprint.match ?? e5DropFingerprint.reason)}`);
    if (evidence.capWait50F5?.available) {
      const cw = evidence.capWait50F5;
      console.log(`[c6sync] F5 cap-wait proxyMode=${cw.proxyMode} break=${cw.breakReason} capHit=${cw.capHit} samples=${cw.endEntry?.samples ?? "?"} dropped=${cw.endEntry?.dropped ?? "?"} waitSec=${cw.waitSec}`);
    }
    console.log(`[c6sync] evidence → ${path.join(opts.scratch, "sync-cap-evidence.json")}`);
  } finally {
    cleanup();
  }
  process.exit(0);
}
main().catch((e) => { console.error(`BLOCKER: ${e.message}`); process.exit(2); });
