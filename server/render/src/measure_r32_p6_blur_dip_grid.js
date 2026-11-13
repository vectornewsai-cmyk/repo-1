/**
 * measure_r32_p6_blur_dip_grid.js — Phase 9 đợt 32, luồng P6:
 * Đo blur dip trên lưới đa cấu hình (nợ đợt 31 §3.8: blur mới chỉ có
 * p=0,5, FW-IN, weights [1,1,1] frames 3; nợ đợt 32 O6 §5.1: MAD browser
 * thật cho các ô lưới vẫn CHƯA ĐO).
 *
 * PHẠM VI TRUNG THỰC — ĐỌC TRƯỚC KHI TRÍCH SỐ (không được trích các
 * số dưới đây như "MAD browser" hay "MAD app-vs-FFmpeg-xfade"):
 *
 * Luồng này là subagent, không có live-browser delegation nên không
 * chạy được harness headed Chromium của M6 (click ruler + seed
 * autosave + canvas preview thật). Thay vào đó, script đo CHÍNH
 * pipeline compositing của app ở tầng toán pixel, tách khỏi draw /
 * resample / seek của browser:
 *   - "App": CHÍNH motionBlurBlendPlan (previewEngine.ts) + mô phỏng
 *     source-over canvas 8-bit: mỗi bước vẽ làm tròn Math.round một
 *     lần (đúng cách preview.tsx drawMotionBlurBlended vẽ ghost +
 *     frame hiện tại lên lớp offscreen bằng globalAlpha = plan
 *     blendAlpha), rồi CHÍNH singleClipDipPixel (transitionPreview.ts)
 *     + Math.round như vòng dip của drawVideoClipWithDip.
 *   - "Kỳ vọng độc lập": trung bình có trọng số TRỰC TIẾP (không qua
 *     plan, không qua bước vẽ trung gian) rồi cùng singleClipDipPixel,
 *     làm tròn một lần cuối.
 * MAD ở đây = sai số LÀM TRÒN TÍCH LŨY của compositing tuần tự so với
 * trung bình trực tiếp, trên frame FFmpeg thật (không phải sai số
 * ngữ nghĩa blur, không phải sai số draw/resample/seek). Nó trả lời
 * đúng một câu hỏi: pipeline blend + dip của app có giữ đúng trung
 * bình có trọng số ở mọi p/mode/weights không, và ô nào suy biến /
 * nhạy / không nhạy. Sai số draw/resample/seek của browser vẫn là
 * phần M6 đã đo ở ô gốc (0,624/0,487 KHỚP) và vẫn cần browser cho
 * các ô mới (đặc tả O6 §3.5 giữ nguyên).
 *
 * Đối chứng độ nhạy (để lưới không tự khen mình): control đảo thứ tự
 * weights và control màu phẳng (xem cuối file) — nếu lưới không bắt
 * được lỗi đảo weights thì mọi ô KHỚP đều vô nghĩa.
 *
 * Quy ước (theo code sản phẩm + O6 §3.2):
 *   - FW-IN tại p: dip alpha = bAlpha(p) (lớp B khi vào).
 *   - FW-OUT tại p: dip alpha = aAlpha(p) (lớp A khi ra). p >= 0,25
 *     SUY BIẾN vì aAlpha = 0 từ p = 0,2 (kỳ vọng = màu dip thuần) nên
 *     KHÔNG đo — chỉ đo OUT p = 0,1 / 0,15.
 *   - fadeblack: app không đi qua vòng dip (dip đen ≡ nền đen) mà vẽ
 *     với tv.alpha trên nền đen; về toán pixel ≡ singleClipDipPixel
 *     mode "black" (alpha*clip), nên script dùng chung hàm đó và ghi
 *     rõ đường đi khác nhau ở LIMITS.
 *   - Thứ tự weights: weights[0] = frame cũ nhất (theo plan), frame
 *     hiện tại là phần tử cuối. Thời gian: IN current t = p (clip
 *     0–4s, cửa sổ vào 1s, như M6); OUT current t = 3 + p (cửa sổ ra
 *     3–4s); bóng = current − k/30.
 *   - Thang M6: KHỚP = MAD ≤ 2 và ≥ 99% pixel có maxDiff ≤ 8;
 *     XẤP XỈ = MAD ≤ 20 và ≥ 90% ≤ 8; còn lại LỆCH.
 *
 * Chạy: node server/render/src/measure_r32_p6_blur_dip_grid.js
 *   [--json benchmarks/results/v32-p6-blur-dip-grid.json]
 * Cần ffmpeg trong PATH + footage M6 ở
 * ~/workspace/tmp-round30-m6/videos-blur/clip-k-trim{19,11}.mp4.
 * Frame trung gian chỉ ở /tmp, script tự xóa.
 */
"use strict";
const fs = require("node:fs");
const { writeFileEpermRetry } = require("../../eperm-retry.cjs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../../..");
const TP = path.join(ROOT, "apps/web/src/lib/transitionPreview.ts");
const W = 270, H = 480, STEP = 8;
const X0 = Math.round(W * 0.15), X1 = Math.round(W * 0.85);
const Y0 = Math.round(H * 0.15), Y1 = Math.round(H * 0.85);

function parseKnots(src, name) {
  const idx = src.indexOf(`const ${name}`);
  if (idx < 0) throw new Error(`không thấy ${name}`);
  const open = src.indexOf("[", idx);
  const close = src.indexOf("];", open);
  const pairs = [...src.slice(open, close).matchAll(/\[(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\]/g)]
    .map((m) => [Number(m[1]), Number(m[2])]);
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
function tier(mad, le8) {
  if (mad <= 2 && le8 >= 0.99) return "KHỚP";
  if (mad <= 20 && le8 >= 0.9) return "XẤP XỈ";
  return "LỆCH";
}

/** Mô phỏng source-over canvas 8-bit: frames cũ nhất → mới nhất. */
function canvasBlend(frames, plan) {
  const cur = [0, 0, 0];
  for (let i = 0; i < frames.length; i++) {
    const a = plan[i].blendAlpha;
    const src = frames[i];
    for (let k = 0; k < 3; k++) cur[k] = Math.round(a * src[k] + (1 - a) * cur[k]);
  }
  return cur;
}
function directWeightedAvg(frames, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  return [0, 1, 2].map((k) => frames.reduce((s, f, i) => s + (weights[i] / sum) * f[k], 0));
}

async function main() {
  const { motionBlurBlendPlan } = await import("../../../apps/web/src/lib/previewEngine.ts");
  const { singleClipDipPixel } = await import("../../../apps/web/src/lib/transitionPreview.ts");
  const tpSrc = fs.readFileSync(TP, "utf8");
  const KNOTS_A = parseKnots(tpSrc, "FADE_DIP_KNOTS_A");
  const KNOTS_B = parseKnots(tpSrc, "FADE_DIP_KNOTS_B");
  const fadeDip = (p) => ({ aAlpha: interp(KNOTS_A, p), bAlpha: interp(KNOTS_B, p) });
  // Neo theo đúng nút đang có trong source hiện tại (bAlpha(0,5) = 0,345
  // là nút, khác 0,3435 mà N6/O6 ghi — xem LIMITS §4; neo kiểm tra
  // parse, không kiểm tra lịch sử hiệu chuẩn).
  for (const [name, got, want] of [
    ["bAlpha(0.5)", fadeDip(0.5).bAlpha, 0.345],
    ["bAlpha(0.12)", fadeDip(0.12).bAlpha, 0],
    ["aAlpha(0.2)", fadeDip(0.2).aAlpha, 0],
    ["aAlpha(0.1)", fadeDip(0.1).aAlpha, 0.4497],
    ["bAlpha(0.75)", fadeDip(0.75).bAlpha, 0.7419],
  ]) {
    if (Math.abs(got - want) > 1e-9) throw new Error(`neo dip lệch: ${name} = ${got}, muốn ${want}`);
  }

  const videosDir = path.join(process.env.HOME || "", "workspace/tmp-round30-m6/videos-blur");
  const footages = [
    ["K19 (motion mạnh)", path.join(videosDir, "clip-k-trim19.mp4")],
    ["K11 (motion vừa)", path.join(videosDir, "clip-k-trim11.mp4")],
    // Synth 30fps (testsrc2, M6): bước 1/30 khớp đúng khung nguồn nên
    // cửa sổ [1,1] không bị trùng frame như footage K 23,976fps (xem
    // LIMITS §2.3). Synth có viền cứng dày nên chỉ dùng làm chứng
    // compositing, không dùng làm chứng draw/resample như M6.
    ["SYNTH-30fps (testsrc2)", path.join(videosDir, "complex-synth.mp4")],
  ];
  for (const [, file] of footages) {
    if (!fs.existsSync(file)) throw new Error(`không thấy footage ${file}`);
  }
  execFileSync("ffmpeg", ["-version"], { stdio: "pipe" });

  const tmpDir = fs.mkdtempSync(path.join("/tmp", "p6-blur-"));
  const cache = new Map();
  function extractFrame(file, t) {
    const key = `${file}@${t.toFixed(4)}`;
    if (cache.has(key)) return cache.get(key);
    const out = path.join(tmpDir, `f${cache.size}.raw`);
    execFileSync("ffmpeg", ["-v", "error", "-ss", String(t), "-i", file,
      "-frames:v", "1", "-vf", `scale=${W}:${H}`, "-f", "rawvideo", "-pix_fmt", "rgb24", out],
      { stdio: "pipe" });
    const buf = fs.readFileSync(out);
    cache.set(key, buf);
    return buf;
  }

  const MODE = { fadewhite: "white", fadegrays: "gray", fadeblack: "black" };
  const WEIGHTS = [
    { label: "[1,1,1]", weights: [1, 1, 1] },
    { label: "[2,1,1]", weights: [2, 1, 1] },
    { label: "[1,1,2]", weights: [1, 1, 2] },
    { label: "[1,1]", weights: [1, 1] },
    { label: "[1,1,1,1]", weights: [1, 1, 1, 1] },
    { label: "[3,1,1,1]", weights: [3, 1, 1, 1] },
  ];
  const cells = [];
  try {
    for (const [footage, file] of footages) {
      const cases = [];
      for (const mode of Object.keys(MODE)) {
        for (const p of [0.25, 0.5, 0.75]) {
          cases.push({ window: "IN", mode, p, currentT: p, alpha: fadeDip(p).bAlpha });
        }
      }
      for (const mode of Object.keys(MODE)) {
        for (const p of [0.1, 0.15]) {
          cases.push({ window: "OUT", mode, p, currentT: 3 + p, alpha: fadeDip(p).aAlpha });
        }
      }
      for (const c of cases) {
        for (const { label: wl, weights } of WEIGHTS) {
          const n = weights.length;
          // frames cũ nhất → mới nhất.
          const bufs = [];
          for (let i = n - 1; i >= 0; i--) bufs.push(extractFrame(file, Math.max(0, c.currentT - i / 30)));
          const plan = motionBlurBlendPlan(weights, n - 1);
          if (plan.length !== n) throw new Error(`plan dài ${plan.length}, muốn ${n} (weights ${wl})`);
          let sum = 0, le8 = 0, maxDiff = 0, motionSum = 0, endMotionSum = 0, cnt = 0;
          for (let py = Y0; py < Y1; py += STEP) {
            for (let px = X0; px < X1; px += STEP) {
              const ci = (py * W + px) * 3;
              const frames = bufs.map((b) => [b[ci], b[ci + 1], b[ci + 2]]);
              // Chuyển động đầu–cuối cửa sổ: = 0 nghĩa là frame cũ nhất
              // và mới nhất trùng nhau ở mẫu này (nguồn 23,976fps lấy
              // mẫu bước 1/30 có thể rơi vào cùng một khung nguồn).
              for (let k = 0; k < 3; k++) endMotionSum += Math.abs(frames[frames.length - 1][k] - frames[0][k]);
              const app = singleClipDipPixel(canvasBlend(frames, plan), c.alpha, MODE[c.mode])
                .map((v) => Math.round(v));
              const exp = singleClipDipPixel(directWeightedAvg(frames, weights), c.alpha, MODE[c.mode])
                .map((v) => Math.round(v));
              let md = 0, mx = 0;
              for (let k = 0; k < 3; k++) {
                const d = Math.abs(app[k] - exp[k]);
                md += d; if (d > mx) mx = d;
              }
              sum += md; if (mx <= 8) le8++; if (mx > maxDiff) maxDiff = mx;
              let mm = 0;
              for (let i = 1; i < frames.length; i++)
                for (let k = 0; k < 3; k++) mm += Math.abs(frames[i][k] - frames[i - 1][k]);
              motionSum += mm / ((frames.length - 1) * 3);
              cnt++;
            }
          }
          const mad = sum / (cnt * 3);
          const le = le8 / cnt;
          const windowMotion = endMotionSum / (cnt * 3);
          cells.push({ footage, window: c.window, mode: c.mode, p: c.p, alpha: c.alpha,
            weights: wl, frames: n, nSamples: cnt, motionMean: motionSum / cnt,
            windowMotion, dupWindow: windowMotion === 0,
            mad, le8: le, maxDiff, tier: tier(mad, le) });
        }
      }
    }

    // Đối chứng 1 — màu phẳng: mọi frame giống nhau → app phải = kỳ vọng đúng 0.
    const flatChecks = [];
    for (const { label: wl, weights } of WEIGHTS) {
      const plan = motionBlurBlendPlan(weights, weights.length - 1);
      const px = [123, 45, 200];
      const frames = weights.map(() => [...px]);
      const app = singleClipDipPixel(canvasBlend(frames, plan), fadeDip(0.5).bAlpha, "white").map(Math.round);
      const exp = singleClipDipPixel(directWeightedAvg(frames, weights), fadeDip(0.5).bAlpha, "white").map(Math.round);
      flatChecks.push({ weights: wl, app, exp, maxDiff: Math.max(...app.map((v, i) => Math.abs(v - exp[i]))) });
    }
    // Đối chứng 2 — đảo thứ tự weights phải bị lưới bắt: app [1,1,2] so với
    // kỳ vọng tính bằng weights đảo [2,1,1] trên cùng cửa sổ K19 p=0,5 trắng.
    let revControl = null;
    {
      const file = footages[0][1];
      const bufs = [2, 1, 0].map((i) => extractFrame(file, Math.max(0, 0.5 - i / 30)));
      const plan = motionBlurBlendPlan([1, 1, 2], 2);
      let sum = 0, le8 = 0, cnt = 0, mxAll = 0;
      for (let py = Y0; py < Y1; py += STEP) {
        for (let px = X0; px < X1; px += STEP) {
          const ci = (py * W + px) * 3;
          const frames = bufs.map((b) => [b[ci], b[ci + 1], b[ci + 2]]);
          const app = singleClipDipPixel(canvasBlend(frames, plan), fadeDip(0.5).bAlpha, "white").map(Math.round);
          const exp = singleClipDipPixel(directWeightedAvg(frames, [2, 1, 1]), fadeDip(0.5).bAlpha, "white").map(Math.round);
          let md = 0, mx = 0;
          for (let k = 0; k < 3; k++) { const d = Math.abs(app[k] - exp[k]); md += d; if (d > mx) mx = d; }
          sum += md; if (mx <= 8) le8++; if (mx > mxAll) mxAll = mx; cnt++;
        }
      }
      revControl = { appWeights: "[1,1,2]", expWeights: "[2,1,1] (đảo)",
        mad: sum / (cnt * 3), le8: le8 / cnt, maxDiff: mxAll, tier: tier(sum / (cnt * 3), le8 / cnt) };
    }

    const result = {
      generatedAt: new Date().toISOString(),
      scope: "MAD mô phỏng compositing canvas (plan + làm tròn 8-bit từng bước vẽ + dip loop) so với kỳ vọng trung bình có trọng số trực tiếp, trên frame FFmpeg thật 270x480, vùng mẫu 15%-85%, step 8, 3 footage (K19/K11 23,976fps + synth 30fps). KHÔNG phải MAD browser, KHÔNG phải MAD app-vs-xfade-FFmpeg. dupWindow=true nghĩa là frame đầu–cuối cửa sổ trùng nhau ở mọi mẫu (ô đó không kiểm chứng được blend, chỉ kiểm chứng dip).",
      method: "app = singleClipDipPixel(canvasBlend(plan)) ; exp = singleClipDipPixel(directWeightedAvg) ; cả hai làm tròn cuối như preview.tsx. Thang M6: KHỚP = MAD ≤ 2 và le8 ≥ 99%; XẤP XỈ = MAD ≤ 20 và le8 ≥ 90%; còn lại LỆCH.",
      dipAnchorsOk: true,
      framesExtracted: cache.size,
      cells,
      flatChecks,
      reversedWeightControl: revControl,
    };
    const idx = process.argv.indexOf("--json");
    if (idx >= 0 && process.argv[idx + 1]) writeFileEpermRetry(process.argv[idx + 1], JSON.stringify(result, null, 2));
    // Tóm tắt console theo nhóm để đọc nhanh.
    const byTier = {};
    for (const c of cells) byTier[c.tier] = (byTier[c.tier] || 0) + 1;
    console.log(`cells=${cells.length} tiers=${JSON.stringify(byTier)}`);
    console.log(`flat maxDiff: ${flatChecks.map((f) => f.weights + "=" + f.maxDiff).join(" ")}`);
    console.log(`reversed-weight control: MAD=${revControl.mad.toFixed(3)} le8=${(revControl.le8 * 100).toFixed(2)}% tier=${revControl.tier}`);
    let worst = 0;
    for (const c of cells) if (c.mad > worst) worst = c.mad;
    console.log(`worst MAD trong lưới = ${worst.toFixed(4)}`);
    for (const c of cells) {
      console.log(`${c.footage} ${c.window} ${c.mode} p=${c.p} w=${c.weights} alpha=${c.alpha.toFixed(4)} MAD=${c.mad.toFixed(4)} le8=${(c.le8 * 100).toFixed(2)}% max=${c.maxDiff} ${c.tier}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
