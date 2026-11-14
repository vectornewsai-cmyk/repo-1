// I3 minprobe — thu hẹp điểm chết của page.evaluate media (đợt 107).
// Không GST, không LD_PRELOAD. Từng bước riêng biệt, log bước nào chết.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP = "/home/hatch/workspace/round96-x1/clips-faststart/c2.mp4";
const PORT = 8932;
const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>min</title>"); return; }
  if (p === "/c2.mp4") {
    const st = fs.statSync(CLIP);
    const range = rq.headers.range;
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      const start = m ? +m[1] : 0;
      const end = m && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      rs.writeHead(206, { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
      fs.createReadStream(CLIP, { start, end }).pipe(rs);
    } else {
      rs.writeHead(200, { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Length": st.size });
      fs.createReadStream(CLIP).pipe(rs);
    }
    return;
  }
  rs.writeHead(404); rs.end();
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const OUT = process.argv[2] || "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round107-i3/i3-minprobe.log";
const log = (s) => { const line = new Date().toISOString() + " " + s; console.log(line); fs.appendFileSync(OUT, line + "\n"); };
const step = process.argv[3] || "all"; // 1|2|3|all
log("START step=" + step + " display=" + process.env.DISPLAY);
const browser = await pw.webkit.launch({ headless: false });
log("browser launched");
browser.on("disconnected", () => log("EVENT browser disconnected"));
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("crash", () => log("EVENT page crash"));
  page.on("console", (m) => log("console " + m.type() + " " + m.text().slice(0, 200)));
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  log("goto ok");
  if (step === "1" || step === "all") {
    const r = await page.evaluate(() => 1 + 1);
    log("step1 trivial evaluate ok r=" + r);
  }
  if (step === "2" || step === "all") {
    log("step2 start: video http progressive, play 5s");
    const r2 = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const v = document.createElement("video");
      v.muted = true; v.preload = "auto"; v.src = "/c2.mp4";
      document.body.appendChild(v);
      await sleep(500);
      const rs0 = v.readyState;
      let playErr = null;
      try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
      catch (e) { playErr = String(e && e.message); }
      await sleep(5000);
      let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
      const out = { rs0, playErr, ct: +v.currentTime.toFixed(3), paused: v.paused, frames: q ? q.totalVideoFrames : null };
      v.pause(); v.remove(); v.src = "";
      return out;
    }, { timeout: 60000 });
    log("step2 ok " + JSON.stringify(r2));
  }
  if (step === "3" || step === "all") {
    log("step3 start: fetch blob + blob URL + play 5s");
    const r3 = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const buf = await (await fetch("/c2.mp4")).arrayBuffer();
      const burl = URL.createObjectURL(new Blob([buf], { type: "video/mp4" }));
      const v = document.createElement("video");
      v.muted = true; v.preload = "auto"; v.src = burl;
      document.body.appendChild(v);
      await sleep(500);
      let playErr = null;
      try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
      catch (e) { playErr = String(e && e.message); }
      await sleep(5000);
      let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
      const out = { blobBytes: buf.byteLength, playErr, ct: +v.currentTime.toFixed(3), paused: v.paused, frames: q ? q.totalVideoFrames : null };
      v.pause(); v.remove(); v.src = "";
      return out;
    }, { timeout: 60000 });
    log("step3 ok " + JSON.stringify(r3));
  }
  log("ALL STEPS DONE");
} catch (e) {
  log("FATAL " + String(e && e.message).slice(0, 300));
} finally {
  try { await browser.close(); } catch {}
  server.close();
  log("END");
}
