#!/usr/bin/env node
/**
 * clicktest-52i2-audio-null-badge.mjs — Phase 9 đợt 52, luồng I2:
 * click-test headed THẬT cho 2 bug nợ đợt 51 §4.6:
 *  (1) tab badge KeyframePanel đếm thô (1) với animations [null] trong khi
 *      panel count hiện 0 — fix: badge đếm keyframe usable sau normalize.
 *  (2) computeClipGain ném với volumeKeyframes [null] in-memory — fix:
 *      guard hasUsableVolumeKeyframes ở call site.
 *
 * Hạ tầng tái dùng mẫu H6 (vite dev + Chromium headed qua Xvfb + CDP
 * WebSocket, Node thuần, không Playwright). Sample project không có audio
 * clip và store không có action chèn clip, nên (2) KHÔNG chứng minh được
 * qua đường tick preview thật — harness chứng minh (2) bằng cách import
 * module audioEngine THẬT mà app đã nạp (vite dev, cùng module cache)
 * rồi gọi computeClipGain với [null] trong browser thật (không ném, rơi
 * về volume tĩnh). Đó là bằng chứng headed cho hàm đã sửa, KHÔNG phải
 * bằng chứng cho đường tick preview — xem LIMITS I2 §4.
 *
 * Case: A0 load sample → A0b live store → A0c đóng modal → C0 chọn clip
 * video → I1 inject animations.x=[null]: badge tab x KHÔNG hiện số,
 * panel count "0 điểm", 0 lỗi mới → I2 inject [null,valid]: badge "1",
 * count "1 điểm" → I3 gọi computeClipGain thật trong trang với
 * [null]/[null,valid]/[] → đúng giá trị, không ném → I4 0 lỗi phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-52i2-audio-null-badge.mjs
 * Env: I2_DEV_PORT (mặc định tự chọn 5281–5299), I2_DEBUG_PORT (9471–9489),
 * I2_DISPLAY (mặc định tự chọn :90–:99), I2_SCRATCH (mặc định
 * ~/workspace/tmp-round52-i2/badge). Exit 0 mọi case PASS, 1 có FAIL,
 * 2 harness lỗi. KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
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
const SCRATCH = process.env.I2_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round52-i2", "badge");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1248", "chrome-linux64", "chrome");
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));

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
function pickFreeDisplay() {
  for (const n of [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]) {
    if (!fs.existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
  }
  return null;
}

// ---- CDP (mẫu H6/F5: WebSocket có sẵn của Node, không Playwright) ----
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
    // Timeout 60 s cho mỗi send — H6 §6.6: CDP.send() không timeout nên
    // renderer treo làm harness treo vô hạn; ở đây fail nhanh thay vì treo.
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
  async click(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await sleep(400);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(300);
  }
  async waitFor(fn, label, timeoutMs = 180000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
}

const INJECT_ERRORS = `(() => {
  window.__i2errors = [];
  window.addEventListener("error", (e) => {
    try { window.__i2errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__i2errors.push("window.onerror: <?>"); }
  });
  window.addEventListener("unhandledrejection", (e) => {
    try { window.__i2errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__i2errors.push("unhandledrejection: <?>"); }
  });
})()`;

// Snapshot store qua module thật mà app đã nạp (mẫu H6).
const STORE_FN = `(() => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  return (async () => {
    const mod = window.__i2storeMod || (window.__i2storeMod = await import(hit));
    const st = mod.useStore.getState();
    return {
      storeUrl: hit,
      name: st.spec.meta?.name ?? null,
      playhead: st.playhead,
      pxPerSec: st.pxPerSec,
      selection: st.selection,
      tracks: st.spec.tracks.map((t) => ({ id: t.id, kind: t.kind, clips: t.clips.map((c) => ({
        id: c.id, kind: c.kind, start: +c.start.toFixed(3), duration: +c.duration.toFixed(3),
        animations: c.animations ?? null,
      })) })),
    };
  })();
})()`;

// Snapshot DOM: clip + KeyframePanel (tabs KÈM badge <i>) + modal + lỗi trang.
const DOM_FN = `(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +(b.left + b.width / 2).toFixed(1), y: +(b.top + b.height / 2).toFixed(1),
      left: +b.left.toFixed(1), top: +b.top.toFixed(1), right: +b.right.toFixed(1),
      bottom: +b.bottom.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const panel = q(".kf-panel");
  const kf = panel ? {
    countText: panel.querySelector(".kf-count")?.textContent ?? null,
    diamonds: qa(".kf-diamond").length,
    laneEmpty: !!panel.querySelector(".kf-lane-empty"),
    liveText: panel.querySelector(".kf-live b")?.textContent ?? null,
    editor: !!panel.querySelector(".kf-editor"),
    tabs: [...panel.querySelectorAll(".kf-tab")].map((t) => ({ label: t.textContent.trim(),
      active: t.classList.contains("active"), has: t.classList.contains("has"),
      badge: t.querySelector("i")?.textContent ?? null })),
  } : null;
  return {
    clips: qa(".tl-clip").map((el) => ({ trackId: el.dataset.trackId, clipId: el.dataset.clipId,
      sel: el.classList.contains("selected"), ...r(el) })),
    modal: !!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal"),
    kf,
    errors: (window.__i2errors || []).slice(),
  };
})()`;

// Đưa keyframes vào 1 prop của clip đang chọn qua patchClip thật (mẫu H6).
function injectFn(prop, kfsJson) {
  return `(async () => {
    const entries = performance.getEntriesByType("resource").map((e) => e.name);
    const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
    const mod = window.__i2storeMod || (window.__i2storeMod = await import(hit));
    const st = mod.useStore.getState();
    const sel = st.selection[0];
    if (!sel) return { ok: false, reason: "chưa chọn clip nào" };
    const track = st.spec.tracks.find((t) => t.id === sel.trackId);
    const clip = track?.clips.find((c) => c.id === sel.clipId);
    if (!clip) return { ok: false, reason: "clip đã chọn không còn trong spec" };
    const next = { ...(clip.animations ?? {}) };
    next[${JSON.stringify(prop)}] = { keyframes: ${kfsJson} };
    const n = st.patchClip(sel.trackId, sel.clipId, { animations: next });
    const after = mod.useStore.getState().spec.tracks
      .find((t) => t.id === sel.trackId)?.clips.find((c) => c.id === sel.clipId);
    return { ok: true, patched: n, trackId: sel.trackId, clipId: sel.clipId,
      stored: after?.animations?.[${JSON.stringify(prop)}]?.keyframes ?? null };
  })()`;
}

// Gọi computeClipGain THẬT trong trang (module audioEngine mà app nạp).
// TRƯỚC fix hàm này ném với [null]; sau fix trả về volume tĩnh.
// Đây là bằng chứng headed cho HÀM, không phải cho đường tick preview
// (xem chú thích đầu file — project mẫu không có audio clip).
const AUDIO_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/lib\\/audioEngine\\.ts(\\?|$)/.test(u)) || "/src/lib/audioEngine.ts";
  const mod = window.__i2audioMod || (window.__i2audioMod = await import(hit));
  const out = {};
  const cases = {
    nullOnly: { duration: 4, volume: 0.5, volumeKeyframes: { keyframes: [null] } },
    nullValid: { duration: 4, volume: 0.9, volumeKeyframes: { keyframes: [null, { t: 0, v: 0.2, easing: "linear" }, { t: 4, v: 0.8, easing: "linear" }] } },
    empty: { duration: 4, volume: 0.7, volumeKeyframes: { keyframes: [] } },
    noKf: { duration: 4, volume: 0.6 },
  };
  for (const [k, clip] of Object.entries(cases)) {
    try { out[k] = { gain: mod.computeClipGain(clip, 2, false, 1) }; }
    catch (e) { out[k] = { threw: String(e && e.message || e) }; }
  }
  return { audioUrl: hit, out };
})()`;

const MODAL_SEL = ".modal-backdrop, .tour-card, .welcome-modal";

async function closeModal(cdp) {
  const present = await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`);
  if (!present) return "không có modal";
  await cdp.click(20, 20); await sleep(600);
  let gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  if (!gone) {
    await cdp.key("Escape", "Escape").catch(() => {});
    await sleep(600);
    gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  }
  return gone ? "đã đóng modal" : "modal vẫn mở sau backdrop+Escape";
}

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  let harnessError = null;

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  try {
    const DEV_PORT = Number(process.env.I2_DEV_PORT || 0) || (await pickFreePort(5281, 5299));
    const DEBUG_PORT = Number(process.env.I2_DEBUG_PORT || 0) || (await pickFreePort(9471, 9489));
    const DISPLAY = process.env.I2_DISPLAY || pickFreeDisplay();
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5281–5299");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9471–9489");
    if (!DISPLAY) throw new Error("hết display Xvfb trống :90–:99");
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "cdprof-i2");
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "i2-vite.log"), "w");
    vite = spawn(VITE_BIN, ["--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [`${DISPLAY}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "i2-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY } });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = (pages || []).find((p) => p.type === "page") || null;
      } catch {}
      if (!pageTarget) await sleep(500);
    }
    if (!pageTarget) throw new Error("không tìm thấy target type=page sau 90 s");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("DOM.enable");
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INJECT_ERRORS });
    log("CDP đã nối, đã cài thu lỗi trang (__i2errors)");

    const store = () => cdp.evalJs(STORE_FN);
    const dom = () => cdp.evalJs(DOM_FN);
    const errSnap = async () => ({
      win: await cdp.evalJs(`(window.__i2errors || []).length`),
      cdp: cdp.exceptions.length,
    });
    const errClean = (a, b) => b.win === a.win && b.cdp === a.cdp;
    const errDeltaStr = (a, b) => `win+${b.win - a.win}/cdp+${b.cdp - a.cdp}`;
    const countNum = (txt) => { const m = String(txt || "").match(/(\d+)/); return m ? Number(m[1]) : null; };

    await cdp.send("Page.navigate", { url: DEV_URL });
    const snap0 = await cdp.waitFor(async () => {
      const d = await dom().catch(() => null);
      return d && d.clips.length >= 3 ? d : null;
    }, "project mẫu >= 3 clip", 180000);
    const st0 = await store();
    const kinds = st0.tracks.flatMap((t) => t.clips.map((c) => c.kind)).sort().join(",");
    if (snap0.clips.length === 3 && kinds === "text,video,video" && st0.name === "Dự án mẫu") {
      pass("A0 load sample", `3 clip (2 video + 1 text), tên "Dự án mẫu", playhead=${st0.playhead}, pxPerSec=${st0.pxPerSec}`);
    } else {
      fail("A0 load sample", `clips=${snap0.clips.length} kinds=${kinds} name=${st0.name}`);
    }

    const domIds = new Set(snap0.clips.map((c) => `${c.trackId}/${c.clipId}`));
    const storeIds = new Set(st0.tracks.flatMap((t) => t.clips.map((c) => `${t.id}/${c.id}`)));
    const sameIds = domIds.size === storeIds.size && [...domIds].every((x) => storeIds.has(x));
    if (sameIds && st0.storeUrl.includes("/src/store.ts")) {
      pass("A0b live store", `import '${st0.storeUrl}' trả đúng store app đang dùng (id clip khớp DOM ${domIds.size}/${domIds.size})`);
    } else {
      fail("A0b live store", `storeUrl=${st0.storeUrl} sameIds=${sameIds} — DỪNG`);
      throw new Error("live-store check fail — dừng lượt");
    }

    const modalRes = await closeModal(cdp);
    if (/đã đóng|không có modal/.test(modalRes)) pass("A0c đóng welcome modal", modalRes);
    else fail("A0c đóng welcome modal", modalRes);

    const firstVideo = snap0.clips.find((c) => {
      const t = st0.tracks.find((tr) => tr.id === c.trackId);
      return t?.clips.find((cl) => cl.id === c.clipId)?.kind === "video";
    }) || snap0.clips[0];
    await cdp.click(firstVideo.x, firstVideo.y);
    await sleep(600);
    // Đợi panel render thật (dưới tải VM, React có thể chưa kịp vẽ
    // Inspector sau 600 ms — lượt đỏ-trước I2 từng fail C0 vì đo ngay).
    const d0 = await cdp.waitFor(async () => {
      const dd = await dom().catch(() => null);
      return dd && dd.kf ? dd : null;
    }, ".kf-panel sau khi chọn clip", 30000).catch(() => null);
    const d0snap = d0 ?? (await dom());
    const s0 = await store();
    const selClip = s0.selection[0];
    if (d0snap.kf && selClip) {
      pass("C0 chọn clip video + KeyframePanel hiện", `đã chọn ${selClip.trackId}/${selClip.clipId}, count="${d0snap.kf.countText}", tabs=[${d0snap.kf.tabs.map((t) => t.label + (t.badge ? ":" + t.badge : "")).join(" | ")}]`);
    } else {
      fail("C0 chọn clip video + KeyframePanel hiện", `kf=${!!d0snap.kf} selection=${JSON.stringify(s0.selection)} — DỪNG`);
      throw new Error("không mở được KeyframePanel — dừng lượt");
    }
    const clip1 = { trackId: selClip.trackId, clipId: selClip.clipId };

    // ---- I1: [null] vào animations.x — badge phải 0, panel count 0 ----
    const errBeforeI1 = await errSnap();
    const inj1 = await cdp.evalJs(injectFn("x", "[null]"));
    await sleep(800);
    const d1 = await dom(); const s1 = await store();
    const storedX1 = s1.tracks.find((t) => t.id === clip1.trackId)?.clips.find((c) => c.id === clip1.clipId)?.animations?.x?.keyframes;
    const errAfterI1 = await errSnap();
    const tabX1 = d1.kf?.tabs[0];
    if (inj1.ok && Array.isArray(storedX1) && storedX1.length === 1 && storedX1[0] === null
      && d1.kf && countNum(d1.kf.countText) === 0 && d1.kf.diamonds === 0
      && tabX1 && tabX1.badge === null && !tabX1.has && errClean(errBeforeI1, errAfterI1)) {
      pass("I1 badge [null] = 0, khớp panel count 0",
        `store giữ [null], panel count="0 điểm", 0 diamond, tab x: badge=null (không hiện số), has=false, 0 lỗi mới (${errDeltaStr(errBeforeI1, errAfterI1)})`);
    } else {
      fail("I1 badge [null] = 0, khớp panel count 0",
        `inj=${JSON.stringify(inj1)} storedX=${JSON.stringify(storedX1)} count="${d1.kf?.countText}" diamonds=${d1.kf?.diamonds} tabX=${JSON.stringify(tabX1)} lỗi mới: ${errDeltaStr(errBeforeI1, errAfterI1)} winErrs=${JSON.stringify(await cdp.evalJs(`(window.__i2errors || []).slice()`))} cdpExc=${JSON.stringify(cdp.exceptions.slice(-2))}`);
    }

    // ---- I2: [null, valid] vào x — badge "1", count "1 điểm" ----
    const errBeforeI2 = await errSnap();
    const inj2 = await cdp.evalJs(injectFn("x", '[null,{"t":1,"v":0.6,"easing":"linear"}]'));
    await sleep(800);
    const d2 = await dom(); const s2 = await store();
    const storedX2 = s2.tracks.find((t) => t.id === clip1.trackId)?.clips.find((c) => c.id === clip1.clipId)?.animations?.x?.keyframes;
    const errAfterI2 = await errSnap();
    const tabX2 = d2.kf?.tabs[0];
    if (inj2.ok && Array.isArray(storedX2) && storedX2.length === 2 && storedX2[0] === null
      && d2.kf && countNum(d2.kf.countText) === 1 && d2.kf.diamonds === 1
      && tabX2 && tabX2.badge === "1" && tabX2.has && errClean(errBeforeI2, errAfterI2)) {
      pass("I2 badge [null,valid] = 1, khớp panel count 1",
        `store giữ [null,valid], panel count="1 điểm", 1 diamond, tab x badge="1", has=true, 0 lỗi mới (${errDeltaStr(errBeforeI2, errAfterI2)})`);
    } else {
      fail("I2 badge [null,valid] = 1, khớp panel count 1",
        `inj=${JSON.stringify(inj2)} storedX=${JSON.stringify(storedX2)} count="${d2.kf?.countText}" diamonds=${d2.kf?.diamonds} tabX=${JSON.stringify(tabX2)} lỗi mới: ${errDeltaStr(errBeforeI2, errAfterI2)}`);
    }

    // ---- I3: computeClipGain thật trong trang ----
    const errBeforeI3 = await errSnap();
    const audioRes = await cdp.evalJs(AUDIO_FN);
    const errAfterI3 = await errSnap();
    const o = audioRes.out;
    const i3ok = o.nullOnly.gain === 0.5 && o.nullValid.gain === 0.5
      && o.empty.gain === 0.7 && o.noKf.gain === 0.6 && errClean(errBeforeI3, errAfterI3);
    if (i3ok) {
      pass("I3 computeClipGain headed: [null] không ném, đúng giá trị",
        `module '${audioRes.audioUrl}': [null]→0.5 (volume tĩnh), [null,valid]→0.5 (nội suy), []→0.7, không kf→0.6; 0 lỗi mới`);
    } else {
      fail("I3 computeClipGain headed: [null] không ném, đúng giá trị",
        `out=${JSON.stringify(o)} audioUrl=${audioRes.audioUrl} lỗi mới: ${errDeltaStr(errBeforeI3, errAfterI3)}`);
    }

    // ---- I4: không lỗi trong phiên ----
    const endErrs = await cdp.evalJs(`(window.__i2errors || []).slice()`);
    const allErrs = [...endErrs, ...cdp.exceptions];
    if (allErrs.length === 0) {
      pass("I4 không lỗi console trong phiên", "0 window.onerror + 0 unhandledrejection + 0 Runtime.exceptionThrown");
    } else {
      fail("I4 không lỗi console trong phiên", JSON.stringify(allErrs.map((e) => String(e).slice(0, 300))));
    }
  } catch (e) {
    harnessError = e.message;
    log(`HARNESS LỖI: ${e.message}`);
  } finally {
    killAll();
    await sleep(500);
  }

  writeFileEpermRetry(path.join(SCRATCH, "i2-result.json"), JSON.stringify({ results, harnessError }, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "i2-log.txt"), logLines.join("\n"));
  const failed = results.filter((r) => !r.ok);
  console.log(`\n== I2 audio-null/badge clicktest: ${results.length - failed.length}/${results.length} pass ==${harnessError ? " (HARNESS ERROR — exit 2)" : ""}`);
  console.log(`kết quả JSON: ${path.join(SCRATCH, "i2-result.json")}`);
  process.exit(harnessError ? 2 : (failed.length > 0 ? 1 : 0));
}

main().catch((e) => { console.error("BLOCKER:", e?.message || e); process.exit(2); });
