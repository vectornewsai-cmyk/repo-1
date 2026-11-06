#!/usr/bin/env node
/**
 * clicktest-m4-round30-pipe.mjs — Phase 9 đợt 30, luồng M4:
 * click-test browser thật cho sửa mức KEYFRAME + case Cancel +
 * hồi quy per-line / fix-all của đợt 29 L4.
 *
 * Kế thừa infra L4 đợt 29 (pipe CDP --remote-debugging-pipe + snapshot
 * dist + seed qua autosave). Khác L4 ở hai điểm:
 * - PipeCdp hỗ trợ DISMISS dialog: harness đặt cdp.nextDialogAccept =
 *   false trước một click để giả lập user bấm Cancel ở confirm thật
 *   (mặc định vẫn accept như L4). Dialog là window.confirm thật của
 *   App, CDP chỉ ghi message + bấm Accept/Cancel thay user.
 * - Seed có clip MULTI mang 2 keyframe vi phạm (kf0 v=5, kf1 v=0.1)
 *   + clip CLIP-B v=9 → báo cáo đúng 3 warnings theo thứ tự
 *   MULTI#0, MULTI#1, CLIP-B. Đây là seed phân biệt được mức keyframe
 *   (chỉ kf0 đổi, kf1 ở lại) với mức clip (cả hai kf đổi cùng lúc).
 *
 * Thứ tự case (phiên vi, nối tiếp trên cùng 1 phiên):
 *   M1 mở panel từ strip: 3 dòng, 3 nút "Sửa dòng này" + 3 nút
 *     "Sửa keyframe này" + 1 nút "Sửa tất cả";
 *   M2 click "Sửa keyframe này" ở dòng MULTI#0 → confirm chỉ nhắc
 *     keyframes[0] (không nhắc keyframes[1], không nhắc CLIP-B);
 *     autosave: MULTI kf0=4, kf1 vẫn 0.1, B vẫn 9; panel còn 2 dòng;
 *   M3 click "Sửa dòng này" ở dòng MULTI#1 rồi CANCEL → dialog ghi
 *     accepted:false; autosave KHÔNG ĐỔI (so chuỗi JSON); panel vẫn
 *     2 dòng; bấm lại nút đó → confirm mở lại cùng nội dung (chứng
 *     tỏ Cancel không tiêu thụ action, không đổi state);
 *   M4 click "Sửa dòng này" ở dòng MULTI#1 (accept) → kf1 về 0.25,
 *     B vẫn 9, panel còn 1 dòng CLIP-B (hồi quy per-line L4);
 *   M5 click "Sửa tất cả" → B về 4, panel hiện câu không có cảnh báo
 *     (hồi quy fix-all L4);
 *   M6 0 Runtime.exceptionThrown trong phiên vi.
 * Phiên en:
 *   M7 panel en đủ nhãn ("Fix this line" / "Fix this keyframe" /
 *     "Fix all violating curves"); click "Fix this keyframe" ở dòng
 *     MULTI#0 → confirm en không rò key thô, không rò tiếng Việt,
 *     chỉ nhắc keyframes[0]; CANCEL → autosave không đổi, panel vẫn
 *     3 dòng;
 *   M8 0 Runtime.exceptionThrown trong phiên en.
 * Giới hạn trung thực: "không sinh undo" sau Cancel được chứng minh
 * bằng đường code (handler return trước mọi store action) + autosave
 * và panel không đổi; độ sâu undo stack không đọc được qua CDP nên
 * không assert trực tiếp stack (xem LIMITS đợt 30 M4).
 * Exit 0 khi tất cả pass, 1 khi có FAIL, 2 khi harness lỗi. KHÔNG sửa
 * code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG binary.
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-m4-round30-pipe.mjs
 * Biến môi trường: M4_DISPLAY (mặc định :96), M4_PORT (mặc định 4197),
 * M4_OUT (mặc định v30-m4-clicktest.json).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
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
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round30-m4");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.M4_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.M4_DISPLAY || ":96";
const PORT = Number(process.env.M4_PORT || 4197);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT_FILE = process.env.M4_OUT || "v30-m4-clicktest.json";
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
    // Đợt 30 M4: null = accept mặc định (như L4); gán false trước một
    // click để dialog kế tiếp bị dismiss (giả lập user bấm Cancel).
    this.nextDialogAccept = null;
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
        if (msg.method === "Page.javascriptDialogOpening" && msg.params) {
          const accept = this.nextDialogAccept ?? true;
          this.nextDialogAccept = null;
          this.dialogs.push({ at: new Date().toISOString(), type: msg.params.type, message: msg.params.message ?? "", accepted: accept });
          if (this.sessionId) {
            this.send("Page.handleJavaScriptDialog", { accept }, this.sessionId, 15000).catch(() => {});
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
      return s.includes("Sửa keyframe này") && s.includes("Fix this keyframe")
        && s.includes("Sửa dòng này") && s.includes("Fix this line");
    });
  if (!bundlePath) {
    log("BLOCKER dist: không bundle nào chứa đồng thời nhãn đợt 30 M4 + đợt 29 L4 (dist cũ hơn code?)");
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
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "m4-pipe-"));
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
    meta: { name: "M4 keyframe seed", width: 1280, height: 720, fps: 30 },
    tracks: [{ id: "t0", kind: "video", clips: [
      {
        kind: "video", id: "MULTI", src: "MULTI.mp4", start: 0, duration: 10, in: 0, out: 10,
        speedKeyframes: { keyframes: [{ t: 0, v: 5, easing: "linear" }, { t: 5, v: 0.1, easing: "linear" }] },
      },
      {
        kind: "video", id: "CLIP-B", src: "CLIP-B.mp4", start: 0, duration: 10, in: 0, out: 10,
        speedKeyframes: { keyframes: [{ t: 0, v: 9, easing: "linear" }] },
      },
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
  await cdp.evaluate(`localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem("vcut-lang", ${JSON.stringify(lang)}); localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(envelope(seedSpec(), "M4 seed"))});`);
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

async function readAutosaveRaw(cdp) {
  return cdp.evaluate(`localStorage.getItem("vcut-studio:autosave:v1")`);
}

function clipKfs(spec, id) {
  for (const t of spec.tracks) {
    const c = (t.clips || []).find((x) => x.id === id);
    if (c) return c.speedKeyframes.keyframes;
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

// Finder: nút trong dòng panel chứa clipId + "#index" (dòng warning).
function rowButtonFinder(clipId, index, labelPart) {
  const rowExpr = `[...document.querySelectorAll('.modal[role="dialog"] li')].find((li) => (li.textContent || "").includes(${JSON.stringify(clipId)}) && (li.textContent || "").includes("#" + ${JSON.stringify(index)}))`;
  return `[...(${rowExpr})?.querySelectorAll("button") || []].find((b) => (b.textContent || "").includes(${JSON.stringify(labelPart)}))`;
}

// ----------------------------------------------------------------- cases --
const results = [];
function casePass(name, detail) { results.push({ name, ok: true, detail }); log(`PASS ${name} — ${detail}`); }
function caseFail(name, detail) { results.push({ name, ok: false, detail }); log(`FAIL ${name} — ${detail}`); }

async function runViCases(cdp) {
  // M1: mở panel từ strip, 3 dòng + đủ 3 loại nút.
  try {
    await waitFor(cdp, `[...document.querySelectorAll("button")].some((b) => (b.textContent || "").includes("Xem báo cáo"))`, "strip Xem báo cáo", 30000);
    const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Xem báo cáo"))`);
    await waitFor(cdp, `!!document.querySelector('.modal[role="dialog"]')`, "panel báo cáo mở", 15000);
    const info = await panelInfo(cdp);
    if (!info) throw new Error("không đọc được panel");
    if (!info.head.includes("(3)")) throw new Error(`panel phải báo (3), nhận head: ${info.head}`);
    if (info.rows.length !== 3) throw new Error(`panel phải 3 dòng, nhận ${info.rows.length}`);
    if (!info.body.includes("Sửa keyframe này")) throw new Error("panel thiếu nút Sửa keyframe này");
    if (!info.body.includes("Sửa dòng này")) throw new Error("panel thiếu nút Sửa dòng này");
    if (!info.body.includes("Sửa tất cả curve vi phạm")) throw new Error("panel thiếu nút Sửa tất cả");
    const kfCount = await cdp.evaluate(`[...document.querySelectorAll('.modal[role="dialog"] button')].filter((b) => (b.textContent || "").includes("Sửa keyframe này")).length`);
    if (kfCount !== 3) throw new Error(`phải 3 nút Sửa keyframe này (mỗi dòng 1 nút), nhận ${kfCount}`);
    casePass("M1-panel-3-dong", `mở panel bằng click ${m}: head ${info.head}, 3 dòng, 3 nút kf + 3 nút dòng + 1 nút fix-all`);
  } catch (e) { caseFail("M1-panel-3-dong", e.message); }

  // M2: sửa keyframe — chỉ kf0 đổi, kf1 và B ở nguyên.
  try {
    const beforeDialogs = cdp.dialogs.length;
    const m = await realClick(cdp, rowButtonFinder("MULTI", 0, "Sửa keyframe này"));
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Sửa keyframe này");
    const msg = dialogs[0].message;
    if (!msg.includes("keyframes[0]")) throw new Error(`confirm kf phải nhắc keyframes[0], nhận: ${msg.slice(0, 300)}`);
    if (msg.includes("keyframes[1]")) throw new Error(`confirm kf KHÔNG được nhắc keyframes[1], nhận: ${msg.slice(0, 300)}`);
    if (msg.includes("CLIP-B")) throw new Error(`confirm kf KHÔNG được nhắc CLIP-B, nhận: ${msg.slice(0, 300)}`);
    if (!msg.includes("Sửa keyframe #0")) throw new Error(`confirm kf thiếu tiêu đề keyframe, nhận: ${msg.slice(0, 200)}`);
    await waitFor(cdp, `(() => { const d = document.querySelector('.modal[role="dialog"]'); return d && (d.querySelector(".modal-head span")?.textContent || "").includes("(2)"); })()`, "panel về (2) sau sửa kf", 15000);
    const info = await panelInfo(cdp);
    if (info.rows.some((r) => r.includes("MULTI") && r.includes("#0"))) throw new Error("dòng MULTI#0 phải biến mất khỏi panel sau sửa kf");
    if (!info.rows.some((r) => r.includes("MULTI") && r.includes("#1"))) throw new Error("dòng MULTI#1 phải còn lại trong panel");
    const spec = await readAutosaveSpec(cdp);
    if (!spec) throw new Error("không đọc được autosave sau sửa kf");
    const multi = clipKfs(spec, "MULTI");
    if (multi[0].v !== 4) throw new Error(`autosave: MULTI kf0 phải về 4, nhận ${multi[0].v}`);
    if (multi[1].v !== 0.1) throw new Error(`autosave: MULTI kf1 phải còn 0.1 (không sửa lén), nhận ${multi[1].v}`);
    if (clipKfs(spec, "CLIP-B")[0].v !== 9) throw new Error(`autosave: CLIP-B phải còn 9, nhận ${clipKfs(spec, "CLIP-B")[0].v}`);
    casePass("M2-keyframe-chi-kf0", `click ${m}: confirm chỉ nhắc keyframes[0]; autosave MULTI=[4, 0.1], B=9; panel còn 2 dòng`);
  } catch (e) { caseFail("M2-keyframe-chi-kf0", e.message); }

  // M3: Cancel ở confirm sửa dòng — không đổi gì. So sánh SPEC (không
  // so chuỗi raw: autosave debounce có thể ghi lại envelope với
  // savedAt mới dù spec y nguyên — lần chạy đầu đã lộ điều này ở
  // Cancel lần 2, nên assertion đúng phải là spec không đổi).
  try {
    const beforeRaw = JSON.stringify(await readAutosaveSpec(cdp));
    const beforeDialogs = cdp.dialogs.length;
    cdp.nextDialogAccept = false;
    const m = await realClick(cdp, rowButtonFinder("MULTI", 1, "Sửa dòng này"));
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Sửa dòng này (Cancel)");
    if (dialogs[0].accepted !== false) throw new Error(`dialog phải bị dismiss (accepted:false), nhận: ${JSON.stringify(dialogs[0])}`);
    if (!dialogs[0].message.includes("MULTI")) throw new Error(`confirm Cancel phải nhắc MULTI, nhận: ${dialogs[0].message.slice(0, 200)}`);
    const afterRaw = JSON.stringify(await readAutosaveSpec(cdp));
    if (afterRaw !== beforeRaw) throw new Error("autosave spec PHẢI KHÔNG ĐỔI sau Cancel (spec JSON khác nhau)");
    const info = await panelInfo(cdp);
    if (!info || info.rows.length !== 2) throw new Error(`panel sau Cancel phải vẫn 2 dòng, nhận ${info ? info.rows.length : "null"}`);
    if (!info.rows.some((r) => r.includes("MULTI") && r.includes("#1"))) throw new Error("dòng MULTI#1 phải còn lại sau Cancel");
    // Bấm lại cùng nút → confirm mở lại cùng nội dung (Cancel không
    // tiêu thụ action, không đổi state).
    const beforeDialogs2 = cdp.dialogs.length;
    cdp.nextDialogAccept = false;
    await realClick(cdp, rowButtonFinder("MULTI", 1, "Sửa dòng này"));
    await sleep(1500);
    const dialogs2 = cdp.dialogs.slice(beforeDialogs2);
    if (dialogs2.length < 1) throw new Error("bấm lại sau Cancel phải mở lại confirm");
    if (dialogs2[0].message !== dialogs[0].message) throw new Error("confirm mở lại phải cùng nội dung với confirm đã Cancel");
    const afterRaw2 = JSON.stringify(await readAutosaveSpec(cdp));
    if (afterRaw2 !== beforeRaw) throw new Error("autosave spec PHẢI KHÔNG ĐỔI sau Cancel lần 2");
    casePass("M3-cancel-khong-doi", `click ${m} + Cancel: dialog accepted:false, autosave spec không đổi, panel vẫn 2 dòng, bấm lại mở cùng confirm`);
  } catch (e) { caseFail("M3-cancel-khong-doi", e.message); }

  // M4: hồi quy per-line L4 — sửa dòng MULTI#1 (accept) chỉ đổi kf1.
  try {
    const beforeDialogs = cdp.dialogs.length;
    const m = await realClick(cdp, rowButtonFinder("MULTI", 1, "Sửa dòng này"));
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Sửa dòng này");
    if (dialogs[0].accepted !== true) throw new Error("dialog per-line hồi quy phải được accept");
    await waitFor(cdp, `(() => { const d = document.querySelector('.modal[role="dialog"]'); return d && (d.querySelector(".modal-head span")?.textContent || "").includes("(1)"); })()`, "panel về (1) sau sửa dòng", 15000);
    const spec = await readAutosaveSpec(cdp);
    if (!spec) throw new Error("không đọc được autosave sau sửa dòng");
    if (clipKfs(spec, "MULTI")[1].v !== 0.25) throw new Error(`autosave: MULTI kf1 phải về 0.25, nhận ${clipKfs(spec, "MULTI")[1].v}`);
    if (clipKfs(spec, "CLIP-B")[0].v !== 9) throw new Error(`autosave: CLIP-B phải còn 9, nhận ${clipKfs(spec, "CLIP-B")[0].v}`);
    casePass("M4-per-line-hoi-quy", `click ${m}: accept sửa dòng MULTI#1 → kf1=0.25, B vẫn 9, panel còn 1 dòng`);
  } catch (e) { caseFail("M4-per-line-hoi-quy", e.message); }

  // M5: hồi quy fix-all L4.
  try {
    const beforeDialogs = cdp.dialogs.length;
    const m = await realClick(cdp, `[...document.querySelectorAll('.modal[role="dialog"] button')].find((b) => (b.textContent || "").trim().includes("Sửa tất cả curve vi phạm"))`);
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Sửa tất cả");
    if (!dialogs[0].message.includes("CLIP-B")) throw new Error(`confirm fix-all phải nhắc CLIP-B, nhận: ${dialogs[0].message.slice(0, 300)}`);
    await waitFor(cdp, `(() => { const d = document.querySelector('.modal[role="dialog"]'); return d && (d.textContent || "").includes("không có cảnh báo"); })()`, "panel hiện câu không có cảnh báo", 15000);
    const spec = await readAutosaveSpec(cdp);
    if (!spec) throw new Error("không đọc được autosave sau sửa tất cả");
    if (clipKfs(spec, "CLIP-B")[0].v !== 4) throw new Error(`autosave: CLIP-B phải về 4, nhận ${clipKfs(spec, "CLIP-B")[0].v}`);
    casePass("M5-fix-all-hoi-quy", `click ${m}: confirm nhắc CLIP-B; autosave B=4; panel hết warning`);
  } catch (e) { caseFail("M5-fix-all-hoi-quy", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("M6-no-crash-vi", "0 Runtime.exceptionThrown trong phiên vi");
  } else {
    caseFail("M6-no-crash-vi", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

async function runEnCases(cdp) {
  // M7: locale en — nhãn kf + confirm en + Cancel en không đổi gì.
  try {
    await waitFor(cdp, `[...document.querySelectorAll("button")].some((b) => (b.textContent || "").includes("View report"))`, "strip View report (en)", 30000);
    const m = await realClick(cdp, `[...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("View report"))`);
    await waitFor(cdp, `!!document.querySelector('.modal[role="dialog"]')`, "panel báo cáo mở (en)", 15000);
    const info = await panelInfo(cdp);
    if (!info.body.includes("Fix this keyframe")) throw new Error("panel en thiếu nút Fix this keyframe");
    if (!info.body.includes("Fix this line")) throw new Error("panel en thiếu nút Fix this line");
    if (!info.body.includes("Fix all violating curves")) throw new Error("panel en thiếu nút Fix all violating curves");
    const beforeRaw = JSON.stringify(await readAutosaveSpec(cdp));
    const beforeDialogs = cdp.dialogs.length;
    cdp.nextDialogAccept = false;
    const m2 = await realClick(cdp, rowButtonFinder("MULTI", 0, "Fix this keyframe"));
    await sleep(1500);
    const dialogs = cdp.dialogs.slice(beforeDialogs);
    if (dialogs.length < 1) throw new Error("không thấy dialog confirm nào sau click Fix this keyframe");
    const msg = dialogs[0].message;
    if (dialogs[0].accepted !== false) throw new Error("dialog en phải bị dismiss (Cancel)");
    if (msg.includes("loadReport.") || msg.includes("curveFix.") || msg.includes("exportPanel.") || msg.includes("projectMenu.")) throw new Error(`confirm en rò key thô: ${msg.slice(0, 300)}`);
    if (msg.includes("Sửa keyframe") || msg.includes("đã clamp")) throw new Error(`confirm en rò tiếng Việt: ${msg.slice(0, 300)}`);
    if (!msg.includes("keyframes[0]") || msg.includes("keyframes[1]")) throw new Error(`confirm en kf phải chỉ nhắc keyframes[0], nhận: ${msg.slice(0, 300)}`);
    if (!msg.includes("Fix keyframe #0")) throw new Error(`confirm en thiếu tiêu đề keyframe, nhận: ${msg.slice(0, 200)}`);
    const afterRaw = JSON.stringify(await readAutosaveSpec(cdp));
    if (afterRaw !== beforeRaw) throw new Error("autosave spec en PHẢI KHÔNG ĐỔI sau Cancel");
    const info2 = await panelInfo(cdp);
    if (!info2 || info2.rows.length !== 3) throw new Error(`panel en sau Cancel phải vẫn 3 dòng, nhận ${info2 ? info2.rows.length : "null"}`);
    casePass("M7-en-keyframe-cancel", `strip+panel en bấm thật (${m}/${m2}): confirm en chỉ nhắc keyframes[0], không key thô, không rò vi; Cancel → autosave không đổi, panel vẫn 3 dòng`);
  } catch (e) { caseFail("M7-en-keyframe-cancel", e.message); }

  if (cdp.exceptions.length === 0) {
    casePass("M8-no-crash-en", "0 Runtime.exceptionThrown trong phiên en");
  } else {
    caseFail("M8-no-crash-en", `${cdp.exceptions.length} exception: ${JSON.stringify(cdp.exceptions[0])}`);
  }
}

// ------------------------------------------------------------------ main --
async function main() {
  log(`harness clicktest-m4-round30-pipe: bắt đầu (out=${OUT_FILE})`);
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
      run: "v30-m4-clicktest", at: new Date().toISOString(), exitCode,
      dist: snapInfo, results, log: logLines,
    };
    try { fs.writeFileSync(path.join(SCRATCH, OUT_FILE), JSON.stringify(out, null, 2)); log(`ghi kết quả: ${path.join(SCRATCH, OUT_FILE)}`); } catch {}
  }
  return exitCode;
}

process.exitCode = await main();
