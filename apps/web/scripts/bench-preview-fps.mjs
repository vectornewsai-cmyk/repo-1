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
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { snapshotBundleFromDist } from "./cdp-bundle.mjs";
import { distManifest, verifyDistManifest, freezeDistCopy } from "./cdp-dist-freeze.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const PAGE_URL = arg("--url", "http://127.0.0.1:5173");
const DURATION = Number(arg("--duration", "10"));
const OUT = path.resolve(ROOT, arg("--out", "benchmarks/results/preview-fps.json"));
const SERVE = process.argv.includes("--serve");
// Đợt 37 T4 — --cdp-hang-probe (BENCH_CDP_HANG_PROBE=1): kích hoạt LIVE
// đường timeout snapshot của CHÍNH bench (nợ §3.6 đợt 36: trước đây
// bench chỉ ghi snapshot khi CDP timeout trong lúc đo thật, chưa từng
// xảy ra). Khi bật, sau khi editor sẵn sàng, bench gửi một evaluate
// promise không settle với timeout 5000ms, đợi timeout handler của
// chính Cdp.send() trong file này ghi snapshot bền, kiểm tra đúng 1
// file mới + bundle + pid, ghi result.hangProbe rồi DỪNG (không đo
// fps — lượt này không phải lượt đo fps, đừng trích fps từ nó).
// Đợt 38 U4 — --cdp-hang-probe-h2 (BENCH_CDP_HANG_PROBE_H2=1): cùng
// đường probe nhưng treo dạng H2 (while(true), renderer spin) thay vì
// H1 (promise không settle). H2 gửi qua chính Cdp.send() của bench,
// timeout 5000ms như H1; sau H2 renderer kẹt nên bench vẫn DỪNG ngay
// như H1 (không đo tiếp được — finally kill Chrome như thường lệ).
const CDP_HANG_PROBE_H2 = process.argv.includes("--cdp-hang-probe-h2") || process.env.BENCH_CDP_HANG_PROBE_H2 === "1";
const CDP_HANG_PROBE = process.argv.includes("--cdp-hang-probe") || process.env.BENCH_CDP_HANG_PROBE === "1" || CDP_HANG_PROBE_H2;
const CHROME =
  arg("--chrome", "") ||
  process.env.CHROME_BIN ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
// Đợt 32 O2 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs): module
// snapshot không phụ thuộc transport (pipe hay WebSocket), chỉ cần tiến
// trình Chrome do chính script này spawn; thư mục bền ngoài repo, ngoài
// /tmp: ~/workspace/vcut-cdp-hang-snapshots/bench-preview-fps/.
// Đợt 36 S6 — nối cdp-bundle.mjs cho bench (nợ §3.6 đợt 35; đợt 35 R5 cố
// tình chưa nối vì bench là script đo của luồng khác): khi chạy với
// --dist-dir <dir> (hoặc BENCH_DIST_DIR), bench ghi bundle thật đang đo
// vào snapshot treo (thay vì null → "not-captured") và đóng băng toàn
// bộ dist bằng manifest sha256 trước/sau (cdp-dist-freeze.mjs, theo mẫu
// pipe N2 / probe Q6-R2): manifest sau lệch manifest trước → kết quả
// ghi frozenDist.validity = "INVALID", fps bị loại, exit 3 (như R2).
// CAVEAT TRUNG THỰC: bundle/manifest này chỉ đúng nghĩa "bundle đang
// đo" khi PAGE_URL thật sự serve đúng distDir đó (vite preview của
// dist đó). Khi đo trên vite dev (mặc định, không đặt --dist-dir) thì
// bundle vẫn null → "not-captured" như cũ; nếu operator vẫn đặt
// --dist-dir trong khi đo dev thì bundle ghi ra chỉ là "dist trên đĩa
// lúc bắt đầu đo", KHÔNG phải bundle dev server đang serve — field
// frozenDist.servesDistAssumption trong JSON ghi rõ điều này, đừng
// trích dẫn bundle đó như bundle đã đo khi chạy dev.
// --frozen-copy-dir (BENCH_FROZEN_COPY_DIR): copy đóng băng kiểu pipe
// của distDir lúc khởi động (thư mục đích phải chưa tồn tại hoặc rỗng);
// manifest bản sao được kiểm tra bằng manifest nguồn ngay lúc copy.
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "bench-preview-fps");
const BENCH_DIST_DIR = arg("--dist-dir", "") || process.env.BENCH_DIST_DIR || "";
const BENCH_FROZEN_COPY_DIR = arg("--frozen-copy-dir", "") || process.env.BENCH_FROZEN_COPY_DIR || "";
const HANG_BUNDLE = BENCH_DIST_DIR ? snapshotBundleFromDist(BENCH_DIST_DIR) : null;
let FROZEN_START = null;
let FROZEN_COPY = null;
if (BENCH_DIST_DIR) {
  if (!fs.existsSync(path.join(BENCH_DIST_DIR, "index.html"))) {
    console.error(`[bench] --dist-dir thiếu index.html, từ chối chạy (exit 2): ${BENCH_DIST_DIR}`);
    process.exit(2);
  }
  FROZEN_START = distManifest(BENCH_DIST_DIR);
  console.log(`[bench] dist đóng băng: ${BENCH_DIST_DIR} bundle=${HANG_BUNDLE ? `${HANG_BUNDLE.bundle} sha=${HANG_BUNDLE.sha}` : "không xác định được (snapshot vẫn not-captured)"} files=${FROZEN_START.fileCount} manifest=${FROZEN_START.manifestSha256}`);
  if (BENCH_FROZEN_COPY_DIR) {
    FROZEN_COPY = freezeDistCopy(BENCH_DIST_DIR, BENCH_FROZEN_COPY_DIR);
    console.log(`[bench] bản sao đóng băng kiểu pipe: ${FROZEN_COPY.destDir} manifest=${FROZEN_COPY.manifest.manifestSha256}`);
  }
}
// Tính frozenDist cho JSON kết quả (gọi trước mỗi lần ghi OUT): khi không
// đặt --dist-dir thì validity "UNVERIFIED" như R2 (không claim cùng dist).
function finishFrozenDist(result) {
  if (!FROZEN_START) {
    result.frozenDist = { validity: "UNVERIFIED", note: "Không đặt --dist-dir/BENCH_DIST_DIR nên dist không được đóng băng; bundle snapshot (nếu có) vẫn là not-captured." };
    return false;
  }
  const checked = verifyDistManifest(BENCH_DIST_DIR, FROZEN_START);
  result.frozenDist = {
    validity: checked.valid ? "VALID" : "INVALID",
    valid: checked.valid,
    problems: checked.problems,
    distDir: path.resolve(BENCH_DIST_DIR),
    bundle: HANG_BUNDLE ? { name: HANG_BUNDLE.bundle, sha256_16: HANG_BUNDLE.sha, source: HANG_BUNDLE.source } : null,
    manifestBefore: FROZEN_START.manifestSha256,
    manifestAfter: checked.manifest.manifestSha256,
    fileCountBefore: FROZEN_START.fileCount,
    fileCountAfter: checked.manifest.fileCount,
    servesDistAssumption: "Bundle/manifest này chỉ là bundle đang đo khi PAGE_URL serve đúng distDir này (vite preview). Khi đo vite dev, đây chỉ là dist trên đĩa lúc bắt đầu đo.",
    ...(FROZEN_COPY ? { frozenCopyDir: FROZEN_COPY.destDir, frozenCopyManifest: FROZEN_COPY.manifest.manifestSha256 } : {}),
  };
  return !checked.valid;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Đợt 37 T4: liệt kê snapshot treo của chính bench (thư mục bền ngoài repo).
function listBenchSnapFiles() {
  try { return fs.readdirSync(CDP_HANG_OUT_DIR).filter((f) => f.endsWith(".json")).sort(); } catch { return []; }
}

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
    // Đợt 32 O2: tiến trình Chrome do main() spawn, gán sau khi spawn
    // (cdp.proc = chrome) để timeout handler chụp được snapshot proc/ps.
    this.proc = null;
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
      const t = setTimeout(() => {
        this.pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE, extra: { transport: "websocket", ...(HANG_BUNDLE ? { distDir: HANG_BUNDLE.dist } : {}) },
          });
          if (hangSnap.file) console.log(`[bench] CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else console.log(`[bench] CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { console.log(`[bench] CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
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
    cdp.proc = chrome;
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
    // Đợt 37 T4 — kích hoạt live đường timeout snapshot của chính bench.
    if (CDP_HANG_PROBE) {
      const snapBefore = listBenchSnapFiles();
      const probeStart = Date.now();
      let probeError = null;
      // U4: H2 = while(true) (awaitPromise false, như probe T4 đợt 37);
      // H1 = promise không settle (awaitPromise true). Cả hai đều treo
      // thật qua chính Cdp.send() của bench, timeout 5000ms.
      const probeExpr = CDP_HANG_PROBE_H2 ? "while(true){}" : "new Promise(()=>{})";
      const probeAwait = !CDP_HANG_PROBE_H2;
      try {
        await cdp.send("Runtime.evaluate", { expression: probeExpr, awaitPromise: probeAwait, returnByValue: true }, 5000);
        probeError = "RESOLVED-BẤT-NGỜ";
      } catch (e) { probeError = e instanceof Error ? e.message : String(e); }
      const probeWallMs = Date.now() - probeStart;
      const newFiles = listBenchSnapFiles().filter((f) => !snapBefore.includes(f));
      let snap = null;
      if (newFiles.length === 1) {
        try { snap = JSON.parse(fs.readFileSync(path.join(CDP_HANG_OUT_DIR, newFiles[0]), "utf8")); } catch { /* giữ null */ }
      }
      const bundleOk = HANG_BUNDLE
        ? snap?.bundle?.status === "captured" && snap?.bundle?.sha256_16 === HANG_BUNDLE.sha
        : snap?.bundle?.status === "not-captured";
      const probeOk = probeError === "CDP timeout: Runtime.evaluate"
        && newFiles.length === 1
        && snap?.method === "Runtime.evaluate" && snap?.timeoutMs === 5000
        && snap?.proc?.pid === chrome.pid && bundleOk;
      result.hangProbe = {
        mode: CDP_HANG_PROBE_H2 ? "controlled-hang-H2-busy-loop" : "controlled-hang-H1-promise-never-settles",
        timeoutMs: 5000, wallMs: probeWallMs, error: probeError, expression: probeExpr,
        snapshotFilesBefore: snapBefore.length, snapshotFilesNew: newFiles,
        snapshotFile: newFiles.length === 1 ? path.join(CDP_HANG_OUT_DIR, newFiles[0]) : null,
        snapshotBundle: snap?.bundle ?? null, snapshotProcPid: snap?.proc?.pid ?? null,
        chromePid: chrome.pid, distDir: BENCH_DIST_DIR || null, ok: probeOk,
      };
      // Snapshot treo là bằng chứng bền, KHÔNG xóa sau probe (kỷ luật
      // đợt 30/32: file còn thì log mất cũng không mất bằng chứng).
      cdp.close();
      const frozenInvalid = finishFrozenDist(result);
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
      console.log(`[bench] hang-probe ok=${probeOk} wall=${probeWallMs}ms newSnapshots=${newFiles.length} -> ${OUT}`);
      if (frozenInvalid) console.log(`[bench] FROZEN INVALID: ${result.frozenDist.problems.join("; ")} — exit 3`);
      process.exitCode = probeOk ? (frozenInvalid ? 3 : 0) : 1;
      return;
    }
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
    // S6: đóng băng dist — INVALID thì fps bị loại, exit 3 (như R2).
    const frozenInvalid = finishFrozenDist(result);
    if (frozenInvalid) console.log(`[bench] FROZEN INVALID: ${result.frozenDist.problems.join("; ")} — fps bị loại, exit 3`);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
    console.log(`[bench] frames=${result.frames} fpsAvg=${result.fpsAvg} fpsMin1s=${result.fpsMin1s} fpsMax1s=${result.fpsMax1s} drops>50ms=${result.dropsOver50ms} maxInterval=${result.maxIntervalMs}ms`);
    console.log(`[bench] overlay FPS button: ${overlayBtn ? "có" : "KHÔNG thấy"}; playing=${result.playing}; time ${result.timeDisplay.before} -> ${result.timeDisplay.after}`);
    console.log(`[bench] kết quả ghi ra ${OUT}`);
    if (frozenInvalid) process.exitCode = 3;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    // S6: cả đường lỗi cũng đối chiếu manifest — dist đổi giữa chừng
    // thì INVALID (exit 3) lấn lỗi đo thường (exit 1), như R2.
    const frozenInvalidOnError = finishFrozenDist(result);
    if (frozenInvalidOnError) console.log(`[bench] FROZEN INVALID: ${result.frozenDist.problems.join("; ")} — exit 3`);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
    console.error(`[bench] LỖI: ${result.error}`);
    process.exitCode = frozenInvalidOnError ? 3 : 1;
  } finally {
    try { chrome?.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
  }
}

main();
