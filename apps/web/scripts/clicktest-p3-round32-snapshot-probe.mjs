#!/usr/bin/env node
/**
 * clicktest-p3-round32-snapshot-probe.mjs — Phase 9 đợt 32, luồng P3
 * (parent stage dưới tên đợt 33).
 *
 * Chứng minh động bằng treo GIẢ LẬP cho 2 wiring MỚI của P3 (không phải
 * của O2 — O2 đã chứng minh phần của O2 bằng probe riêng):
 *  (a) probe-round32-o5-webcodecs-pipe.mjs (pipe): trích đúng class
 *      PipeCdp từ file đã nối, chạy trên Chrome thật, timeout 1ms có
 *      chủ đích (send() của O5 nhận timeoutMs nên không cần vá).
 *  (b) seek-o3-browser-probe.mjs (WebSocket): trích đúng class Cdp từ
 *      file đã nối; send() của O3 cố định timeout 60000ms nên BẢN TRÍCH
 *      (không phải file gốc) được rút hằng đó thành 1ms để ép timeout
 *      — chỉ đổi hằng thời gian, logic handler giữ nguyên; probe fail
 *      ngay nếu trong bản trích có != 1 lần xuất hiện "60000".
 *  (c) Default của module cdp-snapshot.mjs khi không truyền outDir:
 *      ghi vào .../vcut-cdp-hang-snapshots/_unspecified/ (đã chứng minh
 *      ở O2, chạy lại ở đây; file probe dọn sau kiểm chứng).
 *
 * Đây vẫn là treo GIẢ LẬP — lần treo THẬT có snapshot vẫn là nợ mở.
 * Display :97 (pipe target, Xvfb), cổng WS 19322 (headless target).
 * Kết quả JSON: benchmarks/results/v32-p3-snapshot-probe.json
 * (parent quyết stage). KHÔNG sửa code sản phẩm, KHÔNG push,
 * KHÔNG tag/release, KHÔNG binary.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SCRIPTS_DIR = path.join(ROOT, "apps", "web", "scripts");
const OUT_FILE = path.join(ROOT, "benchmarks", "results", "v32-p3-snapshot-probe.json");
const DURABLE_ROOT = path.join(os.homedir(), "workspace", "vcut-cdp-hang-snapshots");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.P3_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.P3_DISPLAY || ":97";
const WS_PORT = Number(process.env.P3_WS_PORT || 19322);
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
function cleanDir(dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }
function listFiles(dir) { try { return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort(); } catch { return []; } }

const results = { runAt: new Date().toISOString(), label: "v32-p3", targets: [] };
let xvfb = null;
let chromePipe = null;
let chromeWs = null;
// Bài học lần chạy 1 của P3: process.exit() trong catch bỏ qua finally
// nên Xvfb :97 cũ sót lại (đã kill tay sau đó). cleanup() phải được gọi
// tường minh trước mọi process.exit, finally chỉ là lưới thứ hai.
function cleanup() {
  try { chromePipe?.kill("SIGKILL"); } catch {}
  try { chromeWs?.kill("SIGKILL"); } catch {}
  try { xvfb?.kill("SIGKILL"); } catch {}
  chromePipe = null; chromeWs = null; xvfb = null;
}
try {
  // ---- Target A: O5 pipe, timeout 1ms thật qua tham số ----
  {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "probe-round32-o5-webcodecs-pipe.mjs"), "utf8");
    const cls = extractClass(src, "PipeCdp");
    if (!cls.includes("captureCdpHangSnapshot")) throw new Error("bản trích PipeCdp O5 không chứa lệnh snapshot");
    if (!src.includes("vcut-cdp-hang-snapshots\", \"probe-round32-o5-webcodecs-pipe")) throw new Error("O5 chưa trỏ outDir bền");
    const outDir = path.join(DURABLE_ROOT, "probe-round32-o5-webcodecs-pipe");
    cleanDir(outDir);
    // Mẫu J6/N5: chờ Xvfb sẵn sàng rồi spawn Chrome đúng arg/stdin
    // của J6 (profile tươi mkdtemp, stdio đủ 5 pipe). Lần chạy probe
    // đầu của P3 chỉ sleep 1500ms sau Xvfb nên Chrome lên trước khi
    // X sẵn sàng và pipe không bao giờ trả lời — đó là lỗi probe,
    // không phải lỗi wiring (Chrome vẫn sống, snapshot vẫn ghi).
    xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    const sock = `/tmp/.X11-unix/X${DISPLAY.replace(":", "")}`;
    for (let i = 0; i < 40 && !fs.existsSync(sock); i++) await sleep(250);
    await sleep(2000);
    log(`Xvfb socket ${DISPLAY}: ${fs.existsSync(sock)}`);
    const chromeBin = pickChrome();
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "p3-o5-profile-"));
    chromePipe = spawn(chromeBin, ["--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required", "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank"],
      { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chromePipe.stderr?.on("data", () => {});
    await sleep(2000);
    // Class trích ra tham chiếu tới log / captureCdpHangSnapshot /
    // CDP_HANG_OUT_DIR / DISPLAY / PORT / HANG_BUNDLE ở scope module gốc
    // nên phải truyền tường minh vào Function — không vá logic class.
    const PipeCdp = new Function("captureCdpHangSnapshot", "CDP_HANG_OUT_DIR", "DISPLAY", "PORT", "HANG_BUNDLE", "log", `${cls}; return PipeCdp;`)(captureCdpHangSnapshot, outDir, DISPLAY, 4196, null, log);
    const cdp = new PipeCdp(chromePipe);
    // Warm-up chứng minh pipe sống TRƯỚC khi ép timeout 1ms, để fail
    // sau đó (nếu có) quy được cho wiring chứ không phải hạ tầng.
    const warm = await cdp.send("Target.getTargets", {}, undefined, 30000).catch(() => null);
    if (!warm || !Array.isArray(warm.targetInfos)) throw new Error("INFRA pipe O5 không trả lời warm-up (không phải lỗi wiring)");
    log(`pipe O5 warm-up OK, nTargets=${warm.targetInfos.length}`);
    // Ép timeout ĐƠN ĐỊNH (không đua 1ms với pipe đã ấm): tạm pause
    // stream đọc fd4 trước khi gửi — response của Chrome kẹt trong
    // buffer, handler timeout 1ms kích hoạt đúng đường production.
    // Pause là thao tác của probe lên transport, KHÔNG sửa logic class.
    // (Lần chạy trước: chỉ dùng timeout 1ms trên pipe đã warm-up thì
    // response về <1ms nên không timeout — lỗi thiết kế probe, không
    // phải lỗi wiring.)
    chromePipe.stdio[4].pause();
    let rejectMsg = null;
    try { await cdp.send("Target.getTargets", {}, undefined, 1); } catch (e) { rejectMsg = e.message; }
    chromePipe.stdio[4].resume();
    await sleep(500);
    const files = listFiles(outDir);
    let snap = null;
    if (files.length === 1) { try { snap = JSON.parse(fs.readFileSync(path.join(outDir, files[0]), "utf8")); } catch {} }
    let aliveAfter = false;
    try { const r = await cdp.send("Target.getTargets", {}, undefined, 30000); aliveAfter = Array.isArray(r?.targetInfos); } catch {}
    const checks = {
      rejectGoc: rejectMsg === "CDP timeout Target.getTargets",
      dung1File: files.length === 1,
      pidKhop: snap?.proc?.pid === chromePipe.pid,
      psCoChrome: psHasChrome(),
      pipeSongSauTimeout: aliveAfter,
      outDirBen: outDir.startsWith(DURABLE_ROOT) && !outDir.includes("/tmp/"),
    };
    checks.all = Object.values(checks).every(Boolean);
    log(`target O5-pipe: reject=${JSON.stringify(rejectMsg)} files=${files.length} pidKhop=${checks.pidKhop} aliveAfter=${aliveAfter} all=${checks.all}`);
    results.targets.push({ id: "o5-pipe", checks, rejectMsg, snapshotFile: files[0] || null, pid: chromePipe.pid });
    try { chromePipe.kill("SIGKILL"); } catch {}
    chromePipe = null;
  }
  // ---- Target B: O3 WS, bản trích rút 60000 -> 1ms ----
  {
    const src = fs.readFileSync(path.join(SCRIPTS_DIR, "seek-o3-browser-probe.mjs"), "utf8");
    let cls = extractClass(src, "Cdp");
    if (!cls.includes("captureCdpHangSnapshot")) throw new Error("bản trích Cdp O3 không chứa lệnh snapshot");
    // Bản trích O3 có đúng 2 lần "60000": timeoutMs: 60000 trong lệnh
    // snapshot (giữ nguyên — đó là timeout thật được ghi vào snapshot)
    // và delay setTimeout (đây mới là chỗ rút thành 1ms để ép timeout).
    // Chỉ thay đúng mẫu delay, fail nếu không thay đúng 1 chỗ.
    const delayPattern = "} }, 60000); }); }";
    const delayCount = cls.split(delayPattern).length - 1;
    if (delayCount !== 1) throw new Error(`bản trích Cdp O3 có ${delayCount} mẫu delay setTimeout 60000, kỳ vọng đúng 1`);
    cls = cls.replace(delayPattern, "} }, 1); }); }");
    if (!src.includes("vcut-cdp-hang-snapshots\", \"seek-o3-browser-probe")) throw new Error("O3 chưa trỏ outDir bền");
    const outDir = path.join(DURABLE_ROOT, "seek-o3-browser-probe");
    cleanDir(outDir);
    const chromeBin = pickChrome();
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "p3-o3-profile-"));
    chromeWs = spawn(chromeBin, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${WS_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
    let targets = null;
    for (let i = 0; i < 60 && !targets; i++) {
      await sleep(500);
      try { const r = await fetch(`http://127.0.0.1:${WS_PORT}/json/list`); const j = await r.json(); if (j.length) targets = j; } catch {}
    }
    if (!targets) throw new Error("không lấy được /json/list cho target O3");
    const page = targets.find((t) => t.type === "page") || targets[0];
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error("ws timeout")), 15000); });
    // Như target O5: truyền tường minh các binding module gốc mà class
    // trích ra tham chiếu (log / capture / outDir / PORT / CDP_PORT).
    const Cdp = new Function("captureCdpHangSnapshot", "CDP_HANG_OUT_DIR", "PORT", "CDP_PORT", "log", `${cls}; return Cdp;`)(captureCdpHangSnapshot, outDir, 4321, WS_PORT, log);
    const cdp = new Cdp(ws);
    cdp.proc = chromeWs;
    let rejectMsg = null;
    try { await cdp.send("Target.getTargets", {}); } catch (e) { rejectMsg = e.message; }
    await sleep(500);
    const files = listFiles(outDir);
    let snap = null;
    if (files.length === 1) { try { snap = JSON.parse(fs.readFileSync(path.join(outDir, files[0]), "utf8")); } catch {} }
    let aliveAfter = false;
    try { const r = await cdp.send("Target.getTargets", {}); aliveAfter = Array.isArray(r?.targetInfos); } catch {}
    // Lưu ý: sau khi rút timeout, send() lần 2 vẫn dùng timeout 1ms nên
    // có thể timeout tiếp thay vì resolve — aliveAfter ở đây chỉ là
    // thông tin thêm, KHÔNG tính vào all (tránh fail giả do chính phép rút).
    const checks = {
      rejectGoc: rejectMsg === "cdp timeout Target.getTargets",
      dung1File: files.length === 1,
      pidKhop: snap?.proc?.pid === chromeWs.pid,
      psCoChrome: psHasChrome(),
      outDirBen: outDir.startsWith(DURABLE_ROOT) && !outDir.includes("/tmp/"),
      extraTransportWs: snap?.extra?.transport === "websocket",
    };
    checks.all = Object.values(checks).every(Boolean);
    log(`target O3-ws: reject=${JSON.stringify(rejectMsg)} files=${files.length} pidKhop=${checks.pidKhop} transport=${snap?.extra?.transport} aliveAfter2nd(1ms, tham khao)=${aliveAfter} all=${checks.all}`);
    results.targets.push({ id: "o3-ws", checks, rejectMsg, snapshotFile: files[0] || null, pid: chromeWs.pid, note: "send() lần 2 vẫn timeout 1ms do bản trích rút hằng — aliveAfter chỉ tham khảo, không tính pass/fail" });
    try { ws.close(); } catch {}
    try { chromeWs.kill("SIGKILL"); } catch {}
    chromeWs = null;
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  // ---- Target C: module default (không outDir) ----
  {
    const outDir = path.join(DURABLE_ROOT, "_unspecified");
    const before = listFiles(outDir);
    const r = captureCdpHangSnapshot({ proc: null, pendingCount: 0, method: "Target.getTargets", timeoutMs: 1 });
    const after = listFiles(outDir);
    const fresh = after.filter((f) => !before.includes(f));
    const ok = !!r.file && fresh.length === 1 && r.file.endsWith(fresh[0]);
    log(`target module-default: file=${r.file} fresh=${fresh.length} ok=${ok}`);
    results.targets.push({ id: "module-default", checks: { ghiDuoc: ok }, file: r.file });
    // Dọn file probe để _unspecified trở lại trạng thái trước probe (mẫu O2).
    for (const f of fresh) { try { fs.unlinkSync(path.join(outDir, f)); } catch {} }
  }
  results.allPass = results.targets.every((t) => t.checks.all ?? t.checks.ghiDuoc);
  results.log = logLines;
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileEpermRetry(OUT_FILE, JSON.stringify(results, null, 2));
  log(`DONE probe P3: allPass=${results.allPass} -> ${OUT_FILE}`);
  cleanup();
  process.exit(results.allPass ? 0 : 1);
} catch (e) {
  console.error("PROBE FATAL:", e.message);
  results.fatal = e.message;
  results.log = logLines;
  try { fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true }); writeFileEpermRetry(OUT_FILE, JSON.stringify(results, null, 2)); } catch {}
  cleanup();
  process.exit(2);
} finally {
  cleanup();
}
