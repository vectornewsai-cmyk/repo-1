#!/usr/bin/env node
/**
 * test_round76_d3_free_track_v2b.js — Phase 9 đợt 76, luồng D3.
 *
 * Kiểm chứng free-tracker v2b (biến thể v2, thêm các cỡ buffer decoder
 * 1920x1080 yuv420p: Y 2.088.960, U/V 522.240, +64 padding, nguyên
 * frame 3.133.440 — để bắt FREE của buffer decoder frame 147):
 *   1. Biên dịch v2b (gcc -Wall -Wextra, không warning) + segv C3;
 *      v2b không chứa pthread_mutex (code + nm).
 *   2. Unit đơn luồng: malloc 2073600 / memalign 2088960 / memalign
 *      522240 / malloc(1000) -> log đúng 6 event (3 ALLOC + 3 FREE)
 *      đúng địa chỉ + đúng size; size không track không log.
 *   3. Unit đa luồng (4 thread x 20 memalign/free 2088960) -> đúng
 *      80 ALLOC + 80 FREE, mọi FREE khớp ALLOC trước đó, không dòng rác.
 *   4. COPY smoke ffmpeg thật dưới v2b+segv -> sha ground truth; log
 *      phải có ALLOC cỡ 2088960 với backtrace decoder (av_buffer_alloc
 *      / ff_get_buffer / av_frame_get_buffer) — chứng tỏ giả thuyết cỡ
 *      buffer decoder đúng và track được; +0x17b/+0x144 vẫn có.
 *   5. NOCOPY x1 dưới v2b+segv -> báo cáo số event theo size, armed?,
 *      và (nếu crash) RDI có khớp FREE đã log không.
 *
 * Cách chạy: node server/render/src/test_round76_d3_free_track_v2b.js
 * Scratch: ~/workspace/.scratch-r76d3/runs-v2b (env D3B_WORK).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.D3B_WORK || path.join(HOME, "workspace", ".scratch-r76d3", "runs-v2b");
fs.mkdirSync(WORK, { recursive: true });

const V2B_C = path.join(__dirname, "free_track_v2b_preload.c");
const V2B_SO = path.join(WORK, "free_track_v2b_preload.so");
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
  void *a = malloc(1920*1080);            /* 2073600: Y vidstab */
  memset(a, 1, 1920*1080);
  void *b = NULL;
  posix_memalign(&b, 64, 1920*1088);      /* 2088960: Y decoder */
  memset(b, 2, 1920*1088);
  void *c = NULL;
  posix_memalign(&c, 64, 960*544);        /* 522240: U/V decoder */
  memset(c, 3, 960*544);
  void *d = malloc(1000);                 /* không track */
  memset(d, 4, 1000);
  void *e = malloc(2088961);              /* không track (sai 1 byte) */
  memset(e, 5, 2088961);
  free(d); free(e); free(a); free(b); free(c);
  printf("unit done a=%p b=%p c=%p\\n", a, b, c);
  return 0;
}
`;

const MT_SRC = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#define NTHREAD 4
#define NTRACK 20
static void *worker(void *arg) {
  (void)arg;
  for (int i = 0; i < NTRACK; i++) {
    void *b = NULL;
    posix_memalign(&b, 64, 1920*1088);
    memset(b, 2, 1920*1088);
    free(b);
  }
  return NULL;
}
int main(void) {
  pthread_t th[NTHREAD];
  for (int i = 0; i < NTHREAD; i++) pthread_create(&th[i], NULL, worker, NULL);
  for (int i = 0; i < NTHREAD; i++) pthread_join(th[i], NULL);
  printf("mt done\\n");
  return 0;
}
`;

function parseV2bLog(logText) {
  const events = [];
  const lines = logText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\[free_track_v2b\] seq=(\d+) (ALLOC-malloc|ALLOC-memalign|FREE) addr=(0x[0-9a-f]+) size=(\d+) tid=(\d+)/);
    if (!m) continue;
    const bt = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith("[free_track_v2b]")) break;
      if (lines[j].trim()) bt.push(lines[j].trim());
    }
    events.push({ seq: parseInt(m[1], 10), kind: m[2], addr: m[3], size: parseInt(m[4], 10), tid: m[5], bt });
  }
  const armed = /\[free_track_v2b\] ARMED addr=(0x[0-9a-f]+)/.exec(logText);
  return { events, armedAddr: armed ? armed[1] : null };
}

function main() {
  console.log("== Đợt 76 D3 — kiểm chứng free_track_v2b (decoder sizes) ==");
  console.log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, V2B_C, SEGV_C]) {
    if (!fs.existsSync(p)) { console.log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }

  // 1. Biên dịch.
  let cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", V2B_SO, V2B_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch free_track_v2b_preload (gcc -Wall -Wextra)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  check((cc.stderr || "").toString().trim() === "", "gcc v2b không warning", (cc.stderr || "").toString().slice(0, 200));
  cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", SEGV_SO, SEGV_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch segv_backtrace_preload (bản C3)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  const v2bCodeLines = fs.readFileSync(V2B_C, "utf8").split("\n")
    .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"));
  check(!v2bCodeLines.join("\n").includes("pthread_mutex"),
    "v2b không chứa pthread_mutex trong code (không lock)", "còn mutex trong code!");
  const nmV2b = spawnSync("nm", ["-D", V2B_SO], { stdio: ["ignore", "pipe", "pipe"] });
  check(!/pthread_mutex/.test((nmV2b.stdout || "").toString()),
    "v2b .so không link symbol pthread_mutex_*", "");

  // 2. Unit đơn luồng.
  const unitC = path.join(WORK, "d3b_free_unit.c");
  const unitBin = path.join(WORK, "d3b_free_unit");
  const unitLog = path.join(WORK, "free-track-v2b-unit.log");
  writeFileEpermRetry(unitC, UNIT_SRC);
  cc = spawnSync("gcc", ["-O2", "-o", unitBin, unitC], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch d3b_free_unit", "");
  try { fs.unlinkSync(unitLog); } catch { /* chưa có */ }
  const u = spawnSync(unitBin, [], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 60000,
    env: { ...process.env, LD_PRELOAD: V2B_SO, FREE_TRACK_LOG: unitLog },
  });
  check(u.status === 0, "unit chạy xong exit 0", `status=${u.status}`);
  const unitLogText = fs.existsSync(unitLog) ? fs.readFileSync(unitLog, "utf8") : "";
  const { events: uev } = parseV2bLog(unitLogText);
  const uaddr = (u.stdout || "").toString().match(/a=(0x[0-9a-f]+) b=(0x[0-9a-f]+) c=(0x[0-9a-f]+)/);
  const [aAddr, bAddr, cAddr] = uaddr ? [uaddr[1], uaddr[2], uaddr[3]] : [null, null, null];
  check(uev.some((e) => e.kind === "ALLOC-malloc" && e.addr === aAddr && e.size === 2073600), "log ALLOC-malloc 2073600 đúng địa chỉ", `events=${uev.map((e) => e.kind + "@" + e.addr + ":" + e.size).join(",")}`);
  check(uev.some((e) => e.kind === "ALLOC-memalign" && e.addr === bAddr && e.size === 2088960), "log ALLOC-memalign 2088960 đúng địa chỉ", "");
  check(uev.some((e) => e.kind === "ALLOC-memalign" && e.addr === cAddr && e.size === 522240), "log ALLOC-memalign 522240 đúng địa chỉ", "");
  check(uev.filter((e) => e.kind === "FREE").length === 3, "log đúng 3 FREE (1000 và 2088961 không log)", `free=${uev.filter((e) => e.kind === "FREE").length}`);
  check(uev.length === 6, "tổng đúng 6 event", `got ${uev.length}`);

  // 3. Unit đa luồng với cỡ decoder.
  const mtC = path.join(WORK, "d3b_mt_unit.c");
  const mtBin = path.join(WORK, "d3b_mt_unit");
  const mtLog = path.join(WORK, "free-track-v2b-mt.log");
  writeFileEpermRetry(mtC, MT_SRC);
  cc = spawnSync("gcc", ["-O2", "-o", mtBin, mtC, "-pthread"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch d3b_mt_unit", "");
  try { fs.unlinkSync(mtLog); } catch { /* chưa có */ }
  const mt = spawnSync(mtBin, [], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 120000,
    env: { ...process.env, LD_PRELOAD: V2B_SO, FREE_TRACK_LOG: mtLog },
  });
  check(mt.status === 0, "mt unit chạy xong exit 0", `status=${mt.status}`);
  const mtText = fs.existsSync(mtLog) ? fs.readFileSync(mtLog, "utf8") : "";
  const { events: mev } = parseV2bLog(mtText);
  check(mev.filter((e) => e.kind.startsWith("ALLOC")).length === 80 && mev.filter((e) => e.kind === "FREE").length === 80,
    "mt: đúng 80 ALLOC + 80 FREE cỡ 2088960", `alloc=${mev.filter((e) => e.kind.startsWith("ALLOC")).length} free=${mev.filter((e) => e.kind === "FREE").length}`);
  const allocAddrs = new Map();
  let orderOk = true;
  for (const e of mev) {
    if (e.kind.startsWith("ALLOC")) allocAddrs.set(e.addr, (allocAddrs.get(e.addr) || 0) + 1);
    else if (allocAddrs.get(e.addr) > 0) allocAddrs.set(e.addr, allocAddrs.get(e.addr) - 1);
    else orderOk = false;
  }
  check(orderOk && [...allocAddrs.values()].every((v) => v === 0),
    "mt: mọi FREE đều khớp 1 ALLOC trước đó", "");
  const nonPrintable = mtText.split("\n").filter((l) => /[^\x20-\x7e]/.test(l));
  check(nonPrintable.length === 0, "mt: không dòng rác/non-printable", `dòng rác: ${nonPrintable.length}`);

  // 4. COPY smoke dưới v2b+segv.
  console.log("\n-- smoke COPY (ffmpeg thật, v2b+segv) --");
  const bothPreloads = `${V2B_SO}:${SEGV_SO}`;
  const copyLog = path.join(WORK, "free-track-v2b-copy.log");
  try { fs.unlinkSync(copyLog); } catch { /* chưa có */ }
  const out = path.join(WORK, "smoke-copy-v2b.framemd5");
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
  const { events: cev, armedAddr: carmed } = parseV2bLog(copyText);
  const bySize = {};
  for (const e of cev) bySize[e.size] = (bySize[e.size] || 0) + 1;
  console.log(`   📊 COPY log: ${cev.length} event theo size: ${JSON.stringify(bySize)}`);
  const decY = cev.filter((e) => e.size === 2088960);
  check(decY.length > 0, "COPY log có ALLOC cỡ 2088960 (buffer Y decoder)", `count=${decY.length}`);
  const decBt = decY.some((e) => e.bt.some((l) => /av_buffer_alloc|av_frame_get_buffer|ff_get_buffer|get_buffer/.test(l)));
  check(decBt, "ALLOC 2088960 có backtrace decoder (av_buffer/get_buffer)", decY.length ? decY[0].bt.slice(0, 4).join(" | ") : "không có event");
  check(cev.some((e) => e.bt.some((l) => l.includes("vsTransformPrepare+0x17b"))), "COPY log có ALLOC td->src (+0x17b)", "");
  check(carmed !== null, `COPY log có dòng ARMED (addr=${carmed})`, "không có ARMED");

  // 5. NOCOPY x1 dưới v2b+segv — ghi nhận.
  console.log("\n-- NOCOPY x1 (ffmpeg thật, v2b+segv) — ghi nhận --");
  const ncLog = path.join(WORK, "free-track-v2b-nocopy.log");
  try { fs.unlinkSync(ncLog); } catch { /* chưa có */ }
  const out2 = path.join(WORK, "free-track-v2b-nocopy.framemd5");
  const vfNocopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vfNocopy, "-an", "-f", "framemd5", "-y", out2], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: bothPreloads, FREE_TRACK_LOG: ncLog },
  });
  const crashed = r.signal === "SIGSEGV" || r.status !== 0;
  const ncText = fs.existsSync(ncLog) ? fs.readFileSync(ncLog, "utf8") : "";
  const { events: nev, armedAddr: narmed } = parseV2bLog(ncText);
  const ncBySize = {};
  for (const e of nev) ncBySize[e.size] = (ncBySize[e.size] || 0) + 1;
  console.log(`   📊 NOCOPY x1: status=${r.status} signal=${r.signal} crash=${crashed} armed=${narmed !== null}`);
  console.log(`   📊 NOCOPY x1 log: ${nev.length} event theo size: ${JSON.stringify(ncBySize)}`);
  if (crashed) {
    const regs = (r.stderr || "").toString().match(/regs: RIP=0x([0-9a-f]+) RDI=0x([0-9a-f]+) RSI=0x([0-9a-f]+) RDX=0x([0-9a-f]+)/);
    const rdi = regs ? `0x${regs[2]}` : null;
    const freedMatch = rdi ? nev.filter((e) => e.kind === "FREE" && e.addr === rdi) : [];
    console.log(`   💥 CRASH dưới v2b! RDI=${rdi} khớp FREE đã log: ${freedMatch.length}`);
    for (const f of freedMatch) console.log(`        FREE ${f.addr} size=${f.size} bt: ${f.bt.slice(0, 6).join(" | ")}`);
    check(freedMatch.length > 0, "RDI crash khớp 1 FREE đã log (xác định được người free)", freedMatch.length ? "" : "không khớp — xem LIMITS");
  } else {
    check(nev.length > 0, "NOCOPY x1 ghi được event", `ev=${nev.length}`);
  }

  console.log(`\n== KẾT QUẢ: ${pass} PASS, ${fail} FAIL ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
