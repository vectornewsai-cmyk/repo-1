#!/usr/bin/env node
/**
 * test_round82_j5_q4_resid.mjs — Phase 9 đợt 82, luồng J5: TEST kiểm chứng
 * các số headline của thí nghiệm phân biệt cơ chế Q4 resid (đọc JSON đo,
 * không tính lại). Mọi kỳ vọng = số đo thật đã ghi trong
 * docs/PHASE9_ROUND82_J5_Q4_RESID_MECHANISM_LIMITS.md.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/test_round82_j5_q4_resid.mjs
 * KHÔNG push/tag/binary/workflow. Không sửa code production.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const J5 = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files", "round82-j5");
const mech = JSON.parse(fs.readFileSync(path.join(J5, "r82j5-resid-mechanism.json"), "utf8"));
const c3 = JSON.parse(fs.readFileSync(path.join(J5, "r82j5-c3-check.json"), "utf8"));

let pass = 0, fail = 0;
function check(name, cond, got) {
  if (cond) { pass++; console.log(`  PASS ${name} — ${got}`); }
  else { fail++; console.log(`  FAIL ${name} — ${got}`); }
}
const close = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;

console.log("== J5 test: số headline phân biệt cơ chế Q4 resid ==");
// 0. Tái lập I4/F7.
check("tái lập I4 still residStd_R ≈ 0,74", close(mech.repro.i4.residStdR, 0.7404, 0.001), `residStd_R=${mech.repro.i4.residStdR}`);
check("tái lập F7 real residStd_R ≈ 2,95", close(mech.repro.f7.residStdR, 2.9467, 0.001), `residStd_R=${mech.repro.f7.residStdR}`);
// A. Phân rã F7: cực tiểu ở f24, A1 ≈ A0.
const refs = Object.fromEntries(mech.A.refs.map((r) => [r.tag, r]));
check("A0 tái lập F7 = 2,9467", close(refs["A0-native-f25-C2"].residStdR, 2.9467, 0.001), `A0=${refs["A0-native-f25-C2"].residStdR}`);
check("A1 (cùng frame đã encode) ≈ A0 (làm mượt ≈ 0)", close(refs["A1-vp9dec-f25-C2"].residStdR, refs["A0-native-f25-C2"].residStdR, 0.05), `A1=${refs["A1-vp9dec-f25-C2"].residStdR} vs A0=${refs["A0-native-f25-C2"].residStdR}`);
const a2 = ["A2-vp9dec-f20-C2", "A2-vp9dec-f22-C2", "A2-vp9dec-f24-C2", "A2-vp9dec-f26-C2", "A2-vp9dec-f28-C2", "A2-vp9dec-f30-C2"]
  .map((t) => refs[t].residStdR);
check("A2 cực tiểu DUY NHẤT ở f24 (0,514)", refs["A2-vp9dec-f24-C2"].residStdR < 0.6 && a2.every((v, i) => i === 2 || v > 2.5), `A2=[${a2.join(", ")}]`);
check("A2 lệch ±5 frame ≥ 8,2 (motion mạnh)", refs["A2-vp9dec-f20-C2"].residStdR > 8 && refs["A2-vp9dec-f30-C2"].residStdR > 8, `f20=${refs["A2-vp9dec-f20-C2"].residStdR} f30=${refs["A2-vp9dec-f30-C2"].residStdR}`);
check("A4 (bicubic thay C2) ≈ A0 (±0,1)", close(refs["A4-vp9dec-f25-bicubic"].residStdR, 2.9467, 0.1), `A4=${refs["A4-vp9dec-f25-bicubic"].residStdR}`);
check("A5 (h264-720p, cùng timestamp) ≈ A0 (±0,1)", close(refs["A5-h264-720p-f30"].residStdR, 2.9467, 0.1), `A5=${refs["A5-h264-720p-f30"].residStdR}`);
check("A3 (trilinear thẳng 1920→viewport) ≈ A0 (±0,1)", close(mech.A.direct1920.A3_trilinear.residStd[0], 2.9467, 0.1), `A3=${mech.A.direct1920.A3_trilinear.residStd[0]}`);
// C3 check: cùng bộ lọc, làm mượt ≈ 0; cực tiểu f24 giữ nguyên.
check("C3-f25 ≈ A0 (làm mượt VP9 ≈ 0 với cùng bộ lọc)", close(c3.refs["C3-f25"].residStdR, 2.9467, 0.02), `C3-f25=${c3.refs["C3-f25"].residStdR}`);
check("C3-f24 < 1 (cực tiểu f24 giữ với bộ lọc C3)", c3.refs["C3-f24"].residStdR < 1, `C3-f24=${c3.refs["C3-f24"].residStdR}`);
// B. Sweep làm mượt: sàn crf0 + tăng theo crf; tp sàn cao do subsampling.
const bSlov = Object.fromEntries(mech.B.slov.map((r) => [r.tag, r]));
const bTp = Object.fromEntries(mech.B.tp.map((r) => [r.tag, r]));
check("B slov x264 crf0 = sàn 4:2:0 ≈ 0,59", close(bSlov["slov-x264-crf0"].smoothStdR, 0.588, 0.01), `crf0=${bSlov["slov-x264-crf0"].smoothStdR}`);
check("B slov x264 crf18 ≈ 0,83 (< 1/3 khoảng cách 2,95−0,74)", close(bSlov["slov-x264-crf18"].smoothStdR, 0.8317, 0.01), `crf18=${bSlov["slov-x264-crf18"].smoothStdR}`);
check("B slov làm mượt tăng đơn điệu theo crf x264", ["crf0", "crf10", "crf18", "crf23", "crf28", "crf35"].every((c, i, a) => i === 0 || bSlov[`slov-x264-${c}`].smoothStdR > bSlov[`slov-x264-${a[i - 1]}`].smoothStdR), `x264=[${["crf0", "crf10", "crf18", "crf23", "crf28", "crf35"].map((c) => bSlov[`slov-x264-${c}`].smoothStdR).join(", ")}]`);
check("B slov AV1 crf18 thấp nhất trong 4 codec ở crf18", bSlov["slov-av1-crf18"].smoothStdR < bSlov["slov-x264-crf18"].smoothStdR && bSlov["slov-av1-crf18"].smoothStdR < bSlov["slov-vp9-crf18"].smoothStdR && bSlov["slov-av1-crf18"].smoothStdR < bSlov["slov-x265-crf18"].smoothStdR, `av1=${bSlov["slov-av1-crf18"].smoothStdR} x264=${bSlov["slov-x264-crf18"].smoothStdR} vp9=${bSlov["slov-vp9-crf18"].smoothStdR} x265=${bSlov["slov-x265-crf18"].smoothStdR}`);
check("B tp x264 crf0 ≈ 2,32 (sàn subsampling cao, gần phẳng tới crf23)", close(bTp["tp-x264-crf0"].smoothStdR, 2.3183, 0.01) && bTp["tp-x264-crf23"].smoothStdR < 2.5, `crf0=${bTp["tp-x264-crf0"].smoothStdR} crf23=${bTp["tp-x264-crf23"].smoothStdR}`);
check("B tp crf0 giống hệt nhau giữa x264/VP9 (sàn codec-độc lập)", close(bTp["tp-vp9-crf0"].smoothStdR, bTp["tp-x264-crf0"].smoothStdR, 0.001), `vp9-crf0=${bTp["tp-vp9-crf0"].smoothStdR} x264-crf0=${bTp["tp-x264-crf0"].smoothStdR}`);
// D. test-pattern: KHÔNG phải still-loop; kernel giải thích resid.
check("D1 tp.mp4 f25 vs f30 std_R ≈ 34 (KHÔNG phải still-loop)", close(mech.D.tpFrameOffset.f25vsf30.std[0], 34.0952, 0.01), `std_R=${mech.D.tpFrameOffset.f25vsf30.std[0]}`);
check("D1b tp.mp4 f30 = fullrgb-plain.raw (f30 là frame tham chiếu)", close(mech.D.tpFrameOffset.f25vsOrig.std[0], mech.D.tpFrameOffset.f25vsf30.std[0], 0.001), `f25-vs-orig=${mech.D.tpFrameOffset.f25vsOrig.std[0]}`);
check("D2 kernel-diff tp @311 ≈ 3,86 (cùng bậc với resid tp 4,46)", close(mech.D["tp-311x175"].kernelDiffStd[0], 3.8564, 0.01), `kernelDiff_R=${mech.D["tp-311x175"].kernelDiffStd[0]}`);
check("D2 kernel-diff slov @809 ≈ 0,35 (cùng bậc với sàn resid 0,51–0,74)", close(mech.D["slov-809x455"].kernelDiffStd[0], 0.3518, 0.01), `kernelDiff_R=${mech.D["slov-809x455"].kernelDiffStd[0]}`);
// C. Pan: matched đứng yên theo tốc độ; offset tăng theo tốc độ.
const pan = {};
for (const name of ["pan-slov-s0", "pan-slov-s2", "pan-slov-s8", "pan-tp-s8"]) {
  pan[name] = JSON.parse(fs.readFileSync(path.join(J5, `r82j5-sweep-${name}-w1920x1080.json`), "utf8"));
}
function panResid(name, mode) {
  const c = pan[name].casesRaw.find((x) => x.mode === mode && x.noiseLevel === "noise05");
  return c.residStd[0];
}
check("C pan-slov-s0 matched = I4 (0,7404)", close(panResid("pan-slov-s0", "matched-f30"), 0.7404, 0.001), `s0-matched=${panResid("pan-slov-s0", "matched-f30")}`);
check("C pan matched đứng yên theo tốc độ (s0≈s2≈s8 ≈ 0,74)", close(panResid("pan-slov-s2", "matched-f30"), 0.7375, 0.01) && close(panResid("pan-slov-s8", "matched-f30"), 0.74, 0.05), `s2=${panResid("pan-slov-s2", "matched-f30")} s8=${panResid("pan-slov-s8", "matched-f30")}`);
check("C pan offset tăng theo tốc độ (s0 0,97 < s2 10,26 < s8)", panResid("pan-slov-s0", "offset-f25") < 1.1 && panResid("pan-slov-s2", "offset-f25") > 10 && panResid("pan-slov-s8", "offset-f25") > panResid("pan-slov-s2", "offset-f25"), `s0=${panResid("pan-slov-s0", "offset-f25")} s2=${panResid("pan-slov-s2", "offset-f25")} s8=${panResid("pan-slov-s8", "offset-f25")}`);
check("C pan-tp-s8 matched R ≈ 1,18 (cùng bậc với D2 kernel 0,74; KHÔNG phải 4,46 của rect 311)", close(panResid("pan-tp-s8", "matched-f30"), 1.1756, 0.01), `tp-s8-matched-R=${panResid("pan-tp-s8", "matched-f30")}`);
{
  const tpS8 = pan["pan-tp-s8"].casesRaw.find((x) => x.mode === "matched-f30" && x.noiseLevel === "noise05");
  check("C pan-tp-s8 matched B ≈ 7,57 (kernel kênh B nổ theo pha sọc)", close(tpS8.residStd[2], 7.57, 0.05), `tp-s8-matched-B=${tpS8.residStd[2]}`);
  check("C pan-tp-s8 offset R ≈ 94,40 (sọc lệch 40px)", close(panResid("pan-tp-s8", "offset-f25"), 94.4042, 0.1), `tp-s8-offset-R=${panResid("pan-tp-s8", "offset-f25")}`);
  check("C pan-tp-s8 cả 4 case đều cả-hai-LỆCH (dKurt R, không chấm được)", pan["pan-tp-s8"].casesRaw.every((c) => c.correct === "cả-hai-LỆCH"), `correct=${[...new Set(pan["pan-tp-s8"].casesRaw.map((c) => c.correct))].join(",")}`);
}
const q4total = Object.values(pan).flatMap((p) => p.casesRaw).filter((c) => !c.gates.G1_d0stdR_le_2 && c.gates.G2_ratioR_le_1).length;
check("C Q4 = 0 case trong 16 case pan", q4total === 0, `Q4=${q4total}/16`);
const scoresOk = ["pan-slov-s0", "pan-slov-s2", "pan-slov-s8"].every((n) => ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"].every((r) => pan[n].scoresRaw[r].ok === 4 && pan[n].scoresRaw[r].total === 4))
  && ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"].every((r) => pan["pan-tp-s8"].scoresRaw[r].total === 0 && pan["pan-tp-s8"].scoresRaw[r].unscored === 4);
check("C mọi luật đúng 4/4 trên 3 sweep slov; tp-s8 0/0 (không chấm, cả-hai-LỆCH)", scoresOk, "slov 4/4 × 3; tp-s8 0/0 unscored 4");

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exitCode = 1;
