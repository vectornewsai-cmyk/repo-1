// webkit_seek_audiograph_86n3.mjs — Phase 9 đợt 86, luồng N3: W6 (b) —
// audio graph có góp phần làm seek chậm không?
//
// Câu hỏi mở lớn nhất còn lại của M4 đợt 85: MediaElementSource được
// nối vào cả clip video KHÔNG có audio (collectActives đẩy mọi video
// clip vào audioSources → engine.update() → nodeFor() tạo source).
// Probe này đo seekedMs theo 2 chiều:
//   - clip: CÓ audio (AAC 440 Hz) vs KHÔNG audio (cùng encode video).
//   - graph: g0 không graph + muted (baseline) | g1 graph đầy đủ y hệt
//     audioEngine.ts (lowshelf 100 Hz → highshelf 3000 Hz → comp
//     (thr 0/ratio 1) → gain 1 → master → analyser → destination),
//     element volume=1 muted=false | g2 graph + gain 0 (track mute)
//     | g3 không graph + unmuted (tiếng ra loa/dummy sink).
//   - churn: draw (rAF play()+drawImage như app) vs nochurn.
// AudioContext được tạo sau 1 cú click chuột thật (user gesture) để
// không bị suspended; ghi lại ctx.state. Không dùng rVFC (không bắn
// trên WebKitGTK — M4 đã chứng minh) nên chỉ đo seekedMs + ct sau 500 ms.
//   Chạy: ENGINE=webkit|chromium xvfb-run -a node
//         benchmarks/render/webkit_seek_audiograph_86n3.mjs
// Clip ở /tmp/n3/clips (KHÔNG stage binary). KHÔNG sửa file sản phẩm.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const PW = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const ENGINE = process.env.ENGINE || "webkit";
const CLIP_DIR = process.env.N3_SEEK_CLIP_DIR || "/tmp/n3/clips";
const PORT = Number(process.env.N3_PORT || 8902);
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../results/webkit-seek-audiograph-86n3-${ENGINE}.json`,
);

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function median(xs) {
  const a = xs.filter((x) => typeof x === "number").sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

async function runCase(page, clipUrl, positions, churn, audio, reps) {
  return await page.evaluate(async ({ clipUrl, positions, churn, audio, reps }) => {
    const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (cond, timeoutMs) => {
      const t0 = performance.now();
      while (performance.now() - t0 < timeoutMs) {
        if (cond()) return performance.now() - t0;
        await sleep2(25);
      }
      return null;
    };
    const v = document.createElement("video");
    v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const sleep3 = sleep2;
    try {
      await Promise.race([
        new Promise((res, rej) => { v.addEventListener("loadedmetadata", res, { once: true }); v.addEventListener("error", () => rej(new Error("load-error")), { once: true }); }),
        sleep3(15000).then(() => { throw new Error("metadata-timeout"); }),
      ]);
    } catch (e) {
      v.pause(); v.remove(); v.src = "";
      return { error: String(e && e.message), seeks: [] };
    }
    const dur = v.duration;
    // --- dựng audio graph y hệt audioEngine.ts (g1/g2) ---
    let ctxState = null, graphError = null, audioCtx = null;
    let perGain = null;
    if (audio === "g1" || audio === "g2") {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.resume().catch(() => {});
        const src = audioCtx.createMediaElementSource(v);
        const low = audioCtx.createBiquadFilter();
        low.type = "lowshelf"; low.frequency.value = 100; low.gain.value = 0;
        const high = audioCtx.createBiquadFilter();
        high.type = "highshelf"; high.frequency.value = 3000; high.gain.value = 0;
        const comp = audioCtx.createDynamicsCompressor();
        comp.threshold.value = 0; comp.ratio.value = 1;
        perGain = audioCtx.createGain();
        perGain.gain.value = audio === "g2" ? 0 : 1;
        const master = audioCtx.createGain();
        master.gain.value = 1;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(low); low.connect(high); high.connect(comp);
        comp.connect(perGain); perGain.connect(master);
        master.connect(analyser); analyser.connect(audioCtx.destination);
        v.volume = 1; v.muted = false;
        ctxState = audioCtx.state;
      } catch (e) { graphError = String(e && e.message); }
    } else if (audio === "g0") {
      v.muted = true;
    } else { // g3: không graph, unmuted
      v.muted = false; v.volume = 1;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 180;
    const cctx = canvas.getContext("2d");
    document.body.appendChild(canvas);
    let stop = false;
    let ticks = 0;
    let playErr = null;
    const loop = () => {
      if (stop) return;
      ticks++;
      try {
        if (v.paused) { const p = v.play(); if (p) p.catch((e) => { playErr = String(e && e.message); }); }
        if (v.readyState >= 2) cctx.drawImage(v, 0, 0, 320, 180);
      } catch {}
      requestAnimationFrame(loop);
    };
    if (churn === "draw") requestAnimationFrame(loop);
    try { await v.play(); } catch (e) { playErr = String(e && e.message); }
    await waitFor(() => v.currentTime > 0.2 && !v.paused, 10000);
    const seeks = [];
    for (let rep = 0; rep < reps; rep++) {
      for (const pos of positions) {
        const target = +(pos * dur).toFixed(3);
        await waitFor(() => !v.seeking && v.currentTime > 0.05, 5000);
        const t0 = performance.now();
        let seekedMs = null;
        const seekedP = new Promise((res) => {
          const h = () => { seekedMs = performance.now() - t0; v.removeEventListener("seeked", h); res(); };
          v.addEventListener("seeked", h);
          setTimeout(() => { v.removeEventListener("seeked", h); res(); }, 20000);
        });
        v.currentTime = target;
        await seekedP;
        await sleep2(500);
        seeks.push({
          rep, target,
          seekedMs: seekedMs === null ? null : Math.round(seekedMs),
          timeout: seekedMs === null,
          ctAfter: +v.currentTime.toFixed(3),
          seekingAfter: v.seeking,
          readyStateAfter: v.readyState,
        });
        await sleep2(300);
      }
    }
    stop = true;
    const out = { duration: dur, ticks, ctxState, graphError, playErr, seeks };
    try { if (audioCtx) await audioCtx.close(); } catch {}
    v.pause(); v.remove(); v.src = ""; canvas.remove();
    return out;
  }, { clipUrl, positions, churn, audio, reps }, { timeout: 600000 });
}

async function main() {
  const browser = await PW[ENGINE].launch({ headless: false, ...(ENGINE === "webkit" ? { env: { ...process.env,
    // Đợt 86 N3: dep apt WebKit mất sau reboot VM + apt lock bị replay
    // giữ — dùng lib GStreamer/GTK trích từ .deb trong cache
    // (/tmp/n3/webkit-libs, .so đã copy vào minibrowser-gtk/sys/lib).
    GST_PLUGIN_PATH: "/tmp/n3/webkit-libs/usr/lib/x86_64-linux-gnu/gstreamer-1.0",
    GST_PLUGIN_SCANNER: "/tmp/n3/webkit-libs/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner",
    GST_REGISTRY: "/tmp/n3/gst-registry.bin" } } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  // 1 cú click thật = user gesture để AudioContext không bị suspended.
  await page.mouse.click(640, 400).catch(() => {});
  const ua = await page.evaluate(() => navigator.userAgent);
  const results = { startedAt: new Date().toISOString(), engine: ENGINE, userAgent: ua, loadStart: os.loadavg(), cases: {} };
  const clips = [
    { id: "audio_10s_g30_640", file: "w6_h264_10s_g30_640_audio.mp4", hasAudio: true },
    { id: "noaudio_10s_g30_640", file: "w6_h264_10s_g30_640.mp4", hasAudio: false },
  ];
  const POS = [0.2, 0.5, 0.8];
  try {
    for (const c of clips) {
      // churn=draw (kiểu app): đủ 4 biến thể audio.
      for (const audio of ["g0", "g1", "g2", "g3"]) {
        const raw = await runCase(page, `${BASE}/${c.file}`, POS, "draw", audio, 2);
        results.cases[`${c.id}|draw|${audio}`] = { clip: c.id, hasAudio: c.hasAudio, churn: "draw", audio, raw };
        console.log(`${c.id} draw ${audio} ctx=${raw.ctxState} graphErr=${raw.graphError} playErr=${raw.playErr}: ` + raw.seeks.map((s) => `${s.target}s→${s.seekedMs}ms`).join(" | "));
      }
      // churn=nochurn: chỉ g0 vs g1 (tách riêng tác động graph khỏi churn).
      for (const audio of ["g0", "g1"]) {
        const raw = await runCase(page, `${BASE}/${c.file}`, POS, "nochurn", audio, 2);
        results.cases[`${c.id}|nochurn|${audio}`] = { clip: c.id, hasAudio: c.hasAudio, churn: "nochurn", audio, raw };
        console.log(`${c.id} nochurn ${audio} ctx=${raw.ctxState} graphErr=${raw.graphError}: ` + raw.seeks.map((s) => `${s.target}s→${s.seekedMs}ms`).join(" | "));
      }
    }
    const summary = {};
    for (const [k, c] of Object.entries(results.cases)) {
      summary[k] = {
        medianSeekedMs: median(c.raw.seeks.map((s) => s.seekedMs)),
        seekedMs: c.raw.seeks.map((s) => s.seekedMs),
        timeouts: c.raw.seeks.filter((s) => s.timeout).length,
        ctxState: c.raw.ctxState, graphError: c.raw.graphError, playErr: c.raw.playErr,
      };
    }
    results.summary = summary;
    results.loadEnd = os.loadavg();
    results.finishedAt = new Date().toISOString();
    writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
    console.log(`XONG — kết quả thô: ${OUT}`);
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (e) {
    console.log("PROBE LỖI: " + (e && e.message || e));
    try { writeFileEpermRetry(OUT, JSON.stringify(results, null, 2)); } catch {}
    process.exit(2);
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}

main();
