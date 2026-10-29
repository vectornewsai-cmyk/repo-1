// u6-nested-clicktest.cjs — U6 Phase 9 round 7: click-test tương tác
// nested clip + adjustment layer trên Chromium headless qua CDP.
//
// Tái dùng mẫu harness của R6 (scripts/r6-clicktest.cjs): Node thuần,
// WebSocket có sẵn, không cần Playwright; cần vite dev đang chạy +
// U6_DEV_URL, mặc định http://localhost:5180/. Chrome headless từ
// ms-playwright cache, profile mới (/tmp/u6-cdprof) nên editor tải
// project mẫu (2 video track v1 + 1 text track t1).
//
// QUAN TRỌNG — UI đã đổi ở R7 (luồng U4, xem
// components/nested/R7_UI_LIMITS.md), harness này test theo UI HIỆN TẠI:
// - Layer mới ghi vào spec.adjustmentLayers (chuẩn project), KHÔNG còn
//   tạo bản ghi kind:"adjustment" trong track.clips. Vì vậy hàng FX của
//   Timeline (chỉ vẽ layer legacy) KHÔNG hiện layer mới — đây là thiết
//   kế đã ghi rõ ở R7 §3, không phải lỗi của thao tác thêm layer.
// - Kéo/trim/box-select trên hàng FX chỉ còn chạy được khi có layer
//   legacy; project mẫu không có layer legacy và panel mới không tạo
//   được layer legacy nữa, nên các case FX trong harness này được giữ
//   lại sau guard (chạy khi có layer legacy, SKIP có lý do khi không).
// - Transition/opacity trên nested clip KHÔNG đi qua Inspector (Inspector
//   không có nhánh kind=nested) mà qua nút "Transition & opacity" trong
//   NestedClipPanel (setNestedClipBoundary, chỉ fade, cần clip kề).
//
// Thứ tự test nối tiếp trên cùng 1 project (đúng như user làm thật):
//   U0 load sample -> U1 thêm layer chuẩn từ panel -> U2 guard FX legacy
//   -> U3 sửa layer chuẩn qua editor panel -> U4 split video đầu ->
//   U4b gộp 2 nửa thành nested (để nested có clip kề) -> U5 sửa clip
//   con qua InnerClipEditor -> U6 đặt opacity + transition ra (fade)
//   cho nested -> U6b từ chối transition vào (không có clip kề trái)
//   -> U7 đổi ngôn ngữ panel vi->en->vi.
// Mỗi test in PASS/FAIL/SKIP kèm số đo. Exit 0 khi tất cả pass, 1 khi
// có FAIL (SKIP cũng tính là chưa đạt để parent thấy phần chưa phủ),
// 2 khi harness lỗi (không tới được dev server / chrome).
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEBUG_PORT = Number(process.argv[2] || 9335);
const DEV_URL = process.env.U6_DEV_URL || "http://localhost:5180/";
const CHROME =
  process.env.U6_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/u6-cdprof";
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
  async drag(x0, y0, x1, y1, steps = 12) {
    await this.mouse("mousePressed", x0, y0, { button: "left", clickCount: 1 });
    for (let i = 1; i <= steps; i++) {
      await this.mouse("mouseMoved", x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, { button: "left" });
      await sleep(30);
    }
    await this.mouse("mouseReleased", x1, y1, { button: "left", clickCount: 1 });
    await sleep(300);
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
  // Gõ chuỗi vào input đang focus bằng key event từng ký tự; nếu giá trị
  // không đổi thì dùng Input.insertText và báo lại bằng giá trị trả về.
  async typeText(str) {
    for (const ch of str) {
      const code = ch === "." ? "Period" : ch === "-" ? "Minus" : `Digit${ch}`;
      await this.key(ch, code, 0, ch);
    }
  }
  async waitFor(fn, label, timeoutMs = 150000) {
    const t0 = Date.now();
    let last;
    while (Date.now() - t0 < timeoutMs) {
      try {
        last = await fn();
      } catch {
        // Trang đang chuyển document (body null thoáng qua) — polling
        // tiếp thay vì coi là lỗi harness (flake gặp ở lần chạy U6).
        last = null;
      }
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
  const fx = [...document.querySelectorAll('.tl-adj-clip')].map(el => {
    const handles = [...el.querySelectorAll('.fx-handle')].map(h => ({
      side: [...h.classList].find(c => c === 'left' || c === 'right'), ...rect(h) }));
    return { track: el.dataset.trackId, id: el.dataset.clipId,
      text: (el.innerText || '').trim(), ...rect(el),
      sel: el.classList.contains('selected'), handles };
  });
  const lanes = document.querySelector('.tl-lanes');
  const ruler = document.querySelector('.tl-ruler');
  return { clips, fx,
    lanes: lanes ? rect(lanes) : null,
    ruler: ruler ? rect(ruler) : null,
    adjLane: document.querySelector('.tl-adj-lane') ? true : false,
    innerW: window.innerWidth, innerH: window.innerHeight,
    bodyText: (document.body && document.body.innerText) || '' };
})()`;

// Một hàm tìm duy nhất, phân biệt các input trùng aria-label "Độ dài (s)"
// bằng container + nút của hàng đó (xem ghi chú đầu file).
const FIND_JS = `((kind, a, b) => {
  // Bài học debug U6: layout app cao theo viewport nên timeline/panel
  // thường nằm dưới fold (clip ở y=1468 với viewport 1200) — click CDP
  // ngoài viewport không có tác dụng gì. Vì vậy ctr() LUÔN cuộn element
  // vào giữa viewport trước khi đo tọa độ; snapshot (SNAP_JS) thì
  // không cuộn để khỏi xê dịch trạng thái khi chỉ cần đọc.
  const ctr = (el) => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const region = (aria) => document.querySelector('.nested-panel[aria-label="' + aria + '"]');
  const btnIn = (root, text) => {
    if (!root) return null;
    const el = [...root.querySelectorAll('button')].find(x => x.innerText.trim() === text);
    return el ? ctr(el) : null;
  };
  if (kind === 'title') {
    const el = [...document.querySelectorAll('button')].find(x => x.title === a);
    return el ? ctr(el) : null;
  }
  // Cuộn element theo selector vào giữa viewport, trả về rect sau cuộn
  // (dùng cho clip/ruler trong snapshot trước khi click/drag).
  if (kind === 'scrollSel') {
    const els = [...document.querySelectorAll(a)];
    const el = els[b];
    if (!el) return null;
    try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {}
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) };
  }
  if (kind === 'panelBtn') return btnIn(region(a), b);
  if (kind === 'panelMsg') {
    const r = region(a);
    return r ? (r.querySelector('.nested-panel-msg')?.innerText || '') : '';
  }
  if (kind === 'panelStrong') {
    const r = region(a);
    return r ? [...r.querySelectorAll('strong')].map(s => s.innerText) : [];
  }
  if (kind === 'panelItems') {
    const r = region(a);
    return r ? [...r.querySelectorAll('.nested-item')].map(i => i.innerText.split(String.fromCharCode(10)).join(' | ').slice(0, 140)) : [];
  }
  if (kind === 'langBtn') {
    const el = [...document.querySelectorAll('button.tbtn')]
      .find(x => x.getAttribute('aria-label') === a || x.title === a);
    return el ? ctr(el) : null;
  }
  // Input độ dài của clip con thứ a, kèm nút Lưu của đúng hàng đó.
  if (kind === 'innerDuration') {
    const rows = [...document.querySelectorAll('.nested-panel[aria-label="Nested clip"] .nested-inner .nested-panel-row')];
    const cands = rows.filter(row => {
      const inp = row.querySelector('input[aria-label="Độ dài (s)"]');
      const save = [...row.querySelectorAll('button')].find(x => x.innerText.trim() === 'Lưu clip con');
      return inp && save;
    }).map(row => ({ input: ctr(row.querySelector('input[aria-label="Độ dài (s)"]')),
      value: row.querySelector('input[aria-label="Độ dài (s)"]').value,
      save: ctr([...row.querySelectorAll('button')].find(x => x.innerText.trim() === 'Lưu clip con')) }));
    return cands[a] || null;
  }
  // Input độ dài của layer chuẩn trong Adjustment panel, kèm nút Lưu layer.
  if (kind === 'specLayerDuration') {
    const rows = [...document.querySelectorAll('.nested-panel[aria-label="Adjustment layer"] .nested-item .nested-panel-row')];
    const cands = rows.filter(row => {
      const inp = row.querySelector('input[aria-label="Độ dài (s)"]');
      const save = [...row.querySelectorAll('button')].find(x => x.innerText.trim() === 'Lưu layer');
      return inp && save;
    }).map(row => ({ input: ctr(row.querySelector('input[aria-label="Độ dài (s)"]')),
      value: row.querySelector('input[aria-label="Độ dài (s)"]').value,
      save: ctr([...row.querySelectorAll('button')].find(x => x.innerText.trim() === 'Lưu layer')) }));
    return cands[a] || null;
  }
  // Toàn bộ field của boundary editor (container = .nested-inner chứa
  // select "Transition ra"), kèm nút Lưu và dòng giá trị hiện tại.
  if (kind === 'boundary') {
    const selOut = document.querySelector('.nested-panel[aria-label="Nested clip"] select[aria-label="Transition ra"]');
    if (!selOut) return null;
    const root = selOut.closest('.nested-inner');
    const cur = root.querySelector('.nested-item-time')?.innerText || '';
    const pick = (sel) => { const el = root.querySelector(sel); return el ? ctr(el) : null; };
    const val = (sel) => { const el = root.querySelector(sel); return el ? el.value : null; };
    return { cur,
      opacity: pick('input[aria-label="Opacity của nested clip (để trống = xoá)"]'),
      opacityVal: val('input[aria-label="Opacity của nested clip (để trống = xoá)"]'),
      inSel: pick('select[aria-label="Transition vào"]'), inVal: val('select[aria-label="Transition vào"]'),
      outSel: pick('select[aria-label="Transition ra"]'), outVal: val('select[aria-label="Transition ra"]'),
      inDur: pick('.nested-panel-row:nth-of-type(3) input[aria-label="Độ dài (s)"]'),
      outDur: pick('.nested-panel-row:nth-of-type(4) input[aria-label="Độ dài (s)"]'),
      save: btnIn(root, 'Lưu transition & opacity') };
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
    // Viewport cao 1200 để panel dài (tới ~y=930) nằm trong viewport:
    // --window-size=1440,900 trước đây chỉ cho innerH=700 nên nút ở
    // y=768 nằm ngoài viewport và click CDP không tới được (bài học
    // debug U6: elementFromPoint trả null ở y>700).
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send("Page.navigate", { url: DEV_URL });
    const find = (kind, a, b) =>
      cdp.evalJs(`(${FIND_JS})(${JSON.stringify(kind)}, ${JSON.stringify(a ?? null)}, ${JSON.stringify(b ?? null)})`);
    // Gõ thay thế toàn bộ giá trị input. Number input KHÔNG hỗ trợ
    // selection API (selectionStart luôn null) và không nhận Ctrl+A hay
    // End+Shift+Home qua CDP (bằng chứng U3: gõ "2" nối thành "322").
    // Cách duy nhất đo được là triple-click (clickCount 3) rồi gõ phím
    // thật — debug U6 chứng minh triple-click xong gõ "5" thay toàn bộ
    // "32" thành "5". Caller vẫn phải kiểm tra lại giá trị trước khi
    // bấm Lưu — không bao giờ lưu với giá trị chưa xác minh.
    const setInput = async (ctrPos, text) => {
      await cdp.mouse("mousePressed", ctrPos.x, ctrPos.y, { button: "left", clickCount: 3 });
      await cdp.mouse("mouseReleased", ctrPos.x, ctrPos.y, { button: "left", clickCount: 3 });
      await sleep(300);
      await cdp.typeText(text);
      await sleep(300);
      return "keys";
    };
    const setInputInsert = async (ctrPos, text) => {
      await cdp.mouse("mousePressed", ctrPos.x, ctrPos.y, { button: "left", clickCount: 3 });
      await cdp.mouse("mouseReleased", ctrPos.x, ctrPos.y, { button: "left", clickCount: 3 });
      await sleep(300);
      await cdp.send("Input.insertText", { text });
      await sleep(300);
      return "insertText";
    };
    const panelTexts = async () => cdp.evalJs(`(() => {
      const grab = (aria, txt) => { const r = document.querySelector('.nested-panel[aria-label="' + aria + '"]');
        if (!r) return false;
        return [...r.querySelectorAll('button')].some(b => b.innerText.trim() === txt); };
      return { nestEn: grab('Nested clip', 'Nest into compound clip'),
        nestVi: grab('Nested clip', 'Gộp thành compound clip'),
        adjEn: grab('Adjustment layer', 'Add layer'),
        adjVi: grab('Adjustment layer', 'Thêm layer') };
    })()`);

    // U0 — load project mẫu.
    const snap0 = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(SNAP_JS);
      return s.clips.length >= 3 ? s : null;
    }, "project mẫu >= 3 clip", 150000);
    record("U0 load sample", true,
      `${snap0.clips.length} clip: ${snap0.clips.map((c) => `${c.kind}@${c.track}:${Math.round(c.w)}px`).join(", ")} (viewport ${snap0.innerW}x${snap0.innerH})`);
    const modalSel = `.modal-backdrop, .tour-card, .welcome-modal`;
    const modalOpen = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
    if (modalOpen) { await cdp.click(20, 20); await sleep(500); }
    const modalGone = !(await cdp.evalJs(`!!document.querySelector('${modalSel}')`));
    record("U0b welcome modal", modalGone, modalOpen ? "modal tự mở — đã đóng bằng click backdrop" : "không có modal tự mở");
    if (!modalGone) return;
    const vp = await cdp.evalJs(`({ w: window.innerWidth, h: window.innerHeight })`);
    record("U0c viewport đủ cao cho panel", vp.h >= 1000,
      `viewport ${vp.w}x${vp.h} (cần >=1000 cao để nút panel ở y~930 bấm được)`);

    // U1 — mở panel Adjustment, bấm "Thêm layer" (mặc định: filter đầu
    // tiên blur, 50%, start = playhead 0, duration 3s, scope tất cả).
    // Kỳ vọng R7: panel hiện "Layer chuẩn spec (1)"; hàng FX KHÔNG hiện
    // layer chuẩn (thiết kế R7 §3) — ghi rõ trong detail, không tính
    // là fail của thao tác thêm.
    const adjBtn = await find("title", "Tạo và quản lý adjustment layer");
    if (!adjBtn) record("U1 thêm layer chuẩn từ panel", false, "không tìm thấy nút toolbar adjustment (title)");
    else {
      await cdp.click(adjBtn.x, adjBtn.y);
      await sleep(600);
      const addBtn = await find("panelBtn", "Adjustment layer", "Thêm layer");
      if (!addBtn) record("U1 thêm layer chuẩn từ panel", false, "panel Adjustment không mở hoặc không có nút 'Thêm layer'");
      else {
        await cdp.click(addBtn.x, addBtn.y);
        await sleep(600);
        const strong = await find("panelStrong", "Adjustment layer");
        const items = await find("panelItems", "Adjustment layer");
        const s1 = await cdp.evalJs(SNAP_JS);
        const specOk = strong.some((t) => t.includes("Layer chuẩn spec (1)"));
        record("U1 thêm layer chuẩn từ panel", specOk,
          specOk
            ? `panel hiện '${strong.find((t) => t.includes("Layer chuẩn"))}', item: '${items[0] || ""}'; hàng FX vắng (fx=${s1.fx.length}) là ĐÚNG thiết kế R7 §3 (layer chuẩn chưa vẽ lên FX), không phải lỗi thêm layer`
            : `panel strong=${JSON.stringify(strong)}, items=${JSON.stringify(items)}, fx=${s1.fx.length}`);
      }
    }

    // U2 — kéo/trim/box-select layer trên hàng FX: chỉ chạy khi có layer
    // legacy. Project mẫu không có layer legacy và panel R7 không tạo
    // được layer legacy nữa nên guard này SKIP có lý do; code test FX
    // giữ nguyên để chạy lại khi có project chứa layer legacy.
    const s2a = await cdp.evalJs(SNAP_JS);
    const fx2 = s2a.fx[0];
    if (!fx2) {
      skip("U2a kéo body layer FX (legacy)", "không có layer legacy trên hàng FX (panel R7 chỉ tạo layer chuẩn spec, hàng FX chỉ vẽ legacy) — code test giữ lại trong harness, chạy khi có project chứa layer legacy");
      skip("U2b trim mép phải layer FX (legacy)", "như U2a: không có layer legacy để trim");
      skip("U2c box-select qua hàng FX (legacy)", "như U2a: không có layer legacy để box-select cùng clip thường");
    } else {
      await cdp.drag(fx2.x + fx2.w / 2, fx2.y + fx2.h / 2, fx2.x + fx2.w / 2 + 120, fx2.y + fx2.h / 2);
      const s2b = await cdp.evalJs(SNAP_JS);
      const fx2b = s2b.fx[0];
      record("U2a kéo body layer FX (legacy)", !!fx2b && Math.abs(fx2b.x - (fx2.x + 120)) <= 15,
        fx2b ? `x ${fx2.x} -> ${fx2b.x} (kỳ vọng ~${fx2.x + 120})` : "layer biến mất sau kéo");
      const fx2c = (await cdp.evalJs(SNAP_JS)).fx[0];
      const rh = fx2c?.handles.find((h) => h.side === "right");
      if (!fx2c || !rh) skip("U2b trim mép phải layer FX (legacy)", "không tìm thấy handle phải của layer");
      else {
        await cdp.drag(rh.x + rh.w / 2, rh.y + rh.h / 2, rh.x + rh.w / 2 - 60, rh.y + rh.h / 2);
        const s2d = await cdp.evalJs(SNAP_JS);
        const fx2d = s2d.fx[0];
        record("U2b trim mép phải layer FX (legacy)", !!fx2d && Math.abs(fx2d.w - (fx2c.w - 60)) <= 15,
          fx2d ? `rộng ${fx2c.w}px -> ${fx2d.w}px (kỳ vọng ~${fx2c.w - 60}px)` : "layer biến mất sau trim");
      }
      const s2e = await cdp.evalJs(SNAP_JS);
      const fxE = s2e.fx[0];
      const vidE = s2e.clips.find((c) => c.kind === "clip-video");
      if (!fxE || !vidE) skip("U2c box-select qua hàng FX (legacy)", "thiếu layer FX hoặc clip video lúc chạy");
      else {
        await cdp.drag(Math.min(fxE.x + fxE.w + 40, s2e.lanes.x + s2e.lanes.w - 20), fxE.y + fxE.h / 2, s2e.lanes.x + 10, vidE.y + vidE.h / 2, 16);
        const s2f = await cdp.evalJs(SNAP_JS);
        const selFx = s2f.fx.filter((f) => f.sel).length;
        const selVid = s2f.clips.filter((c) => c.sel && c.kind === "clip-video").length;
        record("U2c box-select qua hàng FX (legacy)", selFx >= 1 && selVid >= 1,
          `chọn ${selFx} layer FX + ${selVid} clip video`);
      }
    }

    // U3 — sửa layer chuẩn qua editor trong panel: độ dài 3 -> 2s,
    // bấm "Lưu layer". Kỳ vọng: msg "Đã lưu layer chuẩn" + item đổi
    // thời gian thành 00:00 -> 00:02.
    const specEdit0 = await find("specLayerDuration", 0);
    if (!specEdit0 || !specEdit0.save) skip("U3 sửa layer chuẩn qua panel", `không tìm thấy editor layer chuẩn (edit=${JSON.stringify(specEdit0)}) — U1 có thể fail`);
    else {
      await setInput(specEdit0.input, "2");
      let cur = await find("specLayerDuration", 0);
      let typedHow = "key-event";
      if (!cur || cur.value !== "2") {
        await setInputInsert((cur || specEdit0).input, "2");
        cur = await find("specLayerDuration", 0);
        typedHow = "insertText-fallback";
      }
      if (!cur || !cur.save) record("U3 sửa layer chuẩn qua panel", false, "editor layer chuẩn biến mất sau khi gõ");
      else if (cur.value !== "2") record("U3 sửa layer chuẩn qua panel", false, `không gõ được giá trị 2 vào input (đang là '${cur.value}') — KHÔNG bấm Lưu để khỏi ghi sai`);
      else {
        await cdp.click(cur.save.x, cur.save.y);
        await sleep(600);
        const msg = await find("panelMsg", "Adjustment layer");
        const items3 = await find("panelItems", "Adjustment layer");
        record("U3 sửa layer chuẩn qua panel", msg.includes("Đã lưu layer chuẩn") && (items3[0] || "").includes("00:02"),
          `sau lưu: msg='${msg}', item='${items3[0] || ""}' (gõ ${typedHow})`);
      }
    }

    // U7 — đổi ngôn ngữ panel: mở cả 2 panel, toggle vi->en rồi en->vi
    // CHẠY TRƯỚC U4 (không phải sau U6): U4b gộp nested làm crash toàn
    // app (Inspector, xem U4b) nên mọi test sau U4b đều không chạy được
    // trong cùng phiên; test ngôn ngữ không phụ thuộc trạng thái gộp
    // nên dời lên đây để vẫn có phủ sóng khi crash xảy ra.
    // bằng nút ngôn ngữ thật trên topbar (phải cuộn topbar như R6).
    // Nút toolbar là toggle: chỉ bấm khi panel chưa mở, nếu không sẽ
    // đóng panel đang mở (lỗi U7 ở lần chạy trước: adjEn=false vì panel
    // Adjustment đã mở sẵn từ U1 mà openBothPanels bấm toggle đóng nó).
    const openBothPanels = async () => {
      const nestedOpen = (await find("panelStrong", "Nested clip")).length > 0;
      if (!nestedOpen) {
        const nb = await find("title", "Tạo và quản lý nested clip (compound clip)");
        if (nb) { await cdp.click(nb.x, nb.y); await sleep(300); }
      }
      const adjOpen = (await find("panelStrong", "Adjustment layer")).length > 0;
      if (!adjOpen) {
        const ab = await find("title", "Tạo và quản lý adjustment layer");
        if (ab) { await cdp.click(ab.x, ab.y); await sleep(300); }
      }
    };
    await openBothPanels();
    // Về đầu trang để topbar nằm trong viewport trước khi bấm nút ngôn ngữ.
    await cdp.evalJs(`window.scrollTo(0, 0)`);
    await sleep(300);
    const scrollTopbar = async () => cdp.evalJs(`(() => {
      const b = document.querySelector('.topbar'); if (!b) return -1;
      b.scrollLeft = b.scrollWidth; return b.scrollLeft; })()`);
    await scrollTopbar();
    const langBtn = await find("langBtn", "Ngôn ngữ");
    if (!langBtn) record("U7 đổi ngôn ngữ panel", false, "không tìm thấy nút ngôn ngữ trên topbar");
    else {
      await cdp.click(langBtn.x, langBtn.y);
      await sleep(800);
      const en = await panelTexts();
      record("U7a ngôn ngữ panel vi->en", en.nestEn && en.adjEn,
        `sau toggle en: nestEn=${en.nestEn} adjEn=${en.adjEn} (nestVi=${en.nestVi} adjVi=${en.adjVi})`);
      await scrollTopbar();
      const langBtn2 = await find("langBtn", "Language");
      if (langBtn2) await cdp.click(langBtn2.x, langBtn2.y);
      await sleep(800);
      const vi = await panelTexts();
      record("U7b ngôn ngữ panel en->vi", vi.nestVi && vi.adjVi,
        `sau toggle về vi: nestVi=${vi.nestVi} adjVi=${vi.adjVi} (nestEn=${vi.nestEn} adjEn=${vi.adjEn})`);
    }
    // U4 — split clip video đầu (0-4s) tại giữa bằng phím S (mẫu R6 T2):
    // chọn clip, scrub playhead vào giữa qua click ruler, bấm S.
    // Đóng hết panel trước: panel mở đẩy lanes xuống sát đáy document,
    // nơi cửa sổ không cuộn tới được nên click clip/ruler rơi ra ngoài
    // viewport (bài học debug U6: clip y=1468, ruler y=1436 với viewport
    // 1200; scrollIntoView cũng không đưa được element đáy lên giữa).
    for (const [aria, title] of [["Adjustment layer", "Tạo và quản lý adjustment layer"], ["Nested clip", "Tạo và quản lý nested clip (compound clip)"]]) {
      const isOpen = (await find("panelStrong", aria)).length > 0;
      if (isOpen) {
        const tb = await find("title", title);
        if (tb) { await cdp.click(tb.x, tb.y); await sleep(300); }
      }
    }
    const s4a = await cdp.evalJs(SNAP_JS);
    const v4 = s4a.clips.filter((c) => c.kind === "clip-video").sort((a, b) => a.x - b.x)[0];
    let splitOk = false;
    if (!v4 || !s4a.ruler) skip("U4 split video đầu (S)", "thiếu clip video hoặc ruler");
    else {
      // Cuộn clip + ruler vào viewport trước khi bấm (xem ghi chú ctr):
      // clip ở dưới fold thì click CDP không chọn được gì.
      const v4idx = s4a.clips.findIndex((c) => c.id === v4.id);
      await find("scrollSel", ".tl-clip", v4idx);
      await sleep(300);
      const s4a2 = await cdp.evalJs(SNAP_JS);
      const v4b = s4a2.clips.find((c) => c.id === v4.id) || v4;
      await cdp.click(v4b.x + v4b.w / 2, v4b.y + v4b.h / 2);
      await sleep(300);
      await find("scrollSel", ".tl-ruler", 0);
      await sleep(300);
      const s4r = await cdp.evalJs(SNAP_JS);
      await cdp.click(v4b.x + v4b.w / 2, s4r.ruler.y + 8);
      await sleep(300);
      const beforeSplit = (await cdp.evalJs(SNAP_JS)).clips.length;
      await cdp.key("s", "KeyS", 0, "s");
      await sleep(600);
      const afterSplit = await cdp.evalJs(SNAP_JS);
      splitOk = afterSplit.clips.length === beforeSplit + 1;
      record("U4 split video đầu (S)", splitOk,
        `clip ${beforeSplit} -> ${afterSplit.clips.length}; các đoạn video trên v1: ${afterSplit.clips.filter((c) => c.kind === "clip-video").map((c) => `${c.x}-${c.x + c.w}px`).join(", ")}`);
    }

    // U4b — gộp 2 nửa vừa tách thành nested clip: click nửa đầu, rồi
    // Shift+click nửa sau (beginBodyDrag: Shift thêm vào vùng chọn),
    // mở panel Nested, bấm "Gộp thành compound clip". Kỳ vọng: 1
    // .clip-nested, tổng clip giảm 1, và nested có clip kề v2 ở 4s
    // (để U6 đặt được transition ra).
    if (!splitOk) skip("U4b gộp nested clip", "U4 split fail nên không có 2 nửa để gộp");
    else {
      const s4b = await cdp.evalJs(SNAP_JS);
      const halves = s4b.clips.filter((c) => c.kind === "clip-video").sort((a, b) => a.x - b.x);
      if (halves.length < 2) skip("U4b gộp nested clip", `chỉ có ${halves.length} đoạn video sau split`);
      else {
        await find("scrollSel", ".tl-clip", s4b.clips.findIndex((c) => c.id === halves[0].id));
        await sleep(300);
        const s4b2 = await cdp.evalJs(SNAP_JS);
        const h0 = s4b2.clips.find((c) => c.id === halves[0].id) || halves[0];
        const h1 = s4b2.clips.find((c) => c.id === halves[1].id) || halves[1];
        await cdp.click(h0.x + h0.w / 2, h0.y + h0.h / 2);
        await sleep(300);
        await cdp.click(h1.x + h1.w / 2, h1.y + h1.h / 2, { modifiers: 8 }); // Shift+click
        await sleep(300);
        const selB = (await cdp.evalJs(SNAP_JS)).clips.filter((c) => c.sel);
        const nBtn = await find("title", "Tạo và quản lý nested clip (compound clip)");
        if (!nBtn) record("U4b gộp nested clip", false, `đã chọn ${selB.length} clip nhưng không tìm thấy nút toolbar nested`);
        else {
          await cdp.click(nBtn.x, nBtn.y);
          await sleep(600);
          const nestBtn = await find("panelBtn", "Nested clip", "Gộp thành compound clip");
          if (!nestBtn) record("U4b gộp nested clip", false, `đã chọn ${selB.length} clip nhưng panel Nested không có nút gộp (có thể nút bị disable)`);
          else {
            const before = (await cdp.evalJs(SNAP_JS)).clips.length;
            await cdp.click(nestBtn.x, nestBtn.y);
            await sleep(800);
            const s4c = await cdp.evalJs(SNAP_JS);
            const nested = s4c.clips.filter((c) => c.kind === "clip-nested");
            const blankPage = s4c.clips.length === 0 && (await cdp.evalJs(`(document.getElementById('root')?.innerHTML || '').length`)) === 0;
            record("U4b gộp nested clip", nested.length === 1 && s4c.clips.length === before - 1,
              blankPage
                ? `CRASH: chọn ${selB.length} clip, bấm Gộp -> trang trắng hoàn toàn (0 clip, #root rỗng). Stack bắt được qua CDP: Inspector.tsx NumField value.toFixed trên undefined — mục thời gian của Inspector render in/out cho clip kind=nested dù NestedClip không có in/out (điều kiện loại trừ chỉ có text/sticker/image). Không có error boundary nên React unmount toàn app. U5/U6/U6b sau đây không chạy được trong phiên này vì app đã trắng.`
                : `chọn ${selB.length} clip -> clip ${before} -> ${s4c.clips.length}, nested: ${nested.length} (${nested.length ? `x=${nested[0].x} w=${nested[0].w}px` : "không có"})`);
          }
        }
      }
    }

    // U5 — trong panel Nested, bấm "Xem bên trong", sửa độ dài clip con
    // đầu tiên 2 -> 1.5s bằng phím thật, bấm "Lưu clip con".
    const viewBtn = await find("panelBtn", "Nested clip", "Xem bên trong");
    if (!viewBtn) skip("U5 sửa clip con (InnerClipEditor)", "CHẶN BỞI CRASH U4b: app trắng sau khi gộp nên panel Nested không mở được; cần sửa crash Inspector (in/out của nested) trước rồi chạy lại");
    else {
      await cdp.click(viewBtn.x, viewBtn.y);
      await sleep(600);
      const inner0 = await find("innerDuration", 0);
      if (!inner0 || !inner0.save) skip("U5 sửa clip con (InnerClipEditor)", `không tìm thấy input độ dài clip con (inner=${JSON.stringify(inner0)})`);
      else {
        const oldVal = inner0.value;
        await setInput(inner0.input, "1.5");
        let cur = await find("innerDuration", 0);
        let typedHow = "key-event";
        if (!cur || cur.value !== "1.5") {
          await setInputInsert((cur || inner0).input, "1.5");
          cur = await find("innerDuration", 0);
          typedHow = "insertText-fallback";
        }
        if (!cur || !cur.save) record("U5 sửa clip con (InnerClipEditor)", false, "input clip con biến mất sau khi gõ");
        else if (cur.value !== "1.5") record("U5 sửa clip con (InnerClipEditor)", false, `không gõ được giá trị 1.5 vào input (đang là '${cur.value}') — KHÔNG bấm Lưu để khỏi ghi sai`);
        else {
          await cdp.click(cur.save.x, cur.save.y);
          await sleep(600);
          const after = await find("innerDuration", 0);
          const msg = await find("panelMsg", "Nested clip");
          record("U5 sửa clip con (InnerClipEditor)", !!after && after.value === "1.5" && msg.includes("Đã lưu clip con"),
            `độ dài clip con ${oldVal} -> ${after ? after.value : "?"} (gõ bằng ${typedHow}), msg panel: '${msg}'`);
        }
      }
    }

    // U6 — đặt opacity + transition ra cho nested clip qua nút
    // "Transition & opacity" trong panel Nested (KHÔNG qua Inspector —
    // Inspector không có nhánh kind=nested). Đặt opacity 0.5, transOut
    // fade 0.5s (transIn để trống vì nested bắt đầu ở 0s, không có clip
    // kề trái). Select được đổi bằng phím thật sau khi focus qua JS
    // (click mở popup native không điều khiển được bằng CDP — xem LIMITS).
    const bBtn = await find("panelBtn", "Nested clip", "Transition & opacity");
    if (!bBtn) skip("U6 transition/opacity trên nested clip", "CHẶN BỞI CRASH U4b: app trắng sau khi gộp nên không chọn được nested clip; cần sửa crash Inspector trước rồi chạy lại");
    else {
      await cdp.click(bBtn.x, bBtn.y);
      await sleep(600);
      let b = await find("boundary", null);
      if (!b || !b.opacity || !b.outSel || !b.save) skip("U6 transition/opacity trên nested clip", `boundary editor không mở đủ field (b=${JSON.stringify(b)})`);
      else {
        await setInput(b.opacity, "0.5");
        // Chọn fade cho transition ra: focus select rồi ArrowDown
        // (option đầu là "— không đặt —", ArrowDown 1 lần -> fade).
        await cdp.evalJs(`(() => { const s = document.querySelector('.nested-panel[aria-label="Nested clip"] select[aria-label="Transition ra"]'); if (s) s.focus(); return !!s; })()`);
        await sleep(200);
        await cdp.key("ArrowDown", "ArrowDown");
        await sleep(300);
        b = await find("boundary", null);
        const outDurPos = b?.outDur;
        if (outDurPos) await setInput(outDurPos, "0.5");
        b = await find("boundary", null);
        if (!b || !b.save) record("U6 transition/opacity trên nested clip", false, "boundary editor biến mất sau khi nhập");
        else {
          await cdp.click(b.save.x, b.save.y);
          await sleep(600);
          const bAfter = await find("boundary", null);
          const msg = await find("panelMsg", "Nested clip");
          const okVals = bAfter && bAfter.opacityVal === "0.5" && bAfter.outVal === "fade";
          record("U6 transition/opacity trên nested clip", !!okVals && msg.includes("Đã lưu transition/opacity"),
            `sau lưu: opacity=${bAfter ? bAfter.opacityVal : "?"} transOut=${bAfter ? bAfter.outVal : "?"} (dòng hiện tại: '${bAfter ? bAfter.cur : ""}'), msg='${msg}'`);
        }
      }
    }

    // U6b — từ chối transition vào khi không có clip kề trái: đặt
    // transIn=fade 0.5s (giữ nguyên opacity + transOut đã lưu), lưu ->
    // kỳ vọng saveFail và giá trị đã lưu không đổi.
    let b6 = await find("boundary", null);
    if (!b6 || !b6.inSel || !b6.save) skip("U6b từ chối transition vào (không clip kề)", "CHẶN BỞI CRASH U4b: boundary editor không mở được khi app đã trắng");
    else {
      await cdp.evalJs(`(() => { const s = document.querySelector('.nested-panel[aria-label="Nested clip"] select[aria-label="Transition vào"]'); if (s) s.focus(); return !!s; })()`);
      await sleep(200);
      await cdp.key("ArrowDown", "ArrowDown"); // "" -> fade
      await sleep(300);
      b6 = await find("boundary", null);
      if (b6?.inDur) await setInput(b6.inDur, "0.5");
      b6 = await find("boundary", null);
      if (!b6 || !b6.save) record("U6b từ chối transition vào (không clip kề)", false, "boundary editor biến mất sau khi nhập transIn");
      else {
        await cdp.click(b6.save.x, b6.save.y);
        await sleep(600);
        const bAfter = await find("boundary", null);
        const msg = await find("panelMsg", "Nested clip");
        const unchanged = bAfter && bAfter.opacityVal === "0.5" && bAfter.outVal === "fade" && (bAfter.inVal === "" || bAfter.inVal === null);
        record("U6b từ chối transition vào (không clip kề)", !!unchanged && msg.includes("Không lưu được"),
          `sau lưu transIn=fade: opacity=${bAfter ? bAfter.opacityVal : "?"} transIn=${bAfter ? bAfter.inVal : "?"} transOut=${bAfter ? bAfter.outVal : "?"} (kỳ vọng giữ 0.5/—/fade), msg='${msg}'`);
      }
    }

  } finally {
    kill();
  }
  const failed = results.filter((r) => !r.ok);
  const skipped = results.filter((r) => r.skipped);
  console.log(`\n== TỔNG: ${results.length - failed.length}/${results.length} pass (${skipped.length} SKIP tính là chưa đạt) ==`);
  if (failed.length) console.log(`CHƯA ĐẠT: ${failed.map((r) => r.name).join(", ")}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS LỖI:", e.message); process.exit(2); });
