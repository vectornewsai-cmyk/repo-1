/**
 * ttsEstimate47C4.ts — Ước lượng độ dài giọng đọc TTS đã hiệu chuẩn
 * theo tầng + theo chế độ text (Phase 9 đợt 47, luồng C4).
 *
 * Đóng nợ đợt 46 B3 §6.1–6.3: (1) medium/long hiệu chuẩn YẾU (mẫu mới
 * chỉ n = 2 mỗi tầng); (2) text nhiều số/tên riêng/dấu câu dày chưa đo;
 * (3) phương sai giữa các lần chạy mới quan sát 1 cặp (~14% câu ngắn).
 * Luồng này đo thêm 8 mẫu thật mới qua tts.py trực tiếp (WAV ở
 * /tmp/tts47c4/, ngoài repo) + 6 lần chạy lặp để đo phương sai, và
 * xác minh bridge expose X-TTS-* bằng TRÌNH DUYỆT thật ở origin :5173
 * (xem LIMITS C4 — nợ B3 §6.4 đã đóng).
 *
 * QUY TẮC HIỆU CHUẨN (giữ từ A3/B3, áp dụng nghiêm):
 * - Một tầng chỉ được gắn `calibrated: true` khi có ≥3 mẫu đo thật
 *   RIÊNG của tầng đó. "Mẫu" = một lần đo thật ĐỘC LẬP rơi vào tầng
 *   (Z3 + A3 + B3 + C4 cộng dồn); hằng gộp Z3 18,4 KHÔNG được tính là
 *   mẫu. Các lần chạy LẶP phương sai (cùng text/giọng chạy lại) KHÔNG
 *   tính vào n — chúng nằm trong VARIANCE_RUNS_47C4, không nằm trong
 *   bảng hiệu chuẩn (xem ghi chú ở cuối file).
 * - Hệ số trung tâm = tốc độ gộp (tổng ký tự / tổng giây). Khoảng =
 *   biên quan sát, làm tròn RA NGOÀI tới 4 chữ số thập phân. Đây
 *   KHÔNG phải khoảng tin cậy thống kê.
 *
 * PHÁT HIỆN QUAN TRỌNG — TEXT NHIỀU SỐ LÀ MỘT CHẾ ĐỘ RIÊNG:
 * - 3 mẫu C4 nhiều số (M3 13,5% ký tự là chữ số, L3 14,5%, S4 21,6%)
 *   đọc ở 8,11–9,18 ký tự/giây — chậm GẤP ĐÔI so với text thường
 *   (~17–19 ký tự/giây) ở cùng tầng. Gộp chung vào một hệ số sẽ vừa
 *   làm lệch tâm text thường, vừa nới khoảng tới mức vô dụng (thử gộp:
 *   medium [0,77×, 1,68×], long [0,79×, 1,73×]).
 * - Vì vậy C4 tách hai chế độ: `normal` (text thường — hệ số theo
 *   tầng, tính từ các mẫu không-nhiều-số) và `numberDense` (text
 *   nhiều số — MỘT hệ số chung cho mọi tầng; C4: 9,0010 ký tự/giây,
 *   n = 3; D1 SỬA thành 9,5388, n = 4 sau khi gộp mẫu X1 — xem khối
 *   "ĐỢT 48 D1" ở đầu header). Bộ phát hiện: tỉ lệ ký tự chữ số (0–9)
 *   trên tổng ký tự ≥ 0,13 (D1 sửa từ 0,05 — xem khối đầu header).
 *   Ngưỡng là tạm thời, n mẫu dương ít nên chưa khóa chặt; test chỉ
 *   khóa hành vi trên các mẫu đã đo, không khóa ngưỡng như chân lý.
 * - Tên riêng (M4, L4) và dấu câu dày (M5, L5: nhiều "?", "!", "…",
 *   "—") đọc ở tốc độ BÌNH THƯỜNG (16,27–18,45 ký tự/giây) — chỉ có
 *   SỐ mới làm chậm. Đây là kết quả đo, không phải suy đoán.
 *
 * Mẫu đo MỚI trong luồng này (05/11/2026, tts.py trực tiếp qua
 * server/tts/.venv2, model VieNeu-TTS v3 Turbo đã cache; độ dài lấy
 * từ header WAV và cross-check bằng module wave — khớp từng mili-giây;
 * thời gian nạp model KHÔNG tính vào độ dài):
 * - C4-M3 178 ký tự, Minh Đức → 19,99 s (8,90) — số dày
 * - C4-M4 169 ký tự, Thùy Dung → 9,36 s (18,06) — tên riêng
 * - C4-M5 190 ký tự, Thái Sơn → 11,68 s (16,27) — dấu câu dày
 * - C4-L3 304 ký tự, Ngọc Trân → 33,11 s (9,18) — số dày
 * - C4-L4 328 ký tự, Phạm Tuyên → 19,08 s (17,19) — tên riêng
 * - C4-L5 296 ký tự, Xuân Vĩnh → 16,04 s (18,45) — dấu câu dày
 * - C4-S4 37 ký tự, Quốc Tuấn → 4,56 s (8,11) — số dày
 * - C4-VS5 13 ký tự, Adam → 0,96 s (13,54) — thường
 * Toàn bộ text mẫu xem TTS_SAMPLES_47C4 (test đếm lại ký tự từ text).
 *
 * TRUNG THỰC VỀ SỐ (đọc trước khi dùng):
 * - numberDense chỉ n = 4, gộp xuyên tầng VÀ xuyên giọng — khoảng
 *   [0,8258×, 1,1756×] chỉ là biên quan sát của đúng 4 điểm; text
 *   số-dày mới có thể rơi ngoài, và ngưỡng phát hiện 13% là tạm thời
 *   (xem khối "ĐỢT 48 D1" ở đầu header; phản ví dụ X2: Minh Đức đọc
 *   text 12,43% ở 8,82 ký tự/giây — chậm dù dưới ngưỡng).
 * - medium normal nay n = 17 (5 C4 + 12 D1) nhưng khoảng RỘNG
 *   [0,8345×, 1,2867×] vì tốc độ chênh nhau theo giọng (cùng text
 *   169 ký tự: 9,04–13,20 s) — vẫn chỉ là biên quan sát, không phải
 *   khoảng tin cậy; hiệu chuẩn theo giọng là nợ mở (xem LIMITS D1 §7).
 * - Giọng đo tới nay: 14/25 preset (B3: 6 + C4: Minh Đức, Thùy Dung,
 *   Thái Sơn, Ngọc Trân, Phạm Tuyên, Xuân Vĩnh, Quốc Tuấn, Adam) —
 *   11 giọng còn lại chưa đo (xem LIMITS C4).
 * - Độ dài WAV bị lượng tử hóa theo bước 0,08 s (mọi mẫu đo đều là
 *   bội số của 0,08 s) — xem LIMITS C4 §3 về phương sai.
 * - Ước lượng này chỉ dùng cho hiển thị (hậu tố toast), KHÔNG dùng
 *   để cắt/ghép audio hay tính timeline — như Z3/A3/B3.
 * ĐỢT 48 D1 — SỬA NGƯỠNG + BẢNG (05/11/2026, xem
 * docs/PHASE9_ROUND48_D1_TTS_LIMITS.md): ngưỡng 5% SAI — mẫu thăm dò
 * D1-T5 (5,08% chữ số, Hải Đăng) đọc ở 16,27 ký tự/giây (bình
 * thường), không chậm. Thí nghiệm 2x2 (text M3/T13 × giọng Hải Đăng/
 * Minh Đức) chứng minh hiệu ứng số-dày PHỤ THUỘC GIỌNG: cùng text M3,
 * Minh Đức 8,90 còn Hải Đăng 11,55 ký tự/giây; cùng text T13, Minh
 * Đức 8,82 còn Hải Đăng 12,49. Vì vậy: ngưỡng dời lên 0,13 (nằm giữa
 * mẫu "không chậm" cao nhất 12,43% và mẫu "chậm" thấp nhất 13,48% —
 * vẫn là ngưỡng tạm thời, xem LIMITS D1 §4); hệ số số-dày gộp thêm
 * mẫu X1 (M3 × Hải Đăng, 11,55) thành 9,5388 [0,8258×, 1,1756×],
 * n = 4; tầng medium normal gộp thêm 12 mẫu D1 (thăm dò T2/T4/T5/T8/
 * T13 + 7 giọng mới) thành 16,0714 [0,8345×, 1,2867×], n = 17 — khoảng
 * rộng ra vì tốc độ giữa các giọng chênh nhau lớn (cùng text M4:
 * 9,04 s Thanh Bình → 13,20 s Thiền Tâm Đức). Mẫu X2 (T13 × Minh
 * Đức, 19,17 s) là PHẢN VÍ DỤ: bộ phát hiện cho "thường" (12,43% <
 * 13%) nhưng đọc chậm như số-dày — KHÔNG đưa vào pool hiệu chuẩn
 * nào, ghi riêng ở ttsEstimate48D1.ts. Các tầng veryShort/short/long
 * giữ nguyên số C4 (không có mẫu D1 mới ở 3 tầng đó).
 * TtsButton ĐÃ chuyển sang helper C4 ở đợt 48 D1 (1 import + 1 lời
 * gọi; xem TtsButton.tsx + test B3 §4 đã cập nhật).
 */

import { TTS_TIERS_45A3, ttsTierForLength45A3, type TtsTier45A3, type TtsTierSpec45A3 } from "./ttsEstimate45A3";
import { TTS_SAMPLES_46B3 } from "./ttsEstimate46B3";
import { parseTtsDurationHeader, ttsTextLength } from "./ttsDuration44Z3";

/** Chế độ text: thường, hoặc nhiều số (đọc chậm gấp đôi — xem header). */
export type TtsRegime47C4 = "normal" | "numberDense";

/** Một lần đo thật ĐỘC LẬP (Z3/A3/B3/C4) rơi vào một tầng. */
export interface TtsSample47C4 {
  id: string;
  tier: TtsTier45A3;
  regime: TtsRegime47C4;
  /** Text đã đọc (để test đếm lại ký tự, không tin mù số chars). */
  text: string;
  voice: string;
  /** Độ dài thật (giây, từ header WAV, khớp ffprobe/wave). */
  durationSec: number;
  /** Nguồn đo: Z3 (đợt 44), A3 (đợt 45), B3 (đợt 46), C4 (luồng này). */
  source: "Z3" | "A3" | "B3" | "C4";
}

/** Mẫu mới C4 (8 mẫu — xem header file để biết ngữ cảnh từng mẫu). */
export const TTS_SAMPLES_NEW_47C4: readonly TtsSample47C4[] = [
  {
    id: "C4-M3", tier: "medium", regime: "numberDense",
    text: "Ngày 15 tháng 11 năm 2026, lúc 9 giờ 30 phút, VCut Studio phát hành bản cập nhật 2.4.1 với 37 tính năng mới, sửa 128 lỗi và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó.",
    voice: "Minh Đức", durationSec: 19.99, source: "C4",
  },
  {
    id: "C4-M4", tier: "medium", regime: "normal",
    text: "Nguyễn Văn An mở VCut Studio ở Hà Nội, kéo video quay tại Đà Lạt, Sa Pa và Phú Quốc vào timeline, rồi gửi bản dựng cho chị Trần Thu Hà ở Thành phố Hồ Chí Minh xem trước.",
    voice: "Thùy Dung", durationSec: 9.36, source: "C4",
  },
  {
    id: "C4-M5", tier: "medium", regime: "normal",
    text: "Bạn có nghe không? Video này — đúng rồi, chính video bạn đang xem — được dựng hoàn toàn trên máy của bạn! Không cần mạng, không cần tài khoản, không cần chờ đợi... Chỉ cần nhấn nút, và xong!",
    voice: "Thái Sơn", durationSec: 11.68, source: "C4",
  },
  {
    id: "C4-L3", tier: "long", regime: "numberDense",
    text: "Năm 2026, VCut Studio đã có 25 giọng đọc, 1043 file âm thanh và 174 bảng màu LUT. Bản 2.4.1 ra mắt ngày 15 tháng 11, sửa 128 lỗi, thêm 37 tính năng mới và tăng tốc xuất video 1080p lên 45%. Người dùng đã dựng hơn 12000 video, tổng cộng 480 giờ footage, trong đó 65% là video dọc 9:16 cho TikTok và Reels.",
    voice: "Ngọc Trân", durationSec: 33.11, source: "C4",
  },
  {
    id: "C4-L4", tier: "long", regime: "normal",
    text: "Trần Hải mở VCut Studio trên máy tính ở Hà Nội, kéo đoạn video quay tại Đà Lạt của anh Nguyễn Văn An và chị Trần Thu Hà vào timeline. Sau đó anh thêm nhạc nền của nhạc sĩ Phạm Tuyên, chèn chữ chạy giới thiệu Sa Pa, Phú Quốc và Thành phố Hồ Chí Minh, rồi xuất bản dựng gửi cho nhóm làm phim ở Đà Nẵng xem trước khi đăng lên kênh.",
    voice: "Phạm Tuyên", durationSec: 19.08, source: "C4",
  },
  {
    id: "C4-L5", tier: "long", regime: "normal",
    text: "Bạn đã sẵn sàng chưa? Đây là video... đúng vậy, video bạn đang xem ngay lúc này — được dựng 100% trên máy của bạn! Không cần mạng? Không cần! Không cần tài khoản? Cũng không! Chỉ cần: mở VCut Studio, kéo video vào, cắt, ghép, thêm chữ... và nhấn xuất. Xong! Nhanh, gọn, riêng tư — còn chờ gì nữa?",
    voice: "Xuân Vĩnh", durationSec: 16.04, source: "C4",
  },
  {
    id: "C4-S4", tier: "short", regime: "numberDense",
    text: "Bản 2.4.1 sửa 128 lỗi, nhanh hơn 45%!",
    voice: "Quốc Tuấn", durationSec: 4.56, source: "C4",
  },
  {
    id: "C4-VS5", tier: "veryShort", regime: "normal",
    text: "Bắt đầu thôi!",
    voice: "Adam", durationSec: 0.96, source: "C4",
  },
];

/**
 * Toàn bộ 24 mẫu đo thật độc lập theo tầng (3 Z3 + 2 A3 + 11 B3 + 8 C4).
 * Các mẫu Z3/A3/B3 lấy lại từ TTS_SAMPLES_46B3; regime của chúng được
 * suy từ text: toàn bộ mẫu Z3/A3/B3 đều là text thường (tỉ lệ chữ số
 * 0% — text Z3 là placeholder "x" lặp, xem ghi chú B3), nên gán
 * "normal". Riêng mẫu A3-S có chứa "VCut" nhưng 0 chữ số.
 */
export const TTS_SAMPLES_47C4: readonly TtsSample47C4[] = [
  ...TTS_SAMPLES_46B3.map((s) => ({ ...s, regime: "normal" as TtsRegime47C4, source: s.source as TtsSample47C4["source"] })),
  ...TTS_SAMPLES_NEW_47C4,
];

/**
 * Ngưỡng phát hiện text nhiều số: tỉ lệ ký tự chữ số (0–9) trên tổng
 * ký tự ≥ 0,13. SỬA Ở ĐỢT 48 D1 (từ 0,05): ngưỡng 5% SAI — mẫu D1-T5
 * (5,08%, Hải Đăng) đọc bình thường 16,27 ký tự/giây; các mẫu thăm dò
 * 2,05–12,43% đều không rơi vào chế độ chậm ~9 (thấp nhất 12,49 ở
 * 12,43%). Ngưỡng mới 13% nằm giữa mẫu "không chậm" cao nhất quan sát
 * được (D1-T13: 12,43%, Hải Đăng 12,49) và mẫu "chậm" thấp nhất
 * (C4-M3: 13,48%, Minh Đức 8,90) — VẪN TẠM THỜI vì hiệu ứng phụ thuộc
 * giọng (X2: Minh Đức đọc text 12,43% ở 8,82 — chậm dù dưới ngưỡng;
 * xem LIMITS D1 §4). Ngưỡng này tối ưu cho giọng mặc định Hải Đăng
 * (4/4 mẫu thăm dò của Hải Đăng được phân loại đúng hướng), không
 * phải chân lý cho mọi giọng.
 */
export const TTS_NUMBER_DENSE_DIGIT_RATIO_47C4 = 0.13;

/** Text có phải nhiều số không (tỉ lệ chữ số ≥ ngưỡng)? */
export function isNumberDenseText47C4(text: string): boolean {
  const chars = ttsTextLength(text ?? "");
  if (chars === 0) return false;
  const digits = (text.match(/[0-9]/g) ?? []).length;
  return digits / chars >= TTS_NUMBER_DENSE_DIGIT_RATIO_47C4;
}

/**
 * Bảng tầng C4 cho chế độ normal: lấy ranh giới A3 làm nền, ghi đè
 * bằng hệ số gộp + biên quan sát của các mẫu NORMAL trong tầng đó
 * (mẫu số-dày loại ra — xem header).
 *
 * Hệ số gộp (tổng ký tự / tổng giây, 4 chữ số thập phân) — SỬA Ở ĐỢT
 * 48 D1 cho tầng medium (gộp thêm 12 mẫu D1, xem LIMITS D1 §3):
 * - veryShort: 70 / 5,12 = 13,6719 (khoảng [0,8203×, 1,1932×], n = 6)
 * - short: 244 / 13,76 = 17,7326 (khoảng [0,8395×, 1,2719×], n = 5)
 * - medium: 2871 / 178,64 = 16,0714 (khoảng [0,8345×, 1,2867×], n = 17)
 * - long: 1547 / 83,12 = 18,6116 (khoảng [0,9271×, 1,0827×], n = 5)
 * Test khóa lại toàn bộ phép tính này từ TTS_SAMPLES_47C4 + mẫu D1
 * (medium gộp cả hai nguồn; các tầng khác chỉ mẫu C4).
 */
export const TTS_TIERS_47C4: readonly TtsTierSpec45A3[] = TTS_TIERS_45A3.map((spec) => {
  switch (spec.tier) {
    case "veryShort":
      return {
        ...spec,
        charsPerSec: 13.6719,
        calibrated: true,
        minFactor: 0.8203,
        maxFactor: 1.1932,
        note: "ĐÃ HIỆU CHUẨN (C4) — n = 6 mẫu thật normal (1 A3 + 4 B3 + 1 C4: Hải Đăng, Trúc Ly, Thiện Minh, Mai Anh, Adam); hệ số gộp 70/5,12 = 13,6719 ký tự/giây; khoảng = biên quan sát [0,8203×, 1,1932×], KHÔNG phải khoảng tin cậy.",
      };
    case "short":
      return {
        ...spec,
        charsPerSec: 17.7326,
        calibrated: true,
        minFactor: 0.8395,
        maxFactor: 1.2719,
        note: "ĐÃ HIỆU CHUẨN (C4) — n = 5 mẫu thật normal (1 Z3 + 1 A3 + 3 B3: Hải Đăng, Trúc Ly, Quang Sơn); hệ số gộp 244/13,76 = 17,7326 ký tự/giây; khoảng = biên quan sát [0,8395×, 1,2719×]. Mẫu số-dày C4-S4 (37 ký tự, 4,56 s) LOẠI KHỎI bảng này — xem chế độ numberDense.",
      };
    case "medium":
      return {
        ...spec,
        charsPerSec: 16.0714,
        calibrated: true,
        minFactor: 0.8345,
        maxFactor: 1.2867,
        note: "ĐÃ HIỆU CHUẨN (C4, SỬA D1) — n = 17 mẫu thật normal (5 C4: Hải Đăng, Thiện Minh, Ngọc Huyền, Thùy Dung, Thái Sơn + 12 D1: thăm dò T2/T4/T5/T8/T13 giọng Hải Đăng và 7 giọng mới Thiền Tâm Đức, Thanh Bình, Ngọc Linh, Đoan Trang, Thục Đoan, Minh Triết, Mỹ Duyên); hệ số gộp 2871/178,64 = 16,0714 ký tự/giây; khoảng = biên quan sát [0,8345×, 1,2867×]. Khoảng RỘNG RA so với C4 ([0,92×, 1,09×]) vì 4/7 giọng mới nằm ngoài khoảng cũ (Thiền Tâm Đức 13,20 s, Mỹ Duyên 12,00 s, Thục Đoan 10,80 s, Đoan Trang 10,40 s — V4 chỉ vượt 0,01 s, trong bước lượng tử hóa 0,08 s) — tốc độ chênh nhau theo giọng, xem LIMITS D1 §4. Mẫu D1 sống ở ttsEstimate48D1.ts; test C4 tính lại từ cả hai nguồn.",
      };
    case "long":
      return {
        ...spec,
        charsPerSec: 18.6116,
        calibrated: true,
        minFactor: 0.9271,
        maxFactor: 1.0827,
        note: "ĐÃ HIỆU CHUẨN (C4) — n = 5 mẫu thật normal (1 Z3 + 2 B3 + 2 C4: Hải Đăng, Trúc Ly, Phạm Tuyên, Xuân Vĩnh); hệ số gộp 1547/83,12 = 18,6116 ký tự/giây; khoảng = biên quan sát [0,9271×, 1,0827×]. Mẫu số-dày C4-L3 LOẠI KHỎI bảng này — xem chế độ numberDense. Hết hiệu chuẩn yếu (mẫu mới C4 n = 3, tổng n = 5).",
      };
    default:
      return spec;
  }
});

/**
 * Chế độ numberDense: MỘT hệ số chung cho mọi tầng (697 ký tự /
 * 73,07 s = 9,5388 ký tự/giây; khoảng [0,8258×, 1,1756×] là biên quan
 * sát của 4 mẫu M3/L3/S4/X1). SỬA Ở ĐỢT 48 D1 (từ 9,0010 [0,9803×,
 * 1,1094×], n = 3): gộp thêm mẫu X1 (text M3 × giọng Hải Đăng, 15,41 s
 * — Hải Đăng đọc text số-dày NHANH HƠN hẳn Minh Đức 19,99 s) nên hệ số
 * tăng +6,0% và khoảng nới rộng cả hai phía. HIỆU CHUẨN YẾU — n = 4,
 * gộp xuyên tầng VÀ xuyên giọng; ngưỡng phát hiện 13% tạm thời, hiệu
 * ứng phụ thuộc giọng (xem header đợt 48 D1 + LIMITS D1 §4).
 */
export const TTS_NUMBER_DENSE_47C4 = {
  charsPerSec: 9.5388,
  calibrated: true,
  minFactor: 0.8258,
  maxFactor: 1.1756,
  note: "ĐÃ HIỆU CHUẨN YẾU (C4, SỬA D1) — n = 4 mẫu thật số-dày xuyên tầng (C4-M3/L3/S4 + D1-X1: Minh Đức, Ngọc Trân, Quốc Tuấn, Hải Đăng); hệ số gộp 697/73,07 = 9,5388 ký tự/giây; khoảng [0,8258×, 1,1756×] chỉ là biên quan sát của 4 điểm — text số-dày mới (nhất là giọng chưa đo) có thể rơi ngoài, và ngưỡng 13% không phân biệt được Minh Đức ở 12,43% (mẫu X2, xem ttsEstimate48D1.ts).",
} as const;

/** Tầng C4 (normal) của một độ dài (ký tự); null khi độ dài ≤ 0 (như A3/B3). */
export function ttsTierForLength47C4(charCount: number): TtsTierSpec45A3 | null {
  const a3 = ttsTierForLength45A3(charCount);
  if (a3 === null) return null;
  return TTS_TIERS_47C4.find((t) => t.tier === a3.tier) ?? null;
}

/** Kết quả ước lượng theo tầng + chế độ C4 (mở rộng hình dạng B3). */
export interface TtsEstimateRange47C4 {
  tier: TtsTier45A3;
  regime: TtsRegime47C4;
  chars: number;
  charsPerSec: number;
  calibrated: boolean;
  seconds: number;
  minSec: number;
  maxSec: number;
}

/**
 * Ước lượng khoảng độ dài giọng đọc từ text theo bảng C4. Text nhiều
 * số → dùng hệ số numberDense chung (không theo tầng). Trả null khi
 * text rỗng (không bịa số) — cùng quy ước với A3/B3.
 */
export function estimateTtsDurationRange47C4(text: string): TtsEstimateRange47C4 | null {
  const chars = ttsTextLength(text ?? "");
  const spec = ttsTierForLength47C4(chars);
  if (spec === null) return null;
  if (isNumberDenseText47C4(text)) {
    const seconds = chars / TTS_NUMBER_DENSE_47C4.charsPerSec;
    return {
      tier: spec.tier,
      regime: "numberDense",
      chars,
      charsPerSec: TTS_NUMBER_DENSE_47C4.charsPerSec,
      calibrated: TTS_NUMBER_DENSE_47C4.calibrated,
      seconds,
      minSec: seconds * TTS_NUMBER_DENSE_47C4.minFactor,
      maxSec: seconds * TTS_NUMBER_DENSE_47C4.maxFactor,
    };
  }
  const seconds = chars / spec.charsPerSec;
  return {
    tier: spec.tier,
    regime: "normal",
    chars,
    charsPerSec: spec.charsPerSec,
    calibrated: spec.calibrated,
    seconds,
    minSec: seconds * spec.minFactor,
    maxSec: seconds * spec.maxFactor,
  };
}

/** Ước lượng điểm trung tâm (giây) theo bảng C4; null khi text rỗng. */
export function estimateTtsDurationSec47C4(text: string): number | null {
  const r = estimateTtsDurationRange47C4(text);
  return r === null ? null : r.seconds;
}

/** Hậu tố khoảng cho toast: ` (≈9.0–12.0s)`; text rỗng → "". */
export function ttsEstimateRangeSuffix47C4(text: string): string {
  const r = estimateTtsDurationRange47C4(text);
  if (r === null) return "";
  return ` (≈${r.minSec.toFixed(1)}–${r.maxSec.toFixed(1)}s)`;
}

/**
 * Hậu tố cho toast done của TtsButton (cùng hình dạng với B3, dùng
 * khi parent chuyển TtsButton sang C4):
 * - header X-TTS-Duration hợp lệ → ` (12.3s)` (số đo thật);
 * - header thiếu/không hợp lệ, text có nội dung → khoảng C4
 *   ` (≈a–bs)` (theo tầng + chế độ text);
 * - không ước lượng được (text rỗng) → "" (bỏ hậu tố, không bịa số).
 */
export function ttsDoneSuffixRange47C4(opts: {
  headerValue: string | null | undefined;
  text: string;
}): string {
  const measured = parseTtsDurationHeader(opts.headerValue);
  if (measured !== null) return ` (${measured.toFixed(1)}s)`;
  return ttsEstimateRangeSuffix47C4(opts.text);
}

/**
 * Phương sai giữa các lần chạy (KHÔNG tính vào n hiệu chuẩn — đây là
 * các lần chạy LẶP của cùng text/giọng đã có trong bảng, xem header).
 * Câu ngắn "Chào bạn!" (Trúc Ly): 3 lần chạy trong luồng này (0,56 /
 * 0,64 / 0,56 s) + 2 lần đo B3 trước đó (trực tiếp 0,56 s, qua bridge
 * 0,64 s) + 1 lần qua bridge trong xác minh trình duyệt C4 (0,56 s)
 * → 6 lần đo: 0,56 s ×4, 0,64 s ×2; lệch cực đại so với trung bình
 * 0,5867 s là +9,1% / −4,6%; (max−min)/mean = 13,6%.
 * Câu dài (text B3-L1, 317 ký tự, Hải Đăng): 3 lần chạy VL-a/b/c —
 * 16,79 / 16,52 / 16,74 s (trung bình 16,68 s, (max−min)/mean = 1,6%);
 * cộng lần đo gốc B3-L1 17,04 s thì 4 lần đo chụm trong 16,52–17,04 s
 * (spread 3,1%, lệch cực đại 1,6% so với trung bình) — xem LIMITS C4 §3.
 */
export interface TtsVarianceRun47C4 {
  id: string;
  text: string;
  voice: string;
  durationSec: number;
  /** Cách đo: tts.py trực tiếp, hay qua bridge (curl / trình duyệt). */
  via: "tts.py" | "bridge-curl" | "bridge-browser";
}

export const TTS_VARIANCE_SHORT_47C4: readonly TtsVarianceRun47C4[] = [
  { id: "B3-direct", text: "Chào bạn!", voice: "Trúc Ly", durationSec: 0.56, via: "tts.py" },
  { id: "B3-bridge", text: "Chào bạn!", voice: "Trúc Ly", durationSec: 0.64, via: "bridge-curl" },
  { id: "C4-VS-a", text: "Chào bạn!", voice: "Trúc Ly", durationSec: 0.56, via: "tts.py" },
  { id: "C4-VS-b", text: "Chào bạn!", voice: "Trúc Ly", durationSec: 0.64, via: "tts.py" },
  { id: "C4-VS-c", text: "Chào bạn!", voice: "Trúc Ly", durationSec: 0.56, via: "tts.py" },
  { id: "C4-browser", text: "Chào bạn!", voice: "Trúc Ly", durationSec: 0.56, via: "bridge-browser" },
];

/** 3 lần chạy lặp câu dài (text B3-L1, 317 ký tự, Hải Đăng). */
export const TTS_VARIANCE_LONG_47C4: readonly TtsVarianceRun47C4[] = [
  { id: "C4-VL-a", text: "Đây là một câu dài để kiểm tra tốc độ đọc ở văn bản dài. Khi văn bản càng dài, quãng nghỉ giữa các câu chiếm tỉ trọng nhỏ hơn, vì vậy tốc độ trung bình tính theo ký tự trên giây có thể cao hơn so với câu ngắn. VCut Studio vẫn chạy hoàn toàn local, không cần máy chủ đám mây, và mọi tính năng đều nằm trên máy của bạn.", voice: "Hải Đăng", durationSec: 16.79, via: "tts.py" },
  { id: "C4-VL-b", text: "Đây là một câu dài để kiểm tra tốc độ đọc ở văn bản dài. Khi văn bản càng dài, quãng nghỉ giữa các câu chiếm tỉ trọng nhỏ hơn, vì vậy tốc độ trung bình tính theo ký tự trên giây có thể cao hơn so với câu ngắn. VCut Studio vẫn chạy hoàn toàn local, không cần máy chủ đám mây, và mọi tính năng đều nằm trên máy của bạn.", voice: "Hải Đăng", durationSec: 16.52, via: "tts.py" },
  { id: "C4-VL-c", text: "Đây là một câu dài để kiểm tra tốc độ đọc ở văn bản dài. Khi văn bản càng dài, quãng nghỉ giữa các câu chiếm tỉ trọng nhỏ hơn, vì vậy tốc độ trung bình tính theo ký tự trên giây có thể cao hơn so với câu ngắn. VCut Studio vẫn chạy hoàn toàn local, không cần máy chủ đám mây, và mọi tính năng đều nằm trên máy của bạn.", voice: "Hải Đăng", durationSec: 16.74, via: "tts.py" },
];
