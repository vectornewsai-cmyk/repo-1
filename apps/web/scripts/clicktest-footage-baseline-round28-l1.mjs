#!/usr/bin/env node
/**
 * clicktest-footage-baseline-round28-l1.mjs — Phase 9 đợt 28, luồng L1:
 * điều tra cơ chế lệch baseline nguồn frame preview của footage K
 * (nợ đợt 27 §3.1 / K3 §4.4). K3 đã chứng minh dip KHỚP nhưng sanity
 * footage K (không transition) vẫn lệch control ~5,6 MAD resampled.
 *
 * Harness này KHÔNG đo dip. Nó đo sanity-only trên clip K duy nhất và
 * tách riêng từng cơ chế bằng phép đo loại trừ trong cùng một phiên
 * browser, cùng một frame app đã capture (không scrub lại giữa các
 * probe, trừ guard khung tối):
 *  P0 app vs control 2-bước offset làm tròn 438 (tái lập đúng K3).
 *  P1 app vs control 2-bước offset chính xác 437,5 (letterboxFit thật).
 *  P2 app vs control 1-bước offset 437,5 (tái lập đúng chuỗi app:
 *      ctx đã mang viewport transform, drawImage(video, dx,dy,dw,dh)
 *      một lần duy nhất — không qua canvas project trung gian).
 *  P3 app vs control 1-bước offset 438 (tách offset trong chuỗi 1-bước).
 *  P4 control 2-bước-438 vs 2-bước-437,5 (độ lớn thuần của lệch 0,5px,
 *      không liên quan app).
 *  P5 control 2-bước-437,5 vs 1-bước-437,5 (độ lớn thuần của 1-vs-2 bước
 *      resample, không liên quan app).
 *  P6 control-A vs control-B cùng chuỗi (phương sai decode/seek giữa
 *      hai video element độc lập).
 *  P7 control 2-bước smooth vs no-smoothing (độ nhạy kernel resample).
 *  P8 app vs control-B 1-bước-437,5 (đối chứng element cho P2).
 *  SWEEP: app vs control 1-bước-437,5 ở các frame nguồn k0-2..k0+2
 *      (lưới fps gốc 24000/1001, seek giữa frame) — tách "sai frame"
 *      khỏi "cùng frame khác pixel".
 *  NATIVE (chỉ probe đầu): pixel control ở kích thước gốc 1080x1920
 *      (không scale) lấy mẫu bước 8, để so offline với frame FFmpeg
 *      (RGB + YUV->RGB bt601/bt709 — tứ giác kiểu H4 đợt 24) và tách
 *      lệch màu/decode khỏi lệch resample.
 * Ngoài ra đọc window.__vcutHoldStats trước/sau scrub để biết frame
 * app có rơi vào nhánh hold-frame J4 hay không.
 *
 * Kế thừa hạ tầng pipe CDP của K3 (Xvfb + snapshot dist + seed qua
 * autosave + scrub ruler thật + import qua DOM.setFileInputFiles).
 * Display/port riêng (:99/4199) để khỏi đụng các luồng đợt 28 khác.
 * Kết quả JSON: benchmarks/results/v28-l1-footage-baseline.json.
 * Thoát 0 = harness chạy xong (các probe chỉ mang tính chẩn đoán,
 * không gating fail cho app); 2 = blocker hạ tầng.
 * Scratch: ~/workspace/tmp-round28-l1/ (footage K + snapshot dist),
 * không đưa binary vào repo.
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round28-l1");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.L1_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.L1_DISPLAY || ":99";
const PORT = Number(process.env.L1_PORT || 4199);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.L1_RUN_LABEL || "l1-run1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) {
  const line = `[${stamp()}] ${a.join(" ")}`;
  logLines.push(line);
  console.log(line);
}

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

function verdictFor(mad, le8) {
  if (mad <= 2 && le8 >= 0.99) return "KHỚP";
  if (mad <= 20 && le8 >= 0.90) return "XẤP XỈ";
  return "LỆCH";
}


// ------------------------------------------------------------- measure ---
/** Chạy trong trang: capture frame app 1 lần, chạy mọi probe trên frame đó. */
function pageBaselineProbes(arg) {
  return (async () => {
    const W = 1280, H = 720;
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return { error: "không thấy canvas preview" };
    const cw = canvas.width, ch = canvas.height;
    const ctx = canvas.getContext("2d");
    const appData = ctx.getImageData(0, 0, cw, ch).data;
    const scale = Math.min(cw / W, ch / H);
    const offX = (cw - W * scale) / 2, offY = (ch - H * scale) / 2;
    // Letterbox thật của app (previewEngine.letterboxFit, không làm tròn):
    // s = min(1280/1080, 720/1920) = 0.375 -> dw=405, dx=437.5, dy=0.
    const DW = 405, DH = 720, DX_EXACT = 437.5, DX_ROUND = 438;
    // Vùng mẫu trong pillar, inset 4px, bước 4px project.
    const x0 = Math.round(DX_EXACT) + 4, x1 = Math.round(DX_EXACT) + DW - 4;
    const y0 = 4, y1 = H - 4, step = 4;
    const samples = [];
    for (let py = y0; py < y1; py += step)
      for (let px = x0; px < x1; px += step) {
        const dx = Math.round(offX + px * scale), dy = Math.round(offY + py * scale);
        if (dx < 0 || dy < 0 || dx >= cw || dy >= ch) continue;
        samples.push([dx, dy]);
      }
    const meanOf = (data) => {
      const m = [0, 0, 0];
      for (const [dx, dy] of samples) { const i = (dy * cw + dx) * 4; m[0] += data[i]; m[1] += data[i + 1]; m[2] += data[i + 2]; }
      return m.map((s) => s / samples.length);
    };
    const cmp = (a, b) => {
      let n = 0, sum = 0, le8 = 0, maxD = 0;
      for (const [dx, dy] of samples) {
        const i = (dy * cw + dx) * 4;
        let mx = 0;
        for (let k = 0; k < 3; k++) { const d = Math.abs(a[i + k] - b[i + k]); sum += d; if (d > mx) mx = d; if (d > maxD) maxD = d; }
        if (mx <= 8) le8++;
        n++;
      }
      return { n, mad: sum / (n * 3), le8: le8 / n, maxDiff: maxD,
        verdict: (sum / (n * 3) <= 2 && le8 / n >= 0.99) ? "KHỚP" : (sum / (n * 3) <= 20 && le8 / n >= 0.90) ? "XẤP XỈ" : "LỆCH" };
    };
    const map = (window.__l1ctl = window.__l1ctl || {});
    async function getCtl(key) {
      let v = map[key];
      if (!v) {
        v = document.createElement("video");
        v.muted = true; v.playsInline = true; v.preload = "auto";
        v.src = arg.controlUrl;
        map[key] = v;
        await new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error("timeout load control video")), 20000);
          v.onloadedmetadata = () => { clearTimeout(to); res(); };
          v.onerror = () => { clearTimeout(to); rej(new Error("control video error")); };
        });
      }
      return v;
    }
    async function seekCtl(v, t) {
      v.pause();
      v.currentTime = t;
      await new Promise((res, rej) => {
        const to = setTimeout(() => rej(new Error("timeout seek control")), 20000);
        v.onseeked = () => { clearTimeout(to); res(); };
      });
      return v.currentTime;
    }
    // 2 bước kiểu K3: video -> canvas project 1280x720 (contain-fit) ->
    // canvas device dưới viewport transform.
    function draw2step(v, dxOff, smooth) {
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const octx = off.getContext("2d");
      octx.imageSmoothingEnabled = smooth;
      octx.fillStyle = "#000"; octx.fillRect(0, 0, W, H);
      octx.drawImage(v, dxOff, 0, DW, DH);
      const dev = document.createElement("canvas");
      dev.width = cw; dev.height = ch;
      const dctx = dev.getContext("2d");
      dctx.imageSmoothingEnabled = smooth;
      dctx.setTransform(scale, 0, 0, scale, offX, offY);
      dctx.drawImage(off, 0, 0);
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      return dctx.getImageData(0, 0, cw, ch).data;
    }
    // 1 bước kiểu app: ctx đã mang viewport transform, drawImage trực tiếp.
    function draw1step(v, dxOff) {
      const dev = document.createElement("canvas");
      dev.width = cw; dev.height = ch;
      const dctx = dev.getContext("2d");
      dctx.setTransform(scale, 0, 0, scale, offX, offY);
      dctx.drawImage(v, dxOff, 0, DW, DH);
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      return dctx.getImageData(0, 0, cw, ch).data;
    }
    const ctlA = await getCtl("A");
    const ctlB = await getCtl("B");
    const ctA = await seekCtl(ctlA, arg.sourceT);
    const ctB = await seekCtl(ctlB, arg.sourceT);
    if (Math.abs(ctA - arg.sourceT) > 0.25 || Math.abs(ctB - arg.sourceT) > 0.25)
      return { error: `control seek thất bại: ctA=${ctA} ctB=${ctB} muốn ${arg.sourceT}` };
    const d2r = draw2step(ctlA, DX_ROUND, true);
    const d2e = draw2step(ctlA, DX_EXACT, true);
    const d1e = draw1step(ctlA, DX_EXACT);
    const d1r = draw1step(ctlA, DX_ROUND);
    const d2eB = draw2step(ctlB, DX_EXACT, true);
    const d1eB = draw1step(ctlB, DX_EXACT);
    const d2ns = draw2step(ctlA, DX_EXACT, false);
    const probes = {
      P0_app_vs_2step438_K3replication: cmp(appData, d2r),
      P1_app_vs_2step4375: cmp(appData, d2e),
      P2_app_vs_1step4375_appChain: cmp(appData, d1e),
      P3_app_vs_1step438: cmp(appData, d1r),
      P4_2step438_vs_2step4375_shiftOnly: cmp(d2r, d2e),
      P5_2step4375_vs_1step4375_stepsOnly: cmp(d2e, d1e),
      P6_ctlA_vs_ctlB_2step4375: cmp(d2e, d2eB),
      P7_2stepSmooth_vs_noSmooth: cmp(d2e, d2ns),
      P8_app_vs_1step4375_ctlB: cmp(appData, d1eB),
    };
    const means = { app: meanOf(appData), ctl2step438: meanOf(d2r), ctl1step4375: meanOf(d1e) };
    // Sweep frame nguồn theo lưới fps gốc 24000/1001, seek giữa frame.
    const FPSN = 24000 / 1001;
    const k0 = Math.floor(arg.sourceT * FPSN);
    const sweep = [];
    for (const dk of [-2, -1, 0, 1, 2]) {
      const kk = k0 + dk;
      const seekT = (kk + 0.5) / FPSN;
      const ct = await seekCtl(ctlA, seekT);
      const dd = draw1step(ctlA, DX_EXACT);
      const c = cmp(appData, dd);
      sweep.push({ dk, frameIndex: kk, seekT: Math.round(seekT * 10000) / 10000, ctlCurrentTime: ct, ...c });
    }
    // Khôi phục control về sourceT (không bắt buộc, chỉ sạch trạng thái).
    await seekCtl(ctlA, arg.sourceT);
    let nativeSamples = null;
    if (arg.includeNative) {
      const nat = document.createElement("canvas");
      nat.width = 1080; nat.height = 1920;
      const nctx = nat.getContext("2d");
      nctx.drawImage(ctlA, 0, 0, 1080, 1920);
      const nd = nctx.getImageData(0, 0, 1080, 1920).data;
      const arr = [];
      for (let y = 0; y < 1920; y += 8)
        for (let x = 0; x < 1080; x += 8) {
          const i = (y * 1080 + x) * 4;
          arr.push(nd[i], nd[i + 1], nd[i + 2]);
        }
      nativeSamples = { step: 8, w: 1080, h: 1920, rgb: arr };
    }
    return { canvasW: cw, canvasH: ch, scale, offX, offY, nSamples: samples.length,
      probes, means, sweep, k0, fpsNative: FPSN,
      controlVideo: { w: ctlA.videoWidth, h: ctlA.videoHeight, ctA, ctB },
      holdStats: (window.__vcutHoldStats || null), nativeSamples };
  })();
}


// ------------------------------------------------------------- main ------
async function main() {
  log(`harness clicktest-footage-baseline-round28-l1: bắt đầu (label=${RUN_LABEL}, display=${DISPLAY}, port=${PORT})`);
  let xvfb = null, server = null, exitCode = 2;
  const records = [];
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    const kPath = path.join(SCRATCH, "videos", "clip-k-dod-iwo.mp4");
    if (!fs.existsSync(kPath)) { log("BLOCKER: chưa có footage K tại " + kPath + " (cần tải + verify SHA trước)"); return 2; }
    const sha = crypto.createHash("sha256").update(fs.readFileSync(kPath)).digest("hex");
    if (sha !== "49f33b83f0e7694e560557e08379b4bef628fed4f89662898764d5c12db6d69c") {
      log(`BLOCKER: SHA K không khớp J3 (${sha.slice(0, 16)}...)`); return 2;
    }
    log(`footage K OK: SHA khớp J3, ${fs.statSync(kPath).size} byte`);
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) { log("BLOCKER: dist snapshot thất bại"); return 2; }
    fs.copyFileSync(kPath, path.join(snap.dir, "clip-k-dod-iwo.mp4"));
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }
    const holder = {};
    const cdp = await startChrome(holder);
    if (!cdp) { log("BLOCKER: không binary nào mở được pipe"); return 2; }
    try {
      const seed = {
        version: "0.2.0",
        meta: { name: "L1 footage baseline seed", width: 1280, height: 720, fps: 30 },
        tracks: [{ id: "t-main", kind: "video", clips: [
          { kind: "video", id: "c-k", src: "clip-k-dod-iwo.mp4", start: 0, duration: 10, in: 0, out: 10 },
        ] }],
      };
      await loadSession(cdp, seed, "L1 footage baseline seed");
      await importMedia(cdp, [kPath], ["clip-k-dod-iwo.mp4"]);
      await calibrateHandle(cdp);
      const ruler = await getRuler(cdp);
      if (!ruler) throw new Error("không thấy .tl-ruler");
      if (ruler.y < 0 || ruler.y + ruler.h > ruler.innerH) throw new Error(`ruler ngoài viewport: ${JSON.stringify(ruler)}`);
      log(`ruler rect: ${JSON.stringify(ruler)}`);
      const probeTargets = [2.0333, 3.0333, 5.0333];
      for (let pi = 0; pi < probeTargets.length; pi++) {
        const target = probeTargets[pi];
        const holdBefore = await cdp.evaluate(`window.__vcutHoldStats ? {...window.__vcutHoldStats} : null`);
        const scr = await scrubTo(cdp, ruler, target);
        const playhead = scr.snapped;
        const arg = { file: "clip-k-dod-iwo.mp4", controlUrl: `${ORIGIN}/clip-k-dod-iwo.mp4`,
          sourceT: playhead, includeNative: pi === 0 };
        let m;
        try {
          m = await cdp.evaluate(`(${pageBaselineProbes.toString()})(${JSON.stringify(arg)})`, 120000);
        } catch (e) {
          log(`probe target ${target} lỗi measure: ${e.message}`);
          records.push({ target, playhead, status: "ERROR", error: e.message, scrub: scr });
          continue;
        }
        if (m.error) { log(`probe target ${target} lỗi: ${m.error}`); records.push({ target, playhead, status: "ERROR", error: m.error, scrub: scr }); continue; }
        // Guard khung tối kiểu K3: appMean ~ nền khung trong khi control sáng.
        let retried = false, measurementInvalid = false;
        const isBg = (mean) => mean && Math.max(...mean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) <= 3;
        const expFar = m.means.app && Math.max(...m.means.ctl1step4375.map((v, i) => Math.abs(v - [10, 12, 16][i]))) > 30;
        if (isBg(m.means.app) && expFar) {
          log(`  guard khung tối target ${target}: appMean ~ nền khung, scrub lệch 1 frame rồi quay lại`);
          retried = true;
          await scrubTo(cdp, ruler, target + 1 / 30);
          const scr2 = await scrubTo(cdp, ruler, target);
          const arg2 = { ...arg, sourceT: scr2.snapped };
          try {
            const m2 = await cdp.evaluate(`(${pageBaselineProbes.toString()})(${JSON.stringify(arg2)})`, 120000);
            if (!m2.error) { m = m2; }
          } catch {}
          if (isBg(m.means.app) && expFar) { measurementInvalid = true; log(`  guard khung tối target ${target}: sau retry vẫn tối -> measurementInvalid`); }
        }
        const holdAfter = m.holdStats;
        const rec = { target, playhead, localT: playhead, sourceFrameIndex: m.k0,
          fpsNative: m.fpsNative, canvasW: m.canvasW, canvasH: m.canvasH, scale: m.scale,
          offX: m.offX, offY: m.offY, nSamples: m.nSamples, probes: m.probes,
          means: m.means, sweep: m.sweep, controlVideo: m.controlVideo,
          holdBefore, holdAfter, handleDeltaFrames: scr.handleDeltaFrames,
          retried, measurementInvalid, nativeSamples: m.nativeSamples || null,
          settled: scr.settled };
        records.push(rec);
        for (const [k, v] of Object.entries(m.probes))
          log(`  target ${target} ${k}: MAD=${v.mad.toFixed(3)} <=8=${(v.le8 * 100).toFixed(2)}% max=${v.maxDiff} (${v.verdict})`);
        log(`  target ${target} sweep (1step-4375, lưới fps gốc): ${m.sweep.map((s) => `dk${s.dk>=0?"+":""}${s.dk}/f${s.frameIndex}:MAD${s.mad.toFixed(2)}`).join(" ")}`);
        log(`  target ${target} holdStats before=${JSON.stringify(holdBefore)} after=${JSON.stringify(holdAfter)} handleDelta=${scr.handleDeltaFrames}`);
      }
      const exc = cdp.exceptions.length;
      log(`exceptions trong phiên: ${exc}${exc ? ` (đầu: ${JSON.stringify(cdp.exceptions[0]).slice(0, 300)})` : ""}`);
      exitCode = 0;
      log(`DONE l1: ${records.length} probe, exit=${exitCode}`);
      const outJson = { run: RUN_LABEL, date: new Date().toISOString(),
        bundle: snap.bundle, bundleSha256_16: snap.sha, display: DISPLAY, port: PORT, origin: ORIGIN,
        footage: { file: "clip-k-dod-iwo.mp4", sha256: sha, license: "publicdomain (IA metadata licenseurl)", ffprobe: "h264 1080x1920 24000/1001 bt709" },
        records, exceptions: cdp.exceptions, log: logLines };
      const outPath = path.join(ROOT, "benchmarks", "results", "v28-l1-footage-baseline.json");
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
