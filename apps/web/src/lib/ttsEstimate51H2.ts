/**
 * ttsEstimate51H2.ts — Ước lượng độ dài giọng đọc TTS theo GIỌNG,
 * vòng 3 (Phase 9 đợt 51, luồng H2 — HOÀN TẤT ở đợt 52, luồng I1):
 * bảng hệ số MỚI tính lại từ pool gộp (C4/D1/E1/F3 + H2). File này
 * CHỈ chứa bảng + mẫu đo — KHÔNG có helper, KHÔNG sửa TtsButton
 * (luồng H1 sở hữu helper + TtsButton; parent gộp bảng H2 vào helper sau).
 *
 * Đóng nợ F3 §8.2 (ĐÃ ĐÓNG — xem "PHẠM VI ĐO THẬT" dưới): đo lặp cho
 * các giọng n = 1. Kế hoạch đủ là 83 mẫu (2 neo + 42 M3 + 39 M4) để
 * mọi giọng về n ≥ 3 cả hai chế độ; đợt 51 đo được 37 mẫu, đợt 52
 * (luồng I1) đo tiếp 46 mẫu còn lại bằng driver resume — NAY ĐỦ 83/83.
 * 25/25 giọng đã n ≥ 3 cả hai chế độ (Kim Thanh dense n = 5 nhờ neo).
 *
 * MẪU ĐO MỚI (06/11/2026 đợt 51 + 07/11/2026 đợt 52, tts.py trực tiếp
 * qua server/tts/.venv2, model VieNeu-TTS v3 Turbo đã cache; driver
 * nạp model rồi gọi infer qua đúng đường code của tts.py — như F3):
 * - 83 mẫu trong 10 lần chạy driver (resume — xem dưới): 2 neo (A1/A2)
 *   + 42 M3 + 39 M4 (tổng M3 43, M4 40 tính cả neo). Text chuẩn M3/M4
 *   trùng F3/E1/C4/D1.
 * - Neo: Kim Thanh M3 22,28 s (F3: 22,53; E1: 22,92/23,03/23,00 —
 *   lệch ≤ 2,8%) và Hải Đăng M4 9,04 s (F3: 8,40; E1: 8,64/9,28/9,04 —
 *   trùng đúng một lần đo E1) — driver đúng đường đo.
 * - Verify: 35/46 WAV đợt 52 khớp ffprobe từng mili-giây (lead 0,0–
 *   0,1 s, trail 0,0–0,3 s, gap trong dài nhất 0,7 s — không flag nào
 *   vượt ngưỡng); 11 WAV đầu đợt 52 + toàn bộ 37 WAV đợt 51 đã mất
 *   theo /tmp khi VM restart (chỉ còn số đo trong backup hidden_files
 *   — số đo ghi từ header WAV ngay lúc ghi file, cùng đường code với
 *   35 WAV đã verify; đợt 51 đã verify 29/37 WAV trước khi mất).
 *   Không có flag im lặng nào ở 46 mẫu đợt 52.
 * - Mỗi dòng kết quả ghi ĐỒNG THỜI vào /tmp/tts51h2/results.jsonl và
 *   bản sao hidden_files/tts51h2/results.jsonl NGAY trong lúc đo
 *   (flush + fsync) — cơ chế này đã cứu toàn bộ số đo qua 2 lần VM
 *   restart xóa /tmp (bài học F3 §8.8 đã chứng minh hiệu quả thật).
 *
 * LỊCH SỬ ĐO (ghi rõ, không giấu):
 * - Đợt 51 (06/11): 37 mẫu trong 6 lần chạy. VM restart 1 lần; driver
 *   bị SIGKILL 2 lần (exit 137, nghi OOM — driver H1 chiếm ~4,1 GB
 *   RSS + driver H2 ~2,6 GB + mksquashfs; load average 16–18).
 *   Synth 0,02–0,25× realtime (median 0,10×), tổng 5978,3 s.
 * - Đợt 52 (07/11, luồng I1): 46 mẫu còn lại trong 4 lần chạy.
 *   VM restart 1 lần giữa lượt (uptime reset, /tmp bị xóa — mất 11
 *   WAV đầu đợt 52 + 1 mẫu đang tổng hợp dở W31, đo lại sau bằng
 *   resume). Ghi WAV lỗi thoáng qua 2 lần (W39: sf.write "System
 *   error"; V32: sf.write lỗi mở file rồi fallback wave EPERM) —
 *   mỗi lần mất 1 mẫu đã tổng hợp xong (~7 phút synth); driver đã
 *   được vá trong đợt 52 (retry 1 lần + fallback ghi sang đĩa
 *   persistent) và 2 lần lỗi đều xảy ra TRƯỚC khi vá — sau vá không
 *   còn lỗi ghi nào. KHÔNG có SIGKILL nào ở đợt 52 (RSS tối đa
 *   ~3,0 GB, chỉ 1 driver TTS chạy tại một thời điểm).
 *   Synth đợt 52: 0,02–0,51× realtime (median 0,18×), tổng 5449,2 s.
 *   Nạp model mỗi lần chạy lại đợt 52: 8,0–16,2 s; warmup: 1,9–6,1 s.
 *   Tổng cả 83 mẫu: synth 0,02–0,51× (median 0,12×), tổng 11427,5 s.
 *   Mẫu chậm nhất: V23 Phạm Tuyên M3 (đợt 51): 694,2 s synth cho
 *   15,91 s audio (0,02×). Mẫu nhanh nhất: W28 Thiện Minh M4
 *   (đợt 52): 19,1 s synth cho 9,68 s audio (0,51×).
 * - 2 cặp lặp trùng khớp tuyệt đối (model xác định + làm tròn 0,1 s):
 *   V25/V26 Ngọc Huyền M3 cùng 16,03 s / 32,5 s synth; V31/V32 Hải
 *   Đăng M3 cùng 14,89 s (synth khác nhau 98,5/66,0 s); W13/W14 Thục
 *   Đoan M4 cùng 10,96 s (synth 114,8/34,3 s) — đều là 2 lần đo độc
 *   lập, không phải dòng trùng (driver resume bỏ qua id đã đo).
 *
 * THIẾT KẾ BẢNG HỆ SỐ (giữ từ F3, xem LIMITS H2 §4):
 * - f_V = tốc độ gộp normal của giọng V / 16,0714; g_V = tốc độ gộp
 *   dense (M3) của giọng V / 9,5388. Tốc độ gộp = tổng ký tự / tổng
 *   giây trên MỌI lần đo độc lập của giọng đó (C4/D1/E1/F3 + H2).
 * - Khoảng theo giọng giữ h = 0,17 → [0,83×, 1,17×]. Kiểm chứng:
 *   mọi mẫu M3/M4 đã đo đều nằm trong khoảng của giọng đó; độ lệch
 *   lớn nhất so với tâm gộp mới là 11,3% (Hải Đăng normal — giữ từ
 *   F3, do neo A2 8,40 s nhanh nhất). Tỉ lệ dense/normal theo giọng:
 *   0,6199–0,6829 — vẫn KHÔNG phải hằng số, hệ số dense riêng bắt buộc.
 * - normalSpreadPct / denseSpreadPct = độ lệch lớn nhất (%) của một
 *   mẫu trong pool so với tâm gộp của giọng đó — "khoảng tin cậy"
 *   quan sát được, không phải khoảng tin cậy thống kê (n còn nhỏ).
 * - Độ trôi so với bảng F3: lớn nhất +7,01% (Thùy Dung normal —
 *   ngoại lệ duy nhất vượt 5%: F3 chỉ có n = 1 mẫu C4-M4 chậm 9,36 s;
 *   nay n = 3 với 2 mẫu H2 mới 8,56/8,32 s nên tâm gộp dịch lên —
 *   đúng điều nợ n = 1 cảnh báo, không phải lỗi đo); mọi giọng khác
 *   ≤ 4,05% (Đoan Trang dense +4,05%, Minh Đức dense +3,86%).
 *   Hệ số của giọng chưa có mẫu H2 mới thì Y HỆT F3 (pool không đổi)
 *   — nay không còn giọng nào như vậy (25/25 giọng đều có mẫu H2).
 *
 * - Đợt 53 luồng J7 (07/11/2026): đo transfer M5 (text medium thứ hai,
 *   8 mẫu n = 2 × 4 giọng) + 3 mẫu P10/P13/P16 cho Trúc Ly (nằm ở file
 *   H1) + kích hoạt thật fallback ghi WAV sang đĩa persistent (mẫu
 *   J7-FB — xem docs/PHASE9_ROUND53_J7_TTS_TRANSFER_LIMITS.md).
 *   Transfer M5: 0,90–1,01 (không phải 1,172 của F3 trên text có chữ
 *   số) — transfer phụ thuộc text, không phải hằng số giọng. 8 mẫu M5
 *   KHÔNG gộp vào bảng H2 (sẽ dịch hệ số normal +4,0%/+4,5% cho Đức
 *   Trí/Thiền Tâm Đức chỉ vì đổi thành phần blend — xem ghi chú ở mục
 *   TRANSFER M5 dưới); bảng hệ số H2 giữ nguyên, test §3 vẫn khớp.
 *   Tốc độ tổng hợp J7: 0,33–0,60×, median 0,51×, tổng synth 312,3 s.
 * - Đợt 54 luồng K6 (07/11/2026, xem docs/PHASE9_ROUND54_K6_TTS_P13_REPEAT_LIMITS.md):
 *   đo transfer trên TEXT THỨ BA M6 (183 ký tự, 23 chữ số = 12,57% —
 *   cùng dải tỉ lệ chữ số với P13/M3, không tên riêng người/địa danh),
 *   8 mẫu n = 2 × 4 giọng đã đo ở đợt 53. Transfer M6: 1,42–1,58
 *   (mean 1,49) — CAO HẲN M5 (0,90–1,01) lẫn 1,1721 (T2/T4/T5):
 *   giả thuyết "transfer phụ thuộc text" GIỮ VỮNG và mạnh hơn —
 *   transfer tăng theo tỉ lệ chữ số của text (0% → ~0,95; ít số →
 *   1,17; ~13% → ~1,47), đúng mô hình đường cong H1. M6 hành xử
 *   như text dense: tốc độ gộp chỉ nhanh hơn dense H2 1,6–8,0%
 *   (trong h = 0,17) — KHÔNG cần nới h. 8 mẫu M6 cũng KHÔNG gộp
 *   vào bảng H2 (lý do như M5 — xem ghi chú TRANSFER M6 dưới).
 *   Tốc độ tổng hợp K6: 0,08–0,59×, median 0,19×, tổng synth
 *   1400,4 s — chậm vì VM quá tải (load 7–11, 8–10 luồng đợt 54
 *   chạy song song + 1 restart + 1 lần driver chết lặng giữa chừng).
 *
 * Ước lượng này chỉ dùng cho hiển thị (hậu tố toast), KHÔNG dùng
 * để cắt/ghép audio hay tính timeline — như Z3/A3/B3/C4/D1/E1/F3.
 */

/** Text chuẩn M3 (số-dày, 178 ký tự, 24 chữ số = 13,48%) — trùng C4-M3 / E1 / F3. */
export const TTS_STANDARD_TEXT_M3_51H2 =
  "Ngày 15 tháng 11 năm 2026, lúc 9 giờ 30 phút, VCut Studio phát hành bản cập nhật 2.4.1 với 37 tính năng mới, sửa 128 lỗi và tăng tốc xuất video lên 45% so với bản 2.3.0 trước đó.";

/** Text chuẩn M4 (thường, 169 ký tự, 0 chữ số) — trùng C4-M4 / D1 / E1 / F3. */
export const TTS_STANDARD_TEXT_M4_51H2 =
  "Nguyễn Văn An mở VCut Studio ở Hà Nội, kéo video quay tại Đà Lạt, Sa Pa và Phú Quốc vào timeline, rồi gửi bản dựng cho chị Trần Thu Hà ở Thành phố Hồ Chí Minh xem trước.";

/** Một lần đo thật ĐỘC LẬP của luồng H2 (text chuẩn M3/M4). */
export interface TtsSample51H2 {
  id: string;
  tier: "medium";
  textId: "M3" | "M4";
  /** Text đã đọc (tham chiếu hằng chuẩn — test đếm lại ký tự + tỉ lệ chữ số từ đây). */
  text: string;
  voice: string;
  /** Độ dài thật (giây, từ header WAV, khớp ffprobe từng mili-giây với 35/46 WAV đợt 52 còn kiểm chứng được; 48 WAV mất theo /tmp qua 2 lần VM restart chỉ còn số đo trong backup — xem header file). */
  durationSec: number;
  /** Tỉ lệ ký tự chữ số (0–9) trên tổng ký tự (theo ttsTextLength). */
  digitRatio: number;
  source: "H2";
}

/** Một lần đo tốc độ tổng hợp (audio/synth, xem header file). */
export interface TtsSynthSpeed51H2 {
  id: string;
  audioSec: number;
  synthSec: number;
  /** Wall-clock cả lần chạy CLI (gồm nạp model); null với lần driver. */
  wallSec: number | null;
}

/**
 * Nửa khoảng theo giọng h = 0,17 (giữ từ F3 — xem header: mọi mẫu
 * M3/M4 đã đo đều nằm trong khoảng; độ lệch lớn nhất so với tâm gộp
 * mới là 11,3%).
 */
export const TTS_PER_VOICE_MIN_FACTOR_51H2 = 0.83;
export const TTS_PER_VOICE_MAX_FACTOR_51H2 = 1.17;

/** Một dòng trong bảng hệ số theo giọng (25/25 preset, cả 2 chế độ). */
export interface TtsVoiceCoefficient51H2 {
  voice: string;
  /** Hệ số normal f = tốc độ gộp của giọng trên text medium / 16,0714. */
  normalCoefficient: number;
  /** Số lần đo gộp thành hệ số normal (C4/D1/E1/F3 + H2). */
  normalN: number;
  /** Độ lệch lớn nhất (%) của một mẫu medium so với tâm gộp normal. */
  normalSpreadPct: number;
  /** Hệ số dense g = tốc độ gộp của giọng trên M3 / 9,5388. */
  denseCoefficient: number;
  /** Số lần đo gộp thành hệ số dense. */
  denseN: number;
  /** Độ lệch lớn nhất (%) của một mẫu M3 so với tâm gộp dense. */
  denseSpreadPct: number;
  /** Tỉ lệ tốc độ dense / normal của giọng (0,6007–0,6854 — không phải hằng số). */
  denseNormalRatio: number;
}

// Fragment sinh tự động từ results.jsonl đo thật — KHÔNG sửa tay.
// Sinh bởi /tmp/tts51h2/gen_samples51h2.py (bản sao ở hidden_files/tts51h2/).

export const TTS_SAMPLES_51H2: readonly TtsSample51H2[] = [
  { id: "H2-A1", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Kim Thanh", durationSec: 22.28, digitRatio: 0.1348, source: "H2" },
  { id: "H2-A2", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Hải Đăng", durationSec: 9.04, digitRatio: 0, source: "H2" },
  { id: "H2-V01", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Trúc Ly", durationSec: 14.08, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V02", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Trúc Ly", durationSec: 14.33, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V03", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Quốc Tuấn", durationSec: 14.77, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V04", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Quốc Tuấn", durationSec: 14.97, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V05", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Đức Trí", durationSec: 21.5, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W01", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Trúc Ly", durationSec: 8.72, digitRatio: 0, source: "H2" },
  { id: "H2-W02", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Trúc Ly", durationSec: 8.8, digitRatio: 0, source: "H2" },
  { id: "H2-W03", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Quốc Tuấn", durationSec: 9.28, digitRatio: 0, source: "H2" },
  { id: "H2-W04", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Quốc Tuấn", durationSec: 9.04, digitRatio: 0, source: "H2" },
  { id: "H2-W05", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Đức Trí", durationSec: 13.52, digitRatio: 0, source: "H2" },
  { id: "H2-W06", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Kim Thanh", durationSec: 13.6, digitRatio: 0, source: "H2" },
  { id: "H2-V10", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Quang Sơn", durationSec: 17.75, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V11", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Quang Sơn", durationSec: 18.59, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W09", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Quang Sơn", durationSec: 10.96, digitRatio: 0, source: "H2" },
  { id: "H2-W10", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Quang Sơn", durationSec: 11.44, digitRatio: 0, source: "H2" },
  { id: "H2-V12", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Ngọc Trân", durationSec: 18.37, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V13", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Ngọc Trân", durationSec: 18.84, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W11", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Ngọc Trân", durationSec: 11.52, digitRatio: 0, source: "H2" },
  { id: "H2-W12", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Ngọc Trân", durationSec: 11.2, digitRatio: 0, source: "H2" },
  { id: "H2-V16", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Mai Anh", durationSec: 17.11, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V17", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Mai Anh", durationSec: 17.16, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W16", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Mai Anh", durationSec: 10.24, digitRatio: 0, source: "H2" },
  { id: "H2-W17", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Mai Anh", durationSec: 10.72, digitRatio: 0, source: "H2" },
  { id: "H2-V20", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Đoan Trang", durationSec: 16.95, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V21", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Đoan Trang", durationSec: 16.59, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W19", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Đoan Trang", durationSec: 10.16, digitRatio: 0, source: "H2" },
  { id: "H2-W20", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Đoan Trang", durationSec: 10.32, digitRatio: 0, source: "H2" },
  { id: "H2-V23", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Phạm Tuyên", durationSec: 15.91, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V24", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Phạm Tuyên", durationSec: 15.78, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W22", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Phạm Tuyên", durationSec: 10.4, digitRatio: 0, source: "H2" },
  { id: "H2-W23", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Phạm Tuyên", durationSec: 10.48, digitRatio: 0, source: "H2" },
  { id: "H2-V27", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Ngọc Linh", durationSec: 15.51, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V28", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Ngọc Linh", durationSec: 16.31, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W26", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Ngọc Linh", durationSec: 9.84, digitRatio: 0, source: "H2" },
  { id: "H2-W27", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Ngọc Linh", durationSec: 9.92, digitRatio: 0, source: "H2" },
  { id: "H2-V25", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Ngọc Huyền", durationSec: 16.03, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V26", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Ngọc Huyền", durationSec: 16.03, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W24", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Ngọc Huyền", durationSec: 9.52, digitRatio: 0, source: "H2" },
  { id: "H2-W25", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Ngọc Huyền", durationSec: 9.76, digitRatio: 0, source: "H2" },
  { id: "H2-V29", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thiện Minh", durationSec: 15.65, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V30", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thiện Minh", durationSec: 15.06, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W28", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thiện Minh", durationSec: 9.68, digitRatio: 0, source: "H2" },
  { id: "H2-W29", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thiện Minh", durationSec: 9.84, digitRatio: 0, source: "H2" },
  { id: "H2-V33", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Adam", durationSec: 15.18, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V34", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Adam", durationSec: 14.42, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W30", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Adam", durationSec: 9.92, digitRatio: 0, source: "H2" },
  { id: "H2-W31", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Adam", durationSec: 9.12, digitRatio: 0, source: "H2" },
  { id: "H2-V35", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thùy Dung", durationSec: 13.91, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V36", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thùy Dung", durationSec: 14.21, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W32", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thùy Dung", durationSec: 8.56, digitRatio: 0, source: "H2" },
  { id: "H2-W33", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thùy Dung", durationSec: 8.32, digitRatio: 0, source: "H2" },
  { id: "H2-V37", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Xuân Vĩnh", durationSec: 16.19, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V38", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Xuân Vĩnh", durationSec: 16.07, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W34", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Xuân Vĩnh", durationSec: 9.52, digitRatio: 0, source: "H2" },
  { id: "H2-W35", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Xuân Vĩnh", durationSec: 9.76, digitRatio: 0, source: "H2" },
  { id: "H2-V39", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Minh Triết", durationSec: 15.65, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V40", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Minh Triết", durationSec: 15.45, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W36", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Minh Triết", durationSec: 9.76, digitRatio: 0, source: "H2" },
  { id: "H2-W37", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Minh Triết", durationSec: 9.12, digitRatio: 0, source: "H2" },
  { id: "H2-V41", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thanh Bình", durationSec: 14.8, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V42", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thanh Bình", durationSec: 14.27, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W38", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thanh Bình", durationSec: 9.04, digitRatio: 0, source: "H2" },
  { id: "H2-W39", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thanh Bình", durationSec: 9.12, digitRatio: 0, source: "H2" },
  { id: "H2-V18", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thái Sơn", durationSec: 17.89, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V19", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thái Sơn", durationSec: 17.96, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V31", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Hải Đăng", durationSec: 14.89, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V32", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Hải Đăng", durationSec: 14.89, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V07", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Minh Đức", durationSec: 18.8, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V08", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Minh Đức", durationSec: 18.95, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W13", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thục Đoan", durationSec: 10.96, digitRatio: 0, source: "H2" },
  { id: "H2-W14", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thục Đoan", durationSec: 10.96, digitRatio: 0, source: "H2" },
  { id: "H2-V06", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thiền Tâm Đức", durationSec: 21.1, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V09", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Mỹ Duyên", durationSec: 20.86, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V14", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Thục Đoan", durationSec: 16.95, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V15", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Adam bựa", durationSec: 16.78, digitRatio: 0.1348, source: "H2" },
  { id: "H2-V22", tier: "medium", textId: "M3", text: TTS_STANDARD_TEXT_M3_51H2, voice: "Quỳnh Anh", durationSec: 17.18, digitRatio: 0.1348, source: "H2" },
  { id: "H2-W07", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thiền Tâm Đức", durationSec: 12.88, digitRatio: 0, source: "H2" },
  { id: "H2-W08", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Minh Đức", durationSec: 11.76, digitRatio: 0, source: "H2" },
  { id: "H2-W15", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Adam bựa", durationSec: 10.48, digitRatio: 0, source: "H2" },
  { id: "H2-W18", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Thái Sơn", durationSec: 10.96, digitRatio: 0, source: "H2" },
  { id: "H2-W21", tier: "medium", textId: "M4", text: TTS_STANDARD_TEXT_M4_51H2, voice: "Quỳnh Anh", durationSec: 10.32, digitRatio: 0, source: "H2" },
];

export const TTS_SYNTH_SPEED_51H2: readonly TtsSynthSpeed51H2[] = [
  { id: "H2-A1", audioSec: 22.28, synthSec: 177.8, wallSec: null },
  { id: "H2-A2", audioSec: 9.04, synthSec: 35.6, wallSec: null },
  { id: "H2-V01", audioSec: 14.08, synthSec: 128.4, wallSec: null },
  { id: "H2-V02", audioSec: 14.33, synthSec: 130.0, wallSec: null },
  { id: "H2-V03", audioSec: 14.77, synthSec: 99.4, wallSec: null },
  { id: "H2-V04", audioSec: 14.97, synthSec: 186.6, wallSec: null },
  { id: "H2-V05", audioSec: 21.5, synthSec: 316.2, wallSec: null },
  { id: "H2-W01", audioSec: 8.72, synthSec: 68.4, wallSec: null },
  { id: "H2-W02", audioSec: 8.8, synthSec: 95.5, wallSec: null },
  { id: "H2-W03", audioSec: 9.28, synthSec: 134.2, wallSec: null },
  { id: "H2-W04", audioSec: 9.04, synthSec: 132.3, wallSec: null },
  { id: "H2-W05", audioSec: 13.52, synthSec: 302.0, wallSec: null },
  { id: "H2-W06", audioSec: 13.6, synthSec: 184.9, wallSec: null },
  { id: "H2-V10", audioSec: 17.75, synthSec: 467.2, wallSec: null },
  { id: "H2-V11", audioSec: 18.59, synthSec: 252.9, wallSec: null },
  { id: "H2-W09", audioSec: 10.96, synthSec: 138.1, wallSec: null },
  { id: "H2-W10", audioSec: 11.44, synthSec: 111.0, wallSec: null },
  { id: "H2-V12", audioSec: 18.37, synthSec: 156.9, wallSec: null },
  { id: "H2-V13", audioSec: 18.84, synthSec: 182.2, wallSec: null },
  { id: "H2-W11", audioSec: 11.52, synthSec: 117.7, wallSec: null },
  { id: "H2-W12", audioSec: 11.2, synthSec: 118.9, wallSec: null },
  { id: "H2-V16", audioSec: 17.11, synthSec: 159.2, wallSec: null },
  { id: "H2-V17", audioSec: 17.16, synthSec: 203.7, wallSec: null },
  { id: "H2-W16", audioSec: 10.24, synthSec: 111.2, wallSec: null },
  { id: "H2-W17", audioSec: 10.72, synthSec: 99.9, wallSec: null },
  { id: "H2-V20", audioSec: 16.95, synthSec: 118.7, wallSec: null },
  { id: "H2-V21", audioSec: 16.59, synthSec: 121.8, wallSec: null },
  { id: "H2-W19", audioSec: 10.16, synthSec: 116.8, wallSec: null },
  { id: "H2-W20", audioSec: 10.32, synthSec: 89.1, wallSec: null },
  { id: "H2-V23", audioSec: 15.91, synthSec: 694.2, wallSec: null },
  { id: "H2-V24", audioSec: 15.78, synthSec: 85.7, wallSec: null },
  { id: "H2-W22", audioSec: 10.4, synthSec: 95.4, wallSec: null },
  { id: "H2-W23", audioSec: 10.48, synthSec: 94.6, wallSec: null },
  { id: "H2-V27", audioSec: 15.51, synthSec: 108.0, wallSec: null },
  { id: "H2-V28", audioSec: 16.31, synthSec: 150.3, wallSec: null },
  { id: "H2-W26", audioSec: 9.84, synthSec: 80.8, wallSec: null },
  { id: "H2-W27", audioSec: 9.92, synthSec: 112.7, wallSec: null },
  { id: "H2-V25", audioSec: 16.03, synthSec: 32.5, wallSec: null },
  { id: "H2-V26", audioSec: 16.03, synthSec: 32.5, wallSec: null },
  { id: "H2-W24", audioSec: 9.52, synthSec: 52.7, wallSec: null },
  { id: "H2-W25", audioSec: 9.76, synthSec: 24.7, wallSec: null },
  { id: "H2-V29", audioSec: 15.65, synthSec: 40.0, wallSec: null },
  { id: "H2-V30", audioSec: 15.06, synthSec: 36.7, wallSec: null },
  { id: "H2-W28", audioSec: 9.68, synthSec: 19.1, wallSec: null },
  { id: "H2-W29", audioSec: 9.84, synthSec: 55.3, wallSec: null },
  { id: "H2-V33", audioSec: 15.18, synthSec: 64.4, wallSec: null },
  { id: "H2-V34", audioSec: 14.42, synthSec: 46.0, wallSec: null },
  { id: "H2-W30", audioSec: 9.92, synthSec: 32.9, wallSec: null },
  { id: "H2-W31", audioSec: 9.12, synthSec: 41.5, wallSec: null },
  { id: "H2-V35", audioSec: 13.91, synthSec: 77.1, wallSec: null },
  { id: "H2-V36", audioSec: 14.21, synthSec: 38.7, wallSec: null },
  { id: "H2-W32", audioSec: 8.56, synthSec: 39.5, wallSec: null },
  { id: "H2-W33", audioSec: 8.32, synthSec: 25.8, wallSec: null },
  { id: "H2-V37", audioSec: 16.19, synthSec: 108.9, wallSec: null },
  { id: "H2-V38", audioSec: 16.07, synthSec: 40.6, wallSec: null },
  { id: "H2-W34", audioSec: 9.52, synthSec: 25.6, wallSec: null },
  { id: "H2-W35", audioSec: 9.76, synthSec: 31.7, wallSec: null },
  { id: "H2-V39", audioSec: 15.65, synthSec: 251.8, wallSec: null },
  { id: "H2-V40", audioSec: 15.45, synthSec: 366.8, wallSec: null },
  { id: "H2-W36", audioSec: 9.76, synthSec: 256.3, wallSec: null },
  { id: "H2-W37", audioSec: 9.12, synthSec: 407.1, wallSec: null },
  { id: "H2-V41", audioSec: 14.8, synthSec: 214.9, wallSec: null },
  { id: "H2-V42", audioSec: 14.27, synthSec: 492.2, wallSec: null },
  { id: "H2-W38", audioSec: 9.04, synthSec: 455.3, wallSec: null },
  { id: "H2-W39", audioSec: 9.12, synthSec: 77.2, wallSec: null },
  { id: "H2-V18", audioSec: 17.89, synthSec: 174.6, wallSec: null },
  { id: "H2-V19", audioSec: 17.96, synthSec: 317.0, wallSec: null },
  { id: "H2-V31", audioSec: 14.89, synthSec: 98.5, wallSec: null },
  { id: "H2-V32", audioSec: 14.89, synthSec: 66.0, wallSec: null },
  { id: "H2-V07", audioSec: 18.8, synthSec: 111.8, wallSec: null },
  { id: "H2-V08", audioSec: 18.95, synthSec: 70.5, wallSec: null },
  { id: "H2-W13", audioSec: 10.96, synthSec: 114.8, wallSec: null },
  { id: "H2-W14", audioSec: 10.96, synthSec: 34.3, wallSec: null },
  { id: "H2-V06", audioSec: 21.1, synthSec: 160.3, wallSec: null },
  { id: "H2-V09", audioSec: 20.86, synthSec: 167.4, wallSec: null },
  { id: "H2-V14", audioSec: 16.95, synthSec: 137.5, wallSec: null },
  { id: "H2-V15", audioSec: 16.78, synthSec: 162.2, wallSec: null },
  { id: "H2-V22", audioSec: 17.18, synthSec: 96.9, wallSec: null },
  { id: "H2-W07", audioSec: 12.88, synthSec: 70.4, wallSec: null },
  { id: "H2-W08", audioSec: 11.76, synthSec: 68.1, wallSec: null },
  { id: "H2-W15", audioSec: 10.48, synthSec: 79.8, wallSec: null },
  { id: "H2-W18", audioSec: 10.96, synthSec: 97.4, wallSec: null },
  { id: "H2-W21", audioSec: 10.32, synthSec: 33.9, wallSec: null },
];

/**
 * Thời gian nạp model + warmup infer đầu của LẦN CHẠY ĐẦU (run 1:
 * 27,4 s / 7,1 s). Driver chạy lại 9 lần sau đó (resume sau VM restart
 * + 2 lần SIGKILL đợt 51 + 1 lần restart và 2 lần lỗi ghi WAV đợt 52):
 * nạp model 8,0–60,6 s, warmup 1,9–15,4 s — xem LIMITS H2 §5 và
 * LIMITS đợt 52 I1. Thời gian nạp model KHÔNG tính vào độ dài audio.
 */
export const TTS_SYNTH_META_51H2 = {
  loadSecRun1: 27.4,
  warmupSecRun1: 7.1,
} as const;

/**
 * TRANSFER M5 — đợt 53 luồng J7 (07/11/2026, đóng nợ F3 §8.3 một nửa:
 * xem docs/PHASE9_ROUND53_J7_TTS_TRANSFER_LIMITS.md).
 *
 * Text medium thứ hai M5 của C4 (190 ký tự, 0 chữ số, dấu câu dày —
 * khác hẳn text T2/T4/T5 ít số của D1 mà transfer Hải Đăng 1,1721
 * của F3 §4.5 dựa vào). Đo M5 n = 2 cho 3 giọng chậm nhất bảng H2
 * (Đức Trí / Kim Thanh / Thiền Tâm Đức) + Hải Đăng (đối chiếu trực
 * tiếp với 1,1721). Transfer = v_M4-only gộp / v_M5 gộp (n = 2):
 * - Đức Trí 0,9099; Kim Thanh 1,0072; Thiền Tâm Đức 0,9003;
 *   Hải Đăng 0,9736 (v_M4-only thời H2 19,0315; F3 ghi 19,1174 vì
 *   pool M4 lúc đó chưa có mẫu H2 — chênh 0,45%, không đáng kể).
 * - Dải 0,90–1,01, mean ~0,95 — KHÔNG phải 1,172. Transfer KHÔNG ổn
 *   định qua text khác: text có chữ số (T2/T4/T5) đọc chậm hơn M4
 *   ~17%, text 0 chữ số (M5) đọc NHANH bằng hoặc hơn M4. Transfer
 *   1,172 là đặc tính của text chứa chữ số, không phải của "text
 *   medium" nói chung — phù hợp mô hình đường cong H1 (tốc độ phụ
 *   thuộc tỉ lệ chữ số), và M5 (tỉ lệ 0%) đọc nhanh hơn M4 một chút
 *   có thể do M4 nhiều tên riêng (Hà Nội, Đà Lạt, Sa Pa, Phú Quốc…).
 *
 * QUYẾT ĐỊNH KHÔNG GỘP M5 VÀO BẢNG H2 (ghi rõ lý do, không giấu):
 * cộng 2 mẫu M5 vào pool normal sẽ dịch hệ số normal của Đức Trí
 * +4,01%, Thiền Tâm Đức +4,46%, Hải Đăng +1,89% (Kim Thanh −0,31%)
 * — không phải vì giọng thay đổi mà vì thành phần blend đổi; Đức Trí
 * và Thiền Tâm Đức sẽ vượt ngưỡng trôi 5% so với F3 và tạo thêm ngoại
 * lệ giả. Bảng H2 giữ nguyên (test §3 vẫn tính lại khớp bảng); 8 mẫu
 * M5 chỉ dùng để khóa transfer, KHÔNG vào pool (test §9 khóa điều này
 * qua normalN không đổi).
 */

/** Text medium thứ hai M5 của C4 (190 ký tự, 0 chữ số, dấu câu dày). */
export const TTS_STANDARD_TEXT_M5_53J7 =
  "Bạn có nghe không? Video này — đúng rồi, chính video bạn đang xem — được dựng hoàn toàn trên máy của bạn! Không cần mạng, không cần tài khoản, không cần chờ đợi... Chỉ cần nhấn nút, và xong!";

/** Một lần đo transfer M5 của luồng J7 (text M5, n = 2 mỗi giọng). */
export interface TtsSampleM5_53J7 {
  id: string;
  tier: "medium";
  textId: "M5";
  text: string;
  voice: string;
  durationSec: number;
  digitRatio: 0;
  source: "J7";
}

export const TTS_SAMPLES_M5_53J7: readonly TtsSampleM5_53J7[] = [
  { id: "J7-T01", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Đức Trí", durationSec: 14.0, digitRatio: 0, source: "J7" },
  { id: "J7-T02", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Đức Trí", durationSec: 14.48, digitRatio: 0, source: "J7" },
  { id: "J7-T03", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Kim Thanh", durationSec: 15.04, digitRatio: 0, source: "J7" },
  { id: "J7-T04", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Kim Thanh", durationSec: 15.52, digitRatio: 0, source: "J7" },
  { id: "J7-T05", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Thiền Tâm Đức", durationSec: 13.28, digitRatio: 0, source: "J7" },
  { id: "J7-T06", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Thiền Tâm Đức", durationSec: 13.44, digitRatio: 0, source: "J7" },
  { id: "J7-T07", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Hải Đăng", durationSec: 10.16, digitRatio: 0, source: "J7" },
  { id: "J7-T08", tier: "medium", textId: "M5", text: TTS_STANDARD_TEXT_M5_53J7, voice: "Hải Đăng", durationSec: 9.28, digitRatio: 0, source: "J7" },
];

/**
 * Tốc độ tổng hợp J7 — 12 lần đo driver (infer thuần sau warmup, đã trừ
 * nạp model 9,2 s + warmup 3,3 s). Tỉ lệ audio/synth: 0,33–0,60×,
 * median 0,51× — đều < 1× realtime; nhanh nhất từ trước tới nay vì
 * máy yên (load ~1, không còn 8–10 luồng khác tranh CPU như đợt 51/52).
 * Tổng thời gian synth 312,3 s cho 12 mẫu.
 */
export const TTS_SYNTH_SPEED_53J7: readonly TtsSynthSpeed51H2[] = [
  { id: "J7-FB", audioSec: 1.84, synthSec: 5.6, wallSec: null },
  { id: "J7-T01", audioSec: 14.0, synthSec: 38.8, wallSec: null },
  { id: "J7-T02", audioSec: 14.48, synthSec: 28.3, wallSec: null },
  { id: "J7-T03", audioSec: 15.04, synthSec: 25.0, wallSec: null },
  { id: "J7-T04", audioSec: 15.52, synthSec: 30.8, wallSec: null },
  { id: "J7-T05", audioSec: 13.28, synthSec: 24.8, wallSec: null },
  { id: "J7-T06", audioSec: 13.44, synthSec: 23.8, wallSec: null },
  { id: "J7-T07", audioSec: 10.16, synthSec: 18.1, wallSec: null },
  { id: "J7-T08", audioSec: 9.28, synthSec: 16.6, wallSec: null },
  { id: "J7-P10-TL", audioSec: 14.04, synthSec: 29.5, wallSec: null },
  { id: "J7-P13-TL", audioSec: 12.89, synthSec: 27.8, wallSec: null },
  { id: "J7-P16-TL", audioSec: 15.62, synthSec: 43.2, wallSec: null },
];

/**
 * TRANSFER M6 — đợt 54 luồng K6 (07/11/2026, đóng nợ LIMITS J7 §8.1:
 * xem docs/PHASE9_ROUND54_K6_TTS_P13_REPEAT_LIMITS.md).
 *
 * Text medium thứ ba M6 — MỚI đợt 54 (183 ký tự, 23 chữ số = 12,57%):
 * cùng dải tỉ lệ chữ số với P13 (12,43%) / M3 (13,48%), nội dung khác
 * hẳn M4 (0 chữ số, nhiều tên riêng người/địa danh) và M5 (0 chữ số,
 * dấu câu dày); không tên riêng người/địa danh. Đo M6 n = 2 cho 4
 * giọng đã đo ở đợt 53 (Đức Trí / Kim Thanh / Thiền Tâm Đức / Hải Đăng).
 * Transfer = v_M4-only gộp / v_M6 gộp (n = 2), định nghĩa như M5:
 * - Đức Trí 1,4463; Kim Thanh 1,5759; Thiền Tâm Đức 1,4171;
 *   Hải Đăng 1,5230 (v_M4-only: 12,1408 / 12,5247 / 12,8030 / 19,0315).
 * - Dải 1,42–1,58, mean ~1,49 — CAO HẲN transfer M5 (0,90–1,01) lẫn
 *   1,1721 (Hải Đăng trên T2/T4/T5 ít số, F3 §4.5): cùng một giọng,
 *   đổi text medium là transfer đổi hẳn (Hải Đăng: M5 0,9736 → M6
 *   1,5230, +56%). Giả thuyết "transfer phụ thuộc text, không phải
 *   hằng số giọng" GIỮ VỮNG — và nay có thang đo rõ: transfer tăng
 *   theo tỉ lệ chữ số của text (0% → ~0,95; ít số → 1,17; ~13% →
 *   ~1,47), đúng mô hình đường cong H1 (tốc độ phụ thuộc tỉ lệ chữ số).
 * - M6 hành xử như text dense: tốc độ gộp M6 chỉ nhanh hơn dense H2
 *   1,6–8,0% (Đức Trí +2,0%, Kim Thanh +1,6%, Thiền Tâm Đức +8,0%,
 *   Hải Đăng +5,7%) — nằm gọn trong h = 0,17 của hệ số dense; transfer
 *   M6 cũng chỉ thấp hơn transfer suy ra từ M3 (v_M4-only / v_dense)
 *   2–7% (M6 12,57% chữ số < M3 13,48%). Vì vậy "transfer 1,42–1,58
 *   vượt 1,17" KHÔNG phải vi phạm khoảng h — h áp cho độ lệch so với
 *   tâm của đúng lớp text (dense), không phải cho tỉ số v_M4/v_text
 *   (tỉ số này vốn dao động theo text, từ ~0,95 tới ~1,6). KHÔNG nới h.
 * - 1,1721 của F3 §4.5 nay được đặt lại đúng chỗ: đó là transfer của
 *   text ÍT SỐ (T2/T4/T5), không phải biên trên chung của transfer —
 *   biên dư "đã hết" mà J7 lo chỉ đúng với text ít số; text ~13% chữ
 *   số cho transfer ~1,5 là đúng mô hình đường cong, không phải lỗi.
 *
 * QUYẾT ĐỊNH KHÔNG GỘP M6 VÀO BẢNG H2 (như M5, ghi rõ lý do):
 * M6 là text số-dày (12,57% chữ số), bản chất thuộc lớp dense chứ
 * không phải normal — gộp vào pool normal sẽ dịch hệ số normal xuống
 * mạnh (tốc độ M6 chỉ ~65–70% tốc độ M4) chỉ vì đổi thành phần blend.
 * 8 mẫu M6 chỉ dùng để khóa transfer, KHÔNG vào pool (test §10 khóa
 * điều này qua normalN không đổi, như M5 ở §9).
 *
 * ĐO LẶP TRANSFER M6 — ĐỢT 55 LUỒNG L9 (07/11/2026, xem
 * docs/PHASE9_ROUND55_L9_TTS_REPEAT_XCHECK_LIMITS.md): đo lặp đúng
 * protocol K6, n = 2 cho 4 giọng K6 + n = 2 MỚI cho Trúc Ly (giọng
 * thứ 5, v_M4-only 19,3807 — kiểm chứng lại bằng scratch esbuild
 * theo đúng định nghĩa buildM4OnlyPools của test §9/§10).
 * Transfer L9: Đức Trí 1,4363; Kim Thanh 1,5731; Thiền Tâm Đức
 * 1,4584; Hải Đăng 1,5251 — CẢ 4 đều trong dải K6 1,42–1,58
 * (mean 1,4982 vs K6 1,4906); gộp K6+L9 (n = 4): 1,4413 / 1,5745 /
 * 1,4377 / 1,5241 (mean 1,4944). Trúc Ly MỚI: 1,5102 — cũng trong
 * dải. Thang transfer theo tỉ lệ chữ số GIỮ VỮNG qua đo lặp.
 * Trúc Ly v_M6 chỉ nhanh hơn dense H2 +1,0% (4 giọng K6: +1,6–8,0%)
 * — vẫn trong h = 0,17, không phải vi phạm.
 * ĐÍNH CHÍNH NHỎ (phát hiện khi đối chiếu L9): log compute54k6.py
 * ghi transfer Hải Đăng 1,4276 vì script đó dùng nhầm hệ số normal
 * bảng H2 (17,8391) làm mẫu số; định nghĩa đã khóa là v_M4-only
 * (19,0315) cho 1,5230 — LIMITS K6 §2.2, ghi chú này và test §10
 * đều dùng 1,5230 (test tính lại từ pool nên vẫn xanh). L9 dùng
 * đúng định nghĩa v_M4-only cho cả 5 giọng, không lặp lại nhầm lẫn.
 * 10 mẫu M6 L9 cũng KHÔNG vào pool (test §11 khóa normalN).
 */

/** Text medium thứ ba M6 — mới đợt 54 K6 (183 ký tự, 23 chữ số = 12,57%, không tên riêng người/địa danh). */
export const TTS_STANDARD_TEXT_M6_54K6 =
  "Ngày 20 tháng 12 năm 2026, VCut Studio ra mắt bản 4.0 với 52 tính năng mới, sửa 214 lỗi và tăng tốc xuất video lên 60% so với bản 3.5, hỗ trợ dựng 8K, 120 khung hình mỗi giây cho bạn.";

/** Một lần đo transfer M6 của luồng K6 (text M6, n = 2 mỗi giọng). */
export interface TtsSampleM6_54K6 {
  id: string;
  tier: "medium";
  textId: "M6";
  text: string;
  voice: string;
  durationSec: number;
  digitRatio: number;
  source: "K6";
}

export const TTS_SAMPLES_M6_54K6: readonly TtsSampleM6_54K6[] = [
  { id: "K6-T01", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Đức Trí", durationSec: 21.51, digitRatio: 0.1257, source: "K6" },
  { id: "K6-T02", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Đức Trí", durationSec: 22.09, digitRatio: 0.1257, source: "K6" },
  { id: "K6-T03", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Kim Thanh", durationSec: 22.54, digitRatio: 0.1257, source: "K6" },
  { id: "K6-T04", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Kim Thanh", durationSec: 23.51, digitRatio: 0.1257, source: "K6" },
  { id: "K6-T05", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Thiền Tâm Đức", durationSec: 20.79, digitRatio: 0.1257, source: "K6" },
  { id: "K6-T06", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Thiền Tâm Đức", durationSec: 19.72, digitRatio: 0.1257, source: "K6" },
  { id: "K6-T07", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Hải Đăng", durationSec: 14.74, digitRatio: 0.1257, source: "K6" },
  { id: "K6-T08", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Hải Đăng", durationSec: 14.55, digitRatio: 0.1257, source: "K6" },
];

/**
 * Tốc độ tổng hợp K6 — 14 lần đo driver (infer thuần sau warmup, đã trừ
 * nạp model 17,6/7,2/7,9 s + warmup 2,2/1,7/1,7 s qua 3 lần chạy:
 * chạy 1 bị VM restart cắt sau 3 mẫu, chạy 2 chết lặng giữa T06,
 * chạy 3 resume nốt 3 mẫu). Tỉ lệ audio/synth: 0,08–0,59×,
 * median 0,19× — đều < 1× realtime; chậm nhất từ trước tới nay vì
 * VM quá tải (load 7–11, 8–10 luồng đợt 54 chạy song song). Tổng thời
 * gian synth 1400,4 s cho 14 mẫu. Độ dài audio không bị ảnh hưởng
 * (đo từ header WAV).
 */
export const TTS_SYNTH_SPEED_54K6: readonly TtsSynthSpeed51H2[] = [
  { id: "K6-P13-TL-1", audioSec: 13.14, synthSec: 66.2, wallSec: null },
  { id: "K6-M3-TL-1", audioSec: 13.79, synthSec: 147.4, wallSec: null },
  { id: "K6-P13-TL-2", audioSec: 12.89, synthSec: 40.3, wallSec: null },
  { id: "K6-M3-TL-2", audioSec: 13.98, synthSec: 23.8, wallSec: null },
  { id: "K6-P13-TL-3", audioSec: 12.3, synthSec: 26.2, wallSec: null },
  { id: "K6-M3-TL-3", audioSec: 13.77, synthSec: 170.5, wallSec: null },
  { id: "K6-T01", audioSec: 21.51, synthSec: 111.8, wallSec: null },
  { id: "K6-T02", audioSec: 22.09, synthSec: 119.7, wallSec: null },
  { id: "K6-T03", audioSec: 22.54, synthSec: 181.7, wallSec: null },
  { id: "K6-T04", audioSec: 23.51, synthSec: 122.2, wallSec: null },
  { id: "K6-T05", audioSec: 20.79, synthSec: 201.2, wallSec: null },
  { id: "K6-T06", audioSec: 19.72, synthSec: 41.1, wallSec: null },
  { id: "K6-T07", audioSec: 14.74, synthSec: 56.0, wallSec: null },
  { id: "K6-T08", audioSec: 14.55, synthSec: 92.3, wallSec: null },
];

/** Một lần đo transfer M6 của luồng L9 đợt 55 (text M6, n = 2 mỗi giọng — 8 mẫu lặp 4 giọng K6 + 2 mẫu MỚI Trúc Ly). */
export interface TtsSampleM6_55L9 {
  id: string;
  tier: "medium";
  textId: "M6";
  text: string;
  voice: string;
  durationSec: number;
  digitRatio: number;
  source: "L9";
}

export const TTS_SAMPLES_M6_55L9: readonly TtsSampleM6_55L9[] = [
  { id: "L9-T01", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Đức Trí", durationSec: 22.3, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T02", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Đức Trí", durationSec: 21.0, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T03", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Kim Thanh", durationSec: 22.85, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T04", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Kim Thanh", durationSec: 23.12, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T05", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Thiền Tâm Đức", durationSec: 20.8, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T06", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Thiền Tâm Đức", durationSec: 20.89, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T07", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Hải Đăng", durationSec: 14.43, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T08", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Hải Đăng", durationSec: 14.9, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T09", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Trúc Ly", durationSec: 14.34, digitRatio: 0.1257, source: "L9" },
  { id: "L9-T10", tier: "medium", textId: "M6", text: TTS_STANDARD_TEXT_M6_54K6, voice: "Trúc Ly", durationSec: 14.18, digitRatio: 0.1257, source: "L9" },
];

/**
 * Tốc độ tổng hợp L9 — 16 lần đo driver (infer thuần sau warmup, đã trừ
 * nạp model 13,5 s (chạy 1) + 17,0 s (chạy 2 resume) + warmup 5,8/8,2 s:
 * chạy 1 chết lặng giữa T05 (không traceback — nghi SIGKILL/OOM như K6,
 * xem LIMITS L9 §5), chạy 2 resume bỏ qua 10 mẫu đã đo, hoàn tất nốt
 * 6 mẫu). Tỉ lệ audio/synth: 0,03–0,54×, median 0,16× — đều < 1×
 * realtime; chậm nhất 0,03× (L9-M3-TL-2, synth 424,8 s lúc load ~15).
 * Tổng thời gian synth 2064,2 s cho 16 mẫu. Độ dài audio không bị ảnh
 * hưởng (đo từ header WAV).
 */
export const TTS_SYNTH_SPEED_55L9: readonly TtsSynthSpeed51H2[] = [
  { id: "L9-P13-TL-1", audioSec: 12.39, synthSec: 55.8, wallSec: null },
  { id: "L9-M3-TL-1", audioSec: 14.09, synthSec: 38.5, wallSec: null },
  { id: "L9-P13-TL-2", audioSec: 12.63, synthSec: 202.4, wallSec: null },
  { id: "L9-M3-TL-2", audioSec: 14.02, synthSec: 424.8, wallSec: null },
  { id: "L9-P13-TL-3", audioSec: 13.13, synthSec: 137.4, wallSec: null },
  { id: "L9-M3-TL-3", audioSec: 13.92, synthSec: 175.5, wallSec: null },
  { id: "L9-T01", audioSec: 22.3, synthSec: 126.1, wallSec: null },
  { id: "L9-T02", audioSec: 21.0, synthSec: 178.5, wallSec: null },
  { id: "L9-T03", audioSec: 22.85, synthSec: 81.0, wallSec: null },
  { id: "L9-T04", audioSec: 23.12, synthSec: 157.1, wallSec: null },
  { id: "L9-T05", audioSec: 20.8, synthSec: 155.5, wallSec: null },
  { id: "L9-T06", audioSec: 20.89, synthSec: 151.5, wallSec: null },
  { id: "L9-T07", audioSec: 14.43, synthSec: 27.4, wallSec: null },
  { id: "L9-T08", audioSec: 14.9, synthSec: 27.7, wallSec: null },
  { id: "L9-T09", audioSec: 14.34, synthSec: 66.2, wallSec: null },
  { id: "L9-T10", audioSec: 14.18, synthSec: 58.8, wallSec: null },
];

/**
 * Bảng hệ số theo giọng — tính lại từ pool mẫu gộp
 * (C4/D1/E1/F3 + H2, xem compute51h2.ts); tốc độ gộp từng giọng:
 * - Đức Trí: normal 12.1408 (n = 3, f = 0.7554, spread 2.9%) / dense 8.2306 (n = 3, g = 0.8629, spread 0.6%) — tỉ lệ dense/normal 0.6779.
 * - Kim Thanh: normal 12.5247 (n = 3, f = 0.7793, spread 4.0%) / dense 7.8235 (n = 5, g = 0.8202, spread 2.1%) — tỉ lệ dense/normal 0.6246.
 * - Thiền Tâm Đức: normal 12.8030 (n = 3, f = 0.7966, spread 2.4%) / dense 8.3686 (n = 3, g = 0.8773, spread 1.6%) — tỉ lệ dense/normal 0.6536.
 * - Mỹ Duyên: normal 13.5092 (n = 8, f = 0.8406, spread 7.4%) / dense 8.6886 (n = 3, g = 0.9109, spread 2.0%) — tỉ lệ dense/normal 0.6432.
 * - Minh Đức: normal 13.7772 (n = 3, f = 0.8572, spread 4.1%) / dense 9.2484 (n = 3, g = 0.9696, spread 3.9%) — tỉ lệ dense/normal 0.6713.
 * - Quang Sơn: normal 14.9118 (n = 3, f = 0.9278, spread 3.3%) / dense 9.6967 (n = 3, g = 1.0166, spread 3.3%) — tỉ lệ dense/normal 0.6503.
 * - Ngọc Trân: normal 14.9823 (n = 3, f = 0.9322, spread 2.1%) / dense 9.3998 (n = 3, g = 0.9854, spread 3.5%) — tỉ lệ dense/normal 0.6274.
 * - Thục Đoan: normal 15.4951 (n = 3, f = 0.9641, spread 1.0%) / dense 10.2417 (n = 3, g = 1.0737, spread 2.5%) — tỉ lệ dense/normal 0.6610.
 * - Thái Sơn: normal 15.8273 (n = 3, f = 0.9848, spread 2.7%) / dense 9.8926 (n = 3, g = 1.0371, spread 0.8%) — tỉ lệ dense/normal 0.6250.
 * - Adam bựa: normal 15.8438 (n = 3, f = 0.9858, spread 2.0%) / dense 10.7121 (n = 3, g = 1.1230, spread 3.4%) — tỉ lệ dense/normal 0.6761.
 * - Mai Anh: normal 16.0850 (n = 3, f = 1.0008, spread 2.5%) / dense 10.5617 (n = 3, g = 1.1072, spread 3.3%) — tỉ lệ dense/normal 0.6566.
 * - Phạm Tuyên: normal 16.3760 (n = 3, f = 1.0190, spread 2.3%) / dense 11.1832 (n = 3, g = 1.1724, spread 0.9%) — tỉ lệ dense/normal 0.6829.
 * - Đoan Trang: normal 16.4184 (n = 3, f = 1.0216, spread 1.3%) / dense 10.3992 (n = 3, g = 1.0902, spread 4.1%) — tỉ lệ dense/normal 0.6334.
 * - Quỳnh Anh: normal 16.4184 (n = 3, f = 1.0216, spread 0.5%) / dense 10.3549 (n = 3, g = 1.0856, spread 2.7%) — tỉ lệ dense/normal 0.6307.
 * - Ngọc Linh: normal 17.1284 (n = 3, f = 1.0658, spread 0.5%) / dense 11.1692 (n = 3, g = 1.1709, spread 2.7%) — tỉ lệ dense/normal 0.6521.
 * - Thiện Minh: normal 17.3156 (n = 3, f = 1.0774, spread 0.8%) / dense 11.6340 (n = 3, g = 1.2196, spread 2.3%) — tỉ lệ dense/normal 0.6719.
 * - Ngọc Huyền: normal 17.4107 (n = 3, f = 1.0833, spread 1.9%) / dense 11.1903 (n = 3, g = 1.1731, spread 1.6%) — tỉ lệ dense/normal 0.6427.
 * - Xuân Vĩnh: normal 17.8020 (n = 3, f = 1.1077, spread 3.1%) / dense 11.0353 (n = 3, g = 1.1569, spread 0.4%) — tỉ lệ dense/normal 0.6199.
 * - Hải Đăng: normal 17.8391 (n = 8, f = 1.1100, spread 11.3%) / dense 11.8168 (n = 3, g = 1.2388, spread 2.3%) — tỉ lệ dense/normal 0.6624.
 * - Adam: normal 17.8521 (n = 3, f = 1.1108, spread 4.8%) / dense 11.9517 (n = 3, g = 1.2530, spread 3.2%) — tỉ lệ dense/normal 0.6695.
 * - Minh Triết: normal 18.1071 (n = 3, f = 1.1267, spread 4.6%) / dense 11.5186 (n = 3, g = 1.2075, spread 1.3%) — tỉ lệ dense/normal 0.6361.
 * - Quốc Tuấn: normal 18.5850 (n = 3, f = 1.1564, spread 2.1%) / dense 12.0433 (n = 3, g = 1.2626, spread 1.3%) — tỉ lệ dense/normal 0.6480.
 * - Thanh Bình: normal 18.6397 (n = 3, f = 1.1598, spread 0.6%) / dense 12.0487 (n = 3, g = 1.2631, spread 3.4%) — tỉ lệ dense/normal 0.6464.
 * - Thùy Dung: normal 19.3216 (n = 3, f = 1.2022, spread 7.0%) / dense 12.5382 (n = 3, g = 1.3144, spread 2.0%) — tỉ lệ dense/normal 0.6489.
 * - Trúc Ly: normal 19.3807 (n = 3, f = 1.2059, spread 0.9%) / dense 12.7113 (n = 3, g = 1.3326, spread 2.9%) — tỉ lệ dense/normal 0.6559.
 * 25/25 giọng đã n ≥ 3 cả hai chế độ (Kim Thanh dense n = 5) —
 * nợ F3 §8.2 ĐÃ ĐÓNG (đợt 52 I1 đo tiếp 46 mẫu còn lại).
 * Độ trôi lớn nhất so với bảng F3: +7,01% (Thùy Dung normal —
 * ngoại lệ duy nhất vượt 5%, xem header file); mọi giọng khác ≤ 4,05%.
 */
export const TTS_VOICE_COEFFICIENTS_51H2: readonly TtsVoiceCoefficient51H2[] = [
  { voice: "Đức Trí", normalCoefficient: 0.7554, normalN: 3, normalSpreadPct: 2.9, denseCoefficient: 0.8629, denseN: 3, denseSpreadPct: 0.6, denseNormalRatio: 0.6779 },
  { voice: "Kim Thanh", normalCoefficient: 0.7793, normalN: 3, normalSpreadPct: 4.0, denseCoefficient: 0.8202, denseN: 5, denseSpreadPct: 2.1, denseNormalRatio: 0.6246 },
  { voice: "Thiền Tâm Đức", normalCoefficient: 0.7966, normalN: 3, normalSpreadPct: 2.4, denseCoefficient: 0.8773, denseN: 3, denseSpreadPct: 1.6, denseNormalRatio: 0.6536 },
  { voice: "Mỹ Duyên", normalCoefficient: 0.8406, normalN: 8, normalSpreadPct: 7.4, denseCoefficient: 0.9109, denseN: 3, denseSpreadPct: 2.0, denseNormalRatio: 0.6432 },
  { voice: "Minh Đức", normalCoefficient: 0.8572, normalN: 3, normalSpreadPct: 4.1, denseCoefficient: 0.9696, denseN: 3, denseSpreadPct: 3.9, denseNormalRatio: 0.6713 },
  { voice: "Quang Sơn", normalCoefficient: 0.9278, normalN: 3, normalSpreadPct: 3.3, denseCoefficient: 1.0166, denseN: 3, denseSpreadPct: 3.3, denseNormalRatio: 0.6503 },
  { voice: "Ngọc Trân", normalCoefficient: 0.9322, normalN: 3, normalSpreadPct: 2.1, denseCoefficient: 0.9854, denseN: 3, denseSpreadPct: 3.5, denseNormalRatio: 0.6274 },
  { voice: "Thục Đoan", normalCoefficient: 0.9641, normalN: 3, normalSpreadPct: 1.0, denseCoefficient: 1.0737, denseN: 3, denseSpreadPct: 2.5, denseNormalRatio: 0.6610 },
  { voice: "Thái Sơn", normalCoefficient: 0.9848, normalN: 3, normalSpreadPct: 2.7, denseCoefficient: 1.0371, denseN: 3, denseSpreadPct: 0.8, denseNormalRatio: 0.6250 },
  { voice: "Adam bựa", normalCoefficient: 0.9858, normalN: 3, normalSpreadPct: 2.0, denseCoefficient: 1.1230, denseN: 3, denseSpreadPct: 3.4, denseNormalRatio: 0.6761 },
  { voice: "Mai Anh", normalCoefficient: 1.0008, normalN: 3, normalSpreadPct: 2.5, denseCoefficient: 1.1072, denseN: 3, denseSpreadPct: 3.3, denseNormalRatio: 0.6566 },
  { voice: "Phạm Tuyên", normalCoefficient: 1.0190, normalN: 3, normalSpreadPct: 2.3, denseCoefficient: 1.1724, denseN: 3, denseSpreadPct: 0.9, denseNormalRatio: 0.6829 },
  { voice: "Đoan Trang", normalCoefficient: 1.0216, normalN: 3, normalSpreadPct: 1.3, denseCoefficient: 1.0902, denseN: 3, denseSpreadPct: 4.1, denseNormalRatio: 0.6334 },
  { voice: "Quỳnh Anh", normalCoefficient: 1.0216, normalN: 3, normalSpreadPct: 0.5, denseCoefficient: 1.0856, denseN: 3, denseSpreadPct: 2.7, denseNormalRatio: 0.6307 },
  { voice: "Ngọc Linh", normalCoefficient: 1.0658, normalN: 3, normalSpreadPct: 0.5, denseCoefficient: 1.1709, denseN: 3, denseSpreadPct: 2.7, denseNormalRatio: 0.6521 },
  { voice: "Thiện Minh", normalCoefficient: 1.0774, normalN: 3, normalSpreadPct: 0.8, denseCoefficient: 1.2196, denseN: 3, denseSpreadPct: 2.3, denseNormalRatio: 0.6719 },
  { voice: "Ngọc Huyền", normalCoefficient: 1.0833, normalN: 3, normalSpreadPct: 1.9, denseCoefficient: 1.1731, denseN: 3, denseSpreadPct: 1.6, denseNormalRatio: 0.6427 },
  { voice: "Xuân Vĩnh", normalCoefficient: 1.1077, normalN: 3, normalSpreadPct: 3.1, denseCoefficient: 1.1569, denseN: 3, denseSpreadPct: 0.4, denseNormalRatio: 0.6199 },
  { voice: "Hải Đăng", normalCoefficient: 1.1100, normalN: 8, normalSpreadPct: 11.3, denseCoefficient: 1.2388, denseN: 3, denseSpreadPct: 2.3, denseNormalRatio: 0.6624 },
  { voice: "Adam", normalCoefficient: 1.1108, normalN: 3, normalSpreadPct: 4.8, denseCoefficient: 1.2530, denseN: 3, denseSpreadPct: 3.2, denseNormalRatio: 0.6695 },
  { voice: "Minh Triết", normalCoefficient: 1.1267, normalN: 3, normalSpreadPct: 4.6, denseCoefficient: 1.2075, denseN: 3, denseSpreadPct: 1.3, denseNormalRatio: 0.6361 },
  { voice: "Quốc Tuấn", normalCoefficient: 1.1564, normalN: 3, normalSpreadPct: 2.1, denseCoefficient: 1.2626, denseN: 3, denseSpreadPct: 1.3, denseNormalRatio: 0.6480 },
  { voice: "Thanh Bình", normalCoefficient: 1.1598, normalN: 3, normalSpreadPct: 0.6, denseCoefficient: 1.2631, denseN: 3, denseSpreadPct: 3.4, denseNormalRatio: 0.6464 },
  { voice: "Thùy Dung", normalCoefficient: 1.2022, normalN: 3, normalSpreadPct: 7.0, denseCoefficient: 1.3144, denseN: 3, denseSpreadPct: 2.0, denseNormalRatio: 0.6489 },
  { voice: "Trúc Ly", normalCoefficient: 1.2059, normalN: 3, normalSpreadPct: 0.9, denseCoefficient: 1.3326, denseN: 3, denseSpreadPct: 2.9, denseNormalRatio: 0.6559 },
];
