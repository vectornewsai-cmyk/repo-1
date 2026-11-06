#!/usr/bin/env node
/**
 * probe-round35-r6-discard-dpr-pipe.mjs — Phase 9 đợt 35, luồng R6.
 *
 * Hai mảnh, KHÔNG đo FPS (để khỏi nhiễm phép đo FPS của luồng R1/R4
 * cùng đợt — mọi lần chờ ở đây chỉ là chờ trạng thái, không đếm frame
 * theo thời gian):
 *
 * (a) Discard MÔ PHỎNG bằng reload trang (KHÔNG phải discard thật):
 *     - D1: seed autosave localStorage rồi reload → spec phải khôi phục
 *       đúng, panel Relink phải liệt kê media thiếu (media bin rỗng).
 *     - D2: phiên mẫu thật (sample tự ghi bằng MediaRecorder) → chờ
 *       autosave → reload → spec khôi phục đúng, panel Relink liệt kê
 *       mau-1.webm / mau-2.webm, KHÔNG tự tái sinh media mẫu.
 *     Reload ≠ discard thật: không có áp lực bộ nhớ, không tab ẩn hàng
 *     giờ, không bfcache — xem LIMITS đợt này.
 * (b) Smoke dpr/viewport cho đường phát ngược (element cũ, cờ WebCodecs
 *     TẮT mặc định): ở dpr=2 và 2 viewport (1280x800, 1920x1080), assert
 *     engine = "element", canvas không vỡ kích thước (backing =
 *     css × min(dpr,2) theo preview.tsx), canvas không trắng, playhead
 *     chạy LÙI (chỉ kiểm tra chiều, không đo fps), không lỗi trang.
 *     Safari / máy thật KHÔNG đo trong probe này.
 *
 * Phương pháp: Playwright Chromium headed dưới Xvfb + điều khiển qua
 * --remote-debugging-pipe (mẫu harness đợt 23/24), phục vụ bundle dist
 * SẴN CÓ bằng `vite preview` — KHÔNG build lại dist (tránh đụng các
 * luồng khác đang đo trên cùng cây). Ghi kết quả vào R6_OUT (mặc định
 * benchmarks/results/v35-r6-discard-dpr.json). Screenshot chỉ lưu ở
 * /tmp (scratch, không vào repo/batch).
 * Exit 0 khi probe chạy xong (kể cả khi một assert FAIL — đó là dữ
 * liệu, xem JSON); exit 2 khi không dựng được trang/môi trường.
 *
 * Chạy từ gốc repo:
 *   node apps/web/scripts/probe-round35-r6-discard-dpr-pipe.mjs
 * Env: R6_PREVIEW_PORT (4196), R6_XVFB_DISPLAY (:86),
 *   R6_CHROME_BINS, R6_OUT, R6_RUN_LABEL, R6_TMP.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.R6_CHROME_BINS || `${PW_CHROME},${META_CHROME}`)
  .split(",").map((s) => s.trim()).filter(Boolean);
const PREVIEW_PORT = Number(process.env.R6_PREVIEW_PORT || 4196);
const DISPLAY = process.env.R6_XVFB_DISPLAY || ":86";
const OUT_PATH = process.env.R6_OUT || path.join(ROOT, "benchmarks", "results", "v35-r6-discard-dpr.json");
const RUN_LABEL = process.env.R6_RUN_LABEL || "run1";
const TMP = process.env.R6_TMP || "/tmp/vcut-r6-dpr";
const URL = `http://127.0.0.1:${PREVIEW_PORT}/`;
const AUTOSAVE_KEY = "vcut-studio:autosave:v1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

/* ---------------- Pipe CDP (mẫu đợt 23/24, gọn lại) ---------------- */
class PipeCdp {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.sessionId = null;
    this.buf = Buffer.alloc(0);
    this.onEvent = null; // (method, params) => void, cho event không có id
    proc.stdio[3].on("error", () => {});
    proc.stdio[4].on("error", () => {});
    proc.stdio[4].on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) >= 0) {
        const msg = this.buf.subarray(0, idx).toString("utf8");
        this.buf = this.buf.subarray(idx + 1);
        if (!msg.trim()) continue;
        let obj;
        try { obj = JSON.parse(msg); } catch { continue; }
        if (obj.method === "Target.attachedToTarget" && obj.params?.sessionId) {
          this.sessionId = obj.params.sessionId;
        }
        if (obj.id && this.pending.has(obj.id)) {
          const h = this.pending.get(obj.id);
          this.pending.delete(obj.id);
          if (obj.error) h.reject(new Error(`CDP ${obj.error.code}: ${obj.error.message}`));
          else h.resolve(obj.result);
        } else if (obj.method && this.onEvent) {
          try { this.onEvent(obj.method, obj.params || {}); } catch {}
        }
      }
    });
  }
  send(method, params = {}, sessionId = undefined, timeoutMs = 30000) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
      try {
        this.proc.stdio[3].write(JSON.stringify(payload) + "\0");
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e);
      }
    });
  }
  async evalOnPage(expression, awaitPromise = false) {
    const r = await this.send("Runtime.evaluate",
      { expression, awaitPromise, returnByValue: true }, this.sessionId, 30000);
    if (r.exceptionDetails) {
      const msg = r.exceptionDetails.exception?.description || "evaluate exception";
      throw new Error(`evaluate failed: ${msg}`);
    }
    return r.result?.value;
  }
}

/* ---------------- Tiện ích trang ---------------- */
async function waitFor(cdp, fnSrc, timeoutMs, label) {
  const t0 = Date.now();
  let lastErr = "";
  while (Date.now() - t0 < timeoutMs) {
    try {
      const v = await cdp.evalOnPage(`(()=>{ try { return (${fnSrc})(); } catch(e) { return "__ERR__:" + e.message; } })()`);
      if (v !== false && v !== null && v !== undefined && !(typeof v === "string" && v.startsWith("__ERR__"))) return v;
      if (typeof v === "string") lastErr = v;
    } catch (e) { lastErr = String(e.message); }
    await sleep(1000);
  }
  throw new Error(`timeout chờ ${label} (${timeoutMs}ms). last=${lastErr}`);
}

/** Thống kê pixel thô của canvas preview (lưới thưa, chỉ để assert trắng/không trắng). */
const CANVAS_STATS_SRC = `(() => {
  const c = document.querySelector(".preview-canvas");
  const w = document.querySelector("#vcut-preview-wrap");
  if (!c || !w) return null;
  const r = c.getBoundingClientRect();
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  let data = null;
  try { data = ctx.getImageData(0, 0, c.width, c.height).data; } catch (e) { return { tainted: true, error: e.message }; }
  const colors = new Set();
  let nonBlack = 0, sampled = 0;
  const step = Math.max(1, Math.floor(c.width / 32));
  for (let y = 0; y < c.height; y += step) {
    for (let x = 0; x < c.width; x += step) {
      const i = (y * c.width + x) * 4;
      const key = (data[i] >> 4) + "," + (data[i + 1] >> 4) + "," + (data[i + 2] >> 4);
      colors.add(key);
      sampled++;
      if (data[i] > 12 || data[i + 1] > 12 || data[i + 2] > 12) nonBlack++;
    }
  }
  return {
    backingW: c.width, backingH: c.height,
    cssW: Math.round(r.width), cssH: Math.round(r.height),
    wrapCssW: Math.round(w.clientWidth), wrapCssH: Math.round(w.clientHeight),
    dpr: window.devicePixelRatio, distinctColors: colors.size,
    sampled, nonBlack, blank: nonBlack === 0,
  };
})()`;

/** Đọc spec trong autosave + kiểm tra key trạng thái phiên có lọt vào không. */
const READ_AUTOSAVE_SRC = `(() => {
  const raw = localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)});
  if (!raw) return { present: false };
  let env;
  try { env = JSON.parse(raw); } catch (e) { return { present: true, parseError: e.message }; }
  const spec = env.spec || env;
  const tracks = (spec.tracks || []).map((t) => ({
    id: t.id, kind: t.kind,
    clips: (t.clips || []).map((c) => ({ id: c.id, kind: c.kind, src: c.src || null, text: c.text || null, start: c.start, duration: c.duration })),
  }));
  const flat = JSON.stringify(env);
  return {
    present: true, name: env.name || spec.meta?.name || null,
    envelopeKeys: Object.keys(env), specKeys: Object.keys(spec),
    hasPlayheadKey: /"playhead"|"playing"|"reversePlayback"/.test(flat),
    tracks, trackCount: tracks.length,
    clipCount: tracks.reduce((n, t) => n + t.clips.length, 0),
  };
})()`;

/** Panel Relink: dialog aria-label "Media thiếu", trả innerText. */
const READ_RELINK_SRC = `(() => {
  const d = document.querySelector('div[aria-label="Media thiếu"]');
  return d ? { present: true, text: d.innerText } : { present: false, text: "" };
})()`;

/* ---------------- Seed D1 (autosave hợp lệ theo projectRepo) ---------------- */
function seedEnvelope() {
  const spec = {
    version: "0.2.0",
    meta: { name: "R6-DISCARD-PROBE", width: 1280, height: 720, fps: 30 },
    tracks: [
      {
        id: "v1", kind: "video", label: "Video 1",
        clips: [
          { kind: "video", id: "r6c1", src: "r6-a.webm", start: 0, duration: 4, in: 0, out: 4 },
          { kind: "video", id: "r6c2", src: "r6-b.webm", start: 4, duration: 4, in: 0, out: 4 },
          { kind: "video", id: "r6c3", src: "blob:http://127.0.0.1:4196/dead-beef", start: 8, duration: 2, in: 0, out: 2 },
        ],
      },
      {
        id: "t1", kind: "text", label: "Chữ 1",
        clips: [
          { kind: "text", id: "r6t1", text: "R6-DISCARD-PROBE", start: 0.5, duration: 5 },
          { kind: "text", id: "r6t2", text: "caption r6 giữ lại", start: 6, duration: 3 },
        ],
      },
    ],
  };
  return {
    format: "vcut-project", formatVersion: 1, appVersion: "0.1.0",
    specVersion: "0.2.0", savedAt: new Date().toISOString(),
    name: "R6-DISCARD-PROBE", spec,
  };
}

/* ---------------- Khởi động môi trường ---------------- */
function pickChrome() {
  for (const b of BINARIES) if (fs.existsSync(b)) return b;
  throw new Error(`không tìm thấy Chrome binary nào trong: ${BINARIES.join(", ")}`);
}
function startXvfb() {
  const sock = `/tmp/.X${DISPLAY.replace(":", "")}-lock`;
  if (fs.existsSync(sock)) throw new Error(`display ${DISPLAY} đang bận (có luồng khác dùng) — không chiếm`);
  const p = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"],
    { stdio: "ignore", detached: false });
  return p;
}
function startPreview() {
  const candidates = [
    path.join(WEB_DIR, "node_modules", ".bin", "vite"),
    path.join(ROOT, "node_modules", ".bin", "vite"),
  ];
  const bin = candidates.find((c) => fs.existsSync(c));
  if (!bin) throw new Error("không tìm thấy vite binary (web/node_modules hay root/node_modules)");
  const p = spawn(bin, ["preview", "--port", String(PREVIEW_PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: WEB_DIR, stdio: "ignore", env: { ...process.env } });
  return p;
}
async function waitHttpOk(timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(URL);
      if (r.ok) return true;
    } catch {}
    await sleep(1000);
  }
  throw new Error("vite preview không trả 200 trong 30s");
}
async function launchChrome(chromeBin, profileDir, winW, winH) {
  fs.mkdirSync(profileDir, { recursive: true });
  const args = [
    "--no-sandbox", "--remote-debugging-pipe", "--no-first-run",
    "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required",
    `--user-data-dir=${profileDir}`,
    `--window-size=${winW},${winH}`, "--window-position=0,0", "about:blank",
  ];
  const proc = spawn(chromeBin, args, {
    stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"],
    env: { ...process.env, DISPLAY },
  });
  const cdp = new PipeCdp(proc);
  // Tạo target app rồi attach trực tiếp, lấy sessionId từ KẾT QUẢ
  // attachToTarget (không dựa vào event attachedToTarget — event có thể
  // tới muộn hoặc ứng với tab khởi động, gây gửi Page.enable nhầm session).
  const tgt = await cdp.send("Target.createTarget", { url: "about:blank", background: false });
  const targetId = tgt.targetId;
  const att = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  if (!att.sessionId) throw new Error("attachToTarget không trả sessionId");
  cdp.sessionId = att.sessionId;
  await cdp.send("Page.enable", {}, cdp.sessionId);
  await cdp.send("Runtime.enable", {}, cdp.sessionId);
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: "window.__r6errors=[]; window.addEventListener('error', (e) => { try { window.__r6errors.push(e.message || 'error'); } catch {} });",
  }, cdp.sessionId);
  return { proc, cdp, targetId };
}
async function gotoApp(cdp, targetId, width, height, dpr) {
  await cdp.send("Emulation.setDeviceMetricsOverride",
    { width, height, deviceScaleFactor: dpr, mobile: false }, cdp.sessionId);
  await cdp.send("Page.navigate", { url: URL }, cdp.sessionId);
  await waitFor(cdp, `() => !!document.querySelector(".preview-canvas")`, 60000, "canvas preview");
}

/* ---------------- Case R-smoke (đường ngược, cờ TẮT) ---------------- */
async function runReverseSmoke(cdp, label, width, height) {
  const out = { label, viewport: `${width}x${height}`, dprRequested: 2, asserts: [], pass: true };
  const fail = (name, detail) => { out.asserts.push({ name, pass: false, detail }); out.pass = false; };
  const ok = (name, detail) => { out.asserts.push({ name, pass: true, detail }); };
  // Chờ sample vẽ được frame đầu (poll trạng thái, không phải đo fps).
  const first = await waitFor(cdp,
    `() => { const c = document.querySelector(".preview-canvas"); if (!c) return false;
      const ctx = c.getContext("2d"); if (!ctx) return false;
      try { const d = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 0; i < d.length; i += 4 * 997) if (d[i] > 12 || d[i+1] > 12 || d[i+2] > 12) return true; } catch (e) { return false; }
      return false; }`,
    90000, "frame mẫu đầu tiên");
  void first;
  // Cờ WebCodecs phải TẮT mặc định; engine phải là element.
  const flag = await cdp.evalOnPage(`window.__vcutReverseWebcodecs`);
  const engine = await waitFor(cdp,
    `() => window.__vcutReverseEngine || false`, 15000, "__vcutReverseEngine");
  if (flag === undefined || flag === false) ok("webcodecs-flag-off", `flag=${String(flag)}`);
  else fail("webcodecs-flag-off", `flag=${String(flag)} (muốn undefined/false)`);
  if (engine === "element") ok("reverse-engine-element", `engine=${engine}`);
  else fail("reverse-engine-element", `engine=${String(engine)} (muốn "element")`);
  // Đếm lỗi trang từ đây (CDP event + collector trong trang).
  let cdpExceptions = 0;
  cdp.onEvent = (method) => { if (method === "Runtime.exceptionThrown") cdpExceptions++; };
  const timeBefore = await cdp.evalOnPage(
    `document.querySelector(".time-display")?.innerText?.replace(/\\s+/g, " ") || ""`);
  const clicked = await cdp.evalOnPage(
    `(() => { const b = document.querySelector('button[aria-label="Phát ngược"]'); if (!b) return false; b.click(); return true; })()`);
  if (clicked) ok("reverse-button-clicked", "aria-label=Phát ngược");
  else fail("reverse-button-clicked", "không tìm thấy nút Phát ngược");
  await sleep(500);
  const timeAtStart = await cdp.evalOnPage(
    `document.querySelector(".time-display")?.innerText?.replace(/\\s+/g, " ") || ""`);
  await sleep(2500); // một lần chờ tường, KHÔNG lấy mẫu fps
  const timeAfter = await cdp.evalOnPage(
    `document.querySelector(".time-display")?.innerText?.replace(/\\s+/g, " ") || ""`);
  const parseT = (s) => {
    const m = String(s).match(/(\d+):(\d+\.\d+)/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const t0 = parseT(timeAtStart), t1 = parseT(timeAfter);
  out.timeDisplay = { beforeClick: timeBefore, atReverseStart: timeAtStart, after2_5s: timeAfter };
  if (t0 !== null && t1 !== null && t1 < t0 && t1 > 0) ok("playhead-runs-backwards", `${t0}s → ${t1}s`);
  else fail("playhead-runs-backwards", `atStart=${timeAtStart} after=${timeAfter}`);
  // Canvas: kích thước + không trắng + không lỗi.
  const stats = await cdp.evalOnPage(CANVAS_STATS_SRC);
  out.canvas = stats;
  if (stats && !stats.tainted) {
    const expW = Math.floor(stats.wrapCssW * Math.min(2, stats.dpr));
    const expH = Math.floor(stats.wrapCssH * Math.min(2, stats.dpr));
    if (Math.abs(stats.backingW - expW) <= 2 && Math.abs(stats.backingH - expH) <= 2) {
      ok("canvas-size-dpr", `backing ${stats.backingW}x${stats.backingH} ≈ css ${stats.wrapCssW}x${stats.wrapCssH} × min(dpr,2)=${Math.min(2, stats.dpr)} (dpr=${stats.dpr})`);
    } else {
      fail("canvas-size-dpr", `backing ${stats.backingW}x${stats.backingH}, muốn ≈ ${expW}x${expH} (css ${stats.wrapCssW}x${stats.wrapCssH}, dpr=${stats.dpr})`);
    }
    if (!stats.blank && stats.distinctColors >= 2) ok("canvas-not-blank", `distinctColors=${stats.distinctColors}, nonBlack=${stats.nonBlack}/${stats.sampled}`);
    else fail("canvas-not-blank", JSON.stringify(stats));
  } else {
    fail("canvas-not-blank", `tainted/không đọc được: ${JSON.stringify(stats)}`);
  }
  const pageErrors = await cdp.evalOnPage(`window.__r6errors || []`);
  out.pageErrors = pageErrors;
  out.cdpExceptions = cdpExceptions;
  if (pageErrors.length === 0 && cdpExceptions === 0) ok("no-page-errors", "0 window error + 0 CDP exception trong cửa sổ ngược");
  else fail("no-page-errors", `window errors=${JSON.stringify(pageErrors)}, cdpExceptions=${cdpExceptions}`);
  // Screenshot bằng chứng (chỉ /tmp, không vào repo).
  try {
    const shot = await cdp.send("Page.captureScreenshot", { format: "png" }, cdp.sessionId, 30000);
    const buf = Buffer.from(shot.data, "base64");
    const p = path.join(TMP, `r6-reverse-${label}.png`);
    fs.mkdirSync(TMP, { recursive: true });
    fs.writeFileSync(p, buf);
    out.screenshot = { path: p, bytes: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16) };
  } catch (e) {
    out.screenshot = { error: String(e.message) };
  }
  // Dừng phát ngược để không nhiễu case sau (bấm lại nút = toggle tắt).
  try { await cdp.evalOnPage(`document.querySelector('button[aria-label="Phát ngược"]')?.click()`); } catch {}
  cdp.onEvent = null;
  return out;
}

/* ---------------- main ---------------- */
async function main() {
  const chromeBin = pickChrome();
  const bundleFile = fs.readdirSync(path.join(WEB_DIR, "dist", "assets")).find((f) => f.endsWith(".js")) || "?";
  const bundleSha = crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(WEB_DIR, "dist", "assets", bundleFile))).digest("hex");
  const result = {
    generatedBy: "probe-round35-r6-discard-dpr-pipe.mjs",
    runLabel: RUN_LABEL, runAt: new Date().toISOString(),
    bundle: { file: `dist/assets/${bundleFile}`, sha256: bundleSha, note: "dist sẵn có, KHÔNG build lại (tránh đụng luồng khác)" },
    chrome: chromeBin, previewPort: PREVIEW_PORT, display: DISPLAY,
    methodNote: "Mô phỏng discard = reload trang. KHÔNG phải discard thật (không áp lực bộ nhớ, không tab ẩn hàng giờ, không bfcache). KHÔNG đo FPS.",
    cases: {},
  };
  let xvfb = null, preview = null;
  const chromes = [];
  try {
    xvfb = startXvfb();
    await sleep(1500);
    preview = startPreview();
    await waitHttpOk();

    /* ---- D1: seed autosave → reload ---- */
    {
      const c = await launchChrome(chromeBin, path.join(TMP, "profile-d1"), 1280, 800);
      chromes.push(c);
      try {
        await gotoApp(c.cdp, c.targetId, 1280, 800, 1);
        const seed = seedEnvelope();
        await c.cdp.evalOnPage(
          `(() => { localStorage.setItem("vcut-welcomed", "1"); localStorage.setItem(${JSON.stringify(AUTOSAVE_KEY)}, ${JSON.stringify(JSON.stringify(seed))}); location.reload(); return true; })()`);
        await waitFor(c.cdp, `() => !!document.querySelector(".preview-canvas")`, 60000, "canvas sau reload D1");
        await sleep(7000); // chờ autosave sau restore (debounce 5s) nếu có ghi lại
        const after = await c.cdp.evalOnPage(READ_AUTOSAVE_SRC);
        const relink = await c.cdp.evalOnPage(READ_RELINK_SRC);
        const specEqual = JSON.stringify(after.tracks) === JSON.stringify(
          seed.spec.tracks.map((t) => ({
            id: t.id, kind: t.kind,
            clips: t.clips.map((cl) => ({ id: cl.id, kind: cl.kind, src: cl.src || null, text: cl.text || null, start: cl.start, duration: cl.duration })),
          })));
        const d1 = {
          pass: specEqual && after.name === "R6-DISCARD-PROBE" && !after.hasPlayheadKey &&
            relink.present && relink.text.includes("r6-a.webm") && relink.text.includes("r6-b.webm"),
          specRestoredEqual: specEqual, projectName: after.name,
          hasPlayheadKeyInAutosave: after.hasPlayheadKey,
          envelopeKeys: after.envelopeKeys, specKeys: after.specKeys,
          relinkPresent: relink.present,
          relinkListsR6A: relink.text.includes("r6-a.webm"),
          relinkListsR6B: relink.text.includes("r6-b.webm"),
          relinkListsBlob: relink.text.includes("blob:"),
          relinkTextHead: relink.text.slice(0, 400),
          tracksAfter: after.tracks,
        };
        result.cases.D1_seededReload = d1;
        log("D1:", JSON.stringify({ pass: d1.pass, specEqual, relink: d1.relinkPresent, a: d1.relinkListsR6A, b: d1.relinkListsR6B, blob: d1.relinkListsBlob, playheadKey: d1.hasPlayheadKeyInAutosave }));
      } finally {
        try { c.proc.kill("SIGKILL"); } catch {}
      }
    }

    /* ---- D2 + R-smoke A: phiên mẫu thật ---- */
    {
      const c = await launchChrome(chromeBin, path.join(TMP, "profile-d2"), 1280, 800);
      chromes.push(c);
      try {
        await gotoApp(c.cdp, c.targetId, 1280, 800, 2);
        // Đóng WelcomeModal bằng click backdrop (evaluate) để khỏi chặn DOM.
        await c.cdp.evalOnPage(`document.querySelector(".modal-backdrop")?.click() || true`);
        const pre = await waitFor(c.cdp,
          `() => { const raw = localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)}); return raw ? raw : false; }`,
          120000, "autosave mẫu");
        const preParsed = await c.cdp.evalOnPage(READ_AUTOSAVE_SRC);
        log("D2 pre-reload:", JSON.stringify({ name: preParsed.name, tracks: preParsed.trackCount, clips: preParsed.clipCount }));
        // R-smoke viewport A trên cùng phiên mẫu đang sống.
        result.cases.R_smoke_1280x800_dpr2 = await runReverseSmoke(c.cdp, "1280x800-dpr2", 1280, 800);
        log("R A:", JSON.stringify({ pass: result.cases.R_smoke_1280x800_dpr2.pass, canvas: result.cases.R_smoke_1280x800_dpr2.canvas }));
        // Reload mô phỏng discard.
        await c.cdp.evalOnPage(`location.reload()`);
        await waitFor(c.cdp, `() => !!document.querySelector(".preview-canvas")`, 60000, "canvas sau reload D2");
        await sleep(7000);
        const post = await c.cdp.evalOnPage(READ_AUTOSAVE_SRC);
        const relink = await c.cdp.evalOnPage(READ_RELINK_SRC);
        const specEqual = JSON.stringify(post.tracks) === JSON.stringify(preParsed.tracks);
        const d2 = {
          pass: specEqual && post.name === preParsed.name && relink.present &&
            relink.text.includes("mau-1.webm") && relink.text.includes("mau-2.webm"),
          preName: preParsed.name, postName: post.name, specRestoredEqual: specEqual,
          preClips: preParsed.clipCount, postClips: post.clipCount,
          relinkPresent: relink.present,
          relinkListsMau1: relink.text.includes("mau-1.webm"),
          relinkListsMau2: relink.text.includes("mau-2.webm"),
          relinkTextHead: relink.text.slice(0, 400),
          tracksAfter: post.tracks,
        };
        result.cases.D2_sampleReload = d2;
        log("D2:", JSON.stringify({ pass: d2.pass, specEqual, relink: d2.relinkPresent, mau1: d2.relinkListsMau1, mau2: d2.relinkListsMau2 }));
        void pre;
      } finally {
        try { c.proc.kill("SIGKILL"); } catch {}
      }
    }

    /* ---- R-smoke B: viewport 1920x1080, dpr 2, phiên mẫu mới ---- */
    {
      const c = await launchChrome(chromeBin, path.join(TMP, "profile-rB"), 1920, 1080);
      chromes.push(c);
      try {
        await gotoApp(c.cdp, c.targetId, 1920, 1080, 2);
        await c.cdp.evalOnPage(`document.querySelector(".modal-backdrop")?.click() || true`);
        await waitFor(c.cdp,
          `() => !!localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`,
          120000, "autosave mẫu (viewport B)");
        result.cases.R_smoke_1920x1080_dpr2 = await runReverseSmoke(c.cdp, "1920x1080-dpr2", 1920, 1080);
        log("R B:", JSON.stringify({ pass: result.cases.R_smoke_1920x1080_dpr2.pass, canvas: result.cases.R_smoke_1920x1080_dpr2.canvas }));
      } finally {
        try { c.proc.kill("SIGKILL"); } catch {}
      }
    }
  } finally {
    for (const c of chromes) { try { c.proc.kill("SIGKILL"); } catch {} }
    if (preview) { try { preview.kill("SIGKILL"); } catch {} }
    if (xvfb) { try { xvfb.kill("SIGKILL"); } catch {} }
  }
  result.overallPass = Object.values(result.cases).every((c) => c.pass === true);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
  log("Ghi:", OUT_PATH, "overallPass:", result.overallPass);
  for (const [k, v] of Object.entries(result.cases)) log(`  ${k}: pass=${v.pass}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("PROBE FAILED:", e.message);
  process.exit(2);
});
