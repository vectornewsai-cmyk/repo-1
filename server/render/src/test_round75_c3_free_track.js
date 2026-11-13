#!/usr/bin/env node
/**
 * test_round75_c3_free_track.js — Phase 9 đợt 75, luồng C3.
 *
 * Kiểm chứng free_track_preload (theo dõi chunk 2.073.600 byte để tìm
 * AI FREE chunk đích td->src trước crash) + chạy thử 1 lần NOCOPY thật
 * dưới cả 2 preload (free_track + segv_backtrace) để xem log FREE:
 *   1. Biên dịch free_track_preload.c (gcc -Wall -Wextra, không warning).
 *   2. Unit test: chương trình C malloc/free + posix_memalign/free đúng
 *      cỡ 2073600 -> log phải có ALLOC-malloc/FREE và ALLOC-memalign/FREE
 *      đúng địa chỉ; malloc(1000) không được log.
 *   3. COPY smoke ffmpeg thật dưới cả 2 preload -> sha ground truth.
 *   4. NOCOPY ×1 dưới cả 2 preload -> đếm ALLOC/FREE cỡ 2073600; nhận
 *      diện chunk td->src qua backtrace chứa vsFrameAllocate (hoặc offset
 *      vsFrameAllocate nếu symbol bị strip); báo chunk td->src có bị FREE
 *      giữa stream không, và (nếu crash) RDI có khớp địa chỉ đã FREE không.
 *
 * Cách chạy: node server/render/src/test_round75_c3_free_track.js
 * Scratch: ~/workspace/.scratch-r75c3/runs (env C3_WORK).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.C3_WORK || path.join(HOME, "workspace", ".scratch-r75c3", "runs");
fs.mkdirSync(WORK, { recursive: true });

const FREE_C = path.join(__dirname, "free_track_preload.c");
const FREE_SO = path.join(WORK, "free_track_preload.so");
const SEGV_C = path.join(__dirname, "segv_backtrace_preload.c");
const SEGV_SO = path.join(WORK, "segv_backtrace_preload.so");
const UNIT_C = path.join(WORK, "c3_free_unit.c");
const UNIT_BIN = path.join(WORK, "c3_free_unit");
const UNIT_LOG = path.join(WORK, "free-track-unit.log");
const HUNT_LOG = path.join(WORK, "free-track-hunt1.log");
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
  void *a = malloc(1920*1080);
  memset(a, 1, 1920*1080);
  void *b = NULL;
  posix_memalign(&b, 64, 1920*1080);
  memset(b, 2, 1920*1080);
  void *c = malloc(1000);
  memset(c, 3, 1000);
  free(c);
  free(a);
  free(b);
  printf("unit done a=%p b=%p\\n", a, b);
  return 0;
}
`;

function parseFreeLog(logText) {
  const events = [];
  const lines = logText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\[free_track\] (ALLOC-malloc|ALLOC-memalign|FREE) addr=(0x[0-9a-f]+) size=(\d+) tid=(\d+)/);
    if (!m) continue;
    const bt = [];
    for (let j = i + 1; j < Math.min(i + 17, lines.length); j++) {
      if (lines[j].startsWith("[free_track]")) break;
      if (lines[j].trim()) bt.push(lines[j].trim());
    }
    events.push({ kind: m[1], addr: m[2], size: parseInt(m[3], 10), tid: m[4], bt });
  }
  return events;
}

function main() {
  console.log("== Đợt 75 C3 — kiểm chứng free_track_preload + chạy thử NOCOPY ×1 ==");
  console.log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, FREE_C, SEGV_C]) {
    if (!fs.existsSync(p)) { console.log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }

  // 0. vsFrameAllocate có trong dynamic symbols của libvidstab không?
  const nm = spawnSync("nm", ["-D", "/lib/x86_64-linux-gnu/libvidstab.so.1.1"],
    { stdio: ["ignore", "pipe", "pipe"] });
  const nmOut = (nm.stdout || "").toString();
  const vsAlloc = nmOut.match(/([0-9a-f]+) T vsFrameAllocate/);
  console.log(`   📊 vsFrameAllocate dynamic symbol: ${vsAlloc ? `0x${vsAlloc[1]}` : "KHÔNG thấy (backtrace sẽ chỉ có offset)"}`);

  // 1. Biên dịch cả 2 preload.
  let cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", FREE_SO, FREE_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch free_track_preload (gcc -Wall -Wextra)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  check((cc.stderr || "").toString().trim() === "", "gcc free_track không warning", (cc.stderr || "").toString().slice(0, 200));
  cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", SEGV_SO, SEGV_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch segv_backtrace_preload (bản C3)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));

  // 2. Unit test.
  writeFileEpermRetry(UNIT_C, UNIT_SRC);
  cc = spawnSync("gcc", ["-O2", "-o", UNIT_BIN, UNIT_C], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch c3_free_unit", "");
  try { fs.unlinkSync(UNIT_LOG); } catch { /* chưa có */ }
  const u = spawnSync(UNIT_BIN, [], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 60000,
    env: { ...process.env, LD_PRELOAD: FREE_SO, FREE_TRACK_LOG: UNIT_LOG },
  });
  check(u.status === 0, "unit chạy xong exit 0", `status=${u.status}`);
  const unitLog = fs.existsSync(UNIT_LOG) ? fs.readFileSync(UNIT_LOG, "utf8") : "";
  const unitEv = parseFreeLog(unitLog);
  const unitAddr = (u.stdout || "").toString().match(/a=(0x[0-9a-f]+) b=(0x[0-9a-f]+)/);
  const aAddr = unitAddr ? unitAddr[1] : null, bAddr = unitAddr ? unitAddr[2] : null;
  check(unitEv.some((e) => e.kind === "ALLOC-malloc" && e.addr === aAddr),
    "log có ALLOC-malloc đúng địa chỉ a", `events=${unitEv.map((e) => e.kind + "@" + e.addr).join(",")}`);
  check(unitEv.some((e) => e.kind === "FREE" && e.addr === aAddr),
    "log có FREE đúng địa chỉ a", "");
  check(unitEv.some((e) => e.kind === "ALLOC-memalign" && e.addr === bAddr),
    "log có ALLOC-memalign đúng địa chỉ b", "");
  check(unitEv.some((e) => e.kind === "FREE" && e.addr === bAddr),
    "log có FREE đúng địa chỉ b", "");
  check(unitEv.length === 4, "chỉ log đúng 4 event (malloc 1000 không log)", `got ${unitEv.length}`);

  // 3. COPY smoke dưới cả 2 preload.
  console.log("\n-- smoke COPY (ffmpeg thật, 2 preload) --");
  const bothPreloads = `${FREE_SO}:${SEGV_SO}`;
  const out = path.join(WORK, "smoke-copy2.framemd5");
  try { fs.unlinkSync(HUNT_LOG); } catch { /* chưa có */ }
  const vfCopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  let r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vfCopy, "-an", "-f", "framemd5", "-y", out], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: bothPreloads, FREE_TRACK_LOG: HUNT_LOG },
  });
  const ok = r.status === 0 && fs.existsSync(out) && fs.statSync(out).size > 0;
  const sha = ok ? crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex").slice(0, 12) : null;
  check(ok && sha === GROUND_TRUTH_SHA_PREFIX,
    `COPY smoke sha=${sha} khớp ground truth ${GROUND_TRUTH_SHA_PREFIX}…`,
    `status=${r.status} sha=${sha} signal=${r.signal}`);

  // 4. NOCOPY ×1 dưới cả 2 preload — xem log FREE.
  console.log("\n-- NOCOPY ×1 (ffmpeg thật, 2 preload) — đọc log FREE --");
  try { fs.unlinkSync(HUNT_LOG); } catch { /* chưa có */ }
  const out2 = path.join(WORK, "free-track-nocopy.framemd5");
  const vfNocopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vfNocopy, "-an", "-f", "framemd5", "-y", out2], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: bothPreloads, FREE_TRACK_LOG: HUNT_LOG },
  });
  const crashed = r.signal === "SIGSEGV" || r.status !== 0;
  const stderr = (r.stderr || "").toString();
  console.log(`   📊 NOCOPY: status=${r.status} signal=${r.signal} (crash=${crashed})`);
  const huntLog = fs.existsSync(HUNT_LOG) ? fs.readFileSync(HUNT_LOG, "utf8") : "";
  const ev = parseFreeLog(huntLog);
  const nAllocM = ev.filter((e) => e.kind === "ALLOC-malloc").length;
  const nAllocA = ev.filter((e) => e.kind === "ALLOC-memalign").length;
  const nFree = ev.filter((e) => e.kind === "FREE").length;
  console.log(`   📊 log FREE_TRACK: ALLOC-malloc=${nAllocM} ALLOC-memalign=${nAllocA} FREE=${nFree} (tổng ${ev.length} event)`);
  // Nhận diện chunk td->src: ALLOC có backtrace chứa vsFrameAllocate.
  const vidstabAllocs = ev.filter((e) => e.bt.some((l) => l.includes("vsFrameAllocate") || l.includes("vsTransformPrepare")));
  console.log(`   📊 ALLOC có backtrace vidstab (vsFrameAllocate/vsTransformPrepare): ${vidstabAllocs.length}`);
  for (const a of vidstabAllocs.slice(0, 6)) {
    // Phân biệt src (line 143) vs destbuf (line 158) qua return offset trong vsTransformPrepare:
    // +0x144 = call vsFrameAllocate ở 0x660f (destbuf); +0x17b = call ở 0x6646.
    const tp = a.bt.find((l) => l.includes("vsTransformPrepare"));
    console.log(`        ${a.kind} ${a.addr} <- ${tp || "?"} | ${a.bt.filter((l) => l.includes("vidstab")).slice(0, 2).join(" | ")}`);
  }
  const vidstabFreed = ev.filter((e) => e.kind === "FREE" && vidstabAllocs.some((a) => a.addr === e.addr));
  console.log(`   📊 chunk vidstab bị FREE trong lần chạy này: ${vidstabFreed.length} (vị trí event: ${vidstabFreed.map((e) => ev.indexOf(e)).join(",") || "-"})`);
  check(nAllocM + nAllocA > 0, "log ghi được ALLOC cỡ 2073600 trong lần chạy thật", `ev=${ev.length}`);
  // Ghi chú: FREE ở cuối log là uninit hợp lệ (avfilter_graph_free) — không
  // phải bằng chứng free giữa stream. Chỉ kết luận "free giữa stream" khi
  // FREE xuất hiện TRƯỚC khi stream kết thúc (vd RDI crash khớp FREE đó).
  if (crashed) {
    const regs = stderr.match(/regs: RIP=0x([0-9a-f]+) RDI=0x([0-9a-f]+) RSI=0x([0-9a-f]+) RDX=0x([0-9a-f]+)/);
    const rdi = regs ? `0x${regs[2]}` : null;
    console.log(`   💥 CRASH dưới 2 preload! RDI=${rdi}`);
    const freedMatch = rdi ? ev.filter((e) => e.kind === "FREE" && e.addr === rdi) : [];
    console.log(`   📊 RDI ${rdi} có trong log FREE trước crash: ${freedMatch.length} lần`);
    for (const f of freedMatch) {
      console.log(`        FREE ${f.addr} tại event #${ev.indexOf(f)}/${ev.length}, backtrace: ${f.bt.slice(0, 6).join(" | ")}`);
    }
    check(freedMatch.length > 0, "RDI crash khớp 1 FREE đã log (xác định được người free)", freedMatch.length ? "" : "không khớp — xem LIMITS");
  } else {
    console.log(`   📊 Không crash lần này (bình thường, p~20%) — log FREE vẫn cho biết chunk vidstab có bị free giữa stream không.`);
    // Không assert số FREE: FREE cuối log là uninit hợp lệ. Kết luận về
    // "free giữa stream" chỉ rút được khi có crash để đối chiếu RDI.
    check(true, "ghi nhận inventory ALLOC/FREE (xem số liệu trên — FREE cuối là uninit)", "");
  }

  console.log(`\n== KẾT QUẢ: ${pass} PASS, ${fail} FAIL ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
