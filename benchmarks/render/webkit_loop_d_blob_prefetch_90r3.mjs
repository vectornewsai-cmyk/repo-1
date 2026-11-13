// webkit_loop_d_blob_prefetch_90r3.mjs — Phase 9 đợt 90, luồng R3:
// validate prefetch blob production (MediaPool.videoFor, media.ts) trên
// WebKit thật: clip D loop 5 vòng qua HTTP progressive (baseline B0)
// vs qua MediaPool + blob prefetch (P1/P2/P3), fallback quá ngưỡng (P4),
// fallback fetch lỗi 404 (P5).
//
// Clip: 1280x720, 4 s, 24 fps, libx264 tại /tmp/q6r3/clips/ (encode lại
// đợt này, KHÔNG stage binary):
//   d.mp4   1.320.168 B (clip D gốc Q6, testsrc2 mặc định)
//   d8.mp4  10.861.619 B (testsrc2 + noise, ~10,4 MiB — trong ngưỡng)
//   d16.mp4 14.273.788 B (testsrc2 + noise, ~13,6 MiB — sát ngưỡng 16 MiB)
//   d32.mp4 34.870.677 B (testsrc2 + noise, ~33,3 MiB — quá ngưỡng)
// Server HTTP có range-support (port 8897) + phục vụ bundle MediaPool.
// WebKitGTK 27.2 headed, Xvfb :199 (đã chạy sẵn) hoặc xvfb-run -a.
// Chạy: DISPLAY=:199 GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
//   node benchmarks/render/webkit_loop_d_blob_prefetch_90r3.mjs <MODE> [RUNS]
// MODE: B0 | P1 | P2 | P3a | P3b | P4 | P5 | ALL (mặc định P1, RUNS mặc định 1)
// Kết quả append vào benchmarks/results/webkit-loop-d-blob-prefetch-90r3.json.
// Pass = đủ 5 vòng ended, không stall >= 1,5 s (như Q6).
//
// Khác Q6: mỗi sample ghi thêm buffered ranges + duration để trả lời
// hậu nghiệm câu hỏi "buffered.end(0) >= duration có tương quan với
// pass không" (JSON Q6 chỉ lưu summary, không có samples/buffered).
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const BROWSER_NAME = (process.env.Q6_BROWSER || "webkit").toLowerCase();
const browserType = BROWSER_NAME === "chromium" ? pw.chromium : pw.webkit;
const CLIP_DIR = "/tmp/q6r3/clips";
const BUNDLE_DIR = "/tmp/q6r3/bundle";
const PORT = 8897;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-loop-d-blob-prefetch-90r3.json");
const MIME = { ".mp4": "video/mp4", ".webm": "video/webm", ".html": "text/html", ".js": "text/javascript" };

// Bundle MediaPool production (media.ts) bằng esbuild trước khi chạy —
// probe đo đúng code production, không reimplement.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
fs.mkdirSync(BUNDLE_DIR, { recursive: true });
try {
  execFileSync(path.join(REPO_ROOT, "node_modules/.bin/esbuild"), [
    path.join(REPO_ROOT, "benchmarks/render/webkit-blob-prefetch-entry.ts"),
    "--bundle", "--format=iife", "--platform=browser",
    `--outfile=${path.join(BUNDLE_DIR, "media-pool-bundle.js")}`,
  ], { stdio: "pipe" });
  console.log("BUNDLE OK", path.join(BUNDLE_DIR, "media-pool-bundle.js"));
} catch (e) {
  console.error("BUNDLE FAIL", String(e && e.message).slice(0, 500));
  process.exit(1);
}

const server = http.createServer((rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
  if (p === "/media-pool-bundle.js") {
    const f = path.join(BUNDLE_DIR, "media-pool-bundle.js");
    rs.writeHead(200, { "Content-Type": "text/javascript" });
    fs.createReadStream(f).pipe(rs);
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
    rs.writeHead(206, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    fs.createReadStream(f, { start, end }).pipe(rs);
  } else {
    rs.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Accept-Ranges": "bytes", "Content-Length": st.size });
    fs.createReadStream(f).pipe(rs);
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}`;

const CLIPS = {
  B0: { file: "d.mp4", bytes: 1320168 },
  B8: { file: "d8.mp4", bytes: 10761335 },
  B16: { file: "d16.mp4", bytes: 14270605 },
  P1: { file: "d.mp4", bytes: 1320168, knownSize: 1320168 },
  P2: { file: "d.mp4", bytes: 1320168, knownSize: undefined },
  P3a: { file: "d8.mp4", bytes: 10761335, knownSize: 10761335 },
  P3b: { file: "d16.mp4", bytes: 14270605, knownSize: 14270605 },
  P4: { file: "d32.mp4", bytes: 34995940, knownSize: 34995940 },
  P5: { file: "d.mp4", bytes: 1320168, knownSize: 1320168, proxyFile: "missing-404.mp4" },
};

function summarize(raw, targetLoops) {
  const ended = raw.endedAt ? raw.endedAt.length : 0;
  const resume = (raw.resumeMs || []).filter((x) => x !== null);
  const med = (a) => a.length ? +a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)].toFixed(1) : null;
  let stalls = [];
  let runStart = null;
  for (let i = 1; i < raw.samples.length; i++) {
    const s = raw.samples[i], p = raw.samples[i - 1];
    const frozen = Math.abs(s.ct - p.ct) < 0.0015 && !s.paused && !s.ended && !s.seeking;
    if (frozen && runStart === null) runStart = p;
    if ((!frozen || i === raw.samples.length - 1) && runStart !== null) {
      const dur = s.t - runStart.t;
      if (dur >= 1.5) stalls.push({ fromT: runStart.t, durS: +dur.toFixed(2), ct: runStart.ct });
      runStart = null;
    }
  }
  // Hậu nghiệm buffered: sample đầu tiên ct > 0,05 — buffered đã đầy
  // tới duration chưa? (Q6 ghi "buffered đầy [[0,4]] ngay từ đầu" nhưng
  // không lưu số — lần này lưu số thật.)
  let bufferedAtFirstPlay = null;
  for (const s of raw.samples) {
    if (s.ct > 0.05) {
      const ends = (s.buf || []).map((r) => r[1]);
      bufferedAtFirstPlay = { t: s.t, ct: s.ct, dur: s.dur, bufEndMax: ends.length ? +Math.max(...ends).toFixed(3) : null, buf: s.buf, full: ends.length ? Math.max(...ends) >= (s.dur || 0) - 0.1 : false };
      break;
    }
  }
  const pass = ended >= targetLoops && stalls.length === 0;
  return { mode: raw.mode, clip: raw.clip, clipBytes: raw.clipBytes, targetLoops, loopsCompleted: ended, pass,
    resumeMsMedian: med(resume), resumeNull: (raw.resumeMs || []).filter((x) => x === null).length,
    seekedCount: raw.seekedCount, restarts: raw.restarts ?? null,
    totalFrames: raw.quality ? raw.quality.total : null, droppedFrames: raw.quality ? raw.quality.dropped : null,
    stalls, srcAtPlay: raw.srcAtPlay ?? null, blobReadyMs: raw.blobReadyMs ?? null,
    poolInfoMode: raw.poolInfoMode ?? null, finalSrcKind: raw.finalSrcKind ?? null,
    bufferedAtFirstPlay, playErr: raw.playErr,
    finalCt: raw.finalCt, finalPaused: raw.finalPaused, finalEnded: raw.finalEnded,
    wallS: raw.samples.length ? raw.samples[raw.samples.length - 1].t : 0 };
}

const results = { date: new Date().toISOString(), cases: [], env: {} };
let prev = null;
try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); if (prev && Array.isArray(prev.cases)) results.cases = prev.cases; } catch {}
// Đợt 90 R3 fix: KHÔNG toUpperCase() cả mode — key CLIPS có chữ thường
// ("P3a"/"P3b"); toUpperCase() làm CLIPS["P3A"] undefined rồi throw
// trong catch-block (CLIPS[mode].file) khiến tiến trình chết lặng,
// không ghi case nào (P3a/P3b lượt đầu mất cả 4 run vì lỗi này).
const rawWhich = (process.argv[2] || "P1").trim();
const whichKey = Object.keys(CLIPS).find((k) => k.toLowerCase() === rawWhich.toLowerCase());
const which = rawWhich.toUpperCase() === "ALL" ? "ALL" : (whichKey ?? rawWhich);
const runs = Math.max(1, parseInt(process.argv[3] || "1", 10));
const startIdx = Math.max(1, parseInt(process.env.Q6_START || "1", 10));
const targetLoops = 5;
const wallMs = Math.ceil(4 * targetLoops * 1000 * 1.6 + 10000);

async function withTimeout(p, ms, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(label + "-timeout-" + ms + "ms")), ms); });
  try { return await Promise.race([p, to]); } finally { clearTimeout(timer); }
}

async function runOne(mode) {
  const clip = CLIPS[mode];
  const browser = await withTimeout(browserType.launch({ headless: false }), 60000, "launch");
  try {
    const page = await withTimeout(browser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "newPage");
    try {
      await withTimeout(page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
      if (!mode.startsWith("B")) {
        await withTimeout(page.addScriptTag({ url: `${BASE}/media-pool-bundle.js` }), 30000, "addScriptTag");
        const hasPool = await page.evaluate(() => typeof window.__MediaPool);
        if (hasPool !== "function") throw new Error("MediaPool bundle không load được: typeof=" + hasPool);
      }
      return await page.evaluate(async ({ clipUrl, proxyUrl, knownSize, targetLoops, wallMs, mode }) => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        let v;
        let pool = null;
        let item = null;
        let blobReadyMs = null;
        let srcAtPlay = null;
        let poolInfoMode = null;
        if (mode.startsWith("B")) {
          v = document.createElement("video");
          v.muted = true; v.playsInline = true; v.preload = "auto";
          v.src = clipUrl;
          document.body.appendChild(v);
          srcAtPlay = "http";
        } else {
          pool = new window.__MediaPool();
          item = { id: "m-d", name: "d.mp4", kind: "video", url: clipUrl, duration: 4, proxyUrl, proxySizeBytes: knownSize };
          v = pool.videoFor(item);
          v.muted = true;
          document.body.appendChild(v);
          // Chờ prefetch: production gọi videoFor từ lúc clip hiện trên
          // timeline, user bấm play sau đó — probe chờ blob tối đa 10 s
          // (dừng sớm khi pool báo skipped) rồi mới play, đúng hành vi
          // app. Ghi blobReadyMs = thời gian fetch+swap thật.
          const tW0 = performance.now();
          while (performance.now() - tW0 < 10000) {
            if (v.src.startsWith("blob:")) { blobReadyMs = Math.round(performance.now() - tW0); break; }
            let info = null;
            try { info = pool.blobPrefetchInfo(item); } catch {}
            if (info && info.mode === "skipped") break;
            await sleep(25);
          }
          srcAtPlay = v.src.startsWith("blob:") ? "blob" : "http";
          try { poolInfoMode = pool.blobPrefetchInfo(item).mode; } catch {}
        }
        const endedAt = [];
        const resumeMs = [];
        let seekedCount = 0;
        let restarts = 0;
        v.addEventListener("seeked", () => seekedCount++);
        const samples = [];
        const t0 = performance.now();
        let playErr = null;
        v.addEventListener("ended", () => {
          const t = performance.now();
          endedAt.push(+t.toFixed(1));
          restarts++;
          v.currentTime = 0;
          const p = v.play(); if (p) p.catch(() => {});
          const tick = () => {
            if (v.currentTime > 0.1 && !v.paused) resumeMs.push(+(performance.now() - t).toFixed(1));
            else if (performance.now() - t < 5000) requestAnimationFrame(tick);
            else resumeMs.push(null);
          };
          requestAnimationFrame(tick);
        });
        try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
        catch (e) { playErr = String(e && e.message); }
        while (performance.now() - t0 < wallMs) {
          let buf = [];
          try { for (let i = 0; i < v.buffered.length; i++) buf.push([+v.buffered.start(i).toFixed(3), +v.buffered.end(i).toFixed(3)]); } catch {}
          samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState, dur: +v.duration.toFixed(3), buf });
          if (endedAt.length >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
        let finalSrcKind = null;
        try { finalSrcKind = v.src.startsWith("blob:") ? "blob" : "http"; } catch {}
        if (pool && item) { try { poolInfoMode = pool.blobPrefetchInfo(item).mode; } catch {} }
        const out = { mode, clip: proxyUrl || clipUrl, clipBytes: 0, samples, endedAt, resumeMs, seekedCount, restarts,
          srcAtPlay, blobReadyMs, poolInfoMode, finalSrcKind,
          quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
          finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
        v.pause(); v.remove(); v.src = "";
        return out;
      }, { clipUrl: `${BASE}/${clip.file}`, proxyUrl: clip.proxyFile ? `${BASE}/${clip.proxyFile}` : `${BASE}/${clip.file}`, knownSize: clip.knownSize, targetLoops, wallMs, mode }, { timeout: wallMs + 60000 });
    } finally {
      try { await withTimeout(page.close(), 15000, "pageClose"); } catch {}
    }
  } finally {
    try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {}
  }
}

// ENV probe trên browser riêng.
try {
  const envBrowser = await withTimeout(browserType.launch({ headless: false }), 60000, "envLaunch");
  try {
    const probePage = await withTimeout(envBrowser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "envNewPage");
    try {
      await withTimeout(probePage.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "envGoto");
      results.env.userAgent = await probePage.evaluate(() => navigator.userAgent);
      results.env.mediaRecorder = await probePage.evaluate(() => typeof MediaRecorder);
      results.env.hardwareConcurrency = await probePage.evaluate(() => navigator.hardwareConcurrency);
      results.env.deviceMemory = await probePage.evaluate(() => navigator.deviceMemory);
      results.env.rvfc = await probePage.evaluate(() => { const v = document.createElement("video"); return typeof v.requestVideoFrameCallback; });
    } finally { try { await withTimeout(probePage.close(), 15000, "envPageClose"); } catch {} }
  } finally { try { await withTimeout(envBrowser.close(), 15000, "envBrowserClose"); } catch {} }
} catch (e) { results.env.probeErr = String(e && e.message); }
console.log("ENV", JSON.stringify(results.env));
const cases = which === "ALL" ? ["B0", "P1", "P2", "P3a", "P3b", "P4", "P5"] : [which];
for (const mode of cases) {
  for (let i = startIdx; i < startIdx + runs; i++) {
    const name = `${mode}-run${i}`;
    let sum;
    try {
      const raw = await runOne(mode);
      raw.clipBytes = CLIPS[mode].bytes;
      sum = summarize(raw, targetLoops);
    } catch (e) {
      sum = { mode, clip: CLIPS[mode]?.file ?? mode, clipBytes: CLIPS[mode]?.bytes ?? null, targetLoops, loopsCompleted: 0, pass: false, runError: String(e && e.message).slice(0, 200) };
    }
    results.cases.push({ name, date: new Date().toISOString(), ...sum });
    console.log(name, JSON.stringify(sum));
    await writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
  }
}
server.close();
console.log("DONE", OUT);
