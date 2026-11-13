#!/usr/bin/env node
/**
 * clicktest-46b1-projectmenu-asset.mjs — Phase 9 đợt 46, luồng B1:
 * click-test thật vỏ UI .vcut.json qua ProjectMenu cho clip asset:
 * (nợ mở đợt 45 A1 §6.4 / Z1 §4: chỉ validate vỏ + fixture /tmp, chưa
 * click-test thật).
 *
 * Luồng thật trên browser headed (Chromium local + Xvfb, CDP
 * websocket — KHÔNG dùng browser.browse):
 *   1. Build app mới (vite build ra scratch ngoài repo) + static
 *      server cùng origin (app + seed bundle + fixture mp4).
 *   2. Seed AssetStore ngay trên origin của app: import seed bundle
 *      (AssetStore thật) trong page app, fetch fixture bằng Range
 *      (đường đã chứng minh chạy được ở probe B1), ingest thật →
 *      assetId thật. KHÔNG mock AssetStore, KHÔNG mock IDB.
 *   3. Ghi file .vcut.json thật (envelope vcut-project, 1 clip video
 *      src `asset:<id>`) ra scratch, rồi đưa file vào input ẩn của
 *      ProjectMenu bằng DataTransfer + dispatch change — handler
 *      onFile của React chạy thật với File thật (nội dung đúng file
 *      .vcut.json). LƯU Ý ĐO LƯỜNG: DOM.setFileInputFiles qua CDP
 *      websocket ở setup này KHÔNG dính (trả {} nhưng input.files
 *      vẫn 0 ngay sau đó và sau 2,5 s, cả 2 input) nên không dùng;
 *      O4 dùng pipe CDP nên không gặp. DataTransfer là đường đưa
 *      file thay thế ở tầng harness, không mock code sản phẩm.
 *   4. Kiểm chứng (mỗi bước PASS/FAIL riêng, ghi rõ):
 *   CHÚ Ý RACE loadSample (phát hiện ở lần chạy click-test đầu):
 *      App mount gọi loadSample() async (fetch media mẫu, ~10 s mới
 *      xong trên VM này); nếu mở file trong lúc đó, lệnh set cuối
 *      của loadSample sẽ ghi đè project vừa mở (đo được: spec 10 s
 *      + bin có asset ở +2..+5 s sau khi mở, revert về mẫu 8 s +
 *      bin mau ở +6 s). Đây là BUG THẬT của production (xem LIMITS
 *      B1 §6) — luồng B1 KHÔNG sửa production vì chưa có test
 *      đỏ-trước/xanh-sau cho wiring store async này. Harness vì
 *      vậy CHỜ sample load xong (bin có mau-1 + duration 8 s) rồi
 *      mới mở file, tức đo đường mở file ở trạng thái app đã ổn
 *      định, không đo trong cửa sổ race.
 *      C1 app load; C2 nút Mở file dự án tồn tại; C3 đưa file không
 *      toast lỗi mở file; C4 autosave localStorage sau khi mở chứa
 *      đúng clip src asset:<id> (chứng minh loadProject →
 *      replaceProject → autosave chạy hết; autosave() debounce 5 s
 *      nên poll tới 12 s, đọc sớm 2 s sẽ fail oan); C5 không hiện
 *      panel "Media thiếu" cho clip asset: (chứng minh rehydrate
 *      khôi phục được, không bị skip; đọc panel cả trước và sau
 *      khi mở để loại trừ panel có sẵn từ lúc load); C6 DOM chứa
 *      tên media đã ingest (chứng minh restoreMediaBin render);
 *      C7 0 Runtime.exceptionThrown trong phiên.
 * KHÔNG sửa production code, KHÔNG push, KHÔNG tag/release, KHÔNG
 * binary vào repo. Scratch đo nằm ngoài repo (tmp-round46-b1-click).
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-46b1-projectmenu-asset.mjs
 * Biến môi trường: B1C_DEBUG_PORT (mặc định 9398), B1C_HTTP_PORT
 * (mặc định 4221), B1C_SCRATCH (mặc định ~/workspace/tmp-round46-b1-click).
 * Exit 0 khi mọi case PASS, 1 khi có FAIL, 2 khi harness lỗi.
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
const SCRATCH = process.env.B1C_SCRATCH || path.join(os.homedir(), "workspace/tmp-round46-b1-click");
const FIX = path.join(os.homedir(), "workspace/tmp-round43-y1/y1-corrupt-gop30-360p-gop90-420s.mp4");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const DEBUG_PORT = Number(process.env.B1C_DEBUG_PORT || 9398);
const HTTP_PORT = Number(process.env.B1C_HTTP_PORT || 4221);
const ORIGIN = `http://127.0.0.1:${HTTP_PORT}`;
const FIXTURE_NAME = "b1-corrupt-gop30-360p-gop90-420s.mp4";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = [];
function casePass(n, d) { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); }
function caseFail(n, d) { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); }

if (!fs.existsSync(FIX)) throw new Error(`không thấy fixture ${FIX}`);
if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
const fileBuf = fs.readFileSync(FIX);
fs.mkdirSync(SCRATCH, { recursive: true });

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

// ---- 2. Seed bundle (AssetStore thật) + file .vcut.json sẽ ghi sau khi có assetId ----
const seedEntry = path.join(SCRATCH, "seed-entry.mjs");
writeFileEpermRetry(seedEntry, `import { AssetStore } from ${JSON.stringify(path.join(ROOT, "apps/web/src/lib/assetStore.ts"))};
window.__b1cseed = {
  ingestFromUrl: async (url, name) => {
    const CH = 8 * 1024 * 1024; const parts = []; const size = ${fileBuf.length};
    for (let st = 0; st < size; st += CH) {
      const en = Math.min(st + CH - 1, size - 1);
      const r = await fetch(url, { headers: { Range: "bytes=" + st + "-" + en } });
      if (!r.ok && r.status !== 206) throw new Error("chunk status " + r.status);
      parts.push(await r.blob());
    }
    const blob = new Blob(parts, { type: "video/mp4" });
    const store = new AssetStore();
    const manifest = await store.ingest(blob, { name, width: 640, height: 360, duration: 420 });
    return { assetId: manifest.assetId, size: manifest.size, blobSize: blob.size };
  },
};
`);
{
  const b = spawnSync(path.join(ROOT, "node_modules/.bin/esbuild"), [seedEntry, "--bundle", "--platform=browser", "--format=esm", `--outfile=${path.join(SCRATCH, "seed-bundle.mjs")}`], { stdio: "pipe", encoding: "utf8" });
  if (b.status !== 0) throw new Error("esbuild seed lỗi: " + ((b.stderr || b.stdout || "")).slice(0, 500));
}
const projectFilePath = path.join(SCRATCH, "b1-asset-project.vcut.json");

// ---- 3. Static server cùng origin: app + seed bundle + fixture (Range) ----
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webm": "video/webm", ".wasm": "application/wasm" };
const server = createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
    if (urlPath === "/b1-seed-bundle.mjs") { res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(fs.readFileSync(path.join(SCRATCH, "seed-bundle.mjs"))); return; }
    if (urlPath === "/b1-project.vcut.json") { res.writeHead(200, { "Content-Type": "application/json" }); res.end(fs.readFileSync(projectFilePath)); return; }
    if (urlPath === "/b1-fixture.mp4") {
      const range = req.headers.range;
      if (req.method === "HEAD") { res.writeHead(200, { "Content-Length": fileBuf.length, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" }); res.end(); return; }
      if (!range) { res.writeHead(200, { "Content-Length": fileBuf.length, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" }); res.end(fileBuf); return; }
      const m = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!m) { res.writeHead(416); res.end(); return; }
      const start = Number(m[1]); const end = m[2] === "" ? fileBuf.length - 1 : Math.min(Number(m[2]), fileBuf.length - 1);
      const chunk = fileBuf.subarray(start, end + 1);
      res.writeHead(206, { "Content-Range": `bytes ${start}-${end}/${fileBuf.length}`, "Content-Length": chunk.length, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
      res.end(chunk); return;
    }
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

// ---- 4. CDP (websocket) + Xvfb + Chrome headed ----
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
  const profile = path.join(SCRATCH, "cdprof-b1c");
  fs.rmSync(profile, { recursive: true, force: true });
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "b1c-chrome.log"), "w");
  chromeProc = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${profile}`, "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--window-size=1440,900", "--hide-scrollbars", "about:blank"], { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY: display } });
  let pageTarget = null;
  for (let i = 0; i < 180 && !pageTarget; i++) {
    try { const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); pageTarget = (pages || []).find((p) => p.type === "page") || null; } catch {}
    if (!pageTarget) await sleep(500);
  }
  if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s");
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");

  // C1: app load
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` });
  await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector('#root') && document.querySelector('#root').children.length > 0`), "React render lần đầu", 60000);
  await sleep(1500);
  casePass("C1 app load", "React render #root có children");

  // Seed AssetStore trên origin app (trước khi mở file)
  await cdp.evalJs(`(async () => { await import('/b1-seed-bundle.mjs'); return true; })()`);
  const seed = await cdp.evalJs(`window.__b1cseed.ingestFromUrl('/b1-fixture.mp4', ${JSON.stringify(FIXTURE_NAME)})`);
  log(`seed asset: ${JSON.stringify(seed)}`);
  if (!seed?.assetId || seed.size !== seed.blobSize || seed.size !== fileBuf.length) {
    caseFail("C0 seed asset", `seed không đạt: ${JSON.stringify(seed)} vs file ${fileBuf.length}`);
    throw new Error("seed asset thất bại, dừng click-test");
  }
  log(`seed OK: assetId=${seed.assetId}`);

  // Ghi file .vcut.json với clip asset: (sau khi có assetId thật)
  const spec = {
    version: "0.2.0",
    meta: { name: "B1 asset project", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips: [
      { kind: "video", id: "B1CLIP", src: "asset:" + seed.assetId, start: 0, duration: 10, in: 0, out: 10 },
    ] }],
  };
  const envelope = {
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name: "B1 asset project", spec,
  };
  writeFileEpermRetry(projectFilePath, JSON.stringify(envelope, null, 2));
  log(`ghi project file: ${projectFilePath} (clip src asset:${seed.assetId})`);

  // Chờ sample load xong TRƯỚC khi mở file (tránh race loadSample
  // ghi đè — xem header). Sample sẵn sàng = bin có mau-1 và duration
  // TopBar 8 s; quá 60 s thì vẫn tiếp tục nhưng ghi cảnh báo.
  {
    let sampleReady = false;
    for (let i = 0; i < 60 && !sampleReady; i++) {
      sampleReady = await cdp.evalJs(`(() => {
        const bin = document.querySelector('.mediabin')?.textContent || '';
        const tb = (document.querySelector('.topbar') || document.querySelector('header'))?.textContent || '';
        return bin.includes('mau-1') && tb.includes('00:08.0');
      })()`);
      if (!sampleReady) await sleep(1000);
    }
    log(`sample load sẵn sàng trước khi mở: ${sampleReady} (nếu false, race loadSample vẫn có thể ghi đè sau khi mở)`);
  }

  // C2: nút Mở file dự án tồn tại (không click mở chooser native — set
  // file trực tiếp vào input ẩn là đường O4 đã chứng minh; nút click
  // thật chỉ để chứng minh nút render + handler doOpen gắn đúng input).
  const openBtn = await cdp.evalJs(`!![...document.querySelectorAll('button')].find((b) => (b.title || '') === 'Mở file dự án (.vcut.json)')`);
  if (openBtn) casePass("C2 nút Mở file dự án", "tìm thấy button title 'Mở file dự án (.vcut.json)' trong TopBar/ProjectMenu");
  else caseFail("C2 nút Mở file dự án", "không tìm thấy button theo title");

  // C3: đưa file vào input ẩn của ProjectMenu bằng DataTransfer
  // (xem header: setFileInputFiles qua websocket CDP không dính ở
  // setup này). File lấy từ server cùng origin, bytes đúng file
  // .vcut.json đã ghi; handler onFile chạy thật.
  const relinkBefore = await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
  log(`panel Media thiếu TRƯỚC khi mở: ${relinkBefore}`);
  const delivery = await cdp.evalJs(`(async () => {
    const text = await (await fetch('/b1-project.vcut.json')).text();
    const f = new File([text], 'b1-asset-project.vcut.json', { type: 'application/json' });
    const el = document.querySelector('.project-menu input[accept=".vcut.json,.json,application/json"]');
    if (!el) return { ok: false, reason: 'không tìm thấy input file project' };
    const dt = new DataTransfer(); dt.items.add(f); el.files = dt.files;
    const assigned = el.files.length;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, assigned, filesAfterDispatch: el.files.length };
  })()`);
  log(`delivery DataTransfer: ${JSON.stringify(delivery)}`);
  if (!delivery.ok) { caseFail("C3 đưa file .vcut.json", delivery.reason); throw new Error(delivery.reason); }
  await sleep(1000);
  // C3 kiểm: không có toast lỗi mở file + autosave đổi (C4 kiểm riêng)
  const toasts = await cdp.evalJs(`[...document.querySelectorAll('.toast-msg')].map((el) => el.textContent || '')`);
  const errToast = toasts.find((s) => s.includes("Không mở được file"));
  if (errToast) caseFail("C3 mở file không lỗi", `toast lỗi: ${errToast}`);
  else casePass("C3 mở file không lỗi", `không có toast 'Không mở được file' (toast đang có: ${JSON.stringify(toasts)}; delivery: ${JSON.stringify(delivery)})`);

  // C4: autosave localStorage sau khi mở chứa đúng clip asset:
  // autosave() debounce 5 s nên poll tới 12 s (đọc ở 2 s fail oan).
  let autosaveRaw = null, autosaveOk = false, autosaveDetail = "không đọc được autosave";
  for (let i = 0; i < 24 && !autosaveOk; i++) {
    autosaveRaw = await cdp.evalJs(`localStorage.getItem('vcut-studio:autosave:v1')`);
    try {
      const env = JSON.parse(autosaveRaw);
      const clips = (env?.spec?.tracks || []).flatMap((t) => t.clips || []);
      const hit = clips.find((c) => c.src === "asset:" + seed.assetId);
      autosaveOk = !!hit;
      autosaveDetail = `autosave name=${env?.name} clips=${JSON.stringify(clips.map((c) => c.src))} (poll lần ${i + 1})`;
    } catch (e) { autosaveDetail = `parse autosave lỗi: ${e.message}`; }
    if (!autosaveOk) await sleep(500);
  }
  if (autosaveOk) casePass("C4 spec sau khi mở chứa clip asset:", autosaveDetail);
  else caseFail("C4 spec sau khi mở chứa clip asset:", autosaveDetail);

  // C5: không hiện panel "Media thiếu" cho clip asset:
  const relink = await cdp.evalJs(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
  if (!relink) casePass("C5 không panel Media thiếu", `không có .modal[aria-label='Media thiếu'] sau khi mở (trước khi mở cũng ${relinkBefore}; rehydrate không skip clip asset:)`);
  else caseFail("C5 không panel Media thiếu", `panel Media thiếu hiện sau khi mở (trước khi mở: ${relinkBefore}) — clip asset: bị coi là thiếu`);

  // C6: bin chứa item restore (tên item rehydrate = src clip, dạng
  // `asset:<id>`, KHÔNG phải tên file — sửa kỳ vọng sai ở lần chạy
  // trước, lúc đó tìm tên file nên fail oan). Poll tới ~10 s vì
  // rehydrate/render async sau khi mở.
  let bodyHasName = false;
  for (let i = 0; i < 20 && !bodyHasName; i++) {
    bodyHasName = await cdp.evalJs(`(document.body.textContent || '').includes(${JSON.stringify("asset:" + seed.assetId)})`);
    if (!bodyHasName) await sleep(500);
  }
  if (bodyHasName) casePass("C6 media bin render item restore", `body textContent chứa 'asset:${seed.assetId}' (tên item rehydrate = src clip)`);
  else caseFail("C6 media bin render item restore", `body textContent không chứa 'asset:${seed.assetId}' sau ~10 s`);

  // C7: 0 exception
  if (cdp.exceptions === 0) casePass("C7 0 Runtime.exceptionThrown", "không có exception trong phiên");
  else caseFail("C7 0 Runtime.exceptionThrown", `${cdp.exceptions} exception`);

  // Quan sát thêm (không tính PASS/FAIL): vùng preview có render không
  const previewObs = await cdp.evalJs(`({ canvases: document.querySelectorAll('canvas').length, videos: document.querySelectorAll('video').length })`);
  log(`quan sát preview: ${JSON.stringify(previewObs)} (chỉ ghi nhận, không tính PASS/FAIL)`);
} catch (e) {
  harnessError = e;
  log(`HARNESS LỖI: ${e.message}`);
  if (results.length === 0) { console.log("\n== B1C clicktest: HARNESS ERROR =="); killAll(); process.exit(2); }
  log(`(ghi tiếp các case đã chạy, exit 2 vì harness lỗi — không được đọc thành pass đủ)`);
}
writeFileEpermRetry(path.join(SCRATCH, "b1c-result.json"), JSON.stringify({ results, logLines }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n== B1C clicktest: ${results.length - failed.length}/${results.length} pass ==` + (harnessError ? " (HARNESS ERROR — exit 2)" : ""));
killAll();
process.exit(harnessError ? 2 : (failed.length > 0 ? 1 : 0));
