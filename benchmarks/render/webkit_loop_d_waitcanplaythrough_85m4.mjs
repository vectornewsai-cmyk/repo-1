// webkit_loop_d_waitcanplaythrough_85m4.mjs — Đợt 85 M4: biến thể phân biệt cho clip D.
// Khác loopCase gốc ở đúng 1 điểm: CHỜ sự kiện 'canplaythrough' rồi mới gọi play()
// (bản gốc gọi play() ngay sau khi gán src/append). Nếu D chạy 10/10 ở đây
// thì kẹt là race play-trong-lúc-load của WebKitGTK/GStreamer, không phải file hỏng.
// Chạy: xvfb-run -a node benchmarks/render/webkit_loop_d_waitcanplaythrough_85m4.mjs
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const req = createRequire(import.meta.url);
const { webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP_DIR = "/tmp/m4/clips";
const PORT = 8897;
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

async function loopCaseWaitCanplaythrough(page, clipUrl, targetLoops, wallMs) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const endedAt = [];
    const resumeMs = [];
    let seekedCount = 0;
    let pendingResume = null;
    const watchResume = (endedT) => {
      pendingResume = { endedT, done: false };
      const tick = () => {
        if (!pendingResume || pendingResume.done) return;
        if (v.currentTime > 0.1 && !v.paused) {
          resumeMs.push(+(performance.now() - endedT).toFixed(1));
          pendingResume.done = true; pendingResume = null;
        } else if (performance.now() - endedT < 5000) {
          requestAnimationFrame(tick);
        } else {
          resumeMs.push(null);
          pendingResume.done = true; pendingResume = null;
        }
      };
      requestAnimationFrame(tick);
    };
    v.addEventListener("ended", () => {
      const t = performance.now();
      endedAt.push(+t.toFixed(1));
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
      watchResume(t);
    });
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    let waitedCanplaythrough = false;
    try {
      // ĐIỂM KHÁC DUY NHẤT: chờ canplaythrough rồi mới play().
      await Promise.race([
        new Promise((res) => v.addEventListener("canplaythrough", res, { once: true })),
        new Promise((_, rej) => setTimeout(() => rej(new Error("canplaythrough-timeout-10s")), 10000)),
      ]);
      waitedCanplaythrough = true;
      await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]);
    } catch (e) { playErr = String(e && e.message); }
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      if (endedAt.length >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { duration: v.duration, samples, endedAt, resumeMs, seekedCount,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr, waitedCanplaythrough };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, targetLoops, wallMs }, { timeout: wallMs + 60000 });
}

const browser = await webkit.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
for (const file of ["d_h264_1280x720_4s.mp4", "a_h264_320x180_2s.mp4"]) {
  const raw = await loopCaseWaitCanplaythrough(page, `${BASE}/${file}`, 10, 74000);
  const med = (xs) => { const a = xs.filter((x) => typeof x === "number").sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
  console.log(file, JSON.stringify({ waitedCanplaythrough: raw.waitedCanplaythrough, ended: raw.endedAt.length, resumeMed: med(raw.resumeMs), resumeMax: Math.max(...raw.resumeMs.filter((x) => typeof x === "number")), seeked: raw.seekedCount, totalFrames: raw.quality && raw.quality.total, finalCt: raw.finalCt, playErr: raw.playErr }));
  console.log("  samples[0..9]:", JSON.stringify(raw.samples.slice(0, 10).map((s) => [s.t, s.ct, s.seeking, s.rs])));
}
await browser.close();
server.close();
process.exit(0);
