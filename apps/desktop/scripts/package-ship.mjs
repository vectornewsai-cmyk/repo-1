#!/usr/bin/env node
/**
 * package-ship.mjs — Đóng gói + kiểm chứng AppImage VCut Studio theo đúng
 * QUYẾT ĐỊNH SHIP của đợt 82 J8 (xem docs/PHASE9_ROUND82_J8_ELECTRON_SHIP_SERVICES_LIMITS.md).
 *
 * Profile:
 *   full (mặc định) — AppImage ~557 MB: bridge + render + 4 slim venv Python
 *     (caption/tts/reframe/bgremove) đã bundle; model AI (~3,7 GB) KHÔNG bundle,
 *     tải lần đầu trong app (modelDownloader, resume + SHA256).
 *   minimal — AppImage ~148 MB: chỉ bridge + render, KHÔNG venv. AI chỉ chạy
 *     khi máy user đã có Python + deps hệ thống (đường fallback), hoặc sau khi
 *     user tự chuẩn bị venv. Dùng cho máy ít đĩa / CI.
 *
 * Các bước (mỗi bước in PASS/FAIL, cuối in JSON tóm tắt, exit != 0 nếu có FAIL):
 *   1. Build desktop (tsc + copy-services-js) — chạy TRỰC TIẾP bằng node,
 *      không qua npm/npx (npm trên VM này thỉnh thoảng EPERM khi mở log file).
 *   2. prepackage với VCUT_BUNDLE_SLIM_VENV theo profile (full: 4 venv).
 *   3. electron-builder --linux AppImage (CLI trực tiếp, không qua npx),
 *      output riêng dưới --work (KHÔNG đè apps/desktop/release/ — bài học H8:
 *      nhiều luồng build đè nhau).
 *   4. Verify artifact: sha256 + size; linux-unpacked chứa vcut-server, venv
 *      đúng profile, KHÔNG chứa models/; venv python --version + import chạy được.
 *   5. Probe AI trên cây đã đóng gói (KHÔNG cần Electron): probeAllPythonServices
 *      deep (import module nặng) với VCUT_MODELS_DIR trỏ thư mục model mẫu
 *      (symlink tới model thật trong repo + ~/.u2net). KHÔNG chạy TTS/caption
 *      thật — chỉ probe available/reason.
 *   6. Smoke AppImage thật dưới Xvfb (VCUT_DESKTOP_SMOKE=1): bridge tự start
 *      qua bin/vcut-node, UI load, thoát sạch, không mồ côi.
 *   7. Orphan: kill -9 cả nhóm Electron → bridge mồ côi còn sống (đúng kỳ vọng) →
 *      mở lại app (cùng userData) → manager dọn chết bridge cũ (pidfile H7),
 *      bridge mới healthy. Đây là kiểm chứng lại cơ chế H7 trên AppImage ship.
 *
 * Fail-fast: bước build/prepackage/builder/verify fail thì DỪNG NGAY, không
 * build/smoke gói từ cây stage cũ (đã gặp ở run1 J8).
 * Chống sóng EPERM: các bước build retry tối đa 5 lần cách nhau 20s (sóng
 * EPERM trên VM này bật/tắt theo phút — xem I5 §7.8, LIMITS J8 §5); tsc fail
 * giữa chừng TRUNCATE file về 0 byte nên sau build có kiểm tra file 0 byte.
 *
 * .deb KHÔNG build ở đây: .deb cần lib hệ thống mà VM này thiếu
 * (libnotify4, libxtst6, libsecret-1-0 — xem LIMITS J8 §6) nên không cài/chạy
 * kiểm chứng được; build .deb là bước riêng trên máy đủ lib.
 *
 * Dùng: node scripts/package-ship.mjs [--profile full|minimal]
 *        [--work DIR] [--skip-build] [--skip-smoke] [--skip-orphan]
 * Mặc định --work = ~/workspace/tmp-j8-electron/ship.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync, mkdirSync, readFileSync, readdirSync, rmSync,
  statSync, symlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Đợt 85 M5: ghi report qua helper retry EPERM + verify đủ byte
// (apps/web/scripts/eperm-retry.mjs).
import { writeFileEpermRetry } from "../../web/scripts/eperm-retry.mjs";

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(dirname(desktopDir));
const homeDir = process.env.HOME || tmpdir();

const PROFILES = {
  full: { venvs: ["caption", "tts", "reframe", "bgremove"], label: "full (bridge+render+4 venv)" },
  minimal: { venvs: [], label: "minimal (bridge+render, không venv)" },
};
const VENV_DEEP_MODULE = { caption: "faster_whisper", tts: "onnxruntime", reframe: "cv2", bgremove: "rembg" };

function parseArgs(argv) {
  const o = { profile: "full", work: join(homeDir, "workspace", "tmp-j8-electron", "ship"), skipBuild: false, skipSmoke: false, skipOrphan: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--profile") o.profile = argv[++i];
    else if (a === "--work") o.work = resolve(argv[++i]);
    else if (a === "--skip-build") o.skipBuild = true;
    else if (a === "--skip-smoke") o.skipSmoke = true;
    else if (a === "--skip-orphan") o.skipOrphan = true;
    else if (a === "--help" || a === "-h") { console.log("Dùng: node scripts/package-ship.mjs [--profile full|minimal] [--work DIR] [--skip-build] [--skip-smoke] [--skip-orphan]"); process.exit(0); }
    else throw new Error(`Tham số lạ: ${a}`);
  }
  if (!PROFILES[o.profile]) throw new Error(`Profile lạ: ${o.profile} (full|minimal)`);
  return o;
}

const opts = parseArgs(process.argv.slice(2));
const profile = PROFILES[opts.profile];
const outDir = join(opts.work, `ship-${opts.profile}`);
const modelsDir = join(opts.work, "models");
const report = { profile: opts.profile, startedAt: new Date().toISOString(), steps: {}, sizes: {}, probe: null, smoke: null, orphan: null };
const failures = [];

async function step(name, fn) {
  console.log(`\n[ship] === ${name} ===`);
  try {
    const r = await fn();
    report.steps[name] = { ok: true, ...((r && typeof r === "object") ? r : {}) };
    console.log(`[ship] PASS: ${name}`);
    return r;
  } catch (e) {
    report.steps[name] = { ok: false, error: String((e && e.message) || e) };
    failures.push(name);
    console.error(`[ship] FAIL: ${name}: ${e && e.message ? e.message : e}`);
    return null;
  }
}

function finishEarly(msg) {
  report.finishedAt = new Date().toISOString();
  report.failures = failures;
  report.earlyStop = msg;
  const reportPath = join(outDir, `ship-${opts.profile}-report.json`);
  try { writeFileEpermRetry(reportPath, JSON.stringify(report, null, 2), { label: "package-ship early-stop report" }); } catch { /* bỏ qua */ }
  console.error(`[ship] DỪNG SỚM: ${msg} — report: ${reportPath}`);
  process.exit(1);
}

function runSync(cmd, args, envExtra, label) {
  const r = spawnSync(cmd, args, { cwd: desktopDir, stdio: "inherit", env: { ...process.env, ...envExtra } });
  if (r.error) throw new Error(`${label}: không chạy được ${cmd}: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${label}: thoát mã ${r.status}`);
}

// Sóng EPERM trên VM này (ghi file thỉnh thoảng EPERM rồi tự hết sau ~1 phút
// — xem I5 §7.8, đợt 81, LIMITS J8 §5): các bước build thử lại tối đa 5 lần,
// cách nhau 20s. KHÔNG retry bước smoke/orphan (chúng có timeout riêng).
function runSyncRetry(cmd, args, envExtra, label, tries = 5) {
  let lastErr = null;
  for (let i = 1; i <= tries; i += 1) {
    try {
      runSync(cmd, args, envExtra, label);
      if (i > 1) console.log(`[ship] ${label}: OK ở lần thử ${i}/${tries} (sóng EPERM đã qua)`);
      return;
    } catch (e) {
      lastErr = e;
      console.error(`[ship] ${label}: lần thử ${i}/${tries} fail: ${e.message}`);
      if (i < tries) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20000);
    }
  }
  throw lastErr;
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

async function waitFor(fn, timeoutMs, intervalMs, label) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout ${timeoutMs}ms chờ ${label}`);
    await sleep(intervalMs);
  }
}

function readPidfile(userDataDir) {
  const p = join(userDataDir, "bridge.pid.json");
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

function pidAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function httpOk(port, pathName = "/api/health", timeoutMs = 2000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`http://127.0.0.1:${port}${pathName}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const j = await res.json();
    return j && j.ok === true;
  } catch { return false; }
}

// --- Chuẩn bị thư mục model mẫu (symlink, KHÔNG copy 3,7 GB) ---
function prepareModelsDir() {
  mkdirSync(modelsDir, { recursive: true });
  const links = [
    ["fw-small", join(repoRoot, "server", "caption", "models", "fw-small")],
    ["VieNeu-TTS-v3-Turbo", join(repoRoot, "server", "tts", "models", "VieNeu-TTS-v3-Turbo")],
    ["MOSS-Audio-Tokenizer-Nano-ONNX", join(repoRoot, "server", "tts", "models", "MOSS-Audio-Tokenizer-Nano-ONNX")],
    ["bgremove", join(homeDir, ".u2net")],
  ];
  for (const [name, target] of links) {
    const link = join(modelsDir, name);
    if (!existsSync(link)) {
      if (!existsSync(target)) throw new Error(`Thiếu model nguồn để symlink: ${target}`);
      symlinkSync(target, link, "dir");
    }
  }
  // Kiểm tra marker mà probe cần (model.bin / .vcut-complete / birefnet onnx).
  const need = [
    join(modelsDir, "fw-small", "model.bin"),
    join(modelsDir, "VieNeu-TTS-v3-Turbo", ".vcut-complete"),
    join(modelsDir, "MOSS-Audio-Tokenizer-Nano-ONNX", ".vcut-complete"),
    join(modelsDir, "bgremove", "birefnet-general.onnx"),
  ];
  for (const f of need) if (!existsSync(f)) throw new Error(`Thiếu marker model: ${f}`);
  console.log(`[ship] models dir sẵn: ${modelsDir} (symlink, không copy)`);
}

async function main() {
  mkdirSync(opts.work, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  prepareModelsDir();

  // 1. Build desktop (tsc + copy-services-js) — chạy TRỰC TIẾP bằng node,
  //    không qua npm: npm trên VM này thỉnh thoảng EPERM khi mở log file
  //    (LogFiles.load → write EPERM; sóng EPERM đã ghi ở I5 §7.8, tái hiện
  //    10/11 ở run3 J8) làm build-desktop fail dù tsc vẫn tốt. Lệnh tương
  //    đương npm script "build" (tsc -p tsconfig.json && copy-services-js).
  if (!opts.skipBuild) {
    await step("build-desktop", () => {
      const tscBin = join(repoRoot, "node_modules", "typescript", "bin", "tsc");
      runSyncRetry("node", [tscBin, "-p", "tsconfig.json"], {}, "tsc desktop");
      runSyncRetry("node", ["scripts/copy-services-js.mjs"], {}, "copy-services-js");
      // tsc fail giữa chừng (EPERM) TRUNCATE file về 0 byte rồi thoát mã 2 —
      // retry thành công sẽ ghi lại đầy đủ, nhưng phải kiểm tra không còn
      // file 0 byte mới tin build này.
      const zero = readdirSync(join(desktopDir, "dist"), { recursive: true, withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith(".js"))
        .map((d) => join(d.parentPath, d.name))
        .filter((f) => statSync(f).size === 0);
      if (zero.length) throw new Error(`dist/ còn ${zero.length} file .js 0 byte sau build: ${zero.slice(0, 5).join(", ")}`);
    });
    if (failures.length) finishEarly("build-desktop thất bại — dừng");
  }

  // 2. Prepackage theo profile — FAIL-FAST: các bước build là tiền đề của
  //    mọi bước sau (đã gặp: prepackage fail mà script vẫn build AppImage
  //    từ cây stage cũ — xem LIMITS J8 §5).
  let appImage = null;
  let unpacked = null;
  if (!opts.skipBuild) {
    await step("prepackage", () => {
      runSyncRetry("node", ["scripts/prepackage.mjs"], { VCUT_BUNDLE_SLIM_VENV: profile.venvs.join(",") }, "prepackage");
    });
    if (failures.length) finishEarly("prepackage/build thất bại — dừng, không build AppImage từ cây stage cũ");
    // 3. electron-builder AppImage only, output riêng.
    await step("electron-builder-appimage", () => {
      rmSync(outDir, { recursive: true, force: true });
      mkdirSync(outDir, { recursive: true });
      // Chạy CLI electron-builder TRỰC TIẾP bằng node (không qua npx):
      // npx/npm trên VM này thỉnh thoảng EPERM khi mở log file (xem
      // build-desktop). cli.js là entry thật của gói electron-builder.
      const builderCli = join(repoRoot, "node_modules", "electron-builder", "cli.js");
      runSyncRetry("node", [builderCli, "--linux", "AppImage", `-c.directories.output=${outDir}`],
        { TMPDIR: join(opts.work, "tmp-build") }, "electron-builder");
    });
    if (failures.length) finishEarly("electron-builder thất bại — dừng");
  }
  const found = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith(".AppImage")) : [];
  if (found.length !== 1) throw new Error(`Tìm thấy ${found.length} AppImage trong ${outDir} (cần đúng 1) — ${found.join(", ")}`);
  appImage = join(outDir, found[0]);
  unpacked = join(outDir, "linux-unpacked");
  report.sizes.appImageBytes = statSync(appImage).size;
  report.sizes.appImageSha256 = sha256(appImage);
  console.log(`[ship] AppImage: ${appImage} — ${report.sizes.appImageBytes} byte, sha256 ${report.sizes.appImageSha256.slice(0, 16)}…`);

  // 4. Verify cây đã đóng gói.
  await step("verify-packaged-tree", () => {
    if (!existsSync(unpacked)) throw new Error(`Thiếu linux-unpacked: ${unpacked}`);
    const vcutServer = join(unpacked, "resources", "vcut-server");
    if (!existsSync(join(vcutServer, "server", "bridge", "src", "index.js"))) throw new Error("Thiếu bridge bundle trong gói");
    if (!existsSync(join(vcutServer, "server", "node_modules", "express"))) throw new Error("Thiếu node_modules closure (express) — coi chừng prune extraResources");
    if (!existsSync(join(vcutServer, "bin", "vcut-node"))) throw new Error("Thiếu launcher bin/vcut-node");
    // Model KHÔNG BAO GIỜ bundle.
    for (const svc of ["caption", "tts"]) {
      if (existsSync(join(vcutServer, "server", svc, "models"))) throw new Error(`Gói chứa models/ của ${svc} — sai quyết định ship (model chỉ tải riêng)`);
    }
    const venvInfo = {};
    for (const svc of ["caption", "tts", "reframe", "bgremove"]) {
      const py = join(vcutServer, "server", svc, ".venv", "bin", "python");
      const want = profile.venvs.includes(svc);
      if (want) {
        if (!existsSync(py)) throw new Error(`Profile ${opts.profile} thiếu venv ${svc} trong gói`);
        const r = spawnSync(py, ["--version"], { encoding: "utf8", timeout: 30000 });
        if (r.status !== 0) throw new Error(`venv ${svc} không chạy được python --version: ${r.stderr || r.stdout || "?"}`);
        const imp = spawnSync(py, ["-c", `import ${VENV_DEEP_MODULE[svc]}`], { encoding: "utf8", timeout: 120000 });
        if (imp.status !== 0) throw new Error(`venv ${svc} import ${VENV_DEEP_MODULE[svc]} thất bại: ${(imp.stderr || "").slice(0, 300)}`);
        venvInfo[svc] = { bytes: statSync(join(vcutServer, "server", svc, ".venv")).size, python: (r.stdout || "").trim(), module: VENV_DEEP_MODULE[svc] };
      } else if (existsSync(py)) {
        throw new Error(`Profile ${opts.profile} KHÔNG được chứa venv ${svc} nhưng gói lại có`);
      }
    }
    report.sizes.venvInPackage = venvInfo;
    return { venvs: Object.keys(venvInfo) };
  });
  if (failures.length) finishEarly("verify-packaged-tree thất bại — dừng, không smoke test gói lỗi");

  // 5. Probe AI trên cây đã đóng gói (không Electron, không chạy job thật).
  if (!opts.skipSmoke) {
    await step("probe-ai-packaged", async () => {
      const require = createRequire(import.meta.url);
      const ps = require(join(desktopDir, "dist", "services", "pythonServices.js"));
      const appRoot = join(unpacked, "resources", "vcut-server");
      const env = { ...process.env, VCUT_MODELS_DIR: modelsDir };
      const out = await ps.probeAllPythonServices(appRoot, env, { deep: true });
      const table = {};
      for (const [id, s] of Object.entries(out)) {
        table[id] = { available: s.available, pythonSource: s.pythonSource, depsOk: s.deps ? s.deps.ok : null, modelOk: s.model ? s.model.ok : null, reason: s.available ? undefined : s.reason };
        console.log(`[ship] probe ${id}: available=${s.available} python=${s.pythonSource} depsOk=${s.deps ? s.deps.ok : "-"} modelOk=${s.model ? s.model.ok : "-"}${s.available ? "" : " — " + s.reason}`);
      }
      report.probe = table;
      if (opts.profile === "full") {
        const mustBeAvailable = ["caption", "translate", "tts", "bgremove", "reframe"];
        const bad = mustBeAvailable.filter((id) => !out[id] || !out[id].available);
        if (bad.length) throw new Error(`Profile full mà probe AI fail: ${bad.join(", ")}`);
      }
      return { services: table };
    });
  }

  // 6. Smoke AppImage thật.
  const smokeUserData = join(opts.work, "userdata-smoke");
  const orphanUserData = join(opts.work, "userdata-orphan");
  async function launchAppImage(userDataDir, envExtra) {
    const args = ["-a", appImage, "--user-data-dir=" + userDataDir, "--no-sandbox"];
    const child = spawn("xvfb-run", args, {
      detached: true,
      env: {
        ...process.env,
        APPIMAGE_EXTRACT_AND_RUN: "1",
        VCUT_DESKTOP_SMOKE: "1",
        VCUT_MODELS_DIR: modelsDir,
        TMPDIR: join(opts.work, "tmp-run"),
        ...envExtra,
      },
    });
    let buf = "";
    child.stdout.on("data", (d) => { buf += String(d); });
    child.stderr.on("data", (d) => { buf += String(d); });
    return { child, getOutput: () => buf };
  }
  function parseSmokeResult(output) {
    // Smoke guard 30s trong main.ts có thể in VCUT_SMOKE_RESULT timeout TRƯỚC
    // rồi probe thật in kết quả ok:true ngay sau (race đã ghi ở H7 §2.5) —
    // phải quét TẤT CẢ các dòng, ưu tiên ok:true, không dừng ở dòng đầu.
    const re = /VCUT_SMOKE_RESULT (\{.*\})/g;
    let m;
    let sawTimeout = false;
    let okResult = null;
    while ((m = re.exec(output)) !== null) {
      try {
        const r = JSON.parse(m[1]);
        if (r && r.ok === true) okResult = r;
        else if (r && r.error === "timeout") sawTimeout = true;
      } catch { /* dòng rác — bỏ qua */ }
    }
    if (okResult) return okResult;
    if (sawTimeout) return { __timeoutOnly: true };
    return null;
  }
  async function waitSmoke(proc, timeoutMs) {
    const r = await waitFor(() => {
      const parsed = parseSmokeResult(proc.getOutput());
      if (!parsed) return null;
      if (parsed.__timeoutOnly) return null; // chờ tiếp — kết quả thật có thể in sau
      return parsed;
    }, timeoutMs, 2000, "VCUT_SMOKE_RESULT ok:true");
    if (!r || r.ok !== true) throw new Error(`Smoke result không ok: ${JSON.stringify(r)}`);
    return r;
  }

  if (!opts.skipSmoke) {
    await step("smoke-appimage", async () => {
      mkdirSync(join(opts.work, "tmp-run"), { recursive: true });
      rmSync(smokeUserData, { recursive: true, force: true });
      const proc = await launchAppImage(smokeUserData);
      const result = await waitSmoke(proc, 300000);
      report.smoke = result;
      // Chờ app tự thoát sau smoke (tối đa 60s), nếu còn thì kill nhóm.
      const t0 = Date.now();
      while (pidAlive(proc.child.pid) && Date.now() - t0 < 60000) await sleep(2000);
      if (pidAlive(proc.child.pid)) {
        try { process.kill(-proc.child.pid, "SIGKILL"); } catch { /* đã thoát */ }
      }
      await sleep(2000);
      const log = join(smokeUserData, "logs", "service-manager.log");
      const logText = existsSync(log) ? readFileSync(log, "utf8") : "";
      // ROUND83-K7 — kiểm tra bridge spawn qua bin/vcut-node (dòng spawn),
      // KHÔNG đòi dòng "bridge chạy tại": dòng đó chỉ được ghi khi start()
      // hoàn thành (sau deep probe AI), còn smoke mode quit app ngay khi
      // probe renderer xong (ok:true + bridgeFromRenderer ok) nên app có
      // thể thoát trước khi probe sâu xong — run2 K7 gặp đúng vậy (smoke
      // ok:true, bridgeFromRenderer ok, bridge healthy, nhưng chưa kịp ghi
      // "bridge chạy tại"). Bridge healthy đã được chứng minh bởi chính
      // kết quả smoke ở trên (waitSmoke ok:true).
      const bridgeSpawned = /spawn bridge: .*bin\/vcut-node/.test(logText);
      if (!bridgeSpawned) throw new Error("service-manager.log không thấy bridge spawn qua bin/vcut-node");
      if (readPidfile(smokeUserData)) throw new Error("Thoát smoke xong mà bridge.pid.json vẫn còn (mồ côi?)");
      console.log(`[ship] smoke ok: bridgeUrl=${result.bridgeUrl} textLen=${result.textLen}`);
      return { bridgeUrl: result.bridgeUrl };
    });
  }

  // 7. Orphan: kill -9 → mở lại → dọn mồ côi.
  if (!opts.skipSmoke && !opts.skipOrphan) {
    await step("orphan-kill9-relaunch", async () => {
      rmSync(orphanUserData, { recursive: true, force: true });
      const p1 = await launchAppImage(orphanUserData);
      const pid1 = await waitFor(() => readPidfile(orphanUserData), 240000, 2000, "bridge.pid.json lần 1");
      if (!pid1 || !pid1.pid || !pid1.port) throw new Error("Không đọc được pidfile lần 1");
      const healthy1 = await waitFor(() => httpOk(pid1.port).then((ok) => (ok ? true : null)), 120000, 2000, "bridge lần 1 healthy");
      if (!healthy1) throw new Error("Bridge lần 1 không healthy trước kill -9");
      console.log(`[ship] lần 1: electron appPid=${pid1.appPid} bridge pid=${pid1.pid} port=${pid1.port} healthy`);
      // Kill -9 CẢ NHÓM Electron (mô phỏng crash): bridge detached nên sống sót.
      try { process.kill(-p1.child.pid, "SIGKILL"); } catch { /* nhóm đã chết */ }
      await sleep(3000);
      if (pidAlive(pid1.appPid)) throw new Error(`Electron chính appPid=${pid1.appPid} vẫn sống sau kill -9 nhóm`);
      if (!pidAlive(pid1.pid)) throw new Error("Bridge lần 1 đã chết cùng Electron — không tạo được mồ côi để test (cần bridge detached sống sót)");
      if (!(await httpOk(pid1.port))) throw new Error("Bridge mồ côi không còn healthy sau kill -9");
      console.log(`[ship] mồ côi xác nhận: bridge ${pid1.pid} vẫn sống + healthy trên cổng ${pid1.port} sau kill -9`);
      // Mở lại cùng userData → manager phải dọn chết bridge cũ.
      const p2 = await launchAppImage(orphanUserData);
      // ROUND83-K7 — pid2 phải khai báo NGOÀI try: bản J8 khai `const
      // pid2` trong try rồi dùng ở console.log sau try/finally → khi
      // mọi check đều pass (run2 K7: old dead, new healthy, smoke2 ok),
      // bước này crash ReferenceError "pid2 is not defined" ngay dòng
      // log thành công. Lỗi latent, chỉ lộ khi race đã sửa xong.
      let pid2 = null;
      try {
        pid2 = await waitFor(() => {
          const cur = readPidfile(orphanUserData);
          return cur && cur.pid && cur.pid !== pid1.pid ? cur : null;
        }, 300000, 2000, "pidfile mới (pid khác bridge cũ)");
        const oldDead = !pidAlive(pid1.pid);
        // ROUND83-K7 — healthy2 KHÔNG check một phát: bridge mới vừa spawn,
        // deep probe AI đang tranh CPU, một lần GET /api/health 2s có thể
        // timeout dù bridge khỏe (run2 J8 đợt 82: manager fail 31s rồi
        // check đơn này fail theo). Poll tối đa 120s như healthy1.
        const healthy2 = await waitFor(() => httpOk(pid2.port).then((ok) => (ok ? true : null)), 120000, 2000, "bridge mới healthy sau mở lại");
        // Smoke lần 2 có thể dính race guard 30s (H7 §2.5) hoặc bridge mới
        // fail healthy do probe AI sâu tranh CPU với health check (H7 §5.4,
        // tái hiện ở run2 J8) — bằng chứng dọn mồ côi là oldDead + log
        // orphan-killed, không phải smoke lần 2. Ghi rõ, không giấu.
        let smoke2 = null;
        let smoke2Note = null;
        try {
          smoke2 = await waitSmoke(p2, 300000);
        } catch (e) {
          smoke2Note = `smoke lần 2 không ra ok:true (${(e && e.message) || e}) — xem LIMITS J8 §5`;
        }
        report.orphan = { oldBridgePid: pid1.pid, oldBridgeDeadAfterRelaunch: oldDead, newBridgePid: pid2.pid, newBridgePort: pid2.port, newBridgeHealthy: healthy2, smokeOk: smoke2 ? smoke2.ok === true : false, smokeNote: smoke2Note };
        if (!oldDead) throw new Error(`Bridge mồ côi ${pid1.pid} VẪN SỐNG sau khi mở lại app — dọn mồ côi H7 thất bại`);
        if (!healthy2) throw new Error("Bridge mới sau mở lại không healthy (race health/probe H7 §5.4 — xem LIMITS J8 §5)");
        // Chờ app 2 tự thoát sau smoke, rồi xác nhận không còn mồ côi.
        const t0 = Date.now();
        while (pidAlive(p2.child.pid) && Date.now() - t0 < 60000) await sleep(2000);
        if (pidAlive(p2.child.pid)) { try { process.kill(-p2.child.pid, "SIGKILL"); } catch { /* đã thoát */ } }
        await sleep(2000);
        if (pidAlive(pid2.pid)) throw new Error(`Bridge mới ${pid2.pid} còn sống sau khi app 2 thoát`);
        if (readPidfile(orphanUserData)) throw new Error("bridge.pid.json vẫn còn sau khi app 2 thoát sạch");
      } finally {
        // Dọn nhóm app 2 dù bước trên fail giữa chừng (không để sót Xvfb/Electron).
        if (pidAlive(p2.child.pid)) { try { process.kill(-p2.child.pid, "SIGKILL"); } catch { /* đã thoát */ } }
      }
      console.log(`[ship] dọn mồ côi OK: bridge cũ ${pid1.pid} chết, bridge mới ${pid2.pid} healthy rồi thoát sạch`);
      return report.orphan;
    });
  }

  report.finishedAt = new Date().toISOString();
  report.failures = failures;
  const reportPath = join(outDir, `ship-${opts.profile}-report.json`);
  writeFileEpermRetry(reportPath, JSON.stringify(report, null, 2), { label: "package-ship report" });
  console.log(`\n[ship] Report: ${reportPath}`);
  console.log(`[ship] AppImage ${opts.profile}: ${report.sizes.appImageBytes} byte, sha256 ${report.sizes.appImageSha256}`);
  if (failures.length) {
    console.error(`[ship] FAIL chung: ${failures.join(", ")}`);
    process.exit(1);
  }
  console.log("[ship] ALL GREEN");
}

main().catch((e) => {
  console.error(`[ship] LỖI CHẾT: ${e && e.message ? e.message : e}`);
  try {
    report.finishedAt = new Date().toISOString();
    report.fatalError = String((e && e.message) || e);
    report.failures = failures;
    mkdirSync(outDir, { recursive: true });
    writeFileEpermRetry(join(outDir, `ship-${opts.profile}-report.json`), JSON.stringify(report, null, 2), { label: "package-ship fatal report" });
  } catch { /* bỏ qua */ }
  process.exit(1);
});
