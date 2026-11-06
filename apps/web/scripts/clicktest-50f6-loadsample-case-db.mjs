#!/usr/bin/env node
/**
 * clicktest-50f6-loadsample-case-db.mjs — Phase 9 đợt 50, luồng F6:
 * loadSample CASE D+B: call1 ném lỗi + user đổi project SAU lần bấm,
 * trên browser thật.
 *
 * Bối cảnh: đợt 49 E6 đo case D thuần (call1 ném lỗi + call2 chồng nhau,
 * không ai đổi project → retry chạy, mẫu về sau ~11,5–12,4 s sau khi bấm;
 * docs/PHASE9_ROUND49_E6_LOADSAMPLE_LIMITS.md §4.3 ghi rõ tổ hợp D+B
 * "chỉ có khóa ở tầng logic thuần", chưa đo trên browser thật). Case D+B:
 * call1 ném lỗi + user đổi project sau lần bấm chồng → retry PHẢI KHÔNG
 * chạy (lần đổi mới hơn thắng; retry sẽ revert project user vừa mở).
 * Tầng logic thuần đã khóa ở test Node E6 ("luồng đầy đủ case B":
 * finish(false, genMới) = false); harness này khóa trên browser thật.
 *
 * Cách ép call1 ném lỗi: Y HỆT E6 (không đổi production, chỉ can thiệp
 * ở tầng test): ghi đè HTMLCanvasElement.prototype.getContext qua
 * Page.addScriptToEvaluateOnNewDocument — chỉ canvas đúng 640×360, chỉ
 * lần gọi #2 và #3 trả null:
 *   #1 = recordSample variant 0 → chạy bình thường 4 s;
 *   #2 = recordSample variant 1 → null → recordSample trả null;
 *   #3 = stillSample variant 1 → null → drawSampleFrame ném TypeError
 *        → buildSampleProject ném → call1 ném lỗi ở ~render+4 s.
 * Lỗi ép nhân tạo, không phải failure mode thực tế — cái được chứng minh
 * là nhánh retry sau throw KHI thế hệ đã đổi (không retry), không phải
 * nguồn lỗi.
 *
 * Luồng thật trên browser headed (Chromium local + Xvfb, CDP websocket
 * — KHÔNG dùng browser.browse), theo mẫu clicktest-49e6:
 *   1. Build app mới (vite build ra scratch ngoài repo) + static server
 *      cùng origin. F6_SKIP_BUILD=1 thì dùng lại dist đã build.
 *   2. Mở app: App mount gọi loadSample() (call1) khi chưa có autosave.
 *      Trong lúc call1 còn bay, bấm ngay nút "Tải lại dự án mẫu" (call2
 *      → chồng nhau, ghi nhớ ở gen 0).
 *   3. Ngay sau đó (vẫn trước khi call1 ném, ~render+2 s), bấm nút
 *      "Tạo dự án mới" (newProject → gen 0→1, project trống).
 *   4. Kiểm chứng (mỗi bước PASS/FAIL riêng):
 *      F1 app load;
 *      F2 bấm nút "Dự án mẫu" trong lúc call1 còn bay: bấm ở ~render+1,5 s
 *         (guard < 5 s sau render như E6) + bộ đếm window.__e6ctx640 ≤ 1
 *         lúc bấm (canvas variant 1 chưa tạo → call1 chưa thể ném trước
 *         khi bấm) + sample chưa sẵn sàng lúc bấm. Nếu bấm sau khi call1
 *         đã ném thì đó là loadSample mới thường, không chứng minh được
 *         đường chồng nhau → INVALID.
 *      F3 bấm "Tạo dự án mới" SAU lần bấm F2, TRƯỚC khi call1 ném:
 *         guard __e6ctx640 ≤ 1 lúc bấm (call1 chưa ném) + sau khi bấm,
 *         poll ≤ 5 s thấy tên "Dự án mới", duration không phải 00:08.0,
 *         bin không có mau. Nếu ctx640 > 1 lúc bấm → call1 có thể đã
 *         ném trước khi đổi project → INVALID (đó là case D thuần,
 *         không phải D+B).
 *      F4 (case phân biệt) KHÔNG retry: poll 25 s sau F3, project PHẢI
 *         ở yên "Dự án mới" — mẫu KHÔNG BAO GIỜ xuất hiện (duration
 *         không thành 00:08.0, tên không thành "Dự án mẫu", bin không
 *         bao giờ có mau). Bất kỳ lần nào thấy mẫu là FAIL (retry đã
 *         chạy và revert project user vừa tạo). Trên code retry-không-
 *         kiểm-tra-thế-hệ (mutation đỏ): retry chạy, mẫu về ở ~bấm+11 s
 *         → FAIL. Cuối poll, __e6ctx640 PHẢI = 3 (call1 dùng #1/#2/#3
 *         rồi ném, không có retry dùng #4/#5).
 *      F5 autosave sau F4 KHÔNG chứa mẫu: kỳ vọng autosave VẮNG (raw
 *         null) — đúng thiết kế: doNew gọi clearAutosave() (xóa cả
 *         timer autosave 5 s vừa được đặt bởi subscribe lúc newProject
 *         set spec) rồi markSaved, sau đó không còn lần đổi spec nào
 *         (call1 ném, retry không chạy) nên không có gì ghi lại. Cũng
 *         chấp nhận autosave có mặt với name "Dự án mới" + không clip
 *         mau (nếu effect ghi muộn). FAIL chỉ khi autosave chứa mẫu
 *         (name "Dự án mẫu" hoặc clip mau) — tức sample đã lọt vào
 *         autosave. Ngủ 7 s trước khi poll như C1 C5.
 *      F6 đúng 1 unhandled rejection trong phiên, nội dung là TypeError
 *         "Cannot read properties of null" từ drawSampleFrame (lỗi ép
 *         của call1) — chứng minh call1 THẬT SỰ đã ném (nếu injection
 *         hỏng, call1 thành công thì set stale cũng bị chặn bởi gen nên
 *         F4 vẫn pass oan; chỉ F6 phân biệt được). Thu bằng cả 2 đường:
 *         Runtime.exceptionThrown của CDP và window.__e6rejections.
 *         Retry không chạy nên không có rejection thứ 2.
 * KHÔNG sửa production code (trừ mutation đỏ tạm thời cho lượt đỏ,
 * khôi phục + verify sha256 sau đó), KHÔNG push, KHÔNG tag/release,
 * KHÔNG binary vào repo. Scratch đo nằm ngoài repo
 * (tmp-round50-f6-casedb).
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-50f6-loadsample-case-db.mjs
 * Biến môi trường: F6_DEBUG_PORT (mặc định 9407), F6_HTTP_PORT
 * (mặc định 4230), F6_SCRATCH (mặc định ~/workspace/tmp-round50-f6-casedb),
 * F6_SKIP_BUILD=1 để dùng lại dist đã build, F6_OUT=tên file kết quả
 * (mặc định f6-result.json).
 * Exit 0 khi mọi case PASS, 1 khi có FAIL, 2 khi harness lỗi / INVALID.
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.F6_SCRATCH || path.join(os.homedir(), "workspace/tmp-round50-f6-casedb");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.F6_DEBUG_PORT || 9407);
const HTTP_PORT = Number(process.env.F6_HTTP_PORT || 4230);
const ORIGIN = `http://127.0.0.1:${HTTP_PORT}`;
const OUT_FILE = process.env.F6_OUT || "f6-result.json";
const SAMPLE_DUR = "00:08.0";
const NEW_NAME = "Dự án mới";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = [];
function casePass(n, d) { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); }
function caseFail(n, d) { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); }

if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
fs.mkdirSync(SCRATCH, { recursive: true });

// ---- 0. Script injection: ép call1 ném lỗi + thu unhandledrejection (y hệt E6) ----
const INJECT = `(() => {
  window.__e6ctx640 = 0;
  window.__e6rejections = [];
  window.addEventListener("unhandledrejection", (e) => {
    try { window.__e6rejections.push(String((e.reason && e.reason.stack) || e.reason)); } catch { window.__e6rejections.push("<?>"); }
  });
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (type === "2d" && this.width === 640 && this.height === 360) {
      window.__e6ctx640 = (window.__e6ctx640 || 0) + 1;
      if (window.__e6ctx640 === 2 || window.__e6ctx640 === 3) return null;
    }
    return orig.call(this, type, ...rest);
  };
})()`;

// ---- 1. Build app mới ra scratch (không đụng apps/web/dist) ----
const distDir = path.join(SCRATCH, "dist");
if (process.env.F6_SKIP_BUILD === "1" && fs.existsSync(path.join(distDir, "index.html"))) {
  log("F6_SKIP_BUILD=1: dùng lại dist đã build");
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
    this.nextId = 1; this.pending = new Map(); this.exceptions = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.method === "Page.javascriptDialogOpening") {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method: "Page.handleJavaScriptDialog", params: { accept: true } }));
        return;
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const d = msg.params?.exceptionDetails || {};
        this.exceptions.push(d.exception?.description || d.text || JSON.stringify(d).slice(0, 500));
        return;
      }
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
    hasSampleDur: tbText.includes(${JSON.stringify(SAMPLE_DUR)}),
    binHasMau: binText.includes('mau-1') || binText.includes('mau-2'),
    ctx640: window.__e6ctx640 ?? null,
    rejections: (window.__e6rejections || []).length,
  };
})()`;

function clickButtonByTitle(cdp, title) {
  return cdp.evalJs(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.title || '') === ${JSON.stringify(title)});
    if (!b) return { ok: false, reason: 'không tìm thấy nút ' + ${JSON.stringify(title)} };
    b.click();
    return { ok: true };
  })()`);
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
  for (const num of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    const xv = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xv.exitCode === null) { display = `:${num}`; xvfbProc = xv; break; }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  log(`xvfb: DISPLAY=${display}`);
  const profile = path.join(SCRATCH, "cdprof-f6");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "f6-chrome.log"), "w");
  chromeProc = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${profile}`, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display } });
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try { const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); pageTarget = (pages || []).find((p) => p.type === "page") || null; } catch {}
    if (!pageTarget) await sleep(500);
  }
  if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
  // Cài injection TRƯỚC khi navigate để script chạy trên document mới.
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT });
  log("đã cài injection ép lỗi getContext (canvas 640×360, lần #2/#3 → null)");

  // F1: app load (profile mới → không autosave → App mount gọi loadSample = call1)
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` });
  await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector('#root') && document.querySelector('#root').children.length > 0`), "React render lần đầu", 60000);
  const tRender = Date.now();
  await sleep(1200); // React mount + effect loadSample đã khởi động
  casePass("F1 app load", "React render #root có children");

  // F2: bấm nút "Dự án mẫu" trong lúc call1 còn bay (call2 chồng nhau).
  const preClick = await cdp.evalJs(STATE_EXPR);
  const tClickAfterRender = (Date.now() - tRender) / 1000;
  log(`trạng thái lúc bấm nút mẫu (t+${tClickAfterRender.toFixed(1)} s sau render): ${JSON.stringify(preClick)}`);
  if (preClick.ctx640 === null || preClick.ctx640 === undefined) {
    throw new Error("INVALID: injection chưa cài (window.__e6ctx640 undefined) — không ép được lỗi call1");
  }
  if (preClick.ctx640 > 1) {
    throw new Error(`INVALID: __e6ctx640=${preClick.ctx640} lúc bấm (> 1) — canvas variant 1 có thể đã tạo, call1 có thể đã ném trước khi bấm`);
  }
  if (tClickAfterRender >= 5) {
    throw new Error(`INVALID: bấm nút mẫu ở t+${tClickAfterRender.toFixed(1)} s sau render (>= 5 s) — call1 mount có thể đã ném xong, lần bấm không chắc còn chồng nhau`);
  }
  if (preClick.binHasMau || preClick.hasSampleDur) {
    throw new Error("INVALID: sample đã sẵn sàng lúc bấm nút mẫu — call1 đã xong, lần bấm không còn chồng nhau");
  }
  const clicked = await clickButtonByTitle(cdp, "Tải lại dự án mẫu");
  if (!clicked.ok) { caseFail("F2 bấm nút Dự án mẫu trong lúc loadSample bay", clicked.reason); throw new Error(clicked.reason); }
  const tClickSample = Date.now();
  casePass("F2 bấm nút Dự án mẫu trong lúc loadSample bay", `bấm ở t+${tClickAfterRender.toFixed(1)} s sau render (__e6ctx640=${preClick.ctx640} lúc bấm, sample chưa sẵn sàng) — call2 chồng lên call1 đang bay`);

  // F3: bấm "Tạo dự án mới" SAU lần bấm F2, TRƯỚC khi call1 ném.
  const preNew = await cdp.evalJs(STATE_EXPR);
  const tNewAfterRender = (Date.now() - tRender) / 1000;
  log(`trạng thái lúc bấm nút Mới (t+${tNewAfterRender.toFixed(1)} s sau render, +${((Date.now() - tClickSample) / 1000).toFixed(1)} s sau lần bấm mẫu): ${JSON.stringify(preNew)}`);
  if (preNew.ctx640 === null || preNew.ctx640 === undefined || preNew.ctx640 > 1) {
    throw new Error(`INVALID: __e6ctx640=${preNew.ctx640} lúc bấm nút Mới (> 1 hoặc undefined) — call1 có thể đã ném trước khi đổi project, đây là case D thuần chứ không phải D+B`);
  }
  if (preNew.binHasMau || preNew.hasSampleDur) {
    throw new Error("INVALID: sample đã sẵn sàng lúc bấm nút Mới — call1 đã xong, lần đổi project không còn xen vào lúc bay");
  }
  const clickedNew = await clickButtonByTitle(cdp, "Tạo dự án mới");
  if (!clickedNew.ok) { caseFail("F3 đổi project sau lần bấm mẫu, trước khi call1 ném", clickedNew.reason); throw new Error(clickedNew.reason); }
  const tNew = Date.now();
  let newSeen = null;
  for (let i = 0; i < 10 && !newSeen; i++) {
    const s = await cdp.evalJs(STATE_EXPR);
    if (s.name === NEW_NAME && !s.hasSampleDur && !s.binHasMau) newSeen = s;
    else await sleep(500);
  }
  if (newSeen) {
    casePass("F3 đổi project sau lần bấm mẫu, trước khi call1 ném", `bấm "Tạo dự án mới" ở t+${tNewAfterRender.toFixed(1)} s sau render (__e6ctx640=${preNew.ctx640} lúc bấm — call1 chưa ném), project mới hiện sau ${((Date.now() - tNew) / 1000).toFixed(1)} s: tên "${NEW_NAME}", không duration mẫu, bin không mau`);
  } else {
    const endState = await cdp.evalJs(STATE_EXPR);
    caseFail("F3 đổi project sau lần bấm mẫu, trước khi call1 ném", `sau 5 s không thấy tên "${NEW_NAME}" + không mẫu: ${JSON.stringify(endState)}`);
  }

  // F4 (case phân biệt): KHÔNG retry — poll 25 s, mẫu không bao giờ xuất hiện.
  let sampleAt = null, sampleState = null;
  const tPoll0 = Date.now();
  while (Date.now() - tPoll0 < 25000) {
    const s = await cdp.evalJs(STATE_EXPR);
    if (s.hasSampleDur || s.name === "Dự án mẫu" || s.binHasMau) { sampleAt = Date.now(); sampleState = s; break; }
    if (s.name !== NEW_NAME) { sampleAt = Date.now(); sampleState = { ...s, note: "tên project đổi khỏi Dự án mới mà không phải mẫu" }; break; }
    await sleep(500);
  }
  const endPoll = await cdp.evalJs(STATE_EXPR);
  if (!sampleAt) {
    if (endPoll.ctx640 === 3) {
      casePass("F4 không retry — project mới ở yên, mẫu không xuất hiện trong 25 s", `suốt 25 s sau khi đổi project: tên luôn "${NEW_NAME}", không duration mẫu, bin không mau; __e6ctx640=${endPoll.ctx640} cuối poll (call1 dùng #1/#2/#3 rồi ném, không có retry dùng #4/#5)`);
    } else {
      caseFail("F4 không retry — project mới ở yên, mẫu không xuất hiện trong 25 s", `mẫu không xuất hiện nhưng __e6ctx640=${endPoll.ctx640} cuối poll (kỳ vọng 3 — có canvas 640×360 lạ, có thể retry đã chạy mà chưa set kịp hoặc injection lệch): ${JSON.stringify(endPoll)}`);
    }
  } else {
    const afterNew = (sampleAt - tNew) / 1000;
    caseFail("F4 không retry — project mới ở yên, mẫu không xuất hiện trong 25 s", `MẪU XUẤT HIỆN / project đổi ở +${afterNew.toFixed(1)} s sau khi bấm Mới: ${JSON.stringify(sampleState)} (retry đã chạy và revert project user vừa tạo)`);
  }

  // F5: autosave sau F4 KHÔNG chứa mẫu. Kỳ vọng VẮNG (raw null): doNew
  // clearAutosave() xóa cả timer autosave vừa đặt lúc newProject set spec,
  // rồi markSaved; sau đó không còn lần đổi spec nào nên không ghi lại.
  // Chấp nhận cả autosave có mặt với name "Dự án mới" + không clip mau.
  // FAIL chỉ khi autosave chứa mẫu (sample lọt vào autosave).
  await sleep(7000);
  let autosaveOk = false, autosaveDetail = "không đọc được autosave";
  let sawAbsent = false;
  for (let i = 0; i < 24 && !autosaveOk; i++) {
    const raw = await cdp.evalJs(`localStorage.getItem('vcut-studio:autosave:v1')`);
    if (raw === null || raw === undefined) {
      sawAbsent = true;
      autosaveDetail = `autosave VẮNG (poll lần ${i + 1}) — đúng thiết kế: doNew clearAutosave + không còn lần đổi spec sau đó`;
      autosaveOk = true;
      break;
    }
    try {
      const env = JSON.parse(raw);
      const clips = (env?.spec?.tracks || []).flatMap((t) => t.clips || []);
      const sampleHit = clips.some((c) => typeof c.src === "string" && c.src.startsWith("mau-"));
      if (env?.name === NEW_NAME && !sampleHit) {
        autosaveOk = true;
        autosaveDetail = `autosave name=${env?.name} clips=${JSON.stringify(clips.map((c) => c.id || c.src))} (poll lần ${i + 1}) — project mới, không mẫu`;
      } else {
        autosaveDetail = `autosave name=${env?.name} clips=${JSON.stringify(clips.map((c) => c.id || c.src))} (poll lần ${i + 1}) — CHỨA MẪU hoặc tên lạ`;
      }
    } catch (e) { autosaveDetail = `parse autosave lỗi: ${e.message}`; }
    if (!autosaveOk) await sleep(500);
  }
  if (autosaveOk) casePass("F5 autosave sau F4 không chứa mẫu", autosaveDetail + (sawAbsent ? "" : ""));
  else caseFail("F5 autosave sau F4 không chứa mẫu", autosaveDetail);

  // F6: đúng 1 unhandled rejection (lỗi ép của call1), không có cái thứ 2.
  const rejTexts = await cdp.evalJs(`(window.__e6rejections || []).slice()`);
  const cdpTexts = cdp.exceptions.slice();
  const allTexts = [...rejTexts, ...cdpTexts];
  const expectedRe = /Cannot read properties of null/;
  const matching = allTexts.filter((t) => expectedRe.test(t));
  log(`F6: unhandledrejection (window) = ${rejTexts.length}, Runtime.exceptionThrown (CDP) = ${cdpTexts.length}`);
  for (const t of allTexts) log(`F6 exception text: ${String(t).slice(0, 300)}`);
  if (rejTexts.length === 1 && cdpTexts.length <= 1 && matching.length >= 1 && allTexts.every((t) => expectedRe.test(t))) {
    casePass("F6 đúng 1 lỗi ép của call1, không retry nên không lỗi thêm", `window.__e6rejections=1 (${String(rejTexts[0]).slice(0, 120)}…), CDP exceptions=${cdpTexts.length} — đúng 1 TypeError ép lỗi của call1, không có exception nào khác trong phiên`);
  } else if (rejTexts.length === 0 && cdpTexts.length === 0) {
    caseFail("F6 đúng 1 lỗi ép của call1, không retry nên không lỗi thêm", "không thu được exception nào — call1 có thể đã không ném (ép lỗi thất bại) hoặc collector không hoạt động");
  } else {
    caseFail("F6 đúng 1 lỗi ép của call1, không retry nên không lỗi thêm", `window rejections=${rejTexts.length}, CDP exceptions=${cdpTexts.length}, khớp mẫu=${matching.length}/${allTexts.length}`);
  }
} catch (e) {
  harnessError = e;
  log(`HARNESS LỖI: ${e.message}`);
  if (results.length === 0) { console.log("\n== F6 clicktest: HARNESS ERROR =="); killAll(); process.exit(2); }
  log("(ghi tiếp các case đã chạy, exit 2 vì harness lỗi — không được đọc thành pass đủ)");
}
fs.writeFileSync(path.join(SCRATCH, OUT_FILE), JSON.stringify({ results, logLines }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n== F6 clicktest: ${results.length - failed.length}/${results.length} pass ==` + (harnessError ? " (HARNESS ERROR — exit 2)" : ""));
killAll();
process.exit(harnessError ? 2 : (failed.length > 0 ? 1 : 0));
