#!/usr/bin/env node
/**
 * clicktest-n5-round31-snapshot-probe.mjs — Phase 9 đợt 31, luồng N5:
 * chứng minh kỷ luật snapshot treo CDP đã nối vào các harness pipe còn
 * lại (đợt 30 M5 chỉ nối script CDP-DIAG) bằng treo GIẢ LẬP CÓ CHỦ ĐÍCH.
 *
 * Khác với probe M5 (dùng class PipeCdp viết riêng trong probe): probe
 * này TRÍCH ĐÚNG class PipeCdp từ file harness đã nối (đọc file thật,
 * cắt đúng khối `class PipeCdp { ... }` bằng quét brace có xử lý chuỗi
 * và template literal), rồi chạy class đó trên pipe Chrome thật với
 * timeout 1ms có chủ đích. Như vậy code được kiểm chứng là code đã nối
 * trong harness, không phải bản sao trong probe.
 *
 * Mỗi target kiểm tra:
 *   (a) send() timeout 1ms reject đúng lỗi timeout gốc của chính file đó
 *       (chuỗi lỗi gốc không bị snapshot che — snapshot gọi trong
 *       try/catch riêng, reject vẫn chạy sau đó);
 *   (b) đúng 1 file snapshot trong outDir của target, đủ trường:
 *       method, timeoutMs=1, proc.pid khớp Chrome thật, ps chứa chrome;
 *   (c) pipe vẫn dùng được sau timeout (lệnh thường resolve);
 *   (d) target dip: HANG_BUNDLE giả lập được ghi đúng vào snapshot
 *       (chứng minh đường bundle từ main() qua timeout handler).
 * Đây vẫn là treo GIẢ LẬP, không phải treo thật — lần treo thật có
 * snapshot vẫn là nợ mở (xem LIMITS đợt 31 N5).
 *
 * KHÔNG sửa code sản phẩm, KHÔNG push, KHÔNG tag/release, KHÔNG binary.
 * Cổng không dùng (pipe), display :92. Kết quả JSON:
 * benchmarks/results/v31-n5-snapshot-probe.json (parent quyết stage).
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { captureCdpHangSnapshot } from "./cdp-snapshot.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const SCRIPTS_DIR = path.join(ROOT, "apps", "web", "scripts");
const SCRATCH = path.join(os.homedir(), "workspace", "tmp-round31-n5-probe");
const SNAP_DIR = path.join(SCRATCH, "cdp-hang-snapshots");
const OUT_FILE = path.join(ROOT, "benchmarks", "results", "v31-n5-snapshot-probe.json");
const PW_CHROME = path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome");
const META_CHROME = "/opt/meta-chromium/chrome";
const BINARIES = (process.env.N5_CHROME_BINS || `${PW_CHROME},${META_CHROME}`).split(",").map((s) => s.trim()).filter(Boolean);
const DISPLAY = process.env.N5_DISPLAY || ":92";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
const logLines = [];
function log(...a) { const l = `[${stamp()}] ${a.join(" ")}`; logLines.push(l); console.log(l); }

// Quét khối class: đếm brace ở tầng code, bỏ qua nội dung chuỗi '...',
// "..." (có escape), và trong template `...` thì ${...} được tính như
// code (brace mở/đóng trong ${} tự triệt tiêu khi quét thô).
function extractPipeCdpClass(src) {
  const start = src.indexOf("class PipeCdp");
  if (start < 0) throw new Error("không tìm thấy class PipeCdp");
  const open = src.indexOf("{", start);
  if (open < 0) throw new Error("không tìm thấy { mở của class PipeCdp");
  let depth = 0;
  let i = open;
  let mode = null; // null | "'" | '"' | "`"
  while (i < src.length) {
    const ch = src[i];
    if (mode === "'") {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "'") mode = null;
      i++; continue;
    }
    if (mode === '"') {
      if (ch === "\\") { i += 2; continue; }
      if (ch === '"') mode = null;
      i++; continue;
    }
    if (mode === "`") {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "`") { mode = null; i++; continue; }
      // Trong template literal: { } của ${expr} vẫn đếm bình thường,
      // ký tự khác bỏ qua (nội dung text có thể chứa brace lẻ).
      if (ch === "{") depth++;
      if (ch === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
      i++; continue;
    }
    // mode code
    if (ch === "'") { mode = "'"; i++; continue; }
    if (ch === '"') { mode = '"'; i++; continue; }
    if (ch === "`") { mode = "`"; i++; continue; }
    if (ch === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (ch === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    if (ch === "{") depth++;
    if (ch === "}") { depth--; if (depth === 0) return src.slice(start, i + 1); }
    i++;
  }
  throw new Error("không tìm thấy } đóng của class PipeCdp");
}

function startXvfb() {
  return new Promise((resolve, reject) => {
    const num = DISPLAY.replace(":", "");
    const sock = `/tmp/.X11-unix/X${num}`;
    if (fs.existsSync(sock)) {
      try { if (spawnSync("pgrep", ["-f", `Xvfb ${DISPLAY}`]).status === 0) { log(`Xvfb: dùng chung display ${DISPLAY}`); resolve(null); return; } } catch { /* kệ */ }
      try { fs.unlinkSync(sock); } catch { /* kệ */ }
    }
    const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24", "-nolisten", "tcp"], { stdio: "ignore" });
    (async () => {
      for (let i = 0; i < 40; i++) { if (fs.existsSync(sock)) { log(`Xvfb lên: DISPLAY=${DISPLAY}`); resolve(xvfb); return; } await sleep(250); }
      reject(new Error(`Xvfb không tạo socket ${sock}`));
    })();
  });
}

async function startChrome(PipeCdp) {
  for (const bin of BINARIES) {
    if (!fs.existsSync(bin)) { log(`BLOCKER-PIPE ${bin}: không thấy binary`); continue; }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "n5-probe-"));
    const chrome = spawn(bin, ["--no-sandbox", "--disable-dev-shm-usage", "--no-first-run", "--hide-scrollbars",
      "--autoplay-policy=no-user-gesture-required", "--remote-debugging-pipe", `--user-data-dir=${profile}`,
      "--window-size=1920,1200", "about:blank"], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"], env: { ...process.env, DISPLAY } });
    chrome.stderr.on("data", () => {});
    try {
      const cdp = new PipeCdp(chrome);
      await cdp.send("Target.getTargets", {}, undefined, 30000);
      log(`pipe OK (${bin}) pid=${chrome.pid}`);
      return { cdp, chrome, profile };
    } catch (e) {
      log(`BLOCKER-PIPE ${bin}: ${e.message}`);
      try { chrome.kill("SIGKILL"); } catch {}
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }
  }
  return null;
}

// Target: [file harness, nhãn, bundle giả lập (null = HANG_BUNDLE null)]
const TARGETS = [
  ["clicktest-split-intermediate-pipe.mjs", "J6", null],
  ["clicktest-l5-round29-spinnerprobe.mjs", "spinnerprobe", null],
  ["clicktest-dip-browser-pipe.mjs", "dip", { bundle: "index-N5FAKE.js", sha: "0123456789abcdef" }],
  ["clicktest-deep-leaf-ramp-pipe.mjs", "I6", null],
];

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const results = [];
  let xvfb = null;
  let exitCode = 0;
  try {
    xvfb = await startXvfb();
    for (const [file, label, fakeBundle] of TARGETS) {
      const r = { file, label, checks: {} };
      results.push(r);
      try {
        const src = fs.readFileSync(path.join(SCRIPTS_DIR, file), "utf8");
        r.checks.hasSnapshotImport = src.includes('from "./cdp-snapshot.mjs"');
        r.checks.hasSnapshotCallInSend = /send\(method[\s\S]{0,1200}?captureCdpHangSnapshot/.test(src);
        r.checks.hasBundleAssign = src.includes("HANG_BUNDLE = snap;");
        const classSrc = extractPipeCdpClass(src);
        r.checks.classExtracted = classSrc.includes("captureCdpHangSnapshot");
        const PipeCdp = new Function("log", "captureCdpHangSnapshot", "path", "SCRATCH", "HANG_BUNDLE", "DISPLAY", "PORT",
          `${classSrc}\nreturn PipeCdp;`)(log, captureCdpHangSnapshot, path, SCRATCH, fakeBundle, DISPLAY, 4192);
        fs.rmSync(SNAP_DIR, { recursive: true, force: true });
        const holder = await startChrome(PipeCdp);
        if (!holder) { r.checks.pipeOk = false; r.error = "không mở được pipe Chrome"; exitCode = 2; continue; }
        r.checks.pipeOk = true;
        r.chromePid = holder.chrome.pid;
        let timeoutErr = null;
        try { await holder.cdp.send("Target.getTargets", {}, undefined, 1); }
        catch (e) { timeoutErr = e.message; }
        r.timeoutErr = timeoutErr;
        // Lỗi gốc của file: dạng "CDP timeout Target.getTargets sau 1ms"
        // hoặc "CDP timeout Target.getTargets" (file cũ không có "sau").
        r.checks.rejectIsOriginalTimeoutError = typeof timeoutErr === "string"
          && timeoutErr.startsWith("CDP timeout Target.getTargets")
          && (timeoutErr.includes("sau 1ms") || !src.includes("sau ${timeoutMs}ms"));
        await sleep(500);
        const files = fs.existsSync(SNAP_DIR) ? fs.readdirSync(SNAP_DIR).filter((f) => f.endsWith(".json")) : [];
        r.checks.snapshotFileCount = files.length;
        let snap = null;
        if (files.length === 1) snap = JSON.parse(fs.readFileSync(path.join(SNAP_DIR, files[0]), "utf8"));
        r.checks.snapshotMethod = snap?.method ?? null;
        r.checks.snapshotTimeoutMs = snap?.timeoutMs ?? null;
        r.checks.snapshotPidMatchesChrome = snap?.proc?.pid === holder.chrome.pid;
        r.checks.snapshotChromeAlive = snap?.proc?.exitCode === null && snap?.proc?.signalCode === null && snap?.proc?.killed === false;
        r.checks.snapshotPsHasChrome = typeof snap?.ps === "string" && snap.ps.includes("chrome");
        if (fakeBundle) {
          r.checks.snapshotBundleName = snap?.bundle?.name ?? null;
          r.checks.snapshotBundleSha = snap?.bundle?.sha256_16 ?? null;
          r.checks.snapshotBundleMatches = snap?.bundle?.name === fakeBundle.bundle && snap?.bundle?.sha256_16 === fakeBundle.sha;
        } else {
          r.checks.snapshotBundleNull = snap?.bundle === null;
        }
        try {
          const after = await holder.cdp.send("Target.getTargets", {}, undefined, 30000);
          r.checks.pipeAliveAfterTimeout = Array.isArray(after?.targetInfos) || after !== undefined;
        } catch (e) { r.checks.pipeAliveAfterTimeout = false; r.checks.pipeAliveError = e.message; }
        try { holder.chrome.kill("SIGKILL"); } catch {}
        try { fs.rmSync(holder.profile, { recursive: true, force: true }); } catch {}
        const mustPass = ["hasSnapshotImport", "hasSnapshotCallInSend", "hasBundleAssign", "classExtracted",
          "pipeOk", "rejectIsOriginalTimeoutError", "snapshotPidMatchesChrome", "snapshotChromeAlive",
          "snapshotPsHasChrome", "pipeAliveAfterTimeout"];
        if (fakeBundle) mustPass.push("snapshotBundleMatches");
        r.pass = mustPass.every((k) => r.checks[k] === true) && r.checks.snapshotFileCount === 1
          && r.checks.snapshotMethod === "Target.getTargets" && r.checks.snapshotTimeoutMs === 1;
        if (!r.pass) exitCode = 1;
        log(`${label}: pass=${r.pass} timeoutErr=${JSON.stringify(timeoutErr)} snapshotFiles=${files.length}`);
      } catch (e) {
        r.error = e.message;
        r.pass = false;
        exitCode = 1;
        log(`${label}: LỖI probe: ${e.message}`);
      }
    }
  } catch (e) {
    log(`BLOCKER: ${e.message}`);
    exitCode = 2;
  } finally {
    try { xvfb?.kill("SIGKILL"); } catch {}
  }
  const out = { at: new Date().toISOString(), display: DISPLAY, results };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileEpermRetry(OUT_FILE, JSON.stringify(out, null, 2));
  log(`kết quả: ${OUT_FILE} exit=${exitCode}`);
  process.exit(exitCode);
}

main();
