#!/usr/bin/env node
/**
 * clicktest-48d6-loadsample-overlap.mjs — Phase 9 đợt 48, luồng D6:
 * hai loadSample chồng nhau (retry có điều kiện) trên browser thật.
 *
 * Bối cảnh: đợt 47 C1 vá race loadSample bằng generation counter
 * (docs/PHASE9_ROUND47_C1_LOADSAMPLE_LIMITS.md §4.3): hai loadSample
 * chồng nhau thì lần 2 return ngay do guard sampleLoading; nếu lần 1
 * sau đó bị bỏ set do generation đổi thì không có lần nào load sample
 * cả — ý định bấm nút "Dự án mẫu" của user bị mất im lặng.
 * Đợt 48 D6 vá: lần gọi chồng được ghi nhớ (coalesce) + retry MỘT lượt
 * mới khi lượt đang bay xong, CHỈ khi (a) lượt vừa xong KHÔNG set được
 * (bị bỏ do đổi project hoặc ném lỗi) và (b) thế hệ không đổi kể từ khi
 * yêu cầu chồng tới (lần đổi project mới hơn sau lần bấm sẽ thắng).
 *
 * Luồng thật trên browser headed (Chromium local + Xvfb, CDP websocket
 * — KHÔNG dùng browser.browse), theo mẫu clicktest-47c1:
 *   1. Build app mới (vite build ra scratch ngoài repo) + static server
 *      cùng origin. D6_SKIP_BUILD=1 thì dùng lại dist đã build.
 *   2. Mở app: App mount gọi loadSample() (call1) khi chưa có autosave.
 *      Trong lúc call1 còn bay, mở file .vcut.json thật (project 1 clip
 *      chữ 10 s, tên "C1 race project") rồi bấm ngay nút "Tải lại dự án
 *      mẫu" (call2 → chồng nhau, được ghi nhớ).
 *   3. Kiểm chứng (mỗi bước PASS/FAIL riêng):
 *      D1 app load; D2 mở file TRONG lúc call1 bay (guard INVALID nếu
 *         sample đã sẵn sàng trước khi mở — cửa sổ race đã đóng);
 *      D3 bấm nút "Dự án mẫu" trong lúc call1 còn bay: ghi thời điểm
 *         bấm (phải < 5 s sau RENDER — buildSample đo được ~8-9 s sau
 *         render nên 5 s vẫn chắc chắn còn bay; nếu muộn hơn → INVALID)
 *         và trạng thái lúc bấm (sample chưa sẵn sàng). Nếu bấm sau khi
 *         call1 đã xong thì đó là loadSample mới thường, không chứng
 *         minh được đường chồng nhau.
 *      D4 (case phân biệt) retry chạy: project cuối là MẪU (duration
 *         00:08.0, tên "Dự án mẫu", bin có mau) trong 45 s. Trên code
 *         chưa vá D6: call2 bị drop, call1 bị bỏ set → project ở lại
 *         file vừa mở (00:10.0) → FAIL.
 *      D5 (case bảo vệ — lần đổi mới hơn thắng): từ trạng thái mẫu,
 *         bấm nút mẫu (call1 mới) rồi bấm lại ngay (call2 chồng), rồi
 *         mở file TRONG lúc call1 bay. Sau đó poll 20 s: project ở
 *         lại file vừa mở (00:10.0, "C1 race project", bin không mau)
 *         — retry phải bị bỏ vì generation đã đổi SAU lần bấm thứ 2.
 *         Trên cả code cũ và mới đều phải PASS (guard hồi quy: vá D6
 *         không được revert project user vừa mở).
 *      D6 autosave sau D5 vẫn chứa project vừa mở (name "C1 race
 *         project", clip C1TEXT, không clip mẫu). Ngủ 7 s trước khi
 *         poll như C1 C5 (bẫy đọc autosave quá sớm).
 *      D7 0 Runtime.exceptionThrown trong phiên.
 * KHÔNG sửa production code ngoài vá D6, KHÔNG push, KHÔNG tag/release,
 * KHÔNG binary vào repo. Scratch đo nằm ngoài repo (tmp-round48-d6-overlap).
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-48d6-loadsample-overlap.mjs
 * Biến môi trường: D6_DEBUG_PORT (mặc định 9402), D6_HTTP_PORT
 * (mặc định 4225), D6_SCRATCH (mặc định ~/workspace/tmp-round48-d6-overlap),
 * D6_SKIP_BUILD=1 để dùng lại dist đã build.
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
const SCRATCH = process.env.D6_SCRATCH || path.join(os.homedir(), "workspace/tmp-round48-d6-overlap");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.D6_DEBUG_PORT || 9402);
const HTTP_PORT = Number(process.env.D6_HTTP_PORT || 4225);
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
const projectFilePath = path.join(SCRATCH, "d6-race-project.vcut.json");
const envelope = {
  format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
  specVersion: "0.2.0", savedAt: new Date().toISOString(), name: PROJECT_NAME,
  spec: {
    version: "0.2.0",
    meta: { name: PROJECT_NAME, width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "t0", kind: "text", label: "Chữ 1", clips: [
      {
        kind: "text", id: "C1TEXT", text: "D6 overlap marker", start: 0, duration: 10,
        style: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 64, color: "#ffffff", bold: true, x: 0.5, y: 0.5, animation: "fadeUp" },
      },
    ] }],
  },
};
writeFileEpermRetry(projectFilePath, JSON.stringify(envelope, null, 2));
log(`ghi project file: ${projectFilePath} (1 clip chữ 10 s, tên "${PROJECT_NAME}")`);

// ---- 1. Build app mới ra scratch (không đụng apps/web/dist) ----
const distDir = path.join(SCRATCH, "dist");
if (process.env.D6_SKIP_BUILD === "1" && fs.existsSync(path.join(distDir, "index.html"))) {
  log("D6_SKIP_BUILD=1: dùng lại dist đã build");
} else {
  log("vite build → " + distDir);
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
    if (urlPath === "/d6-project.vcut.json") { res.writeHead(200, { "Content-Type": "application/json" }); res.end(fs.readFileSync(projectFilePath)); return; }
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

async function deliverRaceFile(cdp) {
  return cdp.evalJs(`(async () => {
    const text = await (await fetch('/d6-project.vcut.json')).text();
    const f = new File([text], 'd6-race-project.vcut.json', { type: 'application/json' });
    const el = document.querySelector('.project-menu input[accept=".vcut.json,.json,application/json"]');
    if (!el) return { ok: false, reason: 'không tìm thấy input file project' };
    const dt = new DataTransfer(); dt.items.add(f); el.files = dt.files;
    const assigned = el.files.length;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, assigned, filesAfterDispatch: el.files.length };
  })()`);
}

async function clickSampleButton(cdp) {
  return cdp.evalJs(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.title || '') === 'Tải lại dự án mẫu');
    if (!b) return { ok: false, reason: 'không tìm thấy nút Tải lại dự án mẫu' };
    b.click();
    return { ok: true };
  })()`);
}

async function waitOpened(cdp, timeoutMs = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await cdp.evalJs(STATE_EXPR);
    if (s.hasRaceDur && s.name === PROJECT_NAME) return { ok: true, secs: (Date.now() - t0) / 1000, state: s };
    await sleep(500);
  }
  return { ok: false, state: await cdp.evalJs(STATE_EXPR) };
}

let display = null, xvfbProc = null, chromeProc = null;
let harnessError = null;
function killAll() {
  try { chromeProc?.kill("SIGKILL"); } catch {}
  try { xvfbProc?.kill("SIGKILL"); } catch {}
  try { server.close(); } catch {}
}
process.on("exit", killAll);
try {
  for (const num of [93, 94, 92, 91, 90]) {
    const xv = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xv.exitCode === null) { display = `:${num}`; xvfbProc = xv; break; }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  log(`xvfb: DISPLAY=${display}`);
  const profile = path.join(SCRATCH, "cdprof-d6");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "d6-chrome.log"), "w");
  chromeProc = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${profile}`, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display } });
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try { const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); pageTarget = (pages || []).find((p) => p.type === "page") || null; } catch {}
    if (!pageTarget) await sleep(500);
  }
  if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");

  // D1: app load (profile mới → không autosave → App mount gọi loadSample = call1)
  const tMount0 = Date.now();
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` });
  await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector('#root') && document.querySelector('#root').children.length > 0`), "React render lần đầu", 60000);
  // Đợt 48 D6 (sửa guard thời gian): buildSampleProject chạy từ mount
  // effect, tức từ lúc React render — KHÔNG phải từ lúc navigate. Thời
  // gian Chrome cold-start/render lần đầu dao động 1,6–4 s giữa các lượt
  // (máy 2vCPU, có lúc luồng khác chạy song song), nên guard "bấm < 6 s
  // sau navigate" vừa sai mốc vừa quá chặt (2 lượt đỏ INVALID oan ở
  // t+6,1 s / t+6,3 s dù lần bấm chỉ cách render ~2,3 s, còn cách lúc
  // build xong ~6-7 s). Guard đúng: bấm < 5 s sau RENDER — build đo
  // được ~8-9 s sau render (C1 revert ở +8,1 s sau khi mở, mở ở
  // render+~1,2 s; D4 xanh: mẫu ở bấm+15,1 s = call1 xong ~bấm+8 s +
  // retry build ~7 s), nên 5 s còn dư ≥ 3 s biên an toàn.
  const tRender = Date.now();
  await sleep(1200); // React mount + effect loadSample đã khởi động
  casePass("D1 app load", "React render #root có children");

  // D2: mở file TRONG lúc call1 (mount loadSample) đang bay.
  const preState = await cdp.evalJs(STATE_EXPR);
  log(`trạng thái trước khi mở (t+${((Date.now() - tMount0) / 1000).toFixed(1)} s sau navigate): ${JSON.stringify(preState)}`);
  if (preState.binHasMau || preState.hasSampleDur) {
    throw new Error(`INVALID: sample đã sẵn sàng trước khi mở file (binHasMau=${preState.binHasMau}, hasSampleDur=${preState.hasSampleDur}) — cửa sổ race đã đóng, không đo được gì`);
  }
  const delivery = await deliverRaceFile(cdp);
  log(`delivery DataTransfer: ${JSON.stringify(delivery)}`);
  if (!delivery.ok) { caseFail("D2 mở file trong lúc loadSample bay", delivery.reason); throw new Error(delivery.reason); }
  const tOpen = Date.now();
  const opened = await waitOpened(cdp);
  if (opened.ok) casePass("D2 mở file trong lúc loadSample bay", `mở xong ở t+${opened.secs.toFixed(1)} s sau khi đưa file: duration ${RACE_DUR}, tên "${PROJECT_NAME}", sample chưa sẵn sàng lúc đưa (binHasMau=false)`);
  else caseFail("D2 mở file trong lúc loadSample bay", `sau 10 s không thấy duration ${RACE_DUR} + tên "${PROJECT_NAME}": ${JSON.stringify(opened.state)}`);

  // D3: bấm nút "Dự án mẫu" trong lúc call1 còn bay (call2 chồng nhau).
  // Guard: thời điểm bấm phải < 6 s sau navigate (buildSample đo được
  // ~7-10 s, C1 revert ở +8,1 s sau khi mở) — nếu muộn hơn, call1 có thể
  // đã xong và lần bấm này là loadSample mới thường, không chứng minh
  // được đường chồng nhau → INVALID.
  const tClick = (Date.now() - tMount0) / 1000;
  const tClickAfterRender = (Date.now() - tRender) / 1000;
  const preClick = await cdp.evalJs(STATE_EXPR);
  log(`trạng thái lúc bấm nút mẫu (t+${tClick.toFixed(1)} s sau navigate, t+${tClickAfterRender.toFixed(1)} s sau render): ${JSON.stringify(preClick)}`);
  if (tClickAfterRender >= 5) {
    throw new Error(`INVALID: bấm nút mẫu ở t+${tClickAfterRender.toFixed(1)} s sau render (>= 5 s) — call1 mount có thể đã xong, lần bấm không chắc còn chồng nhau`);
  }
  if (preClick.binHasMau || preClick.hasSampleDur) {
    throw new Error(`INVALID: sample đã sẵn sàng lúc bấm nút mẫu — call1 đã xong, lần bấm không còn chồng nhau`);
  }
  const clicked = await clickSampleButton(cdp);
  if (!clicked.ok) { caseFail("D3 bấm nút Dự án mẫu trong lúc loadSample bay", clicked.reason); throw new Error(clicked.reason); }
  casePass("D3 bấm nút Dự án mẫu trong lúc loadSample bay", `bấm ở t+${tClick.toFixed(1)} s sau navigate (t+${tClickAfterRender.toFixed(1)} s sau render), sample chưa sẵn sàng lúc bấm (binHasMau=false, hasSampleDur=false) — call2 chồng lên call1 đang bay`);

  // D4 (case phân biệt): retry chạy → project cuối là MẪU trong 45 s.
  // Trên code chưa vá D6: call2 bị drop + call1 bị bỏ set → project ở
  // lại file vừa mở (00:10.0) suốt 45 s → FAIL.
  let sampleBack = null; const tD4 = Date.now();
  for (let i = 0; i < 90 && !sampleBack; i++) {
    const s = await cdp.evalJs(STATE_EXPR);
    if (s.hasSampleDur && s.name === "Dự án mẫu" && s.binHasMau) sampleBack = s;
    else await sleep(500);
  }
  if (sampleBack) casePass("D4 retry chạy — project cuối là mẫu", `mẫu xuất hiện sau ${((Date.now() - tD4) / 1000).toFixed(1)} s kể từ lúc bấm nút (t+${((Date.now() - tMount0) / 1000).toFixed(1)} s sau navigate): duration ${SAMPLE_DUR}, tên "Dự án mẫu", bin có mau — call2 chồng nhau không bị mất`);
  else {
    const endState = await cdp.evalJs(STATE_EXPR);
    caseFail("D4 retry chạy — project cuối là mẫu", `sau 45 s không thấy mẫu: ${JSON.stringify(endState)} (call2 chồng nhau đã bị mất — project vẫn là file vừa mở)`);
  }

  // D5 (case bảo vệ — lần đổi mới hơn thắng): từ trạng thái mẫu, bấm nút
  // mẫu (call1 mới) rồi bấm lại ngay (call2 chồng), rồi mở file TRONG
  // lúc call1 bay. Poll 20 s: project ở lại file vừa mở, không revert.
  const c1 = await clickSampleButton(cdp);
  if (!c1.ok) { caseFail("D5 lần đổi mới hơn thắng (không revert)", "bấm lần 1: " + c1.reason); }
  else {
    await sleep(300);
    const c2 = await clickSampleButton(cdp);
    if (!c2.ok) { caseFail("D5 lần đổi mới hơn thắng (không revert)", "bấm lần 2: " + c2.reason); }
    else {
      const tClick2 = (Date.now() - tMount0) / 1000;
      const d2 = await deliverRaceFile(cdp);
      if (!d2.ok) { caseFail("D5 lần đổi mới hơn thắng (không revert)", "mở file: " + d2.reason); }
      else {
        const opened2 = await waitOpened(cdp);
        if (!opened2.ok) { caseFail("D5 lần đổi mới hơn thắng (không revert)", `mở file lần 2 không xong: ${JSON.stringify(opened2.state)}`); }
        else {
          log(`D5: mở file lần 2 xong ở t+${tClick2.toFixed(1)} s sau navigate (call1 mới bấm trước đó ~1 s, call2 chồng ngay sau)`);
          let revertedAt = null, revertState = null;
          const POLL_MS = 20000; const tPoll0 = Date.now();
          while (Date.now() - tPoll0 < POLL_MS) {
            const s = await cdp.evalJs(STATE_EXPR);
            if (s.hasSampleDur || s.name === "Dự án mẫu" || s.binHasMau) { revertedAt = (Date.now() - tPoll0) / 1000; revertState = s; break; }
            if (!s.hasRaceDur || s.name !== PROJECT_NAME) { revertedAt = (Date.now() - tPoll0) / 1000; revertState = s; break; }
            await sleep(500);
          }
          if (!revertedAt) casePass("D5 lần đổi mới hơn thắng (không revert)", `suốt 20 s sau khi mở file lần 2: duration luôn ${RACE_DUR}, tên luôn "${PROJECT_NAME}", bin không có mau — retry đã bị bỏ đúng vì generation đổi SAU lần bấm thứ 2`);
          else caseFail("D5 lần đổi mới hơn thắng (không revert)", `REVERT ở +${revertedAt.toFixed(1)} s sau khi mở file lần 2: ${JSON.stringify(revertState)} (retry đã ghi đè project user vừa mở)`);
        }
      }
    }
  }

  // D6: autosave sau D5 vẫn chứa project vừa mở, không phải mẫu.
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
  if (autosaveOk) casePass("D6 autosave sau D5 chứa project vừa mở", autosaveDetail);
  else caseFail("D6 autosave sau D5 chứa project vừa mở", autosaveDetail);

  // D7: 0 exception
  if (cdp.exceptions === 0) casePass("D7 0 Runtime.exceptionThrown", "không có exception trong phiên");
  else caseFail("D7 0 Runtime.exceptionThrown", `${cdp.exceptions} exception`);
} catch (e) {
  harnessError = e;
  log(`HARNESS LỖI: ${e.message}`);
  if (results.length === 0) { console.log("\n== D6 clicktest: HARNESS ERROR =="); killAll(); process.exit(2); }
  log(`(ghi tiếp các case đã chạy, exit 2 vì harness lỗi — không được đọc thành pass đủ)`);
}
writeFileEpermRetry(path.join(SCRATCH, "d6-result.json"), JSON.stringify({ results, logLines }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n== D6 clicktest: ${results.length - failed.length}/${results.length} pass ==` + (harnessError ? " (HARNESS ERROR — exit 2)" : ""));
killAll();
process.exit(harnessError ? 2 : (failed.length > 0 ? 1 : 0));
