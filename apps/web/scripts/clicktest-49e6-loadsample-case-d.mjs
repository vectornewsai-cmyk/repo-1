#!/usr/bin/env node
/**
 * clicktest-49e6-loadsample-case-d.mjs — Phase 9 đợt 49, luồng E6:
 * loadSample CASE D: call1 ném lỗi rồi retry, trên browser thật.
 *
 * Bối cảnh: đợt 48 D6 vá coalesce + retry có điều kiện cho hai loadSample
 * chồng nhau (docs/PHASE9_ROUND48_D6_LOADSAMPLE_LIMITS.md) và đã đo case C
 * (call1 bị bỏ set do đổi project → retry chạy, mẫu về sau ~15,1–15,6 s
 * sau khi bấm). Case D chưa đo riêng (D6 §4.2): call1 NÉM LỖI
 * (buildSampleProject throw) trong lúc call2 đã chồng nhau — nhánh retry
 * đi qua cùng điều kiện `!didSet` nhưng `didSet` ở lại false vì throw
 * (không phải vì return sớm ở check thế hệ), và throw văng ra ngoài
 * loadSample thành unhandled rejection (mọi caller UI đều
 * `void st.loadSample()`).
 *
 * Cách ép call1 ném lỗi (CHỈ can thiệp ở tầng test, không đổi production):
 * buildSampleProject (apps/web/src/sample.ts) không có đường nào ép lỗi
 * từ UI — recordSample nuốt mọi lỗi → null, fallback stillSample vẽ PNG,
 * lỗi AssetStore cũng được nuốt. Điểm duy nhất có thể ném là stillSample:
 * `canvas.getContext("2d")!` rồi drawSampleFrame dùng ctx ngay — nếu
 * getContext trả null thì ném TypeError. Harness ghi đè
 * HTMLCanvasElement.prototype.getContext qua
 * Page.addScriptToEvaluateOnNewDocument: chỉ canvas đúng 640×360 (cỡ
 * canvas mẫu), chỉ lần gọi #2 và #3 trả null, còn lại pass-through:
 *   #1 = recordSample variant 0 → chạy bình thường 4 s (cửa sổ chồng
 *        nhau đủ rộng cho lần bấm call2);
 *   #2 = recordSample variant 1 → null → recordSample trả null;
 *   #3 = stillSample variant 1 → null → drawSampleFrame ném TypeError
 *        → buildSampleProject ném → call1 ném lỗi ở ~render+4 s.
 *   Retry sau đó dùng #4/#5 bình thường → phải ra mẫu.
 * Lỗi này là ép nhân tạo, không phải failure mode thực tế đã gặp — cái
 * được chứng minh là nhánh retry sau throw, không phải nguồn lỗi.
 *
 * Luồng thật trên browser headed (Chromium local + Xvfb, CDP websocket
 * — KHÔNG dùng browser.browse), theo mẫu clicktest-48d6:
 *   1. Build app mới (vite build ra scratch ngoài repo) + static server
 *      cùng origin. E6_SKIP_BUILD=1 thì dùng lại dist đã build.
 *   2. Mở app: App mount gọi loadSample() (call1) khi chưa có autosave.
 *      Trong lúc call1 còn bay, bấm ngay nút "Tải lại dự án mẫu" (call2
 *      → chồng nhau, được ghi nhớ).
 *   3. Kiểm chứng (mỗi bước PASS/FAIL riêng):
 *      E1 app load;
 *      E2 bấm nút "Dự án mẫu" trong lúc call1 còn bay: bấm ở ~render+1,5 s
 *         (guard < 5 s sau render như D6) + bộ đếm window.__e6ctx640 ≤ 1
 *         lúc bấm (canvas variant 1 chưa tạo → call1 chưa thể ném trước
 *         khi bấm) + sample chưa sẵn sàng lúc bấm. Nếu bấm sau khi call1
 *         đã ném thì đó là loadSample mới thường, không chứng minh được
 *         đường chồng nhau → INVALID.
 *      E3 (case phân biệt) retry chạy: mẫu xuất hiện, và thời điểm xuất
 *         hiện PHẢI ≥ 8,5 s sau khi bấm (đường retry: call1 ném ở
 *         ~bấm+2,5 s + retry build ~8 s ≈ bấm+10,5 s). Nếu mẫu xuất hiện
 *         < 8,5 s sau khi bấm thì call1 đã thành công (ép lỗi thất bại)
 *         → INVALID, không được đọc thành pass. Trên code chưa vá D6:
 *         call2 bị drop + call1 ném lỗi → không có lần nào load mẫu →
 *         FAIL sau 45 s.
 *      E4 autosave sau E3 vẫn chứa mẫu (name "Dự án mẫu", clip mau-1/
 *         mau-2). Ngủ 7 s trước khi poll như C1 C5 (bẫy đọc autosave
 *         quá sớm).
 *      E5 đúng 1 unhandled rejection trong phiên, nội dung là TypeError
 *         "Cannot read properties of null" từ drawSampleFrame (lỗi ép
 *         của call1) — retry thành công nên không có rejection thứ 2.
 *         Thu bằng cả 2 đường: Runtime.exceptionThrown của CDP và
 *         window.__e6rejections (listener unhandledrejection cài qua
 *         script injection) — đường nào cũng phải khớp.
 * KHÔNG sửa production code ngoài nối LoadSampleQueue (§5 LIMITS),
 * KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo. Scratch đo nằm
 * ngoài repo (tmp-round49-e6-cased).
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-49e6-loadsample-case-d.mjs
 * Biến môi trường: E6_DEBUG_PORT (mặc định 9406), E6_HTTP_PORT
 * (mặc định 4229), E6_SCRATCH (mặc định ~/workspace/tmp-round49-e6-cased),
 * E6_SKIP_BUILD=1 để dùng lại dist đã build, E6_OUT=tên file kết quả
 * (mặc định e6-result.json).
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
const SCRATCH = process.env.E6_SCRATCH || path.join(os.homedir(), "workspace/tmp-round49-e6-cased");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.E6_DEBUG_PORT || 9406);
const HTTP_PORT = Number(process.env.E6_HTTP_PORT || 4229);
const ORIGIN = `http://127.0.0.1:${HTTP_PORT}`;
const OUT_FILE = process.env.E6_OUT || "e6-result.json";
const SAMPLE_DUR = "00:08.0";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = [];
function casePass(n, d) { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); }
function caseFail(n, d) { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); }

if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
fs.mkdirSync(SCRATCH, { recursive: true });

// ---- 0. Script injection: ép call1 ném lỗi + thu unhandledrejection ----
// Xem chú thích đầu file: chỉ canvas mẫu 640×360, chỉ lần gọi #2/#3.
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
if (process.env.E6_SKIP_BUILD === "1" && fs.existsSync(path.join(distDir, "index.html"))) {
  log("E6_SKIP_BUILD=1: dùng lại dist đã build");
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

async function clickSampleButton(cdp) {
  return cdp.evalJs(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.title || '') === 'Tải lại dự án mẫu');
    if (!b) return { ok: false, reason: 'không tìm thấy nút Tải lại dự án mẫu' };
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
  for (const num of [95, 96, 97, 98, 99, 93, 94, 92, 91, 90]) {
    const xv = spawn("Xvfb", [`:${num}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(800);
    if (xv.exitCode === null) { display = `:${num}`; xvfbProc = xv; break; }
  }
  if (!display) throw new Error("không khởi động được Xvfb");
  log(`xvfb: DISPLAY=${display}`);
  const profile = path.join(SCRATCH, "cdprof-e6");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "e6-chrome.log"), "w");
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

  // E1: app load (profile mới → không autosave → App mount gọi loadSample = call1)
  const tMount0 = Date.now();
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` });
  await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector('#root') && document.querySelector('#root').children.length > 0`), "React render lần đầu", 60000);
  const tRender = Date.now();
  await sleep(1200); // React mount + effect loadSample đã khởi động
  casePass("E1 app load", "React render #root có children");

  // E2: bấm nút "Dự án mẫu" trong lúc call1 còn bay (call2 chồng nhau).
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
  const clicked = await clickSampleButton(cdp);
  if (!clicked.ok) { caseFail("E2 bấm nút Dự án mẫu trong lúc loadSample bay", clicked.reason); throw new Error(clicked.reason); }
  const tClick = Date.now();
  casePass("E2 bấm nút Dự án mẫu trong lúc loadSample bay", `bấm ở t+${tClickAfterRender.toFixed(1)} s sau render (__e6ctx640=${preClick.ctx640} lúc bấm, sample chưa sẵn sàng) — call2 chồng lên call1 đang bay`);

  // E3 (case phân biệt): retry chạy → mẫu xuất hiện, và PHẢI ≥ 8,5 s
  // sau khi bấm (đường retry). < 8,5 s → call1 đã thành công → INVALID.
  let sampleAt = null; let sampleState = null; const tE3 = Date.now();
  for (let i = 0; i < 90 && !sampleAt; i++) {
    const s = await cdp.evalJs(STATE_EXPR);
    if (s.hasSampleDur && s.name === "Dự án mẫu" && s.binHasMau) { sampleAt = Date.now(); sampleState = s; }
    else await sleep(500);
  }
  if (sampleAt) {
    const afterClick = (sampleAt - tClick) / 1000;
    const afterRender = (sampleAt - tRender) / 1000;
    if (afterClick < 8.5) {
      throw new Error(`INVALID: mẫu xuất hiện chỉ ${afterClick.toFixed(1)} s sau khi bấm (< 8,5 s) — call1 đã thành công, ép lỗi thất bại (không phải đường retry)`);
    }
    casePass("E3 retry sau lỗi chạy — mẫu xuất hiện", `mẫu xuất hiện sau ${afterClick.toFixed(1)} s kể từ lúc bấm (t+${afterRender.toFixed(1)} s sau render): duration ${SAMPLE_DUR}, tên "Dự án mẫu", bin có mau, __e6ctx640=${sampleState.ctx640} — call1 ném lỗi rồi retry build lại ra mẫu`);
  } else {
    const endState = await cdp.evalJs(STATE_EXPR);
    caseFail("E3 retry sau lỗi chạy — mẫu xuất hiện", `sau 45 s không thấy mẫu: ${JSON.stringify(endState)} (call1 ném lỗi + call2 chồng nhau đã bị mất — không có retry)`);
  }

  // E4: autosave sau E3 vẫn chứa mẫu, không phải project trống.
  await sleep(7000);
  let autosaveOk = false, autosaveDetail = "không đọc được autosave";
  for (let i = 0; i < 24 && !autosaveOk; i++) {
    const raw = await cdp.evalJs(`localStorage.getItem('vcut-studio:autosave:v1')`);
    try {
      const env = JSON.parse(raw);
      const clips = (env?.spec?.tracks || []).flatMap((t) => t.clips || []);
      const sampleHit = clips.some((c) => typeof c.src === "string" && c.src.startsWith("mau-"));
      autosaveOk = env?.name === "Dự án mẫu" && sampleHit;
      autosaveDetail = `autosave name=${env?.name} clips=${JSON.stringify(clips.map((c) => c.id || c.src))} (poll lần ${i + 1})`;
    } catch (e) { autosaveDetail = `parse autosave lỗi: ${e.message}`; }
    if (!autosaveOk) await sleep(500);
  }
  if (autosaveOk) casePass("E4 autosave sau E3 chứa mẫu", autosaveDetail);
  else caseFail("E4 autosave sau E3 chứa mẫu", autosaveDetail);

  // E5: đúng 1 unhandled rejection (lỗi ép của call1), không có cái thứ 2.
  const rejTexts = await cdp.evalJs(`(window.__e6rejections || []).slice()`);
  const cdpTexts = cdp.exceptions.slice();
  const allTexts = [...rejTexts, ...cdpTexts];
  const expectedRe = /Cannot read properties of null/;
  const matching = allTexts.filter((t) => expectedRe.test(t));
  log(`E5: unhandledrejection (window) = ${rejTexts.length}, Runtime.exceptionThrown (CDP) = ${cdpTexts.length}`);
  for (const t of allTexts) log(`E5 exception text: ${String(t).slice(0, 300)}`);
  if (rejTexts.length === 1 && cdpTexts.length <= 1 && matching.length >= 1 && allTexts.every((t) => expectedRe.test(t))) {
    casePass("E5 đúng 1 lỗi ép của call1, retry không lỗi thêm", `window.__e6rejections=1 (${String(rejTexts[0]).slice(0, 120)}…), CDP exceptions=${cdpTexts.length} — đúng 1 TypeError ép lỗi của call1, không có exception nào khác trong phiên`);
  } else if (rejTexts.length === 0 && cdpTexts.length === 0) {
    caseFail("E5 đúng 1 lỗi ép của call1, retry không lỗi thêm", "không thu được exception nào — call1 có thể đã không ném (ép lỗi thất bại) hoặc collector không hoạt động");
  } else {
    caseFail("E5 đúng 1 lỗi ép của call1, retry không lỗi thêm", `window rejections=${rejTexts.length}, CDP exceptions=${cdpTexts.length}, khớp mẫu=${matching.length}/${allTexts.length}`);
  }
} catch (e) {
  harnessError = e;
  log(`HARNESS LỖI: ${e.message}`);
  if (results.length === 0) { console.log("\n== E6 clicktest: HARNESS ERROR =="); killAll(); process.exit(2); }
  log("(ghi tiếp các case đã chạy, exit 2 vì harness lỗi — không được đọc thành pass đủ)");
}
fs.writeFileSync(path.join(SCRATCH, OUT_FILE), JSON.stringify({ results, logLines }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n== E6 clicktest: ${results.length - failed.length}/${results.length} pass ==` + (harnessError ? " (HARNESS ERROR — exit 2)" : ""));
killAll();
process.exit(harnessError ? 2 : (failed.length > 0 ? 1 : 0));
