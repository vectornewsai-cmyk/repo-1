#!/usr/bin/env node
/**
 * probe88p3-mask-track-parity.cdp.mjs — Phase 9 đợt 88, luồng P3: đo parity
 * preview–render cho các combo mask+track chưa đo pixel (nợ O4, LIMITS
 * gộp đợt 87 §4 mục 8): keyframes w/h + track, feather > 0, SR
 * (scale/rotation keyframes), motion blur (khi đang phát), transition
 * (trong cửa sổ chuyển cảnh).
 *
 * SETUP (trước khi chạy):
 *   1. Đặt media vào apps/web/public/ (VD white720-p3.mp4, black720-p3.mp4
 *      — tạo bằng ffmpeg, xem /tmp/round88-p3; XÓA sau khi đo xong, KHÔNG
 *      stage binary).
 *   2. Chạy vite dev ở gốc apps/web: npm run dev -- --port 5173 --host 127.0.0.1
 *   3. Chạy từ gốc repo:
 *        node apps/web/scripts/probe88p3-mask-track-parity.cdp.mjs \
 *          --spec /tmp/round88-p3/specs/a-keyframes.json \
 *          --media white720-p3.mp4[,black720-p3.mp4] \
 *          --times 0.5,1,1.5 [--mode pause|play] [--threshold 128] \
 *          [--out /tmp/round88-p3/out/preview-a.json]
 *
 * Luồng: mở app thật (Chromium headless qua CDP) → replaceProject với spec
 * từ --spec → importFiles các media SAU replaceProject (replaceProject
 * reset media: [] — phát hiện của O4) → từng mốc: pause thì setPlayhead +
 * poll tới khi tâm ổn định 2 lần liên tiếp; play thì phát từ mốc-0.5s và
 * đo ngay khi playhead chạm mốc (để motion-blur snapshots kịp đầy ring)
 * → đọc pixel canvas preview thật (#vcut-preview-wrap canvas.preview-canvas)
 * → tâm/bbox vùng sáng + profile ngang qua hàng centroid (độ rộng biên
 * 10%-90%, bề rộng tại 50% max) → đổi về hệ project bằng fit-rect tính
 * từ kích thước canvas thật + tỉ lệ khung hình project (không hard-code
 * 872x276 như O4).
 *
 * KHÔNG tự kết luận pass/fail — in số đo thô (project coords + px @720p),
 * parent/so sánh với render. Dùng cho mọi case P3 (a/b/c/d/e) chỉ bằng
 * cách đổi --spec/--times/--mode.
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
const URL = opt("--url", "http://127.0.0.1:5173/");
const SPEC = opt("--spec", "");
const MEDIA = opt("--media", "white720-p3.mp4").split(",").map((s) => s.trim()).filter(Boolean);
const TIMES = opt("--times", "0.5,1,1.5").split(",").map(Number);
const MODE = opt("--mode", "pause");
const THRESHOLD = Number(opt("--threshold", "128"));
const OUT = opt("--out", "");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9226"));

if (!SPEC || !fs.existsSync(SPEC)) { console.error("thiếu --spec (file spec JSON)"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(SPEC, "utf8"));
const PW = spec.meta.width, PH = spec.meta.height;

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

// Đọc store thật mà app đã nạp (mẫu O4).
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p3storeMod || (window.__p3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Đo tâm/bbox/profile trên canvas preview thật, đổi về hệ project bằng
// fit-rect tính từ kích thước canvas + tỉ lệ khung hình project.
const MEASURE_FN_SRC = `function __p3measure() {
  const el = document.querySelector("#vcut-preview-wrap canvas.preview-canvas");
  if (!el) return { error: "không thấy canvas preview" };
  const W = el.width, H = el.height;
  const ctx = el.getContext("2d");
  if (!ctx) return { error: "không lấy được ctx 2d" };
  const d = ctx.getImageData(0, 0, W, H).data;
  const TH = ${THRESHOLD};
  let sx = 0, sy = 0, n = 0, x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (l > TH) {
      sx += x; sy += y; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (!n) return { error: "không có pixel sáng", W, H };
  const cxC = sx / n + 0.5, cyC = sy / n + 0.5;
  // Fit-rect: project PWxPH fit vào canvas WxH (giữ tỉ lệ, căn giữa).
  const PW = ${PW}, PH = ${PH};
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
  // Profile ngang qua hàng centroid (canvas coords): biên 10%-90% + w50.
  const rowY = Math.max(0, Math.min(H - 1, Math.round(cyC) - 1));
  const row = [];
  for (let x = 0; x < W; x++) {
    const i = (rowY * W + x) * 4;
    row.push((d[i] + d[i + 1] + d[i + 2]) / 3);
  }
  const mx = Math.max(...row);
  // Nền hàng (median) — trong cửa sổ transition nền không phải 0.
  const sorted = [...row].sort((a, b) => a - b);
  const bgRow = sorted[Math.floor(sorted.length / 2)];
  if (mx - bgRow > 1) {
    const cc = Math.round(cxC);
    const at = (a, b, frac) => {
      // Ngưỡng theo nền: bgRow + frac*(mx-bgRow) (khớp measure88p3.py).
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
    // Đổi px canvas -> px @khung project (chia scale).
    out.edgeL_pxProj = +((Math.abs(l90 - l10) / s).toFixed(1));
    out.edgeR_pxProj = +((Math.abs(r90 - r10) / s).toFixed(1));
    out.w50_pxProj = +((Math.abs(r50 - l50) / s).toFixed(1));
    out.rowMax = Math.round(mx);
  }
  return out;
}`;

// Dạng IIFE để gọi trực tiếp (nhánh pause).
const MEASURE_FN = `(${MEASURE_FN_SRC})()`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-88p3-"));
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
  const has = await cdp.eval(`!!document.querySelector("#vcut-preview-wrap canvas.preview-canvas")`, false).catch(() => false);
  if (has) { booted = true; break; }
  await sleep(500);
}
if (!booted) { console.error("app không boot (không thấy canvas preview)"); process.exit(2); }
console.log("app boot OK");

// Đóng modal chào mừng (profile mới) nếu có.
// Đóng modal chào mừng: poll tới 10s vì modal chỉ mount khi ready=true
// (bấm 1 lần ngay sau boot có thể trượt — lần đo A đầu tiên của P3).
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

// Seed: replaceProject TRƯỚC, rồi importFiles SAU (mẫu O4).
const specJson = JSON.stringify(spec).replace(/`/g, "\\`").replace(/\$/g, "\\$");
const seeded = await cdp.eval(`(async () => {
  const st = await (${STORE_FN});
  st.replaceProject(${specJson});
  const names = [];
  for (const m of ${JSON.stringify(MEDIA)}) {
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
if (!seeded || seeded.error || !MEDIA.every((m) => (seeded.media || []).includes(m))) {
  console.error("seed media thất bại:", JSON.stringify(seeded));
  process.exit(2);
}

const results = [];
for (const t of TIMES) {
  let cur = null;
  if (MODE === "play") {
    // Phát từ trước mốc 0.5s để ring motion-blur kịp đầy; đo TRONG TRANG
    // theo rAF (tránh lệch thời gian do CDP round-trip khi poll từ Node:
    // lần đo cũ overshoot playhead tới +0.57s). Đo ngay trong task rAF mà
    // playhead chạm mốc; playheadAtMeasure ghi lại để so với track tại
    // đúng thời điểm đó (sai số còn lại ±1 frame do canvas vẽ lệch tick).
    const startT = Math.max(0, t - 0.5);
    cur = await cdp.eval(`(async () => {
      ${MEASURE_FN_SRC}
      let st = await (${STORE_FN});
      st.setPlayhead(${startT});
      if (!st.playing) st.togglePlay();
      let ph = ${startT};
      for (let i = 0; i < 900; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        st = await (${STORE_FN});
        ph = st.playhead;
        if (ph >= ${t} - 0.005) break;
      }
      const m = __p3measure();
      const st2 = await (${STORE_FN});
      if (st2.playing) st2.togglePlay();
      return { ...m, playheadAtMeasure: +ph.toFixed(3) };
    })()`).catch((e) => ({ error: String(e).slice(0, 200) }));
  } else {
    await cdp.eval(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(${t}); return st.playhead; })()`);
    let last = null, stable = 0;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      cur = await cdp.eval(MEASURE_FN, false).catch((e) => ({ error: String(e).slice(0, 200) }));
      if (cur && !cur.error && last && Math.abs(cur.cx - last.cx) < 0.0015 && Math.abs(cur.cy - last.cy) < 0.0015) {
        stable++;
        if (stable >= 2) break;
      } else stable = 0;
      last = cur;
    }
  }
  results.push({ t, ...cur });
  console.log(`t=${t}:`, JSON.stringify(cur));
}
const finalOut = { spec: path.basename(SPEC), media: MEDIA, mode: MODE, threshold: THRESHOLD, results };
console.log("KẾT QUẢ:", JSON.stringify(finalOut, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(finalOut, null, 1));
cdp.close();
cleanup();
