// parityHarness203.ts — Harness ĐỘC LẬP đo parity render-vs-preview, đợt 203 P4.
//
// Đo thật, không mock: preview = code TS thật trong repo chạy qua esbuild
// bundle; render = FFmpeg 8.1.2 thật + filter string lấy từ code render thật.
// Fixture tổng hợp xác định (seed cố định) để mọi số tái lập được.
// N12a GATE THEO QUYẾT (a4)-199 (parent, aggregate 199 §14.2): ở −12,
// gate = CAO ĐỘ AUTOCORR (errSt ≤ 0,1 st) + cao độ wide 10/10. Helper xuất
// ra: psolaAutocorrPitch + n12aGate203 (khóa trong parityHarness203.test.ts).
// Ở −7/+7/+12 thước mag cũ vẫn đứng (magTarget ≥ 10×magOrig). Tỉ số mag ở
// −12 chỉ còn là thông tin. Phần wide 10/10 kiểm bằng tái tính độc lập từ
// JSON headed thô của P1 (round203-p4/scratch/wide-rederive-203.mjs), không
// nằm trong sim lõi này.
// MỚI đợt 203 (so với 202):
// - N11a LUẬT CỤM ĐÃ SỬA THEO QUYẾT (a5)-202 (parent, aggregate 202 §14.2):
//   "1 cụm liên tiếp cùng playhead trong pass = 1 sự kiện" — BỎ yêu cầu
//   "cụm ở đầu pass" của (a5)-201. longA-201: 32 mẫu, 1 cụm, cùng playhead
//   300,3 s, bắt đầu idxInPass 10 → ĐẠT theo bản chất. Helper n11aVerdict203
//   nay nhận thêm firstClusterSamePlayhead; firstClusterAtStart chỉ còn để
//   ghi chú. Probe-201/202 đo riêng bằng scratch probe203-n11.mjs (cùng luật
//   S1/S2 + cụm của harness, verdict theo luật mới).
// - N12a-wide ĐÃ ĐO trên headed JSON P1-202 (chrome-2026-11-27T21-26-29-540Z.json,
//   publish 21:26Z sau khi P4-202 đóng): KẾT HỢP 20/20, band 20/20, WIDE 20/20,
//   mỗi run 10/10. CAVEAT: 2 run có pitchCurve/harmonicCurve giống hệt từng
//   số (lặp xác định) nên bằng chứng độc lập thực chất là 10 điểm, không 20.
// - N11a/N11b chạy lại trên dữ liệu P3-203 (benchmarks/reverse203/ +
//   ~/workspace/tmp-round203-p3/ + hidden_files/round203-p3/ tìm 203
//   TRƯỚC, rồi 202, rồi 201, rồi 200, rồi 199 — dữ liệu NHIỆM VỤ đợt này là P3-203,
//   quyết (r)-202).
// - Cap m 1,05 GIỮ NGUYÊN (quyết (a1)-201; P2-203 chưa đổi hằng số
//   DENOISE_MOTION_MULTIPLIER_MAX lúc harness 203 chạy — kiểm lại lúc chạy).
//   Đường đối chiếu cap 1,12 cũ (m112/α112, tính từ neo P2) vẫn giữ.
// - MỚI: thước R_rel theo σ (nợ (a1)-199): sectionRrelSigma203 đo độc lập
//   R_rel ở σ=5/10/15 trên cùng fixture N5b (pipeline α thích nghi) —
//   GHI NHẬN, không verdict (bar 0,15 KHÔNG đổi đợt này, quyết (a1)-199).
// - N10/N5b chạy lại tươi trên code enhancePreview hiện tại (pipeline α thích
//   nghi của P2-198); bar R_rel 0,15 VẪN ĐỨNG (quyết (a1)-198: N10 ĐẠT lần đầu đợt 198).
//   Harness NỐI α thích nghi vào N10/N5b bằng ĐÚNG hàm thuần P2 ship
//   (motionEstimateFromBandLuma C5b_box + denoiseMotionMultiplier): α199 =
//   α_cố_định × m(M); đường α cố định giữ làm đối chiếu hồi quy.
//   (Tên biến/khóa số *199 giữ nguyên theo lineage pipeline P2-198 đã kiểm
//   ở đợt 199 — để so trực tiếp được giữa các đợt, không phải số cũ.)
// - N11a dùng quy tắc lọc S2 làm thước CHÍNH (quyết (a4)-197). Chirp-70s
//   KHÔNG là fixture bar N11a (quyết (a4)-196: bin 0,611 s > bar 0,5 s).
// Hồi quy: toàn bộ record đợt 202 chạy lại; headed voice/seek dùng
// JSON 203 khi có, nếu chưa có thì GHI NHẬN, không verdict từ số cũ
// (code voice đã đổi sang PSOLA từ 196; dữ liệu WSOLA 195 hết hiệu lực).
// // Fixture denoise giữ nguyên seed đợt 191 (19100+f) để so trực tiếp được.
//
// Đợt 203: harness TÁCH thành nhiều module (parityHarness203-*.ts) để mỗi file
// dưới trần push 37.768 B — file này (entry) chỉ còn header + main + re-export;
// cùng code, chỉ chia file, coverage/số đo không đổi (đã chạy lại + diff report).
//
// Chạy (từ gốc repo, xem scripts/parity203-run.mjs):
//   ./node_modules/.bin/esbuild apps/web/src/lib/parityHarness203.ts \
//     --bundle --format=esm --platform=node \
//     --outfile=/tmp/parity203/harness.mjs && node /tmp/parity203/harness.mjs
//
// Tiêu chí pixel (theo harness V6 / effectCanvas.parity.test.ts):
//   KHỚP    = MAD <= 2   và >= 99% pixel lệch <= 8 (mỗi kênh, max)
//   XẤP XỈ  = MAD <= 20  và >= 90% pixel lệch <= 32
//   CHƯA ĐẠT = ngoài 2 band trên.
// Verdict từng mục: ĐẠT / CHƯA ĐẠT (ghi rõ tier đạt được).
// Âm thanh: đo bằng Goertzel trên PCM thật (không nghe bằng tai).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { denoiseBlendAlpha } from "./enhancePreview";
import {
  REPO,
  TMP,
  compareFrames,
  decodeAudioToPcm,
  patternFrame,
  record,
  results,
  spectralPeak,
  writeSineWav,
} from "./parityHarness203-core";
import { sectionDenoise, sectionNoise, sectionSharpen, sectionSharpenNoisy } from "./parityHarness203-denoise";
import { sectionPitchArtifactSim, sectionVoicePreview, sectionVoiceRender } from "./parityHarness203-voice";
import { sectionReverseAudio, sectionReverseSmooth, sectionReverseVideo, sectionScrubReverse } from "./parityHarness203-reverse";
import { sectionDeint } from "./parityHarness203-deint";
import { sectionDeintMotion } from "./parityHarness203-deint-motion";
import { sectionHeadedSeek, sectionHeadedVoice } from "./parityHarness203-headed";
import { sectionDriftCeiling203 } from "./parityHarness203-drift";
import { sectionPsola203, sectionPsolaSim203, sectionRrelSigma203 } from "./parityHarness203-psola";

// Re-export helper thuần cho parityHarness203.test.ts (import 1 chỗ như trước).
export {
  compareFrames,
  decodeAudioToPcm,
  goertzelMag,
  isLaggingPeak,
  isStalePeak,
  linearFit,
  motionMultiplierCap112,
  n11aVerdict203,
  patternFrame,
  psnrOf,
  spectralPeak,
  wrapDrift,
  writeSineWav,
} from "./parityHarness203-core";
export { pitchShifterSim } from "./parityHarness203-voice";
export {
  bobFirstPreview,
  bobFirstPreview196,
  combingRLuma,
  deintBobFieldSim,
  deintBobSim,
  deintHalfResSim,
  tapShiftVerticalSim,
} from "./parityHarness203-deint";
export { n12aGate203, psolaAutocorrPitch, psolaShiftSim } from "./parityHarness203-psola";

function sectionP2Fps203(): void {
  console.log("== N13 fps nguồn media (P2-203) — kiểm file/code + LIMITS P2 ==");
  let limitsCandidates: string[] = [];
  try {
    limitsCandidates = fs.readdirSync(path.join(REPO, "docs"))
      .filter((f) => /^PHASE9_ROUND203_P2_.*\.md$/.test(f))
      .sort()
      .map((f) => `docs/${f}`);
  } catch { limitsCandidates = []; }
  let limits = "";
  let limitsFound = "";
  for (const cand of limitsCandidates) {
    try { limits = fs.readFileSync(path.join(REPO, cand), "utf8"); limitsFound = cand; break; } catch { /* thử tên sau */ }
  }
  let mediaSrc = "";
  try { mediaSrc = fs.readFileSync(path.join(REPO, "apps/web/src/media.ts"), "utf8"); } catch { mediaSrc = ""; }
  const fpsInCode = /fps\s*[:?]/.test(mediaSrc);
  if (!limits) {
    record({
      id: "N13-fps-source-media",
      name: "fps nguồn media ghi trong MediaItem (P2-198: fps:30)",
      verdict: "GHI NHẬN",
      numbers: { fps_field_in_media_ts: fpsInCode ? 1 : 0 },
      notes: `P2-203 chưa đóng cờ (chưa có docs/PHASE9_ROUND203_P2_*.md) — chưa kiểm được claim fps:30. media.ts ${fpsInCode ? "CÓ" : "KHÔNG có"} trường fps. Chạy lại harness sau khi P2-203 đóng cờ.`,
    });
    return;
  }
  const fpsLines = limits.split("\n").filter((l) => /fps/i.test(l)).slice(0, 5);
  record({
    id: "N13-fps-source-media",
    name: "fps nguồn media ghi trong MediaItem (P2-198: fps:30)",
    verdict: "GHI NHẬN",
    numbers: { fps_field_in_media_ts: fpsInCode ? 1 : 0, limits_has_fps_claim: fpsLines.length > 0 ? 1 : 0 },
    notes: `P2-203 đã đóng cờ (${limitsFound}); claim fps trong LIMITS P2-203: ${fpsLines.join(" / ").slice(0, 300) || "(không tìm thấy dòng fps)"}. media.ts ${fpsInCode ? "CÓ" : "KHÔNG có"} trường fps. GHI NHẬN vì fps headed là probe riêng của P2 (requestVideoFrameCallback lúc import) — P4 chỉ kiểm file/code + LIMITS, không đo lại độc lập.`,
  });
}

// ---------------------------------------------------------------------------
// Self-test (khóa harness): forward MAD=0 đã có ở S6-control; thêm Goertzel
// trên sine khô + PSNR identity.
// ---------------------------------------------------------------------------
function selfTest(): void {
  const sine = path.join(TMP, "self-sine.wav");
  writeSineWav(sine, [440], [0.5], 0.5);
  const { samples, sr } = decodeAudioToPcm(sine);
  const peak = spectralPeak(samples, sr, 400, 480, 1);
  if (Math.abs(peak.freq - 440) > 2) throw new Error(`self-test Goertzel: đỉnh ${peak.freq}Hz, kỳ vọng 440Hz`);
  const a = patternFrame(16, 16);
  const m = compareFrames(a, Buffer.from(a), 16, 16);
  if (m.mad !== 0 || m.psnr !== Infinity) throw new Error(`self-test compare identity: MAD=${m.mad} PSNR=${m.psnr}`);
  if (Math.abs(denoiseBlendAlpha(0.5) - 0.486) > 1e-9) throw new Error("self-test denoiseBlendAlpha(0.5) != 0.486");
  console.log("self-test OK: Goertzel 440Hz, compare identity MAD=0/PSNR=inf, alpha(0.5)=0.486");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : path.join(TMP, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const ffv = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  console.log(`parityHarness203 — FFmpeg ${ffv.stdout.split("\n")[0]} — node ${process.version}`);
  console.log(`TMP=${TMP} OUT=${outDir}`);
  selfTest();
  sectionSharpen();
  sectionDenoise();
  sectionNoise();
  sectionVoiceRender();
  sectionVoicePreview();
  sectionSharpenNoisy();
  sectionDeint();
  sectionDeintMotion();
  sectionRrelSigma203();
  sectionP2Fps203();
  sectionPitchArtifactSim();
  sectionPsolaSim203();
  sectionHeadedVoice(outDir);
  sectionPsola203(outDir);
  sectionReverseVideo();
  await sectionReverseAudio();
  sectionHeadedSeek(outDir);
  sectionScrubReverse();
  sectionReverseSmooth();
  sectionDriftCeiling203();
  const passed = results.filter((r) => r.verdict === "ĐẠT").length;
  const failed = results.filter((r) => r.verdict === "CHƯA ĐẠT");
  const noted = results.filter((r) => r.verdict === "GHI NHẬN").length;
  const total = passed + failed.length;
  console.log(`\n== TỔNG: ${passed}/${total} ĐẠT; CHƯA ĐẠT: ${failed.map((r) => r.id).join(", ") || "không có"}; GHI NHẬN (không verdict): ${noted} ==`);
  fs.writeFileSync(path.join(outDir, "parity203-report.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ffmpeg: ffv.stdout.split("\n")[0], passed, total, noted, results }, null, 2));
  console.log(`JSON: ${path.join(outDir, "parity203-report.json")}`);
  // Dọn TMP của chính lần chạy này (trung gian wav/raw/yuv 50–85 MB) —
  // /tmp là tmpfs 512 MB; 4 lần chạy không dọn đã làm đầy và crash run 3
  // bằng ENOSPC giữa sectionDeint (F-195-P4-4). Báo cáo đã ghi ra outDir.
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* không chặn verdict */ }
  if (failed.length > 0) process.exitCode = 1;
}

// Chỉ chạy main khi file được chạy trực tiếp làm harness (runner
// parity203-run.mjs đặt PARITY203_RUN_MAIN=1), không chạy khi test
// import helper (parityHarness203.test.ts) — esbuild gộp cả hai vào
// 1 bundle nên không phân biệt được bằng import.meta.url/argv[1].
if (process.env.PARITY203_RUN_MAIN === "1") {
  void main();
}
