// webkit_loop_retest_80h5.mjs — Đợt 80 H5: kiểm tra lại 1 điểm dị thường
// ở lượt probe chính: clip D (h264 1280x720 4s) chế độ ended-play-only
// trên WebKit headless kẹt ở currentTime 0.37, totalFrames=4 (trong khi
// D native và D ended-seek cùng lượt vẫn chạy). Nghi là đói decode do
// tải máy lúc đó (load ~10-17), không phải lỗi chế độ loop — chạy lại
// khi tải thấp để phân biệt. Chỉ đo WebKit headless + Chromium headless
// làm đối chứng. Server HTTP 8897 như probe chính.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const FULL = "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
const CLIP_DIR = "/tmp/h5/clips";
const PORT = 8897;
const MIME = { ".mp4": "video/mp4", ".webm": "video/webm", ".html": "text/html" };
const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
  const f = path.join(CLIP_DIR, path.basename(p));
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
  const st = fs.statSync(f);
  rs.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Accept-Ranges": "bytes", "Content-Length": st.size });
  fs.createReadStream(f).pipe(rs);
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}`;
async function loopCase(page, clipUrl, mode, wallMs) {
  return await page.evaluate(async ({ clipUrl, mode, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = clipUrl;
    document.body.appendChild(v);
    let endedCount = 0, seekedCount = 0;
    v.addEventListener("ended", () => { endedCount++; if (mode === "ended-seek") { v.currentTime = 0; const p = v.play(); if (p) p.catch(() => {}); } else if (mode === "ended-play-only") { const p = v.play(); if (p) p.catch(() => {}); } });
    v.addEventListener("seeked", () => seekedCount++);
    if (mode === "native") v.loop = true;
    const samples = [];
    const t0 = performance.now();
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { samples.push({ error: String(e && e.message) }); }
    while (performance.now() - t0 < wallMs) {
      samples.push(+v.currentTime.toFixed(2));
      await new Promise((r) => setTimeout(r, 500));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { mode, duration: v.duration, samples, endedCount, seekedCount, total: q ? q.totalVideoFrames : null, dropped: q ? q.droppedVideoFrames : null, finalCt: +v.currentTime.toFixed(2), finalPaused: v.paused };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, mode, wallMs });
}
const out = { date: new Date().toISOString(), retest: "clip D 1280x720 h264 4s, WebKit headless + Chromium headless control" };
for (const [label, launcher] of [["webkit", () => webkit.launch({ headless: true })], ["chromium", () => chromium.launch({ headless: true, executablePath: FULL, args: ["--no-sandbox"] })]]) {
  const b = await launcher();
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/index.html`);
  out[label] = {};
  for (const mode of ["native", "ended-seek", "ended-play-only"]) {
    // chạy mỗi chế độ 2 lần liên tiếp để xem tính ổn định
    out[label][mode] = [await loopCase(page, `${BASE}/d_h264_1280x720_4s.mp4`, mode, 8000), await loopCase(page, `${BASE}/d_h264_1280x720_4s.mp4`, mode, 8000)];
    console.log(label, mode, JSON.stringify(out[label][mode].map((c) => ({ ended: c.endedCount, total: c.total, finalCt: c.finalCt, samples: c.samples }))));
  }
  await page.close(); await b.close();
}
writeFileEpermRetry("/tmp/h5/retest-d.json", JSON.stringify(out, null, 2));
console.log("WROTE /tmp/h5/retest-d.json");
server.close();
