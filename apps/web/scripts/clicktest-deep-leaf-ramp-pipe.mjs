#!/usr/bin/env node
/**
 * clicktest-deep-leaf-ramp-pipe.mjs — Phase 9 đợt 25, luồng I6: click-test
 * browser thật cho (a) nút panel lá sâu DeepInnerLevel (đợt 24 H6) và
 * (b) nested ramp hai tầng linear×linear trên preview thật. KHÔNG Playwright.
 *
 * Kế thừa harness đợt 22 F (pipe CDP) + đợt 22 C (kéo scrub ruler, đóng
 * WelcomeModal trước mọi thao tác — bài học C: click đầu tiên trên profile
 * mới bị WelcomeModal nuốt):
 * - Chrome headed dưới Xvfb qua --remote-debugging-pipe (fd 3 ghi JSON+\0 /
 *   fd 4 đọc, tách bằng \0). Click thật bằng Input.dispatchMouseEvent;
 *   chỉ fallback element.click() khi CDP Input lỗi (case đó ghi rõ).
 * - Editor chạy bằng BẢN SAO dist tại thời điểm harness bắt đầu
 *   (snapshot vào scratch, phục vụ bằng static server node thuần):
 *   các luồng đợt 25 khác có thể build lại apps/web/dist song song —
 *   phục vụ dist trực tiếp sẽ làm bundle đổi/dọn giữa chừng. Snapshot
 *   được ghi hash + tên bundle vào JSON kết quả; harness dừng ở mức
 *   BLOCKER nếu snapshot không chứa chuỗi deepLevelHead (code H6) và
 *   curveCreate (code T4 trở lên).
 * - Seed qua autosave (localStorage key vcut-studio:autosave:v1) — đường
 *   này đã thông từ đợt 22 (parent vá validateClipDeep nhận kind nested):
 *   harness ghi envelope rồi reload, app tự khôi phục spec. Seed bị
 *   validator từ chối sẽ lộ ra ngay ở case D0/R0 (panel không liệt kê
 *   đủ item) — không báo fail giả cho nút.
 * - RelinkPanel là modal-backdrop (giống WelcomeModal): seed có media
 *   thiếu nên modal này hiện sau load — harness ĐÓNG nó bằng click thật
 *   vào nút "Đóng (bỏ qua)" trước mọi thao tác đo (setup, không phải case).
 * - WelcomeModal: tắt bằng localStorage vcut-welcomed=1 trước reload
 *   (mẫu đợt 22 F), không click qua nó.
 *
 * Thoát mã: 0 = mọi case pass (case SEED-REJECTED không tính fail nhưng
 * được báo riêng); 1 = có case fail trên UI thật; 2 = blocker hạ tầng.
 * Kết quả JSON: benchmarks/results/clicktest-deep-leaf-ramp-r25.json
 * (parent quyết có stage hay không). Không sửa code sản phẩm, không push,
 * không tag/release, không cài dependency, không binary vào repo.
 * Scratch đo (snapshot dist, video ramp, log chạy) nằm ở
 * ~/workspace/tmp-round25-i6/ và được luồng dọn cuối lượt.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-deep-leaf-ramp-pipe.mjs
 * Biến môi trường: I6_DISPLAY (mặc định :95), I6_PORT (mặc định 4195),
 * I6_RUN_LABEL (nhãn run ghi vào JSON), I6_PROBE=1 (chỉ dump DOM probe
 * rồi thoát, không tính case).
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round25-i6");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.I6_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.I6_DISPLAY || ":95";
const PORT = Number(process.env.I6_PORT || 4195);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.I6_RUN_LABEL || "run1";
const PROBE_ONLY = process.env.I6_PROBE === "1";
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
  async drag(x0, y, x1, steps = 12) {
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
  async pressSpace() {
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", code: "Space", key: " ", windowsVirtualKeyCode: 32 }, this.sessionId, 15000);
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", code: "Space", key: " ", windowsVirtualKeyCode: 32 }, this.sessionId, 15000);
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

/** Tìm element bằng JS, scroll vào tầm nhìn, trả rect (null nếu không thấy). */
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

/** Snapshot dist vào scratch; trả {bundle, sha} hoặc null khi BLOCKER. */
function snapshotDist() {
  const distDir = path.join(WEB_DIR, "dist");
  const indexHtml = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtml)) { log("BLOCKER dist: không có apps/web/dist/index.html"); return null; }
  const assetsDir = path.join(distDir, "assets");
  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  const bundlePath = jsFiles.map((f) => path.join(assetsDir, f))
    .find((p) => {
      const s = fs.readFileSync(p, "utf8");
      return s.includes("curveCreate") && s.includes("deepLevelHead");
    });
  if (!bundlePath) {
    log("BLOCKER dist: không bundle nào chứa đồng thời curveCreate + deepLevelHead (dist cũ hơn code đợt 24 H6?)");
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
        // Video control cần seek: PHẢI hỗ trợ Range (không có Range thì
        // Chrome không seek được qua HTTP — bài học run5: control ct=0).
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "i6-pipe-"));
    const chrome = spawn(bin, [
      "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
      "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      // Cửa sổ cao 1200 (viewport thật ~1056 sau khi trừ chrome UI):
      // run4 chứng minh cửa sổ 1080 chỉ cho viewport 936, ruler ở cuối
      // trang (y=931) bị kẹt ngoài viewport dù đã scrollIntoView.
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
const CONST5 = { keyframes: [{ t: 0, v: 5, easing: "linear" }, { t: 4, v: 5, easing: "linear" }] };
const PRESET1 = { keyframes: [{ t: 0, v: 1, easing: "linear" }] };
const LINEAR_1_2_4 = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] };
const LINEAR_1_2_6 = { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 6, v: 2, easing: "linear" }] };

function subSpec(tracks) {
  return {
    version: "0.2.0",
    meta: { name: "sub", width: 1280, height: 720, fps: 30 },
    tracks: tracks.map((t) => ({ id: t.id, kind: "video", clips: t.clips })),
  };
}
function nestedClip(id, name, inner, extra = {}) {
  return { kind: "nested", id, name, start: 0, duration: 4, trim: { in: 0, out: 4 }, subSpec: inner, ...extra };
}
function videoLeaf(id, src, extra = {}) {
  return { kind: "video", id, src, start: 0, duration: 4, in: 0, out: 4, ...extra };
}
function deepSeed() {
  const mk = (topId, topExtra, midId, midExtra, leaf) => ({
    id: topId.replace("TOP-", "t-").toLowerCase(),
    kind: "video",
    clips: [nestedClip(topId, topId,
      subSpec([{ id: `in-${midId}`, clips: [nestedClip(midId, midId,
        subSpec([{ id: `leaf-${midId}`, clips: [leaf] }]), midExtra)] }]), topExtra)],
  });
  const tracks = [
    // Thứ tự chạy: chặn trước, thành công sau (để undo stack sạch khi đo chặn).
    mk("TOP-REV", { speedKeyframes: CONST1 }, "MID-REV", { reverse: true }, videoLeaf("leaf-rev", "leaf-rev.mp4")),
    mk("TOP-NONMEDIA", { speedKeyframes: CONST1 }, "MID-NONMEDIA", {}, { kind: "text", id: "leaf-text", text: "TEXT-BLOCKED-LEAF", start: 0, duration: 4 }),
    mk("TOP-CURVINV", {}, "MID-CURVINV", { speedKeyframes: CONST5 }, videoLeaf("leaf-curvinv", "leaf-curvinv.mp4")),
    mk("TOP-HAS", {}, "MID-HAS", {}, videoLeaf("leaf-has", "leaf-has.mp4", { speedKeyframes: PRESET1 })),
    mk("TOP-CHAIN1", {}, "MID-CHAIN1", {}, videoLeaf("leaf-chain1", "leaf-chain1.mp4")),
    // Chain 2: TOP-CHAIN2 -> A-CHAIN2 -> B-CHAIN2 -> lá (track riêng, dựng tay).
    {
      id: "t-chain2", kind: "video",
      clips: [nestedClip("TOP-CHAIN2", "TOP-CHAIN2",
        subSpec([{ id: "in-a", clips: [nestedClip("A-CHAIN2", "A-CHAIN2",
          subSpec([{ id: "in-b", clips: [nestedClip("B-CHAIN2", "B-CHAIN2",
            subSpec([{ id: "leaf-b", clips: [videoLeaf("leaf-chain2", "leaf-chain2.mp4")] }]), {})] }]), {})] }]),
        { speedKeyframes: CONST1 })],
    },
  ];
  return {
    version: "0.2.0",
    meta: { name: "I6 deep leaf seed", width: 1280, height: 720, fps: 30 },
    tracks,
  };
}
function rampSeed() {
  return {
    version: "0.2.0",
    meta: { name: "I6 nested ramp seed", width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: [{
        kind: "nested", id: "top-ramp", name: "TOP-RAMP", start: 0, duration: 4,
        trim: { in: 0, out: 6 }, speedKeyframes: LINEAR_1_2_4,
        subSpec: subSpec([{ id: "vin", clips: [{
          kind: "video", id: "leaf-ramp", src: "ramp12.mp4", start: 0, duration: 6,
          in: 0, out: 9, speedKeyframes: LINEAR_1_2_6,
        }] }]),
      }],
    }],
  };
}
function plainSeed() {
  // Clip video thường, không nested, không ramp — đối chứng cho chẩn
  // đoán phát→tối: nếu clip thường phát sáng thì bug chỉ ở clip
  // nested-flat; nếu cũng tối thì bug phát-preview là tổng quát.
  return {
    version: "0.2.0",
    meta: { name: "I6 plain clip seed", width: 1280, height: 720, fps: 30 },
    tracks: [{
      id: "v1", kind: "video",
      clips: [{
        kind: "video", id: "plain1", src: "ramp12.mp4", start: 0, duration: 4,
        in: 0, out: 4,
      }],
    }],
  };
}
// Đọc trạng thái element video của MediaPool qua cây fiber React
// (pool nằm trong ref của PreviewCanvas, không có trên window).
// Chỉ đọc readyState/currentTime/error — không đổi gì trong app.
function pagePoolVideoState() {
  const root = document.querySelector("#root");
  if (!root) return { error: "no #root" };
  // React 19 createRoot: container giữ __reactContainer$ -> FiberRoot,
  // fiber gốc = FiberRoot.current. Fallback __reactFiber$ (React 18).
  const contKey = Object.keys(root).find((k) => k.startsWith("__reactContainer$"));
  const fiberKey = Object.keys(root).find((k) => k.startsWith("__reactFiber$"));
  let start = null;
  let dbg = null;
  if (contKey) {
    const v = root[contKey];
    dbg = { contType: typeof v, contKeys: v && typeof v === "object" ? Object.keys(v).slice(0, 20) : null };
    // React 19: giá trị container chính là HostRoot fiber (không có
    // .current) — bắt đầu duyệt từ chính nó.
    if (v && typeof v === "object" && ("child" in v || "memoizedState" in v)) start = v;
    else if (v && v.current) start = v.current;
  }
  if (!start && fiberKey) start = root[fiberKey];
  if (!start) return { error: "no fiber key", keys: Object.keys(root).slice(0, 12), dbg };
  const seen = new Set();
  const stack = [start];
  const found = [];
  let n = 0;
  while (stack.length && n < 30000) {
    const f = stack.pop();
    if (!f || seen.has(f)) continue;
    seen.add(f);
    n++;
    let h = f.memoizedState;
    const hseen = new Set();
    while (h && !hseen.has(h)) {
      hseen.add(h);
      try {
        const ms = h.memoizedState;
        if (ms && ms.current && ms.current.videos instanceof Map) {
          for (const [id, el] of ms.current.videos) {
            // Giữ element đầu tiên trên window để vẽ thử lên canvas riêng.
            if (!window.__i6poolEl) window.__i6poolEl = el;
            found.push({ id, readyState: el.readyState, videoWidth: el.videoWidth, currentTime: el.currentTime, paused: el.paused, playbackRate: el.playbackRate, networkState: el.networkState, error: el.error ? (el.error.code + ":" + (el.error.message || "")) : null, srcKind: (el.currentSrc || "").slice(0, 10) });
          }
        }
      } catch (e) { /* bỏ qua hook lạ */ }
      h = h.next;
    }
    if (f.child) stack.push(f.child);
    if (f.sibling) stack.push(f.sibling);
    if (f.alternate) stack.push(f.alternate);
  }
  return { fibers: n, count: found.length, videos: found };
}
// Vẽ thử element video của pool lên canvas riêng (không qua renderFrame)
// để phân biệt "element cho frame đen" vs "renderFrame không vẽ nó".
function pageScratchDraw() {
  const el = window.__i6poolEl;
  if (!el) return { error: "no pool el stashed" };
  const c = document.createElement("canvas");
  c.width = 320; c.height = 180;
  const ctx = c.getContext("2d");
  try { ctx.drawImage(el, 0, 0, 320, 180); } catch (e) { return { error: "drawImage threw: " + e.message }; }
  const d = ctx.getImageData(0, 0, 320, 180).data;
  let s = 0;
  for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
  return { mean: s / (320 * 180 * 3), videoWidth: el.videoWidth, currentTime: el.currentTime, paused: el.paused, readyState: el.readyState };
}
function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}

// ------------------------------------------------------------- page fns --
// Các hàm dưới đây được .toString() rồi evaluate trong trang (tự chứa,
// không dùng closure ngoài). Trả rect/state thuần JSON.

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
  // Nút "Xem bên trong" ở hàng của item (ngoài mọi .nested-inner).
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
  // Nút "Xem bên trong" thuộc đúng tầng sâu nhất (closest .nested-inner
  // của nó chính là tầng đó), chưa mở (chưa có tầng con sau nó).
  return [...lvl.querySelectorAll("button")].find((b) =>
    (b.textContent || "").trim() === "Xem bên trong" && b.closest(".nested-inner") === lvl) || null;
}
function pageLeafRow(name, leafLabel) {
  const lvl = pageDeepestLevel(name);
  if (!lvl) return null;
  return [...lvl.querySelectorAll(".nested-panel-row")].find((r) =>
    (r.textContent || "").includes(leafLabel)) || null;
}
function pagePanelMsg() {
  const m = document.querySelector(".nested-panel-msg");
  return m ? m.textContent : null;
}
function pageToasts() {
  return [...document.querySelectorAll(".toasts .toast-msg")].map((el) => el.textContent);
}

/** Inject bộ hàm page* vào window.__i6f (chỉ phục vụ harness, không sửa app).
 *  Các hàm là function declaration trong cùng IIFE nên thấy nhau qua tên
 *  (pageDeepestLevel/pageLeafRow gọi pageItemEl) — không cắt chuỗi thân hàm. */
async function injectPageFns(cdp) {
  const wrapped = `window.__i6f = (() => {
    ${pageItemEl.toString()}
    ${pageDeepestLevel.toString()}
    ${pageItemOpenButton.toString()}
    ${pageNextChildButton.toString()}
    ${pageLeafRow.toString()}
    return { pageItemEl, pageDeepestLevel, pageItemOpenButton, pageNextChildButton, pageLeafRow };
  })();`;
  await cdp.evaluate(wrapped);
}

/** Trạng thái hàng lá ở tầng sâu nhất (dùng __i6f đã inject). */
async function leafState(cdp, itemName, leafLabel) {
  return cdp.evaluate(`(() => {
    const row = window.__i6f.pageLeafRow(${JSON.stringify(itemName)}, ${JSON.stringify(leafLabel)});
    if (!row) return { found: false };
    const btn = [...row.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Đặt curve 1× cho lá") || null;
    return {
      found: true,
      hasButton: !!btn,
      hasNote: (row.textContent || "").includes("Lá đã có speed curve."),
      rowText: (row.textContent || "").slice(0, 220),
    };
  })()`);
}
/** Click nút "Đặt curve 1× cho lá" trong hàng lá ở tầng sâu nhất. */
async function clickLeafButton(cdp, itemName, leafLabel) {
  const rect = await cdp.evaluate(`(() => {
    const row = window.__i6f.pageLeafRow(${JSON.stringify(itemName)}, ${JSON.stringify(leafLabel)});
    if (!row) return null;
    const btn = [...row.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Đặt curve 1× cho lá");
    if (!btn) return null;
    btn.scrollIntoView({ block: "center", inline: "center" });
    const r = btn.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`không tìm được nút lá cho ${leafLabel} trong ${itemName}`);
  const method = await cdp.clickRect(rect);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`(() => {
      const row = window.__i6f.pageLeafRow(${JSON.stringify(itemName)}, ${JSON.stringify(leafLabel)});
      [...row.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Đặt curve 1× cho lá").click();
    })()`);
  }
  await sleep(600);
  return method;
}

/** Click nút theo finder đã inject; trả phương thức click. */
async function clickInjected(cdp, fnName, ...args) {
  const argStr = args.map((a) => JSON.stringify(a)).join(",");
  const rect = await cdp.evaluate(`(() => {
    const el = window.__i6f.${fnName}(${argStr});
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
  if (!rect) throw new Error(`không tìm được nút ${fnName}(${argStr})`);
  const method = await cdp.clickRect(rect);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`window.__i6f.${fnName}(${argStr}).click()`);
  }
  await sleep(600);
  return method;
}

/** Mở item + duyệt xuống depth tầng con (depth = số nested trung gian cần mở). */
async function drillToLeaf(cdp, itemName, depth) {
  await clickInjected(cdp, "pageItemOpenButton", itemName);
  await waitFor(cdp, `window.__i6f.pageDeepestLevel(${JSON.stringify(itemName)}) !== null`, `tầng trong của ${itemName} mở`, 15000);
  for (let d = 0; d < depth; d++) {
    const before = await cdp.evaluate(`[...window.__i6f.pageItemEl(${JSON.stringify(itemName)}).querySelectorAll(".nested-inner")].length`);
    await clickInjected(cdp, "pageNextChildButton", itemName);
    await waitFor(cdp, `[...window.__i6f.pageItemEl(${JSON.stringify(itemName)}).querySelectorAll(".nested-inner")].length > ${before}`, `mở tầng con ${d + 1} của ${itemName}`, 15000);
  }
}

/** Đọc autosave từ localStorage rồi trả spec (parse ở Node). */
async function readAutosaveSpec(cdp) {
  const raw = await cdp.evaluate(`localStorage.getItem("vcut-studio:autosave:v1")`);
  if (!raw) return null;
  try { return JSON.parse(raw).spec; } catch { return null; }
}
/** Tìm lá trong spec đã seed theo đường topId -> chain -> leafId. */
function findLeafInSpec(spec, topId, chain, leafId) {
  if (!spec) return null;
  let cur = null;
  for (const t of spec.tracks) {
    const c = (t.clips || []).find((x) => x.id === topId);
    if (c) { cur = c; break; }
  }
  if (!cur) return null;
  for (const cid of chain) {
    const sub = cur.subSpec;
    if (!sub) return null;
    let nxt = null;
    for (const t of sub.tracks) {
      const c = (t.clips || []).find((x) => x.id === cid);
      if (c) { nxt = c; break; }
    }
    if (!nxt) return null;
    cur = nxt;
  }
  const sub = cur.subSpec;
  if (!sub) return null;
  for (const t of sub.tracks) {
    const c = (t.clips || []).find((x) => x.id === leafId);
    if (c) return c;
  }
  return null;
}

// ------------------------------------------------------------- session ---
async function loadSession(cdp, seedSpec, seedName) {
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu", 60000);
  await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seedSpec, seedName))});`);
  await cdp.send("Page.reload", {}, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render sau reload", 60000);
  await sleep(1500);
  // Đóng RelinkPanel (modal-backdrop) nếu hiện — setup, không phải case.
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

function btnByText(text) {
  return `[...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === ${JSON.stringify(text)})`;
}

// ------------------------------------------------------------- cases -----
const results = [];
function casePass(id, detail) { results.push({ id, status: "PASS", detail }); log(`CASE ${id}: PASS — ${detail}`); }
function caseFail(id, detail) { results.push({ id, status: "FAIL", detail }); log(`CASE ${id}: FAIL — ${detail}`); }
function caseSeedRejected(id, detail) { results.push({ id, status: "SEED-REJECTED", detail }); log(`CASE ${id}: SEED-REJECTED — ${detail}`); }

async function readMsgAndToasts(cdp) {
  const msg = await cdp.evaluate(`(${pagePanelMsg.toString()})()`);
  const toasts = await cdp.evaluate(`(${pageToasts.toString()})()`);
  return { msg, toasts };
}

async function runDeepCases(cdp) {
  // D0: seed load — panel liệt kê đủ 6 item.
  const EXPECTED = ["TOP-REV", "TOP-NONMEDIA", "TOP-CURVINV", "TOP-HAS", "TOP-CHAIN1", "TOP-CHAIN2"];
  try {
    await openNestedPanel(cdp);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    log(`  D0 item panel: ${JSON.stringify(names)}`);
    const missing = EXPECTED.filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`thiếu item: ${missing.join(", ")} (seed có thể bị validator từ chối một phần)`);
    casePass("D0-seed-load", `panel liệt kê đủ 6 item: ${names.join(", ")}`);
  } catch (e) { caseFail("D0-seed-load", e.message); return; }

  // D3: chặn ancestorReverse ở chain 1 (TOP-REV -> MID-REV reverse, TOP mang curve 1×).
  try {
    await drillToLeaf(cdp, "TOP-REV", 1);
    const before = await leafState(cdp, "TOP-REV", "leaf-rev.mp4");
    if (!before.found || !before.hasButton) throw new Error(`trước click: hàng lá không có nút (state=${JSON.stringify(before)})`);
    const m = await clickLeafButton(cdp, "TOP-REV", "leaf-rev.mp4");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  D3 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes('tổ tiên "MID-REV" đang reverse')) throw new Error(`msg không chứa nhánh ancestorReverse (msg=${JSON.stringify(msg)})`);
    if (!toasts.some((t) => t.includes('tổ tiên "MID-REV" đang reverse'))) throw new Error(`toast không chứa nhánh ancestorReverse (toasts=${JSON.stringify(toasts)})`);
    const after = await leafState(cdp, "TOP-REV", "leaf-rev.mp4");
    if (!after.hasButton || after.hasNote) throw new Error(`sau khi chặn: nút phải còn, không có note (state=${JSON.stringify(after)})`);
    await sleep(6500);
    const spec = await readAutosaveSpec(cdp);
    const leaf = findLeafInSpec(spec, "TOP-REV", ["MID-REV"], "leaf-rev");
    if (leaf && leaf.speedKeyframes) throw new Error(`autosave: lá bị chặn vẫn nhận curve ${JSON.stringify(leaf.speedKeyframes)}`);
    casePass("D3-block-ancestorReverse-chain1", `click ${m} -> msg + toast đúng nhánh ancestorReverse (MID-REV), nút còn nguyên, autosave không đổi`);
  } catch (e) { caseFail("D3-block-ancestorReverse-chain1", e.message); }

  // D4: chặn leafNonMedia ở chain 1 (lá chữ sâu).
  try {
    await drillToLeaf(cdp, "TOP-NONMEDIA", 1);
    const before = await leafState(cdp, "TOP-NONMEDIA", "TEXT-BLOCKED-LEAF");
    if (!before.found || !before.hasButton) throw new Error(`trước click: hàng lá chữ không có nút (state=${JSON.stringify(before)})`);
    const m = await clickLeafButton(cdp, "TOP-NONMEDIA", "TEXT-BLOCKED-LEAF");
    const { msg, toasts } = await readMsgAndToasts(cdp);
    log(`  D4 msg=${JSON.stringify(msg)} toasts=${JSON.stringify(toasts)}`);
    if (!msg || !msg.includes("Chỉ lá video/audio mới mang speed curve")) throw new Error(`msg không chứa nhánh leafNonMedia (msg=${JSON.stringify(msg)})`);
    const after = await leafState(cdp, "TOP-NONMEDIA", "TEXT-BLOCKED-LEAF");
    if (!after.hasButton) throw new Error(`sau khi chặn: nút lá chữ phải còn (state=${JSON.stringify(after)})`);
    await sleep(6500);
    const spec = await readAutosaveSpec(cdp);
    const leaf = findLeafInSpec(spec, "TOP-NONMEDIA", ["MID-NONMEDIA"], "leaf-text");
    if (leaf && leaf.speedKeyframes) throw new Error(`autosave: lá chữ bị chặn vẫn nhận curve`);
    casePass("D4-block-leafNonMedia-chain1", `click ${m} -> msg đúng nhánh leafNonMedia, nút còn nguyên, autosave không đổi`);
  } catch (e) { caseFail("D4-block-leafNonMedia-chain1", e.message); }

  // D5: chặn ancestorCurveInvalid ở chain 1 (MID mang curve v=5 sẵn).
  try {
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    if (!names.includes("TOP-CURVINV")) {
      caseSeedRejected("D5-block-ancestorCurveInvalid-chain1", "seed TOP-CURVINV không lên panel (validator load có thể đã từ chối curve v=5) — không kết luận về nút");
    } else {
      await drillToLeaf(cdp, "TOP-CURVINV", 1);
      const m = await clickLeafButton(cdp, "TOP-CURVINV", "leaf-curvinv.mp4");
      const { msg } = await readMsgAndToasts(cdp);
      log(`  D5 msg=${JSON.stringify(msg)}`);
      if (!msg || !msg.includes('Speed curve của nested clip tổ tiên "MID-CURVINV" không hợp lệ')) throw new Error(`msg không chứa nhánh ancestorCurveInvalid (msg=${JSON.stringify(msg)})`);
      const after = await leafState(cdp, "TOP-CURVINV", "leaf-curvinv.mp4");
      if (!after.hasButton) throw new Error(`sau khi chặn: nút phải còn (state=${JSON.stringify(after)})`);
      casePass("D5-block-ancestorCurveInvalid-chain1", `click ${m} -> msg đúng nhánh ancestorCurveInvalid (MID-CURVINV v=5), nút còn nguyên`);
    }
  } catch (e) { caseFail("D5-block-ancestorCurveInvalid-chain1", e.message); }

  // D6: lá đã có curve — nút ẩn, hiện note (hành vi hiện tại, không phải click).
  try {
    await drillToLeaf(cdp, "TOP-HAS", 1);
    const st = await leafState(cdp, "TOP-HAS", "leaf-has.mp4");
    log(`  D6 state=${JSON.stringify(st)}`);
    if (!st.found) throw new Error("không tìm được hàng lá leaf-has.mp4");
    if (st.hasButton) throw new Error("lá đã có curve mà nút vẫn hiện (trái thiết kế InnerClipEditor: ẩn nút, hiện note)");
    if (!st.hasNote) throw new Error("lá đã có curve mà không thấy note 'Lá đã có speed curve.'");
    casePass("D6-leaf-already-has-curve", "lá đã có curve: nút ẩn, note 'Lá đã có speed curve.' hiện (không có gì để bấm — hành vi đúng thiết kế)");
  } catch (e) { caseFail("D6-leaf-already-has-curve", e.message); }

  // D1: thành công chain 1 + đúng 1 bước undo (qua Ctrl+Z + autosave).
  try {
    await drillToLeaf(cdp, "TOP-CHAIN1", 1);
    const m = await clickLeafButton(cdp, "TOP-CHAIN1", "leaf-chain1.mp4");
    const { msg } = await readMsgAndToasts(cdp);
    log(`  D1 msg=${JSON.stringify(msg)}`);
    if (!msg || !msg.includes("Đã đặt curve 1× cho lá (1 bước undo)")) throw new Error(`msg thành công sai (msg=${JSON.stringify(msg)})`);
    const st1 = await leafState(cdp, "TOP-CHAIN1", "leaf-chain1.mp4");
    if (st1.hasButton || !st1.hasNote) throw new Error(`sau click thành công: nút phải biến mất, note phải hiện (state=${JSON.stringify(st1)})`);
    await sleep(7000);
    let spec = await readAutosaveSpec(cdp);
    let leaf = findLeafInSpec(spec, "TOP-CHAIN1", ["MID-CHAIN1"], "leaf-chain1");
    if (!leaf || JSON.stringify(leaf.speedKeyframes) !== JSON.stringify(PRESET1)) throw new Error(`autosave: lá không nhận đúng preset (leaf=${JSON.stringify(leaf && leaf.speedKeyframes)})`);
    await cdp.pressCtrlZ();
    await sleep(800);
    const st2 = await leafState(cdp, "TOP-CHAIN1", "leaf-chain1.mp4");
    if (!st2.hasButton || st2.hasNote) throw new Error(`sau Ctrl+Z: nút phải trở lại, note phải mất (state=${JSON.stringify(st2)})`);
    await sleep(7000);
    spec = await readAutosaveSpec(cdp);
    leaf = findLeafInSpec(spec, "TOP-CHAIN1", ["MID-CHAIN1"], "leaf-chain1");
    if (leaf && leaf.speedKeyframes) throw new Error(`sau Ctrl+Z: autosave vẫn còn curve (undo không hoàn tác)`);
    casePass("D1-success-chain1-undo1", `click ${m} -> msg thành công, nút -> note, autosave nhận preset, Ctrl+Z -> nút trở lại + autosave mất curve (đúng 1 bước)`);
  } catch (e) { caseFail("D1-success-chain1-undo1", e.message); }

  // D2: thành công chain 2 (TOP-CHAIN2 -> A -> B -> lá) + undo.
  try {
    await drillToLeaf(cdp, "TOP-CHAIN2", 2);
    const m = await clickLeafButton(cdp, "TOP-CHAIN2", "leaf-chain2.mp4");
    const { msg } = await readMsgAndToasts(cdp);
    log(`  D2 msg=${JSON.stringify(msg)}`);
    if (!msg || !msg.includes("Đã đặt curve 1× cho lá (1 bước undo)")) throw new Error(`msg thành công sai (msg=${JSON.stringify(msg)})`);
    const st1 = await leafState(cdp, "TOP-CHAIN2", "leaf-chain2.mp4");
    if (st1.hasButton || !st1.hasNote) throw new Error(`sau click thành công chain 2: nút phải biến mất, note phải hiện (state=${JSON.stringify(st1)})`);
    await sleep(7000);
    let spec = await readAutosaveSpec(cdp);
    let leaf = findLeafInSpec(spec, "TOP-CHAIN2", ["A-CHAIN2", "B-CHAIN2"], "leaf-chain2");
    if (!leaf || JSON.stringify(leaf.speedKeyframes) !== JSON.stringify(PRESET1)) throw new Error(`autosave: lá chain 2 không nhận đúng preset (leaf=${JSON.stringify(leaf && leaf.speedKeyframes)})`);
    await cdp.pressCtrlZ();
    await sleep(800);
    const st2 = await leafState(cdp, "TOP-CHAIN2", "leaf-chain2.mp4");
    if (!st2.hasButton || st2.hasNote) throw new Error(`sau Ctrl+Z chain 2: nút phải trở lại (state=${JSON.stringify(st2)})`);
    casePass("D2-success-chain2-undo1", `click ${m} -> drill 2 tầng + msg thành công, nút -> note, autosave nhận preset, Ctrl+Z hoàn tác`);
  } catch (e) { caseFail("D2-success-chain2-undo1", e.message); }

  // D8: cuối phiên: Ctrl+Z thêm 2 lần phải là no-op (không undo mất seed load).
  try {
    await cdp.pressCtrlZ();
    await sleep(800);
    await cdp.pressCtrlZ();
    await sleep(800);
    const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
    const missing = ["TOP-REV", "TOP-NONMEDIA", "TOP-CURVINV", "TOP-HAS", "TOP-CHAIN1", "TOP-CHAIN2"].filter((n) => !names.includes(n));
    if (missing.length) throw new Error(`sau 2 Ctrl+Z thừa, panel mất item: ${missing.join(", ")} (seed load có thể đã bị undo)`);
    casePass("D8-extra-undo-noop", "2 Ctrl+Z thừa cuối phiên là no-op: panel vẫn đủ 6 item");
  } catch (e) { caseFail("D8-extra-undo-noop", e.message); }

  // D7: không exception runtime trong phiên deep.
  if (cdp.exceptions.length === 0) {
    casePass("D7-no-crash-deep", "0 Runtime.exceptionThrown trong phiên deep-leaf");
  } else {
    caseFail("D7-no-crash-deep", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

// ------------------------------------------------------------- ramp ------
async function probeDom(cdp) {
  const info = await cdp.evaluate(`(() => {
    const canvases = [...document.querySelectorAll("canvas")].map((c) => ({ cls: c.className, id: c.id, w: c.width, h: c.height, rect: (() => { const r = c.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() }));
    const videos = [...document.querySelectorAll("video")].map((v) => ({ src: (v.currentSrc || v.src || "").slice(-60), ct: v.currentTime, rate: v.playbackRate, paused: v.paused, ready: v.readyState }));
    const ruler = (() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })();
    const timeTexts = [...document.querySelectorAll("body *")].filter((el) => el.children.length === 0 && /\\d+:\\d+\\.\\d+\\s*\\/\\s*\\d+:\\d+\\.\\d+/.test(el.textContent || "")).slice(0, 8).map((el) => ({ cls: el.className, text: (el.textContent || "").trim().slice(0, 60) }));
    const fileInputs = [...document.querySelectorAll('input[type="file"]')].map((el) => ({ accept: el.accept, hidden: el.hidden, aria: el.getAttribute("aria-label"), inMediabin: !!el.closest(".mediabin"), inModal: !!el.closest(".modal") }));
    const mediaNames = [...document.querySelectorAll(".media-name")].map((el) => el.textContent);
    const nestedItems = [...document.querySelectorAll(".nested-item .nested-item-name")].map((el) => (el.textContent || "").trim());
    const tlClips = [...document.querySelectorAll(".tl-clip")].map((el) => ({ cls: el.className, id: el.getAttribute("data-clip-id") }));
    return { canvases, videos, ruler, timeTexts, fileInputs, mediaNames, nestedItems, tlClips };
  })()`);
  log(`PROBE: ${JSON.stringify(info, null, 1).slice(0, 4000)}`);
  return info;
}

function readTimeText(cdp) {
  return cdp.evaluate(`(() => {
    const m = (document.body.innerText.match(/\\d+:\\d+\\.\\d+\\s*\\/\\s*\\d+:\\d+\\.\\d+/) || [])[0] || null;
    if (!m) return null;
    const cur = m.split("/")[0].trim();
    const parts = cur.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  })()`);
}

async function settlePreview(cdp, timeoutMs = 20000) {
  // Đợi canvas ổn định: hash mẫu thưa không đổi qua 2 lần đo cách 600ms.
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

/** So canvas preview với frame video giải mã độc lập tại sourceT (contain-fit
 *  trên nền đen — khớp letterboxFit của drawVideoClip). Control video lấy
 *  cùng file ramp12.mp4 qua static server của harness (video element của
 *  app là detached — MediaPool tạo bằng createElement, không gắn vào DOM —
 *  nên KHÔNG đọc được currentTime/playbackRate của app qua DOM; so frame
 *  là bằng chứng trực tiếp cho "preview frame" và mạnh hơn đọc currentTime).
 *  CONTROL_URL được truyền từ harness (origin + /ramp12.mp4). */
async function canvasVsControl(cdp, sourceT, controlUrl) {
  return cdp.evaluate(`(async () => {
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return { error: "không thấy canvas preview" };
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext("2d");
    const appData = ctx.getImageData(0, 0, W, H).data;
    // Tái dùng ĐÚNG 1 video control cho cả phiên (window.__i6ctl): run6
    // tạo 5 video control liên tiếp trong checkFrame, nghi tranh decoder
    // với video của app trên VM yếu khiến video app kẹt tối ở R2/R3
    // (diag không có checkFrame thì playhead 3/3.5 đều sáng).
    let v = window.__i6ctl;
    if (!v) {
      v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.src = ${JSON.stringify(controlUrl)};
      window.__i6ctl = v;
      await new Promise((res, rej) => {
        const to = setTimeout(() => rej(new Error("timeout load control video")), 15000);
        v.onloadedmetadata = () => { clearTimeout(to); res(); };
        v.onerror = () => { clearTimeout(to); rej(new Error("control video error")); };
      });
    }
    v.pause();
    v.currentTime = ${JSON.stringify(sourceT)};
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error("timeout seek control")), 15000);
      v.onseeked = () => { clearTimeout(to); res(); };
    });
    // Guard: seek control thất bại phải lộ ra là lỗi control, không được
    // tính thành lỗi app (bài học run5: ct=0 mà vẫn so rồi kết luận sai).
    if (Math.abs(v.currentTime - ${JSON.stringify(sourceT)}) > 0.25) {
      return { error: "control seek thất bại: currentTime=" + v.currentTime + " muốn " + ${JSON.stringify(sourceT)} };
    }
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d");
    octx.fillStyle = "#000"; octx.fillRect(0, 0, W, H);
    const scale = Math.min(W / v.videoWidth, H / v.videoHeight);
    const dw = Math.round(v.videoWidth * scale), dh = Math.round(v.videoHeight * scale);
    octx.drawImage(v, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
    const ctlData = octx.getImageData(0, 0, W, H).data;
    let diff = 0, sum = 0, max = 0, minX = W, maxX = -1, minY = H, maxY = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        let d = 0;
        for (let k = 0; k < 3; k++) { const dd = Math.abs(appData[i + k] - ctlData[i + k]); d += dd; if (dd > max) max = dd; }
        sum += d;
        if (d > 0) {
          diff++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    // Giữ lại video control tái dùng (không remove — remove trên
    // element detached vốn là no-op, còn reference thì giữ decoder ổn định).
    return { W, H, diffPixels: diff, total: W * H, diffPct: (diff / (W * H)) * 100,
      meanAbs: sum / (W * H * 3), maxDiff: max,
      bbox: diff ? [minX, minY, maxX, maxY] : null,
      controlVideo: { w: v.videoWidth, h: v.videoHeight, ct: v.currentTime } };
  })()`, 60000);
}

async function runRampCases(cdp, videoPath) {
  // R0: seed ramp load + import media qua MediaBin (file input thật qua CDP DOM).
  try {
    if (process.env.I6_DIAG_PLAIN === "1") {
      log("  R0 plain mode: bỏ qua panel nested (seed clip thường, không có TOP-RAMP)");
    } else {
      await openNestedPanel(cdp);
      const names = await cdp.evaluate(`(${pageItemNames.toString()})()`);
      log(`  R0 item panel: ${JSON.stringify(names)}`);
      if (!names.includes("TOP-RAMP")) throw new Error("panel không liệt kê TOP-RAMP (seed ramp bị từ chối?)");
    }
    // Desktop (viewport 1920): MediaBin render sẵn inline, KHÔNG có nút FAB
    // (FAB .m-fab chỉ render khi isMobile — run1 fail đúng chỗ này vì đi
    // tìm FAB trên desktop). Panel nested cứ để mở (không che ruler;
    // ruler được đo sau bước này nên ánh xạ vẫn nhất quán).
    await waitFor(cdp, `!!document.querySelector(".mediabin")`, "MediaBin sẵn (desktop inline)", 15000);
    log("  R0: MediaBin desktop đã sẵn (không cần FAB mobile)");
    // Tắt auto-proxy nếu đang bật (tránh bridge toast làm nhiễu).
    const autoChecked = await cdp.evaluate(`(() => { const mb = document.querySelector(".mediabin"); const cb = mb ? mb.querySelector('input[type="checkbox"]') : null; return cb ? cb.checked : null; })()`);
    if (autoChecked === true) {
      await realClick(cdp, `document.querySelector(".mediabin input[type=\\"checkbox\\"]")`);
      log("  R0: đã tắt auto-proxy trong MediaBin");
    }
    // Set file input bằng CDP DOM (không qua dialog native).
    const doc = await cdp.send("DOM.getDocument", { depth: 0 }, cdp.sessionId, 30000);
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type=file]" }, cdp.sessionId, 30000);
    if (!q.nodeId) throw new Error("không tìm được file input của MediaBin qua DOM.querySelector");
    await cdp.send("DOM.setFileInputFiles", { files: [videoPath], nodeId: q.nodeId }, cdp.sessionId, 30000);
    await waitFor(cdp, `[...document.querySelectorAll(".media-name")].some((el) => (el.textContent || "").trim() === "ramp12.mp4")`, "media ramp12.mp4 vào bin", 60000);
    log("  R0: media ramp12.mp4 đã vào MediaBin");
    casePass("R0-ramp-seed-media", process.env.I6_DIAG_PLAIN === "1" ? "seed clip thường lên timeline; import ramp12.mp4 vào MediaBin qua file input thật (CDP DOM.setFileInputFiles)" : "seed TOP-RAMP lên panel; import ramp12.mp4 vào MediaBin qua file input thật (CDP DOM.setFileInputFiles)");
  } catch (e) { caseFail("R0-ramp-seed-media", e.message); return; }

  // Hiệu chuẩn ruler: 2 click đo ánh xạ x -> playhead.
  // Bài học run2 (harness, không phải app): sau các click panel, trang có
  // thể đã cuộn khiến ruler rơi xuống y=1179 (ngoài viewport 1080) — click
  // CDP ngoài viewport không tới ruler, playhead đứng yên. Vì vậy trước
  // khi đọc rect phải scrollIntoView ruler rồi mới đo, và kiểm tra rect
  // nằm trong viewport.
  async function getRuler() {
    const r = await cdp.evaluate(`(() => {
      const el = document.querySelector(".tl-ruler");
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "center" });
      let q = el.getBoundingClientRect();
      // Ruler ở cuối trang có thể vẫn thò ra dưới viewport dù đã
      // scrollIntoView (hết cỡ cuộn): cuộn tới cuối trang rồi đo lại.
      // Diag-plain: window KHÔNG phải scroller (scrollY đứng yên ở 0) —
      // app cuộn bằng container trong, nên cuộn cả chuỗi ancestor.
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
      return { x: q.x, y: q.y, w: q.width, h: q.height, innerH: window.innerHeight, scrollY: window.scrollY };
    })()`);
    await sleep(400);
    return r;
  }
  let ruler, pxPerSec, x0;
  try {
    // Đóng panel nested trước khi scrub (nút toggle): panel mở làm trang
    // dài thêm, đẩy ruler xuống cuối trang — run4 ruler kẹt ở y=931.
    try {
      // Chỉ bấm toggle khi panel ĐANG mở — ở plain mode panel vốn đóng,
      // bấm toggle sẽ MỞ panel ra (diag-plain fail đúng chỗ này).
      const wasOpen = await cdp.evaluate(`!!document.querySelector(".nested-panel")`);
      if (wasOpen) {
        await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Tạo và quản lý nested clip (compound clip)")`);
        await waitFor(cdp, `!document.querySelector(".nested-panel")`, "panel nested đóng", 8000);
        log("  ruler: đã đóng panel nested trước khi scrub");
      } else {
        log("  ruler: panel nested vốn đã đóng, không bấm toggle");
      }
    } catch (e) { log(`  ruler: không đóng được panel nested (${e.message}) — vẫn tiếp tục, getRuler sẽ kiểm tra viewport`); }
    ruler = await getRuler();
    if (!ruler) throw new Error("không thấy .tl-ruler");
    if (ruler.y < 0 || ruler.y + ruler.h > ruler.innerH) throw new Error(`ruler ngoài viewport sau scrollIntoView: ${JSON.stringify(ruler)}`);
    log(`  ruler rect: ${JSON.stringify(ruler)}`);
    const y = Math.round(ruler.y + ruler.h / 2);
    await cdp.clickRect({ x: ruler.x + 40, y, width: 1, height: 1 });
    await sleep(1000);
    const tA = await readTimeText(cdp);
    await cdp.clickRect({ x: ruler.x + 240, y, width: 1, height: 1 });
    await sleep(1000);
    const tB = await readTimeText(cdp);
    log(`  hiệu chuẩn ruler: click x+40 -> playhead ${tA}, click x+240 -> playhead ${tB}`);
    if (tA === null || tB === null || Math.abs(tB - tA) < 0.2) {
      // Chẩn đoán hit-test (mẫu đợt 22 C): phần tử nào thực sự nằm dưới
      // điểm click, và mọi chuỗi giờ nào đang hiện trên trang.
      const diag = await cdp.evaluate(`(() => {
        const y = ${JSON.stringify(y)};
        const pts = [${JSON.stringify(ruler.x + 40)}, ${JSON.stringify(ruler.x + 240)}].map((x) => {
          const el = document.elementFromPoint(x, y);
          return { x, el: el ? (el.tagName + "." + (el.className && el.className.baseVal !== undefined ? "" : el.className)) : null, text: el ? (el.textContent || "").slice(0, 60) : null };
        });
        const times = [...document.querySelectorAll("body *")].filter((el) => el.children.length === 0 && /\\d+:\\d+\\.\\d+\\s*\\/\\s*\\d+:\\d+\\.\\d+/.test(el.textContent || "")).slice(0, 10).map((el) => ({ cls: el.className, text: (el.textContent || "").trim().slice(0, 60) }));
        const rulerNow = (() => { const el = document.querySelector(".tl-ruler"); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })();
        const panel = !!document.querySelector(".nested-panel");
        return { pts, times, rulerNow, panelOpen: panel, scrollY: window.scrollY, innerH: window.innerHeight };
      })()`);
      log(`  DIAG calib-fail: ${JSON.stringify(diag)}`);
      throw new Error(`không đọc được playhead từ hiệu chuẩn (tA=${tA}, tB=${tB})`);
    }
    pxPerSec = 200 / (tB - tA);
    // Giữ mốc tuyệt đối theo ruler-left lúc hiệu chuẩn + tA, để scrub sau
    // dùng ruler-left mới nhất (nếu trang cuộn ngang, x tuyệt đối vẫn đúng).
    x0 = { left: ruler.x, tA };
    log(`  ánh xạ ruler: pxPerSec=${pxPerSec.toFixed(3)}, left=${ruler.x.toFixed(1)}, tA=${tA}`);
  } catch (e) { caseFail("R-calib-ruler", e.message); return; }

  const CONTROL_URL = `${ORIGIN}/ramp12.mp4`;
  async function canvasMean() {
    return cdp.evaluate(`(() => {
      const canvas = document.querySelector("#vcut-preview-wrap canvas");
      if (!canvas) return -1;
      try {
        const ctx = canvas.getContext("2d");
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let s = 0, n = 0;
        for (let i = 0; i < d.length; i += 256) { s += d[i] + d[i + 1] + d[i + 2]; n++; }
        return s / (n * 3);
      } catch { return -1; }
    })()`);
  }
  async function scrubTo(targetT) {
    // Đọc lại ruler mỗi lần scrub (tránh lệch nếu trang cuộn giữa chừng).
    ruler = await getRuler();
    const y = Math.round(ruler.y + ruler.h / 2);
    const xTarget = Math.round(ruler.x + 40 + (targetT - x0.tA) * pxPerSec);
    const xFrom = Math.round(ruler.x + 40 + (0.3 - x0.tA) * pxPerSec);
    await cdp.drag(xFrom, y, xTarget, 14);
    await sleep(1200);
    let settled = await settlePreview(cdp);
    // Canvas tối = video chưa sẵn sàng (đang seek): frame testsrc2 sáng
    // (mean ~100 ở run5 R1) nên yêu cầu mean > 30; canvas ổn định nhưng
    // tối vẫn phải đợi tiếp (bài học run5 R2: mean 10.5 bị chấp nhận).
    let mean = await canvasMean();
    for (let i = 0; i < 20 && mean <= 30; i++) {
      log(`  scrub->${targetT}: canvas còn tối (mean=${mean.toFixed(1)}), đợi video sẵn sàng...`);
      await sleep(1000);
      settled = await settlePreview(cdp);
      mean = await canvasMean();
    }
    const t = await readTimeText(cdp);
    return { settled, t, xTarget, mean };
  }
  /**
   * Tìm frame khớp: so canvas app với control tại sourceT và vùng lân cận
   * ±0.1/±0.2 (bù sai số làm tròn readout playhead 0.1s + lưới frame
   * 1/30s). Tiêu chí pass (hiệu chuẩn bằng ffmpeg độc lập trên cùng
   * file ramp12.mp4, xem LIMITS §2.4): 2 frame kề nhau của testsrc2 đã
   * lệch 11.73% pixel / meanAbs 5.87, nên ngưỡng 5% là sai cho nội dung
   * này — pass khi mốc khớp nhất CHÍNH LÀ neo (không phải lân cận),
   * diffPct ≤ 15% và meanAbs ≤ 6.5 (tức khớp trong ±1 khung hình, không
   * claim chính xác dưới khung hình). Mapping sai thật (lệch ≥ 0.3s)
   * sẽ cho mốc khớp nhất rơi vào lân cận hoặc diff vượt xa mức này
   * (vd frame cách 2.5s lệch 16.00% / 8.80 theo ffmpeg).
   */
  async function checkFrame(sourceT, label) {
    const cands = [sourceT - 0.2, sourceT - 0.1, sourceT, sourceT + 0.1, sourceT + 0.2];
    const rows = [];
    for (const s of cands) {
      const c = await canvasVsControl(cdp, s, CONTROL_URL);
      if (c.error) throw new Error(`so canvas lỗi tại control@${s}: ${c.error}`);
      rows.push({ s, diffPct: c.diffPct, meanAbs: c.meanAbs, maxDiff: c.maxDiff, W: c.W, H: c.H, ct: c.controlVideo.ct });
    }
    for (const r of rows) log(`  ${label} candidate@${r.s.toFixed(4)}: diffPct=${r.diffPct.toFixed(2)}% meanAbs=${r.meanAbs.toFixed(3)} maxDiff=${r.maxDiff} controlCt=${r.ct}`);
    let best = rows[0];
    for (const r of rows) if (r.meanAbs < best.meanAbs) best = r;
    if (Math.abs(best.s - sourceT) > 0.0001) throw new Error(`mốc khớp nhất ${best.s.toFixed(4)} không phải neo ${sourceT} (có thể mapping sai thật)`);
    if (best.diffPct > 15 || best.meanAbs > 6.5) throw new Error(`mốc neo ${best.s.toFixed(4)} vẫn lệch control quá ngưỡng khung-hình (diffPct=${best.diffPct.toFixed(2)}%, meanAbs=${best.meanAbs.toFixed(3)})`);
    return { cmp: best, rows };
  }
  /** Source kỳ vọng từ playhead thực tế theo công thức tay hai tầng:
   *  x = t' + t'²/8; src = x + x²/12 (linear×linear, xem twoLevelCurve). */
  function expectedSource(tp) {
    const x = tp + (tp * tp) / 8;
    return x + (x * x) / 12;
  }

  // Probe vạch playhead (env I6_DIAG_LINE=1): scrub 2 rồi 3, liệt kê
  // mọi element nghi là vạch playhead (class chứa playhead/cursor/
  // needle) + rect, để xem có đọc được playhead thật (chính xác hơn
  // text 0.1s) từ vị trí vạch không. Không ghi case, chỉ log.
  if (process.env.I6_DIAG_LINE === "1") {
    const dumpLine = async (label) => {
      const info = await cdp.evaluate(`(() => {
        const out = [];
        for (const el of document.querySelectorAll("*")) {
          const c = (el.className && el.className.baseVal === undefined ? el.className : "") || "";
          if (/playhead|cursor|needle|time-indicator/i.test(c)) {
            const r = el.getBoundingClientRect();
            out.push({ cls: c.slice(0, 60), x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, transform: (el.style && el.style.transform) || "" });
          }
        }
        return out;
      })()`);
      log(`  DIAG-LINE ${label}: playhead=${await readTimeText(cdp)} candidates=${JSON.stringify(info)}`);
    };
    await scrubTo(2);
    await dumpLine("scrub->2");
    await scrubTo(3);
    await dumpLine("scrub->3");
    log("DIAG-LINE DONE (không ghi case)");
    return;
  }

  // Đối chứng clip thường (env I6_DIAG_PLAIN=1): scrub 0.5, phát, lấy
  // mẫu 10×200ms, dừng, scrub 2. Không ghi case, chỉ log.
  if (process.env.I6_DIAG_PLAIN === "1") {
    const p0 = await scrubTo(0.5);
    log(`  DIAG-PLAIN scrub->0.5: playhead=${p0.t} mean=${p0.mean}`);
    await cdp.evaluate(`(${pagePoolVideoState.toString()})()`); // stash pool el lên window trước khi phát
    log(`  DIAG-PLAIN stash check: scratch=${JSON.stringify(await cdp.evaluate(`(${pageScratchDraw.toString()})()`))}`);
    await cdp.pressSpace();
    for (let i = 0; i < 10; i++) {
      await sleep(200);
      const extra = i === 9 ? ` scratch=${JSON.stringify(await cdp.evaluate(`(${pageScratchDraw.toString()})()`))}` : "";
      log(`  DIAG-PLAIN playing sample ${i}: playhead=${await readTimeText(cdp)} mean=${await canvasMean()}${extra}`);
    }
    await cdp.pressSpace();
    await sleep(800);
    await cdp.evaluate(`(${pagePoolVideoState.toString()})()`);
    log(`  DIAG-PLAIN after pause: playhead=${await readTimeText(cdp)} mean=${await canvasMean()} scratch=${JSON.stringify(await cdp.evaluate(`(${pageScratchDraw.toString()})()`))}`);
    const p1 = await scrubTo(2);
    log(`  DIAG-PLAIN scrub->2: playhead=${p1.t} mean=${p1.mean} pool=${JSON.stringify(await cdp.evaluate(`(${pagePoolVideoState.toString()})()`))}`);
    log("DIAG-PLAIN DONE (không ghi case)");
    return;
  }

  // Chẩn đoán đường phát→dừng (env I6_DIAG_PLAY=1): scrub tới 2, phát,
  // lấy mẫu mean canvas trong lúc phát + sau khi dừng + sau khi scrub
  // về 2, kèm bản đồ vùng 8×4 (xem frame tối chứa gì: đen đều, vùng
  // video tối, hay overlay). Không ghi case, chỉ log.
  async function canvasRegionMap() {
    return cdp.evaluate(`(() => {
      const canvas = document.querySelector("#vcut-preview-wrap canvas");
      if (!canvas) return null;
      const ctx = canvas.getContext("2d");
      const W = canvas.width, H = canvas.height;
      const d = ctx.getImageData(0, 0, W, H).data;
      const blocks = [];
      for (let by = 0; by < 4; by++) {
        const row = [];
        for (let bx = 0; bx < 8; bx++) {
          let s = 0, n = 0;
          for (let y = Math.floor(by * H / 4); y < Math.floor((by + 1) * H / 4); y += 4) {
            for (let x = Math.floor(bx * W / 8); x < Math.floor((bx + 1) * W / 8); x += 4) {
              const i = (y * W + x) * 4;
              s += d[i] + d[i + 1] + d[i + 2]; n++;
            }
          }
          row.push(Math.round(s / (n * 3)));
        }
        blocks.push(row);
      }
      return { W, H, blocks };
    })()`);
  }
  if (process.env.I6_DIAG_PLAY === "1") {
    const hook = () => cdp.evaluate(`(() => { const h = window.__vcutPreviewIdle; return h ? { ticks: h.ticks, sleeping: h.sleeping, lastDrawn: h.lastDrawn, lastRequested: h.lastRequested } : null; })()`);
    const s0 = await scrubTo(2);
    log(`  DIAG-PLAY scrub->2: playhead=${s0.t} mean=${s0.mean} hook=${JSON.stringify(await hook())}`);
    await cdp.pressSpace();
    for (let i = 0; i < 10; i++) {
      await sleep(200);
      const t = await readTimeText(cdp);
      log(`  DIAG-PLAY playing sample ${i}: playhead=${t} mean=${await canvasMean()} hook=${JSON.stringify(await hook())}`);
    }
    await cdp.pressSpace();
    for (const wait of [500, 2000]) {
      await sleep(wait);
      const t = await readTimeText(cdp);
      log(`  DIAG-PLAY paused +${wait}ms: playhead=${t} mean=${await canvasMean()} hook=${JSON.stringify(await hook())}`);
    }
    const s1 = await scrubTo(2);
    log(`  DIAG-PLAY scrub-back->2: playhead=${s1.t} mean=${s1.mean}`);
    // Phát lại từ 0.5: bóng tối theo playhead hay theo thời gian phát?
    const s2 = await scrubTo(0.5);
    log(`  DIAG-PLAY scrub->0.5: playhead=${s2.t} mean=${s2.mean}`);
    await cdp.pressSpace();
    for (let i = 0; i < 10; i++) {
      await sleep(200);
      const t = await readTimeText(cdp);
      log(`  DIAG-PLAY play-from-0.5 sample ${i}: playhead=${t} mean=${await canvasMean()}`);
    }
    await cdp.pressSpace();
    await sleep(800);
    log(`  DIAG-PLAY after 2nd pause: playhead=${await readTimeText(cdp)} mean=${await canvasMean()}`);
    log("DIAG-PLAY DONE (không ghi case)");
    return;
  }

  // Chẩn đoán canvas tối ở playhead 3 (env I6_DIAG_RAMP=1): quét playhead
  // [2, 2.5, 3, 2, 3.5, 3] và ghi mean/hash canvas mỗi mốc — phân biệt
  // "tối từ ngưỡng playhead nào đó" với "kẹt tối vĩnh viễn sau lần đầu".
  // Không ghi case (chỉ log), để run chính quyết định pass/fail.
  if (process.env.I6_DIAG_RAMP === "1") {
    for (const tp of [2, 2.5, 3, 2, 3.5, 3]) {
      const r = await scrubTo(tp);
      log(`  DIAG-RAMP playhead target=${tp}: readout=${r.t} canvasMean=${r.mean} settledHash=${r.settled && r.settled.hash}`);
    }
    log("DIAG-RAMP DONE (không ghi case)");
    return;
  }

  // R1: mốc neo hai tầng t'=2 -> source 3.0208333, speed 2.125.
  try {
    const r = await scrubTo(2);
    log(`  R1 scrub->2: playhead=${r.t} settled=${JSON.stringify(r.settled)} canvasMean=${r.mean}`);
    if (r.t === null || Math.abs(r.t - 2) > 0.15) throw new Error(`playhead sau scrub không phải 2.0 (đo ${r.t})`);
    if (r.mean <= 30) throw new Error(`canvas vẫn tối sau khi đợi (mean=${r.mean}) — video app chưa sẵn sàng tại playhead 2`);
    const { cmp } = await checkFrame(3.0208333, "R1");
    casePass("R1-nested-ramp-anchor-t2", `scrub -> playhead ${r.t}; canvas khớp control@${cmp.s.toFixed(4)} (neo 3.0208333): diff ${cmp.diffPct.toFixed(2)}% pixel, meanAbs ${cmp.meanAbs.toFixed(3)}, maxDiff ${cmp.maxDiff} (${cmp.W}x${cmp.H})`);
  } catch (e) { caseFail("R1-nested-ramp-anchor-t2", e.message); }

  // R2: mốc neo thứ hai t'=3 -> source 5.54296875.
  try {
    const r = await scrubTo(3);
    log(`  R2 scrub->3: playhead=${r.t} canvasMean=${r.mean}`);
    if (r.t === null || Math.abs(r.t - 3) > 0.15) throw new Error(`playhead sau scrub không phải 3.0 (đo ${r.t})`);
    if (r.mean <= 30) throw new Error(`canvas vẫn tối sau khi đợi (mean=${r.mean}) — video app chưa sẵn sàng tại playhead 3`);
    const { cmp } = await checkFrame(5.54296875, "R2");
    casePass("R2-nested-ramp-anchor-t3", `scrub -> playhead ${r.t}; canvas khớp control@${cmp.s.toFixed(4)} (neo 5.54296875): diff ${cmp.diffPct.toFixed(2)}% pixel, meanAbs ${cmp.meanAbs.toFixed(3)}`);
  } catch (e) { caseFail("R2-nested-ramp-anchor-t3", e.message); }

  // R3: đường PHÁT (không chỉ scrub-seek): phát từ t=2 tới t≈3, dừng,
  // neo tính từ playhead THỰC TẾ sau khi dừng (run5 so sai: dừng ở 2.9
  // mà so với neo của 3.0).
  try {
    await scrubTo(2);
    await cdp.pressSpace();
    let tNow = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      tNow = await readTimeText(cdp);
      if (tNow !== null && tNow >= 2.95) break;
    }
    await cdp.pressSpace();
    await sleep(800);
    // Đợi playhead đứng yên hẳn rồi mới đọc mốc cuối.
    for (let i = 0; i < 10; i++) {
      await sleep(500);
      const t2 = await readTimeText(cdp);
      if (t2 === tNow) break;
      tNow = t2;
    }
    const settled = await settlePreview(cdp);
    let mean = await canvasMean();
    for (let i = 0; i < 20 && mean <= 30; i++) { await sleep(1000); mean = await canvasMean(); }
    log(`  R3 phát 2->~3: playhead dừng=${tNow} settled=${JSON.stringify(settled)} canvasMean=${mean}`);
    // Neo từ vị trí VẠCH playhead (chính xác ~0.01s), KHÔNG từ text
    // hiển thị làm tròn 0.1s: text "3" có thể là playhead thực 3.03,
    // lệch neo tới 0.15s nguồn — run8 khớp nhất 5.643 thay vì 5.543
    // đúng vì lý do này (không phải mapping sai). Vạch: center =
    // rulerX + 60 × playhead (kiểm chứng diag-line: rulerX 152,
    // center 272 @ 2.0 và 332 @ 3.0). Đọc vạch + ruler cùng 1 evaluate
    // để không lệch do cuộn trang giữa 2 lần đo.
    let tTrue = tNow;
    const lineInfo = await cdp.evaluate(`(() => {
      const line = document.querySelector(".tl-playhead-line");
      const ruler = document.querySelector(".tl-ruler");
      if (!line || !ruler) return null;
      const lr = line.getBoundingClientRect();
      const rr = ruler.getBoundingClientRect();
      return { center: lr.x + lr.width / 2, rulerX: rr.x };
    })()`);
    if (lineInfo) {
      tTrue = (lineInfo.center - lineInfo.rulerX) / 60;
      log(`  R3 vạch playhead: center=${lineInfo.center}, rulerX=${lineInfo.rulerX} -> playhead thực ${tTrue.toFixed(4)} (text hiển thị ${tNow})`);
    } else {
      log(`  R3: không thấy .tl-playhead-line/.tl-ruler, dùng text hiển thị ${tNow} (kém chính xác, sai số neo tới 0.15s)`);
    }
    if (tTrue === null || tTrue < 2.5 || tTrue > 3.5) throw new Error(`sau khi phát, playhead không ở vùng [2.5, 3.5] (đo ${tTrue})`);
    if (mean <= 30) throw new Error(`canvas vẫn tối sau khi đợi (mean=${mean}) — video app chưa sẵn sàng sau khi phát-dừng`);
    const neo = expectedSource(tTrue);
    log(`  R3 neo từ playhead thực ${tTrue.toFixed(4)}: source=${neo.toFixed(4)}`);
    const { cmp } = await checkFrame(neo, "R3");
    casePass("R3-playback-ramp-to-t3", `phát từ 2 -> playhead thực ${tTrue.toFixed(4)} (text ${tNow}), dừng; canvas khớp control@${cmp.s.toFixed(4)} (neo ${neo.toFixed(4)}): diff ${cmp.diffPct.toFixed(2)}% pixel, meanAbs ${cmp.meanAbs.toFixed(3)} (đường phát khớp đường scrub)`);
  } catch (e) { caseFail("R3-playback-ramp-to-t3", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("R4-no-crash-ramp", "0 Runtime.exceptionThrown trong phiên ramp");
  } else {
    caseFail("R4-no-crash-ramp", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

// ------------------------------------------------------------- main ------
function genRampVideo(outPath) {
  return new Promise((resolve) => {
    // Env I6_SMALL_VIDEO=1: video 640×360 (đối chứng quá tải decode) —
    // luôn tạo lại để ghi đè file 720p có sẵn trong scratch.
    const small = process.env.I6_SMALL_VIDEO === "1";
    if (fs.existsSync(outPath) && !small) { log(`video ramp đã có: ${outPath}`); resolve(true); return; }
    const size = small ? "640x360" : "1280x720";
    log(`tạo video ramp: ffmpeg testsrc2 ${size} 30fps 12s -> ${outPath}`);
    const p = spawn("ffmpeg", ["-y", "-f", "lavfi", "-i", `testsrc2=size=${size}:rate=30:duration=12`,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", outPath], { stdio: "ignore" });
    p.on("exit", (code) => {
      if (code === 0 && fs.existsSync(outPath)) { log(`video ramp xong: ${fs.statSync(outPath).size} byte`); resolve(true); }
      else { log(`ffmpeg tạo video ramp thất bại (exit ${code})`); resolve(false); }
    });
    p.on("error", (e) => { log(`ffmpeg lỗi: ${e.message}`); resolve(false); });
  });
}

async function main() {
  log(`harness clicktest-deep-leaf-ramp-pipe: bắt đầu (label=${RUN_LABEL}, probe=${PROBE_ONLY})`);
  log(`display=${DISPLAY} port=${PORT} binaries=${BINARIES.join(" | ")}`);
  let xvfb = null;
  let server = null;
  let exitCode = 2;
  const holders = [];
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) { log("BLOCKER: dist snapshot thất bại — dừng, không có kết quả click-test"); return 2; }
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }

    if (PROBE_ONLY) {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe"); return 2; }
      holders.push(holder);
      await loadSession(cdp, rampSeed(), "I6 probe ramp seed");
      try {
        await waitFor(cdp, `!!document.querySelector(".mediabin")`, "MediaBin sẵn (probe, desktop inline)", 15000);
      } catch (e) { log(`PROBE: không thấy MediaBin: ${e.message}`); }
      await probeDom(cdp);
      log(`PROBE timeText=${await readTimeText(cdp)}`);
      log("PROBE DONE");
      return 2; // probe không tính kết quả
    }

    // Phiên 1: deep-leaf.
    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên deep)"); return 2; }
      holders.push(holder);
      try {
        await loadSession(cdp, deepSeed(), "I6 deep leaf seed");
        await runDeepCases(cdp);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
      }
    }
    // Phiên 2: nested ramp.
    {
      const videoPath = path.join(SCRATCH, "ramp12.mp4");
      const okVideo = await genRampVideo(videoPath);
      // Control video của case ramp lấy cùng file qua static server
      // (origin của app) — copy vào snapshot để server phục vụ được.
      if (okVideo) {
        try { fs.copyFileSync(videoPath, path.join(snap.dir, "ramp12.mp4")); log("video ramp đã copy vào snapshot (phục vụ control qua /ramp12.mp4)"); }
        catch (e) { log(`không copy được video vào snapshot: ${e.message}`); }
      }
      if (!okVideo) {
        caseFail("R0-ramp-seed-media", "không tạo được video ramp12.mp4 bằng ffmpeg (hạ tầng)");
      } else {
        const holder = {};
        const cdp = await startChrome(holder);
        if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên ramp)"); return 2; }
        holders.push(holder);
        try {
          await loadSession(cdp, process.env.I6_DIAG_PLAIN === "1" ? plainSeed() : rampSeed(), process.env.I6_DIAG_PLAIN === "1" ? "I6 plain clip seed" : "I6 nested ramp seed");
          await runRampCases(cdp, videoPath);
        } finally {
          try { holder.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
          try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
        }
      }
    }
    const failed = results.filter((r) => r.status === "FAIL");
    const rejected = results.filter((r) => r.status === "SEED-REJECTED");
    exitCode = failed.length === 0 ? 0 : 1;
    log(`DONE clicktest-deep-leaf-ramp: ${results.filter((r) => r.status === "PASS").length}/${results.length} case pass, ${failed.length} fail, ${rejected.length} seed-rejected, exit=${exitCode}`);
  } catch (e) {
    log(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
    exitCode = 2;
  } finally {
    for (const h of holders) { try { h.chrome && h.chrome.kill("SIGKILL"); } catch { /* bỏ qua */ } }
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { server && server.close(); } catch { /* bỏ qua */ }
    const out = {
      runAt: new Date().toISOString(), label: RUN_LABEL, display: DISPLAY, port: PORT,
      cases: results, log: logLines,
    };
    const outPath = path.join(ROOT, "benchmarks", "results", "clicktest-deep-leaf-ramp-r25.json");
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      writeFileEpermRetry(outPath, JSON.stringify(out, null, 2));
      console.log(`results JSON: ${outPath}`);
    } catch (e) { console.log(`không ghi được results JSON: ${e.message}`); }
  }
  return exitCode;
}

process.exitCode = await main();
