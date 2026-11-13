#!/usr/bin/env node
/**
 * clicktest-split-intermediate-pipe.mjs — Phase 9 đợt 26, luồng J6:
 * click-test browser thật cho 2 tính năng panel đợt 25 chưa từng được
 * click-test (nợ trong LIMITS I2 §"Chưa phủ" (1) và LIMITS I3 §3):
 *  (I2) panel tách lá sâu theo mốc ngoài: ô nhập + nút "Lấy từ playhead"
 *       + nút "Tách lá tại mốc ngoài" (store action
 *       splitNestedDeepInnerClipAtOuterOffset, đảo τ đợt 24 H1);
 *  (I3) panel lá sâu dùng check object + action vị trí nested trung gian
 *       sâu (DeepIntermediateEditor qua updateNestedDeepIntermediateClip).
 * KHÔNG Playwright. Kế thừa harness đợt 25 I6 (pipe CDP + snapshot dist
 * + seed qua autosave + đóng WelcomeModal trước mọi thao tác đo):
 * - Chrome headed dưới Xvfb qua --remote-debugging-pipe; click thật bằng
 *   Input.dispatchMouseEvent; gõ input bằng CDP key event thật (char),
 *   chỉ fallback native setter khi giá trị gõ không khớp (ghi rõ).
 * - Editor chạy bằng BẢN SAO dist tại thời điểm harness bắt đầu
 *   (snapshot vào scratch): các luồng J1–J5 có thể build lại dist song
 *   song — phục vụ dist trực tiếp sẽ làm bundle đổi giữa chừng.
 *   Snapshot bị BLOCKER nếu bundle không chứa đồng thời "Lấy từ
 *   playhead" (I2), "deepLevelHead" (H6) và "curveCreate" (T4 trở lên).
 * - Seed qua autosave (localStorage key vcut-studio:autosave:v1).
 * - RelinkPanel (nếu hiện vì media seed thiếu) được đóng bằng click thật
 *   vào nút "Đóng (bỏ qua)" trước mọi thao tác đo (setup, không case).
 * - WelcomeModal: tắt bằng localStorage vcut-welcomed=1 trước reload.
 *
 * Thoát mã: 0 = mọi case pass (case SEED-REJECTED không tính fail nhưng
 * được báo riêng); 1 = có case fail trên UI thật; 2 = blocker hạ tầng.
 * Kết quả JSON: benchmarks/results/clicktest-split-intermediate-r26j6.json
 * (parent quyết có stage hay không). Không sửa code sản phẩm, không push,
 * không tag/release, không cài dependency, không binary vào repo.
 * Scratch đo (snapshot dist) nằm ở ~/workspace/tmp-round26-j6/ và được
 * luồng dọn cuối lượt.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-split-intermediate-pipe.mjs
 * Biến môi trường: J6_DISPLAY (mặc định :96), J6_PORT (mặc định 4196),
 * J6_RUN_LABEL (nhãn run ghi vào JSON).
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round27-k6");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.K6_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.K6_DISPLAY || ":98";
const PORT = Number(process.env.K6_PORT || 4198);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.K6_RUN_LABEL || "run1";
// Đợt 32 O2: mặc định "guard" — message ô trống đã sửa có chủ đích ở đợt 27
// (K6) thành "Chưa nhập mốc ngoài (ô đang trống) — không tách."; baseline cũ
// (đòi OutOfRange cho ô trống) chỉ còn dùng khi chạy lại bundle cũ qua
// K6_EMPTY_MODE=baseline. Xem docs/PHASE9_ROUND31_LIMITS.md §3.5.
const EMPTY_MODE = process.env.K6_EMPTY_MODE || "guard";
const OUT_FILE = process.env.K6_OUT || "v27-k6-clicktest.json";
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
      try { proc.stdio[s]?.on("error", () => { /* pipe chết cùng Chrome */ }); } catch { /* bỏ qua */ }
    }
    proc.on("error", () => { /* spawn lỗi -> send() reject có kiểm soát */ });
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
  async clickRect(rect, modifiers = 0) {
    const x = Math.round(rect.x + rect.width / 2);
    const y = Math.round(rect.y + rect.height / 2);
    try {
      await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1, modifiers }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1, modifiers }, this.sessionId, 15000);
      return "cdp-input";
    } catch (e) {
      log(`  Input.dispatchMouseEvent lỗi (${e.message}), fallback element.click()`);
      return "js-click-fallback";
    }
  }
  async drag(x0, y, x1, steps = 14) {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(x0), y: Math.round(y) }, this.sessionId, 15000);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(x0), y: Math.round(y), button: "left", clickCount: 1 }, this.sessionId, 15000);
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(x0 + (x1 - x0) * (i / steps));
      await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y: Math.round(y) }, this.sessionId, 15000);
      await sleep(60);
    }
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(x1), y: Math.round(y), button: "left", clickCount: 1 }, this.sessionId, 15000);
  }
  async pressCtrlZ() {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code: "KeyZ", key: "z", windowsVirtualKeyCode: 90, modifiers: 2 }, this.sessionId, 15000);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyZ", key: "z", windowsVirtualKeyCode: 90, modifiers: 2 }, this.sessionId, 15000);
  }
  async pressCtrlA() {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code: "KeyA", key: "a", windowsVirtualKeyCode: 65, modifiers: 2 }, this.sessionId, 15000);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyA", key: "a", windowsVirtualKeyCode: 65, modifiers: 2 }, this.sessionId, 15000);
  }
  async pressBackspace() {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code: "Backspace", key: "Backspace", windowsVirtualKeyCode: 8 }, this.sessionId, 15000);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code: "Backspace", key: "Backspace", windowsVirtualKeyCode: 8 }, this.sessionId, 15000);
  }
  async typeChars(text) {
    for (const ch of text) {
      await this.send("Input.dispatchKeyEvent", { type: "char", text: ch, key: ch }, this.sessionId, 15000);
      await sleep(40);
    }
  }
}

async function waitFor(cdp, expr, label, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await cdp.evaluate(expr, 15000)) return true; } catch { /* chưa */ }
    await sleep(500);
  }
  throw new Error(`hết ${timeoutMs}ms chờ: ${label}`);
}

async function findRect(cdp, finderJs) {
  return cdp.evaluate(`(() => {
    const el = (${finderJs});
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
}

async function realClick(cdp, finderJs, modifiers = 0) {
  const rect = await findRect(cdp, finderJs);
  if (!rect) throw new Error(`không tìm được element: ${finderJs.slice(0, 160)}`);
  const method = await cdp.clickRect(rect, modifiers);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`(${finderJs}).click()`);
  }
  await sleep(600);
  return method;
}

// ------------------------------------------------------------- infra -----
function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      let alive = false;
      try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch { alive = false; }
      if (alive) { log(`Xvfb: dùng chung display ${DISPLAY} (tiến trình còn sống)`); resolve(null); return; }
      log(`Xvfb: socket ${sock} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch { /* kệ */ }
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
  const distDir = process.env.K6_DIST_DIR || path.join(WEB_DIR, "dist");
  const indexHtml = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtml)) { log("BLOCKER dist: không có apps/web/dist/index.html"); return null; }
  const assetsDir = path.join(distDir, "assets");
  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  const bundlePath = jsFiles.map((f) => path.join(assetsDir, f))
    .find((p) => {
      const s = fs.readFileSync(p, "utf8");
      return s.includes("Lấy từ playhead") && s.includes("deepLevelHead") && s.includes("curveCreate")
      && (EMPTY_MODE !== "guard" || s.includes("Chưa nhập mốc ngoài"));
    });
  if (!bundlePath) {
    log("BLOCKER dist: không bundle nào chứa đồng thời 'Lấy từ playhead' + deepLevelHead + curveCreate (dist cũ hơn code đợt 25?)");
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
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webm": "video/webm", ".wasm": "application/wasm" };
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "k6-pipe-"));
    const chrome = spawn(bin, [
      "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
      "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank",
    ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => { /* dbus/gpu noise của VM, bỏ qua */ });
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
      try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
    }
  }
  return null;
}

// ------------------------------------------------------------- seeds -----
const CONST1 = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 1, easing: "linear" }] };
const CONST4 = { keyframes: [{ t: 0, v: 4, easing: "linear" }, { t: 2, v: 4, easing: "linear" }] };
const CONST2 = { keyframes: [{ t: 0, v: 2, easing: "linear" }, { t: 2, v: 2, easing: "linear" }] };
const CONST5 = { keyframes: [{ t: 0, v: 5, easing: "linear" }, { t: 4, v: 5, easing: "linear" }] };
const LIN13_4 = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 3, easing: "linear" }] };
const LIN12_4 = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] };
const LIN12_LEAF = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] };

function subSpec(tracks) {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 1280, height: 720, fps: 30 },
    tracks: tracks.map((t) => ({ id: t.id, kind: "video", clips: t.clips })),
  };
}
function nestedClip(id, name, start, duration, inner, extra = {}) {
  return { kind: "nested", id, name, start, duration, subSpec: inner, ...extra };
}
function videoLeaf(id, src, start, duration, inV, outV, extra = {}) {
  return { kind: "video", id, src, start, duration, in: inV, out: outV, ...extra };
}
/** Top ramp 1→3, start=10, trim [0,8) + lá trực tiếp (fixture A1 đợt 25 I2). */
function rampTopDirect(topId, leafId, src, extraTop = {}, extraLeaf = {}) {
  return {
    id: `t-${topId.toLowerCase()}`, kind: "video",
    clips: [nestedClip(topId, topId, 10, 4,
      subSpec([{ id: "v-in", clips: [videoLeaf(leafId, src, 0, 4, 100, 104, extraLeaf)] }]),
      { trim: { in: 0, out: 8 }, speedKeyframes: LIN13_4, ...extraTop })],
  };
}
/** Top ramp 1→3 (start 0) > mid ramp 1→2 > lá (fixture A2 đợt 25 I2). */
function rampTopTwo(topId, leafId, src) {
  return {
    id: `t-${topId.toLowerCase()}`, kind: "video",
    clips: [nestedClip(topId, topId, 0, 4,
      subSpec([{ id: "v-mid", clips: [nestedClip("MID-SPLIT2", "MID-SPLIT2", 0, 4,
        subSpec([{ id: "v-in", clips: [videoLeaf(leafId, src, 0, 4, 100, 104)] }]),
        { trim: { in: 0, out: 6 }, speedKeyframes: LIN12_4 })] }]),
      { trim: { in: 0, out: 8 }, speedKeyframes: LIN13_4 })],
  };
}
/** Top ramp 1→3 > A ramp 1→2 > B ramp 1→2 > lá (chuỗi τ 3 tầng đợt 24 H1:
 *  outer = τ₁₃(τ₁₂(τ₁₂(2))) = 1.1040 cho lá 2.0s). */
function rampTopThree(topId, leafId, src) {
  return {
    id: `t-${topId.toLowerCase()}`, kind: "video",
    clips: [nestedClip(topId, topId, 0, 4,
      subSpec([{ id: "v-a", clips: [nestedClip("A-SPLIT3", "A-SPLIT3", 0, 4,
        subSpec([{ id: "v-b", clips: [nestedClip("B-SPLIT3", "B-SPLIT3", 0, 4,
          subSpec([{ id: "v-in", clips: [videoLeaf(leafId, src, 0, 4, 100, 104)] }]),
          { trim: { in: 0, out: 6 }, speedKeyframes: LIN12_4 })] }]),
        { trim: { in: 0, out: 6 }, speedKeyframes: LIN12_4 })] }]),
      { trim: { in: 0, out: 8 }, speedKeyframes: LIN13_4 })],
  };
}
/** Fixture I3: top(0,4) > mid(0,4) > in(0,4) > deep(0,2) > dl(0,2);
 *  it2 có lá il(0,4), mt2 có lá ml(0,4). deepExtra/leafExtra cho case chặn. */
function deepIntermediateTrack(topId, deepName, deepExtra = {}, leafExtra = {}) {
  const deep = nestedClip("DEEP-ID", deepName, 0, 2,
    subSpec([{ id: "dt1", clips: [videoLeaf("dl", "deep-leaf.mp4", 0, 2, 0, 2, leafExtra)] }]),
    { trim: { in: 0, out: 2 }, ...deepExtra });
  const inner = nestedClip("IN-ID", "IN-DEEP", 0, 4,
    subSpec([
      { id: "it1", clips: [deep] },
      { id: "it2", clips: [videoLeaf("il", "deep-il.mp4", 0, 4, 0, 4)] },
    ]),
    { trim: { in: 0, out: 4 } });
  const mid = nestedClip("MID-ID", "MID-DEEP", 0, 4,
    subSpec([
      { id: "mt1", clips: [inner] },
      { id: "mt2", clips: [videoLeaf("ml", "deep-ml.mp4", 0, 4, 0, 4)] },
    ]),
    { trim: { in: 0, out: 4 } });
  return {
    id: `t-${topId.toLowerCase()}`, kind: "video",
    clips: [nestedClip(topId, topId, 0, 4,
      subSpec([{ id: "t1", clips: [mid] }]),
      { trim: { in: 0, out: 4 } })],
  };
}

function mainSeed() {
  return {
    version: "0.2.0",
    meta: { name: "J6 split+intermediate seed", width: 1280, height: 720, fps: 30 },
    tracks: [
      rampTopDirect("TOP-SPLIT-OUT", "OUT-LEAF", "out-leaf.mp4"),
      rampTopDirect("TOP-SPLIT-EDGE", "EDGE-LEAF", "edge-leaf.mp4"),
      rampTopDirect("TOP-SPLIT-OK", "OK-LEAF", "ok-leaf.mp4"),
      rampTopDirect("TOP-SPLIT-PH", "PH-LEAF", "ph-leaf.mp4"),
      rampTopTwo("TOP-SPLIT2", "SPLIT2-LEAF", "split2-leaf.mp4"),
      rampTopThree("TOP-SPLIT3", "SPLIT3-LEAF", "split3-leaf.mp4"),
      deepIntermediateTrack("TOP-DEEP", "DEEP-TARGET"),
      deepIntermediateTrack("TOP-DEEP-BLOCK", "DEEP-BLOCKED",
        { speedKeyframes: CONST4 }, { speedKeyframes: CONST2 }),
      // Lá sâu qua check object (I3a): TOP curve 1× -> MID reverse -> lá.
      {
        id: "t-leafchk", kind: "video",
        clips: [nestedClip("TOP-LEAFCHK", "TOP-LEAFCHK", 0, 4,
          subSpec([{ id: "in-chk", clips: [nestedClip("MID-CHK", "MID-CHK", 0, 4,
            subSpec([{ id: "leaf-chk", clips: [videoLeaf("CHK-LEAF", "chk-leaf.mp4", 0, 4, 0, 4)] }]),
            { reverse: true })] }]),
          { trim: { in: 0, out: 4 }, speedKeyframes: CONST1 })],
      },
    ],
  };
}

function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}

// ------------------------------------------------------------- page fns --
function pageItemNames() {
  return [...document.querySelectorAll(".nested-item .nested-item-name")].map((el) => (el.textContent || "").replace("📦", "").trim());
}
function pageItemEl(name) {
  return [...document.querySelectorAll(".nested-item")].find((it) => {
    const n = it.querySelector(".nested-item-name");
    return n && (n.textContent || "").includes(name);
  }) || null;
}
function pageItemOpenButton(name, viewText) {
  const it = pageItemEl(name);
  if (!it) return null;
  return [...it.querySelectorAll("button")].find((b) =>
    (b.textContent || "").trim() === viewText && !b.closest(".nested-inner")) || null;
}
function pageDeepestLevel(name) {
  const it = pageItemEl(name);
  if (!it) return null;
  const levels = [...it.querySelectorAll(".nested-inner")];
  return levels.length ? levels[levels.length - 1] : null;
}
function pageNextChildButton(name, viewText) {
  const lvl = pageDeepestLevel(name);
  if (!lvl) return null;
  return [...lvl.querySelectorAll("button")].find((b) =>
    (b.textContent || "").trim() === viewText && b.closest(".nested-inner") === lvl) || null;
}
function pagePanelMsg() {
  const m = document.querySelector(".nested-panel-msg");
  return m ? m.textContent : null;
}
function pageToasts() {
  return [...document.querySelectorAll(".toasts .toast-msg")].map((el) => el.textContent);
}

async function injectPageFns(cdp) {
  const wrapped = `window.__k6f = (() => {
    ${pageItemEl.toString()}
    ${pageDeepestLevel.toString()}
    ${pageItemOpenButton.toString()}
    ${pageNextChildButton.toString()}
    return { pageItemEl, pageDeepestLevel, pageItemOpenButton, pageNextChildButton };
  })();`;
  await cdp.evaluate(wrapped);
}

async function clickInjected(cdp, fnName, ...args) {
  const argStr = args.map((a) => JSON.stringify(a)).join(",");
  const rect = await cdp.evaluate(`(() => {
    const el = window.__k6f.${fnName}(${argStr});
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`không tìm được nút ${fnName}(${argStr})`);
  const method = await cdp.clickRect(rect);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`window.__k6f.${fnName}(${argStr}).click()`);
  }
  await sleep(600);
  return method;
}

async function drillToLeaf(cdp, itemName, depth, viewText) {
  await clickInjected(cdp, "pageItemOpenButton", itemName, viewText);
  await waitFor(cdp, `window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)}) !== null`, `tầng trong của ${itemName} mở`, 15000);
  for (let d = 0; d < depth; d++) {
    const before = await cdp.evaluate(`[...window.__k6f.pageItemEl(${JSON.stringify(itemName)}).querySelectorAll(".nested-inner")].length`);
    await clickInjected(cdp, "pageNextChildButton", itemName, viewText);
    await waitFor(cdp, `[...window.__k6f.pageItemEl(${JSON.stringify(itemName)}).querySelectorAll(".nested-inner")].length > ${before}`, `mở tầng con ${d + 1} của ${itemName}`, 15000);
  }
}

/** Thông tin hàng ở tầng sâu nhất chứa label (lá hoặc nested trung gian). */
async function rowInfo(cdp, itemName, label) {
  return cdp.evaluate(`(() => {
    const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
    if (!lvl) return { found: false };
    const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) =>
      (r.textContent || "").includes(${JSON.stringify(label)}));
    if (!row) return { found: false };
    const inputs = [...row.querySelectorAll("input")].map((i) => ({ aria: i.getAttribute("aria-label"), value: i.value, type: i.type }));
    const buttons = [...row.querySelectorAll("button")].map((b) => (b.textContent || "").trim());
    return { found: true, rowText: (row.textContent || "").slice(0, 300), inputs, buttons };
  })()`);
}

/** Click nút có text chính xác trong hàng ở tầng sâu nhất chứa label. */
async function clickRowButton(cdp, itemName, label, btnText) {
  const rect = await cdp.evaluate(`(() => {
    const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
    if (!lvl) return null;
    const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) =>
      (r.textContent || "").includes(${JSON.stringify(label)}));
    if (!row) return null;
    const btn = [...row.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === ${JSON.stringify(btnText)});
    if (!btn) return null;
    btn.scrollIntoView({ block: "center", inline: "center" });
    const r = btn.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`không tìm được nút "${btnText}" trong hàng "${label}" của ${itemName}`);
  const method = await cdp.clickRect(rect);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`(() => {
      const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
      const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
      [...row.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === ${JSON.stringify(btnText)}).click();
    })()`);
  }
  await sleep(600);
  return method;
}

/** Gõ text vào input (theo aria-label) trong hàng ở tầng sâu nhất chứa label.
 *  Gõ thật bằng CDP char events sau khi click + Ctrl+A; nếu giá trị không
 *  khớp thì fallback native setter + input event (ghi rõ phương thức). */
async function typeIntoRowInput(cdp, itemName, label, aria, text) {
  const rect = await cdp.evaluate(`(() => {
    const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
    if (!lvl) return null;
    const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) =>
      (r.textContent || "").includes(${JSON.stringify(label)}));
    if (!row) return null;
    const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
    if (!inp) return null;
    inp.scrollIntoView({ block: "center", inline: "center" });
    const r = inp.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`không tìm được input aria="${aria}" trong hàng "${label}" của ${itemName}`);
  await cdp.clickRect(rect);
  await sleep(300);
  await cdp.pressCtrlA();
  await cdp.typeChars(text);
  await sleep(500);
  let value = await cdp.evaluate(`(() => {
    const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
    const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
    const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
    return inp ? inp.value : null;
  })()`);
  let method = "cdp-char";
  if (value !== text && Number(value) !== Number(text)) {
    // Fallback: native setter (React controlled input) + input event.
    await cdp.evaluate(`(() => {
      const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
      const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
      const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(inp, ${JSON.stringify(text)});
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await sleep(500);
    value = await cdp.evaluate(`(() => {
      const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
      const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
      const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
      return inp ? inp.value : null;
    })()`);
    method = "native-setter-fallback";
  }
  if (value !== text && Number(value) !== Number(text)) {
    throw new Error(`gõ input aria="${aria}" thất bại: muốn "${text}", được "${value}" (method=${method})`);
  }
  return { method, value };
}

/** Xoá trắng input (theo aria-label) trong hàng ở tầng sâu nhất chứa label:
 *  click + Ctrl+A + Backspace thật; nếu giá trị không rỗng thì fallback
 *  native setter "" + input/change event (ghi rõ phương thức). */
async function clearRowInput(cdp, itemName, label, aria) {
  const rect = await cdp.evaluate(`(() => {
    const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
    if (!lvl) return null;
    const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) =>
      (r.textContent || "").includes(${JSON.stringify(label)}));
    if (!row) return null;
    const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
    if (!inp) return null;
    inp.scrollIntoView({ block: "center", inline: "center" });
    const r = inp.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`không tìm được input aria="${aria}" trong hàng "${label}" của ${itemName}`);
  await cdp.clickRect(rect);
  await sleep(300);
  await cdp.pressCtrlA();
  await cdp.pressBackspace();
  await sleep(500);
  let value = await readRowInput(cdp, itemName, label, aria);
  let method = "cdp-backspace";
  if (value !== "") {
    await cdp.evaluate(`(() => {
      const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
      const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
      const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(inp, "");
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await sleep(500);
    value = await readRowInput(cdp, itemName, label, aria);
    method = "native-setter-fallback";
  }
  if (value !== "") throw new Error(`xoá input aria="${aria}" thất bại: còn "${value}" (method=${method})`);
  return { method, value };
}

async function readRowInput(cdp, itemName, label, aria) {
  return cdp.evaluate(`(() => {
    const lvl = window.__k6f.pageDeepestLevel(${JSON.stringify(itemName)});
    if (!lvl) return null;
    const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
    if (!row) return null;
    const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
    return inp ? inp.value : null;
  })()`);
}

async function readMsgAndToasts(cdp) {
  const msg = await cdp.evaluate(`(${pagePanelMsg.toString()})()`);
  const toasts = await cdp.evaluate(`(${pageToasts.toString()})()`);
  return { msg, toasts };
}

async function loadSession(cdp, seedSpec, seedName, lang = "vi") {
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu", 60000);
  await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-lang", ${JSON.stringify(lang)}); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seedSpec, seedName))});`);
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
  await injectPageFns(cdp);
}

async function openNestedPanel(cdp, panelTitle) {
  const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === ${JSON.stringify(panelTitle)})`);
  await waitFor(cdp, `!!document.querySelector(".nested-panel")`, "panel .nested-panel mở", 15000);
  return m;
}

async function closeNestedPanelIfOpen(cdp, panelTitle) {
  const wasOpen = await cdp.evaluate(`!!document.querySelector(".nested-panel")`);
  if (wasOpen) {
    await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === ${JSON.stringify(panelTitle)})`);
    await waitFor(cdp, `!document.querySelector(".nested-panel")`, "panel nested đóng", 8000);
  }
  return wasOpen;
}

async function readAutosaveSpec(cdp) {
  const raw = await cdp.evaluate(`localStorage.getItem("vcut-studio:autosave:v1")`);
  if (!raw) return null;
  try { return JSON.parse(raw).spec; } catch { return null; }
}

/** Đi từ top qua chainIds -> subSpec của tầng chứa trực tiếp đích. */
function descendContainer(spec, topId, chainIds) {
  if (!spec) return null;
  let cur = null;
  for (const t of spec.tracks) {
    const c = (t.clips || []).find((x) => x.id === topId);
    if (c) { cur = c; break; }
  }
  if (!cur || !cur.subSpec) return null;
  let container = cur.subSpec;
  for (const cid of chainIds) {
    let nxt = null;
    for (const t of container.tracks) {
      const c = (t.clips || []).find((x) => x.id === cid);
      if (c) { nxt = c; break; }
    }
    if (!nxt || !nxt.subSpec) return null;
    container = nxt.subSpec;
  }
  return container;
}
function trackClips(spec, topId, chainIds, trackId) {
  const container = descendContainer(spec, topId, chainIds);
  if (!container) return null;
  const track = container.tracks.find((t) => t.id === trackId);
  return track ? track.clips : null;
}
function findNestedClip(spec, topId, chainIds, clipId) {
  const container = descendContainer(spec, topId, chainIds);
  if (!container) return null;
  for (const t of container.tracks) {
    const c = (t.clips || []).find((x) => x.id === clipId);
    if (c) return c;
  }
  return null;
}
function topClip(spec, topId) {
  if (!spec) return null;
  for (const t of spec.tracks) {
    const c = (t.clips || []).find((x) => x.id === topId);
    if (c) return c;
  }
  return null;
}
function approx(v, want, tol, what) {
  if (v === undefined || v === null || Math.abs(v - want) > tol) {
    throw new Error(`${what}: nhận ${v}, muốn ${want} ± ${tol}`);
  }
}

/** Liệt kê id các top clip có JSON khác nhau giữa 2 spec (chẩn đoán no-op). */
function specDiffTops(a, b) {
  if (!a || !b) return ["spec null"];
  const out = [];
  const tops = new Map();
  for (const t of a.tracks) for (const c of t.clips) tops.set(c.id, JSON.stringify(c));
  for (const t of b.tracks) for (const c of t.clips) {
    if (tops.get(c.id) !== JSON.stringify(c)) out.push(c.id);
  }
  return out;
}

// ------------------------------------------------------------- cases -----
const results = [];
function casePass(id, detail) { results.push({ id, status: "PASS", detail }); log(`CASE ${id}: PASS — ${detail}`); }
function caseFail(id, detail) { results.push({ id, status: "FAIL", detail }); log(`CASE ${id}: FAIL — ${detail}`); }

const AUTOSAVE_WAIT = 7000;
const VI_MARKERS = ["Mốc", "không tách", "clip lá", "quá sát mép", "tổ tiên", "đang reverse"];
const TX = {
  vi: {
    view: "Xem bên trong",
    panelTitle: "Tạo và quản lý nested clip (compound clip)",
    splitAria: "Mốc ngoài (timeline ngoài, giây):",
    splitBtn: "Tách lá tại mốc ngoài",
    usePlayhead: "Lấy từ playhead",
    outOfRange: "Mốc ngoài nằm ngoài phần khả kiến của clip lá",
    emptyMsg: "Chưa nhập mốc ngoài",
    saveBtn: "Lưu clip con",
    curveBtn: "Đặt curve 1× cho lá",
  },
  en: {
    view: "View inside",
    panelTitle: "Create and manage nested clips (compound clips)",
    splitAria: "Outer time (outer timeline, seconds):",
    splitBtn: "Split leaf at outer time",
    usePlayhead: "Use playhead",
    outOfRange: "outside the leaf clip's visible window",
    emptyMsg: "No outer time entered",
    saveBtn: "Save inner clip",
    curveBtn: "Set 1× curve on leaf",
  },
};
const EXPECTED_ITEMS = ["TOP-SPLIT-OUT", "TOP-SPLIT-EDGE", "TOP-SPLIT-OK", "TOP-SPLIT-PH", "TOP-SPLIT2", "TOP-SPLIT3", "TOP-DEEP", "TOP-DEEP-BLOCK", "TOP-LEAFCHK"];

async function panelFullText(cdp) {
  return cdp.evaluate(`document.querySelector(".nested-panel") ? (document.querySelector(".nested-panel").textContent || "") : ""`);
}

async function runViCases(cdp) {
  const t = TX.vi;
  try {
    await openNestedPanel(cdp, t.panelTitle);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    log(`  K0 item panel: ${JSON.stringify(names)}`);
    const missing = EXPECTED_ITEMS.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`thiếu item: ${missing.join(", ")}`);
    casePass("K0-seed-load", `panel liệt kê đủ 9 item: ${names.join(", ")}`);
  } catch (e) { caseFail("K0-seed-load", e.message); return; }

  // K1: ô nhập mốc RỖNG trên lá trực tiếp (TOP-SPLIT-OUT, start=10):
  // gõ rồi xoá trắng thật (Ctrl+A + Backspace) rồi bấm tách.
  try {
    await drillToLeaf(cdp, "TOP-SPLIT-OUT", 0, t.view);
    const info = await rowInfo(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4");
    if (!info.found || !info.buttons.includes(t.splitBtn)) throw new Error(`hàng lá OUT không có nút tách (info=${JSON.stringify(info)})`);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria, "11.4641");
    const cleared = await clearRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
    const inputBefore = await readRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
    if (inputBefore !== "") throw new Error(`sau khi xoá, input phải rỗng (nhận ${JSON.stringify(inputBefore)})`);
    const m = await clickRowButton(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  K1 mode=${EMPTY_MODE} typed=${JSON.stringify(typed)} cleared=${JSON.stringify(cleared)} click=${m} msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (EMPTY_MODE === "guard") {
      if (!msg || !msg.includes(t.emptyMsg)) throw new Error(`msg phải là câu mốc rỗng (msg=${JSON.stringify(msg)})`);
      if (toasts.some((x) => x.includes(t.emptyMsg))) throw new Error(`guard mốc rỗng không được toast (toasts=${JSON.stringify(toasts)})`);
    } else {
      if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg baseline phải là OutOfRange (msg=${JSON.stringify(msg)})`);
      if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast baseline phải chứa OutOfRange (toasts=${JSON.stringify(toasts)})`);
    }
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    const leaves = trackClips(after, "TOP-SPLIT-OUT", [], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`sau khi chặn mốc rỗng, lá phải còn 1 (nhận ${leaves && leaves.length})`);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn mốc rỗng");
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    const afterUndo = await readAutosaveSpec(cdp);
    if (JSON.stringify(afterUndo) !== JSON.stringify(before)) throw new Error(`Ctrl+Z sau lần chặn mốc rỗng đã đổi spec (top đổi: ${specDiffTops(before, afterUndo).join(", ")})`);
    casePass("K1-empty-input", `gõ ${typed.method} "11.4641" rồi xoá trắng (${cleared.method}) + click ${m} -> mode=${EMPTY_MODE}, msg đúng, lá còn 1, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("K1-empty-input", e.message); }

  // K2: mốc ngoài miền (99) ở chain 2 tầng qua panel (TOP-SPLIT2 > MID-SPLIT2 > lá).
  try {
    await drillToLeaf(cdp, "TOP-SPLIT2", 1, t.view);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-SPLIT2", "split2-leaf.mp4", t.splitAria, "99");
    const m = await clickRowButton(cdp, "TOP-SPLIT2", "split2-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  K2 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)} typed=${JSON.stringify(typed)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast không chứa OutOfRange`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn mốc 99 ở chain 2 tầng");
    const leaves = trackClips(after, "TOP-SPLIT2", ["MID-SPLIT2"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá 2 tầng phải còn 1 (nhận ${leaves && leaves.length})`);
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    const afterUndo = await readAutosaveSpec(cdp);
    if (JSON.stringify(afterUndo) !== JSON.stringify(before)) throw new Error(`Ctrl+Z sau lần chặn đã đổi spec (top đổi: ${specDiffTops(before, afterUndo).join(", ")})`);
    casePass("K2-out-of-range-two-level", `gõ ${typed.method} "99" + click ${m} -> msg + toast OutOfRange đúng, lá 2 tầng còn 1, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("K2-out-of-range-two-level", e.message); }

  // K3: mốc ngoài miền (99) ở chain 3 tầng qua panel (TOP-SPLIT3 > A-SPLIT3 > B-SPLIT3 > lá).
  try {
    await drillToLeaf(cdp, "TOP-SPLIT3", 2, t.view);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-SPLIT3", "split3-leaf.mp4", t.splitAria, "99");
    const m = await clickRowButton(cdp, "TOP-SPLIT3", "split3-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  K3 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)} typed=${JSON.stringify(typed)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast không chứa OutOfRange`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn mốc 99 ở chain 3 tầng");
    const leaves = trackClips(after, "TOP-SPLIT3", ["A-SPLIT3", "B-SPLIT3"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá 3 tầng phải còn 1 (nhận ${leaves && leaves.length})`);
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    const afterUndo = await readAutosaveSpec(cdp);
    if (JSON.stringify(afterUndo) !== JSON.stringify(before)) throw new Error(`Ctrl+Z sau lần chặn đã đổi spec (top đổi: ${specDiffTops(before, afterUndo).join(", ")})`);
    casePass("K3-out-of-range-three-level", `gõ ${typed.method} "99" + click ${m} -> msg + toast OutOfRange đúng, lá 3 tầng còn 1, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("K3-out-of-range-three-level", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("K6-no-crash-vi", "0 Runtime.exceptionThrown trong phiên vi");
  } else {
    caseFail("K6-no-crash-vi", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

async function runEnCases(cdp) {
  const t = TX.en;
  // K4: panel I2 ở locale en — nhãn đúng, msg en, không rơi key thô, không rò vi.
  try {
    await openNestedPanel(cdp, t.panelTitle);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    log(`  K4 item panel (en): ${JSON.stringify(names)}`);
    const missing = EXPECTED_ITEMS.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`thiếu item: ${missing.join(", ")}`);
    await drillToLeaf(cdp, "TOP-SPLIT-OUT", 0, t.view);
    const info = await rowInfo(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4");
    log(`  K4 row (en): ${JSON.stringify(info)}`);
    if (!info.found) throw new Error("không thấy hàng lá OUT ở locale en");
    if (!info.buttons.includes(t.splitBtn)) throw new Error(`thiếu nút en "${t.splitBtn}" (buttons=${JSON.stringify(info.buttons)})`);
    if (!info.buttons.includes(t.usePlayhead)) throw new Error(`thiếu nút en "${t.usePlayhead}"`);
    if (!info.inputs.some((i) => i.aria === t.splitAria)) throw new Error(`thiếu input aria en "${t.splitAria}" (inputs=${JSON.stringify(info.inputs)})`);
    const pText = await panelFullText(cdp);
    if (pText.includes("nested.")) throw new Error(`panel en rơi key thô (đoạn đầu: ${JSON.stringify(pText.slice(0, 400))})`);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria, "9.9");
    const m = await clickRowButton(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  K4 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)} typed=${JSON.stringify(typed)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg en không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast en không chứa OutOfRange`);
    if (msg.includes("nested.")) throw new Error(`msg en rơi key thô (msg=${JSON.stringify(msg)})`);
    for (const mk of VI_MARKERS) if (msg.includes(mk)) throw new Error(`msg en rò tiếng Việt (${mk} trong ${JSON.stringify(msg)})`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn en");
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    const afterUndo = await readAutosaveSpec(cdp);
    if (JSON.stringify(afterUndo) !== JSON.stringify(before)) throw new Error(`Ctrl+Z sau lần chặn en đã đổi spec (top đổi: ${specDiffTops(before, afterUndo).join(", ")})`);
    casePass("K4-en-split-out-of-range", `locale en: nút "${t.splitBtn}" + "${t.usePlayhead}" + aria đúng, gõ ${typed.method} "9.9" -> msg + toast en OutOfRange, không key thô, không rò vi, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("K4-en-split-out-of-range", e.message); }

  // K5: panel I3 ở locale en — nút trung gian sâu + nút lá sâu, msg en, không key thô.
  try {
    await drillToLeaf(cdp, "TOP-DEEP", 2, t.view);
    const info = await rowInfo(cdp, "TOP-DEEP", "DEEP-TARGET");
    log(`  K5 row DEEP-TARGET (en): ${JSON.stringify(info)}`);
    if (!info.found || !info.buttons.includes(t.saveBtn)) throw new Error(`không thấy DeepIntermediateEditor en cho DEEP-TARGET (info=${JSON.stringify(info)})`);
    await drillToLeaf(cdp, "TOP-LEAFCHK", 1, t.view);
    const row = await rowInfo(cdp, "TOP-LEAFCHK", "chk-leaf.mp4");
    if (!row.found || !row.buttons.includes(t.curveBtn)) throw new Error(`hàng lá CHK en không có nút curve (row=${JSON.stringify(row)})`);
    const pText = await panelFullText(cdp);
    if (pText.includes("nested.")) throw new Error(`panel en rơi key thô (đoạn đầu: ${JSON.stringify(pText.slice(0, 400))})`);
    await clickRowButton(cdp, "TOP-LEAFCHK", "chk-leaf.mp4", t.curveBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  K5 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("Ancestor nested clip") || !msg.includes("MID-CHK") || !msg.includes("is reversed")) throw new Error(`msg en không chứa nhánh ancestorReverse (msg=${JSON.stringify(msg)})`);
    if (msg.includes("nested.")) throw new Error(`msg en rơi key thô (msg=${JSON.stringify(msg)})`);
    for (const mk of ["tổ tiên", "đang reverse"]) if (msg.includes(mk)) throw new Error(`msg en rò tiếng Việt (${mk})`);
    await sleep(AUTOSAVE_WAIT);
    const spec = await readAutosaveSpec(cdp);
    const leaf = findNestedClip(spec, "TOP-LEAFCHK", ["MID-CHK"], "CHK-LEAF");
    if (leaf && leaf.speedKeyframes) throw new Error(`autosave en: lá bị chặn vẫn nhận curve`);
    casePass("K5-en-intermediate-and-leaf-check", `locale en: nút "${t.saveBtn}" ở trung gian sâu + nút "${t.curveBtn}" ở lá sâu, msg ancestorReverse en đúng (MID-CHK), không key thô, không rò vi, autosave không curve`);
  } catch (e) { caseFail("K5-en-intermediate-and-leaf-check", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("K7-no-crash-en", "0 Runtime.exceptionThrown trong phiên en");
  } else {
    caseFail("K7-no-crash-en", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

// ------------------------------------------------------------- main ------
async function main() {
  log(`harness clicktest-k6-round27-pipe: bắt đầu (label=${RUN_LABEL} emptyMode=${EMPTY_MODE} out=${OUT_FILE})`);
  log(`display=${DISPLAY} port=${PORT} binaries=${BINARIES.join(" | ")}`);
  let xvfb = null;
  let server = null;
  let exitCode = 2;
  const holders = [];
  let snapInfo = null;
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) { log("BLOCKER: dist snapshot thất bại — dừng, không có kết quả click-test"); return 2; }
    snapInfo = snap;
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }

    // Phiên 1: vi (K0–K3, K6).
    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên vi)"); return 2; }
      holders.push(holder);
      try {
        await loadSession(cdp, mainSeed(), "K6 vi seed", "vi");
        await runViCases(cdp);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
      }
    }
    // Phiên 2: en (K4, K5, K7).
    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên en)"); return 2; }
      holders.push(holder);
      try {
        await loadSession(cdp, mainSeed(), "K6 en seed", "en");
        await runEnCases(cdp);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
      }
    }
    const failed = results.filter((r) => r.status === "FAIL");
    exitCode = failed.length === 0 ? 0 : 1;
    log(`DONE clicktest-k6-round27: ${results.filter((r) => r.status === "PASS").length}/${results.length} case pass, ${failed.length} fail, exit=${exitCode}`);
  } catch (e) {
    log(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
    exitCode = 2;
  } finally {
    for (const h of holders) { try { h.chrome && h.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ } }
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { server && server.close(); } catch { /* bỏ qua */ }
    const out = {
      runAt: new Date().toISOString(), label: RUN_LABEL, emptyMode: EMPTY_MODE, display: DISPLAY, port: PORT,
      bundle: snapInfo ? snapInfo.bundle : null, bundleSha256_16: snapInfo ? snapInfo.sha : null,
      distSrc: process.env.K6_DIST_DIR || path.join(WEB_DIR, "dist"),
      cases: results, log: logLines,
    };
    const outPath = path.join(ROOT, "benchmarks", "results", OUT_FILE);
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      writeFileEpermRetry(outPath, JSON.stringify(out, null, 2));
      console.log(`results JSON: ${outPath}`);
    } catch (e) { console.log(`không ghi được results JSON: ${e.message}`); }
  }
  return exitCode;
}

process.exitCode = await main();
