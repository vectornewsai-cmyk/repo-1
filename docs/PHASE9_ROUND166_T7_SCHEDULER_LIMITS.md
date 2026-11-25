# PHASE9 ROUND166 T7 — RUN 165 SUCCEEDED (wall 9.818 s, margin 982 s; 1 LẦN VIẾT LẠI #70; (m) #70 DƯƠNG ĐÃ CHẤP NHẬN) + REBOOT #71 TRONG PHIÊN (VIẾT LẠI RUN 166 LẦN 1, REQUEUE +41,274 s — ỨNG VIÊN DƯƠNG (m)) + CỬA SLOT 6/6 + 3/3 (0 MUỘN, 0 THIẾU)

- **Luồng:** T7 đợt 166 (lượt cron 06:35 +07 22/11/2026 = 23:35:51Z 21/11). Nhiệm vụ theo brief T7-166: (1) kết cục run 165 — run này vẫn `running` lúc T7-165 đóng cờ (~23:08Z, tuổi gốc 9.123 s, còn 1.677 s tới hạn 23:35:51Z); (2) điểm (m) #70 từ phía scheduler (đối chiếu với T2-166); (3) run 166 hiện trạng lúc đóng cờ; (4) slot HB/DR đợt 166 + lũy kế; (5) (m) #56 vẫn có điều kiện (T2-166 sở hữu). Phát hiện thêm trong phiên: **reboot #71 TRONG phiên (btime 00:08:00Z 22/11) viết lại run 166 lần 1, requeue btime +41,274 s — ứng viên DƯƠNG (m)** (xem §2.2–2.3).
- **Boot trong phiên:** mở phiên là **d1ddd946-f9f3-4561-86e8-5eb3edceb6cc** (btime /proc/stat 1795298725 = 22:05:25Z — **reboot #70, GIỜ THẬT**; T0-166 + T2-166 + T5-166 + T7-165 xác minh độc lập); **reboot #71 TRONG phiên** lúc 00:08:00Z (boot **ea73ac4f-7bde-41d1-b21b-1d7906153866**, btime 1795306080 = 00:08:00Z — **GIỜ THẬT**, T7 xác minh 9 nguồn); boot lúc đóng cờ vẫn ea73ac4f (KHÔNG reboot mới sau #71).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 165/166 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 165 §12.3 (quyết parent (a)/(e)/(f)/(n) — **#68 GIỮ DƯƠNG, #69 DƯƠNG CHẤP NHẬN, #70 ỨNG VIÊN DƯƠNG CHẤP NHẬN**; n ứng viên 21→24 / 22→25), LIMITS T7-165 + NOTES round165-t7, cờ round166-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done / t9.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 165 kết cục? | **`succeeded`** 23:19:29Z (event 23:19:29.876Z, eid 9886), wall từ started gốc **9.818 s**, margin **982 s** (16m22s) tới hạn 23:35:51Z | §2.1, Phụ lục A |
| Run 165 có bị #70 giết không? | **KHÔNG — bị viết lại lần 1, nhưng SUCCEEDED sau đó** (finished 1h14m04s SAU btime #70; requeue +38,729 s; 0 event sau succeeded) | §2.1, §2.2 |
| Run 165 mấy lần viết lại? | **1 lần** (tại #70) | §2.1 |
| Reboot #70 có tạo điểm (m) mới không? | **DƯƠNG — parent CHẤP NHẬN ở quyết (n) đợt 165; T2-166 đối chiếu độc lập ĐỒNG Ý DƯƠNG (4 nguồn khớp)** | §2.6 |
| Reboot #71 (trong phiên)? | **VIẾT LẠI run 166 lần 1** — requeue 00:08:41.274Z = **btime +41,274 s, TRONG dải 33–49,8 s** → **ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-167) | §2.2, §2.3 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-166 KHÔNG thu hẹp được cửa LẦN THỨ CHÍN**; R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.4 |
| n mẫu (m)? | **Chính thức GIỮ 14.** N ứng viên **24 (21 dương + 3 âm, nhánh khuyến nghị) hoặc 25 (21 dương + 4 âm, nhánh #56 ÂM)** sau quyết đợt 165 — chưa cộng #71 (chờ parent quyết) | §2.3, §2.4, Phụ lục E |
| Cửa slot đợt 166? | **HB 6/6 (toàn −316 s), DR 3/3 (toàn 0 s), 0 thiếu, 0 muộn** — cửa LÀNH HOÀN TOÀN (đợt thứ năm liên tiếp) | §2.7 |
| Run 166? | **Jitter 0 s** (lần thứ 19 liên tiếp), **1 lần viết lại (tại #71)**, **vẫn `running` lúc đóng cờ** (~02:02Z, tuổi gốc 8.798 s, còn 2.002 s tới hạn 02:35:51Z). Kết cục thuộc T7-167 | §2.5 |
| Đồng hồ lúc mở? | **Cloudflare ±1 s** (8 lần trong phiên: 23:38Z chênh 0 s, 00:05Z chênh 1 s, 00:09Z chênh 0 s, 00:34Z chênh 0 s, 01:00Z chênh 0 s, 01:26Z chênh 0 s, 01:52Z chênh 1 s, 02:03Z chênh 1 s — đều trong ±1 s) — khớp T0-166 | §2.2, §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–165): heartbeat **44/387 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/265 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 165 — SUCCEEDED, margin 982 s (đọc #1/#2 + kiểm lại cuối đọc #8 khớp nhau + events đối chiếu trực tiếp + T2-166 đối chiếu số học)

Run 165 (`b548ba36-77b6-4c4c-bd77-351472631ecd`, sched 1795293351 = 20:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795293351 = 20:35:51Z 21/11 |
| started_at (gốc) | 1795293351 = 20:35:51Z — jitter 0 s |
| started_at sau viết lại lần 1 (#70) | 1795298763 = 22:06:03Z |
| finished_at_utc | 1795303169 = 23:19:29Z (event `succeeded` 23:19:29.876Z, eid 9886) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795303161 = 23:19:21Z (finished − 8 s) |
| Wall từ started gốc | 1795303169 − 1795293351 = **9.818 s** (2h43m38s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795304151 = 23:35:51Z — finished TRƯỚC hạn **982 s** (16m22s) |
| Finished sau btime #70 | 1795303169 − 1795298725 = 4.444 s (1h14m04s) SAU btime |

- Events run 165 (đầy đủ, 5 event, không thiếu, không thêm sau succeeded): `dispatched` 20:35:51.084Z (eid 9846, detail "scheduled") + `requeued_after_restart` 22:06:03.729Z (9868, detail "daemon startup recovery") + `dispatched` 22:06:03.819Z (9869, detail "scheduled") + `reattached_after_restart` 22:06:03.941Z (9870, detail "execute turn already complete (model-output evidence)") + **`succeeded` 23:19:29.876Z (9886)**. **KHÔNG có event nào cho run 165 sau 23:19:29Z** (kiểm lại ở đọc cuối #8: 0 event mới sau eid 9886; 1 lần viết lại xác nhận bằng events).
- 3 lần đọc DB đầy đủ run 165 trong phiên khớp nhau ở mọi trường (đọc #1 ~23:38Z, #2 ~00:05Z, #8 ~02:02Z — đọc #1 xác nhận kết cục; các đọc sau xác nhận không đổi). T2-166 đối chiếu số học độc lập: **SUCCEEDED 23:19:29Z, margin 982 s, claimed→finished 8 s** — KHỚP T7 từng số (cờ T2-166, ~23:59Z). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: 1.452 s; 162: 1.065 s; 163: 1.058 s; 164: 454 s; 165: **982 s** — rộng hơn run 164 đúng 528 s, xếp thứ 6/16 trong chuỗi từ đợt 150 (hẹp hơn 977 s đợt 156 đúng 5 s). T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 165 claimed 23:19:21Z (finished − **8 s**) — **TRỞ LẠI họ 6–11 s** của run 154 (7 s) / 155 (8 s) / 158 (10 s) / 160 (7 s) / 161 (6 s) / 162 (11 s) / 163 (8 s), sau ngoại lệ 66 s của run 164. T7 ghi đúng 8 s, không làm tròn, không suy đoán nguyên nhân. T2-166 ghi nhận cùng chi tiết.
- **T7-165 đóng cờ ~23:08Z — run 165 finish 23:19:29Z SAU khi T7-165 đóng** (kiểm cuối của T7-165 lúc 23:07:54Z vẫn running, tuổi gốc 9.123 s). Claim "run 165 chưa có kết cục" của T7-165 ĐÚNG lúc đóng (cùng mẫu run 161: finish 44 s sau T10-161 đóng; run 162: 87 s sau T10-162 đóng; run 163: 96 s sau T10-163 đóng; run 164: finish sau T10-164 đóng).
- **Run 165 bị 1 lần viết lại** — chuỗi run bị viết lại: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (1), 162 (0), 163 (1), 164 (2), 165 (**1**), 166 (**1** — tính tới lúc đóng cờ T7-166).

### 2.2 Reboot #71 (btime 00:08:00Z 22/11) — TRONG PHIÊN, GIỜ THẬT, KHÔNG NGHỊCH LÝ ĐỒNG HỒ

- **Reboot #71: boot ea73ac4f-7bde-41d1-b21b-1d7906153866, btime 1795306080 = 00:08:00Z 22/11.** Xác minh T7 (lúc phát hiện + đọc #3): boot_id + btime + `uptime -s` 00:08:00Z (khớp) + /proc/1 mtime 00:08:15.954Z (+15,954 s) + journal idx 0 duy nhất, first entry 00:08:16Z (+16 s) + wtmp begins 00:08:16Z (+16 s) + `last` reboot 00:08 still running + `who -b` 00:08. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 23:38:50 vs 23:38:50 (chênh 0 s, lúc mở), 00:05:35 vs 00:05:34 (chênh 1 s), 00:09:10 vs 00:09:10 (chênh 0 s, lúc phát hiện #71), 00:34:59 vs 00:34:59 (chênh 0 s), 01:00:22 vs 01:00:22 (chênh 0 s), 01:26:51 vs 01:26:51 (chênh 0 s), 01:52:18 vs 01:52:17 (chênh 1 s), 02:03:00 vs 02:02:59 (chênh 1 s, lúc đóng) — tám lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1).
- **Gap #70→#71 (btime−btime): 1795306080 − 1795298725 = 7.355 s (2h02m35s).** T9-166 xác minh độc lập cùng số (cờ T9-166).
- **#71 xảy ra TRONG phiên T7** — sleep #2 bị SIGTERM giết sau ~153 s (~00:08:27Z, 27 s sau btime — killer là reboot #71 + recovery sau reboot, xem F-166-T7-1). T8-166 ghi nhận #71 xảy ra 35 s SAU GATE-FOUND cho #70 (poll 26, 00:07:25Z, đường (a)), TRƯỚC O8 — O8 KHÔNG chạy trên #70. T4-166 đóng cờ 00:07Z — TRƯỚC btime #71 1 phút (phiên T4 không thấy #71). Watcher-166 (START 23:40:45Z pid 26422, theo T5-166) nhiều khả năng chết theo #71 — T5-167 kiểm tra lúc mở. POSTBOOT_PASS #71 CHƯA CÓ — thuộc T5-167.
- **1 requeue do #71:** cửa 00:08:00–00:30:00Z (mọi job, event `requeued_after_restart`): đúng 1 dòng — requeue run 166 (eid 9898). Không job nào khác bị requeue do #71.
- **Run 166 ĐANG CHẠY tại btime #71:** đọc #2 (00:05:19Z) running, started gốc 23:35:51Z; 0 event finish trước btime (events đầy đủ 4 event — không có `succeeded`/`failed` nào trước 00:08:41Z); requeue + reattach tại btime +41,274 s; vẫn running lúc đóng cờ.
- **Số hiệu #71 theo đếm tuần tự** — chờ parent xác nhận (T7 xác minh 9 nguồn; T8/T9-166 dùng #71 — chờ T0-167 xác minh đầy đủ 9 nguồn).

### 2.3 Điểm (m) #71 — ỨNG VIÊN DƯƠNG (requeue +41,274 s, trong dải 33–49,8 s; đối chiếu độc lập thuộc T2-167)

- **Run 166 ĐANG CHẠY tại btime #71 (00:08:00Z).** Bằng chứng: đọc #2 (00:05:19Z) running; 0 event finish trước btime; requeue + reattach tại btime +41,274 s; chính phiên T7 này bị SIGTERM trong lúc reboot (sleep #2 chết ~00:08:27Z) và session re-attach sau reboot — cùng cơ chế reattach như event 9900 của run 166.
- **Requeue #71: 00:08:41.274Z = btime + 41,274 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 00:08:00–00:30:00Z (mọi job): đúng 1 dòng — requeue run 166 (eid 9898). Không job nào khác bị requeue do #71.
- **Caveat spanning — GHI RÕ, KHÔNG GIẤU:** truy vấn spanning btime #71 trả 0 dòng, NHƯNG ĐÂY LÀ ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy". Run 166 started_at đã viết lại thành 00:08:41Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Đây đúng là caveat T7-162 §2.2 đã cảnh báo và trường hợp #66 đợt 163 / #68 đợt 164 / #69 + #70 đợt 165 — verdict DƯƠNG ứng viên dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **Khung giờ của phép trừ (quy tắc đứng từ đợt 157 §3.3 + ghi chú đứng quyết (e) đợt 165):** run 166 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 166 ở khung thật; btime #71 xác minh giờ thật 9 nguồn T7 + Cloudflare ±1 s ×8; requeue event `created_at` là timestamp host-side cùng khung thật. Delta 41,274 s lấy từ `created_at` timestamptz trực tiếp (00:08:41.274Z), không qua extract-epoch làm tròn. **Ghi chú đứng quyết (e) đợt 165: dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m)** — T7 áp dụng đúng ghi chú này cho #71 (giao T2-167 kiểm lệch khung tại biên #70/#71 theo mẫu T5-165 §4.2 / T5-166 về #70).
- **Lean của T7 — DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #3 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #3 (requeue trong dải là dứt khoát); đọc #4–#8 xác nhận không đổi (không viết lại lần 2, không requeue thêm, không reboot mới). T7 KHÔNG tự cộng n (điều tra (m) VẪN ĐÓNG theo quyết (f) đợt 162); T10/parent quyết. **Đối chiếu độc lập thuộc T2-167** (T2-166 đã đóng 23:59Z — TRƯỚC #71 00:08:00Z).
- **Nếu parent CHẤP NHẬN #71 DƯƠNG:** n ứng viên 24 → **25 (22 dương + 3 âm, nhánh khuyến nghị)** hoặc 25 → **26 (22 dương + 4 âm, nhánh #56 ÂM)**; n chính thức GIỮ 14 cho tới khi #56 được chốt. Dải dương ứng viên GIỮ 33–49,8 s (#71 +41,274 s nằm trong dải, không mở rộng dải).
- **Chữ ký đối chiếu:** giống #66/#68/#69/#70 (viết lại run đang chạy, requeue trong dải → DƯƠNG ứng viên); khác #67 (0 run đang chạy tại btime, 0 requeue — KHÔNG PHẢI điểm).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-166 KHÔNG thu hẹp được cửa LẦN THỨ CHÍN

- T2-166 DONE (cờ ~23:59Z): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ CHÍN** (4 hướng đều âm tính: find toàn cây trong cửa D 351 file — 0 mốc D mới sau 20:16:36Z; log xoay 0 dòng 20/11; shell history + reflog không tồn tại; Firefox 0 profile); cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n chính thức (ứng viên) GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 + quyết (d)/(e) đợt 161 + quyết (f) đợt 162 + quyết (f) đợt 163 + quyết (f) đợt 165** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 24 (nhánh khuyến nghị, chưa cộng #71); nếu J < 2.807 s → #56 là điểm ÂM → n = 25 (chưa cộng #71). Quyết (d) đợt 160 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-166 thêm: mù **#96? (#64) VẪN MỞ** (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — y hệt T2-165; S/T đóng; U hố file MỚI 1.407 s nhưng union-A 926 / union-B 773 → ĐÓNG tham chiếu); mù **#88? VẪN MỞ** (hole-recheck lần thứ mười: 337 hit, 0 mốc mới); mù **#95? (#63) MỞ**; mù **#94? (#62) MỞ**; mù **#77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: **#70 INSIDE dải FULL116** [20:35:42Z, 22:35:58Z] neo 20:09:31Z (biên 5.383/1.833 s) → chuỗi 5 LÊN 6. T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.

### 2.5 Run 166 + reboot #71 (btime 00:08:00Z, TRONG phiên) — VIẾT LẠI LẦN 1, requeue +41,274 s

Run 166 (`5c969404-8c41-459b-be58-3a90bdda104e`, sched 1795304151 = 23:35:51Z 21/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795304151 | 23:35:51Z 21/11 |
| started_at GỐC | 1795304151 | 23:35:51Z — **jitter 0 s** |
| started_at sau viết lại lần 1 (#71) | 1795306121 | 00:08:41Z 22/11 |
| worker_claimed_at (KHÔNG ĐỔI) | 1795304151 | 23:35:51Z (started gốc + 0 s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795314951 | 02:35:51Z 22/11 |

- 8 lần đọc DB đầy đủ trong phiên: đọc #1–#2 (23:38Z–00:05Z) run 166 `running`, started_at 1795304151 không đổi; đọc #3 (~00:08Z, SAU reboot #71) started_at ĐÃ ĐỔI thành 1795306121; đọc #4–#8 (00:34Z–02:02Z) started_at KHÔNG đổi lần nữa, claimed_at KHÔNG đổi lần nào. **1 lần viết lại duy nhất (tại #71), KHÔNG viết lại lần 2.** Attempt 1; error_text null; worker_execution_timed_out false.
- Events run 166 (đầy đủ, 4 event, 0 event mới sau reattach eid 9900 ở đọc #8): `dispatched` 23:35:51.144Z (eid 9888, detail "scheduled") + **`requeued_after_restart` 00:08:41.274Z (9898, detail "daemon startup recovery")** + `dispatched` 00:08:41.339Z (9899, detail "scheduled") + **`reattached_after_restart` 00:08:41.407Z (9900, detail "execute turn already complete (model-output evidence)")**.
- **Jitter 0 s** — lần thứ mười chín liên tiếp run vcut jitter 0 (165 là lần thứ mười tám).
- Tuổi run từ gốc (script, không ghi tay): đọc #2 (00:05:19Z) 1.768 s, còn 9.032 s tới hạn; đọc #4 (00:34:52Z) 3.541 s, còn 7.259 s; đọc #5 (01:00:10Z) 5.059 s, còn 5.741 s; đọc #6 (01:26:36Z) 6.645 s, còn 4.155 s; đọc #7 (01:52:09Z) 8.178 s, còn 2.622 s; đọc #8 (02:02:29Z) 8.798 s, còn 2.002 s tới hạn ngân sách 02:35:51Z. **Kết cục thuộc T7-167** (hạn cứng đóng đợt 166 là 02:30Z, trước hạn run 166 02:35:51Z).
- Run 166 dispatch trên boot #70 (worker_boot_generation cron_boot_0c78cfc1...); sau #71, worker_boot_generation mới cron_boot_2fa5f322.... Hạn ngân sách KHÔNG ĐỔI (tính từ started gốc, không tính từ started viết lại — cùng quy ước các đợt trước).

### 2.6 Điểm (m) #70 — DƯƠNG ĐÃ CHẤP NHẬN (quyết (n) đợt 165) + T2-166 đối chiếu độc lập ĐỒNG Ý + CAVEAT KHUNG GIỜ T5-166 (ghi rõ, không giấu)

- **Run 165 ĐANG CHẠY tại btime #70 (22:05:25Z).** Bằng chứng: đọc #5 T7-165 (21:56Z) running, started gốc 20:35:51Z; 0 event finish trước btime; requeue + reattach tại btime +38,729 s; succeeded sau btime 23:19:29Z.
- **Requeue #70: 22:06:03.729Z = btime + 38,729 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 22:05:25–22:30:00Z (mọi job): đúng 1 dòng — requeue run 165 (eid 9868). Không job nào khác bị requeue do #70.
- **Parent quyết (n) đợt 165: #70 là ỨNG VIÊN DƯƠNG (m) — CHẤP NHẬN.** **T2-166 đối chiếu độc lập: "(m) #70 — ĐỒNG Ý DƯƠNG (4 nguồn độc lập khớp): requeue +38,729 s; dispatch +38,819; reattach +38,941"** (cờ T2-166, ~23:59Z). Hai bên thống nhất, không có phân kỳ để T10 phán.
- **CAVEAT KHUNG GIỜ — T5-166 (MỚI, T7 ghi nhận đầy đủ, không lật verdict nào):** T5-166 phát hiện poll cuối watcher-165 22:05:31Z — **6 s SAU btime #70 (22:05:25Z)** — khung giờ #69/#70 lệch nhau ≥6 s; reboot thật ∈ (22:05:31Z, ~22:06:01Z]; offset requeue thật ∈ [2,7 s, 32,7 s] HOÀN TOÀN DƯỚI biên dưới dải dương 33–49,8 s. T5 KHÔNG tự phán (m) #70, giao T2-166 đối chiếu độc lập + parent quyết lại. **T2-166 (đóng SAU T5, 23:59Z) đã thấy caveat này và VẪN kết luận #70 ĐỒNG Ý DƯƠNG** — phù hợp ghi chú đứng quyết (e) đợt 165 (dải định nghĩa theo offset btime-tương đối, khung giờ boot mới; dữ kiện khung giờ boot cũ = OVERLAP, không đổi verdict (m)). **Parent đã CHẤP NHẬN #70 ở quyết (n) đợt 165 TRƯỚC khi T5-166 nêu caveat** — T7 ghi nhận caveat để parent cân nhắc có quyết lại hay không ở đợt 166; T7 KHÔNG tự phán lại #70 (thuộc T2-167/parent). Giao T2-167 kiểm lệch khung tại biên #70/#71 theo cùng mẫu.
- **Nếu parent CHẤP NHẬN #70 DƯƠNG (đã chấp nhận):** n ứng viên 21→24 (nhánh khuyến nghị) hoặc 22→25 (nhánh #56 ÂM) — đã tính trong quyết (n) đợt 165; n chính thức GIỮ 14. Dải dương ứng viên GIỮ 33–49,8 s (#70 +38,729 s nằm trong dải, không mở rộng dải).

### 2.7 Slot HB/DR trong cửa 23:20Z → 02:02Z 21–22/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h24' (8 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:20:50 (23:20:50Z) | 6f54e219 | 23:15:34 | **−316 s** | CÓ |
| 06:50:50 (23:50:50Z) | 9e396285 | 23:45:34 | −316 s | CÓ |
| 07:20:50 (00:20:50Z) | a77140ea | 00:15:34 | −316 s | CÓ |
| 07:50:50 (00:50:50Z) | 5452c2c5 | 00:45:34 | −316 s | CÓ |
| 08:20:50 (01:20:50Z) | 49c2640d | 01:15:34 | −316 s | CÓ |
| 08:50:50 (01:50:50Z) | e762ae2b | 01:45:34 | −316 s | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started; jitter −316 s đồng đều tuyệt đối (mẫu chuẩn). HB 00:20:50Z dispatched 12m50s SAU btime #71 trên boot mới #71 — daemon boot mới dispatch bình thường. **0 muộn mới — muộn HB lũy kế GIỮ 9** (đợt thứ năm liên tiếp vắng muộn mới).
- Slot HB 22:50:50Z đã đếm ở đợt 165 — T7-166 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot HB 02:20:50Z chưa dispatch lúc đóng cờ — thuộc cửa T7-167.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 07:00 (00:00Z) | c41727c2 | 00:00:00 | 0 s | CÓ |
| 08:00 (01:00Z) | 9bfff8c6 | 01:00:00 | 0 s | CÓ |
| 09:00 (02:00Z) | b3a05b19 | 02:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 23:00Z đã đếm ở đợt 165 — không đếm lại. DR 00:00Z dispatched 8m00s TRƯỚC btime #71 trên boot #70 — daemon boot cũ dispatch bình thường.
- Cửa này chỉ có 3 slot DR (đợt 165 có 4) vì cửa T7-166 ngắn hơn (~2h24' so với ~3h08' đợt 165) — mẫu số lũy kế cộng đúng +3, không phải thiếu slot.

### 2.8 Số hiệu reboot + đối chiếu chéo các luồng đợt 166 (chỉ ghi nhận)

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — XÁC NHẬN quyết (o) đợt 161), #63 = 94d22520 (10:30:42Z, giờ thật — XÁC NHẬN quyết (p) đợt 161), #64 = d9a8d1ce (11:15:18Z, giờ thật — XÁC NHẬN quyết (o) đợt 162), #65 = 1c1cf10c (14:34:57Z, giờ thật — XÁC NHẬN quyết (d) đợt 163), #66 = edb2acdb (16:06:45Z, giờ thật — XÁC NHẬN quyết (e) đợt 163), #67 = f1d4ce1a (17:33:27Z, giờ thật — T0/T2/T5/T7-164 xác minh độc lập, chờ parent xác nhận), #68 = 0c8a94aa (18:06:30Z, giờ thật — T7-164 xác minh 9 nguồn; T2-165 đối chiếu ĐỒNG Ý DƯƠNG; parent quyết (e) đợt 165 GIỮ DƯƠNG), #69 = 9a1a9319 (20:09:31Z, giờ thật — T0/T2/T5/T7-165 xác minh độc lập; parent quyết (d)/(f) đợt 165 XÁC NHẬN số hiệu + DƯƠNG), #70 = d1ddd946 (22:05:25Z, giờ thật — T7-165 xác minh 9 nguồn; T0-166 xác minh đầy đủ 9 nguồn; parent quyết (d)/(n) đợt 165 XÁC NHẬN số hiệu + CHẤP NHẬN ứng viên DƯƠNG), #71 = ea73ac4f (00:08:00Z, giờ thật — T7-166 xác minh 9 nguồn, chờ parent xác nhận; đối chiếu độc lập thuộc T0/T2-167).
- Đối chiếu chéo (đọc cờ + LIMITS, chỉ ghi nhận — T7 không kiểm lại công việc luồng khác):
  - **T0-166** (cờ ~23:42Z): #70 xác minh đầy đủ 9 nguồn; KHÔNG có reboot mới kể từ khi T10-165 đóng sổ (đúng lúc T0 đóng — #71 xảy ra sau đó 00:08Z); marker sống qua 22 reboot #49–#70; POSTBOOT_PASS #70 CHƯA CÓ lúc mở; watcher-166 chưa khởi động; O8 JSON 165 còn đúng; dpkg.log 1.545 dòng md5 5f29561e. **T0 ghi run 165 (KHÔNG phán — thuộc T7-166): SUCCEEDED 23:19:29Z (5 event, 1 lần viết lại tại #70, requeue +38,729 s) — KHỚP T7 từng số.**
  - **T1-166** (cờ 23:49Z): verify 165 PASS; suite 28/28 trên boot #70; đếm đợt 165 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới; lũy kế 111–165 = 538/979/842.
  - **T2-166** (cờ ~23:59Z): probe #85 ok=2 fail=0 (boot d1ddd946, 23:40:09Z); **(m) #70 ĐỒNG Ý DƯƠNG (4 nguồn khớp)**; **run 165 SUCCEEDED 23:19:29Z, margin 982 s, claimed→finished 8 s — KHỚP T7 từng số**; n ứng viên 24/25 theo quyết (n) đợt 165; **(m) #56 KHÔNG thu hẹp được lần thứ CHÍN**; INSIDE #70: FULL116 → chuỗi 5 LÊN 6; mù #96? VẪN MỞ; mù #88? VẪN MỞ (hole-recheck lần 10: 337 hit, 0 mới); CERT/FULL chính thức GIỮ 76/91; birefnet 0 thử lần 20; ghi chú đứng quyết (e) đợt 165 đã ghi vào LIMITS.
  - **T4-166** (cờ 00:07Z): lượt yên #35 KHÔNG CÓ lượt hợp lệ (ngân sách 3/3 hết); **chuỗi lượt yên hợp lệ #22→#30 ĐỨT tại #35**; chuỗi 0-wedge 9 đợt (157–165) ĐỨT. T4 đóng TRƯỚC btime #71 1 phút — phiên T4 không thấy #71.
  - **T5-166** (cờ 23:49Z): **POSTBOOT_PASS #70 ĐÃ CÓ 23:40:45Z** (boot+1h35m20s, replay đầy đủ); watcher-166 START 23:40:45Z pid 26422; watcher-165 chết theo #70 (164 poll, poll cuối 22:05:31Z); khoảng không-watcher 1h35m14s; **CAVEAT KHUNG GIỜ #70 MỚI: poll cuối watcher-165 6 s SAU btime #70; offset requeue thật ∈ [2,7 s, 32,7 s] HOÀN TOÀN DƯỚI biên dưới dải dương** — T5 KHÔNG tự phán (m) #70, giao T2-166 đối chiếu + parent quyết lại (xem §2.6); ENOSPC boot #70: 34 dòng lúc đóng (T9 đếm chính thức).
  - **T6-166** (cờ 23:51Z): (A) 120/120 lần thứ 16 liên tiếp (tổng 1920/1920); prune lần 41 (queue 101 → 100); #70 KHÔNG giết holder (lock trống 27m01s trước btime); double-acquire/STALE-LOCK GIỮ 12 (0 ca mới).
  - **T8-166** (cờ 00:48Z): O8 PASS 3/3 TRÊN BOOT #71 (KHÔNG tính chuỗi — GIỮ 19); harness 6/6 sạch, 0 kẹt; **reboot #71 xảy ra 35 s SAU GATE-FOUND cho #70 (poll 26, 00:07:25Z, đường (a)), TRƯỚC O8**; replay (1c): thiết kế gốc LỖI — KHÔNG triển khai, chờ parent duyệt bản sửa (c').
  - **T9-166** (cờ 01:42Z): headroom 6 (dưới ngưỡng lần thứ 26 liên tiếp); **cửa sổ thoáng sau reboot ĐƯỢC QUAN SÁT lần thứ tư liên tiếp** (#71 boot+66s 30.001, đóng trước boot+160s); **E-167 ĐÃ ĐỨT trong (23:38:50Z, 23:39:50Z]** (tổng 37 mẫu nếu tính tiếp nối — giao T10 phán); **E-168 MỚI 54 mẫu** (00:48:06–01:41:07Z, 1 chuỗi, 0 sag, CHƯA đứt — kết cục thuộc T9-167); tổng ghim 55/123 (44,7%); ENOSPC ≥56 dòng (cận dưới; #70 ≥47 + #71 9 dòng) — đợt thứ 15 liên tiếp; birefnet 0 thử lần 20; **reboot #71 (btime 00:08:00Z, gap #70→#71 = 7.355 s — KHỚP T7)**; sampler/watcher/probe-loop chết theo #71, khởi động lại bằng tay boot+~55s, gap phủ sóng 73 s.
- Mù đi kèm: #96? (#64) VẪN MỞ (T2-166 theo dõi tiếp); #95? (#63) MỞ theo quyết (b) đợt 163; #94? (#62) MỞ theo quyết (b) đợt 162; #88? VẪN MỞ (hole-recheck lần thứ mười: 337 hit, 0 mốc mới); #77? VẪN MỞ. CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: #70 INSIDE dải FULL116 → chuỗi 5 LÊN 6 (T2-166; T7 chỉ ghi nhận). INSIDE cho #71 giao T2-167 (dải FULL117 neo 22:05:25Z). POSTBOOT_PASS #70 ĐÃ CÓ 23:40:45Z (T5-166); POSTBOOT_PASS #68 KHÔNG CÓ — boot thứ 9 lọt; POSTBOOT_PASS #63/#66 KHÔNG CÓ, không bù được. POSTBOOT_PASS #71 CHƯA CÓ — thuộc T5-167. Marker sống qua 22 reboot #49–#70 (T0-166 đếm độc lập 22; sau #71 là 23 — T0/T5-167 đếm lại). Watcher-166 pid 26422 nhiều khả năng chết theo #71; T5-167 kiểm tra lúc mở.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 165/166 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1: phụ lục chỉ viết bằng script, không gõ tay). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 00:08:41.274Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3) + ghi chú đứng quyết (e) đợt 165: dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Đợt này: run 165/166 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 165/166 ở khung thật; btime #70/#71 xác minh giờ thật nhiều bên độc lập (T0/T2/T5/T7 + Cloudflare); spanning #71 = 0 là ARTIFACT viết-lại-tự-loại — verdict DƯƠNG dựa trên EVENTS, không dựa trên spanning (xem §2.3).
4. Cửa kiểm đợt này ~2h24' (23:38Z → 02:02Z 21–22/11), đủ 6 slot HB + 3 slot DR + run vcut 165 (kết cục) và 166 (theo dõi + viết lại #71). Tám lần đọc DB đầy đủ; run 165 được đọc đầy đủ 3 lần khớp hoàn toàn nhau ở mọi trường (đọc #1/#2/#8) + events đọc 2 lần khớp + T2-166 đối chiếu số học khớp; run 166 được đọc đầy đủ 8 lần (started_at đổi đúng 1 lần tại #71, các trường khác không đổi); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (DR 02:00Z: chưa dispatch lúc đọc #7 01:52Z — đọc #8 xác nhận có, không kết luận thiếu vội).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 22:50:50Z + DR 23:00Z thuộc cửa 165 theo quy ước đứng (T7-165 đã đếm); slot DR 00:00Z + HB 23:20:50Z thuộc cửa 166 (sau kiểm cuối T7-165 lúc 23:08Z; HB 23:20:50Z T7-165 giao lại rõ trong LIMITS). HB 02:20:50Z + DR 03:00Z thuộc cửa T7-167.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #2, 1500 s, spawn 00:05:54Z, chết sau ~153 s ~00:08:27Z, 27 s sau btime #71 — killer là reboot #71 + recovery sau reboot, xem F-166-T7-1). 6/7 sleep hoàn thành (5 sleep 1500 s + 1 sleep 600 s); ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2 đã áp dụng). Boot đổi 1 lần trong phiên (d1ddd946 → ea73ac4f tại #71).
7. T7 đóng cờ ~02:0xZ — trễ ~3' so với hạn cờ ~02:00Z (để bắt slot DR 02:00Z — slot này dispatch đúng 02:00:00Z, sau hạn cờ), trong hạn cứng toàn đợt 02:30Z (~25' còn). Run 166 vẫn running lúc đóng cờ — kết cục thuộc T7-167 (hạn ngân sách 02:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix166.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 166 trong NOTES đều tính bằng script (xem F-166-T7-2 — script bắt được 1 epoch gõ tay sai trước khi vào LIMITS). LIMITS chỉ dùng số từ appendix166.txt — không lọt số sai nào vào LIMITS.

## 4. Cập nhật lũy kế (nối tiếp đợt 165, cùng phương pháp)

- Heartbeat: 44/381 → **44/387 slot thiếu** (cửa sổ 14/11 07:50:50 → 22/11 08:50:50 +07). Kiểm toán cửa sổ: 381 + 6 slot mới = 387 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 49/262 → **49/265 slot thiếu** (cửa sổ 11/11 09:00 → 22/11 09:00 +07). Kiểm toán: 262 + 3 = 265 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/387 = 11,4% (giảm từ 11,5% — 0 thiếu mới); DR 49/265 = 18,5% (giảm từ 18,7% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ năm liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 165: SUCCEEDED theo hồ sơ daemon (wall 9.818 s, margin 982 s)** — 3 lần đọc DB đầy đủ khớp nhau + events đầy đủ (5 event, 0 event sau succeeded eid 9886) + T2-166 đối chiếu số học khớp. Margin xếp thứ 6/16 trong chuỗi từ đợt 150 (hẹp hơn 977 s đợt 156 đúng 5 s); rộng hơn run 164 đúng 528 s; 1 lần viết lại tại #70, claimed→finished 8 s — TRỞ LẠI họ 6–11 s của run 154–163 (ghi nhận, không suy đoán nguyên nhân).
2. **Run 165 KHÔNG bị reboot #70 giết** (bị viết lại lần 1 nhưng SUCCEEDED sau đó 1h14m04"; finished 23:19:29Z, sau khi T7-165 đóng sổ ~23:08Z — claim "chưa có kết cục" của T7-165 ĐÚNG lúc đóng).
3. **Reboot #71 (btime 00:08:00Z, boot ea73ac4f): TRONG PHIÊN, giờ thật, KHÔNG nghịch lý đồng hồ.** Gap #70→#71 = 7.355 s (T9-166 xác minh độc lập khớp). Reboot xảy ra 35 s SAU GATE-FOUND cho #70 (poll 26, 00:07:25Z, đường (a)) và TRƯỚC O8 (T8-166) — O8 KHÔNG chạy trên #70, O8 PASS 3/3 trên boot #71 KHÔNG tính chuỗi (GIỮ 19). Số hiệu #71 theo đếm tuần tự — chờ parent xác nhận.
4. **Điểm (m) #71: ỨNG VIÊN DƯƠNG** — run 166 đang chạy tại btime, requeue +41,274 s TRONG dải 33–49,8 s; T7 lean KHÔNG ĐỔI từ đọc #3; đối chiếu độc lập thuộc T2-167 (T2-166 đóng trước #71). **Caveat: spanning btime #71 = 0 là ARTIFACT viết-lại-tự-loại — verdict dựa trên EVENTS.** Nếu CHẤP NHẬN: n ứng viên 24→25 (nhánh khuyến nghị) hoặc 25→26 (nhánh #56 ÂM); n chính thức GIỮ 14.
5. **Điểm (m) #70: DƯƠNG ĐÃ CHẤP NHẬN (quyết (n) đợt 165) + T2-166 đối chiếu độc lập ĐỒNG Ý DƯƠNG (4 nguồn khớp).** **NHƯNG CAVEAT MỚI T5-166:** poll cuối watcher-165 22:05:31Z — 6 s SAU btime #70; offset requeue thật ∈ [2,7 s, 32,7 s] HOÀN TOÀN DƯỚI biên dưới dải dương. T2-166 (đóng sau T5) đã thấy caveat và VẪN ĐỒNG Ý DƯƠNG — phù hợp ghi chú đứng quyết (e) đợt 165. T7 ghi nhận để parent cân nhắc có quyết lại #70 hay không ở đợt 166; T7 KHÔNG tự phán lại. Giao T2-167 kiểm lệch khung tại biên #70/#71 theo cùng mẫu.
6. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-166 không thu hẹp được cửa lần thứ chín: R 2,56251–2,66817 / J 2,566–2,80753 s) — chờ parent chốt J (quyết (d)/(e) đợt 163 + quyết (f) đợt 165 vẫn đứng). T2-167 tiếp tục thu hẹp cửa (tìm neo mới).
7. **Cửa slot: HB 6/6 + DR 3/3, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN (đợt thứ năm liên tiếp).** Lũy kế: HB 44/387, DR 49/265. Muộn HB lũy kế GIỮ 9. Jitter run vcut 0 s lần thứ 19 liên tiếp.
8. **Run 166 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.798 s, còn 2.002 s tới hạn ngân sách 02:35:51Z; 1 lần viết lại tại #71) — kết cục thuộc T7-167.
9. **T7 đóng cờ trễ ~3' so với hạn cờ ~02:00Z** (để bắt slot DR 02:00Z — slot này dispatch đúng 02:00:00Z, sau hạn cờ) — trong hạn cứng 02:30Z. T7 không bỏ slot nào trong cửa.
10. **Mù #96? (#64) VẪN MỞ** theo T2-166 (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — đều vượt sàn; S/T đóng; U hố file MỚI 1.407 s nhưng union đóng). **Mù #95? (#63) MỞ** theo quyết (b) đợt 163. **Mù #94? (#62) MỞ** theo quyết (b) đợt 162. **Mù #88? VẪN MỞ** (hole-recheck lần thứ mười: 337 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110.
11. **INSIDE #70: INSIDE dải FULL116 → chuỗi 5 LÊN 6** (T2-166; T7 chỉ ghi nhận; biên 5.383/1.833 s). INSIDE cho #71 giao T2-167 (dải FULL117 neo 22:05:25Z).
12. **POSTBOOT_PASS #70 ĐÃ CÓ 23:40:45Z (T5-166)** — replay khởi động boot+35s, xong boot+2m43s. **POSTBOOT_PASS #68 KHÔNG CÓ** — boot thứ 9 lọt. **POSTBOOT_PASS #63/#66 KHÔNG CÓ, không bù được.** **POSTBOOT_PASS #71 CHƯA CÓ** — thuộc T5-167. Marker sống qua 22 reboot #49–#70 (T0-166 đếm độc lập 22; sau #71 là 23 — T0/T5-167 đếm lại). Watcher-166 pid 26422 nhiều khả năng chết theo #71; T5-167 kiểm tra lúc mở. Khoảng không-watcher sau #71: sampler/watcher/probe-loop chết theo #71, khởi động lại bằng tay boot+~55s, gap phủ sóng 73 s (T9-166).
13. **Lượt yên #35: KHÔNG CÓ lượt hợp lệ** (T4-166; ngân sách 3/3 hết) — **chuỗi lượt yên hợp lệ #22→#30 ĐỨT tại #35**; chuỗi 0-wedge 9 đợt (157–165) ĐỨT. O8 PASS 3/3 trên boot #71 KHÔNG tính chuỗi — GIỮ 19 (T8-166). Replay (1c): thiết kế gốc LỖI — KHÔNG triển khai, chờ parent duyệt bản sửa (c') (T8-166).
14. **Headroom 6 (dưới ngưỡng lần thứ 26 liên tiếp)** — giữ quyết (k) "chỉ theo dõi" (T9-166). **Cửa sổ thoáng sau reboot ĐƯỢC QUAN SÁT lần thứ tư liên tiếp** (#71 boot+66s 30.001, đóng trước boot+160s). **E-167 ĐÃ ĐỨT trong (23:38:50Z, 23:39:50Z]** (tổng 37 mẫu nếu tính tiếp nối — giao T10 phán); **E-168 MỚI 54 mẫu** (00:48:06–01:41:07Z, 1 chuỗi, 0 sag, CHƯA đứt — kết cục thuộc T9-167); tổng ghim 55/123 (44,7%). ENOSPC ≥56 dòng (cận dưới; #70 ≥47 + #71 9 dòng) — đợt thứ 15 liên tiếp. Birefnet 0 thử lần 20.
15. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T2-166: 0 thử lần thứ 20 liên tiếp). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-166-T7-1 — Sleep #2 bị SIGTERM giết bởi reboot #71 (không phải lỗi tính toán, là sự cố phiên):** sleep 1500 s spawn 00:05:54Z bị SIGTERM sau ~153 s (~00:08:27Z, 27 s sau btime #71, trong lúc daemon recovery — requeue run 166 lúc 00:08:41Z). Killer: reboot #71 + quá trình recovery sau reboot. Đây là sleep thứ ba liên tiếp bị giết bởi reboot trong đợt (đợt 164: sleep #2 bị #68 giết; đợt 165: sleep #4 bị #70 giết; đợt 163: sleep #4 bị #66 giết; đợt 162: 0 sleep bị giết). 6/7 sleep hoàn thành (5 sleep 1500 s + 1 sleep 600 s). Không ảnh hưởng verdict nào (đọc #3 dùng exec trực tiếp sau khi sleep chết; các đọc DB #3–#8 đầy đủ, khớp nhau).
- **F-166-T7-2 — Epoch hạn run 166 gõ tay trong script appendix sai (đã đính chính trước khi viết LIMITS):** bản nháp `appendix166.py` ghi `deadline166 = 1795312951` (sai — đúng 1795314951 = sched + 10800). Phát hiện khi đối chiếu `date -u -d @1795314951` = 02:35:51Z (khớp hạn brief) với số script cũ 02:02:31Z (vô lý — trước cả thời điểm đọc #8). Nguyên nhân: gõ tay epoch thay vì tính `sched + 10800` — CÙNG LỚP LỖI F-165-T7-2 (ghi tay tuổi run). Script đã sửa thành `deadline166 = sched166 + 10800` và chạy lại; mọi số trong appendix166.txt hiện tại đều từ code. LIMITS chỉ dùng số từ appendix166.txt — không lọt số sai nào vào LIMITS. Bài học: epoch hạn cũng phải tính bằng code từ epoch gốc, không gõ tay (mở rộng bài học F-165-T7-2 — lần này T7 tự mắc lại dù đã biết bài học).
- **F-166-T7-3 — Suýt ghi số (m) #62–#66 từ trí nhớ vào script appendix (đã gỡ trước khi chạy):** bản nháp `appendix166.py` §E ghi các delta #62–#66 (+41,111 s / +44,123 s / …) theo trí nhớ từ LIMITS T7-165 §8 mà T7 chưa đọc lại đoạn đó trong phiên (bản đọc bị cắt ở #61). Phát hiện khi tự kiểm tra nguồn gốc từng số trước khi chạy script: các delta này KHÔNG có căn cứ trong phiên. Đã xóa toàn bộ, thay bằng dòng "xem LIMITS T7-165 §8 Phu luc E (T7-166 khong go lai so tu nho)". Không số nào lọt vào appendix166.txt hay LIMITS. Bài học: không bao giờ ghi số liệu từ trí nhớ vào script/phụ lục — chỉ ghi số đã đọc trong phiên hoặc trích từ file đã mở.
- **F-166-T7-0 — Không có sai số tính toán nào khác trong đợt này:** mọi phép trừ epoch/giờ trong LIMITS đều qua script appendix166.py từ epoch thô (bài học F-162-T7-1 đã áp dụng — script chạy ra appendix166.txt, đối chiếu khớp từng số, và đã bắt được F-166-T7-2 + F-166-T7-3); tên event lọc đúng `requeued_after_restart` ngay lần đầu (bài học F-162-T7-2 đã áp dụng); kiểm boot_id SAU khi đọc started_at ở mọi lần đọc (bài học F-142-T7-1 đã áp dụng); kết cục run 165 có 3 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 23:19:29.876Z, eid 9886) + T2-166 đối chiếu số học khớp, không suy đoán sau; btime #70/#71 xác minh 9 nguồn mỗi boot + Cloudflare 8 lần trong phiên (lúc mở chênh 0 s, lúc đóng chênh 1 s — đồng hồ boot mới đúng giờ thật); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng); lean (m) #71 DƯƠNG ứng viên KHÔNG ĐỔI từ đọc #3 (bằng chứng đầy đủ ngay từ đầu — khác #62 đợt 161, xem F-161-T7-1); caveat spanning #71 (viết-lại-tự-loại) được ghi rõ trong LIMITS, không giấu; caveat khung giờ T5-166 về #70 được ghi đầy đủ ở §2.6, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round166-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t7/NOTES.md` + `appendix166.py` + `appendix166.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round166-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix166.py` từ epoch thô — xem file `appendix166.txt` trong round166-t7)

### Phu luc A — Run 165 (ket cuc SUCCEEDED, T7-166)
- sched 1795293351 = 2026-11-21T20:35:51Z; started GOC 1795293351 = 2026-11-21T20:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #70 1795298763 = 2026-11-21T22:06:03Z (requeue 22:06:03.729Z = btime + 38,729 s)
- finished 1795303169 = 2026-11-21T23:19:29Z; status succeeded; attempt 1; error null; timed_out false
- claimed 1795303161 = 2026-11-21T23:19:21Z (finished - 8 s)
- wall tu started GOC: 1795303169 - 1795293351 = 9818 s (2h43m38s)
- han ngan sach: 1795304151 = 2026-11-21T23:35:51Z; margin: 1795304151 - 1795303169 = 982 s (0h16m22s)
- finished SAU btime #70: 1795303169 - 1795298725 = 4444 s (1h14m04s) sau btime
- KHONG co event nao cho run 165 sau succeeded 23:19:29.876Z (eid 9886); tong 5 event
- Margin 982 s vs 164: 454 s — rong hon 528 s; xep thu 6/16 trong chuoi tu dot 150 (hep hon 977 s dot 156 dung 5 s)

### Phu luc B — Reboot #70 / #71
- #69: btime 1795291771 = 2026-11-21T20:09:31Z, boot 9a1a9319
- #70: btime 1795298725 = 2026-11-21T22:05:25Z, boot d1ddd946
- gap #68->#69 (btime-btime): 1795291771 - 1795284390 = 7381 s (2h03m01s)
- gap #69->#70 (btime-btime): 1795298725 - 1795291771 = 6954 s (1h55m54s)
- requeue delta #70 (event created_at - btime): 1795298763.729 - 1795298725 = 38,729 s — TRONG dai 33-49,8 s
- requeue delta #69 (event created_at - btime): 1795291806.432 - 1795291771 = 35,432 s — TRONG dai 33-49,8 s
- #71: btime 1795306080 = 2026-11-22T00:08:00Z, boot ea73ac4f
- gap #70->#71 (btime-btime): 1795306080 - 1795298725 = 7355 s (2h02m35s)
- requeue delta #71 (event created_at - btime): 1795306121.274 - 1795306080 = 41,274 s — TRONG dai 33-49,8 s
- requeue cua RONG 00:08:00-00:30:00Z (moi job): dung 1 dong — requeue run 166 (eid 9898)
- spanning btime #71: 0 dong — ARTIFACT viet-lai-tu-loai (run 166 started_at da viet lai thanh sau btime)

### Phu luc C — Run 166 (van running luc dong co T7-166, 1 lan viet lai tai #71)
- sched 1795304151 = 2026-11-21T23:35:51Z; started GOC 1795304151 = 2026-11-21T23:35:51Z (jitter 0 s — lan thu 19 lien tiep)
- started sau viet lai lan 1 #71 1795306121 = 2026-11-22T00:08:41Z (requeue 00:08:41.274Z = btime + 41,274 s)
- claimed 1795304151 = 2026-11-21T23:35:51Z (started goc + 0 s; KHONG DOI sau viet lai)
- han ngan sach (started goc + 10800): 1795314951 = 2026-11-22T02:35:51Z (ket cuc thuoc T7-167)
- events run 166: 4 event (dispatched 23:35:51.144Z eid 9888 + requeued 00:08:41.274Z eid 9898 + dispatched 00:08:41.339Z eid 9899 + reattached 00:08:41.407Z eid 9900)
- doc #2 2026-11-22T00:05:19Z: tuoi goc 1768 s; con 9032 s toi han
- doc #4 2026-11-22T00:34:52Z: tuoi goc 3541 s; con 7259 s toi han
- doc #5 2026-11-22T01:00:10Z: tuoi goc 5059 s; con 5741 s toi han
- doc #6 2026-11-22T01:26:36Z: tuoi goc 6645 s; con 4155 s toi han
- doc #7 2026-11-22T01:52:09Z: tuoi goc 8178 s; con 2622 s toi han
- doc #8 2026-11-22T02:02:29Z: tuoi goc 8798 s; con 2002 s toi han

### Phu luc D — Slot HB/DR cua T7-166 (doc #1-#8, 23:38Z-02:02Z)
- HB sched 2026-11-21T23:20:50Z: started 2026-11-21T23:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T23:50:50Z: started 2026-11-21T23:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T00:20:50Z: started 2026-11-22T00:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T00:50:50Z: started 2026-11-22T00:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T01:20:50Z: started 2026-11-22T01:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T01:50:50Z: started 2026-11-22T01:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-22T00:00:00Z: started 2026-11-22T00:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-22T01:00:00Z: started 2026-11-22T01:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-22T02:00:00Z: started 2026-11-22T02:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (toan -316 s; 0 muon, 0 thieu), DR 3/3 (toan 0 s; 0 thieu) — CUA LANH
- Luy ke: HB 44/381 -> 44/387 (so thieu +0); DR 49/262 -> 49/265 (so thieu +0)
- Ti le thieu: HB 11,4%; DR 18,5%
- Muon HB luy ke: GIU 9 (+887 s x6, +889 s, +891 s, +888 s dot 161; 0 muon moi dot 166)

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
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 den T2-165 KHONG thu hep duoc cua: R 2,56251-2,66817 s / J 2,566-2,80753 s — lan thu TAM)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — viet lai run 157 lan 2; TINH BANG GIO THAT
- #59 DUONG (+35,173 s) — viet lai run 158 lan 1; TINH BANG GIO THAT
- #60 DUONG (+46,642 s) — CHAP NHAN (quyet (f) dot 159); viet lai run 159 lan 1; TINH BANG GIO THAT
- #61 KHONG PHAI diem du lieu (T7-160: 0 run dang chay tai btime 05:25:49Z; 0 requeue trong cua 05:25:49-05:35:51Z) — cung mau #52
- #62-#66: xem LIMITS T7-165 §8 Phu luc E (T7-166 khong go lai so tu nho)
- #67 KHONG PHAI diem du lieu (0 run dang chay tai btime 17:33:27Z; 0 requeue)
- #68 DUONG (+47,131 s) — viet lai run 164 lan 1; GIU DUONG (quyet (e) dot 165 — KHONG lat)
- #69 DUONG (+35,432 s) — viet lai run 164 lan 2; CHAP NHAN (quyet (f) dot 165)
- #70 DUONG (+38,729 s) — viet lai run 165 lan 1; CHAP NHAN ung vien DUONG (quyet (n) dot 165; doi chieu doc lap T2-166 DONG Y)
- #71 DUONG ung vien (+41,274 s) — viet lai run 166 lan 1 TRONG phien T7-166; doi chieu doc lap thuoc T2-167; cho parent quyet
- n ung vien SAU quyet dot 165: 21 -> 24 (nhanh khuyen nghi) hoac 22 -> 25 (nhanh #56 AM); n chinh thuc GIU 14
- Neu CHAP NHAN them #71 DUONG: n ung vien 24 -> 25 (nhanh khuyen nghi) hoac 25 -> 26 (nhanh #56 AM)
