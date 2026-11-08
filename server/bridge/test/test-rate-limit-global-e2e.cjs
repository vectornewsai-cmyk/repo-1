// Test e2e đợt 65 S5: global cap + persist qua restart + env đổi số có hiệu lực.
// Chạy bằng (từ gốc repo): node server/bridge/test/test-rate-limit-global-e2e.cjs
// Spawn bridge thật (không cần ffmpeg chạy render — chỉ dùng /api/health).
// Lưu ý: chờ bridge lên bằng TCP connect, KHÔNG dùng /api/health để chờ,
// vì mỗi lần poll health cũng tốn 1 slot budget (general + global).
// Bridge A: GLOBAL=5, GENERAL=1000 → 5 health qua, health thứ 6 → 429 do
// global cap (per-IP còn ~995 slot — chứng minh không phải per-IP chặn).
// Dừng A bằng SIGTERM (shutdown graceful → flush persist), spawn lại bridge B
// cùng file persist → health đầu tiên vẫn 429 (trạng thái còn sau restart);
// đợi hết cửa sổ → health qua lại 200. Bridge C: GLOBAL=3, file persist mới
// → 3×200 rồi 429 (env đổi số có hiệu lực).
// Toàn bộ persist dùng file trong tmpdir riêng — KHÔNG đụng file persist thật
// ~/.cache/vcut/rate-limit.json.
"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..", "..");
const WINDOW_MS = 12000;

let pass = 0;
let fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ""}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tmpWork() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vcut-r65s5-e2e-"));
}
function freePort(base) {
  return base + Math.floor(Math.random() * 200);
}

function startBridge(port, workDir, extraEnv) {
  const logPath = path.join(workDir, "bridge.log");
  const logFd = fs.openSync(logPath, "w");
  const child = spawn("node", [path.join(REPO, "server", "bridge", "src", "index.js")], {
    cwd: REPO,
    env: {
      ...process.env,
      BRIDGE_PORT: String(port),
      BRIDGE_WORK_DIR: workDir,
      ...extraEnv,
    },
    stdio: ["ignore", logFd, logFd],
  });
  return { child, logPath };
}

async function waitTcp(port, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const okConn = await new Promise((resolve) => {
      const s = net.connect(port, "127.0.0.1");
      s.once("connect", () => { s.end(); resolve(true); });
      s.once("error", () => resolve(false));
    });
    if (okConn) return true;
    await sleep(250);
  }
  return false;
}

async function stopBridge(b) {
  try { b.child.kill("SIGTERM"); } catch { /* đã chết */ }
  for (let i = 0; i < 40; i++) {
    if (b.child.exitCode !== null) return true;
    await sleep(100);
  }
  try { b.child.kill("SIGKILL"); } catch { /* đã chết */ }
  return false;
}

async function health(port) {
  const res = await fetch(`http://127.0.0.1:${port}/api/health`);
  const body = await res.json().catch(() => ({}));
  return {
    status: res.status,
    body,
    limit: res.headers.get("x-ratelimit-limit"),
    remaining: res.headers.get("x-ratelimit-remaining"),
    globalRemaining: res.headers.get("x-ratelimit-global-remaining"),
    retryAfter: res.headers.get("retry-after"),
  };
}

async function main() {
  const work = tmpWork();
  const persistA = path.join(work, "persist-a", "rate-limit.json");
  const persistC = path.join(work, "persist-c", "rate-limit.json");
  const bridges = [];
  try {
    // --- Bridge A: global cap 5, per-IP 1000 (để per-IP không bao giờ chặn) ---
    console.log("== [1] bridge A: global cap chặn dù per-IP còn budget ==");
    const portA = freePort(19587);
    const workA = path.join(work, "work-a");
    fs.mkdirSync(workA, { recursive: true });
    const bridgeA = startBridge(portA, workA, {
      BRIDGE_RATE_GENERAL: "1000",
      BRIDGE_RATE_RENDER: "1000",
      BRIDGE_RATE_GLOBAL: "5",
      BRIDGE_RATE_WINDOW_MS: String(WINDOW_MS),
      BRIDGE_RATE_PERSIST_PATH: persistA,
      BRIDGE_RATE_PERSIST_MS: "500",
    });
    bridges.push(bridgeA);
    ok(await waitTcp(portA), `bridge A lên (TCP :${portA})`, portA);
    for (let i = 1; i <= 5; i++) {
      const r = await health(portA);
      ok(r.status === 200, `A: health #${i}/5 → 200 (global còn slot)`, r.status);
      ok(r.globalRemaining === String(5 - i), `A: health #${i}: Global-Remaining=${5 - i}`, r.globalRemaining);
      ok(r.remaining === String(1000 - i), `A: health #${i}: per-IP Remaining=${1000 - i} (per-IP KHÔNG phải nguyên nhân chặn)`, r.remaining);
    }
    const sixth = await health(portA);
    ok(sixth.status === 429, "A: health #6 → 429 (global cap đầy 5/5)", sixth.status);
    ok(sixth.body.errorCode === "RATE_LIMITED", "A: 429 có errorCode RATE_LIMITED", sixth.body.errorCode);
    ok(sixth.body.error === `Quá nhiều request — thử lại sau ${sixth.retryAfter}s.`,
      "A: message 429 giữ nguyên mẫu cũ", sixth.body.error);
    ok(sixth.globalRemaining === "0", "A: 429 Global-Remaining=0", sixth.globalRemaining);
    ok(sixth.remaining === "0", "A: 429 Remaining=0", sixth.remaining);
    ok(Number(sixth.retryAfter) >= 1 && Number(sixth.retryAfter) <= 12,
      `A: Retry-After trong khoảng 1..12s (${sixth.retryAfter})`, sixth.retryAfter);

    // --- Dừng A graceful → flush persist; kiểm tra file trên đĩa ---
    console.log("== [2] dừng A (SIGTERM) → file persist ghi đủ 5 mốc global ==");
    ok(await stopBridge(bridgeA), "A dừng graceful sau SIGTERM (exit, không cần SIGKILL)");
    ok(fs.existsSync(persistA), "file persist A tồn tại sau khi dừng", persistA);
    const saved = JSON.parse(fs.readFileSync(persistA, "utf8"));
    ok(saved.version === 1, "file persist A: version=1", saved.version);
    ok(Array.isArray(saved.global) && saved.global.length === 5,
      "file persist A: global giữ đúng 5 mốc", saved.global && saved.global.length);
    // Key bucket là `general:::ffff:127.0.0.1` (Node map IPv4-loopback sang
    // IPv6-mapped — quirk đã biết từ đợt 64 R7 §6.2, không phải bug mới).
    const bucketKeys = saved.buckets ? Object.keys(saved.buckets) : [];
    ok(bucketKeys.length === 1 && bucketKeys[0].startsWith("general:") &&
      saved.buckets[bucketKeys[0]].length === 5,
      `file persist A: 1 bucket general (${bucketKeys[0]}) giữ 5 mốc`, bucketKeys);

    // --- Bridge B: cùng file persist → trạng thái còn sau restart ---
    console.log("== [3] bridge B (restart, cùng file persist): budget KHÔNG reset ==");
    const portB = freePort(19787);
    const workB = path.join(work, "work-b");
    fs.mkdirSync(workB, { recursive: true });
    const bridgeB = startBridge(portB, workB, {
      BRIDGE_RATE_GENERAL: "1000",
      BRIDGE_RATE_RENDER: "1000",
      BRIDGE_RATE_GLOBAL: "5",
      BRIDGE_RATE_WINDOW_MS: String(WINDOW_MS),
      BRIDGE_RATE_PERSIST_PATH: persistA,
      BRIDGE_RATE_PERSIST_MS: "500",
    });
    bridges.push(bridgeB);
    ok(await waitTcp(portB), `bridge B lên (TCP :${portB})`, portB);
    const afterRestart = await health(portB);
    ok(afterRestart.status === 429, "B sau restart: health đầu tiên → 429 (5 mốc đã persist, chưa hết cửa sổ)", afterRestart.status);
    ok(afterRestart.globalRemaining === "0", "B sau restart: Global-Remaining=0", afterRestart.globalRemaining);
    // Đợi mốc MỚI NHẤT hết hạn (cửa sổ 12s tính từ mốc cuối của A + biên 1s).
    // Tính từ mốc cuối trong file persist (không tính từ t0) để không flake
    // khi máy tải nặng làm 5 health của A kéo dài > 1s.
    const lastMark = Math.max(...saved.global);
    const waitMs = Math.max(0, (lastMark + WINDOW_MS + 1000) - Date.now());
    console.log(`   ... đợi ${Math.round(waitMs / 1000)}s cho mốc cũ hết hạn`);
    await sleep(waitMs);
    const afterExpiry = await health(portB);
    ok(afterExpiry.status === 200, "B sau khi mốc cũ hết hạn: health → 200 lại", afterExpiry.status);
    ok(afterExpiry.globalRemaining === "4", "B sau khi hết hạn: Global-Remaining=4 (1 mốc mới)", afterExpiry.globalRemaining);
    ok(await stopBridge(bridgeB), "B dừng graceful sau SIGTERM");

    // --- Bridge C: env đổi số có hiệu lực (GLOBAL=3, file persist mới) ---
    console.log("== [4] bridge C: BRIDGE_RATE_GLOBAL=3 có hiệu lực ==");
    const portC = freePort(19987);
    const workC = path.join(work, "work-c");
    fs.mkdirSync(workC, { recursive: true });
    const bridgeC = startBridge(portC, workC, {
      BRIDGE_RATE_GENERAL: "1000",
      BRIDGE_RATE_RENDER: "1000",
      BRIDGE_RATE_GLOBAL: "3",
      BRIDGE_RATE_WINDOW_MS: String(WINDOW_MS),
      BRIDGE_RATE_PERSIST_PATH: persistC,
      BRIDGE_RATE_PERSIST_MS: "500",
    });
    bridges.push(bridgeC);
    ok(await waitTcp(portC), `bridge C lên (TCP :${portC})`, portC);
    for (let i = 1; i <= 3; i++) {
      const r = await health(portC);
      ok(r.status === 200, `C: health #${i}/3 → 200`, r.status);
    }
    const fourth = await health(portC);
    ok(fourth.status === 429, "C: health #4 → 429 (GLOBAL=3 mới có hiệu lực, không phải 5 cũ)", fourth.status);
    ok(fourth.globalRemaining === "0", "C: 429 Global-Remaining=0", fourth.globalRemaining);
    ok(await stopBridge(bridgeC), "C dừng graceful sau SIGTERM");
  } finally {
    for (const b of bridges) {
      try {
        if (b.child.exitCode === null) {
          b.child.kill("SIGKILL");
        }
      } catch { /* đã chết */ }
    }
    try { fs.rmSync(work, { recursive: true, force: true }); } catch { /* dọn tmp best-effort */ }
  }
}

main().then(() => {
  console.log(`\nS5 rate limiter global+persist (e2e, bridge thật): ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exitCode = 1;
}).catch((err) => {
  console.error("E2E CRASH:", err);
  process.exitCode = 1;
});
