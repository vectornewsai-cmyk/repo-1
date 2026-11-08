// G6 verification harness — Phase 10 VCut Studio Electron app (independent check).
// Pure Node (global fetch + global WebSocket), no npm install, no new deps.
// Usage:
//   node verify-desktop.mjs [--appimage <path-to-.AppImage>] [--timeout-ms 90000]
// Exits 0 if ALL checks pass, 1 otherwise. Writes JSON report to stdout and
// to /tmp/g6-verify-report.json. Screenshots to /tmp/g6-electron-shot.png (+ -appimage).
// It never modifies repo code; it only reads, builds (tsc/vite) and launches.
import { spawn, execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";

const requireCjs = createRequire(import.meta.url);
// Đợt 51 H7 — dọn bridge mồ côi TRƯỚC khi spawn Electron: Electron bind cổng
// CDP lúc khởi động, trước khi main.ts chạy, nên dọn trong app (manager
// start()) thì cổng CDP chỉ trống cho LẦN CHẠY SAU. Harness từng fail CDP
// vì bridge mồ côi từ lần chạy trước giữ socket 9222 (Phase 10 LIMITS §5.2).
async function cleanupStaleBridgeBeforeLaunch(userDataDir, cdpPort) {
  for (const cand of [
    path.join(DESK, "dist/services/bridgePidfile.js"),
    path.join(DESK, "src/services/bridgePidfile.js"),
  ]) {
    try {
      if (!(await exists(cand))) continue;
      const mod = requireCjs(cand);
      const res = await mod.cleanupStaleBridge(userDataDir, { cdpPort });
      if (res.action !== "none") {
        console.log(`[harness] pidfile cleanup (${userDataDir}): ${res.action} — ${res.reason}`);
      }
      return res;
    } catch (e) {
      console.log(`[harness] pidfile cleanup lỗi (bỏ qua, không chặn launch): ${e.message}`);
      return null;
    }
  }
  return null;
}

const REPO = path.resolve(os.homedir(), "workspace/repo-1");
const DESK = path.join(REPO, "apps/desktop");
const report = { startedAt: new Date().toISOString(), checks: {}, warns: {}, notes: [] };
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail: String(detail).slice(0, 600) });
  report.checks[name] = { ok: !!ok, detail: String(detail).slice(0, 600) };
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + String(detail).slice(0, 300) : ""}`);
}
// WARN: informational only — does not affect exit code (used for known
// environment limits, e.g. black screenshots under Xvfb/software GL).
function warn(name, ok, detail = "") {
  report.warns[name] = { ok: !!ok, detail: String(detail).slice(0, 600) };
  console.log(`${ok ? "WARN-OK " : "WARN    "}${name}${detail ? " — " + String(detail).slice(0, 300) : ""}`);
}
async function shotVariance(pngPath) {
  // Pixel stddev via PIL; 0 (or ~0) = solid colour (black under Xvfb).
  const r = await run("python3", ["-c", "import sys; from PIL import Image, ImageStat; im=Image.open(sys.argv[1]).convert('RGB'); s=ImageStat.Stat(im); print(f\"{sum(s.stddev)/3:.2f}|{im.size[0]}x{im.size[1]}\")", pngPath], { timeoutMs: 60000 });
  const m = /([\d.]+)\|(\d+x\d+)/.exec(r.stdout);
  return m ? { stddev: parseFloat(m[1]), size: m[2] } : { stddev: -1, size: "?" };
}
function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024, timeout: opts.timeoutMs ?? 600000, cwd: opts.cwd ?? REPO, env: { ...process.env, ...(opts.env ?? {}) } }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, stdout: String(stdout ?? ""), stderr: String(stderr ?? ""), timedOut: !!err && err.killed });
    });
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function httpJson(url, timeoutMs = 3000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeoutMs);
  try { const r = await fetch(url, { signal: c.signal }); const txt = await r.text(); try { return { status: r.status, json: JSON.parse(txt) }; } catch { return { status: r.status, text: txt.slice(0, 300) }; } }
  catch (e) { return { error: String(e.message ?? e) }; } finally { clearTimeout(t); }
}

const args = process.argv.slice(2);
const appImageArg = args.includes("--appimage") ? args[args.indexOf("--appimage") + 1] : null;
// Resolve to absolute: callers often pass a repo-relative path while the
// AppImage launch runs with cwd=apps/desktop.
const appImage = appImageArg ? path.resolve(REPO, appImageArg) : null;
const TIMEOUT_MS = parseInt(args.includes("--timeout-ms") ? args[args.indexOf("--timeout-ms") + 1] : "90000", 10);

// ---------- 1. Structure ----------
const pkgPath = path.join(DESK, "package.json");
const pkgExists = await exists(pkgPath);
check("desktop/package.json exists", pkgExists);
let pkg = {};
if (pkgExists) pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
check("desktop package.json has main entry", !!pkg.main, pkg.main ?? "");
const mainFile = pkg.main ? path.join(DESK, pkg.main) : null;
check("desktop main file exists", !!mainFile && (await exists(mainFile)), mainFile ?? "");
const preloadCandidates = ["src/preload.js", "src/preload.ts", "preload.js", "src/preload.cjs"];
let preloadFound = null;
for (const c of preloadCandidates) if (await exists(path.join(DESK, c))) { preloadFound = c; break; }
check("desktop preload file exists", !!preloadFound, preloadFound ?? "none of " + preloadCandidates.join(", "));
check("desktop depends on electron", !!(pkg.dependencies?.electron || pkg.devDependencies?.electron), (pkg.dependencies?.electron ?? pkg.devDependencies?.electron ?? "missing"));
const tsconfigExists = await exists(path.join(DESK, "tsconfig.json"));
report.tsconfigExists = tsconfigExists;
const ebConfig = (await exists(path.join(DESK, "electron-builder.yml"))) || (await exists(path.join(DESK, "electron-builder.json"))) || !!pkg.build;
check("electron-builder config present", ebConfig, pkg.build ? "in package.json" : "file");

// ---------- 2. tsc apps/desktop (if tsconfig) ----------
if (tsconfigExists) {
  const tsc = path.join(REPO, "node_modules/.bin/tsc");
  const r = await run(tsc, ["--noEmit", "-p", DESK], { timeoutMs: 180000 });
  check("tsc apps/desktop --noEmit exit 0", r.code === 0, (r.stdout + r.stderr).slice(0, 400) || "no output");
} else {
  check("tsc apps/desktop --noEmit exit 0", false, "no tsconfig.json in apps/desktop — skipped, cannot typecheck");
}

// ---------- 3. vite build apps/web ----------
const webBuild = await run("npm", ["run", "build", "--workspace=@repo-1/web"], { timeoutMs: 600000 });
check("vite build apps/web exit 0", webBuild.code === 0, (webBuild.stdout + webBuild.stderr).slice(-400));
const distIndex = path.join(REPO, "apps/web/dist/index.html");
check("apps/web/dist/index.html exists after build", await exists(distIndex));

// ---------- 3b. tsc emit apps/desktop + copy dist-web + copy services js ----------
// dist/main.js must be fresh for the Electron launch below; these are build
// steps (no source edits).
const deskBuild = await run("npm", ["run", "build"], { cwd: DESK, timeoutMs: 180000 });
check("tsc emit apps/desktop (npm run build) exit 0", deskBuild.code === 0, (deskBuild.stdout + deskBuild.stderr).slice(-300));
check("dist/main.js exists after build", await exists(path.join(DESK, "dist/main.js")));
const copyWeb = await run("node", ["scripts/copy-web-dist.mjs"], { cwd: DESK, timeoutMs: 120000 });
check("copy-web-dist.mjs exit 0", copyWeb.code === 0, (copyWeb.stdout + copyWeb.stderr).slice(-300));
check("dist-web/index.html exists after copy", await exists(path.join(DESK, "dist-web/index.html")));
const copySvc = await run("node", ["scripts/copy-services-js.mjs"], { cwd: DESK, timeoutMs: 60000 });
check("copy-services-js.mjs exit 0", copySvc.code === 0, (copySvc.stdout + copySvc.stderr).slice(-300));
check("dist/services/serviceManager.js exists after copy", await exists(path.join(DESK, "dist/services/serviceManager.js")));

// bridge state BEFORE launch (to avoid crediting the app for a bridge
// another thread already started)
const bridgeBefore = await httpJson("http://127.0.0.1:8787/api/health", 2000);
report.bridgeUpBeforeLaunch = !bridgeBefore.error && bridgeBefore.status === 200;

// ---------- 4. Electron launch under Xvfb ----------
async function launchElectron({ label, binary, cwd, extraArgs, cdpPort, shotPath, envExtra = {}, userDataDir = null }) {
  // Đợt 51 H7: dọn bridge mồ côi trước khi spawn (xem cleanupStaleBridgeBeforeLaunch).
  if (userDataDir) await cleanupStaleBridgeBeforeLaunch(userDataDir, cdpPort);
  const display = ":99";
  const xvfb = spawn("Xvfb", [display, "-screen", "0", "1280x800x24"], { stdio: "ignore" });
  await sleep(1500);
  const logPath = `/tmp/g6-${label}.log`;
  const logStream = (await import("node:fs")).createWriteStream(logPath);
  const child = spawn(binary, [...extraArgs, `--remote-debugging-port=${cdpPort}`], {
    cwd, detached: true, env: { ...process.env, DISPLAY: display, ELECTRON_DISABLE_SANDBOX: "1", ...envExtra }, stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.pipe(logStream); child.stderr.pipe(logStream);
  let pageTarget = null; let consoleErrors = [];
  const deadline = Date.now() + TIMEOUT_MS;
  try {
    while (Date.now() < deadline) {
      if (child.exitCode !== null) break;
      const list = await httpJson(`http://127.0.0.1:${cdpPort}/json/list`, 2000);
      const pages = Array.isArray(list.json) ? list.json.filter((t) => t.type === "page") : [];
      const appPage = pages.find((t) => /app:\/\/|file:|localhost|127\.0\.0\.1/.test(t.url));
      if (appPage) { pageTarget = appPage; break; }
      await sleep(1000);
    }
  } catch {}
  check(`${label}: electron process alive after launch`, child.exitCode === null, child.exitCode === null ? `pid=${child.pid}` : `exited code=${child.exitCode}`);
  check(`${label}: CDP page target (renderer) found`, !!pageTarget, pageTarget ? pageTarget.url : "no page target on /json/list");
  let evalInfo = null;
  if (pageTarget) {
    try {
      const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error("ws timeout")), 10000); });
      let id = 0; const pending = new Map();
      const send = (method, params = {}) => new Promise((res, rej) => {
        const mid = ++id; pending.set(mid, { res, rej });
        ws.send(JSON.stringify({ id: mid, method, params }));
        setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error("cdp timeout " + method)); } }, 15000);
      });
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch { return; }
        if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
        if (m.method === "Runtime.exceptionThrown") consoleErrors.push("exception: " + JSON.stringify(m.params.exceptionDetails).slice(0, 300));
        if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleErrors.push("console.error: " + JSON.stringify(m.params.args).slice(0, 300));
      };
      await send("Runtime.enable");
      await send("Page.enable");
      await sleep(4000); // let React mount + bridge calls settle
      const ev = await send("Runtime.evaluate", { expression: `JSON.stringify({title: document.title, rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : -1, bodyText: document.body ? document.body.innerText.slice(0,400) : '', hasCanvas: !!document.querySelector('canvas'), location: location.href})`, returnByValue: true });
      evalInfo = JSON.parse(ev.result.value);
      check(`${label}: renderer DOM mounted (root has children)`, evalInfo.rootChildren > 0, `title=${evalInfo.title} rootChildren=${evalInfo.rootChildren} url=${evalInfo.location}`);
      // Independent CORS check: fetch bridge from the renderer origin
      // (app://vcut) — must succeed only if bridge allows that origin.
      // Bridge is up (started by this harness) for dev + appimage launches.
      try {
        const fev = await send("Runtime.evaluate", { expression: `fetch("http://127.0.0.1:8787/api/health").then(r => r.json()).then(j => JSON.stringify({ok: j.ok, ffmpeg: j.ffmpeg})).catch(e => "fetch-error:" + (e && e.message ? e.message : String(e)))`, returnByValue: true, awaitPromise: true });
        const fval = String(fev.result.value ?? "");
        check(`${label}: renderer fetch to bridge :8787 ok (CORS app://vcut)`, fval.includes('"ok":true'), fval.slice(0, 200));
        evalInfo.bridgeFetch = fval;
      } catch (e) {
        check(`${label}: renderer fetch to bridge :8787 ok (CORS app://vcut)`, false, String(e.message ?? e));
      }
      const shot = await send("Page.captureScreenshot", { format: "png" });
      await fs.writeFile(shotPath, Buffer.from(shot.data, "base64"));
      const st = await fs.stat(shotPath);
      check(`${label}: screenshot captured`, st.size > 1000, `${shotPath} ${st.size} bytes`);
      const v = await shotVariance(shotPath);
      warn(`${label}: screenshot has visible content (pixel stddev)`, v.stddev > 5, `stddev=${v.stddev} ${v.size} — stddev~0 means solid black: known Xvfb/software-GL compositor limit, NOT proof the UI is blank (DOM probe above is the reliable signal)`);
      // (Phase 10, parent merge): đóng cửa sổ để app thoát theo đường
      // bình thường (window-all-closed → app.quit() → before-quit →
      // stopLocalServices tắt bridge). SIGTERM không làm Electron thoát
      // (đã thử: app treo đủ 8s grace rồi mới SIGKILL, bridge vẫn mồ côi),
      // nên killTree chỉ là fallback sau khi chờ thoát sạch tối đa 10s.
      try { await send("Runtime.evaluate", { expression: "window.close()" }); } catch {}
      const quitDeadline = Date.now() + 10000;
      while (Date.now() < quitDeadline && child.exitCode === null) await sleep(250);
      ws.close();
    } catch (e) {
      check(`${label}: CDP evaluate+screenshot`, false, String(e.message ?? e));
    }
  }
  // bridge health after launch. The bridge was started by THIS harness
  // (not by the app) so it can answer the CORS probe; whether the app
  // itself starts services is tested separately by the bridge-down
  // smoke run (section 5b), where the bridge must stay down.
  const health = await httpJson("http://127.0.0.1:8787/api/health", 3000);
  const healthOk = !health.error && health.status === 200 && health.json?.ok === true;
  check(`${label}: bridge :8787 /api/health answers`, healthOk, JSON.stringify(health).slice(0, 300) + " — bridge started by harness for the CORS probe, NOT by the app");
  const log = await fs.readFile(logPath, "utf8").catch(() => "");
  const uncaught = /Uncaught|uncaughtException|Unhandled|FATAL/.test(log);
  check(`${label}: main log has no uncaught exception`, !uncaught, uncaught ? log.split("\n").filter((l) => /Uncaught|uncaughtException|Unhandled|FATAL/.test(l)).slice(0, 3).join(" | ") : `log ${log.length} bytes`);
  report[`${label}Eval`] = evalInfo;
  report[`${label}ConsoleErrors`] = consoleErrors.slice(0, 10);
  report[`${label}LogTail`] = log.slice(-1500);
  await killTree(child);
  try { xvfb.kill("SIGKILL"); } catch {}
  await sleep(1500);
  // No orphaned Electron may survive: an orphan keeps the single-instance
  // lock and makes every later launch exit as "another instance running".
  const leftover = await run("pgrep", ["-f", `remote-debugging-port=${cdpPort}`], { timeoutMs: 15000 });
  check(`${label}: no orphaned electron process left behind`, leftover.code !== 0, leftover.code === 0 ? "pgrep still finds the launched electron — single-instance lock would block later launches" : "clean");
}

// Kill a spawned Electron AND its children: the .bin/electron wrapper
// spawns dist/electron as a child, so killing only the direct child
// orphans the real main process (it then keeps the single-instance lock
// and breaks every later launch — found the hard way 06/11). Spawn
// detached and kill the whole process group.
// (Phase 10, parent merge): SIGTERM trước để app kịp chạy before-quit →
// stopLocalServices() tắt bridge. Bridge chạy detached (group riêng) nên
// SIGKILL thẳng group Electron sẽ để bridge mồ côi — nó giữ cổng và kế
// thừa socket CDP 9222, làm lần chạy sau fail "bind() failed" (gặp thật
// 2 lần trong đợt gộp). Chỉ SIGKILL sau 8s nếu app vẫn chưa thoát.
async function killTree(child) {
  try { process.kill(-child.pid, "SIGTERM"); } catch {}
  try { child.kill("SIGTERM"); } catch {}
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) return;
    await sleep(500);
  }
  try { process.kill(-child.pid, "SIGKILL"); } catch {}
  try { child.kill("SIGKILL"); } catch {}
}
// Prefer the REAL electron binary (dist/electron) over the .bin CLI
// wrapper, so the spawned process IS the main process.
async function resolveElectronBin() {
  for (const cand of [
    path.join(REPO, "node_modules/electron/dist/electron"),
    path.join(DESK, "node_modules/electron/dist/electron"),
    path.join(DESK, "node_modules/.bin/electron"),
    path.join(REPO, "node_modules/.bin/electron"),
  ]) if (await exists(cand)) return cand;
  return null;
}
// The bridge is needed up-front so the renderer CORS probe (fetch from
// origin app://vcut) has something to talk to. The app itself is NOT
// credited for the bridge: whether the app starts services is tested
// separately in section 5b (bridge-down smoke run).
let bridgeChild = null;
async function startBridge() {
  if (!bridgeBefore.error && bridgeBefore.status === 200) { report.bridgeStartedByHarness = false; return true; }
  // Đợt 66 T9 — persist riêng theo PID (không dùng file mặc định chung ~/.cache/vcut/rate-limit.json).
  bridgeChild = spawn("node", [path.join(REPO, "server/bridge/src/index.js")], { cwd: REPO, env: { ...process.env, BRIDGE_PORT: "8787", BRIDGE_RATE_PERSIST_PATH: path.join(os.tmpdir(), `vcut-verify-desktop-${process.pid}-rate-limit.json`) }, stdio: "ignore" });
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    const h = await httpJson("http://127.0.0.1:8787/api/health", 2000);
    if (!h.error && h.status === 200 && h.json?.ok === true) { report.bridgeStartedByHarness = true; return true; }
    await sleep(1000);
  }
  report.bridgeStartedByHarness = false;
  return false;
}
async function stopBridge() {
  if (bridgeChild) { try { bridgeChild.kill("SIGKILL"); } catch {} bridgeChild = null; }
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const h = await httpJson("http://127.0.0.1:8787/api/health", 1500);
    if (h.error) return true;
    await sleep(500);
  }
  return false;
}
// Built-in smoke hook (main.ts VCUT_DESKTOP_SMOKE=1): app probes its own
// DOM + bridge-from-renderer and prints VCUT_SMOKE_RESULT, then quits.
async function runSmoke({ label, binary, extraArgs, envExtra = {} }) {
  const display = ":99";
  const xvfb = spawn("Xvfb", [display, "-screen", "0", "1280x800x24"], { stdio: "ignore" });
  await sleep(1500);
  const logPath = `/tmp/g6-${label}.log`;
  const logStream = (await import("node:fs")).createWriteStream(logPath);
  const child = spawn(binary, extraArgs, { cwd: DESK, detached: true, env: { ...process.env, DISPLAY: display, ELECTRON_DISABLE_SANDBOX: "1", VCUT_DESKTOP_SMOKE: "1", VCUT_DESKTOP_SMOKE_SHOT: `/tmp/g6-${label}-shot.png`, ...envExtra }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(logStream); child.stderr.pipe(logStream);
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline && child.exitCode === null) await sleep(1000);
  await killTree(child);
  try { xvfb.kill("SIGKILL"); } catch {}
  await sleep(500);
  const log = await fs.readFile(logPath, "utf8").catch(() => "");
  const m = /VCUT_SMOKE_RESULT (\{.*\})/.exec(log);
  let res = null;
  try { res = m ? JSON.parse(m[1]) : null; } catch {}
  report[`${label}SmokeResult`] = res;
  return { res, log };
}

const bridgeUp = await startBridge();
check("bridge :8787 started by harness (for CORS probe)", bridgeUp, bridgeUp ? "health ok" : "bridge failed to start — renderer CORS checks will fail");
const healthPre = await httpJson("http://127.0.0.1:8787/api/health", 3000);
report.bridgeHealthPreLaunch = healthPre;

// find electron binary (real dist/electron, not the .bin wrapper)
const electronBin = await resolveElectronBin();
check("electron binary resolvable (no npm install by G6)", !!electronBin, electronBin ?? "not in apps/desktop/node_modules nor repo node_modules");
if (electronBin) {
  // Built-in smoke WITH bridge up: verifies G1's quoted VCUT_SMOKE_RESULT
  // (ok:true + bridgeFromRenderer:"ok") end to end.
  const smokeA = await runSmoke({ label: "smoke-up", binary: electronBin, extraArgs: [".", "--no-sandbox"] });
  check("smoke (bridge up): VCUT_SMOKE_RESULT ok:true", smokeA.res?.ok === true, JSON.stringify(smokeA.res).slice(0, 400));
  check("smoke (bridge up): bridgeFromRenderer ok", smokeA.res?.bridgeFromRenderer === "ok", String(smokeA.res?.bridgeFromRenderer ?? "no result"));
  // Phase 10 (gộp): textLen là số ký tự của project mẫu đang load — đổi
  // theo nội dung mẫu, KHÔNG assert bằng số tuyệt đối 2154 của lượt G1.
  // Chỉ cần nội dung editor thật (>300 ký tự) + đúng URL/title.
  check("smoke (bridge up): UI text + url", typeof smokeA.res?.textLen === "number" && smokeA.res.textLen > 300 && smokeA.res?.url === "app://vcut/index.html", `textLen=${smokeA.res?.textLen} url=${smokeA.res?.url} title=${smokeA.res?.title}`);
  await launchElectron({ label: "dev", binary: electronBin, cwd: DESK, extraArgs: [".", "--no-sandbox"], cdpPort: 9222, shotPath: "/tmp/g6-electron-shot.png", userDataDir: path.join(os.homedir(), ".config", "@repo-1", "desktop") });
} else {
  check("dev: electron process alive after launch", false, "no electron binary — cannot launch");
  check("dev: CDP page target (renderer) found", false, "no electron binary");
  check("dev: bridge :8787 /api/health answers", false, "not attempted (no app launch)");
  check("dev: main log has no uncaught exception", false, "not attempted (no app launch)");
}

// ---------- 5. AppImage (if built) ----------
if (appImage) {
  const aiExists = await exists(appImage);
  check("AppImage file exists", aiExists, appImage);
  if (aiExists) {
    await fs.chmod(appImage, 0o755).catch(() => {});
    // /tmp on this VM is a 512 MB tmpfs; AppImage extraction needs
    // ~280 MB there and fails with exit 127 when it is full (found
    // 06/11: /tmp hit 100% from earlier extractions). Point the
    // runtime's extraction at a disk-backed TMPDIR — a real user's /tmp
    // is disk-backed, so this approximates the real environment.
    const tmpDisk = path.join(os.homedir(), "workspace/.tmp-g6");
    await fs.mkdir(tmpDisk, { recursive: true });
    const tmpFree = await run("df", ["--output=avail", "-m", "/tmp"], { timeoutMs: 15000 });
    check("AppImage preflight: /tmp has room for extraction", true, `df /tmp: ${tmpFree.stdout.trim().replace(/\n/g, " ")} MB avail (TMPDIR for extraction is disk-backed: ${tmpDisk})`);
    await launchElectron({ label: "appimage", binary: appImage, cwd: DESK, extraArgs: ["--no-sandbox"], cdpPort: 9223, shotPath: "/tmp/g6-appimage-shot.png", envExtra: { APPIMAGE_EXTRACT_AND_RUN: "1", TMPDIR: tmpDisk }, userDataDir: path.join(os.homedir(), ".config", "VCut Studio") });
  }
} else {
  report.appImage = "not requested — no --appimage path given";
}

// ---------- 5b. Bridge-down smoke: does the app start services itself? ----------
// Stop the harness bridge, confirm it is really down, launch the app, and
// check the bridge stays down afterwards. G2's adapter is not wired into
// main.ts, so the expected (honest) outcome is: UI still loads (ok:true)
// but bridgeFromRenderer is a fetch error and :8787 stays down.
if (electronBin) {
  const stopped = await stopBridge();
  const downBefore = await httpJson("http://127.0.0.1:8787/api/health", 2000);
  check("bridge-down test: bridge really down before launch", !!downBefore.error, JSON.stringify(downBefore).slice(0, 200));
  const smokeB = await runSmoke({ label: "smoke-down", binary: electronBin, extraArgs: [".", "--no-sandbox"] });
  check("smoke (bridge down): UI still loads ok:true", smokeB.res?.ok === true, JSON.stringify(smokeB.res).slice(0, 300));
  // Phase 10 (gộp): G2 đã nối vào main — app TỰ khởi động bridge khi chưa
  // có bridge, nên bridgeFromRenderer phải là "ok" ngay cả khi lúc đầu
  // bridge tắt. Kỳ vọng cũ (!== "ok") là để xác nhận nợ G2, giờ đã đóng.
  check("smoke (bridge down): bridgeFromRenderer is ok (app self-started bridge)", smokeB.res?.bridgeFromRenderer === "ok", String(smokeB.res?.bridgeFromRenderer ?? "no result"));
  const downAfter = await httpJson("http://127.0.0.1:8787/api/health", 2000);
  check("smoke (bridge down): bridge down after app quit (clean stop, no orphan)", !!downAfter.error, JSON.stringify(downAfter).slice(0, 200));
}

report.finishedAt = new Date().toISOString();
report.passed = results.filter((r) => r.ok).length;
report.failed = results.filter((r) => !r.ok).length;
// Final hygiene: no Electron process from this run may survive at all.
const leftoverFinal = await run("pgrep", ["-f", "electron/dist/electro[n]"], { timeoutMs: 15000 });
check("final: no leftover electron processes", leftoverFinal.code !== 0, leftoverFinal.code === 0 ? "orphaned electron still running — see pgrep" : "clean");
report.passed = results.filter((r) => r.ok).length;
report.failed = results.filter((r) => !r.ok).length;
await fs.writeFile("/tmp/g6-verify-report.json", JSON.stringify(report, null, 2));
console.log(`\nSUMMARY: ${report.passed} passed, ${report.failed} failed — report: /tmp/g6-verify-report.json`);
process.exit(report.failed ? 1 : 0);
