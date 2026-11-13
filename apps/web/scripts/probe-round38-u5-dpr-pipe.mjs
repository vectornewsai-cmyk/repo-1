#!/usr/bin/env node
// Probe U5 đợt 38 — smoke dpr > 1 cho footage B-frame (element + WebCodecs).
// CHỈ ĐO; KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG binary vào repo.
// Chạy: node apps/web/scripts/probe-round38-u5-dpr-pipe.mjs
// Env: U5_PORT (mặc định 4299), U5_FIXTURE (mặc định proxy reorder 480p
// của T6 đợt 37), U5_OUT (mặc định benchmarks/results/v38-u5-dpr.json),
// U5_SCRATCH (mặc định ~/workspace/tmp-round38-u5/dpr).
// Profile Chrome đặt trong workspace (bài học T5: /tmp là tmpfs 512M).
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const PORT = Number(process.env.U5_PORT || 4299);
const FIXTURE = process.env.U5_FIXTURE || path.join(os.homedir(), "workspace", "tmp-round37-t6", "noise-30s__proxy_480p.mp4");
const OUT = process.env.U5_OUT || path.join(REPO, "benchmarks", "results", "v38-u5-dpr.json");
const SCRATCH = process.env.U5_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round38-u5", "dpr");
const CHROME = process.env.CHROME_BIN || path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const ESBUILD = path.join(REPO, "node_modules", ".bin", "esbuild");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
function fail(m) { console.error("BLOCKER: " + m); process.exit(2); }
function sha256File(f) {
  const h = crypto.createHash("sha256"); const fd = fs.openSync(f, "r");
  const buf = Buffer.alloc(1048576); let n;
  do { n = fs.readSync(fd, buf, 0, buf.length, null); if (n > 0) h.update(buf.subarray(0, n)); } while (n > 0);
  fs.closeSync(fd); return h.digest("hex");
}
if (!fs.existsSync(CHROME)) fail("không thấy Chromium: " + CHROME);
if (!fs.existsSync(FIXTURE)) fail("không thấy fixture: " + FIXTURE);
for (const f of ["apps/web/src/lib/mp4Demux.ts", "apps/web/src/lib/reverseWebcodecs.ts", "apps/web/scripts/probe-round38-u5-dpr-page.js"])
  if (!fs.existsSync(path.join(REPO, f))) fail("thiếu nguồn: " + f);
fs.mkdirSync(SCRATCH, { recursive: true });

function bundle(src, outName) {
  const out = path.join(SCRATCH, outName);
  execSync(`${ESBUILD} ${path.join(REPO, src)} --bundle --platform=browser --format=esm --outfile=${out} --log-level=warning`, { stdio: "inherit" });
  const js = fs.readFileSync(out, "utf8");
  const bare = [...js.matchAll(/from\s+["']([^"'.][^"']*)["']/g)].map((m) => m[1]).filter((s) => !s.startsWith("http"));
  if (bare.length) fail(`bundle ${outName} còn import trần: ${bare.join(", ")}`);
  return out;
}
bundle("apps/web/src/lib/mp4Demux.ts", "mp4Demux.js");
bundle("apps/web/src/lib/reverseWebcodecs.ts", "reverseWebcodecs.js");
fs.copyFileSync(path.join(HERE, "probe-round38-u5-dpr-page.js"), path.join(SCRATCH, "page.js"));
writeFileEpermRetry(path.join(SCRATCH, "index.html"), `<!doctype html><meta charset="utf-8"><title>u5 dpr probe</title><body>probe</body><script type="module" src="/page.js"></script>`);

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/fixture.mp4") {
    const stat = fs.statSync(FIXTURE);
    res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": stat.size });
    fs.createReadStream(FIXTURE).pipe(res); return;
  }
  const file = path.join(SCRATCH, url === "/" ? "index.html" : url.replace(/^\//, ""));
  if (!file.startsWith(SCRATCH) || !fs.existsSync(file)) { res.writeHead(404); res.end("nf"); return; }
  const type = file.endsWith(".html") ? "text/html" : "application/javascript";
  res.writeHead(200, { "Content-Type": type, "Content-Length": fs.statSync(file).size });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${PORT}`;

async function runOnce(dsf, cdpPort) {
  const profile = path.join(SCRATCH, `chrome-dsf${dsf}`);
  fs.rmSync(profile, { recursive: true, force: true });
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  try {
    let targets;
    for (let i = 0; i < 60; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json(); break; }
      catch { await sleep(500); }
    }
    const page = targets.find((t) => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error("ws timeout")), 30000); });
    let nextId = 1; const pending = new Map();
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { const e = pending.get(d.id); pending.delete(d.id); if (d.error) e.reject(new Error(JSON.stringify(d.error))); else e.resolve(d.result); }
    };
    const send = (method, params = {}, timeoutMs = 120000) => new Promise((res, rej) => {
      const id = nextId++;
      const t = setTimeout(() => rej(new Error("cdp timeout " + method)), timeoutMs);
      pending.set(id, { resolve: (v) => { clearTimeout(t); res(v); }, reject: (e) => { clearTimeout(t); rej(e); } });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const ev = async (expr) => {
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
      return r.result.value;
    };
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 854, height: 600, deviceScaleFactor: dsf, mobile: false });
    await send("Page.navigate", { url: ORIGIN + "/" });
    for (let i = 0; i < 120; i++) { if (await ev("window.__u5ready === true")) break; await sleep(500); }
    const result = await ev("window.__u5run()");
    ws.close();
    return result;
  } finally {
    chrome.kill();
    await sleep(500);
  }
}

const result = {
  fixture: FIXTURE, fixtureBytes: fs.statSync(FIXTURE).size,
  fixtureSha256: sha256File(FIXTURE),
  mp4DemuxSha256: sha256File(path.join(REPO, "apps/web/src/lib/mp4Demux.ts")),
  reverseWebcodecsSha256: sha256File(path.join(REPO, "apps/web/src/lib/reverseWebcodecs.ts")),
  runs: {},
};
for (const dsf of [2, 3]) {
  console.log(`[${stamp()}] chạy DSF=${dsf} ...`);
  result.runs["dsf" + dsf] = await runOnce(dsf, PORT + dsf);
  console.log(`[${stamp()}] DSF=${dsf} xong: element backing ${result.runs["dsf" + dsf].element.backingW}x${result.runs["dsf" + dsf].element.backingH}, wc drawn ${result.runs["dsf" + dsf].webcodecs.drawn}/${result.runs["dsf" + dsf].webcodecs.decoded}`);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
writeFileEpermRetry(OUT, JSON.stringify(result, null, 2));
console.log("ghi " + OUT);
server.close();
process.exit(0);
