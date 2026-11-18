# LIMITS — T2 đợt 127: DEF PSI v0.3.1 (cập nhật từ v0.3 bằng leg 45–55% đợt 126)

**Ngày:** 17/11/2026. **Luồng:** T2, đợt 127 vòng lặp Phase 9 (lượt cron
09:35 +07 17/11/2026). **Trạng thái:** **DEF v0.3.1 XONG.**
**Verdict F2 KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — DEF này không xét lại
verdict, không gộp số với bộ verdict.

## 0. Tóm tắt

- Viết `docs/PHASE9_ROUND127_T2_PSIAXIS_DEF_V031.md` (32.555 B) theo
  quyết parent đợt 126 §12(b) (PHÊ DUYỆT viết DEF v0.3.1 + một leg
  kiểm tra xen kẽ đợt 127 do T3 thực hiện).
- **Không chạy probe đo mới** (việc đo là của T3). **Không sửa
  production.** File v0.3 giữ nguyên làm lịch sử (verify md5 sau khi
  viết, xem §4).

## 1. Nguồn số liệu (toàn bộ lấy từ đợt 126, không đo mới)

- `docs/PHASE9_ROUND126_T4_PSIAXIS_DEF_V03.md` (v0.3, 23.465 B,
  md5 `bc596806c1c0dca20dc6fbb58379ee9e` — không đổi sau khi viết
  v0.3.1, xem §4).
- `docs/PHASE9_ROUND126_T4_LEG4555_LIMITS.md` (leg 45–55% đợt 126,
  6/6 VALID, boot #71, cây baseline preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b`, media.ts md5
  `2c384ed13703809d5e999311147745e7`).
- `hidden_files/round126-t4/prereg-def03-leg4555.md` §6 (bảng diễn
  giải đã đăng ký trước — leg 126 trả nhánh "Trộn" → dải chuyển =
  giao hai vùng trộn).
- Quyết parent đợt 126 §12(b): phê duyệt viết DEF v0.3.1 + leg kiểm
  tra xen kẽ đợt 127; không leg dò ranh giới thêm sau leg này trừ
  khi cần.

## 2. Thay đổi so với v0.3 (tóm tắt — chi tiết từng mục trong DEF §0)

1. **Dải chuyển ~45–60% → vùng trộn quan sát được ~46–53%.**
   Cận dưới ~45% ĐÃ KIỂM CHỨNG (trộn 3/6 tại ~46%, mean run means
   45,98%); cận trên 60% → ~53% (điểm trộn cao nhất quan sát được).
   Khoảng (53%, 65,75%) CHƯA CÓ DỮ LIỆU — không tuyên bố chậm chắc
   chắn từ 53%.
2. **tickRate mức trung gian ~28,5 → khoảng ~28–33** (32,01 @ ~46%
   + 28,52 @ ~53%). Đường cong 5 điểm n=30: 71,5 @ ~7% → 32,0 @
   ~46% → 28,5 @ ~53% → 18,5 @ ~70% → 16,8 @ ~91%.
3. **Dial bằng browser ấm: từ "MỚI, bắt buộc" (v0.3 §4.7) lên
   protocol CHUẨN ĐÃ ĐƯỢC CHỨNG MINH** — sai số 0,24 điểm (W=45,74%
   vs mean run means 45,98%; kiểm chéo loại run 1: 1,54 điểm; tiêu
   chí ≤5; dial lạnh đợt 125 sai ~27 điểm).
4. **Bài học hold sau warm-up:** hold 90 s làm run 1 leo dốc (mean
   39,47% vs runs 2–6: 45,48–48,00%) — KHUYẾN NGHỊ hold ngắn hơn
   cho leg sau; chưa đổi luật hold (do leg sau đăng ký trước trong
   prereg + parent duyệt).
5. **Caveat xen kẽ hoàn hảo (MỚI):** S-F-S-F-S-F, p ngẫu nhiên ≈3%
   (2/64) — tỉ lệ 3/6 KHÔNG đọc là P(chậm)=0,5 chính xác; chờ leg
   kiểm tra xen kẽ T3 đợt 127 xác nhận. DEF v0.3.1 không điền trước
   kết quả leg đó.
6. **Giữ nguyên:** 3 band Yên <30% / Vừa 30–80% / Nặng >80%; luật
   VOID §5; pha (b) T_seek miễn nhiễm (n=30, max 0,001 s); load1 vô
   hiệu (thêm bằng chứng leg 126: run 5 load1 5,21→5,58 vs run 2
   0,88→0,42 cùng PSI ~47%); tương quan gộp cập nhật n=30
   (r(avg60,tickRate)=−0,944; r(avg60,T_startup)=+0,860;
   r(tickRate,T_startup)=−0,809; r(avg60,threadsR)=+0,975).

## 3. Caveat của DEF v0.3.1 (đọc trước khi dùng)

- Vùng trộn ~46–53% là vùng trộn QUAN SÁT ĐƯỢC, không phải khoảng
  tin cậy thống kê (mỗi leg trộn n=6; khoảng (53%, 65,75%) chưa đo).
- Caveat xen kẽ (§9 DEF): chưa loại trừ yếu tố nhiễu xen kẽ theo
  run — chờ T3 đợt 127.
- Caveat run 1 leo dốc (§9 DEF): mean 6 run 45,98% thấp hơn mức ổn
  định runs 2–6 (47,28%) ~1,3 điểm; không loại run khỏi bộ.
- n=30 gộp qua 5 boot, 1 cây — không kết luận nhân quả.
- Verdict đợt 120 vẫn đứng; DEF không phải phán quyết bar F2 mới.

## 4. Verify + stage (không push)

- v0.3 nguyên vẹn sau khi viết v0.3.1: md5
  `bc596806c1c0dca20dc6fbb58379ee9e`, size 23.465 B (khớp trước khi
  viết). v0.2/v0.1 không đụng.
- Không sửa production (chỉ 2 file docs mới). Không chạy tsc/vite
  build (không sửa code). Không probe đo mới. Không binary.
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round127-t2-defv031.txt`
  (NUL-delimited, 2 file text, verify read-back — xem §5).
- Cờ xong: `hidden_files/round127-t2.done`.

## 5. File đổi/thêm

- `docs/PHASE9_ROUND127_T2_PSIAXIS_DEF_V031.md` (mới, 32.555 B)
- `docs/PHASE9_ROUND127_T2_DEF_V031_LIMITS.md` (mới, file này)

## 6. Nợ mở đợt sau

- Leg kiểm tra xen kẽ T3 đợt 127 (xác nhận caveat xen kẽ §9) → DEF
  v0.4 theo §11 DEF v0.3.1.
- Hold sau warm-up rút ngắn bao nhiêu giây: do leg sau đăng ký
  trước trong prereg + parent duyệt.
- Không leg dò ranh giới thêm sau leg T3 đợt 127 trừ khi cần (quyết
  parent đợt 126 §12(b)).
