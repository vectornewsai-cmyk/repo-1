#!/usr/bin/env node
/**
 * clicktest-66t7-legacy-adopt-ui.mjs — Phase 9 đợt 66, luồng T7:
 * UI nhận mảnh legacy mơ hồ THỦ CÔNG + nối autosave-restore nhận
 * chuỗi legacy (đóng nợ đợt 65 S9 §5.1 + §8 mục 6).
 *
 * Chạy headed THẬT (vite dev + Chromium headed qua Xvfb + CDP, Node thuần,
 * không Playwright), theo mẫu clicktest-64r6-project-name-registry.mjs
 * (HMR tắt bằng config tạm; profile Chrome mới tinh; MỘT tab).
 *
 * Các case (profile mới — localStorage + IndexedDB trống):
 *   T0 setup: tab mount (app tự load mẫu); đọc projectId envelope thật
 *        của app qua store (UUID sinh lúc khởi tạo).
 *   T1 seed (trong trang, module thật): spec hiện tại A (2 clip) ghi
 *        autosave; chuỗi mảnh `file-<hashB>-<tên>` (spec B khác nội
 *        dung, 1 version) + chuỗi con trỏ `file-<hashC>-<tên>` (spec C
 *        khác nội dung, 1 version, khóa legacy trỏ tới) — cả hai đều
 *        mơ hồ (cùng tên, hash lệch so với spec A).
 *   T2 reload → autosave-restore chạy adopt → modal nhận thủ công hiện
 *        đủ 2 mục, mỗi mục hiện đúng id nguồn + hash nhúng.
 *        (LƯU Ý: key `legacyAdopt.*` còn nằm trong fragment riêng
 *        `apps/web/src/i18n/fragments/round66-t7.json`, parent gộp vào
 *        dict sau — trước lúc gộp, `t()` trả về đúng key nên test này
 *        chỉ assert cấu trúc/dữ liệu qua data-testid + data-from, KHÔNG
 *        assert chuỗi dịch. Chuỗi dịch đã kiểm bằng node ở §4 LIMITS.)
 *   T3 bấm "Nhận" ở mục mảnh (UI thật): mục biến khỏi modal, chuỗi
 *        mảnh rỗng, envelope có thêm version mang đúng hash B.
 *   T4 bấm "Bỏ qua" ở mục con trỏ (UI thật): modal đóng (0 mục), chuỗi
 *        con trỏ còn nguyên 1 version, id đã ghi vào danh sách bỏ qua.
 *   T5 reload lần nữa → modal KHÔNG hiện lại (bỏ qua đã ghi nhớ);
 *        mở panel Lịch sử bằng UI thật → đúng 1 hàng (version mảnh đã
 *        nhận tay).
 *   T6 0 lỗi trang trong suốt phiên.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/clicktest-66t7-legacy-adopt-ui.mjs
 * Env: T66_DEV_PORT (mặc định tự chọn 5650–5659), T66_DEBUG_PORT (9750–9759),
 * T66_DISPLAY (mặc định :177 — display RIÊNG của T7 đợt 66), T66_SCRATCH
 * (mặc định hidden_files/round66-t7/headed). TMPDIR riêng /tmp/round66-t7/tmp.
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
const SCRATCH = process.env.T66_SCRATCH || path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round66-t7", "headed");
const CHROME_CANDIDATES = ["chromium-1254", "chromium-1187"].map((d) =>
  path.join(os.homedir(), ".cache/ms-playwright", d, "chrome-linux64", "chrome"),
);
const CHROME = CHROME_CANDIDATES.find((c) => fs.existsSync(c)) || CHROME_CANDIDATES[0];
const VITE_BIN = [path.join(ROOT, "node_modules", ".bin", "vite"), path.join(WEB_DIR, "node_modules", ".bin", "vite")].find((c) => fs.existsSync(c));
const VITE_CFG_DIR = "/tmp/round66-t7";
const VITE_CFG = path.join(VITE_CFG_DIR, "vite.t66.config.mjs");

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
  window.__t66errors = [];
  window.addEventListener("error", (e) => { try { window.__t66errors.push("window.onerror: " + (e.message || e.type)); } catch { window.__t66errors.push("window.onerror: <?>"); } });
  window.addEventListener("unhandledrejection", (e) => { try { window.__t66errors.push("unhandledrejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason)); } catch { window.__t66errors.push("unhandledrejection: <?>"); } });
})()`;

// projectId envelope thật của app (store sinh lúc khởi tạo).
const PROJECT_ID_FN = `(async () => {
  const entries = performance.getEntriesByType("resource").map((e) => e.name);
  const hit = entries.find((u) => /\\/src\\/store\\.ts(\\?|$)/.test(u)) || "/src/store.ts";
  const mod = window.__t66storeMod || (window.__t66storeMod = await import(hit));
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

// T1: seed autosave (spec A) + mảnh mơ hồ (spec B) + con trỏ mơ hồ (spec C).
const SEED_FN = `(async (appProjectId) => {
  const hist = window.__t66histMod || (window.__t66histMod = await import("/src/lib/projectHistory.ts"));
  const reg = window.__t66regMod || (window.__t66regMod = await import("/src/lib/projectNameRegistry64R6.ts"));
  const repo = window.__t66repoMod || (window.__t66repoMod = await import("/src/lib/projectRepo.ts"));
  const store = hist.getHistoryStore();
  const spec = ${SPEC_FN};
  const name = "Kiểm tra headed";
  const specA = spec(name, 2, "a");
  const specB = spec(name, 1, "b");
  const specC = spec(name, 3, "c");
  const hashOf = async (s) => {
    const v = await store.saveVersion("tmp-probe-66t7", s);
    return v.hash;
  };
  const hashB = await hashOf(specB);
  const hashC = await hashOf(specC);
  const san = reg.sanitizeLegacyFileName(name);
  const fragId = "file-" + hashB + "-" + san;
  const ptrId = "file-" + hashC + "-" + san;
  await store.saveVersion(fragId, specB);
  await store.saveVersion(ptrId, specC);
  window.localStorage.setItem(hist.HISTORY_PROJECT_KEY, ptrId);
  // autosaveNow ghi ngay + hủy timer debounce của lần load mẫu (không
  // thì timer bắn sau sẽ ghi đè envelope seed bằng spec mẫu).
  repo.autosaveNow(specA, name, undefined, undefined, appProjectId);
  return { fragId, ptrId, hashB, hashC, name };
})`;

// Đọc trạng thái modal + chuỗi (sau reload / sau thao tác).
const MODAL_STATE_FN = `(() => {
  const modal = document.querySelector('[data-testid="legacy-adopt-modal"]');
  if (!modal) return { shown: false, items: [] };
  const items = [...modal.querySelectorAll('[data-testid="legacy-adopt-item"]')].map((el) => ({
    from: el.getAttribute("data-from"),
    text: el.innerText.replace(/\\n/g, " | ").slice(0, 400),
  }));
  return { shown: true, items };
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

// Kiểm tra chuỗi trong IDB thật + danh sách đã bỏ qua.
const CHAINS_FN = `(async (appProjectId, fragId, ptrId, hashB) => {
  const hist = window.__t66histMod || (window.__t66histMod = await import("/src/lib/projectHistory.ts"));
  const store = hist.getHistoryStore();
  const frag = await store.listVersions(fragId);
  const ptr = await store.listVersions(ptrId);
  const env = await store.listVersions(appProjectId);
  const dismissed = window.localStorage.getItem("vcut:legacy-adopt-dismissed-v1");
  return {
    fragCount: frag.length, ptrCount: ptr.length, envCount: env.length,
    envHasB: env.some((v) => v.hash === hashB),
    dismissed: dismissed ? JSON.parse(dismissed) : [],
  };
})`;

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
    const e = (await cdp.evalJs(`(window.__t66errors || []).slice()`)) || [];
    phaseErrors.push(...e);
    await cdp.evalJs(`window.__t66errors = []`).catch(() => {});
    return e;
  }

  try {
    const DEV_PORT = Number(process.env.T66_DEV_PORT || 0) || (await pickFreePort(5650, 5659));
    const DEBUG_PORT = Number(process.env.T66_DEBUG_PORT || 0) || (await pickFreePort(9750, 9759));
    const DISPLAY = process.env.T66_DISPLAY || ":177";
    if (!DEV_PORT) throw new Error("hết cổng dev trống 5650–5659");
    if (!DEBUG_PORT) throw new Error("hết cổng debug trống 9750–9759");
    const sock = `/tmp/.X11-unix/X${DISPLAY.slice(1)}`;
    if (fs.existsSync(sock)) {
      const { execSync } = await import("node:child_process");
      let alive = false;
      try { alive = execSync(`ps -eo args | grep -F "Xvfb ${DISPLAY} " | grep -v grep | head -1`, { encoding: "utf8" }).trim().length > 0; } catch { alive = false; }
      if (alive) throw new Error(`display ${DISPLAY} đã có X server khác (T7 dùng display riêng, không dùng chung)`);
      fs.unlinkSync(sock);
      log(`đã dọn socket X mồ côi ${sock} (Xvfb cũ đã chết)`);
    }
    if (!fs.existsSync(CHROME)) throw new Error(`không thấy chrome ${CHROME}`);
    if (!VITE_BIN) throw new Error("không thấy vite");
    const DEV_URL = `http://127.0.0.1:${DEV_PORT}/`;
    const PROFILE = path.join(SCRATCH, "chrome-userdata");
    const TMPDIR = "/tmp/round66-t7/tmp";
    fs.mkdirSync(SCRATCH, { recursive: true });
    fs.mkdirSync(TMPDIR, { recursive: true });
    fs.rmSync(PROFILE, { recursive: true, force: true });
    fs.mkdirSync(VITE_CFG_DIR, { recursive: true });
    writeFileEpermRetry(VITE_CFG, `import { createRequire } from "node:module";\nconst require = createRequire(${JSON.stringify(path.join(WEB_DIR, "package.json"))});\nconst react = require("@vitejs/plugin-react").default;\nexport default { plugins: [react()], server: { hmr: false } };\n`);
    log(`vite dev :${DEV_PORT}, debug :${DEBUG_PORT}, DISPLAY=${DISPLAY}, TMPDIR=${TMPDIR}`);

    const viteLogFd = fs.openSync(path.join(SCRATCH, "t66-vite.log"), "w");
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
    const chromeLogFd = fs.openSync(path.join(SCRATCH, "t66-chrome.log"), "w");
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

    // ---- T1: seed autosave + 2 chuỗi mơ hồ ----
    let seed;
    try {
      seed = await cdp.evalJs(`${SEED_FN}(${JSON.stringify(appProjectId)})`);
      if (seed.fragId && seed.ptrId && seed.fragId !== seed.ptrId) {
        pass("T1", `seed: mảnh ${seed.fragId} (hashB ${seed.hashB}), con trỏ ${seed.ptrId} (hashC ${seed.hashC}), autosave spec A 2 clip`);
      } else {
        fail("T1", `seed lệch: ${JSON.stringify(seed)}`);
      }
    } catch (e) { fail("T1", `harness lỗi: ${e.message}`); }

    // ---- T2: reload → autosave-restore chạy adopt → modal hiện 2 mục ----
    try {
      await cdp.send("Page.navigate", { url: DEV_URL });
      await mountCheck(cdp, "tab sau reload");
      const state = await cdp.waitFor(async () => {
        const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
        return s && s.shown && s.items.length === 2 ? s : null;
      }, "modal nhận thủ công hiện 2 mục", 60000);
      const froms = state.items.map((i) => i.from);
      const fragItem = state.items.find((i) => i.from === seed.fragId);
      const ptrItem = state.items.find((i) => i.from === seed.ptrId);
      const fragShowsHash = fragItem && fragItem.text.includes(seed.hashB);
      const ptrShowsHash = ptrItem && ptrItem.text.includes(seed.hashC);
      await cdp.shot("legacy-adopt-modal.png");
      if (froms.includes(seed.fragId) && froms.includes(seed.ptrId) && fragShowsHash && ptrShowsHash) {
        pass("T2", `modal hiện 2 mục mơ hồ (mảnh + con trỏ), mỗi mục hiện đúng hash nhúng (screenshot legacy-adopt-modal.png)`);
      } else {
        fail("T2", `modal lệch: items=${JSON.stringify(state.items)} (muốn hashB ${seed.hashB} / hashC ${seed.hashC})`);
      }
    } catch (e) { fail("T2", `harness lỗi: ${e.message}`); }

    // ---- T3: bấm Nhận ở mục mảnh (UI thật) ----
    try {
      const clicked = await cdp.evalJs(`${CLICK_ITEM_FN}(${JSON.stringify(seed.fragId)}, "accept")`);
      if (!clicked.clicked) { fail("T3", `không bấm được nút Nhận: ${clicked.reason}`); }
      else {
        const state = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
          return s && s.shown && s.items.length === 1 && s.items[0].from === seed.ptrId ? s : null;
        }, "modal còn đúng 1 mục (con trỏ) sau khi nhận mảnh", 30000);
        const chains = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
        if (chains.fragCount === 0 && chains.envHasB && chains.envCount >= 1) {
          pass("T3", `nhận tay mảnh: modal còn 1 mục, chuỗi mảnh rỗng, envelope có version hashB (env ${chains.envCount})`);
        } else {
          fail("T3", `sau khi nhận mảnh: modal=${JSON.stringify(state.items)}, chains=${JSON.stringify(chains)}`);
        }
      }
    } catch (e) { fail("T3", `harness lỗi: ${e.message}`); }

    // ---- T4: bấm Bỏ qua ở mục con trỏ (UI thật) ----
    try {
      const clicked = await cdp.evalJs(`${CLICK_ITEM_FN}(${JSON.stringify(seed.ptrId)}, "dismiss")`);
      if (!clicked.clicked) { fail("T4", `không bấm được nút Bỏ qua: ${clicked.reason}`); }
      else {
        const state = await cdp.waitFor(async () => {
          const s = await cdp.evalJs(MODAL_STATE_FN).catch(() => null);
          return s && !s.shown ? s : null;
        }, "modal đóng sau khi bỏ qua", 30000);
        void state;
        const chains = await cdp.evalJs(`${CHAINS_FN}(${JSON.stringify(appProjectId)}, ${JSON.stringify(seed.fragId)}, ${JSON.stringify(seed.ptrId)}, ${JSON.stringify(seed.hashB)})`);
        if (chains.ptrCount === 1 && chains.dismissed.includes(seed.ptrId)) {
          pass("T4", `bỏ qua con trỏ: modal đóng, chuỗi con trỏ còn nguyên 1 version, id đã ghi vào danh sách bỏ qua`);
        } else {
          fail("T4", `sau khi bỏ qua: chains=${JSON.stringify(chains)}`);
        }
      }
    } catch (e) { fail("T4", `harness lỗi: ${e.message}`); }

    // ---- T5: reload lần nữa → modal KHÔNG hiện lại; panel Lịch sử đúng 1 hàng ----
    try {
      await cdp.send("Page.navigate", { url: DEV_URL });
      await mountCheck(cdp, "tab sau reload 2");
      await sleep(8000); // chờ autosave-restore + adopt chạy xong
      const state = await cdp.evalJs(MODAL_STATE_FN);
      if (state.shown) {
        fail("T5", `modal hiện lại sau reload dù đã bỏ qua: ${JSON.stringify(state.items)}`);
      } else {
        const opened = await cdp.evalJs(OPEN_HISTORY_FN);
        if (!opened.opened) { fail("T5", `không mở được panel Lịch sử: ${opened.reason}`); }
        else {
          const rows = await cdp.waitFor(async () => {
            const r = await cdp.evalJs(HISTORY_ROWS_FN).catch(() => null);
            return r && r.count === 1 ? r : null;
          }, "panel Lịch sử đúng 1 hàng", 30000);
          await cdp.shot("history-after-adopt.png");
          pass("T5", `reload 2: modal không hiện lại (bỏ qua đã ghi nhớ); panel Lịch sử đúng 1 hàng = version mảnh đã nhận tay`);
        }
      }
    } catch (e) { fail("T5", `harness lỗi: ${e.message}`); }

    // ---- T6: 0 lỗi trang ----
    const errs = await drainErrors(cdp);
    if (errs.length === 0) pass("T6", "0 window.onerror/unhandledrejection trong suốt phiên");
    else fail("T6", `${errs.length} lỗi trang: ${errs.slice(0, 3).join(" || ")}`);

    const failed = results.filter((r) => !r.ok);
    writeFileEpermRetry(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), results, phaseErrors }, null, 2));
    log(`== KẾT QUẢ: ${results.filter((r) => r.ok).length}/${results.length} PASS ==`);
    killAll();
    process.exit(failed.length > 0 ? 1 : 0);
  } catch (e) {
    log(`HARNESS LỖI: ${e.message}`);
    try { fs.mkdirSync(SCRATCH, { recursive: true }); writeFileEpermRetry(path.join(SCRATCH, "report.json"), JSON.stringify({ at: new Date().toISOString(), harnessError: e.message, results }, null, 2)); } catch {}
    killAll();
    process.exit(2);
  }
}

void main();
