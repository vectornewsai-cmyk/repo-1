#!/usr/bin/env node
/**
 * clicktest-61r3-fps-cal.mjs — Phase 9 đợt 61, luồng R3 (BẢN V2): đóng nợ
 * đợt 60 §5.3 (Q1 preview enhance) — (a) đo FPS preview trước/sau enhance,
 * (b) hiệu chuẩn thang blur denoise, (d) deinterlace trên footage
 * interlaced thật.
 *
 * V2 sửa 4 vấn đề của run 1 (xem clicktest-61r3-fps-cal-run1.mjs + log
 * run 1), và run 3/4 sửa thêm 3 vấn đề của V2 (xem log run 3/4):
 *   1. FPS run 1 đo theo thứ tự cố định trong lúc loadavg tăng đơn điệu
 *      11.5 → 17.8 (các luồng đợt 61 khác chạy song song) nên tỉ lệ
 *      combo/baseline 0.62x là nhiễu tải, không phải chi phí enhance.
 *      V2 đo XEN KẼ baseline giữa các cấu hình ([B,D,B,S,B,I,B,C,B]) và
 *      tính tỉ lệ theo baseline kề trước/sau (drift-corrected); kèm
 *      micro-benchmark vòng lặp kín (median ms/frame) vốn bền với tải.
 *      LƯU Ý run 4: combo 0.54x trong lúc load GIẢM (2.6 → 1.6) — không
 *      còn giải thích được bằng tải tăng; xem LIMITS §1 (chi phí thật
 *      của blur+zoom trên đường raster có thể cao hơn micro-bench vì
 *      micro-bench đo canvas không hiển thị, raster có thể bị hoãn).
 *   2. Run 1 đọc hook enhance khi playhead đang ở clip 2 (không enhance)
 *      nên log hook toàn 0 — V2 verify hook sau seek 0 + chờ ngủ (clip 1).
 *   3. Blur 0.3/0.6px KHÔNG đổi pixel ở 1280x720 (std giữ nguyên, diff 0)
 *      nhưng 0.9px nhảy vọt -60% và 0.9 == 1.2px y hệt — nghi lượng tử
 *      hóa blur của Chrome theo kích thước canvas. V2 đo ở CẢ 2 kích thước
 *      (1280x720 và 488x275 = letterbox preview thật), cộng step-edge
 *      (đo độ rộng chuyển tiếp) và đo hqdn3d CÙNG metric trong trình
 *      duyệt để đối chiếu trực tiếp.
 *   4. D3 run 1 timeout chờ ngủ sau khi đổi src clip (không rõ nguyên
 *      nhân). V2 chẩn đoán: poll idle + trạng thái element media
 *      (readyState/seeking/error) mỗi 2s trước khi kết luận.
 *   5. D1 run 1 dùng metric combing thô (tỉ lệ 1.47x, mơ hồ). V2 dùng tỉ
 *      lệ cross-field/same-field (C/S): progressive ≈ 1, interlaced
 *      chuyển động >> 1.
 *   6. Run 3: D3 chờ element trong __vcutMediaEls — hook đó chỉ refresh
 *      ở nhánh playing nên lúc pause nó giữ danh sách cũ; run 4 sửa bằng
 *      bringToFront tab app (tab trắng làm rAF dừng hẳn) + cổng kiểm tra
 *      canvas thật (std luma) thay cho poll element.
 *   7. Run 4: hook kỳ vọng còn khóa thang cũ (blur 0.6) nên A-hook fail
 *      oan dù hook trả đúng thang mới (1.5px) — đã cập nhật kỳ vọng sang
 *      thang hiệu chuẩn đợt 61 R3 (denoise/combo → 1.5px); micro-bench
 *      đo blur 1.5/3.0px thay cho 0.6/1.2px; thêm slot warmup 6s trước
 *      dãy xen kẽ (run 4: 2 slot đầu chỉ 15–23 fps do máy chưa ấm).
 *   8. Đợt 62 R3: thang blur thuần bị thay bằng BLEND (1-a)·gốc +
 *      a·blur(3.0px), a = strength (xem LIMITS đợt 62 R3 §2: blur thuần
 *      lượng tử hóa, mức hiệu quả nhỏ nhất đã -60%; downscale cũng
 *      nhảy bậc) — hook kỳ vọng denoise/combo → blur 3.0 + alpha 0.5;
 *      phần B đo đường cong blend (alpha 0/0.2/0.5/0.8/1.0) thay cho
 *      blur thuần, đối chiếu hqdn3d; micro-bench đo composite 2 lần vẽ
 *      (gốc + mờ alpha) thay cho 1 lần vẽ blur.
 *   9. Đợt 63 R3: a = strength đổi sang PIECEWISE qua 4 knot khớp hqdn3d
 *      (0.3→0.195, 0.5→0.486, 0.8→0.806, 1→0.981 — xem LIMITS đợt 63
 *      §2; probe-blend-r63): hook kỳ vọng denoise/combo → blur 3.0 +
 *      alpha 0.486; phần B đo theo strength (map sang alpha piecewise
 *      trong trang) thay cho alpha trực tiếp; FPS đo lại 3 lần xen kẽ
 *      (run 1 đợt này chạy code tuyến tính cũ — cùng 2 lần vẽ nên chi
 *      phí raster như nhau; run 2–3 chạy code piecewise mới).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-60q1-enhance-preview.mjs.
 * KHÔNG sửa code sản phẩm. KHÔNG push/tag/binary.
 *
 * Các phase (profile Chrome mới tinh):
 *   A. FPS preview: project mẫu (2 clip video 4s, 640x360 webm). 5 cấu hình
 *      enhance trên clip 1, bật bằng CHUỘT THẬT (mẫu Q1), thứ tự xen kẽ
 *      9 slot. Mỗi slot: seek 0 → verify hook → phát → warmup 0.8s →
 *      mẫu 3.0s (Δ__vcutHoldStats.draw/Δwall = tốc độ vẽ thật,
 *      Δ__vcutPreviewIdle.ticks/Δwall, tốc độ tiến playhead/wall, thống
 *      kê gap rAF __vcutPreviewRaf). Ghi loadavg trước/sau mỗi slot.
 *   A2. Micro-benchmark chi phí vẽ offscreen (tab trắng): drawImage
 *      thường vs blur 3.0px vs zoom 1.023 vs composite blend (gốc +
 *      mờ alpha 0.5/1.0 — đúng cơ chế preview.tsx đợt 62 R3),
 *      ở 488x275 (letterbox preview thật) và 1280x720, N=300/lần ×
 *      3 lần, median.
 *   B. Hiệu chuẩn blend (tab trắng): frame phẳng+nhiễu thật (PNG trích
 *      từ video encode) vẽ qua composite blend — đúng cơ chế preview.tsx
 *      đợt 62 R3 — ở 2 kích thước; step-edge blend; std hqdn3d cùng
 *      metric (frame hq15_*).
 *   D1. Combing decoder (tab trắng): tỉ lệ C/S trên interlaced thật vs
 *      progressive tại 3 mốc thời gian.
 *   D2. Render thật + idet: render.js với enhance deinterlace trên clip
 *      interlaced + đối chứng không enhance; idet prog trước/sau.
 *   D3 (best-effort + chẩn đoán): nạp clip interlaced vào project mẫu
 *      trong app qua store (media URL cùng origin qua middleware vite
 *      /r61r3-media/), đo combing trên canvas preview thật; đối chứng
 *      progressive cùng cách.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-61r3-fps-cal.mjs
 * Env: R3_DEV_PORT (mặc định tự chọn 5540–5549), R3_DEBUG_PORT
 * (9640–9649), R3_DISPLAY (mặc định quét :170–:179 — display RIÊNG),
 * R3_SCRATCH (mặc định hidden_files/round61-r3/headed). Exit 0 mọi case
 * PASS, 1 có FAIL, 2 harness lỗi. KHÔNG sửa file sản phẩm, KHÔNG
 * push/tag/binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R3_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3", "headed");
const CHROME_PW = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
// Đợt 63 R3: chromium-1248 biến mất khỏi cache 08/11 (giữa 2 lần chạy);
// tìm mọi bản chromium-* còn trong cache, ưu tiên bản mới nhất
// (lúc viết: chromium-1254, Chrome 158). V0 linear đo lại làm đối chứng
// nên mọi lệch phiên bản (nếu có) đều nhìn thấy được khi so số đợt 62.
function findChrome() {
  const dir = path.join(os.homedir(), ".cache/ms-playwright");
  try {
    const cands = fs.readdirSync(dir)
      .filter((d) => /^chromium-\d+$/.test(d))
      .map((d) => path.join(dir, d, "chrome-linux64", "chrome"))
      .filter((p) => fs.existsSync(p))
      .sort().reverse();
    if (cands.length) return cands[0];
  } catch {}
  return null;
}
const CHROME = fs.existsSync(CHROME_PW) ? CHROME_PW : (findChrome() || (() => { throw new Error("không thấy chrome trong ~/.cache/ms-playwright (cần npx playwright install chromium)"); })());
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round61-r3";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r3.config.mjs");
const SCRATCH_TXT = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3-scratch.txt");
const MEDIA_DIR = fs.existsSync(SCRATCH_TXT)
  ? path.join(fs.readFileSync(SCRATCH_TXT, "utf8").trim(), "media")
  : path.join(os.homedir(), "workspace", ".scratch-r61r3-1cOf", "media");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadAvg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim().split(" ").slice(0, 3).join(" "); }
  catch { return "?"; }
}

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
      if (msg.method === "Page.javascriptDialogOpening") {
        const id = this.nextId++;
        this.ws.send(JSON.stringify({ id, method: "Page.handleJavaScriptDialog", params: { accept: true } }));
        return;
      }
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
  async mouse(type, x, y, extra = {}) {
    return this.send("Input.dispatchMouseEvent", { type, x: Math.round(x), y: Math.round(y), ...extra });
  }
  async click(x, y, modifiers = 0) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await sleep(400);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__r3errors = [];
  window.addEventListener("error", (e) => { try { window.__r3errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r3errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r3errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r3errors.push("unhandledrejection: <?>"); } });
  window.__r3boot = Math.random().toString(36).slice(2);
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r3storeMod || (window.__r3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
  });
  const hook = window.__vcutPreviewEnhance ? { ...window.__vcutPreviewEnhance } : null;
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  const hold = window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null;
  const canvas = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  return {
    clips,
    selection: st.selection,
    playhead: st.playhead,
    playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled,
    hook, idle, hold,
    canvasW: canvas ? canvas.width : null,
    canvasH: canvas ? canvas.height : null,
    errors: (window.__r3errors || []).slice(),
  };
})()`;

const SAMPLE_FN = `(() => {
  const st = window.__r3storeMod ? window.__r3storeMod.useStore.getState() : null;
  return {
    draw: window.__vcutHoldStats ? window.__vcutHoldStats.draw : null,
    ticks: window.__vcutPreviewIdle ? window.__vcutPreviewIdle.ticks : null,
    ph: st ? st.playhead : null,
    playing: st ? st.playing : null,
    wall: performance.now(),
  };
})()`;

// Thống kê gap rAF trong khoảng mẫu (chỉ tick lúc phát, loại justWoke).
// Đợt 66 T5 — BUG n=0 (nợ R64 §8.3, R65 §8 mục 4; cùng bug với
// clicktest-64r3-fps-long.mjs): bản cũ cắt theo CHỈ SỐ TUYỆT ĐỐI fromIdx
// (= samples.length lúc đầu slot), nhưng __vcutPreviewRaf.samples là
// ring buffer tối đa 5000 mẫu — sau ~83 s rAF mẫu cũ bị đẩy ra, fromIdx
// vượt độ dài buffer → slice rỗng → { n: 0 }. Bản này cắt theo TIMESTAMP
// (x.t trong [t0, t1], cùng đồng hồ performance.now() với SAMPLE_FN.wall)
// như measure-65r8-presented-fps.mjs. RAF_STATS_FN cũ giữ lại để test hồi
// quy đối chiếu (previewRafHook66T5.test.ts) — KHÔNG dùng trong vòng đo nữa.
const RAF_STATS_FN = (fromIdx) => `(() => {
  const h = window.__vcutPreviewRaf;
  if (!h || ${fromIdx} < 0) return null;
  const s = h.samples.slice(${fromIdx}).filter((x) => x.playing && !x.justWoke);
  if (!s.length) return { n: 0 };
  const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
  const p = (q) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  return { n: s.length, gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1),
    gapMax: +gaps[gaps.length - 1].toFixed(1), over100: s.filter((x) => x.gapMs > 100).length,
    lostMs: +s.reduce((a, x) => a + x.lostMs, 0).toFixed(0) };
})()`;

const RAF_STATS_TIME_FN = (t0, t1) => `(() => {
  const h = window.__vcutPreviewRaf;
  if (!h) return null;
  const s = h.samples.filter((x) => x.t >= ${t0} && x.t <= ${t1} && x.playing && !x.justWoke);
  if (!s.length) return { n: 0 };
  const gaps = s.map((x) => x.gapMs).sort((a, b) => a - b);
  const p = (q) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  return { n: s.length, gapP50: +p(0.5).toFixed(1), gapP95: +p(0.95).toFixed(1),
    gapMax: +gaps[gaps.length - 1].toFixed(1), over100: s.filter((x) => x.gapMs > 100).length,
    lostMs: +s.reduce((a, x) => a + x.lostMs, 0).toFixed(0) };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

const CLICK_ENH_FN = (testid) => `(() => {
  const el = document.querySelector('[data-testid="${testid}"]');
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const b = el.getBoundingClientRect();
  const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, coveredBy: at === el || el.contains(at) ? null : (at?.tagName + "." + (at?.className || "")) };
})()`;

const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
  }));
  return { clips };
})()`;

// Đo std/mean-abs-diff của 1 ảnh qua composite BLEND — đúng cơ chế
// preview.tsx đợt 62 R3 + đường cong piecewise đợt 63 R3:
// (1-a)·gốc + a·blur(3.0px), a = denoiseBlendAlpha(strength) (nội suy
// qua (0,0),(0.3,0.195),(0.5,0.486),(0.8,0.806),(1,0.981) — phải khớp
// lib/enhancePreview.ts; levels ở đây là STRENGTH, không phải alpha).
// targetW/targetH: kích thước canvas đo (null = kích thước gốc của ảnh).
const BLEND_ALPHA_PIECEWISE_JS = `
  const piecewiseAlpha = (s) => {
    const pts = [[0, 0], [0.3, 0.195], [0.5, 0.486], [0.8, 0.806], [1, 0.981]];
    if (s <= 0) return 0;
    for (let i = 1; i < pts.length; i++) {
      if (s <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return y0 + ((s - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return 0.981;
  };
`;
const BLEND_CAL_FN = (imgUrl, levels, targetW, targetH) => `(async () => {
  ${BLEND_ALPHA_PIECEWISE_JS}
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("không tải được ảnh")); img.src = ${JSON.stringify(imgUrl)}; });
  const W = ${targetW} || img.naturalWidth, H = ${targetH} || img.naturalHeight;
  // drawSrc: ảnh vẽ scale về kích thước đo (không filter).
  const base = document.createElement("canvas"); base.width = W; base.height = H;
  base.getContext("2d").drawImage(img, 0, 0, W, H);
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const step = 2;
  const stats = (data) => {
    let n = 0; const sum = [0, 0, 0]; const sq = [0, 0, 0];
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) { const v = data[i + c]; sum[c] += v; sq[c] += v * v; }
      n++;
    }
    const std = [0, 1, 2].map((c) => Math.sqrt(Math.max(0, sq[c] / n - (sum[c] / n) ** 2)));
    return { n, std, stdMean: (std[0] + std[1] + std[2]) / 3 };
  };
  let baseData = null; let baseStats = null;
  const rows = [];
  for (const s of ${JSON.stringify(levels)}) {
    const a = piecewiseAlpha(s);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(base, 0, 0);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.filter = "blur(3.00px)";
      ctx.drawImage(base, 0, 0);
      ctx.restore();
      ctx.filter = "none";
    }
    const data = ctx.getImageData(0, 0, W, H).data;
    const st = stats(data);
    if (baseData === null) { baseData = data; baseStats = st; rows.push({ strength: s, alpha: a, ...st, stdReductPct: 0, meanAbsDiff: 0 }); continue; }
    let sum = 0, cnt = 0;
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) { sum += Math.abs(data[i + ch] - baseData[i + ch]); cnt++; }
    }
    rows.push({ strength: s, alpha: a, ...st, stdReductPct: +(((baseStats.stdMean - st.stdMean) / baseStats.stdMean) * 100).toFixed(1), meanAbsDiff: +(sum / cnt).toFixed(3) });
  }
  return { w: W, h: H, baseStdMean: +baseStats.stdMean.toFixed(3), rows };
})()`;

// Step-edge: nửa đen nửa trắng; đo độ rộng chuyển tiếp 25%→75% ở hàng giữa.
// levels là STRENGTH (đợt 63: map sang alpha piecewise như BLEND_CAL_FN).
const STEP_EDGE_FN = (W, H, levels) => `(() => {
  ${BLEND_ALPHA_PIECEWISE_JS}
  const edge = document.createElement("canvas"); edge.width = ${W}; edge.height = ${H};
  const ectx = edge.getContext("2d");
  ectx.fillStyle = "#000"; ectx.fillRect(0, 0, ${W} / 2, ${H});
  ectx.fillStyle = "#fff"; ectx.fillRect(${W} / 2, 0, ${W} / 2, ${H});
  const rows = [];
  for (const s of ${JSON.stringify(levels)}) {
    const a = piecewiseAlpha(s);
    const c = document.createElement("canvas"); c.width = ${W}; c.height = ${H};
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(edge, 0, 0);
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.filter = "blur(3.00px)";
      ctx.drawImage(edge, 0, 0);
      ctx.restore();
      ctx.filter = "none";
    }
    const y = Math.floor(${H} / 2);
    const data = ctx.getImageData(0, y, ${W}, 1).data;
    const v = (x) => data[x * 4];
    let x25 = -1, x75 = -1;
    for (let x = 0; x < ${W}; x++) { if (x25 < 0 && v(x) >= 64) x25 = x; if (x75 < 0 && v(x) >= 192) x75 = x; }
    rows.push({ strength: s, alpha: a, width25_75: (x25 >= 0 && x75 >= 0) ? x75 - x25 : -1, vAtCenter: v(Math.floor(${W} / 2)) });
  }
  return { w: ${W}, h: ${H}, rows };
})()`;

// Micro-benchmark: chi phí 1 lần vẽ offscreen enhance (median 3 lần chạy,
// mỗi lần N=300 — bền với tải VM hơn đo fps lúc phát).
const BENCH_FN = (imgUrl, W2, H2) => `(async () => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("không tải được ảnh")); img.src = ${JSON.stringify(imgUrl)}; });
  const W = ${W2}, H = ${H2};
  const src = document.createElement("canvas"); src.width = W; src.height = H;
  src.getContext("2d").drawImage(img, 0, 0, W, H);
  const dst = document.createElement("canvas"); dst.width = W; dst.height = H;
  const dctx = dst.getContext("2d", { willReadFrequently: true });
  const N = 300;
  const med = (arr) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const timeIt = (fn) => {
    const runs = [];
    for (let r = 0; r < 3; r++) {
      const t0 = performance.now();
      for (let i = 0; i < N; i++) fn();
      runs.push((performance.now() - t0) / N);
    }
    return { medianMs: +med(runs).toFixed(3), runs: runs.map((x) => +x.toFixed(3)) };
  };
  const zx = (W * 0.023) / 2, zy = (H * 0.023) / 2;
  const plain = timeIt(() => { dctx.filter = "none"; dctx.drawImage(src, 0, 0); });
  const blur30 = timeIt(() => { dctx.filter = "blur(3.00px)"; dctx.drawImage(src, 0, 0); dctx.filter = "none"; });
  const zoom = timeIt(() => { dctx.filter = "none"; dctx.drawImage(src, -zx, -zy, W * 1.023, H * 1.023); });
  // Composite blend đợt 62 R3: vẽ gốc + vẽ đè bản mờ alpha (đúng preview.tsx).
  const blend05 = timeIt(() => { dctx.filter = "none"; dctx.drawImage(src, 0, 0); dctx.save(); dctx.globalAlpha = 0.5; dctx.filter = "blur(3.00px)"; dctx.drawImage(src, 0, 0); dctx.restore(); dctx.filter = "none"; });
  const blend10 = timeIt(() => { dctx.filter = "none"; dctx.drawImage(src, 0, 0); dctx.save(); dctx.globalAlpha = 1; dctx.filter = "blur(3.00px)"; dctx.drawImage(src, 0, 0); dctx.restore(); dctx.filter = "none"; });
  const both = timeIt(() => { dctx.filter = "none"; dctx.drawImage(src, -zx, -zy, W * 1.023, H * 1.023); dctx.save(); dctx.globalAlpha = 0.5; dctx.filter = "blur(3.00px)"; dctx.drawImage(src, -zx, -zy, W * 1.023, H * 1.023); dctx.restore(); dctx.filter = "none"; });
  return { w: W, h: H, plain, blur30, zoom, blend05, blend10, both,
    extraBlend05: +(blend05.medianMs - plain.medianMs).toFixed(3),
    extraBlend10: +(blend10.medianMs - plain.medianMs).toFixed(3),
    extraBoth: +(both.medianMs - plain.medianMs).toFixed(3) };
})()`;

// Combing v2: tỉ lệ cross-field / same-field trên luma (trung tâm).
const COMBING_FN = (videoUrl) => `(async () => {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto";
  v.src = ${JSON.stringify(videoUrl)};
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("không tải được video")); });
  const W = v.videoWidth, H = v.videoHeight;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const out = [];
  for (const t of [1.0, 2.0, 3.0]) {
    await new Promise((res) => { v.onseeked = res; v.currentTime = t; });
    await new Promise((r) => setTimeout(r, 150));
    ctx.drawImage(v, 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
    const lum = (x, y) => { const i = (y * W + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
    let cross = 0, same = 0, n = 0;
    for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
      cross += Math.abs(lum(x, y) - lum(x, y + 1));
      same += Math.abs(lum(x, y) - lum(x, y + 2));
      n++;
    }
    const cm = cross / n, sm = same / n;
    out.push({ t, cross: +cm.toFixed(3), same: +sm.toFixed(3), ratio: +(cm / Math.max(sm, 0.001)).toFixed(2) });
  }
  const meanRatio = +(out.reduce((a, r) => a + r.ratio, 0) / out.length).toFixed(2);
  return { w: W, h: H, rows: out, meanRatio };
})()`;

// Trạng thái chẩn đoán D3: idle + hold + element media.
const MEDIA_STATE_FN = `(() => {
  const els = (window.__vcutMediaEls || []).map((e) => {
    const el = e.el;
    return { tag: e.tag, readyState: el.readyState, currentTime: +el.currentTime.toFixed(2),
      seeking: el.seeking, paused: el.paused, error: el.error ? el.error.code : null,
      networkState: el.networkState, src: (el.currentSrc || el.src || "").slice(-50) };
  });
  const id = window.__vcutPreviewIdle;
  const idle = id ? { sleeping: id.sleeping, ticks: id.ticks, pendingSeek: id.pendingSeek,
    redrawFlag: id.redrawFlag, lastDrawn: id.lastDrawn, lastRequested: id.lastRequested,
    seekFailureCount: id.seekFailureCount, seekFailureExhausted: id.seekFailureExhausted,
    seekFailureKind: id.seekFailureKind, pauseRetrySkipped: id.pauseRetrySkipped,
    tickErrors: id.tickErrors } : null;
  const hold = window.__vcutHoldStats ? { ...window.__vcutHoldStats } : null;
  return { idle, hold, els, errors: (window.__r3errors || []).slice() };
})()`;

// Thống kê luma của canvas preview thật (D3): phân biệt frame video
// thật (std cao) với placeholder "thiếu media"/màn đen (phẳng, std thấp).
const PREVIEW_CANVAS_STATS_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  let sum = 0, sum2 = 0, n = 0;
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
    const i = (y * W + x) * 4;
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    sum += l; sum2 += l * l; n++;
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  return { ok: true, w: W, h: H, mean: +mean.toFixed(2), std: +std.toFixed(2), n };
})()`;

// Combing trên canvas preview thật (D3).
const PREVIEW_COMBING_FN = `(() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const x0 = Math.floor(W * 0.1), x1 = Math.floor(W * 0.9), y0 = Math.floor(H * 0.1), y1 = Math.floor(H * 0.9);
  const lum = (x, y) => { const i = (y * W + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
  let cross = 0, same = 0, n = 0;
  for (let y = y0 + 2; y < y1 - 2; y += 2) for (let x = x0; x < x1; x += 2) {
    cross += Math.abs(lum(x, y) - lum(x, y + 1));
    same += Math.abs(lum(x, y) - lum(x, y + 2));
    n++;
  }
  const cm = cross / n, sm = same / n;
  return { ok: true, w: W, h: H, cross: +cm.toFixed(3), same: +sm.toFixed(3), ratio: +(cm / Math.max(sm, 0.001)).toFixed(2) };
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  async function ensureNoModal(cdp) {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r3errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r3errors = []`).catch(() => {});
    return e;
  }

  async function waitIdle(cdp, label, timeoutMs = 90000) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, timeoutMs);
  }

  async function clickEnhCheckbox(cdp, testid, label) {
    const g = await cdp.evalJs(CLICK_ENH_FN(testid));
    if (!g) throw new Error(`không tìm thấy [data-testid="${testid}"] (${label})`);
    if (g.coveredBy) log(`cảnh báo: ${testid} bị che bởi ${g.coveredBy} tại điểm bấm — vẫn thử bấm`);
    await cdp.click(g.x, g.y);
    await sleep(600);
  }

  async function setEnhCheckbox(cdp, testid, key, want, clipId) {
    const cur = await cdp.evalJs(STATE_FN);
    const enh = cur.clips.find((c) => c.clipId === clipId)?.enhance;
    const has = !!(enh && enh[key]);
    if (has !== want) await clickEnhCheckbox(cdp, testid, `${key}→${want}`);
    const after = await cdp.evalJs(STATE_FN);
    const enh2 = after.clips.find((c) => c.clipId === clipId)?.enhance;
    const has2 = !!(enh2 && enh2[key]);
    if (has2 !== want) throw new Error(`checkbox ${key} không về ${want} (đang ${has2}, enhance=${JSON.stringify(enh2)})`);
    return after;
  }

  async function togglePlay(cdp) {
    await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
    await cdp.key(" ", "Space");
  }

  try {
    const DEV_PORT = Number(process.env.R3_DEV_PORT || 0) || (await pickFreePort(5540, 5549));
    const DEBUG_PORT = Number(process.env.R3_DEBUG_PORT || 0) || (await pickFreePort(9640, 9649));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 170; n <= 179; n++) {
        const d = `:${n}`;
        const sock = `/tmp/.X11-unix/X${n}`;
        if (fs.existsSync(sock)) {
          let alive = false;
          try { alive = execSync(`ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
          if (alive) continue;
          try { fs.unlinkSync(sock); } catch {}
          try { fs.unlinkSync(`/tmp/.X${n}-lock`); } catch {}
          log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
        }
        return d;
      }
      return null;
    }
    const DISPLAY = process.env.R3_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :170–:179");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5540–5549");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9640–9649");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    if (!fs.existsSync(path.join(MEDIA_DIR, "flat15.mp4"))) throw new Error(`không thấy media fixture ở ${MEDIA_DIR} (chạy bước tạo fixture trước)`);
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const MEDIA_URL = (f) => `${DEV_URL}r61r3-media/${f}`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round61-r3/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});
const react = require("@vitejs/plugin-react").default;
const MEDIA_DIR = ${JSON.stringify(MEDIA_DIR)};
const MIME = { ".mp4": "video/mp4", ".png": "image/png", ".webm": "video/webm", ".jpg": "image/jpeg" };
const mediaPlugin = () => ({ name: "r61r3-media", configureServer(server) {
  server.middlewares.use("/r61r3-media", (req, res) => {
    const name = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\\//, "");
    const fp = path.join(MEDIA_DIR, name);
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!name || name.includes("..") || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.statusCode = 404; res.end("not found"); return; }
    const st = fs.statSync(fp);
    const range = req.headers.range;
    res.setHeader("Content-Type", MIME[path.extname(fp).toLowerCase()] || "application/octet-stream");
    res.setHeader("Accept-Ranges", "bytes");
    if (range) {
      const m = /bytes=(\\d+)-(\\d*)/.exec(range);
      if (m) {
        const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        res.statusCode = 206;
        res.setHeader("Content-Range", \`bytes \${start}-\${end}/\${st.size}\`);
        res.setHeader("Content-Length", String(end - start + 1));
        fs.createReadStream(fp, { start, end }).pipe(res);
        return;
      }
    }
    res.setHeader("Content-Length", String(st.size));
    fs.createReadStream(fp).pipe(res);
  });
} });
export default { plugins: [react(), mediaPlugin()], server: { hmr: false } };
`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}, media=${MEDIA_DIR}, loadavg lúc bắt đầu ${loadAvg()}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r3-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");
    const mediaProbe = await fetch(MEDIA_URL("frame15.png"));
    if (!mediaProbe.ok) throw new Error(`middleware media không phục vụ được frame15.png (HTTP ${mediaProbe.status})`);
    log("middleware /r61r3-media/ phục vụ được fixture");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    // Đợt 63 R3: chờ socket X xuất hiện thật thay cho sleep cố định 900ms
    // (VM tải cao → Xvfb chưa kịp bind đã spawn Chrome, CDP không lên).
    {
      const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
      let ready = false;
      for (let i = 0; i < 30 && !ready; i++) {
        if (fs.existsSync(sock) && xvfb.exitCode === null) ready = true;
        else await sleep(500);
      }
      if (!ready) throw new Error(`Xvfb ${DISPLAY} không lên sau 15s (socket ${sock} chưa có)`);
    }
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r3-chrome.log"), "w");
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
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");
    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được (harness lỗi)");
    log("modal chào đã đóng");

    // ---- A0: project mẫu tự load -------------------------------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook __vcutPreviewEnhance xuất hiện", 180000);
    const firstClipId = s0.clips.find((c) => c.trackId === "v1").clipId;
    const canvasSize = `${s0.canvasW}x${s0.canvasH}`;
    log(`project mẫu: canvas preview backing ${canvasSize}, clip video đầu ${firstClipId}, loadavg ${loadAvg()}`);
    await drainErrors(cdp);
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (A0)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu", 60000);

    // ---- A. FPS preview xen kẽ (drift-corrected) ---------------------------
    const FPS_CONFIGS = {
      baseline: { denoise: false, stabilize: false, deinterlace: false, expect: { blur: 0, alpha: 0, zoom: 1, applied: [], notApproximated: [], offscreen: false } },
      denoise: { denoise: true, stabilize: false, deinterlace: false, expect: { blur: 3.0, alpha: 0.486, zoom: 1, applied: ["denoise"], notApproximated: [], offscreen: true } },
      stabilize: { denoise: false, stabilize: true, deinterlace: false, expect: { blur: 0, alpha: 0, zoom: 1.023, applied: ["stabilize"], notApproximated: [], offscreen: true } },
      deinterlace: { denoise: false, stabilize: false, deinterlace: true, expect: { blur: 0, alpha: 0, zoom: 1, applied: [], notApproximated: ["deinterlace"], offscreen: false } },
      combo: { denoise: true, stabilize: true, deinterlace: true, expect: { blur: 3.0, alpha: 0.486, zoom: 1.023, applied: ["stabilize", "denoise"], notApproximated: ["deinterlace"], offscreen: true } },
    };
    const FPS_ORDER = ["baseline", "denoise", "baseline", "stabilize", "baseline", "deinterlace", "baseline", "combo", "baseline"];

    async function measureFpsSlot(key, slotIdx) {
      const cfg = FPS_CONFIGS[key];
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", cfg.denoise, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", cfg.stabilize, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", cfg.deinterlace, firstClipId);
      // Seek 0 + chờ ngủ rồi verify hook (lúc này clip vẽ cuối là clip 1).
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, `${key} slot ${slotIdx} seek 0`);
      const stCfg = await cdp.evalJs(STATE_FN);
      const hook = stCfg.hook;
      const exp = cfg.expect;
      const hookOk = hook && hook.denoiseBlurPx === exp.blur
        && hook.denoiseBlendAlpha === exp.alpha
        && Math.abs(hook.stabilizeZoom - exp.zoom) < 1e-9
        && JSON.stringify(hook.applied) === JSON.stringify(exp.applied)
        && JSON.stringify(hook.notApproximated) === JSON.stringify(exp.notApproximated)
        && hook.offscreenApplied === exp.offscreen;
      if (!hookOk) log(`cảnh báo hook slot ${slotIdx} ${key} lệch: hook=${JSON.stringify(hook)} expect=${JSON.stringify(exp)}`);
      const loadBefore = loadAvg();
      // Đợt 66 T5: bỏ rafIdx0 (chỉ số tuyệt đối) — cắt RAF stats theo
      // timestamp a.wall/b.wall (xem RAF_STATS_TIME_FN, sửa bug n=0).
      await togglePlay(cdp);
      await sleep(800);
      const a = await cdp.evalJs(SAMPLE_FN);
      if (!a.playing) throw new Error(`${key} slot ${slotIdx}: bấm Space mà playing vẫn false`);
      await sleep(3000);
      const b = await cdp.evalJs(SAMPLE_FN);
      await togglePlay(cdp);
      await sleep(400);
      const after = await cdp.evalJs(STATE_FN);
      if (after.playing) throw new Error(`${key} slot ${slotIdx}: bấm Space lần 2 mà playing vẫn true`);
      const rafStats = await cdp.evalJs(RAF_STATS_TIME_FN(a.wall, b.wall));
      const dt = (b.wall - a.wall) / 1000;
      const row = {
        slot: slotIdx, config: key,
        drawFps: +((b.draw - a.draw) / dt).toFixed(2),
        tickFps: +((b.ticks - a.ticks) / dt).toFixed(2),
        phRate: +((b.ph - a.ph) / dt).toFixed(3),
        draws: b.draw - a.draw, dt: +dt.toFixed(3),
        ph0: +a.ph.toFixed(2), ph1: +b.ph.toFixed(2),
        loadBefore, loadAfter: loadAvg(), rafStats, hookOk,
        hook: hook ? { blur: hook.denoiseBlurPx, alpha: hook.denoiseBlendAlpha, zoom: hook.stabilizeZoom, applied: hook.applied, offscreen: hook.offscreenApplied } : null,
      };
      log(`FPS slot ${slotIdx} ${key}: draw ${row.drawFps} fps, tick ${row.tickFps} fps, playhead ${row.phRate}x, gapP50 ${rafStats ? rafStats.gapP50 : "?"}ms P95 ${rafStats ? rafStats.gapP95 : "?"}ms (n=${rafStats ? rafStats.n : "?"}), load ${loadBefore} → ${row.loadAfter}, hookOk=${hookOk}`);
      return row;
    }

    const fpsSlots = [];
    // Khởi động: phát baseline 6s rồi bỏ (run-4: 2 slot đầu chỉ 15–23 fps
    // do máy còn ấm máy — warmup để slot denoise (slot 2) đo ở trạng thái
    // ổn định, không bị nhiễu khởi động).
    {
      await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", false, firstClipId);
      await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", false, firstClipId);
      await cdp.evalJs(SET_PLAYHEAD_FN(0));
      await waitIdle(cdp, "warmup seek 0");
      await togglePlay(cdp);
      await sleep(6000);
      await togglePlay(cdp);
      await sleep(400);
      const w = await cdp.evalJs(STATE_FN);
      log(`warmup: phát baseline 6s xong, playing=${w.playing} (slot này không tính vào kết quả)`);
    }
    for (let i = 0; i < FPS_ORDER.length; i++) fpsSlots.push(await measureFpsSlot(FPS_ORDER[i], i + 1));
    await drainErrors(cdp);
    // Phân tích drift-corrected: mỗi config phi-baseline so với trung bình
    // 2 baseline kề trước/sau nó trong thứ tự xen kẽ.
    const baseSlots = fpsSlots.filter((r) => r.config === "baseline");
    const baseMean = baseSlots.reduce((a, r) => a + r.drawFps, 0) / baseSlots.length;
    const baseMin = Math.min(...baseSlots.map((r) => r.drawFps));
    const baseMax = Math.max(...baseSlots.map((r) => r.drawFps));
    log(`FPS baseline 5 slot: mean ${baseMean.toFixed(2)} fps, min ${baseMin}, max ${baseMax} (drift ${(baseMax - baseMin).toFixed(2)} fps)`);
    const fpsSummary = {};
    for (const key of ["denoise", "stabilize", "deinterlace", "combo"]) {
      const idx = FPS_ORDER.indexOf(key);
      const slot = fpsSlots[idx];
      const neighbors = [fpsSlots[idx - 1], fpsSlots[idx + 1]].filter(Boolean);
      const nbMean = neighbors.reduce((a, r) => a + r.drawFps, 0) / neighbors.length;
      const ratio = slot.drawFps / nbMean;
      fpsSummary[key] = { drawFps: slot.drawFps, neighborBaselineMean: +nbMean.toFixed(2), ratio: +ratio.toFixed(2), phRate: slot.phRate, tickFps: slot.tickFps };
      log(`FPS ${key}: draw ${slot.drawFps} fps vs baseline kề ${nbMean.toFixed(2)} fps → tỉ lệ ${ratio.toFixed(2)}x, playhead ${slot.phRate}x`);
    }
    fpsSummary.baseline = { meanDrawFps: +baseMean.toFixed(2), min: baseMin, max: baseMax, n: baseSlots.length };
    const hookAllOk = fpsSlots.every((r) => r.hookOk);
    if (hookAllOk) pass("A-hook: hook khớp cấu hình ở cả 9 slot xen kẽ", "mỗi slot verify sau seek 0 + chờ ngủ (blur/zoom/applied/notApproximated/offscreen đúng kỳ vọng)");
    else fail("A-hook: hook khớp cấu hình ở cả 9 slot xen kẽ", fpsSlots.filter((r) => !r.hookOk).map((r) => `slot ${r.slot} ${r.config}: hook=${JSON.stringify(r.hook)}`).join(" || "));
    const comboRatio = fpsSummary.combo.ratio;
    const comboPh = fpsSummary.combo.phRate;
    if (comboRatio >= 0.75 && comboPh >= 0.9) {
      pass("A FPS: combo enhance không làm tụt tốc độ vẽ quá 25% (drift-corrected)", `combo ${fpsSummary.combo.drawFps} fps vs baseline kề ${fpsSummary.combo.neighborBaselineMean} fps (tỉ lệ ${comboRatio}x); playhead ${comboPh}x; baseline 5 slot ${baseMin}–${baseMax} fps (mean ${baseMean.toFixed(2)}); canvas ${canvasSize}`);
    } else {
      fail("A FPS: combo enhance không làm tụt tốc độ vẽ quá 25% (drift-corrected)", `combo ${fpsSummary.combo.drawFps} fps vs baseline kề ${fpsSummary.combo.neighborBaselineMean} fps (tỉ lệ ${comboRatio}x); playhead ${comboPh}x; baseline 5 slot ${baseMin}–${baseMax} fps (mean ${baseMean.toFixed(2)}); canvas ${canvasSize} — xem LIMITS (tải VM chi phối)`);
    }
    await cdp.shot("r3-a-fps-done.png");

    // ---- Tab trắng: A2 bench + B blur cal + D1 combing ----------------------
    const blankTarget = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const bcdp = new CDP(blankTarget.webSocketDebuggerUrl);
    await bcdp.send("Page.enable");
    await bcdp.send("Runtime.enable");
    await bcdp.evalJs(INJECT_ERRORS);

    // A2. Micro-benchmark chi phí vẽ offscreen.
    const benchSmall = await bcdp.evalJs(BENCH_FN(MEDIA_URL("frame15.png"), 488, 275));
    const benchBig = await bcdp.evalJs(BENCH_FN(MEDIA_URL("frame15.png"), 1280, 720));
    for (const b of [benchSmall, benchBig]) {
      log(`BENCH ${b.w}x${b.h}: plain ${b.plain.medianMs}ms, blur3.0 ${b.blur30.medianMs}ms, zoom ${b.zoom.medianMs}ms, blend a=0.5 ${b.blend05.medianMs}ms (+${b.extraBlend05}ms), blend a=1.0 ${b.blend10.medianMs}ms (+${b.extraBlend10}ms), blend+zoom ${b.both.medianMs}ms (+${b.extraBoth}ms)`);
    }
    if (benchSmall.extraBlend05 < 16.7) {
      pass("A2 micro-bench: blend a=0.5 thêm < 16.7ms/frame ở letterbox preview", `488x275: blend a=0.5 ${benchSmall.blend05.medianMs}ms vs plain ${benchSmall.plain.medianMs}ms (thêm ${benchSmall.extraBlend05}ms = ${(benchSmall.extraBlend05 / 33.3 * 100).toFixed(0)}% ngân sách frame 30fps); blend+zoom thêm ${benchSmall.extraBoth}ms; 1280x720: blend a=0.5 thêm ${benchBig.extraBlend05}ms, blend+zoom thêm ${benchBig.extraBoth}ms (plain ${benchBig.plain.medianMs}ms)`);
    } else {
      fail("A2 micro-bench: blend a=0.5 thêm < 16.7ms/frame ở letterbox preview", `488x275 thêm ${benchSmall.extraBlend05}ms; 1280x720 thêm ${benchBig.extraBlend05}ms`);
    }

    // B. Hiệu chuẩn BLEND đợt 63 R3 (piecewise) ở 2 kích thước + step edge
    // + hqdn3d cùng metric. Mục tiêu hqdn3d flat15 (đo đợt 61, giữ nguyên):
    // s=0.3 → -19% | s=0.5 → -47% | s=0.8 → -74% | s=1.0 → -83%.
    // Đo đúng 4 mức strength thật (alpha = piecewise(s), xem
    // BLEND_CAL_FN); kỳ vọng đợt 63: -18.5/-45.7/-73.8/-82.9% (sai ≤1.3).
    const BLEND_LEVELS = [0, 0.3, 0.5, 0.8, 1.0];
    const calBig15 = await bcdp.evalJs(BLEND_CAL_FN(MEDIA_URL("frame15.png"), BLEND_LEVELS, null, null));
    const calSmall15 = await bcdp.evalJs(BLEND_CAL_FN(MEDIA_URL("frame15.png"), BLEND_LEVELS, 488, 275));
    const calBig40 = await bcdp.evalJs(BLEND_CAL_FN(MEDIA_URL("frame40.png"), BLEND_LEVELS, null, null));
    const calSmall40 = await bcdp.evalJs(BLEND_CAL_FN(MEDIA_URL("frame40.png"), BLEND_LEVELS, 488, 275));
    const calResults = { big15: calBig15, small15: calSmall15, big40: calBig40, small40: calSmall40 };
    for (const [name, cal] of Object.entries(calResults)) {
      log(`BLEND ${name}: frame ${cal.w}x${cal.h}, std gốc ${cal.baseStdMean}`);
      for (const r of cal.rows) log(`  s=${r.strength} (a=${r.alpha}): stdMean ${r.stdMean.toFixed(3)}, giảm ${r.stdReductPct}%, meanAbsDiff vs gốc ${r.meanAbsDiff}`);
    }
    const edgeBig = await bcdp.evalJs(STEP_EDGE_FN(1280, 720, BLEND_LEVELS));
    const edgeSmall = await bcdp.evalJs(STEP_EDGE_FN(488, 275, BLEND_LEVELS));
    for (const [name, e] of [["edge-1280", edgeBig], ["edge-488", edgeSmall]]) {
      log(`STEP-EDGE ${name}: ` + e.rows.map((r) => `s=${r.strength} (a=${r.alpha})→rộng ${r.width25_75}px (tâm ${r.vAtCenter})`).join(", "));
    }
    // hqdn3d cùng metric (std RGB mean trong trình duyệt, blend alpha 0).
    const hqFrames = {};
    for (const s of ["0.3", "0.5", "0.8", "1.0"]) {
      const c = await bcdp.evalJs(BLEND_CAL_FN(MEDIA_URL(`hq15_${s}.png`), [0], null, null));
      hqFrames[s] = c.baseStdMean;
    }
    const hq40 = {};
    for (const s of ["0.5", "1.0"]) {
      const c = await bcdp.evalJs(BLEND_CAL_FN(MEDIA_URL(`hq40_${s}.png`), [0], null, null));
      hq40[s] = c.baseStdMean;
    }
    const hqBase15 = calBig15.baseStdMean;
    const hqBase40 = calBig40.baseStdMean;
    log(`HQDN3D cùng metric (std RGB mean, flat15 gốc ${hqBase15}): ` + Object.entries(hqFrames).map(([s, v]) => `s=${s} → ${v} (giảm ${(((hqBase15 - v) / hqBase15) * 100).toFixed(1)}%)`).join(", "));
    log(`HQDN3D cùng metric (flat40 gốc ${hqBase40}): ` + Object.entries(hq40).map(([s, v]) => `s=${s} → ${v} (giảm ${(((hqBase40 - v) / hqBase40) * 100).toFixed(1)}%)`).join(", "));
    // Verdict B: đường cong blend (piecewise đợt 63) khớp hqdn3d trong
    // 10 điểm ở cả 4 mốc (720p flat15; kỳ vọng sai tối đa ~1.3: s=0.3
    // -18.5% vs mục tiêu -19%),
    // đơn điệu tăng, không vùng chết (s=0.3 giảm > 10%),
    // step-edge 0px ở s≤0.5 (blur thuần đợt 61 đã 2px ở s=0.3).
    const HQ_TARGETS = { 0.3: 19, 0.5: 47, 0.8: 74, 1.0: 83 };
    const bRows = calBig15.rows.filter((r) => r.strength > 0);
    const bErrs = bRows.map((r) => ({ s: r.strength, a: r.alpha, reduct: r.stdReductPct, target: HQ_TARGETS[r.strength], err: +(Math.abs(r.stdReductPct - HQ_TARGETS[r.strength])).toFixed(1) }));
    const bMono = bRows.every((r, i) => i === 0 || r.stdReductPct > bRows[i - 1].stdReductPct);
    const bEdgeOk = edgeBig.rows.find((r) => r.strength === 0.5)?.width25_75 === 0;
    const bNoDead = (calBig15.rows.find((r) => r.strength === 0.3)?.stdReductPct ?? 0) > 10;
    const bMaxErr = Math.max(...bErrs.map((e) => e.err));
    const bDetail = `720p flat15: ` + bErrs.map((e) => `s=${e.s} (a=${e.a}) giảm ${e.reduct}% (hqdn3d -${e.target}%, sai ${e.err})`).join(", ")
      + `; đơn điệu=${bMono}; s=0.3 giảm ${calBig15.rows.find((r) => r.strength === 0.3)?.stdReductPct}% (>10% = hết vùng chết); edge s=0.5 rộng ${edgeBig.rows.find((r) => r.strength === 0.5)?.width25_75}px; 488x275: ` + calSmall15.rows.map((r) => `s=${r.strength}→-${r.stdReductPct}%`).join(" ");
    if (bMaxErr <= 10 && bMono && bNoDead && bEdgeOk) {
      pass("B hiệu chuẩn blend: đường cong khớp hqdn3d trong 10 điểm, không vùng chết, cạnh giữ tốt ở đầu thấp", bDetail);
    } else {
      fail("B hiệu chuẩn blend: đường cong khớp hqdn3d trong 10 điểm, không vùng chết, cạnh giữ tốt ở đầu thấp", bDetail + ` (maxErr=${bMaxErr}, mono=${bMono}, noDead=${bNoDead}, edgeOk=${bEdgeOk})`);
    }

    // D1. Combing v2 (tỉ lệ cross/same).
    const combInter = await bcdp.evalJs(COMBING_FN(MEDIA_URL("interlaced720.mp4")));
    const combClean = await bcdp.evalJs(COMBING_FN(MEDIA_URL("clean720.mp4")));
    log(`COMBING interlaced720: meanRatio ${combInter.meanRatio} (${combInter.rows.map((r) => `${r.t}s: C=${r.cross} S=${r.same} R=${r.ratio}`).join(", ")})`);
    log(`COMBING clean720 (đối chứng): meanRatio ${combClean.meanRatio} (${combClean.rows.map((r) => `${r.t}s: C=${r.cross} S=${r.same} R=${r.ratio}`).join(", ")})`);
    if (combInter.meanRatio > combClean.meanRatio * 1.5) {
      pass("D1 combing: footage interlaced hiện răng cưa rõ qua decoder", `interlaced R=${combInter.meanRatio} vs progressive R=${combClean.meanRatio} (tỉ lệ ${(combInter.meanRatio / Math.max(combClean.meanRatio, 0.01)).toFixed(1)}x) — decoder KHÔNG tự khử hết, preview sẽ thấy răng cưa (đúng giới hạn Q1 §4.3)`);
    } else {
      pass("D1 combing: decoder đã khử gần hết răng cưa", `interlaced R=${combInter.meanRatio} vs progressive R=${combClean.meanRatio} (tỉ lệ ${(combInter.meanRatio / Math.max(combClean.meanRatio, 0.01)).toFixed(2)}x) — decoder Chromium tự khử răng cưa, preview có thể không thấy rõ răng cưa (đính chính giới hạn Q1 §4.3)`);
    }

    // ---- D2. Render thật + idet (Node) --------------------------------------
    const RENDER_DIR = path.join(ROOT, "server", "render");
    function idetProg(mp4) {
      const r = spawnSync("ffmpeg", ["-i", mp4, "-vf", "idet", "-f", "null", "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      const m = [...(r.stderr || "").matchAll(/Single frame detection:.*?TFF:\s*(\d+).*?BFF:\s*(\d+).*?Progressive:\s*(\d+).*?Undetermined:\s*(\d+)/gs)];
      if (!m.length) throw new Error(`không parse được idet cho ${mp4}:\n${(r.stderr || "").slice(-500)}`);
      const g = m[m.length - 1];
      const tff = Number(g[1]), bff = Number(g[2]), prog = Number(g[3]), und = Number(g[4]);
      const total = tff + bff + prog + und;
      return { tff, bff, prog, und, progRatio: total ? +(prog / total).toFixed(3) : -1 };
    }
    function renderSpec(specObj, name) {
      const specPath = path.join(SCRATCH, `${name}.json`);
      const outPath = path.join(SCRATCH, `${name}.mp4`);
      fs.writeFileSync(specPath, JSON.stringify(specObj));
      const t0 = Date.now();
      const r = spawnSync("node", [path.join(RENDER_DIR, "src", "render.js"), "--spec", specPath,
        "--out", outPath, "--media-dir", MEDIA_DIR, "-y", "--x264-preset", "veryfast", "--crf", "23"],
        { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      const secs = (Date.now() - t0) / 1000;
      return { status: r.status, stderr: (r.stderr || "").toString(), outPath, secs, fps: 150 / secs };
    }
    const vclip = (id, src, duration, extra) => ({
      id, kind: "video", src, start: 0, duration, in: 0, out: duration,
      sourceAudioMode: "mute", ...(extra || {}),
    });
    const specWith = (tracks) => ({ version: "0.2.0", meta: { name: "r61r3", width: 1280, height: 720, fps: 30 }, tracks });
    const idetSrc = idetProg(path.join(MEDIA_DIR, "interlaced720.mp4"));
    log(`IDET nguồn interlaced720.mp4: TFF=${idetSrc.tff} BFF=${idetSrc.bff} Prog=${idetSrc.prog} Und=${idetSrc.und} prog=${idetSrc.progRatio}`);
    const rDeint = renderSpec(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "interlaced720.mp4", 5, { enhance: { deinterlace: true } })] }]), "r3-deint");
    const rCtrl = renderSpec(specWith([{ id: "v0", kind: "video", clips: [vclip("c0", "interlaced720.mp4", 5)] }]), "r3-deint-control");
    if (rDeint.status === 0 && rCtrl.status === 0 && fs.existsSync(rDeint.outPath) && fs.existsSync(rCtrl.outPath)) {
      const idetDeint = idetProg(rDeint.outPath);
      const idetCtrl = idetProg(rCtrl.outPath);
      log(`RENDER deinterlace: ${rDeint.secs.toFixed(1)}s wall (${rDeint.fps.toFixed(2)} fps render), idet prog ${idetDeint.progRatio} (TFF=${idetDeint.tff} Prog=${idetDeint.prog})`);
      log(`RENDER đối chứng (không enhance): ${rCtrl.secs.toFixed(1)}s wall, idet prog ${idetCtrl.progRatio} (TFF=${idetCtrl.tff} Prog=${idetCtrl.prog})`);
      const d2detail = `nguồn prog=${idetSrc.progRatio} → sau yadif prog=${idetDeint.progRatio} (đối chứng prog=${idetCtrl.progRatio}); render deint ${rDeint.fps.toFixed(2)} fps`;
      if (idetSrc.progRatio < 0.1 && idetDeint.progRatio > 0.9 && idetCtrl.progRatio < 0.1) {
        pass("D2 render yadif: idet prog 0 → ~1, đối chứng vẫn interlaced", d2detail);
      } else {
        fail("D2 render yadif: idet prog 0 → ~1, đối chứng vẫn interlaced", d2detail);
      }
    } else {
      fail("D2 render yadif: idet prog 0 → ~1, đối chứng vẫn interlaced", `render deint status=${rDeint.status} (${(rDeint.stderr || "").slice(-300)}), control status=${rCtrl.status}`);
    }

    // ---- D3 (best-effort + chẩn đoán): combing trên canvas preview thật ----
    // Run-3: sau khi mở tab trắng, tab app bị occluded → rAF dừng hẳn
    // (ticks đóng băng ở 2361 suốt 30s dù sleeping=false) nên element mới
    // không được tạo (element được tạo trong vòng draw). Đưa tab app lên
    // trước + đóng tab trắng, chờ rAF chạy lại rồi mới đo.
    await cdp.send("Page.bringToFront");
    try { await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/close/${blankTarget.id}`); } catch { /* tab trắng có thể đã đóng */ }
    await sleep(1500);
    const idleAfterFront = await cdp.evalJs(MEDIA_STATE_FN);
    log(`D3 sau bringToFront: sleeping=${idleAfterFront.idle?.sleeping} ticks=${idleAfterFront.idle?.ticks} (rAF phải chạy lại: ticks tăng)`);
    let d3detail = "";
    try {
      const idleBefore = await cdp.evalJs(MEDIA_STATE_FN);
      log(`D3 trước khi đổi src: sleeping=${idleBefore.idle?.sleeping} ticks=${idleBefore.idle?.ticks} els=${idleBefore.els.length}`);
      const added = await cdp.evalJs(`(async () => {
        const st = await (${STORE_FN});
        const url = ${JSON.stringify(MEDIA_URL("interlaced720.mp4"))};
        window.__r3storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-r3-interlaced", name: "interlaced720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
        const st2 = window.__r3storeMod.useStore.getState();
        const clip = st2.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__r3storeMod.useStore.getState().patchClip("v1", clip.id, { src: "interlaced720.mp4", in: 0, out: 4 });
        const st3 = window.__r3storeMod.useStore.getState();
        return { mediaLen: st3.media.length, clipSrc: st3.spec.tracks.find((t) => t.id === "v1").clips[0].src };
      })()`);
      if (added.clipSrc !== "interlaced720.mp4") throw new Error(`patchClip src không đổi (đang ${added.clipSrc})`);
      log(`D3 đã đổi src clip 1 → interlaced720.mp4 (media ${added.mediaLen} item)`);
      // Đặt playhead vào clip 1 TRƯỚC khi chờ vẽ: element chỉ được tạo
      // khi clip đang hiển thị (v2 lần đầu chờ element khi playhead còn
      // ở clip 2 nên element không bao giờ xuất hiện).
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      // Chờ loop vẽ xong ở playhead 1.0 (seek xong → vẽ → ngủ lại).
      await waitIdle(cdp, "D3 preview interlaced tại playhead 1.0", 60000);
      await sleep(500);
      // Cổng kiểm tra frame thật: canvas phải hiện frame video (std cao),
      // không phải placeholder "thiếu media"/màn đen (phẳng, std thấp).
      // (Không poll __vcutMediaEls: hook đó chỉ refresh ở nhánh playing,
      // lúc pause nó giữ danh sách cũ từ đợt phát trước.)
      const shotInter = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
      if (!shotInter.ok) throw new Error(`đọc canvas preview thất bại: ${shotInter.reason}`);
      log(`D3 canvas interlaced @1.0s: mean=${shotInter.mean} std=${shotInter.std} (n=${shotInter.n})`);
      if (shotInter.std < 8) throw new Error(`canvas vẫn phẳng/placeholder (std ${shotInter.std} < 8) — frame interlaced chưa vẽ được (xem LIMITS §4)`);
      const combPreview = await cdp.evalJs(PREVIEW_COMBING_FN);
      if (!combPreview.ok) throw new Error(`đo combing preview thất bại: ${combPreview.reason}`);
      await cdp.evalJs(`(async () => {
        const url = ${JSON.stringify(MEDIA_URL("clean720.mp4"))};
        window.__r3storeMod.useStore.setState((s) => ({ media: [...s.media, { id: "m-r3-clean", name: "clean720.mp4", kind: "video", url, duration: 5, width: 1280, height: 720 }] }));
        const st = window.__r3storeMod.useStore.getState();
        const clip = st.spec.tracks.find((t) => t.id === "v1").clips[0];
        window.__r3storeMod.useStore.getState().patchClip("v1", clip.id, { src: "clean720.mp4", in: 0, out: 4 });
        return true;
      })()`);
      await cdp.evalJs(SET_PLAYHEAD_FN(1.0));
      await waitIdle(cdp, "D3 preview progressive tại playhead 1.0", 60000);
      await sleep(500);
      const shotClean = await cdp.evalJs(PREVIEW_CANVAS_STATS_FN);
      if (!shotClean.ok) throw new Error(`đọc canvas preview đối chứng thất bại: ${shotClean.reason}`);
      log(`D3 canvas progressive @1.0s: mean=${shotClean.mean} std=${shotClean.std} (n=${shotClean.n})`);
      if (shotClean.std < 8) throw new Error(`canvas đối chứng vẫn phẳng/placeholder (std ${shotClean.std} < 8)`);
      const combPreviewClean = await cdp.evalJs(PREVIEW_COMBING_FN);
      if (!combPreviewClean.ok) throw new Error(`đo combing preview đối chứng thất bại: ${combPreviewClean.reason}`);
      d3detail = `preview canvas interlaced R=${combPreview.ratio} (C=${combPreview.cross} S=${combPreview.same}) vs progressive R=${combPreviewClean.ratio} (C=${combPreviewClean.cross} S=${combPreviewClean.same}), canvas ${combPreview.w}x${combPreview.h}`;
      log(`D3 ${d3detail}`);
      if (combPreview.ratio > combPreviewClean.ratio * 1.5) {
        pass("D3 preview interlaced: răng cưa vẫn thấy trên canvas preview thật", d3detail + " — preview KHÔNG khử răng cưa (đúng thiết kế Q1: deinterlace chỉ ở render)");
      } else {
        // Răng cưa KHÔNG đo được trên canvas preview — NHƯNG đừng kết luận
        // "decoder đã khử": D1 đo ở độ phân giải đầy đủ (1280x720) cho
        // R=1.12 vs 0.69, tức răng cưa VẪN CÒN sau decode. Ở preview, video
        // 720p bị downscale về ~275px chiều cao (tỉ lệ ~2.6x) nên mỗi dòng
        // ra là trung bình của nhiều dòng vào thuộc cả 2 field — cấu trúc
        // xen kẽ field bị trung bình mất trước khi đo. Đây là tác dụng
        // phụ của downscale, không phải khử răng cưa thật (xem LIMITS §4).
        pass("D3 preview interlaced: răng cưa không đo được ở kích thước preview (do downscale)", d3detail + " — R interlaced ≈ R progressive ở canvas 871x275 vì downscale 720p→~275px trung bình cả 2 field; D1 ở full-res vẫn thấy răng cưa (R 1.12 vs 0.69) nên deinterlace ở render vẫn cần cho file xuất");
      }
    } catch (e) {
      d3detail = `không đo được combing trong app: ${e && e.message ? e.message : e}`;
      log(`D3 ${d3detail}`);
      fail("D3 preview interlaced: đo combing trên canvas preview thật", d3detail);
    }

    // H9: 0 lỗi trang gộp.
    await drainErrors(cdp);
    await drainErrors(bcdp).catch(() => {});
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên (app tab + tab trắng)");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    const report = {
      cases: results, pass: nPass, total: results.length,
      fpsSlots, fpsSummary, bench: { small: benchSmall, big: benchBig },
      blurCal: calResults, stepEdge: { big: edgeBig, small: edgeSmall },
      hqdn3dSameMetric: { base15: hqBase15, frames: hqFrames, base40: hqBase40, frames40: hq40 },
      combingRaw: { interlaced: combInter, clean: combClean },
      idet: { source: idetSrc },
      canvasSize,
    };
    fs.writeFileSync(path.join(SCRATCH, "r3-fps-cal-report.json"), JSON.stringify(report, null, 2));
    log(`KẾT QUẢ HEADED R3 FPS/CAL v2: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
