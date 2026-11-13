#!/usr/bin/env node
/**
 * verify-electron-orphan-cleanup.mjs — Smoke test thật cho pidfile Electron
 * + dọn renderer/GPU con mồ côi giữ socket CDP (đợt 52, I4). Chạy bằng:
 *   node scripts/verify-electron-orphan-cleanup.mjs
 * (từ apps/desktop; cần Xvfb, Electron đã build).
 *
 * Kịch bản (mô phỏng nợ mở đợt 51 §4.8 / H7 §5.3):
 *  1. Build desktop (tsc + copy services js; dùng dist-web hiện có, thử
 *     vite build 1 lần nếu thiếu — không fail cả smoke khi build web của
 *     luồng khác đang dở).
 *  2. Pre-clean: dọn bridge + con Electron mồ côi của CHÍNH userData này
 *     (không đụng process luồng khác).
 *  3. Mở Electron #1 thật (dev, app://vcut) dưới Xvfb với CDP 9225; chờ
 *     CDP page target + bridge healthy + electron.pid.json được ghi; ghi
 *     pid main + pid bridge + pid các con (zygote/gpu/renderer) + holder
 *     socket CDP.
 *  4. `kill -9` ĐÚNG main process Electron (giống crash) — bridge detached
 *     và con Chromium phải SỐNG (mồ côi), vẫn giữ cổng bridge / socket CDP.
 *     (Nếu con Chromium tự thoát khi mất IPC thì ghi nhận đúng như vậy —
 *     xem bước 5; bridge mồ côi là bằng chứng chính.)
 *  5. Gọi cleanupStaleElectronChildren + cleanupStaleBridge (đường harness
 *     dọn TRƯỚC khi spawn — mô phỏng lần chạy sau): kiểm chứng bridge mồ
 *     côi chết, con mồ côi còn sót chết, cổng CDP trống, pidfile đã dọn.
 *  6. Mở lại Electron #2: bind CDP thành công (page target có), bridge mới
 *     healthy, pidfile mới được ghi — chứng minh cổng đã trống cho lần
 *     chạy sau.
 *  7. Thoát sạch #2 qua CDP (đóng cửa sổ): bridge chết, pidfile xoá,
 *     không còn electron nào giữ cổng CDP này.
 *
 * AN TOÀN đa luồng: chỉ kill đúng Electron do script này spawn + bridge/
 * con ghi trong pidfile của userData này; cổng CDP 9225 + display :98
 * riêng (H7 dùng 9224/:97, harness G6 dùng 9222/9223/:99). Không dùng
 * pgrep -f bridge chung. Kết quả: in JSON + ghi
 * /tmp/vcut-i4-electron-orphan-report.json; exit 0 khi tất cả check pass,
 * 1 khi có check fail.
 */
import { spawn, execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { writeFileEpermRetryAsync } from "../../web/scripts/eperm-retry.mjs";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";

const requireCjs = createRequire(import.meta.url);
const REPO = path.resolve(os.homedir(), "workspace/repo-1");
const DESK = path.join(REPO, "apps/desktop");
const USER_DATA = path.join(os.homedir(), ".config", "@repo-1", "desktop-i4-smoke");
const CDP_PORT = Number(process.env.VCUT_I4_CDP_PORT ?? "9225");
const DISPLAY = process.env.VCUT_I4_DISPLAY ?? ":98";
const REPORT_PATH = "/tmp/vcut-i4-electron-orphan-report.json";

const steps = [];
function step(name, ok, detail = "") {
  steps.push({ name, ok: !!ok, detail: String(detail).slice(0, 500) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + String(detail).slice(0, 300) : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024, timeout: opts.timeoutMs ?? 600000, cwd: opts.cwd ?? REPO, env: { ...process.env, ...(opts.env ?? {}) } }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, stdout: String(stdout ?? ""), stderr: String(stderr ?? "") });
    });
  });
}
async function httpJson(url, timeoutMs = 3000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeoutMs);
  try { const r = await fetch(url, { signal: c.signal }); const txt = await r.text(); try { return { status: r.status, json: JSON.parse(txt) }; } catch { return { status: r.status, text: txt.slice(0, 300) }; } }
  catch (e) { return { error: String(e.message ?? e) }; } finally { clearTimeout(t); }
}
function pidAlive(pid) { try { process.kill(pid, 0); return true; } catch { return false; } }
/** Mọi pid đang listen trên cổng (qua ss -ltnp). */
async function listenerPids(port) {
  const r = await run("ss", ["-ltnp", `sport = :${port}`], { timeoutMs: 15000 });
  const out = [];
  for (const m of r.stdout.matchAll(/pid=(\d+)/g)) out.push(Number(m[1]));
  return out;
}
/** Đọc ppid từ /proc/<pid>/stat (null khi process đã chết). */
function parentPid(pid) {
  try {
    const stat = requireCjs("node:fs").readFileSync(`/proc/${pid}/stat`, "utf8");
    const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    const ppid = Number(fields[1]);
    return Number.isInteger(ppid) ? ppid : null;
  } catch { return null; }
}
/** Liệt kê con trực tiếp + cháu của một pid qua /proc (cmdline rút gọn). */
function listElectronTree(rootPid) {
  const out = [];
  let pids = [];
  try { pids = requireCjs("node:fs").readdirSync("/proc").filter((d) => /^\d+$/.test(d)).map(Number); } catch { return out; }
  const byPpid = new Map();
  for (const pid of pids) {
    const ppid = parentPid(pid);
    if (ppid === null) continue;
    if (!byPpid.has(ppid)) byPpid.set(ppid, []);
    byPpid.get(ppid).push(pid);
  }
  const walk = (pid, depth) => {
    for (const child of byPpid.get(pid) ?? []) {
      let cmd = "";
      try { cmd = requireCjs("node:fs").readFileSync(`/proc/${child}/cmdline`, "utf8").replace(/\0/g, " ").slice(0, 200); } catch { /* chết giữa chừng */ }
      out.push({ child, cmd, depth, ppid: pid });
      if (depth < 3) walk(child, depth + 1);
    }
  };
  walk(rootPid, 0);
  return out;
}
async function waitFor(cond, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await cond()) return true;
    if (Date.now() >= deadline) throw new Error(`timeout chờ: ${label}`);
    await sleep(500);
  }
}
async function waitForPortFree(port, timeoutMs) {
  try {
    await waitFor(async () => (await listenerPids(port)).length === 0, timeoutMs, `cổng ${port} trống`);
    return true;
  } catch { return false; }
}
async function resolveElectronBin() {
  for (const cand of [
    path.join(REPO, "node_modules/electron/dist/electron"),
    path.join(DESK, "node_modules/electron/dist/electron"),
    path.join(DESK, "node_modules/.bin/electron"),
    path.join(REPO, "node_modules/.bin/electron"),
  ]) if (await exists(cand)) return cand;
  return null;
}

const pidfileMod = requireCjs(path.join(DESK, "src/services/bridgePidfile.js"));
const electronMod = requireCjs(path.join(DESK, "src/services/electronOrphanCleanup.js"));

async function launchElectron(label) {
  const logPath = `/tmp/i4-${label}.log`;
  const logStream = (await import("node:fs")).createWriteStream(logPath);
  const binary = await resolveElectronBin();
  const child = spawn(binary, [".", "--no-sandbox", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${USER_DATA}`], {
    cwd: DESK, detached: true,
    env: { ...process.env, DISPLAY, ELECTRON_DISABLE_SANDBOX: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.pipe(logStream); child.stderr.pipe(logStream);
  return { binary, child, logPath };
}

async function waitForAppReady(timeoutMs = 60000) {
  let pageTarget = null;
  await waitFor(async () => {
    const list = await httpJson(`http://127.0.0.1:${CDP_PORT}/json/list`, 2000);
    const pages = Array.isArray(list.json) ? list.json.filter((t) => t.type === "page") : [];
    pageTarget = pages.find((t) => /app:\/\/|file:|localhost|127\.0\.0\.1/.test(t.url)) ?? null;
    return !!pageTarget;
  }, timeoutMs, "CDP page target");
  return pageTarget;
}

async function waitForBridgeHealthy(port, timeoutMs = 90000) {
  await waitFor(async () => {
    const h = await httpJson(`http://127.0.0.1:${port}/api/health`, 2000);
    return !h.error && h.status === 200 && h.json?.ok === true;
  }, timeoutMs, `bridge :${port} healthy`);
}

async function closeWindowViaCdp(pageTarget) {
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
  };
  await send("Runtime.enable");
  try { await send("Runtime.evaluate", { expression: "window.close()" }); } catch {}
  ws.close();
}

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
  const reapDeadline = Date.now() + 5000;
  while (Date.now() < reapDeadline) {
    if (child.exitCode !== null || !pidAlive(child.pid)) return;
    await sleep(250);
  }
}

function processGone(child) {
  return child.exitCode !== null || !pidAlive(child.pid);
}

async function main() {
  // 1. Build desktop (tsc + copy services js). Web: dùng dist-web hiện có;
  // chỉ thử vite build khi thiếu file (tránh fail do build của luồng khác).
  const deskBuild = await run("npm", ["run", "build"], { cwd: DESK, timeoutMs: 180000 });
  step("tsc + copy-services-js apps/desktop exit 0", deskBuild.code === 0, (deskBuild.stdout + deskBuild.stderr).slice(-300));
  step("dist/services/electronOrphanCleanup.js exists", await exists(path.join(DESK, "dist/services/electronOrphanCleanup.js")));
  if (!await exists(path.join(DESK, "dist-web/index.html"))) {
    const webBuild = await run("npm", ["run", "build", "--workspace=@repo-1/web"], { timeoutMs: 600000 });
    step("vite build apps/web exit 0 (dist-web đang thiếu)", webBuild.code === 0, (webBuild.stdout + webBuild.stderr).slice(-300));
    const copyWeb = await run("node", ["scripts/copy-web-dist.mjs"], { cwd: DESK, timeoutMs: 120000 });
    step("copy-web-dist.mjs exit 0", copyWeb.code === 0, (copyWeb.stdout + copyWeb.stderr).slice(-300));
  } else {
    step("dist-web/index.html đã có (dùng bản hiện có)", true);
  }

  // 2. Pre-clean của CHÍNH userData này.
  const preBridge = await pidfileMod.cleanupStaleBridge(USER_DATA, { cdpPort: CDP_PORT });
  const preElectron = await electronMod.cleanupStaleElectronChildren(USER_DATA, { cdpPort: CDP_PORT });
  step("pre-clean bridge mồ côi (userData này)", true, `${preBridge.action} — ${preBridge.reason}`);
  step("pre-clean con Electron mồ côi (userData này)", true, `${preElectron.action} — ${preElectron.reason}`);

  const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24"], { stdio: "ignore" });
  await sleep(1500);
  try {
    // 3. Mở Electron #1.
    const app1 = await launchElectron("run1");
    const electronPid1 = app1.child.pid;
    step("electron #1 process alive", app1.child.exitCode === null, `pid=${electronPid1}`);
    let page1 = null;
    try { page1 = await waitForAppReady(); } catch (e) { step("electron #1: CDP page target", false, e.message); }
    step("electron #1: CDP page target", !!page1, page1 ? page1.url : "không thấy page");
    let bridgeRec1 = null;
    try {
      await waitFor(() => { bridgeRec1 = pidfileMod.readBridgePidfile(USER_DATA); return !!bridgeRec1; }, 90000, "pidfile bridge xuất hiện");
    } catch (e) { step("electron #1: pidfile bridge được ghi", false, e.message); }
    step("electron #1: pidfile bridge được ghi", !!bridgeRec1, bridgeRec1 ? `pid=${bridgeRec1.pid} port=${bridgeRec1.port}` : "không có pidfile");
    let electronRec1 = null;
    try {
      await waitFor(() => { electronRec1 = electronMod.readElectronPidfile(USER_DATA); return !!electronRec1; }, 30000, "electron.pid.json xuất hiện");
    } catch (e) { step("electron #1: electron.pid.json được ghi", false, e.message); }
    step("electron #1: electron.pid.json được ghi", !!electronRec1, electronRec1 ? `appPid=${electronRec1.appPid} cdp=${electronRec1.cdpPort} exec=${electronRec1.execPath}` : "không có pidfile");
    step("electron #1: pidfile Electron trỏ đúng main", !!electronRec1 && electronRec1.appPid === electronPid1, electronRec1 ? `appPid=${electronRec1.appPid} vs main=${electronPid1}` : "không có pidfile");
    const bridgePid1 = bridgeRec1?.pid;
    const bridgePort1 = bridgeRec1?.port;
    if (bridgeRec1) {
      try { await waitForBridgeHealthy(bridgePort1); step("electron #1: bridge healthy", true, `:${bridgePort1} pid=${bridgePid1}`); }
      catch (e) { step("electron #1: bridge healthy", false, e.message); }
    }
    step("electron #1: bridge pid sống", !!bridgePid1 && pidAlive(bridgePid1), `pid=${bridgePid1}`);
    // Cây con Electron lúc đang chạy (để đối chiếu sau kill -9).
    const tree1 = listElectronTree(electronPid1);
    const childTypes1 = tree1.map((n) => `${n.child}:${/--type=([a-z-]+)/.exec(n.cmd)?.[1] ?? "main?"}`).join(", ");
    step("electron #1: có con Chromium (zygote/gpu/renderer)", tree1.length > 0, `children=[${childTypes1}]`);
    const cdpHolders1 = await listenerPids(CDP_PORT);
    step("electron #1: socket CDP do main giữ (+ bridge kế thừa)", cdpHolders1.includes(electronPid1), `ss ${CDP_PORT} → pids=[${cdpHolders1.join(",")}], main=${electronPid1}, bridge=${bridgePid1}`);

    // 4. kill -9 ĐÚNG main process Electron.
    process.kill(electronPid1, "SIGKILL");
    await sleep(2000);
    step("kill -9: electron #1 đã chết", !pidAlive(electronPid1), `pid=${electronPid1}`);
    step("kill -9: bridge MỒ CÔI vẫn sống (đúng như nợ Phase 10)", !!bridgePid1 && pidAlive(bridgePid1), `bridge pid=${bridgePid1}`);
    if (bridgePort1) {
      const h = await httpJson(`http://127.0.0.1:${bridgePort1}/api/health`, 2000);
      step("kill -9: bridge mồ côi vẫn trả health", !h.error && h.json?.ok === true, JSON.stringify(h).slice(0, 200));
    }
    const cdpHoldersAfterKill = await listenerPids(CDP_PORT);
    const orphanChildren = tree1.filter((n) => pidAlive(n.child));
    step("kill -9: socket CDP vẫn bị mồ côi giữ", cdpHoldersAfterKill.length > 0, `ss ${CDP_PORT} → pids=[${cdpHoldersAfterKill.join(",")}]`);
    step("kill -9: con Chromium mồ côi còn sót (quan sát, không bắt buộc)", true,
      orphanChildren.length > 0
        ? `còn ${orphanChildren.length} con sống: [${orphanChildren.map((n) => `${n.child}:${/--type=([a-z-]+)/.exec(n.cmd)?.[1] ?? "?"}`).join(", ")}] (ppid=${orphanChildren.map((n) => parentPid(n.child)).join(",")})`
        : "không còn con Chromium nào sống sau kill -9 (tự thoát khi mất IPC — ghi nhận, không phải lỗi cleanup)");

    // 5. Dọn như lần chạy sau (harness dọn TRƯỚC khi spawn).
    // THỨ TỰ: dọn con Electron TRƯỚC, bridge sau — vì con Chromium tự
    // thoát sau vài giây khi mất IPC với main (đo thật: có lượt chúng tự
    // thoát ngay trong lúc chờ bridge cleanup, làm electron cleanup không
    // còn gì để dọn). Dọn con trước để cơ chế dọn có cơ hội chứng minh
    // trên con thật còn sống; trong app thật start() dọn bridge trước rồi
    // mới dọn con — thứ tự không ảnh hưởng trạng thái cuối (cùng sạch),
    // chỉ ảnh hưởng bên nào "ghi công" khi con tự thoát giữa chừng.
    // Chụp lại con nào còn sống NGAY trước khi dọn để phân biệt: bị module
    // kill / tự thoát / còn sống (chỉ cái cuối mới là fail). Chỉ xét con
    // Electron (loại bridge + con của bridge — bridge do cleanupStaleBridge
    // dọn, đã có check riêng ở trên).
    const electronOrphans = orphanChildren.filter((n) => n.child !== bridgePid1 && n.ppid !== bridgePid1);
    const aliveBeforeCleanup = electronOrphans.filter((n) => pidAlive(n.child));
    const cleanElectron = await electronMod.cleanupStaleElectronChildren(USER_DATA, { cdpPort: CDP_PORT });
    const cleanBridge = await pidfileMod.cleanupStaleBridge(USER_DATA, { cdpPort: CDP_PORT });
    step("dọn sau kill -9: bridge mồ côi ĐÃ CHẾT", !!bridgePid1 && !pidAlive(bridgePid1), `${cleanBridge.action} — ${cleanBridge.reason}`);
    {
      const killedByModule = new Set((cleanElectron.killedPids ?? []).map((k) => k.pid));
      const stillAlive = aliveBeforeCleanup.filter((n) => pidAlive(n.child));
      const selfExited = aliveBeforeCleanup.filter((n) => !pidAlive(n.child) && !killedByModule.has(n.child));
      const detail = `electron-cleanup: ${cleanElectron.action} — killed=[${[...killedByModule].join(",")}]` +
        (selfExited.length ? ` tự-thoát=[${selfExited.map((n) => n.child).join(",")}]` : "") +
        (stillAlive.length ? ` CÒN-SỐNG=[${stillAlive.map((n) => n.child).join(",")}]` : "");
      step("dọn sau kill -9: con Chromium mồ côi không còn sống (module kill hoặc tự thoát)", stillAlive.length === 0, detail);
    }
    const cdpFree = await waitForPortFree(CDP_PORT, 30000);
    step("dọn sau kill -9: cổng CDP đã trống", cdpFree, cdpFree ? "sẵn sàng mở lại" : `ss ${CDP_PORT} → pids=[${(await listenerPids(CDP_PORT)).join(",")}]`);

    // 6. Mở lại Electron #2 — phải bind được CDP (cổng đã trống TRƯỚC khi spawn).
    const app2 = await launchElectron("run2");
    const electronPid2 = app2.child.pid;
    step("electron #2 process alive", app2.child.exitCode === null, `pid=${electronPid2}`);
    let page2 = null;
    try { page2 = await waitForAppReady(); } catch (e) { step("electron #2: CDP page target (bind lại cổng CDP OK)", false, e.message); }
    step("electron #2: CDP page target (bind lại cổng CDP OK)", !!page2, page2 ? page2.url : "không thấy page — bind CDP vẫn fail?");
    let bridgeRec2 = null;
    try {
      await waitFor(() => { bridgeRec2 = pidfileMod.readBridgePidfile(USER_DATA); return !!bridgeRec2 && bridgeRec2.pid !== bridgePid1; }, 90000, "pidfile bridge mới");
    } catch (e) { step("electron #2: pidfile bridge mới", false, e.message); }
    if (bridgeRec2) {
      step("electron #2: bridge mới (pid khác mồ côi cũ)", bridgeRec2.pid !== bridgePid1, `pid=${bridgeRec2.pid} port=${bridgeRec2.port} (cũ ${bridgePid1})`);
      try { await waitForBridgeHealthy(bridgeRec2.port); step("electron #2: bridge mới healthy", true, `:${bridgeRec2.port} pid=${bridgeRec2.pid}`); }
      catch (e) { step("electron #2: bridge mới healthy", false, e.message); }
    }
    const cdpHolders2 = await listenerPids(CDP_PORT);
    step("electron #2: socket CDP do Electron mới giữ", cdpHolders2.includes(electronPid2), `ss ${CDP_PORT} → pids=[${cdpHolders2.join(",")}], electron=${electronPid2}`);

    // 7. Thoát sạch #2 qua CDP.
    if (page2) {
      try { await closeWindowViaCdp(page2); } catch (e) { console.log(`[i4] close window lỗi: ${e.message}`); }
      const quitDeadline = Date.now() + 15000;
      while (Date.now() < quitDeadline && app2.child.exitCode === null) await sleep(250);
    }
    await killTree(app2.child);
    await sleep(1000);
    step("thoát sạch: electron #2 đã thoát", processGone(app2.child), `exitCode=${app2.child.exitCode}`);
    if (bridgeRec2) {
      step("thoát sạch: bridge mới đã chết", !pidAlive(bridgeRec2.pid), `pid=${bridgeRec2.pid}`);
    }
    step("thoát sạch: electron.pid.json đã xoá", !await exists(path.join(USER_DATA, "electron.pid.json")));
    step("thoát sạch: bridge.pid.json đã xoá", !await exists(path.join(USER_DATA, "bridge.pid.json")));
    const leftover = await run("pgrep", ["-f", `remote-debugging-port=${CDP_PORT}`], { timeoutMs: 15000 });
    step("thoát sạch: không còn electron nào giữ cổng CDP này", leftover.code !== 0, leftover.code === 0 ? "pgrep vẫn thấy process" : "sạch");
  } finally {
    try { xvfb.kill("SIGKILL"); } catch {}
  }

  const passed = steps.filter((s) => s.ok).length;
  const failed = steps.filter((s) => !s.ok).length;
  const report = { cdpPort: CDP_PORT, display: DISPLAY, failed, finishedAt: new Date().toISOString(), passed, steps, userData: USER_DATA };
  await writeFileEpermRetryAsync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nSUMMARY: ${passed} passed, ${failed} failed — report: ${REPORT_PATH}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("[i4] Lỗi không bắt được:", err);
  process.exit(1);
});
