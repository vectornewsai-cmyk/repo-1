#!/usr/bin/env node
/**
 * clicktest-87o8-mask-track-webkit.mjs — Phase 9 đợt 87, luồng O8:
 * CLICK-TEST mask bám motion track TRÊN WebKitGTK (bản port Playwright của
 * clicktest-87o8-mask-track-headed.mjs — cùng fixture, cùng kỳ vọng đo,
 * cùng verdict; chỉ khác tầng điều khiển browser).
 *
 * WebKit chỉ chạy được sau khi `install-deps webkit` xong trên boot này
 * (trước đó MiniBrowser chết vì thiếu libevent-2.1.so.7 — xem LIMITS §5).
 * BẮT BUỘC env GST_PLUGIN_SYSTEM_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
 * khi launch (phát hiện N2 đợt 86: không có thì WebProcess crash 100%).
 *
 * Chạy (từ gốc repo): xvfb-run -a node apps/web/scripts/clicktest-87o8-mask-track-webkit.mjs
 * (tự spawn Xvfb :188 nếu chưa có; không cần xvfb-run nếu DISPLAY đã set).
 * Env: O8W_DEV_PORT (5560–5569), O8W_DISPLAY (:188),
 *   O8W_SCRATCH (hidden_files/round87-o8/webkit).
 * Đợt 89 Q5 — measureAtPlayhead nay XÁC NHẬN seek hoàn tất trước khi đo
 *   (element currentTime/seeking qua __vcutMediaEls + playhead + khung đổi
 *   + ổn định; hết 30s chưa xác nhận → STALE, scenario FAIL thay vì PASS
 *   rỗng — xem P5 đợt 88 §3.3); S7 thêm kiểm tra di chuyển giữa t=1 và t=5.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { webkit } from "/home/hatch/scratch-round63-r4/node_modules/playwright-core/index.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.O8W_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round87-o8", "webkit");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const CFG_DIR = "/tmp/round87-o8";
const VITE_CFG = path.join(CFG_DIR, "vite.o8w.config.mjs");
const BRIDGE_ENTRY = path.join(ROOT, "server", "bridge", "src", "index.js");
const BRIDGE_WORK_DIR = "/tmp/round87-o8/bridge-work-w";

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

// ---- JS chạy trong trang (y hệt bản Chromium) ------------------------------
const STORE_FN = `(async () => {
  const mod = window.__o8wstoreMod || (window.__o8wstoreMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return {
    clipCount: st.spec.tracks.reduce((n, t) => n + t.clips.length, 0),
    mediaCount: st.media.length,
    playhead: st.playhead,
    playing: st.playing,
    metaW: st.spec.meta?.width ?? null,
    metaH: st.spec.meta?.height ?? null,
    selection: st.selection,
    media: st.media.map((m) => ({ name: m.name, kind: m.kind, hasFile: !!m.file })),
    clips: st.spec.tracks.flatMap((t) => t.clips.map((c) => ({
      id: c.id, trackId: t.id, kind: c.kind, src: c.src, start: c.start, duration: c.duration,
      mask: c.mask ? { shape: c.mask.shape, x: c.mask.x, y: c.mask.y, w: c.mask.w, h: c.mask.h, feather: c.mask.feather } : null,
      track: c.track ? { n: c.track.points.length } : null,
    }))),
  };
})()`;

const CARD_FN = (name) => `(() => {
  const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
  if (!card) return null;
  const addBtn = [...card.querySelectorAll("button")].find((b) => (b.textContent || "").includes("Thêm"));
  return { found: true, addRect: addBtn ? (() => { const r = addBtn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : null };
})()`;

const AUTO_UI_FN = `(() => {
  const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
  if (!label) return null;
  const cb = label.querySelector('input[type="checkbox"]');
  const r = cb ? cb.getBoundingClientRect() : null;
  return { checked: cb ? cb.checked : null, cbRect: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null };
})()`;

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

// Đợt 89 Q5 — đo blob + playhead TRONG CÙNG 1 evaluate: đọc ở 2 evaluate
// riêng, mỗi cái ~1s dưới tải, playhead chạy tiếp trong lúc chờ → blob
// "lag" ~0,7s so với kỳ vọng (WebKit lần chạy 13:17: lệch 0,034, chỉ hơn
// ngưỡng 0,03) — artifact đo, không phải hành vi sản phẩm.
const MEASURE_PLAYHEAD_FN = `(async () => {
  const measure = ${MEASURE_FN};
  const mod = window.__o8wstoreMod || (window.__o8wstoreMod = await import("/src/store.ts"));
  const st = mod.useStore.getState();
  return { measure, playhead: st.playhead, playing: st.playing };
})()`;

const VIDEOS_FN = `([...document.querySelectorAll("video")].map((v) => ({ src: (v.currentSrc || "").split("/").pop(), t: +v.currentTime.toFixed(2), paused: v.paused, vw: v.videoWidth, vh: v.videoHeight })))`;

// Đợt 89 Q5 — element media thật qua hook __vcutMediaEls (preview.tsx
// phơi ở cả nhánh playing lẫn pause từ đợt này): video preview không nằm
// trong DOM nên VIDEOS_FN luôn trả [] — đây là tín hiệu element để xác
// nhận seek (currentTime ≈ target VÀ seeking === false), độc lập với
// tín hiệu canvas.
const ELS_FN = `((window.__vcutMediaEls || []).map((e) => ({
  tag: e.tag,
  t: +e.el.currentTime.toFixed(3),
  paused: e.el.paused,
  seeking: e.el.seeking,
  readyState: e.el.readyState,
  srcTail: (e.el.currentSrc || e.el.src || "").slice(-80),
  srcKey: (e.el.dataset?.srcKey || "").slice(-80),
})))`;

const HINT_FN = `(() => {
  const panel = document.querySelector(".mask-panel");
  if (!panel) return { found: false, state: "nopanel" };
  const txt = panel.innerText || "";
  const hasRawFollow = txt.includes("mask.trackFollow");
  const hasRawAttach = txt.includes("mask.trackAttachHint") || txt.includes("mask.trackAttachBtn");
  const hasProperFollow = txt.includes("đang bám theo motion track");
  const hasProperAttach = txt.includes("đang đứng yên");
  const el = [...panel.querySelectorAll("p, button")].find((e) => (e.textContent || "").includes("đang bám") || (e.textContent || "").includes("mask.trackFollow") || (e.textContent || "").includes("đang đứng yên") || (e.textContent || "").includes("mask.trackAttachHint"));
  const cs = el ? getComputedStyle(el) : null;
  const visible = !!(el && cs.display !== "none" && cs.visibility !== "hidden" && el.getBoundingClientRect().width > 0);
  if (hasProperFollow || hasRawFollow) return { found: true, state: "follow", form: hasProperFollow ? "proper" : "rawKey", text: (el?.textContent || "").trim().slice(0, 160), visible };
  if (hasProperAttach || hasRawAttach) return { found: true, state: "attach", form: hasProperAttach ? "proper" : "rawKey", text: (el?.textContent || "").trim().slice(0, 160), visible };
  return { found: false, state: "none" };
})()`;

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

const SET_SHAPE_FN = (shape) => `(() => {
  const sel = document.querySelector(".mask-panel select");
  if (!sel) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(sel, ${JSON.stringify(shape)});
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
})()`;

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

const TRACK_FILE = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round87-o8", "headed", "o8-track-35-65.json");
const HEAD = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round87-o8", "headed");
const CLIP_W = path.join(HEAD, "o8-white-720p-6s.mp4");
const CLIP_B = path.join(HEAD, "o8-ball-720p-6s.mp4");
const CLIP_W_NAME = path.basename(CLIP_W);
const CLIP_B_NAME = path.basename(CLIP_B);

let vite = null, bridge = null, xvfb = null, browser = null;

async function startBridge(port) {
  const logFd = fs.openSync(path.join(SCRATCH, "o8w-bridge.log"), "a");
  const b = spawn("node", [path.join(ROOT, "server", "bridge", "src", "index.js")], {
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR,
      BRIDGE_RATE_PERSIST_PATH: path.join(BRIDGE_WORK_DIR, `rate-limit-o8w-${process.pid}.json`) },
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

async function main() {
  // Đợt 95 W8 — mkdir scratch TRƯỚC khi kiểm tra fixture (nợ V8/đợt 94
  // §4 mục 8, cùng lỗi thứ tự như bản headed): trước đây check fixture
  // (nằm ở HEAD/headed, không phải SCRATCH) chạy trước mkdir nên khi
  // fixture thiếu thì script chết trước cả lúc tạo scratch — khối catch
  // cuối main không ghi được report JSON vào SCRATCH. Nay scratch đã có
  // sẵn trước khi check, report lỗi hạ cánh được đúng chỗ.
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.mkdirSync(CFG_DIR, { recursive: true });
  fs.mkdirSync(BRIDGE_WORK_DIR, { recursive: true });
  if (!fs.existsSync(CLIP_W) || !fs.existsSync(CLIP_B) || !fs.existsSync(TRACK_FILE)) {
    throw new Error("thiếu fixture trong hidden_files/round87-o8/headed (clip W/B hoặc track JSON)");
  }
  const bridgePort = await pickFreePort(8861, 8869);
  if (!bridgePort) throw new Error("hết cổng bridge trống 8861–8869");
  const BRIDGE_URL = `http://127.0.0.1:${bridgePort}`;
  const DEV_PORT = Number(process.env.O8W_DEV_PORT || 0) || (await pickFreePort(5560, 5569));
  const DISPLAY = process.env.O8W_DISPLAY || ":188";
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5560–5569");
  const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = execFileSync("sh", ["-c", `ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`], { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
    if (alive) throw new Error(`display ${DISPLAY} đã có X server khác`);
    fs.unlinkSync(sock);
    log(`đã dọn socket X mồ côi ${sock}`);
  }
  if (!VITE_BIN) throw new Error("không thấy vite");
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  // (mkdir SCRATCH/CFG_DIR/BRIDGE_WORK_DIR đã dời lên đầu main — đợt 95 W8.)
  writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
  log(`vite dev :${DEV_PORT}, DISPLAY=${DISPLAY}, bridge :${bridgePort}`);

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
  let up = false;
  let lastViteErr = "";
  for (let attempt = 1; attempt <= 8 && !up; attempt++) {
    const viteLogFd = fs.openSync(path.join(SCRATCH, `o8w-vite-attempt${attempt}.log`), "w");
    // Đợt 89 Q5 — --configLoader native: vite import trực tiếp config, KHÔNG
    // bundle qua loadConfigFromBundledFile (ghi file timestamp-*.mjs cạnh
    // config — chết EPERM khi sóng bật; đã chứng minh native-loader không
    // tạo file tạm nào). Fetch có timeout 3s: vite kẹt không treo vòng poll.
    vite = spawn(VITE_BIN, ["--configLoader", "native", "-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd], env: { ...process.env, VITE_BRIDGE_URL: BRIDGE_URL } });
    for (let i = 0; i < 40 && !up; i++) {
      if (vite.exitCode !== null) break;
      try { const r = await fetch(DEV_URL, { signal: AbortSignal.timeout(3000) }); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) {
      try { lastViteErr = fs.readFileSync(path.join(SCRATCH, `o8w-vite-attempt${attempt}.log`), "utf8").split("\n").slice(0, 4).join(" | "); } catch {}
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

  // BẮT BUỘC (N2 đợt 86): GST_PLUGIN_SYSTEM_PATH trước mọi probe WebKit.
  browser = await webkit.launch({ headless: false,
    env: { ...process.env, DISPLAY, GST_PLUGIN_SYSTEM_PATH: "/usr/lib/x86_64-linux-gnu/gstreamer-1.0" } });
  log(`webkit launched, version: ${browser.version()}`);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrs = [];
  page.on("console", (m) => { if (m.type() === "error") pageErrs.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => pageErrs.push("pageerror: " + String(e && e.message || e).slice(0, 300)));
  page.on("crash", () => pageErrs.push("PAGE-CRASH"));

  const evalJs = (expr) => page.evaluate(expr);
  const shot = (name) => page.screenshot({ path: path.join(SCRATCH, name) });
  async function waitFor(fn, label, timeoutMs = 180000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async function clickRect(getRectFn, label) {
    const rect = await evalJs(getRectFn).catch(() => null);
    if (!rect) return { ok: false, detail: `không đo được rect ${label}` };
    await page.mouse.move(Math.round(rect.x), Math.round(rect.y));
    await sleep(120);
    await page.mouse.click(Math.round(rect.x), Math.round(rect.y));
    await sleep(600);
    return { ok: true };
  }
  async function clickButtonIn(panelSel, textPart, label) {
    const rectFn = `(() => {
      const panel = document.querySelector(${JSON.stringify(panelSel)});
      if (!panel) return null;
      const b = [...panel.querySelectorAll("button")].find((x) => (x.textContent || "").includes(${JSON.stringify(textPart)}));
      if (!b) return null;
      b.scrollIntoView({ block: "center" });
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`;
    return clickRect(rectFn, label);
  }
  async function isolateClip(clipId) {
    const ok = await evalJs(`(async () => {
      const mod = await import("/src/store.ts");
      mod.useStore.setState((s) => ({ spec: { ...s.spec, tracks: s.spec.tracks.map((t) => ({ ...t, clips: t.clips.filter((c) => c.id === ${JSON.stringify(clipId)}) })) } }));
      const st = mod.useStore.getState();
      return st.spec.tracks.reduce((n, t) => n + t.clips.length, 0) === 1;
    })()`).catch(() => false);
    await sleep(600);
    return ok;
  }
  async function selectTimelineClip(clipId) {
    const rectFn = `(() => {
      const el = document.querySelector('[data-clip-id="${clipId}"]');
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const r = await clickRect(rectFn, `clip timeline ${clipId}`);
      if (!r.ok) break;
      await sleep(600);
      const st = await evalJs(STORE_FN).catch(() => null);
      if (st?.selection?.[0]?.clipId === clipId) return { ok: true, method: "Playwright mouse click", attempt };
      await sleep(500);
    }
    const jsOk = await evalJs(`(async () => {
      const mod = await import("/src/store.ts");
      const st = mod.useStore.getState();
      const clip = st.spec.tracks.flatMap((t) => t.clips.map((c) => ({ trackId: t.id, clipId: c.id }))).find((x) => x.clipId === ${JSON.stringify(clipId)});
      if (!clip) return false;
      mod.useStore.setState({ selection: [clip] });
      return true;
    })()`).catch(() => false);
    await sleep(600);
    const st2 = await evalJs(STORE_FN).catch(() => null);
    if (jsOk && st2?.selection?.[0]?.clipId === clipId) return { ok: true, method: "store.setState fallback", attempt: 3 };
    return { ok: false, detail: `jsOk=${jsOk}, selection=${JSON.stringify(st2?.selection)}` };
  }
  async function toggleCheckboxTo(wantChecked) {
    const rectFn = `(() => {
      const label = [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Tự tạo proxy"));
      const cb = label?.querySelector('input[type="checkbox"]');
      if (!cb) return null;
      const r = cb.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const ui = await evalJs(AUTO_UI_FN).catch(() => null);
      if (ui && ui.checked === wantChecked) return { ok: true, method: attempt === 1 ? "đã đúng trạng thái" : "Playwright mouse click", attempt: attempt - 1, ui };
      const r = await clickRect(rectFn, "checkbox tự tạo proxy");
      if (!r.ok) return { ok: false, method: "mouse", detail: r.detail };
      await sleep(400);
      const after = await evalJs(AUTO_UI_FN).catch(() => null);
      if (after && after.checked === wantChecked) return { ok: true, method: "Playwright mouse click", attempt, ui: after };
    }
    return { ok: false, method: "mouse", detail: "hết 3 lần thử" };
  }
  // Đo canvas ở playhead đã pause: setPlayhead rồi XÁC NHẬN seek hoàn tất
  // trước khi đo (đợt 89 Q5 — sửa điểm yếu P5 đợt 88 §3.3: bản cũ chỉ kiểm
  // "canvas ổn định" nên khung đóng băng cũng cho PASS rỗng như S7 lần 2).
  // Tín hiệu độc lập (cần ≥2, không chỉ sleep cố định):
  //  (E) element: video element của clip trong __vcutMediaEls có
  //      currentTime ≈ target (±1 frame) VÀ seeking === false.
  //  (P) store playhead == target (±1 frame).
  //  (C) canvas ĐÃ ĐỔI so với baseline trước seek — chỉ khi
  //      opts.expectChange (frame kỳ vọng đổi: clip có track/bóng).
  //  (S) canvas ổn định: 2 lần đo liên tiếp khớp nhau (<0.01).
  // confirmed = (E || P) && S && (C nếu expectChange). Hết deadline 30s
  // mà chưa confirmed → stale=true: caller PHẢI FAIL với lý do STALE.
  async function measureAtPlayhead(clipStart, localT, shotName, opts = {}) {
    const target = clipStart + localT;
    const expectChange = !!opts.expectChange;
    const clipSrc = opts.clipSrc || null;
    const baseline = await evalJs(MEASURE_FN).catch(() => null);
    await evalJs(`(async () => {
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
      m2 = await evalJs(MEASURE_FN).catch(() => null);
      els = await evalJs(ELS_FN).catch(() => null);
      const st = await evalJs(STORE_FN).catch(() => null);
      playhead = st?.playhead ?? null;
      if (!m2 || m2.brightN <= 0) { m1 = m2; continue; }
      if (playhead !== null && Math.abs(playhead - target) < 1 / 30) signals.playhead = true;
      // (E) element video của clip đã seek xong (currentTime ≈ localT,
      // không seeking). Pool giữ cả element clip cũ (vd clip mẫu ở t=0)
      // nên KHÔNG lấy element VIDEO đầu tiên, và không match theo src
      // (import qua blob URL nên srcTail/srcKey không chứa tên file):
      // chọn element có currentTime GẦN target nhất.
      const vids = (els || []).filter((e) => e.tag === "VIDEO");
      let best = null, bestD = 1e9;
      for (const v of vids) { const d = Math.abs(v.t - localT); if (d < bestD) { bestD = d; best = v; } }
      if (best && !best.seeking && bestD < 1 / 30 + 0.02) signals.element = true;
      if (baseline && baseline.brightN > 0 &&
        (Math.abs((m2.brightCx ?? -1) - (baseline.brightCx ?? -1)) > 0.01 ||
         Math.abs((m2.brightCy ?? -1) - (baseline.brightCy ?? -1)) > 0.01 ||
         Math.abs((m2.darkCx ?? -1) - (baseline.darkCx ?? -1)) > 0.01)) signals.changed = true;
      if (m1 && Math.abs((m1.brightCx ?? -1) - (m2.brightCx ?? -1)) < 0.01 &&
        Math.abs((m1.brightCy ?? -1) - (m2.brightCy ?? -1)) < 0.01) signals.stable = true;
      m1 = m2;
      const confirmed = (signals.element || signals.playhead) && signals.stable && (!expectChange || signals.changed);
      if (confirmed) break;
    }
    const st = await evalJs(STORE_FN).catch(() => null);
    const vids = await evalJs(VIDEOS_FN).catch(() => null);
    if (shotName) await shot(shotName);
    const confirmed = (signals.element || signals.playhead) && signals.stable && (!expectChange || signals.changed);
    return { measure: m2, stable: signals.stable, confirmed, stale: !confirmed, signals,
      baseline: baseline ? { brightCx: baseline.brightCx, brightCy: baseline.brightCy, darkCx: baseline.darkCx, darkCy: baseline.darkCy } : null,
      playhead: st?.playhead ?? playhead, videos: vids, els };
  }
  async function addClipToTimeline(name) {
    const scrolled = await evalJs(`(() => {
      const card = [...document.querySelectorAll(".media-card")].find((c) => (c.querySelector(".media-name")?.textContent || "").trim() === ${JSON.stringify(name)});
      if (!card) return false;
      card.scrollIntoView({ block: "center" });
      return true;
    })()`).catch(() => false);
    await sleep(500);
    const before = await evalJs(STORE_FN).catch(() => null);
    const beforeCount = before?.clipCount ?? 0;
    let added = false;
    if (scrolled) {
      for (let attempt = 1; attempt <= 3 && !added; attempt++) {
        const c = await evalJs(CARD_FN(name)).catch(() => null);
        if (!c?.addRect) break;
        await page.mouse.click(Math.round(c.addRect.x), Math.round(c.addRect.y));
        await sleep(800);
        const afterAdd = await evalJs(STORE_FN).catch(() => null);
        added = !!(afterAdd && afterAdd.clipCount > beforeCount);
        if (!added) await sleep(700);
      }
    }
    return { added, beforeCount };
  }

  // ---- S0: mount + mẫu tự load ------------------------------------------
  let projW = 1280, projH = 720;
  await page.goto(DEV_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  const s0 = await waitFor(async () => {
    const t = await evalJs(STORE_FN).catch(() => null);
    return t && t.clipCount === 3 && t.mediaCount === 2 ? t : null;
  }, "project mẫu tự load (3 clip, media bin 2 item)", 240000);
  if (s0) {
    projW = s0.metaW || 1280; projH = s0.metaH || 720;
    pass("S0 setup: mẫu tự load (WebKit)", `3 clip, media [${s0.media.map((m) => `${m.name}(${m.kind},file=${m.hasFile})`).join(", ")}], project=${projW}x${projH}`);
  } else fail("S0 setup: mẫu tự load (WebKit)", `state=${JSON.stringify(await evalJs(STORE_FN).catch(() => null))}`);

  // ---- S1: tắt auto-proxy --------------------------------------------------
  const toggleOff = await toggleCheckboxTo(false);
  if (toggleOff.ok) pass("S1 tắt auto-proxy trước khi import (setup, WebKit)", `checked=true → false, ${toggleOff.method} lần ${toggleOff.attempt}`);
  else fail("S1 tắt auto-proxy trước khi import (setup, WebKit)", `toggle=${JSON.stringify(toggleOff)}`);

  // ---- S2: import clip W, thêm lên timeline, cô lập, chọn clip ------------
  await page.setInputFiles(".mediabin input[type='file']", CLIP_W);
  const cardW = await waitFor(async () => {
    const c = await evalJs(CARD_FN(CLIP_W_NAME)).catch(() => null);
    return c && c.found ? c : null;
  }, `thẻ media ${CLIP_W_NAME} xuất hiện`, 120000).catch(() => null);
  if (cardW) pass("S2 import clip W: thẻ media xuất hiện (WebKit)", `file=${CLIP_W_NAME}`);
  else fail("S2 import clip W: thẻ media xuất hiện (WebKit)", "không thấy thẻ sau 120s");
  const { added } = await addClipToTimeline(CLIP_W_NAME);
  let clipW = null;
  if (added) {
    const stW = await evalJs(STORE_FN).catch(() => null);
    clipW = stW?.clips?.find((c) => c.src === CLIP_W_NAME);
    if (clipW) pass("S2 thêm clip W lên timeline (WebKit)", `clipId=${clipW.id}, start=${clipW.start}, duration=${clipW.duration}`);
    else fail("S2 thêm clip W lên timeline (WebKit)", `clips=${JSON.stringify(stW?.clips)}`);
  } else fail("S2 thêm clip W lên timeline (WebKit)", "không thêm được");
  if (clipW) {
    const iso = await isolateClip(clipW.id);
    if (iso) pass("S2 cô lập clip W (setup, WebKit)", "timeline còn đúng 1 clip (clip W)");
    else fail("S2 cô lập clip W (setup, WebKit)", "không cô lập được");
    const sel = await selectTimelineClip(clipW.id);
    if (sel.ok) pass("S2 chọn clip W trên timeline (WebKit)", `${sel.method} lần ${sel.attempt}`);
    else fail("S2 chọn clip W trên timeline (WebKit)", sel.detail);
    const panels = await evalJs(`(() => ({ maskPanel: !!document.querySelector(".mask-panel"), trackPanel: !!document.querySelector(".track-panel") }))()`).catch(() => null);
    if (panels && panels.maskPanel && panels.trackPanel) pass("S2 MaskPanel + TrackPanel đều hiện khi chọn clip video (WebKit)", JSON.stringify(panels));
    else fail("S2 MaskPanel + TrackPanel đều hiện khi chọn clip video (WebKit)", JSON.stringify(panels));
  }

  // ---- S3: bật mask qua UI + đặt hình học qua UI --------------------------
  let maskOk = false;
  if (clipW) {
    const en = await clickButtonIn(".mask-panel", "Bật mask", "nút Bật mask");
    await sleep(800);
    const stM = await evalJs(STORE_FN).catch(() => null);
    const m0 = stM?.clips?.find((c) => c.id === clipW.id)?.mask;
    if (en.ok && m0) pass("S3 bấm 'Bật mask' qua UI (WebKit)", `mask mặc định=${JSON.stringify(m0)}`);
    else fail("S3 bấm 'Bật mask' qua UI (WebKit)", `click=${JSON.stringify(en)}, mask=${JSON.stringify(m0)}`);
    const sh = await evalJs(SET_SHAPE_FN("ellipse")).catch(() => false);
    await sleep(400);
    const rCx = await evalJs(SET_RANGE_FN("Tâm ngang", 35)).catch(() => null);
    const rW = await evalJs(SET_RANGE_FN("Rộng", 30)).catch(() => null);
    const rH = await evalJs(SET_RANGE_FN("Cao", 30)).catch(() => null);
    await sleep(600);
    const stM2 = await evalJs(STORE_FN).catch(() => null);
    const m1 = stM2?.clips?.find((c) => c.id === clipW.id)?.mask;
    if (sh && rCx?.ok && rW?.ok && rH?.ok && m1 && m1.shape === "ellipse" && Math.abs(m1.x - 0.35) < 0.01 && Math.abs(m1.y - 0.5) < 0.01 && Math.abs(m1.w - 0.3) < 0.01 && Math.abs(m1.h - 0.3) < 0.01) {
      pass("S3 đặt hình học mask qua UI (WebKit)", `mask=${JSON.stringify(m1)}`);
      maskOk = true;
    } else {
      fail("S3 đặt hình học mask qua UI (WebKit)", `shape=${sh}, cx=${JSON.stringify(rCx)}, w=${JSON.stringify(rW)}, h=${JSON.stringify(rH)}, mask=${JSON.stringify(m1)}`);
    }
    await shot("o8w-s3-mask-panel.png");
  }

  // ---- S4 (c): hồi quy mask tĩnh -------------------------------------------
  if (clipW && maskOk) {
    const c1 = await measureAtPlayhead(clipW.start, 1.0, "o8w-c1-static-t1.png", { clipSrc: CLIP_W_NAME });
    const c2 = await measureAtPlayhead(clipW.start, 5.0, "o8w-c2-static-t5.png", { clipSrc: CLIP_W_NAME });
    const m1 = c1.measure, m2 = c2.measure;
    const e1 = m1 ? canvasExpected(m1, projW, projH, 0.35, 0.5) : null;
    log(`S4 đo tĩnh (WebKit): t=1.0 blob=(${m1?.brightCx},${m1?.brightCy}) n=${m1?.brightN} canvas=${m1?.W}x${m1?.H} videoRect=(${e1?.dx},${e1?.dy},${e1?.dw}x${e1?.dh}) kỳ vọng canvas=(${e1?.cx},${e1?.cy}) stable=${c1.stable} confirmed=${c1.confirmed} signals=${JSON.stringify(c1.signals)} videos=${JSON.stringify(c1.videos)}`);
    log(`S4 đo tĩnh (WebKit): t=5.0 blob=(${m2?.brightCx},${m2?.brightCy}) n=${m2?.brightN} stable=${c2.stable} confirmed=${c2.confirmed} signals=${JSON.stringify(c2.signals)} videos=${JSON.stringify(c2.videos)}`);
    const ok1 = m1 && e1 && Math.abs(m1.brightCx - e1.cx) < 0.03 && Math.abs(m1.brightCy - e1.cy) < 0.03;
    const ok2 = m2 && e1 && Math.abs(m2.brightCx - e1.cx) < 0.03 && Math.abs(m2.brightCy - e1.cy) < 0.03;
    if (!c1.confirmed || !c2.confirmed) fail("S4 (c) mask tĩnh không track: đúng vị trí ở 2 thời điểm (WebKit)", `STALE — seek chưa xác nhận sau 30s (Q5): t=1 confirmed=${c1.confirmed} signals=${JSON.stringify(c1.signals)}; t=5 confirmed=${c2.confirmed} signals=${JSON.stringify(c2.signals)} — không dùng số đo này làm PASS`);
    else if (ok1 && ok2 && Math.abs(m1.brightCx - m2.brightCx) < 0.02) pass("S4 (c) mask tĩnh không track: đúng vị trí ở 2 thời điểm (WebKit)", `t=1 blob=(${m1.brightCx},${m1.brightCy}); t=5 blob=(${m2.brightCx},${m2.brightCy}); kỳ vọng canvas=(${e1.cx},${e1.cy})`);
    else fail("S4 (c) mask tĩnh không track: đúng vị trí ở 2 thời điểm (WebKit)", `t=1 blob=(${m1?.brightCx},${m1?.brightCy}); t=5 blob=(${m2?.brightCx},${m2?.brightCy}); kỳ vọng canvas=(${e1?.cx},${e1?.cy})`);
  }

  // ---- S5 (a): gắn track qua UI, đo mask bám -------------------------------
  let trackOk = false;
  if (clipW && maskOk) {
    await page.setInputFiles(".track-panel input[type='file']", TRACK_FILE);
    await sleep(1500);
    const stT = await evalJs(STORE_FN).catch(() => null);
    const tr = stT?.clips?.find((c) => c.id === clipW.id)?.track;
    if (tr && tr.n === 13) {
      pass("S5 gắn quỹ đạo qua UI TrackPanel (WebKit)", `13 điểm`);
      trackOk = true;
    } else {
      fail("S5 gắn quỹ đạo qua UI TrackPanel (WebKit)", `track=${JSON.stringify(tr)}`);
    }
    await shot("o8w-s5-track-attached.png");
    if (trackOk) {
      const a1 = await measureAtPlayhead(clipW.start, 1.0, "o8w-a1-track-t1.png", { clipSrc: CLIP_W_NAME, expectChange: true });
      const a2 = await measureAtPlayhead(clipW.start, 5.0, "o8w-a2-track-t5.png", { clipSrc: CLIP_W_NAME, expectChange: true });
      const m1 = a1.measure, m2 = a2.measure;
      const eNew1 = m1 ? canvasExpected(m1, projW, projH, 0.40, 0.5) : null;
      const eNew2 = m2 ? canvasExpected(m2, projW, projH, 0.60, 0.5) : null;
      const eOld1 = m1 ? canvasExpected(m1, projW, projH, 0.25, 0.5) : null;
      const eOld2 = m2 ? canvasExpected(m2, projW, projH, 0.45, 0.5) : null;
      log(`S5 đo bám (WebKit): t=1.0 blob=(${m1?.brightCx},${m1?.brightCy}) n=${m1?.brightN} bbox=${JSON.stringify(m1?.bbox)} canvas=${m1?.W}x${m1?.H} kỳ vọng MỚI canvas=(${eNew1?.cx},${eNew1?.cy}) CŨ canvas=(${eOld1?.cx},${eOld1?.cy}) stable=${a1.stable} confirmed=${a1.confirmed} signals=${JSON.stringify(a1.signals)} videos=${JSON.stringify(a1.videos)}`);
      log(`S5 đo bám (WebKit): t=5.0 blob=(${m2?.brightCx},${m2?.brightCy}) n=${m2?.brightN} bbox=${JSON.stringify(m2?.bbox)} kỳ vọng MỚI canvas=(${eNew2?.cx},${eNew2?.cy}) CŨ canvas=(${eOld2?.cx},${eOld2?.cy}) stable=${a2.stable} confirmed=${a2.confirmed} signals=${JSON.stringify(a2.signals)} videos=${JSON.stringify(a2.videos)}`);
      const dNew = m1 && m2 && eNew1 && eNew2 ? Math.max(Math.abs(m1.brightCx - eNew1.cx), Math.abs(m2.brightCx - eNew2.cx)) : 99;
      const dOld = m1 && m2 && eOld1 && eOld2 ? Math.max(Math.abs(m1.brightCx - eOld1.cx), Math.abs(m2.brightCx - eOld2.cx)) : 99;
      const delta = m1 && m2 ? +(m2.brightCx - m1.brightCx).toFixed(3) : null;
      const deltaExp = eNew1 && eNew2 ? +(eNew2.cx - eNew1.cx).toFixed(3) : null;
      if (!a1.confirmed || !a2.confirmed) {
        fail("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm (WebKit)", `STALE — seek chưa xác nhận sau 30s (Q5): t=1 confirmed=${a1.confirmed} signals=${JSON.stringify(a1.signals)}; t=5 confirmed=${a2.confirmed} signals=${JSON.stringify(a2.signals)} — không dùng số đo này làm PASS`);
      } else if (m1 && m2 && dNew < 0.03 && Math.abs(m1.brightCy - 0.5) < 0.03 && Math.abs(m2.brightCy - 0.5) < 0.03) {
        pass("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm (WebKit)", `t=1 blob x=${m1.brightCx} (kỳ vọng canvas ${eNew1.cx}); t=5 blob x=${m2.brightCx} (kỳ vọng canvas ${eNew2.cx}); Δx=${delta} (kỳ vọng ${deltaExp})`);
      } else if (m1 && m2 && dOld < 0.03) {
        fail("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm (WebKit)", `HÀNH VI CŨ (D3): t=1 blob x=${m1.brightCx} (cũ canvas ${eOld1.cx} / mới canvas ${eNew1.cx}); t=5 blob x=${m2.brightCx} (cũ canvas ${eOld2.cx} / mới canvas ${eNew2.cx}); Δx=${delta}`);
      } else {
        fail("S5 (a) mask bám track: tâm mask = vị trí track ở 2 thời điểm (WebKit)", `t=1 blob=(${m1?.brightCx},${m1?.brightCy}); t=5 blob=(${m2?.brightCx},${m2?.brightCy}); kỳ vọng mới canvas (${eNew1?.cx}/${eNew2?.cx}), cũ canvas (${eOld1?.cx}/${eOld2?.cx}); Δx=${delta}`);
      }
      await evalJs(`(async () => {
        const mod = await import("/src/store.ts");
        const st = mod.useStore.getState();
        st.setPlayhead(${clipW.start + 0.5});
        if (!st.playing) st.togglePlay();
        return true;
      })()`).catch(() => null);
      // Đợt 89 Q5 — (a2) đo lúc PHÁT cũng phải xác nhận khung đã đổi: sau
      // setPlayhead(0.5)+play, preview phải seek về 0.5 (WebKit dưới tải
      // ~8s) rồi mới vẽ khung mới; sleep cố định 2500ms đo phải khung
      // stale t=5 (lần chạy 13:11: playhead 3.7 nhưng blob vẫn ở vị trí
      // t=5). Chờ canvas đổi khỏi khung t=5 (tối đa 15s), hết hạn → FAIL.
      const baseBlobX = m2?.brightCx; // khung t=5 vừa đo ở S5(a)
      let pm = null;
      let a2Changed = false;
      let a2Both = null; // blob + playhead cùng 1 evaluate (xem MEASURE_PLAYHEAD_FN)
      const tA2 = Date.now();
      while (Date.now() - tA2 < 15000) {
        a2Both = await evalJs(MEASURE_PLAYHEAD_FN).catch(() => null);
        pm = a2Both?.measure ?? null;
        if (pm && baseBlobX !== undefined && Math.abs(pm.brightCx - baseBlobX) >= 0.03) { a2Changed = true; break; }
        await sleep(500);
      }
      // Playhead lấy từ CÙNG evaluate với blob cuối (không đọc riêng
      // STORE_FN sau — mỗi evaluate ~1s dưới tải, playhead chạy tiếp).
      const pst = a2Both ? { playhead: a2Both.playhead } : await evalJs(STORE_FN).catch(() => null);
      await evalJs(`(async () => { const mod = await import("/src/store.ts"); const st = mod.useStore.getState(); if (st.playing) st.togglePlay(); return true; })()`).catch(() => null);
      await shot("o8w-a3-playing.png");
      const pLocal = pst ? +(pst.playhead - clipW.start).toFixed(2) : null;
      const pExpectProj = pLocal !== null ? +(0.35 + 0.05 * pLocal).toFixed(3) : null;
      const pExpect = pm && pExpectProj !== null ? canvasExpected(pm, projW, projH, pExpectProj, 0.5) : null;
      log(`S5 đo lúc phát (WebKit): playhead local=${pLocal} (kỳ vọng track project x=${pExpectProj} -> canvas ${pExpect?.cx}), blob=(${pm?.brightCx},${pm?.brightCy}) n=${pm?.brightN}`);
      if (!a2Changed) {
        fail("S5 (a2) mask bám track lúc đang phát (WebKit)", `STALE — canvas không đổi khỏi khung t=5 sau 15s phát (seek về 0.5 chưa xong, playhead local=${pLocal}, blob x=${pm?.brightCx}) — không dùng số đo này làm PASS`);
      } else if (pm && pExpect !== null && Math.abs(pm.brightCx - pExpect.cx) < 0.03) {
        pass("S5 (a2) mask bám track lúc đang phát (WebKit)", `playhead local=${pLocal}, blob x=${pm.brightCx} (kỳ vọng canvas ${pExpect.cx} ±0.03)`);
      } else {
        fail("S5 (a2) mask bám track lúc đang phát (WebKit)", `playhead local=${pLocal}, blob=(${pm?.brightCx},${pm?.brightCy}); kỳ vọng mới canvas ${pExpect?.cx}`);
      }
    }
  }

  // ---- S6 (b): gợi ý O5 ------------------------------------------------------
  if (clipW && maskOk && trackOk) {
    const h1 = await evalJs(HINT_FN).catch(() => null);
    if (h1 && h1.found && h1.state === "follow" && h1.form === "proper" && h1.visible) {
      pass("S6 (b1) gợi ý O5 hiện khi đủ mask + track (WebKit)", `"${h1.text}"`);
    } else if (h1 && h1.found && h1.state === "follow" && h1.form === "rawKey") {
      fail("S6 (b1) gợi ý O5 hiện khi đủ mask + track (WebKit)", `BUG THẬT (cùng Chromium): khối gợi ý CÓ nhưng hiện KEY THÔ "${h1.text}" — fragment chưa merge (xem LIMITS §3)`);
    } else {
      fail("S6 (b1) gợi ý O5 hiện khi đủ mask + track (WebKit)", `hint=${JSON.stringify(h1)}`);
    }
    const det = await evalJs(`(() => {
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
      await page.mouse.click(Math.round(det.x), Math.round(det.y));
      await sleep(800);
      detOk = true;
    }
    const stD = await evalJs(STORE_FN).catch(() => null);
    const trD = stD?.clips?.find((c) => c.id === clipW.id)?.track;
    const h2 = await evalJs(HINT_FN).catch(() => null);
    if (detOk && !trD) {
      pass("S6 (b2a) bấm nút gỡ của MaskPanel thì track mất thật (WebKit)", `nút="${det.text}", track=undefined sau khi bấm`);
      if (h2 && h2.found && h2.state === "attach") pass("S6 (b2b) gợi ý O5 chuyển sang attach khi chỉ có mask (WebKit)", `dạng=${h2.form}, "${(h2.text || "").slice(0, 100)}"`);
      else fail("S6 (b2b) gợi ý O5 chuyển sang attach khi chỉ có mask (WebKit)", `hint=${JSON.stringify(h2)}`);
    } else {
      fail("S6 (b2a) bấm nút gỡ của MaskPanel thì track mất thật (WebKit)", `click=${JSON.stringify(det)}, track=${JSON.stringify(trD)}`);
    }
    await page.setInputFiles(".track-panel input[type='file']", TRACK_FILE);
    await sleep(1200);
    const dis = await clickButtonIn(".mask-panel", "Tắt mask", "nút Tắt mask");
    await sleep(800);
    const stD2 = await evalJs(STORE_FN).catch(() => null);
    const cl2 = stD2?.clips?.find((c) => c.id === clipW.id);
    const h3 = await evalJs(HINT_FN).catch(() => null);
    if (dis.ok && !cl2?.mask && cl2?.track) {
      if (!h3 || !h3.found) pass("S6 (b3) gợi ý O5 ẩn khi chỉ có track (WebKit)", "mask=undefined, track còn 13 điểm, không còn khối gợi ý");
      else fail("S6 (b3) gợi ý O5 ẩn khi chỉ có track (WebKit)", `hint vẫn hiện: ${JSON.stringify(h3)}`);
    } else {
      fail("S6 (b3) tắt mask qua UI (WebKit)", `click=${JSON.stringify(dis)}, mask=${JSON.stringify(cl2?.mask)}, trackN=${cl2?.track?.n}`);
    }
    if (!cl2?.mask) {
      await clickButtonIn(".mask-panel", "Bật mask", "nút Bật mask (khôi phục)");
      await sleep(600);
      await evalJs(SET_SHAPE_FN("ellipse")).catch(() => false);
      await sleep(300);
      await evalJs(SET_RANGE_FN("Tâm ngang", 35)).catch(() => null);
      await evalJs(SET_RANGE_FN("Rộng", 30)).catch(() => null);
      await evalJs(SET_RANGE_FN("Cao", 30)).catch(() => null);
      await sleep(600);
      const h4 = await evalJs(HINT_FN).catch(() => null);
      if (h4 && h4.found && h4.state === "follow" && h4.form === "proper" && h4.visible) pass("S6 (b4) gợi ý O5 hiện lại khi đủ mask + track (WebKit)", `"${h4.text}"`);
      else if (h4 && h4.found && h4.state === "follow" && h4.form === "rawKey") fail("S6 (b4) gợi ý O5 hiện lại khi đủ mask + track (WebKit)", `vẫn hiện KEY THÔ "${h4.text}" — cùng bug b1`);
      else fail("S6 (b4) gợi ý O5 hiện lại khi đủ mask + track (WebKit)", `hint=${JSON.stringify(h4)}`);
    }
  }

  // ---- S7: chẩn đoán clip B ---------------------------------------------------
  await page.setInputFiles(".mediabin input[type='file']", CLIP_B);
  const cardB = await waitFor(async () => {
    const c = await evalJs(CARD_FN(CLIP_B_NAME)).catch(() => null);
    return c && c.found ? c : null;
  }, `thẻ media ${CLIP_B_NAME} xuất hiện`, 120000).catch(() => null);
  let clipB = null;
  if (cardB) {
    const { added: addedB } = await addClipToTimeline(CLIP_B_NAME);
    if (addedB) {
      const stB = await evalJs(STORE_FN).catch(() => null);
      clipB = stB?.clips?.find((c) => c.src === CLIP_B_NAME);
      if (clipB) {
        const isoB = await isolateClip(clipB.id);
        if (isoB) pass("S7 cô lập clip B (setup, WebKit)", "timeline còn đúng 1 clip (clip B)");
        else fail("S7 cô lập clip B (setup, WebKit)", "không cô lập được");
      }
    }
  }
  if (clipB) {
    const selB = await selectTimelineClip(clipB.id);
    if (!selB.ok) fail("S7 chọn clip B trên timeline (WebKit)", selB.detail);
    await clickButtonIn(".mask-panel", "Bật mask", "nút Bật mask (clip B)");
    await sleep(600);
    await evalJs(SET_SHAPE_FN("ellipse")).catch(() => false);
    await sleep(300);
    await evalJs(SET_RANGE_FN("Tâm ngang", 35)).catch(() => null);
    await evalJs(SET_RANGE_FN("Rộng", 30)).catch(() => null);
    await evalJs(SET_RANGE_FN("Cao", 30)).catch(() => null);
    await sleep(500);
    await page.setInputFiles(".track-panel input[type='file']", TRACK_FILE);
    await sleep(1200);
    const stB2 = await evalJs(STORE_FN).catch(() => null);
    const clB = stB2?.clips?.find((c) => c.id === clipB.id);
    if (clB?.mask && clB?.track?.n === 13) {
      const b1 = await measureAtPlayhead(clipB.start, 1.0, "o8w-b1-ball-t1.png", { clipSrc: CLIP_B_NAME, expectChange: true });
      const b2 = await measureAtPlayhead(clipB.start, 5.0, "o8w-b2-ball-t5.png", { clipSrc: CLIP_B_NAME, expectChange: true });
      const m1 = b1.measure, m2 = b2.measure;
      log(`S7 chẩn đoán bóng (WebKit): t=1 blob=(${m1?.brightCx},${m1?.brightCy}) n=${m1?.brightN} | bóng dark=(${m1?.darkCx},${m1?.darkCy}) n=${m1?.darkN} confirmed=${b1.confirmed} signals=${JSON.stringify(b1.signals)}`);
      log(`S7 chẩn đoán bóng (WebKit): t=5 blob=(${m2?.brightCx},${m2?.brightCy}) n=${m2?.brightN} | bóng dark=(${m2?.darkCx},${m2?.darkCy}) n=${m2?.darkN} confirmed=${b2.confirmed} signals=${JSON.stringify(b2.signals)}`);
      const newBall = m1 && m2 && m1.darkN > 100 && m2.darkN > 100 &&
        Math.abs(m1.darkCx - m1.brightCx) < 0.03 && Math.abs(m2.darkCx - m2.brightCx) < 0.03;
      // Đợt 89 Q5 — chống PASS rỗng (P5 đợt 88 §3.1, S7 lần 2): bóng≈mask ở
      // từng thời điểm CHƯA ĐỦ — mask và bóng PHẢI di chuyển giữa t=1 và
      // t=5. Kỳ vọng Δx TÍNH THEO TỌA ĐỘ CANVAS (đợt 93 U7): bóng/track đi
      // project 0.40 → 0.60 (Δx project 0.20) nhưng canvas letterbox nén
      // ngang theo dw/W — WebKit gần như không letterbox nên Δx canvas
      // ≈ 0.19, còn Chromium dw/W ≈ 0.56 nên chỉ ≈ 0.11. Nhãn cũ "~0.19"
      // là số project-coords, sai trên Chromium. Tính kỳ vọng từ
      // videoRect thật qua canvasExpected (mẫu S5) thay vì hardcode.
      const deltaExpS7 = m1 && m2 ? +(canvasExpected(m1, projW, projH, 0.60, 0.5).cx - canvasExpected(m1, projW, projH, 0.40, 0.5).cx).toFixed(3) : null;
      const maskMoved = m1 && m2 ? Math.abs(m2.brightCx - m1.brightCx) : 0;
      const ballMoved = m1 && m2 ? Math.abs(m2.darkCx - m1.darkCx) : 0;
      const moved = maskMoved >= 0.10 && ballMoved >= 0.10;
      if (!b1.confirmed || !b2.confirmed) fail("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm (WebKit)", `STALE — seek chưa xác nhận sau 30s (Q5): t=1 confirmed=${b1.confirmed} signals=${JSON.stringify(b1.signals)}; t=5 confirmed=${b2.confirmed} signals=${JSON.stringify(b2.signals)} — không dùng số đo này làm PASS`);
      else if (newBall && moved) pass("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm (WebKit)", `t=1 bóng=(${m1.darkCx},${m1.darkCy}) mask=(${m1.brightCx},${m1.brightCy}); t=5 bóng=(${m2.darkCx},${m2.darkCy}) mask=(${m2.brightCx},${m2.brightCy}); mask đã di chuyển Δx=${maskMoved.toFixed(3)}, bóng Δx=${ballMoved.toFixed(3)} (kỳ vọng canvas ${deltaExpS7})`);
      else if (newBall && !moved) fail("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm (WebKit)", `PASS RỖNG — khung stale (Q5): bóng≈mask ở cả 2 thời điểm nhưng KHÔNG di chuyển (mask Δx=${maskMoved.toFixed(3)}, bóng Δx=${ballMoved.toFixed(3)}, kỳ vọng canvas ${deltaExpS7}) — đo lại được khung cũ ở t=5`);
      else fail("S7 chẩn đoán: bóng nằm giữa mask ở cả 2 thời điểm (WebKit)", `t=1 bóng=(${m1?.darkCx}) n=${m1?.darkN} mask=(${m1?.brightCx}); t=5 bóng=(${m2?.darkCx}) n=${m2?.darkN} mask=(${m2?.brightCx})`);
    } else {
      fail("S7 setup clip B (mask + track, WebKit)", `mask=${JSON.stringify(clB?.mask)}, trackN=${clB?.track?.n}`);
    }
  } else {
    fail("S7 import/thêm clip B lên timeline (WebKit)", "không thấy clip B");
  }

  // ---- E0: lỗi JS trang ------------------------------------------------------
  if (pageErrs.length === 0) pass("E0 không có lỗi JS/pageerror/crash trong trang (WebKit)", "");
  else fail("E0 không có lỗi JS/pageerror/crash trong trang (WebKit)", pageErrs.slice(0, 3).join(" | "));

  const failed = results.filter((r) => r.ok === false).length;
  const noted = results.filter((r) => r.ok === null).length;
  log(`\n== KẾT QUẢ CLICK-TEST O8 WebKit: ${results.length - failed - noted}/${results.length} pass, ${failed} fail, ${noted} note ==`);
  writeFileEpermRetry(path.join(SCRATCH, "o8w-clicktest-report.json"), JSON.stringify({ results, logLines }, null, 2));
  return failed === 0 ? 0 : 1;
}

let code = 2;
try {
  code = await main();
} catch (e) {
  console.error(`[o8w] HARNESS LỖI: ${e.message}\n${e.stack || ""}`);
  try { writeFileEpermRetry(path.join(SCRATCH, "o8w-clicktest-report.json"), JSON.stringify({ results, logLines, harnessError: e.message }, null, 2)); } catch {}
  code = 2;
} finally {
  try { if (browser) await browser.close(); } catch {}
  for (const p of [xvfb, vite, bridge]) {
    try { if (p && p.exitCode === null) p.kill("SIGTERM"); } catch {}
  }
  await sleep(800);
  for (const p of [xvfb, vite, bridge]) {
    try { if (p && p.exitCode === null) p.kill("SIGKILL"); } catch {}
  }
}
process.exit(code);
