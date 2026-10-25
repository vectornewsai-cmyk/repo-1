// r6-clicktest.cjs — R6 Phase 9: click-test mở rộng trên Chromium headless qua CDP.
//
// Không cần Playwright: dùng WebSocket có sẵn của Node 24 + chrome headless
// (ms-playwright cache) + vite dev server trên :5173.
//
// Cách chạy:
//   1. (terminal khác) cd apps/web && npx vite            # port 5173
//   2. node apps/web/scripts/r6-clicktest.cjs [debug-port]
//   Chrome tự chạy với profile mới (/tmp/r6-cdprof) nên không có autosave:
//   editor tải project mẫu (3 clip) như Q2.
//
// Mỗi test in PASS/FAIL kèm số đo trước/sau. Exit 0 khi tất cả pass,
// exit 1 khi có FAIL (kể cả khi 1 test fail thì các test sau vẫn chạy tiếp
// nếu trạng thái cho phép; test phụ thuộc sẽ ghi SKIP thay vì đoán).
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEBUG_PORT = Number(process.argv[2] || 9334);
const DEV_URL = process.env.R6_DEV_URL || "http://localhost:5173/";
const CHROME =
  process.env.R6_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/r6-cdprof";
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
        (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)));
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
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(300);
  }
  async key(key, code, modifiers = 0, text) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown", text });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(300);
  }
  async waitFor(fn, label, timeoutMs = 60000) {
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

// Snapshot timeline qua DOM (không đọc store nội bộ — đúng như user thấy).
const SNAP_JS = `(() => {
  const clips = [...document.querySelectorAll('.tl-clip')].map(el => {
    const r = el.getBoundingClientRect();
    return { track: el.dataset.trackId, id: el.dataset.clipId,
      kind: [...el.classList].find(c => c.startsWith('clip-')) || '?',
      x: Math.round(r.left), y: Math.round(r.top),
      w: Math.round(r.width), h: Math.round(r.height),
      sel: el.classList.contains('selected') };
  });
  const lanes = document.querySelector('.tl-lanes')?.getBoundingClientRect();
  const scroll = document.querySelector('.tl-scroll');
  const ruler = document.querySelector('.tl-ruler')?.getBoundingClientRect();
  return { clips,
    lanes: lanes ? { x: lanes.left, y: lanes.top, w: lanes.width, h: lanes.height } : null,
    scroll: scroll ? { left: scroll.scrollLeft, vw: scroll.clientWidth } : null,
    ruler: ruler ? { x: ruler.left, y: ruler.top, w: ruler.width } : null,
    bodyText: document.body.innerText || '' };
})()`;

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
    // Đợi DevTools HTTP sẵn sàng.
    let pages = null;
    for (let i = 0; i < 60 && !pages; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
        pages = await r.json();
      } catch { await sleep(500); }
    }
    // /json/list trả cả target browser_ui (chrome://webui-toolbar...) — phải
    // chọn đúng target type "page", nếu không Page.navigate bị ERR_ABORTED.
    const pageTarget = (pages || []).find((p) => p.type === "page");
    if (!pageTarget) throw new Error("không tìm thấy target type=page trong /json/list");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });

    // T0 — chờ project mẫu load đủ clip.
    const snap0 = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(SNAP_JS);
      return s.clips.length >= 3 ? s : null;
    }, "project mẫu >= 3 clip", 90000);
    record("T0 load sample", true,
      `${snap0.clips.length} clip: ${snap0.clips.map((c) => `${c.kind}@${c.track}:${Math.round(c.w)}px`).join(", ")}`);
    // Welcome modal (class .modal-backdrop, không phải .welcome-modal) tự mở
    // ở profile mới và chặn mọi click (backdrop phủ toàn màn hình). Đóng bằng
    // click backdrop ở góc (20,20) — chính là cách user đóng nó.
    const modalSel = `.modal-backdrop, .tour-card, .welcome-modal`;
    const modalOpen = await cdp.evalJs(`!!document.querySelector('${modalSel}')`);
    if (modalOpen) {
      await cdp.click(20, 20);
      await sleep(500);
    }
    const modalGone = !(await cdp.evalJs(`!!document.querySelector('${modalSel}')`));
    record("T0b welcome modal", modalGone,
      modalOpen ? (modalGone ? "modal tự mở — đã đóng bằng click backdrop" : "modal tự mở nhưng click backdrop không đóng được")
      : "không có modal tự mở");

    const video = snap0.clips.find((c) => c.kind === "clip-video");
    if (!video) { record("T1 trim", false, "không có clip video trong sample"); return; }

    // T-i18n — đổi ngôn ngữ bằng nút thật, kiểm tra SpeedPanel đổi sang tiếng Anh.
    // Lưu ý Q2-fix vẫn còn nhưng nội dung topbar nay ~2600px > viewport 1440px:
    // nút ngôn ngữ nằm trong vùng cuộn ngang của .topbar (overflow-x:auto) nên
    // phải cuộn topbar tới cuối mới bấm được — test làm đúng như user phải làm.
    await cdp.click(video.x + video.w / 2, video.y + video.h / 2); // chọn clip video -> Inspector hiện SpeedPanel
    await sleep(500);
    const topScroll = await cdp.evalJs(`(() => {
      const b = document.querySelector('.topbar'); if (!b) return -1;
      b.scrollLeft = b.scrollWidth; return b.scrollLeft;
    })()`);
    const langBtn = await cdp.evalJs(`(() => {
      const b = [...document.querySelectorAll('button.tbtn')]
        .find(x => x.getAttribute('aria-label') === 'Ngôn ngữ' || x.title === 'Ngôn ngữ');
      if (!b) return null; const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    // innerText TÔN TRỌNG text-transform: uppercase của CSS nên panel-head
    // và label hiện thành "⏩ SPEED"/"PLAYBACK SPEED" — so sánh không phân biệt
    // hoa/thường mới đúng (bài học từ debug6).
    const low = (s) => (s || "").toLowerCase();
    const diag = async () => cdp.evalJs(`(() => { const t = (document.body.innerText || '').toLowerCase();
      return { lang: localStorage.getItem('vcut-lang'), sel: document.querySelectorAll('.tl-clip.selected').length,
        modal: !!document.querySelector('.modal-backdrop'),
        speedHead: t.includes('⏩ speed'), tocdo: t.includes('⏩ tốc độ'),
        playbackSpeed: t.includes('playback speed') }; })()`);
    if (!langBtn) {
      record("T-i18n toggle", false, "không tìm thấy nút ngôn ngữ .tbtn");
    } else {
      await cdp.click(langBtn.x, langBtn.y);
      await sleep(800);
      const after = await cdp.evalJs(SNAP_JS);
      const d1 = await diag();
      const hasEn = low(after.bodyText).includes("⏩ speed") && low(after.bodyText).includes("playback speed");
      const hasVi = low(after.bodyText).includes("⏩ tốc độ");
      record("T-i18n toggle vi->en", hasEn && !hasVi,
        hasEn && !hasVi ? `SpeedPanel hiện '⏩ Speed' + 'Playback speed', không còn '⏩ Tốc độ' (đã phải cuộn topbar ${topScroll}px để tới nút)`
        : `hasEn=${hasEn} hasVi=${hasVi} topbarScroll=${topScroll} diag=${JSON.stringify(d1)}`);
      // Trả về tiếng Việt để các test sau chạy trong ngữ cảnh mặc định.
      // Nhãn tiếng Anh dài hơn nên nút lại trôi ra ngoài viewport 1440px:
      // phải cuộn topbar lần nữa rồi mới query lại tọa độ nút.
      const topScroll2 = await cdp.evalJs(`(() => {
        const b = document.querySelector('.topbar'); if (!b) return -1;
        b.scrollLeft = b.scrollWidth; return b.scrollLeft;
      })()`);
      const langBtn2 = await cdp.evalJs(`(() => {
        const b = [...document.querySelectorAll('button.tbtn')]
          .find(x => x.getAttribute('aria-label') === 'Language' || x.title === 'Language');
        if (!b) return null; const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
      if (langBtn2) await cdp.click(langBtn2.x, langBtn2.y);
      await sleep(800);
      const back = await cdp.evalJs(SNAP_JS);
      const d2 = await diag();
      record("T-i18n toggle en->vi", low(back.bodyText).includes("⏩ tốc độ"),
        low(back.bodyText).includes("⏩ tốc độ") ? "đã về '⏩ Tốc độ'"
        : `không thấy '⏩ Tốc độ' sau khi toggle lại (scroll2=${topScroll2} btn2=${JSON.stringify(langBtn2)} diag=${JSON.stringify(d2)})`);
    }

    // T1 — trim mép phải clip video đầu tiên sang trái 60px, kéo nhiều bước nhỏ
    // như tay user thật. Kỳ vọng đúng: rộng giảm đúng ~60px (60px/s).
    // (Đã biết trước qua thí nghiệm đối chứng: kéo 1 bước nhảy thì đúng 180px,
    // kéo 12 bước thì sập về 12px — xem R6_LIMITS.md mục "BUG trim".)
    const s1 = await cdp.evalJs(SNAP_JS);
    const v1 = s1.clips.find((c) => c.kind === "clip-video");
    await cdp.drag(v1.x + v1.w - 2, v1.y + v1.h / 2, v1.x + v1.w - 62, v1.y + v1.h / 2);
    const s1b = await cdp.evalJs(SNAP_JS);
    const v1b = s1b.clips.find((c) => c.id === v1.id);
    record("T1 trim mép phải", !!v1b && Math.abs(v1b.w - (v1.w - 60)) <= 15,
      v1b ? `rộng ${v1.w}px -> ${v1b.w}px (kéo -60px, kỳ vọng ~${v1.w - 60}px)`
      : "clip biến mất sau trim");

    // T2 — split (S): chọn clip video RỘNG NHẤT (không phải clip vừa trim),
    // scrub playhead vào giữa clip, bấm S.
    const s2 = await cdp.evalJs(SNAP_JS);
    const v2 = s2.clips.filter((c) => c.kind === "clip-video").sort((a, b) => b.w - a.w)[0];
    await cdp.click(v2.x + v2.w / 2, v2.y + v2.h / 2);
    await sleep(300);
    const s2r = await cdp.evalJs(SNAP_JS);
    const midX = v2.x + v2.w / 2;
    await cdp.click(midX, s2r.ruler.y + 8); // click ruler = scrub playhead
    await sleep(300);
    const beforeSplit = (await cdp.evalJs(SNAP_JS)).clips;
    await cdp.key("s", "KeyS", 0, "s");
    await sleep(500);
    const afterSplit = (await cdp.evalJs(SNAP_JS)).clips;
    const sameTrack = afterSplit.filter((c) => c.track === v2.track);
    const parts = sameTrack.filter((c) => c.kind === "clip-video");
    const widthSum = parts.reduce((a, c) => a + c.w, 0);
    record("T2 split (S)", afterSplit.length === beforeSplit.length + 1,
      `clip ${beforeSplit.length} -> ${afterSplit.length}; phần video trên track ${v2.track}: ${parts.length} đoạn, tổng rộng ${widthSum}px (gốc ${v2.w}px)`);

    // T3 — delete (Del): chọn 1 đoạn vừa tách, bấm Delete.
    const s3 = await cdp.evalJs(SNAP_JS);
    const victim = s3.clips.find((c) => c.kind === "clip-video" && c.track === v2.track);
    let delOk = false, delDetail = "không tìm thấy đoạn video để xóa";
    if (victim) {
      await cdp.click(victim.x + victim.w / 2, victim.y + victim.h / 2);
      await sleep(300);
      const beforeDel = (await cdp.evalJs(SNAP_JS)).clips.length;
      await cdp.key("Delete", "Delete");
      await sleep(500);
      const afterDel = (await cdp.evalJs(SNAP_JS)).clips.length;
      delOk = afterDel === beforeDel - 1;
      delDetail = `clip ${beforeDel} -> ${afterDel}`;
    }
    record("T3 delete (Del)", delOk, delDetail);

    // T4 — box-select: kéo vùng trống qua >= 2 clip.
    const s4 = await cdp.evalJs(SNAP_JS);
    const lanes = s4.lanes, scroll = s4.scroll;
    let boxOk = false, boxDetail = "không tính được vùng trống";
    if (lanes && scroll) {
      // Hàng lane đầu tiên có clip: y giữa clip đầu; vùng trống = bên phải clip phải nhất trong hàng đó.
      const firstRowY = s4.clips[0].y + s4.clips[0].h / 2;
      const rowClips = s4.clips.filter((c) => Math.abs(c.y + c.h / 2 - firstRowY) < 10);
      const rightMost = Math.max(...rowClips.map((c) => c.x + c.w));
      const viewRight = lanes.x + scroll.vw;
      let startX = Math.min(rightMost + 40, viewRight - 20);
      if (startX <= rightMost + 5) {
        // Clip phủ kín viewport: cuộn timeline sang phải để lộ vùng trống.
        await cdp.evalJs(`document.querySelector('.tl-scroll').scrollLeft += 600`);
        await sleep(500);
        const s4b = await cdp.evalJs(SNAP_JS);
        const rowClipsB = s4b.clips.filter((c) => Math.abs(c.y + c.h / 2 - firstRowY) < 10);
        const rightMostB = Math.max(...rowClipsB.map((c) => c.x + c.w));
        startX = Math.min(rightMostB + 40, s4b.lanes.x + s4b.scroll.vw - 20);
      }
      const endX = s4.clips[0].x + 5;
      if (startX > endX + 30) {
        await cdp.drag(startX, firstRowY, endX, firstRowY, 16);
        const s4c = await cdp.evalJs(SNAP_JS);
        const nSel = s4c.clips.filter((c) => c.sel).length;
        boxOk = nSel >= 2;
        boxDetail = `kéo ${Math.round(startX)} -> ${Math.round(endX)} tại y=${Math.round(firstRowY)}: ${nSel} clip được chọn`;
      } else boxDetail = `vùng trống không đủ rộng (startX=${Math.round(startX)}, endX=${Math.round(endX)})`;
    }
    record("T4 box-select", boxOk, boxDetail);

    // T5 — undo/redo sau kéo: kéo clip PHẢI NHẤT trên track của nó sang phải
    // +120px (vùng trống, tránh bị overlapsOthers chặn như khi kéo vào clip
    // bên cạnh), Ctrl+Z về cũ, Ctrl+Shift+Z đi tiếp.
    const s5 = await cdp.evalJs(SNAP_JS);
    const byTrack = new Map();
    for (const c of s5.clips) {
      const cur = byTrack.get(c.track);
      if (!cur || c.x + c.w > cur.x + cur.w) byTrack.set(c.track, c);
    }
    const m5 = [...byTrack.values()].sort((a, b) => (b.x + b.w) - (a.x + a.w))[0];
    await cdp.click(m5.x + m5.w / 2, m5.y + m5.h / 2);
    await sleep(300);
    const orig = (await cdp.evalJs(SNAP_JS)).clips.find((c) => c.id === m5.id);
    await cdp.drag(orig.x + orig.w / 2, orig.y + orig.h / 2, orig.x + orig.w / 2 + 120, orig.y + orig.h / 2);
    const dragged = (await cdp.evalJs(SNAP_JS)).clips.find((c) => c.id === m5.id);
    const moved = dragged && Math.abs(dragged.x - orig.x) >= 60;
    let undoOk = false, redoOk = false, uDetail = "";
    if (moved) {
      await cdp.key("z", "KeyZ", 2); // Ctrl+Z
      const undone = (await cdp.evalJs(SNAP_JS)).clips.find((c) => c.id === m5.id);
      undoOk = undone && Math.abs(undone.x - orig.x) <= 2;
      await cdp.key("Z", "KeyZ", 10); // Ctrl+Shift+Z
      const redone = (await cdp.evalJs(SNAP_JS)).clips.find((c) => c.id === m5.id);
      redoOk = redone && Math.abs(redone.x - dragged.x) <= 2;
      uDetail = `gốc x=${orig.x}, kéo -> ${dragged.x}, undo -> ${undone?.x}, redo -> ${redone?.x}`;
    } else uDetail = `kéo không dịch chuyển (gốc x=${orig.x}, sau kéo x=${dragged?.x})`;
    record("T5a undo sau kéo", undoOk, uDetail);
    record("T5b redo sau kéo", redoOk, uDetail);

    // T6 — mobile viewport 390x844: không tràn ngang + FAB hiện.
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
    });
    await cdp.send("Page.reload");
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(SNAP_JS);
      return s.clips.length >= 3 ? s : null;
    }, "reload mobile >= 3 clip", 90000);
    // FAB từng không thấy 1 lần (run 4) dù matchMedia=true — chờ tối đa 10s
    // để layout mobile settle rồi mới kết luận (phân biệt flake với lỗi thật).
    await cdp.waitFor(async () => {
      const n = await cdp.evalJs(`document.querySelectorAll('.m-fab').length`);
      return n >= 2 ? n : null;
    }, "FAB mobile xuất hiện", 10000).catch(() => null);
    const mob = await cdp.evalJs(`(() => {
      const de = document.documentElement;
      const fabs = [...document.querySelectorAll('.m-fab')].map(el => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), vis: r.width > 0 && r.height > 0 };
      });
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, fabs,
        innerW: window.innerWidth,
        mqMobile: window.matchMedia('(max-width: 768px)').matches,
        fabbar: !!document.querySelector('.m-fabbar'),
        mediaBinDesktop: !!document.querySelector('.mediabin, .media-bin') };
    })()`);
    record("T6a mobile không tràn ngang", mob.scrollW <= mob.clientW + 1,
      `scrollWidth=${mob.scrollW} clientWidth=${mob.clientW}`);
    record("T6b mobile FAB hiện", mob.fabs.length >= 2 && mob.fabs.some((f) => f.vis),
      `FAB: ${JSON.stringify(mob.fabs)} innerW=${mob.innerW} mqMobile=${mob.mqMobile} fabbar=${mob.fabbar}`);
  } finally {
    kill();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== TỔNG: ${results.length - failed.length}/${results.length} pass ==`);
  if (failed.length) console.log(`FAIL: ${failed.map((r) => r.name).join(", ")}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error("HARNESS LỖI:", e.message); process.exit(2); });
