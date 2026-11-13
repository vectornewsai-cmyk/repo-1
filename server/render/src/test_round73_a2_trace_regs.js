#!/usr/bin/env node
/**
 * test_round73_a2_trace_regs.js — Phase 9 đợt 73, luồng A2.
 *
 * Kiểm chứng bản cải tiến của segv_backtrace_preload.c (đợt 73 A2):
 * handler giờ in thêm regs (RIP/RDI/RSI/RDX/RSP/RBP) + dòng tra
 * /proc/self/maps, để lần crash vidstab sau phân biệt được đích (RDI)
 * hay nguồn (RSI) bị hỏng và buffer còn mapped không.
 *
 * Cách kiểm chứng (không bịa số — mọi assert đều đo thật):
 *  1. Biên dịch .so mới từ segv_backtrace_preload.c (gcc, -Wall: phải
 *     không lỗi; cảnh báo nào cũng in ra, không giấu).
 *  2. Crasher tổng hợp (C, biên dịch tại chỗ): mmap 2 MiB rồi munmap,
 *     rồi memcpy vào/vào từ vùng đã munmap:
 *       - mode "store": memcpy(dead, live, 2MiB) → lỗi GHI, fault addr
 *         nằm trong [dead, dead+n) — cụ thể là dead+n-0x80 (store cuối
 *         vùng đích của memcpy ERMS khi copy ngược, dest > src — đã
 *         xác minh bằng disassembly libc), maps phải báo
 *         "NOT in any mapping", si_code=MAPERR;
 *       - mode "load": memcpy(live, dead, 4KiB) → lỗi ĐỌC, fault addr
 *         phải == RSI (đầu vùng nguồn) và nằm trong [dead, dead+n),
 *         maps "NOT in any mapping".
 *     Cả hai mode đều phải chết đúng bởi SIGSEGV (status=null,
 *     signal=SIGSEGV) — handler không biến crash thành exit thường.
 *  3. COPY smoke: ffmpeg thật, đúng cấu hình Z6 (clip shakynoisy1080 +
 *     .trf X8, -threads 1) dưới preload MỚI → sha framemd5 phải khớp
 *     ground truth d960996868d3… (preload mới không đổi output).
 *
 * Cách chạy: node server/render/src/test_round73_a2_trace_regs.js
 * Kết quả: in PASS/FAIL từng assert + thoát 0 khi tất cả PASS.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME;
const WORK = process.env.A2_WORK || path.join(HOME, "workspace", ".scratch-r73a2", "regs");
fs.mkdirSync(WORK, { recursive: true });

const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const PRELOAD_C = path.join(__dirname, "segv_backtrace_preload.c");
const PRELOAD_SO = path.join(WORK, "segv_backtrace_preload.so");
const CRASHER_C = path.join(WORK, "crasher.c");
const CRASHER_BIN = path.join(WORK, "crasher");

const VF_COPY = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
const GROUND_TRUTH_SHA_PREFIX = "d960996868d3";

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`   ✅ PASS ${name}`); }
  else { fail++; console.log(`   ❌ FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

const CRASHER_SRC = `#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
/* Crasher tổng hợp cho A2: memcpy vào/ra vùng đã munmap.
   In địa chỉ dead/live ra stderr TRƯỚC khi crash để test đối chiếu. */
int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "usage: crasher store|load <bytes>\\n"); return 2; }
  size_t n = (size_t)strtoul(argv[2], NULL, 10);
  char *dead = mmap(NULL, n, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
  char *live = mmap(NULL, n, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
  if (dead == MAP_FAILED || live == MAP_FAILED) { perror("mmap"); return 2; }
  memset(live, 0x41, n);
  fprintf(stderr, "[crasher] mode=%s n=%zu dead=%p live=%p\\n", argv[1], n, (void *)dead, (void *)live);
  fflush(stderr);
  munmap(dead, n);
  if (strcmp(argv[1], "store") == 0) memcpy(dead, live, n);  /* lỗi ghi: RDI==dead */
  else memcpy(live, dead, n);                                /* lỗi đọc: RSI==dead */
  fprintf(stderr, "[crasher] survived (unexpected)\\n");
  return 0;
}
`;

function main() {
  console.log("== Đợt 73 A2 — kiểm chứng preload handler (regs + maps) ==");
  console.log(`   WORK=${WORK}`);

  // 1. Biên dịch .so mới (kèm -Wall để lộ cảnh báo).
  const cc = spawnSync("gcc", ["-shared", "-fPIC", "-O2", "-Wall", "-Wextra",
    "-o", PRELOAD_SO, PRELOAD_C, "-rdynamic"],
    { stdio: ["ignore", "pipe", "pipe"] });
  const ccErr = (cc.stderr || "").toString();
  check("biên dịch preload .so mới (gcc exit 0)", cc.status === 0, ccErr.slice(-300));
  if (cc.status !== 0) { console.log(ccErr); process.exit(2); }
  if (ccErr.trim()) console.log(`   ⚠️ gcc warnings:\n${ccErr}`);
  else console.log("   📊 gcc: không có warning");
  console.log(`   📊 preload .so mới: ${PRELOAD_SO} (${fs.statSync(PRELOAD_SO).size} byte)`);

  // 2. Crasher tổng hợp.
  writeFileEpermRetry(CRASHER_C, CRASHER_SRC);
  const cc2 = spawnSync("gcc", ["-O2", "-o", CRASHER_BIN, CRASHER_C],
    { stdio: ["ignore", "pipe", "pipe"] });
  check("biên dịch crasher tổng hợp", cc2.status === 0, (cc2.stderr || "").toString().slice(-200));
  if (cc2.status !== 0) process.exit(2);

  function runCrasher(mode, n) {
    const r = spawnSync(CRASHER_BIN, [mode, String(n)], {
      stdio: ["ignore", "pipe", "pipe"], timeout: 60000,
      env: { ...process.env, LD_PRELOAD: PRELOAD_SO },
    });
    const err = (r.stderr || "").toString();
    const m = err.match(/\[crasher\] mode=(\S+) n=(\d+) dead=(0x[0-9a-f]+) live=(0x[0-9a-f]+)/);
    const dead = m ? parseInt(m[3], 16) : null;
    const faultM = err.match(/fault addr=0x([0-9a-f]+)/);
    const fault = faultM ? parseInt(faultM[1], 16) : null;
    return { r, err, dead, fault, n };
  }

  // 2a. mode store, 2 MiB (đúng cỡ plane Y 1080p, đúng pattern lỗi ghi của Z6).
  const st = runCrasher("store", 2 << 20);
  console.log("   --- store 2MiB ---");
  for (const l of st.err.split("\n").filter((x) => x.includes("[segv_backtrace]"))) console.log(`        ${l}`);
  check("store: chết đúng SIGSEGV (status=null, signal=SIGSEGV)",
    st.r.status === null && st.r.signal === "SIGSEGV", `status=${st.r.status} signal=${st.r.signal}`);
  check("store: có dòng regs RIP/RDI/RSI", /regs: RIP=0x[0-9a-f]+ RDI=0x[0-9a-f]+ RSI=0x[0-9a-f]+/.test(st.err));
  check("store: si_code=MAPERR (địa chỉ không mapped)", /si_code=1 \(MAPERR/.test(st.err));
  check("store: có dòng offsets fault-RDI/fault-RSI", /offsets: fault-RDI=/.test(st.err));
  check("store: fault addr nằm trong [dead, dead+n) (store cuối vùng đích — memcpy ERMS copy ngược)",
    st.dead !== null && st.fault !== null && st.fault >= st.dead && st.fault < st.dead + st.n,
    `dead=${st.dead?.toString(16)} fault=${st.fault?.toString(16)} n=${st.n}`);
  check("store: fault-RDI = +n-0x80 (đúng offset store cuối của ERMS)",
    /fault-RDI=\+2097024 \(0x1fff80\)/.test(st.err),
    st.err.match(/offsets:.*/)?.[0]);
  check("store: maps báo NOT in any mapping", /NOT in any mapping/.test(st.err));
  check("store: backtrace cũ vẫn còn (định dạng không vỡ)",
    /\+0x[0-9a-f]+\)\[/.test(st.err));

  // 2b. mode load, 4 KiB (lỗi đọc).
  const ld = runCrasher("load", 4096);
  console.log("   --- load 4KiB ---");
  for (const l of ld.err.split("\n").filter((x) => x.includes("[segv_backtrace]"))) console.log(`        ${l}`);
  check("load: chết đúng SIGSEGV (status=null, signal=SIGSEGV)",
    ld.r.status === null && ld.r.signal === "SIGSEGV", `status=${ld.r.status} signal=${ld.r.signal}`);
  check("load: có dòng regs RIP/RDI/RSI", /regs: RIP=0x[0-9a-f]+ RDI=0x[0-9a-f]+ RSI=0x[0-9a-f]+/.test(ld.err));
  check("load: si_code=MAPERR (địa chỉ không mapped)", /si_code=1 \(MAPERR/.test(ld.err));
  check("load: fault addr == RSI (đọc từ nguồn)",
    /fault addr=0x[0-9a-f]+ == RSI/.test(ld.err), ld.err.match(/fault addr=0x[0-9a-f]+.*/)?.[0]);
  check("load: fault addr nằm trong [dead, dead+n) (vùng nguồn đã munmap)",
    ld.dead !== null && ld.fault !== null && ld.fault >= ld.dead && ld.fault < ld.dead + ld.n,
    `dead=${ld.dead?.toString(16)} fault=${ld.fault?.toString(16)} n=${ld.n}`);
  check("load: maps báo NOT in any mapping", /NOT in any mapping/.test(ld.err));

  // 3. COPY smoke bằng ffmpeg thật dưới preload mới.
  for (const p of [SRC1080, TRF1080]) {
    if (!fs.existsSync(p)) { console.log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }
  const out = path.join(WORK, "copy-smoke.framemd5");
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", VF_COPY, "-an", "-f", "framemd5", "-y", out], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: PRELOAD_SO },
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const sha = fs.existsSync(out) && fs.statSync(out).size > 0
    ? crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex") : null;
  console.log(`   📊 COPY smoke dưới preload mới (${secs}s): status=${r.status} signal=${r.signal} sha=${sha?.slice(0, 12)}…`);
  check("COPY smoke: exit 0, không signal", r.status === 0 && r.signal === null,
    `status=${r.status} signal=${r.signal} stderr=${(r.stderr || "").toString().slice(-200)}`);
  check("COPY smoke: sha khớp ground truth (preload mới không đổi output)",
    !!sha && sha.startsWith(GROUND_TRUTH_SHA_PREFIX), `sha=${sha?.slice(0, 12)}`);

  console.log(`\n== A2 TRACE-REGS KẾT LUẬN: ${pass} PASS, ${fail} FAIL ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
