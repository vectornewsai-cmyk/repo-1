#!/usr/bin/env node
/**
 * probe-trace.mjs — Ghi CDP trace 6s lúc phát để xem khung hình đi đâu
 * (Phase 9 đợt 52 I9).
 *
 * rAF chỉ ~1.5Hz khi phát dù main thread nhàn (profile: 63% idle) và trang
 * visible — trace sẽ cho thấy BeginFrame có được phát không, task nào chiếm
 * main thread, và compositor/GPU/media làm gì giữa các frame.
 *
 * Dùng: node apps/web/scripts/probe-trace.mjs [--seed-autosave F]
 *        [--profile DIR] [--serve] [--duration 6]
 *        [--out benchmarks/results/preview-trace-r52.json]
 * Phân tích: node apps/web/scripts/probe-trace.mjs --analyze <trace.json>
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PAGE_URL = arg("--url", "http://127.0.0.1:5173");
const SERVE = process.argv.includes("--serve");
const PROFILE = arg("--profile", "");
const SEED_AUTOSAVE = arg("--seed-autosave", "");
const DURATION = Number(arg("--duration", "6"));
const OUT = arg("--out", "");
const ANALYZE = arg("--analyze", "");
const CHROME = arg("--chrome", "") || process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function analyzeTrace(file) {
  const trace = JSON.parse(fs.readFileSync(file, "utf8"));
  const events = trace.traceEvents || trace;
  const byName = new Map();
  for (const e of events) {
    if (!e.name) continue;
    const g = byName.get(e.name) ?? { count: 0, totalDurUs: 0, maxDurUs: 0 };
    g.count++;
    if (typeof e.dur === "number") { g.totalDurUs += e.dur; if (e.dur > g.maxDurUs) g.maxDurUs = e.dur; }
    byName.set(e.name, g);
  }
  const top = [...byName.entries()]
    .map(([name, g]) => ({ name, ...g, totalMs: Number((g.totalDurUs / 1000).toFixed(1)), maxMs: Number((g.maxDurUs / 1000).toFixed(1)) }))
    .sort((a, b) => b.totalDurUs - a.totalDurUs).slice(0, 30);
  console.log(`trace events: ${events.length}`);
  for (const t of top) console.log(`  ${String(t.totalMs).padStart(9)}ms total  max ${String(t.maxMs).padStart(8)}ms  n=${t.count}  ${t.name}`);
  // Chuỗi BeginFrame trên renderer chính (cat cc / devtools.timeline).
  const begins = events.filter((e) => e.name === "BeginFrame" || e.name === "BeginFrameArgs" || e.name === "IssueBeginFrame").slice(0, 20);
  console.log(`BeginFrame-ish events: ${events.filter((e) => /beginframe/i.test(e.name || "")).length}`);
  for (const b of begins.slice(0, 10)) console.log(`  BeginFrame ts=${b.ts} pid=${b.pid} tid=${b.tid}`);
  // FireAnimationFrame (rAF fire) — đếm + khoảng cách.
  const rafs = events.filter((e) => e.name === "FireAnimationFrame").map((e) => e.ts).sort((a, b) => a - b);
  console.log(`FireAnimationFrame: ${rafs.length}`);
  if (rafs.length > 1) {
    const gaps = [];
    for (let i = 1; i < rafs.length; i++) gaps.push((rafs[i] - rafs[i - 1]) / 1000);
    gaps.sort((a, b) => a - b);
    console.log(`  gap ms p50=${gaps[Math.floor(gaps.length * 0.5)].toFixed(1)} p95=${gaps[Math.floor(gaps.length * 0.95)].toFixed(1)} max=${gaps[gaps.length - 1].toFixed(1)}`);
  }
}

if (ANALYZE) { analyzeTrace(path.resolve(ANALYZE)); process.exit(0); }

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.ws.addEventListener("message", (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.method === "Tracing.dataCollected") {
        this.events.push(...(msg.params.value || []));
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 60000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, awaitPromise = false, timeoutMs = 30000) {
    const res = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise }, timeoutMs);
    if (res.exceptionDetails) throw new Error(`evaluate failed: ${JSON.stringify(res.exceptionDetails)}`);
    return res.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

async function waitUrlOk(url, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try { const res = await fetch(url); if (res.ok) return true; } catch { /* chưa lên */ }
    await sleep(1000);
  }
  return false;
}

async function main() {
  const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");
  let vite = null;
  if (SERVE) {
    const port = new URL(PAGE_URL).port || "5173";
    const viteBin = path.join(ROOT, "node_modules/.bin/vite");
    vite = spawn(viteBin, ["--port", port, "--strictPort", "--host", "127.0.0.1"], { cwd: path.join(ROOT, "apps/web"), stdio: "ignore" });
  }
  const dbgPort = 19000 + (process.pid % 1000);
  const userData = PROFILE ? path.resolve(PROFILE) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-trace-"));
  if (PROFILE) fs.mkdirSync(userData, { recursive: true });
  const chrome = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
    "--mute-audio", "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900", `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${userData}`,
  ], { stdio: "ignore" });
  try {
    if (!(await waitUrlOk(PAGE_URL, SERVE ? 60000 : 5000))) throw new Error(`Không tới được ${PAGE_URL}`);
    let targets = [];
    for (let i = 0; i < 30 && targets.length === 0; i++) {
      await sleep(1000);
      try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json(); } catch { /* chưa lên */ }
    }
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("Không lấy được target page.");
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: PAGE_URL });
    if (SEED_AUTOSAVE) {
      const seedRaw = fs.readFileSync(path.resolve(SEED_AUTOSAVE), "utf8");
      await sleep(800);
      await cdp.evaluate(`localStorage.setItem('vcut-studio:autosave:v1', ${JSON.stringify(seedRaw)}); 'seeded'`);
      await cdp.send("Page.navigate", { url: PAGE_URL });
    }
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash')`);
    }
    if (!ready) throw new Error("Editor chưa sẵn sàng sau 90s.");
    await cdp.send("Tracing.start", {
      categories: "devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,disabled-by-default-devtools.timeline.stack,blink,cc,gpu,media,loading,rail",
      options: "sampling-frequency=10000",
    });
    await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
    await sleep(DURATION * 1000);
    await cdp.send("Tracing.end");
    // Đợi dataCollected xả hết (2s).
    await sleep(2000);
    const timeEnd = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    cdp.close();
    const outPath = OUT ? path.resolve(ROOT, OUT) : path.resolve(ROOT, "benchmarks/results/preview-trace-r52.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    writeFileEpermRetry(outPath, JSON.stringify({ traceEvents: cdp.events }, null, 0));
    console.log(`[trace] events=${cdp.events.length} timeEnd=${timeEnd.trim()} -> ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)}KB)`);
  } finally {
    try { chrome.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
  }
}
main().catch((e) => { console.error(`[trace] LỖI: ${e.message}`); process.exit(1); });
