#!/usr/bin/env node
/**
 * clicktest-61r2-enhance-speedblock.mjs — Phase 9 đợt 61, luồng R2: chặn
 * preset stabilize ở UI khi clip có speedKeyframes (đóng nợ đợt 60 §5.2 D,
 * hướng (i) — chặn ở UI, KHÔNG fallback render).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-60q1-enhance-preview.mjs.
 * KHÔNG sửa code sản phẩm (mọi sửa đã làm trước khi chạy).
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   B0 setup: mount → modal chào đóng → project mẫu tự load (3 clip) →
 *        click clip video đầu → Inspector hiện section Tăng cường, select
 *        preset ở "off", chưa có cảnh báo speed, checkbox chống rung mở.
 *   B1 bật speed curve: bấm chuột thật vào nút "Bật speed curve" trong
 *        SpeedPanel → store clip có speedKeyframes (2 điểm); panel Tăng
 *        cường hiện dòng cảnh báo [data-testid="enhance-preset-speed-blocked"]
 *        (chữ chứa "speed"); option preset balanced/strong bị disabled,
 *        light/off vẫn mở; checkbox chống rung bị disabled.
 *   B2 bấm checkbox chống rung đang disabled bằng chuột thật → store
 *        clip.enhance vẫn null (không bật mới được).
 *   B3 chọn preset Nhẹ bằng phím thật (focus select, ArrowDown 1, Enter) →
 *        store enhance == { denoise: { strength: 0.3 } }, select hiện "light".
 *   B4 cố chọn Cân bằng/Mạnh bằng phím thật (từ light, ArrowDown 3, Enter) →
 *        select KHÔNG rơi vào balanced/strong (chỉ off/light), store không
 *        có stabilize — phím điều hướng bỏ qua option disabled.
 *   B5 sửa trạng thái lỗi cũ: tắt speed curve → cảnh báo biến mất, checkbox
 *        chống rung mở lại; bấm checkbox chống rung (chuột thật) → stabilize
 *        bật; bật lại speed curve → trạng thái lỗi cũ tái hiện (cả stabilize
 *        + speed curve): cảnh báo stabSpeedConflict hiện, NHƯNG checkbox
 *        chống rung vẫn MỞ để sửa; bấm checkbox (chuột thật) → stabilize bị
 *        gỡ, enhance còn { denoise: 0.3 }, cảnh báo conflict biến mất (cảnh
 *        báo preset-blocked vẫn hiện đúng vì curve còn bật).
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-61r2-enhance-speedblock.mjs
 * Env: R2_DEV_PORT (mặc định tự chọn 5530–5539), R2_DEBUG_PORT (9630–9639),
 * R2_DISPLAY (mặc định quét :180–:189 — display RIÊNG của R2, không dùng
 * chung), R2_SCRATCH (mặc định hidden_files/round61-r2/headed). TMPDIR riêng
 * /tmp/round61-r2/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R2_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r2", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round61-r2";
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
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__r2errors = [];
  window.addEventListener("error", (e) => { try { window.__r2errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r2errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r2errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r2errors.push("unhandledrejection: <?>"); } });
})()`;

// Đọc store thật mà app đã nạp (mẫu Q1/P8): chỉ dùng để ĐỌC state, mọi thao
// tác dưới test đều là chuột/phím thật qua CDP.
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r2storeMod || (window.__r2storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Trạng thái Enhance + speed curve thật từ store + DOM.
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
  const warn = document.querySelector('[data-testid="enhance-preset-speed-blocked"]');
  // Cảnh báo conflict stabilize+ramp: dòng "render sẽ bị chặn" (khác dòng
  // preset-blocked — cả hai đều chứa "speedKeyframes" nên không dùng chuỗi
  // đó để nhận diện).
  const stabWarn = [...document.querySelectorAll(".tips")].find((p) => p.textContent.includes("render sẽ bị chặn"));
  return {
    clips,
    selection: st.selection,
    enhancePreset: sel ? sel.value : null,
    presetVisible: !!sel,
    presetTitle: sel ? (sel.getAttribute("title") || "") : "",
    optOff: opt("off"), optLight: opt("light"), optBalanced: opt("balanced"), optStrong: opt("strong"),
    stabChecked: stab ? stab.checked : null,
    stabDisabled: stab ? stab.disabled : null,
    stabTitle: stab ? (stab.getAttribute("title") || "") : "",
    speedWarnVisible: !!warn,
    speedWarnText: warn ? warn.textContent : "",
    stabSpeedWarnVisible: !!stabWarn,
    stabSpeedWarnText: stabWarn ? stabWarn.textContent : "",
    curveEnableVisible: !!document.querySelector(".curve-enable-btn"),
    curveDisableVisible: !!document.querySelector(".curve-disable-btn"),
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
    const DEV_PORT = Number(process.env.R2_DEV_PORT || 0) || (await pickFreePort(5530, 5539));
    const DEBUG_PORT = Number(process.env.R2_DEBUG_PORT || 0) || (await pickFreePort(9630, 9639));
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
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = process.env.R2_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :180–:189");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5530–5539");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9630–9639");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round61-r2/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
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
      return t && t.enhancePreset === "off" && t.presetVisible ? t : null;
    }, "Inspector hiện section Tăng cường, select preset ở off", 60000);
    const firstClipId = sSel.clips.find((c) => c.trackId === "v1").clipId;
    await drainErrors(cdp);
    const b0ok = sSel.clips.find((c) => c.clipId === firstClipId).enhance === null
      && sSel.clips.find((c) => c.clipId === firstClipId).hasSpeedRamp === false
      && sSel.speedWarnVisible === false && sSel.stabDisabled === false
      && sSel.stabChecked === false
      && sSel.optBalanced && sSel.optBalanced.disabled === false
      && sSel.optStrong && sSel.optStrong.disabled === false;
    if (b0ok) {
      pass("B0 setup: mẫu load, clip chưa enhance/ramp, preset + checkbox mở", `clip ${firstClipId} enhance=null hasSpeedRamp=false; preset off, balanced/strong enabled, stabilize checkbox enabled+unchecked, chưa có cảnh báo`);
    } else {
      fail("B0 setup: mẫu load, clip chưa enhance/ramp, preset + checkbox mở", `state=${JSON.stringify(sSel)}`);
    }
    await cdp.shot("r2-b0-baseline.png");

    // ---- B1: bật speed curve bằng chuột thật -------------------------------
    await clickEl(cdp, ".curve-enable-btn", "B1 bật speed curve");
    const s1 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && c.hasSpeedRamp && c.speedKfs === 2 && t.speedWarnVisible ? t : null;
    }, "speedKeyframes có 2 điểm + cảnh báo preset-speed hiện", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c1 = s1.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    const b1ok = c1 && c1.hasSpeedRamp && c1.speedKfs === 2
      && s1.speedWarnVisible && s1.speedWarnText.includes("speed")
      && s1.optBalanced && s1.optBalanced.disabled === true
      && s1.optStrong && s1.optStrong.disabled === true
      && s1.optLight && s1.optLight.disabled === false
      && s1.optOff && s1.optOff.disabled === false
      && s1.stabDisabled === true
      && s1.presetTitle.includes("speed");
    if (b1ok) {
      pass("B1 bật speed curve: preset Cân bằng/Mạnh + checkbox chống rung bị tắt", `speedKeyframes 2 điểm; cảnh báo hiện: "${s1.speedWarnText.slice(0, 60)}…"; balanced/strong disabled, light/off mở, stabilize checkbox disabled, title select chứa "speed"`);
    } else {
      fail("B1 bật speed curve: preset Cân bằng/Mạnh + checkbox chống rung bị tắt", `clip=${JSON.stringify(c1)}, state=${JSON.stringify(s1)}`);
    }
    await cdp.shot("r2-b1-ramp-blocked.png");

    // ---- B2: bấm checkbox chống rung đang disabled bằng chuột thật ---------
    await clickEl(cdp, '[data-testid="enhance-stabilize-toggle"]', "B2 bấm checkbox disabled");
    const s2 = await cdp.evalJs(STATE_FN);
    const c2 = s2.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    if (c2.enhance === null && s2.stabChecked === false) {
      pass("B2 bấm checkbox disabled: không bật mới được", `store enhance vẫn null, checkbox vẫn unchecked sau cú click chuột thật`);
    } else {
      fail("B2 bấm checkbox disabled: không bật mới được", `enhance=${JSON.stringify(c2.enhance)}, stabChecked=${s2.stabChecked}`);
    }

    // ---- B3: chọn preset Nhẹ bằng phím thật --------------------------------
    await cdp.evalJs(`document.querySelector('[data-testid="enhance-preset"]').focus()`);
    await cdp.key("ArrowDown", "ArrowDown");
    await cdp.key("Enter", "Enter");
    const s3 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && t.enhancePreset === "light" && c && c.enhance && c.enhance.denoise && c.enhance.denoise.strength === 0.3 ? t : null;
    }, "preset light + store denoise 0.3", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c3 = s3.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    if (s3.enhancePreset === "light" && c3.enhance && c3.enhance.denoise && c3.enhance.denoise.strength === 0.3 && !c3.enhance.stabilize) {
      pass("B3 preset Nhẹ vẫn chọn được bằng phím thật", `enhance=${JSON.stringify(c3.enhance)}, select hiện "light"`);
    } else {
      fail("B3 preset Nhẹ vẫn chọn được bằng phím thật", `preset=${s3.enhancePreset}, enhance=${JSON.stringify(c3.enhance)}`);
    }

    // ---- B4: cố chọn Cân bằng/Mạnh bằng phím thật --------------------------
    await cdp.evalJs(`document.querySelector('[data-testid="enhance-preset"]').focus()`);
    await cdp.key("ArrowDown", "ArrowDown");
    await cdp.key("ArrowDown", "ArrowDown");
    await cdp.key("ArrowDown", "ArrowDown");
    await cdp.key("Enter", "Enter");
    await sleep(600);
    const s4 = await cdp.evalJs(STATE_FN);
    const c4 = s4.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    if (s4.enhancePreset !== "balanced" && s4.enhancePreset !== "strong" && !c4.enhance?.stabilize) {
      pass("B4 phím điều hướng không chọn được Cân bằng/Mạnh", `sau ArrowDown×3 + Enter: select="${s4.enhancePreset}" (không phải balanced/strong), store vẫn không có stabilize: ${JSON.stringify(c4.enhance)}`);
    } else {
      fail("B4 phím điều hướng không chọn được Cân bằng/Mạnh", `preset=${s4.enhancePreset}, enhance=${JSON.stringify(c4.enhance)}`);
    }
    await cdp.shot("r2-b4-keyboard-blocked.png");

    // ---- B5: sửa trạng thái lỗi cũ ------------------------------------------
    // Tắt speed curve → cảnh báo biến mất, checkbox chống rung mở lại.
    await clickEl(cdp, ".curve-disable-btn", "B5 tắt speed curve");
    const s5a = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && !c.hasSpeedRamp && !t.speedWarnVisible && t.stabDisabled === false ? t : null;
    }, "tắt curve: cảnh báo biến mất + checkbox mở lại", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    // Bật chống rung bằng chuột thật (không còn curve nên được phép).
    await clickEl(cdp, '[data-testid="enhance-stabilize-toggle"]', "B5 bật chống rung");
    const s5b = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && c.enhance && c.enhance.stabilize && c.enhance.stabilize.smoothing === 10 ? t : null;
    }, "stabilize bật (smoothing 10)", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c5b = s5b.clips.find((x) => x.clipId === firstClipId);
    // Bật lại speed curve → trạng thái lỗi cũ tái hiện (stabilize + curve).
    await clickEl(cdp, ".curve-enable-btn", "B5 bật lại speed curve");
    const s5c = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && c.hasSpeedRamp && t.stabSpeedWarnVisible && t.stabDisabled === false ? t : null;
    }, "lỗi cũ tái hiện: cảnh báo stabSpeedConflict + checkbox vẫn mở", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c5c = s5c.clips.find((x) => x.clipId === firstClipId);
    // Tắt chống rung bằng chuột thật để sửa lỗi. Lưu ý: speed curve vẫn còn
    // bật nên cảnh báo preset-blocked VẪN hiện (đúng — Cân bằng/Mạnh vẫn bị
    // chặn); chỉ cảnh báo conflict "render sẽ bị chặn" phải biến mất.
    await clickEl(cdp, '[data-testid="enhance-stabilize-toggle"]', "B5 tắt chống rung sửa lỗi");
    const s5d = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const c = t?.clips.find((x) => x.clipId === firstClipId);
      return t && c && c.enhance && !c.enhance.stabilize && t.speedWarnVisible && !t.stabSpeedWarnVisible ? t : null;
    }, "tắt stabilize: hết conflict, cảnh báo preset-blocked vẫn hiện (curve còn bật)", 60000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const c5d = s5d.clips.find((x) => x.clipId === firstClipId);
    await drainErrors(cdp);
    const b5ok = s5a && !s5a.speedWarnVisible && s5a.stabDisabled === false
      && c5b && c5b.enhance && c5b.enhance.stabilize && c5b.enhance.stabilize.smoothing === 10
      && c5c && c5c.hasSpeedRamp && c5c.enhance && c5c.enhance.stabilize
      && s5c.stabSpeedWarnVisible && s5c.stabDisabled === false
      && c5d && c5d.enhance && !c5d.enhance.stabilize && c5d.enhance.denoise
      && s5d.speedWarnVisible && !s5d.stabSpeedWarnVisible;
    if (b5ok) {
      pass("B5 sửa trạng thái lỗi cũ: checkbox vẫn mở để tắt khi đang bật", `tắt curve → checkbox mở; bật stabilize (smoothing 10); bật lại curve → cảnh báo "render sẽ bị chặn" hiện nhưng checkbox VẪN MỞ; tắt stabilize → enhance=${JSON.stringify(c5d.enhance)}, cảnh báo conflict biến mất, cảnh báo preset-blocked vẫn hiện đúng (curve còn bật)`);
    } else {
      fail("B5 sửa trạng thái lỗi cũ: checkbox vẫn mở để tắt khi đang bật", `s5a=${JSON.stringify(s5a)} c5b=${JSON.stringify(c5b)} s5c=${JSON.stringify(s5c)} c5d=${JSON.stringify(c5d)}`);
    }
    await cdp.shot("r2-b5-legacy-repair.png");

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    fs.writeFileSync(path.join(SCRATCH, "r2-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
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
