// probe-80h6-bbb-sameframe.mjs — Phase 9 đợt 80, luồng H6: tách nguyên nhân
// G8 MAD +0,099 sau G1 (nợ docs/PHASE9_ROUND79_G1_DEINT_FPS_LIMITS.md §5.4).
// Câu hỏi: đường intermediate mới (held-frame canvas → inter) lệch pixel
// bao nhiêu so với đường cũ (video → inter) TRÊN CÙNG 1 FRAME BBB, ở cả
// 2 hình học (native 1280×720 như probe G1; app 1449×815 như headed E1)?
// Và: held canvas LỆCH BAO NHIÊU FRAME thì tạo ra đúng +0,099 (hiệu chuẩn
// giả thuyết "held frame cũ")? Video PAUSE ở 1.0s cho mọi arm.
// Các arm (mỗi hình học): A = video→inter→final (đường cũ);
// B = video→held→inter→final (đường mới, cùng frame);
// Bstale[±1f, ±6f, ±0.5s] = held vẽ từ frame lệch rồi mới inter→final;
// OFF = video→final trực tiếp (không deint — mốc độ lớn kiểu G8);
// A2 = lặp lại A để kiểm tra tính xác định (phải MAD 0).
// Bất đẳng thức tam giác: |MAD(B,OFF) − MAD(A,OFF)| ≤ MAD(B,A) — nếu
// MAD(B,A) ≈ 0,016 như testsrc2 thì +0,099 KHÔNG thể do chuỗi resample,
// phải do lệch frame (held cũ) hoặc OFF snapshot đổi.
// Chạy: node apps/web/scripts/probe-80h6-bbb-sameframe.mjs
// Env: H6_DEV_PORT, H6_DEBUG_PORT, H6_DISPLAY, H6_SCRATCH.
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
const SCRATCH = process.env.H6_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round80-h6", "probe");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round80-h6";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.h6.config.mjs");
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

const PROBE_FN = (videoUrl) => `(async () => {
  const W0 = 1280, H0 = 720;
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
  const madVs = (a, b) => { let s = 0, mx = 0, sR = 0, sG = 0, sB = 0; const n = a.length / 4;
    for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - b[i]); s += d; if (d > mx) mx = d; sR += Math.abs(a[i] - b[i]); sG += Math.abs(a[i+1] - b[i+1]); sB += Math.abs(a[i+2] - b[i+2]); }
    return { mad: +(s / n).toFixed(4), max: mx, madR: +(sR / n).toFixed(4), madG: +(sG / n).toFixed(4), madB: +(sB / n).toFixed(4) }; };
  const seekTo = (t) => new Promise((res) => { v.onseeked = res; v.currentTime = t; });
  const out = { video: ${JSON.stringify(videoUrl)}, duration: v.duration, geometries: {} };
  // 2 hình học: native (như probe G1) và app (dw=1449, dh=815, scale 1.132).
  for (const [gname, FW, FH] of [["native", 1280, 720], ["app", 1449, 815]]) {
    const HH = Math.round(FH / 2);
    const heldC = document.createElement("canvas"); heldC.width = FW; heldC.height = FH;
    const interC = document.createElement("canvas"); interC.width = FW; interC.height = HH;
    const finalC = document.createElement("canvas"); finalC.width = FW; finalC.height = FH;
    const heldCtx = heldC.getContext("2d");
    const interCtx = interC.getContext("2d", { willReadFrequently: true });
    const finalCtx = finalC.getContext("2d", { willReadFrequently: true });
    interCtx.imageSmoothingEnabled = true; interCtx.imageSmoothingQuality = "high";
    const grab = (fn) => { finalCtx.clearRect(0, 0, FW, FH); fn(); return finalCtx.getImageData(0, 0, FW, FH).data; };
    v.pause();
    await seekTo(1.0);
    await new Promise((r) => setTimeout(r, 150));
    const dOFF = grab(() => { finalCtx.drawImage(v, 0, 0, FW, FH); });
    const dA = grab(() => { interCtx.clearRect(0, 0, FW, HH); interCtx.drawImage(v, 0, 0, FW, HH); finalCtx.drawImage(interC, 0, 0, FW, FH); });
    const dA2 = grab(() => { interCtx.clearRect(0, 0, FW, HH); interCtx.drawImage(v, 0, 0, FW, HH); finalCtx.drawImage(interC, 0, 0, FW, FH); });
    const dB = grab(() => { heldCtx.clearRect(0, 0, FW, FH); heldCtx.drawImage(v, 0, 0, FW, FH); interCtx.clearRect(0, 0, FW, HH); interCtx.drawImage(heldC, 0, 0, FW, HH); finalCtx.drawImage(interC, 0, 0, FW, FH); });
    // Held lệch frame: vẽ held từ t' rồi quay về 1.0s để vẽ inter→final.
    const stale = {};
    for (const [label, dt] of [["m1f", -1 / 60], ["p1f", 1 / 60], ["m6f", -6 / 60], ["p6f", 6 / 60], ["m05s", -0.5], ["p05s", 0.5]]) {
      await seekTo(1.0 + dt);
      await new Promise((r) => setTimeout(r, 120));
      heldCtx.clearRect(0, 0, FW, FH); heldCtx.drawImage(v, 0, 0, FW, FH);
      await seekTo(1.0);
      await new Promise((r) => setTimeout(r, 120));
      const dS = grab(() => { interCtx.clearRect(0, 0, FW, HH); interCtx.drawImage(heldC, 0, 0, FW, HH); finalCtx.drawImage(interC, 0, 0, FW, FH); });
      stale[label] = { madVsA: madVs(dS, dA), madVsOFF: madVs(dS, dOFF), R: metrics(dS, FW, FH) };
    }
    out.geometries[gname] = {
      FW, FH, HH,
      R: { OFF: metrics(dOFF, FW, FH), A: metrics(dA, FW, FH), B: metrics(dB, FW, FH) },
      madAvsOFF: madVs(dA, dOFF),
      madBvsOFF: madVs(dB, dOFF),
      madBvsA: madVs(dB, dA),
      madA2vsA: madVs(dA2, dA),
      stale,
    };
  }
  return out;
})()`;

let vite = null, xvfb = null, chrome = null;
async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const DEV_PORT = Number(process.env.H6_DEV_PORT || 0) || (await pickFreePort(5610, 5619));
  const DEBUG_PORT = Number(process.env.H6_DEBUG_PORT || 0) || (await pickFreePort(9710, 9719));
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 210; n <= 219; n++) {
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
  const DISPLAY = process.env.H6_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :210–:219");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5610–5619");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9710–9719");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["bbb-interlaced720.mp4", "bbb720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r80h6-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata-h6");
  const TMPDIR = "/tmp/round80-h6/tmp";
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
export default { server: { hmr: false }, plugins: [{ name: "h6-media", configureServer(server) {
  server.middlewares.use("/r80h6-media", serveDir(MEDIA_DIR));
} }] };
`);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, loadavg ${loadAvg()}`);
  const viteLogFd = fs.openSync(path.join(SCRATCH, "h6-vite.log"), "w");
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
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "h6-chrome.log"), "w");
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
    ["bbb-interlaced", MEDIA_URL("bbb-interlaced720.mp4")],
    ["bbb-clean", MEDIA_URL("bbb720.mp4")],
  ]) {
    log(`probe ${key} ... (loadavg ${loadAvg()})`);
    const r = await cdp.evalJs(PROBE_FN(url));
    results.probes[key] = r;
    for (const [gname, g] of Object.entries(r.geometries)) {
      log(`  ${key} [${gname} ${g.FW}x${g.FH} inter ${g.FW}x${g.HH}]: R OFF=${g.R.OFF.ratio} A=${g.R.A.ratio} B=${g.R.B.ratio}`);
      log(`  ${key} [${gname}]: MAD A vs OFF=${g.madAvsOFF.mad} | B vs OFF=${g.madBvsOFF.mad} | B vs A=${g.madBvsA.mad} (max ${g.madBvsA.max}, R/G/B ${g.madBvsA.madR}/${g.madBvsA.madG}/${g.madBvsA.madB}) | A2 vs A=${g.madA2vsA.mad}`);
      for (const [label, s] of Object.entries(g.stale)) {
        log(`  ${key} [${gname}] stale ${label}: MAD vs A=${s.madVsA.mad} | MAD vs OFF=${s.madVsOFF.mad} | R=${s.R.ratio}`);
      }
    }
  }
  writeFileEpermRetry(path.join(SCRATCH, "probe-80h6-bbb-sameframe.json"), JSON.stringify(results, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "probe-80h6-bbb-sameframe.log"), logLines.join("\n") + "\n");
  log("probe xong — JSON: hidden_files/round80-h6/probe/probe-80h6-bbb-sameframe.json");
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e.stack || e}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-80h6-bbb-sameframe.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
  process.exitCode = 1;
}).finally(() => {
  try { chrome?.kill(); } catch {}
  try { xvfb?.kill(); } catch {}
  try { vite?.kill(); } catch {}
});
