#!/usr/bin/env node
/**
 * measure-1080p-proxy.mjs — Đợt 52 I9: đo preview FPS với clip 1080p, proxy ON vs OFF.
 *
 * VÌ SAO KHÔNG DÙNG bench-preview-fps.mjs: proxyUrl chỉ sống trong phiên
 * (setMediaProxy -> store bộ nhớ; manifest AssetStore KHÔNG lưu proxyUrl;
 * item khôi phục sau reload KHÔNG có `file` nên nút Proxy cũng không render).
 * Bench seed+reload sẽ làm mất proxy trước khi đo. Nên script này làm trọn
 * một phiên: seed project TRỐNG -> import file 1080p -> (arm proxy: chờ badge
 * "✓ PROXY 720p") -> bấm "＋ Thêm" đưa clip lên timeline tại playhead ->
 * bấm Phát -> đếm rAF 6s (cùng snippet đếm + timer 16ms như bench).
 *
 * Hai arm (mỗi arm 1 lần chạy Chrome riêng, cùng profile bench):
 *   proxy: file /tmp/clip1080p-proxy.mp4 (cùng nội dung clip1080p, tên khác
 *          để tránh trùng item đã restore), auto-proxy BẬT.
 *   orig:  file /tmp/clip1080p-orig.mp4, auto-proxy TẮT.
 * Kết quả: benchmarks/results/preview-fps-r52-1080p-{proxy,orig}.json
 * (cùng trường chính như bench: frames, fpsAvg, frameTimeMs, cpuChromePct,
 * timer16HzRate, loadAvg; thêm proxyOn + proxyBadgeVerified).
 * Yêu cầu: bridge 8787 + prod 4173 đang chạy. Không đưa file nào vào repo.
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PAGE_URL = arg("--url", "http://127.0.0.1:4173");
const PROFILE = arg("--profile", "/tmp/vcut-fps-r52-profile");
const DURATION = Number(arg("--duration", "6"));
const ARM = arg("--arm", "both"); // proxy | orig | both
const CHROME = process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const EMPTY_SEED = "/tmp/vcut-fps-r52-seeds/autosave-fps-empty.json";
const ARMS = {
  proxy: { file: "/tmp/clip1080p-proxy.mp4", autoProxy: true, out: "benchmarks/results/preview-fps-r52-1080p-proxy.json" },
  orig: { file: "/tmp/clip1080p-orig.mp4", autoProxy: false, out: "benchmarks/results/preview-fps-r52-1080p-orig.json" },
};
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");

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
      const t = setTimeout(() => reject(new Error("ws open timeout 30000ms")), 30000);
      this.ws.addEventListener("open", () => { clearTimeout(t); resolve(); }, { once: true });
      this.ws.addEventListener("error", (e) => { clearTimeout(t); reject(e); }, { once: true });
    });
  }
  send(method, params = {}, timeoutMs = 30000) {
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

function loadAvg1() {
  try { return Number(execSync("cat /proc/loadavg").toString().split(" ")[0]); } catch { return null; }
}
function sampleChromeCpuPct() {
  try {
    const out = execSync("ps -eo pid,ppid,pcpu,comm | grep -i chrome | awk '{s+=$3} END {print s}'").toString().trim();
    const v = parseFloat(out);
    return Number.isFinite(v) ? v : null;
  } catch { return null; }
}

async function runArm(name, cfg) {
  const fileName = path.basename(cfg.file);
  const result = {
    tool: "measure-1080p-proxy.mjs", arm: name, file: fileName, proxyOn: cfg.autoProxy,
    url: PAGE_URL, durationSec: DURATION, measuredAt: new Date().toISOString(),
    loadAvg1Before: loadAvg1(), cpuSamples: [],
  };
  const dbgPort = 19000 + (process.pid % 1000);
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--mute-audio",
    "--autoplay-policy=no-user-gesture-required", "--window-size=1440,900",
    `--remote-debugging-port=${dbgPort}`, `--user-data-dir=${PROFILE}`], { stdio: "ignore" });
  let cdp = null;
  try {
    let targets = [];
    for (let i = 0; i < 30 && targets.length === 0; i++) {
      await sleep(1000);
      try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json(); } catch { /* chưa lên */ }
    }
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("Không lấy được target page.");
    cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: PAGE_URL + "/" });
    // Seed project trống + cờ auto-proxy TRƯỚC khi app mount đọc (1 lần reload).
    const seedRaw = fs.readFileSync(EMPTY_SEED, "utf8");
    await sleep(800);
    await cdp.evaluate(`localStorage.setItem('vcut-studio:autosave:v1', ${JSON.stringify(seedRaw)}); localStorage.setItem('vcut-auto-proxy', '${cfg.autoProxy ? "1" : "0"}'); 'seeded'`);
    await cdp.send("Page.navigate", { url: PAGE_URL + "/" });
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash') && !!document.querySelector('.mediabin')`);
    }
    if (!ready) throw new Error("Editor chưa sẵn sàng sau 90s.");
    const proj = await cdp.evaluate(`(() => { const n = document.querySelector('.project-name'); return { name: n ? n.value : null, clips: document.querySelectorAll('.tl-clip, .tl-adj-clip').length }; })()`);
    if (proj.name !== "FPS-trống" || proj.clips !== 0) throw new Error(`Project trống không load đúng (name='${proj.name}' clips=${proj.clips}).`);
    console.log(`[${name}] project trống OK, import ${fileName} (auto-proxy=${cfg.autoProxy})...`);
    // Import file 1080p qua input MediaBin.
    const doc = await cdp.send("DOM.getDocument", { depth: 0 });
    const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type='file']" });
    if (!q.nodeId) throw new Error("Không tìm thấy input file của MediaBin.");
    await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [cfg.file] });
    // Chờ item xuất hiện; arm proxy chờ thêm badge ✓ PROXY 720p.
    const proxyBtnExpr = `(() => { const b = document.querySelector('[aria-label="Tạo proxy cho ${fileName}"]'); return b ? b.textContent.trim() : null; })()`;
    let itemSeen = false;
    let proxyBadge = null;
    // Đợt 52 I9: vòng chờ KHÔNG dừng khi item vừa xuất hiện — arm proxy phải
    // chờ tới khi badge thành "✓ PROXY" (tạo proxy mất vài chục giây); chỉ
    // thoát sớm khi badge báo lỗi hoặc (arm orig) đã settle.
    for (let i = 0; i < 60; i++) {
      await sleep(2000);
      const text = await cdp.evaluate(`document.body.innerText || ''`);
      itemSeen = text.includes(fileName);
      proxyBadge = await cdp.evaluate(proxyBtnExpr);
      if (cfg.autoProxy && proxyBadge && proxyBadge.includes("✓ PROXY")) break;
      if (cfg.autoProxy && proxyBadge && proxyBadge.includes("Proxy lỗi")) break;
      if (!cfg.autoProxy && itemSeen && i >= 2) break; // settle 4-6s: proxy không được tự tạo
    }
    if (!itemSeen) throw new Error(`Không thấy item ${fileName} sau 120s.`);
    result.proxyBadgeText = proxyBadge;
    result.proxyBadgeVerified = cfg.autoProxy ? !!(proxyBadge && proxyBadge.includes("✓ PROXY")) : !(proxyBadge && proxyBadge.includes("✓ PROXY"));
    if (!result.proxyBadgeVerified) throw new Error(`Trạng thái proxy không như kỳ vọng (arm=${name}, badge='${proxyBadge}').`);
    console.log(`[${name}] item OK, proxy badge='${proxyBadge}'. Thêm clip lên timeline...`);
    // Bấm "＋ Thêm" (add at playhead) của item MỚI NHẤT mang tên này
    // (import lặp sẽ để lại bản restore cũ không có `file` ở đầu danh sách;
    // item mới import luôn append cuối — lấy nút cuối để tránh bấm nhầm
    // bản restore không có proxy).
    const added = await cdp.evaluate(`(() => { const bs = [...document.querySelectorAll('[aria-label="Thêm vào timeline tại playhead: ${fileName}"]')]; const b = bs[bs.length - 1]; if (!b) return false; b.click(); return true; })()`);
    if (!added) throw new Error("Không tìm thấy nút Thêm của item.");
    let clips = 0;
    for (let i = 0; i < 15 && clips !== 1; i++) {
      await sleep(1000);
      clips = await cdp.evaluate(`document.querySelectorAll('.tl-clip, .tl-adj-clip').length`);
    }
    if (clips !== 1) throw new Error(`Timeline không có đúng 1 clip sau khi Thêm (clips=${clips}).`);
    result.timelineClips = clips;
    result.timeDisplay = { before: (await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`)).trim() };
    // Phát + đo rAF (cùng snippet như bench-preview-fps.mjs).
    const diagExpr = `(() => { const cv = document.querySelector('.preview-canvas'); const wrap = document.getElementById('vcut-preview-wrap'); const wr = wrap ? wrap.getBoundingClientRect() : null; return { canvas: cv ? { w: cv.width, h: cv.height } : null, wrapCss: wr ? { w: Math.round(wr.width), h: Math.round(wr.height) } : null, dpr: window.devicePixelRatio || 1, visibilityState: document.visibilityState }; })()`;
    result.diagBefore = await cdp.evaluate(diagExpr);
    await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
    await sleep(1500);
    const pressed = await cdp.evaluate(`document.querySelector('.tbtn.play').getAttribute('aria-pressed')`);
    result.playing = pressed === "true";
    if (!result.playing) throw new Error(`Bấm Phát không có tác dụng (aria-pressed=${pressed}).`);
    result.timeDisplay.afterPlay = (await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`)).trim();
    const cpuTimer = setInterval(() => { const v = sampleChromeCpuPct(); if (v !== null) result.cpuSamples.push(v); }, 500);
    let ts;
    try {
      ts = await cdp.evaluate(
        `new Promise((resolve) => { const ts = []; let timerN = 0; const timer = setInterval(() => { timerN++; }, 16); const start = performance.now(); const dur = ${DURATION * 1000}; (function loop(){ ts.push(performance.now()); if (performance.now() - start < dur) requestAnimationFrame(loop); else { clearInterval(timer); resolve({ ts, timerN }); } })(); })`,
        true, (DURATION + 60) * 1000,
      );
    } finally { clearInterval(cpuTimer); }
    if (ts && typeof ts === "object" && Array.isArray(ts.ts)) {
      result.timer16HzCount = ts.timerN;
      result.timer16HzRate = Number((ts.timerN / DURATION).toFixed(1));
      ts = ts.ts;
    }
    result.diagAfter = await cdp.evaluate(diagExpr);
    result.hardwareConcurrency = await cdp.evaluate(`navigator.hardwareConcurrency`).catch(() => null);
    result.timeDisplay.end = (await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`)).trim();
    cdp.close();
    if (!Array.isArray(ts) || ts.length < 10) throw new Error(`Bộ đếm rAF chỉ thu được ${Array.isArray(ts) ? ts.length : 0} mẫu.`);
    const intervals = [];
    for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);
    const spanMs = ts[ts.length - 1] - ts[0];
    const buckets = new Map();
    for (const t of ts) { const b = Math.floor((t - ts[0]) / 1000); buckets.set(b, (buckets.get(b) || 0) + 1); }
    const bucketFps = [...buckets.values()].filter((n) => n >= 5);
    result.frames = ts.length;
    result.fpsAvg = Number((((ts.length - 1) * 1000) / spanMs).toFixed(2));
    result.fpsMin1s = bucketFps.length ? Math.min(...bucketFps) : null;
    result.fpsMax1s = bucketFps.length ? Math.max(...bucketFps) : null;
    result.dropsOver50ms = intervals.filter((d) => d > 50).length;
    result.maxIntervalMs = Number(Math.max(...intervals).toFixed(1));
    const sorted = [...intervals].sort((a, b) => a - b);
    const ipct = (p) => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].toFixed(1)) : null;
    result.frameTimeMs = { p5: ipct(0.05), p50: ipct(0.5), p95: ipct(0.95) };
    result.loadAvg1After = loadAvg1();
    const cpus = result.cpuSamples.filter((v) => Number.isFinite(v));
    result.cpuChromePct = cpus.length
      ? { samples: cpus.length, avg: Number((cpus.reduce((a, b) => a + b, 0) / cpus.length).toFixed(1)), max: Math.max(...cpus), note: "%CPU theo 1 core (100% = 1 core đầy); VM 4 core nên trần ~400%." }
      : null;
    fs.mkdirSync(path.dirname(path.join(ROOT, cfg.out)), { recursive: true });
    writeFileEpermRetry(path.join(ROOT, cfg.out), JSON.stringify(result, null, 2) + "\n");
    console.log(`[${name}] frames=${result.frames} fpsAvg=${result.fpsAvg} frameTime p5/p50/p95=${result.frameTimeMs.p5}/${result.frameTimeMs.p50}/${result.frameTimeMs.p95}ms cpuChrome avg/max=${result.cpuChromePct ? `${result.cpuChromePct.avg}/${result.cpuChromePct.max}%` : "n/a"} timer16Hz=${result.timer16HzRate}/s loadAvg ${result.loadAvg1Before}->${result.loadAvg1After} time ${result.timeDisplay.before} -> ${result.timeDisplay.end} -> ${path.join(ROOT, cfg.out)}`);
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    fs.mkdirSync(path.dirname(path.join(ROOT, cfg.out)), { recursive: true });
    writeFileEpermRetry(path.join(ROOT, cfg.out), JSON.stringify(result, null, 2) + "\n");
    console.error(`[${name}] LỖI: ${result.error}`);
    process.exitCode = 1;
  } finally {
    try { cdp?.close(); } catch { /* noop */ }
    try { chrome?.kill("SIGTERM"); } catch { /* noop */ }
  }
}

async function main() {
  for (const [k, cfg] of Object.entries(ARMS)) {
    if (!fs.existsSync(cfg.file)) { console.error(`Thiếu file arm ${k}: ${cfg.file}`); process.exit(2); }
  }
  if (!fs.existsSync(CHROME)) { console.error(`Thiếu Chromium: ${CHROME}`); process.exit(2); }
  if (!fs.existsSync(EMPTY_SEED)) { console.error(`Thiếu empty seed: ${EMPTY_SEED}`); process.exit(2); }
  const arms = ARM === "both" ? ["proxy", "orig"] : [ARM];
  for (const a of arms) await runArm(a, ARMS[a]);
}
main();
