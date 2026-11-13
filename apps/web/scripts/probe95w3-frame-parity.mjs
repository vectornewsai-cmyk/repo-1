#!/usr/bin/env node
/**
 * probe95w3-frame-parity.mjs — Phase 9 đợt 95, luồng W3 (nợ LIMITS gộp đợt 94 §4 mục 3).
 * Harness parity pixel ĐỒNG BỘ THEO FRAME cho rVFC WebKit.
 *
 * Vấn đề nó giải quyết: harness V4 khớp canvas theo mediaTime ±16 ms — MAD bị
 * pha sọc chi phối (cùng đường vẽ chạy 2 lần cũng MAD ~55–76). Harness này
 * chụp canvas trong tick kèm frameIdx, khớp đúng (clip, frameIdx).
 *
 * Cách gắn frameIdx (2 nguồn, kiểm chứng chéo nhau):
 *  (a) Tick record: __vcutTickCost — recordTickCost() được gọi CUỐI drawVideoClip
 *      (sau drawImage cuối lên canvas chính) ở mọi nhánh blend (mask-blend,
 *      mask-direct, plain-blend). Đọc trong cùng callback JS với lúc chụp canvas
 *      nên nhãn và pixels không bao giờ lệch nhau giữa chừng (single-thread).
 *  (b) drawImage wrapper: patch CanvasRenderingContext2D.prototype.drawImage,
 *      ghi video draws (kèm ct lúc vẽ) VÀ draws lên canvas preview (mốc
 *      "canvas chính vừa cập nhật"). Đường direct (cửa sổ mù + mọi tick spec
 *      không-blur) KHÔNG gọi recordTickCost nên chỉ có (b) mới gắn được nhãn
 *      cho các frame đó. Nguồn (b) chỉ chụp khi mainDraw gần nhất xảy ra SAU
 *      video draw gần nhất (tick đã vẽ xong; tránh gắn nhãn k+1 cho canvas
 *      còn hiện frame k — xem ghi chú "sửa lần 2" trong sampler).
 *  Sampler (rAF + setInterval 10 ms, cùng 1 hàm sample idempotent theo key)
 *  chỉ chụp khi key (clip, frameIdx) đổi; first-wins cho mỗi key.
 *
 * Spec: 3 clip × 3 s liên tiếp, cùng 1 file, KHÔNG mask, KHÔNG SR.
 *  --config scroll-blur | scroll-noblur | static-noblur
 *    scroll-blur:    stripes-scroll.mp4 + motionBlur frames 3 (spec V4)
 *    scroll-noblur:  stripes-scroll.mp4, không blur (đo parity trình chiếu thuần)
 *    static-noblur:  stripes-static.mp4, không blur (sanity: MAD kỳ vọng ~0)
 * Chạy: node apps/web/scripts/probe95w3-frame-parity.mjs --engine webkit|chromium --config <c> --tag <run-tag>
 * Scratch: hidden_files/round95-w3/<tag>/frame-parity-results.json
 * KHÔNG push/tag/binary. Không sửa production.
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { chromium, webkit } from "/home/hatch/scratch-round63-r4/node_modules/playwright-core/index.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const argv = process.argv.slice(2);
const ENGINE = argv.includes("--engine") ? argv[argv.indexOf("--engine") + 1] : "webkit";
const CONFIG = argv.includes("--config") ? argv[argv.indexOf("--config") + 1] : "scroll-blur";
const TAG = argv.includes("--tag") ? argv[argv.indexOf("--tag") + 1] : `${ENGINE}-${CONFIG}`;
const SCRATCH = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round95-w3", TAG);
const CFG_DIR = "/tmp/round95-w3";
const VITE_CFG = path.join(CFG_DIR, "vite.w3.config.mjs");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
fs.mkdirSync(SCRATCH, { recursive: true });
fs.mkdirSync(CFG_DIR, { recursive: true });

const PREVIEW_MTIME_BEFORE = (() => {
  try {
    const f = path.join(WEB_DIR, "src", "preview.tsx");
    const st = fs.statSync(f);
    return { mtime: st.mtime.toISOString(), md5: execFileSync("md5sum", [f], { encoding: "utf8" }).split(" ")[0] };
  } catch (e) { return { error: String(e).slice(0, 200) }; }
})();
const BOOT_ID = (() => { try { return fs.readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim(); } catch { return ""; } })();
const ENV_BEFORE = (() => {
  try {
    return {
      bootId: BOOT_ID,
      uptime: execFileSync("sh", ["-c", "uptime; free -m | head -2 | tail -1; cat /proc/loadavg"], { encoding: "utf8" }).trim().replace(/\n/g, " | "),
      psOther: execFileSync("sh", ["-c", "ps -eo args | grep -E 'vite|playwright|chrom|webkit|ffmpeg' | grep -v grep | wc -l"], { encoding: "utf8" }).trim(),
    };
  } catch { return {}; }
})();
log(`frame-parity probe ${ENGINE} config=${CONFIG} tag=${TAG}`);
log(`preview.tsx trước chạy: mtime=${PREVIEW_MTIME_BEFORE.mtime} md5=${PREVIEW_MTIME_BEFORE.md5}`);
log(`môi trường trước chạy: boot=${ENV_BEFORE.bootId} ${ENV_BEFORE.uptime} psOther=${ENV_BEFORE.psOther}`);

const CLIP_FILE = CONFIG === "static-noblur" ? "stripes-static.mp4" : "stripes-scroll.mp4";
const WITH_BLUR = CONFIG === "scroll-blur";
const NCLIPS = 3;
const SPEC = {
  meta: { fps: 30, height: 720, name: "r95w3-frame-parity", width: 1280 },
  version: "0.2.0",
  tracks: [{
    id: "v0", kind: "video",
    clips: Array.from({ length: NCLIPS }, (_, k) => {
      const c = {
        id: `c${k}`, kind: "video", src: CLIP_FILE,
        start: k * 3, duration: 3, in: 0, out: 3,
      };
      if (WITH_BLUR) c.motion = { motionBlur: { frames: 3, weights: [1, 1, 1] } };
      return c;
    }),
  }],
};

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

let vite = null, xvfb = null, browser = null;
async function cleanup() {
  try { if (browser) await browser.close(); } catch {}
  try { if (xvfb) xvfb.kill("SIGKILL"); } catch {}
  try { if (vite) vite.kill("SIGKILL"); } catch {}
}

const STORE_FN = `(async () => {
  const mod = window.__r2storeMod || (window.__r2storeMod = await import("/src/store.ts"));
  return mod.useStore.getState();
})()`;

// Sampler đồng bộ theo frame. Cài sau boot, TRƯỚC khi phát.
// - drawImage wrapper: ghi video->preview-canvas draws (kèm ct lúc vẽ).
// - sample(): rAF + setInterval 10ms; key=(clip,frameIdx); first-wins;
//   nguồn nhãn 'tick' (ưu tiên) hoặc 'draw' (chỉ khi tick record không tiến).
// - Theo dõi fallback/ring/viaRvfc theo clip để đo cửa sổ mù.
const INSTALL_SAMPLER = `(async () => {
  const mod = await import("/src/store.ts");
  const st = () => mod.useStore.getState();
  const off = document.createElement("canvas"); off.width = 96; off.height = 54;
  const octx = off.getContext("2d");
  // Đợt 97 Y9: tóm tắt timing live — draws/mainDraws chỉ giữ 2000 mẫu
  // cuối (cap), nhưng tóm tắt này tính MỌI mẫu nên timing đầu lượt dày
  // không mất: n, first/last, gap min/max/sum/sq, số mẫu theo bucket
  // 500 ms (mật độ theo thời gian, thấy được đầu lượt).
  // Đợt 98 Z8: thêm bucketsPlay (bucket trừ playT0rel) + prePlayN — xem sumPush.
  function newDrawSummary() { return { n: 0, firstT: null, lastT: null, gapMin: null, gapMax: null, gapSum: 0, gapSq: 0, buckets: {}, bucketsPlay: {}, prePlayN: 0, playT0rel: null }; }
  // Đợt 98 Z8: sumPush nay nhận thêm playT0rel (ms kể từ t0, null khi
  // chưa phát) — bucket theo thời gian PHÁT (Y9 nợ §6.5): bucketsPlay
  // trừ playT0rel ngay lúc push, mẫu sau play rơi vào bucket 0,1,2...
  // (từng 500 ms sau playT0); mẫu trước khi phát đếm riêng prePlayN,
  // không trộn vào bucketsPlay. buckets (theo t0) giữ nguyên để tương
  // thích analyzer cũ; gap/first/last không đổi.
  function sumPush(s, t, playT0rel) {
    // Làm tròn t trước khi tính gap: lastT lưu Math.round mà gap tính
    // từ t thô sẽ cho gapMin âm giả (-0,3 ms ở lượt y9-after) — dùng
    // cùng mốc tròn thì gap luôn là số nguyên ms ≥ 0.
    const rt = Math.round(t);
    if (s.n === 0) { s.firstT = rt; }
    else { const g = rt - s.lastT; if (s.gapMin === null || g < s.gapMin) s.gapMin = g; if (s.gapMax === null || g > s.gapMax) s.gapMax = g; s.gapSum += g; s.gapSq += g * g; }
    s.lastT = rt; s.n++;
    const b = Math.floor(t / 500); s.buckets[b] = (s.buckets[b] || 0) + 1;
    if (playT0rel === null || playT0rel === undefined) { s.prePlayN++; }
    else {
      if (s.playT0rel === null) s.playT0rel = Math.round(playT0rel);
      const bp = Math.floor((t - playT0rel) / 500);
      if (bp < 0) { s.prePlayN++; } else { s.bucketsPlay[bp] = (s.bucketsPlay[bp] || 0) + 1; }
    }
  }
  const W3 = window.__vcut95w3 = {
    t0: performance.now(), playT0: null, caps: {}, capList: [],
    lastKey: null, lastTickLen: 0, lastDrawN: 0,
    draws: [], mainDraws: [], drawsSummary: newDrawSummary(), mainSummary: newDrawSummary(), consumedMainT: -1, collisions: 0, drawsTotal: 0, samples: 0,
    rafCount: 0, intCount: 0, visState: document.visibilityState,
    fbAt: {}, ringFirstAt: {}, viaFlipAt: {}, silentSeenAt: null,
    tagAgree: 0, tagDisagree: 0, tagBoth: 0,
  };
  // (b) drawImage wrapper — ghi MỌI lần video element được vẽ (bất kể đích)
  // VÀ mọi lần vẽ LÊN canvas preview (bất kể nguồn).
  // Đợt 95 W3 sửa lần 2: chỉ dùng draw video thì GẮN SAI — draw video (vào
  // intermediate) xảy ra TRƯỚC khi tick vẽ xong lên canvas chính; poll rơi
  // vào giữa chừng sẽ chụp canvas frame k rồi gắn nhãn k+1 (bằng chứng:
  // lượt chr-blur-r1 chạy bù: tagAgree chỉ 56/113 — một nửa số lần kiểm tra
  // rơi vào giữa tick, draw đã sang frame mới mà tick record chưa cập nhật).
  // Vì vậy nguồn (b) chỉ chụp khi có mainDraw MỚI (canvas chính vừa cập nhật
  // xong tick đó) — lúc đó canvas là output của tick vừa xong, còn draw video
  // gần nhất (cùng tick, pipeline vẽ video trước, vẽ chính sau) cho frameIdx.
  // Video chỉ còn được vẽ vào canvas TRUNG GIAN (native/held, cùng khổ
  // mw×mh, cùng tick, cùng frame) — xem preview.tsx ~2929–3110.
  if (!window.__vcut95w3Wrapped) {
    window.__vcut95w3Wrapped = true;
    const orig = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (src, ...rest) {
      try {
        if (src instanceof HTMLVideoElement) {
          // Đợt 97 Y9: cap 400 → 2000 + tóm tắt live (sumPush) — cap cũ
          // cắt 62% draws, chỉ giữ ~3,3 s cuối của lượt 9,5 s (y9-before:
          // drawsTotal 1052, kept 400, cửa sổ giữ 126304–129647 ms).
          const dt = performance.now() - W3.t0;
          W3.draws.push({ t: dt, ct: src.currentTime, w: this.canvas ? this.canvas.width : 0, h: this.canvas ? this.canvas.height : 0 });
          W3.drawsTotal++;
          sumPush(W3.drawsSummary, dt, W3.playT0 === null ? null : W3.playT0 - W3.t0);
          if (W3.draws.length > 2000) W3.draws.splice(0, W3.draws.length - 2000);
        } else {
          // Mọi lần vẽ LÊN canvas preview (bất kể nguồn): mốc "canvas chính
          // vừa cập nhật xong". Xem ghi chú "sửa lần 2" ở đầu wrapper.
          const pc = document.querySelector(".preview-canvas");
          if (pc && this.canvas === pc) {
            const mt = performance.now() - W3.t0;
            W3.mainDraws.push(mt);
            sumPush(W3.mainSummary, mt, W3.playT0 === null ? null : W3.playT0 - W3.t0);
            if (W3.mainDraws.length > 2000) W3.mainDraws.splice(0, W3.mainDraws.length - 2000);
          }
        }
      } catch {}
      return orig.apply(this, [src, ...rest]);
    };
  }
  function clipOf(ph) { return "c" + Math.min(2, Math.max(0, Math.floor(ph / 3))); }
  function dbgMap() {
    try { const m = window.__vcutMotionBlurSnapshots; return m ? [...m.entries()] : []; } catch { return []; }
  }
  function sample() {
    try {
      W3.samples++;
      const s = st();
      const ph = s.playhead;
      const clip = clipOf(ph);
      const relPlay = W3.playT0 === null ? null : performance.now() - W3.playT0;
      // Theo dõi fallback / ring / silentEngine theo clip (độ phân giải ~1 tick).
      for (const [id, v] of dbgMap()) {
        if (v.rvfcFallback && W3.fbAt[id] === undefined && relPlay !== null) W3.fbAt[id] = Math.round(relPlay);
        if (v.ring > 0 && W3.ringFirstAt[id] === undefined && relPlay !== null) W3.ringFirstAt[id] = Math.round(relPlay);
      }
      if (window.__vcutRvfcSilentEngine === true && W3.silentSeenAt === null && relPlay !== null) W3.silentSeenAt = Math.round(relPlay);
      if (!s.playing || W3.playT0 === null) return;
      const c = document.querySelector(".preview-canvas");
      if (!c || !octx) return;
      // Nguồn (a): tick record mới nhất — chỉ nhận khi key chưa có (first-wins).
      const tick = window.__vcutTickCost;
      let key = null, tag = null, viaRvfc = null, path = null, frameIdx = null, drawCt = null, ctGap = null;
      if (tick && tick.length) {
        const last = tick[tick.length - 1];
        if (last.frameIdx >= 0) {
          const k = clip + "|" + last.frameIdx;
          if (W3.caps[k] === undefined) {
            key = k;
            tag = "tick"; frameIdx = last.frameIdx; viaRvfc = last.viaRvfc; path = last.path;
          }
          // Kiểm chứng chéo: draw gần nhất có cùng frameIdx không?
          const d = W3.draws.length ? W3.draws[W3.draws.length - 1] : null;
          if (d) {
            const dIdx = Math.floor((d.ct + 1e-6) * 30);
            W3.tagBoth++;
            if (dIdx === last.frameIdx) W3.tagAgree++; else W3.tagDisagree++;
          }
        }
      }
      // Nguồn (b): khi (a) không cho key mới — CHỈ khi mainDraw gần nhất xảy
      // ra SAU video draw gần nhất (m >= d.t: tick đã vẽ xong lên canvas
      // chính; nếu video draw mới hơn mainDraw thì tick đang vẽ dở — canvas
      // còn hiện frame cũ, KHÔNG chụp). Lấy frameIdx từ video draw đó
      // (cùng tick với mainDraw). Đối chiếu ct với vị trí timeline để loại
      // draw lạ.
      if (key === null) {
        const m = W3.mainDraws.length ? W3.mainDraws[W3.mainDraws.length - 1] : null;
        const d = W3.draws.length ? W3.draws[W3.draws.length - 1] : null;
        if (m !== null && d && m >= d.t) {
          const dIdx = Math.floor((d.ct + 1e-6) * 30);
          const dKey = clip + "|" + dIdx;
          // Chỉ nhận draw có ct khớp vị trí timeline (|ctGap| ≤ 0,5 s):
          // draw của element khác (preload/thumbnail) có ct lệch hẳn.
          const gap = d.ct - (ph - Math.floor(ph / 3) * 3);
          if (W3.caps[dKey] === undefined && Math.abs(gap) <= 0.5) {
            key = dKey; tag = "draw"; frameIdx = dIdx; viaRvfc = null; path = null;
            drawCt = d.ct;
            ctGap = +(d.ct - (ph - Math.floor(ph / 3) * 3)).toFixed(3);
          }
        }
      }
      if (key === null) return;
      W3.lastKey = key;
      octx.drawImage(c, 0, 0, 96, 54);
      const d = octx.getImageData(0, 0, 96, 54).data;
      const g = new Array(96 * 54);
      for (let i = 0; i < 96 * 54; i++) g[i] = Math.round((d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3);
      const dbg = {};
      for (const [id, v] of dbgMap()) dbg[id] = { ring: v.ring, lastFrame: v.lastFrame, prevFrame: v.prevFrame, caps: v.rvfcCaptures, fb: v.rvfcFallback ?? "", lastDrawn: v.lastDrawnFrameIdx, lastDrawnLast: v.lastDrawnLastFrame, lastDrawnPrev: v.lastDrawnPrevFrame };
      const els = (window.__vcutMediaEls || []).filter((e) => e.tag === "VIDEO").map((e) => ({ ct: +e.el.currentTime.toFixed(3), paused: e.el.paused }));
      const cap = { key, clip, frameIdx, tag, viaRvfc, path, drawCt, ctGap, t: Math.round(performance.now() - W3.t0), relPlay: relPlay === null ? null : Math.round(relPlay), ph: +ph.toFixed(3), px: g, dbg, els, pumpN: (window.__vcutRvfcPump || []).length, silent: window.__vcutRvfcSilentEngine === true };
      W3.caps[key] = cap;
      W3.capList.push(cap);
    } catch {}
  }
  function loop() { W3.rafCount++; sample(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  setInterval(() => { W3.intCount++; sample(); }, 10);
  return true;
})()`;

async function main() {
  if (!VITE_BIN) throw new Error("không thấy vite");
  const DEV_PORT = await pickFreePort(5590, 5599);
  if (!DEV_PORT) throw new Error("hết cổng trống");
  let DISPLAY = null;
  for (const d of [":193", ":194", ":195", ":196", ":197"]) {
    const sockD = `/tmp/.X11-unix/X${d.slice(1)}`;
    let alive = false;
    if (fs.existsSync(sockD)) {
      try { alive = execFileSync("sh", ["-c", `ps -eo args | grep -F "Xvfb ${d} " | grep -v grep | head -1`], { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) continue;
      try { fs.unlinkSync(sockD); } catch {}
    }
    DISPLAY = d; break;
  }
  if (!DISPLAY) throw new Error("hết display Xvfb trống :193–:197");
  fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  log(`vite :${DEV_PORT} DISPLAY=${DISPLAY} (ghi vào ${TAG})`);

  let up = false;
  for (let attempt = 1; attempt <= 6 && !up; attempt++) {
    const attemptLog = path.join(SCRATCH, `vite-attempt${attempt}.log`);
    const fd = fs.openSync(attemptLog, "w");
    vite = spawn(VITE_BIN, ["--configLoader", "native", "-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", fd, fd], env: { ...process.env } });
    for (let i = 0; i < 30 && !up; i++) {
      if (vite.exitCode !== null) break;
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(3000) }); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) {
      log(`vite attempt ${attempt} chưa lên (exit=${vite.exitCode})`);
      try { if (vite.exitCode === null) vite.kill("SIGKILL"); } catch {}
      fs.closeSync(fd);
      if (attempt < 6) await sleep(10000);
    } else fs.closeSync(fd);
  }
  if (!up) throw new Error("vite dev không lên sau 6 lần thử");
  log("vite dev đã lên");

  for (let xAttempt = 1; xAttempt <= 3; xAttempt++) {
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode === null && fs.existsSync(`/tmp/.X11-unix/X${DISPLAY.slice(1)}`)) { log(`Xvfb ${DISPLAY} đã lên`); break; }
    try { xvfb.kill("SIGKILL"); } catch {}
    xvfb = null;
    if (xAttempt === 3) throw new Error("Xvfb không khởi động được sau 3 lần thử");
    await sleep(15000);
  }

  const pw = ENGINE === "webkit" ? webkit : chromium;
  const launchEnv = { ...process.env, DISPLAY };
  if (ENGINE === "webkit") launchEnv.GST_PLUGIN_SYSTEM_PATH = "/usr/lib/x86_64-linux-gnu/gstreamer-1.0";
  browser = await pw.launch({ headless: false, env: launchEnv });
  log(`${ENGINE} launched, version: ${browser.version()}`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrs = [];
  page.on("pageerror", (e) => pageErrs.push("pageerror: " + String(e && e.message || e).slice(0, 300)));
  page.on("crash", () => pageErrs.push("PAGE-CRASH"));
  const evalJs = (expr) => page.evaluate(expr);
  // Đợt 95 W3: rAF trên WebKit/Xvfb có dấu hiệu bị throttle (wk-blur-r1:
  // sampler chạy 19922 lần nhưng app chỉ tick 7 lần) — đưa page lên trước
  // để loại trừ khả năng tab bị coi là ẩn/occluded.
  try { await page.bringToFront(); } catch {}

  await page.goto(DEV_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  let booted = false;
  for (let i = 0; i < 240; i++) {
    const hasCanvas = await evalJs(`!!document.querySelector("#vcut-preview-wrap canvas.preview-canvas")`).catch(() => false);
    if (hasCanvas) { booted = true; break; }
    if (i % 40 === 39) log(`chờ app boot… ${(i + 1) * 0.5}s`);
    await sleep(500);
  }
  if (!booted) throw new Error("app không boot (không thấy canvas preview)");
  log("app boot OK");
  for (let i = 0; i < 20; i++) {
    const closed = await evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) { b.click(); return "closed"; } return "no-modal"; })()`).catch(() => "err");
    if (closed === "closed") break;
    await sleep(500);
  }

  const specJson = JSON.stringify(SPEC).replace(/`/g, "\\`").replace(/\$/g, "\\$");
  const seeded = await evalJs(`(async () => {
    const st = await (${STORE_FN});
    st.replaceProject(${specJson});
    const res = await fetch("/${CLIP_FILE}");
    if (!res.ok) return { error: "fetch media lỗi " + res.status };
    const blob = await res.blob();
    const file = new File([blob], "${CLIP_FILE}", { type: "video/mp4" });
    const st2 = await (${STORE_FN});
    await st2.importFiles([file]);
    const st3 = await (${STORE_FN});
    return { media: (st3.media || []).map((m) => m.name), clips: st3.spec.tracks.flatMap((t) => t.clips.map((c) => c.id)) };
  })()`);
  log("seed: " + JSON.stringify(seeded));
  if (!seeded || seeded.error || !(seeded.media || []).includes(CLIP_FILE)) throw new Error("seed media thất bại");
  await sleep(1500);

  await evalJs(INSTALL_SAMPLER);
  log("sampler frame-sync đã cài (rAF + 10ms, drawImage wrapper)");
  // Chờ yên NGAY trước khi phát (cổng tải trong probe): driver chỉ kiểm tra
  // trước khi gọi probe, sibling có thể burst trong ~1 phút sau đó (lượt
  // chr-blur-r1: driver thấy load1=1,60 lúc 06:04:21 nhưng lúc phát 06:05:27
  // đã 7,86). Kiểm tra mỗi 5 s rồi phát ngay khi yên để thu hẹp cửa sổ burst.
  let quietWaited = 0;
  for (;;) {
    const l1 = parseFloat(fs.readFileSync("/proc/loadavg", "utf8").split(" ")[0]);
    if (l1 < 2.0 || quietWaited >= 300) {
      if (quietWaited >= 300) log(`hết chờ yên trước phát (load1=${l1}) — vẫn phát, lượt này có thể nhiễm tải`);
      else if (quietWaited > 0) log(`yên trước phát: load1=${l1} (đã chờ ${quietWaited}s)`);
      break;
    }
    if (quietWaited % 30 === 0) log(`chờ yên trước phát: load1=${l1} (${quietWaited}s)`);
    await sleep(5000);
    quietWaited += 5;
  }
  const loadAtPlay = execFileSync("sh", ["-c", "cat /proc/loadavg; free -m | head -2 | tail -1; ps -eo args | grep -E 'vite|playwright|chrom|webkit|ffmpeg' | grep -v grep | wc -l"], { encoding: "utf8" }).trim().replace(/\n/g, " | ");
  log("load lúc phát: " + loadAtPlay);
  await evalJs(`(async () => { const st = await (${STORE_FN}); st.setPlayhead(0); window.__vcut95w3.playT0 = performance.now(); if (!st.playing) st.togglePlay(); return true; })()`);
  const playStartWall = Date.now();
  const endPh = NCLIPS * 3 - 0.2;
  let done = false;
  while (Date.now() - playStartWall < 90000) {
    const st = await evalJs(STORE_FN).catch(() => null);
    if (st && st.playhead > endPh) { done = true; break; }
    await sleep(500);
  }
  if (!done) log(`CẢNH BÁO: playhead chưa tới ${endPh} sau 90s — vẫn lấy mẫu đã có`);
  await evalJs(`(async () => { const st = await (${STORE_FN}); if (st.playing) st.togglePlay(); return true; })()`).catch(() => null);
  await sleep(500);
  const result = await evalJs(`(() => {
    const W3 = window.__vcut95w3 || { capList: [], fbAt: {}, ringFirstAt: {}, viaFlipAt: {}, silentSeenAt: null, collisions: 0, drawsTotal: 0, samples: 0, tagAgree: 0, tagDisagree: 0, tagBoth: 0 };
    const pump = (window.__vcutRvfcPump || []).map((e) => ({ seq: e.seq, tInvoke: Math.round(e.tInvoke), relPlayMs: W3.playT0 === null ? null : Math.round(e.tInvoke - W3.playT0), frameIdx: e.frameIdx, decision: e.decision, capMs: e.capMs === null ? null : +e.capMs.toFixed(1), presentedFrames: e.presentedFrames, mediaTime: e.mediaTime }));
    const tick = (window.__vcutTickCost || []).slice(-1500).map((e) => ({ wallMs: Math.round(e.wallMs), frameIdx: e.frameIdx, viaRvfc: e.viaRvfc, path: e.path }));
    const dbg = (() => { try { const m = window.__vcutMotionBlurSnapshots; return m ? [...m.entries()].map(([id, v]) => ({ id, ring: v.ring, lastFrame: v.lastFrame, caps: v.rvfcCaptures, dups: v.rvfcSkippedDuplicate, clears: v.ringClears, active: !!v.rvfcActive, fb: v.rvfcFallback ?? "", lastDrawn: v.lastDrawnFrameIdx })) : null; } catch { return null; } })();
    return { engine: null, config: null, tag: null, userAgent: navigator.userAgent,
      playT0rel: W3.playT0 === null ? null : Math.round(W3.playT0 - W3.t0),
      caps: W3.capList, nCaps: W3.capList.length, collisions: W3.collisions,
      drawsTotal: W3.drawsTotal, drawsKept: (W3.draws || []).length, mainDraws: (W3.mainDraws || []).length, mainDrawsTotal: (W3.mainSummary || {}).n || 0, drawsSummary: W3.drawsSummary || null, mainSummary: W3.mainSummary || null, samples: W3.samples,
      rafCount: W3.rafCount, intCount: W3.intCount, visState: W3.visState,
      visStateNow: document.visibilityState, hasFocus: document.hasFocus(),
      tagAgree: W3.tagAgree, tagDisagree: W3.tagDisagree, tagBoth: W3.tagBoth,
      fbAt: W3.fbAt, ringFirstAt: W3.ringFirstAt, silentSeenAt: W3.silentSeenAt,
      pump, tick, dbgFinal: dbg, silentEngine: window.__vcutRvfcSilentEngine === true };
  })()`).catch((e) => ({ __error: String(e).slice(0, 300) }));
  if (result.__error) throw new Error("lấy kết quả lỗi: " + result.__error);
  result.loadAtPlay = loadAtPlay;
  result.engine = ENGINE;
  result.config = CONFIG;
  result.tag = TAG;
  result.pageErrs = pageErrs;
  result.mtimeBefore = PREVIEW_MTIME_BEFORE;
  result.mtimeAfter = (() => {
    try {
      const f = path.join(WEB_DIR, "src", "preview.tsx");
      const st = fs.statSync(f);
      return { mtime: st.mtime.toISOString(), md5: execFileSync("md5sum", [f], { encoding: "utf8" }).split(" ")[0] };
    } catch (e) { return { error: String(e).slice(0, 200) }; }
  })();
  result.mtimeChangedMidRun = result.mtimeAfter.md5 !== PREVIEW_MTIME_BEFORE.md5;
  result.envBefore = ENV_BEFORE;
  result.envAfter = (() => {
    try {
      return {
        bootId: BOOT_ID,
        uptime: execFileSync("sh", ["-c", "uptime; free -m | head -2 | tail -1; cat /proc/loadavg"], { encoding: "utf8" }).trim().replace(/\n/g, " | "),
        psOther: execFileSync("sh", ["-c", "ps -eo args | grep -E 'vite|playwright|chrom|webkit|ffmpeg' | grep -v grep | wc -l"], { encoding: "utf8" }).trim(),
      };
    } catch { return {}; }
  })();
  result.loadavg = result.envAfter.uptime || "";
  fs.writeFileSync(path.join(SCRATCH, "frame-parity-results.json"), JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(SCRATCH, "frame-parity-log.txt"), logLines.join("\n") + "\n");

  const byClip = {};
  for (const c of result.caps) byClip[c.clip] = (byClip[c.clip] || 0) + 1;
  log(`KẾT QUẢ ${TAG}: caps=${result.nCaps} theo clip=${JSON.stringify(byClip)} tagAgree=${result.tagAgree}/${result.tagBoth} tagDisagree=${result.tagDisagree} collisions=${result.collisions} pumpN=${result.pump.length} fbAt=${JSON.stringify(result.fbAt)} ringFirstAt=${JSON.stringify(result.ringFirstAt)} silentEngine=${result.silentEngine} mtimeChanged=${result.mtimeChangedMidRun} pageErrs=${pageErrs.length}`);
  await cleanup();
}

main().catch(async (e) => {
  console.error("FRAME-PARITY PROBE LỖI: " + (e && e.stack || e));
  try { fs.writeFileSync(path.join(SCRATCH, "frame-parity-error.txt"), String(e && e.stack || e)); } catch {}
  try { fs.writeFileSync(path.join(SCRATCH, "frame-parity-log.txt"), logLines.join("\n") + "\n"); } catch {}
  await cleanup();
  process.exit(2);
}).then(() => process.exit(0));
