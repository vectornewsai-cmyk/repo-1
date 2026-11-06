/**
 * ttsEstimate48D1.ts — Mẫu đo mới đợt 48 luồng D1 (ROUND48-D1).
 *
 * ĐO XONG 05/11/2026: 12 mẫu chính qua tts.py trực tiếp (WAV ở
 * /tmp/tts48d1/, ngoài repo; độ dài từ header WAV, cross-check bằng
 * ffprobe khớp từng mili-giây; thời gian nạp model KHÔNG tính vào độ
 * dài; driver nạp model MỘT lần rồi gọi infer cho từng mẫu qua đúng
 * đường code của tts.py — xem LIMITS D1 §3.1) + 4 mẫu phụ 2x2/lặp.
 *
 * PHÁT HIỆN 1 — NGƯỠNG 5% SAI, HIỆU ỨNG SỐ-DÀY PHỤ THUỘC GIỌNG:
 * - 5 mẫu thăm dò ngưỡng (cùng giọng Hải Đăng): 2,05% → 16,14;
 *   4,15% → 16,52; 5,08% → 16,27; 8,20% → 14,68; 12,43% → 12,49 ký
 *   tự/giây. Tốc độ giảm DẦN theo tỉ lệ chữ số, không có bước nhảy
 *   ở 5% — text 5,08% đọc bình thường, text 12,43% chỉ chậm vừa.
 * - Thí nghiệm 2x2 (text M3/T13 × giọng Hải Đăng/Minh Đức): cùng
 *   text M3, Minh Đức 8,90 còn Hải Đăng 11,55; cùng text T13, Minh
 *   Đức 8,82 còn Hải Đăng 12,49. Minh Đức đọc text số-dày chậm gần
 *   gấp rưỡi Hải Đăng — hệ số số-dày C4 9,0010 chỉ đúng cho các
 *   giọng C4 đã đo, không phải hằng số chung.
 * - Hệ quả: ngưỡng dời 0,05 → 0,13 trong helper C4 (nằm giữa mẫu
 *   "không chậm" cao nhất 12,43% và mẫu "chậm" thấp nhất 13,48%);
 *   hệ số số-dày gộp thêm X1 thành 9,5388; tầng medium normal gộp
 *   thêm 12 mẫu D1 thành 16,0714 (xem ttsEstimate47C4.ts).
 *
 * PHÁT HIỆN 2 — TỐC ĐỘ CHÊNH NHAU THEO GIỌNG (text thường):
 * - Cùng text M4 (169 ký tự): Thanh Bình 9,04 s; Minh Triết 9,12 s;
 *   Ngọc Linh 9,84 s; Đoan Trang 10,40 s; Thục Đoan 10,80 s; Mỹ
 *   Duyên 12,00 s; Thiền Tâm Đức 13,20 s — chênh 9,04 → 13,20 s
 *   (46%). 4/7 giọng mới nằm ngoài khoảng medium C4 cũ [8,78–10,39]
 *   (Thiền Tâm Đức 13,20 s, Mỹ Duyên 12,00 s, Thục Đoan 10,80 s,
 *   Đoan Trang 10,40 s — V4 chỉ vượt 0,01 s, trong bước lượng tử hóa
 *   0,08 s) nên khoảng medium phải nới rộng (xem trên). Giọng đã đo
 *   sau D1: 21/25 preset (còn 4 chưa đo: Quỳnh Anh, Đức Trí,
 *   Kim Thanh, Adam bựa).
 * - Lặp lại: Thiền Tâm Đức 13,20 → 13,52 s (spread 2,4%); Mỹ Duyên
 *   12,00 → 13,44 s (spread 11,3% — phương sai theo giọng lớn hơn
 *   hẳn câu dài Hải Đăng 1,6% ở C4; xem TTS_VARIANCE_48D1).
 *
 * PHẢN VÍ DỤ X2 (KHÔNG thuộc pool hiệu chuẩn nào): text T13 × giọng
 * Minh Đức đọc 19,17 s (8,82 ký tự/giây) — chậm như số-dày dù tỉ lệ
 * chữ số chỉ 12,43% (< ngưỡng 13%). Bộ phát hiện cho "thường" nhưng
 * thực tế chậm; khoảng medium mới [8,78–13,53] s cho text 169 ký tự
 * KHÔNG chứa 19,17 s. Đây là bằng chứng mô hình nhị phân theo tỉ lệ
 * chữ số không đủ — cần hiệu chuẩn theo giọng (nợ mở, LIMITS D1 §7).
 * X2 được ghi riêng (không trong TTS_SAMPLES_NEW_48D1) để không đầu
 * độc pool: đưa nó vào pool normal sẽ nới khoảng medium tới 1,82×
 * (vô dụng), đưa vào pool số-dày sẽ phá test phân loại của bộ phát
 * hiện (tỉ lệ < ngưỡng nhưng chế độ số-dày).
 *
 * Quy ước giữ từ C4: "mẫu" = một lần đo thật ĐỘC LẬP qua tts.py
 * trực tiếp; các lần chạy LẶP (X3/X4) KHÔNG tính vào n hiệu chuẩn.
 */

import type { TtsTier45A3 } from "./ttsEstimate45A3";
import type { TtsRegime47C4 } from "./ttsEstimate47C4";

/** Một lần đo thật ĐỘC LẬP của luồng D1. */
export interface TtsSample48D1 {
  id: string;
  tier: TtsTier45A3;
  regime: TtsRegime47C4;
  /** Text đã đọc (để test đếm lại ký tự + tỉ lệ chữ số, không tin mù). */
  text: string;
  voice: string;
  /** Độ dài thật (giây, từ header WAV, khớp ffprobe). */
  durationSec: number;
  /** Tỉ lệ ký tự chữ số (0–9) trên tổng ký tự (theo ttsTextLength). */
  digitRatio: number;
  source: "D1";
}

/** Text chuẩn cho mẫu giọng mới (text C4-M4, 169 ký tự, thường). */
export const TTS_STANDARD_TEXT_48D1 =
  "Nguyễn Văn An mở VCut Studio ở Hà Nội, kéo video quay tại Đà Lạt, Sa Pa và Phú Quốc vào timeline, rồi gửi bản dựng cho chị Trần Thu Hà ở Thành phố Hồ Chí Minh xem trước.";

/**
 * Mẫu thăm dò ngưỡng (5 mẫu, giọng Hải Đăng). Tốc độ giảm dần theo
 * tỉ lệ chữ số: 16,14 / 16,52 / 16,27 / 14,68 / 12,49 — không có bước
 * nhảy ở 5%; T13 (12,43%) vẫn chưa chạm chế độ chậm ~9 của C4.
 */
export const TTS_THRESHOLD_PROBES_48D1: readonly TtsSample48D1[] = [
  {
    id: "D1-T2", tier: "medium", regime: "normal",
    text: "Năm 2026, VCut Studio ra mắt bản cập nhật mới với giao diện timeline cải tiến, cho phép kéo thả clip mượt mà hơn, cắt ghép chính xác từng khung hình và xuất video nhanh hơn trên máy tính của bạn.",
    voice: "Hải Đăng", durationSec: 12.08, digitRatio: 0.0205, source: "D1",
  },
  {
    id: "D1-T4", tier: "medium", regime: "normal",
    text: "Ngày 15 tháng 11 năm 2026, VCut Studio phát hành bản cập nhật mới với giao diện timeline cải tiến, cho phép kéo thả clip mượt mà hơn và xuất video nhanh hơn ngay trên máy tính của bạn mỗi ngày.",
    voice: "Hải Đăng", durationSec: 11.68, digitRatio: 0.0415, source: "D1",
  },
  {
    id: "D1-T5", tier: "medium", regime: "normal",
    text: "Ngày 15 tháng 11 năm 2026, VCut Studio phát hành bản cập nhật mới, chỉ với 1 cú nhấp chuột bạn có thể kéo thả clip, cắt ghép chuẩn và xuất video nhanh hơn trên máy tính của bạn.",
    voice: "Hải Đăng", durationSec: 10.88, digitRatio: 0.0508, source: "D1",
  },
  {
    id: "D1-T8", tier: "medium", regime: "normal",
    text: "Ngày 15 tháng 11 năm 2026, bản 2.4.1 ra mắt với 37 tính năng mới, giao diện timeline cải tiến cho phép kéo thả clip mượt mà hơn và xuất video nhanh hơn 45% ngay trên máy tính của bạn.",
    voice: "Hải Đăng", durationSec: 12.47, digitRatio: 0.082, source: "D1",
  },
  {
    id: "D1-T13", tier: "medium", regime: "normal",
    text: "Ngày 15 tháng 11 năm 2026, bản 2.4.1 sửa 128 lỗi, thêm 37 tính năng mới và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó, giúp bạn dựng video nhanh hơn mỗi ngày.",
    voice: "Hải Đăng", durationSec: 13.53, digitRatio: 0.1243, source: "D1",
  },
];

/**
 * Mẫu giọng mới (7 giọng, cùng text chuẩn M4 169 ký tự). Tốc độ
 * 12,80–18,69 ký tự/giây — Thiền Tâm Đức (12,80) và Mỹ Duyên
 * (14,08) chậm hẳn so với nhóm còn lại (15,65–18,69).
 */
export const TTS_NEW_VOICES_48D1: readonly TtsSample48D1[] = [
  { id: "D1-V1", tier: "medium", regime: "normal", text: TTS_STANDARD_TEXT_48D1, voice: "Thiền Tâm Đức", durationSec: 13.2, digitRatio: 0, source: "D1" },
  { id: "D1-V2", tier: "medium", regime: "normal", text: TTS_STANDARD_TEXT_48D1, voice: "Thanh Bình", durationSec: 9.04, digitRatio: 0, source: "D1" },
  { id: "D1-V3", tier: "medium", regime: "normal", text: TTS_STANDARD_TEXT_48D1, voice: "Ngọc Linh", durationSec: 9.84, digitRatio: 0, source: "D1" },
  { id: "D1-V4", tier: "medium", regime: "normal", text: TTS_STANDARD_TEXT_48D1, voice: "Đoan Trang", durationSec: 10.4, digitRatio: 0, source: "D1" },
  { id: "D1-V5", tier: "medium", regime: "normal", text: TTS_STANDARD_TEXT_48D1, voice: "Thục Đoan", durationSec: 10.8, digitRatio: 0, source: "D1" },
  { id: "D1-V6", tier: "medium", regime: "normal", text: TTS_STANDARD_TEXT_48D1, voice: "Minh Triết", durationSec: 9.12, digitRatio: 0, source: "D1" },
  { id: "D1-V7", tier: "medium", regime: "normal", text: TTS_STANDARD_TEXT_48D1, voice: "Mỹ Duyên", durationSec: 12.0, digitRatio: 0, source: "D1" },
];

/**
 * Thí nghiệm 2x2, nửa Hải Đăng: text M3 (số-dày 13,48%) × giọng Hải
 * Đăng đọc 15,41 s (11,55 ký tự/giây) — nhanh hơn hẳn cùng text ×
 * Minh Đức (19,99 s, 8,90). Mẫu số-dày thứ 4, gộp vào hệ số C4.
 */
export const TTS_DENSE_CROSS_HAIDANG_48D1: TtsSample48D1 = {
  id: "D1-X1", tier: "medium", regime: "numberDense",
  text: "Ngày 15 tháng 11 năm 2026, lúc 9 giờ 30 phút, VCut Studio phát hành bản cập nhật 2.4.1 với 37 tính năng mới, sửa 128 lỗi và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó.",
  voice: "Hải Đăng", durationSec: 15.41, digitRatio: 0.1348, source: "D1",
};

/**
 * Thí nghiệm 2x2, nửa Minh Đức — PHẢN VÍ DỤ, KHÔNG thuộc pool hiệu
 * chuẩn: text T13 (12,43%) × giọng Minh Đức đọc 19,17 s (8,82 ký
 * tự/giây) — chậm như số-dày dù dưới ngưỡng 13%. Xem header.
 */
export const TTS_VOICE_DEPENDENCE_COUNTEREXAMPLE_48D1: TtsSample48D1 = {
  id: "D1-X2", tier: "medium", regime: "normal",
  text: "Ngày 15 tháng 11 năm 2026, bản 2.4.1 sửa 128 lỗi, thêm 37 tính năng mới và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó, giúp bạn dựng video nhanh hơn mỗi ngày.",
  voice: "Minh Đức", durationSec: 19.17, digitRatio: 0.1243, source: "D1",
};

/** Toàn bộ mẫu mới D1 trong pool hiệu chuẩn (5 thăm dò + 7 giọng + X1). */
export const TTS_SAMPLES_NEW_48D1: readonly TtsSample48D1[] = [
  ...TTS_THRESHOLD_PROBES_48D1,
  ...TTS_NEW_VOICES_48D1,
  TTS_DENSE_CROSS_HAIDANG_48D1,
];

/** Một lần chạy LẶP (không tính vào n hiệu chuẩn — xem header). */
export interface TtsVarianceRun48D1 {
  id: string;
  /** Mẫu gốc mà lần lặp này chạy lại. */
  repeatOf: string;
  text: string;
  voice: string;
  durationSec: number;
  originalDurationSec: number;
}

/**
 * Lặp lại giọng chậm (KHÔNG tính vào n): Thiền Tâm Đức 13,20 →
 * 13,52 s (spread 2,4%); Mỹ Duyên 12,00 → 13,44 s (spread 11,3% —
 * phương sai theo giọng lớn hơn hẳn câu dài Hải Đăng 1,6% ở C4).
 */
export const TTS_VARIANCE_48D1: readonly TtsVarianceRun48D1[] = [
  { id: "D1-X3", repeatOf: "D1-V1", text: TTS_STANDARD_TEXT_48D1, voice: "Thiền Tâm Đức", durationSec: 13.52, originalDurationSec: 13.2 },
  { id: "D1-X4", repeatOf: "D1-V7", text: TTS_STANDARD_TEXT_48D1, voice: "Mỹ Duyên", durationSec: 13.44, originalDurationSec: 12.0 },
];
