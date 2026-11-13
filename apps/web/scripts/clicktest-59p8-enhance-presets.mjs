#!/usr/bin/env node
/**
 * clicktest-59p8-enhance-presets.mjs — Phase 9 đợt 59, luồng P8: preset
 * tăng cường (E3) — click thật trên trình duyệt headed.
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-58o2-autosave-sample-reload.mjs.
 * CHỈ thêm file harness — KHÔNG sửa code sản phẩm ngoài phạm vi P8
 * (presets.ts / EnhancePanel.tsx / Timeline.tsx đã sửa trước khi chạy).
 *
 * Các case (profile Chrome mới tinh — localStorage + IndexedDB trống):
 *   B0 setup: mount → modal chào đóng → project mẫu tự load (3 clip,
 *        media bin 2 item) → clip video đầu chưa có enhance, select preset
 *        đang ở "off", chưa có badge ✨, chưa có dòng tóm tắt.
 *   B1 preset Cân bằng: click thật vào clip video đầu → Inspector hiện
 *        section Tăng cường → focus select preset bằng chuột thật, bấm
 *        ArrowDown 2 lần (off → light → balanced) → assert store
 *        clip.enhance == { stabilize: { smoothing: 10 }, denoise:
 *        { strength: 0.5 } } (đúng giá trị render), select hiện
 *        "balanced", dòng tóm tắt "Đang bật: Chống rung, Khử nhiễu",
 *        badge ✨ xuất hiện trên đúng clip đó trên timeline.
 *   B2 preset Nhẹ: ArrowUp 1 lần (balanced → light) → assert enhance ==
 *        { denoise: { strength: 0.3 } }, tóm tắt chỉ còn "Khử nhiễu",
 *        badge vẫn còn, select hiện "light".
 *   B3 tắt hết: bấm chuột thật vào nút "Tắt tất cả tăng cường" → assert
 *        enhance undefined, badge biến mất, tóm tắt biến mất, select về
 *        "off".
 *   B4 (đính chính P10): kiểm chứng từng điều khiển R2 bằng chuột/phím thật
 *        — checkbox khử răng cưa → deinterlace:true, select yadif → mode 1,
 *        checkbox chống rung → stabilize {smoothing:10}, slider smoothing
 *        bấm 25% → smoothing ∈ [20,30] (preset chuyển "custom"), checkbox
 *        khử nhiễu → denoise:true, slider strength bấm 70% → strength ∈
 *        [0.6,0.8]; đồng thời khóa dòng cảnh báo render-only có hiện.
 *   H9 0 lỗi trang trong phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-59p8-enhance-presets.mjs
 * Env: P8_DEV_PORT (mặc định tự chọn 5400–5409), P8_DEBUG_PORT (9500–9509),
 * P8_DISPLAY (mặc định :162 — display RIÊNG của P8, không dùng chung),
 * P8_SCRATCH (mặc định hidden_files/round59-p8/headed). TMPDIR riêng
 * /tmp/round59-p8/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
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
const SCRATCH = process.env.P8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round59-p8", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round59-p8";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.p8.config.mjs");

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
  window.__p8errors = [];
  window.addEventListener("error", (e) => { try { window.__p8errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__p8errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__p8errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__p8errors.push("unhandledrejection: <?>"); } });
  window.__p8boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu O2): chỉ dùng để ĐỌC state, mọi thao
// tác dưới test đều là chuột/phím thật qua CDP.
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p8storeMod || (window.__p8storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Snapshot trạng thái enhance thật từ store + DOM (select/tóm tắt/badge).
const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
  });
  const sel = document.querySelector('[data-testid="enhance-preset"]');
  return {
    clips,
    selection: st.selection,
    enhancePreset: sel ? sel.value : null,
    enhancePresetVisible: !!sel,
    enhanceSummary: document.querySelector('[data-testid="enhance-summary"]')?.textContent ?? null,
    enhanceBadges: [...document.querySelectorAll("[data-enhance-badge]")].map((el) => ({
      clipId: el.closest(".tl-clip")?.dataset.clipId ?? null,
      title: el.getAttribute("title"),
    })),
    errors: (window.__p8errors || []).slice(),
  };
})()`;

// Hình học thật của clip để tính tọa độ click (mẫu O2).
const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  const presetSel = document.querySelector('[data-testid="enhance-preset"]');
  const disableBtn = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Tắt tất cả tăng cường");
  return { clips, presetRect: r(presetSel), disableRect: r(disableBtn) };
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
    const e = (await cdp.evalJs(`(window.__p8errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__p8errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.P8_DEV_PORT || 0) || (await pickFreePort(5400, 5409));
    const DEBUG_PORT = Number(process.env.P8_DEBUG_PORT || 0) || (await pickFreePort(9500, 9509));
    // Display riêng: quét :182–:189, bỏ qua display đã có Xvfb khác đang
    // chạy (nhiều luồng đợt 59 chạy headed song song — :161/:162 đã bị
    // chiếm khi chạy lần đầu); dọn socket mồ côi nếu Xvfb cũ đã chết.
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 182; n <= 189; n++) {
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
    const DISPLAY = process.env.P8_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :182–:189");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5400–5409");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9500–9509");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round59-p8/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tắt HMR (tự tạo lại — /tmp mất sau reboot, xem O2 LIMITS §9.3):
    // luồng khác sửa .tsx/.ts giữa chừng không reload trang đang test.
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "p8-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "p8-chrome.log"), "w");
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

    // ---- B0: project mẫu tự load; clip video đầu chưa enhance ------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 ? t : null;
    }, "project mẫu tự load (3 clip)", 180000);
    const v0 = s0.clips.find((c) => c.trackId === "v1");
    const firstClipId = v0.clipId;
    await drainErrors(cdp);
    if (v0.enhance === null && s0.enhanceBadges.length === 0) {
      pass("B0 setup: mẫu load, clip video chưa enhance", `3 clip, clip video đầu ${firstClipId} enhance=null, 0 badge ✨`);
    } else {
      fail("B0 setup: mẫu load, clip video chưa enhance", `state=${JSON.stringify(s0)}`);
    }

    // ---- B1: click clip video → preset Cân bằng bằng chuột + phím thật ----
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (B1)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    const sSel = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.enhancePresetVisible && t.enhancePreset === "off" ? t : null;
    }, "Inspector hiện section Tăng cường, select preset ở off", 60000);
    // Focus select bằng JS (setup — tương tự ensureNoModal của O2), rồi đổi
    // giá trị bằng PHÍM THẬT qua CDP: khi popup chưa mở, ArrowDown đổi
    // thẳng giá trị select và bắn change → React onChange. (Click chuột
    // thật mở popup native của Chrome — popup này không nhận phím CDP.)
    await cdp.evalJs(`document.querySelector('[data-testid="enhance-preset"]').focus()`);
    await cdp.key("ArrowDown", "ArrowDown");
    await cdp.key("ArrowDown", "ArrowDown");
    const s1 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.enhancePreset === "balanced" ? t : null;
    }, "select preset chốt ở balanced", 15000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const enh1 = s1.clips.find((c) => c.clipId === firstClipId)?.enhance;
    const enh1Ok = enh1 && enh1.stabilize?.smoothing === 10 && enh1.denoise?.strength === 0.5
      && Object.keys(enh1).sort().join(",") === "denoise,stabilize";
    await drainErrors(cdp);
    if (enh1Ok && s1.enhancePreset === "balanced"
      && s1.enhanceSummary === "Đang bật: Chống rung, Khử nhiễu"
      && s1.enhanceBadges.length === 1 && s1.enhanceBadges[0].clipId === firstClipId
      && (s1.enhanceBadges[0].title || "").includes("Tăng cường video")) {
      pass("B1 preset Cân bằng: store + tóm tắt + badge ✨", `enhance=${JSON.stringify(enh1)}, select=balanced, tóm tắt="Đang bật: Chống rung, Khử nhiễu", badge ✨ trên clip ${firstClipId}`);
    } else {
      fail("B1 preset Cân bằng: store + tóm tắt + badge ✨", `enhance=${JSON.stringify(enh1)}, select=${s1.enhancePreset}, summary=${JSON.stringify(s1.enhanceSummary)}, badges=${JSON.stringify(s1.enhanceBadges)}`);
    }
    await cdp.shot("p8-b1-balanced.png");

    // ---- B2: preset Nhẹ (ArrowUp 1 lần) ----------------------------------
    // B2: preset Nhẹ (ArrowUp 1 lần từ balanced → light), phím thật.
    await cdp.evalJs(`document.querySelector('[data-testid="enhance-preset"]').focus()`);
    await cdp.key("ArrowUp", "ArrowUp");
    const s2 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.enhancePreset === "light" ? t : null;
    }, "select preset chốt ở light", 15000).catch(() => null) ?? await cdp.evalJs(STATE_FN);
    const enh2 = s2.clips.find((c) => c.clipId === firstClipId)?.enhance;
    const enh2Ok = enh2 && JSON.stringify(enh2) === JSON.stringify({ denoise: { strength: 0.3 } });
    await drainErrors(cdp);
    if (enh2Ok && s2.enhancePreset === "light"
      && s2.enhanceSummary === "Đang bật: Khử nhiễu"
      && s2.enhanceBadges.length === 1 && s2.enhanceBadges[0].clipId === firstClipId) {
      pass("B2 preset Nhẹ: chỉ còn denoise, badge vẫn còn", `enhance=${JSON.stringify(enh2)}, select=light, tóm tắt="Đang bật: Khử nhiễu"`);
    } else {
      fail("B2 preset Nhẹ: chỉ còn denoise, badge vẫn còn", `enhance=${JSON.stringify(enh2)}, select=${s2.enhancePreset}, summary=${JSON.stringify(s2.enhanceSummary)}, badges=${JSON.stringify(s2.enhanceBadges)}`);
    }

    // ---- B3: bấm "Tắt tất cả tăng cường" bằng chuột thật ------------------
    // Nút nằm cuối panel Enhance (dưới fold của Inspector) nên cuộn nó vào
    // giữa khung nhìn trước (setup), rồi mới click chuột thật.
    await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Tắt tất cả tăng cường"); if (b) b.scrollIntoView({ block: "center" }); return !!b; })()`);
    await sleep(500);
    const g3 = await cdp.evalJs(GEOM_FN);
    if (!g3.disableRect) throw new Error("không tìm thấy nút 'Tắt tất cả tăng cường' (B3)");
    await cdp.click(g3.disableRect.cx, g3.disableRect.cy);
    await sleep(600);
    const s3 = await cdp.evalJs(STATE_FN);
    const enh3 = s3.clips.find((c) => c.clipId === firstClipId)?.enhance;
    await drainErrors(cdp);
    if (enh3 === null && s3.enhancePreset === "off" && s3.enhanceSummary === null && s3.enhanceBadges.length === 0) {
      pass("B3 tắt tất cả: enhance undefined, badge + tóm tắt biến mất", `select về off, 0 badge ✨`);
    } else {
      fail("B3 tắt tất cả: enhance undefined, badge + tóm tắt biến mất", `enhance=${JSON.stringify(enh3)}, select=${s3.enhancePreset}, summary=${JSON.stringify(s3.enhanceSummary)}, badges=${JSON.stringify(s3.enhanceBadges)}`);
    }
    await cdp.shot("p8-b3-disabled.png");

// ---- B4 (đính chính P10): kiểm chứng từng điều khiển R2 -------------
// Panel Enhance ĐÃ có từ R2 — case này bấm thật từng điều khiển gốc và
// đối chiếu store với field/flag mà render dùng (validateEnhance):
// checkbox khử răng cưa → deinterlace:true; select yadif → {mode:1};
// checkbox chống rung → stabilize:{smoothing:10}; slider smoothing bấm
// chuột thật ở 25% → smoothing trong [20,30] (preset chuyển "custom");
// checkbox khử nhiễu → denoise:true; slider strength bấm ở 70% → strength
// trong [0.6,0.8]. Đồng thời khóa dòng cảnh báo render-only có hiện.
const ENH_CTRL_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  // EnhancePanel tái dùng class "mask-panel" của MaskPanel nên KHÔNG được
  // query ".mask-panel" trần (trả về panel Mask đứng trước trong DOM) —
  // neo từ select preset (chỉ có trong panel Enhance) rồi closest lên.
  const panel = document.querySelector('[data-testid="enhance-preset"]')?.closest(".mask-panel");
  const checks = [...(panel?.querySelectorAll('input[type="checkbox"]') || [])];
  const sliders = [...(panel?.querySelectorAll('input[type="range"]') || [])];
  return {
    checkCount: checks.length,
    checkRects: checks.map(r),
    sliderRects: sliders.map(r),
    sliderValues: sliders.map((s) => s.value),
    tips: [...(panel?.querySelectorAll(".tips") || [])].map((e) => e.textContent),
    yadifVisible: !![...(panel?.querySelectorAll("select") || [])].find((s) => s.dataset.testid !== "enhance-preset"),
  };
})()`;

// Cuộn control Enhance vào giữa khung nhìn Inspector rồi bấm chuột thật:
// control nằm ở mép dưới panel sẽ bị toolbar timeline che (probe B4 đo
// elementFromPoint tại tâm checkbox chống rung trả về DIV.tl-hint) nên
// click trượt — lỗi hình học của harness, không phải bug sản phẩm (user
// thật cuộn panel là bấm được).
async function clickEnhCheckbox(idx) {
  await cdp.evalJs(`(() => { const panel = document.querySelector('[data-testid="enhance-preset"]').closest(".mask-panel"); const c = [...panel.querySelectorAll('input[type="checkbox"]')][${idx}]; if (c) c.scrollIntoView({ block: "center" }); return !!c; })()`);
  await sleep(400);
  const g = await cdp.evalJs(ENH_CTRL_FN);
  await cdp.click(g.checkRects[idx].cx, g.checkRects[idx].cy);
}
async function clickEnhSlider(idx, frac) {
  await cdp.evalJs(`(() => { const panel = document.querySelector('[data-testid="enhance-preset"]').closest(".mask-panel"); const s = [...panel.querySelectorAll('input[type="range"]')][${idx}]; if (s) s.scrollIntoView({ block: "center" }); return !!s; })()`);
  await sleep(400);
  const g = await cdp.evalJs(ENH_CTRL_FN);
  const sl = g.sliderRects[idx];
  await cdp.click(sl.x + sl.w * frac, sl.cy);
}
{
  const c0 = await cdp.evalJs(ENH_CTRL_FN);
  const renderOnlyShown = c0.tips.some((x) => x.includes("chỉ có tác dụng khi render"));
  const sPre = await cdp.evalJs(STATE_FN);
  const preOk = c0.checkCount === 3 && renderOnlyShown && sPre.enhancePreset === "off";
  if (!preOk) {
    fail("B4 điều khiển R2: checkbox đủ 3 + cảnh báo render-only", `checkCount=${c0.checkCount}, renderOnly=${renderOnlyShown}, select=${sPre.enhancePreset}, tips=${JSON.stringify(c0.tips)}`);
  } else {
    // Khử răng cưa: checkbox thật → deinterlace:true; yadif → mode 1.
    await clickEnhCheckbox(0);
    const sD = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      const e = t?.clips.find((c) => c.clipId === firstClipId)?.enhance;
      return t && e && e.deinterlace === true ? t : null;
    }, "deinterlace:true sau khi bấm checkbox", 15000).catch(() => null);
    let b4ok = !!sD;
    let detail = `deinterlace=${JSON.stringify(sD?.clips.find((c) => c.clipId === firstClipId)?.enhance)}`;
    if (b4ok) {
      await cdp.evalJs(`[...document.querySelector('[data-testid="enhance-preset"]').closest(".mask-panel").querySelectorAll("select")].find((s) => s.dataset.testid !== "enhance-preset").focus()`);
      await cdp.key("ArrowDown", "ArrowDown");
      const sM = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        const e = t?.clips.find((c) => c.clipId === firstClipId)?.enhance;
        return t && e && e.deinterlace && e.deinterlace.mode === 1 ? t : null;
      }, "yadif mode 1", 15000).catch(() => null);
      b4ok = !!sM;
      detail += `; yadif=${JSON.stringify(sM?.clips.find((c) => c.clipId === firstClipId)?.enhance?.deinterlace)}`;
    }
    // Chống rung: checkbox thật → stabilize {smoothing:10}; slider bấm 25%.
    if (b4ok) {
      // Blur select yadif (setup) để đóng popup native nếu đang mở — KHÔNG
      // dùng Enter vì Enter trên select đang focus sẽ MỞ popup (lượt trước
      // FAIL đúng chỗ này: click chuột sau đó rơi vào popup thay vì
      // checkbox chống rung). Blur giữ nguyên giá trị đã chọn bằng ArrowDown.
      await cdp.evalJs(`[...document.querySelector('[data-testid="enhance-preset"]').closest(".mask-panel").querySelectorAll("select")].find((s) => s.dataset.testid !== "enhance-preset").blur()`);
      await sleep(300);
      await clickEnhCheckbox(1);
      const sS = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        const e = t?.clips.find((c) => c.clipId === firstClipId)?.enhance;
        return t && e && e.stabilize?.smoothing === 10 ? t : null;
      }, "stabilize smoothing 10", 15000).catch(() => null);
      b4ok = !!sS;
      detail += `; stabilize=${JSON.stringify(sS?.clips.find((c) => c.clipId === firstClipId)?.enhance?.stabilize)}`;
      if (b4ok) {
        await clickEnhSlider(0, 0.25);
        await sleep(600);
        const sS2 = await cdp.evalJs(STATE_FN);
        const sm = sS2.clips.find((c) => c.clipId === firstClipId)?.enhance?.stabilize?.smoothing;
        const smOk = typeof sm === "number" && sm >= 20 && sm <= 30;
        b4ok = smOk && sS2.enhancePreset === "custom";
        detail += `; smoothing sau bấm slider 25% = ${sm} (preset=${sS2.enhancePreset})`;
      }
    }
    // Khử nhiễu: checkbox thật → denoise:true; slider bấm 70%.
    if (b4ok) {
      await clickEnhCheckbox(2);
      const sN = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(STATE_FN).catch(() => null);
        const e = t?.clips.find((c) => c.clipId === firstClipId)?.enhance;
        return t && e && e.denoise === true ? t : null;
      }, "denoise:true", 15000).catch(() => null);
      b4ok = !!sN;
      detail += `; denoise=${JSON.stringify(sN?.clips.find((c) => c.clipId === firstClipId)?.enhance?.denoise)}`;
      if (b4ok) {
        const nSliders = (await cdp.evalJs(ENH_CTRL_FN)).sliderRects.length;
        await clickEnhSlider(nSliders - 1, 0.7);
        await sleep(600);
        const sN2 = await cdp.evalJs(STATE_FN);
        const enh = sN2.clips.find((c) => c.clipId === firstClipId)?.enhance;
        const st = typeof enh?.denoise === "object" ? enh.denoise.strength : null;
        const stOk = typeof st === "number" && st >= 0.6 && st <= 0.8;
        const fullOk = stOk && enh?.deinterlace?.mode === 1
          && typeof enh?.stabilize?.smoothing === "number" && enh.stabilize.smoothing >= 20 && enh.stabilize.smoothing <= 30;
        b4ok = fullOk;
        detail += `; strength sau bấm slider 70% = ${st}; enhance cuối = ${JSON.stringify(enh)}; tóm tắt=${JSON.stringify(sN2.enhanceSummary)}; badge=${sN2.enhanceBadges.length}`;
        if (fullOk) {
          writeFileEpermRetry(path.join(SCRATCH, "p8-b4-final-enhance.json"), JSON.stringify(enh));
        }
      }
    }
    await drainErrors(cdp);
    if (b4ok) pass("B4 điều khiển R2: từng control ghi đúng clip.enhance + khớp field render", detail);
    else fail("B4 điều khiển R2: từng control ghi đúng clip.enhance + khớp field render", detail);
    await cdp.shot("p8-b4-r2-controls.png");
  }
}

    // H9: 0 lỗi trang gộp qua các phase (đã drain sau mỗi phase).
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "p8-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED P8: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
