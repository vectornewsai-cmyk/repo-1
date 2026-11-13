// webkit_seek_churn_85m4.mjs — Phase 9 đợt 85, luồng M4: W6 — tách riêng
// thành phần nào của "churn kiểu app" làm seek chậm trên WebKitGTK.
//
// Probe trước (webkit_seek_load_85m4.mjs) cho thấy: seek thô baseline
// 0,03–0,48 s; + churn kiểu app (play() mỗi tick + drawImage mỗi rAF +
// gán playbackRate/preservesPitch) → 0,6–4,1 s (trung vị 1,7–3,3 s).
// Probe này tách riêng từng thành phần trên clip GOP 250 (tệ nhất) +
// GOP 30 (đối chứng), 3 vị trí × 1 rep, chỉ đo seeked (rVFC không bắn
// trên WebKitGTK — đã chứng minh 0/36 ở probe trước nên bỏ metric đó).
//   V0 baseline (không churn) | V1 chỉ play() | V2 chỉ drawImage |
//   V3 chỉ gán playbackRate/preservesPitch | V4 tất cả (lặp lại C).
// Chạy: xvfb-run -a node benchmarks/render/webkit_seek_churn_85m4.mjs
// Clip ở /tmp/m4/clips (KHÔNG stage binary). KHÔNG sửa file sản phẩm.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "../../apps/web/scripts/eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
const { webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");
const CLIP_DIR = "/tmp/m4/clips";
const PORT = 8899;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../results/webkit-seek-churn-85m4.json");

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

async function seekCase(page, clipUrl, positions, variant) {
  return await page.evaluate(async ({ clipUrl, positions, variant }) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.src = clipUrl;
    document.body.appendChild(v);
    const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (cond, timeoutMs) => {
      const t0 = performance.now();
      while (performance.now() - t0 < timeoutMs) {
        if (cond()) return performance.now() - t0;
        await sleep2(25);
      }
      return null;
    };
    try {
      await Promise.race([
        new Promise((res, rej) => { v.addEventListener("loadedmetadata", res, { once: true }); v.addEventListener("error", () => rej(new Error("load-error")), { once: true }); }),
        sleep2(15000).then(() => { throw new Error("metadata-timeout"); }),
      ]);
    } catch (e) {
      const out0 = { duration: v.duration, error: String(e && e.message), seeks: [] };
      v.pause(); v.remove(); v.src = "";
      return out0;
    }
    const dur = v.duration;
    let stop = false;
    let ticks = 0;
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 180;
    const ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);
    const loop = () => {
      if (stop) return;
      ticks++;
      try {
        if (variant === "play" || variant === "all") {
          if (v.paused) { const p = v.play(); if (p) p.catch(() => {}); }
        }
        if (variant === "draw" || variant === "all") {
          if (v.readyState >= 2) ctx.drawImage(v, 0, 0, 320, 180);
        }
        if (variant === "rate" || variant === "all") {
          if (v.playbackRate !== 1) v.playbackRate = 1;
          if ("preservesPitch" in v) v.preservesPitch = true;
        }
      } catch {}
      requestAnimationFrame(loop);
    };
    if (variant !== "base") requestAnimationFrame(loop);
    try { await v.play(); } catch {}
    await waitFor(() => v.currentTime > 0.2 && !v.paused, 10000);
    const seeks = [];
    for (const pos of positions) {
      const target = +(pos * dur).toFixed(3);
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
        target,
        seekedMs: seekedMs === null ? null : +seekedMs.toFixed(0),
        ct500msAfter: +v.currentTime.toFixed(3),
        seekingAfter: v.seeking,
        timeout: seekedMs === null,
      });
      await sleep2(300);
    }
    stop = true;
    const out = { duration: dur, ticks, seeks };
    v.pause(); v.remove(); v.src = ""; canvas.remove();
    return out;
  }, { clipUrl, positions, variant }, { timeout: 300000 });
}

function median(xs) {
  const a = xs.filter((x) => typeof x === "number").sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

async function main() {
  const results = { startedAt: new Date().toISOString(), engine: "webkit", cases: {} };
  const browser = await webkit.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const clips = [
    { id: "h264_30s_g250_640", file: "w6_h264_30s_g250_640.mp4" },
    { id: "h264_30s_g30_640", file: "w6_h264_30s_g30_640.mp4" },
  ];
  const POS = [0.1, 0.5, 0.9];
  const VARIANTS = ["base", "play", "draw", "rate", "all"];
  try {
    for (const c of clips) {
      for (const variant of VARIANTS) {
        const raw = await seekCase(page, `${BASE}/${c.file}`, POS, variant);
        results.cases[`${c.id}|${variant}`] = { clip: c.id, variant, raw };
        console.log(`${c.id} ${variant} (ticks=${raw.ticks}): ` + raw.seeks.map((s) => `${s.target}s→${s.seekedMs}ms${s.timeout ? " TIMEOUT" : ""}`).join(" | "));
      }
    }
    const summary = {};
    for (const [k, c] of Object.entries(results.cases)) {
      summary[k] = { medianSeekedMs: median(c.raw.seeks.map((s) => s.seekedMs)), seekedMs: c.raw.seeks.map((s) => s.seekedMs), timeouts: c.raw.seeks.filter((s) => s.timeout).length };
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
