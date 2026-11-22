# PHASE9 ROUND158 T7 — RUN 157 SUCCEEDED (wall 10.455 s, margin 345 s — HẸP THỨ HAI TỪ ĐỢT 150) + REBOOT #58 VIẾT LẠI RUN 157 LẦN 2 (điểm (m) DƯƠNG MỚI +42,529 s) + REBOOT #59 GIỮA PHIÊN VIẾT LẠI RUN 158 LẦN 1 (điểm (m) DƯƠNG MỚI +35,173 s) + CỬA SLOT LÀNH HOÀN TOÀN LẦN THỨ SÁU LIÊN TIẾP

- **Luồng:** T7 đợt 158 (lượt cron 06:35 +07 21/11/2026 = 23:35:51Z 20/11). Nhiệm vụ theo brief T7-158: (1) kết cục run 157 — run này vẫn `running` lúc T7-157 đóng cờ, hạn ngân sách 23:35:51Z; (2) run 158 (run của lượt này, started 23:35:51Z, hạn 02:35:51Z 21/11) — theo dõi trong phiên, ghi mọi lần bị viết lại kèm btime reboot tương ứng; (3) điểm (m): n chính thức (ứng viên) GIỮ 14 (quyết (g) đợt 156); ứng viên mới 15 (nhánh khuyến nghị, #57 dương +47,698 s) hoặc 16 (nếu #56 là điểm ÂM — #56 vẫn CÓ ĐIỀU KIỆN theo quyết (e) đợt 157, T2-158 đang thu hẹp cửa); dải 33–49,8 s GIỮ NGUYÊN; điều tra (m) VẪN ĐÓNG; (4) cửa slot HB/DR + lũy kế; (5) LIMITS trung thực, phụ lục bằng script. Chú ý lệch đồng hồ cell (Model 1 chạy nhanh R ≥ 2,562 — quyết (d) đợt 157): tính điểm (m) CÙNG KHUNG giờ thật, ghi rõ khung dùng để tính.
- **Boot trong phiên:** mở phiên là **28366bd0-d6d6-4a50-a386-666c0aa3c062** (btime /proc/stat 1795215968 = 23:06:08Z — **reboot #58, GIỜ THẬT** theo quyết (s) đợt 157; T7 tự xác minh độc lập lúc mở phiên ~23:39Z: github Date khớp từng giây); **1 reboot GIỮA PHIÊN: #59** 01:33:47Z → boot **eec65561-8a81-4f1a-99d6-a1ea81606127** (btime /proc/stat 1795224827 = 01:33:47Z — **GIỜ THẬT**, T7 xác minh 6 nguồn + github Date khớp từng giây). KHÔNG có reboot nào sau #59 (kiểm boot_id ở mọi lần đọc: ~23:39Z, ~00:07Z, ~00:33Z, ~00:59Z, ~01:25Z, ~01:34Z, ~01:56Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 157/158 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 157 §12.3 (quyết parent (a)–(s)), LIMITS T7-157 + NOTES round157-t7, cờ round158-t0.done / t1.done / t2.done / t8.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 157 kết cục? | **`succeeded`** 23:30:06Z (event 23:30:06.022Z, eid 9545), wall từ started gốc **10.455 s**, margin **345 s** (5m45s) tới hạn 23:35:51Z — **hẹp thứ hai từ đợt 150** (chỉ sau run 150: 177 s) | §2.1, Phụ lục A |
| Run 157 có bị viết lại lần 2 tại #58 không? | **CÓ — ĐIỂM (m) DƯƠNG MỚI +42,529 s** (trong dải 33–49,8 s; tính CÙNG KHUNG giờ thật) | §2.2 |
| Reboot #59 có viết lại run nào không? | **CÓ — run 158 bị viết lại lần 1: ĐIỂM (m) DƯƠNG MỚI +35,173 s** (trong dải 33–49,8 s; tính CÙNG KHUNG giờ thật) | §2.3 |
| Run 157 có bị #59 viết lại không? | **KHÔNG** — run 157 đã finished trước #59 7.421 s (2h03m41s) | §2.3 |
| n mẫu (m)? | **Chính thức (ứng viên) = 14** theo quyết (g) đợt 156 — GIỮ. N ứng viên (ghi nhận, chờ parent quyết): **17** (15 dương + 2 âm, nhánh khuyến nghị) **hoặc 18** (15 dương + 3 âm, nhánh #56 ÂM) nếu tính cả #58 + #59 | §2.2, §2.3, Phụ lục E |
| Dải requeue dương? | **GIỮ 33–49,8 s** — #58 +42,529 s và #59 +35,173 s đều trong dải, không phá min (33,236 s) hay max (49,761 s). Điều tra (m) VẪN ĐÓNG | §2.2, §2.3 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-158 KHÔNG thu hẹp được cửa** (R 2,56251–2,66817 s; J 2,566–2,80753 s; đã thử 4 hướng, không neo mới) | §2.4 |
| Cửa slot đợt 158? | **CỬA LÀNH HOÀN TOÀN:** HB 7/7 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới — lần thứ sáu liên tiếp lành hoàn toàn | §2.5 |
| Run 158? | **Jitter 0 s** (started gốc = scheduled_for = 23:35:51Z), **đã bị viết lại 1 lần tại #59**, **vẫn `running` lúc đóng cờ** (~01:56Z, tuổi gốc 8.416 s, còn 2.384 s tới hạn 02:35:51Z). Kết cục thuộc T7-159 | §2.2 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–157): heartbeat **44/339 slot thiếu** (số thiếu +0, mẫu số +7); deterministic-doctor **49/240 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 157 — SUCCEEDED, margin 345 s (2 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp)

Run 157 (`ca176b15-c63e-4efe-b975-6dce50c990c9`, sched 1795206951 = 20:35:51Z):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795206951 = 20:35:51Z 20/11 |
| started_at GỐC (dispatch 20:35:51.075Z) | 20:35:51Z — jitter 0 s |
| started_at sau viết lại #57 | 1795208762 = 21:06:02Z |
| started_at sau viết lại #58 (nay, không đổi) | 1795216010 = 23:06:50Z |
| finished_at_utc | 1795217406 = 23:30:06Z (event `succeeded` 23:30:06.022Z, eid 9545) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795217395 = 23:29:55Z (finished − 11 s) |
| Wall từ started gốc | 1795217406 − 1795206951 = **10.455 s** (2h54m15s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795217751 = 23:35:51Z — finished TRƯỚC hạn **345 s** (5m45s) |
| Wall từ started viết lại #58 | 1795217406 − 1795216010 = 1.396 s (23m16s) |

- Events run 157 (đầy đủ, 8 event, không thiếu, không thêm sau succeeded): `dispatched` 20:35:51.075Z (eid 9502) + bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #57 (9512/9513/9514) + bộ tương tự tại #58 (9539/9540/9541) + **`succeeded` 23:30:06.022Z (9545)**. **KHÔNG có event nào cho run 157 sau 23:30:06Z.**
- 2 lần đọc DB đầy đủ khớp nhau ở mọi trường (đọc #1 ~23:40Z, đọc cuối #6 ~01:56Z) + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: **345 s** — **hẹp thứ hai từ đợt 150** (chỉ sau 150; hẹp hơn 156 đúng 632 s). Xu hướng margin hẹp lại kể từ 151 (1.828 s → 345 s) — T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 157 claimed 23:29:55Z (finished − 11 s) — trở lại họ 7–8 s của run 154 (7 s) / 155 (8 s), khác hẳn 123 s của run 156 — T7 chỉ ghi nhận, không suy luận cơ chế.
- **Wall/margin là hiệu số thuần trong khung DB nên ĐÚNG dù DB ở khung nào** (cả hai đầu đều epoch DB). Run 157 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 157 ở khung thật — xem §2.2.

### 2.2 Reboot #58 lúc mở — viết lại run 157 lần 2, ĐIỂM (m) DƯƠNG MỚI +42,529 s (tính cùng khung giờ thật)

- **Reboot #58: boot bcbaa3ad → 28366bd0-d6d6-4a50-a386-666c0aa3c062, btime 1795215968 = 23:06:08Z.** T7 mở phiên trên boot này (~23:39Z); `uptime -s` 23:06:08Z. **Btime là GIỜ THẬT** — quyết (s) đợt 157 đã xác nhận số hiệu; T7 xác minh độc lập lúc mở phiên: Date header github.com 23:40:35 GMT khớp từng giây với đồng hồ local 23:40:36/37Z; T0-158 xác nhận độc lập (6 nguồn khớp; đồng hồ local ≈ Cloudflare ±1 s lúc 23:46Z — không còn chạy nhanh ~50' như đợt 156); T2-158 drift-test 23:49:16Z ratio local/server 0,9973 ≈ 1,0 → đồng hồ trên boot 28366bd0 chạy đúng tốc độ thật. Tuổi boot #57 tới #58: 1795215968 − 1795208715 = 7.253 s (2h00m53s).
- **Run 157 ĐANG CHẠY tại btime và BỊ VIẾT LẠI (lần 2):** started_at 1795208762 → 1795216010 = 23:06:50Z; requeue event 23:06:50.529Z (eid 9539, "daemon startup recovery") = **btime + 42,529 s**. Dispatched 23:06:50.592Z (9540) + reattached 23:06:50.644Z (9541). Claimed_at VẪN 1795217395 (sau viết lại — claimed cuối, không phải gốc; xem §2.1). Chỉ 1 requeue trong cửa 23:05–23:10Z (mọi job — run 157, eid 9539). Tuổi run 157 từ started sau #57 tại btime: 1795215968 − 1795208762 = 7.206 s (2h00m06s).
- Truy vấn runs finished sau btime #58 (sched < btime): CHỈ run 157 → không có run nào khác đang chạy tại btime #58 mà không bị viết lại. (Truy vấn spanning theo started_at HIỆN TẠI trả 0 dòng — đúng như dự kiến vì started_at run 157 đã viết lại thành 1795216010 > btime; bằng chứng run 157 đang chạy tại btime là event requeue + started_at đổi, không phải truy vấn spanning sau khi viết lại — cùng caveat T7-157 §2.4.)
- **Offset +42,529 s TRONG dải 33–49,8 s** (không phá min 33,236 s #42, không vượt max 49,761 s #50). **Khung giờ #58 SẠCH:** btime #58 giờ thật (đã xác minh 3 nguồn độc lập: T7 lúc mở + T0-158 + drift-test T2-158) + epoch DB run 157 giờ thật (dispatch sau khi sửa đồng hồ #56; T7-157 đã chứng minh DB run 157 ở khung thật) + đồng hồ lúc mở khớp github từng giây → offset tính trong MỘT khung thật. **Đây là điểm (m) DƯƠNG thứ hai tính hoàn toàn bằng giờ thật** (sau #57 +47,698 s).
- **Run 157 là run ĐẦU TIÊN bị viết lại 2 lần ở 2 reboot khác nhau mà cả 2 lần đều cho điểm (m) DƯƠNG** (#57 +47,698 s và #58 +42,529 s). Run 156 bị viết lại 3 lần (#53/#54/#55) cũng toàn dương.
- **KHÔNG có slot nào mất tại #58:** DR 23:00Z finished 23:00:00Z (trước btime #58 368 s); HB 23:20:50Z dispatched 23:15:34Z (sau btime #58, jitter chuẩn −316 s — xem §2.5). Daemon hồi phục trước slot tiếp theo.
- **KHÔNG có mâu thuẫn khung giờ mới tại #58:** event cuối trước btime đều trước btime, thứ tự xuôi; requeue trong dải.
- T2-158 ghi nhận điểm này từ NOTES #1 của T7 ("T7 sở hữu phán") — đối chiếu chéo khớp (T2-158 DONE 00:31Z).

### 2.3 Reboot #59 giữa phiên — viết lại run 158 lần 1, ĐIỂM (m) DƯƠNG MỚI +35,173 s (tính cùng khung giờ thật)

- **Reboot #59: boot 28366bd0 → eec65561-8a81-4f1a-99d6-a1ea81606127, btime 1795224827 = 01:33:47Z 21/11.** Xác minh 6 nguồn: boot_id + btime + `uptime -s` 01:33:47Z (khớp) + journal first entry 01:33:59Z (+12 s) + wtmp begins 01:33:58Z (+11 s) + /proc/1 start 01:33:58,78Z (+11,78 s). **Đồng hồ boot mới ĐÚNG (giờ thật):** Date header github.com 01:34:29 GMT khớp từng giây với đồng hồ local 01:34:29/30Z lúc curl → **btime #59 = 01:33:47Z GIỜ THẬT** (không đội J). Tuổi boot #58 tới #59: 8.859 s (2h27m39s).
- Sleep 1.500 s của T7 (bắt đầu ~01:25:22Z) **BỊ GIẾT bằng SIGTERM sau ~510 s (~01:33:52Z — ~5 s sau btime #59)** — cùng mẫu SIGTERM-sau-btime đợt 156/157 (#57: ~34 s sau btime). Sleep không chạy hết, không mất việc (T7 phát hiện reboot nhờ handoff SIGTERM + kiểm boot ngay lúc ~01:34:29Z).
- **Run 158 ĐANG CHẠY tại btime và BỊ VIẾT LẠI (lần 1):** started_at 1795217751 → 1795224862 = 01:34:22Z; requeue event 01:34:22.173Z (eid 9572, "daemon startup recovery") = **btime + 35,173 s**. Dispatched 01:34:22.236Z (9573) + reattached 01:34:22.291Z (9574). Claimed_at VẪN 1795217751 (gốc). Chỉ 1 requeue trong cửa 01:33–01:36Z (mọi job — run 158, eid 9572). Tuổi run 158 từ started gốc tại btime: 1795224827 − 1795217751 = 7.076 s (1h57m56s).
- **Run 157 KHÔNG bị #59 viết lại:** đã finished trước #59 7.421 s (2h03m41s) trong khung thật.
- Truy vấn runs đang chạy tại btime #59 mà KHÔNG bị viết lại (sched < btime, started < btime, finished NULL hoặc > btime): 0 dòng → không có run nào khác đang chạy tại btime mà thoát viết lại.
- **Offset +35,173 s TRONG dải 33–49,8 s** (không phá min 33,236 s #42, không vượt max 49,761 s #50). **Khung giờ #59 SẠCH:** btime #59 giờ thật (đã xác minh 6 nguồn + github Date) + epoch DB run 158 giờ thật (dispatch sau khi sửa đồng hồ #56) → offset tính trong MỘT khung thật, cùng loại điểm #57/#58.
- **KHÔNG có slot nào mất tại #59:** HB 01:20:50Z finished 01:15:34Z (trước btime #59); HB 01:50:50Z dispatched 01:45:34Z (sau btime #59, jitter chuẩn −316 s — xem §2.5). Daemon hồi phục trước slot tiếp theo.
- **KHÔNG có mâu thuẫn khung giờ mới tại #59:** event cuối trước btime đều trước btime, thứ tự xuôi; requeue trong dải.
- Mù cho #59 (#91? theo quy tắc +32) giao T2-159; POSTBOOT_PASS #59 giao T5-159 (không thuộc đợt này).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-158 KHÔNG thu hẹp được cửa

- T2-158 DONE 00:31Z (đọc cờ, đối chiếu chéo): **KHÔNG thu hẹp được cửa (m) #56** — R 2,56251–2,66817 s; J 2,566–2,80753 s (đã thử 4 hướng, không neo mới); n GIỮ 14. Kết quả phụ: timestamp session runtime = khung wall cell (củng cố quy gán D + cận dưới R).
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 17 (15 dương + 2 âm, tính cả #58 + #59); nếu J < 2.807 s → #56 là điểm ÂM → n = 18 (15 dương + 3 âm). T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng):** #38 ÂM, #39/#41/#42/#44/#46/#47/#49/#50/#51/#53/#54/#55/#57/#58/#59 DƯƠNG (15 dương), #45 ÂM (ứng viên), #56 CÓ ĐIỀU KIỆN → **n ứng viên = 17 (nhánh khuyến nghị) hoặc 18 (nhánh #56 ÂM)**. **Số chính thức (ứng viên) = 14 theo quyết (g) đợt 156; n ứng viên theo quyết (f) đợt 157 = 15/16 — GIỮ cho tới khi parent quyết #56/#58/#59.**
- T2-158 thêm: mù #89? (#57) ĐÓNG; mù #90? (#58) ĐÓNG; mù #88? (#56) VẪN MỞ (hole-recheck hố đầu E: 345 hit, 0 mốc mới). INSIDE: #57 INSIDE FULL103 → chuỗi 3 (xác nhận); #58 INSIDE FULL104 → chuỗi 4 (mới). Nghịch lý mới (T2): #58 đồng hồ cũ nhanh ~+28 s lúc chết — KHÔNG ảnh hưởng offset (m) #58/#59 (requeue + btime đều ghi trên boot mới, khung thật; finished run 157 23:30:06Z cũng ghi trên boot mới). CERT/FULL chính thức GIỮ 76/91.

### 2.5 Run 158 — jitter 0 s, đã bị viết lại 1 lần tại #59, vẫn running lúc đóng cờ

Run 158 (`cf11aa1e-3799-402a-afd2-0e9b3f7e736d`, sched 1795217751 = 23:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795217751 | 23:35:51Z 20/11 |
| dispatched (event) | — | 23:35:51.115Z (eid 9547) |
| started_at GỐC | 1795217751 | 23:35:51Z — **jitter 0 s** |
| started_at sau viết lại #59 (nay) | 1795224862 | 01:34:22Z 21/11 |
| worker_claimed_at | 1795217751 | 23:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795228551 | 02:35:51Z 21/11 |

- 6 lần đọc DB đầy đủ trong phiên: status `running` ở cả 6 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #59 — khớp 1 event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` 23:35:51.115Z (9547) + 1 bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #59 (9572/9573/9574) — không có event nào khác.
- Tuổi run từ gốc: 3.087 s lúc đọc #2 (00:07:18Z), 3.441 s lúc đọc #3 (00:33:12Z), 4.998 s lúc đọc #4 (00:59:09Z), 6.546 s lúc đọc #5 (01:24:57Z), **8.416 s lúc đọc cuối #6 (01:56:07Z)** — còn 2.384 s tới hạn ngân sách 02:35:51Z. **Kết cục thuộc T7-159.**
- Jitter 0 s — lần thứ mười một liên tiếp run vcut sau jitter 0 (157 là lần thứ mười).

### 2.6 Slot HB/DR trong cửa 22:50Z 20/11 → 01:56Z 21/11 — HB 7/7 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN LẦN THỨ SÁU LIÊN TIẾP

Cửa kiểm ~3h06' (6 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 7/7 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 05:50:50 (22:50:50Z) | 9833b07b | 22:45:34 | −316 s | CÓ |
| 06:20:50 (23:20:50Z) | 2759a359 | 23:15:34 | −316 s | CÓ |
| 06:50:50 (23:50:50Z) | e68664b0 | 23:45:34 | −316 s | CÓ |
| 07:20:50 (00:20:50Z) | abfdb52d | 00:15:34 | −316 s | CÓ |
| 07:50:50 (00:50:50Z) | 6194fea3 | 00:45:34 | −316 s | CÓ |
| 08:20:50 (01:20:50Z) | 6732e093 | 01:15:34 | −316 s | CÓ |
| 08:50:50 (01:50:50Z) | 84693f00 | 01:45:34 | −316 s | CÓ |

- 7/7 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (vắng 6 đợt liên tiếp: 153, 154, 155, 156, 157, 158).
- Slot HB 22:20:50Z đã đếm ở đợt 157 — T7-158 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:00 (23:00Z) | e1928d50 | 23:00:00 | 0 s | CÓ |
| 07:00 (00:00Z) | b9c20bf0 | 00:00:00 | 0 s | CÓ |
| 08:00 (01:00Z) | c0ade88c | 01:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 22:00Z đã đếm ở đợt 157 — không đếm lại. Slot DR 02:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-159.

### 2.7 Số hiệu reboot — #59 đếm tuần tự, giao parent/T2-159 chốt mù

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật — quyết (c) đợt 157), #57 = bcbaa3ad (21:05:15Z, giờ thật — T7-157), #58 = 28366bd0 (23:06:08Z, giờ thật — quyết (s) đợt 157; T0/T2-158 + T7-158 xác minh độc lập), #59 = eec65561 (01:33:47Z, giờ thật — T7-158 xác minh 6 nguồn).
- KHÔNG có lệch số hiệu đợt này (khác đợt 156: T4 bỏ sót 062850d8). T7 dùng số hiệu tuần tự (#58/#59) xuyên suốt file này và phụ lục; mọi boot_id/btime đều ghi đầy đủ để đối chiếu.
- Mù đi kèm: #90? (#58) ĐÓNG theo T2-158; #91? (#59) giao T2-159 (T7 không chứng nhận mù nào). POSTBOOT_PASS #58 ĐÃ GHI 23:43:22Z (T5-158); #57 KHÔNG CÓ; POSTBOOT_PASS #59 giao T5-159.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 157/158 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này không bắt được phép tính nháp sai nào — xem §6). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 23:06:50.529Z, 01:34:22.173Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này cả hai điểm (m) mới (#58/#59) đều tính trong MỘT khung thật nên không cần hiệu chỉnh J (xem §2.2/§2.3).
4. Cửa kiểm đợt này ~3h06' (22:50Z 20/11 → 01:56Z 21/11), đủ 7 slot HB + 3 slot DR + run vcut 157 (kết cục) và 158 (theo dõi). Sáu lần đọc DB đầy đủ; run 158 được đọc đầy đủ 6 lần khớp hoàn toàn nhau ở mọi trường trùng (trừ started_at đổi đúng 1 lần tại #59); run 157 được đọc đầy đủ 2 lần khớp hoàn toàn nhau; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 22:20:50Z + DR 22:00Z thuộc cửa 157 theo quy ước đứng (T7-157 đã đếm); slot DR 23:00Z + HB 22:50:50Z thuộc cửa 158 (sau kiểm cuối T7-157 lúc 22:24Z). DR 02:00Z thuộc cửa T7-159.
6. **1 sleep bị giết trong phiên này** (sleep 1.500 s, SIGTERM sau ~510 s, ~5 s sau btime #59 — cùng mẫu SIGTERM-sau-btime đợt 156/157); sleep-1/2/3 (1.500 s ×3) + sleep 1.200 s hoàn thành bình thường, không SIGTERM. Boot đổi 28366bd0 → eec65561: 1 lần đổi trong phiên (tại #59), cộng boot #58 lúc mở.
7. T7 đóng cờ ~02:02Z — trễ hạn cờ ~02:00Z ~2 phút (do viết LIMITS + stage sau đọc cuối #6 lúc 01:56Z), trong hạn cứng toàn đợt 02:30Z (~28' còn). Ghi rõ, không giấu. Run 158 vẫn running lúc đóng cờ — kết cục thuộc T7-159 (hạn ngân sách 02:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix158.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 157, cùng phương pháp)

- Heartbeat: 44/332 → **44/339 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 08:50:50 +07). Kiểm toán cửa sổ: 332 + 7 slot mới = 339 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/237 → **49/240 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 08:00 +07). Kiểm toán: 237 + 3 = 240 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/339 = 13,0% (giảm từ 13,3% — 0 thiếu mới); DR 49/240 = 20,4% (giảm từ 20,7% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (vắng 6 đợt liên tiếp).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 157: SUCCEEDED theo hồ sơ daemon (wall 10.455 s, margin 345 s)** — 2 lần đọc DB đầy đủ khớp nhau + events đầy đủ (8 event, gồm viết lại tại #57/#58 và succeeded eid 9545). Margin hẹp thứ hai từ đợt 150 (chỉ sau run 150: 177 s; hẹp hơn 156 đúng 632 s).
2. **Reboot #58 viết lại run 157 lần 2 — điểm dữ liệu (m) DƯƠNG MỚI +42,529 s, trong dải 33–49,8 s, tính cùng khung giờ thật.** Dải dương ứng viên GIỮ 33–49,8 s (không phá min/max). Điều tra (m) VẪN ĐÓNG — T7 chỉ ghi nhận, KHÔNG mở điều tra mới.
3. **Reboot #59 giữa phiên viết lại run 158 lần 1 — điểm dữ liệu (m) DƯƠNG MỚI +35,173 s, trong dải 33–49,8 s, tính cùng khung giờ thật.** Dải dương ứng viên GIỮ 33–49,8 s. Điều tra (m) VẪN ĐÓNG.
4. **n (m): số chính thức (ứng viên) VẪN = 14 theo quyết (g) đợt 156.** N ứng viên (ghi nhận, chờ parent quyết): 17 (15 dương + 2 âm, nhánh khuyến nghị #56 không phải điểm dữ liệu) hoặc 18 (15 dương + 3 âm, nhánh #56 ÂM) nếu tính cả #58 + #59. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-158 không thu hẹp được cửa: R 2,56251–2,66817 s / J 2,566–2,80753 s) — chờ parent chốt J (quyết (e) đợt 157 vẫn đứng).
5. **Cửa slot LÀNH HOÀN TOÀN lần thứ sáu liên tiếp (HB 7/7, DR 3/3, 0 muộn, 0 thiếu).** Lũy kế: HB 44/339, DR 49/240.
6. **Run 158 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.416 s, còn 2.384 s tới hạn ngân sách 02:35:51Z) — kết cục thuộc T7-159. Run 158 là run thứ ba liên tiếp bị viết lại 1 lần trở lên (156: 3 lần; 157: 2 lần; 158: 1 lần).
7. **Reboot #58/#59: số hiệu đếm tuần tự (#58 = 28366bd0, #59 = eec65561), KHÔNG lệch với T0/T2 đợt này.** Mù #90? (#58) ĐÓNG theo T2-158; #91? (#59) giao T2-159; #88? (#56) VẪN MỞ (T7 không chứng nhận mù). POSTBOOT_PASS #58 ĐÃ GHI 23:43:22Z (T5-158); #57 KHÔNG CÓ; POSTBOOT_PASS #59 giao T5-159.
8. **Claimed → finished run 157 = 11 s** (trở lại họ 7–8 s của run 154/155; khác 123 s của run 156) — chỉ ghi nhận, không suy luận cơ chế.
9. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). Mù #77? VẪN MỞ; #78?–#87? GIỮ MỞ chờ chứng nhận (T7 không chứng nhận mù). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-158-T7-1 — NOTES nháp đọc #2 ghi tuổi gốc run 158 "~3.069 s / còn ~7.731 s" — SAI 18 s (số đúng 3.087 s / 7.713 s):** lúc viết NOTES đọc #2, T7 ước tuổi từ giờ đọc làm tròn (~00:07Z) thay vì tính từ epoch đọc chính xác (00:07:18Z = 1795220838). ĐÃ SỬA: NOTES đã sửa thành 3.087 s / 7.713 s; phụ lục script tính lại từ epoch thô cho 3.087 s (khớp). Số liệu cứng không đổi (started/sched đọc đúng từ DB; chỉ phép tính nháp tuổi là sai). Bài học: tuổi run PHẢI tính từ epoch đọc ghi rõ (`date -u` lúc đọc), không ước từ giờ làm tròn — đã áp dụng cho các đọc #3–#6 (tuổi ghi kèm epoch đọc, kiểm lại bằng python).
- **F-158-T7-0 — Không có sai số nào khác trong đợt này:** 6 lần đọc DB đầy đủ khớp nhau ở mọi trường trùng (run 158) + 2 lần đọc run 157 khớp nhau + events đối chiếu trực tiếp + truy vấn requeue theo cửa + truy vấn spanning btime (có ghi rõ cách diễn giải sau khi viết lại); mọi jitter/wall/margin/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×7 slot, DR 0 s ×3 slot, run 157 wall gốc 10.455 s / margin 345 s / wall viết lại #58 1.396 s / claimed→finished 11 s, run 158 jitter 0 s, requeue #58 +42,529 s / #59 +35,173 s (created_at trực tiếp), tuổi boot #57 7.253 s / #58 8.859 s, tuổi run 158 tại btime #59 7.076 s, run 157 finished trước #59 7.421 s, run 158 tuổi gốc lúc đóng 8.416 s / còn 2.384 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở mọi lần đọc (28366bd0 → eec65561, đúng 1 lần đổi trong phiên + boot #58 lúc mở) và khớp xác minh độc lập của T0/T2-158 về 28366bd0 (T7 ghi #58 trước khi đọc cờ T0/T2 — T0 đóng 23:50Z, T2 đóng 00:31Z, T7 mở phiên 23:39Z); ở mọi lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 157 có 2 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 23:30:06.022Z, eid 9545), không suy đoán sau; btime #59 xác minh 6 nguồn + github Date (đồng hồ boot mới đúng giờ thật); 1 sleep bị SIGTERM giết do reboot #59 (~5 s sau btime — cùng mẫu đợt 156/157, không phải sai số thao tác: sleep là chu kỳ chờ đứng, T7 không spawn sleep thừa đợt này — khác F-157-T7-2).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round158-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t7/NOTES.md` + `appendix158.py` + `appendix158.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round158-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix158.py` từ epoch thô — xem file `appendix158.txt` trong round158-t7)

### Phu luc A — Run 157 (ket cuc SUCCEEDED, T7-158)
- sched 1795206951 = 2026-11-20T20:35:51Z; started GOC 1795206951 = 2026-11-20T20:35:51Z (jitter 0 s)
- started sau viet lai #57 1795208762 = 2026-11-20T21:06:02Z; sau #58 (nay) 1795216010 = 2026-11-20T23:06:50Z
- claimed 1795217395 = 2026-11-20T23:29:55Z (finished - 11 s)
- finished 1795217406 = 2026-11-20T23:30:06Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795217406 - 1795206951 = 10455 s (2h54m15s)
- han ngan sach: 1795217751 = 2026-11-20T23:35:51Z; margin: 1795217751 - 1795217406 = 345 s (0h05m45s)
- wall tu started viet lai #58: 1795217406 - 1795216010 = 1396 s (0h23m16s)
- wall tu started viet lai #57: 1795217406 - 1795208762 = 8644 s (2h24m04s)
- offset viet lai #57 (tu goc): 1811 s; #58: 9059 s
- requeue #57: 21:06:02.698Z = btime #57 + 47,698 s; requeue #58: 23:06:50.529Z = btime #58 + 42,529 s
- KHONG co event nao cho run 157 sau succeeded 23:30:06.022Z (eid 9545)

### Phu luc B — Reboot #56/#57/#58 (mo phien #58) + #59 (giua phien) T7-158
- #56: btime 1795203167 = 2026-11-20T19:32:47Z, boot 348dab54
- #57: btime 1795208715 = 2026-11-20T21:05:15Z, boot bcbaa3ad
- #58: btime 1795215968 = 2026-11-20T23:06:08Z, boot 28366bd0
- #59: btime 1795224827 = 2026-11-21T01:33:47Z, boot eec65561
- tuoi boot #57 tai #58: 7253 s (2h00m53s)
- tuoi boot #58 tai #59: 8859 s (2h27m39s)
- run 157 tuoi tu started GOC tai btime #57: 1764 s (0h29m24s)
- run 157 tuoi tu started sau #57 tai btime #58: 7206 s (2h00m06s)
- cua ung vien requeue #58: btime+33s = 2026-11-20T23:06:41Z -> btime+49,8s = 2026-11-20T23:06:57Z (49s) / 2026-11-20T23:06:58Z (50s); 1 requeue duy nhat 23:05-23:10Z (run 157, eid 9539)
- run 158 tuoi tu started GOC tai btime #59: 7076 s (1h57m56s)
- cua ung vien requeue #59: btime+33s = 2026-11-21T01:34:20Z -> btime+49,8s = 2026-11-21T01:34:36Z (49s) / 2026-11-21T01:34:37Z (50s); 1 requeue duy nhat 01:33-01:36Z (run 158, eid 9572)
- requeue #59: 01:34:22.173Z = btime + 35,173 s — TRONG dai 33-49,8 s
- run 157 finished TRUOC btime #59: 7421 s (2h03m41s) truoc -> #59 KHONG the viet lai run 157

### Phu luc C — Run 158 (van running luc dong co T7-158, BI VIET LAI 1 lan tai #59)
- sched 1795217751 = 2026-11-20T23:35:51Z; started GOC 1795217751 = 2026-11-20T23:35:51Z (jitter 0 s)
- started sau viet lai #59 1795224862 = 2026-11-21T01:34:22Z (requeue 01:34:22.173Z = btime #59 + 35,173 s)
- claimed 1795217751 = 2026-11-20T23:35:51Z (goc, khong viet lai)
- han ngan sach: 1795228551 = 2026-11-21T02:35:51Z (ngoai han co T7-158 — ket cuc thuoc T7-159)
- tuoi goc luc doc #2 (00:07:18Z): 3087 s; con 7713 s toi han
- tuoi goc luc doc #3 (00:33:12Z): 3441 s; con 7359 s toi han
- tuoi goc luc doc #4 (00:59:09Z): 4998 s; con 5802 s toi han
- tuoi goc luc doc #5 (01:24:57Z): 6546 s; con 4254 s toi han
- tuoi goc luc doc #6 (01:56:07Z): 8416 s; con 2384 s toi han

### Phu luc D — Slot HB/DR cua T7-158 (doc #1-#6, 23:40Z-01:56Z)
- HB sched 2026-11-20T22:50:50Z run 9833b07b: started 2026-11-20T22:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-20T23:20:50Z run 2759a359: started 2026-11-20T23:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-20T23:50:50Z run e68664b0: started 2026-11-20T23:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T00:20:50Z run abfdb52d: started 2026-11-21T00:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T00:50:50Z run 6194fea3: started 2026-11-21T00:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T01:20:50Z run 6732e093: started 2026-11-21T01:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T01:50:50Z run 84693f00: started 2026-11-21T01:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-20T23:00:00Z run e1928d50: started 2026-11-20T23:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T00:00:00Z run b9c20bf0: started 2026-11-21T00:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T01:00:00Z run c0ade88c: started 2026-11-21T01:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 7/7 (0 thieu, 0 muon), DR 3/3 (0 thieu) — CUA LANH HOAN TOAN (lan thu 6 lien tiep)
- Luy ke: HB 44/332 -> 44/339 (so thieu +0); DR 49/237 -> 49/240 (so thieu +0)
- Ti le thieu: HB 13,0%; DR 20,4%

### Phu luc E — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #38 AM; #39 DUONG (+40,799 s); #41 DUONG (+44,994 s); #42 DUONG (+33,236 s)
- #44 DUONG (+40,640 s); #45 AM ung vien (run 152 dang chay, 0 requeue); #46 DUONG (+48,375 s)
- #47 DUONG (+33,566 s) — viet lai lan 2 run 153
- #49 DUONG (+42,981 s) — viet lai run 154
- #50 DUONG (+49,761 s) — viet lai run 155 — VUOT max cu 48,375 s; dai moi (ung vien) 33–49,8 s
- #51 DUONG (+39,522 s) — viet lai run 155 lan 2
- #52 KHONG PHAI diem du lieu (0 run dang chay tai btime 17:19:09Z)
- #53 DUONG (+41,111 s) — viet lai run 156 lan 1
- #54 DUONG (+39,649 s) — viet lai run 156 lan 2
- #55 DUONG (+34,916 s) — viet lai run 156 lan 3
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 KHONG thu hep duoc cua: R 2,56251–2,66817 s / J 2,566–2,80753 s)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — MOI, T7-158: viet lai run 157 lan 2; TINH BANG GIO THAT (btime #58 that + epoch DB run 157 that, dong ho da sua) — diem DUONG thu hai tinh hoan toan bang gio that
- #59 DUONG (+35,173 s) — MOI, T7-158: viet lai run 158 lan 1; TINH BANG GIO THAT (btime #59 that + epoch DB run 158 that, dong ho da sua) — diem DUONG thu ba tinh hoan toan bang gio that
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet
- n ung vien theo quyet (f) dot 157 = 15 (13 duong + 2 am, nhanh khuyen nghi) hoac 16 (13 duong + 3 am, nhanh #56 AM)
- n ung vien neu tinh them #58 + #59 = 17 (15 duong + 2 am) hoac 18 (15 duong + 3 am) — CHI GHI NHAN, CHO PARENT QUYET
- Dai requeue duong ung vien GIU 33–49,8 s (khong diem duong moi pha min/max; #58 +42,529 s va #59 +35,173 s trong dai)
- LUU Y SO HIEU: 348dab54=#56 (quyet (c) dot 157); bcbaa3ad=#57; 28366bd0=#58 (quyet (s) dot 157); eec65561=#59 (T7-158, dem tuan tu)
