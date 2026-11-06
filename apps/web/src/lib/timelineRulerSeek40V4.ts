/**
 * Đợt 40 luồng V4 — phép ánh xạ click ruler → thời gian timeline.
 *
 * Bối cảnh: click-test đợt 39 T4 báo "seekRuler không có tác dụng"
 * (playhead 0 → 0 sau click). Thí nghiệm browser đợt 40 V4 chứng minh
 * handler ruler KHÔNG hỏng: với timeline ngắn (ruler nằm gọn trong
 * viewport) click cho đúng thời gian tính theo công thức này
 * (152 px left, 60 px/s: x=512 → 6,0 s; x=572 → 7,0 s; x=362 → 3,5 s).
 * Lỗi của T4 nằm ở harness: timeline dài ~76 s làm ruler rộng
 * ~4800 px, click ở frac 0,5–0,99 của ruler rơi ngoài viewport
 * (x ≈ 2550–4900 > 1440) nên trình duyệt không giao sự kiện cho ruler
 * — không phải handler bỏ qua click. Script click-test mới của đợt
 * này (clicktest-round40-v4-settle-ruler-pipe.mjs) tái hiện đúng cả
 * hai trường hợp: click ngoài viewport = không đổi (đúng kỳ vọng của
 * trình duyệt), click sau khi cuộn .tl-scroll cho mục tiêu vào
 * viewport = seek đúng.
 *
 * Hàm này CHỈ làm phép chia thuần túy, giữ nguyên hành vi cũ của
 * Ruler.scrubTo / onMove (không thêm clamp, không thêm snap): clamp
 * về [0, duration] và snap về frame nằm ở store.setPlayhead (R1-055).
 * Test khóa đúng phép chia này để lần sau không ai "sửa" ruler bằng
 * cách đổi công thức (ví dụ dùng frac của chiều rộng ruler — sai vì
 * ruler rộng = duration * pxPerSec + 240 px đệm, nên frac chiều rộng
 * không bằng frac thời gian).
 */
export function rulerTimeFromClientX(
  clientX: number,
  rectLeft: number,
  pxPerSec: number,
): number {
  return (clientX - rectLeft) / pxPerSec;
}
