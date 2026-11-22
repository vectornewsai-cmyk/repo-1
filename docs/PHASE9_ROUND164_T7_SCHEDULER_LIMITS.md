# PHASE9 ROUND164 T7 — RUN 163 SUCCEEDED (wall 9.742 s, margin 1.058 s; 1 LẦN VIẾT LẠI TẠI #66; KHÔNG BỊ #67 GIẾT) + REBOOT #68 TRONG ĐỢT (VIẾT LẠI RUN 164 LẦN 1, REQUEUE +47,131 s — ỨNG VIÊN DƯƠNG (m)) + CỬA SLOT 6/6 + 3/3 (0 MUỘN, 0 THIẾU)

- **Luồng:** T7 đợt 164 (lượt cron 00:35 +07 22/11/2026 = 17:35:51Z 21/11). Nhiệm vụ theo brief T7-164: (1) kết cục run 163 — run này vẫn `running` lúc T7-163 đóng cờ (~16:47Z, tuổi gốc 7.885 s, còn 2.915 s tới hạn 17:35:51Z); boot mới ứng viên #67 btime 17:33:27Z — 144 s TRƯỚC hạn run 163; (2) điểm (m): #66 đã CHẤP NHẬN DƯƠNG theo quyết (e) đợt 163, #56 VẪN CÓ ĐIỀU KIỆN, n ứng viên 21/22 — đánh giá #67 có phải điểm (m) ứng viên không (phối hợp T2); (3) run 164 hiện trạng lúc đóng cờ; (4) cửa slot HB/DR + lũy kế mới; (5) LIMITS trung thực, phụ lục bằng script. Phát hiện thêm trong phiên: **reboot #68 TRONG đợt (btime 18:06:30Z) viết lại run 164 lần 1, requeue btime +47,131 s — ứng viên DƯƠNG (m)** (xem §2.5–2.6).
- **Boot trong phiên:** mở phiên là **f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f** (btime /proc/stat 1795282407 = 17:33:27Z — **reboot #67 ứng viên, GIỜ THẬT**; T0-164 + T2-164 + T5-164 xác minh độc lập); **reboot #68 TRONG phiên** lúc 18:06:30Z (boot **0c8a94aa-d742-4d81-b661-ff4b9805831d**, btime 1795284390 = 18:06:30Z — **GIỜ THẬT**, T7 xác minh 9 nguồn); boot lúc đóng cờ vẫn 0c8a94aa (KHÔNG reboot mới sau #68).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 163/164 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 163 §12.3 (quyết parent (e)/(f)/(p)/(w)), LIMITS T7-163 + NOTES round163-t7, cờ round164-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 163 kết cục? | **`succeeded`** 17:18:13Z (event 17:18:13.605Z, eid 9799), wall từ started gốc **9.742 s**, margin **1.058 s** (17m38s) tới hạn 17:35:51Z | §2.1, Phụ lục A |
| Run 163 có bị #67 giết không? | **KHÔNG — finished 914 s TRƯỚC btime #67.** btime #67 chỉ sớm hơn hạn run 163 đúng 144 s (suýt soát theo nghĩa giả định) | §2.1, §2.2 |
| Run 163 mấy lần viết lại? | **1 lần** (tại #66) — started_at viết lại 16:07:30Z; events đúng 5 (dispatched + requeued + dispatched + reattached + succeeded), 0 event sau succeeded | §2.1 |
| Reboot #67 có tạo điểm (m) mới không? | **KHÔNG PHẢI ĐIỂM (m)** — 0 run đang chạy tại btime, 0 requeue — chữ ký đúng #52/#61/#64/#65; T2-164 xác minh độc lập KHỚP T7 | §2.3 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-164 KHÔNG thu hẹp được cửa LẦN THỨ BẢY**; R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) GIỮ 14** theo quyết (g) đợt 156. N ứng viên **21 (18 dương + 3 âm, nhánh khuyến nghị) hoặc 22 (18 dương + 4 âm, nhánh #56 ÂM)** — SAU quyết (e) đợt 163 chấp nhận #66 DƯƠNG; chưa cộng #68 (chờ parent quyết) | §2.4, §2.6, Phụ lục E |
| Reboot #68 (trong đợt)? | **VIẾT LẠI run 164 lần 1** — requeue 18:07:17.131Z = **btime +47,131 s, TRONG dải 33–49,8 s** → **ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-165) | §2.5, §2.6 |
| Cửa slot đợt 164? | **HB 6/6 (toàn −316 s), DR 3/3 (toàn 0 s), 0 thiếu, 0 muộn** — cửa LÀNH HOÀN TOÀN (đợt thứ ba liên tiếp) | §2.7 |
| Run 164? | **Jitter 0 s** (lần thứ 17 liên tiếp), **1 lần viết lại (tại #68)**, **vẫn `running` lúc đóng cờ** (~19:50Z, tuổi gốc 8.072 s, còn 2.728 s tới hạn 20:35:51Z). Kết cục thuộc T7-165 | §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–163): heartbeat **44/375 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/258 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 163 — SUCCEEDED, margin 1.058 s (7 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp)

Run 163 (`3f169faa-6a18-4615-b8ea-ac42d02d4e7c`, sched 1795271751 = 14:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795271751 = 14:35:51Z 21/11 |
| started_at (gốc) | 1795271751 = 14:35:51Z — jitter 0 s |
| started_at sau viết lại lần 1 (#66) | 1795277250 = 16:07:30Z |
| finished_at_utc | 1795281493 = 17:18:13Z (event `succeeded` 17:18:13.605Z, eid 9799) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795281485 = 17:18:05Z (finished − 8 s) |
| Wall từ started gốc | 1795281493 − 1795271751 = **9.742 s** (2h42m22s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795282551 = 17:35:51Z — finished TRƯỚC hạn **1.058 s** (17m38s) |
| Finished trước btime #67 | 1795282407 − 1795281493 = 914 s (15m14s) |

- Events run 163 (đầy đủ, 5 event, không thiếu, không thêm sau succeeded): `dispatched` 14:35:51.145Z (eid 9756, detail "scheduled") + `requeued_after_restart` 16:07:30.460Z (9781, detail "daemon startup recovery") + `dispatched` 16:07:30.540Z (9782, detail "scheduled") + `reattached_after_restart` 16:07:30.708Z (9783, detail "execute turn already complete (model-output evidence)") + **`succeeded` 17:18:13.605Z (9799)**. **KHÔNG có event nào cho run 163 sau 17:18:13Z** (kiểm lại ở đọc cuối #7: 0 event mới sau eid 9799; 1 lần viết lại duy nhất tại #66 xác nhận bằng events).
- 7 lần đọc DB đầy đủ trong phiên khớp nhau ở mọi trường (đọc #1 ~17:40Z, #2 ~18:06Z, #3 ~18:07Z, #4 ~18:33Z, #5 ~18:59Z, #6 ~19:25Z, #7 ~19:50Z — đọc #1 xác nhận kết cục; các đọc sau xác nhận không đổi). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: 1.452 s; 162: 1.065 s; 163: **1.058 s** — hẹp hơn 162 đúng 7 s, xếp thứ 10/14 trong chuỗi từ đợt 150, và là margin hẹp nhất trong 5 đợt gần nhất 159–163. T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 163 claimed 17:18:05Z (finished − **8 s**) — bằng 155 (8 s), trong họ 6–11 s của run 154 (7 s) / 158 (10 s) / 160 (7 s) / 161 (6 s) / 162 (11 s). T7 ghi đúng 8 s, không làm tròn. Claimed_at KHÔNG đổi lần nào trong 7 lần đọc.
- **T10-163 đóng sổ 17:16:37Z — run 163 finish 96 s SAU khi T10 đóng** (17:18:13Z). Claim "run 163 chưa có kết cục" của T10-163 ĐÚNG lúc đóng (cùng mẫu run 161: finish 44 s sau T10-161 đóng; run 162: 87 s sau T10-162 đóng).
- **Run 163 bị 1 lần viết lại** — chuỗi run bị viết lại: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (1), 162 (0), 163 (**1 lần**).

### 2.2 Reboot #67 (btime 17:33:27Z) — GIỮA HAI ĐỢT, GIỜ THẬT, KHÔNG NGHỊCH LÝ ĐỒNG HỒ, KHÔNG OVERLAP DÀI

- **Reboot #67: boot f1d4ce1a-8d26-41ae-a40d-bfcc4696f74f, btime 1795282407 = 17:33:27Z 21/11.** Xác minh T7 (lúc mở + đọc #1 + đọc #7): boot_id + btime + `uptime -s` 17:33:27Z (khớp) + /proc/1 mtime 17:33:40.945Z (+13,945 s) + journal idx 0 duy nhất, first entry 17:33:41Z (+14 s) + wtmp begins 17:33:41Z (+14 s) + `last` reboot 17:33 still running. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 17:39:42 vs 17:39:42 (chênh 0 s, lúc mở), 19:50:25 vs 19:50:24 (chênh 1 s, lúc đóng) — hai lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1).
- **Gap #66→#67 (btime−btime): 1795282407 − 1795277205 = 5.202 s (1h26m42s).**
- **#67 xảy ra SAU khi T10-163 đóng sổ 1.010 s (16m50s)** (đóng 17:16:37Z → btime 17:33:27Z) và TRƯỚC khi đợt 164 mở (17:35:51Z). Claim "KHÔNG reboot mới trong lúc T10-163 đóng sổ" của T10-163 **ĐỨNG** — khác #62 (F-161-T1-1: #62 rơi vào lúc T10-160 đóng sổ). T0-164 xác nhận độc lập cùng kết luận (9 nguồn).
- **0 requeue do #67:** cửa 17:33:27–17:40:00Z (mọi job, event `requeued_after_restart`): 0 dòng. (Tên event đúng ngay lần đầu — bài học F-162-T7-2 đã áp dụng.)
- **0 run đang chạy tại btime #67:** truy vấn spanning btime 1795282407: 0 dòng. Run 163 finished 17:18:13Z (914 s TRƯỚC btime); run 164 started 17:35:51Z (sau btime 144 s); HB 17:20:50Z started 17:15:34Z finished cùng giây (trước btime); DR 17:00Z finished 17:00:00Z (trước btime). **KHÔNG dính caveat viết-lại-tự-loại:** run 163 finished thật trước btime dù started_at đã viết lại 1 lần tại #66 (viết lại xảy ra TRƯỚC btime #67, finished ghi sau viết lại); run 164 started sau btime — spanning = 0 là kết quả thật, không phải artifact.
- **KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài tại #67** (T0-164 9 nguồn + T2-164 + T7 Cloudflare 0 s / 1 s — ba bên độc lập, khớp nhau): không có nội dung boot cũ nào đóng dấu sau btime #67 (run 163 succeed 17:18:13Z trước btime 15'14", 0 event sau; boot #66 chết trong (17:16:37Z, 17:33:27Z] theo suy luận từ T10-163 đóng — T0-164 xác minh; watcher-163 chết theo #66 — xem §2.8). Overlap #67 (nếu có) không đo được và không cần thiết cho verdict — không có nghịch lý nào để giải thích (khác #62: có nghịch lý 824 s cần OVERLAP giải thích).
- **btime #67 chỉ sớm hơn hạn run 163 đúng 144 s** (17:33:27Z vs 17:35:51Z) — suýt soát theo nghĩa giả định: nếu run 163 còn chạy tới 17:33:27Z thì đã bị giết chỉ 144 s trước hạn. Nhưng run 163 đã finish trước đó 914 s nên đây KHÔNG phải vụ giết. T7 ghi rõ cả hai mặt, không thổi phồng "suýt" thành "giết".
- **Số hiệu #67 theo đếm tuần tự** — chờ parent xác nhận (T0/T2/T5/T7-164 xác minh độc lập; T1-164 chạy suite 28/28 trên boot này; T5-164 POSTBOOT_PASS #67 đã có 17:54:38Z).

### 2.3 Điểm (m) #67 — KHÔNG PHẢI ĐIỂM (T7 lean KHÔNG ĐỔI từ đọc #1; T2-164 xác minh độc lập KHỚP)

- Chữ ký hình thức: 0 run đang chạy tại btime thật 17:33:27Z, 0 requeue trong cửa 17:33:27–17:40:00Z — **giống hệt #52, #61, #64 và #65** (0 run đang chạy → không phải điểm dữ liệu). Khác #62 (1 run đang chạy tại btime → ứng viên điểm ÂM, đã CHẤP NHẬN theo quyết (s) đợt 161), #63 (viết lại run 161, requeue +37,128 s → điểm DƯƠNG, đã CHẤP NHẬN theo quyết (t) đợt 161), #66 (viết lại run 163, requeue +45,460 s → điểm DƯƠNG, đã CHẤP NHẬN theo quyết (e) đợt 163) và #68 (viết lại run 164, requeue +47,131 s → ứng viên DƯƠNG, xem §2.6).
- **Lean của T7 — KHÔNG ĐỔI từ đọc #1 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #1 (finished-trước-btime là dứt khoát: run 163 finished 17:18:13Z, 914 s trước btime; spanning 0 dòng; requeue 0 dòng) nên T7 kết luận "KHÔNG PHẢI điểm" từ đọc #1 và GIỮ NGUYÊN qua 7 lần đọc — không có lean nháp ngược như #62 đợt 161 (F-161-T7-1). T2-164 đối chiếu độc lập: **"(m) #67 KHÔNG PHẢI điểm"** (cờ T2-164, mtime 18:10:36Z). Hai bên thống nhất ngay từ đầu, không có phân kỳ để T10 phán.
- **T7 KHÔNG tự đổi n** (điều tra đã đóng): n ứng viên **21 (18 dương + 3 âm, nhánh khuyến nghị) hoặc 22 (18 dương + 4 âm, nhánh #56 ÂM)** — SAU quyết (e) đợt 163 chấp nhận #66 DƯƠNG; #67 KHÔNG cộng (không phải điểm). #68 chưa cộng — chờ parent quyết (xem §2.6).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-164 KHÔNG thu hẹp được cửa LẦN THỨ BẢY

- T2-164 DONE (cờ mtime 18:10:36Z): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ BẢY** (xem cờ T2-164; T7 không kiểm lại hướng điều tra); cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n chính thức (ứng viên) GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 + quyết (d)/(e) đợt 161 + quyết (f) đợt 162 + quyết (f) đợt 163** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 21 (nhánh khuyến nghị, chưa cộng #68); nếu J < 2.807 s → #56 là điểm ÂM → n = 22 (chưa cộng #68). Quyết (d) đợt 159 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-164 thêm: mù **#96? (#64) SƠ BỘ MỞ** (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — đều vượt sàn 1.147 s; S/T đóng) — điều tra đầy đủ giao T2-165; mù **#95? (#63) MỞ** (quyết (b) đợt 163); mù **#94? (#62) MỞ** (quyết (b) đợt 162); mù **#88? VẪN MỞ** (hole-recheck lần thứ tám: 345 hit, 0 mốc mới); mù **#77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110 (gap #63 = 9.073 s). INSIDE: **#66 INSIDE dải FULL112** [15:01:01Z, 17:01:56Z] neo 14:34:57Z (biên dưới 3.944 s, biên trên 3.311 s) → chuỗi 1 (từ #65) LÊN 2; **#67 INSIDE dải FULL113** [16:32:51Z, 18:33:36Z] neo 16:06:45Z (biên dưới 3.636 s, biên trên 3.609 s) → chuỗi 2 LÊN 3 (cả hai dải CÓ ĐIỀU KIỆN — gap #65/#66 danh nghĩa, chưa vào CERT/FULL chính thức). T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.

### 2.5 Run 164 + reboot #68 (btime 18:06:30Z, TRONG đợt) — VIẾT LẠI LẦN 1, requeue +47,131 s

Run 164 (`0a5f9bc9-c4f4-4d68-96c7-f0baa5455606`, sched 1795282551 = 17:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795282551 | 17:35:51Z 21/11 |
| started_at GỐC | 1795282551 | 17:35:51Z — **jitter 0 s** |
| started_at sau viết lại lần 1 (#68) | 1795284437 | 18:07:17Z |
| worker_claimed_at (KHÔNG ĐỔI) | 1795282551 | 17:35:51Z (started gốc + 0 s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795293351 | 20:35:51Z 21/11 |

- 7 lần đọc DB đầy đủ trong phiên: đọc #1–#2 (17:40Z–18:06Z) run 164 `running`, started_at 1795282551 không đổi; đọc #3 (~18:07Z, SAU reboot #68) started_at ĐÃ ĐỔI thành 1795284437; đọc #4–#7 (18:33Z–19:50Z) started_at KHÔNG đổi lần nữa, claimed_at KHÔNG đổi lần nào. **1 lần viết lại duy nhất (tại #68), KHÔNG viết lại lần 2.** Attempt 1; error_text null; worker_execution_timed_out false.
- Events run 164 (đầy đủ, 4 event, 0 event mới sau reattach eid 9813 ở đọc #7): `dispatched` 17:35:51.168Z (eid 9801, detail "scheduled") + **`requeued_after_restart` 18:07:17.131Z (9811, detail "daemon startup recovery")** + `dispatched` 18:07:17.283Z (9812, detail "scheduled") + **`reattached_after_restart` 18:07:17.410Z (9813, detail "execute turn already complete (model-output evidence)")**.
- **Reboot #68: boot 0c8a94aa-d742-4d81-b661-ff4b9805831d, btime 1795284390 = 18:06:30Z 21/11.** Xác minh T7 (đọc #3 + đọc #7): boot_id + btime + `uptime -s` 18:06:30Z (khớp) + /proc/1 mtime 18:06:46.171Z (+16,171 s) + journal idx 0 duy nhất, first entry 18:06:46Z (+16 s) + wtmp begins 18:06:46Z (+16 s) + `last` reboot 18:06 still running. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local 18:07:46 vs 18:07:45 (chênh 1 s, lúc phát hiện), 19:50:25 vs 19:50:24 (chênh 1 s, lúc đóng) — hai lần trong phiên, đều trong ±1 s.
- **Gap #67→#68 (btime−btime): 1795284390 − 1795282407 = 1.983 s (33m03s) — NGẮN NHẤT trong chuỗi gần đây** (trước đó #63→#64 2.676 s; các gap trước: #61→#62 9.220 s, #62→#63 9.073 s, #63→#64 2.676 s, #64→#65 11.979 s, #65→#66 5.508 s, #66→#67 5.202 s).
- **#68 xảy ra SAU khi T0/T1/T5/T6-164 đóng cờ** (T0 17:43Z, T1 17:54Z, T5 17:57Z, T6 17:52Z) và TRONG lúc T2/T4/T7/T8/T9 đang chạy — T2-164 ghi "DONE 18:06Z" (cờ mtime 18:10:36Z, sau btime #68 246 s) nhưng nội dung không nhắc #68; T4-164 ghi attempt2-f1d4ce1a "bị reboot #68 giết giữa chừng" và poller "khởi động lại bằng tay 18:11:09Z" — phiên T4 bị #68 giết thật. T7 không suy đoán phiên T2/T8/T9 có bị giết không — giao T10 thu thập trạng thái cờ lúc đóng.
- **Jitter 0 s** — lần thứ mười bảy liên tiếp run vcut jitter 0 (163 là lần thứ mười sáu).
- Tuổi run từ gốc lúc đọc cuối #7 (19:50:23Z): 8.072 s; còn 2.728 s tới hạn ngân sách 20:35:51Z. **Kết cục thuộc T7-165** (hạn cứng đóng đợt 164 là 20:30Z, trước hạn run 164 20:35:51Z).
- Run 164 dispatch SAU btime #67 144 s, trên boot #67 (worker_boot_generation cron_boot_4c4c3fba...); sau #68, worker_boot_generation mới cron_boot_80815b3c.... Hạn ngân sách KHÔNG ĐỔI (tính từ started gốc, không tính từ started viết lại — cùng quy ước các đợt trước).

### 2.6 Điểm (m) #68 — ỨNG VIÊN DƯƠNG (requeue +47,131 s, trong dải 33–49,8 s)

- **Run 164 ĐANG CHẠY tại btime #68 (18:06:30Z).** Bằng chứng: đọc #2 (18:06:07Z) running, started gốc 17:35:51Z; 0 event finish trước btime (events đầy đủ 4 event — không có `succeeded`/`failed` nào trước 18:07:17Z); requeue + reattach tại btime +47,131 s; chính phiên T7 này bị SIGTERM trong lúc reboot (sleep #2 chết ~18:07:02Z) và session re-attach sau reboot — cùng cơ chế reattach như event 9813 của run 164.
- **Requeue #68: 18:07:17.131Z = btime + 47,131 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 18:06:30–19:50:00Z (mọi job): đúng 1 dòng — requeue run 164 (eid 9811). Không job nào khác bị requeue do #68.
- **Caveat spanning — GHI RÕ, KHÔNG GIẤU:** truy vấn spanning btime #68 trả 0 dòng, NHƯNG ĐÂY LÀ ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy". Run 164 started_at đã viết lại thành 18:07:17Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Đây đúng là caveat T7-162 §2.2 đã cảnh báo và trường hợp #66 đợt 163 — verdict DƯƠNG ứng viên dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **Khung giờ của phép trừ (quy tắc đứng từ đợt 157 §3.3):** run 164 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 164 ở khung thật; btime #68 xác minh giờ thật 9 nguồn T7 + Cloudflare ±1 s ×2; requeue event `created_at` là timestamp host-side cùng khung thật. Delta 47,131 s lấy từ `created_at` timestamptz trực tiếp (18:07:17.131Z), không qua extract-epoch làm tròn.
- **Lean của T7 — DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #3 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #3 (requeue trong dải là dứt khoát); đọc #4–#7 xác nhận không đổi (không viết lại lần 2, không requeue thêm, không reboot mới). T7 KHÔNG tự cộng n (điều tra (m) VẪN ĐÓNG theo quyết (f) đợt 162); T10/parent quyết. **Đối chiếu độc lập thuộc T2-165** (T2-164 đã đóng trước #68 — nội dung không nhắc #68).
- **Nếu parent CHẤP NHẬN #68 DƯƠNG:** n ứng viên 21 → **22 (19 dương + 3 âm, nhánh khuyến nghị)** hoặc 22 → **23 (19 dương + 4 âm, nhánh #56 ÂM)**; n chính thức (ứng viên) GIỮ 14 cho tới khi #56 được chốt. Dải dương ứng viên GIỮ 33–49,8 s (#68 +47,131 s nằm trong dải, không mở rộng dải). Chuỗi run bị viết lại: 160 (0), 161 (1), 162 (0), 163 (1), 164 (**1** — chuỗi 0-lần-viết-lại không đứt hẳn, cùng mẫu quyết (aa) đợt 162).

### 2.7 Slot HB/DR trong cửa 17:00Z → 19:50Z 21/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h10' (7 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:20:50 (17:20:50Z) | 1435cca0 | 17:15:34 | **−316 s** | CÓ |
| 00:50:50 (17:50:50Z) | e2e9eb90 | 17:45:34 | −316 s | CÓ |
| 01:20:50 (18:20:50Z) | 8973c290 | 18:15:34 | −316 s | CÓ |
| 01:50:50 (18:50:50Z) | baccb618 | 18:45:34 | −316 s | CÓ |
| 02:20:50 (19:20:50Z) | 7d707bf2 | 19:15:34 | −316 s | CÓ |
| 02:50:50 (19:50:50Z) | fd8b4e26 | 19:45:34 | −316 s | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started; jitter −316 s đồng đều tuyệt đối (mẫu chuẩn). HB 18:20:50Z dispatched 9m04s SAU btime #68 trên boot mới #68 — daemon boot mới dispatch bình thường. **0 muộn mới — muộn HB lũy kế GIỮ 9** (đợt thứ ba liên tiếp vắng muộn mới).
- Slot HB 16:50:50Z đã đếm ở đợt 163 — T7-164 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot HB 20:20:50Z + DR 20:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-165.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:00 (17:00Z) | 776c3426 | 17:00:00 | 0 s | CÓ |
| 01:00 (18:00Z) | fd0854e4 | 18:00:00 | 0 s | CÓ |
| 02:00 (19:00Z) | fd1604d9 | 19:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 16:00Z đã đếm ở đợt 163 — không đếm lại. DR 18:00Z dispatched 6m30s TRƯỚC btime #68 trên boot #67 — daemon boot cũ dispatch bình thường.

### 2.8 Số hiệu reboot + đối chiếu chéo các luồng đợt 164 (chỉ ghi nhận)

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — XÁC NHẬN quyết (o) đợt 161), #63 = 94d22520 (10:30:42Z, giờ thật — XÁC NHẬN quyết (p) đợt 161), #64 = d9a8d1ce (11:15:18Z, giờ thật — XÁC NHẬN quyết (o) đợt 162), #65 = 1c1cf10c (14:34:57Z, giờ thật — XÁC NHẬN quyết (d) đợt 163), #66 = edb2acdb (16:06:45Z, giờ thật — XÁC NHẬN quyết (e) đợt 163), #67 = f1d4ce1a (17:33:27Z, giờ thật — T0/T2/T5/T7-164 xác minh độc lập, chờ parent xác nhận), #68 = 0c8a94aa (18:06:30Z, giờ thật — T7-164 xác minh 9 nguồn, chờ parent xác nhận; đối chiếu độc lập thuộc T0/T2-165).
- KHÔNG có lệch số hiệu đợt này (T0/T1/T2/T5/T6/T7 đều dùng #67; T2 dùng hệ đếm chặt #138?/#139?/#140? cho cùng ba boot — khác hệ aggregate, ghi nhận như F-161-T1-7).
- Đối chiếu chéo (đọc cờ + LIMITS, chỉ ghi nhận — T7 không kiểm lại công việc luồng khác):
  - **T0-164** (cờ ~17:43Z): #67 xác minh 9 nguồn; KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài; reboot sau T10-163 đóng 16'50" (1.010 s) — claim T10-163 ĐỨNG; run 163 SUCCEEDED margin 1.058 s — KHÔNG bị #67 giết (finished 914 s trước btime — KHỚP T7); marker sống qua 19 reboot #49–#67; POSTBOOT_PASS #66 CHƯA CÓ lúc kiểm lại cuối 17:42:49Z; watcher-163 chết theo #66, watcher-164 ĐANG CHẠY pid 5451; O8 JSON 163 còn đúng; dpkg.log 2 dòng.
  - **T1-164** (cờ 17:54Z): verify 163 PASS; đếm khớp lần thứ 56 liên tiếp (đợt 163 = 10/14/14 đường dẫn / 13 file mới — khớp quyết parent §12.3 aggregate 163; lũy kế 111–163 = 518/951/816; chờ push 136–163 = 270/373/320); **suite 28/28 exit 0 trên boot f1d4ce1a** (17:40:32–17:53:08Z, 12m36s); O8 xác nhận độc lập (chuỗi FULL PASS LÊN 18 theo quyết (g) đợt 163); F-164-T1-2: 3 socket X11 mồ côi X193/X194/X195 (mtime 17:47Z) — giao T8-164 dọn; F-164-T1-6: F-163-T1-5 vẫn mở — T2-164 cập nhật.
  - **T2-164** (cờ mtime 18:10:36Z): probe #83 ok=2 fail=0 (boot f1d4ce1a, 17:44:45Z); #67 xác nhận độc lập; mù #96? (#64) SƠ BỘ MỞ — điều tra đầy đủ giao T2-165; mù #88? VẪN MỞ (lần thứ tám); CERT/FULL chính thức GIỮ 76/91 (ứng viên CERT95/FULL110); INSIDE #66 INSIDE dải FULL112 → chuỗi 1 LÊN 2; #67 INSIDE dải FULL113 → chuỗi 2 LÊN 3; (m) #56 không thu hẹp lần thứ bảy; (m) #66 ĐỒNG Ý DƯƠNG (đối chiếu 3 nguồn khớp — KHỚP quyết (e) đợt 163); (m) #67 KHÔNG PHẢI điểm — đối chiếu khớp T7; POSTBOOT_PASS #67 ĐÃ CÓ 17:54:38Z (theo T5); birefnet 0 thử lần thứ 18.
  - **T4-164** (cờ 19:28:38Z): lượt yên #33 CÓ lượt hợp lệ #29 (attempt2-0c8a94aa 20/20, B 5/5, tickCost median 57,0 ms, 19:16:46–19:20:59Z, boot #68); attempt1-f1d4ce1a KHÔNG hợp lệ (tickCost 68,0 ms > 60); attempt2-f1d4ce1a bị reboot #68 giết giữa chừng — KHÔNG tính ngân sách; cộng dồn mới (29 lượt hợp lệ): P1 109/112, P2 103/103, P3-A1 93/112, P3' 76/84 occ = 71/74 distinct-seq, P7 63/63; poller khởi động lại bằng tay 18:11:09Z; 0 PAGE-WEDGED lần thứ 8 liên tiếp; POSTBOOT_PASS #68 CHƯA CÓ (T5-164 sở hữu).
  - **T5-164** (cờ 17:57Z): POSTBOOT_PASS #66 CHƯA CÓ (boot thứ 8 không có); #67 ĐÃ CÓ 17:54:38Z (boot+21m11s, replay-day-du, poll=0); watcher-164 START 17:40:59Z pid 5451, END 20:30:00Z; watcher-163 chết theo reboot #66 (poll cuối 16:06:54Z, 164 poll) — xác minh độc lập; marker CÒN, sống qua 19 reboot #49–#67; X11: 3 socket mới X193/X194/X195 mtime 17:47:27Z, 0 Xvfb — giao T8-164 dọn; ENOSPC riêng T5: 18 dòng lúc 17:55:51Z (T9 đếm chính thức).
  - **T6-164** (cờ ~17:52Z): (A) 120/120 lần thứ 14 liên tiếp (tổng 1680/1680); lock 517 cặp (ACQUIRED 528 / RELEASED 517), 0 giữ; #67 KHÔNG giết holder (lock trống 1h34m29s trước btime); #66 KHÔNG giết holder (lock trống 7m47s — kiểm chứng lần đầu); prune lần 39 (queue 101 → 100); inotify max_user_watches 63.756; 0 zombie; Cloudflare ~1s mở, ~2s đóng.
  - **T8/T9-164:** cờ chưa có lúc T7 đóng cờ (~19:50Z) — T10 thu thập (không phải nợ của T7). T8-164 sẽ phải xử lý: 3 socket X11 X193/X194/X195 (mtime 17:47Z) + hậu quả #68 với harness; T9-164: headroom + ENOSPC + balloon E-164 (còn mở lúc T9-163 đóng — chờ điểm đứt ở đợt 164) + POSTBOOT_PASS #68 thuộc T5-165.
- Mù đi kèm: #96? (#64) SƠ BỘ MỞ theo T2-164 (điều tra đầy đủ giao T2-165); #95? (#63) MỞ theo quyết (b) đợt 163; #94? (#62) MỞ theo quyết (b) đợt 162; #88? VẪN MỞ (hole-recheck lần thứ tám: 345 hit, 0 mốc mới); #77? VẪN MỞ. CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: #66 INSIDE dải FULL112 → chuỗi 1 LÊN 2; #67 INSIDE dải FULL113 → chuỗi 2 LÊN 3 (T2-164; T7 chỉ ghi nhận). INSIDE cho #68 giao T2-165. POSTBOOT_PASS #67 ĐÃ CÓ 17:54:38Z (T5-164); POSTBOOT_PASS #66 CHƯA CÓ — boot thứ 8 lọt; POSTBOOT_PASS #63 KHÔNG CÓ, không bù được — boot thứ 7 lọt. Marker sống qua 19 reboot #49–#67 (T0/T5-164 khớp nhau; sau #68 là 20 reboot #49–#68 — T0/T5-165 đếm lại lúc mở). Watcher-164 pid 5451 nhiều khả năng chết theo #68 (cùng mẫu watcher-163 chết theo #66); T5-165 kiểm tra lúc mở.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 163/164 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1: phụ lục chỉ viết bằng script, không gõ tay). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 18:07:17.131Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này: run 163/164 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 163/164 ở khung thật; btime #67/#68 xác minh giờ thật nhiều bên độc lập (T0/T2/T7 + Cloudflare); spanning #67 = 0 không phụ thuộc khung giờ (run 163 finished thật trước btime, run 164 started sau btime); spanning #68 = 0 là ARTIFACT viết-lại-tự-loại — verdict DƯƠNG dựa trên EVENTS, không dựa trên spanning (xem §2.6).
4. Cửa kiểm đợt này ~2h10' (17:00Z → 19:50Z 21/11), đủ 6 slot HB + 3 slot DR + run vcut 163 (kết cục) và 164 (theo dõi + viết lại #68). Bảy lần đọc DB đầy đủ; run 163 được đọc đầy đủ 7 lần khớp hoàn toàn nhau ở mọi trường; run 164 được đọc đầy đủ 7 lần (started_at đổi đúng 1 lần tại #68, các trường khác không đổi); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (DR 19:00Z: chưa dispatch lúc đọc #5 18:59Z — đọc #6 xác nhận có, không kết luận thiếu vội).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 16:50:50Z + DR 16:00Z thuộc cửa 163 theo quy ước đứng (T7-163 đã đếm); slot DR 17:00Z + HB 17:20:50Z thuộc cửa 164 (sau kiểm cuối T7-163 lúc 16:47Z). HB 20:20:50Z + DR 20:00Z thuộc cửa T7-165.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #2, 1500 s, spawn 18:06:34Z, chết sau 28 s ~18:07:02Z, 32 s sau btime #68 — killer là reboot #68 + recovery sau reboot, xem F-164-T7-1). 5/6 sleep hoàn thành (cả 6 sleep đợt này đều 1500 s); ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2 đã áp dụng). Boot đổi 1 lần trong phiên (f1d4ce1a → 0c8a94aa tại #68).
7. T7 đóng cờ ~19:55Z — trong hạn cờ ~20:00Z (~5' còn), trong hạn cứng toàn đợt 20:30Z (~35' còn). Run 164 vẫn running lúc đóng cờ — kết cục thuộc T7-165 (hạn ngân sách 20:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix164.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 164 trong NOTES cũng đã đối chiếu lại bằng script sau khi phát hiện 4 tuổi ghi tay sai (xem F-164-T7-3) — LIMITS chỉ dùng số từ appendix164.txt.

## 4. Cập nhật lũy kế (nối tiếp đợt 163, cùng phương pháp)

- Heartbeat: 44/369 → **44/375 slot thiếu** (cửa sổ 14/11 07:50:50 → 22/11 02:50:50 +07). Kiểm toán cửa sổ: 369 + 6 slot mới = 375 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 49/255 → **49/258 slot thiếu** (cửa sổ 11/11 09:00 → 22/11 02:00 +07). Kiểm toán: 255 + 3 = 258 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/375 = 11,7% (giảm từ 11,9% — 0 thiếu mới); DR 49/258 = 19,0% (giảm từ 19,2% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ ba liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 163: SUCCEEDED theo hồ sơ daemon (wall 9.742 s, margin 1.058 s)** — 7 lần đọc DB đầy đủ khớp nhau + events đầy đủ (5 event, 0 event sau succeeded eid 9799). Margin hẹp hơn 162 đúng 7 s (162: 1.065 s); hẹp nhất trong 5 đợt gần nhất 159–163; 1 lần viết lại tại #66 (chuỗi: 160: 0, 161: 1, 162: 0, 163: 1).
2. **Run 163 KHÔNG bị reboot #67 giết** (finished 17:18:13Z, 914 s TRƯỚC btime #67) — btime #67 chỉ sớm hơn hạn run 163 đúng 144 s theo nghĩa giả định; T7 ghi rõ cả hai mặt, không thổi phồng "suýt" thành "giết". T10-163 đóng sổ 17:16:37Z — run 163 finish 96 s SAU khi T10 đóng (T10 ghi "chưa có kết cục" ĐÚNG lúc đóng).
3. **Reboot #67 (btime 17:33:27Z, boot f1d4ce1a): GIỮA HAI ĐỢT, giờ thật, KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài.** Gap #66→#67 = 5.202 s. Reboot xảy ra SAU T10-163 đóng sổ 1.010 s — claim T10-163 ĐỨNG. Số hiệu #67 theo đếm tuần tự — chờ parent xác nhận.
4. **Điểm (m) #67: KHÔNG PHẢI ĐIỂM (m)** — 0 run đang chạy tại btime, 0 requeue (chữ ký #52/#61/#64/#65); T7 lean KHÔNG ĐỔI từ đọc #1; T2-164 xác minh độc lập KHỚP. N ứng viên 21/22 (sau quyết (e) đợt 163); n chính thức (ứng viên) GIỮ 14; dải GIỮ 33–49,8 s; điều tra (m) VẪN ĐÓNG.
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-164 không thu hẹp được cửa lần thứ bảy: R 2,56251–2,66817 / J 2,566–2,80753 s) — chờ parent chốt J (quyết (d)/(e) đợt 163 vẫn đứng).
6. **Reboot #68 (btime 18:06:30Z, boot 0c8a94aa): TRONG ĐỢT, giờ thật, VIẾT LẠI run 164 lần 1 — requeue btime +47,131 s, TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m), chờ parent quyết.** Gap #67→#68 = 1.983 s — NGẮN NHẤT chuỗi gần đây. Spanning btime #68 = 0 dòng là ARTIFACT viết-lại-tự-loại (không phải bằng chứng "0 run đang chạy") — verdict dựa trên EVENTS. Đối chiếu độc lập thuộc T2-165. Nếu CHẤP NHẬN: n ứng viên 21→22 (nhánh khuyến nghị) hoặc 22→23 (nhánh #56 ÂM); n chính thức GIỮ 14. Số hiệu #68 theo đếm tuần tự — chờ parent xác nhận.
7. **Cửa slot: HB 6/6 + DR 3/3, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN (đợt thứ ba liên tiếp).** Lũy kế: HB 44/375, DR 49/258. Muộn HB lũy kế GIỮ 9. Jitter run vcut 0 s lần thứ 17 liên tiếp.
8. **Run 164 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.072 s, còn 2.728 s tới hạn ngân sách 20:35:51Z; 1 lần viết lại tại #68) — kết cục thuộc T7-165.
9. **T8/T9-164 chưa đóng lúc T7 đóng cờ (~19:50Z)** — T10 thu thập (không phải nợ của T7). T4-164 đã đóng 19:28:38Z: lượt yên #33 CÓ lượt hợp lệ #29 trên boot #68 (attempt2 20/20, tickCost median 57,0 ms); attempt2 trên boot #67 bị #68 giết giữa chừng — không tính ngân sách. T2-164 đã đóng (mtime 18:10:36Z, sau btime #68 246 s) nhưng nội dung không nhắc #68 — T7 không suy đoán phiên T2 có bị #68 giết không.
10. **Mù #96? (#64) SƠ BỘ MỞ theo T2-164** (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — đều vượt sàn; S/T đóng) — điều tra đầy đủ giao T2-165. **Mù #95? (#63) MỞ** theo quyết (b) đợt 163. **Mù #94? (#62) MỞ** theo quyết (b) đợt 162. **Mù #88? VẪN MỞ** (hole-recheck lần thứ tám: 345 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110.
11. **INSIDE #66: INSIDE dải FULL112 → chuỗi 1 LÊN 2; INSIDE #67: INSIDE dải FULL113 → chuỗi 2 LÊN 3** (T2-164; T7 chỉ ghi nhận). INSIDE cho #68 giao T2-165.
12. **POSTBOOT_PASS #67 ĐÃ CÓ 17:54:38Z (T5-164)** — replay khởi động boot+21m11s. **POSTBOOT_PASS #66 CHƯA CÓ** — boot thứ 8 lọt. **POSTBOOT_PASS #63 KHÔNG CÓ, không bù được** — boot thứ 7 lọt. **POSTBOOT_PASS #68 CHƯA CÓ** — thuộc T5-165. Marker sống qua 19 reboot #49–#67 (T0/T5-164 khớp nhau; sau #68 là 20 — T0/T5-165 đếm lại). Watcher-164 pid 5451 nhiều khả năng chết theo #68; T5-165 kiểm tra lúc mở.
13. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T2-164: 0 thử lần thứ 18 liên tiếp). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-164-T7-1 — Sleep #2 bị SIGTERM giết bởi reboot #68 (không phải lỗi tính toán, là sự cố phiên):** sleep 1500 s spawn 18:06:34Z bị SIGTERM sau 28 s (~18:07:02Z, 32 s sau btime #68, trong lúc daemon recovery — requeue run 164 lúc 18:07:17Z). Killer: reboot #68 + quá trình recovery sau reboot. Đây là sleep thứ hai liên tiếp bị giết bởi reboot trong đợt (đợt 163: sleep #4 bị #66 giết; đợt 162: 0 sleep bị giết). 5/6 sleep hoàn thành (cả 6 sleep đợt này đều 1500 s). Không ảnh hưởng verdict nào (đọc #3 dùng exec trực tiếp sau khi sleep chết; các đọc DB #3–#7 đầy đủ, khớp nhau).
- **F-164-T7-2 — Suýt ghi đính chính sai về n trong NOTES (đã sửa ngay trong phiên, không lọt vào LIMITS):** lúc viết đối chiếu T2-164, T7 suýt ghi "số 19 dương ở NOTES đọc #3 là NHÁP SAI" — đó là sai: sau khi parent chấp nhận #66 (quyết (e) đợt 163), n = 21 (18 dương + 3 âm); #68 nếu được chấp nhận → 22 (19 dương + 3 âm) nên "19 dương" ở đọc #3 là ĐÚNG. T7 phát hiện và sửa ngay trong cùng phiên, trước khi viết LIMITS. Bài học: đếm n phải neo vào quyết parent mới nhất (§12.3 đợt 163), không đếm lại từ số đợt 162.
- **F-164-T7-3 — Tuổi gốc run 164 ghi tay trong NOTES sai ở 4 lần đọc (đã đính chính trước khi viết LIMITS):** #2 ghi 1836 s (đúng 1816 s lúc 18:06:07Z); #5 ghi 4965 s (đúng 5025 s lúc 18:59:36Z); #6 ghi 6467 s (đúng 6551 s lúc 19:25:02Z); #7 ghi 7992 s (đúng 8072 s lúc 19:50:23Z); số "còn tới hạn" sai theo cùng độ lệch. Nguyên nhân: trừ tay giờ–phút–giây (lệch 20–84 s, không theo mẫu cố định). Phát hiện khi đối chiếu appendix164.py (tính từ epoch thô bằng script): mọi tuổi trong appendix đều đúng; NOTES đã sửa cả 4 chỗ. LIMITS chỉ dùng số từ appendix164.txt — không lọt số sai nào vào LIMITS. Bài học: tuổi run cũng phải tính bằng script từ epoch thô, không trừ tay (mở rộng bài học F-162-T7-1).
- **F-164-T7-0 — Không có sai số tính toán nào khác trong đợt này:** mọi phép trừ epoch/giờ trong LIMITS đều qua script appendix164.py từ epoch thô (bài học F-162-T7-1 đã áp dụng — script chạy ra appendix164.txt, đối chiếu khớp từng số, và đã bắt được F-164-T7-3); tên event lọc đúng `requeued_after_restart` ngay lần đầu (bài học F-162-T7-2 đã áp dụng); kiểm boot_id SAU khi đọc started_at ở mọi lần đọc (bài học F-142-T7-1 đã áp dụng); kết cục run 163 có 7 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 17:18:13.605Z, eid 9799), không suy đoán sau; btime #67/#68 xác minh 9 nguồn mỗi boot + Cloudflare 2 lần trong phiên (lúc mở chênh 0 s, lúc đóng chênh 1 s — đồng hồ boot mới đúng giờ thật); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng); lean (m) #67 KHÔNG PHẢI điểm KHÔNG ĐỔI từ đọc #1 và lean (m) #68 DƯƠNG ứng viên KHÔNG ĐỔI từ đọc #3 (bằng chứng đầy đủ ngay từ đầu — khác #62 đợt 161, xem F-161-T7-1); caveat spanning #68 (viết-lại-tự-loại) được ghi rõ trong LIMITS, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round164-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t7/NOTES.md` + `appendix164.py` + `appendix164.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round164-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix164.py` từ epoch thô — xem file `appendix164.txt` trong round164-t7)

### Phu luc A — Run 163 (ket cuc SUCCEEDED, T7-164)
- sched 1795271751 = 2026-11-21T14:35:51Z; started GOC 1795271751 = 2026-11-21T14:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #66 1795277250 = 2026-11-21T16:07:30Z (requeue 16:07:30.460Z = btime + 45,460 s)
- finished 1795281493 = 2026-11-21T17:18:13Z; status succeeded; attempt 1; error null; timed_out false
- claimed 1795281485 = 2026-11-21T17:18:05Z (finished - 8 s)
- wall tu started GOC: 1795281493 - 1795271751 = 9742 s (2h42m22s)
- han ngan sach: 1795282551 = 2026-11-21T17:35:51Z; margin: 1795282551 - 1795281493 = 1058 s (0h17m38s)
- KHONG co event nao cho run 163 sau succeeded 17:18:13.605Z (eid 9799); tong 5 event
- Margin 1058 s < 162: 1065 s — hep hon 7 s; xep thu 10/14 trong chuoi tu dot 150; hep nhat trong 5 dot gan nhat 159-163

### Phu luc B — Reboot #67 / #68
- #67: btime 1795282407 = 2026-11-21T17:33:27Z, boot f1d4ce1a
- #68: btime 1795284390 = 2026-11-21T18:06:30Z, boot 0c8a94aa
- gap #66->#67 (btime-btime): 1795282407 - 1795277205 = 5202 s (1h26m42s)
- gap #67->#68 (btime-btime): 1795284390 - 1795282407 = 1983 s (0h33m03s) — NGAN NHAT chuoi gan day
- finished run 163 TRUOC btime #67: 1795282407 - 1795281493 = 914 s (0h15m14s) truoc
- btime #67 so voi han run 163: 1795282407 - 1795282551 = -144 s (truoc han 144 s)
- T10-163 dong 1795281397 = 2026-11-21T17:16:37Z; run 163 finish SAU khi T10 dong: 1795281493 - 1795281397 = 96 s
- btime #67 SAU khi T10-163 dong: 1795282407 - 1795281397 = 1010 s (0h16m50s)

### Phu luc C — Run 164 (van running luc dong co T7-164, 1 lan viet lai tai #68)
- sched 1795282551 = 2026-11-21T17:35:51Z; started GOC 1795282551 = 2026-11-21T17:35:51Z (jitter 0 s — lan thu 17 lien tiep)
- started sau viet lai lan 1 #68 1795284437 = 2026-11-21T18:07:17Z (requeue 18:07:17.131Z = btime + 47,131 s)
- requeue delta (event created_at - btime): 1795284437.131 - 1795284390 = 47,131 s — TRONG dai 33-49,8 s
- claimed 1795282551 = 2026-11-21T17:35:51Z (started goc + 0 s; KHONG DOI sau viet lai)
- han ngan sach (started goc + 10800): 1795293351 = 2026-11-21T20:35:51Z (ket cuc thuoc T7-165)
- events run 164: 4 event (dispatched 17:35:51.168Z eid 9801 + requeued 18:07:17.131Z eid 9811 + dispatched 18:07:17.283Z eid 9812 + reattached 18:07:17.410Z eid 9813)
- doc #1 2026-11-21T17:40:56Z: tuoi goc 305 s; con 10495 s toi han
- doc #2 2026-11-21T18:06:34Z: tuoi goc 1843 s; con 8957 s toi han
- doc #3 2026-11-21T18:07:45Z: tuoi goc 1914 s; con 8886 s toi han
- doc #4 2026-11-21T18:33:33Z: tuoi goc 3462 s; con 7338 s toi han
- doc #5 2026-11-21T18:59:36Z: tuoi goc 5025 s; con 5775 s toi han
- doc #6 2026-11-21T19:25:02Z: tuoi goc 6551 s; con 4249 s toi han
- doc #7 2026-11-21T19:50:23Z: tuoi goc 8072 s; con 2728 s toi han
- requeue cua RONG 18:06:30-19:50:00Z (moi job): dung 1 dong — requeue run 164 (eid 9811)
- spanning btime #68: 0 dong — ARTIFACT viet-lai-tu-loai (run 164 started_at da viet lai thanh sau btime)
- spanning btime #67: 0 dong — THAT (run 163 finished that truoc btime; run 164 started sau btime)

### Phu luc D — Slot HB/DR cua T7-164 (doc #1-#7, 17:40Z-19:50Z)
- HB sched 2026-11-21T17:20:50Z: started 2026-11-21T17:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T17:50:50Z: started 2026-11-21T17:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T18:20:50Z: started 2026-11-21T18:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T18:50:50Z: started 2026-11-21T18:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T19:20:50Z: started 2026-11-21T19:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T19:50:50Z: started 2026-11-21T19:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-21T17:00:00Z: started 2026-11-21T17:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T18:00:00Z: started 2026-11-21T18:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T19:00:00Z: started 2026-11-21T19:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (toan -316 s; 0 muon, 0 thieu), DR 3/3 (toan 0 s; 0 thieu) — CUA LANH
- Luy ke: HB 44/369 -> 44/375 (so thieu +0); DR 49/255 -> 49/258 (so thieu +0)
- Ti le thieu: HB 11,7%; DR 19,0%
- Muon HB luy ke: GIU 9 (+887 s x6, +889 s, +891 s, +888 s dot 161; 0 muon moi dot 164)

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
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 + T2-159 + T2-160 + T2-161 + T2-162 + T2-163 + T2-164 KHONG thu hep duoc cua: R 2,56251-2,66817 s / J 2,566-2,80753 s — lan thu BAY)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — viet lai run 157 lan 2; TINH BANG GIO THAT
- #59 DUONG (+35,173 s) — viet lai run 158 lan 1; TINH BANG GIO THAT
- #60 DUONG (+46,642 s) — CHAP NHAN (quyet (f) dot 159); viet lai run 159 lan 1; TINH BANG GIO THAT
- #61 KHONG PHAI diem du lieu (T7-160: 0 run dang chay tai btime 05:25:49Z; 0 requeue trong cua 05:25:49-05:35:51Z) — cung mau #52
- #62 AM — CHAP NHAN (quyet (s) dot 161): run 160 dang chay tai btime 07:59:29Z (that), 0 requeue — chu ky nhu #45; overlap 824-854 s la co che giai thich
- #63 DUONG — CHAP NHAN (quyet (t) dot 161): viet lai run 161 lan 1, requeue 10:31:19.128Z = btime + 37,128 s — TRONG dai 33-49,8 s
- #64 KHONG PHAI diem du lieu (T7-162 + T2-162 doi chieu khop; quyet (f) dot 162): 0 run dang chay tai btime 11:15:18Z (run 161 finished 11:11:39Z, 219 s truoc btime; run 162 started 11:35:51Z, sau btime); 0 requeue trong cua 11:15:18-11:35:51Z — cung mau #52/#61
- #65 KHONG PHAI diem du lieu (T7-163 + T2-163 doi chieu khop; quyet (f) dot 163): 0 run dang chay tai btime 14:34:57Z (run 162 finished 14:18:06Z, 1011 s truoc btime; run 163 started 14:35:51Z, sau btime); 0 requeue trong cua 14:34:57-14:35:51Z — cung mau #52/#61/#64
- #66 DUONG — CHAP NHAN (quyet (e) dot 163; T2-164 doi chieu doc lap DONG Y DUONG, 3 nguon khop): viet lai run 163 lan 1, requeue 16:07:30.460Z = btime + 45,460 s — TRONG dai 33-49,8 s
- #67 KHONG PHAI diem du lieu (T7-164 + T2-164 doi chieu khop): 0 run dang chay tai btime 17:33:27Z (run 163 finished 17:18:13Z, 914 s truoc btime; run 164 started 17:35:51Z, sau btime); 0 requeue trong cua 17:33:27-17:40:00Z — cung mau #52/#61/#64/#65
- #68 DUONG UNG VIEN (T7-164; cho parent quyet; doi chieu doc lap thuoc T2-165): viet lai run 164 lan 1, requeue 18:07:17.131Z = btime + 47,131 s — TRONG dai 33-49,8 s
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet #56
- n ung vien = 21 (18 duong + 3 am, nhanh khuyen nghi) hoac 22 (18 duong + 4 am, nhanh #56 AM) — SAU quyet (e) dot 163 chap nhan #66 DUONG (truoc: 20/21); neu CHAP NHAN #68 DUONG: 22 hoac 23
- Dai requeue duong ung vien GIU 33-49,8 s (#68 +47,131 s nam trong dai, khong mo rong dai)
- LUU Y SO HIEU: 348dab54=#56; bcbaa3ad=#57; 28366bd0=#58; eec65561=#59; e590ae0a=#60; 52c957d5=#61; 39d46ba0=#62 (XAC NHAN quyet (o) dot 161); 94d22520=#63 (XAC NHAN quyet (p) dot 161); d9a8d1ce=#64 (XAC NHAN quyet (o) dot 162); 1c1cf10c=#65 (XAC NHAN quyet (d) dot 163); edb2acdb=#66 (XAC NHAN quyet (e) dot 163); f1d4ce1a=#67 (T0/T2/T5/T7-164 xac minh doc lap — cho parent xac nhan); 0c8a94aa=#68 (T7-164 xac minh 9 nguon — cho parent xac nhan)
