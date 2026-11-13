import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const FULL = "/home/hatch/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome";
async function diag(browser, label) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://127.0.0.1:8899/index.html");
  const r = await page.evaluate(async () => {
    const out = {};
    // (1) Video 6 s KHÔNG loop — stall ở giữa clip hay chỉ ở loop?
    {
      const v = document.createElement("video");
      v.muted = true; v.loop = false; v.playsInline = true; v.src = "http://127.0.0.1:8899/h264_6s.mp4";
      document.body.appendChild(v);
      const samples = [];
      try {
        await Promise.race([v.play(), new Promise((_, rej) => setTimeout(() => rej(new Error("play-timeout")), 10000))]);
        for (let i = 0; i <= 6; i++) {
          samples.push({ t: i, paused: v.paused, currentTime: +v.currentTime.toFixed(2), readyState: v.readyState, ended: v.ended });
          if (i < 6) await new Promise((r2) => setTimeout(r2, 1000));
        }
      } catch (e) { samples.push({ error: String(e.message) }); }
      let q = null; try { q = v.getVideoPlaybackQuality(); } catch {}
      out.video6sNoLoop = { samples, quality: q ? { total: q.totalVideoFrames, dropped: q.droppedVideoFrames } : null };
      v.pause(); v.remove();
    }
    // (2) Shader nặng hơn: 1280x720, 100 vòng — Chromium còn 0ms không?
    {
      const c = document.createElement("canvas"); c.width = 1280; c.height = 720;
      document.body.appendChild(c);
      const gl = c.getContext("webgl2");
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, "attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }"); gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, "precision highp float; uniform float t; uniform vec2 r; void main(){ vec2 uv = gl_FragCoord.xy/r; float v=0.; for(int i=0;i<100;i++){ v += sin(uv.x*40.+float(i)*.7+t)*cos(uv.y*40.+float(i)*.3); } gl_FragColor = vec4(vec3(.5+.5*sin(v)),1.); }"); gl.compileShader(fs);
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      const ok = gl.getProgramParameter(pr, gl.LINK_STATUS);
      if (ok) {
        gl.useProgram(pr);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(gl.getUniformLocation(pr, "r"), 1280, 720);
        const N = 8, times = [];
        for (let i = 0; i < N; i++) {
          const t0 = performance.now();
          gl.uniform1f(gl.getUniformLocation(pr, "t"), i * 0.1);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.finish();
          times.push(performance.now() - t0);
        }
        times.sort((a,b)=>a-b);
        const px = new Uint8Array(4); gl.readPixels(640, 360, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        out.shaderHeavy = { size: "1280x720", iterations: 100, medianMs: +times[Math.floor(N/2)].toFixed(2), p95Ms: +times[Math.floor(N*0.95)].toFixed(2), minMs: +times[0].toFixed(2), centerPixel: Array.from(px) };
      } else out.shaderHeavy = { link: false };
      c.remove();
    }
    return out;
  });
  console.log(label, JSON.stringify(r));
  await page.close();
}
let b = await chromium.launch({ headless: false, executablePath: FULL, args: ["--no-sandbox"] });
await diag(b, "CHROMIUM-HEADED"); await b.close();
let w = await webkit.launch({ headless: true });
await diag(w, "WEBKIT-HEADLESS"); await w.close();
