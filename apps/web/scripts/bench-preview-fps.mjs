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
import { writeFileEpermRetry } from "./eperm-retry.mjs";
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
const WINDOW_SIZE = arg("--window-size", "1440,900");
const DURATION = Number(arg("--duration", "10"));
const OUT = path.resolve(ROOT, arg("--out", "benchmarks/results/preview-fps.json"));
const SERVE = process.argv.includes("--serve");
// Đợt 52 I9 — đo preview FPS thật trên browser headed + project mẫu
// nhẹ/vừa/nặng (nợ P3 gap analysis §2.4):
// --headed: bỏ --headless=new (chạy dưới xvfb-run để có màn hình X;
//   headed thật trên VM này vẫn là Xvfb, không phải màn hình vật lý —
//   ghi rõ headed=xvfb trong JSON, đừng claim "màn hình thật").
// --profile <dir>: tái dùng Chrome user-data-dir (giữ IndexedDB media
//   mẫu + localStorage giữa các lần chạy; mặc định profile tạm mới).
// --seed-autosave <file>: ghi JSON autosave (serializeProject) vào
//   localStorage TRƯỚC khi app khôi phục, rồi reload — app sẽ restore
//   đúng project đó thay vì loadSample. File seed phải là autosave hợp
//   lệ (parseProjectText pass), nếu không app fallback loadSample và
//   result.seedLoaded=false (bench KHÔNG tự sửa seed).
// --dump-autosave <file>: sau khi editor sẵn sàng, đọc localStorage
//   autosave hiện tại ghi ra file (để làm gốc sinh seed vừa/nặng).
const HEADED = process.argv.includes("--headed");
const NO_PLAY = process.argv.includes("--no-play");
// Đợt 52 I9 — --hide-canvas: ẩn canvas preview (display:none) trước khi
// phát — đối chứng xem lớp raster/present của canvas có phải là điểm nghẽn
// không (ẩn canvas thì compositor bỏ qua raster lớp đó; vòng lặp vẫn vẽ
// lên canvas như thường, chỉ không hiện). FPS tăng vọt khi ẩn → nghẽn ở
// raster/present canvas; FPS không đổi → nghẽn ở chỗ khác.
const HIDE_CANVAS = process.argv.includes("--hide-canvas");
// Đợt 52 I9 — --warmup <giây>: chờ N giây sau khi bấm Phát mới bắt đầu
// đếm rAF. Tick ĐẦU sau khi bấm Phát có chi phí khởi động lớn (AudioContext
// + forceSeek + draw đầu — trace text-only đo được 1 tick 3,9s) nên đo
// ngay sau 1,5s sẽ lẫn chi phí khởi động vào FPS ổn định; warmup tách
// hai số này ra. Dùng kèm --duration ngắn để không chạy quá cuối project.
const WARMUP = Number(arg("--warmup", "0"));
const PROFILE = arg("--profile", "");
const SEED_AUTOSAVE = arg("--seed-autosave", "");
const DUMP_AUTOSAVE = arg("--dump-autosave", "");
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

// Đợt 52 I9 — đo tải CPU của cây tiến trình Chrome trong lúc đo FPS:
// cộng %CPU của mọi tiến trình có command chứa chrome-linux64/chrome
// (main + renderer + GPU + utility). Lấy mẫu mỗi 500ms; %CPU tính theo
// 1 core (100% = 1 core đầy), VM này có 4 core nên trần ~400%.
function sampleChromeCpuPct() {
  try {
    const out = spawnSync("ps", ["-eo", "%cpu=,args="], { encoding: "utf8" });
    if (out.status !== 0) return null;
    let sum = 0;
    for (const line of out.stdout.split("\n")) {
      if (line.includes("chrome-linux64/chrome")) {
        const v = parseFloat(line.trim());
        if (Number.isFinite(v)) sum += v;
      }
    }
    return Number(sum.toFixed(1));
  } catch { return null; }
}

// Đợt 52 I9 — load average 1 phút từ /proc/loadavg (null nếu đọc lỗi).
function loadAvg1() {
  try {
    const v = parseFloat(fs.readFileSync("/proc/loadavg", "utf8").trim().split(/\s+/)[0]);
    return Number.isFinite(v) ? v : null;
  } catch { return null; }
}

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
  const result = { url: PAGE_URL, durationSec: DURATION, warmupSec: WARMUP, windowSize: WINDOW_SIZE, chromium: CHROME, timestamp: new Date().toISOString(),
    headed: HEADED, headlessNote: HEADED ? "headed dưới Xvfb (không phải màn hình vật lý)" : "headless=new",
    profileReused: PROFILE || null, seedAutosave: SEED_AUTOSAVE || null,
    loadAvg1Before: loadAvg1(), cpuSamples: [] };
  let chrome = null;
  try {
    if (!(await waitUrlOk(PAGE_URL, SERVE ? 60000 : 5000))) {
      throw new Error(`Không tới được ${PAGE_URL} — hãy chạy vite dev server trước hoặc thêm --serve.`);
    }
    const dbgPort = 19000 + (process.pid % 1000);
    // Đợt 52 I9: --profile tái dùng user-data-dir (giữ IndexedDB +
    // localStorage); mặc định profile tạm mới như trước.
    const userData = PROFILE ? path.resolve(PROFILE) : fs.mkdtempSync(path.join(os.tmpdir(), "vcut-fps-"));
    if (PROFILE) fs.mkdirSync(userData, { recursive: true });
    chrome = spawn(CHROME, [
      ...(HEADED ? [] : ["--headless=new"]),
      "--no-sandbox", "--disable-dev-shm-usage",
      "--mute-audio", "--autoplay-policy=no-user-gesture-required",
      // Đợt 52 I9 — bộ cờ headed đã kiểm chứng chạy được dưới Xvfb trên VM
      // này: --disable-gpu (không dùng — làm Chrome headed không mở cổng
      // debug) mà dùng --disable-gpu-compositing + --no-first-run +
      // --remote-debugging-address (mẫu từ harness clicktest headed đợt 52).
      ...(HEADED ? ["--disable-gpu-compositing", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-position=0,0"] : []),
      "--window-size=" + WINDOW_SIZE, `--remote-debugging-port=${dbgPort}`,
      ...(HEADED ? ["--remote-debugging-address=127.0.0.1"] : []),
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
    // Đợt 52 I9 — seed autosave: ghi JSON vào localStorage rồi reload để
    // app khôi phục đúng project seed (thay vì loadSample). Ghi ngay sau
    // navigate đầu (bundle chưa kịp mount xong nên chưa đọc autosave);
    // reload lần 2 đảm bảo app đọc đúng seed dù lần 1 đã kịp mount.
    if (SEED_AUTOSAVE) {
      const seedRaw = fs.readFileSync(path.resolve(SEED_AUTOSAVE), "utf8");
      // JSON.parse ở Node trước để fail sớm nếu seed hỏng (exit 2).
      const seedParsed = JSON.parse(seedRaw);
      if (!seedParsed || typeof seedParsed !== "object" || !seedParsed.spec) {
        console.error(`[bench] --seed-autosave thiếu field spec, từ chối chạy (exit 2): ${SEED_AUTOSAVE}`);
        process.exit(2);
      }
      await sleep(800);
      await cdp.evaluate(`localStorage.setItem('vcut-studio:autosave:v1', ${JSON.stringify(seedRaw)}); 'seeded'`);
      await cdp.send("Page.navigate", { url: PAGE_URL });
      result.seedProjectName = seedParsed.spec.meta?.name ?? null;
      console.log(`[bench] đã seed autosave: ${SEED_AUTOSAVE} (project=${result.seedProjectName}, tracks=${(seedParsed.spec.tracks ?? []).length})`);
    }
    // Chờ splash biến mất + nút Phát xuất hiện (project mẫu load ~11s).
    let ready = false;
    for (let i = 0; i < 90 && !ready; i++) {
      await sleep(1000);
      ready = await cdp.evaluate(`!!document.querySelector('.tbtn.play') && !document.querySelector('.splash')`);
    }
    if (!ready) throw new Error("Hết 90s vẫn chưa thấy editor sẵn sàng (splash còn hoặc thiếu nút Phát).");
    // Đợt 52 I9 — dump autosave + kiểm tra project đã load đúng chưa
    // (tên project trong TopBar + số clip .tl-clip/.tl-adj-clip trên timeline).
    // Seed load đúng khi tên project khớp tên trong file seed; sai → số FPS
    // đo được là của project khác, phải loại (result.seedLoaded=false).
    if (DUMP_AUTOSAVE) {
      // Autosave ghi debounce 5s sau khi spec đổi nên có thể chưa có ngay
      // khi editor vừa sẵn sàng — chờ tối đa 15s.
      let autoRaw = "";
      for (let i = 0; i < 15 && !autoRaw; i++) {
        autoRaw = await cdp.evaluate(`localStorage.getItem('vcut-studio:autosave:v1') || ''`);
        if (!autoRaw) await sleep(1000);
      }
      if (!autoRaw) throw new Error("--dump-autosave: localStorage chưa có autosave sau khi editor sẵn sàng + chờ 15s.");
      fs.mkdirSync(path.dirname(path.resolve(DUMP_AUTOSAVE)), { recursive: true });
      writeFileEpermRetry(path.resolve(DUMP_AUTOSAVE), autoRaw + "\n");
      console.log(`[bench] autosave đã dump: ${DUMP_AUTOSAVE}`);
    }
    result.projectCheck = await cdp.evaluate(`(() => { const nameEl = document.querySelector('.project-name'); return { projectName: nameEl ? nameEl.value : null, clips: document.querySelectorAll('.tl-clip, .tl-adj-clip').length }; })()`);
    if (SEED_AUTOSAVE) {
      result.seedLoaded = result.projectCheck.projectName === result.seedProjectName;
      console.log(`[bench] seed check: projectName='${result.projectCheck.projectName}' (seed='${result.seedProjectName}') clips=${result.projectCheck.clips} -> seedLoaded=${result.seedLoaded}`);
      if (!result.seedLoaded) throw new Error(`Seed KHÔNG load đúng project (tên '${result.projectCheck.projectName}' ≠ seed '${result.seedProjectName}') — dừng để khỏi đo nhầm project.`);
    } else {
      console.log(`[bench] project đang mở: '${result.projectCheck.projectName}' clips=${result.projectCheck.clips}`);
    }
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
      writeFileEpermRetry(OUT, JSON.stringify(result, null, 2) + "\n");
      console.log(`[bench] hang-probe ok=${probeOk} wall=${probeWallMs}ms newSnapshots=${newFiles.length} -> ${OUT}`);
      if (frozenInvalid) console.log(`[bench] FROZEN INVALID: ${result.frozenDist.problems.join("; ")} — exit 3`);
      process.exitCode = probeOk ? (frozenInvalid ? 3 : 0) : 1;
      return;
    }
    const diagExpr = `(() => {
      const cv = document.querySelector('.preview-canvas');
      const wrap = document.getElementById('vcut-preview-wrap');
      const wr = wrap ? wrap.getBoundingClientRect() : null;
      const hold = window.__vcutHoldStats || null;
      const idle = window.__vcutPreviewIdle ? { ticks: window.__vcutPreviewIdle.ticks, sleeping: window.__vcutPreviewIdle.sleeping, pauseRetrySkipped: window.__vcutPreviewIdle.pauseRetrySkipped, seekFailureCount: window.__vcutPreviewIdle.seekFailureCount, tickErrors: window.__vcutPreviewIdle.tickErrors } : null;
      const raf = window.__vcutPreviewRaf ? { samples: window.__vcutPreviewRaf.samples.length } : null;
      // Longtask: nhiệm vụ main-thread >50ms — phân biệt "vẽ đắt" (nhiều
      // longtask, tổng thời gian lớn) với "thread bị đói CPU" (ít longtask
      // mà tick vẫn thưa).
      let longtasks = null;
      try { const es = performance.getEntriesByType('longtask'); longtasks = { count: es.length, totalMs: Math.round(es.reduce((a, e) => a + e.duration, 0)) }; } catch { longtasks = null; }
      return { canvas: cv ? { w: cv.width, h: cv.height } : null, wrapCss: wr ? { w: Math.round(wr.width), h: Math.round(wr.height) } : null, dpr: window.devicePixelRatio || 1, visibilityState: document.visibilityState, hold, idle, raf, longtasks };
    })()`;
    const diagBefore = await cdp.evaluate(diagExpr);
    result.diagBefore = diagBefore;
    if (HIDE_CANVAS) {
      await cdp.evaluate(`(function(){ const cv = document.querySelector('.preview-canvas'); if (cv) cv.style.display = 'none'; return !!cv; })()`);
      result.canvasHidden = true;
      console.log(`[bench] đã ẩn .preview-canvas (đối chứng raster)`);
    }
    // Đợt 66 T5: bỏ rafFrom (chỉ số tuyệt đối samples.length) — xem
    // previewRaf dưới: cắt theo timestamp, sửa bug n=0 (ring buffer
    // 5000 mẫu đẩy mẫu cũ, slice(from) rỗng khi buffer đã đầy).
    result.cpuChromePctBefore = sampleChromeCpuPct();
    const timeBefore = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    // Đợt 52 I9 — --no-play: đo rAF khi TẠM DỪNG (đối chứng: rAF thưa là do
    // đường phát hay do trang). Không bấm Phát thì bỏ qua kiểm tra playing.
    if (!NO_PLAY) {
      await cdp.evaluate(`document.querySelector('.tbtn.play').click()`);
      await sleep(1500 + WARMUP * 1000);
    }
    const pressed = await cdp.evaluate(`document.querySelector('.tbtn.play').getAttribute('aria-pressed')`);
    const timeAfter = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    const overlayBtn = await cdp.evaluate(`!![...document.querySelectorAll('button')].find(b => b.textContent.trim() === '📈 FPS')`);
    result.perfOverlayButton = overlayBtn;
    if (!NO_PLAY && pressed !== "true" && timeBefore === timeAfter) {
      throw new Error(`Bấm Phát không có tác dụng (aria-pressed=${pressed}, time-display không đổi).`);
    }
    result.playing = pressed === "true";
    result.noPlay = NO_PLAY;
    result.timeDisplay = { before: timeBefore.trim(), after: timeAfter.trim() };
    // Đo rAF trong MỘT evaluate duy nhất (awaitPromise): tránh mất trạng thái
    // nếu execution context đổi giữa 2 lần evaluate (lỗi gặp ở lần chạy trước).
    // Đợt 52 I9: đếm song song cả setInterval(16ms) — phân biệt "rAF bị bóp
    // riêng" (timer vẫn ~60Hz) với "renderer bị đói chung" (timer cũng bò).
    // Đợt 52 I9: lấy mẫu %CPU cây Chrome mỗi 500ms TRONG lúc đo.
    const cpuTimer = setInterval(() => { const v = sampleChromeCpuPct(); if (v !== null) result.cpuSamples.push(v); }, 500);
    let ts;
    try {
      ts = await cdp.evaluate(
        `new Promise((resolve) => { const ts = []; let timerN = 0; const timer = setInterval(() => { timerN++; }, 16); const start = performance.now(); const dur = ${DURATION * 1000}; (function loop(){ ts.push(performance.now()); if (performance.now() - start < dur) requestAnimationFrame(loop); else { clearInterval(timer); resolve({ ts, timerN }); } })(); })`,
        true,
        (DURATION + 60) * 1000,
      );
    } finally {
      clearInterval(cpuTimer);
    }
    // Đợt 52 I9: tách timerN khỏi mảng ts (tương thích file kết quả cũ chỉ có mảng).
    if (ts && typeof ts === "object" && Array.isArray(ts.ts)) {
      result.timer16HzCount = ts.timerN;
      result.timer16HzRate = Number((ts.timerN / DURATION).toFixed(1));
      ts = ts.ts;
    }
    const timeEnd = await cdp.evaluate(`(document.querySelector('.time-display')||{}).textContent || ''`);
    const hw = await cdp.evaluate(`navigator.hardwareConcurrency`).catch(() => null);
    result.diagAfter = await cdp.evaluate(diagExpr);
    // Đợt 52 I9 — phân tích gap/lost RIÊNG vòng preview từ hook __vcutPreviewRaf
    // (loại tick justWoke; lostMs = phần playhead mất do clamp dt 0.1s).
    // Đợt 66 T5 — BUG n=0 (nợ R64 §8.3, R65 §8 mục 4; cùng bug với
    // clicktest-64r3-fps-long.mjs): bản cũ cắt theo CHỈ SỐ TUYỆT ĐỐI
    // rafFrom = samples.length lúc diagBefore — nhưng samples là ring
    // buffer tối đa 5000 mẫu, buffer đã đầy từ lúc app chạy thì
    // slice(rafFrom) rỗng → { count: 0 } dù vòng preview vẫn tick.
    // Nay cắt theo TIMESTAMP: cửa sổ đo là [ts[0], ts[cuối]] — mảng ts
    // của vòng rAF riêng của bench, cùng đồng hồ performance.now() với
    // sample.t. Nếu ts chưa đủ mẫu thì trả count 0 kèm note (không
    // bịa số); kiểm tra ts.length < 10 ở dưới vẫn ném lỗi như cũ.
    const rafT0 = Array.isArray(ts) && ts.length ? ts[0] : null;
    const rafT1 = Array.isArray(ts) && ts.length ? ts[ts.length - 1] : null;
    result.previewRaf = await cdp.evaluate(`((t0, t1) => {
      const h = window.__vcutPreviewRaf; if (!h) return null;
      if (t0 === null || t1 === null) return { count: 0, note: "không có cửa sổ ts để cắt theo timestamp" };
      const s = h.samples.filter((x) => x.t >= t0 && x.t <= t1 && !x.justWoke);
      if (!s.length) return { count: 0 };
      const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
      const pct = (p) => Number(gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))].toFixed(1));
      const lost = s.reduce((a, x) => a + x.lostMs, 0);
      return { count: s.length, gapP50ms: pct(0.5), gapP95ms: pct(0.95), gapP99ms: pct(0.99), over100ms: s.filter((x) => x.gapMs > 100).length, lostMs: Math.round(lost), playheadStart: s[0].playhead, playheadEnd: s[s.length - 1].playhead };
    })(${rafT0}, ${rafT1})`);
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
    // Đợt 52 I9 — phân vị frame time + CPU/loadavg trong lúc đo.
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const ipct = (p) => sortedIntervals.length ? Number(sortedIntervals[Math.min(sortedIntervals.length - 1, Math.floor(p * sortedIntervals.length))].toFixed(1)) : null;
    result.frameTimeMs = { p5: ipct(0.05), p50: ipct(0.5), p95: ipct(0.95) };
    result.loadAvg1After = loadAvg1();
    const cpus = result.cpuSamples.filter((v) => Number.isFinite(v));
    result.cpuChromePct = cpus.length
      ? { samples: cpus.length, avg: Number((cpus.reduce((a, b) => a + b, 0) / cpus.length).toFixed(1)), max: Math.max(...cpus), note: "%CPU theo 1 core (100% = 1 core đầy); VM 4 core nên trần ~400%." }
      : null;
    result.hardwareConcurrency = hw;
    // S6: đóng băng dist — INVALID thì fps bị loại, exit 3 (như R2).
    const frozenInvalid = finishFrozenDist(result);
    if (frozenInvalid) console.log(`[bench] FROZEN INVALID: ${result.frozenDist.problems.join("; ")} — fps bị loại, exit 3`);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileEpermRetry(OUT, JSON.stringify(result, null, 2) + "\n");
    console.log(`[bench] frames=${result.frames} fpsAvg=${result.fpsAvg} fpsMin1s=${result.fpsMin1s} fpsMax1s=${result.fpsMax1s} drops>50ms=${result.dropsOver50ms} maxInterval=${result.maxIntervalMs}ms frameTime p5/p50/p95=${result.frameTimeMs.p5}/${result.frameTimeMs.p50}/${result.frameTimeMs.p95}ms cpuChrome avg/max=${result.cpuChromePct ? `${result.cpuChromePct.avg}/${result.cpuChromePct.max}%` : "n/a"} loadAvg ${result.loadAvg1Before}->${result.loadAvg1After} canvas=${result.diagAfter?.canvas ? `${result.diagAfter.canvas.w}x${result.diagAfter.canvas.h}` : "?"} wrap=${result.diagAfter?.wrapCss ? `${result.diagAfter.wrapCss.w}x${result.diagAfter.wrapCss.h}` : "?"} dpr=${result.diagAfter?.dpr ?? "?"}`);
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
    writeFileEpermRetry(OUT, JSON.stringify(result, null, 2) + "\n");
    console.error(`[bench] LỖI: ${result.error}`);
    process.exitCode = frozenInvalidOnError ? 3 : 1;
  } finally {
    try { chrome?.kill("SIGTERM"); } catch { /* noop */ }
    try { vite?.kill("SIGTERM"); } catch { /* noop */ }
  }
}

main();
