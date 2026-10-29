/**
 * dissolveFrand.ts — Mô hình ngưỡng dissolve của FFmpeg xfade, tái tạo
 * đúng từ source (Phase 9 đợt 14, luồng R2).
 *
 * Nguồn: libavfilter/vf_xfade.c của FFmpeg (bản master tải qua GitHub
 * ngày 2026-10-27; máy đo chạy FFmpeg 8.1.2):
 *
 *   static float frand(int x, int y)
 *   {
 *       const float r = sinf(x * 12.9898f + y * 78.233f) * 43758.545f;
 *       return r - floorf(r);
 *   }
 *   // dissolve: smooth = frand(x, y) * 2 + progress * 2 - 1.5
 *   //           dst = smooth >= 0.5 ? xf0 : xf1  (xf1 = clip mới B)
 *   //        ⇔ pixel thành B khi frand(x, y) < progress-thời-gian τ,
 *   //          với τ chạy 0 → 1 trong cửa sổ transition.
 *
 * Điểm mấu chốt mà đợt 13 C2 chưa tìm ra: mọi phép toán trong frand
 * đều là float32 (sinf, hằng float). Tính bằng double (Math.sin trên
 * đối số double) cho kết quả HOÀN TOÀN KHÁC, vì sai số đối số ~1e-4
 * nhân với 43758 sẽ quay fract nhiều vòng — đó là lý do mọi ứng viên
 * double của C2 chỉ đạt ~3,5% khớp bin (mức ngẫu nhiên). Ép đối số,
 * kết quả sin và tích về float32 trước mỗi bước (Math.fround) thì
 * khớp frame render thật 99,97% pixel đúng frame (xem
 * docs/PHASE9_ROUND14_R2_DISSOLVE_LIMITS.md).
 *
 * Giới hạn còn lại (trung thực):
 * - sinf của glibc (C) và Math.sin của JS (double, rồi fround) có thể
 *   lệch nhau ~1 ulp float tại một số ít pixel mà fract nằm sát biên
 *   bin: đo thật 1/3240 pixel lệch 1 frame tại 72×45 (0,03%), các cỡ
 *   khác xem LIMITS. Không có cách nào khử hoàn toàn bằng JS thuần
 *   nếu không re-implement sinf của glibc — lệch này nằm dưới ngưỡng
 *   "khớp" V6 (MAD ≤ 2, ≥99% pixel lệch ≤ 8) nên vẫn đạt matched.
 * - x, y ở đây là chỉ số pixel NGUYÊN của frame render (không phải
 *   tâm pixel +0,5): vf_xfade.c lặp x, y nguyên. Dùng tâm pixel sẽ
 *   cho trường khác hẳn (đã kiểm chứng: khớp ~mức ngẫu nhiên).
 * - Chỉ đúng cho dissolve 8-bit (dissolve8). Bản 16-bit dùng cùng
 *   frand nhưng ngưỡng trên giá trị 16-bit — preview 8-bit của VCut
 *   không phân biệt, và render worker hiện dùng dissolve8 cho nguồn
 *   8-bit nên không ảnh hưởng.
 * - Không phụ thuộc duration, offset, kích thước khung, màu clip hay
 *   lần render (đã chứng minh ở đợt 13 C2 §3): cùng (x, y) luôn cho
 *   cùng ngưỡng ở mọi cỡ khung.
 */

/** Ép về float32 (tương đương phép toán float trong C). */
const f32 = Math.fround;

/**
 * frand(x, y) của vf_xfade.c, tái tạo bằng float32 từng bước:
 * đối số → fround, sin → fround (sinf trả về float), tích → fround,
 * rồi lấy phần lẻ. Trả về [0, 1).
 */
export function ffmpegDissolveFrand(x: number, y: number): number {
  const arg = f32(f32(x * f32(12.9898)) + f32(y * f32(78.233)));
  const s = f32(Math.sin(arg));
  const r = f32(s * f32(43758.545));
  return r - Math.floor(r);
}

/**
 * Pixel (x, y) đã chuyển sang clip mới B tại tiến độ p hay chưa.
 * p được clamp về [0, 1]; p = 0 → không pixel nào chuyển, p = 1 →
 * mọi pixel đều chuyển (frand < 1 luôn đúng).
 */
export function dissolvePixelIsB(x: number, y: number, pRaw: number): boolean {
  const p = Number.isFinite(pRaw) ? (pRaw < 0 ? 0 : pRaw > 1 ? 1 : pRaw) : 0;
  return ffmpegDissolveFrand(x, y) < p;
}
