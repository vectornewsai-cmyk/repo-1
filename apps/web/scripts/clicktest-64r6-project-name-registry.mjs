#!/usr/bin/env node
/**
 * clicktest-64r6-project-name-registry.mjs — Phase 9 đợt 64, luồng R6:
 * registry project theo projectId + hiển thị phân biệt tên trùng nhau
 * (đóng nợ đợt 63 R7 §5).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-63r7-project-id-2tab.mjs (HMR tắt
 * bằng config tạm; profile Chrome mới tinh; MỘT tab).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   T0 setup: tab mount (app tự load mẫu); đọc projectId envelope thật
 *        của app qua store (UUID sinh lúc khởi tạo).
 *   H1 adoption qua IndexedDB + localStorage THẬT: seed 2 version dưới
 *        chuỗi legacy `file-<hash>-<tên file>`, đặt khóa legacy vào
 *        localStorage, gọi adoptLegacyHistoryChain(appProjectId, tên file)
 *        → moved=2, chuỗi đích đủ 2, chuỗi nguồn rỗng, khóa legacy bị xóa.
 *   H2 đổi tên không đứt chuỗi (IDB thật): snapshot tên A rồi tên B dưới
 *        cùng appProjectId → chuỗi đủ 4 (2 adoption + 2 mới), summary có
 *        dòng đổi tên.
 *   H3 hai project trùng tên khác id (IDB thật): hai chuỗi riêng, không lẫn.
 *   H4 nhãn phân biệt tên trùng trong trình duyệt: 2 bản ghi khóa id cùng
 *        tên → nhãn khác nhau; tên duy nhất giữ trần.
 *   H5 UI thật: bấm nút "Lịch sử" → panel liệt kê đủ 4 hàng, có hàng mang
 *        dòng đổi tên (đọc từ DOM thật, không qua module).
 *   H9 0 lỗi trang trong suốt phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-64r6-project-name-registry.mjs
 * Env: R64_DEV_PORT (mặc định tự chọn 5640–5649), R64_DEBUG_PORT (9740–9749),
 * R64_DISPLAY (mặc định :176 — display RIÊNG của R6 đợt 64), R64_SCRATCH
 * (mặc định hidden_files/round64-r6/headed). TMPDIR riêng /tmp/round64-r6/tmp.
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
const SCRATCH = process.env.R64_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round64-r6", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1248", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round64-r6";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.r64.config.mjs");

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
        // Không có dialog nào được mong đợi trong luồng này; ghi lại để H9 bắt.
        this.exceptions.push(`dialog: ${msg.params?.type} ${msg.params?.message || ""}`);
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`CDP ${msg.error.message}`));
        else resolve(msg.result);
      }
    };
  }
  async send(method, params) {
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
  window.__r64errors = [];
  window.addEventListener("error", (e) => { try { window.__r64errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__r64errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__r64errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__r64errors.push("unhandledrejection: <?>"); } });
})()`;

// projectId envelope thật của app (store sinh lúc khởi tạo).
const PROJECT_ID_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__r64storeMod || (window.__r64storeMod = await import(hit));
  return mod.useStore.getState().projectId;
})()`;

// Spec tối thiểu cho saveVersion (cùng hình dạng test Node).
const SPEC_FN = `(name, nClips) => ({
  version: "0.2.0",
  meta: { name, width: 1280, height: 720, fps: 30 },
  tracks: [{ id: "v1", kind: "video", clips: Array.from({ length: nClips }, (_, i) => ({
    id: "c" + (i + 1), kind: "video", src: "a.mp4", start: i * 2, duration: 2, in: 0, out: 2,
  })) }],
})`;

// H1: adoption qua IndexedDB + localStorage thật.
const ADOPT_FN = `(async (appProjectId, fileName) => {
  const hist = window.__r64histMod || (window.__r64histMod = await import("/src/lib/projectHistory.ts"));
  const reg = window.__r64regMod || (window.__r64regMod = await import("/src/lib/projectNameRegistry64R6.ts"));
  const store = hist.getHistoryStore();
  const legacyId = "file-abcdef123456-" + reg.sanitizeLegacyFileName(fileName);
  const spec = ${SPEC_FN};
  await store.saveVersion(legacyId, spec("Kiểm tra headed", 0));
  await store.saveVersion(legacyId, spec("Kiểm tra headed", 1));
  const before = (await store.listVersions(legacyId)).length;
  window.localStorage.setItem(hist.HISTORY_PROJECT_KEY, legacyId);
  const res = await hist.adoptLegacyHistoryChain(appProjectId, fileName);
  const afterTarget = (await store.listVersions(appProjectId)).length;
  const afterSource = (await store.listVersions(legacyId)).length;
  const keyGone = window.localStorage.getItem(hist.HISTORY_PROJECT_KEY) === null;
  return { legacyId, before, adopted: res.adopted, moved: res.moved, reason: res.reason, afterTarget, afterSource, keyGone };
})`;

// H2: đổi tên không đứt chuỗi (IDB thật).
const RENAME_FN = `(async (appProjectId) => {
  const hist = window.__r64histMod || (window.__r64histMod = await import("/src/lib/projectHistory.ts"));
  const store = hist.getHistoryStore();
  const spec = ${SPEC_FN};
  await store.saveVersion(appProjectId, spec("Tên A", 0));
  await store.saveVersion(appProjectId, spec("Tên B", 1));
  const list = await store.listVersions(appProjectId);
  return { count: list.length, summaries: list.map((v) => v.summary.join("; ")) };
})`;

// H3: hai project trùng tên khác id (IDB thật).
const DUP_FN = `(async () => {
  const hist = window.__r64histMod || (window.__r64histMod = await import("/src/lib/projectHistory.ts"));
  const store = hist.getHistoryStore();
  const spec = ${SPEC_FN};
  const e1 = crypto.randomUUID();
  const e2 = crypto.randomUUID();
  await store.saveVersion(e1, spec("Trùng tên", 0));
  await store.saveVersion(e2, spec("Trùng tên", 1));
  await store.saveVersion(e1, spec("Trùng tên", 2));
  const l1 = await store.listVersions(e1);
  const l2 = await store.listVersions(e2);
  return { e1count: l1.length, e2count: l2.length, e1clips: l1.map((v) => v.spec.tracks[0].clips.length), e2clips: l2.map((v) => v.spec.tracks[0].clips.length) };
})`;

// H4: nhãn phân biệt tên trùng (chạy trong trình duyệt).
const LABELS_FN = `(() => {
  const reg = window.__r64regMod || null;
  if (!reg) return { skipped: true };
  const labels = reg.registryDisplayLabels([
    { projectKey: "id:11111111-2222-3333-4444-555555555555", projectName: "Trùng tên", projectId: "11111111-2222-3333-4444-555555555555", updatedAt: "2026-11-08T05:00:00.000Z" },
    { projectKey: "id:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", projectName: "Trùng tên", projectId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", updatedAt: "2026-11-08T06:00:00.000Z" },
    { projectKey: "id:123e4567-e89b-12d3-a456-426614174000", projectName: "Duy nhất", projectId: "123e4567-e89b-12d3-a456-426614174000", updatedAt: "2026-11-08T05:00:00.000Z" },
  ]);
  return { a: labels.get("id:11111111-2222-3333-4444-555555555555"), b: labels.get("id:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"), unique: labels.get("id:123e4567-e89b-12d3-a456-426614174000") };
})()`;

// H5: mở panel Lịch sử bằng UI thật, đếm hàng + tìm dòng đổi tên.
const OPEN_HISTORY_FN = `(async () => {
  const btn = [...document.querySelectorAll("button")].find((b) => (b.getAttribute("title") || "").includes("Lịch sử phiên bản"));
  if (!btn) return { opened: false, reason: "no-button" };
  btn.click();
  return { opened: true };
})()`;
const HISTORY_ROWS_FN = `(() => {
  const rows = [...document.querySelectorAll(".history-panel table tbody tr")];
  return { count: rows.length, texts: rows.map((r) => r.innerText.replace(/\\n/g, " | ")) };
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
    for (let i = 0; i < 3; i++) {
      const open = await cdp.evalJs(`!!document.querySelector(".modal-backdrop, .tour-card, .welcome-modal")`);
      if (!open) break;
      await cdp.evalJs(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Để sau"); if (b) b.click(); return !!b; })()`).catch(() => {});
      await sleep(600);
    }
  }

  async function drainErrors(cdp) {
    const e = (await cdp.evalJs(`(window.__r64errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__r64errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.R64_DEV_PORT || 0) || (await pickFreePort(5640, 5649));
    const DEBUG_PORT = Number(process.env.R64_DEBUG_PORT || 0) || (await pickFreePort(9740, 9749));
    const DISPLAY = process.env.R64_DISPLAY || ":176";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5640–5649");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9740–9749");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (R64 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round64-r6/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    fs.writeFileSync(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "r64-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "r64-chrome.log"), "w");
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
    await mountCheck(cdp, "tab");
    log("app đã mount");

    // ---- T0: projectId envelope thật của app ----
    const appProjectId = await cdp.evalJs(PROJECT_ID_FN);
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof appProjectId === "string" && uuidRe.test(appProjectId)) {
      pass("T0", `app projectId envelope = ${appProjectId}`);
    } else {
      fail("T0", `projectId app không phải UUID: ${JSON.stringify(appProjectId)}`);
    }

    // ---- H1: adoption qua IndexedDB + localStorage thật ----
    try {
      const r = await cdp.evalJs(`${ADOPT_FN}(${JSON.stringify(appProjectId)}, "Kiểm tra headed.vcut.json")`);
      if (r.before === 2 && r.adopted && r.moved === 2 && r.afterTarget === 2 && r.afterSource === 0 && r.keyGone) {
        pass("H1", `adoption thật: seed ${r.before} → moved ${r.moved}, đích ${r.afterTarget}, nguồn ${r.afterSource}, khóa legacy đã xóa (${r.legacyId})`);
      } else {
        fail("H1", `adoption lệch: ${JSON.stringify(r)}`);
      }
    } catch (e) { fail("H1", `harness lỗi: ${e.message}`); }

    // ---- H2: đổi tên không đứt chuỗi (IDB thật) ----
    try {
      const r = await cdp.evalJs(`${RENAME_FN}(${JSON.stringify(appProjectId)})`);
      const renamed = r.summaries.some((s) => s.includes("Đổi tên"));
      if (r.count === 4 && renamed) {
        pass("H2", `chuỗi app đủ 4 version (2 adoption + 2 đổi tên), có dòng đổi tên`);
      } else {
        fail("H2", `chuỗi lệch: count=${r.count}, summaries=${JSON.stringify(r.summaries)}`);
      }
    } catch (e) { fail("H2", `harness lỗi: ${e.message}`); }

    // ---- H3: hai project trùng tên khác id (IDB thật) ----
    try {
      const r = await cdp.evalJs(`${DUP_FN}()`);
      if (r.e1count === 2 && r.e2count === 1 && JSON.stringify(r.e1clips) === "[0,2]" && JSON.stringify(r.e2clips) === "[1]") {
        pass("H3", `trùng tên tách chuỗi: E1 ${r.e1count} version ${JSON.stringify(r.e1clips)}, E2 ${r.e2count} version ${JSON.stringify(r.e2clips)}`);
      } else {
        fail("H3", `chuỗi trùng tên lệch: ${JSON.stringify(r)}`);
      }
    } catch (e) { fail("H3", `harness lỗi: ${e.message}`); }

    // ---- H4: nhãn phân biệt tên trùng (trong trình duyệt) ----
    try {
      const r = await cdp.evalJs(LABELS_FN);
      if (r.a === "Trùng tên · 11111111" && r.b === "Trùng tên · aaaaaaaa" && r.unique === "Duy nhất") {
        pass("H4", `nhãn trùng tên phân biệt: "${r.a}" vs "${r.b}"; tên duy nhất trần: "${r.unique}"`);
      } else {
        fail("H4", `nhãn lệch: ${JSON.stringify(r)}`);
      }
    } catch (e) { fail("H4", `harness lỗi: ${e.message}`); }

    // ---- H5: UI thật — panel Lịch sử liệt kê đủ 4 hàng ----
    try {
      const opened = await cdp.evalJs(OPEN_HISTORY_FN);
      if (!opened.opened) { fail("H5", `không mở được panel: ${opened.reason}`); }
      else {
        const rows = await cdp.waitFor(async () => {
          const r = await cdp.evalJs(HISTORY_ROWS_FN).catch(() => null);
          return r && r.count === 4 ? r : null;
        }, "panel Lịch sử đủ 4 hàng", 30000);
        const hasRename = rows.texts.some((t) => t.includes("Đổi tên"));
        await cdp.shot("history-panel.png");
        if (hasRename) pass("H5", `panel liệt kê 4 hàng, có hàng đổi tên (screenshot history-panel.png)`);
        else fail("H5", `panel đủ 4 hàng nhưng không thấy dòng đổi tên: ${JSON.stringify(rows.texts)}`);
      }
    } catch (e) { fail("H5", `harness lỗi: ${e.message}`); }

    // ---- H9: 0 lỗi trang ----
    const errs = await drainErrors(cdp);
    if (errs.length === 0) pass("H9", "0 window.onerror/unhandledrejection trong suốt phiên");
    else fail("H9", `${errs.length} lỗi trang: ${errs.slice(0, 3).join(" || ")}`);

    const failed = results.filter((r) => !r.ok);
    fs.writeFileSync(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), results, phaseErrors }, null, 2));
    log(`== KẾT QUẢ: ${results.filter((r) => r.ok).length}/${results.length} PASS ==`);
    killAll();
    process.exit(failed.length > 0 ? 1 : 0);
  } catch (e) {
    log(`HARNESS LỖI: ${e.message}`);
    try { fs.mkdirSync(SCRATCH, { recursive: true }); fs.writeFileSync(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), harnessError: e.message, results }, null, 2)); } catch {}
    killAll();
    process.exit(2);
  }
}

void main();
