#!/usr/bin/env node
// Probe R4 đợt 35 — đo quiet + GPU cho đường WebCodecs (CHỈ ĐO).
// KHÔNG sửa code sản phẩm, KHÔNG nối module Q3 vào preview, KHÔNG push,
// KHÔNG ghi paths-loop hay build-loop-log (parent đợt 35 gộp).
//
// Luồng chạy:
//  1. Biên dịch mp4Demux.ts + reverseWebcodecs.ts hiện tại của repo bằng
//     esbuild ra scratch (ghi sha256 nguồn + đích để đối chiếu bundle).
//  2. Symlink 2 fixture vào scratch: phẳng = sparse-gop-flat.mp4 của P5/O5
//     (1280×720, 30fps, GOP 300, 900 sample, ~45KB) và nhiễu = noise-30s.mp4
//     của Q3 (cùng hình học/fps/GOP, ~210MB, ~56Mbps).
//  3. Chrome headed qua pipe CDP + Xvfb riêng (mặc định :98, port 4198):
//     a. chrome://gpu -> dump innerText (bằng chứng trực tiếp về Video
//        Acceleration) + GPU process cmdline + /dev/dri + WebGL renderer
//        (chỉ là chứng cứ phụ — renderer WebGL KHÔNG đồng nghĩa decode HW).
//     b. Trang probe: isConfigSupported (cảnh báo: supported KHÔNG chứng
//        minh decode HW — Chrome vẫn trả supported khi fallback software),
//        rồi decode từng GOP [300,599] theo lệnh, mỗi lượt có nhãn tải
//        riêng ghi TRƯỚC lượt (load1 + số Chrome ngoài cây probe + tiến
//        trình nặng khác). QUIET khi và chỉ khi load1 < 2.0 (ngưỡng Q6,
//        máy 4 vCPU) VÀ 0 Chrome ngoài cây probe VÀ 0 tiến trình nặng khác
//        (ffmpeg/vite/tsc/esbuild/node probe khác). Mỗi ô
//        (fixture × preferHardware) chạy tới khi đủ 2 lượt quiet hoặc hết
//        R4_MAX_ATTEMPTS lượt (mặc định 5) — thiếu quiet là kết quả, không
//        phải lỗi harness: script vẫn exit 0 và ghi rõ số lượt đã thử.
//  4. Ghi JSON kết quả ra scratch + benchmarks/results/
//     v35-r4-webcodecs-gpu.json (repo, text).
// Chạy: node apps/web/scripts/probe-round35-r4-webcodecs-gpu-pipe.mjs
// (từ gốc repo hoặc bằng đường dẫn tuyệt đối; env xem dưới).
import { spawn, spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", ".."); // scripts -> web -> apps -> repo root
const SCRATCH = process.env.R4_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round35-r4", "wc");
const DISPLAY = process.env.R4_DISPLAY || ":98";
const PORT = Number(process.env.R4_PORT || 4198);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const FLAT_SRC = process.env.R4_FLAT_SRC || path.join(os.homedir(), "workspace", "tmp-round27-k4", "sparse-gop-flat.mp4");
const NOISE_SRC = process.env.R4_NOISE_SRC || path.join(os.homedir(), "workspace", "tmp-round34-q3", "wc", "noise-30s.mp4");
const MAX_ATTEMPTS = Number(process.env.R4_MAX_ATTEMPTS || 5);
const QUIET_LOAD1 = Number(process.env.R4_QUIET_LOAD1 || 2.0);
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.R4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
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
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "application/javascript" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Content-Length": fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  });
}

// Ảnh chụp tải + tiến trình: đếm Chrome ngoài cây probe và tiến trình
// nặng khác (ffmpeg/vite/tsc/esbuild/node probe khác, trừ chính mình).
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
      if (/(^|\/)(ffmpeg|vite|tsc|esbuild)(\s|$)/.test(r.args) || (r.args.includes("probe-round") && !r.args.includes("probe-round35-r4") && r.args.includes("node"))) {
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

function gpuProcessLines() {
  try {
    const ps = spawnSync("ps", ["-eo", "pid,args"], { encoding: "utf8" }).stdout || "";
    return ps.split("\n").filter((l) => l.includes("type=gpu-process")).map((l) => l.trim().slice(0, 500));
  } catch { return []; }
}

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.sessions = []; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) { this.sessionId = msg.params.sessionId; this.sessions.push(msg.params.sessionId); }
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
    // Lấy session của lần attach này (không dùng sessionId cũ của target
    // trước — target chrome://gpu và target probe là 2 session khác nhau).
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
    session: { startedAt: stamp(), repo: REPO, scratch: SCRATCH, display: DISPLAY, port: PORT, maxAttemptsPerCell: MAX_ATTEMPTS, quietLoad1Threshold: QUIET_LOAD1, nproc: os.cpus().length, memTotalMB: Math.round(os.totalmem() / 1048576) },
    fixtures: {}, build: {}, gpu: {}, support: {}, runs: [], errors: [],
  };
  if (!fs.existsSync(ESBUILD)) fail(`không tìm thấy esbuild: ${ESBUILD}`);
  if (!fs.existsSync(FLAT_SRC)) fail(`thiếu fixture phẳng: ${FLAT_SRC}`);
  if (!fs.existsSync(NOISE_SRC)) fail(`thiếu fixture nhiễu: ${NOISE_SRC}`);
  fs.mkdirSync(SCRATCH, { recursive: true });
  // 1. Biên dịch module thật từ repo hiện tại.
  const mp4Src = path.join(REPO, "apps/web/src/lib/mp4Demux.ts");
  const revSrc = path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts");
  const pageSrc = path.join(HERE, "probe-round35-r4-webcodecs-gpu-page.js");
  for (const f of [mp4Src, revSrc, pageSrc]) if (!fs.existsSync(f)) fail(`thiếu nguồn: ${f}`);
  const mp4Out = path.join(SCRATCH, "mp4Demux.js");
  const revOut = path.join(SCRATCH, "reverseWebcodecs.js");
  const pageOut = path.join(SCRATCH, "page.js");
  execSync(`"${ESBUILD}" "${mp4Src}" --format=esm --target=es2022 --outfile="${mp4Out}"`, { stdio: "pipe" });
  execSync(`"${ESBUILD}" "${revSrc}" --format=esm --target=es2022 --outfile="${revOut}"`, { stdio: "pipe" });
  fs.copyFileSync(pageSrc, pageOut);
  // esbuild giữ nguyên specifier "./mp4Demux" (không đuôi); browser ESM
  // cần "./mp4Demux.js" — chỉ sửa specifier này trong bản biên dịch ở
  // scratch, KHÔNG đụng nguồn .ts.
  let revJs = fs.readFileSync(revOut, "utf8");
  const before = revJs.includes('"./mp4Demux"');
  revJs = revJs.replaceAll('"./mp4Demux"', '"./mp4Demux.js"');
  writeFileEpermRetry(revOut, revJs);
  result.build = {
    mp4DemuxTsSha256: sha256File(mp4Src), reverseWebcodecsTsSha256: sha256File(revSrc),
    mp4DemuxJsSha256: sha256File(mp4Out), reverseWebcodecsJsSha256: sha256File(revOut),
    importSpecifierRewritten: before,
  };
  // 2. Fixture vào scratch (symlink — không copy file 210MB).
  for (const [name, src] of [["flat", FLAT_SRC], ["noise", NOISE_SRC]]) {
    const link = path.join(SCRATCH, `${name}.mp4`);
    try { fs.unlinkSync(link); } catch {}
    fs.symlinkSync(src, link);
    result.fixtures[name] = { srcRealpath: fs.realpathSync(src), bytes: fs.statSync(src).size, sha256: sha256File(src) };
  }
  writeFileEpermRetry(path.join(SCRATCH, "index.html"), `<!doctype html><meta charset="utf-8"><title>r4 webcodecs gpu probe</title><body>probe</body><script type="module" src="/page.js"></script>`);
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
  let probe = null;
  try {
    const version = await cdp.send("Browser.getVersion", {}, undefined, 30000);
    result.session.chrome = { product: version.product, userAgent: version.userAgent, jsVersion: version.jsVersion };
    // 3a. chrome://gpu — bằng chứng trực tiếp.
    let gpuText = null, gpuError = null;
    try {
      const t = await cdp.attachNewPage("about:blank");
      await cdp.send("Page.navigate", { url: "chrome://gpu" }, t.sessionId);
      for (let i = 0; i < 60; i++) {
        await sleep(500);
        const txt = await cdp.evaluate(`document.body ? document.body.innerText : ""`, t.sessionId, 30000).catch(() => "");
        if (txt && txt.length > 200) { gpuText = txt; break; }
      }
      if (!gpuText) gpuError = "chrome://gpu không trả innerText >200 ký tự";
      await cdp.send("Target.closeTarget", { targetId: t.targetId }).catch(() => {});
    } catch (e) { gpuError = String(e.message); }
    const keyLine = (re) => {
      if (!gpuText) return [];
      return gpuText.split("\n").map((l) => l.trim()).filter((l) => re.test(l)).slice(0, 30);
    };
    result.gpu = {
      error: gpuError,
      innerTextLength: gpuText ? gpuText.length : 0,
      innerText: gpuText ? gpuText.slice(0, 60000) : null,
      innerTextTruncated: gpuText ? gpuText.length > 60000 : false,
      keyLines: {
        videoAcceleration: keyLine(/video|decode|encode/i).filter((l) => /accelerat|decode|encode/i.test(l)).slice(0, 30),
        glRenderer: keyLine(/GL_RENDERER|renderer/i),
        featureStatus: keyLine(/^(Canvas|Video Decode|Rasterization|Vulkan|WebGL|GPU compositing|Multiple Raster Threads|Out-of-process Rasterization|Hardware Protected Video)/i),
      },
      devDri: (() => { try { return { exists: fs.existsSync("/dev/dri"), entries: fs.existsSync("/dev/dri") ? fs.readdirSync("/dev/dri") : [] }; } catch (e) { return { exists: false, error: String(e.message) }; } })(),
      gpuProcessCmdlines: gpuProcessLines(),
    };
    log(`chrome://gpu: ${gpuError || `innerText ${gpuText.length} ký tự`}`);
    // 3b. Trang probe.
    probe = await cdp.attachNewPage(ORIGIN + "/");
    for (let i = 0; i < 100; i++) {
      const ready = await cdp.evaluate(`!!window.__r4Ready`, probe.sessionId, 30000).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    const ready = await cdp.evaluate(`!!window.__r4Ready`, probe.sessionId, 30000);
    if (!ready) fail("trang probe không ready");
    let seq = 0;
    async function runOp(cmd, timeoutMs = 600000) {
      seq += 1;
      const full = { seq, ...cmd };
      await cdp.evaluate(`window.__r4Cmd = ${JSON.stringify(full)}`, probe.sessionId, 30000);
      const t0 = Date.now();
      for (;;) {
        const res = await cdp.evaluate(`window.__r4Result || null`, probe.sessionId, 30000).catch(() => null);
        if (res && res.seq === seq) return res;
        if (Date.now() - t0 > timeoutMs) throw new Error(`timeout op ${cmd.op} sau ${timeoutMs}ms`);
        await sleep(500);
      }
    }
    result.support = await runOp({ op: "support" }, 120000);
    log(`support: ${JSON.stringify(result.support)}`);
    const GOP = [300, 599];
    const WARM = [600, 899];
    for (const [fixture, url] of [["flat", "/flat.mp4"], ["noise", "/noise.mp4"]]) {
      const loaded = await runOp({ op: "load", fixture, url }, 180000);
      if (loaded.error) { result.errors.push(`load ${fixture}: ${loaded.error}`); continue; }
      result.fixtures[fixture] = { ...result.fixtures[fixture], ...loaded };
      const codecSupport = await runOp({ op: "supportCodec", codec: loaded.codec }, 60000);
      result.fixtures[fixture].codecSupport = codecSupport;
      // Warm-up 1 GOP (không tính vào lượt đo), cả 2 config đều warm bằng
      // config của nó trước lượt đầu của config đó — thực hiện warm-up
      // prefer-software chung 1 lần trước mọi lượt (decoder tạo mới mỗi
      // GOP nên warm-up chỉ warm Chrome/codec, không warm decoder cụ thể).
      const warm = await runOp({ op: "decode", fixture, from: WARM[0], to: WARM[1], preferHardware: false }, 600000);
      result.runs.push({ kind: "warmup", fixture, preferHardware: false, ...warm, loadLabel: "warmup-not-counted" });
      log(`warmup ${fixture}: ${JSON.stringify(warm)}`);
      for (const preferHardware of [false, true]) {
        let quietCount = 0, attempts = 0;
        while (quietCount < 2 && attempts < MAX_ATTEMPTS) {
          attempts += 1;
          const pre = snapshotLoad(chrome.pid);
          const lab = labelLoad(pre);
          const res = await runOp({ op: "decode", fixture, from: GOP[0], to: GOP[1], preferHardware }, 600000);
          const post = snapshotLoad(chrome.pid);
          const row = { kind: "measure", fixture, preferHardware, attempt: attempts, preLoad: pre, postLoad: post, ...lab, ...res };
          result.runs.push(row);
          log(`${fixture} hw=${preferHardware} attempt ${attempts} label=${lab.loadLabel} fps=${res.fps} wall=${res.wallSec}s decoded=${res.decoded} preLoad1=${pre.loadavg[0].toFixed(2)} chromeOther=${pre.chromeOther} heavy=${pre.heavyOther.length}`);
          if (lab.loadLabel === "quiet" && !res.error && res.decoded === res.expected) quietCount += 1;
          if (res.error) result.errors.push(`decode ${fixture} hw=${preferHardware} attempt ${attempts}: ${res.error}`);
        }
        result.fixtures[fixture][preferHardware ? "hwAttempts" : "swAttempts"] = { attempts, quietCount, quietAchieved: quietCount >= 2 };
      }
      await runOp({ op: "unload", fixture }, 60000);
    }
    await runOp({ op: "done" }, 60000).catch(() => {});
    result.session.finishedAt = stamp();
    // Tổng kết quiet: trung vị fps các lượt quiet theo từng ô.
    const summary = {};
    for (const r of result.runs.filter((x) => x.kind === "measure" && x.loadLabel === "quiet" && !x.error)) {
      const k = `${r.fixture}-hw${r.preferHardware ? 1 : 0}`;
      if (!summary[k]) summary[k] = [];
      summary[k].push(r.fps);
    }
    for (const k of Object.keys(summary)) {
      const v = [...summary[k]].sort((a, b) => a - b);
      summary[k] = { n: v.length, values: v, median: v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2 };
    }
    result.quietSummary = summary;
    const outPath = path.join(REPO, "benchmarks", "results", "v35-r4-webcodecs-gpu.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileEpermRetry(outPath, JSON.stringify(result, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "r4-webcodecs-gpu.json"), JSON.stringify(result, null, 2));
    log(`KẾT QUẢ: ${outPath}`);
    log(`quietSummary: ${JSON.stringify(summary)}`);
    cleanup();
    process.exit(0);
  } catch (e) {
    console.error("FATAL", e);
    try { writeFileEpermRetry(path.join(SCRATCH, "r4-webcodecs-gpu-partial.json"), JSON.stringify(result, null, 2)); } catch {}
    cleanup();
    process.exit(2);
  }
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
