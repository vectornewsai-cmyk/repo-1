# PHASE9 ROUND163 T7 — RUN 162 SUCCEEDED (wall 9.735 s, margin 1.065 s; 0 LẦN VIẾT LẠI; KHÔNG BỊ #65 GIẾT) + REBOOT #66 TRONG ĐỢT (VIẾT LẠI RUN 163 LẦN 1, REQUEUE +45,460 s — ỨNG VIÊN DƯƠNG (m)) + CỬA SLOT 6/6 + 3/3 (0 MUỘN, 0 THIẾU)

- **Luồng:** T7 đợt 163 (lượt cron 21:35 +07 21/11/2026 = 14:35:51Z 21/11). Nhiệm vụ theo brief T7-163: (1) kết cục run 162 — run này vẫn `running` lúc T7-162 đóng cờ (~13:56Z, tuổi gốc 8.446 s, còn 2.354 s tới hạn 14:35:51Z — ĐÚNG lúc đợt 163 mở); boot mới ứng viên #65 btime 14:34:57Z — 54 s TRƯỚC hạn run 162; (2) điểm (m): #64 KHÔNG PHẢI điểm (T2/T7 thống nhất từ đầu đợt 162), #56 VẪN CÓ ĐIỀU KIỆN, n ứng viên GIỮ 20 (nhánh khuyến nghị) hoặc 21 — đánh giá #65 có phải điểm (m) ứng viên không (phối hợp T2); (3) run 163 hiện trạng lúc đóng cờ; (4) cửa slot HB/DR + lũy kế mới; (5) LIMITS trung thực, phụ lục bằng script. Phát hiện thêm trong phiên: **reboot #66 TRONG đợt (btime 16:06:45Z) viết lại run 163 lần 1, requeue btime +45,460 s — ứng viên DƯƠNG (m)** (xem §2.5–2.6).
- **Boot trong phiên:** mở phiên là **1c1cf10c-0528-4cb7-ad36-1c11ad005617** (btime /proc/stat 1795271697 = 14:34:57Z — **reboot #65 ứng viên, GIỜ THẬT**; T0-163 + T2-163 + T5-163 xác minh độc lập); **reboot #66 TRONG phiên** lúc 16:06:45Z (boot **edb2acdb-625d-4874-bfa1-477b0978331d**, btime 1795277205 = 16:06:45Z — **GIỜ THẬT**, T7 xác minh 8 nguồn); boot lúc đóng cờ vẫn edb2acdb (KHÔNG reboot mới sau #66).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 162/163 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 162 §12.3 (quyết parent (f)/(p)/(aa)/(z)), LIMITS T7-162 + NOTES round162-t7, cờ round163-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 162 kết cục? | **`succeeded`** 14:18:06Z (event 14:18:06.540Z, eid 9754), wall từ started gốc **9.735 s**, margin **1.065 s** (17m45s) tới hạn 14:35:51Z | §2.1, Phụ lục A |
| Run 162 có bị #65 giết không? | **KHÔNG — finished 1.011 s TRƯỚC btime #65.** btime #65 chỉ sớm hơn hạn run 162 đúng 54 s (suýt soát theo nghĩa giả định) | §2.1, §2.2 |
| Run 162 mấy lần viết lại? | **0 lần** — started_at không đổi (11:35:51Z); events đúng 2 (dispatched + succeeded), 0 requeue | §2.1 |
| Reboot #65 có tạo điểm (m) mới không? | **KHÔNG PHẢI ĐIỂM (m)** — 0 run đang chạy tại btime, 0 requeue — chữ ký đúng #52/#61/#64; T2-163 xác minh độc lập KHỚP T7 | §2.3 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-163 KHÔNG thu hẹp được cửa LẦN THỨ SÁU** (5 hướng mới, đều âm tính); R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) GIỮ 14** theo quyết (g) đợt 156. N ứng viên **GIỮ 20 (17 dương + 3 âm, nhánh khuyến nghị) hoặc 21 (17 dương + 4 âm, nhánh #56 ÂM)** — chưa cộng #66 (chờ parent quyết) | §2.4, §2.6, Phụ lục E |
| Reboot #66 (trong đợt)? | **VIẾT LẠI run 163 lần 1** — requeue 16:07:30.460Z = **btime +45,460 s, TRONG dải 33–49,8 s** → **ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-164) | §2.5, §2.6 |
| Cửa slot đợt 163? | **HB 6/6 (toàn −316 s), DR 3/3 (toàn 0 s), 0 thiếu, 0 muộn** — cửa LÀNH HOÀN TOÀN (đợt thứ hai liên tiếp) | §2.7 |
| Run 163? | **Jitter 0 s** (lần thứ 16 liên tiếp), **1 lần viết lại (tại #66)**, **vẫn `running` lúc đóng cờ** (~16:47Z, tuổi gốc 7.885 s, còn 2.915 s tới hạn 17:35:51Z). Kết cục thuộc T7-164 | §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–162): heartbeat **44/369 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/255 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 162 — SUCCEEDED, margin 1.065 s (7 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp)

Run 162 (`87119032-de13-445b-bb00-fd368b676d0e`, sched 1795260951 = 11:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795260951 = 11:35:51Z 21/11 |
| started_at (gốc, không đổi) | 1795260951 = 11:35:51Z — jitter 0 s |
| finished_at_utc | 1795270686 = 14:18:06Z (event `succeeded` 14:18:06.540Z, eid 9754) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795270675 = 14:17:55Z (finished − 11 s) |
| Wall từ started gốc | 1795270686 − 1795260951 = **9.735 s** (2h42m15s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795271751 = 14:35:51Z — finished TRƯỚC hạn **1.065 s** (17m45s) |
| Finished trước btime #65 | 1795271697 − 1795270686 = 1.011 s (16m51s) |

- Events run 162 (đầy đủ, 2 event, không thiếu, không thêm sau succeeded): `dispatched` 11:35:51.077Z (eid 9715, detail "scheduled") + **`succeeded` 14:18:06.540Z (9754)**. **KHÔNG có event nào cho run 162 sau 14:18:06Z** (kiểm lại ở đọc cuối #7: 0 event mới sau eid 9754; 0 requeue, 0 reattach — 0 lần viết lại xác nhận bằng events).
- 7 lần đọc DB đầy đủ trong phiên khớp nhau ở mọi trường (đọc #1 ~14:40Z, #2 ~15:06Z, #3 ~15:33Z, #4 ~15:58Z, #5 ~16:07Z, #6 ~16:25Z, #7 ~16:47Z — đọc #1 xác nhận kết cục; các đọc sau xác nhận không đổi). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: 1.452 s; 162: **1.065 s** — hẹp hơn 161 đúng 387 s, xếp thứ 9/13 trong chuỗi từ đợt 150, và là margin hẹp nhất trong 4 đợt gần nhất 159–162. T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 162 claimed 14:17:55Z (finished − **11 s**) — bằng 157 (11 s), cao nhất họ 7–11 s của run 154 (7 s) / 155 (8 s) / 158 (10 s) / 160 (7 s) / 161 (6 s). T7 ghi đúng 11 s, không làm tròn. Claimed_at KHÔNG đổi lần nào trong 7 lần đọc.
- **T10-162 đóng sổ 14:16:39Z — run 162 finish 87 s SAU khi T10 đóng** (14:18:06Z). Claim "run 162 chưa có kết cục" của T10-162 ĐÚNG lúc đóng (cùng mẫu run 161: finish 44 s sau T10-161 đóng).
- **Run 162 bị 0 lần viết lại** — chuỗi run bị viết lại: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (1), 162 (**0 lần**). Run 162 là run thứ hai có 0 lần viết lại kể từ 160 (160: 0, 161: 1, 162: 0).

### 2.2 Reboot #65 (btime 14:34:57Z) — GIỮA HAI ĐỢT, GIỜ THẬT, KHÔNG NGHỊCH LÝ ĐỒNG HỒ, KHÔNG OVERLAP DÀI

- **Reboot #65: boot 1c1cf10c-0528-4cb7-ad36-1c11ad005617, btime 1795271697 = 14:34:57Z 21/11.** Xác minh T7 (lúc mở + đọc #1 + đọc #7): boot_id + btime + `uptime -s` 14:34:57Z (khớp) + /proc/1 mtime 14:35:11Z (+14 s) + journal idx 0 duy nhất, first entry 14:35:12Z (+15 s) + wtmp begins 14:35:11Z (+14 s) + `last` reboot 14:35 still running. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 14:40:05 vs 14:40:04 (chênh 1 s, lúc mở), 16:47:30 vs 16:47:29 (chênh 1 s, lúc đóng) — hai lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1).
- **Gap #64→#65 (btime−btime): 1795271697 − 1795259718 = 11.979 s (3h19m39s) — DÀI NHẤT trong chuỗi gần đây** (các gap trước: #61→#62 9.220 s, #62→#63 9.073 s, #63→#64 2.676 s).
- **#65 xảy ra SAU khi T10-162 đóng sổ 1.098 s (18m18s)** (đóng 14:16:39Z → btime 14:34:57Z) và TRƯỚC khi đợt 163 mở (14:35:51Z). Claim "KHÔNG reboot mới trong lúc T10-162 đóng sổ" của T10-162 **ĐỨNG** — khác #62 (F-161-T1-1: #62 rơi vào lúc T10-160 đóng sổ). T0-163 xác nhận độc lập cùng kết luận (9 nguồn).
- **0 requeue do #65:** cửa 14:34:57–14:35:51Z (mọi job, event `requeued_after_restart`): 0 dòng. (Tên event đúng ngay lần đầu — bài học F-162-T7-2 đã áp dụng.)
- **0 run đang chạy tại btime #65:** truy vấn spanning btime 1795271697: 0 dòng. Run 162 finished 14:18:06Z (1.011 s TRƯỚC btime); run 163 started 14:35:51Z (sau btime 54 s); HB 14:20:50Z started 14:15:34Z finished cùng giây (trước btime); DR 14:00Z finished 14:00:00Z (trước btime). **KHÔNG dính caveat viết-lại-tự-loại:** run 162 finished thật trước btime dù không viết lại lần nào; run 163 started sau btime — spanning = 0 là kết quả thật, không phải artifact.
- **KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài tại #65** (T0-163 9 nguồn + T2-163 F126?/drift + T7 Cloudflare ±1 s ×2 — ba bên độc lập, khớp nhau): không có nội dung boot cũ nào đóng dấu sau btime #65 (run 162 succeed 14:18:06Z trước btime 16'51", 0 event sau; boot #64 chết trong (14:25:21Z, 14:34:57Z] theo T0-163 — watcher-162 chết sớm 14:25:20Z, không phải theo reboot, xem §2.8). Overlap #65 (nếu có) không đo được và không cần thiết cho verdict — không có nghịch lý nào để giải thích (khác #62: có nghịch lý 824 s cần OVERLAP giải thích).
- **btime #65 chỉ sớm hơn hạn run 162 đúng 54 s** (14:34:57Z vs 14:35:51Z) — suýt soát theo nghĩa giả định: nếu run 162 còn chạy tới 14:34:57Z thì đã bị giết chỉ 54 s trước hạn. Nhưng run 162 đã finish trước đó 1.011 s nên đây KHÔNG phải vụ giết. T7 ghi rõ cả hai mặt, không thổi phồng "suýt" thành "giết".
- **Số hiệu #65 theo đếm tuần tự** — chờ parent xác nhận (T0/T2/T5/T7-163 xác minh độc lập; T1-163 chạy suite 28/28 trên boot này; T5-163 POSTBOOT_PASS #65 đã có 14:45:05Z).

### 2.3 Điểm (m) #65 — KHÔNG PHẢI ĐIỂM (T7 lean KHÔNG ĐỔI từ đọc #1; T2-163 xác minh độc lập KHỚP)

- Chữ ký hình thức: 0 run đang chạy tại btime thật 14:34:57Z, 0 requeue trong cửa 14:34:57–14:35:51Z — **giống hệt #52, #61 và #64** (0 run đang chạy → không phải điểm dữ liệu). Khác #62 (1 run đang chạy tại btime → ứng viên điểm ÂM, đã CHẤP NHẬN theo quyết (s) đợt 161), #63 (viết lại run 161, requeue +37,128 s → điểm DƯƠNG, đã CHẤP NHẬN theo quyết (t) đợt 161) và #66 (viết lại run 163, requeue +45,460 s → ứng viên DƯƠNG, xem §2.6).
- **Lean của T7 — KHÔNG ĐỔI từ đọc #1 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #1 (finished-trước-btime là dứt khoát: run 162 finished 14:18:06Z, 1.011 s trước btime; spanning 0 dòng; requeue 0 dòng) nên T7 kết luận "KHÔNG PHẢI điểm" từ đọc #1 và GIỮ NGUYÊN qua 7 lần đọc — không có lean nháp ngược như #62 đợt 161 (F-161-T7-1). T2-163 đọc NOTES #1 của T7 và đối chiếu độc lập: **"Điểm (m) #65: KHÔNG PHẢI ĐIỂM (T7-163 NOTES #1; T2 đối chiếu khớp: run 162 finished 14:18:06Z, 1.011 s trước btime; 0 requeue; 0 run đang chạy tại btime)"** (cờ T2-163 15:15:34Z). Hai bên thống nhất ngay từ đầu, không có phân kỳ để T10 phán. Prereg (f) đoán #65 là ứng viên MẠNH — SAI HƯỚNG (F-163-T2-5).
- **T7 KHÔNG tự đổi n** (điều tra đã đóng): n ứng viên **GIỮ 20 (17 dương + 3 âm, nhánh khuyến nghị) hoặc 21 (17 dương + 4 âm, nhánh #56 ÂM)** — #65 KHÔNG cộng (không phải điểm). #66 chưa cộng — chờ parent quyết (xem §2.6).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-163 KHÔNG thu hẹp được cửa LẦN THỨ SÁU

- T2-163 DONE 15:15:34Z (đọc cờ, đối chiếu chéo): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ SÁU** — 5 hướng mới đều âm tính (journal boots; dpkg.log 20/11; Chrome History sqlite 760 DB — 0 visit trong cửa hẹp; wtmp xoay không tồn tại; NOTES T7-163). Cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n chính thức (ứng viên) GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 + quyết (d)/(e) đợt 161 + quyết (f) đợt 162** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 20 (nhánh khuyến nghị, chưa cộng #66) ; nếu J < 2.807 s → #56 là điểm ÂM → n = 21 (chưa cộng #66). Quyết (d) đợt 159 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-163 thêm: mù **#95? (#63) MỞ — điều tra đầy đủ** (P file 1.297 s / union-A 1.297 s / union-B 1.227 s — sơ bộ T2-162 là 1.153 s, mất 11 mốc runtime-file; biến thể +dispatch 11:35:51Z: 1.222 s — mọi cách đếm đều vượt sàn 1.147 s; Q file 843 s / union-A 616 s / union-B 591 s — ĐÓNG); mù **#94? (#62) MỞ** (quyết (b) đợt 162); mù **#88? VẪN MỞ** (hole-recheck lần thứ bảy: 345 hit, 0 mốc mới); mù **#77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110 (gap #63 = 9.073 s). INSIDE: **#64 INSIDE dải FULL110** [10:56:37Z, 12:56:37Z] neo 10:30:42Z (biên dưới 1.121 s) → chuỗi 1 LÊN 2; **#65 NGOÀI dải FULL111** [11:41:21Z, 13:41:06Z] neo 11:15:18Z (muộn 3.231 s, có điều kiện) → chuỗi 2 KẾT THÚC, chuỗi mới từ #65 (độ dài 1); #65 cũng NGOÀI dải FULL110 còn hiệu lực (muộn 7.060 s). T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.

### 2.5 Run 163 + reboot #66 (btime 16:06:45Z, TRONG đợt) — VIẾT LẠI LẦN 1, requeue +45,460 s

Run 163 (`3f169faa-6a18-4615-b8ea-ac42d02d4e7c`, sched 1795271751 = 14:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795271751 | 14:35:51Z 21/11 |
| started_at GỐC | 1795271751 | 14:35:51Z — **jitter 0 s** |
| started_at sau viết lại lần 1 (#66) | 1795277250 | 16:07:30Z |
| worker_claimed_at (KHÔNG ĐỔI) | 1795271751 | 14:35:51Z (started gốc + 0 s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795282551 | 17:35:51Z 21/11 |

- 7 lần đọc DB đầy đủ trong phiên: đọc #1–#4 (14:40Z–15:58Z) run 163 `running`, started_at 1795271751 không đổi; đọc #5 (~16:07Z, SAU reboot #66) started_at ĐÃ ĐỔI thành 1795277250; đọc #6–#7 (16:25Z–16:47Z) started_at KHÔNG đổi lần nữa, claimed_at KHÔNG đổi lần nào. **1 lần viết lại duy nhất (tại #66), KHÔNG viết lại lần 2.** Attempt 1; error_text null; worker_execution_timed_out false.
- Events run 163 (đầy đủ, 4 event, 0 event mới sau reattach eid 9783 ở đọc #7): `dispatched` 14:35:51.145Z (eid 9756, detail "scheduled") + **`requeued_after_restart` 16:07:30.460Z (9781, detail "daemon startup recovery")** + `dispatched` 16:07:30.540Z (9782, detail "scheduled") + **`reattached_after_restart` 16:07:30.708Z (9783, detail "execute turn already complete (model-output evidence)")**.
- **Reboot #66: boot edb2acdb-625d-4874-bfa1-477b0978331d, btime 1795277205 = 16:06:45Z 21/11.** Xác minh T7 (đọc #5 + đọc #7): boot_id + btime + `uptime -s` 16:06:45Z (khớp) + /proc/1 mtime 16:07:00.575Z (+15,575 s) + journal idx 0 duy nhất, first entry 16:07:01Z (+16 s) + wtmp begins 16:07:00Z (+15 s) + `last` reboot 16:07 still running. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local 16:08:34 vs 16:08:33 (chênh 1 s, lúc phát hiện), 16:47:30 vs 16:47:29 (chênh 1 s, lúc đóng) — hai lần trong phiên, đều trong ±1 s.
- **Gap #65→#66 (btime−btime): 1795277205 − 1795271697 = 5.508 s (1h31m48s).**
- **#66 xảy ra SAU khi T8-163 đóng sổ 129 s** (đóng 16:04:36Z → btime 16:06:45Z) và TRONG lúc T7/T9 đang chạy — khác #64/#65 (giữa hai đợt). Claim "0 reboot trong phiên" của T8-163 ĐÚNG lúc đóng.
- **Jitter 0 s** — lần thứ mười sáu liên tiếp run vcut jitter 0 (162 là lần thứ mười lăm).
- Tuổi run từ gốc lúc đọc cuối #7 (16:47:16Z): 7.885 s; còn 2.915 s tới hạn ngân sách 17:35:51Z. **Kết cục thuộc T7-164** (hạn cứng đóng đợt 163 là 17:30Z, trước hạn run 163 17:35:51Z).
- Run 163 dispatch SAU btime #65 54 s, trên boot #65 (worker_boot_generation cron_boot_f0b2f993...); sau #66, worker_boot_generation mới cron_boot_4beb5d7a3888481b9efc8f6dbc22ab4f. Hạn ngân sách KHÔNG ĐỔI (tính từ started gốc, không tính từ started viết lại — cùng quy ước các đợt trước).

### 2.6 Điểm (m) #66 — ỨNG VIÊN DƯƠNG (requeue +45,460 s, trong dải 33–49,8 s)

- **Run 163 ĐANG CHẠY tại btime #66 (16:06:45Z).** Bằng chứng: đọc #4 (15:58:40Z) running, started gốc 14:35:51Z; 0 event finish trước btime (events đầy đủ 4 event — không có `succeeded`/`failed` nào trước 16:07:30Z); requeue + reattach tại btime +45,460 s; chính phiên T7 này bị SIGTERM trong lúc reboot (sleep #4 chết ~16:07:15Z) và session re-attach sau reboot — cùng cơ chế reattach như event 9783 của run 163.
- **Requeue #66: 16:07:30.460Z = btime + 45,460 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 16:06:45–16:47:00Z (mọi job): đúng 1 dòng — requeue run 163 (eid 9781). Không job nào khác bị requeue do #66.
- **Caveat spanning — GHI RÕ, KHÔNG GIẤU:** truy vấn spanning btime #66 trả 0 dòng, NHƯNG ĐÂY LÀ ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy". Run 163 started_at đã viết lại thành 16:07:30Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Đây đúng là caveat T7-162 §2.2 đã cảnh báo ("run 161 finished thật trước btime dù started_at đã viết lại" — trường hợp đó spanning = 0 là thật; trường hợp #66 này spanning = 0 là artifact vì run đang chạy bị viết lại qua btime). Verdict DƯƠNG ứng viên dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **Khung giờ của phép trừ (quy tắc đứng từ đợt 157 §3.3):** run 163 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 163 ở khung thật; btime #66 xác minh giờ thật 8 nguồn T7 + Cloudflare ±1 s ×2; requeue event `created_at` là timestamp host-side cùng khung thật. Delta 45,460 s lấy từ `created_at` timestamptz trực tiếp (16:07:30.460Z), không qua extract-epoch làm tròn.
- **Lean của T7 — DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #5 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #5 (requeue trong dải là dứt khoát); đọc #6/#7 xác nhận không đổi (không viết lại lần 2, không requeue thêm, không reboot mới). T7 KHÔNG tự cộng n (điều tra (m) VẪN ĐÓNG theo quyết (f) đợt 162); T10/parent quyết. **Đối chiếu độc lập thuộc T2-164** (T2-163 đã đóng 15:15:34Z, trước #66 51m11s — không thể đối chiếu #66).
- **Nếu parent CHẤP NHẬN #66 DƯƠNG:** n ứng viên 20 → **21 (18 dương + 3 âm, nhánh khuyến nghị)** hoặc 21 → **22 (18 dương + 4 âm, nhánh #56 ÂM)**; n chính thức (ứng viên) GIỮ 14 cho tới khi #56 được chốt. Dải dương ứng viên GIỮ 33–49,8 s (#66 +45,460 s nằm trong dải, không mở rộng dải). Chuỗi run bị viết lại: 160 (0), 161 (1), 162 (0), 163 (**1** — chuỗi 0-lần-viết-lại không đứt hẳn, cùng mẫu quyết (aa) đợt 162).

### 2.7 Slot HB/DR trong cửa 14:00Z → 16:50Z 21/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h07' (7 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:20:50 (14:20:50Z) | deecd511 | 14:15:34 | **−316 s** | CÓ |
| 21:50:50 (14:50:50Z) | 0b4df3d8 | 14:45:34 | −316 s | CÓ |
| 22:20:50 (15:20:50Z) | b0f934f3 | 15:15:34 | −316 s | CÓ |
| 22:50:50 (15:50:50Z) | 8cf29382 | 15:45:34 | −316 s | CÓ |
| 23:20:50 (16:20:50Z) | 29baafc4 | 16:15:34 | −316 s | CÓ |
| 23:50:50 (16:50:50Z) | 9175d7a9 | 16:45:34 | −316 s | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started; jitter −316 s đồng đều tuyệt đối (mẫu chuẩn). HB 16:20:50Z dispatched 8m49s SAU btime #66 trên boot mới #66 — daemon boot mới dispatch bình thường. **0 muộn mới — muộn HB lũy kế GIỮ 9** (đợt thứ hai liên tiếp vắng muộn mới).
- Slot HB 13:50:50Z đã đếm ở đợt 162 — T7-163 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot HB 17:20:50Z + DR 17:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-164.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:00 (14:00Z) | 363dfd9e | 14:00:00 | 0 s | CÓ |
| 22:00 (15:00Z) | 7c8fdf82 | 15:00:00 | 0 s | CÓ |
| 23:00 (16:00Z) | fed7edbc | 16:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 13:00Z đã đếm ở đợt 162 — không đếm lại. DR 16:00Z dispatched 6m45s TRƯỚC btime #66 trên boot #65 — daemon boot cũ dispatch bình thường.

### 2.8 Số hiệu reboot + đối chiếu chéo các luồng đợt 163 (chỉ ghi nhận)

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — XÁC NHẬN quyết (o) đợt 161), #63 = 94d22520 (10:30:42Z, giờ thật — XÁC NHẬN quyết (p) đợt 161), #64 = d9a8d1ce (11:15:18Z, giờ thật — XÁC NHẬN quyết (o) đợt 162), #65 = 1c1cf10c (14:34:57Z, giờ thật — T0/T2/T5/T7-163 xác minh độc lập, chờ parent xác nhận), #66 = edb2acdb (16:06:45Z, giờ thật — T7-163 xác minh 8 nguồn, chờ parent xác nhận; đối chiếu độc lập thuộc T0/T2-164).
- KHÔNG có lệch số hiệu đợt này (T0/T1/T2/T5/T6/T7/T8 đều dùng #65; T2 dùng hệ đếm chặt #138?/#139?/#140? cho cùng ba boot — khác hệ aggregate, ghi nhận như F-161-T1-7).
- Đối chiếu chéo (đọc cờ + LIMITS, chỉ ghi nhận — T7 không kiểm lại công việc luồng khác):
  - **T0-163** (cờ ~14:45Z): #65 xác minh 9 nguồn; KHÔNG nghịch lý đồng hồ, KHÔNG OVERLAP #65/#64; reboot sau T10-162 đóng 18'18" — claim T10-162 ĐỨNG; boot #64 chết trong (14:25:21Z, 14:34:57Z]; watcher-162 CHẾT SỚM không ghi log (poll cuối 14:25:20Z, trước btime 9m37s — PHÁT HIỆN MỚI, giao T5-163); POSTBOOT_PASS #65 CHƯA CÓ lúc kiểm lại cuối 14:44:36Z (stale 110 s — xem T5); marker sống qua 17 reboot #49–#65; O8 JSON còn đúng; dpkg.log reset theo boot (1.545 dòng).
  - **T1-163** (cờ 14:57:02Z): verify 162 PASS; đếm khớp lần thứ 55 liên tiếp (đợt 162 = 10 batch / 13 entry / 13 đường dẫn khác nhau / 12 file mới — khớp quyết parent §12.3 aggregate 162; lũy kế 111–162 = 508/937/803; chờ push 136–162 = 260/359/307); **suite 28/28 exit 0 trên boot 1c1cf10c** (14:40:34–14:50:26Z, 9m52s); O8 xác nhận độc lập (chuỗi FULL PASS LÊN 17 theo quyết (g) đợt 162); F-163-T1-4: aggregate 162 §4 ghi n=640, đúng 646; F-163-T1-2: 3 socket X11 mồ côi X193/X194/X195 (mtime 14:46Z) — giao T8-163 dọn; F-163-T1-5: dòng T2 §90 vẫn ghi n 19/20, chưa lên 20/21.
  - **T2-163** (cờ 15:15:34Z): probe #82 ok=2 fail=0 (boot 1c1cf10c, 14:41:28Z); #65 xác nhận độc lập (F126? −0,346…+0,309 s đủ 3 server; drift 1,0016); mù #95? (#63) MỞ — điều tra đầy đủ (P file 1.297 s / union-A 1.297 s / union-B 1.227 s; Q file 843 s / union-A 616 s / union-B 591 s — ĐÓNG); mù #94? MỞ; #88?/#77? VẪN MỞ; CERT/FULL chính thức GIỮ 76/91 (ứng viên CERT95/FULL110); INSIDE #64 INSIDE dải FULL110 → chuỗi 1 LÊN 2; #65 NGOÀI dải FULL111 → chuỗi 2 KẾT THÚC, chuỗi mới từ #65; (m) #56 không thu hẹp lần thứ sáu; (m) #65 KHÔNG PHẢI điểm — đối chiếu khớp T7; POSTBOOT_PASS #65 ĐÃ CÓ 14:45:05Z; WFS #69 chênh 0; birefnet 0 thử lần thứ 17.
  - **T4-163** (cờ 15:34:22Z): lượt yên #32 CÓ lượt hợp lệ #28 (attempt2 ĐẠT, tickCost median 53,0 ms; attempt1 trượt 62,0 ms > 60, retry theo quyết (h) đợt 149 đã cứu lượt); cộng dồn mới (28 lượt hợp lệ): P1 107/110, P2 101/101, P3-A1 91/110, P3' 74/82 occ = 69/73 distinct-seq, P7 62/62; HELPER distinct-seq ĐÃ VÁ (quyết (t) đợt 162) — back-test 161→61/65, 162→67/71, live 163→69/73; PHÁT HIỆN cộng dồn ghi nhận 67/74 SAI mẫu số — đúng là 67/71 (cho parent/T10 quyết đính chính); lag≥+5f = 0 occ cả 2 attempt — SẠCH (khác đợt 162: 16 occ); 0 PAGE-WEDGED lần thứ 7 liên tiếp; poller 19 poll thật.
  - **T5-163** (cờ 15:00Z): POSTBOOT_PASS #65 ĐÃ CÓ 14:45:05Z (boot+10m08s, replay-day-du, poll=0; replay khởi động boot+47s — nhanh thứ hai từng đo, sau #59 +35s — PHÁ DỨT chuỗi muộn dần); watcher-162 chết sớm 14:25:20Z (331 poll, 0 END/0 STOP, không có file watcher-stop), chết 9m37s TRƯỚC btime #65 và 4m40s TRƯỚC hạn END — KHÔNG phải chết theo reboot, KHÔNG thoát tự nhiên; nguyên nhân KHÔNG xác định được từ bằng chứng còn lại; khoảng không-watcher 19m43s (14:25:20–14:45:03Z), không mất đo nào; watcher-163 chạy tay 14:45:03Z pid 25133, END 17:30:00Z; cờ T0 "#65 CHƯA CÓ" stale 110 s (cùng mẫu T0-162); marker 17 reboot (KHỚP T0); X11: 3 socket MỚI X193/X194/X195 lúc 14:46:51Z, 0 Xvfb — dọn thuộc T8-163; ENOSPC 11 dòng trên boot #65 lúc 14:48:38Z (T9 đếm chính thức).
  - **T6-163** (cờ ~14:58Z): (A) 120/120 lần thứ 13 liên tiếp (tổng 1560/1560); lock 508 cặp (ACQUIRED 519 / RELEASED 508), 0 giữ; #65 KHÔNG giết holder (lock trống 1h56m26s = 6.986 s trước btime); chuỗi "không giết holder" lên 5 reboot liên tiếp (#61–#65); prune lần 38 (queue 101 → 100); đính chính: 502/491 là kiểm cuối đợt 161, kiểm cuối đợt 162 là 511/500; inotify max_user_watches nay 63.756 (was 63.747).
  - **T8-163** (cờ 16:04:36Z — TRƯỚC btime #66 đúng 129 s): O8 PASS 3/3 qua gate chuẩn cùng-boot #65 (GATE-FOUND poll 54 15:34:48Z; lượt yên #32 CÓ lượt hợp lệ #28, attempt2 20/20, B 5/5, tickCost median 53,0 ms, boot #65; WebKit 21/21 ×2 pid47668 md5 d614173d + pid48104 md5 44d90ffe; Chromium 21/21 pid48557 md5 931baeaf; O8 DONE 15:42:34Z); chuỗi WebKit FULL PASS 17 → ? chờ T10/parent phán; **harness 6/6 PASS, 0 kẹt** (15:42:43–15:58:58Z, 16'15" — 85m4 P4-lần3 PASS lần thứ 5 liên tiếp; 86n2 P4-lần2 PASS, chuỗi verdict 13 → 14; 86n2 P5-entry PASS — điểm kẹt đợt 162 không tái diễn; 84l10 E4 ended=false lần thứ 4 liên tiếp; kẹt cộng dồn GIỮ 14; chuỗi "P3 không kẹt" 0 → 1); watchdog 0 kích hoạt, 0 false-positive; live-diag 0 kích hoạt — điểm mù F-158-T8-4 vẫn là giới hạn đứng, chưa được kiểm chứng; RAM sampler n=33, balloon max 91,3% trần, avail min 502 MB @15:54:13Z; CAVEAT: O8 WebKit chạy bằng lib DEBROOT, KHÔNG phải system libs (xem F-163-T8-2); fixture h-30s/g-4s LỆCH md5 (xem F-163-T8-1); checklist (o) xong cả hai symlink; /tmp/.X11-unix/ TRỐNG sau dọn 3 socket X193/X194/X195.
  - **T9-163:** cờ chưa có lúc T7 đóng cờ — T10 thu thập (không phải nợ của T7). Sampler đã chạy lại 16:08 trên boot #66 (sampler.sh + b2-watcher.sh pid 2285/2286).
- Mù đi kèm: #95? (#63) MỞ theo T2-163 (điều tra đầy đủ đợt này); #94? (#62) MỞ theo quyết (b) đợt 162; #88? VẪN MỞ (hole-recheck lần thứ bảy: 345 hit, 0 mốc mới); #77? VẪN MỞ. CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: #64 INSIDE dải FULL110 → chuỗi 1 LÊN 2; #65 NGOÀI dải FULL111 → chuỗi 2 KẾT THÚC, chuỗi mới từ #65 (độ dài 1) (T2-163; T7 chỉ ghi nhận). INSIDE cho #66 giao T2-164. POSTBOOT_PASS #65 ĐÃ CÓ 14:45:05Z (T5-163); POSTBOOT_PASS #63 KHÔNG CÓ, không bù được — boot thứ 7 lọt. Watcher-163 pid 25133 KHÔNG còn trong ps lúc T7 đọc #5 (16:08Z) — chết theo #66 theo suy luận; T5-164 kiểm tra lúc mở. Marker sống qua 17 reboot #49–#65 (T0/T5-163 khớp nhau).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 162/163 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1: phụ lục chỉ viết bằng script, không gõ tay). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 16:07:30.460Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này: run 162/163 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 162/163 ở khung thật; btime #65/#66 xác minh giờ thật nhiều bên độc lập (T0/T2/T7 + Cloudflare); spanning #65 = 0 không phụ thuộc khung giờ (run 162 finished thật trước btime, run 163 started sau btime); spanning #66 = 0 là ARTIFACT viết-lại-tự-loại — verdict DƯƠNG dựa trên EVENTS, không dựa trên spanning (xem §2.6).
4. Cửa kiểm đợt này ~2h07' (14:00Z → 16:47Z 21/11), đủ 6 slot HB + 3 slot DR + run vcut 162 (kết cục) và 163 (theo dõi + viết lại #66). Bảy lần đọc DB đầy đủ; run 162 được đọc đầy đủ 7 lần khớp hoàn toàn nhau ở mọi trường; run 163 được đọc đầy đủ 7 lần (started_at đổi đúng 1 lần tại #66, các trường khác không đổi); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (DR 16:00Z: chưa dispatch lúc đọc #4 15:58Z — đọc #5 xác nhận có, không kết luận thiếu vội).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 13:50:50Z + DR 13:00Z thuộc cửa 162 theo quy ước đứng (T7-162 đã đếm); slot DR 14:00Z + HB 14:20:50Z thuộc cửa 163 (sau kiểm cuối T7-162 lúc 13:56Z). HB 17:20:50Z + DR 17:00Z thuộc cửa T7-164.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #4, 1500 s, spawn 15:59:29Z, chết sau 466 s ~16:07:15Z, 30 s sau btime #66 — killer là reboot #66 + recovery sau reboot, xem F-163-T7-1). 5/6 sleep hoàn thành: 3× 1.500 s + 900 s + 1.300 s; ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2 đã áp dụng). Boot đổi 1 lần trong phiên (1c1cf10c → edb2acdb tại #66).
7. T7 đóng cờ ~16:52Z — trong hạn cờ ~17:00Z (~8' còn), trong hạn cứng toàn đợt 17:30Z (~38' còn). Run 163 vẫn running lúc đóng cờ — kết cục thuộc T7-164 (hạn ngân sách 17:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix163.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 162, cùng phương pháp)

- Heartbeat: 44/363 → **44/369 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 23:50:50 +07). Kiểm toán cửa sổ: 363 + 6 slot mới = 369 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 49/252 → **49/255 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 23:00 +07). Kiểm toán: 252 + 3 = 255 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/369 = 11,9% (giảm từ 12,1% — 0 thiếu mới); DR 49/255 = 19,2% (giảm từ 19,4% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ hai liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 162: SUCCEEDED theo hồ sơ daemon (wall 9.735 s, margin 1.065 s)** — 7 lần đọc DB đầy đủ khớp nhau + events đầy đủ (2 event, 0 event sau succeeded eid 9754). Margin hẹp hơn 161 đúng 387 s (161: 1.452 s); 0 lần viết lại (chuỗi: 160: 0, 161: 1, 162: 0).
2. **Run 162 KHÔNG bị reboot #65 giết** (finished 14:18:06Z, 1.011 s TRƯỚC btime #65) — btime #65 chỉ sớm hơn hạn run 162 đúng 54 s theo nghĩa giả định; T7 ghi rõ cả hai mặt, không thổi phồng "suýt" thành "giết". T10-162 đóng sổ 14:16:39Z — run 162 finish 87 s SAU khi T10 đóng (T10 ghi "chưa có kết cục" ĐÚNG lúc đóng).
3. **Reboot #65 (btime 14:34:57Z, boot 1c1cf10c): GIỮA HAI ĐỢT, giờ thật, KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài.** Gap #64→#65 = 11.979 s — DÀI NHẤT chuỗi gần đây. Reboot xảy ra SAU T10-162 đóng sổ 1.098 s — claim T10-162 ĐỨNG. Số hiệu #65 theo đếm tuần tự — chờ parent xác nhận.
4. **Điểm (m) #65: KHÔNG PHẢI ĐIỂM (m)** — 0 run đang chạy tại btime, 0 requeue (chữ ký #52/#61/#64); T7 lean KHÔNG ĐỔI từ đọc #1; T2-163 xác minh độc lập KHỚP. N ứng viên GIỮ 20/21; n chính thức (ứng viên) GIỮ 14; dải GIỮ 33–49,8 s; điều tra (m) VẪN ĐÓNG.
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-163 không thu hẹp được cửa lần thứ sáu: R 2,56251–2,66817 / J 2,566–2,80753 s) — chờ parent chốt J (quyết (d)/(e) đợt 162 vẫn đứng).
6. **Reboot #66 (btime 16:06:45Z, boot edb2acdb): TRONG ĐỢT, giờ thật, VIẾT LẠI run 163 lần 1 — requeue btime +45,460 s, TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m), chờ parent quyết.** Spanning btime #66 = 0 dòng là ARTIFACT viết-lại-tự-loại (không phải bằng chứng "0 run đang chạy") — verdict dựa trên EVENTS. Đối chiếu độc lập thuộc T2-164. Nếu CHẤP NHẬN: n ứng viên 20→21 (nhánh khuyến nghị) hoặc 21→22 (nhánh #56 ÂM); n chính thức GIỮ 14. Số hiệu #66 theo đếm tuần tự — chờ parent xác nhận.
7. **Cửa slot: HB 6/6 + DR 3/3, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN (đợt thứ hai liên tiếp).** Lũy kế: HB 44/369, DR 49/255. Muộn HB lũy kế GIỮ 9. Jitter run vcut 0 s lần thứ 16 liên tiếp.
8. **Run 163 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 7.885 s, còn 2.915 s tới hạn ngân sách 17:35:51Z; 1 lần viết lại tại #66) — kết cục thuộc T7-164.
9. **T9-163 chưa đóng lúc T7 đóng cờ (~16:47Z)** — T10 thu thập (không phải nợ của T7). T8-163 đã đóng 16:04:36Z (TRƯỚC btime #66 đúng 129 s): O8 PASS 3/3 (chuỗi FULL PASS 17 → ? chờ T10/parent phán) + harness 6/6, 0 kẹt (kẹt cộng dồn GIỮ 14; chuỗi "P3 không kẹt" 0 → 1; CAVEAT: O8 WebKit chạy bằng lib DEBROOT, không phải system libs — xem F-163-T8-2).
10. **Mù #95? (#63) MỞ theo T2-163** (P file 1.297 s / union-A 1.297 s / union-B 1.227 s — mọi cách đếm đều vượt sàn; Q ĐÓNG) — chờ quyết parent. **Mù #94? (#62) MỞ** theo quyết (b) đợt 162. **Mù #88? VẪN MỞ** (hole-recheck lần thứ bảy: 345 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110.
11. **INSIDE #64: INSIDE dải FULL110 → chuỗi 1 LÊN 2; INSIDE #65: NGOÀI dải FULL111 → chuỗi 2 KẾT THÚC, chuỗi mới từ #65 (độ dài 1)** (T2-163; T7 chỉ ghi nhận). INSIDE cho #66 giao T2-164.
12. **POSTBOOT_PASS #65 ĐÃ CÓ 14:45:05Z (T5-163)** — replay khởi động boot+47s, PHÁ DỨT chuỗi muộn dần (#62 +22m10s thật). **POSTBOOT_PASS #63 KHÔNG CÓ, không bù được** — boot thứ 7 lọt. Marker sống qua 17 reboot #49–#65 (T0/T5-163 khớp nhau). Watcher-162 CHẾT SỚM không ghi log (poll cuối 14:25:20Z — PHÁT HIỆN MỚI, T5-163 điều tra tới giới hạn bằng chứng, nguyên nhân KHÔNG xác định được). Watcher-163 pid 25133 không còn trong ps lúc T7 đọc #5 — chết theo #66 theo suy luận; T5-164 kiểm tra lúc mở.
13. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T2-163: 0 thử lần thứ 17 liên tiếp). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-163-T7-1 — Sleep #4 bị SIGTERM giết bởi reboot #66 (không phải lỗi tính toán, là sự cố phiên):** sleep 1500 s spawn 15:59:29Z bị SIGTERM sau 466 s (~16:07:15Z, 30 s sau btime #66, trong lúc daemon recovery — requeue run 163 lúc 16:07:30Z). Killer: reboot #66 + quá trình recovery sau reboot. Đây là sleep đầu tiên bị giết kể từ đợt 161 (đợt 162: 0 sleep bị giết). 5/6 sleep hoàn thành (3× 1500 s + 900 s + 1300 s). Không ảnh hưởng verdict nào (đọc #5 dùng exec trực tiếp sau khi sleep chết; các đọc DB #5–#7 đầy đủ, khớp nhau).
- **F-163-T7-0 — Không có sai số tính toán nào khác trong đợt này:** mọi phép trừ epoch/giờ trong LIMITS đều qua script appendix163.py từ epoch thô (bài học F-162-T7-1 đã áp dụng — script chạy ra appendix163.txt, đối chiếu khớp từng số); tên event lọc đúng `requeued_after_restart` ngay lần đầu (bài học F-162-T7-2 đã áp dụng); kiểm boot_id SAU khi đọc started_at ở mọi lần đọc (bài học F-142-T7-1 đã áp dụng); kết cục run 162 có 7 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 14:18:06.540Z, eid 9754), không suy đoán sau; btime #65/#66 xác minh 8 nguồn mỗi boot + Cloudflare 2 lần trong phiên (lúc mở chênh 1 s, lúc đóng chênh 1 s — đồng hồ boot mới đúng giờ thật); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng); lean (m) #65 KHÔNG ĐỔI từ đọc #1 và lean (m) #66 DƯƠNG ứng viên KHÔNG ĐỔI từ đọc #5 (bằng chứng đầy đủ ngay từ đầu — khác #62 đợt 161, xem F-161-T7-1); caveat spanning #66 (viết-lại-tự-loại) được ghi rõ trong LIMITS, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round163-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t7/NOTES.md` + `appendix163.py` + `appendix163.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round163-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix163.py` từ epoch thô — xem file `appendix163.txt` trong round163-t7)

### Phu luc A — Run 162 (ket cuc SUCCEEDED, T7-163)
- sched 1795260951 = 2026-11-21T11:35:51Z; started 1795260951 = 2026-11-21T11:35:51Z (jitter 0 s)
- finished 1795270686 = 2026-11-21T14:18:06Z; status succeeded; attempt 1; error null; timed_out false
- claimed 1795270675 = 2026-11-21T14:17:55Z (finished - 11 s)
- wall tu started GOC: 1795270686 - 1795260951 = 9735 s (2h42m15s)
- han ngan sach: 1795271751 = 2026-11-21T14:35:51Z; margin: 1795271751 - 1795270686 = 1065 s (0h17m45s)
- KHONG co event nao cho run 162 sau succeeded 14:18:06.540Z (eid 9754); tong 2 event
- Margin 1065 s < 161: 1452 s — hep hon 387 s; xep thu 9/13 trong chuoi tu dot 150; hep nhat trong 4 dot gan nhat 159-162

### Phu luc B — Reboot #64 / #65 / #66
- #64: btime 1795259718 = 2026-11-21T11:15:18Z, boot d9a8d1ce
- #65: btime 1795271697 = 2026-11-21T14:34:57Z, boot 1c1cf10c
- #66: btime 1795277205 = 2026-11-21T16:06:45Z, boot edb2acdb
- gap #64->#65 (btime-btime): 1795271697 - 1795259718 = 11979 s (3h19m39s) — DAI NHAT chuoi gan day
- gap #65->#66 (btime-btime): 1795277205 - 1795271697 = 5508 s (1h31m48s)
- finished run 162 TRUOC btime #65: 1795271697 - 1795270686 = 1011 s (0h16m51s) truoc
- btime #65 so voi han run 162: 1795271697 - 1795271751 = -54 s (truoc han 54 s)
- T10-162 dong 1795270599 = 2026-11-21T14:16:39Z; run 162 finish SAU khi T10 dong: 1795270686 - 1795270599 = 87 s
- btime #65 SAU khi T10-162 dong: 1795271697 - 1795270599 = 1098 s (0h18m18s)
- T8-163 dong 1795277076 = 2026-11-21T16:04:36Z; btime #66 SAU khi T8 dong: 1795277205 - 1795277076 = 129 s

### Phu luc C — Run 163 (van running luc dong co T7-163, 1 lan viet lai tai #66)
- sched 1795271751 = 2026-11-21T14:35:51Z; started GOC 1795271751 = 2026-11-21T14:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #66 1795277250 = 2026-11-21T16:07:30Z (requeue 16:07:30.460Z = btime + 45,460 s)
- requeue delta (event created_at - btime): 1795277250.460 - 1795277205 = 45,460 s — TRONG dai 33-49,8 s
- claimed 1795271751 = 2026-11-21T14:35:51Z (started goc + 0 s; KHONG DOI sau viet lai)
- han ngan sach (started goc + 10800): 1795282551 = 2026-11-21T17:35:51Z (ket cuc thuoc T7-164)
- events run 163: 4 event (dispatched 14:35:51.145Z eid 9756 + requeued 16:07:30.460Z eid 9781 + dispatched 16:07:30.540Z eid 9782 + reattached 16:07:30.708Z eid 9783)
- doc #1 14:40:04Z: tuoi goc 253 s; con 10547 s toi han
- doc #2 15:06:25Z: tuoi goc 1834 s; con 8966 s toi han
- doc #3 15:32:50Z: tuoi goc 3419 s; con 7381 s toi han
- doc #4 15:58:40Z: tuoi goc 4969 s; con 5831 s toi han
- doc #5 16:08:32Z: tuoi goc 5561 s; con 5239 s toi han
- doc #6 16:25:06Z: tuoi goc 6555 s; con 4245 s toi han
- doc #7 16:47:16Z: tuoi goc 7885 s; con 2915 s toi han
- requeue cua RONG 16:06:45-16:47:00Z (moi job): dung 1 dong — requeue run 163 (eid 9781)
- spanning btime #66: 0 dong — ARTIFACT viet-lai-tu-loai (run 163 started_at da viet lai thanh sau btime)

### Phu luc D — Slot HB/DR cua T7-163 (doc #1-#7, 14:40Z-16:47Z)
- HB sched 2026-11-21T14:20:50Z: started 2026-11-21T14:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T14:50:50Z: started 2026-11-21T14:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T15:20:50Z: started 2026-11-21T15:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T15:50:50Z: started 2026-11-21T15:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T16:20:50Z: started 2026-11-21T16:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T16:50:50Z: started 2026-11-21T16:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-21T14:00:00Z: started 2026-11-21T14:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T15:00:00Z: started 2026-11-21T15:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T16:00:00Z: started 2026-11-21T16:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (toan -316 s; 0 muon, 0 thieu), DR 3/3 (toan 0 s; 0 thieu) — CUA LANH
- Luy ke: HB 44/363 -> 44/369 (so thieu +0); DR 49/252 -> 49/255 (so thieu +0)
- Ti le thieu: HB 11,9%; DR 19,2%
- Muon HB luy ke: GIU 9 (+887 s x6, +889 s, +891 s, +888 s dot 161; 0 muon moi dot 163)

### Phu luc E — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #38 AM; #39 DUONG (+40,799 s); #41 DUONG (+44,994 s); #42 DUONG (+33,236 s)
- #44 DUONG (+40,640 s); #45 AM ung vien (run 152 dang chay, 0 requeue); #46 DUONG (+48,375 s)
- #47 DUONG (+33,566 s) — viet lai lan 2 run 153
- #49 DUONG (+42,981 s) — viet lai run 154
- #50 DUONG (+49,761 s) — viet lai run 155 — VUOT max cu 48,375 s; dai moi (ung vien) 33-49,8 s
- #51 DUONG (+39,522 s) — viet lai run 155 lan 2
- #52 KHONG PHAI diem du lieu (0 run dang chay tai btime 17:19:09Z)
- #53 DUONG (+41,111 s) — viet lai run 156 lan 1
- #54 DUONG (+39,649 s) — viet lai run 156 lan 2
- #55 DUONG (+34,916 s) — viet lai run 156 lan 3
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 + T2-159 + T2-160 + T2-161 + T2-162 + T2-163 KHONG thu hep duoc cua: R 2,56251-2,66817 s / J 2,566-2,80753 s — lan thu SAU)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — viet lai run 157 lan 2; TINH BANG GIO THAT
- #59 DUONG (+35,173 s) — viet lai run 158 lan 1; TINH BANG GIO THAT
- #60 DUONG (+46,642 s) — CHAP NHAN (quyet (f) dot 159); viet lai run 159 lan 1; TINH BANG GIO THAT
- #61 KHONG PHAI diem du lieu (T7-160: 0 run dang chay tai btime 05:25:49Z; 0 requeue trong cua 05:25:49-05:35:51Z) — cung mau #52
- #62 AM — CHAP NHAN (quyet (s) dot 161): run 160 dang chay tai btime 07:59:29Z (that), 0 requeue — chu ky nhu #45; overlap 824-854 s la co che giai thich
- #63 DUONG — CHAP NHAN (quyet (t) dot 161): viet lai run 161 lan 1, requeue 10:31:19.128Z = btime + 37,128 s — TRONG dai 33-49,8 s
- #64 KHONG PHAI diem du lieu (T7-162 + T2-162 doi chieu khop; quyet (f) dot 162): 0 run dang chay tai btime 11:15:18Z (run 161 finished 11:11:39Z, 219 s truoc btime; run 162 started 11:35:51Z, sau btime); 0 requeue trong cua 11:15:18-11:35:51Z — cung mau #52/#61
- #65 KHONG PHAI diem du lieu (T7-163 + T2-163 doi chieu khop): 0 run dang chay tai btime 14:34:57Z (run 162 finished 14:18:06Z, 1011 s truoc btime; run 163 started 14:35:51Z, sau btime); 0 requeue trong cua 14:34:57-14:35:51Z — cung mau #52/#61/#64
- #66 DUONG UNG VIEN (T7-163; cho parent quyet; doi chieu doc lap thuoc T2-164): viet lai run 163 lan 1, requeue 16:07:30.460Z = btime + 45,460 s — TRONG dai 33-49,8 s
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet #56
- n ung vien = 20 (17 duong + 3 am, nhanh khuyen nghi) hoac 21 (17 duong + 4 am, nhanh #56 AM) — GIU (chua cong #66; neu CHAP NHAN #66 DUONG: 21 hoac 22)
- Dai requeue duong ung vien GIU 33-49,8 s (#66 +45,460 s nam trong dai, khong mo rong dai)
- LUU Y SO HIEU: 348dab54=#56; bcbaa3ad=#57; 28366bd0=#58; eec65561=#59; e590ae0a=#60; 52c957d5=#61; 39d46ba0=#62 (XAC NHAN quyet (o) dot 161); 94d22520=#63 (XAC NHAN quyet (p) dot 161); d9a8d1ce=#64 (XAC NHAN quyet (o) dot 162); 1c1cf10c=#65 (T0/T2/T5/T7-163 xac minh doc lap — cho parent xac nhan); edb2acdb=#66 (T7-163 xac minh 8 nguon — cho parent xac nhan)
