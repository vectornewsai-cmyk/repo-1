#!/usr/bin/env node
// Probe T6 đợt 37 — 4K nguồn → proxy 720p + xác minh ctts/present-order
// cho proxy có B-frame + đường blob: (mô phỏng item asset: sau rehydrate).
// CHỈ ĐO; KHÔNG nối Q3 vào preview, KHÔNG push, KHÔNG binary vào repo.
// Mẫu: pipe S3 đợt 36 (PipeCdp + snapshot tải + serve Range), viết lại
// cho op mới của trang T6; không sửa file S3.
//
// Chạy: node apps/web/scripts/probe-round37-t6-proxy4k-ctts-pipe.mjs
// Env: T6_SCRATCH, T6_PORT (mặc định 4297), T6_DISPLAY (mặc định :99),
//   T6_OUT (mặc định v37-t6-proxy4k-ctts.json), T6_SRC4K, T6_PROXY720,
//   T6_SKIP_SRC4K=1 (bỏ lượt decode nguồn 4K nặng).
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
const SCRATCH = process.env.T6_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round37-t6", "wc");
const DISPLAY = process.env.T6_DISPLAY || ":99";
const PORT = Number(process.env.T6_PORT || 4297);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SRC4K = process.env.T6_SRC4K || path.join(os.homedir(), "workspace", "tmp-round37-t6", "noise-4k-6s.mp4");
const PROXY720 = process.env.T6_PROXY720 || path.join(os.homedir(), "workspace", "tmp-round37-t6", "noise-4k-6s__proxy_720p.mp4");
const QUIET_LOAD1 = 2.0;
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.T6_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
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
      if (/(^|\/)(ffmpeg|vite|tsc|esbuild)(\s|$)/.test(r.args) || (r.args.includes("probe-round") && r.args.includes("node"))) {
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

// Chọn 1 GOP để decode: ưu tiên GOP (không phải GOP đầu file) dài >= 30
// frame VÀ có reorder present trong GOP (chứng minh B-frame ở đúng GOP
// đo); nếu không có thì GOP dài nhất (không tính GOP đầu file nếu có
// GOP khác). Trả {from, to, reason}.
function pickGop(keys, total, pts) {
  const gops = [];
  for (let i = 0; i < keys.length; i++) {
    const from = keys[i];
    const to = (i + 1 < keys.length ? keys[i + 1] : total) - 1;
    let decreases = 0;
    for (let j = from; j < to; j++) if (pts[j + 1] < pts[j]) decreases++;
    gops.push({ from, to, len: to - from + 1, decreases });
  }
  const nonFirst = gops.slice(1);
  const withReorder = nonFirst.filter((g) => g.len >= 30 && g.decreases > 0);
  if (withReorder.length) return { ...withReorder[0], reason: "non-first GOP >=30 frames with in-GOP present reorder" };
  const longNonFirst = nonFirst.filter((g) => g.len >= 30);
  if (longNonFirst.length) return { ...longNonFirst[0], reason: "non-first GOP >=30 frames, no in-GOP reorder (fallback)" };
  const sorted = [...gops].sort((a, b) => b.len - a.len);
  return { ...sorted[0], reason: "longest GOP (fallback)" };
}

async function main() {
  const result = {
    session: { startedAt: stamp(), repo: REPO, scratch: SCRATCH, display: DISPLAY, port: PORT, quietLoad1Threshold: QUIET_LOAD1, nproc: os.cpus().length, memTotalMB: Math.round(os.totalmem() / 1048576) },
    fixtures: {}, build: {}, support: {}, runs: [], errors: [],
  };
  if (!fs.existsSync(ESBUILD)) fail(`không tìm thấy esbuild: ${ESBUILD}`);
  for (const f of [SRC4K, PROXY720]) if (!fs.existsSync(f)) fail(`thiếu fixture: ${f}`);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const mp4Src = path.join(REPO, "apps/web/src/lib/mp4Demux.ts");
  const revSrc = path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts");
  const gateSrc = path.join(REPO, "apps/web/src/lib/reversePreviewGate.ts");
  const aheadSrc = path.join(REPO, "apps/web/src/lib/reverseDecodeAhead.ts");
  const pageSrc = path.join(HERE, "probe-round37-t6-proxy4k-ctts-page.js");
  for (const f of [mp4Src, revSrc, gateSrc, aheadSrc, pageSrc]) if (!fs.existsSync(f)) fail(`thiếu nguồn: ${f}`);
  const mp4Out = path.join(SCRATCH, "mp4Demux.js");
  const revOut = path.join(SCRATCH, "reverseWebcodecs.js");
  const gateOut = path.join(SCRATCH, "reversePreviewGate.js");
  const aheadOut = path.join(SCRATCH, "reverseDecodeAhead.js");
  const pageOut = path.join(SCRATCH, "page.js");
  execSync(`"${ESBUILD}" "${mp4Src}" --format=esm --target=es2022 --outfile="${mp4Out}"`, { stdio: "pipe" });
  execSync(`"${ESBUILD}" "${revSrc}" --format=esm --target=es2022 --outfile="${revOut}"`, { stdio: "pipe" });
  // Đợt 37 (giữa lượt đo của luồng này): reverseWebcodecs.ts được luồng
  // khác nối thêm import reversePreviewGate + reverseDecodeAhead (file
  // đổi lúc 07:20:55Z, sau lượt chính). KHÔNG sửa file của luồng khác:
  // chỉ bundle thêm 2 dep này vào scratch để module page load được,
  // và ghi sha của cả 3 nguồn vào JSON để biết bundle đo là bản nào.
  execSync(`"${ESBUILD}" "${gateSrc}" --format=esm --target=es2022 --outfile="${gateOut}"`, { stdio: "pipe" });
  execSync(`"${ESBUILD}" "${aheadSrc}" --format=esm --target=es2022 --outfile="${aheadOut}"`, { stdio: "pipe" });
  fs.copyFileSync(pageSrc, pageOut);
  let revJs = fs.readFileSync(revOut, "utf8");
  const before = revJs.includes('"./mp4Demux"');
  revJs = revJs.replaceAll('"./mp4Demux"', '"./mp4Demux.js"')
    .replaceAll('"./reversePreviewGate"', '"./reversePreviewGate.js"')
    .replaceAll('"./reverseDecodeAhead"', '"./reverseDecodeAhead.js"');
  writeFileEpermRetry(revOut, revJs);
  // Kiểm tra cứng: bundle trong scratch không còn import trần nào trỏ
  // tới file không có trong scratch (lỗi đã làm chết 3 lượt reorder).
  for (const f of [mp4Out, revOut, gateOut, aheadOut]) {
    const js = fs.readFileSync(f, "utf8");
    const bare = [...js.matchAll(/from\s+["'](\.[^"']+)["']/g)].map((m) => m[1])
      .filter((s) => !fs.existsSync(path.join(SCRATCH, s)));
    if (bare.length) fail(`bundle ${path.basename(f)} còn import trần thiếu trong scratch: ${bare.join(", ")}`);
  }
  result.build = { mp4DemuxTsSha256: sha256File(mp4Src), reverseWebcodecsTsSha256: sha256File(revSrc), reversePreviewGateTsSha256: sha256File(gateSrc), reverseDecodeAheadTsSha256: sha256File(aheadSrc), mp4DemuxJsSha256: sha256File(mp4Out), reverseWebcodecsJsSha256: sha256File(revOut), importSpecifierRewritten: before };
  const FIX = [
    ["src4k", SRC4K, "src4k.mp4"],
    ["proxy720", PROXY720, "proxy720.mp4"],
  ];
  for (const [key, src, name] of FIX) {
    const link = path.join(SCRATCH, name);
    try { fs.unlinkSync(link); } catch {}
    if (fs.realpathSync(src) !== link) fs.symlinkSync(src, link);
    result.fixtures[key] = { servedAs: name, srcRealpath: fs.realpathSync(src), bytes: fs.statSync(src).size };
  }
  writeFileEpermRetry(path.join(SCRATCH, "index.html"), `<!doctype html><meta charset="utf-8"><title>t6 proxy4k ctts probe</title><body>probe</body><script type="module" src="/page.js"></script>`);
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
  const outJson = path.join(REPO, "benchmarks/results", process.env.T6_OUT || "v37-t6-proxy4k-ctts.json");
  const save = () => { result.session.finishedAt = stamp(); writeFileEpermRetry(outJson, JSON.stringify(result, null, 2)); writeFileEpermRetry(path.join(SCRATCH, "t6-proxy4k-ctts.json"), JSON.stringify(result, null, 2)); };
  try {
    const version = await cdp.send("Browser.getVersion", {}, undefined, 30000);
    result.session.chrome = { product: version.product, userAgent: version.userAgent };
    result.session.devDriExists = fs.existsSync("/dev/dri");
    const probe = await cdp.attachNewPage(ORIGIN + "/");
    for (let i = 0; i < 100; i++) {
      const ready = await cdp.evaluate(`!!window.__t6Ready`, probe.sessionId, 30000).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    const ready = await cdp.evaluate(`!!window.__t6Ready`, probe.sessionId, 30000);
    if (!ready) fail("trang probe không ready");
    let seq = 0;
    async function runOp(cmd, timeoutMs = 600000) {
      seq += 1;
      const full = { seq, ...cmd };
      await cdp.evaluate(`window.__t6Cmd = ${JSON.stringify(full)}`, probe.sessionId, 30000);
      const t0 = Date.now();
      for (;;) {
        const res = await cdp.evaluate(`window.__t6Result || null`, probe.sessionId, 30000).catch(() => null);
        if (res && res.seq === seq) return res;
        if (Date.now() - t0 > timeoutMs) throw new Error(`timeout op ${cmd.op} sau ${timeoutMs}ms`);
        await sleep(500);
      }
    }
    const loaded = {};
    for (const [key, , name] of FIX) {
      const r = await runOp({ op: "load", key, url: "/" + name }, 300000);
      if (r.error) { result.errors.push(`load ${key}: ${r.error}`); continue; }
      loaded[key] = r;
      const c = r.ctts;
      result.fixtures[key] = { ...result.fixtures[key], width: r.width, height: r.height, codec: r.codec, sampleCount: r.sampleCount, keyIndices: r.keyIndices, cttsNonzeroSamples: c.cttsNonzeroSamples, presentDecreasesInDecodeOrder: c.presentDecreasesInDecodeOrder, presentOrderMonotonic: c.presentOrderMonotonicNonDecreasing, presentOrderIsPermutation: c.presentOrderIsPermutation, presentOrderDiffersFromNaiveIndexDesc: c.presentOrderDiffersFromNaiveIndexDesc };
      log(`load ${key}: ${r.width}x${r.height} ${r.codec} samples=${r.sampleCount} keys=${JSON.stringify(r.keyIndices)} cttsNonzero=${c.cttsNonzeroSamples} decreases=${c.presentDecreasesInDecodeOrder} perm=${c.presentOrderIsPermutation} mono=${c.presentOrderMonotonicNonDecreasing}`);
    }
    if (loaded.proxy720) {
      const sup = await runOp({ op: "supportCodec", codec: loaded.proxy720.codec, width: loaded.proxy720.width, height: loaded.proxy720.height }, 60000);
      result.support.proxy720 = sup;
      log(`support proxy720: ${JSON.stringify(sup)}`);
    }
    const gop = {};
    for (const key of ["proxy720", "src4k"]) {
      if (!loaded[key]) continue;
      const pts = loaded[key].ctts.ptsDecodeOrder;
      gop[key] = pickGop(loaded[key].keyIndices, loaded[key].sampleCount, pts);
      log(`GOP ${key}: [${gop[key].from}, ${gop[key].to}] len=${gop[key].len} decreases=${gop[key].decreases} (${gop[key].reason})`);
    }
    if (loaded.proxy720 && gop.proxy720) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const snap = snapshotLoad(chrome.pid);
        const label = labelLoad(snap);
        const r = await runOp({ op: "wcdecodeOrder", key: "proxy720", from: gop.proxy720.from, to: gop.proxy720.to }, 600000);
        result.runs.push({ kind: "webcodecs-decode-present-order", cell: "proxy720-from-4k", attempt, gop: gop.proxy720, loadBefore: snap, ...label, ...r });
        log(`proxy720 #${attempt}: ${label.loadLabel} decoded=${r.decoded}/${r.requested} decodeFps=${r.decodeFps} presentFps=${r.presentFps} drawn=${r.presentDrawn} missing=${r.presentMissing} tsDecr=${r.drawTimestampsStrictlyDecreasing} tsMatch=${r.drawTimestampMatchesSamplePts} tsMismatch=${r.drawTimestampMismatches} differsNaive=${r.drawOrderDiffersFromNaiveIndexDesc} ${r.error ? "ERROR " + r.error.slice(0, 200) : ""}`);
        if (r.error) break;
      }
      const snap = snapshotLoad(chrome.pid);
      const label = labelLoad(snap);
      const rb = await runOp({ op: "blobReverse", url: "/proxy720.mp4", from: gop.proxy720.from, to: gop.proxy720.to }, 600000);
      result.runs.push({ kind: "blob-reverse", cell: "proxy720-via-blob-url", attempt: 1, gop: gop.proxy720, loadBefore: snap, ...label, ...rb });
      log(`blobReverse proxy720: ${label.loadLabel} scheme=${rb.blobUrlScheme} blobBytes=${rb.blobBytes} decoded=${rb.decoded}/${rb.requested} decodeFps=${rb.decodeFps} presentFps=${rb.presentFps} tsDecr=${rb.drawTimestampsStrictlyDecreasing} tsMatch=${rb.drawTimestampMatchesSamplePts} tsMismatch=${rb.drawTimestampMismatches} differsNaive=${rb.drawOrderDiffersFromNaiveIndexDesc} ${rb.error ? "ERROR " + rb.error.slice(0, 200) : ""}`);
      const snapC = snapshotLoad(chrome.pid);
      const labelC = labelLoad(snapC);
      const rc = await runOp({ op: "controllerBlob", url: "/proxy720.mp4", from: gop.proxy720.from, to: gop.proxy720.to }, 300000);
      result.runs.push({ kind: "controller-blob", cell: "proxy720-via-controller-blob-url", attempt: 1, gop: gop.proxy720, loadBefore: snapC, ...labelC, ...rc });
      log(`controllerBlob proxy720: ${labelC.loadLabel} scheme=${rc.blobUrlScheme} hit=${rc.controllerReturnedFrame} polls=${rc.polls} wallToHit=${rc.wallSecToFirstHit} hitDetail=${rc.hit ? JSON.stringify(rc.hit) : "null"} ${rc.error ? "ERROR " + rc.error.slice(0, 200) : ""}`);
    }
    if (process.env.T6_SKIP_SRC4K !== "1" && loaded.src4k && gop.src4k) {
      const snap = snapshotLoad(chrome.pid);
      const label = labelLoad(snap);
      const r = await runOp({ op: "wcdecodeOrder", key: "src4k", from: gop.src4k.from, to: gop.src4k.to }, 900000);
      result.runs.push({ kind: "webcodecs-decode-present-order", cell: "src4k-orig", attempt: 1, gop: gop.src4k, loadBefore: snap, ...label, ...r });
      log(`src4k #1: ${label.loadLabel} decoded=${r.decoded}/${r.requested} decodeFps=${r.decodeFps} presentFps=${r.presentFps} tsDecr=${r.drawTimestampsStrictlyDecreasing} tsMatch=${r.drawTimestampMatchesSamplePts} tsMismatch=${r.drawTimestampMismatches} ${r.error ? "ERROR " + r.error.slice(0, 200) : ""}`);
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

main().catch((e) => { console.error(e); process.exit(2); });
