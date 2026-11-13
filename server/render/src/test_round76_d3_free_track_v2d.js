#!/usr/bin/env node
/**
 * test_round76_d3_free_track_v2d.js — Phase 9 đợt 76, luồng D3.
 *
 * Kiểm chứng free-tracker v2d ("silent-alloc": ALLOC chỉ insert lặng,
 * chỉ FREE mới ghi log kèm backtrace — để bắt crash mà không ức chế
 * race như v2c/v1):
 *   1. Biên dịch v2d (gcc -Wall -Wextra, không warning) + segv C3;
 *      v2d không chứa pthread_mutex (code + nm).
 *   2. Unit: memalign 2092879 + malloc 2073600 + free cả hai ->
 *      log đúng 2 FREE (đúng địa chỉ + size), KHÔNG có dòng ALLOC
 *      nào; malloc/free(1000) không log gì.
 *   3. COPY smoke ffmpeg thật dưới v2d+segv -> sha ground truth; log
 *      có FREE cỡ 2092879 (decoder Y) kèm backtrace (pool_uninit /
 *      av_buffer_unref); tổng số FREE ~49 (mọi chunk đều được free
 *      lúc teardown — chứng tỏ insert lặng vẫn bắt được FREE).
 *   4. NOCOPY x1 dưới v2d+segv -> báo cáo số FREE, và (nếu crash)
 *      RDI có khớp FREE đã log không + backtrace của lần FREE đó.
 *
 * Cách chạy: node server/render/src/test_round76_d3_free_track_v2d.js
 * Scratch: ~/workspace/.scratch-r76d3/runs-v2b (env D3D_WORK).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.D3D_WORK || path.join(HOME, "workspace", ".scratch-r76d3", "runs-v2b");
fs.mkdirSync(WORK, { recursive: true });

const V2D_C = path.join(__dirname, "free_track_v2d_preload.c");
const V2D_SO = path.join(WORK, "free_track_v2d_preload.so");
const SEGV_C = path.join(__dirname, "segv_backtrace_preload.c");
const SEGV_SO = path.join(WORK, "segv_backtrace_preload.so");
const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const GROUND_TRUTH_SHA_PREFIX = "d960996868d3";

let pass = 0, fail = 0;
function check(cond, label, detail) {
  if (cond) { pass++; console.log(`   ✅ ${label}`); }
  else { fail++; console.log(`   ❌ ${label}${detail ? ` — ${detail}` : ""}`); }
}

const UNIT_SRC = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(void) {
  void *a = NULL;
  posix_memalign(&a, 64, 2092879);   /* Y decoder */
  memset(a, 1, 2092879);
  void *b = malloc(1920*1080);       /* 2073600: Y vidstab */
  memset(b, 2, 1920*1080);
  void *c = malloc(1000);            /* không track */
  memset(c, 3, 1000);
  free(c);
  free(a);
  free(b);
  printf("unit done a=%p b=%p\\n", a, b);
  return 0;
}
`;

function parseV2dLog(logText) {
  const events = [];
  const lines = logText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\[free_track_v2d\] seq=(\d+) (ALLOC-malloc|ALLOC-memalign|FREE) addr=(0x[0-9a-f]+) size=(\d+) tid=(\d+)/);
    if (!m) continue;
    const bt = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith("[free_track_v2d]")) break;
      if (lines[j].trim()) bt.push(lines[j].trim());
    }
    events.push({ seq: parseInt(m[1], 10), kind: m[2], addr: m[3], size: parseInt(m[4], 10), tid: m[5], bt });
  }
  return { events };
}

function main() {
  console.log("== Đợt 76 D3 — kiểm chứng free_track_v2d (silent-alloc) ==");
  console.log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, V2D_C, SEGV_C]) {
    if (!fs.existsSync(p)) { console.log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }

  let cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", V2D_SO, V2D_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch free_track_v2d_preload (gcc -Wall -Wextra)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  check((cc.stderr || "").toString().trim() === "", "gcc v2d không warning", (cc.stderr || "").toString().slice(0, 200));
  cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", SEGV_SO, SEGV_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch segv_backtrace_preload (bản C3)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  const codeLines = fs.readFileSync(V2D_C, "utf8").split("\n")
    .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"));
  check(!codeLines.join("\n").includes("pthread_mutex"),
    "v2d không chứa pthread_mutex trong code (không lock)", "còn mutex trong code!");
  const nm = spawnSync("nm", ["-D", V2D_SO], { stdio: ["ignore", "pipe", "pipe"] });
  check(!/pthread_mutex/.test((nm.stdout || "").toString()),
    "v2d .so không link symbol pthread_mutex_*", "");

  // Unit.
  const unitC = path.join(WORK, "d3d_free_unit.c");
  const unitBin = path.join(WORK, "d3d_free_unit");
  const unitLog = path.join(WORK, "free-track-v2d-unit.log");
  writeFileEpermRetry(unitC, UNIT_SRC);
  cc = spawnSync("gcc", ["-O2", "-o", unitBin, unitC], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch d3d_free_unit", "");
  try { fs.unlinkSync(unitLog); } catch { /* chưa có */ }
  const u = spawnSync(unitBin, [], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 60000,
    env: { ...process.env, LD_PRELOAD: V2D_SO, FREE_TRACK_LOG: unitLog },
  });
  check(u.status === 0, "unit chạy xong exit 0", `status=${u.status}`);
  const unitLogText = fs.existsSync(unitLog) ? fs.readFileSync(unitLog, "utf8") : "";
  const { events: uev } = parseV2dLog(unitLogText);
  const uaddr = (u.stdout || "").toString().match(/a=(0x[0-9a-f]+) b=(0x[0-9a-f]+)/);
  const [aAddr, bAddr] = uaddr ? [uaddr[1], uaddr[2]] : [null, null];
  check(uev.filter((e) => e.kind.startsWith("ALLOC")).length === 0,
    "log KHÔNG có dòng ALLOC nào (silent-alloc)", `alloc=${uev.filter((e) => e.kind.startsWith("ALLOC")).length}`);
  check(uev.some((e) => e.kind === "FREE" && e.addr === aAddr && e.size === 2092879),
    "log FREE 2092879 đúng địa chỉ", `events=${uev.map((e) => e.kind + "@" + e.addr + ":" + e.size).join(",")}`);
  check(uev.some((e) => e.kind === "FREE" && e.addr === bAddr && e.size === 2073600),
    "log FREE 2073600 đúng địa chỉ", "");
  check(uev.length === 2, "tổng đúng 2 event (toàn FREE; malloc 1000 không log)", `got ${uev.length}`);

  // COPY smoke.
  console.log("\n-- smoke COPY (ffmpeg thật, v2d+segv) --");
  const bothPreloads = `${V2D_SO}:${SEGV_SO}`;
  const copyLog = path.join(WORK, "free-track-v2d-copy.log");
  try { fs.unlinkSync(copyLog); } catch { /* chưa có */ }
  const out = path.join(WORK, "smoke-copy-v2d.framemd5");
  const vfCopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  let r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vfCopy, "-an", "-f", "framemd5", "-y", out], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: bothPreloads, FREE_TRACK_LOG: copyLog },
  });
  const ok = r.status === 0 && fs.existsSync(out) && fs.statSync(out).size > 0;
  const sha = ok ? crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex").slice(0, 12) : null;
  check(ok && sha === GROUND_TRUTH_SHA_PREFIX,
    `COPY smoke sha=${sha} khớp ground truth ${GROUND_TRUTH_SHA_PREFIX}…`,
    `status=${r.status} sha=${sha} signal=${r.signal}`);
  const copyText = fs.existsSync(copyLog) ? fs.readFileSync(copyLog, "utf8") : "";
  const { events: cev } = parseV2dLog(copyText);
  const nFree = cev.filter((e) => e.kind === "FREE").length;
  console.log(`   📊 COPY log: ${cev.length} event (toàn FREE), trong đó FREE 2092879 = ${cev.filter((e) => e.kind === "FREE" && e.size === 2092879).length}`);
  check(cev.filter((e) => e.kind === "FREE" && e.size === 2092879).length > 0,
    "COPY log có FREE cỡ 2092879 (decoder Y)", "");
  check(cev.some((e) => e.kind === "FREE" && e.size === 2092879 && e.bt.some((l) => /av_buffer_pool_uninit|av_buffer_unref/.test(l))),
    "FREE 2092879 có backtrace pool_uninit/av_buffer_unref", "");
  check(nFree >= 40, "COPY log đủ nhiều FREE (insert lặng vẫn bắt được FREE)", `nFree=${nFree}`);

  // NOCOPY x1.
  console.log("\n-- NOCOPY x1 (ffmpeg thật, v2d+segv) — ghi nhận --");
  const ncLog = path.join(WORK, "free-track-v2d-nocopy.log");
  try { fs.unlinkSync(ncLog); } catch { /* chưa có */ }
  const out2 = path.join(WORK, "free-track-v2d-nocopy.framemd5");
  const vfNocopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vfNocopy, "-an", "-f", "framemd5", "-y", out2], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: bothPreloads, FREE_TRACK_LOG: ncLog },
  });
  const crashed = r.signal === "SIGSEGV" || r.status !== 0;
  const ncText = fs.existsSync(ncLog) ? fs.readFileSync(ncLog, "utf8") : "";
  const { events: nev } = parseV2dLog(ncText);
  console.log(`   📊 NOCOPY x1: status=${r.status} signal=${r.signal} crash=${crashed} FREE-logged=${nev.length}`);
  if (crashed) {
    const regs = (r.stderr || "").toString().match(/regs: RIP=0x([0-9a-f]+) RDI=0x([0-9a-f]+) RSI=0x([0-9a-f]+) RDX=0x([0-9a-f]+)/);
    const rdi = regs ? `0x${regs[2]}` : null;
    const freedMatch = rdi ? nev.filter((e) => e.kind === "FREE" && e.addr === rdi) : [];
    console.log(`   💥 CRASH dưới v2d! RDI=${rdi} khớp FREE đã log: ${freedMatch.length}`);
    for (const f of freedMatch) console.log(`        FREE ${f.addr} size=${f.size} bt: ${f.bt.slice(0, 8).join(" | ")}`);
    check(freedMatch.length > 0, "RDI crash khớp 1 FREE đã log (xác định được người free)", freedMatch.length ? "" : "không khớp — xem LIMITS");
  } else {
    check(nev.length > 0, "NOCOPY x1 ghi được FREE", `ev=${nev.length}`);
  }

  console.log(`\n== KẾT QUẢ: ${pass} PASS, ${fail} FAIL ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
