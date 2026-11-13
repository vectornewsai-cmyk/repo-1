// webkit_loop_d_watchdog_86n1.mjs — Phase 9 đợt 86, luồng N1: A/B cho cách
// sửa tối thiểu. Cơ chế đã tách xong (xem LIMITS): kẹt là race khởi động/
// preroll của pipeline GStreamer với nguồn HTTP progressive — ct đứng yên
// trong ~1 s đầu, rs 4→3→2, buffered [0,4] đầy đủ từ đầu; chờ 8 s trước
// play đầu thì hết kẹt (P11 3/3) nhưng mỗi lần restart loop lại mở race
// mới (P13 3/5); seek tiến + play HỒI được kẹt (P8: 0,18 → 3,25 trong 3 s).
// A/B: loop workaround 5 vòng trên D, CÓ vs KHÔNG watchdog — watchdog poll
// ct mỗi 100 ms, nếu ct đứng yên ≥2 s trong lúc !paused && !ended &&
// !seeking thì seek(ct+0,2) + play (tối đa 3 lần cứu / vòng). Mỗi nhánh
// chạy 2 lần. Nếu watchdog → 5/5 cả 2 lần (baseline 0/5) thì đủ bằng chứng
// để đưa watchdog tương đương vào preview.tsx (syncMedia).
// Chạy: GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0 xvfb-run -a
//   node benchmarks/render/webkit_loop_d_watchdog_86n1.mjs
// Clip ở /tmp/n1/clips. Server HTTP range-support (port 8894). KHÔNG push.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP_DIR = "/tmp/n1/clips";
const PORT = 8894;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-loop-d-watchdog-86n1.json");
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

async function loopWithWatchdog(page, clipUrl, targetLoops, wallMs, useWatchdog) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs, useWatchdog }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const endedAt = [];
    const resumeMs = [];
    const rescues = [];
    let seekedCount = 0;
    let lastCt = -1, frozenSince = null, rescueCount = 0;
    v.addEventListener("ended", () => {
      const t = performance.now();
      endedAt.push(+t.toFixed(1));
      rescueCount = 0; // vòng mới: reset ngân sách cứu
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
      const tick = () => {
        if (v.currentTime > 0.1 && !v.paused) resumeMs.push(+(performance.now() - t).toFixed(1));
        else if (performance.now() - t < 5000) requestAnimationFrame(tick);
        else resumeMs.push(null);
      };
      requestAnimationFrame(tick);
    });
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { playErr = String(e && e.message); }
    while (performance.now() - t0 < wallMs) {
      const ct = v.currentTime;
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +ct.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      if (useWatchdog && !v.paused && !v.ended && !v.seeking) {
        if (Math.abs(ct - lastCt) < 0.002) {
          if (frozenSince === null) frozenSince = performance.now();
          else if (performance.now() - frozenSince >= 2000 && rescueCount < 3) {
            const from = ct;
            const to = Math.min(v.duration - 0.05, ct + 0.2);
            rescueCount++;
            rescues.push({ atT: +((performance.now() - t0) / 1000).toFixed(2), from: +from.toFixed(3), to: +to.toFixed(3) });
            v.currentTime = to;
            const p = v.play(); if (p) p.catch(() => {});
            frozenSince = null; lastCt = -1;
          }
        } else { frozenSince = null; }
      }
      lastCt = ct;
      if (endedAt.length >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { useWatchdog, duration: v.duration, ended: endedAt.length, rescues,
      resumeMs, seekedCount, quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr,
      wallS: samples.length ? samples[samples.length - 1].t : 0 };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, targetLoops, wallMs, useWatchdog }, { timeout: wallMs + 60000 });
}

const browser = await webkit.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
const results = { date: new Date().toISOString(), cases: {} };
const WALL = 42000;
for (const useWatchdog of [false, true, false, true]) {
  const rep = useWatchdog ? `watchdog-rep${Object.keys(results.cases).filter((k) => k.startsWith("W")).length + 1}` : `baseline-rep${Object.keys(results.cases).filter((k) => k.startsWith("B")).length + 1}`;
  const raw = await loopWithWatchdog(page, D, 5, WALL, useWatchdog);
  const key = useWatchdog ? `W-${rep}` : `B-${rep}`;
  results.cases[key] = raw;
  console.log(key, JSON.stringify(raw));
}
await browser.close();
server.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
console.log("WROTE", OUT);
process.exit(0);
