// webkit_loop_d_wait_86n1.mjs — Phase 9 đợt 86, luồng N1 (bổ sung sau P0–P3).
// P0–P3 cho thấy: D kẹt cả khi KHÔNG listener, KHÔNG playsInline, phát
// ngay sau khi tạo element; điểm kẹt thay đổi theo lần chạy (0,3 / 0,486 /
// 0,963); buffered [0,4] đầy đủ lúc kẹt → KHÔNG phải đói buffer mạng.
// Điểm khác duy nhất còn lại so với diag M4 (phát thường chạy tốt, ct 3,03
// sau 3 s): diag CHỜ 8 s rồi mới play. Script này tách yếu tố "chờ":
//  P11 chờ 8 s rồi phát thường (không listener, không playsInline), 3 lần.
//  P12 chờ canplaythrough rồi phát thường (không listener, không
//      playsInline), 3 lần — canplaythrough có đủ thay cho chờ 8 s không?
//  P13 chờ 8 s rồi loop workaround 5 vòng, 1 lần — chờ có cứu được loop W1?
// Chạy: xvfb-run -a node benchmarks/render/webkit_loop_d_wait_86n1.mjs
// Clip ở /tmp/n1/clips. Server HTTP range-support (port 8897). KHÔNG push.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP_DIR = "/tmp/n1/clips";
const PORT = 8897;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-loop-d-wait-86n1.json");
const MIME = { ".mp4": "video/mp4", ".webm": "video/webm", ".html": "text/html" };

const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
  const f = path.join(CLIP_DIR, path.basename(p));
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
  const st = fs.statSync(f);
  const range = rq.headers.range;
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    const start = m ? +m[1] : 0;
    const end = m && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
    rs.writeHead(206, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    fs.createReadStream(f, { start, end }).pipe(rs);
  } else {
    rs.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Accept-Ranges": "bytes", "Content-Length": st.size });
    fs.createReadStream(f).pipe(rs);
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}`;
const D = `${BASE}/d_h264_1280x720_4s.mp4`;

async function plainAfter(page, clipUrl, mode, playWallMs) {
  return await page.evaluate(async ({ clipUrl, mode, playWallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const t0 = performance.now();
    let waitedMs = null;
    if (mode === "wait8s") { await sleep(8000); waitedMs = performance.now() - t0; }
    else if (mode === "canplaythrough") {
      await Promise.race([new Promise((res) => v.addEventListener("canplaythrough", res, { once: true })), sleep(10000)]);
      waitedMs = performance.now() - t0;
    }
    const ev = { stalled: 0, waiting: 0, suspend: 0, progress: 0, timeupdate: 0, canplay: 0, canplaythrough: 0, playing: 0, ended: 0, error: 0 };
    for (const n of Object.keys(ev)) v.addEventListener(n, () => ev[n]++);
    const samples = [];
    const t1 = performance.now();
    let playErr = null;
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { playErr = String(e && e.message); }
    while (performance.now() - t1 < playWallMs) {
      samples.push({ t: +((performance.now() - t1) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const buf = []; try { for (let i = 0; i < v.buffered.length; i++) buf.push([+v.buffered.start(i).toFixed(3), +v.buffered.end(i).toFixed(3)]); } catch {}
    const out = { mode, waitedMs: waitedMs !== null ? +waitedMs.toFixed(0) : null, duration: v.duration, samples, ev, buffered: buf,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, mode, playWallMs }, { timeout: 60000 });
}

async function loopAfterWait8s(page, clipUrl, targetLoops, wallMs) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    await sleep(8000);
    const endedAt = [];
    let seekedCount = 0;
    v.addEventListener("ended", () => {
      endedAt.push(+performance.now().toFixed(1));
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
    });
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { playErr = String(e && e.message); }
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      if (endedAt.length >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
      await sleep(100);
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { mode: "wait8s-loop", duration: v.duration, ended: endedAt.length, seekedCount,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr,
      wallS: samples.length ? samples[samples.length - 1].t : 0 };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, targetLoops, wallMs }, { timeout: wallMs + 60000 });
}

const browser = await webkit.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
const results = { date: new Date().toISOString(), cases: {} };
const summarize = (raw) => {
  const maxCt = Math.max(...raw.samples.map((s) => s.ct));
  const last = raw.samples[raw.samples.length - 1];
  const frozen = raw.samples.length >= 20 && raw.samples.slice(-20).every((s) => Math.abs(s.ct - last.ct) < 0.0015);
  return { mode: raw.mode, waitedMs: raw.waitedMs, duration: raw.duration, maxCt: +maxCt.toFixed(3),
    finalCt: raw.finalCt, finalEnded: raw.finalEnded, finalRs: last.rs, frozenAtEnd: frozen,
    ev: raw.ev, buffered: raw.buffered, totalFrames: raw.quality ? raw.quality.total : null,
    droppedFrames: raw.quality ? raw.quality.dropped : null, playErr: raw.playErr };
};
for (let i = 1; i <= 3; i++) {
  const raw = await plainAfter(page, D, "wait8s", 6000);
  const s = summarize(raw);
  results.cases[`P11-wait8s-plain-rep${i}`] = s;
  console.log(`P11-wait8s-plain-rep${i}`, JSON.stringify(s));
}
for (let i = 1; i <= 3; i++) {
  const raw = await plainAfter(page, D, "canplaythrough", 6000);
  const s = summarize(raw);
  results.cases[`P12-canplaythrough-plain-rep${i}`] = s;
  console.log(`P12-canplaythrough-plain-rep${i}`, JSON.stringify(s));
}
{
  const raw = await loopAfterWait8s(page, D, 5, 42000);
  results.cases["P13-wait8s-loop-5"] = raw;
  console.log("P13-wait8s-loop-5", JSON.stringify(raw));
}
await browser.close();
server.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
console.log("WROTE", OUT);
process.exit(0);
