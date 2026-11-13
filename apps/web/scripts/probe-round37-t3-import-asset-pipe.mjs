#!/usr/bin/env node
/**
 * probe-round37-t3-import-asset-pipe.mjs — Phase 9 đợt 37, luồng T3.
 *
 * Kiểm chứng bằng trình duyệt thật (KHÔNG phải discard thật, chỉ reload
 * mô phỏng như R6/S5):
 *
 * Pha A (đường user đi — importFiles ingest): profile mới → chờ project
 * mẫu → import file PNG qua input MediaBin (CDP setFileInputFiles) →
 * thêm clip vào timeline → reload → assert: panel Relink VẮNG, media
 * bin chứa t3-test.png, và IndexedDB có manifest originalName
 * t3-test.png (bằng chứng ingest thật, đọc trước reload).
 * Pha C (đường mở file .vcut.json có src asset:): sửa autosave thành
 * file project có 1 clip src `asset:<id>` (id lấy từ IndexedDB pha A)
 * → mở qua input ProjectMenu → assert: panel Relink VẮNG, media bin
 * chứa item `asset:<id>` (rehydrate đường mở file, không chỉ autosave).
 * Pha B (đối chứng âm): sửa autosave — đổi clip asset: thành tên file
 * không tồn tại → reload → assert panel Relink HIỆN và liệt kê đúng
 * tên đó (chứng minh rehydrate không che media thiếu thật).
 *
 * Phương pháp: phục vụ bundle probe (build riêng ra /tmp, KHÔNG đụng
 * dist của repo để khỏi nhiễm các luồng khác) bằng python http.server;
 * điều khiển Chrome qua CDP WebSocket (Node có sẵn WebSocket global,
 * không cần package playwright). File PNG test (1x1) nằm trong dist
 * để input file trỏ tới được bằng đường dẫn đĩa thật.
 *
 * Chạy từ gốc repo (sau khi đã build bundle probe):
 *   npx vite build --outDir /tmp/vcut-t3-dist   (từ apps/web)
 *   node apps/web/scripts/probe-round37-t3-import-asset-pipe.mjs
 * Env: T3_PORT (4297), T3_CDP_PORT (9231), T3_DIST (/tmp/vcut-t3-dist),
 *   T3_OUT (benchmarks/results/v37-t3-import-asset.json),
 *   T3_PROFILE (/tmp/vcut-t3-profile).
 * Exit 0 khi probe chạy xong (kể cả khi assert FAIL — đó là dữ liệu,
 * xem JSON); exit 2 khi không dựng được môi trường.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const PORT = Number(process.env.T3_PORT || 4297);
const CDP_PORT = Number(process.env.T3_CDP_PORT || 9231);
const DIST = process.env.T3_DIST || "/tmp/vcut-t3-dist";
const OUT = process.env.T3_OUT || path.join(ROOT, "benchmarks", "results", "v37-t3-import-asset.json");
const PROFILE = process.env.T3_PROFILE || "/tmp/vcut-t3-profile";
const URL = `http://127.0.0.1:${PORT}/`;
const AUTOSAVE_KEY = "vcut-studio:autosave:v1";
const PNG_PATH = path.join(DIST, "t3-test.png");
const OPEN_PATH = "/tmp/vcut-t3-open.vcut.json";
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const CHROME = [PW_CHROME, META_CHROME].find((p) => fs.existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

function kill(proc) {
  try {
    if (proc && !proc.killed) proc.kill("SIGKILL");
  } catch { /* ignore */ }
}

// --- CDP tối thiểu qua WebSocket (mẫu S5) + tự chấp nhận dialog confirm ---
class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.method === "Page.javascriptDialogOpening") {
        // confirmDiscard ("Bỏ thay đổi...") → chấp nhận để mở file tiếp.
        this.send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
        return;
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }
  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = () => reject(new Error("CDP websocket failed"));
      setTimeout(() => reject(new Error("CDP websocket timeout")), 15000);
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout ${method}`));
        }
      }, 30000);
    });
  }
  async evalJs(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      throw new Error(`evaluate failed: ${JSON.stringify(r.exceptionDetails).slice(0, 300)}`);
    }
    return r.result.value;
  }
  async setInputFiles(selector, files) {
    const doc = await this.send("DOM.getDocument", { depth: 0 });
    const q = await this.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector });
    if (!q.nodeId) throw new Error(`không tìm thấy input: ${selector}`);
    await this.send("DOM.setFileInputFiles", { nodeId: q.nodeId, files });
  }
  close() {
    try { this.ws.close(); } catch { /* ignore */ }
  }
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try {
      last = await fn();
      if (last) return last;
    } catch (e) { last = undefined; }
    await sleep(1000);
  }
  throw new Error(`timeout chờ ${label}`);
}

const results = {};
function check(name, cond, detail = "") {
  results[name] = { pass: !!cond, detail: String(detail).slice(0, 400) };
  log(`[${cond ? "PASS" : "FAIL"}] ${name} ${detail}`);
}

async function runBrowser(serverProc) {
  spawnSync("rm", ["-rf", PROFILE]);
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-first-run",
    "--disable-dev-shm-usage",
    `--user-data-dir=${PROFILE}`,
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--use-fake-ui-for-media-stream",
    "about:blank",
  ];
  const chrome = spawn(CHROME, args, { stdio: "ignore" });
  try {
    const targets = await waitFor(async () => {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      if (!res.ok) return null;
      const list = await res.json();
      return list.length > 0 ? list : null;
    }, 30000, "CDP /json/list");
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const cdp = new Cdp(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");

    // ---- Khởi động: chờ project mẫu + autosave như S5 ----
    await cdp.send("Page.navigate", { url: URL });
    const autosaveReady = await waitFor(async () => {
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      if (!raw || !raw.includes("Dự án mẫu")) return null;
      return raw;
    }, 90000, "autosave project mẫu");
    log(`[khởi động] autosave mẫu đã có (${autosaveReady.length} ký tự)`);

    // ---- Pha A: import PNG → timeline → kiểm tra manifest → reload ----
    await cdp.setInputFiles('.mediabin input[type="file"]', [PNG_PATH]);
    await waitFor(async () => {
      const text = await cdp.evalJs(`(() => { const el = document.querySelector('.mediabin'); return el ? el.innerText : ""; })()`);
      return text.includes("t3-test.png") ? true : null;
    }, 30000, "media bin có t3-test.png");
    log("[pha A] import xong, media bin có t3-test.png");
    const addClicked = await cdp.evalJs(`(() => {
      const btn = [...document.querySelectorAll('.media-add')].find((b) => (b.getAttribute('aria-label') || '').endsWith(': t3-test.png'));
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    log(`[pha A] nút thêm clip vào timeline: ${addClicked}`);
    await waitFor(async () => {
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      return raw && raw.includes("t3-test.png") ? true : null;
    }, 30000, "autosave chứa t3-test.png");
    log("[pha A] autosave đã chứa clip t3-test.png");
    const manifests = await cdp.evalJs(`(async () => await new Promise((resolve, reject) => {
      const req = indexedDB.open('vcut-studio-assets', 1);
      req.onsuccess = () => {
        const r = req.result.transaction('manifests', 'readonly').objectStore('manifests').getAll();
        r.onsuccess = () => resolve(r.result.map((m) => ({ assetId: m.assetId, originalName: m.originalName })));
        r.onerror = () => reject(new Error('getAll fail'));
      };
      req.onerror = () => reject(new Error('open fail'));
    }))()`);
    log(`[pha A] manifests trong IndexedDB: ${JSON.stringify(manifests)}`);
    const imported = (manifests || []).find((m) => m.originalName === "t3-test.png");
    check("phaA.manifestIngested", !!imported, imported ? `assetId=${imported.assetId}` : "không thấy manifest t3-test.png");
    if (!imported) throw new Error("pha A: import không ingest — dừng trước pha C");

    await cdp.send("Page.reload", { ignoreCache: true });
    await waitFor(async () => {
      const name = await cdp.evalJs(`(() => { const el = document.querySelector('input[aria-label="Tên dự án"]'); return el ? el.value : ""; })()`);
      if (name !== "Dự án mẫu") return null;
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      return raw ? true : null;
    }, 60000, "khôi phục sau reload (pha A)");
    await sleep(2500);
    const afterA = await cdp.evalJs(`(() => {
      const bin = document.querySelector('.mediabin');
      const relink = document.querySelector('[aria-label="Media thiếu"]');
      return {
        binText: bin ? bin.innerText : "",
        relinkPresent: relink !== null,
        relinkText: relink ? relink.innerText.slice(0, 500) : "",
      };
    })()`);
    check("phaA.noFalseRelinkAfterReload", !afterA.relinkPresent, afterA.relinkText);
    check("phaA.mediaBinHasPng", afterA.binText.includes("t3-test.png"), afterA.binText.slice(0, 200));

    // ---- Pha C: mở file .vcut.json có clip src asset: ----
    const rawAuto = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
    const envelope = JSON.parse(rawAuto);
    let replaced = 0;
    const rewrite = (tracks) => {
      for (const t of tracks || []) {
        for (const c of t.clips || []) {
          if (c.src === "t3-test.png") { c.src = `asset:${imported.assetId}`; replaced++; }
          if (c.subSpec?.tracks) rewrite(c.subSpec.tracks);
          if (c.tracks) rewrite(c.tracks);
        }
      }
    };
    rewrite(envelope.spec.tracks);
    envelope.name = "T3 mở asset";
    writeFileEpermRetry(OPEN_PATH, JSON.stringify(envelope));
    log(`[pha C] file mở đã ghi (${OPEN_PATH}), đổi ${replaced} clip sang asset:`);
    await cdp.setInputFiles('.project-menu input[accept=".vcut.json,.json,application/json"]', [OPEN_PATH]);
    await waitFor(async () => {
      const name = await cdp.evalJs(`(() => { const el = document.querySelector('input[aria-label="Tên dự án"]'); return el ? el.value : ""; })()`);
      return name === "T3 mở asset" ? true : null;
    }, 30000, "mở file asset: (tên project đổi)");
    await sleep(2500);
    const afterC = await cdp.evalJs(`(() => {
      const bin = document.querySelector('.mediabin');
      const relink = document.querySelector('[aria-label="Media thiếu"]');
      return {
        binText: bin ? bin.innerText : "",
        relinkPresent: relink !== null,
        relinkText: relink ? relink.innerText.slice(0, 500) : "",
      };
    })()`);
    check("phaC.noFalseRelinkOnAssetOpen", !afterC.relinkPresent, afterC.relinkText);
    check("phaC.mediaBinHasAssetItem", afterC.binText.includes(imported.assetId), afterC.binText.slice(0, 300));

    // ---- Pha B (đối chứng âm): clip trỏ file không tồn tại → Relink phải hiện ----
    // Lưu ý timing: onFile gọi clearAutosave() rồi autosave() debounce 5s,
    // nên phải chờ autosave mới (chứa asset:) xuất hiện rồi mới sửa —
    // đọc sớm hơn sẽ gặp key trống (JSON.parse(null) = null).
    await waitFor(async () => {
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      return raw && raw.includes(`asset:${imported.assetId}`) ? true : null;
    }, 30000, "autosave sau mở file chứa asset:");
    await cdp.evalJs(`(() => {
      const raw = localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)});
      const env = JSON.parse(raw);
      const rewrite = (tracks) => {
        for (const t of tracks || []) {
          for (const c of t.clips || []) {
            if (typeof c.src === 'string' && c.src.startsWith('asset:')) c.src = 'file-that-does-not-exist-xyz.mp4';
            if (c.subSpec?.tracks) rewrite(c.subSpec.tracks);
            if (c.tracks) rewrite(c.tracks);
          }
        }
      };
      rewrite(env.spec.tracks);
      localStorage.setItem(${JSON.stringify(AUTOSAVE_KEY)}, JSON.stringify(env));
      return true;
    })()`);
    await cdp.send("Page.reload", { ignoreCache: true });
    await waitFor(async () => {
      const name = await cdp.evalJs(`(() => { const el = document.querySelector('input[aria-label="Tên dự án"]'); return el ? el.value : ""; })()`);
      if (name !== "T3 mở asset") return null;
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      return raw ? true : null;
    }, 60000, "khôi phục sau reload (pha B)");
    await sleep(2500);
    const afterB = await cdp.evalJs(`(() => {
      const relink = document.querySelector('[aria-label="Media thiếu"]');
      return {
        relinkPresent: relink !== null,
        relinkText: relink ? relink.innerText.slice(0, 500) : "",
      };
    })()`);
    check("phaB.relinkShownForTrulyMissing", afterB.relinkPresent && afterB.relinkText.includes("file-that-does-not-exist-xyz"), afterB.relinkText);
    cdp.close();
  } finally {
    kill(chrome);
  }
}

async function main() {
  if (!CHROME) {
    console.error("Không tìm thấy Chrome (playwright chromium / meta-chromium).");
    process.exit(2);
  }
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error(`Chưa có bundle probe ở ${DIST} — chạy vite build trước.`);
    process.exit(2);
  }
  if (!fs.existsSync(PNG_PATH)) {
    console.error(`Chưa có file test ${PNG_PATH}.`);
    process.exit(2);
  }
  const serverProc = spawn("python3", ["-m", "http.server", String(PORT), "--directory", DIST], { stdio: "ignore" });
  try {
    await sleep(1200);
    await runBrowser(serverProc);
  } catch (e) {
    console.error(`PROBE ERROR: ${(e && e.message) || e}`);
    results.probeError = { pass: false, detail: String((e && e.message) || e).slice(0, 400) };
  } finally {
    kill(serverProc);
  }
  const allPass = Object.values(results).every((r) => r.pass);
  const out = { allPass, results, at: new Date().toISOString() };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(out, null, 2));
  log(`\nKết quả ghi tại ${OUT} — allPass=${allPass}`);
  process.exit(0);
}

main();
