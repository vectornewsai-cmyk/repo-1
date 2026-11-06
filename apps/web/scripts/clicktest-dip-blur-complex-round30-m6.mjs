/**
 * clicktest-dip-blur-complex-round30-m6.mjs — Phase 9 đợt 30, luồng M6:
 * blur trên FOOTAGE THẬT PHỨC TẠP (không chỉ vạch tổng hợp) + thời gian
 * thuần vòng lặp dip trong page browser thật.
 *
 * Hạ tầng pipe CDP trích từ clicktest-dip-browser-round29-l6.mjs của L6
 * (PipeCdp, Xvfb, snapshot dist, static server, loadSession, ruler/scrub,
 * pageMeasureBlur) — phần đo mới: footage thật + vòng dip thuần.
 *
 * Footage (chỉ ở scratch, KHÔNG vào repo):
 * - clip-k-trim19.mp4: footage K đợt 28 cắt từ 19.0s (cửa sổ motion mạnh
 *   nhất 30s đầu: mean|diff| 46.93/43.62 ở 19.0/19.5s, đo bằng scan
 *   gray 270x480 @12fps) — 6s, giữ fps gốc 23.976.
 * - clip-k-trim11.mp4: cùng footage K cắt từ 11.0s (motion mạnh thứ hai:
 *   26.47/21.35/28.48 ở 11.0/11.5/12.0s).
 * - complex-synth.mp4: FFmpeg testsrc2 1080x1920 30fps 6s (chi tiết +
 *   chuyển động xác định, không phải vạch đơn).
 * Mỗi clip mang motionBlur frames 3 weights [1,1,1] + transitionIn
 * fadewhite 1s; đo ở p=0.5 (target = start+0.5), scrub từng bước để
 * tích lũy snapshot trailing như L6. Kỳ vọng = trung bình 3 frame
 * control rồi dip trắng (alpha theo fadeDipWeights). Gating=false
 * (INFO) như L6 vì pha snapshot/seek vẫn là caveat đã biết.
 * pageMeasureBlur mở rộng so với L6: trả thêm ctlTimes (currentTime
 * thật của 3 frame control) và tách le8 theo mức motion tại điểm mẫu
 * (le8LowMotion: mẫu có motionMag <= 8) để phân biệt "sai ngữ nghĩa
 * blur" với "lệch pha frame ở vùng chuyển động nhanh".
 *
 * Vòng dip thuần trong page (pagePureDip): tạo canvas riêng ở đúng
 * kích thước project 1080x1920 và 2160x3840, fill pattern xác định,
 * rồi tách thời gian getImageData / vòng lặp (CHÍNH singleClipDipPixel
 * trích verbatim từ transitionPreview.ts qua tsc — không cài lại)
 * / putImageData. Không đo seek/decode/rAF nên đối chiếu trực tiếp
 * được với longtask cận trên đợt 29.
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-dip-blur-complex-round30-m6.mjs
 * Biến môi trường: M6_DISPLAY (mặc định :95), M6_PORT (mặc định 4195),
 * M6_RUN_LABEL, M6_OUT (mặc định benchmarks/results/v30-m6-blur-browser.json).
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG binary
 * vào repo (video + snapshot chỉ ở ~/workspace/tmp-round30-m6/).
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round30-m6");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.M6_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.M6_DISPLAY || ":95";
const PORT = Number(process.env.M6_PORT || 4195);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const RUN_LABEL = process.env.M6_RUN_LABEL || "m6";
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "l6-pipe-"));
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


async function perfProbe(cdp, ruler, dipTarget, plainTarget) {
  const install = `(() => { window.__l6lt = [];
    try { const ob = new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__l6lt.push({ duration: e.duration, start: e.startTime }); });
      ob.observe({ entryTypes: ["longtask"] }); window.__l6ob = ob; return true; }
    catch (e) { return false; } })()`;
  const out = {};
  for (const [label, target] of [["dip", dipTarget], ["plain", plainTarget]]) {
    await cdp.evaluate(install);
    const t0 = await cdp.evaluate(`performance.now()`);
    await scrubTo(cdp, ruler, target);
    await sleep(1000);
    const entries = await cdp.evaluate(`window.__l6lt || []`);
    const t1 = await cdp.evaluate(`performance.now()`);
    const inWindow = entries.filter((e) => e.start >= t0 - 50 && e.start <= t1);
    out[label] = { target, t0, t1, entries: inWindow,
      durations: inWindow.map((e) => Math.round(e.duration * 10) / 10) };
    log(`  perf ${label} (target ${target}): longtask durations ms = [${out[label].durations.join(", ")}]`);
    try { await cdp.evaluate(`window.__l6ob && window.__l6ob.disconnect()`); } catch {}
  }
  return out;
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

/** Video phẳng/tĩnh cho 1 độ phân giải (W×H dọc). Trả thư mục video. */
function genComplexVideos() {
  const vidDir = path.join(SCRATCH, "videos-blur");
  fs.mkdirSync(vidDir, { recursive: true });
  const K = path.join(os.homedir(), "workspace", "tmp-round28-l6", "footage", "clip-k-dod-iwo.mp4");
  const trims = [
    { file: "clip-k-trim19.mp4", ss: "19.0" },
    { file: "clip-k-trim11.mp4", ss: "11.0" },
  ];
  for (const t of trims) {
    const out = path.join(vidDir, t.file);
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) {
      const ok = runCmd("ffmpeg", ["-y", "-v", "error", "-ss", t.ss, "-i", K,
        "-t", "6", "-c:v", "libx264", "-pix_fmt", "yuv420p", out], t.file);
      if (!ok) return null;
    }
    log(`video footage thật OK: ${t.file} (${fs.statSync(out).size} byte)`);
  }
  const synth = path.join(vidDir, "complex-synth.mp4");
  if (!fs.existsSync(synth) || fs.statSync(synth).size === 0) {
    const ok = runCmd("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
      "-i", "testsrc2=size=1080x1920:rate=30:duration=6",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", synth], "complex-synth.mp4");
    if (!ok) return null;
  }
  log(`video tổng hợp phức tạp OK: complex-synth.mp4 (${fs.statSync(synth).size} byte)`);
  return vidDir;
}
// ------------------------------------------------------------- seeds -----
function videoClip(id, src, start, duration, extra = {}) {
  return { kind: "video", id, src, start, duration, in: 0, out: duration, ...extra };
}
function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}
function seedFor(meta, clips) {
  return { version: "0.2.0", meta, tracks: [{ id: "t-main", kind: "video", clips }] };
}
const MASK_RECT = { shape: "rect", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.1 };
function seedBlur(W, H) {
  return seedFor({ name: "M6 blur footage thật seed", width: W, height: H, fps: 30 }, [
    videoClip("c-k19", "clip-k-trim19.mp4", 0, 4,
      { motion: { motionBlur: { frames: 3, weights: [1, 1, 1] } },
        transitionIn: { type: "fadewhite", duration: 1 } }),
    videoClip("c-k11", "clip-k-trim11.mp4", 4, 4,
      { motion: { motionBlur: { frames: 3, weights: [1, 1, 1] } },
        transitionIn: { type: "fadewhite", duration: 1 } }),
    videoClip("c-synth", "complex-synth.mp4", 8, 4,
      { motion: { motionBlur: { frames: 3, weights: [1, 1, 1] } },
        transitionIn: { type: "fadewhite", duration: 1 } }),
  ]);
}
// ------------------------------------------------------------- measure ---
/** Chạy trong trang: so canvas app với control video + dip model (phẳng). */
function pageMeasureDip(arg) {
  return (async () => {
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return { error: "không thấy canvas preview" };
    const W = arg.W, H = arg.H;
    const cw = canvas.width, ch = canvas.height;
    const ctx = canvas.getContext("2d");
    const appData = ctx.getImageData(0, 0, cw, ch).data;
    const scale = Math.min(cw / W, ch / H);
    const offX = (cw - W * scale) / 2, offY = (ch - H * scale) / 2;
    const map = (window.__l6ctl = window.__l6ctl || {});
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
    const cs = Math.min(W / v.videoWidth, H / v.videoHeight);
    const dw = Math.round(v.videoWidth * cs), dh = Math.round(v.videoHeight * cs);
    const cx0 = Math.round((W - dw) / 2), cy0 = Math.round((H - dh) / 2);
    octx.drawImage(v, cx0, cy0, dw, dh);
    const ctlData = octx.getImageData(0, 0, W, H).data;
    const dipPx = (cr, cg, cb) => {
      if (arg.mode === "white") return [arg.alpha * cr + (1 - arg.alpha) * 255, arg.alpha * cg + (1 - arg.alpha) * 255, arg.alpha * cb + (1 - arg.alpha) * 255];
      if (arg.mode === "gray") { const g = (cr + cg + cb) / 3; return [arg.alpha * cr + (1 - arg.alpha) * g, arg.alpha * cg + (1 - arg.alpha) * g, arg.alpha * cb + (1 - arg.alpha) * g]; }
      // fadeblack đi đường alpha (không qua nhánh dip): clip vẽ bằng
      // globalAlpha lên nền khung #0a0c10 = (10,12,16), KHÔNG phải lên
      // nền đen 0 — run1 đo sai chỗ này (appMean đúng (10,12,16),
      // kỳ vọng sai (0,0,0), MAD 12,67 giả).
      if (arg.mode === "black") return [arg.alpha * cr + (1 - arg.alpha) * 10, arg.alpha * cg + (1 - arg.alpha) * 12, arg.alpha * cb + (1 - arg.alpha) * 16];
      return [cr, cg, cb];
    };
    const x0 = Math.round(W * 0.15), x1 = Math.round(W * 0.85);
    const y0 = Math.round(H * 0.15), y1 = Math.round(H * 0.85);
    const step = arg.step || 8;
    let n = 0, sum = 0, le8 = 0, maxD = 0;
    const appMean = [0, 0, 0], ctlMean = [0, 0, 0], expMean = [0, 0, 0];
    for (let py = y0; py < y1; py += step) {
      for (let px = x0; px < x1; px += step) {
        const ci = (py * W + px) * 4;
        const cr = ctlData[ci], cg = ctlData[ci + 1], cb = ctlData[ci + 2];
        const [er, eg, eb] = dipPx(cr, cg, cb);
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
    let madR = null, le8R = null, maxDR = 0, nR = 0, sumR = 0, le8c = 0;
    try {
      const dipOff = document.createElement("canvas");
      dipOff.width = W; dipOff.height = H;
      const dctx0 = dipOff.getContext("2d");
      dctx0.drawImage(off, 0, 0);
      const img = dctx0.getImageData(0, 0, W, H);
      const dd = img.data;
      for (let i = 0; i < dd.length; i += 4) {
        const [r, g, b] = dipPx(dd[i], dd[i + 1], dd[i + 2]);
        dd[i] = r; dd[i + 1] = g; dd[i + 2] = b;
      }
      dctx0.putImageData(img, 0, 0);
      const dev = document.createElement("canvas");
      dev.width = cw; dev.height = ch;
      const dctx = dev.getContext("2d");
      dctx.setTransform(scale, 0, 0, scale, offX, offY);
      dctx.drawImage(dipOff, 0, 0);
      dctx.setTransform(1, 0, 0, 1, 0, 0);
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

/** Chạy trong trang: tổ hợp dip + mask/SR/track — kỳ vọng theo vùng phủ.
 *  Coverage tính INLINE trong hàm này (hàm được .toString() gửi sang
 *  trang nên không được tham chiếu helper ngoài). */
function pageMeasureCombo(arg) {
  return (async () => {
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return { error: "không thấy canvas preview" };
    const W = arg.W, H = arg.H;
    const cw = canvas.width, ch = canvas.height;
    const ctx = canvas.getContext("2d");
    const appData = ctx.getImageData(0, 0, cw, ch).data;
    const scale = Math.min(cw / W, ch / H);
    const offX = (cw - W * scale) / 2, offY = (ch - H * scale) / 2;
    const map = (window.__l6ctl = window.__l6ctl || {});
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
    const cs = Math.min(W / v.videoWidth, H / v.videoHeight);
    const dw = Math.round(v.videoWidth * cs), dh = Math.round(v.videoHeight * cs);
    const cx0 = Math.round((W - dw) / 2), cy0 = Math.round((H - dh) / 2);
    octx.drawImage(v, cx0, cy0, dw, dh);
    const ctlData = octx.getImageData(0, 0, W, H).data;
    const BG = [10, 12, 16];
    const step = arg.step || 8;
    let n = 0, nIn = 0, nOut = 0, nSkip = 0, sum = 0, sumIn = 0, sumOut = 0, le8 = 0, le8In = 0, le8Out = 0, maxD = 0;
    const appMeanOut = [0, 0, 0], expMeanIn = [0, 0, 0], appMeanIn = [0, 0, 0];
    const coverageAt = (px, py) => {
      if (arg.combo === "mask-rect") {
        const x0 = (0.5 - 0.6 / 2) * W, x1 = (0.5 + 0.6 / 2) * W;
        const y0 = (0.5 - 0.6 / 2) * H, y1 = (0.5 + 0.6 / 2) * H;
        const band = 0.1 * Math.min(0.6 * W, 0.6 * H);
        const d = Math.max(Math.max(x0 - px, px - x1), Math.max(y0 - py, py - y1));
        const a = band <= 1e-6 ? (d < 0 ? 1 : 0) : Math.min(1, Math.max(0, 0.5 - d / band));
        if (a >= 0.999) return 1;
        if (a <= 0.001) return 0;
        return -1;
      }
      if (arg.combo === "sr") {
        const cs = Math.cos(15 * Math.PI / 180), sn = Math.sin(15 * Math.PI / 180);
        const dx = px - W / 2, dy = py - H / 2;
        const sx = (cs * dx + sn * dy) / 1.3, sy = (-sn * dx + cs * dy) / 1.3;
        const m = 10;
        if (Math.abs(sx) <= W / 2 - m && Math.abs(sy) <= H / 2 - m) return 1;
        if (Math.abs(sx) > W / 2 + m || Math.abs(sy) > H / 2 + m) return 0;
        return -1;
      }
      if (arg.combo === "track") {
        const m = 10;
        const inX = px >= 0.1 * W + m && px <= 1.1 * W - m;
        const inY = py >= -0.1 * H + m && py <= 0.9 * H - m;
        const outX = px < 0.1 * W - m || px > 1.1 * W + m;
        const outY = py < -0.1 * H - m || py > 0.9 * H + m;
        if (inX && inY) return 1;
        if (outX || outY) return 0;
        return -1;
      }
      return -1;
    };
    for (let py = 0; py < H; py += step) {
      for (let px = 0; px < W; px += step) {
        const cov = coverageAt(px, py);
        if (cov < 0) { nSkip++; continue; }
        const ci = (py * W + px) * 4;
        const cr = ctlData[ci], cg = ctlData[ci + 1], cb = ctlData[ci + 2];
        let er, eg, eb;
        if (cov === 1) {
          if (arg.mode === "white") { er = arg.alpha * cr + (1 - arg.alpha) * 255; eg = arg.alpha * cg + (1 - arg.alpha) * 255; eb = arg.alpha * cb + (1 - arg.alpha) * 255; }
          else { const g = (cr + cg + cb) / 3; er = arg.alpha * cr + (1 - arg.alpha) * g; eg = arg.alpha * cg + (1 - arg.alpha) * g; eb = arg.alpha * cb + (1 - arg.alpha) * g; }
        } else { er = BG[0]; eg = BG[1]; eb = BG[2]; }
        const dx = Math.round(offX + px * scale), dy = Math.round(offY + py * scale);
        if (dx < 0 || dy < 0 || dx >= cw || dy >= ch) continue;
        const ai = (dy * cw + dx) * 4;
        const ar = appData[ai], ag = appData[ai + 1], ab = appData[ai + 2];
        let md = 0, mx = 0;
        const ds = [Math.abs(ar - er), Math.abs(ag - eg), Math.abs(ab - eb)];
        for (const d of ds) { md += d; if (d > mx) mx = d; if (d > maxD) maxD = d; }
        sum += md; if (mx <= 8) le8++; n++;
        if (cov === 1) { sumIn += md; if (mx <= 8) le8In++; nIn++; appMeanIn[0] += ar; appMeanIn[1] += ag; appMeanIn[2] += ab; expMeanIn[0] += er; expMeanIn[1] += eg; expMeanIn[2] += eb; }
        else { sumOut += md; if (mx <= 8) le8Out++; nOut++; appMeanOut[0] += ar; appMeanOut[1] += ag; appMeanOut[2] += ab; }
      }
    }
    if (!n) return { error: "không lấy được mẫu nào" };
    return { canvasW: cw, canvasH: ch, scale, offX, offY, n, nIn, nOut, nSkip,
      mad: sum / (n * 3), le8: le8 / n, maxDiff: maxD,
      madIn: nIn ? sumIn / (nIn * 3) : null, le8In: nIn ? le8In / nIn : null,
      madOut: nOut ? sumOut / (nOut * 3) : null, le8Out: nOut ? le8Out / nOut : null,
      appMeanIn: appMeanIn.map((s) => nIn ? s / nIn : 0), expMeanIn: expMeanIn.map((s) => nIn ? s / nIn : 0),
      appMeanOut: appMeanOut.map((s) => nOut ? s / nOut : 0),
      controlVideo: { w: v.videoWidth, h: v.videoHeight, ct: v.currentTime } };
  })();
}

/** Chạy trong trang: blur INFO — kỳ vọng = trung bình 3 frame control rồi dip.
 * Mở rộng so với L6: ghi ctlTimes + tách le8 theo motion tại điểm mẫu. */
function pageMeasureBlur(arg) {
  return (async () => {
    const canvas = document.querySelector("#vcut-preview-wrap canvas");
    if (!canvas) return { error: "không thấy canvas preview" };
    const W = arg.W, H = arg.H;
    const cw = canvas.width, ch = canvas.height;
    const ctx = canvas.getContext("2d");
    const appData = ctx.getImageData(0, 0, cw, ch).data;
    const scale = Math.min(cw / W, ch / H);
    const offX = (cw - W * scale) / 2, offY = (ch - H * scale) / 2;
    const map = (window.__l6ctl = window.__l6ctl || {});
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
    const frames = [];
    const ctlTimes = [];
    for (const t of [arg.sourceT, Math.max(0, arg.sourceT - 1 / 30), Math.max(0, arg.sourceT - 2 / 30)]) {
      v.pause();
      v.currentTime = t;
      await new Promise((res, rej) => {
        const to = setTimeout(() => rej(new Error("timeout seek control")), 15000);
        v.onseeked = () => { clearTimeout(to); res(); };
      });
      if (Math.abs(v.currentTime - t) > 0.25) return { error: "control seek thất bại: currentTime=" + v.currentTime + " muốn " + t };
      ctlTimes.push(v.currentTime);
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const octx = off.getContext("2d");
      octx.fillStyle = "#000"; octx.fillRect(0, 0, W, H);
      const cs = Math.min(W / v.videoWidth, H / v.videoHeight);
      const dw = Math.round(v.videoWidth * cs), dh = Math.round(v.videoHeight * cs);
      octx.drawImage(v, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
      frames.push(octx.getImageData(0, 0, W, H).data);
    }
    const x0 = Math.round(W * 0.15), x1 = Math.round(W * 0.85);
    const y0 = Math.round(H * 0.15), y1 = Math.round(H * 0.85);
    const step = arg.step || 8;
    let n = 0, sum = 0, le8 = 0, maxD = 0, motionSum = 0, nLow = 0, le8Low = 0;
    const appMean = [0, 0, 0], expMean = [0, 0, 0];
    for (let py = y0; py < y1; py += step) {
      for (let px = x0; px < x1; px += step) {
        const ci = (py * W + px) * 4;
        const cr = (frames[0][ci] + frames[1][ci] + frames[2][ci]) / 3;
        const cg = (frames[0][ci + 1] + frames[1][ci + 1] + frames[2][ci + 1]) / 3;
        const cb = (frames[0][ci + 2] + frames[1][ci + 2] + frames[2][ci + 2]) / 3;
        const er = arg.alpha * cr + (1 - arg.alpha) * 255;
        const eg = arg.alpha * cg + (1 - arg.alpha) * 255;
        const eb = arg.alpha * cb + (1 - arg.alpha) * 255;
        const dx = Math.round(offX + px * scale), dy = Math.round(offY + py * scale);
        if (dx < 0 || dy < 0 || dx >= cw || dy >= ch) continue;
        const ai = (dy * cw + dx) * 4;
        const ar = appData[ai], ag = appData[ai + 1], ab = appData[ai + 2];
        let md = 0, mx = 0;
        const ds = [Math.abs(ar - er), Math.abs(ag - eg), Math.abs(ab - eb)];
        for (const d of ds) { md += d; if (d > mx) mx = d; if (d > maxD) maxD = d; }
        sum += md;
        if (mx <= 8) le8++;
        // Motion tại điểm mẫu: trung bình 3 kênh của (|f0-f1|+|f1-f2|)/2.
        let mm = 0;
        for (let k = 0; k < 3; k++) {
          mm += (Math.abs(frames[0][ci + k] - frames[1][ci + k]) + Math.abs(frames[1][ci + k] - frames[2][ci + k])) / 2;
        }
        mm /= 3;
        motionSum += mm;
        if (mm <= 8) { nLow++; if (mx <= 8) le8Low++; }
        appMean[0] += ar; appMean[1] += ag; appMean[2] += ab;
        expMean[0] += er; expMean[1] += eg; expMean[2] += eb;
        n++;
      }
    }
    if (!n) return { error: "không lấy được mẫu nào" };
    return { canvasW: cw, canvasH: ch, scale, n,
      mad: sum / (n * 3), le8: le8 / n, maxDiff: maxD,
      appMean: appMean.map((s) => s / n), expMean: expMean.map((s) => s / n),
      ctlTimes, motionMean: motionSum / n,
      le8LowMotion: nLow ? le8Low / nLow : null, nLowMotion: nLow,
      controlVideo: { w: v.videoWidth, h: v.videoHeight, ct: v.currentTime } };
  })();
}

/** Chạy trong trang: thời gian thuần vòng dip (tách get/putImageData). */
function pagePureDip(arg) {
  return (async () => {
    const fn = new Function(arg.fnSrc + "\nreturn singleClipDipPixel;")();
    const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const results = [];
    for (const { name, W, H } of arg.sizes) {
      const npix = W * H;
      const base = new Uint8ClampedArray(npix * 4);
      for (let i = 0; i < npix; i++) {
        const o = i * 4;
        base[o] = (i * 37 + 11) % 256;
        base[o + 1] = (i * 91 + 53) % 256;
        base[o + 2] = (i * 53 + 97) % 256;
        base[o + 3] = (i % 10 === 0) ? 0 : 255;
      }
      for (const mode of ["white", "gray"]) {
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const cx = cv.getContext("2d");
        const reps = name === "4K" ? 3 : 5;
        const tGet = [], tLoop = [], tPut = [];
        for (let r = 0; r < reps; r++) {
          cx.putImageData(new ImageData(new Uint8ClampedArray(base), W, H), 0, 0);
          let t0 = performance.now();
          const im = cx.getImageData(0, 0, W, H);
          tGet.push(performance.now() - t0);
          const data = im.data;
          t0 = performance.now();
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            const [rr, gg, bb] = fn([data[i], data[i + 1], data[i + 2]], 0.5, mode);
            data[i] = Math.round(rr); data[i + 1] = Math.round(gg); data[i + 2] = Math.round(bb);
          }
          tLoop.push(performance.now() - t0);
          t0 = performance.now();
          cx.putImageData(im, 0, 0);
          tPut.push(performance.now() - t0);
        }
        results.push({ size: name, W, H, npix, mode, reps,
          getMs: med(tGet), loopMs: med(tLoop), putMs: med(tPut),
          allGet: tGet, allLoop: tLoop, allPut: tPut });
      }
    }
    return { results };
  })();
}
// ------------------------------------------------------------- cases -----
const RESULTS = [];
function casePass(id, detail) { RESULTS.push({ id, status: "PASS", detail }); log(`  PASS ${id}: ${detail}`); }
function caseFail(id, detail) { RESULTS.push({ id, status: "FAIL", detail }); log(`  FAIL ${id}: ${detail}`); }
// verdictFor đã có trong đoạn model trích từ K3 (không khai báo lại).

// ------------------------------------------------------------- run -------
async function runCase(cdp, ruler, def, opts = {}) {
  const W = opts.W, H = opts.H, step = opts.step || 8;
  // Blur INFO: scrub từng bước để tích lũy snapshot trailing trước khi đo.
  if (def.blur) {
    await scrubTo(cdp, ruler, def.target - 2 / 30);
    await scrubTo(cdp, ruler, def.target - 1 / 30);
  }
  const scr = await scrubTo(cdp, ruler, def.target);
  let playhead = scr.snapped;
  let localT = playhead - def.clip.start;
  let p = null, pIn = null, pOut = null, alpha = 1, mode = null;
  if (def.window === "in") {
    p = localT / 1;
    alpha = fadeDipWeights(p).bAlpha;
    mode = def.type === "fadewhite" ? "white" : def.type === "fadegrays" ? "gray" : "black";
  } else if (def.window === "out") {
    p = (localT - (def.clip.dur - 1)) / 1;
    alpha = fadeDipWeights(p).aAlpha;
    mode = def.type === "fadewhite" ? "white" : def.type === "fadegrays" ? "gray" : "black";
  } else if (def.window === "both") {
    // Clip ngắn: cả 2 cửa sổ active — alpha tích, dip theo cửa sổ vào.
    pIn = localT / 1;
    pOut = (localT - (def.clip.dur - 1)) / 1;
    alpha = fadeDipWeights(pIn).bAlpha * fadeDipWeights(pOut).aAlpha;
    mode = def.type === "fadewhite" ? "white" : def.type === "fadegrays" ? "gray" : "black";
    p = pIn;
  }
  const uncertain = scr.handleDeltaFrames !== 0 && scr.handleDeltaFrames !== null;
  const arg = { file: def.clip.file, controlUrl: `${ORIGIN}/${def.clip.file}`,
    sourceT: Math.round(localT * 30) / 30, alpha, mode, W, H, step, combo: def.combo || null };
  const pageFn = def.blur ? pageMeasureBlur : def.combo ? pageMeasureCombo : pageMeasureDip;
  let m;
  try {
    m = await cdp.evaluate(`(${pageFn.toString()})(${JSON.stringify(arg)})`, 90000);
  } catch (e) {
    return { ...def, status: "FAIL", error: `measure lỗi: ${e.message}`, scrub: scr };
  }
  if (m.error) return { ...def, status: "FAIL", error: m.error, scrub: scr };
  // Guard khung tối (bài học K3): chỉ cho case dip phẳng, không cho combo
  // (combo có vùng ngoài phủ vốn tối) và không cho blur.
  let retried = false, measurementInvalid = false;
  const isBg = (mean) => mean && Math.max(...mean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) <= 3;
  const expFarFromBg = m.expMean && Math.max(...m.expMean.map((v, i) => Math.abs(v - [10, 12, 16][i]))) > 30;
  if (!def.combo && !def.blur && isBg(m.appMean) && expFarFromBg) {
    log(`  guard khung tối ${def.id}: scrub lệch 1 frame rồi quay lại để ép seek mới`);
    retried = true;
    await scrubTo(cdp, ruler, def.target + 1 / 30);
    const scr2 = await scrubTo(cdp, ruler, def.target);
    const ph2 = scr2.snapped, lt2 = ph2 - def.clip.start;
    let alpha2 = 1, p2 = p;
    if (def.window === "in") alpha2 = fadeDipWeights(lt2).bAlpha;
    else if (def.window === "out") alpha2 = fadeDipWeights(lt2 - (def.clip.dur - 1)).aAlpha;
    else if (def.window === "both") alpha2 = fadeDipWeights(lt2).bAlpha * fadeDipWeights(lt2 - (def.clip.dur - 1)).aAlpha;
    const arg2 = { ...arg, sourceT: Math.round(lt2 * 30) / 30, alpha: alpha2 };
    try {
      const m2 = await cdp.evaluate(`(${pageFn.toString()})(${JSON.stringify(arg2)})`, 90000);
      if (!m2.error) { m = m2; playhead = ph2; localT = lt2; p = p2; alpha = alpha2; if (def.window === "both") { pIn = lt2; pOut = lt2 - (def.clip.dur - 1); } }
    } catch {}
    if (isBg(m.appMean) && expFarFromBg) { measurementInvalid = true; log(`  guard khung tối ${def.id}: sau retry vẫn tối -> measurementInvalid`); }
  }
  const verdict = verdictFor(m.mad, m.le8);
  const verdictR = m.madResampled !== null && m.madResampled !== undefined ? verdictFor(m.madResampled, m.le8Resampled) : null;
  const rec = { ...def, target: def.target, playhead, localT, p, pIn, pOut, alpha, mode,
    mad: m.mad, le8: m.le8, maxDiff: m.maxDiff, verdict, uncertain,
    retried, measurementInvalid,
    madResampled: m.madResampled ?? null, le8Resampled: m.le8Resampled ?? null,
    maxDiffResampled: m.maxDiffResampled ?? null, verdictResampled: verdictR,
    madIn: m.madIn ?? null, le8In: m.le8In ?? null, madOut: m.madOut ?? null, le8Out: m.le8Out ?? null,
    nIn: m.nIn ?? null, nOut: m.nOut ?? null, nSkip: m.nSkip ?? null,
    appMeanOut: m.appMeanOut ?? null, appMeanIn: m.appMeanIn ?? null, expMeanIn: m.expMeanIn ?? null,
    handleDeltaFrames: scr.handleDeltaFrames, handleRaw: scr.handleRaw,
    nSamples: m.n, canvasW: m.canvasW, canvasH: m.canvasH, scale: m.scale,
    appMean: m.appMean ?? null, expMean: m.expMean ?? null, ctlMean: m.ctlMean ?? null,
    ctlTimes: m.ctlTimes ?? null, motionMean: m.motionMean ?? null,
    le8LowMotion: m.le8LowMotion ?? null, nLowMotion: m.nLowMotion ?? null,
    controlVideo: m.controlVideo, settled: scr.settled, gating: opts.gating !== false };
  const detail = `playhead ${playhead} p=${p !== null ? p.toFixed(4) : "-"}${pIn !== null ? ` pIn=${pIn.toFixed(4)} pOut=${pOut.toFixed(4)}` : ""} alpha=${alpha.toFixed(4)} MAD=${m.mad.toFixed(3)} <=8=${(m.le8 * 100).toFixed(2)}%${m.madIn !== undefined && m.madIn !== null ? ` (in MAD=${m.madIn.toFixed(3)} <=8=${(m.le8In * 100).toFixed(2)}% n=${m.nIn}; out MAD=${m.madOut.toFixed(3)} <=8=${(m.le8Out * 100).toFixed(2)}% n=${m.nOut}; appMeanOut=[${m.appMeanOut.map((v) => v.toFixed(1)).join(",")}])` : ""} appMean=[${(m.appMean || []).map((v) => v.toFixed(1)).join(",")}] expMean=[${(m.expMean || m.expMeanIn || []).map((v) => v.toFixed(1)).join(",")}] resampled: MAD=${m.madResampled !== null && m.madResampled !== undefined ? m.madResampled.toFixed(3) : "-"} (${verdictR})${uncertain ? ` (CỜ: vạch lệch ${scr.handleDeltaFrames} frame)` : ""}`;
  if (opts.gating === false) { RESULTS.push({ id: def.id, status: `INFO-${verdict}`, detail }); log(`  INFO ${def.id} [${verdict}]: ${detail}`); }
  else if (verdict === "KHỚP") casePass(def.id, detail);
  else caseFail(def.id, detail);
  return rec;
}

function blurCaseDefs() {
  return [
    { id: "BLUR-REAL-K19-FW-IN-p05", clip: { start: 0, dur: 4, file: "clip-k-trim19.mp4" }, window: "in", type: "fadewhite", target: 0.5, blur: true },
    { id: "BLUR-REAL-K11-FW-IN-p05", clip: { start: 4, dur: 4, file: "clip-k-trim11.mp4" }, window: "in", type: "fadewhite", target: 4.5, blur: true },
    { id: "BLUR-SYNTH-FW-IN-p05", clip: { start: 8, dur: 4, file: "complex-synth.mp4" }, window: "in", type: "fadewhite", target: 8.5, blur: true },
  ];
}
// ------------------------------------------------------------- main ------
/** Trích verbatim singleClipDipPixel từ transitionPreview.ts qua tsc. */
function extractSingleClipDip() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-m6-ts-"));
  const stubDir = path.join(tmp, "node_modules", "@repo-1", "video-spec");
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(path.join(stubDir, "package.json"), JSON.stringify({ name: "@repo-1/video-spec", version: "0.0.0", main: "index.js" }));
  fs.writeFileSync(path.join(stubDir, "index.js"), "module.exports = {};\n");
  const src = path.join(ROOT, "apps", "web", "src", "lib", "transitionPreview.ts");
  const outDir = path.join(tmp, "out");
  const r = spawnSync(path.join(ROOT, "node_modules", ".bin", "tsc"), [src, "--outDir", outDir, "--module", "commonjs", "--target", "es2020", "--moduleResolution", "node", "--skipLibCheck"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("tsc trích singleClipDipPixel thất bại: " + ((r.stdout || "") + (r.stderr || "")).slice(0, 400));
  const js = fs.readFileSync(path.join(outDir, "transitionPreview.js"), "utf8");
  const start = js.indexOf("function singleClipDipPixel");
  if (start < 0) throw new Error("không thấy singleClipDipPixel trong bản transpile");
  let depth = 0;
  let i = js.indexOf("{", start);
  for (; i < js.length; i++) {
    if (js[i] === "{") depth++;
    else if (js[i] === "}") { depth--; if (depth === 0) break; }
  }
  const fnSrc = js.slice(start, i + 1);
  if (!fnSrc.includes("clipRgb[0] + clipRgb[1] + clipRgb[2]") || !fnSrc.includes("255")) throw new Error("bản trích singleClipDipPixel thiếu nội dung kỳ vọng");
  return fnSrc;
}

async function main() {
  const OUT = process.env.M6_OUT || "v30-m6-blur-browser.json";
  log(`harness clicktest-dip-blur-complex-round30-m6: bắt đầu (label=${RUN_LABEL}, display=${DISPLAY}, port=${PORT})`);
  let xvfb = null, server = null, exitCode = 2;
  const caseRecords = [];
  let pureLoop = null;
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    const vidDir = genComplexVideos();
    if (!vidDir) { log("BLOCKER: tạo video blur thất bại"); return 2; }
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) { log("BLOCKER: dist snapshot thất bại"); return 2; }
    for (const f of fs.readdirSync(vidDir).filter((x) => x.endsWith(".mp4"))) {
      fs.copyFileSync(path.join(vidDir, f), path.join(snap.dir, f));
    }
    log("video blur đã copy vào snapshot");
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }
    const holder = {};
    const cdp = await startChrome(holder);
    if (!cdp) { log("BLOCKER: không binary nào mở được pipe"); return 2; }
    try {
      await loadSession(cdp, seedBlur(1080, 1920), "M6 blur footage thật seed");
      const names = ["clip-k-trim19.mp4", "clip-k-trim11.mp4", "complex-synth.mp4"];
      await importMedia(cdp, names.map((n) => path.join(vidDir, n)), names);
      await calibrateHandle(cdp);
      const ruler = await getRuler(cdp);
      if (!ruler) throw new Error("không thấy .tl-ruler");
      if (ruler.y < 0 || ruler.y + ruler.h > ruler.innerH) throw new Error(`ruler ngoài viewport: ${JSON.stringify(ruler)}`);
      log(`ruler rect: ${JSON.stringify(ruler)}`);
      for (const def of blurCaseDefs()) {
        try { caseRecords.push(await runCase(cdp, ruler, def, { W: 1080, H: 1920, step: 8, gating: false })); }
        catch (e) { caseFail(def.id, `lỗi chạy case: ${e.message}`); caseRecords.push({ ...def, status: "FAIL", error: e.message }); }
      }
      try {
        const fnSrc = extractSingleClipDip();
        log(`singleClipDipPixel trích verbatim: ${fnSrc.length} ký tự`);
        pureLoop = await cdp.evaluate(`(${pagePureDip.toString()})(${JSON.stringify({ fnSrc, sizes: [{ name: "1080p", W: 1080, H: 1920 }, { name: "4K", W: 2160, H: 3840 }] })})`, 300000);
        for (const r of pureLoop.results) log(`  pure-loop browser ${r.size} mode=${r.mode}: get=${r.getMs.toFixed(1)}ms loop=${r.loopMs.toFixed(1)}ms put=${r.putMs.toFixed(1)}ms (median, reps ${r.reps})`);
      } catch (e) { log(`pure-loop browser lỗi: ${e.message}`); pureLoop = { error: e.message }; }
      const failed = caseRecords.filter((r) => r.status === "FAIL");
      const exc = cdp.exceptions.length;
      log(`exceptions trong phiên: ${exc}${exc ? ` (đầu: ${JSON.stringify(cdp.exceptions[0]).slice(0, 300)})` : ""}`);
      exitCode = failed.length === 0 ? 0 : 1;
      log(`DONE m6-blur-browser: ${caseRecords.length} case blur INFO, ${failed.length} FAIL, exit=${exitCode}`);
      const outJson = { run: RUN_LABEL, date: new Date().toISOString(), bundle: snap.bundle, bundleSha256_16: snap.sha, display: DISPLAY, port: PORT, origin: ORIGIN, cases: caseRecords, pureLoop, exceptions: cdp.exceptions, log: logLines };
      const outPath = path.join(ROOT, "benchmarks", "results", OUT);
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
