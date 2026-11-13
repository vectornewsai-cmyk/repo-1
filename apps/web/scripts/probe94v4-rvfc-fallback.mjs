#!/usr/bin/env node
/**
 * probe94v4-rvfc-fallback.mjs — Phase 9 đợt 94, luồng V4 (nợ LIMITS gộp đợt 93 §4 mục 10).
 * Đo TRONG APP: pump rVFC nuôi snapshot motion-blur thì trên WebKitGTK (0 callback)
 * cửa sổ mù fallback dài bao nhiêu, và fallback đường tick có giữ parity + stall
 * ceiling không. Đối chứng Chromium (rVFC bắn bình thường).
 *
 * Kịch bản: vite dev + Playwright (webkit|chromium, headed qua Xvfb) + seed spec
 * 2 clip blur liên tiếp (c0 0–3s, c1 3–6s, stripes-scroll.mp4, mask ellipse +
 * motionBlur frames 3 — theo spec b-blur của U1 đợt 93). 2 clip để đo memo
 * engine: clip sau có còn tạo pump mù nữa không.
 * Sampler trong trang 100ms: playhead/playing, debug motion-blur (__vcutMotionBlurSnapshots:
 * ring/captures/fallback), số event __vcutRvfcPump, viaRvfc/frameIdx của tick cuối
 * (__vcutTickCost), currentTime mọi element video, ảnh canvas downsample 96x54
 * grayscale (để tính MAD parity theo mediaTime).
 * Chỉ tiêu chính: (1) thời gian từ lúc phát tới lúc rvfcFallback="no-callback"
 * (cửa sổ mù); (2) captures rVFC; (3) MAD canvas theo mediaTime khớp (±16ms)
 * WebKit vs Chromium ở cửa sổ 0–2s và 2–6s; (4) drift playhead − element ct
 * (proxy trần stall giữ: nếu fallback phá hold thì drift phình trong lúc stall).
 *
 * Chạy: node apps/web/scripts/probe94v4-rvfc-fallback.mjs --engine webkit|chromium [--phase pre|post]
 * Scratch: hidden_files/round94-v4/fallback-<engine>-<phase>/fallback-results.json
 * KHÔNG push/tag/binary.
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { chromium, webkit } from "/home/hatch/scratch-round63-r4/node_modules/playwright-core/index.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const argv = process.argv.slice(2);
const ENGINE = argv.includes("--engine") ? argv[argv.indexOf("--engine") + 1] : "webkit";
const PHASE = argv.includes("--phase") ? argv[argv.indexOf("--phase") + 1] : "pre";
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round94-v4", `fallback-${ENGINE}-${PHASE}`);
const CFG_DIR = "/tmp/round94-v4";
const VITE_CFG = path.join(CFG_DIR, "vite.v4.config.mjs");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
fs.mkdirSync(SCRATCH, { recursive: true });
fs.mkdirSync(CFG_DIR, { recursive: true });

const NCLIPS = Math.max(1, Math.min(4, Number(argv.includes("--clips") ? argv[argv.indexOf("--clips") + 1] : "2") || 2));
const SPEC = {
  // KHÔNG mask (chỉ motionBlur): canvas hiện toàn bộ khung sọc nên MAD/
  // gradient parity có ý nghĩa — bản mask (ellipse) chỉ để lại vùng nhỏ
  // có nội dung, metric pixel bị loãng bởi nền đen. Logic fallback của
  // pump giống hệt ở cả 2 mode (chỉ khác geometry snapshot letterbox/unit).
  // --clips 3: clip thứ 3 kiểm tra memo engine (sau 2 clip chết vì
  // no-callback thì clip 3 không tạo pump nữa — không còn cửa sổ mù).
  meta: { fps: 30, height: 720, name: "r94v4-rvfc-fallback", width: 1280 },
  version: "0.2.0",
  tracks: [{
    id: "v0", kind: "video",
    clips: Array.from({ length: NCLIPS }, (_, k) => ({
      id: `c${k}`, kind: "video", src: "stripes-scroll.mp4",
      start: k * 3, duration: 3, in: 0, out: 3,
      motion: { motionBlur: { frames: 3, weights: [1, 1, 1] } },
    })),
  }],
};

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

let vite = null, xvfb = null, browser = null;
async function cleanup() {
  try { if (browser) await browser.close(); } catch {}
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch {}
  try { if (vite) vite.kill("SIGKILL"); } catch {}
}

const STORE_FN = `(async () => {
  const mod = window.__r2storeMod || (window.__r2storeMod = await import("/src/store.ts"));
  return mod.useStore.getState();
})()`;

const INSTALL_SAMPLER = `(async () => {
  const mod = await import("/src/store.ts");
  const st = () => mod.useStore.getState();
  const off = document.createElement("canvas"); off.width = 96; off.height = 54;
  const octx = off.getContext("2d");
  window.__vcut94v4 = { t0: performance.now(), playT0: null, samples: [] };
  setInterval(() => {
    try {
      const s = st();
      const dbg = [];
      try {
        const m = window.__vcutMotionBlurSnapshots;
        if (m) for (const [id, v] of m) dbg.push({ id, ring: v.ring, lastFrame: v.lastFrame, caps: v.rvfcCaptures, dups: v.rvfcSkippedDuplicate, clears: v.ringClears, active: !!v.rvfcActive, fb: v.rvfcFallback ?? "" });
      } catch {}
      const els = (window.__vcutMediaEls || []).filter((e) => e.tag === "VIDEO").map((e) => ({ ct: +e.el.currentTime.toFixed(3), paused: e.el.paused, seeking: e.el.seeking, rs: e.el.readyState }));
      let px = null;
      const c = document.querySelector(".preview-canvas");
      if (c && octx) {
        octx.drawImage(c, 0, 0, 96, 54);
        const d = octx.getImageData(0, 0, 96, 54).data;
        const g = new Array(96 * 54);
        for (let i = 0; i < 96 * 54; i++) g[i] = Math.round((d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3);
        px = g;
      }
      const tick = window.__vcutTickCost || [];
      const lastTick = tick.length ? tick[tick.length - 1] : null;
      window.__vcut94v4.samples.push({
        t: Math.round(performance.now() - window.__vcut94v4.t0),
        ph: +s.playhead.toFixed(3), playing: !!s.playing, dbg, els,
        pumpN: (window.__vcutRvfcPump || []).length,
        viaRvfc: lastTick ? lastTick.viaRvfc : null,
        frameIdx: lastTick ? lastTick.frameIdx : null,
        px,
      });
    } catch {}
  }, 100);
  return true;
})()`;

async function main() {
  if (!VITE_BIN) throw new Error("không thấy vite");
  const DEV_PORT = await pickFreePort(5580, 5589);
  if (!DEV_PORT) throw new Error("hết cổng trống");
  let DISPLAY = null;
  for (const d of [":193", ":194", ":195", ":196", ":197"]) {
    const sockD = `/tmp/.X11-unix/X${d.slice(1)}`;
    let alive = false;
    if (fs.existsSync(sockD)) {
      try { alive = execFileSync("sh", ["-c", `ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`], { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) continue;
      try { fs.unlinkSync(sockD); } catch {}
    }
    DISPLAY = d; break;
  }
  if (!DISPLAY) throw new Error("hết display Xvfb trống :193–:197");
  fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  log(`fallback probe ${ENGINE} phase=${PHASE} vite :${DEV_PORT} DISPLAY=${DISPLAY}`);
  log(`môi trường: ${execFileSync("sh", ["-c", "free -m | head -2 | tail -1; uptime"], { encoding: "utf8" }).trim().replace(/\n/g, " | ")}`);

  let up = false;
  for (let attempt = 1; attempt <= 6 && !up; attempt++) {
    const attemptLog = path.join(SCRATCH, `vite-attempt${attempt}.log`);
    const fd = fs.openSync(attemptLog, "w");
    vite = spawn(VITE_BIN, ["--configLoader", "native", "-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", fd, fd], env: { ...process.env } });
    for (let i = 0; i < 30 && !up; i++) {
      if (vite.exitCode !== null) break;
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(3000) }); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) {
      log(`vite attempt ${attempt} chưa lên (exit=${vite.exitCode})`);
      try { if (vite.exitCode === null) vite.kill("SIGKILL"); } catch {}
      fs.closeSync(fd);
      if (attempt < 6) await sleep(10000);
    } else fs.closeSync(fd);
  }
  if (!up) throw new Error("vite dev không lên sau 6 lần thử");
  log("vite dev đã lên");

  for (let xAttempt = 1; xAttempt <= 3; xAttempt++) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode === null && fs.existsSync(`/tmp/.X11-unix/X${DISPLAY.slice(1)}`)) { log(`Xvfb ${DISPLAY} đã lên`); break; }
    try { xvfb.kill("SIGKILL"); } catch {}
    xvfb = null;
    if (xAttempt === 3) throw new Error("Xvfb không khởi động được sau 3 lần thử");
    await sleep(15000);
  }

  const pw = ENGINE === "webkit" ? webkit : chromium;
  const launchEnv = { ...process.env, DISPLAY };
  if (ENGINE === "webkit") launchEnv.GST_PLUGIN_SYSTEM_PATH = "/usr/lib/x86_64-linux-gnu/gstreamer-1.0";
  browser = await pw.launch({ headless: false, env: launchEnv });
  log(`${ENGINE} launched, version: ${browser.version()}`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrs = [];
  page.on("pageerror", (e) => pageErrs.push("pageerror: " + String(e && e.message || e).slice(0, 300)));
  page.on("crash", () => pageErrs.push("PAGE-CRASH"));
  const evalJs = (expr) => page.evaluate(expr);

  await page.goto(DEV_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  let booted = false;
  for (let i = 0; i < 240; i++) {
    const hasCanvas = await evalJs(`!!document.querySelector("#vcut-preview-wrap canvas.preview-canvas")`).catch(() => false);
    if (hasCanvas) { booted = true; break; }
    if (i % 40 === 39) log(`chờ app boot… ${(i + 1) * 0.5}s`);
    await sleep(500);
  }
  if (!booted) throw new Error("app không boot (không thấy canvas preview)");
  log("app boot OK");
  for (let i = 0; i < 20; i++) {
    const closed = await evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return "closed"; } return "no-modal"; })()`).catch(() => "err");
    if (closed === "closed") break;
    await sleep(500);
  }

  const specJson = JSON.stringify(SPEC).replace(/`/g, "\\`").replace(/\$/g, "\\$");
  const seeded = await evalJs(`(async () => {
    const st = await (${STORE_FN});
    st.replaceProject(${specJson});
    const res = await fetch("/stripes-scroll.mp4");
    if (!res.ok) return { error: "fetch media lỗi " + res.status };
    const blob = await res.blob();
    const file = new File([blob], "stripes-scroll.mp4", { type: "video/mp4" });
    const st2 = await (${STORE_FN});
    await st2.importFiles([file]);
    const st3 = await (${STORE_FN});
    return { media: (st3.media || []).map((m) => m.name), clips: st3.spec.tracks.flatMap((t) => t.clips.map((c) => c.id)) };
  })()`);
  log("seed: " + JSON.stringify(seeded));
  if (!seeded || seeded.error || !(seeded.media || []).includes("stripes-scroll.mp4")) throw new Error("seed media thất bại");
  await sleep(1500);

  await evalJs(INSTALL_SAMPLER);
  log("sampler đã cài");
  // Phát từ đầu, chạy hết N clip (N*3 s project) rồi dừng.
  await evalJs(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(0); window.__vcut94v4.playT0 = performance.now(); if (!st.playing) st.togglePlay(); return true; })()`);
  const playStartWall = Date.now();
  const endPh = NCLIPS * 3 - 0.2;
  let done = false;
  while (Date.now() - playStartWall < 90000) {
    const st = await evalJs(STORE_FN).catch(() => null);
    if (st && st.playhead > endPh) { done = true; break; }
    await sleep(500);
  }
  if (!done) log(`CẢNH BÁO: playhead chưa tới ${endPh} sau 90s — vẫn lấy mẫu đã có`);
  await evalJs(`(async () => { const st = await (${STORE_FN}); if (st.playing) st.togglePlay(); return true; })()`).catch(() => null);
  await sleep(500);
  const result = await evalJs(`(() => {
    const s = window.__vcut94v4 || { samples: [] };
    const playT0abs = s.playT0;
    const pump = (window.__vcutRvfcPump || []).map((e) => ({ seq: e.seq, tInvoke: Math.round(e.tInvoke), relPlayMs: playT0abs === null ? null : Math.round(e.tInvoke - playT0abs), frameIdx: e.frameIdx, decision: e.decision, capMs: e.capMs === null ? null : +e.capMs.toFixed(1), presentedFrames: e.presentedFrames, mediaTime: e.mediaTime }));
    const tick = (window.__vcutTickCost || []).slice(-400).map((e) => ({ wallMs: Math.round(e.wallMs), frameIdx: e.frameIdx, viaRvfc: e.viaRvfc, path: e.path, total: +e.total.toFixed(1) }));
    const dbg = (() => { try { const m = window.__vcutMotionBlurSnapshots; return m ? [...m.entries()].map(([id, v]) => ({ id, ring: v.ring, lastFrame: v.lastFrame, caps: v.rvfcCaptures, dups: v.rvfcSkippedDuplicate, clears: v.ringClears, active: !!v.rvfcActive, fb: v.rvfcFallback ?? "" })) : null; } catch { return null; } })();
    return { engine: null, phase: null, userAgent: navigator.userAgent, playT0rel: s.playT0 === null ? null : Math.round(s.playT0 - s.t0), samples: s.samples, pump, tick, dbgFinal: dbg, silentEngine: window.__vcutRvfcSilentEngine === true };
  })()`).catch((e) => ({ __error: String(e).slice(0, 300) }));
  if (result.__error) throw new Error("lấy kết quả lỗi: " + result.__error);
  result.engine = ENGINE;
  result.phase = PHASE;
  result.pageErrs = pageErrs;
  result.loadavg = (() => { try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return ""; } })();
  fs.writeFileSync(path.join(SCRATCH, "fallback-results.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(SCRATCH, "fallback-log.txt"), logLines.join("\n") + "\n");

  // Tóm tắt nhanh cửa sổ mù + captures.
  const playT0 = result.playT0rel ?? 0;
  const fbAt = {};
  for (const sm of result.samples) {
    for (const d of sm.dbg || []) {
      if (d.fb && fbAt[d.id] === undefined) fbAt[d.id] = sm.t - playT0;
    }
  }
  const caps = {};
  for (const d of result.dbgFinal || []) caps[d.id] = d.caps;
  const pumpN = result.pump.length;
  const firstCb = pumpN && result.pump[0].relPlayMs !== null ? result.pump[0].relPlayMs : null;
  log(`KẾT QUẢ ${ENGINE} ${PHASE}: pumpCallbacks=${pumpN} firstCbRelMs=${firstCb} fallbackAtMs=${JSON.stringify(fbAt)} capsFinal=${JSON.stringify(caps)} samples=${result.samples.length} silentEngine=${result.silentEngine} pageErrs=${pageErrs.length}`);
  await cleanup();
}

main().catch(async (e) => {
  console.error("FALLBACK PROBE LỖI: " + (e && e.stack || e));
  try { fs.writeFileSync(path.join(SCRATCH, "fallback-error.txt"), String(e && e.stack || e)); } catch {}
  try { fs.writeFileSync(path.join(SCRATCH, "fallback-log.txt"), logLines.join("\n") + "\n"); } catch {}
  await cleanup();
  process.exit(2);
}).then(() => process.exit(0));
