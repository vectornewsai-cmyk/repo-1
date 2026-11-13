/**
 * measure_r32_o6_blur_coverage.js — Phase 9 đợt 32, luồng O6:
 * Mở rộng coverage blur (nợ đợt 30 M6: blur mới chỉ đo ở p=0,5,
 * FW-IN, weights [1,1,1] frames 3).
 *
 * GIỚI HẠN TRUNG THỰC (đọc trước khi trích số):
 * Luồng này là subagent nên KHÔNG có live-browser delegation, vì vậy
 * KHÔNG chạy được harness headed Chromium của M6 và KHÔNG có MAD
 * app-vs-tham-chiếu mới nào cho các ô p/mode/weights khác. File này
 * KHÔNG bịa MAD: nó làm 3 việc kiểm chứng được mà không cần browser:
 *  (1) Lưới kỳ vọng: alpha dip theo trọng số N6 (nút hiệu chuẩn đợt
 *      31, đọc từ source sản phẩm + nội suy tuyến tính y hệt
 *      fadeDipWeights, khóa bằng 5 neo) + kế hoạch blend theo CHÍNH
 *      hàm sản phẩm motionBlurBlendPlan (import trực tiếp từ
 *      previewEngine.ts), kèm phân tích độ nhạy/suy biến của từng ô
 *      lưới — để đợt browser sau không đo những ô không phân biệt
 *      được gì.
 *  (2) Chứng minh kế hoạch blend = trung bình có trọng số (mô phỏng
 *      compositing alpha tuần tự trên pixel tổng hợp, so với tổng
 *      trọng số trực tiếp, dùng CHÍNH motionBlurBlendPlan).
 *  (3) Lượng hóa SAI SỐ HARNESS nếu tái dùng kỳ vọng /3 của M6 cho
 *      weights không đều: trích frame thật bằng FFmpeg từ đúng footage
 *      K19/K11 của M6, tính kỳ vọng đều vs kỳ vọng có trọng số (cùng
 *      dip trắng qua CHÍNH singleClipDipPixel), báo MAD/le8 GIỮA HAI
 *      KỲ VỌNG — đây là sai số của harness, KHÔNG phải MAD của app,
 *      và không được trích như MAD blur. Nếu con số này lớn thì ô
 *      weights đó bắt buộc phải dùng kỳ vọng có trọng số khi chạy
 *      browser, không được tái dùng /3.
 *
 * Chạy: node server/render/src/measure_r32_o6_blur_coverage.js
 *   [--json benchmarks/results/v32-o6-blur-coverage.json]
 * Cần ffmpeg trong PATH cho phần (3); thiếu ffmpeg thì phần (3) bỏ
 * qua với lý do rõ ràng, (1)+(2) vẫn chạy.
 */
"use strict";
const fs = require("node:fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../../..");
const TP = path.join(ROOT, "apps/web/src/lib/transitionPreview.ts");

function parseKnots(src, name) {
  const idx = src.indexOf(`const ${name}`);
  if (idx < 0) throw new Error(`không thấy ${name}`);
  const open = src.indexOf("[", idx);
  const close = src.indexOf("];", open);
  const pairs = [...src.slice(open, close).matchAll(/\[(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\]/g)].map(
    (m) => [Number(m[1]), Number(m[2])],
  );
  if (pairs.length < 2) throw new Error(`${name}: không parse được nút`);
  return pairs;
}
function interp(knots, p) {
  if (p <= 0) return knots[0][1];
  if (p >= 1) return knots[knots.length - 1][1];
  for (let i = 1; i < knots.length; i++) {
    if (p <= knots[i][0]) {
      const t = (p - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0]);
      return knots[i - 1][1] + t * (knots[i][1] - knots[i - 1][1]);
    }
  }
  return knots[knots.length - 1][1];
}

async function main() {
  // Hàm sản phẩm thật (Node type-stripping, như các test .ts của repo).
  const { motionBlurBlendPlan } = await import("../../../apps/web/src/lib/previewEngine.ts");
  const { singleClipDipPixel } = await import("../../../apps/web/src/lib/transitionPreview.ts");

  const tpSrc = fs.readFileSync(TP, "utf8");
  const KNOTS_A = parseKnots(tpSrc, "FADE_DIP_KNOTS_A");
  const KNOTS_B = parseKnots(tpSrc, "FADE_DIP_KNOTS_B");
  const fadeDip = (p) => ({ aAlpha: interp(KNOTS_A, p), bAlpha: interp(KNOTS_B, p) });

  // Khóa neo N6 (phải khớp đúng số đã ghim đợt 31).
  const anchors = [
    ["bAlpha(0.5)", fadeDip(0.5).bAlpha, 0.3435],
    ["bAlpha(0.12)", fadeDip(0.12).bAlpha, 0],
    ["aAlpha(0.2)", fadeDip(0.2).aAlpha, 0],
    ["aAlpha(0.1)", fadeDip(0.1).aAlpha, 0.4497],
    ["bAlpha(0.75)", fadeDip(0.75).bAlpha, 0.7419],
  ];
  for (const [name, got, want] of anchors) {
    if (Math.abs(got - want) > 1e-9) throw new Error(`neo dip lệch: ${name} = ${got}, muốn ${want}`);
  }

  // ---- (2) Kế hoạch blend có bằng trung bình có trọng số không?
  function planCheck(weights) {
    const frames = weights.length;
    const plan = motionBlurBlendPlan(weights, frames - 1);
    const norm = weights.map((w) => w / weights.reduce((a, b) => a + b, 0));
    const px = [
      [10, 100, 200],
      [80, 40, 160],
      [200, 220, 30],
      [5, 5, 250],
    ].slice(0, frames);
    const direct = [0, 1, 2].map((k) => px.reduce((s, f, i) => s + norm[i] * f[k], 0));
    let cur = [...px[0]];
    for (let i = 1; i < plan.length; i++) {
      const a = plan[i].blendAlpha;
      const src = px[i];
      cur = [0, 1, 2].map((k) => a * src[k] + (1 - a) * cur[k]);
    }
    const err = Math.max(...[0, 1, 2].map((k) => Math.abs(cur[k] - direct[k])));
    return { weights, normalized: norm, plan, direct, sequential: cur, maxErr: err };
  }

  const weightSets = [
    { label: "[1,1,1] (M6 gốc)", weights: [1, 1, 1] },
    { label: "[2,1,1] (cũ nặng)", weights: [2, 1, 1] },
    { label: "[1,1,2] (mới nặng)", weights: [1, 1, 2] },
    { label: "[1,1] frames 2", weights: [1, 1] },
    { label: "[3,1,1,1] frames 4", weights: [3, 1, 1, 1] },
    { label: "[1,1,1,1] frames 4 đều", weights: [1, 1, 1, 1] },
  ];
  const planChecks = weightSets.map((w) => planCheck(w.weights));

  // ---- (1c) Lưới kỳ vọng + độ nhạy (FW-IN trắng/xám/đen, FW-OUT).
  function gridRow(window, type, p) {
    const alpha = window === "in" ? fadeDip(p).bAlpha : fadeDip(p).aAlpha;
    const degenerate = alpha === 0;
    const weak = !degenerate && alpha < 0.2;
    return {
      window, type, p, alpha,
      note: degenerate
        ? "SUY BIẾN: alpha=0 → kỳ vọng = màu dip thuần, không phân biệt được blur đúng/sai"
        : weak
          ? "YẾU: alpha<0,2 → sai số blur bị nén >5× trong MAD, chỉ dùng làm ô phụ"
          : "phân biệt được",
    };
  }
  const grid = [];
  for (const type of ["fadewhite", "fadeblack", "fadegrays"]) {
    for (const p of [0.25, 0.5, 0.75]) grid.push(gridRow("in", type, p));
  }
  for (const p of [0.1, 0.15, 0.25, 0.5]) grid.push(gridRow("out", "fadewhite", p));

  // ---- (3) Sai số harness trên footage thật (FFmpeg, không phải MAD app).
  const W = 270, H = 480, STEP = 8;
  const videosDir = path.join(process.env.HOME || "", "workspace/tmp-round30-m6/videos-blur");
  function extractFrame(file, t, out) {
    execFileSync("ffmpeg", [
      "-v", "error", "-ss", String(t), "-i", file,
      "-frames:v", "1", "-vf", `scale=${W}:${H}`,
      "-f", "rawvideo", "-pix_fmt", "rgb24", out,
    ], { stdio: "pipe" });
    return fs.readFileSync(out);
  }
  function harnessBias() {
    const out = [];
    const tmpDir = fs.mkdtempSync(path.join("/tmp", "o6-blur-"));
    try {
      for (const [label, file, motionNote] of [
        ["K19 (motion mạnh)", path.join(videosDir, "clip-k-trim19.mp4"), "M6: motionMean 18,16"],
        ["K11 (motion vừa)", path.join(videosDir, "clip-k-trim11.mp4"), "M6: motionMean 8,47"],
      ]) {
        if (!fs.existsSync(file)) {
          out.push({ footage: label, skipped: `không thấy file ${file}` });
          continue;
        }
        for (const p of [0.5, 0.75]) {
          const alpha = fadeDip(p).bAlpha; // FW-IN trắng
          const localT = p; // clip start 0, dur 4, cửa sổ vào 1s (như M6)
          const frames = [localT, localT - 1 / 30, localT - 2 / 30].map((t, i) => {
            const f = path.join(tmpDir, `${label}-${p}-${i}.raw`);
            return extractFrame(file, Math.max(0, t), f);
          });
          let n = 0, motionSum = 0;
          const perWeights = {};
          for (const { label: wl } of weightSets.filter((w) => w.weights.length === 3)) {
            perWeights[wl] = { sum: 0, le8: 0 };
          }
          for (let py = Math.round(H * 0.15); py < Math.round(H * 0.85); py += STEP) {
            for (let px = Math.round(W * 0.15); px < Math.round(W * 0.85); px += STEP) {
              const ci = (py * W + px) * 3;
              const uni = [0, 1, 2].map((k) => (frames[0][ci + k] + frames[1][ci + k] + frames[2][ci + k]) / 3);
              const expUni = singleClipDipPixel(uni, alpha, "white");
              let mm = 0;
              for (let k = 0; k < 3; k++) {
                mm += (Math.abs(frames[0][ci + k] - frames[1][ci + k]) + Math.abs(frames[1][ci + k] - frames[2][ci + k])) / 2;
              }
              motionSum += mm / 3;
              for (const { label: wl, weights } of weightSets.filter((w) => w.weights.length === 3)) {
                const norm = weights.map((w) => w / weights.reduce((a, b) => a + b, 0));
                // Thứ tự weights: [cũ nhất … mới nhất] theo motionBlurBlendPlan
                // (window slice giữ thứ tự đó); frame[2]=cũ nhất, frame[0]=mới nhất.
                const wavg = [0, 1, 2].map(
                  (k) => norm[0] * frames[2][ci + k] + norm[1] * frames[1][ci + k] + norm[2] * frames[0][ci + k],
                );
                const expW = singleClipDipPixel(wavg, alpha, "white");
                let md = 0, mx = 0;
                for (let k = 0; k < 3; k++) {
                  const d = Math.abs(expUni[k] - expW[k]);
                  md += d; if (d > mx) mx = d;
                }
                perWeights[wl].sum += md;
                if (mx <= 8) perWeights[wl].le8++;
              }
              n++;
            }
          }
          const bias = {};
          for (const [wl, v] of Object.entries(perWeights)) {
            bias[wl] = { madBetweenExpectations: v.sum / (n * 3), le8: v.le8 / n };
          }
          out.push({ footage: label, motionNote, p, alpha, nSamples: n, motionMean: motionSum / n, bias });
        }
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    return out;
  }

  let ffmpegBias = null;
  let ffmpegError = null;
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "pipe" });
    ffmpegBias = harnessBias();
  } catch (e) {
    ffmpegError = String(e?.message ?? e).slice(0, 300);
  }

  const result = {
    generatedAt: new Date().toISOString(),
    note: "KHÔNG có MAD app-vs-tham-chiếu mới: luồng subagent không có live-browser. Số 'bias' là sai số HARNESS (kỳ vọng đều vs kỳ vọng có trọng số), không phải MAD blur của app.",
    dipAnchorsOk: true,
    knotsA: KNOTS_A,
    knotsB: KNOTS_B,
    planChecks: planChecks.map((c) => ({
      weights: c.weights, normalized: c.normalized,
      blendAlphas: c.plan.map((f) => f.blendAlpha),
      maxErrVsDirectWeightedAvg: c.maxErr,
    })),
    grid,
    ffmpegBias,
    ffmpegError,
  };

  const idx = process.argv.indexOf("--json");
  if (idx >= 0 && process.argv[idx + 1]) {
    writeFileEpermRetry(process.argv[idx + 1], JSON.stringify(result, null, 2));
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
