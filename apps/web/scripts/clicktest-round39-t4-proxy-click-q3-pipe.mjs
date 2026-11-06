// clicktest-round39-t4-proxy-click-q3-pipe.mjs — Click-test full-app
// (đợt 39 T4): proxy lớn qua cổng S4 + toggle Q3 (re-gate giữ luật T2,
// settle-drop, badge nhiều controller) trên app thật.
//
// Cách chạy (2 terminal, từ gốc repo):
//   1. BRIDGE_WORK_DIR=<scratch>/bridge-work BRIDGE_PORT=8787 \
//        node server/bridge/src/index.js
//   2. cd apps/web && ../../node_modules/.bin/vite preview --port 5179 --strictPort
//      (BẮT BUỘC dùng vite preview, KHÔNG dùng vite dev: các luồng đợt 39
//      khác sửa file song song sẽ làm vite dev HMR reload trang giữa
//      chừng, state React reset, card import biến mất và welcome modal
//      hiện lại — đúng lỗi làm hỏng lượt chạy đầu của script này.)
//   3. node apps/web/scripts/clicktest-round39-t4-proxy-click-q3-pipe.mjs [debug-port]
// Chrome headless mới (ms-playwright cache) + profile mới /tmp/t4-cdprof-39
// nên không có autosave: app tải project mẫu như r6-clicktest.
//
// Luồng kiểm chứng (click chuột thật qua CDP, không gọi store nội bộ):
//   T0  app + toggle (thứ tự U1: toggle xuất hiện → splash tắt → đóng
//       modal → hit-test).
//   P1  import nguồn nhiễu 1080p 60 s → tạo proxy 720p qua bridge (tự
//       động hoặc nút tay) → sidecar trên đĩa phải ghi proxySize =
//       đúng kích thước file proxy và > 128 MiB (ngưỡng S4).
//   P2  phát ngược từ cuối timeline (clip1 8 s rồi vào clip proxy):
//       - mirror phải có ≥ 2 controller và badge multi
//         "BỊ CHẶN — N clip, lý do khác nhau" (badgeBlockedMulti):
//         clip1 bị chặn vì dưới ngưỡng, proxy + clip mẫu chưa từng
//         thử cổng (dòng "lý do chưa rõ"); N ≥ 2 vì project mẫu cũng
//         tạo controller riêng — không ép N = 2.
//       - cửa sổ scoped trong clip proxy (seek giữa timeline rồi phát
//         ngược 12 s, time trong [10, 60] và đang giảm): delta
//         controllerFetches = 0, hits không tăng, misses tăng,
//         largeFileLocked = true → "0 request từ controller" cho proxy
//         > 128 MiB (KHÔNG claim 0 request mạng tổng: <video> element
//         ở đường fallback vẫn tải file bình thường).
//   Q1  thêm fixture dễ decode 360p, seek cuối timeline, phát ngược:
//       badge ĐANG CHẠY + title chứa dòng từng clip bị chặn (proxy,
//       clip1) → trạng thái hỗn hợp không giấu clip bị chặn.
//   Q2  tắt toggle giữa chừng khi đang phát ngược: trạng thái TẮT,
//       prefetch 0; settledPrefetchDroppedFrames chỉ GHI SỐ (≥ 0):
//       > 0 mới là bằng chứng settle-drop bắt được trên browser, = 0
//       nghĩa là prefetch đã settle trước lúc tắt (không kết luận).
// Mỗi bước in PASS/FAIL kèm số đo; exit 1 khi T0/P1/P2/Q1 có FAIL.
// KHÔNG claim FPS: chỉ đếm prefetch frame + trạng thái cổng + fetch.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEBUG_PORT = Number(process.argv[2] || 9345);
const DEV_URL = process.env.T4_DEV_URL || "http://localhost:5179/";
const CHROME =
  process.env.T4_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/t4-cdprof-39";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRATCH = path.join(path.dirname(REPO_ROOT), "tmp-round39-t4");
const BRIDGE_WORK = process.env.T4_BRIDGE_WORK || path.join(SCRATCH, "bridge-work");
// Fixture: nguồn nhiễu 1080p 60 s (tạo trước bằng ffmpeg, KHÔNG vào
// repo) để proxy 720p CRF23 của bridge vượt 128 MiB (đo sim đợt này:
// nhiễu 720p CRF23 ≈ 3,38 MB/s → 60 s ≈ 203 MB). Script KHÔNG tự tạo
// lại file này (tốn ~4 phút encode): thiếu thì FAIL rõ ràng.
// clip1.mp4: fixture repo (720p, 1 GOP, decode ~29 fps → chặn đúng).
// easy 360p: script tự tạo bằng ffmpeg nếu chưa có (như U1).
const BIGSRC = process.env.T4_BIGSRC || path.join(SCRATCH, "bigsrc-1080p-60s.mp4");
const BIGSRC_NAME = path.basename(BIGSRC);
const CLIP1 = path.join(REPO_ROOT, "server/render/examples/media/clip1.mp4");
const CLIP1_NAME = "clip1.mp4";
const EASY = process.env.T4_EASY || path.join(SCRATCH, "t4-easy-360p.mp4");
const EASY_NAME = path.basename(EASY);
const S4_THRESHOLD = 128 * 1024 * 1024;

function ensureEasy() {
  if (fs.existsSync(EASY)) return;
  fs.mkdirSync(SCRATCH, { recursive: true });
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
    "-i", "testsrc2=size=640x360:rate=30:duration=10", "-g", "30",
    "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", EASY],
    { stdio: "inherit" });
  if (r.status !== 0 || !fs.existsSync(EASY)) {
    throw new Error(`không tạo được fixture ${EASY}`);
  }
}
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
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async clickEl(elJs, label) {
    await this.evalJs(`(() => {
      const el = ${elJs};
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "center" });
      return true;
    })()`);
    await sleep(300);
    const info = await this.evalJs(`(() => {
      const el = ${elJs};
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      return { x: cx, y: cy,
        inside: !!(top && (top === el || el.contains(top))),
        topCls: top ? (top.tagName + "." + top.className) : null };
    })()`);
    if (!info) throw new Error(`không tìm thấy để click: ${label}`);
    if (!info.inside) throw new Error(`click ${label} bị che bởi ${info.topCls} (chưa sẵn sàng)`);
    await this.click(Math.round(info.x), Math.round(info.y));
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

const TOGGLE_EL = `document.querySelector('.preview-decodeahead-toggle')`;
const REVERSE_EL = `[...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Phát ngược')`;
const cardJs = (name) => `[...document.querySelectorAll('.media-card')].find((c) => (c.querySelector('.media-name')?.textContent || '').trim() === '${name}')`;
const cardAddJs = (name) => `${cardJs(name)}?.querySelector('.media-add')`;
const cardProxyJs = (name) => `${cardJs(name)}?.querySelector('button.media-proxy')`;

// LƯU Ý template literal: regex phải viết \\\\d / \\\\. (bài học U1).
const TIME_JS = `(() => {
  const el = document.querySelector('.time-display');
  if (!el) return null;
  const parts = (el.textContent || '').split('/');
  if (parts.length < 2) return null;
  const parse = (s) => {
    const a = s.trim().split(':');
    if (a.length < 2) return null;
    const v = Number(a[0]) * 60 + Number(a[1]);
    return Number.isNaN(v) ? null : v;
  };
  const cur = parse(parts[0]);
  const total = parse(parts[1]);
  if (cur === null || total === null) return null;
  return { cur, total };
})()`;

const STATUS_JS = `(() => {
  const t = document.querySelector('.preview-decodeahead-toggle');
  const b = document.querySelector('.preview-decodeahead-warn-badge');
  return {
    toggle: t ? { text: t.textContent, status: t.dataset.status || null,
      pressed: t.getAttribute('aria-pressed'), title: t.title } : null,
    badge: b ? { text: b.textContent, display: b.style.display, title: b.title } : null,
    mirror: window.__vcutReverseDecodeAheadStatus || null,
    wc: window.__vcutReverseWc || null,
    toasts: [...document.querySelectorAll('.toast-msg')].map((e) => e.textContent),
  };
})()`;

const SPLASH_GONE_JS = `(() => {
  const t = document.querySelector('.preview-decodeahead-toggle');
  if (!t || document.querySelector('.splash')) return false;
  const r = t.getBoundingClientRect();
  return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === t;
})()`;

async function playReverseAndWaitForMovement(cdp, timeoutMs = 30000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const t0 = await cdp.evalJs(TIME_JS);
    try {
      await cdp.clickEl(REVERSE_EL, "nút Phát ngược");
    } catch (e) {
      if (!String(e.message || "").includes("modal")) throw e;
      await closeModalIfOpen(cdp);
      await sleep(500);
      await cdp.clickEl(REVERSE_EL, "nút Phát ngược (lại sau khi đóng modal)");
    }
    try {
      const moved = await cdp.waitFor(async () => {
        const t = await cdp.evalJs(TIME_JS);
        if (!t || !t0) return null;
        return Math.abs(t.cur - t0.cur) >= 2.6 ? t : null;
      }, "playhead ngược chạy ≥2,6 s", timeoutMs);
      return moved;
    } catch { /* thử bấm lại (có thể lần trước chỉ tạm dừng) */ }
  }
  return null;
}

async function waitForRunningPrefetch(cdp, passes = 4) {
  let last = null;
  for (let pass = 0; pass < passes; pass++) {
    await playReverseAndWaitForMovement(cdp);
    try {
      const found = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(STATUS_JS);
        last = s;
        return (s.mirror?.uiStatus === "running" && (s.mirror?.prefetchFrames || 0) > 0) ? s : null;
      }, "decode-ahead running + prefetch > 0", 20000);
      return { found, last: found };
    } catch { /* lượt này chưa mở -> phát lại */ }
  }
  return { found: null, last };
}

// Seek bằng click lên ruler: frac * tổng thời lượng (ruler width =
// duration * pxPerSec nên click tại frac của ruler = frac của timeline).
async function seekRuler(cdp, frac) {
  const rect = await cdp.evalJs(`(() => {
    const el = document.querySelector('.tl-ruler');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  })()`);
  if (!rect) throw new Error("không tìm thấy .tl-ruler");
  const x = Math.round(rect.x + frac * rect.w);
  const y = Math.round(rect.y + rect.h / 2);
  await cdp.click(x, y);
  await sleep(800);
  return { rect, x, y, time: await cdp.evalJs(TIME_JS) };
}

// Đóng welcome modal nếu đang mở (sau reload ngoài ý muốn modal hiện
// lại và che mọi click — lượt chạy đầu chết đúng chỗ này).
async function closeModalIfOpen(cdp) {
  const open = await cdp.evalJs(`!!document.querySelector('.modal-backdrop, .tour-card, .welcome-modal')`);
  if (!open) return false;
  await cdp.click(20, 20);
  await sleep(500);
  return true;
}

// Click có retry 1 lần khi bị modal che (đóng modal rồi bấm lại).
async function clickElRetry(cdp, elJs, label) {
  try {
    await cdp.clickEl(elJs, label);
  } catch (e) {
    if (!String(e.message || "").includes("modal")) throw e;
    await closeModalIfOpen(cdp);
    await sleep(500);
    await cdp.clickEl(elJs, label);
  }
}

async function importFile(cdp, filePath, fileName) {
  const doc = await cdp.send("DOM.getDocument", {});
  const q = await cdp.send("DOM.querySelector", {
    nodeId: doc.root.nodeId, selector: "aside.mediabin input[type=\"file\"]",
  });
  if (!q.nodeId) throw new Error("không tìm thấy file input của MediaBin");
  await cdp.send("DOM.setFileInputFiles", { files: [filePath], nodeId: q.nodeId });
  await cdp.waitFor(async () => {
    const found = await cdp.evalJs(`!!${cardJs(fileName)}`);
    return found || null;
  }, `media card ${fileName}`, 180000);
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  if (!fs.existsSync(BIGSRC)) throw new Error(`thiếu nguồn lớn ${BIGSRC} (tạo bằng ffmpeg trước, xem header script)`);
  if (!fs.existsSync(CLIP1)) throw new Error(`thiếu fixture repo ${CLIP1}`);
  ensureEasy();
  fs.rmSync(PROFILE, { recursive: true, force: true });
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE}`, "--no-sandbox",
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
    if (!pageTarget) throw new Error("không tìm thấy target type=page");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });

    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATUS_JS);
      return s.toggle ? s : null;
    }, "nút toggle decode-ahead", 90000);
    await cdp.waitFor(async () => {
      const gone = !(await cdp.evalJs(`!!document.querySelector('.splash')`));
      return gone || null;
    }, "splash tắt (project mẫu tải xong)", 120000);
    const modalOpen = await cdp.evalJs(`!!document.querySelector('.modal-backdrop, .tour-card, .welcome-modal')`);
    if (modalOpen) {
      await cdp.click(20, 20);
      await cdp.waitFor(async () => {
        const gone = !(await cdp.evalJs(`!!document.querySelector('.modal-backdrop, .tour-card, .welcome-modal')`));
        return gone || null;
      }, "welcome modal đóng sau click backdrop", 15000);
    }
    await cdp.waitFor(async () => {
      const ok = await cdp.evalJs(SPLASH_GONE_JS);
      return ok || null;
    }, "toggle bấm được (hit-test)", 60000);
    record("T0 app + toggle", true, modalOpen ? "modal tự mở — đã đóng bằng click backdrop" : "không có modal");

    // P1 — import nguồn lớn + tạo proxy qua bridge.
    await importFile(cdp, BIGSRC, BIGSRC_NAME);
    await cdp.clickEl(cardAddJs(BIGSRC_NAME), "nút ＋ Thêm của nguồn lớn");
    await sleep(800);
    let proxyOk = false;
    let manualClicked = false;
    let proxyDetail = "";
    let cardMissingSince = 0;
    const tProxy0 = Date.now();
    while (Date.now() - tProxy0 < 480000) {
      const info = await cdp.evalJs(`(() => {
        const card = ${cardJs(BIGSRC_NAME)};
        const b = ${cardProxyJs(BIGSRC_NAME)};
        const toasts = [...document.querySelectorAll('.toast-msg')].map((e) => e.textContent);
        return { card: !!card, btn: b ? b.textContent : null, disabled: b ? b.disabled : null, toasts };
      })()`);
      proxyDetail = `card=${info.card} btn=${JSON.stringify(info.btn)} disabled=${info.disabled} toasts=${JSON.stringify(info.toasts.slice(-2))}`;
      if ((info.btn || "").includes("✓ PROXY")) { proxyOk = true; break; }
      // Card biến mất khỏi DOM = trang đã reload ngoài ý muốn (HMR):
      // chờ thêm 30 s cho chắc rồi thoát sớm thay vì poll mù 480 s.
      if (!info.card) {
        if (!cardMissingSince) cardMissingSince = Date.now();
        else if (Date.now() - cardMissingSince > 30000) {
          proxyDetail += " CARD-BIEN-MAT-30s (nghi reload trang)";
          break;
        }
      } else cardMissingSince = 0;
      if ((info.toasts.join(" ")).includes("Không tạo được proxy")) break;
      if (!manualClicked && Date.now() - tProxy0 > 90000 && (info.btn || "").trim() === "Proxy 720p") {
        try {
          await cdp.clickEl(cardProxyJs(BIGSRC_NAME), "nút Proxy 720p (tay)");
          manualClicked = true;
        } catch (e) { proxyDetail += ` manual-click-lỗi=${e.message}`; }
      }
      await sleep(5000);
    }
    // Ground truth từ sidecar trên đĩa (bridge-work của chính script).
    const stem = BIGSRC_NAME.replace(/\.mp4$/i, "");
    const sidecarPath = path.join(BRIDGE_WORK, "proxies", `${stem}__proxy_720p.json`);
    const proxyPath = path.join(BRIDGE_WORK, "proxies", `${stem}__proxy_720p.mp4`);
    let sidecar = null;
    try { sidecar = JSON.parse(fs.readFileSync(sidecarPath, "utf8")); } catch {}
    const proxyStat = fs.existsSync(proxyPath) ? fs.statSync(proxyPath) : null;
    const p1ok = proxyOk && sidecar && proxyStat &&
      sidecar.proxySize === proxyStat.size && proxyStat.size > S4_THRESHOLD;
    record("P1 proxy lớn qua bridge", !!p1ok,
      `${proxyDetail} sidecar=${sidecar ? sidecar.proxySize : null} ` +
      `file=${proxyStat ? proxyStat.size : null} ngưỡng=${S4_THRESHOLD} ` +
      `manualClicked=${manualClicked}`);

    // P2 + Q-multi: import clip1, bật toggle + cờ Q2, seek cuối timeline
    // (trong clip1), phát ngược xuyên clip1 vào clip proxy.
    await importFile(cdp, CLIP1, CLIP1_NAME);
    await closeModalIfOpen(cdp);
    await clickElRetry(cdp, cardAddJs(CLIP1_NAME), "nút ＋ Thêm của clip1");
    await sleep(800);
    const base = await cdp.evalJs(STATUS_JS);
    await cdp.evalJs(`window.__vcutReverseWebcodecs = true;`);
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật)");
    await sleep(800);
    const afterToggle = await cdp.evalJs(STATUS_JS);
    const seek = await seekRuler(cdp, 0.99);
    const moved = await playReverseAndWaitForMovement(cdp, 30000);
    let multi = null;
    try {
      multi = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(STATUS_JS);
        const ctrls = s.mirror?.controllers || [];
        const badgeMulti = (s.badge?.text || "").includes("2 clip");
        return (ctrls.length >= 2 && badgeMulti) ? s : null;
      }, "badge multi 2 clip + ≥2 controller", 120000);
    } catch (e) { multi = await cdp.evalJs(STATUS_JS); }
    // multi có thể là snapshot cũ (lúc poll trúng) nên khẳng định lại
    // bằng snapshot tươi cur bên dưới.
    const cur = await cdp.evalJs(STATUS_JS);
    // Nhãn controller của clip import là blob UUID (không phải tên file)
    // nên khẳng định bằng: badge multi + title chứa dòng proxy + dòng
    // lý do dưới ngưỡng của clip1 (không ép tên "clip1" hay số clip
    // đúng 2 — clip mẫu của project cũng tạo controller riêng).
    record("Q-multi badge nhiều clip lý do khác nhau", (cur.badge?.text || "").includes("clip, lý do khác nhau") &&
      (cur.mirror?.controllers || []).length >= 2 &&
      (cur.badge?.title || "").includes("proxy") &&
      (cur.badge?.title || "").includes("dưới ngưỡng"),
      `seek=${JSON.stringify(seek.time)} moved=${!!moved} toggleAfter=${afterToggle.mirror?.uiStatus} ` +
      `badge=${JSON.stringify(cur.badge?.text)} badgeTitle=${JSON.stringify(cur.badge?.title)} ` +
      `controllers=${JSON.stringify(cur.mirror?.controllers)}`);
    // Cửa sổ scoped trong clip proxy: seek giữa timeline (frac 0,50)
    // rồi phát ngược — clip proxy dài 60 s trên timeline ~76 s nên mọi
    // cách xếp clip đều phủ kín đoạn playhead đi qua trong 12 s tới
    // (xem LIMITS T4); khẳng định time trong [10, 60] + đang giảm +
    // fetches delta 0 + misses tăng + largeFileLocked.
    const seek2 = await seekRuler(cdp, 0.50);
    const moved2 = await playReverseAndWaitForMovement(cdp, 30000);
    const tNow = await cdp.evalJs(TIME_JS);
    const f1 = await cdp.evalJs(STATUS_JS);
    await sleep(12000);
    const f2 = await cdp.evalJs(STATUS_JS);
    const tNow2 = await cdp.evalJs(TIME_JS);
    const scopedOk = tNow && tNow2 && tNow.cur >= 10 && tNow.cur <= 60 &&
      tNow2.cur >= 10 && tNow2.cur <= 60 &&
      tNow2.cur < tNow.cur &&
      (f2.wc?.controllerFetches ?? -1) === (f1.wc?.controllerFetches ?? -2) &&
      (f2.wc?.hits ?? -1) === (f1.wc?.hits ?? -2) &&
      (f2.wc?.misses ?? 0) > (f1.wc?.misses ?? 0) &&
      f2.wc?.largeFileLocked === true;
    record("P2 proxy >128MiB: 0 fetch từ controller (scoped)", !!scopedOk,
      `seek2=${JSON.stringify(seek2.time)} moved2=${!!moved2} ` +
      `time ${tNow?.cur} → ${tNow2?.cur} (cần trong [10, 60], đang chạy ngược) ` +
      `fetches ${f1.wc?.controllerFetches} → ${f2.wc?.controllerFetches} ` +
      `hits ${f1.wc?.hits} → ${f2.wc?.hits} misses ${f1.wc?.misses} → ${f2.wc?.misses} ` +
      `largeFileLocked=${f2.wc?.largeFileLocked} baselineFetches=${base.wc?.controllerFetches}`);

    // Q1 — fixture dễ decode: seek cuối timeline, phát ngược, chờ chạy.
    await importFile(cdp, EASY, EASY_NAME);
    await closeModalIfOpen(cdp);
    await clickElRetry(cdp, cardAddJs(EASY_NAME), "nút ＋ Thêm của fixture dễ decode");
    await sleep(800);
    await seekRuler(cdp, 0.97);
    const q1res = await waitForRunningPrefetch(cdp, 4);
    const q1 = q1res.found;
    const q1cur = await cdp.evalJs(STATUS_JS);
    const mixedTitle = q1cur.badge?.title || "";
    record("Q1 chạy + title hỗn hợp (dòng từng clip bị chặn)", !!q1 &&
      mixedTitle.includes("proxy") && mixedTitle.includes("dưới ngưỡng"),
      q1 ? `prefetch=${q1.mirror?.prefetchFrames} fps=${q1.mirror?.measurementFps} ` +
        `badge=${JSON.stringify(q1cur.badge?.text)} title=${JSON.stringify(mixedTitle)} ` +
        `controllers=${JSON.stringify(q1cur.mirror?.controllers)}`
        : `không đạt running+prefetch>0 sau 4 lượt; mirror cuối=${JSON.stringify(q1res.last?.mirror)}`);

    // Q2 — tắt giữa chừng khi đang phát ngược: TẮT + prefetch 0; số
    // frame settle-drop chỉ ghi (xem header: =0 là không kết luận).
    let q2moved = null;
    try { q2moved = await playReverseAndWaitForMovement(cdp, 20000); } catch {}
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (tắt giữa chừng)");
    await sleep(3000);
    const q2 = await cdp.evalJs(STATUS_JS);
    record("Q2 tắt giữa chừng → TẮT + prefetch 0", q2.mirror?.uiStatus === "off" &&
      (q2.mirror?.prefetchFrames || 0) === 0 &&
      (q2.badge?.text || "").includes("TẮT"),
      `moved=${!!q2moved} status=${q2.mirror?.uiStatus} prefetch=${q2.mirror?.prefetchFrames} ` +
      `settledDropped=${q2.mirror?.settledPrefetchDroppedFrames} ` +
      `inFlight=${q2.mirror?.inFlightPrefetchWindows} badge=${JSON.stringify(q2.badge?.text)}`);
  } finally {
    kill();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== T4 clicktest: ${results.length - failed.length}/${results.length} pass ==`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`FATAL: ${e.message}`);
  process.exitCode = 1;
});
