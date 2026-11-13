// effectCanvas.test.ts — Kiểm chứng bằng số cho 8 effect canvas (V2, Phase 9 đợt 10).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/effectCanvas.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
import assert from "node:assert/strict";
import {
  addYuvNoise,
  applyCanvasEffects,
  applyEdgeDetect,
  applyGlitch,
  applyMirror,
  applyNoise,
  applyPixelate,
  applyRgbShift,
  applyShake,
  applySharpen,
  canvasEffectOps,
  shakeOffsetAt,
  yuvMatrixForSourceWidth,
  type CanvasEffectOp,
  type ImageDataLike,
} from "./effectCanvas.ts";
import { effectsVisual } from "./previewEngine.ts";

let pass = 0;
function ok(name: string, fn: () => void): void {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

function img(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]): ImageDataLike {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fill(x, y);
      const p = (y * w + x) * 4;
      data[p] = r;
      data[p + 1] = g;
      data[p + 2] = b;
      data[p + 3] = a;
    }
  }
  return { width: w, height: h, data };
}
function px(im: ImageDataLike, x: number, y: number): [number, number, number, number] {
  const p = (y * im.width + x) * 4;
  return [im.data[p], im.data[p + 1], im.data[p + 2], im.data[p + 3]];
}
/** Gradient lớn nhất giữa 2 pixel kề (đo độ tương phản biên, kênh R). */
function maxGradient(im: ImageDataLike): number {
  let m = 0;
  for (let y = 0; y < im.height; y++) {
    for (let x = 1; x < im.width; x++) {
      m = Math.max(m, Math.abs(px(im, x, y)[0] - px(im, x - 1, y)[0]));
    }
  }
  return m;
}

console.log("== effectCanvas: mirror ==");
ok("mirror đổi đúng pixel đối xứng", () => {
  const a = img(4, 1, (x) => [x * 60, 0, 0, 255]);
  applyMirror(a);
  assert.deepEqual([px(a, 0, 0)[0], px(a, 1, 0)[0], px(a, 2, 0)[0], px(a, 3, 0)[0]], [180, 120, 60, 0]);
});

console.log("== effectCanvas: pixelate ==");
ok("pixelate (intensity 0 → k=2) làm phẳng từng khối 2×2 về pixel TÂM khối (điểm lấy mẫu của FFmpeg scale neighbor, đợt 11 P2)", () => {
  // Nguồn: giá trị (x + y*4)*10. k=2 → tâm khối offset (1,1):
  // khối (0,0) → mẫu (1,1) = 50; (2,0) → (3,1) = 70;
  // (0,2) → (1,3) = 130; (2,2) → (3,3) = 150.
  const orig = img(4, 4, (x, y) => [(x + y * 4) * 10, 0, 0, 255]);
  const a = img(4, 4, (x, y) => [(x + y * 4) * 10, 0, 0, 255]);
  applyPixelate(a, 0);
  for (let by = 0; by < 4; by += 2) {
    for (let bx = 0; bx < 4; bx += 2) {
      const ref = px(orig, bx + 1, by + 1)[0];
      for (let y = by; y < by + 2; y++) {
        for (let x = bx; x < bx + 2; x++) {
          assert.equal(px(a, x, y)[0], ref, `khối (${bx},${by}) pixel (${x},${y})`);
        }
      }
    }
  }
});
ok("pixelate (intensity 0.5 → k=9) lấy mẫu tại offset (4,4) trong khối", () => {
  const a = img(18, 9, (x, y) => [x, y, 0, 255]);
  applyPixelate(a, 0.5);
  // Khối (0,0): mẫu (4,4) → mọi pixel trong khối có R=4, G=4.
  assert.deepEqual([px(a, 0, 0)[0], px(a, 0, 0)[1], px(a, 8, 8)[0], px(a, 8, 8)[1]], [4, 4, 4, 4]);
  // Khối (9,0): mẫu (13,4) → R=13, G=4.
  assert.deepEqual([px(a, 9, 0)[0], px(a, 9, 0)[1]], [13, 4]);
});

console.log("== effectCanvas: sharpen ==");
ok("sharpen tăng gradient tại biên bước nhảy", () => {
  const base = img(8, 1, (x) => [x < 4 ? 50 : 200, 0, 0, 255]);
  const before = maxGradient(base);
  const after = img(8, 1, (x) => [x < 4 ? 50 : 200, 0, 0, 255]);
  applySharpen(after, 0.5);
  assert.ok(after.data[0] !== undefined);
  assert.ok(maxGradient(after) > before, `gradient ${maxGradient(after)} phải > ${before}`);
  console.log(`    gradient biên: ${before} → ${maxGradient(after)}`);
});
ok("sharpen không làm lệch vùng phẳng bão hoà (đợt 66 T4, HYB4: nhánh direct convert từ base ước lượng — uniform field phải giữ nguyên trong ±2, không được base-shift)", () => {
  // ΔY = 0 trên vùng phẳng nên mọi nhánh đều phải trả về gần như input.
  // Guard chống base-shift của nhánh direct: nếu est chroma/Y_est sai,
  // vùng phẳng bão hoà sẽ lệch hẳn (S8r trên ocean lệch tới MAD 2,56).
  for (const [name, rgb] of [["đỏ bão hoà", [255, 0, 0]], ["xanh dương bão hoà", [0, 0, 255]], ["vàng bão hoà", [255, 255, 0]], ["trắng", [255, 255, 255]]] as const) {
    const a = img(16, 16, () => [rgb[0], rgb[1], rgb[2], 255]);
    applySharpen(a, 1);
    let worst = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(a.data[i + c] - rgb[c]));
    }
    console.log(`    ${name}: lệch tối đa ${worst} (ngưỡng ≤ 2)`);
    assert.ok(worst <= 2, `${name}: vùng phẳng lệch tối đa ${worst} > 2 — base-shift của nhánh direct?`);
  }
});

console.log("== effectCanvas: edgedetect ==");
ok("edgedetect ≈ 0 ở vùng phẳng; step đối xứng hoàn hảo bị triệt tiêu (đúng render), step bất đối xứng mỏng 1 cột (NMS nghiêm, đợt 16 H5)", () => {
  const flat = img(6, 6, () => [128, 128, 128, 255]);
  applyEdgeDetect(flat, 0.5);
  assert.ok(flat.data.every((v, i) => i % 4 === 3 || v === 0), "vùng phẳng phải toàn 0");
  // Step đối xứng hoàn hảo (0→255 tại x=4): dải plateau Sobel bị NMS
  // nghiêm triệt tiêu cả 2 phía → toàn 0. Đây KHÔNG phải lỗi: render
  // FFmpeg trên step hoàn hảo cũng chỉ cho 4 pixel ở gần biên trên/dưới
  // khung (cột 36, hàng 1,2,42,43 trên 72×45), phần trong toàn 0.
  // Test cũ (đợt 14 R6) kỳ vọng 1 cột vì dùng tie-break >= một phía.
  const edge = img(8, 4, (x) => [x < 4 ? 0 : 255, x < 4 ? 0 : 255, x < 4 ? 0 : 255, 255]);
  applyEdgeDetect(edge, 0.5);
  assert.ok(edge.data.every((v, i) => i % 4 === 3 || v === 0), "step đối xứng hoàn hảo phải toàn 0 (NMS nghiêm, như render)");
  // Step bất đối xứng (0,0,0,128,255,...): đỉnh Sobel duy nhất tại
  // x=3 → đúng 1 cột sáng đủ chiều cao, các cột khác tối.
  const asym = img(8, 4, (x) => {
    const v = [0, 0, 0, 128, 255, 255, 255, 255][x];
    return [v, v, v, 255];
  });
  applyEdgeDetect(asym, 0.5);
  assert.ok(px(asym, 3, 2)[0] > 0, "cột biên 3 phải > 0");
  assert.equal(px(asym, 4, 2)[0], 0, "cột 4 bị NMS triệt tiêu");
  assert.equal(px(asym, 0, 2)[0], 0, "xa biên trái phải = 0");
  assert.equal(px(asym, 7, 2)[0], 0, "xa biên phải phải = 0");
});

console.log("== effectCanvas: rgb-shift ==");
ok("rgb-shift (intensity 0 → s=2) dịch kênh R đúng 2px, B ngược chiều", () => {
  // R tăng theo x, B giảm theo x để đọc được chiều dịch.
  const a = img(8, 1, (x) => [x * 30, 0, (7 - x) * 30, 255]);
  applyRgbShift(a, 0);
  // R dịch phải 2: out(x) = in(x-2) → out(4).R = 60; B dịch trái 2:
  // out(x).B = in(x+2).B → out(2).B = in(4).B = 90.
  assert.equal(px(a, 4, 0)[0], 60);
  assert.equal(px(a, 2, 0)[2], 90);
  // Vùng trống điền 0.
  assert.equal(px(a, 0, 0)[0], 0);
  assert.equal(px(a, 7, 0)[2], 0);
});

console.log("== effectCanvas: shake ==");
ok("shake crop+pad: chỉ cửa sổ [12,w-12)×[12,h-12) giữ nội dung dịch theo dx,dy, viền 12px đen (đợt 11 P2, khớp crop+pad của render)", () => {
  // Ảnh 32×32, R=x, G=y. dx=0, dy=-12 → trong cửa sổ, out(x,y)=src(x,y+12).
  const a = img(32, 32, (x, y) => [x, y, 0, 255]);
  applyShake(a, 0, -12);
  // Trong cửa sổ: (12,12) ← src(12,24); (19,19) ← src(19,31).
  assert.deepEqual([px(a, 12, 12)[0], px(a, 12, 12)[1]], [12, 24]);
  assert.deepEqual([px(a, 19, 19)[0], px(a, 19, 19)[1]], [19, 31]);
  // Viền 12px đen ở RGB (trái/phải/trên/dưới), kể cả khi dịch vẫn có nguồn.
  assert.deepEqual([px(a, 0, 12)[0], px(a, 11, 12)[0], px(a, 20, 12)[0], px(a, 12, 0)[0], px(a, 12, 11)[0], px(a, 12, 20)[0]], [0, 0, 0, 0, 0, 0]);
  // Alpha giữ nguyên ở cả viền.
  assert.equal(px(a, 0, 0)[3], 255);
  const off = shakeOffsetAt(0);
  // t=0: sin 0 = 0, cos 0 = 1 → dx=0, dy=-12.
  assert.deepEqual(off, { dx: 0, dy: -12 });
});

console.log("== effectCanvas: glitch / noise (seed) ==");
ok("glitch lặp lại được với cùng seed, đổi với seed khác", () => {
  const mk = () => img(16, 16, (x, y) => [(x * 16 + y) % 256, 0, 0, 255]);
  const a = mk();
  const b = mk();
  applyGlitch(a, 0.5, 42);
  applyGlitch(b, 0.5, 42);
  assert.deepEqual([...a.data], [...b.data]);
  const c = mk();
  applyGlitch(c, 0.5, 43);
  assert.notDeepEqual([...c.data], [...a.data]);
});
ok("glitch = rgb-shift (s=6+t*10, trunc + nhân biên) + noise Gauss RGB (ns=round(10+t*20)), không còn slice (đợt 16 H5; RGB đợt 65 S7)", () => {
  // Ảnh 64×8: R=x, G=128, B=255-x. t=0.5 → s=11, ns=20.
  // Nhiễu Gauss RGB độc lập từng kênh (sigma = ns/√3 ≈ 11.55): KHÔNG
  // phải nhiễu YUV — đợt 65 S7 đính chính giả định R63 R8 (xem
  // addRgbNoise): chuỗi render glitch `rgbashift,noise` chạy noise
  // trên plane RGB sau khi rgbashift tự convert yuv420p→gbrp; đo thật
  // render (probe9): corr chéo kênh [0.038,-0.003,0.008] ≈ 0, std
  // [11.13,10.85,11.07] ≈ σ. Ngưỡng [0.8,1.25]×lý thuyết cho cả 2 số
  // — đo thật seed 42: mean|dev| [8.12,9.13,8.62], std
  // [10.63,11.41,10.72] (tỉ lệ 0.88–0.99 so với lý thuyết: ảnh test có
  // vùng bão hòa R/B nên kẹp 0/255 làm hẹp phân phối; render thật đo
  // TB [8.04,8.98,8.84] — preview khớp render trong 0.2 TB / 0.5 std).
  const a = img(64, 8, (x) => [x, 128, 255 - x, 255]);
  applyGlitch(a, 0.5, 42);
  const sigma = 20 / Math.sqrt(3);
  const theoryStd = [1, 1, 1].map((k) => k * sigma);
  const theoryMeanAbs = theoryStd.map((v) => v * Math.sqrt(2 / Math.PI));
  for (let c = 0; c < 3; c++) {
    const devs: number[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 64; x++) {
        const rs = Math.max(0, x - 11);
        const bs = Math.min(63, x + 11);
        const shifted = c === 0 ? rs : c === 1 ? 128 : 255 - bs;
        devs.push(px(a, x, y)[c] - shifted);
      }
    }
    const mean = devs.reduce((s, v) => s + Math.abs(v), 0) / devs.length;
    const mu = devs.reduce((s, v) => s + v, 0) / devs.length;
    const std = Math.sqrt(devs.reduce((s, v) => s + (v - mu) ** 2, 0) / devs.length);
    assert.ok(mean >= 0.8 * theoryMeanAbs[c] && mean <= 1.25 * theoryMeanAbs[c], `kênh ${c}: trung bình |lệch| ${mean.toFixed(2)} ngoài [0.8,1.25]×${theoryMeanAbs[c].toFixed(2)} (nhiễu RGB)`);
    assert.ok(std >= 0.8 * theoryStd[c] && std <= 1.25 * theoryStd[c], `kênh ${c}: std lệch ${std.toFixed(2)} ngoài [0.8,1.25]×${theoryStd[c].toFixed(2)} (nhiễu RGB)`);
  }
});
ok("noise lặp lại được với cùng seed, đổi với seed khác, thống kê Gauss YUV đúng strength (đợt 63 R8)", () => {
  const mk = () => img(32, 32, () => [128, 128, 128, 255]);
  const a = mk();
  const b = mk();
  applyNoise(a, 0.5, 7);
  applyNoise(b, 0.5, 7);
  assert.deepEqual([...a.data], [...b.data]);
  const c = mk();
  applyNoise(c, 0.5, 8);
  assert.notDeepEqual([...c.data], [...a.data]);
  // strength = 5 + 0.5*45 = 27.5, sigma = strength/√3 ≈ 15.88 từng plane
  // YUV. Nhiễu Gauss KHÔNG kẹp ở ±strength (render cũng vượt ±strength:
  // phẳng 128 + alls=28 cho min 76 / max 192), nên assert bằng thống
  // kê thay vì biên độ từng pixel. Đợt 63 R8: nhiễu nay trong không gian
  // YUV (bt709 limited-range, U/V nửa phân giải) nên std từng kênh RGB
  // KHÔNG bằng nhau mà theo hệ số convert: [2.14, 1.30, 2.41]×sigma
  // (đo thật bằng FFmpeg yuv420p: [33.6, 20.4, 37.8] với sigma 15.7),
  // và các kênh TƯƠNG QUAN với nhau ([0.15, 0.26, 0.30] — nhiễu Y chung)
  // thay vì độc lập như mô hình RGB cũ. Ngưỡng std [0.85, 1.15]×lý
  // thuyết: sai số lấy mẫu với n=4096 chỉ ~1.1% nên band này rộng rãi
  // nhưng vẫn bắt được mô hình RGB cũ (tỉ lệ std [0.47, 0.78, 0.42] so
  // với render yuv420p). Tương quan assert theo hiệu với lý thuyết
  // ±0.12 (sai số lấy mẫu corr với n=4096 ≈ 0.016).
  // Trung bình: sai số chuẩn của mean từng kênh (n=4096 pixel,
  // 1024 mẫu chroma) là SE_R≈0.93, SE_G≈0.40, SE_B≈1.09 nên bound
  // |mu|<4 ≈ 3.7σ trở lên cho mọi kênh. Dùng ảnh 64×64 cho phần thống
  // kê (32×32 cho seed 7 có mean R −6.42 do mẫu chroma chỉ 256).
  const s = img(64, 64, () => [128, 128, 128, 255]);
  applyNoise(s, 0.5, 7);
  const sigma = 27.5 / Math.sqrt(3);
  const theoryStd = [2.14, 1.3, 2.41].map((k) => k * sigma);
  const theoryCorr = [0.15, 0.26, 0.3]; // RG, RB, GB
  const vals: number[][] = [[], [], []];
  for (let ch = 0; ch < 3; ch++) {
    for (let i = ch; i < s.data.length; i += 4) vals[ch].push(s.data[i] - 128);
  }
  const stats = vals.map((vs) => {
    const n = vs.length;
    const mu = vs.reduce((a2, v) => a2 + v, 0) / n;
    const std = Math.sqrt(vs.reduce((a2, v) => a2 + (v - mu) ** 2, 0) / n);
    const kurt = vs.reduce((a2, v) => a2 + ((v - mu) / std) ** 4, 0) / n - 3;
    return { mu, std, kurt };
  });
  const corr = (x: number[], y: number[]) => {
    const n = x.length;
    const mx = x.reduce((a2, v) => a2 + v, 0) / n;
    const my = y.reduce((a2, v) => a2 + v, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    return sxy / Math.sqrt(sxx * syy);
  };
  const corrs = [corr(vals[0], vals[1]), corr(vals[0], vals[2]), corr(vals[1], vals[2])];
  let maxDev = 0;
  for (let ch = 0; ch < 3; ch++) {
    assert.ok(Math.abs(stats[ch].mu) < 4, `kênh ${ch}: trung bình ${stats[ch].mu.toFixed(2)} lệch khỏi 0 (SE≈${[0.93, 0.4, 1.09][ch]})`);
    assert.ok(
      stats[ch].std >= 0.85 * theoryStd[ch] && stats[ch].std <= 1.15 * theoryStd[ch],
      `kênh ${ch}: std ${stats[ch].std.toFixed(2)} ngoài [0.85,1.15]×${theoryStd[ch].toFixed(2)} (mô hình YUV)`,
    );
    assert.ok(stats[ch].kurt >= -0.6 && stats[ch].kurt <= 0.6, `kênh ${ch}: kurtosis ${stats[ch].kurt.toFixed(2)} ngoài [-0.6,0.6]`);
    assert.ok(
      Math.abs(corrs[ch] - theoryCorr[ch]) <= 0.12,
      `corr ${["RG", "RB", "GB"][ch]} ${corrs[ch].toFixed(3)} lệch lý thuyết YUV ${theoryCorr[ch]} quá 0.12 (mô hình RGB cũ cho ≈ 0)`,
    );
    maxDev = Math.max(maxDev, ...vals[ch].map((v) => Math.abs(v)));
  }
  assert.ok(maxDev > 28, `nhiễu Gauss phải có pixel vượt strength, max lệch chỉ ${maxDev}`);
  // Alpha không đổi.
  assert.ok(s.data.every((v, i) => i % 4 !== 3 || v === 255));
});

console.log("== effectCanvas: noise bt601 cho nguồn SD (đợt 80 H3, probe b) ==");
ok("yuvMatrixForSourceWidth: ≤640 → bt601, còn lại → bt709 (cùng quy tắc render chain)", () => {
  assert.equal(yuvMatrixForSourceWidth(640), "bt601");
  assert.equal(yuvMatrixForSourceWidth(360), "bt601");
  assert.equal(yuvMatrixForSourceWidth(641), "bt709");
  assert.equal(yuvMatrixForSourceWidth(1280), "bt709");
  assert.equal(yuvMatrixForSourceWidth(1920), "bt709");
});
ok("noise bt601: thống kê Gauss YUV đúng strength với hệ số convert bt601 (đợt 80 H3)", () => {
  // Lý thuyết bt601 (hệ số convert limited-range, sigma = strength/√3):
  // std RGB = [1.98, 1.47, 2.33]×sigma; corr [RG 0.02, RB 0.29, GB 0.16].
  // Khác bt709 ([2.14, 1.30, 2.41] / [0.15, 0.26, 0.30]) đủ để test phân
  // biệt: dùng đúng ngưỡng bt601 thì bản bt709 rớt corr RG (0.15 vs 0.02,
  // lệch 0.13 > 0.12) và std G (1.30 vs 1.47, lệch 13% > band 15%? —
  // band std [0.85,1.15]×1.47 = [1.25,1.69] vẫn chứa 1.30 nên corr RG
  // là chỉ số phân biệt chính; ngược lại test bt709 bắt bản bt601 ở
  // corr GB (0.16 vs 0.30, lệch 0.14 > 0.12).
  const s = img(64, 64, () => [128, 128, 128, 255]);
  applyNoise(s, 0.5, 7, "bt601");
  const sigma = 27.5 / Math.sqrt(3);
  const theoryStd = [1.98, 1.47, 2.33].map((k) => k * sigma);
  const theoryCorr = [0.02, 0.29, 0.16]; // RG, RB, GB
  const vals: number[][] = [[], [], []];
  for (let ch = 0; ch < 3; ch++) {
    for (let i = ch; i < s.data.length; i += 4) vals[ch].push(s.data[i] - 128);
  }
  const stats = vals.map((vs) => {
    const n = vs.length;
    const mu = vs.reduce((a2, v) => a2 + v, 0) / n;
    const std = Math.sqrt(vs.reduce((a2, v) => a2 + (v - mu) ** 2, 0) / n);
    const kurt = vs.reduce((a2, v) => a2 + ((v - mu) / std) ** 4, 0) / n - 3;
    return { mu, std, kurt };
  });
  const corr = (x: number[], y: number[]) => {
    const n = x.length;
    const mx = x.reduce((a2, v) => a2 + v, 0) / n;
    const my = y.reduce((a2, v) => a2 + v, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    return sxy / Math.sqrt(sxx * syy);
  };
  const corrs = [corr(vals[0], vals[1]), corr(vals[0], vals[2]), corr(vals[1], vals[2])];
  for (let ch = 0; ch < 3; ch++) {
    assert.ok(Math.abs(stats[ch].mu) < 4, `kênh ${ch}: trung bình ${stats[ch].mu.toFixed(2)} lệch khỏi 0`);
    assert.ok(
      stats[ch].std >= 0.85 * theoryStd[ch] && stats[ch].std <= 1.15 * theoryStd[ch],
      `kênh ${ch}: std ${stats[ch].std.toFixed(2)} ngoài [0.85,1.15]×${theoryStd[ch].toFixed(2)} (mô hình YUV bt601)`,
    );
    assert.ok(stats[ch].kurt >= -0.6 && stats[ch].kurt <= 0.6, `kênh ${ch}: kurtosis ${stats[ch].kurt.toFixed(2)} ngoài [-0.6,0.6]`);
    assert.ok(
      Math.abs(corrs[ch] - theoryCorr[ch]) <= 0.12,
      `corr ${["RG", "RB", "GB"][ch]} ${corrs[ch].toFixed(3)} lệch lý thuyết YUV bt601 ${theoryCorr[ch]} quá 0.12`,
    );
  }
  // Alpha không đổi.
  assert.ok(s.data.every((v, i) => i % 4 !== 3 || v === 255));
});
ok("noise mặc định vẫn bt709 (hành vi cũ cho HD) và applyCanvasEffects truyền matrix", () => {
  const mk = () => img(32, 32, () => [128, 128, 128, 255]);
  const a = mk(), b = mk();
  applyNoise(a, 0.5, 7);
  applyNoise(b, 0.5, 7, "bt709");
  assert.deepEqual([...a.data], [...b.data], "mặc định phải giống bt709 tường minh");
  const c = mk();
  applyNoise(c, 0.5, 7, "bt601");
  assert.notDeepEqual([...c.data], [...a.data], "bt601 phải khác bt709 với cùng seed");
  // addYuvNoise trực tiếp + qua applyCanvasEffects phải cho cùng kết quả.
  const d = mk(), e = mk();
  addYuvNoise(d, 27.5, 7, "bt601");
  applyCanvasEffects(e, [{ type: "noise", intensity: 0.5, seed: 7 }], "bt601");
  assert.deepEqual([...d.data], [...e.data]);
});

console.log("== effectCanvas: điều phối ==");
ok("applyCanvasEffects áp theo thứ tự mảng", () => {
  const a = img(4, 1, (x) => [x * 60, 0, 0, 255]);
  applyCanvasEffects(a, [
    { type: "mirror", intensity: 0.5 },
    { type: "pixelate", intensity: 0 },
  ]);
  // mirror → [180,120,60,0]; pixelate k=2 lấy mẫu TÂM khối → khối 1 về
  // mẫu (1,0)=120, khối 2 về mẫu (3,0)=0.
  assert.deepEqual([px(a, 0, 0)[0], px(a, 1, 0)[0], px(a, 2, 0)[0], px(a, 3, 0)[0]], [120, 120, 0, 0]);
});
ok("canvasEffectOps: chỉ giữ 8 type canvas, shake lấy dx/dy từ localT, noise/glitch có seed", () => {
  const ops: CanvasEffectOp[] = canvasEffectOps(
    [
      { type: "mirror", intensity: 0.5 },
      { type: "blur", intensity: 0.5 },
      { type: "shake", intensity: 0.5 },
      { type: "noise", intensity: 0.5 },
      { type: "glitch", intensity: 0.5 },
      { type: "vignette", intensity: 0.5 },
    ],
    0,
  );
  assert.deepEqual(ops.map((o) => o.type), ["mirror", "shake", "noise", "glitch"]);
  const shake = ops.find((o) => o.type === "shake")!;
  assert.deepEqual({ dx: shake.dx, dy: shake.dy }, { dx: 0, dy: -12 });
  assert.ok(typeof ops.find((o) => o.type === "noise")!.seed === "number");
  // Cùng localT → cùng seed; khác localT đủ xa → seed khác (noise đổi frame).
  const ops2 = canvasEffectOps([{ type: "noise" }], 0.5);
  assert.notEqual(ops2[0].seed, ops.find((o) => o.type === "noise")!.seed);
});

console.log("== previewEngine.effectsVisual: không còn skip 8 type canvas ==");
ok("effectsVisual trả skipped = [] cho cả 8 type, CSS không chứa chúng", () => {
  const all = ["sharpen", "noise", "glitch", "rgb-shift", "shake", "pixelate", "mirror", "edgedetect"].map(
    (type) => ({ type, intensity: 0.5 }),
  );
  const v = effectsVisual(all as never);
  assert.deepEqual(v.skipped, []);
  assert.equal(v.css, "");
});
ok("effectsVisual vẫn báo type lạ chưa biết", () => {
  const v = effectsVisual([{ type: "hologram", intensity: 0.5 }] as never);
  assert.deepEqual(v.skipped, ["hologram"]);
});

console.log(`\nPASS ${pass} test`);
