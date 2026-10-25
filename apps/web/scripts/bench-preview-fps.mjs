#!/usr/bin/env node
/**
 * bench-preview-fps.mjs — Đo FPS preview THẬT trên Chromium headless (Phase 9 R3).
 *
 * Cách đo: mở editor, chờ project mẫu load, bấm nút Phát (.tbtn.play),
 * đếm requestAnimationFrame trong N giây rồi tính FPS trung bình, FPS thấp
 * nhất theo cửa sổ 1s, và số frame giật (khoảng cách > 50ms).
 *
 * Khác với bench-preview-perf.cjs (đo hàm thuần bằng Node, KHÔNG phải FPS
 * trình duyệt): đây là số đo trên trình duyệt thật, nhưng vẫn có giới hạn:
 * - Headless Chromium decode video bằng phần mềm, không có màn hình thật —
 *   số này là THAM CHIẾU, không đồng nhất FPS trên máy người dùng.
 * - rAF headless vẫn bị giới hạn bởi nhịp compositor (~60Hz), nên FPS đo
 *   được không vượt quá nhịp đó dù máy mạnh hơn.
 * Xem R3_LIMITS.md để biết cách trích dẫn đúng.
 *
 * Dùng: node apps/web/scripts/bench-preview-fps.mjs [--url PAGE_URL]
 *        [--duration 10] [--out benchmarks/results/preview-fps.json]
 *        [--serve] [--chrome PATH]
 * --serve: tự chạy `vite` dev server rồi tắt khi xong. Mặc định KHÔNG tự
 * chạy — script chỉ đo PAGE_URL đã có (tránh tranh port với dev server khác).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PAGE_URL = arg("--url", "http://127.0.0.1:5173");
const DURATION = Number(arg("--duration", "10"));
const OUT = path.resolve(ROOT, arg("--out", "benchmarks/results/preview-fps.json"));
const SERVE = process.argv.includes("--serve");
const CHROME =
  arg("--chrome", "") ||
  process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUrlOk(url, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* chưa lên */ }
    await sleep(1000);
  }
  return false;
}

/** Client CDP tối thiểu qua WebSocket có sẵn của Node. */
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
  send(method, params = {}, timeoutMs = 30000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(t); resolve(v); },
        reject: (e) => { clearTimeout(t); reject(e); },
      });
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

async function main() {
  if (!fs.existsSync(CHROME)) {
    console.error(`Không tìm thấy Chromium tại ${CHROME} (đặt --chrome hoặc CHROME_BIN).`);
    process.exit(2);
  }
  let vite = null;
  if (SERVE) {
    const port = new URL(PAGE_URL).port || "5173";
    console.log(`[bench] tự chạy vite trên port ${port}...`);
    // Chạy trực tiếp binary vite trong repo (spawn không tìm thấy npx qua
    // PATH trong một số môi trường thực thi, dù shell vẫn thấy npx).
    const viteBin = path.join(ROOT, "node_modules/.bin/vite");
    // --host 127.0.0.1 là bắt buộc: vite mặc định bind "localhost" nhưng trên
    // VM này localhost chỉ nghe IPv6 (::1) nên fetch tới 127.0.0.1 thất bại.
    const [cmd, args] = fs.existsSync(viteBin)
      ? [viteBin, ["--port", port, "--strictPort", "--host", "127.0.0.1"]]
      : ["npx", ["vite", "--port", port, "--strictPort", "--host", "127.0.0.1"]];
    vite = spawn(cmd, args, {
      cwd: path.join(ROOT, "apps/web"), stdio: "ignore",
    });
  }
  const result = { url: PAGE_URL, durationSec: DURATION, chromium: CHROME, timestamp: new Date().toISOString() };
  let chrome = null;
  try {
    if (!(await waitUrlOk(PAGE_URL, SERVE ? 60000 : 5000))) {
      throw new Error(`Không tới được ${PAGE_URL} — hãy chạy vite dev server trước hoặc thêm --serve.`);
    }
    const dbgPort = 19000 + (process.pid % 1000);
    const userData = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-fps-"));
    chrome = spawn(CHROME, [
      "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
      "--mute-audio", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", `--remote-debugging-port=${dbgPort}`,
      `--user-data-dir=${userData}`,
    ], { stdio: "ignore" });
    let targets = [];
    for (let i = 0; i < 30 && targets.length === 0; i++) {
      await sleep(1000);
      try { targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json(); } catch { /* chưa lên */ }
    }
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("Không lấy được target page từ Chromium.");
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: PAGE_URL });
    // Chờ splash biến mất + nút Phát xuất hiện (project mẫu load ~11s).
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash')`);
    }
    if (!ready) throw new Error("Hết 90s vẫn chưa thấy editor sẵn sàng (splash còn hoặc thiếu nút Phát).");
    const timeBefore = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
    await sleep(1500);
    const pressed = await cdp.evaluate(`document.querySelector('.tbtn.play').getAttribute('aria-pressed')`);
    const timeAfter = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    const overlayBtn = await cdp.evaluate(`!![...document.querySelectorAll('button')].find(b => b.textContent.trim() === '📈 FPS')`);
    result.perfOverlayButton = overlayBtn;
    if (pressed !== "true" && timeBefore === timeAfter) {
      throw new Error(`Bấm Phát không có tác dụng (aria-pressed=${pressed}, time-display không đổi).`);
    }
    result.playing = pressed === "true";
    result.timeDisplay = { before: timeBefore.trim(), after: timeAfter.trim() };
    // Đo rAF trong MỘT evaluate duy nhất (awaitPromise): tránh mất trạng thái
    // nếu execution context đổi giữa 2 lần evaluate (lỗi gặp ở lần chạy trước).
    const ts = await cdp.evaluate(
      `new Promise((resolve) => { const ts = []; const start = performance.now(); const dur = ${DURATION * 1000}; (function loop(){ ts.push(performance.now()); if (performance.now() - start < dur) requestAnimationFrame(loop); else resolve(ts); })(); })`,
      true,
      (DURATION + 60) * 1000,
    );
    const timeEnd = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    const hw = await cdp.evaluate(`navigator.hardwareConcurrency`).catch(() => null);
    cdp.close();
    if (!Array.isArray(ts) || ts.length < 10) throw new Error(`Bộ đếm rAF chỉ thu được ${Array.isArray(ts) ? ts.length : 0} mẫu.`);
    const intervals = [];
    for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);
    const spanMs = ts[ts.length - 1] - ts[0];
    result.timeDisplay.end = timeEnd.trim();
    const buckets = new Map();
    for (const t of ts) {
      const b = Math.floor((t - ts[0]) / 1000);
      buckets.set(b, (buckets.get(b) || 0) + 1);
    }
    const bucketFps = [...buckets.values()].filter((n) => n >= 5);
    result.frames = ts.length;
    result.fpsAvg = Number((((ts.length - 1) * 1000) / spanMs).toFixed(2));
    result.fpsMin1s = bucketFps.length ? Math.min(...bucketFps) : null;
    result.fpsMax1s = bucketFps.length ? Math.max(...bucketFps) : null;
    result.dropsOver50ms = intervals.filter((d) => d > 50).length;
    result.maxIntervalMs = Number(Math.max(...intervals).toFixed(1));
    result.hardwareConcurrency = hw;
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
    console.log(`[bench] frames=${result.frames} fpsAvg=${result.fpsAvg} fpsMin1s=${result.fpsMin1s} fpsMax1s=${result.fpsMax1s} drops>50ms=${result.dropsOver50ms} maxInterval=${result.maxIntervalMs}ms`);
    console.log(`[bench] overlay FPS button: ${overlayBtn ? "có" : "KHÔNG thấy"}; playing=${result.playing}; time ${result.timeDisplay.before} -> ${result.timeDisplay.after}`);
    console.log(`[bench] kết quả ghi ra ${OUT}`);
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
    console.error(`[bench] LỖI: ${result.error}`);
    process.exitCode = 1;
  } finally {
    try { chrome?.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
  }
}

main();
