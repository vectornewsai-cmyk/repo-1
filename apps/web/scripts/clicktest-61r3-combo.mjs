#!/usr/bin/env node
/**
 * clicktest-61r3-combo.mjs — Phase 9 đợt 61, luồng R3: đóng nợ đợt 60 §5.3
 * (Q1 preview enhance) — (c) CLICK-TEST enhance + mask/SR/motion blur
 * CÙNG LÚC trên canvas preview thật.
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-60q1-enhance-preview.mjs.
 * KHÔNG sửa code sản phẩm. KHÔNG push/tag/binary.
 *
 * Thiết lập (profile Chrome mới tinh):
 *   - Enhance combo (denoise 0.5 + stabilize 10 + deinterlace) bật bằng
 *     CHUỘT THẬT qua checkbox EnhancePanel (mẫu Q1).
 *   - Mask + speed ramp + motion blur đặt qua store.patchClip — đúng
 *     action mà MaskPanel/MotionPanel/SpeedPanel gọi (không phải setState
 *     thô); state đi qua đúng đường UI, chỉ bỏ qua bước bấm chuột ở 3
 *     panel đã được click-test riêng ở các đợt trước (mask P4 đợt 7,
 *     motion M3 đợt 9, speed-curve đợt 12). Ghi rõ trong LIMITS.
 *   - mask rect tâm (0.5, 0.5) w/h 0.6 feather 0.2; speed ramp 1→2 tuyến
 *     tính trên [0,4]s (tại playhead 1.0, nguồn tiêu thụ ∫speed = 1.125s
 *     thay vì 1.0s); motion blur frames=4 weights đều.
 *
 * Các case (playhead 1.0, clip video đầu, canvas preview thật):
 *   C1 mask tách riêng: E2 (full combo) vs E2-bỏ-mask → pixel đổi.
 *   C2 SR tách riêng: E2 vs E2-bỏ-SR → pixel đổi (nguồn 1.125s vs 1.0s).
 *   C3 motion blur tách riêng (ĐỢT 62 R3 VIẾT LẠI — phương pháp cũ đo
 *       blend NGAY SAU PAUSE, nhưng từ đợt 62 preview KHÔNG blend lúc
 *       pause nữa (tmix của khung đứng yên chính là khung đó — xem
 *       LIMITS đợt 62 R3 §3), nên "transient lúc pause" không còn là
 *       tín hiệu đúng; C3 mới đo 2 thứ tách biệt:
 *       (3a/3b) blend TỒN DƯ lúc pause: phát 2s (lấp ring) → pause →
 *       settled tại cùng playhead, patch motion TẮT (không seek) →
 *       snapshot lần nữa; hiệu = blend còn lại sau pause (trước fix:
 *       1.39–2.77; sau fix: ≈ sàn đối chứng). Đối chứng 3a làm cùng
 *       quy trình với blur đã tắt từ đầu (= sàn patch/redraw).
 *       (3c/3d) blend TRANSIENT lúc đang phát: snapshot TRONG LÚC PHÁT
 *       (cùng eval đọc playhead) rồi pause + patch motion tắt + seek
 *       về đúng playhead đó → hiệu = blend lúc phát + sai số căn
 *       chỉnh; đối chứng 3d làm cùng quy trình với blur tắt.
 *   C4 hình học mask: trên snapshot E2, góc ngoài mask tối hẳn (mean < 5)
 *       trong khi tâm sáng (mean > 20).
 *   C5 xác định: snapshot E2 2 lần lúc pause → pixel-identical (mean 0).
 *   C6 hook: applied [denoise] (stabilize BỊ CHẶN vì clip có speed ramp
 *       — đợt 62 R3), notApproximated ∋ deinterlace + stabilize,
 *       offscreen true, blur 3.0 + alpha 0.486, zoom 1.
 *   C7 pipeline sống: phát 1s với full combo, frame đổi (không đóng băng).
 *   H9 0 lỗi trang.
 *
 * Lưu ý: stabilize + speedKeyframes bị validator RENDER chặn (Q8 §4) —
 * từ đợt 62 R3 preview CŨNG chặn (zoom 1, stabilize vào notApproximated
 * — xem C6), đồng bộ với render + panel (đợt 61 R2 chặn preset ở UI).
 * Combo test này kiểm thứ tự pipeline preview, không khẳng định render
 * được tổ hợp đó (ghi rõ trong LIMITS).
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-61r3-combo.mjs
 * Env: R3C_DEV_PORT (mặc định tự chọn 5550–5559), R3C_DEBUG_PORT
 * (9650–9659), R3C_DISPLAY (mặc định quét :160–:169 — display RIÊNG),
 * R3C_SCRATCH (mặc định hidden_files/round61-r3/headed-combo).
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R3C_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round61-r3", "headed-combo");
const CHROME_PW = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
// Đợt 63 R3: chromium-1248 biến mất khỏi cache 08/11 (giữa 2 lần chạy);
// tìm mọi bản chromium-* còn trong cache, ưu tiên bản mới nhất
// (lúc viết: chromium-1254, Chrome 158).
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
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r3c.config.mjs");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

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
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__r3cerrors = [];
  window.addEventListener("error", (e) => { try { window.__r3cerrors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r3cerrors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r3cerrors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r3cerrors.push("unhandledrejection: <?>"); } });
})()`;

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r3cstoreMod || (window.__r3cstoreMod = await import(hit));
  return mod.useStore.getState();
})()`;

const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, clipId: c.id, kind: c.kind, enhance: c.enhance ?? null,
    mask: c.mask ?? null, speedKeyframes: c.speedKeyframes ?? null, motion: c.motion ?? null,
  });
  const hook = window.__vcutPreviewEnhance ? { ...window.__vcutPreviewEnhance } : null;
  const idle = window.__vcutPreviewIdle ? { sleeping: window.__vcutPreviewIdle.sleeping, ticks: window.__vcutPreviewIdle.ticks } : null;
  return {
    clips, selection: st.selection, playhead: st.playhead, playing: st.playing,
    enhancePreviewEnabled: st.enhancePreviewEnabled, hook, idle,
    errors: (window.__r3cerrors || []).slice(),
  };
})()`;

const SET_PLAYHEAD_FN = (t) => `(async () => {
  const st = await (${STORE_FN});
  st.setPlayhead(${t});
  return st.playhead;
})()`;

// patchClip qua store thật (đúng action panel dùng).
const PATCH_FN = (trackId, clipId, patchJson) => `(async () => {
  const st = await (${STORE_FN});
  const n = st.patchClip(${JSON.stringify(trackId)}, ${JSON.stringify(clipId)}, ${patchJson});
  const st2 = window.__r3cstoreMod.useStore.getState();
  const c = st2.spec.tracks.find((t) => t.id === ${JSON.stringify(trackId)}).clips.find((x) => x.id === ${JSON.stringify(clipId)});
  return { patched: n, clip: { enhance: c.enhance ?? null, mask: c.mask ?? null, speedKeyframes: c.speedKeyframes ?? null, motion: c.motion ?? null } };
})()`;

// Lấy mẫu pixel canvas preview vào slot trong trang (mẫu Q1: mỗi 4px).
const SNAP_FN = (slot) => `(window.__r3csnaps = window.__r3csnaps || {}, window.__r3csnaps[${JSON.stringify(slot)}] = (() => {
  const c = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!c) return { ok: false, reason: "không thấy canvas preview" };
  const ctx = c.getContext("2d");
  if (!ctx) return { ok: false, reason: "không lấy được ctx 2d" };
  const w = c.width, h = c.height;
  if (!w || !h) return { ok: false, reason: "canvas 0 kích thước" };
  const img = ctx.getImageData(0, 0, w, h).data;
  const step = 4;
  const data = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      data.push(img[i], img[i + 1], img[i + 2]);
    }
  }
  return { ok: true, w, h, n: data.length / 3, data };
})(), { ok: window.__r3csnaps[${JSON.stringify(slot)}].ok, w: window.__r3csnaps[${JSON.stringify(slot)}].w, h: window.__r3csnaps[${JSON.stringify(slot)}].h, n: window.__r3csnaps[${JSON.stringify(slot)}].n, reason: window.__r3csnaps[${JSON.stringify(slot)}].reason || null })`;

const DIFF_FN = (a, b) => `((sa, sb) => {
  if (!sa || !sb || !sa.ok || !sb.ok) return { ok: false, reason: "snapshot thiếu: " + JSON.stringify({ a: sa && sa.ok, b: sb && sb.ok }) };
  if (sa.w !== sb.w || sa.h !== sb.h) return { ok: false, reason: "canvas đổi kích thước " + sa.w + "x" + sa.h + " -> " + sb.w + "x" + sb.h };
  if (sa.data.length !== sb.data.length) return { ok: false, reason: "số mẫu lệch" };
  let sum = 0, changed = 0;
  for (let i = 0; i < sa.data.length; i++) {
    const d = Math.abs(sa.data[i] - sb.data[i]);
    sum += d;
    if (d > 0) changed++;
  }
  const n = sa.data.length;
  return { ok: true, meanAbs: +(sum / n).toFixed(4), changedPct: +((changed / n) * 100).toFixed(2), n };
})(window.__r3csnaps[${JSON.stringify(a)}], window.__r3csnaps[${JSON.stringify(b)}])`;

// Mean RGB của 1 vùng chữ nhật trên canvas preview (kiểm hình học mask).
const REGION_FN = (slot, x0f, y0f, x1f, y1f) => `(() => {
  const s = window.__r3csnaps[${JSON.stringify(slot)}];
  if (!s || !s.ok) return { ok: false, reason: "snapshot thiếu" };
  const w = s.w, h = s.h, data = s.data, step = 4;
  const x0 = Math.floor(w * ${x0f}), x1 = Math.floor(w * ${x1f}), y0 = Math.floor(h * ${y0f}), y1 = Math.floor(h * ${y1f});
  let sum = 0, n = 0;
  for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
    const sx = Math.floor(x / step), sy = Math.floor(y / step);
    const cols = Math.floor(w / step);
    const i = (sy * cols + sx) * 3;
    if (i + 2 >= data.length) continue;
    sum += data[i] + data[i + 1] + data[i + 2];
    n++;
  }
  return { ok: true, mean: +(sum / Math.max(1, n * 3)).toFixed(2), n };
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

const MASK_PATCH = JSON.stringify({ mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.2 } });
const SR_PATCH = JSON.stringify({ speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] } });
const MOTION_PATCH = JSON.stringify({ motion: { interpolation: "none", motionBlur: { frames: 4, weights: [0.25, 0.25, 0.25, 0.25] } } });
const COMBO_PATCH = JSON.stringify({
  mask: { shape: "rect", x: 0.5, y: 0.5, w: 0.6, h: 0.6, feather: 0.2 },
  speedKeyframes: { keyframes: [{ t: 0, v: 1, easing: "linear" }, { t: 4, v: 2, easing: "linear" }] },
  motion: { interpolation: "none", motionBlur: { frames: 4, weights: [0.25, 0.25, 0.25, 0.25] } },
});

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
    const e = (await cdp.evalJs(`(window.__r3cerrors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r3cerrors = []`).catch(() => {});
    return e;
  }

  async function waitIdle(cdp, label) {
    return cdp.waitFor(async () => {
      const s = await cdp.evalJs(STATE_FN).catch(() => null);
      return s && s.idle && s.idle.sleeping ? s : null;
    }, `vòng preview ngủ (${label})`, 90000);
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
    if (!!(enh2 && enh2[key]) !== want) throw new Error(`checkbox ${key} không về ${want} (enhance=${JSON.stringify(enh2)})`);
    return after;
  }

  async function togglePlay(cdp) {
    await cdp.evalJs(`(document.activeElement && document.activeElement.blur(), true)`);
    await cdp.key(" ", "Space");
  }

  // Snapshot canvas tại playhead đã cho (pause + chờ ngủ).
  async function snapAt(cdp, slot, playhead) {
    await cdp.evalJs(SET_PLAYHEAD_FN(playhead));
    await waitIdle(cdp, `snapshot ${slot} @${playhead}`);
    const s = await cdp.evalJs(SNAP_FN(slot));
    if (!s.ok) throw new Error(`snapshot ${slot} thất bại: ${s.reason}`);
    return s;
  }

  // Play từ 0 rồi pause ngay khi playhead >= target; snapshot NGAY khi
  // playing vừa tắt (poll nhanh 60ms, KHÔNG chờ idle — chờ idle có thể
  // để vòng lặp vẽ lại nhiều lần làm washout motion blur: ring bị lấp
  // đầy bởi frame giống hệt lúc pause). Trả {slot, phAtPause}.
  async function snapPlayPause(cdp, slot, targetPh) {
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await waitIdle(cdp, `${slot} seek 0`);
    await togglePlay(cdp);
    let ph = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const s = await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); return { ph: st.playhead, playing: st.playing }; })()`).catch(() => null);
      if (!s) { await sleep(60); continue; }
      ph = s.ph;
      if (!s.playing) throw new Error(`${slot}: đang phát mà playing tắt sớm ở ph=${ph}`);
      if (ph >= targetPh) break;
      await sleep(60);
    }
    if (ph < targetPh) throw new Error(`${slot}: playhead không tới ${targetPh} sau 15s (đang ${ph})`);
    await togglePlay(cdp);
    // Poll nhanh cho tới khi playing tắt rồi snapshot NGAY.
    let phAtPause = ph;
    const t1 = Date.now();
    while (Date.now() - t1 < 10000) {
      const s = await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); return { ph: st.playhead, playing: st.playing }; })()`).catch(() => null);
      if (s && s.playing === false) { phAtPause = s.ph; break; }
      await sleep(60);
    }
    const s = await cdp.evalJs(SNAP_FN(slot));
    if (!s.ok) throw new Error(`snapshot ${slot} thất bại: ${s.reason}`);
    return { slot, phAtPause: +phAtPause.toFixed(3), snap: s };
  }

    // Play từ 0 tới target rồi pause; snapshot SAU KHI seek về đúng
  // playhead lúc pause + chờ ngủ (settled) — khác snapPlayPause vốn
  // snapshot NGAY khi pause (immediate). Đợt 62 R3: dùng cho C3b/C3a
  // (blend tồn dư sau pause): settled mới là trạng thái canvas giữ
  // lâu dài sau pause, không phải frame thoáng qua lúc vừa dừng.
  async function playPauseSettled(cdp, slot, targetPh) {
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await waitIdle(cdp, `${slot} seek 0`);
    await togglePlay(cdp);
    let ph = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const s = await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); return { ph: st.playhead, playing: st.playing }; })()`).catch(() => null);
      if (!s) { await sleep(60); continue; }
      ph = s.ph;
      if (!s.playing) throw new Error(`${slot}: đang phát mà playing tắt sớm ở ph=${ph}`);
      if (ph >= targetPh) break;
      await sleep(60);
    }
    if (ph < targetPh) throw new Error(`${slot}: playhead không tới ${targetPh} sau 15s (đang ${ph})`);
    await togglePlay(cdp);
    let phAtPause = ph;
    const t1 = Date.now();
    while (Date.now() - t1 < 10000) {
      const s = await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); return { ph: st.playhead, playing: st.playing }; })()`).catch(() => null);
      if (s && s.playing === false) { phAtPause = s.ph; break; }
      await sleep(60);
    }
    const s = await snapAt(cdp, slot, phAtPause);
    return { slot, ph: +phAtPause.toFixed(3), snap: s };
  }

  // Snapshot TRONG LÚC ĐANG PHÁT (không pause trước): play từ 0, poll
  // tới target rồi chụp canvas + đọc playhead trong CÙNG 1 eval (tránh
  // lệch ph giữa snapshot và lần đọc sau). Đợt 62 R3: dùng cho C3c/C3d
  // (transient lúc phát) — từ đợt 62 pause không blend nữa nên transient
  // chỉ đo được lúc đang phát, không đo được ngay sau pause.
  async function snapWhilePlaying(cdp, slot, targetPh) {
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await waitIdle(cdp, `${slot} seek 0`);
    await togglePlay(cdp);
    let ph = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const s = await cdp.evalJs(`(async () => { const st = await (${STORE_FN}); return { ph: st.playhead, playing: st.playing }; })()`).catch(() => null);
      if (!s) { await sleep(60); continue; }
      ph = s.ph;
      if (!s.playing) throw new Error(`${slot}: đang phát mà playing tắt sớm ở ph=${ph}`);
      if (ph >= targetPh) break;
      await sleep(60);
    }
    if (ph < targetPh) throw new Error(`${slot}: playhead không tới ${targetPh} sau 15s (đang ${ph})`);
    const r = await cdp.evalJs(`(async () => { const snap = (${SNAP_FN(slot)}); const st = await (${STORE_FN}); return { snap, ph: st.playhead, playing: st.playing }; })()`);
    if (!r.snap.ok) throw new Error(`snapshot ${slot} lúc đang phát thất bại: ${r.snap.reason}`);
    if (!r.playing) throw new Error(`${slot}: snapshot lúc playing=false (đã pause trước khi chụp?)`);
    await togglePlay(cdp);
    return { slot, ph: +r.ph.toFixed(3), snap: r.snap };
  }

  try {
    const DEV_PORT = Number(process.env.R3C_DEV_PORT || 0) || (await pickFreePort(5550, 5559));
    const DEBUG_PORT = Number(process.env.R3C_DEBUG_PORT || 0) || (await pickFreePort(9650, 9659));
    async function pickDisplay() {
      const { execSync } = await import("node:child_process");
      for (let n = 160; n <= 169; n++) {
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
    const DISPLAY = process.env.R3C_DISPLAY || (await pickDisplay());
    if (!DISPLAY) throw new Error("hết display trống :160–:169");
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5550–5559");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9650–9659");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round61-r3/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r3c-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r3c-chrome.log"), "w");
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

    // ---- C0: setup ----------------------------------------------------------
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clips.length === 3 && t.hook && t.hook.clipId ? t : null;
    }, "project mẫu tự load (3 clip) + hook xuất hiện", 180000);
    const firstClipId = s0.clips.find((c) => c.trackId === "v1").clipId;
    await drainErrors(cdp);
    const g1 = await cdp.evalJs(GEOM_FN);
    const vc = g1.clips.find((c) => c.trackId === "v1");
    if (!vc) throw new Error("không tìm thấy clip video trên timeline (C0)");
    await cdp.click(vc.rect.cx, vc.rect.cy);
    await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.hook && t.hook.clipId === firstClipId ? t : null;
    }, "chọn clip video đầu", 60000);
    // Enhance combo bằng chuột thật (mẫu Q1).
    await setEnhCheckbox(cdp, "enhance-denoise-toggle", "denoise", true, firstClipId);
    await setEnhCheckbox(cdp, "enhance-stabilize-toggle", "stabilize", true, firstClipId);
    await setEnhCheckbox(cdp, "enhance-deinterlace-toggle", "deinterlace", true, firstClipId);
    // Mask + SR + motion blur qua patchClip (đúng action panel dùng).
    const p0 = await cdp.evalJs(PATCH_FN("v1", firstClipId, COMBO_PATCH));
    const c0ok = p0.clip.mask && p0.clip.mask.shape === "rect"
      && p0.clip.speedKeyframes && p0.clip.speedKeyframes.keyframes.length === 2
      && p0.clip.motion && p0.clip.motion.motionBlur && p0.clip.motion.motionBlur.frames === 4
      && p0.clip.enhance && p0.clip.enhance.denoise && p0.clip.enhance.stabilize && p0.clip.enhance.deinterlace;
    if (c0ok) {
      pass("C0 setup: enhance combo (click thật) + mask + SR + motion blur (patchClip)", `clip=${JSON.stringify(p0.clip)}`);
    } else {
      fail("C0 setup: enhance combo (click thật) + mask + SR + motion blur (patchClip)", `clip=${JSON.stringify(p0.clip)}`);
    }
    await drainErrors(cdp);

    // ---- C5/C6: snapshot E2 (full combo) tại playhead 1.0, pause -----------
    const snapE2 = await snapAt(cdp, "E2", 1.0);
    const snapE2b = await snapAt(cdp, "E2b", 1.0);
    const diffE2E2b = await cdp.evalJs(DIFF_FN("E2", "E2b"));
    const stE2 = await cdp.evalJs(STATE_FN);
    const hook = stE2.hook;
    // Đợt 62 R3: clip có speedKeyframes nên stabilize BỊ CHẶN ở preview
    // (zoom 1, stabilize vào notApproximated — đồng bộ render chặn hẳn);
    // denoise vẫn áp (blur 3.0 + alpha 0.486, offscreen true).
    const c6ok = hook && hook.denoiseBlurPx === 3.0 && hook.denoiseBlendAlpha === 0.486
      && Math.abs(hook.stabilizeZoom - 1) < 1e-9 && hook.stabilizeBlockedBySpeedRamp === true
      && JSON.stringify(hook.applied) === JSON.stringify(["denoise"])
      && hook.notApproximated.includes("deinterlace") && hook.notApproximated.includes("stabilize")
      && hook.offscreenApplied === true;
    if (c6ok) pass("C6 hook full combo: blur 3.0 + alpha 0.486, zoom 1 (stabilize bị chặn vì có speed ramp), applied [denoise], deinterlace+stabilize notApproximated, offscreen true", `hook=${JSON.stringify(hook)}`);
    else fail("C6 hook full combo: blur 3.0 + alpha 0.486, zoom 1 (stabilize bị chặn vì có speed ramp), applied [denoise], deinterlace+stabilize notApproximated, offscreen true", `hook=${JSON.stringify(hook)}`);
    if (diffE2E2b.ok && diffE2E2b.meanAbs === 0) pass("C5 xác định: snapshot E2 2 lần lúc pause pixel-identical", `E2 vs E2b: mean ${diffE2E2b.meanAbs}, ${diffE2E2b.changedPct}% đổi (n=${diffE2E2b.n})`);
    else fail("C5 xác định: snapshot E2 2 lần lúc pause pixel-identical", `diff=${JSON.stringify(diffE2E2b)}`);
    await cdp.shot("r3c-e2-fullcombo.png");

    // ---- C4: hình học mask (góc ngoài mask vs tâm) -------------------------
    const corner = await cdp.evalJs(REGION_FN("E2", 0.02, 0.02, 0.08, 0.08));
    const center = await cdp.evalJs(REGION_FN("E2", 0.4, 0.4, 0.6, 0.6));
    log(`C4 vùng: góc ngoài mask mean=${corner.mean} (n=${corner.n}), tâm mean=${center.mean} (n=${center.n})`);
    if (corner.ok && center.ok && corner.mean < 5 && center.mean > 20) {
      pass("C4 hình học mask: góc ngoài mask tối hẳn, tâm sáng", `góc mean ${corner.mean} < 5, tâm mean ${center.mean} > 20 (mask rect 0.6x0.6 feather 0.2 che góc thật)`);
    } else {
      fail("C4 hình học mask: góc ngoài mask tối hẳn, tâm sáng", `góc=${JSON.stringify(corner)}, tâm=${JSON.stringify(center)}`);
    }

    // ---- C1: bỏ mask → pixel đổi -------------------------------------------
    const p1 = await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ mask: undefined }"));
    if (p1.clip.mask !== null) throw new Error(`bỏ mask thất bại: mask vẫn ${JSON.stringify(p1.clip.mask)}`);
    const snapNoMask = await snapAt(cdp, "NoMask", 1.0);
    const diffMask = await cdp.evalJs(DIFF_FN("E2", "NoMask"));
    await drainErrors(cdp);
    if (diffMask.ok && diffMask.meanAbs > 0.5 && diffMask.changedPct > 1) {
      pass("C1 mask tách riêng: bỏ mask đổi pixel thật", `E2 vs NoMask: mean ${diffMask.meanAbs}, ${diffMask.changedPct}% channel đổi`);
    } else {
      fail("C1 mask tách riêng: bỏ mask đổi pixel thật", `diff=${JSON.stringify(diffMask)}`);
    }
    // Khôi phục mask.
    await cdp.evalJs(PATCH_FN("v1", firstClipId, MASK_PATCH));

    // ---- C2: bỏ SR → pixel đổi (nguồn 1.125s vs 1.0s tại playhead 1.0) -----
    const p2 = await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ speedKeyframes: undefined }"));
    if (p2.clip.speedKeyframes !== null) throw new Error(`bỏ SR thất bại: speedKeyframes vẫn ${JSON.stringify(p2.clip.speedKeyframes)}`);
    const snapNoSR = await snapAt(cdp, "NoSR", 1.0);
    const diffSR = await cdp.evalJs(DIFF_FN("E2", "NoSR"));
    await drainErrors(cdp);
    if (diffSR.ok && diffSR.meanAbs > 0.1) {
      pass("C2 SR tách riêng: bỏ speed ramp đổi pixel thật", `E2 vs NoSR @playhead 1.0: mean ${diffSR.meanAbs}, ${diffSR.changedPct}% channel đổi (ramp 1→2: nguồn 1.125s vs 1.0s)`);
    } else {
      fail("C2 SR tách riêng: bỏ speed ramp đổi pixel thật", `diff=${JSON.stringify(diffSR)}`);
    }
    // Khôi phục SR.
    await cdp.evalJs(PATCH_FN("v1", firstClipId, SR_PATCH));

    // ---- C3: motion blur tách riêng (ĐỢT 62 R3 VIẾT LẠI) -------------------
    // Phương pháp cũ (run 3–5 đợt 61) đo blend NGAY SAU PAUSE — từ đợt 62
    // preview không blend lúc pause nữa (tmix của khung đứng yên chính
    // là khung đó — xem LIMITS đợt 62 R3 §3), nên "transient lúc pause"
    // không còn là tín hiệu đúng. C3 mới tách 2 câu hỏi:
    //  (3a/3b) pause có còn blend TỒN DƯ? Phát 2s (lấp ring) → pause →
    //    settled tại cùng playhead → patch motion TẮT (redraw ở cùng
    //    playhead, KHÔNG seek) → snapshot lần nữa. Hiệu 3b = blend tồn
    //    dư sau pause (trước fix: 1.39–2.77); 3a (blur đã tắt từ đầu) =
    //    sàn patch/redraw. PASS khi 3b ≤ max(0.5, 2× sàn 3a).
    //  (3c/3d) blend còn sống lúc ĐANG PHÁT? Snapshot TRONG LÚC PHÁT
    //    (cùng 1 eval đọc playhead) → pause → patch motion tắt → seek
    //    về đúng playhead lúc snapshot → hiệu = transient + căn chỉnh;
    //    3d (blur tắt) = sàn căn chỉnh. PASS khi 3c > 0.5 và > 2× 3d.
    // 3a. Đối chứng (blur TẮT): sàn patch/redraw lúc pause.
    await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ motion: undefined }"));
    const ctrlSettled = await playPauseSettled(cdp, "MBc_settled1", 2.0);
    await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ motion: undefined }"));
    const ctrlSettled2 = await snapAt(cdp, "MBc_settled2", ctrlSettled.ph);
    const dFloor = await cdp.evalJs(DIFF_FN("MBc_settled1", "MBc_settled2"));
    log(`C3a sàn (blur tắt): settled ph=${ctrlSettled.ph} vs sau patch no-op cùng ph, diff mean ${dFloor.ok ? dFloor.meanAbs : "ERR"}`);
    // 3b. Blur BẬT: blend tồn dư sau pause.
    await cdp.evalJs(PATCH_FN("v1", firstClipId, MOTION_PATCH));
    const blurSettled = await playPauseSettled(cdp, "MBb_settled1", 2.0);
    await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ motion: undefined }"));
    const blurSettledOff = await snapAt(cdp, "MBb_settled2", blurSettled.ph);
    const dResidual = await cdp.evalJs(DIFF_FN("MBb_settled1", "MBb_settled2"));
    log(`C3b blur bật: settled ph=${blurSettled.ph} (blur vẫn bật) vs sau khi tắt blur cùng ph, diff mean ${dResidual.ok ? dResidual.meanAbs : "ERR"} (blend tồn dư sau pause)`);
    // 3c. Blur BẬT: transient lúc đang phát.
    await cdp.evalJs(PATCH_FN("v1", firstClipId, MOTION_PATCH));
    const playSnap = await snapWhilePlaying(cdp, "MBb_play", 2.0);
    await cdp.evalJs(PATCH_FN("v1", firstClipId, "{ motion: undefined }"));
    const playOff = await snapAt(cdp, "MBb_playoff", playSnap.ph);
    const dTransient = await cdp.evalJs(DIFF_FN("MBb_play", "MBb_playoff"));
    log(`C3c blur bật: đang phát ph=${playSnap.ph} vs tắt-blur settled cùng ph, diff mean ${dTransient.ok ? dTransient.meanAbs : "ERR"} (transient lúc phát + căn chỉnh)`);
    // 3d. Đối chứng (blur TẮT): sàn căn chỉnh lúc đang phát.
    const playSnapCtrl = await snapWhilePlaying(cdp, "MBc_play", 2.0);
    const playOffCtrl = await snapAt(cdp, "MBc_playoff", playSnapCtrl.ph);
    const dAlign = await cdp.evalJs(DIFF_FN("MBc_play", "MBc_playoff"));
    log(`C3d đối chứng (blur tắt): đang phát ph=${playSnapCtrl.ph} vs settled cùng ph, diff mean ${dAlign.ok ? dAlign.meanAbs : "ERR"} (sàn căn chỉnh)`);
    await drainErrors(cdp);
    const c3residOk = dResidual.ok && dResidual.meanAbs <= Math.max(0.5, 2 * (dFloor.ok ? dFloor.meanAbs : 0));
    const c3transOk = dTransient.ok && dAlign.ok && dTransient.meanAbs > 0.5 && dTransient.meanAbs > 2 * dAlign.meanAbs;
    if (c3residOk && c3transOk) {
      pass("C3 motion blur: pause không còn blend tồn dư, transient lúc phát vẫn đổi pixel thật", `tồn dư sau pause=${dResidual.meanAbs} (sàn patch/redraw=${dFloor.meanAbs}, ngưỡng ${Math.max(0.5, 2 * (dFloor.ok ? dFloor.meanAbs : 0)).toFixed(2)}); transient lúc phát=${dTransient.meanAbs} (${dTransient.changedPct}% đổi) vs sàn căn chỉnh=${dAlign.meanAbs} (gấp ${(dTransient.meanAbs / Math.max(dAlign.meanAbs, 0.001)).toFixed(1)}x)`);
    } else {
      fail("C3 motion blur: pause không còn blend tồn dư, transient lúc phát vẫn đổi pixel thật", `tồn dư=${JSON.stringify(dResidual)} (sàn=${JSON.stringify(dFloor)}); transient=${JSON.stringify(dTransient)} (sàn căn chỉnh=${JSON.stringify(dAlign)}), ph blur=${blurSettled.ph} ph play=${playSnap.ph} ph ctrl=${playSnapCtrl.ph}`);
    }
    // Khôi phục motion blur cho C7.
    await cdp.evalJs(PATCH_FN("v1", firstClipId, MOTION_PATCH));
    await cdp.shot("r3c-b1-motionblur.png");

    // ---- C7: pipeline sống — phát 1s với full combo, frame đổi ------------
    await cdp.evalJs(SET_PLAYHEAD_FN(0));
    await waitIdle(cdp, "C7 seek 0");
    await togglePlay(cdp);
    await sleep(1000);
    const snapPlay = await cdp.evalJs(SNAP_FN("Play1s"));
    await togglePlay(cdp);
    const stPlay = await cdp.evalJs(STATE_FN);
    const diffPlay = await cdp.evalJs(DIFF_FN("E2", "Play1s"));
    await drainErrors(cdp);
    if (snapPlay.ok && diffPlay.ok && diffPlay.meanAbs > 0.1 && stPlay.playing === false) {
      pass("C7 pipeline sống: phát 1s với full combo, frame đổi", `ph lúc snapshot ~1.0 (E2 @1.0 vs đang phát ~1.0): mean ${diffPlay.meanAbs}, ${diffPlay.changedPct}% đổi; đã pause lại`);
    } else {
      fail("C7 pipeline sống: phát 1s với full combo, frame đổi", `snapPlay=${JSON.stringify(snapPlay)}, diff=${JSON.stringify(diffPlay)}, playing=${stPlay.playing}`);
    }

    // H9: 0 lỗi trang gộp.
    await drainErrors(cdp);
    if (phaseErrors.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong cả phiên");
    else fail("H9 0 lỗi trang", phaseErrors.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "r3c-combo-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED R3 COMBO: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
