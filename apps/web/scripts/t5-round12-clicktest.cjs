// t5-round12-clicktest.cjs — T5 (Phase 9 đợt 12): click-test CDP headless
// phủ nợ click-test đợt 11 P5 mà speed-curve editor mới (SpeedPanel)
// vừa đóng: nhánh dương cảnh báo stabilize+ramp, panel motion
// weights/miMode mới, và ghost sau sửa (CHỈ kiểm tra UI hiển thị —
// badge BLUR≈ — không đo pixel; pixel thuộc luồng T1).
//
// Dùng vite dev riêng cổng 5192 (tránh đụng 5173/5190/5191 của các luồng
// khác), debug port 9339, profile /tmp/t5-cdprof. Mẫu CDP theo
// p5-round11-clicktest.cjs (Node thuần + WebSocket có sẵn, không cần
// Playwright). Exit: 0 khi không có FAIL (SKIP không tính là FAIL),
// 1 khi có FAIL, 2 khi harness lỗi (không tới được dev server / chrome)
// — KHÔNG bao giờ báo pass giả.
//
// Thứ tự test nối tiếp trên cùng 1 project mẫu (đúng như user làm thật):
//   T0 load sample + đóng welcome modal -> T0b chọn clip video đầu ->
//   T1 bật speed curve bằng click thật: 2 điểm 1× @0s/@4s hiện ->
//   T2 preset "Chậm → nhanh" bằng click thật (0.5×/2×), thêm điểm giữa
//   bằng click thật (3 điểm, điểm giữa @2s), tăng v điểm giữa bằng
//   phím thật (1× -> 1.05×) -> T3 chọn clip video khác rồi chọn lại
//   clip đầu: curve vẫn còn đủ 3 điểm (chứng tỏ lưu vào project qua
//   patchClip, không phải state cục bộ của component) -> T4 bật chống
//   rung bằng click thật khi đang có curve: cảnh báo stabilize HIỆN
//   ở cả MotionPanel lẫn EnhancePanel (nhánh dương đợt 11 P6b) ->
//   T5 tắt curve bằng click thật: cả 2 cảnh báo BIẾN MẤT (nhánh âm) ->
//   T6 motion weights/miMode (kiểm chứng lại sau khi sửa SpeedPanel):
//   bật blur -> 3 slider weights, bật nội suy -> miMode hết disable,
//   đổi miMode mci -> blend bằng phím thật -> T7 ghost UI: đang phát,
//   badge chứa BLUR≈ (chỉ UI, không đo pixel) -> T8 bật lại curve +
//   bật reverse bằng click thật: cảnh báo reverse+ramp HIỆN trong
//   SpeedPanel, rồi trả lại trạng thái sạch (tắt reverse, tắt curve).
//
// GHI CHÚ TRUNG THỰC (đọc trước khi đọc kết quả):
// - Click-test này chứng minh speedKeyframes được TẠO và LƯU qua UI
//   thật (nhãn điểm đổi theo click/phím, survive đổi selection) và
//   cảnh báo stabilize+ramp PHẢN ỨNG theo sự hiện diện của curve.
//   Nó KHÔNG chứng minh render thật chặn đúng tổ hợp này (validator
//   render đã có test riêng ở server/render/test_p3.js), cũng KHÔNG
//   đo pixel preview khớp render (việc của harness V6/V10 và luồng T1).
// - Ghost: chỉ kiểm tra badge BLUR≈ hiển thị khi blur bật (UI). Vệt
//   ghost có lộ ra bằng pixel hay không là câu hỏi của luồng T1, và
//   đợt 11 P5 đã đo on-vs-off ≈ jitter baseline trên clip đục.
// - So khớp nhãn: CSS uppercase toàn bộ nhãn trong panel nên mọi so
//   khớp text đều hạ về lowercase trước (bài học P5).
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEBUG_PORT = Number(process.argv[2] || 9339);
const DEV_PORT = 5192;
const DEV_URL = process.env.T5_DEV_URL || `http://localhost:${DEV_PORT}/`;
const WEB_DIR = path.join(__dirname, "..");
const CHROME =
  process.env.T5_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/t5-cdprof";
const VITE_LOG = "/tmp/t5-vite.log";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function record(name, ok, detail) {
  results.push({ name, status: ok ? "PASS" : "FAIL", detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}
function skip(name, detail) {
  results.push({ name, status: "SKIP", detail });
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
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code, modifiers = 0, text) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown", text });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(150);
  }
  async waitFor(fn, label, timeoutMs = 180000) {
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

// Định vị control (bài học M6/V10/P5: cuộn HẾT element trước rồi mới đo
// tọa độ, vì cuộn element sau xê dịch element trước trong .inspector;
// so khớp nhãn hạ về lowercase vì CSS uppercase nhãn panel).
const FIND_JS = `((kind, a) => {
  const ctr = (el) => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const ctrNoScroll = (el) => { const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const sectionBy = (needle) => {
    const btn = [...document.querySelectorAll('.ins-section > button')]
      .find(b => (b.innerText || '').includes(needle));
    return btn ? btn.closest('.ins-section') : null;
  };
  const low = (t) => (t || '').toLowerCase();
  if (kind === 'speed') {
    const s = sectionBy('Tốc độ');
    if (!s) return null;
    const curve = s.querySelector('.speed-curve');
    const enableBtn = curve ? curve.querySelector('.curve-enable-btn') : null;
    const disableBtn = curve ? curve.querySelector('.curve-disable-btn') : null;
    const addBtn = curve ? curve.querySelector('.curve-add-btn') : null;
    const presetBtns = curve ? [...curve.querySelectorAll('.curve-preset')] : [];
    const kfRows = curve ? [...curve.querySelectorAll('.curve-kf')] : [];
    const revBtn = [...s.querySelectorAll('button')]
      .find(b => low(b.innerText).includes('phát xuôi') || low(b.innerText).includes('đang đảo ngược'));
    // Cuộn HẾT trước khi đo tọa độ (nếu đo trước rồi mới cuộn nút khác
    // thì tọa độ các nút đã đo sẽ lệch theo — bài học M6/V10/P5).
    [enableBtn, disableBtn, addBtn, revBtn, ...presetBtns,
     ...kfRows.flatMap(r => [r.querySelector('.curve-kf-t'), r.querySelector('.curve-kf-v')])]
      .forEach(el => { if (el) try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} });
    const presets = presetBtns.map(b => ({
      preset: b.dataset.preset || '', pos: ctrNoScroll(b),
      label: (b.innerText || '').trim() }));
    const kfs = kfRows.map((row, i) => {
      const t = row.querySelector('.curve-kf-t');
      const v = row.querySelector('.curve-kf-v');
      return { i,
        label: (row.querySelector('.curve-kf-label span')?.innerText || '').trim(),
        t: t ? { value: t.value, pos: ctrNoScroll(t) } : null,
        v: v ? { value: v.value, pos: ctrNoScroll(v) } : null };
    });
    return {
      enableBtn: enableBtn ? { pos: ctrNoScroll(enableBtn) } : null,
      disableBtn: disableBtn ? { pos: ctrNoScroll(disableBtn) } : null,
      addBtn: addBtn ? { pos: ctrNoScroll(addBtn) } : null,
      presets, kfs,
      warns: curve ? [...curve.querySelectorAll('.warn')].map(w => w.innerText) : [],
      revBtn: revBtn ? { text: (revBtn.innerText || '').trim(), pos: ctrNoScroll(revBtn) } : null,
    };
  }
  if (kind === 'motion') {
    const s = sectionBy('Slow-mo');
    if (!s) return null;
    const selects = [...s.querySelectorAll('select')];
    const check = s.querySelector('input[type="checkbox"]');
    const ranges = [...s.querySelectorAll('input[type="range"]')];
    const weightRanges = ranges.filter(r => /^frame [0-9]+:/.test(low((r.closest('label')?.innerText || '').trim())));
    const framesRange = ranges.find(r => low(r.closest('label')?.innerText || '').includes('số frame gộp'));
    const pctOf = (labelEl) => {
      const m = (labelEl?.innerText || '').match(/([0-9]+)%/);
      return m ? Number(m[1]) : null;
    };
    [...ranges, check, ...selects].forEach(el => { if (el) try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} });
    return {
      selects: selects.map(sel => ({ value: sel.value, disabled: sel.disabled, pos: ctrNoScroll(sel),
        options: [...sel.options].map(o => o.value) })),
      blurCheck: check ? { checked: check.checked, pos: ctrNoScroll(check) } : null,
      weightRanges: weightRanges.map(r => ({ value: r.value, pct: pctOf(r.closest('label')),
        label: (r.closest('label')?.innerText || '').trim(), pos: ctrNoScroll(r) })),
      framesRange: framesRange ? { value: framesRange.value, pos: ctrNoScroll(framesRange) } : null,
      tips: [...s.querySelectorAll('.tips')].map(t => t.innerText),
    };
  }
  if (kind === 'enhance') {
    const s = sectionBy('Tăng cường');
    if (!s) return null;
    const checks = [...s.querySelectorAll('input[type="checkbox"]')];
    const stab = checks.find(c => low(c.closest('label')?.innerText || '').includes('chống rung'));
    checks.forEach(el => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} });
    return {
      stabCheck: stab ? { checked: stab.checked, pos: ctrNoScroll(stab) } : null,
      tips: [...s.querySelectorAll('.tips')].map(t => t.innerText),
    };
  }
  if (kind === 'canvas') {
    const cv = document.querySelector('.preview-canvas');
    const badge = document.querySelector('.preview-motion-badge');
    return cv ? {
      badgeText: badge ? (badge.textContent || '') : '',
    } : null;
  }
  if (kind === 'pos') {
    let el = null;
    if (a === 'playBtn') el = document.querySelector('.tbtn.play');
    else if (a === 'stopBtn') el = [...document.querySelectorAll('.tbtn')].find(b => (b.innerText || '').includes('⏮')) || null;
    else if (typeof a === 'string' && a.startsWith('scrollClip:')) {
      const els = [...document.querySelectorAll('.tl-clip')];
      el = els[Number(a.split(':')[1])] || null;
    }
    return el ? ctr(el) : null;
  }
  if (kind === 'speedTarget') {
    // Đo tọa độ của RIÊNG control được click, cuộn riêng nó vào view ngay
    // trước khi click. Lý do (phát hiện ở lần chạy T8a đầu): finder 'speed'
    // cuộn lần lượt nhiều control rồi mới đo — control ở đầu panel (nút
    // đảo ngược) có thể bị cuộn ra khỏi viewport khi control cuối (slider
    // keyframe dưới cùng) được cuộn vào giữa, khiến click CDP rơi nhầm
    // chỗ khác mà không báo lỗi. Đo riêng từng control trước mỗi click
    // loại được lỗi này.
    const s = sectionBy('Tốc độ');
    if (!s) return null;
    const curve = s.querySelector('.speed-curve');
    let el = null;
    if (a === 'rev') {
      el = [...s.querySelectorAll('button')]
        .find(b => low(b.innerText).includes('phát xuôi') || low(b.innerText).includes('đang đảo ngược'));
    } else if (a === 'enable') el = curve ? curve.querySelector('.curve-enable-btn') : null;
    else if (a === 'disable') el = curve ? curve.querySelector('.curve-disable-btn') : null;
    else if (a === 'add') el = curve ? curve.querySelector('.curve-add-btn') : null;
    else if (typeof a === 'string' && a.startsWith('preset:')) {
      el = curve ? curve.querySelector('.curve-preset[data-preset="' + a.slice('preset:'.length) + '"]') : null;
    }
    return el ? ctr(el) : null;
  }
  if (kind === 'focusMotionSelect') {
    const s = sectionBy('Slow-mo');
    if (!s) return false;
    const sel = [...s.querySelectorAll('select')][a];
    if (!sel) return false;
    sel.focus();
    return true;
  }
  if (kind === 'focusCurveV') {
    const s = sectionBy('Tốc độ');
    if (!s) return false;
    const rows = [...s.querySelectorAll('.curve-kf')];
    const v = rows[a]?.querySelector('.curve-kf-v');
    if (!v) return false;
    v.focus();
    return true;
  }
  if (kind === 'playing') {
    const btn = document.querySelector('.tbtn.play');
    return btn ? btn.getAttribute('aria-pressed') === 'true' : null;
  }
  return null;
})`;

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  const viteCandidates = [
    path.join(WEB_DIR, "..", "..", "node_modules", ".bin", "vite"),
    path.join(WEB_DIR, "node_modules", ".bin", "vite"),
  ];
  const viteBin = viteCandidates.find((c) => fs.existsSync(c));
  if (!viteBin) throw new Error(`không thấy vite tại ${viteCandidates.join(" hoặc ")}`);
  fs.rmSync(PROFILE, { recursive: true, force: true });

  const logFd = fs.openSync(VITE_LOG, "w");
  const vite = spawn(viteBin, ["--port", String(DEV_PORT), "--strictPort"],
    { cwd: WEB_DIR, stdio: ["ignore", logFd, logFd] });
  const killVite = () => { try { vite.kill("SIGKILL"); } catch {} };
  process.on("exit", killVite);
  try {
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try {
        const r = await fetch(DEV_URL);
        if (r.ok) up = true;
      } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120s (xem ${VITE_LOG})`);

    const chrome = spawn(CHROME, [
      "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${PROFILE}`, "--no-sandbox", "--disable-gpu",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank",
    ], { stdio: "ignore" });
    const killChrome = () => { try { chrome.kill("SIGKILL"); } catch {} };
    process.on("exit", killChrome);
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
      const playState = async () => find("playing");
      const setPlaying = async (want) => {
        if ((await playState()) !== want) {
          const pos = await find("pos", "playBtn");
          if (!pos) throw new Error("không đo được tọa độ nút play");
          await cdp.click(pos.x, pos.y);
          await sleep(500);
        }
      };
      const selectVideoClip = async (videoOrdinal) => {
        const s = await cdp.evalJs(SNAP_JS);
        const videoIdxs = s.clips
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => c.kind === "clip-video")
          .map(({ i }) => i);
        if (videoIdxs.length <= videoOrdinal) return null;
        const pos = await find("pos", `scrollClip:${videoIdxs[videoOrdinal]}`);
        if (!pos) return null;
        await cdp.click(pos.x, pos.y);
        await sleep(600);
        return videoIdxs[videoOrdinal];
      };

      // T0 — load project mẫu.
      const snap0 = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(SNAP_JS);
        return s.clips.length >= 3 ? s : null;
      }, "project mẫu >= 3 clip", 180000);
      record("T0 load sample", true,
        `${snap0.clips.length} clip: ${snap0.clips.map((c) => `${c.kind}@${c.track}`).join(", ")}`);
      const modalSel = `.modal-backdrop, .tour-card, .welcome-modal`;
      const modalOpen = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
      if (modalOpen) { await cdp.click(20, 20); await sleep(500); }
      const modalGone = !(await cdp.evalJs(`!!document.querySelector('${modalSel}')`));
      record("T0b welcome modal", modalGone, modalOpen ? "modal tự mở — đã đóng bằng click backdrop" : "không có modal tự mở");
      if (!modalGone) return;

      // T0c — chọn clip video đầu.
      const firstVideo = await selectVideoClip(0);
      if (firstVideo === null) { skip("T0c chọn clip video đầu", "project mẫu không có clip video"); return; }
      record("T0c chọn clip video đầu", true, `timeline index ${firstVideo}`);

      // T1 — bật speed curve bằng click thật.
      let sp = await find("speed");
      if (!sp) skip("T1 bật speed curve (2 điểm 1×)", "không tìm thấy SpeedPanel sau khi chọn clip video");
      else if (!sp.enableBtn) skip("T1 bật speed curve (2 điểm 1×)", "không có nút bật speed curve (có thể curve đã bật sẵn)");
      else if (sp.kfs.length !== 0) skip("T1 bật speed curve (2 điểm 1×)", `đã có ${sp.kfs.length} điểm từ trước nên không đo được chuyển 0 -> 2`);
      else {
        const target = await find("speedTarget", "enable");
        if (!target) { record("T1 bật speed curve (2 điểm 1×)", false, "không đo được tọa độ riêng của nút bật speed curve"); }
        else {
          await cdp.click(target.x, target.y);
          await sleep(600);
          sp = await find("speed");
          const labels = (sp?.kfs || []).map((k) => k.label);
          const ok = sp && sp.kfs.length === 2 &&
            sp.kfs[0].label.toLowerCase().includes("1×") &&
            sp.kfs[1].label.toLowerCase().includes("1×");
          record("T1 bật speed curve (2 điểm 1×)", ok,
            `kfs=${sp?.kfs.length} labels=[${labels.join(" | ")}] app sống=${await alive()}`);
        }
      }

      // T2 — preset + thêm điểm + sửa v bằng phím thật.
      sp = await find("speed");
      const preset = (sp?.presets || []).find((p) => p.preset === "slow-fast");
      if (!preset) skip("T2 preset/thêm điểm/sửa v", "không tìm thấy preset slow-fast (cần T1 bật curve trước)");
      else {
        const target = await find("speedTarget", "preset:slow-fast");
        if (target) await cdp.click(target.x, target.y);
        await sleep(600);
        sp = await find("speed");
        const labels1 = (sp?.kfs || []).map((k) => k.label);
        const presetOk = sp && sp.kfs.length === 2 &&
          labels1[0].toLowerCase().includes("0.5") && labels1[1].toLowerCase().includes("2");
        record("T2a preset Chậm → nhanh (0.5×/2×)", presetOk,
          `labels=[${labels1.join(" | ")}]`);
        if (!sp?.addBtn) skip("T2b thêm điểm giữa (3 điểm)", "không tìm thấy nút thêm điểm");
        else {
          const addTarget = await find("speedTarget", "add");
          if (addTarget) await cdp.click(addTarget.x, addTarget.y);
          await sleep(600);
          sp = await find("speed");
          const labels2 = (sp?.kfs || []).map((k) => k.label);
          const addOk = sp && sp.kfs.length === 3 && labels2[1].toLowerCase().includes("2s");
          record("T2b thêm điểm giữa (3 điểm, điểm giữa @2s)", addOk,
            `kfs=${sp?.kfs.length} labels=[${labels2.join(" | ")}]`);
          const focused = await find("focusCurveV", 1);
          if (!focused) record("T2c tăng v điểm giữa bằng phím (1× -> 1.05×)", false, "không focus được slider v điểm giữa");
          else {
            await cdp.key("ArrowRight", "ArrowRight");
            await sleep(600);
            sp = await find("speed");
            const mid = sp?.kfs?.[1]?.label || "";
            record("T2c tăng v điểm giữa bằng phím (1× -> 1.05×)",
              mid.toLowerCase().includes("1.05"),
              `điểm giữa label='${mid}' (kỳ vọng chứa 1.05×)`);
          }
        }
      }

      // T3 — đổi selection rồi quay lại: curve phải còn đủ 3 điểm.
      const secondVideo = await selectVideoClip(1);
      if (secondVideo === null) skip("T3 curve survive đổi selection", "project mẫu không có clip video thứ 2");
      else {
        const spOther = await find("speed");
        const otherHasCurve = (spOther?.kfs || []).length > 0;
        await selectVideoClip(0);
        sp = await find("speed");
        const labels = (sp?.kfs || []).map((k) => k.label);
        record("T3 curve survive đổi selection (3 điểm còn nguyên)",
          (sp?.kfs || []).length === 3 && !otherHasCurve,
          `clip khác có curve=${otherHasCurve} (kỳ vọng false); quay lại clip đầu: kfs=${sp?.kfs.length} labels=[${labels.join(" | ")}]`);
      }

      // T4 — nhánh dương: bật chống rung khi đang có curve.
      let en = await find("enhance");
      if (!en) skip("T4 chống rung + curve: cảnh báo HIỆN (cả 2 panel)", "không tìm thấy EnhancePanel");
      else if (!en.stabCheck) skip("T4 chống rung + curve: cảnh báo HIỆN (cả 2 panel)", "không tìm thấy checkbox chống rung");
      else {
        if (!en.stabCheck.checked) {
          await cdp.click(en.stabCheck.pos.x, en.stabCheck.pos.y);
          await sleep(600);
        }
        en = await find("enhance");
        const mo = await find("motion");
        const motionWarn = (mo?.tips || []).some((t) => t.toLowerCase().includes("bật cả chống rung và speed curve"));
        const enhanceWarn = (en?.tips || []).some((t) => t.toLowerCase().includes("không dùng chung"));
        record("T4 chống rung + curve: cảnh báo HIỆN (cả 2 panel)",
          en?.stabCheck?.checked === true && motionWarn && enhanceWarn && (await alive()),
          `stabilize=${en?.stabCheck?.checked} motionWarn=${motionWarn} enhanceWarn=${enhanceWarn} app sống=${await alive()}`);
      }

      // T5 — nhánh âm: tắt curve -> cả 2 cảnh báo biến mất.
      sp = await find("speed");
      if (!sp?.disableBtn) skip("T5 tắt curve: cảnh báo BIẾN MẤT", "không tìm thấy nút tắt speed curve (cần T1/T4 bật curve trước)");
      else {
        const disTarget = await find("speedTarget", "disable");
        if (disTarget) await cdp.click(disTarget.x, disTarget.y);
        await sleep(600);
        sp = await find("speed");
        en = await find("enhance");
        const mo = await find("motion");
        const motionWarn = (mo?.tips || []).some((t) => t.toLowerCase().includes("bật cả chống rung và speed curve"));
        const enhanceWarn = (en?.tips || []).some((t) => t.toLowerCase().includes("không dùng chung"));
        record("T5 tắt curve: cảnh báo BIẾN MẤT (cả 2 panel)",
          (sp?.kfs || []).length === 0 && !motionWarn && !enhanceWarn && (await alive()),
          `kfs sau tắt=${(sp?.kfs || []).length} motionWarn=${motionWarn} enhanceWarn=${enhanceWarn} app sống=${await alive()}`);
      }

      // T6 — motion weights/miMode (kiểm chứng lại sau khi sửa SpeedPanel).
      let mo = await find("motion");
      if (!mo) skip("T6 motion weights/miMode", "không tìm thấy MotionPanel");
      else if (mo.blurCheck?.checked) skip("T6 motion weights/miMode", "blur đã bật sẵn từ trước");
      else {
        await cdp.click(mo.blurCheck.pos.x, mo.blurCheck.pos.y);
        await sleep(600);
        mo = await find("motion");
        const pcts = (mo?.weightRanges || []).map((r) => r.pct);
        const weightsOk = (mo?.weightRanges || []).length === 3 && pcts.every((p) => p !== null && p >= 30 && p <= 36);
        record("T6a bật motion blur (3 slider weights)", weightsOk,
          `weightRanges=${(mo?.weightRanges || []).length} pcts=[${pcts.join(",")}]`);
        const focused = await find("focusMotionSelect", 0);
        if (!focused) record("T6b nội suy + miMode (phím thật)", false, "không focus được select nội suy");
        else {
          await cdp.key("ArrowDown", "ArrowDown");
          await sleep(600);
          mo = await find("motion");
          const interpOk = mo?.selects?.[0]?.value === "minterpolate";
          const miEnabled = mo?.selects?.[2] && mo.selects[2].disabled === false;
          let miOk = false, miDetail = "";
          if (miEnabled) {
            const f2 = await find("focusMotionSelect", 2);
            if (f2) {
              await cdp.key("ArrowDown", "ArrowDown");
              await sleep(600);
              mo = await find("motion");
              miOk = mo?.selects?.[2]?.value === "blend";
              miDetail = `miMode -> ${mo?.selects?.[2]?.value}`;
            } else miDetail = "không focus được select miMode";
          } else miDetail = `miMode vẫn disabled (disabled=${mo?.selects?.[2]?.disabled})`;
          record("T6b nội suy + miMode (phím thật)", interpOk && miEnabled && miOk && (await alive()),
            `interp -> ${mo?.selects?.[0]?.value}, miMode enabled=${miEnabled}, ${miDetail}, app sống=${await alive()}`);
        }
      }

      // T7 — ghost UI: badge BLUR≈ hiện khi đang phát (KHÔNG đo pixel).
      await setPlaying(true);
      let badgeText = "";
      try {
        badgeText = await cdp.waitFor(async () => {
          const cv = await find("canvas");
          return cv?.badgeText?.includes("BLUR") ? cv.badgeText : null;
        }, "badge BLUR≈ trong khi phát", 30000);
      } catch { badgeText = (await find("canvas"))?.badgeText || ""; }
      await setPlaying(false);
      record("T7 ghost UI: badge BLUR≈ hiện khi blur bật (đang phát)",
        badgeText.includes("BLUR"),
        `badge='${badgeText}' (chỉ kiểm tra UI hiển thị, không đo pixel — pixel thuộc luồng T1)`);

      // T8 — cảnh báo reverse+ramp trong SpeedPanel, rồi trả trạng thái sạch.
      // Dọn trước: tắt chống rung còn bật từ T4 để danh sách cảnh báo ở T8a
      // chỉ còn ứng viên reverse+ramp (nếu không, cảnh báo stabilize+ramp
      // từ T4 sẽ lẫn vào và làm nhiễu kết luận T8a).
      en = await find("enhance");
      if (en?.stabCheck?.checked) {
        await cdp.click(en.stabCheck.pos.x, en.stabCheck.pos.y);
        await sleep(600);
        en = await find("enhance");
        record("T8pre tắt chống rung (dọn trạng thái từ T4)",
          en?.stabCheck?.checked === false,
          `stabilize sau tắt=${en?.stabCheck?.checked}`);
      }
      sp = await find("speed");
      if (!sp?.enableBtn) skip("T8 reverse + curve: cảnh báo HIỆN", "không tìm thấy nút bật speed curve (cần curve đang tắt)");
      else {
        const enTarget = await find("speedTarget", "enable");
        if (enTarget) await cdp.click(enTarget.x, enTarget.y);
        await sleep(600);
        sp = await find("speed");
        if (!sp?.revBtn) record("T8 reverse + curve: cảnh báo HIỆN", false, "bật curve xong nhưng không tìm thấy nút đảo ngược trong SpeedPanel");
        else {
          const revTarget = await find("speedTarget", "rev");
          if (revTarget) await cdp.click(revTarget.x, revTarget.y);
          await sleep(600);
          sp = await find("speed");
          const revWarn = (sp?.warns || []).some((w) => {
            const l = w.toLowerCase();
            return l.includes("đảo ngược") && l.includes("speedkeyframes");
          });
          record("T8a reverse + curve: cảnh báo HIỆN trong SpeedPanel", revWarn,
            `warns=[${(sp?.warns || []).join(" | ")}] revBtn='${sp?.revBtn?.text}'`);
          // Trả lại trạng thái sạch: tắt reverse, tắt curve.
          sp = await find("speed");
          if (sp?.revBtn && sp.revBtn.text.toLowerCase().includes("đang đảo ngược")) {
            const revTarget2 = await find("speedTarget", "rev");
            if (revTarget2) await cdp.click(revTarget2.x, revTarget2.y);
            await sleep(600);
          }
          sp = await find("speed");
          if (sp?.disableBtn) {
            const disTarget2 = await find("speedTarget", "disable");
            if (disTarget2) await cdp.click(disTarget2.x, disTarget2.y);
            await sleep(600);
          }
          sp = await find("speed");
          record("T8b trả trạng thái sạch (tắt reverse + tắt curve)",
            (sp?.kfs || []).length === 0 && (sp?.enableBtn != null) && (await alive()),
            `kfs=${(sp?.kfs || []).length} enableBtn trở lại=${sp?.enableBtn != null} app sống=${await alive()}`);
        }
      }
    } finally {
      killChrome();
    }
  } finally {
    killVite();
    try { fs.closeSync(logFd); } catch {}
  }
  const passed = results.filter((r) => r.status === "PASS");
  const failed = results.filter((r) => r.status === "FAIL");
  const skipped = results.filter((r) => r.status === "SKIP");
  console.log(`\n== TỔNG: ${passed.length} PASS, ${failed.length} FAIL, ${skipped.length} SKIP / ${results.length} ==`);
  if (failed.length) console.log(`CHƯA ĐẠT: ${failed.map((r) => r.name).join(", ")}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS LỖI:", e.message); process.exit(2); });
