// webkit_loop_probe_80h5.mjs — Đợt 80 H5: kiểm chứng workaround W3
// (WebKitGTK phát video loop kẹt sau đúng 1 vòng, xem
// docs/PHASE9_ROUND79_G8_GPU_SAFARI_LIMITS.md §3.2) + đo chi phí WebGL
// thật của Chromium bằng EXT_disjoint_timer_query / FPS workload
// (gl.finish() timing đã bị cấm ở G8 §5.3 — không dùng làm số tốc độ).
//
// Chạy: xvfb-run -a node benchmarks/render/webkit_loop_probe_80h5.mjs
// Cần clip test ở /tmp/h5/clips (tạo bằng ffmpeg testsrc2, KHÔNG stage
// binary theo quy định). Server HTTP đa luồng chạy trong chính script
// (port 8897) để tránh nghẽn server đơn luồng (bài học G8 §5.4).
// Mọi vòng đo có guard timeout wall-clock (bài học G8 §5.2).
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const FULL = "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
const CLIP_DIR = "/tmp/h5/clips";
const PORT = 8897;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-loop-probe-80h5.json");

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

/** Một ca đo loop trên 1 clip, trong page. Trả về tóm tắt có số thật. */
async function loopCase(page, clipUrl, mode, wallMs) {
  return await page.evaluate(async ({ clipUrl, mode, wallMs }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    let endedCount = 0, seekedCount = 0, playAfterEnded = 0;
    const onEnded = () => {
      endedCount++;
      if (mode === "ended-seek") { v.currentTime = 0; const p = v.play(); if (p) p.catch(() => {}); }
      else if (mode === "ended-play-only") { playAfterEnded++; const p = v.play(); if (p) p.catch(() => {}); }
      else if (mode === "ended-seek-paused") { v.currentTime = 0; setTimeout(() => { const p = v.play(); if (p) p.catch(() => {}); }, 100); }
      // mode "native": loop=true xử lý, handler không làm gì
    };
    v.addEventListener("ended", onEnded);
    v.addEventListener("seeked", () => seekedCount++);
    if (mode === "native") v.loop = true;
    const samples = [];
    const t0 = performance.now();
    try {
      await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout-10s")), 10000))]);
    } catch (e) { samples.push({ error: String(e && e.message) }); }
    while (performance.now() - t0 < wallMs) {
      samples.push({ t: +((performance.now() - t0) / 1000).toFixed(2), ct: +v.currentTime.toFixed(2), paused: v.paused, ended: v.ended, rs: v.readyState });
      await new Promise((r) => setTimeout(r, 500));
    }
    let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
    const out = { mode, duration: v.duration, samples, endedCount, seekedCount, playAfterEnded,
      quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null,
      finalCt: +v.currentTime.toFixed(2), finalPaused: v.paused };
    v.pause(); v.removeEventListener("ended", onEnded); v.remove(); v.src = "";
    return out;
  }, { clipUrl, mode, wallMs });
}

function summarizeLoop(c) {
  // Số vòng loop hoàn thành ≈ tổng quãng currentTime đã chạy / duration.
  // Ước lượng từ samples: đếm lần currentTime giảm mạnh (wrap) + tiến trình cuối.
  let wraps = 0;
  for (let i = 1; i < c.samples.length; i++) {
    if (c.samples[i].ct < c.samples[i - 1].ct - 0.5) wraps++;
  }
  const last = c.samples[c.samples.length - 1];
  const stuckAtZero = c.samples.length >= 4 && c.samples.slice(-4).every((s) => s.ct === 0 && !s.paused);
  const expectedFrames = c.duration ? Math.round(c.duration * 30 * (wraps + (last ? last.ct / c.duration : 0))) : null;
  return { mode: c.mode, duration: c.duration, wraps, endedCount: c.endedCount, seekedCount: c.seekedCount,
    totalFrames: c.quality ? c.quality.total : null, dropped: c.quality ? c.quality.dropped : null,
    finalCt: c.finalCt, finalPaused: c.finalPaused, stuckAtZero, samples: c.samples.map((s) => s.ct) };
}

/** Đo chi phí WebGL thật: timer query GPU + FPS workload rAF. */
async function webglCost(page) {
  return await page.evaluate(async () => {
    const out = {};
    const c = document.createElement("canvas"); c.width = 1280; c.height = 720;
    document.body.appendChild(c);
    const gl = c.getContext("webgl2");
    if (!gl) { out.webgl2 = null; c.remove(); return out; }
    try {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      out.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null;
    } catch { out.renderer = null; }
    const tq = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    out.timerQueryExt = !!tq;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, "attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }"); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, "precision highp float; uniform float t; uniform vec2 r; void main(){ vec2 uv = gl_FragCoord.xy/r; float v=0.; for(int i=0;i<100;i++){ v += sin(uv.x*20.+float(i)*.7+t)*cos(uv.y*20.+float(i)*.3); } gl_FragColor = vec4(vec3(.5+.5*sin(v)),1.); }"); gl.compileShader(fs);
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    out.link = gl.getProgramParameter(pr, gl.LINK_STATUS);
    if (!out.link) { out.linkLog = gl.getProgramInfoLog(pr); c.remove(); return out; }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(gl.getUniformLocation(pr, "r"), 1280, 720);
    // (a) Timer query GPU-time mỗi draw (nếu ext có): đo thời gian GPU thật, không phải CPU wall.
    if (tq) {
      const gpuMs = [];
      let disjoint = false;
      for (let i = 0; i < 8; i++) {
        const q = gl.createQuery();
        gl.beginQuery(tq.TIME_ELAPSED_EXT, q);
        gl.uniform1f(gl.getUniformLocation(pr, "t"), i * 0.1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.endQuery(tq.TIME_ELAPSED_EXT);
        // chờ kết quả có guard
        const ok = await new Promise((resolve) => {
          const t0 = performance.now();
          const iv = setInterval(() => {
            if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) { clearInterval(iv); resolve(true); }
            else if (performance.now() - t0 > 5000) { clearInterval(iv); resolve(false); }
          }, 10);
        });
        if (ok) {
          gpuMs.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
          if (gl.getParameter(tq.GPU_DISJOINT_EXT)) disjoint = true;
        }
        gl.deleteQuery(q);
      }
      gpuMs.sort((a, b) => a - b);
      out.timerQuery = { frames: gpuMs.length, gpuMsMedian: gpuMs.length ? +gpuMs[Math.floor(gpuMs.length / 2)].toFixed(3) : null, gpuMsAll: gpuMs.map((x) => +x.toFixed(3)), disjoint };
    }
    // (b) FPS workload: rAF loop vẽ shader nặng 5 s — số fps thật của workload.
    {
      const t0 = performance.now(); let frames = 0; const gaps = [];
      let last = 0;
      await new Promise((resolve) => {
        const guard = setTimeout(resolve, 7000);
        (function tick(t) {
          if (last) gaps.push(t - last); last = t; frames++;
          gl.uniform1f(gl.getUniformLocation(pr, "t"), frames * 0.1);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.finish();
          if (t - t0 < 5000) requestAnimationFrame(tick);
          else { clearTimeout(guard); resolve(); }
        })(0);
      });
      gaps.sort((a, b) => a - b);
      const px = new Uint8Array(4); gl.readPixels(640, 360, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      out.fpsWorkload = { frames, wallMs: Math.round(performance.now() - t0), fps: +(frames / ((performance.now() - t0) / 1000)).toFixed(2), gapMedianMs: gaps.length ? +gaps[Math.floor(gaps.length / 2)].toFixed(1) : null, centerPixel: Array.from(px) };
    }
    c.remove();
    return out;
  });
}

const clips = [
  { file: "a_h264_320x180_2s.mp4", label: "A h264 320x180 2s 30fps (baseline G8)" },
  { file: "b_h264_640x360_3s.mp4", label: "B h264 640x360 3s 30fps" },
  { file: "c_vp9_320x180_2s.webm", label: "C vp9 320x180 2s 30fps" },
  { file: "d_h264_1280x720_4s.mp4", label: "D h264 1280x720 4s 24fps" },
];
for (const cl of clips) {
  if (!fs.existsSync(path.join(CLIP_DIR, cl.file))) { console.log("MISSING CLIP", cl.file); process.exit(1); }
}
const modes = ["native", "ended-seek", "ended-play-only"];
const WALL = 8000; // 8 s mỗi ca: đủ ≥2 vòng với clip 2-3 s, ≥1 vòng với clip 4 s
const results = { date: new Date().toISOString(), clips: clips.map((c) => c.label), modes, wallMsPerCase: WALL, engines: {} };

async function runEngine(browser, label) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/index.html`);
  const eng = { loop: {}, webgl: null };
  for (const cl of clips) {
    eng.loop[cl.file] = {};
    for (const m of modes) {
      const raw = await loopCase(page, `${BASE}/${cl.file}`, m, WALL);
      eng.loop[cl.file][m] = summarizeLoop(raw);
      console.log(label, cl.file, m, JSON.stringify(eng.loop[cl.file][m]));
    }
  }
  eng.webgl = await webglCost(page);
  console.log(label, "WEBGL", JSON.stringify(eng.webgl));
  await page.close();
  return eng;
}

let b = await chromium.launch({ headless: false, executablePath: FULL, args: ["--no-sandbox"] });
results.engines["chromium-headed"] = await runEngine(b, "CHROMIUM-HEADED"); await b.close();
b = await chromium.launch({ headless: true, executablePath: FULL, args: ["--no-sandbox"] });
results.engines["chromium-headless"] = await runEngine(b, "CHROMIUM-HEADLESS"); await b.close();
let w;
try {
  w = await webkit.launch({ headless: true });
  results.engines["webkit-headless"] = await runEngine(w, "WEBKIT-HEADLESS"); await w.close();
} catch (e) { console.log("WEBKIT-HEADLESS launch/run failed:", e.message); results.engines["webkit-headless"] = { error: String(e.message) }; }
try {
  w = await webkit.launch({ headless: false });
  results.engines["webkit-headed"] = await runEngine(w, "WEBKIT-HEADED"); await w.close();
} catch (e) { console.log("WEBKIT-HEADED launch failed:", e.message); results.engines["webkit-headed"] = { error: String(e.message) }; }

fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(results, null, 2));
console.log("WROTE", OUT);
server.close();
