/**
 * r72z7-trilinear-2dblend.mjs — Phase 9 đợt 72, luồng Z7.
 * Resample trilinear mipmap ĐÚNG (blend-at-end, 2D) thay cho
 * resamplePlaneTrilinear/resampleRgb24Trilinear trong chrome-resample.mjs.
 *
 * Vấn đề (đo được, xem docs/PHASE9_ROUND72_Z7_2D_KERNEL_LIMITS.md):
 * production trộn 2 mức mip NGAY TRONG từng pass 1D (X rồi Y), tức
 *   out = (1−f)·Y0((1−f)·X0 + f·X1) + f·Y1((1−f)·X0 + f·X1)
 *      = (1−f)²·T0T0 + f(1−f)·T0T1 + f(1−f)·T1T0 + f²·T1T1,
 * sinh ra 2 số hạng chéo T0T1/T1T0 (halve 1 trục) không tồn tại trong
 * pipeline thật. Chrome (Skia trilinear) lấy mẫu bilinear 2D từng mức
 * mip trước, rồi mới trộn 2 kết quả 2D:
 *   out = (1−f)·Bilin2D(mip L) + f·Bilin2D(mip L+1).
 * Số đo (lưới pha mịn 6 thang × 256 điểm + 50 ô Y8 độc lập, 10 thang):
 * blend-at-end maxAbs = 1 mọi thang (mức làm tròn uint8), production
 * blend-từng-pass maxAbs tới 19 (s=0,45/0,55) và 13 (ô Y8).
 * Hệ số blend f (bias LOD −0,5) KHÔNG sai: fit Δf ≈ 0 (±0,0008).
 * 1D không đổi: với ảnh 1D (vạch dọc/ngang) 2 mô hình cho đúng 1 kết quả
 * (pass Y không đổi ảnh hằng theo y) — xem test đi kèm.
 *
 * Phạm vi đã kiểm chứng: thang bằng nhau 2 trục (s = dst/src, hình học
 * vuông và viewport 1280×720→489×275, s=0,382). Thang khác nhau 2 trục:
 * dùng λ* = max(λx*, λy*) (quy ước LOD chuẩn theo trục co nhất) — CHƯA
 * đo, ghi rõ để đợt sau kiểm trước khi dùng cho hình học dẹt.
 * CẬP NHẬT Phase 9 đợt 75, luồng C2 (docs/PHASE9_ROUND75_C2_RESAMPLE_ANISO_MODEL_LIMITS.md):
 * quy tắc min-scale SAI ở dẹt (maxAbs 41–60 trên lưới B2); LOD giờ lấy
 * theo TRUNG BÌNH NHÂN s = √(sx·sy) — khớp headed maxAbs = 1 cả dẹt
 * (1.536 điểm × 6 cặp, 259.584 ô) lẫn đẳng hướng (≡ production cũ khi
 * sx = sy). Module này đổi cùng quy tắc để production vẫn bit-identical
 * với nó (xem test đi kèm).
 * KHÔNG sửa chrome-resample.mjs (file chung, các luồng khác đang dùng):
 * module này là bản sửa drop-in để parent quyết merge.
 * KHÔNG push/tag/binary.
 */
import { chromeWeights1D, roundHalfDown, triangleKernel } from "./chrome-resample.mjs";

/** λ* và (L, f) cho 1 thang s (như trilinearRow1D). */
export function trilinear2DParams(scale) {
  const lam = Math.log2(1 / scale);
  const lamStar = Math.max(0, lam - 0.5);
  const L = Math.floor(lamStar);
  return { L, f: lamStar - L, lam, lamStar };
}

/** Halve 2D (box 2×2 qua 2 pass 1D, roundHalfDown từng pixel). */
function halve2D(img, w, h) {
  const mw = Math.max(1, Math.round(w / 2));
  const tmp = new Float64Array(mw * h);
  for (let y = 0; y < h; y++) {
    for (let i = 0; i < mw; i++) {
      let acc = 0;
      for (const [j, wt] of chromeWeights1D(i, 0.5, w, triangleKernel, 1)) acc += wt * img[y * w + j];
      tmp[y * mw + i] = roundHalfDown(acc);
    }
  }
  const mh = Math.max(1, Math.round(h / 2));
  const out = new Float64Array(mw * mh);
  for (let x = 0; x < mw; x++) {
    for (let i = 0; i < mh; i++) {
      let acc = 0;
      for (const [j, wt] of chromeWeights1D(i, 0.5, h, triangleKernel, 1)) acc += wt * tmp[j * mw + x];
      out[i * mw + x] = roundHalfDown(acc);
    }
  }
  return { img: out, w: mw, h: mh };
}

/** Bilinear 2D (triangle h=1, pass X rồi Y).
 * ĐỢT 75 C2: tính FLOAT, không làm tròn giữa các pass (xem ghi chú cùng
 * tên trong chrome-resample.mjs) — chỉ làm tròn một lần ở blend cuối.
 * Halve vẫn roundHalfDown (mức mip là uint8). */
function bilinear2D(img, w, h, dstW, dstH) {
  const sx = dstW / w, sy = dstH / h;
  const tmp = new Float64Array(dstW * h);
  for (let y = 0; y < h; y++) {
    for (let i = 0; i < dstW; i++) {
      let acc = 0;
      for (const [j, wt] of chromeWeights1D(i, sx, w, triangleKernel, 1)) acc += wt * img[y * w + j];
      tmp[y * dstW + i] = acc;
    }
  }
  const out = new Float64Array(dstW * dstH);
  for (let x = 0; x < dstW; x++) {
    for (let i = 0; i < dstH; i++) {
      let acc = 0;
      for (const [j, wt] of chromeWeights1D(i, sy, h, triangleKernel, 1)) acc += wt * tmp[j * dstW + x];
      out[i * dstW + x] = acc;
    }
  }
  return out;
}

/**
 * Resample 1 plane bằng trilinear blend-at-end. Trả Float64Array (giá trị
 * đã nguyên sau blend cuối). Thang bằng nhau 2 trục là trường hợp đã đo;
 * thang khác nhau: L, f lấy theo TRUNG BÌNH NHÂN s = √(sx·sy) (đợt 75 C2:
 * quy tắc min-scale cũ sai ở dẹt, maxAbs 41–60; geo-mean khớp headed
 * maxAbs = 1 mọi cặp dẹt của B2 + sweep dẹt U2).
 */
export function resamplePlaneTrilinear2D(src, srcW, srcH, dstW, dstH) {
  const sx = dstW / srcW, sy = dstH / srcH;
  const { L, f } = trilinear2DParams(Math.sqrt(sx * sy));
  let mip = { img: Float64Array.from(src), w: srcW, h: srcH };
  for (let k = 0; k < L; k++) mip = halve2D(mip.img, mip.w, mip.h);
  const a = bilinear2D(mip.img, mip.w, mip.h, dstW, dstH);
  // Đợt 75 C2: bilinear float; làm tròn MỘT lần ở đây (f=0) hoặc ở blend
  // cuối (f≠0) — như production.
  if (f === 0) {
    for (let i = 0; i < a.length; i++) a[i] = Math.round(a[i]);
    return a;
  }
  const mip1 = halve2D(mip.img, mip.w, mip.h);
  const b = bilinear2D(mip1.img, mip1.w, mip1.h, dstW, dstH);
  const out = new Float64Array(dstW * dstH);
  for (let i = 0; i < out.length; i++) out[i] = Math.round((1 - f) * a[i] + f * b[i]);
  return out;
}

/** Resample 1 frame RGB24 bằng trilinear blend-at-end. Trả Buffer RGB24. */
export function resampleRgb24Trilinear2D(rgb, srcW, srcH, dstW, dstH) {
  const n = srcW * srcH;
  const out = Buffer.alloc(dstW * dstH * 3);
  for (let c = 0; c < 3; c++) {
    const plane = new Float64Array(n);
    for (let i = 0; i < n; i++) plane[i] = rgb[i * 3 + c];
    const rs = resamplePlaneTrilinear2D(plane, srcW, srcH, dstW, dstH);
    for (let i = 0; i < dstW * dstH; i++) {
      const v = Math.round(rs[i]);
      out[i * 3 + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return out;
}
