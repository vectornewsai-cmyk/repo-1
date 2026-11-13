#!/usr/bin/env node
/**
 * clicktest-77e1-deint-fps.mjs — Phase 9 đợt 77, luồng E1: kiểm chứng
 * headed đường deint-only NHANH trong preview thật (nợ G5 đợt 76 D4 —
 * FPS deint-only half-res 0.72–0.73×, FAIL ngưỡng 0.75×).
 *
 * Đợt 77 E1 (lib/enhancePreview.ts + preview.tsx, deintIntermediateSource):
 * probe-77e1-deint-fast chứng minh inline-shift 1 lần vẽ KHÔNG thể khử
 * combing ở upscale (R 0.85 → 0.88 ở s=1.13 — xác nhận D4 probe-b),
 * tap2 2 lần vẽ từ video R tốt ở 1.13 (0.58) nhưng FAIL tiêu chí 1:1
 * (0.67 > 0.55) và thông lượng 1.66–2.4×, blur(1px) R tốt nhưng thông
 * lượng 2.3–61× và vgrad chỉ 20–41% — cả ba LOẠI. Ứng viên CHỐT:
 * intermediate THU HẸP DỌC 4× (dw×dh/4 thay vì dw×dh/2): lần 1 chỉ
 * 1/2 pixel của half-res (dự đoán FPS ~0.85× nếu chi phí tỉ lệ với
 * pixel), probe R 0.58 ở s=1.13 / 0.54 ở s=1.0 (≤ 0.55 ✓), hgrad giữ
 * 91% như half-res, đổi lại vgrad 38% (half-res 59%). Khi CHỈ có
 * deintTap thì plan.needsOffscreen = false và preview.tsx đưa drawSrc
 * qua canvas trung gian dw×(dh/4) rồi vẽ lên khổ đích. Tap chỉ áp khi
 * vẽ gần full-res (tỉ lệ vẽ thật ≥ 0.9). Chạy harness này TRƯỚC khi đổi
 * code để lấy baseline half-res cùng ngày, rồi chạy lại SAU khi đổi code
 * để đo ứng viên — cùng case, cùng ngưỡng, so sánh trực tiếp.
 *
 * Các case (mặc định cửa sổ 2560×1440, scaleY ~1.13):
 *   G0. App mount + project mẫu + canvas đủ lớn (scaleY ≥ 0.9 → chế độ
 *       main; scaleY < 0.9 → chế độ scale075, chỉ chạy G6 + H9).
 *   G1. Baseline deint TẮT: R interlaced cao hơn R progressive đối chứng
 *       cùng cỡ canvas (gap > 0.10), hook tap false / applied [] /
 *       offscreen false; lưu snapshot A.
 *   G2. Bật deinterlace bằng CHUỘT THẬT: hook tap true / applied
 *       [deinterlace] / offscreen FALSE (đường intermediate — khác C8:
 *       offscreen true); R giảm về băng yadif (< 0.65 và < 0.8× R gốc);
 *       snapshot B đổi pixel thật (MAD > 0.5).
 *   G3. Tắt lại bằng chuột thật: snapshot C pixel-identical với A (MAD 0).
 *   G4. Đối chứng progressive (clean720) + deint BẬT: R vẫn < 0.8
 *       (tap không tạo thêm răng cưa).
 *   G5. FPS xen kẽ [B,I,B,I,B,I,B], 3s/slot, tỉ lệ drift-corrected; ngưỡng
 *       0.75x giữ nguyên (mẫu đợt 61 R3 §6.7 — không nới). Hook mỗi slot
 *       deint phải là tap true + offscreen false (đường intermediate).
 *   G6. (chỉ chế độ scale075, cửa sổ nhỏ — E1_WINDOW=1700,1000):
 *       tap KHÔNG áp dưới ngưỡng 0.9: bật deint → hook tap false,
 *       snapshot MAD = 0 so với baseline cùng cỡ; đo gap R interlaced −
 *       clean ở tỉ lệ đó (kỳ vọng ~0.12 như sweep probe C8).
 *   G7a. Tap + scale-keyframes (nhánh SR) + motion-blur đã cấu hình,
 *       ở scaleY ≥ 0.9: R giảm như G2, MAD > 0.5, hook tap true +
 *       offscreen false. Motion-blur chỉ blend khi đang phát (gate đợt
 *       62 R3) nên ở pause case này chỉ khóa nhánh SR; nhánh
 *       blend-motion-blur ghi rõ là chưa đo headed (xem LIMITS).
 *   G7b. Tap + mask rect (không SR): KHÔNG hồi quy — mask unit 640×360
 *       downscale dọc 2× nên răng cưa đã bị trung bình hết ngay cả khi
 *       deint TẮT; tiêu chí: |ΔR| ≤ 0.05, MAD < 0.05, hook tap true.
 *   G8. Footage thật (Big Buck Bunny 720p qua minterpolate 60fps +
 *       tinterlace, idet TFF — KHÔNG phải testsrc2): R off/on + MAD,
 *       đối chứng progressive BBB; so với số testsrc2 (R 0.74 → 0.54).
 *   H9. 0 lỗi trang.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-77e1-deint-fps.mjs
 * Env: E1_DEV_PORT (5580–5589), E1_DEBUG_PORT (9680–9689), E1_DISPLAY
 * (:180–:189), E1_SCRATCH (mặc định hidden_files/round77-e1/headed),
 * E1_WINDOW (mặc định 2560x1440; 1700x1000 cho chế độ scale075).
 * Đợt 97 Y9: E1_MEDIA_BASE (hook fault-injection — trỏ media probe sang
 * server khác, mặc định vite dev của E1), E1_CDP_LIST_ATTEMPTS (mặc định
 * 180 lần thử /json/list).
 * Đợt 98 Z8: slot 5 s + deadline 60 s cho vòng /json/list (worst case mới
 * ≈ 65 s thay vì ~450 s); quy tắc verdict G5 vùng 0,6–0,9 (module
 * deint-fps-verdict.mjs — mean ≥ 0,9 PASS chắc, ≤ 0,6 FAIL chắc, vùng
 * xám đo thêm lần 2 rồi verdict trên mean gộp 10 tỉ lệ, ngưỡng 0,75);
 * E1_G5_FORCE_SECOND_RUN=1 ép đo lần 2 dù lần 1 đã chắc (chỉ để kiểm
 * chứng đường lần 2), E1_CDP_LIST_SLOT_MS / E1_CDP_LIST_DEADLINE_MS
 * chỉnh slot/deadline vòng /json/list.
 * Đợt 100 B7: Space-toggle chờ-trạng-thái (poll playing tới khi lật, tối
 * đa 5s/lần) + thử lại Space 1 lần + fallback store (mẫu N10/M1) — sửa
 * abort run2 đợt 99 A7 ở slot 7; quy tắc phân loại slot-tải-đầu trong lần
 * yên (baseline mean ≥ 10 + slot 0 < 6 fps → "yên-slot-tải-đầu") gắn vào
 * g5Rounds/g5Verdict trong report JSON; mỗi slot ghi playMethod/pauseMethod.
 * Đợt 101 C8: fault-injection keydown chậm (CHỈ harness/test, env-gated,
 * mặc định TẮT) để chứng minh đường retry/fallback của B7 bắn thật:
 * E1_FAULT_KEYDOWN_DELAY_MS (ms nuốt keydown Space rồi phát lại) +
 * E1_FAULT_KEYDOWN_COUNT (số keydown bị nuốt) + E1_FAULT_SLOT (mặc định
 * slot 0) + E1_FAULT_WHICH (mặc định "lần 1" = chiều PHÁT) — listener
 * capture-phase trên window chặn handler Space của App.tsx, dọn ngay sau
 * khi toggle xong (hủy các lần phát lại đang chờ để không toggle muộn
 * làm bẩn slot đo). Kịch bản: DELAY=7000 + COUNT=1 → retry bắn;
 * DELAY=12000 + COUNT=2 → fallback store bắn. Không sửa production.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG sửa code sản phẩm.
 * KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import { verdictG5, combineG5Verdict, classifyIdleRound, classifyIdleRun } from "./deint-fps-verdict.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const MEDIA_DIR = path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");
const SCRATCH = process.env.E1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round77-e1", "headed");
const WIN = process.env.E1_WINDOW || "2560x1440";
// Đợt 90 R6 (Q7 §7.4): slot "đóng băng" = draw < 0,5 fps (N10: slot
// 0,00 / 0,27 fps) — ghi kèm mọi verdict để mean tỉ lệ không che
// được slot chết đứng. Cùng ngưỡng với verdict script K3 (FROZEN_FPS).
const FROZEN_FPS = 0.5;
// Đợt 97 Y9: timeout chung cho mọi fetch trong E1 (mẫu X6 up-loop:
// AbortSignal.timeout(2000)). Trước Y9 chỉ up-loop có timeout; media
// probe và vòng CDP /json/list không có nên treo vĩnh viễn khi endpoint
// nhận kết nối mà không trả lời.
const FETCH_TIMEOUT_MS = 2000;
// Hook fault-injection cho media probe (Y9): trỏ media probe sang server
// khác thay vì vite dev của E1; mặc định rỗng = dùng vite dev.
const MEDIA_BASE_OVERRIDE = (process.env.E1_MEDIA_BASE || "").replace(/\/$/, "");
// Số lần thử vòng CDP /json/list (mặc định 180 ≈ 90s khi fetch fail
// nhanh; mỗi lần thử timeout 2s nên endpoint treo cũng bị chặn).
const CDP_LIST_ATTEMPTS = Number(process.env.E1_CDP_LIST_ATTEMPTS || 180);
// Đợt 98 Z8: slot 5 s + deadline tổng 60 s cho vòng /json/list — QUYẾT
// theo nợ Y9 §6.1. Trước Z8: 180 lần × (timeout 2 s + ngủ 0,5 s) =
// worst case ~450 s khi endpoint treo (chỉ bị chặn, chưa đủ ngắn).
// Nay mỗi lần thử là một "slot" tối đa 5 s (fetch timeout 2 s + ngủ
// tối đa 0,5 s — ép cứng bằng Math.min nên không lần thử nào vượt
// quá slot) và toàn vòng bị chặn bởi deadline tổng 60 s → worst case
// mới ≈ 65 s (deadline + 1 slot dở). E1_CDP_LIST_ATTEMPTS còn là chặn
// phụ; Chrome khởi động bình thường chỉ cần vài lần thử (fetch fail
// nhanh ~ms + ngủ 0,5 s) nên deadline 60 s không cắt lượt chạy thật.
const CDP_LIST_SLOT_MS = Number(process.env.E1_CDP_LIST_SLOT_MS || 5000);
const CDP_LIST_DEADLINE_MS = Number(process.env.E1_CDP_LIST_DEADLINE_MS || 60000);
// Đợt 100 B7: Space-toggle flaky dưới tải (nợ LIMITS gộp đợt 99 §4 mục 11).
// E1 run2 đợt 99 A7 abort ở slot 7 ("bấm Space lần 2 mà playing vẫn true")
// khi load vọt 3,16 → 9,08 giữa lần đo; tiền lệ M1 §6: N10 đã phải
// fallback store 3 lần. Nguyên nhân đã xác định (không sửa production):
// store `playing` chỉ đổi qua togglePlay() (store.ts:922-931) — không vòng
// lặp nào tự set lại playing=true — nên "vẫn true" sau Space #2 chỉ có
// thể là keydown chưa được renderer xử lý kịp (main thread bão hoà dưới
// tải) trong cửa sổ chờ cố định 400ms, rồi harness đọc state cũ và abort.
// Fix (chỉ harness): chờ-trạng-thái (poll playing tới khi lật, tối đa
// E1_TOGGLE_TIMEOUT_MS/lần) + thử lại Space tối đa E1_TOGGLE_RETRIES lần
// + fallback store setState({playing:<want>}) theo mẫu N10 đã chứng minh
// — chỉ throw khi cả 3 đường đều không lật được. Chờ đủ lâu trước khi thử
// lại để keydown đầu (nếu chỉ chậm chứ không mất) kịp xử lý, tránh
// double-toggle: keydown chậm + Space thử lại = 2 lần toggle = về như cũ.
const TOGGLE_TIMEOUT_MS = Number(process.env.E1_TOGGLE_TIMEOUT_MS || 5000);
const TOGGLE_RETRIES = Number(process.env.E1_TOGGLE_RETRIES || 1);
// Đợt 101 C8: fault-injection keydown chậm (CHỈ harness/test, env-gated,
// mặc định TẮT — không sửa production, không đổi hành vi khi env = 0).
// Mục đích: chứng minh đường retry/fallback của B7 bắn thật — nuốt N
// keydown Space đầu của toggle ở slot E1_FAULT_SLOT (mặc định slot 0,
// chiều PHÁT "lần 1") rồi phát lại sau E1_FAULT_KEYDOWN_DELAY_MS.
// Cơ chế: listener capture-phase trên window, stopImmediatePropagation()
// chặn handler Space của App.tsx (window keydown, bubble-phase) — keydown
// "chưa được xử lý kịp" y hệt ca gốc A7 run2 slot 7, nhưng có kiểm soát
// và đo được. Sau khi toggle xong, listener được gỡ + các lần phát lại
// đang chờ bị hủy (clearTimeout) để không toggle muộn làm bẩn slot đo.
// Kịch bản: DELAY=7000 + COUNT=1 → retry bắn (Space #2 thật lật);
// DELAY=12000 + COUNT=2 → cả 2 Space đều quá hạn 5s+5s → fallback store
// bắn. Chạy: E1_FAULT_KEYDOWN_DELAY_MS=7000 E1_FAULT_KEYDOWN_COUNT=1
// E1_FAULT_SLOT=0 node apps/web/scripts/clicktest-77e1-deint-fps.mjs
const FAULT_DELAY_MS = Number(process.env.E1_FAULT_KEYDOWN_DELAY_MS || 0);
const FAULT_COUNT = Number(process.env.E1_FAULT_KEYDOWN_COUNT || 0);
const FAULT_SLOT = Number(process.env.E1_FAULT_SLOT || 0);
const FAULT_WHICH = process.env.E1_FAULT_WHICH || "lần 1";
// Đợt 102 D7: fault FB2 — keydown Space muộn TỔNG HỢP, dispatch ngay sau
// fallback store #1 (chỉ fb===0, env-gated, mặc định TẮT). Mô phỏng đúng
// sự kiện "keydown chậm tới sau khi fallback #1 đã set playing" mà
// timer-redispatch của C8 không bắn trúng được: waitPlaying của fallback
// #1 trả ok ngay ở poll đầu (playing đã true) nên keydown muộn theo
// timer gần như không bao giờ lọt vào cửa sổ chờ 2s. Dispatch đồng bộ
// qua window.dispatchEvent (cùng cơ chế redispatch của C8, handler Space
// của App.tsx không check isTrusted) nên lật lại playing TRƯỚC poll đầu
// của waitPlaying — vòng lặp fallback #2 phải bắn thì slot mới xong.
// Dùng DELAY lớn (vd 20000) + COUNT=2 để 2 redispatch theo timer nằm
// ngoài mọi cửa sổ chờ và bị cleanup hủy sau toggle (không bẩn slot đo).
// Chạy: E1_FAULT_KEYDOWN_DELAY_MS=20000 E1_FAULT_KEYDOWN_COUNT=2 E1_FAULT_FB2=1
//   E1_FAULT_SLOT=0 node apps/web/scripts/clicktest-77e1-deint-fps.mjs
const FAULT_FB2 = Number(process.env.E1_FAULT_FB2 || 0);
const FAULT_FB2_DISPATCH_FN = `(() => {
  const ev = new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true, cancelable: true });
  ev.__e1FaultRedispatch = true;
  window.dispatchEvent(ev);
  return "dispatched";
})()`;
const FAULT_INSTALL_FN = (delayMs, count) => `(() => {
  if (window.__e1Fault) return "already-installed";
  let remaining = ${count};
  const pending = [];
  const fn = (e) => {
    if (e.type !== "keydown" || e.code !== "Space") return;
    if (e.__e1FaultRedispatch) return;
    if (remaining <= 0) return;
    remaining--;
    e.stopImmediatePropagation();
    e.preventDefault();
    const id = setTimeout(() => {
      const ev = new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true, cancelable: true });
      ev.__e1FaultRedispatch = true;
      window.dispatchEvent(ev);
    }, ${delayMs});
    pending.push(id);
  };
  window.__e1Fault = { fn, pending };
  window.addEventListener("keydown", fn, true);
  return "installed";
})()`;
const FAULT_CLEANUP_FN = `(() => {
  const f = window.__e1Fault;
  if (!f) return "none";
  window.removeEventListener("keydown", f.fn, true);
  f.pending.forEach((id) => clearTimeout(id));
  delete window.__e1Fault;
  return "cleaned";
})()`;
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round77-e1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.e1.headed.config.mjs");
const CHROME_PW = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = fs.existsSync(CHROME_PW) ? CHROME_PW : findChrome();

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}
async function pickFreePort(lo, hi) {
  for (let p = lo; p <= hi; p++) {
    const free = await new Promise((res) => {
      const s = net.createServer();
      s.once("error", () => res(false));
      s.once("listening", () => s.close(() => res(true)));
      s.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return null;
}

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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 60s: ${method}`)); }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x: Math.round(x), y: Math.round(y), ...extra });
  }
  async click(x, y, modifiers = 0) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await sleep(400);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const INJECT_ERRORS = `(() => {
  window.__e1errors = [];
  window.addEventListener("error", (e) => { try { window.__e1errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__e1errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__e1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__e1errors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__e1storeMod || (window.__e1storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
    mask: c.mask ?? null, animations: c.animations ?? null, motion: c.motion ?? null,
  });
  const hook = window.__vcutPreviewEnhance ? { ...window.__vcutPreviewEnhance } : null;
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const hold = window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null;
  const canvas = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  return {
    clips, selection: st.selection, playhead: st.playhead, playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled, hook, idle, hold,
    canvasW: canvas ? canvas.width : null, canvasH: canvas ? canvas.height : null,
    scaleY: canvas ? +(Math.min(canvas.width / 1280, canvas.height / 720)).toFixed(3) : null,
    errors: (window.__e1errors || []).slice(),
  };
})()`;

const SAMPLE_FN = `(() => {
  const st = window.__e1storeMod ? window.__e1storeMod.useStore.getState() : null;
  return {
    draw: window.__vcutHoldStats ? window.__vcutHoldStats.draw : null,
    ticks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    ph: st ? st.playhead : null,
    playing: st ? st.playing : null,
    wall: performance.now(),
  };
})()`;

const RAF_STATS_TIME_FN = (t0, t1) => `(() => {
  const h = window.__vcutPreviewRaf;
  if (!h) return null;
  const s = h.samples.filter((x) => x.t >= ${t0} && x.t <= ${t1} && x.playing && !x.justWoke);
  if (!s.length) return { n: 0 };
  const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
  const p = (q) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  return { n: s.length, gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1),
    gapMax: +gaps[gaps.length - 1].toFixed(1), over100: s.filter((x) => x.gapMs > 100).length,
    lostMs: +s.reduce((a, x) => a + x.lostMs, 0).toFixed(0) };
})()`;

// Đợt 97 Y9: heap JS đầu/cuối slot (performance.memory, Chromium headed)
// — proxy áp lực GC cho điều tra nhiễu slot (LIMITS gộp đợt 96 §4 mục 12).
// Trả null khi trình duyệt không expose performance.memory.
const HEAP_FN = `(() => {
  const m = window.performance && window.performance.memory ? window.performance.memory : null;
  return m ? { usedMB: +(m.usedJSHeapSize / 1048576).toFixed(1), totalMB: +(m.totalJSHeapSize / 1048576).toFixed(1) } : null;
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const st2 = window.__e1storeMod.useStore.getState();
  const c = st2.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)}).clips.find((x) => x.id === ${JSON.stringify(clipId)});
  return { patched: n, clip: { enhance: c.enhance ?? null, mask: c.mask ?? null, animations: c.animations ?? null, motion: c.motion ?? null, src: c.src } };
})()`;

// patchClip qua store thật (đúng action panel dùng) — mẫu 61R3 combo.
const SR_ONLY_PATCH = JSON.stringify({
  animations: { scale: { keyframes: [{ t: 0, v: 1.2 }, { t: 4, v: 1.2 }] } },
  motion: { interpolation: "none", motionBlur: { frames: 4, weights: [0.25, 0.25, 0.25, 0.25] } },
});
const MASK_ONLY_PATCH = JSON.stringify({
  mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.2 },
});

const CLICK_ENH_FN = (testid) => `(() => {
  const el = document.querySelector('[data-testid="${testid}"]');
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const b = el.getBoundingClientRect();
  const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, coveredBy: at === el || el.contains(at) ? null : (at?.tagName + "." + (at?.className || "")) };
})()`;

const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

// Combing trên canvas preview thật (mẫu D3 đợt 61 R3).
const PREVIEW_COMBING_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const lum = (x, y) => { const i = (y * W + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
  let cross = 0, same = 0, n = 0;
  for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
    cross += Math.abs(lum(x, y) - lum(x, y + 1));
    same += Math.abs(lum(x, y) - lum(x, y + 2));
    n++;
  }
  const cm = cross / n, sm = same / n;
  return { ok: true, w: W, h: H, cross: +cm.toFixed(3), same: +sm.toFixed(3),
    ratio: +(cm / Math.max(sm, 0.001)).toFixed(2), n };
})()`;

// Thống kê luma canvas preview (cổng frame thật: std ≥ 8).
const PREVIEW_CANVAS_STATS_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  let sum = 0, sum2 = 0, n = 0;
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
    const i = (y * W + x) * 4;
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    sum += l; sum2 += l * l; n++;
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  return { ok: true, w: W, h: H, mean: +mean.toFixed(2), std: +std.toFixed(2), n };
})()`;

// Snapshot pixel canvas preview (lấy mẫu mỗi 4px, vùng trung tâm) + so MAD.
const SNAPSHOT_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const px = [];
  for (let y = y0; y < y1; y += 4) for (let x = x0; x < x1; x += 4) {
    const i = (y * W + x) * 4;
    px.push(d[i], d[i + 1], d[i + 2]);
  }
  window.__e1snap = { w: W, h: H, px };
  return { ok: true, w: W, h: H, n: px.length / 3 };
})()`;
const SNAPDIFF_FN = `(() => {
  const snap = window.__e1snap;
  if (!snap) return { ok: false, reason: "chưa có snapshot" };
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  if (c.width !== snap.w || c.height !== snap.h) return { ok: false, reason: "canvas đổi kích thước" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  let sum = 0, cnt = 0, changed = 0, idx = 0;
  for (let y = y0; y < y1; y += 4) for (let x = x0; x < x1; x += 4) {
    const i = (y * W + x) * 4;
    for (let ch = 0; ch < 3; ch++) {
      const diff = Math.abs(d[i + ch] - snap.px[idx++]);
      sum += diff; cnt++;
      if (diff > 0) changed++;
    }
  }
  return { ok: true, meanAbsDiff: +(sum / cnt).toFixed(4), pctChanged: +(100 * changed / cnt).toFixed(2), n: cnt };
})()`;

const results = [];
const phaseErrors = [];
function pass(name, detail) { results.push({ name, ok: true, detail }); log(`PASS ${name}: ${detail}`); }
function fail(name, detail) { results.push({ name, ok: false, detail }); log(`FAIL ${name}: ${detail}`); }

let vite = null, xvfb = null, chrome = null;
function killAll() {
  try { chrome?.kill("SIGKILL"); } catch {}
  try { xvfb?.kill("SIGKILL"); } catch {}
  try { vite?.kill("SIGKILL"); } catch {}
}

async function main() {
  // Đợt 90 R6 (L3 §7.5): bọc TOÀN BỘ main trong try/finally — trước đây
  // mọi throw TRƯỚC khối try (chọn cổng/display, ghi vite cfg, vòng
  // spawn vite, Xvfb, chrome, CDP, mount) đều bỏ qua killAll → vite/
  // chrome/xvfb mồ côi giữ cổng/display, lần chạy sau vite chết
  // EADDRINUSE nhưng fetch(DEV_URL) vẫn "lên" vì trúng server mồ côi
  // (false positive). Khối try cũ ở trước G0 đã dời lên đây.
  try {
  fs.mkdirSync(SCRATCH, { recursive: true });
  let DEV_PORT = Number(process.env.E1_DEV_PORT || 0) || (await pickFreePort(5580, 5589));
  let DEBUG_PORT = Number(process.env.E1_DEBUG_PORT || 0) || (await pickFreePort(9680, 9689));
  async function pickDisplay() {
    const { execSync } = await import("node:child_process");
    for (let n = 180; n <= 189; n++) {
      const d = `:${n}`;
      const sock = `/tmp/.X11-unix/X${n}`;
      if (fs.existsSync(sock)) {
        let alive = false;
        try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
        if (alive) continue;
        try { fs.unlinkSync(sock); } catch {}
        try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
        log(`đã dọn socket X mồ côi ${sock}`);
      }
      return d;
    }
    return null;
  }
  const DISPLAY = process.env.E1_DISPLAY || (await pickDisplay());
  if (!DISPLAY) throw new Error("hết display trống :180–:189");
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5580–5589");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9680–9689");
  if (!CHROME) throw new Error("không thấy chrome trong ~/.cache/ms-playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  for (const f of ["interlaced720.mp4", "clean720.mp4"]) {
    if (!fs.existsSync(path.join(MEDIA_DIR, f))) throw new Error(`không thấy fixture ${f} ở ${MEDIA_DIR}`);
  }
  let DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  let MEDIA_URL = (f) => MEDIA_BASE_OVERRIDE ? `${MEDIA_BASE_OVERRIDE}/r77e1-media/${f}` : `${DEV_URL}r77e1-media/${f}`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  const TMPDIR = "/tmp/round77-e1/tmp";
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
  writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});
const react = require("@vitejs/plugin-react").default;
const MEDIA_DIR = ${JSON.stringify(MEDIA_DIR)};
const MIME = { ".mp4": "video/mp4", ".png": "image/png", ".webm": "video/webm", ".jpg": "image/jpeg" };
const mediaPlugin = () => ({ name: "d4-media", configureServer(server) {
  server.middlewares.use("/r77e1-media", (req, res) => {
    const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\\//, "");
    const fp = path.join(MEDIA_DIR, name);
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!name || name.includes("..") || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.statusCode = 404; res.end("not found"); return; }
    const st = fs.statSync(fp);
    const range = req.headers.range;
    res.setHeader("Content-Type", MIME[path.extname(fp).toLowerCase()] || "application/octet-stream");
    res.setHeader("Accept-Ranges", "bytes");
    if (range) {
      const m = /bytes=(\\d+)-(\\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", \`bytes \${start}-\${end}/\${st.size}\`);
        res.setHeader("Content-Length", String(end - start + 1));
        fs.createReadStream(fp, { start, end }).pipe(res);
        return;
      }
    }
    res.setHeader("Content-Length", String(st.size));
    fs.createReadStream(fp).pipe(res);
  });
} });
export default { plugins: [react(), mediaPlugin()], server: { hmr: false } };
`);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, cửa sổ ${WIN}, loadavg ${loadAvg()}`);

  const viteLogFd = fs.openSync(path.join(SCRATCH, "c77e1-headed-vite.log"), "w");
  // Thử tối đa 3 lần: vòng 77 nhiều luồng song song, cổng có thể bị luồng
  // khác chiếm giữa lúc pickFreePort và lúc vite bind (E9 đã chiếm 5580
  // ở lần chạy baseline đầu — vite chết EADDRINUSE nhưng fetch(DEV_URL)
  // vẫn "lên" vì trúng server của luồng khác, media probe 200 thay vì
  // 206). Mỗi lần thử lại đều kiểm tra cả vite sống + media probe 206.
  // Đợt 90 R6 (Q7 §3.1): file log vite có thể 0 byte dưới sóng EPERM
  // (ghi file fail lặng) nên KHÔNG chẩn đoán từ file — giữ thêm đuôi
  // log 4KB trong bộ nhớ (viteTail, miễn nhiễm EPERM) và phân biệt
  // EPERM với port conflict trong thông báo lỗi cuối vòng.
  let viteOk = false;
  const viteAttempts = [];
  for (let attempt = 0; attempt < 3 && !viteOk; attempt++) {
    if (attempt > 0) {
      try { vite?.kill("SIGKILL"); } catch {}
      DEV_PORT = Number(process.env.E1_DEV_PORT || 0) || (await pickFreePort(5580, 5589));
      DEBUG_PORT = Number(process.env.E1_DEBUG_PORT || 0) || (await pickFreePort(9680, 9689));
      if (!DEV_PORT || !DEBUG_PORT) throw new Error("hết cổng trống sau khi thử lại");
      DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
      MEDIA_URL = (f) => MEDIA_BASE_OVERRIDE ? `${MEDIA_BASE_OVERRIDE}/r77e1-media/${f}` : `${DEV_URL}r77e1-media/${f}`;
      log(`thử lại vite lần ${attempt + 1}: dev :${DEV_PORT}, debug :${DEBUG_PORT}`);
    }
    let viteTail = "";
    const tailAppend = (chunk) => {
      viteTail = (viteTail + chunk).slice(-4096);
      try { fs.writeSync(viteLogFd, chunk); } catch {}
    };
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"] });
    vite.stdout.on("data", (d) => tailAppend(String(d)));
    vite.stderr.on("data", (d) => tailAppend(String(d)));
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      if (vite.exitCode !== null) break;
      // Đợt 96 X6 (U6 §7.1): fetch up-loop CÓ timeout 2s — trước đây
      // không timeout nên fetch đầu tiên treo vĩnh viễn khi cổng bị
      // listener TCP thô giữ kết nối mở (nc trơn, curl exit 28; E1
      // trước-fix bị timeout 45 giết, exit 124 — xem fault-inject-nc).
      // 2s = cùng timeout với fetch portStillServes dưới đây (dòng
      // gốc đã dùng AbortSignal.timeout(2000)); fetch fail nhanh →
      // vòng lặp kịp kiểm tra vite.exitCode rồi thử cổng khác.
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(2000) }); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    const rec = { port: DEV_PORT, exitCode: vite.exitCode, tail: viteTail, mediaStatus: null, portStillServes: false };
    if (!up) {
      // Vite đã thoát mà cổng vẫn trả lời → server khác (mồ côi) đang giữ cổng.
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(2000) }); rec.portStillServes = r.ok; } catch {}
      viteAttempts.push(rec);
      log(`vite :${DEV_PORT} không lên (exit ${vite.exitCode}) — thử cổng khác; đuôi log: ${viteTail.trim().slice(-300) || "(trống)"}`);
      continue;
    }
    // Đợt 97 Y9: media probe CÓ timeout 2s (mẫu X6) — trước đây không
    // timeout nên treo vĩnh viễn khi endpoint nhận kết nối mà không trả
    // lời. Timeout ghi mediaStatus="timeout" để chẩn đoán phân biệt với
    // 200 (server lạ) và "error" (kết nối chết ngay).
    let mediaProbe = null, mediaTimedOut = false;
    try { mediaProbe = await fetch(MEDIA_URL("clean720.mp4"), { headers: { Range: "bytes=0-99" }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }); }
    catch (e) { mediaTimedOut = e && e.name === "TimeoutError"; }
    rec.mediaStatus = mediaProbe ? mediaProbe.status : (mediaTimedOut ? "timeout" : "error");
    if (!mediaProbe || mediaProbe.status !== 206) { viteAttempts.push(rec); log(`media probe :${DEV_PORT} trả ${rec.mediaStatus} (không phải 206 — ${mediaTimedOut ? "endpoint treo quá 2s" : "có thể trúng server luồng khác"}) — thử cổng khác`); continue; }
    viteAttempts.push(rec);
    viteOk = true;
  }
  if (!viteOk) {
    // Chẩn đoán thay cho "(cổng bị chiếm?)" cũ — Q7 §3.1 chứng minh
    // chẩn đoán đó SAI khi vite exit 1 do EPERM (cổng trống, vite log
    // 0 byte). Thứ tự kiểm tra: EPERM trước, port conflict sau.
    let viteLogText = "";
    try { viteLogText = fs.readFileSync(path.join(SCRATCH, "c77e1-headed-vite.log"), "utf8"); } catch {}
    const allText = viteAttempts.map((a) => a.tail).join("\n") + "\n" + viteLogText;
    const hasEperm = /Operation not permitted|EPERM|npm error code EPERM/.test(allText);
    // Đợt 92 T6 (S6 §6.11): vite in thông báo thân thiện "Port 5580 is
    // already in use" thay vì EADDRINUSE — mẫu thứ ba khớp cả hai dạng.
    const hasAddrInUse = /EADDRINUSE|address already in use|Port \d+ is already in use/i.test(allText);
    const foreignServer = viteAttempts.some((a) => a.portStillServes) || viteAttempts.some((a) => a.mediaStatus === 200);
    // Đợt 97 Y9: vite đã lên (up-loop qua) nhưng media probe timeout —
    // endpoint media treo, khác với cổng bị chiếm (vite chết EADDRINUSE)
    // và khác EPERM.
    const mediaTimeout = viteAttempts.some((a) => a.mediaStatus === "timeout");
    const diagnosis = hasEperm
      ? "EPERM (vite exit 1, log chứa 'Operation not permitted' — sóng EPERM, KHÔNG phải cổng bị chiếm)"
      : mediaTimeout
        ? "media probe timeout (vite đã lên nhưng endpoint media treo quá 2s cả 3 lần thử — xem mediaStatus=timeout từng lần)"
        : hasAddrInUse || foreignServer
        ? "cổng bị chiếm (EADDRINUSE trong log hoặc cổng vẫn trả lời sau khi vite thoát — có server khác/mồ côi giữ cổng)"
        : "chưa rõ nguyên nhân (không thấy dấu EPERM hay EADDRINUSE — xem đuôi log từng lần thử bên dưới)";
    const perAttempt = viteAttempts.map((a, i) =>
      `lần ${i + 1}: cổng :${a.port}, exit ${a.exitCode}, media ${a.mediaStatus ?? "—"}, cổng-vẫn-trả-lời=${a.portStillServes}, đuôi log: ${(a.tail.trim().slice(-200) || "(trống)")}`).join(" | ");
    throw new Error(`vite dev + media probe không lên sau 3 lần thử — chẩn đoán: ${diagnosis}. ${perAttempt}`);
  }
  log("vite dev đã lên");

  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", `${WIN}x24`], { stdio: "ignore" });
  {
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
      else await sleep(500);
    }
    if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s`);
  }
  if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "c77e1-headed-chrome.log"), "w");
  chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
    "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
    "--window-size=" + WIN.replace("x", ",") + "", "--hide-scrollbars", "about:blank"],
    { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
  let pageTarget = null;
  // Đợt 98 Z8: vòng /json/list theo slot 5 s + deadline tổng — xem hằng
  // CDP_LIST_SLOT_MS / CDP_LIST_DEADLINE_MS ở đầu file. Đếm số lần
  // timeout để chẩn đoán phân biệt "endpoint treo" với "Chrome chưa mở
  // cổng debug" khi vòng hết deadline mà không lấy được page target.
  let cdpListAttempts = 0, cdpListTimeouts = 0;
  const cdpLoopT0 = Date.now();
  for (let i = 0; i < CDP_LIST_ATTEMPTS && !pageTarget && Date.now() - cdpLoopT0 < CDP_LIST_DEADLINE_MS; i++) {
    cdpListAttempts++;
    const slotT0 = Date.now();
    try {
      const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })).json();
      pageTarget = pages.find((p) => p.type === "page");
    } catch (e) {
      if (e && e.name === "TimeoutError") cdpListTimeouts++;
    }
    if (!pageTarget) {
      // Ép cứng slot 5 s: fetch đã timeout 2 s nên ngủ tối đa 0,5 s;
      // Math.min bảo đảm một lần thử không bao giờ vượt quá slot kể cả
      // khi fetch/sleep lệch nhịp.
      const spent = Date.now() - slotT0;
      await sleep(Math.min(500, Math.max(0, CDP_LIST_SLOT_MS - spent)));
    }
  }
  if (!pageTarget) throw new Error(`không lấy được page target CDP (đã thử ${cdpListAttempts} lần trong ${((Date.now() - cdpLoopT0) / 1000).toFixed(1)} s, timeout ${cdpListTimeouts} lần, deadline ${CDP_LIST_DEADLINE_MS / 1000} s — endpoint treo hoặc Chrome chưa mở cổng debug; worst case vòng này ≈ ${(CDP_LIST_DEADLINE_MS + CDP_LIST_SLOT_MS) / 1000} s, trước Z8 là ~450 s)`);
  const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.navigate", { url: DEV_URL });
  await cdp.waitFor(async () => {
    const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
    return s;
  }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
  log("app đã mount");

  async function ensureNoModal() {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }
  async function waitIdle(label, timeoutMs = 90000) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, timeoutMs);
  }
  async function clickEnhCheckbox(testid, label) {
    const g = await cdp.evalJs(CLICK_ENH_FN(testid));
    if (!g) throw new Error(`không tìm thấy [data-testid="${testid}"] (${label})`);
    if (g.coveredBy) log(`cảnh báo: ${testid} bị che bởi ${g.coveredBy} tại điểm bấm — vẫn thử bấm`);
    await cdp.click(g.x, g.y);
    await sleep(600);
  }
  async function setEnhCheckbox(testid, key, want, clipId) {
    const cur = await cdp.evalJs(STATE_FN);
    const enh = cur.clips.find((c) => c.clipId === clipId)?.enhance;
    const has = !!(enh && enh[key]);
    if (has !== want) await clickEnhCheckbox(testid, `${key}→${want}`);
    const after = await cdp.evalJs(STATE_FN);
    const enh2 = after.clips.find((c) => c.clipId === clipId)?.enhance;
    const has2 = !!(enh2 && enh2[key]);
    if (has2 !== want) throw new Error(`checkbox ${key} không về ${want} (đang ${has2}, enhance=${JSON.stringify(enh2)})`);
    return after;
  }
  // Đợt 100 B7: togglePlay() cũ (Space + sleep cố định) đã thay bằng
  // togglePlayExpect() bên dưới — chờ-trạng-thái + thử lại + fallback
  // store (xem TOGGLE_TIMEOUT_MS). Không giữ hàm cũ để khỏi dùng nhầm.
  // Đợt 100 B7: chờ `playing` về đúng trạng thái mong muốn sau Space.
  // Trả { ok, waitedMs, lastPlaying }. Poll 250ms/lần — mỗi lần poll là
  // một CDP round-trip nên dưới tải nặng một lần poll có thể tự chậm.
  async function waitPlaying(want, timeoutMs) {
    const t0 = Date.now();
    let last = null;
    while (Date.now() - t0 < timeoutMs) {
      const s = await cdp.evalJs(SAMPLE_FN).catch(() => null);
      if (s) last = s.playing;
      if (s && s.playing === want) return { ok: true, waitedMs: Date.now() - t0, lastPlaying: last };
      await sleep(250);
    }
    const s = await cdp.evalJs(SAMPLE_FN).catch(() => null);
    if (s) last = s.playing;
    return { ok: last === want, waitedMs: Date.now() - t0, lastPlaying: last };
  }
  // Đợt 100 B7: Space + chờ-trạng-thái + thử lại + fallback store.
  // `which` = "lần 1" (phát) | "lần 2" (dừng) — giữ nguyên cụm message lỗi
  // cũ ("bấm Space mà playing vẫn false" / "bấm Space lần 2 mà playing
  // vẫn true") để grep log cũ vẫn khớp. Trả { method, attempts, waitedMs }
  // với method = "space" | "space-retry" | "store-fallback" để ghi vào row.
  async function togglePlayExpect(want, key, slotIdx, which) {
    let method = "space";
    let attempts = 0;
    // Đợt 101 C8: fault-injection (env-gated, mặc định TẮT) — chỉ cài cho
    // đúng slot/chiều được chỉ định; dọn ngay sau khi toggle xong để
    // keydown phát lại muộn không lọt vào slot đo.
    const faultArmed = FAULT_DELAY_MS > 0 && FAULT_COUNT > 0 && slotIdx === FAULT_SLOT && which === FAULT_WHICH;
    let faultInstalled = false;
    async function faultCleanup() {
      if (!faultInstalled) return;
      faultInstalled = false;
      const r = await cdp.evalJs(FAULT_CLEANUP_FN).catch(() => null);
      log(`Space ${which} ${key} slot ${slotIdx}: fault-injection dọn listener (${r}) — các lần phát lại Space đang chờ đã hủy, không toggle muộn (đợt 101 C8)`);
    }
    if (faultArmed) {
      const r = await cdp.evalJs(FAULT_INSTALL_FN(FAULT_DELAY_MS, FAULT_COUNT)).catch(() => null);
      faultInstalled = r === "installed" || r === "already-installed";
      log(`Space ${which} ${key} slot ${slotIdx}: fault-injection BẬT — nuốt ${FAULT_COUNT} keydown Space tiếp theo, phát lại sau ${FAULT_DELAY_MS}ms (cài đặt: ${r}) (đợt 101 C8)`);
    }
    for (let attempt = 0; attempt <= TOGGLE_RETRIES; attempt++) {
      attempts++;
      await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
      await cdp.key(" ", "Space");
      const w = await waitPlaying(want, TOGGLE_TIMEOUT_MS);
      if (w.ok) {
        if (attempt > 0) method = "space-retry";
        if (attempt > 0 || w.waitedMs > 1000) {
          log(`Space ${which} ${key} slot ${slotIdx}: playing về ${want} sau ${w.waitedMs}ms (lần thử ${attempt + 1}, ${method}) — keydown chậm dưới tải, đã chờ thay vì abort (đợt 100 B7)`);
        }
        await faultCleanup();
        return { method, attempts, waitedMs: w.waitedMs };
      }
      log(`Space ${which} ${key} slot ${slotIdx}: playing chưa về ${want} sau ${w.waitedMs}ms (lần thử ${attempt + 1}, playing cuối=${w.lastPlaying}) — thử lại Space`);
    }
    // Fallback store (mẫu N10, nợ M1 §6): set TUYỆT ĐỐI playing=<want> nên
    // không sợ double-toggle với keydown chậm. Keydown chậm chỉ có thể
    // lật lại 1 lần (1 event duy nhất) nên thử fallback tối đa 2 lần.
    for (let fb = 0; fb < 2; fb++) {
      await cdp.evalJs(`(async () => { window.__e1storeMod.useStore.setState({ playing: ${want} }); return window.__e1storeMod.useStore.getState().playing; })()`);
      if (FAULT_FB2 && fb === 0) {
        const rFb2 = await cdp.evalJs(FAULT_FB2_DISPATCH_FN).catch(() => null);
        log(`Space ${which} ${key} slot ${slotIdx}: fault FB2 — keydown Space muộn tổng hợp sau fallback #1 (${rFb2}) để kiểm chứng vòng lặp fallback thứ 2 (đợt 102 D7)`);
      }
      const w2 = await waitPlaying(want, 2000);
      if (w2.ok) {
        log(`Space ${which} ${key} slot ${slotIdx}: Space ${attempts} lần không lật được → fallback store setState playing=${want} (lần fallback ${fb + 1}, đã lật sau ${w2.waitedMs}ms) — mẫu N10/M1`);
        await faultCleanup();
        return { method: "store-fallback", attempts, waitedMs: w2.waitedMs };
      }
      log(`Space ${which} ${key} slot ${slotIdx}: fallback store lần ${fb + 1} chưa giữ được playing=${want} (playing cuối=${w2.lastPlaying} — keydown chậm có thể vừa lật lại) — thử fallback lần nữa`);
    }
    const last = await cdp.evalJs(SAMPLE_FN).catch(() => null);
    const wantWord = want ? "false" : "true";
    await faultCleanup();
    throw new Error(`${key} slot ${slotIdx}: bấm Space ${which} mà playing vẫn ${wantWord} (Space ${attempts} lần + chờ ${TOGGLE_TIMEOUT_MS}ms/lần + store-fallback 2 lần đều không lật được; playing cuối=${last ? last.playing : "?"}, load ${loadAvg()})`);
  }
  async function drainErrors() {
    const e = (await cdp.evalJs(`(window.__e1errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__e1errors = []`).catch(() => {});
    return e;
  }

    const modalGone = await ensureNoModal();
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- G0: project mẫu + canvas đủ lớn ---------------------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện", 180000);
    const firstClipId = s0.clips.find((c) => c.trackId === "v1").clipId;
    log(`project mẫu: canvas preview backing ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY}, clip video đầu ${firstClipId}, loadavg ${loadAvg()}`);
    // Đợt 76 D4: 2 chế độ trong 1 script — scaleY ≥ 0.9 chạy G1–G5+G7+G8;
    // scaleY < 0.9 (cửa sổ nhỏ E1_WINDOW=1700x1000) chỉ chạy G6 (tap phải
    // TẮT) + H9. Không throw ở G0 nữa (C8 throw vì chỉ có 1 chế độ).
    const mainMode = s0.scaleY !== null && s0.scaleY >= 0.9;
    if (mainMode) {
      pass("G0 canvas đủ lớn cho tap khử răng cưa", `canvas ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY} ≥ 0.9 (ngưỡng đợt 76 D4) — chế độ main`);
    } else {
      pass("G0 chế độ scale075 (tap phải TẮT dưới ngưỡng 0.9)", `canvas ${s0.canvasW}x${s0.canvasH}, scaleY=${s0.scaleY} < 0.9 — chạy G6 thay vì G1–G5/G7+G8`);
    }
    await drainErrors();
    let fpsSlots = [];
    let frozenSlots = [];
    // Đợt 98 Z8: g5Rounds/g5Verdict để report cuối đọc được cả 2 chế độ
    // (scale075 không chạy G5 → null); g5RoundNo để measureFpsSlot gắn
    // nhãn lần 1/2 vào từng slot row.
    let g5Rounds = null;
    let g5Verdict = null;
    let g5RoundNo = 1;
    if (mainMode) {
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (G0)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu", 60000);

    // ---- Đổi src clip 1 → interlaced720 (mẫu D3 đợt 61 R3) ---------------
    const added = await cdp.evalJs(`(async () => {
      const st = await (${STORE_FN});
      const url = ${JSON.stringify(MEDIA_URL("interlaced720.mp4"))};
      window.__e1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st2 = window.__e1storeMod.useStore.getState();
      const clip = st2.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      const st3 = window.__e1storeMod.useStore.getState();
      return { mediaLen: st3.media.length, clipSrc: st3.spec.tracks.find((t) => t.id === "v1").clips[0].src };
    })()`);
    if (added.clipSrc !== "interlaced720.mp4") throw new Error(`patchClip src không đổi (đang ${added.clipSrc})`);
    log(`đã đổi src clip 1 → interlaced720.mp4 (media ${added.mediaLen} item)`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced tại playhead 1.0", 60000);
    await sleep(500);
    const shotInter = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
    if (!shotInter.ok) throw new Error(`đọc canvas preview thất bại: ${shotInter.reason}`);
    log(`canvas interlaced @1.0s: mean=${shotInter.mean} std=${shotInter.std} (n=${shotInter.n})`);
    if (shotInter.std < 8) throw new Error(`canvas vẫn phẳng/placeholder (std ${shotInter.std} < 8) — frame interlaced chưa vẽ được`);

    // ---- G1: baseline deint TẮT --------------------------------------------
    const hookA = (await cdp.evalJs(STATE_FN)).hook;
    const combA = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!combA.ok) throw new Error(`đo combing baseline thất bại: ${combA.reason}`);
    const snapA = await cdp.evalJs(SNAPSHOT_FN);
    if (!snapA.ok) throw new Error(`snapshot A thất bại: ${snapA.reason}`);
    log(`G1 baseline interlaced: R=${combA.ratio} (C=${combA.cross} S=${combA.same}), hook tap=${hookA?.deinterlaceTap} applied=${JSON.stringify(hookA?.applied)} offscreen=${hookA?.offscreenApplied}, snapshot ${snapA.n} pixel`);
    // Đối chứng progressive CÙNG cỡ canvas, deint vẫn TẮT (lần 2 — lần 1
    // so R tuyệt đối với probe 1:1 nên fail oan: app vẽ upscale 1.13x,
    // R gốc chỉ 0.74 thay vì 1.12).
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
      window.__e1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-clean-base", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__e1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview progressive baseline tại playhead 1.0", 60000);
    await sleep(500);
    const combCleanBase = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!combCleanBase.ok) throw new Error(`đo combing đối chứng baseline thất bại: ${combCleanBase.reason}`);
    log(`G1 đối chứng progressive (deint TẮT): R=${combCleanBase.ratio} (C=${combCleanBase.cross} S=${combCleanBase.same})`);
    // Trả clip về interlaced để chụp lại snapshot A (snapshot phải là
    // interlaced baseline, không phải progressive).
    await cdp.evalJs(`(async () => {
      const st = window.__e1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced baseline lại tại playhead 1.0", 60000);
    await sleep(500);
    const snapA2 = await cdp.evalJs(SNAPSHOT_FN);
    if (!snapA2.ok) throw new Error(`snapshot A (lần 2) thất bại: ${snapA2.reason}`);
    const combA2 = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!combA2.ok) throw new Error(`đo combing baseline lần 2 thất bại: ${combA2.reason}`);
    log(`G1 baseline interlaced (lần 2): R=${combA2.ratio}`);
    const gapBase = +(combA2.ratio - combCleanBase.ratio).toFixed(2);
    if (gapBase > 0.1 && hookA && hookA.deinterlaceTap === false && hookA.offscreenApplied === false) {
      pass("G1 baseline: răng cưa thấy được, tap chưa áp", `R interlaced ${combA2.ratio} − R progressive ${combCleanBase.ratio} = gap ${gapBase} > 0.10 (lần 1: R tuyệt đối 0.74 do upscale 1.13x, không phải 1.12 ở 1:1), hook tap=false, offscreen=false, canvas ${combA2.w}x${combA2.h}`);
    } else {
      fail("G1 baseline: răng cưa thấy được, tap chưa áp", `R interlaced ${combA2.ratio} vs progressive ${combCleanBase.ratio} (gap ${gapBase}, kỳ vọng > 0.10), hook=${JSON.stringify(hookA)}`);
    }

    // ---- G2: bật deinterlace bằng chuột thật -------------------------------
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced + deint tại playhead 1.0", 60000);
    await sleep(500);
    const hookB = (await cdp.evalJs(STATE_FN)).hook;
    const combB = await cdp.evalJs(PREVIEW_COMBING_FN);
    const diffB = await cdp.evalJs(SNAPDIFF_FN);
    if (!combB.ok || !diffB.ok) throw new Error(`đo G2 thất bại: combing ${combB.reason || "ok"}, diff ${diffB.reason || "ok"}`);
    log(`G2 deint BẬT: R=${combB.ratio} (C=${combB.cross} S=${combB.same}), hook tap=${hookB?.deinterlaceTap} applied=${JSON.stringify(hookB?.applied)} offscreen=${hookB?.offscreenApplied}, MAD vs A=${diffB.meanAbsDiff} (${diffB.pctChanged}% đổi)`);
    if (combB.ratio < 0.65 && combB.ratio < combA2.ratio * 0.8 && hookB && hookB.deinterlaceTap === true
      && JSON.stringify(hookB.applied) === JSON.stringify(["deinterlace"]) && hookB.offscreenApplied === false
      && diffB.meanAbsDiff > 0.5) {
      pass("G2 bật deinterlace: R giảm, tap áp, pixel đổi thật", `R ${combA2.ratio} → ${combB.ratio} (D4 half-res: 0.74 → 0.51; C8 offscreen: 0.74 → 0.54; yadif 0.57), hook tap=true applied=[deinterlace] offscreen=false (đường intermediate đợt 77 E1), MAD=${diffB.meanAbsDiff}`);
    } else {
      fail("G2 bật deinterlace: R giảm, tap áp, pixel đổi thật", `R ${combA2.ratio} → ${combB.ratio} (kỳ vọng < 0.65 và < 0.8× gốc), hook=${JSON.stringify(hookB)}, MAD=${diffB.meanAbsDiff}`);
    }

    // ---- G3: tắt lại → pixel-identical với baseline -----------------------
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced tắt deint tại playhead 1.0", 60000);
    await sleep(500);
    const hookC = (await cdp.evalJs(STATE_FN)).hook;
    const diffC = await cdp.evalJs(SNAPDIFF_FN);
    if (!diffC.ok) throw new Error(`đo G3 thất bại: ${diffC.reason}`);
    log(`G3 deint TẮT lại: hook tap=${hookC?.deinterlaceTap} offscreen=${hookC?.offscreenApplied}, MAD vs A=${diffC.meanAbsDiff} (${diffC.pctChanged}% đổi)`);
    if (diffC.meanAbsDiff === 0 && hookC && hookC.deinterlaceTap === false) {
      pass("G3 tắt deinterlace: trả đúng khung gốc (pixel-identical)", `MAD vs baseline = 0, hook tap=false (mẫu Q1 A→D)`);
    } else {
      fail("G3 tắt deinterlace: trả đúng khung gốc (pixel-identical)", `MAD vs baseline = ${diffC.meanAbsDiff} (kỳ vọng 0), hook=${JSON.stringify(hookC)}`);
    }

    // ---- G4: đối chứng progressive + deint BẬT ----------------------------
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
      window.__e1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-c8-clean", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__e1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview progressive + deint tại playhead 1.0", 60000);
    await sleep(500);
    const combClean = await cdp.evalJs(PREVIEW_COMBING_FN);
    const hookD = (await cdp.evalJs(STATE_FN)).hook;
    if (!combClean.ok) throw new Error(`đo G4 thất bại: ${combClean.reason}`);
    log(`G4 progressive + deint BẬT: R=${combClean.ratio}, hook tap=${hookD?.deinterlaceTap}`);
    if (combClean.ratio < 0.8 && hookD && hookD.deinterlaceTap === true) {
      pass("G4 đối chứng progressive: tap không tạo thêm răng cưa", `R=${combClean.ratio} < 0.8 (probe clean tap1 0.61), hook tap=true`);
    } else {
      fail("G4 đối chứng progressive: tap không tạo thêm răng cưa", `R=${combClean.ratio} (kỳ vọng < 0.8), hook=${JSON.stringify(hookD)}`);
    }
    // Trả clip về interlaced cho phần FPS (deint vẫn BẬT từ G4).
    await cdp.evalJs(`(async () => {
      const st = window.__e1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);

    // ---- G5: FPS xen kẽ [B,I,B,I,B] ----------------------------------------
    // fpsSlots khai ở ngoài khối mainMode (xem trên G0) để report cuối
    // hàm đọc được cả 2 chế độ; ở đây chỉ dùng, không khai lại.
    // Đợt 98 Z8: quy tắc verdict vùng 0,6–0,9 (Y9 §3 — nay cài vào code,
    // module deint-fps-verdict.mjs): mean ≥ 0,9 PASS chắc, ≤ 0,6 FAIL
    // chắc, vùng xám đo thêm lần 2 (11 slot nữa) rồi verdict trên mean
    // gộp 10 tỉ lệ, ngưỡng 0,75. E1_G5_FORCE_SECOND_RUN=1 ép đo lần 2
    // dù lần 1 đã chắc (chỉ để kiểm chứng đường lần 2).
    async function measureFpsSlot(key, slotIdx) {
      const want = key === "deint";
      await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", want, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(`${key} slot ${slotIdx} seek 0`);
      const stCfg = await cdp.evalJs(STATE_FN);
      const hook = stCfg.hook;
      const hookOk = key === "deint"
        ? hook && hook.deinterlaceTap === true && hook.offscreenApplied === false
        : hook && hook.deinterlaceTap === false && hook.offscreenApplied === false;
      if (!hookOk) log(`cảnh báo hook slot ${slotIdx} ${key} lệch: hook=${JSON.stringify(hook)}`);
      const loadBefore = loadAvg();
      const heapBefore = await cdp.evalJs(HEAP_FN).catch(() => null);
      // Đợt 100 B7: chờ playing=true (thay cho sleep 800 cố định + throw
      // ngay — keydown chậm dưới tải từng làm sample a đọc playing=false).
      const playRes = await togglePlayExpect(true, key, slotIdx, "lần 1");
      const a = await cdp.evalJs(SAMPLE_FN);
      await sleep(3000);
      const b = await cdp.evalJs(SAMPLE_FN);
      const heapAfter = await cdp.evalJs(HEAP_FN).catch(() => null);
      // Đợt 100 B7: chờ playing=false (thay cho sleep 400 cố định + throw
      // ngay — đây chính là điểm abort E1 run2 đợt 99 A7 ở slot 7).
      const pauseRes = await togglePlayExpect(false, key, slotIdx, "lần 2");
      const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(a.wall, b.wall));
      const dt = (b.wall - a.wall) / 1000;
      const row = {
        round: g5RoundNo, slot: slotIdx, config: key, hookOk,
        playMethod: playRes.method, pauseMethod: pauseRes.method,
        // Đợt 100 B7: thời gian chờ playing lật (ms) — bằng chứng fix có
        // cứu được lần nào không: toggle nào > 400ms là lần mà code cũ
        // (sleep cố định 400ms + throw ngay) đã abort.
        playWaitMs: playRes.waitedMs, pauseWaitMs: pauseRes.waitedMs,
        drawFps: +((b.draw - a.draw) / dt).toFixed(2),
        tickFps: +((b.ticks - a.ticks) / dt).toFixed(2),
        playheadRate: +(((b.ph - a.ph) / dt)).toFixed(2),
        raf: rafStats, loadBefore, loadAfter: loadAvg(),
        heapBeforeMB: heapBefore ? heapBefore.usedMB : null,
        heapAfterMB: heapAfter ? heapAfter.usedMB : null,
      };
      fpsSlots.push(row);
      log(`FPS slot ${slotIdx} ${key}: draw ${row.drawFps} fps, tick ${row.tickFps} fps, playhead ${row.playheadRate}x, load ${loadBefore} → ${row.loadAfter}${heapBefore && heapAfter ? `, heap ${heapBefore.usedMB} → ${heapAfter.usedMB} MB` : ""}`);
      return row;
    }
    // Đợt 77 E1: 11 slot (5 tỉ lệ) thay vì 7 slot (3 tỉ lệ) như D4 — tải
    // VM hôm nay rất cao và baseline chỉ ~2 fps nên mỗi slot 3s chỉ có
    // ~6 lần vẽ (lượng tử hoá ±17%); thêm slot để trung bình nhiễu tải
    // và nhiễu đếm. Định nghĩa tỉ lệ drift-corrected không đổi.
    const FPS_ORDER = ["baseline", "deint", "baseline", "deint", "baseline", "deint", "baseline", "deint", "baseline", "deint", "baseline"];
    for (let i = 0; i < FPS_ORDER.length; i++) await measureFpsSlot(FPS_ORDER[i], i);
    const baseFps = [fpsSlots[0].drawFps, fpsSlots[2].drawFps, fpsSlots[4].drawFps, fpsSlots[6].drawFps, fpsSlots[8].drawFps, fpsSlots[10].drawFps];
    const baseMean = baseFps.reduce((a, b) => a + b, 0) / baseFps.length;
    const ratio = (slot, before, after) => {
      const neighbor = (before + after) / 2;
      return neighbor > 0 ? +(slot / neighbor).toFixed(2) : null;
    };
    const ratios = [1, 3, 5, 7, 9].map((i) => ratio(fpsSlots[i].drawFps, fpsSlots[i - 1].drawFps, fpsSlots[i + 1].drawFps));
    const rMean = +((ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2));
    // Đợt 90 R6 (Q7 §7.4): ghi số slot đóng băng kèm mọi verdict —
    // slot draw < 0,5 fps là slot chết đứng, mean tỉ lệ 1 lần không
    // được che nó (vd combo run2 N10: 0,00 và 1,23 trong cùng 1 lần).
    frozenSlots = fpsSlots.filter((s) => s.drawFps < FROZEN_FPS).map((s) => s.slot);
    const frozenNote = frozenSlots.length ? `, slot đóng băng ${frozenSlots.length}/11 (slot ${frozenSlots.join(",")})` : ", không slot đóng băng";
    log(`FPS deint: baseline mean ${baseMean.toFixed(2)} fps, tỉ lệ drift-corrected ${ratios.join(" / ")} → mean ${rMean}x (ngưỡng 0.75x)${frozenNote}`);
    // Đợt 98 Z8: verdict theo quy tắc Y9 §3 (module deint-fps-verdict.mjs).
    const g5v1 = verdictG5(ratios);
    log(`G5 lần 1 verdict theo quy tắc 98Z8: mean ${rMean}x median ${g5v1.median} → ${g5v1.verdict}${g5v1.certain ? " (chắc)" : " (không quyết được, vùng 0,6–0,9)"}`);
    g5Rounds = [{ round: 1, ratios, rMean, rMedian: g5v1.median, baseMean: +baseMean.toFixed(2), frozenSlots: [...frozenSlots] }];
    g5Verdict = { rule: "98Z8", rounds: 1, run1: { ratios, mean: rMean, median: g5v1.median }, verdict: g5v1.verdict, certain: g5v1.certain };
    if (g5v1.certain && process.env.E1_G5_FORCE_SECOND_RUN !== "1") {
      if (g5v1.verdict === "PASS") {
        pass("G5 FPS deint-only ≥ 0.75x baseline", `tỉ lệ ${ratios.join("/")} → ${rMean}x (≥ 0,9 — PASS chắc theo quy tắc 98Z8), baseline ${baseMean.toFixed(2)} fps, load ${loadAvg()}${frozenNote}`);
      } else {
        fail("G5 FPS deint-only ≥ 0.75x baseline", `tỉ lệ ${ratios.join("/")} → ${rMean}x (≤ 0,6 — FAIL chắc theo quy tắc 98Z8), baseline ${baseMean.toFixed(2)} fps${frozenNote} — đường deint-only hiện tại vẫn chưa đủ nhanh (D4 half-res: 0.72–0.73x; C8 offscreen: 0.65–0.71x; xem LIMITS §3)`);
      }
    } else {
      if (process.env.E1_G5_FORCE_SECOND_RUN === "1" && g5v1.certain) log(`G5: E1_G5_FORCE_SECOND_RUN=1 — ép đo thêm lần 2 dù lần 1 đã ${g5v1.verdict} chắc (kiểm chứng đường lần 2)`);
      else log(`G5 lần 1 không quyết được (mean ${rMean}x trong vùng 0,6–0,9) — đo thêm lần 2 (11 slot) rồi verdict trên mean gộp 10 tỉ lệ`);
      // Đo thêm lần 2: 11 slot nữa, cùng thứ tự xen kẽ, cùng measureFpsSlot.
      g5RoundNo = 2;
      const g5Before = fpsSlots.length;
      for (let i = 0; i < FPS_ORDER.length; i++) await measureFpsSlot(FPS_ORDER[i], i);
      const rows2 = fpsSlots.slice(g5Before);
      const base2 = [rows2[0].drawFps, rows2[2].drawFps, rows2[4].drawFps, rows2[6].drawFps, rows2[8].drawFps, rows2[10].drawFps];
      const baseMean2 = base2.reduce((a, b) => a + b, 0) / base2.length;
      const ratios2 = [1, 3, 5, 7, 9].map((i) => ratio(rows2[i].drawFps, rows2[i - 1].drawFps, rows2[i + 1].drawFps));
      const frozen2 = rows2.filter((s) => s.drawFps < FROZEN_FPS).map((s) => s.slot);
      const combined = combineG5Verdict(ratios, ratios2);
      g5Rounds.push({ round: 2, ratios: ratios2, rMean: combined.mean2, rMedian: combined.median2, baseMean: +baseMean2.toFixed(2), frozenSlots: frozen2 });
      g5Verdict = { rule: "98Z8", rounds: 2, run1: { ratios, mean: rMean, median: g5v1.median }, run2: { ratios: ratios2, mean: combined.mean2, median: combined.median2 }, combinedMean: combined.mean, combinedMedian: combined.median, verdict: combined.mean >= 0.75 ? "PASS" : "FAIL", certain: true };
      log(`G5 lần 2: baseline mean ${baseMean2.toFixed(2)} fps, tỉ lệ ${ratios2.join(" / ")} → mean ${combined.mean2}x; GỘP 10 tỉ lệ mean ${combined.mean}x median ${combined.median} (ngưỡng 0.75x)${frozen2.length ? `, slot đóng băng lần 2: ${frozen2.join(",")}` : ""}`);
      // Đợt 98 Z8 (sửa sau lần ép chạy 15:03Z): lý do đo lần 2 phải ghi
      // đúng — lần 1 vùng xám thì "không quyết được", còn ép bằng env thì
      // lần 1 đã chắc; message cũ ghi cứng "trong vùng 0,6–0,9" cho cả 2.
      const g5SecondReason = process.env.E1_G5_FORCE_SECOND_RUN === "1" && g5v1.certain
        ? `ép đo lần 2 (E1_G5_FORCE_SECOND_RUN=1) dù lần 1 đã ${g5v1.verdict} chắc`
        : `lần 1 mean ${rMean}x trong vùng 0,6–0,9 (không quyết được)`;
      if (combined.mean >= 0.75) {
        pass("G5 FPS deint-only ≥ 0.75x baseline (lần 2, gộp 2 lần)", `${g5SecondReason} → lần 2 mean ${combined.mean2}x; gộp 10 tỉ lệ mean ${combined.mean}x median ${combined.median}, baseline lần 2 ${baseMean2.toFixed(2)} fps, load ${loadAvg()}`);
      } else {
        fail("G5 FPS deint-only ≥ 0.75x baseline (lần 2, gộp 2 lần)", `${g5SecondReason} → lần 2 mean ${combined.mean2}x; gộp 10 tỉ lệ mean ${combined.mean}x median ${combined.median} < 0.75x, baseline lần 2 ${baseMean2.toFixed(2)} fps — đường deint-only hiện tại vẫn chưa đủ nhanh (D4 half-res: 0.72–0.73x; C8 offscreen: 0.65–0.71x; xem LIMITS §3)`);
      }
    }
    // Đợt 100 B7: phân loại slot-tải-đầu trong lần yên (quy tắc
    // deint-fps-verdict.mjs: baseline mean ≥ 10 → yên, slot 0 < 6 fps →
    // gắn cờ "yên-slot-tải-đầu"). Gắn vào từng vòng G5 + verdict gộp để
    // report JSON đọc được mà không cần tính lại từ fpsSlots.
    {
      const roundBaseline = (roundNo) => {
        const rows = fpsSlots.filter((s) => s.round === roundNo);
        return [0, 2, 4, 6, 8, 10].map((i) => rows[i].drawFps);
      };
      const perRound = g5Rounds.map((r) => classifyIdleRound(roundBaseline(r.round)));
      g5Rounds.forEach((r, i) => { r.idleClass = perRound[i]; });
      const runIdle = classifyIdleRun(g5Rounds.map((r) => roundBaseline(r.round)));
      if (g5Verdict) g5Verdict.idleClass = runIdle;
      log(`Phân loại yên/tải (đợt 100 B7): lần này = ${runIdle.mode}${runIdle.flaggedRounds.length ? ` (vòng bị gắn cờ slot-tải-đầu: ${runIdle.flaggedRounds.join(",")})` : ""} — từng vòng: ${perRound.map((c, i) => `vòng ${i + 1} baseline ${c.baselineMean} fps, slot0 ${c.slot0Fps} fps → ${c.mode}`).join(" | ")}`);
    }

    // ---- G7a: tap + scale-keyframes (nhánh SR, không mask) -------------
    // Motion-blur đã cấu hình nhưng chỉ blend khi đang phát (gate đợt 62
    // R3) nên ở pause case này khóa nhánh SR; nhánh blend-motion-blur
    // ghi rõ chưa đo headed (xem LIMITS §5).
    const pSr = await cdp.evalJs(PATCH_FN("v1", firstClipId, SR_ONLY_PATCH));
    const srOk = pSr.clip.animations && pSr.clip.animations.scale
      && pSr.clip.motion && pSr.clip.motion.motionBlur && pSr.clip.motion.motionBlur.frames === 4;
    if (!srOk) throw new Error(`patch SR thất bại: ${JSON.stringify(pSr.clip)}`);
    log(`G7a SR-only đã đặt: scale 1.2 + motionBlur 4 frame (deint đang TẮT sau G5)`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview SR deint TẮT tại playhead 1.0", 60000);
    await sleep(500);
    const combG7aOff = await cdp.evalJs(PREVIEW_COMBING_FN);
    const snapG7aOff = await cdp.evalJs(SNAPSHOT_FN);
    if (!combG7aOff.ok || !snapG7aOff.ok) throw new Error(`đo G7a-off thất bại: ${combG7aOff.reason || snapG7aOff.reason}`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview SR deint BẬT tại playhead 1.0", 60000);
    await sleep(500);
    const hookG7a = (await cdp.evalJs(STATE_FN)).hook;
    const combG7aOn = await cdp.evalJs(PREVIEW_COMBING_FN);
    const diffG7a = await cdp.evalJs(SNAPDIFF_FN);
    if (!combG7aOn.ok || !diffG7a.ok) throw new Error(`đo G7a-on thất bại: ${combG7aOn.reason || diffG7a.reason}`);
    log(`G7a SR-only: R ${combG7aOff.ratio} → ${combG7aOn.ratio}, hook tap=${hookG7a?.deinterlaceTap} offscreen=${hookG7a?.offscreenApplied}, MAD=${diffG7a.meanAbsDiff}`);
    if (combG7aOn.ratio < combG7aOff.ratio * 0.85 && hookG7a && hookG7a.deinterlaceTap === true
      && hookG7a.offscreenApplied === false && diffG7a.meanAbsDiff > 0.5) {
      pass("G7a tap + scale-keyframes (SR): R giảm, tap half-res, pixel đổi thật", `R ${combG7aOff.ratio} → ${combG7aOn.ratio} (< 0.85× gốc), hook tap=true offscreen=false, MAD=${diffG7a.meanAbsDiff}`);
    } else {
      fail("G7a tap + scale-keyframes (SR): R giảm, tap half-res, pixel đổi thật", `R ${combG7aOff.ratio} → ${combG7aOn.ratio} (kỳ vọng < 0.85× gốc), hook=${JSON.stringify(hookG7a)}, MAD=${diffG7a.meanAbsDiff}`);
    }

    // ---- G7b: tap + mask rect (không SR) — KHÔNG hồi quy -----------------
    // Nhánh mask vẽ drawSrc xuống unit 640×360 (downscale dọc 2×) nên
    // răng cưa ĐÃ bị trung bình hết ngay cả khi deint TẮT (R_off thấp sẵn);
    // half-res không đổi gì thêm (MAD ≈ 0 là ĐÚNG, không phải lỗi — xem
    // LIMITS §4). Tiêu chí: hook tap true + offscreen false, |ΔR| ≤ 0.05,
    // MAD < 0.05 (không đổi pixel = không phá hình học mask).
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
    const pMask = await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ mask: { shape: \"rect\", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.2 }, animations: undefined, motion: undefined }"));
    if (!pMask.clip.mask || pMask.clip.mask.shape !== "rect") throw new Error(`patch mask thất bại: ${JSON.stringify(pMask.clip)}`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview mask deint TẮT tại playhead 1.0", 60000);
    await sleep(500);
    const combG7bOff = await cdp.evalJs(PREVIEW_COMBING_FN);
    const snapG7bOff = await cdp.evalJs(SNAPSHOT_FN);
    if (!combG7bOff.ok || !snapG7bOff.ok) throw new Error(`đo G7b-off thất bại: ${combG7bOff.reason || snapG7bOff.reason}`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview mask deint BẬT tại playhead 1.0", 60000);
    await sleep(500);
    const hookG7b = (await cdp.evalJs(STATE_FN)).hook;
    const combG7bOn = await cdp.evalJs(PREVIEW_COMBING_FN);
    const diffG7b = await cdp.evalJs(SNAPDIFF_FN);
    if (!combG7bOn.ok || !diffG7b.ok) throw new Error(`đo G7b-on thất bại: ${combG7bOn.reason || diffG7b.reason}`);
    const dR7b = Math.abs(combG7bOn.ratio - combG7bOff.ratio);
    log(`G7b mask-only: R ${combG7bOff.ratio} → ${combG7bOn.ratio} (|ΔR|=${dR7b.toFixed(2)}), hook tap=${hookG7b?.deinterlaceTap} offscreen=${hookG7b?.offscreenApplied}, MAD=${diffG7b.meanAbsDiff}`);
    if (hookG7b && hookG7b.deinterlaceTap === true && hookG7b.offscreenApplied === false
      && dR7b <= 0.05 && diffG7b.meanAbsDiff < 0.05) {
      pass("G7b tap + mask rect: không hồi quy (mask downscale đã khử răng cưa)", `R ${combG7bOff.ratio} → ${combG7bOn.ratio} (|ΔR| ${dR7b.toFixed(2)} ≤ 0.05), hook tap=true offscreen=false, MAD=${diffG7b.meanAbsDiff} < 0.05`);
    } else {
      fail("G7b tap + mask rect: không hồi quy (mask downscale đã khử răng cưa)", `R ${combG7bOff.ratio} → ${combG7bOn.ratio} (|ΔR| ${dR7b.toFixed(2)}, kỳ vọng ≤ 0.05), hook=${JSON.stringify(hookG7b)}, MAD=${diffG7b.meanAbsDiff} (kỳ vọng < 0.05)`);
    }

    // ---- G8: footage thật — Big Buck Bunny 720p qua minterpolate 60fps +
    // tinterlace (idet TFF, KHÔNG phải testsrc2 tổng hợp) --------------------
    const bbbFiles = ["bbb-interlaced720.mp4", "bbb720.mp4"];
    const bbbMissing = bbbFiles.filter((f) => !fs.existsSync(path.join(MEDIA_DIR, f)));
    if (bbbMissing.length) {
      fail("G8 footage thật (BBB interlaced): R off/on + MAD", `thiếu fixture ở media dir: ${bbbMissing.join(", ")} — chưa tạo được bản interlaced từ BBB (xem LIMITS §5)`);
    } else {
      await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ mask: undefined, animations: undefined, motion: undefined }"));
      await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
      await cdp.evalJs(`(async () => {
        const url = ${JSON.stringify(MEDIA_URL("bbb-interlaced720.mp4"))};
        window.__e1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-bbb-inter", name: "bbb-interlaced720.mp4", kind: "video", url, duration: 10, width: 1280, height: 720 }] }));
        const st = window.__e1storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "bbb-interlaced720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle("preview BBB interlaced tại playhead 1.0", 60000);
      await sleep(500);
      const shotBbb = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
      if (!shotBbb.ok || shotBbb.std < 8) throw new Error(`canvas BBB interlaced phẳng/placeholder (std ${shotBbb?.std}) — frame chưa vẽ được`);
      const combBbbOff = await cdp.evalJs(PREVIEW_COMBING_FN);
      const snapBbbOff = await cdp.evalJs(SNAPSHOT_FN);
      if (!combBbbOff.ok || !snapBbbOff.ok) throw new Error(`đo G8-off thất bại: ${combBbbOff.reason || snapBbbOff.reason}`);
      await cdp.evalJs(`(async () => {
        const url = ${JSON.stringify(MEDIA_URL("bbb720.mp4"))};
        window.__e1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-bbb-clean", name: "bbb720.mp4", kind: "video", url, duration: 10, width: 1280, height: 720 }] }));
        const st = window.__e1storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "bbb720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle("preview BBB progressive tại playhead 1.0", 60000);
      await sleep(500);
      const combBbbClean = await cdp.evalJs(PREVIEW_COMBING_FN);
      if (!combBbbClean.ok) throw new Error(`đo G8-clean thất bại: ${combBbbClean.reason}`);
      await cdp.evalJs(`(async () => {
        const st = window.__e1storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "bbb-interlaced720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle("preview BBB interlaced + deint tại playhead 1.0", 60000);
      await sleep(500);
      const hookBbb = (await cdp.evalJs(STATE_FN)).hook;
      const combBbbOn = await cdp.evalJs(PREVIEW_COMBING_FN);
      const diffBbb = await cdp.evalJs(SNAPDIFF_FN);
      if (!combBbbOn.ok || !diffBbb.ok) throw new Error(`đo G8-on thất bại: ${combBbbOn.reason || diffBbb.reason}`);
      const gapBbb = +(combBbbOff.ratio - combBbbClean.ratio).toFixed(2);
      log(`G8 BBB thật: R interlaced ${combBbbOff.ratio} (clean đối chứng ${combBbbClean.ratio}, gap ${gapBbb}) → deint ${combBbbOn.ratio}, hook tap=${hookBbb?.deinterlaceTap} offscreen=${hookBbb?.offscreenApplied}, MAD=${diffBbb.meanAbsDiff}`);
      if (combBbbOn.ratio < combBbbOff.ratio && hookBbb && hookBbb.deinterlaceTap === true
        && hookBbb.offscreenApplied === false && diffBbb.meanAbsDiff > 0.3) {
        pass("G8 footage thật (BBB interlaced): R giảm, tap half-res, pixel đổi thật", `R ${combBbbOff.ratio} → ${combBbbOn.ratio} (testsrc2: 0.74 → 0.54; gap vs clean ${gapBbb}), hook tap=true offscreen=false, MAD=${diffBbb.meanAbsDiff}`);
      } else {
        fail("G8 footage thật (BBB interlaced): R giảm, tap half-res, pixel đổi thật", `R ${combBbbOff.ratio} → ${combBbbOn.ratio} (clean ${combBbbClean.ratio}, gap ${gapBbb}), hook=${JSON.stringify(hookBbb)}, MAD=${diffBbb.meanAbsDiff}`);
      }
    }
    } else {
    // ---- G6: chế độ scale075 — tap KHÔNG áp dưới ngưỡng 0.9 ---------------
    const g6geom = await cdp.evalJs(GEOM_FN);
    const vc6 = g6geom.clips.find((c) => c.trackId === "v1");
    if (!vc6) throw new Error("không tìm thấy clip video trên timeline (G6)");
    await cdp.click(vc6.rect.cx, vc6.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu (G6)", 60000);
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("interlaced720.mp4"))};
      window.__e1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__e1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced scale075 tại playhead 1.0", 60000);
    await sleep(500);
    const shot6 = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
    if (!shot6.ok || shot6.std < 8) throw new Error(`canvas G6 phẳng/placeholder (std ${shot6?.std}) — frame chưa vẽ được`);
    const comb6Off = await cdp.evalJs(PREVIEW_COMBING_FN);
    const snap6Off = await cdp.evalJs(SNAPSHOT_FN);
    if (!comb6Off.ok || !snap6Off.ok) throw new Error(`đo G6-off thất bại: ${comb6Off.reason || snap6Off.reason}`);
    await cdp.evalJs(`(async () => {
      const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
      window.__e1storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-d4-clean6", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
      const st = window.__e1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview clean scale075 tại playhead 1.0", 60000);
    await sleep(500);
    const comb6Clean = await cdp.evalJs(PREVIEW_COMBING_FN);
    if (!comb6Clean.ok) throw new Error(`đo G6-clean thất bại: ${comb6Clean.reason}`);
    await cdp.evalJs(`(async () => {
      const st = window.__e1storeMod.useStore.getState();
      const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
      window.__e1storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
      return true;
    })()`);
    await setEnhCheckbox("enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
    await waitIdle("preview interlaced + deint scale075 tại playhead 1.0", 60000);
    await sleep(500);
    const hook6 = (await cdp.evalJs(STATE_FN)).hook;
    const diff6 = await cdp.evalJs(SNAPDIFF_FN);
    if (!diff6.ok) throw new Error(`đo G6-on thất bại: ${diff6.reason}`);
    const gap6 = +(comb6Off.ratio - comb6Clean.ratio).toFixed(2);
    log(`G6 scale075 (scaleY=${s0.scaleY}): R interlaced ${comb6Off.ratio} vs clean ${comb6Clean.ratio} (gap ${gap6}; sweep probe C8 ở 0.75: gap 0.12), hook tap=${hook6?.deinterlaceTap}, MAD khi bật deint=${diff6.meanAbsDiff}`);
    if (hook6 && hook6.deinterlaceTap === false && diff6.meanAbsDiff === 0) {
      pass("G6 tỉ lệ 0.75: tap KHÔNG áp dưới ngưỡng 0.9, pixel không đổi", `scaleY=${s0.scaleY}, gap R ${gap6} (sweep probe 0.12), hook tap=false, MAD=0 khi bật deint`);
    } else {
      fail("G6 tỉ lệ 0.75: tap KHÔNG áp dưới ngưỡng 0.9, pixel không đổi", `scaleY=${s0.scaleY}, gap R ${gap6}, hook=${JSON.stringify(hook6)}, MAD=${diff6.meanAbsDiff} (kỳ vọng tap=false, MAD=0)`);
    }
    }

    // ---- H9: 0 lỗi trang ----------------------------------------------------
    await drainErrors();
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    const report = { cases: results, pass: nPass, total: results.length, fpsSlots, frozenSlots, frozenFpsThreshold: FROZEN_FPS, g5Rounds, g5Verdict, canvasSize: `${s0.canvasW}x${s0.canvasH}`, scaleY: s0.scaleY };
    writeFileEpermRetry(path.join(SCRATCH, "c77e1-headed-report.json"), JSON.stringify(report, null, 2));
    writeFileEpermRetry(path.join(SCRATCH, "c77e1-headed.log"), logLines.join("\n") + "\n");
    log(`KẾT QUẢ HEADED D4: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    try { writeFileEpermRetry(path.join(SCRATCH, "c77e1-headed.log"), logLines.join("\n") + "\nHARNESS LỖI: " + (e.stack || e) + "\n"); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
