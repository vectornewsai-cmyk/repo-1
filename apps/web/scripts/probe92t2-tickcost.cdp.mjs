#!/usr/bin/env node
/**
 * probe92t2-tickcost.cdp.mjs — Phase 9 đợt 92, luồng T2:
 * đo thật chi phí tick main-thread của đường preview motion blur + mask
 * (nợ S1 đợt 91 §5.1: rVFC chỉ capture ~1/3 frame trình chiếu vì main
 * thread bận xử lý mask CPU mỗi tick).
 *
 * Cách đo: app (preview.tsx, đợt 92 T2) tự ghi mẫu chi phí từng thành
 * phần vào window.__vcutTickCost / __vcutRvfcCost / __vcutRenderFrameMs
 * mỗi tick/capture; probe này chỉ seed spec, phát, chờ hết clip rồi đọc
 * 1 lần cuối pass (không đo bằng CDP mỗi khung — tự phép đo đã làm
 * chậm tick). Đồng thời đọc __vcutMotionBlurSnapshots + totalVideoFrames
 * qua getVideoPlaybackQuality để tính tỉ lệ rVFC capture / frame trình
 * chiếu, đối chiếu với 23/70 của S1.
 *
 * Chạy: node apps/web/scripts/probe92t2-tickcost.cdp.mjs
 *   [--spec ~/workspace/round92-t2/specs/b-blur.json]
 *   [--passes 3] [--out ~/workspace/round92-t2/out/tickcost-b.json]
 *   [--disable-rvfc]
 * Cần vite dev cổng 5173 + media stripes-scroll.mp4 trong public/.
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
const PASSES = Math.max(1, Number(opt("--passes", "3")) || 3);
const OUT = opt("--out", "");
const DISABLE_RVFC = has("--disable-rvfc");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9231"));
const SPEC_PATH = opt("--spec", path.join(os.homedir(), "workspace/round92-t2/specs/b-blur.json"));

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
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`timeout ${method}`)); } }, 120000);
    });
  }
  async eval(expression, awaitPromise = true) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) throw new Error("evaluate lỗi: " + JSON.stringify(r.exceptionDetails).slice(0, 500));
    return r.result.value;
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p3storeMod || (window.__p3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-92t2-"));
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
if (DISABLE_RVFC) {
  await cdp.eval(`window.__vcutDisableRvfc = true`, false);
  console.log("rVFC tắt (baseline đường tick)");
}
// Đợt 92 T2: A/B đường mask — --no-mask-canvas ép về đường CPU cũ
// (getImageData + applyMask + putImageData) để đo đối chứng: đường
// canvas mới có thật sự nhanh hơn trên mask ĐỘNG (miss cache mỗi tick)
// hay chỉ nhanh trên mask tĩnh.
const NO_MASK_CANVAS = has("--no-mask-canvas");
if (NO_MASK_CANVAS) {
  await cdp.eval(`window.__vcutMaskCanvasPath = false`, false);
  console.log("đường mask CPU cũ (no-mask-canvas)");
}

const specJson = JSON.stringify(spec).replace(/`/g, "\\`").replace(/\$/g, "\\$");
const seeded = await cdp.eval(`(async () => {
  const st = await (${STORE_FN});
  st.replaceProject(${specJson});
  const res = await fetch("/stripes-scroll.mp4");
  if (!res.ok) return { error: "fetch media lỗi " + res.status };
  const blob = await res.blob();
  const file = new File([blob], "stripes-scroll.mp4", { type: "video/mp4" });
  const st2 = await (${STORE_FN});
  await st2.importFiles([file]);
  const st3 = await (${STORE_FN});
  return { media: (st3.media || []).map((m) => m.name) };
})()`);
console.log("seed:", JSON.stringify(seeded));
if (!seeded || seeded.error || !(seeded.media || []).includes("stripes-scroll.mp4")) {
  console.error("seed media thất bại"); process.exit(2);
}
await sleep(1500);

// Phân tích 1 mảng số: median/mean/p90/max (ms, 3 chữ số).
function stats(a) {
  if (!a || a.length === 0) return { n: 0 };
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const mean = s.reduce((x, y) => x + y, 0) / s.length;
  return {
    n: s.length,
    median: +q(0.5).toFixed(3),
    mean: +mean.toFixed(3),
    p90: +q(0.9).toFixed(3),
    max: +s[s.length - 1].toFixed(3),
  };
}

const results = [];
for (let p = 0; p < PASSES; p++) {
  const run = await cdp.eval(`(async () => {
    let st = await (${STORE_FN});
    st.setPlayhead(0);
    const vidOf = () => {
      const els = (window.__vcutMediaEls || []).filter((e) => e.tag === "VIDEO").map((e) => e.el);
      return els.find((e) => !e.paused) || els[0] || null;
    };
    const mark = (vid) => ({
      tickN: (window.__vcutTickCost || []).length,
      rvfcN: (window.__vcutRvfcCost || []).length,
      rfN: (window.__vcutRenderFrameMs || []).length,
      loopN: (window.__vcutLoopMs || []).length,
      caps: (() => { try { const m = window.__vcutMotionBlurSnapshots; const v = m ? [...m.values()][0] : null; return v ? v.rvfcCaptures : null; } catch { return null; } })(),
      lastFrame: (() => { try { const m = window.__vcutMotionBlurSnapshots; const v = m ? [...m.values()][0] : null; return v ? v.lastFrame : null; } catch { return null; } })(),
      // totalFrames của MỌI element video (pool có thể đổi element
      // giữa các pass — đếm delta lớn nhất theo từng element, không
      // giữ 1 element cố định như bản trước (cho presented=0 sai).
      qfAll: ((window.__vcutMediaEls || []).filter((e) => e.tag === "VIDEO").map((e) => e.el)
        .map((v) => (typeof v.getVideoPlaybackQuality === "function" ? v.getVideoPlaybackQuality().totalVideoFrames : null))),
      totalFrames: (vid && typeof vid.getVideoPlaybackQuality === "function" ? vid.getVideoPlaybackQuality().totalVideoFrames : null),
    });
    // Chờ video bắt đầu trình chiếu (vt > 0.1) rồi mới bấm phát — tránh
    // đo cả quãng chờ decode frame đầu.
    for (let i = 0; i < 50; i++) {
      const v0 = vidOf();
      if (v0 && v0.currentTime > 0.1) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    // Giữ đúng 1 element video cho cả pass (xem mark()).
    const vid = vidOf();
    const passT0 = performance.now();
    const before = mark(vid);
    if (!st.playing) st.togglePlay();
    // Chờ playhead vượt 2.2s (clip dài 3s) — chỉ poll store mỗi 200ms,
    // không chạm canvas, không làm chậm tick.
    for (let i = 0; i < 200; i++) {
      const st2 = await (${STORE_FN});
      if (st2.playhead > 2.2) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    const st3 = await (${STORE_FN});
    if (st3.playing) st3.togglePlay();
    const after = mark(vid);
    const tick = (window.__vcutTickCost || []).slice(before.tickN);
    const rvfc = (window.__vcutRvfcCost || []).slice(before.rvfcN);
    const rf = (window.__vcutRenderFrameMs || []).slice(before.rfN);
    const loop = (window.__vcutLoopMs || []).slice(before.loopN);
    // Longtask trong pass (main thread bận > 50ms ngoài tickInner):
    // phân biệt tick nặng vs React render / GC / video callbacks.
    const longtasks = performance.getEntriesByType("longtask")
      .filter((e) => e.startTime >= passT0)
      .map((e) => ({ start: Math.round(e.startTime - passT0), dur: +e.duration.toFixed(1) }));
    const dbg = (() => { try { const m = window.__vcutMotionBlurSnapshots; const v = m ? [...m.values()][0] : null; return v ? { ring: v.ring, lastFrame: v.lastFrame, rvfcCaptures: v.rvfcCaptures, rvfcSkippedDuplicate: v.rvfcSkippedDuplicate, ringClears: v.ringClears, rvfcActive: !!v.rvfcActive, rvfcFallback: v.rvfcFallback ?? "" } : null; } catch { return null; } })();
    return { before, after, tick, rvfc, rf, loop, longtasks, dbg };
  })()`).catch((e) => ({ __error: String(e).slice(0, 300) }));
  if (!run || run.__error) { console.error(`pass ${p + 1} lỗi:`, run?.__error); process.exit(2); }
  const presented = (() => {
    // Delta lớn nhất theo từng element (pool có thể đổi element).
    const b = run.before.qfAll || [];
    const a = run.after.qfAll || [];
    let best = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const d = (a[i] ?? 0) - (b[i] ?? 0);
      if (d > best) best = d;
    }
    // Rơi về totalFrames của element giữ (nếu qfAll rỗng).
    if (best === 0 && run.after.totalFrames != null && run.before.totalFrames != null) {
      best = run.after.totalFrames - run.before.totalFrames;
    }
    return best;
  })();
  const captured = (run.after.caps ?? 0) - (run.before.caps ?? 0);
  // Đối chiếu: lastFrame của ring (reset về 0 mỗi pass do seek về 0).
  const lastFrameDelta = (run.after.lastFrame ?? 0) - (run.before.lastFrame ?? 0);
  const byPath = {};
  for (const s of run.tick) {
    (byPath[s.path] ??= []).push(s);
  }
  // Tải VM làm thời gian bimodal (tick nhanh ~13ms apply vs tick bị
  // đói CPU ~70-90ms): tách cụm fast (total < 40ms) / slow để thấy
  // chi phí thật của code, không lẫn nhiễu contention.
  const splitFastSlow = (arr, key) => {
    const fast = arr.filter((s) => s[key] < 40);
    const slow = arr.filter((s) => s[key] >= 40);
    return {
      fastN: fast.length,
      fastMed: fast.length ? stats(fast.map((s) => s[key])).median : null,
      slowN: slow.length,
      slowMed: slow.length ? stats(slow.map((s) => s[key])).median : null,
    };
  };
  const comp = {};
  for (const [pathKey, arr] of Object.entries(byPath)) {
    comp[pathKey] = {
      n: arr.length,
      total: stats(arr.map((s) => s.total)),
      totalFastSlow: splitFastSlow(arr, "total"),
      raw: stats(arr.map((s) => s.raw)),
      blend: stats(arr.map((s) => s.blend)),
      mask: stats(arr.map((s) => s.mask)),
      maskGet: stats(arr.map((s) => s.maskGet)),
      maskApply: stats(arr.map((s) => s.maskApply)),
      maskPut: stats(arr.map((s) => s.maskPut)),
      maskApplyFastSlow: splitFastSlow(arr, "maskApply"),
      draw: stats(arr.map((s) => s.draw)),
      maskCanvasHits: arr.filter((s) => s.maskCanvas === 1).length,
    };
  }
  // Tỉ lệ tick trùng frameIdx (tick vẽ lại cùng 1 video frame) — cho
  // biết cache theo frameIdx có đáng làm không.
  let dupTicks = 0;
  let prevIdx = -999;
  for (const s of run.tick) {
    if (s.frameIdx === prevIdx && s.frameIdx >= 0) dupTicks++;
    prevIdx = s.frameIdx;
  }
  // Gap rAF theo wall clock của mẫu renderFrame.
  const gaps = [];
  for (let i = 1; i < run.rf.length; i++) gaps.push(run.rf[i].wallMs - run.rf[i - 1].wallMs);
  const summary = {
    pass: p + 1,
    presentedFrames: presented,
    presentedFramesByLastFrame: lastFrameDelta,
    rvfcCaptured: captured,
    captureRatio: presented > 0 ? +(captured / presented).toFixed(3) : null,
    tickN: run.tick.length,
    dupTicks,
    dupRate: run.tick.length > 0 ? +(dupTicks / run.tick.length).toFixed(3) : null,
    renderFrameMs: stats(run.rf.map((s) => s.ms)),
    renderFrameFastSlow: splitFastSlow(run.rf, "ms"),
    loopMs: stats(run.loop.map((s) => s.ms)),
    loopFastSlow: splitFastSlow(run.loop, "ms"),
    longtasks: run.longtasks,
    longtaskTotalMs: +run.longtasks.reduce((a, t) => a + t.dur, 0).toFixed(1),
    rafGapMs: stats(gaps),
    rvfcCaptureMs: stats(run.rvfc.map((s) => s.ms)),
    byPath: comp,
    dbgEnd: run.dbg,
  };
  console.log(`pass ${p + 1}: presented=${presented} (lastFrameΔ=${lastFrameDelta}) captured=${captured} ratio=${summary.captureRatio} ticks=${run.tick.length} dup=${dupTicks} (${summary.dupRate}) rfMed=${summary.renderFrameMs.median}ms loopMed=${summary.loopMs.median}ms longtasks=${run.longtasks.length}×${summary.longtaskTotalMs}ms`);
  console.log(`  longtasks: ${run.longtasks.map((t) => `${t.start}ms+${t.dur}`).join(" ") || "(không có)"}`);
  for (const [k, v] of Object.entries(comp)) {
    console.log(`  ${k}: n=${v.n} total med=${v.total.median} (fast ${v.totalFastSlow.fastN}×${v.totalFastSlow.fastMed} / slow ${v.totalFastSlow.slowN}×${v.totalFastSlow.slowMed}) raw=${v.raw.median} blend=${v.blend.median} mask=${v.mask.median} (get ${v.maskGet.median} / apply ${v.maskApply.median} / put ${v.maskPut.median}) draw=${v.draw.median} canvasHits=${v.maskCanvasHits}`);
  }
  results.push({ ...summary, tick: run.tick, rvfc: run.rvfc, rf: run.rf, loop: run.loop });
}
const out = { mode: "tickcost", spec: path.basename(SPEC_PATH), disableRvfc: DISABLE_RVFC, noMaskCanvas: NO_MASK_CANVAS, passes: PASSES, results };
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log("ghi:", OUT); }
cdp.close();
cleanup();
console.log("XONG");
