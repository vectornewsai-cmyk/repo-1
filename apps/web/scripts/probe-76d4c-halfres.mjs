// probe-76d4c-halfres.mjs — đợt 76 D4: phương án "half-res intermediate"
// sau khi probe-b chứng minh inline-shift chỉ có tác dụng ở s≈1.0 và
// SVG filter tốn 7× thông lượng. Ý tưởng: khi chỉ có deint, vẽ video
// xuống canvas trung gian dw×(dh/2) (downscale dọc 2× — mỗi hàng đích
// đã là trung bình ~2 hàng nguồn, tức khử xen kẽ), rồi vẽ canvas đó
// lên khổ đích dw×dh. Vẫn 2 lần vẽ nhưng lần 1 chỉ 1/4 pixel và lần 2
// lấy mẫu từ canvas (rẻ hơn lấy mẫu từ video). Đo R + thông lượng
// (ms/draw) so với vẽ thường ở s ∈ {1.0, 1.13, 1.5} trên interlaced720
// + clean720. Nếu R ~0.54–0.67 và chi phí ≤1.33× (FPS ≥0.75×) thì nối
// vào preview.tsx thay cho inline-shift (xem LIMITS §3).
// Chạy: node apps/web/scripts/probe-76d4c-halfres.mjs
// Env: D4_DEV_PORT (5550–5559), D4_DEBUG_PORT (9650–9659), D4_DISPLAY
// (:180–:189), D4_SCRATCH (mặc định hidden_files/round76-d4).
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
const SCRATCH = process.env.D4_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round76-d4");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round76-d4";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.d4c.config.mjs");
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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 60s: ${method}`)); }, 60000);
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
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.innerHTML = '<defs>'
    + '<filter id="d4bf08" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0 0.8"/></filter>'
    + '</defs>';
  document.body.appendChild(svg);
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
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
    for (let y = y0; y < y1 - 1; y += 2) for (let x = x0; x < x1; x += 2) {
      vg += Math.abs(lum(x, y) - lum(x, y + 1)); vn++;
    }
    return { ratio: +((cross / n) / Math.max(same / n, 0.001)).toFixed(2),
      vgrad: +((vg / vn).toFixed(3)) };
  };
  // Canvas theo tỉ lệ vẽ s: khổ đích 1280*s x 720*s, video vẽ full khổ.
  // inline-shift: lệch dọc +0.5*s px đích (= +0.5 đơn vị project, đúng
  // như deintInlineDy trong preview.tsx khi viewport scale = s).
  function drawAt(s, mode) {
    const W = Math.round(1280 * s), H = Math.round(720 * s);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, W, H);
    if (mode === "noop") { ctx.drawImage(v, 0, 0, W, H); }
    else if (mode === "shift") { ctx.drawImage(v, 0, 0.5 * s, W, H); }
    else if (mode === "svg08") { ctx.filter = "url(#d4bf08)"; ctx.drawImage(v, 0, 0, W, H); ctx.filter = "none"; }
    else if (mode === "half") {
      const hw = W, hh = Math.max(2, Math.round(H / 2));
      const hc = document.createElement("canvas"); hc.width = hw; hc.height = hh;
      const hctx = hc.getContext("2d", { willReadFrequently: true });
      hctx.drawImage(v, 0, 0, hw, hh);
      ctx.drawImage(hc, 0, 0, W, H);
    }
    else throw new Error("mode lạ " + mode);
    return metrics(ctx.getImageData(0, 0, W, H).data, W, H);
  }
  // Thông lượng: lặp 60 lần vẽ cùng frame (đã seek đứng yên), đo ms/draw.
  function throughput(s, mode) {
    const W = Math.round(1280 * s), H = Math.round(720 * s);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const N = 60;
    const hc = document.createElement("canvas"); hc.width = W; hc.height = Math.max(2, Math.round(H / 2));
    const hctx = hc.getContext("2d", { willReadFrequently: true });
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      ctx.clearRect(0, 0, W, H);
      if (mode === "noop") { ctx.drawImage(v, 0, 0, W, H); }
      else if (mode === "shift") { ctx.drawImage(v, 0, 0.5 * s, W, H); }
      else if (mode === "svg08") { ctx.filter = "url(#d4bf08)"; ctx.drawImage(v, 0, 0, W, H); ctx.filter = "none"; }
      else if (mode === "half") { hctx.clearRect(0, 0, hc.width, hc.height); hctx.drawImage(v, 0, 0, hc.width, hc.height); ctx.drawImage(hc, 0, 0, W, H); }
    }
    return +(((performance.now() - t0) / N).toFixed(2));
  }
  const SCALES = [1.0, 1.13, 1.5];
  const out = { video: ${JSON.stringify(videoUrl)}, scales: [] };
  for (const t of [1.0]) {
    await new Promise((res) => { v.onseeked = res; v.currentTime = t; });
    await new Promise((r) => setTimeout(r, 150));
    for (const s of SCALES) {
      out.scales.push({ s, noop: drawAt(s, "noop").ratio, shift: drawAt(s, "shift").ratio, svg08: drawAt(s, "svg08").ratio, half: drawAt(s, "half").ratio, vgradNoop: drawAt(s, "noop").vgrad, vgradHalf: drawAt(s, "half").vgrad });
    }
  }
  // Throughput ở s = 1.13 (khổ headed D4) + 1.0, mỗi mode 2 lần lặp.
  out.throughput = [];
  for (const s of [1.0, 1.13]) {
    const row = { s };
    for (const mode of ["noop", "shift", "svg08", "half"]) {
      const a = throughput(s, mode), b = throughput(s, mode);
      row[mode] = { run1: a, run2: b, mean: +(((a + b) / 2).toFixed(2)) };
    }
    out.throughput.push(row);
  }
  return out;
})()`;

let vite = null, xvfb = null, chrome = null;
async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const DEV_PORT = Number(process.env.D4_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
  const DEBUG_PORT = Number(process.env.D4_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
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
  const DISPLAY = process.env.D4_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const MEDIA_URL = (f) => `${DEV_URL}r76d4c-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata-c");
  const TMPDIR = "/tmp/round76-d4/tmp";
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
export default { server: { hmr: false }, plugins: [{ name: "d4c-media", configureServer(server) {
  server.middlewares.use("/r76d4c-media", serveDir(MEDIA_DIR));
} }] };
`);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, loadavg ${loadAvg()}`);
  const viteLogFd = fs.openSync(path.join(SCRATCH, "d4c-vite.log"), "w");
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
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "d4c-chrome.log"), "w");
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
    log(`probe ${key} ... (loadavg ${loadAvg()})`);
    results.probes[key] = await cdp.evalJs(PROBE_FN(url));
    const p = results.probes[key];
    for (const row of p.scales) {
      log(`  ${key} s=${row.s}: noop ${row.noop} | shift(inline) ${row.shift} | svg08 ${row.svg08} | half ${row.half} | vgrad noop ${row.vgradNoop} → half ${row.vgradHalf} (${(100 * row.vgradHalf / row.vgradNoop).toFixed(0)}% giữ)`);
    }
    for (const row of p.throughput) {
      const ratio = (m) => row.noop.mean > 0 ? +(row[m].mean / row.noop.mean).toFixed(2) : null;
      log(`  ${key} throughput s=${row.s}: noop ${row.noop.mean} ms/draw | shift ${row.shift.mean} (${ratio("shift")}x) | svg08 ${row.svg08.mean} (${ratio("svg08")}x) | half ${row.half.mean} (${ratio("half")}x)`);
    }
  }
  writeFileEpermRetry(path.join(SCRATCH, "probe-76d4c-halfres.json"), JSON.stringify(results, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "probe-76d4c-halfres.log"), logLines.join("\n") + "\n");
  log("probe xong — JSON: hidden_files/round76-d4/probe-76d4c-halfres.json");
}

main().catch((e) => {
  console.error(`HARNESS LỖI: ${e.stack || e}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "probe-76d4c-halfres.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
  process.exitCode = 1;
}).finally(() => {
  try { chrome?.kill(); } catch {}
  try { xvfb?.kill(); } catch {}
  try { vite?.kill(); } catch {}
});
