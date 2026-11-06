#!/usr/bin/env node
/**
 * clicktest-n4-round31-pipe.mjs — Phase 9 đợt 31, luồng N4:
 * click-test browser thật cho toast Lưu file / mở lại (autosave) /
 * Xuất bản nén đã dịch qua structuredNotes.
 *
 * Tái dùng infra đợt 30 M4 (pipe CDP --remote-debugging-pipe + snapshot
 * dist + seed qua autosave + static server), đổi display/port/scratch
 * riêng để không đụng các luồng đợt 31 khác đang chạy song song.
 *
 * Seed: 1 clip BLOB1 mang src blob: (còn lại project lành) → mọi toast
 * lưu ý đều chứa đúng 1 note blobUrl, dịch được cả vi/en.
 * Thứ tự case:
 *   V1 (vi): reload → toast khôi phục autosave chứa note blob vi
 *     ("Clip \"BLOB1\" trên track \"v0\" đang trỏ tới blob: URL…"),
 *     không rò key thô.
 *   V2 (vi): click nút Lưu (title "Lưu thành file (Ctrl+S)") → toast
 *     mới chứa "Đã xong, nhưng có lưu ý: " + note blob vi (đường Lưu
 *     file đã sang structuredNotes, thay warnList chuỗi thô đợt 30).
 *   V3 (vi): click Xuất bản nén → toast thành công chứa
 *     "Đã xuất bản nén (" + "Lưu ý: " + note blob vi.
 *   V4 (vi): 0 Runtime.exceptionThrown.
 *   E1 (en): reload → toast autosave en ("Clip \"BLOB1\" on track
 *     \"v0\" points to a blob: URL…"), không rò key thô, không rò
 *     tiếng Việt (dấu).
 *   E2 (en): click Lưu → toast "Done, with notes: " + note blob en,
 *     không rò key/vi.
 *   E3 (en): 0 Runtime.exceptionThrown.
 * Không click-test: toast lỗi mở file/nhập/xuất bản nén (cần chọn file
 * qua file chooser native, pipe CDP không lái được — chỉ khóa bằng
 * key có mặt cả vi/en + tsc + cùng đường pushToast với các toast đã
 * click-test; xem LIMITS đợt 31).
 * Exit 0 khi tất cả pass, 1 khi có FAIL, 2 khi harness lỗi. KHÔNG sửa
 * code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG binary.
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-n4-round31-pipe.mjs
 * Biến môi trường: N4_DISPLAY (mặc định :97), N4_PORT (mặc định 4199),
 * N4_OUT (mặc định v31-n4-clicktest.json).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

let HANG_BUNDLE = null;

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round31-n4");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.N4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.N4_DISPLAY || ":97";
const PORT = Number(process.env.N4_PORT || 4199);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT_FILE = process.env.N4_OUT || "v31-n4-clicktest.json";
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
      // Nhãn đợt 31 N4 phải có trong bundle (key + chuỗi en mới).
      return s.includes("exportArchiveDone") && s.includes("saveDone")
        && s.includes("Done, with notes:");
    });
  if (!bundlePath) {
    log("BLOCKER dist: không bundle nào chứa đồng thời nhãn đợt 31 N4 (exportArchiveDone + saveDone + Done, with notes:) — dist cũ hơn code?");
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
        const size = fs.readFileSync(file).length;
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "n4-pipe-"));
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
function seedSpec() {
  return {
    version: "0.2.0",
    meta: { name: "N4 save toast seed", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "v0", kind: "video", clips: [
      { kind: "video", id: "BLOB1", src: "blob:seed-1", start: 0, duration: 10, in: 0, out: 10 },
      { kind: "video", id: "PLAIN", src: "PLAIN.mp4", start: 0, duration: 10, in: 0, out: 10 },
    ] }],
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
  await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-lang", ${JSON.stringify(lang)}); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seedSpec(), "N4 seed"))});`);
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

// ------------------------------------------------------------ toast helpers
async function toastTexts(cdp) {
  return cdp.evaluate(`[...document.querySelectorAll(".toast-msg")].map((el) => el.textContent || "")`);
}

async function waitToast(cdp, needle, label, timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const texts = await toastTexts(cdp);
    const hit = texts.find((s) => s.includes(needle));
    if (hit) return hit;
    await sleep(300);
  }
  const texts = await toastTexts(cdp);
  throw new Error(`hết ${timeoutMs}ms chờ toast ${label} (chứa ${JSON.stringify(needle)}); toast đang có: ${JSON.stringify(texts)}`);
}

async function dismissToasts(cdp) {
  await cdp.evaluate(`[...document.querySelectorAll(".toast-close")].forEach((b) => b.click())`);
  await sleep(500);
  await waitFor(cdp, `document.querySelectorAll(".toast-msg").length === 0`, "toast đóng hết", 10000);
}

async function reloadAndWaitToast(cdp, needle, label) {
  // Reload để App khôi phục autosave lần nữa → toast khôi phục mới với
  // cửa sổ 4.5s đầy đủ (toast lần đầu có thể đã đóng trong lúc setup).
  await cdp.send("Page.reload", {}, cdp.sessionId);
  await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render sau reload (toast)", 60000);
  return waitToast(cdp, needle, label, 15000);
}

async function closeRelinkIfOpen(cdp) {
  // Sau mỗi reload, App khôi phục autosave → checkMissingMedia có thể
  // mở lại RelinkPanel (media seed thiếu); overlay modal này che
  // TopBar nên click chuột CDP vào nút Lưu/Xuất sẽ trúng modal thay
  // vì nút — phải đóng trước mọi realClick (bài học từ lần chạy đầu
  // V2/V3/E2: click thành công nhưng không có toast vì trúng overlay).
  const relink = await cdp.evaluate(`!!document.querySelector('.modal[aria-label="Media thiếu"]')`);
  if (!relink) return false;
  log("  relink mở lại sau reload -> đóng bằng click thật");
  await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Đóng (bỏ qua)")`);
  await waitFor(cdp, `!document.querySelector('.modal[aria-label="Media thiếu"]')`, "RelinkPanel đóng (sau reload)", 15000);
  return true;
}

// ----------------------------------------------------------------- cases --
const results = [];
function casePass(name, detail) { results.push({ name, ok: true, detail }); log(`PASS ${name} — ${detail}`); }
function caseFail(name, detail) { results.push({ name, ok: false, detail }); log(`FAIL ${name} — ${detail}`); }

const BLOB_VI = 'Clip "BLOB1" trên track "v0" đang trỏ tới blob: URL';
const BLOB_EN = 'Clip "BLOB1" on track "v0" points to a blob: URL';
const VI_DIACRITICS = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/;

async function runViCases(cdp) {
  try {
    const hit = await reloadAndWaitToast(cdp, "blob: URL", "autosave vi");
    if (!hit.includes(BLOB_VI)) throw new Error(`toast autosave vi phải chứa note blob vi, nhận: ${hit}`);
    if (hit.includes("structuredNotes.")) throw new Error(`toast autosave vi rò key thô: ${hit}`);
    casePass("V1-autosave-toast-vi", `reload → toast chứa note blob vi: ${hit.slice(0, 160)}`);
  } catch (e) { caseFail("V1-autosave-toast-vi", e.message); }

  try {
    await dismissToasts(cdp);
    await closeRelinkIfOpen(cdp);
    const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Lưu thành file (Ctrl+S)")`);
    const hit = await waitToast(cdp, "Đã xong, nhưng có lưu ý:", "lưu file vi", 15000);
    if (!hit.includes(BLOB_VI)) throw new Error(`toast Lưu vi phải chứa note blob vi, nhận: ${hit}`);
    if (hit.includes("structuredNotes.")) throw new Error(`toast Lưu vi rò key thô: ${hit}`);
    casePass("V2-save-toast-vi", `click Lưu ${m} → toast: ${hit.slice(0, 180)}`);
  } catch (e) { caseFail("V2-save-toast-vi", e.message); }

  try {
    await dismissToasts(cdp);
    await closeRelinkIfOpen(cdp);
    const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => (b.title || "").startsWith("Xuất project"))`);
    const hit = await waitToast(cdp, "Đã xuất bản nén (", "xuất bản nén vi", 30000);
    if (!hit.includes("Lưu ý: ") || !hit.includes(BLOB_VI)) throw new Error(`toast xuất vi phải có "Lưu ý: " + note blob vi, nhận: ${hit}`);
    if (hit.includes("structuredNotes.")) throw new Error(`toast xuất vi rò key thô: ${hit}`);
    casePass("V3-export-toast-vi", `click Xuất bản nén ${m} → toast: ${hit.slice(0, 200)}`);
  } catch (e) { caseFail("V3-export-toast-vi", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("V4-no-crash-vi", "0 Runtime.exceptionThrown trong phiên vi");
  } else {
    caseFail("V4-no-crash-vi", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

async function runEnCases(cdp) {
  try {
    const hit = await reloadAndWaitToast(cdp, "blob: URL", "autosave en");
    if (!hit.includes(BLOB_EN)) throw new Error(`toast autosave en phải chứa note blob en, nhận: ${hit}`);
    if (hit.includes("structuredNotes.")) throw new Error(`toast autosave en rò key thô: ${hit}`);
    if (VI_DIACRITICS.test(hit)) throw new Error(`toast autosave en rò tiếng Việt: ${hit}`);
    casePass("E1-autosave-toast-en", `reload → toast chứa note blob en: ${hit.slice(0, 160)}`);
  } catch (e) { caseFail("E1-autosave-toast-en", e.message); }

  try {
    await dismissToasts(cdp);
    await closeRelinkIfOpen(cdp);
    const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => b.title === "Lưu thành file (Ctrl+S)")`);
    const hit = await waitToast(cdp, "Done, with notes:", "lưu file en", 15000);
    if (!hit.includes(BLOB_EN)) throw new Error(`toast Lưu en phải chứa note blob en, nhận: ${hit}`);
    if (hit.includes("structuredNotes.")) throw new Error(`toast Lưu en rò key thô: ${hit}`);
    if (VI_DIACRITICS.test(hit)) throw new Error(`toast Lưu en rò tiếng Việt: ${hit}`);
    casePass("E2-save-toast-en", `click Lưu ${m} → toast: ${hit.slice(0, 180)}`);
  } catch (e) { caseFail("E2-save-toast-en", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("E3-no-crash-en", "0 Runtime.exceptionThrown trong phiên en");
  } else {
    caseFail("E3-no-crash-en", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

// ------------------------------------------------------------------ main --
async function main() {
  log(`harness clicktest-n4-round31-pipe: bắt đầu (out=${OUT_FILE})`);
  log(`display=${DISPLAY} port=${PORT} binaries=${BINARIES.join(" | ")}`);
  let xvfb = null;
  let server = null;
  let exitCode = 2;
  let snapInfo = null;
  try {
    fs.mkdirSync(SCRATCH, { recursive: true });
    xvfb = await startXvfb();
    const snap = snapshotDist();
    HANG_BUNDLE = snap;
    if (!snap) { log("BLOCKER: dist snapshot thất bại — dừng, không có kết quả click-test"); return 2; }
    snapInfo = snap;
    server = await startStaticServer(snap.dir);
    if (!server) { log("BLOCKER: static server không lên"); return 2; }

    {
      const holder = {};
      const cdp = await startChrome(holder);
      if (!cdp) { log("BLOCKER: không binary nào mở được pipe (phiên vi)"); return 2; }
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
      run: "v31-n4-clicktest", at: new Date().toISOString(), exitCode,
      dist: snapInfo, results, log: logLines,
    };
    try { fs.writeFileSync(path.join(SCRATCH, OUT_FILE), JSON.stringify(out, null, 2)); log(`ghi kết quả: ${path.join(SCRATCH, OUT_FILE)}`); } catch {}
  }
  return exitCode;
}

process.exitCode = await main();
