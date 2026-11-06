/**
 * ttsEstimate49E1.ts — Ước lượng độ dài giọng đọc TTS theo GIỌNG
 * (per-voice coefficient, Phase 9 đợt 49, luồng E1).
 *
 * Đóng nợ lớn nhất của D1 (LIMITS D1 §7.1): tốc độ đọc chênh nhau
 * theo giọng tới 46% trên cùng text thường, và hiệu ứng số-dày cũng
 * phụ thuộc giọng (2x2: Minh Đức 8,90 vs Hải Đăng 11,55 trên cùng
 * text M3). Hệ số gộp chung C4/D1 chỉ đúng trung bình — toast cho
 * giọng chậm (Đức Trí, Kim Thanh) và giọng nhanh (Thanh Bình, Hải
 * Đăng) đều lệch có hệ thống. Luồng này đo nốt 4 giọng còn lại
 * (Quỳnh Anh, Đức Trí, Kim Thanh, Adam bựa) trên text chuẩn M3/M4,
 * đo lặp Mỹ Duyên thêm 3 lần, và xây bảng hệ số theo giọng.
 *
 * MẪU ĐO MỚI (06/11/2026, tts.py trực tiếp qua server/tts/.venv2,
 * model VieNeu-TTS v3 Turbo đã cache; driver nạp model MỘT lần rồi
 * gọi infer qua đúng đường code của tts.py — xem LIMITS E1 §3):
 * - LẦN 1 (19:03–19:24): 13 mẫu qua driver (8 mẫu giọng mới M3/M4
 *   + Hải Đăng/Minh Đức M4 + Mỹ Duyên lặp ×3). VM RESTART lúc 19:27
 *   đã xóa toàn bộ /tmp — WAV + results.jsonl + driver lần 1 MẤT;
 *   chỉ còn các con số header WAV trong log đã in ra. Các số lần 1
 *   dưới đây là số header-only (không còn WAV để ffprobe lại).
 * - LẦN 2 (19:29–19:39): đo LẠI cùng 13 mẫu, cùng thứ tự. Đây là bộ
 *   số CHÍNH THỨC: header WAV khớp ffprobe từng mili-giây cho cả 13
 *   WAV, kiểm tra im lặng OK (lead/trail ≤ 0,3 s). Hai lần chạy lệch
 *   nhau tối đa 7,1% (Kim Thanh M4: 12,96 → 13,92 s).
 * - CLI (tts.py đầy đủ, gồm nạp model): CLI-1 Hải Đăng M4 9,04 s
 *   (synth 44,8 s, wall 58,273 s — WAV mất theo lần restart, không
 *   ffprobe lại được); CLI-2 Kim Thanh M3 23,03 s (synth 35,7 s,
 *   wall 42,950 s — ffprobe 23,030 s, KHỚP).
 * - Tổng: 25/25 giọng preset đã có ít nhất 1 lần đo; 14/25 có hệ số
 *   normal (đo trên M4); 6/25 có hệ số dense (đo trên M3). 11 giọng
 *   chưa có hệ số normal (Thái Sơn, Phạm Tuyên, Xuân Vĩnh, Ngọc Trân,
 *   Quốc Tuấn, Adam, Trúc Ly, Thiện Minh, Mai Anh, Quang Sơn,
 *   Ngọc Huyền — chỉ đo ở tầng/text khác) và 19 giọng chưa có hệ số
 *   dense → fallback hệ số gộp C4/D1 (xem dưới).
 *
 * THIẾT KẾ BẢNG HỆ SỐ (quyết định của luồng, xem LIMITS E1 §4):
 * - Hệ số normal f_V = tốc độ gộp của giọng V trên text medium /
 *   16,0714 (tốc độ gộp medium normal C4/D1). Hệ số dense g_V =
 *   tốc độ gộp của giọng V trên M3 / 9,5388 (tốc độ gộp dense C4/D1).
 * - Tốc độ gộp = tổng ký tự / tổng giây trên mọi lần đo của giọng đó
 *   (quy tắc gộp của C4; các lần lặp ĐỀU tính — khác với n hiệu
 *   chuẩn tầng, ở đây mỗi lần lặp là một lần đo cùng text/giọng nên
 *   gộp vào tốc độ của giọng đó).
 * - NGOẠI LỆ HẢI ĐĂNG (có cơ sở đo, không phải tùy tiện): f của Hải
 *   Đăng tính từ tốc độ gộp MỌI text medium normal của anh (M4 ×3 +
 *   T2/T4/T5/M5 = 17,2216, n = 7), KHÔNG phải chỉ M4 (18,8056, n = 3)
 *   — vì M4 của Hải Đăng đọc nhanh bất thường so với chính các text
 *   medium khác của anh (tỉ lệ 1,1537). Dùng f M4-only sẽ dự báo
 *   text long B3-L1 sai 14,6% ở tâm (14,56 s so với thực 17,04 s);
 *   dùng f gộp mọi medium thì khoảng theo giọng chứa 17,04 s
 *   (xem test §5).
 * - Áp hệ số giọng sang tầng khác (short/long/veryShort) theo GIẢ
 *   THIẾT tốc độ tương đối của giọng ổn định theo tầng — bằng chứng
 *   yếu duy nhất: Hải Đăng long (B3-L1: 18,60) ≈ hệ số gộp long
 *   (18,6116) trong khi medium gộp của anh (17,22) ≈ hệ số gộp
 *   medium (16,07) — tỉ lệ tương đối 1,00 (long) vs 1,07 (medium),
 *   lệch tâm 7% ở tầng long, vẫn trong khoảng.
 * - Chế độ numberDense: CHỈ dùng hệ số dense riêng khi giọng đó đã
 *   đo M3; giọng chưa đo M3 → dùng hệ số dense gộp chung (g = 1,0),
 *   KHÔNG suy dense từ hệ số normal — bằng chứng 2x2 (D1 §3.3):
 *   độ chậm khi đọc số-dày phụ thuộc giọng độc lập với tốc độ thường
 *   (tỉ lệ dense/normal: Minh Đức 0,66; Hải Đăng 0,67 với f gộp mọi
 *   medium — xem LIMITS E1 §4; Kim Thanh 0,62; Adam bựa 0,69).
 * - Ngưỡng numberDense 13% GIỮ NGUYÊN (tái dùng isNumberDenseText47C4
 *   của C4) — vẫn là fallback tạm thời, không khóa ngưỡng mới.
 *
 * KHOẢNG THEO GIỌNG (nửa khoảng h = 0,17 → [0,83×, 1,17×]):
 * - h bao phủ 2 nguồn sai số đã đo: (a) phương sai chạy-lặp lớn nhất
 *   quan sát được — Mỹ Duyên 11,5% (n = 8, 12,00–13,44 s); (b)
 *   transfer theo text — Hải Đăng đọc M4 nhanh hơn medium khác 15,4%
 *   (tỉ lệ 1,1537), tức text thường mới có thể lệch khỏi tâm M4 tới
 *   ±15,4%. h = 0,17 làm tròn ra ngoài từ 0,154 với biên dư nhỏ — và
 *   biên dư này MỎNG vì transfer mới đo được ở 1 giọng; giọng khác có
 *   transfer lớn hơn thì khoảng có thể không chứa (ghi rõ, không giấu).
 * - Khoảng này chỉ bao phủ phương sai chạy-lặp + transfer theo text
 *   (đã đo ở Hải Đăng); biến thiên theo tầng (giả thiết ở trên) chỉ
 *   có 1 điểm kiểm chứng (B3-L1, lệch tâm 7%).
 * - `calibrated` của kết quả theo giọng = true khi hệ số của giọng đó
 *   ở chế độ đang ước lượng có n ≥ 3 (quy tắc ≥3 mẫu của C4); ngược
 *   lại false — nhưng khoảng vẫn dùng h = 0,17 như nhau (n nhỏ không
 *   làm khoảng hẹp lại một cách giả tạo).
 *
 * TỐC ĐỘ TỔNG HỢP (xem LIMITS E1 §5 — số thật, không sửa memory):
 * - Infer thuần (driver, đã trừ nạp model, sau 1 lần warmup): 26 lần
 *   đo, audio/synth 0,12–0,63×, median 0,32× — CHẬM HƠN NHIỀU con số
 *   "~1,5–2,5× realtime" trong memory. Lần 1 chạy dưới tải CPU cao
 *   (load ~6,6, các luồng đợt 49 khác chạy tsc/ffprobe song song) nên
 *   synth chậm nhất 0,12×; lần 2 máy yên (load ~0,6) vẫn chỉ
 *   0,18–0,63× — tải CPU không phải toàn bộ câu chuyện, tốc độ tổng
 *   hợp vốn đã chậm và dao động lớn giữa các lần chạy.
 * - CLI đầy đủ (gồm nạp model ~10 s): wall 0,16× (Hải Đăng M4) và
 *   0,54× (Kim Thanh M3). Warmup infer đầu: 2,1 s / 1,5 s cho câu
 *   "Chào bạn!" (0,56 s audio).
 * - QUIRK (không ảnh hưởng so sánh): tts.py chia text M3 thành chunk
 *   ở dấu "." trong "2.4.1" rồi nối lại bằng khoảng trắng nên log báo
 *   chunk 182 ký tự thay vì 178 — cùng đường code cho mọi lần đo M3
 *   (C4/D1/E1) nên so sánh vẫn đúng.
 *
 * Ước lượng này chỉ dùng cho hiển thị (hậu tố toast), KHÔNG dùng
 * để cắt/ghép audio hay tính timeline — như Z3/A3/B3/C4/D1.
 */

import { ttsTextLength, parseTtsDurationHeader } from "./ttsDuration44Z3";
import {
  TTS_NUMBER_DENSE_47C4,
  estimateTtsDurationRange47C4,
  isNumberDenseText47C4,
  ttsTierForLength47C4,
  type TtsEstimateRange47C4,
  type TtsRegime47C4,
} from "./ttsEstimate47C4";

/** Text chuẩn M3 (số-dày, 178 ký tự, 24 chữ số = 13,48%) — trùng C4-M3. */
export const TTS_STANDARD_TEXT_M3_49E1 =
  "Ngày 15 tháng 11 năm 2026, lúc 9 giờ 30 phút, VCut Studio phát hành bản cập nhật 2.4.1 với 37 tính năng mới, sửa 128 lỗi và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó.";

/** Text chuẩn M4 (thường, 169 ký tự, 0 chữ số) — trùng C4-M4 / D1. */
export const TTS_STANDARD_TEXT_M4_49E1 =
  "Nguyễn Văn An mở VCut Studio ở Hà Nội, kéo video quay tại Đà Lạt, Sa Pa và Phú Quốc vào timeline, rồi gửi bản dựng cho chị Trần Thu Hà ở Thành phố Hồ Chí Minh xem trước.";

/** Một lần đo thật ĐỘC LẬP của luồng E1 (text chuẩn M3/M4). */
export interface TtsSample49E1 {
  id: string;
  tier: "medium";
  textId: "M3" | "M4";
  /** Text đã đọc (tham chiếu hằng chuẩn — test đếm lại ký tự từ đây). */
  text: string;
  voice: string;
  /** Độ dài thật (giây, từ header WAV). */
  durationSec: number;
  source: "E1-run1" | "E1-run2";
}

/**
 * LẦN 1 (06/11/2026 19:03–19:24): 13 mẫu qua driver. WAV ĐÃ MẤT do VM
 * restart lúc 19:27 xóa /tmp — các số này là số header WAV trong log
 * đã in ra, KHÔNG còn WAV để ffprobe lại. Giữ làm bộ đối chiếu với
 * lần 2 (lệch tối đa 7,1% — xem test §4).
 */
export const TTS_SAMPLES_RUN1_49E1: readonly TtsSample49E1[] = [
  { id: "E1-V8", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Quỳnh Anh", durationSec: 10.24, source: "E1-run1" },
  { id: "E1-V9", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Quỳnh Anh", durationSec: 17.65, source: "E1-run1" },
  { id: "E1-V10", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Đức Trí", durationSec: 14.0, source: "E1-run1" },
  { id: "E1-V11", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Đức Trí", durationSec: 21.76, source: "E1-run1" },
  { id: "E1-V12", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Kim Thanh", durationSec: 12.96, source: "E1-run1" },
  { id: "E1-V13", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Kim Thanh", durationSec: 23.0, source: "E1-run1" },
  { id: "E1-V14", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Adam bựa", durationSec: 10.88, source: "E1-run1" },
  { id: "E1-V15", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Adam bựa", durationSec: 16.06, source: "E1-run1" },
  { id: "E1-V16", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Hải Đăng", durationSec: 8.64, source: "E1-run1" },
  { id: "E1-V17", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Minh Đức", durationSec: 12.72, source: "E1-run1" },
  { id: "E1-R1", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Mỹ Duyên", durationSec: 12.56, source: "E1-run1" },
  { id: "E1-R2", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Mỹ Duyên", durationSec: 12.64, source: "E1-run1" },
  { id: "E1-R3", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Mỹ Duyên", durationSec: 12.4, source: "E1-run1" },
];

/**
 * LẦN 2 (06/11/2026 19:29–19:39): đo LẠI cùng 13 mẫu, cùng thứ tự.
 * Bộ số CHÍNH THỨC — header WAV khớp ffprobe từng mili-giây cho cả
 * 13 WAV, kiểm tra im lặng OK (lead/trail ≤ 0,3 s, xem LIMITS E1 §3.4).
 * Backup số đo ở hidden_files/tts49e1/results-run2.jsonl (chống restart).
 */
export const TTS_SAMPLES_RUN2_49E1: readonly TtsSample49E1[] = [
  { id: "E1-V8", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Quỳnh Anh", durationSec: 10.32, source: "E1-run2" },
  { id: "E1-V9", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Quỳnh Anh", durationSec: 16.74, source: "E1-run2" },
  { id: "E1-V10", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Đức Trí", durationSec: 14.24, source: "E1-run2" },
  { id: "E1-V11", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Đức Trí", durationSec: 21.62, source: "E1-run2" },
  { id: "E1-V12", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Kim Thanh", durationSec: 13.92, source: "E1-run2" },
  { id: "E1-V13", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Kim Thanh", durationSec: 22.92, source: "E1-run2" },
  { id: "E1-V14", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Adam bựa", durationSec: 10.64, source: "E1-run2" },
  { id: "E1-V15", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_49E1, voice: "Adam bựa", durationSec: 17.01, source: "E1-run2" },
  { id: "E1-V16", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Hải Đăng", durationSec: 9.28, source: "E1-run2" },
  { id: "E1-V17", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Minh Đức", durationSec: 12.32, source: "E1-run2" },
  { id: "E1-R1", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Mỹ Duyên", durationSec: 12.32, source: "E1-run2" },
  { id: "E1-R2", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Mỹ Duyên", durationSec: 12.4, source: "E1-run2" },
  { id: "E1-R3", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_49E1, voice: "Mỹ Duyên", durationSec: 12.32, source: "E1-run2" },
];

/** Một lần chạy CLI `tts.py` đầy đủ (gồm nạp model). */
export interface TtsCliRun49E1 {
  id: string;
  textId: "M3" | "M4";
  voice: string;
  /** Độ dài audio thật (giây, từ JSON của tts.py = header WAV). */
  durationSec: number;
  /** Thời gian infer thuần (giây, synthSec trong JSON tts.py). */
  synthSec: number;
  /** Wall-clock cả lần chạy CLI (giây, gồm nạp model); null nếu không đo. */
  wallSec: number | null;
  /** WAV còn để ffprobe lại không (CLI-1 mất theo restart). */
  ffprobeVerified: boolean;
}

/**
 * 2 lần chạy CLI: CLI-1 Hải Đăng M4 (9,04 s — lần đo M4 thứ 2 của Hải
 * Đăng, sau driver lần 1 8,64 s và trước driver lần 2 9,28 s; WAV mất,
 * số lấy từ JSON tts.py) và CLI-2 Kim Thanh M3 (23,03 s, ffprobe
 * 23,030 s KHỚP — lần đo M3 thứ 3 của Kim Thanh).
 */
export const TTS_SAMPLES_CLI_49E1: readonly TtsCliRun49E1[] = [
  { id: "E1-CLI1", textId: "M4", voice: "Hải Đăng", durationSec: 9.04, synthSec: 44.8, wallSec: 58.273, ffprobeVerified: false },
  { id: "E1-CLI2", textId: "M3", voice: "Kim Thanh", durationSec: 23.03, synthSec: 35.7, wallSec: 42.95, ffprobeVerified: true },
];

/** Một lần đo tốc độ tổng hợp (audio/synth, xem header file). */
export interface TtsSynthSpeed49E1 {
  id: string;
  audioSec: number;
  synthSec: number;
  /** Wall-clock cả lần chạy CLI (gồm nạp model); null với lần driver. */
  wallSec: number | null;
}

/**
 * Tốc độ tổng hợp — 28 lần đo: 26 lần driver (lần 1 + lần 2, infer
 * thuần sau warmup, đã trừ nạp model) + 2 lần CLI (gồm nạp model).
 * Tỉ lệ audio/synth: 0,12–0,63×, median 0,32× — đều < 1× realtime.
 */
export const TTS_SYNTH_SPEED_49E1: readonly TtsSynthSpeed49E1[] = [
  // Lần 1 (máy đang tải — load ~6,6 do các luồng đợt 49 khác).
  { id: "E1-V8-run1", audioSec: 10.24, synthSec: 25.5, wallSec: null },
  { id: "E1-V9-run1", audioSec: 17.65, synthSec: 30.1, wallSec: null },
  { id: "E1-V10-run1", audioSec: 14.0, synthSec: 32.3, wallSec: null },
  { id: "E1-V11-run1", audioSec: 21.76, synthSec: 76.7, wallSec: null },
  { id: "E1-V12-run1", audioSec: 12.96, synthSec: 37.7, wallSec: null },
  { id: "E1-V13-run1", audioSec: 23.0, synthSec: 44.3, wallSec: null },
  { id: "E1-V14-run1", audioSec: 10.88, synthSec: 38.6, wallSec: null },
  { id: "E1-V15-run1", audioSec: 16.06, synthSec: 33.9, wallSec: null },
  { id: "E1-V16-run1", audioSec: 8.64, synthSec: 31.2, wallSec: null },
  { id: "E1-V17-run1", audioSec: 12.72, synthSec: 109.4, wallSec: null },
  { id: "E1-R1-run1", audioSec: 12.56, synthSec: 89.4, wallSec: null },
  { id: "E1-R2-run1", audioSec: 12.64, synthSec: 72.2, wallSec: null },
  { id: "E1-R3-run1", audioSec: 12.4, synthSec: 44.1, wallSec: null },
  // Lần 2 (máy yên — load ~0,6).
  { id: "E1-V8-run2", audioSec: 10.32, synthSec: 16.9, wallSec: null },
  { id: "E1-V9-run2", audioSec: 16.74, synthSec: 36.5, wallSec: null },
  { id: "E1-V10-run2", audioSec: 14.24, synthSec: 44.2, wallSec: null },
  { id: "E1-V11-run2", audioSec: 21.62, synthSec: 69.6, wallSec: null },
  { id: "E1-V12-run2", audioSec: 13.92, synthSec: 46.1, wallSec: null },
  { id: "E1-V13-run2", audioSec: 22.92, synthSec: 76.1, wallSec: null },
  { id: "E1-V14-run2", audioSec: 10.64, synthSec: 25.2, wallSec: null },
  { id: "E1-V15-run2", audioSec: 17.01, synthSec: 95.7, wallSec: null },
  { id: "E1-V16-run2", audioSec: 9.28, synthSec: 42.9, wallSec: null },
  { id: "E1-V17-run2", audioSec: 12.32, synthSec: 46.2, wallSec: null },
  { id: "E1-R1-run2", audioSec: 12.32, synthSec: 36.0, wallSec: null },
  { id: "E1-R2-run2", audioSec: 12.4, synthSec: 30.3, wallSec: null },
  { id: "E1-R3-run2", audioSec: 12.32, synthSec: 19.5, wallSec: null },
  // CLI đầy đủ (gồm nạp model).
  { id: "E1-CLI1", audioSec: 9.04, synthSec: 44.8, wallSec: 58.273 },
  { id: "E1-CLI2", audioSec: 23.03, synthSec: 35.7, wallSec: 42.95 },
];

/** Thời gian nạp model + warmup infer đầu (giây) — xem header file. */
export const TTS_SYNTH_META_49E1 = {
  loadSecRun1: 10.0,
  loadSecRun2: 9.4,
  warmupSecRun1: 2.1,
  warmupSecRun2: 1.5,
} as const;

/**
 * Nửa khoảng theo giọng h = 0,17 (xem header: bao phủ spread lặp lớn
 * nhất 11,5% + transfer theo text 15,4% của Hải Đăng, làm tròn ra
 * ngoài). Khoảng = [tâm × 0,83, tâm × 1,17].
 */
export const TTS_PER_VOICE_MIN_FACTOR_49E1 = 0.83;
export const TTS_PER_VOICE_MAX_FACTOR_49E1 = 1.17;

/** Một dòng trong bảng hệ số theo giọng. */
export interface TtsVoiceCoefficient49E1 {
  voice: string;
  /** Hệ số normal f = tốc độ gộp của giọng trên text medium / 16,0714. */
  normalCoefficient: number;
  /** Số lần đo gộp thành hệ số normal (Hải Đăng n = 7: 3 M4 + 4 text medium khác). */
  normalN: number;
  /** Hệ số dense g = tốc độ gộp của giọng trên M3 / 9,5388; null = chưa đo M3. */
  denseCoefficient: number | null;
  /** Số lần đo gộp thành hệ số dense (0 khi chưa đo M3). */
  denseN: number;
}

/**
 * Bảng hệ số theo giọng (14 giọng có hệ số normal, 6 giọng có hệ số
 * dense). Hệ số tính lại từ pool mẫu trong test (xem
 * ttsEstimate49E1.test.ts §3); tốc độ gộp từng giọng:
 * - normal (ký tự/giây): Đức Trí 11,9688; Kim Thanh 12,5744;
 *   Thiền Tâm Đức 12,6497; Minh Đức 13,4984; Mỹ Duyên 13,5092
 *   (n = 8); Thục Đoan 15,6481; Adam bựa 15,7063; Đoan Trang 16,2500;
 *   Quỳnh Anh 16,4397; Ngọc Linh 17,1748; Hải Đăng 17,2216 (gộp mọi
 *   medium, n = 7); Thùy Dung 18,0556; Minh Triết 18,5307;
 *   Thanh Bình 18,6947.
 * - dense (ký tự/giây): Kim Thanh 7,7447 (n = 3); Đức Trí 8,2065;
 *   Minh Đức 8,9045; Quỳnh Anh 10,3518; Adam bựa 10,7650;
 *   Hải Đăng 11,5509.
 * 11 giọng còn lại (Thái Sơn, Phạm Tuyên, Xuân Vĩnh, Ngọc Trân,
 * Quốc Tuấn, Adam, Trúc Ly, Thiện Minh, Mai Anh, Quang Sơn,
 * Ngọc Huyền) KHÔNG có dòng ở đây → fallback hệ số gộp C4/D1.
 */
export const TTS_VOICE_COEFFICIENTS_49E1: readonly TtsVoiceCoefficient49E1[] = [
  { voice: "Đức Trí", normalCoefficient: 0.7447, normalN: 2, denseCoefficient: 0.8603, denseN: 2 },
  { voice: "Kim Thanh", normalCoefficient: 0.7824, normalN: 2, denseCoefficient: 0.8119, denseN: 3 },
  { voice: "Thiền Tâm Đức", normalCoefficient: 0.7871, normalN: 2, denseCoefficient: null, denseN: 0 },
  { voice: "Minh Đức", normalCoefficient: 0.8399, normalN: 2, denseCoefficient: 0.9335, denseN: 1 },
  { voice: "Mỹ Duyên", normalCoefficient: 0.8406, normalN: 8, denseCoefficient: null, denseN: 0 },
  { voice: "Thục Đoan", normalCoefficient: 0.9737, normalN: 1, denseCoefficient: null, denseN: 0 },
  { voice: "Adam bựa", normalCoefficient: 0.9773, normalN: 2, denseCoefficient: 1.1286, denseN: 2 },
  { voice: "Đoan Trang", normalCoefficient: 1.0111, normalN: 1, denseCoefficient: null, denseN: 0 },
  { voice: "Quỳnh Anh", normalCoefficient: 1.0229, normalN: 2, denseCoefficient: 1.0852, denseN: 2 },
  { voice: "Ngọc Linh", normalCoefficient: 1.0687, normalN: 1, denseCoefficient: null, denseN: 0 },
  { voice: "Hải Đăng", normalCoefficient: 1.0716, normalN: 7, denseCoefficient: 1.2109, denseN: 1 },
  { voice: "Thùy Dung", normalCoefficient: 1.1235, normalN: 1, denseCoefficient: null, denseN: 0 },
  { voice: "Minh Triết", normalCoefficient: 1.153, normalN: 1, denseCoefficient: null, denseN: 0 },
  { voice: "Thanh Bình", normalCoefficient: 1.1632, normalN: 1, denseCoefficient: null, denseN: 0 },
];

/**
 * Hệ số của một giọng ở một chế độ; null khi giọng chưa đo ở chế độ
 * đó (dense chưa đo → null, KHÔNG suy từ hệ số normal — xem header).
 * So khớp tên chính xác (phân biệt chữ hoa/thường và "Adam" ≠ "Adam bựa").
 */
export function ttsVoiceCoefficient49E1(voice: string | null | undefined, regime: TtsRegime47C4): number | null {
  if (!voice) return null;
  const row = TTS_VOICE_COEFFICIENTS_49E1.find((r) => r.voice === voice);
  if (!row) return null;
  return regime === "numberDense" ? row.denseCoefficient : row.normalCoefficient;
}

/** Kết quả ước lượng theo tầng + chế độ + giọng (mở rộng hình dạng C4). */
export interface TtsEstimateRange49E1 extends TtsEstimateRange47C4 {
  /** Giọng được hỏi (null khi không truyền voice hoặc fallback). */
  voice: string | null;
  /** Hệ số theo giọng đã áp (f normal / g dense); null khi fallback. */
  coefficient: number | null;
  /** true khi đã áp hệ số theo giọng, false khi fallback hệ số gộp C4. */
  perVoice: boolean;
}

/**
 * Ước lượng khoảng độ dài giọng đọc từ text theo bảng hệ số theo
 * giọng (E1), fallback hệ số gộp C4/D1 khi giọng chưa đo hoặc không
 * truyền voice. Ngưỡng số-dày 13% tái dùng từ C4. Trả null khi text
 * rỗng — cùng quy ước với A3/B3/C4.
 */
export function estimateTtsDurationRange49E1(text: string, voice?: string | null): TtsEstimateRange49E1 | null {
  const chars = ttsTextLength(text ?? "");
  const spec = ttsTierForLength47C4(chars);
  if (spec === null) return null;
  const regime: TtsRegime47C4 = isNumberDenseText47C4(text) ? "numberDense" : "normal";
  const coefficient = ttsVoiceCoefficient49E1(voice, regime);
  if (coefficient === null) {
    const base = estimateTtsDurationRange47C4(text)!;
    return { ...base, voice: voice ?? null, coefficient: null, perVoice: false };
  }
  const baseRate = regime === "numberDense" ? TTS_NUMBER_DENSE_47C4.charsPerSec : spec.charsPerSec;
  const rate = baseRate * coefficient;
  const seconds = chars / rate;
  const row = TTS_VOICE_COEFFICIENTS_49E1.find((r) => r.voice === voice)!;
  const n = regime === "numberDense" ? row.denseN : row.normalN;
  return {
    tier: spec.tier,
    regime,
    chars,
    charsPerSec: rate,
    calibrated: n >= 3,
    seconds,
    minSec: seconds * TTS_PER_VOICE_MIN_FACTOR_49E1,
    maxSec: seconds * TTS_PER_VOICE_MAX_FACTOR_49E1,
    voice: voice ?? null,
    coefficient,
    perVoice: true,
  };
}

/** Ước lượng điểm trung tâm (giây) theo bảng E1; null khi text rỗng. */
export function estimateTtsDurationSec49E1(text: string, voice?: string | null): number | null {
  const r = estimateTtsDurationRange49E1(text, voice);
  return r === null ? null : r.seconds;
}

/** Hậu tố khoảng cho toast: ` (≈9.0–12.0s)`; text rỗng → "". */
export function ttsEstimateRangeSuffix49E1(text: string, voice?: string | null): string {
  const r = estimateTtsDurationRange49E1(text, voice);
  if (r === null) return "";
  return ` (≈${r.minSec.toFixed(1)}–${r.maxSec.toFixed(1)}s)`;
}

/**
 * Hậu tố cho toast done của TtsButton (cùng hình dạng với C4, thêm
 * tham số voice):
 * - header X-TTS-Duration hợp lệ → ` (12.3s)` (số đo thật);
 * - header thiếu/không hợp lệ, text có nội dung → khoảng E1
 *   ` (≈a–bs)` (theo giọng đang chọn khi đo được, fallback hệ số
 *   gộp C4 khi giọng chưa đo / clone / không truyền voice);
 * - không ước lượng được (text rỗng) → "" (bỏ hậu tố, không bịa số).
 */
export function ttsDoneSuffixRange49E1(opts: {
  headerValue: string | null | undefined;
  text: string;
  voice?: string | null;
}): string {
  const measured = parseTtsDurationHeader(opts.headerValue);
  if (measured !== null) return ` (${measured.toFixed(1)}s)`;
  return ttsEstimateRangeSuffix49E1(opts.text, opts.voice);
}
