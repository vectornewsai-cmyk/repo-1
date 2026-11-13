#!/usr/bin/env node
/**
 * clicktest-l4-round29-pipe.mjs — Phase 9 đợt 29, luồng L4:
 * click-test browser thật cho nút "Sửa dòng này" (per-line) và nút
 * "Sửa tất cả curve vi phạm" của LoadReportPanel.
 *
 * Kế thừa infra L5 đợt 28 (pipe CDP + snapshot dist + seed qua
 * autosave). Khác L5 ở một điểm: confirm của App là window.confirm
 * thật nên harness phải xử lý dialog — PipeCdp dưới đây tự động
 * CHẤP NHẬN dialog (Page.handleJavaScriptDialog accept:true) và GHI
 * LẠI message để assert nội dung confirm (đây là điểm kiểm chứng
 * chính: confirm per-line chỉ được nhắc clip ở dòng đó, không nhắc
 * clip khác). Nút bấm là click chuột CDP thật (Input.dispatchMouseEvent
 * lên rect, fallback element.click() khi CDP input lỗi — ghi rõ
 * phương thức từng click).
 *
 * Seed: 2 clip video trên 1 track, clip CLIP-A v=5, clip CLIP-B v=9
 * (cùng duration 10) → báo cáo tải có đúng 2 warnings, đúng thứ tự A, B.
 * Thứ tự case nối tiếp trên cùng 1 phiên (đúng như user làm thật):
 *   K1 mở panel từ strip "Xem báo cáo" (2 dòng, đủ 2 nút sửa);
 *   K2 click "Sửa dòng này" ở dòng đầu (CLIP-A) → confirm chỉ nhắc
 *     CLIP-A, autosave: A về 4, B còn 9, panel còn 1 dòng (CLIP-B);
 *   K3 click "Sửa tất cả curve vi phạm" → confirm nhắc CLIP-B,
 *     autosave: B về 4, panel hiện câu "không có cảnh báo";
 *   K4 locale en: reload với lang en, seed lại → nút en
 *     ("Fix this line" / "Fix all violating curves") bấm được,
 *     confirm en không rò key thô.
 * Exit 0 khi tất cả pass, 1 khi có FAIL, 2 khi harness lỗi (không tới
 * được dev server / chrome / dist). KHÔNG sửa code sản phẩm, KHÔNG
 * push, KHÔNG tag/release, KHÔNG binary.
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-l4-round29-pipe.mjs
 * Biến môi trường: L4_DISPLAY (mặc định :96), L4_PORT (mặc định 4196),
 * L4_OUT (mặc định v29-l4-clicktest.json).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round29-l4");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.L4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.L4_DISPLAY || ":96";
const PORT = Number(process.env.L4_PORT || 4196);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT_FILE = process.env.L4_OUT || "v29-l4-clicktest.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) {
  const line = `[${stamp()}] ${a.join(" ")}`;
  logLines.push(line);
  console.log(line);
}

// ------------------------------------------------------------- CDP pipe --
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.exceptions = [];
    this.dialogs = [];
    this.buf = Buffer.alloc(0);
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const raw = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!raw.trim()) continue;
        let msg;
        try { msg = JSON.parse(raw); } catch { continue; }
        if (msg.method === "Target.attachedToTarget" && msg.params?.sessionId) {
          this.sessionId = msg.params.sessionId;
        }
        if (msg.method === "Runtime.exceptionThrown" && msg.params?.exceptionDetails) {
          this.exceptions.push({ at: new Date().toISOString(), text: JSON.stringify(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text ?? "exception").slice(0, 800) });
        }
        // Đợt 29 L4: dialog confirm thật của App — ghi lại message rồi
        // chấp nhận ngay để handler chạy tiếp (không stub confirm).
        if (msg.method === "Page.javascriptDialogOpening" && msg.params) {
          this.dialogs.push({ at: new Date().toISOString(), type: msg.params.type, message: msg.params.message ?? "" });
          if (this.sessionId) {
            this.send("Page.handleJavaScriptDialog", { accept: true }, this.sessionId, 15000).catch(() => {});
          }
        }
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
    for (const s of [1, 2, 3, 4]) {
      try { proc.stdio[s]?.on("error", () => {}); } catch { /* pipe chết cùng Chrome */ }
    }
    proc.on("error", () => {});
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({
            proc: this.proc, pendingCount: this.pending.size, method, timeoutMs,
            outDir: path.join(SCRATCH, "cdp-hang-snapshots"), bundle: HANG_BUNDLE,
            extra: { display: DISPLAY, port: PORT },
          });
          if (hangSnap.file) log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
          else log(`CDP-HANG snapshot GHI LỖI: ${hangSnap.error} (vẫn reject lỗi timeout gốc)`);
        } catch (e) { log(`CDP-HANG snapshot lỗi ngoài dự kiến: ${e.message} (vẫn reject lỗi timeout gốc)`); }
        reject(new Error(`CDP timeout ${method} sau ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      try { this.proc.stdio[3].write(JSON.stringify(payload) + "\0"); }
      catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  async evaluate(expression, timeoutMs = 120000) {
    const r = await this.send("Runtime.evaluate", {
      expression, awaitPromise: true, returnByValue: true,
    }, this.sessionId, timeoutMs);
    if (r.exceptionDetails) {
      throw new Error(`evaluate lỗi: ${JSON.stringify(r.exceptionDetails).slice(0, 500)}`);
    }
    return r.result.value;
  }
  async clickRect(rect, modifiers = 0) {
    const x = Math.round(rect.x + rect.width / 2);
    const y = Math.round(rect.y + rect.height / 2);
    try {
      await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1, modifiers }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1, modifiers }, this.sessionId, 15000);
      return "cdp-input";
    } catch (e) {
      log(`  Input.dispatchMouseEvent lỗi (${e.message}), fallback element.click()`);
      return "js-click-fallback";
    }
  }
}

async function waitFor(cdp, expr, label, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { if (await cdp.evaluate(expr, 15000)) return true; } catch { /* chưa */ }
    await sleep(500);
  }
  throw new Error(`hết ${timeoutMs}ms chờ: ${label}`);
}

async function findRect(cdp, finderJs) {
  return cdp.evaluate(`(() => {
    const el = (${finderJs});
    if (!el) return null;
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
}

async function realClick(cdp, finderJs, modifiers = 0) {
  const rect = await findRect(cdp, finderJs);
  if (!rect) throw new Error(`không tìm được element: ${finderJs.slice(0, 200)}`);
  const method = await cdp.clickRect(rect, modifiers);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`(${finderJs}).click()`);
  }
  await sleep(800);
  return method;
}

// ---------------------------------------------------------------- infra ---
function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      let alive = false;
      try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch { alive = false; }
      if (alive) { log(`Xvfb: dùng chung display ${DISPLAY}`); resolve(null); return; }
      try { fs.unlinkSync(sock); } catch { /* kệ */ }
    }
    const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    (async () => {
      for (let i = 0; i < 40; i++) {
        if (fs.existsSync(sock)) { log(`Xvfb lên: DISPLAY=${DISPLAY}`); resolve(xvfb); return; }
        await sleep(250);
      }
      reject(new Error(`Xvfb không tạo socket ${sock}`));
    })();
  });
}

function snapshotDist() {
  const distDir = path.join(WEB_DIR, "dist");
  const indexHtml = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtml)) { log("BLOCKER dist: không có apps/web/dist/index.html"); return null; }
  const assetsDir = path.join(distDir, "assets");
  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  const bundlePath = jsFiles.map((f) => path.join(assetsDir, f))
    .find((p) => {
      const s = fs.readFileSync(p, "utf8");
      return s.includes("Sửa dòng này") && s.includes("Sửa tất cả curve vi phạm")
        && s.includes("Fix this line") && s.includes("Fix all violating curves");
    });
  if (!bundlePath) {
    log("BLOCKER dist: không bundle nào chứa đồng thời nhãn đợt 29 (dist cũ hơn code đợt 29?)");
    return null;
  }
  const sha = crypto.createHash("sha256").update(fs.readFileSync(bundlePath)).digest("hex").slice(0, 16);
  const snapDir = path.join(SCRATCH, "dist-snapshot");
  fs.rmSync(snapDir, { recursive: true, force: true });
  fs.cpSync(distDir, snapDir, { recursive: true });
  log(`dist snapshot OK: bundle ${path.basename(bundlePath)} sha256[:16]=${sha} -> ${snapDir}`);
  return { bundle: path.basename(bundlePath), sha, dir: snapDir };
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webm": "video/webm", ".wasm": "application/wasm" };
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
        let file = path.join(rootDir, urlPath === "/" ? "index.html" : urlPath);
        if (!file.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(rootDir, "index.html");
        const ext = path.extname(file);
        const type = mime[ext] || "application/octet-stream";
        const size = fs.statSync(file).size;
        res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size });
        fs.createReadStream(file).pipe(res);
      } catch { res.writeHead(500); res.end(); }
    });
    server.listen(PORT, "127.0.0.1", () => { log(`static server lên tại ${ORIGIN} (root ${rootDir})`); resolve(server); });
    server.on("error", (e) => { log(`static server lỗi: ${e.message}`); resolve(null); });
  });
}

async function startChrome(cdpHolder) {
  for (const bin of BINARIES) {
    if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "l4-pipe-"));
    const chrome = spawn(bin, [
      "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
      "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
      "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank",
    ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => {});
    try {
      const cdp = new PipeCdp(chrome);
      await cdp.send("Target.getTargets", {}, undefined, 30000);
      const target = await cdp.send("Target.createTarget", { url: "about:blank" });
      await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
      for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
      if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
      await cdp.send("Page.enable", {}, cdp.sessionId);
      await cdp.send("Runtime.enable", {}, cdp.sessionId);
      await cdp.send("DOM.enable", {}, cdp.sessionId);
      log(`pipe OK (${bin})`);
      cdpHolder.chrome = chrome;
      cdpHolder.profile = profile;
      return cdp;
    } catch (e) {
      log(`BLOCKER-PIPE ${bin}: ${e.message}`);
      try { chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  }
  return null;
}

// ----------------------------------------------------------------- seed ---
function videoClip(id, v) {
  return {
    kind: "video", id, src: `${id}.mp4`, start: 0, duration: 10, in: 0, out: 10,
    speedKeyframes: { keyframes: [{ t: 0, v, easing: "linear" }] },
  };
}

function seedSpec() {
  return {
    version: "0.2.0",
    meta: { name: "L4 per-line seed", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "t0", kind: "video", clips: [videoClip("CLIP-A", 5), videoClip("CLIP-B", 9)] }],
  };
}

function envelope(spec, name) {
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(), name, spec,
  });
}

async function loadSession(cdp, lang = "vi") {
  await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu", 60000);
  await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-lang", ${JSON.stringify(lang)}); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seedSpec(), "L4 seed"))});`);
  await cdp.send("Page.reload", {}, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render sau reload", 60000);
  await sleep(1500);
  const relink = await cdp.evaluate(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
  if (relink) {
    log("  setup: RelinkPanel hiện (media seed thiếu) -> đóng bằng click thật");
    await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Đóng (bỏ qua)")`);
    await waitFor(cdp, `!document.querySelector('.modal[aria-label="Media thiếu"]')`, "RelinkPanel đóng", 15000);
  } else {
    log("  setup: không thấy RelinkPanel (hoặc đã đóng)");
  }
}

async function readAutosaveSpec(cdp) {
  const raw = await cdp.evaluate(`localStorage.getItem("vcut-studio:autosave:v1")`);
  if (!raw) return null;
  try { return JSON.parse(raw).spec; } catch { return null; }
}

function clipV(spec, id) {
  for (const t of spec.tracks) {
    const c = (t.clips || []).find((x) => x.id === id);
    if (c) return c.speedKeyframes.keyframes[0].v;
  }
  return null;
}

async function panelInfo(cdp) {
  return cdp.evaluate(`(() => {
    const dlg = document.querySelector('.modal[role="dialog"]');
    if (!dlg) return null;
    const head = dlg.querySelector(".modal-head span")?.textContent || "";
    const rows = [...dlg.querySelectorAll("li")].map((li) => li.textContent || "");
    const body = dlg.textContent || "";
    return { head, rows, body };
  })()`);
}

// ----------------------------------------------------------------- cases --
const results = [];
function casePass(name, detail) { results.push({ name, ok: true, detail }); log(`PASS ${name} — ${detail}`); }
function caseFail(name, detail) { results.push({ name, ok: false, detail }); log(`FAIL ${name} — ${detail}`); }

async function runViCases(cdp) {
  // K1: mở panel từ strip, đủ 2 dòng + 2 loại nút.
  try {
    await waitFor(cdp, `[...document.querySelectorAll("button")].some((b) => (b.textContent || "").includes("Xem báo cáo"))`, "strip Xem báo cáo", 30000);
    const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Xem báo cáo"))`);
    await waitFor(cdp, `!!document.querySelector('.modal[role="dialog"]')`, "panel báo cáo mở", 15000);
    const info = await panelInfo(cdp);
    if (!info) throw new Error("không đọc được panel");
    if (!info.head.includes("(2)")) throw new Error(`panel phải báo (2), nhận head: ${info.head}`);
    if (info.rows.length !== 2) throw new Error(`panel phải 2 dòng, nhận ${info.rows.length}`);
    if (!info.body.includes("Sửa dòng này")) throw new Error("panel thiếu nút Sửa dòng này");
    if (!info.body.includes("Sửa tất cả curve vi phạm")) throw new Error("panel thiếu nút Sửa tất cả");
    const perLineCount = await cdp.evaluate(`[...document.querySelectorAll('.modal[role="dialog"] button')].filter((b) => (b.textContent || "").includes("Sửa dòng này")).length`);
    if (perLineCount !== 2) throw new Error(`phải 2 nút Sửa dòng này (mỗi dòng 1 nút), nhận ${perLineCount}`);
    casePass("K1-panel-2-dong", `mở panel bằng click ${m}: head ${info.head}, 2 dòng, 2 nút per-line + 1 nút fix-all`);
  } catch (e) { caseFail("K1-panel-2-dong", e.message); }

  // K2: click "Sửa dòng này" ở dòng đầu (CLIP-A) → chỉ A đổi.
  try {
    const beforeDialogs = cdp.dialogs.length;
    const m = await realClick(cdp, `[...document.querySelectorAll('.modal[role="dialog"] button')].find((b) => (b.textContent || "").includes("Sửa dòng này"))`);
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Sửa dòng này");
    const msg = dialogs[0].message;
    if (!msg.includes("CLIP-A")) throw new Error(`confirm per-line phải nhắc CLIP-A, nhận: ${msg.slice(0, 300)}`);
    if (msg.includes("CLIP-B")) throw new Error(`confirm per-line KHÔNG được nhắc CLIP-B, nhận: ${msg.slice(0, 300)}`);
    if (!msg.includes("Sửa curve tốc độ của clip")) throw new Error(`confirm per-line thiếu tiêu đề dòng, nhận: ${msg.slice(0, 200)}`);
    await waitFor(cdp, `(() => { const d = document.querySelector('.modal[role="dialog"]'); return d && (d.querySelector(".modal-head span")?.textContent || "").includes("(1)"); })()`, "panel về (1) sau sửa per-line", 15000);
    const info = await panelInfo(cdp);
    if (info.rows.some((r) => r.includes("CLIP-A"))) throw new Error("dòng CLIP-A phải biến mất khỏi panel sau sửa per-line");
    if (!info.rows.some((r) => r.includes("CLIP-B"))) throw new Error("dòng CLIP-B phải còn lại trong panel");
    const spec = await readAutosaveSpec(cdp);
    if (!spec) throw new Error("không đọc được autosave sau sửa per-line");
    if (clipV(spec, "CLIP-A") !== 4) throw new Error(`autosave: CLIP-A phải về 4, nhận ${clipV(spec, "CLIP-A")}`);
    if (clipV(spec, "CLIP-B") !== 9) throw new Error(`autosave: CLIP-B phải còn 9 (không được sửa lén), nhận ${clipV(spec, "CLIP-B")}`);
    casePass("K2-per-line-chi-A", `click ${m}: confirm chỉ nhắc CLIP-A (không nhắc CLIP-B); autosave A=4, B=9; panel còn 1 dòng CLIP-B`);
  } catch (e) { caseFail("K2-per-line-chi-A", e.message); }

  // K3: click "Sửa tất cả" → B đổi, panel hết warning.
  try {
    const beforeDialogs = cdp.dialogs.length;
    const m = await realClick(cdp, `[...document.querySelectorAll('.modal[role="dialog"] button')].find((b) => (b.textContent || "").trim().includes("Sửa tất cả curve vi phạm"))`);
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Sửa tất cả");
    const msg = dialogs[0].message;
    if (!msg.includes("CLIP-B")) throw new Error(`confirm fix-all phải nhắc CLIP-B, nhận: ${msg.slice(0, 300)}`);
    if (!msg.includes("Sửa tất cả curve tốc độ vi phạm")) throw new Error(`confirm fix-all thiếu tiêu đề tất cả, nhận: ${msg.slice(0, 200)}`);
    await waitFor(cdp, `(() => { const d = document.querySelector('.modal[role="dialog"]'); return d && (d.textContent || "").includes("không có cảnh báo"); })()`, "panel hiện câu không có cảnh báo", 15000);
    const spec = await readAutosaveSpec(cdp);
    if (!spec) throw new Error("không đọc được autosave sau sửa tất cả");
    if (clipV(spec, "CLIP-B") !== 4) throw new Error(`autosave: CLIP-B phải về 4, nhận ${clipV(spec, "CLIP-B")}`);
    if (clipV(spec, "CLIP-A") !== 4) throw new Error(`autosave: CLIP-A phải vẫn 4, nhận ${clipV(spec, "CLIP-A")}`);
    casePass("K3-fix-all", `click ${m}: confirm nhắc CLIP-B + tiêu đề tất cả; autosave A=4, B=4; panel hết warning`);
  } catch (e) { caseFail("K3-fix-all", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("K4-no-crash-vi", "0 Runtime.exceptionThrown trong phiên vi");
  } else {
    caseFail("K4-no-crash-vi", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

async function runEnCases(cdp) {
  // K5: locale en — nút en bấm được, confirm en không rò key/vi.
  try {
    await waitFor(cdp, `[...document.querySelectorAll("button")].some((b) => (b.textContent || "").includes("View report"))`, "strip View report (en)", 30000);
    const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("View report"))`);
    await waitFor(cdp, `!!document.querySelector('.modal[role="dialog"]')`, "panel báo cáo mở (en)", 15000);
    const info = await panelInfo(cdp);
    if (!info.body.includes("Fix this line")) throw new Error("panel en thiếu nút Fix this line");
    if (!info.body.includes("Fix all violating curves")) throw new Error("panel en thiếu nút Fix all violating curves");
    const beforeDialogs = cdp.dialogs.length;
    const m2 = await realClick(cdp, `[...document.querySelectorAll('.modal[role="dialog"] button')].find((b) => (b.textContent || "").includes("Fix this line"))`);
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Fix this line");
    const msg = dialogs[0].message;
    if (msg.includes("loadReport.") || msg.includes("curveFix.")) throw new Error(`confirm en rò key thô: ${msg.slice(0, 300)}`);
    if (msg.includes("Sửa curve") || msg.includes("đã clamp")) throw new Error(`confirm en rò tiếng Việt: ${msg.slice(0, 300)}`);
    if (!msg.includes("CLIP-A") || msg.includes("CLIP-B")) throw new Error(`confirm en per-line phải chỉ nhắc CLIP-A, nhận: ${msg.slice(0, 300)}`);
    if (!msg.includes("Fix the speed curve of clip")) throw new Error(`confirm en thiếu tiêu đề dòng, nhận: ${msg.slice(0, 200)}`);
    const spec = await readAutosaveSpec(cdp);
    if (!spec) throw new Error("không đọc được autosave sau sửa en");
    if (clipV(spec, "CLIP-A") !== 4) throw new Error(`autosave en: CLIP-A phải về 4, nhận ${clipV(spec, "CLIP-A")}`);
    if (clipV(spec, "CLIP-B") !== 9) throw new Error(`autosave en: CLIP-B phải còn 9, nhận ${clipV(spec, "CLIP-B")}`);
    casePass("K5-en-per-line", `strip+panel en bấm thật (${m}/${m2}): confirm en chỉ nhắc CLIP-A, không key thô, không rò vi; autosave A=4, B=9`);
  } catch (e) { caseFail("K5-en-per-line", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("K6-no-crash-en", "0 Runtime.exceptionThrown trong phiên en");
  } else {
    caseFail("K6-no-crash-en", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

// ------------------------------------------------------------------ main --
async function main() {
  log(`harness clicktest-l4-round29-pipe: bắt đầu (out=${OUT_FILE})`);
  log(`display=${DISPLAY} port=${PORT} binaries=${BINARIES.join(" | ")}`);
  let xvfb = null;
  let server = null;
  let exitCode = 2;
  const holders = [];
  let snapInfo = null;
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap; // đợt 31 N5: timeout handler ghi bundle này vào snapshot
    if (!snap) { log("BLOCKER: dist snapshot thất bại — dừng, không có kết quả click-test"); return 2; }
    snapInfo = snap;
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }

    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên vi)"); return 2; }
      holders.push(holder);
      try {
        await loadSession(cdp, "vi");
        await runViCases(cdp);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch {}
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
      }
    }

    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên en)"); return 2; }
      holders.push(holder);
      try {
        await loadSession(cdp, "en");
        await runEnCases(cdp);
      } finally {
        try { holder.chrome.kill("SIGKILL"); } catch {}
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
      }
    }

    const failed = results.filter((r) => !r.ok);
    exitCode = failed.length === 0 ? 0 : 1;
    log(`TỔNG: ${results.length - failed.length}/${results.length} pass`);
  } catch (e) {
    log(`HARNESS LỖI: ${e.message}`);
    exitCode = 2;
  } finally {
    try { server && server.close(); } catch {}
    try { xvfb && xvfb.kill("SIGKILL"); } catch {}
    const out = {
      run: "v29-l4-clicktest", at: new Date().toISOString(), exitCode,
      dist: snapInfo, results, dialogs: undefined, log: logLines,
    };
    try { writeFileEpermRetry(path.join(SCRATCH, OUT_FILE), JSON.stringify(out, null, 2)); log(`ghi kết quả: ${path.join(SCRATCH, OUT_FILE)}`); } catch {}
  }
  return exitCode;
}

process.exitCode = await main();
