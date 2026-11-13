#!/usr/bin/env node
/**
 * Phase 9 đợt 46, luồng B5 — đo trần 1000 mẫu per-seek TRÊN ELEMENT
 * PREVIEW THẬT CỦA MediaPool (đóng nợ A5 §4.1: Z5/A5 chỉ đo element
 * tạo tay trong trang app, chưa đo element do MediaPool tạo).
 *
 * PHẠM VI TRUNG THỰC — ĐỌC TRƯỚC KHI TRÍCH SỐ:
 * - Element đo là element do MediaPool.videoFor() thật tạo ra, thuộc
 *   đúng instance pool của PreviewCanvas trong app thật (poolRef tạo
 *   trong render body của preview.tsx, lấy qua cây fiber React theo
 *   mẫu harness deep-leaf I6 — chỉ ĐỌC fiber để lấy instance, không
 *   sửa state React). Item được đưa vào pool bằng videoFor() trực
 *   tiếp (không qua timeline UI — project rỗng không có clip nên
 *   vòng sync preview không tự seek element này); seek do harness
 *   gán currentTime trực tiếp lên pool element. Vì vậy số đo chứng
 *   minh trần 1000 giữ đúng trên ELEMENT CỦA POOL, không chứng minh
 *   vòng sync preview tự nó seek chậm 40 s (vòng đó không chạy ở
 *   đây — ghi rõ để không trích quá).
 * - Src là HTTP qua server đo (mô phỏng nhỏ giọt 64 KiB/s có nhật ký
 *   range như Z5, không phải mạng chậm thật): đây chính là "đường
 *   asset HTTP trong app" mà A5 đòi — MediaPool.videoFor dùng
 *   proxyUrl ?? url nên một item có url HTTP đi đúng nhánh src mà
 *   preview dùng cho proxy HTTP (xem media.ts). Blob local chỉ làm
 *   đối chứng (seek nhanh, mẫu nhỏ).
 * - "Seek 40 s" nghĩa là seeking kéo dài ~40 s wall (như Z5), không
 *   phải seek tới mốc 40 s.
 *
 * Kịch bản (một phiên Chrome headed qua CDP pipe, mẫu Z5/app-cap):
 *  1. Nạp app thật (dist đóng băng), cài probe per-seek v2, tìm pool
 *     PreviewCanvas qua fiber, videoFor() item HTTP drip → seek 25 s
 *     rồi 5 s dưới nhỏ giọt 64 KiB/s (kỳ vọng: mỗi entry giữ đúng
 *     1000 mẫu đầu, dropped > 0, chốt completed, validate 0 problem).
 *  2. Pool element thứ hai qua endpoint treo → seek 20 s, poll ~45 s
 *     (kỳ vọng: seeking vẫn true, giữ đúng 1000, dropped tăng,
 *     read() chốt unresolved — KHÔNG mất lặng lẽ).
 *  3. Đối chứng pool element blob local: flat 45 KB → blob: URL →
 *     videoFor() → seek 5 s trong khoảng duration (kỳ vọng: xong
 *     nhanh, mẫu/entry nhỏ, completed) — khác Z5 (seek 20 s vượt
 *     duration 10 s của flat nên bị clamp): B5 seek 5 s để là seek
 *     trong khoảng hợp lệ, ghi rõ khác biệt này.
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/per-seek-probe-pool-cap-run.mjs \
 *     --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
 *     --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
 *     --scratch /tmp/round46-b5/poolcap --display :95 --port 4195 \
 *     [--rate-kbs 64] [--hang-poll-sec 45]
 * Exit 0 khi phiên chạy xong và evidence đã ghi (kể cả khi trần chưa
 * chạm — chưa chạm cũng là kết quả); exit 2 khi blocker hạ tầng.
 * KHÔNG push, KHÔNG tag, KHÔNG ghi qua GitHub connector.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { freezeDist } from "./freeze-dist.mjs";
import { validatePerSeekEntry } from "./per-seek-probe.mjs";

const REPO = path.resolve(import.meta.dirname, "..", "..", "..");
const PROBE_PAGE_SRC = fs.readFileSync(path.join(import.meta.dirname, "per-seek-probe-page.js"), "utf8");
const META_CHROME = "/opt/meta-chromium/chrome";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");

function parseArgs(argv) {
  const o = { display: ":95", port: 4195, rateKbs: 64, hangPollSec: 45, seekTimeoutSec: 150 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--fixture") o.fixture = argv[++i];
    else if (argv[i] === "--flat") o.flat = argv[++i];
    else if (argv[i] === "--scratch") o.scratch = argv[++i];
    else if (argv[i] === "--display") o.display = argv[++i];
    else if (argv[i] === "--port") o.port = Number(argv[++i]);
    else if (argv[i] === "--rate-kbs") o.rateKbs = Number(argv[++i]);
    else if (argv[i] === "--hang-poll-sec") o.hangPollSec = Number(argv[++i]);
  }
  return o;
}
const opts = parseArgs(process.argv.slice(2));
if (!opts.fixture || !opts.flat || !opts.scratch || !fs.existsSync(opts.fixture) || !fs.existsSync(opts.flat)) {
  console.error("Cách dùng: per-seek-probe-pool-cap-run.mjs --fixture <noise.mp4> --flat <flat.mp4> --scratch <dir> [--display :95] [--port 4195]");
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const loadavg = () => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return null; } };
const MIME = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm" };

// ------------------------------------------------------- HTTP server --
// Cùng logic phục vụ của Z5 app-cap (drip / hang / fast), chỉ đổi tên
// endpoint query để phân biệt trong nhật ký range.
const rangeLog = [];
function parseRange(req, size) {
  let start = 0, end = size - 1;
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      start = m[1] ? Number(m[1]) : size - Number(m[2]);
      end = m[2] ? Number(m[2]) : size - 1;
    }
  }
  return { start, end };
}
function serveVideoFile(file, req, res, mode) {
  const size = fs.statSync(file).size;
  const { start, end } = parseRange(req, size);
  const total = end - start + 1;
  const rec = { t: stamp(), file: path.basename(file), range: `${start}-${end}`, total, mode, bytesSent: 0 };
  rangeLog.push(rec);
  if (mode === "hang") {
    const ONE_MIB = 1024 * 1024;
    if (start < ONE_MIB) {
      const serveEnd = Math.min(end, ONE_MIB - 1);
      const serveTotal = serveEnd - start + 1;
      res.writeHead(206, {
        "Content-Type": "video/mp4", "Accept-Ranges": "bytes",
        "Content-Length": serveTotal, "Content-Range": `bytes ${start}-${serveEnd}/${size}`,
        "Cache-Control": "no-store",
      });
      const s = fs.createReadStream(file, { start, end: serveEnd });
      s.on("data", (c) => { rec.bytesSent += c.length; });
      s.pipe(res);
      return;
    }
    if (start >= size - ONE_MIB) {
      res.writeHead(206, {
        "Content-Type": "video/mp4", "Accept-Ranges": "bytes",
        "Content-Length": total, "Content-Range": `bytes ${start}-${end}/${size}`,
        "Cache-Control": "no-store",
      });
      const s = fs.createReadStream(file, { start, end });
      s.on("data", (c) => { rec.bytesSent += c.length; });
      s.pipe(res);
      return;
    }
    res.writeHead(206, {
      "Content-Type": "video/mp4", "Accept-Ranges": "bytes",
      "Content-Length": total, "Content-Range": `bytes ${start}-${end}/${size}`,
      "Cache-Control": "no-store",
    });
    req.on("close", () => { try { res.end(); } catch {} });
    return;
  }
  res.writeHead(req.headers.range ? 206 : 200, {
    "Content-Type": "video/mp4", "Accept-Ranges": "bytes",
    "Content-Length": total, "Content-Range": `bytes ${start}-${end}/${size}`,
    "Cache-Control": "no-store",
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
function makeServer(appDist) {
  return http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${opts.port}`).pathname);
      if (urlPath === "/video.mp4") { serveVideoFile(opts.fixture, req, res, "drip"); return; }
      if (urlPath === "/video-hang.mp4") { serveVideoFile(opts.fixture, req, res, "hang"); return; }
      if (urlPath === "/video-flat.mp4") { serveVideoFile(opts.flat, req, res, "fast"); return; }
      if (urlPath === "/sw.js") { res.writeHead(404, { "Cache-Control": "no-store" }); res.end(); return; }
      let file = urlPath === "/" ? path.join(appDist, "index.html") : path.join(appDist, urlPath);
      if (!file.startsWith(appDist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(appDist, "index.html");
      }
      const ext = path.extname(file);
      res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch { try { res.writeHead(500); res.end(); } catch {} }
  });
}

// ------------------------------------------------------------- CDP pipe --
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
    for (const s of [1, 2, 3, 4]) {
      try { proc.stdio[s]?.on("error", () => {}); } catch {}
    }
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

// Page JS: tìm instance MediaPool của PreviewCanvas qua fiber (mẫu I6).
// Trả summary JSON; giữ instance ở window.__b5pool để các bước sau dùng.
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
          if (!window.__b5pool) {
            window.__b5pool = ms.current;
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

const main = async () => {
  const loadBefore = loadavg();
  fs.mkdirSync(opts.scratch, { recursive: true });
  const appDist = path.join(opts.scratch, "app-dist");
  const fr = freezeDist(path.join(REPO, "apps/web/dist"), appDist);
  const indexHtml = fs.readFileSync(path.join(appDist, "index.html"), "utf8");
  const bundle = (indexHtml.match(/\/assets\/(index-[^"']+\.js)/) || [])[1] ?? null;
  console.log(`[poolcap] app-dist đóng băng: bundle=${bundle} freezeAttempts=${fr.attempts} loadBefore=${loadBefore}`);
  const server = makeServer(appDist);
  await new Promise((res) => server.listen(opts.port, "127.0.0.1", res));
  console.log(`[poolcap] server http://127.0.0.1:${opts.port} rate=${opts.rateKbs} KiB/s`);
  const num = opts.display.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${opts.display}`]).status === 0; } catch {}
    if (alive) console.log(`[poolcap] Xvfb: dùng chung display ${opts.display}`);
    else {
      console.log(`[poolcap] Xvfb: socket ${sock} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
    }
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [opts.display, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) { console.error("BLOCKER: Xvfb không tạo socket"); process.exit(2); }
  }
  const chromeBin = fs.existsSync(PW_CHROME) ? PW_CHROME : (fs.existsSync(META_CHROME) ? META_CHROME : null);
  if (!chromeBin) { console.error("BLOCKER: không tìm thấy Chrome"); process.exit(2); }
  console.log(`[poolcap] chrome: ${chromeBin} (display ${opts.display})`);
  const chrome = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required", "--disable-gpu",
    `--user-data-dir=${opts.scratch}/chrome-profile`, "--window-size=1280,800", "--window-position=0,0",
    "about:blank"],
    { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: opts.display } });
  chrome.stdout?.on("data", () => {});
  chrome.stdio[2].on("data", (c) => { try { fs.appendFileSync(path.join(opts.scratch, "chrome-stderr.log"), c); } catch {} });
  chrome.stdio[2].on("error", () => {});
  chrome.on("exit", (code, signal) => console.log(`[poolcap] chrome exit code=${code} signal=${signal}`));
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} try { server.close(); } catch {} };
  try {
    await cdp.send("Target.getTargets", {}, undefined, 30000);
    const target = await cdp.send("Target.createTarget", { url: "about:blank" });
    await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
    if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true }, cdp.sessionId);
    await cdp.send("Page.enable", {}, cdp.sessionId);
    await cdp.send("Runtime.enable", {}, cdp.sessionId);
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${opts.port}/` }, cdp.sessionId);
    let appReady = null;
    for (let i = 0; i < 45; i++) {
      await sleep(2000);
      appReady = await cdp.evaluate(`(()=>({rs:document.readyState, rootChildren:document.getElementById("root")?.children.length ?? -1, bodyText:document.body.innerText.length}))()`);
      console.log(`[poolcap] app poll: ${JSON.stringify(appReady)}`);
      if (appReady.rs === "complete" && appReady.rootChildren > 0) break;
    }
    if (!(appReady?.rs === "complete" && appReady?.rootChildren > 0)) throw new Error(`app không sẵn sàng: ${JSON.stringify(appReady)}`);
    const defined = await cdp.evaluate(PROBE_PAGE_SRC);
    const inst = await cdp.evaluate(`window.__n2PerSeek.install({fps:30})`);
    console.log(`[poolcap] probe defined=${defined} install=${inst}`);
    if (inst !== "installed" && inst !== "already-installed") throw new Error(`probe install thất bại: ${inst}`);
    const poolFound = await cdp.evaluate(FIND_POOL_JS);
    console.log(`[poolcap] pool fiber: ${JSON.stringify(poolFound)}`);
    if (!poolFound.found) throw new Error(`không tìm được MediaPool qua fiber: ${JSON.stringify(poolFound)}`);
    const snapEntries = `(()=>window.__n2PerSeek.entries.map(e=>({k:e.k,elementId:e.elementId,targetTime:e.targetTime,status:e.status,samples:e.decodedSamplesWhileSeeking.length,dropped:e.droppedSeekingSamples,rafTicks:e.rafTicksWhileWaiting})))()`;

    // ---- 1. Pool element HTTP drip: videoFor() item url HTTP, seek 25 rồi 5.
    const dripEl = await cdp.evaluate(`(() => {
      const pool = window.__b5pool;
      const item = { id: "b5-drip", kind: "video", url: "/video.mp4?poolcap=1", duration: 30 };
      const el = pool.videoFor(item);
      window.__b5drip = el;
      return { sameAsPoolMap: pool.videos.get("b5-drip") === el, tag: el.tagName, detached: !document.contains(el), preload: el.preload, playsInline: el.playsInline, src: (el.currentSrc || el.src || "").slice(0, 60) };
    })()`);
    console.log(`[poolcap] drip pool element: ${JSON.stringify(dripEl)}`);
    if (!dripEl.sameAsPoolMap || dripEl.tag !== "VIDEO" || !dripEl.detached) throw new Error(`element drip không phải pool element thật: ${JSON.stringify(dripEl)}`);
    for (let i = 0; i < 100; i++) {
      const md = await cdp.evaluate(`(()=>{const v=window.__b5drip; return {rs:v.readyState, dur:v.duration, err:v.error?String(v.error.code):null};})()`);
      if (md.rs >= 1 && md.dur > 0) { console.log(`[poolcap] drip metadata rs=${md.rs} dur=${md.dur}`); break; }
      if (md.err) throw new Error(`drip video error ${md.err}`);
      await sleep(200);
    }
    const dripPolls = [];
    for (const t of [25, 5]) {
      console.log(`[poolcap] drip seek → ${t}s`);
      await cdp.evaluate(`(()=>{window.__b5drip.currentTime=${t}; return window.__b5drip.seeking;})()`);
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < opts.seekTimeoutSec * 1000) {
        await sleep(2000);
        last = await cdp.evaluate(`(()=>{const v=window.__b5drip; return {seeking:v.seeking, ct:v.currentTime, entries:${snapEntries}};})()`);
        const cur = last.entries[last.entries.length - 1];
        console.log(`[poolcap]  +${Math.round((Date.now() - t0) / 1000)}s seeking=${last.seeking} ct=${last.ct?.toFixed(2)} k=${cur?.k} elId=${cur?.elementId} samples=${cur?.samples} dropped=${cur?.dropped}`);
        if (!last.seeking) break;
      }
      dripPolls.push({ target: t, waitSec: Math.round((Date.now() - t0) / 1000), last });
      await sleep(1000);
    }

    // ---- 2. Pool element endpoint treo: seek 20 s, poll ~45 s.
    const hangEl = await cdp.evaluate(`(() => {
      const pool = window.__b5pool;
      const item = { id: "b5-hang", kind: "video", url: "/video-hang.mp4?poolcap=1", duration: 30 };
      const el = pool.videoFor(item);
      window.__b5hang = el;
      return { sameAsPoolMap: pool.videos.get("b5-hang") === el, detached: !document.contains(el), src: (el.currentSrc || el.src || "").slice(0, 60) };
    })()`);
    console.log(`[poolcap] hang pool element: ${JSON.stringify(hangEl)}`);
    if (!hangEl.sameAsPoolMap || !hangEl.detached) throw new Error(`element hang không phải pool element thật: ${JSON.stringify(hangEl)}`);
    let hangMeta = null;
    for (let i = 0; i < 100; i++) {
      const md = await cdp.evaluate(`(()=>{const v=window.__b5hang; return {rs:v.readyState, dur:v.duration, err:v.error?String(v.error.code):null};})()`);
      if (md.rs >= 1 && md.dur > 0) { hangMeta = md; console.log(`[poolcap] hang metadata rs=${md.rs} dur=${md.dur}`); break; }
      if (md.err) throw new Error(`hang video error ${md.err}`);
      await sleep(200);
    }
    if (!hangMeta) throw new Error("hang video không có metadata sau 20 s — endpoint treo chưa cho moov về, không đo seek kẹt được");
    console.log(`[poolcap] hang seek → 20s (poll ${opts.hangPollSec}s)`);
    await cdp.evaluate(`(()=>{window.__b5hang.currentTime=20; return window.__b5hang.seeking;})()`);
    const hangPolls = [];
    const hangT0 = Date.now();
    while (Date.now() - hangT0 < opts.hangPollSec * 1000) {
      await sleep(2000);
      const snap = await cdp.evaluate(`(()=>{const v=window.__b5hang; return {seeking:v.seeking, ct:v.currentTime, entries:${snapEntries}};})()`);
      const cur = snap.entries[snap.entries.length - 1];
      hangPolls.push({ atSec: Math.round((Date.now() - hangT0) / 1000), seeking: snap.seeking, samples: cur?.samples, dropped: cur?.dropped });
      console.log(`[poolcap]  hang +${Math.round((Date.now() - hangT0) / 1000)}s seeking=${snap.seeking} k=${cur?.k} elId=${cur?.elementId} samples=${cur?.samples} dropped=${cur?.dropped}`);
      if (!snap.seeking) break;
    }
    const hangStillSeeking = hangPolls[hangPolls.length - 1]?.seeking === true;

    // ---- 3. Đối chứng pool element blob local (flat → blob: URL → videoFor → seek 5 s).
    const blobResult = await cdp.evaluate(`(async()=>{
      const r=await fetch("/video-flat.mp4"); const b=await r.blob(); const u=URL.createObjectURL(b);
      const pool=window.__b5pool;
      const item={id:"b5-blob",kind:"video",url:u,duration:10};
      const v=pool.videoFor(item); window.__b5blob=v;
      for(let i=0;i<100;i++){ if(v.readyState>=1&&v.duration>0) break; await new Promise(r=>setTimeout(r,200)); }
      const sameAsPoolMap = pool.videos.get("b5-blob")===v;
      v.currentTime=5; const t0=performance.now();
      while(v.seeking && performance.now()-t0<15000){ await new Promise(r=>setTimeout(r,200)); }
      await new Promise(r=>setTimeout(r,500));
      const es=window.__n2PerSeek.entries; const e=es[es.length-1];
      return {seeking:v.seeking, ct:v.currentTime, sameAsPoolMap, detached:!document.contains(v), srcKind:(v.currentSrc||v.src||"").slice(0,5), entryCount:es.length, lastEntry: e?{k:e.k,elementId:e.elementId,targetTime:e.targetTime,status:e.status,samples:e.decodedSamplesWhileSeeking.length,dropped:e.droppedSeekingSamples}:null};
    })()`);
    console.log(`[poolcap] blob control: ${JSON.stringify(blobResult)}`);

    const alive = await cdp.evaluate(`(()=>({onePlusOne:1+1, rs:document.readyState}))()`);
    const raw = await cdp.evaluate(`window.__n2PerSeek.read()`);
    const entries = raw.entries.map((e) => { const { _el, ...rest } = e; return rest; });
    const validateProblemsTotal = entries.reduce((n, e) => n + validatePerSeekEntry(e).length, 0);
    const perEntry = entries.map((e) => ({
      k: e.k, elementId: e.elementId ?? null, targetTime: e.targetTime, status: e.status,
      sampleCount: (e.decodedSamplesWhileSeeking || []).length,
      droppedSeekingSamples: e.droppedSeekingSamples ?? 0,
      keptPlusDropped: (e.decodedSamplesWhileSeeking || []).length + (e.droppedSeekingSamples ?? 0),
      rafTicksWhileWaiting: e.rafTicksWhileWaiting ?? null,
      seekLatencyMs: e.seekLatencyMs, seekedEvent: e.seekedEvent,
      flushElementSrc: e.flushElementSrc ?? null,
      flushElementReadyState: e.flushElementReadyState ?? null,
    }));
    const evidence = {
      runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port,
      rateKbs: opts.rateKbs, fixture: opts.fixture, flat: opts.flat,
      appBundle: bundle, freezeAttempts: fr.attempts, appReady, probeInstall: inst,
      poolFiber: poolFound, dripElement: dripEl, hangElement: hangEl,
      loadBefore, loadAfter: loadavg(),
      loadCondition: "under-load: phiên chạy cùng các luồng đợt 46 khác (load đo ở đầu/cuối phiên, không phải quiet có điều phối)",
      dripPolls, hangPolls, hangStillSeekingAtRead: hangStillSeeking,
      blobControl: blobResult, appAliveAfterHang: alive,
      entryCount: entries.length, perEntry,
      maxSamplesPerEntry: Math.max(0, ...perEntry.map((e) => e.sampleCount)),
      maxDroppedSeekingSamples: Math.max(0, ...perEntry.map((e) => e.droppedSeekingSamples)),
      capHit: perEntry.some((e) => e.sampleCount >= 1000),
      validateProblemsTotal, counts: raw.counts, droppedOverflow: raw.droppedOverflow,
      rangeRequests: rangeLog.length, rangeLog: rangeLog.slice(-60),
      scope: "POOL-LEVEL: element do MediaPool.videoFor() của PreviewCanvas thật tạo (lấy instance qua fiber, item đưa vào bằng videoFor trực tiếp, không qua timeline UI; seek do harness gán currentTime trực tiếp, không qua vòng sync preview). Src HTTP drip/treo là mô phỏng nhỏ giọt có nhật ký range (như Z5), không phải mạng chậm thật. Vòng sync preview không chạy cho các element này vì project rỗng — số đo chứng minh trần trên element pool, không chứng minh vòng sync tự seek chậm 40 s.",
    };
    writeFileEpermRetry(path.join(opts.scratch, "pool-cap-evidence.json"), JSON.stringify(evidence, null, 2));
    writeFileEpermRetry(path.join(opts.scratch, "pool-cap-entries.json"), JSON.stringify(entries, null, 2));
    console.log(`[poolcap] entries=${entries.length} maxSamples=${evidence.maxSamplesPerEntry} maxDropped=${evidence.maxDroppedSeekingSamples} capHit=${evidence.capHit} validateProblems=${validateProblemsTotal}`);
    console.log(`[poolcap] evidence → ${path.join(opts.scratch, "pool-cap-evidence.json")}`);
  } finally {
    cleanup();
  }
  process.exit(0);
};
main().catch((e) => { console.error(`BLOCKER: ${e.message}`); process.exit(2); });
