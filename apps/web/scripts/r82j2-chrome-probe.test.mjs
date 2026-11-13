// r82j2-chrome-probe.test.mjs — Phase 9 đợt 82, luồng J2: test bộ máy
// phân tích probe (offline, không cần headed).
//   1. resampleRow1D khớp resamplePlaneKernel trên mặt phẳng hằng theo y
//      (sau làm tròn uint8) — cơ sở để fit 1D thay cho 2D.
//   2. Grid fit khôi phục đúng kernel đã biết từ dữ liệu tổng hợp:
//      dữ liệu sinh bằng BC(0,25, 0,375) -> fit phải trả về đúng (0,25, 0,375);
//      dữ liệu sinh bằng tam giác -> fit phải trả về tam giác.
//   3. bcCubic khớp các trường hợp đặc biệt đã biết: BC(1/3,1/3) tại 0
//      bằng 8/9? (K(0) = (6-2B)/6 = 8/9 với B=1/3), Catmull K(0)=1.
// Chạy: node --test apps/web/scripts/r82j2-chrome-probe.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { bcCubic, KERNELS, resampleRow1D, resamplePlaneKernel, madRows } from "./r82j2-chrome-probe-analyze.mjs";
import { triangleKernel } from "./chrome-resample.mjs";

const roundU8 = (v) => { const r = Math.round(v); return r < 0 ? 0 : r > 255 ? 255 : r; };

function sqwRow(period, lo, hi, w = 512) {
  const row = new Float64Array(w);
  for (let x = 0; x < w; x++) row[x] = (Math.floor(x / (period / 2)) % 2 === 0) ? lo : hi;
  return row;
}

test("resampleRow1D khớp resamplePlaneKernel trên mặt phẳng hằng-y", () => {
  const row = sqwRow(8, 64, 192);
  const plane = new Float64Array(512 * 512);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) plane[y * 512 + x] = row[x];
  for (const [name, kern] of Object.entries(KERNELS)) {
    const r1 = Array.from(resampleRow1D(row, 580, kern), roundU8);
    const r2d = resamplePlaneKernel(plane, 512, 512, 580, 580, kern);
    const mid = Math.floor(580 / 2);
    let maxD = 0;
    for (let i = 0; i < 580; i++) maxD = Math.max(maxD, Math.abs(r1[i] - roundU8(r2d[mid * 580 + i])));
    assert.equal(maxD, 0, `${name}: 1D vs 2D lệch ${maxD}`);
  }
});

test("grid fit khôi phục đúng kernel từ dữ liệu tổng hợp", () => {
  const cases = [
    { name: "BC(0,25, 0,375)", kern: KERNELS["bc025-0375"], want: { B: 0.25, C: 0.375 } },
    { name: "triangle", kern: triangleKernel, want: "tri" },
    { name: "Mitchell", kern: KERNELS.mitchell, want: { B: 1 / 3, C: 1 / 3 } },
  ];
  const Bvals = [0, 0.125, 0.25, 1 / 3, 0.5];
  const Cvals = [0, 0.25, 1 / 3, 0.375, 0.5];
  for (const c of cases) {
    // Dữ liệu "Chrome" tổng hợp: sqw4+sqw8 @ s1132+s1264 qua kernel thật.
    const synth = {};
    for (const k of ["sqw4", "sqw8"]) for (const dw of [580, 647]) {
      const row = k === "sqw4" ? sqwRow(8, 64, 192) : sqwRow(16, 64, 192);
      synth[`${k}@${dw}`] = Array.from(resampleRow1D(row, dw, c.kern), roundU8);
    }
    const grid = [];
    for (const B of Bvals) for (const C of Cvals) {
      const kern = (x) => bcCubic(x, B, C);
      let sum = 0, n = 0;
      for (const k of ["sqw4", "sqw8"]) for (const dw of [580, 647]) {
        const row = k === "sqw4" ? sqwRow(8, 64, 192) : sqwRow(16, 64, 192);
        const pred = Array.from(resampleRow1D(row, dw, kern), roundU8);
        for (let i = 0; i < dw; i++) { sum += Math.abs(synth[`${k}@${dw}`][i] - pred[i]); n++; }
      }
      grid.push({ B: +B.toFixed(4), C: +C.toFixed(4), mad: +(sum / n).toFixed(3) });
    }
    let sumTri = 0, nTri = 0;
    for (const k of ["sqw4", "sqw8"]) for (const dw of [580, 647]) {
      const row = k === "sqw4" ? sqwRow(8, 64, 192) : sqwRow(16, 64, 192);
      const pred = Array.from(resampleRow1D(row, dw, triangleKernel), roundU8);
      for (let i = 0; i < dw; i++) { sumTri += Math.abs(synth[`${k}@${dw}`][i] - pred[i]); nTri++; }
    }
    grid.push({ B: "tri", C: "tri", mad: +(sumTri / nTri).toFixed(3) });
    grid.sort((a, b) => a.mad - b.mad);
    const best = grid[0];
    assert.equal(best.mad, 0, `${c.name}: fit tốt nhất phải MAD=0, được ${best.mad}`);
    if (c.want === "tri") {
      assert.equal(best.B, "tri", `${c.name}: kỳ vọng tri, được B=${best.B},C=${best.C}`);
    } else {
      assert.ok(Math.abs(best.B - c.want.B) < 1e-3 && Math.abs(best.C - c.want.C) < 1e-3,
        `${c.name}: kỳ vọng (B=${c.want.B},C=${c.want.C}), được (B=${best.B},C=${best.C})`);
    }
  }
});

test("bcCubic: các giá trị đặc biệt", () => {
  assert.equal(bcCubic(0, 1 / 3, 1 / 3), (6 - 2 / 3) / 6); // K(0) Mitchell = 8/9
  assert.equal(bcCubic(0, 0, 0.5), 1); // K(0) Catmull = 1
  assert.equal(bcCubic(0, 0.25, 0.375), (6 - 0.5) / 6); // K(0) BC E9
  assert.equal(bcCubic(2.5, 0.25, 0.375), 0); // ngoài support
  assert.equal(bcCubic(0, 1, 0), (6 - 2) / 6); // K(0) B-spline = 2/3
});

test("madRows: 0 khi giống hệt, dương khi khác", () => {
  assert.equal(madRows([1, 2, 3], [1, 2, 3]), 0);
  assert.equal(madRows([0, 0], [3, 5]), 4);
});
