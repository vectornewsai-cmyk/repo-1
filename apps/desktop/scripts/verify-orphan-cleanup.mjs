#!/usr/bin/env node
/**
 * verify-orphan-cleanup.mjs — Smoke test thật cho pidfile + dọn bridge mồ
 * côi (đợt 51, H7). Chạy bằng: node scripts/verify-orphan-cleanup.mjs
 * (từ apps/desktop; cần Xvfb, Electron đã build).
 *
 * Kịch bản (mô phỏng đúng nợ mở Phase 10 LIMITS §5.2):
 *  1. Build desktop (tsc + copy services js + copy web dist; vite build
 *     thử lại 1 lần nếu fail do build song song của luồng khác).
 *  2. Dọn pidfile cũ của CHÍNH userData này (không đụng process luồng khác).
 *  3. Mở Electron #1 thật (production, app://vcut) dưới Xvfb với CDP 9224;
 *     chờ bridge healthy + CDP có page target; ghi pid Electron + pid bridge.
 *  4. `kill -9` đúng main process Electron (giống crash) — bridge detached
 *     phải SỐNG (mồ côi), vẫn giữ cổng bridge + kế thừa socket CDP 9224.
 *  5. Mở lại Electron #2: lần chạy này dọn bridge mồ côi (pidfile) và
 *     spawn bridge mới healthy — nhưng KHÔNG bind được CDP (bind lúc khởi
 *     động, trước khi dọn — giới hạn đã biết, app vẫn mở bình thường).
 *     Các check của pha này PHẢI chờ pidfile đổi (gate 180s) vì Electron
 *     khởi động chậm dưới tải nặng — không được kết luận trên dữ liệu cũ.
 *  6. TRƯỚC khi mở #3: chờ cổng CDP trống (tối đa 120s để manager của #2
 *     kịp dọn; nếu vẫn bận thì script tự dọn theo mẫu harness, cùng module
 *     pidfile) — vì bind CDP xảy ra lúc khởi động, cổng phải trống TRƯỚC
 *     khi spawn thì lần chạy đó mới có CDP.
 *  7. Mở Electron #3: bind CDP thành công; dọn bridge mồ côi của #2;
 *     thoát sạch qua CDP (đóng cửa sổ) — kiểm chứng vòng đời đầy đủ.
 *
 * AN TOÀN đa luồng: chỉ kill đúng Electron do script này spawn + bridge ghi
 * trong pidfile của userData này; cổng CDP 9224 + display :97 riêng (harness
 * G6 dùng 9222/9223 + :99). Không dùng pgrep -f bridge chung.
 * Kết quả: in JSON + ghi /tmp/vcut-h7-orphan-report.json; exit 0 khi tất cả
 * check pass, 1 khi có check fail.
 */
import { spawn, execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";

const requireCjs = createRequire(import.meta.url);
const REPO = path.resolve(os.homedir(), "workspace/repo-1");
const DESK = path.join(REPO, "apps/desktop");
const USER_DATA = path.join(os.homedir(), ".config", "@repo-1", "desktop");
const CDP_PORT = Number(process.env.VCUT_H7_CDP_PORT ?? "9224");
const DISPLAY = process.env.VCUT_H7_DISPLAY ?? ":97";
const REPORT_PATH = "/tmp/vcut-h7-orphan-report.json";

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
/**
 * Mọi pid đang listen trên cổng (qua ss -ltnp). Một socket có thể được
 * nhiều process giữ (renderer cũng kế thừa FD của main) nên trả về danh
 * sách, không phải pid duy nhất.
 */
async function listenerPids(port) {
  const r = await run("ss", ["-ltnp", `sport = :${port}`], { timeoutMs: 15000 });
  const out = [];
  for (const m of r.stdout.matchAll(/pid=(\d+)/g)) out.push(Number(m[1]));
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

async function launchElectron(label) {
  const logPath = `/tmp/h7-${label}.log`;
  const logStream = (await import("node:fs")).createWriteStream(logPath);
  const binary = await resolveElectronBin();
  const child = spawn(binary, [".", "--no-sandbox", `--remote-debugging-port=${CDP_PORT}`], {
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

async function waitForBridgeHealthy(port, timeoutMs = 30000) {
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
  // Chờ reap (dưới tải nặng, zombie có thể làm pidAlive() còn true một lúc).
  const reapDeadline = Date.now() + 5000;
  while (Date.now() < reapDeadline) {
    if (child.exitCode !== null || !pidAlive(child.pid)) return;
    await sleep(250);
  }
}

/** Process đã chết hẳn chưa (exitCode có, hoặc pid không còn — kể cả zombie đã reap). */
function processGone(child) {
  return child.exitCode !== null || !pidAlive(child.pid);
}

async function main() {
  // 1. Build (để dist/services/bridgePidfile.js tươi).
  let webBuild = await run("npm", ["run", "build", "--workspace=@repo-1/web"], { timeoutMs: 600000 });
  if (webBuild.code !== 0) {
    console.log("[h7] vite build lần 1 fail (có thể do build song song của luồng khác) — thử lại sau 5s");
    await sleep(5000);
    webBuild = await run("npm", ["run", "build", "--workspace=@repo-1/web"], { timeoutMs: 600000 });
  }
  step("vite build apps/web exit 0", webBuild.code === 0, (webBuild.stdout + webBuild.stderr).slice(-300));
  const deskBuild = await run("npm", ["run", "build"], { cwd: DESK, timeoutMs: 180000 });
  step("tsc emit apps/desktop exit 0", deskBuild.code === 0, (deskBuild.stdout + deskBuild.stderr).slice(-300));
  step("dist/services/bridgePidfile.js exists", await exists(path.join(DESK, "dist/services/bridgePidfile.js")));
  const copyWeb = await run("node", ["scripts/copy-web-dist.mjs"], { cwd: DESK, timeoutMs: 120000 });
  step("copy-web-dist.mjs exit 0", copyWeb.code === 0, (copyWeb.stdout + copyWeb.stderr).slice(-300));

  // 2. Dọn pidfile cũ của CHÍNH userData này (lần chạy trước của script này).
  const preClean = await pidfileMod.cleanupStaleBridge(USER_DATA, { cdpPort: CDP_PORT });
  step("pre-clean pidfile cũ (userData này)", true, `${preClean.action} — ${preClean.reason}`);

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
    // Chờ manager spawn bridge + ghi pidfile.
    let rec1 = null;
    try {
      await waitFor(() => { rec1 = pidfileMod.readBridgePidfile(USER_DATA); return !!rec1; }, 60000, "pidfile xuất hiện");
    } catch (e) { step("electron #1: pidfile được ghi", false, e.message); }
    step("electron #1: pidfile được ghi", !!rec1, rec1 ? `pid=${rec1.pid} port=${rec1.port}` : "không có pidfile");
    if (rec1) {
      try { await waitForBridgeHealthy(rec1.port); step("electron #1: bridge healthy", true, `:${rec1.port} pid=${rec1.pid}`); }
      catch (e) { step("electron #1: bridge healthy", false, e.message); }
    }
    const bridgePid1 = rec1?.pid;
    const bridgePort1 = rec1?.port;
    step("electron #1: bridge pid sống", !!bridgePid1 && pidAlive(bridgePid1), `pid=${bridgePid1}`);

    // 4. kill -9 đúng main process Electron.
    process.kill(electronPid1, "SIGKILL");
    await sleep(2000);
    step("kill -9: electron #1 đã chết", !pidAlive(electronPid1), `pid=${electronPid1}`);
    step("kill -9: bridge MỒ CÔI vẫn sống (đúng như nợ Phase 10)", !!bridgePid1 && pidAlive(bridgePid1), `bridge pid=${bridgePid1}`);
    if (bridgePort1) {
      const h = await httpJson(`http://127.0.0.1:${bridgePort1}/api/health`, 2000);
      step("kill -9: bridge mồ côi vẫn trả health", !h.error && h.json?.ok === true, JSON.stringify(h).slice(0, 200));
    }
    const cdpHoldersAfterKill = await listenerPids(CDP_PORT);
    step("kill -9: socket CDP vẫn bị mồ côi giữ (đúng như nợ Phase 10)", cdpHoldersAfterKill.includes(bridgePid1), `ss ${CDP_PORT} → pids=[${cdpHoldersAfterKill.join(",")}], bridge=${bridgePid1}`);

    // 5. Mở lại Electron #2 — lần chạy dọn.
    // GIỚI HẠN ĐÃ BIẾT (xem bridgePidfile.js): Electron bind cổng CDP lúc
    // khởi động, TRƯỚC khi main.ts chạy — nên lần chạy này KHÔNG bind được
    // CDP (mồ côi vẫn giữ cổng lúc spawn), app vẫn mở bình thường, chỉ mất
    // CDP; việc dọn mồ côi giải phóng cổng cho LẦN CHẠY SAU (#3).
    const app2 = await launchElectron("run2");
    const electronPid2 = app2.child.pid;
    step("electron #2 process alive", app2.child.exitCode === null, `pid=${electronPid2}`);
    let page2 = null;
    try { page2 = await waitForAppReady(15000); } catch (e) { /* dự kiến: không có CDP */ }
    step("electron #2: CDP vắng (đúng giới hạn đã biết: bind trước khi dọn)", page2 === null, page2 ? "có page — ngoài dự kiến" : "không có CDP ở lần chạy dọn này");
    // GATE: chờ pidfile đổi sang bridge mới (tối đa 180s — Electron khởi
    // động chậm dưới tải nặng, lượt trước manager mất >70s mới start).
    // KHÔNG kết luận gì trên pidfile cũ nếu gate này timeout.
    let rec2 = null;
    let pidfileChanged2 = false;
    try {
      await waitFor(() => { rec2 = pidfileMod.readBridgePidfile(USER_DATA); return !!rec2 && rec2.pid !== bridgePid1; }, 180000, "pidfile đổi sang bridge mới");
      pidfileChanged2 = true;
    } catch (e) { step("electron #2: pidfile đổi sang bridge mới (gate)", false, e.message); }
    if (pidfileChanged2) {
      step("electron #2: pidfile mới trỏ bridge mới", true, `pid=${rec2.pid} port=${rec2.port} (cũ ${bridgePid1})`);
      step("electron #2: bridge mồ côi cũ ĐÃ CHẾT (pidfile cleanup)", !pidAlive(bridgePid1), `bridge cũ pid=${bridgePid1}`);
      try { await waitForBridgeHealthy(rec2.port); step("electron #2: bridge mới healthy", true, `:${rec2.port} pid=${rec2.pid}`); }
      catch (e) { step("electron #2: bridge mới healthy", false, e.message); }
      step("electron #2: bridge mới sống", pidAlive(rec2.pid), `pid=${rec2.pid}`);
      step("electron #2: bridge mới dùng lại cổng cũ (không bị kẹt)", rec2.port === bridgePort1, `cũ :${bridgePort1} → mới :${rec2.port}`);
      const cdpHolders2 = await listenerPids(CDP_PORT);
      step("electron #2: socket CDP đã trống sau khi dọn mồ côi (cho lần chạy sau)", cdpHolders2.length === 0, `ss ${CDP_PORT} → pids=[${cdpHolders2.join(",")}]`);
    } else {
      step("electron #2: bridge mồ côi cũ ĐÃ CHẾT (pidfile cleanup)", false, "BỊ CHẶN: pidfile chưa đổi — manager của #2 chưa chạy xong, không kết luận được");
    }

    // 6. Thoát #2 (không có CDP nên không đóng cửa sổ sạch được — dùng
    // killTree; bridge của #2 (nếu có) sẽ thành mồ côi như trường hợp
    // kill -9, và #3 sẽ dọn nó).
    await killTree(app2.child);
    await sleep(1000);
    step("electron #2 đã thoát (killTree, không qua CDP)", processGone(app2.child), `pid=${electronPid2} exitCode=${app2.child.exitCode}`);
    // Mồ côi còn lại trước #3: bridge mới của #2 nếu gate đã qua, ngược lại
    // vẫn là bridge cũ của #1 (manager #2 chưa kịp dọn).
    const orphanBefore3 = pidfileChanged2 ? rec2?.pid : bridgePid1;
    if (orphanBefore3) {
      step("trước #3: bridge mồ côi còn sót (sẽ dọn ở lần chạy sau)", pidAlive(orphanBefore3), `bridge pid=${orphanBefore3}`);
    }

    // 7. GATE trước #3: cổng CDP phải trống TRƯỚC khi spawn (bind xảy ra
    // lúc khởi động). Chờ tối đa 120s để manager của #2 kịp dọn; nếu vẫn
    // bận thì script tự dọn theo mẫu harness (cùng module pidfile).
    let cdpFree = await waitForPortFree(CDP_PORT, 120000);
    if (!cdpFree) {
      const r = await pidfileMod.cleanupStaleBridge(USER_DATA, { cdpPort: CDP_PORT });
      console.log(`[h7] pre-clean trước #3: ${r.action} — ${r.reason}`);
      cdpFree = await waitForPortFree(CDP_PORT, 30000);
    }
    step("trước #3: cổng CDP đã trống (đủ điều kiện bind)", cdpFree, cdpFree ? "sẵn sàng spawn #3" : "CDP vẫn bận sau 120s + pre-clean");

    // 8. Mở Electron #3 — bind CDP thành công; dọn mồ côi còn sót; thoát sạch.
    const app3 = await launchElectron("run3");
    const electronPid3 = app3.child.pid;
    step("electron #3 process alive", app3.child.exitCode === null, `pid=${electronPid3}`);
    let page3 = null;
    try { page3 = await waitForAppReady(); } catch (e) { step("electron #3: CDP page target (bind lại cổng CDP OK)", false, e.message); }
    step("electron #3: CDP page target (bind lại cổng CDP OK)", !!page3, page3 ? page3.url : "không thấy page — bind CDP vẫn fail?");
    step("electron #3: bridge mồ côi trước đó ĐÃ CHẾT (pidfile cleanup)", !!orphanBefore3 && !pidAlive(orphanBefore3), `bridge trước #3 pid=${orphanBefore3}`);
    let rec3 = null;
    let pidfileChanged3 = false;
    try {
      await waitFor(() => { rec3 = pidfileMod.readBridgePidfile(USER_DATA); return !!rec3 && rec3.pid !== orphanBefore3; }, 120000, "pidfile mới");
      pidfileChanged3 = true;
    } catch (e) { step("electron #3: pidfile mới trỏ bridge mới (gate)", false, e.message); }
    if (pidfileChanged3) {
      step("electron #3: pidfile mới trỏ bridge mới", true, `pid=${rec3.pid} port=${rec3.port} (cũ ${orphanBefore3})`);
      try { await waitForBridgeHealthy(rec3.port); step("electron #3: bridge mới healthy", true, `:${rec3.port} pid=${rec3.pid}`); }
      catch (e) { step("electron #3: bridge mới healthy", false, e.message); }
      step("electron #3: bridge mới sống", pidAlive(rec3.pid), `pid=${rec3.pid}`);
    }
    const cdpHolders3 = await listenerPids(CDP_PORT);
    step("electron #3: socket CDP do Electron mới giữ (không còn bridge)", cdpHolders3.includes(electronPid3) && !cdpHolders3.includes(orphanBefore3), `ss ${CDP_PORT} → pids=[${cdpHolders3.join(",")}], electron=${electronPid3}, bridge trước=${orphanBefore3}`);

    // 9. Thoát sạch #3 — chỉ kỳ vọng bridge chết + pidfile xoá khi đường
    // đóng cửa sổ qua CDP thật sự chạy (page3 có). Không có CDP thì thoát
    // bằng killTree và bridge sẽ thành mồ côi (đúng như kill -9).
    if (page3) {
      try { await closeWindowViaCdp(page3); } catch (e) { console.log(`[h7] close window lỗi: ${e.message}`); }
      const quitDeadline = Date.now() + 10000;
      while (Date.now() < quitDeadline && app3.child.exitCode === null) await sleep(250);
    }
    await killTree(app3.child);
    await sleep(1000);
    step("thoát sạch: electron #3 đã thoát", processGone(app3.child), `exitCode=${app3.child.exitCode}`);
    if (page3) {
      if (rec3) {
        step("thoát sạch: bridge mới đã chết", !pidAlive(rec3.pid), `pid=${rec3.pid}`);
      }
      step("thoát sạch: pidfile đã xoá", !await exists(path.join(USER_DATA, "bridge.pid.json")));
    } else {
      step("thoát sạch: bridge thành mồ côi (không có CDP nên không thoát sạch được)", !!rec3 && pidAlive(rec3.pid), "đúng như kill -9 — lần chạy sau sẽ dọn");
    }
    const leftover = await run("pgrep", ["-f", `remote-debugging-port=${CDP_PORT}`], { timeoutMs: 15000 });
    step("thoát sạch: không còn electron nào giữ cổng CDP này", leftover.code !== 0, leftover.code === 0 ? "pgrep vẫn thấy process" : "sạch");
  } finally {
    try { xvfb.kill("SIGKILL"); } catch {}
  }

  const passed = steps.filter((s) => s.ok).length;
  const failed = steps.filter((s) => !s.ok).length;
  const report = { cdpPort: CDP_PORT, display: DISPLAY, failed, finishedAt: new Date().toISOString(), passed, steps, userData: USER_DATA };
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nSUMMARY: ${passed} passed, ${failed} failed — report: ${REPORT_PATH}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("[h7] Lỗi không bắt được:", err);
  process.exit(1);
});
