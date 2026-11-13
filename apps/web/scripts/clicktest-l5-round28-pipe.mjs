#!/usr/bin/env node
/**
 * clicktest-l5-round28-pipe.mjs — Phase 9 đợt 28, luồng L5:
 * click-test browser thật đóng nốt nợ đợt 27 §3.5/§7 của K6:
 *  (1) guard mốc rỗng ở locale en bấm thật (câu en từng chữ);
 *  (2) mốc âm "-1" và mốc trước cửa sổ nhưng dương ("9.9" < top start
 *      10) ở chain sâu 2-3 tầng qua panel, bấm riêng từng hướng;
 *  (3) NaN qua UI: thử mọi đường nhập hợp lệ (gõ, paste, kéo, spinner)
 *      — nếu không tạo được thì kết luận đúng như vậy, không fake case.
 * Kế thừa infra K6 (pipe CDP + snapshot dist + seed qua autosave).
 * Fixture mới TOP-NEG2/TOP-NEG3: chain sâu như TOP-SPLIT2/3 nhưng top
 * start=10 nên cửa sổ khả kiến bắt đầu ở 10.
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG binary.
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-l5-round28-pipe.mjs
 * Biến môi trường: L5_DISPLAY (mặc định :95), L5_PORT (mặc định 4195),
 * L5_RUN_LABEL, L5_OUT (mặc định v28-l5-clicktest.json).
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round28-l5");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.L5_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.L5_DISPLAY || ":95";
const PORT = Number(process.env.L5_PORT || 4195);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.L5_RUN_LABEL || "run1";
const EMPTY_MODE = process.env.L5_EMPTY_MODE || "guard";
const OUT_FILE = process.env.L5_OUT || "v28-l5-clicktest.json";
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
  const distDir = process.env.L5_DIST_DIR || path.join(WEB_DIR, "dist");
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "l5-pipe-"));
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

/** Top ramp 1→3 (top start tùy ý) > mid ramp 1→2 > lá (như rampTopTwo). */
function rampTopTwoAt(topId, midId, leafId, src, topStart) {
  return {
    id: `t-${topId.toLowerCase()}`, kind: "video",
    clips: [nestedClip(topId, topId, topStart, 4,
      subSpec([{ id: "v-mid", clips: [nestedClip(midId, midId, 0, 4,
        subSpec([{ id: "v-in", clips: [videoLeaf(leafId, src, 0, 4, 100, 104)] }]),
        { trim: { in: 0, out: 6 }, speedKeyframes: LIN12_4 })] }]),
      { trim: { in: 0, out: 8 }, speedKeyframes: LIN13_4 })],
  };
}
/** Top ramp 1→3 (top start tùy ý) > A ramp 1→2 > B ramp 1→2 > lá (như rampTopThree). */
function rampTopThreeAt(topId, aId, bId, leafId, src, topStart) {
  return {
    id: `t-${topId.toLowerCase()}`, kind: "video",
    clips: [nestedClip(topId, topId, topStart, 4,
      subSpec([{ id: "v-a", clips: [nestedClip(aId, aId, 0, 4,
        subSpec([{ id: "v-b", clips: [nestedClip(bId, bId, 0, 4,
          subSpec([{ id: "v-in", clips: [videoLeaf(leafId, src, 0, 4, 100, 104)] }]),
          { trim: { in: 0, out: 6 }, speedKeyframes: LIN12_4 })] }]),
        { trim: { in: 0, out: 6 }, speedKeyframes: LIN12_4 })] }]),
      { trim: { in: 0, out: 8 }, speedKeyframes: LIN13_4 })],
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
      rampTopTwoAt("TOP-NEG2", "MID-NEG2", "NEG2-LEAF", "neg2-leaf.mp4", 10),
      rampTopThreeAt("TOP-NEG3", "A-NEG3", "B-NEG3", "NEG3-LEAF", "neg3-leaf.mp4", 10),
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
const EXPECTED_ITEMS = ["TOP-SPLIT-OUT", "TOP-SPLIT-EDGE", "TOP-SPLIT-OK", "TOP-SPLIT-PH", "TOP-SPLIT2", "TOP-SPLIT3", "TOP-DEEP", "TOP-DEEP-BLOCK", "TOP-LEAFCHK", "TOP-NEG2", "TOP-NEG3"];

async function panelFullText(cdp) {
  return cdp.evaluate(`document.querySelector(".nested-panel") ? (document.querySelector(".nested-panel").textContent || "") : ""`);
}

// ------------------------------------------------------------- L5 cases --
// Luồng L5 đợt 28: đóng nốt nợ đợt 27 §3.5/§7 — (1) guard mốc rỗng ở
// locale en bấm thật, (2) mốc âm + mốc trước cửa sổ ở chain sâu qua
// panel bấm riêng, (3) NaN qua UI thử mọi đường nhập hợp lệ.
// Fixture mới TOP-NEG2/TOP-NEG3: chain sâu như TOP-SPLIT2/3 nhưng top
// start=10 nên cửa sổ khả kiến bắt đầu ở 10 — "9.9" là trước cửa sổ
// nhưng vẫn dương (tách khỏi hướng âm "-1"), cả hai đều phải chặn
// OutOfRange. Không sửa code sản phẩm.

async function focusRowInputRect(cdp, itemName, label, aria) {
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
  return rect;
}

async function pressHome(cdp) {
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", code: "Home", key: "Home", windowsVirtualKeyCode: 36 }, cdp.sessionId, 15000);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", code: "Home", key: "Home", windowsVirtualKeyCode: 36 }, cdp.sessionId, 15000);
}

/** Đưa "-1" vào ô number controlled bằng đường UI thật, thử lần lượt:
 *  (a) gõ trực tiếp "-1" (dự kiến mất dấu "-" do Chrome sanitize ký tự
 *  "-" đơn lẻ về "" rồi React controlled input ghi đè), (b) gõ "1" rồi
 *  Home rồi gõ "-" (chuỗi "-1" hợp lệ trong một lần sửa), (c) paste
 *  insertText "-1" (một lần sửa nguyên chuỗi). Trả về đường thành công
 *  kèm toàn bộ giá trị quan sát được — không dùng JS setter. */
async function typeNegative(cdp, itemName, label, aria) {
  const attempts = [];
  await clearRowInput(cdp, itemName, label, aria);
  let rect = await focusRowInputRect(cdp, itemName, label, aria);
  await cdp.clickRect(rect);
  await sleep(300);
  await cdp.typeChars("-1");
  await sleep(500);
  let v = await readRowInput(cdp, itemName, label, aria);
  attempts.push({ method: "cdp-char-direct", typed: "-1", value: v });
  if (v === "-1") return { method: "cdp-char-direct", attempts, value: v };
  await clearRowInput(cdp, itemName, label, aria);
  rect = await focusRowInputRect(cdp, itemName, label, aria);
  await cdp.clickRect(rect);
  await sleep(300);
  await cdp.typeChars("1");
  await sleep(300);
  await pressHome(cdp);
  await sleep(300);
  await cdp.typeChars("-");
  await sleep(500);
  v = await readRowInput(cdp, itemName, label, aria);
  attempts.push({ method: "cdp-char-home-minus", typed: "1+Home+-", value: v });
  if (v === "-1") return { method: "cdp-char-home-minus", attempts, value: v };
  await clearRowInput(cdp, itemName, label, aria);
  rect = await focusRowInputRect(cdp, itemName, label, aria);
  await cdp.clickRect(rect);
  await sleep(300);
  await cdp.send("Input.insertText", { text: "-1" }, cdp.sessionId, 15000);
  await sleep(500);
  v = await readRowInput(cdp, itemName, label, aria);
  attempts.push({ method: "paste-insertText", typed: "-1", value: v });
  if (v === "-1") return { method: "paste-insertText", attempts, value: v };
  throw new Error(`không đưa được "-1" vào input bằng đường UI thật: ${JSON.stringify(attempts)}`);
}

/** Khóa chặn: spec không đổi sau autosave, Ctrl+Z no-op. */
async function assertBlockedNoUndo(cdp, before, what) {
  await sleep(AUTOSAVE_WAIT);
  const after = await readAutosaveSpec(cdp);
  if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error(`${what}: spec đổi sau khi chặn (top đổi: ${specDiffTops(before, after).join(", ")})`);
  await cdp.pressCtrlZ();
  await sleep(800);
  await sleep(AUTOSAVE_WAIT);
  const afterUndo = await readAutosaveSpec(cdp);
  if (JSON.stringify(afterUndo) !== JSON.stringify(before)) throw new Error(`${what}: Ctrl+Z sau lần chặn đã đổi spec (top đổi: ${specDiffTops(before, afterUndo).join(", ")})`);
  return after;
}

async function runViCases(cdp) {
  const t = TX.vi;
  try {
    await openNestedPanel(cdp, t.panelTitle);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    log(`  L0 item panel: ${JSON.stringify(names)}`);
    const missing = EXPECTED_ITEMS.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`thiếu item: ${missing.join(", ")}`);
    casePass("L0-seed-load", `panel liệt kê đủ 11 item: ${names.join(", ")}`);
  } catch (e) { caseFail("L0-seed-load", e.message); return; }

  // L1: mốc âm "-1" ở chain 2 tầng qua panel (TOP-NEG2, top start=10).
  try {
    await drillToLeaf(cdp, "TOP-NEG2", 1, t.view);
    const before = await readAutosaveSpec(cdp);
    const neg = await typeNegative(cdp, "TOP-NEG2", "neg2-leaf.mp4", t.splitAria);
    const m = await clickRowButton(cdp, "TOP-NEG2", "neg2-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  L1 neg=${JSON.stringify(neg)} msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast không chứa OutOfRange`);
    const after = await assertBlockedNoUndo(cdp, before, "L1");
    const leaves = trackClips(after, "TOP-NEG2", ["MID-NEG2"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá NEG2 phải còn 1 (nhận ${leaves && leaves.length})`);
    casePass("L1-neg-two-level", `mốc âm "-1" vào bằng ${neg.method} (thử: ${neg.attempts.map((a) => `${a.method}->${JSON.stringify(a.value)}`).join("; ")}) + click ${m} -> msg + toast OutOfRange đúng, lá còn 1, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("L1-neg-two-level", e.message); }

  // L2: mốc âm "-1" ở chain 3 tầng qua panel (TOP-NEG3, top start=10).
  try {
    await drillToLeaf(cdp, "TOP-NEG3", 2, t.view);
    const before = await readAutosaveSpec(cdp);
    const neg = await typeNegative(cdp, "TOP-NEG3", "neg3-leaf.mp4", t.splitAria);
    const m = await clickRowButton(cdp, "TOP-NEG3", "neg3-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  L2 neg=${JSON.stringify(neg)} msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast không chứa OutOfRange`);
    const after = await assertBlockedNoUndo(cdp, before, "L2");
    const leaves = trackClips(after, "TOP-NEG3", ["A-NEG3", "B-NEG3"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá NEG3 phải còn 1 (nhận ${leaves && leaves.length})`);
    casePass("L2-neg-three-level", `mốc âm "-1" vào bằng ${neg.method} (thử: ${neg.attempts.map((a) => `${a.method}->${JSON.stringify(a.value)}`).join("; ")}) + click ${m} -> msg + toast OutOfRange đúng, lá còn 1, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("L2-neg-three-level", e.message); }

  // L3: mốc trước cửa sổ nhưng dương ("9.9" < top start 10) ở chain 2 tầng.
  try {
    await drillToLeaf(cdp, "TOP-NEG2", 1, t.view);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-NEG2", "neg2-leaf.mp4", t.splitAria, "9.9");
    const m = await clickRowButton(cdp, "TOP-NEG2", "neg2-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  L3 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)} typed=${JSON.stringify(typed)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast không chứa OutOfRange`);
    const after = await assertBlockedNoUndo(cdp, before, "L3");
    const leaves = trackClips(after, "TOP-NEG2", ["MID-NEG2"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá NEG2 phải còn 1 (nhận ${leaves && leaves.length})`);
    casePass("L3-before-window-two-level", `gõ ${typed.method} "9.9" (dương, trước cửa sổ bắt đầu ở 10) + click ${m} -> msg + toast OutOfRange đúng, lá còn 1, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("L3-before-window-two-level", e.message); }

  // L4: mốc trước cửa sổ nhưng dương ("9.9") ở chain 3 tầng.
  try {
    await drillToLeaf(cdp, "TOP-NEG3", 2, t.view);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-NEG3", "neg3-leaf.mp4", t.splitAria, "9.9");
    const m = await clickRowButton(cdp, "TOP-NEG3", "neg3-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  L4 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)} typed=${JSON.stringify(typed)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast không chứa OutOfRange`);
    const after = await assertBlockedNoUndo(cdp, before, "L4");
    const leaves = trackClips(after, "TOP-NEG3", ["A-NEG3", "B-NEG3"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá NEG3 phải còn 1 (nhận ${leaves && leaves.length})`);
    casePass("L4-before-window-three-level", `gõ ${typed.method} "9.9" (dương, trước cửa sổ bắt đầu ở 10) + click ${m} -> msg + toast OutOfRange đúng, lá còn 1, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("L4-before-window-three-level", e.message); }

  // L5: thử tạo NaN qua UI bằng mọi đường nhập hợp lệ trên ô mốc của lá
  // trực tiếp TOP-SPLIT-OUT (start=10). Mỗi attempt: xoá trắng -> nhập
  // bằng đường đó -> đọc value thật -> bấm tách -> đọc msg thật.
  try {
    await drillToLeaf(cdp, "TOP-SPLIT-OUT", 0, t.view);
    const before = await readAutosaveSpec(cdp);
    const attempts = [];
    async function nanAttempt(id, action) {
      await clearRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
      const act = await action();
      const valueAfter = await readRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
      const m = await clickRowButton(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitBtn);
      const { msg } = await readMsgAndToasts(cdp);
      attempts.push({ id, ...act, valueAfter, click: m, msg });
      log(`  L5 ${id}: ${JSON.stringify(attempts[attempts.length - 1])}`);
    }
    async function focusSplitInput() {
      const rect = await focusRowInputRect(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
      await cdp.clickRect(rect);
      await sleep(300);
      return rect;
    }
    await nanAttempt("nan-type", async () => {
      await focusSplitInput();
      await cdp.typeChars("NaN");
      await sleep(500);
      return { input: "type-chars", text: "NaN" };
    });
    await nanAttempt("nan-paste", async () => {
      await focusSplitInput();
      await cdp.send("Input.insertText", { text: "NaN" }, cdp.sessionId, 15000);
      await sleep(500);
      return { input: "paste-insertText", text: "NaN" };
    });
    await nanAttempt("infinity-type", async () => {
      await focusSplitInput();
      await cdp.typeChars("Infinity");
      await sleep(500);
      return { input: "type-chars", text: "Infinity" };
    });
    await nanAttempt("overflow-paste", async () => {
      await focusSplitInput();
      await cdp.send("Input.insertText", { text: "1e999" }, cdp.sessionId, 15000);
      await sleep(500);
      return { input: "paste-insertText", text: "1e999" };
    });
    await nanAttempt("zero-div-type", async () => {
      await focusSplitInput();
      await cdp.typeChars("0/0");
      await sleep(500);
      return { input: "type-chars", text: "0/0" };
    });
    await nanAttempt("e-type", async () => {
      await focusSplitInput();
      await cdp.typeChars("e");
      await sleep(500);
      return { input: "type-chars", text: "e" };
    });
    await nanAttempt("drag-noop", async () => {
      const rect = await focusSplitInput();
      const vBefore = await readRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
      await cdp.drag(rect.x + 5, rect.y + rect.height / 2, rect.x + rect.width - 5);
      await sleep(500);
      const vAfter = await readRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
      return { input: "drag-across-input", text: `drag ${JSON.stringify(vBefore)} -> ${JSON.stringify(vAfter)}` };
    });
    await nanAttempt("spinner-click", async () => {
      const rect = await focusSplitInput();
      const x = Math.round(rect.x + rect.width - 6);
      const y = Math.round(rect.y + rect.height * 0.25);
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, cdp.sessionId, 15000);
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }, cdp.sessionId, 15000);
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }, cdp.sessionId, 15000);
      await sleep(500);
      return { input: "spinner-up-zone-click", text: `click (${x},${y}) cạnh phải 1/4 trên của ô` };
    });
    for (const a of attempts) {
      if (a.valueAfter === "NaN" || (typeof a.valueAfter === "string" && a.valueAfter.toLowerCase().includes("nan"))) {
        throw new Error(`attempt ${a.id} tạo được giá trị NaN: ${JSON.stringify(a.valueAfter)}`);
      }
      const okMsg = a.msg && (a.msg.includes(t.emptyMsg) || a.msg.includes(t.outOfRange));
      if (!okMsg) throw new Error(`attempt ${a.id}: msg không phải guard-rỗng cũng không phải OutOfRange (msg=${JSON.stringify(a.msg)})`);
    }
    await sleep(AUTOSAVE_WAIT);
    const after = await readAutosaveSpec(cdp);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error(`spec đổi sau loạt attempt NaN (top đổi: ${specDiffTops(before, after).join(", ")})`);
    await cdp.pressCtrlZ();
    await sleep(800);
    await sleep(AUTOSAVE_WAIT);
    const afterUndo = await readAutosaveSpec(cdp);
    if (JSON.stringify(afterUndo) !== JSON.stringify(before)) throw new Error(`Ctrl+Z sau loạt attempt NaN đã đổi spec (top đổi: ${specDiffTops(before, afterUndo).join(", ")})`);
    casePass("L5-nan-unreachable", `8 đường nhập đều không tạo được NaN: ${attempts.map((a) => `${a.id}(${a.input} ${JSON.stringify(a.text)}): value=${JSON.stringify(a.valueAfter)} msg=${JSON.stringify(a.msg)}`).join(" | ")}; spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("L5-nan-unreachable", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("L8-no-crash-vi", "0 Runtime.exceptionThrown trong phiên vi");
  } else {
    caseFail("L8-no-crash-vi", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

async function runEnCases(cdp) {
  const t = TX.en;
  const EN_EMPTY_FULL = "No outer time entered (the field is empty) — not split.";
  // L6: guard mốc rỗng ở locale en — bấm thật, so msg từng chữ.
  try {
    await openNestedPanel(cdp, t.panelTitle);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    log(`  L6 item panel (en): ${JSON.stringify(names)}`);
    const missing = EXPECTED_ITEMS.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`thiếu item: ${missing.join(", ")}`);
    await drillToLeaf(cdp, "TOP-SPLIT-OUT", 0, t.view);
    const before = await readAutosaveSpec(cdp);
    const typed = await typeIntoRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria, "11.4641");
    const cleared = await clearRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
    const inputBefore = await readRowInput(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitAria);
    if (inputBefore !== "") throw new Error(`sau khi xoá, input phải rỗng (nhận ${JSON.stringify(inputBefore)})`);
    const m = await clickRowButton(cdp, "TOP-SPLIT-OUT", "out-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  L6 typed=${JSON.stringify(typed)} cleared=${JSON.stringify(cleared)} msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (msg !== EN_EMPTY_FULL) throw new Error(`msg en phải đúng từng chữ câu guard (msg=${JSON.stringify(msg)})`);
    if (toasts.some((x) => x.includes(t.emptyMsg))) throw new Error(`guard en không được toast (toasts=${JSON.stringify(toasts)})`);
    if (msg.includes("nested.")) throw new Error(`msg en rơi key thô (msg=${JSON.stringify(msg)})`);
    for (const mk of VI_MARKERS) if (msg.includes(mk)) throw new Error(`msg en rò tiếng Việt (${mk} trong ${JSON.stringify(msg)})`);
    const after = await assertBlockedNoUndo(cdp, before, "L6");
    const leaves = trackClips(after, "TOP-SPLIT-OUT", [], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá OUT phải còn 1 (nhận ${leaves && leaves.length})`);
    casePass("L6-en-empty-guard", `locale en: gõ ${typed.method} "11.4641" rồi xoá trắng (${cleared.method}) + click ${m} -> msg đúng từng chữ "${EN_EMPTY_FULL}", 0 toast chứa câu guard, không key thô, không rò vi, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("L6-en-empty-guard", e.message); }

  // L7: mốc âm "-1" ở chain 2 tầng, locale en — msg + toast en OutOfRange.
  try {
    await drillToLeaf(cdp, "TOP-NEG2", 1, t.view);
    const before = await readAutosaveSpec(cdp);
    const neg = await typeNegative(cdp, "TOP-NEG2", "neg2-leaf.mp4", t.splitAria);
    const m = await clickRowButton(cdp, "TOP-NEG2", "neg2-leaf.mp4", t.splitBtn);
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  L7 neg=${JSON.stringify(neg)} msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes(t.outOfRange)) throw new Error(`msg en không phải OutOfRange (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((x) => x.includes(t.outOfRange))) throw new Error(`toast en không chứa OutOfRange`);
    if (msg.includes("nested.")) throw new Error(`msg en rơi key thô (msg=${JSON.stringify(msg)})`);
    for (const mk of VI_MARKERS) if (msg.includes(mk)) throw new Error(`msg en rò tiếng Việt (${mk} trong ${JSON.stringify(msg)})`);
    await assertBlockedNoUndo(cdp, before, "L7");
    const leaves = trackClips(await readAutosaveSpec(cdp), "TOP-NEG2", ["MID-NEG2"], "v-in");
    if (!leaves || leaves.length !== 1) throw new Error(`lá NEG2 phải còn 1 (nhận ${leaves && leaves.length})`);
    casePass("L7-en-neg-two-level", `locale en: mốc âm "-1" vào bằng ${neg.method} (thử: ${neg.attempts.map((a) => `${a.method}->${JSON.stringify(a.value)}`).join("; ")}) + click ${m} -> msg + toast en OutOfRange đúng, không key thô, không rò vi, spec không đổi, Ctrl+Z no-op`);
  } catch (e) { caseFail("L7-en-neg-two-level", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("L9-no-crash-en", "0 Runtime.exceptionThrown trong phiên en");
  } else {
    caseFail("L9-no-crash-en", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

// ------------------------------------------------------------- main ------
async function main() {
  log(`harness clicktest-l5-round28-pipe: bắt đầu (label=${RUN_LABEL} emptyMode=${EMPTY_MODE} out=${OUT_FILE})`);
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
        await loadSession(cdp, mainSeed(), "L5 vi seed", "vi");
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
        await loadSession(cdp, mainSeed(), "L5 en seed", "en");
        await runEnCases(cdp);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
      }
    }
    const failed = results.filter((r) => r.status === "FAIL");
    exitCode = failed.length === 0 ? 0 : 1;
    log(`DONE clicktest-l5-round28: ${results.filter((r) => r.status === "PASS").length}/${results.length} case pass, ${failed.length} fail, exit=${exitCode}`);
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
      distSrc: process.env.L5_DIST_DIR || path.join(WEB_DIR, "dist"),
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
