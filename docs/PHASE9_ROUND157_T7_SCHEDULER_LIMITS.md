# PHASE9 ROUND157 T7 — RUN 156 SUCCEEDED (wall danh nghĩa 9.823 s, margin danh nghĩa 977 s) + REBOOT #56 LÚC MỞ (btime GIỜ THẬT) + REBOOT #57 GIỮA PHIÊN VIẾT LẠI RUN 157 (điểm (m) DƯƠNG +47,698 s, tính bằng giờ thật) + CỬA SLOT LÀNH HOÀN TOÀN LẦN THỨ NĂM LIÊN TIẾP

- **Luồng:** T7 đợt 157 (lượt cron 03:35 +07 21/11/2026 = 20:35:51Z 20/11). Nhiệm vụ theo brief T7-157: (1) kết cục run 156 — run này vẫn `running` lúc T7-156 đóng cờ, hạn ngân sách 20:35:51Z; (2) reboot #56 ứng viên lúc mở (boot 348dab54, btime 19:32:47Z) có viết lại run 156 hay run 157 không, có phải điểm (m) mới không; (3) điểm (m): ghi nhận mọi điểm dữ liệu mới so với n=14 ứng viên, dải 33–49,8 s; điều tra (m) VẪN ĐÓNG trừ khi có bằng chứng mới phá dải; (4) cửa slot HB/DR + lũy kế; (5) LIMITS trung thực, phụ lục bằng script. Bổ sung khẩn giữa phiên: T0-157 xác nhận reboot #56 + phát hiện đồng hồ wall của cell trong suốt đợt 156 CHẠY NHANH hơn giờ thật J ≥ 42'46" (2.566 s, cận dưới cứng), giả thuyết dẫn đầu J ≈ 50'26" (3.026 s) kế thừa nghịch lý đợt 153 — T7 phải tính offset (m) CÙNG MỘT KHUNG THỜI GIAN (cảnh báo J-offset). Bổ sung thêm: coordinator xác minh #57 lúc 21:14:33Z; T4-157 ghi reboot #57 sau khi poller lượt yên #26 thoát 21:04:20Z; POSTBOOT_PASS #57 giao T5-158 (không thuộc đợt này).
- **Boot trong phiên:** mở phiên là **348dab54-90f7-438e-924e-2c839630842b** (btime /proc/stat 1795203167 = 19:32:47Z — **reboot #56, GIỜ THẬT** theo T0-157 xác nhận; T7 tự xác minh độc lập lúc mở phiên ~20:41Z, TRƯỚC khi đọc cờ T0); **1 reboot GIỮA PHIÊN: #57** 21:05:15Z → boot **bcbaa3ad-0180-46e4-bf80-0c51c9eef1ff** (btime /proc/stat 1795208715 = 21:05:15Z — **GIỜ THẬT**, T7 xác minh: F-measure +0,013 s, Date header github.com khớp từng giây). KHÔNG có reboot nào sau #57 (kiểm boot_id ở mọi lần đọc: ~20:41Z, ~21:02Z, ~21:06Z, ~21:15Z, ~21:33Z, ~21:58Z, ~22:24Z).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 156/157 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 156 §11.3 + §12.3 (quyết parent (g): n = 14 ứng viên; (h): run 155 SUCCEEDED; (i): kết cục run 156 thuộc T7-157; (d): chốt số hiệu 062850d8=#53, 447f0efe=#54, c99a1045=#55; (e): btime CHỈ từ /proc/stat btime), LIMITS T7-156 + NOTES round156-t7, LIMITS T0-157 §1.1/§1.2/§7 + cờ round157-t0.done, thông báo giữa phiên của coordinator về reboot #57 (đã xác minh độc lập trước khi nhận thông báo — T7 ghi reboot này ở đọc #3 lúc ~21:06Z, TRƯỚC khi nhận thông báo ~21:14Z; thông báo chỉ là xác nhận chéo, không phải nguồn đầu tiên). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 156 kết cục? | **`succeeded`** 20:19:34Z (event 20:19:34.533Z, eid 9500), wall danh nghĩa từ started gốc **9.823 s**, margin danh nghĩa **977 s** (16m17s) tới hạn 20:35:51Z | §2.1, Phụ lục A |
| Run 156 có bị viết lại lần 4 tại #56 không? | **KHÔNG** — started_at KHÔNG ĐỔI (1795201518, sau viết lại #55); 0 requeue trong cửa 19:30–19:45Z (DB) | §2.1, §2.3 |
| #56 có phải điểm (m) mới không? | **CÓ ĐIỀU KIỆN — PHỤ THUỘC J so với ngưỡng 2.807 s** (xem §2.3): nếu J ≥ 2.807 s → KHÔNG phải điểm dữ liệu (run 156 đã finished trước #56 theo giờ thật); nếu J < 2.807 s → điểm ÂM ứng viên thứ 15. Khuyến nghị đọc: KHÔNG phải điểm dữ liệu (giả thuyết dẫn đầu J ≈ 3.026 s) | §2.3, Phụ lục E |
| Reboot #57 có viết lại run nào không? | **CÓ — run 157 bị viết lại lần 1: ĐIỂM (m) DƯƠNG MỚI +47,698 s** (trong dải 33–49,8 s; tính CÙNG KHUNG giờ thật — điểm dương sạch đầu tiên sau khi sửa đồng hồ) | §2.4 |
| Run 156 có bị #57 viết lại không? | **KHÔNG** — run 156 đã finished trước #57 trong cả hai khung (DB thật: 20:19:34Z; DB wall: thật ≤19:36:48Z) | §2.4 |
| n mẫu (m)? | **Chính thức (ứng viên) = 14** theo quyết (g) đợt 156. N ứng viên **CÓ ĐIỀU KIỆN: 15** (13 dương + 2 âm, nếu #56 không phải điểm dữ liệu — nhánh khuyến nghị) **hoặc 16** (13 dương + 3 âm, nếu #56 là điểm ÂM) — chờ parent quyết J + #56/#57 | §2.3, §2.4, Phụ lục E |
| Dải requeue dương? | **GIỮ 33–49,8 s** — #57 +47,698 s trong dải, không phá min (33,236 s) hay max (49,761 s). Điều tra (m) VẪN ĐÓNG | §2.4 |
| Cửa slot đợt 157? | **CỬA LÀNH HOÀN TOÀN:** HB 5/5 (tất cả −316 s, 0 muộn), DR 3/3 (tất cả 0 s), 0 thiếu mới — lần thứ năm liên tiếp lành hoàn toàn | §2.5 |
| Run 157? | **Jitter 0 s** (started gốc = scheduled_for = 20:35:51Z), **đã bị viết lại 1 lần tại #57**, **vẫn `running` lúc đóng cờ** (~22:24Z, tuổi gốc 6.522 s, còn 4.278 s tới hạn 23:35:51Z). Kết cục thuộc T7-158 | §2.2 |
| Tiền đề "DB scheduler = khung host" của T0 §7.2? | **BỊ BÁC BỎ** bằng nhật ký đọc T7-156 (mốc neo đọc #1/#5) — DB đợt 156 ở khung wall-nhanh của cell, KHÔNG phải khung host. Offset (m) đợt 156 KHÔNG trộn khung — quyết (g) đợt 156 vẫn đứng | §2.3, §3.5 |
| Mâu thuẫn khung giờ mới tại #56/#57? | **KHÔNG có từ DB.** #57 tính cùng khung thật, offset trong dải; #56 chỉ còn điều kiện J | §2.3–2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–156): heartbeat **44/332 slot thiếu** (số thiếu +0, mẫu số +5); deterministic-doctor **49/237 slot thiếu** (số thiếu +0, mẫu số +3).

## 2. Bằng chứng

### 2.1 Kết cục run 156 — SUCCEEDED, margin danh nghĩa 977 s (7 lần đọc DB đầy đủ khớp nhau)

Run 156 (`9c7b6986-46fd-4a31-beea-2e36272d1d26`, sched 1795196151 = 17:35:51Z):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795196151 = 17:35:51Z 20/11 |
| started_at GỐC (dispatch 17:35:51.107Z) | 17:35:51Z — jitter 0 s |
| started_at sau viết lại #53 | 1795199216 = 18:26:56Z |
| started_at sau viết lại #54 | 1795199422 = 18:30:22Z |
| started_at sau viết lại #55 (nay, không đổi) | 1795201518 = 19:05:18Z |
| finished_at_utc | 1795205974 = 20:19:34Z (event `succeeded` 20:19:34.533Z, eid 9500) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795205851 = 20:17:31Z (finished − 123 s) |
| Wall từ started gốc (danh nghĩa) | 1795205974 − 1795196151 = **9.823 s** (2h43m43s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795206951 = 20:35:51Z — finished TRƯỚC hạn **977 s** (16m17s) |
| Wall từ started viết lại #55 | 1795205974 − 1795201518 = 4.456 s (1h14m16s) |

- Events run 156 (đầy đủ, 11 event, không thiếu, không thêm sau succeeded): `dispatched` 17:35:51.107Z (eid 9454) + 3 bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #53 (9467/9468/9469), #54 (9470/9471/9472), #55 (9482/9483/9484) + **`succeeded` 20:19:34.533Z (9500)**. **KHÔNG có event nào cho run 156 sau 20:19:34Z. KHÔNG có event requeue/reattach nào tại #56.**
- 7 lần đọc DB đầy đủ khớp nhau ở mọi trường (~20:41Z, ~21:02Z, ~21:06Z, ~21:15Z, ~21:33Z, ~21:58Z, ~22:24Z) + events đối chiếu trực tiếp. Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin danh nghĩa):** 149: 1.875 s; 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: **977 s** — **hẹp nhất từ đợt 150** (hẹp hơn 155 đúng 185 s), vẫn trong dải hẹp kể từ 152. **Mẫu (m) KHÔNG tái diễn ở 156→157 theo nghĩa run sau jitter 0:** run 156 succeeded (không timeout) + run 157 jitter 0 s — lần thứ mười liên tiếp.
- **Ghi chú claimed_at:** run 156 claimed 20:17:31Z (finished − 123 s). Run 155 là 8 s; run 154 là 7 s. Claimed → finished 123 s là số mới, khác hẳn họ 7–8 s trước đó — T7 chỉ ghi nhận, không suy luận cơ chế (claimed_at là cột cập nhật khi worker claim cuối trước khi finished; không có event scheduler nào tương ứng với lần claim này).
- **Wall/margin là hiệu số thuần trong khung DB nên ĐÚNG dù DB ở khung nào** (cả hai đầu đều epoch DB — xem phân tích khung giờ §2.3). Chỉ phép so sánh DB ↔ btime thật mới cần hiệu chỉnh J.

### 2.2 Run 157 — jitter 0 s, đã bị viết lại 1 lần tại #57, vẫn running lúc đóng cờ

Run 157 (`ca176b15-c63e-4efe-b975-6dce50c990c9`, sched 1795206951 = 20:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795206951 | 20:35:51Z 20/11 |
| dispatched (event) | — | 20:35:51.075Z (eid 9502) |
| started_at GỐC | 1795206951 | 20:35:51Z — **jitter 0 s** |
| started_at sau viết lại #57 (nay) | 1795208762 | 21:06:02Z |
| worker_claimed_at | 1795206951 | 20:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795217751 | 23:35:51Z 20/11 |

- 7 lần đọc DB đầy đủ trong phiên: status `running` ở cả 7 lần; started_at chỉ đổi ĐÚNG 1 lần (tại #57 — khớp 1 event requeue); claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: `dispatched` 20:35:51.075Z (9502) + 1 bộ `requeued_after_restart` / `dispatched` / `reattached_after_restart` tại #57 (9512/9513/9514) — không có event nào khác.
- Tuổi run từ gốc: 3.445 s lúc đọc #5 (21:33:16Z), 4.982 s lúc đọc #6 (21:58:53Z), **6.522 s lúc đọc cuối #7 (22:24:33Z)** — còn 4.278 s tới hạn ngân sách 23:35:51Z. **Kết cục thuộc T7-158.**
- Run 157 dispatch SAU #56 (19:32:47Z) nên #56 KHÔNG THỂ viết lại run 157 — chỉ run 156 là ứng viên tại #56 (xem §2.3).

### 2.3 Reboot #56 lúc mở — boot mới, btime GIỜ THẬT, KHÔNG viết lại run nào (DB) — nhưng verdict (m) CÓ ĐIỀU KIỆN theo J

- **Reboot #56: boot c99a1045 → 348dab54-90f7-438e-924e-2c839630842b, btime 1795203167 = 19:32:47Z.** T7 mở phiên trên boot này (~20:41Z); `uptime -s` 19:32:47Z; `last reboot` 19:32 still running; wtmp bắt đầu 19:32:59Z (= btime +12 s); journal first entry 19:32:59Z (+12 s); /proc/1 start 19:32:58.94Z (+11,94 s). **Btime là GIỜ THẬT** — T0-157 xác nhận độc lập (Date header github.com khớp từng giây lúc 20:44:16Z; F-measure +0,92 s ổn định; journal monotonic vs wall drift −0,16 s); T7 xác minh boot_id + btime + uptime -s độc lập lúc mở phiên, TRƯỚC khi đọc cờ T0. Tuổi boot #55 tới #56: 1795203167 − 1795201484 = 1.683 s (28m03s). round157-t0.done CHƯA CÓ lúc T7 mở phiên (T0-157 đóng cờ ~20:52Z) — T7 KHÔNG chờ T0, tự xác minh.
- **Run 156 KHÔNG bị viết lại tại #56 (theo DB):** started_at VẪN 1795201518 (sau viết lại #55); 0 requeue trong cửa 19:30–19:45Z (mọi job); cửa ứng viên requeue (btime +33 s = 19:33:20Z → btime +49,8 s = 19:33:37Z) TRỐNG. Events run 156 không có gì sau 19:05:19Z cho tới succeeded 20:19:34Z.
- **NHƯNG so sánh đó TRỘN KHUNG — phân tích khung giờ (theo yêu cầu §7 T0-157):**
  - **Phát hiện T0-157:** đồng hồ wall của cell trong suốt đợt 156 NHANH hơn giờ thật J ≥ 42'46" (2.566 s, cận dưới cứng — từ cờ T10 mtime wall 20:15:33Z trên c99a1045 vs btime mới 19:32:47Z); giả thuyết dẫn đầu J ≈ 50'26" (3.026 s) kế thừa nghịch lý đợt 153 (chưa đo trực tiếp). J hằng số trong cửa sổ sampler wall 17:39:56–19:56:47Z (không gap nào > 90 s).
  - **Tiền đề "DB scheduler chạy khung host (giờ thật)" của T0 §7.2 — BỊ BÁC BỎ.** Chứng minh bằng nhật ký đọc T7-156 (giờ đọc là `date -u` wall của cell):
    - *Mốc neo 1* (đọc #1 T7-156, wall ~17:39:36Z, thấy run 155 SUCCEEDED, finished DB 17:16:29Z): nếu DB là giờ thật thì lúc đọc, giờ thật = 17:39:36Z − J ≤ 16:56:50Z < 17:16:29Z — run 155 CHƯA finished, không thể thấy SUCCEEDED. Mâu thuẫn. → `finished_at_utc` KHÔNG phải giờ thật.
    - *Mốc neo 2* (đọc #5 T7-156, wall ~18:06Z, thấy run 156 running, started DB 17:35:51Z): nếu DB là giờ thật thì lúc đọc, giờ thật ≤ 17:23:14Z < 17:35:51Z — run 156 chưa dispatch, không thể thấy running. Mâu thuẫn. → `started_at_utc` KHÔNG phải giờ thật.
    - finished_at ≈ sự kiện succeeded (chênh 0,6 s) → `events.created_at` cùng khung với finished_at; jitter HB −316 s ×6 / DR 0 s ×3 / vcut 0 s đồng đều tuyệt đối → started_at và scheduled_for_utc cùng khung. → **MỌI timestamp DB scheduler đợt 156 đều ở khung wall-nhanh của cell (W = R + J), KHÔNG phải khung host.** Câu T7-153 "đồng hồ cell cũ khớp giờ scheduler" càng củng cố: scheduler KHỚP cell (cùng khung nhanh), không tách biệt — T0 §7.2 suy ra "DB = host" từ câu này là KHÔNG đúng.
  - **Hệ quả 1 — offset (m) đợt 156 KHÔNG trộn khung:** requeue (DB, W) − btime (/proc/stat, W) đều cùng khung nhanh → hiệu số đúng. Dải 33–49,8 s + n=14 theo quyết (g) đợt 156 VẪN ĐỨNG (khớp kết luận §1.1 của T0: "các hiệu số KHÔNG ĐỔI vì J là hằng số").
  - **Hệ quả 2 — verdict #56 phải tính lại cùng khung thật:** btime #56 là GIỜ THẬT (19:32:47Z), nhưng epoch DB run 156 là WALL. So sánh đúng: R_finish(156) = 20:19:34Z − J so với R_btime(#56) = 19:32:47Z. Ngưỡng: run 156 còn chạy tại #56 ⟺ J < 20:19:34Z − 19:32:47Z = **2.807 s**.
  - **Cận dưới cứng J ≥ 2.566 s KHÔNG đủ phân định (thiếu 241 s).** T7 kiểm thêm mtime các file T10-156: GAP 20:15:11Z (J > 2.544 s), closing.txt 20:14:40Z (J > 2.513 s), count-final 20:14:42Z / 20:09:10Z — TẤT CẢ đều < ngưỡng 20:19:34Z wall. File duy nhất trên ngưỡng là aggregate (mtime 20:22:43Z) nhưng BỊ NHIỄU bởi sửa §12.3 của parent (parent sửa ở giờ thật sau reboot — mtime đó là giờ thật, không phải wall; T0 đã loại trừ đúng).
  - **Verdict #56 (m): CÓ ĐIỀU KIỆN, chờ parent/T2-157 chốt J (câu (a) §7.1 T0):**
    - Nếu J ≥ 2.807 s (đúng dưới giả thuyết dẫn đầu J ≈ 3.026 s): R_finish ≤ 19:29:08Z < 19:32:47Z → run 156 đã finished TRƯỚC #56 → **#56 KHÔNG PHẢI điểm dữ liệu (m)** (0 run đang chạy tại btime, cùng loại #52) → n ứng viên = 15 (13 dương + 2 âm, thêm #57).
    - Nếu J < 2.807 s (chỉ còn cửa 2.566–2.807 s): run 156 còn chạy tại #56, 0 requeue → **#56 là điểm ÂM ứng viên thứ 15** (cùng mẫu #45) → n ứng viên = 16 (13 dương + 3 âm).
    - T7-157 KHÔNG tự chọn nhánh. Khuyến nghị đọc: nhánh 1 (KHÔNG phải điểm dữ liệu) có khả năng cao hơn — giả thuyết J ≈ 3.026 s là ứng viên mạnh duy nhất có số đo (đợt 153), và không có bằng chứng nào đẩy J xuống < 2.807 s.
  - Lưu ý chữ T0 §7.2: câu "btime cell-wall #53/#54/#55/#56 đội J" liệt kê cả #56 — nhưng cờ t0.done + §1.1/§1.2 xác định btime #56 = 19:32:47Z GIỜ THẬT (đồng hồ đã đúng từ boot này). T7 theo cờ/§1.2; chữ "#56" trong §7.2 coi là liệt kê lỏng (nhóm các btime T7 xử lý), giao T0/parent xác nhận chữ. Không ảnh hưởng verdict (T7 dùng btime #56 = giờ thật theo cờ).
  - **F-157-T7-1 (xem §6):** đọc #1 của T7-157 đã kết luận "#56 là điểm ÂM, n=15" bằng cách so sánh trực tiếp epoch DB (wall) với btime #56 (giờ thật) — TRỘN KHUNG. Đã sửa thành verdict có điều kiện trên.

### 2.4 Reboot #57 giữa phiên — viết lại run 157, ĐIỂM (m) DƯƠNG MỚI +47,698 s (tính cùng khung giờ thật)

- **Reboot #57: boot 348dab54 → bcbaa3ad-0180-46e4-bf80-0c51c9eef1ff, btime 1795208715 = 21:05:15Z.** Xác minh 6 nguồn: boot_id + btime + `uptime -s` 21:05:15Z (khớp) + journal first entry 21:05:31Z (+16 s) + wtmp begins 21:05:30Z + /proc/1 start 21:05:30.46Z (+15,46 s). **Đồng hồ boot mới ĐÚNG (giờ thật):** F-measure +0,013 s; Date header github.com 21:06:25 GMT khớp từng giây với đồng hồ local lúc curl → **btime #57 = 21:05:15Z GIỜ THẬT** (không đội J). Tuổi boot #56 tới #57: 5.548 s (1h32m28s). Coordinator xác minh độc lập lúc 21:14:33Z (T7 ghi reboot này ở đọc #3 lúc ~21:06:30Z, TRƯỚC khi nhận thông báo ~21:14Z).
- Sleep 1.500 s của T7 (bắt đầu 20:43:30Z) **BỊ GIẾT bằng SIGTERM sau 1.338,8 s (~21:05:49Z — SAU btime #57 ~34 s)** — cùng mẫu SIGTERM-sau-btime đợt 156 (#53 +26 s đo được; #54/#55 ước lượng). Lệnh sleep-2 dispatch sau đó báo "service restarted" (do reboot) — sleep-2 KHÔNG chạy, không mất việc; T7 khởi động lại chu kỳ sleep sau đọc #3 (sleep-3/4/5 đều hoàn thành bình thường, không SIGTERM).
- **Run 157 ĐANG CHẠY tại btime và BỊ VIẾT LẠI (lần 1):** started_at 1795206951 → 1795208762 = 21:06:02Z; requeue event 21:06:02.698Z (eid 9512, "daemon startup recovery") = **btime + 47,698 s**. Dispatched 21:06:02.762Z (9513) + reattached 21:06:02.828Z (9514). Claimed_at VẪN 1795206951 (gốc). Chỉ 1 requeue trong cửa 21:05–21:10Z (mọi job — run 157, eid 9512). Tuổi run 157 từ started gốc tại btime: 1795208715 − 1795206951 = 1.764 s (29m24s).
- **Run 156 KHÔNG bị #57 viết lại:** đã finished trước #57 trong cả hai khung (DB thật: 20:19:34Z < 21:05:15Z; DB wall: thật ≤19:36:48Z < 21:05:15Z). Truy vấn runs spanning btime #57 theo started_at HIỆN TẠI trả 0 dòng — đúng như dự kiến (started_at run 157 đã viết lại thành 1795208762 > btime nên không còn "spanning" theo trạng thái hiện tại; bằng chứng run 157 đang chạy tại btime là event requeue + started_at đổi, không phải truy vấn spanning sau khi viết lại). Không có run nào khác đang chạy tại btime #57 mà không bị viết lại.
- **Offset +47,698 s TRONG dải 33–49,8 s** (không phá min 33,236 s #42, không vượt max 49,761 s #50). **Khung giờ #57 SẠCH:** btime #57 giờ thật (đã xác minh) + run 157 dispatch SAU khi đồng hồ sửa (#56) nên epoch DB run 157 ở khung thật + DB now() khớp cell lúc 21:04:33Z → offset tính trong MỘT khung thật. **Đây là điểm (m) DƯƠNG đầu tiên tính hoàn toàn bằng giờ thật kể từ khi sửa đồng hồ** — khác #56 (epoch DB run 156 ở khung wall-nhanh, btime thật — phải so sánh qua J).
- **T4-157:** poller lượt yên #26 thoát 21:04:20Z — TRƯỚC btime #57 55 s → reboot xảy ra SAU khi poller thoát → verdict #26 không bị ảnh hưởng (cùng mẫu #25/#54 đợt 156). T7 chỉ ghi nhận theo thông báo coordinator, không kiểm lại poll T4 (ngoài phạm vi).
- **KHÔNG có slot nào mất tại #57:** DR 21:00Z finished 21:00:00Z (trước btime #57 315 s); HB 21:20:50Z dispatched 21:15:34Z (sau btime #57, jitter chuẩn −316 s — xem §2.5). Daemon hồi phục trước slot tiếp theo.
- **KHÔNG có mâu thuẫn khung giờ mới tại #57:** event cuối trước btime đều trước btime, thứ tự xuôi; requeue trong dải.
- **n cho giả thuyết viết lại (ghi nhận, KHÔNG tự tăng số chính thức — điều tra đã đóng):** #38 ÂM, #39/#41/#42/#44/#46/#47/#49/#50/#51/#53/#54/#55/#57 DƯƠNG (13 dương), #45 ÂM (ứng viên), #56 CÓ ĐIỀU KIỆN (xem §2.3) → **n ứng viên = 15 (nhánh khuyến nghị) hoặc 16 (nhánh #56 ÂM)**. **Số chính thức (ứng viên) = 14 theo quyết (g) đợt 156 cho tới khi parent quyết.**

### 2.5 Slot HB/DR trong cửa 20:00Z → 22:24Z 20/11 — HB 5/5 (0 muộn) + DR 3/3; CỬA LÀNH HOÀN TOÀN LẦN THỨ NĂM LIÊN TIẾP

Cửa kiểm ~2h24' (7 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 5/5 có, 0 thiếu mới, 0 muộn.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:20:50 (20:20:50Z) | 4c5c88d5 | 20:15:34 | −316 s | CÓ |
| 03:50:50 (20:50:50Z) | d2eea4f5 | 20:45:34 | −316 s | CÓ |
| 04:20:50 (21:20:50Z) | 2777d911 | 21:15:34 | −316 s | CÓ |
| 04:50:50 (21:50:50Z) | 13f63a8b | 21:45:34 | −316 s | CÓ |
| 05:20:50 (22:20:50Z) | c506bccc | 22:15:34 | −316 s | CÓ |

- 5/5 slot jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started. **0 muộn** — mẫu muộn +887/+889/+891 s vắng mặt đợt này (vắng 5 đợt liên tiếp: 153, 154, 155, 156, 157).
- Slot HB 19:50:50Z đã đếm ở đợt 156 — T7-157 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số).

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:00 (20:00Z) | d8789cb1 | 20:00:00 | 0 s | CÓ |
| 04:00 (21:00Z) | ed33657b | 21:00:00 | 0 s | CÓ |
| 05:00 (22:00Z) | 5894c490 | 22:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 19:00Z đã đếm ở đợt 156 — không đếm lại. Slot DR 23:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-158.

### 2.6 Số hiệu reboot — #57 đếm tuần tự, giao parent/T2-157 chốt mù

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật — T0-157 XÁC NHẬN), #57 = bcbaa3ad (21:05:15Z, giờ thật — T7-157 xác minh: F +0,013 s, github Date khớp).
- Coordinator xác minh #57 độc lập lúc 21:14:33Z (sau khi T7 ghi ở đọc #3 ~21:06:30Z) — KHÔNG có lệch số hiệu đợt này (khác đợt 156: T4 bỏ sót 062850d8). T7 dùng số hiệu tuần tự (#56/#57) xuyên suốt file này và phụ lục; mọi boot_id/btime đều ghi đầy đủ để đối chiếu.
- Mù đi kèm: #88? (#56) và #89? (#57) theo công thức mù = reboot + 32 — giao T2-157 (T2-156 đóng trước cả hai reboot; T7 không chứng nhận mù nào).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 156/157 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này không bắt được phép tính nháp sai nào — xem §6). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 21:06:02.698Z), không qua extract-epoch làm tròn. **Quy tắc mới từ đợt này (xem §2.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.**
4. Cửa kiểm đợt này ~2h24' (20:00Z → 22:24Z 20/11), đủ 5 slot HB + 3 slot DR + run vcut 156 (kết cục) và 157 (theo dõi). Bảy lần đọc DB đầy đủ; run 156/157 được đọc đầy đủ 7 lần khớp hoàn toàn nhau ở mọi trường trùng; quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 19:50:50Z + DR 19:00Z thuộc cửa 156 theo quy ước đứng (T7-156 đã đếm); slot DR 20:00Z + HB 20:20:50Z thuộc cửa 157 (sau kiểm cuối T7-156 lúc 19:52Z). DR 23:00Z thuộc cửa T7-158.
6. **1 sleep bị giết trong phiên này** (sleep 1.500 s, SIGTERM sau 1.338,8 s, do reboot #57; ~34 s sau btime — cùng mẫu SIGTERM-sau-btime đợt 156); sleep-3/4/5 (1.500 s ×3) hoàn thành bình thường; 2 sleep thừa do T7 tự spawn (1.200 s + 900 s) đã kill tay (xem F-157-T7-2). Lệnh sleep-2 dispatch báo "service restarted" do reboot #57 — sleep-2 KHÔNG chạy, không mất việc. Boot đổi 348dab54 → bcbaa3ad: 1 lần đổi trong phiên (tại #57), cộng boot #56 lúc mở.
7. T7 đóng cờ ~22:25Z, trước hạn cờ ~23:00Z ~35 phút (hạn cứng toàn đợt 23:30Z còn ~65'). Ghi rõ, không giấu. Run 157 vẫn running lúc đóng cờ — kết cục thuộc T7-158 (hạn ngân sách 23:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix157.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 156, cùng phương pháp)

- Heartbeat: 44/327 → **44/332 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 05:20:50 +07). Kiểm toán cửa sổ: 327 + 5 slot mới = 332 ✓. Số thiếu +0 (0 muộn đợt này).
- Deterministic-doctor: 49/234 → **49/237 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 05:00 +07). Kiểm toán: 234 + 3 = 237 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/332 = 13,3% (giảm từ 13,5% — 0 thiếu mới); DR 49/237 = 20,7% (giảm từ 20,9% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **vẫn 8 lần** (+887 s ×6, +889 s, +891 s; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (vắng 5 đợt liên tiếp).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 156: SUCCEEDED theo hồ sơ daemon (wall danh nghĩa 9.823 s, margin danh nghĩa 977 s)** — 7 lần đọc DB đầy đủ khớp nhau + events đầy đủ (11 event, gồm viết lại tại #53/#54/#55 và succeeded eid 9500). Margin hẹp nhất từ đợt 150 (hẹp hơn 155 đúng 185 s).
2. **Reboot #57 viết lại run 157 lần 1 — điểm dữ liệu (m) DƯƠNG MỚI +47,698 s, trong dải 33–49,8 s, tính cùng khung giờ thật.** Dải dương ứng viên GIỮ 33–49,8 s (không phá min/max). Điều tra (m) VẪN ĐÓNG — T7 chỉ ghi nhận, KHÔNG mở điều tra mới.
3. **Verdict #56 (m): CÓ ĐIỀU KIỆN theo J vs ngưỡng 2.807 s — chờ parent/T2-157 chốt J (câu (a) §7.1 T0).** Nhánh khuyến nghị: J ≥ 2.807 s (giả thuyết dẫn đầu J ≈ 3.026 s) → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 15 (13 dương + 2 âm). Nhánh còn lại: J < 2.807 s → #56 là điểm ÂM → n = 16 (13 dương + 3 âm). **Số chính thức (ứng viên) VẪN = 14 theo quyết (g) đợt 156 cho tới khi parent quyết.**
4. **Tiền đề "DB scheduler = khung host" của T0 §7.2 BỊ BÁC BỎ** (chứng minh bằng mốc neo đọc #1/#5 T7-156 — xem §2.3). Offset (m) đợt 156 KHÔNG trộn khung; quyết (g) đợt 156 vẫn đứng. Đề xuất parent ghi nhận: DB scheduler đợt 153–156 ở khung wall-nhanh của cell (cùng khung với `date -u` và btime /proc/stat); chỉ các mốc giờ thật (btime #56/#57 sau khi sửa đồng hồ, Date header ngoài) mới ở khung thật.
5. **Cửa slot LÀNH HOÀN TOÀN lần thứ năm liên tiếp (HB 5/5, DR 3/3, 0 muộn, 0 thiếu).** Lũy kế: HB 44/332, DR 49/237.
6. **Run 157 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 6.522 s, còn 4.278 s tới hạn ngân sách 23:35:51Z) — kết cục thuộc T7-158. Run 157 là run thứ hai liên tiếp bị viết lại 1 lần (sau run 156 viết lại 3 lần).
7. **Reboot #56/#57: số hiệu đếm tuần tự (#56 = 348dab54, #57 = bcbaa3ad), KHÔNG lệch với coordinator đợt này.** Mù #88? (#56) / #89? (#57) giao T2-157 (T7 không chứng nhận mù). POSTBOOT_PASS #57 giao T5-158 (không thuộc đợt này).
8. **Claimed → finished run 156 = 123 s** (khác hẳn họ 7–8 s của run 154/155) — chỉ ghi nhận, không suy luận cơ chế.
9. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). Mù #77? VẪN MỞ; #78?–#87? GIỮ MỞ chờ chứng nhận (T7 không chứng nhận mù). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-157-T7-1 — Đọc #1 + NOTES nháp ban đầu kết luận "#56 là điểm ÂM ứng viên, n=15" bằng cách so sánh TRỰC TIẾP epoch DB run 156 với btime #56 giờ thật — TRỘN KHUNG (đã sửa):** epoch DB run 156 (finished 20:19:34Z, started 19:05:18Z) ở khung wall-nhanh đợt 156 (W = R + J), trong khi btime #56 (19:32:47Z) là GIỜ THẬT. So sánh trực tiếp cho ra "run 156 đang chạy tại btime, 0 requeue → điểm ÂM" — kết luận này CHỈ ĐÚNG nếu DB ở khung thật, mà phân tích mốc neo (§2.3) chứng minh DB đợt 156 ở khung wall. Sai số phát hiện nhờ bổ sung khẩn T0-157 + kiểm lại nhật ký đọc T7-156 (mốc neo đọc #1/#5). ĐÃ SỬA: verdict #56 chuyển thành CÓ ĐIỀU KIỆN theo J vs ngưỡng 2.807 s (LIMITS §2.3 + NOTES + appendix157.py/E đều đã sửa; không còn chỗ nào ghi n=15 như kết luận chắc chắn). Số liệu cứng không đổi (finished/started/events/requeue đều đọc đúng từ DB; chỉ cách so sánh với btime thật là sai). Bài học: khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ (đã ghi thành quy tắc mới §3.3).
- **F-157-T7-2 — Hai sleep thừa do T7 tự spawn rồi kill tay (không ảnh hưởng dữ liệu):** trong lúc chờ sleep-1 (1.500 s), T7 spawn thêm sleep 1.200 s rồi sleep 900 s (do nhầm tưởng cần "chờ tiếp"), sau đó kill cả hai bằng tay. Cả hai đều chưa chạy tới đâu, không mất việc, không ảnh hưởng số liệu — chỉ là thao tác thừa. Bài học: khi một sleep nền đang chạy thì KHÔNG spawn thêm sleep khác; chờ handoff tự trả về.
- **F-157-T7-0 — Không có sai số nào khác trong đợt này:** 7 lần đọc DB đầy đủ khớp nhau ở mọi trường trùng (run 156/157) + events đối chiếu trực tiếp + truy vấn requeue theo cửa + truy vấn spanning btime (có ghi rõ cách diễn giải sau khi viết lại); mọi jitter/wall/margin/offset tính lại bằng `date -u` từ epoch thô (HB −316 s ×5 slot, DR 0 s ×3 slot, run 156 wall gốc 9.823 s / margin 977 s / wall viết lại #55 4.456 s / claimed→finished 123 s, run 157 jitter 0 s, requeue #57 +47,698 s (created_at trực tiếp), tuổi boot #55 1.683 s / #56 5.548 s, ngưỡng J 2.807 s, run 157 tuổi gốc lúc đóng 6.522 s / còn 4.278 s — đều kiểm lại; phụ lục §8 do script tính từ epoch thô, khớp từng số); boot_id tự xác minh từ `/proc/sys/kernel/random/boot_id` ở mọi lần đọc (348dab54 → bcbaa3ad, đúng 1 lần đổi trong phiên + boot #56 lúc mở) và khớp xác minh coordinator về bcbaa3ad (T7 ghi trước khi nhận thông báo); ở mọi lần đọc đã đọc lại boot_id SAU khi đọc started_at (bài học F-142-T7-1 đã áp dụng); kết cục run 156 có 7 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 20:19:34.533Z, eid 9500), không suy đoán sau; btime #57 xác minh 6 nguồn + F-measure + github Date (đồng hồ boot mới đúng giờ thật).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round157-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t7/NOTES.md` + `appendix157.py` + `appendix157.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round157-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix157.py` từ epoch thô — xem file `appendix157.txt` trong round157-t7)

### Phu luc A — Run 156 (ket cuc SUCCEEDED, T7-157)
- sched 1795196151 = 2026-11-20T17:35:51Z; started GOC 1795196151 = 2026-11-20T17:35:51Z (jitter 0 s)
- started sau viet lai #53 1795199216 = 2026-11-20T18:26:56Z; sau #54 1795199422 = 2026-11-20T18:30:22Z; sau #55 (nay) 1795201518 = 2026-11-20T19:05:18Z
- claimed 1795205851 = 2026-11-20T20:17:31Z (finished - 123 s)
- finished 1795205974 = 2026-11-20T20:19:34Z; status succeeded; attempt 1; error null; timed_out false
- wall tu started GOC: 1795205974 - 1795196151 = 9823 s (2h43m43s)
- han ngan sach: 1795206951 = 2026-11-20T20:35:51Z; margin: 1795206951 - 1795205974 = 977 s (0h16m17s)
- wall tu started viet lai #55: 1795205974 - 1795201518 = 4456 s (1h14m16s)
- offset viet lai #53 (tu goc): 3065 s; #54: 3271 s; #55: 5367 s
- KHONG viet lai lan 4 tai #56 (DB): started_at van 1795201518; 0 requeue 19:30-19:45Z (DB) — NHUNG btime #56 la GIO THAT, epoch DB o khung WALL: ket luan 'run 156 dang chay tai #56' PHU THUOC J (xem E), khong suy truc tiep tu so nay

### Phu luc B — Reboot #56 (mo phien) + #57 (giua phien) T7-157
- #51: btime 1795194329 = 2026-11-20T17:05:29Z, boot c931d371
- #52: btime 1795195149 = 2026-11-20T17:19:09Z, boot 5353ed19
- #53: btime 1795199175 = 2026-11-20T18:26:15Z, boot 062850d8
- #54: btime 1795199383 = 2026-11-20T18:29:43Z, boot 447f0efe
- #55: btime 1795201484 = 2026-11-20T19:04:44Z, boot c99a1045
- #56 (mo phien): btime 1795203167 = 2026-11-20T19:32:47Z, boot 348dab54 — GIO THAT (T0-157)
- #57 (giua phien): btime 1795208715 = 2026-11-20T21:05:15Z, boot bcbaa3ad — GIO THAT (T7-157: F +0,013 s, github Date khop tung giay)
- tuoi boot #55 tai #56: 1795203167 - 1795201484 = 1683 s (0h28m03s)
- tuoi boot #56 tai #57: 1795208715 - 1795203167 = 5548 s (1h32m28s)
- run 156 tuoi tu started viet lai #55 tai btime #56: 1795203167 - 1795201518 = 1649 s (0h27m29s)
- run 156 tuoi tu started GOC tai btime #56: 1795203167 - 1795196151 = 7016 s (1h56m56s)
- cua ung vien requeue #56: btime+33s = 2026-11-20T19:33:20Z -> btime+49,8s = 2026-11-20T19:33:36Z (49s) / 2026-11-20T19:33:37Z (50s); 0 requeue 19:30-19:45Z
- run 156 finished SAU btime #56 (DB wall): 1795205974 - 1795203167 = 2807 s (0h46m47s) — CHI SO WALL, khong phai gio that (xem E)
- run 157 tuoi tu started GOC tai btime #57: 1795208715 - 1795206951 = 1764 s (0h29m24s)
- requeue #57: 21:06:02.698Z = btime + 47,698 s — TRONG dai 33-49,8 s

### Phu luc C — Run 157 (van running luc dong co T7-157, BI VIET LAI 1 lan tai #57)
- sched 1795206951 = 2026-11-20T20:35:51Z; started GOC 1795206951 = 2026-11-20T20:35:51Z (jitter 0 s)
- started sau viet lai #57 1795208762 = 2026-11-20T21:06:02Z (requeue 21:06:02.698Z = btime #57 + 47,698 s)
- claimed 1795206951 = 2026-11-20T20:35:51Z (goc, khong viet lai)
- han ngan sach: 1795217751 = 2026-11-20T23:35:51Z (ngoai han co T7-157 — ket cuc thuoc T7-158)

### Phu luc D — Slot HB/DR cua T7-157 (doc #1-#7, 20:42Z-22:24Z)
- DR sched 20:00:00Z run d8789cb1: started 2026-11-20T20:00:00Z, jitter 0 s, succeeded
- HB sched 20:20:50Z run 4c5c88d5: started 2026-11-20T20:15:34Z, jitter -316 s, succeeded
- HB sched 20:50:50Z run d2eea4f5: started 2026-11-20T20:45:34Z, jitter -316 s, succeeded
- DR sched 21:00:00Z run ed33657b: started 2026-11-20T21:00:00Z, jitter 0 s, succeeded
- HB sched 21:20:50Z run 2777d911: started 2026-11-20T21:15:34Z, jitter -316 s, succeeded (sau reboot #57 — daemon hoi phuc)
- HB sched 21:50:50Z run 13f63a8b: started 2026-11-20T21:45:34Z, jitter -316 s, succeeded
- DR sched 22:00:00Z run 5894c490: started 2026-11-20T22:00:00Z, jitter 0 s, succeeded
- HB sched 22:20:50Z run c506bccc: started 2026-11-20T22:15:34Z, jitter -316 s, succeeded
- TONG CUA: HB 5/5 (0 thieu, 0 muon), DR 3/3 (0 thieu) — CUA LANH HOAN TOAN (lan thu 5 lien tiep)
- Luy ke: HB 44/327 -> 44/332 (so thieu +0); DR 49/234 -> 49/237 (so thieu +0)
- Ti le thieu: HB 13,3%; DR 20,7%

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
- #56 (mo phien): btime 1795203167 = 2026-11-20T19:32:47Z GIO THAT (T0-157 xac nhan); epoch DB run 156 o khung WALL-NHANH
- R_finish(156) = 2026-11-20T20:19:34Z - J; #56 la diem (m) chi khi J < 2807 s (nguong)
- Neu J >= 2807 s (dung duoi gia thuyet dan dau J ~ 3.026 s): R_finish <= 2026-11-20T19:29:08Z < btime #56 -> #56 KHONG PHAI diem du lieu (0 run dang chay tai btime, cung loai #52) -> n GIU 14
- Neu J < 2807 s (chi con cua 2.566-2.807 s): run 156 con chay tai #56, 0 requeue -> #56 AM ung vien thu 15 (cung mau #45) -> n = 15
- Can duoi cung J >= 2.566 s (co T10 mtime wall 20:15:33Z) KHONG du phan dinh (thieu 241 s); khong co file sach nao tren c99a1045 co mtime > 20:19:34Z wall (aggregate 20:22:43Z bi nhieu boi sua SS12.3 cua parent)
- Verdict #56: CO DIEU KIEN — cho parent/T2-157 chot J (cau (a) SS7.1 T0). Khuyen nghi doc: KHONG phai diem du lieu (nhanh 1) kha nang cao hon.
- #57 DUONG (+47,698 s) — viet lai run 157 lan 1; TINH BANG GIO THAT (btime #57 that + epoch DB run 157 that, dong ho da sua) — diem DUONG sach dau tien sau khi sua dong ho
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet J + #56/#57
- n ung vien moi (CO DIEU KIEN theo #56): 15 neu #56 KHONG phai diem du lieu (13 duong + 2 am) — nhanh khuyen nghi; 16 neu #56 la diem AM (13 duong + 3 am)
- Dai requeue duong ung vien GIU 33–49,8 s (khong diem duong moi pha min/max; #57 +47,698 s trong dai)
- LUU Y SO HIEU: 062850d8=#53, 447f0efe=#54, c99a1045=#55 theo quyet (d) dot 156 (dem tuan tu T7/T8); 348dab54=#56 (T0-157 XAC NHAN); bcbaa3ad=#57 (T7-157, dem tuan tu)
- F-157-T7-1: doc #1 ket luan #56 AM (n=15) bang cach so epoch DB (wall) truc tiep voi btime #56 (gio that) — TRON KHUNG, DA SUA thanh verdict co dieu kien theo J vs 2.807 s.
