// webkit_loop_d_rootcause_86n1.mjs — Phase 9 đợt 86, luồng N1: tìm CƠ CHẾ GỐC
// clip D kẹt loop trên WebKitGTK (đợt 85 M4: D 0/40 vòng, ct≈0,176–0,19,
// 5 frame, readyState 4→3→2; phát thường chạy tốt; đã loại trừ chờ
// canplay/canplaythrough + bỏ vòng poll).
//
// Ma trận tách có hệ thống (mỗi ca = 1 page.evaluate, WebKitGTK headed):
//  P0  baseline loop workaround (playsInline + listener ended, viewport
//      1280x800) trên D, 10 vòng — tái hiện.
//  P1  như P0 nhưng playsInline=false — tách playsInline.
//  P2  phát thường 6 s, KHÔNG listener, KHÔNG playsInline, play ngay —
//      D có qua được 0,176 không khi không có listener?
//  P3  phát thường 6 s, KHÔNG listener, playsInline=true, play ngay —
//      tách playsInline ở chế độ phát thường.
//  P4  loop 5 vòng, viewport nhỏ 320x240 — tách viewport.
//  P5  loop 5 vòng, element CSS 320x180 (viewport 1280x800) — tách kích
//      thước element hiển thị.
//  P6  loop 5 vòng trên blob URL (fetch toàn bộ file trước) — tách đói
//      buffer progressive: nếu blob hết kẹt thì do đường tải progressive.
//  P7  loop 5 vòng, restart bằng poll (KHÔNG listener ended) — tách
//      đường sự kiện ended.
//  P8  khôi phục sau kẹt: baseline, khi ct đứng yên ≥2 s thì thử lần lượt
//      seek(0.2)+play, seek(0)+play, load()+play — kẹt có hồi được không,
//      bằng cách nào.
//  P9  pháp y tại điểm kẹt: buffered ranges, networkState, error, các
//      event stalled/waiting/suspend/progress/timeupdate, seekable.
//  P10 đối chứng A loop 10 vòng (mong 10/10).
//  V*  biến thể encode của D, loop 5 vòng, setup baseline: d30 (30 fps),
//      d24fs (faststart/moov đầu), d24g24 (GOP 24), d24crf28 (bitrate
//      thấp), d24base (baseline profile), a24 (A ở 24 fps — tách fps khỏi
//      độ phân giải), d24vp9 (VP9 720p 24 fps), d2s (D 2 s — tách duration).
//
// Chạy: xvfb-run -a node benchmarks/render/webkit_loop_d_rootcause_86n1.mjs [P0|P1|...|V*|ALL]
// Clip ở /tmp/n1/clips (tạo bằng ffmpeg testsrc2, KHÔNG stage binary).
// Server HTTP range-support trong script (port 8899). KHÔNG sửa file sản
// phẩm trừ khi có bằng chứng A/B. KHÔNG push/tag.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP_DIR = "/tmp/n1/clips";
const PORT = 8899;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-loop-d-rootcause-86n1.json");
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

// ---------- helpers chạy trong page ----------
async function loopCase(page, clipUrl, targetLoops, wallMs, opts = {}) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs, opts }) => {
    const v = document.createElement("video");
    v.muted = true;
    if (opts.playsInline !== false) v.playsInline = true;
    v.preload = opts.preload || "auto";
    if (opts.cssSize) { v.style.width = opts.cssSize.w + "px"; v.style.height = opts.cssSize.h + "px"; }
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
        } else { resumeMs.push(null); pendingResume.done = true; pendingResume = null; }
      };
      requestAnimationFrame(tick);
    };
    if (opts.useEndedListener !== false) {
      v.addEventListener("ended", () => {
        const t = performance.now();
        endedAt.push(+t.toFixed(1));
        v.currentTime = 0;
        const p = v.play(); if (p) p.catch(() => {});
        watchResume(t);
      });
    }
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    try {
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
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, targetLoops, wallMs, opts }, { timeout: wallMs + 60000 });
}

// Phát thường (không listener ended): chạy wallMs rồi đọc trạng thái cuối.
async function plainCase(page, clipUrl, wallMs, opts = {}) {
  return await page.evaluate(async ({ clipUrl, wallMs, opts }) => {
    const v = document.createElement("video");
    v.muted = true;
    if (opts.playsInline !== false) v.playsInline = true;
    v.preload = opts.preload || "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const ev = { stalled: 0, waiting: 0, suspend: 0, progress: 0, timeupdate: 0, canplay: 0, canplaythrough: 0, playing: 0, ended: 0, error: 0, emptied: 0 };
    for (const n of Object.keys(ev)) v.addEventListener(n, () => ev[n]++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    try {
      await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]);
    } catch (e) { playErr = String(e && e.message); }
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const buf = []; try { for (let i = 0; i < v.buffered.length; i++) buf.push([+v.buffered.start(i).toFixed(3), +v.buffered.end(i).toFixed(3)]); } catch {}
    const out = { duration: v.duration, samples, ev, buffered: buf, networkState: v.networkState,
      error: v.error ? { code: v.error.code, message: v.error.message } : null,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, wallMs, opts }, { timeout: wallMs + 60000 });
}

// Blob URL: fetch toàn bộ file rồi loop workaround trên blob.
async function blobLoopCase(page, clipUrl, targetLoops, wallMs) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs }) => {
    const buf = await (await fetch(clipUrl)).arrayBuffer();
    const blobUrl = URL.createObjectURL(new Blob([buf], { type: "video/mp4" }));
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = blobUrl;
    document.body.appendChild(v);
    const endedAt = [];
    const resumeMs = [];
    let seekedCount = 0;
    v.addEventListener("ended", () => {
      const t = performance.now();
      endedAt.push(+t.toFixed(1));
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
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      if (endedAt.length >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { fetchedBytes: buf.byteLength, duration: v.duration, samples, endedAt, resumeMs, seekedCount,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = ""; URL.revokeObjectURL(blobUrl);
    return out;
  }, { clipUrl, targetLoops, wallMs }, { timeout: wallMs + 60000 });
}

// Restart bằng poll (không listener ended): kiểm tra ct gần cuối rồi seek 0.
async function pollLoopCase(page, clipUrl, targetLoops, wallMs) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    let loops = 0;
    let seekedCount = 0;
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { playErr = String(e && e.message); }
    let lastCt = 0;
    while (performance.now() - t0 < wallMs) {
      const ct = v.currentTime;
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +ct.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      // poll 50 ms: khi ct chạm gần cuối (hoặc ended) thì restart.
      if ((v.ended || (v.duration && ct >= v.duration - 0.05)) && loops < targetLoops) {
        loops++;
        v.currentTime = 0;
        const p = v.play(); if (p) p.catch(() => {});
      }
      if (loops >= targetLoops && ct > 0.5 && !v.paused) break;
      lastCt = ct;
      await new Promise((r) => setTimeout(r, 50));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { duration: v.duration, samples, loops, seekedCount,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr, lastCt: +lastCt.toFixed(3) };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, targetLoops, wallMs }, { timeout: wallMs + 60000 });
}

// Khôi phục sau kẹt: chờ kẹt (ct đứng yên ≥2 s), thử seek(0.2)+play,
// rồi seek(0)+play, rồi load()+play; ghi lại cái nào hồi được.
async function recoveryCase(page, clipUrl) {
  return await page.evaluate(async ({ clipUrl }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    let endedCount = 0;
    v.addEventListener("ended", () => {
      endedCount++;
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
    });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const t0 = performance.now();
    let playErr = null;
    try { await v.play(); } catch (e) { playErr = String(e && e.message); }
    // Chờ kẹt: ct đứng yên (Δ<0.002) trong 2 s liên tiếp.
    let frozenSince = null, lastCt = -1, stuckAt = null;
    while (performance.now() - t0 < 20000) {
      const ct = v.currentTime;
      if (Math.abs(ct - lastCt) < 0.002 && !v.paused && !v.seeking) {
        if (frozenSince === null) frozenSince = performance.now();
        if (performance.now() - frozenSince >= 2000) { stuckAt = ct; break; }
      } else frozenSince = null;
      lastCt = ct;
      await sleep(100);
    }
    const attempts = [];
    const buf = () => { const b = []; try { for (let i = 0; i < v.buffered.length; i++) b.push([+v.buffered.start(i).toFixed(3), +v.buffered.end(i).toFixed(3)]); } catch {} return b; };
    const snap = () => ({ ct: +v.currentTime.toFixed(3), paused: v.paused, seeking: v.seeking, rs: v.readyState, buffered: buf(), networkState: v.networkState });
    attempts.push({ step: "at-stuck", ...snap() });
    if (stuckAt !== null) {
      // Thử 1: seek 0.2 + play, chờ 3 s xem ct có chạy không.
      v.currentTime = 0.2;
      await v.play().catch(() => {});
      await sleep(3000);
      attempts.push({ step: "seek-0.2+play-3s", ...snap() });
      if (v.currentTime <= 0.21 && !v.ended) {
        // Thử 2: seek 0 + play.
        v.currentTime = 0;
        await v.play().catch(() => {});
        await sleep(3000);
        attempts.push({ step: "seek-0+play-3s", ...snap() });
      }
      if (v.currentTime <= 0.21 && !v.ended) {
        // Thử 3: load() rồi play.
        v.load();
        await sleep(500);
        await v.play().catch(() => {});
        await sleep(3000);
        attempts.push({ step: "load+play-3s", ...snap() });
      }
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { stuckAt, endedCount, attempts,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl }, { timeout: 90000 });
}

// Pháp y tại điểm kẹt: phát thường có listener, lấy mẫu dày + đếm event.
async function forensicCase(page, clipUrl, wallMs) {
  return await page.evaluate(async ({ clipUrl, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const ev = { stalled: 0, waiting: 0, suspend: 0, progress: 0, timeupdate: 0, canplay: 0, canplaythrough: 0, playing: 0, ended: 0, error: 0, emptied: 0, seeking: 0, seeked: 0, loadeddata: 0, loadedmetadata: 0 };
    for (const n of Object.keys(ev)) v.addEventListener(n, () => ev[n]++);
    const samples = [];
    const t0 = performance.now();
    let playErr = null;
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { playErr = String(e && e.message); }
    const buf = () => { const b = []; try { for (let i = 0; i < v.buffered.length; i++) b.push([+v.buffered.start(i).toFixed(3), +v.buffered.end(i).toFixed(3)]); } catch {} return b; };
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState, ns: v.networkState, buf: buf() });
      await new Promise((r) => setTimeout(r, 250));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { duration: v.duration, samples, ev,
      error: v.error ? { code: v.error.code, message: v.error.message } : null,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, wallMs }, { timeout: wallMs + 60000 });
}

function summarizeLoop(raw, targetLoops) {
  const ended = raw.endedAt ? raw.endedAt.length : (raw.loops ?? 0);
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
  return { duration: raw.duration, targetLoops, loopsCompleted: ended,
    resumeMsMedian: med(resume), resumeMsMax: resume.length ? Math.max(...resume) : null,
    resumeNull: (raw.resumeMs || []).filter((x) => x === null).length,
    seekedCount: raw.seekedCount, totalFrames: raw.quality ? raw.quality.total : null,
    droppedFrames: raw.quality ? raw.quality.dropped : null,
    stalls, finalCt: raw.finalCt, finalPaused: raw.finalPaused, finalEnded: raw.finalEnded,
    playErr: raw.playErr, wallS: raw.samples.length ? raw.samples[raw.samples.length - 1].t : 0 };
}

const D = `${BASE}/d_h264_1280x720_4s.mp4`;
const A = `${BASE}/a_h264_320x180_2s.mp4`;
const results = { date: new Date().toISOString(), cases: {} };
const which = process.argv[2] || "ALL";

const browser = await webkit.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
results.env = {
  userAgent: await page.evaluate(() => navigator.userAgent),
  mediaRecorder: await page.evaluate(() => typeof MediaRecorder),
  hardwareConcurrency: await page.evaluate(() => navigator.hardwareConcurrency),
};
console.log("ENV", JSON.stringify(results.env));

async function runCase(name, fn) {
  const raw = await fn();
  results.cases[name] = raw;
  console.log(name, JSON.stringify(raw));
}

const wall5 = (durS) => Math.ceil(durS * 5 * 1000 * 1.6 + 10000);
const wall10 = (durS) => Math.ceil(durS * 10 * 1000 * 1.6 + 15000);

if (which === "ALL" || which === "P0") {
  const raw = await loopCase(page, D, 10, wall10(4));
  await runCase("P0-baseline-D-10loops", () => Promise.resolve(summarizeLoop(raw, 10)));
}
if (which === "ALL" || which === "P1") {
  const raw = await loopCase(page, D, 5, wall5(4), { playsInline: false });
  await runCase("P1-noPlaysInline-D-5loops", () => Promise.resolve(summarizeLoop(raw, 5)));
}
if (which === "ALL" || which === "P2") {
  const raw = await plainCase(page, D, 6000, { playsInline: false });
  await runCase("P2-plain-noListener-noPlaysInline-6s", () => Promise.resolve(raw));
}
if (which === "ALL" || which === "P3") {
  const raw = await plainCase(page, D, 6000, { playsInline: true });
  await runCase("P3-plain-noListener-playsInline-6s", () => Promise.resolve(raw));
}
if (which === "ALL" || which === "P4") {
  const pageSmall = await browser.newPage({ viewport: { width: 320, height: 240 } });
  await pageSmall.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const raw = await loopCase(pageSmall, D, 5, wall5(4));
  await runCase("P4-smallViewport320x240-D-5loops", () => Promise.resolve(summarizeLoop(raw, 5)));
  await pageSmall.close();
}
if (which === "ALL" || which === "P5") {
  const raw = await loopCase(page, D, 5, wall5(4), { cssSize: { w: 320, h: 180 } });
  await runCase("P5-smallElement320x180-D-5loops", () => Promise.resolve(summarizeLoop(raw, 5)));
}
if (which === "ALL" || which === "P6") {
  const raw = await blobLoopCase(page, D, 5, wall5(4));
  await runCase("P6-blobUrl-D-5loops", () => Promise.resolve(summarizeLoop(raw, 5)));
}
if (which === "ALL" || which === "P7") {
  const raw = await pollLoopCase(page, D, 5, wall5(4));
  await runCase("P7-pollRestart-noEndedListener-D-5loops", () => Promise.resolve(summarizeLoop(raw, 5)));
}
if (which === "ALL" || which === "P8") {
  const raw = await recoveryCase(page, D);
  await runCase("P8-recovery-after-stuck-D", () => Promise.resolve(raw));
}
if (which === "ALL" || which === "P9") {
  const raw = await forensicCase(page, D, 12000);
  await runCase("P9-forensic-at-stuck-D-12s", () => Promise.resolve(raw));
}
if (which === "ALL" || which === "P10") {
  const raw = await loopCase(page, A, 10, wall10(2));
  await runCase("P10-control-A-10loops", () => Promise.resolve(summarizeLoop(raw, 10)));
}
if (which === "ALL" || which === "V") {
  const variants = [
    { file: "d30_h264_1280x720_4s.mp4", label: "V-d30fps" },
    { file: "d24fs_h264_1280x720_4s.mp4", label: "V-d24-faststart" },
    { file: "d24g24_h264_1280x720_4s.mp4", label: "V-d24-gop24" },
    { file: "d24crf28_h264_1280x720_4s.mp4", label: "V-d24-crf28" },
    { file: "d24base_h264_1280x720_4s.mp4", label: "V-d24-baseline" },
    { file: "a24_h264_320x180_2s.mp4", label: "V-a24fps" },
    { file: "d24_vp9_1280x720_4s.webm", label: "V-d24-vp9" },
    { file: "d2s_h264_1280x720_2s.mp4", label: "V-d2s-duration" },
  ];
  for (const v of variants) {
    const durS = v.file.includes("_2s") ? 2 : 4;
    const raw = await loopCase(page, `${BASE}/${v.file}`, 5, wall5(durS));
    await runCase(v.label, () => Promise.resolve(summarizeLoop(raw, 5)));
  }
}

await browser.close();
server.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { cases: {} };
prev.cases = { ...prev.cases, ...results.cases };
prev.date = new Date().toISOString();
prev.env = results.env;
writeFileEpermRetry(OUT, JSON.stringify(prev, null, 2));
console.log("WROTE", OUT);
process.exit(0);
