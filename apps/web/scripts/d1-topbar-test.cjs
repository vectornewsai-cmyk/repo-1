// d1-topbar-test.cjs — D1 Phase 9 đợt 4: kiểm chứng TopBar không tràn ngang.
//
// Đo thật trên Chromium headless qua CDP (mẫu R6, không cần Playwright):
//   - ở mỗi viewport (1440, 1280, 390): .topbar scrollWidth <= clientWidth,
//     mọi nút trong .topbar đều nằm trọn trong viewport (không cần cuộn ngang),
//   - bấm thật các nút chính: phát/tạm dừng, thêm chữ, xuất bản, bắt đầu, ngôn ngữ.
// Chạy:
//   1. cd apps/web && npx vite --port 5180 --host 127.0.0.1   (terminal khác)
//   2. node apps/web/scripts/d1-topbar-test.cjs [debug-port]
// Exit 0 khi tất cả PASS, exit 1 khi có FAIL.
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEBUG_PORT = Number(process.argv[2] || 9341);
const DEV_URL = process.env.D1_DEV_URL || "http://127.0.0.1:5180/";
const CHROME =
  process.env.D1_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/d1-cdprof";
const VIEWPORTS = (process.env.D1_VIEWPORTS || "1440,1280,390")
  .split(",").map((s) => Number(s.trim())).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x, y, ...extra });
  }
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 90000) {
    const t0 = Date.now();
    let last;
    while (Date.now() - t0 < timeoutMs) {
      last = await fn();
      if (last) return last;
      await sleep(500);
    }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const MEASURE_JS = `(() => {
  const tb = document.querySelector('.topbar');
  const de = document.documentElement;
  const btns = [...document.querySelectorAll('.topbar button')].map(b => {
    const r = b.getBoundingClientRect();
    return { label: (b.getAttribute('aria-label') || b.title || b.innerText || '').trim(),
      x: Math.round(r.left), right: Math.round(r.right), y: Math.round(r.top),
      w: Math.round(r.width), h: Math.round(r.height), disabled: !!b.disabled };
  });
  return { scrollW: tb ? tb.scrollWidth : -1, clientW: tb ? tb.clientWidth : -1,
    scrollLeft: tb ? tb.scrollLeft : -1, height: tb ? Math.round(tb.getBoundingClientRect().height) : -1,
    deScrollW: de.scrollWidth, deClientW: de.clientWidth, innerW: window.innerWidth,
    btns };
})()`;

const findBtnJs = (pred) => `(() => {
  const b = [...document.querySelectorAll('.topbar button')].find(${pred});
  if (!b) return null; const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2,
    label: (b.getAttribute('aria-label') || b.title || b.innerText || '').trim() };
})()`;

async function runViewport(vw) {
  const vh = vw <= 390 ? 844 : 900;
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE}`, "--no-sandbox", "--disable-gpu",
    `--window-size=1440,900`, "--hide-scrollbars", "about:blank",
  ], { stdio: "ignore" });
  const kill = () => { try { chrome.kill("SIGKILL"); } catch {} };
  process.on("exit", kill);
  try {
    let pages = null;
    for (let i = 0; i < 60 && !pages; i++) {
      try { pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); }
      catch { await sleep(500); }
    }
    const pageTarget = (pages || []).find((p) => p.type === "page");
    if (!pageTarget) throw new Error("không tìm thấy target type=page");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll('.tl-clip').length`);
      return n >= 3 ? n : null;
    }, "project mẫu >= 3 clip");
    // Đóng welcome modal tự mở (profile mới) bằng click backdrop góc.
    if (await cdp.evalJs(`!!document.querySelector('.modal-backdrop')`)) {
      await cdp.click(20, 20);
      await sleep(500);
    }
    // Mô phỏng viewport bằng CDP cho MỌI cỡ (window-size không đáng tin:
    // lần chạy trước viewport 390 đo ra clientWidth=500; còn 1280 thì
    // không set override sẽ kẹt ở 1440 của cửa sổ). Reload xong phải chờ
    // cả .topbar lẫn clip — chỉ chờ clip sẽ dính DOM cũ trước reload.
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vw, height: vh, deviceScaleFactor: vw <= 390 ? 2 : 1, mobile: vw <= 390,
    });
    await cdp.send("Page.reload");
    await cdp.waitFor(async () => {
      const ok = await cdp.evalJs(
        `!!document.querySelector('.topbar') && document.querySelectorAll('.tl-clip').length >= 3`);
      return ok ? ok : null;
    }, "reload xong: topbar + >= 3 clip");
    await sleep(1000);
    const m = await cdp.evalJs(MEASURE_JS);
    // Chống đo rỗng (từng cho PASS giả ở mobile khi topbar null): phải đủ 23 nút.
    record(`[${vw}] đo đủ nút topbar`, m.btns.length === 23, `${m.btns.length} nút (kỳ vọng 23)`);
    const noScroll = m.scrollW <= m.clientW;
    record(`[${vw}] không tràn ngang`, noScroll,
      `scrollWidth=${m.scrollW} clientWidth=${m.clientW} scrollLeft=${m.scrollLeft} cao=${m.height}px, ${m.btns.length} nút`);
    const outside = m.btns.filter((b) => b.x < 0 || b.right > vw);
    record(`[${vw}] mọi nút nằm trong viewport`, outside.length === 0,
      outside.length === 0
        ? `${m.btns.length} nút đều có right<=${vw}`
        : `lòi ra ngoài: ${outside.map((b) => `${b.label}@${b.x}..${b.right}`).join("; ")}`);
    const rows = [...new Set(m.btns.map((b) => b.y))].length;
    console.log(`  [${vw}] topbar cao ${m.height}px, innerW=${m.innerW}, de scrollW=${m.deScrollW} clientW=${m.deClientW}`);
    for (const y of [...new Set(m.btns.map((b) => b.y))].sort((a, b) => a - b)) {
      const row = m.btns.filter((b) => b.y === y);
      console.log(`    hàng y=${y}: ${row.length} nút, right max=${Math.max(...row.map((b) => b.right))} :: ${row.map((b) => b.label.split(" (")[0].slice(0, 22)).join(" | ")}`);
    }

    // Bấm thật: phát / tạm dừng (aria-pressed đổi 2 lần về trạng thái cũ).
    const playBtn = await cdp.evalJs(findBtnJs(`x => x.classList.contains('play')`));
    let playOk = false;
    if (playBtn) {
      const p0 = await cdp.evalJs(`document.querySelector('.topbar button.play')?.getAttribute('aria-pressed')`);
      await cdp.click(playBtn.x, playBtn.y);
      const p1 = await cdp.evalJs(`document.querySelector('.topbar button.play')?.getAttribute('aria-pressed')`);
      await cdp.click(playBtn.x, playBtn.y);
      const p2 = await cdp.evalJs(`document.querySelector('.topbar button.play')?.getAttribute('aria-pressed')`);
      playOk = p0 !== p1 && p2 === p0;
      record(`[${vw}] bấm phát/tạm dừng`, playOk, `aria-pressed ${p0} -> ${p1} -> ${p2}`);
    } else record(`[${vw}] bấm phát/tạm dừng`, false, "không tìm thấy nút play");

    // Bấm thật: thêm chữ (data-tour=add-text) làm tăng số clip.
    const addBtn = await cdp.evalJs(findBtnJs(`x => x.dataset.tour === 'add-text'`));
    let addOk = false;
    if (addBtn) {
      const c0 = await cdp.evalJs(`document.querySelectorAll('.tl-clip').length`);
      await cdp.click(addBtn.x, addBtn.y);
      const c1 = await cdp.evalJs(`document.querySelectorAll('.tl-clip').length`);
      addOk = c1 === c0 + 1;
      record(`[${vw}] bấm thêm chữ`, addOk, `số clip ${c0} -> ${c1}`);
    } else record(`[${vw}] bấm thêm chữ`, false, "không tìm thấy nút data-tour=add-text");

    // Bấm thật: xuất bản (data-tour=export) mở panel Xuất video, đóng bằng backdrop.
    const pubBtn = await cdp.evalJs(findBtnJs(`x => x.dataset.tour === 'export'`));
    let pubOk = false;
    if (pubBtn) {
      await cdp.click(pubBtn.x, pubBtn.y);
      await sleep(500);
      pubOk = await cdp.evalJs(`!!document.querySelector('[aria-label="Xuất video"]')`);
      record(`[${vw}] bấm xuất bản`, pubOk, pubOk ? "panel Xuất video đã mở" : "không thấy panel Xuất video");
      if (pubOk) { await cdp.click(20, 20); await sleep(500); }
    } else record(`[${vw}] bấm xuất bản`, false, "không tìm thấy nút data-tour=export");

    // Bấm thật: bắt đầu (aria-label "Mở lại màn chào") mở welcome, đóng bằng backdrop.
    const welBtn = await cdp.evalJs(findBtnJs(`x => x.getAttribute('aria-label') === 'Mở lại màn chào'`));
    let welOk = false;
    if (welBtn) {
      await cdp.click(welBtn.x, welBtn.y);
      await sleep(500);
      welOk = await cdp.evalJs(`!!document.querySelector('.modal-backdrop')`);
      record(`[${vw}] bấm bắt đầu`, welOk, welOk ? "welcome modal đã mở" : "không thấy welcome modal");
      if (welOk) { await cdp.click(20, 20); await sleep(500); }
    } else record(`[${vw}] bấm bắt đầu`, false, "không tìm thấy nút Mở lại màn chào");

    // Bấm thật: ngôn ngữ (aria-label Ngôn ngữ/Language) đổi vcut-lang rồi đổi lại.
    const langBtn = await cdp.evalJs(findBtnJs(
      `x => x.getAttribute('aria-label') === 'Ngôn ngữ' || x.getAttribute('aria-label') === 'Language'`));
    let langOk = false;
    if (langBtn) {
      const l0 = await cdp.evalJs(`localStorage.getItem('vcut-lang')`);
      await cdp.click(langBtn.x, langBtn.y);
      await sleep(500);
      const l1 = await cdp.evalJs(`localStorage.getItem('vcut-lang')`);
      const langBtn2 = await cdp.evalJs(findBtnJs(
        `x => x.getAttribute('aria-label') === 'Ngôn ngữ' || x.getAttribute('aria-label') === 'Language'`));
      if (langBtn2) { await cdp.click(langBtn2.x, langBtn2.y); await sleep(500); }
      const l2 = await cdp.evalJs(`localStorage.getItem('vcut-lang')`);
      // Profile mới chưa có key (mặc định vi): null -> en -> vi là đúng,
      // không phải "không về trạng thái cũ" — chấp nhận cả hai dạng.
      langOk = l0 !== l1 && (l2 === l0 || (l0 === null && l2 === "vi"));
      record(`[${vw}] bấm ngôn ngữ`, langOk, `vcut-lang ${l0} -> ${l1} -> ${l2}`);
    } else record(`[${vw}] bấm ngôn ngữ`, false, "không tìm thấy nút ngôn ngữ");
  } finally {
    kill();
    await sleep(500);
  }
}

(async () => {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  for (const vw of VIEWPORTS) {
    try { await runViewport(vw); }
    catch (e) { record(`[${vw}] chạy viewport`, false, String(e && e.message || e)); }
  }
  const fails = results.filter((r) => !r.ok);
  console.log(`\n== TỔNG: ${results.length - fails.length}/${results.length} pass ==`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
