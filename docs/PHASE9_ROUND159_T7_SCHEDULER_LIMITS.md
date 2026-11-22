# PHASE9 ROUND159 T7 — RUN 158 SUCCEEDED (wall 10.280 s, margin 520 s — HẸP THỨ BA TỪ ĐỢT 150) + REBOOT #60 GIỮA PHIÊN VIẾT LẠI RUN 159 LẦN 1 (điểm (m) DƯƠNG MỚI +46,642 s) + CỬA SLOT LÀNH HOÀN TOÀN LẦN THỨ BẢY LIÊN TIẾP

- **Luồng:** T7 đợt 159 (lượt cron 09:35 +07 21/11/2026 = 02:35:51Z 21/11). Nhiệm vụ theo brief T7-159: (1) kết cục run 158 — run này vẫn `running` lúc T7-158 đóng cờ, hạn ngân sách 02:35:51Z; (2) run 159 (run của lượt này, started 02:35:51Z, hạn 05:35:51Z 21/11) — theo dõi trong phiên, ghi mọi lần bị viết lại kèm btime reboot tương ứng; (3) điểm (m): kiểm tra #59 có tạo điểm (m) mới nữa không (ngoài +35,173 s đã ghi); tính n ứng viên cập nhật (17 hay 18), dải có đổi không; ghi rõ #56 vẫn có điều kiện; (4) cửa slot HB/DR + lũy kế; (5) LIMITS trung thực, phụ lục bằng script. Chú ý lệch đồng hồ cell (Model 1 chạy nhanh — quyết (d) đợt 157): tính điểm (m) CÙNG KHUNG giờ thật, ghi rõ khung dùng để tính.
- **Boot trong phiên:** mở phiên là **eec65561-8a81-4f1a-99d6-a1ea81606127** (btime /proc/stat 1795224827 = 01:33:47Z — **reboot #59, GIỜ THẬT** theo quyết (s) đợt 158; T0/T2/T5-159 xác nhận độc lập); **1 reboot GIỮA PHIÊN: #60** 03:05:59Z → boot **e590ae0a-b342-425c-8787-a675fe3a6ed2** (btime /proc/stat 1795230359 = 03:05:59Z — **GIỜ THẬT**, T7 xác minh Cloudflare ±1 s lúc 03:08:18Z + T2-159 xác minh độc lập drift 1,0015 + T8-159 xác nhận btime). KHÔNG có reboot nào sau #60 (kiểm boot_id ở mọi lần đọc: ~02:40Z, ~03:07Z, ~03:38Z, ~04:04Z, ~04:29Z, ~04:55Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 158/159 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 158 §12.3 (quyết parent (a)–(u)), LIMITS T7-158 + NOTES round158-t7, cờ round159-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 158 kết cục? | **`succeeded`** 02:27:11Z (event 02:27:11.543Z, eid 9587), wall từ started gốc **10.280 s**, margin **520 s** (8m40s) tới hạn 02:35:51Z — **hẹp thứ ba từ đợt 150** (sau 150: 177 s; 157: 345 s) | §2.1, Phụ lục A |
| Run 158 có bị viết lại lần 2 không? | **KHÔNG** — chỉ 1 lần viết lại tại #59 (đã ghi ở đợt 158); 0 requeue cho run 158 sau #59; events vẫn 5 | §2.1 |
| Reboot #59 có tạo điểm (m) mới nữa không? | **KHÔNG** — đúng 1 requeue trong cửa 01:33–02:36Z (eid 9572, run 158, +35,173 s đã ghi); không có điểm (m) mới từ #59 | §2.1 |
| Reboot #60 có viết lại run nào không? | **CÓ — run 159 bị viết lại lần 1: ĐIỂM (m) DƯƠNG MỚI +46,642 s** (trong dải 33–49,8 s; tính CÙNG KHUNG giờ thật) | §2.2 |
| Run 158 có bị #60 viết lại không? | **KHÔNG** — run 158 đã finished trước #60 2.328 s (38m48s) | §2.2 |
| n mẫu (m)? | **Chính thức (ứng viên) = 14** theo quyết (g) đợt 156 — GIỮ. N ứng viên theo quyết (f) đợt 158 = **17/18**; tính cả #60 → **18 (16 dương + 2 âm, nhánh khuyến nghị) hoặc 19 (16 dương + 3 âm, nhánh #56 ÂM)** — chờ parent quyết | §2.2, §2.3, Phụ lục E |
| Dải requeue dương? | **GIỮ 33–49,8 s** — #60 +46,642 s trong dải, không phá min (33,236 s) hay max (49,761 s). Điều tra (m) VẪN ĐÓNG | §2.2 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-159 KHÔNG thu hẹp được cửa LẦN THỨ HAI** (R 2,56251–2,66817 s; J 2,566–2,80753 s; đã thử 3 hướng mới, đều âm tính) | §2.3 |
| Cửa slot đợt 159? | **CỬA LÀNH HOÀN TOÀN:** HB 6/6 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới — lần thứ bảy liên tiếp lành hoàn toàn | §2.4 |
| Run 159? | **Jitter 0 s** (started gốc = scheduled_for = 02:35:51Z), **đã bị viết lại 1 lần tại #60**, **vẫn `running` lúc đóng cờ** (~04:55Z, tuổi gốc 8.386 s, còn 2.414 s tới hạn 05:35:51Z). Kết cục thuộc T7-160 | §2.2 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–158): heartbeat **44/345 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/243 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 158 — SUCCEEDED, margin 520 s (3 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp)

Run 158 (`cf11aa1e-3799-402a-afd2-0e9b3f7e736d`, sched 1795217751 = 23:35:51Z 20/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795217751 = 23:35:51Z 20/11 |
| started_at GỐC (dispatch 23:35:51.115Z) | 23:35:51Z — jitter 0 s |
| started_at sau viết lại #59 (nay, không đổi) | 1795224862 = 01:34:22Z 21/11 |
| finished_at_utc | 1795228031 = 02:27:11Z (event `succeeded` 02:27:11.543Z, eid 9587) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795228021 = 02:27:01Z (finished − 10 s) |
| Wall từ started gốc | 1795228031 − 1795217751 = **10.280 s** (2h51m20s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795228551 = 02:35:51Z — finished TRƯỚC hạn **520 s** (8m40s) |
| Wall từ started viết lại #59 | 1795228031 − 1795224862 = 3.169 s (52m49s) |

- Events run 158 (đầy đủ, 5 event, không thiếu, không thêm sau succeeded): `dispatched` 23:35:51.115Z (eid 9547) + bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #59 (9572/9573/9574) + **`succeeded` 02:27:11.543Z (9587)**. **KHÔNG có event nào cho run 158 sau 02:27:11Z.**
- Requeue trong cửa 01:33–02:36Z (mọi job): ĐÚNG 1 (eid 9572, run 158) → **#59 KHÔNG tạo điểm (m) mới** ngoài +35,173 s đã ghi ở đợt 158. **KHÔNG có lần viết lại thứ 2 cho run 158.**
- 3 lần đọc DB đầy đủ khớp nhau ở mọi trường (đọc #1 ~02:39Z, đọc #2 ~03:07Z, đọc cuối #6 ~04:55Z) + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: **520 s** — **hẹp thứ ba từ đợt 150** (sau 150 và 157; rộng hơn 157 đúng 175 s). Xu hướng margin hẹp lại kể từ 151 (1.828 s → 345 s) **DỪNG** ở đợt này (520 s > 345 s) — T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 158 claimed 02:27:01Z (finished − 10 s) — họ 7–11 s của run 154 (7 s) / 155 (8 s) / 157 (11 s) / 158 (10 s), khác hẳn 123 s của run 156 — T7 chỉ ghi nhận, không suy luận cơ chế.
- **Wall/margin là hiệu số thuần trong khung DB nên ĐÚNG dù DB ở khung nào** (cả hai đầu đều epoch DB). Run 158 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 158 ở khung thật — xem §2.2.

### 2.2 Reboot #60 giữa phiên — viết lại run 159 lần 1, ĐIỂM (m) DƯƠNG MỚI +46,642 s (tính cùng khung giờ thật)

- **Reboot #60: boot eec65561 → e590ae0a-b342-425c-8787-a675fe3a6ed2, btime 1795230359 = 03:05:59Z 21/11.** Xác minh 6 nguồn: boot_id + btime + `uptime -s` 03:05:59Z (khớp) + journal first entry 03:06:15Z (+16 s) + wtmp begins 03:06:15Z (+16 s) + /proc/1 start 03:06:15,22Z (+16,22 s). **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare ts 1795230499 vs local 1795230498–99 lúc 03:08:18Z → ±1 s; T2-159 xác minh độc lập (drift 1,0015, btime giờ thật); T8-159 xác nhận btime 03:05:59Z. Tuổi boot #59 tới #60: 1795230359 − 1795224827 = 5.532 s (1h32m12s).
- Sleep 1.500 s của T7 (bắt đầu ~02:41:19Z) **HOÀN THÀNH BÌNH THƯỜNG, exit 0, KHÔNG bị SIGTERM giết** — khác mẫu SIGTERM-sau-btime đợt 156/157/158 (#59 giết sleep T7-158 sau ~510 s). Date cuối sleep 03:06:19Z, boot lúc đó vẫn eec65561 → reboot #60 xảy ra SAU khi sleep kết thúc (theo đồng hồ boot cũ) — xem nghịch lý đồng hồ dưới đây.
- **Run 159 ĐANG CHẠY tại btime và BỊ VIẾT LẠI (lần 1):** started_at 1795228551 → 1795230405 = 03:06:45Z; requeue event 03:06:45.642Z (eid 9599, "daemon startup recovery") = **btime + 46,642 s**. Dispatched 03:06:45.788Z (9600) + reattached 03:06:45.872Z (9601). Claimed_at VẪN 1795228551 (gốc). Chỉ 1 requeue trong cửa 03:05–03:09Z (mọi job — run 159, eid 9599). Tuổi run 159 từ started gốc tại btime: 1795230359 − 1795228551 = 1.808 s (30m08s).
- **Run 158 KHÔNG bị #60 viết lại:** đã finished trước #60 2.328 s (38m48s) trong khung thật.
- Truy vấn runs đang chạy tại btime #60 mà KHÔNG bị viết lại (sched < btime, started < btime, finished NULL hoặc > btime): 0 dòng → không có run nào khác đang chạy tại btime mà thoát viết lại. (Truy vấn spanning theo started_at HIỆN TẠI cũng 0 dòng — đúng như dự kiến vì started_at run 159 đã viết lại thành 1795230405 > btime; bằng chứng là event requeue + started_at đổi — cùng caveat T7-157/T7-158 §2.4.)
- **Offset +46,642 s TRONG dải 33–49,8 s** (không phá min 33,236 s #42, không vượt max 49,761 s #50). **Khung giờ #60 SẠCH:** btime #60 giờ thật (Cloudflare ±1 s lúc 03:08:18Z, 93 s sau requeue + T2-159 drift 1,0015) + epoch DB run 159 giờ thật (dispatch sau khi sửa đồng hồ #56) → offset tính trong MỘT khung thật, cùng loại điểm #57 (+47,698 s) / #58 (+42,529 s) / #59 (+35,173 s). **Đây là điểm (m) DƯƠNG thứ tư tính hoàn toàn bằng giờ thật.**
- **Nghịch lý đồng hồ #60 (ghi nhận đầy đủ, KHÔNG làm sai lệch offset):** sleep tail đọc boot cũ lúc đồng hồ cũ 03:06:19Z, TRỄ HƠN btime #60 (03:05:59Z) ≥20 s. Cùng mẫu đã thấy ở #59 (T5-159: watcher-158 poll cuối 01:34:06Z đồng hồ boot cũ, btime #59 01:33:47Z → ≥+19 s; T2-159 xác nhận độc lập bằng sampler 01:34:05Z) và #58 (T2-158: đồng hồ cũ nhanh ~+28 s lúc chết). Cơ chế nhất quán qua 3 reboot liên tiếp: **đồng hồ boot cũ chạy nhanh ~+19–28 s lúc chết**, boot mới khởi động với đồng hồ ĐÚNG (đã xác minh #58/#59/#60 bằng github/Cloudflare ngay sau boot). Không có dịch vụ NTP nào trên boot mới (`systemd-timesyncd` not-found; journal không có dòng timesync/ntp/chrony; journal 03:06:15→19 rồi 03:06:49 — không có bước nhảy giờ nào quan sát được) → không có bằng chứng đồng hồ mới bị bước nhảy sau boot. Offset (m) tính từ 2 mốc đều ghi trên boot mới (btime + requeue) nên KHÔNG bị nghịch lý này làm sai lệch — cùng nguyên tắc T2-158 đã nêu cho #58. T7 ghi nhận nghịch lý này là dữ kiện độc lập (lần thứ ba liên tiếp), không tự kết luận cơ chế đồng hồ.
- **KHÔNG có slot nào mất tại #60:** HB 03:20:50Z dispatched 03:15:34Z (sau btime #60 9m35s, jitter chuẩn −316 s — xem §2.4); DR 03:00Z finished 03:00:00Z (trước btime #60). Daemon hồi phục trước slot tiếp theo.
- **KHÔNG có mâu thuẫn khung giờ mới tại #60:** event cuối trước btime đều trước btime, thứ tự xuôi; requeue trong dải.
- Mù cho #60 (#92? theo quy tắc +32) giao T2-160; POSTBOOT_PASS #60 giao T5-160 (không thuộc đợt này). Watcher-159 (pid 18158, T5-159 khởi động 02:41:21Z) CHẾT theo #60 — giao T5-160 ghi nhận.

### 2.3 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-159 KHÔNG thu hẹp được cửa LẦN THỨ HAI

- T2-159 DONE ~04:08Z (đọc cờ, đối chiếu chéo): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ HAI** — R 2,56251–2,66817 s; J 2,566–2,80753 s (đã thử 3 hướng mới, đều âm tính: D re-scan 363 file/0 giây mới; grep c99a1045 trong cờ 159 = 0; git log không có vì repo-1 không phải git repo); n GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 18 (16 dương + 2 âm, tính cả #60); nếu J < 2.807 s → #56 là điểm ÂM → n = 19 (16 dương + 3 âm). T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng):** #38 ÂM, #39/#41/#42/#44/#46/#47/#49/#50/#51/#53/#54/#55/#57/#58/#59/#60 DƯƠNG (16 dương), #45 ÂM (ứng viên), #56 CÓ ĐIỀU KIỆN → **n ứng viên = 18 (nhánh khuyến nghị) hoặc 19 (nhánh #56 ÂM)**. **Số chính thức (ứng viên) = 14 theo quyết (g) đợt 156; n ứng viên theo quyết (f) đợt 158 = 17/18 — GIỮ cho tới khi parent quyết #56/#60.**
- LƯU Ý ĐỐI CHIẾU n: T2-159 ghi "n ứng viên 17/18" (chưa tính #60 — T2 chỉ ghi #60 cho INSIDE); T7-159 tính cả #60 → 18/19. Chênh này là khác phạm vi đếm, không phải mâu thuẫn số liệu — giao T10-159/parent chốt (xem §5.4).
- T2-159 thêm: mù #91? (#59) ĐÓNG; mù #88? (#56) VẪN MỞ (hole-recheck 345 hit, 0 mốc mới — lần thứ ba liên tiếp); mù #77? VẪN MỞ. INSIDE: #59 NGOÀI dải FULL105 (muộn 445 s) → chuỗi GIỮ 4, không lên 5; #60 INSIDE FULL106 → chuỗi mới bắt đầu từ #60. CERT91/FULL106 ứng viên có điều kiện; CERT/FULL chính thức GIỮ 76/91.

### 2.4 Run 159 — jitter 0 s, đã bị viết lại 1 lần tại #60, vẫn running lúc đóng cờ

Run 159 (`e0526962-bc96-421e-85c6-1552d533fbfb`, sched 1795228551 = 02:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795228551 | 02:35:51Z 21/11 |
| dispatched (event) | — | 02:35:51.099Z (eid 9589) |
| started_at GỐC | 1795228551 | 02:35:51Z — **jitter 0 s** |
| started_at sau viết lại #60 (nay) | 1795230405 | 03:06:45Z 21/11 |
| worker_claimed_at | 1795228551 | 02:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795239351 | 05:35:51Z 21/11 |

- 6 lần đọc DB đầy đủ trong phiên: status `running` ở cả 6 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #60 — khớp 1 event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` 02:35:51.099Z (9589) + 1 bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #60 (9599/9600/9601) — không có event nào khác.
- Tuổi run từ gốc: 257 s lúc đọc #1 (02:40:08Z), 1.877 s lúc đọc #2 (03:07:08Z), 3.766 s lúc đọc #3 (03:38:37Z), 5.289 s lúc đọc #4 (04:04:00Z), 6.811 s lúc đọc #5 (04:29:22Z), **8.386 s lúc đọc cuối #6 (04:55:37Z)** — còn 2.414 s tới hạn ngân sách 05:35:51Z. **Kết cục thuộc T7-160.**
- Jitter 0 s — lần thứ mười hai liên tiếp run vcut jitter 0 (157 là lần thứ mười, 158 là lần thứ mười một).
- Run 159 là run thứ tư liên tiếp bị viết lại 1 lần trở lên (156: 3 lần; 157: 2 lần; 158: 1 lần; 159: 1 lần).

### 2.5 Slot HB/DR trong cửa 02:00Z → 04:55Z 21/11 — HB 6/6 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN LẦN THỨ BẢY LIÊN TIẾP

Cửa kiểm ~2h56' (6 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:20:50 (02:20:50Z) | 192d04a6 | 02:15:34 | −316 s | CÓ |
| 09:50:50 (02:50:50Z) | 0c102d77 | 02:45:34 | −316 s | CÓ |
| 10:20:50 (03:20:50Z) | 95a0df20 | 03:15:34 | −316 s | CÓ |
| 10:50:50 (03:50:50Z) | 8e100407 | 03:45:34 | −316 s | CÓ |
| 11:20:50 (04:20:50Z) | ad639b92 | 04:15:34 | −316 s | CÓ |
| 11:50:50 (04:50:50Z) | 0d2a4ef4 | 04:45:34 | −316 s | CÓ |

- 6/6 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (vắng 7 đợt liên tiếp: 153, 154, 155, 156, 157, 158, 159).
- Slot HB 01:50:50Z đã đếm ở đợt 158 — T7-159 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:00 (02:00Z) | f93ed946 | 02:00:00 | 0 s | CÓ |
| 10:00 (03:00Z) | c9f8cbaf | 03:00:00 | 0 s | CÓ |
| 11:00 (04:00Z) | c4aefeb6 | 04:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 01:00Z đã đếm ở đợt 158 — không đếm lại. Slot HB 05:20:50Z + DR 05:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-160.

### 2.6 Số hiệu reboot — #60 đếm tuần tự, giao parent/T2-160 chốt mù

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật — quyết (c) đợt 157), #57 = bcbaa3ad (21:05:15Z, giờ thật — T7-157), #58 = 28366bd0 (23:06:08Z, giờ thật — quyết (s) đợt 157; T0/T2-158 + T7-158 xác minh độc lập), #59 = eec65561 (01:33:47Z, giờ thật — T7-158 xác minh 6 nguồn), #60 = e590ae0a (03:05:59Z, giờ thật — T7-159 xác minh 6 nguồn + T2-159 drift 1,0015 + T8-159 xác nhận btime).
- KHÔNG có lệch số hiệu đợt này. T7 dùng số hiệu tuần tự (#59/#60) xuyên suốt file này và phụ lục; mọi boot_id/btime đều ghi đầy đủ để đối chiếu.
- Mù đi kèm: #91? (#59) ĐÓNG theo T2-159; #92? (#60) giao T2-160 (T7 không chứng nhận mù nào). POSTBOOT_PASS #59 ĐÃ GHI 02:41:22Z (T5-159); #60 giao T5-160.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 158/159 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này không bắt được phép tính nháp sai nào — xem §6). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 01:34:22.173Z, 03:06:45.642Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này cả hai điểm (m) liên quan (#59 đã ghi + #60 mới) đều tính trong MỘT khung thật nên không cần hiệu chỉnh J (xem §2.1/§2.2).
4. Cửa kiểm đợt này ~2h56' (02:00Z → 04:55Z 21/11), đủ 6 slot HB + 3 slot DR + run vcut 158 (kết cục) và 159 (theo dõi). Sáu lần đọc DB đầy đủ; run 159 được đọc đầy đủ 6 lần khớp hoàn toàn nhau ở mọi trường trùng (trừ started_at đổi đúng 1 lần tại #60); run 158 được đọc đầy đủ 3 lần khớp hoàn toàn nhau; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 01:50:50Z + DR 01:00Z thuộc cửa 158 theo quy ước đứng (T7-158 đã đếm); slot DR 02:00Z + HB 02:20:50Z thuộc cửa 159 (sau kiểm cuối T7-158 lúc 01:56Z). HB 05:20:50Z + DR 05:00Z thuộc cửa T7-160.
6. **0 sleep bị giết trong phiên này** (sleep 1.500 s ×5 hoàn thành bình thường, exit 0 — sleep đầu tiên kết thúc 03:06:19Z, ngay trước reboot #60; khác đợt 156/157/158 đều có 1 sleep bị SIGTERM giết sau btime). Boot đổi eec65561 → e590ae0a: 1 lần đổi trong phiên (tại #60), cộng boot #59 lúc mở.
7. T7 đóng cờ ~04:57Z — trong hạn cờ ~05:00Z (~3' còn), trong hạn cứng toàn đợt 05:30Z (~33' còn). Run 159 vẫn running lúc đóng cờ — kết cục thuộc T7-160 (hạn ngân sách 05:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix159.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 158, cùng phương pháp)

- Heartbeat: 44/339 → **44/345 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 11:50:50 +07). Kiểm toán cửa sổ: 339 + 6 slot mới = 345 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/240 → **49/243 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 11:00 +07). Kiểm toán: 240 + 3 = 243 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/345 = 12,8% (giảm từ 13,0% — 0 thiếu mới); DR 49/243 = 20,2% (giảm từ 20,4% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (vắng 7 đợt liên tiếp).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 158: SUCCEEDED theo hồ sơ daemon (wall 10.280 s, margin 520 s)** — 3 lần đọc DB đầy đủ khớp nhau + events đầy đủ (5 event, gồm viết lại tại #59 và succeeded eid 9587). Margin hẹp thứ ba từ đợt 150 (sau 150: 177 s và 157: 345 s; rộng hơn 157 đúng 175 s — chuỗi hẹp lại từ 151 DỪNG).
2. **Reboot #59 KHÔNG tạo điểm (m) mới** ngoài +35,173 s đã ghi (đúng 1 requeue trong cửa 01:33–02:36Z; run 158 KHÔNG bị viết lại lần 2).
3. **Reboot #60 giữa phiên viết lại run 159 lần 1 — điểm dữ liệu (m) DƯƠNG MỚI +46,642 s, trong dải 33–49,8 s, tính cùng khung giờ thật.** Dải dương ứng viên GIỮ 33–49,8 s (không phá min/max). Điều tra (m) VẪN ĐÓNG — T7 chỉ ghi nhận, KHÔNG mở điều tra mới.
4. **n (m): số chính thức (ứng viên) VẪN = 14 theo quyết (g) đợt 156; n ứng viên theo quyết (f) đợt 158 = 17/18.** N ứng viên (ghi nhận, chờ parent quyết) nếu tính cả #60: **18 (16 dương + 2 âm, nhánh khuyến nghị) hoặc 19 (16 dương + 3 âm, nhánh #56 ÂM)**. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-159 không thu hẹp được cửa lần thứ hai: R 2,56251–2,66817 s / J 2,566–2,80753 s) — chờ parent chốt J (quyết (e) đợt 157 vẫn đứng). Chênh n giữa T2-159 (17/18, chưa tính #60) và T7-159 (18/19, tính cả #60) là khác phạm vi đếm — giao T10-159/parent chốt.
5. **Cửa slot LÀNH HOÀN TOÀN lần thứ bảy liên tiếp (HB 6/6, DR 3/3, 0 muộn, 0 thiếu).** Lũy kế: HB 44/345, DR 49/243.
6. **Run 159 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.386 s, còn 2.414 s tới hạn ngân sách 05:35:51Z) — kết cục thuộc T7-160. Run 159 là run thứ tư liên tiếp bị viết lại 1 lần trở lên (156: 3 lần; 157: 2 lần; 158: 1 lần; 159: 1 lần).
7. **Nghịch lý đồng hồ (mẫu thứ ba liên tiếp): đồng hồ boot cũ chạy nhanh ~+19–28 s lúc chết** (#58: +28 s; #59: +19 s; #60: +20 s) — T7 chỉ ghi nhận, không suy luận cơ chế; offset (m) #60 không bị ảnh hưởng (requeue + btime đều ghi trên boot mới, khung thật — cùng nguyên tắc T2-158 đã nêu cho #58).
8. **Reboot #60: số hiệu đếm tuần tự (#60 = e590ae0a), KHÔNG lệch với T2/T8 đợt này.** Mù #91? (#59) ĐÓNG theo T2-159; #92? (#60) giao T2-160; #88? (#56) VẪN MỞ; #77? VẪN MỞ (T7 không chứng nhận mù). POSTBOOT_PASS #59 ĐÃ GHI 02:41:22Z (T5-159); POSTBOOT_PASS #60 giao T5-160; watcher-159 pid 18158 chết theo #60 (giao T5-160).
9. **Claimed → finished run 158 = 10 s** (họ 7–11 s của run 154/155/157/158; khác 123 s của run 156) — chỉ ghi nhận, không suy luận cơ chế.
10. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-159-T7-1 — Kiểm đồng hồ bằng github Date lần đầu cho kết quả nhiễu (local 02:40:08Z vs github Date 02:40:01 GMT, tưởng lệch ~7 s):** kiểm lại 3 mẫu trong 5 s cho −8/0/−8 s — github Date dao động do edge/CDN, không phải chuẩn đồng hồ ổn định (T0-159 cũng ghi GitHub −7,05 s "edge lag, không dùng làm chuẩn"). ĐÃ SỬA: không kết luận lệch đồng hồ từ github; xác minh bằng Cloudflare ts (1795228844 vs local 1795228842–43 → ±1–2 s) và Cloudflare lại lúc 03:08:18Z (±1 s). Số liệu cứng không đổi (không có mốc nào tính từ github Date). Bài học: github Date chỉ dùng làm kiểm chéo, không dùng làm mốc duy nhất — đã áp dụng cho cả hai lần kiểm đồng hồ đợt này.
- **F-159-T7-0 — Không có sai số nào khác trong đợt này:** 6 lần đọc DB đầy đủ khớp nhau ở mọi trường trùng (run 159) + 3 lần đọc run 158 khớp nhau + events đối chiếu trực tiếp + truy vấn requeue theo cửa + truy vấn spanning btime (có ghi rõ cách diễn giải sau khi viết lại); mọi jitter/wall/margin/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×3 slot, run 158 wall gốc 10.280 s / margin 520 s / wall viết lại #59 3.169 s / claimed→finished 10 s, run 159 jitter 0 s, requeue #60 +46,642 s (created_at trực tiếp), tuổi boot #59 5.532 s, tuổi run 159 tại btime #60 1.808 s, run 158 finished trước #60 2.328 s, run 159 tuổi gốc lúc đóng 8.386 s / còn 2.414 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở mọi lần đọc (eec65561 → e590ae0a, đúng 1 lần đổi trong phiên + boot #59 lúc mở) và khớp xác minh độc lập của T2/T8-159 về e590ae0a (T7 ghi #60 trước khi đọc cờ T2/T8 — T2 đóng ~04:08Z, T8 đóng 03:35Z, T7 phát hiện #60 lúc ~03:07Z); ở mọi lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 158 có 3 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 02:27:11.543Z, eid 9587), không suy đoán sau; btime #60 xác minh 6 nguồn + Cloudflare Date (đồng hồ boot mới đúng giờ thật); 0 sleep bị SIGTERM giết trong phiên này (5 sleep 1.500 s hoàn thành bình thường — khác 3 đợt trước đều có 1 sleep bị giết sau btime).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round159-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t7/NOTES.md` + `appendix159.py` + `appendix159.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round159-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix159.py` từ epoch thô — xem file `appendix159.txt` trong round159-t7)

### Phu luc A — Run 158 (ket cuc SUCCEEDED, T7-159)
- sched 1795217751 = 2026-11-20T23:35:51Z; started GOC 1795217751 = 2026-11-20T23:35:51Z (jitter 0 s)
- started sau viet lai #59 1795224862 = 2026-11-21T01:34:22Z (requeue 01:34:22.173Z = btime #59 + 35,173 s)
- claimed 1795228021 = 2026-11-21T02:27:01Z (finished - 10 s)
- finished 1795228031 = 2026-11-21T02:27:11Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795228031 - 1795217751 = 10280 s (2h51m20s)
- han ngan sach: 1795228551 = 2026-11-21T02:35:51Z; margin: 1795228551 - 1795228031 = 520 s (0h08m40s)
- wall tu started viet lai #59: 1795228031 - 1795224862 = 3169 s (0h52m49s)
- finished sau btime #59: 1795228031 - 1795224827 = 3204 s (0h53m24s)
- KHONG co event nao cho run 158 sau succeeded 02:27:11.543Z (eid 9587)

### Phu luc B — Reboot #59 (mo phien) + #60 (giua phien) T7-159
- #59: btime 1795224827 = 2026-11-21T01:33:47Z, boot eec65561
- #60: btime 1795230359 = 2026-11-21T03:05:59Z, boot e590ae0a
- tuoi boot #59 tai #60: 5532 s (1h32m12s)
- requeue #59: 01:34:22.173Z = btime + 35,173 s (T7-158, da ghi)
- requeue #60: 03:06:45.642Z = btime + 46,642 s — TRONG dai 33-49,8 s
- run 159 tuoi tu started GOC tai btime #60: 1808 s (0h30m08s)
- cua ung vien requeue #60: btime+33s = 2026-11-21T03:06:32Z -> btime+49,8s = 2026-11-21T03:06:48Z (49s) / 2026-11-21T03:06:49Z (50s); 1 requeue duy nhat 03:05-03:09Z (run 159, eid 9599)
- run 158 finished TRUOC btime #60: 2328 s (0h38m48s) truoc -> #60 KHONG the viet lai run 158

### Phu luc C — Run 159 (van running luc dong co T7-159, BI VIET LAI 1 lan tai #60)
- sched 1795228551 = 2026-11-21T02:35:51Z; started GOC 1795228551 = 2026-11-21T02:35:51Z (jitter 0 s)
- started sau viet lai #60 1795230405 = 2026-11-21T03:06:45Z (requeue 03:06:45.642Z = btime #60 + 46,642 s)
- claimed 1795228551 = 2026-11-21T02:35:51Z (goc, khong viet lai)
- han ngan sach: 1795239351 = 2026-11-21T05:35:51Z (ngoai han co T7-159 — ket cuc thuoc T7-160)
- tuoi goc luc doc #1 (02:40:08Z): 257 s; con 10543 s toi han
- tuoi goc luc doc #2 (03:07:08Z): 1877 s; con 8923 s toi han
- tuoi goc luc doc #3 (03:38:37Z): 3766 s; con 7034 s toi han
- tuoi goc luc doc #4 (04:04:00Z): 5289 s; con 5511 s toi han
- tuoi goc luc doc #5 (04:29:22Z): 6811 s; con 3989 s toi han
- tuoi goc luc doc #6 (04:55:37Z): 8386 s; con 2414 s toi han

### Phu luc D — Slot HB/DR cua T7-159 (doc #1-#6, 02:40Z-04:55Z)
- HB sched 2026-11-21T02:20:50Z run 192d04a6: started 2026-11-21T02:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T02:50:50Z run 0c102d77: started 2026-11-21T02:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T03:20:50Z run 95a0df20: started 2026-11-21T03:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T03:50:50Z run 8e100407: started 2026-11-21T03:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T04:20:50Z run ad639b92: started 2026-11-21T04:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T04:50:50Z run 0d2a4ef4: started 2026-11-21T04:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-21T02:00:00Z run f93ed946: started 2026-11-21T02:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T03:00:00Z run c9f8cbaf: started 2026-11-21T03:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T04:00:00Z run c4aefeb6: started 2026-11-21T04:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (0 thieu, 0 muon), DR 3/3 (0 thieu) — CUA LANH HOAN TOAN (lan thu 7 lien tiep)
- Luy ke: HB 44/339 -> 44/345 (so thieu +0); DR 49/240 -> 49/243 (so thieu +0)
- Ti le thieu: HB 12,8%; DR 20,2%

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
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 + T2-159 KHONG thu hep duoc cua: R 2,56251–2,66817 s / J 2,566–2,80753 s)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — viet lai run 157 lan 2; TINH BANG GIO THAT (btime #58 that + epoch DB run 157 that, dong ho da sua) — diem DUONG thu hai tinh hoan toan bang gio that
- #59 DUONG (+35,173 s) — viet lai run 158 lan 1; TINH BANG GIO THAT (btime #59 that + epoch DB run 158 that, dong ho da sua) — diem DUONG thu ba tinh hoan toan bang gio that
- #60 DUONG (+46,642 s) — MOI, T7-159: viet lai run 159 lan 1; TINH BANG GIO THAT (btime #60 that, Cloudflare ±1 s luc 03:08:18Z + drift 1,0015 cua T2-159) — diem DUONG thu tu tinh hoan toan bang gio that
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet
- n ung vien theo quyet (f) dot 158 = 17 (15 duong + 2 am, nhanh khuyen nghi) hoac 18 (15 duong + 3 am, nhanh #56 AM)
- n ung vien neu tinh them #60 = 18 (16 duong + 2 am) hoac 19 (16 duong + 3 am) — CHI GHI NHAN, CHO PARENT QUYET
- Dai requeue duong ung vien GIU 33–49,8 s (khong diem duong moi pha min/max; #60 +46,642 s trong dai)
- LUU Y SO HIEU: 348dab54=#56 (quyet (c) dot 157); bcbaa3ad=#57; 28366bd0=#58 (quyet (s) dot 157); eec65561=#59 (T7-158, dem tuan tu); e590ae0a=#60 (T7-159 + T2-159 + T8-159 xac minh doc lap)
