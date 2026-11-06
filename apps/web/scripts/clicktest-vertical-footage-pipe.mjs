#!/usr/bin/env node
/**
 * clicktest-vertical-footage-pipe.mjs — Phase 9 đợt 23, luồng G6:
 * click-test browser thật cho project dùng footage DỌC.
 *
 * NỢ GỐC: đợt 22 §4 ghi "click-test browser trên footage dọc" chưa có;
 * đợt 22 luồng F chỉ click-test project mẫu ngang + nested ramp, còn
 * luồng C chỉ scrub trên project mẫu ngang. Harness này lấp đúng lỗ đó
 * ở tầng UI thật (không seed state qua store, không sửa code sản phẩm).
 *
 * HẠ TẦNG: tái dùng đúng hướng đợt 22 F (đã chứng minh trên VM này):
 * Chrome headed dưới Xvfb qua --remote-debugging-pipe (fd 3 ghi JSON+\0
 * / fd 4 đọc, tách bằng \0), click/kéo THẬT bằng
 * Input.dispatchMouseEvent. KHÔNG Playwright, KHÔNG dependency mới.
 *
 * LUỒNG CASE (xem LIMITS đợt 23 G6 để biết chính xác cái gì ĐƯỢC và
 * KHÔNG ĐƯỢC khẳng định):
 * - V0: màn WelcomeModal hiện trên profile mới → click THẬT nút ✕
 *   trong dialog (không bypass bằng localStorage như đợt 22 F) →
 *   dialog biến mất + localStorage vcut-welcomed === "1".
 * - V1: seed project dọc qua autosave (envelope .vcut.json hợp lệ,
 *   meta 720×1280, 1 clip video 8s, src "clip-doc-r23.mp4") rồi reload
 *   → App khôi phục đúng project đó (không rơi về project mẫu):
 *   timeline có đúng 1 clip video với id đã seed, input tên project
 *   mang tên đã seed, time-display cho duration 00:08.0.
 * - V2: preview có canvas, chưa exception nào.
 * - V2b: tắt modal "Media thiếu" (do clip seed thiếu media) bằng click
 *   ✕ thật — bước user thật phải làm trước khi chạm được timeline.
 * - V3: kéo ruler 2 chiều bằng chuột thật (pressed + moves +
 *   released): kéo phải → playhead tăng (kể cả clamp về cuối 8s),
 *   kéo trái → playhead giảm. KHÔNG assert tuyệt đối theo % rect vì
 *   ánh xạ rect→giây chịu gutter/zoom (xem LIMITS).
 * - V4: 0 Runtime.exceptionThrown trong suốt phiên.
 *
 * GIỚI HẠN TRUNG THỰC — ĐỌC KỸ TRƯỚC KHI TRÍCH KẾT QUẢ:
 * - Clip seed có src "clip-doc-r23.mp4" nhưng media đó KHÔNG nằm trong
 *   MediaBin của phiên (replaceProject đặt media: []), nên preview vẽ
 *   chữ "Thiếu media: ..." lên canvas thay vì giải mã khung hình thật
 *   của file NASA. Harness này khẳng định: project dọc LOAD ĐƯỢC,
 *   timeline/scrub/preview KHÔNG CRASH trên project dọc — KHÔNG khẳng
 *   định trình duyệt giải mã được đúng byte mp4 dọc (bằng chứng đó ở
 *   tầng FFmpeg: parity dissolve RGB24 cặp thay thế R1→R2 trong LIMITS
 *   đợt này). Muốn click-test phát dọc thật cần thêm đường import file
 *   qua UI (nằm ngoài phạm vi luồng này, không sửa code sản phẩm).
 * - Editor chạy bằng `vite preview` của build sẵn apps/web/dist
 *   (KHÔNG build lại, KHÔNG sửa dist). Thoát mã: 0 = mọi case pass;
 *   1 = có case fail trên UI thật; 2 = blocker hạ tầng.
 * - KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG cài
 *   dependency, KHÔNG đưa binary vào repo. Kết quả JSON ghi vào
 *   benchmarks/results/clicktest-vertical-footage-r23.json (file chạy,
 *   parent quyết có stage hay không).
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-vertical-footage-pipe.mjs
 * Biến môi trường: CLICK_DISPLAY (mặc định :96),
 * CLICK_PORT (mặc định 4196),
 * CLICK_CHROME_BINS (mặc định PW156 rồi META152).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

// Phase 9 đợt 31 N5 — kỷ luật snapshot treo CDP (xem cdp-snapshot.mjs):
// bundle đang đo, gán trong main() sau snapshotDist() nếu có; các
// harness không snapshot dist giữ null (snapshot vẫn ghi proc/ps).
let HANG_BUNDLE = null;
const CDP_HANG_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "clicktest-vertical-footage-pipe");

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.CLICK_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.CLICK_DISPLAY || ":96";
const PORT = Number(process.env.CLICK_PORT || 4196);
const ORIGIN = `http://127.0.0.1:${PORT}`;
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
          this.exceptions.push(JSON.stringify(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text ?? "exception").slice(0, 300));
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
      try { proc.stdio[s]?.on("error", () => { /* pipe chết cùng Chrome, bỏ qua */ }); } catch { /* stdio không phải stream */ }
    }
    proc.on("error", () => { /* spawn lỗi -> send() sẽ reject, finally dọn */ });
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
            outDir: CDP_HANG_OUT_DIR, bundle: HANG_BUNDLE,
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
  async evaluate(expression, timeoutMs = 60000) {
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
      await this.send("Input.dispatchMouseEvent", {
        type: "mousePressed", x, y, button: "left", clickCount: 1, modifiers,
      }, this.sessionId, 15000);
      await this.send("Input.dispatchMouseEvent", {
        type: "mouseReleased", x, y, button: "left", clickCount: 1, modifiers,
      }, this.sessionId, 15000);
      return "cdp-input";
    } catch (e) {
      log(`  Input.dispatchMouseEvent lỗi (${e.message}), fallback element.click()`);
      return "js-click-fallback";
    }
  }
  /** Kéo chuột thật: pressed tại (x0,y) → moves → released tại (x1,y). */
  async dragX(y, x0, x1, steps = 8) {
    await this.send("Input.dispatchMouseEvent", {
      type: "mousePressed", x: Math.round(x0), y: Math.round(y), button: "left", clickCount: 1,
    }, this.sessionId, 15000);
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(x0 + (x1 - x0) * (i / steps));
      await this.send("Input.dispatchMouseEvent", {
        type: "mouseMoved", x, y: Math.round(y),
      }, this.sessionId, 15000);
      await sleep(60);
    }
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseReleased", x: Math.round(x1), y: Math.round(y), button: "left", clickCount: 1,
    }, this.sessionId, 15000);
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
  if (!rect) throw new Error(`không tìm được element: ${finderJs.slice(0, 120)}`);
  const method = await cdp.clickRect(rect, modifiers);
  if (method === "js-click-fallback") {
    await cdp.evaluate(`(${finderJs}).click()`);
  }
  await sleep(500);
  return method;
}

// ------------------------------------------------------------- infra -----
function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    const lock = `/tmp/.X${num}-lock`;
    const xvfbAlive = () => {
      try { return spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; }
      catch { return false; }
    };
    // Bài học lượt chạy 3 (đợt 23 G6): harness kill Xvfb bằng SIGKILL
    // ở finally nên file lock /tmp/.X<n>-lock còn sót lại; Xvfb mới
    // sau đó từ chối tạo socket dù socket đã được xoá. Chỉ xoá lock
    // khi pgrep khẳng định KHÔNG còn tiến trình Xvfb của display này
    // (không bao giờ xoá lock của tiến trình còn sống / luồng khác).
    const dropStaleLock = () => {
      if (!xvfbAlive() && fs.existsSync(lock)) {
        log(`Xvfb: lock ${lock} mồ côi (không thấy tiến trình Xvfb ${DISPLAY}), xoá`);
        try { fs.unlinkSync(lock); } catch { /* kệ */ }
      }
    };
    if (fs.existsSync(sock)) {
      if (xvfbAlive()) {
        log(`Xvfb: socket ${sock} đã có sẵn + tiến trình còn sống (dùng chung), không bật mới`);
        resolve(null);
        return;
      }
      log(`Xvfb: socket ${sock} mồ côi (không thấy tiến trình Xvfb ${DISPLAY}), xoá và bật mới`);
      try { fs.unlinkSync(sock); } catch { /* kệ */ }
      dropStaleLock();
    } else {
      dropStaleLock();
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

function startVitePreview() {
  return new Promise(async (resolve) => {
    const distIndex = path.join(WEB_DIR, "dist", "index.html");
    if (!fs.existsSync(distIndex)) {
      log("BLOCKER dist: không có apps/web/dist/index.html");
      resolve(null);
      return;
    }
    try {
      const r = await fetch(`${ORIGIN}/`);
      if (r.ok) {
        log(`BLOCKER port: ${ORIGIN} đã có tiến trình khác phục vụ — chạy lại với CLICK_PORT khác`);
        resolve(null);
        return;
      }
    } catch { /* cổng trống, tiếp tục */ }
    const viteBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
    const proc = fs.existsSync(viteBin)
      ? spawn(process.execPath, [viteBin, "preview", "--port", String(PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" })
      : spawn("npx", ["vite", "preview", "--port", String(PORT),
          "--host", "127.0.0.1", "--strictPort"], { cwd: WEB_DIR, stdio: "ignore" });
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(proc); } }, 15000);
    (async () => {
      for (let i = 0; i < 30 && !done; i++) {
        await sleep(500);
        try {
          const r = await fetch(`${ORIGIN}/`);
          if (r.ok) { done = true; clearTimeout(timer); resolve(proc); return; }
        } catch { /* chưa lên */ }
      }
    })();
    proc.on("exit", () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
  });
}

// ------------------------------------------------------------- cases -----
const results = [];
function casePass(id, detail) { results.push({ id, status: "PASS", detail }); log(`CASE ${id}: PASS — ${detail}`); }
function caseFail(id, detail) { results.push({ id, status: "FAIL", detail }); log(`CASE ${id}: FAIL — ${detail}`); }

const VERTICAL_NAME = "Dự án dọc R23";
const VERTICAL_CLIP_ID = "c_r23vertical";

/** Envelope autosave project dọc 720×1280, 1 clip video 8s (xem LIMITS). */
function verticalEnvelopeJson() {
  const spec = {
    version: "0.2.0",
    meta: { name: VERTICAL_NAME, width: 720, height: 1280, fps: 30 },
    tracks: [
      {
        id: "v1", kind: "video", label: "Video 1",
        clips: [
          {
            kind: "video", id: VERTICAL_CLIP_ID, src: "clip-doc-r23.mp4",
            start: 0, duration: 8, in: 0, out: 8,
          },
        ],
      },
    ],
  };
  return JSON.stringify({
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(),
    name: VERTICAL_NAME, spec,
  });
}

function parseTimeDisplay(text) {
  // "00:00.0 / 00:08.0" (fmtTime: mm:ss.d) -> [playhead, duration] giây.
  const m = String(text || "").match(/(\d+):(\d+\.\d+)\s*\/\s*(\d+):(\d+\.\d+)/);
  if (!m) return null;
  return {
    playhead: Number(m[1]) * 60 + Number(m[2]),
    duration: Number(m[3]) * 60 + Number(m[4]),
  };
}

async function runCases(cdp) {
  // V0: WelcomeModal hiện trên profile mới -> click THẬT nút ✕ trong dialog.
  try {
    await waitFor(cdp, `!!document.querySelector('[role="dialog"]')`, "WelcomeModal dialog hiện", 30000);
    const m = await realClick(cdp, `[...document.querySelectorAll('[role="dialog"] button')].find((b) => (b.textContent || "").trim() === "✕")`);
    await waitFor(cdp, `!document.querySelector('[role="dialog"]')`, "dialog biến mất sau khi bấm ✕", 15000);
    const welcomed = await cdp.evaluate(`localStorage.getItem("vcut-welcomed")`);
    if (welcomed !== "1") throw new Error(`localStorage vcut-welcomed = ${JSON.stringify(welcomed)} (mong "1")`);
    casePass("V0-welcome-close", `click ${m} nút ✕ thật -> dialog đóng, vcut-welcomed=1 (không bypass localStorage)`);
  } catch (e) { caseFail("V0-welcome-close", e.message); return; }

  // Seed project dọc qua autosave rồi reload (App ưu tiên khôi phục autosave).
  try {
    const env = verticalEnvelopeJson();
    await cdp.evaluate(`localStorage.setItem("vcut-studio:autosave:v1", ${JSON.stringify(env)})`);
    await cdp.send("Page.reload", {}, cdp.sessionId);
    await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render sau reload", 30000);
  } catch (e) { caseFail("V1-vertical-project-load", `seed/reload lỗi: ${e.message}`); return; }

  // V1: project dọc khôi phục đúng (không rơi về project mẫu 2 clip).
  try {
    await waitFor(cdp, `document.querySelectorAll(".tl-clip.clip-video").length === 1`, "timeline có đúng 1 clip video dọc", 30000);
    const clipId = await cdp.evaluate(`document.querySelector(".tl-clip.clip-video")?.getAttribute("data-clip-id")`);
    if (clipId !== VERTICAL_CLIP_ID) throw new Error(`clip id = ${clipId} (mong ${VERTICAL_CLIP_ID} — có thể app đã rơi về project mẫu)`);
    const hasName = await cdp.evaluate(`[...document.querySelectorAll("input")].some((i) => i.value === ${JSON.stringify(VERTICAL_NAME)})`);
    if (!hasName) throw new Error("không thấy input tên project mang tên đã seed (Dự án dọc R23)");
    const td = await cdp.evaluate(`document.querySelector(".time-display")?.textContent`);
    const parsed = parseTimeDisplay(td);
    if (!parsed || Math.abs(parsed.duration - 8) > 0.05) {
      throw new Error(`time-display duration không phải 8s (đo được: ${JSON.stringify(td)})`);
    }
    casePass("V1-vertical-project-load", `autosave dọc khôi phục đúng: 1 clip video id ${clipId}, tên project "${VERTICAL_NAME}", duration 00:08.0`);
  } catch (e) { caseFail("V1-vertical-project-load", e.message); return; }

  // V2: preview có canvas, chưa exception.
  try {
    await waitFor(cdp, `!!document.querySelector("canvas")`, "preview canvas xuất hiện", 15000);
    if (cdp.exceptions.length > 0) throw new Error(`${cdp.exceptions.length} exception trước V2: ${cdp.exceptions[0]}`);
    casePass("V2-preview-alive", "preview canvas hiện, 0 exception tới thời điểm này (clip thiếu media vẽ chữ cảnh báo là hành vi đúng, không phải crash)");
  } catch (e) { caseFail("V2-preview-alive", e.message); }

  // V2b: project seed thiếu media nên App mở modal "Media thiếu" che toàn
  // màn (modal-backdrop) — lần chạy đầu harness kéo ruler xuyên qua
  // backdrop nên playhead đứng yên 0s (không phải bug app: user thật
  // cũng phải tắt modal này trước). Tắt bằng click THẬT nút ✕ của
  // dialog "Media thiếu" rồi mới scrub — đúng luồng user thật.
  try {
    const hasRelink = await cdp.evaluate(`!![...document.querySelectorAll('[role="dialog"]')].find((d) => (d.getAttribute("aria-label") || "") === "Media thiếu")`);
    if (!hasRelink) throw new Error("không thấy dialog Media thiếu sau khi load project seed (mong có, vì clip seed thiếu media)");
    const m = await realClick(cdp, `[...document.querySelectorAll('[role="dialog"]')].find((d) => (d.getAttribute("aria-label") || "") === "Media thiếu")?.querySelector("button.icon-btn")`);
    await waitFor(cdp, `![...document.querySelectorAll('[role="dialog"]')].find((d) => (d.getAttribute("aria-label") || "") === "Media thiếu")`, "dialog Media thiếu biến mất", 15000);
    casePass("V2b-relink-dismiss", `click ${m} nút ✕ dialog Media thiếu -> modal đóng, timeline lộ ra để scrub`);
  } catch (e) { caseFail("V2b-relink-dismiss", e.message); }

  // V3: kéo ruler 2 chiều bằng chuột thật -> playhead dịch theo.
  // KHÔNG assert tuyệt đối 5,6s cho điểm 70%: lần chạy 2 cho thấy kéo
  // tới 70% ruler thì playhead bị clamp về 8s (cuối project) — tức ánh
  // xạ rect ruler → giây không phải tuyến tính thuần theo bề rộng rect
  // (gutter/zoom của timeline), nên assert tuyệt đối theo % rect là sai
  // thước đo. Thay vào đó assert 2 chiều có hướng: kéo tới phải thì
  // playhead tăng (kể cả clamp về cuối), kéo ngược về trái thì playhead
  // giảm — đủ chứng minh scrub ruler hoạt động trên project dọc.
  try {
    const readPlayhead = async () => {
      const t = await cdp.evaluate(`document.querySelector(".time-display")?.textContent`);
      const p = parseTimeDisplay(t);
      if (!p) throw new Error(`không đọc được time-display: ${JSON.stringify(t)}`);
      return p.playhead;
    };
    const before = await readPlayhead();
    const rect = await findRect(cdp, `document.querySelector(".tl-ruler")`);
    if (!rect) throw new Error("không tìm được .tl-ruler");
    const y = Math.round(rect.y + rect.height / 2);
    await cdp.dragX(y, rect.x + rect.width * 0.30, rect.x + rect.width * 0.70);
    await sleep(800);
    const p1 = await readPlayhead();
    if (!(p1 > before)) throw new Error(`kéo 30%→70% không làm playhead tăng (trước ${before}s, sau ${p1}s)`);
    await cdp.dragX(y, rect.x + rect.width * 0.70, rect.x + rect.width * 0.20);
    await sleep(800);
    const p2 = await readPlayhead();
    if (!(p2 < p1)) throw new Error(`kéo ngược 70%→20% không làm playhead giảm (sau kéo phải ${p1}s, sau kéo trái ${p2}s)`);
    casePass("V3-ruler-scrub-vertical", `kéo ruler chuột thật 2 chiều trên project dọc 8s: ${before}s → ${p1}s (kéo phải, có thể clamp cuối) → ${p2}s (kéo trái giảm)`);
  } catch (e) { caseFail("V3-ruler-scrub-vertical", e.message); }

  // V4: không exception runtime nào trong suốt phiên.
  if (cdp.exceptions.length === 0) {
    casePass("V4-no-crash", "0 Runtime.exceptionThrown trong phiên click-test dọc");
  } else {
    caseFail("V4-no-crash", `${cdp.exceptions.length} exception: ${cdp.exceptions[0]}`);
  }
}

// ------------------------------------------------------------- main ------
async function main() {
  log("harness clicktest-vertical-footage-pipe: bắt đầu");
  log(`display=${DISPLAY} port=${PORT} binaries=${BINARIES.join(" | ")}`);
  let xvfb = null;
  let preview = null;
  let chrome = null;
  let exitCode = 2;
  try {
    xvfb = await startXvfb();
    preview = await startVitePreview();
    if (!preview) { log("BLOCKER: vite preview/dist không lên — dừng, không có kết quả click-test"); return 2; }
    log(`vite preview lên tại ${ORIGIN}`);
    let cdp = null;
    let lastErr = null;
    for (const bin of BINARIES) {
      if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
      const profile = fs.mkdtempSync(path.join(os.tmpdir(), "clicktest-vert-"));
      chrome = spawn(bin, [
        "--no-sandbox", "--disable-dev-shm-usage", "--no-first-run",
        "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
        "--remote-debugging-pipe", `--user-data-dir=${profile}`,
        "--window-size=1920,1080", "about:blank",
      ], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
      chrome.stderr.on("data", () => { /* dbus/gpu noise của VM, bỏ qua */ });
      try {
        cdp = new PipeCdp(chrome);
        const t0 = await cdp.send("Target.getTargets", {}, undefined, 30000);
        log(`pipe OK (${bin}): ${(t0.targetInfos || []).length} target ban đầu`);
        const target = await cdp.send("Target.createTarget", { url: "about:blank" });
        await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
        for (let i = 0; i < 50 && !cdp.sessionId; i++) await sleep(100);
        if (!cdp.sessionId) throw new Error("không nhận được sessionId từ Target.attachedToTarget");
        await cdp.send("Page.enable", {}, cdp.sessionId);
        await cdp.send("Runtime.enable", {}, cdp.sessionId);
        break;
      } catch (e) {
        lastErr = e;
        log(`BLOCKER-PIPE ${bin}: ${e.message}`);
        try { chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
        try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* bỏ qua */ }
        chrome = null; cdp = null;
      }
    }
    if (!cdp) { log(`BLOCKER: không binary nào mở được pipe (lỗi cuối: ${lastErr ? lastErr.message : "?"})`); return 2; }
    await cdp.send("Page.navigate", { url: `${ORIGIN}/` }, cdp.sessionId);
    await waitFor(cdp, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`, "React render lần đầu");
    await runCases(cdp);
    const failed = results.filter((r) => r.status !== "PASS");
    exitCode = failed.length === 0 ? 0 : 1;
    log(`DONE clicktest-vertical-footage: ${results.filter((r) => r.status === "PASS").length}/${results.length} case pass, exit=${exitCode}`);
  } catch (e) {
    log(`HARNESS-FAIL: ${e && e.stack ? e.stack : e}`);
    exitCode = 2;
  } finally {
    try { chrome && chrome.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { xvfb && xvfb.kill("SIGKILL"); } catch { /* bỏ qua */ }
    try { preview && preview.kill("SIGKILL"); } catch { /* bỏ qua */ }
    const out = {
      runAt: new Date().toISOString(), display: DISPLAY, port: PORT,
      cases: results, log: logLines,
    };
    const outPath = path.join(ROOT, "benchmarks", "results", "clicktest-vertical-footage-r23.json");
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
      console.log(`results JSON: ${outPath}`);
    } catch (e) { console.log(`không ghi được results JSON: ${e.message}`); }
  }
  return exitCode;
}

process.exitCode = await main();
