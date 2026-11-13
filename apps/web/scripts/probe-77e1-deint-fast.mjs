// probe-77e1-deint-fast.mjs — Phase 9 đợt 77, luồng E1: tìm đường deint-only
// nhanh hơn half-res D4 (FPS headed 0.72–0.73×, FAIL ngưỡng 0.75×).
// Nợ: docs/PHASE9_ROUND76_D4_DEINT_FPS_LIMITS.md §6.1 — mọi đường 2 lần vẽ
// đều ~0.7× trên SwiftShader; inline-shift 1 lần vẽ đã LOẠI (probe-b: R
// chỉ giảm ở s≈1.0, ở upscale 1.13 R 0.85 → 0.88); SVG blur 1 lần vẽ LOẠI
// (thông lượng ~7×). Các ứng viên CHƯA thử, đo trên tab trắng:
//   halfHigh — đường D4 hiện tại (downscale dọc 2×, smoothing "high") = đối chứng
//   halfLow / halfMed — cùng half-res nhưng smoothing "low"/"medium":
//     ở downscale đúng 2×, bilinear point-sample đã lấy đúng giữa 2 hàng
//     nguồn (trọng số 0.5/0.5) nên R có thể Y HỆT "high" mà rẻ hơn.
//   tap2 — 2 lần vẽ TỪ VIDEO: lần 1 opaque tại dy=0, lần 2 alpha 0.5 lệch
//     +1 hàng nguồn (+s px đích): trung bình 2 resample lệch pha. Chưa đo
//     R ở upscale; nếu R đạt và video upload được cache trong 1 tick thì
//     có thể rẻ hơn half-res (lần 2 lấy mẫu từ video, không qua canvas).
//   blur1 — ctx.filter blur(1px) 1 lần vẽ (đẳng hướng; C8 chỉ đo blur 0.5px
//     = no-op do lượng tử hoá; 1px chưa đo).
//   qtrH — intermediate dw×(dh/4) ("high"): lần 1 chỉ 1/4 pixel của half-res,
//     đổi lại mềm dọc hơn — đo R + vgrad để xem đánh đổi.
//   qtr — intermediate (dw/2)×(dh/2) ("high"): lần 1 chỉ 1/4 pixel, lần 2
//     upscale 2× cả 2 chiều — đo thêm hgrad (mềm ngang?).
// Đo R combing + vgrad/hgrad + MAD vs noop ở s ∈ {1.0, 1.13, 1.5} (mốc 1.0s)
// và thông lượng (60 lần vẽ cùng frame, 2 lần lặp) ở s ∈ {1.0, 1.13}.
// LƯU Ý (D4 §3.3): thông lượng frame-lặp NÓI QUÁ tốc độ trong app thật
// (mỗi tick app là frame mới + decode + các clip khác); chỉ số headed
// clicktest-77e1 mới là verdict FPS. Probe chỉ sàng lọc ứng viên.
// Chạy: node apps/web/scripts/probe-77e1-deint-fast.mjs
// Env: E1_DEV_PORT (5570–5579), E1_DEBUG_PORT (9670–9679), E1_DISPLAY
// (:180–:189), E1_SCRATCH (mặc định hidden_files/round77-e1).
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
const SCRATCH = process.env.E1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round77-e1");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round77-e1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.e1.config.mjs");
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
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  const metrics = (d, w, h) => {
    const x0 = Math.floor(w * 0.1), x1 = Math.floor(w * 0.9), y0 = Math.floor(h * 0.1), y1 = Math.floor(h * 0.9);
    const lum = (x, y) => { const i = (y * w + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
    let cross = 0, same = 0, n = 0, vg = 0, vn = 0, hg = 0, hn = 0;
    for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
      cross += Math.abs(lum(x, y) - lum(x, y + 1));
      same += Math.abs(lum(x, y) - lum(x, y + 2));
      n++;
    }
    for (let y = y0; y < y1 - 1; y += 2) for (let x = x0; x < x1; x += 2) { vg += Math.abs(lum(x, y) - lum(x, y + 1)); vn++; }
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1 - 1; x += 2) { hg += Math.abs(lum(x, y) - lum(x + 1, y)); hn++; }
    return { ratio: +((cross / n) / Math.max(same / n, 0.001)).toFixed(2),
      vgrad: +((vg / vn).toFixed(3)), hgrad: +((hg / hn).toFixed(3)) };
  };
  const madVs = (a, b) => { let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]); return +((s / (a.length / 4)).toFixed(3)); };
  // Canvas trung gian tái dùng như preview.tsx deintIntermediateSource.
  const halfC = document.createElement("canvas");
  const qtrC = document.createElement("canvas");
  const qtrHC = document.createElement("canvas");
  function drawMode(ctx, W, H, s, mode) {
    if (mode === "noop") { ctx.drawImage(v, 0, 0, W, H); }
    else if (mode === "shift") { ctx.drawImage(v, 0, 0.5 * s, W, H); }
    else if (mode === "halfHigh" || mode === "halfLow" || mode === "halfMed") {
      const q = mode === "halfHigh" ? "high" : mode === "halfLow" ? "low" : "medium";
      const hw = W, hh = Math.max(2, Math.round(H / 2));
      if (halfC.width !== hw || halfC.height !== hh) { halfC.width = hw; halfC.height = hh; }
      const hctx = halfC.getContext("2d", { willReadFrequently: true });
      hctx.clearRect(0, 0, hw, hh);
      hctx.imageSmoothingEnabled = true; hctx.imageSmoothingQuality = q;
      hctx.drawImage(v, 0, 0, hw, hh);
      ctx.drawImage(halfC, 0, 0, W, H);
    }
    else if (mode === "tap2") {
      ctx.drawImage(v, 0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(v, 0, s, W, H); ctx.restore();
    }
    else if (mode === "blur1") { ctx.filter = "blur(1px)"; ctx.drawImage(v, 0, 0, W, H); ctx.filter = "none"; }
    else if (mode === "qtrH") {
      const hw = W, hh = Math.max(2, Math.round(H / 4));
      if (qtrHC.width !== hw || qtrHC.height !== hh) { qtrHC.width = hw; qtrHC.height = hh; }
      const hctx = qtrHC.getContext("2d", { willReadFrequently: true });
      hctx.clearRect(0, 0, hw, hh);
      hctx.imageSmoothingEnabled = true; hctx.imageSmoothingQuality = "high";
      hctx.drawImage(v, 0, 0, hw, hh);
      ctx.drawImage(qtrHC, 0, 0, W, H);
    }
    else if (mode === "qtr") {
      const hw = Math.max(2, Math.round(W / 2)), hh = Math.max(2, Math.round(H / 2));
      if (qtrC.width !== hw || qtrC.height !== hh) { qtrC.width = hw; qtrC.height = hh; }
      const hctx = qtrC.getContext("2d", { willReadFrequently: true });
      hctx.clearRect(0, 0, hw, hh);
      hctx.imageSmoothingEnabled = true; hctx.imageSmoothingQuality = "high";
      hctx.drawImage(v, 0, 0, hw, hh);
      ctx.drawImage(qtrC, 0, 0, W, H);
    }
    else throw new Error("mode lạ " + mode);
  }
  function drawAt(s, mode) {
    const W = Math.round(1280 * s), H = Math.round(720 * s);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, W, H);
    drawMode(ctx, W, H, s, mode);
    const data = ctx.getImageData(0, 0, W, H).data;
    return { ...metrics(data, W, H), data };
  }
  // Thông lượng: lặp 60 lần vẽ cùng frame (đã seek đứng yên), đo ms/draw.
  function throughput(s, mode) {
    const W = Math.round(1280 * s), H = Math.round(720 * s);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const N = 60;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      ctx.clearRect(0, 0, W, H);
      drawMode(ctx, W, H, s, mode);
    }
    return +(((performance.now() - t0) / N).toFixed(2));
  }
  const MODES = ["noop", "shift", "halfHigh", "halfLow", "halfMed", "tap2", "blur1", "qtrH", "qtr"];
  const TP_MODES = ["noop", "halfHigh", "halfLow", "halfMed", "tap2", "blur1", "qtrH", "qtr"];
  // Chỉ s=1.0 và s=1.13 (s=1.5 đã có số D4 probe-c; quyết định nằm ở 1.13 app + 1.0).
  const SCALES = [1.0, 1.13];
  const out = { video: ${JSON.stringify(videoUrl)}, part: PART, scales: [], throughput: [] };
  await new Promise((res) => { v.onseeked = res; v.currentTime = 1.0; });
  await new Promise((r) => setTimeout(r, 150));
  if (PART === "r" || PART === "all") {
  for (const s of SCALES) {
    const row = { s };
    const noopData = drawAt(s, "noop");
    row.noop = { ratio: noopData.ratio, vgrad: noopData.vgrad, hgrad: noopData.hgrad };
    for (const mode of MODES.slice(1)) {
      const r = drawAt(s, mode);
      row[mode] = { ratio: r.ratio, vgrad: r.vgrad, hgrad: r.hgrad, mad: madVs(r.data, noopData.data) };
    }
    out.scales.push(row);
  }
  }
  if (PART === "tp" || PART === "all") {
  for (const s of [1.0, 1.13]) {
    const row = { s };
    for (const mode of TP_MODES) {
      const a = throughput(s, mode), b = throughput(s, mode);
      row[mode] = { run1: a, run2: b, mean: +(((a + b) / 2).toFixed(2)) };
    }
    out.throughput.push(row);
  }
  }
  return out;
})()`;

let vite = null, xvfb = null, chrome = null;
async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const DEV_PORT = Number(process.env.E1_DEV_PORT || 0) || (await pickFreePort(5570, 5579));
  const DEBUG_PORT = Number(process.env.E1_DEBUG_PORT || 0) || (await pickFreePort(9670, 9679));
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 180; n <= 189; n++) {
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
  const DISPLAY = process.env.E1_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5570–5579");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9670–9679");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r77e1-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata-e1");
  const TMPDIR = "/tmp/round77-e1/tmp";
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
export default { server: { hmr: false }, plugins: [{ name: "e1-media", configureServer(server) {
  server.middlewares.use("/r77e1-media", serveDir(MEDIA_DIR));
} }] };
`);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, loadavg ${loadAvg()}`);
  const viteLogFd = fs.openSync(path.join(SCRATCH, "e1-vite.log"), "w");
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
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "e1-chrome.log"), "w");
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
    // Tách 2 lần evaluate (R rồi throughput) để mỗi lần < timeout CDP khi
    // VM tải cao (vòng 77 nhiều luồng song song — loadavg lúc mở đầu ~12).
    log(`probe ${key} (R) ... (loadavg ${loadAvg()})`);
    const pr = await cdp.evalJs(PROBE_FN(url, "r"));
    log(`probe ${key} (throughput) ... (loadavg ${loadAvg()})`);
    const pt = await cdp.evalJs(PROBE_FN(url, "tp"));
    results.probes[key] = { video: pr.video, scales: pr.scales, throughput: pt.throughput };
    const p = results.probes[key];
    for (const row of p.scales) {
      log(`  ${key} s=${row.s}: noop R=${row.noop.ratio} vg=${row.noop.vgrad} hg=${row.noop.hgrad}`);
      for (const m of ["shift", "halfHigh", "halfLow", "halfMed", "tap2", "blur1", "qtrH", "qtr"]) {
        const r = row[m];
        log(`    ${m}: R=${r.ratio} vg=${r.vgrad} (${(100 * r.vgrad / row.noop.vgrad).toFixed(0)}%) hg=${r.hgrad} (${(100 * r.hgrad / row.noop.hgrad).toFixed(0)}%) MAD=${r.mad}`);
      }
    }
    for (const row of p.throughput) {
      const ratio = (m) => row.noop.mean > 0 ? +(row[m].mean / row.noop.mean).toFixed(2) : null;
      const parts = Object.keys(row).filter((k) => k !== "s").map((m) => `${m} ${row[m].mean} (${ratio(m)}x)`);
      log(`  ${key} throughput s=${row.s} ms/draw: ${parts.join(" | ")}`);
    }
  }
  writeFileEpermRetry(path.join(SCRATCH, "probe-77e1-deint-fast.json"), JSON.stringify(results, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "probe-77e1-deint-fast.log"), logLines.join("\n") + "\n");
  log("probe xong — JSON: hidden_files/round77-e1/probe-77e1-deint-fast.json");
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e.stack || e}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-77e1-deint-fast.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
  process.exitCode = 1;
}).finally(() => {
  try { chrome?.kill(); } catch {}
  try { xvfb?.kill(); } catch {}
  try { vite?.kill(); } catch {}
});
