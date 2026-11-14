// I3 minprobe2 — tách nhỏ điểm chết: element trần / metadata-only / play.
// Không GST, không LD_PRELOAD. Log từng bước.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP = "/home/hatch/workspace/round96-x1/clips-faststart/c2.mp4";
const PORT = 8933;
const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>min2</title>"); return; }
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
const OUT = process.argv[2] || "/tmp/i3-minprobe2.log";
const log = (s) => { const line = new Date().toISOString() + " " + s; console.log(line); fs.appendFileSync(OUT, line + "\n"); };
log("START display=" + process.env.DISPLAY);
const browser = await pw.webkit.launch({ headless: false });
log("browser launched");
browser.on("disconnected", () => log("EVENT browser disconnected"));
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("crash", () => log("EVENT page crash"));
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  log("goto ok");
  log("stepA start: bare <video>, no src, wait 3s");
  const a = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = document.createElement("video");
    v.muted = true;
    document.body.appendChild(v);
    await sleep(3000);
    return { rs: v.readyState, ns: v.networkState };
  }, { timeout: 30000 });
  log("stepA ok " + JSON.stringify(a));
  log("stepB start: src + preload=metadata, wait loadedmetadata (no play)");
  const b = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = document.querySelector("video");
    v.preload = "metadata";
    v.src = "/c2.mp4";
    const t0 = performance.now();
    let ev = null;
    await new Promise((resolve) => {
      const done = (e) => { ev = e; resolve(); };
      v.addEventListener("loadedmetadata", () => done("loadedmetadata"), { once: true });
      v.addEventListener("error", () => done("error"), { once: true });
      setTimeout(() => done("timeout-5s"), 5000);
    });
    return { ev, ms: Math.round(performance.now() - t0), dur: v.duration, vw: v.videoWidth, vh: v.videoHeight, rs: v.readyState };
  }, { timeout: 30000 });
  log("stepB ok " + JSON.stringify(b));
  log("ALL STEPS DONE");
} catch (e) {
  log("FATAL " + String(e && e.message).slice(0, 300));
} finally {
  try { await browser.close(); } catch {}
  server.close();
  log("END");
}
