#!/usr/bin/env node
// Probe Q3 đợt 34 — pipe CDP + Xvfb, đo RSS cây process Chrome theo
// từng bậc giữ frame (bắt tay qua window.__q3Stage/__q3Ack).
// Chạy: Q3_SCRATCH=~/workspace/tmp-round34-q3/wc node probe-q3.mjs
// (mặc định scratch đó; display :97 / port 4197). Scratch phải chứa
// sẵn: page.js (bản probe Q3), mp4Demux.js, reverseWebcodecs.js,
// reverseDecodeAhead.js, noise-30s.mp4. Server đặt COOP/COEP/CORP để
// performance.measureMemory() hoạt động trong trang probe.
// KHÔNG build app, KHÔNG sửa code sản phẩm, KHÔNG push.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const SCRATCH = process.env.Q3_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round34-q3", "wc");
const DISPLAY = process.env.Q3_DISPLAY || ":97";
const PORT = Number(process.env.Q3_PORT || 4197);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.K4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function log(...a) { console.log(`[${stamp()}]`, ...a); }
function fail(msg) { console.error(`BLOCKER: ${msg}`); process.exit(2); }

function serveDir(dir) {
  return http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(dir, url === "/" ? "index.html" : url.replace(/^\//, ""));
    if (!file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "application/javascript" : "application/octet-stream";
    // COOP/COEP cho measureMemory; CORP cho subresource cùng origin.
    res.writeHead(200, {
      "Content-Type": type, "Content-Length": fs.statSync(file).size,
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
    fs.createReadStream(file).pipe(res);
  });
}

// RSS của cây process Chrome (KB -> byte), qua ps. Bao gồm cả GPU /
// utility process nên số này là cận trên của bộ nhớ frame; baseline
// trừ đi sẽ tách phần tăng thêm do giữ frame.
function treeRssBytes(rootPid) {
  try {
    const out = spawnSync("ps", ["-eo", "pid,ppid,rss,comm"], { encoding: "utf8" }).stdout || "";
    const rows = [];
    for (const line of out.split("\n").slice(1)) {
      const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/);
      if (m) rows.push({ pid: Number(m[1]), ppid: Number(m[2]), rssKb: Number(m[3]), comm: m[4] });
    }
    const children = new Map();
    for (const r of rows) {
      if (!children.has(r.ppid)) children.set(r.ppid, []);
      children.get(r.ppid).push(r);
    }
    let totalKb = 0; const seen = new Set(); const stack = [rootPid];
    while (stack.length) {
      const pid = stack.pop();
      if (seen.has(pid)) continue; seen.add(pid);
      const row = rows.find((r) => r.pid === pid);
      if (row) totalKb += row.rssKb;
      for (const c of children.get(pid) || []) stack.push(c.pid);
    }
    return { bytes: totalKb * 1024, procs: seen.size };
  } catch (e) { return { bytes: -1, procs: 0, error: String(e.message) }; }
}

class PipeCdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 1; this.pending = new Map(); this.sessionId = null; this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) this.sessionId = msg.params.sessionId;
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
  async evaluate(expr, sessionId) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId, 120000);
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result?.value;
  }
}

async function main() {
  for (const f of ["page.js", "mp4Demux.js", "reverseWebcodecs.js", "reverseDecodeAhead.js", "noise-30s.mp4"]) {
    if (!fs.existsSync(path.join(SCRATCH, f))) fail(`thiếu ${f} trong ${SCRATCH}`);
  }
  writeFileEpermRetry(path.join(SCRATCH, "index.html"), `<!doctype html><meta charset="utf-8"><title>q3 decode-ahead probe</title><body>probe</body><script type="module" src="/page.js"></script>`);
  const server = serveDir(SCRATCH);
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  log(`phục vụ probe tại ${ORIGIN}`);
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
  await cdp.send("Target.getTargets", {}, undefined, 30000);
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
  if (!cdp.sessionId) fail("không nhận được sessionId");
  await cdp.send("Page.enable", {}, cdp.sessionId);
  await cdp.send("Runtime.enable", {}, cdp.sessionId);
  await cdp.send("Page.navigate", { url: ORIGIN + "/" }, cdp.sessionId);
  const rssByStage = {};
  const acked = new Set();
  let result = null;
  // Poll 1s/lần, tối đa 600s: memory ladder (~30s decode) + paced
  // 6+11+21s + prefetch chờ. Mỗi lần stage mới -> snapshot RSS rồi ack.
  for (let i = 0; i < 600 && !result; i++) {
    await sleep(1000);
    const stage = await cdp.evaluate(`window.__q3Stage || null`, cdp.sessionId).catch(() => null);
    if (stage && (stage.startsWith("held-") || stage === "released") && !acked.has(stage)) {
      const snap = treeRssBytes(chrome.pid);
      rssByStage[stage] = { ...snap, loadavg: os.loadavg(), at: new Date().toISOString() };
      log(`RSS @ ${stage}: ${(snap.bytes / 1048576).toFixed(1)} MB (${snap.procs} proc), load ${os.loadavg().map((v) => v.toFixed(2)).join("/")}`);
      await cdp.evaluate(`window.__q3Ack = ${JSON.stringify(stage)}`, cdp.sessionId).catch(() => null);
      acked.add(stage);
    }
    if (stage === "done" || stage === "error") {
      result = await cdp.evaluate(`window.__q3Result || null`, cdp.sessionId).catch(() => null);
    }
  }
  if (!result) fail("probe không trả kết quả sau 600s");
  result.rssByStage = rssByStage;
  result.pipe = { chromePid: chrome.pid, display: DISPLAY };
  writeFileEpermRetry(path.join(SCRATCH, "q3-decode-ahead.json"), JSON.stringify(result, null, 2));
  log("KẾT QUẢ: " + JSON.stringify(result));
  cleanup();
  process.exit(0);
}
main().catch((e) => { console.error("FATAL", e); process.exit(2); });
