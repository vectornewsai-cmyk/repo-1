# LIMITS — T1 đợt 128: DEF PSI v0.4 (dải chuyển ~31–53%, xen kẽ loại trừ, hold 30 s)

**Ngày:** 17/11/2026. **Luồng:** T1, đợt 128 vòng lặp Phase 9 (lượt cron
12:35 +07 17/11/2026). **Trạng thái:** **DEF v0.4 XONG.**
**Verdict F2 KHÔNG ĐẠT đợt 120 VẪN ĐỨNG** — DEF này không xét lại
verdict, không gộp số với bộ verdict.

## 0. Tóm tắt

- Viết `docs/PHASE9_ROUND128_T1_PSIAXIS_DEF_V04.md` (42.715 B) theo
  quyết parent đợt 127 §12(b) (PHÊ DUYỆT viết DEF v0.4; không leg dò
  ranh giới thêm).
- **Không chạy leg đo mới, không probe mới** (việc đo đã xong ở T3
  đợt 127). **Không sửa production.** File v0.3.1 giữ nguyên làm lịch
  sử (verify md5 sau khi viết, xem §4).
- **Đính chính kèm theo (không phải việc đo mới):** §11 DEF v0.3.1
  ghi "TRỘN 3/3 tại ~46%" — số đúng là **TRỘN 3/6** (leg 126: 3
  chậm/3 nhanh). Bản v0.4 §11 ghi đúng 3/6; file v0.3.1 giữ nguyên
  không sửa (lịch sử), lỗi này ghi ở đây để người đọc sau không
  trích sai.

## 1. Nguồn số liệu (toàn bộ lấy từ đợt 127, không đo mới)

- `docs/PHASE9_ROUND127_T2_PSIAXIS_DEF_V031.md` (v0.3.1, 32.555 B,
  md5 `02fe8218d6831099b7e89d342ddd83ea` — không đổi sau khi viết
  v0.4, xem §4).
- `docs/PHASE9_ROUND127_T3_INTERLEAVE_LIMITS.md` (leg xen kẽ đợt 127,
  12/12 VALID, boot #73, cây baseline preview.tsx md5
  `03bf029f09b8890b285eacc10a02172b`, media.ts md5
  `2c384ed13703809d5e999311147745e7`).
- `hidden_files/round127-t3/prereg-interleave.md` §6 (bảng diễn giải
  đã đăng ký trước — leg 127 trả nhánh "XEN KẼ KHÔNG LẶP LẠI" →
  caveat xen kẽ loại trừ; nhóm dial TRỘN ở 30,83–41,48% → dải mở
  rộng xuống ~31%).
- Quyết parent đợt 127 §12(b): phê duyệt viết DEF v0.4 (không phải
  v0.3.2 — dải mở rộng gần gấp đôi ~46–53% → ~31–53% + loại trừ
  được caveat xen kẽ là thay đổi nội dung lớn); không leg dò ranh
  giới thêm.
- Prereg E4BATCH §2 (`hidden_files/round118-t9/prereg-e4batch.md`):
  đã đọc — chú thích đính chính theo quyết parent đợt 127 §12(a)
  (drift sau steady-close CÓ THỂ vượt 0,35) đã có sẵn trong file;
  không liên quan nội dung DEF v0.4, chỉ ghi nhận đã kiểm.

## 2. Thay đổi so với v0.3.1 (tóm tắt — chi tiết từng mục trong DEF §0)

1. **Dải chuyển ~46–53% → vùng trộn quan sát được ~31–53%.**
   Cận dưới ~45% → ~31% (trộn đã quan sát được ngay tại ~31%: run 6
   CHẬM 1,702 s @ 31,52% vs run 4 NHANH 1,195 s @ 31,67%; run chậm
   thấp nhất 30,83%). Cận trên giữ ~53% (điểm trộn cao nhất quan sát
   được). Khoảng (53%, 65,75%) CHƯA CÓ DỮ LIỆU — ghi rõ là chưa đo,
   không suy đoán, không nội suy.
2. **Xen kẽ KHÔNG lặp lại (S-F-F-S-F-S) — nhiễu trình tự đo đã loại
   trừ.** Caveat xen kẽ hoàn hảo của v0.3.1 (§9) HẠ XUỐNG ghi chú:
   mẫu hình đợt 126 phù hợp ngẫu nhiên; không có bằng chứng yếu tố
   xen kẽ hệ thống; không cần điều tra thêm. Kết luận bền với biên
   ngưỡng (run 4 nhanh chỉ dưới ngưỡng 5 ms; tính run 4 là chậm thì
   dãy thành S-F-S-S-F-S — vẫn không xen kẽ hoàn hảo).
3. **tickRate mức trung gian ~28–33 tái hiện lần thứ ba** (32,44 @
   ~36% — leg 127; 32,01 @ ~46%; 28,52 @ ~53%). Đường cong 6 điểm
   n=36: 71,6 @ ~10% → 32,4 @ ~36% → 32,0 @ ~46% → 28,5 @ ~53% →
   18,5 @ ~70% → 16,8 @ ~91%. Vừa↔Nặng vẫn không tách (gộp một mức
   "đói").
4. **Hold 30 s sau warm-up là protocol CHUẨN ĐÃ ĐƯỢC CHỨNG MINH**
   (từ khuyến nghị của v0.3.1): run 1 leg 127 mean 41,40%, cao hơn
   mean run ổn định 40,28% — không còn leo dốc. Luật ≥90 s khi đổi
   hog vẫn đứng; chỉ riêng hold sau warm-up là 30 s.
5. **Caveat dial ấm ambient-thấp (MỚI):** sai số dial ấm 3,63 điểm
   trên mean cả leg (tiêu chí ≤5 — ĐẠT) nhưng 7,92 điểm trên run ổn
   định (KHÔNG ĐẠT — W đánh giá thấp run ổn định khi ambient thấp).
   Ghi rõ cả hai sai số trong LIMITS của mọi leg sau (§4.7(c) DEF).
6. **Số hog không cố định mức tải giữa các boot:** cùng 2 hog,
   W = 45,74% (boot #71) vs 32,36% (boot #73) — chênh 13,38 điểm do
   ambient. Mức tải đo được mới là chuẩn.
7. **Ngưỡng Yên <30% ĐỨNG kèm lưu ý biên mong manh 0,83 điểm:**
   không có run chậm nào dưới 30% (run chậm thấp nhất 30,83% — run
   9 leg 127). Nếu leg sau quan sát được run chậm ở ~28–30% thì
   ngưỡng Yên phải xét lại (nợ mở).
8. **Giữ nguyên:** 3 band Yên <30% / Vừa 30–80% / Nặng >80%; luật
   VOID §5; pha (b) T_seek miễn nhiễm (n=42, max 0,001 s); load1 vô
   hiệu (thêm bằng chứng leg 127: run 1 load1 4,22→4,80 vs run 9
   0,35→1,00 cùng PSI ~31–41%); tương quan gộp cập nhật n=36
   (r(avg60,tickRate)=−0,906; r(avg60,T_startup)=+0,836;
   r(tickRate,T_startup)=−0,799; r(avg60,threadsR)=+0,967).

## 3. Cái gì đã xác minh, cái gì chưa

### Đã xác minh (có số đo thật, trích đúng nguồn)

- Vùng trộn quan sát được ~31–53%: ba leg trộn độc lập (GAP-127
  3/6 @ 30,83–41,48%; GAP-126 3/6 @ 39,47–48,00%; GAP-125 4/6 @
  52,75–53,99%) — mỗi leg n=6, boot khác nhau (#73/#71/#70).
- Xen kẽ không lặp lại: dãy con dial leg 127 S-F-F-S-F-S theo thứ tự
  đăng ký trước (seed 1273), 12/12 VALID, 0 run bù, 0 VOID.
- tickRate trung gian ~28–33 tái hiện lần thứ ba (32,44 @ ~36%);
  Yên-127 71,57 @ ~10% khớp Yên-123 71,50 @ ~7%.
- Hold 30 s sau warm-up có tác dụng: run 1 leg 127 41,40% > mean
  run ổn định 40,28% (đợt 126 hold 90 s → run 1 chỉ 39,47%).
- Dial ấm: sai số 3,63 điểm (cả leg, ĐẠT ≤5) / 7,92 điểm (run ổn
  định, KHÔNG ĐẠT) — cả hai số đều lấy đúng từ LIMITS T3-127 §5.
- Pha (b) T_seek miễn nhiễm: max 0,001 s trên 42 run (30 cũ + 12
  leg 127).
- Ngưỡng Yên <30%: 0/12 run Yên chậm (6 đợt 123 + 6 đợt 127); run
  nhanh cao nhất 14,13%.
- Tương quan gộp n=36 lấy đúng từ analyzer 127t3 (tái hiện số n=24
  và n=30 trước khi thêm 6 run dial — theo LIMITS T3-127 §8).

### Chưa xác minh / chưa đo (ghi rõ, không suy đoán)

- **Khoảng (53%, 65,75%) CHƯA CÓ DỮ LIỆU** — chưa biết trộn tiếp
  hay chậm chắc chắn; không tuyên bố "chậm chắc chắn từ 53%".
- **Khoảng (14,13%, ~31%) chưa có run chậm nào** — chưa biết ở đó
  là nhanh chắc chắn hay bắt đầu trộn.
- **Ngưỡng Yên <30%:** biên phía chậm chỉ 0,83 điểm (run chậm thấp
  nhất 30,83%) — chưa đủ biên an toàn để tuyên bố ngưỡng vững
  chắc phía chậm; chỉ đứng vì phía nhanh (14,13%).
- **Dial ấm trên run ổn định khi ambient thấp:** sai số 7,92 điểm
  KHÔNG ĐẠT — phương pháp chỉ tin cậy cho mean cả leg, không tin
  cậy để dự báo từng run ổn định khi ambient thấp. Chưa có cách
  khắc phục đã chứng minh (chỉ ghi caveat + yêu cầu ghi cả hai sai
  số ở leg sau).
- **n=36 gộp qua 6 boot, 1 cây** — không kết luận nhân quả; số boot
  #67?/#68? vẫn tạm, chờ T6 recount (ghi đúng như v0.3.1).
- **Hiệu ứng cụm trong nhóm dial** (r(avg60,tickRate)=+0,914,
  r(avg60,T_startup)=−0,587): ghi là hiệu ứng cụm, không phải quan
  hệ thật — suy luận từ cấu trúc hai cụm leo dốc/ổn định, chưa
  chứng minh bằng leg đối chứng (và không cần leg đối chứng theo
  quyết parent — không leg dò thêm).
- **Cờ T9-done đợt 127** không đồng nghĩa lượt yên hợp lệ (ghi
  caveat trong DEF §9 để đối chiếu; nợ lượt yên #7 chuyển tiếp,
  việc của luồng khác đợt 128).

### Những gì KHÔNG làm

- Không chạy leg đo mới, không probe mới, không sửa production.
- Không sửa file v0.3.1/v0.3/v0.2/v0.1 (lịch sử giữ nguyên) — kể cả
  lỗi "TRỘN 3/3" trong §11 v0.3.1 (chỉ đính chính ở đây, §0).
- Không xét lại verdict F2 đợt 120 (vẫn KHÔNG ĐẠT).
- Không chạy tsc/vite build (không sửa code). Không binary.
- Không leg dò ranh giới thêm (quyết parent đợt 126 §12(b), khẳng
  định lại đợt 127 §12(b)).

## 4. Verify + stage (không push)

- v0.3.1 nguyên vẹn sau khi viết v0.4: md5
  `02fe8218d6831099b7e89d342ddd83ea`, size 32.555 B (khớp trước khi
  viết). v0.3/v0.2/v0.1 không đụng.
- DEF v0.4: `docs/PHASE9_ROUND128_T1_PSIAXIS_DEF_V04.md`, 42.715 B
  (sau sửa "3/3" → "3/6" ở §11 — kích thước không đổi vì cùng độ
  dài chuỗi).
- Không sửa production (chỉ 2 file docs mới). Không chạy tsc/vite
  build (không sửa code). Không probe đo mới. Không binary.
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round128-t1-def-v04.txt`
  (NUL-delimited, 2 file text, verify read-back — xem §5).
- Cờ xong: `hidden_files/round128-t1.done`.

## 5. File đổi/thêm

- `docs/PHASE9_ROUND128_T1_PSIAXIS_DEF_V04.md` (mới, 42.715 B)
- `docs/PHASE9_ROUND128_T1_DEF_V04_LIMITS.md` (mới, file này)

## 6. Nợ mở đợt sau

- DEF v0.5 chỉ viết khi có dữ liệu mới thay đổi dải hoặc ngưỡng — vd
  leg sau đo được khoảng (53%, 65,75%), hoặc run chậm ở ~28–30% buộc
  xét lại ngưỡng Yên <30%. Không leg dò ranh giới thêm trừ khi parent
  ra quyết mới.
- Lượt yên WebKit #7 chưa đóng (T9 0 probe đợt 127) — việc của luồng
  khác đợt 128 (§12(g) đợt 127).
- Mù #47: probe #47 + điều tra đoạn từ #72 — việc của luồng khác
  đợt 128.
- 85m4 webkit chạy lại — việc của luồng khác đợt 128.
- Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 127 §11: G1 chờ user
  quyết; birefnet (chỉ thử lại khi quan sát được available ≥ 6 GB,
  u2net là fallback chính thức); ci-security.yml vẫn 403 chờ user;
  TTS 39 cấm kiểm lại; release gate không đổi + KHÔNG push khi user
  chưa nhắn "push đi".
