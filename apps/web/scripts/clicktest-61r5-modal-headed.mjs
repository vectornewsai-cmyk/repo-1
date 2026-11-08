#!/usr/bin/env node
/**
 * clicktest-61r5-modal-headed.mjs — Phase 9 đợt 61, luồng R5: đóng nợ
 * đợt 60 §5.5 (Q3 CaptionModal) + §5.11 (Q10 Escape).
 *
 * (A) CaptionModal headed thật:
 *   A1a bước RUNNING (bridge thật /api/caption, faster-whisper local):
 *       spinner + nút Huỷ có hiển thị đúng không, nút có tràn/cắt không.
 *   A1b Escape lúc running: handler toàn cục App đóng modal (setCaptionOpen
 *       false) → unmount abort job — đo hành vi thật.
 *   A1c Escape khi focus trong <select> ở bước config: guard App → modal
 *       vẫn mở.
 *   A2 viewport 1280×720 (config + review, vi + en) — đo lại sau sửa Q3.
 *   A3 viewport mobile ~390×844 (config + review vi, config en): modal có
 *       vừa không, nút có tràn không (mobile.css .modal riêng).
 * (B) Escape Q10 headed thật:
 *   B1 Escape khi dropdown native của <select> đang mở (form Picker bước 2):
 *       Escape đóng dropdown hay đóng modal? (probe keydown ghi lại event
 *       có tới được page không — trình duyệt có thể nuốt phím để đóng
 *       dropdown trước khi event tới listener.)
 *   B2 Escape lúc ttsBusy thật (bridge TTS local): modal vẫn mở + ✕ disabled
 *       (guard Q10), sau khi TTS xong Escape đóng được.
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy headed THẬT (vite dev đóng băng + Chromium headed qua Xvfb + CDP,
 * Node thuần, không Playwright), theo mẫu clicktest-60q3-caption-modal.mjs
 * (MEASURE_FN/verdict) + clicktest-60q10-escape-forms.mjs (STATE_FN/flow
 * Picker/Pack). Bridge PHẢI chạy sẵn ở 127.0.0.1:8787 (caption + TTS thật):
 *   CAPTION_PYTHON=server/caption/.venv/bin/python \
 *   TTS_PYTHON=server/tts/.venv2/bin/python \
 *   node server/bridge/src/index.js --port 8787
 * Harness tự kiểm tra /api/health trước khi chạy; bridge chưa chạy → exit 2
 * (harness lỗi, không phải lỗi sản phẩm).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-61r5-modal-headed.mjs
 * Env: R5_DEV_PORT (mặc định tự chọn 5480–5489), R5_DEBUG_PORT (9580–9589),
 * R5_DISPLAY (mặc định :172 — display RIÊNG của R5), R5_SCRATCH (mặc định
 * hidden_files/round61-r5/headed). TMPDIR riêng /tmp/round61-r5/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 * KHÔNG sửa code sản phẩm trong harness này — chỉ đo; sửa ở sampleMedia.ts
 * / templatePack.ts / TemplatePackModal.tsx rồi chạy lại test tĩnh.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R5_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r5", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round61-r5";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r5.config.mjs");
const BRIDGE_URL = "http://127.0.0.1:8787";

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
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP.send timeout 60s: ${method}`));
      }, 60000);
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
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  if (!window.__r5injected) {
    window.__r5injected = true;
    window.__r5errors = [];
    window.addEventListener("error", (e) => { try { window.__r5errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r5errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__r5errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r5errors.push("unhandledrejection: <?>"); } });
    // Probe B1: ghi lại mọi keydown tới được page (capture) — để phân biệt
    // "trình duyệt nuốt Escape để đóng dropdown native" với "guard trả về".
    window.__r5keys = [];
    window.addEventListener("keydown", (e) => { try { window.__r5keys.push(e.key + "@" + (e.target && e.target.tagName ? e.target.tagName : "?")); } catch {} }, true);
  }
  // Boot id: chỉ đặt 1 lần / 1 lần load trang — để waitMounted phân biệt
  // được DOM CŨ (trước reload) với DOM MỚI (sau reload). Lỗi harness đợt
  // chạy 2: afterReload cũ trả về ngay trên DOM cũ (TopBar vẫn có mặt
  // trong lúc Page.reload chưa unload xong) nên openModal tìm nút trên trang
  // đang unload → null.
  window.__r5boot = window.__r5boot || Math.random().toString(36).slice(2);
})()`;

// Fixture SRT VI — cùng câu + mốc với test node P5 (captionsExport59P5).
const SRT_VI =
  "1\n00:00:00,500 --> 00:00:02,000\nXin chào các bạn\n\n" +
  "2\n00:00:02,500 --> 00:00:04,000\nĐây là video thử nghiệm\n";

// Đo hình học modal + mọi nút trong dialog (mẫu Q3, giữ nguyên 5 bất biến).
const MEASURE_FN = `(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return null;
  const mr = dlg.getBoundingClientRect();
  const cs = getComputedStyle(dlg);
  const body = dlg.querySelector(".modal-body");
  const btns = [...dlg.querySelectorAll("button")].map((b) => {
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const tw = b.scrollWidth;
    return {
      text: b.textContent.trim().slice(0, 60),
      cls: b.className,
      rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      clientWidth: b.clientWidth, scrollWidth: b.scrollWidth,
      textFits: b.scrollWidth <= b.clientWidth + 1,
      textRect: { left: +(cx - tw / 2).toFixed(1), right: +(cx + tw / 2).toFixed(1), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1) },
      inActions: !!b.closest(".modal-actions"),
    };
  });
  const actions = btns.filter((b) => b.inActions);
  let overlap = null;
  for (let i = 0; i < actions.length; i++) for (let j = i + 1; j < actions.length; j++) {
    const a = actions[i].textRect, c = actions[j].textRect;
    if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) overlap = actions[i].text + " <-> " + actions[j].text;
  }
  const textOutsideModal = btns.filter((b) => b.textRect.right > mr.right + 1 || b.textRect.left < mr.left - 1).map((b) => b.text);
  const overflowing = btns.filter((b) => !b.textFits).map((b) => b.text + " (" + b.clientWidth + "px hộp, chữ " + b.scrollWidth + "px)");
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    modal: { left: +mr.left.toFixed(1), top: +mr.top.toFixed(1), right: +mr.right.toFixed(1), bottom: +mr.bottom.toFixed(1), w: +mr.width.toFixed(1), h: +mr.height.toFixed(1), maxHeight: cs.maxHeight, overflow: cs.overflow },
    modalFitsViewport: mr.top >= -0.5 && mr.bottom <= window.innerHeight + 0.5,
    body: body ? { scrollHeight: body.scrollHeight, clientHeight: body.clientHeight, overflowY: getComputedStyle(body).overflowY } : null,
    buttons: btns,
    allTextFits: btns.every((b) => b.textFits),
    overflowing,
    noTextOverlap: overlap === null,
    overlap,
    textOutsideModal,
    actionsInViewport: actions.every((b) => b.rect.top >= -0.5 && b.rect.bottom <= window.innerHeight + 0.5),
    actions: actions.map((b) => b.text),
  };
})()`;

// Đo riêng bước RUNNING: spinner + phase + elapsed + nút Huỷ (không có
// .modal-actions ở bước này nên MEASURE_FN thường cho actions rỗng).
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
    return { text: b.textContent.trim(), rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, clientWidth: b.clientWidth, scrollWidth: b.scrollWidth, textFits: b.scrollWidth <= b.clientWidth + 1, disabled: b.disabled, visible: r.width > 0 && r.height > 0 };
  })[0] || null;
  return {
    running: true,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    modal: { top: +mr.top.toFixed(1), bottom: +mr.bottom.toFixed(1), w: +mr.width.toFixed(1), h: +mr.height.toFixed(1) },
    modalFitsViewport: mr.top >= -0.5 && mr.bottom <= window.innerHeight + 0.5,
    spinnerVisible: !!sr && sr.width > 0 && sr.height > 0,
    spinnerRect: sr ? { w: +sr.width.toFixed(1), h: +sr.height.toFixed(1) } : null,
    phaseText: (run.querySelector("b") || {}).textContent || "",
    bodyText: run.innerText.replace(/\\n/g, " | ").slice(0, 200),
    cancel,
    cancelInViewport: cancel ? cancel.rect.top >= -0.5 && cancel.rect.bottom <= window.innerHeight + 0.5 : false,
  };
})()`;

// Tọa độ giữa của nút có text chứa substr (đo thật trên DOM headed).
const BTN_RECT_FN = (substr) => `((s) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(s));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled, rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) } };
})(${JSON.stringify(substr)})`;

// Đưa file SRT vào input import của CaptionModal (mẫu Q3).
const IMPORT_SRT_FN = (ariaLabel) => `(async () => {
  const el = document.querySelector('input[aria-label=${JSON.stringify(ariaLabel)}]');
  if (!el) return { ok: false, reason: "không tìm thấy input import SRT/VTT trong modal" };
  const f = new File([${JSON.stringify(SRT_VI)}], "phu-de-vi.srt", { type: "text/plain" });
  const dt = new DataTransfer();
  dt.items.add(f);
  el.files = dt.files;
  const assigned = el.files.length;
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: true, assigned };
})()`;

// Trạng thái thật trên DOM cho các modal (Q3 + Q10 gộp, thêm caption/tts).
const STATE_FN = `(() => {
  const btn = (txt) => [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === txt);
  const dlg = (labelPart) => [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes(labelPart));
  const capDlg = dlg("phụ đề") || dlg("caption") || dlg("Caption");
  const packDlg = dlg("Template pack");
  const packCloseBtn = packDlg ? packDlg.querySelector('.modal-head button[aria-label="Đóng"]') : null;
  const packRows = packDlg ? [...packDlg.querySelectorAll(".pack-row button")] : [];
  const ttsBtn = packDlg ? [...packDlg.querySelectorAll("button")].find((b) => (b.textContent || "").includes("giọng đọc")) : null;
  return {
    captionOpen: !!capDlg,
    captionRunning: !!document.querySelector(".caption-running"),
    captionPhase: capDlg ? (capDlg.querySelector(".caption-running b") || {}).textContent || "" : "",
    captionStep: capDlg ? (document.querySelector(".caption-running") ? "running" : (document.querySelector(".caption-list") ? "review" : "config")) : "",
    welcome: !!dlg("Chào mừng"),
    tour: !!document.querySelector(".tour-card"),
    pack: !!packDlg,
    packBusy: packDlg ? packRows.some((b) => b.disabled) || (packDlg.innerText || "").includes("Đang tạo media mẫu") : false,
    packDone: packDlg ? !!btn("▶ Xem ngay") : false,
    packCloseDisabled: packCloseBtn ? !!packCloseBtn.disabled : null,
    packTtsBusy: ttsBtn ? !!ttsBtn.disabled && (ttsBtn.textContent || "").includes("Đang tạo") : false,
    packTtsText: ttsBtn ? (ttsBtn.textContent || "").trim().slice(0, 40) : null,
    packText: packDlg ? (packDlg.innerText || "").replace(/\\n/g, " | ").slice(0, 300) : "",
    pickerGallery: !!document.querySelector(".template-grid"),
    pickerForm: !!document.querySelector(".template-form"),
    formSelectFocused: document.activeElement ? document.activeElement.tagName === "SELECT" : false,
    activeTag: document.activeElement ? document.activeElement.tagName + ":" + (document.activeElement.textContent || document.activeElement.value || "").trim().slice(0, 20) : null,
    keysSeen: (window.__r5keys || []).slice(),
    errors: (window.__r5errors || []).slice(),
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

// Kết luận PASS/FAIL cho 1 lần đo hình học + chuỗi mô tả ngắn để log (mẫu Q3).
function verdict(m) {
  const problems = [];
  if (!m) return { ok: false, why: "không đo được modal (dialog không mở?)", summary: "" };
  if (!m.modalFitsViewport) problems.push(`modal vượt viewport (bottom ${m.modal.bottom} > ${m.viewport.h})`);
  if (!m.allTextFits) problems.push(`chữ tràn hộp nút: ${m.overflowing.join("; ")}`);
  if (!m.noTextOverlap) problems.push(`chữ 2 nút chồng nhau: ${m.overlap}`);
  if (m.textOutsideModal.length) problems.push(`chữ vượt khỏi mép modal: ${m.textOutsideModal.join("; ")}`);
  if (!m.actionsInViewport) problems.push("nút action ngoài viewport");
  const summary = `viewport ${m.viewport.w}x${m.viewport.h}, modal ${m.modal.w}x${m.modal.h} top ${m.modal.top} bottom ${m.modal.bottom} (max-height ${m.modal.maxHeight}), body scroll ${m.body ? m.body.scrollHeight + "/" + m.body.clientHeight + " " + m.body.overflowY : "?"}, nút action [${m.actions.join(" | ")}]`;
  return problems.length ? { ok: false, why: problems.join(" || "), summary } : { ok: true, why: "", summary };
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => ["Later", "Để sau", "Skip", "Đóng", "Close"].includes(x.textContent.trim())); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }

  // Chờ app mount (TopBar có mặt + splash tắt). Nếu cho oldBoot thì chờ
  // tới khi boot id ĐỔI — tức trang đã load lại thật, không phải DOM cũ
  // còn sót trong lúc reload (xem chú thích ở INJECT_ERRORS).
  // Lưu ý R5: mobile.css ẩn .brand-name ở <=768px nên innerText của TopBar
  // không còn "VCut Studio" — ở viewport hẹp chỉ cần TopBar có mặt + splash
  // đã tắt là đủ chứng minh mount (lỗi harness đợt chạy 1, không phải lỗi
  // sản phẩm).
  async function waitMounted(cdp, oldBoot) {
    const oldBootJson = JSON.stringify(oldBoot ?? null);
    const boot = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__r5boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  // Reload trang rồi chờ mount mới (ghi oldBoot TRƯỚC khi reload).
  async function reloadPage(cdp) {
    const oldBoot = await cdp.evalJs(`window.__r5boot`).catch(() => null);
    await cdp.send("Page.reload", { ignoreCache: false });
    return waitMounted(cdp, oldBoot);
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r5errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r5errors = []`).catch(() => {});
    return e;
  }

  // Mở CaptionModal bằng chuột thật qua nút TopBar (mẫu Q3: kiểm tra lại
  // overlay ngay trước mỗi cú click, bấm lại tối đa 3 lần).
  async function openModal(cdp, topBtnSubstr, titleSubstr) {
    const topBtnFn = `(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => x.textContent.includes(${JSON.stringify(topBtnSubstr)})); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), visible: r.width > 0 && r.left >= 0 && r.right <= window.innerWidth }; })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await ensureNoModal(cdp);
      const btn = await cdp.evalJs(topBtnFn);
      if (!btn) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" (lần ${attempt})`);
      if (!btn.visible) {
        // Viewport hẹp (mobile): nút có thể nằm ngoài vùng nhìn của TopBar
        // (cuộn ngang) — cuộn nó vào giữa rồi mới bấm chuột thật.
        await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => x.textContent.includes(${JSON.stringify(topBtnSubstr)})); if (b) b.scrollIntoView({ block: "nearest", inline: "center" }); return true; })()`);
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
      }, `CaptionModal mở (tiêu đề ${titleSubstr}, lần ${attempt})`, 8000).catch(() => null);
      if (opened) return { method: btn.visible ? "chuột thật" : "chuột thật sau scrollIntoView" };
      log(`openModal lần ${attempt}: CaptionModal chưa mở — kiểm tra overlay rồi bấm lại`);
      await sleep(1000);
    }
    throw new Error(`timeout chờ CaptionModal mở (tiêu đề ${titleSubstr}) sau 3 lần bấm`);
  }

  // Đo config hoặc review ở viewport hiện tại; trả về {verdict, measure}.
  async function measureStep(cdp, kind, ariaLabel, applySubstr) {
    const m = await cdp.evalJs(MEASURE_FN);
    fs.writeFileSync(path.join(SCRATCH, `r5-measure-${kind}.json`), JSON.stringify(m, null, 2));
    const v = verdict(m);
    await drainErrors(cdp);
    return { m, v };
  }

  // Vào bước review bằng import SRT thật (mẫu Q3): trả về nút Apply để bấm.
  async function gotoReview(cdp, ariaLabel, applySubstr) {
    const delivery = await cdp.evalJs(IMPORT_SRT_FN(ariaLabel));
    if (!delivery.ok) throw new Error(`import SRT thất bại: ${delivery.reason}`);
    const applyBtn = await cdp.waitFor(async () => {
      const b = await cdp.evalJs(BTN_RECT_FN(applySubstr)).catch(() => null);
      return b && !b.disabled ? b : null;
    }, `nút ${applySubstr} xuất hiện sau import (bước review)`, 30000);
    return applyBtn;
  }

  // Đặt viewport qua Emulation rồi reload để app + CSS nhận đúng viewport
  // (media query mobile.css @media (max-width: 768px) cần viewport thật).
  async function setViewport(cdp, w, h, mobile) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile: !!mobile,
    });
    await reloadPage(cdp);
    const vp = await cdp.evalJs(`({ w: window.innerWidth, h: window.innerHeight })`);
    log(`viewport đặt ${w}x${h} mobile=${!!mobile} → thực ${vp.w}x${vp.h}`);
    return vp;
  }
  async function clearViewport(cdp) {
    await cdp.send("Emulation.clearDeviceMetricsOverride");
    await reloadPage(cdp);
  }

  try {
    // Preflight: bridge PHẢI chạy (caption + TTS thật). Chưa chạy → exit 2.
    try {
      const h = await fetch(BRIDGE_URL + "/api/health");
      const j = await h.json();
      if (!j.caption || !j.caption.available) throw new Error("bridge trả health nhưng caption không available");
      log(`bridge OK: ${BRIDGE_URL} (caption available, ffmpeg=${j.ffmpeg})`);
    } catch (e) {
      throw new Error(`bridge chưa chạy ở ${BRIDGE_URL} (cần cho A1/B2): ${e.message}`);
    }

    const DEV_PORT = Number(process.env.R5_DEV_PORT || 0) || (await pickFreePort(5480, 5489));
    const DEBUG_PORT = Number(process.env.R5_DEBUG_PORT || 0) || (await pickFreePort(9580, 9589));
    const DISPLAY = process.env.R5_DISPLAY || ":172";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5480–5489");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9580–9589");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (R5 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round61-r5/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r5-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r5-chrome.log"), "w");
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

    // ---- R0: setup vi + mount + mẫu tự load ---------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount lần đầu (locale vi mặc định)", 240000);
    const boot0 = await waitMounted(cdp, null);
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(`(async () => {
        const entries = performance.getEntriesByType("resource").map((e) => e.name);
        const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
        const mod = window.__r5storeMod || (window.__r5storeMod = await import(hit));
        const st = mod.useStore.getState();
        return { clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0), mediaCount: st.media.length, labels: st.spec.tracks.map((t) => t.label), mediaKinds: st.media.map((m) => m.kind + ":" + (m.file ? "file" : "nofile")) };
      })()`).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
    }, "project mẫu tự load (3 clip, media bin 2 item) dưới locale vi", 180000);
    const captionsBtn = await cdp.evalJs(BTN_RECT_FN("Phụ đề"));
    const bootStable0 = (await cdp.evalJs(`window.__r5boot`).catch(() => null)) === boot0;
    await drainErrors(cdp);
    if (bootStable0 && s0 && captionsBtn && !captionsBtn.disabled) {
      pass("R0 setup: locale vi + mẫu tự load + nút Phụ đề", `boot ổn định, 3 clip (labels ${JSON.stringify(s0.labels)}), media [${s0.mediaKinds.join(", ")}], nút TopBar "${captionsBtn.text}" tại (${captionsBtn.x.toFixed(0)}, ${captionsBtn.y.toFixed(0)})`);
    } else {
      fail("R0 setup: locale vi + mẫu tự load + nút Phụ đề", `boot ổn định=${bootStable0}, captionsBtn=${JSON.stringify(captionsBtn)}, state=${JSON.stringify(s0)}`);
    }

    // ---- A1a: bước RUNNING vi @1440×900 (caption thật qua bridge) ------
    {
      const opened = await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
      // Bấm Start bằng chuột thật → bước running hiện ngay (job chạy nền).
      const startBtn = await cdp.evalJs(BTN_RECT_FN("Bắt đầu tạo phụ đề"));
      if (!startBtn || startBtn.disabled) {
        fail("A1a running vi: spinner + nút Huỷ hiển thị đúng, không tràn/cắt", `không bấm được nút Start (startBtn=${JSON.stringify(startBtn)}) — có thể không có media caption được`);
      } else {
        const tStart = Date.now();
        await cdp.click(startBtn.x, startBtn.y);
        // Poll nhanh (200ms): cửa sổ running của clip mẫu không lời chỉ
        // ~10s (model load + transcribe rồi lỗi "không nhận diện được từ
        // nào" — đã đo bằng curl trước: 9.9s), phải đo ngay khi thấy.
        let run = null;
        for (let i = 0; i < 150; i++) {
          const s = await cdp.evalJs(`(document.querySelector(".caption-running") ? true : null)`);
          if (s) { run = await cdp.evalJs(RUNNING_FN); break; }
          await sleep(200);
        }
        const elapsedMs = Date.now() - tStart;
        if (!run || !run.running) {
          const st = await cdp.evalJs(STATE_FN).catch(() => ({}));
          fail("A1a running vi: spinner + nút Huỷ hiển thị đúng, không tràn/cắt", `không bắt được bước running sau ${elapsedMs}ms (captionStep=${st.captionStep}, modal mở=${st.captionOpen}) — job có thể xong/lỗi trước khi poll kịp`);
        } else {
          fs.writeFileSync(path.join(SCRATCH, "r5-measure-running-vi.json"), JSON.stringify(run, null, 2));
          await cdp.shot("r5-running-vi.png");
          const problems = [];
          if (!run.spinnerVisible) problems.push("spinner không hiển thị (0×0)");
          if (!run.phaseText) problems.push("không có phase text");
          if (!run.cancel) problems.push("không thấy nút Huỷ");
          else {
            if (!run.cancel.textFits) problems.push(`nút Huỷ tràn chữ (${run.cancel.clientWidth}px hộp, chữ ${run.cancel.scrollWidth}px)`);
            if (!run.cancel.visible) problems.push("nút Huỷ không nhìn thấy");
            if (!run.cancelInViewport) problems.push("nút Huỷ ngoài viewport");
          }
          if (!run.modalFitsViewport) problems.push(`modal vượt viewport (bottom ${run.modal.bottom} > ${run.viewport.h})`);
          await drainErrors(cdp);
          if (problems.length) fail("A1a running vi: spinner + nút Huỷ hiển thị đúng, không tràn/cắt", `${problems.join(" || ")} — đo sau ${elapsedMs}ms từ lúc bấm Start, phase="${run.phaseText}", body="${run.bodyText}"`);
          else pass("A1a running vi: spinner + nút Huỷ hiển thị đúng, không tràn/cắt", `đo sau ${elapsedMs}ms từ lúc bấm Start (mở bằng ${opened.method}), phase="${run.phaseText}", spinner ${run.spinnerRect.w}×${run.spinnerRect.h}, nút Huỷ "${run.cancel.text}" ${run.cancel.rect.w}×${run.cancel.rect.h}, modal ${run.modal.w}×${run.modal.h} top ${run.modal.top} bottom ${run.modal.bottom}`);
          // ---- A1b: Escape lúc running → modal ĐÓNG (handler App), job abort.
          await cdp.key("Escape", "Escape");
          const afterEsc = await cdp.evalJs(STATE_FN);
          await drainErrors(cdp);
          if (!afterEsc.captionOpen) pass("A1b Escape lúc running: modal đóng, job bị abort", `sau Escape: captionOpen=false (App setCaptionOpen(false) → unmount abort fetch); 0 lỗi trang ở phase này`);
          else fail("A1b Escape lúc running: modal đóng, job bị abort", `sau Escape modal VẪN MỞ (captionStep=${afterEsc.captionStep}, phase="${afterEsc.captionPhase}") — khác với hành vi App đóng modal ở config/review`);
          await cdp.shot("r5-running-after-escape.png");
          await ensureNoModal(cdp);
        }
      }
    }

    // ---- A1c: Escape khi focus trong <select> ở bước config → modal ở lại.
    {
      await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
      const focused = await cdp.evalJs(`(() => { const s = document.querySelector('[role="dialog"] select'); if (!s) return false; s.focus(); return document.activeElement === s; })()`);
      await cdp.key("Escape", "Escape");
      const st = await cdp.evalJs(STATE_FN);
      await drainErrors(cdp);
      if (focused && st.captionOpen) pass("A1c Escape khi focus trong select (config): guard App — modal vẫn mở", `focus select=${focused}, sau Escape captionOpen=true (target SELECT nên handler App bỏ qua)`);
      else fail("A1c Escape khi focus trong select (config): guard App — modal vẫn mở", `focus select=${focused}, sau Escape captionOpen=${st.captionOpen}`);
      // Đóng bằng ✕ để sang phase sau.
      const xBtn = await cdp.evalJs(`(( ) => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (xBtn) await cdp.click(xBtn.x, xBtn.y);
      await ensureNoModal(cdp);
    }

    // ---- A2: viewport 1280×720 — config + review, vi + en ---------------
    {
      await setViewport(cdp, 1280, 720, false);
      // config vi
      await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
      {
        const { v } = await measureStep(cdp, "config-1280-vi", "", "");
        if (v.ok) pass("A2a config vi @1280×720: nút không tràn/chồng, modal vừa viewport", v.summary);
        else fail("A2a config vi @1280×720: nút không tràn/chồng, modal vừa viewport", `${v.why} — ${v.summary}`);
        await cdp.shot("r5-config-1280-vi.png");
      }
      // review vi
      {
        const applyBtn = await gotoReview(cdp, "Nhập file SRT hoặc VTT", "Áp dụng 2 câu");
        const { v } = await measureStep(cdp, "review-1280-vi", "", "");
        if (v.ok) pass("A2b review vi @1280×720: nút không tràn/chồng, modal vừa viewport", v.summary);
        else fail("A2b review vi @1280×720: nút không tràn/chồng, modal vừa viewport", `${v.why} — ${v.summary}`);
        await cdp.shot("r5-review-1280-vi.png");
        await cdp.click(applyBtn.x, applyBtn.y);
        await cdp.waitFor(async () => {
          const s = await cdp.evalJs(STATE_FN).catch(() => null);
          return s && !s.captionOpen ? true : null;
        }, "modal đóng sau Apply @1280", 30000).catch(() => log("A2b: Apply xong nhưng modal chưa đóng sau 30s (không fail case đo hình học)"));
        await ensureNoModal(cdp);
      }
      // en: đổi locale + reload (viewport 1280×720 giữ nguyên).
      await cdp.evalJs(`localStorage.setItem("vcut-lang", "en")`);
      await reloadPage(cdp);
      await openModal(cdp, "Captions", "Auto-generate captions");
      {
        const { v } = await measureStep(cdp, "config-1280-en", "", "");
        if (v.ok) pass("A2c config en @1280×720: nút không tràn/chồng, modal vừa viewport", v.summary);
        else fail("A2c config en @1280×720: nút không tràn/chồng, modal vừa viewport", `${v.why} — ${v.summary}`);
        await cdp.shot("r5-config-1280-en.png");
      }
      {
        const applyBtn = await gotoReview(cdp, "Import an SRT or VTT file", "Apply 2 caption");
        const { v } = await measureStep(cdp, "review-1280-en", "", "");
        if (v.ok) pass("A2d review en @1280×720: nút không tràn/chồng, modal vừa viewport", v.summary);
        else fail("A2d review en @1280×720: nút không tràn/chồng, modal vừa viewport", `${v.why} — ${v.summary}`);
        await cdp.shot("r5-review-1280-en.png");
        const xBtn = await cdp.evalJs(`(( ) => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
        if (xBtn) await cdp.click(xBtn.x, xBtn.y);
        await ensureNoModal(cdp);
        void applyBtn;
      }
      // Về lại vi cho các phase sau.
      await cdp.evalJs(`localStorage.setItem("vcut-lang", "vi")`);
    }

    // ---- A3: viewport mobile 390×844 — config + review vi, config en ----
    {
      await setViewport(cdp, 390, 844, true);
      await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
      {
        const { v } = await measureStep(cdp, "config-390-vi", "", "");
        if (v.ok) pass("A3a config vi @390×844 mobile: nút không tràn/chồng, modal vừa viewport", v.summary);
        else fail("A3a config vi @390×844 mobile: nút không tràn/chồng, modal vừa viewport", `${v.why} — ${v.summary}`);
        await cdp.shot("r5-config-390-vi.png");
      }
      {
        const applyBtn = await gotoReview(cdp, "Nhập file SRT hoặc VTT", "Áp dụng 2 câu");
        const { v } = await measureStep(cdp, "review-390-vi", "", "");
        if (v.ok) pass("A3b review vi @390×844 mobile: nút không tràn/chồng, modal vừa viewport", v.summary);
        else fail("A3b review vi @390×844 mobile: nút không tràn/chồng, modal vừa viewport", `${v.why} — ${v.summary}`);
        await cdp.shot("r5-review-390-vi.png");
        const xBtn = await cdp.evalJs(`(( ) => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
        if (xBtn) await cdp.click(xBtn.x, xBtn.y);
        await ensureNoModal(cdp);
        void applyBtn;
      }
      // config en mobile (chuỗi en dài hơn — ca khó tràn nhất).
      await cdp.evalJs(`localStorage.setItem("vcut-lang", "en")`);
      await reloadPage(cdp);
      await openModal(cdp, "Captions", "Auto-generate captions");
      {
        const { v } = await measureStep(cdp, "config-390-en", "", "");
        if (v.ok) pass("A3c config en @390×844 mobile: nút không tràn/chồng, modal vừa viewport", v.summary);
        else fail("A3c config en @390×844 mobile: nút không tràn/chồng, modal vừa viewport", `${v.why} — ${v.summary}`);
        await cdp.shot("r5-config-390-en.png");
      }
      const xBtn2 = await cdp.evalJs(`(( ) => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      if (xBtn2) await cdp.click(xBtn2.x, xBtn2.y);
      await ensureNoModal(cdp);
      await cdp.evalJs(`localStorage.setItem("vcut-lang", "vi")`);
      // Về lại viewport desktop cho phase B.
      await clearViewport(cdp);
    }

    // ---- B1: Escape khi dropdown native của <select> đang mở ------------
    {
      // Mở TemplatePicker → card đầu (Bìa album) → form bước 2.
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("title") === "Tạo project mới từ 10 mẫu video có sẵn (intro, outro, TikTok, slideshow...)"); if (!b) throw new Error("không thấy nút TopBar Mẫu"); b.click(); return true; })()`);
      await cdp.waitFor(async () => { const s = await cdp.evalJs(STATE_FN).catch(() => null); return s && s.pickerGallery ? s : null; }, "TemplatePicker gallery hiện", 30000);
      await cdp.evalJs(`(() => { const c = document.querySelector(".template-card"); if (!c) throw new Error("không thấy .template-card"); c.click(); return true; })()`);
      await cdp.waitFor(async () => { const s = await cdp.evalJs(STATE_FN).catch(() => null); return s && s.pickerForm ? s : null; }, "TemplatePicker form bước 2 hiện", 30000);
      // Mở dropdown native bằng chuột thật lên select đầu tiên.
      const selRect = await cdp.evalJs(`(() => { const s = document.querySelector(".template-form select"); if (!s) return null; const r = s.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; })()`);
      if (!selRect) {
        fail("B1 Escape khi dropdown select đang mở: modal vẫn mở", "không tìm thấy select trong form bước 2");
      } else {
        await cdp.evalJs(`window.__r5keys = []`);
        await cdp.click(selRect.x, selRect.y);
        await sleep(800);
        await cdp.shot("r5-picker-dropdown-open.png");
        const before = await cdp.evalJs(STATE_FN);
        // Lưu ý trung thực: dropdown native là cửa sổ riêng của trình duyệt,
        // Page.captureScreenshot KHÔNG chụp được nó; trạng thái "đang mở" chỉ
        // suy ra từ: click thật vào select + select đang focus. Probe keydown
        // cho biết Escape có tới được page không.
        await cdp.key("Escape", "Escape");
        const after1 = await cdp.evalJs(STATE_FN);
        await cdp.shot("r5-picker-after-escape1.png");
        const keysAfter1 = after1.keysSeen;
        const modalStillOpen = !after1.pickerGallery && after1.pickerForm;
        const escReachedPage = keysAfter1.some((k) => k.startsWith("Escape@"));
        const escTarget = keysAfter1.find((k) => k.startsWith("Escape@")) || "không tới page (trình duyệt nuốt để đóng dropdown)";
        log(`B1 sau Escape #1 (dropdown đang mở): modal mở=${modalStillOpen}, keydown tới page=${escReachedPage} (${escTarget}), focus=${after1.activeTag}`);
        if (modalStillOpen) pass("B1 Escape khi dropdown select đang mở: modal vẫn mở (không đóng nhầm)", `Escape #1: modal vẫn mở; keydown ${escReachedPage ? `tới page (${escTarget}) → guard SELECT trả về` : "KHÔNG tới page → trình duyệt nuốt để đóng dropdown native"}; focus sau đó=${after1.activeTag}`);
        else fail("B1 Escape khi dropdown select đang mở: modal vẫn mở (không đóng nhầm)", `Escape #1 ĐÓNG modal (gallery=${after1.pickerGallery} form=${after1.pickerForm}) — sai với quyết định Q10; keydown: ${escTarget}`);
        // Escape #2 sau khi dropdown đã đóng: focus vẫn ở select → guard
        // vẫn chặn (đúng Q10). Focus sang nút rồi Escape → modal phải đóng.
        const focusedBtn = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "Tạo project từ mẫu"); if (!b) return false; b.focus(); return document.activeElement === b; })()`);
        await cdp.key("Escape", "Escape");
        const after2 = await cdp.evalJs(STATE_FN);
        await drainErrors(cdp);
        if (focusedBtn && !after2.pickerGallery && !after2.pickerForm) pass("B1b Escape sau khi dropdown đã đóng (focus ở nút): modal đóng hẳn", "focus nút \"Tạo project từ mẫu\" → Escape đóng hẳn modal (Q10), chứng tỏ Escape #1 chỉ tác động dropdown/guard chứ không làm hỏng handler");
        else fail("B1b Escape sau khi dropdown đã đóng (focus ở nút): modal đóng hẳn", `focus nút=${focusedBtn}, sau Escape #2 gallery=${after2.pickerGallery} form=${after2.pickerForm}`);
        await cdp.shot("r5-picker-after-escape2.png");
        await ensureNoModal(cdp);
        void before;
      }
    }

    // ---- B2: Escape lúc ttsBusy thật (bridge TTS) ------------------------
    {
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("title") === "Mở lại màn chào / tour / template pack 1 chạm"); if (!b) throw new Error("không thấy nút TopBar mở lại welcome"); b.click(); return true; })()`);
      await cdp.waitFor(async () => { const s = await cdp.evalJs(STATE_FN).catch(() => null); return s && s.welcome ? s : null; }, "WelcomeModal mở lại từ TopBar", 30000);
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === "⚡ Tạo video 1 chạm"); if (!b) throw new Error('không thấy nút "⚡ Tạo video 1 chạm"'); b.click(); return true; })()`);
      await cdp.waitFor(async () => { const s = await cdp.evalJs(STATE_FN).catch(() => null); return s && s.pack && !s.welcome ? s : null; }, "TemplatePackModal hiện", 30000);
      const clickedPack2 = await cdp.evalJs(`(() => { const rows = [...document.querySelectorAll(".pack-row")]; if (rows.length < 2) throw new Error("không đủ pack-row, chỉ có " + rows.length); const b = rows[1].querySelector("button"); if (!b) throw new Error("pack-row 2 không có nút"); b.click(); return rows[1].innerText.slice(0, 40); })()`);
      log(`B2 đã bấm tạo pack thứ 2: ${clickedPack2}`);
      await cdp.waitFor(async () => { const s = await cdp.evalJs(STATE_FN).catch(() => null); return s && s.packDone ? s : null; }, "PackModal tạo xong (nút Xem ngay hiện)", 180000);
      log("B2 pack đã tạo xong, bấm tạo giọng đọc mẫu");
      const ttsClicked = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").includes("Tạo giọng đọc mẫu")); if (!b) return false; b.click(); return true; })()`);
      if (!ttsClicked) {
        fail("B2 Escape lúc ttsBusy: modal vẫn mở + ✕ disabled", "không thấy nút tạo giọng đọc mẫu sau khi pack xong");
      } else {
        // Đợi ttsBusy xuất hiện (poll 200ms, tối đa 30s).
        let ttsBusySeen = null;
        for (let i = 0; i < 150; i++) {
          const st = await cdp.evalJs(STATE_FN).catch(() => null);
          if (st && st.packTtsBusy) { ttsBusySeen = st; break; }
          await sleep(200);
        }
        if (!ttsBusySeen) {
          const st = await cdp.evalJs(STATE_FN).catch(() => ({}));
          fail("B2 Escape lúc ttsBusy: modal vẫn mở + ✕ disabled", `không bắt được ttsBusy (packText=${(st.packText || "").slice(0, 160)}) — TTS có thể xong quá nhanh hoặc lỗi ngay`);
        } else {
          log(`B2 ttsBusy bắt được: ttsText="${ttsBusySeen.packTtsText}" closeDisabled=${ttsBusySeen.packCloseDisabled}`);
          await cdp.shot("r5-pack-ttsbusy-before-escape.png");
          await cdp.key("Escape", "Escape");
          const afterBusyEsc = await cdp.evalJs(STATE_FN);
          await drainErrors(cdp);
          log(`B2 sau Escape lúc ttsBusy: pack=${afterBusyEsc.pack} closeDisabled=${afterBusyEsc.packCloseDisabled} ttsBusy=${afterBusyEsc.packTtsBusy}`);
          if (afterBusyEsc.pack && afterBusyEsc.packCloseDisabled === true) pass("B2 Escape lúc ttsBusy: modal vẫn mở + ✕ disabled", `sau Escape: pack=true, nút ✕ disabled=true (guard Q10 chặn cả 3 đường đóng lúc ttsBusy); ttsText="${afterBusyEsc.packTtsText}"`);
          else fail("B2 Escape lúc ttsBusy: modal vẫn mở + ✕ disabled", `sau Escape: pack=${afterBusyEsc.pack} closeDisabled=${afterBusyEsc.packCloseDisabled} (cần pack=true + ✕ disabled)`);
          await cdp.shot("r5-pack-ttsbusy-after-escape.png");
          // Đợi TTS xong (ttsBusy hết, tối đa 300s — lần đầu load model),
          // rồi Escape → modal phải đóng (mở khóa).
          const ttsDone = await cdp.waitFor(async () => {
            const s = await cdp.evalJs(STATE_FN).catch(() => null);
            return s && s.pack && !s.packTtsBusy && s.packDone ? s : null;
          }, "TTS xong (ttsBusy hết, vẫn ở màn done)", 300000).catch(() => null);
          if (!ttsDone) {
            const st = await cdp.evalJs(STATE_FN).catch(() => ({}));
            fail("B2b Escape sau khi TTS xong: modal đóng (mở khóa)", `chờ TTS xong timeout 300s (packText=${(st.packText || "").slice(0, 200)})`);
          } else {
            log(`B2 TTS xong: packText="${ttsDone.packText.slice(0, 200)}"`);
            await cdp.shot("r5-pack-ttsdone-before-escape.png");
            await cdp.key("Escape", "Escape");
            const afterDoneEsc = await cdp.evalJs(STATE_FN);
            await drainErrors(cdp);
            if (!afterDoneEsc.pack) pass("B2b Escape sau khi TTS xong: modal đóng (mở khóa)", `sau Escape: pack=false — modal mở khóa đúng sau khi ttsBusy reset; ttsMsg trong packText trước khi đóng: "${ttsDone.packText.slice(0, 160)}"`);
            else fail("B2b Escape sau khi TTS xong: modal đóng (mở khóa)", `sau Escape pack VẪN MỞ (packText=${(afterDoneEsc.packText || "").slice(0, 160)})`);
          }
          await ensureNoModal(cdp);
        }
      }
    }

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua 3 lần reload + caption + pack + TTS)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "r5-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED R5: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
