// webkit_loop_d_nopoll_85m4.mjs — Đợt 85 M4: biến thể phân biệt cuối cho clip D.
// Giữ nguyên setup của loopCase gốc (playsInline, listener ended/seeked, play ngay)
// nhưng BỎ vòng poll 100ms (chỉ chờ 12s rồi đọc trạng thái cuối). Nếu D phát hết
// (ended>=1) thì chính vòng poll là tác nhân kẹt; nếu vẫn kẹt ở ~0,18s thì tác
// nhân nằm ở setup khác (playsInline/listener/viewport) — ghi lại để đợt sau tách tiếp.
// Chạy: xvfb-run -a node benchmarks/render/webkit_loop_d_nopoll_85m4.mjs
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const req = createRequire(import.meta.url);
const { webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP_DIR = "/tmp/m4/clips";
const PORT = 8896;
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

async function loopCaseNoPoll(page, clipUrl) {
  return await page.evaluate(async ({ clipUrl }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const endedAt = [];
    let seekedCount = 0;
    v.addEventListener("ended", () => {
      endedAt.push(+performance.now().toFixed(1));
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
    });
    v.addEventListener("seeked", () => seekedCount++);
    let playErr = null;
    try {
      await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]);
    } catch (e) { playErr = String(e && e.message); }
    // KHÔNG poll: chỉ chờ 12s rồi đọc trạng thái cuối.
    await new Promise((r) => setTimeout(r, 12000));
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { duration: v.duration, ended: endedAt.length, seeked: seekedCount,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended,
      finalSeeking: v.seeking, finalRs: v.readyState, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl }, { timeout: 60000 });
}

const browser = await webkit.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
for (const file of ["d_h264_1280x720_4s.mp4", "a_h264_320x180_2s.mp4"]) {
  const raw = await loopCaseNoPoll(page, `${BASE}/${file}`);
  console.log(file, JSON.stringify(raw));
}
await browser.close();
server.close();
process.exit(0);
