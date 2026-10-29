// v10-parity-clicktest.cjs — V6 (Phase 9 đợt 10): click-test panel
// Transition/Effect trên Chromium headless qua CDP, tái dùng mẫu M6
// (Node thuần + WebSocket có sẵn, không cần Playwright).
//
// Khác M6: dùng vite dev riêng cổng 5190 (tránh đụng cổng 5173 nếu luồng
// khác đang chạy dev), debug port 9337, profile /tmp/v10-cdprof.
// Cần: vite dev + Chromium từ ms-playwright cache.
// Exit: 0 khi tất cả pass, 1 khi có FAIL, 2 khi harness lỗi
// (không tới được dev server / chrome) — KHÔNG bao giờ báo pass giả.
//
// Thứ tự test (đúng như user làm thật):
//   V0 load sample -> V0b đóng welcome modal nếu có -> V1 chọn clip video,
//   kiểm tra TransitionPanel (.tr-panel) + EffectPanel (.effects-panel)
//   cùng hiện -> V2 click card transition "fade", kiểm tra card được chọn
//   + badge preview hiển thị (data-preview + nhãn) -> V3 click toggle
//   effect "Lật ngang" (mirror), kiểm tra item bật (.on), app không crash
//   -> V4 click lại để tắt, kiểm tra item tắt, app vẫn sống.
// LƯU Ý TRUNG THỰC: EffectPanel hiện KHÔNG có badge preview nào trong
// code (badge chỉ có ở TransitionPanel qua previewStatus.ts) nên
// click-test này KHÔNG kiểm tra badge effect — ghi rõ ở LIMITS, không
// bịa badge effect.
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEBUG_PORT = Number(process.argv[2] || 9337);
const DEV_PORT = 5190;
const DEV_URL = process.env.V10_DEV_URL || `http://localhost:${DEV_PORT}/`;
const WEB_DIR = path.join(__dirname, "..");
const CHROME =
  process.env.V10_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/v10-cdprof";
const VITE_LOG = "/tmp/v10-vite.log";
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

// Định vị panel Transition/Effect trong Inspector (bài học M6: cuộn HẾT
// element trước rồi mới đo tọa độ, vì cuộn element sau xê dịch element
// trước trong container .inspector).
const FIND_JS = `((kind, a) => {
  const ctr = (el) => { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch {} const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  const ctrNoScroll = (el) => { const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2,
      w: Math.round(r.width), h: Math.round(r.height) }; };
  if (kind === 'panels') {
    const tr = document.querySelector('.tr-panel');
    const fx = document.querySelector('.effects-panel');
    const heads = [...document.querySelectorAll('.ins-section > button')]
      .map(b => (b.innerText || '').trim());
    const fadeCard = tr ? tr.querySelector('.tr-card[data-type="fade"]') : null;
    const fxItems = fx ? [...fx.querySelectorAll('.fx-item')].map(it => ({
      name: (it.querySelector('.fx-name')?.innerText || '').trim(),
      on: it.classList.contains('on'),
    })) : [];
    return {
      trPanel: !!tr, fxPanel: !!fx,
      sectionHeads: heads,
      fadeCard: fadeCard ? {
        selected: fadeCard.getAttribute('aria-selected') === 'true',
        badge: fadeCard.querySelector('.tr-badge') ? {
          preview: fadeCard.querySelector('.tr-badge').dataset.preview || '',
          label: (fadeCard.querySelector('.tr-badge').innerText || '').trim(),
        } : null,
      } : null,
      fxItems,
    };
  }
  if (kind === 'pos') {
    // a: 'fadeCard' | 'fxToggle:<tên>' — cuộn rồi đo, không đo xen kẽ.
    let el = null;
    if (a === 'fadeCard') el = document.querySelector('.tr-card[data-type="fade"]');
    else if (typeof a === 'string' && a.startsWith('fxToggle:')) {
      const name = a.slice('fxToggle:'.length);
      const it = [...document.querySelectorAll('.fx-item')]
        .find(i => (i.querySelector('.fx-name')?.innerText || '').trim() === name);
      el = it ? it.querySelector('.fx-toggle') : null;
    }
    return el ? ctr(el) : null;
  }
  if (kind === 'scrollClip') {
    const els = [...document.querySelectorAll('.tl-clip')];
    const el = els[a];
    if (!el) return null;
    return ctr(el);
  }
  return null;
})`;

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  // npm workspaces hoist binary lên root node_modules — thử root trước.
  const viteCandidates = [
    path.join(WEB_DIR, "..", "..", "node_modules", ".bin", "vite"),
    path.join(WEB_DIR, "node_modules", ".bin", "vite"),
  ];
  const viteBin = viteCandidates.find((c) => fs.existsSync(c));
  if (!viteBin) throw new Error(`không thấy vite tại ${viteCandidates.join(" hoặc ")}`);
  fs.rmSync(PROFILE, { recursive: true, force: true });

  // Vite dev riêng (cổng 5190, strict) — log ra file để chẩn đoán.
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

      // V0 — load project mẫu.
      const snap0 = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(SNAP_JS);
        return s.clips.length >= 3 ? s : null;
      }, "project mẫu >= 3 clip", 180000);
      record("V0 load sample", true,
        `${snap0.clips.length} clip: ${snap0.clips.map((c) => `${c.kind}@${c.track}:${Math.round(c.w)}px`).join(", ")}`);
      const modalSel = `.modal-backdrop, .tour-card, .welcome-modal`;
      const modalOpen = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
      if (modalOpen) { await cdp.click(20, 20); await sleep(500); }
      const modalGone = !(await cdp.evalJs(`!!document.querySelector('${modalSel}')`));
      record("V0b welcome modal", modalGone, modalOpen ? "modal tự mở — đã đóng bằng click backdrop" : "không có modal tự mở");
      if (!modalGone) return;

      // V1 — chọn clip video đầu tiên, 2 panel phải cùng hiện.
      const s1 = await cdp.evalJs(SNAP_JS);
      const vIdx = s1.clips.findIndex((c) => c.kind === "clip-video");
      if (vIdx < 0) { skip("V1 chọn clip video / 2 panel", "project mẫu không có clip video"); }
      else {
        const pos = await find("scrollClip", vIdx);
        await cdp.click(pos.x, pos.y);
        await sleep(600);
        const p = await find("panels");
        const heads = p.sectionHeads.join(" | ");
        record("V1 chọn clip video / TransitionPanel + EffectPanel",
          p.trPanel && p.fxPanel && p.sectionHeads.some((h) => h.includes("Chuyển cảnh")) &&
          p.sectionHeads.some((h) => h.includes("Hiệu ứng")),
          `tr-panel=${p.trPanel} fx-panel=${p.fxPanel} sections=[${heads}]`);
      }

      // V2 — click card transition "fade": card được chọn + badge hiện.
      const p1 = await find("panels");
      if (!p1 || !p1.fadeCard) skip("V2 chọn transition fade + badge", "không tìm thấy card fade trong TransitionPanel");
      else {
        const pos = await find("pos", "fadeCard");
        if (!pos) record("V2 chọn transition fade + badge", false, "không đo được tọa độ card fade");
        else {
          await cdp.click(pos.x, pos.y);
          await sleep(600);
          const p2 = await find("panels");
          const badge = p2?.fadeCard?.badge;
          record("V2 chọn transition fade + badge",
            p2?.fadeCard?.selected === true && !!badge && badge.preview === "matched" &&
            badge.label.length > 0 && (await alive()),
            `card fade selected=${p2?.fadeCard?.selected} badge data-preview='${badge?.preview ?? ""}' nhãn='${badge?.label ?? ""}' app sống=${await alive()}`);
        }
      }

      // V3 — click toggle effect "Lật ngang" (mirror): item bật, app sống.
      const p2 = await find("panels");
      const mirror = (p2?.fxItems || []).find((i) => i.name === "Lật ngang");
      if (!mirror) skip("V3 bật effect Lật ngang", "không tìm thấy item 'Lật ngang' trong EffectPanel");
      else if (mirror.on) skip("V3 bật effect Lật ngang", "item đã bật sẵn từ trước (do V2? không — ghi SKIP thay vì claim bật mới)");
      else {
        const pos = await find("pos", "fxToggle:Lật ngang");
        if (!pos) record("V3 bật effect Lật ngang", false, "không đo được tọa độ toggle Lật ngang");
        else {
          await cdp.click(pos.x, pos.y);
          await sleep(600);
          const p3 = await find("panels");
          const after = (p3?.fxItems || []).find((i) => i.name === "Lật ngang");
          record("V3 bật effect Lật ngang (click thật)",
            after?.on === true && (await alive()),
            `Lật ngang off -> ${after?.on ? "on" : "off"}, app sống=${await alive()}`);
        }
      }

      // V4 — click lại để tắt: item tắt, app vẫn sống (trả state sạch).
      const p3 = await find("panels");
      const mirrorOn = (p3?.fxItems || []).find((i) => i.name === "Lật ngang");
      if (!mirrorOn || !mirrorOn.on) skip("V4 tắt effect Lật ngang", "item Lật ngang không ở trạng thái on sau V3 nên không có gì để tắt");
      else {
        const pos = await find("pos", "fxToggle:Lật ngang");
        if (!pos) record("V4 tắt effect Lật ngang", false, "không đo được tọa độ toggle Lật ngang");
        else {
          await cdp.click(pos.x, pos.y);
          await sleep(600);
          const p4 = await find("panels");
          const after = (p4?.fxItems || []).find((i) => i.name === "Lật ngang");
          record("V4 tắt effect Lật ngang (click thật)",
            after?.on === false && (await alive()),
            `Lật ngang on -> ${after?.on ? "on" : "off"}, app sống=${await alive()}`);
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
