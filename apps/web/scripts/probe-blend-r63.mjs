#!/usr/bin/env node
/**
 * probe-blend-r63.mjs — ĐO cho R3 đợt 63: cải thiện đường cong blend.
 *
 * Nợ đợt 62 R3 (§2.2 LIMITS): blend tuyến tính a=s overstate ở s=0.3
 * (+9.9 so với hqdn3d) và trên nhiễu nặng flat40 (-84.7% vs hqdn3d
 * -26.7% ở s=1.0); step-edge vẫn 4px ở a≥0.8.
 *
 * Các biến thể thử (đo cùng metric đợt 62: giảm std RGB mean vùng trung
 * tâm + step-edge 25–75%):
 *   V0 linear:     a = s, B = 3.0 (đối chứng, tái tạo số đợt 62)
 *   V1 pow1.25:    a = s^1.25, B = 3.0
 *   V2 pow1.5:     a = s^1.5, B = 3.0
 *   V3 piecewise:  a nội suy tuyến tính qua (0,0),(0.3,0.195),(0.5,0.486),
 *                  (0.8,0.806),(1,0.981) — a cần để khớp đúng 4 mốc flat15
 *                  720p đợt 62 (xem LIMITS §2.2)
 *   V4 thresh T:   blend có ngưỡng theo độ lệch pixel (per-pixel JS, chỉ
 *                  để đo trần chất lượng): w_c = a·max(0, 1-|blur-orig|/T),
 *                  T ∈ {12, 24, 40}; lệch lớn (cạnh) → giữ gốc, lệch nhỏ
 *                  (nhiễu) → blend mạnh. B = 3.0.
 *   V5 taper10:    a = s, B(a) = 3.0 - 1.0·a (3.0 → 2.0)
 *   V6 taper15:    a = s, B(a) = 3.0 - 1.5·a (3.0 → 1.5)
 *   V7 dual:       a = s, composite = (1-a)·gốc + a·(0.5·blur1.5+0.5·blur3)
 *   V8 thresh24+piecewise: V4 T=24 với a piecewise (chỉ khi V3/V4 hứa hẹn)
 *
 * Mục tiêu hqdn3d: flat15 -19/-47/-74/-83% @ s=0.3/0.5/0.8/1.0;
 * flat40: s=0.5 -5.0%, s=1.0 -26.7% (chỉ có PNG hq40 ở 2 mức đó).
 *
 * Chạy: node apps/web/scripts/probe-blend-r63.mjs (từ gốc repo).
 * Media: ~/workspace/.scratch-r61r3-1cOf/media (đợt 61, dùng lại).
 * KHÔNG sửa code sản phẩm, KHÔNG push.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MEDIA_DIR = "/home/hatch/workspace/.scratch-r61r3-1cOf/media";
// Đợt 63 R3: chromium-1248 biến mất khỏi cache 08/11 (giữa 2 lần chạy);
// tìm mọi bản chromium-* còn trong cache, ưu tiên bản mới nhất
// (lúc viết: chromium-1254, Chrome 158). V0 linear đo lại làm đối chứng
// nên mọi lệch phiên bản (nếu có) đều nhìn thấy được khi so số đợt 62.
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
if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright (cần npx playwright install chromium)");
const PROFILE = "/tmp/round63-r3/probe-profile";
// Đợt 63 R3: display cố định :178 chết vì socket X mồ côi từ lượt trước
// (Xvfb không bind được) — quét display trống như fps-cal (gọi trong
// main() vì log() khai báo sau).
let DISPLAY = null;
async function pickDisplay() {
  const { execSync } = await import("node:child_process");
  for (let n = 170; n <= 179; n++) {
    const d = `:${n}`;
    const sock = `/tmp/.X11-unix/X${n}`;
    if (fs.existsSync(sock)) {
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) continue;
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    return d;
  }
  return null;
}
const OUT_DIR = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round63-r3");
const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);

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
    this.nextId = 1; this.pending = new Map();
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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`timeout: ${method}`)); }, 120000);
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

const PROBE_FN = (imgUrl, targetW, targetH, heavy) => `(async () => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("không tải được ảnh")); img.src = ${JSON.stringify(imgUrl)}; });
  const W = ${JSON.stringify(targetW)}, H = ${JSON.stringify(targetH)};
  const HEAVY = ${JSON.stringify(heavy)};
  const base = document.createElement("canvas"); base.width = W; base.height = H;
  const bctx = base.getContext("2d", { willReadFrequently: true });
  bctx.drawImage(img, 0, 0, W, H);
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const step = 2;
  const stats = (data) => {
    let n = 0; const sum = [0, 0, 0]; const sq = [0, 0, 0];
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) { const v = data[i + c]; sum[c] += v; sq[c] += v * v; }
      n++;
    }
    const std = [0, 1, 2].map((c) => Math.sqrt(Math.max(0, sq[c] / n - (sum[c] / n) ** 2)));
    return { stdMean: (std[0] + std[1] + std[2]) / 3 };
  };
  const edgeSrc = document.createElement("canvas"); edgeSrc.width = W; edgeSrc.height = H;
  const e0 = edgeSrc.getContext("2d");
  e0.fillStyle = "#000"; e0.fillRect(0, 0, W / 2, H);
  e0.fillStyle = "#fff"; e0.fillRect(W / 2, 0, W, H);
  const edgeWidthOf = (canvas) => {
    const y = Math.floor(H / 2);
    const data = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, y, W, 1).data;
    const v = (x) => data[x * 4];
    let x25 = -1, x75 = -1;
    for (let x = 0; x < W; x++) { if (x25 < 0 && v(x) >= 64) x25 = x; if (x75 < 0 && v(x) >= 192) x75 = x; }
    return (x25 >= 0 && x75 >= 0) ? x75 - x25 : -1;
  };
  const blurCanvas = (src, B) => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true });
    if (B > 0) x.filter = \`blur(\${B}px)\`;
    x.drawImage(src, 0, 0);
    x.filter = "none";
    return c;
  };
  // Composite canvas thuần (không per-pixel): (1-a)*src + a*blur(B).
  const applyBlend = (src, B, a) => {
    const blurred = blurCanvas(src, B);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const ox = out.getContext("2d", { willReadFrequently: true });
    ox.drawImage(src, 0, 0);
    ox.globalAlpha = a;
    ox.drawImage(blurred, 0, 0);
    ox.globalAlpha = 1;
    return out;
  };
  // Dual-radius: (1-a)*src + a*(0.5*blur1.5 + 0.5*blur3).
  const applyDual = (src, a) => {
    const b15 = blurCanvas(src, 1.5), b30 = blurCanvas(src, 3.0);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const ox = out.getContext("2d", { willReadFrequently: true });
    ox.drawImage(src, 0, 0);
    ox.globalAlpha = a * 0.5; ox.drawImage(b15, 0, 0);
    ox.globalAlpha = a * 0.5; ox.drawImage(b30, 0, 0);
    ox.globalAlpha = 1;
    return out;
  };
  // Blend có ngưỡng theo độ lệch pixel (per-pixel JS — chỉ đo trần chất
  // lượng, chưa phải code sản phẩm): w_c = a * max(0, 1 - |blur-orig|/T).
  const applyThresh = (src, B, a, T) => {
    const blurred = blurCanvas(src, B);
    const sctx = src.getContext("2d", { willReadFrequently: true });
    const bx = blurred.getContext("2d", { willReadFrequently: true });
    const sd = sctx.getImageData(0, 0, W, H).data;
    const bd = bx.getImageData(0, 0, W, H).data;
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const ox = out.getContext("2d", { willReadFrequently: true });
    const od = ox.createImageData(W, H);
    const o = od.data;
    for (let i = 0; i < sd.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const d = bd[i + c] - sd[i + c];
        const w = a * Math.max(0, 1 - Math.abs(d) / T);
        o[i + c] = sd[i + c] + w * d;
      }
      o[i + 3] = 255;
    }
    ox.putImageData(od, 0, 0);
    return out;
  };
  const piecewise = (s) => {
    const pts = [[0, 0], [0.3, 0.195], [0.5, 0.486], [0.8, 0.806], [1, 0.981]];
    for (let i = 1; i < pts.length; i++) {
      if (s <= pts[i][0]) {
        const [x0p, y0p] = pts[i - 1], [x1p, y1p] = pts[i];
        return y0p + ((s - x0p) / (x1p - x0p)) * (y1p - y0p);
      }
    }
    return 0.981;
  };
  const measure = (canvas) => {
    const data = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const s = stats(data);
    return +(((baseStats.stdMean - s.stdMean) / baseStats.stdMean) * 100).toFixed(1);
  };
  const baseData = bctx.getImageData(0, 0, W, H).data;
  const baseStats = stats(baseData);
  const S = [0.3, 0.5, 0.8, 1.0];
  const out = { base: +baseStats.stdMean.toFixed(3), edgeBase: edgeWidthOf(edgeSrc), variants: {} };
  const runVariant = (name, fn) => {
    const rows = [];
    for (const s of S) {
      const c = fn(base, s);
      const e = fn(edgeSrc, s);
      rows.push({ s, reduct: measure(c), edge: edgeWidthOf(e) });
    }
    out.variants[name] = rows;
  };
  runVariant("V0-linear", (src, s) => applyBlend(src, 3.0, s));
  runVariant("V1-pow1.25", (src, s) => applyBlend(src, 3.0, Math.pow(s, 1.25)));
  runVariant("V2-pow1.5", (src, s) => applyBlend(src, 3.0, Math.pow(s, 1.5)));
  runVariant("V3-piecewise", (src, s) => applyBlend(src, 3.0, piecewise(s)));
  runVariant("V5-taper10", (src, s) => applyBlend(src, 3.0 - 1.0 * s, s));
  runVariant("V6-taper15", (src, s) => applyBlend(src, 3.0 - 1.5 * s, s));
  runVariant("V7-dual", (src, s) => applyDual(src, s));
  if (HEAVY) {
    for (const T of [12, 24, 40]) runVariant("V4-threshT" + T, (src, s) => applyThresh(src, 3.0, s, T));
    runVariant("V8-thresh24-piecewise", (src, s) => applyThresh(src, 3.0, piecewise(s), 24));
  }
  return out;
})()`;

// hqdn3d cùng metric: std của frame hq so với frame gốc cùng loại.
const HQ_FN = (origUrl, hqUrl) => `(async () => {
  const load = (u) => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => rej(new Error("không tải " + u)); im.src = u; });
  const [o, h] = [await load(${JSON.stringify(origUrl)}), await load(${JSON.stringify(hqUrl)})];
  const W = o.naturalWidth, H = o.naturalHeight;
  const stdOf = (im) => {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(im, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
    let n = 0; const sum = [0, 0, 0]; const sq = [0, 0, 0];
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
      const i = (y * W + x) * 4;
      for (let cc = 0; cc < 3; cc++) { const v = d[i + cc]; sum[cc] += v; sq[cc] += v * v; }
      n++;
    }
    const std = [0, 1, 2].map((cc) => Math.sqrt(Math.max(0, sq[cc] / n - (sum[cc] / n) ** 2)));
    return (std[0] + std[1] + std[2]) / 3;
  };
  const b = stdOf(o), hq = stdOf(h);
  return { base: +b.toFixed(3), hq: +hq.toFixed(3), reduct: +(((b - hq) / b) * 100).toFixed(1) };
})()`;

async function main() {
  let server = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  };
  process.on("exit", killAll);
  try {
    DISPLAY = await pickDisplay();
    if (!DISPLAY) throw new Error("hết display trống :170–:179");
    const PORT = await pickFreePort(5790, 5799);
    const DEBUG_PORT = await pickFreePort(9660, 9669);
    if (!PORT || !DEBUG_PORT) throw new Error("hết cổng trống");
    server = http.createServer((req, res) => {
      const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\//, "");
      const fp = path.join(MEDIA_DIR, name);
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (!name || name.includes("..") || !fs.existsSync(fp)) { res.statusCode = 404; res.end("nf"); return; }
      res.setHeader("Content-Type", name.endsWith(".png") ? "image/png" : "video/mp4");
      fs.createReadStream(fp).pipe(res);
    });
    await new Promise((res) => server.listen(PORT, "127.0.0.1", res));
    log(`http :${PORT}, debug :${DEBUG_PORT}, display ${DISPLAY}, media ${MEDIA_DIR}, load ${fs.readFileSync("/proc/loadavg", "utf8").trim()}`);
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    // Đợt 63 R3: sleep cố định 900ms không đủ khi VM tải cao (Xvfb chưa
    // bind socket đã spawn Chrome → Chrome chết, CDP không bao giờ lên).
    // Chờ socket X xuất hiện thật (tối đa 15s).
    {
      const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) {
        if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
        else await sleep(500);
      }
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s (socket ${sock} chưa có)`);
      log(`Xvfb ${DISPLAY} đã lên (socket ${sock})`);
    }
    fs.mkdirSync("/tmp/round63-r3/tmp", { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: "ignore", env: { ...process.env, DISPLAY, TMPDIR: "/tmp/round63-r3/tmp" } });
    let pageTarget = null;
    for (let i = 0; i < 120 && !pageTarget; i++) {
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
    const out = {};
    const sets = [
      ["frame15-720p", `http://127.0.0.1:${PORT}/frame15.png`, 1280, 720, true],
      ["frame40-720p", `http://127.0.0.1:${PORT}/frame40.png`, 1280, 720, true],
      ["frame15-preview", `http://127.0.0.1:${PORT}/frame15.png`, 488, 275, false],
      ["frame40-preview", `http://127.0.0.1:${PORT}/frame40.png`, 488, 275, false],
    ];
    for (const [name, url, W, H, heavy] of sets) {
      const t0 = Date.now();
      const r = await cdp.evalJs(PROBE_FN(url, W, H, heavy));
      out[name] = r;
      log(`== ${name} base std ${r.base}, edge gốc ${r.edgeBase}px (${((Date.now() - t0) / 1000).toFixed(1)}s) ==`);
      for (const [vn, rows] of Object.entries(r.variants)) {
        log(`  ${vn}: ` + rows.map((x) => `s=${x.s}→-${x.reduct}% edge ${x.edge}px`).join(", "));
      }
    }
    // hqdn3d đối chứng cùng metric.
    out.hqdn3d = {};
    for (const [key, orig, hq] of [
      ["flat15-s0.3", "frame15.png", "hq15_0.3.png"],
      ["flat15-s0.5", "frame15.png", "hq15_0.5.png"],
      ["flat15-s0.8", "frame15.png", "hq15_0.8.png"],
      ["flat15-s1.0", "frame15.png", "hq15_1.0.png"],
      ["flat40-s0.5", "frame40.png", "hq40_0.5.png"],
      ["flat40-s1.0", "frame40.png", "hq40_1.0.png"],
    ]) {
      const r = await cdp.evalJs(HQ_FN(`http://127.0.0.1:${PORT}/${orig}`, `http://127.0.0.1:${PORT}/${hq}`));
      out.hqdn3d[key] = r;
      log(`HQDN3D ${key}: base ${r.base} → hq ${r.hq} (giảm ${r.reduct}%)`);
    }
    // Lặp lại 1 lần 2 biến thể hứa hẹn nhất (kiểm tra ổn định số).
    const r2 = await cdp.evalJs(PROBE_FN(`http://127.0.0.1:${PORT}/frame15.png`, 1280, 720, true));
    const rep = {};
    for (const vn of ["V0-linear", "V3-piecewise", "V4-threshT24", "V8-thresh24-piecewise"]) rep[vn] = r2.variants[vn];
    out.repeat15 = rep;
    log("lặp lại frame15-720p: " + Object.entries(rep).map(([vn, rows]) => `${vn}: ` + rows.map((x) => `s=${x.s}→-${x.reduct}% e${x.edge}`).join(", ")).join(" | "));
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, "blend-r63-probe.json"), JSON.stringify(out, null, 2));
    log("xong, đã ghi blend-r63-probe.json");
    process.exitCode = 0;
  } catch (e) {
    log(`PROBE LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}
main();
