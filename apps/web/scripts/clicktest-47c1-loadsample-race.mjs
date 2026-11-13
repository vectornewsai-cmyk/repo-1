#!/usr/bin/env node
/**
 * clicktest-47c1-loadsample-race.mjs — Phase 9 đợt 47, luồng C1:
 * tái hiện race loadSample ghi đè project vừa mở (bug thật phát hiện ở
 * đợt 46 B1, LIMITS B1 §6.2) trên browser thật, rồi chứng minh vá đếm
 * thế hệ project (generation counter) đã bịt được nó.
 *
 * Luồng thật trên browser headed (Chromium local + Xvfb, CDP websocket
 * — KHÔNG dùng browser.browse), theo mẫu clicktest-46b1:
 *   1. Build app mới (vite build ra scratch ngoài repo) + static server
 *      cùng origin.
 *   2. Mở app: App mount gọi loadSample() async (buildSampleProject ghi
 *      2 clip webm bằng MediaRecorder, ~7-10 s trên VM này) KHI CHƯA có
 *      autosave. Trong lúc loadSample còn bay, mở ngay file .vcut.json
 *      thật (project chỉ có 1 clip chữ 10 s, tên "C1 race project") qua
 *      input ẩn của ProjectMenu bằng DataTransfer + dispatch change
 *      (đường B1 đã chứng minh; DOM.setFileInputFiles qua websocket CDP
 *      không dính ở setup này nên không dùng).
 *   3. Kiểm chứng (mỗi bước PASS/FAIL riêng):
 *      C1 app load; C2 nút Mở file dự án tồn tại;
 *      C3 mở file TRONG lúc loadSample đang bay: lúc đưa file, bin
 *         chưa có mau-1 và duration chưa phải 00:08.0 (chứng minh cửa
 *         sổ race đang mở); sau khi mở, duration thành 00:10.0 + tên
 *         "C1 race project" (chứng minh replaceProject đã chạy). Nếu
 *         sample đã sẵn sàng TRƯỚC khi đưa file thì cửa sổ race đã
 *         đóng — harness báo INVALID (exit 2), không được đọc thành
 *         pass (test sẽ rỗng vì không còn gì để revert).
 *      C4 project vừa mở KHÔNG bị revert trong 20 s sau khi mở (poll
 *         500 ms: duration luôn 00:10.0, tên luôn "C1 race project",
 *         bin không bao giờ có mau-1/mau-2). Trên code cũ: loadSample
 *         set cuối revert về mẫu 8 s + bin mau ở ~+6 s sau khi mở
 *         (B1 đo) → case này FAIL — đó là đỏ-trước.
 *      C5 autosave localStorage sau cửa sổ race vẫn chứa project vừa
 *         mở (name "C1 race project", clip C1TEXT), không phải mẫu.
 *         Trước khi poll, ngủ 7 s để mọi debounce autosave 5 s sau
 *         một lần revert (nếu có) đã kịp ghi — nếu không, case sẽ
 *         pass oan vì đọc autosave ngay lúc revert chưa kịp ghi đè
 *         (bẫy đã gặp ở lần chạy đỏ-trước đầu tiên: poll lần 1 vẫn
 *         thấy project mới). Poll tiếp tới 12 s.
 *      C6 nút "Tải lại dự án mẫu" (MediaBin) vẫn tải lại được sample
 *         sau đó — chứng minh loader không hỏng + cửa sổ race đã đóng
 *         thật (loadSample đã chạy xong trong lúc poll C4), nên C4
 *         pass không phải vì loadSample chưa bao giờ chạy. Để case
 *         không rỗng: trước khi bấm, reset về project trống bằng nút
 *         "Tạo dự án mới" (dialog xác nhận tự accept) rồi mới bấm nút
 *         mẫu và chờ sample xuất hiện (bin mau + 00:08.0, 25 s).
 *         Trên code cũ: nút chết (sampleLoading không bao giờ reset)
 *         → FAIL; kiểm tra trạng thái mẫu đã có sẵn trước khi bấm sẽ
 *         pass oan nên không dùng.
 *      C7 0 Runtime.exceptionThrown trong phiên.
 * KHÔNG sửa production code ngoài vá C1, KHÔNG push, KHÔNG tag/release,
 * KHÔNG binary vào repo. Scratch đo nằm ngoài repo (tmp-round47-c1-race).
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-47c1-loadsample-race.mjs
 * Biến môi trường: C1_DEBUG_PORT (mặc định 9401), C1_HTTP_PORT
 * (mặc định 4224), C1_SCRATCH (mặc định ~/workspace/tmp-round47-c1-race).
 * Exit 0 khi mọi case PASS, 1 khi có FAIL, 2 khi harness lỗi / INVALID.
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.C1_SCRATCH || path.join(os.homedir(), "workspace/tmp-round47-c1-race");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.C1_DEBUG_PORT || 9401);
const HTTP_PORT = Number(process.env.C1_HTTP_PORT || 4224);
const ORIGIN = `http://127.0.0.1:${HTTP_PORT}`;
const PROJECT_NAME = "C1 race project";
const SAMPLE_DUR = "00:08.0";
const RACE_DUR = "00:10.0";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = [];
function casePass(n, d) { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); }
function caseFail(n, d) { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); }

if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
fs.mkdirSync(SCRATCH, { recursive: true });

// ---- 0. File .vcut.json thật: 1 clip chữ 10 s, tên riêng biệt với mẫu ----
const projectFilePath = path.join(SCRATCH, "c1-race-project.vcut.json");
const envelope = {
  format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
  specVersion: "0.2.0", savedAt: new Date().toISOString(), name: PROJECT_NAME,
  spec: {
    version: "0.2.0",
    meta: { name: PROJECT_NAME, width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "t0", kind: "text", label: "Chữ 1", clips: [
      {
        kind: "text", id: "C1TEXT", text: "C1 race marker", start: 0, duration: 10,
        style: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 64, color: "#ffffff", bold: true, x: 0.5, y: 0.5, animation: "fadeUp" },
      },
    ] }],
  },
};
writeFileEpermRetry(projectFilePath, JSON.stringify(envelope, null, 2));
log(`ghi project file: ${projectFilePath} (1 clip chữ 10 s, tên "${PROJECT_NAME}")`);

// ---- 1. Build app mới ra scratch (không đụng apps/web/dist) ----
const distDir = path.join(SCRATCH, "dist");
log("vite build → " + distDir);
{
  const b = spawnSync(path.join(ROOT, "node_modules/.bin/vite"), ["build", "--outDir", distDir],
    { cwd: WEB_DIR, stdio: "pipe", encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (b.status !== 0) throw new Error("vite build lỗi: " + ((b.stderr || b.stdout || "")).slice(-2000));
  if (!fs.existsSync(path.join(distDir, "index.html"))) throw new Error("vite build xong nhưng thiếu dist/index.html");
  log("vite build OK");
}

// ---- 2. Static server cùng origin ----
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webm": "video/webm", ".wasm": "application/wasm" };
const server = createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
    if (urlPath === "/c1-project.vcut.json") { res.writeHead(200, { "Content-Type": "application/json" }); res.end(fs.readFileSync(projectFilePath)); return; }
    let file = path.join(distDir, urlPath === "/" ? "index.html" : urlPath);
    if (!file.startsWith(distDir)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(distDir, "index.html");
    const ext = path.extname(file);
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream", "Content-Length": fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(HTTP_PORT, "127.0.0.1", r));
log(`static server lên tại ${ORIGIN}`);

// ---- 3. CDP (websocket) + Xvfb + Chrome headed ----
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1; this.pending = new Map(); this.exceptions = 0;
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method: "Page.handleJavaScriptDialog", params: { accept: true } }));
        return;
      }
      if (msg.method === "Runtime.exceptionThrown") { this.exceptions++; return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
    return r.result.value;
  }
  async waitFor(fn, label, timeoutMs = 60000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(300); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const STATE_EXPR = `(() => {
  const tb = document.querySelector('.topbar');
  const tbText = tb ? tb.textContent : '';
  const nameInput = document.querySelector('.project-name');
  const bin = document.querySelector('.mediabin');
  const binText = bin ? bin.textContent : '';
  return {
    topbar: tbText,
    name: nameInput ? nameInput.value : null,
    hasRaceDur: tbText.includes(${JSON.stringify(RACE_DUR)}),
    hasSampleDur: tbText.includes(${JSON.stringify(SAMPLE_DUR)}),
    binHasMau: binText.includes('mau-1') || binText.includes('mau-2'),
    binText: binText.slice(0, 300),
  };
})()`;

let display = null, xvfbProc = null, chromeProc = null;
let harnessError = null;
function killAll() {
  try { chromeProc?.kill("SIGKILL"); } catch {}
  try { xvfbProc?.kill("SIGKILL"); } catch {}
  try { server.close(); } catch {}
}
process.on("exit", killAll);
try {
  for (const num of [97, 98, 99, 96, 95]) {
    const xv = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xv.exitCode === null) { display = `:${num}`; xvfbProc = xv; break; }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  log(`xvfb: DISPLAY=${display}`);
  const profile = path.join(SCRATCH, "cdprof-c1");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "c1-chrome.log"), "w");
  chromeProc = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${profile}`, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display } });
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try { const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); pageTarget = (pages || []).find((p) => p.type === "page") || null; } catch {}
    if (!pageTarget) await sleep(500);
  }
  if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");

  // C1: app load (profile mới → không autosave → App mount gọi loadSample)
  const tMount0 = Date.now();
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` });
  await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector('#root') && document.querySelector('#root').children.length > 0`), "React render lần đầu", 60000);
  await sleep(1200); // React mount + effect loadSample đã khởi động
  casePass("C1 app load", "React render #root có children");

  // C2: nút Mở file dự án tồn tại
  const openBtn = await cdp.evalJs(`!![...document.querySelectorAll('button')].find((b) => (b.title || '') === 'Mở file dự án (.vcut.json)')`);
  if (openBtn) casePass("C2 nút Mở file dự án", "tìm thấy button title 'Mở file dự án (.vcut.json)' trong TopBar/ProjectMenu");
  else caseFail("C2 nút Mở file dự án", "không tìm thấy button theo title");

  // C3: mở file TRONG lúc loadSample đang bay.
  // Ghi trạng thái ngay trước khi đưa file: sample phải CHƯA sẵn sàng
  // (bin chưa có mau + duration chưa phải 00:08.0) — nếu không, cửa sổ
  // race đã đóng trước khi mở, test rỗng → INVALID.
  const preState = await cdp.evalJs(STATE_EXPR);
  log(`trạng thái trước khi mở (t+${((Date.now() - tMount0) / 1000).toFixed(1)} s sau navigate): ${JSON.stringify(preState)}`);
  if (preState.binHasMau || preState.hasSampleDur) {
    throw new Error(`INVALID: sample đã sẵn sàng trước khi mở file (binHasMau=${preState.binHasMau}, hasSampleDur=${preState.hasSampleDur}) — cửa sổ race đã đóng, không đo được gì`);
  }
  const delivery = await cdp.evalJs(`(async () => {
    const text = await (await fetch('/c1-project.vcut.json')).text();
    const f = new File([text], 'c1-race-project.vcut.json', { type: 'application/json' });
    const el = document.querySelector('.project-menu input[accept=".vcut.json,.json,application/json"]');
    if (!el) return { ok: false, reason: 'không tìm thấy input file project' };
    const dt = new DataTransfer(); dt.items.add(f); el.files = dt.files;
    const assigned = el.files.length;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, assigned, filesAfterDispatch: el.files.length };
  })()`);
  log(`delivery DataTransfer: ${JSON.stringify(delivery)}`);
  if (!delivery.ok) { caseFail("C3 mở file trong lúc loadSample bay", delivery.reason); throw new Error(delivery.reason); }
  const tOpen = Date.now();
  // Chờ project mở: duration 00:10.0 + tên đúng (tối đa 10 s).
  let opened = null;
  for (let i = 0; i < 20 && !opened; i++) {
    const s = await cdp.evalJs(STATE_EXPR);
    if (s.hasRaceDur && s.name === PROJECT_NAME) opened = s;
    else await sleep(500);
  }
  if (opened) casePass("C3 mở file trong lúc loadSample bay", `mở xong ở t+${((Date.now() - tOpen) / 1000).toFixed(1)} s sau khi đưa file: duration ${RACE_DUR}, tên "${PROJECT_NAME}", sample chưa sẵn sàng lúc đưa (binHasMau=false)`);
  else caseFail("C3 mở file trong lúc loadSample bay", `sau 10 s không thấy duration ${RACE_DUR} + tên "${PROJECT_NAME}"`);

  // C4: project vừa mở KHÔNG bị revert trong 20 s sau khi mở.
  // Poll 500 ms: bất kỳ lần nào thấy duration mẫu / tên mẫu / bin mau
  // là revert (ghi thời điểm lần đầu thấy).
  let revertedAt = null, revertState = null;
  const POLL_MS = 20000;
  const tPoll0 = Date.now();
  while (Date.now() - tPoll0 < POLL_MS) {
    const s = await cdp.evalJs(STATE_EXPR);
    if (s.hasSampleDur || s.name === "Dự án mẫu" || s.binHasMau) {
      if (!revertedAt) { revertedAt = (Date.now() - tOpen) / 1000; revertState = s; }
      break;
    }
    if (!s.hasRaceDur || s.name !== PROJECT_NAME) {
      if (!revertedAt) { revertedAt = (Date.now() - tOpen) / 1000; revertState = s; }
      break;
    }
    await sleep(500);
  }
  if (!revertedAt) {
    const endState = await cdp.evalJs(STATE_EXPR);
    casePass("C4 project vừa mở không bị revert trong 20 s", `suốt ${(POLL_MS / 1000).toFixed(0)} s sau khi mở: duration luôn ${RACE_DUR}, tên luôn "${PROJECT_NAME}", bin không có mau (cuối: ${JSON.stringify(endState)})`);
  } else {
    caseFail("C4 project vừa mở không bị revert trong 20 s", `REVERT ở +${revertedAt.toFixed(1)} s sau khi mở: ${JSON.stringify(revertState)} (loadSample set cuối đã ghi đè project vừa mở)`);
  }

  // C5: autosave sau cửa sổ race vẫn chứa project vừa mở, không phải mẫu.
  // Ngủ 7 s TRƯỚC khi poll để debounce autosave 5 s sau một lần revert
  // (nếu có) đã kịp ghi đè — đọc ngay sẽ pass oan (bẫy lần chạy đầu).
  await sleep(7000);
  let autosaveOk = false, autosaveDetail = "không đọc được autosave";
  for (let i = 0; i < 24 && !autosaveOk; i++) {
    const raw = await cdp.evalJs(`localStorage.getItem('vcut-studio:autosave:v1')`);
    try {
      const env = JSON.parse(raw);
      const clips = (env?.spec?.tracks || []).flatMap((t) => t.clips || []);
      const hit = clips.find((c) => c.id === "C1TEXT");
      const sampleHit = clips.some((c) => typeof c.src === "string" && c.src.startsWith("mau-"));
      autosaveOk = !!hit && !sampleHit && env?.name === PROJECT_NAME;
      autosaveDetail = `autosave name=${env?.name} clips=${JSON.stringify(clips.map((c) => c.id || c.src))} (poll lần ${i + 1})`;
    } catch (e) { autosaveDetail = `parse autosave lỗi: ${e.message}`; }
    if (!autosaveOk) await sleep(500);
  }
  if (autosaveOk) casePass("C5 autosave sau cửa sổ race chứa project vừa mở", autosaveDetail);
  else caseFail("C5 autosave sau cửa sổ race chứa project vừa mở", autosaveDetail);

  // C6: nút "Dự án mẫu" vẫn tải lại được sample sau đó.
  // Chứng minh loader không hỏng + cửa sổ race đã đóng thật (loadSample
  // đã chạy xong trong lúc poll C4), nên C4 pass không phải vì
  // loadSample chưa bao giờ chạy. Để case không rỗng, reset về project
  // trống bằng nút "Tạo dự án mới" TRƯỚC khi bấm nút mẫu — nếu trạng
  // thái đã là mẫu sẵn thì bấm nút cũng pass oan (bẫy lần chạy đầu:
  // trên code cũ, sau revert trạng thái đã là mẫu nên C6 pass dù nút
  // chết).
  const resetNew = await cdp.evalJs(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.title || '') === 'Tạo dự án mới');
    if (!b) return { ok: false, reason: 'không tìm thấy nút Tạo dự án mới' };
    b.click();
    return { ok: true };
  })()`);
  if (!resetNew.ok) { caseFail("C6 nút Dự án mẫu tải lại được sample", "bước reset: " + resetNew.reason); }
  else {
    let emptied = null;
    for (let i = 0; i < 10 && !emptied; i++) {
      const s = await cdp.evalJs(STATE_EXPR);
      if (s.name === "Dự án mới" && !s.hasRaceDur && !s.hasSampleDur && !s.binHasMau) emptied = s;
      else await sleep(500);
    }
    if (!emptied) { caseFail("C6 nút Dự án mẫu tải lại được sample", "bước reset: sau 5 s không về project trống (tên Dự án mới, duration 00:00.0, bin rỗng)"); }
    else {
      const sampleBtn = await cdp.evalJs(`(() => {
        const b = [...document.querySelectorAll('button')].find((x) => (x.title || '') === 'Tải lại dự án mẫu');
        if (!b) return { ok: false, reason: 'không tìm thấy nút Tải lại dự án mẫu' };
        b.click();
        return { ok: true };
      })()`);
      if (!sampleBtn.ok) { caseFail("C6 nút Dự án mẫu tải lại được sample", sampleBtn.reason); }
      else {
        let sampleBack = null;
        for (let i = 0; i < 50 && !sampleBack; i++) {
          const s = await cdp.evalJs(STATE_EXPR);
          if (s.hasSampleDur && s.name === "Dự án mẫu" && s.binHasMau) sampleBack = s;
          else await sleep(500);
        }
        if (sampleBack) casePass("C6 nút Dự án mẫu tải lại được sample", `reset về trống rồi bấm nút: duration ${SAMPLE_DUR}, tên "Dự án mẫu", bin có mau (loadSample chạy lại được — guard đã reset)`);
        else caseFail("C6 nút Dự án mẫu tải lại được sample", `sau 25 s không thấy duration ${SAMPLE_DUR} + tên "Dự án mẫu" + bin mau (nút chết hoặc loader hỏng)`);
      }
    }
  }

  // C7: 0 exception
  if (cdp.exceptions === 0) casePass("C7 0 Runtime.exceptionThrown", "không có exception trong phiên");
  else caseFail("C7 0 Runtime.exceptionThrown", `${cdp.exceptions} exception`);
} catch (e) {
  harnessError = e;
  log(`HARNESS LỖI: ${e.message}`);
  if (results.length === 0) { console.log("\n== C1 clicktest: HARNESS ERROR =="); killAll(); process.exit(2); }
  log(`(ghi tiếp các case đã chạy, exit 2 vì harness lỗi — không được đọc thành pass đủ)`);
}
writeFileEpermRetry(path.join(SCRATCH, "c1-result.json"), JSON.stringify({ results, logLines }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n== C1 clicktest: ${results.length - failed.length}/${results.length} pass ==` + (harnessError ? " (HARNESS ERROR — exit 2)" : ""));
killAll();
process.exit(harnessError ? 2 : (failed.length > 0 ? 1 : 0));
