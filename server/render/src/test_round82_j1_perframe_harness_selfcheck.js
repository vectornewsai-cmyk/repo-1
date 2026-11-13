#!/usr/bin/env node
/**
 * test_round82_j1_perframe_harness_selfcheck.js — Phase 9 đợt 82, luồng J1.
 *
 * Tự kiểm tra NHỎ cho harness per-frame vidstab
 * (test_round82_j1_vidstab_perframe_harness.js) — chạy KHÔNG cần ffmpeg,
 * chỉ dùng fixture tổng hợp trong /tmp:
 *
 *   1. parseFramemd5: đếm đúng số frame, bỏ dòng rác.
 *   2. parseShowinfo: parse đúng n/plane/mean/stdev, kể cả khi status-line
 *      xen giữa `type:P` và `checksum:` (nhiễu đã biết, I1 §5.5).
 *   2b. parseShowinfo: status-line xen GIỮA stdev (L4 §2.3, backport đợt 85
 *      M3) — không gán nhầm mean/stdev frame n+1 cho frame n, không mất
 *      entry frame n+1.
 *   3. poisonLikeTest: frame Y-only + meanY 164 → poisonFrac ~0.99;
 *      frame lệch cả 3 plane + meanY ~88 → null; frame Y-only nhưng
 *      meanY 90 → null.
 *   4. poisonStrictTest: Y == solid-poison 720p + mean 165 + stdev<2 → true.
 *   5. permTestExact: [88]*10 vs [0]*10 → p = 2/C(20,10) = 1,08e-5
 *      (sàn — đúng như I1/H1); [0]*10 vs [0]*10 → p = 1.
 *   6. fisher2: bảng [[0,1500],[882,618]] → p < 1e-300 (tràn dưới double
 *      như I1 in ra 0); bảng [[0,10],[0,10]] → p = 1.
 *   7. analyzeArm end-to-end trên WORK fixture: GT 5 frame + 2 run
 *      (1 run sạch == GT, 1 run lệch 2 frame trong đó 1 poison-like) —
 *      assert totalDiv, zone, poisonLike, gtStable.
 *   8. ZONE: 0→mid, 139→mid, 140→drain, 149→drain, 150→pad.
 *
 * SÓNG EPERM (10/11 ~15:48 UTC trở đi): write file trả EPERM theo đợt
 * (ghi 0 byte, kiểu sóng 09/11) — các check 1/2/7 từng fail 3/3 chỉ vì
 * ghi fixture, không phải lỗi harness. Fixture write ở đây có retry
 * (tối đa 30 lần × 2 s) để test không fail oan vì sóng; phần assert
 * logic không đổi.
 *
 * Cách chạy: node server/render/src/test_round82_j1_perframe_harness_selfcheck.js
 * Thoát 0 khi mọi assert PASS, 1 khi có assert FAIL. In từng check PASS/FAIL.
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const os = require("os");
const path = require("path");
const assert = require("assert");

const H = require("./test_round82_j1_vidstab_perframe_harness.js");

// Ghi fixture bền vững trước sóng EPERM (như harness writeRetry):
// retry tối đa 30 lần × 2 s; hết retry thì ném lại (không giấu lỗi thật).
// Thêm settle 3 s trước mỗi lần ghi: sóng EPERM dường như là giới hạn
// tốc độ tạo file (burst nhiều write trong <1 s sẽ kích hoạt EPERM kéo
// dài) — giãn write ra thì không kích hoạt (đo 24/24 OK với 1 write/5 s).
function settle() { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000); }
function writeFileRetry(p, data) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 30; attempt++) {
    try { settle(); writeFileEpermRetry(p, data); return; }
    catch (e) {
      lastErr = e;
      if (attempt < 30) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    }
  }
  throw lastErr;
}
function mkdtempRetry(prefix) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 30; attempt++) {
    try { settle(); return fs.mkdtempSync(prefix); }
    catch (e) {
      lastErr = e;
      if (attempt < 30) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    }
  }
  throw lastErr;
}
// Dọn fixture: best-effort (sóng EPERM không được làm fail check).
function rmBestEffort(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* bỏ qua */ } }

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`   ✅ PASS ${name}`); }
  catch (e) { fail++; console.log(`   ❌ FAIL ${name}: ${e.message}`); }
}

// ---- fixture helpers ----
function md5line(md5) {
  return `0,         64,         64,        1,  3110400, ${md5}`;
}
function showinfoLine(n, yck, uck, vck, meanY, meanU, meanV, stdevY, stdevU, stdevV, ck) {
  return `[Parsed_showinfo_0 @ 0x123] n:   ${n} pts:   ${n * 1000} pts_time:0.033333 duration:    1000 duration_time:0.033333 fmt:yuv420p cl:limited sar:1/1 s:1280x720 i:P iskey:0 type:P checksum:${ck || ("C" + String(n).padStart(7, "0"))} plane_checksum:[${yck} ${uck} ${vck}] mean:[${meanY} ${meanU} ${meanV}] stdev:[${stdevY} ${stdevU} ${stdevV}]`;
}

const GT_MD5 = ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "cccccccccccccccccccccccccccccccc", "dddddddddddddddddddddddddddddddd",
  "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"];
const GT_SHOW = [
  { n: 0, y: "11111111", u: "22222222", v: "33333333", mean: [88, 127, 132], stdev: [34.6, 6.6, 19.0] },
  { n: 1, y: "44444444", u: "55555555", v: "66666666", mean: [87, 127, 132], stdev: [34.6, 6.6, 19.0] },
  { n: 2, y: "77777777", u: "88888888", v: "99999999", mean: [88, 128, 131], stdev: [34.5, 6.5, 19.1] },
  { n: 3, y: "AAAAAAAA", u: "BBBBBBBB", v: "CCCCCCCC", mean: [88, 127, 132], stdev: [34.6, 6.6, 19.0] },
  { n: 4, y: "DDDDDDDD", u: "EEEEEEEE", v: "FFFFFFFF", mean: [88, 127, 132], stdev: [34.6, 6.6, 19.0] },
];

check("1. parseFramemd5 đếm đúng + bỏ dòng rác", () => {
  const dir = mkdtempRetry(path.join(os.tmpdir(), "j1sc-"));
  const p = path.join(dir, "x.framemd5");
  writeFileRetry(p, [
    "# comment",
    md5line(GT_MD5[0]),
    md5line(GT_MD5[1]),
    "dòng rác không khớp",
    md5line(GT_MD5[2]),
    "",
  ].join("\n"));
  const out = H.parseFramemd5(p);
  assert.deepStrictEqual(out, GT_MD5.slice(0, 3));
  rmBestEffort(dir);
});

check("2. parseShowinfo parse đúng + chịu status-line xen", () => {
  const dir = mkdtempRetry(path.join(os.tmpdir(), "j1sc-"));
  const p = path.join(dir, "x.stderr");
  const g = GT_SHOW[0];
  // Xen status-line ffmpeg giữa type:P và checksum: (nhiễu thật I1 §5.5).
  const junk = `frame=   12 fps=0.0 q=-0.0 size=N/A time=00:00:00.40 bitrate=N/A speed=  40x    \r`;
  const line = `[Parsed_showinfo_0 @ 0x123] n:   ${g.n} pts:   0 pts_time:0.0 duration:    1000 duration_time:0.033333 fmt:yuv420p cl:limited sar:1/1 s:1280x720 i:P iskey:0 type:P ${junk}checksum:ABCDEF01 plane_checksum:[${g.y} ${g.u} ${g.v}] mean:[${g.mean[0]} ${g.mean[1]} ${g.mean[2]}] stdev:[${g.stdev[0]} ${g.stdev[1]} ${g.stdev[2]}]`;
  writeFileRetry(p, line + "\n" + showinfoLine(1, "44444444", "55555555", "66666666", 87, 127, 132, 34.6, 6.6, 19.0) + "\n");
  const out = H.parseShowinfo(p);
  assert.strictEqual(out.size, 2);
  assert.deepStrictEqual(out.get(0).plane, ["11111111", "22222222", "33333333"]);
  assert.deepStrictEqual(out.get(0).mean, [88, 127, 132]);
  assert.deepStrictEqual(out.get(1).stdev, [34.6, 6.6, 19.0]);
  rmBestEffort(dir);
});

check("2b. parseShowinfo: status-line xen GIỮA stdev (L4 §2.3) — không gán nhầm frame kề", () => {
  const dir = mkdtempRetry(path.join(os.tmpdir(), "j1sc-"));
  const p = path.join(dir, "x.stderr");
  const g = GT_SHOW[0];
  // Mô phỏng đúng byte thô L4 gray-smoke2: status-line chèn vào giữa
  // stdev của frame 0, kèm tiền tố log [Parsed_showinfo...] lặp lại
  // sau \r; sau khi tước còn lại 2 khoảng trắng trong ngoặc stdev.
  // Parser CŨ: gán nhầm mean/stdev frame 1 cho frame 0, frame 1 mất
  // luôn entry (parse thiếu). Parser MỚI: cả 2 frame đúng giá trị.
  const junk = `frame=   12 fps=0.0 q=-0.0 size=N/A time=00:00:00.40 bitrate=N/A speed=  40x    \r[Parsed_showinfo_0 @ 0x123]`;
  const line0 = `[Parsed_showinfo_0 @ 0x123] n:   ${g.n} pts:   0 pts_time:0.0 duration:    1000 duration_time:0.033333 fmt:yuv420p cl:limited sar:1/1 s:1280x720 i:P iskey:0 type:P checksum:ABCDEF01 plane_checksum:[${g.y} ${g.u} ${g.v}] mean:[${g.mean[0]} ${g.mean[1]} ${g.mean[2]}] stdev:[${g.stdev[0]} ${junk} ${g.stdev[1]} ${g.stdev[2]}]`;
  writeFileRetry(p, line0 + "\n" + showinfoLine(1, "44444444", "55555555", "66666666", 87, 127, 132, 34.6, 6.6, 19.0) + "\n");
  const out = H.parseShowinfo(p);
  assert.strictEqual(out.size, 2, `parse được ${out.size}/2 frame`);
  assert.deepStrictEqual(out.get(0).mean, [88, 127, 132], "frame 0 giữ mean của chính nó, không lấy của frame 1");
  assert.deepStrictEqual(out.get(0).stdev, [34.6, 6.6, 19.0], "frame 0 stdev đúng dù status-line đã chèn giữa");
  assert.deepStrictEqual(out.get(1).mean, [87, 127, 132], "frame 1 vẫn có entry riêng");
  rmBestEffort(dir);
});

check("3. poisonLikeTest: Y-only + meanY 164 → frac ~0.99; lệch 3 plane → null; Y-only meanY 90 → null", () => {
  const g = { plane: ["11111111", "22222222", "33333333"], mean: [88, 127, 132], stdev: [34.6, 6.6, 19.0] };
  const poison = { plane: ["1DA3989F", "22222222", "33333333"], mean: [164, 127, 132], stdev: [9.8, 6.6, 19.0] };
  const pl = H.poisonLikeTest(poison, g);
  assert.ok(pl && Math.abs(pl.poisonFrac - 0.99) < 0.02, `frac=${pl && pl.poisonFrac}`);
  const threePlane = { plane: ["99999999", "22222222", "33333333"], mean: [88, 127, 132], stdev: [34.6, 6.6, 19.0] };
  // U/V lệch hẳn mới là 3-plane; ở đây chỉ Y lệch nhưng meanY không kéo → null.
  const lowMean = { plane: ["99999999", "22222222", "33333333"], mean: [90, 127, 132], stdev: [34.6, 6.6, 19.0] };
  assert.strictEqual(H.poisonLikeTest(lowMean, g), null);
  const allDiv = { plane: ["99999999", "AAAAAAAA", "BBBBBBBB"], mean: [164, 127, 132], stdev: [9.8, 6.6, 19.0] };
  assert.strictEqual(H.poisonLikeTest(allDiv, g), null, "U/V lệch thì không phải poison-like (Y-only là điều kiện cần)");
  assert.strictEqual(H.poisonLikeTest(threePlane, g), null);
});

check("4. poisonStrictTest: Y == solid-poison 720p (E7D0D7F0) + mean 165 + stdev<2 → true", () => {
  const f = { plane: ["E7D0D7F0", "A2B435FC", "A2B435FC"], mean: [165, 165, 165], stdev: [0, 0, 0] };
  assert.strictEqual(H.poisonStrictTest(f, "720"), true);
  const g = { plane: ["1DA3989F", "22222222", "33333333"], mean: [164, 127, 132], stdev: [9.8, 6.6, 19.0] };
  assert.strictEqual(H.poisonStrictTest(g, "720"), false, "poison một phần (nội suy) thì strict cho false — đúng như I1 §4.2");
});

check("5. permTestExact: [88]x10 vs [0]x10 → p=1,08e-5 (sàn); [0]x10 vs [0]x10 → p=1", () => {
  const a = H.permTestExact(Array(10).fill(88), Array(10).fill(0));
  assert.ok(Math.abs(a.p - 2 / 184756) < 1e-9, `p=${a.p}`);
  assert.strictEqual(a.combos, 184756);
  const b = H.permTestExact(Array(10).fill(0), Array(10).fill(0));
  assert.strictEqual(b.p, 1);
});

check("6. fisher2: [[0,1500],[882,618]] → p≈0 (tràn dưới double); [[0,10],[0,10]] → p=1", () => {
  const p = H.fisher2(0, 1500, 882, 618);
  assert.ok(p < 1e-300, `p=${p}`);
  assert.strictEqual(H.fisher2(0, 10, 0, 10), 1);
});

check("7. analyzeArm end-to-end trên WORK fixture (GT 5 frame, 2 run)", () => {
  const work = mkdtempRetry(path.join(os.tmpdir(), "j1sc-work-"));
  // GT arm = TESTGT (đóng vai COPY): r1 == GT, r2..r10 == GT (ổn định).
  // Arm đo = TESTNC: r1 == GT (0 lệch), r2 lệch 2 frame (n=1 lệch 3 plane
  // meanY ~88; n=3 Y-only meanY 164 → poison-like).
  const gtArm = "TESTGT", ncArm = "TESTNC";
  for (const arm of [gtArm, ncArm]) fs.mkdirSync(path.join(work, arm), { recursive: true });
  const gtShowText = GT_SHOW.map((g) => showinfoLine(g.n, g.y, g.u, g.v, g.mean[0], g.mean[1], g.mean[2], g.stdev[0], g.stdev[1], g.stdev[2])).join("\n") + "\n";
  const gtMd5Text = GT_MD5.map(md5line).join("\n") + "\n";
  for (let i = 1; i <= 10; i++) {
    writeFileRetry(path.join(work, gtArm, `r${i}.framemd5`), gtMd5Text);
    writeFileRetry(path.join(work, gtArm, `r${i}.stderr`), gtShowText);
  }
  writeFileRetry(path.join(work, ncArm, "r1.framemd5"), gtMd5Text);
  writeFileRetry(path.join(work, ncArm, "r1.stderr"), gtShowText);
  const ncMd5 = [...GT_MD5];
  ncMd5[1] = "ffffffffffffffffffffffffffffffff"; // n=1 lệch
  ncMd5[3] = "11111111111111111111111111111111"; // n=3 lệch
  writeFileRetry(path.join(work, ncArm, "r2.framemd5"), ncMd5.map(md5line).join("\n") + "\n");
  const ncShow = GT_SHOW.map((g) => {
    if (g.n === 1) return showinfoLine(1, "99999999", "AAAAAAAA", "BBBBBBBB", 88, 127, 132, 34.6, 6.6, 19.0, "D0000001"); // lệch 3 plane
    if (g.n === 3) return showinfoLine(3, "1DA3989F", "BBBBBBBB", "CCCCCCCC", 164, 127, 132, 9.8, 6.6, 19.0, "D0000003"); // Y-only + meanY 164
    return showinfoLine(g.n, g.y, g.u, g.v, g.mean[0], g.mean[1], g.mean[2], g.stdev[0], g.stdev[1], g.stdev[2]);
  }).join("\n") + "\n";
  writeFileRetry(path.join(work, ncArm, "r2.stderr"), ncShow);
  // Các run còn lại của NC thiếu file → analyzeArm đếm missing (không crash).
  const gt = H.buildGt(work, gtArm, "720", 10);
  assert.strictEqual(gt.gtMd5.length, 5);
  assert.strictEqual(gt.gtShow.size, 5);
  const arm = { key: ncArm, size: "720", family: "720", gtArm, realFrames: 5 };
  const res = H.analyzeArm(work, arm, gt);
  assert.strictEqual(res.nRuns, 2, `nRuns=${res.nRuns}`);
  assert.strictEqual(res.missingRuns, 8);
  assert.strictEqual(res.totalDiv, 2, `totalDiv=${res.totalDiv}`);
  assert.strictEqual(res.totalDivReal, 2);
  assert.strictEqual(res.poisonLikeTotal, 1, `poisonLike=${res.poisonLikeTotal}`);
  assert.strictEqual(res.poisonLikeFrames[0].includes("n3"), true);
  assert.strictEqual(res.zoneTotal.mid, 2, "n=1,3 đều <140 → mid");
  assert.strictEqual(res.zoneTotal.drain, 0);
  assert.strictEqual(res.planeTotal.Y, 2);
  assert.strictEqual(res.planeTotal.U, 1, "chỉ n=1 lệch U/V");
  assert.strictEqual(res.gtStable, true);
  rmBestEffort(work);
});

check("8. ZONE: 0/139→mid, 140/149→drain, 150+→pad", () => {
  assert.strictEqual(H.ZONE(0), "mid");
  assert.strictEqual(H.ZONE(139), "mid");
  assert.strictEqual(H.ZONE(140), "drain");
  assert.strictEqual(H.ZONE(149), "drain");
  assert.strictEqual(H.ZONE(150), "pad");
  assert.strictEqual(H.ZONE(155), "pad");
});

console.log(`\n== selfcheck: ${pass} PASS, ${fail} FAIL ==`);
process.exit(fail ? 1 : 0);
