#!/usr/bin/env node
/**
 * test_round81_i1_analyze_h1_perframe.js — Phase 9 đợt 81, luồng I1.
 *
 * Phân tích HỒI CỨU dữ liệu per-frame của đợt 80 H1 (60 lần chạy đã có
 * trên đĩa, ~/workspace/.scratch-r80h1/runs/):
 *   - NGUỒN CHÍNH: r*.framemd5 — md5 từng frame (file riêng, không bị
 *     status-line xen vào như stderr).
 *   - NGUỒN PHỤ: r*.stderr showinfo — checksum + plane_checksum +
 *     mean + stdev từng frame (để biết plane nào lệch, và mean/stdev
 *     của frame lệch). Regex toàn văn cho phép status-line xen giữa
 *     `type:P` và `checksum:` (progress `\r` cắt dòng showinfo).
 * GT per-frame lấy từ 1 lần chạy COPY — đã verify COPY/SP cho cùng
 * md5/checksum từng frame (GT ổn định).
 *
 * Endpoint: TỈ LỆ FRAME LỆCH / RUN — "suýt crash" có power cao hơn
 * hẳn endpoint crash nhị phân per-run (H1: 0/60) và sha cả file
 * (1 bit/run). 150 frame/run × 10 run = 1500 trial/arm.
 *
 * Trung thực thống kê: frame trong cùng 1 run KHÔNG độc lập (cùng cửa
 * sổ race) — Fisher gộp trên frame chỉ là cận trên. Endpoint chính là
 * PHÂN PHỐI SỐ FRAME LỆCH / RUN (10 run/arm), so bằng permutation test
 * chính xác trên trung bình số frame lệch/run (C(20,10) hoán vị).
 *
 * Cách chạy: node server/render/src/test_round81_i1_analyze_h1_perframe.js
 * Env: I1_H1WORK (mặc định ~/workspace/.scratch-r80h1/runs),
 *      I1_OUT (mặc định ~/workspace/.scratch-r81i1/analysis-h1-perframe.json)
 */
"use strict";

const fs = require("fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("path");

const HOME = process.env.HOME;
const H1WORK = process.env.I1_H1WORK || path.join(HOME, "workspace", ".scratch-r80h1", "runs");
const OUT = process.env.I1_OUT || path.join(HOME, "workspace", ".scratch-r81i1", "analysis-h1-perframe.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const ARMS = ["A1080NC", "B1080SP", "C1080CP", "D720NC", "E720SP", "F720CP"];
const N = 10;
// Chữ ký poison v2e (đo bằng showinfo trên frame toàn 0xA5 — xem LIMITS I1):
// Y plane_checksum của mặt phẳng toàn 0xA5 (U/V cũng có ref nhưng chỉ
// Y được track chắc chắn ở 720p vì U/V 230.400 < TRACK_MIN 400.000).
const POISON_Y = { "1080": "E609E5EB", "720": "E7D0D7F0" };
// Frame "có chữ ký poison" = frame lệch khỏi GT VÀ (Y == solid-poison
// HOẶC meanY ≈ 165 ± 3 kèm stdevY < 2). Y-checksum-exact là test mạnh
// (trùng ngẫu nhiên ~2^-32); mean/stdev là test mềm, chống nhiễu parse.

// framemd5: "0,         64,         64,        1,  3110400, <md5>"
function parseFramemd5(p) {
  const md5s = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\d+,\s*\d+,\s*\d+,\s*\d+,\s*\d+,\s*([0-9a-f]{32})\s*$/);
    if (m) md5s.push(m[1]);
  }
  return md5s;
}

// showinfo toàn văn: cho phép status-line (frame= .. fps= .. \r) xen
// giữa `type:P` và `checksum:` (tối đa 600 ký tự rác).
const RE_SHOWINFO = /n:\s*(\d+) pts:\s*\d+ pts_time:[0-9.]+\s+duration:\s*\d+ duration_time:[0-9.]+\s+fmt:\S+\s+cl:\S+\s+sar:\S+\s+s:\S+\s+i:\S+\s+iskey:\d+\s+type:\S+[\s\S]{0,600}?checksum:([0-9A-F]+)\s+plane_checksum:\[([0-9A-F]+) ([0-9A-F]+) ([0-9A-F]+)\]\s+mean:\[([0-9.]+) ([0-9.]+) ([0-9.]+)\]\s+stdev:\[([0-9.]+) ([0-9.]+) ([0-9.]+)\]/g;
function parseShowinfo(p) {
  const frames = new Map();
  const text = fs.readFileSync(p, "utf8");
  let m;
  RE_SHOWINFO.lastIndex = 0;
  while ((m = RE_SHOWINFO.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    frames.set(n, {
      checksum: m[2],
      plane: [m[3], m[4], m[5]],
      mean: [+m[6], +m[7], +m[8]],
      stdev: [+m[9], +m[10], +m[11]],
    });
  }
  return frames;
}

function logComb(n, k) {
  if (k < 0 || k > n) return -Infinity;
  k = Math.min(k, n - k);
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}
function fisher2(a, b, c, d) {
  const n = a + b + c + d;
  const logP0 = logComb(a + b, a) + logComb(c + d, c) - logComb(n, a + c);
  let p = 0;
  const lo = Math.max(0, (a + c) - (c + d)), hi = Math.min(a + b, a + c);
  for (let x = lo; x <= hi; x++) {
    const lp = logComb(a + b, x) + logComb(c + d, a + c - x) - logComb(n, a + c);
    if (lp <= logP0 + 1e-12) p += Math.exp(lp);
  }
  return Math.min(1, p);
}
function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : +((s[m - 1] + s[m]) / 2).toFixed(2);
}
// Permutation test chính xác (2 phía) trên hiệu trung bình 2 mẫu n=10.
function permTestExact(a, b) {
  const all = [...a, ...b];
  const n1 = a.length;
  const total = all.reduce((s, v) => s + v, 0);
  const obs = Math.abs(a.reduce((s, v) => s + v, 0) / n1 - b.reduce((s, v) => s + v, 0) / b.length);
  let extreme = 0, count = 0;
  const idx = Array.from({ length: n1 }, (_, i) => i);
  for (;;) {
    let s = 0;
    for (const i of idx) s += all[i];
    if (Math.abs(s / n1 - (total - s) / (all.length - n1)) >= obs - 1e-12) extreme++;
    count++;
    let i = n1 - 1;
    while (i >= 0 && idx[i] === all.length - n1 + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < n1; j++) idx[j] = idx[j - 1] + 1;
  }
  return { p: extreme / count, combos: count };
}

function main() {
  console.log(`== I1 hồi cứu H1 per-frame (framemd5 chính + showinfo phụ) ==\n   H1WORK=${H1WORK}`);
  const gtMd5 = {}, gtShow = {};
  for (const [size, refArm] of [["1080", "C1080CP"], ["720", "F720CP"]]) {
    gtMd5[size] = parseFramemd5(path.join(H1WORK, refArm, "r1.framemd5"));
    // GT showinfo: PHIẾU ĐA SỐ trên 20 lần CP+SP (không lấy 1 file r1 —
    // status-line xen vào có thể làm regex gán nhầm checksum của frame
    // kề cho 1-2 frame trong 1 file, vd F720CP/r1 n=41).
    const vote = new Map(); // n -> Map(checksum -> {count, sample})
    const refArms = size === "1080" ? ["C1080CP", "B1080SP"] : ["F720CP", "E720SP"];
    for (const a of refArms) {
      for (let i = 1; i <= N; i++) {
        const show = parseShowinfo(path.join(H1WORK, a, `r${i}.stderr`));
        for (const [n, f] of show) {
          if (!vote.has(n)) vote.set(n, new Map());
          const m = vote.get(n);
          const key = JSON.stringify(f);
          if (!m.has(key)) m.set(key, { count: 0, sample: f });
          m.get(key).count++;
        }
      }
    }
    const gtS = new Map();
    for (const [n, m] of vote) {
      let best = null;
      for (const v of m.values()) if (!best || v.count > best.count) best = v;
      gtS.set(n, best.sample);
    }
    gtShow[size] = gtS;
    console.log(`   GT ${size}p: ${gtMd5[size].length} frame md5 + ${gtShow[size].size} frame showinfo (đa số 20 lần CP+SP) từ ${refArm}/r1`);
  }
  const perArm = {};
  for (const arm of ARMS) {
    const size = arm.includes("1080") ? "1080" : "720";
    const runs = [];
    let gtStable = true;
    for (let i = 1; i <= N; i++) {
      const md5s = parseFramemd5(path.join(H1WORK, arm, `r${i}.framemd5`));
      const show = parseShowinfo(path.join(H1WORK, arm, `r${i}.stderr`));
      const div = [];
      const divPlane = { Y: 0, U: 0, V: 0 };
      const divMeanYDelta = [];
      const divYck = {}; // n -> Y plane_checksum (để đếm frame hệ thống)
      const poisonY = []; // frame lệch có Y plane == solid-poison
      const poisonMean = []; // frame lệch có meanY≈165 + stdevY<2
      // I1 (tinh chỉnh sau smoke): test "poison-like" cho filter NỘI SUY —
      // transform không copy verbatim nên Y-exact/stdev<2 quá chặt, và
      // stdev KHÔNG đơn điệu với poison: poison toàn phần → stdev sụp;
      // poison một phần (free rơi giữa lúc transform đang đọc mặt phẳng)
      // → hỗn hợp 2 cụm (165 + ~88) làm stdev TĂNG (vd smoke n=148:
      // meanY 127, stdevY 45,7 — khớp mô hình hỗn hợp ~51% poison).
      // Test đúng: frame lệch CHỈ ở Y (U/V y hệt GT) + meanY kéo mạnh về
      // 165 (>=120, tức >=~40% pixel poison nếu trộn tuyến tính). U/V
      // 720p không poison được (230.400 < TRACK_MIN) nên Y-only là điều
      // kiện cần; clip không có frame nào meanY >=120 nên không có
      // false positive từ "frame sai khác". Đã kiểm chứng: H1 (không
      // poison) cho 0 frame poison-like; I1 cho 1 (r2 n=148, meanY 164,
      // ~99% poison); smoke cho 1 (n=148, meanY 127, ~51% poison).
      const poisonLike = [];
      const yOnly = [];
      for (let n = 0; n < md5s.length; n++) {
        if (md5s[n] !== gtMd5[size][n]) div.push(n);
      }
      // Cross-check showinfo: số frame lệch theo checksum phải khớp md5
      // (trừ frame showinfo bị thiếu do status-line — đếm riêng).
      let divShow = 0, showMissing = 0;
      for (let n = 0; n < md5s.length; n++) {
        const f = show.get(n), g = gtShow[size].get(n);
        if (!f || !g) { showMissing++; continue; }
        if (md5s[n] !== gtMd5[size][n]) divYck[n] = f.plane[0];
        if (f.checksum !== g.checksum) {
          divShow++;
          if (f.plane[0] !== g.plane[0]) divPlane.Y++;
          if (f.plane[1] !== g.plane[1]) divPlane.U++;
          if (f.plane[2] !== g.plane[2]) divPlane.V++;
          divMeanYDelta.push(+(f.mean[0] - g.mean[0]).toFixed(1));
          // Chữ ký poison chỉ tính trên frame ĐÃ lệch theo framemd5
          // (tránh nhiễu parse showinfo tạo false positive).
          if (md5s[n] !== gtMd5[size][n]) {
            if (f.plane[0] === POISON_Y[size]) poisonY.push(n);
            if (Math.abs(f.mean[0] - 165) < 3 && f.stdev[0] < 2) poisonMean.push(n);
            const yDiv = f.plane[0] !== g.plane[0];
            const uvSame = f.plane[1] === g.plane[1] && f.plane[2] === g.plane[2];
            if (yDiv && uvSame) {
              yOnly.push(n);
              if (f.mean[0] >= 120) {
                // Tỉ lệ pixel poison ước lượng tuyến tính:
                // meanY ≈ (1-p)*gtMeanY + p*165.
                const p = (f.mean[0] - g.mean[0]) / (165 - g.mean[0]);
                poisonLike.push({ n, meanY: f.mean[0], stdevY: f.stdev[0], gtStdevY: g.stdev[0], poisonFrac: +p.toFixed(2) });
              }
            }
          }
        }
      }
      if ((arm === "C1080CP" || arm === "F720CP" || arm === "B1080SP" || arm === "E720SP") && div.length > 0) {
        gtStable = false;
        console.log(`   ⚠️  GT KHÔNG ỔN ĐỊNH: ${arm}/r${i} lệch ${div.length} frame md5: [${div.join(",")}]`);
      }
      runs.push({ i, nFrames: md5s.length, nDiv: div.length, div, divShow, showMissing, divPlane, divMeanYDelta, divYck, poisonY, poisonMean, poisonLike, yOnly });
    }
    const counts = runs.map((r) => r.nDiv);
    const totalDiv = counts.reduce((a, b) => a + b, 0);
    const totalFrames = runs.reduce((a, r) => a + r.nFrames, 0);
    const pos = { first50: 0, mid50: 0, last50: 0, last10: 0 };
    for (const r of runs) for (const n of r.div) {
      if (n < 50) pos.first50++;
      else if (n < 100) pos.mid50++;
      else pos.last50++;
      if (n >= 140) pos.last10++;
    }
    const allMeanYDelta = runs.flatMap((r) => r.divMeanYDelta);
    const planeTotal = runs.reduce((o, r) => ({ Y: o.Y + r.divPlane.Y, U: o.U + r.divPlane.U, V: o.V + r.divPlane.V }), { Y: 0, U: 0, V: 0 });
    const poisonYTotal = runs.reduce((a, r) => a + r.poisonY.length, 0);
    const poisonMeanTotal = runs.reduce((a, r) => a + r.poisonMean.length, 0);
    const poisonLikeTotal = runs.reduce((a, r) => a + r.poisonLike.length, 0);
    const poisonLikeFrames = runs.flatMap((r) => r.poisonLike.map((p) => `r${r.i}:n${p.n} meanY=${p.meanY} stdevY=${p.stdevY} (GT ${p.gtStdevY}) poisonFrac~${p.poisonFrac}`));
    const yOnlyTotal = runs.reduce((a, r) => a + r.yOnly.length, 0);
    // Frame "hệ thống": cùng chỉ số n lệch ở >=8/10 run với CÙNG checksum
    // Y (race có thành phần tất định — pool decoder xoay vòng cố định).
    const sysByN = {};
    for (const r of runs) {
      for (const n of r.divYck ? Object.keys(r.divYck).map(Number) : []) {
        if (!sysByN[n]) sysByN[n] = {};
        const ck = r.divYck[n];
        sysByN[n][ck] = (sysByN[n][ck] || 0) + 1;
      }
    }
    const systematicFrames = Object.entries(sysByN)
      .map(([n, m]) => {
        const [ck, cnt] = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
        return { n: +n, modalYck: ck, runs: cnt };
      })
      .filter((s) => s.runs >= 8);
    perArm[arm] = {
      size, gtStable, runs,
      totalDiv, totalFrames,
      rate: +(totalDiv / totalFrames).toFixed(4),
      medianDivPerRun: median(counts),
      meanDivPerRun: +(totalDiv / N).toFixed(2),
      minDivPerRun: Math.min(...counts), maxDivPerRun: Math.max(...counts),
      divPerRun: counts, pos, planeTotal,
      poisonYTotal, poisonMeanTotal,
      poisonLikeTotal, poisonLikeFrames, yOnlyTotal, systematicFrames,
      divMeanYDelta: { n: allMeanYDelta.length, median: median(allMeanYDelta), min: allMeanYDelta.length ? Math.min(...allMeanYDelta) : null, max: allMeanYDelta.length ? Math.max(...allMeanYDelta) : null },
      showinfoCrossCheck: runs.map((r) => ({ i: r.i, md5Div: r.nDiv, showDiv: r.divShow, showMissing: r.showMissing })),
    };
    console.log(`   ${arm}: lệch ${totalDiv}/${totalFrames} frame (tỉ lệ ${perArm[arm].rate}), ` +
      `mỗi run: trung vị ${perArm[arm].medianDivPerRun}, TB ${perArm[arm].meanDivPerRun}, ` +
      `min-max ${perArm[arm].minDivPerRun}-${perArm[arm].maxDivPerRun} | vị trí đầu/giữa/cuối/10-cuối: ` +
      `${pos.first50}/${pos.mid50}/${pos.last50}/${pos.last10} | plane lệch Y/U/V: ` +
      `${planeTotal.Y}/${planeTotal.U}/${planeTotal.V} | ΔmeanY frame lệch: trung vị ${perArm[arm].divMeanYDelta.median} (min ${perArm[arm].divMeanYDelta.min}, max ${perArm[arm].divMeanYDelta.max}) | ` +
      `POISON strict: Y-exact ${poisonYTotal}, mean/stdev ${poisonMeanTotal} | POISON-LIKE (Y-only+meanY>=120): ${poisonLikeTotal} ${JSON.stringify(poisonLikeFrames)} | Y-only: ${yOnlyTotal} | frame hệ thống (>=8/10 run cùng Yck): ${JSON.stringify(systematicFrames)} | GT ổn định: ${gtStable}`);
  }

  const pairs = [
    ["B1080SP", "A1080NC"], ["C1080CP", "A1080NC"], ["B1080SP", "C1080CP"],
    ["E720SP", "D720NC"], ["F720CP", "D720NC"], ["E720SP", "F720CP"],
  ];
  const comparisons = [];
  for (const [x, y] of pairs) {
    const a = perArm[x], b = perArm[y];
    const fisherFrame = fisher2(a.totalDiv, a.totalFrames - a.totalDiv, b.totalDiv, b.totalFrames - b.totalDiv);
    const perm = permTestExact(a.divPerRun, b.divPerRun);
    comparisons.push({
      pair: `${x}-vs-${y}`,
      frameDivergent: `${x} ${a.totalDiv}/${a.totalFrames} vs ${y} ${b.totalDiv}/${b.totalFrames}`,
      fisherFramePooledTwoSided: +fisherFrame.toExponential(3),
      permTestPerRunTwoSided: { p: +perm.p.toExponential(3), combos: perm.combos },
      note: "Fisher gộp: cận trên (frame trong run tương quan). Permutation trên số frame lệch/run là endpoint chính.",
    });
    console.log(`   ${x}-vs-${y}: frame gộp Fisher p=${fisherFrame.toExponential(3)} | ` +
      `permutation per-run p=${perm.p.toExponential(3)} (${perm.combos} hoán vị)`);
  }

  const out = { source: "H1 60 runs: framemd5 per-frame md5 vs GT (COPY r1) + showinfo cross-check", perArm, comparisons };
  writeFileEpermRetry(OUT, JSON.stringify(out, null, 1));
  console.log(`== xong — ${OUT} ==`);
}

if (require.main === module) main();
module.exports = {};
