#!/usr/bin/env node
/**
 * clicktest-q5-round34-snapshot-probe.mjs — Phase 9 đợt 34, luồng Q5.
 *
 * Chứng minh động bằng treo GIẢ LẬP cho 3 wiring MỚI của Q5 (không
 * chứng minh lại phần O2/P3 — phần đó đã có probe riêng):
 *  (a) probe-round32-p5-webcodecs-pipe.mjs (pipe): trích đúng class
 *      PipeCdp từ file đã nối, warm-up trên Chrome thật, rồi pause
 *      stream đọc fd4 + timeout 1ms có chủ đích (mẫu P3).
 *  (b) seek-p2-underload-probe.mjs (WebSocket): trích đúng class Cdp
 *      từ file đã nối; bản trích được rút delay setTimeout 60000ms
 *      thành 1ms (chỉ thay đúng mẫu delay, fail nếu != 1 chỗ — mẫu
 *      P3) NHƯNG chạy trên stub ws (send no-op) để timeout là ĐƠN
 *      ĐỊNH, không đua 1ms với Chrome thật như probe P3; thêm lượt
 *      resolve trên WS thật với class KHÔNG rút để chứng minh wiring
 *      không phá đường bình thường.
 *  (c) mobile-touch-check.mjs (WebSocket, send() mới có timeout):
 *      trích đúng hàm send() từ file đã sửa; lượt treo chạy trên
 *      stub ws + timeoutMs 1ms (đơn định); lượt resolve chạy trên
 *      WS thật với onmessage chép đúng mẫu script (đã assert tĩnh
 *      script chứa "entry.resolve(d.result)").
 *  (d) Module cdp-snapshot.mjs sau sửa bundle-null: bundle null nay
 *      thành object { status: "not-captured", note } thay vì null
 *      trần; bundle có sẵn vẫn { status: "captured", name, sha }.
 *
 * Khác probe P3: KHÔNG rm thư mục bền trước mỗi target (xóa sẽ hủy
 * bằng chứng treo thật nếu có) — thay bằng đếm delta: số file mới
 * sau lượt ép timeout phải đúng 1. Các file probe được dọn sau kiểm
 * chứng để thư mục bền trở lại trạng thái trước probe.
 *
 * Đây vẫn là treo GIẢ LẬP — lần treo THẬT có snapshot vẫn là nợ mở.
 * Display :98 (pipe target, Xvfb), cổng WS 19323.
 * Kết quả JSON: benchmarks/results/v34-q5-snapshot-probe.json
 * (parent quyết stage). KHÔNG sửa code sản phẩm, KHÔNG push,
 * KHÔNG tag/release, KHÔNG binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SCRIPTS_DIR = path.join(ROOT, "apps", "web", "scripts");
const OUT_FILE = path.join(ROOT, "benchmarks", "results", "v34-q5-snapshot-probe.json");
const DURABLE_ROOT = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.Q5_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.Q5_DISPLAY || ":98";
const WS_PORT = Number(process.env.Q5_WS_PORT || 19323);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) { const l = `[${stamp()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

function extractClass(src, className) {
  const start = src.indexOf(`class ${className}`);
  if (start < 0) throw new Error(`không tìm thấy class ${className}`);
  const open = src.indexOf("{", start);
  if (open < 0) throw new Error(`không tìm thấy { mở của class ${className}`);
  let depth = 0;
  let i = open;
  let mode = null;
  while (i < src.length) {
    const ch = src[i];
    if (mode === "'") { if (ch === "\\") { i += 2; continue; } if (ch === "'") mode = null; i++; continue; }
    if (mode === '"') { if (ch === "\\") { i += 2; continue; } if (ch === '"') mode = null; i++; continue; }
    if (mode === "`") {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "`") mode = null; i++; continue;
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      i++; continue;
    }
    if (ch === "'") { mode = "'"; i++; continue; }
    if (ch === '"') { mode = '"'; i++; continue; }
    if (ch === "`") { mode = "`"; i++; continue; }
    if (ch === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (ch === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
    i++;
  }
  throw new Error(`không đóng được class ${className}`);
}

// Trích hàm send() của mobile-touch-check: phải bỏ qua cặp ngoặc của
// danh sách tham số (chứa default params = {}) rồi mới lấy "{" mở
// thân hàm, sau đó khớp ngoặc như extractClass. Fail nếu trích sai.
function extractSendFunction(src) {
  const start = src.indexOf("function send(");
  if (start < 0) throw new Error("không tìm thấy function send(");
  let i = src.indexOf("(", start);
  let paren = 0;
  let mode = null;
  let bodyOpen = -1;
  while (i < src.length) {
    const ch = src[i];
    if (mode === "'") { if (ch === "\\") { i += 2; continue; } if (ch === "'") mode = null; i++; continue; }
    if (mode === '"') { if (ch === "\\") { i += 2; continue; } if (ch === '"') mode = null; i++; continue; }
    if (mode === "`") {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "`") mode = null; i++; continue;
      if (ch === "{") paren++;
      if (ch === "}") paren--;
      i++; continue;
    }
    if (ch === "'") { mode = "'"; i++; continue; }
    if (ch === '"') { mode = '"'; i++; continue; }
    if (ch === "`") { mode = "`"; i++; continue; }
    if (ch === "(") paren++;
    if (ch === ")") { paren--; if (paren === 0) { bodyOpen = src.indexOf("{", i); break; } }
    i++;
  }
  if (bodyOpen < 0) throw new Error("không tìm thấy { mở thân send()");
  let depth = 0;
  i = bodyOpen;
  mode = null;
  while (i < src.length) {
    const ch = src[i];
    if (mode === "'") { if (ch === "\\") { i += 2; continue; } if (ch === "'") mode = null; i++; continue; }
    if (mode === '"') { if (ch === "\\") { i += 2; continue; } if (ch === '"') mode = null; i++; continue; }
    if (mode === "`") {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "`") mode = null; i++; continue;
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      i++; continue;
    }
    if (ch === "'") { mode = "'"; i++; continue; }
    if (ch === '"') { mode = '"'; i++; continue; }
    if (ch === "`") { mode = "`"; i++; continue; }
    if (ch === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (ch === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
    i++;
  }
  throw new Error("không đóng được function send()");
}

function pickChrome() {
  for (const b of BINARIES) if (fs.existsSync(b)) return b;
  throw new Error(`không tìm thấy Chrome trong: ${BINARIES.join(", ")}`);
}
function psHasChrome() {
  try {
    const ps = spawnSync("sh", ["-c", "ps -eo args | grep -E 'chrome' | grep -v grep | head -5"], { encoding: "utf8", timeout: 10000 });
    return (ps.stdout || "").includes("chrome");
  } catch { return false; }
}
function listFiles(dir) { try { return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort(); } catch { return []; } }
function readSnap(dir, name) { try { return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")); } catch { return null; } }
async function fetchTargets(port) {
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    try { const r = await fetch(`http://127.0.0.1:${port}/json/list`); const j = await r.json(); if (j.length) return j; } catch {}
  }
  throw new Error("không lấy được /json/list");
}
function openWs(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    ws.onopen = () => res(ws);
    ws.onerror = () => rej(new Error("ws open lỗi"));
    setTimeout(() => rej(new Error("ws timeout")), 15000);
  });
}
// Round-trip CDP thủ công (không qua class trích) để chứng minh WS
// thật sống trước khi đo wiring — tách bạch lỗi hạ tầng và lỗi wiring.
function rawRoundTrip(ws, method) {
  return new Promise((resolve, reject) => {
    const id = 999001;
    const timer = setTimeout(() => reject(new Error("raw round-trip timeout")), 15000);
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id === id) { clearTimeout(timer); d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result); }
    };
    ws.send(JSON.stringify({ id, method, params: {} }));
  });
}

const results = { runAt: new Date().toISOString(), label: "v34-q5", targets: [] };
let xvfb = null;
let xvfbOwned = false;
let chromePipe = null;
let chromeWs = null;
function cleanup() {
  try { chromePipe?.kill("SIGKILL"); } catch {}
  try { chromeWs?.kill("SIGKILL"); } catch {}
  try { if (xvfbOwned) xvfb?.kill("SIGKILL"); } catch {}
  chromePipe = null; chromeWs = null; xvfb = null;
}
async function ensureXvfb() {
  const num = DISPLAY.replace(":", "");
  const sock = `/tmp/.X11-unix/X${num}`;
  if (fs.existsSync(sock)) {
    let alive = false;
    try { alive = spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0; } catch {}
    if (alive) { log(`Xvfb: dùng chung display ${DISPLAY} (không kill khi dọn)`); return; }
    try { fs.unlinkSync(sock); } catch {}
    try { fs.unlinkSync(`/tmp/.X${num}-lock`); } catch {}
  }
  xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1280x800x24", "-nolisten", "tcp"], { stdio: "ignore" });
  xvfbOwned = true;
  for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
  if (!fs.existsSync(sock)) throw new Error(`Xvfb không tạo socket ${DISPLAY}`);
  await sleep(2000);
}
try {
  // ---- Target A: P5 pipe, pause fd4 + timeout 1ms (mẫu P3) ----
  {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "probe-round32-p5-webcodecs-pipe.mjs"), "utf8");
    const cls = extractClass(src, "PipeCdp");
    if (!cls.includes("captureCdpHangSnapshot")) throw new Error("bản trích PipeCdp P5 không chứa lệnh snapshot");
    if (!src.includes("vcut-cdp-hang-snapshots\", \"probe-round32-p5-webcodecs-pipe")) throw new Error("P5 chưa trỏ outDir bền");
    const outDir = path.join(DURABLE_ROOT, "probe-round32-p5-webcodecs-pipe");
    const before = listFiles(outDir);
    await ensureXvfb();
    const chromeBin = pickChrome();
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "q5-p5-profile-"));
    chromePipe = spawn(chromeBin, ["--no-sandbox", "--remote-debugging-pipe", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${profile}`, "--window-size=1280,800", "--window-position=0,0", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chromePipe.stdout?.on("data", () => {}); chromePipe.stderr?.on("data", () => {});
    await sleep(2000);
    const PipeCdp = new Function("captureCdpHangSnapshot", "CDP_HANG_OUT_DIR", "HANG_BUNDLE", "DISPLAY", "PORT", "log", `${cls}; return PipeCdp;`)(captureCdpHangSnapshot, outDir, null, DISPLAY, 4198, log);
    const cdp = new PipeCdp(chromePipe);
    const warm = await cdp.send("Target.getTargets", {}, undefined, 30000).catch(() => null);
    if (!warm || !Array.isArray(warm.targetInfos)) throw new Error("INFRA pipe P5 không trả lời warm-up (không phải lỗi wiring)");
    log(`pipe P5 warm-up OK, nTargets=${warm.targetInfos.length}`);
    chromePipe.stdio[4].pause();
    let rejectMsg = null;
    try { await cdp.send("Target.getTargets", {}, undefined, 1); } catch (e) { rejectMsg = e.message; }
    chromePipe.stdio[4].resume();
    await sleep(500);
    const fresh = listFiles(outDir).filter((f) => !before.includes(f));
    const snap = fresh.length === 1 ? readSnap(outDir, fresh[0]) : null;
    let aliveAfter = false;
    try { const r = await cdp.send("Target.getTargets", {}, undefined, 30000); aliveAfter = Array.isArray(r?.targetInfos); } catch {}
    const checks = {
      rejectGoc: rejectMsg === "CDP timeout Target.getTargets",
      dung1FileMoi: fresh.length === 1,
      pidKhop: snap?.proc?.pid === chromePipe.pid,
      psCoChrome: psHasChrome(),
      pipeSongSauTimeout: aliveAfter,
      outDirBen: outDir.startsWith(DURABLE_ROOT) && !outDir.includes("/tmp/"),
      bundleNotCaptured: snap?.bundle?.status === "not-captured" && snap?.bundle?.name === null,
      extraTransportPipe: snap?.extra?.transport === "pipe",
      timeoutMsGhiDung: snap?.timeoutMs === 1,
    };
    checks.all = Object.values(checks).every(Boolean);
    log(`target P5-pipe: reject=${JSON.stringify(rejectMsg)} fresh=${fresh.length} pidKhop=${checks.pidKhop} bundle=${snap?.bundle?.status} aliveAfter=${aliveAfter} all=${checks.all}`);
    results.targets.push({ id: "p5-pipe", checks, rejectMsg, snapshotFile: fresh[0] || null, pid: chromePipe.pid });
    for (const f of fresh) { try { fs.unlinkSync(path.join(outDir, f)); } catch {} }
    try { chromePipe.kill("SIGKILL"); } catch {}
    chromePipe = null;
  }
  // ---- Target B: P2 WS — treo đơn định trên stub ws + resolve thật ----
  {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "seek-p2-underload-probe.mjs"), "utf8");
    let cls = extractClass(src, "Cdp");
    if (!cls.includes("captureCdpHangSnapshot")) throw new Error("bản trích Cdp P2 không chứa lệnh snapshot");
    if (!src.includes("vcut-cdp-hang-snapshots\", \"seek-p2-underload-probe")) throw new Error("P2 chưa trỏ outDir bền");
    // Rút delay như P3, nhưng snapshot vẫn ghi timeoutMs 60000 thật.
    const delayPattern = "} }, 60000); }); }";
    const delayCount = cls.split(delayPattern).length - 1;
    if (delayCount !== 1) throw new Error(`bản trích Cdp P2 có ${delayCount} mẫu delay setTimeout 60000, kỳ vọng đúng 1`);
    const clsShrunk = cls.replace(delayPattern, "} }, 1); }); }");
    const outDir = path.join(DURABLE_ROOT, "seek-p2-underload-probe");
    const before = listFiles(outDir);
    const chromeBin = pickChrome();
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "q5-p2-profile-"));
    chromeWs = spawn(chromeBin, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${WS_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
    const targets = await fetchTargets(WS_PORT);
    const page = targets.find((t) => t.type === "page") || targets[0];
    // Warm-up độc lập với class trích: round-trip thủ công trên WS thật.
    const wsWarm = await openWs(page.webSocketDebuggerUrl);
    const warmRes = await rawRoundTrip(wsWarm, "Target.getTargets").catch(() => null);
    if (!warmRes || !Array.isArray(warmRes.targetInfos)) throw new Error("INFRA WS P2 không trả lời warm-up thủ công (không phải lỗi wiring)");
    try { wsWarm.close(); } catch {}
    log(`WS P2 warm-up thủ công OK, nTargets=${warmRes.targetInfos.length}`);
    const CdpShrunk = new Function("captureCdpHangSnapshot", "CDP_HANG_OUT_DIR", "PORT", "CDP_PORT", "log", `${clsShrunk}; return Cdp;`)(captureCdpHangSnapshot, outDir, 4322, WS_PORT, log);
    const stubWs = { send() {} };
    const cdpHang = new CdpShrunk(stubWs);
    cdpHang.proc = chromeWs;
    let rejectMsg = null;
    try { await cdpHang.send("Target.getTargets", {}); } catch (e) { rejectMsg = e.message; }
    await sleep(500);
    const fresh = listFiles(outDir).filter((f) => !before.includes(f));
    const snap = fresh.length === 1 ? readSnap(outDir, fresh[0]) : null;
    // Đường bình thường không rút: class gốc trên WS thật phải resolve.
    const CdpOrig = new Function("captureCdpHangSnapshot", "CDP_HANG_OUT_DIR", "PORT", "CDP_PORT", "log", `${cls}; return Cdp;`)(captureCdpHangSnapshot, outDir, 4322, WS_PORT, log);
    const wsReal = await openWs(page.webSocketDebuggerUrl);
    const cdpReal = new CdpOrig(wsReal);
    cdpReal.proc = chromeWs;
    let resolveOk = false;
    try { const r = await cdpReal.send("Target.getTargets", {}); resolveOk = Array.isArray(r?.targetInfos); } catch {}
    try { wsReal.close(); } catch {}
    const checks = {
      rejectGoc: rejectMsg === "cdp timeout Target.getTargets",
      dung1FileMoi: fresh.length === 1,
      pidKhop: snap?.proc?.pid === chromeWs.pid,
      psCoChrome: psHasChrome(),
      outDirBen: outDir.startsWith(DURABLE_ROOT) && !outDir.includes("/tmp/"),
      bundleNotCaptured: snap?.bundle?.status === "not-captured" && snap?.bundle?.name === null,
      extraTransportWs: snap?.extra?.transport === "websocket",
      // Snapshot ghi timeoutMs thật 60000 (chỉ timer bản trích bị rút).
      timeoutMsGhiDung: snap?.timeoutMs === 60000,
      duongThuongVanResolve: resolveOk,
    };
    checks.all = Object.values(checks).every(Boolean);
    log(`target P2-ws: reject=${JSON.stringify(rejectMsg)} fresh=${fresh.length} pidKhop=${checks.pidKhop} bundle=${snap?.bundle?.status} resolveThuc=${resolveOk} all=${checks.all}`);
    results.targets.push({ id: "p2-ws", checks, rejectMsg, snapshotFile: fresh[0] || null, pid: chromeWs.pid });
    for (const f of fresh) { try { fs.unlinkSync(path.join(outDir, f)); } catch {} }
    try { chromeWs.kill("SIGKILL"); } catch {}
    chromeWs = null;
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  // ---- Target C: mobile-touch-check — treo đơn định + resolve thật ----
  {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "mobile-touch-check.mjs"), "utf8");
    const fnSrc = extractSendFunction(src);
    if (!fnSrc.includes("captureCdpHangSnapshot")) throw new Error("bản trích send() mobile không chứa lệnh snapshot");
    if (!fnSrc.includes("timeoutMs = 60000")) throw new Error("bản trích send() mobile không có timeout mặc định 60000");
    if (!src.includes("entry.resolve(d.result)")) throw new Error("mobile-touch-check chưa đổi onmessage sang entry.resolve (đường bình thường có thể gãy)");
    if (!src.includes("vcut-cdp-hang-snapshots\", \"mobile-touch-check")) throw new Error("mobile chưa trỏ outDir bền");
    const outDir = path.join(DURABLE_ROOT, "mobile-touch-check");
    const before = listFiles(outDir);
    const chromeBin = pickChrome();
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "q5-mobile-profile-"));
    chromeWs = spawn(chromeBin, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${WS_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
    const targets = await fetchTargets(WS_PORT);
    const page = targets.find((t) => t.type === "page") || targets[0];
    const sendFactory = new Function("pending", "ws", "nextId", "chrome", "captureCdpHangSnapshot", "CDP_HANG_OUT_DIR", "PORT", `${fnSrc}; return send;`);
    // Lượt treo: stub ws không bao giờ trả lời + timeoutMs 1ms.
    const pendingHang = new Map();
    const sendHang = sendFactory(pendingHang, { send() {} }, 1, chromeWs, captureCdpHangSnapshot, outDir, 9227);
    let rejectMsg = null;
    try { await sendHang("Target.getTargets", {}, 1); } catch (e) { rejectMsg = e.message; }
    await sleep(500);
    const fresh = listFiles(outDir).filter((f) => !before.includes(f));
    const snap = fresh.length === 1 ? readSnap(outDir, fresh[0]) : null;
    // Lượt bình thường: WS thật + onmessage đúng mẫu script.
    const pendingReal = new Map();
    const wsReal = await openWs(page.webSocketDebuggerUrl);
    wsReal.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pendingReal.has(d.id)) {
        const entry = pendingReal.get(d.id);
        pendingReal.delete(d.id);
        entry.resolve(d.result);
      }
    };
    const sendReal = sendFactory(pendingReal, wsReal, 100, chromeWs, captureCdpHangSnapshot, outDir, 9227);
    let resolveOk = false;
    try { const r = await sendReal("Target.getTargets", {}); resolveOk = Array.isArray(r?.targetInfos); } catch {}
    try { wsReal.close(); } catch {}
    const checks = {
      rejectGoc: rejectMsg === "cdp timeout Target.getTargets",
      dung1FileMoi: fresh.length === 1,
      pidKhop: snap?.proc?.pid === chromeWs.pid,
      psCoChrome: psHasChrome(),
      outDirBen: outDir.startsWith(DURABLE_ROOT) && !outDir.includes("/tmp/"),
      bundleNotCaptured: snap?.bundle?.status === "not-captured" && snap?.bundle?.name === null,
      extraTransportWs: snap?.extra?.transport === "websocket",
      timeoutMsGhiDung: snap?.timeoutMs === 1,
      duongThuongVanResolve: resolveOk,
      pendingSauTreoRong: pendingHang.size === 0,
    };
    checks.all = Object.values(checks).every(Boolean);
    log(`target mobile-ws: reject=${JSON.stringify(rejectMsg)} fresh=${fresh.length} pidKhop=${checks.pidKhop} bundle=${snap?.bundle?.status} resolveThuc=${resolveOk} all=${checks.all}`);
    results.targets.push({ id: "mobile-ws", checks, rejectMsg, snapshotFile: fresh[0] || null, pid: chromeWs.pid });
    for (const f of fresh) { try { fs.unlinkSync(path.join(outDir, f)); } catch {} }
    try { chromeWs.kill("SIGKILL"); } catch {}
    chromeWs = null;
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  // ---- Target D: module — bundle null nay là object tường minh ----
  {
    const outDir = path.join(DURABLE_ROOT, "_unspecified");
    const before = listFiles(outDir);
    const rNull = captureCdpHangSnapshot({ proc: null, pendingCount: 0, method: "Target.getTargets", timeoutMs: 1 });
    const rCap = captureCdpHangSnapshot({ proc: null, pendingCount: 0, method: "Target.getTargets", timeoutMs: 1, bundle: { bundle: "index-Q5test.js", sha: "0123456789abcdef" } });
    const after = listFiles(outDir);
    const fresh = after.filter((f) => !before.includes(f));
    const snapNull = rNull.file ? readSnap(outDir, path.basename(rNull.file)) : null;
    const snapCap = rCap.file ? readSnap(outDir, path.basename(rCap.file)) : null;
    const checks = {
      nullThanhObject: snapNull?.bundle !== null && typeof snapNull?.bundle === "object",
      nullStatus: snapNull?.bundle?.status === "not-captured",
      nullNameRong: snapNull?.bundle?.name === null && snapNull?.bundle?.sha256_16 === null,
      nullCoNote: typeof snapNull?.bundle?.note === "string" && snapNull.bundle.note.length > 0,
      capturedStatus: snapCap?.bundle?.status === "captured",
      capturedGiuTenSha: snapCap?.bundle?.name === "index-Q5test.js" && snapCap?.bundle?.sha256_16 === "0123456789abcdef",
      dung2FileMoi: fresh.length === 2,
    };
    checks.all = Object.values(checks).every(Boolean);
    log(`target module-bundle: null->${snapNull?.bundle?.status} captured->${snapCap?.bundle?.status} fresh=${fresh.length} all=${checks.all}`);
    results.targets.push({ id: "module-bundle", checks, files: fresh });
    for (const f of fresh) { try { fs.unlinkSync(path.join(outDir, f)); } catch {} }
  }
  results.allPass = results.targets.every((t) => t.checks.all);
  results.log = logLines;
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  log(`DONE probe Q5: allPass=${results.allPass} -> ${OUT_FILE}`);
  cleanup();
  process.exit(results.allPass ? 0 : 1);
} catch (e) {
  console.error("PROBE FATAL:", e.message);
  results.fatal = e.message;
  results.log = logLines;
  try { fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true }); fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2)); } catch {}
  cleanup();
  process.exit(2);
} finally {
  cleanup();
}
