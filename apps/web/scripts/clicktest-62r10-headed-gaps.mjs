#!/usr/bin/env node
/**
 * clicktest-62r10-headed-gaps.mjs — Phase 9 đợt 62, luồng R10: đóng các nợ
 * đo headed còn lại của đợt 61 (§5.4 R4 + §5.5 R5).
 *
 * (a) Timeout recordPackMedia đo headed THẬT: fake MediaRecorder treo
 *     (onstop không bao giờ fire) → timeout 20s thật → modal hiện đúng
 *     chuỗi pack.recordTimeout (vi) + đo thời gian thật + modal mở khóa.
 * (b) CaptionModal running ở locale en, viewport 1280×720 và mobile
 *     390×844 (bridge caption thật, faster-whisper local).
 * (c) .tbtn-label đo headed trực tiếp ở 1280 (phải none) vs 1440 (phải
 *     hiện) + biên 1360/1361.
 * (d) Nút proxy bấm thật với bridge đang chạy: tạo proxy thật, badge
 *     PROXY hiện, HEAD proxyUrl 200, file proxy có trên đĩa bridge.
 * (e) Speed warn các đường còn lại (warnOverlap / warnResetOverlap /
 *     warnTooShort / warnNoGap) + sticker errWebp (WebP động thật) +
 *     bonus warnStabilizeRamp — headed, so chuỗi exact với dict.
 *
 * Chạy headed THẬT (vite dev đóng băng + Chromium headed qua Xvfb + CDP
 * Node thuần, không Playwright), mẫu clicktest-61r5-modal-headed.mjs.
 * Harness TỰ khởi động bridge (caption + TTS + proxy) ở 127.0.0.1:8787
 * (nếu bận thì 8788–8799 + VITE_BRIDGE_URL) rồi tắt sạch lúc thoát.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-62r10-headed-gaps.mjs
 * Env: R10_DEV_PORT (mặc định tự chọn 5490–5499), R10_DEBUG_PORT
 * (9590–9599), R10_DISPLAY (mặc định :173 — display RIÊNG của R10),
 * R10_SCRATCH (mặc định hidden_files/round62-r10/headed).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 * Chỉ sửa code sản phẩm khi phát hiện bug thật trong lúc đo (luồng này
 * chỉ đo — không sửa gì trừ khi đo lòi bug).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R10_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round62-r10", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const CFG_DIR = "/tmp/round62-r10";
const VITE_CFG = path.join(CFG_DIR, "vite.r10.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round62-r10/bridge-work";
const STATIC_DIR = "/tmp/round62-r10/static";
const VI = JSON.parse(fs.readFileSync(path.join(WEB_DIR, "src", "i18n", "vi.json"), "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(WEB_DIR, "src", "i18n", "en.json"), "utf8"));

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

/** fmtTime — bản sao apps/web/src/lib.ts (mm:ss.d), để so chuỗi exact. */
function fmtTime(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const mm = String(m).padStart(2, "0");
  const ss = rest < 10 ? `0${rest.toFixed(1)}` : rest.toFixed(1);
  return `${mm}:${ss}`;
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
  if (!window.__r10injected) {
    window.__r10injected = true;
    window.__r10errors = [];
    window.addEventListener("error", (e) => { try { window.__r10errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r10errors.push("window.onerror: <?>"); } });
    window.addEventListener("unhandledrejection", (e) => { try { window.__r10errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r10errors.push("unhandledrejection: <?>"); } });
  }
  window.__r10boot = window.__r10boot || Math.random().toString(36).slice(2);
})()`;

// Fake MediaRecorder TREO THẬT cho (a): onstop không bao giờ fire,
// start/stop là no-op (chỉ đếm số lần gọi), state luôn "recording".
// recordPackMedia đua race với timeout 20s → timeout thắng → ném
// RecordPackTimeoutError → PackError RECORD_TIMEOUT → modal báo lỗi.
const INJECT_HANG_RECORDER = `(() => {
  if (window.__r10hangInstalled) return "already";
  window.__r10hangInstalled = true;
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

// Đo riêng bước RUNNING của CaptionModal (mẫu R5).
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

const BTN_RECT_FN = (substr) => `((s) => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(s));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: b.textContent.trim(), disabled: b.disabled, rect: { left: +r.left.toFixed(1), top: +r.top.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1) } };
})(${JSON.stringify(substr)})`;

// Trạng thái store phục vụ đo: clip mẫu v1 + media + selection.
const STORE_FN = `(async () => {
  const mod = window.__r10storeMod || (window.__r10storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  const v1 = st.spec.tracks.find((t) => t.id === "v1");
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    v1clips: v1 ? v1.clips.map((c) => ({ id: c.id, kind: c.kind, src: c.src, start: c.start, duration: c.duration, in: c.in, out: c.out, speed: c.speed, reverse: !!c.reverse, kfCount: (c.speedKeyframes && c.speedKeyframes.keyframes ? c.speedKeyframes.keyframes.length : 0), hasStabilize: !!(c.enhance && c.enhance.stabilize !== undefined) })) : null,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file, proxyUrl: m.proxyUrl || null, proxyHeight: m.proxyHeight || null })),
    selection: st.selection,
  };
})()`;

// (c) .tbtn-label: display computed + hình học từng nhãn.
const TBTN_FN = `(() => {
  const els = [...document.querySelectorAll(".topbar-actions .tbtn-label")];
  return {
    count: els.length,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    labels: els.map((el) => {
      const g = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { text: (el.textContent || "").trim().slice(0, 30), display: g.display, w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
    }),
  };
})()`;

// (e) SpeedPanel: mọi .warn + slider + preset.
const SPEED_FN = `(() => {
  const panel = document.querySelector(".speed-panel");
  if (!panel) return null;
  const slider = panel.querySelector('input[type="range"]');
  const warns = [...panel.querySelectorAll(".warn")].map((el) => {
    const g = getComputedStyle(el);
    return { text: (el.textContent || "").trim(), color: g.color, fontSize: g.fontSize };
  });
  const presets = [...panel.querySelectorAll(".speed-presets button")].map((b) => ({ text: (b.textContent || "").trim(), disabled: b.disabled }));
  return {
    warns,
    slider: slider ? { min: slider.min, max: slider.max, step: slider.step, value: slider.value } : null,
    presets,
    resetVisible: !!([...panel.querySelectorAll("button")].find((b) => (b.textContent || "").trim().startsWith("↺"))),
  };
})()`;

// (e) StickerPanel warn.
const STICKER_WARN_FN = `(() => {
  const el = document.querySelector(".sticker-panel .warn");
  if (!el) return null;
  const g = getComputedStyle(el);
  return { color: g.color, fontSize: g.fontSize, text: (el.textContent || "").trim() };
})()`;

// (d) Card proxy của 1 media theo tên.
const PROXY_CARD_FN = (name) => `((n) => {
  const cards = [...document.querySelectorAll(".media-card")];
  const card = cards.find((c) => (c.querySelector(".media-name") || {}).textContent === n);
  if (!card) return null;
  const btn = card.querySelector(".media-proxy");
  const badge = card.querySelector(".proxy-badge, [class*='proxy-badge']");
  const badgeText = [...card.querySelectorAll("*")].map((e) => e.textContent || "").find((t) => /^PROXY \\d+p/.test(t.trim()));
  const br = btn ? btn.getBoundingClientRect() : null;
  return {
    found: true,
    btnText: btn ? (btn.textContent || "").trim() : null,
    btnDisabled: btn ? !!btn.disabled : null,
    btnRect: br ? { x: br.left + br.width / 2, y: br.top + br.height / 2 } : null,
    badge: badge ? (badge.textContent || "").trim() : (badgeText ? badgeText.trim() : null),
    cardText: (card.innerText || "").replace(/\\n/g, " | ").slice(0, 200),
  };
})(${JSON.stringify(name)})`;

// (a) PackModal: lỗi + busy + rows.
const PACK_FN = `(() => {
  const dlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => d.querySelector(".pack-row"));
  if (!dlg) return null;
  const err = dlg.querySelector(".error");
  const rows = [...dlg.querySelectorAll(".pack-row")].map((r) => {
    const b = r.querySelector("button.primary");
    const br = b ? b.getBoundingClientRect() : null;
    return { text: (r.innerText || "").replace(/\\n/g, " | ").slice(0, 120), btnText: b ? (b.textContent || "").trim() : null, btnDisabled: b ? !!b.disabled : null, btnRect: br ? { x: br.left + br.width / 2, y: br.top + br.height / 2 } : null };
  });
  const closeBtn = dlg.querySelector('.modal-head button[aria-label]');
  return {
    rows,
    error: err ? (err.textContent || "").trim() : null,
    busy: (dlg.innerText || "").includes("Đang tạo media mẫu") || (dlg.innerText || "").includes("Creating sample media"),
    closeDisabled: closeBtn ? !!closeBtn.disabled : null,
    hangRec: window.__hangRec ? { stopCalls: window.__hangRec.stopCalls, startCalls: window.__hangRec.startCalls, state: window.__hangRec.state } : null,
  };
})()`;

const STATE_FN = `(() => {
  const capDlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("phụ đề") || (d.getAttribute("aria-label") || "").includes("caption") || (d.getAttribute("aria-label") || "").includes("Caption"));
  return {
    captionOpen: !!capDlg,
    captionRunning: !!document.querySelector(".caption-running"),
    captionStep: capDlg ? (document.querySelector(".caption-running") ? "running" : (document.querySelector(".caption-list") ? "review" : "config")) : "",
    welcome: !!([...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("Chào mừng") || (d.getAttribute("aria-label") || "").includes("Welcome"))),
    pack: !!document.querySelector(".pack-row"),
    errors: (window.__r10errors || []).slice(),
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null, bridge = null, staticSrv = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
    try { bridge?.kill("SIGTERM"); } catch {}
    try { staticSrv?.kill("SIGKILL"); } catch {}
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
      const s = await cdp.evalJs(INJECT_ERRORS + `;(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); const boot = window.__r10boot; if (!top || splash || !boot) return null; const old = ${oldBootJson}; if (old && boot === old) return null; return (top.innerText.includes('VCut Studio') || window.innerWidth <= 768) ? boot : null; })()`).catch(() => null);
      return s;
    }, "app mount (topbar có mặt, splash đã tắt, boot mới)", 240000);
    await ensureNoModal(cdp);
    return boot;
  }

  async function reloadPage(cdp) {
    const oldBoot = await cdp.evalJs(`window.__r10boot`).catch(() => null);
    await cdp.send("Page.reload", { ignoreCache: false });
    return waitMounted(cdp, oldBoot);
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r10errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r10errors = []`).catch(() => {});
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

  async function setLocale(cdp, lang) {
    await cdp.evalJs(`localStorage.setItem("vcut-lang", ${JSON.stringify(lang)})`);
    await reloadPage(cdp);
    log(`locale → ${lang}`);
  }

  async function openCaptionModal(cdp, topBtnSubstr, titleSubstr) {
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
      if (opened) return true;
      log(`openCaptionModal lần ${attempt}: chưa mở — bấm lại`);
      await sleep(1000);
    }
    throw new Error(`timeout chờ CaptionModal mở (tiêu đề ${titleSubstr}) sau 3 lần bấm`);
  }

  // Chọn clip v1[idx] qua store (đo setup theo tiền lệ R4 B3).
  async function selectV1Clip(cdp, idx) {
    const r = await cdp.evalJs(`(async () => {
      const mod = window.__r10storeMod || (window.__r10storeMod = await import("/src/store.ts"));
      const st = mod.useStore.getState();
      const v1 = st.spec.tracks.find((t) => t.id === "v1");
      if (!v1 || !v1.clips[${idx}]) return { ok: false, why: "không có clip v1[" + ${idx} + "]" };
      const c = v1.clips[${idx}];
      st.select({ trackId: "v1", clipId: c.id });
      return { ok: true, clipId: c.id };
    })()`);
    if (!r.ok) throw new Error("selectV1Clip: " + r.why);
    return r.clipId;
  }

  async function patchV1Clip(cdp, idx, patchJson) {
    return cdp.evalJs(`(async () => {
      const mod = window.__r10storeMod || (window.__r10storeMod = await import("/src/store.ts"));
      const st = mod.useStore.getState();
      const v1 = st.spec.tracks.find((t) => t.id === "v1");
      const c = v1.clips[${idx}];
      const n = st.patchClip("v1", c.id, ${patchJson});
      const c2 = mod.useStore.getState().spec.tracks.find((t) => t.id === "v1").clips[${idx}];
      return { patched: n, clip: { start: c2.start, duration: c2.duration, in: c2.in, out: c2.out, speed: c2.speed, reverse: !!c2.reverse } };
    })()`);
  }

  // Cuộn phần tử vào giữa vùng nhìn rồi trả rect MỚI (Inspector/MediaBin
  // là panel cuộn được — nút dưới fold có rect nằm ngoài viewport nên
  // click tọa độ rơi sai chỗ; lỗi harness lượt chạy 1: E1/E2 FAIL + S4d
  // HARNESS ERROR vì bấm preset/Reset/curve-enable khi nút còn dưới
  // fold). `elExpr` là biểu thức JS trả về phần tử (hoặc null).
  async function scrollBtnIntoView(cdp, elExpr) {
    const ok = await cdp.evalJs(`(() => {
      const el = (${elExpr});
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "center" });
      return true;
    })()`).catch(() => null);
    if (!ok) return null;
    await sleep(500);
    return cdp.evalJs(`(() => {
      const el = (${elExpr});
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2, text: (el.textContent || "").trim(), disabled: !!el.disabled, inViewport: b.top >= 0 && b.bottom <= window.innerHeight && b.left >= 0 && b.right <= window.innerWidth };
    })()`).catch(() => null);
  }

  try {
    // ---- Preflight: cổng bridge RIÊNG (tránh đụng bridge của luồng
    // round-62 khác đang chạy song song — R5 dùng 8787 cố định; luồng
    // này lấy cổng riêng 8791–8799 + VITE_BRIDGE_URL để UI theo đúng
    // bridge của mình; WORK_ROOT riêng nên verify file proxy trên đĩa
    // không lẫn với bridge khác).
    const bridgePort = await pickFreePort(8791, 8799);
    if (!bridgePort) throw new Error("hết cổng bridge trống 8791–8799");
    const BRIDGE_URL = `http://127.0.0.1:${bridgePort}`;
    const STATIC_PORT = await pickFreePort(5810, 5819);
    if (!STATIC_PORT) throw new Error("hết cổng static trống 5810–5819");
    const DEV_PORT = Number(process.env.R10_DEV_PORT || 0) || (await pickFreePort(5490, 5499));
    const DEBUG_PORT = Number(process.env.R10_DEBUG_PORT || 0) || (await pickFreePort(9590, 9599));
    const DISPLAY = process.env.R10_DISPLAY || ":173";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5490–5499");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9590–9599");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock}`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round62-r10/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.mkdirSync(CFG_DIR, { recursive: true });
    fs.mkdirSync(STATIC_DIR, { recursive: true });
    fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
    // Fixture cho static server: mp4 test + webp động (copy từ scratch).
    for (const f of ["r4-test.mp4", "anim-test.webp"]) {
      const src = path.join(os.homedir(), "scratch-round62-r10", f);
      const dst = path.join(STATIC_DIR, f);
      if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
    }
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, bridge :${bridgePort}, static :${STATIC_PORT}`);

    // ---- Static server (phục vụ mp4/webp test, CORS *) ----------------
    const staticLogFd = fs.openSync(path.join(SCRATCH, "r10-static.log"), "w");
    staticSrv = spawn("python3", [path.join(os.homedir(), "scratch-round62-r10", "cors-server.py"), String(STATIC_PORT), STATIC_DIR], { stdio: ["ignore", staticLogFd, staticLogFd] });
    for (let i = 0; i < 30; i++) {
      try { const r = await fetch(`http://127.0.0.1:${STATIC_PORT}/r4-test.mp4`, { method: "HEAD" }); if (r.ok) break; } catch {}
      await sleep(500);
    }
    log(`static server :${STATIC_PORT} lên`);

    // ---- Bridge (spawn riêng, cổng riêng, WORK_ROOT riêng) ------------
    {
      const bridgeLogFd = fs.openSync(path.join(SCRATCH, "r10-bridge.log"), "w");
      // Bridge KHÔNG đọc argv --port (chỉ đọc env BRIDGE_PORT, index.js:117)
      // — lần chạy 1 spawn với --port 8791 nhưng bridge vẫn lên 8787 nên
      // health check 8791 timeout 120s. Truyền BRIDGE_PORT qua env.
      bridge = spawn("node", [BRIDGE_ENTRY], {
        stdio: ["ignore", bridgeLogFd, bridgeLogFd],
        env: {
          ...process.env,
          BRIDGE_PORT: String(bridgePort),
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
      if (!up) throw new Error(`bridge không lên / caption không available ở ${BRIDGE_URL} sau 120s (xem r10-bridge.log)`);
      log(`bridge OK: ${BRIDGE_URL} (caption available, WORK_DIR=${BRIDGE_WORK_DIR})`);
    }

    // ---- Vite + Xvfb + Chrome ------------------------------------------
    const viteLogFd = fs.openSync(path.join(SCRATCH, "r10-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r10-chrome.log"), "w");
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

    // ---- S0: mount vi + mẫu tự load ------------------------------------
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMounted(cdp, null);
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STORE_FN).catch(() => null);
      return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
    }, "project mẫu tự load (3 clip, media bin 2 item)", 180000);
    await drainErrors(cdp);
    if (s0) pass("S0 setup: locale vi + mẫu tự load", `3 clip, media [${s0.media.map((m) => m.name).join(", ")}], v1 clips ${JSON.stringify(s0.v1clips.map((c) => ({ start: c.start, duration: c.duration, src: c.src })))}`);
    else fail("S0 setup: locale vi + mẫu tự load", `state=${JSON.stringify(await cdp.evalJs(STORE_FN).catch(() => null))}`);

    // ================= (c) .tbtn-label 1280 vs 1440 =================
    {
      // 1440 trước (viewport thật qua metrics override).
      await setViewport(cdp, 1440, 900, false);
      const m1440 = await cdp.evalJs(TBTN_FN);
      fs.writeFileSync(path.join(SCRATCH, "r10-measure-tbtn-1440.json"), JSON.stringify(m1440, null, 2));
      await cdp.shot("r10-tbtn-1440.png");
      const vis1440 = m1440.labels.filter((l) => l.display !== "none" && l.w > 0).length;
      if (m1440.count >= 1 && vis1440 === m1440.count) pass("C1 .tbtn-label @1440×900: nhãn HIỆN", `${m1440.count} nhãn, display=${[...new Set(m1440.labels.map((l) => l.display))].join(",")}, rộng ${m1440.labels.map((l) => l.w).join("/")}px`);
      else fail("C1 .tbtn-label @1440×900: nhãn HIỆN", `count=${m1440.count}, hiện ${vis1440}/${m1440.count}, labels=${JSON.stringify(m1440.labels)}`);
      await drainErrors(cdp);

      await setViewport(cdp, 1280, 720, false);
      const m1280 = await cdp.evalJs(TBTN_FN);
      fs.writeFileSync(path.join(SCRATCH, "r10-measure-tbtn-1280.json"), JSON.stringify(m1280, null, 2));
      await cdp.shot("r10-tbtn-1280.png");
      const hid1280 = m1280.labels.filter((l) => l.display === "none").length;
      if (m1280.count >= 1 && hid1280 === m1280.count) pass("C2 .tbtn-label @1280×720: nhãn ẨN (display none)", `${m1280.count} nhãn đều display:none (media query 769–1360px)`);
      else fail("C2 .tbtn-label @1280×720: nhãn ẨN (display none)", `count=${m1280.count}, ẩn ${hid1280}/${m1280.count}, labels=${JSON.stringify(m1280.labels)}`);
      await drainErrors(cdp);

      // Biên media query 1360/1361 (bonus, rẻ).
      await setViewport(cdp, 1360, 720, false);
      const m1360 = await cdp.evalJs(TBTN_FN);
      await setViewport(cdp, 1361, 720, false);
      const m1361 = await cdp.evalJs(TBTN_FN);
      const hid1360 = m1360.labels.filter((l) => l.display === "none").length;
      const vis1361 = m1361.labels.filter((l) => l.display !== "none" && l.w > 0).length;
      if (hid1360 === m1360.count && vis1361 === m1361.count) pass("C3 biên media query 1360/1361", `1360: ${hid1360}/${m1360.count} ẩn; 1361: ${vis1361}/${m1361.count} hiện — đúng max-width:1360px`);
      else fail("C3 biên media query 1360/1361", `1360 ẩn ${hid1360}/${m1360.count}; 1361 hiện ${vis1361}/${m1361.count}`);
      await drainErrors(cdp);
      // Về 1280×720 cho (b).
      await setViewport(cdp, 1280, 720, false);
    }

    // ================= (b) CaptionModal running en =================
    async function measureRunningEn(tag, shotName) {
      await openCaptionModal(cdp, "Captions", "Auto-generate captions");
      const startBtn = await cdp.evalJs(BTN_RECT_FN("Start generating captions"));
      if (!startBtn || startBtn.disabled) {
        fail(`${tag} running en: spinner + Cancel hiển thị đúng`, `không bấm được nút Start (startBtn=${JSON.stringify(startBtn)})`);
        await ensureNoModal(cdp);
        return;
      }
      const tStart = Date.now();
      await cdp.click(startBtn.x, startBtn.y);
      // Fallback mobile: pill FPS (z-300) có thể đè lên đuôi nút Start ở
      // bottom-sheet — nếu click tọa độ không mở running trong 3s thì bấm
      // bằng el.click() (vẫn đi qua đúng onClick React).
      let run = null;
      for (let i = 0; i < 15; i++) {
        const s = await cdp.evalJs(`(document.querySelector(".caption-running") ? true : null)`);
        if (s) { run = await cdp.evalJs(RUNNING_FN); break; }
        await sleep(200);
      }
      if (!run) {
        const fb = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start generating captions")); if (!b) return false; b.click(); return true; })()`);
        log(`${tag}: click tọa độ không mở running sau 3s — fallback el.click() = ${fb}`);
      }
      for (let i = 0; i < 285 && !run; i++) {
        const s = await cdp.evalJs(`(document.querySelector(".caption-running") ? true : null)`);
        if (s) { run = await cdp.evalJs(RUNNING_FN); break; }
        await sleep(200);
      }
      const elapsedMs = Date.now() - tStart;
      if (!run || !run.running) {
        const st = await cdp.evalJs(STATE_FN).catch(() => ({}));
        fail(`${tag} running en: spinner + Cancel hiển thị đúng`, `không bắt được bước running sau ${elapsedMs}ms (captionStep=${st.captionStep}, modal mở=${st.captionOpen})`);
      } else {
        fs.writeFileSync(path.join(SCRATCH, `r10-measure-running-${tag}.json`), JSON.stringify(run, null, 2));
        await cdp.shot(shotName);
        const problems = [];
        if (!run.spinnerVisible) problems.push("spinner không hiển thị (0×0)");
        if (!run.phaseText) problems.push("không có phase text");
        if (!run.cancel) problems.push("không thấy nút Cancel");
        else {
          if (!run.cancel.textFits) problems.push(`nút Cancel tràn chữ (${run.cancel.clientWidth}px hộp, chữ ${run.cancel.scrollWidth}px)`);
          if (!run.cancel.visible) problems.push("nút Cancel không nhìn thấy");
          if (!run.cancelInViewport) problems.push("nút Cancel ngoài viewport");
        }
        if (!run.modalFitsViewport) problems.push(`modal vượt viewport (bottom ${run.modal.bottom} > ${run.viewport.h})`);
        await drainErrors(cdp);
        if (problems.length) fail(`${tag} running en: spinner + Cancel hiển thị đúng`, `${problems.join(" || ")} — đo sau ${elapsedMs}ms, phase="${run.phaseText}", body="${run.bodyText}"`);
        else pass(`${tag} running en: spinner + Cancel hiển thị đúng`, `đo sau ${elapsedMs}ms từ lúc bấm Start, phase="${run.phaseText}", spinner ${run.spinnerRect.w}×${run.spinnerRect.h}, nút "${run.cancel.text}" ${run.cancel.rect.w}×${run.cancel.rect.h}, modal ${run.modal.w}×${run.modal.h} top ${run.modal.top} bottom ${run.modal.bottom}`);
      }
      // Đóng modal (Escape — hành vi App đã biết, R5 A1b) để dọn cho
      // section sau; job caption bị abort theo unmount.
      await cdp.key("Escape", "Escape");
      await ensureNoModal(cdp);
    }
    {
      await setLocale(cdp, "en");
      await measureRunningEn("1280-en", "r10-running-1280-en.png");
      await setViewport(cdp, 390, 844, true);
      await measureRunningEn("390-en", "r10-running-390-en.png");
      await cdp.send("Emulation.clearDeviceMetricsOverride");
      await reloadPage(cdp);
      await setViewport(cdp, 1280, 720, false);
    }

    // ================= (e) Speed warn các đường còn lại =============
    const EXPECT = {
      warnOverlap: EN.speed.warnOverlap.replace("{dur}", fmtTime(8)),
      warnResetOverlap: EN.speed.warnResetOverlap,
      warnNoGap: EN.speed.warnNoGap,
      warnStabilizeRamp: EN.speed.warnStabilizeRamp,
      errWebp: EN.sticker.errWebp,
    };
    {
      // S4a warnOverlap: clip v1[0] (start 0, dur 4, src 4s) + preset 0.5×
      // → newDur 8s đè clip v1[1] (start 4). Bấm preset THẬT bằng chuột.
      await selectV1Clip(cdp, 0);
      await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector(".speed-panel")`).catch(() => false), "SpeedPanel hiện (S4a)", 30000);
      const presetBtn = await scrollBtnIntoView(cdp, `[...document.querySelectorAll(".speed-panel .speed-presets button")].find((x) => (x.textContent || "").trim() === "0.5×")`);
      if (!presetBtn || presetBtn.disabled) {
        fail("E1 speed warnOverlap: preset 0.5× đè clip kề", `không bấm được preset 0.5× (presetBtn=${JSON.stringify(presetBtn)})`);
      } else {
        await cdp.click(presetBtn.x, presetBtn.y);
        const sp = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(SPEED_FN).catch(() => null);
          return s && s.warns.length > 0 ? s : null;
        }, "warnOverlap hiện sau preset 0.5×", 15000).catch(() => null);
        const st = await cdp.evalJs(STORE_FN);
        const w0 = sp ? sp.warns[0] : null;
        if (w0 && w0.text === EXPECT.warnOverlap && w0.color === "rgb(251, 191, 36)" && w0.fontSize === "12px" && st.v1clips[0].speed !== 0.5) {
          pass("E1 speed warnOverlap: preset 0.5× đè clip kề", `warn exact "${w0.text}", màu #fbbf24 12px; clip KHÔNG bị đổi tốc độ (speed vẫn ${st.v1clips[0].speed ?? 1}, duration ${st.v1clips[0].duration})`);
        } else {
          fail("E1 speed warnOverlap: preset 0.5× đè clip kề", `warn=${JSON.stringify(w0)} (kỳ vọng exact "${EXPECT.warnOverlap}"), speed clip=${st.v1clips[0].speed}`);
        }
        fs.writeFileSync(path.join(SCRATCH, "r10-measure-speed-overlap.json"), JSON.stringify(sp, null, 2));
        await cdp.shot("r10-speed-overlap.png");
      }
      await drainErrors(cdp);

      // Xóa warn cũ bằng preset 1× (applySpeed(1) → setWarn(null)).
      await cdp.evalJs(`(( ) => { const b = [...document.querySelectorAll(".speed-panel .speed-presets button")].find((x) => (x.textContent || "").trim() === "1×"); if (b) b.click(); return true; })()`);
      await sleep(600);

      // S4b warnResetOverlap: clip1 speed 2× (dur 2), clip2 start 2.5 →
      // bấm Reset (về 1×, dur 4) sẽ đè clip2 → warn, clip giữ speed 2.
      await selectV1Clip(cdp, 0);
      const setupB = await patchV1Clip(cdp, 0, JSON.stringify({ speed: 2, duration: 2 }));
      const setupB2 = await patchV1Clip(cdp, 1, JSON.stringify({ start: 2.5 }));
      log(`S4b setup: clip1=${JSON.stringify(setupB.clip)}, clip2=${JSON.stringify(setupB2.clip)}`);
      const resetBtn = await scrollBtnIntoView(cdp, `[...document.querySelectorAll(".speed-panel button")].find((x) => (x.textContent || "").trim().startsWith("↺"))`);
      if (!resetBtn || resetBtn.disabled) {
        fail("E2 speed warnResetOverlap: Reset 1× đè clip kề", `không thấy/bấm được nút Reset (resetBtn=${JSON.stringify(resetBtn)})`);
      } else {
        await cdp.click(resetBtn.x, resetBtn.y);
        const sp = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(SPEED_FN).catch(() => null);
          return s && s.warns.some((w) => w.text.includes("reset to 1")) ? s : null;
        }, "warnResetOverlap hiện sau Reset", 15000).catch(() => null);
        const st = await cdp.evalJs(STORE_FN);
        const w0 = sp ? sp.warns.find((w) => w.text.includes("reset to 1")) : null;
        if (w0 && w0.text === EXPECT.warnResetOverlap && w0.color === "rgb(251, 191, 36)" && w0.fontSize === "12px" && st.v1clips[0].speed === 2) {
          pass("E2 speed warnResetOverlap: Reset 1× đè clip kề", `warn exact "${w0.text}", màu #fbbf24 12px; clip GIỮ speed 2 (duration ${st.v1clips[0].duration})`);
        } else {
          fail("E2 speed warnResetOverlap: Reset 1× đè clip kề", `warn=${JSON.stringify(w0)} (kỳ vọng exact "${EXPECT.warnResetOverlap}"), speed clip=${st.v1clips[0].speed}`);
        }
        fs.writeFileSync(path.join(SCRATCH, "r10-measure-speed-reset-overlap.json"), JSON.stringify(sp, null, 2));
        await cdp.shot("r10-speed-reset-overlap.png");
      }
      await drainErrors(cdp);
      // Khôi phục timeline: clip1 về 1×/dur 4, clip2 start 4.
      await patchV1Clip(cdp, 0, JSON.stringify({ speed: 1, duration: 4 }));
      await patchV1Clip(cdp, 1, JSON.stringify({ start: 4 }));
      await cdp.evalJs(`(( ) => { const b = [...document.querySelectorAll(".speed-panel .speed-presets button")].find((x) => (x.textContent || "").trim() === "1×"); if (b) b.click(); return true; })()`);
      await sleep(600);

      // S4c warnTooShort — chứng minh nhánh chết qua UI: trim clip1 về
      // srcLen 0.5s → sliderMax = 0.5/0.2 = 2.5, preset 4× disabled;
      // kéo slider lên max 2.5 → newDur đúng 0.2 → KHÔNG warn (applySpeed
      // kẹp raw về sliderMax trước khi tính newDur).
      const trimC = await patchV1Clip(cdp, 0, JSON.stringify({ in: 0, out: 0.5 }));
      const spC0 = await cdp.evalJs(SPEED_FN);
      const sliderMax = spC0 && spC0.slider ? Number(spC0.slider.max) : null;
      const preset4 = spC0 ? spC0.presets.find((p) => p.text === "4×") : null;
      log(`S4c setup: clip1 srcLen=${trimC.clip.out - trimC.clip.in}s, slider max=${sliderMax}, preset 4× disabled=${preset4 ? preset4.disabled : "?"}`);
      let tooShortResult = null;
      if (sliderMax === 2.5 && preset4 && preset4.disabled) {
        // Đặt slider về max bằng native setter + event input (mẫu R4).
        const setSlider = await cdp.evalJs(`(() => {
          const s = document.querySelector('.speed-panel input[type="range"]');
          if (!s) return { ok: false, why: "không thấy slider" };
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(s, "2.5");
          s.dispatchEvent(new Event("input", { bubbles: true }));
          s.dispatchEvent(new Event("change", { bubbles: true }));
          return { ok: true };
        })()`);
        await sleep(800);
        const spC1 = await cdp.evalJs(SPEED_FN);
        const stC = await cdp.evalJs(STORE_FN);
        tooShortResult = { sliderMax, preset4Disabled: preset4.disabled, setSlider, warns: spC1 ? spC1.warns : null, speed: stC.v1clips[0].speed, duration: stC.v1clips[0].duration };
        if (setSlider.ok && spC1 && spC1.warns.length === 0 && stC.v1clips[0].speed === 2.5 && Math.abs(stC.v1clips[0].duration - 0.2) < 1e-9) {
          pass("E3 speed warnTooShort: NHÁNH CHẾT qua UI (đã chứng minh)", `slider max=${sliderMax} (= srcLen 0.5 / 0.2), preset 4× disabled, slider lên max → speed 2.5, duration đúng 0.2, KHÔNG warn — applySpeed kẹp raw về sliderMax nên newDur không bao giờ < 0.2 qua UI`);
        } else {
          fail("E3 speed warnTooShort: NHÁNH CHẾT qua UI (đã chứng minh)", `kết quả=${JSON.stringify(tooShortResult)}`);
        }
        fs.writeFileSync(path.join(SCRATCH, "r10-measure-speed-tooshort.json"), JSON.stringify(tooShortResult, null, 2));
      } else {
        fail("E3 speed warnTooShort: NHÁNH CHẾT qua UI (đã chứng minh)", `setup không như kỳ vọng: sliderMax=${sliderMax} (cần 2.5), preset4=${JSON.stringify(preset4)}`);
      }
      await drainErrors(cdp);
      // Khôi phục clip1: in 0, out 4, speed 1, duration 4.
      await patchV1Clip(cdp, 0, JSON.stringify({ in: 0, out: 4, speed: 1, duration: 4 }));
      await sleep(600);

      // S4d warnNoGap: bật curve thật → patch keyframes dày (0.1s) →
      // bấm nút thêm điểm thật → warn (bestGap 0.1 < 0.2).
      try {
      await selectV1Clip(cdp, 0);
      const curveBtn = await scrollBtnIntoView(cdp, `document.querySelector(".speed-panel .curve-enable-btn")`);
      if (!curveBtn) {
        fail("E4 speed warnNoGap: thêm điểm khi không còn khoảng trống", "không thấy nút bật curve (.curve-enable-btn)");
      } else {
        await cdp.click(curveBtn.x, curveBtn.y);
        const curveOn = await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector(".curve-kf")`).catch(() => false), "curve-kf hiện sau khi bật", 30000).catch(() => null);
        if (!curveOn) {
          fail("E4 speed warnNoGap: thêm điểm khi không còn khoảng trống", "bấm nút bật curve nhưng .curve-kf không hiện sau 30s");
        } else {
        const dense = [];
        for (let t = 0; t <= 4.0001; t += 0.1) dense.push({ t: Math.round(t * 10) / 10, v: 1, easing: "linear" });
        const patchD = await patchV1Clip(cdp, 0, JSON.stringify({ speedKeyframes: { keyframes: dense } }));
        log(`S4d setup: patch speedKeyframes dày → ${JSON.stringify(patchD.clip)}`);
        const stD = await cdp.evalJs(STORE_FN);
        log(`S4d kfCount sau patch: ${stD.v1clips[0].kfCount} (kỳ vọng 41)`);
        const addBtn = await scrollBtnIntoView(cdp, `document.querySelector(".speed-panel .curve-add-btn")`);
        if (!addBtn) {
          fail("E4 speed warnNoGap: thêm điểm khi không còn khoảng trống", "không thấy nút thêm điểm (.curve-add-btn)");
        } else {
          await cdp.click(addBtn.x, addBtn.y);
          const sp = await cdp.waitFor(async () => {
            const s = await cdp.evalJs(SPEED_FN).catch(() => null);
            return s && s.warns.some((w) => w.text.includes("No gap")) ? s : null;
          }, "warnNoGap hiện sau bấm thêm điểm", 15000).catch(() => null);
          const w0 = sp ? sp.warns.find((w) => w.text.includes("No gap")) : null;
          if (w0 && w0.text === EXPECT.warnNoGap && w0.color === "rgb(251, 191, 36)" && w0.fontSize === "12px") {
            pass("E4 speed warnNoGap: thêm điểm khi không còn khoảng trống", `warn exact "${w0.text}", màu #fbbf24 12px (41 điểm, khoảng lớn nhất 0.1s < 0.2s)`);
          } else {
            fail("E4 speed warnNoGap: thêm điểm khi không còn khoảng trống", `warn=${JSON.stringify(w0)} (kỳ vọng exact "${EXPECT.warnNoGap}")`);
          }
          fs.writeFileSync(path.join(SCRATCH, "r10-measure-speed-nogap.json"), JSON.stringify(sp, null, 2));
          await cdp.shot("r10-speed-nogap.png");
        }
        }
      }
      } catch (e) {
        fail("E4 speed warnNoGap: thêm điểm khi không còn khoảng trống", `ERROR: ${String((e && e.stack) || e).slice(0, 400)}`);
      }
      await drainErrors(cdp);

      // S4e bonus warnStabilizeRamp: curve vẫn bật + patch enhance.stabilize
      // qua store (UI chặn tổ hợp này theo R2 — đo bằng store là đường duy
      // nhất tới được dòng warn này) → dòng warn hiện trong khối curve.
      try {
        const patchE = await patchV1Clip(cdp, 0, JSON.stringify({ enhance: { stabilize: { smoothing: 10, shakiness: 5, accuracy: 15, stepsize: 6, mincontrast: 0.3 } } }));
        log(`S4e setup: patch enhance.stabilize → ${JSON.stringify(patchE.clip)}`);
        await sleep(800);
        const sp = await cdp.evalJs(SPEED_FN);
        const w0 = sp ? sp.warns.find((w) => w.text.includes("stabilization")) : null;
        if (w0 && w0.text === EXPECT.warnStabilizeRamp && w0.color === "rgb(251, 191, 36)" && w0.fontSize === "12px") {
          pass("E5 speed warnStabilizeRamp (bonus): chống rung + curve", `warn exact "${w0.text}", màu #fbbf24 12px (đặt qua store vì UI R2 chặn tổ hợp này)`);
        } else {
          fail("E5 speed warnStabilizeRamp (bonus): chống rung + curve", `warns=${JSON.stringify(sp ? sp.warns : null)} (kỳ vọng exact "${EXPECT.warnStabilizeRamp}")`);
        }
        fs.writeFileSync(path.join(SCRATCH, "r10-measure-speed-stabilize.json"), JSON.stringify(sp, null, 2));
        await cdp.shot("r10-speed-stabilize.png");
      } catch (e) {
        fail("E5 speed warnStabilizeRamp (bonus): chống rung + curve", `ERROR: ${String((e && e.stack) || e).slice(0, 400)}`);
      }
      await drainErrors(cdp);
      // Dọn SpeedPanel: gỡ curve + enhance + warn.
      await patchV1Clip(cdp, 0, JSON.stringify({ speedKeyframes: undefined, enhance: undefined, reverse: false }));
      await cdp.evalJs(`(( ) => { const b = [...document.querySelectorAll(".speed-panel .speed-presets button")].find((x) => (x.textContent || "").trim() === "1×"); if (b) b.click(); return true; })()`);
      await sleep(600);
    }

    // ================= (e) Sticker errWebp =================
    try {
      await cdp.evalJs(`(async () => {
        const mod = window.__r10storeMod || (window.__r10storeMod = await import("/src/store.ts"));
        mod.useStore.getState().select(null);
        return true;
      })()`);
      await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector(".sticker-panel")`).catch(() => false), "StickerPanel hiện (không chọn clip)", 30000);
      const sent = await cdp.evalJs(`(async () => {
        const buf = await (await fetch("http://127.0.0.1:${STATIC_PORT}/anim-test.webp")).arrayBuffer();
        const file = new File([buf], "anim-test.webp", { type: "image/webp" });
        const input = document.querySelector(".sticker-panel input[type=file]");
        if (!input) return { ok: false, why: "no file input" };
        const dt = new DataTransfer();
        dt.items.add(file);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "files").set;
        setter.call(input, dt.files);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return { ok: true, size: file.size };
      })()`);
      if (!sent.ok) {
        fail("E6 sticker errWebp: upload WebP động thật", `không gửi được file webp: ${sent.why}`);
      } else {
        const w = await cdp.waitFor(async () => {
          const m = await cdp.evalJs(STICKER_WARN_FN).catch(() => null);
          return m && m.text.includes("Animated WebP") ? m : null;
        }, "sticker .warn errWebp hiện sau upload webp động", 30000).catch(() => null);
        if (w && w.text === EXPECT.errWebp && w.color === "rgb(245, 180, 83)" && w.fontSize === "12px") {
          pass("E6 sticker errWebp: upload WebP động thật", `warn exact "${w.text}", màu #f5b453 12px (file anim-test.webp 262 byte, 2 frame, có ANMF)`);
        } else {
          fail("E6 sticker errWebp: upload WebP động thật", `warn=${JSON.stringify(w)} (kỳ vọng exact "${EXPECT.errWebp}")`);
        }
        fs.writeFileSync(path.join(SCRATCH, "r10-measure-sticker-webp.json"), JSON.stringify(w, null, 2));
        await cdp.shot("r10-sticker-webp.png");
      }
      await drainErrors(cdp);
    } catch (e) {
      fail("E6 sticker errWebp: upload WebP động thật", `ERROR: ${String((e && e.stack) || e).slice(0, 400)}`);
      await drainErrors(cdp).catch(() => {});
    }

    // ================= (d) Nút proxy bấm thật =================
    try {
      const proxiesDir = path.join(BRIDGE_WORK_DIR, "proxies");
      const beforeList = fs.existsSync(proxiesDir) ? fs.readdirSync(proxiesDir) : [];
      const imp = await cdp.evalJs(`(async () => {
        const buf = await (await fetch("http://127.0.0.1:${STATIC_PORT}/r4-test.mp4")).arrayBuffer();
        const file = new File([buf], "r4-test.mp4", { type: "video/mp4" });
        const mod = window.__r10storeMod || (window.__r10storeMod = await import("/src/store.ts"));
        const st = mod.useStore.getState();
        await st.importFiles([file]);
        const item = mod.useStore.getState().media.find((m) => m.name === "r4-test.mp4");
        if (!item) return { ok: false, why: "importFiles xong mà media không có r4-test.mp4" };
        return { ok: true, kind: item.kind, duration: item.duration, hasFile: !!item.file, proxyUrl: item.proxyUrl || null };
      })()`);
      if (!imp.ok) {
        fail("D1 proxy: bấm nút tạo proxy thật (bridge chạy)", `không import được MP4: ${imp.why}`);
      } else if (imp.proxyUrl) {
        fail("D1 proxy: bấm nút tạo proxy thật (bridge chạy)", `MP4 vừa import đã có sẵn proxyUrl=${imp.proxyUrl} (auto-proxy đã tạo trước — không đo được cú bấm tay)`);
      } else {
        log(`D1: MP4 đã import: ${JSON.stringify(imp)}`);
        await cdp.waitFor(async () => cdp.evalJs(`!!document.querySelector(".media-proxy")`).catch(() => false), "nút .media-proxy hiện", 60000);
        // MediaBin cũng là panel cuộn được — cuộn nút proxy của đúng card
        // vào giữa vùng nhìn trước khi đọc rect/bấm (bài học lượt chạy 1).
        await scrollBtnIntoView(cdp, `(() => { const cards = [...document.querySelectorAll(".media-card")]; const card = cards.find((c) => (c.querySelector(".media-name") || {}).textContent === "r4-test.mp4"); return card ? card.querySelector(".media-proxy") : null; })()`);
        const card0 = await cdp.evalJs(PROXY_CARD_FN("r4-test.mp4"));
        if (!card0 || !card0.btnRect) {
          fail("D1 proxy: bấm nút tạo proxy thật (bridge chạy)", `không thấy nút proxy của card r4-test.mp4 (card=${JSON.stringify(card0)})`);
        } else {
          const t0 = Date.now();
          await cdp.click(card0.btnRect.x, card0.btnRect.y);
          // Poll store tới khi proxyUrl xuất hiện (ffmpeg tạo proxy).
          const done = await cdp.waitFor(async () => {
            const st = await cdp.evalJs(STORE_FN).catch(() => null);
            const item = st ? st.media.find((m) => m.name === "r4-test.mp4") : null;
            return item && item.proxyUrl ? item : null;
          }, "proxyUrl xuất hiện sau khi bấm nút proxy", 120000).catch(() => null);
          const elapsedMs = Date.now() - t0;
          const card1 = await cdp.evalJs(PROXY_CARD_FN("r4-test.mp4"));
          const afterList = fs.existsSync(proxiesDir) ? fs.readdirSync(proxiesDir) : [];
          const newFiles = afterList.filter((f) => !beforeList.includes(f));
          let headOk = false;
          if (done && done.proxyUrl) {
            try { const r = await fetch(done.proxyUrl, { method: "HEAD" }); headOk = r.ok; } catch { headOk = false; }
          }
          const toast = await cdp.evalJs(`(() => { const t = [...document.querySelectorAll(".toast")].map((e) => e.textContent || ""); return t; })()`).catch(() => []);
          fs.writeFileSync(path.join(SCRATCH, "r10-measure-proxy.json"), JSON.stringify({ done, cardAfter: card1, newFiles, headOk, toast, elapsedMs }, null, 2));
          await cdp.shot("r10-proxy-after.png");
          const problems = [];
          if (!done) problems.push("proxyUrl không xuất hiện sau 120s");
          if (done && done.proxyHeight !== 720) problems.push(`proxyHeight=${done.proxyHeight} (kỳ vọng 720)`);
          if (!card1 || !card1.badge || !/^PROXY 720p/.test(card1.badge)) problems.push(`badge không hiện PROXY 720p (badge=${card1 ? JSON.stringify(card1.badge) : "không thấy card"})`);
          if (!headOk) problems.push("HEAD proxyUrl không 200");
          if (newFiles.length === 0) problems.push("thư mục proxies của bridge không có file mới");
          await drainErrors(cdp);
          if (problems.length) fail("D1 proxy: bấm nút tạo proxy thật (bridge chạy)", `${problems.join(" || ")} — sau ${elapsedMs}ms, proxyUrl=${done ? done.proxyUrl : "?"}, toast=${JSON.stringify(toast)}`);
          else pass("D1 proxy: bấm nút tạo proxy thật (bridge chạy)", `proxy tạo xong sau ${elapsedMs}ms: ${done.proxyUrl} (720p), badge "${card1.badge}", HEAD 200, file mới trên đĩa bridge: ${newFiles.join(", ")}, toast=${JSON.stringify(toast)}`);
        }
      }
      await drainErrors(cdp);
    } catch (e) {
      fail("D1 proxy: bấm nút tạo proxy thật (bridge chạy)", `ERROR: ${String((e && e.stack) || e).slice(0, 400)}`);
      await drainErrors(cdp).catch(() => {});
    }

    // ================= (a) Timeout recordPackMedia headed thật =============
    try {
      await setLocale(cdp, "vi");
      await setViewport(cdp, 1280, 720, false);
      const injected = await cdp.evalJs(INJECT_HANG_RECORDER);
      log(`(a) fake MediaRecorder treo: ${injected}`);
      // Mở WelcomeModal lại từ TopBar rồi vào TemplatePackModal.
      const reopened = await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("title") || "") === "Mở lại màn chào / tour / template pack 1 chạm"); if (!b) return false; b.click(); return true; })()`);
      if (!reopened) {
        fail("A1 recordPackMedia timeout headed: modal báo pack.recordTimeout", "không thấy nút TopBar mở lại WelcomeModal");
      } else {
        await cdp.waitFor(async () => { const s = await cdp.evalJs(STATE_FN).catch(() => null); return s && s.welcome ? s : null; }, "WelcomeModal mở lại", 30000);
        const packBtn = await cdp.evalJs(BTN_RECT_FN("Tạo video 1 chạm"));
        if (!packBtn) {
          fail("A1 recordPackMedia timeout headed: modal báo pack.recordTimeout", 'không thấy nút "⚡ Tạo video 1 chạm" trong WelcomeModal');
        } else {
          await cdp.click(packBtn.x, packBtn.y);
          await cdp.waitFor(async () => { const s = await cdp.evalJs(STATE_FN).catch(() => null); return s && s.pack && !s.welcome ? s : null; }, "TemplatePackModal hiện", 30000);
          const pack0 = await cdp.evalJs(PACK_FN);
          log(`(a) pack rows: ${JSON.stringify((pack0 ? pack0.rows : []).map((r) => r.text.slice(0, 60)))}`);
          const intro = pack0 ? pack0.rows.find((r) => r.text.includes("Intro YouTube")) : null;
          if (!intro || !intro.btnRect || intro.btnDisabled) {
            fail("A1 recordPackMedia timeout headed: modal báo pack.recordTimeout", `không thấy/bấm được pack "Intro YouTube" (rows=${JSON.stringify(pack0 ? pack0.rows.map((r) => r.text.slice(0, 40)) : null)})`);
          } else {
            const expectedErr = VI.pack.recordTimeout;
            const t0 = Date.now();
            await cdp.click(intro.btnRect.x, intro.btnRect.y);
            let packErr = null;
            for (let i = 0; i < 120; i++) {
              const p = await cdp.evalJs(PACK_FN).catch(() => null);
              if (p && p.error) { packErr = p; break; }
              await sleep(500);
            }
            const elapsedMs = Date.now() - t0;
            fs.writeFileSync(path.join(SCRATCH, "r10-measure-pack-timeout.json"), JSON.stringify({ elapsedMs, packErr, expectedErr }, null, 2));
            await cdp.shot("r10-pack-timeout.png");
            const problems = [];
            if (!packErr) problems.push("không thấy lỗi trong modal sau 60s");
            else {
              if (packErr.error !== expectedErr) problems.push(`lỗi hiện khác chuỗi dict: "${(packErr.error || "").slice(0, 80)}..." (kỳ vọng exact pack.recordTimeout)`);
              if (packErr.busy) problems.push("modal vẫn busy sau khi báo lỗi (chưa mở khóa)");
              if (packErr.closeDisabled) problems.push("nút ✕ vẫn disabled sau khi báo lỗi");
              if (!packErr.hangRec || packErr.hangRec.stopCalls < 1) problems.push(`recorder treo không bị stop() bởi timeout handler (hangRec=${JSON.stringify(packErr.hangRec)})`);
            }
            // Timeout mặc định pack 5s = max(20s, 20s) = 20000ms; cho dung
            // sai ±5s (poll 500ms + overhead tạo pack).
            if (packErr && (elapsedMs < 15000 || elapsedMs > 25000)) problems.push(`thời gian tới lỗi ${elapsedMs}ms nằm ngoài khoảng kỳ vọng 15000–25000ms`);
            await drainErrors(cdp);
            if (problems.length) {
              fail("A1 recordPackMedia timeout headed: modal báo pack.recordTimeout", `${problems.join(" || ")} — sau ${elapsedMs}ms`);
            } else {
              pass("A1 recordPackMedia timeout headed: modal báo pack.recordTimeout", `lỗi hiện exact chuỗi vi pack.recordTimeout sau ${elapsedMs}ms (kỳ vọng 20000ms), recorder treo bị stop() ${packErr.hangRec.stopCalls} lần, modal mở khóa (busy=false, ✕ enabled)`);
              // Mở khóa thật: Escape phải đóng được modal sau lỗi.
              await cdp.key("Escape", "Escape");
              const afterEsc = await cdp.evalJs(STATE_FN);
              if (!afterEsc.pack) pass("A2 sau timeout: Escape đóng được modal (mở khóa thật)", "sau Escape: pack=false — finally reset busy hoạt động");
              else fail("A2 sau timeout: Escape đóng được modal (mở khóa thật)", `sau Escape modal VẪN MỞ (pack=${afterEsc.pack})`);
              await cdp.shot("r10-pack-timeout-after-escape.png");
            }
          }
          await ensureNoModal(cdp);
        }
      }
      // Khôi phục MediaRecorder thật cho phiên (dù harness sắp tắt).
      await cdp.evalJs(`(() => { if (window.__realMediaRecorder) window.MediaRecorder = window.__realMediaRecorder; window.__r10hangInstalled = false; return true; })()`).catch(() => {});
      await drainErrors(cdp);
    } catch (e) {
      fail("A1 recordPackMedia timeout headed: modal báo pack.recordTimeout", `ERROR: ${String((e && e.stack) || e).slice(0, 400)}`);
      await cdp.evalJs(`(() => { if (window.__realMediaRecorder) window.MediaRecorder = window.__realMediaRecorder; window.__r10hangInstalled = false; return true; })()`).catch(() => {});
      await drainErrors(cdp).catch(() => {});
    }

    // ---- H9: 0 lỗi trang trong phiên -------------------------------------
    const allErrs = phaseErrors;
    fs.writeFileSync(path.join(SCRATCH, "r10-report.json"), JSON.stringify({ results, phaseErrors: allErrs, at: new Date().toISOString() }, null, 2));
    fs.writeFileSync(path.join(SCRATCH, "r10-log.txt"), logLines.join("\n") + "\n");
    if (allErrs.length === 0) pass("H9 0 lỗi trang trong phiên", "window.onerror / unhandledrejection = 0 trong toàn bộ phiên đo");
    else fail("H9 0 lỗi trang trong phiên", `${allErrs.length} lỗi: ${allErrs.slice(0, 5).join(" | ")}`);

    const failed = results.filter((r) => !r.ok);
    log(`\n=== KẾT QUẢ: ${results.length - failed.length}/${results.length} PASS ===`);
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name}`);
    killAll();
    process.exit(failed.length ? 1 : 0);
  } catch (e) {
    log("HARNESS ERROR: " + (e && e.stack || e));
    try { fs.writeFileSync(path.join(SCRATCH, "r10-log.txt"), logLines.join("\n") + "\n"); } catch {}
    killAll();
    process.exit(2);
  }
}

main();
