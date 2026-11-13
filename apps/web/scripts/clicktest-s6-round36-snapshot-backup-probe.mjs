#!/usr/bin/env node
/**
 * clicktest-s6-round36-snapshot-backup-probe.mjs — Phase 9 đợt 36, luồng S6.
 *
 * Kiểm chứng 4 mảnh của S6 (nợ §3.6 docs/PHASE9_ROUND35_LIMITS.md):
 *
 *   (a) Backup bền snapshot: cdp-snapshot-backup.mjs trên thư mục nguồn
 *       GIẢ (tmp, không đụng thư mục snapshot thật) — backup → verify
 *       OK → sửa 1 byte trong BẢN SAO của backup → verify FAIL → restore
 *       từ backup nguyên vẹn sang thư mục đích tmp → hash khớp.
 *   (b) Đóng băng dist cho harness WS: unit cdp-dist-freeze.mjs trên
 *       fixture dist (manifest xác định, sửa file → verify INVALID,
 *       freezeDistCopy manifest bằng nguồn, copy đích không rỗng → throw)
 *       + kiểm chứng tĩnh rằng bench và seek-o3 đã nối module này
 *       (probe FAIL nếu thiếu chuỗi wiring — không chỉ "tin" sửa tay).
 *   (c) Nối cdp-bundle.mjs cho bench-preview-fps.mjs: kiểm chứng tĩnh
 *       (import + HANG_BUNDLE + bundle truyền vào snapshot + frozenDist
 *       + nhánh exit 3). Đường timeout snapshot của chính bench KHÔNG
 *       được kích hoạt live trong probe này (bench chỉ ghi snapshot khi
 *       CDP timeout trong lúc đo thật — xem LIMITS §5, ghi rõ là nợ).
 *       Bù lại, probe kích hoạt snapshot qua cùng module cdp-snapshot /
 *       cdp-bundle ở phần treo thật dưới đây.
 *   (d) Dạng treo thứ hai ngoài promise không settle: H1 = promise không
 *       settle (lặp lại R5, hồi quy); H2 = page kẹt vòng lặp vô hạn
 *       đồng bộ `while(true){}` (main thread spin). Dấu hiệu phân biệt
 *       KHÔNG phải %cpu trong snapshot (ps lifetime-average không phân
 *       biệt được — đo thật H1 26,2 vs H2 24,3) mà là hành vi thread:
 *       sau H1, evaluate khác trên cùng page vẫn resolve (renderer
 *       rảnh, chỉ promise kia không settle); sau H2, evaluate khác
 *       cũng timeout (renderer kẹt trong vòng lặp), dù lệnh mức
 *       browser (Target.getTargets) vẫn resolve. Cả hai đều là treo
 *       THẬT trên Chrome thật (không stub ws, không rút timer): lệnh
 *       thật không được trả lời, timeout handler kích hoạt sau đúng
 *       timeoutMs, đúng 1 snapshot mới mỗi lần treo, trình duyệt vẫn
 *       sống sau treo.
 *       H2 được gọi là "page kẹt / busy-loop", KHÔNG mạo nhận là
 *       deadlock đa tài nguyên hay Chrome đơ toàn bộ (xem LIMITS §5:
 *       deadlock thật / Chrome đơ toàn bộ vẫn chưa chứng minh).
 *
 * Kỷ luật bằng chứng (mẫu R5): KHÔNG rm thư mục snapshot bền; đếm
 * delta file trước/sau mỗi lần treo, nhúng toàn bộ nội dung 2 snapshot
 * treo vào JSON kết quả rồi mới xóa đúng các file probe tự tạo, cuối
 * cùng kiểm tra thư mục trở lại baseline 0 file mới. Dist KHÔNG build
 * lại trong probe (tránh đua với luồng khác): dùng dist trên đĩa, ghi
 * rõ tên bundle + sha + mtime vào JSON, không claim là build của S6.
 *
 * Chạy: node apps/web/scripts/clicktest-s6-round36-snapshot-backup-probe.mjs
 * Kết quả: benchmarks/results/v36-s6-snapshot-backup-probe.json, exit 0
 * khi allPass, ngược lại exit 1.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";
import { snapshotBundleFromDist } from "./cdp-bundle.mjs";
import { distManifest, verifyDistManifest, freezeDistCopy } from "./cdp-dist-freeze.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPTS_DIR, "..", "..", "..");
const DIST_DIR = path.join(ROOT, "apps/web/dist");
const CDP_PORT = Number(process.env.S6_CDP_PORT || 19447);
const PORT = Number(process.env.S6_PORT || 19448);
const CHROME = process.env.S6_CHROME || path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const OUT = path.join(ROOT, "benchmarks/results/v36-s6-snapshot-backup-probe.json");
const SNAP_OUT_DIR = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots", "s6-round36-snapshot-backup-probe");
const HANG_TIMEOUT_MS = 5000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = {};
function check(name, ok, detail = "") { checks[name] = { pass: !!ok, detail: String(detail).slice(0, 500) }; console.log(`${ok ? "PASS" : "FAIL"} ${name} ${detail}`); }
function listSnapFiles() { try { return fs.readdirSync(SNAP_OUT_DIR).filter((f) => f.endsWith(".json")).sort(); } catch { return []; } }
function maxChromeCpu(psText) {
  let max = null;
  for (const line of String(psText || "").split("\n")) {
    if (!line.includes("chrome")) continue;
    const parts = line.trim().split(/\s+/);
    const cpu = Number(parts[4]);
    if (Number.isFinite(cpu) && (max === null || cpu > max)) max = cpu;
  }
  return max;
}

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
  // ---- (b) unit đóng băng dist trên fixture ----
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), "s6-fixture-dist-"));
  fs.mkdirSync(path.join(fixDir, "assets"), { recursive: true });
  writeFileEpermRetry(path.join(fixDir, "index.html"), '<script type="module" src="/assets/fixture-s6.js"></script>');
  writeFileEpermRetry(path.join(fixDir, "assets", "fixture-s6.js"), "console.log('s6-fixture');");
  const m1 = distManifest(fixDir);
  const m2 = distManifest(fixDir);
  check("u1.manifestDeterministic", m1.manifestSha256 === m2.manifestSha256 && m1.fileCount === 2, `manifest=${m1.manifestSha256} files=${m1.fileCount}`);
  const copyDir = path.join(os.tmpdir(), `s6-fixture-dist-copy-${process.pid}`);
  const frozen = freezeDistCopy(fixDir, copyDir);
  check("u2.freezeCopyMatches", frozen.manifest.manifestSha256 === m1.manifestSha256, `copy=${frozen.manifest.manifestSha256}`);
  let copyNonEmptyThrew = false;
  try { freezeDistCopy(fixDir, copyDir); } catch { copyNonEmptyThrew = true; }
  check("u3.freezeCopyNonEmptyThrows", copyNonEmptyThrew, "đích không rỗng → throw, không tự xóa");
  fs.appendFileSync(path.join(fixDir, "assets", "fixture-s6.js"), "// tamper\n");
  const vTamper = verifyDistManifest(fixDir, m1);
  check("u4.tamperInvalid", !vTamper.valid && vTamper.problems.length > 0, vTamper.problems.join(" | "));
  const vCopyUntouched = verifyDistManifest(copyDir, m1);
  check("u5.untouchedCopyStillValid", vCopyUntouched.valid, `copy manifest=${vCopyUntouched.manifest.manifestSha256}`);

  // ---- (a) backup e2e trên thư mục giả (tmp) ----
  const fakeSrc = fs.mkdtempSync(path.join(os.tmpdir(), "s6-fake-snap-src-"));
  const fakeBackupRoot = fs.mkdtempSync(path.join(os.tmpdir(), "s6-fake-backup-root-"));
  fs.mkdirSync(path.join(fakeSrc, "bench-preview-fps"), { recursive: true });
  fs.mkdirSync(path.join(fakeSrc, "seek-o3-browser-probe"), { recursive: true });
  const snapA = JSON.stringify({ method: "Runtime.evaluate", bundle: { status: "captured" } }, null, 2);
  const snapB = JSON.stringify({ method: "Target.getTargets", bundle: { status: "not-captured" } }, null, 2);
  writeFileEpermRetry(path.join(fakeSrc, "bench-preview-fps", "snap-a.json"), snapA);
  writeFileEpermRetry(path.join(fakeSrc, "seek-o3-browser-probe", "snap-b.json"), snapB);
  const backupEnv = { ...process.env, CDP_SNAP_SRC: fakeSrc, CDP_SNAP_BACKUP_ROOT: fakeBackupRoot };
  const backupRun = spawnSync("node", [path.join(SCRIPTS_DIR, "cdp-snapshot-backup.mjs")], { env: backupEnv, encoding: "utf8" });
  const backupDirs = fs.readdirSync(fakeBackupRoot).filter((d) => d !== "index.json");
  check("a1.backupExit0OneDir", backupRun.status === 0 && backupDirs.length === 1, `exit=${backupRun.status} dirs=${backupDirs.join(",")} out=${(backupRun.stdout || "").trim().split("\n").pop()}`);
  const backupDir = backupDirs.length === 1 ? path.join(fakeBackupRoot, backupDirs[0]) : null;
  let backupManifest = null;
  try { backupManifest = JSON.parse(fs.readFileSync(path.join(backupDir, "manifest.json"), "utf8")); } catch {}
  check("a2.backupManifest2Files", backupManifest?.fileCount === 2, `fileCount=${backupManifest?.fileCount}`);
  const verifyRun = backupDir ? spawnSync("node", [path.join(SCRIPTS_DIR, "cdp-snapshot-backup.mjs"), "--verify", backupDir], { encoding: "utf8" }) : null;
  check("a3.verifyOk", verifyRun?.status === 0, `exit=${verifyRun?.status}`);
  // Sửa 1 byte trong BẢN SAO của backup → verify phải FAIL (không đụng backup gốc).
  const tamperedCopy = fs.mkdtempSync(path.join(os.tmpdir(), "s6-tampered-backup-"));
  if (backupDir) fs.cpSync(backupDir, tamperedCopy, { recursive: true });
  if (backupDir) fs.appendFileSync(path.join(tamperedCopy, "bench-preview-fps", "snap-a.json"), " ");
  const verifyTampered = backupDir ? spawnSync("node", [path.join(SCRIPTS_DIR, "cdp-snapshot-backup.mjs"), "--verify", tamperedCopy], { encoding: "utf8" }) : null;
  check("a4.tamperedVerifyFails", verifyTampered?.status === 1, `exit=${verifyTampered?.status}`);
  const restoreTarget = fs.mkdtempSync(path.join(os.tmpdir(), "s6-restore-target-"));
  const restoreRun = backupDir ? spawnSync("node", [path.join(SCRIPTS_DIR, "cdp-snapshot-backup.mjs"), "--restore", backupDir], { env: { ...process.env, CDP_SNAP_RESTORE_TARGET: restoreTarget }, encoding: "utf8" }) : null;
  let restoreOk = false;
  try {
    restoreOk = restoreRun?.status === 0
      && fs.readFileSync(path.join(restoreTarget, "bench-preview-fps", "snap-a.json"), "utf8") === snapA
      && fs.readFileSync(path.join(restoreTarget, "seek-o3-browser-probe", "snap-b.json"), "utf8") === snapB;
  } catch {}
  check("a5.restoreHashesMatch", restoreOk, `exit=${restoreRun?.status}`);

  // ---- (c)+(b) kiểm chứng tĩnh wiring ----
  const read = (f) => fs.readFileSync(path.join(SCRIPTS_DIR, f), "utf8");
  const bench = read("bench-preview-fps.mjs");
  check("w1.benchBundleWiring", bench.includes('from "./cdp-bundle.mjs"') && bench.includes("snapshotBundleFromDist(BENCH_DIST_DIR)") && bench.includes("bundle: HANG_BUNDLE"), "import + HANG_BUNDLE + truyền vào snapshot");
  check("w2.benchFreezeWiring", bench.includes('from "./cdp-dist-freeze.mjs"') && bench.includes("distManifest(BENCH_DIST_DIR)") && bench.includes("frozenDist") && bench.includes("process.exitCode = 3"), "manifest trước/sau + frozenDist + exit 3");
  const o3 = read("seek-o3-browser-probe.mjs");
  check("w3.seekO3FreezeWiring", o3.includes('from "./cdp-dist-freeze.mjs"') && o3.includes("distManifest(SNAP)") && o3.includes("out.frozenDist"), "seek-o3 manifest SNAP + frozenDist");
  const backupScript = read("cdp-snapshot-backup.mjs");
  check("w4.backupScriptModes", backupScript.includes("--verify") && backupScript.includes("--restore") && backupScript.includes("manifest.json"), "backup/verify/restore + manifest");

  // ---- (d) treo thật H1 + H2 trên Chrome thật ----
  if (!fs.existsSync(CHROME)) throw new Error("Thiếu Chromium: " + CHROME);
  if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) throw new Error("Thiếu dist trên đĩa (probe không tự build): " + DIST_DIR);
  hangBundle = snapshotBundleFromDist(DIST_DIR);
  check("h0.bundleOnDisk", !!hangBundle, hangBundle ? `${hangBundle.bundle} sha=${hangBundle.sha} source=${hangBundle.source}` : "null");
  const bundleMtime = (() => {
    const find = (dir, name) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isFile() && e.name === name) return p;
        if (e.isDirectory()) { const hit = find(p, name); if (hit) return hit; }
      }
      return null;
    };
    const bp = hangBundle ? find(DIST_DIR, hangBundle.bundle) : null;
    return (bp ? fs.statSync(bp) : fs.statSync(path.join(DIST_DIR, "index.html"))).mtime.toISOString();
  })();
  const snapBefore = listSnapFiles();
  const server = await serve(DIST_DIR);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "s6-chrome-"));
  chromeProc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  const hangResults = {};
  try {
    let targets = null;
    for (let i = 0; i < 60 && !targets; i++) {
      await sleep(500);
      try {
        const ctrl = new AbortController();
        const at = setTimeout(() => ctrl.abort(), 5000);
        try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`, { signal: ctrl.signal }); const j = await r.json(); if (j.length) targets = j; } finally { clearTimeout(at); }
      } catch { /* chưa lên */ }
    }
    check("h.chromeJsonUp", !!targets, targets ? `${targets.length} targets` : "không lấy được /json/list");
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
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
    let bundleLoaded = false;
    for (let i = 0; i < 30 && !bundleLoaded; i++) {
      await sleep(500);
      try {
        const r = await send("Runtime.evaluate", { expression: "performance.getEntriesByType('resource').map(x=>x.name).join('\\n')", returnByValue: true }, 10000);
        bundleLoaded = typeof r?.result?.value === "string" && r.result.value.includes(hangBundle.bundle);
      } catch { /* thử lại */ }
    }
    check("h.bundleActuallyLoaded", bundleLoaded, `resource entries chứa ${hangBundle.bundle}`);

    // H1: promise không settle (hồi quy R5).
    const beforeH1 = listSnapFiles();
    const h1Start = Date.now();
    let h1Err = null;
    try { await send("Runtime.evaluate", { expression: "new Promise(()=>{})", awaitPromise: true, returnByValue: true }, HANG_TIMEOUT_MS); h1Err = "RESOLVED-BẤT-NGỜ"; }
    catch (e) { h1Err = e.message; }
    const h1Wall = Date.now() - h1Start;
    const h1New = listSnapFiles().filter((f) => !beforeH1.includes(f));
    let h1Snap = null;
    if (h1New.length === 1) { try { h1Snap = JSON.parse(fs.readFileSync(path.join(SNAP_OUT_DIR, h1New[0]), "utf8")); } catch {} }
    check("h1.timeoutRejects", h1Err === "cdp timeout Runtime.evaluate", h1Err);
    check("h1.wallApprox", h1Wall >= HANG_TIMEOUT_MS - 200 && h1Wall < HANG_TIMEOUT_MS + 5000, `${h1Wall}ms (đặt ${HANG_TIMEOUT_MS}ms)`);
    check("h1.exactlyOneSnapshot", h1New.length === 1, h1New.join(","));
    check("h1.snapshotFields", h1Snap?.method === "Runtime.evaluate" && h1Snap?.timeoutMs === HANG_TIMEOUT_MS && h1Snap?.proc?.pid === chromeProc.pid && h1Snap?.bundle?.status === "captured", JSON.stringify(h1Snap?.bundle));
    hangResults.h1 = { wallMs: h1Wall, snapshot: h1Snap, maxChromeCpuAtHang: maxChromeCpu(h1Snap?.ps) };
    let alive1 = false;
    try { const t = await send("Target.getTargets", {}, 10000); alive1 = Array.isArray(t?.targetInfos); } catch { alive1 = false; }
    check("h1.browserAliveAfter", alive1 && pending.size === 0, `pending=${pending.size}`);
    // Dấu hiệu phân biệt H1: renderer vẫn RẢNH sau treo idle — evaluate
    // khác trên cùng page phải resolve ngay (chứng tỏ chỉ promise kia
    // không settle, không phải thread kẹt).
    let h1Free = null;
    try { h1Free = await send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, 10000); } catch (e) { h1Free = `LỖI: ${e.message}`; }
    check("h1.rendererStillFree", h1Free?.result?.value === 2, JSON.stringify(h1Free));

    // H2: page kẹt vòng lặp vô hạn đồng bộ (busy-loop, khác H1 idle).
    const beforeH2 = listSnapFiles();
    const h2Start = Date.now();
    let h2Err = null;
    try { await send("Runtime.evaluate", { expression: "while(true){}", returnByValue: true }, HANG_TIMEOUT_MS); h2Err = "RESOLVED-BẤT-NGỜ"; }
    catch (e) { h2Err = e.message; }
    const h2Wall = Date.now() - h2Start;
    const h2New = listSnapFiles().filter((f) => !beforeH2.includes(f));
    let h2Snap = null;
    if (h2New.length === 1) { try { h2Snap = JSON.parse(fs.readFileSync(path.join(SNAP_OUT_DIR, h2New[0]), "utf8")); } catch {} }
    check("h2.timeoutRejects", h2Err === "cdp timeout Runtime.evaluate", h2Err);
    check("h2.wallApprox", h2Wall >= HANG_TIMEOUT_MS - 200 && h2Wall < HANG_TIMEOUT_MS + 5000, `${h2Wall}ms (đặt ${HANG_TIMEOUT_MS}ms)`);
    check("h2.exactlyOneSnapshot", h2New.length === 1, h2New.join(","));
    check("h2.snapshotFields", h2Snap?.method === "Runtime.evaluate" && h2Snap?.timeoutMs === HANG_TIMEOUT_MS && h2Snap?.proc?.pid === chromeProc.pid && h2Snap?.bundle?.status === "captured", JSON.stringify(h2Snap?.bundle));
    hangResults.h2 = { wallMs: h2Wall, snapshot: h2Snap, maxChromeCpuAtHang: maxChromeCpu(h2Snap?.ps) };
    // Chữ ký CPU từ snapshot (ps %cpu lifetime-average): GHI SỐ THẬT
    // dưới dạng đo thông tin, KHÔNG dùng làm check phân biệt — lần chạy
    // đầu cho thấy nó không phân biệt được (H1 26,2 vs H2 24,3: trung
    // bình lifetime bị pha loãng bởi thời gian page load trước đó).
    // Dấu hiệu phân biệt thật là hành vi ở dưới (renderer kẹt/bận).
    check("h2.cpuSignatureRecorded", hangResults.h2.maxChromeCpuAtHang !== null && hangResults.h1.maxChromeCpuAtHang !== null, `H1 maxCpu=${hangResults.h1.maxChromeCpuAtHang} H2 maxCpu=${hangResults.h2.maxChromeCpuAtHang} (lifetime-average, không phân biệt — xem LIMITS §5)`);
    let alive2 = false;
    try { const t = await send("Target.getTargets", {}, 10000); alive2 = Array.isArray(t?.targetInfos); } catch { alive2 = false; }
    check("h2.browserAliveAfter", alive2 && pending.size === 0, `pending=${pending.size} (Target.getTargets ở mức browser vẫn trả lời dù renderer spin)`);
    // Dấu hiệu phân biệt H2: renderer KẸT — evaluate khác trên cùng page
    // cũng phải timeout (thread chính vẫn quay trong while(true)), dù
    // browser-level vẫn sống ở check trên. Lần timeout này ghi thêm
    // đúng 1 snapshot nữa (timeoutMs 3000) — probe đếm và dọn nó cùng
    // các snapshot treo, không để lọt khỏi kiểm đếm.
    const beforeBlocked = listSnapFiles();
    let blockedErr = null;
    try { await send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, 3000); blockedErr = "RESOLVED-BẤT-NGỜ"; }
    catch (e) { blockedErr = e.message; }
    const blockedNew = listSnapFiles().filter((f) => !beforeBlocked.includes(f));
    let blockedSnap = null;
    if (blockedNew.length === 1) { try { blockedSnap = JSON.parse(fs.readFileSync(path.join(SNAP_OUT_DIR, blockedNew[0]), "utf8")); } catch {} }
    check("h2.rendererBlocked", blockedErr === "cdp timeout Runtime.evaluate" && blockedNew.length === 1 && blockedSnap?.timeoutMs === 3000, `err=${blockedErr} newSnapshots=${blockedNew.length} timeoutMs=${blockedSnap?.timeoutMs}`);
    hangResults.h2BlockedProbe = { error: blockedErr, snapshot: blockedSnap };

    // Dọn file probe tự tạo, thư mục trở lại baseline.
    const probeFiles = [...h1New, ...h2New, ...blockedNew];
    for (const f of probeFiles) { try { fs.unlinkSync(path.join(SNAP_OUT_DIR, f)); } catch {} }
    check("h.cleanupDirBackToBaseline", JSON.stringify(listSnapFiles()) === JSON.stringify(snapBefore), `trước=${snapBefore.length} sau=${listSnapFiles().length}`);
  } finally {
    try { ws?.close(); } catch {}
    try { chromeProc?.kill("SIGKILL"); } catch {}
    try { server?.close(); } catch {}
  }
  // Dọn tmp fixture (không đụng thư mục snapshot bền thật).
  try { fs.rmSync(fixDir, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(copyDir, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(fakeSrc, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(fakeBackupRoot, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(tamperedCopy, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(restoreTarget, { recursive: true, force: true }); } catch {}

  const allPass = Object.values(checks).every((c) => c.pass);
  const result = {
    date: new Date().toISOString(),
    allPass,
    checks,
    dist: { dir: DIST_DIR, bundle: hangBundle, bundleMtime },
    hangResults,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileEpermRetry(OUT, JSON.stringify(result, null, 2) + "\n");
  console.log(`allPass=${allPass} -> ${OUT}`);
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error("PROBE LỖI:", e);
  try { chromeProc?.kill("SIGKILL"); } catch {}
  process.exit(1);
});
