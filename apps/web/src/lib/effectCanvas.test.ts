// effectCanvas.test.ts — Kiểm chứng bằng số cho 8 effect canvas (V2, Phase 9 đợt 10).
// Chạy bằng Node type-stripping (không cần browser, không cần bundler):
//   node --experimental-strip-types apps/web/src/lib/effectCanvas.test.ts
// (chạy từ gốc repo để alias @repo-1/video-spec resolve qua node_modules).
import assert from "node:assert/strict";
import {
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
ok("glitch = rgb-shift (s=6+t*10, trunc + nhân biên) + noise Gauss (ns=round(10+t*20)), không còn slice (đợt 16 H5)", () => {
  // Ảnh 64×8: R=x, G=128, B=255-x. t=0.5 → s=11, ns=20.
  // Nhiễu Gauss (sigma = ns/√3 ≈ 11.55) KHÔNG kẹp ở ±ns nên không
  // assert từng pixel ≤ ns như bản nhiễu đều cũ; thay bằng thống kê
  // trên toàn khung: trung bình |lệch khỏi shift-thuần| ≈ sigma·√(2/π)
  // ≈ 9.2 và độ lệch chuẩn ≈ sigma ≈ 11.55 cho mỗi kênh.
  const a = img(64, 8, (x) => [x, 128, 255 - x, 255]);
  applyGlitch(a, 0.5, 42);
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
    assert.ok(mean >= 6 && mean <= 14, `kênh ${c}: trung bình |lệch| ${mean.toFixed(2)} ngoài [6,14]`);
    assert.ok(std >= 8 && std <= 15, `kênh ${c}: std lệch ${std.toFixed(2)} ngoài [8,15]`);
  }
});
ok("noise lặp lại được với cùng seed, đổi với seed khác, thống kê Gauss đúng strength (đợt 16 H5)", () => {
  const mk = () => img(32, 32, () => [128, 128, 128, 255]);
  const a = mk();
  const b = mk();
  applyNoise(a, 0.5, 7);
  applyNoise(b, 0.5, 7);
  assert.deepEqual([...a.data], [...b.data]);
  const c = mk();
  applyNoise(c, 0.5, 8);
  assert.notDeepEqual([...c.data], [...a.data]);
  // strength = 5 + 0.5*45 = 27.5, sigma = strength/√3 ≈ 15.88.
  // Nhiễu Gauss KHÔNG kẹp ở ±strength (render cũng vượt ±strength:
  // phẳng 128 + alls=28 cho min 76 / max 192), nên assert bằng thống
  // kê thay vì biên độ từng pixel: trung bình ≈ 128, std mỗi kênh
  // trong [0.8, 1.25]×sigma, kurtosis trong [-0.6, 0.6] (≈ 0 của Gauss,
  // khác −1.2 của nhiễu đều cũ), và có pixel vượt strength.
  let maxDev = 0;
  for (let ch = 0; ch < 3; ch++) {
    const vals: number[] = [];
    for (let i = ch; i < a.data.length; i += 4) vals.push(a.data[i] - 128);
    const mu = vals.reduce((s, v) => s + v, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mu) ** 2, 0) / vals.length);
    const kurt = vals.reduce((s, v) => s + ((v - mu) / std) ** 4, 0) / vals.length - 3;
    assert.ok(Math.abs(mu) < 3, `kênh ${ch}: trung bình ${mu.toFixed(2)} lệch khỏi 0`);
    assert.ok(std >= 12.7 && std <= 19.9, `kênh ${ch}: std ${std.toFixed(2)} ngoài [12.7,19.9]`);
    assert.ok(kurt >= -0.6 && kurt <= 0.6, `kênh ${ch}: kurtosis ${kurt.toFixed(2)} ngoài [-0.6,0.6]`);
    maxDev = Math.max(maxDev, ...vals.map((v) => Math.abs(v)));
  }
  assert.ok(maxDev > 28, `nhiễu Gauss phải có pixel vượt strength, max lệch chỉ ${maxDev}`);
  // Alpha không đổi.
  assert.ok(a.data.every((v, i) => i % 4 !== 3 || v === 255));
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
