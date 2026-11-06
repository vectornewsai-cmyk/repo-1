#!/usr/bin/env node
// Pipe T2 đợt 37 — đo paced reverse nhiều GOP bằng proxy + cửa sổ Q3.
// CHỈ ĐO; không sửa code sản phẩm, không push. Chạy:
//   node apps/web/scripts/probe-round37-t2-paced-q3-pipe.mjs
// Ghi JSON ra benchmarks/results/v37-t2-paced-q3.json (và copy ở scratch).
// Mẫu CDP pipe + Xvfb + HTTP Range theo pipe S3 đợt 36 (viết lại gọn cho
// 1 case duy nhất: proxy 480p của nhiễu 720p, 2 lượt lặp trong 1 phiên).
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const SCRATCH = process.env.T2_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round37-t2", "wc");
const DISPLAY = process.env.T2_DISPLAY || ":99";
const PORT = Number(process.env.T2_PORT || 4297);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PROXY_SRC = process.env.T2_PROXY_SRC || path.join(os.homedir(), "workspace", "tmp-round36-s3", "wc", "noise-proxy480.mp4");
const QUIET_LOAD1 = 2.0;
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.T2_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
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
      if (/(^|\/)(ffmpeg|vite|tsc|esbuild)(\s|$)/.test(r.args) || (r.args.includes("probe-round") && !r.args.includes("probe-round37-t2") && r.args.includes("node"))) {
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
  async evaluate(expr, sessionId, timeoutMs = 180000) {
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
  const result = { session: { startedAt: stamp(), repo: REPO, scratch: SCRATCH, display: DISPLAY, port: PORT, quietLoad1Threshold: QUIET_LOAD1, nproc: os.cpus().length, memTotalMB: Math.round(os.totalmem() / 1048576) }, fixtures: {}, build: {}, support: {}, runs: [], errors: [] };
  if (!fs.existsSync(ESBUILD)) fail(`không tìm thấy esbuild: ${ESBUILD}`);
  if (!fs.existsSync(PROXY_SRC)) fail(`thiếu fixture proxy: ${PROXY_SRC}`);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const mp4Src = path.join(REPO, "apps/web/src/lib/mp4Demux.ts");
  const revSrc = path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts");
  const aheadSrc = path.join(REPO, "apps/web/src/lib/reverseDecodeAhead.ts");
  const gateSrc = path.join(REPO, "apps/web/src/lib/reversePreviewGate.ts");
  const pageSrc = path.join(HERE, "probe-round37-t2-paced-q3-page.js");
  for (const f of [mp4Src, revSrc, aheadSrc, gateSrc, pageSrc]) if (!fs.existsSync(f)) fail(`thiếu nguồn: ${f}`);
  const mp4Out = path.join(SCRATCH, "mp4Demux.js");
  const revOut = path.join(SCRATCH, "reverseWebcodecs.js");
  const aheadOut = path.join(SCRATCH, "reverseDecodeAhead.js");
  const gateOut = path.join(SCRATCH, "reversePreviewGate.js");
  const pageOut = path.join(SCRATCH, "page.js");
  execSync(`"${ESBUILD}" "${mp4Src}" --format=esm --target=es2022 --outfile="${mp4Out}"`, { stdio: "pipe" });
  execSync(`"${ESBUILD}" "${revSrc}" --format=esm --target=es2022 --outfile="${revOut}"`, { stdio: "pipe" });
  execSync(`"${ESBUILD}" "${aheadSrc}" --format=esm --target=es2022 --outfile="${aheadOut}"`, { stdio: "pipe" });
  execSync(`"${ESBUILD}" "${gateSrc}" --format=esm --target=es2022 --outfile="${gateOut}"`, { stdio: "pipe" });
  fs.copyFileSync(pageSrc, pageOut);
  let revJs = fs.readFileSync(revOut, "utf8");
  const before = revJs.includes('"./mp4Demux"');
  revJs = revJs.replaceAll('"./mp4Demux"', '"./mp4Demux.js"')
    .replaceAll('"./reversePreviewGate"', '"./reversePreviewGate.js"')
    .replaceAll('"./reverseDecodeAhead"', '"./reverseDecodeAhead.js"');
  fs.writeFileSync(revOut, revJs);
  result.build = { mp4DemuxTsSha256: sha256File(mp4Src), reverseWebcodecsTsSha256: sha256File(revSrc), reverseDecodeAheadTsSha256: sha256File(aheadSrc), reversePreviewGateTsSha256: sha256File(gateSrc), mp4DemuxJsSha256: sha256File(mp4Out), reverseWebcodecsJsSha256: sha256File(revOut), reverseDecodeAheadJsSha256: sha256File(aheadOut), reversePreviewGateJsSha256: sha256File(gateOut), importSpecifierRewritten: before };
  const link = path.join(SCRATCH, "noise-proxy480.mp4");
  try { fs.unlinkSync(link); } catch {}
  if (fs.realpathSync(PROXY_SRC) !== link) fs.symlinkSync(PROXY_SRC, link);
  result.fixtures.noiseProxy480 = { servedAs: "noise-proxy480.mp4", srcRealpath: fs.realpathSync(PROXY_SRC), bytes: fs.statSync(PROXY_SRC).size };
  fs.writeFileSync(path.join(SCRATCH, "index.html"), `<!doctype html><meta charset="utf-8"><title>t2 paced q3 probe</title><body>probe</body><script type="module" src="/page.js"></script>`);
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
  const outJson = path.join(REPO, "benchmarks/results", process.env.T2_OUT || "v37-t2-paced-q3.json");
  try {
    const { sessionId } = await cdp.attachNewPage(`${ORIGIN}/`);
    for (let i = 0; i < 100; i++) {
      const ready = await cdp.evaluate(`!!window.__t2Ready`, sessionId, 15000).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    const loadBefore = snapshotLoad(chrome.pid);
    const run = await cdp.evaluate(`window.__t2Run(${JSON.stringify(`${ORIGIN}/noise-proxy480.mp4`)})`, sessionId, 180000);
    const loadAfter = snapshotLoad(chrome.pid);
    if (!run || run.error) throw new Error(`probe lỗi: ${run?.error || "no result"}`);
    const controllerCheck = await cdp.evaluate(`window.__t2RunController(${JSON.stringify(`${ORIGIN}/noise-proxy480.mp4`)})`, sessionId, 180000);
    if (!controllerCheck || controllerCheck.error) throw new Error(`probe controller lỗi: ${controllerCheck?.error || "no result"}`);
    result.runs.push({ loadBefore, loadBeforeLabel: labelLoad(loadBefore), loadAfter, loadAfterLabel: labelLoad(loadAfter), ...run, controllerCheck });
    log(`controller: gate=${controllerCheck.gateOk.verdict} active=${controllerCheck.active} windowOk=${controllerCheck.windowOk} size ${controllerCheck.sizeAfterWindow}->${controllerCheck.sizeAfterPrefetch} ahead=${JSON.stringify(controllerCheck.aheadRange)} hit=${JSON.stringify(controllerCheck.prefetchHit)} control=${JSON.stringify(controllerCheck.control)}`);
    log(`xong: reps=${run.reps.map((r) => `${r.presentedFps}fps drawn ${r.drawn}/${r.presentFrames} missed ${r.missed} late ${r.lateOver20ms}`).join(" | ")}`);
  } catch (e) {
    result.errors.push(String(e && e.stack || e));
    console.error(`LỖI: ${e.message}`);
  }
  result.session.endedAt = stamp();
  fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(SCRATCH, "t2-paced-q3.json"), JSON.stringify(result, null, 2));
  log(`ghi ${outJson}`);
  cleanup();
  process.exit(result.errors.length ? 1 : 0);
}
main().catch((e) => { console.error(`BLOCKER: ${e.stack || e}`); process.exit(2); });
