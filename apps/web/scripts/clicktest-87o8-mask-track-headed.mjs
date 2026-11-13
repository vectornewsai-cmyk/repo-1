#!/usr/bin/env node
/**
 * clicktest-87o8-mask-track-headed.mjs — Phase 9 đợt 87, luồng O8:
 * CLICK-TEST HEADED mask bám motion track (phần còn lại của gap E5).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP Node thuần,
 * không Playwright), mẫu clicktest-86n9-proxy-clicktest-headed.mjs (N9).
 *
 * Ngữ nghĩa đích (brief O8 + render O3 đã hạ cánh ở server/render/src/mask.js
 * + render.js: --mask-mode trackgeq): clip vừa có track vừa có mask thì
 * TÂM MASK = VỊ TRÍ TRACK, video đứng yên (không pan D3 — tránh double-shift
 * 2*track-0.5). Preview mirror (luồng khác, chưa hạ cánh lúc viết harness)
 * phải cho cùng kết quả trên canvas.
 *
 * Fixture (tự tạo, 720p 6 s, đã verify bằng PIL):
 *   o8-white-720p-6s.mp4 — nền trắng đều (đo tâm mask = centroid vùng sáng).
 *   o8-ball-720p-6s.mp4  — trắng + ô đen 60x60, tâm ô = track(t)
 *                           (x = 0.35+0.05t, y = 0.5) — chẩn đoán bóng có
 *                           nằm giữa mask không (phân biệt video pan / đứng yên).
 *   o8-track-35-65.json  — quỹ đạo 13 điểm, x 0.35 -> 0.65, y = 0.5.
 * Mask tĩnh đặt qua UI: ellipse, cx=35%, cy=50%, w=30%, h=30%, feather 0.
 *
 * Kỳ vọng số (localT tính từ clip.start, W = 1280):
 *   (c) mask tĩnh, không track: tâm blob = (0.35, 0.50) ở mọi thời điểm.
 *   (a) mask + track, localT=1.0 -> track x=0.40; localT=5.0 -> track x=0.60.
 *       MỚI (đúng): tâm blob = track (0.40 / 0.60), bóng (nếu thấy) trùng tâm.
 *       CŨ (D3, chưa sửa preview): tâm blob = tĩnh + (track-0.5)
 *       = 0.25 / 0.45; bóng ở 2*track-0.5 = 0.30 / 0.70 (lệch khỏi mask).
 *   (b) gợi ý "Mask đang bám theo motion track" (O5): hiện khi đủ cả mask +
 *       track, ẩn khi thiếu 1 trong 2. Nếu O5 chưa hạ cánh thì ghi rõ
 *       NOT-LANDED (không tính fail sản phẩm), phân biệt bằng pre-check
 *       đọc code trên đĩa. HINT_FN v2 phân biệt chữ Việt thật vs KEY THÔ
 *       chưa dịch (O5 viết key vào fragments/round87-o5.json nhưng chưa
 *       merge vào vi.json/en.json → trang hiện "mask.trackFollow").
 *   LƯU Ý LẦN CHẠY 1 (06:0x UTC): clip test "Thêm" vào track dưới, clip mẫu
 *   ở track trên phủ kín 0–8 s nên preview đo nhầm video mẫu — từ lần chạy 2,
 *   harness cô lập clip test (gỡ các clip khác qua store.setState, setup
 *   mẫu N9 N4) trước mọi lần đo canvas.
 *   LƯU Ý LẦN CHẠY 2: canvas preview sized theo wrap (~848x275 ở cửa sổ
 *   1440x900), video letterbox vào trong — kỳ vọng vị trí PHẢI đổi qua
 *   canvasExpected() (letterboxFit), không so phân số canvas với phân số
 *   project trực tiếp (lần 2 đo "nén ngang 0,5625" là sai hệ tọa độ, render
 *   thực ra đúng).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-87o8-mask-track-headed.mjs
 * Env: O8_DEV_PORT (mặc định tự chọn 5550–5559), O8_DEBUG_PORT (9650–9659),
 *   O8_DISPLAY (mặc định :187), O8_SCRATCH (mặc định hidden_files/round87-o8/headed).
 * Đợt 89 Q5 — measureAtPlayhead nay XÁC NHẬN seek hoàn tất trước khi đo
 *   (element currentTime/seeking qua __vcutMediaEls + playhead + khung đổi
 *   + ổn định; hết 30s chưa xác nhận → STALE, scenario FAIL thay vì PASS
 *   rỗng — xem P5 đợt 88 §3.3); S7 thêm kiểm tra di chuyển giữa t=1 và t=5.
 * Exit 0 mọi case PASS (hoặc mọi case có verdict rõ + không lỗi harness),
 *   1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 * Ảnh chụp + log + report JSON ở O8_SCRATCH (ngoài repo).
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.O8_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round87-o8", "headed");
const CHROME = [path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome"),
  path.join(os.homedir(), ".cache/ms-playwright", "chromium-1187", "chrome-linux", "chrome"),
  "/opt/meta-chromium/chrome"].find((c) => c && fs.existsSync(c));
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const CFG_DIR = "/tmp/round87-o8";
const VITE_CFG = path.join(CFG_DIR, "vite.o8.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round87-o8/bridge-work";

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
const results = [];
function pass(name, detail = "") { results.push({ name, ok: true, detail }); log(`PASS: ${name}${detail ? ` — ${detail}` : ""}`); }
function fail(name, detail = "") { results.push({ name, ok: false, detail }); log(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`); }
function note(name, detail = "") { results.push({ name, ok: null, detail }); log(`NOTE: ${name}${detail ? ` — ${detail}` : ""}`); }

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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP.send timeout 60s: ${method}`)); }, 60000);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("evaluate failed: " + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)).slice(0, 800));
    return r.result.value;
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
  async clickRect(getRectFn, label) {
    const rect = await this.evalJs(getRectFn).catch(() => null);
    if (!rect) return { ok: false, detail: `không đo được rect ${label}` };
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Math.round(rect.x), y: Math.round(rect.y), button: "none", clickCount: 0 });
    await sleep(120);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(rect.x), y: Math.round(rect.y), button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(rect.x), y: Math.round(rect.y), button: "left", clickCount: 1 });
    await sleep(600);
    return { ok: true };
  }
}

// ---- Pre-check trên đĩa: preview-fix + gợi ý O5 đã hạ cánh chưa? --------
function diskPrecheck() {
  const out = { previewFix: false, previewFixWhere: null, hint: false, hintWhere: null };
  const pv = fs.readFileSync(path.join(WEB_DIR, "src", "preview.tsx"), "utf8");
  if (/đợt 87/.test(pv)) { out.previewFix = true; out.previewFixWhere = "preview.tsx có marker 'đợt 87'"; }
  for (const [file, label] of [
    ["src/components/mask/MaskPanel.tsx", "MaskPanel.tsx"],
    ["src/components/sticker/TrackPanel.tsx", "TrackPanel.tsx"],
    ["src/i18n/vi.json", "vi.json"],
    ["src/i18n/en.json", "en.json"],
  ]) {
    try {
      const s = fs.readFileSync(path.join(WEB_DIR, file), "utf8");
      if (s.includes("đang bám theo motion track") || s.includes("Mask đang bám") || /maskTrack|maskFollow/i.test(s)) {
        out.hint = true; out.hintWhere = label; break;
      }
    } catch {}
  }
  // O5: key gợi ý chỉ có trong fragment round87-o5.json hay đã merge vào dict?
  try {
    const frag = JSON.parse(fs.readFileSync(path.join(WEB_DIR, "src", "i18n", "fragments", "round87-o5.json"), "utf8"));
    const vi = JSON.parse(fs.readFileSync(path.join(WEB_DIR, "src", "i18n", "vi.json"), "utf8"));
    const fragKeys = [...Object.keys(frag.vi?.mask || {}), ...Object.keys(frag.vi?.motionTrack || {})];
    const mergedKeys = fragKeys.filter((k) => (vi.mask && k in vi.mask) || (vi.motionTrack && k in vi.motionTrack));
    out.hintFragment = { keys: fragKeys, merged: mergedKeys.length, total: fragKeys.length };
  } catch { out.hintFragment = null; }
  return out;
}

// ---- Trạng thái store ------------------------------------------------------
const STORE_FN = `(async () => {
  const mod = window.__o8storeMod || (window.__o8storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    playhead: st.playhead,
    playing: st.playing,
    duration: st.spec.meta?.duration ?? null,
    metaW: st.spec.meta?.width ?? null,
    metaH: st.spec.meta?.height ?? null,
    selection: st.selection,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => ({
      id: c.id, trackId: t.id, kind: c.kind, src: c.src, start: c.start, duration: c.duration,
      mask: c.mask ? { shape: c.mask.shape, x: c.mask.x, y: c.mask.y, w: c.mask.w, h: c.mask.h, feather: c.mask.feather, kf: (c.mask.keyframes||[]).length } : null,
      track: c.track ? { n: c.track.points.length, first: c.track.points[0], last: c.track.points[c.track.points.length-1] } : null,
    }))),
  };
})()`;

// Thẻ media theo tên file.
const CARD_FN = (name) => `(() => {
  const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
  if (!card) return null;
  const addBtn = [...card.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Thêm"));
  return { found: true, addRect: addBtn ? (() => { const r = addBtn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : null };
})()`;

// Checkbox proxy tự động (mẫu N9).
const AUTO_UI_FN = `(() => {
  const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
  if (!label) return null;
  const cb = label.querySelector('input[type="checkbox"]');
  const r = cb ? cb.getBoundingClientRect() : null;
  return { checked: cb ? cb.checked : null, cbRect: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null };
})()`;

// Đo canvas preview: centroid vùng sáng (mask blob) + ô tối trong bbox blob.
const MEASURE_FN = `(() => {
  const c = document.querySelector(".preview-canvas");
  if (!c) return null;
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height;
  const img = ctx.getImageData(0, 0, W, H).data;
  let bn = 0, bx = 0, by = 0, bx0 = W, bx1 = 0, by0 = H, by1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const i = (y * W + x) * 4;
    if (img[i+3] > 128 && img[i] > 180 && img[i+1] > 180 && img[i+2] > 180) {
      bn++; bx += x; by += y;
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
    }
  }
  let dn = 0, dx = 0, dy = 0;
  if (bn > 0) {
    for (let y = by0; y <= by1; y += 1) for (let x = bx0; x <= bx1; x += 1) {
      const i = (y * W + x) * 4;
      if (img[i+3] > 128 && img[i] < 60 && img[i+1] < 60 && img[i+2] < 60) { dn++; dx += x; dy += y; }
    }
  }
  return { W, H, brightN: bn,
    brightCx: bn ? +(bx / bn / W).toFixed(4) : null,
    brightCy: bn ? +(by / bn / H).toFixed(4) : null,
    bbox: bn ? [+((bx0 / W).toFixed(3)), +((by0 / H).toFixed(3)), +((bx1 / W).toFixed(3)), +((by1 / H).toFixed(3))] : null,
    darkN: dn, darkCx: dn ? +(dx / dn / W).toFixed(4) : null, darkCy: dn ? +(dy / dn / H).toFixed(4) : null };
})()`;

// Trạng thái các <video> trong trang (để biết seek đã hạ cánh chưa).
// Đợt 89 Q5 — đo blob + playhead TRONG CÙNG 1 evaluate: đọc ở 2 evaluate
// riêng, mỗi cái ~1s dưới tải, playhead chạy tiếp trong lúc chờ → blob
// "lag" ~0,7s so với kỳ vọng (WebKit lần chạy 13:17: lệch 0,034, chỉ hơn
// ngưỡng 0,03) — artifact đo, không phải hành vi sản phẩm.
const MEASURE_PLAYHEAD_FN = `(async () => {
  const measure = ${MEASURE_FN};
  const mod = window.__o8storeMod || (window.__o8storeMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return { measure, playhead: st.playhead, playing: st.playing };
})()`;

const VIDEOS_FN = `([...document.querySelectorAll("video")].map((v) => ({ src: (v.currentSrc || "").split("/").pop(), t: +v.currentTime.toFixed(2), paused: v.paused, vw: v.videoWidth, vh: v.videoHeight })))`;

// Đợt 89 Q5 — element media thật qua hook __vcutMediaEls (preview.tsx
// phơi ở cả nhánh playing lẫn pause từ đợt này): video preview không nằm
// trong DOM nên VIDEOS_FN luôn trả [] — đây là tín hiệu element để xác
// nhận seek (currentTime ≈ target VÀ seeking === false), độc lập với
// tín hiệu canvas. Đọc live từ tham chiếu element nên luôn là giá trị
// hiện tại dù snapshot mảng cũ.
const ELS_FN = `((window.__vcutMediaEls || []).map((e) => ({
  tag: e.tag,
  t: +e.el.currentTime.toFixed(3),
  paused: e.el.paused,
  seeking: e.el.seeking,
  readyState: e.el.readyState,
  srcTail: (e.el.currentSrc || e.el.src || "").slice(-80),
  srcKey: (e.el.dataset?.srcKey || "").slice(-80),
})))`;

// Gợi ý O5: tìm khối trạng thái mask bám track trong MaskPanel.
// O5 render i18nT("mask.trackFollow") / ("mask.trackAttachHint") /
// ("mask.trackDetach") — nhưng key chỉ có trong fragments/round87-o5.json,
// CHƯA merge vào vi.json/en.json (dict vẫn 2507) nên trang hiện KEY THÔ.
// HINT_FN v2 phân biệt: proper (chữ Việt thật) vs rawKey (key thô chưa dịch)
// vs absent (không có khối gợi ý).
const HINT_FN = `(() => {
  const panel = document.querySelector(".mask-panel");
  if (!panel) return { found: false, state: "nopanel" };
  const txt = panel.innerText || "";
  const hasRawFollow = txt.includes("mask.trackFollow");
  const hasRawAttach = txt.includes("mask.trackAttachHint") || txt.includes("mask.trackAttachBtn");
  const hasRawDetach = txt.includes("mask.trackDetach");
  const hasProperFollow = txt.includes("đang bám theo motion track");
  const hasProperAttach = txt.includes("đang đứng yên");
  const el = [...panel.querySelectorAll("p, button")].find((e) => (e.textContent || "").includes("đang bám") || (e.textContent || "").includes("mask.trackFollow") || (e.textContent || "").includes("đang đứng yên") || (e.textContent || "").includes("mask.trackAttachHint"));
  const cs = el ? getComputedStyle(el) : null;
  const visible = !!(el && cs.display !== "none" && cs.visibility !== "hidden" && el.getBoundingClientRect().width > 0);
  if (hasProperFollow || hasRawFollow) return { found: true, state: "follow", form: hasProperFollow ? "proper" : "rawKey", text: (el?.textContent || "").trim().slice(0, 160), visible };
  if (hasProperAttach || hasRawAttach) return { found: true, state: "attach", form: hasProperAttach ? "proper" : "rawKey", text: (el?.textContent || "").trim().slice(0, 160), visible, hasRawDetach };
  return { found: false, state: "none" };
})()`;

// Đổi tọa độ project (0..1) sang tọa độ canvas preview (0..1).
// BẪY ĐO LẦN CHẠY 2 (xem LIMITS): canvas preview sized theo wrap
// (cw = wrap.clientWidth*dpr, vd ~848x275 ở cửa sổ 1440x900), KHÔNG phải
// 1280x720; video letterbox vào trong (preview.tsx:223 + letterboxFit).
// Đo pixel theo phân số canvas mà so với phân số project thì lệch hệ số
// (cw-dw)/cw + s — lần 2 đo "nén ngang 0,5625" thực ra là đúng letterbox.
// Mọi kỳ vọng vị trí dưới đây PHẢI qua hàm này.
function canvasExpected(measure, pw, ph, fx, fy) {
  const cw = measure.W, ch = measure.H;
  const s = Math.min(cw / pw, ch / ph);
  const dw = pw * s, dh = ph * s;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  return {
    cx: +((dx + fx * dw) / cw).toFixed(4), cy: +((dy + fy * dh) / ch).toFixed(4),
    cw, ch, dx: +dx.toFixed(1), dy: +dy.toFixed(1), dw: +dw.toFixed(1), dh: +dh.toFixed(1),
  };
}

// Cô lập 1 clip trên timeline: gỡ mọi clip khác qua store.setState (SETUP,
// mẫu N9 N4 — việc cần kiểm là mask/track, không phải flow xoá clip).
// Không có bước này thì clip mẫu (track trên, phủ kín 0–8 s) che mất clip
// test ở track dưới — lần chạy 1 đã đo nhầm video mẫu (xem LIMITS).
async function isolateClip(cdp, clipId) {
  const ok = await cdp.evalJs(`(async () => {
    const mod = await import("/src/store.ts");
    mod.useStore.setState((s) => ({ spec: { ...s.spec, tracks: s.spec.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.id === ${JSON.stringify(clipId)}) })) } }));
    const st = mod.useStore.getState();
    return st.spec.tracks.reduce((n, t) => n + t.clips.length, 0) === 1;
  })()`).catch(() => false);
  await sleep(600);
  return ok;
}

// Đặt 1 range slider trong MaskPanel theo nhãn (vd "Tâm ngang (x)") về % cho trước.
const SET_RANGE_FN = (labelPart, pct) => `(() => {
  const span = [...document.querySelectorAll(".mask-panel .field span")].find((s) => (s.textContent || "").includes(${JSON.stringify(labelPart)}));
  if (!span) return { ok: false, detail: "không thấy nhãn " + ${JSON.stringify(labelPart)} };
  const input = span.parentElement.querySelector('input[type="range"]');
  if (!input) return { ok: false, detail: "không thấy range sau nhãn" };
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, String(${pct}));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: true, value: input.value };
})()`;

// Đặt select hình dạng mask.
const SET_SHAPE_FN = (shape) => `(() => {
  const sel = document.querySelector(".mask-panel select");
  if (!sel) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(sel, ${JSON.stringify(shape)});
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
})()`;

// Bấm 1 nút theo chữ trong 1 panel (selector CSS), verify bằng hàm kiểm tra.
async function clickButtonIn(cdp, panelSel, textPart, label) {
  const rectFn = `(() => {
    const panel = document.querySelector(${JSON.stringify(panelSel)});
    if (!panel) return null;
    const b = [...panel.querySelectorAll("button")].find((x) => (x.textContent || "").includes(${JSON.stringify(textPart)}));
    if (!b) return null;
    b.scrollIntoView({ block: "center" });
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await cdp.clickRect(rectFn, `${label} (lần ${attempt})`);
    if (!r.ok) return { ok: false, detail: r.detail };
    return { ok: true, attempt };
  }
  return { ok: false, detail: "hết 3 lần thử" };
}

let vite = null, bridge = null, xvfb = null, chrome = null;

async function startBridge(port) {
  const logFd = fs.openSync(path.join(SCRATCH, "o8-bridge.log"), "a");
  const b = spawn("node", [BRIDGE_ENTRY], {
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR,
      BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-o8-${process.pid}.json`) },
  });
  const url = `http://127.0.0.1:${port}`;
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try { const r = await fetch(`${url}/api/proxy/file/nope.mp4`); if (r.status === 404 || r.status === 400) up = true; } catch { await sleep(1000); }
  }
  if (!up) throw new Error(`bridge không lên ở ${url} sau 120s`);
  log(`bridge OK: ${url}`);
  return b;
}

async function importClip(cdp, file) {
  const doc = await cdp.send("DOM.getDocument", { depth: 0 });
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".mediabin input[type='file']" });
  if (!q.nodeId) throw new Error("không thấy input file của MediaBin");
  await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [file] });
}

async function waitCard(cdp, name, timeoutMs = 120000) {
  return cdp.waitFor(async () => {
    const c = await cdp.evalJs(CARD_FN(name)).catch(() => null);
    return c && c.found ? c : null;
  }, `thẻ media ${name} xuất hiện`, timeoutMs);
}

async function addClipToTimeline(cdp, name) {
  const scrolled = await cdp.evalJs(`(() => {
    const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
    if (!card) return false;
    card.scrollIntoView({ block: "center" });
    return true;
  })()`).catch(() => false);
  await sleep(500);
  const before = await cdp.evalJs(STORE_FN).catch(() => null);
  const beforeCount = before?.clipCount ?? 0;
  let added = false;
  if (scrolled) {
    for (let attempt = 1; attempt <= 3 && !added; attempt++) {
      const c = await cdp.evalJs(CARD_FN(name)).catch(() => null);
      if (!c?.addRect) break;
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(c.addRect.x), y: Math.round(c.addRect.y), button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(c.addRect.x), y: Math.round(c.addRect.y), button: "left", clickCount: 1 });
      await sleep(800);
      const afterAdd = await cdp.evalJs(STORE_FN).catch(() => null);
      added = !!(afterAdd && afterAdd.clipCount > beforeCount);
      if (!added) await sleep(700);
    }
    if (!added) {
      const jsClicked = await cdp.evalJs(`(() => {
        const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
        const b = [...(card?.querySelectorAll("button") || [])].find((x) => (x.textContent || "").includes("Thêm"));
        if (!b) return false;
        b.click();
        return true;
      })()`).catch(() => false);
      await sleep(800);
      const afterJs = await cdp.evalJs(STORE_FN).catch(() => null);
      added = !!(afterJs && afterJs.clipCount > beforeCount);
      if (added) log("addClip: CDP click trượt, JS .click() fallback đã thêm được clip");
    }
  }
  return { added, beforeCount };
}

// Chọn clip trên timeline bằng chuột thật (data-clip-id), fallback store.
async function selectTimelineClip(cdp, clipId) {
  const rectFn = `(() => {
    const el = document.querySelector('[data-clip-id="${clipId}"]');
    if (!el) return null;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await cdp.clickRect(rectFn, `clip timeline ${clipId}`);
    if (!r.ok) break;
    await sleep(600);
    const st = await cdp.evalJs(STORE_FN).catch(() => null);
    if (st?.selection?.[0]?.clipId === clipId) return { ok: true, method: "CDP mouse click", attempt };
    await sleep(500);
  }
  const jsOk = await cdp.evalJs(`(async () => {
    const mod = await import("/src/store.ts");
    const st = mod.useStore.getState();
    const clip = st.spec.tracks.flatMap((t) => t.clips.map((c) => ({ trackId: t.id, clipId: c.id }))).find((x) => x.clipId === ${JSON.stringify(clipId)});
    if (!clip) return false;
    mod.useStore.setState({ selection: [clip] });
    return true;
  })()`).catch(() => false);
  await sleep(600);
  const st2 = await cdp.evalJs(STORE_FN).catch(() => null);
  if (jsOk && st2?.selection?.[0]?.clipId === clipId) return { ok: true, method: "store.setState fallback (CDP click vào timeline clip không chọn được)", attempt: 3 };
  return { ok: false, detail: `jsOk=${jsOk}, selection=${JSON.stringify(st2?.selection)}` };
}

// Tắt checkbox "Tự tạo proxy" (mẫu N9: verify + thử lại).
async function toggleCheckboxTo(cdp, wantChecked) {
  const rectFn = `(() => {
    const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
    const cb = label?.querySelector('input[type="checkbox"]');
    if (!cb) return null;
    const r = cb.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ui = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
    if (ui && ui.checked === wantChecked) return { ok: true, method: attempt === 1 ? "đã đúng trạng thái" : "CDP mouse click", attempt: attempt - 1, ui };
    const r = await cdp.clickRect(rectFn, "checkbox tự tạo proxy");
    if (!r.ok) return { ok: false, method: "CDP", detail: r.detail };
    await sleep(400);
    const after = await cdp.evalJs(AUTO_UI_FN).catch(() => null);
    if (after && after.checked === wantChecked) return { ok: true, method: "CDP mouse click", attempt, ui: after };
  }
  return { ok: false, method: "CDP", detail: "hết 3 lần thử, checkbox không đổi trạng thái" };
}

// Gắn quỹ đạo qua input file của TrackPanel (CDP setFileInputFiles).
async function attachTrack(cdp, file) {
  const doc = await cdp.send("DOM.getDocument", { depth: 0 });
  const q = await cdp.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".track-panel input[type='file']" });
  if (!q.nodeId) throw new Error("không thấy input file của TrackPanel");
  await cdp.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files: [file] });
  await sleep(1200);
}

// Đo canvas ở playhead đã pause: setPlayhead rồi XÁC NHẬN seek hoàn tất
// trước khi đo (đợt 89 Q5 — sửa điểm yếu P5 đợt 88 §3.3: bản cũ chỉ kiểm
// "canvas ổn định" nên khung đóng băng cũng cho PASS rỗng như S7 lần 2).
// Tín hiệu độc lập (cần ≥2, không chỉ sleep cố định):
//  (E) element: video element của clip trong __vcutMediaEls có
//      currentTime ≈ target (±1 frame) VÀ seeking === false.
//  (P) store playhead == target (±1 frame).
//  (C) canvas ĐÃ ĐỔI so với baseline trước seek (khung khác khung cũ) —
//      chỉ khi opts.expectChange (frame kỳ vọng đổi: clip có track/bóng
//      di chuyển). Mask tĩnh (S4) thì frame không đổi là đúng nên không
//      yêu cầu C.
//  (S) canvas ổn định: 2 lần đo liên tiếp khớp nhau (<0.01).
// confirmed = (E || P) && S && (C nếu expectChange). Hết deadline 30s
// mà chưa confirmed → stale=true: caller PHẢI FAIL với lý do STALE, không
// được lấy số đo đó làm PASS. Baseline được chụp TRƯỚC setPlayhead để
// tín hiệu C có ý nghĩa (đo ngay sau seek mà bằng baseline = stale —
// đối chứng trong probe89q5-seek-latency: immediate-stale 8/8).
async function measureAtPlayhead(cdp, clipStart, localT, shotName, opts = {}) {
  const target = clipStart + localT;
  const expectChange = !!opts.expectChange;
  const clipSrc = opts.clipSrc || null;
  const baseline = await cdp.evalJs(MEASURE_FN).catch(() => null);
  await cdp.evalJs(`(async () => {
    const mod = await import("/src/store.ts");
    const st = mod.useStore.getState();
    if (st.playing) st.togglePlay();
    st.setPlayhead(${target});
    return true;
  })()`).catch(() => null);
  const signals = { element: false, playhead: false, changed: false, stable: false };
  let m1 = null, m2 = null, els = null, playhead = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 30000) {
    await sleep(500);
    m2 = await cdp.evalJs(MEASURE_FN).catch(() => null);
    els = await cdp.evalJs(ELS_FN).catch(() => null);
    const st = await cdp.evalJs(STORE_FN).catch(() => null);
    playhead = st?.playhead ?? null;
    if (!m2 || m2.brightN <= 0) { m1 = m2; continue; }
    // (P) playhead đã tới đích.
    if (playhead !== null && Math.abs(playhead - target) < 1 / 30) signals.playhead = true;
    // (E) element video của clip đã seek xong (currentTime ≈ localT, không seeking).
    // Pool giữ cả element clip cũ (vd clip mẫu ở t=0) nên KHÔNG lấy
    // element VIDEO đầu tiên, và không match theo src (import qua blob URL
    // nên srcTail/srcKey không chứa tên file): chọn element có currentTime
    // GẦN target nhất; chỉ tính khi nó không seeking và đã tới đích.
    const vids = (els || []).filter((e) => e.tag === "VIDEO");
    let best = null, bestD = 1e9;
    for (const v of vids) { const d = Math.abs(v.t - localT); if (d < bestD) { bestD = d; best = v; } }
    if (best && !best.seeking && bestD < 1 / 30 + 0.02) signals.element = true;
    // (C) khung đã đổi so với baseline trước seek.
    if (baseline && baseline.brightN > 0 &&
      (Math.abs((m2.brightCx ?? -1) - (baseline.brightCx ?? -1)) > 0.01 ||
       Math.abs((m2.brightCy ?? -1) - (baseline.brightCy ?? -1)) > 0.01 ||
       Math.abs((m2.darkCx ?? -1) - (baseline.darkCx ?? -1)) > 0.01)) signals.changed = true;
    // (S) 2 lần đo liên tiếp khớp nhau.
    if (m1 && Math.abs((m1.brightCx ?? -1) - (m2.brightCx ?? -1)) < 0.01 &&
      Math.abs((m1.brightCy ?? -1) - (m2.brightCy ?? -1)) < 0.01) signals.stable = true;
    m1 = m2;
    const confirmed = (signals.element || signals.playhead) && signals.stable && (!expectChange || signals.changed);
    if (confirmed) break;
  }
  const st2 = await cdp.evalJs(STORE_FN).catch(() => null);
  const vids = await cdp.evalJs(VIDEOS_FN).catch(() => null);
  if (shotName) await cdp.shot(shotName);
  const confirmed = (signals.element || signals.playhead) && signals.stable && (!expectChange || signals.changed);
  return { measure: m2, stable: signals.stable, confirmed, stale: !confirmed, signals,
    baseline: baseline ? { brightCx: baseline.brightCx, brightCy: baseline.brightCy, darkCx: baseline.darkCx, darkCy: baseline.darkCy } : null,
    playhead: st2?.playhead ?? playhead, videos: vids, els };
}

const TRACK_FILE = path.join(SCRATCH, "o8-track-35-65.json");
const CLIP_W = path.join(SCRATCH, "o8-white-720p-6s.mp4");
const CLIP_B = path.join(SCRATCH, "o8-ball-720p-6s.mp4");
const CLIP_W_NAME = path.basename(CLIP_W);
const CLIP_B_NAME = path.basename(CLIP_B);

async function main() {
  const pre = diskPrecheck();
  log(`pre-check đĩa: preview-fix đợt 87 = ${pre.previewFix ? "CÓ (" + pre.previewFixWhere + ")" : "CHƯA"}; gợi ý O5 = ${pre.hint ? "CÓ (" + pre.hintWhere + ")" : "CHƯA"}; fragment O5 = ${pre.hintFragment ? `${pre.hintFragment.merged}/${pre.hintFragment.total} key đã merge vào vi.json [${pre.hintFragment.keys.join(", ")}]` : "không đọc được"}`);
  // Đợt 95 W8 — mkdir scratch TRƯỚC khi kiểm tra fixture (nợ V8/đợt 94
  // §4 mục 8): trước đây check fixture chạy trước mkdir nên scratch mới
  // luôn fail lần đầu mà thư mục còn chưa được tạo (phải mkdir tay +
  // copy fixture rồi chạy lại). Nay thư mục đã có sẵn khi báo thiếu,
  // user chỉ cần copy fixture vào rồi chạy lại. (mkdir TMPDIR/CFG_DIR/
  // BRIDGE_WORK_DIR vẫn ở dưới, idempotent.)
  fs.mkdirSync(SCRATCH, { recursive: true });
  if (!fs.existsSync(CLIP_W) || !fs.existsSync(CLIP_B) || !fs.existsSync(TRACK_FILE)) {
    throw new Error(`thiếu fixture trong SCRATCH ${SCRATCH} (cần o8-white-720p-6s.mp4, o8-ball-720p-6s.mp4, o8-track-35-65.json — copy từ hidden_files/round87-o8/headed/ rồi chạy lại)`);
  }
  const bridgePort = await pickFreePort(8851, 8859);
  if (!bridgePort) throw new Error("hết cổng bridge trống 8851–8859");
  const BRIDGE_URL = `http://127.0.0.1:${bridgePort}`;
  const DEV_PORT = Number(process.env.O8_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
  const DEBUG_PORT = Number(process.env.O8_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
  const DISPLAY = process.env.O8_DISPLAY || ":187";
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
  const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = execFileSync("sh", ["-c", `ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`], { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
    if (alive) throw new Error(`display ${DISPLAY} đã có X server khác`);
    fs.unlinkSync(sock);
    log(`đã dọn socket X mồ côi ${sock}`);
  }
  if (!CHROME) throw new Error("không thấy chrome playwright");
  if (!VITE_BIN) throw new Error("không thấy vite");
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const PROFILE = path.join(SCRATCH, "chrome-userdata");
  const TMPDIR = "/tmp/round87-o8/tmp";
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.mkdirSync(TMPDIR, { recursive: true });
  fs.mkdirSync(CFG_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
  log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, bridge :${bridgePort}`);

  bridge = await startBridge(bridgePort);

  // Đợt 89 Q5 — sóng EPERM bật/tắt theo chu kỳ vài phút; vite chết ngay
  // ở loadConfigFromBundledFile nếu khởi động lúc sóng bật (probe tải đã
  // fail 8/8 lần × 2 lượt). Chờ sóng tắt bằng ghi thử rẻ (mỗi 10s, tối
  // đa 10 phút) rồi mới khởi động vite.
  const waveProbeFile = "/tmp/round87-o8/wave-probe.tmp";
  let waveOff = false;
  for (let w = 1; w <= 60 && !waveOff; w++) {
    try {
      fs.writeFileSync(waveProbeFile, "x");
      waveOff = true;
    } catch {
      if (w % 6 === 0) log(`sóng EPERM vẫn bật sau ${w * 10}s chờ, tiếp tục chờ…`);
      await sleep(10000);
    }
  }
  // Đợt 89 Q5 — unlink chỉ là dọn dẹp best-effort, KHÔNG nằm trong test
  // sóng (một tiến trình spawn lúc sóng bật có thể unlink fail mãi dù
  // write đã thành công — xem probe89q5-seek-latency.mjs).
  try { fs.unlinkSync(waveProbeFile); } catch {}
  if (waveOff) log("sóng EPERM đã tắt, khởi động vite");
  else log("CẢNH BÁO: chờ sóng EPERM 10 phút không tắt — thử khởi động vite dù sao");

  // Đợt 89 Q5 — vite có thể chết sớm vì EPERM khi ghi file bundle config
  // tạm (sóng EPERM); thử lại tối đa 8 lần, cách nhau 15s (sóng EPERM), thay vì chờ 120s vào tiến trình
  // đã chết.
  const viteEnv = { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL };
  let up = false;
  let lastViteErr = "";
  for (let attempt = 1; attempt <= 8 && !up; attempt++) {
    const viteLogFd = fs.openSync(path.join(SCRATCH, `o8-vite-attempt${attempt}.log`), "w");
    // Đợt 89 Q5 — --configLoader native: vite import trực tiếp config, KHÔNG
    // bundle qua loadConfigFromBundledFile (ghi file timestamp-*.mjs cạnh
    // config — chết EPERM khi sóng bật; đã chứng minh native-loader không
    // tạo file tạm nào). Fetch có timeout 3s: vite kẹt không treo vòng poll.
    vite = spawn(VITE_BIN, ["--configLoader", "native", "-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd], env: viteEnv });
    for (let i = 0; i < 40 && !up; i++) {
      if (vite.exitCode !== null) break;
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(3000) }); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) {
      try { lastViteErr = fs.readFileSync(path.join(SCRATCH, `o8-vite-attempt${attempt}.log`), "utf8").split("\n").slice(0, 4).join(" | "); } catch {}
      log(`vite attempt ${attempt} chưa lên (exit=${vite.exitCode}): ${lastViteErr.slice(0, 240)}`);
      try { if (vite.exitCode === null) vite.kill("SIGKILL"); } catch {}
      // Sóng EPERM bật/tắt theo chu kỳ ~1–2 phút: chờ 15s giữa các lần thử.
      if (attempt < 8) await sleep(15000);
    }
    try { fs.closeSync(viteLogFd); } catch {}
  }
  if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 8 lần thử (lỗi cuối: ${lastViteErr.slice(0, 240)})`);
  log("vite dev đã lên");

  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
  await sleep(900);
  if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
  const chromeLogFd = fs.openSync(path.join(SCRATCH, "o8-chrome.log"), "w");
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
  await cdp.send("Network.enable");

  // ---- S0: mount + mẫu tự load ------------------------------------------
  let projW = 1280, projH = 720;
  await cdp.send("Page.navigate", { url: DEV_URL });
  const s0 = await cdp.waitFor(async () => {
    const t = await cdp.evalJs(STORE_FN).catch(() => null);
    return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
  }, "project mẫu tự load (3 clip, media bin 2 item)", 180000);
  if (s0) {
    projW = s0.metaW || 1280; projH = s0.metaH || 720;
    pass("S0 setup: mẫu tự load", `3 clip, media [${s0.media.map((m) => `${m.name}(${m.kind},file=${m.hasFile})`).join(", ")}], duration=${s0.duration}, project=${projW}x${projH}`);
  }
  else fail("S0 setup: mẫu tự load", `state=${JSON.stringify(await cdp.evalJs(STORE_FN).catch(() => null))}`);

  // ---- S1: tắt auto-proxy (tránh job proxy làm nhiễu đo) -----------------
  const toggleOff = await toggleCheckboxTo(cdp, false);
  if (toggleOff.ok) pass("S1 tắt auto-proxy trước khi import (setup)", `checked=true → false, ${toggleOff.method} lần ${toggleOff.attempt}`);
  else fail("S1 tắt auto-proxy trước khi import (setup)", `toggle=${JSON.stringify(toggleOff)}`);

  // ---- S2: import clip W, thêm lên timeline, chọn clip -------------------
  await importClip(cdp, CLIP_W);
  const cardW = await waitCard(cdp, CLIP_W_NAME).catch(() => null);
  if (cardW) pass("S2 import clip W: thẻ media xuất hiện", `file=${CLIP_W_NAME}`);
  else fail("S2 import clip W: thẻ media xuất hiện", "không thấy thẻ sau 120s");
  const { added } = await addClipToTimeline(cdp, CLIP_W_NAME);
  let clipW = null;
  if (added) {
    const stW = await cdp.evalJs(STORE_FN).catch(() => null);
    clipW = stW?.clips?.find((c) => c.src === CLIP_W_NAME);
    if (clipW) pass("S2 thêm clip W lên timeline", `clipId=${clipW.id}, start=${clipW.start}, duration=${clipW.duration}`);
    else fail("S2 thêm clip W lên timeline", `clips=${JSON.stringify(stW?.clips)}`);
  } else {
    fail("S2 thêm clip W lên timeline", "không thêm được");
  }
  if (clipW) {
    // Cô lập clip W: clip mẫu ở track trên phủ kín 0–8 s sẽ che mất clip
    // test ở track dưới (lần chạy 1 đo nhầm video mẫu — xem LIMITS).
    const iso = await isolateClip(cdp, clipW.id);
    if (iso) pass("S2 cô lập clip W (gỡ các clip khác qua store — setup)", "timeline còn đúng 1 clip (clip W)");
    else fail("S2 cô lập clip W (gỡ các clip khác qua store — setup)", "không cô lập được");
    const sel = await selectTimelineClip(cdp, clipW.id);
    if (sel.ok) pass("S2 chọn clip W trên timeline", `${sel.method} lần ${sel.attempt}`);
    else fail("S2 chọn clip W trên timeline", sel.detail);
    const panels = await cdp.evalJs(`(() => ({ maskPanel: !!document.querySelector(".mask-panel"), trackPanel: !!document.querySelector(".track-panel") }))()`).catch(() => null);
    if (panels && panels.maskPanel && panels.trackPanel) pass("S2 MaskPanel + TrackPanel đều hiện khi chọn clip video", JSON.stringify(panels));
    else fail("S2 MaskPanel + TrackPanel đều hiện khi chọn clip video", JSON.stringify(panels));
  }

  // ---- S3: bật mask qua UI + đặt hình học qua UI --------------------------
  let maskOk = false;
  if (clipW) {
    const en = await clickButtonIn(cdp, ".mask-panel", "Bật mask", "nút Bật mask");
    await sleep(800);
    const stM = await cdp.evalJs(STORE_FN).catch(() => null);
    const m0 = stM?.clips?.find((c) => c.id === clipW.id)?.mask;
    if (en.ok && m0) pass("S3 bấm 'Bật mask' qua UI", `mask mặc định=${JSON.stringify(m0)}`);
    else fail("S3 bấm 'Bật mask' qua UI", `click=${JSON.stringify(en)}, mask=${JSON.stringify(m0)}`);
    const sh = await cdp.evalJs(SET_SHAPE_FN("ellipse")).catch(() => false);
    await sleep(400);
    const rCx = await cdp.evalJs(SET_RANGE_FN("Tâm ngang", 35)).catch(() => null);
    const rW = await cdp.evalJs(SET_RANGE_FN("Rộng", 30)).catch(() => null);
    const rH = await cdp.evalJs(SET_RANGE_FN("Cao", 30)).catch(() => null);
    await sleep(600);
    const stM2 = await cdp.evalJs(STORE_FN).catch(() => null);
    const m1 = stM2?.clips?.find((c) => c.id === clipW.id)?.mask;
    if (sh && rCx?.ok && rW?.ok && rH?.ok && m1 && m1.shape === "ellipse" && Math.abs(m1.x - 0.35) < 0.01 && Math.abs(m1.y - 0.5) < 0.01 && Math.abs(m1.w - 0.3) < 0.01 && Math.abs(m1.h - 0.3) < 0.01) {
      pass("S3 đặt hình học mask qua UI (ellipse, cx 35%, w/h 30%)", `mask=${JSON.stringify(m1)}`);
      maskOk = true;
    } else {
      fail("S3 đặt hình học mask qua UI (ellipse, cx 35%, w/h 30%)", `shape=${sh}, cx=${JSON.stringify(rCx)}, w=${JSON.stringify(rW)}, h=${JSON.stringify(rH)}, mask=${JSON.stringify(m1)}`);
    }
    await cdp.shot("o8-s3-mask-panel.png");
  }

  // ---- S4 (c): hồi quy mask tĩnh — không track -----------------------------
  if (clipW && maskOk) {
    const c1 = await measureAtPlayhead(cdp, clipW.start, 1.0, "o8-c1-static-t1.png", { clipSrc: CLIP_W_NAME });
    const c2 = await measureAtPlayhead(cdp, clipW.start, 5.0, "o8-c2-static-t5.png", { clipSrc: CLIP_W_NAME });
    const m1 = c1.measure, m2 = c2.measure;
    const e1 = m1 ? canvasExpected(m1, projW, projH, 0.35, 0.5) : null;
    log(`S4 đo tĩnh: t=1.0 blob=(${m1?.brightCx},${m1?.brightCy}) n=${m1?.brightN} canvas=${m1?.W}x${m1?.H} videoRect=(${e1?.dx},${e1?.dy},${e1?.dw}x${e1?.dh}) kỳ vọng canvas=(${e1?.cx},${e1?.cy}) stable=${c1.stable} confirmed=${c1.confirmed} signals=${JSON.stringify(c1.signals)} videos=${JSON.stringify(c1.videos)}`);
    log(`S4 đo tĩnh: t=5.0 blob=(${m2?.brightCx},${m2?.brightCy}) n=${m2?.brightN} stable=${c2.stable} confirmed=${c2.confirmed} signals=${JSON.stringify(c2.signals)} videos=${JSON.stringify(c2.videos)}`);
    const ok1 = m1 && e1 && Math.abs(m1.brightCx - e1.cx) < 0.03 && Math.abs(m1.brightCy - e1.cy) < 0.03;
    const ok2 = m2 && e1 && Math.abs(m2.brightCx - e1.cx) < 0.03 && Math.abs(m2.brightCy - e1.cy) < 0.03;
    const same = ok1 && ok2 && Math.abs(m1.brightCx - m2.brightCx) < 0.02;
    if (!c1.confirmed || !c2.confirmed) fail("S4 (c) mask tĩnh không track: đúng vị trí ở 2 thời điểm", `STALE — seek chưa xác nhận sau 30s (Q5): t=1 confirmed=${c1.confirmed} signals=${JSON.stringify(c1.signals)}; t=5 confirmed=${c2.confirmed} signals=${JSON.stringify(c2.signals)} — không dùng số đo này làm PASS`);
    else if (same) pass("S4 (c) mask tĩnh không track: đúng vị trí ở 2 thời điểm", `t=1 blob=(${m1.brightCx},${m1.brightCy}) n=${m1.brightN}; t=5 blob=(${m2.brightCx},${m2.brightCy}) n=${m2.brightN}; kỳ vọng canvas=(${e1.cx},${e1.cy}) (project (0.35,0.50) qua letterbox)`);
    else fail("S4 (c) mask tĩnh không track: đúng vị trí ở 2 thời điểm", `t=1 blob=(${m1?.brightCx},${m1?.brightCy}) n=${m1?.brightN}; t=5 blob=(${m2?.brightCx},${m2?.brightCy}) n=${m2?.brightN}; kỳ vọng canvas=(${e1?.cx},${e1?.cy}) (project (0.35,0.50) qua letterbox)`);
  }

  // ---- S5 (a): gắn track qua UI TrackPanel, đo mask bám --------------------
  let trackOk = false;
  if (clipW && maskOk) {
    await attachTrack(cdp, TRACK_FILE);
    const stT = await cdp.evalJs(STORE_FN).catch(() => null);
    const tr = stT?.clips?.find((c) => c.id === clipW.id)?.track;
    const panelTxt = await cdp.evalJs(`(() => { const p = document.querySelector(".track-panel"); return p ? p.innerText.slice(0, 200) : null; })()`).catch(() => null);
    if (tr && tr.n === 13) {
      pass("S5 gắn quỹ đạo qua UI TrackPanel (file input thật)", `13 điểm, first=${JSON.stringify(tr.first)}, last=${JSON.stringify(tr.last)}; panel="${(panelTxt || "").replace(/\n/g, " | ").slice(0, 120)}"`);
      trackOk = true;
    } else {
      fail("S5 gắn quỹ đạo qua UI TrackPanel (file input thật)", `track=${JSON.stringify(tr)}, panel=${JSON.stringify(panelTxt)}`);
    }
    await cdp.shot("o8-s5-track-attached.png");
    if (trackOk) {
      const a1 = await measureAtPlayhead(cdp, clipW.start, 1.0, "o8-a1-track-t1.png", { clipSrc: CLIP_W_NAME, expectChange: true });
      const a2 = await measureAtPlayhead(cdp, clipW.start, 5.0, "o8-a2-track-t5.png", { clipSrc: CLIP_W_NAME, expectChange: true });
      const m1 = a1.measure, m2 = a2.measure;
      const eNew1 = m1 ? canvasExpected(m1, projW, projH, 0.40, 0.5) : null;
      const eNew2 = m2 ? canvasExpected(m2, projW, projH, 0.60, 0.5) : null;
      const eOld1 = m1 ? canvasExpected(m1, projW, projH, 0.25, 0.5) : null;
      const eOld2 = m2 ? canvasExpected(m2, projW, projH, 0.45, 0.5) : null;
      log(`S5 đo bám: t=1.0 blob=(${m1?.brightCx},${m1?.brightCy}) n=${m1?.brightN} bbox=${JSON.stringify(m1?.bbox)} canvas=${m1?.W}x${m1?.H} kỳ vọng MỚI canvas=(${eNew1?.cx},${eNew1?.cy}) CŨ canvas=(${eOld1?.cx},${eOld1?.cy}) stable=${a1.stable} confirmed=${a1.confirmed} signals=${JSON.stringify(a1.signals)} videos=${JSON.stringify(a1.videos)}`);
      log(`S5 đo bám: t=5.0 blob=(${m2?.brightCx},${m2?.brightCy}) n=${m2?.brightN} bbox=${JSON.stringify(m2?.bbox)} kỳ vọng MỚI canvas=(${eNew2?.cx},${eNew2?.cy}) CŨ canvas=(${eOld2?.cx},${eOld2?.cy}) stable=${a2.stable} confirmed=${a2.confirmed} signals=${JSON.stringify(a2.signals)} videos=${JSON.stringify(a2.videos)}`);
      const dNew = m1 && m2 && eNew1 && eNew2 ? Math.max(Math.abs(m1.brightCx - eNew1.cx), Math.abs(m2.brightCx - eNew2.cx)) : 99;
      const dOld = m1 && m2 && eOld1 && eOld2 ? Math.max(Math.abs(m1.brightCx - eOld1.cx), Math.abs(m2.brightCx - eOld2.cx)) : 99;
      const delta = m1 && m2 ? +(m2.brightCx - m1.brightCx).toFixed(3) : null;
      const deltaExp = eNew1 && eNew2 ? +(eNew2.cx - eNew1.cx).toFixed(3) : null;
      if (!a1.confirmed || !a2.confirmed) {
        fail("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm", `STALE — seek chưa xác nhận sau 30s (Q5): t=1 confirmed=${a1.confirmed} signals=${JSON.stringify(a1.signals)}; t=5 confirmed=${a2.confirmed} signals=${JSON.stringify(a2.signals)} — không dùng số đo này làm PASS`);
      } else if (m1 && m2 && dNew < 0.03 && Math.abs(m1.brightCy - 0.5) < 0.03 && Math.abs(m2.brightCy - 0.5) < 0.03) {
        pass("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm", `t=1 blob x=${m1.brightCx} (kỳ vọng canvas ${eNew1.cx} = project 0.40); t=5 blob x=${m2.brightCx} (kỳ vọng canvas ${eNew2.cx} = project 0.60); Δx=${delta} (kỳ vọng ${deltaExp}); cy≈0.50`);
      } else if (m1 && m2 && dOld < 0.03) {
        fail("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm", `HÀNH VI CŨ (D3): t=1 blob x=${m1.brightCx} (cũ canvas ${eOld1.cx} / mới canvas ${eNew1.cx}); t=5 blob x=${m2.brightCx} (cũ canvas ${eOld2.cx} / mới canvas ${eNew2.cx}); Δx=${delta}; preview-fix đợt 87 ${pre.previewFix ? "ĐÃ có marker trên đĩa nhưng hành vi vẫn cũ" : "CHƯA hạ cánh"} — xem LIMITS`);
      } else {
        fail("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm", `t=1 blob=(${m1?.brightCx},${m1?.brightCy}); t=5 blob=(${m2?.brightCx},${m2?.brightCy}); kỳ vọng mới canvas (${eNew1?.cx}/${eNew2?.cx}), cũ canvas (${eOld1?.cx}/${eOld2?.cx}); Δx=${delta}`);
      }
      // Đo lúc đang phát (play thật ~2 s).
      await cdp.evalJs(`(async () => {
        const mod = await import("/src/store.ts");
        const st = mod.useStore.getState();
        st.setPlayhead(${clipW.start + 0.5});
        if (!st.playing) st.togglePlay();
        return true;
      })()`).catch(() => null);
      // Đợt 89 Q5 — (a2) đo lúc PHÁT cũng phải xác nhận khung đã đổi (xem
      // bản WebKit): sau setPlayhead(0.5)+play, preview phải seek về 0.5
      // rồi mới vẽ khung mới; sleep cố định đo phải khung stale t=5 (bản
      // WebKit lần chạy 13:11: playhead 3.7 nhưng blob vẫn ở vị trí t=5).
      // Chờ canvas đổi khỏi khung t=5 (tối đa 15s), hết hạn → FAIL STALE.
      const baseBlobX = m2?.brightCx; // khung t=5 vừa đo ở S5(a)
      let pm = null;
      let a2Changed = false;
      let a2Both = null; // blob + playhead cùng 1 evaluate (xem MEASURE_PLAYHEAD_FN)
      const tA2 = Date.now();
      while (Date.now() - tA2 < 15000) {
        a2Both = await cdp.evalJs(MEASURE_PLAYHEAD_FN).catch(() => null);
        pm = a2Both?.measure ?? null;
        if (pm && baseBlobX !== undefined && Math.abs(pm.brightCx - baseBlobX) >= 0.03) { a2Changed = true; break; }
        await sleep(500);
      }
      // Playhead lấy từ CÙNG evaluate với blob cuối (không đọc riêng
      // STORE_FN sau — mỗi evaluate ~1s dưới tải, playhead chạy tiếp).
      const pst = a2Both ? { playhead: a2Both.playhead } : await cdp.evalJs(STORE_FN).catch(() => null);
      await cdp.evalJs(`(async () => { const mod = await import("/src/store.ts"); const st = mod.useStore.getState(); if (st.playing) st.togglePlay(); return true; })()`).catch(() => null);
      await cdp.shot("o8-a3-playing.png");
      const pLocal = pst ? +(pst.playhead - clipW.start).toFixed(2) : null;
      const pExpectProj = pLocal !== null ? +(0.35 + 0.05 * pLocal).toFixed(3) : null;
      const pExpect = pm && pExpectProj !== null ? canvasExpected(pm, projW, projH, pExpectProj, 0.5) : null;
      const pOld = pm && pExpectProj !== null ? canvasExpected(pm, projW, projH, pExpectProj - 0.15, 0.5) : null;
      log(`S5 đo lúc phát: playhead local=${pLocal} (kỳ vọng track project x=${pExpectProj} -> canvas ${pExpect?.cx}), blob=(${pm?.brightCx},${pm?.brightCy}) n=${pm?.brightN}`);
      if (!a2Changed) {
        fail("S5 (a2) mask bám track lúc đang phát", `STALE — canvas không đổi khỏi khung t=5 sau 15s phát (seek về 0.5 chưa xong, playhead local=${pLocal}, blob x=${pm?.brightCx}) — không dùng số đo này làm PASS`);
      } else if (pm && pExpect !== null && Math.abs(pm.brightCx - pExpect.cx) < 0.03) {
        pass("S5 (a2) mask bám track lúc đang phát", `playhead local=${pLocal}, blob x=${pm.brightCx} (kỳ vọng canvas ${pExpect.cx} = project ${pExpectProj} ±0.03)`);
      } else if (pm && pOld !== null && Math.abs(pm.brightCx - pOld.cx) < 0.03) {
        fail("S5 (a2) mask bám track lúc đang phát", `HÀNH VI CŨ (D3): playhead local=${pLocal}, blob x=${pm.brightCx} (cũ canvas ${pOld.cx} / mới canvas ${pExpect.cx})`);
      } else {
        fail("S5 (a2) mask bám track lúc đang phát", `playhead local=${pLocal}, blob=(${pm?.brightCx},${pm?.brightCy}); kỳ vọng mới canvas ${pExpect?.cx}, cũ canvas ${pOld?.cx}`);
      }
    }
  }

  // ---- S6 (b): gợi ý O5 — hiện khi đủ mask+track, ẩn khi thiếu ------------
  // Trạng thái đúng theo maskTrackUiState (O5): follow = mask+track,
  // attach = mask chưa track, none = chưa mask (không khối gợi ý).
  if (clipW && maskOk && trackOk) {
    const h1 = await cdp.evalJs(HINT_FN).catch(() => null);
    if (!pre.hint) {
      note("S6 (b1) gợi ý O5 hiện khi đủ mask + track", `CHƯA HẠ CÁNH trên đĩa — không tính fail sản phẩm; trạng thái trang: ${JSON.stringify(h1)}`);
    } else if (h1 && h1.found && h1.state === "follow" && h1.form === "proper" && h1.visible) {
      pass("S6 (b1) gợi ý O5 hiện khi đủ mask + track", `"${h1.text}"`);
    } else if (h1 && h1.found && h1.state === "follow" && h1.form === "rawKey") {
      fail("S6 (b1) gợi ý O5 hiện khi đủ mask + track", `BUG THẬT: khối gợi ý CÓ nhưng hiện KEY THÔ chưa dịch "${h1.text}" — key chỉ có trong fragments/round87-o5.json, chưa merge vào vi.json/en.json (dict vẫn 2507); user thấy key thô thay vì chữ Việt`);
    } else {
      fail("S6 (b1) gợi ý O5 hiện khi đủ mask + track", `O5 đã có trên đĩa (${pre.hintWhere}) nhưng trang không hiện gợi ý follow: ${JSON.stringify(h1)}`);
    }
    // Bấm nút gỡ RIÊNG của MaskPanel (O5 yêu cầu kiểm thật: bấm gỡ thì track
    // mất thật) — nút hiện key thô "mask.trackDetach" trước khi parent gộp
    // fragment; sau gộp chữ sẽ là "Gỡ quỹ đạo khỏi clip" nên tìm cả 2 dạng.
    const det = await cdp.evalJs(`(() => {
      const panel = document.querySelector(".mask-panel");
      if (!panel) return { ok: false, detail: "không thấy .mask-panel" };
      const b = [...panel.querySelectorAll("button")].find((x) => (x.textContent || "").includes("trackDetach") || (x.textContent || "").includes("Gỡ quỹ đạo khỏi clip"));
      if (!b) return { ok: false, detail: "không thấy nút gỡ của MaskPanel" };
      b.scrollIntoView({ block: "center" });
      const r = b.getBoundingClientRect();
      return { ok: true, x: r.left + r.width / 2, y: r.top + r.height / 2, text: (b.textContent || "").trim() };
    })()`).catch(() => null);
    let detOk = false;
    if (det?.ok) {
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: Math.round(det.x), y: Math.round(det.y), button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: Math.round(det.x), y: Math.round(det.y), button: "left", clickCount: 1 });
      await sleep(800);
      detOk = true;
    }
    const stD = await cdp.evalJs(STORE_FN).catch(() => null);
    const trD = stD?.clips?.find((c) => c.id === clipW.id)?.track;
    const h2 = await cdp.evalJs(HINT_FN).catch(() => null);
    if (detOk && !trD) {
      pass("S6 (b2a) bấm nút gỡ của MaskPanel thì track mất thật", `nút="${det.text}", track=undefined sau khi bấm`);
      if (!pre.hint) note("S6 (b2b) gợi ý O5 chuyển sang attach khi chỉ có mask", `O5 chưa hạ cánh (hint=${JSON.stringify(h2)})`);
      else if (h2 && h2.found && h2.state === "attach") pass("S6 (b2b) gợi ý O5 chuyển sang attach khi chỉ có mask (đã gỡ track)", `dạng=${h2.form}, "${(h2.text || "").slice(0, 100)}"${h2.form === "rawKey" ? " — key thô chưa dịch (cùng bug b1)" : ""}`);
      else fail("S6 (b2b) gợi ý O5 chuyển sang attach khi chỉ có mask (đã gỡ track)", `track=undefined, hint=${JSON.stringify(h2)}`);
    } else {
      fail("S6 (b2a) bấm nút gỡ của MaskPanel thì track mất thật", `click=${JSON.stringify(det)}, track=${JSON.stringify(trD)}`);
    }
    // Gắn lại track, tắt mask -> gợi ý phải biến mất (chưa mask = none).
    await attachTrack(cdp, TRACK_FILE);
    await sleep(600);
    const dis = await clickButtonIn(cdp, ".mask-panel", "Tắt mask", "nút Tắt mask");
    await sleep(800);
    const stD2 = await cdp.evalJs(STORE_FN).catch(() => null);
    const cl2 = stD2?.clips?.find((c) => c.id === clipW.id);
    const h3 = await cdp.evalJs(HINT_FN).catch(() => null);
    if (dis.ok && !cl2?.mask && cl2?.track) {
      if (!pre.hint) note("S6 (b3) gợi ý O5 ẩn khi chỉ có track (đã tắt mask)", `mask đã tắt, track còn; O5 chưa hạ cánh (hint=${JSON.stringify(h3)})`);
      else if (!h3 || !h3.found) pass("S6 (b3) gợi ý O5 ẩn khi chỉ có track (đã tắt mask)", "mask=undefined, track còn 13 điểm, không còn khối gợi ý (state none)");
      else fail("S6 (b3) gợi ý O5 ẩn khi chỉ có track (đã tắt mask)", `hint vẫn hiện: ${JSON.stringify(h3)}`);
    } else {
      fail("S6 (b3) tắt mask qua UI (để kiểm track-only)", `click=${JSON.stringify(dis)}, mask=${JSON.stringify(cl2?.mask)}, trackN=${cl2?.track?.n}`);
    }
    // Khôi phục: bật lại mask + đặt lại hình học (để trạng thái cuối sạch).
    if (!cl2?.mask) {
      await clickButtonIn(cdp, ".mask-panel", "Bật mask", "nút Bật mask (khôi phục)");
      await sleep(600);
      await cdp.evalJs(SET_SHAPE_FN("ellipse")).catch(() => false);
      await sleep(300);
      await cdp.evalJs(SET_RANGE_FN("Tâm ngang", 35)).catch(() => null);
      await cdp.evalJs(SET_RANGE_FN("Rộng", 30)).catch(() => null);
      await cdp.evalJs(SET_RANGE_FN("Cao", 30)).catch(() => null);
      await sleep(600);
      const stR = await cdp.evalJs(STORE_FN).catch(() => null);
      const mR = stR?.clips?.find((c) => c.id === clipW.id)?.mask;
      const h4 = await cdp.evalJs(HINT_FN).catch(() => null);
      log(`S6 khôi phục: mask=${JSON.stringify(mR)}, track n=${stR?.clips?.find((c) => c.id === clipW.id)?.track?.n}, hint=${JSON.stringify(h4)}`);
      if (!pre.hint) note("S6 (b4) gợi ý O5 hiện lại khi đủ mask + track (khôi phục)", "O5 chưa hạ cánh — chỉ ghi trạng thái khôi phục");
      else if (h4 && h4.found && h4.state === "follow" && h4.form === "proper" && h4.visible) pass("S6 (b4) gợi ý O5 hiện lại khi đủ mask + track (khôi phục)", `"${h4.text}"`);
      else if (h4 && h4.found && h4.state === "follow" && h4.form === "rawKey") fail("S6 (b4) gợi ý O5 hiện lại khi đủ mask + track (khôi phục)", `vẫn hiện KEY THÔ "${h4.text}" — cùng bug b1 (fragment chưa merge)`);
      else fail("S6 (b4) gợi ý O5 hiện lại khi đủ mask + track (khôi phục)", `hint=${JSON.stringify(h4)}`);
    }
  }

  // ---- S7: chẩn đoán clip B (bóng di chuyển) --------------------------------
  await importClip(cdp, CLIP_B);
  const cardB = await waitCard(cdp, CLIP_B_NAME).catch(() => null);
  let clipB = null;
  if (cardB) {
    const { added: addedB } = await addClipToTimeline(cdp, CLIP_B_NAME);
    if (addedB) {
      const stB = await cdp.evalJs(STORE_FN).catch(() => null);
      clipB = stB?.clips?.find((c) => c.src === CLIP_B_NAME);
      if (clipB) {
        const isoB = await isolateClip(cdp, clipB.id);
        if (isoB) pass("S7 cô lập clip B (setup)", "timeline còn đúng 1 clip (clip B)");
        else fail("S7 cô lập clip B (setup)", "không cô lập được");
      }
    }
  }
  if (clipB) {
    const selB = await selectTimelineClip(cdp, clipB.id);
    if (!selB.ok) fail("S7 chọn clip B trên timeline", selB.detail);
    await clickButtonIn(cdp, ".mask-panel", "Bật mask", "nút Bật mask (clip B)");
    await sleep(600);
    await cdp.evalJs(SET_SHAPE_FN("ellipse")).catch(() => false);
    await sleep(300);
    await cdp.evalJs(SET_RANGE_FN("Tâm ngang", 35)).catch(() => null);
    await cdp.evalJs(SET_RANGE_FN("Rộng", 30)).catch(() => null);
    await cdp.evalJs(SET_RANGE_FN("Cao", 30)).catch(() => null);
    await sleep(500);
    await attachTrack(cdp, TRACK_FILE);
    const stB2 = await cdp.evalJs(STORE_FN).catch(() => null);
    const clB = stB2?.clips?.find((c) => c.id === clipB.id);
    if (clB?.mask && clB?.track?.n === 13) {
      const b1 = await measureAtPlayhead(cdp, clipB.start, 1.0, "o8-b1-ball-t1.png", { clipSrc: CLIP_B_NAME, expectChange: true });
      const b2 = await measureAtPlayhead(cdp, clipB.start, 5.0, "o8-b2-ball-t5.png", { clipSrc: CLIP_B_NAME, expectChange: true });
      const m1 = b1.measure, m2 = b2.measure;
      log(`S7 chẩn đoán bóng: t=1 blob=(${m1?.brightCx},${m1?.brightCy}) n=${m1?.brightN} | bóng dark=(${m1?.darkCx},${m1?.darkCy}) n=${m1?.darkN} confirmed=${b1.confirmed} signals=${JSON.stringify(b1.signals)}`);
      log(`S7 chẩn đoán bóng: t=5 blob=(${m2?.brightCx},${m2?.brightCy}) n=${m2?.brightN} | bóng dark=(${m2?.darkCx},${m2?.darkCy}) n=${m2?.darkN} confirmed=${b2.confirmed} signals=${JSON.stringify(b2.signals)}`);
      // Kỳ vọng MỚI: bóng trùng tâm mask (video đứng yên): dark ≈ bright ≈ track.
      // Kỳ vọng CŨ: t=1 bóng project 0.30 (lệch +0.05 so với mask 0.25); t=5 bóng
      // project 0.70 ngoài mask (darkN≈0). So sánh qua tọa độ canvas (letterbox).
      const eBallOld1 = m1 ? canvasExpected(m1, projW, projH, 0.30, 0.5) : null;
      const eBallOld2 = m2 ? canvasExpected(m2, projW, projH, 0.70, 0.5) : null;
      const newBall = m1 && m2 && m1.darkN > 100 && m2.darkN > 100 &&
        Math.abs(m1.darkCx - m1.brightCx) < 0.03 && Math.abs(m2.darkCx - m2.brightCx) < 0.03;
      const oldBall = m1 && m2 && m1.darkN > 100 && m2.darkN < 20 &&
        Math.abs((m1.darkCx ?? 0) - (eBallOld1?.cx ?? 0)) < 0.03;
      // Đợt 89 Q5 — chống PASS rỗng (P5 đợt 88 §3.1, S7 lần 2): bóng≈mask ở
      // từng thời điểm CHƯA ĐỦ — mask và bóng PHẢI di chuyển giữa t=1 và
      // t=5. Kỳ vọng Δx TÍNH THEO TỌA ĐỘ CANVAS (đợt 93 U7): bóng/track đi
      // project 0.40 → 0.60 (Δx project 0.20) nhưng canvas letterbox nén
      // ngang theo dw/W — Chromium dw/W ≈ 0.56 nên Δx canvas ≈ 0.11, còn
      // WebKit gần như không letterbox nên ≈ 0.19. Nhãn cũ "~0.19" là
      // số project-coords, sai trên Chromium (đo thật 0,112–0,113 vẫn PASS
      // vì ngưỡng 0.10 = nửa đường di chuyển canvas). Tính kỳ vọng từ
      // videoRect thật qua canvasExpected (mẫu S5) thay vì hardcode.
      const deltaExpS7 = m1 && m2 ? +(canvasExpected(m1, projW, projH, 0.60, 0.5).cx - canvasExpected(m1, projW, projH, 0.40, 0.5).cx).toFixed(3) : null;
      const maskMoved = m1 && m2 ? Math.abs(m2.brightCx - m1.brightCx) : 0;
      const ballMoved = m1 && m2 ? Math.abs(m2.darkCx - m1.darkCx) : 0;
      const moved = maskMoved >= 0.10 && ballMoved >= 0.10;
      if (!b1.confirmed || !b2.confirmed) fail("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm (video đứng yên, mask bám track)", `STALE — seek chưa xác nhận sau 30s (Q5): t=1 confirmed=${b1.confirmed} signals=${JSON.stringify(b1.signals)}; t=5 confirmed=${b2.confirmed} signals=${JSON.stringify(b2.signals)} — không dùng số đo này làm PASS`);
      else if (newBall && moved) pass("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm (video đứng yên, mask bám track)", `t=1 bóng=(${m1.darkCx},${m1.darkCy}) mask=(${m1.brightCx},${m1.brightCy}); t=5 bóng=(${m2.darkCx},${m2.darkCy}) mask=(${m2.brightCx},${m2.brightCy}); mask đã di chuyển Δx=${maskMoved.toFixed(3)}, bóng Δx=${ballMoved.toFixed(3)} (kỳ vọng canvas ${deltaExpS7})`);
      else if (newBall && !moved) fail("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm (video đứng yên, mask bám track)", `PASS RỖNG — khung stale (Q5): bóng≈mask ở cả 2 thời điểm nhưng KHÔNG di chuyển (mask Δx=${maskMoved.toFixed(3)}, bóng Δx=${ballMoved.toFixed(3)}, kỳ vọng canvas ${deltaExpS7}) — đo lại được khung cũ ở t=5: t=1 bóng=(${m1.darkCx}) mask=(${m1.brightCx}); t=5 bóng=(${m2.darkCx}) mask=(${m2.brightCx})`);
      else if (oldBall) fail("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm", `HÀNH VI CŨ (D3): t=1 bóng x=${m1.darkCx} (kỳ vọng cũ canvas ${eBallOld1?.cx}, mask ${m1.brightCx}); t=5 bóng ngoài mask (darkN=${m2.darkN}, mask ${m2.brightCx}) — video vẫn pan, mask chưa lái bóng`);
      else fail("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm", `t=1 bóng=(${m1?.darkCx}) n=${m1?.darkN} mask=(${m1?.brightCx}); t=5 bóng=(${m2?.darkCx}) n=${m2?.darkN} mask=(${m2?.brightCx})`);
    } else {
      fail("S7 setup clip B (mask + track)", `mask=${JSON.stringify(clB?.mask)}, trackN=${clB?.track?.n}`);
    }
  } else {
    fail("S7 import/thêm clip B lên timeline", "không thấy clip B");
  }

  // ---- E0: lỗi JS trang ------------------------------------------------------
  const errs = cdp.exceptions;
  if (errs.length === 0) pass("E0 không có lỗi JS/unhandledrejection trong trang", "");
  else fail("E0 không có lỗi JS/unhandledrejection trong trang", errs.slice(0, 3).join(" | "));

  const failed = results.filter((r) => r.ok === false).length;
  const noted = results.filter((r) => r.ok === null).length;
  log(`\n== KẾT QUẢ CLICK-TEST O8: ${results.length - failed - noted}/${results.length} pass, ${failed} fail, ${noted} note ==`);
  writeFileEpermRetry(path.join(SCRATCH, "o8-clicktest-report.json"), JSON.stringify({ precheck: pre, results, logLines }, null, 2));
  return failed === 0 ? 0 : 1;
}

let code = 2;
try {
  code = await main();
} catch (e) {
  console.error(`[o8] HARNESS LỖI: ${e.message}\n${e.stack || ""}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "o8-clicktest-report.json"), JSON.stringify({ results, logLines, harnessError: e.message }, null, 2)); } catch {}
  code = 2;
} finally {
  for (const p of [chrome, xvfb, vite, bridge]) {
    try { if (p && p.exitCode === null) p.kill("SIGTERM"); } catch {}
  }
  await sleep(800);
  for (const p of [chrome, xvfb, vite, bridge]) {
    try { if (p && p.exitCode === null) p.kill("SIGKILL"); } catch {}
  }
}
process.exit(code);
