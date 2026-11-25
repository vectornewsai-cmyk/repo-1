# PHASE9 ROUND167 T7 — RUN 166 SUCCEEDED (wall 10.269 s, margin 531 s; 2 LẦN VIẾT LẠI #71 + #72; (m) #72 DƯƠNG ĐÃ ĐỐI CHIẾU ĐỘC LẬP) + REBOOT #73 TRƯỚC KHI ĐỢT MỞ (KHÔNG ẢNH HƯỞNG RUN 166) + REBOOT #74 TRONG PHIÊN (VIẾT LẠI RUN 167 LẦN 1, REQUEUE +46,242 s — ỨNG VIÊN DƯƠNG (m)) + CỬA SLOT 6/6 + 3/3 (0 MUỘN, 0 THIẾU)

- **Luồng:** T7 đợt 167 (lượt cron 09:35 +07 22/11/2026 = 02:35:51Z). Nhiệm vụ theo brief T7-167: (1) kết cục run 166 — run này vẫn `running` lúc T7-166 đóng cờ (~02:08Z, tuổi gốc 8.798 s, còn 2.002 s tới hạn 02:35:51Z); (2) run 166 có bị viết lại LẦN 2 tại reboot #72 (btime 02:05:05Z) không; (3) reboot mới #73 (boot b643911f, btime ~02:28:01Z) có ảnh hưởng run 166 không; (4) slot HB/DR đợt 167 + lũy kế; (5) ghi đúng boot lúc đọc DB cuối VÀ boot lúc viết cờ. Phát hiện thêm trong phiên: **reboot #74 TRONG phiên (btime 04:05:29Z) viết lại run 167 lần 1, requeue btime +46,242 s — ứng viên DƯƠNG (m)** (xem §2.4).
- **Boot trong phiên:** mở phiên là **b643911f-d49c-44a0-8048-82984d3461c5** (btime /proc/stat 1795314481 = 02:28:01Z — **reboot #73, GIỜ THẬT**, T7 xác minh 9 nguồn; T0-167 xác minh 9/9 nguồn độc lập); **reboot #74 TRONG phiên** lúc 04:05:29Z (boot **194efd93-ef9b-44e9-b570-0b161c71a080**, btime 1795320329 = 04:05:29Z — **GIỜ THẬT**, T7 xác minh 9 nguồn); boot lúc đọc DB cuối #8 (05:04:40Z) vẫn 194efd93; **boot lúc viết cờ vẫn 194efd93 — KHÔNG đổi sau đọc cuối** (ghi rõ cả hai mốc, bài học T7-166: cờ T7-166 được viết trên boot mới #72 trong khi LIMITS ghi boot cũ).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 166/167 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 166 §12.3 (quyết parent (a)–(o) — **#71 DƯƠNG CHẤP NHẬN, #72 XÁC NHẬN số hiệu, câu hỏi viết lại lần 2 thuộc T7-167/T2-167; n ứng viên 24→25 / 25→26**) + §10.5 (vii)/(xv), LIMITS T7-166 + NOTES round166-t7, cờ round167-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done / t9.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 166 kết cục? | **`succeeded`** 02:27:00Z (event 02:27:00.229Z, eid 9931), wall từ started gốc **10.269 s**, margin **531 s** (8m51s) tới hạn 02:35:51Z | §2.1, Phụ lục A |
| Run 166 có bị #72 viết lại lần 2 không? | **CÓ — VIẾT LẠI LẦN 2 XÁC NHẬN** (requeue 02:05:44.548Z = btime +39,548 s; started_at đổi thành 02:05:44Z) | §2.2 |
| Requeue #72 có trong dải (m) không? | **TRONG dải 33–49,8 s (+39,548 s) → ỨNG VIÊN DƯƠNG (m) #72**; T2-167 đối chiếu độc lập **ĐỒNG Ý DƯƠNG** | §2.2, §2.8 |
| Reboot #73 có ảnh hưởng run 166 không? | **KHÔNG** — run finish 02:27:00Z, **61 s TRƯỚC btime #73** (02:28:01Z); 0 requeue do #73; 0 run đang chạy tại btime #73 | §2.3 |
| (m) #73? | **KHÔNG PHẢI ĐIỂM** — chữ ký giống #52/#61/#67 (0 run đang chạy, 0 requeue); T2-167 đối chiếu độc lập **ĐỒNG Ý KHÔNG PHẢI ĐIỂM** | §2.3, §2.8 |
| Reboot #74 (trong phiên)? | **VIẾT LẠI run 167 lần 1** — requeue 04:06:15.242Z = **btime +46,242 s, TRONG dải 33–49,8 s** → **ỨNG VIÊN DƯƠNG (m) #74** (chờ parent quyết; đối chiếu độc lập thuộc T2-168) | §2.4 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-167 KHÔNG thu hẹp được cửa LẦN THỨ MƯỜI**; R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.5 |
| n mẫu (m)? | **Chính thức GIỮ 14.** N ứng viên **25 (22 dương + 3 âm, nhánh khuyến nghị) hoặc 26 (22 dương + 4 âm, nhánh #56 ÂM)** sau quyết đợt 166 — chưa cộng #72/#74 (chờ parent quyết) | §2.2, §2.4, §2.5, Phụ lục E |
| Cửa slot đợt 167? | **HB 6/6 (toàn −316 s), DR 3/3 (toàn 0 s), 0 thiếu, 0 muộn** — cửa LÀNH HOÀN TOÀN (đợt thứ sáu liên tiếp) | §2.7 |
| Run 167? | **Jitter 0 s** (lần thứ 20 liên tiếp), **1 lần viết lại (tại #74)**, **vẫn `running` lúc đóng cờ** (~05:04Z, tuổi gốc 8.929 s, còn 1.871 s tới hạn 05:35:51Z). Kết cục thuộc T7-168 | §2.6 |
| Đồng hồ lúc mở? | **Cloudflare ±1 s** (5 lần trong phiên: 02:38Z chênh 0 s, 03:05Z chênh 1 s, 03:56Z chênh 0 s, 04:06Z chênh 1 s, 05:04Z chênh 1 s — đều trong ±1 s) — khớp T0-167 | §2.3, §2.4, §2.6 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–166): heartbeat **44/393 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/268 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 166 — SUCCEEDED, margin 531 s (đọc #1 + kiểm lại cuối đọc #8 khớp nhau + events đối chiếu trực tiếp + T0/T2-167 đối chiếu số học)

Run 166 (`5c969404-8c41-459b-be58-3a90bdda104e`, sched 1795304151 = 23:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795304151 = 23:35:51Z 21/11 |
| started_at (gốc) | 1795304151 = 23:35:51Z — jitter 0 s |
| started_at sau viết lại lần 1 (#71) | 1795306121 = 00:08:41Z 22/11 |
| started_at sau viết lại lần 2 (#72) | 1795313144 = 02:05:44Z 22/11 |
| finished_at_utc | 1795314420 = 02:27:00Z (event `succeeded` 02:27:00.229Z, eid 9931) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795314356 = 02:25:56Z (finished − 64 s) |
| Wall từ started gốc | 1795314420 − 1795304151 = **10.269 s** (2h51m09s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795314951 = 02:35:51Z — finished TRƯỚC hạn **531 s** (8m51s) |
| Finished sau btime #72 | 1795314420 − 1795313105 = 1.315 s (21m55s) SAU btime |
| Finished trước btime #73 | 1795314481 − 1795314420 = 61 s (1m01s) TRƯỚC btime |

- Events run 166 (đầy đủ, 8 event, không thiếu, không thêm sau succeeded): `dispatched` 23:35:51.144Z (eid 9888, detail "scheduled") + `requeued_after_restart` 00:08:41.274Z (9898, detail "daemon startup recovery") + `dispatched` 00:08:41.339Z (9899) + `reattached_after_restart` 00:08:41.407Z (9900, detail "execute turn already complete (model-output evidence)") + **`requeued_after_restart` 02:05:44.548Z (9925)** + `dispatched` 02:05:44.589Z (9926) + `reattached_after_restart` 02:05:44.637Z (9927) + **`succeeded` 02:27:00.229Z (9931)**. **KHÔNG có event nào cho run 166 sau 02:27:00Z** (kiểm lại ở đọc cuối #8: 0 event mới sau eid 9931; 2 lần viết lại xác nhận bằng events).
- 2 lần đọc DB đầy đủ run 166 trong phiên khớp nhau ở mọi trường (đọc #1 ~02:38Z, #8 ~05:04Z — đọc #1 xác nhận kết cục; đọc #8 xác nhận không đổi). T0-167 + T2-167 đối chiếu số học độc lập: **SUCCEEDED 02:27:00Z, wall 10.269 s, margin 531 s, claimed→finished 64 s** — KHỚP T7 từng số (cờ T0-167 ~02:41Z, cờ T2-167 ~03:00Z). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: 1.452 s; 162: 1.065 s; 163: 1.058 s; 164: 454 s; 165: 982 s; 166: **531 s** — **hẹp thứ 5/17** trong chuỗi từ đợt 150 (hẹp hơn run 165 đúng 451 s). T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 166 claimed 02:25:56Z (finished − **64 s**) — **ca 60+ s thứ hai** sau ngoại lệ 66 s của run 164 (họ 6–11 s: 154: 7 s, 155: 8 s, 158: 10 s, 160: 7 s, 161: 6 s, 162: 11 s, 163: 8 s, 165: 8 s). T7 ghi đúng 64 s, không làm tròn, không suy đoán nguyên nhân. T0-167 + T2-167 ghi nhận cùng chi tiết ("ngoài họ 6–11 s").
- **Đính chính định nghĩa margin (tránh nhầm với cờ T0-167):** T0 ghi "margin thô tới hạn cứng 180 s" — ĐÓ LÀ khoảng finish → hạn cứng đóng đợt 166 (02:30:00Z), KHÔNG phải margin ngân sách run. Margin ngân sách run (finish → started gốc + 10.800 s = 02:35:51Z) là **531 s**. Cả hai số đều đúng dưới định nghĩa của mình; T7 ghi rõ để T10 không nhầm.
- **T7-166 đóng cờ 02:08:39Z — run 166 finish 02:27:00Z SAU khi T7-166 đóng** (1.101 s = 18m21s sau; kiểm cuối của T7-166 lúc 02:02:29Z vẫn running, tuổi gốc 8.798 s). Claim "run 166 chưa có kết cục" của T7-166 ĐÚNG lúc đóng (cùng mẫu run 161: finish 44 s sau T10-161 đóng; run 162: 87 s; run 163: 96 s; run 164: finish sau T10-164 đóng; run 165: finish 11m29s sau T7-165 đóng).
- **Run 166 bị 2 lần viết lại** — chuỗi run bị viết lại: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (1), 162 (0), 163 (1), 164 (2), 165 (1), 166 (**2**), 167 (**1** — tính tới lúc đóng cờ T7-167).

### 2.2 Viết lại lần 2 tại #72 — XÁC NHẬN + điểm (m) #72 ỨNG VIÊN DƯƠNG (requeue +39,548 s; T2-167 đối chiếu độc lập ĐỒNG Ý DƯƠNG)

- **Reboot #72: boot 9e089ef6-3892-4506-b1aa-b43aa2900fbe, btime 1795313105 = 02:05:05Z 22/11** (parent quyết (d) đợt 166 XÁC NHẬN số hiệu; T10-166 xác minh btime + uptime + journal + wtmp; **T0-167 xác minh bổ sung chỉ 7/9 nguồn** — 2 nguồn KHÔNG có bằng chứng, không khôi phục được từ boot #73 (/proc/1, Cloudflare-đồng-thời); T0 KHÔNG claim đầy đủ 9 nguồn cho #72).
- **Run 166 ĐANG CHẠY tại btime #72 (02:05:05Z).** Bằng chứng: đọc #8 T7-166 (02:02:29Z) running, started gốc 23:35:51Z; 0 event finish trước btime; requeue + reattach tại btime +39,548 s; succeeded sau đó 02:27:00Z.
- **Requeue #72: 02:05:44.548Z = btime + 39,548 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 02:05:05–02:30:00Z (mọi job): đúng 1 dòng — requeue run 166 (eid 9925). Không job nào khác bị requeue do #72.
- **Caveat spanning — GHI RÕ, KHÔNG GIẤU:** truy vấn spanning btime #72 trả 0 dòng, NHƯNG ĐÂY LÀ ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy". Run 166 started_at đã viết lại thành 02:05:44Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Đây đúng là caveat T7-162 §2.2 đã cảnh báo và trường hợp #66 đợt 163 / #68 đợt 164 / #69 + #70 đợt 165 / #71 đợt 166 — verdict DƯƠNG ứng viên dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **Khung giờ của phép trừ (quy tắc đứng từ đợt 157 §3.3 + ghi chú đứng quyết (e) đợt 165):** run 166 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 166 ở khung thật; btime #72 xác minh giờ thật (T10-166: btime + uptime + journal + wtmp; parent xác nhận số hiệu ở quyết (d) đợt 166); requeue event `created_at` là timestamp host-side cùng khung thật. Delta 39,548 s lấy từ `created_at` timestamptz trực tiếp (02:05:44.548Z), không qua extract-epoch làm tròn. **Ghi chú đứng quyết (e) đợt 165: dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m)** — T7 áp dụng đúng ghi chú này cho #72 (giao T2-168 kiểm lệch khung tại biên #72/#73 theo mẫu T5-165 §4.2 / T5-166 §4.2 / T5-167).
- **Đính chính 1 ms (F-167-T2-4, T7 ghi nhận — không đổi verdict):** event created_at là 02:05:44.547571Z → delta 39,547571 s → làm tròn đúng 3 chữ số thập phân là **39,548 s** (T7/T2 dùng). T0-167 ghi 39,547 s = CẮT NGẮN (không làm tròn). Chênh 1 ms, không đổi verdict (cả hai đều trong dải).
- **Lean của T7 — DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #1 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #1 (requeue trong dải là dứt khoát); đọc #8 xác nhận không đổi (không viết lại lần 3, không requeue thêm, không event mới sau succeeded). **T2-167 đối chiếu độc lập: "(m) #72 — ĐỒNG Ý DƯƠNG (ứng viên): requeue 02:05:44.548Z = btime +39,548 s ∈ [33; 49,8]"** (cờ T2-167, ~03:00Z) — KHỚP T7 từng ms. Hai bên thống nhất, không có phân kỳ để T10 phán; parent quyết cuối. T7 KHÔNG tự cộng n (điều tra (m) VẪN ĐÓNG theo quyết (f) đợt 162).
- **Nếu parent CHẤP NHẬN #72 DƯƠNG:** n ứng viên 25 → **26 (22 dương + 3 âm, nhánh khuyến nghị)** hoặc 26 → **27 (22 dương + 4 âm, nhánh #56 ÂM)**; n chính thức GIỮ 14 cho tới khi #56 được chốt. Dải dương ứng viên GIỮ 33–49,8 s (#72 +39,548 s nằm trong dải, không mở rộng dải).
- **Chữ ký đối chiếu:** giống #66/#68/#69/#70/#71 (viết lại run đang chạy, requeue trong dải → DƯƠNG ứng viên); khác #67/#73 (0 run đang chạy tại btime, 0 requeue — KHÔNG PHẢI điểm).

### 2.3 Reboot #73 (btime 02:28:01Z, TRƯỚC khi đợt mở ~8 phút) — KHÔNG ảnh hưởng run 166; (m) #73 KHÔNG PHẢI ĐIỂM

- **Reboot #73: boot b643911f-d49c-44a0-8048-82984d3461c5, btime 1795314481 = 02:28:01Z 22/11.** Xác minh T7 (lúc mở phiên + đọc #1): boot_id + btime + `uptime -s` 02:28:01Z (khớp) + /proc/1 mtime 02:28:13.096Z (+12,096 s) + journal idx 0 duy nhất, first entry 02:28:13Z (+12 s) + wtmp begins 02:28:13Z (+12 s) + `last` reboot 02:28 still running + `who -b` 02:28. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 02:38:20 vs 02:38:20 (chênh 0 s, lúc mở), 03:05:25 vs 03:05:24 (chênh 1 s), 03:56:41 vs 03:56:41 (chênh 0 s), 04:06:43 vs 04:06:42 (chênh 1 s, lúc phát hiện #74), 05:04:52 vs 05:04:51 (chênh 1 s, lúc đóng) — năm lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1). T0-167 xác minh 9/9 nguồn độc lập — KHỚP T7.
- **Gap #72→#73 (btime−btime): 1795314481 − 1795313105 = 1.376 s (22m56s)** — NGẮN NHẤT chuỗi gần đây (trước đó #67→#68 1.983 s). T0-167 xác minh độc lập cùng số.
- **Run 166 KHÔNG bị ảnh hưởng bởi #73:** run đã finish 02:27:00Z — **61 s TRƯỚC btime #73 (02:28:01Z)**. Requeue cửa 02:28:01–02:40:00Z (mọi job): **0 dòng** — #73 không gây requeue nào. Spanning btime #73: **0 dòng — HỢP LỆ** (run 166 finish trước btime; run 167 start 02:35:51Z sau btime; không có run nào đang chạy tại btime). Run 167 chỉ có 1 event dispatched 02:35:51.065Z (eid 9933) — KHÔNG viết lại tại #73 (start sau btime #73, trên boot #73).
- **(m) #73 — KHÔNG PHẢI ĐIỂM (T2-167 đối chiếu độc lập ĐỒNG Ý):** 0 run đang chạy tại btime + 0 requeue — chữ ký giống #52/#61/#67. T2-167 (cờ ~03:00Z): "(m) #73 — KHÔNG PHẢI ĐIỂM (0 requeue, 0 run đang chạy tại btime; run 166 finish 61 s trước btime)" — KHỚP T7. Hai bên thống nhất.
- **Lưu ý T0-167 (ghi nhận):** dpkg.log #73 chỉ 2 dòng (boot+458s), KHÔNG có burst 1.545 dòng lúc T0 đóng — giao T5-167 diễn giải (T5-167: replay #73 chạy đầy đủ 1.751 dòng dpkg, 92 transaction, nhưng postboot FAIL thiếu 4 gói gstreamer — xem §2.8).

### 2.4 Reboot #74 (btime 04:05:29Z 22/11) — TRONG PHIÊN, GIỜ THẬT, VIẾT LẠI RUN 167 LẦN 1, REQUEUE +46,242 s — ỨNG VIÊN DƯƠNG (m)

- **Reboot #74: boot 194efd93-ef9b-44e9-b570-0b161c71a080, btime 1795320329 = 04:05:29Z 22/11.** Xác minh T7 (lúc phát hiện + đọc #5): boot_id + btime + `uptime -s` 04:05:29Z (khớp) + /proc/1 mtime 04:05:44.575Z (+15,575 s) + journal idx 0 duy nhất, first entry 04:05:45Z (+16 s) + wtmp begins 04:05:44Z (+15 s) + `last` reboot 04:05 still running + `who -b` 04:05. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local 04:06:43 vs 04:06:42 (chênh 1 s, lúc phát hiện #74), 05:04:52 vs 05:04:51 (chênh 1 s, lúc đóng) — trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1).
- **Gap #73→#74 (btime−btime): 1795320329 − 1795314481 = 5.848 s (1h37m28s).** T8-167 + T9-167 xác minh độc lập cùng số — KHỚP T7 (xem §2.8 về số 2.248 s của T5).
- **#74 xảy ra TRONG phiên T7** — sleep #4 bị SIGTERM giết sau ~540 s (~04:06:00Z, ~31 s sau btime — killer là reboot #74 + recovery sau reboot, xem F-167-T7-1). T4-167 ghi nhận #74 giết poller instance 1 (113 poll trên boot cũ); T5-167 ghi nhận #74 giết repair thủ công trên #73 giữa chừng (88 s) + watcher-167 lần 1 (poll cuối 04:05:41Z); T8-167 ghi nhận #74 giết waiter #73 + T5 repair + poller T4 instance 1; T9-167 ghi nhận sampler/watcher/probe-loop chết theo #74, khởi động lại boot+83s, gap phủ sóng 77 s.
- **1 requeue do #74:** cửa 04:05:29–04:30:00Z (mọi job, event `requeued_after_restart`): đúng 1 dòng — requeue run 167 (eid 9955). Không job nào khác bị requeue do #74.
- **Run 167 ĐANG CHẠY tại btime #74:** đọc #4 (03:56:32Z) running, started gốc 02:35:51Z; 0 event finish trước btime (events đầy đủ 1 event dispatched — không có `succeeded`/`failed` nào trước 04:06:15Z); requeue + reattach tại btime +46,242 s; vẫn running lúc đóng cờ.
- **Số hiệu #74 theo đếm tuần tự** — chờ parent xác nhận (T7 xác minh 9 nguồn; đối chiếu độc lập thuộc T0/T2-168).

### 2.5 Điểm (m) #74 — ỨNG VIÊN DƯƠNG (requeue +46,242 s, trong dải 33–49,8 s; đối chiếu độc lập thuộc T2-168)

- **Run 167 ĐANG CHẠY tại btime #74 (04:05:29Z).** Bằng chứng: đọc #4 (03:56:32Z) running; 0 event finish trước btime; requeue + reattach tại btime +46,242 s; chính phiên T7 này bị SIGTERM trong lúc reboot (sleep #4 chết ~04:06:00Z) và session re-attach sau reboot — cùng cơ chế reattach như event 9957 của run 167.
- **Requeue #74: 04:06:15.242Z = btime + 46,242 s — TRONG dải dương 33–49,8 s.** Requeue cửa rộng 04:05:29–04:30:00Z (mọi job): đúng 1 dòng — requeue run 167 (eid 9955). Không job nào khác bị requeue do #74.
- **Caveat spanning — GHI RÕ, KHÔNG GIẤU:** truy vấn spanning btime #74 trả 0 dòng, NHƯNG ĐÂY LÀ ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy". Run 167 started_at đã viết lại thành 04:06:15Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Đây đúng là caveat T7-162 §2.2 đã cảnh báo và trường hợp #66/#68/#69/#70/#71/#72 — verdict DƯƠNG ứng viên dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **Khung giờ của phép trừ (quy tắc đứng từ đợt 157 §3.3 + ghi chú đứng quyết (e) đợt 165):** run 167 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 167 ở khung thật; btime #74 xác minh giờ thật 9 nguồn T7 + Cloudflare ±1 s ×2 (lúc phát hiện + lúc đóng); requeue event `created_at` là timestamp host-side cùng khung thật. Delta 46,242 s lấy từ `created_at` timestamptz trực tiếp (04:06:15.242Z), không qua extract-epoch làm tròn. **Ghi chú đứng quyết (e) đợt 165: dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m)** — T7 áp dụng đúng ghi chú này cho #74. **Caveat lệch khung biên #73/#74 (T5-167, ghi nhận — không tự phán):** poll cuối watcher-167 04:05:41Z — 12 s SAU btime #74; giao T2-168 kiểm lệch khung tại biên #73/#74 theo cùng mẫu T5-165 §4.2 / T5-166 §4.2. Theo ghi chú đứng, dữ kiện khung giờ boot cũ = OVERLAP, không đổi verdict (m) — cùng phán quyết (e) đợt 166 cho #70 (overlap ≥6 s) và quyết (e) đợt 165 cho #68 (overlap ≥11 s).
- **Lean của T7 — DƯƠNG ứng viên, KHÔNG ĐỔI từ đọc #5 (ghi rõ):** bằng chứng đã đầy đủ ngay đọc #5 (requeue trong dải là dứt khoát); đọc #6–#8 xác nhận không đổi (không viết lại lần 2, không requeue thêm, không reboot mới). T7 KHÔNG tự cộng n (điều tra (m) VẪN ĐÓNG theo quyết (f) đợt 162); T10/parent quyết. **Đối chiếu độc lập thuộc T2-168** (T2-167 đã đóng 03:00Z — TRƯỚC #74 04:05:29Z).
- **Nếu parent CHẤP NHẬN #74 DƯƠNG (sau khi đã chấp nhận #72):** n ứng viên 26 → **27 (22 dương + 3 âm, nhánh khuyến nghị)** hoặc 27 → **28 (22 dương + 4 âm, nhánh #56 ÂM)**; n chính thức GIỮ 14. Dải dương ứng viên GIỮ 33–49,8 s (#74 +46,242 s nằm trong dải, không mở rộng dải — gần biên trên 49,8 s nhất kể từ #50 +49,761 s).
- **Chữ ký đối chiếu:** giống #66/#68/#69/#70/#71/#72 (viết lại run đang chạy, requeue trong dải → DƯƠNG ứng viên); khác #67/#73 (0 run đang chạy tại btime, 0 requeue — KHÔNG PHẢI điểm).

### 2.6 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-167 KHÔNG thu hẹp được cửa LẦN THỨ MƯỜI

- T2-167 DONE (cờ ~03:00Z): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ MƯỜI** (5 hướng đều âm tính: find /tmp+/opt+/etc+/srv 0 file trong cửa D; Chromium Sessions 0 file; kiểm dưới-giây mốc D-wall muộn nhất vẫn 20:16:36.699Z; /dev/shm trống; apt history 0 entry ngày 20/11); cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n chính thức (ứng viên) GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 + quyết (d)/(e) đợt 161 + quyết (f) đợt 162 + quyết (f) đợt 163 + quyết (f) đợt 165 + quyết (f) đợt 166** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 25 (nhánh khuyến nghị, chưa cộng #72/#74); nếu J < 2.807 s → #56 là điểm ÂM → n = 26 (chưa cộng #72/#74). Quyết (d) đợt 160 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-167 thêm: mù **#96? (#64) VẪN MỞ** (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — y hệt T2-166; S/T đóng; U hố file MỚI 1.407 s nhưng union-A 926 / union-B 773 → ĐÓNG tham chiếu); mù **#88? VẪN MỞ** (hole-recheck lần thứ mười một: 337 hit, 0 mốc mới); mù **#95? (#63) MỞ**; mù **#94? (#62) MỞ**; mù **#77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: **#71 INSIDE dải FULL117** [22:31:37,6Z, 00:31:44,6Z] neo 22:05:25Z (biên 5.782,4/1.424,6 s) → chuỗi 6 LÊN 7; **#72 INSIDE FULL118 → chuỗi 7 LÊN 8** (nếu #71 xác nhận — parent đã CHẤP NHẬN #71 ở quyết (f) đợt 166); **#73 NGOÀI FULL119 sớm 199,8 s → chuỗi ĐỨT tại #73**. T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.

### 2.7 Run 167 + reboot #74 (btime 04:05:29Z, TRONG phiên) — VIẾT LẠI LẦN 1, requeue +46,242 s

Run 167 (`ddb28fcb-7f71-48d3-bfa6-1cb07d1d155c`, sched 1795314951 = 02:35:51Z 22/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795314951 | 02:35:51Z 22/11 |
| started_at GỐC | 1795314951 | 02:35:51Z — **jitter 0 s** |
| started_at sau viết lại lần 1 (#74) | 1795320375 | 04:06:15Z 22/11 |
| worker_claimed_at (KHÔNG ĐỔI) | 1795314951 | 02:35:51Z (started gốc + 0 s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795325751 | 05:35:51Z 22/11 |

- 8 lần đọc DB đầy đủ trong phiên: đọc #1–#4 (02:38Z–03:56Z) run 167 `running`, started_at 1795314951 không đổi; đọc #5 (~04:06Z, SAU reboot #74) started_at ĐÃ ĐỔI thành 1795320375; đọc #6–#8 (04:32Z–05:04Z) started_at KHÔNG đổi lần nữa, claimed_at KHÔNG đổi lần nào. **1 lần viết lại duy nhất (tại #74), KHÔNG viết lại lần 2.** Attempt 1; error_text null; worker_execution_timed_out false.
- Events run 167 (đầy đủ, 4 event, 0 event mới sau reattach eid 9957 ở đọc #8): `dispatched` 02:35:51.065Z (eid 9933, detail "scheduled") + **`requeued_after_restart` 04:06:15.242Z (9955, detail "daemon startup recovery")** + `dispatched` 04:06:15.343Z (9956, detail "scheduled") + **`reattached_after_restart` 04:06:15.455Z (9957, detail "execute turn already complete (model-output evidence)")**.
- **Jitter 0 s** — lần thứ hai mươi liên tiếp run vcut jitter 0 (166 là lần thứ mười chín).
- Tuổi run từ gốc (script, không ghi tay): đọc #2 (03:05:17Z) 1.766 s, còn 9.034 s tới hạn; đọc #3 (03:31:12Z) 3.321 s, còn 7.479 s; đọc #4 (03:56:32Z) 4.841 s, còn 5.959 s; đọc #5 (04:06:42Z) 5.451 s, còn 5.349 s; đọc #6 (04:32:58Z) 7.027 s, còn 3.773 s; đọc #7 (04:59:17Z) 8.606 s, còn 2.194 s; đọc #8 (05:04:40Z) 8.929 s, còn 1.871 s tới hạn ngân sách 05:35:51Z. **Kết cục thuộc T7-168** (hạn cứng đóng đợt 167 là 05:30Z, trước hạn run 167 05:35:51Z).
- Run 167 dispatch trên boot #73 (worker_boot_generation cron_boot_2cbcc980...); sau #74, worker_boot_generation mới cron_boot_25cde4f3.... Hạn ngân sách KHÔNG ĐỔI (tính từ started gốc, không tính từ started viết lại — cùng quy ước các đợt trước).

### 2.8 Slot HB/DR trong cửa 02:20Z → 05:04Z 22/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h26' (8 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:20:50 (02:20:50Z) | 643ca569 | 02:15:34 | **−316 s** | CÓ |
| 09:50:50 (02:50:50Z) | a68e8a74 | 02:45:34 | −316 s | CÓ |
| 10:20:50 (03:20:50Z) | 642201d8 | 03:15:34 | −316 s | CÓ |
| 10:50:50 (03:50:50Z) | f24ae921 | 03:45:34 | −316 s | CÓ |
| 11:20:50 (04:20:50Z) | 5390936f | 04:15:34 | −316 s | CÓ |
| 11:50:50 (04:50:50Z) | 5c7cfe53 | 04:45:34 | −316 s | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started; jitter −316 s đồng đều tuyệt đối (mẫu chuẩn). HB 04:20:50Z dispatched 10m05s SAU btime #74 trên boot mới #74 — daemon boot mới dispatch bình thường. **0 muộn mới — muộn HB lũy kế GIỮ 9** (đợt thứ sáu liên tiếp vắng muộn mới).
- Slot HB 01:50:50Z đã đếm ở đợt 166 — T7-167 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot HB 05:20:50Z chưa dispatch lúc đóng cờ — thuộc cửa T7-168.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 10:00 (03:00Z) | ba7002fa | 03:00:00 | 0 s | CÓ |
| 11:00 (04:00Z) | cc3aba38 | 04:00:00 | 0 s | CÓ |
| 12:00 (05:00Z) | cb1bcf00 | 05:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 02:00Z đã đếm ở đợt 166 — không đếm lại. DR 04:00Z dispatched 5m29s TRƯỚC btime #74 trên boot #73 — daemon boot cũ dispatch bình thường.
- Cửa này chỉ có 3 slot DR (đợt 166 có 3) — mẫu số lũy kế cộng đúng +3, không phải thiếu slot.

### 2.9 Số hiệu reboot + đối chiếu chéo các luồng đợt 167 (chỉ ghi nhận)

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — XÁC NHẬN quyết (o) đợt 161), #63 = 94d22520 (10:30:42Z, giờ thật — XÁC NHẬN quyết (p) đợt 161), #64 = d9a8d1ce (11:15:18Z, giờ thật — XÁC NHẬN quyết (o) đợt 162), #65 = 1c1cf10c (14:34:57Z, giờ thật — XÁC NHẬN quyết (d) đợt 163), #66 = edb2acdb (16:06:45Z, giờ thật — XÁC NHẬN quyết (e) đợt 163), #67 = f1d4ce1a (17:33:27Z, giờ thật — T0/T2/T5/T7-164 xác minh độc lập, chờ parent xác nhận), #68 = 0c8a94aa (18:06:30Z, giờ thật — T7-164 xác minh 9 nguồn; T2-165 đối chiếu ĐỒNG Ý DƯƠNG; parent quyết (e) đợt 165 GIỮ DƯƠNG), #69 = 9a1a9319 (20:09:31Z, giờ thật — T0/T2/T5/T7-165 xác minh độc lập; parent quyết (d)/(f) đợt 165 XÁC NHẬN số hiệu + DƯƠNG), #70 = d1ddd946 (22:05:25Z, giờ thật — T7-165 xác minh 9 nguồn; T0-166 xác minh đầy đủ 9 nguồn; parent quyết (d)/(n) đợt 165 XÁC NHẬN số hiệu + CHẤP NHẬN ứng viên DƯƠNG), #71 = ea73ac4f (00:08:00Z, giờ thật — T7-166 xác minh 9 nguồn; parent quyết (d)/(f) đợt 166 XÁC NHẬN số hiệu + CHẤP NHẬN DƯƠNG; T2-167 đối chiếu độc lập ĐỒNG Ý DƯƠNG), #72 = 9e089ef6 (02:05:05Z, giờ thật — T10-166 xác minh btime + uptime + journal + wtmp; parent quyết (d) đợt 166 XÁC NHẬN số hiệu; **T0-167 xác minh bổ sung chỉ 7/9 nguồn — 2 nguồn không khôi phục được**), #73 = b643911f (02:28:01Z, giờ thật — T7-167 xác minh 9 nguồn; T0-167 xác minh 9/9 nguồn độc lập; chờ parent xác nhận), #74 = 194efd93 (04:05:29Z, giờ thật — T7-167 xác minh 9 nguồn, chờ parent xác nhận; đối chiếu độc lập thuộc T0/T2-168).
- Đối chiếu chéo (đọc cờ + LIMITS, chỉ ghi nhận — T7 không kiểm lại công việc luồng khác):
  - **T0-167** (cờ ~02:41Z): #73 xác minh 9/9 nguồn; gap #72→#73 = 1.376 s — KHỚP T7; **#72 chỉ xác minh được 7/9 nguồn** (T0 KHÔNG claim đầy đủ); run 166 SUCCEEDED 02:27:00Z (8 event, 2 lần viết lại: #71 +41,274 s, #72 +39,547 s — T0 ghi 39,547 s = cắt ngắn, T7/T2 ghi 39,548 s = làm tròn đúng; xem §2.2); **T0 ghi "margin thô tới hạn cứng 180 s" — ĐÓ LÀ tới hạn cứng đóng đợt 166 (02:30Z), KHÔNG phải margin ngân sách run (531 s)** — xem §2.1; marker CÒN — sống qua 25 reboot #49–#73 (đếm độc lập); watcher-166 chết theo #71; watcher-167 chưa khởi động; POSTBOOT_PASS #71/#72/#73 CHƯA CÓ; O8 JSON 166 còn đúng; dpkg.log #73 chỉ 2 dòng (boot+458s), KHÔNG có burst 1.545 dòng — giao T5-167 diễn giải.
  - **T1-167** (cờ 02:52Z): verify 166 PASS; suite 28/28 trên boot #73; đếm đợt 166 = 10 batch / 14 entry / 14 đường dẫn / 13 file mới; lũy kế 111–166 = 548/993/855; chờ push 136–166 = 300/415/359 (TRƯỚC PUSH #8 — xem §5.14); F-167-T1-4 giao T7-167 kiểm run 166 có bị viết lại lần 2 tại #73 không — **ĐÁP: KHÔNG** (run finish trước btime #73; lần viết lại thứ 2 là tại #72, đã xác nhận §2.2).
  - **T2-167** (cờ ~03:00Z): probe #86 ok=2 fail=0 (boot #73, 02:39:11Z); **(m) #71 ĐỒNG Ý DƯƠNG (4 nguồn khớp)** — parent đã CHẤP NHẬN ở quyết (f) đợt 166; **(m) #72 ĐỒNG Ý DƯƠNG (ứng viên): requeue +39,548 s — KHỚP T7 từng ms** (T0 ghi .547Z — chênh 1 ms, F-167-T2-4); **(m) #73 KHÔNG PHẢI ĐIỂM** (0 requeue, 0 run đang chạy tại btime) — KHỚP T7; **(m) #56 KHÔNG thu hẹp được lần thứ MƯỜI**; INSIDE #71: FULL117 → chuỗi 6 LÊN 7; #72 INSIDE FULL118 → chuỗi 7 LÊN 8 (nếu #71 xác nhận); **#73 NGOÀI FULL119 sớm 199,8 s → chuỗi ĐỨT tại #73**; mù #96? VẪN MỞ; mù #88? VẪN MỞ (hole-recheck lần 11: 337 hit, 0 mới); CERT/FULL chính thức GIỮ 76/91; birefnet 0 thử lần 21; ghi chú đứng quyết (e) đợt 165 đã ghi vào LIMITS.
  - **T4-167** (cờ ~04:29Z): lượt yên #36 **CÓ lượt hợp lệ** (attempt1-194efd93, 20/20, tickCost median 59,0 ms ≤ 60; lượt hợp lệ 04:15:44Z) — **chuỗi lượt yên hợp lệ BẮT ĐẦU LẠI sau khi đứt tại #35**; cộng dồn 31 lượt hợp lệ: P1 118/121, P2 112/112, P3-A1 101/121, P3' 85/93 occ = 78/81 distinct-seq, P7 65/65. Reboot #74 giết poller instance 1 (113 poll trên boot cũ, 0 lần cửa mở); restart poller 04:08:34Z, instance 2 mở cửa poll #5 (04:11:35Z, có T5 PASS 04:10:23Z). RAM <500 MB: 38/119 poll (toàn boot cũ). POSTBOOT_PASS boot mới 194efd93 ĐÃ CÓ (04:10:23Z).
  - **T5-167** (cờ 04:33Z): **POSTBOOT_PASS #74 ĐÃ CÓ 04:10:23Z** (boot+4m54s, replay đầy đủ, poll=0; 11/11 gói + 5/5 lib); POSTBOOT_PASS #71 KHÔNG CÓ (boot thứ 10 không cờ, không bù được); #72 KHÔNG CÓ (boot thứ 11); **#73 KHÔNG CÓ (boot thứ 12 không cờ** — replay chạy đầy đủ nhưng postboot FAIL thiếu 4 gói gstreamer; repair thủ công 04:04:01Z bị reboot #74 giết giữa chừng (88 s) — cờ #73 không bao giờ được ghi; nguyên nhân gốc 4 gói: CHƯA XÁC ĐỊNH). Watcher-167: lần 1 pid 18124 trên #73 (START 02:41:01Z, 170 poll, chết theo #74, poll cuối 04:05:41Z = btime #74 +12 s); lần 2 pid 4928 trên #74 (START 04:08:22Z, ĐANG CHẠY). Khoảng không-watcher: 2h32m41s + 2m41s. **Lệch khung giờ: biên #70/#71 = 20 s; biên #73/#74 = 12 s** — giao T2-168 đối chiếu. Marker sống qua #49–#74 = 26 reboot (nếu #74 được xác nhận). ENOSPC: #73: 3 dòng lúc mở; #74: 1 dòng lúc mở, 5 dòng lúc stats 04:18:06Z (T9 đếm chính thức). Hướng (3) VẪN ĐỨNG lần thứ 14. **SAI KHÁC SỐ — T5 ghi gap #73→#74 = 2.248 s, T7 tính 5.848 s** (xem §5.13).
  - **T6-167** (cờ 02:49Z): (A) 120/120 lần thứ 17 liên tiếp (tổng 2040/2040); prune lần 42 (queue 101 → 100); #71/#72/#73 KHÔNG giết holder (chuỗi "không giết holder" mới từ #69: 5 reboot); double-acquire/STALE-LOCK GIỮ 12 (0 ca mới).
  - **T8-167** (cờ ~05:01Z): O8 PASS 3/3 TRÊN BOOT #74 (WebKit 21/21 ×2 + Chromium 21/21, DONE 04:35:52Z) — **đề xuất chuỗi WebKit FULL PASS LÊN 20 (19→20)**; gate (a) chuẩn (lượt yên #36 có lượt hợp lệ + POSTBOOT_PASS #74 04:10:23Z, cùng boot #74; O8 chạy sau lượt hợp lệ trên cùng boot); harness 6/6 exit 0, 0 kẹt; kẹt cộng dồn GIỮ 16; chuỗi "P3 không kẹt" 1 → 2; **(1c') (c') triển khai diag-only: 0 kích hoạt, 0 FP trong chạy thật; replay C5.1 ĐẠT; (c') ĐƯỢC GIỮ**; **gap #73→#74 = 5.848 s — KHỚP T7** (xác nhận độc lập lần thứ hai).
  - **T9-167** (cờ 04:59Z): headroom 0 lúc đóng — dưới ngưỡng lần thứ 27 liên tiếp; **cửa sổ thoáng sau reboot ĐƯỢC QUAN SÁT lần thứ 5 liên tiếp** (#74 boot+86s); balloon **E-169 MỚI**: 20 mẫu, 4 chuỗi, 3 sag, boot #73, ĐÃ KẾT THÚC (đứt không quan sát được — reboot #74 cắt ngang); E-168 GIỮ 54 mẫu (kết cục trong khoảng mù 3.446 s, 2 reboot); tổng ghim 20/128 (15,6%); ENOSPC ≥76 dòng (cận dưới: #73 ≥54 + #74 22) — đợt thứ 16 liên tiếp; birefnet 0 thử lần 21; **gap #73→#74 = 5.848 s — KHỚP T7** (xác nhận độc lập lần thứ ba); lượt yên #36 CÓ lượt hợp lệ — chuỗi bắt đầu lại.
- Mù đi kèm: #96? (#64) VẪN MỞ (T2-167 theo dõi tiếp); #95? (#63) MỞ theo quyết (b) đợt 163; #94? (#62) MỞ theo quyết (b) đợt 162; #88? VẪN MỞ (hole-recheck lần thứ mười một: 337 hit, 0 mốc mới); #77? VẪN MỞ. CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110. INSIDE: #71 INSIDE dải FULL117 → chuỗi 6 LÊN 7; #72 INSIDE FULL118 → chuỗi 7 LÊN 8 (nếu #71 xác nhận — parent đã CHẤP NHẬN #71); **#73 NGOÀI FULL119 sớm 199,8 s → chuỗi ĐỨT tại #73** (T2-167; T7 chỉ ghi nhận). INSIDE cho #74 giao T2-168 (dải FULL120 neo 00:08:00Z). POSTBOOT_PASS #74 ĐÃ CÓ 04:10:23Z (T5-167); POSTBOOT_PASS #71/#72/#73 KHÔNG CÓ — boot thứ 10/11/12 không cờ. Marker sống qua 25 reboot #49–#73 (T0-167 đếm độc lập 25; sau #74 là 26 nếu #74 được xác nhận — T0/T5-168 đếm lại). Watcher-167 lần 2 pid 4928 ĐANG CHẠY trên #74; T5-168 kiểm tra lúc mở.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 166/167 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1: phụ lục chỉ viết bằng script, không gõ tay). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 04:06:15.242Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3) + ghi chú đứng quyết (e) đợt 165: dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Đợt này: run 166/167 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 166/167 ở khung thật; btime #73/#74 xác minh giờ thật nhiều bên độc lập (T0/T2/T5/T7/T8/T9 + Cloudflare); spanning #72/#74 = 0 là ARTIFACT viết-lại-tự-loại — verdict DƯƠNG dựa trên EVENTS, không dựa trên spanning (xem §2.2/§2.5); spanning #73 = 0 là HỢP LỆ (run 166 finish trước btime, run 167 start sau btime).
4. Cửa kiểm đợt này ~2h26' (02:38Z → 05:04Z 22/11), đủ 6 slot HB + 3 slot DR + run vcut 166 (kết cục) và 167 (theo dõi + viết lại #74). Tám lần đọc DB đầy đủ; run 166 được đọc đầy đủ 2 lần khớp hoàn toàn nhau ở mọi trường (đọc #1/#8) + events đọc 2 lần khớp + T0/T2-167 đối chiếu số học khớp; run 167 được đọc đầy đủ 8 lần (started_at đổi đúng 1 lần tại #74, các trường khác không đổi); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (DR 05:00Z: chưa dispatch lúc đọc #7 04:59Z — đọc #8 xác nhận có, không kết luận thiếu vội).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 01:50:50Z + DR 02:00Z thuộc cửa 166 theo quy ước đứng (T7-166 đã đếm); slot DR 03:00Z + HB 02:20:50Z thuộc cửa 167 (sau kiểm cuối T7-166 lúc 02:02:29Z; HB 02:20:50Z T7-166 giao lại rõ trong LIMITS). HB 05:20:50Z + DR 06:00Z thuộc cửa T7-168.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #4, 1500 s, spawn 03:57:00Z, chết sau ~540 s ~04:06:00Z, ~31 s sau btime #74 — killer là reboot #74 + recovery sau reboot, xem F-167-T7-1). 6/7 sleep hoàn thành (5 sleep 1500 s + 1 sleep 300 s); ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2 đã áp dụng). Boot đổi 1 lần trong phiên (b643911f → 194efd93 tại #74).
7. T7 đóng cờ ~05:05Z — trễ ~5' so với hạn cờ ~05:00Z (để bắt slot DR 05:00Z — slot này dispatch đúng 05:00:00Z, sau hạn cờ), trong hạn cứng toàn đợt 05:30Z (~25' còn). Run 167 vẫn running lúc đóng cờ — kết cục thuộc T7-168 (hạn ngân sách 05:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix167.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 167 trong NOTES đều tính bằng script (xem F-167-T7-0). LIMITS chỉ dùng số từ appendix167.txt — không lọt số sai nào vào LIMITS.

## 4. Cập nhật lũy kế (nối tiếp đợt 166, cùng phương pháp)

- Heartbeat: 44/387 → **44/393 slot thiếu** (cửa sổ 14/11 07:50:50 → 22/11 11:50:50 +07). Kiểm toán cửa sổ: 387 + 6 slot mới = 393 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 49/265 → **49/268 slot thiếu** (cửa sổ 11/11 09:00 → 22/11 12:00 +07). Kiểm toán: 265 + 3 = 268 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/393 = 11,2% (giảm từ 11,4% — 0 thiếu mới); DR 49/268 = 18,3% (giảm từ 18,5% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ sáu liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 166: SUCCEEDED theo hồ sơ daemon (wall 10.269 s, margin 531 s)** — 2 lần đọc DB đầy đủ khớp nhau + events đầy đủ (8 event, 0 event sau succeeded eid 9931) + T0/T2-167 đối chiếu số học khớp. Margin xếp thứ 5/17 hẹp nhất trong chuỗi từ đợt 150 (hẹp hơn run 165 đúng 451 s); 2 lần viết lại tại #71 + #72, claimed→finished 64 s — ca 60+ s thứ hai sau 66 s của run 164 (ghi nhận, không suy đoán nguyên nhân).
2. **Run 166 KHÔNG bị reboot #73 giết** — run finish 02:27:00Z, 61 s TRƯỚC btime #73; 0 requeue do #73; run 167 start sau btime #73, không viết lại tại #73. (m) #73 KHÔNG PHẢI ĐIỂM — T2-167 đối chiếu độc lập ĐỒNG Ý.
3. **Reboot #74 (btime 04:05:29Z, boot 194efd93): TRONG PHIÊN, giờ thật, KHÔNG nghịch lý đồng hồ.** Gap #73→#74 = 5.848 s (T8/T9-167 xác minh độc lập khớp). Reboot xảy ra trong lúc T5 đang repair #73 (giết repair giữa chừng 88 s) và TRƯỚC lượt yên #36 (T4 restart poller, lượt hợp lệ 04:15:44Z trên boot #74) — O8 PASS 3/3 trên boot #74, đề xuất chuỗi LÊN 20 (T8-167). Số hiệu #74 theo đếm tuần tự — chờ parent xác nhận.
4. **Điểm (m) #72: ỨNG VIÊN DƯƠNG** — run 166 đang chạy tại btime, requeue +39,548 s TRONG dải 33–49,8 s; T2-167 đối chiếu độc lập ĐỒNG Ý DƯƠNG (khớp từng ms); T7 lean KHÔNG ĐỔI từ đọc #1. **Caveat: spanning btime #72 = 0 là ARTIFACT viết-lại-tự-loại — verdict dựa trên EVENTS.** Nếu CHẤP NHẬN: n ứng viên 25→26 (nhánh khuyến nghị) hoặc 26→27 (nhánh #56 ÂM); n chính thức GIỮ 14.
5. **Điểm (m) #74: ỨNG VIÊN DƯƠNG** — run 167 đang chạy tại btime, requeue +46,242 s TRONG dải 33–49,8 s; T7 lean KHÔNG ĐỔI từ đọc #5; đối chiếu độc lập thuộc T2-168 (T2-167 đóng trước #74). **Caveat: spanning btime #74 = 0 là ARTIFACT viết-lại-tự-loại — verdict dựa trên EVENTS. Caveat lệch khung biên #73/#74 (T5-167): poll cuối watcher-167 04:05:41Z — 12 s SAU btime #74; giao T2-168 kiểm theo mẫu T5 — theo ghi chú đứng, dữ kiện khung giờ boot cũ = OVERLAP, không đổi verdict (m).** Nếu CHẤP NHẬN cả #72 + #74: n ứng viên 25→27 (nhánh khuyến nghị) hoặc 26→28 (nhánh #56 ÂM); n chính thức GIỮ 14.
6. **Điểm (m) #71: DƯƠNG ĐÃ CHẤP NHẬN (quyết (f) đợt 166) + T2-167 đối chiếu độc lập ĐỒNG Ý DƯƠNG (4 nguồn khớp).** #70 GIỮ DƯƠNG theo quyết (e) đợt 166 — KHÔNG lật. T7 KHÔNG tự phán lại #70/#71.
7. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-167 không thu hẹp được cửa lần thứ mười: R 2,56251–2,66817 / J 2,566–2,80753 s) — chờ parent chốt J (quyết (d)/(e) đợt 163 + quyết (f) đợt 166 vẫn đứng). T2-168 tiếp tục thu hẹp cửa (tìm neo mới).
8. **Cửa slot: HB 6/6 + DR 3/3, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN (đợt thứ sáu liên tiếp).** Lũy kế: HB 44/393, DR 49/268. Muộn HB lũy kế GIỮ 9. Jitter run vcut 0 s lần thứ 20 liên tiếp.
9. **Run 167 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.929 s, còn 1.871 s tới hạn ngân sách 05:35:51Z; 1 lần viết lại tại #74) — kết cục thuộc T7-168.
10. **T7 đóng cờ trễ ~5' so với hạn cờ ~05:00Z** (để bắt slot DR 05:00Z — slot này dispatch đúng 05:00:00Z, sau hạn cờ) — trong hạn cứng 05:30Z. T7 không bỏ slot nào trong cửa.
11. **Mù #96? (#64) VẪN MỞ** theo T2-167 (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — đều vượt sàn; S/T đóng; U hố file MỚI 1.407 s nhưng union đóng). **Mù #95? (#63) MỞ** theo quyết (b) đợt 163. **Mù #94? (#62) MỞ** theo quyết (b) đợt 162. **Mù #88? VẪN MỞ** (hole-recheck lần thứ mười một: 337 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT95/FULL110.
12. **INSIDE #71: INSIDE dải FULL117 → chuỗi 6 LÊN 7** (T2-167; T7 chỉ ghi nhận; biên 5.782,4/1.424,6 s). **#72 INSIDE FULL118 → chuỗi 7 LÊN 8** (nếu #71 xác nhận — parent đã CHẤP NHẬN #71). **#73 NGOÀI FULL119 sớm 199,8 s → chuỗi ĐỨT tại #73** (T2-167; T7 chỉ ghi nhận). INSIDE cho #74 giao T2-168 (dải FULL120 neo 00:08:00Z).
13. **SAI KHÁC SỐ — gap #73→#74: T5-167 ghi 2.248 s, T7/T8/T9 tính 5.848 s.** Gap btime−btime từ btime đã xác minh (T0-167 9/9 cho #73 + T7-167 9/9 cho #74): 1795320329 − 1795314481 = **5.848 s**. Số 2.248 s của T5 KHÔNG khớp btime nào đã xác minh — ba bên độc lập (T7/T8/T9) cùng 5.848 s. T7 ghi nhận sai khác, giao T10-167 phán (T7 không suy đoán T5 tính bằng mốc nào; không ảnh hưởng verdict (m) #74 — requeue offset tính từ btime #74 trực tiếp, không qua gap).
14. **PUSH #8 ĐÃ XONG trong lúc đợt 167 chạy** (theo MEMORY cập nhật ngoài phiên lúc ~03:0xZ; user nói "push đi nào" 09:48 +07 22/11): đợt 136–165, 346 file duy nhất / 14.387.764 byte, 6 commit, HEAD 3d8eecf9ce77162370222788516505fb04f91699, verify 22/22. **Batch chờ push còn lại: đợt 166–167** (14 batch / 18 entry / 18 file duy nhất theo MEMORY — đợt 166 đã đóng 10/14/14, đợt 167 đang chạy, mới stage 4/4/4 lúc MEMORY cập nhật; T10-167 kiểm lại số đếm cuối đợt). T7 chỉ ghi nhận, không tự kiểm đếm push. File oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` — số phận vẫn chưa quyết.
15. **POSTBOOT_PASS #74 ĐÃ CÓ 04:10:23Z (T5-167)** — replay khởi động boot+4m54s. **POSTBOOT_PASS #71/#72/#73 KHÔNG CÓ** — boot thứ 10/11/12 không cờ. **POSTBOOT_PASS #68 KHÔNG CÓ** — boot thứ 9 lọt. **POSTBOOT_PASS #63/#66 KHÔNG CÓ, không bù được.** Marker sống qua 25 reboot #49–#73 (T0-167 đếm độc lập 25; sau #74 là 26 nếu #74 được xác nhận — T0/T5-168 đếm lại). Watcher-167 lần 2 pid 4928 ĐANG CHẠY trên #74; T5-168 kiểm tra lúc mở. Khoảng không-watcher sau #74: 2m41s (T5-167).
16. **Lượt yên #36: CÓ lượt hợp lệ** (T4-167; attempt1-194efd93, 20/20, tickCost median 59,0 ms) — **chuỗi lượt yên hợp lệ BẮT ĐẦU LẠI sau khi đứt tại #35**; cộng dồn 31 lượt hợp lệ. O8 PASS 3/3 trên boot #74 — đề xuất chuỗi WebKit FULL PASS LÊN 20 (T8-167). (1c') (c') triển khai diag-only, 0 FP trong chạy thật — (c') ĐƯỢC GIỮ (T8-167). H3 VẪN MỞ, chỉ giám sát thụ động.
17. **Headroom 0 (dưới ngưỡng lần thứ 27 liên tiếp)** — giữ quyết (k) "chỉ theo dõi" (T9-167). **Cửa sổ thoáng sau reboot ĐƯỢC QUAN SÁT lần thứ 5 liên tiếp** (#74 boot+86s). **E-169 MỚI** 20 mẫu (boot #73, ĐÃ KẾT THÚC — đứt không quan sát được, reboot #74 cắt ngang); E-168 GIỮ 54 mẫu (kết cục trong khoảng mù 3.446 s, 2 reboot); tổng ghim 20/128 (15,6%). ENOSPC ≥76 dòng (cận dưới; #73 ≥54 + #74 22) — đợt thứ 16 liên tiếp. Birefnet 0 thử lần 21.
18. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T2-167: 0 thử lần thứ 21 liên tiếp). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-167-T7-1 — Sleep #4 bị SIGTERM giết bởi reboot #74 (không phải lỗi tính toán, là sự cố phiên):** sleep 1500 s spawn 03:57:00Z bị SIGTERM sau ~540 s (~04:06:00Z, ~31 s sau btime #74, trong lúc daemon recovery — requeue run 167 lúc 04:06:15Z). Killer: reboot #74 + quá trình recovery sau reboot. Đây là sleep thứ hai liên tiếp bị giết bởi reboot trong 2 đợt (đợt 166: sleep #2 bị #71 giết; đợt 165: sleep #4 bị #70 giết; đợt 164: sleep #2 bị #68 giết; đợt 163: sleep #4 bị #66 giết; đợt 162: 0 sleep bị giết). 6/7 sleep hoàn thành (5 sleep 1500 s + 1 sleep 300 s). Không ảnh hưởng verdict nào (đọc #5 dùng exec trực tiếp sau khi sleep chết; các đọc DB #5–#8 đầy đủ, khớp nhau).
- **F-167-T7-0 — Không có sai số tính toán nào khác trong đợt này:** mọi phép trừ epoch/giờ trong LIMITS đều qua script appendix167.py từ epoch thô (bài học F-162-T7-1 đã áp dụng — script chạy ra appendix167.txt, đối chiếu khớp từng số); deadline run 166/167 tính bằng code `sched + 10800`, không gõ tay (bài học F-166-T7-2 đã áp dụng — không lặp lại lỗi đó); không ghi số (m) nào từ trí nhớ vào script — #62–#66 chỉ tham chiếu LIMITS T7-165 §8 (bài học F-166-T7-3 đã áp dụng); tên event lọc đúng `requeued_after_restart` ngay lần đầu (bài học F-162-T7-2 đã áp dụng); kiểm boot_id SAU khi đọc started_at ở mọi lần đọc (bài học F-142-T7-1 đã áp dụng); kết cục run 166 có 2 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 02:27:00.229Z, eid 9931) + T0/T2-167 đối chiếu số học khớp, không suy đoán sau; btime #73/#74 xác minh 9 nguồn mỗi boot + Cloudflare 5 lần trong phiên (lúc mở chênh 0 s, lúc đóng chênh 1 s — đồng hồ boot mới đúng giờ thật); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng); lean (m) #72 DƯƠNG ứng viên KHÔNG ĐỔI từ đọc #1 và lean (m) #74 DƯƠNG ứng viên KHÔNG ĐỔI từ đọc #5 (bằng chứng đầy đủ ngay từ đầu — khác #62 đợt 161, xem F-161-T7-1); caveat spanning #72/#74 (viết-lại-tự-loại) được ghi rõ trong LIMITS, không giấu; caveat lệch khung biên #73/#74 (T5-167) được ghi đầy đủ ở §2.5, không giấu; sai khác số gap #73→#74 (T5: 2.248 s vs T7/T8/T9: 5.848 s) được ghi rõ ở §5.13, không giấu; định nghĩa margin "180 s" của T0 được đính chính ở §2.1, không để nhầm lẫn.

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round167-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round167-t7/NOTES.md` + `appendix167.py` + `appendix167.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round167-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix167.py` từ epoch thô — xem file `appendix167.txt` trong round167-t7)

### Phu luc A — Run 166 (ket cuc SUCCEEDED, T7-167 doc #1)
- sched 1795304151 = 2026-11-21T23:35:51Z; started GOC 1795304151 = 2026-11-21T23:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #71 1795306121 = 2026-11-22T00:08:41Z (requeue 00:08:41.274Z = btime + 41,274 s)
- started sau viet lai lan 2 #72 1795313144 = 2026-11-22T02:05:44Z (requeue 02:05:44.548Z = btime + 39,548 s)
- finished 1795314420 = 2026-11-22T02:27:00Z; status succeeded; attempt 1; error null; timed_out false
- claimed 1795314356 = 2026-11-22T02:25:56Z (finished - 64 s)
- wall tu started GOC: 1795314420 - 1795304151 = 10269 s (2h51m09s (10269 s))
- han ngan sach: 1795314951 = 2026-11-22T02:35:51Z; margin: 1795314951 - 1795314420 = 531 s (0h08m51s (531 s))
- finished SAU btime #72: 1795314420 - 1795313105 = 1315 s (0h21m55s (1315 s)) sau btime
- finished TRUOC btime #73: 1795314481 - 1795314420 = 61 s (0h01m01s (61 s)) truoc btime
- events run 166: 8 event (dispatched 23:35:51.144Z eid 9888 + requeued 00:08:41.274Z eid 9898 + dispatched 00:08:41.339Z eid 9899 + reattached 00:08:41.407Z eid 9900 + requeued 02:05:44.548Z eid 9925 + dispatched 02:05:44.589Z eid 9926 + reattached 02:05:44.637Z eid 9927 + succeeded 02:27:00.229Z eid 9931)
- T7-166 dong co 02:08:39Z; run 166 finish 02:27:00Z SAU khi T7-166 dong 1101 s (0h18m21s (1101 s))

### Phu luc B — Reboot #71 / #72 / #73
- #70: btime 1795298725 = 2026-11-21T22:05:25Z, boot d1ddd946
- #71: btime 1795306080 = 2026-11-22T00:08:00Z, boot ea73ac4f
- gap #70->#71 (btime-btime): 1795306080 - 1795298725 = 7355 s (2h02m35s (7355 s))
- requeue delta #71 (event created_at - btime): 1795306121.274 - 1795306080 = 41.274 s — TRONG dai 33-49,8 s
- #72: btime 1795313105 = 2026-11-22T02:05:05Z, boot 9e089ef6
- gap #71->#72 (btime-btime): 1795313105 - 1795306080 = 7025 s (1h57m05s (7025 s))
- requeue delta #72 (event created_at - btime): 1795313144.548 - 1795313105 = 39.548 s — TRONG dai 33-49,8 s
- requeue cua RONG 02:05:05-02:30:00Z (moi job): dung 1 dong — requeue run 166 (eid 9925)
- spanning btime #72: 0 dong — ARTIFACT viet-lai-tu-loai (run 166 started_at da viet lai thanh sau btime)
- #73: btime 1795314481 = 2026-11-22T02:28:01Z, boot b643911f
- gap #72->#73 (btime-btime): 1795314481 - 1795313105 = 1376 s (0h22m56s (1376 s))
- requeue cua RONG 02:28:01-02:40:00Z (moi job): 0 dong — #73 KHONG gay requeue nao
- spanning btime #73: 0 dong — run 166 da finish 61 s TRUOC btime; run 167 start 1795314951 = 2026-11-22T02:35:51Z SAU btime
- run 167: 1 event duy nhat dispatched 02:35:51.065Z (eid 9933) — KHONG viet lai tai #73 (start sau btime #73)
- #74: btime 1795320329 = 2026-11-22T04:05:29Z, boot 194efd93 — TRONG PHIEN (sleep #4 chet ~04:06:00Z, ~31 s sau btime)
- gap #73->#74 (btime-btime): 1795320329 - 1795314481 = 5848 s (1h37m28s (5848 s))
- requeue delta #74 (event created_at - btime): 1795320375.242 - 1795320329 = 46.242 s — TRONG dai 33-49,8 s
- requeue cua RONG 04:05:29-04:30:00Z (moi job): dung 1 dong — requeue run 167 (eid 9955)
- spanning btime #74: 0 dong — ARTIFACT viet-lai-tu-loai (run 167 started_at da viet lai thanh sau btime)

### Phu luc C — Run 167 (van running luc dong co T7-167, 1 lan viet lai tai #74)
- sched 1795314951 = 2026-11-22T02:35:51Z; started GOC 1795314951 = 2026-11-22T02:35:51Z (jitter 0 s — lan thu 20 lien tiep)
- claimed 1795314951 = 2026-11-22T02:35:51Z (started goc + 0 s; KHONG DOI sau viet lai)
- started sau viet lai lan 1 #74 1795320375 = 2026-11-22T04:06:15Z (requeue 04:06:15.242Z = btime + 46,242 s)
- han ngan sach (started goc + 10800): 1795325751 = 2026-11-22T05:35:51Z (ket cuc thuoc T7-168)
- events run 167 (doc #5): 4 event (dispatched 02:35:51.065Z eid 9933 + requeued 04:06:15.242Z eid 9955 + dispatched 04:06:15.343Z eid 9956 + reattached 04:06:15.455Z eid 9957)
- worker_boot_generation doc #5: cron_boot_25cde4f3b1014b418d4ab9b46279685c (boot #74)
- doc #2 2026-11-22T03:05:17Z: tuoi goc 1766 s; con 9034 s toi han
- doc #3 2026-11-22T03:31:12Z: tuoi goc 3321 s; con 7479 s toi han
- doc #4 2026-11-22T03:56:32Z: tuoi goc 4841 s; con 5959 s toi han
- doc #5 2026-11-22T04:06:42Z: tuoi goc 5451 s; con 5349 s toi han
- doc #6 2026-11-22T04:32:58Z: tuoi goc 7027 s; con 3773 s toi han
- doc #7 2026-11-22T04:59:17Z: tuoi goc 8606 s; con 2194 s toi han
- doc #8 2026-11-22T05:04:40Z: tuoi goc 8929 s; con 1871 s toi han

### Phu luc D — Slot HB/DR cua T7-167 (doc #1-#8, 02:38Z-05:04Z)
- HB sched 2026-11-22T02:20:50Z: run 643ca569, started 2026-11-22T02:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T02:50:50Z: run a68e8a74, started 2026-11-22T02:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T03:20:50Z: run 642201d8, started 2026-11-22T03:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T03:50:50Z: run f24ae921, started 2026-11-22T03:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T04:20:50Z: run 5390936f, started 2026-11-22T04:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-22T04:50:50Z: run 5c7cfe53, started 2026-11-22T04:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-22T03:00:00Z: run ba7002fa, started 2026-11-22T03:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-22T04:00:00Z: run cc3aba38, started 2026-11-22T04:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-22T05:00:00Z: run cb1bcf00, started 2026-11-22T05:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (toan -316 s; 0 muon, 0 thieu), DR 3/3 (toan 0 s; 0 thieu) — CUA LANH
- Luy ke: HB 44/387 -> 44/393 (so thieu +0); DR 49/265 -> 49/268 (so thieu +0)
- Kiem toan cua so: 387 + 6 = 393; 265 + 3 = 268
- Ti le thieu: HB 11,2%; DR 18,3%
- Muon HB luy ke: GIU 9 (+887 s x6, +889 s, +891 s, +888 s dot 161; 0 muon moi dot 167)

### Phu luc E — Mau (m): cac diem du lieu (ghi nhan, dieu tra DA DONG)
- #62-#66: xem LIMITS T7-165 §8 Phu luc E (T7-167 khong go lai so tu nho)
- #67 KHONG PHAI diem du lieu (0 run dang chay tai btime 17:33:27Z; 0 requeue)
- #68 DUONG (+47,131 s) — viet lai run 164 lan 1; GIU DUONG (quyet (e) dot 165 — KHONG lat)
- #69 DUONG (+35,432 s) — viet lai run 164 lan 2; CHAP NHAN (quyet (f) dot 165)
- #70 DUONG (+38,729 s) — viet lai run 165 lan 1; CHAP NHAN ung vien DUONG (quyet (n) dot 165; doi chieu doc lap T2-166 DONG Y)
- #71 DUONG (+41,274 s) — viet lai run 166 lan 1; CHAP NHAN (quyet (f) dot 166; doi chieu doc lap T2-167 DONG Y DUONG, 4 nguon khop)
- #72 DUONG ung vien (+39,548 s) — viet lai run 166 lan 2 TRONG LUC T10-166 dong so; doi chieu doc lap T2-167 DONG Y DUONG; cho parent quyet
- #73 CHU KY GIONG #52/#61/#67 (0 run dang chay tai btime 02:28:01Z; 0 requeue trong cua 02:28:01-02:40:00Z) — doi chieu doc lap T2-167 DONG Y KHONG PHAI DIEM
- #74 DUONG ung vien (+46,242 s) — viet lai run 167 lan 1 TRONG phien T7-167; doi chieu doc lap thuoc T2-168; cho parent quyet
- n ung vien SAU quyet dot 166: 24 -> 25 (nhanh khuyen nghi) hoac 25 -> 26 (nhanh #56 AM); n chinh thuc GIU 14
- Neu CHAP NHAN them #72 DUONG: n ung vien 25 -> 26 (nhanh khuyen nghi) hoac 26 -> 27 (nhanh #56 AM)
- Neu CHAP NHAN them #72 + #74 DUONG: n ung vien 25 -> 27 (nhanh khuyen nghi) hoac 26 -> 28 (nhanh #56 AM)
