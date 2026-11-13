#!/usr/bin/env node
/**
 * test-xvfb-display-lock.mjs — Phase 9 đợt 95, luồng W8 (harness).
 * Kiểm chứng xvfb-display.mjs (lock display Xvfb, nợ đợt 94 §4 mục 8):
 *  A. Thu hồi lock mồ côi (pid đã chết, không còn Xvfb) → claim được.
 *  B. 3 tiến trình con claim song song trên dải :193–:197, mỗi con spawn
 *     Xvfb thật + giữ 3s → 3 display KHÁC NHAU, không con nào fail Xvfb
 *     vì race (đúng lỗi V7 gặp ở :194).
 *  C. Display đang bị giữ → claim cùng display trả null; sau khi nhả →
 *     claim lại được.
 * Chạy: node apps/web/scripts/test-xvfb-display-lock.mjs
 * (chỉ dùng display :193–:197 + :211/:214; không giết process của ai —
 * mỗi tiến trình con chỉ kill Xvfb do chính nó spawn, theo PID).
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  claimXvfbDisplay,
  releaseXvfbDisplay,
  xvfbAlive,
  XVFB_LOCK_ROOT,
} from "./xvfb-display.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MODULE_URL = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "xvfb-display.mjs",
);
const OUT_DIR = path.join(
  os.homedir(),
  "workspace",
  "goals",
  "capcut-clone-video-editor",
  "hidden_files",
  "round95-w8",
);
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = { date: new Date().toISOString(), phases: {} };
let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

// ---- Phase A: thu hồi lock mồ côi ----
{
  const lockDir = `${XVFB_LOCK_ROOT}/X211.lock`;
  fs.mkdirSync(XVFB_LOCK_ROOT, { recursive: true });
  try {
    fs.rmSync(lockDir, { recursive: true, force: true });
  } catch {}
  fs.mkdirSync(lockDir);
  fs.writeFileSync(`${lockDir}/pid`, "999999"); // pid không tồn tại
  const got = claimXvfbDisplay([":211"]);
  check(
    "A. lock mồ côi (pid chết, không Xvfb) được thu hồi",
    !!got && got.display === ":211",
    got ? `claim được ${got.display}` : "claim thất bại",
  );
  if (got) releaseXvfbDisplay(got);
  check("A. lock đã nhả sạch sau test", !fs.existsSync(lockDir));
  results.phases.A = { staleRecovered: !!got };
}

// ---- Phase B: 3 tiến trình con claim + spawn Xvfb thật song song ----
const CHILD_CODE = `
import { spawn } from "node:child_process";
import fs from "node:fs";
import { claimXvfbDisplay, releaseXvfbDisplay } from ${JSON.stringify(MODULE_URL)};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const claim = claimXvfbDisplay([":193", ":194", ":195", ":196", ":197"]);
if (!claim) { console.log(JSON.stringify({ ok: false, error: "khong claim duoc display" })); process.exit(0); }
let xvfb = null, sockOk = false;
try {
  xvfb = spawn("Xvfb", [claim.display, "-screen", "0", "1440x900x24"], { stdio: "ignore" });
  for (let i = 0; i < 20 && !sockOk; i++) { await sleep(250); sockOk = fs.existsSync("/tmp/.X11-unix/X" + claim.display.slice(1)) && xvfb.exitCode === null; }
  await sleep(3000);
  console.log(JSON.stringify({ ok: sockOk, display: claim.display, exitCode: xvfb.exitCode }));
} finally {
  try { xvfb?.kill("SIGKILL"); } catch {}
  releaseXvfbDisplay(claim);
}
`;
async function runChild() {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ["--input-type=module", "-e", CHILD_CODE], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => { out += d; });
    p.stderr.on("data", (d) => { err += d; });
    p.on("close", (code) => {
      try {
        resolve({ ...JSON.parse(out.trim().split("\n").pop()), code });
      } catch {
        resolve({ ok: false, error: `no-json code=${code} out=${out.slice(0, 200)} err=${err.slice(0, 200)}` });
      }
    });
  });
}
{
  const t0 = Date.now();
  const runs = await Promise.all([runChild(), runChild(), runChild()]);
  const displays = runs.filter((r) => r.ok).map((r) => r.display);
  const distinct = new Set(displays).size;
  check(
    "B. 3 claim song song đều lên Xvfb thật",
    runs.every((r) => r.ok),
    runs.map((r) => `${r.display ?? "?"}:${r.ok ? "OK" : "FAIL:" + (r.error || "sock")}`).join(", "),
  );
  check(
    "B. 3 display khác nhau (không race chiếm display)",
    displays.length === 3 && distinct === 3,
    `distinct=${distinct}/3 (${displays.join(", ")})`,
  );
  console.log(`    (mất ${Date.now() - t0}ms)`);
  results.phases.B = { runs, distinct };
}

// ---- Phase C: display đang giữ → claim trả null; nhả xong claim được ----
{
  const holder = spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
import { claimXvfbDisplay, releaseXvfbDisplay } from ${JSON.stringify(MODULE_URL)};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const claim = claimXvfbDisplay([":214"]);
console.log(JSON.stringify({ held: claim?.display ?? null }));
await sleep(6000);
if (claim) releaseXvfbDisplay(claim);
`,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const heldLine = await new Promise((resolve) => {
    let buf = "";
    holder.stdout.on("data", (d) => {
      buf += d;
      if (buf.includes("\n")) resolve(buf.trim());
    });
    setTimeout(() => resolve(buf.trim()), 8000);
  });
  let held = null;
  try {
    held = JSON.parse(heldLine).held;
  } catch {}
  const whileHeld = held ? claimXvfbDisplay([":214"]) : "SKIP";
  check(
    "C. display đang bị giữ → claim trả null",
    whileHeld === null,
    held ? `holder giữ ${held}, claim lúc giữ = ${whileHeld ? whileHeld.display : "null"}` : "holder không claim được :214",
  );
  if (whileHeld && typeof whileHeld === "object") releaseXvfbDisplay(whileHeld); // phòng thủ: không để kẹt lock nếu claim lọt
  await new Promise((resolve) => holder.on("close", resolve));
  const afterRelease = claimXvfbDisplay([":214"]);
  check(
    "C. sau khi holder nhả → claim lại được",
    !!afterRelease && afterRelease.display === ":214",
    afterRelease ? `claim được ${afterRelease.display}` : "vẫn claim không được",
  );
  if (afterRelease) releaseXvfbDisplay(afterRelease);
  check("C. không còn lock mồ côi", !fs.existsSync(`${XVFB_LOCK_ROOT}/X214.lock`));
  check("C. không còn Xvfb nào của test chạy", !xvfbAlive(":214") && !xvfbAlive(":211"));
  results.phases.C = { held, whileHeldNull: whileHeld === null, afterRelease: !!afterRelease };
}

results.failures = failures;
fs.writeFileSync(path.join(OUT_DIR, "xvfb-lock-test.json"), JSON.stringify(results, null, 2));
console.log(failures === 0 ? "KẾT QUẢ: PASS (không lỗi)" : `KẾT QUẢ: FAIL (${failures} lỗi)`);
process.exit(failures === 0 ? 0 : 1);
