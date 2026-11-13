#!/usr/bin/env node
/**
 * clicktest-57n9-timeline-core-ops.mjs — Phase 9 đợt 57, luồng N9:
 * mở rộng click-test bao phủ thao tác timeline cốt lõi (nợ N3 trong
 * PHASE9_GAP_ANALYSIS.md §2.7): trim mép clip, split, delete clip,
 * box-select, undo/redo sau kéo clip (+ multiselect+delete, split rồi undo).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-55l1-i18n-projectmenu-topbar.mjs.
 * CHỈ thêm file test/harness — KHÔNG sửa code sản phẩm apps/web/src.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-57n9-timeline-core-ops.mjs
 * Env: N9_DEV_PORT (mặc định tự chọn 5370–5389), N9_DEBUG_PORT (9470–9489),
 * N9_DISPLAY (mặc định :157 — display RIÊNG của N9, không dùng chung),
 * N9_SCRATCH (mặc định hidden_files/round57-n9/headed). TMPDIR riêng
 * /tmp/round57-n9/tmp. Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi.
 * KHÔNG sửa file sản phẩm, KHÔNG push/tag/binary.
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
const SCRATCH = process.env.N9_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round57-n9", "headed");
const CHROME = path.join(os.homedir(), ".cache/ms-playwright", "chromium-1254", "chrome-linux64", "chrome");
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
  async click(x, y, modifiers = 0) {
    await this.mouse("mousePressed", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await this.mouse("mouseReleased", x, y, { button: "left", clickCount: 1, ...(modifiers ? { modifiers } : {}) });
    await sleep(400);
  }
  async drag(x0, y0, x1, y1, steps = 12) {
    await this.mouse("mousePressed", x0, y0, { button: "left", clickCount: 1 });
    for (let i = 1; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = y0 + ((y1 - y0) * i) / steps;
      await this.mouse("mouseMoved", x, y, { button: "left" });
      await sleep(30);
    }
    await this.mouse("mouseReleased", x1, y1, { button: "left", clickCount: 1 });
    await sleep(500);
  }
  async key(key, code, modifiers = 0) {
    const base = { key, code, modifiers };
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyDown" });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
    await sleep(400);
  }
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__n9errors = [];
  window.addEventListener("error", (e) => { try { window.__n9errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__n9errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__n9errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__n9errors.push("unhandledrejection: <?>"); } });
  // Probe chẩn đoán: ghi lại target thật nhận pointer event (để phân
  // biệt "kéo không tới clip" do modal/overlay chặn vs bug kéo).
  window.__n9probe = [];
  const h = (e) => { try { window.__n9probe.push(e.type + "@" + Math.round(e.clientX) + "," + Math.round(e.clientY) + " target=" + ((e.target.className && e.target.className.baseVal !== undefined ? e.target.className.baseVal : e.target.className) || e.target.tagName)); } catch {} };
  window.addEventListener("pointerdown", h, true);
  window.addEventListener("pointermove", h, true);
  window.addEventListener("pointerup", h, true);
  // Marker phát hiện trang bị reload giữa chừng (HMR/full-reload do file
  // luồng khác đổi): sau reload mọi window.* đều mất nên marker mất theo.
  window.__n9boot = Math.random().toString(36).slice(2);
})()`;

// Đọc store thật mà app đã nạp (mẫu L1): import /src/store.ts qua
// performance resource entries rồi dùng useStore.getState().
// Chỉ dùng để ĐỌC state + RESET project mẫu giữa các case (setup),
// mọi thao tác dưới test đều là chuột/phím thật qua CDP.
const STORE_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__n9storeMod || (window.__n9storeMod = await import(hit));
  return mod.useStore.getState();
})()`;

// Snapshot trạng thái timeline thật từ store (đọc, không sửa).
const STATE_FN = `(async () => {
  const st = await (${STORE_FN});
  const clips = [];
  for (const t of st.spec.tracks) for (const c of t.clips) clips.push({
    trackId: t.id, trackKind: t.kind, clipId: c.id, kind: c.kind,
    start: +c.start.toFixed(3), duration: +c.duration.toFixed(3),
    in: c.in ?? null, out: c.out ?? null,
  });
  return {
    clips, clipCount: clips.length,
    videoClips: clips.filter((c) => c.trackId === "v1"),
    textClips: clips.filter((c) => c.trackId === "t1"),
    selection: st.selection.map((s) => ({ trackId: s.trackId, clipId: s.clipId })),
    undoDepth: st.undoDepth, redoDepth: st.redoDepth,
    playhead: +st.playhead.toFixed(3), pxPerSec: st.pxPerSec,
    errors: (window.__n9errors || []).slice(),
  };
})()`;

// Reset về project mẫu mới (3 clip: v1 0–4s + 4–8s, t1 0.5–5.5s) rồi
// chờ DOM timeline có đủ 3 clip. Chỉ là setup giữa các case.
const RESET_FN = `(async () => {
  const st = await (${STORE_FN});
  await st.loadSample();
  return true;
})()`;

// Hình học thật của lanes/clip/handle/ruler để tính tọa độ kéo/chạm.
const GEOM_FN = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { x: +b.left.toFixed(1), y: +b.top.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      cx: +(b.left + b.width / 2).toFixed(1), cy: +(b.top + b.height / 2).toFixed(1) }; };
  const lanes = document.querySelector(".tl-lanes");
  const ruler = document.querySelector(".tl-ruler");
  const clips = [...document.querySelectorAll(".tl-clip")].map((el) => ({
    trackId: el.dataset.trackId, clipId: el.dataset.clipId, rect: r(el),
    handleL: r(el.querySelector(".clip-handle.left")),
    handleR: r(el.querySelector(".clip-handle.right")),
  }));
  const videoLane = document.querySelector(".tl-lane.lane-video");
  const textLane = document.querySelector(".tl-lane.lane-text");
  return { lanes: r(lanes), ruler: r(ruler), clips,
    videoLane: r(videoLane), textLane: r(textLane) };
})()`;

const approx = (a, b, eps = 0.06) => Math.abs(a - b) <= eps;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  async function resetProject(cdp) {
    // Trang mới sau reload thì window.__n9boot mất → inject lại listener
    // lỗi/probe + boot marker (chỉ inject khi thiếu để không nhân đôi).
    const hasBoot = await cdp.evalJs(`typeof window.__n9boot`).catch(() => "undefined");
    if (hasBoot !== "string") await cdp.evalJs(INJECT_ERRORS);
    await cdp.evalJs(RESET_FN);
    const s = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 ? t : null;
    }, "reset project mẫu (3 clip)", 180000);
    // Xác nhận lại boot + đủ 3 clip sau khi đặt marker (chống reload lọt
    // vào giữa reset và lúc đọc boot).
    const boot = await cdp.evalJs(`window.__n9boot`);
    const s2 = await cdp.evalJs(STATE_FN).catch(() => null);
    if (!s2 || s2.clipCount !== 3) throw new Error("reset không ổn định (trang có thể vừa reload giữa chừng)");
    return { state: s, boot };
  }

  // Trang còn đúng phiên boot lúc reset không (false = vừa bị reload).
  async function bootOk(cdp, boot) {
    return (await cdp.evalJs(`window.__n9boot`).catch(() => null)) === boot;
  }

  // Modal chào chặn mọi pointer event (elementFromPoint → modal-backdrop)
  // và KHÔNG đóng bằng Escape — chỉ đóng bằng nút "Để sau". Gọi trước
  // mỗi case để một modal mở muộn không làm fail dây chuyền.
  async function ensureNoModal(cdp) {
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) return true;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
      await cdp.key("Escape", "Escape").catch(() => {});
      await sleep(600);
    }
    return !(await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`));
  }

  // Phần tử thật tại một điểm (để biết kéo/chạm có tới đúng clip không).
  async function hitAt(cdp, x, y) {
    return cdp.evalJs(`(() => { const el = document.elementFromPoint(${x}, ${y}); if (!el) return "null"; const c = el.closest ? el.closest(".tl-clip") : null; const cls = (el.className && el.className.baseVal !== undefined) ? el.className.baseVal : (el.className || el.tagName); return cls + " | clip=" + (c ? c.dataset.trackId + ":" + c.dataset.clipId : "none"); })()`);
  }

  try {
    const DEV_PORT = Number(process.env.N9_DEV_PORT || 0) || (await pickFreePort(5370, 5389));
    const DEBUG_PORT = Number(process.env.N9_DEBUG_PORT || 0) || (await pickFreePort(9470, 9489));
    const DISPLAY = process.env.N9_DISPLAY || ":157";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5370–5389");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9470–9489");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (N9 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round57-n9/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "n9-vite.log"), "w");
    // Config tạm /tmp/round57-n9/vite.n9.config.mjs tắt HMR (xem file đó):
    // luồng khác sửa .tsx/.ts giữa chừng không reload trang đang test.
    vite = spawn(VITE_BIN, ["-c", "/tmp/round57-n9/vite.n9.config.mjs", "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
      { cwd: WEB_DIR, stdio: ["ignore", viteLogFd, viteLogFd] });
    let up = false;
    for (let i = 0; i < 120 && !up; i++) {
      try { const r = await fetch(DEV_URL); if (r.ok) up = true; } catch { await sleep(1000); }
    }
    if (!up) throw new Error(`vite dev không lên ở ${DEV_URL} sau 120 s`);
    log("vite dev đã lên");

    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
    await sleep(900);
    if (xvfb.exitCode !== null) throw new Error(`Xvfb ${DISPLAY} thoát sớm (exit ${xvfb.exitCode})`);
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "n9-chrome.log"), "w");
    chrome = spawn(CHROME, ["--remote-debugging-port=" + DEBUG_PORT, `--user-data-dir=${PROFILE}`,
      "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run",
      "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900", "--hide-scrollbars", "about:blank"],
      { stdio: ["ignore", chromeLogFd, chromeLogFd], env: { ...process.env, DISPLAY, TMPDIR } });
    let pageTarget = null;
    for (let i = 0; i < 180 && !pageTarget; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        pageTarget = pages.find((p) => p.type === "page");
        if (!pageTarget) await sleep(500);
      } catch { await sleep(500); }
    }
    if (!pageTarget) throw new Error("không lấy được page target CDP");
    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: DEV_URL });
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, "app mount (topbar có VCut Studio, splash đã tắt)", 240000);
    log("app đã mount");

    // Đóng modal chào nếu có (Escape không đóng được — chỉ nút "Để sau").
    const modalGone = await ensureNoModal(cdp);
    if (!modalGone) throw new Error("modal chào vẫn mở sau 3 lần đóng — không đo được Timeline (harness lỗi)");
    log("modal chào đã đóng");

    // H0: project mẫu tự load lúc mount — 3 clip, pxPerSec 60, undoDepth 0.
    const s0 = await cdp.waitFor(async () => {
      const t = await cdp.evalJs(STATE_FN).catch(() => null);
      return t && t.clipCount === 3 ? t : null;
    }, "project mẫu tự load (3 clip)", 180000);
    const v0 = s0.videoClips;
    if (s0.pxPerSec === 60 && s0.undoDepth === 0 && v0.length === 2
      && approx(v0[0].start, 0) && approx(v0[0].duration, 4)
      && approx(v0[1].start, 4) && approx(v0[1].duration, 4)
      && s0.textClips.length === 1 && approx(s0.textClips[0].start, 0.5) && approx(s0.textClips[0].duration, 5)) {
      pass("H0 project mẫu tự load: 3 clip đúng hình học", `v1: [0–4, 4–8], t1: [0.5–5.5], pxPerSec=${s0.pxPerSec}, undoDepth=0`);
    } else {
      fail("H0 project mẫu tự load: 3 clip đúng hình học", JSON.stringify(s0));
    }
    await cdp.shot("n9-h0-sample.png");

    // N1: trim mép PHẢI clip A bằng kéo handle phải sang trái 60px (1s).
    {
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const clipA = g.clips.find((c) => c.trackId === "v1");
      if (!clipA || !clipA.handleR) throw new Error("không tìm thấy clip v1 / handle phải (N1)");
      await cdp.drag(clipA.handleR.cx, clipA.handleR.cy, clipA.handleR.cx - 60, clipA.handleR.cy);
      const s = await cdp.evalJs(STATE_FN);
      const a = s.videoClips[0];
      if (approx(a.start, 0) && approx(a.duration, 3) && approx(a.out, 3) && s.videoClips[1] && approx(s.videoClips[1].start, 4)) {
        pass("N1 trim mép phải: kéo handle phải −1s", `clip A 4s → ${a.duration}s, start=${a.start}, out=${a.out}; clip B vẫn start=4`);
      } else {
        fail("N1 trim mép phải: kéo handle phải −1s", `clip A=${JSON.stringify(a)}, clip B=${JSON.stringify(s.videoClips[1])}`);
      }
      await cdp.shot("n9-n1-trim-right.png");
    }

    // N2: trim mép TRÁI clip A bằng kéo handle trái sang phải 60px (1s).
    {
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const clipA = g.clips.find((c) => c.trackId === "v1");
      if (!clipA || !clipA.handleL) throw new Error("không tìm thấy clip v1 / handle trái (N2)");
      await cdp.drag(clipA.handleL.cx, clipA.handleL.cy, clipA.handleL.cx + 60, clipA.handleL.cy);
      const s = await cdp.evalJs(STATE_FN);
      const a = s.videoClips[0];
      if (approx(a.start, 1) && approx(a.duration, 3) && approx(a.in, 1) && approx(a.out, 4)) {
        pass("N2 trim mép trái: kéo handle trái +1s", `clip A start 0 → ${a.start}, duration ${a.duration}s, in=${a.in}, out=${a.out}`);
      } else {
        fail("N2 trim mép trái: kéo handle trái +1s", `clip A=${JSON.stringify(a)}`);
      }
      await cdp.shot("n9-n2-trim-left.png");
    }

    // N3: split tại playhead — click ruler ở t=6s rồi phím S.
    // t=6s nằm trong clip B (4–8s) nhưng NGOÀI clip chữ (0.5–5.5s):
    // splitAtPlayhead ưu tiên track trên cùng chứa playhead, nên ở 2s nó
    // tách clip CHỮ chứ không phải clip video (xem N9).
    {
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      if (!g.ruler) throw new Error("không tìm thấy ruler (N3)");
      const pps = (await cdp.evalJs(STATE_FN)).pxPerSec;
      await cdp.click(g.ruler.x + 6 * pps, g.ruler.cy);
      const sPre = await cdp.evalJs(STATE_FN);
      if (!approx(sPre.playhead, 6)) {
        fail("N3 split tại playhead 6s (phím S)", `click ruler không đặt được playhead: playhead=${sPre.playhead}`);
      } else {
        await cdp.key("s", "KeyS");
        await sleep(600);
        const s = await cdp.evalJs(STATE_FN);
        const vs = s.videoClips;
        if (vs.length === 3 && approx(vs[0].start, 0) && approx(vs[0].duration, 4)
          && approx(vs[1].start, 4) && approx(vs[1].duration, 2)
          && approx(vs[2].start, 6) && approx(vs[2].duration, 2)
          && approx(vs[1].out, 2) && approx(vs[2].in, 2)
          && s.textClips.length === 1) {
          pass("N3 split tại playhead 6s (phím S)", `v1: 2 clip → 3 clip [0–4, 4–6, 6–8], in/out chia đúng (2/2); clip chữ còn nguyên 1 clip`);
        } else {
          fail("N3 split tại playhead 6s (phím S)", `v1=${JSON.stringify(vs)}, t1=${JSON.stringify(s.textClips)}`);
        }
      }
      await cdp.shot("n9-n3-split.png");
    }

    // N4: delete clip đã chọn — click clip B rồi phím Delete.
    {
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const clipB = g.clips.filter((c) => c.trackId === "v1")[1];
      if (!clipB) throw new Error("không tìm thấy clip B (N4)");
      await cdp.click(clipB.rect.cx, clipB.rect.cy);
      const sSel = await cdp.evalJs(STATE_FN);
      if (sSel.selection.length !== 1 || sSel.selection[0].clipId !== clipB.clipId) {
        fail("N4 delete clip đã chọn (phím Delete)", `click clip B không chọn đúng: selection=${JSON.stringify(sSel.selection)}`);
      } else {
        await cdp.key("Delete", "Delete");
        await sleep(600);
        const s = await cdp.evalJs(STATE_FN);
        if (s.videoClips.length === 1 && approx(s.videoClips[0].start, 0) && approx(s.videoClips[0].duration, 4)
          && s.textClips.length === 1 && !s.selection.some((x) => x.clipId === clipB.clipId)) {
          pass("N4 delete clip đã chọn (phím Delete)", `v1: 2 clip → 1 clip (chỉ còn clip A 0–4s); clip chữ còn nguyên`);
        } else {
          fail("N4 delete clip đã chọn (phím Delete)", `v1=${JSON.stringify(s.videoClips)}, selection=${JSON.stringify(s.selection)}`);
        }
      }
      await cdp.shot("n9-n4-delete.png");
    }

    // N5: box-select — kéo vùng trống bao cả 3 clip.
    {
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      if (!g.lanes || !g.videoLane || !g.textLane) throw new Error("không tìm thấy lanes/lane (N5)");
      // Điểm bắt đầu: vùng trống bên phải clip B (clip B kết thúc ở
      // lanes.left + 8s*60 = +480px); điểm kết thúc: góc trái lane chữ.
      const x0 = g.lanes.x + 520, y0 = g.videoLane.cy;
      const x1 = g.lanes.x + 10, y1 = g.textLane.cy;
      await cdp.drag(x0, y0, x1, y1);
      const s = await cdp.evalJs(STATE_FN);
      const boxVisible = await cdp.evalJs(`!!document.querySelector(".tl-boxselect")`);
      if (s.selection.length === 3 && !boxVisible) {
        pass("N5 box-select: kéo vùng trống bao 3 clip", `selection=3 clip (2 video + 1 chữ); hộp chọn đã biến mất sau thả`);
      } else {
        fail("N5 box-select: kéo vùng trống bao 3 clip", `selection=${JSON.stringify(s.selection)}, box còn hiện=${boxVisible}`);
      }
      await cdp.shot("n9-n5-boxselect.png");
    }

    // N6: undo/redo sau kéo clip — kéo clip chữ sang phải 1s rồi Ctrl+Z / Ctrl+Y.
    // Chẩn đoán kèm theo (lượt chạy 1: kéo clip chữ không nhúc nhích):
    // ghi hit-test tại điểm bắt đầu kéo + probe pointer events; nếu kéo
    // chữ thất bại thì thử lại chậm hơn, rồi kéo clip video B làm đối
    // chứng (phân biệt lỗi riêng clip chữ vs lỗi chung đường kéo body).
    {
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const clipT = g.clips.find((c) => c.trackId === "t1");
      if (!clipT) throw new Error("không tìm thấy clip chữ (N6)");
      const hit0 = await hitAt(cdp, clipT.rect.cx, clipT.rect.cy);
      log(`N6 hit-test tại tâm clip chữ: ${hit0}`);
      const probeMark = () => cdp.evalJs(`(window.__n9probe || []).length`);
      const probe0 = await probeMark();
      await cdp.drag(clipT.rect.cx, clipT.rect.cy, clipT.rect.cx + 60, clipT.rect.cy, 16);
      let sDrag = await cdp.evalJs(STATE_FN);
      let tDrag = sDrag.textClips[0];
      let dragDetail = `lần 1: start=${tDrag.start} undoDepth=${sDrag.undoDepth} hit=${hit0}`;
      if (!approx(tDrag.start, 1.5)) {
        // Thử lại chậm hơn (24 bước, 50ms/bước) rồi mới kết luận.
        log(`N6 kéo lần 1 không đổi (${dragDetail}) — thử lại chậm hơn`);
        await cdp.drag(clipT.rect.cx, clipT.rect.cy, clipT.rect.cx + 60, clipT.rect.cy, 24);
        await sleep(300);
        sDrag = await cdp.evalJs(STATE_FN);
        tDrag = sDrag.textClips[0];
        dragDetail += ` | lần 2: start=${tDrag.start} undoDepth=${sDrag.undoDepth}`;
      }
      const probeEvents = await cdp.evalJs(`(window.__n9probe || []).slice(${probe0}, ${probe0} + 40)`);
      dragDetail += ` | probe: ${JSON.stringify(probeEvents.slice(0, 4))}…(${(await cdp.evalJs(`(window.__n9probe || []).length`)) - probe0} event)`;
      if (!approx(tDrag.start, 1.5) || sDrag.undoDepth < 1) {
        // Đối chứng: kéo clip video B sang phải 1s (vùng trống 8–9s).
        const g2 = await cdp.evalJs(GEOM_FN);
        const clipB = g2.clips.filter((c) => c.trackId === "v1")[1];
        let ctrl = "không tìm thấy clip B";
        if (clipB) {
          await cdp.drag(clipB.rect.cx, clipB.rect.cy, clipB.rect.cx + 60, clipB.rect.cy, 16);
          const sCtrl = await cdp.evalJs(STATE_FN);
          ctrl = `kéo clip B video: start=${sCtrl.videoClips[1]?.start} (muốn 5), undoDepth=${sCtrl.undoDepth}`;
        }
        fail("N6 undo/redo sau kéo clip", `kéo clip chữ +1s không đúng: ${dragDetail} | đối chứng: ${ctrl}`);
      } else {
        await cdp.key("z", "KeyZ", 2); // Ctrl+Z
        await sleep(600);
        const sUndo = await cdp.evalJs(STATE_FN);
        const okUndo = approx(sUndo.textClips[0].start, 0.5) && sUndo.redoDepth >= 1;
        await cdp.key("y", "KeyY", 2); // Ctrl+Y = redo
        await sleep(600);
        const sRedo = await cdp.evalJs(STATE_FN);
        const okRedo = approx(sRedo.textClips[0].start, 1.5) && sRedo.undoDepth >= 1;
        if (okUndo && okRedo) {
          pass("N6 undo/redo sau kéo clip", `kéo chữ 0.5 → 1.5s (undoDepth=${sDrag.undoDepth}); Ctrl+Z → 0.5 (redoDepth=${sUndo.redoDepth}); Ctrl+Y → 1.5`);
        } else {
          fail("N6 undo/redo sau kéo clip", `sau kéo start=${tDrag.start}; sau Ctrl+Z start=${sUndo.textClips[0].start} redoDepth=${sUndo.redoDepth}; sau Ctrl+Y start=${sRedo.textClips[0].start} undoDepth=${sRedo.undoDepth}`);
        }
      }
      await cdp.shot("n9-n6-undoredo.png");
    }

    // N7: multiselect + delete — Shift+click clip A rồi clip B, Delete.
    {
      await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      const vs = g.clips.filter((c) => c.trackId === "v1");
      if (vs.length < 2) throw new Error("không đủ 2 clip video (N7)");
      await cdp.click(vs[0].rect.cx, vs[0].rect.cy);
      await cdp.click(vs[1].rect.cx, vs[1].rect.cy, 8); // Shift+click
      const sSel = await cdp.evalJs(STATE_FN);
      if (sSel.selection.length !== 2) {
        fail("N7 multiselect + delete", `Shift+click không chọn đủ 2 clip: selection=${JSON.stringify(sSel.selection)}`);
      } else {
        await cdp.key("Delete", "Delete");
        await sleep(600);
        const s = await cdp.evalJs(STATE_FN);
        if (s.videoClips.length === 0 && s.textClips.length === 1 && s.clipCount === 1) {
          pass("N7 multiselect + delete", `chọn 2 clip video → Delete → v1 còn 0 clip; clip chữ còn nguyên`);
        } else {
          fail("N7 multiselect + delete", `v1=${JSON.stringify(s.videoClips)}, t1=${JSON.stringify(s.textClips)}`);
        }
      }
      await cdp.shot("n9-n7-multiselect-delete.png");
    }

    // N8: split rồi undo — split ở 6s, Ctrl+Z khôi phục 2 clip.
    // Bọc retry 1 lần khi trang bị reload giữa chừng do file luồng khác
    // đổi (HMR/full-reload) — lượt chạy 2 fail đúng kiểu này (v1=[] do
    // reload khôi phục autosave). Xem LIMITS §4.
    async function caseN8(cdp) {
      const { boot } = await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      if (!g.ruler) throw new Error("không tìm thấy ruler (N8)");
      const pps = (await cdp.evalJs(STATE_FN)).pxPerSec;
      await cdp.click(g.ruler.x + 6 * pps, g.ruler.cy);
      await cdp.key("s", "KeyS");
      await sleep(600);
      if (!(await bootOk(cdp, boot))) return "reloaded";
      const sSplit = await cdp.evalJs(STATE_FN);
      if (sSplit.videoClips.length !== 3) {
        fail("N8 split rồi undo", `split không ra 3 clip: v1=${JSON.stringify(sSplit.videoClips)}`);
      } else {
        await cdp.key("z", "KeyZ", 2); // Ctrl+Z
        await sleep(600);
        if (!(await bootOk(cdp, boot))) return "reloaded";
        const s = await cdp.evalJs(STATE_FN);
        if (s.videoClips.length === 2 && approx(s.videoClips[0].start, 0) && approx(s.videoClips[0].duration, 4)
          && approx(s.videoClips[1].start, 4) && s.redoDepth >= 1) {
          pass("N8 split rồi undo", `split 2→3 clip rồi Ctrl+Z → 2 clip [0–4, 4–8], redoDepth=${s.redoDepth}`);
        } else {
          fail("N8 split rồi undo", `sau Ctrl+Z v1=${JSON.stringify(s.videoClips)}, redoDepth=${s.redoDepth}`);
        }
      }
      await cdp.shot("n9-n8-split-undo.png");
      return "done";
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      const r = await caseN8(cdp);
      if (r !== "reloaded") break;
      log(`N8: trang bị reload giữa chừng (lần ${attempt}) — chạy lại`);
      if (attempt === 2) fail("N8 split rồi undo", "trang bị reload 2 lần liên tiếp do file luồng khác đổi (xem n9-vite.log) — không kết luận được về sản phẩm");
    }

    // N9: split tại playhead 2s tách clip TRÊN CÙNG (clip chữ t1),
    // không tách clip video — hành vi có chủ đích của splitAtPlayhead
    // (duyệt track từ cuối lên: track trên cùng chứa playhead thắng).
    // Bọc retry 1 lần khi trang bị reload giữa chừng (như N8).
    async function caseN9(cdp) {
      const { boot } = await resetProject(cdp);
      await ensureNoModal(cdp);
      const g = await cdp.evalJs(GEOM_FN);
      if (!g.ruler) throw new Error("không tìm thấy ruler (N9)");
      const pps = (await cdp.evalJs(STATE_FN)).pxPerSec;
      await cdp.click(g.ruler.x + 2 * pps, g.ruler.cy);
      const sPre = await cdp.evalJs(STATE_FN);
      if (!approx(sPre.playhead, 2)) {
        fail("N9 split ở 2s tách clip trên cùng (chữ)", `click ruler không đặt được playhead: playhead=${sPre.playhead}`);
        return "done";
      }
      await cdp.key("s", "KeyS");
      await sleep(600);
      if (!(await bootOk(cdp, boot))) return "reloaded";
      const s = await cdp.evalJs(STATE_FN);
      const ts = s.textClips;
      if (ts.length === 2 && approx(ts[0].start, 0.5) && approx(ts[0].duration, 1.5)
        && approx(ts[1].start, 2) && approx(ts[1].duration, 3.5)
        && s.videoClips.length === 2) {
        pass("N9 split ở 2s tách clip trên cùng (chữ)", `t1: 1 clip → 2 clip [0.5–2, 2–5.5]; v1 nguyên vẹn 2 clip [0–4, 4–8]`);
      } else {
        fail("N9 split ở 2s tách clip trên cùng (chữ)", `t1=${JSON.stringify(ts)}, v1=${JSON.stringify(s.videoClips)}`);
      }
      await cdp.shot("n9-n9-split-topmost.png");
      return "done";
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      const r = await caseN9(cdp);
      if (r !== "reloaded") break;
      log(`N9: trang bị reload giữa chừng (lần ${attempt}) — chạy lại`);
      if (attempt === 2) fail("N9 split ở 2s tách clip trên cùng (chữ)", "trang bị reload 2 lần liên tiếp do file luồng khác đổi (xem n9-vite.log) — không kết luận được về sản phẩm");
    }
    // H9: 0 lỗi trang trong phiên.
    const errs = (await cdp.evalJs(`(window.__n9errors || []).slice()`)) || [];
    if (errs.length === 0) pass("H9 0 lỗi trang", "không có window.onerror/unhandledrejection trong phiên");
    else fail("H9 0 lỗi trang", errs.slice(0, 5).join(" || "));

    const nPass = results.filter((r) => r.ok).length;
    writeFileEpermRetry(path.join(SCRATCH, "n9-headed-report.json"), JSON.stringify({ cases: results, pass: nPass, total: results.length }, null, 2));
    log(`KẾT QUẢ HEADED N9: ${nPass}/${results.length} pass`);
    process.exitCode = nPass === results.length ? 0 : 1;
  } catch (e) {
    log(`HARNESS LỖI: ${e && e.message ? e.message : e}`);
    process.exitCode = 2;
  } finally {
    killAll();
  }
}

main();
