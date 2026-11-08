#!/usr/bin/env node
/**
 * clicktest-63r7-project-id-2tab.mjs — Phase 9 đợt 63, luồng R7: đo tranh
 * chấp lock THẬT giữa 2 tab trình duyệt + khóa sổ theo projectId (đóng nợ
 * đợt 62 R7 §6.2/§6.3/§6.4).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-62r7-idb-xproject.mjs (HMR tắt bằng
 * config tạm; profile Chrome mới tinh; HAI tab cùng origin, chung
 * IndexedDB/localStorage).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   T0 setup: tab A mount (mẫu tự load 3 clip + bin 2 item); tạo tab B
 *        cùng origin, mount xong. Hai tab đều có projectId riêng (store
 *        sinh lúc khởi tạo) nên effect App của mỗi tab ghi sổ riêng.
 *   T1 tranh chấp lock thô: tab A giữ lock `vcut-projrefs` 3000ms qua
 *        navigator.locks.request; tab B xin cùng lock và đo thời gian
 *        chờ → phải bị chặn/đợi ~3000ms (không chạy song song), rồi
 *        vẫn nhận được lock (không kẹt).
 *   T2 ghi sổ thật chờ lock: tab A giữ lock 3000ms; tab B ghi sổ qua
 *        AssetStore thật (import module từ vite dev, locks =
 *        navigator.locks) → lần ghi phải chờ ~3000ms rồi mới thành
 *        công; đọc lại thấy bản ghi đúng tập + generation ≥ 1.
 *   T3 stale liên tab (OCC thật): tab B đọc generation của bản ghi
 *        test (gen 1); tab A ghi đè bằng generation đó (gen → 2);
 *        tab B ghi bằng generation cũ (1) → phải bị từ chối stale,
 *        bản ghi giữ tập của tab A, generation không tăng thêm.
 *   T4 trùng tên không ghi đè (headed): tab B ghi 2 bản ghi cùng tên
 *        "Dự án trùng tên" nhưng khác id → tab A đọc IDB thấy đủ cả
 *        hai, mỗi bản ghi giữ đúng tập của mình.
 *   H9 0 lỗi trang trong cả hai tab.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-63r7-project-id-2tab.mjs
 * Env: R63_DEV_PORT (mặc định tự chọn 5630–5639), R63_DEBUG_PORT (9730–9739),
 * R63_DISPLAY (mặc định :175 — display RIÊNG của R7 đợt 63), R63_SCRATCH
 * (mặc định hidden_files/round63-r7/headed). TMPDIR riêng /tmp/round63-r7/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const WEB_DIR = path.join(ROOT, "apps", "web");
const SCRATCH = process.env.R63_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round63-r7", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round63-r7";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r63.config.mjs");

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
  async waitFor(fn, label, timeoutMs = 120000) {
    const t0 = Date.now(); let last;
    while (Date.now() - t0 < timeoutMs) { last = await fn().catch(() => null); if (last) return last; await sleep(500); }
    throw new Error(`timeout chờ ${label} (last=${JSON.stringify(last)})`);
  }
  async shot(name) {
    const r = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__r63errors = [];
  window.addEventListener("error", (e) => { try { window.__r63errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r63errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r63errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r63errors.push("unhandledrejection: <?>"); } });
  window.__r63boot = Math.random().toString(36).slice(2);
})()`;

// projectId hiện tại của tab (store sinh lúc khởi tạo / khôi phục autosave).
const PROJECT_ID_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r63storeMod || (window.__r63storeMod = await import(hit));
  return mod.useStore.getState().projectId;
})()`;

// Đọc store projectRefs thật (không qua AssetStore — đo đúng sổ ghi gì),
// kèm projectId + generation (field mới đợt 63 R7).
const IDB_REFS_FN = `(async () => {
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open("vcut-studio-assets");
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error || new Error("open IDB thất bại"));
  });
  try {
    const refs = await new Promise((res, rej) => {
      const r = db.transaction(["projectRefs"], "readonly").objectStore("projectRefs").getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return refs.map((r) => ({ projectKey: r.projectKey, projectName: r.projectName, projectId: r.projectId ?? null, assetIds: r.assetIds, generation: r.generation ?? 0, updatedAt: r.updatedAt }));
  } finally { db.close(); }
})()`;

// Ghi sổ qua AssetStore THẬT (import module từ vite dev — cùng module
// graph với app; locks = navigator.locks thật của tab). Trả về kết quả
// ghi + thời gian gọi (đo chờ lock).
const RECORD_FN = `(async (projectKey, projectName, assetIds, opts) => {
  const mod = window.__r63assetMod || (window.__r63assetMod = await import("/src/lib/assetStore.ts"));
  const store = new mod.AssetStore({ locks: navigator.locks });
  const t0 = performance.now();
  const res = await store.recordProjectRefs(projectKey, projectName, assetIds, opts || undefined);
  const dtMs = performance.now() - t0;
  return { record: { projectKey: res.record.projectKey, projectName: res.record.projectName, projectId: res.record.projectId ?? null, assetIds: res.record.assetIds, generation: res.record.generation }, changed: res.changed, stale: res.stale, dtMs: Math.round(dtMs) };
})`;

// Giữ lock `vcut-projrefs` một khoảng thời gian (không await — trả ngay
// "holding", lock được giữ nền bởi promise trong window).
const HOLD_LOCK_FN = `(holdMs) => {
  window.__r63hold = navigator.locks.request("vcut-projrefs", () => new Promise((r) => setTimeout(r, holdMs)));
  return "holding";
}`;

// Xin lock `vcut-projrefs` và đo thời gian chờ (tab khác đang giữ thì
// request này phải xếp hàng, không chạy song song).
const WAIT_LOCK_FN = `(async () => {
  const t0 = performance.now();
  const v = await navigator.locks.request("vcut-projrefs", () => "ok");
  return { waitMs: Math.round(performance.now() - t0), v };
})()`;

async function main() {
  const results = [];
  const pass = (n, d) => { results.push({ name: n, ok: true, detail: d }); log(`PASS ${n} — ${d}`); };
  const fail = (n, d) => { results.push({ name: n, ok: false, detail: d }); log(`FAIL ${n} — ${d}`); };
  let vite = null, xvfb = null, chrome = null;
  const phaseErrors = [];

  const killAll = () => {
    try { chrome?.kill("SIGKILL"); } catch {}
    try { xvfb?.kill("SIGKILL"); } catch {}
    try { vite?.kill("SIGKILL"); } catch {}
  };
  process.on("exit", killAll);

  async function mountCheck(cdp, label) {
    await cdp.waitFor(async () => {
      const s = await cdp.evalJs(INJECT_ERRORS + ";(() => { const top = document.querySelector('header.topbar'); const splash = !!document.querySelector('.splash'); return top && top.innerText.includes('VCut Studio') && !splash ? true : null; })()").catch(() => null);
      return s;
    }, `app mount (${label})`, 240000);
    // Đóng modal chào nếu còn (bấm "Để sau" hoặc Escape).
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) break;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
    }
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r63errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r63errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.R63_DEV_PORT || 0) || (await pickFreePort(5630, 5639));
    const DEBUG_PORT = Number(process.env.R63_DEBUG_PORT || 0) || (await pickFreePort(9730, 9739));
    const DISPLAY = process.env.R63_DISPLAY || ":175";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5630–5639");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9730–9739");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (R63 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round63-r7/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r63-vite.log"), "w");
    vite = spawn(VITE_BIN, ["-c", VITE_CFG, "--port", String(DEV_PORT), "--strictPort", "--host", "127.0.0.1"],
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r63-chrome.log"), "w");
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
    const cdpA = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdpA.send("Page.enable");
    await cdpA.send("Runtime.enable");
    await cdpA.send("Page.navigate", { url: DEV_URL });
    await mountCheck(cdpA, "tab A");
    log("tab A đã mount");

    // ---- T0: tạo tab B cùng origin, mount xong ----
    let cdpB = null;
    {
      const created = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(DEV_URL)}`, { method: "PUT" });
      if (!created.ok) throw new Error(`tạo tab B thất bại: HTTP ${created.status}`);
      const targetB = await created.json();
      cdpB = new CDP(targetB.webSocketDebuggerUrl);
      await cdpB.send("Page.enable");
      await cdpB.send("Runtime.enable");
      await mountCheck(cdpB, "tab B");
      log("tab B đã mount");
    }
    const pidA = await cdpA.evalJs(PROJECT_ID_FN);
    const pidB = await cdpB.evalJs(PROJECT_ID_FN);
    const t0ok = typeof pidA === "string" && pidA.length > 0 && typeof pidB === "string" && pidB.length > 0 && pidA !== pidB;
    await drainErrors(cdpA); await drainErrors(cdpB);
    log(`T0: projectId tab A=${pidA}, tab B=${pidB}`);
    if (t0ok) {
      pass("T0 setup: 2 tab cùng origin mount xong, projectId riêng", `tab A projectId=${pidA}, tab B projectId=${pidB} (khác nhau — mỗi tab một project riêng)`);
    } else {
      fail("T0 setup: 2 tab cùng origin mount xong, projectId riêng", `pidA=${JSON.stringify(pidA)}, pidB=${JSON.stringify(pidB)}`);
    }

    // ---- T1: tab A giữ lock 3000ms, tab B xin lock → phải đợi ~3000ms ----
    {
      const hold = await cdpA.evalJs(`(${HOLD_LOCK_FN})(3000)`);
      await sleep(150); // chắc chắn lock đã được giữ trước khi B xin
      const w = await cdpB.evalJs(WAIT_LOCK_FN);
      await drainErrors(cdpA); await drainErrors(cdpB);
      log(`T1: hold=${hold}, tab B waitMs=${w.waitMs}, v=${w.v}`);
      if (w.v === "ok" && w.waitMs >= 2400 && w.waitMs < 6000) {
        pass("T1 tranh chấp lock thô: tab B bị chặn/đợi ~3000ms rồi nhận lock", `tab A giữ vcut-projrefs 3000ms; tab B chờ ${w.waitMs}ms mới nhận được lock (không chạy song song, không kẹt)`);
      } else {
        fail("T1 tranh chấp lock thô: tab B bị chặn/đợi ~3000ms rồi nhận lock", `waitMs=${w.waitMs} (muốn 2400–6000), v=${JSON.stringify(w.v)}`);
      }
    }

    // ---- T2: tab A giữ lock 3000ms, tab B ghi sổ thật qua AssetStore → ghi phải chờ ----
    const T2_ID = "123e4567-e89b-42d3-a456-426614174001";
    {
      const hold = await cdpA.evalJs(`(${HOLD_LOCK_FN})(3000)`);
      await sleep(150);
      const res = await cdpB.evalJs(`(${RECORD_FN})(${JSON.stringify(`id:${T2_ID}`)}, "Tab B", ${JSON.stringify(["a_t2"])}, ${JSON.stringify({ projectId: T2_ID })})`);
      const refs = await cdpB.evalJs(IDB_REFS_FN);
      const rec = refs.find((r) => r.projectKey === `id:${T2_ID}`);
      await drainErrors(cdpA); await drainErrors(cdpB);
      log(`T2: hold=${hold}, ghi dtMs=${res.dtMs}, changed=${res.changed}, stale=${res.stale}, rec=${JSON.stringify(rec)}`);
      if (!res.stale && res.changed && res.dtMs >= 2400 && res.dtMs < 6000
        && rec && rec.assetIds.join(",") === "a_t2" && rec.generation >= 1 && rec.projectId === T2_ID) {
        pass("T2 ghi sổ thật chờ lock: tab B đợi ~3000ms rồi ghi thành công", `lần ghi recordProjectRefs mất ${res.dtMs}ms (tab A giữ lock 3000ms); bản ghi id:${T2_ID} đúng tập [a_t2], generation=${rec.generation}, projectId persist đúng`);
      } else {
        fail("T2 ghi sổ thật chờ lock: tab B đợi ~3000ms rồi ghi thành công", `dtMs=${res.dtMs}, changed=${res.changed}, stale=${res.stale}, rec=${JSON.stringify(rec)}`);
      }
    }

    // ---- T3: stale liên tab — B đọc gen 1, A ghi lên gen 2, B ghi bằng gen 1 → stale ----
    const T3_ID = "123e4567-e89b-42d3-a456-426614174002";
    {
      const seed = await cdpB.evalJs(`(${RECORD_FN})(${JSON.stringify(`id:${T3_ID}`)}, "Dự án T3", ${JSON.stringify(["a_seed"])}, ${JSON.stringify({ projectId: T3_ID })})`);
      const genBefore = seed.record.generation;
      const winA = await cdpA.evalJs(`(${RECORD_FN})(${JSON.stringify(`id:${T3_ID}`)}, "Dự án T3", ${JSON.stringify(["a_tabA"])}, ${JSON.stringify({ projectId: T3_ID, expectedGeneration: genBefore })})`);
      const loseB = await cdpB.evalJs(`(${RECORD_FN})(${JSON.stringify(`id:${T3_ID}`)}, "Dự án T3", ${JSON.stringify(["a_tabB"])}, ${JSON.stringify({ projectId: T3_ID, expectedGeneration: genBefore })})`);
      const refs = await cdpA.evalJs(IDB_REFS_FN);
      const rec = refs.find((r) => r.projectKey === `id:${T3_ID}`);
      await drainErrors(cdpA); await drainErrors(cdpB);
      log(`T3: seed gen=${genBefore}, A win changed=${winA.changed} stale=${winA.stale} gen=${winA.record.generation}, B lose changed=${loseB.changed} stale=${loseB.stale}, rec=${JSON.stringify(rec)}`);
      if (genBefore === 1 && !winA.stale && winA.changed && winA.record.generation === 2
        && loseB.stale && !loseB.changed
        && rec && rec.assetIds.join(",") === "a_tabA" && rec.generation === 2) {
        pass("T3 stale liên tab: lượt sync cũ bị từ chối, dữ liệu mới giữ nguyên", `B đọc gen 1; A ghi gen 1→2 tập [a_tabA]; B ghi bằng gen 1 → stale=true; bản ghi cuối tập [a_tabA], generation=2 (không tăng thêm, không bị [a_tabB] ghi đè)`);
      } else {
        fail("T3 stale liên tab: lượt sync cũ bị từ chối, dữ liệu mới giữ nguyên", `seed gen=${genBefore}, winA=${JSON.stringify(winA)}, loseB=${JSON.stringify(loseB)}, rec=${JSON.stringify(rec)}`);
      }
    }

    // ---- T4: hai file trùng tên khác id — tab B ghi, tab A đọc thấy đủ cả hai ----
    {
      const idX = "123e4567-e89b-42d3-a456-426614174003";
      const idY = "123e4567-e89b-42d3-a456-426614174004";
      await cdpB.evalJs(`(${RECORD_FN})(${JSON.stringify(`id:${idX}`)}, "Dự án trùng tên", ${JSON.stringify(["a_x1", "a_x2"])}, ${JSON.stringify({ projectId: idX })})`);
      await cdpB.evalJs(`(${RECORD_FN})(${JSON.stringify(`id:${idY}`)}, "Dự án trùng tên", ${JSON.stringify(["a_y1"])}, ${JSON.stringify({ projectId: idY })})`);
      const refs = await cdpA.evalJs(IDB_REFS_FN);
      const recX = refs.find((r) => r.projectKey === `id:${idX}`);
      const recY = refs.find((r) => r.projectKey === `id:${idY}`);
      await drainErrors(cdpA); await drainErrors(cdpB);
      log(`T4: recX=${JSON.stringify(recX)}, recY=${JSON.stringify(recY)}`);
      if (recX && recY && recX.assetIds.join(",") === "a_x1,a_x2" && recY.assetIds.join(",") === "a_y1"
        && recX.projectName === "Dự án trùng tên" && recY.projectName === "Dự án trùng tên") {
        pass("T4 trùng tên không ghi đè (headed, 2 tab thấy cùng sổ)", `tab B ghi 2 bản ghi cùng tên "Dự án trùng tên" khác id; tab A đọc IDB thấy đủ cả hai: X=[a_x1,a_x2], Y=[a_y1]`);
      } else {
        fail("T4 trùng tên không ghi đè (headed, 2 tab thấy cùng sổ)", `recX=${JSON.stringify(recX)}, recY=${JSON.stringify(recY)}`);
      }
      await cdpB.shot("r63-t4-two-tabs-registry.png");
    }

    // ---- H9: 0 lỗi trang cả hai tab ----
    {
      await drainErrors(cdpA); await drainErrors(cdpB);
      if (phaseErrors.length === 0) {
        pass("H9 0 lỗi trang (cả hai tab)", "không có window.onerror/unhandledrejection trong suốt phiên 2 tab");
      } else {
        fail("H9 0 lỗi trang (cả hai tab)", `lỗi: ${JSON.stringify(phaseErrors.slice(0, 5))}`);
      }
    }
  } catch (e) {
    const msg = `HARNESS LỖI: ${(e && e.message) || String(e)}`;
    log(msg);
    results.push({ name: "harness", ok: false, detail: msg });
    try {
      fs.mkdirSync(SCRATCH, { recursive: true });
      fs.writeFileSync(path.join(SCRATCH, "r63-report.json"), JSON.stringify({ ok: false, error: msg, results, log: logLines }, null, 2));
    } catch {
      // SCRATCH không ghi được thì chỉ còn log console
    }
    killAll();
    process.exit(2);
  }
  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(path.join(SCRATCH, "r63-report.json"), JSON.stringify({ ok: failed.length === 0, results, log: logLines }, null, 2));
  log(`== KẾT QUẢ: ${results.length - failed.length}/${results.length} PASS ==`);
  killAll();
  process.exit(failed.length === 0 ? 0 : 1);
}

void main();
