// clicktest-86n3-seek-skip-render.mjs — Phase 9 đợt 86, luồng N3 (W6):
// smoke test trong app thật cho thay đổi production "bỏ qua renderFrame
// của tick đang phát khi clip video xuôi đang seeking"
// (seekSkipRender86N3.ts + gate trong preview.tsx).
//
// Kiểm tra (không phải A/B đầy đủ — A/B số đo ở probe thô
// webkit_seek_heldframe_86n3 / _heldframe2_86n3):
//   1. Không có window error / unhandled rejection trong lúc phát + scrub.
//   2. __vcutSeekSkipRenderTicks86N3 TĂNG sau cú scrub khi đang phát
//      (gate bắn thật trong app).
//   3. Sau seek, playhead vẫn chạy tiếp + element đồng bộ (không kẹt,
//      không chết vòng lặp).
//   4. Canvas preview KHÔNG đen sau seek (frame giữ còn hiển thị,
//      không phải nền đen) — đo độ sáng trung bình qua toDataURL
//      (clip import dạng File → blob URL cùng origin nên không taint).
// Dự án: 1 clip H.264 30 s GOP 250 (trường hợp xấu nhất của probe).
//   Chạy: N3_ENGINE=chromium|webkit|both xvfb-run -a node
//         apps/web/scripts/clicktest-86n3-seek-skip-render.mjs
// Báo cáo JSON + ảnh chụp ở hidden_files/round86-n3/headed/ (bằng chứng,
// KHÔNG stage). Clip ở /tmp/n3/clips (KHÔNG stage binary).
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { writeFileEpermRetry } from "./eperm-retry.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round86-n3", "headed");
const CLIP_PATH = process.env.N3_CLIP || "/tmp/n3/clips/w6_h264_30s_g250_640.mp4";
const CLIP_NAME = "w6_h264_30s_g250_640.mp4";
const CLIP_DUR = 30;
const ENGINE = process.env.N3_ENGINE || "both";
const req = createRequire(import.meta.url);
const { chromium, webkit } = req("/home/hatch/scratch-round63-r4/node_modules/playwright-core");

fs.mkdirSync(SCRATCH, { recursive: true });
const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}

const INJECT_ERRORS = `(() => {
  window.__n3errors = [];
  window.addEventListener("error", (e) => { try { window.__n3errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__n3errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__n3errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__n3errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__n3storeMod || (window.__n3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const SETUP_FN = `(async (clipUrl, clipName) => {
  const st = await (${STORE_FN});
  const ver = st.spec.version;
  st.newProject();
  const st2 = await (${STORE_FN});
  st2.replaceProject({
    version: ver,
    meta: { name: "N3 seek-skip", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v1", kind: "video", label: "Video 1", clips: [
      { kind: "video", id: "c-n3", src: clipName, start: 0, duration: __DUR__, in: 0, out: __DUR__ },
    ] }],
  });
  const buf = await (await fetch(clipUrl)).arrayBuffer();
  const file = new File([buf], clipName, { type: "video/mp4" });
  const st3 = await (${STORE_FN});
  await st3.importFiles([file]);
  const st4 = await (${STORE_FN});
  const item = st4.media.find((m) => m.name === clipName);
  return { mediaName: item ? item.name : null, mediaKind: item ? item.kind : null };
})(__CLIP_URL__, __CLIP_NAME__)`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const els = (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag,
    currentTime: +e.el.currentTime.toFixed(3), paused: e.el.paused,
    seeking: e.el.seeking, readyState: e.el.readyState }));
  return {
    playhead: +st.playhead.toFixed(3), playing: st.playing,
    skipTicks: window.__vcutSeekSkipRenderTicks86N3 ?? 0,
    errors: (window.__n3errors || []).slice(),
    els,
  };
})()`;

const BRIGHT_FN = `(() => {
  try {
    const c = document.querySelector("#vcut-preview-wrap canvas") || document.querySelector("canvas");
    if (!c) return { ok: false, reason: "no-canvas" };
    const t = document.createElement("canvas");
    t.width = 80; t.height = 45;
    const x = t.getContext("2d");
    x.drawImage(c, 0, 0, 80, 45);
    const d = x.getImageData(0, 0, 80, 45).data;
    let sum = 0, black = 0;
    for (let i = 0; i < d.length; i += 4) {
      const m = (d[i] + d[i + 1] + d[i + 2]) / 3;
      sum += m;
      if (m < 8) black++;
    }
    const n = d.length / 4;
    return { ok: true, mean: +(sum / n).toFixed(1), blackFrac: +(black / n).toFixed(3), w: c.width, h: c.height };
  } catch (e) { return { ok: false, reason: "tainted-or-error: " + String(e && e.message) }; }
})()`;

async function waitFor(fn, desc, timeoutMs, page) {
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < timeoutMs) {
    try { last = await fn(); if (last) return last; } catch {}
    await sleep(250);
  }
  throw new Error(`timeout chờ ${desc} sau ${timeoutMs}ms (last=${JSON.stringify(last)})`);
}

async function runEngine(engineName, devUrl, clipUrl) {
  const tag = engineName;
  const launchOpts = { headless: false };
  if (engineName === "webkit") {
    launchOpts.env = {
      ...process.env,
      GST_PLUGIN_PATH: "/tmp/n3/webkit-libs/usr/lib/x86_64-linux-gnu/gstreamer-1.0",
      GST_PLUGIN_SCANNER: "/tmp/n3/webkit-libs/usr/lib/x86_64-linux-gnu/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner",
      GST_REGISTRY: "/tmp/n3/gst-registry.bin",
    };
  }
  const browser = await (engineName === "webkit" ? webkit : chromium).launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const out = { engine: engineName, verdict: "FAIL", steps: {} };
  try {
    await page.goto(devUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.addInitScript(INJECT_ERRORS);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await waitFor(async () => {
      const ok = await page.evaluate(() => !!document.querySelector("canvas") && !!window.__vcutMediaEls !== undefined);
      return ok || null;
    }, "app mount", 60000, page);
    await sleep(1000);
    // Đóng modal chào mừng (fresh profile nào cũng hiện) để ảnh chụp
    // thấy được preview; modal không ảnh hưởng số đo nhưng che canvas.
    await page.getByText("Để sau", { exact: true }).click({ timeout: 5000 }).catch(() => {});
    await sleep(500);
    const setup = await page.evaluate(SETUP_FN.replaceAll("__CLIP_URL__", JSON.stringify(clipUrl)).replaceAll("__CLIP_NAME__", JSON.stringify(CLIP_NAME)).replaceAll("__DUR__", String(CLIP_DUR)));
    log(`[${tag}] setup: ${JSON.stringify(setup)}`);
    if (!setup.mediaName) throw new Error("import clip thất bại (mediaName null)");
    out.steps.setup = setup;
    // Phát từ 0.
    await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(0); if (!s.playing) s.togglePlay(); })()`);
    const synced = await waitFor(async () => {
      const s = await page.evaluate(STATE_FN);
      const v = s.els.find((e) => e.tag === "VIDEO");
      if (v && !v.paused && !v.seeking && v.currentTime >= 1.0 && Math.abs(v.currentTime - s.playhead) <= 1.0) return s;
      return null;
    }, "element đồng bộ khi phát", 60000, page);
    log(`[${tag}] phát đồng bộ: playhead=${synced.playhead} ct=${synced.els[0].currentTime}`);
    out.steps.playSync = { playhead: synced.playhead, ct: synced.els[0].currentTime };
    const base = await page.evaluate(STATE_FN);
    const brightBase = await page.evaluate(BRIGHT_FN);
    log(`[${tag}] baseline: skipTicks=${base.skipTicks} bright=${JSON.stringify(brightBase)}`);
    out.steps.baseline = { skipTicks: base.skipTicks, bright: brightBase };
    // Scrub khi đang phát: NHIỀU cú nhảy xa liên tiếp (mỗi 400 ms) để
    // ép element seeking liên tục — seek đơn dưới tải thấp có thể xong
    // trước cả 1 tick rAF nên gate không kịp bắn (chạy WebKit lần 2:
    // skipTicks kẹt 0 dù seek vẫn chạy); scrub dồn dập bảo đảm có tick
    // rơi vào lúc seeking. Chốt bằng setPlayhead(20) rồi quan sát.
    const scrubTargets = [20, 5, 25, 10, 28, 2, 22, 7];
    const tScrub = Date.now();
    for (const target of scrubTargets) {
      await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(${target}); })()`);
      await sleep(400);
    }
    await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(20); })()`);
    const samples = [];
    let maxSkip = base.skipTicks;
    for (let i = 0; i < 50; i++) {
      await sleep(100);
      const s = await page.evaluate(STATE_FN);
      const b = await page.evaluate(BRIGHT_FN);
      maxSkip = Math.max(maxSkip, s.skipTicks);
      samples.push({ dt: +((Date.now() - tScrub) / 1000).toFixed(2), playhead: s.playhead, ct: s.els[0] ? s.els[0].currentTime : null, seeking: s.els[0] ? s.els[0].seeking : null, skipTicks: s.skipTicks, brightMean: b.ok ? b.mean : null, brightBlack: b.ok ? b.blackFrac : null });
      if (i === 9) await page.screenshot({ path: path.join(SCRATCH, `n3-${tag}-scrub-1s.png`) });
      if (i === 29) await page.screenshot({ path: path.join(SCRATCH, `n3-${tag}-scrub-3s.png`) });
    }
    const after = samples[samples.length - 1];
    // Canvas sáng: poll tới 20 s vì WebKitGTK đói decoder lúc đầu
    // (readyState tụt 0, chưa có frame tốt để vẽ — xem diag
    // webkit_app_diag: canvas chỉ sáng sau ~10 s; không phải lỗi gate).
    let brightAfter = await page.evaluate(BRIGHT_FN);
    const tBright0 = Date.now();
    while ((!brightAfter.ok || brightAfter.mean <= 50) && Date.now() - tBright0 < 20000) {
      await sleep(1000);
      brightAfter = await page.evaluate(BRIGHT_FN);
    }
    log(`[${tag}] sau scrub dồn dập: skipTicks ${base.skipTicks}→${maxSkip}, cuối playhead=${after.playhead} ct=${after.ct} bright=${JSON.stringify(brightAfter)}`);
    out.steps.scrub = { skipBefore: base.skipTicks, skipMax: maxSkip, lastSample: after, brightAfter, samples };
    // Scrub ngược về 5s khi đang phát. Lưu ý: clip có thể đã phát tới
    // cuối trong lúc quan sát scrub trước (playhead=30 → playing=false)
    // — khi đó phải togglePlay lại sau khi setPlayhead, nếu không app
    // ở trạng thái pause và check "đang phát" sẽ FAIL oan.
    await page.evaluate(`(async () => { const s = await (${STORE_FN}); s.setPlayhead(5); if (!s.playing) s.togglePlay(); })()`);
    await sleep(3000);
    const after2 = await page.evaluate(STATE_FN);
    const bright2 = await page.evaluate(BRIGHT_FN);
    log(`[${tag}] sau scrub về 5s: skipTicks=${after2.skipTicks} playing=${after2.playing} playhead=${after2.playhead} ct=${after2.els[0] && after2.els[0].currentTime} bright=${JSON.stringify(bright2)}`);
    out.steps.scrubBack = { skipTicks: after2.skipTicks, playhead: after2.playhead, ct: after2.els[0] && after2.els[0].currentTime, bright: bright2, errors: after2.errors };
    // Chốt verdict.
    const errors = (after2.errors || []);
    const gateFired = maxSkip > base.skipTicks;
    const playingOn = after2.playing && after2.playhead > 5.5;
    const notBlack = brightAfter.ok && brightAfter.mean > 5 && bright2.ok && bright2.mean > 5;
    out.steps.checks = { gateFired, playingOn, notBlack, errors };
    out.verdict = errors.length === 0 && gateFired && playingOn && notBlack ? "PASS" : "FAIL";
    log(`[${tag}] VERDICT ${out.verdict} — gateFired=${gateFired} playingOn=${playingOn} notBlack=${notBlack} errors=${errors.length}`);
    return out;
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  let vite = null, clipServer = null;
  const killAll = () => { try { vite?.kill("SIGKILL"); } catch {} try { clipServer?.close(); } catch {} try { fs.rmSync(path.join(WEB_DIR, "vite.n3.config.mjs"), { force: true }); } catch {} };
  const report = { startedAt: new Date().toISOString(), loadStart: os.loadavg(), engines: {} };
  try {
    const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_PORT = await pickFreePort(5901, 5999);
    const CLIP_PORT = await pickFreePort(8901, 8999);
    if (!DEV_PORT || !CLIP_PORT) throw new Error("hết cổng trống");
    const devUrl = `http://127.0.0.1:${DEV_PORT}/`;
    const clipUrl = `http://127.0.0.1:${CLIP_PORT}/${CLIP_NAME}`;
    // Clip server (range + CORS).
    const MIME = { ".mp4": "video/mp4" };
    clipServer = http.createServer((rq, rs) => {
      const p = decodeURIComponent(new URL(rq.url, "http://x").pathname);
      if (p === "/" || p === "/index.html") { rs.writeHead(200, { "Content-Type": "text/html" }); rs.end("<!doctype html><title>clip</title>"); return; }
      const f = path.join(path.dirname(CLIP_PATH), path.basename(p));
      if (!fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
      const st = fs.statSync(f);
      const range = rq.headers.range;
      const headers = { "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes" };
      if (range) {
        const m = /bytes=(\d+)-(\d*)/.exec(range);
        const start = m ? +m[1] : 0;
        const end = m && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
        rs.writeHead(206, { ...headers, "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
        fs.createReadStream(f, { start, end }).pipe(rs);
      } else {
        rs.writeHead(200, { ...headers, "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Content-Length": st.size });
        fs.createReadStream(f).pipe(rs);
      }
    });
    await new Promise((r) => clipServer.listen(CLIP_PORT, "127.0.0.1", r));
    // Vite dev.
    const viteCfg = path.join(WEB_DIR, "vite.n3.config.mjs");
    writeFileEpermRetry(viteCfg, `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()], server: { host: "127.0.0.1", port: ${DEV_PORT}, strictPort: true, hmr: false } });\n`);
    vite = spawn(VITE_BIN, ["--config", viteCfg], { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"] });
    let viteLog = "";
    vite.stdout.on("data", (d) => { viteLog += d.toString(); });
    vite.stderr.on("data", (d) => { viteLog += d.toString(); });
    await waitFor(async () => {
      try {
        const res = await fetch(devUrl);
        return res.status === 200 ? true : null;
      } catch { return null; }
    }, "vite dev trả 200", 120000);
    log(`vite dev sẵn sàng: ${devUrl} (clip: ${clipUrl})`);
    const engines = ENGINE === "both" ? ["chromium", "webkit"] : [ENGINE];
    for (const e of engines) {
      try {
        report.engines[e] = await runEngine(e, devUrl, clipUrl);
      } catch (err) {
        log(`[${e}] LỖI: ${err && err.message}`);
        report.engines[e] = { engine: e, verdict: "FAIL", error: String(err && err.message) };
      }
    }
    report.loadEnd = os.loadavg();
    report.finishedAt = new Date().toISOString();
    writeFileEpermRetry(path.join(SCRATCH, "n3-seek-skip-report.json"), JSON.stringify(report, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "n3-run.log"), logLines.join("\n") + "\n");
    console.log(`XONG — báo cáo: ${path.join(SCRATCH, "n3-seek-skip-report.json")}`);
    const allPass = Object.values(report.engines).every((r) => r.verdict === "PASS");
    process.exit(allPass ? 0 : 2);
  } catch (e) {
    console.log("HARNESS LỖI: " + (e && e.message || e));
    try { writeFileEpermRetry(path.join(SCRATCH, "n3-seek-skip-report.json"), JSON.stringify(report, null, 2)); } catch {}
    process.exit(2);
  } finally {
    killAll();
  }
}

main();
