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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round26-j6");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.J6_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.J6_DISPLAY || ":96";
const PORT = Number(process.env.J6_PORT || 4196);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.J6_RUN_LABEL || "run1";
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
  const distDir = path.join(WEB_DIR, "dist");
  const indexHtml = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtml)) { log("BLOCKER dist: không có apps/web/dist/index.html"); return null; }
  const assetsDir = path.join(distDir, "assets");
  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  const bundlePath = jsFiles.map((f) => path.join(assetsDir, f))
    .find((p) => {
      const s = fs.readFileSync(p, "utf8");
      return s.includes("Lấy từ playhead") && s.includes("deepLevelHead") && s.includes("curveCreate");
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "j6-pipe-"));
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

function riskySeed() {
  return {
    version: "0.2.0",
    meta: { name: "J6 risky split seed", width: 1280, height: 720, fps: 30 },
    tracks: [
      // Curve top v=5 (fixture C đợt 25 I2): helper fail-fast -> curveInvalid.
      rampTopDirect("TOP-CURV", "CURV-LEAF", "curv-leaf.mp4",
        { speedKeyframes: CONST5 }),
      // Lá reverse + curve (fixture I đợt 25 I2): hàm trong từ chối.
      rampTopDirect("TOP-INNERFAIL", "INNER-LEAF", "inner-leaf.mp4", {},
        { in: 10, out: 16, reverse: true, speedKeyframes: LIN12_LEAF }),
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
function pageItemOpenButton(name) {
  const it = pageItemEl(name);
  if (!it) return null;
  return [...it.querySelectorAll("button")].find((b) =>
    (b.textContent || "").trim() === "Xem bên trong" && !b.closest(".nested-inner")) || null;
}
function pageDeepestLevel(name) {
  const it = pageItemEl(name);
  if (!it) return null;
  const levels = [...it.querySelectorAll(".nested-inner")];
  return levels.length ? levels[levels.length - 1] : null;
}
function pageNextChildButton(name) {
  const lvl = pageDeepestLevel(name);
  if (!lvl) return null;
  return [...lvl.querySelectorAll("button")].find((b) =>
    (b.textContent || "").trim() === "Xem bên trong" && b.closest(".nested-inner") === lvl) || null;
}
function pagePanelMsg() {
  const m = document.querySelector(".nested-panel-msg");
  return m ? m.textContent : null;
}
function pageToasts() {
  return [...document.querySelectorAll(".toasts .toast-msg")].map((el) => el.textContent);
}

async function injectPageFns(cdp) {
  const wrapped = `window.__j6f = (() => {
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
    const el = window.__j6f.${fnName}(${argStr});
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`không tìm được nút ${fnName}(${argStr})`);
  const method = await cdp.clickRect(rect);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`window.__j6f.${fnName}(${argStr}).click()`);
  }
  await sleep(600);
  return method;
}

async function drillToLeaf(cdp, itemName, depth) {
  await clickInjected(cdp, "pageItemOpenButton", itemName);
  await waitFor(cdp, `window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)}) !== null`, `tầng trong của ${itemName} mở`, 15000);
  for (let d = 0; d < depth; d++) {
    const before = await cdp.evaluate(`[...window.__j6f.pageItemEl(${JSON.stringify(itemName)}).querySelectorAll(".nested-inner")].length`);
    await clickInjected(cdp, "pageNextChildButton", itemName);
    await waitFor(cdp, `[...window.__j6f.pageItemEl(${JSON.stringify(itemName)}).querySelectorAll(".nested-inner")].length > ${before}`, `mở tầng con ${d + 1} của ${itemName}`, 15000);
  }
}

/** Thông tin hàng ở tầng sâu nhất chứa label (lá hoặc nested trung gian). */
async function rowInfo(cdp, itemName, label) {
  return cdp.evaluate(`(() => {
    const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
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
    const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
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
      const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
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
    const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
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
    const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
    const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
    const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
    return inp ? inp.value : null;
  })()`);
  let method = "cdp-char";
  if (value !== text && Number(value) !== Number(text)) {
    // Fallback: native setter (React controlled input) + input event.
    await cdp.evaluate(`(() => {
      const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
      const row = [...lvl.querySelectorAll(".nested-panel-row")].find((r) => (r.textContent || "").includes(${JSON.stringify(label)}));
      const inp = row.querySelector('input[aria-label=' + JSON.stringify(${JSON.stringify(aria)}) + ']');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(inp, ${JSON.stringify(text)});
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await sleep(500);
    value = await cdp.evaluate(`(() => {
      const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
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

async function readRowInput(cdp, itemName, label, aria) {
  return cdp.evaluate(`(() => {
    const lvl = window.__j6f.pageDeepestLevel(${JSON.stringify(itemName)});
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

async function loadSession(cdp, seedSpec, seedName) {
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu", 60000);
  await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seedSpec, seedName))});`);
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

async function openNestedPanel(cdp) {
  const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Tạo và quản lý nested clip (compound clip)")`);
  await waitFor(cdp, `!!document.querySelector(".nested-panel")`, "panel .nested-panel mở", 15000);
  return m;
}

async function closeNestedPanelIfOpen(cdp) {
  const wasOpen = await cdp.evaluate(`!!document.querySelector(".nested-panel")`);
  if (wasOpen) {
    await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Tạo và quản lý nested clip (compound clip)")`);
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

// ------------------------------------------------------------- ruler -----
function readTimeText(cdp) {
  return cdp.evaluate(`(() => {
    const m = (document.body.innerText.match(/\\d+:\\d+\\.\\d+\\s*\\/\\s*\\d+:\\d+\\.\\d+/) || [])[0] || null;
    if (!m) return null;
    const cur = m.split("/")[0].trim();
    const parts = cur.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  })()`);
}

async function getRuler(cdp) {
  const r = await cdp.evaluate(`(() => {
    const el = document.querySelector(".tl-ruler");
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    let q = el.getBoundingClientRect();
    if (q.y + q.height > window.innerHeight) {
      window.scrollTo(0, document.body.scrollHeight);
      let n = el.parentElement;
      while (n) {
        if (n.scrollHeight > n.clientHeight) n.scrollTop = n.scrollHeight;
        n = n.parentElement;
      }
      el.scrollIntoView({ block: "end", inline: "center" });
      q = el.getBoundingClientRect();
    }
    return { x: q.x, y: q.y, w: q.width, h: q.height, innerH: window.innerHeight };
  })()`);
  await sleep(400);
  return r;
}

/** Đọc playhead thật từ vạch .tl-playhead-line (center = rulerX + 60 ×
 *  playhead, kiểm chứng diag-line đợt 25 I6) cùng 1 evaluate với ruler. */
async function readPlayheadLine(cdp) {
  return cdp.evaluate(`(() => {
    const line = document.querySelector(".tl-playhead-line");
    const ruler = document.querySelector(".tl-ruler");
    if (!line || !ruler) return null;
    const lr = line.getBoundingClientRect();
    const rr = ruler.getBoundingClientRect();
    return { center: lr.x + lr.width / 2, rulerX: rr.x, tTrue: (lr.x + lr.width / 2 - rr.x) / 60 };
  })()`);
}

/** Kéo scrub tới targetT bằng thang ĐÚNG 60 px/s (không dùng hiệu chuẩn
 *  từ text làm tròn 0.1s — run1 dùng pxPerSec=60.606 từ text đã lệch hệ
 *  thống +0.069s ngoài, kéo theo lá lệch +0.12s: lỗi harness, app đúng).
 *  Trả cả readout text (làm tròn 0.1) và tTrue từ vạch (chính xác ~1px). */
async function scrubTo(cdp, targetT) {
  const ruler0 = await getRuler(cdp);
  if (!ruler0) throw new Error("không thấy .tl-ruler");
  if (ruler0.y < 0 || ruler0.y + ruler0.h > ruler0.innerH) throw new Error(`ruler ngoài viewport: ${JSON.stringify(ruler0)}`);
  const y = Math.round(ruler0.y + ruler0.h / 2);
  await cdp.clickRect({ x: ruler0.x + 40, y, width: 1, height: 1 });
  await sleep(1000);
  const tA = await readTimeText(cdp);
  await cdp.clickRect({ x: ruler0.x + 240, y, width: 1, height: 1 });
  await sleep(1000);
  const tB = await readTimeText(cdp);
  log(`  hiệu chuẩn ruler (chỉ để log, không dùng làm thang): click x+40 -> playhead ${tA}, click x+240 -> playhead ${tB}`);
  if (tA === null || tB === null || Math.abs(tB - tA) < 0.2) throw new Error(`không đọc được playhead từ hiệu chuẩn (tA=${tA}, tB=${tB})`);
  const ruler = await getRuler(cdp);
  const y2 = Math.round(ruler.y + ruler.h / 2);
  const xTarget = Math.round(ruler.x + 60 * targetT);
  const xFrom = Math.round(ruler.x + 60 * 0.3);
  await cdp.drag(xFrom, y2, xTarget, 14);
  await sleep(1200);
  const t = await readTimeText(cdp);
  const line = await readPlayheadLine(cdp);
  log(`  scrub -> ${targetT}: readout text=${t}, vạch=${JSON.stringify(line)}`);
  return { t, tTrue: line ? line.tTrue : null, pxPerSec: 60 };
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
function caseSeedRejected(id, detail) { results.push({ id, status: "SEED-REJECTED", detail }); log(`CASE ${id}: SEED-REJECTED — ${detail}`); }

const SPLIT_ARIA = "Mốc ngoài (timeline ngoài, giây):";
const START_ARIA = "Bắt đầu (s)";
const DUR_ARIA = "Độ dài (s)";
const AUTOSAVE_WAIT = 7000;

async function runMainCases(cdp) {
  const EXPECTED = ["TOP-SPLIT-OUT", "TOP-SPLIT-EDGE", "TOP-SPLIT-OK", "TOP-SPLIT-PH", "TOP-SPLIT2", "TOP-SPLIT3", "TOP-DEEP", "TOP-DEEP-BLOCK", "TOP-LEAFCHK"];
  try {
    await openNestedPanel(cdp);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    log(`  J0 item panel: ${JSON.stringify(names)}`);
    const missing = EXPECTED.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`thiếu item: ${missing.join(", ")}`);
    casePass("J0-seed-load", `panel liệt kê đủ 9 item: ${names.join(", ")}`);
  } catch (e) { caseFail("J0-seed-load", e.message); return; }

  // J1: ngoài miền (9.9 < absoluteStart 10) — chặn, toast, spec không đổi.
  try {
    await drillToLeaf(cdp, "TOP-SPLIT-OUT", 0);
    const info = await rowInfo(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4");
    if (!info.found || !info.buttons.includes("Tách lá tại mốc ngoài")) throw new Error(`hàng lá OUT không có nút tách (info=${JSON.stringify(info)})`);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", SPLIT_ARIA, "9.9");
    const m = await clickRowButton(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J1 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)} typed=${JSON.stringify(typed)}`);
    if (!msg || !msg.includes("Mốc ngoài nằm ngoài phần khả kiến của clip lá")) throw new Error(`msg không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((t) => t.includes("Mốc ngoài nằm ngoài phần khả kiến"))) throw new Error(`toast không chứa OutOfRange (toasts=${JSON.stringify(toasts)})`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    const leaves = trackClips(after, "TOP-SPLIT-OUT", [], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`sau khi chặn, lá phải còn 1 (nhận ${leaves && leaves.length})`);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn ngoài miền");
    casePass("J1-split-out-of-range", `gõ ${typed.method} "9.9" + click ${m} -> msg + toast OutOfRange đúng, lá còn 1, spec không đổi sau ${AUTOSAVE_WAIT}ms`);
  } catch (e) { caseFail("J1-split-out-of-range", e.message); }

  // J2: sát mép đầu (mốc = absoluteStart 10) -> TooCloseToEdge.
  try {
    await drillToLeaf(cdp, "TOP-SPLIT-EDGE", 0);
    const before = await readAutosaveSpec(cdp);
    await typeIntoRowInput(cdp, "TOP-SPLIT-EDGE", "edge-leaf.mp4", SPLIT_ARIA, "10");
    await clickRowButton(cdp, "TOP-SPLIT-EDGE", "edge-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J2 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("quá sát mép clip lá")) throw new Error(`msg không phải TooCloseToEdge (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((t) => t.includes("quá sát mép"))) throw new Error(`toast không chứa TooCloseToEdge`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn sát mép đầu");
    casePass("J2-split-edge-start", `gõ "10" -> msg + toast TooCloseToEdge đúng, spec không đổi`);
  } catch (e) { caseFail("J2-split-edge-start", e.message); }

  // J3: sát mép cuối (lá 3.98/4, mốc 12.4636) -> TooCloseToEdge.
  try {
    await typeIntoRowInput(cdp, "TOP-SPLIT-EDGE", "edge-leaf.mp4", SPLIT_ARIA, "12.4636");
    await clickRowButton(cdp, "TOP-SPLIT-EDGE", "edge-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J3 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("quá sát mép clip lá")) throw new Error(`msg không phải TooCloseToEdge (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((t) => t.includes("quá sát mép"))) throw new Error(`toast không chứa TooCloseToEdge`);
    await sleep(AUTOSAVE_WAIT);
    const spec = await readAutosaveSpec(cdp);
    const leaves = trackClips(spec, "TOP-SPLIT-EDGE", [], "v-in");
    if (!leaves || leaves.length !== 1 || Math.abs(leaves[0].duration - 4) > 1e-9) throw new Error(`lá EDGE phải còn nguyên 1 clip dài 4 (nhận ${JSON.stringify(leaves)})`);
    casePass("J3-split-edge-end", `gõ "12.4636" (lá 3.98/4) -> msg + toast TooCloseToEdge đúng, lá còn nguyên`);
  } catch (e) { caseFail("J3-split-edge-end", e.message); }

  // J4: sau 3 lần chặn, Ctrl+Z phải là no-op (không sinh entry undo nào).
  try {
    const before = await readAutosaveSpec(cdp);
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error(`Ctrl+Z sau các lần chặn đã đổi spec (top đổi: ${specDiffTops(before, after).join(", ")})`);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    const missing = EXPECTED.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`sau Ctrl+Z, panel mất item: ${missing.join(", ")}`);
    casePass("J4-blocked-no-undo", "Ctrl+Z sau 3 lần chặn là no-op: spec không đổi, panel vẫn đủ 9 item (không entry undo nào được sinh)");
  } catch (e) { caseFail("J4-blocked-no-undo", e.message); }

  // J5: tách thành công bằng gõ tay (11.4641 -> lá 2.0s) + Ctrl+Z hoàn tác.
  try {
    await drillToLeaf(cdp, "TOP-SPLIT-OK", 0);
    await typeIntoRowInput(cdp, "TOP-SPLIT-OK", "ok-leaf.mp4", SPLIT_ARIA, "11.4641");
    await clickRowButton(cdp, "TOP-SPLIT-OK", "ok-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J5 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("Đã tách lá tại 00:02.0")) throw new Error(`msg thành công sai (msg=${JSON.stringify(msg)}, muốn chứa "Đã tách lá tại 00:02.0")`);
    if (toasts.length !== 0) throw new Error(`tách thành công không được toast (toasts=${JSON.stringify(toasts)})`);
    await sleep(AUTOSAVE_WAIT);
    let spec = await readAutosaveSpec(cdp);
    let leaves = trackClips(spec, "TOP-SPLIT-OK", [], "v-in");
    if (!leaves || leaves.length !== 2) throw new Error(`lá phải tách thành 2 (nhận ${leaves && leaves.length})`);
    approx(leaves[0].duration, 2, 0.01, "nửa trái dài");
    approx(leaves[1].duration, 2, 0.01, "nửa phải dài");
    approx(leaves[1].start, 2, 0.01, "nửa phải bắt đầu tại");
    // in/out KHÔNG assert bằng tuyệt đối: mốc gõ tay 11.4641 làm tròn
    // từ neo đúng 11.4641016 nên điểm cắt nguồn lệch ~3e-6 là đúng
    // (đạo hàm τ: d leaf/d outer ≈ 1.73) — dung sai 1e-3, run1 fail
    // đúng chỗ này vì assert cũ dùng === 102 (lỗi harness, không phải app).
    approx(leaves[0].out, 102, 1e-3, "nửa trái out");
    approx(leaves[1].in, 102, 1e-3, "nửa phải in");
    if (leaves[0].in !== 100 || leaves[1].out !== 104) throw new Error(`in/out đầu-cuối sai: ${JSON.stringify(leaves.map((l) => [l.in, l.out]))} (muốn 100/.../104)`);
    const top = topClip(spec, "TOP-SPLIT-OK");
    if (JSON.stringify(top.trim) !== JSON.stringify({ in: 0, out: 8 })) throw new Error(`trim top đổi sau khi tách: ${JSON.stringify(top.trim)}`);
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    spec = await readAutosaveSpec(cdp);
    leaves = trackClips(spec, "TOP-SPLIT-OK", [], "v-in");
    if (!leaves || leaves.length !== 1 || Math.abs(leaves[0].duration - 4) > 1e-9) throw new Error(`sau Ctrl+Z, lá phải về 1 clip dài 4 (nhận ${JSON.stringify(leaves)})`);
    casePass("J5-split-typed-success-undo", `gõ "11.4641" -> msg "Đã tách lá tại 00:02.0", 2 nửa 2s/2s in-out 100/102/104, trim top {0,8} không đổi, Ctrl+Z về 1 lá (đúng 1 bước undo)`);
  } catch (e) { caseFail("J5-split-typed-success-undo", e.message); }

  // J6: tách 2 tầng ramp bằng gõ tay (τ₁₃(τ₁₂(2)) = 1.2600 -> lá 2.0s;
  // run1 gõ 1.2594 là tính nhầm sqrt (số đúng 1.25997), app cho in
  // 101.9987 khớp đúng đạo hàm chuỗi τ — lỗi neo của harness).
  try {
    await drillToLeaf(cdp, "TOP-SPLIT2", 1);
    await typeIntoRowInput(cdp, "TOP-SPLIT2", "split2-leaf.mp4", SPLIT_ARIA, "1.2600");
    await clickRowButton(cdp, "TOP-SPLIT2", "split2-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg } = await readMsgAndToasts(cdp);
    log(`  J6 msg=${JSON.stringify(msg)}`);
    if (!msg || !msg.includes("Đã tách lá tại 00:02.0")) throw new Error(`msg thành công sai (msg=${JSON.stringify(msg)})`);
    await sleep(AUTOSAVE_WAIT);
    let spec = await readAutosaveSpec(cdp);
    let leaves = trackClips(spec, "TOP-SPLIT2", ["MID-SPLIT2"], "v-in");
    if (!leaves || leaves.length !== 2) throw new Error(`lá 2 tầng phải tách thành 2 (nhận ${leaves && leaves.length})`);
    approx(leaves[0].duration, 2, 0.01, "nửa trái dài");
    approx(leaves[1].duration, 2, 0.01, "nửa phải dài");
    approx(leaves[1].in, 102, 1e-3, "nửa phải in (dung sai neo gõ tay)");
    const top = topClip(spec, "TOP-SPLIT2");
    const mid = findNestedClip(spec, "TOP-SPLIT2", [], "MID-SPLIT2");
    if (JSON.stringify(top.trim) !== JSON.stringify({ in: 0, out: 8 })) throw new Error(`trim top đổi: ${JSON.stringify(top.trim)}`);
    if (JSON.stringify(mid.trim) !== JSON.stringify({ in: 0, out: 6 })) throw new Error(`trim mid đổi: ${JSON.stringify(mid.trim)}`);
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    spec = await readAutosaveSpec(cdp);
    leaves = trackClips(spec, "TOP-SPLIT2", ["MID-SPLIT2"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`sau Ctrl+Z, lá 2 tầng phải về 1 (nhận ${leaves && leaves.length})`);
    casePass("J6-split-two-level-success-undo", `gõ "1.2600" (τ₁₃(τ₁₂(2)) ≈ 1.25997) -> msg 00:02.0, 2 nửa 2s/2s, trim top {0,8} + mid {0,6} không đổi, Ctrl+Z hoàn tác`);
  } catch (e) { caseFail("J6-split-two-level-success-undo", e.message); }

  // J7: tách 3 tầng ramp bằng gõ tay (τ₁₃(τ₁₂(τ₁₂(2))) = 1.1040 -> lá 2.0s;
  // run1 gõ 1.1042 (lệch +2e-4), app cho in 102.0005 khớp đúng đạo hàm
  // chuỗi τ — lỗi neo của harness, đã sửa).
  try {
    await drillToLeaf(cdp, "TOP-SPLIT3", 2);
    await typeIntoRowInput(cdp, "TOP-SPLIT3", "split3-leaf.mp4", SPLIT_ARIA, "1.1040");
    await clickRowButton(cdp, "TOP-SPLIT3", "split3-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg } = await readMsgAndToasts(cdp);
    log(`  J7 msg=${JSON.stringify(msg)}`);
    if (!msg || !msg.includes("Đã tách lá tại 00:02.0")) throw new Error(`msg thành công sai (msg=${JSON.stringify(msg)})`);
    await sleep(AUTOSAVE_WAIT);
    let spec = await readAutosaveSpec(cdp);
    let leaves = trackClips(spec, "TOP-SPLIT3", ["A-SPLIT3", "B-SPLIT3"], "v-in");
    if (!leaves || leaves.length !== 2) throw new Error(`lá 3 tầng phải tách thành 2 (nhận ${leaves && leaves.length})`);
    approx(leaves[0].duration, 2, 0.01, "nửa trái dài");
    approx(leaves[1].duration, 2, 0.01, "nửa phải dài");
    approx(leaves[1].in, 102, 1e-3, "nửa phải in (dung sai neo gõ tay)");
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    spec = await readAutosaveSpec(cdp);
    leaves = trackClips(spec, "TOP-SPLIT3", ["A-SPLIT3", "B-SPLIT3"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`sau Ctrl+Z, lá 3 tầng phải về 1 (nhận ${leaves && leaves.length})`);
    casePass("J7-split-three-level-success-undo", `gõ "1.1040" (τ₁₃(τ₁₂(τ₁₂(2))) ≈ 1.10405) -> msg 00:02.0, 2 nửa 2s/2s, Ctrl+Z hoàn tác (panel truyền đúng chainIds 2 tầng)`);
  } catch (e) { caseFail("J7-split-three-level-success-undo", e.message); }

  // J8: nút "Lấy từ playhead" — scrub ruler tới ~11.4641 rồi bấm nút.
  try {
    await closeNestedPanelIfOpen(cdp);
    const scrub = await scrubTo(cdp, 11.4641);
    // Chuẩn so sánh là vạch playhead (chính xác ~1px ≈ 0.017s), không phải
    // text làm tròn 0.1s; nếu không thấy vạch thì fallback text ±0.11.
    const refT = scrub.tTrue !== null ? scrub.tTrue : scrub.t;
    const refTol = scrub.tTrue !== null ? 0.05 : 0.11;
    if (refT === null || Math.abs(refT - 11.4641) > 0.1) throw new Error(`playhead sau scrub không phải ~11.4641 (vạch=${scrub.tTrue}, text=${scrub.t})`);
    await openNestedPanel(cdp);
    await drillToLeaf(cdp, "TOP-SPLIT-PH", 0);
    const m = await clickRowButton(cdp, "TOP-SPLIT-PH", "ph-leaf.mp4", "Lấy từ playhead");
    const inputVal = await readRowInput(cdp, "TOP-SPLIT-PH", "ph-leaf.mp4", SPLIT_ARIA);
    log(`  J8 sau "Lấy từ playhead": input=${inputVal} vạch=${scrub.tTrue} text=${scrub.t} click=${m}`);
    if (inputVal === null || Math.abs(Number(inputVal) - refT) > refTol) throw new Error(`input sau "Lấy từ playhead" không khớp playhead (input=${inputVal}, chuẩn=${refT} ±${refTol})`);
    await clickRowButton(cdp, "TOP-SPLIT-PH", "ph-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg } = await readMsgAndToasts(cdp);
    log(`  J8 msg=${JSON.stringify(msg)}`);
    if (!msg || !msg.includes("Đã tách lá tại")) throw new Error(`msg thành công sai (msg=${JSON.stringify(msg)}, muốn chứa "Đã tách lá tại")`);
    await sleep(AUTOSAVE_WAIT);
    let spec = await readAutosaveSpec(cdp);
    let leaves = trackClips(spec, "TOP-SPLIT-PH", [], "v-in");
    if (!leaves || leaves.length !== 2) throw new Error(`lá PH phải tách thành 2 (nhận ${leaves && leaves.length})`);
    approx(leaves[0].duration, 2, 0.1, "nửa trái dài (dung sai scrub)");
    approx(leaves[1].duration, 2, 0.1, "nửa phải dài (dung sai scrub)");
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    spec = await readAutosaveSpec(cdp);
    leaves = trackClips(spec, "TOP-SPLIT-PH", [], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`sau Ctrl+Z, lá PH phải về 1 (nhận ${leaves && leaves.length})`);
    casePass("J8-split-playhead-success-undo", `scrub (60 px/s) -> vạch ${scrub.tTrue} (text ${scrub.t}), "Lấy từ playhead" điền input=${inputVal}, tách -> 2 nửa ~2s/2s (dung sai scrub ±0.1), Ctrl+Z hoàn tác`);
  } catch (e) { caseFail("J8-split-playhead-success-undo", e.message); }

  // J9: sửa vị trí nested trung gian sâu (DEEP-TARGET 0 -> 1) qua panel.
  try {
    await drillToLeaf(cdp, "TOP-DEEP", 2);
    const info = await rowInfo(cdp, "TOP-DEEP", "DEEP-TARGET");
    log(`  J9 row DEEP-TARGET: ${JSON.stringify(info)}`);
    if (!info.found || !info.buttons.includes("Lưu clip con")) throw new Error(`không thấy DeepIntermediateEditor cho DEEP-TARGET (info=${JSON.stringify(info)}) — panel còn hiện ghi chú giới hạn H6 thì đây là FAIL`);
    await typeIntoRowInput(cdp, "TOP-DEEP", "DEEP-TARGET", START_ARIA, "1");
    await clickRowButton(cdp, "TOP-DEEP", "DEEP-TARGET", "Lưu clip con");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J9 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("Đã lưu clip con (1 bước undo)")) throw new Error(`msg lưu sai (msg=${JSON.stringify(msg)})`);
    await sleep(AUTOSAVE_WAIT);
    let spec = await readAutosaveSpec(cdp);
    let deep = findNestedClip(spec, "TOP-DEEP", ["MID-ID", "IN-ID"], "DEEP-ID");
    if (!deep || deep.start !== 1 || deep.duration !== 2) throw new Error(`deep sau khi lưu sai vị trí: ${JSON.stringify(deep && [deep.start, deep.duration])} (muốn [1, 2])`);
    const dl = findNestedClip(spec, "TOP-DEEP", ["MID-ID", "IN-ID", "DEEP-ID"], "dl");
    if (!dl || dl.start !== 0 || dl.duration !== 2) throw new Error(`lá dl trong deep bị đổi theo: ${JSON.stringify(dl && [dl.start, dl.duration])}`);
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    spec = await readAutosaveSpec(cdp);
    deep = findNestedClip(spec, "TOP-DEEP", ["MID-ID", "IN-ID"], "DEEP-ID");
    if (!deep || deep.start !== 0) throw new Error(`sau Ctrl+Z, deep phải về start 0 (nhận ${deep && deep.start})`);
    casePass("J9-intermediate-move-success-undo", `DeepIntermediateEditor hiện (không còn ghi chú H6), dời DEEP-TARGET 0->1: autosave deep [1,2], lá dl [0,2] không đổi, Ctrl+Z về [0,2]`);
  } catch (e) { caseFail("J9-intermediate-move-success-undo", e.message); }

  // J10: chặn cổng hai tầng của trung gian sâu (deep 4× × lá 2×, tích 8 > 4).
  try {
    await drillToLeaf(cdp, "TOP-DEEP-BLOCK", 2);
    const info = await rowInfo(cdp, "TOP-DEEP-BLOCK", "DEEP-BLOCKED");
    if (!info.found || !info.buttons.includes("Lưu clip con")) throw new Error(`không thấy DeepIntermediateEditor cho DEEP-BLOCKED (info=${JSON.stringify(info)})`);
    const before = await readAutosaveSpec(cdp);
    await typeIntoRowInput(cdp, "TOP-DEEP-BLOCK", "DEEP-BLOCKED", START_ARIA, "1");
    await clickRowButton(cdp, "TOP-DEEP-BLOCK", "DEEP-BLOCKED", "Lưu clip con");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J10 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("vượt khoảng")) throw new Error(`msg không nêu nhánh combinedRange (msg=${JSON.stringify(msg)}, muốn chứa "vượt khoảng")`);
    if (toasts.length !== 0) throw new Error(`action trung gian không được tự toast (toasts=${JSON.stringify(toasts)})`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn cổng hai tầng");
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    const afterUndo = await readAutosaveSpec(cdp);
    if (JSON.stringify(afterUndo) !== JSON.stringify(before)) throw new Error(`Ctrl+Z sau lần chặn đã đổi spec (top đổi: ${specDiffTops(before, afterUndo).join(", ")}) — nếu các case thành công trước đó chưa hoàn tác thì đây là fail dây chuyền của harness, xem log`);
    casePass("J10-intermediate-blocked-check", `dời DEEP-BLOCKED 0->1 bị chặn: msg chứa "vượt khoảng" (combinedRange qua check object, không tách chuỗi), 0 toast, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("J10-intermediate-blocked-check", e.message); }

  // J11: nút lá sâu sau chuyển check object (I3a) — nhánh ancestorReverse.
  try {
    await drillToLeaf(cdp, "TOP-LEAFCHK", 1);
    const row = await rowInfo(cdp, "TOP-LEAFCHK", "chk-leaf.mp4");
    if (!row.found || !row.buttons.includes("Đặt curve 1× cho lá")) throw new Error(`hàng lá CHK không có nút curve (row=${JSON.stringify(row)})`);
    await clickRowButton(cdp, "TOP-LEAFCHK", "chk-leaf.mp4", "Đặt curve 1× cho lá");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J11 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes('tổ tiên "MID-CHK" đang reverse')) throw new Error(`msg không chứa nhánh ancestorReverse (msg=${JSON.stringify(msg)})`);
    const after = await rowInfo(cdp, "TOP-LEAFCHK", "chk-leaf.mp4");
    if (!after.buttons.includes("Đặt curve 1× cho lá")) throw new Error(`sau khi chặn, nút lá phải còn (row=${JSON.stringify(after)})`);
    await sleep(AUTOSAVE_WAIT);
    const spec = await readAutosaveSpec(cdp);
    const leaf = findNestedClip(spec, "TOP-LEAFCHK", ["MID-CHK"], "CHK-LEAF");
    if (leaf && leaf.speedKeyframes) throw new Error(`autosave: lá bị chặn vẫn nhận curve`);
    casePass("J11-leaf-check-block", `bấm "Đặt curve 1× cho lá" ở lá sâu -> msg ancestorReverse (MID-CHK) đúng, nút còn nguyên, autosave không curve (xem LIMITS: DOM không phân biệt được đường check object với đường reason-string cũ — đường check được khóa ở tầng store bởi test I3)`);
  } catch (e) { caseFail("J11-leaf-check-block", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("J12-no-crash-main", "0 Runtime.exceptionThrown trong phiên main");
  } else {
    caseFail("J12-no-crash-main", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

async function runRiskyCases(cdp, firstClickAt) {
  // Ngưỡng phân biệt exception lúc load vs lúc thao tác: đặt ngay sau
  // loadSession (trước mọi click panel) — các click gõ/drill sau đó
  // đều tính là "từ lúc tương tác trở đi" nếu ném exception.
  firstClickAt.value = Date.now();
  const EXPECTED = ["TOP-CURV", "TOP-INNERFAIL"];
  let listed = [];
  try {
    await openNestedPanel(cdp);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    listed = names;
    log(`  J0b item panel: ${JSON.stringify(names)}`);
    const missing = EXPECTED.filter((n) => !names.includes(n));
    if (missing.length) {
      caseSeedRejected("J0b-seed-load-risky", `thiếu item: ${missing.join(", ")} (validator load có thể đã từ chối fixture vi phạm) — các case của item thiếu sẽ seed-rejected riêng, case còn lại vẫn chạy`);
    } else {
      casePass("J0b-seed-load-risky", `panel liệt kê đủ 2 item risky: ${names.join(", ")}`);
    }
  } catch (e) { caseFail("J0b-seed-load-risky", e.message); }

  // J13: curve top v=5 -> curveInvalid (helper fail-fast, không lộ msg gốc).
  try {
    if (!listed.includes("TOP-CURV")) {
      caseSeedRejected("J13-split-curve-invalid", "TOP-CURV không lên panel (seed bị từ chối) — không kết luận về nhánh curveInvalid");
    } else {
    await drillToLeaf(cdp, "TOP-CURV", 0);
    const before = await readAutosaveSpec(cdp);
    await typeIntoRowInput(cdp, "TOP-CURV", "curv-leaf.mp4", SPLIT_ARIA, "11");
    await clickRowButton(cdp, "TOP-CURV", "curv-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J13 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("không đảo được mốc ngoài")) throw new Error(`msg không phải CurveInvalid (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((t) => t.includes("không đảo được mốc ngoài"))) throw new Error(`toast không chứa CurveInvalid`);
    if (msg.includes("speedKeyframes")) throw new Error(`msg lộ message gốc của helper (chứa speedKeyframes)`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn curveInvalid");
    casePass("J13-split-curve-invalid", `gõ "11" với top v=5 -> msg + toast CurveInvalid đúng, không lộ "speedKeyframes", spec không đổi`);
    }
  } catch (e) { caseFail("J13-split-curve-invalid", e.message); }

  // J14: lá reverse + curve -> innerFailed.
  try {
    if (!listed.includes("TOP-INNERFAIL")) {
      caseSeedRejected("J14-split-inner-failed", "TOP-INNERFAIL không lên panel (seed bị từ chối) — không kết luận về nhánh innerFailed");
    } else {
    await drillToLeaf(cdp, "TOP-INNERFAIL", 0);
    const before = await readAutosaveSpec(cdp);
    await typeIntoRowInput(cdp, "TOP-INNERFAIL", "inner-leaf.mp4", SPLIT_ARIA, "11.4641");
    await clickRowButton(cdp, "TOP-INNERFAIL", "inner-leaf.mp4", "Tách lá tại mốc ngoài");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  J14 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("Không tách được clip lá tại điểm đã đổi")) throw new Error(`msg không phải InnerFailed (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((t) => t.includes("Không tách được clip lá"))) throw new Error(`toast không chứa InnerFailed`);
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error("spec đổi sau khi chặn innerFailed");
    casePass("J14-split-inner-failed", `gõ "11.4641" với lá reverse+curve -> msg + toast InnerFailed đúng, spec không đổi`);
    }
  } catch (e) { caseFail("J14-split-inner-failed", e.message); }

  // J15: exception trong phiên risky chỉ được phép ở lúc load (mẫu I6 D7).
  const loadExceptions = cdp.exceptions.filter((x) => {
    const t = Date.parse(x.at);
    return Number.isNaN(t) || t < firstClickAt.value;
  });
  const clickExceptions = cdp.exceptions.filter((x) => {
    const t = Date.parse(x.at);
    return !Number.isNaN(t) && t >= firstClickAt.value;
  });
  log(`  J15 exceptions: tổng=${cdp.exceptions.length}, lúc load=${loadExceptions.length}, từ lúc click trở đi=${clickExceptions.length}`);
  for (const x of cdp.exceptions) log(`  J15 exception: ${x.at} :: ${x.text.slice(0, 300)}`);
  if (clickExceptions.length === 0) {
    casePass("J15-risky-exceptions-load-only", `${cdp.exceptions.length} exception trong phiên risky, tất cả (nếu có) đều trước lần click đầu tiên (lúc load, mẫu I6 D7) — không exception nào do thao tác tách gây ra`);
  } else {
    caseFail("J15-risky-exceptions-load-only", `${clickExceptions.length} exception từ lúc click trở đi: ${JSON.stringify(clickExceptions[0])} (PHÁT HIỆN MỚI, xem LIMITS)`);
  }
}

// ------------------------------------------------------------- main ------
async function main() {
  log(`harness clicktest-split-intermediate-pipe: bắt đầu (label=${RUN_LABEL})`);
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

    // Phiên 1: main (kỳ vọng 0 exception).
    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên main)"); return 2; }
      holders.push(holder);
      try {
        await loadSession(cdp, mainSeed(), "J6 main seed");
        await runMainCases(cdp);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
      }
    }
    // Phiên 2: risky (curve v=5 + lá reverse+curve).
    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên risky)"); return 2; }
      holders.push(holder);
      const firstClickAt = { value: Number.MAX_SAFE_INTEGER };
      try {
        await loadSession(cdp, riskySeed(), "J6 risky seed");
        await runRiskyCases(cdp, firstClickAt);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
      }
    }
    const failed = results.filter((r) => r.status === "FAIL");
    const rejected = results.filter((r) => r.status === "SEED-REJECTED");
    exitCode = failed.length === 0 ? 0 : 1;
    log(`DONE clicktest-split-intermediate: ${results.filter((r) => r.status === "PASS").length}/${results.length} case pass, ${failed.length} fail, ${rejected.length} seed-rejected, exit=${exitCode}`);
  } catch (e) {
    log(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
    exitCode = 2;
  } finally {
    for (const h of holders) { try { h.chrome && h.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ } }
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { server && server.close(); } catch { /* bỏ qua */ }
    const out = {
      runAt: new Date().toISOString(), label: RUN_LABEL, display: DISPLAY, port: PORT,
      bundle: snapInfo ? snapInfo.bundle : null, bundleSha256_16: snapInfo ? snapInfo.sha : null,
      cases: results, log: logLines,
    };
    const outPath = path.join(ROOT, "benchmarks", "results", "clicktest-split-intermediate-r26j6.json");
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
      console.log(`results JSON: ${outPath}`);
    } catch (e) { console.log(`không ghi được results JSON: ${e.message}`); }
  }
  return exitCode;
}

process.exitCode = await main();
