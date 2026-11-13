#!/usr/bin/env node
/**
 * clicktest-51h6-keyframe-panel.mjs — Phase 9 đợt 51, luồng H6:
 * click-test headed THẬT cho KeyframePanel với keyframes [null] in-memory
 * (nợ F1 §7.3 — F1 chỉ khóa bằng unit mô phỏng đường derive của panel,
 * chưa render React thật) + mở rộng click-test thao tác cốt lõi còn thiếu
 * theo gap N3 (trim mép, split, delete, box-select, undo/redo sau kéo).
 *
 * Hạ tầng tái dùng (không dựng mới): vite dev + Chromium headed qua Xvfb
 * + CDP WebSocket, mẫu F5 đợt 50 / P5 đợt 11 (Node thuần, không Playwright).
 *
 * Cách đưa [null] vào store trong browser thật (đường in-memory duy nhất
 * F1 §3.4 đã chỉ ra — sửa tay qua devtools/patchClip trực tiếp, KHÔNG qua
 * cổng load vì loadProject/validateVideoSpec từ chối entry null):
 *   - Trang chạy vite DEV nên `await import('<url store.ts thật mà app đã
 *     nạp>')` trong page trả về ĐÚNG module store singleton mà React app
 *     đang dùng (browser module cache theo URL; URL lấy từ
 *     performance.getEntriesByType('resource') để khớp tuyệt đối, kể cả
 *     khi Vite thêm query). Harness XÁC MINH liveness trước khi dùng:
 *     so id clip trong store với id clip trong DOM (.tl-clip).
 *   - `useStore.getState().patchClip(trackId, clipId, { animations })`
 *     là mutation thật của store (đi qua execCommand + history, React
 *     re-render qua subscription thật). Panel render React thật, click
 *     thật bằng CDP Input.dispatchMouseEvent / dispatchKeyEvent.
 *   - Đây KHÔNG phải jsdom/mô phỏng: Chrome headed thật, React thật,
 *     DOM thật, store thật. Chỉ bước "đưa null vào" là gọi API store
 *     công khai qua devtools — đúng cách user/dev có thể làm tay trong
 *     console, và là đường duy nhất tới được trạng thái này (không có UI
 *     nào tạo được keyframe null).
 *
 * Thứ tự chạy trên cùng 1 phiên (2 lượt load trang):
 *   Lượt 1 (sample nguyên vẹn): A0 load sample 3 clip → A0b xác minh live
 *     store → A0c đóng welcome modal → C1 [null] vào animations.x → C2
 *     chuyển tab opacity→x → C3 [null, valid, null] + click marker thật +
 *     Thêm/Xoá keyframe bằng click thật → C4 dblclick lane thêm keyframe
 *     → C5 [null] vào animations.opacity (hàng live mờ phải hiện "—").
 *   Lượt 2 (reload sau khi xoá autosave → sample mới nguyên vẹn): B1 trim
 *     mép phải clip1 −1s bằng kéo thật → B2 kéo clip2 +1s → B2u Ctrl+Z →
 *     B2r Ctrl+Shift+Z → B3 scrub playhead 6.5s + phím S split → B4 chọn
 *     mảnh [6.5,9) + phím Delete → B5 box-select kéo vùng trống chọn 3 clip.
 *   Cuối: B6 không lỗi console/unhandledrejection/Runtime.exceptionThrown
 *     trong toàn phiên (cộng dồn cả 2 lượt load).
 *
 * Cách chạy (từ gốc repo):
 *   node apps/web/scripts/clicktest-51h6-keyframe-panel.mjs
 * Biến môi trường: H6_DEV_PORT (mặc định tự chọn 5261–5279),
 * H6_DEBUG_PORT (mặc định tự chọn 9451–9469), H6_DISPLAY (mặc định tự
 * chọn :90–:99), H6_SCRATCH (mặc định ~/workspace/tmp-round51-h6/keyframe),
 * H6_NO_RETRY=1 để tắt chạy lại 1 lần khi lượt 1 không sạch.
 * Exit 0 khi mọi case PASS, 1 khi có FAIL, 2 khi harness lỗi.
 * KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG sửa file
 * sản phẩm (harness chỉ đọc/ghi qua UI + store công khai).
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
const SCRATCH = process.env.H6_SCRATCH || path.join(os.homedir(), "workspace", "tmp-round51-h6", "keyframe");
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

// ---- CDP (mẫu F5: WebSocket có sẵn của Node, không Playwright) ----
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
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
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
  async dblclick(x, y) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1 });
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 2 });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 2 });
    await sleep(500);
  }
  async drag(x0, y0, x1, y1, steps = 12) {
    await this.mouse("mousePressed", x0, y0, { button: "left", clickCount: 1 });
    await sleep(120);
    for (let i = 1; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      await this.mouse("mouseMoved", x, y, { button: "left" });
      await sleep(60);
    }
    await this.mouse("mouseReleased", x1, y1, { button: "left", clickCount: 1 });
    await sleep(600);
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
  window.__h6errors = [];
  window.addEventListener("error", (e) => {
    try { window.__h6errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__h6errors.push("window.onerror: <?>"); }
  });
  window.addEventListener("unhandledrejection", (e) => {
    try { window.__h6errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__h6errors.push("unhandledrejection: <?>"); }
  });
})()`;

// Snapshot store qua module thật mà app đã nạp (xem chú thích đầu file).
const STORE_FN = `(() => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  return (async () => {
    const mod = window.__h6storeMod || (window.__h6storeMod = await import(hit));
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

// Snapshot DOM: clip + KeyframePanel (chỉ text/trạng thái) + modal + lỗi trang.
// KHÔNG scroll ở đây (đo clip/ruler cho phase B phải giữ nguyên vị trí
// cuộn hiện tại). Tọa độ click trong panel lấy từ KF_FN (có scroll).
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
    diamondPos: r(qa(".kf-diamond")[0]),
    laneEmpty: !!panel.querySelector(".kf-lane-empty"),
    liveText: panel.querySelector(".kf-live b")?.textContent ?? null,
    liveRows: [...panel.querySelectorAll(".kf-live-row")].map((row) => row.textContent.trim()),
    editor: !!panel.querySelector(".kf-editor"),
    editorInputs: [...panel.querySelectorAll(".kf-editor input[type=number]")].map((i) => i.value),
    tabs: [...panel.querySelectorAll(".kf-tab")].map((t) => ({ label: t.textContent.trim(),
      active: t.classList.contains("active"), has: t.classList.contains("has") })),
    lanePos: r(panel.querySelector(".kf-lane")),
    addBtn: r(panel.querySelector(".kf-actions .primary")),
    delBtn: r(panel.querySelectorAll(".kf-actions button")[1]),
    issues: [...panel.querySelectorAll(".kf-issues li")].map((li) => li.textContent),
  } : null;
  return {
    clips: qa(".tl-clip").map((el) => ({ trackId: el.dataset.trackId, clipId: el.dataset.clipId,
      sel: el.classList.contains("selected"), ...r(el) })),
    rulerPos: r(q(".tl-ruler")),
    lanesPos: r(q(".tl-lanes")),
    modal: !!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal"),
    kf,
    errors: (window.__h6errors || []).slice(),
  };
})()`;

// Snapshot KeyframePanel — CHỈ text/trạng thái, KHÔNG scroll (panel cao hơn
// viewport 900px nên scroll panel vào giữa vẫn để tab nằm trên mép trên;
// tọa độ click lấy từ KF_POS_FN: scroll TỪNG element đích vào giữa rồi đo
// ngay, theo mẫu ctr() của P5 — bài học lượt 2: scroll cả panel xong đo
// tab ở y=-40, click trượt, C2–C4 fail dây chuyền).
const KF_FN = `(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const panel = q(".kf-panel");
  if (!panel) return null;
  return {
    countText: panel.querySelector(".kf-count")?.textContent ?? null,
    diamonds: qa(".kf-diamond").length,
    laneEmpty: !!panel.querySelector(".kf-lane-empty"),
    liveText: panel.querySelector(".kf-live b")?.textContent ?? null,
    liveRows: [...panel.querySelectorAll(".kf-live-row")].map((row) => row.textContent.trim()),
    editor: !!panel.querySelector(".kf-editor"),
    editorInputs: [...panel.querySelectorAll(".kf-editor input[type=number]")].map((i) => i.value),
    tabs: [...panel.querySelectorAll(".kf-tab")].map((t) => ({ label: t.textContent.trim(),
      active: t.classList.contains("active"), has: t.classList.contains("has") })),
    issues: [...panel.querySelectorAll(".kf-issues li")].map((li) => li.textContent),
  };
})()`;

// Tọa độ click của 1 element trong KeyframePanel: scroll CHÍNH element đó
// vào giữa viewport rồi đo ngay (tránh lệch do panel cuộn/xê dịch sau đo).
// Trả thêm hit-test (elementFromPoint) để biết có gì đè lên đích không
// (vd header sticky) nếu click trượt.
function kfPosFn(kind, idx = 0) {
  return `(() => {
    const q = (s) => document.querySelector(s);
    const qa = (s) => [...document.querySelectorAll(s)];
    const kind = ${JSON.stringify(kind)};
    const idx = ${idx};
    let el = null;
    if (kind === "tab") el = qa(".kf-tab")[idx] || null;
    else if (kind === "diamond") el = qa(".kf-diamond")[0] || null;
    else if (kind === "lane") el = q(".kf-lane");
    else if (kind === "addBtn") el = q(".kf-actions .primary");
    else if (kind === "delBtn") el = qa(".kf-actions button")[1] || null;
    if (!el) return null;
    try { el.scrollIntoView({ block: "center", inline: "center" }); } catch {}
    const b = el.getBoundingClientRect();
    const pos = { x: +(b.left + b.width / 2).toFixed(1), y: +(b.top + b.height / 2).toFixed(1),
      w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    const top = document.elementFromPoint(pos.x, pos.y);
    let hit = null;
    try { hit = top ? ((top.className && typeof top.className === "string" ? top.className : top.tagName) + (top.id ? "#" + top.id : "")) : null; } catch {}
    return { ...pos, hit, hitIsTarget: !!top && (top === el || el.contains(top)) };
  })()`;
}

// Đếm lỗi theo từng kênh (không cộng gộp — 2 kênh có thể báo cùng 1 lỗi,
// cộng gộp gây lệch số như lượt 1 "lỗi mới=-1").
const errSnap = async (cdp) => ({
  win: await cdp.evalJs(`(window.__h6errors || []).length`),
  cdp: cdp.exceptions.length,
});
const errDeltaStr = (a, b) => `win+${b.win - a.win}/cdp+${b.cdp - a.cdp}`;
const errClean = (a, b) => b.win === a.win && b.cdp === a.cdp;

// Đưa keyframes vào 1 prop của clip đang chọn qua patchClip thật.
// kfsJson: JSON của mảng keyframes (có thể chứa null — JSON giữ nguyên null).
function injectFn(prop, kfsJson) {
  return `(async () => {
    const entries = performance.getEntriesByType("resource").map((e) => e.name);
    const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
    const mod = window.__h6storeMod || (window.__h6storeMod = await import(hit));
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

const MODAL_SEL = ".modal-backdrop, .tour-card, .welcome-modal";

async function closeModal(cdp) {
  const present = await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`);
  if (!present) return "không có modal";
  await cdp.click(20, 20); await sleep(600);
  let gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  if (!gone) {
    await cdp.key("Escape", "Escape"); await sleep(600);
    gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
  }
  if (!gone) {
    const closed = await cdp.evalJs(`(() => {
      const m = document.querySelector(${JSON.stringify(MODAL_SEL)});
      if (!m) return false;
      const b = [...m.querySelectorAll("button")].find((x) => /đóng|×|✕/i.test(x.textContent || "") || (x.getAttribute("aria-label") || "").match(/đóng|close/i));
      if (!b) return false; b.click(); return true;
    })()`);
    await sleep(600);
    gone = !(await cdp.evalJs(`!!document.querySelector(${JSON.stringify(MODAL_SEL)})`));
    if (!gone) return `modal vẫn mở sau backdrop+Escape+nút đóng (nút tìm được: ${closed})`;
  }
  return "đã đóng modal";
}

async function runAttempt(attempt) {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  const errorsBefore = [];
  let vite = null, xvfb = null, chrome = null, serverUp = false;

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  const DEV_PORT = Number(process.env.H6_DEV_PORT || 0) || (await pickFreePort(5261, 5279));
  const DEBUG_PORT = Number(process.env.H6_DEBUG_PORT || 0) || (await pickFreePort(9451, 9469));
  const DISPLAY = process.env.H6_DISPLAY || pickFreeDisplay();
  if (!DEV_PORT) throw new Error("hết cổng dev trống 5261–5279 (các luồng khác đang giữ)");
  if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9451–9469");
  if (!DISPLAY) throw new Error("hết display Xvfb trống :90–:99");
  if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
  if (!VITE_BIN) throw new Error("không thấy vite");
  const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
  const PROFILE = path.join(SCRATCH, `cdprof-h6-a${attempt}`);
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  log(`lượt ${attempt}: vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}`);

  try {
    // ---- vite dev ----
    const viteLogFd = fs.openSync(path.join(SCRATCH, `h6-vite-a${attempt}.log`), "w");
    vite = spawn(VITE_BIN, ["--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    serverUp = true;
    log("vite dev đã lên");

    // ---- Xvfb + Chrome headed ----
    for (const num of [DISPLAY.replace(":", "")]) {
      xvfb = spawn("Xvfb", [`${DISPLAY}`, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
      await sleep(900);
      if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    }
    log(`xvfb: DISPLAY=${DISPLAY}`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, `h6-chrome-a${attempt}.log`), "w");
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
    log("CDP đã nối, đã cài thu lỗi trang (__h6errors)");

    const store = () => cdp.evalJs(STORE_FN);
    const dom = () => cdp.evalJs(DOM_FN);

    // ================= LƯỢT LOAD 1: KEYFRAME PANEL =================
    await cdp.send("Page.navigate", { url: DEV_URL });
    const snap0 = await cdp.waitFor(async () => {
      const d = await dom().catch(() => null);
      return d && d.clips.length >= 3 ? d : null;
    }, "project mẫu >= 3 clip (loadSample ghi video thật ~8 s)", 180000);
    const st0 = await store();
    const kinds = st0.tracks.flatMap((t) => t.clips.map((c) => c.kind)).sort().join(",");
    if (snap0.clips.length === 3 && kinds === "text,video,video" && st0.name === "Dự án mẫu") {
      pass("A0 load sample", `3 clip (2 video + 1 text), tên "Dự án mẫu", playhead=${st0.playhead}, pxPerSec=${st0.pxPerSec}`);
    } else {
      fail("A0 load sample", `clips=${snap0.clips.length} kinds=${kinds} name=${st0.name} — ${JSON.stringify(st0.tracks)}`);
    }

    // A0b: module store import có phải live store không (id clip khớp DOM).
    const domIds = new Set(snap0.clips.map((c) => `${c.trackId}/${c.clipId}`));
    const storeIds = new Set(st0.tracks.flatMap((t) => t.clips.map((c) => `${t.id}/${c.id}`)));
    const sameIds = domIds.size === storeIds.size && [...domIds].every((x) => storeIds.has(x));
    if (sameIds && st0.storeUrl.includes("/src/store.ts")) {
      pass("A0b live store", `import '${st0.storeUrl}' trả đúng store app đang dùng (id clip khớp DOM ${domIds.size}/${domIds.size})`);
    } else {
      fail("A0b live store", `storeUrl=${st0.storeUrl} sameIds=${sameIds} dom=${[...domIds]} store=${[...storeIds]} — DỪNG: không chứng minh được injection chạm đúng store`);
      throw new Error("live-store check fail — dừng lượt");
    }

    // A0c: đóng welcome modal (nếu có).
    const modalRes = await closeModal(cdp);
    if (/đã đóng|không có modal/.test(modalRes)) pass("A0c đóng welcome modal", modalRes);
    else fail("A0c đóng welcome modal", modalRes);

    // Chọn clip video đầu tiên bằng CLICK THẬT lên timeline.
    const firstVideo = snap0.clips.find((c) => {
      const t = st0.tracks.find((tr) => tr.id === c.trackId);
      return t?.clips.find((cl) => cl.id === c.clipId)?.kind === "video";
    }) || snap0.clips[0];
    await cdp.click(firstVideo.x, firstVideo.y);
    await sleep(600);
    let d = await dom();
    let s = await store();
    const selClip = s.selection[0];
    if (d.kf && selClip) {
      pass("C0 chọn clip video + KeyframePanel hiện", `đã chọn ${selClip.trackId}/${selClip.clipId}, .kf-panel có trong DOM, count="${d.kf.countText}", tabs=[${d.kf.tabs.map((t) => t.label).join(" | ")}]`);
    } else {
      fail("C0 chọn clip video + KeyframePanel hiện", `kf panel present=${!!d.kf} selection=${JSON.stringify(s.selection)} — DỪNG keyframe phase`);
      throw new Error("không mở được KeyframePanel — dừng lượt");
    }
    const clip1 = { trackId: selClip.trackId, clipId: selClip.clipId };

    // ---- C1: [null] vào animations.x ----
    const errBeforeC1 = await errSnap(cdp);
    const inj1 = await cdp.evalJs(injectFn("x", "[null]"));
    await sleep(800);
    const kf1 = await cdp.evalJs(KF_FN); s = await store();
    const storedX1 = s.tracks.find((t) => t.id === clip1.trackId)?.clips.find((c) => c.id === clip1.clipId)?.animations?.x?.keyframes;
    const errAfterC1 = await errSnap(cdp);
    const countNum = (txt) => { const m = String(txt || "").match(/(\d+)/); return m ? Number(m[1]) : null; };
    if (inj1.ok && Array.isArray(storedX1) && storedX1.length === 1 && storedX1[0] === null
      && kf1 && countNum(kf1.countText) === 0 && kf1.diamonds === 0 && kf1.laneEmpty
      && kf1.liveText === "—" && !kf1.editor && errClean(errBeforeC1, errAfterC1)) {
      pass("C1 [null] vào x: panel sống, guard hoạt động",
        `store giữ đúng [null] (keyframes[0]===null), panel không crash: count=0, 0 diamond, lane-empty hiện, live="—", editor ẩn, 0 lỗi mới (win/cdp: ${errDeltaStr(errBeforeC1, errAfterC1)}; issues: ${JSON.stringify(kf1.issues)}; tab x badge raw=${JSON.stringify(kf1.tabs[0])})`);
    } else {
      fail("C1 [null] vào x: panel sống, guard hoạt động",
        `inj=${JSON.stringify(inj1)} storedX=${JSON.stringify(storedX1)} kf=${JSON.stringify(kf1)} lỗi mới: ${errDeltaStr(errBeforeC1, errAfterC1)} winErrs=${JSON.stringify(await cdp.evalJs(`(window.__h6errors || []).slice()`))} cdpExc=${JSON.stringify(cdp.exceptions.slice(-2))}`);
    }

    // ---- C2: chuyển tab opacity → x (panel vẫn sống với dữ liệu null) ----
    // Tọa độ đo TƯƠI trước mỗi click (click đổi tab → re-render → tọa độ cũ
    // có thể lệch; bài học lượt 1).
    const errBeforeC2 = await errSnap(cdp);
    let c2ok = false, c2detail = "";
    let kOp = null, kX = null;
    {
      const pOp = await cdp.evalJs(kfPosFn("tab", 2));
      if (pOp) {
        await cdp.click(pOp.x, pOp.y); await sleep(500);
        kOp = await cdp.evalJs(KF_FN);
        const opOk = kOp && kOp.tabs[2].active && countNum(kOp.countText) === 0 && kOp.diamonds === 0;
        if (opOk) {
          const pX = await cdp.evalJs(kfPosFn("tab", 0));
          if (pX) {
            await cdp.click(pX.x, pX.y); await sleep(500);
            kX = await cdp.evalJs(KF_FN);
          }
        }
        const errAfterC2 = await errSnap(cdp);
        c2ok = !!opOk && !!kX && kX.tabs[0].active && countNum(kX.countText) === 0 && kX.diamonds === 0 && errClean(errBeforeC2, errAfterC2);
        c2detail = `opacity tab: pos=${JSON.stringify(pOp)} hitIsTarget=${pOp.hitIsTarget} active=${kOp?.tabs[2]?.active} count="${kOp?.countText}" diamonds=${kOp?.diamonds}; về tab x: active=${kX?.tabs[0]?.active} count="${kX?.countText}" diamonds=${kX?.diamonds}, lỗi mới: ${errDeltaStr(errBeforeC2, errAfterC2)}`;
      } else c2detail = `không đo được tọa độ tab opacity`;
    }
    if (c2ok) pass("C2 chuyển tab opacity→x với [null]", c2detail);
    else fail("C2 chuyển tab opacity→x với [null]", c2detail);

    // ---- C3: [null, valid, null] + click marker + Thêm/Xoá ----
    const errBeforeC3 = await errSnap(cdp);
    const inj3 = await cdp.evalJs(injectFn("x", '[null,{"t":1,"v":0.6,"easing":"linear"},null]'));
    await sleep(800);
    let k3 = await cdp.evalJs(KF_FN); s = await store();
    const storedX3 = s.tracks.find((t) => t.id === clip1.trackId)?.clips.find((c) => c.id === clip1.clipId)?.animations?.x?.keyframes;
    let c3detail = `inj=${JSON.stringify(inj3)} stored=${JSON.stringify(storedX3)} count="${k3?.countText}" diamonds=${k3?.diamonds} live="${k3?.liveText}"`;
    let c3ok = inj3.ok && Array.isArray(storedX3) && storedX3.length === 3 && storedX3[0] === null && storedX3[2] === null
      && k3 && countNum(k3.countText) === 1 && k3.diamonds === 1 && k3.liveText !== "—";
    if (c3ok) {
      // Click marker thật → editor phải hiện với t=1, v=0.6 (đo tọa độ tươi).
      const pDia = await cdp.evalJs(kfPosFn("diamond"));
      if (!pDia) { c3ok = false; c3detail += " | không đo được tọa độ diamond"; }
      else {
        await cdp.click(pDia.x, pDia.y); await sleep(600);
        const kSel = await cdp.evalJs(KF_FN);
        c3detail += ` | click marker tại ${JSON.stringify(pDia)}: editor=${kSel.editor} inputs=${JSON.stringify(kSel.editorInputs)}`;
        c3ok = kSel.editor && kSel.editorInputs[0] === "1" && Number(kSel.editorInputs[1]) === 0.6;
      }
      if (c3ok) {
        // Bấm "Thêm keyframe" (tại playhead 0) → count 2; bấm "Xoá" → count 1.
        const pAdd = await cdp.evalJs(kfPosFn("addBtn"));
        if (!pAdd) { c3ok = false; c3detail += " | không đo được tọa độ nút Thêm"; }
        else {
          await cdp.click(pAdd.x, pAdd.y); await sleep(600);
          const kAdd = await cdp.evalJs(KF_FN);
          c3detail += ` | sau Thêm: count="${kAdd.countText}" diamonds=${kAdd.diamonds}`;
          c3ok = countNum(kAdd.countText) === 2 && kAdd.diamonds === 2;
        }
        if (c3ok) {
          const pDel = await cdp.evalJs(kfPosFn("delBtn"));
          if (!pDel) { c3ok = false; c3detail += " | không đo được tọa độ nút Xoá"; }
          else {
            await cdp.click(pDel.x, pDel.y); await sleep(600);
            const kDel = await cdp.evalJs(KF_FN);
            c3detail += ` | sau Xoá: count="${kDel.countText}" diamonds=${kDel.diamonds}`;
            c3ok = countNum(kDel.countText) === 1 && kDel.diamonds === 1;
          }
        }
      }
    }
    const errAfterC3 = await errSnap(cdp);
    c3detail += ` | lỗi mới: ${errDeltaStr(errBeforeC3, errAfterC3)}`;
    if (c3ok && errClean(errBeforeC3, errAfterC3)) pass("C3 [null,valid,null]: marker + editor + Thêm/Xoá", c3detail);
    else fail("C3 [null,valid,null]: marker + editor + Thêm/Xoá", c3detail);

    // ---- C4: dblclick lane thêm keyframe tại 50% (t=2s) ----
    const errBeforeC4 = await errSnap(cdp);
    const pLane = await cdp.evalJs(kfPosFn("lane"));
    let c4ok = false, c4detail = "";
    if (pLane) {
      await cdp.dblclick(pLane.x, pLane.y); await sleep(700);
      const k4b = await cdp.evalJs(KF_FN);
      const errAfterC4 = await errSnap(cdp);
      c4ok = countNum(k4b.countText) === 2 && k4b.diamonds === 2 && errClean(errBeforeC4, errAfterC4);
      c4detail = `dblclick lane ${JSON.stringify(pLane)} → count="${k4b.countText}" diamonds=${k4b.diamonds} (muốn 2/2), lỗi mới: ${errDeltaStr(errBeforeC4, errAfterC4)}`;
    } else c4detail = `không đo được lane`;
    if (c4ok) pass("C4 dblclick lane thêm keyframe", c4detail);
    else fail("C4 dblclick lane thêm keyframe", c4detail);

    // ---- C5: [null] vào opacity — hàng live mờ phải hiện "—", x vẫn có giá trị ----
    const errBeforeC5 = await errSnap(cdp);
    const inj5 = await cdp.evalJs(injectFn("opacity", "[null]"));
    await sleep(800);
    const k5 = await cdp.evalJs(KF_FN); s = await store();
    const storedO5 = s.tracks.find((t) => t.id === clip1.trackId)?.clips.find((c) => c.id === clip1.clipId)?.animations?.opacity?.keyframes;
    const errAfterC5 = await errSnap(cdp);
    const opRow = (k5?.liveRows || []).find((row) => row.includes("Độ mờ"));
    const c5ok = inj5.ok && Array.isArray(storedO5) && storedO5.length === 1 && storedO5[0] === null
      && k5 && opRow !== undefined && /—$/.test(opRow) && k5.liveText !== "—" && errClean(errBeforeC5, errAfterC5);
    if (c5ok) {
      pass("C5 [null] vào opacity: hàng live mờ = \"—\", x vẫn có giá trị",
        `store opacity=[null], hàng "Độ mờ" = "${opRow}", live x="${k5.liveText}", 0 lỗi mới`);
    } else {
      fail("C5 [null] vào opacity: hàng live mờ = \"—\", x vẫn có giá trị",
        `inj=${JSON.stringify(inj5)} storedOpacity=${JSON.stringify(storedO5)} liveRows=${JSON.stringify(k5?.liveRows)} live="${k5?.liveText}" lỗi mới: ${errDeltaStr(errBeforeC5, errAfterC5)}`);
    }

    // Thu lỗi lượt 1 trước khi reload (window.__h6errors reset theo page).
    errorsBefore.push(...(await cdp.evalJs(`(window.__h6errors || []).slice()`)));
    errorsBefore.push(...cdp.exceptions.slice());

    // ================= LƯỢT LOAD 2: THAO TÁC CỐT LÕI (N3) =================
    // Xoá autosave để reload ra sample mới nguyên vẹn (không mang trim/split/delete + keyframes của lượt 1).
    await cdp.evalJs(`localStorage.removeItem("vcut-studio:autosave:v1")`);
    await cdp.send("Page.navigate", { url: DEV_URL });
    const snap1 = await cdp.waitFor(async () => {
      const dd = await dom().catch(() => null);
      return dd && dd.clips.length >= 3 ? dd : null;
    }, "project mẫu mới >= 3 clip sau reload", 180000);
    const st1 = await store();
    if (snap1.clips.length === 3 && st1.name === "Dự án mẫu") {
      pass("B0 reload sample mới cho phase N3", `3 clip, tên "Dự án mẫu", pxPerSec=${st1.pxPerSec}`);
    } else {
      fail("B0 reload sample mới cho phase N3", `clips=${snap1.clips.length} name=${st1.name}`);
    }
    await closeModal(cdp);
    const pps = st1.pxPerSec;
    const clipOf = async (trackId, clipId) => {
      const ss = await store();
      return ss.tracks.find((t) => t.id === trackId)?.clips.find((c) => c.id === clipId) || null;
    };
    const v1 = st1.tracks.find((t) => t.kind === "video");
    const [cA, cB] = v1.clips;
    const domClip = (id) => snap1.clips.find((c) => c.clipId === id);
    const approx = (a, b, eps = 0.06) => Math.abs(a - b) <= eps;

    // ---- B1: trim mép phải clip1 −1s (kéo handle thật) ----
    let b1ok = false, b1detail = "";
    {
      const rect = await cdp.evalJs(`(() => {
        const clip = document.querySelector('.tl-clip[data-clip-id=${JSON.stringify(cA.id)}]');
        if (!clip) return null;
        const h = clip.querySelector(".clip-handle.right");
        if (!h) return null;
        const b = h.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      })()`);
      if (rect) {
        await cdp.drag(rect.x, rect.y, rect.x - pps, rect.y);
        const after = await clipOf(v1.id, cA.id);
        const other = await clipOf(v1.id, cB.id);
        b1ok = after && approx(after.duration, 3) && approx(after.start, 0)
          && other && approx(other.start, 4) && approx(other.duration, 4);
        b1detail = `kéo handle phải clip1 −${pps}px (−1s): clip1 ${cA.start}s/${cA.duration}s → ${after?.start}s/${after?.duration}s (muốn 0/3), clip2 vẫn ${other?.start}s/${other?.duration}s`;
      } else b1detail = "không tìm thấy .clip-handle.right của clip1";
    }
    if (b1ok) pass("B1 trim mép phải clip1 −1s", b1detail); else fail("B1 trim mép phải clip1 −1s", b1detail);

    // ---- B2/B2u/B2r: kéo clip2 +1s, Ctrl+Z, Ctrl+Shift+Z ----
    let b2ok = false;
    {
      const dNow = await dom();
      const el = dNow.clips.find((c) => c.clipId === cB.id);
      if (el) {
        await cdp.drag(el.x, el.y, el.x + pps, el.y);
        const after = await clipOf(v1.id, cB.id);
        b2ok = after && approx(after.start, 5);
        if (b2ok) pass("B2 kéo clip2 +1s", `clip2 start 4 → ${after.start}s (muốn 5)`);
        else fail("B2 kéo clip2 +1s", `sau kéo clip2 start=${after?.start} (muốn 5), clip=${JSON.stringify(after)}`);
      } else fail("B2 kéo clip2 +1s", "không tìm thấy clip2 trong DOM");
    }
    if (b2ok) {
      await cdp.key("z", "KeyZ", 2); // Ctrl+Z
      await sleep(500);
      const u = await clipOf(v1.id, cB.id);
      if (u && approx(u.start, 4)) pass("B2u Ctrl+Z hoàn tác lần kéo", `clip2 start → ${u.start}s (muốn 4)`);
      else fail("B2u Ctrl+Z hoàn tác lần kéo", `sau Ctrl+Z clip2 start=${u?.start} (muốn 4)`);
      await cdp.key("z", "KeyZ", 10); // Ctrl+Shift+Z
      await sleep(500);
      const r = await clipOf(v1.id, cB.id);
      if (r && approx(r.start, 5)) pass("B2r Ctrl+Shift+Z làm lại lần kéo", `clip2 start → ${r.start}s (muốn 5)`);
      else fail("B2r Ctrl+Shift+Z làm lại lần kéo", `sau Ctrl+Shift+Z clip2 start=${r?.start} (muốn 5)`);
    } else {
      fail("B2u Ctrl+Z hoàn tác lần kéo", "SKIP phụ thuộc: B2 kéo không đổi start nên không có gì để hoàn tác");
      fail("B2r Ctrl+Shift+Z làm lại lần kéo", "SKIP phụ thuộc: B2 kéo không đổi start nên không có gì để làm lại");
    }

    // ---- B3: split tại playhead 6.5s (phím S thật) ----
    let b3ok = false, b3detail = "";
    {
      const dNow = await dom();
      const ruler = dNow.rulerPos;
      if (ruler) {
        await cdp.click(ruler.left + 6.5 * pps, ruler.y); await sleep(700);
        const ph = (await store()).playhead;
        const before = (await store()).tracks.find((t) => t.id === v1.id)?.clips.length;
        await cdp.key("s", "KeyS"); await sleep(700);
        const afterS = await store();
        const vClips = afterS.tracks.find((t) => t.id === v1.id)?.clips || [];
        const pieces = vClips.filter((c) => approx(c.start, 5) || approx(c.start, 6.5));
        b3ok = approx(ph, 6.5, 0.15) && vClips.length === (before ?? 0) + 1
          && pieces.length === 2 && pieces.some((c) => approx(c.start, 5) && approx(c.duration, 1.5))
          && pieces.some((c) => approx(c.start, 6.5) && approx(c.duration, 2.5));
        b3detail = `playhead=${ph.toFixed(2)} (muốn 6.5), v1 clips ${before}→${vClips.length}, mảnh: ${JSON.stringify(vClips.map((c) => [c.start, c.duration]))}`;
      } else b3detail = "không tìm thấy .tl-ruler";
    }
    if (b3ok) pass("B3 phím S split clip2 tại 6.5s", b3detail); else fail("B3 phím S split clip2 tại 6.5s", b3detail);

    // ---- B4: Delete xoá mảnh [6.5, 9) ----
    let b4ok = false, b4detail = "";
    {
      const dNow = await dom();
      const piece = dNow.clips.find((c) => {
        const ss = st1.tracks; void ss;
        return c.trackId === v1.id;
      });
      void piece;
      // Tìm mảnh theo tọa độ: clip v1 có left lớn nhất (mảnh sau split).
      const vClipsDom = dNow.clips.filter((c) => c.trackId === v1.id).sort((a, b) => a.left - b.left);
      const last = vClipsDom[vClipsDom.length - 1];
      if (last) {
        await cdp.click(last.x, last.y); await sleep(500);
        const sel = (await store()).selection;
        const before = (await store()).tracks.find((t) => t.id === v1.id)?.clips.length;
        await cdp.key("Delete", "Delete"); await sleep(700);
        const afterS = await store();
        const vClips = afterS.tracks.find((t) => t.id === v1.id)?.clips || [];
        b4ok = sel.length === 1 && vClips.length === (before ?? 0) - 1
          && !vClips.some((c) => approx(c.start, 6.5));
        b4detail = `đã chọn ${JSON.stringify(sel)} rồi Delete: v1 clips ${before}→${vClips.length}, còn mảnh start≈6.5: ${vClips.some((c) => approx(c.start, 6.5))}`;
      } else b4detail = "không tìm thấy clip v1 nào trong DOM";
    }
    if (b4ok) pass("B4 phím Delete xoá mảnh đã chọn", b4detail); else fail("B4 phím Delete xoá mảnh đã chọn", b4detail);

    // ---- B5: box-select 3 clip còn lại ----
    let b5ok = false, b5detail = "";
    {
      const dNow = await dom();
      const sNow = await store();
      const vClipsDom = dNow.clips.filter((c) => c.trackId === v1.id).sort((a, b) => a.left - b.left);
      const textDom = dNow.clips.find((c) => c.trackId !== v1.id);
      const first = vClipsDom[0];
      const lastV = vClipsDom[vClipsDom.length - 1];
      if (first && lastV && textDom && dNow.lanesPos) {
        const x0 = lastV.right + 30;
        const y0 = lastV.y;
        const x1 = first.left - 5;
        const y1 = textDom.bottom + 5;
        await cdp.drag(x0, y0, x1, y1);
        await sleep(500);
        const sAfter = await store();
        const dAfter = await dom();
        const selCount = sAfter.selection.length;
        const domSel = dAfter.clips.filter((c) => c.sel).length;
        b5ok = selCount === 3 && domSel === 3;
        b5detail = `kéo box (${Math.round(x0)},${Math.round(y0)})→(${Math.round(x1)},${Math.round(y1)}): selection=${selCount} (muốn 3), .tl-clip.selected=${domSel}, sel=${JSON.stringify(sAfter.selection)}`;
      } else b5detail = `thiếu tọa độ: vClips=${vClipsDom.length} text=${!!textDom} lanes=${!!dNow.lanesPos}`;
    }
    if (b5ok) pass("B5 box-select kéo vùng trống chọn 3 clip", b5detail); else fail("B5 box-select kéo vùng trống chọn 3 clip", b5detail);

    // ---- B6: không lỗi trong toàn phiên ----
    const endErrs = await cdp.evalJs(`(window.__h6errors || []).slice()`);
    const allErrs = [...errorsBefore, ...endErrs, ...cdp.exceptions];
    if (allErrs.length === 0) {
      pass("B6 không lỗi console trong phiên", "0 window.onerror + 0 unhandledrejection + 0 Runtime.exceptionThrown (cả 2 lượt load)");
    } else {
      fail("B6 không lỗi console trong phiên", JSON.stringify(allErrs.map((e) => String(e).slice(0, 300))));
    }
  } catch (e) {
    log(`HARNESS LỖI (lượt ${attempt}): ${e.message}`);
    return { results, harnessError: e.message, serverUp };
  } finally {
    killAll();
    await sleep(500);
  }
  return { results, harnessError: null, serverUp };
}

async function main() {
  if (!fs.existsSync(CHROME)) { console.error(`BLOCKER: không thấy chrome ${CHROME}`); process.exit(2); }
  fs.mkdirSync(SCRATCH, { recursive: true });
  const r1 = await runAttempt(1);
  let final = r1;
  const failed1 = r1.results.filter((r) => !r.ok);
  // Chạy lại 1 lần khi lượt 1 không sạch (bất kể fail do flake tải song
  // song hay bug thật — lượt 2 xác nhận lại; ghi rõ cả 2 lượt trong JSON).
  if ((r1.harnessError || failed1.length > 0) && process.env.H6_NO_RETRY !== "1") {
    log(`lượt 1 không sạch (${r1.harnessError ? "harness lỗi" : failed1.length + " FAIL"}) — chạy lại 1 lần theo luật (H6_NO_RETRY=1 để tắt)`);
    const r2 = await runAttempt(2);
    log(`lượt 2: ${r2.results.filter((r) => r.ok).length}/${r2.results.length} pass${r2.harnessError ? " (harness lỗi: " + r2.harnessError + ")" : ""}`);
    final = r2;
    final.attempts = [r1, r2];
  } else {
    final.attempts = [r1];
  }
  const out = { attempts: final.attempts.map((a) => ({ results: a.results, harnessError: a.harnessError || null })) };
  writeFileEpermRetry(path.join(SCRATCH, "h6-result.json"), JSON.stringify(out, null, 2));
  writeFileEpermRetry(path.join(SCRATCH, "h6-log.txt"), logLines.join("\n"));
  const res = final.results;
  const failed = res.filter((r) => !r.ok);
  console.log(`\n== H6 keyframe clicktest: ${res.length - failed.length}/${res.length} pass ==${final.harnessError ? " (HARNESS ERROR — exit 2)" : ""}`);
  console.log(`kết quả JSON: ${path.join(SCRATCH, "h6-result.json")}`);
  process.exit(final.harnessError ? 2 : (failed.length > 0 ? 1 : 0));
}

main().catch((e) => { console.error("BLOCKER:", e?.message || e); process.exit(2); });
