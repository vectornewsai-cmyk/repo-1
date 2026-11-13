// webkit_blob_load_90r3.mjs — Phase 9 đợt 90, luồng R3: phân biệt blob-load
// fail do KÍCH THƯỚC hay do BITRATE. Clip d40.mp4: 40 s, 720p, 2 Mbps,
// ~10,2 MB — cùng cỡ file với d8 (10,8 MB) nhưng bitrate thực tế của
// proxy (CRF 23, xem server/render/src/proxy.js), không phải noise
// 21,6 Mbps. Chỉ đo LOAD + phát 8 s (không loop): blob có play được
// không, decode được bao nhiêu frame.
// Chạy: DISPLAY=:199 GST_PLUGIN_PATH=... node benchmarks/render/webkit_blob_load_90r3.mjs [P6|B40|ALL] [RUNS]
// Kết quả append vào benchmarks/results/webkit-blob-load-90r3.json.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const browserType = pw.webkit;
const CLIP_DIR = "/tmp/q6r3/clips";
const BUNDLE_DIR = "/tmp/q6r3/bundle";
const PORT = 8898;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-blob-load-90r3.json");
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
fs.mkdirSync(BUNDLE_DIR, { recursive: true });
execFileSync(path.join(REPO_ROOT, "node_modules/.bin/esbuild"), [
  path.join(REPO_ROOT, "benchmarks/render/webkit-blob-prefetch-entry.ts"),
  "--bundle", "--format=iife", "--platform=browser",
  `--outfile=${path.join(BUNDLE_DIR, "media-pool-bundle.js")}`,
], { stdio: "pipe" });
console.log("BUNDLE OK");

const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
  if (p === "/media-pool-bundle.js") {
    rs.writeHead(200, { "Content-Type": "text/javascript" });
    fs.createReadStream(path.join(BUNDLE_DIR, "media-pool-bundle.js")).pipe(rs);
    return;
  }
  const f = path.join(CLIP_DIR, path.basename(p));
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
  const st = fs.statSync(f);
  const range = rq.headers.range;
  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    const start = m ? +m[1] : 0;
    const end = m && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
    rs.writeHead(206, { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    fs.createReadStream(f, { start, end }).pipe(rs);
  } else {
    rs.writeHead(200, { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Length": st.size });
    fs.createReadStream(f).pipe(rs);
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}`;
const CLIP = `${BASE}/d40.mp4`;

async function withTimeout(p, ms, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(label + "-timeout-" + ms + "ms")), ms); });
  try { return await Promise.race([p, to]); } finally { clearTimeout(timer); }
}

async function runOne(mode) {
  const browser = await withTimeout(browserType.launch({ headless: false }), 60000, "launch");
  try {
    const page = await withTimeout(browser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "newPage");
    try {
      await withTimeout(page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
      if (mode === "P6") {
        await withTimeout(page.addScriptTag({ url: `${BASE}/media-pool-bundle.js` }), 30000, "addScriptTag");
      }
      return await page.evaluate(async ({ clipUrl, mode }) => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        let v, pool = null, item = null, blobReadyMs = null, srcAtPlay = null, poolInfoMode = null;
        if (mode === "P6") {
          pool = new window.__MediaPool();
          item = { id: "m-d40", name: "d40.mp4", kind: "video", url: clipUrl, duration: 40, proxyUrl: clipUrl, proxySizeBytes: 10163225 };
          v = pool.videoFor(item);
          v.muted = true;
          document.body.appendChild(v);
          const tW0 = performance.now();
          while (performance.now() - tW0 < 15000) {
            if (v.src.startsWith("blob:")) { blobReadyMs = Math.round(performance.now() - tW0); break; }
            let info = null;
            try { info = pool.blobPrefetchInfo(item); } catch {}
            if (info && info.mode === "skipped") break;
            await sleep(25);
          }
          srcAtPlay = v.src.startsWith("blob:") ? "blob" : "http";
          try { poolInfoMode = pool.blobPrefetchInfo(item).mode; } catch {}
        } else {
          v = document.createElement("video");
          v.muted = true; v.playsInline = true; v.preload = "auto";
          v.src = clipUrl;
          document.body.appendChild(v);
          srcAtPlay = "http";
        }
        let playErr = null;
        const t0 = performance.now();
        try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
        catch (e) { playErr = String(e && e.message); }
        const samples = [];
        while (performance.now() - t0 < 8000) {
          let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
          samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState, frames: q ? q.totalVideoFrames : null });
          await sleep(100);
        }
        let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
        if (pool && item) { try { poolInfoMode = pool.blobPrefetchInfo(item).mode; } catch {} }
        const out = { mode, srcAtPlay, blobReadyMs, poolInfoMode, playErr,
          finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended,
          totalFrames: q ? q.totalVideoFrames : null, droppedFrames: q ? q.droppedVideoFrames : null,
          finalSrcKind: v.src.startsWith("blob:") ? "blob" : "http", samples };
        v.pause(); v.remove(); v.src = "";
        return out;
      }, { clipUrl: CLIP, mode }, { timeout: 90000 });
    } finally { try { await withTimeout(page.close(), 15000, "pageClose"); } catch {} }
  } finally { try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {} }
}

const results = { date: new Date().toISOString(), cases: [] };
try { const prev = JSON.parse(fs.readFileSync(OUT, "utf8")); if (prev && Array.isArray(prev.cases)) results.cases = prev.cases; } catch {}
const which = (process.argv[2] || "ALL").toUpperCase();
const runs = Math.max(1, parseInt(process.argv[3] || "1", 10));
const startIdx = Math.max(1, parseInt(process.env.Q6_START || "1", 10));
const modes = which === "ALL" ? ["P6", "B40"] : [which];
for (const mode of modes) {
  for (let i = startIdx; i < startIdx + runs; i++) {
    const name = `${mode}-run${i}`;
    let sum;
    try {
      const raw = await runOne(mode);
      const played = raw.totalFrames !== null && raw.totalFrames > 0 && !raw.playErr;
      sum = { mode, srcAtPlay: raw.srcAtPlay, blobReadyMs: raw.blobReadyMs, poolInfoMode: raw.poolInfoMode,
        playOk: played, playErr: raw.playErr, totalFrames: raw.totalFrames, droppedFrames: raw.droppedFrames,
        finalCt: raw.finalCt, finalPaused: raw.finalPaused, finalSrcKind: raw.finalSrcKind,
        ctReached8s: raw.samples.length ? raw.samples[raw.samples.length - 1].ct : null };
    } catch (e) {
      sum = { mode, playOk: false, runError: String(e && e.message).slice(0, 200) };
    }
    results.cases.push({ name, date: new Date().toISOString(), ...sum });
    console.log(name, JSON.stringify(sum));
    await writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
  }
}
server.close();
console.log("DONE", OUT);
