#!/usr/bin/env node
// Probe S3 đợt 36 — đo fps chiều ngược của proxy Q8 so với đường element
// cũ và đường WebCodecs opt-in (CHỈ ĐO; KHÔNG sửa code sản phẩm, KHÔNG
// nối Q3 vào preview, KHÔNG push).
//
// Luồng chạy:
//  1. Biên dịch mp4Demux.ts + reverseWebcodecs.ts hiện tại của repo bằng
//     esbuild ra scratch (ghi sha256 nguồn + đích).
//  2. Symlink fixture gốc + proxy Q8 đã tạo bằng đúng code generateProxy
//     (server/render/src/proxy.js, height 480) vào scratch; serve scratch
//     bằng HTTP có hỗ trợ Range (bắt buộc để <video> seek được).
//  3. Chrome headed qua pipe CDP + Xvfb riêng (mặc định :99, port 4299).
//     Mỗi lượt đo ghi nhãn tải TRƯỚC lượt (load1 + số Chrome ngoài cây
//     probe + tiến trình nặng khác). QUIET khi và chỉ khi load1 < 2,0
//     (ngưỡng Q6, máy 4 vCPU) VÀ 0 Chrome ngoài cây probe VÀ 0 tiến trình
//     nặng khác — cùng tiêu chí R4 đợt 35. Thiếu quiet là kết quả,
//     script vẫn exit 0.
//  4. Ghi JSON ra scratch + benchmarks/results/v36-s3-proxy-reverse.json.
// Chạy: node apps/web/scripts/probe-round36-s3-proxy-reverse-pipe.mjs
import { spawn, spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const SCRATCH = process.env.S3_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round36-s3", "wc");
const DISPLAY = process.env.S3_DISPLAY || ":99";
const PORT = Number(process.env.S3_PORT || 4299);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FLAT_SRC = process.env.S3_FLAT_SRC || path.join(os.homedir(), "workspace", "tmp-round27-k4", "sparse-gop-flat.mp4");
const NOISE_SRC = process.env.S3_NOISE_SRC || path.join(os.homedir(), "workspace", "tmp-round34-q3", "wc", "noise-30s.mp4");
const NOISE_PROXY_SRC = process.env.S3_NOISE_PROXY_SRC || path.join(SCRATCH, "noise-30s__proxy_480p.mp4");
const FLAT_PROXY_SRC = path.join(SCRATCH, "sparse-gop-flat__proxy_480p.mp4");
// Tên key/served của fixture proxy nhiễu tham số hoá bằng env để case
// 1080p (proxy 720p) tái dùng đúng pipe này mà không đổi tên gây nhầm:
// mặc định là case 720p -> 480p; case 1080p đặt S3_NOISE_PROXY_KEY,
// S3_NOISE_PROXY_SERVED, S3_NOISE_PROXY_CELL tương ứng. Độ phân giải
// thật luôn lấy từ demux trong JSON, không tin tên cell.
const NPK = process.env.S3_NOISE_PROXY_KEY || "noiseProxy480";
const NPS = process.env.S3_NOISE_PROXY_SERVED || "noise-proxy480.mp4";
const NPCELL = process.env.S3_NOISE_PROXY_CELL || "noise-proxy480";
const QUIET_LOAD1 = 2.0;
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.S3_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log(`[${stamp()}]`, ...a); }
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

function sha256File(file) {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(1024 * 1024);
  let n;
  do { n = fs.readSync(fd, buf, 0, buf.length, null); if (n > 0) h.update(buf.subarray(0, n)); } while (n > 0);
  fs.closeSync(fd);
  return h.digest("hex");
}

// HTTP server có hỗ trợ Range (video element bắt buộc để seek).
function serveDir(dir) {
  return http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(dir, url === "/" ? "index.html" : url.replace(/^\//, ""));
    if (!file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    const stat = fs.statSync(file);
    if (!stat.isFile()) { res.writeHead(404); res.end("not found"); return; }
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "application/javascript" : "application/octet-stream";
    const range = req.headers.range;
    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      if (m) {
        const start = m[1] ? Number(m[1]) : 0;
        const end = m[2] ? Number(m[2]) : stat.size - 1;
        if (start >= stat.size || end >= stat.size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); res.end(); return; }
        res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
    }
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": stat.size });
    fs.createReadStream(file).pipe(res);
  });
}

function snapshotLoad(chromePid) {
  const out = { loadavg: os.loadavg(), at: stamp(), chromeTotal: 0, chromeOwnTree: 0, chromeOther: 0, heavyOther: [], memAvailableMB: null, error: null };
  try {
    const mem = fs.readFileSync("/proc/meminfo", "utf8");
    const m = mem.match(/MemAvailable:\s+(\d+)\s+kB/);
    if (m) out.memAvailableMB = Math.round(Number(m[1]) / 1024);
  } catch {}
  try {
    const ps = spawnSync("ps", ["-eo", "pid,ppid,args"], { encoding: "utf8" }).stdout || "";
    const rows = [];
    for (const line of ps.split("\n").slice(1)) {
      const mm = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
      if (mm) rows.push({ pid: Number(mm[1]), ppid: Number(mm[2]), args: mm[3] });
    }
    const children = new Map();
    for (const r of rows) { if (!children.has(r.ppid)) children.set(r.ppid, []); children.get(r.ppid).push(r); }
    const own = new Set(); const stack = [chromePid];
    while (stack.length) {
      const pid = stack.pop(); if (own.has(pid)) continue; own.add(pid);
      for (const c of children.get(pid) || []) stack.push(c.pid);
    }
    const isChrome = (a) => a.includes("chrome-linux64/chrome") || a.includes("/opt/meta-chromium/chrome");
    const chromeRows = rows.filter((r) => isChrome(r.args));
    out.chromeTotal = chromeRows.length;
    out.chromeOwnTree = chromeRows.filter((r) => own.has(r.pid)).length;
    out.chromeOther = chromeRows.filter((r) => !own.has(r.pid)).length;
    for (const r of rows) {
      if (r.pid === process.pid || own.has(r.pid)) continue;
      if (/(^|\/)(ffmpeg|vite|tsc|esbuild)(\s|$)/.test(r.args) || (r.args.includes("probe-round") && !r.args.includes("probe-round36-s3") && r.args.includes("node"))) {
        out.heavyOther.push(`${r.pid}:${r.args.slice(0, 120)}`);
      }
    }
  } catch (e) { out.error = String(e.message); }
  return out;
}

function labelLoad(snap) {
  const reasons = [];
  if (snap.loadavg[0] >= QUIET_LOAD1) reasons.push(`load1 ${snap.loadavg[0].toFixed(2)} >= ${QUIET_LOAD1}`);
  if (snap.chromeOther > 0) reasons.push(`${snap.chromeOther} Chrome ngoài cây probe`);
  if (snap.heavyOther.length > 0) reasons.push(`${snap.heavyOther.length} tiến trình nặng khác`);
  if (snap.error) reasons.push(`lỗi snapshot: ${snap.error}`);
  return { loadLabel: reasons.length === 0 ? "quiet" : "under-load", labelReasons: reasons };
}

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessions = []; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessions.push(msg.params.sessionId);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id); this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) { try { proc.stdio[s]?.on("error", () => {}); } catch {} }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 60000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); } catch (e) { this.pending.delete(id); clearTimeout(timer); reject(e); }
    });
  }
  async evaluate(expr, sessionId, timeoutMs = 120000) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId, timeoutMs);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
  async attachNewPage(url) {
    const before = this.sessions.length;
    const target = await this.send("Target.createTarget", { url: "about:blank" });
    await this.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    for (let i = 0; i < 50 && this.sessions.length <= before; i++) await sleep(100);
    const sid = this.sessions[this.sessions.length - 1];
    if (!sid) throw new Error("không nhận được sessionId");
    await this.send("Page.enable", {}, sid);
    await this.send("Runtime.enable", {}, sid);
    if (url && url !== "about:blank") await this.send("Page.navigate", { url }, sid);
    return { targetId: target.targetId, sessionId: sid };
  }
}

async function main() {
  const result = {
    session: { startedAt: stamp(), repo: REPO, scratch: SCRATCH, display: DISPLAY, port: PORT, quietLoad1Threshold: QUIET_LOAD1, nproc: os.cpus().length, memTotalMB: Math.round(os.totalmem() / 1048576) },
    fixtures: {}, build: {}, support: {}, runs: [], errors: [],
  };
  if (!fs.existsSync(ESBUILD)) fail(`không tìm thấy esbuild: ${ESBUILD}`);
  for (const f of [FLAT_SRC, NOISE_SRC, NOISE_PROXY_SRC, FLAT_PROXY_SRC]) if (!fs.existsSync(f)) fail(`thiếu fixture: ${f}`);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const mp4Src = path.join(REPO, "apps/web/src/lib/mp4Demux.ts");
  const revSrc = path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts");
  const pageSrc = path.join(HERE, "probe-round36-s3-proxy-reverse-page.js");
  for (const f of [mp4Src, revSrc, pageSrc]) if (!fs.existsSync(f)) fail(`thiếu nguồn: ${f}`);
  const mp4Out = path.join(SCRATCH, "mp4Demux.js");
  const revOut = path.join(SCRATCH, "reverseWebcodecs.js");
  const pageOut = path.join(SCRATCH, "page.js");
  execSync(`"${ESBUILD}" "${mp4Src}" --format=esm --target=es2022 --outfile="${mp4Out}"`, { stdio: "pipe" });
  execSync(`"${ESBUILD}" "${revSrc}" --format=esm --target=es2022 --outfile="${revOut}"`, { stdio: "pipe" });
  fs.copyFileSync(pageSrc, pageOut);
  let revJs = fs.readFileSync(revOut, "utf8");
  const before = revJs.includes('"./mp4Demux"');
  revJs = revJs.replaceAll('"./mp4Demux"', '"./mp4Demux.js"');
  writeFileEpermRetry(revOut, revJs);
  result.build = { mp4DemuxTsSha256: sha256File(mp4Src), reverseWebcodecsTsSha256: sha256File(revSrc), mp4DemuxJsSha256: sha256File(mp4Out), reverseWebcodecsJsSha256: sha256File(revOut), importSpecifierRewritten: before };
  // Fixture gốc symlink vào scratch (không copy file 210MB); proxy đã nằm
  // sẵn trong scratch (tạo bằng generateProxy Q8 thật).
  const FIX = [
    ["noiseOrig", NOISE_SRC, "noise-orig.mp4"],
    ["flatOrig", FLAT_SRC, "flat-orig.mp4"],
    [NPK, NOISE_PROXY_SRC, NPS],
    ["flatProxy480", FLAT_PROXY_SRC, "flat-proxy480.mp4"],
  ];
  for (const [key, src, name] of FIX) {
    const link = path.join(SCRATCH, name);
    try { fs.unlinkSync(link); } catch {}
    // Luôn tạo symlink theo tên phục vụ (kể cả proxy đã nằm trong
    // scratch nhưng khác tên file: link trỏ tới file proxy thật).
    if (fs.realpathSync(src) !== link) fs.symlinkSync(src, link);
    result.fixtures[key] = { servedAs: name, srcRealpath: fs.realpathSync(src), bytes: fs.statSync(src).size };
  }
  writeFileEpermRetry(path.join(SCRATCH, "index.html"), `<!doctype html><meta charset="utf-8"><title>s3 proxy reverse probe</title><body>probe</body><script type="module" src="/page.js"></script>`);
  const server = serveDir(SCRATCH);
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  log(`phục vụ probe tại ${ORIGIN}, scratch ${SCRATCH}`);
  const num = DISPLAY.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  let xvfb = null;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
    if (!alive) {
      log(`Xvfb: socket ${DISPLAY} mồ côi, xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch {}
      try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
    } else log(`Xvfb: dùng chung display ${DISPLAY}`);
  }
  if (!fs.existsSync(sock)) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    if (!fs.existsSync(sock)) fail(`Xvfb không tạo socket ${DISPLAY}`);
  }
  const profile = path.join(SCRATCH, "chrome-profile");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeBin = BINARIES.find((b) => fs.existsSync(b));
  if (!chromeBin) fail(`không tìm thấy chrome: ${BINARIES.join(", ")}`);
  log(`chrome: ${chromeBin} (display ${DISPLAY})`);
  const chrome = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
  chrome.stdout?.on("data", () => {}); chrome.stderr?.on("data", () => {});
  const cdp = new PipeCdp(chrome);
  const cleanup = () => { try { chrome.kill("SIGKILL"); } catch {} try { xvfb?.kill("SIGKILL"); } catch {} server.close(); };
  process.on("exit", cleanup);
  const outJson = path.join(REPO, "benchmarks/results", process.env.S3_OUT || "v36-s3-proxy-reverse.json");
  const SKIP_WC = process.env.S3_SKIP_WC === "1";
  const SKIP_ELEMENT = process.env.S3_SKIP_ELEMENT === "1";
  const ELEMENT_ATTEMPT = Number(process.env.S3_ELEMENT_ATTEMPT || 1);
  const save = () => { result.session.finishedAt = stamp(); writeFileEpermRetry(outJson, JSON.stringify(result, null, 2)); writeFileEpermRetry(path.join(SCRATCH, "s3-proxy-reverse.json"), JSON.stringify(result, null, 2)); };
  try {
    const version = await cdp.send("Browser.getVersion", {}, undefined, 30000);
    result.session.chrome = { product: version.product, userAgent: version.userAgent };
    result.session.devDriExists = fs.existsSync("/dev/dri");
    const probe = await cdp.attachNewPage(ORIGIN + "/");
    for (let i = 0; i < 100; i++) {
      const ready = await cdp.evaluate(`!!window.__s3Ready`, probe.sessionId, 30000).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    const ready = await cdp.evaluate(`!!window.__s3Ready`, probe.sessionId, 30000);
    if (!ready) fail("trang probe không ready");
    let seq = 0;
    async function runOp(cmd, timeoutMs = 600000) {
      seq += 1;
      const full = { seq, ...cmd };
      await cdp.evaluate(`window.__s3Cmd = ${JSON.stringify(full)}`, probe.sessionId, 30000);
      const t0 = Date.now();
      for (;;) {
        const res = await cdp.evaluate(`window.__s3Result || null`, probe.sessionId, 30000).catch(() => null);
        if (res && res.seq === seq) return res;
        if (Date.now() - t0 > timeoutMs) throw new Error(`timeout op ${cmd.op} sau ${timeoutMs}ms`);
        await sleep(500);
      }
    }
    // Load + support từng fixture (ghi rõ codec/keys từ demux thật).
    const LOADURL = {}; for (const [k, , nm] of FIX) LOADURL[k] = "/" + nm;
    for (const [key, ,] of FIX) {
      const loaded = await runOp({ op: "load", key, url: LOADURL[key] }, 300000);
      if (loaded.error) { result.errors.push(`load ${key}: ${loaded.error}`); continue; }
      result.fixtures[key] = { ...result.fixtures[key], width: loaded.width, height: loaded.height, codec: loaded.codec, sampleCount: loaded.sampleCount, keyIndices: loaded.keyIndices, cttsDetected: loaded.cttsDetected };
      const sup = await runOp({ op: "supportCodec", codec: loaded.codec, width: loaded.width, height: loaded.height }, 60000);
      result.fixtures[key].codecSupport = sup;
      log(`load ${key}: ${loaded.width}x${loaded.height} ${loaded.codec} samples=${loaded.sampleCount} keys=${loaded.keyIndices.length} ctts=${loaded.cttsDetected} hw=${JSON.stringify(sup["prefer-hardware"])}`);
    }
    // Ma trận đo. Mỗi lượt có nhãn tải riêng ghi TRƯỚC lượt.
    // WC decode: 1 GOP đầy đủ mỗi file, lấy từ keyIndices do demux thật
    // trả về (thứ tự decode — KHÔNG dùng số suy từ ffprobe vì proxy có
    // B-frame nên presentation order ≠ decode order): chọn GOP đầu tiên
    // (không tính GOP đầu file) có độ dài 150–300 frame, nếu không có
    // thì lấy GOP đầu tiên.
    function pickGop(keys, total) {
      for (let i = 1; i < keys.length; i++) {
        const end = (i + 1 < keys.length ? keys[i + 1] : total) - 1;
        if (end - keys[i] + 1 >= 150 && end - keys[i] + 1 <= 300) return [keys[i], end];
      }
      const end0 = (keys.length > 1 ? keys[1] : total) - 1;
      return [keys[0], end0];
    }
    const WC = [];
    for (const [cell, key] of [["wc-noise-orig", "noiseOrig"], [`wc-${NPCELL}`, NPK], ["wc-flat-orig", "flatOrig"], ["wc-flat-proxy480", "flatProxy480"]]) {
      const fx = result.fixtures[key];
      if (!fx || !fx.keyIndices) { result.errors.push(`không có keyIndices cho ${key}, bỏ qua ${cell}`); continue; }
      const [from, to] = pickGop(fx.keyIndices, fx.sampleCount);
      WC.push({ cell, key, from, to });
      log(`${cell}: GOP demux [${from}, ${to}] (${to - from + 1} frame) từ keys ${JSON.stringify(fx.keyIndices)}`);
    }
    for (const w of WC) {
      if (SKIP_WC) break;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const snap = snapshotLoad(chrome.pid);
        const label = labelLoad(snap);
        const r = await runOp({ op: "wcdecode", key: w.key, from: w.from, to: w.to }, 600000);
        result.runs.push({ kind: "webcodecs-decode", ...w, attempt, loadBefore: snap, ...label, ...r });
        log(`${w.cell} #${attempt}: ${label.loadLabel} decoded=${r.decoded}/${r.requested} fps=${r.decodeFps} presentFps=${r.presentFps} ${r.error ? "ERROR " + r.error.slice(0, 200) : ""}`);
        if (r.error) break;
      }
    }
    // Element reverse: cửa sổ 90 frame, mỗi file vượt đúng 1 keyframe
    // (xem keyIndices): orig-noise 349→260 (vượt key 300), proxy-noise
    // 480→391 (vượt key 432), orig-flat 349→260 (vượt key 300),
    // proxy-flat 540→451 (vượt key 500). Cap 180s/lượt; hết cap vẫn là
    // kết quả (báo drawn/wall tới đó).
    const EL = [
      { cell: "element-noise-orig", key: "noiseOrig", url: "/noise-orig.mp4", startFrame: 349, endFrame: 260 },
      { cell: `element-${NPCELL}`, key: NPK, url: "/" + NPS, startFrame: 480, endFrame: 391 },
      { cell: "element-flat-orig", key: "flatOrig", url: "/flat-orig.mp4", startFrame: 349, endFrame: 260 },
      { cell: "element-flat-proxy480", key: "flatProxy480", url: "/flat-proxy480.mp4", startFrame: 540, endFrame: 451 },
    ];
    for (const e of EL) {
      if (SKIP_ELEMENT) break;
      const snap = snapshotLoad(chrome.pid);
      const label = labelLoad(snap);
      const r = await runOp({ op: "elementReverse", url: e.url, fps: 30, startFrame: e.startFrame, endFrame: e.endFrame, capMs: 180000 }, 400000);
      // draws là mảng lớn — giữ lại nhưng tóm tắt thêm để JSON đọc được.
      const draws = r.draws || [];
      result.runs.push({ kind: "element-reverse", attempt: ELEMENT_ATTEMPT, ...e, loadBefore: snap, ...label, ...r, drawsSummary: draws.length ? { first: draws[0], last: draws[draws.length - 1], count: draws.length } : null });
      log(`${e.cell}: ${label.loadLabel} drawn=${r.drawn}/90 seeks=${r.seeksIssued} wall=${r.wallSec}s displayedFps=${r.displayedFps} hitCap=${r.hitCap} medianLag=${r.medianLagFrames} ${r.error ? "ERROR " + r.error.slice(0, 200) : ""}`);
    }
    result.support.done = await runOp({ op: "done" }, 60000);
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
    log(`LỖI PHIÊN: ${String(e && e.message || e)}`);
  } finally {
    save();
    cleanup();
    log(`đã ghi ${outJson}`);
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(2); });
