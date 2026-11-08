#!/usr/bin/env node
/**
 * clicktest-63r1-modal-headed.mjs — Phase 9 đợt 63, luồng R1: kiểm chứng
 * headed toàn diện modal/mobile còn sót (đóng nợ đợt 62 R1 §5 + R10 §10).
 *
 * Đo headed THẬT (vite dev đóng băng + Chromium headed qua Xvfb + CDP,
 * Node thuần, mẫu R1/R10), viewport mobile 390×844, locale vi (trừ M11/M13
 * locale en + bridge caption thật):
 *   M0 setup: locale vi + mẫu tự load (3 clip, 2 media).
 *   M1–M8 từng modal khác (ngoài CaptionModal đã đo ở đợt 62 R1) ở 390px:
 *     Silence, TemplatePicker, ExportPanel, WelcomeModal, TemplatePackModal,
 *     SceneModal, BeatSyncModal, StorageCleanupPanel — pill/panel FPS ∩ nút
 *     chính + elementFromPoint (tiêu chí R1: giao hình học chỉ ghi nhận,
 *     elementFromPoint mới quyết định nút có bấm được không).
 *   M9 toast + tour-card xuất hiện cùng lúc CaptionModal đang mở (đợt 62
 *     chỉ khóa tĩnh z-index): đo chồng lấn thật + elementFromPoint.
 *   M10 click chuột thật vào nút chính SilenceModal khi panel FPS đang mở
 *     (đợt 62 R1 F4 chỉ đo elementFromPoint, F5 chỉ đo lúc panel đóng).
 *   M11 Escape lúc CaptionModal đang ở bước translate (targetLang=en,
 *     bridge caption + translate thật) — nợ R10 §10.1.
 *   M12 lỗi timeout pack (HangRecorder như R10): sau sửa auto-scroll
 *     (đợt 63 R1), lỗi có vào vùng nhìn thấy của modal không; Escape sau lỗi.
 *   M13 phase text caption locale en (bridge thật): chuỗi phase phải là
 *     tiếng Anh sau sửa (đợt 63 R1), không còn chuỗi vi bridge, không key thô.
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-63r1-modal-headed.mjs
 * Env: R1_DEV_PORT (mặc định tự chọn 5490–5499), R1_DEBUG_PORT (9590–9599),
 * R1_BRIDGE_PORT (8791–8799), R1_DISPLAY (mặc định tự chọn :176–:195),
 * R1_SCRATCH (mặc định hidden_files/round63-r1/headed). TMPDIR riêng
 * /tmp/round63-r1/tmp. Chromium: ms-playwright chromium-1254 (R4 đợt 63 cài;
 * chromium-1248 không còn trên VM; /opt/meta-chromium/chrome KHÔNG chạy
 * được — "Hatch WebGL domain policy is required").
 * Lần chạy 4: M2 đo ở bước 2 (bấm template card trước); M6/M7/M8 đo lại SAU
 * sửa .m-sheet-backdrop 80→350; M11/M13 dùng file giọng nói TTS (mau-1.webm
 * không có track audio → caption lỗi FFMPEG_ERROR) + SPEECH_FN chờ media
 * rehydrate trước khi tổng hợp lại (tránh CDP timeout 60s ở lần chạy 3).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round63-r1", "headed");
const CHROME = [
  path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome"),
  path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome"),
].find((c) => fs.existsSync(c));
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round63-r1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r1.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round63-r1/bridge-work";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

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

/** Chọn display X trống trong dải cho trước (không dùng chung với luồng khác). */
async function pickFreeDisplay(lo, hi) {
  const { execSync } = await import("node:child_process");
  for (let n = lo; n <= hi; n++) {
    const sock = `/tmp/.X11-unix/X${n}`;
    const lock = `/tmp/.X${n}-lock`;
    if (!fs.existsSync(sock) && !fs.existsSync(lock)) return `:${n}`;
    let alive = false;
    try { alive = execSync(`ps -eo args | grep -F "Xvfb :${n} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
    if (!alive) {
      try { if (fs.existsSync(sock)) fs.unlinkSync(sock); } catch {}
      try { if (fs.existsSync(lock)) fs.unlinkSync(lock); } catch {}
      log(`đã dọn socket/lock X mồ côi :${n} (Xvfb cũ đã chết)`);
      return `:${n}`;
    }
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
  async send(method, params = {}, timeoutMs = 60000) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout ${timeoutMs / 1000}s: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression, timeoutMs = 60000) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
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
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  if (!window.__r1injected) {
    window.__r1injected = true;
    window.__r1errors = [];
    window.addEventListener("error", (e) => { try { window.__r1errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r1errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__r1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r1errors.push("unhandledrejection: <?>"); } });
  }
  window.__r1boot = window.__r1boot || Math.random().toString(36).slice(2);
})()`;

// Fake MediaRecorder TREO THẬT (mẫu R10): onstop không bao giờ fire,
// start/stop chỉ đếm, state luôn "recording" → recordPackMedia timeout 20s.
const INJECT_HANG_RECORDER = `(() => {
  if (window.__r1hangInstalled) return "already";
  window.__r1hangInstalled = true;
  window.__realMediaRecorder = window.MediaRecorder;
  window.__hangRec = null;
  class HangRecorder {
    static isTypeSupported() { return true; }
    constructor(stream, opts) {
      this.stream = stream; this.opts = opts || null;
      this.state = "recording";
      this.ondataavailable = null; this.onstop = null;
      this.stopCalls = 0; this.startCalls = 0;
      window.__hangRec = this;
    }
    start() { this.startCalls++; }
    stop() { this.stopCalls++; /* KHONG fire onstop — treo that */ }
    requestData() {}
    pause() {}
    resume() {}
  }
  window.MediaRecorder = HangRecorder;
  return "installed";
})()`;

/**
 * Đo chồng lấn của pill/panel FPS + toast + tour-card + fabbar với nút chính
 * của 1 modal. Tiêu chí verdict (mẫu R1): elementFromPoint, KHÔNG phải diện
 * tích giao nhau hình học — pill/panel nằm DƯỚI backdrop (z 300 < 400) nên
 * giao hình học còn nguyên nhưng không che/không nhận click; toast (z 500)
 * và tour-card (z 450) nằm TRÊN backdrop nên giao nhau với chúng LÀ che thật.
 * titleSubstr: chuỗi nhận diện dialog (aria-label hoặc nội dung).
 * primarySubstr: chuỗi nhận diện nút chính. nth: 0 = nút đầu, -1 = nút cuối
 * (dùng cho TemplatePackModal có 6 nút "Tạo ngay").
 */
const MODAL_FN = (titleSubstr, primarySubstr, nth = 0) => `(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { left: +b.left.toFixed(1), top: +b.top.toFixed(1), right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const overlapArea = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? +(w * h).toFixed(1) : 0;
  };
  const overlapCenter = (a, b) => {
    const x0 = Math.max(a.left, b.left), x1 = Math.min(a.right, b.right);
    const y0 = Math.max(a.top, b.top), y1 = Math.min(a.bottom, b.bottom);
    return (x1 > x0 && y1 > y0) ? { x: +((x0 + x1) / 2).toFixed(1), y: +((y0 + y1) / 2).toFixed(1) } : null;
  };
  const dialogs = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')];
  // Đợt 63 R1: TemplatePicker KHÔNG có role="dialog" (duy nhất trong 12
  // modal) → fallback .modal-backdrop > .modal. Với modal mở từ trong
  // m-sheet (Scene/Beat/Cleanup), cả sheet lẫn modal đều match innerText
  // → lấy dialog KHỚP CUỐI CÙNG (sâu nhất trong DOM = modal thật, sheet
  // chứa nó nên innerText của sheet cũng chứa chuỗi của modal).
  const matches = dialogs.filter((d) => (d.getAttribute("aria-label") || "").includes(${JSON.stringify(titleSubstr)}) || (d.innerText || "").includes(${JSON.stringify(titleSubstr)}));
  const dlg = matches.length ? matches[matches.length - 1] : (document.querySelector(".modal-backdrop .modal") || null);
  const backdrop = document.querySelector(".modal-backdrop");
  const sheetBackdrop = document.querySelector(".m-sheet-backdrop");
  const pill = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("FPS") && !b.closest('[role="dialog"]'));
  const panel = [...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview")) || null;
  const toasts = [...document.querySelectorAll(".toasts .toast")].filter((t) => { const b = t.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
  const tour = document.querySelector(".tour-card");
  const fabbar = document.querySelector(".m-fabbar");
  const describe = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    const inTargetDlg = dlg ? dlg.contains(el) : false;
    return { tag: el.tagName, cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().slice(0, 40), text: (el.textContent || "").trim().slice(0, 40), inTargetDlg, inAnyDialog: !!el.closest('[role="dialog"]'), isBackdrop: el.classList.contains("modal-backdrop"), isPill: pill ? el === pill : false, inPanel: panel ? panel.contains(el) : false, inToast: !!el.closest(".toast"), inTour: tour ? tour.contains(el) : false, inFabbar: fabbar ? fabbar.contains(el) : false, cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) };
  };
  let primary = null;
  if (dlg) {
    const cands = [...dlg.querySelectorAll("button")].filter((b) => (b.textContent || "").includes(${JSON.stringify(primarySubstr)}) && b.getBoundingClientRect().width > 0);
    primary = cands.length ? ((${JSON.stringify(nth)}) === -1 ? cands[cands.length - 1] : cands[0]) : null;
  }
  const out = {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    dialogFound: !!dlg,
    dialogLabel: dlg ? dlg.getAttribute("aria-label") : null,
    dialogRect: dlg ? r(dlg) : null,
    backdropZ: backdrop ? getComputedStyle(backdrop).zIndex : null,
    sheetBackdropZ: sheetBackdrop ? getComputedStyle(sheetBackdrop).zIndex : null,
    backdropInSheet: backdrop ? !!backdrop.closest(".m-sheet") : null,
    pillZ: pill ? getComputedStyle(pill).zIndex : null,
    panelZ: panel ? getComputedStyle(panel).zIndex : null,
    toastZ: toasts[0] ? getComputedStyle(toasts[0].closest(".toasts")).zIndex : null,
    tourZ: tour ? getComputedStyle(tour).zIndex : null,
    pillRect: pill ? r(pill) : null,
    panelRect: panel ? r(panel) : null,
    toastRects: toasts.map(r),
    toastTexts: toasts.map((t) => (t.textContent || "").trim().slice(0, 60)),
    tourRect: tour ? r(tour) : null,
    fabbarRect: fabbar ? r(fabbar) : null,
    primaryRect: primary ? r(primary) : null,
    primaryDisabled: primary ? !!primary.disabled : null,
    primaryText: primary ? (primary.textContent || "").trim().slice(0, 60) : null,
    primaryInViewport: primary ? (() => { const b = primary.getBoundingClientRect(); return b.top >= 0 && b.bottom <= window.innerHeight && b.left >= 0 && b.right <= window.innerWidth; })() : null,
    pillPrimaryOverlap: 0, panelPrimaryOverlap: 0, toastPrimaryOverlap: 0, tourPrimaryOverlap: 0, fabbarPrimaryOverlap: 0,
    hitAtPrimaryCenter: null, hitAtPillCenter: null, hitAtPanelCenter: null,
    hitAtPillOverlapCenter: null, hitAtPanelOverlapCenter: null,
    hitAtToastOverlapCenter: null, hitAtTourOverlapCenter: null, hitAtFabbarOverlapCenter: null,
  };
  if (primary) {
    const pr = r(primary);
    out.hitAtPrimaryCenter = describe(document.elementFromPoint(pr.left + pr.w / 2, pr.top + pr.h / 2));
    if (pill) { out.pillPrimaryOverlap = overlapArea(r(pill), pr); const c = overlapCenter(r(pill), pr); if (c) out.hitAtPillOverlapCenter = describe(document.elementFromPoint(c.x, c.y)); }
    if (panel) { out.panelPrimaryOverlap = overlapArea(r(panel), pr); const c = overlapCenter(r(panel), pr); if (c) out.hitAtPanelOverlapCenter = describe(document.elementFromPoint(c.x, c.y)); }
    if (toasts.length) { for (const t of toasts) { out.toastPrimaryOverlap = Math.max(out.toastPrimaryOverlap, overlapArea(r(t), pr)); const c = overlapCenter(r(t), pr); if (c && !out.hitAtToastOverlapCenter) out.hitAtToastOverlapCenter = describe(document.elementFromPoint(c.x, c.y)); } }
    if (tour) { out.tourPrimaryOverlap = overlapArea(r(tour), pr); const c = overlapCenter(r(tour), pr); if (c) out.hitAtTourOverlapCenter = describe(document.elementFromPoint(c.x, c.y)); }
    if (fabbar) { out.fabbarPrimaryOverlap = overlapArea(r(fabbar), pr); const c = overlapCenter(r(fabbar), pr); if (c) out.hitAtFabbarOverlapCenter = describe(document.elementFromPoint(c.x, c.y)); }
  }
  if (pill) { const pr = r(pill); out.hitAtPillCenter = describe(document.elementFromPoint(pr.left + pr.w / 2, pr.top + pr.h / 2)); }
  if (panel) { const pr = r(panel); out.hitAtPanelCenter = describe(document.elementFromPoint(pr.left + pr.w / 2, pr.top + pr.h / 2)); }
  return out;
})()`;

const STATE_FN = `(() => {
  const dialogs = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].map((d) => d.getAttribute("aria-label") || (d.innerText || "").slice(0, 30));
  const capDlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("phụ đề") || (d.getAttribute("aria-label") || "").includes("caption") || (d.getAttribute("aria-label") || "").includes("Caption"));
  return {
    dialogs,
    captionOpen: !!capDlg,
    captionStep: capDlg ? (document.querySelector(".caption-running") ? "running" : (document.querySelector(".caption-list") ? "review" : "config")) : "",
    captionPhase: (document.querySelector(".caption-running b") || {}).textContent || "",
    fpsPanelOpen: !!([...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview"))),
    toastCount: [...document.querySelectorAll(".toasts .toast")].filter((t) => t.getBoundingClientRect().width > 0).length,
    toastTexts: [...document.querySelectorAll(".toasts .toast")].map((t) => (t.textContent || "").trim().slice(0, 60)),
    tourOpen: !!document.querySelector(".tour-card"),
    errors: (window.__r1errors || []).slice(),
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

const BTN_RECT_FN = (substr, dialogLabel) => `((s, dl) => {
  const scope = dl ? [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes(dl) || (d.innerText || "").includes(dl)) : document;
  if (!scope) return null;
  const b = [...scope.querySelectorAll("button")].find((x) => (x.textContent || "").includes(s) && x.getBoundingClientRect().width > 0);
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled, rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) } };
})(${JSON.stringify(substr)}, ${JSON.stringify(dialogLabel || "")})`;

// Đo riêng bước RUNNING của CaptionModal (mẫu R10).
const RUNNING_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const run = dlg.querySelector(".caption-running");
  if (!run) return { running: false };
  const mr = dlg.getBoundingClientRect();
  const sp = run.querySelector(".spinner");
  const sr = sp ? sp.getBoundingClientRect() : null;
  const cancel = [...run.querySelectorAll("button")].map((b) => {
    const r = b.getBoundingClientRect();
    return { text: b.textContent.trim(), rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, visible: r.width > 0 && r.height > 0 };
  })[0] || null;
  return {
    running: true,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    modal: { top: +mr.top.toFixed(1), bottom: +mr.bottom.toFixed(1), w: +mr.width.toFixed(1), h: +mr.height.toFixed(1) },
    spinnerVisible: !!sr && sr.width > 0 && sr.height > 0,
    phaseText: (run.querySelector("b") || {}).textContent || "",
    bodyText: run.innerText.replace(/\\n/g, " | ").slice(0, 200),
    cancel,
  };
})()`;

// Đo lỗi pack timeout có nằm trong vùng nhìn thấy của modal không.
// Đợt 63 R1: container cuộn THẬT là .modal-body (overflow-y:auto), không
// phải .modal — lần chạy 2 đo nhầm dlg.scrollTop (luôn 0) nên không chứng
// minh được auto-scroll; lần này đo cả 2.
const PACK_ERR_FN = `(() => {
  const dlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => d.querySelector(".error")) || document.querySelector(".modal-backdrop .modal");
  if (!dlg) return { errorFound: false };
  const err = dlg.querySelector(".error");
  if (!err) return { errorFound: false };
  const er = err.getBoundingClientRect();
  const mr = dlg.getBoundingClientRect();
  const body = dlg.querySelector(".modal-body");
  const br = body ? body.getBoundingClientRect() : null;
  const visTop = Math.max(er.top, mr.top), visBottom = Math.min(er.bottom, mr.bottom);
  const visH = Math.max(0, visBottom - visTop);
  return {
    errorFound: true,
    errorText: (err.textContent || "").trim().slice(0, 200),
    errorRect: { top: +er.top.toFixed(1), bottom: +er.bottom.toFixed(1), h: +er.height.toFixed(1) },
    modalRect: { top: +mr.top.toFixed(1), bottom: +mr.bottom.toFixed(1), h: +mr.height.toFixed(1) },
    modalScrollTop: dlg.scrollTop, modalScrollHeight: dlg.scrollHeight, modalClientHeight: dlg.clientHeight,
    bodyRect: br ? { top: +br.top.toFixed(1), bottom: +br.bottom.toFixed(1), h: +br.height.toFixed(1) } : null,
    bodyScrollTop: body ? body.scrollTop : null, bodyScrollHeight: body ? body.scrollHeight : null, bodyClientHeight: body ? body.clientHeight : null,
    errorFullyVisible: er.top >= mr.top - 0.5 && er.bottom <= mr.bottom + 0.5 && er.top >= 0 && er.bottom <= window.innerHeight + 0.5,
    errorVisiblePct: er.height > 0 ? +((visH / er.height) * 100).toFixed(1) : 0,
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

// Trạng thái store phục vụ đo: clip mẫu v1 + media + selection.
const STORE_FN = `(async () => {
  const mod = window.__r1storeMod || (window.__r1storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  const v1 = st.spec.tracks.find((t) => t.id === "v1");
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    v1clips: v1 ? v1.clips.map((c) => ({ id: c.id, kind: c.kind, src: c.src, start: c.start, duration: c.duration })) : null,
    tracks: st.spec.tracks.map((t) => ({ id: t.id, kind: t.kind, clips: t.clips.length })),
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    selection: st.selection,
  };
})()`;

// Tạo clip audio thật (tone 440Hz 2s, encode WAV trong trang) → import qua
// store.importFiles (đúng đường MediaBin) → addMediaAtPlayhead → chọn clip.
// Cần cho BeatSyncModal: nút beat chỉ hiện khi clip audio được chọn, mà
// project mẫu không có clip audio nào.
const MAKE_AUDIO_FN = `(async () => {
  const mod = window.__r1storeMod || (window.__r1storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  const ctx = new OfflineAudioContext(1, 44100 * 2, 44100);
  const osc = ctx.createOscillator(); osc.frequency.value = 440;
  const g = ctx.createGain(); g.gain.value = 0.3;
  osc.connect(g); g.connect(ctx.destination); osc.start(0); osc.stop(2);
  const buf = await ctx.startRendering();
  const ch = buf.getChannelData(0);
  const dataLen = ch.length * 2;
  const ab = new ArrayBuffer(44 + dataLen);
  const v = new DataView(ab);
  const wstr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, "RIFF"); v.setUint32(4, 36 + dataLen, true); wstr(8, "WAVE"); wstr(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 44100 * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  wstr(36, "data"); v.setUint32(40, dataLen, true);
  for (let i = 0; i < ch.length; i++) { const s = Math.max(-1, Math.min(1, ch[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  const file = new File([ab], "r63-tone.wav", { type: "audio/wav" });
  await st.importFiles([file]);
  const st2 = mod.useStore.getState();
  const item = st2.media.find((m) => m.name === "r63-tone.wav");
  if (!item) return { ok: false, why: "importFiles không tạo media item r63-tone.wav" };
  st2.addMediaAtPlayhead(item.id);
  const st3 = mod.useStore.getState();
  const audioTrack = st3.spec.tracks.find((t) => t.kind === "audio");
  const clip = audioTrack ? audioTrack.clips.find((c) => c.src === "r63-tone.wav") : null;
  if (!clip) return { ok: false, why: "không tạo được audio clip", tracks: st3.spec.tracks.map((t) => ({ id: t.id, kind: t.kind, clips: t.clips.length })) };
  st3.select({ trackId: audioTrack.id, clipId: clip.id });
  return { ok: true, trackId: audioTrack.id, clipId: clip.id, duration: item.duration || null };
})()`;

// Tạo file giọng nói thật qua bridge /api/tts (VieNeu-TTS local) rồi import
// qua store.importFiles — dùng cho M11/M13: file mẫu mau-1.webm KHÔNG có
// track audio nên caption job nào cũng lỗi FFMPEG_ERROR ở bước extract
// (đo ở lần chạy 2 + tái hiện bằng curl); file TTS có lời nói thật nên
// faster-whisper nhận diện được (đã verify bằng curl: 2 segments, 16 từ).
// BRIDGE_URL được chèn từ harness lúc chạy (không hardcode cổng).
const SPEECH_FN = (bridgeUrl) => `(async () => {
  const mod = window.__r1storeMod || (window.__r1storeMod = await import("/src/store.ts"));
  // Lần chạy 3: sau reload, media rehydrate từ IDB chậm hơn mount — chờ
  // file blob về (tối đa 30s) trước khi quyết định tổng hợp lại, nếu không
  // sẽ gọi TTS lần 2 (~65s) trong 1 eval và vấp CDP timeout 60s.
  for (let i = 0; i < 60; i++) {
    const cur = mod.useStore.getState().media.find((m) => m.name === "r63-speech.wav");
    if (cur && cur.file) return { ok: true, reused: true, name: cur.name, id: cur.id };
    await new Promise((r) => setTimeout(r, 500));
  }
  const st = mod.useStore.getState();
  const res = await fetch(${JSON.stringify(bridgeUrl)} + "/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Xin chào các bạn, đây là video thử nghiệm phụ đề tự động của VCut Studio.", voice: "Hải Đăng" }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ""); return { ok: false, why: "TTS HTTP " + res.status + " " + t.slice(0, 200) }; }
  const blob = await res.blob();
  if (!blob || blob.size === 0) return { ok: false, why: "TTS trả blob rỗng" };
  const file = new File([blob], "r63-speech.wav", { type: "audio/wav" });
  await st.importFiles([file]);
  const st2 = mod.useStore.getState();
  const item = st2.media.find((m) => m.name === "r63-speech.wav");
  if (!item || !item.file) return { ok: false, why: "importFiles không tạo media item r63-speech.wav" };
  return { ok: true, reused: false, name: item.name, id: item.id, duration: item.duration || null, size: blob.size };
})()`;

// Chọn 1 file media trong CaptionModal (select đầu tiên của dialog) theo tên.
const SELECT_CAPTION_FILE_FN = (fileName) => `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const sel = dlg.querySelector("select");
  if (!sel) return null;
  const opt = [...sel.options].find((o) => (o.textContent || "").includes(${JSON.stringify(fileName)}) || o.value.includes(${JSON.stringify(fileName)}));
  if (!opt) return { found: false, options: [...sel.options].map((o) => o.textContent.trim().slice(0, 30)) };
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(sel, opt.value);
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  return { found: true, value: sel.value, text: opt.textContent.trim() };
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { bridge?.kill("SIGTERM"); } catch {}
  };
  process.on("exit", killAll);

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 5; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .m-sheet-backdrop, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => {
        const clickFirst = (sel) => { const b = document.querySelector(sel); if (b) { b.click(); return true; } return false; };
        if (clickFirst('[role="dialog"] .modal-head .icon-btn')) return "x";
        if (clickFirst('.tour-card .icon-btn')) return "tour-x";
        if (clickFirst('.m-sheet-close')) return "sheet-x";
        const b = [...document.querySelectorAll('[role="dialog"] button')].find((x) => ["Later", "Để sau", "Skip", "Đóng", "Close"].includes(x.textContent.trim()));
        if (b) { b.click(); return "later"; }
        return null;
      })()`).catch(() => {});
      await sleep(500);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(500);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .m-sheet-backdrop, .welcome-modal")`));
  }

  async function waitMounted(cdp, oldBoot) {
    const oldBootJson = JSON.stringify(oldBoot ?? null);
    const boot = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__r1boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function reloadPage(cdp) {
    const oldBoot = await cdp.evalJs(`window.__r1boot`).catch(() => null);
    await cdp.send("Page.reload", { ignoreCache: false });
    return waitMounted(cdp, oldBoot);
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r1errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r1errors = []`).catch(() => {});
    return e;
  }

  async function setViewport(cdp, w, h, mobile) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile: !!mobile,
    });
    await reloadPage(cdp);
    const vp = await cdp.evalJs(`({ w: window.innerWidth, h: window.innerHeight })`);
    log(`viewport đặt ${w}x${h} mobile=${!!mobile} → thực ${vp.w}x${vp.h}`);
    return vp;
  }

  async function setLang(cdp, lang) {
    await cdp.evalJs(`localStorage.setItem("vcut-lang", ${JSON.stringify(lang)})`);
    await reloadPage(cdp);
    const cur = await cdp.evalJs(`localStorage.getItem("vcut-lang")`);
    log(`locale đặt ${lang} → thực ${cur}`);
    return cur;
  }

  async function openModalTopBar(cdp, topBtnSubstr, titleSubstr, skipEnsure) {
    const topBtnFn = `(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes(${JSON.stringify(topBtnSubstr)})); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled, visible: r.width > 0 && r.left >= 0 && r.right <= window.innerWidth }; })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (!skipEnsure) await ensureNoModal(cdp);
      let btn = await cdp.evalJs(topBtnFn);
      if (!btn) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" (lần ${attempt})`);
      if (btn.disabled) {
        // Lần chạy 2: nút Captions disabled ngay sau reload vì media mẫu
        // chưa rehydrate xong từ IDB (canCaption cần media có file) — chờ
        // nút enable tối đa 30s thay vì fail ngay.
        let enabled = false;
        for (let i = 0; i < 60 && !enabled; i++) {
          await sleep(500);
          const b2 = await cdp.evalJs(topBtnFn);
          if (b2 && !b2.disabled) enabled = true;
        }
        if (!enabled) throw new Error(`nút TopBar "${topBtnSubstr}" vẫn disabled sau 30s chờ (media chưa rehydrate?)`);
      }
      const btnNow = await cdp.evalJs(topBtnFn);
      if (!btnNow) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" sau chờ enable`);
      btn = btnNow;
      if (!btn.visible) {
        await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => (x.textContent || "").includes(${JSON.stringify(topBtnSubstr)})); if (b) b.scrollIntoView({ block: "nearest", inline: "center" }); return true; })()`);
        await sleep(400);
        const btn2 = await cdp.evalJs(topBtnFn);
        if (!btn2) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" sau scrollIntoView`);
        await cdp.click(btn2.x, btn2.y);
      } else {
        await cdp.click(btn.x, btn.y);
      }
      const opened = await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes(${JSON.stringify(titleSubstr)}) ? true : null; })()`).catch(() => null);
        return m;
      }, `modal mở (tiêu đề ${titleSubstr}, lần ${attempt})`, 8000).catch(() => null);
      if (opened) return { method: btn.visible ? "chuột thật" : "chuột thật sau scrollIntoView" };
      log(`openModalTopBar lần ${attempt}: modal chưa mở (tiêu đề ${titleSubstr}) — bấm lại`);
      await sleep(1000);
    }
    throw new Error(`timeout chờ modal mở (tiêu đề ${titleSubstr}) sau 3 lần bấm`);
  }

  async function closeModalX(cdp) {
    await cdp.evalJs(`(() => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (b) b.click(); return !!b; })()`);
    await sleep(400);
    await cdp.key("Escape", "Escape").catch(() => {});
    await ensureNoModal(cdp);
  }

  async function openFpsPanel(cdp) {
    const pillBtn = await cdp.evalJs(BTN_RECT_FN("FPS"));
    if (!pillBtn) throw new Error("không tìm thấy pill FPS để mở panel");
    await cdp.click(pillBtn.x, pillBtn.y);
    const opened = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.fpsPanelOpen ? s : null;
    }, "panel FPS mở sau khi bấm pill", 10000).catch(() => null);
    if (!opened) throw new Error("bấm pill nhưng panel FPS không mở");
    return true;
  }

  async function closeFpsPanel(cdp) {
    await cdp.evalJs(`(() => { const p = [...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview")); if (!p) return false; const b = p.querySelector("button"); if (b) b.click(); return true; })()`);
    await sleep(500);
  }

  async function pushToast(cdp, message, kind) {
    return cdp.evalJs(`(async () => {
      const entries = performance.getEntriesByType("resource").map((e) => e.name);
      const hit = entries.find((u) => /\\/src\\/lib\\/toast\\.ts(\\?|$)/.test(u)) || "/src/lib/toast.ts";
      const mod = window.__r1toastMod || (window.__r1toastMod = await import(hit));
      const id = mod.pushToast(${JSON.stringify(message)}, ${JSON.stringify(kind || "info")});
      return { id, hit };
    })()`);
  }

  async function scrollPrimaryIntoView(cdp, titleSubstr, primarySubstr, nth = 0) {
    return cdp.evalJs(`((t, p, n) => {
      const dialogs = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')];
      const dlg = dialogs.find((d) => (d.getAttribute("aria-label") || "").includes(t)) || dialogs.find((d) => (d.innerText || "").includes(t));
      if (!dlg) return null;
      const cands = [...dlg.querySelectorAll("button")].filter((b) => (b.textContent || "").includes(p) && b.getBoundingClientRect().width > 0);
      const btn = cands.length ? (n === -1 ? cands[cands.length - 1] : cands[0]) : null;
      if (!btn) return null;
      btn.scrollIntoView({ block: "center" });
      return true;
    })(${JSON.stringify(titleSubstr)}, ${JSON.stringify(primarySubstr)}, ${nth})`);
  }

  // Verdict cho M1–M8: nút chính phải trúng dialog tại tâm + không bị
  // pill/panel đè tại tâm vùng giao nhau (toast/tour phải vắng trong các
  // case này — đo riêng ở M9).
  function verdictModal(m, label) {
    if (!m) return { ok: false, why: "không đo được", summary: "" };
    if (!m.dialogFound) return { ok: false, why: `không tìm thấy dialog "${label}"`, summary: "" };
    if (!m.primaryRect) return { ok: false, why: "không tìm thấy nút chính trong dialog", summary: "" };
    const problems = [];
    const hit = m.hitAtPrimaryCenter;
    if (!hit) problems.push("elementFromPoint tại tâm nút chính trả null");
    else if (!hit.inTargetDlg) problems.push(`elementFromPoint tại tâm nút chính trúng "${hit.text}" (${hit.tag}, ngoài dialog) — nút không bấm được`);
    if (m.hitAtPillOverlapCenter && !m.hitAtPillOverlapCenter.inTargetDlg && !m.hitAtPillOverlapCenter.isBackdrop) problems.push(`tâm vùng giao nhau pill∩nút trúng pill "${m.hitAtPillOverlapCenter.text}" — pill còn trên backdrop`);
    if (m.hitAtPanelOverlapCenter && !m.hitAtPanelOverlapCenter.inTargetDlg && !m.hitAtPanelOverlapCenter.isBackdrop) problems.push(`tâm vùng giao nhau panel∩nút trúng panel "${m.hitAtPanelOverlapCenter.text}" — panel còn trên backdrop`);
    if (m.hitAtPillCenter && m.hitAtPillCenter.isPill) problems.push("pill FPS vẫn là phần tử trên cùng tại tâm của nó khi modal mở — pill còn trên backdrop");
    if (m.hitAtPanelCenter && m.hitAtPanelCenter.inPanel) problems.push("panel FPS vẫn là phần tử trên cùng tại tâm của nó khi modal mở — panel còn trên backdrop");
    if (m.hitAtToastOverlapCenter && !m.hitAtToastOverlapCenter.inTargetDlg) problems.push(`toast đè nút chính tại tâm giao nhau ("${m.hitAtToastOverlapCenter.text}")`);
    if (m.hitAtTourOverlapCenter && !m.hitAtTourOverlapCenter.inTargetDlg) problems.push(`tour-card đè nút chính tại tâm giao nhau ("${m.hitAtTourOverlapCenter.text}")`);
    if (m.hitAtFabbarOverlapCenter && !m.hitAtFabbarOverlapCenter.inTargetDlg && !m.hitAtFabbarOverlapCenter.isBackdrop) problems.push(`fabbar đè nút chính tại tâm giao nhau ("${m.hitAtFabbarOverlapCenter.text}")`);
    const hitTxt = hit ? hit.text : "?";
    const hitWhere = hit ? (hit.inTargetDlg ? "trong dialog" : "NGOAI dialog") : "?";
    const summary = `viewport ${m.viewport.w}x${m.viewport.h}, backdrop z=${m.backdropZ}, pill z=${m.pillZ}, nut "${m.primaryText}" ${m.primaryRect.w}x${m.primaryRect.h} tai (${m.primaryRect.left}, ${m.primaryRect.top}), giao nhau pill=${m.pillPrimaryOverlap}px2 panel=${m.panelPrimaryOverlap}px2 toast=${m.toastPrimaryOverlap}px2 tour=${m.tourPrimaryOverlap}px2 fabbar=${m.fabbarPrimaryOverlap}px2 (chi ghi nhan — nam duoi backdrop thi khong che), hit tai tam nut="${hitTxt}" (${hitWhere}), nut trong viewport=${m.primaryInViewport}`;
    return problems.length ? { ok: false, why: problems.join(" || "), summary } : { ok: true, why: "", summary };
  }

  try {
    const DEV_PORT = Number(process.env.R1_DEV_PORT || 0) || (await pickFreePort(5490, 5499));
    const DEBUG_PORT = Number(process.env.R1_DEBUG_PORT || 0) || (await pickFreePort(9590, 9599));
    const BRIDGE_PORT = Number(process.env.R1_BRIDGE_PORT || 0) || (await pickFreePort(8791, 8799));
    const DISPLAY = process.env.R1_DISPLAY || (await pickFreeDisplay(176, 195));
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5490–5499");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9590–9599");
    if (!BRIDGE_PORT) throw new Error("hết cổng bridge trống 8791–8799");
    if (!DISPLAY) throw new Error("hết display X trống :176–:195");
    if (!CHROME) throw new Error("không thấy chrome (chromium-1254/1248)");
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const BRIDGE_URL = `http://127.0.0.1:${BRIDGE_PORT}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round63-r1/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, bridge :${BRIDGE_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    // ---- Bridge (caption + translate thật, faster-whisper local) ---------
    {
      const bridgeLogFd = fs.openSync(path.join(SCRATCH, "r1-bridge.log"), "w");
      bridge = spawn("node", [BRIDGE_ENTRY], {
        stdio: ["ignore", bridgeLogFd, bridgeLogFd],
        env: {
          ...process.env,
          BRIDGE_PORT: String(BRIDGE_PORT),
          CAPTION_PYTHON: path.join(ROOT, "server", "caption", ".venv", "bin", "python"),
          TTS_PYTHON: path.join(ROOT, "server", "tts", ".venv2", "bin", "python"),
          BRIDGE_WORK_DIR,
          // Đợt 66 T9 — persist riêng theo PID (BRIDGE_WORK_DIR cố định): tránh rò mốc limiter (đợt 65 §3b).
          BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-${process.pid}.json`),
        },
      });
      let up = false;
      for (let i = 0; i < 120 && !up; i++) {
        try {
          const h = await fetch(BRIDGE_URL + "/api/health");
          const j = await h.json();
          if (j.caption && j.caption.available) up = true;
        } catch { await sleep(1000); }
      }
      if (!up) throw new Error(`bridge không lên / caption không available ở ${BRIDGE_URL} sau 120s (xem r1-bridge.log)`);
      log(`bridge OK: ${BRIDGE_URL} (caption available, WORK_DIR=${BRIDGE_WORK_DIR})`);
    }

    // ---- Vite + Xvfb + Chrome ------------------------------------------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "r1-vite.log"), "w");
    const viteEnv = { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL };
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd], env: viteEnv });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r1-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error("không lấy được page target CDP");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // ---- M0: setup vi + mount -------------------------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    const s0 = await cdp.evalJs(STORE_FN).catch(() => null);
    await drainErrors(cdp);
    if (s0 && s0.clipCount === 3 && s0.mediaCount === 2) pass("M0 setup: locale vi + mẫu tự load", `3 clip, media bin 2 item`);
    else fail("M0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(s0)}`);

    // ---- Viewport mobile 390×844 cho M1–M10, M12 -------------------------
    await setViewport(cdp, 390, 844, true);

    // ---- M1–M8: từng modal khác ở 390px ----------------------------------
    async function measureModalCase(tag, topBtnSubstr, titleSubstr, primarySubstr, nth, shotName, openFn) {
      try {
        if (openFn) await openFn();
        else await openModalTopBar(cdp, topBtnSubstr, titleSubstr);
        // Nút chính có thể nằm dưới fold của modal (ExportPanel CTA) — cuộn
        // vào giữa vùng nhìn rồi mới đo (ghi lại nó có cần cuộn không).
        const before = await cdp.evalJs(MODAL_FN(titleSubstr, primarySubstr, nth));
        const neededScroll = before && before.primaryRect ? !before.primaryInViewport : null;
        if (neededScroll) await scrollPrimaryIntoView(cdp, titleSubstr, primarySubstr, nth);
        await sleep(300);
        const m = await cdp.evalJs(MODAL_FN(titleSubstr, primarySubstr, nth));
        fs.writeFileSync(path.join(SCRATCH, `r1-measure-${tag}.json`), JSON.stringify({ before, after: m }, null, 2));
        const v = verdictModal(m, tag);
        await cdp.shot(shotName);
        await drainErrors(cdp);
        const scrollNote = neededScroll === true ? " (nut chinh nam duoi fold modal luc mo — da scrollIntoView truoc khi do)" : neededScroll === false ? " (nut chinh thay ngay luc mo, khong can cuon)" : "";
        if (v.ok) pass(`${tag}: pill/panel FPS không đè nút chính, nút bấm được`, v.summary + scrollNote);
        else fail(`${tag}: pill/panel FPS không đè nút chính, nút bấm được`, `${v.why} — ${v.summary}${scrollNote}`);
      } catch (e) {
        fail(`${tag}: pill/panel FPS không đè nút chính, nút bấm được`, `HARNESS: ${e.message}`);
      } finally {
        await closeModalX(cdp).catch(() => {});
        await ensureNoModal(cdp).catch(() => {});
      }
    }

    // M1 SilenceModal — nút chính "🔍 Phân tích khoảng lặng" (config).
    await measureModalCase("M1-silence-390-vi", "Cắt lặng", "Cắt khoảng lặng", "Phân tích khoảng lặng", 0, "r1-m1-silence-390-vi.png");
    // M2 TemplatePicker — nút chính "Tạo project từ mẫu" chỉ có ở BƯỚC 2
    // (form điền placeholder); bước 1 là gallery không có footer. Mở picker
    // rồi bấm vào template card đầu tiên để sang bước 2 rồi mới đo.
    // (Lần chạy 2–3 fail vì đo ngay ở bước 1: không thấy nút chính.)
    await measureModalCase("M2-template-390-vi", null, "Mẫu video", "Tạo project từ mẫu", 0, "r1-m2-template-390-vi.png", async () => {
      await openModalTopBar(cdp, "Mẫu", "Mẫu video");
      const card = await cdp.evalJs(`(() => { const b = document.querySelector(".template-grid .template-card"); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: (b.textContent || "").trim().slice(0, 40) }; })()`);
      if (!card) throw new Error("không thấy template card trong gallery bước 1");
      await cdp.click(card.x, card.y);
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Tạo project từ mẫu") ? true : null; })()`).catch(() => null);
        return m;
      }, "TemplatePicker sang bước 2 (form)", 8000);
    });
    // M3 ExportPanel — CTA chính "🎬 Xuất MP4 (1280×720)" (nằm sâu trong body).
    await measureModalCase("M3-export-390-vi", "Xuất bản", "Xuất MP4", "Xuất MP4", 0, "r1-m3-export-390-vi.png");
    // M4 WelcomeModal — nút chính "▶ Xem project mẫu".
    await measureModalCase("M4-welcome-390-vi", "Bắt đầu", "Chào mừng", "Xem project mẫu", 0, "r1-m4-welcome-390-vi.png");
    // M5 TemplatePackModal — nút "Tạo ngay" đầu + cuối (6 pack).
    await measureModalCase("M5-pack-first-390-vi", null, "Template pack", "Tạo ngay", 0, "r1-m5-pack-first-390-vi.png", async () => {
      await openModalTopBar(cdp, "Bắt đầu", "Chào mừng");
      const packBtn = await cdp.evalJs(BTN_RECT_FN("Tạo video 1 chạm", "Chào mừng"));
      if (!packBtn) throw new Error("không thấy nút 'Tạo video 1 chạm' trong WelcomeModal");
      await cdp.click(packBtn.x, packBtn.y);
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Template pack") ? true : null; })()`).catch(() => null);
        return m;
      }, "TemplatePackModal mở", 8000);
    });
    await measureModalCase("M5-pack-last-390-vi", null, "Template pack", "Tạo ngay", -1, "r1-m5-pack-last-390-vi.png", async () => {
      await openModalTopBar(cdp, "Bắt đầu", "Chào mừng");
      const packBtn = await cdp.evalJs(BTN_RECT_FN("Tạo video 1 chạm", "Chào mừng"));
      if (!packBtn) throw new Error("không thấy nút 'Tạo video 1 chạm' trong WelcomeModal");
      await cdp.click(packBtn.x, packBtn.y);
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Template pack") ? true : null; })()`).catch(() => null);
        return m;
      }, "TemplatePackModal mở", 8000);
    });
    // M6 SceneModal — mở qua Inspector sheet mobile (fab ⚙️), clip video v1[0].
    await measureModalCase("M6-scene-390-vi", null, "Quét chuyển cảnh", "Quét chuyển cảnh", 0, "r1-m6-scene-390-vi.png", async () => {
      const sel = await cdp.evalJs(`(async () => {
        const mod = window.__r1storeMod || (window.__r1storeMod = await import("/src/store.ts"));
        const st = mod.useStore.getState();
        const v1 = st.spec.tracks.find((t) => t.id === "v1");
        if (!v1 || !v1.clips[0]) return null;
        st.select({ trackId: "v1", clipId: v1.clips[0].id });
        return { clipId: v1.clips[0].id };
      })()`);
      if (!sel) throw new Error("không chọn được clip video v1[0]");
      const fab = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll(".m-fabbar button")].find((x) => (x.getAttribute("aria-label") || "").includes("thuộc tính")); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (!fab) throw new Error("không thấy fab Inspector mobile");
      await cdp.click(fab.x, fab.y);
      await sleep(600);
      const sceneBtn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll(".m-sheet button")].find((x) => (x.textContent || "").includes("Tự động tách cảnh")); if (!b) return null; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim() }; })()`);
      if (!sceneBtn) throw new Error("không thấy nút 'Tự động tách cảnh' trong Inspector sheet (clip video đã chọn?)");
      await cdp.click(sceneBtn.x, sceneBtn.y);
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Quét chuyển cảnh") ? true : null; })()`).catch(() => null);
        return m;
      }, "SceneModal mở", 8000);
    });
    // M7 BeatSyncModal — cần clip audio: tạo tone WAV thật → import → chọn.
    await measureModalCase("M7-beat-390-vi", null, "Phân tích beat", "Phân tích beat", 0, "r1-m7-beat-390-vi.png", async () => {
      const made = await cdp.evalJs(MAKE_AUDIO_FN);
      if (!made || !made.ok) throw new Error(`không tạo được clip audio thật: ${JSON.stringify(made)}`);
      log(`audio clip thật tạo xong: track=${made.trackId} clip=${made.clipId}`);
      const fab = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll(".m-fabbar button")].find((x) => (x.getAttribute("aria-label") || "").includes("thuộc tính")); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (!fab) throw new Error("không thấy fab Inspector mobile");
      await cdp.click(fab.x, fab.y);
      await sleep(600);
      const beatBtn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll(".m-sheet button")].find((x) => (x.textContent || "").includes("Phân tích beat")); if (!b) return null; b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim() }; })()`);
      if (!beatBtn) throw new Error("không thấy nút 'Phân tích beat' trong Inspector sheet (clip audio đã chọn?)");
      await cdp.click(beatBtn.x, beatBtn.y);
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Phân tích beat") ? true : null; })()`).catch(() => null);
        return m;
      }, "BeatSyncModal mở", 8000);
    });
    // M8 StorageCleanupPanel — mở qua MediaBin sheet mobile (fab 📁) → "Dọn kho".
    await measureModalCase("M8-cleanup-390-vi", null, "Dọn kho lưu trữ", "Xóa đã chọn", 0, "r1-m8-cleanup-390-vi.png", async () => {
      const fab = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll(".m-fabbar button")].find((x) => (x.getAttribute("aria-label") || "").includes("thư viện")); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (!fab) throw new Error("không thấy fab MediaBin mobile");
      await cdp.click(fab.x, fab.y);
      await sleep(600);
      const cleanBtn = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="storage-cleanup-open"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (!cleanBtn) throw new Error("không thấy nút 'Dọn kho' trong MediaBin sheet");
      await cdp.click(cleanBtn.x, cleanBtn.y);
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Dọn kho lưu trữ") ? true : null; })()`).catch(() => null);
        return m;
      }, "StorageCleanupPanel mở", 8000);
      // Chờ quét IDB xong (summary "Kho có" hoặc "trống") rồi mới đo.
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const d = [...document.querySelectorAll('[role="dialog"]')].find((x) => (x.innerText || "").includes("Dọn kho lưu trữ")); if (!d) return null; return /Kho có|đang trống|không quét được/i.test(d.innerText) ? true : null; })()`).catch(() => null);
        return m;
      }, "StorageCleanupPanel quét xong", 30000).catch(() => log("M8: chờ summary quét timeout — vẫn đo nút hiện tại"));
    });

    // ---- M9: toast + tour-card cùng lúc CaptionModal mở -------------------
    try {
      // Mở tour trước (Welcome → tour), rồi mở CaptionModal qua TopBar
      // (tour-card nhỏ, không che TopBar) → cả 2 cùng mở.
      await openModalTopBar(cdp, "Bắt đầu", "Chào mừng");
      const tourBtn = await cdp.evalJs(BTN_RECT_FN("Xem tour 5 bước", "Chào mừng"));
      if (!tourBtn) throw new Error("không thấy nút 'Xem tour 5 bước' trong WelcomeModal");
      await cdp.click(tourBtn.x, tourBtn.y);
      await cdp.waitFor(async () => {
        const s = await cdp.evalJs(STATE_FN).catch(() => null);
        return s && s.tourOpen ? s : null;
      }, "tour-card mở", 8000);
      await openModalTopBar(cdp, "Phụ đề", "Tạo phụ đề tự động", true); // skipEnsure: giữ tour-card đang mở
      // Toast thật qua đúng hàm pushToast mà UI dùng (không có đường UI nào
      // kích toast trong lúc modal mở vì backdrop chặn click nền).
      const toastRes = await pushToast(cdp, "R63-R1 đo toast: thông báo mẫu trong lúc modal mở", "info");
      await sleep(800);
      const m = await cdp.evalJs(MODAL_FN("Tạo phụ đề tự động", "Bắt đầu tạo phụ đề", 0));
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-m9-toast-tour.json"), JSON.stringify(m, null, 2));
      await cdp.shot("r1-m9-toast-tour-390-vi.png");
      await drainErrors(cdp);
      const hit = m.hitAtPrimaryCenter;
      const tourCovers = m.tourPrimaryOverlap > 0;
      const toastCovers = m.toastPrimaryOverlap > 0;
      const hitIsTour = hit && hit.inTour;
      const hitIsToast = hit && hit.inToast;
      const summary = `tour-card ${m.tourRect ? `${m.tourRect.w}x${m.tourRect.h} tai (${m.tourRect.left}, ${m.tourRect.top})` : "khong thay"} z=${m.tourZ}, giao tour-nut=${m.tourPrimaryOverlap}px2; toast ${m.toastRects.length} cai ${m.toastRects.map((t) => `${t.w}x${t.h}`).join(",")} z=${m.toastZ}, giao toast-nut=${m.toastPrimaryOverlap}px2; hit tai tam nut="${hit ? hit.text : "?"}" (${hitIsTour ? "TOUR-CARD" : hitIsToast ? "TOAST" : hit && hit.inTargetDlg ? "trong dialog" : "ngoai dialog"})`;
      // Chờ toast tự tắt (4.5s) rồi đo lại: nút chính phải bấm được trở lại.
      await sleep(5000);
      const m2 = await cdp.evalJs(MODAL_FN("Tạo phụ đề tự động", "Bắt đầu tạo phụ đề", 0));
      const hit2 = m2.hitAtPrimaryCenter;
      const afterToastGone = m2.toastRects.length === 0 && hit2 && hit2.inTargetDlg;
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-m9-after-toast.json"), JSON.stringify(m2, null, 2));
      await drainErrors(cdp);
      // Verdict M9 (sửa sau lần chạy 2): case này ĐO hiện tượng, không phải
      // khóa "nút phải bấm được" — tour (z 450) và toast (z 500) vốn TRÊN
      // backdrop theo thiết kế đã khóa ở R1. PASS khi đo đầy đủ: tour/toast
      // đều hiện trên modal + diện tích che nút định lượng được + trạng thái
      // sau khi toast tắt xác định được. PHÁT HIỆN ghi rõ trong detail.
      const tourObserved = !!m.tourRect;
      const toastObserved = m.toastRects.length > 0;
      const postToastDetermined = m2.toastRects.length === 0;
      const tourStillCoversAfterToast = postToastDetermined && m2.tourPrimaryOverlap > 0;
      if (tourObserved && toastObserved && postToastDetermined) {
        pass("M9 toast + tour-card cùng lúc modal mở: đo đầy đủ", `${summary} — PHAT HIEN: tour-card che ${m.tourPrimaryOverlap}px2 nut chinh (nut "${m.primaryText}" ${m.primaryRect.w}x${m.primaryRect.h} = ${Math.round(m.primaryRect.w * m.primaryRect.h)}px2) — ${tourStillCoversAfterToast ? "sau khi toast tat, tour VAN che tron nut (hit='" + (m2.hitAtPrimaryCenter ? m2.hitAtPrimaryCenter.text : "?") + "', ngoai dialog) nen nut KHONG bam duoc trong luc tour mo, user phai dong tour truoc" : "sau khi toast tat nut bam duoc tro lai"}; toast che ${m.toastPrimaryOverlap}px2 trong ~4.5s roi tu tat`);
      } else {
        fail("M9 toast + tour-card cùng lúc modal mở: đo đầy đủ", `${summary} — tourObserved=${tourObserved}, toastObserved=${toastObserved}, postToastDetermined=${postToastDetermined} (ky vong ca 3 deu true)`);
      }
    } catch (e) {
      fail("M9 toast + tour-card cùng lúc modal mở: đo đầy đủ", `HARNESS: ${e.message}`);
    } finally {
      await closeModalX(cdp).catch(() => {});
      await ensureNoModal(cdp).catch(() => {});
    }

    // ---- M10: click thật nút chính SilenceModal khi panel FPS đang mở ----
    try {
      await openFpsPanel(cdp);
      await openModalTopBar(cdp, "Cắt lặng", "Cắt khoảng lặng");
      const m = await cdp.evalJs(MODAL_FN("Cắt khoảng lặng", "Phân tích khoảng lặng", 0));
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-m10-panel-open.json"), JSON.stringify(m, null, 2));
      if (!m.primaryRect) throw new Error("không tìm thấy nút 'Phân tích khoảng lặng'");
      // Điểm click: tâm vùng giao nhau panel∩nút (nếu có) — chính là vùng
      // user chạm vào nút sẽ rơi vào panel nếu panel còn trên backdrop.
      let clickPt;
      if (m.panelPrimaryOverlap > 0) {
        const ox = (Math.max(m.panelRect.left, m.primaryRect.left) + Math.min(m.panelRect.right, m.primaryRect.right)) / 2;
        const oy = (Math.max(m.panelRect.top, m.primaryRect.top) + Math.min(m.panelRect.bottom, m.primaryRect.bottom)) / 2;
        clickPt = { x: ox, y: oy, where: `tâm vùng giao nhau panel∩nút (${ox.toFixed(1)}, ${oy.toFixed(1)}), giao nhau ${m.panelPrimaryOverlap}px2` };
      } else {
        clickPt = { x: m.primaryRect.left + m.primaryRect.w / 2, y: m.primaryRect.top + m.primaryRect.h / 2, where: "tâm nút chính (không còn giao nhau panel-nút)" };
      }
      await cdp.click(clickPt.x, clickPt.y);
      // start() chạy → step running ("Đang phân tích…") rồi bridge không chạy
      // (harness này bridge CHƯA dùng cho silence) → lỗi về config. Cả 2
      // đều chứng minh click tới được nút (không rơi vào panel).
      let observed = null;
      for (let i = 0; i < 25 && !observed; i++) {
        const s = await cdp.evalJs(`(() => {
          const dlg = [...document.querySelectorAll('[role="dialog"]')].find((d) => (d.getAttribute("aria-label") || "").includes("Cắt khoảng lặng"));
          if (!dlg) return { modalGone: true };
          const body = (dlg.innerText || "");
          if (body.includes("Đang phân tích") || dlg.querySelector(".silence-running") || body.includes("analyzing")) return { step: "running" };
          const err = dlg.querySelector(".error");
          if (err) return { step: "config-error", error: err.textContent.trim().slice(0, 120) };
          return null;
        })()`).catch(() => null);
        if (s) observed = s;
        else await sleep(200);
      }
      const after = await cdp.evalJs(STATE_FN);
      await cdp.shot("r1-m10-click-panel-open-390-vi.png");
      await drainErrors(cdp);
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-m10-click.json"), JSON.stringify({ measure: m, clickPt, observed, after }, null, 2));
      const clickedButton = observed && (observed.step === "running" || observed.step === "config-error");
      if (clickedButton && after.fpsPanelOpen) {
        pass("M10 click thật nút chính khi panel FPS đang mở: click tới nút", `click tại ${clickPt.where}; sau click: ${observed.step === "running" ? "modal sang buoc running (Dang phan tich…)" : `loi hien trong modal config ("${observed.error}")`} — start() da chay; panel FPS van mo phia duoi (fpsPanelOpen=true), click khong roi vao panel`);
      } else {
        fail("M10 click thật nút chính khi panel FPS đang mở: click tới nút", `click tại ${clickPt.where}; observed=${JSON.stringify(observed)}, fpsPanelOpen sau click=${after.fpsPanelOpen} (ky vong start() chay + panel van mo)`);
      }
    } catch (e) {
      fail("M10 click thật nút chính khi panel FPS đang mở: click tới nút", `HARNESS: ${e.message}`);
    } finally {
      await closeFpsPanel(cdp).catch(() => {});
      await closeModalX(cdp).catch(() => {});
      await ensureNoModal(cdp).catch(() => {});
    }

    // ---- M11: Escape lúc CaptionModal đang ở bước translate (bridge thật) --
    // Lần chạy 2 fail vì (a) nút Captions disabled sau reload (đã sửa bằng
    // chờ enable ở openModalTopBar) và (b) file mặc định mau-1.webm KHÔNG có
    // track audio nên job 1 lỗi FFMPEG_ERROR, không bao giờ tới bước dịch.
    // Lần này dùng file giọng nói thật (TTS local) để job 1 chạy xong rồi
    // mới tới job dịch; poll 150ms vì cửa sổ phase "translating" chỉ ~2–5s
    // (translate.py in phase SAU khi nạp model ~85s, xem LIMITS).
    try {
      await setLang(cdp, "en");
      await setViewport(cdp, 390, 844, true);
      const speech = await cdp.evalJs(SPEECH_FN(BRIDGE_URL), 180000);
      if (!speech || !speech.ok) throw new Error(`không tạo được file giọng nói TTS: ${JSON.stringify(speech)}`);
      log(`file giọng nói TTS sẵn sàng: ${speech.name} (${speech.size || "?"} byte, reused=${!!speech.reused})`);
      let caught = false, phaseAtEscape = null, escapeMs = null, seenPhases = [];
      let finalState = null;
      for (let attempt = 1; attempt <= 2 && !caught; attempt++) {
        await openModalTopBar(cdp, "Captions", "Auto-generate captions");
        const selFile = await cdp.evalJs(SELECT_CAPTION_FILE_FN("r63-speech.wav"));
        if (!selFile || !selFile.found) throw new Error(`không chọn được file r63-speech.wav trong modal (sel=${JSON.stringify(selFile)})`);
        // Chọn đích dịch = en qua select (native setter + change, mẫu R10 E3).
        const setT = await cdp.evalJs(`(() => {
          const dlg = document.querySelector('[role="dialog"]');
          if (!dlg) return null;
          const sels = [...dlg.querySelectorAll("select")];
          const target = sels.find((s) => [...s.options].some((o) => o.value === ""));
          if (!target) return null;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
          setter.call(target, "en");
          target.dispatchEvent(new Event("change", { bubbles: true }));
          return target.value;
        })()`);
        if (setT !== "en") throw new Error(`không chọn được targetLang=en (select value=${setT})`);
        await sleep(400);
        const startBtn = await cdp.evalJs(BTN_RECT_FN("Start generating captions"));
        if (!startBtn || startBtn.disabled) throw new Error(`không bấm được nút Start (startBtn=${JSON.stringify(startBtn)})`);
        const t0 = Date.now();
        const seen = new Set();
        await cdp.click(startBtn.x, startBtn.y);
        let done = null;
        while (Date.now() - t0 < 300000) {
          const st = await cdp.evalJs(`(() => {
            const run = document.querySelector(".caption-running");
            const dlg = document.querySelector('[role="dialog"]');
            if (!dlg) return { modalOpen: false };
            if (run) return { modalOpen: true, running: true, phase: (run.querySelector("b") || {}).textContent || "" };
            if (document.querySelector(".caption-list")) return { modalOpen: true, running: false, step: "review" };
            const err = dlg.querySelector(".error");
            return { modalOpen: true, running: false, step: "config", error: err ? err.textContent.trim().slice(0, 150) : null };
          })()`).catch(() => null);
          if (!st) { await sleep(150); continue; }
          if (!st.modalOpen) { done = { why: "modal tu dong truoc khi Escape" }; break; }
          if (st.running && st.phase) seen.add(st.phase);
          if (st.running && st.phase && st.phase.includes("Translating to English")) {
            escapeMs = Date.now() - t0;
            phaseAtEscape = st.phase;
            await cdp.key("Escape", "Escape");
            caught = true;
            break;
          }
          if (st.step === "review") { done = { why: "job xong truoc khi bat duoc phase translating (review)" }; break; }
          if (st.step === "config" && Date.now() - t0 > 10000) { done = { why: `tro ve config (loi: ${st.error || "?"}) truoc khi dich` }; break; }
          await sleep(150);
        }
        seenPhases = [...seen];
        if (!caught && !done) done = { why: "timeout 300s khong bat duoc phase translating" };
        if (caught) {
          await sleep(1500);
          finalState = await cdp.evalJs(STATE_FN);
          fs.writeFileSync(path.join(SCRATCH, "r1-measure-m11-escape-translate.json"), JSON.stringify({ attempt, escapeMs, phaseAtEscape, seenPhases, finalState }, null, 2));
          await cdp.shot("r1-m11-escape-translate-390-en.png");
          await drainErrors(cdp);
          if (!finalState.captionOpen) {
            pass("M11 Escape lúc CaptionModal đang ở bước translate: modal đóng, job abort", `lan ${attempt}: bam Start -> caption chay ${Math.round(escapeMs / 1000)}s -> phase "${phaseAtEscape}" -> Escape -> modal dong trong 1.5s (captionOpen=false); cac phase da thay: ${seenPhases.map((p) => `"${p}"`).join(" | ")}`);
          } else {
            fail("M11 Escape lúc CaptionModal đang ở bước translate: modal đóng, job abort", `lan ${attempt}: Escape tai phase "${phaseAtEscape}" (${escapeMs}ms) nhung modal VAN MO (step=${finalState.captionStep})`);
          }
        } else {
          log(`M11 lần ${attempt}: ${done.why} — phases đã thấy: ${seenPhases.join(" | ")}; thử lại lần ${attempt + 1}`);
          await ensureNoModal(cdp).catch(() => {});
          if (attempt === 2) {
            fail("M11 Escape lúc CaptionModal đang ở bước translate: modal đóng, job abort", `khong bat duoc phase translating sau 2 lan (lan cuoi: ${done.why}; phases: ${seenPhases.join(" | ")})`);
          }
        }
      }
    } catch (e) {
      fail("M11 Escape lúc CaptionModal đang ở bước translate: modal đóng, job abort", `HARNESS: ${e.message}`);
    } finally {
      await ensureNoModal(cdp).catch(() => {});
    }

    // ---- M12: lỗi timeout pack — sau sửa auto-scroll, lỗi có thấy được? ---
    try {
      await setLang(cdp, "vi");
      await setViewport(cdp, 390, 844, true);
      const hang = await cdp.evalJs(INJECT_HANG_RECORDER);
      log(`HangRecorder: ${hang}`);
      await openModalTopBar(cdp, "Bắt đầu", "Chào mừng");
      const packBtn = await cdp.evalJs(BTN_RECT_FN("Tạo video 1 chạm", "Chào mừng"));
      if (!packBtn) throw new Error("không thấy nút 'Tạo video 1 chạm' trong WelcomeModal");
      await cdp.click(packBtn.x, packBtn.y);
      await cdp.waitFor(async () => {
        const m = await cdp.evalJs(`(() => { const b = document.querySelector(".modal-backdrop"); return b && b.innerText.includes("Template pack") ? true : null; })()`).catch(() => null);
        return m;
      }, "TemplatePackModal mở", 8000);
      // Ghi lại vị trí cuộn TRƯỚC khi bấm tạo (cả .modal lẫn .modal-body —
      // lần chạy 2 đo nhầm .modal nên scrollTop luôn 0; container cuộn thật
      // là .modal-body).
      const scrollBefore = await cdp.evalJs(`(() => { const d = document.querySelector('[role="dialog"]'); if (!d) return null; const b = d.querySelector(".modal-body"); return { modalTop: d.scrollTop, bodyTop: b ? b.scrollTop : null, bodyH: b ? b.scrollHeight : null, bodyCh: b ? b.clientHeight : null }; })()`);
      const introBtn = await cdp.evalJs(`(() => {
        const rows = [...document.querySelectorAll(".pack-row")];
        const row = rows.find((r) => (r.textContent || "").includes("Intro YouTube"));
        if (!row) return null;
        const b = row.querySelector("button.primary");
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled };
      })()`);
      if (!introBtn || introBtn.disabled) throw new Error(`không bấm được nút "Tạo ngay" pack Intro YouTube (${JSON.stringify(introBtn)})`);
      const t0 = Date.now();
      await cdp.click(introBtn.x, introBtn.y);
      let err = null;
      for (let i = 0; i < 80 && !err; i++) {
        const e = await cdp.evalJs(PACK_ERR_FN).catch(() => null);
        if (e && e.errorFound) err = e;
        else await sleep(500);
      }
      const errMs = Date.now() - t0;
      await cdp.shot("r1-m12-pack-timeout-390-vi.png");
      await drainErrors(cdp);
      if (!err) {
        fail("M12 lỗi timeout pack: lỗi vào vùng nhìn thấy (auto-scroll), Escape đóng được", `khong thay loi trong modal sau ${errMs}ms (ky vong ~20000ms)`);
      } else {
        fs.writeFileSync(path.join(SCRATCH, "r1-measure-m12-pack-timeout.json"), JSON.stringify({ errMs, scrollBefore, err }, null, 2));
        // Escape sau lỗi (R10 A2): modal phải đóng được.
        await cdp.key("Escape", "Escape");
        await sleep(1200);
        const afterEsc = await cdp.evalJs(STATE_FN);
        const modalClosed = !afterEsc.dialogs.some((d) => (d || "").includes("Template pack"));
        await ensureNoModal(cdp).catch(() => {});
        if (err.errorFullyVisible && err.errorVisiblePct === 100 && modalClosed) {
          pass("M12 lỗi timeout pack: lỗi vào vùng nhìn thấy (auto-scroll), Escape đóng được", `loi hien sau ${errMs}ms (ky vong ~20000ms): "${err.errorText.slice(0, 80)}…"; loi thay TRON 100% trong modal (top ${err.errorRect.top}–${err.errorRect.bottom} trong modal ${err.modalRect.top}–${err.modalRect.bottom}), .modal-body tu cuon ${scrollBefore.bodyTop} -> ${err.bodyScrollTop} (body scrollHeight ${err.bodyScrollHeight}, clientHeight ${err.bodyClientHeight}); Escape dong duoc modal`);
        } else {
          fail("M12 lỗi timeout pack: lỗi vào vùng nhìn thấy (auto-scroll), Escape đóng được", `loi hien sau ${errMs}ms: fullyVisible=${err.errorFullyVisible}, visiblePct=${err.errorVisiblePct}%, errorRect top ${err.errorRect.top} bottom ${err.errorRect.bottom}, modal ${err.modalRect.top}–${err.modalRect.bottom}, .modal-body scrollTop ${scrollBefore.bodyTop} -> ${err.bodyScrollTop}; Escape dong modal=${modalClosed}`);
        }
      }
      await cdp.evalJs(`(() => { if (window.__realMediaRecorder) window.MediaRecorder = window.__realMediaRecorder; return true; })()`).catch(() => {});
    } catch (e) {
      fail("M12 lỗi timeout pack: lỗi vào vùng nhìn thấy (auto-scroll), Escape đóng được", `HARNESS: ${e.message}`);
    } finally {
      await ensureNoModal(cdp).catch(() => {});
    }

    // ---- M13: phase text caption locale en (bridge thật) -------------------
    // Lần chạy 2: file mặc định mau-1.webm không có track audio → job lỗi
    // FFMPEG_ERROR sau ~1s, chỉ thấy 1 phase. Lần này dùng file giọng nói
    // TTS (đã verify bằng curl: caption chạy hết upload→extract→transcribe
    // →group→done, 2 segments) để job chạy trọn và thu đủ các phase.
    try {
      await setLang(cdp, "en");
      await setViewport(cdp, 390, 844, true);
      const EN_PHASES = ["File received, preparing…", "Extracting audio…", "Recognizing speech (long videos may take a few minutes)…", "Grouping caption lines…", "Translating to English (long videos may take a few minutes)…"];
      const VI_PHASES = ["Đã nhận file, chuẩn bị…", "Đang trích xuất audio…", "Đang nhận diện giọng nói", "Đang gộp câu phụ đề…", "Đang dịch sang tiếng Anh"];
      const speech = await cdp.evalJs(SPEECH_FN(BRIDGE_URL), 180000);
      if (!speech || !speech.ok) throw new Error(`không tạo được file giọng nói TTS: ${JSON.stringify(speech)}`);
      log(`M13: file giọng nói TTS sẵn sàng: ${speech.name} (reused=${!!speech.reused})`);
      await openModalTopBar(cdp, "Captions", "Auto-generate captions");
      const selFile = await cdp.evalJs(SELECT_CAPTION_FILE_FN("r63-speech.wav"));
      if (!selFile || !selFile.found) throw new Error(`không chọn được file r63-speech.wav trong modal (sel=${JSON.stringify(selFile)})`);
      const startBtn = await cdp.evalJs(BTN_RECT_FN("Start generating captions"));
      if (!startBtn || startBtn.disabled) throw new Error(`không bấm được nút Start (startBtn=${JSON.stringify(startBtn)})`);
      const t0 = Date.now();
      const seen = new Set();
      await cdp.click(startBtn.x, startBtn.y);
      let endStep = null, endError = null;
      while (Date.now() - t0 < 180000) {
        const st = await cdp.evalJs(`(() => {
          const run = document.querySelector(".caption-running");
          const dlg = document.querySelector('[role="dialog"]');
          if (!dlg) return { modalOpen: false };
          if (run) return { modalOpen: true, running: true, phase: (run.querySelector("b") || {}).textContent || "" };
          if (document.querySelector(".caption-list")) return { modalOpen: true, running: false, step: "review" };
          const err = dlg.querySelector(".error");
          return { modalOpen: true, running: false, step: "config", error: err ? err.textContent.trim().slice(0, 150) : null };
        })()`).catch(() => null);
        if (!st) { await sleep(500); continue; }
        if (!st.modalOpen) { endStep = "modal-closed"; break; }
        if (st.running && st.phase) seen.add(st.phase);
        if (st.step) { endStep = st.step; endError = st.error || null; break; }
        await sleep(500);
      }
      const seenArr = [...seen];
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-m13-phase-en.json"), JSON.stringify({ seen: seenArr, endStep, endError, ms: Date.now() - t0 }, null, 2));
      await cdp.shot("r1-m13-phase-en-390.png");
      await drainErrors(cdp);
      const seenEn = seenArr.filter((p) => EN_PHASES.includes(p));
      const seenVi = seenArr.filter((p) => VI_PHASES.some((v) => p.includes(v)));
      const seenRawKey = seenArr.filter((p) => p.includes("caption.phase."));
      if (seenEn.length >= 2 && seenVi.length === 0 && seenRawKey.length === 0) {
        pass("M13 phase text caption locale en: chuỗi en, không chuỗi vi, không key thô", `cac phase da thay (${Math.round((Date.now() - t0) / 1000)}s, ket thuc o ${endStep}): ${seenArr.map((p) => `"${p}"`).join(" | ")} — trong do ${seenEn.length} chuoi en hop le, 0 chuoi vi bridge, 0 key tho`);
      } else {
        fail("M13 phase text caption locale en: chuỗi en, không chuỗi vi, không key thô", `cac phase da thay: ${seenArr.map((p) => `"${p}"`).join(" | ")} — en hop le ${seenEn.length} (can >=2), vi ${seenVi.length} (${seenVi.join("; ")}), key tho ${seenRawKey.length} (${seenRawKey.join("; ")}); ket thuc o ${endStep}${endError ? `, loi: "${endError}"` : ""}`);
      }
    } catch (e) {
      fail("M13 phase text caption locale en: chuỗi en, không chuỗi vi, không key thô", `HARNESS: ${e.message}`);
    } finally {
      await ensureNoModal(cdp).catch(() => {});
    }

    // H9: 0 lỗi trang gộp qua các phase.
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua các lần reload + mở/đóng modal)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "r1-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length, at: new Date().toISOString() }, null, 2));
    log(`KẾT QUẢ HEADED R1: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
