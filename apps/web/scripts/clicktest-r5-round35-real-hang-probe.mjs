#!/usr/bin/env node
/**
 * clicktest-r5-round35-real-hang-probe.mjs — Phase 9 đợt 35, luồng R5.
 *
 * Chứng minh LẦN TREO THẬT có snapshot (nợ đợt 34 §3 mục 5 — đợt 34
 * chỉ có treo giả lập bằng stub/timeout rút ngắn):
 *
 *   - Chrome thật (Playwright cache, headless=new) serve dist thật
 *     apps/web/dist qua server tĩnh nội bộ (mẫu seek-o3), navigate
 *     tới đó, xác nhận bundle đã nạp qua performance resource
 *     entries, rồi mới treo.
 *   - Lần treo THẬT: Runtime.evaluate với awaitPromise:true trên
 *     `new Promise(()=>{})` — promise không bao giờ settle nên
 *     trình duyệt THẬT giữ response, không phải mock setTimeout hay
 *     stub ws không gửi. Timeout handler của send() (mẫu mobile
 *     sau sửa R5: timeout + snapshot + reject gốc) phải kích hoạt
 *     sau đúng timeoutMs, ghi snapshot bền, rồi reject đúng câu
 *     timeout; sau đó trình duyệt vẫn sống (Target.getTargets vẫn
 *     resolve) — chứng tỏ chỉ lệnh đó treo, không phải Chrome chết.
 *   - Hồi quy (d): lệnh CDP không tồn tại phải REJECT với lỗi gốc
 *     verbatim (code -32601), không resolve undefined như mobile cũ.
 *   - Bundle helper (b): snapshotBundleFromDist trên dist thật đang
 *     serve + fixture dist; snapshot trực tiếp qua cdp-snapshot.mjs
 *     phải có status "captured" + dist path + sha.
 *   - Wiring tĩnh (T5): các file harness đã sửa phải chứa đúng mẫu
 *     mới — probe FAIL nếu thiếu, để khỏi chỉ "tin" vào sửa tay.
 *
 * Kỷ luật bằng chứng (mẫu đợt 34 Q5): KHÔNG rm thư mục bền; đếm
 * delta file snapshot trước/sau, nhúng toàn bộ nội dung snapshot
 * vào JSON kết quả rồi mới dọn các file probe tự tạo (bằng chứng
 * còn trong JSON), cuối cùng kiểm tra số file trở lại baseline.
 * Dist KHÔNG build lại trong probe (tránh đua build với luồng khác
 * đang chạy song song): dùng dist đã có trên đĩa, ghi rõ sha +
 * mtime của nó vào JSON để đối chiếu, không claim là build của R5.
 *
 * Chạy: node apps/web/scripts/clicktest-r5-round35-real-hang-probe.mjs
 * Kết quả: benchmarks/results/v35-r5-real-hang-probe.json, exit 0
 * khi allPass, ngược lại exit 1.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { snapshotBundleFromDist } from "./cdp-bundle.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPTS_DIR, "..", "..", "..");
const DIST_DIR = path.join(ROOT, "apps/web/dist");
const CDP_PORT = Number(process.env.R5_CDP_PORT || 19435);
const PORT = Number(process.env.R5_PORT || 19436);
const CHROME = process.env.R5_CHROME || path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const OUT = path.join(ROOT, "benchmarks/results/v35-r5-real-hang-probe.json");
const SNAP_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "r5-round35-real-hang-probe");
const HANG_TIMEOUT_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = {};
function check(name, ok, detail = "") { checks[name] = { pass: !!ok, detail: String(detail).slice(0, 500) }; console.log(`${ok ? "PASS" : "FAIL"} ${name} ${detail}`); }
function listSnapFiles() { try { return fs.readdirSync(SNAP_OUT_DIR).filter((f) => f.endsWith(".json")).sort(); } catch { return []; } }

function serve(dir) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p === "/") p = "/index.html";
      const file = path.join(dir, p);
      if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
      const ext = path.extname(file);
      const type = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : ext === ".html" ? "text/html" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(PORT, "127.0.0.1", () => resolve(srv));
  });
}

let ws, nextId = 1;
const pending = new Map();
let chromeProc = null;
let hangBundle = null;

// send() theo ĐÚNG mẫu mobile-touch-check sau sửa R5: timeout +
// snapshot trước reject + d.error reject verbatim. Probe kiểm chứng
// mẫu này trên Chrome thật; T5 kiểm chứng file mobile chứa cùng mẫu.
function send(method, params = {}, timeoutMs = 60000) {
  const id = nextId++;
  return new Promise((res, rej) => {
    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        try {
          const hangSnap = captureCdpHangSnapshot({ proc: chromeProc, pendingCount: pending.size, method, timeoutMs, outDir: SNAP_OUT_DIR, bundle: hangBundle, extra: { transport: "websocket", port: PORT, ...(hangBundle ? { distDir: hangBundle.dist } : {}) } });
          if (hangSnap.file) console.log(`CDP-HANG snapshot đã ghi: ${hangSnap.file}`);
        } catch (e) { console.log(`CDP-HANG snapshot lỗi: ${e.message}`); }
        rej(new Error("cdp timeout " + method));
      }
    }, timeoutMs);
    pending.set(id, { resolve: (v) => { clearTimeout(timer); res(v); }, reject: (e) => { clearTimeout(timer); rej(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error("Thiếu Chromium: " + CHROME);
  if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) throw new Error("Thiếu dist trên đĩa (probe không tự build): " + DIST_DIR);
  hangBundle = snapshotBundleFromDist(DIST_DIR);
  check("bundle.distOnDisk", !!hangBundle, hangBundle ? `${hangBundle.bundle} sha=${hangBundle.sha} source=${hangBundle.source}` : "null");
  const distStat = (() => {
    // Bundle entry nằm ở assets/ (không phải gốc dist): tìm đúng file
    // theo basename để lấy mtime thật, thay vì stat sai đường dẫn.
    const find = (dir, name) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isFile() && e.name === name) return p;
        if (e.isDirectory()) { const hit = find(p, name); if (hit) return hit; }
      }
      return null;
    };
    const bundlePath = hangBundle ? find(DIST_DIR, hangBundle.bundle) : null;
    return { mtime: (bundlePath ? fs.statSync(bundlePath) : fs.statSync(path.join(DIST_DIR, "index.html"))).mtime.toISOString(), bundlePath };
  })();
  const snapBefore = listSnapFiles();
  const server = await serve(DIST_DIR);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "r5-chrome-"));
  chromeProc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  try {
    // Vòng fetch /json theo mẫu đã sửa: AbortSignal từng lần + nhịp cũ.
    let targets = null;
    for (let i = 0; i < 60 && !targets; i++) {
      await sleep(500);
      try {
        const ctrl = new AbortController();
        const at = setTimeout(() => ctrl.abort(), 5000);
        try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`, { signal: ctrl.signal }); const j = await r.json(); if (j.length) targets = j; } finally { clearTimeout(at); }
      } catch { /* chưa lên */ }
    }
    check("chrome.jsonUp", !!targets, targets ? `${targets.length} targets` : "không lấy được /json/list");
    if (!targets) throw new Error("Chrome CDP không lên");
    const page = targets.find((t) => t.type === "page") || targets[0];
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("ws open timeout 30000ms")), 30000);
      ws.onopen = () => { clearTimeout(t); resolve(); };
      ws.onerror = (e) => { clearTimeout(t); reject(new Error("ws open error: " + (e?.message || "WebSocket error"))); };
    });
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) {
        const entry = pending.get(d.id);
        pending.delete(d.id);
        if (d.error) entry.reject(new Error(JSON.stringify(d.error)));
        else entry.resolve(d.result);
      }
    };

    // T1: đường thường resolve, pending rỗng.
    await send("Page.enable");
    await send("Runtime.enable");
    const tg = await send("Target.getTargets");
    check("t1.normalPath", Array.isArray(tg?.targetInfos) && pending.size === 0, `targets=${tg?.targetInfos?.length} pending=${pending.size}`);

    // T2 (d): d.error phải reject verbatim, không resolve undefined.
    let errMsg = null;
    try { const v = await send("Bogus.noSuchMethod", {}, 10000); errMsg = "RESOLVED:" + JSON.stringify(v); }
    catch (e) { errMsg = e.message; }
    let parsed = null;
    try { parsed = JSON.parse(errMsg); } catch { /* không phải JSON */ }
    check("t2.derrorRejectsVerbatim", parsed?.code === -32601, errMsg);
    let errMsg2 = null;
    try { const v = await send("Runtime.evaluate", { expression: 12345 }, 10000); errMsg2 = "RESOLVED:" + JSON.stringify(v); }
    catch (e) { errMsg2 = e.message; }
    let parsed2 = null;
    try { parsed2 = JSON.parse(errMsg2); } catch { /* không phải JSON */ }
    check("t2b.invalidParamsRejects", !!parsed2?.code, errMsg2);

    // T3: treo THẬT — navigate tới dist thật, xác nhận bundle đã nạp,
    // rồi evaluate promise không bao giờ settle.
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
    let bundleLoaded = false;
    for (let i = 0; i < 30 && !bundleLoaded; i++) {
      await sleep(500);
      try {
        const r = await send("Runtime.evaluate", { expression: "performance.getEntriesByType('resource').map(x=>x.name).join('\\n')", returnByValue: true }, 10000);
        bundleLoaded = typeof r?.result?.value === "string" && r.result.value.includes(hangBundle.bundle);
      } catch { /* thử lại */ }
    }
    check("t3.bundleActuallyLoaded", bundleLoaded, `resource entries chứa ${hangBundle.bundle}`);
    const hangStart = Date.now();
    let hangErr = null;
    try { await send("Runtime.evaluate", { expression: "new Promise(()=>{})", awaitPromise: true, returnByValue: true }, HANG_TIMEOUT_MS); hangErr = "RESOLVED-BẤT-NGỜ"; }
    catch (e) { hangErr = e.message; }
    const hangWallMs = Date.now() - hangStart;
    check("t3.realHangRejectsTimeout", hangErr === "cdp timeout Runtime.evaluate", hangErr);
    check("t3.timeoutWallApprox", hangWallMs >= HANG_TIMEOUT_MS - 200 && hangWallMs < HANG_TIMEOUT_MS + 5000, `${hangWallMs}ms (timeout đặt ${HANG_TIMEOUT_MS}ms)`);
    const snapAfter = listSnapFiles();
    const newFiles = snapAfter.filter((f) => !snapBefore.includes(f));
    check("t3.exactlyOneNewSnapshot", newFiles.length === 1, newFiles.join(","));
    let snap = null;
    if (newFiles.length === 1) {
      snap = JSON.parse(fs.readFileSync(path.join(SNAP_OUT_DIR, newFiles[0]), "utf8"));
      check("t3.snapshotFields", snap.method === "Runtime.evaluate" && snap.timeoutMs === HANG_TIMEOUT_MS && !!snap.capturedAt && snap.proc?.pid === chromeProc.pid, `method=${snap.method} timeoutMs=${snap.timeoutMs} pid=${snap.proc?.pid} chromePid=${chromeProc.pid}`);
      check("t3.snapshotBundleCaptured", snap.bundle?.status === "captured" && snap.bundle?.name === hangBundle.bundle && snap.bundle?.sha256_16 === hangBundle.sha && snap.bundle?.dist === hangBundle.dist, JSON.stringify(snap.bundle));
      check("t3.snapshotPendingCount", snap.pendingCount === 0, `pendingCount=${snap.pendingCount}`);
    }
    // Trình duyệt vẫn sống sau treo: lệnh khác vẫn resolve.
    let alive = false;
    try { const t = await send("Target.getTargets", {}, 10000); alive = Array.isArray(t?.targetInfos); } catch { alive = false; }
    check("t3.browserAliveAfterHang", alive && pending.size === 0, `pending=${pending.size}`);

    // T4: bundle helper trên fixture dist + dist thật + snapshot trực tiếp.
    const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "r5-fixture-dist-"));
    fs.mkdirSync(path.join(fixDir, "assets"), { recursive: true });
    const fixJs = "console.log('r5-fixture');";
    writeFileEpermRetry(path.join(fixDir, "assets", "fixture-abc.js"), fixJs);
    writeFileEpermRetry(path.join(fixDir, "index.html"), '<script type="module" src="/assets/fixture-abc.js"></script>');
    const fixBundle = snapshotBundleFromDist(fixDir);
    const fixSha = crypto.createHash("sha256").update(fixJs).digest("hex").slice(0, 16);
    check("t4.fixtureEntryBundle", fixBundle?.bundle === "fixture-abc.js" && fixBundle?.sha === fixSha && fixBundle?.source === "index-entry", JSON.stringify(fixBundle));
    check("t4.missingDirNull", snapshotBundleFromDist(path.join(fixDir, "khong-co")) === null, "null");
    const noIndexDir = fs.mkdtempSync(path.join(os.tmpdir(), "r5-noindex-"));
    check("t4.noIndexNull", snapshotBundleFromDist(noIndexDir) === null, "null");
    const direct = captureCdpHangSnapshot({ proc: chromeProc, pendingCount: 0, method: "R5-direct", timeoutMs: 1, outDir: SNAP_OUT_DIR, bundle: hangBundle, extra: { probe: "direct-captured-path" } });
    let directSnap = null;
    try { directSnap = JSON.parse(fs.readFileSync(direct.file, "utf8")); } catch { /* ghi lỗi */ }
    check("t4.directSnapshotCaptured", directSnap?.bundle?.status === "captured" && directSnap?.bundle?.dist === DIST_DIR, JSON.stringify(directSnap?.bundle));
    // Dọn file probe tự tạo (đã nhúng nội dung vào JSON kết quả dưới):
    // chỉ xóa đúng các file mới của lượt này, KHÔNG rm thư mục.
    const probeFiles = [...newFiles];
    if (direct.file) probeFiles.push(path.basename(direct.file));
    for (const f of probeFiles) { try { fs.unlinkSync(path.join(SNAP_OUT_DIR, f)); } catch {} }
    check("t4.snapshotDirBackToBaseline", JSON.stringify(listSnapFiles()) === JSON.stringify(snapBefore), `trước=${snapBefore.length} sau=${listSnapFiles().length}`);
    fs.rmSync(fixDir, { recursive: true, force: true });
    fs.rmSync(noIndexDir, { recursive: true, force: true });

    // T5: wiring tĩnh — file đã sửa phải chứa đúng mẫu mới.
    const read = (f) => fs.readFileSync(path.join(SCRIPTS_DIR, f), "utf8");
    const mobile = read("mobile-touch-check.mjs");
    check("t5.mobileDerror", mobile.includes("if (d.error) entry.reject(new Error(JSON.stringify(d.error)));"), "d.error reject verbatim");
    check("t5.mobileNoBareResolve", !mobile.includes("\n      entry.resolve(d.result);\n"), "không còn resolve trần");
    check("t5.mobileFetchAbort", mobile.includes("AbortController") && mobile.includes("CDP_JSON_ATTEMPT_TIMEOUT_MS"), "fetch abort");
    check("t5.mobileWsOpenTimeout", mobile.includes("ws open timeout") && mobile.includes("CDP_WS_OPEN_TIMEOUT_MS"), "open timeout");
    check("t5.mobileBundle", mobile.includes("snapshotBundleFromDist") && mobile.includes("bundle: HANG_BUNDLE"), "bundle wiring");
    const o3 = read("seek-o3-browser-probe.mjs");
    const p2 = read("seek-p2-underload-probe.mjs");
    check("t5.o3Bundle", o3.includes("snapshotBundleFromDist(SNAP)") && o3.includes("bundle: HANG_BUNDLE"), "o3 SNAP bundle");
    check("t5.p2Bundle", p2.includes("snapshotBundleFromDist(SNAP)") && p2.includes("bundle: HANG_BUNDLE"), "p2 SNAP bundle");
    check("t5.o3p2FetchAbort", o3.includes("AbortController") && p2.includes("AbortController"), "o3+p2 fetch abort");
    const cp = read("check-proxy-auto.mjs");
    check("t5.checkProxyBundle", cp.includes("snapshotBundleFromDist(process.env.CHECK_PROXY_DIST_DIR"), "check-proxy dist tùy chọn");
    const snapMod = read("cdp-snapshot.mjs");
    check("t5.snapshotDistPassthrough", snapMod.includes("bundle.dist ?? bundle.dir"), "bundle.dist passthrough");
    // Kiểm kê: mọi harness WS đã nối snapshot đều reject d.error.
    const wsFiles = ["bench-preview-fps.mjs", "check-proxy-auto.mjs", "seek-o3-browser-probe.mjs", "seek-p2-underload-probe.mjs", "mobile-touch-check.mjs"];
    const bad = wsFiles.filter((f) => { const c = read(f); return !(c.includes("d.error") || c.includes("msg.error")); });
    check("t5.allWsDerror", bad.length === 0, bad.length ? `thiếu: ${bad.join(",")}` : "5/5 harness WS reject d.error");

    const result = {
      date: new Date().toISOString(), allPass: Object.values(checks).every((c) => c.pass),
      chromePid: chromeProc.pid, cdpPort: CDP_PORT, servePort: PORT,
      dist: { dir: DIST_DIR, bundle: hangBundle?.bundle ?? null, sha256_16: hangBundle?.sha ?? null, mtime: distStat.mtime, bundlePath: distStat.bundlePath, note: "Dist đã có trên đĩa lúc chạy probe (probe không tự build để tránh đua với luồng khác); sha/mtime ghi để đối chiếu, không claim là build của R5." },
      hang: { method: "Runtime.evaluate", timeoutMs: HANG_TIMEOUT_MS, wallMs: hangWallMs, rejectError: hangErr, snapshotFile: newFiles[0] || null, snapshot: snap },
      derror: { unknownMethodError: errMsg, invalidParamsError: errMsg2 },
      checks,
    };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileEpermRetry(OUT, JSON.stringify(result, null, 2));
    console.log(`Kết quả: ${OUT} allPass=${result.allPass}`);
    return result.allPass;
  } finally {
    try { ws?.close(); } catch {}
    try { server.close(); } catch {}
    try { chromeProc?.kill(); } catch {}
  }
}

const ok = await main();
process.exit(ok ? 0 : 1);
