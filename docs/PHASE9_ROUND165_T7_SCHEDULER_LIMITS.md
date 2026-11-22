# PHASE9 ROUND165 T7 — RUN 164 SUCCEEDED (wall 10.346 s, margin 454 s; 2 LẦN VIẾT LẠI #68 + #69; (m) #69 DƯƠNG ỨNG VIÊN) + REBOOT #70 TRONG PHIÊN (VIẾT LẠI RUN 165 LẦN 1, REQUEUE +38,729 s — ỨNG VIÊN DƯƠNG (m)) + CỬA SLOT 6/6 + 4/4 (0 MUỘN, 0 THIẾU)

- **Luồng:** T7 đợt 165 (lượt cron 03:35 +07 22/11/2026 = 20:35:51Z 21/11). Nhiệm vụ theo brief T7-165: (1) kết cục run 164 — run này vẫn `running` lúc T10-164 đóng sổ (~20:2xZ, tuổi gốc 8.072 s lúc T7-164 đóng cờ, còn 2.728 s tới hạn 20:35:51Z); reboot #69 (btime 20:09:31Z) xảy ra trong lúc T10-164 đóng sổ; (2) điểm (m): #69 phán chính thức (phối hợp T2); (3) run 165 hiện trạng lúc đóng cờ; (4) đồng hồ lúc mở ≈ Cloudflare ±1 s? (khớp T0-165?). Phát hiện thêm trong phiên: **reboot #70 TRONG phiên (btime 22:05:25Z) viết lại run 165 lần 1, requeue btime +38,729 s — ứng viên DƯƠNG (m)** (xem §2.5–2.6).
- **Boot trong phiên:** mở phiên là **9a1a9319-3786-4add-8ffa-c51a1027946e** (btime /proc/stat 1795291771 = 20:09:31Z — **reboot #69 ứng viên, GIỜ THẬT**; T0-165 + T2-165 + T5-165 xác minh độc lập); **reboot #70 TRONG phiên** lúc 22:05:25Z (boot **d1ddd946-f9f3-4561-86e8-5eb3edceb6cc**, btime 1795298725 = 22:05:25Z — **GIỜ THẬT**, T7 xác minh 9 nguồn); boot lúc đóng cờ vẫn d1ddd946 (KHÔNG reboot mới sau #70).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 164/165 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 164 §12.3 (quyết parent (e)/(f)/(p)/(w) — LƯU Ý: quyết parent §12.3 đợt 164 CHƯA CÓ lúc T7-165 đóng cờ, T10-164 mới đóng ~20:2xZ; nền n dùng quyết (e) đợt 163 như T7-164), LIMITS T7-164 + NOTES round164-t7, cờ round165-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done / t9.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 164 kết cục? | **`succeeded`** 20:28:17Z (event 20:28:17.866Z, eid 9844), wall từ started gốc **10.346 s**, margin **454 s** (7m34s) tới hạn 20:35:51Z | §2.1, Phụ lục A |
| Run 164 có bị #69 giết không? | **KHÔNG — bị viết lại lần 2, nhưng SUCCEEDED sau đó** (finished 1.126 s SAU btime #69; requeue +35,432 s; 0 event sau succeeded) | §2.1, §2.2 |
| Run 164 mấy lần viết lại? | **2 lần** (#68 + #69) — lần đầu 2 lần viết lại kể từ đợt 159 | §2.1 |
| Reboot #69 có tạo điểm (m) mới không? | **ỨNG VIÊN DƯƠNG (m)** — run 164 đang chạy tại btime, requeue +35,432 s TRONG dải 33–49,8 s; T2-165 đối chiếu độc lập ĐỒNG Ý DƯƠNG | §2.3 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-165 KHÔNG thu hẹp được cửa LẦN THỨ TÁM**; R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) GIỮ 14** theo quyết (g) đợt 156. N ứng viên **21 (18 dương + 3 âm, nhánh khuyến nghị) hoặc 22 (18 dương + 4 âm, nhánh #56 ÂM)** — SAU quyết (e) đợt 163 chấp nhận #66 DƯƠNG; chưa cộng #68/#69/#70 (chờ parent quyết) | §2.4, §2.6, Phụ lục E |
| Reboot #70 (trong phiên)? | **VIẾT LẠI run 165 lần 1** — requeue 22:06:03.729Z = **btime +38,729 s, TRONG dải 33–49,8 s** → **ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-166) | §2.5, §2.6 |
| Cửa slot đợt 165? | **HB 6/6 (toàn −316 s), DR 4/4 (toàn 0 s), 0 thiếu, 0 muộn** — cửa LÀNH HOÀN TOÀN (đợt thứ tư liên tiếp) | §2.7 |
| Run 165? | **Jitter 0 s** (lần thứ 18 liên tiếp), **1 lần viết lại (tại #70)**, **vẫn `running` lúc đóng cờ** (~23:08Z, tuổi gốc 9.123 s, còn 1.677 s tới hạn 23:35:51Z). Kết cục thuộc T7-166 | §2.5 |
| Đồng hồ lúc mở? | **Cloudflare ±1 s** (4 lần trong phiên: 20:39Z chênh 1 s, 21:05Z chênh 1 s, 22:06Z chênh 1 s, 23:08Z chênh 1 s) — khớp T0-165 | §2.2, §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–164): heartbeat **44/381 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/262 slot thiếu** (số thiếu +0, mẫu số +4). Muộn HB lũy kế **GIỮ 9** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 164 — SUCCEEDED, margin 454 s (đọc #1/#2 + kiểm lại cuối đọc #9b khớp nhau + events đối chiếu trực tiếp + T2-165 đối chiếu số học)

Run 164 (`0a5f9bc9-c4f4-4d68-96c7-f0baa5455606`, sched 1795282551 = 17:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795282551 = 17:35:51Z 21/11 |
| started_at (gốc) | 1795282551 = 17:35:51Z — jitter 0 s |
| started_at sau viết lại lần 1 (#68) | 1795284437 = 18:07:17Z |
| started_at sau viết lại lần 2 (#69) | 1795291806 = 20:10:06Z |
| finished_at_utc | 1795292897 = 20:28:17Z (event `succeeded` 20:28:17.866Z, eid 9844) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795292831 = 20:27:11Z (finished − 66 s) |
| Wall từ started gốc | 1795292897 − 1795282551 = **10.346 s** (2h52m26s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795293351 = 20:35:51Z — finished TRƯỚC hạn **454 s** (7m34s) |
| Finished sau btime #69 | 1795292897 − 1795291771 = 1.126 s (18m46s) SAU btime |

- Events run 164 (đầy đủ, 8 event, không thiếu, không thêm sau succeeded): `dispatched` 17:35:51.168Z (eid 9801, detail "scheduled") + `requeued_after_restart` 18:07:17.131Z (9811, detail "daemon startup recovery") + `dispatched` 18:07:17.283Z (9812, detail "scheduled") + `reattached_after_restart` 18:07:17.410Z (9813, detail "execute turn already complete (model-output evidence)") + **`requeued_after_restart` 20:10:06.432Z (9838, detail "daemon startup recovery")** + `dispatched` 20:10:06.539Z (9839, detail "scheduled") + `reattached_after_restart` 20:10:06.678Z (9840, detail "execute turn already complete (model-output evidence)") + **`succeeded` 20:28:17.866Z (9844)**. **KHÔNG có event nào cho run 164 sau 20:28:17Z** (kiểm lại ở đọc cuối #9b: 0 event mới sau eid 9844; 2 lần viết lại xác nhận bằng events).
- 3 lần đọc DB đầy đủ run 164 trong phiên khớp nhau ở mọi trường (đọc #1 ~20:38Z, #2 ~20:39Z, #9b ~23:08Z — đọc #1 xác nhận kết cục; các đọc sau xác nhận không đổi). T2-165 đối chiếu số học độc lập: **SUCCEEDED 20:28:17Z, wall 10.346 s, margin 454 s, 2 lần viết lại** — KHỚP T7 từng số (LIMITS T2-165 §4.3). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: 1.452 s; 162: 1.065 s; 163: 1.058 s; 164: **454 s** — hẹp hơn run 163 đúng 604 s, xếp thứ 3/15 trong chuỗi từ đợt 150 (sau 177 s đợt 150 và 345 s đợt 157). T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 164 claimed 20:27:11Z (finished − **66 s**) — **NGOÀI họ 6–11 s** của run 154 (7 s) / 155 (8 s) / 158 (10 s) / 160 (7 s) / 161 (6 s) / 162 (11 s) / 163 (8 s). Claimed_at ĐÃ ĐỔI so với đọc #7 của T7-164 (1795282551 = started gốc + 0 s) — đổi sau viết lại #69 (reattach 20:10:06Z, claim lại 20:27:11Z). T7 ghi đúng 66 s, không làm tròn, không suy đoán nguyên nhân. T2-165 ghi nhận cùng chi tiết.
- **T10-164 đóng sổ ~20:2xZ — run 164 finish 20:28:17Z SAU khi T10 đóng** (kiểm cuối của T10 lúc ~20:17Z vẫn boot #69). Claim "run 164 chưa có kết cục" của T10-164 ĐÚNG lúc đóng (cùng mẫu run 161: finish 44 s sau T10-161 đóng; run 162: 87 s sau T10-162 đóng; run 163: 96 s sau T10-163 đóng).
- **Run 164 bị 2 lần viết lại** — chuỗi run bị viết lại: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (1), 162 (0), 163 (1), 164 (**2 lần — lần đầu 2 lần viết lại kể từ đợt 159**).

### 2.2 Reboot #69 (btime 20:09:31Z) — TRONG LÚC T10-164 ĐÓNG SỔ, GIỜ THẬT, KHÔNG NGHỊCH LÝ ĐỒNG HỒ, KHÔNG OVERLAP DÀI

- **Reboot #69: boot 9a1a9319-3786-4add-8ffa-c51a1027946e, btime 1795291771 = 20:09:31Z 21/11.** Xác minh T7 (lúc mở + đọc #1/#2 + đọc #9): boot_id + btime + `uptime -s` 20:09:31Z (khớp) + /proc/1 mtime 20:09:42.436Z (+11,436 s) + journal idx 0 duy nhất, first entry 20:09:42Z (+11 s) + wtmp begins 20:09:42Z (+11 s) + `last` reboot 20:09 still running. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 20:39:21 vs 20:39:20 (chênh 1 s, lúc mở), 21:05:30 vs 21:05:29 (chênh 1 s), 22:06:22 vs 22:06:21 (chênh 1 s), 23:08:02 vs 23:08:01 (chênh 1 s, lúc đóng) — bốn lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1).
- **Gap #68→#69 (btime−btime): 1795291771 − 1795284390 = 7.381 s (2h03m01s).**
- **#69 xảy ra 2 s SAU khi T8-164 đóng cờ (20:09:29Z) và 7'01" TRƯỚC khi T9-164 đóng cờ (20:16:30Z)** — khớp T10-164 §10.5 (x) và T0-165. Boot #68 chết trong (20:09:29Z, 20:09:31Z] — 0 overlap dài (T0-165 xác minh độc lập). T10-164 kiểm cuối lúc ~20:17Z vẫn boot này (uptime 8 phút, khớp btime) — claim "có reboot mới trong lúc T10 đóng sổ" của T10-164 **ĐỨNG**.
- **1 requeue do #69:** cửa 20:09:31–20:40:00Z (mọi job, event `requeued_after_restart`): đúng 1 dòng — requeue run 164 (eid 9838). Không job nào khác bị requeue do #69.
- **Run 164 ĐANG CHẠY tại btime #69:** đọc #7 T7-164 (19:50:23Z) running, started gốc 17:35:51Z; 0 event finish trước btime (events đầy đủ 8 event — không có `succeeded`/`failed` nào trước 20:10:06Z); requeue + reattach tại btime +35,432 s; succeeded sau btime 20:28:17Z.
- **KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài tại #69** (T0-165 9 nguồn + T2-165 hỗ trợ F128? +0,440…+1,322 s, drift 1,0024 + T7 Cloudflare 1 s ×4 — ba bên độc lập, khớp nhau): không có nội dung boot cũ nào đóng dấu sau btime #69 (run 164 succeed 20:28:17Z sau btime 18'46" — nhưng đó là run đã viết lại trên boot mới, không phải nội dung boot cũ; boot #68 chết trong (20:09:29Z, 20:09:31Z]).
- **Số hiệu #69 theo đếm tuần tự** — chờ parent xác nhận (T0/T2/T5/T7-165 xác minh độc lập; T0-165: marker sống qua 21 reboot #49–#69).

### 2.3 Điểm (m) #69 — ỨNG VIÊN DƯƠNG (requeue +35,432 s, trong dải 33–49,8 s; T2-165 đối chiếu độc lập ĐỒNG Ý DƯƠNG)

- **Run 164 ĐANG CHẠY tại btime #69 (20:09:31Z).** Bằng chứng: đọc #7 T7-164 (19:50:23Z) running; 0 event finish trước btime; requeue + reattach tại btime +35,432 s; succeeded sau btime 20:28:17Z; chính phiên T7-165 này mở trên boot #69 sau reboot.
- **Requeue #69: 20:10:06.432Z = btime + 35,432 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 20:09:31–20:40:00Z (mọi job): đúng 1 dòng — requeue run 164 (eid 9838). Không job nào khác bị requeue do #69.
- **Caveat spanning — GHI RÕ, KHÔNG GIẤU:** truy vấn spanning btime #69 trả 0 dòng, NHƯNG ĐÂY LÀ ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy". Run 164 started_at đã viết lại thành 20:10:06Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Đây đúng là caveat T7-162 §2.2 đã cảnh báo và trường hợp #66 đợt 163 / #68 đợt 164 — verdict DƯƠNG ứng viên dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **Khung giờ của phép trừ (quy tắc đứng từ đợt 157 §3.3):** run 164 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 164 ở khung thật; btime #69 xác minh giờ thật 9 nguồn T0/T7 + Cloudflare ±1 s ×4 + T2 hỗ trợ F128?/drift; requeue event `created_at` là timestamp host-side cùng khung thật. Delta 35,432 s lấy từ `created_at` timestamptz trực tiếp (20:10:06.432Z), không qua extract-epoch làm tròn.
- **Lean của T7 — DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #1 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #1 (requeue trong dải là dứt khoát); đọc #2–#9 xác nhận không đổi (không viết lại lần 3, không requeue thêm, không reboot mới trước #70 — #70 là reboot khác, xem §2.5). T7 KHÔNG tự cộng n (điều tra (m) VẪN ĐÓNG theo quyết (f) đợt 162); T10/parent quyết. **T2-165 đối chiếu độc lập: "(m) #69: ĐỒNG Ý DƯƠNG (requeue +35,432 s, đối chiếu độc lập 3 nguồn)"** (cờ T2-165, mtime ~20:54Z; LIMITS T2-165 §4.3). Hai bên thống nhất, không có phân kỳ để T10 phán — trừ caveat khung giờ ở §2.6 (T5-165 §4.2, về #68).
- **Nếu parent CHẤP NHẬN #69 DƯƠNG (một mình):** n ứng viên 21 → **22 (19 dương + 3 âm, nhánh khuyến nghị)** hoặc 22 → **23 (19 dương + 4 âm, nhánh #56 ÂM)**; n chính thức (ứng viên) GIỮ 14 cho tới khi #56 được chốt. **Nếu CHẤP NHẬN cả #68 + #69:** n ứng viên 21 → **23 (20 dương + 3 âm)** hoặc 22 → **24 (20 dương + 4 âm)** (T2-165 tính cùng). Dải dương ứng viên GIỮ 33–49,8 s (#69 +35,432 s nằm trong dải, không mở rộng dải — nhưng chỉ cao hơn biên dưới 2,432 s, xem §2.6).
- **Chữ ký đối chiếu:** khác #67 (0 run đang chạy tại btime, 0 requeue — KHÔNG PHẢI điểm); giống #66/#68 (viết lại run đang chạy, requeue trong dải → DƯƠNG ứng viên).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-165 KHÔNG thu hẹp được cửa LẦN THỨ TÁM

- T2-165 DONE (cờ ~20:54Z): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ TÁM** (xem cờ T2-165; T7 không kiểm lại hướng điều tra); cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n chính thức (ứng viên) GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 + quyết (d)/(e) đợt 161 + quyết (f) đợt 162 + quyết (f) đợt 163** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 21 (nhánh khuyến nghị, chưa cộng #68/#69/#70); nếu J < 2.807 s → #56 là điểm ÂM → n = 22 (chưa cộng #68/#69/#70). Quyết (d) đợt 159 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-165 thêm: mù **#96? (#64) MỞ (ĐIỀU TRA ĐẦY ĐỦ)** (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — y hệt sơ bộ T2-164; S/T đóng) — điều tra đầy đủ XONG đợt này; mù **#88? VẪN MỞ** (hole-recheck lần thứ chín: 337 hit, 0 mốc mới); mù **#95? (#63) MỞ** (quyết (b) đợt 163); mù **#94? (#62) MỞ** (quyết (b) đợt 162); mù **#77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: **#68 INSIDE dải FULL114** [17:59:34Z, 20:00:10Z] neo 17:33:27Z (biên dưới MỎNG 416 s) → chuỗi 3 LÊN 4; **#69 INSIDE dải FULL115** [18:32:39Z, 20:33:05Z] neo 18:06:30Z (biên 5.812/1.414 s) → chuỗi 4 LÊN 5 (cả hai dải CÓ ĐIỀU KIỆN — gap #67/#68 danh nghĩa, chưa vào CERT/FULL chính thức). T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.

### 2.5 Run 165 + reboot #70 (btime 22:05:25Z, TRONG phiên) — VIẾT LẠI LẦN 1, requeue +38,729 s

Run 165 (`b548ba36-77b6-4c4c-bd77-351472631ecd`, sched 1795293351 = 20:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795293351 | 20:35:51Z 21/11 |
| started_at GỐC | 1795293351 | 20:35:51Z — **jitter 0 s** |
| started_at sau viết lại lần 1 (#70) | 1795298763 | 22:06:03Z |
| worker_claimed_at (KHÔNG ĐỔI) | 1795293351 | 20:35:51Z (started gốc + 0 s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795304151 | 23:35:51Z 21/11 |

- 9 lần đọc DB đầy đủ trong phiên: đọc #1–#5 (20:38Z–21:56Z) run 165 `running`, started_at 1795293351 không đổi; đọc #6 (~22:06Z, SAU reboot #70) started_at ĐÃ ĐỔI thành 1795298763; đọc #7–#9 (22:32Z–23:08Z) started_at KHÔNG đổi lần nữa, claimed_at KHÔNG đổi lần nào. **1 lần viết lại duy nhất (tại #70), KHÔNG viết lại lần 2.** Attempt 1; error_text null; worker_execution_timed_out false.
- Events run 165 (đầy đủ, 4 event, 0 event mới sau reattach eid 9870 ở đọc #9): `dispatched` 20:35:51.084Z (eid 9846, detail "scheduled") + **`requeued_after_restart` 22:06:03.729Z (9868, detail "daemon startup recovery")** + `dispatched` 22:06:03.819Z (9869, detail "scheduled") + **`reattached_after_restart` 22:06:03.941Z (9870, detail "execute turn already complete (model-output evidence)")**.
- **Reboot #70: boot d1ddd946-f9f3-4561-86e8-5eb3edceb6cc, btime 1795298725 = 22:05:25Z 21/11.** Xác minh T7 (đọc #6 + đọc #9): boot_id + btime + `uptime -s` 22:05:25Z (khớp) + /proc/1 mtime 22:05:37.372Z (+12,372 s) + journal idx 0 duy nhất, first entry 22:05:37Z (+12 s) + wtmp begins 22:05:37Z (+12 s) + `last` reboot 22:05 still running. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local 22:06:22 vs 22:06:21 (chênh 1 s, lúc phát hiện), 23:08:02 vs 23:08:01 (chênh 1 s, lúc đóng) — hai lần trong phiên, đều trong ±1 s.
- **Gap #69→#70 (btime−btime): 1795298725 − 1795291771 = 6.954 s (1h55m54s).**
- **#70 xảy ra TRONG phiên T7** — sleep #4 bị SIGTERM giết sau ~580 s (~22:05:51Z, 26 s sau btime — killer là reboot #70 + recovery sau reboot, xem F-165-T7-1). T9-165 đã đóng cờ trước #70 (cờ có lúc 22:57Z — T9 đóng sau #70 hay trước, T7 không suy đoán thời điểm phiên T9; T10 thu thập trạng thái cờ lúc đóng). Watcher-165 (START 20:43:49Z pid 28592, theo T5-165) nhiều khả năng chết theo #70 — T5-166 kiểm tra lúc mở. POSTBOOT_PASS #70 CHƯA CÓ — thuộc T5-166.
- **Jitter 0 s** — lần thứ mười tám liên tiếp run vcut jitter 0 (164 là lần thứ mười bảy).
- Tuổi run từ gốc lúc đọc cuối #9 (23:07:54Z): 9.123 s; còn 1.677 s tới hạn ngân sách 23:35:51Z. **Kết cục thuộc T7-166** (hạn cứng đóng đợt 165 là 23:30Z, trước hạn run 165 23:35:51Z).
- Run 165 dispatch SAU btime #69 1.560 s, trên boot #69 (worker_boot_generation cron_boot_8818a1d1...); sau #70, worker_boot_generation mới cron_boot_0c78cfc1.... Hạn ngân sách KHÔNG ĐỔI (tính từ started gốc, không tính từ started viết lại — cùng quy ước các đợt trước).

### 2.6 Điểm (m) #70 — ỨNG VIÊN DƯƠNG (requeue +38,729 s, trong dải 33–49,8 s) + CAVEAT KHUNG GIỜ T5-165 §4.2 (về #68 — ghi rõ, không giấu)

- **Run 165 ĐANG CHẠY tại btime #70 (22:05:25Z).** Bằng chứng: đọc #5 (21:56Z) running, started gốc 20:35:51Z; 0 event finish trước btime (events đầy đủ 4 event — không có `succeeded`/`failed` nào trước 22:06:03Z); requeue + reattach tại btime +38,729 s; chính phiên T7 này bị SIGTERM trong lúc reboot (sleep #4 chết ~22:05:51Z) và session re-attach sau reboot — cùng cơ chế reattach như event 9870 của run 165.
- **Requeue #70: 22:06:03.729Z = btime + 38,729 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 22:05:25–22:30:00Z (mọi job): đúng 1 dòng — requeue run 165 (eid 9868). Không job nào khác bị requeue do #70.
- **Caveat spanning — GHI RÕ, KHÔNG GIẤU:** truy vấn spanning btime #70 trả 0 dòng, NHƯNG ĐÂY LÀ ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy". Run 165 started_at đã viết lại thành 22:06:03Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Verdict DƯƠNG ứng viên dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **Khung giờ của phép trừ (quy tắc đứng từ đợt 157 §3.3):** run 165 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 165 ở khung thật; btime #70 xác minh giờ thật 9 nguồn T7 + Cloudflare ±1 s ×2; requeue event `created_at` là timestamp host-side cùng khung thật. Delta 38,729 s lấy từ `created_at` timestamptz trực tiếp (22:06:03.729Z), không qua extract-epoch làm tròn.
- **Lean của T7 — DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #6 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #6 (requeue trong dải là dứt khoát); đọc #7–#9 xác nhận không đổi (không viết lại lần 2, không requeue thêm, không reboot mới). T7 KHÔNG tự cộng n (điều tra (m) VẪN ĐÓNG); T10/parent quyết. **Đối chiếu độc lập thuộc T2-166** (T2-165 đã đóng 20:54Z — trước #70).
- **Nếu parent CHẤP NHẬN #70 DƯƠNG (một mình):** n ứng viên 21 → **22 (19 dương + 3 âm, nhánh khuyến nghị)** hoặc 22 → **23 (19 dương + 4 âm, nhánh #56 ÂM)**. **Nếu CHẤP NHẬN cả #68 + #69 + #70:** n ứng viên 21 → **24 (21 dương + 3 âm)** hoặc 22 → **25 (21 dương + 4 âm)**; n chính thức (ứng viên) GIỮ 14 cho tới khi #56 được chốt. Dải dương ứng viên GIỮ 33–49,8 s (#70 +38,729 s nằm trong dải, không mở rộng dải). Chuỗi run bị viết lại: 160 (0), 161 (1), 162 (0), 163 (1), 164 (2), 165 (**1** — chuỗi 0-lần-viết-lại không đứt hẳn, cùng mẫu quyết (aa) đợt 162).
- **CAVEAT KHUNG GIỜ — T5-165 §4.2 (về #68, T7 ghi nhận đầy đủ, không lật verdict nào):** T5-165 phát hiện poll cuối watcher-164 18:06:41Z — **11 s SAU btime #68 (18:06:30Z)** — khung giờ #67/#68 lệch nhau ≥11 s; offset requeue thật [15 s, 36 s] đe lên biên dưới dải dương 33–49,8 s — T5 giao T2-165 đối chiếu độc lập, parent quyết lại (m) #68 nếu cần; T5 KHÔNG lật quyết (e) đợt 164. **T2-165 đã thấy cùng dữ kiện** (LIMITS T2-165 §2.3: watcher-164 poll cuối 18:06:41Z — "poll đua với reboot", cùng mẫu watcher-163 9 s sau btime #66) **và VẪN kết luận (m) #68 ĐỒNG Ý DƯƠNG (§4.2)** — T7 ghi nhận cả hai phía, parent quyết cuối. **Đối với #69:** T7 KHÔNG có bằng chứng lệch khung tương tự tại biên #68/#69 (không có nội dung boot #68 nào đóng dấu sau btime #69 được T7/T0/T2 phát hiện; sampler-164: 0 dòng trên #69 theo T2-165 §2.3); delta +35,432 s chỉ cao hơn biên dưới 2,432 s — T7 ghi rõ độ mỏng này, không giấu. **Đối với #70:** cùng phương pháp, delta +38,729 s cao hơn biên dưới 5,729 s; đối chiếu độc lập thuộc T2-166 (giao T2-166 kiểm cả lệch khung tại biên #69/#70 theo mẫu T5-165 §4.2).

### 2.7 Slot HB/DR trong cửa 20:00Z → 23:08Z 21/11 — HB 6/6 (toàn −316 s) + DR 4/4 (toàn 0 s); CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~3h08' (9 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:20:50 (20:20:50Z) | 2d59be4e | 20:15:34 | **−316 s** | CÓ |
| 03:50:50 (20:50:50Z) | 60e3f522 | 20:45:34 | −316 s | CÓ |
| 04:20:50 (21:20:50Z) | 2a62b775 | 21:15:34 | −316 s | CÓ |
| 04:50:50 (21:50:50Z) | beaee8bc | 21:45:34 | −316 s | CÓ |
| 05:20:50 (22:20:50Z) | 5a00549e | 22:15:34 | −316 s | CÓ |
| 05:50:50 (22:50:50Z) | 932813c1 | 22:45:34 | −316 s | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started; jitter −316 s đồng đều tuyệt đối (mẫu chuẩn). HB 22:20:50Z dispatched 10m09s SAU btime #70 trên boot mới #70 — daemon boot mới dispatch bình thường. **0 muộn mới — muộn HB lũy kế GIỮ 9** (đợt thứ tư liên tiếp vắng muộn mới).
- Slot HB 19:50:50Z đã đếm ở đợt 164 — T7-165 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot HB 23:20:50Z chưa dispatch lúc đóng cờ — thuộc cửa T7-166.

**Deterministic-doctor (lưới :00:00Z): 4/4 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:00 (20:00Z) | c0cf9d11 | 20:00:00 | 0 s | CÓ |
| 04:00 (21:00Z) | e45969a0 | 21:00:00 | 0 s | CÓ |
| 05:00 (22:00Z) | 21e032a3 | 22:00:00 | 0 s | CÓ |
| 06:00 (23:00Z) | 298f0622 | 23:00:00 | 0 s | CÓ |

- Cả 4 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 19:00Z đã đếm ở đợt 164 — không đếm lại. DR 22:00Z dispatched 5m25s TRƯỚC btime #70 trên boot #69 — daemon boot cũ dispatch bình thường.

### 2.8 Số hiệu reboot + đối chiếu chéo các luồng đợt 165 (chỉ ghi nhận)

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — XÁC NHẬN quyết (o) đợt 161), #63 = 94d22520 (10:30:42Z, giờ thật — XÁC NHẬN quyết (p) đợt 161), #64 = d9a8d1ce (11:15:18Z, giờ thật — XÁC NHẬN quyết (o) đợt 162), #65 = 1c1cf10c (14:34:57Z, giờ thật — XÁC NHẬN quyết (d) đợt 163), #66 = edb2acdb (16:06:45Z, giờ thật — XÁC NHẬN quyết (e) đợt 163), #67 = f1d4ce1a (17:33:27Z, giờ thật — T0/T2/T5/T7-164 xác minh độc lập, chờ parent xác nhận), #68 = 0c8a94aa (18:06:30Z, giờ thật — T7-164 xác minh 9 nguồn; T2-165 đối chiếu ĐỒNG Ý DƯƠNG — chờ parent xác nhận), #69 = 9a1a9319 (20:09:31Z, giờ thật — T0/T2/T5/T7-165 xác minh độc lập, chờ parent xác nhận), #70 = d1ddd946 (22:05:25Z, giờ thật — T7-165 xác minh 9 nguồn, chờ parent xác nhận; đối chiếu độc lập thuộc T0/T2-166).
- KHÔNG có lệch số hiệu đợt này (T0/T1/T2/T5/T6/T7 đều dùng #69; T2 dùng hệ đếm chặt #138?/#139?/#140? cho cùng ba boot — khác hệ aggregate, ghi nhận như F-161-T1-7).
- Đối chiếu chéo (đọc cờ + LIMITS, chỉ ghi nhận — T7 không kiểm lại công việc luồng khác):
  - **T0-165** (cờ ~20:42Z): #69 xác minh 9 nguồn; KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài; reboot TRONG LÚC T10-164 đóng sổ, 2 s sau T8 đóng cờ — claim T10-164 ĐƯỢC XÁC NHẬN; marker sống qua 21 reboot #49–#69; POSTBOOT_PASS #68/#69 CHƯA CÓ lúc mở; watcher-165 chưa khởi động; O8 JSON 164 còn đúng; dpkg.log 1.545 dòng md5 b9d79ebc. **T0 ghi run 164 (KHÔNG phán — thuộc T7-165): requeue lần 2 tại #69 lúc 20:10:06.432Z (btime +35,432 s, TRONG dải), succeeded 20:28:17.866Z, margin thô 454 s — KHỚP T7 từng số.**
  - **T1-165** (cờ đã có lúc 21:05Z — T7 không đọc nội dung chi tiết, chỉ ghi nhận cờ có mặt; T10 thu thập).
  - **T2-165** (cờ ~20:54Z): probe #84 ok=2 fail=0 (boot 9a1a9319, 20:39:20Z); #69 xác nhận độc lập; mù #96? MỞ (ĐIỀU TRA ĐẦY ĐỦ); mù #88? VẪN MỞ (lần thứ chín: 337 hit, 0 mới); CERT/FULL chính thức GIỮ 76/91 (ứng viên CERT95/FULL110); INSIDE #68 INSIDE dải FULL114 → chuỗi 3 LÊN 4; #69 INSIDE dải FULL115 → chuỗi 4 LÊN 5; (m) #56 không thu hẹp lần thứ tám; **(m) #68 ĐỒNG Ý DƯƠNG + (m) #69 ĐỒNG Ý DƯƠNG (đối chiếu 3 nguồn khớp — KHỚP T7)**; nếu parent CHẤP NHẬN cả hai: n 21→23 / 22→24; birefnet 0 thử lần thứ 19. T2 §2.3 ghi watcher-164 poll cuối 18:06:41Z — 11 s sau btime #68, "poll đua với reboot" (cùng mẫu watcher-163) — xem caveat §2.6.
  - **T4-165** (cờ đã có lúc 21:30Z — T7 không đọc nội dung chi tiết, chỉ ghi nhận cờ có mặt; T10 thu thập).
  - **T5-165** (cờ 20:53Z): POSTBOOT_PASS #68 KHÔNG CÓ (boot thứ 9 không cờ); **#69 ĐÃ CÓ 20:43:50Z** (boot+34m19s, replay đầy đủ); watcher-165 START 20:43:49Z pid 28592; watcher-164 chết theo #68 (poll cuối 18:06:41Z, 52 poll) — xác minh độc lập; marker CÒN, sống qua 21 reboot #49–#69 (KHỚP T0); khoảng không-watcher 2h37m08s — DÀI NHẤT từ trước tới nay; X11: 3 socket mới X193/X194/X195 mtime 20:46Z, 0 Xvfb — giao T8-165 dọn; ENOSPC riêng T5: 20 dòng lúc 20:48:51Z (T9 đếm chính thức). **PHÁT HIỆN MỚI T5 §4.2: poll cuối watcher-164 SAU btime #68 11 s — khung giờ #67/#68 lệch ≥11 s; offset requeue thật [15 s, 36 s] đe lên biên dưới dải dương — giao T2-165 đối chiếu độc lập, parent quyết lại (m) #68 nếu cần; T5 KHÔNG lật quyết (e) đợt 164** — xem §2.6.
  - **T6-165** (cờ đã có lúc 21:05Z — T7 không đọc nội dung chi tiết, chỉ ghi nhận cờ có mặt; T10 thu thập).
  - **T8-165** (cờ đã có lúc 21:56Z — T7 không đọc nội dung chi tiết, chỉ ghi nhận cờ có mặt; T10 thu thập).
  - **T9-165** (cờ đã có lúc 22:57Z — T7 không đọc nội dung chi tiết, chỉ ghi nhận cờ có mặt; T10 thu thập).
- Mù đi kèm: #96? (#64) MỞ (ĐIỀU TRA ĐẦY ĐỦ) theo T2-165; #95? (#63) MỞ theo quyết (b) đợt 163; #94? (#62) MỞ theo quyết (b) đợt 162; #88? VẪN MỞ (hole-recheck lần thứ chín: 337 hit, 0 mốc mới); #77? VẪN MỞ. CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: #68 INSIDE dải FULL114 → chuỗi 3 LÊN 4; #69 INSIDE dải FULL115 → chuỗi 4 LÊN 5 (T2-165; T7 chỉ ghi nhận). INSIDE cho #70 giao T2-166. POSTBOOT_PASS #69 ĐÃ CÓ 20:43:50Z (T5-165); POSTBOOT_PASS #68 KHÔNG CÓ — boot thứ 9 lọt; POSTBOOT_PASS #63/#66 KHÔNG CÓ, không bù được. Marker sống qua 21 reboot #49–#69 (T0/T5-165 khớp nhau; sau #70 là 22 — T0/T5-166 đếm lại). Watcher-165 pid 28592 nhiều khả năng chết theo #70; T5-166 kiểm tra lúc mở.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 164/165 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1: phụ lục chỉ viết bằng script, không gõ tay). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 20:10:06.432Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này: run 164/165 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 164/165 ở khung thật; btime #69/#70 xác minh giờ thật nhiều bên độc lập (T0/T2/T7 + Cloudflare); spanning #69/#70 = 0 là ARTIFACT viết-lại-tự-loại — verdict DƯƠNG dựa trên EVENTS, không dựa trên spanning (xem §2.3/§2.6).
4. Cửa kiểm đợt này ~3h08' (20:00Z → 23:08Z 21/11), đủ 6 slot HB + 4 slot DR + run vcut 164 (kết cục) và 165 (theo dõi + viết lại #70). Chín lần đọc DB đầy đủ; run 164 được đọc đầy đủ 3 lần khớp hoàn toàn nhau ở mọi trường (đọc #1/#2/#9b) + T2-165 đối chiếu số học khớp; run 165 được đọc đầy đủ 9 lần (started_at đổi đúng 1 lần tại #70, các trường khác không đổi); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (DR 23:00Z: chưa dispatch lúc đọc #8 22:57Z — đọc #9 xác nhận có, không kết luận thiếu vội).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 19:50:50Z + DR 19:00Z thuộc cửa 164 theo quy ước đứng (T7-164 đã đếm); slot DR 20:00Z + HB 20:20:50Z thuộc cửa 165 (sau kiểm cuối T7-164 lúc 19:50Z). HB 23:20:50Z + DR 00:00Z (22/11) thuộc cửa T7-166.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #4, 1500 s, spawn 21:56:11Z, chết sau ~580 s ~22:05:51Z, 26 s sau btime #70 — killer là reboot #70 + recovery sau reboot, xem F-165-T7-1). 6/7 sleep hoàn thành (5 sleep 1500 s + 1 sleep 600 s); ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2 đã áp dụng). Boot đổi 1 lần trong phiên (9a1a9319 → d1ddd946 tại #70).
7. T7 đóng cờ ~23:1xZ — trễ ~12' so với hạn cờ ~23:00Z (để bắt slot DR 23:00Z), trong hạn cứng toàn đợt 23:30Z (~18' còn). Run 165 vẫn running lúc đóng cờ — kết cục thuộc T7-166 (hạn ngân sách 23:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix165.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 165 trong NOTES đã đối chiếu lại bằng script sau khi phát hiện 3 tuổi ghi tay sai (xem F-165-T7-2) — LIMITS chỉ dùng số từ appendix165.txt.

## 4. Cập nhật lũy kế (nối tiếp đợt 164, cùng phương pháp)

- Heartbeat: 44/375 → **44/381 slot thiếu** (cửa sổ 14/11 07:50:50 → 22/11 05:50:50 +07). Kiểm toán cửa sổ: 375 + 6 slot mới = 381 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 49/258 → **49/262 slot thiếu** (cửa sổ 11/11 09:00 → 22/11 06:00 +07). Kiểm toán: 258 + 4 = 262 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/381 = 11,5% (giảm từ 11,7% — 0 thiếu mới); DR 49/262 = 18,7% (giảm từ 19,0% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ tư liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 164: SUCCEEDED theo hồ sơ daemon (wall 10.346 s, margin 454 s)** — 3 lần đọc DB đầy đủ khớp nhau + events đầy đủ (8 event, 0 event sau succeeded eid 9844) + T2-165 đối chiếu số học khớp. Margin hẹp thứ 3 trong chuỗi 15 đợt từ 150 (sau 177 s đợt 150, 345 s đợt 157); hẹp hơn run 163 đúng 604 s; 2 lần viết lại tại #68 + #69 (lần đầu 2 lần viết lại kể từ đợt 159). Claimed→finished 66 s — NGOÀI họ 6–11 s của run 154–163 (ghi nhận, không suy đoán nguyên nhân).
2. **Run 164 KHÔNG bị reboot #69 giết** (bị viết lại lần 2 nhưng SUCCEEDED sau đó 18'46"; finished 20:28:17Z, sau khi T10-164 đóng sổ ~20:2xZ — claim "chưa có kết cục" của T10-164 ĐÚNG lúc đóng).
3. **Reboot #69 (btime 20:09:31Z, boot 9a1a9319): TRONG LÚC T10-164 ĐÓNG SỔ, giờ thật, KHÔNG nghịch lý đồng hồ, KHÔNG overlap dài.** Gap #68→#69 = 7.381 s. Reboot xảy ra 2 s SAU khi T8-164 đóng cờ — claim T10-164 ĐƯỢC XÁC NHẬN (T0-165 xác minh độc lập). Số hiệu #69 theo đếm tuần tự — chờ parent xác nhận.
4. **Điểm (m) #69: ỨNG VIÊN DƯƠNG** — run 164 đang chạy tại btime, requeue +35,432 s TRONG dải 33–49,8 s; T7 lean KHÔNG ĐỔI từ đọc #1; T2-165 đối chiếu độc lập ĐỒNG Ý DƯƠNG (3 nguồn khớp). **Caveat: delta chỉ cao hơn biên dưới 2,432 s** (xem §2.6). Nếu CHẤP NHẬN: n ứng viên 21→22 (nhánh khuyến nghị) hoặc 22→23 (nhánh #56 ÂM); nếu chấp nhận cả #68 + #69: 23/24. n chính thức GIỮ 14.
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-165 không thu hẹp được cửa lần thứ tám: R 2,56251–2,66817 / J 2,566–2,80753 s) — chờ parent chốt J (quyết (d)/(e) đợt 163 vẫn đứng). **Quyết parent §12.3 đợt 164 CHƯA CÓ lúc T7-165 đóng cờ** — nền n 21/22 dùng quyết (e) đợt 163 như T7-164; nếu parent đợt 164 đã chấp nhận #68 trước khi quyết #69 thì nền đổi thành 22/23 (T7 ghi rõ điều kiện cộng dồn ở §2.6).
6. **Reboot #70 (btime 22:05:25Z, boot d1ddd946): TRONG PHIÊN, giờ thật, VIẾT LẠI run 165 lần 1 — requeue btime +38,729 s, TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m), chờ parent quyết.** Gap #69→#70 = 6.954 s. Spanning btime #70 = 0 dòng là ARTIFACT viết-lại-tự-loại — verdict dựa trên EVENTS. Đối chiếu độc lập thuộc T2-166. Nếu CHẤP NHẬN cả #68 + #69 + #70: n ứng viên 21→24 (nhánh khuyến nghị) hoặc 22→25 (nhánh #56 ÂM); n chính thức GIỮ 14. Số hiệu #70 theo đếm tuần tự — chờ parent xác nhận.
7. **CAVEAT KHUNG GIỜ T5-165 §4.2 (về #68):** poll cuối watcher-164 18:06:41Z — 11 s SAU btime #68 — khung giờ #67/#68 lệch ≥11 s; offset requeue thật [15 s, 36 s] đe lên biên dưới dải dương 33–49,8 s. T2-165 đã thấy cùng dữ kiện (§2.3, "poll đua với reboot") và VẪN kết luận #68 ĐỒNG Ý DƯƠNG; T5 KHÔNG lật quyết (e) đợt 164. T7 ghi nhận cả hai phía, parent quyết cuối — T7 KHÔNG tự phán lại #68 (thuộc T2-165/parent). Giao T2-166 kiểm lệch khung tại biên #69/#70 theo cùng mẫu.
8. **Cửa slot: HB 6/6 + DR 4/4, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN (đợt thứ tư liên tiếp).** Lũy kế: HB 44/381, DR 49/262. Muộn HB lũy kế GIỮ 9. Jitter run vcut 0 s lần thứ 18 liên tiếp.
9. **Run 165 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 9.123 s, còn 1.677 s tới hạn ngân sách 23:35:51Z; 1 lần viết lại tại #70) — kết cục thuộc T7-166.
10. **T7 đóng cờ trễ ~12' so với hạn cờ ~23:00Z** (để bắt slot DR 23:00Z — slot này dispatch đúng 23:00:00Z, sau hạn cờ) — trong hạn cứng 23:30Z. T7 không bỏ slot nào trong cửa.
11. **Mù #96? (#64) MỞ (ĐIỀU TRA ĐẦY ĐỦ) theo T2-165** (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — đều vượt sàn; S/T đóng). **Mù #95? (#63) MỞ** theo quyết (b) đợt 163. **Mù #94? (#62) MỞ** theo quyết (b) đợt 162. **Mù #88? VẪN MỞ** (hole-recheck lần thứ chín: 337 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110.
12. **INSIDE #68: INSIDE dải FULL114 → chuỗi 3 LÊN 4; INSIDE #69: INSIDE dải FULL115 → chuỗi 4 LÊN 5** (T2-165; T7 chỉ ghi nhận; biên dưới #68 MỎNG 416 s). INSIDE cho #70 giao T2-166.
13. **POSTBOOT_PASS #69 ĐÃ CÓ 20:43:50Z (T5-165)** — replay khởi động boot+34m19s. **POSTBOOT_PASS #68 KHÔNG CÓ** — boot thứ 9 lọt. **POSTBOOT_PASS #63/#66 KHÔNG CÓ, không bù được.** **POSTBOOT_PASS #70 CHƯA CÓ** — thuộc T5-166. Marker sống qua 21 reboot #49–#69 (T0/T5-165 khớp nhau; sau #70 là 22 — T0/T5-166 đếm lại). Watcher-165 pid 28592 nhiều khả năng chết theo #70; T5-166 kiểm tra lúc mở. Khoảng không-watcher 2h37m08s (T5-165) — DÀI NHẤT từ trước tới nay.
14. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T2-165: 0 thử lần thứ 19 liên tiếp). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-165-T7-1 — Sleep #4 bị SIGTERM giết bởi reboot #70 (không phải lỗi tính toán, là sự cố phiên):** sleep 1500 s spawn 21:56:11Z bị SIGTERM sau ~580 s (~22:05:51Z, 26 s sau btime #70, trong lúc daemon recovery — requeue run 165 lúc 22:06:03Z). Killer: reboot #70 + quá trình recovery sau reboot. Đây là sleep thứ hai liên tiếp bị giết bởi reboot trong đợt (đợt 164: sleep #2 bị #68 giết; đợt 163: sleep #4 bị #66 giết; đợt 162: 0 sleep bị giết). 6/7 sleep hoàn thành (5 sleep 1500 s + 1 sleep 600 s). Không ảnh hưởng verdict nào (đọc #6 dùng exec trực tiếp sau khi sleep chết; các đọc DB #6–#9 đầy đủ, khớp nhau).
- **F-165-T7-2 — Tuổi gốc run 165 ghi tay trong NOTES sai ở 3 lần đọc (đã đính chính trước khi viết LIMITS):** #5 ghi 4828 s (đúng 4808 s lúc 21:55:59Z); #7 ghi 6941 s (đúng 7001 s lúc 22:32:32Z); #8 ghi 8452 s (đúng 8512 s lúc 22:57:43Z); số "còn tới hạn" sai theo cùng độ lệch (5972→5992 s; 3859→3799 s; 2348→2288 s). Nguyên nhân: trừ tay giờ–phút–giây (lệch 20–60 s, không theo mẫu cố định) — CÙNG LỚP LỖI F-164-T7-3. Phát hiện khi đối chiếu appendix165.py (tính từ epoch thô bằng script): mọi tuổi trong appendix đều đúng; NOTES đã đính chính cả 3 chỗ (số trong NOTES hiện tại là số script). LIMITS chỉ dùng số từ appendix165.txt — không lọt số sai nào vào LIMITS. Bài học: tuổi run cũng phải tính bằng script từ epoch thô, không trừ tay (mở rộng bài học F-162-T7-1 — lần này T7 tự mắc lại dù đã biết bài học).
- **F-165-T7-0 — Không có sai số tính toán nào khác trong đợt này:** mọi phép trừ epoch/giờ trong LIMITS đều qua script appendix165.py từ epoch thô (bài học F-162-T7-1 đã áp dụng — script chạy ra appendix165.txt, đối chiếu khớp từng số, và đã bắt được F-165-T7-2); tên event lọc đúng `requeued_after_restart` ngay lần đầu (bài học F-162-T7-2 đã áp dụng); kiểm boot_id SAU khi đọc started_at ở mọi lần đọc (bài học F-142-T7-1 đã áp dụng); kết cục run 164 có 3 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 20:28:17.866Z, eid 9844) + T2-165 đối chiếu số học khớp, không suy đoán sau; btime #69/#70 xác minh 9 nguồn mỗi boot + Cloudflare 4 lần trong phiên (lúc mở chênh 1 s, lúc đóng chênh 1 s — đồng hồ boot mới đúng giờ thật); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng); lean (m) #69 DƯƠNG ứng viên KHÔNG ĐỔI từ đọc #1 và lean (m) #70 DƯƠNG ứng viên KHÔNG ĐỔI từ đọc #6 (bằng chứng đầy đủ ngay từ đầu — khác #62 đợt 161, xem F-161-T7-1); caveat spanning #69/#70 (viết-lại-tự-loại) được ghi rõ trong LIMITS, không giấu; caveat khung giờ T5-165 §4.2 được ghi đầy đủ ở §2.6, không giấu.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round165-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t7/NOTES.md` + `appendix165.py` + `appendix165.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round165-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix165.py` từ epoch thô — xem file `appendix165.txt` trong round165-t7)

### Phu luc A — Run 164 (ket cuc SUCCEEDED, T7-165)
- sched 1795282551 = 2026-11-21T17:35:51Z; started GOC 1795282551 = 2026-11-21T17:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #68 1795284437 = 2026-11-21T18:07:17Z (requeue 18:07:17.131Z = btime + 47,131 s)
- started sau viet lai lan 2 #69 1795291806 = 2026-11-21T20:10:06Z (requeue 20:10:06.432Z = btime + 35,432 s)
- finished 1795292897 = 2026-11-21T20:28:17Z; status succeeded; attempt 1; error null; timed_out false
- claimed 1795292831 = 2026-11-21T20:27:11Z (finished - 66 s)
- wall tu started GOC: 1795292897 - 1795282551 = 10346 s (2h52m26s)
- han ngan sach: 1795293351 = 2026-11-21T20:35:51Z; margin: 1795293351 - 1795292897 = 454 s (0h07m34s)
- finished SAU btime #69: 1795292897 - 1795291771 = 1126 s (0h18m46s) sau btime
- KHONG co event nao cho run 164 sau succeeded 20:28:17.866Z (eid 9844); tong 8 event
- Margin 454 s < 163: 1058 s — hep hon 604 s; xep thu 3/15 trong chuoi tu dot 150 (sau 177 s dot 150, 345 s dot 157)

### Phu luc B — Reboot #69 / #70
- #69: btime 1795291771 = 2026-11-21T20:09:31Z, boot 9a1a9319
- #70: btime 1795298725 = 2026-11-21T22:05:25Z, boot d1ddd946
- gap #68->#69 (btime-btime): 1795291771 - 1795284390 = 7381 s (2h03m01s)
- gap #69->#70 (btime-btime): 1795298725 - 1795291771 = 6954 s (1h55m54s)
- requeue delta #69 (event created_at - btime): 1795291806.432 - 1795291771 = 35,432 s — TRONG dai 33-49,8 s
- requeue delta #70 (event created_at - btime): 1795298763.729 - 1795298725 = 38,729 s — TRONG dai 33-49,8 s
- requeue cua RONG 20:09:31-20:40:00Z (moi job): dung 1 dong — requeue run 164 (eid 9838)
- requeue cua RONG 22:05:25-22:30:00Z (moi job): dung 1 dong — requeue run 165 (eid 9868)
- spanning btime #69: 0 dong — ARTIFACT viet-lai-tu-loai (run 164 started_at da viet lai thanh sau btime)
- spanning btime #70: 0 dong — ARTIFACT viet-lai-tu-loai (run 165 started_at da viet lai thanh sau btime)

### Phu luc C — Run 165 (van running luc dong co T7-165, 1 lan viet lai tai #70)
- sched 1795293351 = 2026-11-21T20:35:51Z; started GOC 1795293351 = 2026-11-21T20:35:51Z (jitter 0 s — lan thu 18 lien tiep)
- started sau viet lai lan 1 #70 1795298763 = 2026-11-21T22:06:03Z (requeue 22:06:03.729Z = btime + 38,729 s)
- claimed 1795293351 = 2026-11-21T20:35:51Z (started goc + 0 s; KHONG DOI sau viet lai)
- han ngan sach (started goc + 10800): 1795304151 = 2026-11-21T23:35:51Z (ket cuc thuoc T7-166)
- events run 165: 4 event (dispatched 20:35:51.084Z eid 9846 + requeued 22:06:03.729Z eid 9868 + dispatched 22:06:03.819Z eid 9869 + reattached 22:06:03.941Z eid 9870)
- doc #1 2026-11-21T20:38:23Z: tuoi goc 152 s; con 10648 s toi han
- doc #3 2026-11-21T21:05:20Z: tuoi goc 1769 s; con 9031 s toi han
- doc #4 2026-11-21T21:30:50Z: tuoi goc 3299 s; con 7501 s toi han
- doc #5 2026-11-21T21:55:59Z: tuoi goc 4808 s; con 5992 s toi han
- doc #6 2026-11-21T22:06:12Z: tuoi goc 5421 s; con 5379 s toi han
- doc #7 2026-11-21T22:32:32Z: tuoi goc 7001 s; con 3799 s toi han
- doc #8 2026-11-21T22:57:43Z: tuoi goc 8512 s; con 2288 s toi han
- doc #9 2026-11-21T23:07:54Z: tuoi goc 9123 s; con 1677 s toi han

### Phu luc D — Slot HB/DR cua T7-165 (doc #1-#9, 20:38Z-23:08Z)
- HB sched 2026-11-21T20:20:50Z: started 2026-11-21T20:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T20:50:50Z: started 2026-11-21T20:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T21:20:50Z: started 2026-11-21T21:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T21:50:50Z: started 2026-11-21T21:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T22:20:50Z: started 2026-11-21T22:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T22:50:50Z: started 2026-11-21T22:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-21T20:00:00Z: started 2026-11-21T20:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T21:00:00Z: started 2026-11-21T21:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T22:00:00Z: started 2026-11-21T22:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T23:00:00Z: started 2026-11-21T23:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (toan -316 s; 0 muon, 0 thieu), DR 4/4 (toan 0 s; 0 thieu) — CUA LANH
- Luy ke: HB 44/375 -> 44/381 (so thieu +0); DR 49/258 -> 49/262 (so thieu +0)
- Ti le thieu: HB 11,5%; DR 18,7%
- Muon HB luy ke: GIU 9 (+887 s x6, +889 s, +891 s, +888 s dot 161; 0 muon moi dot 165)

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
- #62 AM — CHAP NHAN (quyet (s) dot 161): run 160 dang chay tai btime 07:59:29Z (that), 0 requeue — chu ky nhu #45; overlap 824-854 s la co che giai thich
- #63 DUONG — CHAP NHAN (quyet (t) dot 161): viet lai run 161 lan 1, requeue 10:31:19.128Z = btime + 37,128 s — TRONG dai 33-49,8 s
- #64 KHONG PHAI diem du lieu (T7-162 + T2-162 doi chieu khop; quyet (f) dot 162): 0 run dang chay tai btime 11:15:18Z (run 161 finished 11:11:39Z, 219 s truoc btime; run 162 started 11:35:51Z, sau btime); 0 requeue trong cua 11:15:18-11:35:51Z — cung mau #52/#61
- #65 KHONG PHAI diem du lieu (T7-163 + T2-163 doi chieu khop; quyet (f) dot 163): 0 run dang chay tai btime 14:34:57Z (run 162 finished 14:18:06Z, 1011 s truoc btime; run 163 started 14:35:51Z, sau btime); 0 requeue trong cua 14:34:57-14:35:51Z — cung mau #52/#61/#64
- #66 DUONG — CHAP NHAN (quyet (e) dot 163; T2-164 doi chieu doc lap DONG Y DUONG, 3 nguon khop): viet lai run 163 lan 1, requeue 16:07:30.460Z = btime + 45,460 s — TRONG dai 33-49,8 s
- #67 KHONG PHAI diem du lieu (T7-164 + T2-164 doi chieu khop): 0 run dang chay tai btime 17:33:27Z (run 163 finished 17:18:13Z, 914 s truoc btime; run 164 started 17:35:51Z, sau btime); 0 requeue trong cua 17:33:27-17:40:00Z — cung mau #52/#61/#64/#65
- #68 DUONG UNG VIEN (T7-164; T2-165 doi chieu doc lap DONG Y DUONG, 3 nguon khop): viet lai run 164 lan 1, requeue 18:07:17.131Z = btime + 47,131 s — TRONG dai 33-49,8 s; cho parent quyet
- #69 DUONG UNG VIEN (T7-165; T2-165 doi chieu doc lap DONG Y DUONG, 3 nguon khop): viet lai run 164 lan 2, requeue 20:10:06.432Z = btime + 35,432 s — TRONG dai 33-49,8 s; cho parent quyet
- #70 DUONG UNG VIEN (T7-165; doi chieu doc lap thuoc T2-166): viet lai run 165 lan 1, requeue 22:06:03.729Z = btime + 38,729 s — TRONG dai 33-49,8 s; cho parent quyet
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet #56
- n ung vien = 21 (18 duong + 3 am, nhanh khuyen nghi) hoac 22 (18 duong + 4 am, nhanh #56 AM) — SAU quyet (e) dot 163 chap nhan #66 DUONG (truoc: 20/21); neu CHAP NHAN #68 DUONG: 22 hoac 23; neu CHAP NHAN ca #68 + #69 DUONG: 23 hoac 24; neu CHAP NHAN ca #68 + #69 + #70 DUONG: 24 hoac 25
- Dai requeue duong ung vien GIU 33-49,8 s (#69 +35,432 s va #70 +38,729 s nam trong dai, khong mo rong dai)
- LUU Y SO HIEU: 348dab54=#56; bcbaa3ad=#57; 28366bd0=#58; eec65561=#59; e590ae0a=#60; 52c957d5=#61; 39d46ba0=#62 (XAC NHAN quyet (o) dot 161); 94d22520=#63 (XAC NHAN quyet (p) dot 161); d9a8d1ce=#64 (XAC NHAN quyet (o) dot 162); 1c1cf10c=#65 (XAC NHAN quyet (d) dot 163); edb2acdb=#66 (XAC NHAN quyet (e) dot 163); f1d4ce1a=#67 (T0/T2/T5/T7-164 xac minh doc lap — cho parent xac nhan); 0c8a94aa=#68 (T7-164 xac minh 9 nguon; T2-165 doi chieu DONG Y DUONG — cho parent xac nhan); 9a1a9319=#69 (T0/T2/T5/T7-165 xac minh doc lap — cho parent xac nhan); d1ddd946=#70 (T7-165 xac minh 9 nguon — cho parent xac nhan; doi chieu doc lap thuoc T0/T2-166)
