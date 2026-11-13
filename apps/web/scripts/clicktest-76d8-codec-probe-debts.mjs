#!/usr/bin/env node
/**
 * clicktest-76d8-codec-probe-debts.mjs — Phase 9 đợt 76, luồng D8: đóng
 * 3 nợ đợt 75 C6 §4 (race project mẫu xóa file vừa import §4.7, modal
 * codec chưa đóng bằng Escape §4.6, clip timeline chưa có badge §4.8).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node
 * thuần, không Playwright), theo mẫu clicktest-75c9-escape-classes.mjs.
 * Profile Chrome MỚI mỗi lần chạy → localStorage trống → WelcomeModal
 * hiện lúc mount + không có autosave → loadSample bay (~8 s ghi 2
 * clip mẫu, cửa sổ race).
 *
 * BẪY THỜI GIAN (rút ra từ lần chạy đầu 09/11): splash chỉ tắt khi
 * `ready` (App.tsx) mà `ready` chỉ bật khi lượt mẫu resolve — chờ
 * mount kiểu C9 (topbar + không splash) là chờ hết cửa sổ race rồi
 * mới import. Nên harness này KHÔNG chờ mount: sau navigate là poll
 * input[type=file] của MediaBin xuất hiện (render cùng lúc App mount
 * → loadSample bắt đầu bay) rồi set file NGAY.
 *
 * File test PHẢI có `-movflags +faststart` (xem lần chạy đầu: file
 * không faststart → moov sau mdat → sniffMp4Codec null trong slice
 * 1 MiB → probe fallback lấy ứng viên tốt nhất H.264 "probably" →
 * verdict "supported" → KHÔNG badge; đó là giới hạn thật của fallback
 * B3, ghi nợ ở LIMITS D8 §4 — không sửa trong luồng này).
 *
 * Các bước:
 *   R1 race bin-only: mở app → đóng WelcomeModal bằng Escape → import
 *     hevc-a.mp4 NGAY (DOM.setFileInputFiles) → chờ thẻ hevc xuất hiện
 *     (ghi t_hevc) rồi chờ thẻ mau-1 (t_mau): hevc PHẢI xuất hiện
 *     TRƯỚC mau (chứng minh import set trước khi lượt mẫu resolve —
 *     merge được tập thật) và VẪN CÒN sau khi mau lên (merge giữ file).
 *   R2 race timeline: xóa storage (localStorage + IndexedDB) → reload
 *     → import hevc-a → bấm "Thêm vào playhead" trên thẻ hevc TRƯỚC
 *     khi mẫu load xong → sau khi mau lên, clip hevc vẫn trên timeline
 *     + có badge timeline-codec-badge (nhánh giữ spec).
 *   R3 bền vững: chờ autosave (debounce 5 s) → reload → hevc còn
 *     trong bin + trên timeline + badge timeline còn (khôi phục qua
 *     autosave + rehydrate probe lại).
 *   R4 Escape modal: bấm badge trên thẻ hevc → modal mở → focus nút ✕
 *     → Escape thật qua CDP → modal đóng.
 *   R5: 0 lỗi trang trong phiên.
 *
 * File test thật (ffmpeg, 1920×1080, 2 s): /tmp/round76-d8/hevc-a.mp4
 * (libx265, Chromium này không phát được → badge) + h264.mp4 đối chứng.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-76d8-codec-probe-debts.mjs
 * Env: D8_DEV_PORT (mặc định tự chọn 5470–5479), D8_DEBUG_PORT
 * (9570–9579), D8_DISPLAY (mặc định :176 — display RIÊNG, không dùng
 * chung), D8_SCRATCH (mặc định hidden_files/round76-d8/headed). TMPDIR
 * riêng /tmp/round76-d8/tmp. Exit 0 PASS, 1 FAIL, 2 harness lỗi.
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
const SCRATCH = process.env.D8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round76-d8", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const HEVC = "/tmp/round76-d8/hevc-a.mp4";

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
  async key(key, code) {
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { key, code, type: "keyUp" });
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

// Trạng thái thật trên DOM: tên các thẻ media, clip timeline, badge, modal.
const STATE_FN = `(() => {
  const cardNames = [...document.querySelectorAll(".media-card .media-name")].map((x) => (x.textContent || "").trim());
  const clips = [...document.querySelectorAll(".tl-clip .clip-label")].map((x) => (x.textContent || "").trim());
  const welcomeDlg = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].find((d) => (d.getAttribute("aria-label") || "").includes("Chào mừng"));
  return {
    welcome: !!welcomeDlg,
    cards: cardNames,
    hevcCard: cardNames.some((n) => n === "hevc-a.mp4"),
    mauCard: cardNames.some((n) => n.startsWith("mau-")),
    binBadge: document.querySelectorAll('[data-testid="codec-unsupported-badge"]').length,
    clips,
    hevcClip: clips.some((c) => c.includes("hevc-a.mp4")),
    tlBadge: document.querySelectorAll('[data-testid="timeline-codec-badge"]').length,
    modal: !!document.querySelector('[data-testid="codec-unsupported-modal"]'),
    splash: !!document.querySelector(".splash"),
  };
})()`;

// Import 1 file qua input[type=file] ẩn của MediaBin (CDP DOM).
async function importHevc(cdp) {
  await cdp.send("DOM.enable");
  const doc = await cdp.send("DOM.getDocument", { depth: -1 });
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: '.media-bin input[type="file"], input[type="file"][accept*="video"]' });
  if (!q.nodeId) throw new Error("không thấy input[type=file] của MediaBin");
  await cdp.send("DOM.setFileInputFiles", { files: [HEVC], nodeId: q.nodeId });
}

async function clearStorage(cdp) {
  await cdp.evalJs(`(async () => {
    try { localStorage.clear(); } catch {}
    try {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map((d) => new Promise((res) => {
        const req = indexedDB.deleteDatabase(d.name);
        req.onsuccess = res; req.onerror = res; req.onblocked = res;
      })));
    } catch {}
    return true;
  })()`);
}

async function main() {
  const results = [];
  let vite = null, xvfb = null, chrome = null;
  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  try {
    const DEV_PORT = Number(process.env.D8_DEV_PORT || 0) || (await pickFreePort(5470, 5479));
    const DEBUG_PORT = Number(process.env.D8_DEBUG_PORT || 0) || (await pickFreePort(9570, 9579));
    const DISPLAY = process.env.D8_DISPLAY || ":176";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5470–5479");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9570–9579");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(HEVC)) throw new Error(`không thấy file test ${HEVC}`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round76-d8/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    // Config tạm tắt HMR (mẫu C9): luồng khác sửa file giữa chừng không
    // reload trang đang test. Tạo lại mỗi lần chạy vì /tmp mất sau reboot.
    const VITE_CFG = "/tmp/round76-d8/vite.d8.config.mjs";
    fs.mkdirSync("/tmp/round76-d8", { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(ROOT, "apps", "web", "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "d8-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "d8-chrome.log"), "w");
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
    const state = () => cdp.evalJs(STATE_FN);
    const waitMount = async (label) => {
      await cdp.waitFor(async () => {
        const s = await cdp.evalJs(`(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()`).catch(() => null);
        return s;
      }, label, 240000);
    };
    // Đóng WelcomeModal bằng Escape (nó có handler riêng đợt 58 O1).
    // Lưu ý: modal chỉ render khi ready (App.tsx:678) tức sau khi lượt
    // mẫu resolve — nên CHỜ nó hiện (tối đa 30 s) thay vì kiểm tra 1
    // lần ngay: lần chạy trước dismissWelcome chạy ngay sau mauSeen
    // (modal chưa kịp render) nên bỏ qua, welcome ở lại đè lên modal
    // codec ở R4 (2 modal chồng nhau — user thật không gặp vì backdrop
    // chặn click import, chỉ harness .click() qua JS mới mở được modal
    // codec khi welcome còn mở).
    const dismissWelcome = async () => {
      const appeared = await cdp.waitFor(async () => {
        const s = await state().catch(() => null);
        return s && s.welcome ? s : null;
      }, "WelcomeModal hiện", 30000).catch(() => null);
      if (!appeared) { log("WelcomeModal không hiện (đã chào rồi)"); return; }
      await cdp.key("Escape", "Escape");
      await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && !s.welcome ? s : null; }, "WelcomeModal đóng sau Escape", 30000);
      log("WelcomeModal đã đóng bằng Escape");
    };
    // Chờ input file của MediaBin xuất hiện — render cùng lúc App mount
    // (loadSample bắt đầu bay). KHÔNG chờ topbar + hết splash như mẫu
    // C9: splash chỉ tắt khi ready, tức sau khi mẫu load xong.
    const waitForInput = async (label) => {
      await cdp.waitFor(async () => {
        const ok = await cdp.evalJs(`!!document.querySelector('input[type="file"][accept*="video"]')`).catch(() => null);
        return ok ? true : null;
      }, label, 240000);
    };

    // ============ R1: race bin-only ============
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitForInput("input file MediaBin xuất hiện (App vừa mount, lượt mẫu bắt đầu bay)");
    log("input file đã xuất hiện — import NGAY trong cửa sổ race");
    const t0 = Date.now();
    await importHevc(cdp);
    log("đã set file hevc-a.mp4 vào input (ngay sau mở app)");
    const hevcSeen = await cdp.waitFor(async () => {
      const s = await state().catch(() => null);
      return s && s.hevcCard ? { ...s, at: Date.now() - t0 } : null;
    }, "thẻ hevc-a.mp4 xuất hiện trong bin", 90000);
    log(`thẻ hevc xuất hiện sau ${hevcSeen.at} ms (bin=${JSON.stringify(hevcSeen.cards)}, badge=${hevcSeen.binBadge})`);
    const mauSeen = await cdp.waitFor(async () => {
      const s = await state().catch(() => null);
      return s && s.mauCard ? { ...s, at: Date.now() - t0 } : null;
    }, "thẻ mẫu mau-* xuất hiện (lượt mẫu resolve)", 90000);
    log(`thẻ mẫu xuất hiện sau ${mauSeen.at} ms (bin=${JSON.stringify(mauSeen.cards)}, hevc còn=${mauSeen.hevcCard}, badge=${mauSeen.binBadge})`);
    await dismissWelcome();
    await cdp.shot("d8-r1-after-sample.png");
    const r1OrderOk = hevcSeen.at < mauSeen.at;
    results.push({ name: "R1a import set TRƯỚC khi lượt mẫu resolve (race được tập thật)", ok: r1OrderOk, detail: `t_hevc=${hevcSeen.at}ms t_mau=${mauSeen.at}ms` });
    results.push({ name: "R1b file import còn trong bin SAU khi mẫu load xong (merge giữ file)", ok: mauSeen.hevcCard && mauSeen.binBadge >= 1, detail: `bin=${JSON.stringify(mauSeen.cards)} badge=${mauSeen.binBadge}` });
    results.push({ name: "R1c mẫu vẫn load đủ (2 clip mẫu trên timeline)", ok: mauSeen.clips.some((c) => c.includes("mau-1")) && mauSeen.clips.some((c) => c.includes("mau-2")), detail: `clips=${JSON.stringify(mauSeen.clips)}` });

    // ============ R2: race timeline (giữ spec) ============
    await clearStorage(cdp);
    log("đã xóa localStorage + IndexedDB → reload để chạy lại lượt mẫu");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitForInput("input file MediaBin xuất hiện lần 2");
    const t1 = Date.now();
    await importHevc(cdp);
    log("đã set file hevc-a.mp4 lần 2 (ngay sau mở app)");
    await cdp.waitFor(async () => {
      const s = await state().catch(() => null);
      return s && s.hevcCard ? s : null;
    }, "thẻ hevc-a.mp4 xuất hiện lần 2", 90000);
    log(`thẻ hevc lần 2 xuất hiện sau ${Date.now() - t1} ms`);
    // Kéo clip lên timeline NGAY (bấm "Thêm vào playhead" trên thẻ hevc)
    // trong lúc lượt mẫu vẫn đang bay — nhánh giữ spec phải giữ clip này.
    const added = await cdp.evalJs(`(() => {
      const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === "hevc-a.mp4");
      if (!card) return false;
      const btn = card.querySelector(".media-add");
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    log(`bấm Thêm vào playhead trên thẻ hevc: ${added}`);
    if (!added) throw new Error("không bấm được nút Thêm vào playhead trên thẻ hevc");
    const afterAdd = await cdp.waitFor(async () => {
      const s = await state().catch(() => null);
      return s && s.hevcClip ? s : null;
    }, "clip hevc lên timeline sau khi bấm Thêm", 30000);
    log(`clip hevc đã lên timeline (clips=${JSON.stringify(afterAdd.clips)})`);
    const mauSeen2 = await cdp.waitFor(async () => {
      const s = await state().catch(() => null);
      return s && s.mauCard ? { ...s, at: Date.now() - t1 } : null;
    }, "thẻ mẫu mau-* xuất hiện lần 2", 90000);
    log(`thẻ mẫu lần 2 sau ${mauSeen2.at} ms (bin=${JSON.stringify(mauSeen2.cards)}, clips=${JSON.stringify(mauSeen2.clips)}, tlBadge=${mauSeen2.tlBadge})`);
    await dismissWelcome();
    await cdp.shot("d8-r2-after-sample.png");
    results.push({ name: "R2a clip hevc VẪN trên timeline sau khi mẫu load xong (giữ spec)", ok: mauSeen2.hevcClip, detail: `clips=${JSON.stringify(mauSeen2.clips)}` });
    results.push({ name: "R2b clip hevc trên timeline CÓ badge codec (timeline-codec-badge)", ok: mauSeen2.tlBadge >= 1, detail: `tlBadge=${mauSeen2.tlBadge}` });
    results.push({ name: "R2c file import còn trong bin sau khi mẫu load xong (lần 2)", ok: mauSeen2.hevcCard && mauSeen2.binBadge >= 1, detail: `bin=${JSON.stringify(mauSeen2.cards)}` });
    results.push({ name: "R2d splash TẮT sau khi lượt mẫu xong ở nhánh giữ spec (ready:true)", ok: !mauSeen2.splash, detail: `splash=${mauSeen2.splash}` });

    // ============ R3: bền vững qua reload (autosave + rehydrate) ============
    log("chờ autosave debounce 5 s (+dư) trước khi reload");
    await sleep(8000);
    await cdp.send("Page.navigate", { url: DEV_URL });
    await waitMount("app mount lần 3 (khôi phục autosave)");
    const restored = await cdp.waitFor(async () => {
      const s = await state().catch(() => null);
      return s && s.hevcCard && s.hevcClip ? s : null;
    }, "hevc còn trong bin + trên timeline sau reload", 90000);
    // Rehydrate probe lại cần 1 nhịp sau khi bin khôi phục — chờ badge lên.
    const restoredBadge = await cdp.waitFor(async () => {
      const s = await state().catch(() => null);
      return s && s.binBadge >= 1 && s.tlBadge >= 1 ? s : null;
    }, "badge bin + badge timeline hiện lại sau reload (rehydrate probe)", 60000);
    log(`sau reload: bin=${JSON.stringify(restoredBadge.cards)} clips=${JSON.stringify(restoredBadge.clips)} binBadge=${restoredBadge.binBadge} tlBadge=${restoredBadge.tlBadge}`);
    await cdp.shot("d8-r3-after-reload.png");
    results.push({ name: "R3a file import còn trong bin + trên timeline sau reload", ok: restored.hevcCard && restored.hevcClip, detail: `bin=${JSON.stringify(restored.cards)} clips=${JSON.stringify(restored.clips)}` });
    results.push({ name: "R3b badge bin + badge timeline hiện lại sau reload (rehydrate probe)", ok: restoredBadge.binBadge >= 1 && restoredBadge.tlBadge >= 1, detail: `binBadge=${restoredBadge.binBadge} tlBadge=${restoredBadge.tlBadge}` });

    // ============ R4: Escape đóng modal codec ============
    // Đảm bảo WelcomeModal đã đóng TRƯỚC khi mở modal codec (tránh 2
    // modal chồng nhau như lần chạy trước — xem chú thích dismissWelcome).
    const preR4 = await state().catch(() => null);
    if (preR4 && preR4.welcome) await dismissWelcome();
    const badgeClicked = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="codec-unsupported-badge"]'); if (!b) return false; b.click(); return true; })()`);
    if (!badgeClicked) throw new Error("không thấy badge codec trên thẻ hevc để bấm");
    await cdp.waitFor(async () => { const s = await state().catch(() => null); return s && s.modal ? s : null; }, "modal codec mở sau khi bấm badge", 30000);
    log("modal codec đã mở");
    const focusedClose = await cdp.evalJs(`(() => { const b = document.querySelector('[data-testid="codec-unsupported-close"]'); if (!b) return false; b.focus(); return document.activeElement === b; })()`);
    log(`modal mở, focus nút ✕: ${focusedClose}`);
    await cdp.shot("d8-r4-modal-before-escape.png");
    await cdp.key("Escape", "Escape");
    const afterEsc = await state();
    log(`modal sau Escape: modal=${afterEsc.modal}`);
    results.push({ name: "R4 Escape đóng modal codec (focus ở nút ✕)", ok: !afterEsc.modal, detail: `modal=${afterEsc.modal}` });
    await cdp.shot("d8-r4-modal-after-escape.png");

    // ============ R5: 0 lỗi trang ============
    const errors = cdp.exceptions;
    results.push({ name: "R5 0 lỗi trang trong phiên", ok: errors.length === 0, detail: errors.length ? errors.join(" | ").slice(0, 500) : "không có window.onerror/unhandledrejection" });

    const passCount = results.filter((r) => r.ok).length;
    for (const r of results) log(`${r.ok ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
    writeFileEpermRetry(path.join(SCRATCH, "d8-headed-report.json"), JSON.stringify({ pass: passCount, total: results.length, results, log: logLines }, null, 2));
    log(`D8 headed codec-probe debts: ${passCount}/${results.length} pass`);
    process.exitCode = passCount === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${(e && e.stack) || e}`);
    try { writeFileEpermRetry(path.join(SCRATCH, "d8-headed-report.json"), JSON.stringify({ pass: 0, total: 0, error: String((e && e.message) || e), log: logLines }, null, 2)); } catch {}
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
