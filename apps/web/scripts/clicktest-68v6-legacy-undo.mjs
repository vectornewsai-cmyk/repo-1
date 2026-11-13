#!/usr/bin/env node
/**
 * clicktest-68v6-legacy-undo.mjs — Phase 9 đợt 68, luồng V6:
 * STACK HOÀN TÁC NHIỀU MỨC cho nhận legacy thủ công (đóng nợ đợt 67
 * U6 §5.2: hoàn tác chỉ một mức, nhận lần 2 ghi đè bản ghi lần 1).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-67u6-legacy-reopen.mjs
 * (HMR tắt bằng config tạm; profile Chrome mới tinh; MỘT tab).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   V0 setup: tab mount; đọc projectId envelope thật của app qua store.
 *   V1 seed (trong trang, module thật): spec hiện tại A (2 clip) ghi
 *        autosave; 3 chuỗi mơ hồ cùng tên (hash lệch so với A): mảnh B
 *        (spec B, 1 version), mảnh D (spec D1+D2, 2 version), con trỏ
 *        C (spec C, 1 version, khóa legacy trỏ tới).
 *   V2 nhận từng mảnh (UI thật, có xác nhận lần 2): nhận B → banner
 *        depth=1; nhận D → depth=2; nhận C (con trỏ) → depth=3; sau
 *        mỗi lần nhận kiểm tra envelope có đúng hash + chuỗi nguồn
 *        rỗng + khóa con trỏ đã dọn sau khi nhận C.
 *   V3 hoàn tác từng mức (UI thật, LIFO): undo 1 → chuỗi C (nhận
 *        sau cùng) về lại modal trước, depth=2, envelope mất hashC,
 *        khóa con trỏ khôi phục về C; undo 2 → chuỗi D về, depth=1,
 *        envelope mất hashD; undo 3 → chuỗi B về, depth=0, banner
 *        biến mất, envelope sạch.
 *   V4 nhận TẤT CẢ (UI thật) rồi hoàn tác ngược: bấm "Nhận tất cả" →
 *        xác nhận → depth=3, modal hết mục; undo 3 lần → C về trước
 *        rồi D rồi B, envelope sạch sau mức cuối, banner biến mất.
 *   V5 nút Ẩn dọn cả stack: nhận B → depth=1; bấm Ẩn → banner + nút
 *        Hoàn tác biến mất (stack đã dọn), modal vẫn hiện 2 mục chờ.
 *   V6 0 lỗi trang trong suốt phiên.
 *
 * LƯU Ý i18n (như U6): key `legacyAdopt.*` mới nằm trong fragment riêng
 * `apps/web/src/i18n/fragments/round68-v6.json`, parent gộp vào dict sau
 * — trước lúc gộp, `t()` trả về đúng key nên test chỉ assert cấu trúc/
 * dữ liệu qua data-testid + thuộc tính data-depth trên banner, KHÔNG
 * assert chuỗi dịch. Chuỗi dịch đã kiểm bằng node.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-68v6-legacy-undo.mjs
 * Env: V6_DEV_PORT (mặc định tự chọn 5670–5679), V6_DEBUG_PORT (9770–9779),
 * V6_DISPLAY (mặc định :179 — display RIÊNG của V6 đợt 68), V6_SCRATCH
 * (mặc định hidden_files/round68-v6/headed). TMPDIR riêng /tmp/round68-v6/tmp.
 * Exit 0 mọi case PASS, 1 có FAIL, 2 harness lỗi. KHÔNG push/tag/binary.
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
const SCRATCH = process.env.V6_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round68-v6", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round68-v6";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.v6.config.mjs");

const logLines = [];
function log(...a) { const l = `[${new Date().toISOString()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }
function loadavg() {
  try { return fs.readFileSync("/proc/loadavg", "utf8").trim(); } catch { return "n/a"; }
}

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
        this.send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
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
    writeFileEpermRetry(path.join(SCRATCH, name), Buffer.from(r.data, "base64"));
    return name;
  }
}

const INJECT_ERRORS = `(() => {
  window.__v6errors = [];
  window.addEventListener("error", (e) => { try { window.__v6errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__v6errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__v6errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__v6errors.push("unhandledrejection: <?>"); } });
})()`;

// projectId envelope thật của app (store sinh lúc khởi tạo).
const PROJECT_ID_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__v6storeMod || (window.__v6storeMod = await import(hit));
  return mod.useStore.getState().projectId;
})()`;

// Spec tối thiểu cho saveVersion (cùng hình dạng test Node).
const SPEC_FN = `(name, nClips, tag) => ({
  version: "0.2.0",
  meta: { name, width: 1280, height: 720, fps: 30 },
  tracks: [{ id: "v1", kind: "video", clips: Array.from({ length: nClips }, (_, i) => ({
    id: tag + (i + 1), kind: "video", src: "a.mp4", start: i * 2, duration: 2, in: 0, out: 2,
  })) }],
})`;

// V1: seed autosave (spec A) + 3 chuỗi mơ hồ: mảnh B (1 version),
// mảnh D (2 version), con trỏ C (1 version, khóa legacy trỏ tới).
const SEED_FN = `(async (appProjectId) => {
  const hist = window.__v6histMod || (window.__v6histMod = await import("/src/lib/projectHistory.ts"));
  const reg = window.__v6regMod || (window.__v6regMod = await import("/src/lib/projectNameRegistry64R6.ts"));
  const repo = window.__v6repoMod || (window.__v6repoMod = await import("/src/lib/projectRepo.ts"));
  const store = hist.getHistoryStore();
  const spec = ${SPEC_FN};
  const name = "Kiểm tra headed";
  const specA = spec(name, 2, "a");
  const specB = spec(name, 1, "b");
  const specD1 = spec(name, 1, "d");
  const specD2 = spec(name, 2, "d");
  const specC = spec(name, 3, "c");
  const hashOf = async (s) => {
    const v = await store.saveVersion("tmp-probe-68v6", s);
    return v.hash;
  };
  const hashB = await hashOf(specB);
  const hashD = await hashOf(specD1);
  const hashC = await hashOf(specC);
  const san = reg.sanitizeLegacyFileName(name);
  const fragB = "file-" + hashB + "-" + san;
  const fragD = "file-" + hashD + "-" + san;
  const ptrC = "file-" + hashC + "-" + san;
  await store.saveVersion(fragB, specB);
  await store.saveVersion(fragD, specD1);
  await store.saveVersion(fragD, specD2);
  await store.saveVersion(ptrC, specC);
  window.localStorage.setItem(hist.HISTORY_PROJECT_KEY, ptrC);
  repo.autosaveNow(specA, name, undefined, undefined, appProjectId);
  return { fragB, fragD, ptrC, hashB, hashD, hashC, name };
})`;

// Đọc trạng thái modal + banner hoàn tác (depth qua data-depth).
const MODAL_STATE_FN = `(() => {
  const modal = document.querySelector('[data-testid="legacy-adopt-modal"]');
  if (!modal) return { shown: false, items: [], confirm: null, undoBanner: false, undoDepth: 0, undoText: "" };
  const items = [...modal.querySelectorAll('[data-testid="legacy-adopt-item"]')].map((el) => ({
    from: el.getAttribute("data-from"),
    text: el.innerText.replace(/\\n/g, " | ").slice(0, 400),
  }));
  const confirmEl = modal.querySelector('[data-testid="legacy-adopt-confirm"]');
  const confirm = confirmEl ? { from: confirmEl.getAttribute("data-from") } : null;
  const banner = modal.querySelector('[data-testid="legacy-adopt-last-adopt"]');
  const undoDepth = banner ? Number(banner.getAttribute("data-depth") || "0") : 0;
  const undoText = banner ? banner.innerText.replace(/\\n/g, " | ").slice(0, 300) : "";
  return { shown: true, items, confirm, undoBanner: !!banner, undoDepth, undoText };
})()`;

// Bấm Nhận / Bỏ qua trên một mục (theo data-from).
const CLICK_ITEM_FN = `((from, kind) => {
  const el = document.querySelector('[data-testid="legacy-adopt-item"][data-from="' + from + '"]');
  if (!el) return { clicked: false, reason: "no-item" };
  const btn = el.querySelector('[data-testid="legacy-adopt-' + kind + '"]');
  if (!btn) return { clicked: false, reason: "no-button" };
  btn.click();
  return { clicked: true };
})`;

// Bấm một nút theo data-testid (trong toàn trang).
const CLICK_TESTID_BODY = `(testid) => {
  const btn = document.querySelector('[data-testid="' + testid + '"]');
  if (!btn) return { clicked: false, reason: "no-button" };
  btn.click();
  return { clicked: true };
}`;
async function clickTestid(cdp, testid) {
  return cdp.evalJs(`(${CLICK_TESTID_BODY})(${JSON.stringify(testid)})`);
}

// Bấm nút "Nhận tất cả" (không có data-testid — tìm theo text; trước
// lúc gộp fragment thì text là key thô "legacyAdopt.adoptAll").
const CLICK_ADOPT_ALL_FN = `(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => {
    const t = (b.textContent || "").trim();
    return t.includes("adoptAll") || t.includes("Nhận tất cả");
  });
  if (!btn) return { clicked: false, reason: "no-button" };
  btn.click();
  return { clicked: true };
})()`;

// Kiểm tra 3 chuỗi trong IDB thật + khóa con trỏ + envelope.
const CHAINS_FN = `(async (appProjectId, fragB, fragD, ptrC, hashB, hashD, hashC) => {
  const hist = window.__v6histMod || (window.__v6histMod = await import("/src/lib/projectHistory.ts"));
  const store = hist.getHistoryStore();
  const b = await store.listVersions(fragB);
  const d = await store.listVersions(fragD);
  const c = await store.listVersions(ptrC);
  const env = await store.listVersions(appProjectId);
  return {
    bCount: b.length, dCount: d.length, cCount: c.length, envCount: env.length,
    envHasB: env.some((v) => v.hash === hashB),
    envHasD: env.some((v) => v.hash === hashD),
    envHasC: env.some((v) => v.hash === hashC),
    legacyKey: window.localStorage.getItem(hist.HISTORY_PROJECT_KEY),
  };
})`;

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
    const e = (await cdp.evalJs(`(window.__v6errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__v6errors = []`).catch(() => {});
    return e;
  }

  // Nhận một chuỗi qua UI thật (Nhận → Xác nhận lần 2) rồi chờ banner
  // depth như mong đợi + số mục còn lại như mong đợi.
  async function adoptOne(cdp, from, wantDepth, wantItems) {
    const clicked = await cdp.evalJs(`${CLICK_ITEM_FN}(${JSON.stringify(from)}, "accept")`);
    if (!clicked.clicked) throw new Error(`không bấm được nút Nhận ở ${from}: ${clicked.reason}`);
    const confirming = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
      return s && s.confirm && s.confirm.from === from ? s : null;
    }, `bảng xác nhận lần 2 hiện ở ${from}`, 30000);
    void confirming;
    const confirmed = await clickTestid(cdp, "legacy-adopt-confirm-accept");
    if (!confirmed.clicked) throw new Error(`không bấm được nút Xác nhận: ${confirmed.reason}`);
    const after = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
      return s && s.shown && s.undoBanner && s.undoDepth === wantDepth && s.items.length === wantItems ? s : null;
    }, `sau nhận ${from}: banner depth=${wantDepth}, modal còn ${wantItems} mục`, 30000);
    return after;
  }

  // Hoàn tác một mức qua UI thật rồi chờ banner depth + mục vừa về.
  async function undoOne(cdp, expectFromBack, wantDepth, wantItems) {
    const undone = await clickTestid(cdp, "legacy-adopt-undo");
    if (!undone.clicked) throw new Error(`không bấm được nút Hoàn tác: ${undone.reason}`);
    const after = await cdp.waitFor(async () => {
      const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
      if (!s || !s.shown) return null;
      if (wantDepth === 0) return !s.undoBanner && s.items.length === wantItems ? s : null;
      return s.undoBanner && s.undoDepth === wantDepth && s.items.length === wantItems && s.items.some((i) => i.from === expectFromBack) ? s : null;
    }, `sau hoàn tác: ${expectFromBack} về modal, depth=${wantDepth}, ${wantItems} mục`, 30000);
    return after;
  }

  try {
    const loadavgStart = loadavg();
    log(`loadavg lúc bắt đầu headed: ${loadavgStart}`);
    const DEV_PORT = Number(process.env.V6_DEV_PORT || 0) || (await pickFreePort(5670, 5679));
    const DEBUG_PORT = Number(process.env.V6_DEBUG_PORT || 0) || (await pickFreePort(9770, 9779));
    const DISPLAY = process.env.V6_DISPLAY || ":179";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5670–5679");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9770–9779");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (V6 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round68-v6/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "v6-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "v6-chrome.log"), "w");
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

    // ---- V0: projectId envelope thật của app ----
    const appProjectId = await cdp.evalJs(PROJECT_ID_FN);
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof appProjectId === "string" && uuidRe.test(appProjectId)) {
      pass("V0", `app projectId envelope = ${appProjectId}`);
    } else {
      fail("V0", `projectId app không phải UUID: ${JSON.stringify(appProjectId)}`);
    }

    // ---- V1: seed autosave + 3 chuỗi mơ hồ ----
    let seed;
    try {
      seed = await cdp.evalJs(`${SEED_FN}(${JSON.stringify(appProjectId)})`);
      if (seed.fragB && seed.fragD && seed.ptrC && seed.fragB !== seed.fragD && seed.fragB !== seed.ptrC && seed.fragD !== seed.ptrC) {
        pass("V1", `seed: mảnh B ${seed.fragB} (1 version, hashB ${seed.hashB}), mảnh D ${seed.fragD} (2 version, hashD ${seed.hashD}), con trỏ C ${seed.ptrC} (hashC ${seed.hashC}), autosave spec A 2 clip`);
      } else {
        fail("V1", `seed lệch: ${JSON.stringify(seed)}`);
      }
    } catch (e) { fail("V1", `harness lỗi: ${e.message}`); }

    const chains = async () => cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragB)}, ${JSON.stringify(seed.fragD)}, ${JSON.stringify(seed.ptrC)}, ${JSON.stringify(seed.hashB)}, ${JSON.stringify(seed.hashD)}, ${JSON.stringify(seed.hashC)})`);

    // ---- V2: nhận từng mảnh — banner depth tăng 1 → 2 → 3 ----
    try {
      await cdp.send("Page.navigate", { url: DEV_URL });
      await mountCheck(cdp, "tab sau reload");
      const state = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
        return s && s.shown && s.items.length === 3 ? s : null;
      }, "modal nhận thủ công hiện 3 mục", 60000);
      void state;
      await adoptOne(cdp, seed.fragB, 1, 2);
      let ch = await chains();
      if (ch.bCount !== 0 || !ch.envHasB) {
        fail("V2", `sau nhận B: chains=${JSON.stringify(ch)} (muốn mảnh B rỗng, envelope có hashB)`);
      } else {
        await adoptOne(cdp, seed.fragD, 2, 1);
        ch = await chains();
        if (ch.dCount !== 0 || !ch.envHasD) {
          fail("V2", `sau nhận D: chains=${JSON.stringify(ch)} (muốn mảnh D rỗng, envelope có hashD)`);
        } else {
          await adoptOne(cdp, seed.ptrC, 3, 0);
          ch = await chains();
          if (ch.cCount !== 0 || !ch.envHasC) {
            fail("V2", `sau nhận C: chains=${JSON.stringify(ch)} (muốn con trỏ C rỗng, envelope có hashC)`);
          } else if (ch.legacyKey !== null) {
            fail("V2", `sau nhận chuỗi con trỏ C mà khóa legacy vẫn còn: ${ch.legacyKey} (muốn đã dọn)`);
          } else {
            await cdp.shot("legacy-undo-stack-depth3.png");
            pass("V2", `nhận từng mảnh: depth 1 → 2 → 3 (banner data-depth đúng sau mỗi lần), envelope lần lượt có hashB/hashD/hashC, chuỗi nguồn rỗng, khóa con trỏ dọn sau khi nhận C (screenshot legacy-undo-stack-depth3.png)`);
          }
        }
      }
    } catch (e) { fail("V2", `harness lỗi: ${e.message}`); }

    // ---- V3: hoàn tác từng mức theo LIFO — C về trước, rồi D, rồi B ----
    try {
      await undoOne(cdp, seed.ptrC, 2, 1);
      let ch = await chains();
      if (ch.cCount !== 1 || ch.envHasC) {
        fail("V3", `sau undo mức 1: chains=${JSON.stringify(ch)} (muốn C có lại 1 version, envelope mất hashC)`);
      } else if (ch.legacyKey !== seed.ptrC) {
        fail("V3", `sau undo chuỗi con trỏ C mà khóa legacy không khôi phục: ${ch.legacyKey} (muốn ${seed.ptrC})`);
      } else {
        await undoOne(cdp, seed.fragD, 1, 2);
        ch = await chains();
        if (ch.dCount !== 2 || ch.envHasD) {
          fail("V3", `sau undo mức 2: chains=${JSON.stringify(ch)} (muốn D có lại 2 version, envelope mất hashD)`);
        } else {
          await undoOne(cdp, seed.fragB, 0, 3);
          ch = await chains();
          if (ch.bCount !== 1 || ch.envHasB || ch.envCount !== 0) {
            fail("V3", `sau undo mức 3: chains=${JSON.stringify(ch)} (muốn B có lại 1 version, envelope sạch)`);
          } else {
            const st = await cdp.evalJs(MODAL_STATE_FN);
            if (st.undoBanner) {
              fail("V3", `sau khi hoàn tác hết 3 mức mà banner Hoàn tác vẫn hiện (undoDepth=${st.undoDepth})`);
            } else {
              pass("V3", `hoàn tác LIFO đúng: C (nhận sau cùng) về trước + khóa con trỏ khôi phục, rồi D (2 version), rồi B; depth 3 → 2 → 1 → 0, banner biến mất, envelope sạch`);
            }
          }
        }
      }
    } catch (e) { fail("V3", `harness lỗi: ${e.message}`); }

    // ---- V4: nhận TẤT CẢ rồi hoàn tác ngược 3 mức ----
    // Thứ tự nhận-tất-cả = thứ tự hàng đợi lúc bấm (sau V3 là [C, D,
    // B] vì hoàn tác trả mục về theo thứ tự đó) — đọc đúng thứ tự này
    // rồi hoàn tác theo thứ tự NGƯỢC với nó, thay vì giả định thứ tự
    // seed B → D → C (đó chính là lỗi harness khiến lần chạy đầu fail
    // V4: mức trên đỉnh sau nhận-tất-cả là B, không phải C).
    try {
      const beforeAll = await cdp.evalJs(MODAL_STATE_FN);
      if (!beforeAll.shown || beforeAll.items.length !== 3) {
        fail("V4", `trước khi nhận tất cả: modal phải có 3 mục, nhận ${JSON.stringify(beforeAll)}`);
      } else {
        const adoptOrder = beforeAll.items.map((i) => i.from);
        const clicked = await cdp.evalJs(CLICK_ADOPT_ALL_FN);
        if (!clicked.clicked) { fail("V4", `không bấm được nút Nhận tất cả: ${clicked.reason}`); }
        else {
          const confirming = await cdp.waitFor(async () => {
            const s = await cdp.evalJs(`!!document.querySelector('[data-testid="legacy-adopt-confirm-all"]')`).catch(() => null);
            return s ? true : null;
          }, "bảng xác nhận nhận tất cả hiện", 30000);
          void confirming;
          const confirmed = await clickTestid(cdp, "legacy-adopt-confirm-all-accept");
          if (!confirmed.clicked) { fail("V4", `không bấm được nút Xác nhận nhận tất cả: ${confirmed.reason}`); }
          else {
            const afterAll = await cdp.waitFor(async () => {
              const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
              return s && s.shown && s.items.length === 0 && s.undoBanner && s.undoDepth === 3 ? s : null;
            }, "sau nhận tất cả: modal hết mục, banner depth=3", 30000);
            void afterAll;
            let ch = await chains();
            if (ch.bCount !== 0 || ch.dCount !== 0 || ch.cCount !== 0 || !ch.envHasB || !ch.envHasD || !ch.envHasC) {
              fail("V4", `sau nhận tất cả: chains=${JSON.stringify(ch)} (muốn 3 chuỗi rỗng, envelope có đủ hashB/hashD/hashC)`);
            } else {
              // Hoàn tác ngược với thứ tự nhận: adoptOrder[2] → [1] → [0].
              const expectBack = (from) => {
                if (from === seed.ptrC) return ch.cCount === 1 && !ch.envHasC && ch.legacyKey === seed.ptrC;
                if (from === seed.fragD) return ch.dCount === 2 && !ch.envHasD;
                return ch.bCount === 1 && !ch.envHasB;
              };
              const undoOrder = [adoptOrder[2], adoptOrder[1], adoptOrder[0]];
              let ok = true;
              for (let k = 0; k < 3; k++) {
                const from = undoOrder[k];
                const wantDepth = 2 - k;
                const wantItems = 1 + k;
                await undoOne(cdp, from, wantDepth, wantItems);
                ch = await chains();
                if (!expectBack(from)) {
                  fail("V4", `sau undo mức ${k + 1} (loạt, ${from}): chains=${JSON.stringify(ch)} (muốn chuỗi đó về lại, envelope mất hash)`);
                  ok = false;
                  break;
                }
              }
              if (ok) {
                ch = await chains();
                const st = await cdp.evalJs(MODAL_STATE_FN);
                if (st.undoBanner) fail("V4", `sau khi hoàn tác hết loạt mà banner vẫn hiện (depth=${st.undoDepth})`);
                else if (ch.envCount !== 0) fail("V4", `sau khi hoàn tác hết loạt mà envelope còn ${ch.envCount} version`);
                else pass("V4", `nhận tất cả (thứ tự hàng đợi [${adoptOrder.map((f) => f.slice(5, 13)).join(", ")}], 1 lần xác nhận) → depth=3, mỗi chuỗi một mức riêng; hoàn tác ngược đúng thứ tự ${undoOrder.map((f) => f.slice(5, 13)).join(" → ")}, envelope sạch sau mức cuối, banner biến mất`);
              }
            }
          }
        }
      }
    } catch (e) { fail("V4", `harness lỗi: ${e.message}`); }

    // ---- V5: nút Ẩn dọn cả stack ----
    try {
      await adoptOne(cdp, seed.fragB, 1, 2);
      const hidden = await clickTestid(cdp, "legacy-adopt-undo-hide");
      if (!hidden.clicked) { fail("V5", `không bấm được nút Ẩn: ${hidden.reason}`); }
      else {
        const st = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
          return s && s.shown && !s.undoBanner && s.undoDepth === 0 && s.items.length === 2 ? s : null;
        }, "sau bấm Ẩn: banner biến mất, modal còn 2 mục chờ", 30000);
        void st;
        const undoBtn = await cdp.evalJs(`!!document.querySelector('[data-testid="legacy-adopt-undo"]')`);
        if (undoBtn) {
          fail("V5", "sau bấm Ẩn mà nút Hoàn tác vẫn còn (stack chưa dọn)");
        } else {
          const ch = await chains();
          if (ch.bCount !== 0 || !ch.envHasB) {
            fail("V5", `sau bấm Ẩn: chains=${JSON.stringify(ch)} (muốn B vẫn đã nhận — Ẩn chỉ bỏ các mức hoàn tác, không trả version về)`);
          } else {
            pass("V5", `nút Ẩn dọn cả stack: banner + nút Hoàn tác biến mất (depth 0), modal còn 2 mục chờ; version của B vẫn ở envelope (Ẩn không hoàn tác ngầm)`);
          }
        }
      }
    } catch (e) { fail("V5", `harness lỗi: ${e.message}`); }

    // ---- V6: 0 lỗi trang ----
    const errs = await drainErrors(cdp);
    if (errs.length === 0) pass("V6", "0 window.onerror/unhandledrejection trong suốt phiên");
    else fail("V6", `${errs.length} lỗi trang: ${errs.slice(0, 3).join(" || ")}`);

    const failed = results.filter((r) => !r.ok);
    writeFileEpermRetry(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), loadavgStart, loadavgEnd: loadavg(), results, phaseErrors }, null, 2));
    log(`loadavg lúc kết thúc headed: ${loadavg()}`);
    log(`== KẾT QUẢ: ${results.filter((r) => r.ok).length}/${results.length} PASS ==`);
    killAll();
    process.exit(failed.length > 0 ? 1 : 0);
  } catch (e) {
    log(`HARNESS LỖI: ${e.message}`);
    try { fs.mkdirSync(SCRATCH, { recursive: true }); writeFileEpermRetry(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), harnessError: e.message, loadavgEnd: loadavg(), results }, null, 2)); } catch {}
    killAll();
    process.exit(2);
  }
}

void main();
