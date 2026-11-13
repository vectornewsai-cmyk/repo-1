#!/usr/bin/env node
/**
 * probe90r1-motionblur-preview.cdp.mjs — Phase 9 đợt 90, luồng R1: đo lại
 * A/B/C play sau khi sửa hướng (iii) (snapshot theo frame video + mask 1
 * lần sau blend), và KHÓA số preview bằng --assert.
 *
 * Cải tiến harness so với Q2 (§11 mục 1 — bắt mốc ổn định hơn):
 *   - Neo theo VIDEO.currentTime (frame thật đang hiển thị), không neo
 *     theo store playhead (Q5 §6: playhead chạy trước canvas lúc phát sau
 *     seek) và KHÔNG lọc theo cửa sổ cx (Q2 §3.4: lọc cx loại đúng các
 *     khung bị vệt ghost → mẫu "sạch" có điều kiện, thiên lệch).
 *   - Ghi MỌI khung rAF trong lúc phát (playhead + videoTime + đo pixel
 *     đầy đủ) rồi phân tích offline: với mỗi mốc t, chọn các khung có
 *     |videoTime - t| <= 0.04 và báo median + min/max + số mẫu — phân phối
 *     đầy đủ, không cherry-pick.
 *   - 2 lượt phát mỗi case để kiểm tra ổn định; đọc hook debug
 *     window.__vcutMotionBlurSnapshots để chứng minh gate snapshot theo
 *     frame có chạy (ring = frames-1, skippedDuplicate > 0).
 *
 * SETUP (như Q2):
 *   1. Media stripes-static.mp4 / stripes-scroll.mp4 trong apps/web/public/
 *      (gen bằng PIL+ffmpeg, xem ~/workspace/round90-r1/media/; KHÔNG stage binary).
 *   2. Chạy vite dev ở gốc apps/web: npm run dev -- --port 5173 --host 127.0.0.1
 *   3. Chạy từ gốc repo:
 *        node apps/web/scripts/probe90r1-motionblur-preview.cdp.mjs \
 *          --spec ~/workspace/round90-r1/specs/b-blur.json \
 *          --media stripes-scroll.mp4 [--passes 2] [--assert] \
 *          [--out ~/workspace/round90-r1/out/preview-b.json]
 *      Hoặc đo cả 3 case: --cases a,b,c (spec tự suy từ tên case).
 *
 * Kỳ vọng (so với render canonical Q2 + baseline pause trong cùng lượt):
 *   - trail_left_n = 0 ở MỌI khung play không đóng băng (render trail = 0, 18/18).
 *   - edgeL/R median ≤ 3px trên mọi khung (pause baseline 1.1–2.6px).
 *   - cx: neo theo PLAYHEAD (mask vẽ theo localT = ph, đo được cx =
 *     0.3+0.2·ph ±0.001; vt lệch ph tới 0.25s nên không neo cx theo vt).
 *     So TỪNG KHUNG với track(ph của khung đó): lệch median ≤ 0.005
 *     (A/C: track 0.3+0.2t; B: 0.5). Không so median cx với track(t)
 *     (mẫu ph không đối xứng quanh t làm lệch giả tới 0.014).
 *   - gStd play (neo theo videoTime, |vt-t|<=0.067): B/C ≤ 0.85 × baseline
 *     pause cùng mốc (blur nội dung thật; render B: 127→43–96 theo pha);
 *     A ≈ baseline ±10% (nguồn tĩnh → blur là identity, MAD render = 0.0).
 * --assert: exit 1 khi bất kỳ kiểm tra nào trên fail (kể cả thiếu mẫu:
 *   mỗi (case, mốc) cần ≥ 2 khung cx và ≥ 2 khung gStd); exit 0 khi tất cả xanh.
 * KHÔNG tự kết luận pass/fail khi không có --assert — chỉ in số đo thô.
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
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9229"));

// Case -> spec/media mặc định (như test render Q2).
const CASE_DEFS = {
  a: { spec: "a-blur.json", media: ["stripes-static.mp4"], expectCx: (t) => 0.3 + 0.2 * t, blurExpected: false },
  b: { spec: "b-blur.json", media: ["stripes-scroll.mp4"], expectCx: () => 0.5, blurExpected: true },
  c: { spec: "c-blur.json", media: ["stripes-scroll.mp4"], expectCx: (t) => 0.3 + 0.2 * t, blurExpected: true },
};
const SPEC_DIR = path.join(os.homedir(), "workspace/round90-r1/specs");

let jobs = [];
if (CASES) {
  for (const c of CASES.split(",").map((s) => s.trim()).filter(Boolean)) {
    const d = CASE_DEFS[c];
    if (!d) { console.error(`case không biết: ${c} (a/b/c)`); process.exit(2); }
    jobs.push({ name: c, specPath: path.join(SPEC_DIR, d.spec), media: d.media, expectCx: d.expectCx, blurExpected: d.blurExpected });
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
    const sharpLeft = cxC - 0.2 * dw;
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
  await cdp.eval(`window.__p3pw = ${PW}; window.__p3ph = ${PH};`, false);
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
        const m = __p3measure();
        // Đóng băng = canvas không đổi VÀ playhead không chạy so với khung
        // rAF trước — khung lặp lại, không phải mẫu mới (vd lúc decoder
        // stall / seek chưa xong). Chỉ hash giống nhau thì CHƯA đủ: footage
        // sọc tuần hoàn 48px nên 2 frame cách nhau đúng 4 frame video
        // (48px) cho canvas giống hệt nhau nhưng là 2 mẫu hợp lệ khác nhau
        // (đã làm mất mẫu B t=0.5 ở lần đo đầu R1).
        const frozen = !m.error && lastHash !== null && m.pixHash === lastHash && ph === lastPh;
        out.push({ ph: +ph.toFixed(3), vt, frozen: !!frozen, ...m });
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
  for (const ps of passes) for (const f of ps.frames) {
    if (!f.error && !f.frozen) playFrames.push(f);
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
    aok(trailEdge.edgeLMed !== null && trailEdge.edgeLMed <= 3 && trailEdge.edgeRMed <= 3,
      `${job.name}: mép sắc mọi khung (edgeL/R median ${trailEdge.edgeLMed}/${trailEdge.edgeRMed} <= 3px)`);
  }
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
    analysis[t] = {
      nCx: selCx.length, nG: selG.length,
      cxMed: round3(median(cxVals)), cxMin: cxVals.length ? Math.min(...cxVals) : null, cxMax: cxVals.length ? Math.max(...cxVals) : null,
      cxDevMed: round3(median(cxDevs)), cxDevMax: cxDevs.length ? +Math.max(...cxDevs).toFixed(4) : null,
      w50Med: round1(median(w50)),
      gStdMed: round1(median(gStd)), gStdMin: gStd.length ? Math.min(...gStd) : null, gStdMax: gStd.length ? Math.max(...gStd) : null,
      gMidMed: round3(median(gMid)),
      pauseGStd: pause[t]?.gStd_core ?? null, pauseCx: pause[t]?.cx ?? null,
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
    }
  }
  // Gate snapshot theo frame có chạy? (debug hook R1)
  if (ASSERT) {
    const lastDbg = passes[passes.length - 1]?.dbg;
    const vals = lastDbg ? Object.values(lastDbg) : [];
    const ring = vals.length ? vals[0].ring : null;
    const skipped = vals.length ? vals[0].skippedDuplicate : null;
    aok(ring === 2, `${job.name}: ring snapshot = frames-1 = 2 sau phát (đo ${ring})`);
    aok(typeof skipped === "number" && skipped > 0, `${job.name}: gate bỏ qua tick trùng frame (skippedDuplicate=${skipped} > 0)`);
  }
  allResults[job.name] = { spec: path.basename(job.specPath), media: job.media, pause, passes: passes.map((p) => p.frames), dbg: passes.map((p) => p.dbg), trailEdge, analysis };
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
