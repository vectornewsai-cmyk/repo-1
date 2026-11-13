// webkit_seek_heldframe_86n3.mjs — Phase 9 đợt 86, luồng N3: W6 (a) —
// vẽ frame GIỮ (held frame) thay cho drawImage element đang seeking
// trong lúc seek thì seek có nhanh hơn không, và frame hiển thị có
// còn đúng không. Tiếp nối M4 đợt 85: drawImage là thành phần duy nhất
// gây chậm seek (~+270 ms/seek, 3–11×); pause-seek-play chưa chứng
// minh được frame sẵn sàng (rVFC không bắn trên WebKitGTK).
//
// Biến thể (rAF loop kiểu app: play() mỗi tick + drawImage mỗi rAF):
//   draw : baseline M4 — vẽ video mọi tick, kể cả lúc seeking.
//   held : lúc seeking thì vẽ canvas frame-giữ (canvas→canvas);
//          hết seeking thì vẽ video + cập nhật snapshot giữ.
//   skip : lúc seeking thì không vẽ gì (canvas giữ nội dung cũ).
// Thêm chế độ paused (g250, draw vs held) để biết có nên mở guard
// sang cả đường pause/scrub không.
//
// Số đo mỗi seek: seekedMs (event seeked), frameReadyMs (từ lúc gán
// currentTime tới khi drawImage+hash lần đầu KHỚP frame tham chiếu của
// target đó — đo độ sẵn sàng frame thật mà không cần rVFC), midHash
// (nội dung canvas giữa lúc seek: có bằng frame trước seek không),
// ct/seeking sau seek. Frame tham chiếu: seek sạch trên element riêng
// (không churn), chờ seeked + 1000 ms rồi draw + hash; lấy 2 lần để
// kiểm tra hash ổn định.
//   Chạy: ENGINE=webkit|chromium xvfb-run -a node
//         benchmarks/render/webkit_seek_heldframe_86n3.mjs
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
const PORT = Number(process.env.N3_PORT || 8901);
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../results/webkit-seek-heldframe-86n3-${ENGINE}.json`,
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

async function runCase(page, clipUrl, positions, variant, mode, reps) {
  return await page.evaluate(async ({ clipUrl, positions, variant, mode, reps }) => {
    const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (cond, timeoutMs) => {
      const t0 = performance.now();
      while (performance.now() - t0 < timeoutMs) {
        if (cond()) return performance.now() - t0;
        await sleep2(25);
      }
      return null;
    };
    // Hash frame: vẽ video xuống 160x90, lấy mẫu lưới 8x8, lượng tử 4 bit/kênh.
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
    // --- frame tham chiếu: seek sạch trên element riêng, 2 lần ---
    const refV = mkVideo();
    const refErr = await loadMeta(refV);
    if (refErr) {
      refV.pause(); refV.remove(); refV.src = "";
      return { error: refErr, seeks: [] };
    }
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
      refs[target] = { hash: hashes[0], stable: hashes[0] === hashes[1], dist2: hashDist(hashes[0], hashes[1]) };
    }
    refV.pause(); refV.remove(); refV.src = "";

    // --- element đo + vòng rAF kiểu app ---
    const v = mkVideo();
    const loadErr = await loadMeta(v);
    if (loadErr) {
      v.pause(); v.remove(); v.src = "";
      return { error: loadErr, seeks: [] };
    }
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
    const loop = () => {
      if (stop) return;
      ticks++;
      try {
        if (mode === "playing" && v.paused) { const p = v.play(); if (p) p.catch(() => {}); }
        if (variant === "draw") {
          if (v.readyState >= 2) { ctx.drawImage(v, 0, 0, 320, 180); }
        } else if (variant === "held") {
          if (v.seeking && heldReady) ctx.drawImage(held, 0, 0);
          else if (v.readyState >= 2) { ctx.drawImage(v, 0, 0, 320, 180); hctx.drawImage(v, 0, 0, 320, 180); heldReady = true; }
        } else { // skip
          if (!v.seeking && v.readyState >= 2) ctx.drawImage(v, 0, 0, 320, 180);
        }
      } catch {}
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    try { await v.play(); } catch {}
    if (mode === "playing") await waitFor(() => v.currentTime > 0.2 && !v.paused, 10000);
    else { v.pause(); await sleep2(500); }

    const seeks = [];
    for (let rep = 0; rep < reps; rep++) {
      for (const pos of positions) {
        const target = +(pos * dur).toFixed(3);
        if (mode === "playing") await waitFor(() => !v.seeking && v.currentTime > 0.05, 5000);
        else { v.pause(); await sleep2(200); }
        const preHash = hashOf(v);
        const t0 = performance.now();
        let midHash = null, midSeeking = null;
        setTimeout(() => {
          try { midHash = hashOf(canvas); midSeeking = v.seeking; } catch {}
        }, 100);
        let seekedMs = null;
        const seekedP = new Promise((res) => {
          const h = () => { seekedMs = performance.now() - t0; v.removeEventListener("seeked", h); res(); };
          v.addEventListener("seeked", h);
          setTimeout(() => { v.removeEventListener("seeked", h); res(); }, 20000);
        });
        v.currentTime = target;
        await seekedP;
        // frame-ready: poll draw+hash tới khi khớp frame tham chiếu.
        let frameReadyMs = null;
        const ref = refs[target];
        const tPoll0 = performance.now();
        while (performance.now() - tPoll0 < 5000) {
          try {
            const h = hashOf(v);
            if (hashDist(h, ref.hash) <= 2) { frameReadyMs = Math.round(performance.now() - t0); break; }
          } catch {}
          await sleep2(25);
        }
        await sleep2(400);
        seeks.push({
          rep, target,
          seekedMs: seekedMs === null ? null : Math.round(seekedMs),
          frameReadyMs,
          timeout: seekedMs === null,
          frameTimeout: frameReadyMs === null,
          midEqualsPre: midHash === null ? null : hashDist(midHash, preHash) <= 2,
          midSeeking,
          ctAfter: +v.currentTime.toFixed(3),
          seekingAfter: v.seeking,
          refStable: ref.stable,
        });
        await sleep2(300);
      }
    }
    stop = true;
    const out = { duration: dur, ticks, refs: Object.fromEntries(Object.entries(refs).map(([k, r]) => [k, { stable: r.stable, dist2: r.dist2 }])), seeks };
    v.pause(); v.remove(); v.src = ""; canvas.remove();
    return out;
  }, { clipUrl, positions, variant, mode, reps }, { timeout: 600000 });
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
  const ua = await page.evaluate(() => navigator.userAgent);
  const results = { startedAt: new Date().toISOString(), engine: ENGINE, userAgent: ua, loadStart: os.loadavg(), cases: {} };
  const clips = [
    { id: "h264_30s_g250_640", file: "w6_h264_30s_g250_640.mp4" },
    { id: "h264_30s_g30_640", file: "w6_h264_30s_g30_640.mp4" },
  ];
  const POS = [0.1, 0.5, 0.9];
  try {
    for (const c of clips) {
      for (const variant of ["draw", "held", "skip"]) {
        const raw = await runCase(page, `${BASE}/${c.file}`, POS, variant, "playing", 3);
        results.cases[`${c.id}|${variant}|playing`] = { clip: c.id, variant, mode: "playing", raw };
        console.log(`${c.id} ${variant} playing ticks=${raw.ticks}: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms ready ${s.frameReadyMs}ms mid=pre:${s.midEqualsPre}`).join(" | "));
      }
    }
    // Chế độ paused (chỉ g250, draw vs held) — có nên mở guard sang pause/scrub?
    for (const variant of ["draw", "held"]) {
      const raw = await runCase(page, `${BASE}/w6_h264_30s_g250_640.mp4`, POS, variant, "paused", 2);
      results.cases[`h264_30s_g250_640|${variant}|paused`] = { clip: "h264_30s_g250_640", variant, mode: "paused", raw };
      console.log(`g250 ${variant} paused ticks=${raw.ticks}: ` + raw.seeks.map((s) => `${s.target}s→seeked ${s.seekedMs}ms ready ${s.frameReadyMs}ms mid=pre:${s.midEqualsPre}`).join(" | "));
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
        midEqualsPre: c.raw.seeks.filter((s) => s.midEqualsPre === true).length + "/" + c.raw.seeks.filter((s) => s.midEqualsPre !== null).length,
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
