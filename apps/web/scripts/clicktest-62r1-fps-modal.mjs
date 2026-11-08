#!/usr/bin/env node
/**
 * clicktest-62r1-fps-modal.mjs — Phase 9 đợt 62, luồng R1: bug FPS pill đè
 * footer modal bottom-sheet ở mobile (nợ đợt 61 §5.1, LIMITS R5).
 *
 * Bug: PerfOverlay pill "📈 FPS" (position: fixed, z-index 300, luôn mount
 * trong App) cao hơn .modal-backdrop (z-index 100). Ở desktop modal căn
 * giữa nên không chạm nhau; ở mobile modal là bottom-sheet (đáy = đáy
 * viewport) nên pill đè lên góc phải footer, che đuôi nút chính
 * (screenshot r5-config-390-vi.png: "Bắt đầu tạo p…").
 *
 * Đo (KHÔNG cần bridge — chỉ mở CaptionModal bước config, không bấm Start
 * chạy caption thật; F5 bấm chuột thật vào nút chính để chứng minh click
 * đi tới đâu). Tiêu chí verdict: elementFromPoint (phần tử trên cùng
 * THẬT tại điểm đó), KHÔNG phải diện tích giao nhau hình học — sau sửa,
 * pill/panel vẫn chiếm cùng tọa độ (giao hình học còn nguyên) nhưng nằm
 * DƯỚI backdrop nên không nhìn thấy, không nhận click; diện tích giao
 * nhau chỉ ghi lại để theo dõi, không fail:
 *   F0 baseline @390×844, modal ĐÓNG: pill bấm được (elementFromPoint tại
 *       tâm pill trả về chính pill) + ghi z-index thật của backdrop/pill.
 *   F1 config vi @390×844: diện tích giao nhau pill ∩ nút chính +
 *       elementFromPoint tại tâm nút chính (phải là nút, không phải pill).
 *   F2 config en @390×844: như F1 (chuỗi en dài hơn — ca khó nhất).
 *   F3 config vi @1280×720: như F1 (desktop — kỳ vọng không giao nhau
 *       cả trước lẫn sau sửa; khóa hồi quy desktop).
 *   F4 panel FPS đang MỞ + modal mở @390×844: elementFromPoint tại tâm
 *       panel phải là backdrop/modal (panel nằm DƯỚI backdrop sau sửa),
 *       không phải panel.
 *   F5 click chuột thật vào tâm nút chính @390×844: trước sửa click rơi
 *       vào pill → panel FPS mở; sau sửa click tới nút chính → panel
 *       KHÔNG mở (modal vẫn mở, bước config rời đi hoặc báo lỗi bridge —
 *       bridge không chạy trong harness này nên Start sẽ lỗi sạch, modal
 *       vẫn mở; chỉ khẳng định click không rơi vào pill).
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy headed THẬT (vite dev đóng băng + Chromium headed qua Xvfb + CDP,
 * Node thuần, không Playwright), theo mẫu clicktest-61r5-modal-headed.mjs.
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-62r1-fps-modal.mjs
 * Env: R1_DEV_PORT (mặc định tự chọn 5490–5499), R1_DEBUG_PORT (9590–9599),
 * R1_DISPLAY (mặc định :173 — display RIÊNG của R1), R1_SCRATCH (mặc định
 * hidden_files/round62-r1/headed). TMPDIR riêng /tmp/round62-r1/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 * KHÔNG sửa code sản phẩm trong harness này — chỉ đo.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R1_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round62-r1", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round62-r1";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r1.config.mjs");

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
  if (!window.__r1injected) {
    window.__r1injected = true;
    window.__r1errors = [];
    window.addEventListener("error", (e) => { try { window.__r1errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r1errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__r1errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r1errors.push("unhandledrejection: <?>"); } });
  }
  window.__r1boot = window.__r1boot || Math.random().toString(36).slice(2);
})()`;

// Đo chồng lấn FPS pill/panel với nút chính của modal + elementFromPoint.
// primarySubstr: chuỗi nhận diện nút chính ("Bắt đầu tạo phụ đề" /
// "Start generating captions"). Trả null khi không có modal mở.
const FPS_FN = (primarySubstr) => `(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { left: +b.left.toFixed(1), top: +b.top.toFixed(1), right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const describe = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { tag: el.tagName, cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().slice(0, 40), text: (el.textContent || "").trim().slice(0, 40), inDialog: !!el.closest('[role="dialog"]'), isBackdrop: el.classList.contains("modal-backdrop"), isPill: pill ? el === pill : false, inPanel: panel ? panel.contains(el) : false, cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) };
  };
  const overlapArea = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? +(w * h).toFixed(1) : 0;
  };
  const dlg = document.querySelector('[role="dialog"]');
  const backdrop = document.querySelector(".modal-backdrop");
  const pill = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("FPS") && !b.closest('[role="dialog"]'));
  const panel = [...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview")) || null;
  const primary = dlg ? [...dlg.querySelectorAll(".modal-actions button")].find((b) => (b.textContent || "").includes(${JSON.stringify(primarySubstr)})) : null;
  const overlapCenter = (a, b) => {
    const x0 = Math.max(a.left, b.left), x1 = Math.min(a.right, b.right);
    const y0 = Math.max(a.top, b.top), y1 = Math.min(a.bottom, b.bottom);
    return (x1 > x0 && y1 > y0) ? { x: (x0 + x1) / 2, y: (y0 + y1) / 2 } : null;
  };
  const out = {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    modalOpen: !!dlg,
    backdropZ: backdrop ? getComputedStyle(backdrop).zIndex : null,
    pillZ: pill ? getComputedStyle(pill).zIndex : null,
    panelZ: panel ? getComputedStyle(panel).zIndex : null,
    pillRect: pill ? r(pill) : null,
    panelRect: panel ? r(panel) : null,
    primaryRect: primary ? r(primary) : null,
    primaryDisabled: primary ? !!primary.disabled : null,
    pillPrimaryOverlap: pill && primary ? overlapArea(r(pill), r(primary)) : 0,
    panelPrimaryOverlap: panel && primary ? overlapArea(r(panel), r(primary)) : 0,
    hitAtPrimaryCenter: null, hitAtPillCenter: null, hitAtPanelCenter: null,
    hitAtPillOverlapCenter: null, hitAtPanelOverlapCenter: null,
  };
  if (primary) {
    const pr = r(primary);
    out.hitAtPrimaryCenter = describe(document.elementFromPoint(pr.left + pr.w / 2, pr.top + pr.h / 2));
  }
  if (pill) {
    const pr = r(pill);
    out.hitAtPillCenter = describe(document.elementFromPoint(pr.left + pr.w / 2, pr.top + pr.h / 2));
  }
  if (panel) {
    const pr = r(panel);
    out.hitAtPanelCenter = describe(document.elementFromPoint(pr.left + pr.w / 2, pr.top + pr.h / 2));
  }
  if (pill && primary) {
    const c = overlapCenter(r(pill), r(primary));
    if (c) out.hitAtPillOverlapCenter = describe(document.elementFromPoint(c.x, c.y));
  }
  if (panel && primary) {
    const c = overlapCenter(r(panel), r(primary));
    if (c) out.hitAtPanelOverlapCenter = describe(document.elementFromPoint(c.x, c.y));
  }
  return out;
})()`;

const BTN_RECT_FN = (substr) => `((s) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(s));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled, rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) } };
})(${JSON.stringify(substr)})`;

const STATE_FN = `(() => {
  const dlg = (labelPart) => [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes(labelPart));
  const capDlg = dlg("phụ đề") || dlg("caption") || dlg("Caption");
  return {
    captionOpen: !!capDlg,
    captionStep: capDlg ? (document.querySelector(".caption-running") ? "running" : (document.querySelector(".caption-list") ? "review" : "config")) : "",
    fpsPanelOpen: !!([...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview"))),
    errors: (window.__r1errors || []).slice(),
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

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

  async function openModal(cdp, topBtnSubstr, titleSubstr) {
    const topBtnFn = `(() => { const b = [...document.querySelectorAll("header.topbar button")].find((x) => x.textContent.includes(${JSON.stringify(topBtnSubstr)})); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), visible: r.width > 0 && r.left >= 0 && r.right <= window.innerWidth }; })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await ensureNoModal(cdp);
      const btn = await cdp.evalJs(topBtnFn);
      if (!btn) throw new Error(`không tìm thấy nút TopBar "${topBtnSubstr}" (lần ${attempt})`);
      if (!btn.visible) {
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
      log(`openModal lần ${attempt}: CaptionModal chưa mở — bấm lại`);
      await sleep(1000);
    }
    throw new Error(`timeout chờ CaptionModal mở (tiêu đề ${titleSubstr}) sau 3 lần bấm`);
  }

  async function closeModalX(cdp) {
    const xBtn = await cdp.evalJs(`(( ) => { const b = document.querySelector('[role="dialog"] .modal-head .icon-btn'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (xBtn) await cdp.click(xBtn.x, xBtn.y);
    await ensureNoModal(cdp);
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
  async function clearViewport(cdp) {
    await cdp.send("Emulation.clearDeviceMetricsOverride");
    await reloadPage(cdp);
  }

  // Kết luận cho 1 lần đo FPS vs nút chính khi modal mở.
  // Tiêu chí ĐÚNG (sửa sau lần chạy headed đầu tiên post-fix): diện tích
  // giao nhau hình học (rect ∩) KHÔNG còn là lỗi khi pill/panel nằm DƯỚI
  // backdrop — nó vẫn chiếm cùng tọa độ nhưng bị backdrop che, không nhìn
  // thấy, không nhận click. Cái quyết định là elementFromPoint (phần tử
  // trên cùng thật tại điểm đó): tâm nút chính + tâm vùng giao nhau +
  // tâm pill/panel đều phải thuộc về dialog/backdrop, không phải pill/panel.
  function verdictFps(m, label) {
    if (!m) return { ok: false, why: "không đo được (dialog không mở?)", summary: "" };
    if (!m.modalOpen) return { ok: false, why: "modal không mở", summary: "" };
    if (!m.primaryRect) return { ok: false, why: "không tìm thấy nút chính trong .modal-actions", summary: "" };
    const problems = [];
    const hit = m.hitAtPrimaryCenter;
    if (!hit) problems.push("elementFromPoint tại tâm nút chính trả null");
    else if (!hit.inDialog) problems.push(`elementFromPoint tại tâm nút chính trúng "${hit.text}" (${hit.tag}, ngoài dialog) thay vì nút chính — nút không bấm được`);
    if (m.hitAtPillOverlapCenter && !m.hitAtPillOverlapCenter.inDialog) problems.push(`tâm vùng giao nhau pill∩nút trúng pill "${m.hitAtPillOverlapCenter.text}" — pill còn trên backdrop`);
    if (m.hitAtPanelOverlapCenter && !m.hitAtPanelOverlapCenter.inDialog) problems.push(`tâm vùng giao nhau panel∩nút trúng panel "${m.hitAtPanelOverlapCenter.text}" — panel còn trên backdrop`);
    if (m.hitAtPillCenter && m.hitAtPillCenter.isPill) problems.push("pill FPS vẫn là phần tử trên cùng tại tâm của nó khi modal mở — pill còn trên backdrop");
    if (m.hitAtPanelCenter && m.hitAtPanelCenter.inPanel) problems.push("panel FPS vẫn là phần tử trên cùng tại tâm của nó khi modal mở — panel còn trên backdrop");
    const hitTxt = hit ? hit.text : "?";
    const hitWhere = hit ? (hit.inDialog ? "trong dialog" : "NGOAI dialog") : "?";
    const summary = "viewport " + m.viewport.w + "x" + m.viewport.h + ", backdrop z=" + m.backdropZ + ", pill z=" + m.pillZ + ", giao hinh hoc pill-nut=" + m.pillPrimaryOverlap + "px2 panel-nut=" + m.panelPrimaryOverlap + "px2 (chi ghi nhan — nam duoi backdrop thi khong che), hit tai tam nut=" + hitTxt + " (" + hitWhere + ")";
    return problems.length ? { ok: false, why: problems.join(" || "), summary } : { ok: true, why: "", summary };
  }

  try {
    const DEV_PORT = Number(process.env.R1_DEV_PORT || 0) || (await pickFreePort(5490, 5499));
    const DEBUG_PORT = Number(process.env.R1_DEBUG_PORT || 0) || (await pickFreePort(9590, 9599));
    const DISPLAY = process.env.R1_DISPLAY || ":173";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5490–5499");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9590–9599");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (R1 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round62-r1/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r1-vite.log"), "w");
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

    // ---- R0: setup vi + mount -------------------------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    const s0 = await cdp.evalJs(`(async () => {
      const entries = performance.getEntriesByType("resource").map((e) => e.name);
      const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
      const mod = window.__r1storeMod || (window.__r1storeMod = await import(hit));
      const st = mod.useStore.getState();
      return { clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0), mediaCount: st.media.length };
    })()`).catch(() => null);
    await drainErrors(cdp);
    if (s0 && s0.clipCount === 3 && s0.mediaCount === 2) pass("R0 setup: locale vi + mẫu tự load", `3 clip, media bin 2 item`);
    else fail("R0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(s0)}`);

    // ---- F0: baseline @390×844, modal ĐÓNG — pill bấm được ---------------
    await setViewport(cdp, 390, 844, true);
    {
      const m = await cdp.evalJs(FPS_FN("Bắt đầu tạo phụ đề"));
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-f0-baseline-390.json"), JSON.stringify(m, null, 2));
      await drainErrors(cdp);
      const hitPill = m.hitAtPillCenter;
      const pillClickable = hitPill && !hitPill.inDialog && (hitPill.text || "").includes("FPS");
      if (!m.modalOpen && m.pillRect && pillClickable) {
        pass("F0 baseline @390×844 modal đóng: pill FPS bấm được", `pill ${m.pillRect.w}×${m.pillRect.h} tại (${m.pillRect.left}, ${m.pillRect.top})–(${m.pillRect.right}, ${m.pillRect.bottom}), z=${m.pillZ}; elementFromPoint tại tâm pill = "${hitPill.text}" (ngoài dialog)`);
      } else {
        fail("F0 baseline @390×844 modal đóng: pill FPS bấm được", `modalOpen=${m.modalOpen}, pillRect=${JSON.stringify(m.pillRect)}, hit tại tâm pill=${JSON.stringify(hitPill)}`);
      }
      // Ghi lại z-index thật để đối chiếu trước/sau sửa.
      log(`z-index thật lúc baseline: backdrop=${m.backdropZ} (chưa có modal nên null là đúng), pill z=${m.pillZ}`);
    }

    // ---- F1: config vi @390×844 — pill vs nút chính ----------------------
    await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
    {
      const m = await cdp.evalJs(FPS_FN("Bắt đầu tạo phụ đề"));
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-f1-config-390-vi.json"), JSON.stringify(m, null, 2));
      const v = verdictFps(m, "F1");
      if (v.ok) pass("F1 config vi @390×844: pill FPS không đè nút chính, nút bấm được", v.summary);
      else fail("F1 config vi @390×844: pill FPS không đè nút chính, nút bấm được", `${v.why} — ${v.summary}`);
      await cdp.shot("r1-config-390-vi.png");
      await drainErrors(cdp);
    }

    // ---- F2: config en @390×844 ------------------------------------------
    await closeModalX(cdp);
    await cdp.evalJs(`localStorage.setItem("vcut-lang", "en")`);
    await reloadPage(cdp);
    await openModal(cdp, "Captions", "Auto-generate captions");
    {
      const m = await cdp.evalJs(FPS_FN("Start generating captions"));
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-f2-config-390-en.json"), JSON.stringify(m, null, 2));
      const v = verdictFps(m, "F2");
      if (v.ok) pass("F2 config en @390×844: pill FPS không đè nút chính, nút bấm được", v.summary);
      else fail("F2 config en @390×844: pill FPS không đè nút chính, nút bấm được", `${v.why} — ${v.summary}`);
      await cdp.shot("r1-config-390-en.png");
      await drainErrors(cdp);
    }
    await closeModalX(cdp);
    await cdp.evalJs(`localStorage.setItem("vcut-lang", "vi")`);

    // ---- F3: config vi @1280×720 (desktop — khóa hồi quy) ----------------
    await setViewport(cdp, 1280, 720, false);
    await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
    {
      const m = await cdp.evalJs(FPS_FN("Bắt đầu tạo phụ đề"));
      fs.writeFileSync(path.join(SCRATCH, "r1-measure-f3-config-1280-vi.json"), JSON.stringify(m, null, 2));
      const v = verdictFps(m, "F3");
      if (v.ok) pass("F3 config vi @1280×720: pill FPS không đè nút chính, nút bấm được", v.summary);
      else fail("F3 config vi @1280×720: pill FPS không đè nút chính, nút bấm được", `${v.why} — ${v.summary}`);
      await cdp.shot("r1-config-1280-vi.png");
      await drainErrors(cdp);
    }
    await closeModalX(cdp);

    // ---- F4: panel FPS đang MỞ + modal mở @390×844 -----------------------
    await setViewport(cdp, 390, 844, true);
    {
      // Mở panel FPS bằng chuột thật lên pill (modal đang đóng).
      const pillBtn = await cdp.evalJs(BTN_RECT_FN("FPS"));
      if (!pillBtn) fail("F4 panel FPS mở + modal @390×844: panel nằm dưới backdrop", "không tìm thấy pill FPS để mở panel");
      else {
        await cdp.click(pillBtn.x, pillBtn.y);
        const panelOpened = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(STATE_FN).catch(() => null);
          return s && s.fpsPanelOpen ? s : null;
        }, "panel FPS mở sau khi bấm pill", 10000).catch(() => null);
        if (!panelOpened) {
          fail("F4 panel FPS mở + modal @390×844: panel nằm dưới backdrop", "bấm pill nhưng panel FPS không mở (fpsPanelOpen=false)");
        } else {
          await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
          const m = await cdp.evalJs(FPS_FN("Bắt đầu tạo phụ đề"));
          fs.writeFileSync(path.join(SCRATCH, "r1-measure-f4-panel-390-vi.json"), JSON.stringify(m, null, 2));
          await cdp.shot("r1-panel-390-vi.png");
          const hit = m.hitAtPanelCenter;
          const panelUnder = hit && !hit.inPanel && (hit.isBackdrop || hit.inDialog);
          const v = verdictFps(m, "F4");
          await drainErrors(cdp);
          if (panelUnder && v.ok) {
            pass("F4 panel FPS mở + modal @390×844: panel nằm dưới backdrop, nút chính bấm được", `panel ${m.panelRect.w}×${m.panelRect.h} z=${m.panelZ}, backdrop z=${m.backdropZ}; elementFromPoint tại tâm panel = "${hit.text}" (${hit.isBackdrop ? "backdrop" : "trong dialog"}); ${v.summary}`);
          } else {
            fail("F4 panel FPS mở + modal @390×844: panel nằm dưới backdrop", `panelPrimaryOverlap=${m.panelPrimaryOverlap}px², hit tại tâm panel=${JSON.stringify(hit)}; verdict nút chính: ${v.ok ? "ok" : v.why}`);
          }
          // Đóng panel FPS để dọn trạng thái cho F5 (bấm ✕ trong panel).
          await cdp.evalJs(`(() => { const p = [...document.querySelectorAll('[role="status"]')].find((el) => (el.textContent || "").includes("FPS preview")); if (!p) return false; const b = p.querySelector("button"); if (b) b.click(); return true; })()`);
          await sleep(500);
          await closeModalX(cdp);
        }
      }
    }

    // ---- F5: click chuột thật vào tâm nút chính @390×844 -----------------
    await openModal(cdp, "Phụ đề", "Tạo phụ đề tự động");
    {
      const before = await cdp.evalJs(STATE_FN);
      // Điểm click: TÂM VÙNG GIAO NHAU pill ∩ nút chính (nếu còn giao nhau)
      // — chính là vùng user chạm vào đuôi nút sẽ rơi vào pill; nếu đã hết
      // giao nhau (sau sửa) thì click tâm nút chính như thường.
      const fm = await cdp.evalJs(FPS_FN("Bắt đầu tạo phụ đề"));
      let clickPt = null;
      if (fm && fm.pillRect && fm.primaryRect && fm.pillPrimaryOverlap > 0) {
        const ox = (Math.max(fm.pillRect.left, fm.primaryRect.left) + Math.min(fm.pillRect.right, fm.primaryRect.right)) / 2;
        const oy = (Math.max(fm.pillRect.top, fm.primaryRect.top) + Math.min(fm.pillRect.bottom, fm.primaryRect.bottom)) / 2;
        clickPt = { x: ox, y: oy, where: "tâm vùng giao nhau pill∩nút (" + ox.toFixed(1) + ", " + oy.toFixed(1) + ")" };
      } else {
        const btn = await cdp.evalJs(BTN_RECT_FN("Bắt đầu tạo phụ đề"));
        if (!btn || btn.disabled) {
          fail("F5 click thật vào đuôi nút chính @390×844: click tới nút, không rơi vào pill FPS", `không bấm được nút chính (btn=${JSON.stringify(btn)})`);
          await ensureNoModal(cdp);
          clickPt = null;
        } else clickPt = { x: btn.x, y: btn.y, where: "tâm nút chính (không còn giao nhau)" };
      }
      if (clickPt) {
        await cdp.click(clickPt.x, clickPt.y);
        await sleep(1200);
        const after = await cdp.evalJs(STATE_FN);
        const m = await cdp.evalJs(FPS_FN("Bắt đầu tạo phụ đề"));
        fs.writeFileSync(path.join(SCRATCH, "r1-measure-f5-click-390-vi.json"), JSON.stringify({ before, after, fps: m, clickPt }, null, 2));
        await cdp.shot("r1-click-390-vi.png");
        await drainErrors(cdp);
        // Trước sửa: click rơi vào pill → panel FPS mở (fpsPanelOpen=true).
        // Sau sửa: click tới nút Start → panel KHÔNG mở; modal vẫn mở
        // (bridge không chạy trong harness này nên Start lỗi sạch, modal ở
        // lại config — chỉ khẳng định click không rơi vào pill).
        if (!after.fpsPanelOpen && after.captionOpen) {
          pass("F5 click thật vào đuôi nút chính @390×844: click tới nút, không rơi vào pill FPS", `click tại ${clickPt.where}; trước click: step=${before.captionStep} panel=${before.fpsPanelOpen}; sau click: step=${after.captionStep} panel=${after.fpsPanelOpen} modal vẫn mở — click không mở panel FPS`);
        } else {
          fail("F5 click thật vào đuôi nút chính @390×844: click tới nút, không rơi vào pill FPS", `click tại ${clickPt.where}; sau click: step=${after.captionStep} panel=${after.fpsPanelOpen} modal mở=${after.captionOpen} (panel mở = click rơi vào pill)`);
        }
        await ensureNoModal(cdp);
      }
    }

    // H9: 0 lỗi trang gộp qua các phase.
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (gộp qua các lần reload + mở/đóng modal)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "r1-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
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
