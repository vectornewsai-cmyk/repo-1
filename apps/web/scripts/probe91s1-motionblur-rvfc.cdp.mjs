#!/usr/bin/env node
/**
 * probe91s1-motionblur-rvfc.cdp.mjs — Phase 9 đợt 91, luồng S1: đo lại
 * A/B/C play sau pump requestVideoFrameCallback (rVFC) + đo mới 2 combo
 * chưa từng đo bằng pixel (R1 §5.3): D = mask+SR keyframes+blur,
 * E = mask feather 0.2+blur. Copy từ probe90r1-motionblur-preview.cdp.mjs
 * (giữ nguyên hàm đo pixel + 3 neo của R1 để số so được trực tiếp).
 *
 * Mới so với R1:
 *  - Case D/E (--cases d,e; spec ở --spec-dir, mặc định
 *    ~/workspace/round91-s1/specs). D: mask ellipse tĩnh x=0.5 + scale
 *    keyframes 1→1.3 + rotation 0→15° (t=0→2) + blur; E: mask tĩnh
 *    x=0.5 + feather 0.2 + blur (cùng footage sọc cuộn như B).
 *  - Ghi thêm mỗi khung rAF: frameIdx (floor(vt*30)), ring/lastFrame/
 *    rvfcCaptures/ringClears từ hook __vcutMotionBlurSnapshots, và
 *    r90frac/cxCfrac (phần lẻ vị trí mép phải/tâm mask theo canvas px)
 *    để điều tra mép phải max 3.6px ở khung lẻ (R1 §5.2).
 *  - Phân tích gStd SPREAD theo frame: nhóm mẫu theo frameIdx, spread =
 *    max-min gStd trong nhóm có mẫu ở ≥ 2 pass — với rVFC, cửa sổ blend
 *    là các frame liên tiếp xác định nên cùng 1 frame video phải cho
 *    cùng gStd qua các pass (spread nhỏ); đường tick cũ cho spread lớn
 *    vì cửa sổ blend phụ thuộc khoảng cách tick.
 *  - Assert rVFC: pump active + không fallback + rvfcCaptures >= số
 *    frame video phân biệt đã lấy mẫu - 2. Khi fallback (rvfcActive
 *    false) thì quay về assert cũ của R1 (ring=2, skippedDuplicate>0).
 *  - D: w50 theo scale(t) (512*scale, scale=1+0.15t, kẹp 1.3);
 *    trailLeftFrac 0.27 (nửa rộng mask tối đa khi scale 1.3 + xoay
 *    15° = 0.256 + biên). E: mép so với baseline pause CÙNG feather
 *    (không khóa tuyệt đối — feather 0.2 làm mép 10-90% rộng ~58px
 *    theo thiết kế: band = 0.2*min(512,360) = 72px, xem maskAlphaAt).
 *    R>128 vẫn cắt đúng mép danh nghĩa với feather (alpha=0.5 tại
 *    mép) nên trailLeftFrac E giữ 0.2 như B.
 *
 * SETUP (như R1): media stripes-*.mp4 trong apps/web/public/; vite dev
 * cổng 5173; chạy từ gốc repo:
 *   node apps/web/scripts/probe91s1-motionblur-rvfc.cdp.mjs --cases a,b,c,d,e \
 *     --passes 3 --assert [--out ~/workspace/round91-s1/out/preview-abcde-assert.json]
 * --assert: exit 1 khi bất kỳ kiểm tra nào fail; exit 0 khi tất cả xanh.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const has = (name) => argv.includes(name);
const URL = opt("--url", "http://127.0.0.1:5173/");
const SPEC = opt("--spec", "");
const CASES = opt("--cases", "");
const MEDIA = opt("--media", "").split(",").map((s) => s.trim()).filter(Boolean);
const TIMES = opt("--times", "0.5,1,1.5").split(",").map(Number);
const PASSES = Math.max(1, Number(opt("--passes", "3")) || 3);
const ASSERT = has("--assert");
const OUT = opt("--out", "");
const DISABLE_RVFC = has("--disable-rvfc");
const SPEC_DIR = opt("--spec-dir", path.join(os.homedir(), "workspace/round91-s1/specs"));
const SPEC_DIR_ABC = path.join(os.homedir(), "workspace/round90-r1/specs");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9229"));

// Case -> spec/media mặc định (như test render Q2).
// trailLeftFrac: nửa rộng mask (theo dw) mà trail scan phải trừ —
// A/B/C/E: 0.2 (nửa rộng danh nghĩa w=0.4); D: 0.27 (scale 1.3 + xoay
// 15° cho nửa rộng tối đa 0.256, xem header).
// edgeMode: "abs" = khóa median ≤ edgeMax px; "rel" = so với pause cùng
// feather (E — mép rộng theo thiết kế, không khóa tuyệt đối).
const CASE_DEFS = {
  a: { spec: "a-blur.json", media: ["stripes-static.mp4"], expectCx: (t) => 0.3 + 0.2 * t, blurExpected: false, trailLeftFrac: 0.2, edgeMode: "abs", edgeMax: 3 },
  b: { spec: "b-blur.json", media: ["stripes-scroll.mp4"], expectCx: () => 0.5, blurExpected: true, trailLeftFrac: 0.2, edgeMode: "abs", edgeMax: 3 },
  c: { spec: "c-blur.json", media: ["stripes-scroll.mp4"], expectCx: (t) => 0.3 + 0.2 * t, blurExpected: true, trailLeftFrac: 0.2, edgeMode: "abs", edgeMax: 3 },
  d: { spec: "d-blur.json", media: ["stripes-scroll.mp4"], expectCx: () => 0.5, blurExpected: true, trailLeftFrac: 0.27, edgeMode: "abs", edgeMax: 5, w50Scale: (t) => Math.min(1.3, 1 + 0.15 * t) },
  e: { spec: "e-blur.json", media: ["stripes-scroll.mp4"], expectCx: () => 0.5, blurExpected: true, trailLeftFrac: 0.2, edgeMode: "rel" },
};

let jobs = [];
if (CASES) {
  for (const c of CASES.split(",").map((s) => s.trim()).filter(Boolean)) {
    const d = CASE_DEFS[c];
    if (!d) { console.error(`case không biết: ${c} (a/b/c/d/e)`); process.exit(2); }
    // Spec D/E ở SPEC_DIR (round91-s1); A/B/C ở SPEC_DIR_ABC (round90-r1).
    const specPath = fs.existsSync(path.join(SPEC_DIR, d.spec)) ? path.join(SPEC_DIR, d.spec) : path.join(SPEC_DIR_ABC, d.spec);
    jobs.push({ name: c, specPath, media: d.media, expectCx: d.expectCx, blurExpected: d.blurExpected, trailLeftFrac: d.trailLeftFrac, edgeMode: d.edgeMode, edgeMax: d.edgeMax, w50Scale: d.w50Scale });
  }
} else {
  if (!SPEC || !fs.existsSync(SPEC)) { console.error("thiếu --spec (file spec JSON) hoặc --cases a,b,c"); process.exit(2); }
  const media = MEDIA.length ? MEDIA : ["stripes-scroll.mp4"];
  jobs.push({ name: path.basename(SPEC, ".json"), specPath: SPEC, media, expectCx: null, blurExpected: null });
}
for (const j of jobs) {
  if (!fs.existsSync(j.specPath)) { console.error(`không thấy spec ${j.specPath}`); process.exit(2); }
  j.spec = JSON.parse(fs.readFileSync(j.specPath, "utf8"));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { this.pending.get(m.id)(m); this.pending.delete(m.id); }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`timeout ${method}`)); } }, 60000);
    });
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error("evaluate lỗi: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

// Đọc store thật mà app đã nạp (mẫu O4/Q2).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p3storeMod || (window.__p3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Đo pixel trên canvas preview thật — GIỮ NGUYÊN hàm đo của Q2
// (probe89q2-motionblur-mask.cdp.mjs) để số đo so được trực tiếp:
// vùng mask = R>128; tương phản sọc = kênh G trong lõi mask; vệt trái =
// pixel R>128 ngoài mép trái sắc kỳ vọng; pixHash chống đóng băng.
// PW/PH lấy từ spec của job đang đo (đặt qua __p3pw/__p3ph trước khi gọi).
const MEASURE_FN_SRC = `function __p3measure() {
  const el = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!el) return { error: "không thấy canvas preview" };
  const W = el.width, H = el.height;
  const ctx = el.getContext("2d");
  if (!ctx) return { error: "không lấy được ctx 2d" };
  const d = ctx.getImageData(0, 0, W, H).data;
  const TH = 128;
  let sx = 0, sy = 0, n = 0, x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i] > TH) {
      sx += x; sy += y; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (!n) return { error: "không có pixel R>128", W, H };
  const cxC = sx / n + 0.5, cyC = sy / n + 0.5;
  const PW = window.__p3pw, PH = window.__p3ph;
  const s = Math.min(W / PW, H / PH);
  const dw = PW * s, dh = PH * s, dx = (W - dw) / 2, dy = (H - dh) / 2;
  const toProj = (xc, yc) => ({ x: (xc - dx) / dw, y: (yc - dy) / dh });
  const c = toProj(cxC, cyC);
  const out = {
    cx: +c.x.toFixed(4), cy: +c.y.toFixed(4),
    x0: +toProj(x0, 0).x.toFixed(4), x1: +toProj(x1 + 1, 0).x.toFixed(4),
    y0: +toProj(0, y0).y.toFixed(4), y1: +toProj(0, y1 + 1).y.toFixed(4),
    count: n, canvasW: W, canvasH: H, scale: +s.toFixed(5),
  };
  const rowY = Math.max(0, Math.min(H - 1, Math.round(cyC) - 1));
  const row = [], rowG = [];
  for (let x = 0; x < W; x++) {
    const i = (rowY * W + x) * 4;
    row.push(d[i]); rowG.push(d[i + 1]);
  }
  const mx = Math.max(...row);
  const sorted = [...row].sort((a, b) => a - b);
  const bgRow = sorted[Math.floor(sorted.length / 2)];
  if (mx - bgRow > 1) {
    const cc = Math.round(cxC);
    const at = (a, b, frac) => {
      const thr = bgRow + frac * (mx - bgRow), step = b > a ? 1 : -1;
      for (let x = a; x !== b; x += step) {
        const x2 = x + step;
        if ((row[x] - thr) * (row[x2] - thr) <= 0) {
          const dd = row[x2] - row[x];
          return dd === 0 ? x : x + (thr - row[x]) / dd;
        }
      }
      return b;
    };
    let lo = cc; while (lo > 0 && row[lo - 1] > bgRow + 0.1 * (mx - bgRow)) lo--;
    let hi = cc; while (hi < W - 1 && row[hi + 1] > bgRow + 0.1 * (mx - bgRow)) hi++;
    const l90 = at(cc, lo > 0 ? lo - 1 : 0, 0.9), l10 = at(cc, lo > 0 ? lo - 1 : 0, 0.1);
    const r90 = at(cc, hi < W - 1 ? hi + 1 : W - 1, 0.9), r10 = at(cc, hi < W - 1 ? hi + 1 : W - 1, 0.1);
    const l50 = at(cc, lo > 0 ? lo - 1 : 0, 0.5), r50 = at(cc, hi < W - 1 ? hi + 1 : W - 1, 0.5);
    out.edgeL_pxProj = +((Math.abs(l90 - l10) / s).toFixed(1));
    out.edgeR_pxProj = +((Math.abs(r90 - r10) / s).toFixed(1));
    out.w50_pxProj = +((Math.abs(r50 - l50) / s).toFixed(1));
    out.rowMax = Math.round(mx);
    // Đợt 91 S1 (điều tra R1 §5.2): phần lẻ của vị trí mép phải + tâm
    // mask theo canvas px — mép rộng có thể do pha sub-pixel (mép rơi
    // vào giữa 2 pixel → antialiasing trải rộng) hay do refill ring.
    out.r90frac = +((r90 - Math.floor(r90)).toFixed(3));
    out.cxCfrac = +((cxC - Math.floor(cxC)).toFixed(3));
    // S1: nửa rộng mask để trừ khi quét vệt lấy theo case
    // (__p3trailFrac — D: 0.27 do scale+xoay, còn lại 0.2).
    const trailFrac = typeof window.__p3trailFrac === "number" ? window.__p3trailFrac : 0.2;
    const sharpLeft = cxC - trailFrac * dw;
    let trailN = 0, trailFirst = -1;
    for (let x = 0; x < Math.floor(sharpLeft); x++) {
      if (row[x] > TH) { trailN++; if (trailFirst < 0) trailFirst = x; }
    }
    out.trail_left_n = trailN;
    out.trail_left_extent_pxProj = trailFirst >= 0 ? +(((sharpLeft - trailFirst) / s).toFixed(1)) : 0;
  }
  {
    const ix0 = Math.max(0, Math.floor(cxC - 0.10 * dw)), ix1 = Math.min(W, Math.ceil(cxC + 0.10 * dw));
    const iy0 = Math.max(0, Math.floor(cyC - 23)), iy1 = Math.min(H, Math.ceil(cyC + 23));
    let sum = 0, sum2 = 0, cnt = 0, mid = 0;
    for (let y = iy0; y < iy1; y++) for (let x = ix0; x < ix1; x++) {
      const g = d[(y * W + x) * 4 + 1];
      sum += g; sum2 += g * g; cnt++;
      if (g > 30 && g < 225) mid++;
    }
    const mean = sum / cnt, varr = Math.max(0, sum2 / cnt - mean * mean);
    out.gStd_core = +Math.sqrt(varr).toFixed(1);
    out.gMidFrac_core = +(mid / cnt).toFixed(3);
    out.gMean_core = +mean.toFixed(1);
    // Đợt 98 Z2: hàng G lõi (cùng ImageData với gStd) để đo offline
    // metric pha sọc thay gStd (xem LIMITS Z2 §4): pha cơ bản của sóng
    // vuông xác định frame giữa của cửa sổ blend, không nhạy pha như std.
    out.coreRowG = [];
    out.coreRowX0 = ix0;
    for (let x = ix0; x < ix1; x++) out.coreRowG.push(d[(rowY * W + x) * 4 + 1]);
  }
  {
    let h = 0;
    for (let k = 0; k < 64; k++) {
      const px = Math.floor((k * 7919) % (W * H));
      h = (h * 31 + d[px * 4] + d[px * 4 + 1] * 2) % 1000000007;
    }
    out.pixHash = h;
  }
  return out;
}`;

const MEASURE_FN = `(${MEASURE_FN_SRC})()`;

// --- Thống kê offline (Node) ---
const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const round1 = (v) => (v === null || v === undefined ? null : +Number(v).toFixed(1));
const round3 = (v) => (v === null || v === undefined ? null : +Number(v).toFixed(3));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-90r1-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1440,900", "--autoplay-policy=no-user-gesture-required", "about:blank",
], { stdio: "ignore" });
const cleanup = () => {
  try { chrome.kill("SIGKILL"); } catch { /* noop */ }
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* noop */ }
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

let target = null;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch { /* chưa lên */ }
  await sleep(500);
}
if (!target) { console.error("không kết nối được Chrome CDP"); process.exit(2); }
const cdp = new CDP(target.webSocketDebuggerUrl);
await cdp.connect();
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Page.navigate", { url: URL });
let booted = false;
for (let i = 0; i < 60; i++) {
  const hasCanvas = await cdp.eval(`!!document.querySelector("#vcut-preview-wrap canvas.preview-canvas")`, false).catch(() => false);
  if (hasCanvas) { booted = true; break; }
  await sleep(500);
}
if (!booted) { console.error("app không boot (không thấy canvas preview)"); process.exit(2); }
console.log("app boot OK");
if (DISABLE_RVFC) {
  await cdp.eval(`window.__vcutDisableRvfc = true;`, false);
  console.log("rVFC TẮT (baseline đường tick cũ)");
}

for (let i = 0; i < 20; i++) {
  const closed = await cdp.eval(`(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => x.textContent.trim() === "Để sau");
    if (b) { b.click(); return "closed"; }
    return "no-modal";
  })()`, false).catch(() => "err");
  if (closed === "closed") break;
  await sleep(500);
}
await sleep(500);

const allResults = {};
let assertFail = 0;
const assertLog = [];
function aok(cond, msg) {
  if (!ASSERT) return;
  if (cond) console.log(`   ✅ ${msg}`);
  else { assertFail++; assertLog.push(msg); console.log(`   ❌ ${msg}`); }
}

for (const job of jobs) {
  const spec = job.spec;
  const PW = spec.meta.width, PH = spec.meta.height;
  await cdp.eval(`window.__p3pw = ${PW}; window.__p3ph = ${PH}; window.__p3trailFrac = ${job.trailLeftFrac ?? 0.2};`, false);
  console.log(`\n== case ${job.name} (${job.specPath}) ==`);
  const specJson = JSON.stringify(spec).replace(/`/g, "\\`").replace(/\$/g, "\\$");
  const seeded = await cdp.eval(`(async () => {
    const st = await (${STORE_FN});
    st.replaceProject(${specJson});
    const names = [];
    for (const m of ${JSON.stringify(job.media)}) {
      const res = await fetch("/" + m);
      if (!res.ok) return { error: "fetch media lỗi " + res.status + " " + m };
      const blob = await res.blob();
      const file = new File([blob], m, { type: "video/mp4" });
      const st2 = await (${STORE_FN});
      await st2.importFiles([file]);
      names.push(m);
    }
    const st3 = await (${STORE_FN});
    return {
      media: (st3.media || []).map((m) => m.name),
      clips: (st3.spec.tracks[0]?.clips || []).map((c) => ({ id: c.id, src: c.src, mask: !!c.mask, track: !!c.track })),
      duration: st3.spec.meta.duration,
    };
  })()`);
  console.log("seed:", JSON.stringify(seeded));
  if (!seeded || seeded.error || !job.media.every((m) => (seeded.media || []).includes(m))) {
    console.error("seed media thất bại:", JSON.stringify(seeded));
    process.exit(2);
  }
  // Sanity: đủ pixel sáng (bẫy tên media của P3 — canvas đen vì thiếu media
  // chỉ có ~129 pixel sáng từ chữ "Thiếu media"). Poll chờ video decode
  // frame đầu (tới 10s) thay vì fail ngay sau seed.
  let sanity = null;
  for (let i = 0; i < 20; i++) {
    sanity = await cdp.eval(MEASURE_FN, false).catch((e) => ({ error: String(e).slice(0, 200) }));
    if (sanity && !sanity.error && (sanity.count || 0) >= 1000) break;
    await sleep(500);
  }
  if (!sanity || sanity.error || (sanity.count || 0) < 1000) {
    console.error("sanity canvas thất bại (thiếu media / canvas đen?):", JSON.stringify(sanity));
    process.exit(2);
  }
  console.log(`sanity canvas OK (count=${sanity.count})`);

  // --- 1. Pause baseline (blur không blend lúc pause — R3 gate) ---
  const pause = {};
  for (const t of TIMES) {
    await cdp.eval(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(${t}); return st.playhead; })()`);
    let last = null, stable = 0, cur = null;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      cur = await cdp.eval(MEASURE_FN, false).catch((e) => ({ error: String(e).slice(0, 200) }));
      if (cur && !cur.error && last && Math.abs(cur.cx - last.cx) < 0.0015 && Math.abs(cur.cy - last.cy) < 0.0015) {
        stable++;
        if (stable >= 2) break;
      } else stable = 0;
      last = cur;
    }
    pause[t] = cur || { error: "no-measure" };
    console.log(`pause t=${t}:`, JSON.stringify(pause[t]));
  }

  // --- 2. Play: ghi MỌI khung rAF (không lọc), neo video.currentTime ---
  // S1: đọc dbg TRƯỚC lượt phát để tính captures DELTA của riêng case
  // này (dbg là tích lũy từ đầu phiên — so sánh tuyệt đối với số frame
  // của case là vô nghĩa khi chạy nhiều case chung 1 trang).
  const dbgStart = await cdp.eval(`(() => {
    try {
      const map = window.__vcutMotionBlurSnapshots;
      if (!map) return null;
      const v = [...map.values()][0];
      return v ? { rvfcCaptures: v.rvfcCaptures ?? 0 } : null;
    } catch { return null; }
  })()`, false).catch(() => null);
  // Đợt 97 Y2: mốc seq pump/blend-tick log ĐẦU case (mảng tích lũy từ
  // đầu phiên — lọc seq > mốc để lấy đúng slice của case này, xem dưới).
  const y2SeqStart = await cdp.eval(`(() => {
    try {
      const p = window.__vcutRvfcPump || [];
      const b = window.__vcutRvfcBlendTick || [];
      return { pump: p.length ? p[p.length - 1].seq : -1, blend: b.length ? b[b.length - 1].seq : -1 };
    } catch { return { pump: -1, blend: -1 }; }
  })()`, false).catch(() => ({ pump: -1, blend: -1 }));
  const passes = [];
  for (let p = 0; p < PASSES; p++) {
    const frames = await cdp.eval(`(async () => {
      ${MEASURE_FN_SRC}
      let st = await (${STORE_FN});
      st.setPlayhead(0);
      // Video element của preview KHÔNG gắn vào DOM (MediaPool tạo detached)
      // nên không querySelector("video") được — đọc qua hook __vcutMediaEls
      // (mẫu Q5). vt = currentTime của element video đang phát.
      const vtOf = () => {
        const els = (window.__vcutMediaEls || []).filter((e) => e.tag === "VIDEO").map((e) => e.el);
        const vid = els.find((e) => !e.paused) || els[0];
        return vid ? +vid.currentTime.toFixed(4) : null;
      };
      // Chờ seek về 0 xong (element currentTime < 0.1) tối đa 5s — tránh
      // lượt phát bắt đầu bằng frame cũ (Q5 §6: playhead chạy trước canvas).
      for (let i = 0; i < 50; i++) {
        const v0 = vtOf();
        if (v0 === null || v0 < 0.1) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!st.playing) st.togglePlay();
      const out = [];
      let lastHash = null, lastPh = -1;
      for (let i = 0; i < 1500; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        const st2 = await (${STORE_FN});
        const ph = st2.playhead;
        const vt = vtOf();
        // Đợt 92 T2: đọc nhãn cửa sổ blend TRƯỚC VÀ SAU khi đo pixel —
        // __p3measure() (getImageData + phân tích) tốn hàng chục ms,
        // trong lúc đó app có thể tick và vẽ lại với cửa sổ mới (tick
        // nay ~33ms sau khi bỏ mask CPU, trước đây ~83ms nên hiếm gặp).
        // Chỉ giữ mẫu khi nhãn trước/sau GIỐNG NHAU: khi đó pixels đo
        // được chắc chắn thuộc về cửa sổ đó (mọi lần vẽ xen giữa mà đổi
        // cửa sổ đều làm nhãn sau khác nhãn trước → loại mẫu). Nhãn
        // trước đo là nhãn của lần vẽ tạo ra pixels (xem LIMITS §4).
        const dbgOf = () => {
          try {
            const mm = window.__vcutMotionBlurSnapshots;
            if (!mm) return null;
            const v = [...mm.values()][0];
            if (!v) return null;
            return { ring: v.ring, lastFrame: v.lastFrame, prevFrame: v.prevFrame ?? -1, lastDrawnFrameIdx: v.lastDrawnFrameIdx ?? -1, lastDrawnLastFrame: v.lastDrawnLastFrame ?? -1, lastDrawnPrevFrame: v.lastDrawnPrevFrame ?? -1, lastDrawnPresentedFrame: v.lastDrawnPresentedFrame ?? -1, lastDrawnRingSize: v.lastDrawnRingSize ?? -1, lastDrawnSkippedLatest: v.lastDrawnSkippedLatest ?? -1, rvfcCaptures: v.rvfcCaptures ?? null, rvfcSkippedDuplicate: v.rvfcSkippedDuplicate ?? null, ringClears: v.ringClears, rvfcActive: !!v.rvfcActive, rvfcFallback: v.rvfcFallback ?? "" };
          } catch { return null; }
        };
        const dbgBefore = dbgOf();
        const m = __p3measure();
        const dbgAfter = dbgOf();
        const drawnStable = !!dbgBefore && !!dbgAfter &&
          dbgBefore.lastDrawnFrameIdx === dbgAfter.lastDrawnFrameIdx &&
          dbgBefore.lastDrawnLastFrame === dbgAfter.lastDrawnLastFrame &&
          dbgBefore.lastDrawnPrevFrame === dbgAfter.lastDrawnPrevFrame &&
          // Đợt 96 X2: nhãn presented frame cũng phải ổn định qua lúc đo
          // (blend mới giữa chừng với presented khác → pixels của cửa sổ
          // cũ gán nhãn mới → loại như 3 trường trên).
          dbgBefore.lastDrawnPresentedFrame === dbgAfter.lastDrawnPresentedFrame &&
          // Đợt 96 X2 lượt 3: ringSize/skippedLatest lúc blend cũng phải
          // ổn định (blend mới giữa chừng có thể đổi 2 trường này mà giữ
          // nguyên 4 trường trên — vd refill thêm snapshot).
          dbgBefore.lastDrawnRingSize === dbgAfter.lastDrawnRingSize &&
          dbgBefore.lastDrawnSkippedLatest === dbgAfter.lastDrawnSkippedLatest;
        // dbgNow = nhãn trước đo (cửa sổ đã vẽ ra pixels); drawnStable
        // cho biết nhãn đó có còn đúng sau khi đo không.
        const dbgNow = dbgBefore ? { ...dbgBefore, drawnStable } : null;
        // Đóng băng = canvas không đổi VÀ playhead không chạy so với khung
        // rAF trước — khung lặp lại, không phải mẫu mới (vd lúc decoder
        // stall / seek chưa xong). Chỉ hash giống nhau thì CHƯA đủ: footage
        // sọc tuần hoàn 48px nên 2 frame cách nhau đúng 4 frame video
        // (48px) cho canvas giống hệt nhau nhưng là 2 mẫu hợp lệ khác nhau
        // (đã làm mất mẫu B t=0.5 ở lần đo đầu R1).
        const frozen = !m.error && lastHash !== null && m.pixHash === lastHash && ph === lastPh;
        out.push({ ph: +ph.toFixed(3), vt, frameIdx: vt !== null && vt >= 0 ? Math.floor(vt * 30) : null, frozen: !!frozen, dbg: dbgNow, ...m });
        if (!m.error) { lastHash = m.pixHash; lastPh = ph; }
        if (ph > 2.2) break;
      }
      const st3 = await (${STORE_FN});
      if (st3.playing) st3.togglePlay();
      // Hook debug motion blur (R1): ring + gate.
      let dbg = null;
      try {
        const map = window.__vcutMotionBlurSnapshots;
        dbg = map ? Object.fromEntries([...map.entries()].map(([k, v]) => [k, { ...v }])) : null;
      } catch { dbg = null; }
      return { frames: out, dbg };
    })()`).catch((e) => ({ __error: String(e).slice(0, 300) }));
    if (!frames || frames.__error) { console.error(`play pass ${p + 1} lỗi:`, frames?.__error); process.exit(2); }
    passes.push(frames);
    const nOk = frames.frames.filter((f) => !f.error).length;
    console.log(`play pass ${p + 1}: ${frames.frames.length} khung rAF, ${nOk} đo được, dbg=${JSON.stringify(frames.dbg)}`);
  }
  // Đợt 97 Y2: dump pump event log mở rộng + blend-tick log của riêng
  // case này (lọc theo seq — mảng tích lũy từ đầu phiên). Phân tích nối
  // mẫu 84 ↔ tick blend ↔ pump event làm offline bằng Python (không
  // assert ở đây — log chỉ để chẩn đoán, không khóa hành vi).
  const y2Logs = await cdp.eval(`((ps, bs) => {
    try {
      const p = (window.__vcutRvfcPump || []).filter((e) => e.seq > ps);
      const b = (window.__vcutRvfcBlendTick || []).filter((e) => e.seq > bs);
      return { pump: p, blendTick: b };
    } catch { return { pump: [], blendTick: [] }; }
  })(${Number(y2SeqStart.pump)}, ${Number(y2SeqStart.blend)})`, false).catch(() => ({ pump: [], blendTick: [] }));
  const y2Summary = (() => {
    const frameDur = 1000 / 30;
    const pump = y2Logs.pump || [], ticks = y2Logs.blendTick || [];
    const byDec = {};
    for (const e of pump) byDec[e.decision] = (byDec[e.decision] || 0) + 1;
    const caps = pump.filter((e) => e.decision === "capture" || e.decision === "reset-capture");
    const lateCaps = caps.filter((e) => e.lateMs !== null && e.lateMs > frameDur);
    const ctMismatch = caps.filter((e) => e.ctFrameIdx !== null && e.ctFrameIdx !== e.frameIdx);
    const presOff = {};
    for (const e of pump) {
      const d = e.presentedAtInvoke - e.frameIdx;
      presOff[d] = (presOff[d] || 0) + 1;
    }
    const tickOff = {};
    for (const t of ticks) {
      const d = t.presented - t.expected;
      tickOff[d] = (tickOff[d] || 0) + 1;
    }
    const lateTicks = ticks.filter((t) => t.lastPumpLateMs !== null && t.lastPumpLateMs > frameDur);
    return {
      pumpEvents: pump.length, byDecision: byDec,
      captures: caps.length, lateCaptures: lateCaps.length,
      lateCapSeqs: lateCaps.slice(0, 20).map((e) => e.seq),
      ctMismatchCaptures: ctMismatch.length,
      ctMismatchSeqs: ctMismatch.slice(0, 20).map((e) => e.seq),
      presentedAtInvokeMinusLabel: presOff,
      blendTicks: ticks.length, tickPresentedOffset: tickOff,
      ticksNoPump: ticks.filter((t) => t.lastPumpSeq < 0).length,
      ticksLatePump: lateTicks.length,
    };
  })();
  console.log(`Y2 pump log (case ${job.name}):`, JSON.stringify(y2Summary));

  // --- 3. Phân tích offline: 3 neo RIÊNG (mask theo playhead, nội dung
  // theo video frame, vệt/mép theo mọi khung) — bài học từ lần đo đầu R1:
  //   - cx (vị trí mask) bám PLAYHEAD (localT = ph), không bám vt: đo được
  //     cx = 0.3+0.2·ph chính xác tới ±0.001 trong khi vt lệch ph tới 0.25s
  //     (playhead chạy trước canvas sau seek — Q5 §6). Neo cx theo vt sẽ
  //     báo lệch giả tới 0.05.
  //   - gStd (pha sọc) bám VIDEO TIME (frame nguồn thật đang hiển thị).
  //   - trail/edge: mọi khung play không đóng băng (không chọn theo thời
  //     gian — vệt phải = 0 ở MỌI khung, không chỉ khung đúng mốc).
  const playFrames = [];
  for (let pi = 0; pi < passes.length; pi++) for (const f of passes[pi].frames) {
    if (!f.error && !f.frozen) playFrames.push({ ...f, pass: pi });
  }
  const allTrail = playFrames.map((f) => f.trail_left_n).filter((v) => typeof v === "number");
  const allEdgeL = playFrames.map((f) => f.edgeL_pxProj).filter((v) => typeof v === "number");
  const allEdgeR = playFrames.map((f) => f.edgeR_pxProj).filter((v) => typeof v === "number");
  const trailEdge = {
    nFrames: playFrames.length,
    trailMax: allTrail.length ? Math.max(...allTrail) : null,
    trailFramesGt0: allTrail.filter((v) => v > 0).length,
    edgeLMed: round1(median(allEdgeL)), edgeRMed: round1(median(allEdgeR)),
    edgeLMax: allEdgeL.length ? Math.max(...allEdgeL) : null,
    edgeRMax: allEdgeR.length ? Math.max(...allEdgeR) : null,
  };
  console.log(`play all-frames:`, JSON.stringify(trailEdge));
  if (ASSERT) {
    aok(trailEdge.trailMax === 0, `${job.name}: không vệt trái ở MỌI khung play (trailMax=${trailEdge.trailMax}, ${trailEdge.nFrames} khung)`);
    if (job.edgeMode === "rel") {
      // E (feather): mép rộng theo thiết kế — khóa ở mục so với pause bên dưới.
      console.log(`   (edge rel: mép play median ${trailEdge.edgeLMed}/${trailEdge.edgeRMed}px — so với pause ở từng mốc)`);
    } else {
      aok(trailEdge.edgeLMed !== null && trailEdge.edgeLMed <= job.edgeMax && trailEdge.edgeRMed <= job.edgeMax,
        `${job.name}: mép sắc mọi khung (edgeL/R median ${trailEdge.edgeLMed}/${trailEdge.edgeRMed} <= ${job.edgeMax}px)`);
    }
  }
  // --- Đợt 91 S1: điều tra mép phải max ở khung lẻ (R1 §5.2) ---
  // Khung "lẻ" = edgeR > 2.6px (trên max của pause baseline). Với mỗi
  // khung đó in (pass, frameIdx, ring, ringClears, r90frac, cxCfrac):
  //  - ring < 2 → ngay sau refill ring (seek/loop/pump mới tạo);
  //  - r90frac ~0.5 → mép rơi giữa 2 pixel (pha sub-pixel, antialiasing);
  //  - không khớp cái nào → chưa rõ nguyên nhân, ghi nhận.
  const oddEdge = playFrames.filter((f) => typeof f.edgeR_pxProj === "number" && f.edgeR_pxProj > 2.6)
    .map((f) => ({ pass: f.pass, ph: f.ph, frameIdx: f.frameIdx, edgeR: f.edgeR_pxProj, edgeL: f.edgeL_pxProj, ring: f.dbg?.ring ?? null, lastFrame: f.dbg?.lastFrame ?? null, ringClears: f.dbg?.ringClears ?? null, r90frac: f.r90frac ?? null, cxCfrac: f.cxCfrac ?? null }));
  const edgeByPhase = (lo, hi) => {
    const v = playFrames.filter((f) => typeof f.edgeR_pxProj === "number" && typeof f.r90frac === "number" && f.r90frac >= lo && f.r90frac < hi).map((f) => f.edgeR_pxProj);
    return v.length ? { n: v.length, med: round1(median(v)), max: Math.max(...v) } : null;
  };
  const edgeByRing = (pred) => {
    const v = playFrames.filter((f) => typeof f.edgeR_pxProj === "number" && f.dbg && pred(f.dbg.ring)).map((f) => f.edgeR_pxProj);
    return v.length ? { n: v.length, med: round1(median(v)), max: Math.max(...v) } : null;
  };
  const edgeInvestigation = {
    oddFrames: oddEdge.length,
    oddDetail: oddEdge.slice(0, 40),
    edgeRByR90fracMid: edgeByPhase(0.35, 0.65),
    edgeRByR90fracOuter: edgeByPhase(0, 0.35),
    edgeRByR90fracOuter2: edgeByPhase(0.65, 1.01),
    edgeRByRingLt2: edgeByRing((r) => r < 2),
    edgeRByRingEq2: edgeByRing((r) => r === 2),
  };
  console.log(`edge investigation (edgeR>2.6: ${oddEdge.length} khung):`, JSON.stringify(edgeInvestigation));
  // --- Đợt 91 S1: gStd spread theo frame (ổn định cửa sổ blend) ---
  // Nhóm mẫu theo CẶP (frameIdx, lastFrame): frameIdx = frame nguồn
  // đang hiển thị (lấy mẫu theo vt), lastFrame = snapshot mới nhất
  // trong ring — cặp này xác định gần đủ cửa sổ blend (ghost mới nhất
  // + frame hiện tại). Nhóm chỉ theo frameIdx là SAI: cùng frameIdx
  // nhưng lastFrame khác nhau (callback rVFC lag 1 tick) thì cửa sổ
  // khác nhau → spread giả lớn (E: 44.7 theo frameIdx, 0.05 theo cặp).
  // rVFC: cùng cặp → cùng cửa sổ blend liên tiếp → spread nhỏ.
  const byPair = new Map();
  for (const f of playFrames) {
    if (f.frameIdx === null || f.frameIdx === undefined || typeof f.gStd_core !== "number") continue;
    const lf = f.dbg?.lastFrame;
    if (typeof lf !== "number" || lf < 0) continue;
    const key = `${f.frameIdx}:${lf}`;
    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key).push(f);
  }
  const spreads = [];
  for (const [key, fs] of byPair) {
    const ps = new Set(fs.map((f) => f.pass));
    if (ps.size < 2) continue;
    const gs = fs.map((f) => f.gStd_core);
    const [fi, lf] = key.split(":").map(Number);
    spreads.push({ frameIdx: fi, lastFrame: lf, nPass: ps.size, n: fs.length, spread: +(Math.max(...gs) - Math.min(...gs)).toFixed(1), gStdMed: round1(median(gs)) });
  }
  const gStdSpread = {
    nGroups: spreads.length,
    spreadMed: spreads.length ? round1(median(spreads.map((s) => s.spread))) : null,
    spreadMax: spreads.length ? Math.max(...spreads.map((s) => s.spread)) : null,
    worst: [...spreads].sort((a, b) => b.spread - a.spread).slice(0, 5),
  };
  console.log(`gStd spread theo frame (nhóm ≥2 pass):`, JSON.stringify(gStdSpread));
  // --- Đợt 92 T2: gStd spread theo CỬA SỔ ĐÃ VẼ (khóa chính từ nay) ---
  // Nhóm theo (lastDrawnFrameIdx, lastDrawnPrevFrame, lastDrawnLastFrame)
  // mà drawVideoClip ghi đúng lúc blend — tức đúng cửa sổ tmix đã tạo
  // ra pixels của mẫu. Nhóm cũ (frameIdx theo vt + lastFrame đọc sau
  // đo) là NHÃN ƯỚC LƯỢNG: capture có thể rơi vào giữa lúc đo pixel
  // (harness đo mỗi khung bằng getImageData, tốn hàng chục ms) làm
  // lastFrame đọc sau mới hơn ring đã vẽ → gán nhầm cửa sổ → spread
  // giả lớn. Bằng chứng đợt 92 T2: tick nhanh (~30fps, sau khi bỏ mask
  // CPU) + capture dày (~20/s) làm spread-nhãn lên 29–46 trong khi
  // trail=0, mép đúng, captures tăng 2× — cửa sổ thật vẫn đúng, chỉ
  // nhãn sai. Chỉ tính mẫu có ring ≥ 1 và nhãn khung khớp cửa sổ đã
  // vẽ (lastDrawnFrameIdx === frameIdx theo vt); mẫu vẽ trực tiếp
  // (ring rỗng) không có cửa sổ blend nên loại khỏi nhóm này.
  const byDrawn = new Map();
  let nDrawnSkipped = 0;
  for (const f of playFrames) {
    if (f.frameIdx === null || f.frameIdx === undefined || typeof f.gStd_core !== "number") continue;
    const d = f.dbg;
    if (!d || d.ring < 1) { nDrawnSkipped++; continue; }
    // Đợt 92 T2: chỉ giữ mẫu mà nhãn cửa sổ đã vẽ ỔN ĐỊNH qua lúc đo
    // pixel (drawnStable — app không vẽ lại với cửa sổ khác trong lúc
    // đo); mẫu nhãn đổi giữa chừng là pixels của cửa sổ cũ gán nhãn
    // mới → loại, không tính vào spread.
    if (!d.drawnStable) { nDrawnSkipped++; continue; }
    if (d.lastDrawnFrameIdx !== f.frameIdx) { nDrawnSkipped++; continue; }
    if (typeof d.lastDrawnLastFrame !== "number" || d.lastDrawnLastFrame < 0) { nDrawnSkipped++; continue; }
    const key = `${d.lastDrawnFrameIdx}:${d.lastDrawnPrevFrame ?? -1}:${d.lastDrawnLastFrame}`;
    if (!byDrawn.has(key)) byDrawn.set(key, []);
    byDrawn.get(key).push(f);
  }
  const spreadsDrawn = [];
  for (const [key, fs] of byDrawn) {
    const ps = new Set(fs.map((f) => f.pass));
    if (ps.size < 2) continue;
    const gs = fs.map((f) => f.gStd_core);
    const [fi, pf, lf] = key.split(":").map(Number);
    spreadsDrawn.push({ frameIdx: fi, prevFrame: pf, lastFrame: lf, nPass: ps.size, n: fs.length, spread: +(Math.max(...gs) - Math.min(...gs)).toFixed(1), gStdMed: round1(median(gs)) });
  }
  const gStdSpreadDrawn = {
    nGroups: spreadsDrawn.length,
    nSkipped: nDrawnSkipped,
    spreadMed: spreadsDrawn.length ? round1(median(spreadsDrawn.map((s) => s.spread))) : null,
    spreadMax: spreadsDrawn.length ? Math.max(...spreadsDrawn.map((s) => s.spread)) : null,
    worst: [...spreadsDrawn].sort((a, b) => b.spread - a.spread).slice(0, 5),
  };
  console.log(`gStd spread theo cửa sổ ĐÃ VẼ (nhóm ≥2 pass):`, JSON.stringify(gStdSpreadDrawn));
  // --- Đợt 96 X2: chẩn đoán theo frame TRÌNH CHIẾU (không khóa assert) ---
  // Nhóm như trên nhưng tách thêm theo lastDrawnPresentedFrame — cửa sổ
  // blend THẬT là (ghost..., presented): 2 mẫu cùng (frameIdx,prev,last)
  // nhưng presented khác nhau (K vs K+1) là 2 cửa sổ khác nhau sau fix
  // (ghost {K-2,K-1} + current K hoặc K+1). Chỉ chẩn đoán: nhóm W4 ở
  // trên giữ nguyên để số so được trực tiếp với đợt 95.
  // Đồng thời đếm offset presented - frameIdx (0 = trình chiếu đúng
  // frame currentTime, +1 = đã lật sang frame kế) kèm gStd median từng
  // offset — sau fix cả 2 offset đều phải về ~37,5 ở spec B (tmix đúng
  // của frame trình chiếu); offset +1 còn gStd ~84,6 nghĩa là ước lượng
  // presented sai (blend đã dùng ghost cũ) — xem LIMITS đợt 96 X2 §3.
  const byDrawnPresented = new Map();
  const byPresentedOffset = new Map();
  for (const f of playFrames) {
    if (f.frameIdx === null || f.frameIdx === undefined || typeof f.gStd_core !== "number") continue;
    const d = f.dbg;
    if (!d || d.ring < 1 || !d.drawnStable) continue;
    if (d.lastDrawnFrameIdx !== f.frameIdx) continue;
    if (typeof d.lastDrawnLastFrame !== "number" || d.lastDrawnLastFrame < 0) continue;
    const pf = typeof d.lastDrawnPresentedFrame === "number" ? d.lastDrawnPresentedFrame : -1;
    // Đợt 96 X2 lượt 3: tách thêm theo ringSize + skippedLatest LÚC BLEND
    // (không phải ring đọc sau) — 2 mẫu cùng (frameIdx,prev,last,presented)
    // nhưng khác ring lúc blend (vd vừa refill sau clear) hoặc khác quyết
    // định skip thì blend khác nhau, gộp chung sẽ cho spread giả.
    const key = `${d.lastDrawnFrameIdx}:${d.lastDrawnPrevFrame ?? -1}:${d.lastDrawnLastFrame}:${pf}:${d.lastDrawnRingSize ?? -1}:${d.lastDrawnSkippedLatest ?? -1}`;
    if (!byDrawnPresented.has(key)) byDrawnPresented.set(key, []);
    byDrawnPresented.get(key).push(f);
    const off = pf >= 0 ? pf - f.frameIdx : null;
    const okey = off === null ? "unknown" : String(off);
    if (!byPresentedOffset.has(okey)) byPresentedOffset.set(okey, []);
    byPresentedOffset.get(okey).push(f.gStd_core);
  }
  const spreadsDrawnPresented = [];
  for (const [key, fs] of byDrawnPresented) {
    const ps = new Set(fs.map((f) => f.pass));
    if (ps.size < 2) continue;
    const gs = fs.map((f) => f.gStd_core);
    const [fi, pf2, lf, pres, rsz, skp] = key.split(":").map(Number);
    spreadsDrawnPresented.push({ frameIdx: fi, prevFrame: pf2, lastFrame: lf, presentedFrame: pres, ringSize: rsz, skippedLatest: skp, nPass: ps.size, n: fs.length, spread: +(Math.max(...gs) - Math.min(...gs)).toFixed(1), gStdMed: round1(median(gs)) });
  }
  const gStdSpreadDrawnPresented = {
    nGroups: spreadsDrawnPresented.length,
    spreadMed: spreadsDrawnPresented.length ? round1(median(spreadsDrawnPresented.map((s) => s.spread))) : null,
    spreadMax: spreadsDrawnPresented.length ? Math.max(...spreadsDrawnPresented.map((s) => s.spread)) : null,
    worst: [...spreadsDrawnPresented].sort((a, b) => b.spread - a.spread).slice(0, 5),
    byPresentedOffset: [...byPresentedOffset.entries()].map(([off, gs]) => ({ offset: off, n: gs.length, gStdMed: round1(median(gs)), gStdMin: Math.min(...gs), gStdMax: Math.max(...gs) })),
  };
  console.log(`gStd spread theo cửa sổ ĐÃ VẼ + presented (Đợt 96 X2, chẩn đoán):`, JSON.stringify(gStdSpreadDrawnPresented));
  const analysis = {};
  for (const t of TIMES) {
    // cx: SO TỪNG KHUNG với track(ph của chính khung đó) — không so median
    // cx với track(t): các mẫu ph trong cửa sổ không đối xứng quanh t nên
    // median cx lệch khỏi track(t) tới 0.014 dù từng khung đều đúng tới
    // ±0.001 (bẫy ở lần đo đầu R1). Cửa sổ ph rộng ±0.13 (≈1 tick lúc tải
    // nặng) chỉ để đủ mẫu; tính đúng/sai nằm ở độ lệch từng khung.
    const selCx = playFrames.filter((f) => Math.abs(f.ph - t) <= 0.13);
    const cxDevs = selCx.map((f) => Math.abs(f.cx - job.expectCx(f.ph))).filter((v) => Number.isFinite(v));
    const cxVals = selCx.map((f) => f.cx).filter((v) => typeof v === "number");
    // gStd: khung có videoTime gần mốc (pha sọc theo frame nguồn).
    const selG = playFrames.filter((f) => f.vt !== null && Math.abs(f.vt - t) <= 0.067);
    const gStd = selG.map((f) => f.gStd_core).filter((v) => typeof v === "number");
    const gMid = selG.map((f) => f.gMidFrac_core).filter((v) => typeof v === "number");
    const w50 = selCx.map((f) => f.w50_pxProj).filter((v) => typeof v === "number");
    const edgeLms = selCx.map((f) => f.edgeL_pxProj).filter((v) => typeof v === "number");
    const edgeRms = selCx.map((f) => f.edgeR_pxProj).filter((v) => typeof v === "number");
    analysis[t] = {
      nCx: selCx.length, nG: selG.length,
      cxMed: round3(median(cxVals)), cxMin: cxVals.length ? Math.min(...cxVals) : null, cxMax: cxVals.length ? Math.max(...cxVals) : null,
      cxDevMed: round3(median(cxDevs)), cxDevMax: cxDevs.length ? +Math.max(...cxDevs).toFixed(4) : null,
      w50Med: round1(median(w50)),
      edgeLMed: round1(median(edgeLms)), edgeRMed: round1(median(edgeRms)),
      gStdMed: round1(median(gStd)), gStdMin: gStd.length ? Math.min(...gStd) : null, gStdMax: gStd.length ? Math.max(...gStd) : null,
      gMidMed: round3(median(gMid)),
      pauseGStd: pause[t]?.gStd_core ?? null, pauseCx: pause[t]?.cx ?? null,
      pauseEdgeL: pause[t]?.edgeL_pxProj ?? null, pauseEdgeR: pause[t]?.edgeR_pxProj ?? null,
    };
    console.log(`play t=${t} (cx: lệch từng khung theo ph±0.13, gStd neo vt±0.067):`, JSON.stringify(analysis[t]));
    if (ASSERT && job.expectCx) {
      aok(selCx.length >= 2, `${job.name} t=${t}: đủ mẫu cx theo playhead (n=${selCx.length} >= 2)`);
      aok(analysis[t].cxDevMed !== null && analysis[t].cxDevMed <= 0.005,
        `${job.name} t=${t}: tâm đúng track theo playhead từng khung (lệch median ${analysis[t].cxDevMed} <= 0.005, max ${analysis[t].cxDevMax})`);
      aok(selG.length >= 2, `${job.name} t=${t}: đủ mẫu gStd theo videoTime (n=${selG.length} >= 2)`);
      if (job.blurExpected) {
        const base = pause[t]?.gStd_core;
        aok(base !== undefined && base !== null && analysis[t].gStdMed !== null && analysis[t].gStdMed <= 0.85 * base,
          `${job.name} t=${t}: blur nội dung thật (gStd play median ${analysis[t].gStdMed} <= 0.85 x baseline pause ${base})`);
      } else {
        const base = pause[t]?.gStd_core;
        aok(base !== undefined && base !== null && analysis[t].gStdMed !== null &&
          Math.abs(analysis[t].gStdMed - base) <= 0.10 * base,
          `${job.name} t=${t}: blur là identity với nguồn tĩnh (|gStd play ${analysis[t].gStdMed} - baseline ${base}| <= 10%)`);
      }
      if (job.w50Scale) {
        // D: mask scale theo keyframes — w50 = 512 * scale(t).
        const expectW50 = 512 * job.w50Scale(t);
        aok(analysis[t].w50Med !== null && Math.abs(analysis[t].w50Med - expectW50) <= 20,
          `${job.name} t=${t}: w50 theo scale keyframes (đo ${analysis[t].w50Med}, kỳ vọng ${+expectW50.toFixed(1)} ±20px)`);
      }
      if (job.edgeMode === "rel") {
        // E (feather): mép play phải ≈ mép pause cùng feather (blur
        // không làm mép feather rộng thêm); và mép phải rộng rõ (> 30px)
        // để chứng minh feather thật sự có hiệu lực.
        const pR = pause[t]?.edgeR_pxProj ?? null;
        const pL = pause[t]?.edgeL_pxProj ?? null;
        aok(pR !== null && analysis[t].edgeRMed !== null && Math.abs(analysis[t].edgeRMed - pR) <= 15,
          `${job.name} t=${t}: mép feather play ≈ pause (|edgeR ${analysis[t].edgeRMed} - pause ${pR}| <= 15px)`);
        aok(pL !== null && analysis[t].edgeLMed !== null && Math.abs(analysis[t].edgeLMed - pL) <= 15,
          `${job.name} t=${t}: mép feather play ≈ pause (|edgeL ${analysis[t].edgeLMed} - pause ${pL}| <= 15px)`);
        aok(analysis[t].edgeRMed !== null && analysis[t].edgeRMed >= 30,
          `${job.name} t=${t}: feather có hiệu lực (edgeR play ${analysis[t].edgeRMed} >= 30px)`);
      }
    }
  }
  // gStd spread theo cửa sổ ĐÃ VẼ (đợt 92 T2 — khóa chính): cùng cửa sổ
  // blend thật → cùng gStd qua các pass. Ngưỡng 15 giữ như S1. Nhóm cũ
  // theo (frameIdx,lastFrame) đọc sau đo chỉ còn là chẩn đoán (in ra
  // ở trên): nhãn đó lệch khi capture rơi vào giữa lúc đo pixel, nên
  // spread-nhãn 29–46 ở đợt 92 T2 KHÔNG phải lỗi sản phẩm — bằng chứng
  // là spread theo cửa sổ đã vẽ ≈ 0 trong khi trail=0, mép đúng.
  // Chỉ khóa khi đủ nhóm (nGroups >= 5), như quy tắc cũ của S1.
  if (ASSERT && job.blurExpected) {
    if (gStdSpreadDrawn.nGroups >= 5) {
      aok(gStdSpreadDrawn.spreadMed !== null && gStdSpreadDrawn.spreadMed <= 15,
        `${job.name}: gStd ổn định theo cửa sổ blend ĐÃ VẼ với rVFC (spread median ${gStdSpreadDrawn.spreadMed} <= 15, max ${gStdSpreadDrawn.spreadMax}, nGroups=${gStdSpreadDrawn.nGroups}, skipped=${gStdSpreadDrawn.nSkipped})`);
    } else {
      console.log(`   (bỏ qua assert spread ${job.name}: chỉ ${gStdSpreadDrawn.nGroups} nhóm cửa sổ đã vẽ lặp lại — thiếu mẫu, không kết luận)`);
    }
  }
  // Pump rVFC có chạy? (debug hook S1 — thay assert gate tick của R1)
  if (ASSERT) {
    const lastDbg = passes[passes.length - 1]?.dbg;
    const vals = lastDbg ? Object.values(lastDbg) : [];
    const v0 = vals.length ? vals[0] : null;
    const ring = v0 ? v0.ring : null;
    const skipped = v0 ? v0.skippedDuplicate : null;
    const rvfcActive = v0 ? !!v0.rvfcActive : false;
    const rvfcCaptures = v0 ? (v0.rvfcCaptures ?? 0) : 0;
    const rvfcFallback = v0 ? (v0.rvfcFallback ?? "") : "";
    // Đợt 96 X2: ring nay giữ frames snapshot (= 3 với mọi spec a–e,
    // không phải frames-1 = 2) — xem compositeMotionBlurLayer: tập ghost
    // loại snapshot trùng frame hiện tại nên cần đủ frames snapshot
    // trong ring mới blend được tmix đủ frames.
    aok(ring === 3, `${job.name}: ring snapshot = frames = 3 sau phát (đo ${ring})`);
    if (rvfcActive) {
      // Đường rVFC: capture (delta trong case này) phải phủ mọi frame
      // video đã lấy mẫu trong case.
      const distinctFrames = new Set(playFrames.map((f) => f.frameIdx).filter((x) => x !== null && x !== undefined)).size;
      const capturesDelta = rvfcCaptures - (dbgStart?.rvfcCaptures ?? 0);
      aok(rvfcFallback === "", `${job.name}: pump rVFC không fallback (rvfcFallback="${rvfcFallback}")`);
      aok(capturesDelta >= Math.max(0, distinctFrames - 2),
        `${job.name}: rVFC capture phủ frame đã trình chiếu trong case (captures delta=${capturesDelta} >= frame phân biệt đã lấy mẫu ${distinctFrames} - 2)`);
      console.log(`   (rVFC: captures total=${rvfcCaptures}, delta case=${capturesDelta}, distinctSampledFrames=${distinctFrames}, skippedDuplicate(tick)=${skipped})`);
    } else {
      // Fallback về đường tick (R1): gate bỏ qua tick trùng frame.
      aok(typeof skipped === "number" && skipped > 0, `${job.name}: gate bỏ qua tick trùng frame (skippedDuplicate=${skipped} > 0)`);
      console.log(`   (fallback đường tick: rvfcActive=false, rvfcFallback="${rvfcFallback}")`);
    }
  }
  allResults[job.name] = { spec: path.basename(job.specPath), media: job.media, pause, passes: passes.map((p) => p.frames), dbg: passes.map((p) => p.dbg), trailEdge, analysis, edgeInvestigation, gStdSpread, gStdSpreadDrawn, gStdSpreadDrawnPresented, y2: y2Logs, y2Summary };
}

const finalOut = { mode: ASSERT ? "assert" : "measure", passes: PASSES, results: allResults };
console.log("\nKẾT QUẢ:", JSON.stringify(finalOut, null, 1).slice(0, 4000));
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(finalOut, null, 1)); }
cdp.close();
cleanup();
if (ASSERT && assertFail > 0) {
  console.error(`\nASSERT FAIL: ${assertFail} kiểm tra fail:\n- ${assertLog.join("\n- ")}`);
  process.exit(1);
}
if (ASSERT) console.log("\nASSERT PASS: tất cả kiểm tra xanh");
