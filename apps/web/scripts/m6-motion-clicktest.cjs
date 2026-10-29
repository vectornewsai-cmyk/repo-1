// m6-motion-clicktest.cjs — M6 Phase 9 đợt 9: click-test MotionPanel trên
// Chromium headless qua CDP (nợ click-test browser thật của đợt 8).
//
// Tái dùng mẫu harness R6/U6: Node thuần, WebSocket có sẵn, không cần
// Playwright; cần vite dev đang chạy + M6_DEV_URL, mặc định
// http://localhost:5173/. Chrome headless từ ms-playwright cache, profile
// mới (/tmp/m6-cdprof) nên editor tải project mẫu.
//
// MotionPanel chỉ render trong nhánh clip video của Inspector (Section
// "🐌 Slow-mo / nội suy frame"), KHÔNG có ở clip chữ — M6 kiểm tra đúng
// điểm này thay vì coi là thiếu panel.
//
// Thứ tự test nối tiếp trên cùng 1 project (đúng như user làm thật):
//   M0 load sample -> M0b đóng welcome modal -> M1 chọn clip video, kiểm
//   tra trạng thái tắt mặc định -> M2 bật nội suy bằng phím thật
//   (focus select + ArrowDown, mẫu U6) -> M3 bật blur bằng click thật
//   -> M4 tăng frame gộp bằng phím thật (focus range + ArrowRight)
//   -> M5 bấm "Tắt tất cả" -> M6 chọn clip chữ, motion section phải vắng.
// Mỗi test in PASS/FAIL/SKIP kèm số đo. Exit 0 khi tất cả pass, 1 khi
// có FAIL, 2 khi harness lỗi (không tới được dev server / chrome).
// SKIP chỉ dùng khi sample không có loại clip cần thiết, kèm lý do.
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEBUG_PORT = Number(process.argv[2] || 9336);
const DEV_URL = process.env.M6_DEV_URL || "http://localhost:5173/";
const CHROME =
  process.env.M6_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/m6-cdprof";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function skip(name, detail) {
  results.push({ name, ok: false, skipped: true, detail });
  console.log(`SKIP ${name} — ${detail}`);
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });
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
    const r = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error("evaluate failed: " +
        (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)) +
        " | expr-head: " + expression.slice(0, 160).replace(/\n/g, " "));
    }
    return r.result.value;
  }
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x, y, ...extra });
  }
  async click(x, y, extra = {}) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1, ...extra });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1, ...extra });
    await sleep(300);
  }
  async key(key, code, modifiers = 0, text) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown", text });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(150);
  }
  async waitFor(fn, label, timeoutMs = 150000) {
    const t0 = Date.now();
    let last;
    while (Date.now() - t0 < timeoutMs) {
      try { last = await fn(); } catch { last = null; }
      if (last) return last;
      await sleep(500);
    }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

// Snapshot timeline qua DOM (đúng như user thấy, không đọc store nội bộ).
const SNAP_JS = `(() => {
  const rect = (el) => { const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top),
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const clips = [...document.querySelectorAll('.tl-clip')].map(el => ({
    track: el.dataset.trackId, id: el.dataset.clipId,
    kind: [...el.classList].find(c => c.startsWith('clip-')) || '?',
    ...rect(el), sel: el.classList.contains('selected') }));
  return { clips,
    rootLen: (document.getElementById('root')?.innerHTML || '').length,
    bodyText: (document.body && document.body.innerText) || '' };
})()`;

// Định vị control của MotionPanel trong Section "Slow-mo / nội suy frame".
// ctr() LUÔN cuộn element vào giữa viewport trước khi đo tọa độ (bài học
// U6: Inspector dài, section motion nằm dưới fold, click CDP ngoài
// viewport không có tác dụng gì).
const FIND_JS = `((kind, a) => {
  const ctr = (el) => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const ctrNoScroll = (el) => { const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const section = () => {
    const btn = [...document.querySelectorAll('.ins-section > button')]
      .find(b => (b.innerText || '').includes('Slow-mo'));
    return btn ? btn.closest('.ins-section') : null;
  };
  if (kind === 'section') {
    const s = section();
    return s ? { title: [...s.querySelectorAll('button')][0]?.innerText || '' } : null;
  }
  if (kind === 'controls') {
    const s = section();
    if (!s) return null;
    const selects = [...s.querySelectorAll('select')];
    const check = s.querySelector('input[type="checkbox"]');
    const range = s.querySelector('input[type="range"]');
    const disableBtn = [...s.querySelectorAll('button')]
      .find(b => (b.innerText || '').trim() === 'Tắt tất cả slow-mo / motion blur');
    const tips = [...s.querySelectorAll('.tips')].map(t => t.innerText);
    // HAI PHA (bài học debug M3): cuộn HẾT các element trước, rồi mới đo
    // tọa độ — đo xen kẽ với cuộn sẽ cho tọa độ cũ, vì cuộn element sau
    // (vd nút "Tắt tất cả" xuất hiện sau khi bật nội suy) xê dịch
    // element trước đi 38px trong container .inspector, khiến click
    // checkbox rơi lệch và M3 fail ổn định dù click đúng element.
    const els = [selects[0], selects[1], check, range, disableBtn].filter(Boolean);
    els.forEach(el => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} });
    const pos = (el) => el ? ctrNoScroll(el) : null;
    return {
      interp: selects[0] ? { value: selects[0].value, pos: pos(selects[0]),
        options: [...selects[0].options].map(o => o.value) } : null,
      targetFps: selects[1] ? { value: selects[1].value, disabled: selects[1].disabled,
        pos: pos(selects[1]) } : null,
      blurCheck: check ? { checked: check.checked, pos: pos(check) } : null,
      blurRange: range ? { value: range.value, min: range.min, max: range.max,
        pos: pos(range),
        label: (range.closest('label')?.innerText || '').trim() } : null,
      disableBtn: disableBtn ? pos(disableBtn) : null,
      tips,
    };
  }
  if (kind === 'scrollClip') {
    const els = [...document.querySelectorAll('.tl-clip')];
    const el = els[a];
    if (!el) return null;
    try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {}
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) };
  }
  if (kind === 'focusSelect') {
    const s = section();
    if (!s) return false;
    const sel = [...s.querySelectorAll('select')][a];
    if (!sel) return false;
    sel.focus();
    return true;
  }
  if (kind === 'focusRange') {
    const s = section();
    if (!s) return false;
    const r = s.querySelector('input[type="range"]');
    if (!r) return false;
    r.focus();
    return true;
  }
  return null;
})`;

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE}`, "--no-sandbox", "--disable-gpu",
    "--window-size=1440,900", "--hide-scrollbars", "about:blank",
  ], { stdio: "ignore" });
  const kill = () => { try { chrome.kill("SIGKILL"); } catch {} };
  process.on("exit", kill);
  try {
    let pages = null;
    for (let i = 0; i < 60 && !pages; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
        pages = await r.json();
      } catch { await sleep(500); }
    }
    const pageTarget = (pages || []).find((p) => p.type === "page");
    if (!pageTarget) throw new Error("không tìm thấy target type=page trong /json/list");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send("Page.navigate", { url: DEV_URL });
    const find = (kind, a) =>
      cdp.evalJs(`(${FIND_JS})(${JSON.stringify(kind)}, ${JSON.stringify(a ?? null)})`);
    const alive = async () => {
      const s = await cdp.evalJs(SNAP_JS);
      return s.rootLen > 0 && s.clips.length >= 3;
    };

    // M0 — load project mẫu.
    const snap0 = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(SNAP_JS);
      return s.clips.length >= 3 ? s : null;
    }, "project mẫu >= 3 clip", 150000);
    record("M0 load sample", true,
      `${snap0.clips.length} clip: ${snap0.clips.map((c) => `${c.kind}@${c.track}:${Math.round(c.w)}px`).join(", ")}`);
    const modalSel = `.modal-backdrop, .tour-card, .welcome-modal`;
    const modalOpen = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
    if (modalOpen) { await cdp.click(20, 20); await sleep(500); }
    const modalGone = !(await cdp.evalJs(`!!document.querySelector('${modalSel}')`));
    record("M0b welcome modal", modalGone, modalOpen ? "modal tự mở — đã đóng bằng click backdrop" : "không có modal tự mở");
    if (!modalGone) return;

    // M1 — chọn clip video đầu tiên, kiểm tra trạng thái tắt mặc định.
    const s1 = await cdp.evalJs(SNAP_JS);
    const vIdx = s1.clips.findIndex((c) => c.kind === "clip-video");
    if (vIdx < 0) { skip("M1 chọn clip video / trạng thái tắt", "project mẫu không có clip video"); }
    else {
      const pos = await find("scrollClip", vIdx);
      await cdp.click(pos.x, pos.y);
      await sleep(600);
      const sec = await find("section");
      const ctl = await find("controls");
      const selCount = (await cdp.evalJs(SNAP_JS)).clips.filter((c) => c.sel).length;
      record("M1 chọn clip video / MotionPanel trạng thái tắt", !!sec && !!ctl &&
        ctl.interp?.value === "none" && ctl.targetFps?.disabled === true &&
        ctl.blurCheck?.checked === false && !ctl.blurRange && !ctl.disableBtn,
        sec
          ? `section '${sec.title}', đã chọn ${selCount} clip; interp=${ctl.interp?.value} ` +
            `targetFps disabled=${ctl.targetFps?.disabled} blur checked=${ctl.blurCheck?.checked} ` +
            `range=${ctl.blurRange ? "có" : "không"} disableAll=${ctl.disableBtn ? "có" : "không"}`
          : "không tìm thấy Section Slow-mo sau khi chọn clip video");
    }

    // M2 — bật nội suy bằng phím thật: focus select nội suy + ArrowDown
    // (option 0 = none, ArrowDown 1 lần -> minterpolate, mẫu U6).
    // Kỳ vọng: interp=minterpolate, select FPS đích hết disable, tip
    // warnLong hiện, app không crash.
    const ctl1 = await find("controls");
    if (!ctl1 || !ctl1.interp) skip("M2 bật nội suy (phím thật)", "MotionPanel chưa mở từ M1 nên không có select nội suy");
    else {
      const focused = await find("focusSelect", 0);
      if (!focused) record("M2 bật nội suy (phím thật)", false, "không focus được select nội suy");
      else {
        await cdp.key("ArrowDown", "ArrowDown");
        await sleep(600);
        const ctl2 = await find("controls");
        const okAlive = await alive();
        const warnLong = (ctl2?.tips || []).some((t) => t.includes("render sẽ chậm"));
        record("M2 bật nội suy (phím thật)", ctl2?.interp?.value === "minterpolate" &&
          ctl2?.targetFps?.disabled === false && warnLong && okAlive,
          `interp ${ctl1.interp.value} -> ${ctl2?.interp?.value}, ` +
          `targetFps disabled ${ctl1.targetFps?.disabled} -> ${ctl2?.targetFps?.disabled}, ` +
          `tip warnLong=${warnLong}, app còn sống=${okAlive}`);
      }
    }

    // M3 — bật blur bằng click thật vào checkbox.
    const ctl2 = await find("controls");
    if (!ctl2 || !ctl2.blurCheck) skip("M3 bật blur (click thật)", "không tìm thấy checkbox blur trong MotionPanel");
    else {
      await cdp.click(ctl2.blurCheck.pos.x, ctl2.blurCheck.pos.y);
      await sleep(600);
      const ctl3 = await find("controls");
      record("M3 bật blur (click thật)", ctl3?.blurCheck?.checked === true && !!ctl3?.blurRange,
        `checkbox ${ctl2.blurCheck.checked} -> ${ctl3?.blurCheck?.checked}, ` +
        `range ${ctl3?.blurRange ? `xuất hiện (value=${ctl3.blurRange.value}, ${ctl3.blurRange.min}..${ctl3.blurRange.max})` : "không xuất hiện"}`);
    }

    // M4 — tăng frame gộp bằng phím thật: focus range + ArrowRight 1 lần
    // (step=1) — kỳ vọng value tăng đúng 1, không nhảy cóc.
    const ctl3 = await find("controls");
    if (!ctl3 || !ctl3.blurRange) skip("M4 tăng frame gộp (phím thật)", "range blur chưa xuất hiện từ M3 nên không có gì để tăng");
    else {
      const focused = await find("focusRange");
      if (!focused) record("M4 tăng frame gộp (phím thật)", false, "không focus được range blur");
      else {
        const before = Number(ctl3.blurRange.value);
        await cdp.key("ArrowRight", "ArrowRight");
        await sleep(600);
        const ctl4 = await find("controls");
        const after = ctl4?.blurRange ? Number(ctl4.blurRange.value) : null;
        record("M4 tăng frame gộp (phím thật)", after === before + 1,
          `frame gộp ${before} -> ${after} (kỳ vọng ${before + 1}); nhãn range='${ctl4?.blurRange?.label || ""}'`);
      }
    }

    // M5 — bấm "Tắt tất cả": motion phải về trạng thái tắt hoàn toàn và
    // app vẫn sống (undo/redo không nằm trong phạm vi luồng này).
    const ctl4 = await find("controls");
    if (!ctl4 || !ctl4.disableBtn) skip("M5 tắt tất cả motion", "không có nút 'Tắt tất cả' — các bước trước có thể chưa bật motion thành công");
    else {
      await cdp.click(ctl4.disableBtn.x, ctl4.disableBtn.y);
      await sleep(600);
      const ctl5 = await find("controls");
      const okAlive = await alive();
      record("M5 tắt tất cả motion", ctl5?.interp?.value === "none" &&
        ctl5?.targetFps?.disabled === true && ctl5?.blurCheck?.checked === false &&
        !ctl5?.blurRange && !ctl5?.disableBtn && okAlive,
        `sau tắt: interp=${ctl5?.interp?.value} targetFps disabled=${ctl5?.targetFps?.disabled} ` +
        `blur=${ctl5?.blurCheck?.checked} range=${ctl5?.blurRange ? "còn" : "mất"} ` +
        `disableAll=${ctl5?.disableBtn ? "còn" : "mất"} app sống=${okAlive}`);
    }

    // M6 — chọn clip chữ: MotionPanel chỉ có ở nhánh video nên section
    // Slow-mo PHẢI vắng; app vẫn sống. Đây là hành vi đúng, không phải
    // thiếu panel.
    const s6 = await cdp.evalJs(SNAP_JS);
    const tIdx = s6.clips.findIndex((c) => c.kind === "clip-text");
    if (tIdx < 0) skip("M6 clip chữ không có MotionPanel", "project mẫu không có clip chữ");
    else {
      const pos = await find("scrollClip", tIdx);
      await cdp.click(pos.x, pos.y);
      await sleep(600);
      const sec6 = await find("section");
      const okAlive = await alive();
      record("M6 clip chữ không có MotionPanel", sec6 === null && okAlive,
        sec6 === null
          ? `đã chọn clip chữ, section Slow-mo vắng (đúng thiết kế: panel chỉ ở nhánh video), app sống=${okAlive}`
          : `section Slow-mo vẫn hiện ở clip chữ ('${sec6.title}') — sai thiết kế`);
    }
  } finally {
    kill();
  }
  const failed = results.filter((r) => !r.ok);
  const skipped = results.filter((r) => r.skipped);
  console.log(`\n== TỔNG: ${results.length - failed.length}/${results.length} pass (${skipped.length} SKIP) ==`);
  if (failed.length) console.log(`CHƯA ĐẠT: ${failed.map((r) => r.name).join(", ")}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS LỖI:", e.message); process.exit(2); });
