#!/usr/bin/env node
/**
 * fastMotion.js — Detector chuyển động nhanh cho cảnh báo denoise ≥0,7
 * (Phase 9 đợt 64, luồng R2 — đóng nợ đợt 63 R2 §8 mục 2).
 *
 * Bối cảnh (đợt 63 R2, docs/PHASE9_ROUND63_R2_RENDER_COST_LIMITS.md §3):
 * denoise ≥0,7 trên clip chuyển động nhanh làm tăng ghosting/trail rõ —
 * hệ số blend dải small (2<|dC|≤8) nhảy mạnh nhất ở 0,5→0,7 (+0,10).
 * Cảnh báo cũ không có detector chuyển động nhanh; module này đo chuyển
 * động THẬT của clip nguồn rồi phân loại, để UI cảnh báo đúng lúc.
 *
 * QUY TẮC CẢNH BÁO — ĐỔI Ở ĐỢT 65 S2 (xem docs/PHASE9_ROUND65_S2_LIMITS.md):
 * quy tắc cũ (đợt 64 R2) chỉ cảnh báo khi clip NHANH (FAST ≥ 6,0). Đo
 * trên footage thật (R4: 4 đoạn 0,6–7,9 px/f; đợt 65 S2: pan 12 px/f +
 * đối chứng tĩnh) chứng minh bước nhảy ghost 0,5→0,7 gần như KHÔNG ĐỔI
 * theo tốc độ (+0,057–0,083 ở mọi đoạn thật 0,6–13,6 px/f, kể cả camera
 * gần như đứng yên) — cổng cũ bỏ sót 4/6 clip thật ghost-positive (false negative).
 * Vì vậy từ đợt 65 S2: cảnh báo ở denoise ≥0,7 với MỌI mức chuyển động
 * đo được (slow/medium/fast); detector vẫn đo và vẫn hiện score + level
 * trong câu cảnh báo để user tự đánh giá; unknown vẫn cảnh báo chung
 * riêng (caller tự quyết). Ngưỡng phân loại FAST=6,0/MEDIUM=4,0 GIỮ
 * NGUYÊN — chúng mô tả lượng thay đổi pixel, không còn là cổng cảnh báo;
 * không có ngưỡng nào phân tách được tốc độ pan trên footage thật (cùng
 * 12 px/f, mặt nước phẳng cho 2,1 slow trong khi đường phố cho 9,7 fast).
 *
 * Định nghĩa metric (CHIA SẺ với web — xem
 * apps/web/src/components/enhance/fastMotion.ts, phải giữ đồng bộ):
 *   1. Downscale frame về 160×90, grayscale — rẻ, đủ phân biệt chuyển
 *      động, và khớp khổ MAD của các đợt 61/63 (320×180 gray, chia 2).
 *   2. Làm mờ nhẹ (gblur sigma=1, tương đương box blur 3×3 ở web) để
 *      nhiễu hạt không đội điểm chuyển động lên — phim nhiễu tĩnh phải
 *      đo thấp, phim pan thật phải đo cao (kiểm chứng ở harness đợt 64
 *      R2: static-noisy vs pan-fast).
 *   3. Điểm = mean |Δ| giữa 2 frame kề đã mờ, tính trên thang 0–255,
 *      lấy mẫu ở 30fps CỐ ĐỊNH (filter fps=30 trước khi diff — nguồn
 *      60fps bị lược bớt, nguồn 24fps bị nhân đôi frame ~20%, cả hai
 *      đều là xấp xỉ đã ghi rõ). KHÔNG chuẩn hoá tuyến tính theo gap:
 *      đã thử lấy mẫu 5fps rồi chia 6 và BỊ BÁC BỎ bằng số đo (pan
 *      24px/frame: 9,19 ở 30fps nhưng chỉ 3,80 sau chuẩn hoá — vì |Δ|
 *      bão hoà khi nội dung pixel đã đổi hẳn, không tăng tuyến tính
 *      theo khoảng cách frame; shaky còn tệ hơn: 9,86 → 1,31).
 *      Xem LIMITS đợt 64 R2 §2.3.
 *   4. Phân loại theo ngưỡng hiệu chuẩn trên clip thật (xem LIMITS đợt
 *      64 R2 §2 + đợt 65 S2 §2–§3): score < MEDIUM → "slow";
 *      MEDIUM..FAST → "medium" (vùng xám); ≥ FAST → "fast". Level chỉ
 *      còn là thông tin hiển thị trong câu cảnh báo — KHÔNG còn là cổng
 *      quyết định có cảnh báo hay không (đổi ở đợt 65 S2, xem trên).
 *
 * Vì sao MAD mà không phải phase correlation: ghosting của hqdn3d phụ
 * thuộc ĐỘ THAY ĐỔI PIXEL giữa 2 frame, bất kể do pan máy quay hay vật
 * thể chuyển động — MAD đo đúng thứ gây ghost. Phase correlation (đợt 63
 * R2 §4) chỉ đo dịch chuyển toàn cục, đã bị bác bỏ làm metric jitter vì
 * dao động hơn MAD, và cần OpenCV (nặng) trong khi MAD chỉ cần ffmpeg
 * decode ở khổ nhỏ. Giới hạn: MAD không phân biệt pan thật với thay đổi
 * nội dung nhanh (vd cắt cảnh dồn dập) — cả hai đều gây ghost nên cảnh
 * báo vẫn đúng hướng; xem LIMITS §6.
 *
 * Cách đo (rẻ): MỘT lần ffmpeg decode về rawvideo gray 160×90 (không
 * encode lại), tính diff bằng JS thuần. Không dùng phase correlation,
 * không optical flow, không export motion vector.
 *
 * CLI:
 *   node fastMotion.js --media <file> [--json]
 *   node fastMotion.js --self-test
 */
"use strict";

const { spawnSync } = require("child_process");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

/** Khổ đo: đủ nhỏ để decode rẻ, đủ lớn để pan vài px vẫn thấy. */
const MEASURE_WIDTH = 160;
const MEASURE_HEIGHT = 90;
/** Sigma làm mờ không gian trước khi diff (khử nhiễu hạt). */
const BLUR_SIGMA = 1;
/** Fps chuẩn để chuẩn hoá score về "mỗi frame 30fps". */
const REF_FPS = 30;

/**
 * Ngưỡng phân loại (mức xám 0–255, mean |Δ| mỗi cặp frame kề ở 30fps).
 * Hiệu chuẩn đợt 64 R2 trên clip 720p 5s (xem LIMITS §2 + harness
 * test_round64_r2_fast_motion.js): static-clean ≈ 0,00; static-noisy
 * (alls=15, đã mờ) ≈ 0,43; pan chậm 6px/frame ≈ 2,83; pan nhanh
 * 24px/frame ≈ 9,19; pan rất nhanh 48px/frame ≈ 13,75; shaky tremor
 * ±7px ≈ 9,86; shaky+noise ≈ 10,21. Ngưỡng FAST = 6,0 nằm giữa pan
 * chậm (2,83) và pan nhanh (9,19) — đúng vùng b_small nhảy mạnh nhất
 * (đợt 63 R2 §3.2). MEDIUM = 4,0 là vùng xám (không cảnh báo).
 * WEB PHẢI GIỮ CÙNG SỐ — harness assert đồng bộ với fastMotion.ts.
 */
const MEDIUM_THRESHOLD = 4.0;
const FAST_THRESHOLD = 6.0;

/** Ngưỡng cảnh báo denoise (đợt 63 R2 §3.2: bước nhảy b_small lớn nhất ở 0,5→0,7). */
const DENOISE_WARN_STRENGTH = 0.7;

/**
 * Box blur 3×3 trên ảnh gray (Uint8Array, w×h), viền giữ nguyên.
 * Tương đương gblur sigma≈1 của ffmpeg ở khổ nhỏ (cả hai chỉ nhằm triệt
 * nhiễu hạt tần số cao trước khi diff — xem LIMITS §2.4 về sai lệch).
 */
function boxBlur3(gray, w, h) {
  const out = new Uint8Array(gray.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += gray[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = Math.round(sum / n);
    }
  }
  return out;
}

/**
 * Điểm chênh lệch giữa 2 frame gray cùng kích thước: mean |Δ| + tỉ lệ
 * pixel rơi vào dải small (2<|Δ|≤8) — dải nhạy ghost nhất (đợt 63 R2 §3.2).
 * Trả { meanAbsDiff, smallBandShare }.
 */
function framePairDiff(a, b) {
  if (a.length !== b.length) throw new Error("framePairDiff: 2 frame khác kích thước");
  let sum = 0;
  let small = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    sum += d;
    if (d > 2 && d <= 8) small++;
  }
  return { meanAbsDiff: sum / a.length, smallBandShare: small / a.length };
}

/**
 * Phân loại mức chuyển động từ score đã chuẩn hoá (mỗi frame 30fps).
 * "medium" là vùng xám — KHÔNG cảnh báo, chỉ để UI/harness ghi nhận.
 */
function classifyMotion(score) {
  if (!Number.isFinite(score) || score < 0) throw new Error(`classifyMotion: score không hợp lệ ${score}`);
  if (score >= FAST_THRESHOLD) return "fast";
  if (score >= MEDIUM_THRESHOLD) return "medium";
  return "slow";
}

/**
 * Có nên cảnh báo ghosting denoise không: strength ≥0,7 VÀ đã đo được
 * chuyển động (slow/medium/fast đều cảnh báo — xem đầu file: R4 + đợt 65
 * S2 chứng minh clip chậm/vừa vẫn ghost như clip nhanh trên footage thật).
 * Chưa đo được (unknown/undefined) → KHÔNG cảnh báo cụ thể, caller tự
 * quyết fallback chung (xem fastMotion.ts ở web).
 */
function shouldWarnDenoiseGhosting(strength, motionLevel) {
  if (typeof strength !== "number" || !Number.isFinite(strength)) return false;
  return strength >= DENOISE_WARN_STRENGTH &&
    (motionLevel === "slow" || motionLevel === "medium" || motionLevel === "fast");
}

function median(xs) {
  const s = [...xs].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function percentile(xs, p) {
  const s = [...xs].sort((x, y) => x - y);
  if (s.length === 0) return 0;
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

/**
 * Đo chuyển động của 1 file video bằng ffmpeg (decode rawvideo gray
 * 160×90 ở 30fps cố định, diff bằng JS). Trả:
 *   { score, level, meanAbsDiff, medianAbsDiff, p90AbsDiff,
 *     smallBandShare, nPairs, sampleFps: 30, durationSec,
 *     costMs, msPerClipSec }
 * score = meanAbsDiff (mean |Δ| mỗi cặp frame kề ở 30fps, đã mờ nhẹ).
 * Ném lỗi nếu file không tồn tại / ffmpeg fail / quá ít frame.
 */
function measureMotion(mediaPath) {
  if (!fs.existsSync(mediaPath)) throw new Error(`measureMotion: không thấy file ${mediaPath}`);
  const t0 = Date.now();
  const vf = `fps=${REF_FPS},scale=${MEASURE_WIDTH}:${MEASURE_HEIGHT},format=gray,gblur=sigma=${BLUR_SIGMA}`;
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", mediaPath, "-vf", vf,
    "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 512 * 1024 * 1024 });
  const costMs = Date.now() - t0;
  if (r.error) throw new Error(`measureMotion: không chạy được ffmpeg: ${r.error.message}`);
  if (r.status !== 0) {
    throw new Error(`measureMotion: ffmpeg lỗi (${r.status}): ${(r.stderr || "").toString().slice(-500)}`);
  }
  const frameBytes = MEASURE_WIDTH * MEASURE_HEIGHT;
  const buf = r.stdout;
  const nFrames = Math.floor(buf.length / frameBytes);
  if (nFrames < 3) throw new Error(`measureMotion: chỉ decode được ${nFrames} frame (cần ≥3)`);
  const diffs = [];
  const smallShares = [];
  let prev = null;
  for (let i = 0; i < nFrames; i++) {
    const frame = buf.subarray(i * frameBytes, (i + 1) * frameBytes);
    if (prev) {
      const d = framePairDiff(prev, frame);
      diffs.push(d.meanAbsDiff);
      smallShares.push(d.smallBandShare);
    }
    prev = frame;
  }
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const med = median(diffs);
  const p90 = percentile(diffs, 0.9);
  const smallMean = smallShares.reduce((a, b) => a + b, 0) / smallShares.length;
  // Thời lượng ước lượng từ số frame ở 30fps (đủ cho msPerClipSec).
  const durationSec = nFrames / REF_FPS;
  const score = mean;
  return {
    score: +score.toFixed(3),
    level: classifyMotion(score),
    meanAbsDiff: +mean.toFixed(3),
    medianAbsDiff: +med.toFixed(3),
    p90AbsDiff: +p90.toFixed(3),
    smallBandShare: +smallMean.toFixed(4),
    nPairs: diffs.length,
    sampleFps: REF_FPS,
    durationSec: +durationSec.toFixed(2),
    costMs,
    msPerClipSec: +(costMs / durationSec).toFixed(1),
  };
}

function selfTest() {
  // framePairDiff: 2 frame giống hệt → 0; lệch đều 10 → 10, small=0.
  const a = new Uint8Array([10, 20, 30, 40]);
  const b = new Uint8Array([10, 20, 30, 40]);
  const d0 = framePairDiff(a, b);
  assert.equal(d0.meanAbsDiff, 0);
  assert.equal(d0.smallBandShare, 0);
  const c = new Uint8Array([20, 30, 40, 50]);
  const d1 = framePairDiff(a, c);
  assert.equal(d1.meanAbsDiff, 10);
  assert.equal(d1.smallBandShare, 0); // |Δ|=10 > 8, ngoài dải small
  const e = new Uint8Array([15, 25, 35, 45]); // |Δ|=5 → toàn dải small
  const d2 = framePairDiff(a, e);
  assert.equal(d2.meanAbsDiff, 5);
  assert.equal(d2.smallBandShare, 1);
  // boxBlur3: điểm nóng giữa nền phẳng bị làm mờ xuống.
  const hot = new Uint8Array(9).fill(0);
  hot[4] = 90;
  const blurred = boxBlur3(hot, 3, 3);
  assert.equal(blurred[4], 10); // 90/9
  assert.equal(blurred[0], 23); // góc chỉ có 4 ô trong khung: 90/4 = 22,5 → 23
  // classifyMotion: đúng ngưỡng hiệu chuẩn (khóa số — đổi ngưỡng phải sửa cả web + harness).
  assert.equal(classifyMotion(0.3), "slow");
  assert.equal(classifyMotion(3.1), "slow");
  assert.equal(classifyMotion(4.0), "medium");
  assert.equal(classifyMotion(5.9), "medium");
  assert.equal(classifyMotion(6.0), "fast");
  assert.equal(classifyMotion(9.4), "fast");
  assert.throws(() => classifyMotion(-1));
  assert.throws(() => classifyMotion(NaN));
  // shouldWarnDenoiseGhosting: cảnh báo ở ≥0,7 với MỌI mức đo được
  // (đổi ở đợt 65 S2 theo số đo footage thật R4 + S2 — cổng cũ chỉ-fast
  // bỏ sót 4/6 clip thật ghost-positive; xem đầu file).
  assert.equal(shouldWarnDenoiseGhosting(0.8, "fast"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.7, "fast"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.69, "fast"), false);
  assert.equal(shouldWarnDenoiseGhosting(1.0, "fast"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.8, "slow"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.8, "medium"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.7, "slow"), true);
  assert.equal(shouldWarnDenoiseGhosting(0.5, "fast"), false);
  assert.equal(shouldWarnDenoiseGhosting(0.8, "unknown"), false);
  assert.equal(shouldWarnDenoiseGhosting(0.8, undefined), false);
  assert.equal(shouldWarnDenoiseGhosting(NaN, "fast"), false);
  console.log("fastMotion.js --self-test: PASS (framePairDiff/boxBlur3/classify/warn)");
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    selfTest();
    process.exit(0);
  }
  const mediaIdx = args.indexOf("--media");
  if (mediaIdx === -1 || !args[mediaIdx + 1]) {
    console.error("Dùng: node fastMotion.js --media <file> [--json] | --self-test");
    process.exit(2);
  }
  try {
    const res = measureMotion(args[mediaIdx + 1]);
    if (args.includes("--json")) console.log(JSON.stringify(res, null, 1));
    else {
      console.log(`score=${res.score} level=${res.level} meanAbsDiff=${res.meanAbsDiff} ` +
        `median=${res.medianAbsDiff} p90=${res.p90AbsDiff} smallBand=${res.smallBandShare} ` +
        `nPairs=${res.nPairs} sampleFps=${res.sampleFps} cost=${res.costMs}ms ` +
        `(${res.msPerClipSec}ms/giây clip)`);
    }
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  MEASURE_WIDTH,
  MEASURE_HEIGHT,
  BLUR_SIGMA,
  REF_FPS,
  MEDIUM_THRESHOLD,
  FAST_THRESHOLD,
  DENOISE_WARN_STRENGTH,
  boxBlur3,
  framePairDiff,
  classifyMotion,
  shouldWarnDenoiseGhosting,
  measureMotion,
};
