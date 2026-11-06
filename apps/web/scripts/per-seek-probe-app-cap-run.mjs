#!/usr/bin/env node
/**
 * Phase 9 đợt 44, luồng Z5 — đo trần 1000 mẫu per-seek TRONG TRANG
 * APP VCUT THẬT (đóng nợ đợt 43 Y5 §6.2: cap Y5 chỉ đo trên trang tối
 * giản, chưa đo trong app).
 *
 * PHẠM VI TRUNG THỰC — ĐỌC TRƯỚC KHI TRÍCH SỐ:
 * - Trang nạp là dist app thật (đóng băng bằng freezeDist, bundle
 *   ghi trong evidence), probe per-seek v2 cài bằng Runtime.evaluate
 *   đúng đường N2/W5 dùng trong app. Element đo là <video> tạo trong
 *   trang app, KHÔNG phải element preview của MediaPool — vì preview
 *   chỉ nạp blob: URL local (seek local xong trong mili-giây, xem
 *   đối chứng blob cuối phiên: max ~vài chục mẫu), nên KHÔNG có cách
 *   nào làm seek preview chậm 40 s bằng file local. Trần 1000 trong
 *   preview chỉ chạm được khi app có đường nạp video qua mạng (asset
 *   HTTP) hoặc khi seek kẹt — hai trường hợp phiên này mô phỏng bằng
 *   element trong trang app (mạng nhỏ giọt thật qua Range server +
 *   endpoint treo thật). Probe chặn setter ở prototype nên element
 *   preview tương lai qua mạng cũng sẽ được quan sát y hệt — không
 *   cần đổi probe.
 * - "Mạng chậm" ở đây là MÔ PHỎNG có kiểm chứng (server nhỏ giọt
 *   64 KiB/s, nhật ký range đối chiếu byte/thời gian), không phải
 *   mạng chậm thật ngoài đời. Seek 40 s nghĩa là seeking kéo dài
 *   ~40 s wall (Y5 cap2: ~39 s), không phải seek tới mốc 40 s.
 *
 * Kịch bản (một phiên Chrome headed qua CDP pipe, mẫu N2/Y5):
 *  1. Nạp app thật, cài probe, tạo video mạng → seek 25 s rồi 5 s
 *     dưới nhỏ giọt 64 KiB/s (kỳ vọng: mỗi entry giữ đúng 1000 mẫu
 *     đầu, dropped > 0, chốt completed, validate 0 problem).
 *  2. Seek kẹt: video từ endpoint treo (moov nhỏ đi ngay để có
 *     metadata, range media lớn không bao giờ chảy) → seek 20 s,
 *     poll ~45 s (kỳ vọng: seeking vẫn true, giữ đúng 1000,
 *     dropped tăng, read() chốt unresolved — KHÔNG mất lặng lẽ).
 *  3. Đối chứng blob local: flat fixture 45 KB → blob: URL → seek
 *     20 s (kỳ vọng: xong nhanh, mẫu/entry nhỏ, completed) — chứng
 *     minh vì sao preview local không chạm trần.
 *
 * Cách dùng (từ gốc repo):
 *   node apps/web/scripts/per-seek-probe-app-cap-run.mjs \
 *     --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
 *     --flat ~/workspace/tmp-round27-k4/sparse-gop-flat.mp4 \
 *     --scratch /tmp/round44-z5/appcap --display :98 --port 4298 \
 *     [--rate-kbs 64] [--hang-poll-sec 45]
 * Exit 0 khi phiên chạy xong và evidence đã ghi (kể cả khi trần chưa
 * chạm — chưa chạm cũng là kết quả); exit 2 khi blocker hạ tầng.
 * KHÔNG push, KHÔNG tag, KHÔNG ghi qua GitHub connector.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
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
  const o = { display: ":98", port: 4298, rateKbs: 64, hangPollSec: 45, seekTimeoutSec: 150 };
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
  console.error("Cách dùng: per-seek-probe-app-cap-run.mjs --fixture <noise.mp4> --flat <flat.mp4> --scratch <dir> [--display :98] [--port 4298]");
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const MIME = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm" };

// ------------------------------------------------------- HTTP server --
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
  // mode: "drip" (nhỏ giọt theo rate) | "hang" (range nhỏ đi ngay,
  // range lớn gửi header rồi treo) | "fast" (đi ngay).
  const size = fs.statSync(file).size;
  const { start, end } = parseRange(req, size);
  const total = end - start + 1;
  const rec = { t: stamp(), file: path.basename(file), range: `${start}-${end}`, total, mode, bytesSent: 0 };
  rangeLog.push(rec);
  // ROUND44-Z5: nhánh hang tự ghi header riêng (tiền tố/moov/treo
  // khác nhau) nên phải đứng TRƯỚC writeHead chung dưới đây.
  if (mode === "hang") {
    // ROUND44-Z5 (sửa sau lần chạy đầu treo hụt): lần đầu treo MỌI
    // range lớn kể cả request đầu 0- nên Chrome không nhận được byte
    // đầu nào, không biết moov ở cuối, metadata không bao giờ sẵn —
    // seek 20 s trên element chưa có metadata được Chrome "xong" một
    // cách rỗng (seeked-no-draw, 0 mẫu), KHÔNG phải seek kẹt. Muốn kẹt
    // thật phải cho metadata về trước rồi mới treo range media:
    //  - range bắt đầu < 1 MiB (tiền tố file): phục vụ tới hết 1 MiB
    //    rồi kết thúc response để Chrome tự xin tiếp;
    //  - range bắt đầu trong 1 MiB cuối file (vùng moov): phục vụ ngay;
    //  - còn lại (media giữa file, kể cả range seek tới 20 s): gửi
    //    header rồi treo, body không bao giờ chảy.
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
    // Treo: header đã gửi, body không bao giờ chảy.
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
      if (urlPath === "/probe-page.js") {
        res.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-store" });
        res.end(PROBE_PAGE_SRC);
        return;
      }
      if (urlPath === "/video.mp4") { serveVideoFile(opts.fixture, req, res, "drip"); return; }
      if (urlPath === "/video-hang.mp4") { serveVideoFile(opts.fixture, req, res, "hang"); return; }
      if (urlPath === "/video-flat.mp4") { serveVideoFile(opts.flat, req, res, "fast"); return; }
      if (urlPath === "/sw.js") { res.writeHead(404, { "Cache-Control": "no-store" }); res.end(); return; } // ROUND44-Z5: chặn SW cache video đo.
      let file = urlPath === "/" ? path.join(appDist, "index.html") : path.join(appDist, urlPath);
      if (!file.startsWith(appDist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        // SPA fallback: route lạ của app về index.html (không fallback video/probe).
        file = path.join(appDist, "index.html");
      }
      const ext = path.extname(file);
      res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(file).pipe(res);
    } catch { try { res.writeHead(500); res.end(); } catch {} }
  });
}

// ------------------------------------------------------------- CDP pipe --
// Mẫu tối giản theo harness N2/Y5 (pipe --remote-debugging-pipe).
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

const main = async () => {
  fs.mkdirSync(opts.scratch, { recursive: true });
  // ROUND44-Z5: đóng băng dist bằng freezeDist (chống race build khác).
  const appDist = path.join(opts.scratch, "app-dist");
  const fr = freezeDist(path.join(REPO, "apps/web/dist"), appDist);
  const indexHtml = fs.readFileSync(path.join(appDist, "index.html"), "utf8");
  const bundle = (indexHtml.match(/\/assets\/(index-[^"']+\.js)/) || [])[1] ?? null;
  console.log(`[appcap] app-dist đóng băng: bundle=${bundle} freezeAttempts=${fr.attempts}`);
  const server = makeServer(appDist);
  await new Promise((res) => server.listen(opts.port, "127.0.0.1", res));
  console.log(`[appcap] server http://127.0.0.1:${opts.port} rate=${opts.rateKbs} KiB/s`);
  const num = opts.display.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${opts.display}`]).status === 0; } catch {}
    if (alive) console.log(`[appcap] Xvfb: dùng chung display ${opts.display}`);
    else {
      console.log(`[appcap] Xvfb: socket ${sock} mồ côi, xoá và bật mới`);
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
  console.log(`[appcap] chrome: ${chromeBin} (display ${opts.display})`);
  const chrome = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required", "--disable-gpu",
    `--user-data-dir=${opts.scratch}/chrome-profile`, "--window-size=1280,800", "--window-position=0,0",
    "about:blank"],
    { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY: opts.display } });
  chrome.stdout?.on("data", () => {});
  chrome.stdio[2].on("data", (c) => { try { fs.appendFileSync(path.join(opts.scratch, "chrome-stderr.log"), c); } catch {} });
  chrome.stdio[2].on("error", () => {});
  chrome.on("exit", (code, signal) => console.log(`[appcap] chrome exit code=${code} signal=${signal}`));
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
    // App thật sẵn sàng: #root có con + readyState complete (tối đa 90 s dưới tải).
    let appReady = null;
    for (let i = 0; i < 45; i++) {
      await sleep(2000);
      appReady = await cdp.evaluate(`(()=>({rs:document.readyState, rootChildren:document.getElementById("root")?.children.length ?? -1, bodyText:document.body.innerText.length, holdStats:typeof window.__vcutHoldStats}))()`);
      console.log(`[appcap] app poll: ${JSON.stringify(appReady)}`);
      if (appReady.rs === "complete" && appReady.rootChildren > 0) break;
    }
    if (!(appReady?.rs === "complete" && appReady?.rootChildren > 0)) throw new Error(`app không sẵn sàng: ${JSON.stringify(appReady)}`);
    const defined = await cdp.evaluate(PROBE_PAGE_SRC);
    const inst = await cdp.evaluate(`window.__n2PerSeek.install({fps:30})`);
    console.log(`[appcap] probe defined=${defined} install=${inst}`);
    const snapEntries = `(()=>window.__n2PerSeek.entries.map(e=>({k:e.k,targetTime:e.targetTime,status:e.status,samples:e.decodedSamplesWhileSeeking.length,dropped:e.droppedSeekingSamples,rafTicks:e.rafTicksWhileWaiting})))()`;

    // ---- 1. Seek mạng nhỏ giọt trong trang app (2 mốc).
    await cdp.evaluate(`(()=>{const v=document.createElement("video"); v.id="z5net"; v.preload="auto"; v.style.cssText="width:320px;height:180px"; document.body.appendChild(v); v.src="/video.mp4?appcap=1"; window.__z5net=v; return true;})()`);
    for (let i = 0; i < 100; i++) {
      const md = await cdp.evaluate(`(()=>{const v=window.__z5net; return {rs:v.readyState, dur:v.duration, err:v.error?String(v.error.code):null};})()`);
      if (md.rs >= 1 && md.dur > 0) { console.log(`[appcap] net metadata rs=${md.rs} dur=${md.dur}`); break; }
      if (md.err) throw new Error(`net video error ${md.err}`);
      await sleep(200);
    }
    const dripPolls = [];
    for (const t of [25, 5]) {
      console.log(`[appcap] drip seek → ${t}s`);
      await cdp.evaluate(`(()=>{window.__z5net.currentTime=${t}; return window.__z5net.seeking;})()`);
      const t0 = Date.now();
      let last = null;
      while (Date.now() - t0 < opts.seekTimeoutSec * 1000) {
        await sleep(2000);
        last = await cdp.evaluate(`(()=>{const v=window.__z5net; return {seeking:v.seeking, ct:v.currentTime, entries:${snapEntries}};})()`);
        const cur = last.entries[last.entries.length - 1];
        console.log(`[appcap]  +${Math.round((Date.now() - t0) / 1000)}s seeking=${last.seeking} ct=${last.ct?.toFixed(2)} k=${cur?.k} samples=${cur?.samples} dropped=${cur?.dropped}`);
        if (!last.seeking) break;
      }
      dripPolls.push({ target: t, waitSec: Math.round((Date.now() - t0) / 1000), last });
      await sleep(1000);
    }

    // ---- 2. Seek kẹt (endpoint treo).
    await cdp.evaluate(`(()=>{const v=document.createElement("video"); v.id="z5hang"; v.preload="auto"; document.body.appendChild(v); v.src="/video-hang.mp4?appcap=1"; window.__z5hang=v; return true;})()`);
    // ROUND44-Z5: metadata KHÔNG sẵn sau vòng này là lỗi phiên (như lần
    // chạy đầu) — ném ra thay vì đo tiếp trên element chưa có metadata.
    let hangMeta = null;
    for (let i = 0; i < 100; i++) {
      const md = await cdp.evaluate(`(()=>{const v=window.__z5hang; return {rs:v.readyState, dur:v.duration, err:v.error?String(v.error.code):null};})()`);
      if (md.rs >= 1 && md.dur > 0) { hangMeta = md; console.log(`[appcap] hang metadata rs=${md.rs} dur=${md.dur}`); break; }
      if (md.err) throw new Error(`hang video error ${md.err}`);
      await sleep(200);
    }
    if (!hangMeta) throw new Error("hang video không có metadata sau 20 s — endpoint treo chưa cho moov về, không đo seek kẹt được");
    console.log(`[appcap] hang seek → 20s (poll ${opts.hangPollSec}s)`);
    await cdp.evaluate(`(()=>{window.__z5hang.currentTime=20; return window.__z5hang.seeking;})()`);
    const hangPolls = [];
    const hangT0 = Date.now();
    while (Date.now() - hangT0 < opts.hangPollSec * 1000) {
      await sleep(2000);
      const snap = await cdp.evaluate(`(()=>{const v=window.__z5hang; return {seeking:v.seeking, ct:v.currentTime, entries:${snapEntries}};})()`);
      const cur = snap.entries[snap.entries.length - 1];
      hangPolls.push({ atSec: Math.round((Date.now() - hangT0) / 1000), seeking: snap.seeking, samples: cur?.samples, dropped: cur?.dropped });
      console.log(`[appcap]  hang +${Math.round((Date.now() - hangT0) / 1000)}s seeking=${snap.seeking} k=${cur?.k} samples=${cur?.samples} dropped=${cur?.dropped}`);
      if (!snap.seeking) break;
    }
    const hangStillSeeking = hangPolls[hangPolls.length - 1]?.seeking === true;

    // ---- 3. Đối chứng blob local (flat 45 KB → blob: URL → seek 20 s).
    const blobResult = await cdp.evaluate(`(async()=>{const r=await fetch("/video-flat.mp4"); const b=await r.blob(); const u=URL.createObjectURL(b); const v=document.createElement("video"); v.id="z5blob"; v.preload="auto"; document.body.appendChild(v); v.src=u; window.__z5blob=v; for(let i=0;i<100;i++){ if(v.readyState>=1&&v.duration>0) break; await new Promise(r=>setTimeout(r,200)); } const before=window.__n2PerSeek.entries.length; v.currentTime=20; const t0=performance.now(); while(v.seeking && performance.now()-t0<15000){ await new Promise(r=>setTimeout(r,200)); } await new Promise(r=>setTimeout(r,500)); const es=window.__n2PerSeek.entries; const e=es[es.length-1]; return {seeking:v.seeking, ct:v.currentTime, entryCount:es.length, lastEntry: e?{k:e.k,targetTime:e.targetTime,status:e.status,samples:e.decodedSamplesWhileSeeking.length,dropped:e.droppedSeekingSamples}:null};})()`);
    console.log(`[appcap] blob control: ${JSON.stringify(blobResult)}`);

    // App còn đáp ứng sau seek kẹt?
    const alive = await cdp.evaluate(`(()=>({onePlusOne:1+1, rs:document.readyState}))()`);
    const raw = await cdp.evaluate(`window.__n2PerSeek.read()`);
    const entries = raw.entries.map((e) => { const { _el, ...rest } = e; return rest; });
    const validateProblemsTotal = entries.reduce((n, e) => n + validatePerSeekEntry(e).length, 0);
    const perEntry = entries.map((e) => ({
      k: e.k, targetTime: e.targetTime, status: e.status,
      sampleCount: (e.decodedSamplesWhileSeeking || []).length,
      droppedSeekingSamples: e.droppedSeekingSamples ?? 0,
      keptPlusDropped: (e.decodedSamplesWhileSeeking || []).length + (e.droppedSeekingSamples ?? 0),
      rafTicksWhileWaiting: e.rafTicksWhileWaiting ?? null,
      seekLatencyMs: e.seekLatencyMs, seekedEvent: e.seekedEvent,
      flushElementReadyState: e.flushElementReadyState ?? null,
    }));
    const evidence = {
      runAt: stamp(), chrome: chromeBin, display: opts.display, port: opts.port,
      rateKbs: opts.rateKbs, fixture: opts.fixture, flat: opts.flat,
      appBundle: bundle, freezeAttempts: fr.attempts, appReady, probeInstall: inst,
      dripPolls, hangPolls, hangStillSeekingAtRead: hangStillSeeking,
      blobControl: blobResult, appAliveAfterHang: alive,
      entryCount: entries.length, perEntry,
      maxSamplesPerEntry: Math.max(0, ...perEntry.map((e) => e.sampleCount)),
      maxDroppedSeekingSamples: Math.max(0, ...perEntry.map((e) => e.droppedSeekingSamples)),
      capHit: perEntry.some((e) => e.sampleCount >= 1000),
      validateProblemsTotal, counts: raw.counts, droppedOverflow: raw.droppedOverflow,
      rangeRequests: rangeLog.length, rangeLog: rangeLog.slice(-60),
      scope: "app-page-level: element <video> trong trang app thật (dist đóng băng), KHÔNG phải element preview MediaPool — preview chỉ nạp blob local nên seek preview local không thể chậm 40 s (xem đối chứng blob). Mạng chậm là mô phỏng nhỏ giọt có nhật ký range, không phải mạng chậm thật.",
    };
    fs.writeFileSync(path.join(opts.scratch, "app-cap-evidence.json"), JSON.stringify(evidence, null, 2));
    fs.writeFileSync(path.join(opts.scratch, "app-cap-entries.json"), JSON.stringify(entries, null, 2));
    console.log(`[appcap] entries=${entries.length} maxSamples=${evidence.maxSamplesPerEntry} maxDropped=${evidence.maxDroppedSeekingSamples} capHit=${evidence.capHit} validateProblems=${validateProblemsTotal}`);
    console.log(`[appcap] evidence → ${path.join(opts.scratch, "app-cap-evidence.json")}`);
  } finally {
    cleanup();
  }
  process.exit(0);
};
main().catch((e) => { console.error(`BLOCKER: ${e.message}`); process.exit(2); });
