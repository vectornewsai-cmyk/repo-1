#!/usr/bin/env node
/**
 * probe-round38-u3-relink-dedup-pipe.mjs — Phase 9 đợt 38, luồng U3.
 *
 * Kiểm chứng bằng trình duyệt thật (reload có chủ ý, KHÔNG phải discard
 * thật, giống S5/T3):
 * - Pha A (hồi quy T3): import u3-dup-a.mp4 → clip → reload → không Relink.
 * - Pha B (dedup import): import u3-dup-b.mp4 CÙNG BYTES, khác tên →
 *   clip → reload → không Relink cho cả hai tên; IndexedDB: 1 manifest,
 *   aliases chứa u3-dup-b.mp4 (bằng chứng alias, không phải 2 asset).
 * - Pha C (relink tay + dedup): sửa autosave đổi clip u3-dup-b.mp4 thành
 *   missing-u3.png → reload → Relink HIỆN → chọn lại bằng file
 *   u3-relink-c.mp4 (cùng bytes, tên mới) → reload → Relink VẮNG, bin
 *   chứa u3-relink-c.mp4, aliases chứa u3-relink-c.mp4.
 * - Pha D (đối chứng âm): sửa autosave đổi 1 clip thành tên không tồn
 *   tại → reload → Relink HIỆN đúng tên đó.
 * - Pha E (export sau reload qua bridge thật): THỬ — khởi động bridge
 *   127.0.0.1:8787, mở ExportPanel, render, chờ file ra. Nếu UI export
 *   không điều khiển được bằng CDP trong lượt này thì ghi rõ CHƯA CHỨNG
 *   MINH (không bịa), các pha A–D vẫn là kết quả độc lập.
 *
 * Phương pháp: như probe T3 (CDP WebSocket, bundle probe build riêng ra
 * /tmp, KHÔNG đè dist repo). Ba file MP4 test có cùng bytes chính xác
 * (ffmpeg render 1 lần rồi copy ra 3 tên) nằm trong dist để input file
 * trỏ được; dùng video thật để pha export render được (clip ảnh trên
 * video track bị render worker từ chối hợp lệ — xem pha E đợt chạy 1).
 *
 * Chạy từ gốc repo (sau khi đã build bundle probe):
 *   npx vite build --outDir /tmp/vcut-u3-dist   (từ apps/web)
 *   node apps/web/scripts/probe-round38-u3-relink-dedup-pipe.mjs
 * Env: U3_PORT (4298), U3_CDP_PORT (9232), U3_DIST (/tmp/vcut-u3-dist),
 *   U3_OUT (benchmarks/results/v38-u3-relink-dedup.json),
 *   U3_PROFILE (/tmp/vcut-u3-profile), U3_BRIDGE (1 = thử pha E).
 * Exit 0 khi probe chạy xong (kể cả assert FAIL — xem JSON); exit 2 khi
 * không dựng được môi trường.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const PORT = Number(process.env.U3_PORT || 4298);
const CDP_PORT = Number(process.env.U3_CDP_PORT || 9232);
const DIST = process.env.U3_DIST || "/tmp/vcut-u3-dist";
const OUT = process.env.U3_OUT || path.join(ROOT, "benchmarks", "results", "v38-u3-relink-dedup.json");
const PROFILE = process.env.U3_PROFILE || "/tmp/vcut-u3-profile";
const TRY_BRIDGE = process.env.U3_BRIDGE !== "0";
const URL = `http://127.0.0.1:${PORT}/`;
const AUTOSAVE_KEY = "vcut-studio:autosave:v1";
const PNG_A = path.join(DIST, "u3-dup-a.mp4");
const PNG_B = path.join(DIST, "u3-dup-b.mp4");
const PNG_C = path.join(DIST, "u3-relink-c.mp4");
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

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.method === "Page.javascriptDialogOpening") {
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

async function readManifests(cdp) {
  return cdp.evalJs(`(async () => await new Promise((resolve, reject) => {
    const req = indexedDB.open('vcut-studio-assets', 1);
    req.onsuccess = () => {
      const r = req.result.transaction('manifests', 'readonly').objectStore('manifests').getAll();
      r.onsuccess = () => resolve(r.result.map((m) => ({ assetId: m.assetId, originalName: m.originalName, aliases: m.aliases || [] })));
      r.onerror = () => reject(new Error('getAll fail'));
    };
    req.onerror = () => reject(new Error('open fail'));
  }))()`);
}

async function relinkState(cdp) {
  return cdp.evalJs(`(() => {
    const bin = document.querySelector('.mediabin');
    const relink = document.querySelector('[aria-label="Media thiếu"]');
    return {
      binText: bin ? bin.innerText : "",
      relinkPresent: relink !== null,
      relinkText: relink ? relink.innerText.slice(0, 500) : "",
    };
  })()`);
}

async function importAndAddClip(cdp, pngPath, pngName) {
  await cdp.setInputFiles('.mediabin input[type="file"]', [pngPath]);
  await waitFor(async () => {
    const text = await cdp.evalJs(`(() => { const el = document.querySelector('.mediabin'); return el ? el.innerText : ""; })()`);
    return text.includes(pngName) ? true : null;
  }, 30000, `media bin có ${pngName}`);
  const clicked = await cdp.evalJs(`(() => {
    const btn = [...document.querySelectorAll('.media-add')].find((b) => (b.getAttribute('aria-label') || '').endsWith(': ${pngName}'));
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`không tìm thấy nút thêm clip cho ${pngName}`);
  await waitFor(async () => {
    const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
    return raw && raw.includes(pngName) ? true : null;
  }, 30000, `autosave chứa ${pngName}`);
}

async function rewriteAutosaveClipSrc(cdp, from, to) {
  await cdp.evalJs(`(() => {
    const raw = localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)});
    const env = JSON.parse(raw);
    let n = 0;
    const rewrite = (tracks) => {
      for (const t of tracks || []) {
        for (const c of t.clips || []) {
          if (c.src === ${JSON.stringify(from)}) { c.src = ${JSON.stringify(to)}; n++; }
          if (c.subSpec?.tracks) rewrite(c.subSpec.tracks);
          if (c.tracks) rewrite(c.tracks);
        }
      }
    };
    rewrite(env.spec.tracks);
    localStorage.setItem(${JSON.stringify(AUTOSAVE_KEY)}, JSON.stringify(env));
    return n;
  })()`);
}

async function reloadAndWaitProject(cdp, projectName) {
  await cdp.send("Page.reload", { ignoreCache: true });
  await waitFor(async () => {
    const name = await cdp.evalJs(`(() => { const el = document.querySelector('input[aria-label="Tên dự án"]'); return el ? el.value : ""; })()`);
    if (name !== projectName) return null;
    const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
    return raw ? true : null;
  }, 60000, `khôi phục sau reload (${projectName})`);
  await sleep(2500);
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
  let bridgeProc = null;
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

    await cdp.send("Page.navigate", { url: URL });
    await waitFor(async () => {
      const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
      return raw && raw.includes("Dự án mẫu") ? true : null;
    }, 90000, "autosave project mẫu");

    // ---- Pha A: import a → clip → reload → không Relink ----
    await importAndAddClip(cdp, PNG_A, "u3-dup-a.mp4");
    await reloadAndWaitProject(cdp, "Dự án mẫu");
    const afterA = await relinkState(cdp);
    check("phaA.noFalseRelink", !afterA.relinkPresent, afterA.relinkText);
    check("phaA.binHasA", afterA.binText.includes("u3-dup-a.mp4"), afterA.binText.slice(0, 200));

    // ---- Pha B: import b (cùng bytes, khác tên) → clip → reload ----
    await importAndAddClip(cdp, PNG_B, "u3-dup-b.mp4");
    const manifestsB = await readManifests(cdp);
    log(`[pha B] manifests trước reload: ${JSON.stringify(manifestsB)}`);
    await reloadAndWaitProject(cdp, "Dự án mẫu");
    const afterB = await relinkState(cdp);
    check("phaB.noFalseRelink", !afterB.relinkPresent, afterB.relinkText);
    check("phaB.binHasBoth", afterB.binText.includes("u3-dup-a.mp4") && afterB.binText.includes("u3-dup-b.mp4"), afterB.binText.slice(0, 300));
    const manifestsB2 = await readManifests(cdp);
    const dupManifest = (manifestsB2 || []).find((m) => m.originalName === "u3-dup-a.mp4");
    check("phaB.oneManifestWithAlias", !!dupManifest && (dupManifest.aliases || []).includes("u3-dup-b.mp4"), JSON.stringify(manifestsB2));

    // ---- Pha C: relink tay bằng file c (cùng bytes, tên mới) ----
    await rewriteAutosaveClipSrc(cdp, "u3-dup-b.mp4", "missing-u3.png");
    await reloadAndWaitProject(cdp, "Dự án mẫu");
    const beforeC = await relinkState(cdp);
    check("phaC.relinkShownForMissing", beforeC.relinkPresent && beforeC.relinkText.includes("missing-u3.png"), beforeC.relinkText.slice(0, 300));
    if (beforeC.relinkPresent) {
      const pickStarted = await cdp.evalJs(`(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').includes('missing-u3.png'));
        if (!btn) return false;
        btn.click();
        return true;
      })()`);
      log(`[pha C] bấm Chọn lại: ${pickStarted}`);
      await sleep(500);
      await cdp.setInputFiles('[aria-label="Media thiếu"] input[type="file"]', [PNG_C]);
      await waitFor(async () => {
        const st = await relinkState(cdp);
        return !st.relinkPresent && st.binText.includes("u3-relink-c.mp4") ? true : null;
      }, 30000, "relink xong (panel đóng, bin có u3-relink-c.mp4)");
      log("[pha C] relink xong trong phiên");
      // QUAN TRỌNG (lỗi probe đợt 1): relink commit chỉ kích hoạt autosave
      // debounce 5s — reload ngay lúc này sẽ đọc lại autosave cũ (vẫn còn
      // missing-u3.png) và làm mất spec vừa relink. Phải chờ autosave mới
      // chứa u3-relink-c.mp4 rồi mới reload (ingest AssetStore thì đã await
      // đủ trước khi relink resolve, chỉ autosave là debounce).
      await waitFor(async () => {
        const raw = await cdp.evalJs(`localStorage.getItem(${JSON.stringify(AUTOSAVE_KEY)})`);
        return raw && raw.includes("u3-relink-c.mp4") ? true : null;
      }, 30000, "autosave sau relink chứa u3-relink-c.mp4");
      log("[pha C] autosave đã bền spec relink");
      // reload ngay sau relink (ingest đã await đủ trước khi relink resolve)
      await reloadAndWaitProject(cdp, "Dự án mẫu");
      const afterC = await relinkState(cdp);
      check("phaC.noRelinkAfterRelinkReload", !afterC.relinkPresent, afterC.relinkText);
      check("phaC.binHasC", afterC.binText.includes("u3-relink-c.mp4"), afterC.binText.slice(0, 300));
      const manifestsC = await readManifests(cdp);
      const mC = (manifestsC || []).find((m) => (m.aliases || []).includes("u3-relink-c.mp4") || m.originalName === "u3-relink-c.mp4");
      check("phaC.aliasOrManifestForC", !!mC, JSON.stringify(manifestsC));
    } else {
      check("phaC.noRelinkAfterRelinkReload", false, "pha C không vào được panel Relink nên không relink được");
      check("phaC.binHasC", false, "không relink được");
      check("phaC.aliasOrManifestForC", false, "không relink được");
    }

    // ---- Pha D: đối chứng âm ----
    await rewriteAutosaveClipSrc(cdp, "u3-relink-c.mp4", "file-that-does-not-exist-u3.mp4");
    await reloadAndWaitProject(cdp, "Dự án mẫu");
    const afterD = await relinkState(cdp);
    check("phaD.relinkShownForRealMissing", afterD.relinkPresent && afterD.relinkText.includes("file-that-does-not-exist-u3.mp4"), afterD.relinkText.slice(0, 300));

    // ---- Pha E: export sau reload qua bridge thật (thử, không bịa) ----
    if (TRY_BRIDGE) {
      try {
        bridgeProc = spawn("node", ["src/index.js", "--port", "8787"], {
          cwd: path.join(ROOT, "server", "bridge"),
          stdio: "ignore",
          // Đợt 66 T9 — trước đây không có env (kế thừa env cha) nên dùng file persist mặc định chung;
          // nay đặt persist riêng theo PID để tránh rò mốc limiter sang test khác (đợt 65 §3b).
          env: { ...process.env, BRIDGE_PORT: "8787", BRIDGE_RATE_PERSIST_PATH: path.join(os.tmpdir(), `vcut-u3-bridge-${process.pid}-rate-limit.json`) },
        });
        const bridgeUp = await waitFor(async () => {
          try {
            const res = await fetch("http://127.0.0.1:8787/api/health", { signal: AbortSignal.timeout(2000) });
            return res.ok ? true : null;
          } catch { return null; }
        }, 30000, "bridge /api/health");
        log(`[pha E] bridge lên: ${bridgeUp}`);
        // Khôi phục project về trạng thái có media thật để export: đổi
        // clip đối chứng âm về u3-relink-c.mp4 rồi reload.
        await rewriteAutosaveClipSrc(cdp, "file-that-does-not-exist-u3.mp4", "u3-relink-c.mp4");
        await reloadAndWaitProject(cdp, "Dự án mẫu");
        const afterRestore = await relinkState(cdp);
        check("phaE.restoredNoRelink", !afterRestore.relinkPresent, afterRestore.relinkText);
        // Mở ExportPanel đúng nút TopBar (data-tour=export). Lỗi đợt 1:
        // chọn nút theo text /xuất|export/ đã bấm nhầm nút tour "Bắt đầu".
        const exportOpened = await cdp.evalJs(`(() => {
          const b = document.querySelector('button[data-tour="export"]');
          if (!b) return false;
          b.click();
          return true;
        })()`);
        log(`[pha E] mở ExportPanel: ${exportOpened}`);
        await sleep(2000);
        const exportPanel = await cdp.evalJs(`(() => document.querySelector('[aria-label="Xuất video"]') !== null)()`);
        check("phaE.exportPanelOpened", !!exportOpened && !!exportPanel, `opened=${exportOpened} dialog=${exportPanel}`);
        // Nút render trong chính dialog Xuất video (text "🎬 Xuất MP4 ...").
        const renderClicked = await cdp.evalJs(`(() => {
          const dlg = document.querySelector('[aria-label="Xuất video"]');
          if (!dlg) return 'no-dialog';
          const b = [...dlg.querySelectorAll('button')].find((x) => (x.innerText || '').startsWith('🎬 Xuất MP4'));
          if (!b) return 'no-button:' + [...dlg.querySelectorAll('button')].map((x) => (x.innerText || '').slice(0, 30)).join('|').slice(0, 300);
          if (b.disabled) return 'disabled:' + (b.innerText || '').slice(0, 50);
          b.click();
          return 'clicked:' + (b.innerText || '').slice(0, 50);
        })()`);
        log(`[pha E] nút render: ${renderClicked}`);
        // Chờ "✅ Render xong!" tối đa 180s, rồi bấm "Tải xuống MP4" với
        // downloadPath về /tmp để kiểm chứng file thật (size > 0).
        let exportDone = false;
        let exportText = "";
        try {
          await waitFor(async () => {
            exportText = await cdp.evalJs(`(() => { const dlg = document.querySelector('[aria-label="Xuất video"]'); return dlg ? dlg.innerText.slice(0, 4000) : document.body.innerText.slice(0, 4000); })()`);
            return exportText.includes("Render xong!") ? true : null;
          }, 180000, "export hoàn thành (Render xong!)");
          exportDone = true;
        } catch { exportDone = false; }
        check("phaE.exportViaBridgeDone", exportDone, exportText.slice(0, 2000));
        if (exportDone) {
          const dlDir = "/tmp/vcut-u3-downloads";
          fs.mkdirSync(dlDir, { recursive: true });
          for (const f of fs.readdirSync(dlDir)) fs.rmSync(path.join(dlDir, f), { force: true });
          await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
          await cdp.evalJs(`(() => {
            const dlg = document.querySelector('[aria-label="Xuất video"]');
            const b = dlg ? [...dlg.querySelectorAll('button')].find((x) => (x.innerText || '').includes('Tải xuống MP4')) : null;
            if (!b) return false;
            b.click();
            return true;
          })()`);
          let dlFile = "";
          try {
            await waitFor(async () => {
              const files = fs.readdirSync(dlDir).filter((f) => f.endsWith(".mp4"));
              if (files.length > 0) { dlFile = files[0]; return true; }
              return null;
            }, 60000, "file MP4 tải về");
          } catch { dlFile = ""; }
          const dlSize = dlFile ? fs.statSync(path.join(dlDir, dlFile)).size : 0;
          check("phaE.mp4Downloaded", !!dlFile && dlSize > 0, dlFile ? `${dlFile} ${dlSize} bytes` : "không có file mp4 tải về");
        } else {
          check("phaE.mp4Downloaded", false, "render chưa xong nên không tải được");
        }
      } catch (e) {
        check("phaE.exportViaBridgeDone", false, `pha E lỗi setup: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        kill(bridgeProc);
      }
    }

    const allPass = Object.values(results).every((r) => r.pass);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileEpermRetry(OUT, JSON.stringify({ allPass, results }, null, 2));
    log(`\nallPass=${allPass} → ${OUT}`);
    cdp.close();
  } finally {
    kill(chrome);
    kill(bridgeProc);
  }
}

async function main() {
  if (!CHROME) {
    console.error("Không tìm thấy Chrome (Playwright / meta-chromium).");
    process.exit(2);
  }
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error(`Chưa có bundle probe ở ${DIST} — chạy vite build trước.`);
    process.exit(2);
  }
  // Tạo 3 file MP4 test cùng bytes chính xác (2s, 128×128, có audio
  // silent — dùng video thật thay cho PNG như đợt chạy 1, vì clip ảnh
  // trên video track bị render worker từ chối hợp lệ ở pha E (P0-03),
  // làm pha export fail không phải do rehydrate). File gốc render 1 lần
  // bằng ffmpeg rồi copy ra 2 tên còn lại để bytes khớp tuyệt đối.
  const tmpMp4 = path.join(DIST, "u3-dup-src.mp4");
  const ff = spawnSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=128x128:rate=30",
    "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", tmpMp4,
  ], { stdio: "ignore" });
  if (ff.status !== 0 || !fs.existsSync(tmpMp4)) {
    console.error("Không tạo được MP4 test bằng ffmpeg.");
    process.exit(2);
  }
  fs.copyFileSync(tmpMp4, PNG_A);
  fs.copyFileSync(tmpMp4, PNG_B);
  fs.copyFileSync(tmpMp4, PNG_C);
  const serverProc = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
    cwd: DIST,
    stdio: "ignore",
  });
  await sleep(1500);
  try {
    await runBrowser(serverProc);
  } finally {
    kill(serverProc);
  }
}

main().catch((e) => {
  console.error(`probe lỗi: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(2);
});
