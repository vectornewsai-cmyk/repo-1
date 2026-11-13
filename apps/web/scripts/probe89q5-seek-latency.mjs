#!/usr/bin/env node
/**
 * probe89q5-seek-latency.mjs — Phase 9 đợt 89, luồng Q5.
 * Đo latency seek thật của preview (pause-seek qua store.setPlayhead) trên
 * Chromium và WebKit, có và không có tải nền CPU, để xem lại timeout
 * fallback 1200ms của `Seeker` (seek.ts: DEFAULT_SEEK_TIMEOUT_MS).
 *
 * Cách đo (không sleep cố định, đo bằng tín hiệu thật):
 *  - Dùng clip bóng o8-ball-720p-6s.mp4: ô đen trong video di chuyển theo
 *    thời gian nguồn (tâm ô x = 0.35+0.05*localT, project 1280x720), nên
 *    centroid tối trên canvas = đồng hồ độc lập của frame đang hiển thị.
 *  - Mỗi trial: ghi baseline (darkCx trước seek), gọi setPlayhead(t),
 *    đo NGAY (mẫu immediate — đối chứng stale), rồi poll 100ms cho tới khi
 *    XÁC NHẬN: (1) element video __vcutMediaEls: currentTime ≈ target
 *    (±1 frame) VÀ seeking === false; (2) canvas darkCx ≈ kỳ vọng
 *    (±0.03 canvas); (3) 2 lần poll liên tiếp đồng ý (stable).
 *    Đợt 94 V7 — tiêu chí (2) BẮT BUỘC THÊM: canvas phải ĐÃ ĐỔI khỏi
 *    baseline trước seek (darkCx lệch ≥ 0.01) rồi mới khớp đích — nếu
 *    canvas vốn đã trùng đích từ trial trước (khung cũ) thì trial KHÔNG
 *    confirmed, verdict "already-at-target" (không tính vào median, không
 *    tính là stale). Sửa artifact đợt 93 U7: trial 6 WebKit GOP30 tCanvas
 *    712 ms < tElement 2291 ms vì canvas kẹt khung t=1 từ trial 5.
 *    Đợt 95 W8 — ngưỡng đổi không còn hardcode 0.01: hiệu chuẩn từ chính
 *    clip đầu lượt (CALIBRATE_FN: đo nhiễu ổn định + bước khung nhỏ nhất
 *    t=0..5 → ngưỡng = max(bước/4, 2×nhiễu)); display Xvfb claim bằng
 *    lock nguyên tử (xvfb-display.mjs) thay cho picker check-socket cũ.
 *  - Ghi t_element (ms tới tín hiệu 1), t_canvas (ms tới tín hiệu 2+3).
 *    Quá 30s không xác nhận được → trial STALE/TIMEOUT (ghi rõ).
 *
 * Chạy: node apps/web/scripts/probe89q5-seek-latency.mjs --engine chromium|webkit [--load] [--trials N] [--clip <path>] [--tag <suffix>] [--scratch <dir>]
 *   --load: bật 3 tiến trình `yes` (75% CPU trên VM 4 vCPU) trong lúc đo.
 *   --clip: clip bóng khác cùng hình học (mặc định o8-ball GOP 250).
 *     Đợt 93 U7: dùng để đo GOP 30/60 (clip ở hidden_files/round92-t3/clips/).
 *   --tag: hậu tố thư mục scratch (vd `gop30`) để nhiều lần chạy không ghi
 *     đè probe-results.json của nhau (đợt 93 U7).
 *   --scratch: thư mục con trong hidden_files chứa kết quả (mặc định
 *     round93-u7 khi có --tag, round89-q5 khi không). Đợt 94 V7 dùng
 *     --scratch round94-v7 để không ghi đè số đợt 93.
 *   --effect <type>[:intensity] (đợt 96 X8): gắn effect canvas vào clip
 *     bóng trước hiệu chuẩn (vd noise:1) để kiểm tra nhánh
 *     thresholdNoiseLimited — chỉ đổi project trong trang probe.
 * Scratch: hidden_files/round93-u7/probe-<engine>[-load][-tag]/ khi có --tag,
 *   ngược lại giữ hidden_files/round89-q5/probe-<engine>[-load]/ như cũ.
 *   CFG_DIR theo PID (đợt 93 U7): tránh 2 probe chạy song song ghi đè cùng
 *   vite config / wave-probe trong /tmp/round89-q5.
 * KHÔNG push/tag/binary.
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
// Đợt 95 W8 — lock display Xvfb (nợ V7 §6/§9 mục 1, xem xvfb-display.mjs).
import { claimXvfbDisplay, releaseXvfbDisplay } from "./xvfb-display.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { chromium, webkit } from "/home/hatch/scratch-round63-r4/node_modules/playwright-core/index.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const HEAD = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round87-o8", "headed");

const argv = process.argv.slice(2);
const ENGINE = argv.includes("--engine") ? argv[argv.indexOf("--engine") + 1] : "chromium";
const LOAD = argv.includes("--load");
const TRIALS = argv.includes("--trials") ? Number(argv[argv.indexOf("--trials") + 1]) : 6;
// Đợt 93 U7 — --clip/--tag để đo GOP 30/60 mà không ghi đè kết quả GOP 250.
const CLIP_ARG = argv.includes("--clip") ? argv[argv.indexOf("--clip") + 1] : null;
const TAG = argv.includes("--tag") ? argv[argv.indexOf("--tag") + 1] : null;
// Đợt 94 V7 — --scratch: thư mục kết quả riêng cho đợt, tránh ghi đè số đợt 93.
const SCRATCH_ARG = argv.includes("--scratch") ? argv[argv.indexOf("--scratch") + 1] : null;
// Đợt 96 X8 — --effect <type>[:intensity] (vd noise:1, shake:0.5): gắn effect
// canvas vào clip bóng TRƯỚC khi hiệu chuẩn, để kiểm tra nhánh
// thresholdNoiseLimited (hiệu chuẩn đo nhiễu darkCx lúc pause). Effect áp
// qua store (clip.effects) — chỉ thay đổi project trong trang probe, không
// sửa file production hay clip gốc.
const EFFECT_ARG = argv.includes("--effect") ? argv[argv.indexOf("--effect") + 1] : null;
const EFFECT = (() => {
  if (!EFFECT_ARG) return null;
  const [type, rawI] = EFFECT_ARG.split(":");
  const intensity = rawI === undefined || rawI === "" ? 1 : Number(rawI);
  return { type, intensity: Number.isFinite(intensity) ? intensity : 1 };
})();
const CLIP_B = CLIP_ARG ? path.resolve(CLIP_ARG) : path.join(HEAD, "o8-ball-720p-6s.mp4");
const CLIP_B_NAME = path.basename(CLIP_B);
const SCRATCH_BASE = SCRATCH_ARG
  ? path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", SCRATCH_ARG)
  : TAG
  ? path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round93-u7")
  : path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round89-q5");
const SCRATCH = path.join(SCRATCH_BASE, `probe-${ENGINE}${LOAD ? "-load" : ""}${TAG ? `-${TAG}` : ""}`);
// Đợt 93 U7 — CFG_DIR theo PID: 2 probe chạy song song không ghi đè cùng
// vite config / wave-probe (trước đây cùng /tmp/round89-q5).
const CFG_DIR = `/tmp/round89-q5-${process.pid}`;
const BRIDGE_WORK_DIR = `/tmp/round89-q5-${process.pid}/bridge-work`;
const VITE_CFG = path.join(CFG_DIR, "vite.q5.config.mjs");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = { engine: ENGINE, load: LOAD, trials: [], clip: CLIP_B, clipName: CLIP_B_NAME, tag: TAG || null, effect: EFFECT };

// Keyframe thật của clip (ffprobe, best-effort) — ghi vào kết quả để đối
// chiếu GOP mà không phải tin tên file (đợt 93 U7).
try {
  const kf = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "frame=key_frame,pts_time", "-of", "csv=p=0", CLIP_B], { encoding: "utf8" })
    .split("\n").map((l) => l.split(",")).filter((p) => p[0] === "1").map((p) => Number(p[1]));
  results.keyframes = kf;
  results.gopApprox = kf.length > 1 ? Math.round((kf[1] - kf[0]) * 30) : 250;
} catch { results.keyframes = null; results.gopApprox = null; }

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
  const mod = window.__q5storeMod || (window.__q5storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    playhead: st.playhead,
    playing: st.playing,
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => ({ id: c.id, kind: c.kind, src: c.src, start: c.start, duration: c.duration }))),
  };
})()`;

// Đo canvas: centroid vùng tối (ô đen của clip bóng) + centroid vùng sáng.
const MEASURE_FN = `(() => {
  const c = document.querySelector(".preview-canvas");
  if (!c) return null;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const img = ctx.getImageData(0, 0, W, H).data;
  // Pass 1: bbox vùng sáng = vùng video (nền trắng). Canvas ngoài vùng
  // video là nền đen (letterbox) nên đếm tối toàn canvas sẽ lẫn nền —
  // phải giới hạn pass 2 trong bbox này (chẩn đoán đợt 89 Q5).
  let bn = 0, bx = 0, by = 0;
  let bx0 = W, bx1 = 0, by0 = H, by1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const i = (y * W + x) * 4;
    if (img[i+3] > 128 && img[i] > 180 && img[i+1] > 180 && img[i+2] > 180) { bn++; bx += x; by += y; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
  }
  // Pass 2: centroid tối (ô đen) CHỈ trong vùng video.
  let dn = 0, dx = 0, dy = 0;
  let dx0 = W, dx1 = 0, dy0 = H, dy1 = 0;
  if (bn > 0) {
    for (let y = by0; y <= by1; y += 2) for (let x = bx0; x <= bx1; x += 2) {
      const i = (y * W + x) * 4;
      if (img[i+3] > 128 && img[i] < 60 && img[i+1] < 60 && img[i+2] < 60) { dn++; dx += x; dy += y; if (x < dx0) dx0 = x; if (x > dx1) dx1 = x; if (y < dy0) dy0 = y; if (y > dy1) dy1 = y; }
    }
  }
  return { W, H,
    darkN: dn, darkCx: dn ? +(dx / dn / W).toFixed(4) : null, darkCy: dn ? +(dy / dn / H).toFixed(4) : null,
    darkBbox: dn ? [+((dx0 / W).toFixed(3)), +((dy0 / H).toFixed(3)), +((dx1 / W).toFixed(3)), +((dy1 / H).toFixed(3))] : null,
    brightN: bn, brightCx: bn ? +(bx / bn / W).toFixed(4) : null, brightCy: bn ? +(by / bn / H).toFixed(4) : null,
    brightBbox: bn ? [+((bx0 / W).toFixed(3)), +((by0 / H).toFixed(3)), +((bx1 / W).toFixed(3)), +((by1 / H).toFixed(3))] : null };
})()`;

// Trạng thái element media thật qua hook __vcutMediaEls (preview.tsx).
const ELS_FN = `((window.__vcutMediaEls || []).map((e) => ({
  tag: e.tag,
  t: +e.el.currentTime.toFixed(3),
  paused: e.el.paused,
  seeking: e.el.seeking,
  readyState: e.el.readyState,
  srcTail: (e.el.currentSrc || e.el.src || "").slice(-60),
  srcKey: (e.el.dataset?.srcKey || "").slice(-60),
})))`;

function canvasExpected(m, pw, ph, fx, fy) {
  const s = Math.min(m.W / pw, m.H / ph);
  const dw = pw * s, dh = ph * s;
  return { cx: +(((m.W - dw) / 2 + fx * dw) / m.W).toFixed(4), cy: +(((m.H - dh) / 2 + fy * dh) / m.H).toFixed(4) };
}

let vite = null, bridge = null, xvfb = null, browser = null, loadProcs = [];
// Đợt 95 W8 — claim display Xvfb giữ suốt lượt, nhả ở cleanup().
let xvfbClaim = null;

async function startBridge(port) {
  const logFd = fs.openSync(path.join(SCRATCH, "q5-bridge.log"), "a");
  const b = spawn("node", [path.join(ROOT, "server", "bridge", "src", "index.js")], {
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR,
      BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-q5-${process.pid}.json`) },
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
  try { if (vite) vite.kill("SIGKILL"); } catch {}
  try { if (bridge) bridge.kill("SIGKILL"); } catch {}
  // Đợt 95 W8 — nhả lock display (sau khi Xvfb đã tắt).
  try { releaseXvfbDisplay(xvfbClaim); } catch {}
  xvfbClaim = null;
}

async function main() {
  if (!fs.existsSync(CLIP_B)) throw new Error("thiếu fixture clip bóng " + CLIP_B);
  if (!VITE_BIN) throw new Error("không thấy vite");
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.mkdirSync(CFG_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
  const bridgePort = await pickFreePort(8871, 8879);
  const DEV_PORT = await pickFreePort(5570, 5579);
  if (!bridgePort || !DEV_PORT) throw new Error("hết cổng trống");
  // Đợt 95 W8 — claim display bằng lock nguyên tử (xvfb-display.mjs).
  // Picker cũ chỉ KIỂM TRA socket rồi chọn → luồng song song chiếm display
  // giữa check và spawn (V7: Chromium GOP250 lần 1 fail Xvfb :194).
  // Lock giữ suốt lượt, nhả ở cleanup(). Spawn Xvfb vẫn NGAY trước
  // launch (đợt 89 Q5: spawn sớm chết trong lúc chờ vite ~4 phút).
  xvfbClaim = claimXvfbDisplay();
  if (!xvfbClaim) throw new Error("hết display Xvfb trống :193–:197 (đã có chủ)");
  const DISPLAY = xvfbClaim.display;
  log(`Xvfb display ${DISPLAY} đã claim (lock ${xvfbClaim.lockDir})`);
  // Spawn Xvfb ngay trước launch + verify socket tồn tại (sóng EPERM có
  // thể làm Xvfb chết sớm vì không tạo được socket — exit 1).
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
  log(`probe ${ENGINE} load=${LOAD} trials=${TRIALS} vite :${DEV_PORT} bridge :${bridgePort} DISPLAY=${DISPLAY}`);
  log(`môi trường lúc bắt đầu: ${execFileSync("sh", ["-c", "free -m | head -2 | tail -1; uptime"], { encoding: "utf8" }).trim().replace(/\n/g, " | ")}`);

  bridge = await startBridge(bridgePort);
  // Đợt 89 Q5 — sóng EPERM bật/tắt theo chu kỳ vài phút; vite chết ngay
  // ở loadConfigFromBundledFile nếu khởi động lúc sóng bật (đã fail 8/8
  // lần × 2 lượt liên tiếp). Chờ sóng tắt bằng ghi thử rẻ (mỗi 10s, tối
  // đa 10 phút) rồi mới khởi động vite — tránh đánh cược 8 lần liên tiếp.
  const waveProbeFile = path.join(CFG_DIR, "wave-probe.tmp");
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
  // Đợt 89 Q5 — unlink chỉ là dọn dẹp best-effort, KHÔNG nằm trong test
  // sóng: đã chứng minh một tiến trình spawn lúc sóng bật có thể unlink
  // fail mãi dù write đã thành công (probe 12:36–12:45: write OK mỗi 10s
  // nhưng unlink fail suốt, trong khi tiến trình song song unlink 6/6 OK).
  try { fs.unlinkSync(waveProbeFile); } catch {}
  if (waveOff) log("sóng EPERM đã tắt, khởi động vite");
  else log("CẢNH BÁO: chờ sóng EPERM 10 phút không tắt — thử khởi động vite dù sao");
  const viteLogFd = fs.openSync(path.join(SCRATCH, "q5-vite.log"), "w");
  // Đợt 89 Q5 — vite có thể chết sớm vì EPERM khi ghi file bundle config
  // tạm (sóng EPERM: vite.q5.config.mjs.timestamp-*.mjs 0 byte, xem
  // probe-log); thử lại tối đa 4 lần thay vì chờ 120s vào tiến trình đã chết.
  let up = false;
  let lastViteErr = "";
  for (let attempt = 1; attempt <= 8 && !up; attempt++) {
    const attemptLog = path.join(SCRATCH, `q5-vite-attempt${attempt}.log`);
    const fd = fs.openSync(attemptLog, "w");
    // Đợt 89 Q5 — --configLoader native: vite import trực tiếp config, KHÔNG
    // bundle qua loadConfigFromBundledFile (ghi file timestamp-*.mjs cạnh
    // config — chết EPERM khi sóng bật; đã chứng minh: native-loader không
    // tạo file tạm nào và lên được ngay cả lúc sóng bật). Fetch có timeout
    // 3s: vite kẹt (sống nhưng không serve) không treo vòng poll vô hạn.
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
      // Sóng EPERM bật/tắt theo chu kỳ ~1–2 phút: chờ 15s giữa các lần
      // thử để lần thử sau rơi vào lúc sóng tắt (thử dồn 3s/lần đã fail
      // 12/12 khi sóng đang bật).
      if (attempt < 8) await sleep(15000);
    } else {
      fs.closeSync(fd);
    }
  }
  try { fs.closeSync(viteLogFd); } catch {}
  if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 8 lần thử (lỗi cuối: ${lastViteErr.slice(0, 300)})`);
  log("vite dev đã lên");
  // Xvfb spawn NGAY trước launch (đợt 89 Q5) — spawn sớm chết trong lúc
  // chờ vite (lần chạy 12:50: Xvfb chết trước launch 12:55).
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

  // Tắt auto-proxy để tránh job proxy nhiễu đo.
  await evalJs(`(() => {
    const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
    const cb = label?.querySelector('input[type="checkbox"]');
    if (cb && cb.checked) cb.click();
    return true;
  })()`).catch(() => null);
  await sleep(500);

  // Import clip bóng + thêm lên timeline + cô lập + chọn.
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
  // Thử click "Thêm" nhiều lần, đọc lại rect mỗi lần (dưới tải cao UI
  // chậm/scroll làm rect cũ trượt), rồi fallback JS .click() như O8.
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
  await evalJs(`(async () => {
    const mod = await import("/src/store.ts");
    const st = mod.useStore.getState();
    const clip = st.spec.tracks.flatMap((t) => t.clips.map((c) => ({ trackId: t.id, clipId: c.id }))).find((x) => x.clipId === ${JSON.stringify(clipB.id)});
    if (clip) mod.useStore.setState({ selection: [clip] });
    return true;
  })()`).catch(() => null);
  await sleep(800);

  // Đợt 96 X8 — gắn effect canvas (--effect) vào clip bóng trước hiệu
  // chuẩn (xem EFFECT ở đầu file). Ghi rõ vào log + results để đối chiếu
  // darkCx có/không effect (kiểm tra effect có thực sự đổi pixel không).
  if (EFFECT) {
    const applied = await evalJs(`(async () => {
      const mod = await import("/src/store.ts");
      mod.useStore.setState((s) => ({ spec: { ...s.spec, tracks: s.spec.tracks.map((t) => ({ ...t, clips: t.clips.map((c) => (c.id === ${JSON.stringify(clipB.id)} ? { ...c, effects: [{ type: ${JSON.stringify(EFFECT.type)}, intensity: ${EFFECT.intensity} }] } : c)) })) } }));
      const st = mod.useStore.getState();
      const clip = st.spec.tracks.flatMap((t) => t.clips).find((c) => c.id === ${JSON.stringify(clipB.id)});
      return clip?.effects ?? null;
    })()`).catch(() => null);
    log(`effect ${EFFECT.type}:${EFFECT.intensity} gắn vào clip bóng: ${JSON.stringify(applied)}`);
    if (!applied) throw new Error("không gắn được effect vào clip bóng");
  }

  // Trạng thái element lúc đầu (trước mọi lần phát): __vcutMediaEls có sẵn không?
  const els0 = await evalJs(ELS_FN).catch(() => null);
  log(`__vcutMediaEls lúc đầu (chưa phát lần nào): ${JSON.stringify(els0)}`);
  results.elsAtStart = els0;

  // Đảm bảo pause, đo baseline ở localT=1.0 bằng phép đo có xác nhận.
  await evalJs(`(async () => {
    const mod = await import("/src/store.ts");
    const st = mod.useStore.getState();
    if (st.playing) st.togglePlay();
    return true;
  })()`).catch(() => null);
  await sleep(500);

  // Đợt 95 W8 — HIỆU CHUẨN ngưỡng canvasOk từ chính clip (nợ V7 §5/§9
  // mục 2): ngưỡng đổi 0.01 của V7 hiệu chuẩn THỦ CÔNG trên clip bóng này
  // (nhiễu <0.005; bước khung nhỏ nhất t=0→t=1: ΔdarkCx=0.048). Nay probe
  // tự đo trước mỗi lượt: seek lần lượt t=0..5 (pause-seek có xác nhận),
  // mỗi t lấy 3 mẫu darkCx khi canvas đã ổn định → nhiễu = lệch lớn nhất
  // khỏi trung vị; bước khung nhỏ nhất = min |ΔdarkCx| giữa 2 t liên tiếp.
  // Ngưỡng đổi = max(bước/4, 2×nhiễu), kẹp ≤0.02; ngưỡng ổn định =
  // max(0.005, min(nhiễu×1.5, 0.01)). Hỏng thì fallback ngưỡng cũ
  // 0.01/0.005 (ghi rõ trong JSON + log, không fail cả lượt).
  // --no-calibrate: bỏ qua bước này, dùng ngưỡng cũ.
  let CAL = { changeThreshold: 0.01, stableEps: 0.005 };
  const CALIBRATE_FN = `(async () => {
    const mod = window.__q5storeMod || (window.__q5storeMod = await import("/src/store.ts"));
    const st = mod.useStore.getState();
    const measure = () => {
      const c = document.querySelector(".preview-canvas");
      if (!c) return null;
      const ctx = c.getContext("2d");
      const W = c.width, H = c.height;
      const img = ctx.getImageData(0, 0, W, H).data;
      let bn = 0, bx = 0, by = 0, bx0 = W, bx1 = 0, by0 = H, by1 = 0;
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
      return { darkN: dn, darkCx: dn ? +(dx / dn / W).toFixed(4) : null, brightN: bn };
    };
    const els = () => (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag, t: +e.el.currentTime.toFixed(3), seeking: e.el.seeking, readyState: e.el.readyState }));
    if (st.playing) st.togglePlay();
    const frames = [];
    let noise = 0;
    for (let t = 0; t <= 5; t++) {
      const target = ${clipB.start} + t;
      st.setPlayhead(target);
      // Chờ element tới đích (tối đa 10s) rồi chờ canvas ổn định
      // (2 mẫu liên tiếp đồng ý trong 0.005, tối đa 5s).
      let elOk = false;
      const t0 = performance.now();
      while (performance.now() - t0 < 10000) {
        await new Promise((r) => setTimeout(r, 100));
        const es = els();
        const vids = es.filter((e) => e.tag === "VIDEO");
        let best = null, bestD = 1e9;
        for (const v of vids) { const d = Math.abs(v.t - t); if (d < bestD) { bestD = d; best = v; } }
        const ph = mod.useStore.getState().playhead;
        if (best && !best.seeking && bestD < 1 / 30 + 0.02 && Math.abs(ph - target) < 1 / 30) { elOk = true; break; }
      }
      let prev = null, stable = false;
      const t1 = performance.now();
      while (performance.now() - t1 < 5000) {
        const m = measure();
        if (m && m.darkCx !== null && prev !== null && Math.abs(m.darkCx - prev) < 0.005) { stable = true; break; }
        prev = m?.darkCx ?? null;
        await new Promise((r) => setTimeout(r, 150));
      }
      const samples = [];
      for (let s = 0; s < 3; s++) {
        const m = measure();
        if (m && m.darkCx !== null) samples.push(m.darkCx);
        await new Promise((r) => setTimeout(r, 150));
      }
      let dark = null;
      if (samples.length) {
        const sorted = samples.slice().sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)];
        const dev = Math.max(...samples.map((v) => Math.abs(v - med)));
        if (dev > noise) noise = +dev.toFixed(4);
        dark = med;
      }
      frames.push({ t, darkCx: dark, elementOk: elOk, canvasStable: stable, samples: samples.length });
    }
    let minStep = null;
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1].darkCx, b = frames[i].darkCx;
      if (a !== null && b !== null) { const d = +(Math.abs(b - a).toFixed(4)); if (minStep === null || d < minStep) minStep = d; }
    }
    if (minStep === null) return { ok: false, reason: "không đo được darkCx ở 2 khung liên tiếp", frames, noise };
    const rawThreshold = +(minStep / 4).toFixed(4);
    let changeThreshold = Math.max(rawThreshold, 2 * noise);
    const thresholdNoiseLimited = rawThreshold < 2 * noise;
    if (changeThreshold > 0.02) changeThreshold = 0.02;
    const stableEps = Math.max(0.005, Math.min(noise * 1.5, 0.01));
    return { ok: true, frames, minStep, noise, rawThreshold, changeThreshold: +changeThreshold.toFixed(4), stableEps: +stableEps.toFixed(4), thresholdNoiseLimited };
  })()`;
  if (argv.includes("--no-calibrate")) {
    results.calibration = { ok: false, reason: "--no-calibrate: dùng ngưỡng cũ 0.01/0.005", changeThreshold: 0.01, stableEps: 0.005 };
    log("hiệu chuẩn canvasOk: BỎ QUA (--no-calibrate) → ngưỡng cũ 0.01/0.005");
  } else {
    try {
      const cal = await evalJs(CALIBRATE_FN);
      if (cal && cal.ok) {
        CAL = { changeThreshold: cal.changeThreshold, stableEps: cal.stableEps };
        results.calibration = cal;
        log(`hiệu chuẩn canvasOk: minStep=${cal.minStep} noise=${cal.noise} → changeThreshold=${cal.changeThreshold} stableEps=${cal.stableEps}${cal.thresholdNoiseLimited ? " (ngưỡng bị nhiễu chi phối)" : ""} | frames=${JSON.stringify(cal.frames.map((f) => `${f.t}:${f.darkCx}`))}`);
      } else {
        results.calibration = { ok: false, reason: cal?.reason || "calibration trả về null", frames: cal?.frames || null, noise: cal?.noise ?? null, fallback: { changeThreshold: 0.01, stableEps: 0.005 } };
        log(`hiệu chuẩn canvasOk THẤT BẠI (${cal?.reason || "null"}) → fallback ngưỡng cũ 0.01/0.005`);
      }
    } catch (e) {
      results.calibration = { ok: false, reason: String(e?.message || e), fallback: { changeThreshold: 0.01, stableEps: 0.005 } };
      log(`hiệu chuẩn canvasOk LỖI (${e?.message}) → fallback ngưỡng cũ 0.01/0.005`);
    }
  }

  // Một lần seek có xác nhận — ĐO TRONG TRANG (1 evaluate duy nhất):
  // sampler 50ms trong trang đọc element + playhead + canvas nên không bị
  // chi phí round-trip Playwright làm phồng số (bản cũ: mỗi vòng poll 3
  // evaluate, mỗi cái ~1s dưới tải → trial 30s dù canvas xong sau ~3s).
  // Trả về tElementMs (element currentTime ≈ target, !seeking),
  // tCanvasMs (khung canvas đã đổi tới đúng vị trí + ổn định), và mẫu
  // immediate (đối chứng stale).
  const SEEK_SAMPLE_FN = (target, localT, expProjX) => `(async () => {
    const mod = window.__q5storeMod || (window.__q5storeMod = await import("/src/store.ts"));
    const st = mod.useStore.getState();
    const canvasExpected = (m, fx, fy) => {
      const s = Math.min(m.W / 1280, m.H / 720);
      const dw = 1280 * s, dh = 720 * s;
      return { cx: +(((m.W - dw) / 2 + fx * dw) / m.W).toFixed(4), cy: +(((m.H - dh) / 2 + fy * dh) / m.H).toFixed(4) };
    };
    const measure = () => {
      const c = document.querySelector(".preview-canvas");
      if (!c) return null;
      const ctx = c.getContext("2d");
      const W = c.width, H = c.height;
      const img = ctx.getImageData(0, 0, W, H).data;
      let bn = 0, bx = 0, by = 0, bx0 = W, bx1 = 0, by0 = H, by1 = 0;
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
      return { W, H, darkN: dn, darkCx: dn ? +(dx / dn / W).toFixed(4) : null, darkCy: dn ? +(dy / dn / H).toFixed(4) : null, brightN: bn };
    };
    const els = () => (window.__vcutMediaEls || []).map((e) => ({ tag: e.tag, t: +e.el.currentTime.toFixed(3), seeking: e.el.seeking, readyState: e.el.readyState }));
    const base = measure();
    const baseDarkCx = base?.darkCx ?? null;
    // Đợt 94 V7 — canvas vốn đã trùng đích trước seek? (khung cũ từ trial
    // trước kẹt lại). Dùng để phân loại verdict khi trial không confirmed.
    const expAtBase = base ? canvasExpected(base, ${expProjX}, 0.5) : null;
    const alreadyAtTarget = baseDarkCx !== null && expAtBase !== null && Math.abs(baseDarkCx - expAtBase.cx) < 0.03;
    if (st.playing) st.togglePlay();
    const t0 = performance.now();
    st.setPlayhead(${target});
    const imm = measure();
    const immStale = baseDarkCx !== null && imm?.darkCx !== null && Math.abs(imm.darkCx - baseDarkCx) < 0.005;
    return await new Promise((resolve) => {
      let tElementMs = null, tCanvasMs = null, prevDark = null, stableCount = 0;
      let lastDarkCx = imm?.darkCx ?? null, lastEls = els(), lastPlayhead = st.playhead;
      // Đợt 94 V7 — sawChange: canvas ĐÃ ĐỔI khỏi baseline (darkCx lệch
      // ≥ ngưỡng đổi) trước khi được tính là khớp đích. Đợt 95 W8 — ngưỡng
      // đổi không còn hardcode 0.01 mà lấy từ hiệu chuẩn đầu lượt (CAL:
      // max(bước khung/4, 2×nhiễu), xem CALIBRATE_FN; fallback 0.01 khi
      // hiệu chuẩn hỏng). Baseline không có vùng tối: khung tối đầu tiên
      // xuất hiện cũng tính là đổi.
      let sawChange = false, changedMs = null, maxDev = 0;
      const timer = setInterval(() => {
        const now = performance.now();
        const m = measure();
        const es = els();
        const ph = mod.useStore.getState().playhead;
        lastDarkCx = m?.darkCx ?? null; lastEls = es; lastPlayhead = ph;
        const phOk = Math.abs(ph - ${target}) < 1 / 30;
        // Element: chọn video element có currentTime GẦN target nhất (pool
        // giữ cả element clip mẫu cũ ở t=0 — lấy element đầu tiên sẽ nhầm).
        const vids = es.filter((e) => e.tag === "VIDEO");
        let best = null, bestD = 1e9;
        for (const v of vids) { const d = Math.abs(v.t - ${localT}); if (d < bestD) { bestD = d; best = v; } }
        if (tElementMs === null && phOk && best && !best.seeking && bestD < 1 / 30 + 0.02) tElementMs = Math.round(now - t0);
        if (!sawChange && m && m.darkN > 0 && m.darkCx !== null) {
          if (baseDarkCx === null) { sawChange = true; changedMs = Math.round(now - t0); }
          else {
            const dev = Math.abs(m.darkCx - baseDarkCx);
            if (dev > maxDev) maxDev = +dev.toFixed(4);
            if (dev >= ${CAL.changeThreshold}) { sawChange = true; changedMs = Math.round(now - t0); }
          }
        }
        const exp = m ? canvasExpected(m, ${expProjX}, 0.5) : null;
        // Đợt 94 V7 — canvasOk MỚI: phải sawChange rồi mới khớp đích.
        // Khung cũ trùng đích (không đổi) không còn PASS nhầm nữa.
        const canvasOk = !!m && m.darkN > 0 && exp !== null && sawChange && Math.abs(m.darkCx - exp.cx) < 0.03;
        if (canvasOk) {
          if (prevDark !== null && Math.abs(m.darkCx - prevDark) < ${CAL.stableEps}) stableCount++;
          else stableCount = 0;
          prevDark = m.darkCx;
          if (tCanvasMs === null && stableCount >= 1) tCanvasMs = Math.round(now - t0);
        } else { prevDark = null; stableCount = 0; }
        if (tCanvasMs !== null && phOk && tElementMs !== null) { clearInterval(timer); resolve(finish()); }
        else if (now - t0 > 30000) { clearInterval(timer); resolve(finish()); }
      }, 50);
      function finish() {
        // Verdict: confirmed | already-at-target (canvas vốn trùng đích,
        // không đổi trong 30s — KHÔNG kết luận được khung mới có tới hay
        // không, không tính confirmed, không tính stale) | stale-timeout.
        const verdict = (tCanvasMs !== null && tElementMs !== null) ? "confirmed"
          : (alreadyAtTarget && !sawChange) ? "already-at-target" : "stale-timeout";
        return { localT: ${localT}, target: ${target}, expProjX: ${expProjX},
          baseDarkCx, immDarkCx: imm?.darkCx ?? null, immStale,
          tElementMs, tCanvasMs, confirmed: tCanvasMs !== null && tElementMs !== null,
          verdict, alreadyAtTarget, sawChange, changedMs, maxDevFromBase: maxDev,
          changeThreshold: ${CAL.changeThreshold}, stableEps: ${CAL.stableEps},
          lastDarkCx, lastEls, playheadEnd: lastPlayhead };
      }
    });
  })()`;

  async function confirmedSeek(localT) {
    const target = clipB.start + localT;
    const expProjX = 0.35 + 0.05 * localT;
    return evalJs(SEEK_SAMPLE_FN(target, localT, expProjX));
  }

  // Baseline: seek tới 1.0 có xác nhận trước khi vào vòng trial.
  const base0 = await confirmedSeek(1.0);
  log(`baseline seek 1.0: confirmed=${base0.confirmed} verdict=${base0.verdict} tElement=${base0.tElementMs}ms tCanvas=${base0.tCanvasMs}ms changedMs=${base0.changedMs} immStale=${base0.immStale} (imm darkCx=${base0.immDarkCx} vs base=${base0.baseDarkCx})`);
  results.baseline = base0;

  if (LOAD) {
    for (let i = 0; i < 3; i++) {
      const p = spawn("yes", [], { stdio: ["ignore", "ignore", "ignore"] });
      loadProcs.push(p);
    }
    await sleep(2000);
    log(`tải nền BẬT: 3x yes | ${execFileSync("sh", ["-c", "uptime; free -m | head -2 | tail -1"], { encoding: "utf8" }).trim().replace(/\n/g, " | ")}`);
  }

  for (let i = 0; i < TRIALS; i++) {
    const localT = i % 2 === 0 ? 5.0 : 1.0;
    const r = await confirmedSeek(localT);
    results.trials.push(r);
    log(`trial ${i + 1}/${TRIALS} t=${localT}: confirmed=${r.confirmed} verdict=${r.verdict} tElement=${r.tElementMs}ms tCanvas=${r.tCanvasMs}ms changedMs=${r.changedMs} sawChange=${r.sawChange} alreadyAtTarget=${r.alreadyAtTarget} maxDev=${r.maxDevFromBase} immStale=${r.immStale} lastDarkCx=${r.lastDarkCx} (kỳ vọng proj x=${r.expProjX}) els=${JSON.stringify((r.lastEls || []).map((e) => `${e.tag}:t=${e.t},seeking=${e.seeking},rs=${e.readyState}`))}`);
  }

  if (LOAD) {
    for (const p of loadProcs) { try { p.kill("SIGKILL"); } catch {} }
    loadProcs = [];
    log("tải nền TẮT");
  }
  results.pageErrs = pageErrs;
  results.loadavgEnd = execFileSync("sh", ["-c", "uptime"], { encoding: "utf8" }).trim();
  writeFileEpermRetry(path.join(SCRATCH, "probe-results.json"), JSON.stringify(results, null, 2));
  const okTrials = results.trials.filter((t) => t.confirmed);
  const alreadyTrials = results.trials.filter((t) => t.verdict === "already-at-target");
  const staleTrials = results.trials.filter((t) => t.verdict === "stale-timeout");
  const elTimes = okTrials.map((t) => t.tElementMs).filter((v) => v !== null).sort((a, b) => a - b);
  const cvTimes = okTrials.map((t) => t.tCanvasMs).sort((a, b) => a - b);
  const med = (a) => a.length ? a[Math.floor(a.length / 2)] : null;
  log(`TÓM TẮT ${ENGINE} load=${LOAD}: confirmed ${okTrials.length}/${TRIALS} (already-at-target ${alreadyTrials.length}, stale-timeout ${staleTrials.length}); tElement median=${med(elTimes)}ms max=${elTimes.length ? elTimes[elTimes.length - 1] : null}ms; tCanvas median=${med(cvTimes)}ms max=${cvTimes.length ? cvTimes[cvTimes.length - 1] : null}ms; immediate-stale ${results.trials.filter((t) => t.immStale).length}/${TRIALS} (đối chứng); pageErrs=${JSON.stringify(pageErrs)}`);
  log(`kết quả chi tiết: ${path.join(SCRATCH, "probe-results.json")}`);
  writeFileEpermRetry(path.join(SCRATCH, "probe-log.txt"), logLines.join("\n") + "\n");
}

main().catch(async (e) => {
  console.error("PROBE LỖI: " + (e && e.stack || e));
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-error.txt"), String(e && e.stack || e)); } catch {}
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-log.txt"), logLines.join("\n") + "\n"); } catch {}
  await cleanup();
  process.exit(2);
}).then(async () => { await cleanup(); process.exit(0); });
