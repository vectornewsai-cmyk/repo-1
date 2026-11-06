#!/usr/bin/env node
/**
 * clicktest-dip-footage-round29-l1.mjs — Phase 9 đợt 29, luồng L1:
 * đo lại dip-trên-footage của K3 bằng CHUỖI ĐO ĐÚNG (đóng nợ đợt 28
 * L1 §7 + K3 §4: số dip footage cũ mang baseline artefact chuỗi
 * control cũ, không được dùng làm bằng chứng nữa).
 *
 * Quy tắc đo đúng (đợt 28 L1 §7, đã chứng minh bằng phép đo loại trừ):
 *  R1. Tọa độ letterbox là SỐ THỰC, cấm Math.round: với footage K
 *      (1080x1920, project 1280x720) dx = 437,5 — không phải 438 như
 *      control K3. Riêng lệch 0,5px này đã gây MAD ~4,1 trên footage
 *      (L1 probe P4).
 *  R2. Số bước resample phải khớp ĐÚNG nhánh app đang đo, không phải
 *      "1 bước cho mọi case":
 *      - Nhánh thường / fadeblack (drawVideoClip trực tiếp lên ctx đã
 *        mang viewport transform): 1 BƯỚC video -> device.
 *      - Nhánh dip white/gray (drawVideoClipWithDip: off project ->
 *        vòng lặp ImageData -> ctx.drawImage(off) dưới viewport
 *        transform): 2 BƯỚC video -> project -> device.
 *      K3 dùng 2 bước cho MỌI case nên sanity (nhánh thường) của nó
 *      mang thêm artefact 1-vs-2 bước (L1 probe P5: MAD ~3,0); ngược
 *      lại dip white/gray của K3 đúng cấu trúc 2 bước, chỉ sai offset
 *      438 — vì vậy số dip footage cũ sai ở mức artefact offset, còn
 *      số sanity cũ sai ở cả hai thành phần.
 *  R3. Sweep thời gian theo LƯỚI FPS GỐC của file (K: 24000/1001,
 *      seek giữa frame), không theo lưới 30fps. Các target p = 0,5
 *      trên lưới 30fps (localT 0,5 / 3,5) nằm sát biên frame nguồn
 *      (cách biên 0,0005s / 0,0035s) nên chỉ đo dạng "legacy-p" kèm
 *      sweep adjudication + frameLock check; các case chính dùng
 *      p = 0,1 / 0,5333 nằm sâu trong frame nguồn (cách biên >= 0,008s).
 *  R4. So sánh device-vs-device 1:1 (cùng kích thước canvas, cùng
 *      tập mẫu), không point-sampled project-vs-device như cột chính
 *      của K3 (cột đó mang sai số lấy mẫu điểm trên ảnh đã resample).
 *
 * Harness này KHÔNG sửa code sản phẩm. Nó gồm 2 phiên trong cùng một
 * Chrome headed (pipe CDP, Xvfb, snapshot dist — mẫu L1/K3):
 *  - Phiên hồi quy: đúng 18 case phẳng/gradient của K3, đo bằng chuỗi
 *    đúng (với nội dung phẳng/tĩnh, hình học exact = rounded nên số
 *    phải tái lập 18/18 KHỚP của K3; nếu khác thì đó là hồi quy thật,
 *    phải báo, không được giấu).
 *  - Phiên footage: clip K duy nhất dùng lại cho 3 clip nối tiếp
 *    (fadeblack / fadewhite / fadegrays, mỗi clip vào+ra 1s) + 1 clip
 *    sanity không transition; 12 case chính + 2 case legacy-p đúng
 *    p = 0,5 của K3 (FW-IN, FG-OUT) + 1 sanity = 15 case.
 * Mỗi case footage kèm: chuỗi cũ kiểu K3 (diagnostic — đo artefact đã
 * loại), sweep lưới fps gốc dk -2..+2, frameLock (control seek giữa
 * frame vs seek tới sourceT lưới 30fps phải cùng frame), holdStats,
 * và guard khung tối kiểu K3.
 *
 * Thoát mã: 0 = hồi quy 18/18 KHỚP và footage 15/15 KHỚP, 0 exception,
 * 0 measurementInvalid; 1 = có case không KHỚP (phải điều tra bằng
 * sweep/frameLock trước khi kết luận lỗi app); 2 = blocker hạ tầng.
 * Kết quả JSON: benchmarks/results/v29-l1-dip-footage.json.
 * Scratch: ~/workspace/tmp-round29-l1/ (video + snapshot dist), không
 * đưa binary vào repo. KHÔNG push, KHÔNG GitHub connector, KHÔNG tag.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-dip-footage-round29-l1.mjs
 * Biến môi trường: R29L1_DISPLAY (mặc định :99), R29L1_PORT (4199),
 * R29L1_RUN_LABEL, R29L1_SKIP_REGRESSION=1, R29L1_SKIP_FOOTAGE=1.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round29-l1");
const K_SRC = path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage", "clip-k-dod-iwo.mp4");
const K_SHA = "49f33b83f0e7694e560557e08379b4bef628fed4f89662898764d5c12db6d69c";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.R29L1_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.R29L1_DISPLAY || ":99";
const PORT = Number(process.env.R29L1_PORT || 4199);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.R29L1_RUN_LABEL || "r29l1-run1";
const SKIP_REG = process.env.R29L1_SKIP_REGRESSION === "1";
const SKIP_FOOT = process.env.R29L1_SKIP_FOOTAGE === "1";
// Probe run 2 (diagnostic, không gating): kiểm chứng giả thuyết "scrub
// ngược đúng 1 frame 30fps để lại frame cũ" bằng cách đo cùng 2 case
// anomaly với các hướng tiếp cận khác nhau (từ 0, ngược 1f, xuôi 1f).
// Bật bằng R29L1_PROBE=1 (tự bỏ qua phiên hồi quy, chỉ chạy phiên
// footage với probeCaseDefs; JSON ra file ...-probe2.json riêng).
const PROBE = process.env.R29L1_PROBE === "1";
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "r29l1-pipe-"));
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
function seedSpecReg() {
  return {
    version: "0.2.0",
    meta: { name: "R29L1 dip regression seed (K3)", width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "t-main", kind: "video", clips: [
        videoClip("c-red", "flat-red.mp4", 0, 4,
          { transitionOut: { type: "fadewhite", duration: 1 } }),
        videoClip("c-green", "flat-green.mp4", 4, 4,
          { transitionIn: { type: "fadewhite", duration: 1 }, transitionOut: { type: "fadegrays", duration: 1 } }),
        videoClip("c-mag", "flat-magenta.mp4", 8, 4,
          { transitionIn: { type: "fadegrays", duration: 1 } }),
        videoClip("c-custom", "flat-custom.mp4", 12, 4,
          { transitionOut: { type: "fadegrays", duration: 1 } }),
        videoClip("c-grad", "grad-static.mp4", 16, 4,
          { transitionIn: { type: "fadewhite", duration: 1 }, transitionOut: { type: "fadegrays", duration: 1 } }),
      ],
    }],
  };
}
function seedSpecFoot() {
  // Cùng file K cho 3 clip nối tiếp (in = 0 nên sourceT = localT cho
  // mọi clip — cùng đoạn footage 0-4s, so sánh được giữa các type).
  // Clip sanity riêng [12,16) không transition.
  return {
    version: "0.2.0",
    meta: { name: "R29L1 dip footage seed", width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "t-foot", kind: "video", clips: [
        videoClip("c-fb", "clip-k-dod-iwo.mp4", 0, 4,
          { transitionIn: { type: "fadeblack", duration: 1 }, transitionOut: { type: "fadeblack", duration: 1 } }),
        videoClip("c-fw", "clip-k-dod-iwo.mp4", 4, 4,
          { transitionIn: { type: "fadewhite", duration: 1 }, transitionOut: { type: "fadewhite", duration: 1 } }),
        videoClip("c-fg", "clip-k-dod-iwo.mp4", 8, 4,
          { transitionIn: { type: "fadegrays", duration: 1 }, transitionOut: { type: "fadegrays", duration: 1 } }),
        videoClip("c-san", "clip-k-dod-iwo.mp4", 12, 4),
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

let HANDLE_OFFSET = 0;
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

/** Scrub tới target (giây). Trả playhead dự đoán (snap frame 30fps). */
async function scrubTo(cdp, ruler, target) {
  const y = Math.round(ruler.y + ruler.h / 2);
  const wantX = ruler.x + target * 60;
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
  const rulerLeftNow = check ? check.rulerLeft : ruler.x;
  const rawPred = (res.x - rulerLeftNow) / 60;
  const snapped = Math.round(rawPred * 30) / 30;
  const handleRaw = check ? (check.handleLeft - check.rulerLeft - HANDLE_OFFSET) / (check.pps || 60) : null;
  const handleSnap = handleRaw !== null ? Math.round(handleRaw * 30) / 30 : null;
  return { target, dispatchedX: res.x, rulerLeft: ruler.x, rawPred, snapped,
    handleRaw, handleSnap, handleDeltaFrames: (handleSnap !== null ? Math.round((handleSnap - snapped) * 30) : null),
    settled, textTime: check ? check.text : null, pps: check ? check.pps : null };
}

// ------------------------------------------------------------- model -----
// Cài lại từ apps/web/src/lib/transitionPreview.ts (fadeDipWeights).
// K3 dùng đúng công thức này; luồng này giữ nguyên (model đã khóa).
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
/**
 * Chạy trong trang: capture frame app 1 lần, dựng control bằng chuỗi
 * ĐÚNG theo nhánh app (R1-R4) và chuỗi cũ kiểu K3 (diagnostic), so
 * device-vs-device 1:1. Hàm này được stringify sang trang nên KHÔNG
 * dùng backtick / ${} bên trong, không tham chiếu biến ngoài.
 */
function pageMeasureDip(arg) {
  return (async () => {
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return { error: "không thấy canvas preview" };
    const W = 1280, H = 720;
    const cw = canvas.width, ch = canvas.height;
    const ctx = canvas.getContext("2d");
    const appData = ctx.getImageData(0, 0, cw, ch).data;
    const scale = Math.min(cw / W, ch / H);
    const offX = (cw - W * scale) / 2, offY = (ch - H * scale) / 2;
    const map = (window.__r29l1ctl = window.__r29l1ctl || {});
    let v = map[arg.file];
    if (!v) {
      v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.src = arg.controlUrl;
      map[arg.file] = v;
      await new Promise((res, rej) => {
        const to = setTimeout(() => rej(new Error("timeout load control video")), 20000);
        v.onloadedmetadata = () => { clearTimeout(to); res(); };
        v.onerror = () => { clearTimeout(to); rej(new Error("control video error")); };
      });
    }
    async function seekCtl(t) {
      v.pause();
      v.currentTime = t;
      await new Promise((res, rej) => {
        const to = setTimeout(() => rej(new Error("timeout seek control")), 20000);
        v.onseeked = () => { clearTimeout(to); res(); };
      });
      return v.currentTime;
    }
    // Letterbox EXACT (R1): s = min(W/mw, H/mh), không Math.round.
    const mw = v.videoWidth, mh = v.videoHeight;
    const s = Math.min(W / mw, H / mh);
    const dw = mw * s, dh = mh * s, dx = (W - dw) / 2, dy = (H - dh) / 2;
    const dwR = Math.round(dw), dhR = Math.round(dh);
    const dxR = Math.round(dx), dyR = Math.round(dy);
    // Tập mẫu (project coords) -> device coords (cùng công thức cả 2 phía).
    let x0, x1, y0, y1, step;
    if (arg.footage) { x0 = dx + 4; x1 = dx + dw - 4; y0 = 4; y1 = H - 4; step = 4; }
    else { x0 = Math.round(W * 0.15); x1 = Math.round(W * 0.85); y0 = Math.round(H * 0.15); y1 = Math.round(H * 0.85); step = 8; }
    const samples = [];
    for (let py = y0; py < y1; py += step)
      for (let px = x0; px < x1; px += step) {
        const ddx = Math.round(offX + px * scale), ddy = Math.round(offY + py * scale);
        if (ddx < 0 || ddy < 0 || ddx >= cw || ddy >= ch) continue;
        samples.push([ddx, ddy]);
      }
    function meanOf(data) {
      const m = [0, 0, 0];
      for (let si = 0; si < samples.length; si++) {
        const i = (samples[si][1] * cw + samples[si][0]) * 4;
        m[0] += data[i]; m[1] += data[i + 1]; m[2] += data[i + 2];
      }
      return m.map((x) => x / samples.length);
    }
    function cmp(a, b) {
      let n = 0, sum = 0, le8 = 0, maxD = 0;
      for (let si = 0; si < samples.length; si++) {
        const i = (samples[si][1] * cw + samples[si][0]) * 4;
        let mx = 0;
        for (let k = 0; k < 3; k++) {
          const d = Math.abs(a[i + k] - b[i + k]);
          sum += d; if (d > mx) mx = d; if (d > maxD) maxD = d;
        }
        if (mx <= 8) le8++;
        n++;
      }
      const mad = sum / (n * 3), le = le8 / n;
      return { n, mad, le8: le, maxDiff: maxD,
        verdict: (mad <= 2 && le >= 0.99) ? "KHỚP" : (mad <= 20 && le >= 0.90) ? "XẤP XỈ" : "LỆCH" };
    }
    function devicePrefilled() {
      const dev = document.createElement("canvas");
      dev.width = cw; dev.height = ch;
      const dctx = dev.getContext("2d");
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.fillStyle = "#000"; dctx.fillRect(0, 0, cw, ch);
      dctx.setTransform(scale, 0, 0, scale, offX, offY);
      dctx.fillStyle = "#0a0c10"; dctx.fillRect(0, 0, W, H);
      return { dev, dctx };
    }
    // Nhánh thường / fadeblack của app: video -> device 1 bước (R2).
    function chain1step(gx, gy, gw, gh, alpha) {
      const pair = devicePrefilled();
      const dctx = pair.dctx;
      dctx.setTransform(scale, 0, 0, scale, offX, offY);
      if (alpha !== null && alpha !== undefined) dctx.globalAlpha = alpha;
      dctx.drawImage(v, gx, gy, gw, gh);
      dctx.globalAlpha = 1;
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      return dctx.getImageData(0, 0, cw, ch).data;
    }
    // Nhánh dip white/gray của app: video -> off project -> dip pixel
    // -> device dưới viewport transform (R2). Off bắt đầu trong suốt
    // như app (drawVideoClip chỉ vẽ rect video; pixel alpha 0 được
    // vòng lặp dip bỏ qua, ngoài pillar giữ nền #0a0c10 của device).
    function chainDip2step(gx, gy, gw, gh, mode, alpha) {
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const octx = off.getContext("2d");
      octx.drawImage(v, gx, gy, gw, gh);
      if (mode === "white" || mode === "gray") {
        const img = octx.getImageData(0, 0, W, H);
        const dd = img.data;
        for (let i = 0; i < dd.length; i += 4) {
          if (dd[i + 3] === 0) continue;
          const dip = mode === "white" ? 255 : (dd[i] + dd[i + 1] + dd[i + 2]) / 3;
          dd[i] = Math.round(alpha * dd[i] + (1 - alpha) * dip);
          dd[i + 1] = Math.round(alpha * dd[i + 1] + (1 - alpha) * dip);
          dd[i + 2] = Math.round(alpha * dd[i + 2] + (1 - alpha) * dip);
        }
        octx.putImageData(img, 0, 0);
      }
      const pair = devicePrefilled();
      const dctx = pair.dctx;
      dctx.setTransform(scale, 0, 0, scale, offX, offY);
      dctx.drawImage(off, 0, 0);
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      return dctx.getImageData(0, 0, cw, ch).data;
    }
    function chainCorrect() {
      if (arg.mode === "white" || arg.mode === "gray") return chainDip2step(dx, dy, dw, dh, arg.mode, arg.alpha);
      if (arg.mode === "black") return chain1step(dx, dy, dw, dh, arg.alpha);
      return chain1step(dx, dy, dw, dh, null);
    }
    function chainOldK3() {
      // Diagnostic: đúng cấu trúc resampled của K3 (2 bước + offset
      // làm tròn). Với fadeblack (K3 không có case này) thì alpha áp
      // lên project draw — ghi rõ là analogue kiểu K3, không phải số
      // lịch sử.
      if (arg.mode === "white" || arg.mode === "gray") return chainDip2step(dxR, dyR, dwR, dhR, arg.mode, arg.alpha);
      if (arg.mode === "black") {
        const off = document.createElement("canvas");
        off.width = W; off.height = H;
        const octx = off.getContext("2d");
        octx.globalAlpha = arg.alpha;
        octx.drawImage(v, dxR, dyR, dwR, dhR);
        octx.globalAlpha = 1;
        const pair = devicePrefilled();
        const dctx = pair.dctx;
        dctx.setTransform(scale, 0, 0, scale, offX, offY);
        dctx.drawImage(off, 0, 0);
        dctx.setTransform(1, 0, 0, 1, 0, 0);
        return dctx.getImageData(0, 0, cw, ch).data;
      }
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const octx = off.getContext("2d");
      octx.drawImage(v, dxR, dyR, dwR, dhR);
      const pair = devicePrefilled();
      const dctx = pair.dctx;
      dctx.setTransform(scale, 0, 0, scale, offX, offY);
      dctx.drawImage(off, 0, 0);
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      return dctx.getImageData(0, 0, cw, ch).data;
    }
    const fpsN = arg.fpsNative;
    const k0 = Math.floor(arg.sourceT * fpsN);
    const midSeek = (k0 + 0.5) / fpsN;
    const edgeStart = arg.sourceT - k0 / fpsN;
    const edgeEnd = (k0 + 1) / fpsN - arg.sourceT;
    const ctMid = await seekCtl(midSeek);
    if (Math.abs(ctMid - midSeek) > 0.25) return { error: "control seek giữa frame thất bại: ct=" + ctMid + " muốn " + midSeek };
    const correctData = chainCorrect();
    const main = cmp(appData, correctData);
    const oldData = chainOldK3();
    const old = cmp(appData, oldData);
    // FrameLock: control seek tới sourceT (lưới 30fps, kiểu K3) phải
    // cho cùng frame với seek giữa frame; khác frame => MAD > 0 và
    // case bị gắn cờ (đặc biệt quan trọng ở legacy-p sát biên frame).
    const ctSrc = await seekCtl(arg.sourceT);
    if (Math.abs(ctSrc - arg.sourceT) > 0.25) return { error: "control seek sourceT thất bại: ct=" + ctSrc + " muốn " + arg.sourceT };
    const correctData2 = chainCorrect();
    const lock = cmp(correctData, correctData2);
    let sweep = null;
    if (arg.sweep) {
      sweep = [];
      for (const dk of [-2, -1, 0, 1, 2]) {
        const kk = k0 + dk;
        const seekT = (kk + 0.5) / fpsN;
        await seekCtl(seekT);
        const dd = chainCorrect();
        const c = cmp(appData, dd);
        sweep.push({ dk, frameIndex: kk, seekT: Math.round(seekT * 10000) / 10000, mad: c.mad, le8: c.le8, maxDiff: c.maxDiff, verdict: c.verdict });
      }
    }
    return { canvasW: cw, canvasH: ch, scale, offX, offY, nSamples: samples.length,
      letterbox: { dx, dy, dw, dh, dxR, dyR, dwR, dhR },
      sourceFrameIndex: k0, fpsNative: fpsN, midSeek, edgeStart, edgeEnd,
      main, oldChain: old, frameLock: lock, sweep,
      appMean: meanOf(appData), correctMean: meanOf(correctData),
      controlVideo: { w: mw, h: mh, ctMid, ctSrc },
      holdStats: (window.__vcutHoldStats || null) };
  })();
}

// ------------------------------------------------------------- cases -----
function modeOf(type) {
  if (type === "fadewhite") return "white";
  if (type === "fadegrays") return "gray";
  if (type === "fadeblack") return "black";
  return null;
}

function regCaseDefs() {
  const D = (id, clip, window, type, target) => ({ id, clip, window, type, target, footage: false, fpsNative: 30 });
  return [
    D("S1-sanity-red-mid", { start: 0, dur: 4, file: "flat-red.mp4" }, null, null, 1.5),
    D("S2-sanity-green-mid", { start: 4, dur: 4, file: "flat-green.mp4" }, null, null, 6.0),
    D("FW-OUT-red-p0333", { start: 0, dur: 4, file: "flat-red.mp4" }, "out", "fadewhite", 3.0333),
    D("FW-OUT-red-p01", { start: 0, dur: 4, file: "flat-red.mp4" }, "out", "fadewhite", 3.1),
    D("FW-OUT-red-p05", { start: 0, dur: 4, file: "flat-red.mp4" }, "out", "fadewhite", 3.5),
    D("FW-IN-green-p01", { start: 4, dur: 4, file: "flat-green.mp4" }, "in", "fadewhite", 4.1),
    D("FW-IN-green-p05", { start: 4, dur: 4, file: "flat-green.mp4" }, "in", "fadewhite", 4.5),
    D("FW-IN-green-p0733", { start: 4, dur: 4, file: "flat-green.mp4" }, "in", "fadewhite", 4.7333),
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

function footCaseDefs() {
  const FPSK = 24000 / 1001;
  const D = (id, clip, window, type, target, legacy = false) =>
    ({ id, clip, window, type, target, footage: true, fpsNative: FPSK, legacy });
  const fb = { start: 0, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const fw = { start: 4, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const fg = { start: 8, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const san = { start: 12, dur: 4, file: "clip-k-dod-iwo.mp4" };
  return [
    D("FB-IN-p01", fb, "in", "fadeblack", 0.1),
    D("FB-IN-p0533", fb, "in", "fadeblack", 0.5333),
    D("FB-OUT-p01", fb, "out", "fadeblack", 3.1),
    D("FB-OUT-p0533", fb, "out", "fadeblack", 3.5333),
    D("FW-IN-p01", fw, "in", "fadewhite", 4.1),
    D("FW-IN-p0533", fw, "in", "fadewhite", 4.5333),
    D("FW-OUT-p01", fw, "out", "fadewhite", 7.1),
    D("FW-OUT-p0533", fw, "out", "fadewhite", 7.5333),
    D("FW-IN-p05-legacyK3", fw, "in", "fadewhite", 4.5, true),
    D("FG-IN-p01", fg, "in", "fadegrays", 8.1),
    D("FG-IN-p0533", fg, "in", "fadegrays", 8.5333),
    D("FG-OUT-p01", fg, "out", "fadegrays", 11.1),
    D("FG-OUT-p0533", fg, "out", "fadegrays", 11.5333),
    D("FG-OUT-p05-legacyK3", fg, "out", "fadegrays", 11.5, true),
    D("SANITY-K-mid", san, null, null, 14.0333),
  ];
}

function alphaFor(def, localT) {
  if (def.window === "in") {
    const p = localT / 1;
    return { p, alpha: fadeDipWeights(p).bAlpha, mode: modeOf(def.type) };
  }
  if (def.window === "out") {
    const p = (localT - (def.clip.dur - 1)) / 1;
    return { p, alpha: fadeDipWeights(p).aAlpha, mode: modeOf(def.type) };
  }
  return { p: null, alpha: 1, mode: null };
}

function probeCaseDefs() {
  // Cùng seed footage; mỗi probe đo cùng 1 case với 1 bước prescrub
  // khác nhau TRƯỚC khi scrub tới target — bước cuối tới target mới
  // là bước quyết định (ngược 1f / xuôi 1f / từ xa).
  const FPSK = 24000 / 1001;
  const fg = { start: 8, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const san = { start: 12, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const D = (id, clip, window, type, target, preTarget) =>
    ({ id, clip, window, type, target, footage: true, fpsNative: FPSK, preTarget });
  return [
    D("P1-FGOUT-legacy-fwd0", fg, "out", "fadegrays", 11.5, 0),
    D("P2-FGOUT-legacy-back1f", fg, "out", "fadegrays", 11.5, 11.5333),
    D("P3-FGOUT-legacy-fwd1f", fg, "out", "fadegrays", 11.5, 11.4667),
    D("P4-SANITY-fwd0", san, null, null, 14.0333, 0),
    D("P5-SANITY-fwd1f", san, null, null, 14.0333, 14.0),
    D("P6-SANITY-back1f", san, null, null, 14.0333, 14.0667),
  ];
}

async function runCase(cdp, ruler, def) {
  if (def.preTarget !== undefined && def.preTarget !== null) {
    await scrubTo(cdp, ruler, def.preTarget);
  }
  const holdBefore = await cdp.evaluate(`window.__vcutHoldStats ? {...window.__vcutHoldStats} : null`);
  const scr = await scrubTo(cdp, ruler, def.target);
  let playhead = scr.snapped;
  let localT = playhead - def.clip.start;
  let { p, alpha, mode } = alphaFor(def, localT);
  const uncertain = scr.handleDeltaFrames !== 0 && scr.handleDeltaFrames !== null;
  const buildArg = (lt, al) => ({ file: def.clip.file, controlUrl: `${ORIGIN}/${def.clip.file}`,
    sourceT: Math.round(lt * 30) / 30, alpha: al, mode, footage: def.footage,
    fpsNative: def.fpsNative, sweep: def.footage });
  let m;
  try {
    m = await cdp.evaluate(`(${pageMeasureDip.toString()})(${JSON.stringify(buildArg(localT, alpha))})`, 120000);
  } catch (e) {
    return { ...def, status: "ERROR", error: `measure lỗi: ${e.message}`, scrub: scr, holdBefore };
  }
  if (m.error) return { ...def, status: "ERROR", error: m.error, scrub: scr, holdBefore };
  let retried = false, measurementInvalid = false;
  const isBg = (mean) => mean && Math.max(...mean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) <= 3;
  const expFar = m.correctMean && Math.max(...m.correctMean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) > 30;
  if (isBg(m.appMean) && expFar) {
    log(`  guard khung tối ${def.id}: appMean ~ nền khung, scrub lệch 1 frame rồi quay lại để ép seek mới`);
    retried = true;
    await scrubTo(cdp, ruler, def.target + 1 / 30);
    const scr2 = await scrubTo(cdp, ruler, def.target);
    playhead = scr2.snapped; localT = playhead - def.clip.start;
    ({ p, alpha, mode } = alphaFor(def, localT));
    try {
      const m2 = await cdp.evaluate(`(${pageMeasureDip.toString()})(${JSON.stringify(buildArg(localT, alpha))})`, 120000);
      if (!m2.error) m = m2;
    } catch {}
    if (isBg(m.appMean) && expFar) { measurementInvalid = true; log(`  guard khung tối ${def.id}: sau retry vẫn tối -> measurementInvalid`); }
  }
  const holdAfter = m.holdStats || null;
  const verdict = measurementInvalid ? "INVALID" : m.main.verdict;
  const rec = { ...def, target: def.target, playhead, localT, p, alpha, mode,
    mad: m.main.mad, le8: m.main.le8, maxDiff: m.main.maxDiff, verdict, uncertain,
    retried, measurementInvalid,
    oldChainMad: m.oldChain.mad, oldChainLe8: m.oldChain.le8, oldChainMaxDiff: m.oldChain.maxDiff,
    frameLockMad: m.frameLock.mad, frameLockLe8: m.frameLock.le8, frameLockMaxDiff: m.frameLock.maxDiff,
    sweep: m.sweep, handleDeltaFrames: scr.handleDeltaFrames, handleRaw: scr.handleRaw,
    nSamples: m.nSamples, canvasW: m.canvasW, canvasH: m.canvasH, scale: m.scale,
    letterbox: m.letterbox, sourceFrameIndex: m.sourceFrameIndex, fpsNative: m.fpsNative,
    edgeStart: m.edgeStart, edgeEnd: m.edgeEnd,
    appMean: m.appMean, correctMean: m.correctMean,
    controlVideo: m.controlVideo, holdBefore, holdAfter,
    indistinguishableFromDarkFrame: mode === "black" && alpha === 0,
    settled: scr.settled };
  const sweepStr = m.sweep ? ` sweep=${m.sweep.map((s) => `dk${s.dk >= 0 ? "+" : ""}${s.dk}:${s.mad.toFixed(3)}`).join(" ")}` : "";
  log(`  ${verdict} ${def.id}: playhead ${playhead} p=${p !== null ? p.toFixed(4) : "-"} alpha=${alpha.toFixed(4)} MAD=${m.main.mad.toFixed(4)} <=8=${(m.main.le8 * 100).toFixed(2)}% max=${m.main.maxDiff} | oldK3 MAD=${m.oldChain.mad.toFixed(3)} | lock MAD=${m.frameLock.mad.toFixed(4)}${sweepStr}${uncertain ? ` (CỜ vạch ${scr.handleDeltaFrames}f)` : ""}${measurementInvalid ? " (INVALID)" : ""}`);
  return rec;
}

// ------------------------------------------------------------- main ------
async function main() {
  log(`harness clicktest-dip-footage-round29-l1: bắt đầu (label=${RUN_LABEL}, display=${DISPLAY}, port=${PORT}, skipReg=${SKIP_REG}, skipFoot=${SKIP_FOOT}, probe=${PROBE})`);
  let xvfb = null, server = null, exitCode = 2;
  const regRecords = [], footRecords = [];
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    const vidDir = path.join(SCRATCH, "videos");
    fs.mkdirSync(vidDir, { recursive: true });
    let kPath = null;
    if (!SKIP_FOOT) {
      if (!fs.existsSync(K_SRC)) { log("BLOCKER: chưa có footage K tại " + K_SRC); return 2; }
      const sha = crypto.createHash("sha256").update(fs.readFileSync(K_SRC)).digest("hex");
      if (sha !== K_SHA) { log(`BLOCKER: SHA K không khớp J3 (${sha.slice(0, 16)}...)`); return 2; }
      log(`footage K OK: SHA khớp J3, ${fs.statSync(K_SRC).size} byte`);
      kPath = path.join(vidDir, "clip-k-dod-iwo.mp4");
      if (!fs.existsSync(kPath) || crypto.createHash("sha256").update(fs.readFileSync(kPath)).digest("hex") !== K_SHA) {
        fs.copyFileSync(K_SRC, kPath);
      }
    }
    if (!SKIP_REG) {
      if (!genVideos()) { log("BLOCKER: tạo video phẳng/gradient thất bại"); return 2; }
    }
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
    const holder = {};
    const cdp = await startChrome(holder);
    if (!cdp) { log("BLOCKER: không binary nào mở được pipe"); return 2; }
    try {
      if (!SKIP_REG && !PROBE) {
        await loadSession(cdp, seedSpecReg(), "R29L1 dip regression seed");
        const names = ["flat-red.mp4", "flat-green.mp4", "flat-magenta.mp4", "flat-custom.mp4", "grad-static.mp4"];
        await importMedia(cdp, names.map((n) => path.join(vidDir, n)), names);
        await calibrateHandle(cdp);
        const ruler = await getRuler(cdp);
        if (!ruler) throw new Error("không thấy .tl-ruler (phiên hồi quy)");
        if (ruler.y < 0 || ruler.y + ruler.h > ruler.innerH) throw new Error(`ruler ngoài viewport (hồi quy): ${JSON.stringify(ruler)}`);
        log(`ruler hồi quy: ${JSON.stringify(ruler)}`);
        for (const def of regCaseDefs()) {
          try { regRecords.push(await runCase(cdp, ruler, def)); }
          catch (e) { log(`  ERROR ${def.id}: ${e.message}`); regRecords.push({ ...def, status: "ERROR", error: e.message }); }
        }
      }
      if (!SKIP_FOOT || PROBE) {
        await loadSession(cdp, seedSpecFoot(), "R29L1 dip footage seed");
        await importMedia(cdp, [kPath], ["clip-k-dod-iwo.mp4"]);
        const proxyDiag = await cdp.evaluate(`(() => {
          const badge = document.querySelector(".preview-proxy-badge");
          const mediaProxy = [...document.querySelectorAll(".media-proxy")].map((el) => (el.textContent || "").trim());
          const toasts = [...document.querySelectorAll(".toast, [class*=toast]")].map((el) => (el.textContent || "").trim()).slice(0, 8);
          return { badge: badge ? badge.textContent : null, badgeDisplay: badge ? badge.style.display : null, mediaProxy, toasts };
        })()`);
        log(`  footage proxy diag: ${JSON.stringify(proxyDiag)}`);
        footRecords.push({ id: "FOOT-PROXY-DIAG", proxyDiag, gating: false });
        await calibrateHandle(cdp);
        const ruler2 = await getRuler(cdp);
        if (!ruler2) throw new Error("không thấy .tl-ruler (phiên footage)");
        if (ruler2.y < 0 || ruler2.y + ruler2.h > ruler2.innerH) throw new Error(`ruler ngoài viewport (footage): ${JSON.stringify(ruler2)}`);
        log(`ruler footage: ${JSON.stringify(ruler2)}`);
        for (const def of (PROBE ? probeCaseDefs() : footCaseDefs())) {
          try { footRecords.push(await runCase(cdp, ruler2, def)); }
          catch (e) { log(`  ERROR ${def.id}: ${e.message}`); footRecords.push({ ...def, status: "ERROR", error: e.message }); }
        }
      }
      const exc = cdp.exceptions.length;
      log(`exceptions trong phiên: ${exc}${exc ? ` (đầu: ${JSON.stringify(cdp.exceptions[0]).slice(0, 300)})` : ""}`);
      const regCases = regRecords.filter((r) => r.verdict !== undefined);
      const footCases = footRecords.filter((r) => r.verdict !== undefined);
      const regPass = regCases.filter((r) => r.verdict === "KHỚP").length;
      const footPass = footCases.filter((r) => r.verdict === "KHỚP").length;
      const regBad = regCases.filter((r) => r.verdict !== "KHỚP").map((r) => r.id);
      const footBad = footCases.filter((r) => r.verdict !== "KHỚP").map((r) => `${r.id}(${r.verdict})`);
      log(`TỔNG: hồi quy ${regPass}/${regCases.length} KHỚP${regBad.length ? ` — KHÔNG KHỚP: ${regBad.join(", ")}` : ""}; footage ${footPass}/${footCases.length} KHỚP${footBad.length ? ` — KHÔNG KHỚP: ${footBad.join(", ")}` : ""}`);
      if (PROBE) {
        // Probe là chẩn đoán, không gating verdict: exit 0 khi harness
        // chạy xong và mọi probe đều có verdict (kể cả XẤP XỈ/LỆCH).
        const probeErr = footRecords.filter((r) => r.status === "ERROR");
        exitCode = probeErr.length ? 1 : 0;
        log(`PROBE: ${footCases.length} probe có verdict, ${probeErr.length} ERROR — exit=${exitCode} (diagnostic, không gating verdict)`);
      } else {
        exitCode = (regCases.length === (SKIP_REG ? 0 : 18) && regPass === regCases.length &&
          footCases.length === (SKIP_FOOT ? 0 : 15) && footPass === footCases.length && exc === 0) ? 0 : 1;
      }
      if (SKIP_REG || SKIP_FOOT) log("LƯU Ý: chạy rút gọn (skip 1 phiên) nên exit code chỉ phản ánh phiên đã chạy");
      log(`DONE r29l1: exit=${exitCode}`);
      const outJson = { run: RUN_LABEL, date: new Date().toISOString(),
        bundle: snap.bundle, bundleSha256_16: snap.sha, display: DISPLAY, port: PORT, origin: ORIGIN,
        probe: PROBE,
        footage: { file: "clip-k-dod-iwo.mp4", sha256: K_SHA, license: "publicdomain (IA metadata licenseurl, theo kiểm chứng K3/L1; SHA khớp J3)", ffprobe: "h264 1080x1920 24000/1001 bt709" },
        regression: regRecords, footage: footRecords, exceptions: cdp.exceptions, log: logLines };
      const outPath = path.join(ROOT, "benchmarks", "results", PROBE ? "v29-l1-dip-footage-probe2.json" : "v29-l1-dip-footage.json");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(outJson, null, 2));
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
