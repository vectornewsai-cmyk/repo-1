// webglLut.test.ts — test parseCubeData + trilinear CPU đối chiếu FFmpeg lut3d.
// Chạy bằng Node type-stripping (không cần browser):
//   node --experimental-strip-types src/lib/webglLut.test.ts
// Phần GPU (shader) được kiểm chứng riêng bằng Playwright (xem R5_LIMITS.md).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import {
  parseCubeData,
  trilinearSample,
  applyLutToPixels,
  type CubeData,
} from "./webglLut.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..", "..");

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

function identityCube(size: number): CubeData {
  const data = new Float32Array(size * size * size * 3);
  for (let b = 0; b < size; b++)
    for (let g = 0; g < size; g++)
      for (let r = 0; r < size; r++) {
        const idx = (r + size * (g + size * b)) * 3;
        data[idx] = r / (size - 1);
        data[idx + 1] = g / (size - 1);
        data[idx + 2] = b / (size - 1);
      }
  return { size, domainMin: [0, 0, 0], domainMax: [1, 1, 1], data };
}

console.log("== webglLut: parse + trilinear ==");
ok("parse .cube thật 17^3 (vcut-cinematic)", () => {
  const text = readFileSync(path.join(REPO, "assets", "filters", "vcut-cinematic.cube"), "utf8");
  const cube = parseCubeData(text);
  assert.equal(cube.size, 17);
  assert.equal(cube.data.length, 17 * 17 * 17 * 3);
  assert.deepEqual(cube.domainMin, [0, 0, 0]);
  assert.deepEqual(cube.domainMax, [1, 1, 1]);
});
ok("parse domain tùy chỉnh + TITLE", () => {
  const cube = parseCubeData(
    'TITLE "Test"\nDOMAIN_MIN 0.1 0.2 0.0\nDOMAIN_MAX 0.9 0.8 1.0\nLUT_3D_SIZE 2\n' +
      "0 0 0\n1 0 0\n0 1 0\n1 1 0\n0 0 1\n1 0 1\n0 1 1\n1 1 1\n",
  );
  assert.equal(cube.size, 2);
  assert.deepEqual(cube.domainMin, [0.1, 0.2, 0]);
  assert.deepEqual(cube.domainMax, [0.9, 0.8, 1]);
});
ok("từ chối: rỗng / thiếu size / sai số dòng / LUT 1D", () => {
  assert.throws(() => parseCubeData(""), /rỗng/);
  assert.throws(() => parseCubeData("0 0 0\n"), /LUT_3D_SIZE/);
  assert.throws(() => parseCubeData("LUT_3D_SIZE 2\n0 0 0\n"), /không khớp/);
  assert.throws(() => parseCubeData("LUT_1D_SIZE 2\n"), /LUT 3D/);
});
ok("trilinear: LUT identity passthrough chính xác", () => {
  const cube = identityCube(4);
  for (const [r, g, b] of [
    [0, 0, 0],
    [1, 1, 1],
    [0.3, 0.6, 0.9],
    [0.123, 0.456, 0.789],
  ]) {
    const [or, og, ob] = trilinearSample(cube, r, g, b);
    assert.ok(Math.abs(or - r) < 1e-6, `r ${or} != ${r}`);
    assert.ok(Math.abs(og - g) < 1e-6, `g ${og} != ${g}`);
    assert.ok(Math.abs(ob - b) < 1e-6, `b ${ob} != ${b}`);
  }
});
ok("trilinear: domain co giãn đúng (giá trị ngoài domain bị clamp)", () => {
  const cube: CubeData = {
    size: 2,
    domainMin: [0.25, 0.25, 0.25],
    domainMax: [0.75, 0.75, 0.75],
    data: new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0,
      0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1,
    ]),
  };
  // Điểm giữa domain → giữa LUT = (0.5, 0.5, 0.5).
  const [r, g, b] = trilinearSample(cube, 0.5, 0.5, 0.5);
  assert.ok(Math.abs(r - 0.5) < 1e-6 && Math.abs(g - 0.5) < 1e-6 && Math.abs(b - 0.5) < 1e-6);
  // Ngoài domain → clamp về góc.
  const [r2] = trilinearSample(cube, 0, 0, 0);
  assert.ok(Math.abs(r2 - 0) < 1e-6);
});

console.log("== webglLut: CPU vs FFmpeg lut3d (fixture 64x64) ==");
const fixture = JSON.parse(
  readFileSync(path.join(HERE, "__fixtures__-webglLut.json"), "utf8"),
) as { w: number; h: number; refs: Record<string, number[]> };
for (const lut of ["vcut-cinematic", "cartcut-teal-orange"]) {
  ok(`CPU trilinear ≈ FFmpeg lut3d (${lut})`, () => {
    const { w: W, h: H } = fixture;
    const grad = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        grad[i] = Math.floor((x * 255) / (W - 1));
        grad[i + 1] = Math.floor((y * 255) / (H - 1));
        grad[i + 2] = Math.floor(((x + y) * 255) / (W + H - 2));
        grad[i + 3] = 255;
      }
    const cube = parseCubeData(
      readFileSync(path.join(REPO, "assets", "filters", `${lut}.cube`), "utf8"),
    );
    const out = applyLutToPixels(cube, grad);
    const ref = fixture.refs[lut];
    let sum = 0;
    let max = 0;
    let n = 0;
    for (let p = 0; p < W * H; p++) {
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(out[p * 4 + c] - ref[p * 3 + c]);
        sum += d;
        max = Math.max(max, d);
        n++;
      }
    }
    const mae = sum / n;
    console.log(`    (MAE=${mae.toFixed(4)}, max=${max})`);
    // Đo thật 24/10: MAE ~0.45–0.51, max ≤ 2 (mức làm tròn 8-bit).
    assert.ok(mae < 1.0, `MAE ${mae} vượt ngưỡng 1.0`);
    assert.ok(max <= 3, `max ${max} vượt ngưỡng 3`);
  });
}

console.log(`\n== KẾT QUẢ: ${pass} pass ==`);
