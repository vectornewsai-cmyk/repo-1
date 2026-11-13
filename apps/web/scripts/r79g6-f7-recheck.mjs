#!/usr/bin/env node
/**
 * r79g6-f7-recheck.mjs — Phase 9 đợt 79, luồng G6: tính LẠI 26 case F7 qua harness
 * dùng chung (delta0-harness.mjs, luật chính G12) trên snapshot headed
 * MỚI của đợt này (r78f7-headed-capture.mjs, code đã sửa rò plain C1):
 *
 *  - basgo/slovenska post-fix w1440 + w1920, noise05 + noise10
 *    (nợ D2 §6.3 / E6 §5.3: media 1920, pre-fix chỉ tham chiếu).
 *  - ocean post-fix w1600/w1760/w2240/w2880, noise05 + noise10
 *    (nợ đợt 77 §4.7; pre-fix KHỚP không-d0, kỳ vọng vẫn KHỚP).
 *  - test-pattern quét cửa sổ w1280/w1760/w2240/w2560/w2880, noise05 +
 *    noise10 (săn case phân biệt G1 vs G2: w1920 đã sát nút ratio_R 0,95).
 *
 * Render tham chiếu: render-1k Z2 (fullrgb-{ocean,basgo,slovenska}-*.raw)
 * + R66T3/render/fullrgb-*.raw (test-pattern, media 1280 nên số Y2 vẫn
 * đúng sau C1 — xem D2 §3). Chấm "đúng" theo quy ước D2; chấm 4 luật
 * R0/G1/G2/G12 trên case mới + gộp với 23 case cũ (r77e6-g12.json +
 * r77e6-newcases.json) để xem G1 vs G2 có bất đồng lần đầu không.
 *
 * Chạy (từ gốc repo): node apps/web/scripts/r79g6-f7-recheck.mjs
 * JSON: hidden_files/round79-g6/r79g6-f7-recheck.json (KHÔNG ghi đè file F7 gốc).
 * Điểm gộp 73 case (harness hiện tại) do r79g6-combined.mjs tính từ các JSON recheck.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import { evalDelta0Case, scoreRule, b64ToRgb } from "./delta0-harness.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const E6 = path.join(GOAL, "round77-e6");
const F7 = path.join(GOAL, "round78-f7");
const G6 = path.join(GOAL, "round79-g6");
const OUT = path.join(G6, "r79g6-f7-recheck.json");

const RENDER = {
  ocean: { plain: "fullrgb-ocean-plain.raw", noise05: "fullrgb-ocean-noise05.raw", noise10: "fullrgb-ocean-noise10.raw", dir: RENDER_NEW },
  basgo: { plain: "fullrgb-basgo-plain.raw", noise05: "fullrgb-basgo-noise05.raw", noise10: "fullrgb-basgo-noise10.raw", dir: RENDER_NEW },
  slovenska: { plain: "fullrgb-slovenska-plain.raw", noise05: "fullrgb-slovenska-noise05.raw", noise10: "fullrgb-slovenska-noise10.raw", dir: RENDER_NEW },
  "test-pattern": { plain: "fullrgb-plain.raw", noise05: "fullrgb-noise05.raw", noise10: "fullrgb-noise10.raw", dir: R66T3 },
};

// [tên case, thư mục snapshot, file snaps, nguồn, mức noise]
const CASES = [
  // basgo/slovenska post-fix (2 cửa sổ × 2 nguồn × 2 mức noise).
  // Lưu ý: basgo w1440 run A hỏng (khung đen, D1/D3 FAIL) và slovenska
  // D3 run A/B rỗng (RAW_FN đọc nhầm element basgo) nên 3 cặp sau lấy
  // từ lần chạy lại 1-nguồn (r2) với RAW_FN đã vá chọn đúng element;
  // basgo w1920 giữ run B (lúc đó pool chỉ có 1 element nên D3 đúng).
  ["F7-post-fix-w1440-basgo-n05", "headed-w1440x900-basgo-r2", "r78f7-snaps-w1440x900.json", "basgo", "noise05"],
  ["F7-post-fix-w1440-basgo-n10", "headed-w1440x900-basgo-r2", "r78f7-snaps-w1440x900.json", "basgo", "noise10"],
  ["F7-post-fix-w1440-slovenska-n05", "headed-w1440x900-slovenska-r2", "r78f7-snaps-w1440x900.json", "slovenska", "noise05"],
  ["F7-post-fix-w1440-slovenska-n10", "headed-w1440x900-slovenska-r2", "r78f7-snaps-w1440x900.json", "slovenska", "noise10"],
  ["F7-post-fix-w1920-basgo-n05", "headed-w1920x1080-basgo-slovenska", "r78f7-snaps-w1920x1080.json", "basgo", "noise05"],
  ["F7-post-fix-w1920-basgo-n10", "headed-w1920x1080-basgo-slovenska", "r78f7-snaps-w1920x1080.json", "basgo", "noise10"],
  ["F7-post-fix-w1920-slovenska-n05", "headed-w1920x1080-slovenska-r2", "r78f7-snaps-w1920x1080.json", "slovenska", "noise05"],
  ["F7-post-fix-w1920-slovenska-n10", "headed-w1920x1080-slovenska-r2", "r78f7-snaps-w1920x1080.json", "slovenska", "noise10"],
  // ocean post-fix 4 cửa sổ (2 mức noise). w1600/w2240 lần đầu lỗi do
  // tải VM (cổng sẵn sàng 90 s / mount timeout) nên lấy từ lần chạy lại
  // r2; w1760/w2880 giữ lần đầu (3/3 pass).
  ["F7-post-fix-w1600-ocean-n05", "headed-w1600x900-ocean-r2", "r78f7-snaps-w1600x900.json", "ocean", "noise05"],
  ["F7-post-fix-w1600-ocean-n10", "headed-w1600x900-ocean-r2", "r78f7-snaps-w1600x900.json", "ocean", "noise10"],
  ["F7-post-fix-w1760-ocean-n05", "headed-w1760x1000-ocean", "r78f7-snaps-w1760x1000.json", "ocean", "noise05"],
  ["F7-post-fix-w1760-ocean-n10", "headed-w1760x1000-ocean", "r78f7-snaps-w1760x1000.json", "ocean", "noise10"],
  ["F7-post-fix-w2240-ocean-n05", "headed-w2240x1260-ocean-r2", "r78f7-snaps-w2240x1260.json", "ocean", "noise05"],
  ["F7-post-fix-w2240-ocean-n10", "headed-w2240x1260-ocean-r2", "r78f7-snaps-w2240x1260.json", "ocean", "noise10"],
  ["F7-post-fix-w2880-ocean-n05", "headed-w2880x1620-ocean", "r78f7-snaps-w2880x1620.json", "ocean", "noise05"],
  ["F7-post-fix-w2880-ocean-n10", "headed-w2880x1620-ocean", "r78f7-snaps-w2880x1620.json", "ocean", "noise10"],
  // test-pattern quét cửa sổ — săn Q3 (G1 áp, G2 từ chối). w2880 lần đầu
  // lỗi RelinkPanel timeout do tải VM nên lấy từ lần chạy lại r2.
  ["F7-sweep-w1280-testpattern-n05", "headed-w1280x800-testpattern", "r78f7-snaps-w1280x800.json", "test-pattern", "noise05"],
  ["F7-sweep-w1280-testpattern-n10", "headed-w1280x800-testpattern", "r78f7-snaps-w1280x800.json", "test-pattern", "noise10"],
  ["F7-sweep-w1760-testpattern-n05", "headed-w1760x1000-testpattern", "r78f7-snaps-w1760x1000.json", "test-pattern", "noise05"],
  ["F7-sweep-w1760-testpattern-n10", "headed-w1760x1000-testpattern", "r78f7-snaps-w1760x1000.json", "test-pattern", "noise10"],
  ["F7-sweep-w2240-testpattern-n05", "headed-w2240x1260-testpattern", "r78f7-snaps-w2240x1260.json", "test-pattern", "noise05"],
  ["F7-sweep-w2240-testpattern-n10", "headed-w2240x1260-testpattern", "r78f7-snaps-w2240x1260.json", "test-pattern", "noise10"],
  ["F7-sweep-w2560-testpattern-n05", "headed-w2560x1440-testpattern", "r78f7-snaps-w2560x1440.json", "test-pattern", "noise05"],
  ["F7-sweep-w2560-testpattern-n10", "headed-w2560x1440-testpattern", "r78f7-snaps-w2560x1440.json", "test-pattern", "noise10"],
  ["F7-sweep-w2880-testpattern-n05", "headed-w2880x1620-testpattern-r2", "r78f7-snaps-w2880x1620.json", "test-pattern", "noise05"],
  ["F7-sweep-w2880-testpattern-n10", "headed-w2880x1620-testpattern-r2", "r78f7-snaps-w2880x1620.json", "test-pattern", "noise10"],
];

async function main() {
  const cases = [];
  const docs = new Map();
  const loadDoc = (dir, file) => {
    const key = `${dir}/${file}`;
    if (!docs.has(key)) docs.set(key, JSON.parse(fs.readFileSync(path.join(F7, dir, file), "utf8")));
    return docs.get(key);
  };
  for (const [name, dir, file, src, lv] of CASES) {
    const doc = loadDoc(dir, file);
    const v = doc.snaps?.[src];
    if (!v?.plain || !v?.[lv]) { console.log(`  bỏ ${name}: thiếu ${src} plain/${lv} trong ${dir}/${file}`); continue; }
    const cfg = RENDER[src];
    const plain1280 = fs.readFileSync(path.join(cfg.dir, cfg.plain));
    const noise1280 = fs.readFileSync(path.join(cfg.dir, cfg[lv]));
    const rPlain = doc.rawFrames?.[src]?.plain, rNoise = doc.rawFrames?.[src]?.[lv];
    const d3 = rPlain?.ok && rNoise?.ok ? (rPlain.hash === rNoise.hash && rPlain.currentTime === rNoise.currentTime) : null;
    const d1 = v.plain2 ? v.plain.rgbB64 === v.plain2.rgbB64 : null;
    const c = evalDelta0Case({
      name, regime: "POST-FIX mới (F7, code C1)",
      prevPlain: b64ToRgb(v.plain.rgbB64), prevNoise: b64ToRgb(v[lv].rgbB64),
      plain1280, noise1280, vw: v.plain.w, vh: v.plain.h,
    });
    c.d1PlainIdentical = d1; c.d3SameFrame = d3; c.rawHash = rPlain?.hash;
    c.noiseLevel = lv; c.source = src;
    cases.push(c);
  }

  for (const c of cases) {
    console.log(`${c.name} rect=${c.rect} plainMad=${c.plainMad} perChanMad=${JSON.stringify(c.perChanMad)} d0std=${JSON.stringify(c.d0std)} residStd=${JSON.stringify(c.residStd)} ratio=${JSON.stringify(c.ratio)} corr=${JSON.stringify(c.corr)} D1=${c.d1PlainIdentical} D3=${c.d3SameFrame}`);
    console.log(`    noD0: ${c.verdictNoD0} dKurt=${JSON.stringify(c.kurtDiffNoD0)} dCorr=${JSON.stringify(c.corrDiffNoD0)} deltaMad=${c.deltaMadNoD0} | fullD0: ${c.verdictFullD0} dKurt=${JSON.stringify(c.kurtDiffFullD0)} dCorr=${JSON.stringify(c.corrDiffFullD0)} deltaMad=${c.deltaMadFullD0} | đúng=${c.correct}`);
    console.log(`    cổng: R0=${c.gates.R0_cu} G1=${c.gates.G1_d0stdR_le_2} G2=${c.gates.G2_ratioR_le_1} G12=${c.gates.G12_ca_hai} | verdict: R0=${c.verdictUnder.R0_cu} G1=${c.verdictUnder.G1_d0stdR_le_2} G2=${c.verdictUnder.G2_ratioR_le_1} G12=${c.verdictUnder.G12_ca_hai}`);
  }

  const scores = {};
  for (const rule of ["R0_cu", "G1_d0stdR_le_2", "G2_ratioR_le_1", "G12_ca_hai"]) {
    scores[rule] = scoreRule(cases, rule);
    console.log(`${rule} (case mới F7): đúng ${scores[rule].ok}/${scores[rule].total} (không chấm ${scores[rule].unscored})${scores[rule].badList.length ? " | SAI: " + scores[rule].badList.join("; ") : ""}`);
  }
  // KHÔNG gộp case cũ ở đây (JSON cũ tính bằng resample tiền-BC — xem
  // LIMITS G6 §3). Điểm gộp harness-hiện-tại do r79g6-combined.mjs tính
  // từ r79g6-e6-recheck.json + r79g6-e6-newcases-recheck.json +
  // r79g6-f7-recheck.json (file này) + r79g6-sweep.json.
  const report = {
    generated: new Date().toISOString(),
    harness: "apps/web/scripts/delta0-harness.mjs (luật chính G12)",
    resample: "chrome-resample.mjs HIỆN TẠI (C2 M4 + BC upscale F6)",
    cases, scores,
  };
  writeFileEpermRetry(OUT, JSON.stringify(report, null, 2));
  console.log(`\nJSON post-fix F7: ${OUT} (${cases.length} case mới)`);
  const g12 = scores.G12_ca_hai;
  if (g12.bad > 0) { console.log("KẾT QUẢ: G12 SAI trên case mới — xem badList trên"); process.exitCode = 1; }
  else console.log(`KẾT QUẢ: G12 đúng ${g12.ok}/${g12.total} case mới chấm được (không chấm ${g12.unscored})`);
}
main().catch((e) => { console.error(`G6-F7-RECHECK LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
