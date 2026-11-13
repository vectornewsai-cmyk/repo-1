#!/usr/bin/env node
/**
 * probe96x4b.mjs — Phase 9 đợt 96, luồng X4b (bản sao probe96x4.mjs của X4,
 * chỉ đổi scratch sang round96-x4b để không ghi đè dữ liệu X4 gốc).
 * Đo: (1) ân hạn 1 tick sau re-arm có HỦY được re-seek nào ở tải vừa
 * (rAF gap 300–500 ms) không; (2) chu kỳ stall dài (baseline cho
 * kẹp-dt/slew/ân-hạn-suốt-watch); (3) bằng chứng nhả trần 5000 ms.
 * Khác probe95w5: scratch round96-x4b, --loadN <n> (1–4 tiến trình yes
 * để chỉnh tải vào băng 300–500 ms), display Xvfb qua lock
 * xvfb-display.mjs (W8), sampler ghi thêm restartV (đếm riêng đường
 * restartEnded — resyncsV gộp cả 3 đường forceSeek/drift/restart),
 * log mtime preview.tsx đầu/cuối lượt (X2 cũng sửa file này — lượt nào
 * mtime đổi giữa chừng thì LOẠI).
 *
 * Chạy: node apps/web/scripts/probe96x4b.mjs --engine webkit --loadN 3 [--phase <tag>] [--gop 250|30|60]
 * Scratch: hidden_files/round96-x4b/probe-<engine>-load<n>-gop<gop>-<phase>/. KHÔNG push/tag/binary.
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { claimXvfbDisplay, releaseXvfbDisplay } from "./xvfb-display.mjs";
import { chromium, webkit } from "/home/hatch/scratch-round63-r4/node_modules/playwright-core/index.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const HEAD = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round87-o8", "headed");

const argv = process.argv.slice(2);
const GOP = argv.includes("--gop") ? argv[argv.indexOf("--gop") + 1] : "250";
const T3_CLIPS = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round92-t3", "clips");
const CLIP_B = argv.includes("--clip")
  ? argv[argv.indexOf("--clip") + 1]
  : GOP === "250"
    ? path.join(HEAD, "o8-ball-720p-6s.mp4")
    : path.join(T3_CLIPS, `o8-ball-720p-6s-gop${GOP}.mp4`);
const CLIP_B_NAME = path.basename(CLIP_B);
const ENGINE = argv.includes("--engine") ? argv[argv.indexOf("--engine") + 1] : "chromium";
const LOAD = argv.includes("--load");
const LOAD4 = argv.includes("--load4");
const LOAD_N = argv.includes("--loadN") ? Number(argv[argv.indexOf("--loadN") + 1]) : (LOAD4 ? 4 : (LOAD ? 3 : 0));
if (!Number.isInteger(LOAD_N) || LOAD_N < 0 || LOAD_N > 4) throw new Error("--loadN phải là số nguyên 0–4");
const PHASE = argv.includes("--phase") ? argv[argv.indexOf("--phase") + 1] : "pre";
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round96-x4b", `probe-${ENGINE}-load${LOAD_N}-gop${GOP}-${PHASE}`);
const CFG_DIR = "/tmp/round96-x4b";
const VITE_CFG = path.join(CFG_DIR, "vite.r2.config.mjs");
const BRIDGE_WORK_DIR = "/tmp/round96-x4b/bridge-work";
// Đợt 96 X4 — mtime preview.tsx đầu/cuối lượt (X2 cũng sửa file này).
const PREVIEW_TSX = path.join(ROOT, "apps", "web", "src", "preview.tsx");
const previewMtime = () => { try { return fs.statSync(PREVIEW_TSX).mtime.toISOString(); } catch { return null; } };
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = { engine: ENGINE, load: LOAD_N > 0, loadN: LOAD_N, phase: PHASE, gop: GOP, clip: CLIP_B_NAME, samples: [], analysis: null };

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

const STORE_FN = `(async () => {
  const mod = window.__r2storeMod || (window.__r2storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    playhead: st.playhead,
    playing: st.playing,
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => ({ id: c.id, kind: c.kind, src: c.src, start: c.start, duration: c.duration }))),
  };
})()`;

// Đo canvas: centroid tối (ô đen của clip bóng) trong vùng video (bbox sáng).
// Chuỗi này là 1 arrow function (KHÔNG tự gọi) để caller gán `const measure = ...`.
const MEASURE_FN = `(() => {
  const c = document.querySelector(".preview-canvas");
  if (!c) return null;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const img = ctx.getImageData(0, 0, W, H).data;
  let bn = 0, bx = 0, by = 0;
  let bx0 = W, bx1 = 0, by0 = H, by1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const i = (y * W + x) * 4;
    if (img[i+3] > 128 && img[i] > 180 && img[i+1] > 180 && img[i+2] > 180) { bn++; bx += x; by += y; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
  }
  let dn = 0, dx = 0, dy = 0;
  if (bn > 0) {
    for (let y = by0; y <= by1; y += 2) for (let x = bx0; x <= bx1; x += 2) {
      const i = (y * W + x) * 4;
      if (img[i+3] > 128 && img[i] < 60 && img[i+1] < 60 && img[i+2] < 60) { dn++; dx += x; dy += y; }
    }
  }
  return { W, H,
    darkN: dn, darkCx: dn ? +(dx / dn / W).toFixed(4) : null, darkCy: dn ? +(dy / dn / H).toFixed(4) : null,
    brightN: bn };
})`;

const ELS_FN = `((window.__vcutMediaEls || []).map((e) => ({
  tag: e.tag,
  t: +e.el.currentTime.toFixed(3),
  paused: e.el.paused,
  seeking: e.el.seeking,
  readyState: e.el.readyState,
})))`;

let vite = null, bridge = null, xvfb = null, browser = null, loadProcs = [];
let xvfbClaim = null;

async function startBridge(port) {
  const logFd = fs.openSync(path.join(SCRATCH, "r2-bridge.log"), "a");
  const b = spawn("node", [path.join(ROOT, "server", "bridge", "src", "index.js")], {
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR,
      BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-r2-${process.pid}.json`) },
  });
  const url = `http://127.0.0.1:${port}`;
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { const r = await fetch(`${url}/api/proxy/file/nope.mp4`); if (r.status === 404 || r.status === 400) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`bridge không lên ở ${url} sau 120s`);
  log(`bridge OK: ${url}`);
  return b;
}

async function cleanup() {
  for (const p of loadProcs) { try { p.kill("SIGKILL"); } catch {} }
  loadProcs = [];
  try { if (browser) await browser.close(); } catch {}
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch {}
  try { releaseXvfbDisplay(xvfbClaim); } catch {}
  xvfbClaim = null;
  try { if (vite) vite.kill("SIGKILL"); } catch {}
  try { if (bridge) bridge.kill("SIGKILL"); } catch {}
}

async function main() {
  if (!fs.existsSync(CLIP_B)) throw new Error("thiếu fixture clip bóng " + CLIP_B);
  if (!VITE_BIN) throw new Error("không thấy vite");
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.mkdirSync(CFG_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
  const bridgePort = await pickFreePort(8881, 8889);
  const DEV_PORT = await pickFreePort(5580, 5589);
  if (!bridgePort || !DEV_PORT) throw new Error("hết cổng trống");
  // Đợt 96 X4 — claim display qua lock nguyên tử (W8), fail-fast khi hết.
  xvfbClaim = claimXvfbDisplay();
  if (!xvfbClaim) throw new Error("hết display Xvfb trống :193–:197 (đã có chủ — không chờ, không cướp)");
  const DISPLAY = xvfbClaim.display;
  log(`Xvfb display đã claim qua lock: ${DISPLAY}`);
  const startXvfb = async () => {
    for (let xAttempt = 1; xAttempt <= 3; xAttempt++) {
      xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
      await sleep(900);
      if (xvfb.exitCode === null && fs.existsSync(`/tmp/.X11-unix/X${DISPLAY.slice(1)}`)) {
        log(`Xvfb ${DISPLAY} đã lên`);
        return;
      }
      log(`Xvfb ${DISPLAY} chưa lên lần ${xAttempt} (exit=${xvfb.exitCode}), thử lại sau 15s`);
      try { xvfb.kill("SIGKILL"); } catch {}
      xvfb = null;
      if (xAttempt < 3) await sleep(15000);
    }
    throw new Error("Xvfb không khởi động được sau 3 lần thử (sóng EPERM?)");
  };
  writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
  const BRIDGE_URL = `http://127.0.0.1:${bridgePort}`;
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  log(`probe96x4b ${ENGINE} loadN=${LOAD_N} phase=${PHASE} gop=${GOP} clip=${CLIP_B_NAME} vite :${DEV_PORT} bridge :${bridgePort} DISPLAY=${DISPLAY}`);
  log(`preview.tsx mtime lúc bắt đầu: ${previewMtime()}`);
  results.previewMtimeBefore = previewMtime();
  log(`môi trường lúc bắt đầu: ${execFileSync("sh", ["-c", "free -m | head -2 | tail -1; uptime"], { encoding: "utf8" }).trim().replace(/\n/g, " | ")}`);

  bridge = await startBridge(bridgePort);
  const waveProbeFile = "/tmp/round96-x4b/wave-probe.tmp";
  let waveOff = false;
  for (let w = 1; w <= 60 && !waveOff; w++) {
    try {
      fs.writeFileSync(waveProbeFile, "x");
      waveOff = true;
    } catch {
      if (w % 6 === 0) log(`sóng EPERM vẫn bật sau ${w * 10}s chờ, tiếp tục chờ…`);
      await sleep(10000);
    }
  }
  try { fs.unlinkSync(waveProbeFile); } catch {}
  if (waveOff) log("sóng EPERM đã tắt, khởi động vite");
  else log("CẢNH BÁO: chờ sóng EPERM 10 phút không tắt — thử khởi động vite dù sao");
  let up = false;
  let lastViteErr = "";
  for (let attempt = 1; attempt <= 8 && !up; attempt++) {
    const attemptLog = path.join(SCRATCH, `r2-vite-attempt${attempt}.log`);
    const fd = fs.openSync(attemptLog, "w");
    vite = spawn(VITE_BIN, ["--configLoader", "native", "-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", fd, fd], env: { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL } });
    for (let i = 0; i < 30 && !up; i++) {
      if (vite.exitCode !== null) break;
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(3000) }); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) {
      try { lastViteErr = fs.readFileSync(attemptLog, "utf8").split("\n").slice(0, 6).join(" | "); } catch {}
      log(`vite attempt ${attempt} chưa lên (exit=${vite.exitCode}): ${lastViteErr.slice(0, 300)}`);
      try { if (vite.exitCode === null) vite.kill("SIGKILL"); } catch {}
      fs.closeSync(fd);
      if (attempt < 8) await sleep(15000);
    } else {
      fs.closeSync(fd);
    }
  }
  if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 8 lần thử (lỗi cuối: ${lastViteErr.slice(0, 300)})`);
  log("vite dev đã lên");
  await startXvfb();

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
  const t0 = Date.now();
  let s0 = null;
  while (Date.now() - t0 < 240000) {
    const st = await evalJs(STORE_FN).catch(() => null);
    if (st && st.clipCount === 3 && st.mediaCount === 2) { s0 = st; break; }
    await sleep(500);
  }
  if (!s0) throw new Error("mẫu không tự load sau 240s: " + JSON.stringify(await evalJs(STORE_FN).catch(() => null)));
  log(`S0 mẫu tự load (${((Date.now() - t0) / 1000).toFixed(1)}s): 3 clip, 2 media`);

  await evalJs(`(() => {
    const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
    const cb = label?.querySelector('input[type="checkbox"]');
    if (cb && cb.checked) cb.click();
    return true;
  })()`).catch(() => null);
  await sleep(500);

  await page.setInputFiles(".mediabin input[type='file']", CLIP_B);
  let card = null;
  const tCard = Date.now();
  while (Date.now() - tCard < 120000) {
    card = await evalJs(`(() => {
      const c = [...document.querySelectorAll(".media-card")].find((x) => (x.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(CLIP_B_NAME)});
      if (!c) return null;
      const b = [...c.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Thêm"));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`).catch(() => null);
    if (card) break;
    await sleep(500);
  }
  if (!card) throw new Error("không thấy thẻ media clip bóng sau 120s");
  const before = await evalJs(STORE_FN).catch(() => null);
  let added = false;
  const getAddRect = async () => evalJs(`(() => {
    const c = [...document.querySelectorAll(".media-card")].find((x) => (x.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(CLIP_B_NAME)});
    if (!c) return null;
    c.scrollIntoView({ block: "center" });
    const b = [...c.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Thêm"));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`).catch(() => null);
  for (let a = 1; a <= 5 && !added; a++) {
    const rect = await getAddRect();
    if (!rect) break;
    await page.mouse.click(Math.round(rect.x), Math.round(rect.y));
    await sleep(1500);
    const after = await evalJs(STORE_FN).catch(() => null);
    added = !!(after && after.clipCount > (before?.clipCount ?? 0));
    if (!added) log(`thêm clip bóng: lần ${a} chưa thêm được (clipCount=${after?.clipCount}), thử lại`);
  }
  if (!added) {
    const jsClicked = await evalJs(`(() => {
      const c = [...document.querySelectorAll(".media-card")].find((x) => (x.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(CLIP_B_NAME)});
      const b = [...(c?.querySelectorAll("button") || [])].find((x) => (x.textContent || "").includes("Thêm"));
      if (!b) return false;
      b.click();
      return true;
    })()`).catch(() => false);
    await sleep(1500);
    const afterJs = await evalJs(STORE_FN).catch(() => null);
    added = !!(afterJs && afterJs.clipCount > (before?.clipCount ?? 0));
    if (added) log("thêm clip bóng: mouse click trượt, JS .click() fallback đã thêm được");
  }
  if (!added) throw new Error("không thêm được clip bóng lên timeline");
  let stB = await evalJs(STORE_FN).catch(() => null);
  const clipB = stB?.clips?.find((c) => c.src === CLIP_B_NAME);
  if (!clipB) throw new Error("không thấy clip bóng trong store sau khi thêm");
  log(`clip bóng trên timeline: id=${clipB.id} start=${clipB.start} duration=${clipB.duration}`);
  const iso = await evalJs(`(async () => {
    const mod = await import("/src/store.ts");
    mod.useStore.setState((s) => ({ spec: { ...s.spec, tracks: s.spec.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.id === ${JSON.stringify(clipB.id)}) })) } }));
    return mod.useStore.getState().spec.tracks.reduce((n, t) => n + t.clips.length, 0) === 1;
  })()`).catch(() => false);
  if (!iso) throw new Error("không cô lập được clip bóng");
  await sleep(800);
  const clipStart = clipB.start;

  // Pause-seek có xác nhận tới t=5 (mượn sampler của probe89q5).
  const SEEK_SAMPLE_FN = (target, localT, expProjX) => `(async () => {
    const mod = window.__r2storeMod || (window.__r2storeMod = await import("/src/store.ts"));
    const st = mod.useStore.getState();
    const canvasExpected = (m, fx, fy) => {
      const s = Math.min(m.W / 1280, m.H / 720);
      const dw = 1280 * s, dh = 720 * s;
      return { cx: +(((m.W - dw) / 2 + fx * dw) / m.W).toFixed(4), cy: +(((m.H - dh) / 2 + fy * dh) / m.H).toFixed(4) };
    };
    const measure = ${MEASURE_FN};
    const els = () => (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag, t: +e.el.currentTime.toFixed(3), seeking: e.el.seeking, readyState: e.el.readyState }));
    const base = measure();
    const baseDarkCx = base?.darkCx ?? null;
    if (st.playing) st.togglePlay();
    const t0 = performance.now();
    st.setPlayhead(${target});
    const imm = measure();
    const immStale = baseDarkCx !== null && imm?.darkCx !== null && Math.abs(imm.darkCx - baseDarkCx) < 0.005;
    return await new Promise((resolve) => {
      let tElementMs = null, tCanvasMs = null, prevDark = null, stableCount = 0;
      let lastDarkCx = imm?.darkCx ?? null, lastEls = els(), lastPlayhead = st.playhead;
      const timer = setInterval(() => {
        const now = performance.now();
        const m = measure();
        const es = els();
        const ph = mod.useStore.getState().playhead;
        lastDarkCx = m?.darkCx ?? null; lastEls = es; lastPlayhead = ph;
        const phOk = Math.abs(ph - ${target}) < 1 / 30;
        const vids = es.filter((e) => e.tag === "VIDEO");
        let best = null, bestD = 1e9;
        for (const v of vids) { const d = Math.abs(v.t - ${localT}); if (d < bestD) { bestD = d; best = v; } }
        if (tElementMs === null && phOk && best && !best.seeking && bestD < 1 / 30 + 0.02) tElementMs = Math.round(now - t0);
        const exp = m ? canvasExpected(m, ${expProjX}, 0.5) : null;
        const canvasOk = !!m && m.darkN > 0 && exp !== null && Math.abs(m.darkCx - exp.cx) < 0.03;
        if (canvasOk) {
          if (prevDark !== null && Math.abs(m.darkCx - prevDark) < 0.005) stableCount++;
          else stableCount = 0;
          prevDark = m.darkCx;
          if (tCanvasMs === null && stableCount >= 1) tCanvasMs = Math.round(now - t0);
        } else { prevDark = null; stableCount = 0; }
        if (tCanvasMs !== null && phOk && tElementMs !== null) { clearInterval(timer); resolve(finish()); }
        else if (now - t0 > 30000) { clearInterval(timer); resolve(finish()); }
      }, 50);
      function finish() {
        return { localT: ${localT}, target: ${target}, expProjX: ${expProjX},
          baseDarkCx, immDarkCx: imm?.darkCx ?? null, immStale,
          tElementMs, tCanvasMs, confirmed: tCanvasMs !== null && tElementMs !== null,
          lastDarkCx, lastEls, playheadEnd: lastPlayhead };
      }
    });
  })()`;
  const seek5 = await evalJs(SEEK_SAMPLE_FN(clipStart + 5.0, 5.0, 0.35 + 0.05 * 5.0));
  log(`pause-seek tới t=5: confirmed=${seek5.confirmed} tElement=${seek5.tElementMs}ms tCanvas=${seek5.tCanvasMs}ms`);
  results.seekTo5 = seek5;
  if (!seek5.confirmed) throw new Error("pause-seek tới t=5 không xác nhận được sau 30s — không đo phát sau seek trên khung stale");

  if (LOAD_N > 0) {
    for (let i = 0; i < LOAD_N; i++) loadProcs.push(spawn("yes", [], { stdio: ["ignore", "ignore", "ignore"] }));
    await sleep(2000);
    log(`tải nền BẬT: ${LOAD_N}x yes | ${execFileSync("sh", ["-c", "uptime; free -m | head -2 | tail -1"], { encoding: "utf8" }).trim().replace(/\n/g, " | ")}`);
  }

  // ---- Đợt 92 T3: gắn rVFC riêng lên element bóng (nếu hỗ trợ) để đo
  // frame đang trình chiếu (mediaTime) so với currentTime — tách thành
  // phần decoder trình frame cũ khỏi rAF đói / hold-frame. Không đổi
  // hành vi app (chỉ thêm 1 callback đo). Element bóng = VIDEO có
  // currentTime ≈ 5 sau pause-seek vừa xác nhận.
  const RVFC_FN = `(async () => {
    const els = window.__vcutMediaEls || [];
    let target = null;
    for (const e of els) { if (e.tag === "VIDEO" && Math.abs(e.el.currentTime - 5) < 0.5) { target = e.el; break; } }
    if (!target) { const v = els.find((e) => e.tag === "VIDEO"); target = v ? v.el : null; }
    if (!target) return { attached: false, reason: "no-video-el" };
    const supported = typeof target.requestVideoFrameCallback === "function";
    const rec = { attached: true, supported, samples: [], t0: performance.now() };
    window.__r2rvfc = rec;
    if (supported) {
      const cb = (now, meta) => {
        if (rec.samples.length < 3000) {
          rec.samples.push({ wallMs: Math.round(performance.now() - rec.t0), mediaTime: +meta.mediaTime.toFixed(3), ct: +target.currentTime.toFixed(3), presented: meta.presentedFrames });
          target.requestVideoFrameCallback(cb);
        }
      };
      target.requestVideoFrameCallback(cb);
    }
    return { attached: true, supported };
  })()`;
  const rvfcAttached = await evalJs(RVFC_FN);
  log(`rVFC attach lên element bóng: ${JSON.stringify(rvfcAttached)}`);
  results.rvfcAttached = rvfcAttached;

  // ---- Đợt 95 W5: sampler vận tốc theo từng tick rAF (đo cho hướng (a)
  // dự đoán stall bằng vận tốc advance). Chạy trong trang, rẻ (chỉ đọc
  // currentTime + hook, không getImageData): mỗi rAF ghi 1 tick {t, ct,
  // ph, rearms, rTicks, rHolds, resyncsV} vào window.__w5ticks (tối đa
  // 5000 tick). Element bóng = VIDEO có ct ≈ 5 sau pause-seek vừa xong.
  // Không đổi hành vi app (chỉ thêm 1 callback đo, như rVFC ở trên).
  const VEL_FN = `(async () => {
    const els = window.__vcutMediaEls || [];
    let target = null;
    for (const e of els) { if (e.tag === "VIDEO" && Math.abs(e.el.currentTime - 5) < 0.5) { target = e.el; break; } }
    if (!target) { const v = els.find((e) => e.tag === "VIDEO"); target = v ? v.el : null; }
    if (!target) return { installed: false, reason: "no-video-el" };
    const mod = window.__r2storeMod || (window.__r2storeMod = await import("/src/store.ts"));
    const ticks = [];
    window.__w5ticks = ticks;
    const t0 = performance.now();
    window.__w5ticksT0 = t0;
    let n = 0;
    const loop = () => {
      n++;
      if (ticks.length < 5000) {
        const h = window.__vcutPlayheadHold90R2;
        ticks.push({ t: Math.round(performance.now() - t0), ct: +target.currentTime.toFixed(4),
          ph: +mod.useStore.getState().playhead.toFixed(4),
          rearms: h ? (h.resumeRearms94V2 ?? null) : null,
          rTicks: h ? (h.resumeTicks ?? null) : null,
          rHolds: h ? (h.resumeHolds ?? null) : null,
          resyncsV: window.__vcutSyncReseeksVideo ?? null,
          // Đợt 96 X4 — đếm riêng đường restartEnded (resyncsV gộp cả 3
          // đường forceSeek/drift/restart) để tách drift re-seek thật.
          restartV: window.__vcutSyncRestartEndedVideo ?? null,
          // Đợt 96 X4 — mốc trần 5000 ms của watch đang giữ element bóng
          // (completedAtMs của watch, theo đồng hồ performance.now() của
          // trang — so với t của tick này để biết trần đã qua chưa; null
          // = không có watch nào đang giữ element này).
          watchCeil: (() => {
            const ws = window.__vcutResumeWatch96X4 || [];
            const w = ws.find((x) => x.el === target);
            return w ? Math.round(w.completedAtMs - t0) : null;
          })() });
      }
      if (n < 20000) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return { installed: true, ticks0: ticks.length };
  })()`;
  const velInstalled = await evalJs(VEL_FN);
  log(`sampler vận tốc rAF W5: ${JSON.stringify(velInstalled)}`);
  results.velInstalled = velInstalled;

  // ---- Kịch bản chính: setPlayhead(0.5) + phát, sampler 100ms trong trang.
  const SAMPLER_FN = `(async () => {
    const mod = window.__r2storeMod || (window.__r2storeMod = await import("/src/store.ts"));
    const st = mod.useStore.getState();
    const measure = ${MEASURE_FN};
    const clipStart = ${clipStart};
    if (window.__r2sampler) { try { clearInterval(window.__r2sampler.timer); } catch {} }
    const samples = [];
    const t0 = performance.now();
    window.__r2samplerT0 = t0;
    const timer = setInterval(() => {
      const m = measure();
      const els = (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag, t: +e.el.currentTime.toFixed(3), paused: e.el.paused, seeking: e.el.seeking, rs: e.el.readyState }));
      const s = mod.useStore.getState();
      const hs = window.__vcutHoldStats ? { draw: window.__vcutHoldStats.draw, hold: window.__vcutHoldStats.hold, skip: window.__vcutHoldStats.skip, stale: !!window.__vcutHoldStats.stale } : null;
      const rfRing = window.__vcutRenderFrameTicks92T3 || null;
      const rfLast = rfRing && rfRing.length ? rfRing[rfRing.length - 1] : null;
      samples.push({ relMs: Math.round(performance.now() - t0), ph: +s.playhead.toFixed(3), localPh: +(s.playhead - clipStart).toFixed(3), playing: s.playing,
        darkN: m?.darkN ?? 0, darkCx: m?.darkCx ?? null, W: m?.W ?? null, H: m?.H ?? null,
        els, hold: window.__vcutPlayheadHold90R2 ? { ...window.__vcutPlayheadHold90R2 } : null,
        skipTicks: window.__vcutSeekSkipRenderTicks86N3 ?? null,
        resyncsV: window.__vcutSyncReseeksVideo ?? null, resyncsA: window.__vcutSyncReseeksAudio ?? null,
        restartV: window.__vcutSyncRestartEndedVideo ?? null,
        ticks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
        holdStats: hs,
        rfLen: rfRing ? rfRing.length : null,
        rfLast: rfLast ? { t: Math.round(rfLast.t), preMs: +rfLast.preMs.toFixed(1), renderMs: +rfLast.renderMs.toFixed(1), skipped: rfLast.skipped, held: rfLast.held } : null });
    }, 100);
    window.__r2sampler = { samples, timer, t0 };
    if (st.playing) st.togglePlay();
    st.setPlayhead(clipStart + 0.5);
    st.togglePlay();
    return { started: true, playheadAtStart: st.playhead };
  })()`;
  const started = await evalJs(SAMPLER_FN);
  log(`bắt đầu phát sau seek: ${JSON.stringify(started)}`);
  // Đợt 94 V2: chờ tới localPh >= 5.0 (đã phát ~4,5s sau seek) thay vì
  // 3.5 như U3 — cửa sổ dài hơn để bắt được stall THỨ 2 (stall 2 ở
  // lượt pre-fix xuất hiện sau stall 1 ~0,4–1,5s; clip 6s, playhead
  // bắt đầu 0,5 nên 5,0 vẫn trong clip). Timeout 40s giữ nguyên.
  // Chờ tới khi localPh >= 5.0 (đã phát ~4,5s sau seek) hoặc 40s.
  // Dừng sớm nếu playhead ĐÓNG BĂNG ≥2,5s trong lúc element còn seeking
  // (sau sửa: playhead bị giữ trong lúc re-seek drift — chờ đủ 40s chỉ
  // phí thời gian; baseline thì playhead chạy tiếp nên không chạm điều
  // kiện này).
  let stopped = false;
  let frozenPolls = 0, lastPolledPh = null;
  const tWait = Date.now();
  while (Date.now() - tWait < 40000) {
    await sleep(500);
    const last = await evalJs(`(() => {
      const s = window.__r2sampler;
      if (!s || !s.samples.length) return null;
      const l = s.samples[s.samples.length - 1];
      const seeking = (l.els || []).some((e) => e.tag === "VIDEO" && e.seeking);
      return { n: s.samples.length, localPh: l.localPh, playing: l.playing, seeking };
    })()`).catch(() => null);
    if (last && last.localPh >= 5.0) { stopped = true; break; }
    if (last && last.playing && last.seeking) {
      if (lastPolledPh !== null && Math.abs(last.localPh - lastPolledPh) < 0.001) {
        frozenPolls++;
        if (frozenPolls >= 5) { stopped = true; log("dừng sớm: playhead đóng băng ≥2,5s trong lúc seeking (đúng hành vi giữ sau sửa)"); break; }
      } else frozenPolls = 0;
      lastPolledPh = last.localPh;
    } else { frozenPolls = 0; lastPolledPh = last ? last.localPh : null; }
  }
  log(`chờ phát tới localPh>=5.0: ${stopped ? "đạt" : "HẾT 40s (chưa đạt)"}`);
  await evalJs(`(async () => {
    const mod = window.__r2storeMod || (window.__r2storeMod = await import("/src/store.ts"));
    const st = mod.useStore.getState();
    if (st.playing) st.togglePlay();
    if (window.__r2sampler) { try { clearInterval(window.__r2sampler.timer); } catch {} }
    return true;
  })()`).catch(() => null);
  const samples = await evalJs(`(() => window.__r2sampler ? window.__r2sampler.samples : [])()`).catch(() => []);
  results.samples = samples;
  // Đợt 92 T3: kéo ring rAF + ring tick render + mẫu rVFC về Node để tách thành phần.
  results.rafSamples = await evalJs(`(() => { const h = window.__vcutPreviewRaf; return h ? h.samples.map((x) => ({ t: Math.round(x.t), gapMs: +x.gapMs.toFixed(1), dtMs: +x.dtMs.toFixed(1), playing: x.playing, justWoke: x.justWoke, playhead: +x.playhead.toFixed(3) })) : null; })()`).catch(() => null);
  results.renderTicks = await evalJs(`(() => { const r = window.__vcutRenderFrameTicks92T3; return r ? r.map((x) => ({ t: Math.round(x.t), preMs: +x.preMs.toFixed(1), renderMs: +x.renderMs.toFixed(1), skipped: x.skipped, held: x.held })) : null; })()`).catch(() => null);
  results.rvfcSamples = await evalJs(`(() => window.__r2rvfc ? window.__r2rvfc.samples : null)()`).catch(() => null);
  // Đợt 95 W5: kéo tick vận tốc rAF về Node.
  results.velocityTicks = await evalJs(`(() => window.__w5ticks ? window.__w5ticks : null)()`).catch(() => null);
  results.velT0 = await evalJs(`(() => window.__w5ticksT0 ?? null)()`).catch(() => null);
  log(`kéo thêm: velocityTicks=${results.velocityTicks ? results.velocityTicks.length : "null"}`);
  results.samplerT0 = await evalJs(`(() => window.__r2samplerT0 ?? null)()`).catch(() => null);
  log(`kéo thêm: rafSamples=${results.rafSamples ? results.rafSamples.length : "null"} renderTicks=${results.renderTicks ? results.renderTicks.length : "null"} rvfcSamples=${results.rvfcSamples ? results.rvfcSamples.length : "null"}`);
  results.stopped = stopped;
  results.pageErrs = pageErrs;

  // ---- Phân tích ở Node.
  const ballTime = (s) => {
    if (s.darkN <= 0 || s.darkCx === null || !s.W || !s.H) return null;
    const sc = Math.min(s.W / 1280, s.H / 720);
    const dw = 1280 * sc;
    const dx = (s.W - dw) / 2;
    const projX = (s.darkCx * s.W - dx) / dw;
    return (projX - 0.35) / 0.05;
  };
  // Element bóng = element VIDEO có biên độ currentTime lớn nhất trong cửa sổ.
  const vidIdx = new Map();
  samples.forEach((s, i) => {
    (s.els || []).filter((e) => e.tag === "VIDEO").forEach((e, j) => {
      const k = `${j}`;
      if (!vidIdx.has(k)) vidIdx.set(k, { min: 1e9, max: -1e9, everSeeking: false });
      const rec = vidIdx.get(k);
      rec.min = Math.min(rec.min, e.t); rec.max = Math.max(rec.max, e.t);
      if (e.seeking) rec.everSeeking = true;
    });
  });
  let ballElKey = null, ballRange = -1;
  for (const [k, rec] of vidIdx) {
    const range = rec.max - rec.min;
    if (range > ballRange) { ballRange = range; ballElKey = k; }
  }
  const elOf = (s) => {
    const vids = (s.els || []).filter((e) => e.tag === "VIDEO");
    return ballElKey !== null ? vids[Number(ballElKey)] ?? null : null;
  };
  // seekDone = mẫu đầu tiên element bóng hết seeking VÀ currentTime đã về vùng 0.5
  // (sau khi đã từng seeking ít nhất 1 lần); nếu seek quá nhanh không bắt
  // được seeking=true thì lấy mẫu đầu tiên currentTime >= 0.45.
  let seekDoneIdx = -1, sawSeeking = false;
  for (let i = 0; i < samples.length; i++) {
    const el = elOf(samples[i]);
    if (!el) continue;
    if (el.seeking) sawSeeking = true;
    if (sawSeeking && !el.seeking && el.t >= 0.4 && el.t < 1.5) { seekDoneIdx = i; break; }
    if (!sawSeeking && el.t >= 0.45 && el.t < 1.5) { seekDoneIdx = i; break; }
  }
  const lag = (s) => {
    const bt = ballTime(s);
    if (bt === null) return null;
    return s.localPh - bt;
  };
  let playheadMaxDuringSeek = null, lagAfterMax = null, lagAfterSamples = 0;
  let canvasChangeIdx = -1, steadyLagMean = null;
  let holdTicksTotal = null;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (seekDoneIdx >= 0 && i <= seekDoneIdx) {
      playheadMaxDuringSeek = playheadMaxDuringSeek === null ? s.localPh : Math.max(playheadMaxDuringSeek, s.localPh);
    }
    if (seekDoneIdx >= 0 && i >= seekDoneIdx && s.relMs - samples[seekDoneIdx].relMs <= 2000) {
      const l = lag(s);
      if (l !== null) {
        lagAfterSamples++;
        lagAfterMax = lagAfterMax === null ? Math.abs(l) : Math.max(lagAfterMax, Math.abs(l));
      }
    }
    // Canvas rời khung cũ (t=5) lần đầu: bóng không còn ở 5.0.
    if (canvasChangeIdx < 0) {
      const bt = ballTime(s);
      if (bt !== null && Math.abs(bt - 5.0) > 0.5) canvasChangeIdx = i;
    }
    if (s.hold) holdTicksTotal = s.hold.ticks;
  }
  // Lag ổn định (trung bình |lag| 1s cuối) — chỉ để tham chiếu: đồng hồ media
  // chạy chậm hơn wall-clock dưới tải (hiện tượng L6) nên canvas luôn tụt
  // ~0,1–0,25s sau playhead khi phát bình thường; KHÔNG phải chỉ tiêu của
  // đợt này (ngưỡng re-seek 0,35s mới là biên của nó).
  const tail = samples.slice(-10).map(lag).filter((v) => v !== null);
  if (tail.length) steadyLagMean = +(tail.reduce((a, b) => a + Math.abs(b), 0) / tail.length).toFixed(4);
  const analysis = {
    nSamples: samples.length,
    ballElKey, ballRange: +ballRange.toFixed(3),
    sawSeeking, seekDoneIdx,
    seekDoneRelMs: seekDoneIdx >= 0 ? samples[seekDoneIdx].relMs : null,
    playheadAtSeekDone: seekDoneIdx >= 0 ? samples[seekDoneIdx].localPh : null,
    playheadMaxDuringSeek,
    // Lệch lớn nhất trong 2s sau seek (bao gồm cả khung stale chưa kịp đổi
    // + lag ổn định khi phát — chỉ tham chiếu, KHÔNG làm chỉ tiêu).
    lagAfterMax: lagAfterMax !== null ? +lagAfterMax.toFixed(4) : null,
    lagAfterSamples,
    // Chỉ tiêu chính sau sửa: playhead lúc canvas LẦN ĐẦU hiện khung mới
    // (rời t=5). Trước sửa: playhead có thể đã chạy tới 3,7 (WebKit tải);
    // sau sửa: playhead bị đóng băng ở ~0,5 cho tới khi seek xong.
    canvasChangeIdx,
    canvasChangeRelMs: canvasChangeIdx >= 0 ? samples[canvasChangeIdx].relMs : null,
    playheadAtCanvasChange: canvasChangeIdx >= 0 ? samples[canvasChangeIdx].localPh : null,
    ballAtCanvasChange: canvasChangeIdx >= 0 ? +(ballTime(samples[canvasChangeIdx]) ?? -1).toFixed(3) : null,
    steadyLagMean,
    holdTicksTotal,
    firstSample: samples[0] ? { relMs: samples[0].relMs, localPh: samples[0].localPh, darkCx: samples[0].darkCx } : null,
    lastSample: samples.length ? { relMs: samples[samples.length - 1].relMs, localPh: samples[samples.length - 1].localPh, darkCx: samples[samples.length - 1].darkCx } : null,
  };
  results.analysis = analysis;
  const FRAME = 1 / 30;
  // Ngưỡng so trong cùng miền 3 chữ số thập phân với số đo (playhead lưu
  // toFixed(3)): 0,5 + 2 frame = 0,56667 → làm tròn 0,567; so trực tiếp
  // với 0,56667 thì 0,567 "vượt" 0,0003 do làm tròn đo — artifact, không
  // phải vượt thật (playhead snap theo lưới frame, 0,567 ĐÚNG là +2 frame).
  const holdThreshold = +(0.5 + 2 * FRAME).toFixed(3);
  const passHold = playheadMaxDuringSeek !== null && playheadMaxDuringSeek <= holdThreshold;
  const passCanvasChange = analysis.playheadAtCanvasChange !== null && analysis.playheadAtCanvasChange <= 0.5 + 0.15;
  log(`PHÂN TÍCH ${ENGINE} load=${LOAD} phase=${PHASE}: n=${analysis.nSamples} ballEl=${ballElKey} range=${analysis.ballRange} sawSeeking=${sawSeeking} seekDoneIdx=${seekDoneIdx} seekDoneRelMs=${analysis.seekDoneRelMs}ms playheadAtSeekDone=${analysis.playheadAtSeekDone} playheadMaxDuringSeek=${analysis.playheadMaxDuringSeek} (ngưỡng ${+(0.5 + 2 * FRAME).toFixed(3)}) canvasChangeRelMs=${analysis.canvasChangeRelMs}ms playheadAtCanvasChange=${analysis.playheadAtCanvasChange} (ngưỡng 0,65) ballAtCanvasChange=${analysis.ballAtCanvasChange} lagAfterMax=${analysis.lagAfterMax}s (tham chiếu) steadyLagMean=${analysis.steadyLagMean}s holdTicks=${analysis.holdTicksTotal} pageErrs=${JSON.stringify(pageErrs)}`);
  log(`VERDICT: playhead-giữ-trong-seek ${passHold ? "PASS" : "FAIL"}; playhead-lúc-canvas-đổi-khung ${passCanvasChange ? "PASS" : "FAIL"}`);
  if (LOAD_N > 0) {
    for (const p of loadProcs) { try { p.kill("SIGKILL"); } catch {} }
    loadProcs = [];
    log("tải nền TẮT");
  }
  results.loadavgEnd = execFileSync("sh", ["-c", "uptime"], { encoding: "utf8" }).trim();
  results.previewMtimeAfter = previewMtime();
  log(`preview.tsx mtime lúc kết thúc: ${results.previewMtimeAfter} (đổi giữa lượt: ${results.previewMtimeAfter !== results.previewMtimeBefore ? "CÓ — LOẠI LƯỢT NÀY" : "không"})`);
  writeFileEpermRetry(path.join(SCRATCH, "probe-results.json"), JSON.stringify(results, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "probe-log.txt"), logLines.join("\n") + "\n");
  log(`kết quả chi tiết: ${path.join(SCRATCH, "probe-results.json")}`);
}

main().catch(async (e) => {
  console.error("PROBE LỖI: " + (e && e.stack || e));
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-error.txt"), String(e && e.stack || e)); } catch {}
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-log.txt"), logLines.join("\n") + "\n"); } catch {}
  await cleanup();
  process.exit(2);
}).then(async () => { await cleanup(); process.exit(0); });
