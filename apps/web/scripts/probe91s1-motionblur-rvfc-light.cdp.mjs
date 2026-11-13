#!/usr/bin/env node
/**
 * probe91s1-motionblur-rvfc-light.cdp.mjs — Phase 9 đợt 91, luồng S1:
 * kiểm chứng pump rVFC trong điều kiện NHẸ (không đo pixel mỗi khung).
 *
 * Câu hỏi: gap 3 frame giữa các frame trình chiếu trong harness nặng
 * (probe91s1, smoke B: ring lastFrame nhảy 6→9→12→15…) là do decoder
 * đuối dưới tải đo, hay do video/clip vốn thế? Probe này seed cùng spec
 * B (sọc cuộn + mask + blur) rồi chỉ lấy mẫu (ph, vt, ring, lastFrame,
 * rvfcCaptures, presentedFrames qua getVideoPlaybackQuality nếu có) mỗi
 * rAF — không getImageData, không import store mỗi khung — để xem khi
 * trang nhẹ thì frame trình chiếu có về liên tiếp (gap 1) và captures có
 * ≈ 90/3s không.
 *
 * Kỳ vọng nếu giả thuyết đúng: gap giữa các lastFrame liên tiếp ≈ 1,
 * rvfcCaptures ≈ số frame video trong 3s (≈ 85–90, trừ frame đầu/cuối),
 * rvfcFallback rỗng. Nếu vẫn gap 3 thì bottleneck nằm ở decode/video
 * chứ không phải tải đo — ghi nhận trung thực, không ép kết luận.
 *
 * Chạy: node apps/web/scripts/probe91s1-motionblur-rvfc-light.cdp.mjs
 *   [--passes 2] [--out ~/workspace/round91-s1/out/rvfc-light.json]
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
const URL = opt("--url", "http://127.0.0.1:5173/");
const PASSES = Math.max(1, Number(opt("--passes", "2")) || 2);
const OUT = opt("--out", "");
const CHROME = opt("--chrome",
  path.join(os.homedir(), ".cache/ms-playwright/chromium-1254/chrome-linux64/chrome"));
const CDP_PORT = Number(opt("--cdp-port", "9230"));
const SPEC_PATH = opt("--spec", path.join(os.homedir(), "workspace/round90-r1/specs/b-blur.json"));

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

const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__p3storeMod || (window.__p3storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vcut-cdp-91s1-light-"));
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

const results = [];
for (let p = 0; p < PASSES; p++) {
  const run = await cdp.eval(`(async () => {
    let st = await (${STORE_FN});
    st.setPlayhead(0);
    const vtOf = () => {
      const els = (window.__vcutMediaEls || []).filter((e) => e.tag === "VIDEO").map((e) => e.el);
      const vid = els.find((e) => !e.paused) || els[0];
      return vid ? { vt: +vid.currentTime.toFixed(4), q: (typeof vid.getVideoPlaybackQuality === "function" ? vid.getVideoPlaybackQuality().totalVideoFrames : null) } : { vt: null, q: null };
    };
    const dbgOf = () => {
      try {
        const mm = window.__vcutMotionBlurSnapshots;
        if (!mm) return null;
        const v = [...mm.values()][0];
        return v ? { ring: v.ring, lastFrame: v.lastFrame, rvfcCaptures: v.rvfcCaptures ?? null, rvfcSkippedDuplicate: v.rvfcSkippedDuplicate ?? null, ringClears: v.ringClears, rvfcActive: !!v.rvfcActive, rvfcFallback: v.rvfcFallback ?? "" } : null;
      } catch { return null; }
    };
    for (let i = 0; i < 50; i++) {
      const v0 = vtOf();
      if (v0.vt === null || v0.vt < 0.1) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!st.playing) st.togglePlay();
    const t0 = performance.now();
    const out = [];
    for (let i = 0; i < 1500; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      const st2 = await (${STORE_FN});
      const ph = st2.playhead;
      const { vt, q } = vtOf();
      out.push({ wallMs: Math.round(performance.now() - t0), ph: +ph.toFixed(3), vt, totalFrames: q, dbg: dbgOf() });
      if (ph > 2.2) break;
    }
    const st3 = await (${STORE_FN});
    if (st3.playing) st3.togglePlay();
    return { frames: out, dbgEnd: dbgOf() };
  })()`).catch((e) => ({ __error: String(e).slice(0, 300) }));
  if (!run || run.__error) { console.error(`pass ${p + 1} lỗi:`, run?.__error); process.exit(2); }
  const lasts = [];
  for (const f of run.frames) {
    const lf = f.dbg?.lastFrame;
    if (typeof lf === "number" && (lasts.length === 0 || lasts[lasts.length - 1] !== lf)) lasts.push(lf);
  }
  const gaps = [];
  for (let i = 1; i < lasts.length; i++) gaps.push(lasts[i] - lasts[i - 1]);
  const gapHist = {};
  for (const g of gaps) gapHist[g] = (gapHist[g] || 0) + 1;
  const rafN = run.frames.length;
  const wallSec = run.frames.length ? (run.frames[run.frames.length - 1].wallMs - run.frames[0].wallMs) / 1000 : 0;
  console.log(`pass ${p + 1}: ${rafN} rAF frames, wall ${wallSec.toFixed(1)}s, distinct ring-lastFrame=${lasts.length}, gaps hist=${JSON.stringify(gapHist)}, dbgEnd=${JSON.stringify(run.dbgEnd)}`);
  results.push({ pass: p + 1, rafN, wallSec: +wallSec.toFixed(2), lasts, gaps, gapHist, dbgEnd: run.dbgEnd, frames: run.frames });
}
const out = { mode: "rvfc-light", spec: path.basename(SPEC_PATH), passes: PASSES, results };
if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log("ghi:", OUT); }
cdp.close();
cleanup();
console.log("XONG");
