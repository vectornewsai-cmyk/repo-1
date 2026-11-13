#!/usr/bin/env node
/**
 * test_round75_c3_vidstab_regs_maps.js — Phase 9 đợt 75, luồng C3.
 *
 * Đóng nợ đợt 74 §4.3: phân tích regs+maps để xác định frame lỗi chính xác.
 *
 * Kiểm chứng handler mới (segv_backtrace_preload.c, bổ sung C3: dòng
 * maps-window cho fault/RDI/RSI) bằng 4 crasher tổng hợp + 1 smoke thật:
 *
 *   fwd-full: dest < src, munmap TOÀN BỘ dest 2 MiB (plane Y 1080p)
 *             -> vòng xuôi memcpy, lỗi ở store ĐẦU TIÊN: fault = dest+0x40
 *             (RDI), RIP libc+0x1a1862, lỗ hổng >= 2.076.672 byte.
 *             Đây là bằng chứng trực tiếp BÁC SUY LUẬN A2 §3.1(2)
 *             ("fault ở vòng xuôi nghĩa là đã ghi xong phần đầu") — RIP
 *             0x1a1862 là store đầu của vòng lặp, không cho biết lần lặp
 *             thứ mấy; dest munmap toàn bộ cũng fault đúng tại đó.
 *   rev-full: dest > src, munmap toàn bộ dest
 *             -> vòng ngược, fault = dest+n-128, RIP libc+0x1a1906,
 *             lỗ >= 2.076.672 (khớp chữ ký 3 mẫu crash thật của B7).
 *   fwd-tail: dest < src, chỉ munmap TRANG CUỐI của dest
 *             -> fault = dest+0x1fa000 (đầu trang cuối, store thứ 4 của
 *             khối 256B chạm biên trang, RIP libc+0x1a1876), RDI còn IN,
 *             lỗ ĐÚNG 4.096 byte (bộ phân biệt: lỗ 4 KiB khác hẳn lỗ
 *             2 MB của trường hợp munmap toàn bộ).
 *   rev-tail: dest > src, chỉ munmap trang cuối
 *             -> fault = dest+n-128, lỗ ĐÚNG 4.096 byte, nhưng RDI=dest
 *             vẫn IN mapping (đầu chunk còn mapped) — khác rev-full.
 *   smoke:    ffmpeg thật, COPY trước vidstabtransform dưới preload mới
 *             -> sha framemd5 phải khớp ground truth d960996868d3…
 *             (preload không đổi output).
 *
 * Cách chạy: node server/render/src/test_round75_c3_vidstab_regs_maps.js
 * Kết quả in ra stdout, exit 0 khi mọi kiểm chứng pass, exit 1 nếu có fail.
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

const PRELOAD_C = path.join(__dirname, "segv_backtrace_preload.c");
const PRELOAD_SO = path.join(WORK, "segv_backtrace_preload.so");
const CRASHER_C = path.join(WORK, "c3_crasher.c");
const CRASHER_BIN = path.join(WORK, "c3_crasher");
const SRC1080 = "/home/hatch/workspace/.scratch-r60q8-OxQRDU/media/shakynoisy1080.mp4";
const TRF1080 = "/home/hatch/workspace/.scratch-r70x8/runs/detect-shaky1080-5s.trf";
const GROUND_TRUTH_SHA_PREFIX = "d960996868d3";

const N = 1920 * 1080; // 2073600
const FULL_HOLE = 507 * 4096; // 2076672: N làm tròn lên theo trang

let pass = 0;
let fail = 0;
function check(cond, label, detail) {
  if (cond) { pass++; console.log(`   ✅ ${label}`); }
  else { fail++; console.log(`   ❌ ${label}${detail ? ` — ${detail}` : ""}`); }
}

const CRASHER_SRC = `#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <stdint.h>
#define N (1920UL*1080UL)
/* Crasher tong hop cho C3: memcpy 2 MiB (co plane Y 1080p) vao vung da
   munmap (toan bo hoac chi trang cuoi), theo 2 huong vong lap cua
   __memcpy_avx_unaligned_erms. In dest/src ra stderr TRUOC khi crash
   (fflush) de harness doi chieu so hoc. */
int main(int argc, char **argv) {
  const char *mode = argc > 1 ? argv[1] : "rev-full";
  int rev = (mode[0] == 'r');
  int full = (strstr(mode, "full") != NULL);
  char *a = mmap(NULL, 4*1024*1024, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0);
  char *b = mmap(NULL, 4*1024*1024, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0);
  if (a == MAP_FAILED || b == MAP_FAILED) return 2;
  char *lo = a < b ? a : b, *hi = a < b ? b : a;
  char *dest = rev ? hi : lo;
  /* Huong xuoi can khoang cach dest-src KHONG chia het cho 0x1000:
     __memcpy_avx_unaligned_erms chon vong NGUOC khi (dest-src) & 0xf00
     == 0 (ca 2 dau deu page-aligned) — dung src lech +0x200 nhu buffer
     decoder that (RSI page offset 0x200 trong 3 mau B7) de ep vong xuoi. */
  char *src = rev ? lo : hi + 0x200;
  memset(src, 0xAB, N);
  memset(dest, 0, N);
  if (full) {
    munmap(dest, N); /* lam tron len 507 trang = 2076672 byte */
  } else {
    munmap(dest + (N & ~(4096UL - 1)), 4096); /* chi trang cuoi */
  }
  fprintf(stderr, "C3CRASHER mode=%s dest=%p src=%p n=%lu\\n", mode, (void*)dest, (void*)src, N);
  fflush(stderr);
  memcpy(dest, src, N);
  printf("SURVIVED (unexpected)\\n");
  return 0;
}
`;

function parseHex(s) { return parseInt(s, 16); }

function runCrasher(mode) {
  const r = spawnSync(CRASHER_BIN, [mode], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 60000,
    env: { ...process.env, LD_PRELOAD: PRELOAD_SO },
  });
  const stderr = (r.stderr || "").toString();
  const m = stderr.match(/C3CRASHER mode=(\S+) dest=0x([0-9a-f]+) src=0x([0-9a-f]+) n=(\d+)/);
  const regs = stderr.match(/regs: RIP=0x([0-9a-f]+) RDI=0x([0-9a-f]+) RSI=0x([0-9a-f]+) RDX=0x([0-9a-f]+) RSP=0x([0-9a-f]+) RBP=0x([0-9a-f]+)/);
  const faultM = stderr.match(/fault addr=0x([0-9a-f]+).*?si_code=1 \(MAPERR/s);
  const win = {};
  for (const mm of stderr.matchAll(/maps-window: (fault|RDI|RSI)=0x([0-9a-f]+) (IN 0x([0-9a-f]+)-0x([0-9a-f]+) (\S+)|HOLE prev_end=0x([0-9a-f]+) next_start=0x([0-9a-f]+) hole=(\d+))/g)) {
    /* Nhom: 1=name, 2=addr, 3=ca cum IN|HOLE, 4-6=IN(start,end,perms), 7-9=HOLE(prevEnd,nextStart,hole). */
    win[mm[1]] = mm[4]
      ? { kind: "IN", start: parseHex(mm[4]), end: parseHex(mm[5]), perms: mm[6] }
      : { kind: "HOLE", prevEnd: parseHex(mm[7]), nextStart: parseHex(mm[8]), hole: parseInt(mm[9], 10) };
  }
  return {
    mode, signal: r.signal, status: r.status, stderr,
    dest: m ? parseHex(m[2]) : null, src: m ? parseHex(m[3]) : null,
    rip: regs ? parseHex(regs[1]) : null,
    rdi: regs ? parseHex(regs[2]) : null,
    rsi: regs ? parseHex(regs[3]) : null,
    rdx: regs ? parseHex(regs[4]) : null,
    fault: faultM ? parseHex(faultM[1]) : null,
    win,
  };
}

function main() {
  console.log("== Đợt 75 C3 — kiểm chứng handler maps-window (4 crasher + smoke COPY) ==");
  console.log(`   WORK=${WORK}`);
  for (const p of [SRC1080, TRF1080, PRELOAD_C]) {
    if (!fs.existsSync(p)) { console.log(`   ❌ thiếu file đầu vào: ${p}`); process.exit(2); }
  }

  // 1. Biên dịch preload mới (bản C3: thêm maps-window).
  let cc = spawnSync("gcc", ["-Wall", "-Wextra", "-shared", "-fPIC", "-O2",
    "-o", PRELOAD_SO, PRELOAD_C, "-rdynamic"],
    { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch preload C3 (gcc -Wall -Wextra)", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));
  const gccWarn = (cc.stderr || "").toString().trim();
  check(gccWarn === "", "gcc không warning", gccWarn ? gccWarn.slice(0, 200) : "");
  console.log(`   📊 preload lib: ${PRELOAD_SO} (${fs.statSync(PRELOAD_SO).size} byte)`);

  // 2. Biên dịch crasher tổng hợp (-fno-builtin-memcpy để gọi đúng libc memcpy).
  writeFileEpermRetry(CRASHER_C, CRASHER_SRC);
  cc = spawnSync("gcc", ["-O2", "-fno-builtin-memcpy", "-o", CRASHER_BIN, CRASHER_C],
    { stdio: ["ignore", "pipe", "pipe"] });
  check(cc.status === 0, "biên dịch c3_crasher", cc.status === 0 ? "" : (cc.stderr || "").toString().slice(0, 300));

  // 3. fwd-full: vòng xuôi, dest munmap toàn bộ -> fault = dest+0x40 == RDI, RIP 0x1a1862.
  console.log("\n-- fwd-full (vòng xuôi, munmap toàn bộ dest) --");
  let t = runCrasher("fwd-full");
  check(t.signal === "SIGSEGV", "chết đúng SIGSEGV", `signal=${t.signal} status=${t.status}`);
  check(t.stderr.includes("(+0x1a1862)"), "RIP libc+0x1a1862 (store đầu vòng xuôi)", "");
  check(t.fault === t.dest + 0x40, "fault = dest+0x40 (store đầu tiên của vòng xuôi)",
    `fault=0x${(t.fault || 0).toString(16)} dest=0x${(t.dest || 0).toString(16)}`);
  check(t.fault === t.rdi, "fault == RDI (store đầu, chưa ghi byte nào)", `RDI=0x${(t.rdi || 0).toString(16)}`);
  check(t.rdx === t.dest + N - 0x100, "RDX = dest+n-0x100 (rdx đã thành mốc cuối vòng xuôi, KHÔNG còn là length)",
    `RDX=0x${(t.rdx || 0).toString(16)}`);
  check(t.win.fault && t.win.fault.kind === "HOLE" && t.win.fault.hole >= FULL_HOLE,
    `lỗ quanh fault >= ${FULL_HOLE} (toàn bộ chunk 507 trang)`,
    t.win.fault ? `hole=${t.win.fault.hole}` : "không có dòng maps-window fault");
  check(t.win.RDI && t.win.RDI.kind === "HOLE" && t.win.RDI.hole >= FULL_HOLE,
    "lỗ quanh RDI >= 2076672 (RDI cũng trong lỗ — dest mất toàn bộ)",
    t.win.RDI ? `hole=${t.win.RDI.hole}` : "không có dòng maps-window RDI");
  check(t.win.RSI && t.win.RSI.kind === "IN",
    "RSI còn IN mapping (nguồn không bị gì)",
    t.win.RSI ? JSON.stringify(t.win.RSI) : "không có dòng maps-window RSI");

  // 4. rev-full: vòng ngược, dest munmap toàn bộ -> fault = dest+n-128, RIP 0x1a1906.
  console.log("\n-- rev-full (vòng ngược, munmap toàn bộ dest) --");
  t = runCrasher("rev-full");
  check(t.signal === "SIGSEGV", "chết đúng SIGSEGV", `signal=${t.signal}`);
  check(t.stderr.includes("(+0x1a1906)"), "RIP libc+0x1a1906 (store đầu vòng ngược)", "");
  check(t.fault === t.dest + N - 128, "fault = dest+n-128 (khớp chữ ký 3 mẫu crash thật B7)",
    `fault-dest=${(t.fault || 0) - (t.dest || 0)}`);
  check(t.fault - t.rdi === N - 128, "fault-RDI = n-128", `fault-RDI=${(t.fault || 0) - (t.rdi || 0)}`);
  check(t.rdx === N, "RDX = n = 2073600 (vòng ngược giữ nguyên length)",
    `RDX=${t.rdx}`);
  check(t.win.fault && t.win.fault.kind === "HOLE" && t.win.fault.hole >= FULL_HOLE,
    `lỗ quanh fault >= ${FULL_HOLE}`, t.win.fault ? `hole=${t.win.fault.hole}` : "không có dòng maps-window fault");
  check(t.win.RDI && t.win.RDI.kind === "HOLE" && t.win.RDI.hole >= FULL_HOLE,
    "lỗ quanh RDI >= 2076672", t.win.RDI ? `hole=${t.win.RDI.hole}` : "không có dòng maps-window RDI");
  check(t.win.RSI && t.win.RSI.kind === "IN", "RSI còn IN mapping",
    t.win.RSI ? JSON.stringify(t.win.RSI) : "không có dòng maps-window RSI");

  // 5. fwd-tail: vòng xuôi, chỉ mất trang cuối -> khối 256B cuối cùng của
  // vòng lặp (rdi=dest+0x1f9f40) chạm trang cuối ở store thứ 4
  // (libc+0x1a1876, 0xc0(%rdi)): fault = dest+0x1fa000 (đầu trang cuối),
  // RDI còn IN mapping, lỗ ĐÚNG 4 KiB.
  console.log("\n-- fwd-tail (vòng xuôi, chỉ munmap trang cuối dest) --");
  t = runCrasher("fwd-tail");
  check(t.signal === "SIGSEGV", "chết đúng SIGSEGV", `signal=${t.signal}`);
  check(t.stderr.includes("(+0x1a1876)"), "RIP libc+0x1a1876 (store thứ 4 của khối 256B chạm trang cuối)", "");
  check(t.fault === t.dest + 0x1fa000, "fault = dest+0x1fa000 (đầu trang cuối)",
    `fault-dest=0x${((t.fault || 0) - (t.dest || 0)).toString(16)}`);
  check(t.win.fault && t.win.fault.kind === "HOLE" && t.win.fault.hole === 4096,
    "lỗ quanh fault ĐÚNG 4096 (chỉ 1 trang — phân biệt được với munmap toàn bộ)",
    t.win.fault ? `hole=${t.win.fault.hole}` : "không có dòng maps-window fault");
  check(t.win.RDI && t.win.RDI.kind === "IN",
    "RDI còn IN mapping (rdi=dest+0x1f9f40, đầu chunk vẫn mapped — khác fwd-full)",
    t.win.RDI ? JSON.stringify(t.win.RDI) : "không có dòng maps-window RDI");

  // 6. rev-tail: vòng ngược, chỉ mất trang cuối -> fault = dest+n-128, lỗ 4 KiB, RDI còn IN.
  console.log("\n-- rev-tail (vòng ngược, chỉ munmap trang cuối dest) --");
  t = runCrasher("rev-tail");
  check(t.signal === "SIGSEGV", "chết đúng SIGSEGV", `signal=${t.signal}`);
  check(t.stderr.includes("(+0x1a1906)"), "RIP libc+0x1a1906", "");
  check(t.fault === t.dest + N - 128, "fault = dest+n-128 (giống hệt rev-full về fault!)",
    `fault-dest=${(t.fault || 0) - (t.dest || 0)}`);
  check(t.win.fault && t.win.fault.kind === "HOLE" && t.win.fault.hole === 4096,
    "lỗ quanh fault ĐÚNG 4096 (chỉ 1 trang)",
    t.win.fault ? `hole=${t.win.fault.hole}` : "không có dòng maps-window fault");
  check(t.win.RDI && t.win.RDI.kind === "IN",
    "RDI còn IN mapping (đầu chunk vẫn mapped — khác rev-full)",
    t.win.RDI ? JSON.stringify(t.win.RDI) : "không có dòng maps-window RDI");
  check(t.win.RSI && t.win.RSI.kind === "IN", "RSI còn IN mapping",
    t.win.RSI ? JSON.stringify(t.win.RSI) : "không có dòng maps-window RSI");

  // 7. Smoke COPY thật dưới preload mới.
  console.log("\n-- smoke COPY (ffmpeg thật, preload mới) --");
  const out = path.join(WORK, "smoke-copy.framemd5");
  const vf = `trim=start=0:end=5,setpts=PTS-STARTPTS,copy,vidstabtransform=input='${TRF1080}':smoothing=10:optalgo=gauss`;
  const r = spawnSync("ffmpeg", ["-threads", "1", "-v", "error", "-i", SRC1080,
    "-vf", vf, "-an", "-f", "framemd5", "-y", out], {
    stdio: ["ignore", "pipe", "pipe"], timeout: 600000,
    env: { ...process.env, LD_PRELOAD: PRELOAD_SO },
  });
  const ok = r.status === 0 && fs.existsSync(out) && fs.statSync(out).size > 0;
  const sha = ok ? crypto.createHash("sha256").update(fs.readFileSync(out)).digest("hex").slice(0, 12) : null;
  check(ok && sha === GROUND_TRUTH_SHA_PREFIX,
    `COPY smoke sha=${sha} khớp ground truth ${GROUND_TRUTH_SHA_PREFIX}…`,
    `status=${r.status} sha=${sha}`);

  console.log(`\n== KẾT QUẢ: ${pass} PASS, ${fail} FAIL ==`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
