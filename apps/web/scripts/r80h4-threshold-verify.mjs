#!/usr/bin/env node
/**
 * r80h4-threshold-verify.mjs — Phase 9 đợt 80, luồng H4: XÁC MINH 4 ứng
 * viên lật ngưỡng ở 0,36 (từ r80h4-threshold.mjs bước 1) bằng re-eval
 * ĐẦY ĐỦ từ snapshot gốc — lấy okStd + kurtDiff KHÔNG làm tròn để kết
 * luận chắc chắn mode nào lật ở 0,36, mode nào không.
 *
 * PHƯƠNG PHÁP: sao chép pipeline evalDelta0Case (delta0-harness.mjs)
 * nhưng giữ lại toàn bộ đối tượng fullDeltaStats (okStd/okCorr/kurtDiff
 * chính xác, không làm tròn) thay vì chỉ verdict. Chạy ở ngưỡng gốc
 * 0,35 trước để đối chiếu với JSON G6 (phải khớp verdict/kurtDiff đã
 * lưu trong 0,001), rồi tính verdict ở 0,34/0,36 từ cùng số liệu.
 * 4 ứng viên (mode LỆCH ở 0,35, maxKurt làm tròn 0,36, okCorr):
 *  1. D2-post-fix-w1920-ocean-n05 [fullD0]
 *  2. F7-post-fix-w1760-ocean-n05 [fullD0]
 *  3. F7-sweep-w1760-testpattern-n10 [noD0]
 *  4. G6-sweep-w2048-testpattern-n10 [fullD0]
 * Hệ quả nếu lật: (4) làm G12 hết sai duy nhất (66/67 → 67/67);
 * (1)(2) làm R0 bớt sai; (3) làm case cả-hai-LỆCH thành chấm được và
 * cả 4 luật đều sai trên đó.
 *
 * JSON: hidden_files/round80-h4/r80h4-threshold-verify.json.
 * KHÔNG push/tag/binary/workflow. Không sửa code production, không sửa
 * script lịch sử, không sửa delta0-harness.mjs (chỉ import).
 */
import fs from "node:fs";
import { writeFileEpermRetry } from "./eperm-retry.mjs";
import os from "node:os";
import path from "node:path";
import {
  absMad, b64ToRgb, channelStats, delta0Viewport_70x6, fullDeltaStats,
} from "./delta0-harness.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const GOAL = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const Z2 = path.join(GOAL, "round72-z2");
const RENDER_NEW = path.join(Z2, "render-1k");
const R66T3 = path.join(GOAL, "round66-t3", "render");
const D2 = path.join(GOAL, "round76-d2");
const F7 = path.join(GOAL, "round78-f7");
const G6 = path.join(GOAL, "round79-g6");
const H4 = path.join(GOAL, "round80-h4");
fs.mkdirSync(H4, { recursive: true });
const OUT = path.join(H4, "r80h4-threshold-verify.json");

const RENDER = {
  ocean: { plain: "fullrgb-ocean-plain.raw", noise05: "fullrgb-ocean-noise05.raw", noise10: "fullrgb-ocean-noise10.raw", dir: RENDER_NEW },
  "test-pattern": { plain: "fullrgb-plain.raw", noise05: "fullrgb-noise05.raw", noise10: "fullrgb-noise10.raw", dir: R66T3 },
};

// [tên case, thư mục snapshot, file snaps, nguồn, mức noise, thư mục gốc snapshot]
const CASES = [
  ["D2-post-fix-w1920-ocean-n05", "headed-w1920x1080-ocean", "r74b1-snaps-w1920x1080.json", "ocean", "noise05", D2],
  ["F7-post-fix-w1760-ocean-n05", "headed-w1760x1000-ocean", "r78f7-snaps-w1760x1000.json", "ocean", "noise05", F7],
  ["F7-sweep-w1760-testpattern-n10", "headed-w1760x1000-testpattern", "r78f7-snaps-w1760x1000.json", "test-pattern", "noise10", F7],
  ["G6-sweep-w2048-testpattern-n10", "headed-w2048x1152", "r79g6-snaps-w2048x1152.json", "test-pattern", "noise10", G6],
];

function evalFull(name, prevPlain, prevNoise, plain1280, noise1280, vw, vh) {
  // Sao chép evalDelta0Case nhưng giữ fullDeltaStats đầy đủ.
  const renderPlainTri = resampleRgb24Trilinear(plain1280, 1280, 720, vw, vh);
  const renderNoiseTri = resampleRgb24Trilinear(noise1280, 1280, 720, vw, vh);
  const d0 = delta0Viewport_70x6(plain1280, 1280, 720, vw, vh);
  const d0std = channelStats(Float64Array.from(d0)).std;
  const n = vw * vh;
  const resid = new Float64Array(n * 3);
  for (let i = 0; i < n * 3; i++) resid[i] = prevPlain[i] - renderPlainTri[i];
  const residStd = channelStats(resid).std;
  const stNo = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, null);
  const stFull = fullDeltaStats(prevPlain, prevNoise, renderPlainTri, renderNoiseTri, vw, vh, d0);
  return {
    name, rect: `${vw}x${vh}`, plainMad: absMad(prevPlain, renderPlainTri).mad,
    d0std, residStd,
    noD0: { okStd: stNo.okStd, okKurt: stNo.okKurt, okCorr: stNo.okCorr, stdRatio: stNo.stdRatio, kurtDiff: stNo.kurtDiff, corrDiff: stNo.corrDiff, verdict035: stNo.verdict },
    fullD0: { okStd: stFull.okStd, okKurt: stFull.okKurt, okCorr: stFull.okCorr, stdRatio: stFull.stdRatio, kurtDiff: stFull.kurtDiff, corrDiff: stFull.corrDiff, verdict035: stFull.verdict },
  };
}

function verdictAt(mode, t) {
  const maxK = Math.max(...mode.kurtDiff);
  const ok = mode.okStd && mode.okCorr && maxK <= t;
  return { verdict: ok ? "KHỚP-THỐNG-KÊ" : "LỆCH-THỐNG-KÊ", maxKurtExact: maxK, okStd: mode.okStd, okCorr: mode.okCorr };
}

async function main() {
  // Đối chiếu baseline với JSON G6 đã lưu (kurtDiff làm tròn 0,001).
  const refFiles = [
    path.join(G6, "r79g6-e6-recheck.json"),
    path.join(G6, "r79g6-f7-recheck.json"),
    path.join(G6, "r79g6-sweep.json"),
  ];
  const refByName = new Map();
  for (const f of refFiles) {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const c of j.cases || []) refByName.set(c.name, c);
  }
  const results = [];
  for (const [name, dir, file, src, lv, base] of CASES) {
    const doc = JSON.parse(fs.readFileSync(path.join(base, dir, file), "utf8"));
    const v = doc.snaps?.[src];
    if (!v?.plain || !v?.[lv]) { console.log(`  bỏ ${name}: thiếu ${src} plain/${lv}`); continue; }
    const cfg = RENDER[src];
    const plain1280 = fs.readFileSync(path.join(cfg.dir, cfg.plain));
    const noise1280 = fs.readFileSync(path.join(cfg.dir, cfg[lv]));
    const r = evalFull(name, b64ToRgb(v.plain.rgbB64), b64ToRgb(v[lv].rgbB64), plain1280, noise1280, v.plain.w, v.plain.h);
    const ref = refByName.get(name);
    const matchNo = ref ? r.noD0.kurtDiff.every((x, i) => Math.abs(x - ref.kurtDiffNoD0[i]) <= 0.001) && r.noD0.verdict035 === ref.verdictNoD0 : null;
    const matchFull = ref ? r.fullD0.kurtDiff.every((x, i) => Math.abs(x - ref.kurtDiffFullD0[i]) <= 0.001) && r.fullD0.verdict035 === ref.verdictFullD0 : null;
    r.baselineMatchesStoredJson = { noD0: matchNo, fullD0: matchFull };
    r.at034 = { noD0: verdictAt(r.noD0, 0.34), fullD0: verdictAt(r.fullD0, 0.34) };
    r.at036 = { noD0: verdictAt(r.noD0, 0.36), fullD0: verdictAt(r.fullD0, 0.36) };
    results.push(r);
    console.log(`== ${name} rect=${r.rect} plainMad=${r.plainMad} d0std=${JSON.stringify(r.d0std)} residStd=${JSON.stringify(r.residStd)} ==`);
    console.log(`  baseline 0,35 khớp JSON đã lưu: noD0=${matchNo} fullD0=${matchFull}`);
    for (const m of ["noD0", "fullD0"]) {
      const s = r[m];
      console.log(`  ${m}: okStd=${s.okStd} okCorr=${s.okCorr} stdRatio=${JSON.stringify(s.stdRatio)} kurtDiff(chính xác)=${JSON.stringify(s.kurtDiff)} corrDiff=${JSON.stringify(s.corrDiff)}`);
      console.log(`       verdict 0,35=${s.verdict035} | 0,34=${r.at034[m].verdict} | 0,36=${r.at036[m].verdict}`);
    }
  }
  writeFileEpermRetry(OUT, JSON.stringify({ generated: new Date().toISOString(), results }, null, 2));
  console.log(`\nJSON xác minh ngưỡng: ${OUT}`);
}
main().catch((e) => { console.error(`H4-THRESHOLD-VERIFY LỖI: ${e.stack || e.message}`); process.exitCode = 2; });
