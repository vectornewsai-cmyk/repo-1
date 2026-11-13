#!/usr/bin/env node
/**
 * r72z7-trilinear-2dblend.test.mjs — Phase 9 đợt 72, luồng Z7.
 * Test cho module sửa trilinear blend-at-end (r72z7-trilinear-2dblend.mjs):
 *  (1) khớp dữ liệu đo headed: lưới pha mịn đợt 72 (mẫu 8 điểm/thang × 6
 *      thang) + 50 ô Y8 độc lập (10 thang) — maxAbs ≤ 2;
 *  (2) khác production cũ đúng chỗ: tại ô tệ nhất của production
 *      ((250,250), s=0,4492) module mới cho peak 98 ± 1 như đo, production
 *      cũ cho 79 — pin hành vi sửa;
 *  (3) 1D không đổi: hàng sweep vạch dọc của module mới == production
 *      (exact) — sửa 2D không phá 1D.
 * CẬP NHẬT Phase 9 đợt 75, luồng C2: quy tắc LOD đổi sang trung bình nhân
 * s = √(sx·sy) (docs/PHASE9_ROUND75_C2_RESAMPLE_ANISO_MODEL_LIMITS.md).
 * Production và module tham chiếu đổi cùng quy tắc nên vẫn bit-identical
 * (test 3, test 4). Thêm test (5): khớp lưới pha mịn DẸT headed của B2
 * (6 cặp sx≠sy, maxAbs ≤ 2) + deepEqual production/module ở hình học dẹt.
 * Chạy: node --test
 * apps/web/scripts/r72z7-trilinear-2dblend.test.mjs
 * (đọc dữ liệu đo tại hidden_files/round72-z7 + round67-u2/round68-v3
 * + round74-b2).
 * KHÔNG push/tag/binary.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resampleRgb24Trilinear2D } from "./r72z7-trilinear-2dblend.mjs";
import { resampleRgb24Trilinear } from "./chrome-resample.mjs";

const HF = path.join(os.homedir(), "workspace", "goals", "capcut-clone-video-editor", "hidden_files");
const S = 512;
function deltaImage(px, py) {
  const rgb = Buffer.alloc(S * S * 3, 0);
  const i = (py * S + px) * 3;
  rgb[i] = 255; rgb[i + 1] = 255; rgb[i + 2] = 255;
  return rgb;
}

test("blend-at-end khớp lưới pha mịn đợt 72 (maxAbs ≤ 2)", () => {
  const probe = JSON.parse(fs.readFileSync(path.join(HF, "round72-z7", "r72z7-2d-grid-A.json"), "utf8"));
  for (const dwKey of Object.keys(probe.scales).sort((a, b) => +a - +b)) {
    const sc = probe.scales[dwKey];
    const dw = sc.dw;
    let maxAbs = 0, se = 0, n = 0;
    // mẫu 8 điểm chéo mỗi thang (đủ phủ pha, giữ test chạy nhanh)
    const sample = sc.points.filter((p) => p.px === p.py).slice(0, 8);
    assert.equal(sample.length, 8, `dw=${dw} thiếu điểm mẫu`);
    for (const pt of sample) {
      const out = resampleRgb24Trilinear2D(deltaImage(pt.px, pt.py), S, S, dw, dw);
      for (let b = -6; b <= 6; b++) for (let a = -6; a <= 6; a++) {
        const mv = pt.win[b + 6][a + 6];
        if (mv < 0) continue;
        const pv = out[((pt.peakY + b) * dw + (pt.peakX + a)) * 3];
        const d = mv - pv;
        se += d * d; n++;
        maxAbs = Math.max(maxAbs, Math.abs(d));
      }
    }
    assert.ok(maxAbs <= 2, `dw=${dw}: maxAbs=${maxAbs} > 2`);
    assert.ok(Math.sqrt(se / n) <= 0.1, `dw=${dw}: RMSE=${Math.sqrt(se / n).toFixed(3)} > 0,1`);
  }
});

test("blend-at-end khớp 50 ô Y8 độc lập (maxAbs ≤ 2)", () => {
  const u2 = JSON.parse(fs.readFileSync(path.join(HF, "round67-u2", "r67u2-filter2-A.json"), "utf8"));
  const thr = JSON.parse(fs.readFileSync(path.join(HF, "round68-v3", "r68v3-threshold-A.json"), "utf8"));
  const FULL = {};
  for (const k of Object.keys(u2.scales)) FULL[k] = u2.scales[k];
  for (const k of Object.keys(thr.scales)) FULL[k] = thr.scales[k];
  let maxAbs = 0, cells = 0;
  for (const sKey of Object.keys(FULL)) {
    const e = FULL[sKey];
    const dw = e.dw;
    for (const pk of Object.keys(e.pointsSq)) {
      const pt = e.pointsSq[pk];
      const [px, py] = pk.split(",").map(Number);
      const out = resampleRgb24Trilinear2D(deltaImage(px, py), S, S, dw, dw);
      for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) {
        const x = pt.peakX + a, y = pt.peakY + b;
        if (x < 0 || y < 0 || x >= dw || y >= dw) continue;
        const d = pt.nb[b + 2][a + 2] - out[(y * dw + x) * 3];
        maxAbs = Math.max(maxAbs, Math.abs(d));
        cells++;
      }
    }
  }
  assert.ok(cells >= 1200, `quá ít ô Y8: ${cells}`);
  assert.ok(maxAbs <= 2, `ô Y8: maxAbs=${maxAbs} > 2`);
});

test("ô tệ nhất của production cũ: production (đã merge blend-at-end) cho đúng peak đo", () => {
  // (250,250), s=0,4492 (dw=230): đo peak 98, production cũ (blend-từng-pass) 79.
  // ĐỢT 73 A1: production đã merge blend-at-end nên test này đổi kỳ vọng:
  // production mới phải cho 98 ± 1 như đo và bit-identical với module tham chiếu.
  const dw = 230;
  const outNew = resampleRgb24Trilinear2D(deltaImage(250, 250), S, S, dw, dw);
  const outProd = resampleRgb24Trilinear(deltaImage(250, 250), S, S, dw, dw);
  // peak đo tại (115,115) theo probe đợt 72 (peakX/peakY của điểm này)
  const probe = JSON.parse(fs.readFileSync(path.join(HF, "round72-z7", "r72z7-2d-grid-A.json"), "utf8"));
  const pt = probe.scales["230"].points.find((p) => p.px === 250 && p.py === 250);
  const idx = (pt.peakY * dw + pt.peakX) * 3;
  assert.equal(pt.peak, 98, "dữ liệu đo peak phải là 98");
  assert.ok(Math.abs(outNew[idx] - 98) <= 1, `module tham chiếu peak=${outNew[idx]}, đo 98`);
  assert.ok(Math.abs(outProd[idx] - 98) <= 1, `production đã merge peak=${outProd[idx]}, đo 98 (cũ: 79)`);
  assert.deepEqual(outProd, outNew, "production đã merge phải bit-identical với module tham chiếu");
});

test("1D không đổi: hàng sweep vạch dọc == production (exact)", () => {
  const dw = 307; // s=0,5996
  const line = Buffer.alloc(S * S * 3, 0);
  for (let y = 0; y < S; y++) { const i = (y * S + 256) * 3; line[i] = 255; line[i + 1] = 255; line[i + 2] = 255; }
  const a = resampleRgb24Trilinear2D(line, S, S, dw, dw);
  const b = resampleRgb24Trilinear(line, S, S, dw, dw);
  assert.deepEqual(a, b, "hàng 1D phải giống hệt production");
});

test("dị hướng (đợt 75 C2): khớp lưới pha mịn dẹt headed của B2 (maxAbs ≤ 2)", () => {
  // LOD trung bình nhân s=√(sx·sy): production + module tham chiếu đều phải
  // khớp dữ liệu đo headed dẹt (đợt 74 B2). Bản min-scale cũ lệch tới 60 ở đây.
  const probe = JSON.parse(fs.readFileSync(path.join(HF, "round74-b2", "r74b2-2d-grid-aniso.json"), "utf8"));
  for (const [key, sc] of Object.entries(probe.pairs)) {
    const { dw, dh } = sc;
    let maxAbs = 0, se = 0, n = 0;
    // mẫu 8 điểm chéo mỗi cặp (đủ phủ pha, giữ test chạy nhanh)
    const sample = sc.points.filter((p) => p.px === p.py).slice(0, 8);
    assert.equal(sample.length, 8, `${key} thiếu điểm mẫu`);
    for (const pt of sample) {
      for (const fn of [resampleRgb24Trilinear2D, resampleRgb24Trilinear]) {
        const out = fn(deltaImage(pt.px, pt.py), S, S, dw, dh);
        for (let b = -6; b <= 6; b++) for (let a = -6; a <= 6; a++) {
          const mv = pt.win[b + 6][a + 6];
          if (mv < 0) continue;
          const pv = out[((pt.peakY + b) * dw + (pt.peakX + a)) * 3];
          const d = mv - pv;
          se += d * d; n++;
          maxAbs = Math.max(maxAbs, Math.abs(d));
        }
      }
    }
    assert.ok(maxAbs <= 2, `${key}: maxAbs=${maxAbs} > 2`);
    assert.ok(Math.sqrt(se / n) <= 0.1, `${key}: RMSE=${Math.sqrt(se / n).toFixed(3)} > 0,1`);
  }
});

test("dị hướng: production bit-identical với module tham chiếu ở hình học dẹt", () => {
  // Xung điểm + nhiễu ngẫu nhiên, 512×512 → 230×384 (sx≠sy): hai implementation
  // của cùng quy tắc geo-mean phải cho đúng 1 kết quả.
  const a = resampleRgb24Trilinear2D(deltaImage(250, 248), S, S, 230, 384);
  const b = resampleRgb24Trilinear(deltaImage(250, 248), S, S, 230, 384);
  assert.deepEqual(a, b, "xung dẹt phải giống hệt module tham chiếu");
  let seed = 75;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const noise = Buffer.alloc(S * S * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = Math.floor(rnd() * 256);
  const c = resampleRgb24Trilinear2D(noise, S, S, 282, 196);
  const d = resampleRgb24Trilinear(noise, S, S, 282, 196);
  assert.deepEqual(c, d, "nhiễu dẹt phải giống hệt module tham chiếu");
});
