#!/usr/bin/env node
/**
 * clicktest-dip-seek-round30-m1.mjs — Phase 9 đợt 30, luồng M1:
 * chạy lại harness K3 sau vá (đợt 29 L1 §7) bằng browser thật, và
 * truy nguyên cơ chế chọn frame theo lịch sử scrub (nợ đợt 29 §3.2)
 * bằng probe đọc TRẠNG THÁI SEEK THẬT của video element trong app.
 *
 * Bối cảnh: đợt 29 L1 vá harness K3 tối thiểu (bỏ Math.round tọa độ
 * 438 -> 437,5; cột resampled rẽ nhánh: sanity 1 bước, dip 2 bước)
 * nhưng mới qua node --check, CHƯA chạy lại end-to-end bằng browser.
 * 2 anomaly (FG-OUT legacy p=0,5 MAD 2,527; SANITY MAD 3,303) đều khớp
 * từng bit ở frame kề sau (dk+1 = 0,000) — nghi là hiệu ứng chọn
 * frame theo lịch sử scrub, chưa đủ căn cứ sửa code sản phẩm.
 *
 * Probe này tách hai cửa mà L1 §5.4 chưa tách được:
 *  - Cửa app-seek: element pool của app (MediaPool.videoFor, KHÔNG
 *    gắn DOM) đang seeking? currentTime bằng bao nhiêu? seeked bắn
 *    lúc nào so với thời điểm canvas ổn định?
 *  - Cửa harness-capture: settle bằng hash canvas có "ổn định giả"
 *    trên frame cũ trong lúc seek còn bay không?
 * Cách đọc: hook đo cài TRONG TRANG (không sửa code sản phẩm):
 * document.createElement("video") được bọc để gắn listener
 * seeking/seeked + gán id cho mọi video element; setter currentTime
 * trên HTMLVideoElement.prototype được bọc để log mọi lần app gán
 * seek (chỉ forward qua setter gốc). Element pool được nhận diện
 * bằng src blob: còn hiệu lực tại thời điểm snapshot (control video
 * của harness dùng URL http, thumbnail đã src="" nên không nhầm).
 * Mỗi probe: prescrub theo hướng tiếp cận -> click tới target KHÔNG
 * settle -> poll element + hash canvas mỗi 150ms tới 6s -> đo pixel
 * (pageMeasureDip của L1, chuỗi đúng + sweep dk -2..+2) -> chờ idle
 * 2s rồi snapshot lại element + hash (kiểm tra frame có tự trôi về
 * frame đúng khi không scrub thêm không).
 *
 * Ma trận probe (11 probe, cùng seed footage K của L1, 1 clip K duy
 * nhất cho mọi clip): FG-OUT legacy (dip gray) và SANITY (đường
 * thường) mỗi loại back1f / fwd1f / fwd0 — lặp lại cặp P2/P6 của L1 —
 * cộng FW-OUT legacy back1f/fwd1f (dip white) và FB-OUT legacy
 * back1f/fwd1f (fadeblack, đường 1 bước) để tách "hướng scrub" khỏi
 * "đường vẽ/clip"; SANITY back1f chạy 2 lần trong phiên để kiểm tra
 * tính lặp lại trong phiên (L1 P6 đã 2/2 qua 2 phiên).
 *
 * Thoát mã: 0 = mọi probe đều có verdict pixel + chuỗi poll đầy đủ
 * (diagnostic, KHÔNG gating KHỚP — LỆCH ở đây là dữ liệu, không
 * phải fail harness); 1 = có probe ERROR; 2 = blocker hạ tầng.
 * Kết quả JSON: benchmarks/results/v30-m1-seek-probe.json.
 * V2 (sau chạy v1): (a) tóm tắt dùng activePoolElement (blob rs cao
 * nhất) thay vì blob đầu tiên — v1 có 3 blob (2 probe/thumb inert
 * rs=0/ct=0 + 1 pool thật rs=4), tóm tắt log v1 ghi ct=0 sai lệch
 * (dữ liệu thô JSON v1 vẫn đủ, đã phân tích lại đúng); (b) lần đo
 * đầu tối thì KHÔNG scrub detour nữa mà ghi DARK-FIRST + đo lại sau
 * idle không scrub (detour phá hướng scrub gốc); (c) R30M1_ONLY lọc
 * probe theo chuỗi id, JSON ra file ...-v2.json riêng.
 * Scratch: ~/workspace/tmp-round30-m1/ (video K copy + snapshot
 * dist), không đưa binary vào repo. KHÔNG push, KHÔNG GitHub
 * connector, KHÔNG tag, KHÔNG sửa code sản phẩm.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-dip-seek-round30-m1.mjs
 * Biến môi trường: R30M1_DISPLAY (mặc định :94), R30M1_PORT (4194),
 * R30M1_RUN_LABEL.
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round30-m1");
const K_SRC = path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage", "clip-k-dod-iwo.mp4");
const K_SHA = "49f33b83f0e7694e560557e08379b4bef628fed4f89662898764d5c12db6d69c";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.R30M1_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.R30M1_DISPLAY || ":94";
const PORT = Number(process.env.R30M1_PORT || 4194);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.R30M1_RUN_LABEL || "r30m1-run1";
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


// ------------------------------------------------------------- probe ---
// Ma trận probe đợt 30 M1: mỗi đường vẽ (thường / fadeblack 1 bước /
// fadewhite dip 2 bước / fadegrays dip 2 bước) có 1 target phân biệt
// được frame thật (alpha giữa hoặc dip xám theo pixel — KHÔNG dùng
// target alpha = 0 của fadeblack/fadewhite vì đầu ra không phụ thuộc
// frame). L1 P2/P6 được lặp lại đúng dạng (FG-OUT legacy 11,5 và
// SANITY 14,0333, bước lùi đúng 1 frame 30fps).
function probeCaseDefs() {
  const FPSK = 24000 / 1001;
  const fb = { start: 0, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const fw = { start: 4, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const fg = { start: 8, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const san = { start: 12, dur: 4, file: "clip-k-dod-iwo.mp4" };
  const D = (id, clip, window, type, target, preTarget) =>
    ({ id, clip, window, type, target, footage: true, fpsNative: FPSK, preTarget });
  return [
    D("M1-FGOUT-legacy-back1f", fg, "out", "fadegrays", 11.5, 11.5333),
    D("M1-FGOUT-legacy-fwd1f", fg, "out", "fadegrays", 11.5, 11.4667),
    D("M1-FGOUT-legacy-fwd0", fg, "out", "fadegrays", 11.5, 0),
    D("M1-SANITY-back1f", san, null, null, 14.0333, 14.0667),
    D("M1-SANITY-fwd1f", san, null, null, 14.0333, 14.0),
    D("M1-SANITY-fwd0", san, null, null, 14.0333, 0),
    D("M1-SANITY-back1f-repeat", san, null, null, 14.0333, 14.0667),
    D("M1-FWIN-legacy-back1f", fw, "in", "fadewhite", 4.5, 4.5333),
    D("M1-FWIN-legacy-fwd1f", fw, "in", "fadewhite", 4.5, 4.4667),
    D("M1-FBOUT-p01-back1f", fb, "out", "fadeblack", 3.1, 3.1333),
    D("M1-FBOUT-p01-fwd1f", fb, "out", "fadeblack", 3.1, 3.0667),
  ];
}

// Hook đo cài trong trang (KHÔNG sửa code sản phẩm): bọc
// document.createElement("video") để gắn listener seeking/seeked +
// id, và bọc setter currentTime trên HTMLVideoElement.prototype để
// log mọi lần app gán seek (chỉ forward qua setter gốc). Hàm này
// được stringify sang trang nên KHÔNG dùng backtick / ${} bên trong.
function installElementProbe() {
  if (window.__r30m1) return { already: true };
  var st = { nextId: 1, byEl: [], events: [], sets: [], setterError: null };
  window.__r30m1 = st;
  var origCreate = document.createElement.bind(document);
  document.createElement = function (tag) {
    var el = origCreate.apply(document, arguments);
    if (typeof tag === "string" && tag.toLowerCase() === "video") {
      var id = st.nextId++;
      el.__r30m1id = id;
      st.byEl.push({ id: id, el: el });
      el.addEventListener("seeking", function () {
        st.events.push({ t: Math.round(performance.now()), kind: "seeking", id: id, ct: el.currentTime, src: (el.currentSrc || el.src || "").slice(0, 12) });
      });
      el.addEventListener("seeked", function () {
        st.events.push({ t: Math.round(performance.now()), kind: "seeked", id: id, ct: el.currentTime, src: (el.currentSrc || el.src || "").slice(0, 12) });
      });
    }
    return el;
  };
  try {
    var desc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, "currentTime");
    if (desc && desc.set) {
      var origSet = desc.set;
      Object.defineProperty(window.HTMLVideoElement.prototype, "currentTime", {
        configurable: true, enumerable: !!desc.enumerable, get: desc.get,
        set: function (v) {
          var id = (this.__r30m1id !== undefined) ? this.__r30m1id : -1;
          st.sets.push({ t: Math.round(performance.now()), id: id, value: v, src: (this.currentSrc || this.src || "").slice(0, 12) });
          if (st.sets.length > 20000) st.sets.splice(0, 1000);
          origSet.call(this, v);
        },
      });
    } else { st.setterError = "no currentTime descriptor"; }
  } catch (e) { st.setterError = String(e).slice(0, 200); }
  return { installed: true, setterError: st.setterError };
}

// Snapshot trạng thái element + hash canvas (hash bước 256 cho nhanh,
// chỉ dùng so ổn định trong cùng probe, không so giữa các probe).
function snapshotElements() {
  var st = window.__r30m1;
  if (!st) return { error: "probe chưa cài" };
  var canvas = document.querySelector("#vcut-preview-wrap canvas");
  var hash = null;
  if (canvas) {
    try {
      var ctx = canvas.getContext("2d");
      var d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      var s = 0;
      for (var i = 0; i < d.length; i += 256) s = (s + d[i] + d[i + 1] * 2 + d[i + 2] * 3) % 1000000007;
      hash = s;
    } catch (e) { hash = null; }
  }
  var els = st.byEl.map(function (rec) {
    var el = rec.el;
    var src = el.currentSrc || el.src || "";
    var kind = src.slice(0, 5) === "blob:" ? "blob" : (src.slice(0, 4) === "http" ? "http" : "empty/other");
    return { id: rec.id, srcKind: kind, srcHead: src.slice(0, 40),
      seeking: el.seeking, currentTime: el.currentTime, readyState: el.readyState,
      paused: el.paused, videoW: el.videoWidth };
  });
  return { t: Math.round(performance.now()), canvasHash: hash, elements: els,
    holdStats: window.__vcutHoldStats ? { draw: window.__vcutHoldStats.draw, skip: window.__vcutHoldStats.skip, hold: window.__vcutHoldStats.hold } : null,
    nEvents: st.events.length, nSets: st.sets.length };
}

/** Click tới target KHÔNG settle, rồi poll element + hash mỗi ~150ms. */
async function pollAfterClick(cdp, ruler, target) {
  const y = Math.round(ruler.y + ruler.h / 2);
  const wantX = ruler.x + target * 60;
  const res = await cdp.clickRect({ x: wantX, y, width: 0, height: 0 });
  const series = [];
  const t0 = Date.now();
  for (let i = 0; i < 30; i++) {
    const snap = await cdp.evaluate(`(${snapshotElements.toString()})()`, 30000);
    series.push({ i, wallMs: Date.now() - t0, t: snap.t, canvasHash: snap.canvasHash, elements: snap.elements, holdStats: snap.holdStats });
    const pool = snap.elements.filter((e) => e.srcKind === "blob");
    const last3 = series.slice(-3);
    const hashStable = last3.length === 3 && last3.every((s) => s.canvasHash === series[series.length - 1].canvasHash);
    const seekDone = pool.length > 0 && pool.every((e) => !e.seeking);
    if (i >= 5 && hashStable && seekDone) break;
    await sleep(150);
  }
  return { dispatchedX: res.x, series };
}

/** Poll snapshot KHÔNG click (dùng sau lần đo đầu tối: đo lại sau idle
 *  mà không scrub thêm, để không phá hướng scrub gốc của probe). */
async function pollOnly(cdp, maxPolls) {
  const series = [];
  const t0 = Date.now();
  for (let i = 0; i < maxPolls; i++) {
    const snap = await cdp.evaluate(`(${snapshotElements.toString()})()`, 30000);
    series.push({ i, wallMs: Date.now() - t0, t: snap.t, canvasHash: snap.canvasHash, elements: snap.elements, holdStats: snap.holdStats });
    const last3 = series.slice(-3);
    if (i >= 2 && last3.every((s) => s.canvasHash === series[series.length - 1].canvasHash)) break;
    await sleep(150);
  }
  return series;
}

/** Element pool THẬT trong một danh sách snapshot: blob + readyState
 *  cao nhất (v1: element probe/thumb rs=0/ct=0 làm nhiễu tóm tắt khi
 *  lấy phần tử blob đầu tiên — element vẽ thật có rs=4 và ct bám theo
 *  scrub; xem LIMITS v1 §4). Trả null nếu không có blob nào. */
function activePoolElement(elements) {
  const blob = (elements || []).filter((e) => e.srcKind === "blob");
  if (!blob.length) return null;
  blob.sort((a, b) => (b.readyState - a.readyState) || (a.id - b.id));
  return blob[0];
}

/** Đọc vạch sau poll, tính playhead snap như scrubTo (không settle lại). */
async function handleCheck(cdp, dispatchedX) {
  const check = await cdp.evaluate(`(() => {
    const el = document.querySelector(".tl-ruler");
    const handle = document.querySelector(".tl-playhead-handle");
    if (!el || !handle) return null;
    const r = el.getBoundingClientRect(), hr = handle.getBoundingClientRect();
    const zoom = document.querySelector(".tl-zoom input");
    const pps = zoom ? Number(zoom.value) : 60;
    return { rulerLeft: r.x, handleLeft: hr.x, pps };
  })()`);
  if (!check) return { snapped: null, handleDeltaFrames: null };
  const rawPred = (dispatchedX - check.rulerLeft) / 60;
  const snapped = Math.round(rawPred * 30) / 30;
  const handleRaw = (check.handleLeft - check.rulerLeft - HANDLE_OFFSET) / (check.pps || 60);
  const handleSnap = Math.round(handleRaw * 30) / 30;
  return { snapped, handleRaw, handleSnap, handleDeltaFrames: Math.round((handleSnap - snapped) * 30), pps: check.pps };
}

async function runProbeCase(cdp, ruler, def) {
  let preScrub = null;
  if (def.preTarget !== undefined && def.preTarget !== null) {
    preScrub = await scrubTo(cdp, ruler, def.preTarget);
  }
  const setIdx = await cdp.evaluate(`window.__r30m1 ? window.__r30m1.sets.length : -1`);
  const evIdx = await cdp.evaluate(`window.__r30m1 ? window.__r30m1.events.length : -1`);
  const holdBefore = await cdp.evaluate(`window.__vcutHoldStats ? {...window.__vcutHoldStats} : null`);
  const poll = await pollAfterClick(cdp, ruler, def.target);
  const handle = await handleCheck(cdp, poll.dispatchedX);
  let playhead = handle.snapped;
  let localT = playhead - def.clip.start;
  let { p, alpha, mode } = alphaFor(def, localT);
  const uncertain = handle.handleDeltaFrames !== 0 && handle.handleDeltaFrames !== null;
  const buildArg = (lt, al) => ({ file: def.clip.file, controlUrl: `${ORIGIN}/${def.clip.file}`,
    sourceT: Math.round(lt * 30) / 30, alpha: al, mode, footage: def.footage,
    fpsNative: def.fpsNative, sweep: def.footage });
  let m;
  try {
    m = await cdp.evaluate(`(${pageMeasureDip.toString()})(${JSON.stringify(buildArg(localT, alpha))})`, 120000);
  } catch (e) {
    return { ...def, status: "ERROR", error: `measure lỗi: ${e.message}`, poll: poll.series, handle };
  }
  if (m.error) return { ...def, status: "ERROR", error: m.error, poll: poll.series, handle };
  // V2 (sửa sau v1): lần đo đầu tối thì KHÔNG scrub detour nữa — detour
  // là một bước scrub mới và phá hướng scrub gốc cần đo (v1 §4). Thay
  // vào đó ghi DARK-FIRST, chờ idle 2s, poll lại và đo lại KHÔNG scrub;
  // verdict chính vẫn là lần đo đầu (DARK-FIRST), lần đo sau chỉ là
  // follow-up (secondMeasure).
  let darkFirst = false, secondMeasure = null;
  const isBg = (mean) => mean && Math.max(...mean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) <= 3;
  const expFar = m.correctMean && Math.max(...m.correctMean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) > 30;
  if (isBg(m.appMean) && expFar) {
    darkFirst = true;
    log(`  khung tối lần đo đầu ${def.id}: appMean ~ nền khung — KHÔNG scrub detour (v2), chờ idle 2s rồi đo lại không scrub`);
    await sleep(2000);
    const repoll = await pollOnly(cdp, 12);
    try {
      const m2 = await cdp.evaluate(`(${pageMeasureDip.toString()})(${JSON.stringify(buildArg(localT, alpha))})`, 120000);
      if (!m2.error) {
        secondMeasure = { mad: m2.main.mad, le8: m2.main.le8, maxDiff: m2.main.maxDiff,
          verdict: m2.main.verdict, sweep: m2.sweep, appMean: m2.appMean, repollHashes: repoll.map((s) => s.canvasHash) };
        log(`  đo lại sau idle ${def.id}: ${secondMeasure.verdict} MAD=${secondMeasure.mad.toFixed(4)} sweep=${m2.sweep.map((s) => `dk${s.dk >= 0 ? "+" : ""}${s.dk}:${s.mad.toFixed(3)}`).join(" ")}`);
      }
    } catch (e) { log(`  đo lại sau idle ${def.id} lỗi: ${e.message}`); }
  }
  const holdAfter = m.holdStats || null;
  await sleep(2000);
  const afterIdle = await cdp.evaluate(`(${snapshotElements.toString()})()`, 30000);
  const setsSlice = await cdp.evaluate(`window.__r30m1 ? window.__r30m1.sets.slice(${setIdx}) : []`);
  const evSlice = await cdp.evaluate(`window.__r30m1 ? window.__r30m1.events.slice(${evIdx}) : []`);
  const poolSets = setsSlice.filter((s) => (s.src || "").slice(0, 5) === "blob:");
  const poolEvents = evSlice.filter((s) => (s.src || "").slice(0, 5) === "blob:");
  // Tóm tắt chuỗi poll (v2): element pool THẬT = blob có readyState
  // cao nhất (không lấy blob đầu tiên như v1 — probe/thumb rs=0/ct=0
  // làm sai tóm tắt, xem LIMITS v1 §4). Log in đủ ct của mọi blob để
  // không bao giờ mạo nhận một element inert là pool nữa.
  const series = poll.series;
  const lastPoll = series[series.length - 1];
  const poolLast = lastPoll.elements.filter((e) => e.srcKind === "blob");
  const activeLast = activePoolElement(lastPoll.elements);
  const finalHash = lastPoll.canvasHash;
  let hashStableFrom = -1;
  for (let i = 0; i < series.length; i++) {
    if (series[i].canvasHash === finalHash && series.slice(i).every((s) => s.canvasHash === finalHash)) { hashStableFrom = i; break; }
  }
  const activeAtStable = hashStableFrom >= 0 ? activePoolElement(series[hashStableFrom].elements) : null;
  const expectedCt = Math.round(localT * 30) / 30;
  const ctAtCapture = activeLast ? activeLast.currentTime : null;
  const ctMatches = ctAtCapture !== null && Math.abs(ctAtCapture - expectedCt) <= 0.017;
  const seekingAtStable = activeAtStable ? activeAtStable.seeking : null;
  const ctAtStable = activeAtStable ? activeAtStable.currentTime : null;
  const ctMatchesAtStable = ctAtStable !== null && Math.abs(ctAtStable - expectedCt) <= 0.017;
  const hashDriftedAfterIdle = afterIdle.canvasHash !== null && finalHash !== null && afterIdle.canvasHash !== finalHash;
  const poolAfterIdle = afterIdle.elements.filter((e) => e.srcKind === "blob");
  const activeAfterIdle = activePoolElement(afterIdle.elements);
  const verdict = darkFirst ? "DARK-FIRST" : m.main.verdict;
  const rec = { ...def, target: def.target, playhead, localT, p, alpha, mode,
    mad: m.main.mad, le8: m.main.le8, maxDiff: m.main.maxDiff, verdict, uncertain,
    darkFirst, secondMeasure, preScrub: preScrub ? { snapped: preScrub.snapped, handleDeltaFrames: preScrub.handleDeltaFrames } : null,
    sweep: m.sweep, frameLockMad: m.frameLock.mad, frameLockLe8: m.frameLock.le8,
    handleDeltaFrames: handle.handleDeltaFrames, handleRaw: handle.handleRaw,
    nSamples: m.nSamples, canvasW: m.canvasW, canvasH: m.canvasH, scale: m.scale,
    letterbox: m.letterbox, sourceFrameIndex: m.sourceFrameIndex, fpsNative: m.fpsNative,
    edgeStart: m.edgeStart, edgeEnd: m.edgeEnd,
    appMean: m.appMean, correctMean: m.correctMean,
    controlVideo: m.controlVideo, holdBefore, holdAfter,
    poll: { nPolls: series.length, pollWallMs: lastPoll.wallMs,
      hashStableFrom, seekingAtStable, ctAtStable, ctMatchesAtStable,
      ctAtCapture, expectedCt, ctMatches, activeIdAtCapture: activeLast ? activeLast.id : null,
      poolIdsAtCapture: poolLast.map((e) => e.id),
      series: series.map((s) => ({ i: s.i, wallMs: s.wallMs, hash: s.canvasHash,
        pool: s.elements.filter((e) => e.srcKind === "blob").map((e) => ({ id: e.id, seeking: e.seeking, ct: Math.round(e.currentTime * 10000) / 10000, rs: e.readyState, paused: e.paused })) })) },
    poolSets, poolEvents,
    afterIdle: { canvasHash: afterIdle.canvasHash, hashDriftedAfterIdle, activeId: activeAfterIdle ? activeAfterIdle.id : null,
      pool: poolAfterIdle.map((e) => ({ id: e.id, seeking: e.seeking, ct: e.currentTime, rs: e.readyState, paused: e.paused })) } };
  const sweepStr = m.sweep ? ` sweep=${m.sweep.map((s) => `dk${s.dk >= 0 ? "+" : ""}${s.dk}:${s.mad.toFixed(3)}`).join(" ")}` : "";
  const blobCts = poolLast.map((e) => `#${e.id}:ct=${e.currentTime},rs=${e.readyState},seek=${e.seeking}`).join(" ");
  log(`  ${verdict} ${def.id}: playhead ${playhead} p=${p !== null ? p.toFixed(4) : "-"} alpha=${alpha.toFixed(4)} MAD=${m.main.mad.toFixed(4)} <=8=${(m.main.le8 * 100).toFixed(2)}% max=${m.main.maxDiff}${sweepStr} | poll: ${series.length} lần, hash ổn định từ #${hashStableFrom}, active pool #${activeLast ? activeLast.id : "-"} lúc ổn định: seeking=${seekingAtStable} ct=${ctAtStable} (khớp kỳ vọng ${expectedCt}: ${ctMatchesAtStable}), lúc đo: ct=${ctAtCapture} khớp=${ctMatches}, mọi blob lúc đo: [${blobCts}], sets pool=${poolSets.length} events pool=${poolEvents.length}, idle2s: hash đổi=${hashDriftedAfterIdle}${uncertain ? ` (CỜ vạch ${handle.handleDeltaFrames}f)` : ""}${darkFirst ? " (DARK-FIRST, xem secondMeasure)" : ""}`);
  return rec;
}

// ------------------------------------------------------------- main ------
async function main() {
  log(`harness clicktest-dip-seek-round30-m1: bắt đầu (label=${RUN_LABEL}, display=${DISPLAY}, port=${PORT})`);
  let xvfb = null, server = null, exitCode = 2;
  const probeRecords = [];
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    const vidDir = path.join(SCRATCH, "videos");
    fs.mkdirSync(vidDir, { recursive: true });
    if (!fs.existsSync(K_SRC)) { log("BLOCKER: chưa có footage K tại " + K_SRC); return 2; }
    const sha = crypto.createHash("sha256").update(fs.readFileSync(K_SRC)).digest("hex");
    if (sha !== K_SHA) { log(`BLOCKER: SHA K không khớp J3 (${sha.slice(0, 16)}...)`); return 2; }
    log(`footage K OK: SHA khớp J3, ${fs.statSync(K_SRC).size} byte`);
    const kPath = path.join(vidDir, "clip-k-dod-iwo.mp4");
    if (!fs.existsSync(kPath) || crypto.createHash("sha256").update(fs.readFileSync(kPath)).digest("hex") !== K_SHA) {
      fs.copyFileSync(K_SRC, kPath);
    }
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) { log("BLOCKER: dist snapshot thất bại"); return 2; }
    fs.copyFileSync(kPath, path.join(snap.dir, "clip-k-dod-iwo.mp4"));
    log(`video K đã copy vào snapshot`);
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }
    const holder = {};
    const cdp = await startChrome(holder);
    if (!cdp) { log("BLOCKER: không binary nào mở được pipe"); return 2; }
    try {
      await loadSession(cdp, seedSpecFoot(), "R30M1 seek probe seed");
      const installed = await cdp.evaluate(`(${installElementProbe.toString()})()`, 30000);
      log(`  hook element probe: ${JSON.stringify(installed)}`);
      if (installed.setterError) log(`  CẢNH BÁO: setter currentTime không bọc được (${installed.setterError}) — log sets sẽ thiếu, nhưng seeking/seeked + poll vẫn đo được`);
      await importMedia(cdp, [kPath], ["clip-k-dod-iwo.mp4"]);
      const proxyDiag = await cdp.evaluate(`(() => {
        const badge = document.querySelector(".preview-proxy-badge");
        const mediaProxy = [...document.querySelectorAll(".media-proxy")].map((el) => (el.textContent || "").trim());
        const toasts = [...document.querySelectorAll(".toast, [class*=toast]")].map((el) => (el.textContent || "").trim()).slice(0, 8);
        return { badge: badge ? badge.textContent : null, badgeDisplay: badge ? badge.style.display : null, mediaProxy, toasts };
      })()`);
      log(`  footage proxy diag: ${JSON.stringify(proxyDiag)}`);
      probeRecords.push({ id: "PROXY-DIAG", proxyDiag, gating: false });
      await calibrateHandle(cdp);
      const ruler = await getRuler(cdp);
      if (!ruler) throw new Error("không thấy .tl-ruler");
      if (ruler.y < 0 || ruler.y + ruler.h > ruler.innerH) throw new Error(`ruler ngoài viewport: ${JSON.stringify(ruler)}`);
      log(`ruler: ${JSON.stringify(ruler)}`);
      // Warm-up: scrub tới 1,0 để pool element được tạo rồi mới đo.
      await scrubTo(cdp, ruler, 1.0);
      const warm = await cdp.evaluate(`(${snapshotElements.toString()})()`, 30000);
      const warmPool = warm.elements.filter((e) => e.srcKind === "blob");
      log(`  warm-up: pool blob elements = ${warmPool.length} (ids ${warmPool.map((e) => e.id).join(",") || "-"}), tổng video tracked = ${warm.elements.length}`);
      if (warmPool.length !== 1) log(`  CẢNH BÁO: warm-up thấy ${warmPool.length} pool element (kỳ vọng đúng 1) — v2 dùng activePoolElement (blob rs cao nhất), không lấy blob đầu tiên`);
      const onlyFilter = (process.env.R30M1_ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
      const defs = onlyFilter.length ? probeCaseDefs().filter((d) => onlyFilter.some((f) => d.id.includes(f))) : probeCaseDefs();
      log(`  chạy ${defs.length} probe${onlyFilter.length ? ` (lọc R30M1_ONLY=${onlyFilter.join(",")})` : ""}`);
      for (const def of defs) {
        try { probeRecords.push(await runProbeCase(cdp, ruler, def)); }
        catch (e) { log(`  ERROR ${def.id}: ${e.message}`); probeRecords.push({ ...def, status: "ERROR", error: e.message }); }
      }
      const exc = cdp.exceptions.length;
      log(`exceptions trong phiên: ${exc}${exc ? ` (đầu: ${JSON.stringify(cdp.exceptions[0]).slice(0, 300)})` : ""}`);
      const cases = probeRecords.filter((r) => r.verdict !== undefined);
      const errs = probeRecords.filter((r) => r.status === "ERROR");
      const khop = cases.filter((r) => r.verdict === "KHỚP").map((r) => r.id);
      const khongKhop = cases.filter((r) => r.verdict !== "KHỚP").map((r) => `${r.id}(${r.verdict}, dk0=${r.mad.toFixed(3)}, dk+1=${r.sweep ? r.sweep.find((s) => s.dk === 1).mad.toFixed(3) : "-"})`);
      log(`TỔNG PROBE: ${cases.length} có verdict, KHỚP ${khop.length}, KHÔNG KHỚP: ${khongKhop.join("; ") || "-"}, ERROR: ${errs.length}`);
      exitCode = errs.length ? 1 : 0;
      log(`DONE r30m1-probe: exit=${exitCode} (diagnostic, không gating verdict)`);
      const outJson = { run: RUN_LABEL, date: new Date().toISOString(),
        bundle: snap.bundle, bundleSha256_16: snap.sha, display: DISPLAY, port: PORT, origin: ORIGIN,
        footage: { file: "clip-k-dod-iwo.mp4", sha256: K_SHA, ffprobe: "h264 1080x1920 24000/1001 bt709" },
        probes: probeRecords, exceptions: cdp.exceptions, log: logLines };
      const outPath = path.join(ROOT, "benchmarks", "results",
        (process.env.R30M1_ONLY ? "v30-m1-seek-probe-v2.json" : "v30-m1-seek-probe.json"));
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
