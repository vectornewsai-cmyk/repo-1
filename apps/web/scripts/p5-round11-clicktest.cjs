// p5-round11-clicktest.cjs — P5 (Phase 9 đợt 11): click-test CDP headless
// phủ nợ click-test của đợt 9/10 trên Chromium headless, tái dùng mẫu
// V10/M6 (Node thuần + WebSocket có sẵn, không cần Playwright).
//
// Dùng vite dev riêng cổng 5191 (tránh đụng 5173/5190 nếu luồng khác đang
// chạy dev), debug port 9338, profile /tmp/p5-cdprof.
// Exit: 0 khi tất cả pass, 1 khi có FAIL, 2 khi harness lỗi (không tới
// được dev server / chrome) — KHÔNG bao giờ báo pass giả.
//
// Thứ tự test nối tiếp trên cùng 1 project mẫu (đúng như user làm thật):
//   P0 load sample -> P0b đóng welcome modal -> P1 chọn clip video, kiểm
//   tra badge EffectPanel (mọi item có badge; 8 type canvas đợt 10 phải
//   là "approx", không còn "none"; có ít nhất 1 "matched") -> P2 bật/tắt
//   effect "Lật ngang" bằng click thật, badge giữ "approx" -> P3 bật
//   motion blur bằng click thật, 3 slider weights hiện (mặc định 33%)
//   -> P4 tăng weight frame 1 bằng phím thật, nhãn % tăng -> P5 bật nội
//   suy bằng phím thật, select miMode hết disable, đổi miMode mci->blend
//   bằng phím thật -> P6 bật chống rung bằng click thật (đang có nội suy,
//   KHÔNG có speedKeyframes): cảnh báo stabilize của MotionPanel PHẢI
//   VẮNG (hồi quy cho bug đợt 9: panel cũ cảnh báo sai stabilize+interp)
//   -> P7 ghost preview: canvas tồn tại + vẽ nội dung động, badge BLUR≈
//   hiện khi blur bật, và probe pixel on-vs-off (xem ghi chú P7).
//   Probe P7c dùng median 3 mẫu trong cửa sổ muộn [2.5s, 3.0s), cả 3 lần
//   chụp đều restart từ đầu bằng nút ⏮ (cùng cơ chế) để loại artifact
//   frame đen lúc resume/seek; P7d ở cửa sổ fade chỉ là INFO tham khảo
//   (cửa sổ fade nhạy với thời điểm chụp tuyệt đối, baseline jitter
//   5.59 đã chứng minh nó không tách được tín hiệu ghost).
//
// GHI CHÚ TRUNG THỰC (đọc trước khi đọc kết quả P7):
// - SpeedKeyframes KHÔNG có UI nào trong app tạo ra được (chỉ có qua
//   spec/API), nên nhánh dương của cảnh báo stabilize+ramp (hiện khi có
//   cả stabilize và speedKeyframes) KHÔNG click-test được — harness ghi
//   SKIP cho nhánh đó kèm lý do, không bịa click. Nhánh âm (P6) mới là
//   hồi quy cho bug đợt 9 đã sửa.
// - Ghost không có layer DOM riêng: nó vẽ lên cùng canvas preview, trước
//   frame hiện tại (preview.tsx drawMotionBlurGhosts rồi mới drawImage
//   frame hiện tại). Với clip đục, frame hiện tại phủ kín bóng nên pixel
//   có thể không đổi dù ghostAlphas đúng — probe P7 đo thật on-vs-off
//   với baseline off-vs-off để phân biệt jitter với vệt ghost, và báo
//   số thật thay vì claim. Chuỗi weights -> ghostAlphas đã có unit test
//   (previewEngine.test.ts: resolveMotionBlurGhost).
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEBUG_PORT = Number(process.argv[2] || 9338);
const DEV_PORT = 5191;
const DEV_URL = process.env.P5_DEV_URL || `http://localhost:${DEV_PORT}/`;
const WEB_DIR = path.join(__dirname, "..");
const CHROME =
  process.env.P5_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/p5-cdprof";
const VITE_LOG = "/tmp/p5-vite.log";
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

// Định vị control (bài học M6/V10: cuộn HẾT element trước rồi mới đo tọa
// độ, vì cuộn element sau xê dịch element trước trong .inspector).
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
  const pctOf = (labelEl) => {
    const m = (labelEl?.innerText || '').match(/([0-9]+)%/);
    return m ? Number(m[1]) : null;
  };
  if (kind === 'panels') {
    const fx = document.querySelector('.effects-panel');
    const fxItems = fx ? [...fx.querySelectorAll('.fx-item')].map(it => ({
      name: (it.querySelector('.fx-name')?.innerText || '').trim(),
      on: it.classList.contains('on'),
      badge: it.querySelector('.fx-badge') ? {
        preview: it.querySelector('.fx-badge').dataset.preview || '',
        label: (it.querySelector('.fx-badge').innerText || '').trim(),
      } : null,
    })) : [];
    return { fxPanel: !!fx, fxItems };
  }
  if (kind === 'motion') {
    const s = sectionBy('Slow-mo');
    if (!s) return null;
    const selects = [...s.querySelectorAll('select')];
    const check = s.querySelector('input[type="checkbox"]');
    const ranges = [...s.querySelectorAll('input[type="range"]')];
    // LƯU Ý HARNESS: CSS uppercase toàn bộ nhãn trong panel nên innerText
    // trả về "FRAME 1: 33%" / "SỐ FRAME GỘP: 3" — mọi so khớp nhãn ở đây
    // đều hạ về lowercase trước, nếu không sẽ đọc sai 0 slider (bug P3
    // lần chạy đầu: click blur đã bật nhưng finder báo weightRanges=0).
    const low = (t) => (t || '').toLowerCase();
    const weightRanges = ranges.filter(r => /^frame [0-9]+:/.test(low((r.closest('label')?.innerText || '').trim())));
    const framesRange = ranges.find(r => low(r.closest('label')?.innerText || '').includes('số frame gộp'));
    ranges.forEach(el => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} });
    if (check) { try { check.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} }
    selects.forEach(el => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} });
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
    const stab = checks.find(c => (c.closest('label')?.innerText || '').toLowerCase().includes('chống rung'));
    checks.forEach(el => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} });
    return {
      stabCheck: stab ? { checked: stab.checked, pos: ctrNoScroll(stab) } : null,
      tips: [...s.querySelectorAll('.tips')].map(t => t.innerText),
    };
  }
  if (kind === 'canvas') {
    const cv = document.querySelector('.preview-canvas');
    const badge = document.querySelector('.preview-motion-badge');
    const timeEl = document.querySelector('.time-display');
    return cv ? {
      w: cv.width, h: cv.height,
      css: (() => { const r = cv.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
      badgeText: badge ? (badge.textContent || '') : '',
      badgeDisplay: badge ? (badge.style.display || '') : '',
      timeText: timeEl ? (timeEl.innerText || '') : '',
    } : null;
  }
  if (kind === 'canvasMean') {
    const cv = document.querySelector('.preview-canvas');
    if (!cv) return null;
    const ctx = cv.getContext('2d');
    if (!ctx) return null;
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 32) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    return { r: r / n, g: g / n, b: b / n, n };
  }
  if (kind === 'pos') {
    let el = null;
    if (typeof a === 'string' && a.startsWith('fxToggle:')) {
      const name = a.slice('fxToggle:'.length);
      const it = [...document.querySelectorAll('.fx-item')]
        .find(i => (i.querySelector('.fx-name')?.innerText || '').trim() === name);
      el = it ? it.querySelector('.fx-toggle') : null;
    } else if (a === 'playBtn') {
      el = document.querySelector('.tbtn.play');
    } else if (a === 'stopBtn') {
      el = [...document.querySelectorAll('.tbtn')]
        .find(b => (b.innerText || '').includes('⏮')) || null;
    } else if (a === 'scrollClip') {
      // a dạng 'scrollClip:<idx>' — xử lý ở nhánh riêng dưới.
    }
    if (typeof a === 'string' && a.startsWith('scrollClip:')) {
      const els = [...document.querySelectorAll('.tl-clip')];
      el = els[Number(a.split(':')[1])] || null;
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
  if (kind === 'focusWeightRange') {
    const s = sectionBy('Slow-mo');
    if (!s) return false;
    const ranges = [...s.querySelectorAll('input[type="range"]')]
      .filter(r => /^frame [0-9]+:/.test((r.closest('label')?.innerText || '').toLowerCase().trim()));
    const r = ranges[a];
    if (!r) return false;
    r.focus();
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
      const stopAndPlay = async () => {
        await setPlaying(false);
        const pos = await find("pos", "stopBtn");
        if (!pos) throw new Error("không đo được tọa độ nút về đầu");
        await cdp.click(pos.x, pos.y);
        await sleep(500);
        await setPlaying(true);
        return waitRestart(1.5);
      };
      // Chờ playhead vào cửa sổ [lo, hi) rồi chụp mean canvas. Trả null
      // nếu quá thời gian (playhead chạy qua cửa sổ mà chưa chụp kịp).
      const captureAtWindow = async (lo, hi, timeoutMs = 30000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < timeoutMs) {
          const cv = await find("canvas");
          const m = cv?.timeText?.match(/([0-9]+(?:\.[0-9]+)?)\s*\//);
          const t = m ? Number(m[1]) : null;
          if (t !== null && t >= lo && t < hi) return await find("canvasMean");
          await sleep(100);
        }
        return null;
      };
      // Chụp median của tối đa 3 mẫu trong cửa sổ (cách nhau ~120ms).
      // LÝ DO: chụp 1 frame đầu cửa sổ đôi khi vớ phải frame đen lúc video
      // chưa seek kịp sau restart (baseline off-vs-off dao động 0.32 ->
      // 35.91 giữa 2 lần chạy) — median loại được outlier frame đen đó.
      const captureMedianAtWindow = async (lo, hi, timeoutMs = 30000) => {
        const t0 = Date.now();
        const samples = [];
        const med = (arr) => {
          const v = [...arr].sort((a, b) => a - b);
          return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
        };
        while (Date.now() - t0 < timeoutMs) {
          const cv = await find("canvas");
          const m = cv?.timeText?.match(/([0-9]+(?:\.[0-9]+)?)\s*\//);
          const t = m ? Number(m[1]) : null;
          if (t !== null && t >= lo && t < hi) {
            samples.push(await find("canvasMean"));
            if (samples.length >= 3) break;
          } else if (t !== null && t >= hi && samples.length > 0) break;
          await sleep(120);
        }
        if (samples.length === 0) return null;
        return { r: med(samples.map((x) => x.r)), g: med(samples.map((x) => x.g)),
          b: med(samples.map((x) => x.b)), n: samples.length };
      };
      // Sau stop+play, chờ xác nhận playhead đã quay về < lo (chứng tỏ
      // restart thật) rồi mới chụp cửa sổ — tránh chụp nhầm playhead cũ
      // khi click stop không có tác dụng. Trả false nếu restart không
      // xảy ra trong 10s (harness sẽ SKIP probe thay vì báo sai).
      const waitRestart = async (lo, timeoutMs = 10000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < timeoutMs) {
          const cv = await find("canvas");
          const m = cv?.timeText?.match(/([0-9]+(?:\.[0-9]+)?)\s*\//);
          const t = m ? Number(m[1]) : null;
          if (t !== null && t < lo) return true;
          await sleep(100);
        }
        return false;
      };

      // P0 — load project mẫu.
      const snap0 = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(SNAP_JS);
        return s.clips.length >= 3 ? s : null;
      }, "project mẫu >= 3 clip", 180000);
      record("P0 load sample", true,
        `${snap0.clips.length} clip: ${snap0.clips.map((c) => `${c.kind}@${c.track}:${Math.round(c.w)}px`).join(", ")}`);
      const modalSel = `.modal-backdrop, .tour-card, .welcome-modal`;
      const modalOpen = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
      if (modalOpen) { await cdp.click(20, 20); await sleep(500); }
      const modalGone = !(await cdp.evalJs(`!!document.querySelector('${modalSel}')`));
      record("P0b welcome modal", modalGone, modalOpen ? "modal tự mở — đã đóng bằng click backdrop" : "không có modal tự mở");
      if (!modalGone) return;

      // P1 — chọn clip video, kiểm tra badge EffectPanel.
      const s1 = await cdp.evalJs(SNAP_JS);
      const vIdx = s1.clips.findIndex((c) => c.kind === "clip-video");
      if (vIdx < 0) { skip("P1 badge EffectPanel", "project mẫu không có clip video"); }
      else {
        const pos = await find("pos", `scrollClip:${vIdx}`);
        await cdp.click(pos.x, pos.y);
        await sleep(600);
        const p = await find("panels");
        const badges = p.fxItems.map((i) => i.badge?.preview ?? "");
        const counts = { matched: 0, approx: 0, none: 0, missing: 0 };
        for (const it of p.fxItems) {
          if (!it.badge) counts.missing++;
          else if (counts[it.badge.preview] !== undefined) counts[it.badge.preview]++;
          else counts.missing++;
        }
        const CANVAS_NAMES = ["Lật ngang", "Pixel hóa", "Sắc nét", "Viền nét",
          "Lệch kênh màu", "Rung lắc", "Nhiễu sóng", "Nhiễu hạt"];
        const canvasStates = CANVAS_NAMES.map((n) =>
          (p.fxItems.find((i) => i.name === n)?.badge?.preview ?? "MISSING"));
        const canvasOk = canvasStates.every((s) => s === "approx");
        record("P1 badge EffectPanel (8 type canvas đợt 10 = approx)",
          p.fxPanel && p.fxItems.length >= 16 && counts.missing === 0 && canvasOk && counts.matched >= 1,
          `fx-panel=${p.fxPanel} items=${p.fxItems.length} matched=${counts.matched} approx=${counts.approx} none=${counts.none} missing=${counts.missing} | canvas8=[${canvasStates.join(",")}]`);
      }

      // P2 — bật/tắt "Lật ngang" bằng click thật, badge giữ approx.
      const p1 = await find("panels");
      const mirror0 = (p1?.fxItems || []).find((i) => i.name === "Lật ngang");
      if (!mirror0) skip("P2 bật/tắt Lật ngang (badge giữ approx)", "không tìm thấy item 'Lật ngang'");
      else if (mirror0.on) skip("P2 bật/tắt Lật ngang (badge giữ approx)", "item đã bật sẵn từ trước nên không đo được chuyển off->on");
      else {
        const pos = await find("pos", "fxToggle:Lật ngang");
        await cdp.click(pos.x, pos.y);
        await sleep(600);
        const pOn = await find("panels");
        const onItem = (pOn?.fxItems || []).find((i) => i.name === "Lật ngang");
        const pos2 = await find("pos", "fxToggle:Lật ngang");
        await cdp.click(pos2.x, pos2.y);
        await sleep(600);
        const pOff = await find("panels");
        const offItem = (pOff?.fxItems || []).find((i) => i.name === "Lật ngang");
        record("P2 bật/tắt Lật ngang (badge giữ approx)",
          onItem?.on === true && onItem?.badge?.preview === "approx" &&
          offItem?.on === false && offItem?.badge?.preview === "approx" && (await alive()),
          `off->on badge=${onItem?.badge?.preview} on=${onItem?.on}; on->off on=${offItem?.on} badge=${offItem?.badge?.preview}; app sống=${await alive()}`);
      }

      // P3 — bật motion blur bằng click thật: 3 slider weights, 33% mỗi cái.
      const m0 = await find("motion");
      if (!m0) skip("P3 bật motion blur (3 slider weights)", "không tìm thấy MotionPanel sau khi chọn clip video");
      else if (m0.blurCheck?.checked) skip("P3 bật motion blur (3 slider weights)", "blur đã bật sẵn từ trước");
      else {
        await cdp.click(m0.blurCheck.pos.x, m0.blurCheck.pos.y);
        await sleep(600);
        const m1 = await find("motion");
        const pcts = (m1?.weightRanges || []).map((r) => r.pct);
        record("P3 bật motion blur (3 slider weights)",
          (m1?.weightRanges || []).length === 3 && pcts.every((p) => p !== null && p >= 30 && p <= 36) &&
          m1?.framesRange?.value === "3",
          `weightRanges=${(m1?.weightRanges || []).length} pcts=[${pcts.join(",")}] framesRange=${m1?.framesRange?.value}`);
      }

      // P4 — tăng weight frame 1 bằng phím thật: nhãn % tăng.
      const m1 = await find("motion");
      if (!m1 || (m1.weightRanges || []).length === 0) skip("P4 tăng weight frame 1 (phím thật)", "không có slider weights từ P3");
      else {
        const before = m1.weightRanges[0].pct;
        const focused = await find("focusWeightRange", 0);
        if (!focused) record("P4 tăng weight frame 1 (phím thật)", false, "không focus được slider weight frame 1");
        else {
          await cdp.key("ArrowRight", "ArrowRight");
          await sleep(600);
          const m2 = await find("motion");
          const after = m2?.weightRanges?.[0]?.pct ?? null;
          record("P4 tăng weight frame 1 (phím thật)",
            after !== null && before !== null && after > before,
            `weight frame 1: ${before}% -> ${after}% (kỳ vọng tăng; tổng chuẩn hoá về 1 nên các frame khác có thể giảm nhẹ)`);
        }
      }

      // P5 — bật nội suy (phím thật) rồi đổi miMode mci -> blend (phím thật).
      const m2 = await find("motion");
      if (!m2 || !m2.selects?.[0]) skip("P5 nội suy + miMode (phím thật)", "không có select nội suy trong MotionPanel");
      else {
        const focused = await find("focusMotionSelect", 0);
        if (!focused) record("P5 nội suy + miMode (phím thật)", false, "không focus được select nội suy");
        else {
          await cdp.key("ArrowDown", "ArrowDown");
          await sleep(600);
          const m3 = await find("motion");
          const interpOk = m3?.selects?.[0]?.value === "minterpolate";
          const miEnabled = m3?.selects?.[2] && m3.selects[2].disabled === false;
          let miOk = false, miDetail = "";
          if (miEnabled) {
            const f2 = await find("focusMotionSelect", 2);
            if (f2) {
              await cdp.key("ArrowDown", "ArrowDown");
              await sleep(600);
              const m4 = await find("motion");
              miOk = m4?.selects?.[2]?.value === "blend";
              miDetail = `miMode -> ${m4?.selects?.[2]?.value}`;
            } else miDetail = "không focus được select miMode";
          } else miDetail = `miMode vẫn disabled sau khi bật nội suy (disabled=${m3?.selects?.[2]?.disabled})`;
          record("P5 nội suy + miMode (phím thật)",
            interpOk && miEnabled && miOk && (await alive()),
            `interp -> ${m3?.selects?.[0]?.value}, miMode enabled=${miEnabled}, ${miDetail}, app sống=${await alive()}`);
        }
      }

      // P6 — bật chống rung (đang có nội suy, KHÔNG có speedKeyframes):
      // cảnh báo stabilize của MotionPanel PHẢI VẮNG (hồi quy bug đợt 9).
      const e0 = await find("enhance");
      if (!e0) skip("P6 chống rung + nội suy: cảnh báo stabilize vắng", "không tìm thấy EnhancePanel");
      else if (!e0.stabCheck) skip("P6 chống rung + nội suy: cảnh báo stabilize vắng", "không tìm thấy checkbox chống rung trong EnhancePanel");
      else {
        if (!e0.stabCheck.checked) {
          await cdp.click(e0.stabCheck.pos.x, e0.stabCheck.pos.y);
          await sleep(600);
        }
        const e1 = await find("enhance");
        const m5 = await find("motion");
        const motionWarn = (m5?.tips || []).some((t) => t.toLowerCase().includes("bật cả chống rung và speed curve"));
        const enhanceWarn = (e1?.tips || []).some((t) => t.toLowerCase().includes("không dùng chung"));
        record("P6 chống rung + nội suy: cảnh báo stabilize vắng",
          e1?.stabCheck?.checked === true && !motionWarn && !enhanceWarn && (await alive()),
          `stabilize=${e1?.stabCheck?.checked} motionWarnStabilize=${motionWarn} enhanceSpeedWarn=${enhanceWarn} app sống=${await alive()}`);
      }

      // P6b — nhánh dương KHÔNG click-test được (không UI nào tạo
      // speedKeyframes): ghi SKIP kèm lý do, không bịa click.
      skip("P6b chống rung + speedKeyframes: cảnh báo stabilize hiện",
        "không có UI nào trong app tạo được speedKeyframes (chỉ qua spec/API) nên không thể click tới trạng thái này; nhánh này chỉ có code MotionPanel (hasStabilize && hasSpeedRamp) + test logic, chưa có click-test");

      // P7 — ghost preview.
      const cv0 = await find("canvas");
      record("P7a canvas preview tồn tại, kích thước > 0",
        !!cv0 && cv0.w > 0 && cv0.h > 0 && cv0.css.w > 0 && cv0.css.h > 0,
        cv0 ? `canvas ${cv0.w}x${cv0.h} attr, ${cv0.css.w}x${cv0.css.h} css` : "không tìm thấy .preview-canvas");
      // Phát để draw loop cập nhật badge + snapshot ghost, rồi tạm dừng.
      await setPlaying(true);
      let badgeText = "";
      try {
        badgeText = await cdp.waitFor(async () => {
          const cv = await find("canvas");
          return cv?.badgeText?.includes("BLUR") ? cv.badgeText : null;
        }, "badge BLUR≈ trong khi phát", 30000);
      } catch { badgeText = (await find("canvas"))?.badgeText || ""; }
      await setPlaying(false);
      record("P7b badge BLUR≈ hiện khi blur bật (đang phát)",
        badgeText.includes("BLUR"),
        `badge='${badgeText}' (interp bật nên có thể kèm 'NỘI SUY')`);
      const meanDiff = (a, b) => (Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b)) / 3;
      await stopAndPlay(); // blur đang bật (từ P3, chưa tắt)
      const meanOn = await captureMedianAtWindow(2.5, 3.0);
      await setPlaying(false);
      if (!meanOn) skip("P7c probe pixel ghost (on-vs-off)", "không chụp được frame trong cửa sổ playhead 2.5–3.0s khi blur bật");
      else {
        // Tắt blur, chụp off lần 1 và lần 2 (baseline jitter).
        const mOff = await find("motion");
        if (mOff?.blurCheck?.checked) {
          await cdp.click(mOff.blurCheck.pos.x, mOff.blurCheck.pos.y);
          await sleep(600);
        }
        await stopAndPlay();
        const meanOff1 = await captureMedianAtWindow(2.5, 3.0);
        await setPlaying(false);
        const restarted = await stopAndPlay();
        const meanOff2 = restarted ? await captureMedianAtWindow(2.5, 3.0) : null;
        await setPlaying(false);
        if (!meanOff1 || !meanOff2) skip("P7c probe pixel ghost (on-vs-off)", "không chụp đủ 2 lần off để tính baseline jitter");
        else {
          const baseline = meanDiff(meanOff1, meanOff2);
          const testDiff = meanDiff(meanOn, meanOff1);
          const visible = testDiff > Math.max(3 * baseline, 3.0);
          record("P7c probe pixel ghost đổi theo blur on/off",
            visible,
            `meanOn=(${meanOn.r.toFixed(1)},${meanOn.g.toFixed(1)},${meanOn.b.toFixed(1)}) ` +
            `meanOff1=(${meanOff1.r.toFixed(1)},${meanOff1.g.toFixed(1)},${meanOff1.b.toFixed(1)}) ` +
            `baseline off-vs-off=${baseline.toFixed(2)} on-vs-off=${testDiff.toFixed(2)} ` +
            `(ngưỡng nhìn thấy: > max(3×baseline, 3.0))` +
            (visible ? "" : " — xem LIMITS: frame hiện tại đục phủ kín bóng ghost"));
        }
      }
      // P7d — đối chứng dương ở cửa sổ fade-out [3.7s, 3.95s) của clip 1
      // (transitionOut fade 0.6s: alpha 0.5 -> 0.08). Ở đó frame hiện tại
      // KHÔNG còn đục nên bóng ghost (nếu code vẽ thật) phải lộ qua lớp
      // mờ — phân biệt "ghost hỏng" với "ghost bị frame đục che" (P7c).
      // Blur hiện đang TẮT sau P7c nên bật lại trước.
      {
        const mOn = await find("motion");
        if (mOn?.blurCheck && !mOn.blurCheck.checked) {
          await cdp.click(mOn.blurCheck.pos.x, mOn.blurCheck.pos.y);
          await sleep(600);
        }
        await stopAndPlay();
        const fadeOn = await captureMedianAtWindow(3.6, 3.95);
        await setPlaying(false);
        if (!fadeOn) console.log("INFO P7d fade-out: không chụp được frame fade-out khi blur bật");
        else {
          const mOff2 = await find("motion");
          if (mOff2?.blurCheck?.checked) {
            await cdp.click(mOff2.blurCheck.pos.x, mOff2.blurCheck.pos.y);
            await sleep(600);
          }
          await stopAndPlay();
          const fadeOff1 = await captureMedianAtWindow(3.6, 3.95);
          await setPlaying(false);
          await stopAndPlay();
          const fadeOff2 = await captureMedianAtWindow(3.6, 3.95);
          await setPlaying(false);
          if (!fadeOff1 || !fadeOff2) console.log("INFO P7d fade-out: thiếu mẫu off nên không có baseline");
          else {
            const baseFade = meanDiff(fadeOff1, fadeOff2);
            const testFade = meanDiff(fadeOn, fadeOff1);
            console.log(`INFO P7d fade-out (không tính điểm): meanFadeOn=(${fadeOn.r.toFixed(1)},${fadeOn.g.toFixed(1)},${fadeOn.b.toFixed(1)}) ` +
              `meanFadeOff1=(${fadeOff1.r.toFixed(1)},${fadeOff1.g.toFixed(1)},${fadeOff1.b.toFixed(1)}) ` +
              `baseline=${baseFade.toFixed(2)} on-vs-off=${testFade.toFixed(2)} ` +
              `(cửa sổ fade nhạy với thời điểm chụp tuyệt đối nên số này chỉ tham khảo)`);
          }
        }
      }
    } finally {
      killChrome();
    }
  } finally {
    killVite();
    try { fs.closeSync(logFd); } catch {}
  }
  const failed = results.filter((r) => !r.ok);
  const skipped = results.filter((r) => r.skipped);
  console.log(`\n== TỔNG: ${results.length - failed.length}/${results.length} pass (${skipped.length} SKIP) ==`);
  if (failed.length) console.log(`CHƯA ĐẠT: ${failed.map((r) => r.name).join(", ")}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS LỖI:", e.message); process.exit(2); });
