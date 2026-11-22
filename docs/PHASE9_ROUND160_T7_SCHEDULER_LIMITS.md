# PHASE9 ROUND160 T7 — RUN 159 SUCCEEDED (wall 9.497 s, margin 1.303 s — RỘNG THỨ HAI TỪ ĐỢT 150) + VIẾT LẠI LẦN 2 DO DAEMON RESTART KHÔNG KÈM REBOOT (LẦN ĐẦU QUAN SÁT) + REBOOT #61 KHÔNG TẠO ĐIỂM (m) (0 RUN ĐANG CHẠY, CÙNG MẪU #52) + CỬA SLOT LÀNH HOÀN TOÀN LẦN THỨ TÁM LIÊN TIẾP

- **Luồng:** T7 đợt 160 (lượt cron 12:35 +07 21/11/2026 = 05:35:51Z 21/11). Nhiệm vụ theo brief T7-160: (1) kết cục run 159 — run này vẫn `running` lúc T7-159 đóng cờ, hạn ngân sách 05:35:51Z — ĐÚNG lúc đợt 160 mở; run đã bị viết lại 1 lần tại reboot #60; (2) kiểm kết cục cuối: SUCCEEDED/FAILED/cancelled? Giờ kết thúc, margin tới hạn 05:35:51Z, có bị viết lại lần 2 không (đặc biệt do reboot #61 ứng viên btime 05:25:49Z — ngay trước hạn)?; (3) điểm (m): kiểm reboot #61 ứng viên có tạo điểm (m) mới không (requeue? chênh giờ?); cập nhật n ứng viên; số chính thức GIỮ 14 cho tới khi #56 chốt; dải GIỮ 33–49,8 s; điều tra VẪN ĐÓNG; #56 VẪN CÓ ĐIỀU KIỆN; (4) cửa slot HB/DR + lũy kế; (5) LIMITS trung thực, phụ lục bằng script. Chú ý sai số F-159-T7-1: github Date nhiễu ±8 s — xác minh giờ bằng Cloudflare/giờ thật.
- **Boot trong phiên:** mở phiên là **52c957d5-a8dd-4523-822f-acfcde535d3b** (btime /proc/stat 1795238749 = 05:25:49Z — **reboot #61 ứng viên, GIỜ THẬT**; T0-160 + T2-160 xác minh độc lập); **KHÔNG có reboot nào trong phiên** (kiểm boot_id ở mọi lần đọc: ~05:38Z, ~06:05Z, ~06:31Z, ~06:56Z, ~07:22Z, ~07:47Z — đều 52c957d5, btime 05:25:49Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 159/160 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 159 §12.3 (quyết parent (a)–(w)), LIMITS T7-159 + NOTES round159-t7, cờ round160-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 159 kết cục? | **`succeeded`** 05:14:08Z (event 05:14:08.721Z, eid 9629), wall từ started gốc **9.497 s**, margin **1.303 s** (21m43s) tới hạn 05:35:51Z — **rộng thứ hai từ đợt 150** (sau 151: 1.828 s) | §2.1, Phụ lục A |
| Run 159 có bị viết lại lần 2 không? | **CÓ — lúc 05:09:18Z, do DAEMON RESTART KHÔNG KÈM REBOOT** (eid 9626, "daemon startup recovery") — **lần đầu tiên quan sát được viết lại không kèm reboot**; KHÔNG phải do #61 (xảy ra 991 s TRƯỚC btime #61) | §2.2 |
| Reboot #61 có viết lại run 159 không? | **KHÔNG** — run 159 đã finished trước #61 701 s (11m41s) | §2.2, §2.3 |
| Reboot #61 có tạo điểm (m) mới không? | **KHÔNG — #61 KHÔNG PHẢI điểm dữ liệu (m)**: 0 run đang chạy tại btime 05:25:49Z; 0 requeue trong cửa 05:25:49–05:35:51Z (mọi job) — cùng mẫu #52 | §2.3 |
| n mẫu (m)? | **Chính thức (ứng viên) = 14** theo quyết (g) đợt 156 — GIỮ. N ứng viên theo quyết (f) đợt 159 = **18 (16 dương + 2 âm, nhánh khuyến nghị) hoặc 19 (16 dương + 3 âm, nhánh #56 ÂM)** — GIỮ, #61 không đổi | §2.3, §2.4, Phụ lục E |
| Dải requeue dương? | **GIỮ 33–49,8 s** — #61 không có requeue nào, không phá min (33,236 s) hay max (49,761 s). Điều tra (m) VẪN ĐÓNG | §2.3 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-160 KHÔNG thu hẹp được cửa LẦN THỨ BA** (R 2,56251–2,66817 s; J 2,566–2,80753 s; đã thử 3 hướng mới, đều âm tính) | §2.4 |
| Cửa slot đợt 160? | **CỬA LÀNH HOÀN TOÀN:** HB 6/6 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới — lần thứ tám liên tiếp lành hoàn toàn | §2.6 |
| Run 160? | **Jitter 0 s** (started gốc = scheduled_for = 05:35:51Z), **0 lần viết lại tới lúc đóng cờ**, **vẫn `running` lúc đóng cờ** (~07:47Z, tuổi gốc 7.893 s, còn 2.907 s tới hạn 08:35:51Z). Kết cục thuộc T7-161 | §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–159): heartbeat **44/351 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/246 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 159 — SUCCEEDED, margin 1.303 s (6 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp)

Run 159 (`e0526962-bc96-421e-85c6-1552d533fbfb`, sched 1795228551 = 02:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795228551 = 02:35:51Z 21/11 |
| started_at GỐC (dispatch 02:35:51.099Z) | 02:35:51Z — jitter 0 s |
| started_at sau viết lại #60 (03:06:45Z) | 1795230405 = 03:06:45Z 21/11 |
| started_at sau viết lại lần 2 (05:09:18Z, nay) | 1795237758 = 05:09:18Z 21/11 |
| finished_at_utc | 1795238048 = 05:14:08Z (event `succeeded` 05:14:08.721Z, eid 9629) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795237982 = 05:13:02Z (finished − 66 s) |
| Wall từ started gốc | 1795238048 − 1795228551 = **9.497 s** (2h38m17s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795239351 = 05:35:51Z — finished TRƯỚC hạn **1.303 s** (21m43s) |
| Wall từ started viết lại lần 2 | 1795238048 − 1795237758 = 290 s (4m50s) |
| Wall từ started viết lại lần 1 (#60) | 1795238048 − 1795230405 = 7.643 s (2h07m23s) |

- Events run 159 (đầy đủ, 8 event, không thiếu, không thêm sau succeeded): `dispatched` 02:35:51.099Z (eid 9589) + bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #60 (9599/9600/9601) + bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại 05:09:18Z (9626/9627/9628) + **`succeeded` 05:14:08.721Z (9629)**. **KHÔNG có event nào cho run 159 sau 05:14:08Z** (kiểm lại ở đọc cuối #6: 0 event mới sau eid 9629).
- 6 lần đọc DB đầy đủ trong phiên khớp nhau ở mọi trường (đọc #1 ~05:38Z, #2 ~06:05Z, #3 ~06:31Z, #4 ~06:56Z, #5 ~07:22Z, #6 ~07:47Z). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: **1.303 s** — **rộng thứ hai từ đợt 150** (sau 151: 1.828 s; rộng hơn 158 đúng 783 s). Xu hướng margin hẹp lại kể từ 151 (1.828 s → 345 s) đã dừng ở 158 (520 s) và ĐẢO CHIỀU RÕ ở đợt này (1.303 s) — T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 159 claimed 05:13:02Z (finished − **66 s**) — KHÁC HẲN họ 7–11 s của run 154 (7 s) / 155 (8 s) / 157 (11 s) / 158 (10 s). Đây là lần đầu tiên claimed→finished vượt khỏi họ 7–11 s kể từ đợt 154 — T7 chỉ ghi nhận, không suy luận cơ chế.
- **Run 159 là run thứ tư liên tiếp bị viết lại 1 lần trở lên** (156: 3 lần; 157: 2 lần; 158: 1 lần; 159: **2 lần**) — nhưng lần 2 của 159 KHÔNG do reboot (xem §2.2). Run 160 tới lúc đóng cờ 0 lần viết lại — chuỗi có thể đứt ở 160, kết cục thuộc T7-161.

### 2.2 Viết lại lần 2 lúc 05:09:18Z — DAEMON RESTART KHÔNG KÈM REBOOT (lần đầu quan sát; KHÔNG phải điểm (m))

- **Requeue eid 9626, 05:09:18.002Z, detail "daemon startup recovery"** — started_at 1795230405 (03:06:45Z) → 1795237758 (05:09:18Z). Dispatched 05:09:18.064Z (9627) + reattached 05:09:18.109Z (9628, "re-keyed waiter on active execute turn"). Claimed_at VẪN 1795228551 (gốc, không viết lại).
- **CHỨNG MINH không phải reboot:** cờ `round159-t10.done` mtime **05:12:39Z** (SAU 05:09:18Z) ghi "boot lúc đóng e590ae0a (btime 03:05:59Z) — KHÔNG reboot mới trong lúc đóng" → boot #60 vẫn sống sau 05:09:18Z. T10-159 đóng sổ trên boot #60, sau thời điểm requeue. **Đây là lần đầu tiên quan sát được viết lại do daemon restart KHÔNG kèm reboot** — mọi lần viết lại trước đây (#59/#60 và các đợt trước) đều kèm reboot.
- **Viết lại lần 2 xảy ra 991 s TRƯỚC btime #61** (1795238749 − 1795237758 = 991 s) → KHÔNG THỂ do #61 gây ra (nguyên nhân phải trước hệ quả). Run 159 finished 05:14:08Z, trước btime #61 701 s → #61 cũng không thể viết lại run 159.
- Cửa 05:08–05:11Z (mọi job): ĐÚNG 1 requeue (run 159, eid 9626). Truy vấn spanning 05:09:18Z: 0 dòng → không có run nào khác đang chạy tại 05:09:18Z mà thoát viết lại (caveat: run 159 tự nó bị loại khỏi spanning vì started_at hiện tại = đúng mốc sự kiện; bằng chứng là event requeue + started_at đổi — cùng caveat T7-157/T7-158/T7-159 §2.4). → Lúc 05:09:18Z, **run 159 là run DUY NHẤT đang chạy**.
- **Viết lại lần 2 KHÔNG phải điểm (m):** không có btime/reboot đi kèm → không có offset btime→requeue để tính. Ghi nhận là dữ kiện độc lập (daemon restart giữa phiên), KHÔNG đưa vào mẫu (m). T7 không có bằng chứng về nguyên nhân daemon restart (crash? deploy? restart tay?) — không suy đoán; giao parent/T10 ghi nhận.

### 2.3 Reboot #61 (btime 05:25:49Z) — 0 requeue, 0 run đang chạy: KHÔNG PHẢI điểm dữ liệu (m), cùng mẫu #52

- **Reboot #61: boot e590ae0a → 52c957d5-a8dd-4523-822f-acfcde535d3b, btime 1795238749 = 05:25:49Z 21/11.** Xác minh T7 (lúc mở + đọc #1): boot_id + btime + `uptime -s` 05:25:49Z (khớp) + /proc/1 start 05:26:00,46Z (+11 s) + ps lstart 05:25:59Z (+10 s) + journal first entry 05:26:00Z (+11 s) + wtmp begins 05:26:00Z (+11 s). **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare ts 1795239548 vs local 1795239547 lúc ~05:39Z → local chậm 1 s (trong ±1 s); kiểm lại cuối phiên 07:47Z: Cloudflare ts 1795247245 vs local 1795247244 → local chậm 1 s (trong ±1 s). **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1; T0-160 cũng ghi GitHub −7,3..−7,7 s edge lag). Tuổi boot #60 tới #61: 1795238749 − 1795230359 = 8.390 s (2h19m50s).
- **#61 xảy ra SAU T10-159 đóng (~05:12Z, mtime cờ 05:12:39Z) và TRƯỚC khi đợt 160 mở (05:35:51Z)** — tức là giữa hai đợt, không giữa phiên T7 nào. T0-160 xác minh độc lập 7 nguồn (khớp T7); T2-160 xác minh độc lập (drift 1,0013, btime giờ thật).
- **0 requeue do #61:** cửa 05:25:49–05:28:00Z (mọi job): 0 requeue; cửa rộng 05:25:49–05:35:51Z (tới khi run 160 dispatch): 0 requeue. Cửa ứng viên điểm (m) btime+33s→+49,8s = 05:26:22–05:26:39Z: 0 requeue.
- **0 run đang chạy tại btime #61:** truy vấn spanning btime #61: 0 dòng. Kiểm chéo bằng các run gần btime: HB 05:20:50Z finished 05:15:34Z; run 159 finished 05:14:08Z; run 160 started 05:35:51Z (sau btime). → #61 rơi vào lúc **hệ nhàn rỗi hoàn toàn**: không có run nào đang chạy để viết lại.
- **Kết luận: #61 KHÔNG PHẢI điểm dữ liệu (m)** — cùng mẫu #52 (0 run đang chạy tại btime 17:19:09Z). Số hiệu #61 chờ parent xác nhận (T0/T2/T7 đều dùng số hiệu tuần tự; T2-160 cũng xác nhận #61).
- **HỆ QUẢ n (m): KHÔNG ĐỔI.** n ứng viên GIỮ 18/19 theo quyết (f) đợt 159; số chính thức GIỮ 14 theo quyết (g) đợt 156. Dải GIỮ 33–49,8 s. Điều tra (m) VẪN ĐÓNG.
- **Đính chính nghịch lý đồng hồ #60 (F-160-T7-1):** T7-159 ước đồng hồ boot cũ nhanh ~+20 s lúc chết (từ sleep tail 03:06:19Z). Bằng chứng mới: T8-159 (dòng log cuối 03:06:31Z → ≥+32 s) + T5-160 (watcher-159 poll cuối 03:06:26Z → ≥+27 s) → **đồng hồ cũ nhanh ≥+32 s lúc chết**. Ước ~+20 s của T7-159 là cận dưới thiếu bằng chứng — đính chính, không ảnh hưởng offset (m) #60 (requeue + btime đều ghi trên boot mới, khung thật).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-160 KHÔNG thu hẹp được cửa LẦN THỨ BA

- T2-160 DONE ~06:13Z (đọc cờ, đối chiếu chéo): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ BA** — R 2,56251–2,66817 s; J 2,566–2,80753 s (đã thử 3 hướng mới, đều âm tính); n GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 18 (16 dương + 2 âm, nhánh khuyến nghị); nếu J < 2.807 s → #56 là điểm ÂM → n = 19 (16 dương + 3 âm). T7 chỉ ghi nhận, KHÔNG tự chọn nhánh. Quyết (d) đợt 159: nếu T2-160 cũng không thu hẹp được, điểm (m) #56 giữ có điều kiện vô hạn — chấp nhận được.
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng):** #38 ÂM, #39/#41/#42/#44/#46/#47/#49/#50/#51/#53/#54/#55/#57/#58/#59/#60 DƯƠNG (16 dương), #45 ÂM (ứng viên), #56 CÓ ĐIỀU KIỆN, #52/#61 KHÔNG PHẢI điểm dữ liệu → **n ứng viên = 18 (nhánh khuyến nghị) hoặc 19 (nhánh #56 ÂM)**. **Số chính thức (ứng viên) = 14 theo quyết (g) đợt 156; n ứng viên theo quyết (f) đợt 159 = 18/19 — GIỮ cho tới khi parent quyết #56.**
- T2-160 thêm: mù #92? (#60) ĐÓNG theo luật gap (lần thứ ba liên tiếp verdict phụ thuộc mốc nội dung); mù #88? VẪN MỞ (hole-recheck lần thứ tư: 345 hit, 0 mốc mới); mù #77? VẪN MỞ; mù #93? (#61) MỚI MỞ — giao T2-161. CERT/FULL chính thức GIỮ 76/91; ứng viên CERT92/FULL107. INSIDE: #61 INSIDE dải FULL107 [03:31:30Z, 05:28:08Z] (cách mép 139 s) → chuỗi mới 1→2 theo cách tính đúng chuẩn; theo dải FULL106 như brief thì NGOÀI (muộn 5.372 s) → chuỗi GIỮ 1 — **parent/T10 quyết** (prereg (d) sai theo cách tính đúng chuẩn, F-160-T2-2). T7 chỉ ghi nhận cả hai cách tính, KHÔNG tự chọn.

### 2.5 Run 160 — jitter 0 s, 0 lần viết lại tới lúc đóng cờ, vẫn running lúc đóng cờ

Run 160 (`e331115f-4655-4d69-b184-3da192d7a7e8`, sched 1795239351 = 05:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795239351 | 05:35:51Z 21/11 |
| dispatched (event) | — | 05:35:51.128Z (eid 9634) |
| started_at GỐC | 1795239351 | 05:35:51Z — **jitter 0 s** |
| worker_claimed_at | 1795239351 | 05:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795250151 | 08:35:51Z 21/11 |

- 6 lần đọc DB đầy đủ trong phiên: status `running` ở cả 6 lần; started_at KHÔNG đổi lần nào; claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: chỉ 1 (`dispatched` 05:35:51.128Z, eid 9634) — **0 requeue, 0 reattach**.
- Tuổi run từ gốc: 257 s lúc đọc #1 (~05:40Z), 1.829 s lúc đọc #2 (~06:05Z), 3.335 s lúc đọc #3 (~06:31Z), 4.848 s lúc đọc #4 (~06:56Z), 6.374 s lúc đọc #5 (~07:22Z), **7.893 s lúc đọc cuối #6 (07:47:24Z)** — còn 2.907 s tới hạn ngân sách 08:35:51Z. **Kết cục thuộc T7-161.**
- Jitter 0 s — lần thứ mười ba liên tiếp run vcut jitter 0 (157 là lần thứ mười, 158 là lần thứ mười một, 159 là lần thứ mười hai).
- Run 160 dispatch SAU btime #61 (05:35:51Z > 05:25:49Z) → không bị #61 viết lại. Boot trong phiên T7-160 không đổi (52c957d5 suốt 6 lần đọc) → không có reboot nào trong phiên đe dọa run 160.

### 2.6 Slot HB/DR trong cửa 05:00Z → 07:50Z 21/11 — HB 6/6 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN LẦN THỨ TÁM LIÊN TIẾP

Cửa kiểm ~2h47' (6 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 12:20:50 (05:20:50Z) | a760e2d7 | 05:15:34 | −316 s | CÓ |
| 12:50:50 (05:50:50Z) | b9b7e64f | 05:45:34 | −316 s | CÓ |
| 13:20:50 (06:20:50Z) | b1a6f1fb | 06:15:34 | −316 s | CÓ |
| 13:50:50 (06:50:50Z) | 78d64ea3 | 06:45:34 | −316 s | CÓ |
| 14:20:50 (07:20:50Z) | 285d43b3 | 07:15:34 | −316 s | CÓ |
| 14:50:50 (07:50:50Z) | 643b1d55 | 07:45:34 | −316 s | CÓ |

- 6/6 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (vắng 8 đợt liên tiếp: 153, 154, 155, 156, 157, 158, 159, 160).
- Slot HB 04:50:50Z đã đếm ở đợt 159 — T7-160 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot DR 05:00Z + HB 05:20:50Z thuộc cửa 160 theo quy ước đứng (T7-159 đã giao).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 12:00 (05:00Z) | 41ba3c0d | 05:00:00 | 0 s | CÓ |
| 13:00 (06:00Z) | efed4324 | 06:00:00 | 0 s | CÓ |
| 14:00 (07:00Z) | 3554f2d7 | 07:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 04:00Z đã đếm ở đợt 159 — không đếm lại. Slot HB 08:20:50Z + DR 08:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-161.

### 2.7 Số hiệu reboot — #61 đếm tuần tự, giao parent/T2-161 chốt mù

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật — quyết (c) đợt 157), #57 = bcbaa3ad (21:05:15Z, giờ thật — T7-157), #58 = 28366bd0 (23:06:08Z, giờ thật — quyết (s) đợt 157; T0/T2-158 + T7-158 xác minh độc lập), #59 = eec65561 (01:33:47Z, giờ thật — T7-158 xác minh 6 nguồn), #60 = e590ae0a (03:05:59Z, giờ thật — T7-159 xác minh 6 nguồn + T2-159 drift 1,0015 + T8-159 xác nhận btime), #61 = 52c957d5 (05:25:49Z, giờ thật — T7-160 xác minh 7 nguồn + T0-160 7 nguồn + T2-160 drift 1,0013).
- KHÔNG có lệch số hiệu đợt này. T7 dùng số hiệu tuần tự (#60/#61) xuyên suốt file này và phụ lục; mọi boot_id/btime đều ghi đầy đủ để đối chiếu.
- Mù đi kèm: #92? (#60) ĐÓNG theo T2-160; #93? (#61) MỚI MỞ, giao T2-161 (T7 không chứng nhận mù nào). #88? (#56) VẪN MỞ; #77? VẪN MỞ. POSTBOOT_PASS #61 ĐÃ CÓ 05:52:59Z (T5-160); POSTBOOT_PASS #60 KHÔNG CÓ, không bù được — boot thứ 6 không có cờ (T5-160). Watcher-160 (pid 4539, T5-160 khởi động 05:41:26Z) CÒN SỐNG lúc T5 đóng cờ (06:18Z); watcher-159 pid 18158 chết theo #60 (T5-160 xác nhận; T0-160 ghi 0 watcher lúc mở — KHỚP, không còn mâu thuẫn T0 vs T5).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 159/160 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này không bắt được phép tính nháp sai nào — xem §6). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 03:06:45.642Z, 05:09:18.002Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này điểm (m) #60 đã ghi và #61 (không có requeue) đều không cần hiệu chỉnh J: #61 không có requeue nào để tính offset; run 159 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 159 ở khung thật.
4. Cửa kiểm đợt này ~2h47' (05:00Z → 07:47Z 21/11), đủ 6 slot HB + 3 slot DR + run vcut 159 (kết cục) và 160 (theo dõi). Sáu lần đọc DB đầy đủ; run 159 được đọc đầy đủ 6 lần khớp hoàn toàn nhau ở mọi trường; run 160 được đọc đầy đủ 6 lần khớp hoàn toàn nhau; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 04:50:50Z + DR 04:00Z thuộc cửa 159 theo quy ước đứng (T7-159 đã đếm); slot DR 05:00Z + HB 05:20:50Z thuộc cửa 160 (sau kiểm cuối T7-159 lúc 04:55Z). HB 08:20:50Z + DR 08:00Z thuộc cửa T7-161.
6. **0 sleep bị giết trong phiên này** (sleep 1.500 s ×5 hoàn thành bình thường, exit 0 — khác đợt 156/157/158 đều có 1 sleep bị SIGTERM giết sau btime; đợt 159 cũng 0 sleep bị giết). Boot không đổi 52c957d5 suốt phiên (0 lần đổi trong phiên; boot #61 lúc mở).
7. T7 đóng cờ ~07:48Z — trong hạn cờ ~08:00Z (~12' còn), trong hạn cứng toàn đợt 08:30Z (~42' còn). Run 160 vẫn running lúc đóng cờ — kết cục thuộc T7-161 (hạn ngân sách 08:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix160.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 159, cùng phương pháp)

- Heartbeat: 44/345 → **44/351 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 14:50:50 +07). Kiểm toán cửa sổ: 345 + 6 slot mới = 351 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/243 → **49/246 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 14:00 +07). Kiểm toán: 243 + 3 = 246 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/351 = 12,5% (giảm từ 12,8% — 0 thiếu mới); DR 49/246 = 19,9% (giảm từ 20,2% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (vắng 8 đợt liên tiếp).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 159: SUCCEEDED theo hồ sơ daemon (wall 9.497 s, margin 1.303 s)** — 6 lần đọc DB đầy đủ khớp nhau + events đầy đủ (8 event, gồm viết lại tại #60, viết lại lần 2 lúc 05:09:18Z và succeeded eid 9629). Margin rộng thứ hai từ đợt 150 (sau 151: 1.828 s; rộng hơn 158 đúng 783 s — chuỗi hẹp lại từ 151 ĐẢO CHIỀU RÕ).
2. **Run 159 bị viết lại LẦN 2 lúc 05:09:18Z do DAEMON RESTART KHÔNG KÈM REBOOT** — lần đầu tiên quan sát được (chứng minh: T10-159 đóng 05:12:39Z trên boot #60, sau thời điểm requeue). KHÔNG phải điểm (m) (không có btime đi kèm). Nguyên nhân daemon restart chưa rõ — T7 không suy đoán, giao parent/T10 ghi nhận.
3. **Reboot #61 (btime 05:25:49Z, boot 52c957d5) KHÔNG tạo điểm (m) mới** — 0 run đang chạy tại btime, 0 requeue trong cửa 05:25:49–05:35:51Z (cùng mẫu #52). Run 159 đã finished trước #61 701 s nên #61 không thể viết lại run 159.
4. **n (m): số chính thức (ứng viên) VẪN = 14 theo quyết (g) đợt 156; n ứng viên theo quyết (f) đợt 159 = 18/19 — GIỮ, #61 không đổi.** **#56 VẪN CÓ ĐIỀU KIỆN** (T2-160 không thu hẹp được cửa lần thứ ba: R 2,56251–2,66817 s / J 2,566–2,80753 s) — chờ parent chốt J (quyết (e) đợt 157 + quyết (d)/(e) đợt 159 vẫn đứng). Dải dương ứng viên GIỮ 33–49,8 s. Điều tra (m) VẪN ĐÓNG.
5. **Cửa slot LÀNH HOÀN TOÀN lần thứ tám liên tiếp (HB 6/6, DR 3/3, 0 muộn, 0 thiếu).** Lũy kế: HB 44/351, DR 49/246.
6. **Run 160 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 7.893 s, còn 2.907 s tới hạn ngân sách 08:35:51Z) — kết cục thuộc T7-161. Run 160 là run đầu tiên sau chuỗi 4 run liên tiếp bị viết lại (156–159) mà tới lúc đóng cờ vẫn 0 lần viết lại — chuỗi có thể đứt ở 160, chờ T7-161 xác nhận.
7. **Đính chính nghịch lý đồng hồ #60:** đồng hồ boot cũ nhanh **≥+32 s** lúc chết (bằng chứng T8-159 + T5-160), không phải ~+20 s như T7-159 ước (F-160-T7-1). Offset (m) #60 không bị ảnh hưởng (requeue + btime đều ghi trên boot mới, khung thật).
8. **INSIDE #61: hai cách tính cho hai kết quả** (T2-160): INSIDE FULL107 → chuỗi mới 1→2 (cách tính đúng chuẩn); NGOÀI FULL106 → chuỗi GIỮ 1 — **parent/T10 quyết** (F-160-T2-2). T7 chỉ ghi nhận, không tự chọn.
9. **Claimed → finished run 159 = 66 s** (khác hẳn họ 7–11 s của run 154/155/157/158) — lần đầu tiên vượt khỏi họ này kể từ đợt 154; chỉ ghi nhận, không suy luận cơ chế.
10. **Reboot #61: số hiệu đếm tuần tự (#61 = 52c957d5), chờ parent xác nhận.** Mù #92? (#60) ĐÓNG theo T2-160; #93? (#61) MỚI MỞ, giao T2-161; #88? (#56) VẪN MỞ; #77? VẪN MỞ (T7 không chứng nhận mù). POSTBOOT_PASS #61 ĐÃ CÓ 05:52:59Z (T5-160); POSTBOOT_PASS #60 KHÔNG CÓ, không bù được — boot thứ 6 không có cờ. Watcher-160 pid 4539 còn sống lúc T5 đóng cờ; watcher-159 pid 18158 chết theo #60 (T5-160 xác nhận; T0-160 khớp — không còn mâu thuẫn T0 vs T5).
11. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.
12. **T9-160 chưa đóng lúc T7 đóng cờ (~07:48Z)** — T10 thu thập (không phải nợ của T7).

## 6. Sai số của chính T7

- **F-160-T7-1 — Đính chính ước tính nghịch lý đồng hồ #60 của T7-159 (~+20 s → ≥+32 s):** T7-159 chỉ có sleep tail 03:06:19Z nên ước ~+20 s (cận dưới từ một bằng chứng duy nhất). Bằng chứng mới độc lập: T8-159 (dòng log cuối 03:06:31Z → ≥+32 s) + T5-160 (watcher-159 poll cuối 03:06:26Z → ≥+27 s) → đồng hồ boot cũ nhanh ≥+32 s lúc chết. ĐÃ SỬA trong file này (§2.3) + NOTES. Không ảnh hưởng số liệu cứng nào khác (offset (m) #60 tính từ 2 mốc trên boot mới, khung thật; mọi số run 159/160 tính từ epoch DB + btime, không dùng ước này). Bài học: ước "đồng hồ cũ nhanh ~X s" chỉ là cận dưới từ bằng chứng lúc đó — ghi rõ "≥" và nguồn, chờ bằng chứng chéo trước khi chốt.
- **F-160-T7-2 — Sleep trùng do thao tác thừa (không ảnh hưởng số liệu):** sau khi sleep 1.500 s đầu đã chạy nền, T7 chạy thêm một sleep 1.350 s trùng rồi phải kill (SIGTERM, exit null). Không mất dữ kiện nào (sleep 1 hoàn thành đúng hẹn 06:05:40Z); chỉ là thao tác thừa trong phiên. Ghi nhận để tránh lặp lại: một sleep nền cho mỗi khoảng chờ, không chạy sleep thứ hai song song.
- **F-160-T7-0 — Không có sai số nào khác trong đợt này:** 6 lần đọc DB đầy đủ khớp nhau ở mọi trường trùng (run 159 + run 160) + events đối chiếu trực tiếp (run 159: 8 event, 0 event sau succeeded eid 9629; run 160: 1 event dispatched) + truy vấn requeue theo cửa (05:08–05:11Z: đúng 1; 05:25:49–05:28:00Z: 0; 05:25:49–05:35:51Z: 0) + truy vấn spanning btime #61 và 05:09:18Z (cả hai 0 dòng, có ghi rõ cách diễn giải sau khi viết lại); mọi jitter/wall/margin/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×6 slot, DR 0 s ×3 slot, run 159 wall gốc 9.497 s / margin 1.303 s / wall viết lại lần 2 290 s / wall viết lại lần 1 7.643 s / claimed→finished 66 s, run 159 finished trước #61 701 s, viết lại lần 2 trước #61 991 s, tuổi boot #60 8.390 s, run 160 jitter 0 s / tuổi gốc lúc đóng 7.893 s / còn 2.907 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở mọi lần đọc (52c957d5 suốt phiên, 0 lần đổi + boot #61 lúc mở) và khớp xác minh độc lập của T0-160 (7 nguồn) + T2-160 (drift 1,0013) về 52c957d5; ở mọi lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 159 có 6 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 05:14:08.721Z, eid 9629), không suy đoán sau; btime #61 xác minh 7 nguồn + Cloudflare Date 2 lần trong phiên (đồng hồ boot mới đúng giờ thật, local chậm 1 s); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng — T0-160 cũng ghi GitHub −7,3..−7,7 s edge lag); 0 sleep bị SIGTERM giết trong phiên này (5 sleep 1.500 s hoàn thành bình thường — khác 3 đợt 156/157/158 đều có 1 sleep bị giết sau btime; đợt 159 cũng 0 sleep bị giết).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round160-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round160-t7/NOTES.md` + `appendix160.py` + `appendix160.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round160-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix160.py` từ epoch thô — xem file `appendix160.txt` trong round160-t7)

### Phu luc A — Run 159 (ket cuc SUCCEEDED, T7-160)
- sched 1795228551 = 2026-11-21T02:35:51Z; started GOC 1795228551 = 2026-11-21T02:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #60 1795230405 = 2026-11-21T03:06:45Z (requeue 03:06:45.642Z = btime #60 + 46,642 s)
- started sau viet lai lan 2 (daemon restart) 1795237758 = 2026-11-21T05:09:18Z (requeue 05:09:18.002Z, KHONG kem reboot)
- claimed 1795237982 = 2026-11-21T05:13:02Z (finished - 66 s)
- finished 1795238048 = 2026-11-21T05:14:08Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795238048 - 1795228551 = 9497 s (2h38m17s)
- han ngan sach: 1795239351 = 2026-11-21T05:35:51Z; margin: 1795239351 - 1795238048 = 1303 s (0h21m43s)
- wall tu started viet lai lan 2: 1795238048 - 1795237758 = 290 s (0h04m50s)
- wall tu started viet lai lan 1 #60: 1795238048 - 1795230405 = 7643 s (2h07m23s)
- finished TRUOC btime #61: 1795238749 - 1795238048 = 701 s (0h11m41s) truoc -> #61 KHONG the viet lai run 159
- viet lai lan 2 TRUOC btime #61: 1795238749 - 1795237758 = 991 s (0h16m31s) truoc -> KHONG phai do #61
- KHONG co event nao cho run 159 sau succeeded 05:14:08.721Z (eid 9629)

### Phu luc B — Reboot #60 (phien 159) + #61 (truoc phien 160) T7-160
- #60: btime 1795230359 = 2026-11-21T03:05:59Z, boot e590ae0a
- #61: btime 1795238749 = 2026-11-21T05:25:49Z, boot 52c957d5
- tuoi boot #60 tai #61: 8390 s (2h19m50s)
- requeue #60: 03:06:45.642Z = btime + 46,642 s — TRONG dai 33-49,8 s (da ghi dot 159)
- requeue #61: 0 requeue trong cua 05:25:49-05:35:51Z (moi job) — #61 KHONG tao diem (m)
- cua ung vien requeue #61: btime+33s = 2026-11-21T05:26:22Z -> btime+49,8s = 2026-11-21T05:26:38Z (49s) / 2026-11-21T05:26:39Z (50s); 0 requeue
- 0 run dang chay tai btime #61 (spanning query 0 dong; HB gan nhat finished 05:15:34Z; run 159 finished 05:14:08Z; run 160 started 05:35:51Z)

### Phu luc C — Run 160 (van running luc dong co T7-160, 0 lan viet lai)
- sched 1795239351 = 2026-11-21T05:35:51Z; started GOC 1795239351 = 2026-11-21T05:35:51Z (jitter 0 s)
- claimed 1795239351 = 2026-11-21T05:35:51Z (goc, khong viet lai)
- han ngan sach: 1795250151 = 2026-11-21T08:35:51Z (ngoai han co T7-160 — ket cuc thuoc T7-161)
- tuoi goc luc doc cuoi (2026-11-21T07:47:24Z): 1795247244 - 1795239351 = 7893 s (2h11m33s); con 2907 s toi han
- events: chi 1 (dispatched 05:35:51.128Z, eid 9634) — 0 requeue, 0 reattach

### Phu luc D — Slot HB/DR cua T7-160 (doc #1-#6, 05:38Z-07:47Z)
- HB sched 2026-11-21T05:20:50Z run a760e2d7: started 2026-11-21T05:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T05:50:50Z run b9b7e64f: started 2026-11-21T05:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T06:20:50Z run b1a6f1fb: started 2026-11-21T06:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T06:50:50Z run 78d64ea3: started 2026-11-21T06:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T07:20:50Z run 285d43b3: started 2026-11-21T07:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T07:50:50Z run 643b1d55: started 2026-11-21T07:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-21T05:00:00Z run 41ba3c0d: started 2026-11-21T05:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T06:00:00Z run efed4324: started 2026-11-21T06:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T07:00:00Z run 3554f2d7: started 2026-11-21T07:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (0 thieu, 0 muon), DR 3/3 (0 thieu) — CUA LANH HOAN TOAN (lan thu 8 lien tiep)
- Luy ke: HB 44/345 -> 44/351 (so thieu +0); DR 49/243 -> 49/246 (so thieu +0)
- Ti le thieu: HB 12,5%; DR 19,9%

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
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 + T2-159 + T2-160 KHONG thu hep duoc cua: R 2,56251–2,66817 s / J 2,566–2,80753 s)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — viet lai run 157 lan 2; TINH BANG GIO THAT
- #59 DUONG (+35,173 s) — viet lai run 158 lan 1; TINH BANG GIO THAT
- #60 DUONG (+46,642 s) — CHAP NHAN (quyet (f) dot 159); viet lai run 159 lan 1; TINH BANG GIO THAT
- #61 KHONG PHAI diem du lieu (T7-160: 0 run dang chay tai btime 05:25:49Z; 0 requeue trong cua 05:25:49-05:35:51Z) — cung mau #52
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet
- n ung vien theo quyet (f) dot 159 = 18 (16 duong + 2 am, nhanh khuyen nghi) hoac 19 (16 duong + 3 am, nhanh #56 AM) — GIU, #61 khong doi
- Dai requeue duong ung vien GIU 33–49,8 s (khong diem duong moi pha min/max; #61 khong co requeue)
- LUU Y SO HIEU: 348dab54=#56 (quyet (c) dot 157); bcbaa3ad=#57; 28366bd0=#58 (quyet (s) dot 157); eec65561=#59 (T7-158, dem tuan tu); e590ae0a=#60 (T7-159 + T2-159 + T8-159 xac minh doc lap); 52c957d5=#61 (T7-160 + T0-160 + T2-160 xac minh doc lap)
