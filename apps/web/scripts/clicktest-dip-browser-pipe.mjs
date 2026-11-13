#!/usr/bin/env node
/**
 * clicktest-dip-browser-pipe.mjs — Phase 9 đợt 27, luồng K3:
 * pixel-test nhánh dip J3 (đợt 26) trên browser thật — nợ #3 của đợt 26.
 *
 * J3 nối canvas dip cho fadewhite/fadegrays (drawVideoClipWithDip trong
 * preview.tsx, model singleClipDipPixel) nhưng chỉ khóa bằng unit test +
 * harness Node; đường dây component (strip transition -> offscreen ->
 * getImageData -> putImageData -> drawImage lên canvas chính) chưa từng
 * được pixel-test trên browser thật. Harness này đóng đúng nợ đó.
 *
 * KHÔNG Playwright. Kế thừa mẫu pipe CDP của đợt 26 J6
 * (clicktest-split-intermediate-pipe.mjs): Chrome headed dưới Xvfb qua
 * --remote-debugging-pipe, click ruler thật bằng Input.dispatchMouseEvent,
 * seed qua autosave, snapshot dist tại thời điểm bắt đầu (không phục vụ
 * dist trực tiếp để khỏi đua với các luồng khác đang build lại).
 *
 * Phương pháp đo (quan trọng — đọc trước khi tranh luận về số):
 * - Seed 1 track, 5 clip phẳng/tĩnh (xem seedSpec): mỗi clip mang
 *   transitionIn/Out fadewhite/fadegrays duration 1s. Tại 1 thời điểm
 *   trong cửa sổ transition chỉ có đúng 1 clip được vẽ (clip kề đã
 *   hết / chưa tới), nên frame canvas tại đó CHÍNH LÀ đầu ra của
 *   nhánh dip đơn clip — đúng đối tượng J3 cần khóa.
 * - Playhead sau scrub được store snap về frame 30fps (setPlayhead),
 *   nên p tính từ playhead dự đoán theo tọa độ click (x click nguyên
 *   + rulerLeft đo trước click) là chính xác tới 1 frame; vạch
 *   .tl-playhead-handle đọc độc lập để đối chiếu (lệch > 1 frame thì
 *   case bị gắn cờ measurement-uncertain, không tính fail cho app).
 * - Pixel kỳ vọng KHÔNG lấy từ màu danh nghĩa: video control độc lập
 *   (cùng file, qua static server) được seek tới cùng source time,
 *   vẽ contain-fit lên canvas riêng, rồi áp CHÍNH công thức
 *   singleClipDipPixel + trọng số fadeDipWeights (cài lại trong
 *   harness từ code app — xem LIMITS: công thức là model chung đã
 *   khóa bởi unit test J3; cái browser-test này khóa là đường dây
 *   wiring: dipMode routing, alpha chọn theo cửa sổ, strip transition,
 *   offscreen composite, vùng clip). Nhờ control mà sai số roundtrip
 *   codec (yuv420p) không lọt vào verdict.
 * - Verdict theo thang V6 của dự án: KHỚP = MAD <= 2 VÀ >= 99% pixel
 *   lệch <= 8; XẤP XỈ = MAD <= 20 VÀ >= 90% <= 8; còn lại LỆCH.
 * - Perf: probe PerformanceObserver longtask quanh scrub tới frame dip
 *   vs frame thường (xem LIMITS: longtask gồm cả seek/decode/rAF nên
 *   chỉ là cận trên, không phải thời gian thuần của vòng lặp dip).
 *
 * Thoát mã: 0 = mọi case chính (phẳng + gradient tĩnh) KHỚP; 1 = có
 * case chính không KHỚP; 2 = blocker hạ tầng. Case footage thật
 * (nếu tải được) chỉ mang tính thông tin, không gating exit code
 * (frame moving footage có thể lệch 1 frame seek — ghi rõ trong JSON).
 * Kết quả JSON: benchmarks/results/v27-k3-canvas-dip-browser.json
 * (parent quyết có stage hay không). Không sửa code sản phẩm trừ khi
 * phát hiện lỗi wiring rõ ràng (ghi rõ trong LIMITS + báo cáo).
 * Scratch đo nằm ở ~/workspace/tmp-round27-k3/ và được dọn cuối lượt
 * (trừ file JSON kết quả trong repo).
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-dip-browser-pipe.mjs
 * Biến môi trường: K3_DISPLAY (mặc định :98), K3_PORT (mặc định 4198),
 * K3_RUN_LABEL, K3_SKIP_REAL_FOOTAGE=1 (bỏ qua bước tải footage thật).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round27-k3");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.K3_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.K3_DISPLAY || ":98";
const PORT = Number(process.env.K3_PORT || 4198);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.K3_RUN_LABEL || "run1";
const SKIP_REAL = process.env.K3_SKIP_REAL_FOOTAGE === "1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) {
  const line = `[${stamp()}] ${a.join(" ")}`;
  logLines.push(line);
  console.log(line);
}

// ------------------------------------------------------------- CDP pipe --
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.exceptions = [];
    this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg;
        try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) {
          this.sessionId = msg.params.sessionId;
        }
        if (msg.method === "Runtime.exceptionThrown" && msg.params?.exceptionDetails) {
          this.exceptions.push({ at: new Date().toISOString(), text: JSON.stringify(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text ?? "exception").slice(0, 800) });
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) {
      try { proc.stdio[s]?.on("error", () => {}); } catch {}
    }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: path.join(SCRATCH, "cdp-hang-snapshots"), bundle: HANG_BUNDLE,
            extra: { display: DISPLAY, port: PORT },
          });
          if (hangSnap.file) log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        reject(new Error(`CDP timeout ${method} sau ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression, timeoutMs = 120000) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    }
    return r.result.value;
  }
  async clickRect(rect) {
    const x = Math.round(rect.x + rect.width / 2);
    const y = Math.round(rect.y + rect.height / 2);
    try {
      await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }, this.sessionId, 15000);
      return { method: "cdp-input", x, y };
    } catch (e) {
      log(`  Input.dispatchMouseEvent lỗi (${e.message}), fallback element.click()`);
      return { method: "js-click-fallback", x, y };
    }
  }
}

async function waitFor(cdp, expr, label, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await cdp.evaluate(expr, 15000)) return true; } catch {}
    await sleep(500);
  }
  throw new Error(`hết ${timeoutMs}ms chờ: ${label}`);
}

function findRect(cdp, finderJs) {
  return cdp.evaluate(`(() => {
    const el = (${finderJs});
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
}

async function realClick(cdp, finderJs) {
  const rect = await findRect(cdp, finderJs);
  if (!rect) throw new Error(`không tìm được element: ${finderJs.slice(0, 160)}`);
  const res = await cdp.clickRect(rect);
  if (res.method === "js-click-fallback") await cdp.evaluate(`(${finderJs}).click()`);
  await sleep(600);
  return res.method;
}

// ------------------------------------------------------------- infra -----
function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      let alive = false;
      try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
      if (alive) { log(`Xvfb: dùng chung display ${DISPLAY} (tiến trình còn sống)`); resolve(null); return; }
      log(`Xvfb: socket ${sock} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
    }
    const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    (async () => {
      for (let i = 0; i < 40; i++) {
        if (fs.existsSync(sock)) { log(`Xvfb lên: DISPLAY=${DISPLAY}`); resolve(xvfb); return; }
        await sleep(250);
      }
      reject(new Error(`Xvfb không tạo socket ${sock}`));
    })();
  });
}

function snapshotDist() {
  const distDir = path.join(WEB_DIR, "dist");
  const indexHtml = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtml)) { log("BLOCKER dist: không có apps/web/dist/index.html"); return null; }
  const assetsDir = path.join(distDir, "assets");
  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  // Gate J3: bundle phải chứa dipMode (code nhánh dip đợt 26) — nếu dist
  // cũ hơn J3 thì dừng, không đo nhầm bản cũ (đường đen cũ sẽ cho
  // trắng->đen và fail giả).
  const bundlePath = jsFiles.map((f) => path.join(assetsDir, f))
    .find((p) => fs.readFileSync(p, "utf8").includes("dipMode"));
  if (!bundlePath) {
    log("BLOCKER dist: không bundle nào chứa 'dipMode' (dist cũ hơn code J3?)");
    return null;
  }
  const sha = crypto.createHash("sha256").update(fs.readFileSync(bundlePath)).digest("hex").slice(0, 16);
  const snapDir = path.join(SCRATCH, "dist-snapshot");
  fs.rmSync(snapDir, { recursive: true, force: true });
  fs.cpSync(distDir, snapDir, { recursive: true });
  log(`dist snapshot OK: bundle ${path.basename(bundlePath)} sha256[:16]=${sha} -> ${snapDir}`);
  return { bundle: path.basename(bundlePath), sha, dir: snapDir };
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webm": "video/webm", ".mp4": "video/mp4", ".wasm": "application/wasm" };
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
        let file = path.join(rootDir, urlPath === "/" ? "index.html" : urlPath);
        if (!file.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(rootDir, "index.html");
        const ext = path.extname(file);
        const type = mime[ext] || "application/octet-stream";
        const size = fs.statSync(file).size;
        const range = req.headers.range;
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range);
          if (m) {
            const start = m[1] ? Number(m[1]) : 0;
            const end = m[2] ? Number(m[2]) : size - 1;
            if (start >= size || end >= size || start > end) {
              res.writeHead(416, { "Content-Range": `bytes */${size}` }); res.end(); return;
            }
            res.writeHead(206, {
              "Content-Type": type, "Accept-Ranges": "bytes",
              "Content-Range": `bytes ${start}-${end}/${size}`,
              "Content-Length": end - start + 1,
            });
            fs.createReadStream(file, { start, end }).pipe(res);
            return;
          }
        }
        res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
        fs.createReadStream(file).pipe(res);
      } catch { res.writeHead(500); res.end(); }
    });
    server.listen(PORT, "127.0.0.1", () => { log(`static server lên tại ${ORIGIN} (root ${rootDir})`); resolve(server); });
    server.on("error", (e) => { log(`static server lỗi: ${e.message}`); resolve(null); });
  });
}

async function startChrome(cdpHolder) {
  for (const bin of BINARIES) {
    if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "k3-pipe-"));
    const chrome = spawn(bin, [
      "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
      "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank",
    ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => {});
    try {
      const cdp = new PipeCdp(chrome);
      await cdp.send("Target.getTargets", {}, undefined, 30000);
      const target = await cdp.send("Target.createTarget", { url: "about:blank" });
      await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
      for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
      if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
      await cdp.send("Page.enable", {}, cdp.sessionId);
      await cdp.send("Runtime.enable", {}, cdp.sessionId);
      await cdp.send("DOM.enable", {}, cdp.sessionId);
      log(`pipe OK (${bin})`);
      cdpHolder.chrome = chrome;
      cdpHolder.profile = profile;
      return cdp;
    } catch (e) {
      log(`BLOCKER-PIPE ${bin}: ${e.message}`);
      try { chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  }
  return null;
}

// ------------------------------------------------------------- videos ----
function runCmd(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) {
    log(`ffmpeg lỗi (${label}): ${(r.stderr || "").slice(-300)}`);
    return false;
  }
  return true;
}

function genVideos() {
  const vidDir = path.join(SCRATCH, "videos");
  fs.mkdirSync(vidDir, { recursive: true });
  const flats = [
    { file: "flat-red.mp4", hex: "0xFF0000" },
    { file: "flat-green.mp4", hex: "0x00FF00" },
    { file: "flat-magenta.mp4", hex: "0xFF00FF" },
    { file: "flat-custom.mp4", hex: "0xC76331" },
  ];
  for (const f of flats) {
    const out = path.join(vidDir, f.file);
    if (!fs.existsSync(out)) {
      const ok = runCmd("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
        "-i", `color=c=${f.hex}:s=1280x720:r=30:d=6`,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", out], f.file);
      if (!ok) return null;
    }
    log(`video phẳng OK: ${f.file} (${fs.statSync(out).size} byte)`);
  }
  // Gradient tĩnh (footage tổng hợp, không phụ thuộc thời gian): 1 frame
  // geq rồi loop thành video 6s. R theo x, G theo y, B theo đường chéo.
  const png = path.join(vidDir, "grad.png");
  const gradOut = path.join(vidDir, "grad-static.mp4");
  if (!fs.existsSync(gradOut)) {
    const ok1 = runCmd("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
      "-i", "nullsrc=s=1280x720", "-frames:v", "1",
      "-vf", "geq=r='X/W*255':g='Y/H*255':b='(X+Y)/(W+H)*255'", png], "grad.png");
    if (!ok1) return null;
    const ok2 = runCmd("ffmpeg", ["-y", "-v", "error", "-loop", "1", "-i", png,
      "-t", "6", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", gradOut], "grad-static.mp4");
    if (!ok2) return null;
  }
  log(`video gradient tĩnh OK: grad-static.mp4 (${fs.statSync(gradOut).size} byte)`);
  return vidDir;
}

// ------------------------------------------------------------- seeds -----
function videoClip(id, src, start, duration, extra = {}) {
  return { kind: "video", id, src, start, duration, in: 0, out: duration, ...extra };
}
function seedSpec() {
  return {
    version: "0.2.0",
    meta: { name: "K3 dip browser seed", width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "t-main", kind: "video", clips: [
        // Đỏ: ra fadewhite 1s (cửa sổ [3,4)).
        videoClip("c-red", "flat-red.mp4", 0, 4,
          { transitionOut: { type: "fadewhite", duration: 1 } }),
        // Xanh lá: vào fadewhite 1s [4,5), ra fadegrays 1s [7,8).
        videoClip("c-green", "flat-green.mp4", 4, 4,
          { transitionIn: { type: "fadewhite", duration: 1 }, transitionOut: { type: "fadegrays", duration: 1 } }),
        // Magenta: vào fadegrays 1s [8,9).
        videoClip("c-mag", "flat-magenta.mp4", 8, 4,
          { transitionIn: { type: "fadegrays", duration: 1 } }),
        // Custom (199,99,49): ra fadegrays 1s [15,16).
        videoClip("c-custom", "flat-custom.mp4", 12, 4,
          { transitionOut: { type: "fadegrays", duration: 1 } }),
        // Gradient tĩnh: vào fadewhite 1s [16,17), ra fadegrays 1s [19,20).
        videoClip("c-grad", "grad-static.mp4", 16, 4,
          { transitionIn: { type: "fadewhite", duration: 1 }, transitionOut: { type: "fadegrays", duration: 1 } }),
      ],
    }],
  };
}
function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}

async function loadSession(cdp, seed, name) {
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu", 60000);
  await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seed, name))});`);
  await cdp.send("Page.reload", {}, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render sau reload", 60000);
  await sleep(1500);
  const relink = await cdp.evaluate(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
  if (relink) {
    log("  setup: RelinkPanel hiện (media seed thiếu) -> đóng bằng click thật");
    await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Đóng (bỏ qua)")`);
    await waitFor(cdp, `!document.querySelector('.modal[aria-label="Media thiếu"]')`, "RelinkPanel đóng", 15000);
  } else {
    log("  setup: không thấy RelinkPanel (hoặc đã đóng)");
  }
}

async function importMedia(cdp, videoPaths, names) {
  await waitFor(cdp, `!!document.querySelector(".mediabin")`, "MediaBin sẵn (desktop inline)", 30000);
  const doc = await cdp.send("DOM.getDocument", { depth: 0 }, cdp.sessionId, 30000);
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" }, cdp.sessionId, 30000);
  if (!q.nodeId) throw new Error("không tìm được file input của MediaBin qua DOM.querySelector");
  await cdp.send("DOM.setFileInputFiles", { files: videoPaths, nodeId: q.nodeId }, cdp.sessionId, 30000);
  for (const n of names) {
    await waitFor(cdp, `[...document.querySelectorAll(".media-name")].some((el) => (el.textContent || "").trim() === ${JSON.stringify(n)})`, `media ${n} vào bin`, 60000);
    log(`  media vào bin: ${n}`);
  }
}

// ------------------------------------------------------------- ruler -----
async function getRuler(cdp) {
  const r = await cdp.evaluate(`(() => {
    const el = document.querySelector(".tl-ruler");
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    let q = el.getBoundingClientRect();
    if (q.y + q.height > window.innerHeight || q.y < 0) {
      window.scrollTo(0, document.body.scrollHeight);
      let n = el.parentElement;
      while (n) { if (n.scrollHeight > n.clientHeight) n.scrollTop = n.scrollHeight; n = n.parentElement; }
      el.scrollIntoView({ block: "end", inline: "center" });
      q = el.getBoundingClientRect();
    }
    const handle = document.querySelector(".tl-playhead-handle");
    const hr = handle ? handle.getBoundingClientRect() : null;
    const zoom = document.querySelector(".tl-zoom input");
    return { x: q.x, y: q.y, w: q.width, h: q.height, innerH: window.innerHeight,
      handleLeft: hr ? hr.x : null, ppsInput: zoom ? Number(zoom.value) : null };
  })()`);
  await sleep(400);
  return r;
}

async function settlePreview(cdp, timeoutMs = 20000) {
  const hashJs = `(() => {
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return null;
    try {
      const ctx = canvas.getContext("2d");
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 64) s = (s + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
      return { hash: s, w: canvas.width, h: canvas.height };
    } catch (e) { return { error: String(e).slice(0, 80) }; }
  })()`;
  let prev = null;
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const cur = await cdp.evaluate(hashJs, 30000);
    if (cur && !cur.error && prev && prev.hash === cur.hash) return cur;
    prev = cur;
    await sleep(600);
  }
  return prev;
}

let HANDLE_OFFSET = 0; // hiệu chuẩn ở §calibrate (vạch handle có tâm lệch khỏi gốc ruler)
/** Đo offset vạch lúc playhead = 0 (handleLeft - rulerLeft). */
async function calibrateHandle(cdp) {
  const m = await cdp.evaluate(`(() => {
    const el = document.querySelector(".tl-ruler");
    const handle = document.querySelector(".tl-playhead-handle");
    if (!el || !handle) return null;
    const r = el.getBoundingClientRect(), hr = handle.getBoundingClientRect();
    const text = (document.body.innerText.match(/\\d+:\\d+\\.\\d+\\s*\\/\\s*\\d+:\\d+\\.\\d+/) || [])[0] || null;
    return { off: hr.x - r.x, text };
  })()`);
  if (m && m.text && Math.abs(Number(m.text.split("/")[0].trim().split(":").reduce((a, b, i) => a + Number(b) * (i === 0 ? 60 : 1), 0))) < 0.05) {
    HANDLE_OFFSET = m.off;
    log(`  hiệu chuẩn vạch: offset handle-ruler lúc playhead 0 = ${HANDLE_OFFSET.toFixed(2)}px`);
  } else {
    log(`  hiệu chuẩn vạch: không đo được lúc playhead 0 (${JSON.stringify(m)}) — giữ offset 0, cờ vạch chỉ mang tính tham khảo`);
  }
}

/** Scrub tới target (giây). Trả playhead dự đoán (snap frame) + vạch đọc độc lập. */
async function scrubTo(cdp, ruler, target) {
  const y = Math.round(ruler.y + ruler.h / 2);
  const wantX = ruler.x + target * 60;
  // width 0: tọa độ click phát đi = round(wantX), không cộng 0.5px thiên lệch
  // (bản run1 dùng width 1 nên click lệch +0.5px -> playhead thường +1 frame).
  const res = await cdp.clickRect({ x: wantX, y, width: 0, height: 0 });
  await sleep(900);
  const settled = await settlePreview(cdp);
  const check = await cdp.evaluate(`(() => {
    const el = document.querySelector(".tl-ruler");
    const handle = document.querySelector(".tl-playhead-handle");
    if (!el || !handle) return null;
    const r = el.getBoundingClientRect(), hr = handle.getBoundingClientRect();
    const zoom = document.querySelector(".tl-zoom input");
    const pps = zoom ? Number(zoom.value) : 60;
    const text = (document.body.innerText.match(/\\d+:\\d+\\.\\d+\\s*\\/\\s*\\d+:\\d+\\.\\d+/) || [])[0] || null;
    return { rulerLeft: r.x, handleLeft: hr.x, pps, raw: (hr.x - r.x) / pps, text };
  })()`);
  // Playhead dự đoán: store snap (clientX - rulerLeft)/60 về frame 30fps.
  // Dùng rulerLeft đo LẠI sau click (cùng layout, không cuộn giữa chừng)
  // thay vì ruler lúc đầu, để khỏi lệch nếu trang đã cuộn.
  const rulerLeftNow = check ? check.rulerLeft : ruler.x;
  const rawPred = (res.x - rulerLeftNow) / 60;
  const snapped = Math.round(rawPred * 30) / 30;
  // Vạch: trừ offset hiệu chuẩn (tâm handle lệch khỏi gốc ruler).
  const handleRaw = check ? (check.handleLeft - check.rulerLeft - HANDLE_OFFSET) / (check.pps || 60) : null;
  const handleSnap = handleRaw !== null ? Math.round(handleRaw * 30) / 30 : null;
  return { target, dispatchedX: res.x, rulerLeft: ruler.x, rawPred, snapped,
    handleRaw, handleSnap, handleDeltaFrames: (handleSnap !== null ? Math.round((handleSnap - snapped) * 30) : null),
    settled, textTime: check ? check.text : null, pps: check ? check.pps : null };
}

// ------------------------------------------------------------- model -----
// Cài lại từ apps/web/src/lib/transitionPreview.ts (fadeDipWeights +
// singleClipDipPixel). Đây là MODEL CHUNG đã khóa bởi unit test J3;
// browser-test khóa đường dây wiring dùng model này (xem header).
function smoothstep01(t) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return 3 * c * c - 2 * c * c * c;
}
function fadeDipWeights(p) {
  return {
    aAlpha: p <= 0 ? 1 : 1 - smoothstep01((p + 0.01) / 0.206),
    bAlpha: p >= 1 ? 1 : smoothstep01((p - 0.122) / 0.954),
  };
}
function verdictFor(mad, le8) {
  if (mad <= 2 && le8 >= 0.99) return "KHỚP";
  if (mad <= 20 && le8 >= 0.90) return "XẤP XỈ";
  return "LỆCH";
}

// ------------------------------------------------------------- measure ---
/** Chạy trong trang: so canvas app với control video + dip model. */
function pageMeasureCase(arg) {
  return (async () => {
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return { error: "không thấy canvas preview" };
    const W = 1280, H = 720;
    const cw = canvas.width, ch = canvas.height;
    const ctx = canvas.getContext("2d");
    const appData = ctx.getImageData(0, 0, cw, ch).data;
    const scale = Math.min(cw / W, ch / H);
    const offX = (cw - W * scale) / 2, offY = (ch - H * scale) / 2;
    // Control video tái dùng theo file.
    const map = (window.__k3ctl = window.__k3ctl || {});
    let v = map[arg.file];
    if (!v) {
      v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.src = arg.controlUrl;
      map[arg.file] = v;
      await new Promise((res, rej) => {
        const to = setTimeout(() => rej(new Error("timeout load control video")), 15000);
        v.onloadedmetadata = () => { clearTimeout(to); res(); };
        v.onerror = () => { clearTimeout(to); rej(new Error("control video error")); };
      });
    }
    v.pause();
    v.currentTime = arg.sourceT;
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error("timeout seek control")), 15000);
      v.onseeked = () => { clearTimeout(to); res(); };
    });
    if (Math.abs(v.currentTime - arg.sourceT) > 0.25) {
      return { error: "control seek thất bại: currentTime=" + v.currentTime + " muốn " + arg.sourceT };
    }
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d");
    octx.fillStyle = "#000"; octx.fillRect(0, 0, W, H);
    // R29L1 (đợt 29 L1): tọa độ letterbox là SỐ THỰC, cấm Math.round
    // (đợt 28 L1: footage K có dx thật 437,5; làm tròn 438 gây MAD ~4,1
    // trên footage). Với video phẳng 1280x720 thì exact = rounded nên
    // 18 case K3 không đổi theo lý thuyết.
    const cs = Math.min(W / v.videoWidth, H / v.videoHeight);
    const dw = v.videoWidth * cs, dh = v.videoHeight * cs;
    const cx0 = (W - dw) / 2, cy0 = (H - dh) / 2;
    octx.drawImage(v, cx0, cy0, dw, dh);
    const ctlData = octx.getImageData(0, 0, W, H).data;
    // Vùng mẫu: trong khung project, inset 15% (phẳng) hoặc trong vùng
    // video contain-fit inset 4px (footage dọc có pillarbox).
    const x0 = arg.footage ? cx0 + 4 : Math.round(W * 0.15);
    const x1 = arg.footage ? cx0 + dw - 4 : Math.round(W * 0.85);
    const y0 = arg.footage ? cy0 + 4 : Math.round(H * 0.15);
    const y1 = arg.footage ? cy0 + dh - 4 : Math.round(H * 0.85);
    const step = arg.footage ? 4 : 8;
    let n = 0, sum = 0, le8 = 0, maxD = 0;
    const appMean = [0, 0, 0], ctlMean = [0, 0, 0], expMean = [0, 0, 0];
    for (let py = y0; py < y1; py += step) {
      for (let px = x0; px < x1; px += step) {
        const ci = (py * W + px) * 4;
        const cr = ctlData[ci], cg = ctlData[ci + 1], cb = ctlData[ci + 2];
        let er = cr, eg = cg, eb = cb;
        if (arg.mode === "white" || arg.mode === "gray") {
          const dip = arg.mode === "white" ? 255 : (cr + cg + cb) / 3;
          er = arg.alpha * cr + (1 - arg.alpha) * dip;
          eg = arg.alpha * cg + (1 - arg.alpha) * dip;
          eb = arg.alpha * cb + (1 - arg.alpha) * dip;
        }
        const dx = Math.round(offX + px * scale), dy = Math.round(offY + py * scale);
        if (dx < 0 || dy < 0 || dx >= cw || dy >= ch) continue;
        const ai = (dy * cw + dx) * 4;
        const ar = appData[ai], ag = appData[ai + 1], ab = appData[ai + 2];
        let md = 0, mx = 0;
        const ds = [Math.abs(ar - er), Math.abs(ag - eg), Math.abs(ab - eb)];
        for (const d of ds) { md += d; if (d > mx) mx = d; if (d > maxD) maxD = d; }
        sum += md;
        if (mx <= 8) le8++;
        appMean[0] += ar; appMean[1] += ag; appMean[2] += ab;
        ctlMean[0] += cr; ctlMean[1] += cg; ctlMean[2] += cb;
        expMean[0] += er; expMean[1] += eg; expMean[2] += eb;
        n++;
      }
    }
    if (!n) return { error: "không lấy được mẫu nào" };
    // So sánh resample (chẩn đoán, run3): app vẽ offscreen project-size
    // rồi drawImage dưới viewport transform (scale 0.879 ở run2) nên
    // pixel device đã qua resample; so trực tiếp pixel gốc với pixel
    // device sẽ lệch giả trên footage chi tiết. Mirror đúng thứ tự
    // của app: dip trên canvas project -> resample -> so device 1:1.
    // R29L1 (đợt 29 L1): rẽ nhánh theo đường app thật — case sanity
    // (mode null) dùng chuỗi 1 BƯỚC (video thẳng lên device dưới
    // viewport transform, như drawVideoClip); case dip white/gray giữ
    // chuỗi 2 bước (đúng nhánh drawVideoClipWithDip). Dùng 2 bước cho
    // sanity gây artefact L1 P5 (MAD ~3,0 trên footage).
    let madR = null, le8R = null, maxDR = 0, nR = 0, sumR = 0, le8c = 0;
    try {
      const dev = document.createElement("canvas");
      dev.width = cw; dev.height = ch;
      const dctx = dev.getContext("2d");
      if (!arg.mode) {
        dctx.setTransform(scale, 0, 0, scale, offX, offY);
        dctx.drawImage(v, cx0, cy0, dw, dh);
        dctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        const dipOff = document.createElement("canvas");
        dipOff.width = W; dipOff.height = H;
        const dctx0 = dipOff.getContext("2d");
        dctx0.drawImage(off, 0, 0);
        if (arg.mode === "white" || arg.mode === "gray") {
          const img = dctx0.getImageData(0, 0, W, H);
          const dd = img.data;
          for (let i = 0; i < dd.length; i += 4) {
            const dip = arg.mode === "white" ? 255 : (dd[i] + dd[i + 1] + dd[i + 2]) / 3;
            dd[i] = arg.alpha * dd[i] + (1 - arg.alpha) * dip;
            dd[i + 1] = arg.alpha * dd[i + 1] + (1 - arg.alpha) * dip;
            dd[i + 2] = arg.alpha * dd[i + 2] + (1 - arg.alpha) * dip;
          }
          dctx0.putImageData(img, 0, 0);
        }
        dctx.setTransform(scale, 0, 0, scale, offX, offY);
        dctx.drawImage(dipOff, 0, 0);
        dctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      const devData = dctx.getImageData(0, 0, cw, ch).data;
      for (let py = y0; py < y1; py += step) {
        for (let px = x0; px < x1; px += step) {
          const dx = Math.round(offX + px * scale), dy = Math.round(offY + py * scale);
          if (dx < 0 || dy < 0 || dx >= cw || dy >= ch) continue;
          const ai = (dy * cw + dx) * 4;
          let md = 0, mx = 0;
          for (let k = 0; k < 3; k++) { const d = Math.abs(appData[ai + k] - devData[ai + k]); md += d; if (d > mx) mx = d; if (d > maxDR) maxDR = d; }
          sumR += md; if (mx <= 8) le8c++; nR++;
        }
      }
      madR = sumR / (nR * 3); le8R = le8c / nR;
    } catch (e) { madR = null; }
    return { canvasW: cw, canvasH: ch, scale, offX, offY, n,
      mad: sum / (n * 3), le8: le8 / n, maxDiff: maxD,
      madResampled: madR, le8Resampled: le8R, maxDiffResampled: maxDR, nResampled: nR,
      appMean: appMean.map((s) => s / n), ctlMean: ctlMean.map((s) => s / n),
      expMean: expMean.map((s) => s / n),
      controlVideo: { w: v.videoWidth, h: v.videoHeight, ct: v.currentTime } };
  })();
}

// ------------------------------------------------------------- cases -----
const RESULTS = [];
function casePass(id, detail) { RESULTS.push({ id, status: "PASS", detail }); log(`  PASS ${id}: ${detail}`); }
function caseFail(id, detail) { RESULTS.push({ id, status: "FAIL", detail }); log(`  FAIL ${id}: ${detail}`); }

function caseDefs() {
  // clip: {start, dur, file}; window: in/out/null(sanity).
  const D = (id, clip, window, type, target) => ({ id, clip, window, type, target });
  return [
    D("S1-sanity-red-mid", { start: 0, dur: 4, file: "flat-red.mp4" }, null, null, 1.5),
    D("S2-sanity-green-mid", { start: 4, dur: 4, file: "flat-green.mp4" }, null, null, 6.0),
    D("FW-OUT-red-p0333", { start: 0, dur: 4, file: "flat-red.mp4" }, "out", "fadewhite", 3.0333),
    D("FW-OUT-red-p01", { start: 0, dur: 4, file: "flat-red.mp4" }, "out", "fadewhite", 3.1),
    D("FW-OUT-red-p05", { start: 0, dur: 4, file: "flat-red.mp4" }, "out", "fadewhite", 3.5),
    D("FW-IN-green-p01", { start: 4, dur: 4, file: "flat-green.mp4" }, "in", "fadewhite", 4.1),
    D("FW-IN-green-p05", { start: 4, dur: 4, file: "flat-green.mp4" }, "in", "fadewhite", 4.5),
    D("FW-IN-green-p0733", { start: 4, dur: 4, file: "flat-green.mp4" }, "in", "fadewhite", 4.7333),
    // Run1 gõ 4.9667 bị snap ra mép cửa sổ thành playhead 5.0 (p=1.0,
    // alpha=1: nhánh dip không chạy, case thoái hóa thành sanity) nên
    // run2 đổi sang 4.9333 (p=0.9333, vẫn trong cửa sổ, alpha~0.96).
    D("FW-IN-green-p0933", { start: 4, dur: 4, file: "flat-green.mp4" }, "in", "fadewhite", 4.9333),
    D("FG-OUT-green-p01", { start: 4, dur: 4, file: "flat-green.mp4" }, "out", "fadegrays", 7.1),
    D("FG-OUT-green-p05", { start: 4, dur: 4, file: "flat-green.mp4" }, "out", "fadegrays", 7.5),
    D("FG-IN-mag-p01", { start: 8, dur: 4, file: "flat-magenta.mp4" }, "in", "fadegrays", 8.1),
    D("FG-IN-mag-p05", { start: 8, dur: 4, file: "flat-magenta.mp4" }, "in", "fadegrays", 8.5),
    D("FG-OUT-custom-p01", { start: 12, dur: 4, file: "flat-custom.mp4" }, "out", "fadegrays", 15.1),
    D("FG-OUT-custom-p05", { start: 12, dur: 4, file: "flat-custom.mp4" }, "out", "fadegrays", 15.5),
    D("GRAD-FW-IN-p01", { start: 16, dur: 4, file: "grad-static.mp4" }, "in", "fadewhite", 16.1),
    D("GRAD-FW-IN-p05", { start: 16, dur: 4, file: "grad-static.mp4" }, "in", "fadewhite", 16.5),
    D("GRAD-FG-OUT-p05", { start: 16, dur: 4, file: "grad-static.mp4" }, "out", "fadegrays", 19.5),
  ];
}

async function runCase(cdp, ruler, def, opts = {}) {
  const scr = await scrubTo(cdp, ruler, def.target);
  let playhead = scr.snapped;
  let localT = playhead - def.clip.start;
  let p = null, alpha = 1, mode = null;
  if (def.window === "in") {
    p = localT / 1;
    alpha = fadeDipWeights(p).bAlpha;
    mode = def.type === "fadewhite" ? "white" : "gray";
  } else if (def.window === "out") {
    p = (localT - (def.clip.dur - 1)) / 1;
    alpha = fadeDipWeights(p).aAlpha;
    mode = def.type === "fadewhite" ? "white" : "gray";
  }
  const uncertain = scr.handleDeltaFrames !== 0 && scr.handleDeltaFrames !== null;
  const arg = { file: def.clip.file, controlUrl: `${ORIGIN}/${def.clip.file}`,
    sourceT: Math.round(localT * 30) / 30, alpha, mode, footage: !!opts.footage };
  let m;
  try {
    m = await cdp.evaluate(`(${pageMeasureCase.toString()})(${JSON.stringify(arg)})`, 60000);
  } catch (e) {
    return { ...def, status: "FAIL", error: `measure lỗi: ${e.message}`, scrub: scr };
  }
  if (m.error) return { ...def, status: "FAIL", error: m.error, scrub: scr };
  // Guard khung tối (bài học run3): canvas chỉ còn màu nền khung
  // #0a0c10 = (10,12,16) trong khi kỳ vọng sáng hơn nhiều => video
  // chưa seek tới, settle "ổn định" giả trên canvas tĩnh. Scrub lại
  // 1 lần rồi đo lại; nếu vẫn tối thì gắn cờ measurementInvalid
  // (không đổ cho app).
  let retried = false, measurementInvalid = false;
  const isBg = (mean) => mean && Math.max(...mean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) <= 3;
  const expFarFromBg = m.expMean && Math.max(...m.expMean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) > 30;
  if (isBg(m.appMean) && expFarFromBg) {
    log(`  guard khung tối ${def.id}: appMean=[${m.appMean.map((v) => v.toFixed(1)).join(",")}] ~ nền khung, scrub lệch 1 frame rồi quay lại để ép seek mới`);
    retried = true;
    await scrubTo(cdp, ruler, def.target + 1 / 30);
    const scr2 = await scrubTo(cdp, ruler, def.target);
    const ph2 = scr2.snapped, lt2 = ph2 - def.clip.start;
    const p2 = def.window === "in" ? lt2 : def.window === "out" ? lt2 - (def.clip.dur - 1) : null;
    const alpha2 = def.window === "in" ? fadeDipWeights(p2).bAlpha : def.window === "out" ? fadeDipWeights(p2).aAlpha : 1;
    const arg2 = { ...arg, sourceT: Math.round(lt2 * 30) / 30, alpha: alpha2 };
    try {
      const m2 = await cdp.evaluate(`(${pageMeasureCase.toString()})(${JSON.stringify(arg2)})`, 60000);
      if (!m2.error) { m = m2; playhead = ph2; localT = lt2; p = p2; alpha = alpha2; }
    } catch {}
    if (isBg(m.appMean) && expFarFromBg) { measurementInvalid = true; log(`  guard khung tối ${def.id}: sau retry vẫn tối -> measurementInvalid`); }
  }
  const verdict = verdictFor(m.mad, m.le8);
  const verdictR = m.madResampled !== null ? verdictFor(m.madResampled, m.le8Resampled) : null;
  const rec = { ...def, target: def.target, playhead, localT, p, alpha, mode,
    mad: m.mad, le8: m.le8, maxDiff: m.maxDiff, verdict, uncertain,
    retried, measurementInvalid,
    madResampled: m.madResampled, le8Resampled: m.le8Resampled,
    maxDiffResampled: m.maxDiffResampled, verdictResampled: verdictR,
    handleDeltaFrames: scr.handleDeltaFrames, handleRaw: scr.handleRaw,
    nSamples: m.n, canvasW: m.canvasW, canvasH: m.canvasH, scale: m.scale,
    appMean: m.appMean, expMean: m.expMean, ctlMean: m.ctlMean,
    controlVideo: m.controlVideo, settled: scr.settled, gating: opts.gating !== false };
  const detail = `playhead ${playhead} p=${p !== null ? p.toFixed(4) : "-"} alpha=${alpha.toFixed(4)} MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(2)}% appMean=[${m.appMean.map((v) => v.toFixed(1)).join(",")}] expMean=[${m.expMean.map((v) => v.toFixed(1)).join(",")}] resampled: MAD=${m.madResampled !== null ? m.madResampled.toFixed(3) : "-"} <=8=${m.le8Resampled !== null ? (m.le8Resampled * 100).toFixed(2) : "-"}% (${verdictR})${uncertain ? ` (CỜ: vạch lệch ${scr.handleDeltaFrames} frame)` : ""}`;
  if (verdict === "KHỚP") casePass(def.id, detail);
  else if (opts.gating === false) { RESULTS.push({ id: def.id, status: `INFO-${verdict}`, detail }); log(`  INFO ${def.id} [${verdict}]: ${detail}`); }
  else caseFail(def.id, detail);
  return rec;
}

// ------------------------------------------------------------- perf ------
async function perfProbe(cdp, ruler, dipTarget, plainTarget) {
  const install = `(() => { window.__k3lt = [];
    try { const ob = new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__k3lt.push({ duration: e.duration, start: e.startTime }); });
      ob.observe({ entryTypes: ["longtask"] }); window.__k3ob = ob; return true; }
    catch (e) { return false; } })()`;
  const out = {};
  for (const [label, target] of [["dip", dipTarget], ["plain", plainTarget]]) {
    await cdp.evaluate(install);
    const t0 = await cdp.evaluate(`performance.now()`);
    await scrubTo(cdp, ruler, target);
    await sleep(1000);
    const entries = await cdp.evaluate(`window.__k3lt || []`);
    const t1 = await cdp.evaluate(`performance.now()`);
    const inWindow = entries.filter((e) => e.start >= t0 - 50 && e.start <= t1);
    out[label] = { target, t0, t1, entries: inWindow,
      durations: inWindow.map((e) => Math.round(e.duration * 10) / 10) };
    log(`  perf ${label} (target ${target}): longtask durations ms = [${out[label].durations.join(", ")}]`);
    try { await cdp.evaluate(`window.__k3ob && window.__k3ob.disconnect()`); } catch {}
  }
  return out;
}

// ------------------------------------------------------------- real ------
function tryRealFootage(snapDir) {
  if (SKIP_REAL) { log("real footage: bỏ qua theo K3_SKIP_REAL_FOOTAGE=1"); return null; }
  const ident = "26-0007-222-b-dod-111566101";
  const url = `https://archive.org/download/${ident}/26-0007-222B%20%28DOD_111566101%29.mp4`;
  const dest = path.join(SCRATCH, "videos", "clip-k-dod-iwo.mp4");
  try {
    const meta = spawnSync("curl", ["-fsSL", "--max-time", "60", "-A", "VCut-K3-test",
      `https://archive.org/metadata/${ident}`], { encoding: "utf8" });
    if (meta.status !== 0) { log(`real footage: không lấy được metadata IA (${(meta.stderr || "").slice(0, 120)}) — bỏ qua`); return null; }
    const metaJson = JSON.parse(meta.stdout);
    const lic = metaJson.metadata?.licenseurl || metaJson.licenseurl || "";
    if (!lic.includes("publicdomain")) { log(`real footage: licenseurl không phải publicdomain (${lic}) — TỪ CHỐI, bỏ qua`); return null; }
    log(`real footage: license IA OK (publicdomain: ${lic})`);
    if (!fs.existsSync(dest)) {
      log("real footage: đang tải clip K (giới hạn 600s)...");
      const dl = spawnSync("curl", ["-fL", "--max-time", "600", "-A", "VCut-K3-test", "-o", dest, url], { encoding: "utf8" });
      if (dl.status !== 0) { log(`real footage: tải thất bại (${(dl.stderr || "").slice(-160)}) — bỏ qua`); return null; }
    }
    const sha = crypto.createHash("sha256").update(fs.readFileSync(dest)).digest("hex");
    if (sha !== "49f33b83f0e7694e560557e08379b4bef628fed4f89662898764d5c12db6d69c") {
      log(`real footage: SHA256 KHÔNG khớp J3 (${sha.slice(0, 16)}...) — bỏ qua (không dùng file lạ)`);
      return null;
    }
    const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", dest], { encoding: "utf8" });
    log(`real footage: SHA khớp J3, ffprobe: ${(probe.stdout || "").trim().replace(/\n/g, ",")}`);
    fs.copyFileSync(dest, path.join(snapDir, "clip-k-dod-iwo.mp4"));
    return { file: "clip-k-dod-iwo.mp4", path: dest };
  } catch (e) {
    log(`real footage: lỗi (${e.message}) — bỏ qua`);
    return null;
  }
}

// ------------------------------------------------------------- main ------
async function main() {
  log(`harness clicktest-dip-browser-pipe: bắt đầu (label=${RUN_LABEL}, display=${DISPLAY}, port=${PORT})`);
  let xvfb = null, server = null, exitCode = 2;
  const holders = [];
  const caseRecords = [];
  let perf = null, realInfo = null;
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    const vidDir = genVideos();
    if (!vidDir) { log("BLOCKER: tạo video thất bại"); return 2; }
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) { log("BLOCKER: dist snapshot thất bại"); return 2; }
    for (const f of fs.readdirSync(vidDir).filter((x) => x.endsWith(".mp4"))) {
      fs.copyFileSync(path.join(vidDir, f), path.join(snap.dir, f));
    }
    log(`video đã copy vào snapshot (${fs.readdirSync(vidDir).filter((x) => x.endsWith(".mp4")).join(", ")})`);
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }
    realInfo = tryRealFootage(snap.dir);
    const holder = {};
    const cdp = await startChrome(holder);
    if (!cdp) { log("BLOCKER: không binary nào mở được pipe"); return 2; }
    holders.push(holder);
    try {
      await loadSession(cdp, seedSpec(), "K3 dip browser seed");
      const names = ["flat-red.mp4", "flat-green.mp4", "flat-magenta.mp4", "flat-custom.mp4", "grad-static.mp4"];
      await importMedia(cdp, names.map((n) => path.join(vidDir, n)), names);
      await calibrateHandle(cdp);
      const ruler = await getRuler(cdp);
      if (!ruler) throw new Error("không thấy .tl-ruler");
      if (ruler.y < 0 || ruler.y + ruler.h > ruler.innerH) throw new Error(`ruler ngoài viewport: ${JSON.stringify(ruler)}`);
      log(`ruler rect: ${JSON.stringify(ruler)}`);
      for (const def of caseDefs()) {
        try {
          const rec = await runCase(cdp, ruler, def);
          caseRecords.push(rec);
        } catch (e) {
          caseFail(def.id, `lỗi chạy case: ${e.message}`);
          caseRecords.push({ ...def, status: "FAIL", error: e.message });
        }
      }
      // Perf probe: 3 lần dip frame (FW-IN p=0.5) vs 3 lần frame thường
      // (green mid) — longtask là cận trên (gồm seek/decode/rAF).
      try {
        perf = { dip: [], plain: [] };
        for (let i = 0; i < 3; i++) {
          const r = await perfProbe(cdp, ruler, 4.5, 6.0);
          perf.dip.push(r.dip); perf.plain.push(r.plain);
        }
        log(`  perf tổng: dip longtask = [${perf.dip.map((d) => d.durations.join("/")).join(", ")}], plain = [${perf.plain.map((d) => d.durations.join("/") || "-").join(", ")}]`);
      }
      catch (e) { log(`perf probe lỗi: ${e.message}`); perf = { error: e.message }; }
      // Phiên footage thật (nếu tải + verify OK): seed riêng, chỉ thông tin.
      if (realInfo) {
        try {
          const realSeed = {
            version: "0.2.0",
            meta: { name: "K3 real footage seed", width: 1280, height: 720, fps: 30 },
            tracks: [{ id: "t-real", kind: "video", clips: [
              { kind: "video", id: "c-real-k", src: "clip-k-dod-iwo.mp4", start: 0, duration: 4, in: 0, out: 4,
                transitionIn: { type: "fadewhite", duration: 1 }, transitionOut: { type: "fadegrays", duration: 1 } },
            ] }],
          };
          await loadSession(cdp, realSeed, "K3 real footage seed");
          await importMedia(cdp, [realInfo.path], ["clip-k-dod-iwo.mp4"]);
          // Chẩn đoán proxy: badge PROXY trên preview + toast proxy (nếu
          // MediaBin tự gắn proxy cho file 45MB thì frame app là bản
          // downscale, không phải gốc — phải ghi rõ, không đổ cho dip).
          const proxyDiag = await cdp.evaluate(`(() => {
            const badge = document.querySelector(".preview-proxy-badge");
            const mediaProxy = [...document.querySelectorAll(".media-proxy")].map((el) => (el.textContent || "").trim());
            const toasts = [...document.querySelectorAll(".toast, [class*=toast]")].map((el) => (el.textContent || "").trim()).slice(0, 8);
            return { badge: badge ? badge.textContent : null, badgeDisplay: badge ? badge.style.display : null, mediaProxy, toasts };
          })()`);
          log(`  real proxy diag: ${JSON.stringify(proxyDiag)}`);
          caseRecords.push({ id: "REAL-PROXY-DIAG", proxyDiag, gating: false });
          const ruler2 = await getRuler(cdp);
          const realDefs = [
            { id: "REAL-FW-IN-k-p05", clip: { start: 0, dur: 4, file: "clip-k-dod-iwo.mp4" }, window: "in", type: "fadewhite", target: 0.5 },
            { id: "REAL-FG-OUT-k-p05", clip: { start: 0, dur: 4, file: "clip-k-dod-iwo.mp4" }, window: "out", type: "fadegrays", target: 3.5 },
          ];
          for (const def of realDefs) {
            try {
              const rec = await runCase(cdp, ruler2, def, { footage: true, gating: false });
              rec.gating = false;
              caseRecords.push(rec);
              // Chẩn đoán lệch thời gian: nếu không KHỚP, quét control
              // sourceT ±15 frame KHÔNG scrub lại (frame app giữ nguyên
              // ở playhead đã đo). Nếu có offset cho KHỚP thì app lệch
              // thời gian; nếu không offset nào cứu được thì dư số nằm
              // ở chi tiết frame/decode, không phải lệch thời gian.
              if (rec.verdict !== "KHỚP" && !rec.measurementInvalid) {
                const search = [];
                for (const off of [-15, -12, -9, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 9, 12, 15]) {
                  const m = await cdp.evaluate(`(${pageMeasureCase.toString()})(${JSON.stringify({ file: def.clip.file, controlUrl: `${ORIGIN}/${def.clip.file}`, sourceT: Math.round((rec.localT + off / 30) * 30) / 30, alpha: rec.alpha, mode: rec.mode, footage: true })})`, 60000);
                  if (!m.error) search.push({ frameOffset: off, mad: m.mad, le8: m.le8, madResampled: m.madResampled, le8Resampled: m.le8Resampled, verdict: verdictFor(m.mad, m.le8), verdictResampled: m.madResampled !== null ? verdictFor(m.madResampled, m.le8Resampled) : null });
                }
                search.sort((a, b) => a.madResampled - b.madResampled);
                rec.frameSearchWide = search;
                log(`  REAL frame-search-wide ${def.id} (sắp theo madResampled): ${JSON.stringify(search.slice(0, 5))}`);
              }
            } catch (e) {
              caseFail(def.id, `lỗi chạy case real: ${e.message}`);
              caseRecords.push({ ...def, status: "FAIL", error: e.message, gating: false });
            }
          }
        } catch (e) { log(`phiên footage thật lỗi: ${e.message}`); }
      }
      // Đối chứng sanity trên cùng footage K (không transition): nếu
      // sanity cũng lệch tương tự thì dư số thuộc về nguồn frame video
      // (seek/decode/resample), không phải nhánh dip; nếu sanity KHỚP
      // mà dip lệch thì dip trên footage động mới là vấn đề thật.
      if (realInfo) {
        try {
          const plainSeed = {
            version: "0.2.0",
            meta: { name: "K3 real sanity seed", width: 1280, height: 720, fps: 30 },
            tracks: [{ id: "t-plain", kind: "video", clips: [
              { kind: "video", id: "c-plain-k", src: "clip-k-dod-iwo.mp4", start: 0, duration: 4, in: 0, out: 4 },
            ] }],
          };
          await loadSession(cdp, plainSeed, "K3 real sanity seed");
          await importMedia(cdp, [realInfo.path], ["clip-k-dod-iwo.mp4"]);
          const ruler3 = await getRuler(cdp);
          const srec = await runCase(cdp, ruler3,
            { id: "REAL-SANITY-k-mid", clip: { start: 0, dur: 4, file: "clip-k-dod-iwo.mp4" }, window: null, type: null, target: 2.0 },
            { footage: true, gating: false });
          srec.gating = false;
          caseRecords.push(srec);
        } catch (e) { log(`phiên sanity K lỗi: ${e.message}`); }
      }
      const primary = caseRecords.filter((r) => r.gating !== false);
      const failed = primary.filter((r) => r.verdict !== "KHỚP" || r.status === "FAIL");
      const exc = cdp.exceptions.length;
      log(`exceptions trong phiên: ${exc}${exc ? ` (đầu: ${JSON.stringify(cdp.exceptions[0]).slice(0, 300)})` : ""}`);
      exitCode = failed.length === 0 ? 0 : 1;
      log(`DONE clicktest-dip-browser: ${primary.filter((r) => r.verdict === "KHỚP").length}/${primary.length} case chính KHỚP, ${failed.length} không KHỚP, exit=${exitCode}`);
      const outJson = {
        run: RUN_LABEL, date: new Date().toISOString(),
        bundle: snap.bundle, bundleSha256_16: snap.sha,
        display: DISPLAY, port: PORT, origin: ORIGIN,
        cases: caseRecords, perf, exceptions: cdp.exceptions,
        realFootage: realInfo ? { file: realInfo.file, shaVerified: true } : null,
        log: logLines,
      };
      const outPath = path.join(ROOT, "benchmarks", "results", "v27-k3-canvas-dip-browser.json");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      writeFileEpermRetry(outPath, JSON.stringify(outJson, null, 2));
      log(`JSON kết quả: ${outPath}`);
    } finally {
      try { holder.chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
    }
  } catch (e) {
    log(`BLOCKER/LỖI main: ${e.message}`);
    exitCode = 2;
  } finally {
    try { server?.close(); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
  }
  return exitCode;
}

process.exitCode = await main();
