#!/usr/bin/env node
/**
 * clicktest-62r2-speed-curve-stabblock.mjs — Phase 9 đợt 62, luồng R2: chặn
 * bật speed curve ở UI khi clip đang có stabilize (đóng nợ đợt 61 §5.2 —
 * "cảnh báo ở SpeedPanel", hiện chỉ chặn từ phía EnhancePanel).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-61r2-enhance-speedblock.mjs.
 * KHÔNG sửa code sản phẩm (mọi sửa đã làm trước khi chạy).
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   B0 setup: mount → modal chào đóng → project mẫu tự load (3 clip) →
 *        click clip video đầu → Inspector hiện SpeedPanel + EnhancePanel;
 *        nút "Bật đường cong tốc độ" MỞ, chưa có cảnh báo chặn, clip chưa
 *        có stabilize/curve.
 *   B1 bật stabilize bằng chuột thật (checkbox chống rung) → nút bật curve
 *        bị DISABLED, dòng cảnh báo [data-testid="speed-curve-stab-blocked"]
 *        hiện (chứa "chống rung"), title nút chứa "chống rung".
 *   B2 bấm nút bật curve đang disabled bằng chuột thật → store clip vẫn
 *        KHÔNG có speedKeyframes (không tạo trạng thái lỗi mới được).
 *   B3 đường sửa: tắt stabilize bằng chuột thật → nút bật curve mở lại,
 *        cảnh báo chặn biến mất → bấm nút bật curve → speedKeyframes 2 điểm
 *        được tạo thật, preset Cân bằng/Mạnh ở EnhancePanel bị chặn (đối
 *        xứng đợt 61 R2 vẫn đúng).
 *   B4 trạng thái lỗi CŨ (không còn tạo được bằng UI sau B1 — mô phỏng file
 *        project cũ / MCP / CLI bằng patchClip trực tiếp qua store, CHỈ là
 *        setup, mọi thao tác kiểm chứng vẫn là chuột thật): clip có cả
 *        stabilize + speed curve → cảnh báo speed.warnStabilizeRamp hiện,
 *        NHƯNG checkbox chống rung vẫn MỞ để sửa; bấm checkbox (chuột thật)
 *        → stabilize bị gỡ, cảnh báo conflict biến mất.
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-62r2-speed-curve-stabblock.mjs
 * Env: R2_DEV_PORT (mặc định tự chọn 5550–5559), R2_DEBUG_PORT (9650–9659),
 * R2_DISPLAY (mặc định quét :190–:199 — display RIÊNG của R2 đợt 62, không
 * dùng chung với đợt 61), R2_SCRATCH (mặc định hidden_files/round62-r2/headed).
 * TMPDIR riêng /tmp/round62-r2/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R2_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round62-r2", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round62-r2";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r2.config.mjs");

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
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__r2errors = [];
  window.addEventListener("error", (e) => { try { window.__r2errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r2errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r2errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r2errors.push("unhandledrejection: <?>"); } });
})()`;

// Đọc store thật mà app đã nạp (mẫu Q1/P8/R2-61): chỉ dùng để ĐỌC state, mọi
// thao tác dưới test đều là chuột/phím thật qua CDP — TRỪ setup B4 (mô phỏng
// file project cũ/MCP/CLI tạo trạng thái lỗi, vì UI nay không tạo được nữa).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r2storeMod || (window.__r2storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Trạng thái SpeedPanel + EnhancePanel thật từ store + DOM.
const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
    hasSpeedRamp: c.speedKeyframes !== undefined,
    speedKfs: c.speedKeyframes ? c.speedKeyframes.keyframes.length : 0,
  });
  const sel = document.querySelector('[data-testid="enhance-preset"]');
  const opt = (v) => { const o = sel?.querySelector('option[value="' + v + '"]'); return o ? { disabled: o.disabled } : null; };
  const stab = document.querySelector('[data-testid="enhance-stabilize-toggle"]');
  const curveBtn = document.querySelector('[data-testid="speed-curve-enable-btn"]');
  const stabBlock = document.querySelector('[data-testid="speed-curve-stab-blocked"]');
  // Cảnh báo conflict stabilize+ramp (dòng "render sẽ bị chặn" trong
  // SpeedPanel, khác dòng chặn-bật-curve mới).
  const stabWarn = [...document.querySelectorAll(".speed-panel .warn")].find((p) => p.textContent.includes("render sẽ bị chặn"));
  return {
    clips,
    selection: st.selection,
    enhancePreset: sel ? sel.value : null,
    presetVisible: !!sel,
    optBalanced: opt("balanced"), optStrong: opt("strong"),
    stabChecked: stab ? stab.checked : null,
    stabDisabled: stab ? stab.disabled : null,
    curveEnableVisible: !!curveBtn,
    curveEnableDisabled: curveBtn ? curveBtn.disabled : null,
    curveEnableTitle: curveBtn ? (curveBtn.getAttribute("title") || "") : "",
    stabBlockedVisible: !!stabBlock,
    stabBlockedText: stabBlock ? stabBlock.textContent : "",
    curveDisableVisible: !!document.querySelector(".curve-disable-btn"),
    stabSpeedWarnVisible: !!stabWarn,
    stabSpeedWarnText: stabWarn ? stabWarn.textContent : "",
    errors: (window.__r2errors || []).slice(),
  };
})()`;

// Hình học thật của clip để tính tọa độ click (mẫu Q1/P8).
const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

// Tọa độ click thật cho 1 selector (cuộn vào giữa khung nhìn trước, mẫu Q1).
const CLICK_FN = (selector) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const b = el.getBoundingClientRect();
  const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, coveredBy: at === el || el.contains(at) ? null : (at?.tagName + "." + (at?.className || "")) };
})()`;

// Setup B4: tạo trạng thái lỗi CŨ (stabilize + speed curve) qua patchClip
// trực tiếp — mô phỏng file project cũ / MCP / CLI, vì UI nay không tạo
// được trạng thái này nữa (đó chính là điều B1/B2 kiểm chứng). CHỈ là setup.
const INJECT_LEGACY_FN = (trackId, clipId) => `(async () => {
  const st = await (${STORE_FN});
  const clip = st.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)})?.clips.find((c) => c.id === ${JSON.stringify(clipId)});
  if (!clip) return { ok: false, why: "không tìm thấy clip" };
  const end = Math.round(clip.duration * 10) / 10;
  st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, {
    enhance: { stabilize: { smoothing: 10 } },
    speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: end, v: 1, easing: "linear" }] },
  });
  return { ok: true };
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
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r2errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r2errors = []`).catch(() => {});
    return e;
  }

  // Bấm 1 element bằng chuột thật (theo selector; cuộn vào giữa trước).
  async function clickEl(cdp, selector, label) {
    const g = await cdp.evalJs(CLICK_FN(selector));
    if (!g) throw new Error(`không tìm thấy ${selector} (${label})`);
    if (g.coveredBy) log(`cảnh báo: ${selector} bị che bởi ${g.coveredBy} tại điểm bấm — vẫn thử bấm`);
    await cdp.click(g.x, g.y);
    await sleep(600);
  }

  try {
    const DEV_PORT = Number(process.env.R2_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
    const DEBUG_PORT = Number(process.env.R2_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 190; n <= 199; n++) {
        const d = `:${n}`;
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = process.env.R2_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :190–:199");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round62-r2/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r2-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r2-chrome.log"), "w");
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
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");

    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- B0: project mẫu tự load; chọn clip video đầu ---------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 ? t : null;
    }, "project mẫu tự load (3 clip)", 180000);
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (B0)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    const sSel = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.enhancePreset === "off" && t.presetVisible && t.curveEnableVisible ? t : null;
    }, "Inspector hiện section Tăng cường + SpeedPanel, nút bật curve hiện", 60000);
    const firstClipId = sSel.clips.find((c) => c.trackId === "v1").clipId;
    await drainErrors(cdp);
    const b0ok = sSel.clips.find((c) => c.clipId === firstClipId).enhance === null
      && sSel.clips.find((c) => c.clipId === firstClipId).hasSpeedRamp === false
      && sSel.stabBlockedVisible === false
      && sSel.curveEnableDisabled === false
      && sSel.stabChecked === false
      && sSel.optBalanced && sSel.optBalanced.disabled === false;
    if (b0ok) {
      pass("B0 setup: mẫu load, clip chưa enhance/ramp, nút bật curve MỞ", `clip ${firstClipId} enhance=null hasSpeedRamp=false; nút bật curve enabled, chưa có cảnh báo chặn, preset balanced mở`);
    } else {
      fail("B0 setup: mẫu load, clip chưa enhance/ramp, nút bật curve MỞ", `state=${JSON.stringify(sSel)}`);
    }
    await cdp.shot("r2-b0-baseline.png");

    // ---- B1: bật stabilize bằng chuột thật → nút bật curve bị tắt ---------
    await clickEl(cdp, '[data-testid="enhance-stabilize-toggle"]', "B1 bật chống rung");
    const s1 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && c.enhance && c.enhance.stabilize && t.curveEnableDisabled === true && t.stabBlockedVisible ? t : null;
    }, "stabilize bật + nút bật curve disabled + cảnh báo chặn hiện", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c1 = s1.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    const b1ok = c1 && c1.enhance && c1.enhance.stabilize && c1.enhance.stabilize.smoothing === 10
      && s1.curveEnableDisabled === true
      && s1.stabBlockedVisible && s1.stabBlockedText.includes("chống rung")
      && s1.curveEnableTitle.includes("chống rung");
    if (b1ok) {
      pass("B1 bật stabilize: nút bật curve bị tắt + cảnh báo hiện", `stabilize smoothing 10; nút bật curve disabled, cảnh báo: "${s1.stabBlockedText.slice(0, 60)}…"; title nút chứa "chống rung"`);
    } else {
      fail("B1 bật stabilize: nút bật curve bị tắt + cảnh báo hiện", `clip=${JSON.stringify(c1)}, state=${JSON.stringify(s1)}`);
    }
    await cdp.shot("r2-b1-curve-blocked.png");

    // ---- B2: bấm nút bật curve đang disabled bằng chuột thật ---------------
    await clickEl(cdp, '[data-testid="speed-curve-enable-btn"]', "B2 bấm nút bật curve disabled");
    const s2 = await cdp.evalJs(STATE_FN);
    const c2 = s2.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    if (c2.hasSpeedRamp === false && c2.speedKfs === 0 && s2.curveEnableVisible) {
      pass("B2 bấm nút disabled: không tạo speed curve mới được", `store vẫn hasSpeedRamp=false, 0 keyframe sau cú click chuột thật`);
    } else {
      fail("B2 bấm nút disabled: không tạo speed curve mới được", `clip=${JSON.stringify(c2)}`);
    }

    // ---- B3: đường sửa — tắt stabilize → nút mở lại → bật curve được ------
    await clickEl(cdp, '[data-testid="enhance-stabilize-toggle"]', "B3 tắt chống rung");
    const s3a = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && !c.enhance?.stabilize && t.curveEnableDisabled === false && !t.stabBlockedVisible ? t : null;
    }, "tắt stabilize: nút bật curve mở lại + cảnh báo chặn biến mất", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    await clickEl(cdp, '[data-testid="speed-curve-enable-btn"]', "B3 bật speed curve");
    const s3b = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && c.hasSpeedRamp && c.speedKfs === 2 && t.optBalanced && t.optBalanced.disabled === true ? t : null;
    }, "bật curve: speedKeyframes 2 điểm + preset Cân bằng bị chặn (đợt 61)", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c3b = s3b.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    const b3ok = s3a && s3a.curveEnableDisabled === false && !s3a.stabBlockedVisible
      && c3b && c3b.hasSpeedRamp && c3b.speedKfs === 2
      && s3b.optBalanced && s3b.optBalanced.disabled === true
      && s3b.optStrong && s3b.optStrong.disabled === true;
    if (b3ok) {
      pass("B3 đường sửa: tắt stabilize → bật curve được, preset Cân bằng/Mạnh bị chặn", `tắt stabilize → nút mở lại, cảnh báo biến mất; bật curve → speedKeyframes 2 điểm; preset balanced/strong disabled (chặn đợt 61 vẫn đúng)`);
    } else {
      fail("B3 đường sửa: tắt stabilize → bật curve được, preset Cân bằng/Mạnh bị chặn", `s3a=${JSON.stringify(s3a)} s3b=${JSON.stringify(s3b)}`);
    }
    await cdp.shot("r2-b3-repair-path.png");

    // ---- B4: trạng thái lỗi CŨ (setup qua store) vẫn sửa được --------------
    // Tắt curve trước để setup sạch, rồi inject trạng thái lỗi cũ.
    await clickEl(cdp, ".curve-disable-btn", "B4 tắt speed curve trước khi inject");
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && !c.hasSpeedRamp ? t : null;
    }, "tắt curve trước khi inject", 60000);
    const inj = await cdp.evalJs(INJECT_LEGACY_FN("v1", firstClipId));
    if (!inj.ok) throw new Error(`inject trạng thái lỗi cũ thất bại: ${inj.why}`);
    const s4a = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && c.hasSpeedRamp && c.enhance && c.enhance.stabilize && t.stabSpeedWarnVisible && t.stabDisabled === false ? t : null;
    }, "lỗi cũ tái hiện: cảnh báo conflict + checkbox chống rung vẫn mở", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    // Bấm checkbox chống rung (chuột thật) để tắt stabilize sửa lỗi.
    await clickEl(cdp, '[data-testid="enhance-stabilize-toggle"]', "B4 tắt chống rung sửa lỗi");
    const s4b = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      // enhance có thể null hẳn (stabilize là key cuối bị gỡ) — dùng ?. để
      // không kẹt 60s chờ enhance truthy (lỗi harness lần chạy 1).
      return t && c && !c.enhance?.stabilize && !t.stabSpeedWarnVisible ? t : null;
    }, "tắt stabilize: hết conflict", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c4b = s4b.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    const b4ok = s4a && s4a.stabSpeedWarnVisible && s4a.stabDisabled === false
      && c4b && !c4b.enhance?.stabilize && c4b.hasSpeedRamp
      && s4b && !s4b.stabSpeedWarnVisible;
    if (b4ok) {
      pass("B4 trạng thái lỗi cũ vẫn sửa được: checkbox mở để tắt khi đang bật", `inject stabilize+curve → cảnh báo "render sẽ bị chặn" hiện nhưng checkbox VẪN MỞ; bấm checkbox → stabilize gỡ (enhance=${JSON.stringify(c4b.enhance)}), cảnh báo conflict biến mất (curve còn bật)`);
    } else {
      fail("B4 trạng thái lỗi cũ vẫn sửa được: checkbox mở để tắt khi đang bật", `s4a=${JSON.stringify(s4a)} s4b=${JSON.stringify(s4b)}`);
    }
    await cdp.shot("r2-b4-legacy-repair.png");

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "r2-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED R2: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
