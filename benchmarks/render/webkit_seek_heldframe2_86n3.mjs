// webkit_seek_heldframe2_86n3.mjs — Phase 9 đợt 86, luồng N3: W6 (a2) —
// tiếp nối probe A (webkit_seek_heldframe_86n3): trên WebKit, "skip"
// (không vẽ gì lúc seeking) nhanh hơn hẳn "draw" (g30: 120 ms vs
// 902 ms) và "held" (vẽ frame giữ mỗi tick) chỉ khá hơn draw trên
// g250 (888 vs 1181) nhưng bằng draw trên g30 (902 vs 902). Probe này
// tách cơ chế + đo độ đúng frame sạch hơn:
//
// Phần 1 — cái gì đắt? (playing, g250+g30, 3 vị trí × 2 rep)
//   clear    : mỗi tick lúc seeking chỉ clearRect canvas, không vẽ gì.
//   heldonce : lúc seeking chỉ vẽ frame giữ ĐÚNG 1 lần (tick đầu của
//              seek), các tick sau không chạm canvas.
//   Nếu clear ≈ skip (nhanh) và heldonce ≈ skip → chi phí nằm ở vẽ
//   lặp lại mỗi tick; nếu clear ≈ draw (chậm) → mọi thao tác làm bẩn
//   canvas mỗi tick đều đắt (compositor phần mềm WebKitGTK/Xvfb).
// Phần 2 — frame hiển thị có đúng không? (playing, g250+g30, draw/
//   held/skip, 3 vị trí × 2 rep) — khác probe A: ngay khi `seeked`
//   bắn thì pause element rồi mới poll draw+hash so với frame tham
//   chiếu (tối đa 2 s). Probe A poll trong lúc video vẫn phát nên
//   frame mục tiêu trôi qua sau ~33 ms → timeout giả (đặc biệt trên
//   WebKit, nơi frame trình bày sau `seeked` một khoảng biến thiên).
//   Chạy: ENGINE=webkit|chromium xvfb-run -a node
//         benchmarks/render/webkit_seek_heldframe2_86n3.mjs
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
const PORT = Number(process.env.N3_PORT || 8903);
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../results/webkit-seek-heldframe2-86n3-${ENGINE}.json`,
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

async function runCase(page, clipUrl, positions, variant, part, reps) {
  return await page.evaluate(async ({ clipUrl, positions, variant, part, reps }) => {
    const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (cond, timeoutMs) => {
      const t0 = performance.now();
      while (performance.now() - t0 < timeoutMs) {
        if (cond()) return performance.now() - t0;
        await sleep2(25);
      }
      return null;
    };
    const hashOf = (src) => {
      const c = document.createElement("canvas");
      c.width = 160; c.height = 90;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(src, 0, 0, 160, 90);
      const d = x.getImageData(0, 0, 160, 90).data;
      let h = "";
      for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) {
        const px = (gy * 11 + 5) * 160 * 4 + (gx * 20 + 10) * 4;
        h += ((d[px] >> 4).toString(16) + (d[px + 1] >> 4).toString(16) + (d[px + 2] >> 4).toString(16));
      }
      return h;
    };
    const hashDist = (a, b) => {
      if (!a || !b || a.length !== b.length) return 999;
      let n = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
      return n;
    };
    const mkVideo = () => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.src = clipUrl;
      document.body.appendChild(v);
      return v;
    };
    const loadMeta = async (v) => {
      try {
        await Promise.race([
          new Promise((res, rej) => { v.addEventListener("loadedmetadata", res, { once: true }); v.addEventListener("error", () => rej(new Error("load-error")), { once: true }); }),
          sleep2(15000).then(() => { throw new Error("metadata-timeout"); }),
        ]);
        return null;
      } catch (e) { return String(e && e.message); }
    };
    // Frame tham chiếu (seek sạch, element riêng, paused).
    const refV = mkVideo();
    const refErr = await loadMeta(refV);
    if (refErr) { refV.pause(); refV.remove(); refV.src = ""; return { error: refErr, seeks: [] }; }
    const dur = refV.duration;
    const refs = {};
    for (const pos of positions) {
      const target = +(pos * dur).toFixed(3);
      const hashes = [];
      for (let k = 0; k < 2; k++) {
        refV.currentTime = target;
        await new Promise((res) => {
          const h = () => { refV.removeEventListener("seeked", h); res(); };
          refV.addEventListener("seeked", h);
          setTimeout(() => { refV.removeEventListener("seeked", h); res(); }, 15000);
        });
        await sleep2(1000);
        hashes.push(hashOf(refV));
      }
      refs[target] = { hash: hashes[0], stable: hashes[0] === hashes[1] };
    }
    refV.pause(); refV.remove(); refV.src = "";

    const v = mkVideo();
    const loadErr = await loadMeta(v);
    if (loadErr) { v.pause(); v.remove(); v.src = ""; return { error: loadErr, seeks: [] }; }
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 180;
    const ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);
    const held = document.createElement("canvas");
    held.width = 320; held.height = 180;
    const hctx = held.getContext("2d");
    let heldReady = false;
    let stop = false;
    let ticks = 0;
    let prevSeeking = false;
    let drawnOnce = false;
    // Phần 2 (pauseAtSeeked): sau khi pause ở seeked, loop KHÔNG được
    // play() lại (nếu không poll đo frame sẽ đo trong lúc phát).
    let autoPlay = true;
    const loop = () => {
      if (stop) return;
      ticks++;
      try {
        if (autoPlay && v.paused) { const p = v.play(); if (p) p.catch(() => {}); }
        if (variant === "draw") {
          if (v.readyState >= 2) ctx.drawImage(v, 0, 0, 320, 180);
        } else if (variant === "held") {
          if (v.seeking && heldReady) ctx.drawImage(held, 0, 0);
          else if (v.readyState >= 2) { ctx.drawImage(v, 0, 0, 320, 180); hctx.drawImage(v, 0, 0, 320, 180); heldReady = true; }
        } else if (variant === "skip") {
          if (!v.seeking && v.readyState >= 2) ctx.drawImage(v, 0, 0, 320, 180);
        } else if (variant === "clear") {
          if (v.seeking) ctx.clearRect(0, 0, 320, 180);
          else if (v.readyState >= 2) ctx.drawImage(v, 0, 0, 320, 180);
        } else if (variant === "heldonce") {
          if (v.seeking) {
            if (!prevSeeking && heldReady && !drawnOnce) { ctx.drawImage(held, 0, 0); drawnOnce = true; }
          } else {
            drawnOnce = false;
            if (v.readyState >= 2) { ctx.drawImage(v, 0, 0, 320, 180); hctx.drawImage(v, 0, 0, 320, 180); heldReady = true; }
          }
        }
        prevSeeking = v.seeking;
      } catch {}
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    try { await v.play(); } catch {}
    await waitFor(() => v.currentTime > 0.2 && !v.paused, 10000);

    const seeks = [];
    for (let rep = 0; rep < reps; rep++) {
      for (const pos of positions) {
        const target = +(pos * dur).toFixed(3);
        await waitFor(() => !v.seeking && v.currentTime > 0.05, 5000);
        const t0 = performance.now();
        let seekedMs = null;
        const seekedP = new Promise((res) => {
          const h = () => {
            seekedMs = performance.now() - t0;
            v.removeEventListener("seeked", h);
            if (part === "pauseAtSeeked") { autoPlay = false; v.pause(); }
            res();
          };
          v.addEventListener("seeked", h);
          setTimeout(() => { v.removeEventListener("seeked", h); res(); }, 20000);
        });
        v.currentTime = target;
        await seekedP;
        let frameReadyMs = null;
        if (part === "pauseAtSeeked") {
          const ref = refs[target];
          const tPoll0 = performance.now();
          while (performance.now() - tPoll0 < 2000) {
            try {
              const h = hashOf(v);
              if (hashDist(h, ref.hash) <= 2) { frameReadyMs = Math.round(performance.now() - t0); break; }
            } catch {}
            await sleep2(25);
          }
        }
        await sleep2(400);
        seeks.push({
          rep, target,
          seekedMs: seekedMs === null ? null : Math.round(seekedMs),
          frameReadyMs,
          timeout: seekedMs === null,
          frameTimeout: part === "pauseAtSeeked" ? frameReadyMs === null : undefined,
          ctAfter: +v.currentTime.toFixed(3),
          seekingAfter: v.seeking,
          refStable: refs[target].stable,
        });
        if (part === "pauseAtSeeked") { autoPlay = true; try { await v.play(); } catch {} await sleep2(300); }
        await sleep2(300);
      }
    }
    stop = true;
    const out = { duration: dur, ticks, refs: Object.fromEntries(Object.entries(refs).map(([k, r]) => [k, { stable: r.stable }])), seeks };
    v.pause(); v.remove(); v.src = ""; canvas.remove();
    return out;
  }, { clipUrl, positions, variant, part, reps }, { timeout: 600000 });
}

async function main() {
  const browser = await PW[ENGINE].launch({ headless: false, ...(ENGINE === "webkit" ? { env: { ...process.env,
    GST_PLUGIN_PATH: "/tmp/n3/webkit-libs/usr/lib/x86_64-linux-gnu/gstreamer-1.0",
    GST_PLUGIN_SCANNER: "/tmp/n3/webkit-libs/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner",
    GST_REGISTRY: "/tmp/n3/gst-registry.bin" } } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const ua = await page.evaluate(() => navigator.userAgent);
  const results = { startedAt: new Date().toISOString(), engine: ENGINE, userAgent: ua, loadStart: os.loadavg(), cases: {} };
  const clips = [
    { id: "h264_30s_g250_640", file: "w6_h264_30s_g250_640.mp4" },
    { id: "h264_30s_g30_640", file: "w6_h264_30s_g30_640.mp4" },
  ];
  const POS = [0.1, 0.5, 0.9];
  try {
    // Phần 1: cái gì đắt?
    for (const c of clips) {
      for (const variant of ["clear", "heldonce"]) {
        const raw = await runCase(page, `${BASE}/${c.file}`, POS, variant, "cost", 2);
        results.cases[`${c.id}|${variant}|cost`] = { clip: c.id, variant, part: "cost", raw };
        console.log(`${c.id} ${variant} cost ticks=${raw.ticks}: ` + raw.seeks.map((s) => `${s.target}s→${s.seekedMs}ms`).join(" | "));
      }
    }
    // Phần 2: frame đúng không? (pause ngay khi seeked rồi poll)
    for (const c of clips) {
      for (const variant of ["draw", "held", "skip"]) {
        const raw = await runCase(page, `${BASE}/${c.file}`, POS, variant, "pauseAtSeeked", 2);
        results.cases[`${c.id}|${variant}|pauseAtSeeked`] = { clip: c.id, variant, part: "pauseAtSeeked", raw };
        console.log(`${c.id} ${variant} pauseAtSeeked ticks=${raw.ticks}: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms ready ${s.frameReadyMs}ms`).join(" | "));
      }
    }
    const summary = {};
    for (const [k, c] of Object.entries(results.cases)) {
      summary[k] = {
        medianSeekedMs: median(c.raw.seeks.map((s) => s.seekedMs)),
        medianFrameReadyMs: median(c.raw.seeks.map((s) => s.frameReadyMs)),
        seekedMs: c.raw.seeks.map((s) => s.seekedMs),
        frameReadyMs: c.raw.seeks.map((s) => s.frameReadyMs),
        timeouts: c.raw.seeks.filter((s) => s.timeout).length,
        frameTimeouts: c.raw.seeks.filter((s) => s.frameTimeout).length,
        refStable: Object.values(c.raw.refs || {}).map((r) => r.stable),
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
