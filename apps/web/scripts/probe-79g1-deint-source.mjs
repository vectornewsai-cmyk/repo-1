// probe-79g1-deint-source.mjs — Phase 9 đợt 79, luồng G1: FPS deint-only.
// Nợ: docs/PHASE9_ROUND78_F1_DEINT_FPS_LIMITS.md §6.1 — mọi đường 2 lần vẽ
// đều ~0,55–0,86×; F1 chứng minh chi phí nằm ở ĐỌC FRAME VIDEO
// (intermediate 1280×360 từ video median ~71ms/call, ngang copy cache
// 1280×720), không phải kích thước đích hay smoothing quality.
// HƯỚNG MỚI G1: cho intermediate đọc từ canvas held-frame đã vẽ cùng
// tick (storeHeldFrame vẽ video → held canvas 1280×720 MỖI tick rồi) thay
// vì đọc lại video — giảm số lần đọc video mỗi tick deint-only từ 2 → 1.
// Probe tab trắng này kiểm chứng cơ chế TRƯỚC khi đụng production:
//   (a) ms/draw từng phép vẽ nguyên tử, video ĐANG PHÁT (frame mới mỗi
//       lần vẽ, như tick app thật — khác probe E1 lặp cùng frame):
//       v2inter (đường hiện tại), v2held (chi phí chung đã trả),
//       held2inter (đường mới), v2interNoWRF / held2interNoWRF
//       (willReadFrequently có làm chậm drawImage từ video không?),
//       inter2final, v2final (main draw baseline).
//       Chi phí tăng thêm của deint: A = v2inter + (inter2final − v2final);
//       B = held2inter + (inter2final − v2final).
//   (b) pixel (video PAUSE ở 1.0s): MAD + R của final B vs final A,
//       C(noWRF) vs A — B phải ~0 mới được nối vào production.
// Chạy: node apps/web/scripts/probe-79g1-deint-source.mjs
// Env: G1_DEV_PORT (5590–5599), G1_DEBUG_PORT (9690–9699), G1_DISPLAY
// (:190–:199), G1_SCRATCH (mặc định hidden_files/round79-g1).
// Exit 0 khi probe xong, 1 khi harness lỗi. KHÔNG sửa code sản phẩm.
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const MEDIA_DIR = path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const SCRATCH = process.env.G1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round79-g1");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round79-g1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.g1.config.mjs");
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = findChrome();

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
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

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 180s: ${method}`)); }, 180000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
}

const PROBE_FN = (videoUrl, part) => `(async () => {
  const PART = ${JSON.stringify(part)};
  const W = 1280, H = 720, HH = 360;
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto"; v.loop = true;
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  const metrics = (d, w, h) => {
    const x0 = Math.floor(w * 0.1), x1 = Math.floor(w * 0.9), y0 = Math.floor(h * 0.1), y1 = Math.floor(h * 0.9);
    const lum = (x, y) => { const i = (y * w + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
    let cross = 0, same = 0, n = 0, vg = 0, vn = 0;
    for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
      cross += Math.abs(lum(x, y) - lum(x, y + 1));
      same += Math.abs(lum(x, y) - lum(x, y + 2));
      n++;
    }
    for (let y = y0; y < y1 - 1; y += 2) for (let x = x0; x < x1; x += 2) { vg += Math.abs(lum(x, y) - lum(x, y + 1)); vn++; }
    return { ratio: +((cross / n) / Math.max(same / n, 0.001)).toFixed(2), vgrad: +((vg / vn).toFixed(3)) };
  };
  const madVs = (a, b) => { let s = 0, mx = 0; for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - b[i]); s += d; if (d > mx) mx = d; } return { mad: +(s / (a.length / 4)).toFixed(4), max: mx }; };
  const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const stats = (a) => ({ n: a.length, median: +median(a).toFixed(2), mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), min: +Math.min(...a).toFixed(2), max: +Math.max(...a).toFixed(2) });
  // Canvas tái dùng như preview.tsx (held = storeHeldFrame, inter =
  // deintIntermediateSource, final = canvas chính thu nhỏ về 1280×720).
  const heldC = document.createElement("canvas"); heldC.width = W; heldC.height = H;
  const interC = document.createElement("canvas"); interC.width = W; interC.height = HH;
  const interC2 = document.createElement("canvas"); interC2.width = W; interC2.height = HH;
  const finalC = document.createElement("canvas"); finalC.width = W; finalC.height = H;
  const heldCtx = heldC.getContext("2d");
  const interCtx = interC.getContext("2d", { willReadFrequently: true });
  const interCtx2 = interC2.getContext("2d");
  const finalCtx = finalC.getContext("2d", { willReadFrequently: true });
  interCtx.imageSmoothingEnabled = true; interCtx.imageSmoothingQuality = "high";
  interCtx2.imageSmoothingEnabled = true; interCtx2.imageSmoothingQuality = "high";
  const out = { video: ${JSON.stringify(videoUrl)}, duration: v.duration, part: PART };
  const timed = (fn) => { const t0 = performance.now(); fn(); return performance.now() - t0; };
  if (PART === "tp" || PART === "all") {
    // Video ĐANG PHÁT: mỗi lần vẽ thấy frame mới (như tick app thật).
    await new Promise((res) => { v.onseeked = res; v.currentTime = 1.0; });
    await v.play();
    await new Promise((r) => setTimeout(r, 300));
    const MODES = ["v2inter", "v2held", "held2inter", "v2interNoWRF", "held2interNoWRF", "inter2final", "v2final"];
    const samples = Object.fromEntries(MODES.map((m) => [m, []]));
    const draw = (mode) => {
      if (mode === "v2inter") return timed(() => interCtx.drawImage(v, 0, 0, W, HH));
      if (mode === "v2held") return timed(() => heldCtx.drawImage(v, 0, 0, W, H));
      if (mode === "held2inter") return timed(() => interCtx.drawImage(heldC, 0, 0, W, HH));
      if (mode === "v2interNoWRF") return timed(() => interCtx2.drawImage(v, 0, 0, W, HH));
      if (mode === "held2interNoWRF") return timed(() => interCtx2.drawImage(heldC, 0, 0, W, HH));
      if (mode === "inter2final") return timed(() => finalCtx.drawImage(interC, 0, 0, W, H));
      return timed(() => finalCtx.drawImage(v, 0, 0, W, H));
    };
    // Xen kẽ theo vòng để triệt drift tải: 5 vòng × 8 lần/mode.
    for (let round = 0; round < 5; round++) {
      for (const m of MODES) for (let i = 0; i < 8; i++) samples[m].push(draw(m));
      await new Promise((r) => setTimeout(r, 50));
    }
    v.pause();
    out.throughput = Object.fromEntries(MODES.map((m) => [m, stats(samples[m])]));
    // Chi phí tăng thêm của deint so với main draw video trực tiếp:
    const A = out.throughput.v2inter.median + (out.throughput.inter2final.median - out.throughput.v2final.median);
    const B = out.throughput.held2inter.median + (out.throughput.inter2final.median - out.throughput.v2final.median);
    out.incremental = { currentVideoSource: +A.toFixed(2), newHeldSource: +B.toFixed(2) };
  }
  if (PART === "px" || PART === "all") {
    // Video PAUSE ở 1.0s: cùng 1 frame cho mọi đường, so pixel tuyệt đối.
    v.pause();
    await new Promise((res) => { v.onseeked = res; v.currentTime = 1.0; });
    await new Promise((r) => setTimeout(r, 150));
    const grab = (fn) => { finalCtx.clearRect(0, 0, W, H); fn(); return finalCtx.getImageData(0, 0, W, H).data; };
    const dA = grab(() => { interCtx.clearRect(0, 0, W, HH); interCtx.drawImage(v, 0, 0, W, HH); finalCtx.drawImage(interC, 0, 0, W, H); });
    const dB = grab(() => { heldCtx.clearRect(0, 0, W, H); heldCtx.drawImage(v, 0, 0, W, H); interCtx.clearRect(0, 0, W, HH); interCtx.drawImage(heldC, 0, 0, W, HH); finalCtx.drawImage(interC, 0, 0, W, H); });
    const dC = grab(() => { interCtx2.clearRect(0, 0, W, HH); interCtx2.drawImage(v, 0, 0, W, HH); finalCtx.drawImage(interC2, 0, 0, W, H); });
    const dD = grab(() => { finalCtx.drawImage(v, 0, 0, W, H); });
    out.pixels = {
      A: metrics(dA, W, H), B: metrics(dB, W, H), C: metrics(dC, W, H), D: metrics(dD, W, H),
      madBvsA: madVs(dB, dA), madCvsA: madVs(dC, dA), madDvsA: madVs(dD, dA),
    };
  }
  return out;
})()`;

let vite = null, xvfb = null, chrome = null;
async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const DEV_PORT = Number(process.env.G1_DEV_PORT || 0) || (await pickFreePort(5590, 5599));
  const DEBUG_PORT = Number(process.env.G1_DEBUG_PORT || 0) || (await pickFreePort(9690, 9699));
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 190; n <= 199; n++) {
      const d = `:${n}`;
      const sock = `/tmp/.X11-unix/X${n}`;
      if (fs.existsSync(sock)) {
        let alive = false;
        try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
        if (alive) continue;
        try { fs.unlinkSync(sock); } catch {}
        try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
        log(`đã dọn socket X mồ côi ${sock}`);
      }
      return d;
    }
    return null;
  }
  const DISPLAY = process.env.G1_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :190–:199");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5590–5599");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9690–9699");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r79g1-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata-g1");
  const TMPDIR = "/tmp/round79-g1/tmp";
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
  writeFileEpermRetry(VITE_CFG, `import fs from "node:fs";
import path from "node:path";
const MEDIA_DIR = ${JSON.stringify(MEDIA_DIR)};
const MIME = { ".mp4": "video/mp4" };
const serveDir = (dir) => (req, res) => {
  const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\\//, "");
  const fp = path.join(dir, name);
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!name || name.includes("..") || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.statusCode = 404; res.end("not found"); return; }
  const st = fs.statSync(fp);
  const range = req.headers.range;
  res.setHeader("Content-Type", MIME[path.extname(fp).toLowerCase()] || "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");
  if (range) {
    const m = /bytes=(\\d+)-(\\d*)/.exec(range);
    if (m) {
      const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
      res.statusCode = 206;
      res.setHeader("Content-Range", \`bytes \${start}-\${end}/\${st.size}\`);
      res.setHeader("Content-Length", String(end - start + 1));
      fs.createReadStream(fp, { start, end }).pipe(res);
      return;
    }
  }
  res.setHeader("Content-Length", String(st.size));
  fs.createReadStream(fp).pipe(res);
};
export default { server: { hmr: false }, plugins: [{ name: "g1-media", configureServer(server) {
  server.middlewares.use("/r79g1-media", serveDir(MEDIA_DIR));
} }] };
`);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, loadavg ${loadAvg()}`);
  const viteLogFd = fs.openSync(path.join(SCRATCH, "g1-vite.log"), "w");
  vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
  log("vite dev đã lên");
  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
  {
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
      else await sleep(500);
    }
    if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s`);
  }
  if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "g1-chrome.log"), "w");
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
    { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
      pageTarget = pages.find((p) => p.type === "page");
      if (!pageTarget) await sleep(500);
    } catch { await sleep(500); }
  }
  if (!pageTarget) throw new Error("không lấy được page target CDP");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const results = { loadavg: loadAvg(), probes: {} };
  for (const [key, url] of [
    ["interlaced", MEDIA_URL("interlaced720.mp4")],
    ["clean", MEDIA_URL("clean720.mp4")],
  ]) {
    log(`probe ${key} (throughput, video đang phát) ... (loadavg ${loadAvg()})`);
    const pt = await cdp.evalJs(PROBE_FN(url, "tp"));
    log(`probe ${key} (pixel, pause 1.0s) ... (loadavg ${loadAvg()})`);
    const pp = await cdp.evalJs(PROBE_FN(url, "px"));
    results.probes[key] = { video: pt.video, duration: pt.duration, throughput: pt.throughput, incremental: pt.incremental, pixels: pp.pixels };
    const p = results.probes[key];
    for (const [m, s] of Object.entries(p.throughput)) {
      log(`  ${key} ${m}: median ${s.median}ms mean ${s.mean}ms min ${s.min} max ${s.max} (n=${s.n})`);
    }
    log(`  ${key} incremental deint (median): hiện tại từ video ${p.incremental.currentVideoSource}ms | mới từ held ${p.incremental.newHeldSource}ms`);
    const px = p.pixels;
    log(`  ${key} pixel: A R=${px.A.ratio} vg=${px.A.vgrad} | B R=${px.B.ratio} vg=${px.B.vgrad} | C R=${px.C.ratio} vg=${px.C.vgrad} | D R=${px.D.ratio}`);
    log(`  ${key} MAD: B vs A = ${px.madBvsA.mad} (max ${px.madBvsA.max}) | C vs A = ${px.madCvsA.mad} (max ${px.madCvsA.max}) | D vs A = ${px.madDvsA.mad}`);
  }
  writeFileEpermRetry(path.join(SCRATCH, "probe-79g1-deint-source.json"), JSON.stringify(results, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "probe-79g1-deint-source.log"), logLines.join("\n") + "\n");
  log("probe xong — JSON: hidden_files/round79-g1/probe-79g1-deint-source.json");
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e.stack || e}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-79g1-deint-source.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
  process.exitCode = 1;
}).finally(() => {
  try { chrome?.kill(); } catch {}
  try { xvfb?.kill(); } catch {}
  try { vite?.kill(); } catch {}
});
