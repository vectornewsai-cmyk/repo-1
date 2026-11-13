import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const FULL = "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
const URL = "http://127.0.0.1:8899/h264.mp4";
async function diag(browser, label) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://127.0.0.1:8899/index.html");
  const r = await page.evaluate(async (clipUrl) => {
    const out = { visibility: document.visibilityState, hasFocus: document.hasFocus() };
    // (1) rAF trống: không vẽ gì, 3 s — tách throttle rAF khỏi chi phí vẽ.
    {
      let frames = 0; const gaps = []; let last = 0; const t0 = performance.now();
      await new Promise((resolve) => {
        const guard = setTimeout(resolve, 5000);
        (function tick(t) { if (last) gaps.push(t - last); last = t; frames++; if (t - t0 < 3000) requestAnimationFrame(tick); else { clearTimeout(guard); resolve(); } })(0);
      });
      gaps.sort((a,b)=>a-b);
      out.rafEmpty = { frames, wallMs: Math.round(performance.now() - t0), fps: +(frames / ((performance.now() - t0)/1000)).toFixed(2), gapMedian: gaps.length ? +gaps[Math.floor(gaps.length/2)].toFixed(1) : null };
    }
    // (2) Video play progression.
    {
      const v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.src = clipUrl;
      document.body.appendChild(v);
      const samples = [];
      try {
        await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout")), 10000))]);
        samples.push({ t: 0, paused: v.paused, currentTime: +v.currentTime.toFixed(2), readyState: v.readyState });
        for (let i = 1; i <= 5; i++) {
          await new Promise((r2) => setTimeout(r2, 1000));
          samples.push({ t: i, paused: v.paused, currentTime: +v.currentTime.toFixed(2), readyState: v.readyState });
        }
      } catch (e) { samples.push({ error: String(e.message), paused: v.paused, currentTime: +v.currentTime.toFixed(2), readyState: v.readyState }); }
      let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
      out.videoProgress = { samples, quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null };
      v.pause(); v.remove();
    }
    // (3) WebGL shader có kiểm tra LINK_STATUS + readPixels.
    {
      const c = document.createElement("canvas"); c.width = 640; c.height = 360;
      document.body.appendChild(c);
      const gl = c.getContext("webgl2");
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, "attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }"); gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, "precision highp float; uniform float t; uniform vec2 r; void main(){ vec2 uv = gl_FragCoord.xy/r; float v=0.; for(int i=0;i<30;i++){ v += sin(uv.x*20.+float(i)*.7+t)*cos(uv.y*20.+float(i)*.3); } gl_FragColor = vec4(vec3(.5+.5*sin(v)),1.); }"); gl.compileShader(fs);
      out.shader = { vsCompile: gl.getShaderParameter(vs, gl.COMPILE_STATUS), fsCompile: gl.getShaderParameter(fs, gl.COMPILE_STATUS), fsLog: gl.getShaderInfoLog(fs) || "" };
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      out.shader.link = gl.getProgramParameter(pr, gl.LINK_STATUS);
      out.shader.linkLog = gl.getProgramInfoLog(pr) || "";
      if (out.shader.link) {
        gl.useProgram(pr);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(pr, "r"), 640, 360);
        const N = 12, times = [];
        for (let i = 0; i < N; i++) {
          const t0 = performance.now();
          gl.uniform1f(gl.getUniformLocation(pr, "t"), i * 0.1);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.finish();
          times.push(performance.now() - t0);
        }
        times.sort((a,b)=>a-b);
        const px = new Uint8Array(4); gl.readPixels(320, 180, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        out.shader.times = { frames: N, medianMs: +times[Math.floor(N/2)].toFixed(2), p95Ms: +times[Math.floor(N*0.95)].toFixed(2), minMs: +times[0].toFixed(2) };
        out.shader.centerPixel = Array.from(px);
      }
      c.remove();
    }
    return out;
  }, URL);
  console.log(label, JSON.stringify(r));
  await page.close();
}
// Chromium headed (xvfb) + headless-new
let b = await chromium.launch({ headless: false, executablePath: FULL, args: ["--no-sandbox"] });
await diag(b, "CHROMIUM-HEADED"); await b.close();
b = await chromium.launch({ headless: true, executablePath: FULL, args: ["--no-sandbox"] });
await diag(b, "CHROMIUM-HEADLESS-NEW"); await b.close();
// WebKit headless + headed attempt
let w = await webkit.launch({ headless: true });
await diag(w, "WEBKIT-HEADLESS"); await w.close();
try {
  w = await webkit.launch({ headless: false });
  await diag(w, "WEBKIT-HEADED"); await w.close();
} catch (e) { console.log("WEBKIT-HEADED launch failed:", e.message); }
