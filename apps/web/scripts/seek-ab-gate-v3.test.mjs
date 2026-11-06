/**
 * Phase 9 đợt 37, luồng T1 — Test unit cho cổng v3 (seek-ab-gate-v3.mjs).
 * Chạy: node --test apps/web/scripts/seek-ab-gate-v3.test.mjs
 * Không chạy browser, không đọc scratch, không phụ thuộc dữ liệu cũ:
 * mọi fixture đều tự dựng trong file. Các ca "hồi quy theo giá trị thật"
 * chỉ mượn CON SỐ đã công bố (không đọc file cũ) để khóa hành vi.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  GATE_V3,
  parseLoadavg,
  gopSplit,
  classifyDecodeV3,
  classifyLoadV3,
  classifyRunV3,
  verifySolo,
} from "./seek-ab-gate-v3.mjs";

/** Dựng samplesDetail: GOP1 (t ≥ 20) vẽ g1/khoảng, GOP2 (t < 20) vẽ g2/khoảng. */
function makeSamples(g1, g2) {
  // 19 mẫu GOP1: t = 29,5 → 20,5 (18 khoảng) + 1 mẫu biên 19,9? Để khớp
  // cấu trúc thật (28 mẫu: 19 mẫu ≥ 20,5…20,5 rồi 19,9…): dùng t giảm 0,5.
  const ts = [];
  for (let t = 29.5; t >= 20; t = +(t - 0.5).toFixed(1)) ts.push(t); // 20 mẫu ≥ 20
  for (let t = 19.5; t >= 15.5; t = +(t - 0.5).toFixed(1)) ts.push(t); // 9 mẫu < 20
  let draw = 100;
  const samples = [];
  for (let i = 0; i < ts.length; i++) {
    if (i > 0) {
      const t0 = ts[i - 1];
      const t1 = ts[i];
      if (t0 >= 20 && t1 >= 20) draw += g1;
      else if (t0 < 20 && t1 < 20) draw += g2;
      else draw += g1; // khoảng bắc cầu biên (bị loại khỏi GOP)
    }
    samples.push({ t: ts[i], draw, hold: 0 });
  }
  return samples;
}

function healthySeries(g1 = 5, g2 = 2) {
  const sd = makeSamples(g1, g2);
  const d = [];
  for (let i = 1; i < sd.length; i++) d.push(sd[i].draw - sd[i - 1].draw);
  return { sd, d };
}

test("parseLoadavg: tách 1/5/15 và bỏ phần running/total", () => {
  assert.deepEqual(parseLoadavg("1.66 2.28 2.14 1/426 17835"), { load1: 1.66, load5: 2.28, load15: 2.14 });
  assert.deepEqual(parseLoadavg("0.86 1.44 1.13"), { load1: 0.86, load5: 1.44, load15: 1.13 });
  assert.deepEqual(parseLoadavg(null), { load1: null, load5: null, load15: null });
});

test("gopSplit: khớp định nghĩa S1 (GOP1 18 khoảng, GOP2 8 khoảng, 1 khoảng biên bị loại)", () => {
  // single-a4 thật: GOP1 4,67 / GOP2 1,0 — mô phỏng bằng chuỗi có trung bình đúng:
  const sd = [];
  let draw = 0;
  const tSeq = [29.5, 29, 28.5, 28, 27.5, 27, 26.5, 26, 25.5, 25, 24.5, 24, 23.5, 23, 22.5, 22, 21.5, 21, 20.5, 19.9, 19.4, 18.8, 18.3, 17.8, 17.3, 16.9, 16.3, 15.8];
  const deltas = [2, 2, 2, 3, 3, 3, 2, 4, 3, 4, 4, 4, 5, 6, 8, 8, 10, 13, 12, 1, 1, 1, 1, 1, 1, 1, 1];
  // deltas[0..17] là 18 khoảng GOP1? Kiểm tra: khoảng 18 (20,5→19,9) là biên.
  // Chuỗi trên: 18 khoảng đầu → GOP1, khoảng 19 (chỉ số 18) là biên, 8 khoảng cuối → GOP2.
  for (let i = 0; i < tSeq.length; i++) {
    if (i > 0) draw += deltas[i - 1];
    sd.push({ t: tSeq[i], draw, hold: 0 });
  }
  const g = gopSplit(sd, 20);
  assert.equal(g.available, true);
  assert.equal(g.gop1N, 18);
  assert.equal(g.gop2N, 8);
  assert.equal(g.boundaryExcluded, 1);
  assert.equal(g.gop2Mean, 1);
  assert.ok(g.ratio < 0.30, `ratio ${g.ratio} phải < 0,30`);
});

test("gopSplit: thiếu samplesDetail hoặc quá ít khoảng mỗi phía → unavailable", () => {
  assert.equal(gopSplit(null).available, false);
  assert.equal(gopSplit([{ t: 29, draw: 1 }, { t: 28, draw: 2 }]).available, false);
  assert.equal(gopSplit([{ t: 29, draw: 1 }, { t: 19, draw: 2 }, { t: 18, draw: 3 }]).available, false);
});

test("classifyDecodeV3: STEADY_SLOW + SEGMENT_COLLAPSE khi GOP2 sụp, GOP1 khỏe", () => {
  const { sd, d } = healthySeries(5, 1);
  // Ép tail thành 8 khoảng cuối = 1 (đúng mẫu single-a4): thay 8 delta cuối bằng 1.
  const dd = [...d];
  for (let i = dd.length - 8; i < dd.length; i++) dd[i] = 1;
  // Tính lại samplesDetail khớp dd để GOP vẫn tách đúng:
  const sd2 = [{ t: sd[0].t, draw: sd[0].draw, hold: 0 }];
  for (let i = 1; i < sd.length; i++) sd2.push({ t: sd[i].t, draw: sd2[i - 1].draw + dd[i - 1], hold: 0 });
  const r = classifyDecodeV3({ drawDeltaSeries: dd, tickRate: 93.0, samplesDetail: sd2 });
  assert.equal(r.decodeLabel, "STEADY_SLOW");
  assert.equal(r.gopSubtype, "SEGMENT_COLLAPSE");
  assert.ok(r.gop.ratio < 0.30);
});

test("classifyDecodeV3: STEADY_SLOW + NON_SEGMENT khi cả hai GOP đều chậm đều", () => {
  // tail 1,375/2 như retry-b1 nhưng GOP1 cũng chậm (2,78) → ratio ~0,49.
  const sd = makeSamples(3, 1);
  const dd = [];
  for (let i = 1; i < sd.length; i++) dd.push(sd[i].draw - sd[i - 1].draw);
  // tail 8 khoảng cuối: [1,1,1,1,2,2,1,2] như b1 (mean 1,375).
  const tail = [1, 1, 1, 1, 2, 2, 1, 2];
  for (let i = 0; i < 8; i++) dd[dd.length - 8 + i] = tail[i];
  const sd2 = [{ t: sd[0].t, draw: sd[0].draw, hold: 0 }];
  for (let i = 1; i < sd.length; i++) sd2.push({ t: sd[i].t, draw: sd2[i - 1].draw + dd[i - 1], hold: 0 });
  const r = classifyDecodeV3({ drawDeltaSeries: dd, tickRate: 92.3, samplesDetail: sd2 });
  assert.equal(r.decodeLabel, "STEADY_SLOW");
  assert.equal(r.gopSubtype, "NON_SEGMENT");
});

test("classifyDecodeV3: STEADY_SLOW + INDETERMINATE_MIXED ở vùng 0,30–0,435 (retry-b8: 0,343)", () => {
  // GOP1 mean 3,28 / GOP2 mean 1,125 → ratio 0,343; tail 8 khoảng cuối mean 1,125.
  const sd = [];
  let draw = 0;
  // Lưới thời gian thật (28 mẫu như forward-hold: 19 mẫu ≥ 20,5 rồi 19,9…15,8).
  const tSeq = [29.5, 29, 28.5, 28, 27.5, 27, 26.5, 26, 25.5, 25, 24.5, 24, 23.5, 23, 22.5, 22, 21.5, 21, 20.5, 19.9, 19.4, 18.8, 18.3, 17.8, 17.3, 16.9, 16.3, 15.8];
  // 18 khoảng GOP1 tổng 59 (mean 3,278), 1 khoảng biên, 8 khoảng GOP2 [2,1,1,1,1,1,1,1] (mean 1,125).
  const g1 = [2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 3, 3, 3, 4]; // tổng 59
  const g2 = [2, 1, 1, 1, 1, 1, 1, 1];
  const dd = [...g1, 2, ...g2];
  for (let i = 0; i < tSeq.length; i++) {
    if (i > 0) draw += dd[i - 1];
    sd.push({ t: tSeq[i], draw, hold: 0 });
  }
  const r = classifyDecodeV3({ drawDeltaSeries: dd, tickRate: 86.8, samplesDetail: sd });
  assert.equal(r.decodeLabel, "STEADY_SLOW");
  assert.equal(r.gopSubtype, "INDETERMINATE_MIXED");
  assert.ok(r.gop.ratio >= 0.30 && r.gop.ratio < 0.435);
});

test("classifyDecodeV3: STARVED thì không phân subtype (tỉ số vô nghĩa)", () => {
  const { sd, d } = healthySeries(5, 2);
  const dd = [...d];
  dd[5] = 0; dd[6] = 0; // 2 stall sau warmup → STARVED
  const r = classifyDecodeV3({ drawDeltaSeries: dd, tickRate: 40, samplesDetail: sd });
  assert.equal(r.decodeLabel, "STARVED");
  assert.equal(r.gopSubtype, null);
});

test("classifyDecodeV3: giữ nguyên biên v2 — tailMean đúng 1,500 vẫn HEALTHY", () => {
  const { sd, d } = healthySeries(5, 2);
  const dd = [...d];
  // tail 8 khoảng: [1,2,1,2,1,2,1,2] → mean đúng 1,5, max 2.
  const tail = [1, 2, 1, 2, 1, 2, 1, 2];
  for (let i = 0; i < 8; i++) dd[dd.length - 8 + i] = tail[i];
  const r = classifyDecodeV3({ drawDeltaSeries: dd, tickRate: 90, samplesDetail: sd });
  assert.equal(r.decodeLabel, "HEALTHY");
});

test("classifyLoadV3: kế thừa v2 + thêm load5/load15 (đề xuất)", () => {
  const base = {
    load: { atStart: "0.94 1.46 1.13", beforeFwd: "0.86 1.44 1.13", beforeRev: "1.03 1.46 1.14", atEnd: "0.80 1.39 1.12" },
    forward: { interpRate: 0.9925 },
    raf: { forward: { gapP50: 0.005, exclFirst: { predictedRate: 0.995 } } },
  };
  // retry-a4 (R1): quiet cả v2 lẫn v3.
  const a4 = classifyLoadV3(base, 0);
  assert.equal(a4.loadLabelV3, "quiet");
  assert.deepEqual(a4.labelReasonsV3, []);
  // retry-b6 (b36): load1/fwd/rAF đều qua v2 nhưng load5 2,28 / load15 2,14 → v3 under-load.
  const b6 = classifyLoadV3({
    ...base,
    load: { atStart: "1.81 2.32 2.15", beforeFwd: "1.66 2.28 2.14", beforeRev: "1.61 2.26 2.13", atEnd: "1.55 2.21 2.12" },
    forward: { interpRate: 0.9993 },
    raf: { forward: { gapP50: 0.0049, exclFirst: { predictedRate: 0.995 } } },
  }, 0);
  assert.equal(b6.loadLabelV3, "under-load");
  assert.ok(b6.labelReasonsV3.some((r) => r.includes("load5")));
  assert.ok(b6.labelReasonsV3.some((r) => r.includes("load15")));
  // Biên: load5 đúng 2,0 ở checkpoint tiêu chí → vi phạm (điều kiện < nghiêm ngặt).
  const edge = classifyLoadV3({
    ...base,
    load: { atStart: "1.00 1.50 1.00", beforeFwd: "1.00 2.00 1.00", beforeRev: "1.00 1.50 1.00", atEnd: "1.00 1.50 1.00" },
  }, 0);
  assert.equal(edge.loadLabelV3, "under-load");
  // atStart KHÔNG làm tiêu chí (đúng Q6): atStart vượt 2,0 nhưng 3 checkpoint kia qua → vẫn quiet.
  // Tiền lệ thật: retry-b7 có atStart load1 2,05 nhưng nhãn v2 đã công bố là quiet.
  const atStartIgnored = classifyLoadV3({
    ...base,
    load: { atStart: "2.05 2.50 2.50", beforeFwd: "1.00 1.50 1.00", beforeRev: "1.00 1.50 1.00", atEnd: "1.00 1.50 1.00" },
  }, 0);
  assert.equal(atStartIgnored.loadLabelV3, "quiet");
});

test("classifyLoadV3: load5/load15 chỉ là BỔ SUNG — lượt S2 vẫn under-load vì load1", () => {
  // sparse-1 (S2): load5max 1,23 / load15max 0,54 đều thấp nhưng load1 vượt → vẫn under-load.
  const s = classifyLoadV3({
    load: { atStart: "2.41 0.77 0.38", beforeFwd: "2.30 0.77 0.38", beforeRev: "2.69 0.91 0.43", atEnd: "3.75 1.23 0.54" },
    forward: { interpRate: 0.981 },
    raf: { forward: { gapP50: 0.0163, exclFirst: { predictedRate: 0.936 } } },
  }, 0);
  assert.equal(s.loadLabelV3, "under-load");
  assert.ok(s.labelReasonsV3.some((r) => r.includes("load1")));
});

test("classifyRunV3: JSON gộp S1 (không có t) vẫn phân loại, GOP = unavailable", () => {
  const merged = {
    run: "retry-b6", variant: "retry",
    load: { atStart: "1.81 2.32 2.15", beforeFwd: "1.66 2.28 2.14", beforeRev: "1.61 2.26 2.13", atEnd: "1.55 2.21 2.12" },
    forwardInterpRate: 0.9993,
    decodeSide: { signals: { drawDeltaSeries: [2, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 5, 5, 7, 6, 10, 8, 2, 1, 2, 2, 2, 2, 2, 2], reverseTickRate: 90.5 } },
    reverseFps: 6.4046,
    pre: { chromePre: 0 },
  };
  const r = classifyRunV3(merged);
  assert.equal(r.decodeLabel, "HEALTHY");
  assert.equal(r.loadLabelV3, "under-load"); // load5/load15 vượt dù v2 quiet
  assert.equal(r.acceptedV3, false);
  assert.equal(r.gop.available, false);
});

test("verifySolo: chỉ eligible khi chromePre = 0, chromePost = 0 và acceptedV3", () => {
  const { sd, d } = healthySeries(5, 3);
  const run = {
    run: "solo-x", variant: "retry", bundle: "index-TEST.js",
    load: { atStart: "0.90 1.40 1.10", beforeFwd: "0.86 1.44 1.13", beforeRev: "1.03 1.46 1.14", atEnd: "0.80 1.39 1.12" },
    forward: { interpRate: 0.999 },
    raf: { forward: { gapP50: 0.005, exclFirst: { predictedRate: 0.995 } }, reverse: { n: 1200, wallSec: 13.0 } },
    reverse: { samplesDetail: sd, fps: 8.9 },
    pre: { chromePre: 0 }, post: { chromePost: 0 },
  };
  const okRun = verifySolo(run);
  assert.equal(okRun.soloEligible, true);
  assert.equal(okRun.acceptedV3, true);
  const bad = verifySolo({ ...run, post: { chromePost: 3 } });
  assert.equal(bad.soloEligible, false);
  assert.ok(bad.soloProblems.some((p) => p.includes("chromePost")));
  // Dạng 2 đối số: run thô (không có pre/post) + merged (cung cấp pre/post).
  const { pre, post, ...rawOnly } = run;
  const ok2 = verifySolo(rawOnly, { pre: { chromePre: 0 }, post: { chromePost: 0 }, bundle: run.bundle });
  assert.equal(ok2.soloEligible, true);
  const bad2 = verifySolo(rawOnly, { pre: { chromePre: 0 }, post: { chromePost: 0 }, bundle: "index-KHAC.js" });
  assert.equal(bad2.soloEligible, false);
  assert.ok(bad2.soloProblems.some((p) => p.includes("bundle")));
});

test("GATE_V3: trạng thái đề xuất, không tự nhận là chính thức", () => {
  assert.equal(GATE_V3.status, "proposed");
  assert.equal(GATE_V3.load.load1Max, 2.0);
  assert.equal(GATE_V3.decode.tailMeanMax, 1.5);
  assert.equal(GATE_V3.gop.segmentCollapseMax, 0.30);
});
