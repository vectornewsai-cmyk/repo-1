// webkit_blob_flaky_97y3.mjs — Phase 9 đợt 97, luồng Y3: retry-play lỗi muộn >3s.
// Nợ gốc: LIMITS gộp đợt 96 §4 mục 3 — error đến muộn >3s chưa tái hiện
// trực tiếp lần nào (max đo được 2,16s trong 128 case X3).
//
// Thiết kế tiêm lỗi muộn (probe-only, lỗi THẬT — không dispatchEvent giả):
// proxyUrl trỏ tới endpoint /slow/ của server probe, server TRÌ HOÃN trả
// body D ms rồi mới trả byte rác (bad.mp4). Element + prefetch fetch đều
// bị chặn D ms; play() gọi NGAY (như app thật) nên error event tới ở
// ~D s sau playCalled. Đường fallback về url thật (clip gốc) + retry-play
// 95W2 là code production nguyên vẹn (media.ts, marker "Đợt 95 W2").
//   ERRBASE    d=0, bad   — đối chứng: lỗi sớm, retry có cứu không
//   LATEBAD4   d=4000, bad — lỗi muộn mục tiêu ~4-5s sau play
//   LATEBAD8   d=8000, bad — lỗi muộn hơn ~8-9s sau play
//   LATEGOOD4  d=4000, good — đối chứng: chỉ delay, không rác → không lỗi
//   LATEBAD4TICK d=4000, bad + app-tick (videoFor + play mỗi 500ms)
// Kết quả append vào benchmarks/results/webkit-blob-flaky-97y3.json.
// Clip tại ~/workspace/round91-s3/clips/. WebKitGTK headed, Xvfb claim 1
// display cho cả lượt (lock đợt 95 W8).
// Chạy: node benchmarks/render/webkit_blob_flaky_97y3.mjs LATEBAD4 [RUNS]
//   (env Q6_START=1 để chạy bù từ run N)
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { claimXvfbDisplay, releaseXvfbDisplay } from "../../apps/web/scripts/xvfb-display.mjs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";

const req = createRequire(import.meta.url);
const pw = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const esbuild = req("/home/hatch/workspace/repo-1/node_modules/esbuild");
const browserType = pw.webkit;
const CLIP_DIR = "/home/hatch/workspace/round91-s3/clips";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(DIR, "../..");
const BUNDLE_DIR = "/home/hatch/workspace/goals/capcut-clone-video-editor/hidden_files/round97-y3/bundle";
const OUT = path.resolve(DIR, "../results/webkit-blob-flaky-97y3.json");
const PORT = 8905;
fs.mkdirSync(BUNDLE_DIR, { recursive: true });
const BAD = fs.readFileSync(path.join(CLIP_DIR, "bad.mp4"));

const server = http.createServer((rq, rs) => {
  const u = new URL(rq.url, "http://x");
  const p = decodeURIComponent(u.pathname);
  if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>probe</title>"); return; }
  if (p.startsWith("/media-pool-bundle") && p.endsWith(".js")) {
    rs.writeHead(200, { "Content-Type": "text/javascript" });
    fs.createReadStream(path.join(BUNDLE_DIR, path.basename(p))).pipe(rs);
    return;
  }
  if (p.startsWith("/slow/")) {
    const file = path.basename(p);
    const d = Math.max(0, parseInt(u.searchParams.get("d") || "0", 10));
    const mode = u.searchParams.get("mode") || "bad";
    const buf = mode === "bad" ? BAD : fs.readFileSync(path.join(CLIP_DIR, file));
    // Tri hoan D ms roi moi tra body (headers cung tri hoan — giong
    // network stall that su, khong phai chi cham body).
    setTimeout(() => {
      rs.writeHead(200, { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Content-Length": buf.length });
      rs.end(buf);
    }, d);
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

// Bundle production that (nguong 8 MiB that) — build moi tu media.ts hien tai.
await esbuild.build({
  entryPoints: [path.join(REPO_ROOT, "benchmarks/render/webkit-blob-prefetch-entry.ts")],
  bundle: true, format: "iife", platform: "browser",
  outfile: path.join(BUNDLE_DIR, "media-pool-bundle.js"), logLevel: "silent",
});
console.log("BUNDLE OK");

const CLIPS = {
  c2: { file: "c2.mp4", dur: 8 }, c4: { file: "c4.mp4", dur: 16 },
  c6: { file: "c6.mp4", dur: 24 }, c8: { file: "c8.mp4", dur: 32 },
};
for (const c of Object.values(CLIPS)) { try { c.bytes = fs.statSync(path.join(CLIP_DIR, c.file)).size; } catch { c.bytes = null; } }

const claim = claimXvfbDisplay();
if (!claim) { console.error("HET DISPLAY Xvfb"); process.exit(3); }
console.log("Xvfb display claimed:", claim.display);
const xvfb = spawn("Xvfb", [claim.display, "-screen", "0", "1280x800x24"], { stdio: "ignore" });
const sock = `/tmp/.X11-unix/X${claim.display.slice(1)}`;
{
  const t0 = Date.now();
  while (!fs.existsSync(sock) && Date.now() - t0 < 15000) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  if (!fs.existsSync(sock)) { console.error("Xvfb không lên socket"); try { xvfb.kill("SIGKILL"); } catch {} releaseXvfbDisplay(claim); process.exit(4); }
}
console.log("Xvfb up on", claim.display, "pid", xvfb.pid);

function withTimeout(p, ms, label) {
  let timer;
  const to = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(label + "-timeout-" + ms + "ms")), ms); });
  try { return Promise.race([p, to]); } finally { clearTimeout(timer); }
}

async function runCase(opts) {
  const browser = await withTimeout(browserType.launch({ headless: false,
    env: { ...process.env, DISPLAY: claim.display, GST_PLUGIN_PATH: "/usr/lib/x86_64-linux-gnu/gstreamer-1.0" } }), 60000, "launch");
  try {
    const page = await withTimeout(browser.newPage({ viewport: { width: 1280, height: 800 } }), 30000, "newPage");
    try {
      await withTimeout(page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 }), 70000, "goto");
      await withTimeout(page.addScriptTag({ url: `${BASE}/media-pool-bundle.js` }), 30000, "addScriptTag");
      const hasPool = await page.evaluate(() => typeof window.__MediaPool);
      if (hasPool !== "function") throw new Error("MediaPool bundle không load được");
      return await page.evaluate(async (o) => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const t0 = performance.now();
        const pool = new window.__MediaPool();
        const item = { id: "m-s3", name: o.clipFile, kind: "video", url: o.clipUrl, duration: o.duration, proxyUrl: o.proxyUrl, proxySizeBytes: o.proxySizeBytes };
        const v = pool.videoFor(item);
        v.muted = true;
        document.body.appendChild(v);
        const evs = [];
        const errEvents = [];
        const stateOf = () => { try { return { rs: v.readyState, ns: v.networkState, ct: +v.currentTime.toFixed(2), paused: v.paused, seeking: v.seeking }; } catch { return {}; } };
        for (const en of ["playing", "pause", "waiting", "stalled", "suspend", "canplay", "canplaythrough", "loadedmetadata", "loadeddata", "loadstart", "progress", "seeking", "seeked", "emptied", "abort"]) {
          v.addEventListener(en, () => { const st = stateOf(); evs.push({ e: en, t: +((performance.now() - t0) / 1000).toFixed(2), rs: st.rs, ns: st.ns, ct: st.ct }); });
        }
        v.addEventListener("error", () => { const st = stateOf(); errEvents.push({ t: +((performance.now() - t0) / 1000).toFixed(2), src: v.src.startsWith("blob:") ? "blob" : "http", code: v.error ? v.error.code : null, msg: v.error ? v.error.message : null, rs: st.rs, ns: st.ns, ct: st.ct }); });
        let appTickTimer = null;
        if (o.appTicks) {
          appTickTimer = setInterval(() => {
            try { const cur = pool.videoFor(item); if (cur && cur !== v) { /* element doi — khong xay ra o mode nay */ } } catch {}
            try { if (v.paused && !v.ended) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } } catch {}
          }, 500);
        }
        // Play NGAY (khong cho blob) — nhu app that; loi se toi muon.
        const playCalledMs = Math.round(performance.now() - t0);
        const playCalledT = (performance.now() - t0) / 1000;
        let playErr = null;
        try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
        catch (e) { playErr = String(e && e.message); }
        const samples = [];
        while (performance.now() - t0 < o.wallMs) {
          let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
          let buf = [];
          try { for (let i = 0; i < v.buffered.length; i++) buf.push([+v.buffered.start(i).toFixed(2), +v.buffered.end(i).toFixed(2)]); } catch {}
          samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, rs: v.readyState, buf, frames: q ? q.totalVideoFrames : null });
          await new Promise((r) => setTimeout(r, 100));
        }
        if (appTickTimer) clearInterval(appTickTimer);
        let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
        const out = { t0ms: t0, playErr, playCalledMs, playCalledT: +playCalledT.toFixed(2),
          retryPlay95W2Fired: v.dataset.retryPlay95W2Fired || null, retryPlay95W2At: v.dataset.retryPlay95W2At || null,
          retryPlay96X3Fired: v.dataset.retryPlay96X3Fired || null, retryPlay96X3At: v.dataset.retryPlay96X3At || null,
          stallWatchdog96X3Fired: v.dataset.stallWatchdog96X3Fired || null,
          finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended,
          finalSrc: v.src.startsWith("blob:") ? "blob" : "http",
          totalFrames: q ? q.totalVideoFrames : null, evs, errEvents, samples };
        v.pause(); v.remove(); v.src = "";
        return out;
      }, opts, { timeout: (opts.wallMs || 20000) + 90000 });
    } finally { try { await withTimeout(page.close(), 15000, "pageClose"); } catch {} }
  } finally { try { await withTimeout(browser.close(), 15000, "browserClose"); } catch {} }
}

const results = { date: new Date().toISOString(), round: "phase9-round97-y3", clips: CLIPS, cases: [] };
try { const prev = JSON.parse(fs.readFileSync(OUT, "utf8")); if (prev && Array.isArray(prev.cases)) results.cases = prev.cases; } catch {}
try {
  const envBrowser = await withTimeout(browserType.launch({ headless: false, env: { ...process.env, DISPLAY: claim.display, GST_PLUGIN_PATH: "/usr/lib/x86_64-linux-gnu/gstreamer-1.0" } }), 60000, "launch");
  try {
    const p = await envBrowser.newPage();
    await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    results.env = { userAgent: await p.evaluate(() => navigator.userAgent) };
    await p.close();
  } finally { try { await envBrowser.close(); } catch {} }
} catch (e) { results.env = { probeErr: String(e && e.message) }; }
console.log("ENV", JSON.stringify(results.env));

function caseEnv() {
  let memAvailMB = null;
  try { const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)\s+kB/); if (m) memAvailMB = Math.round(+m[1] / 1024); } catch {}
  let loadavg = null;
  try { loadavg = os.loadavg().map((x) => +x.toFixed(2)); } catch {}
  return { loadavg, memAvailMB };
}

async function doCase(clipKey, runIdx, modeCfg) {
  const c = CLIPS[clipKey];
  const wallMs = 20000;
  const envAtStart = caseEnv();
  const proxyUrl = `${BASE}/slow/${c.file}?d=${modeCfg.delayMs}&mode=${modeCfg.slowMode}`;
  const raw = await runCase({ clipFile: c.file, clipUrl: `${BASE}/${c.file}`,
    proxyUrl, proxySizeBytes: modeCfg.slowMode === "bad" ? BAD.length : c.bytes,
    duration: c.dur, wallMs, appTicks: !!modeCfg.appTicks });
  const firstErr = raw.errEvents.length ? raw.errEvents[0] : null;
  const errAfterPlayS = firstErr ? +(firstErr.t - raw.playCalledT).toFixed(2) : null;
  const canplayAfterErr = firstErr ? (raw.evs.find((e) => e.e === "canplay" && e.t > firstErr.t)?.t ?? null) : null;
  const playingAfterErr = firstErr ? (raw.evs.find((e) => e.e === "playing" && e.t > firstErr.t)?.t ?? null) : null;
  const retryAtS = raw.retryPlay95W2At !== null ? +((Number(raw.retryPlay95W2At) - raw.t0ms) / 1000).toFixed(2) : (raw.retryPlay96X3At !== null ? +((Number(raw.retryPlay96X3At) - raw.t0ms) / 1000).toFixed(2) : null);
  // Đính chính artifact Y3: retryAtS ở các case trước bản fix này cộng
  // thêm t0 (performance.now() lúc evaluate bắt đầu, ~0,6–1,2s) vì
  // dataset At lưu performance.now() tuyệt đối; từ đây trừ t0ms nên
  // retryAtS khớp đúng thời điểm listener canplay bắn.
  const rescued = !!(firstErr && raw.totalFrames > 0 && raw.finalCt > 1);
  return { mode: modeCfg.name, variant: modeCfg.name, clip: c.file, clipBytes: c.bytes, clipDurS: c.dur,
    delayMs: modeCfg.delayMs, slowMode: modeCfg.slowMode, appTicks: !!modeCfg.appTicks,
    ...envAtStart, run: runIdx,
    playCalledT: raw.playCalledT, playErr: raw.playErr,
    firstErrT: firstErr ? firstErr.t : null, firstErrSrc: firstErr ? firstErr.src : null,
    firstErrCode: firstErr ? firstErr.code : null, errCount: raw.errEvents.length,
    errAfterPlayS, canplayAfterErrT: canplayAfterErr, playingAfterErrT: playingAfterErr,
    retryPlay95W2Fired: raw.retryPlay95W2Fired, retryPlay95W2AtS: raw.retryPlay95W2At !== null ? +((Number(raw.retryPlay95W2At) - raw.t0ms) / 1000).toFixed(2) : null,
    retryPlay96X3Fired: raw.retryPlay96X3Fired, retryPlay96X3AtS: raw.retryPlay96X3At !== null ? +((Number(raw.retryPlay96X3At) - raw.t0ms) / 1000).toFixed(2) : null,
    retryAtS, rescued, stallWatchdog96X3Fired: raw.stallWatchdog96X3Fired,
    totalFrames: raw.totalFrames, finalCt: raw.finalCt, finalPaused: raw.finalPaused,
    finalEnded: raw.finalEnded, finalSrc: raw.finalSrc,
    failKind: raw.totalFrames > 0 ? "ok" : (raw.errEvents.length ? "error-event" : (raw.playErr && String(raw.playErr).includes("timeout") ? "stall-timeout" : "other")),
    evs: raw.evs, errEvents: raw.errEvents, samples: raw.samples };
}

async function pushCase(name, sum) {
  results.cases.push({ name, date: new Date().toISOString(), ...sum });
  console.log(name, JSON.stringify({ firstErrT: sum.firstErrT, errAfterPlayS: sum.errAfterPlayS, retry95: sum.retryPlay95W2Fired, retryAtS: sum.retryAtS, rescued: sum.rescued, frames: sum.totalFrames, finalCt: sum.finalCt, finalSrc: sum.finalSrc, failKind: sum.failKind }));
  await writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
}

const MODES = {
  ERRBASE: { name: "ERRBASE", delayMs: 0, slowMode: "bad" },
  LATEBAD4: { name: "LATEBAD4", delayMs: 4000, slowMode: "bad" },
  LATEBAD8: { name: "LATEBAD8", delayMs: 8000, slowMode: "bad" },
  LATEGOOD4: { name: "LATEGOOD4", delayMs: 4000, slowMode: "good" },
  LATEBAD4TICK: { name: "LATEBAD4TICK", delayMs: 4000, slowMode: "bad", appTicks: true },
};
const rawWhich = (process.argv[2] || "LATEBAD4").trim().toUpperCase();
const runs = Math.max(1, parseInt(process.argv[3] || "1", 10));
const startIdx = Math.max(1, parseInt(process.env.Q6_START || "1", 10));
const modeCfg = MODES[rawWhich];
if (!modeCfg) { console.error("MODE không rõ:", rawWhich, Object.keys(MODES).join("|")); process.exit(2); }
try {
  for (const ck of ["c2", "c4", "c6", "c8"]) {
    for (let j = startIdx; j < startIdx + runs; j++) {
      const name = `${rawWhich}-${ck}-run${j}`;
      try { await pushCase(name, await doCase(ck, j, modeCfg)); }
      catch (e) { await pushCase(name, { mode: rawWhich, clip: CLIPS[ck].file, run: j, runError: String(e && e.message).slice(0, 200) }); }
    }
  }
} finally {
  try { xvfb.kill("SIGTERM"); } catch {}
  setTimeout(() => { try { xvfb.kill("SIGKILL"); } catch {} }, 3000);
  releaseXvfbDisplay(claim);
  server.close();
  console.log("DONE", OUT);
}
