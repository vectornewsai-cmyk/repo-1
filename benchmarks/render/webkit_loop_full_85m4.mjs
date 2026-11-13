// webkit_loop_full_85m4.mjs — Phase 9 đợt 85, luồng M4: chạy LẠI probe loop
// W1 của đợt 84 L10 (không đổi logic đo) để xác nhận workaround loop vẫn
// 10/10 vòng sau khi đợt này thêm dấu vết mức tick vào preview.tsx
// (xem docs/PHASE9_ROUND85_M4_WEBKIT_W7_W6_LIMITS.md). Probe gốc:
// benchmarks/render/webkit_loop_full_84l10.mjs — chỉ đổi CLIP_DIR
// (/tmp/m4/clips, encode lại vì /tmp/l10 đã mất) + file kết quả OUT
// (webkit-loop-full-85m4.json, KHÔNG ghi đè file L10).
//
// Phạm vi (xem docs/PHASE9_ROUND84_L10_WEBKIT_LOOP_W1_LIMITS.md):
//  - Workaround `ended → seek(0) + play()` trên element video THÔ (gắn DOM,
//    tránh W5): loop 10 vòng liên tiếp trên 6 clip (ngắn/dài, có/không audio,
//    H.264 + VP9, tới 720p) — đếm số vòng thực tế (ended events), đo độ trễ
//    resume sau mỗi lần ended (rAF, ms), phát hiện kẹt (ct đứng yên > 1,5 s).
//  - Đối chứng native `loop=true` (W3 còn tái hiện không) + Chromium headed.
//  - Trường hợp biên trên WebKitGTK: E1 seek giữa vòng loop, E2 pause/resume
//    giữa loop, E3 dừng ở cuối (không restart giả sau khi dừng).
//  - MediaRecorder: ghi rõ typeof + phiên bản WebKitGTK đo được.
// Chạy: xvfb-run -a node benchmarks/render/webkit_loop_full_85m4.mjs
// Clip ở /tmp/m4/clips (tạo bằng ffmpeg testsrc2, KHÔNG stage binary).
// Server HTTP đa luồng trong script (port 8898). Guard timeout wall-clock
// từng ca. KHÔNG sửa file sản phẩm, KHÔNG push/tag.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const FULL = "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
const CLIP_DIR = "/tmp/m4/clips";
const PORT = 8898;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-loop-full-85m4.json");

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

/**
 * Một ca loop workaround: chạy tới `targetLoops` lần ended (mỗi lần ended
 * là 1 vòng hoàn thành) rồi dừng; đo độ trễ resume sau mỗi lần ended bằng
 * rAF (thời gian từ ended tới mẫu đầu tiên có currentTime > 0.1).
 * Trả về dữ liệu thô để phía Node tóm tắt (không kết luận trong page).
 */
async function loopCase(page, clipUrl, targetLoops, wallMs) {
  return await page.evaluate(async ({ clipUrl, targetLoops, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v); // gắn DOM: tránh W5 (tách DOM không decode)
    const endedAt = []; // performance.now() mỗi lần ended
    const resumeMs = []; // độ trễ resume sau mỗi lần ended (rAF)
    let seekedCount = 0;
    let pendingResume = null; // { endedT, done }
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
          resumeMs.push(null); // không resume trong 5 s
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
    try {
      await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]);
    } catch (e) { playErr = String(e && e.message); }
    // Lấy mẫu 100 ms cho tới khi đủ vòng (ended cuối + ct đã qua 0.5 ở vòng
    // sau) hoặc hết wall-clock.
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking, rs: v.readyState });
      const lastEnded = endedAt.length;
      if (lastEnded >= targetLoops && v.currentTime > 0.5 && !v.paused) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { duration: v.duration, samples, endedAt, resumeMs, seekedCount,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, playErr };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, targetLoops, wallMs }, { timeout: wallMs + 60000 });
}

function summarizeLoop(raw, targetLoops) {
  const ended = raw.endedAt.length;
  const loops = ended; // mỗi ended = 1 vòng hoàn thành
  // Khoảng giữa các lần ended liên tiếp (trừ vòng đầu: từ lúc phát tới ended 1).
  const gaps = [];
  for (let i = 1; i < raw.endedAt.length; i++) gaps.push(+((raw.endedAt[i] - raw.endedAt[i - 1]) / 1000).toFixed(2));
  const resume = raw.resumeMs.filter((x) => x !== null);
  const resumeNull = raw.resumeMs.filter((x) => x === null).length;
  const med = (a) => a.length ? +a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)].toFixed(1) : null;
  // Kẹt: ct đứng yên (±0.001) trên 1,5 s liên tiếp trong lúc playing, không ended/seeking.
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
  const stuckAtZero = raw.samples.length >= 15 && raw.samples.slice(-15).every((s) => s.ct === 0 && !s.paused);
  return { duration: raw.duration, targetLoops, loopsCompleted: loops,
    endedCount: ended, resumeMsMedian: med(resume), resumeMsMax: resume.length ? Math.max(...resume) : null,
    resumeMsAll: raw.resumeMs, resumeNull, interLoopGapSMedian: med(gaps), interLoopGapSAll: gaps,
    seekedCount: raw.seekedCount, totalFrames: raw.quality ? raw.quality.total : null,
    droppedFrames: raw.quality ? raw.quality.dropped : null,
    stalls, stuckAtZero, finalCt: raw.finalCt, finalPaused: raw.finalPaused,
    finalEnded: raw.finalEnded, playErr: raw.playErr,
    wallS: raw.samples.length ? raw.samples[raw.samples.length - 1].t : 0 };
}

/** Đối chứng native loop=true (W3): wall ngắn, chỉ xem có kẹt không. */
async function nativeCase(page, clipUrl, wallMs) {
  return await page.evaluate(async ({ clipUrl, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.loop = true;
    v.src = clipUrl;
    document.body.appendChild(v);
    let endedCount = 0; v.addEventListener("ended", () => endedCount++);
    const samples = [];
    const t0 = performance.now();
    try { await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]); }
    catch (e) { samples.push({ error: String(e && e.message) }); }
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(2), paused: v.paused, ended: v.ended });
      await new Promise((r) => setTimeout(r, 500));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const wraps = samples.reduce((n, s, i) => (i > 0 && s.ct < samples[i - 1].ct - 0.5 ? n + 1 : n), 0);
    const stuckAtZero = samples.length >= 4 && samples.slice(-4).every((s) => s.ct === 0 && !s.paused);
    const frozenEnd = samples.length >= 4 && samples.slice(-4).every((s) => s.ct === v.duration && !s.paused);
    const out = { duration: v.duration, wraps, endedCount, stuckAtZero, frozenAtEnd: frozenEnd,
      totalFrames: q ? q.totalVideoFrames : null, finalCt: +v.currentTime.toFixed(2), finalPaused: v.paused, samplesCt: samples.map((s) => s.ct) };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, wallMs }, { timeout: wallMs + 60000 });
}

/** Trường hợp biên E1/E2/E3 trên WebKitGTK, clip A (2 s). */
async function edgeCase(page, clipUrl, which) {
  return await page.evaluate(async ({ clipUrl, which }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const endedAt = [];
    let stopped = false; // E3: sau đủ vòng thì không restart nữa
    let seekedCount = 0;
    v.addEventListener("ended", () => {
      endedAt.push(+performance.now().toFixed(1));
      if (stopped) return;
      v.currentTime = 0;
      const p = v.play(); if (p) p.catch(() => {});
    });
    v.addEventListener("seeked", () => seekedCount++);
    const samples = [];
    const t0 = performance.now();
    const sample = () => samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(3), paused: v.paused, ended: v.ended, seeking: v.seeking });
    try { await v.play(); } catch (e) { samples.push({ error: String(e && e.message) }); }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitEnded = async (n, timeoutMs) => {
      const t1 = performance.now();
      while (endedAt.length < n && performance.now() - t1 < timeoutMs) { sample(); await sleep(100); }
      return endedAt.length >= n;
    };
    const log = [];
    if (which === "E1") {
      // Seek giữa vòng loop: sau 3 vòng, lúc ct ~1.0 (giữa vòng 4) seek tới 1.0.
      if (!await waitEnded(3, 30000)) log.push("khong-du-3-vong-trong-30s");
      await sleep(500); sample();
      v.currentTime = 1.0; log.push(`seek-giua-vong: ct truoc=${v.currentTime}`);
      await sleep(300); sample();
      log.push(`sau-seek: ct=${v.currentTime} seeking=${v.seeking} paused=${v.paused}`);
      if (!await waitEnded(6, 30000)) log.push("khong-du-6-vong-trong-30s");
    } else if (which === "E2") {
      // Pause/resume giữa loop: sau 5 vòng, pause 1.5 s rồi play tiếp tới 8 vòng.
      if (!await waitEnded(5, 40000)) log.push("khong-du-5-vong-trong-40s");
      v.pause(); log.push(`pause: ct=${v.currentTime} paused=${v.paused}`);
      await sleep(1500); sample();
      log.push(`sau-1.5s-pause: ct=${v.currentTime} paused=${v.paused}`);
      await v.play(); log.push(`resume: paused=${v.paused}`);
      if (!await waitEnded(8, 40000)) log.push("khong-du-8-vong-trong-40s");
    } else if (which === "E3") {
      // Dừng ở cuối: đủ 10 vòng thì tắt restart, chờ 2 s, kiểm tra không
      // restart giả (endedCount đứng yên, element ended/paused).
      if (!await waitEnded(10, 60000)) log.push("khong-du-10-vong-trong-60s");
      stopped = true;
      const nAtStop = endedAt.length;
      // Vòng 10 đã ended + restart rồi (handler chạy trước khi stopped=true
      // nếu ended thứ 10 bắn trước lúc set) — chờ vòng 11 ended rồi mới đo.
      const t1 = performance.now();
      while (performance.now() - t1 < 8000) { sample(); await sleep(100); if (endedAt.length > nAtStop) break; }
      const nAfter = endedAt.length;
      stopped = true;
      // Từ đây handler không restart nữa; chờ thêm 2 s rồi đo lần cuối.
      await sleep(2000); sample();
      log.push(`ended-tai-dung=${nAtStop} ended-sau-vong-tiep=${nAfter} ended-cuoi=${endedAt.length} finalCt=${v.currentTime} paused=${v.paused} ended=${v.ended}`);
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { which, endedCount: endedAt.length, endedAt, seekedCount, log,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(3), finalPaused: v.paused, finalEnded: v.ended, samples };
    v.pause(); v.remove(); v.src = "";
    return out;
  }, { clipUrl, which }, { timeout: 180000 });
}

const clips = [
  { file: "a_h264_320x180_2s.mp4", label: "A h264 320x180 2s 30fps no-audio" },
  { file: "b_h264_640x360_3s.mp4", label: "B h264 640x360 3s 30fps no-audio" },
  { file: "c_vp9_320x180_2s.webm", label: "C vp9 320x180 2s 30fps no-audio" },
  { file: "d_h264_1280x720_4s.mp4", label: "D h264 1280x720 4s 24fps no-audio" },
  { file: "e_h264_640x360_10s_audio.mp4", label: "E h264 640x360 10s 30fps WITH-audio (sine 440Hz AAC)" },
  { file: "f_h264_320x180_10s.mp4", label: "F h264 320x180 10s 30fps no-audio" },
];
for (const cl of clips) {
  if (!fs.existsSync(path.join(CLIP_DIR, cl.file))) { console.log("MISSING CLIP", cl.file); process.exit(1); }
}
const TARGET_LOOPS = 10;
const results = { date: new Date().toISOString(), targetLoops: TARGET_LOOPS, clips: clips.map((c) => c.label), engines: {} };

async function runEngine(browser, label) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/index.html`);
  const eng = { loop: {}, native: {}, edges: {}, env: {} };
  eng.env.mediaRecorder = await page.evaluate(() => typeof MediaRecorder);
  eng.env.userAgent = await page.evaluate(() => navigator.userAgent);
  eng.env.hardwareConcurrency = await page.evaluate(() => navigator.hardwareConcurrency);
  for (const cl of clips) {
    const wallMs = Math.ceil(cl.file.includes("_10s") ? 10 * TARGET_LOOPS * 1000 * 1.6 + 15000 : cl.file.includes("_4s") ? 4 * TARGET_LOOPS * 1000 * 1.6 + 10000 : cl.file.includes("_3s") ? 3 * TARGET_LOOPS * 1000 * 1.6 + 10000 : 2 * TARGET_LOOPS * 1000 * 1.6 + 10000);
    const raw = await loopCase(page, `${BASE}/${cl.file}`, TARGET_LOOPS, wallMs);
    eng.loop[cl.file] = summarizeLoop(raw, TARGET_LOOPS);
    console.log(label, cl.file, "workaround-10loops", JSON.stringify(eng.loop[cl.file]));
  }
  // Đối chứng native loop=true (wall 8 s, clip A-D).
  for (const cl of clips.slice(0, 4)) {
    const raw = await nativeCase(page, `${BASE}/${cl.file}`, 8000);
    eng.native[cl.file] = raw;
    console.log(label, cl.file, "native", JSON.stringify(raw));
  }
  await page.close();
  return eng;
}

async function runEdges(browser, label) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/index.html`);
  const edges = {};
  for (const which of ["E1", "E2", "E3"]) {
    const raw = await edgeCase(page, `${BASE}/a_h264_320x180_2s.mp4`, which);
    edges[which] = raw;
    console.log(label, which, JSON.stringify({ endedCount: raw.endedCount, log: raw.log, finalCt: raw.finalCt, finalPaused: raw.finalPaused, finalEnded: raw.finalEnded, totalFrames: raw.quality && raw.quality.total }));
  }
  await page.close();
  return edges;
}

let b = await webkit.launch({ headless: false });
results.engines["webkit-headed"] = { version: b.version(), ...(await runEngine(b, "WEBKIT-HEADED")) };
results.engines["webkit-headed"].edges = await runEdges(b, "WEBKIT-HEADED-EDGE");
await b.close();
b = await chromium.launch({ headless: false, executablePath: FULL, args: ["--no-sandbox"] });
results.engines["chromium-headed"] = { version: b.version(), ...(await runEngine(b, "CHROMIUM-HEADED")) };
await b.close();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
console.log("WROTE", OUT);
server.close();
