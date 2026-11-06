// clicktest-round38-u1-decodeahead-pipe.mjs — Click-test toggle decode-ahead
// Q3 trên app thật (đợt 38 U1; KHÔNG phải probe module rời như T2).
//
// Cách chạy (2 terminal, từ gốc repo):
//   1. cd apps/web && ../../node_modules/.bin/vite --port 5179 --strictPort
//   2. node apps/web/scripts/clicktest-round38-u1-decodeahead-pipe.mjs [debug-port]
// Chrome headless mới (ms-playwright cache) + profile mới /tmp/u1-cdprof-38
// nên không có autosave: app tải project mẫu như r6-clicktest.
//
// Luồng kiểm chứng (click chuột thật qua CDP, không gọi store nội bộ):
//   S1 bị chặn: bấm toggle khi chưa có số đo → badge "BỊ CHẶN" + toast
//      đúng chuỗi cổng (lý do chưa đo) + mirror uiStatus=blocked.
//   S2 đang chạy: import fixture dễ decode thật (640×360/300 frame/10s,
//      GOP 30, h264 — script tự tạo bằng ffmpeg nếu chưa có) → thêm
//      vào timeline → bật cờ engine Q2 (__vcutReverseWebcodecs, KHÔNG
//      phải bypass cổng decode-ahead) → phát ngược từ cuối → cửa sổ
//      decode đầu tiên đo fps thật → cổng mở (nếu ≥60) → badge "ĐANG
//      CHẠY — prefetch N frame", prefetchFrames > 0.
//   S3 tắt: bấm toggle tắt → badge "TẮT" + toast tắt; phát ngược lại,
//      đợi đường WebCodecs vẽ lại (wc misses tăng) → prefetch vẫn 0.
//   S4 bật giữa chừng: bấm toggle bật lại trong lúc phát ngược → từ cửa
//      sổ decode mới trở đi lại có prefetch > 0.
//   S5 i18n: bấm nút ngôn ngữ → nhãn toggle sang tiếng Anh.
// Mỗi bước in PASS/FAIL kèm số đo; exit 1 khi S1–S4 có FAIL. S2/S4 có
// thể FAIL một cách trung thực nếu decode phần mềm trên máy này < 60
// fps (khi đó ghi rõ measurementFps, không bịa prefetch).
// KHÔNG claim FPS: chỉ đếm prefetch frame + trạng thái cổng.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEBUG_PORT = Number(process.argv[2] || 9341);
const DEV_URL = process.env.U1_DEV_URL || "http://localhost:5179/";
const CHROME =
  process.env.U1_CHROME ||
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const PROFILE = "/tmp/u1-cdprof-38";
// Fixture: video dễ decode thật (640×360, 300 frame, GOP 30, testsrc2) để
// cổng có cơ hội mở (ngưỡng dễ = 60 fps). KHÔNG dùng clip1.mp4 của repo
// cho bước này: clip1 là 720p với đúng 1 GOP 240 frame nên 1 cửa sổ
// decode = cả file, đo thật trên VM này chỉ 29,58 fps → cổng chặn đúng
// (xem LIMITS U1 §2); dùng nó thì S2/S4 không bao giờ mở được dù code
// đúng. Fixture KHÔNG nằm trong repo (cấm binary vào batch): script tự
// tạo bằng ffmpeg vào scratch ngoài repo nếu chưa có; U1_FIXTURE ghi đè.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRATCH = path.join(path.dirname(REPO_ROOT), "tmp-round38-u1");
const FIXTURE = process.env.U1_FIXTURE || path.join(SCRATCH, "u1-easy-360p.mp4");
const FIXTURE_NAME = path.basename(FIXTURE);
function ensureFixture() {
  if (fs.existsSync(FIXTURE)) return;
  fs.mkdirSync(SCRATCH, { recursive: true });
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi",
    "-i", "testsrc2=size=640x360:rate=30:duration=10", "-g", "30",
    "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", FIXTURE],
    { stdio: "inherit" });
  if (r.status !== 0 || !fs.existsSync(FIXTURE)) {
    throw new Error(`không tạo được fixture ${FIXTURE} (cần ffmpeg; hoặc đặt U1_FIXTURE tới file mp4 có sẵn)`);
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
  // Click thật vào phần tử tìm bằng JS. Kiểm tra hit-test trước khi
  // click: nếu phần tử bị splash/modal che thì NÉM LỖI kèm tên lớp che
  // (bài học lượt chạy đầu: click rơi vào splash, trạng thái không đổi
  // mà script vẫn tưởng đã bấm — không được click mù).
  async clickEl(elJs, label) {
    // Cuộn phần tử vào giữa khung nhìn trước (grid media có scroll riêng:
    // card nằm ngoài vùng nhìn thấy thì rect vẫn có nhưng điểm click rơi
    // vào phần tử khác đang vẽ ở đó, vd nút ghost-btn dưới grid).
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
const LANG_EL = `[...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Ngôn ngữ')`;
const MEDIA_ADD_EL = `[...document.querySelectorAll('.media-card')].find((c) => (c.querySelector('.media-name')?.textContent || '').trim() === '${FIXTURE_NAME}')?.querySelector('.media-add')`;

// Thời gian playhead hiện tại từ .time-display ("mm:ss.t / ...").
// LƯU Ý: chuỗi này là template literal nên regex phải viết \\d / \\.
// (viết \d sẽ bị template literal nuốt backslash thành chữ "d" và
// TIME_JS trả null mãi — đúng bug làm S3 fail oan ở lượt chạy trước
// dù phát ngược vẫn chạy, wc misses vẫn tăng).
const TIME_JS = `(() => {
  const el = document.querySelector('.time-display');
  if (!el) return null;
  const m = (el.textContent || '').match(/(\\d+):(\\d+(?:\\.\\d+)?)/);
  if (!m) return null;
  return { cur: Number(m[1]) * 60 + Number(m[2]) };
})()`;

// Bấm nút Phát ngược cho tới khi playhead thực sự chạy ngược (đổi ≥2,6 s
// = qua 1 biên cửa sổ 75 frame ở 30 fps). Nút này là toggle (đang phát
// thì bấm sẽ tạm dừng) nên có thể cần bấm 2 lần: lần 1 dừng, lần 2 phát.
async function playReverseAndWaitForMovement(cdp, timeoutMs = 30000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const t0 = await cdp.evalJs(TIME_JS);
    await cdp.clickEl(REVERSE_EL, "nút Phát ngược");
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

// Đợi cổng mở + prefetch > 0 qua nhiều lượt phát ngược ngắn: mỗi lượt
// phát ngược chỉ dài ~10 s (hết fixture là dừng) nên chờ 45 s liền một
// mạch sẽ phí 35 s nhìn player đã dừng — thay vào đó mỗi lượt: đảm bảo
// đang phát ngược rồi chờ tối đa 20 s (đủ 1 lượt phát + biên), hết lượt
// thì phát lại. Trả về { found, last } (last = mirror cuối để ghi log
// khi fail, không đoán mò).
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
    } catch { /* lượt này chưa mở (cửa sổ đo chậm / tải nặng) -> phát lại */ }
  }
  return { found: null, last };
}

const STATUS_JS = `(() => {
  const t = document.querySelector('.preview-decodeahead-toggle');
  const b = document.querySelector('.preview-decodeahead-warn-badge');
  const tr = t ? t.getBoundingClientRect() : null;
  return {
    toggle: t ? { text: t.textContent, status: t.dataset.status || null,
      pressed: t.getAttribute('aria-pressed'), title: t.title,
      rect: tr ? { x: tr.left, y: tr.top, w: tr.width, h: tr.height } : null } : null,
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

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome tại ${CHROME}`);
  ensureFixture();
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

    // T0 — thứ tự bắt buộc (bài học 3 lượt chạy đầu):
    //  (a) chờ nút toggle xuất hiện (app đã mount preview);
    //  (b) chờ splash tắt (hiện khi !ready, z-index 200 phủ toàn màn
    //      hình cho tới khi project mẫu tải xong);
    //  (c) ĐÓNG welcome modal — modal này chỉ xuất hiện SAU khi splash
    //      tắt (welcomeOpen && ready), nên kiểm tra modal trước bước (b)
    //      sẽ thấy "không có modal" rồi kẹt ở hit-test sau đó;
    //  (d) chờ nút toggle BẤM ĐƯỢC qua hit-test.
    // Click rơi vào lớp phủ thì trạng thái không đổi mà script vẫn tưởng
    // đã bấm — nên không được click mù khi chưa qua hit-test.
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

    // S1 — BỊ CHẶN: bấm toggle khi chưa có controller/số đo nào.
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead");
    await sleep(800);
    const s1 = await cdp.evalJs(STATUS_JS);
    const s1Toast = s1.toasts.join(" | ");
    record("S1 toggle → bị chặn", s1.toggle?.status === "blocked" &&
      (s1.badge?.text || "").includes("BỊ CHẶN") &&
      (s1.mirror?.uiStatus === "blocked") &&
      (s1.mirror?.reasons || []).includes("software-decode-not-measured"),
      `toggle=${s1.toggle?.status} badge=${JSON.stringify(s1.badge?.text)} mirror=${JSON.stringify(s1.mirror)} toast=${JSON.stringify(s1Toast)}`);
    // Tắt lại để S2 bắt đầu từ trạng thái tắt sạch (tránh wanted dính).
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (tắt lại)");
    await sleep(500);

    // S2a — import clip1 thật qua file input của MediaBin.
    const doc = await cdp.send("DOM.getDocument", {});
    const q = await cdp.send("DOM.querySelector", {
      nodeId: doc.root.nodeId, selector: "aside.mediabin input[type=\"file\"]",
    });
    if (!q.nodeId) throw new Error("không tìm thấy file input của MediaBin");
    await cdp.send("DOM.setFileInputFiles", { files: [FIXTURE], nodeId: q.nodeId });
    await cdp.waitFor(async () => {
      const found = await cdp.evalJs(`!![...document.querySelectorAll('.media-card')].find((c) => (c.querySelector('.media-name')?.textContent || '').trim() === '${FIXTURE_NAME}')`);
      return found || null;
    }, "media card clip1.mp4", 60000);
    await cdp.clickEl(MEDIA_ADD_EL, "nút ＋ Thêm của clip1.mp4");
    await sleep(800);
    // Bật cờ engine Q2 (đường WebCodecs) — KHÔNG phải bypass cổng Q3.
    await cdp.evalJs(`window.__vcutReverseWebcodecs = true;`);
    // Bật toggle (lúc này vẫn bị chặn vì chưa có số đo) rồi phát ngược.
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật trước khi phát ngược)");
    await sleep(500);
    // S2b — đợi cổng mở + prefetch > 0 qua tối đa 4 lượt phát ngược
    // (số đo decode dao động mạnh theo tải: 10–99 fps đo được ở probe,
    // nên cần nhiều cửa sổ mới bắt được cửa sổ ≥60 fps mở cổng).
    const s2res = await waitForRunningPrefetch(cdp, 4);
    const s2 = s2res.found;
    const s2ok = !!s2;
    record("S2 bật → prefetch tăng", s2ok,
      s2 ? `prefetch=${s2.mirror?.prefetchFrames} fps=${s2.mirror?.measurementFps} res=${s2.mirror?.measurementResolution} badge=${JSON.stringify(s2.badge?.text)} wc=${JSON.stringify(s2.wc)}`
      : `không đạt running+prefetch>0 sau 4 lượt; mirror cuối=${JSON.stringify(s2res.last?.mirror)} wc=${JSON.stringify(s2res.last?.wc)}`);

    // S3 — TẮT: bấm toggle tắt, phát ngược lại qua ≥1 biên cửa sổ
    // (playhead chạy ≥2,6 s) rồi khẳng định: trạng thái tắt, prefetch 0,
    // không còn cảnh báo — tức cửa sổ mới đã decode mà không prefetch.
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (tắt)");
    await sleep(800);
    const s3moved = await playReverseAndWaitForMovement(cdp);
    const s3 = await cdp.evalJs(STATUS_JS);
    record("S3 tắt → dừng prefetch", !!s3moved &&
      s3.mirror?.uiStatus === "off" &&
      (s3.mirror?.prefetchFrames || 0) === 0 &&
      (s3.badge?.text || "").includes("TẮT") &&
      (s3.mirror?.warnings || []).length === 0,
      s3moved
        ? `playhead đã chạy qua biên cửa sổ; status=${s3.mirror?.uiStatus} prefetch=${s3.mirror?.prefetchFrames} badge=${JSON.stringify(s3.badge?.text)} wc=${JSON.stringify(s3.wc)} toast=${JSON.stringify(s3.toasts.join(" | "))}`
        : `playhead KHÔNG chạy được (không chứng minh được "dừng"): status=${s3.mirror?.uiStatus} prefetch=${s3.mirror?.prefetchFrames} wc=${JSON.stringify(s3.wc)}`);

    // S4 — BẬT GIỮA CHỪNG: phát ngược trước rồi bấm toggle bật trong
    // lúc đang chạy (đúng nghĩa "giữa chừng"), đợi prefetch xuất hiện
    // từ cửa sổ decode mới trở đi (tối đa 4 lượt, như S2, vì số đo dao
    // động theo tải — lần bật lại dùng số đo mới nhất, không mượn số
    // của lần bật trước).
    await playReverseAndWaitForMovement(cdp);
    await cdp.clickEl(TOGGLE_EL, "toggle decode-ahead (bật giữa chừng)");
    const s4res = await waitForRunningPrefetch(cdp, 4);
    const s4 = s4res.found;
    record("S4 bật giữa chừng → prefetch lại", !!s4,
      s4 ? `prefetch=${s4.mirror?.prefetchFrames} fps=${s4.mirror?.measurementFps} badge=${JSON.stringify(s4.badge?.text)}`
      : `không đạt running+prefetch>0 sau 4 lượt; mirror cuối=${JSON.stringify(s4res.last?.mirror)} wc=${JSON.stringify(s4res.last?.wc)}`);

    // S5 — i18n: đổi ngôn ngữ, nhãn toggle phải sang tiếng Anh ĐÚNG
    // trạng thái hiện tại (running → ON, blocked → BLOCKED, off → OFF).
    // Effect đổi ngôn ngữ trong preview refresh lại nhãn ngay nên không
    // phụ thuộc vòng lặp đang ngủ hay không. Kiểm tra "đã dịch" chứ
    // không ép trạng thái phải là ON (S4 có thể bị chặn đúng vì tải).
    let s5ok = false;
    let s5detail = "SKIP: không tìm thấy nút ngôn ngữ";
    try {
      const before = await cdp.evalJs(STATUS_JS);
      const expectedEn = before.mirror?.uiStatus === "running"
        ? "Decode-ahead: ON"
        : before.mirror?.uiStatus === "blocked"
          ? "Decode-ahead: BLOCKED"
          : "Decode-ahead: OFF";
      await cdp.clickEl(LANG_EL, "nút Ngôn ngữ");
      await sleep(800);
      const s5 = await cdp.evalJs(STATUS_JS);
      s5ok = (s5.toggle?.text || "").includes(expectedEn);
      s5detail = `trạng thái=${before.mirror?.uiStatus} kỳ vọng=${expectedEn} toggle=${JSON.stringify(s5.toggle?.text)}`;
    } catch (e) {
      // Chỉ SKIP khi nút thực sự không tồn tại; bị che = lỗi thật.
      s5ok = String(e.message || "").includes("không tìm thấy");
      s5detail = `${s5ok ? "SKIP" : "FAIL"}: ${e.message}`;
    }
    record("S5 i18n en", s5ok, s5detail);
  } finally {
    kill();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== U1 clicktest: ${results.length - failed.length}/${results.length} pass ==`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`FATAL: ${e.message}`);
  process.exitCode = 1;
});
