#!/usr/bin/env node
/**
 * test_round76_d3_free_track_v2.js — Phase 9 đợt 76, luồng D3.
 *
 * Kiểm chứng free-tracker v2 LOCK-FREE (free_track_v2_preload.c):
 *   1. Biên dịch v2 (gcc -Wall -Wextra, không warning) + segv handler C3.
 *   2. Unit đơn luồng: malloc/memalign/free đúng cỡ 2073600 -> log đủ
 *      4 event đúng địa chỉ; malloc(1000) không log; chưa armed (không
 *      có dòng ARMED — chương trình unit không có vsTransformPrepare).
 *   3. Unit đa luồng (4 thread): mỗi thread 20.000 malloc/free(64) xen
 *      kẽ 50 memalign/free đúng cỡ -> log phải có đúng 200 ALLOC +
 *      200 FREE, mọi FREE đều khớp 1 ALLOC trước đó, không dòng rác/
 *      xen kẽ (mỗi event 1 write() duy nhất), header đầu tiên là ALLOC.
 *   4. Bench đường free nóng: 4 thread x 500.000 malloc/free(64),
 *      so sánh thời gian trung vị (3 lần) giữa: không preload / v1 /
 *      v2 (bảng rỗng) / v2 (1 chunk đúng cỡ đang live). Kỳ vọng: v2 ~=
 *      native (chỉ atomic load trên đường probe), v2 rõ ràng nhanh
 *      hơn v1 (mutex mọi free). Lưu ý: v2 KHÔNG còn cổng arming trên
 *      đường free (đã gỡ sau khi unit bắt được lỗi bỏ sót FREE —
 *      xem header free_track_v2_preload.c §2), nên cả 2 cấu hình v2
 *      đều đi cùng đường probe lock-free, chỉ khác số chunk live
 *      trong bảng.
 *   5. COPY smoke ffmpeg thật dưới v2+segv -> sha ground truth; log
 *      phải có cả 2 site ALLOC (+0x17b td->src và +0x144 destbuf) +
 *      dòng ARMED (chứng tỏ v2 không miss log khi td->src thật sự
 *      được cấp — kiểm chứng tương đương C3 §5.3 cho v1).
 *   6. NOCOPY x1 dưới v2+segv -> báo cáo armed? + số ALLOC/FREE
 *      (không assert armed — chỉ ghi nhận).
 *
 * Cách chạy: node server/render/src/test_round76_d3_free_track_v2.js
 * Scratch: ~/workspace/.scratch-r76d3/runs (env D3_WORK).
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.D3_WORK || path.join(HOME, "workspace", ".scratch-r76d3", "runs");
fs.mkdirSync(WORK, { recursive: true });

const V2_C = path.join(__dirname, "free_track_v2_preload.c");
const V2_SO = path.join(WORK, "free_track_v2_preload.so");
const V1_SO = path.join(HOME, "workspace", ".scratch-r75c3", "runs", "free_track_preload.so");
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
function median(a) {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
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
  free(c); /* malloc(1000) không đúng cỡ TRACK_SIZE nên không log */
  free(a);
  free(b);
  printf("unit done a=%p b=%p\\n", a, b);
  return 0;
}
`;

const MT_SRC = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#define NTHREAD 4
#define NTRACK 50
static void *worker(void *arg) {
  (void)arg;
  for (int i = 0; i < 20000; i++) {
    void *p = malloc(64);
    if (!p) abort();
    memset(p, 1, 64);
    free(p);
  }
  for (int i = 0; i < NTRACK; i++) {
    void *b = NULL;
    posix_memalign(&b, 64, 1920*1080);
    memset(b, 2, 1920*1080);
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

const BENCH_SRC = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <time.h>
#define NTHREAD 4
static long iters;
static void *worker(void *arg) {
  (void)arg;
  for (long i = 0; i < iters; i++) {
    void *p = malloc(64);
    if (!p) abort();
    memset(p, 0, 64);
    free(p);
  }
  return NULL;
}
int main(int argc, char **argv) {
  iters = atol(argv[1]);
  void *hold = NULL;
  if (argc > 2 && strcmp(argv[2], "arm") == 0) {
    posix_memalign(&hold, 64, 1920*1080);
    memset(hold, 0, 1920*1080);
  }
  pthread_t th[NTHREAD];
  struct timespec t0, t1;
  clock_gettime(CLOCK_MONOTONIC, &t0);
  for (int i = 0; i < NTHREAD; i++) pthread_create(&th[i], NULL, worker, NULL);
  for (int i = 0; i < NTHREAD; i++) pthread_join(th[i], NULL);
  clock_gettime(CLOCK_MONOTONIC, &t1);
  if (hold) free(hold);
  double ms = (t1.tv_sec - t0.tv_sec) * 1e3 + (t1.tv_nsec - t0.tv_nsec) / 1e6;
  printf("bench ms=%.1f\\n", ms);
  return 0;
}
`;

function parseV2Log(logText) {
  const events = [];
  const lines = logText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\[free_track_v2\] seq=(\d+) (ALLOC-malloc|ALLOC-memalign|FREE) addr=(0x[0-9a-f]+) size=(\d+) tid=(\d+)/);
    if (!m) continue;
    const bt = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith("[free_track_v2]")) break;
      if (lines[j].trim()) bt.push(lines[j].trim());
    }
    events.push({ seq: parseInt(m[1], 10), kind: m[2], addr: m[3], size: parseInt(m[4], 10), tid: m[5], bt });
  }
  const armed = /\[free_track_v2\] ARMED addr=(0x[0-9a-f]+)/.exec(logText);
  return { events, armedAddr: armed ? armed[1] : null };
}

function main() {
  console.log("== Đợt 76 D3 — kiểm chứng free_track_v2 (lock-free) ==");
  console.log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, V2_C, SEGV_C, V1_SO]) {
    if (!fs.existsSync(p)) { console.log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }

  // 1. Biên dịch.
  let cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", V2_SO, V2_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch free_track_v2_preload (gcc -Wall -Wextra)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  check((cc.stderr || "").toString().trim() === "", "gcc v2 không warning", (cc.stderr || "").toString().slice(0, 200));
  cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", SEGV_SO, SEGV_C, "-rdynamic"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch segv_backtrace_preload (bản C3)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  const v2CodeLines = fs.readFileSync(V2_C, "utf8").split("\n")
    .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//"));
  check(!v2CodeLines.join("\n").includes("pthread_mutex"),
    "v2 không chứa pthread_mutex trong code (không lock)", "còn mutex trong code!");
  const nmV2 = spawnSync("nm", ["-D", V2_SO], { stdio: ["ignore", "pipe", "pipe"] });
  const nmV2Out = (nmV2.stdout || "").toString();
  check(!/pthread_mutex/.test(nmV2Out),
    "v2 .so không link symbol pthread_mutex_*", nmV2Out.slice(0, 200));

  // 2. Unit đơn luồng.
  const unitC = path.join(WORK, "d3_free_unit.c");
  const unitBin = path.join(WORK, "d3_free_unit");
  const unitLog = path.join(WORK, "free-track-v2-unit.log");
  writeFileEpermRetry(unitC, UNIT_SRC);
  cc = spawnSync("gcc", ["-O2", "-o", unitBin, unitC], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch d3_free_unit", "");
  try { fs.unlinkSync(unitLog); } catch { /* chưa có */ }
  const u = spawnSync(unitBin, [], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 60000,
    env: { ...process.env, LD_PRELOAD: V2_SO, FREE_TRACK_LOG: unitLog },
  });
  check(u.status === 0, "unit chạy xong exit 0", `status=${u.status}`);
  const unitLogText = fs.existsSync(unitLog) ? fs.readFileSync(unitLog, "utf8") : "";
  const { events: uev, armedAddr: uarmed } = parseV2Log(unitLogText);
  const uaddr = (u.stdout || "").toString().match(/a=(0x[0-9a-f]+) b=(0x[0-9a-f]+)/);
  const aAddr = uaddr ? uaddr[1] : null, bAddr = uaddr ? uaddr[2] : null;
  check(uev.some((e) => e.kind === "ALLOC-malloc" && e.addr === aAddr), "log có ALLOC-malloc đúng địa chỉ a", `events=${uev.map((e) => e.kind + "@" + e.addr).join(",")}`);
  check(uev.some((e) => e.kind === "FREE" && e.addr === aAddr), "log có FREE đúng địa chỉ a", "");
  check(uev.some((e) => e.kind === "ALLOC-memalign" && e.addr === bAddr), "log có ALLOC-memalign đúng địa chỉ b", "");
  check(uev.some((e) => e.kind === "FREE" && e.addr === bAddr), "log có FREE đúng địa chỉ b", "");
  check(uev.length === 4, "chỉ log đúng 4 event (malloc 1000 không log)", `got ${uev.length}`);
  check(uarmed === null, "unit không có dòng ARMED (không có vsTransformPrepare)", `armed=${uarmed}`);
  check(uev[0] && uev[0].kind.startsWith("ALLOC"), "header đầu tiên là ALLOC (FREE không thể đứng trước ALLOC của nó)", "");

  // 3. Unit đa luồng: tính toàn vẹn log dưới ghi đồng thời.
  const mtC = path.join(WORK, "d3_mt_unit.c");
  const mtBin = path.join(WORK, "d3_mt_unit");
  const mtLog = path.join(WORK, "free-track-v2-mt.log");
  writeFileEpermRetry(mtC, MT_SRC);
  cc = spawnSync("gcc", ["-O2", "-o", mtBin, mtC, "-pthread"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch d3_mt_unit", "");
  try { fs.unlinkSync(mtLog); } catch { /* chưa có */ }
  const mt = spawnSync(mtBin, [], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 120000,
    env: { ...process.env, LD_PRELOAD: V2_SO, FREE_TRACK_LOG: mtLog },
  });
  check(mt.status === 0, "mt unit chạy xong exit 0", `status=${mt.status} stderr=${(mt.stderr || "").toString().slice(0, 200)}`);
  const mtText = fs.existsSync(mtLog) ? fs.readFileSync(mtLog, "utf8") : "";
  const { events: mev } = parseV2Log(mtText);
  const mtAlloc = mev.filter((e) => e.kind.startsWith("ALLOC"));
  const mtFree = mev.filter((e) => e.kind === "FREE");
  check(mtAlloc.length === 200 && mtFree.length === 200,
    "mt: đúng 200 ALLOC + 200 FREE đúng cỡ", `alloc=${mtAlloc.length} free=${mtFree.length}`);
  const allocAddrs = new Map();
  let orderOk = true;
  for (const e of mev) {
    if (e.kind.startsWith("ALLOC")) allocAddrs.set(e.addr, (allocAddrs.get(e.addr) || 0) + 1);
    else if (allocAddrs.get(e.addr) > 0) allocAddrs.set(e.addr, allocAddrs.get(e.addr) - 1);
    else orderOk = false;
  }
  check(orderOk && [...allocAddrs.values()].every((v) => v === 0),
    "mt: mọi FREE đều khớp 1 ALLOC trước đó, không thừa/thiếu", "");
  const nonPrintable = mtText.split("\n").filter((l) => /[^\x20-\x7e]/.test(l));
  check(nonPrintable.length === 0, "mt: không dòng rác/non-printable (không xen kẽ write)", `dòng rác: ${nonPrintable.length}`);
  const seqs = mev.map((e) => e.seq);
  check(new Set(seqs).size === seqs.length && seqs.length > 0, "mt: seq các event không trùng (ring ghi đủ)", `events=${seqs.length} unique=${new Set(seqs).size}`);

  // 4. Bench đường free nóng: native vs v1 vs v2-unarmed vs v2-armed.
  console.log("\n-- bench free nóng: 4 thread x 500k malloc/free(64) (trung vị 3 lần) --");
  const benchC = path.join(WORK, "d3_bench.c");
  const benchBin = path.join(WORK, "d3_bench");
  writeFileEpermRetry(benchC, BENCH_SRC);
  cc = spawnSync("gcc", ["-O2", "-o", benchBin, benchC, "-pthread"], { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch d3_bench", "");
  function benchRun(preload, armArg) {
    const env = { ...process.env };
    if (preload) env.LD_PRELOAD = preload;
    else delete env.LD_PRELOAD;
    env.FREE_TRACK_LOG = path.join(WORK, "free-track-v2-bench.log");
    const args = ["500000"];
    if (armArg) args.push("arm");
    const r = spawnSync(benchBin, args, { stdio: ["ignore", "pipe", "pipe"], timeout: 300000, env });
    const m = (r.stdout || "").toString().match(/ms=([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  }
  const bench = {};
  const benchLogF = path.join(WORK, "free-track-v2-bench.log");
  for (const [name, preload, arm] of [
    ["native", null, false],
    ["v1", V1_SO, false],
    ["v2-bang-rong", V2_SO, false],
    ["v2-1-chunk-live", V2_SO, true],
  ]) {
    try { fs.unlinkSync(benchLogF); } catch { /* chưa có */ }
    const runs = [];
    for (let i = 0; i < 5; i++) {
      const ms = benchRun(preload, arm);
      if (ms !== null) runs.push(ms);
    }
    bench[name] = { runs, med: runs.length ? median(runs) : null };
    console.log(`   📊 bench ${name}: ${runs.map((x) => x.toFixed(0)).join(", ")} ms -> trung vị ${bench[name].med !== null ? bench[name].med.toFixed(1) : "?"} ms`);
    // Bài học lần chạy lỗi trước: .so biên dịch lỗi -> LD_PRELOAD trỏ
    // file không tồn tại nhưng tiến trình vẫn chạy (không tracker) và
    // cho số bench "native" giả. Kiểm tra marker start trong log để
    // chắc chắn preload thật sự được load.
    if (preload === V1_SO || preload === V2_SO) {
      const blog = fs.existsSync(benchLogF) ? fs.readFileSync(benchLogF, "utf8") : "";
      const marker = preload === V1_SO ? "[free_track] === start" : "[free_track_v2] === start";
      check(blog.includes(marker), `bench ${name}: preload thật sự được load (có marker start trong log)`, "KHÔNG có marker — số bench vô nghĩa!");
    }
  }
  const nat = bench.native.med, v1m = bench.v1.med, v2u = bench["v2-bang-rong"].med, v2a = bench["v2-1-chunk-live"].med;
  if (nat && v2u) check(v2u < 3 * nat, `v2 (bảng rỗng) trong 3x native (probe lock-free rẻ)`, `v2=${v2u} native=${nat}`);
  if (nat && v2a) check(v2a < 3 * nat, `v2 (1 chunk live) trong 3x native (probe lock-free rẻ)`, `v2=${v2a} native=${nat}`);
  if (v1m && v2u) check(v2u < v1m, `v2 (bảng rỗng) nhanh hơn v1 trên bench đa luồng`, `v2=${v2u} v1=${v1m}`);
  if (v1m && v2a) check(v2a < v1m, `v2 (1 chunk live) nhanh hơn v1 trên bench đa luồng`, `v2=${v2a} v1=${v1m}`);
  writeFileEpermRetry(path.join(WORK, "bench-v2-vs-v1.json"), JSON.stringify(bench, null, 1));

  // 5. COPY smoke dưới v2+segv.
  console.log("\n-- smoke COPY (ffmpeg thật, v2+segv) --");
  const bothPreloads = `${V2_SO}:${SEGV_SO}`;
  const copyLog = path.join(WORK, "free-track-v2-copy.log");
  try { fs.unlinkSync(copyLog); } catch { /* chưa có */ }
  const out = path.join(WORK, "smoke-copy-v2.framemd5");
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
  const { events: cev, armedAddr: carmed } = parseV2Log(copyText);
  const hasSrc = cev.some((e) => e.bt.some((l) => l.includes("vsTransformPrepare+0x17b")));
  const hasDest = cev.some((e) => e.bt.some((l) => l.includes("vsTransformPrepare+0x144")));
  check(hasSrc, "COPY log có ALLOC td->src (+0x17b) — v2 không miss log", "");
  check(hasDest, "COPY log có ALLOC destbuf (+0x144)", "");
  check(carmed !== null, `COPY log có dòng ARMED (addr=${carmed})`, "không có ARMED");
  check(cev.filter((e) => e.kind === "FREE").length === cev.filter((e) => e.kind.startsWith("ALLOC")).length,
    "COPY: số FREE == số ALLOC (teardown đủ)", `alloc=${cev.filter((e) => e.kind.startsWith("ALLOC")).length} free=${cev.filter((e) => e.kind === "FREE").length}`);

  // 6. NOCOPY x1 dưới v2+segv — ghi nhận (không assert armed).
  console.log("\n-- NOCOPY x1 (ffmpeg thật, v2+segv) — ghi nhận --");
  const ncLog = path.join(WORK, "free-track-v2-nocopy.log");
  try { fs.unlinkSync(ncLog); } catch { /* chưa có */ }
  const out2 = path.join(WORK, "free-track-v2-nocopy.framemd5");
  const vfNocopy = `trim=start=0:end=5,setpts=PTS-STARTPTS,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vfNocopy, "-an", "-f", "framemd5", "-y", out2], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: bothPreloads, FREE_TRACK_LOG: ncLog },
  });
  const crashed = r.signal === "SIGSEGV" || r.status !== 0;
  const ncText = fs.existsSync(ncLog) ? fs.readFileSync(ncLog, "utf8") : "";
  const { events: nev, armedAddr: narmed } = parseV2Log(ncText);
  console.log(`   📊 NOCOPY x1: status=${r.status} signal=${r.signal} crash=${crashed} sha=${fs.existsSync(out2) && fs.statSync(out2).size > 0 ? crypto.createHash("sha256").update(fs.readFileSync(out2)).digest("hex").slice(0, 12) : null}`);
  console.log(`   📊 NOCOPY x1 log: ${nev.length} event, armed=${narmed !== null ? narmed : "KHÔNG"} (td->src ${narmed !== null ? "ĐƯỢC cấp — race armed" : "không được cấp"})`);
  check(nev.length > 0, "NOCOPY x1 ghi được event đúng cỡ", `ev=${nev.length}`);

  console.log(`\n== KẾT QUẢ: ${pass} PASS, ${fail} FAIL ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
