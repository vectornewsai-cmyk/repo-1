#!/usr/bin/env node
/**
 * probe104f3-ghost-k7.webkit.mjs — Phase 9 đợt 109, luồng K7 (port của
 * probe104f3-ghost-j6.cdp.mjs đợt 108 — F6' pixel-verified skipLatest cho WebKit).
 *
 * Port: GIỮ NGUYÊN toàn bộ logic trong trang (MEASURE_FN_SRC, STORE_FN,
 * vòng pass, phân tích offline, định dạng JSON) để số so được trực tiếp
 * với J6/C3b-quiet trên Chromium; CHỈ thay lớp vận chuyển:
 *   Chromium-CDP (spawn chromium-1254 + WebSocket CDP thô)
 *   → Playwright WebKit (webkit-2388, headed qua Xvfb) + page.evaluate.
 *
 * Khác biệt engine (ghi rõ, không giấu):
 *  - WebKitGTK không có requestVideoFrameCallback → pump chạy đường tick
 *    ngay từ đầu; --disable-rvfc là trạng thái tự nhiên, flip sau pass 5
 *    chỉ đặt lại cờ __vcutDisableRvfc làm mốc wallMs cho analyzer.
 *  - Tap/relabel được kỳ vọng VÔ DỤNG trên WebKit (không có rVFC để nuôi
 *    presented) — đo với tap ON + relabel ON (mặc định, như C3) để so sánh
 *    chỉ khác engine; kiểm chứng bằng anchorSrc trong dữ liệu.
 *  - Decode video qua GStreamer: BẮT BUỘC export GST_PLUGIN_PATH và
 *    GST_PLUGIN_SYSTEM_PATH = /usr/lib/x86_64-linux-gnu/gstreamer-1.0
 *    (I3 đợt 107 / N1 đợt 86 — thiếu biến này video crash lúc tạo media
 *    pipeline, lỗi H2 đợt 106 tái hiện 3/3).
 *
 * Chạy (từ gốc repo, sau khi vite K7 :5184 đã lên):
 *   node ~/workspace/goals/capcut-clone-video-editor/hidden_files/round109-k7/probe104f3-ghost-k7.webkit.mjs \
 *     --cases b --passes 20 --disable-rvfc --flip-rvfc-after-pass 5 \
 *     --url http://localhost:5184/ --out <json>
 */
import { spawn, execFileSync } from "node:child_process";
import { webkit } from "/home/hatch/scratch-round63-r4/node_modules/playwright-core/index.mjs";
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
const DISABLE_TAP = has("--disable-tap");
const DISABLE_RELABEL = has("--disable-relabel");
const FLIP_AFTER_PASS = Math.max(0, Number(opt("--flip-rvfc-after-pass", "0")) || 0);
// Đợt 116 S5 (nợ R5 (ii)): timeout wall-clock mỗi pass + ghi JSON TĂNG DẦN
// từng pass — pass kẹt không được làm mất các pass đã xong (R5 attempt2
// mất 9 pass vì probe chỉ ghi JSON sau đủ 20 pass, pass 10 kẹt 17 phút).
const PASS_TIMEOUT_MS = Math.max(10000, Number(opt("--pass-timeout-ms", "120000")) || 120000);
// Đợt 121 T3 (nợ LIMITS T4 đợt 120 §9.2): timeout cho pwEval lấy
// tickCost trong writePartial — mặc định 30 s. Đợt 120: probe kẹt sau
// pass 17 >5 phút vì writePartial await pwEval không timeout, ngoài
// phạm vi timeout 120 s/pass (chỉ bao phủ evaluate của pass đang chạy).
// Sàn 1 ms (không phải 1000 ms) để test ép nhánh timeout được
// (--tickcost-timeout-ms 1); mặc định vẫn 30000 ms, đường thường không đổi.
const TICKCOST_TIMEOUT_MS = Math.max(1, Number(opt("--tickcost-timeout-ms", "30000")) || 30000);
const SPEC_DIR = opt("--spec-dir", path.join(os.homedir(), "workspace/round91-s1/specs"));
const SPEC_DIR_ABC = path.join(os.homedir(), "workspace/round90-r1/specs");
const GST_PATH = "/usr/lib/x86_64-linux-gnu/gstreamer-1.0";

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

// Đợt 129 T3 (nợ LIMITS gộp đợt 128 §11 mục 4 + T4 đợt 128 §9.4):
// heartbeat 5 s trong các lần chờ dài của probe — port từ hbStart của
// clicktest-85m4-webkit-w7-hb128.mjs (đợt 128 T3: helper đó chỉ có trong
// harness 85m4, probe lượt yên này KHÔNG có waitForPlaySync/sampleFor —
// các lần chờ dài ở đây là race pass 120 s + pwEvalTimeout). Heartbeat
// chạy trên event loop Node nên vẫn ghi log ngay cả khi page.evaluate
// treo (attempt3 đợt 128: rAF kẹt 120 s im lặng trước pass-timeout).
// Tag [HB129] để phân biệt với [HB128] của harness 85m4. Không đổi hành
// vi đo: interval chỉ log, luôn clearInterval khi lần chờ kết thúc.
function hbStart(tag, getSummary) {
  const t0 = Date.now();
  const iv = setInterval(() => {
    console.log(`[${new Date().toISOString()}] [HB129] ${tag} elapsed=${((Date.now() - t0) / 1000).toFixed(0)}s ${getSummary()}`);
  }, 5000);
  return () => clearInterval(iv);
}

// --- Vận chuyển Playwright WebKit (thay CDP) ---
// page.evaluate(string): Playwright đánh giá chuỗi như một biểu thức JS
// trong ngữ cảnh trang (như Runtime.evaluate) — mọi biểu thức IIFE của
// driver J6 chạy nguyên vẹn. pwEval giữ cùng chữ ký pwEval(expr, awaitPromise)
// để phần còn lại của file không đổi.
let browser = null, page = null, xvfb = null;
async function pwEval(expression, _awaitPromise = true) {
  return await page.evaluate(expression);
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

// Xvfb: chọn display trống :193–:197 (mẫu probe93u3-rvfc-webkit).
let DISPLAY = null;
for (const d of [":193", ":194", ":195", ":196", ":197"]) {
  const sockD = `/tmp/.X11-unix/X${d.slice(1)}`;
  let alive = false;
  if (fs.existsSync(sockD)) {
    try { alive = execFileSync("sh", ["-c", `ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`], { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
    if (alive) continue;
    try { fs.unlinkSync(sockD); console.log(`đã dọn socket X mồ côi ${sockD}`); } catch {}
  }
  DISPLAY = d; break;
}
if (!DISPLAY) { console.error("hết display Xvfb trống :193–:197"); process.exit(2); }
for (let xAttempt = 1; xAttempt <= 3; xAttempt++) {
  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
  // Poll socket tới 10s mỗi lần (máy tải nặng, Xvfb có thể lên chậm hơn
  // 900ms — smoke K7 lần 1 fail giả vì chỉ chờ 900ms đúng lúc K5 spin).
  let xvfbUp = false;
  for (let w = 0; w < 20; w++) {
    await sleep(500);
    if (xvfb.exitCode === null && fs.existsSync(`/tmp/.X11-unix/X${DISPLAY.slice(1)}`)) { xvfbUp = true; break; }
    if (xvfb.exitCode !== null) break;
  }
  if (xvfbUp) { console.log(`Xvfb ${DISPLAY} đã lên`); break; }
  console.log(`Xvfb ${DISPLAY} chưa lên lần ${xAttempt}, thử lại sau 15s`);
  try { xvfb.kill("SIGKILL"); } catch {}
  xvfb = null;
  if (xAttempt === 3) { console.error("Xvfb không khởi động được sau 3 lần thử"); process.exit(2); }
  await sleep(15000);
}
const launchEnv = { ...process.env, DISPLAY, GST_PLUGIN_PATH: GST_PATH, GST_PLUGIN_SYSTEM_PATH: GST_PATH };
console.log(`WebKit launch env: DISPLAY=${DISPLAY} GST_PLUGIN_PATH=${GST_PATH} GST_PLUGIN_SYSTEM_PATH=${GST_PATH}`);
browser = await webkit.launch({ headless: false, env: launchEnv });
console.log(`WebKit launched, version: ${browser.version()}`);
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
page = await context.newPage();
page.setDefaultTimeout(120000);
const pageErrs = [];
page.on("pageerror", (e) => pageErrs.push("pageerror: " + String(e && e.message || e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") pageErrs.push("console.error: " + m.text().slice(0, 200)); });
const cleanup = () => {
  try { if (browser) browser.close(); } catch { /* noop */ }
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch { /* noop */ }
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
let booted = false;
for (let i = 0; i < 60; i++) {
  const hasCanvas = await pwEval(`!!document.querySelector("#vcut-preview-wrap canvas.preview-canvas")`, false).catch(() => false);
  if (hasCanvas) { booted = true; break; }
  await sleep(500);
}
if (!booted) { console.error("app không boot (không thấy canvas preview)"); process.exit(2); }
console.log("app boot OK");
if (DISABLE_RVFC) {
  await pwEval(`window.__vcutDisableRvfc = true;`, false);
  console.log("rVFC TẮT (baseline đường tick cũ)");
}
if (DISABLE_TAP) {
  await pwEval(`window.__vcut104f3PresentedTap = false;`, false);
  console.log("TAP TẮT (baseline không tap — đối chứng A)");
} else {
  console.log("TAP BẬT (fix F8 — mặc định)");
}
if (DISABLE_RELABEL) {
  await pwEval(`window.__vcut104f3Relabel = false;`, false);
  console.log("RELABEL TẮT (baseline không relabel — đối chứng A)");
} else {
  console.log("RELABEL BẬT (fix F8 — mặc định)");
}

for (let i = 0; i < 20; i++) {
  const closed = await pwEval(`(() => {
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
  await pwEval(`window.__p3pw = ${PW}; window.__p3ph = ${PH}; window.__p3trailFrac = ${job.trailLeftFrac ?? 0.2};`, false);
  console.log(`\n== case ${job.name} (${job.specPath}) ==`);
  const specJson = JSON.stringify(spec).replace(/`/g, "\\`").replace(/\$/g, "\\$");
  const seeded = await pwEval(`(async () => {
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
    sanity = await pwEval(MEASURE_FN, false).catch((e) => ({ error: String(e).slice(0, 200) }));
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
    await pwEval(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(${t}); return st.playhead; })()`);
    let last = null, stable = 0, cur = null;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      cur = await pwEval(MEASURE_FN, false).catch((e) => ({ error: String(e).slice(0, 200) }));
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
  const dbgStart = await pwEval(`(() => {
    try {
      const map = window.__vcutMotionBlurSnapshots;
      if (!map) return null;
      const v = [...map.values()][0];
      return v ? { rvfcCaptures: v.rvfcCaptures ?? 0 } : null;
    } catch { return null; }
  })()`, false).catch(() => null);
  // Đợt 97 Y2: mốc seq pump/blend-tick log ĐẦU case (mảng tích lũy từ
  // đầu phiên — lọc seq > mốc để lấy đúng slice của case này, xem dưới).
  // Đợt 100 B2: thêm mốc wallMs đầu case để lọc __vcutTickCost theo
  // thời gian (tickCost không có seq; dùng kiểm tra giả thuyết "vẽ trực
  // tiếp sau blend ghi đè canvas" cho 6/133 ca không khớp của A2).
  const y2SeqStart = await pwEval(`(() => {
    try {
      const p = window.__vcutRvfcPump || [];
      const b = window.__vcutRvfcBlendTick || [];
      return { pump: p.length ? p[p.length - 1].seq : -1, blend: b.length ? b[b.length - 1].seq : -1, wallStart: performance.now() };
    } catch { return { pump: -1, blend: -1, wallStart: 0 }; }
  })()`, false).catch(() => ({ pump: -1, blend: -1, wallStart: 0 }));
  const passes = [];
  let flipWallMs = null;
  // Đợt 116 S5 (nợ R5 (ii)): ghi JSON TĂNG DẦN sau mỗi pass — file OUT luôn
  // chứa các pass đã xong + snapshot tickCost tới thời điểm đó, để analyzer
  // tickcost/labellag chạy được trên dữ liệu dở dang nếu lượt chết giữa
  // chừng. Không bao giờ throw (best-effort, bắt mọi lỗi).
  // Đợt 121 T3 (nợ LIMITS T4 đợt 120 §9.2): pwEval trong writePartial
  // KHÔNG CÓ timeout — trang không trả lời evaluate thì lượt kẹt vĩnh
  // viễn ngoài timeout 120 s/pass (đợt 120: kẹt sau pass 17 >5 phút).
  // pwEvalTimeout: race evaluate với timer; timeout KHÔNG hủy được
  // evaluate gốc của Playwright (promise gốc vẫn treo nền) nhưng cho
  // phép probe tiếp tục ghi file + chạy tiếp. Nhánh lỗi KHÔNG ghi
  // tc=[] im lặng nữa: giữ tc lần fetch thành công gần nhất + ghi rõ
  // trạng thái vào partial JSON (tickCostStatus/tickCostNote) để phân
  // tích sau dùng được.
  // Đợt 129 T3: heartbeat [HB129] trong lúc chờ evaluate (xem hbStart
  // trên đầu file) — nếu trang treo, log vẫn ghi mỗi 5 s để định vị
  // điểm kẹt; evaluate xong nhanh thì interval clear trước lần log đầu.
  const pwEvalTimeout = (expression, ms, label) => {
    const hbStop = hbStart(`pwEvalTimeout ${label}`, () => `timeoutMs=${ms}`);
    return Promise.race([
      pwEval(expression, false),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`pwEval timeout sau ${ms}ms (${label})`)), ms)),
    ]).finally(hbStop);
  };
  let lastTcOk = [];
  let lastTcStatus = "none"; // ok | timeout | error | none
  let lastTcNote = "";
  // Đợt 129 T3: giữ blendTick lần fetch thành công gần nhất — cùng cơ
  // chế với tickCost (lastTcOk): fetch lỗi/timeout không ghi đè [].
  let lastBlendOk = [];
  let lastBlendStatus = "none"; // ok | timeout | error | none
  let lastBlendNote = "";
  const writePartial = async (reason) => {
    try {
      if (!OUT) return;
      let tc = lastTcOk, tcStatus = lastTcStatus;
      try {
        const fetched = await pwEvalTimeout(`(() => { try { return (window.__vcutTickCost || []).filter((e) => e.wallMs >= ${Number(y2SeqStart.wallStart ?? 0)}); } catch { return []; } })()`, TICKCOST_TIMEOUT_MS, "writePartial-tickCost");
        tc = Array.isArray(fetched) ? fetched : [];
        lastTcOk = tc; lastTcStatus = "ok"; lastTcNote = "";
        tcStatus = "ok";
      } catch (e) {
        const isTimeout = /pwEval timeout/.test(String((e && e.message) || e));
        tcStatus = isTimeout ? "timeout" : "error";
        lastTcStatus = tcStatus;
        lastTcNote = String((e && e.message) || e).slice(0, 200);
        tc = lastTcOk; // GIỮ tc lần fetch thành công gần nhất, không ghi đè []
        console.error(`writePartial tickCost ${tcStatus.toUpperCase()} sau ${TICKCOST_TIMEOUT_MS}ms (${reason || "sau pass"}) — giữ tc cũ n=${tc.length} (lần fetch ${tcStatus} này không ghi đè)`);
      }
      // Đợt 129 T3 (nợ T4 đợt 128 §5.1): fetch blendTick TĂNG DẦN sau mỗi
      // pass — cùng cơ chế với tickCost trên: partial JSON trước đây ghi
      // blendTick: [] cứng nên lượt dở dang (attempt3 đợt 128: chết pass
      // 17) mất toàn bộ dữ liệu (b)/(c2)/lag≥5f. Lọc theo seq > mốc đầu
      // case (y2SeqStart.blend) — đúng slice như fetch cuối lượt; lỗi/
      // timeout thì giữ blendTick lần fetch thành công gần nhất.
      let bt = lastBlendOk, btStatus = lastBlendStatus;
      try {
        const fetchedBt = await pwEvalTimeout(`(() => { try { return (window.__vcutRvfcBlendTick || []).filter((e) => e.seq > ${Number(y2SeqStart.blend ?? -1)}); } catch { return []; } })()`, TICKCOST_TIMEOUT_MS, "writePartial-blendTick");
        bt = Array.isArray(fetchedBt) ? fetchedBt : [];
        lastBlendOk = bt; lastBlendStatus = "ok"; lastBlendNote = "";
        btStatus = "ok";
      } catch (e) {
        const isTimeout = /pwEval timeout/.test(String((e && e.message) || e));
        btStatus = isTimeout ? "timeout" : "error";
        lastBlendStatus = btStatus;
        lastBlendNote = String((e && e.message) || e).slice(0, 200);
        bt = lastBlendOk; // GIỮ blendTick lần fetch thành công gần nhất, không ghi đè []
        console.error(`writePartial blendTick ${btStatus.toUpperCase()} sau ${TICKCOST_TIMEOUT_MS}ms (${reason || "sau pass"}) — giữ blendTick cũ n=${bt.length} (lần fetch ${btStatus} này không ghi đè)`);
      }
      const partial = { mode: ASSERT ? "assert" : "measure", passes: PASSES, passesDone: passes.length, partial: true, partialReason: reason || "", engine: "webkit", webkitVersion: browser ? browser.version() : "", gstPluginPath: GST_PATH, gstPluginSystemPath: GST_PATH, pageErrs, results: { [job.name]: { spec: path.basename(job.specPath), media: job.media, passes: passes.map((p) => p.frames), dbg: passes.map((p) => p.dbg), flip: FLIP_AFTER_PASS > 0 ? { afterPass: FLIP_AFTER_PASS, wallMs: flipWallMs } : null, y2: { pump: [], blendTick: Array.isArray(bt) ? bt : [], blendTickStatus: btStatus, blendTickNote: lastBlendNote, tickCost: Array.isArray(tc) ? tc : [], tickCostStatus: tcStatus, tickCostNote: lastTcNote }, y2Summary: null } } };
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(partial, null, 1));
      console.log(`partial JSON đã ghi: ${passes.length}/${PASSES} pass (${reason || "sau pass"}, tickCost ${tcStatus} n=${tc.length}, blendTick ${btStatus} n=${bt.length})`);
    } catch (e) { console.error("ghi partial JSON lỗi (bỏ qua):", String(e).slice(0, 200)); }
  };
  for (let p = 0; p < PASSES; p++) {
    const passStartMs = Date.now();
    // Đợt 129 T3: heartbeat [HB129] trong lúc chờ pass — rAF/renderer
    // kẹt thì log vẫn ghi mỗi 5 s (pass đang chạy + số pass đã xong +
    // elapsed) thay vì im lặng tới 120 s như attempt3 đợt 128. Race
    // này không reject (nhánh pwEval có .catch, nhánh timeout resolve)
    // nên hbStop sau await là đủ — không cần try/finally.
    const passHbStop = hbStart(`play pass ${p + 1}/${PASSES}`, () => `passesDone=${passes.length} timeoutMs=${PASS_TIMEOUT_MS}`);
    const frames = await Promise.race([
      pwEval(`(async () => {
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
    })()`).catch((e) => ({ __error: String(e).slice(0, 300) })),
      new Promise((r) => setTimeout(() => r({ __error: `pass-timeout: pass ${p + 1} không tiến trong ${PASS_TIMEOUT_MS}ms wall-clock (kẹt rAF/renderer)` }), PASS_TIMEOUT_MS)),
    ]);
    passHbStop(); // Đợt 129 T3: dừng heartbeat pass (xem hbStart trên đầu file).
    if (!frames || frames.__error) {
      console.error(`play pass ${p + 1} lỗi:`, frames?.__error);
      const isTimeout = String(frames?.__error || "").startsWith("pass-timeout");
      await writePartial(isTimeout ? "pass-timeout" : "target-closed");
      console.error(`partial JSON đã giữ ${passes.length}/${PASSES} pass — thoát ${isTimeout ? 3 : 2}`);
      cleanup(); process.exit(isTimeout ? 3 : 2);
    }
    console.log(`play pass ${p + 1} wall-clock: ${Date.now() - passStartMs}ms`);
    passes.push(frames);
    const nOk = frames.frames.filter((f) => !f.error).length;
    console.log(`play pass ${p + 1}: ${frames.frames.length} khung rAF, ${nOk} đo được, dbg=${JSON.stringify(frames.dbg)}`);
    // Đợt 101 C2 — flip-protocol: tắt rVFC giữa run (sau pass N) để đo
    // đường tick khi pump vừa chết (metadata trình chiếu còn tươi rồi
    // đóng băng) — kiểm chứng claim "ngoại suy presented chết ở seek
    // đầu tiên". Ghi wallMs lúc flip để phân tích hậu-flip offline.
    if (FLIP_AFTER_PASS > 0 && p + 1 === FLIP_AFTER_PASS && flipWallMs === null) {
      flipWallMs = await pwEval(`(() => { window.__vcutDisableRvfc = true; return performance.now(); })()`, false).catch(() => null);
      console.log(`FLIP rVFC tắt sau pass ${p + 1} (wallMs=${flipWallMs})`);
    }
    await writePartial("sau pass");
  }
  // Đợt 97 Y2: dump pump event log mở rộng + blend-tick log của riêng
  // case này (lọc theo seq — mảng tích lũy từ đầu phiên). Phân tích nối
  // mẫu 84 ↔ tick blend ↔ pump event làm offline bằng Python (không
  // assert ở đây — log chỉ để chẩn đoán, không khóa hành vi).
  // Đợt 121 T3: cùng lỗi như writePartial — fetch y2 cuối lượt không
  // timeout thì probe treo sau pass cuối (ngoài timeout 120 s/pass).
  // Timeout 30 s, fallback rỗng như cũ, log rõ khi timeout/lỗi.
  const y2Logs = await pwEvalTimeout(`((ps, bs, ws) => {
    try {
      const p = (window.__vcutRvfcPump || []).filter((e) => e.seq > ps);
      const b = (window.__vcutRvfcBlendTick || []).filter((e) => e.seq > bs);
      // Đợt 100 B2: slice tick-cost theo wallMs đầu case (cap 1500 —
      // case ~10 pass chỉ vài trăm tick nên slice đầy đủ).
      const tc = (window.__vcutTickCost || []).filter((e) => e.wallMs >= ws);
      return { pump: p, blendTick: b, tickCost: tc };
    } catch { return { pump: [], blendTick: [], tickCost: [] }; }
  })(${Number(y2SeqStart.pump)}, ${Number(y2SeqStart.blend)}, ${Number(y2SeqStart.wallStart ?? 0)})`, TICKCOST_TIMEOUT_MS, "final-y2logs").catch((e) => { console.error(`y2Logs cuối ${/pwEval timeout/.test(String((e && e.message) || e)) ? "TIMEOUT" : "lỗi"} sau ${TICKCOST_TIMEOUT_MS}ms — dùng y2 rỗng (như fallback cũ)`); return { pump: [], blendTick: [], tickCost: [] }; });
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
      tickCost: (y2Logs.tickCost || []).length,
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
    const expectCxFn = job.expectCx || (() => 0.5); // M5: --spec dat expectCx=null -> mac dinh 0.5 (spec B, mask giua); chi dung cho chan doan cxDev in-log, khong anh huong JSON
    const cxDevs = selCx.map((f) => Math.abs(f.cx - expectCxFn(f.ph))).filter((v) => Number.isFinite(v));
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
  allResults[job.name] = { spec: path.basename(job.specPath), media: job.media, pause, passes: passes.map((p) => p.frames), dbg: passes.map((p) => p.dbg), trailEdge, analysis, edgeInvestigation, gStdSpread, gStdSpreadDrawn, gStdSpreadDrawnPresented, y2: y2Logs, y2Summary, flip: FLIP_AFTER_PASS > 0 ? { afterPass: FLIP_AFTER_PASS, wallMs: flipWallMs } : null };
}

const finalOut = { mode: ASSERT ? "assert" : "measure", passes: PASSES, engine: "webkit", webkitVersion: browser.version(), gstPluginPath: GST_PATH, gstPluginSystemPath: GST_PATH, pageErrs, results: allResults };
console.log("\nKẾT QUẢ:", JSON.stringify(finalOut, null, 1).slice(0, 4000));
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(finalOut, null, 1)); }
await browser.close(); browser = null;
cleanup();
if (ASSERT && assertFail > 0) {
  console.error(`\nASSERT FAIL: ${assertFail} kiểm tra fail:\n- ${assertLog.join("\n- ")}`);
  process.exit(1);
}
if (ASSERT) console.log("\nASSERT PASS: tất cả kiểm tra xanh");
