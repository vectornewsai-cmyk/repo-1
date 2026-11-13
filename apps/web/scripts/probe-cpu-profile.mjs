#!/usr/bin/env node
/**
 * probe-cpu-profile.mjs — CPU profile vòng preview khi phát (Phase 9 đợt 52 I9).
 *
 * Dùng CDP Profiler (sampling) ghi 8s trong lúc phát project mẫu, rồi tổng
 * hợp self-time theo tên hàm/file. Mục đích: chỉ ra ĐÚNG hàm nào ăn
 * main-thread khi FPS chỉ ~1.5 (longtask observer đã thấy ~60% wall time
 * nằm trong task >50ms, nhưng chưa biết hàm nào).
 *
 * Dùng: node apps/web/scripts/probe-cpu-profile.mjs [--seed-autosave F]
 *        [--profile DIR] [--serve] [--url URL] [--duration 8]
 *        [--out benchmarks/results/preview-cpu-profile-r52.json]
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
const DURATION = Number(arg("--duration", "8"));
const OUT = arg("--out", "");
// Đợt 52 I9 — --preplay: phát "nháp" 1 lần (6s) rồi tạm dừng TRƯỚC khi
// bắt đầu profile — để AudioContext + media đã ấm, profile chỉ đo trạng
// thái ổn định (không lẫn chi phí khởi động của tick đầu ~2-4s).
const CHROME = arg("--chrome", "") || process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.addEventListener("message", (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
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

function shortUrl(u) {
  if (!u) return "(native)";
  const i = u.indexOf("/src/");
  return i >= 0 ? u.slice(i + 1) : u.replace(/^https?:\/\/[^/]+/, "");
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
  const userData = PROFILE ? path.resolve(PROFILE) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-prof-"));
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
    const PREPLAY = process.argv.includes("--preplay");
    if (PREPLAY) {
      await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
      await sleep(6000);
      await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
      await sleep(1000);
      console.log(`[profile] preplay xong, bắt đầu profile lần phát 2`);
    }
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.start");
    await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
    await sleep(DURATION * 1000);
    const { profile } = await cdp.send("Profiler.stop");
    const timeEnd = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    cdp.close();
    // Tổng hợp self-time: mỗi sample = 1 node tại thời điểm lấy mẫu.
    const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
    const counts = new Map();
    for (const id of profile.samples) counts.set(id, (counts.get(id) || 0) + 1);
    const total = profile.samples.length;
    const rows = [...counts.entries()].map(([id, n]) => {
      const node = nodes.get(id);
      const cf = node?.callFrame ?? {};
      return { fn: cf.functionName || "(anonymous)", url: shortUrl(cf.url || ""), line: cf.lineNumber ?? null, samples: n, pct: Number(((n / total) * 100).toFixed(1)) };
    }).sort((a, b) => b.samples - a.samples);
    // Gộp theo (fn + file) để hàm nhỏ lẻ không che top.
    const grouped = new Map();
    for (const r of rows) {
      const k = `${r.fn} @ ${r.url}:${r.line ?? "?"}`;
      const g = grouped.get(k) ?? { fn: r.fn, loc: `${r.url}:${r.line ?? "?"}`, samples: 0 };
      g.samples += r.samples;
      grouped.set(k, g);
    }
    const top = [...grouped.values()].map((g) => ({ ...g, pct: Number(((g.samples / total) * 100).toFixed(1)) })).sort((a, b) => b.samples - a.samples).slice(0, 25);
    // Tổng theo file.
    const byFile = new Map();
    for (const r of rows) byFile.set(r.url, (byFile.get(r.url) || 0) + r.samples);
    const topFiles = [...byFile.entries()].map(([url, samples]) => ({ url, samples, pct: Number(((samples / total) * 100).toFixed(1)) })).sort((a, b) => b.samples - a.samples).slice(0, 10);
    const result = {
      url: PAGE_URL, durationSec: DURATION, timestamp: new Date().toISOString(),
      seedAutosave: SEED_AUTOSAVE || null, timeDisplayEnd: timeEnd.trim(),
      samples: total, profileMs: profile.endTime - profile.startTime,
      topFunctions: top, topFiles,
    };
    console.log(`[profile] samples=${total} windowMs=${result.profileMs} timeEnd=${result.timeDisplayEnd}`);
    for (const t of top.slice(0, 15)) console.log(`  ${String(t.pct).padStart(5)}% ${t.samples}  ${t.fn} @ ${t.loc}`);
    console.log("  -- theo file --");
    for (const f of topFiles) console.log(`  ${String(f.pct).padStart(5)}% ${f.samples}  ${f.url}`);
    if (OUT) {
      const outPath = path.resolve(ROOT, OUT);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      writeFileEpermRetry(outPath, JSON.stringify(result, null, 2) + "\n");
      console.log(`[profile] ghi ra ${outPath}`);
    }
  } finally {
    try { chrome.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
  }
}
main().catch((e) => { console.error(`[profile] LỖI: ${e.message}`); process.exit(1); });
