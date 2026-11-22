# PHASE9 ROUND161 T7 — RUN 160 SUCCEEDED (wall 8.865 s, margin 1.935 s — RỘNG NHẤT TỪ ĐỢT 150) + REBOOT #62 OVERLAP 824 s (0 REQUEUE — ỨNG VIÊN ĐIỂM ÂM) + REBOOT #63 GIỮA PHIÊN VIẾT LẠI RUN 161 (+37,128 s — ĐIỂM DƯƠNG ỨNG VIÊN) + CỬA SLOT 6/6 + 3/3 (1 MUỘN +888 s)

- **Luồng:** T7 đợt 161 (lượt cron 15:35 +07 21/11/2026 = 08:35:51Z 21/11). Nhiệm vụ theo brief T7-161: (1) kết cục run 160 — run này vẫn `running` lúc T7-160 đóng cờ, hạn ngân sách 08:35:51Z — ĐÚNG lúc đợt 161 mở; 0 lần viết lại, jitter 0 s lần thứ 13 liên tiếp; (2) điểm (m): #56 VẪN CÓ ĐIỀU KIỆN (T2-160 không thu hẹp được lần thứ ba); #61 KHÔNG tạo điểm (m) mới → n ứng viên GIỮ 18 (16 dương + 2 âm, nhánh khuyến nghị) hoặc 19; kiểm tra reboot mới lúc mở (boot 39d46ba0, btime ~08:00Z, ứng viên #62) có tạo điểm (m) mới không, đối chiếu độc lập với T2; (3) run 161 hiện trạng lúc đóng cờ; (4) cửa slot HB/DR + lũy kế; (5) LIMITS trung thực, phụ lục bằng script. Chú ý sai số F-160-T7-1: đồng hồ boot cũ nhanh ≥+32 s (không phải ~+20 s) — xác minh giờ bằng Cloudflare/giờ thật.
- **Boot trong phiên:** mở phiên là **39d46ba0-5724-4e4e-abec-a546d4d98ab2** (btime /proc/stat 1795247969 = 07:59:29Z — **reboot #62 ứng viên, GIỜ THẬT**; T0-161 + T2-161 xác minh độc lập); **reboot #63 GIỮA PHIÊN** lúc 10:30:42Z (boot mới **94d22520-dc48-4695-921f-71ba6855fc8a**, btime 1795257042) — sleep 5 của T7 bị SIGTERM giết, run 161 bị viết lại lần 1 (+37,128 s). Boot lúc đóng cờ: 94d22520.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 160/161 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), aggregate đợt 160 §12.3 (quyết parent (a)–(x)), LIMITS T7-160 + NOTES round160-t7, cờ round161-t0.done / t1.done / t2.done / t4.done / t5.done / t6.done / t8.done (đối chiếu chéo). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 160 kết cục? | **`succeeded`** 08:03:36Z (event 08:03:36.487Z, eid 9668), wall từ started gốc **8.865 s**, margin **1.935 s** (32m15s) tới hạn 08:35:51Z — **RỘNG NHẤT từ đợt 150** (vượt 151: 1.828 s đúng 107 s) | §2.1, Phụ lục A |
| Run 160 có bị viết lại không? | **KHÔNG — 0 lần viết lại.** started_at không đổi; chỉ 2 event (dispatched + succeeded); claimed_at đổi sang 08:03:29Z (finished − 7 s) — trở lại họ 7–11 s sau 159: 66 s | §2.1 |
| Reboot #62 có tạo điểm (m) mới không? | **ỨNG VIÊN ĐIỂM ÂM — T7 lean CHẤP NHẬN (đồng ý T2-161; parent quyết):** 1 run (160) đang chạy tại btime thật, 0 requeue — chữ ký đúng #45; overlap 824–854 s là cơ chế giải thích, không phải lý do loại điểm | §2.2, §2.3 |
| Reboot #63 (giữa phiên) thì sao? | **ĐIỂM (m) DƯƠNG ỨNG VIÊN:** viết lại run 161 lần 1, requeue 10:31:19.128Z = btime + **37,128 s** — TRONG dải 33–49,8 s (dương đầu tiên kể từ #60) | §2.5 |
| n mẫu (m)? | **Chính thức (ứng viên) = 14** theo quyết (g) đợt 156 — GIỮ. N ứng viên trước #62/#63 = **18/19 — GIỮ cho tới khi parent quyết**; nếu chấp nhận #62 ÂM → 19/20; nếu chấp nhận #63 DƯƠNG → 19/20; nếu chấp nhận cả hai → 20/21 | §2.3, §2.5, Phụ lục E |
| Dải requeue dương? | **GIỮ 33–49,8 s** — #63 +37,128 s nằm trong dải, không phá min (33,236 s) hay max (49,761 s). Điều tra (m) VẪN ĐÓNG | §2.5 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-161 KHÔNG thu hẹp được cửa LẦN THỨ TƯ** (5 hướng mới, đều âm tính); R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.4 |
| Overlap #62? | **CHỒNG 824–854 s (cận dưới chắc chắn 824 s):** boot cũ 52c957d5 sống tới thật ~08:13:13Z, boot mới 39d46ba0 sinh thật 07:59:29Z — lần đầu quan sát overlap dài; T2 xác minh độc lập KHỚP T7; T0/T5 chọn H2, T2/T7 chọn OVERLAP — chờ T10 phán | §2.2 |
| Cửa slot đợt 161? | **HB 6/6 (1 muộn +888 s, 5 chuẩn −316 s), DR 3/3 (0 s), 0 thiếu mới** — cửa lành trừ 1 slot muộn (muộn HB thứ 9 lũy kế, phá chuỗi 8 đợt vắng muộn) | §2.7 |
| Run 161? | **Jitter 0 s** (lần thứ 14 liên tiếp), **1 lần viết lại tại #63**, **vẫn `running` lúc đóng cờ** (~10:46Z, tuổi gốc 7.808 s, còn 2.992 s tới hạn 11:35:51Z). Kết cục thuộc T7-162 | §2.6 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–160): heartbeat **44/357 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/249 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **8 → 9**.

## 2. Bằng chứng

### 2.1 Kết cục run 160 — SUCCEEDED, margin 1.935 s (7 lần đọc DB đầy đủ khớp nhau + events đối chiếu trực tiếp)

Run 160 (`e331115f-4655-4d69-b184-3da192d7a7e8`, sched 1795239351 = 05:35:51Z 21/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795239351 = 05:35:51Z 21/11 |
| started_at GỐC (dispatch 05:35:51.128Z) | 05:35:51Z — jitter 0 s |
| started_at sau viết lại | KHÔNG CÓ — started_at không đổi suốt 7 lần đọc |
| finished_at_utc | 1795248216 = 08:03:36Z (event `succeeded` 08:03:36.487Z, eid 9668) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795248209 = 08:03:29Z (finished − 7 s) |
| Wall từ started gốc | 1795248216 − 1795239351 = **8.865 s** (2h27m45s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795250151 = 08:35:51Z — finished TRƯỚC hạn **1.935 s** (32m15s) |
| Finished sau btime #62 | 1795248216 − 1795247969 = 247 s (4m07s) |

- Events run 160 (đầy đủ, 2 event, không thiếu, không thêm sau succeeded): `dispatched` 05:35:51.128Z (eid 9634) + **`succeeded` 08:03:36.487Z (9668)**. **KHÔNG có event nào cho run 160 sau 08:03:36Z** (kiểm lại ở đọc cuối #7: 0 event mới sau eid 9668; 0 requeue, 0 reattach).
- 7 lần đọc DB đầy đủ trong phiên khớp nhau ở mọi trường (đọc #1 ~08:37Z, #2 ~09:02Z, #3 ~09:28Z, #4 ~09:54Z, #5 ~10:19Z, #6 ~10:31Z, #7 ~10:46Z — đọc #1 xác nhận kết cục; các đọc sau xác nhận không đổi). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** — **RỘNG NHẤT từ đợt 150** (vượt 151 đúng 107 s; rộng hơn 159 đúng 632 s). Xu hướng margin hẹp lại kể từ 151 đã đảo chiều ở 158–159 và ĐẠT ĐỈNH MỚI ở đợt này — T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 160 claimed 08:03:29Z (finished − **7 s**) — TRỞ LẠI họ 7–11 s của run 154 (7 s) / 155 (8 s) / 157 (11 s) / 158 (10 s) sau ngoại lệ 66 s của run 159. Lưu ý: T7-160 đọc claimed_at = 1795239351 (gốc) lúc ~07:47Z → claimed_at ĐÃ ĐỔI sang 08:03:29Z trong khoảng (07:47Z, 08:03:36Z), tức SAU btime #62 240 s. T7 chỉ ghi nhận, không suy luận cơ chế (xem §2.3 — claimed post-btime là một mảnh bằng chứng cho lean ÂM của #62).
- **Run 160 là run ĐẦU TIÊN sau chuỗi 4 run liên tiếp bị viết lại (156–159) mà kết thúc với 0 lần viết lại** — chuỗi viết lại đứt ở 160. Run 161 sau đó lại bị viết lại 1 lần tại #63 (xem §2.5).

### 2.2 Reboot #62 (btime 07:59:29Z) — OVERLAP 824–854 s: boot cũ vẫn sống tới ~08:13:13Z thật (PHÁT HIỆN MỚI, T2 xác minh độc lập khớp)

- **Reboot #62: boot 52c957d5 → 39d46ba0-5724-4e4e-abec-a546d4d98ab2, btime 1795247969 = 07:59:29Z 21/11.** Xác minh T7 (lúc mở + đọc #1): boot_id + btime + `uptime -s` 07:59:29Z (khớp) + /proc/1 start 07:59:39Z (+10 s), mtime 07:59:40Z (+11 s) + journal first entry 07:59:40Z (+11 s, idx 0 duy nhất) + wtmp begins 07:59:40Z (+11 s). **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare ts vs local: 08:38:08 vs 08:38:07 (chậm 1 s), 10:32:09 vs 10:32:08 (chậm 1 s), 10:46:01 vs 10:46:00 (chậm 1 s) — ba lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1; lần này GitHub −2 s). Gap #61→#62 (btime−btime): 1795247969 − 1795238749 = **9.220 s** (2h33m40s).
- **#62 xảy ra GIỮA HAI ĐỢT nhưng TRONG lúc T10-160 đóng sổ** (T1-161 F-161-T1-1, khớp T7): closing stage 07:59:26Z → btime 07:59:29Z → cờ `round160-t10.done` mtime 08:02:45Z — claim "không reboot mới trong lúc đóng" của T10 stale ~3 phút; aggregate 160 mtime 08:06:45Z. T10 kiểm boot cuối lúc ~07:59Z (trước btime vài giây) nên không ghi nhận #62; session T10 resume sau reboot và viết cờ lúc 08:02:45Z (sau btime 3m16s).
- **0 requeue do #62:** cửa 07:59:29–08:35:51Z (mọi job): 0 requeue; cửa ứng viên điểm (m) btime+33s→+49,8s = 08:00:02–08:00:19Z: 0 requeue. Events cửa 07:59:29–08:05:00Z (mọi job): chỉ 4 — reconciled 08:00:00.027Z (9665), DR dispatched 08:00:00.079Z (9666), DR succeeded 08:00:00.179Z (9667), run 160 succeeded 08:03:36.487Z (9668). 0 requeue/reattach.
- **1 run đang chạy tại btime #62:** truy vấn spanning btime 1795247969: ĐÚNG 1 dòng — **run 160** (started 05:35:51Z, finished 08:03:36Z). Kiểm chéo: HB 07:50:50Z finished 07:45:34Z; DR 08:00Z started 08:00:00Z (sau btime 31 s); run 161 started 08:35:51Z (sau btime). → #62 rơi vào lúc run 160 đang chạy, hệ còn lại nhàn rỗi.
- **OVERLAP — bằng chứng:** replay-watch-160.log (watcher-160 pid 4539, start 05:41:26Z, END 08:30:00Z): poll liên tục 30 s/cadence từ 05:41:26Z tới **08:13:13Z**, KHÔNG có dòng NEWBOOT, KHÔNG có dòng END/STOP; 0 dòng nhắc 39d46ba0. Script đọc boot_id TƯƠI mỗi poll (`boot_now()` + so sánh CUR → NEWBOOT nếu đổi) — nếu watcher chạy trên boot mới sau 07:59:29Z thì poll 07:59:42Z đã phải ghi NEWBOOT boot=39d46ba0. Không có → watcher CHƯA BAO GIỜ chạy trên boot mới; nó chạy trên boot cũ tới ~08:13:13Z rồi bị giết (không END line). Phân tích delta timestamp toàn log (308 dòng có timestamp, script python): mọi delta đều 30 s hoặc 31 s (31 s khi postboot chạy), KHÔNG có bước nhảy ~854 s nào → đồng hồ boot cũ chạy đúng tốc độ thật suốt phiên (đã xác minh đúng ±1 s vs Cloudflare lúc ~07:47Z, T7-160) → poll cuối nhãn 08:13:13Z là GIỜ THẬT 08:13:13Z (±vài s). **Kết luận: boot cũ 52c957d5 sống tới thật ~08:13:13Z; boot mới 39d46ba0 sinh thật 07:59:29Z (uptime -s + Cloudflare nay ±1 s). OVERLAP = 08:13:13Z − 07:59:29Z = 824 s (cận dưới chắc chắn; chết trong (08:13:13Z, 08:13:43Z] → chồng 824–854 s).** Đời thật boot #61 = btime #61 → chết boot cũ ≈ 10.044–10.074 s (T2: ≈10.045 s; T5: 10.061 s theo ước chết 08:13:30Z của T0 — đều trong khoảng).
- **Bác H1 (đồng hồ cũ nhanh ≥+824 s):** đồng hồ cũ đã xác minh ĐÚNG ±1 s lúc 07:47:25Z thật (neo Cloudflare T7-160) + cadence poll đều 30/31 s không nhảy → clock không thể nhanh +824 s lúc chết (nhảy sẽ hiện bước ~854 s trong log; trôi dần sẽ làm nhãn mỗi poll tăng ~33 phút — cả hai đều không xảy ra). T5-161 kiểm lại độc lập 304 poll đều 30/31 s (max 31 s) → cùng kết luận; T5 đã bác H1 của chính mình (F-161-T5-2).
- **Bác H2 (đồng hồ mới chậm, btime ghi sai +841 s, reboot thật ~08:13:30Z):** `uptime -s` = now − monotonic uptime; now đã xác minh đúng vs Cloudflare (±1 s, 3 lần trong phiên) → boot thật = 07:59:29Z. Nếu reboot thật 08:13:13Z thì uptime -s phải là 08:13:13Z, thực tế là 07:59:29Z. T2 bác H2 bằng cùng lập luận (uptime 2.686 s khớp btime từng giây; drift 0,9960).
- **PHÂN KỲ về #62 (ghi nhận trung thực):** T0-161 chọn H2; T5-161 chọn H2 (đổi từ H1 sau khi bác H1); **T2-161 + T7-161 chọn OVERLAP** (xác minh độc lập, khớp nhau). **Chờ T10 phán.** Hệ quả nếu OVERLAP đứng (T2 §6.3 (f)): các số nghịch lý cũ (+19/+28/+32 s ở #58/#59/#60) có thể là overlap ngắn chứ không phải clock skew — số không đổi, chỉ cơ chế đổi. T7 KHÔNG tự sửa quyết (v) đợt 160 (đã chấp nhận +32 s làm số chính thức cho #60) — chỉ trình bằng chứng mới, giao parent/T10 quyết.
- **Watcher-160 (pid 4539) chết ~08:13:13–08:13:43Z thật cùng boot cũ — KHÔNG chết tại btime #62.** Watcher-161 pid 19861 START 08:40:01Z, END 11:30:00Z (T0-161/T5-161); watcher-161 chết theo #63 (xem §2.5). POSTBOOT_PASS #62 ĐÃ CÓ 08:59:30Z (T5-161, mode repair-sớm-quyết-h, poll=1; replay tự nhiên không chạy trên #62).

### 2.3 Điểm (m) #62 — ỨNG VIÊN ĐIỂM ÂM (T7 lean CHẤP NHẬN; parent quyết)

- Chữ ký hình thức: 1 run (160) đang chạy tại btime thật 07:59:29Z, 0 requeue trong cửa 07:59:29–08:35:51Z — **giống hệt #45** (run 152 đang chạy, 0 requeue → ÂM ứng viên). Khác #52/#61 (0 run đang chạy → không phải điểm).
- **Lean của T7 — ĐỔI SO VỚI NHÁP ĐỌC #1 (ghi rõ, không giấu):** nháp đọc #1 của T7 lean "#62 gần #52/#61 hơn là #45" (vì run có thể chạy trọn trên boot cũ mà reboot không chạm tới). T2-161 đọc nháp đó và ghi "T7 lean ngược". Sau khi cân bằng chứng đầy đủ, **T7 ĐỔI LEAN SANG CHẤP NHẬN #62 LÀ ĐIỂM ÂM**, đồng ý với T2-161. Lý do đổi lean (2 mảnh):
  1. **claimed_at run 160 đổi sang SAU btime (08:03:29Z, btime +240 s):** daemon mới đã re-claim run 160 mà không requeue — daemon mới CÓ tương tác với run đang chạy (reconciled 08:00:00Z + re-claim 08:03:29Z) và chọn không viết lại. Đây là quan sát âm thật về hành vi recovery của daemon, không phải "không có gì để viết lại".
  2. **Đối chứng #60:** overlap ~32 s mà run 159 vẫn bị viết lại (+46,642 s) → overlap KHÔNG miễn nhiễm viết lại. Daemon có 247 s (btime→finish run 160) + 1 lần reconcile để viết lại mà không làm → kết quả âm có thông tin, không rỗng.
- Overlap 824–854 s là **CƠ CHẾ giải thích kết quả âm** (worker sống sót trên boot cũ → daemon thấy worker còn sống → không cần viết lại), không phải lý do loại điểm — giống như "daemon startup recovery" là cơ chế giải thích điểm dương, không làm điểm dương mất giá trị.
- **T7 KHÔNG tự đổi n** (điều tra đã đóng): n ứng viên GIỮ 18 (16 dương + 2 âm, nhánh khuyến nghị) hoặc 19 (nhánh #56 ÂM) cho tới khi parent quyết. **NẾU parent chấp nhận #62 ÂM: n thành 19 (16+3) hoặc 20 (16+4).** Kết hợp với #63 DƯƠNG (xem §2.5): nếu chấp nhận cả hai → n 20 (17+3) hoặc 21 (17+4).

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-161 KHÔNG thu hẹp được cửa LẦN THỨ TƯ

- T2-161 DONE 09:01:20Z (đọc cờ, đối chiếu chéo): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ TƯ** — 5 hướng mới đều âm tính (journal chỉ còn boot hiện tại; không wtmp.1/btmp.1; không apt history.log; repo-1 KHÔNG có .git; c99a1045 không xuất hiện ở luồng khác). Cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n chính thức (ứng viên) GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 18 (nhánh khuyến nghị, trước #62/#63) ; nếu J < 2.807 s → #56 là điểm ÂM → n = 19 (trước #62/#63). Quyết (d) đợt 159 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-161 thêm: mù #93? (#61) ĐÓNG (L file 608 s / union 597 s; M file 1.514 s / union 31 s — verdict M phụ thuộc mốc nội dung HAI nguồn; lần thứ tư liên tiếp verdict phụ thuộc mốc nội dung); mù #88? VẪN MỞ (hole-recheck lần thứ năm: 345 hit, 0 mốc mới); mù #77? VẪN MỞ; mù #94? (#62) SƠ BỘ MỞ — giao T2-162 (đoạn N file/union 1.422 s, hố 08:11:54–08:35:36Z trống). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT93/FULL108 (gap #61 danh nghĩa 8.390 s). INSIDE: #62 NGOÀI dải FULL108 [05:51:28Z, 07:47:38Z] neo 05:25:49Z, muộn 711 s → chuỗi 2 KẾT THÚC; chuỗi mới từ #62 (độ dài 1). T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.

### 2.5 Reboot #63 (btime 10:30:42Z, GIỮA PHIÊN) — viết lại run 161 lần 1, +37,128 s: ĐIỂM (m) DƯƠNG ỨNG VIÊN

- **Reboot #63: boot 39d46ba0 → 94d22520-dc48-4695-921f-71ba6855fc8a, btime 1795257042 = 10:30:42Z 21/11.** Xác minh T7 (lúc phát hiện ~10:31Z + đọc #7): boot_id + btime + `uptime -s` 10:30:42Z (khớp) + /proc/1 start 10:30:52Z (+10 s), mtime 10:30:53Z (+11 s) + journal first entry 10:30:53Z (+11 s, idx 0 duy nhất) + wtmp begins 10:30:53Z (+11 s). **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare 10:32:09 vs local 10:32:08 (chậm 1 s); 10:46:01 vs 10:46:00 (chậm 1 s). Gap #62→#63 (btime−btime): 1795257042 − 1795247969 = **9.073 s** (2h31m13s).
- **#63 xảy ra GIỮA PHIÊN T7-161** (sau đọc #5 ~10:19Z, trước đọc #6 ~10:31Z) và GIỮA ĐỢT 161 (sau T8 đóng 10:22:57Z; T8 ghi "KHÔNG reboot mới trong phiên" — đúng lúc T8 đóng, trước btime #63 8 phút). Sleep 5 của T7 (1.560 s) bị SIGTERM sau 679 s — cùng mẫu đợt 156/157/158 (1 sleep bị giết sau btime; đợt 159/160: 0 sleep bị giết).
- **Run 161 bị viết lại lần 1:** requeue eid 9698, 10:31:19.128Z, detail "daemon startup recovery" — started_at 1795250151 (08:35:51Z) → 1795257079 (10:31:19Z). Dispatched 10:31:19.186Z (9699) + reattached 10:31:19.243Z (9700, detail "**execute turn already complete (model-output evidence)**" — KHÁC các lần reattach trước ("re-keyed waiter on active execute turn" ở run 159 lần 2) — chỉ ghi nhận, không suy luận cơ chế). Claimed_at VẪN 1795250151 (gốc, không viết lại).
- **Offset requeue: 10:31:19.128Z − btime 10:30:42Z = +37,128 s — TRONG dải 33–49,8 s → ĐIỂM (m) DƯƠNG ỨNG VIÊN** (dương đầu tiên kể từ #60 +46,642 s; dải GIỮ 33–49,8 s — 37,128 s không phá min 33,236 s hay max 49,761 s). Requeue cửa rộng 10:30:42–10:46:00Z (mọi job): ĐÚNG 1 (run 161) — #63 chỉ viết lại run 161.
- **Chứng minh run 161 đang chạy tại btime:** đọc #5 lúc 10:19:22Z (running, started 08:35:51Z) + chính event requeue 10:31:19Z. Truy vấn spanning btime trả 0 dòng — CAVEAT ĐỨNG: run bị viết lại tự loại khỏi spanning vì started_at hiện tại = mốc viết lại (cùng caveat T7-157/158/159/160 §2.4).
- **Watcher-161 (pid 19861) chết theo #63:** replay-watch-161.log poll cuối 10:30:39Z (boot=39d46ba0), 3 s TRƯỚC btime; 0 poll sau btime → watcher chết theo reboot, KHÔNG có overlap dài như #62. Overlap #63 (nếu có) ≤ ~30 s. T5-162 kiểm tra watcher lúc mở theo quy tắc đứng (3). POSTBOOT_PASS #63 CHƯA CÓ lúc T7 đóng cờ (T5-162 sở hữu).
- **n nếu parent chấp nhận #63 DƯƠNG: 19 (17 dương + 2 âm, nhánh khuyến nghị) hoặc 20 (17 dương + 3 âm, nhánh #56 ÂM).** Chấp nhận cả #62 ÂM + #63 DƯƠNG → 20 (17+3) hoặc 21 (17+4). T7 trình số, parent quyết; điều tra (m) VẪN ĐÓNG.

### 2.6 Run 161 — jitter 0 s, 1 lần viết lại tại #63, vẫn running lúc đóng cờ

Run 161 (`0b0a27f8-72f4-4066-9953-e68a5157822d`, sched 1795250151 = 08:35:51Z):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795250151 | 08:35:51Z 21/11 |
| dispatched (event) | — | 08:35:51.069Z (eid 9673) |
| started_at GỐC | 1795250151 | 08:35:51Z — **jitter 0 s** |
| started_at sau viết lại #63 | 1795257079 | 10:31:19Z (requeue 10:31:19.128Z) |
| worker_claimed_at | 1795250151 | 08:35:51Z (gốc, không viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795260951 | 11:35:51Z 21/11 |

- 7 lần đọc DB đầy đủ trong phiên: status `running` ở cả 7 lần; started_at KHÔNG đổi ở đọc #1–#5, đổi 1 lần ở đọc #6 (sau #63) rồi KHÔNG ĐỔI ở đọc #7; claimed_at KHÔNG đổi lần nào; attempt 1; error_text null; worker_execution_timed_out false. Events: 4 (dispatched 08:35:51.069Z + bộ requeue/dispatched/reattached tại #63) — **1 lần viết lại, 0 lần viết lại thêm tới lúc đóng cờ**.
- Tuổi run từ gốc lúc đọc cuối #7 (10:45:59Z): 7.808 s; từ started viết lại: 880 s; còn 2.992 s tới hạn ngân sách 11:35:51Z. **Kết cục thuộc T7-162.**
- Jitter 0 s — lần thứ mười bốn liên tiếp run vcut jitter 0 (160 là lần thứ mười ba).
- Run 161 dispatch TRƯỚC btime #62 (08:35:51Z > 07:59:29Z) → không bị #62 viết lại (0 requeue do #62). Run 161 bị #63 viết lại — chuỗi run bị viết lại tiếp tục: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (**1 lần** tới lúc đóng cờ).

### 2.7 Slot HB/DR trong cửa 08:00Z → 10:50Z 21/11 — HB 6/6 (1 muộn +888 s) + DR 3/3; CỬA LÀNH TRỪ 1 SLOT MUỘN

Cửa kiểm ~2h09' (7 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 1 muộn mới (+888 s).**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:20:50 (08:20:50Z) | 46118804 | 08:35:38 | **+888 s** | CÓ (MUỘN) |
| 15:50:50 (08:50:50Z) | b5330933 | 08:45:34 | −316 s | CÓ |
| 16:20:50 (09:20:50Z) | 33dde144 | 09:15:34 | −316 s | CÓ |
| 16:50:50 (09:50:50Z) | e65ead93 | 09:45:34 | −316 s | CÓ |
| 17:20:50 (10:20:50Z) | 13a93de1 | 10:15:34 | −316 s | CÓ |
| 17:50:50 (10:50:50Z) | 67ff13d5 | 10:45:34 | −316 s | CÓ |

- Slot 08:20:50Z: dispatched 08:35:38.668Z (eid 9670), succeeded 08:35:38.745Z (9671), attempt 1, 0 requeue — **muộn thật, không phải viết lại**. **Muộn HB thứ 9 lũy kế** (+887 s ×6, +889 s, +891 s, +888 s mới; kỷ lục +1.252 s đợt 129) — **phá chuỗi 8 đợt vắng muộn** (153, 154, 155, 156, 157, 158, 159, 160: 0 muộn). 5 slot còn lại jitter −316 s (mẫu chuẩn, đồng đều tuyệt đối); tất cả `succeeded`, attempt=1, error_text=null, finished cùng giây started.
- Slot HB 07:50:50Z đã đếm ở đợt 160 — T7-161 chỉ đọc lại đối chiếu, KHÔNG đếm lại (tránh trùng mẫu số). Slot HB 11:20:50Z + DR 11:00Z chưa dispatch lúc đóng cờ — thuộc cửa T7-162.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:00 (08:00Z) | 5f8c6256 | 08:00:00 | 0 s | CÓ |
| 16:00 (09:00Z) | 11710653 | 09:00:00 | 0 s | CÓ |
| 17:00 (10:00Z) | bf30e5f0 | 10:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 07:00Z đã đếm ở đợt 160 — không đếm lại. DR 08:00Z dispatched 08:00:00.079Z — 31 s sau btime #62, daemon mới đã dispatch bình thường.

### 2.8 Số hiệu reboot — #62/#63 đếm tuần tự, giao parent/T2-162 chốt mù

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — T7-161 + T0-161 7 nguồn + T2-161 drift 0,9960 xác minh độc lập), #63 = 94d22520 (10:30:42Z, giờ thật — T7-161 xác minh 6 nguồn; T0/T2-162 xác minh độc lập).
- KHÔNG có lệch số hiệu đợt này (T0/T1/T2/T5/T6/T7/T8 đều dùng #62; #63 do T7-161 đếm tuần tự — chờ parent xác nhận). T7 dùng số hiệu tuần tự (#62/#63) xuyên suốt file này và phụ lục; mọi boot_id/btime đều ghi đầy đủ để đối chiếu.
- Mù đi kèm: #93? (#61) ĐÓNG theo T2-161 (chờ quyết parent); #94? (#62) SƠ BỘ MỞ, giao T2-162 (T7 không chứng nhận mù nào). #88? (#56) VẪN MỞ; #77? VẪN MỞ. POSTBOOT_PASS #62 ĐÃ CÓ 08:59:30Z (T5-161); POSTBOOT_PASS #63 CHƯA CÓ (T5-162 sở hữu); POSTBOOT_PASS #60 KHÔNG CÓ, không bù được — boot thứ 6 không có cờ. Watcher-161 pid 19861 chết theo #63 (T5-162 kiểm tra lúc mở); watcher-160 pid 4539 chết ~08:13:13Z cùng boot cũ (không phải tại btime #62 — xem §2.2).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 160/161 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô trước khi ghi (bài học F-146/F-147/F-148-T7-1; lần này không bắt được phép tính nháp sai nào — xem §6). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 10:31:19.128Z, 08:03:36.487Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): khi một mốc là giờ thật và mốc kia là epoch DB đợt 153–156, PHẢI xác định khung của từng mốc trước khi trừ — không trừ trực tiếp epoch DB wall với btime thật.** Đợt này: run 160 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 160 ở khung thật; offset #63 tính từ 2 mốc trên boot mới (event DB + btime), khung thật; overlap #62 tính từ nhãn log boot cũ (đã chứng minh là giờ thật bằng neo Cloudflare + cadence) và btime boot mới (giờ thật).
4. Cửa kiểm đợt này ~2h09' (08:00Z → 10:46Z 21/11), đủ 6 slot HB + 3 slot DR + run vcut 160 (kết cục) và 161 (theo dõi + viết lại tại #63). Bảy lần đọc DB đầy đủ; run 160 được đọc đầy đủ 7 lần khớp hoàn toàn nhau ở mọi trường (trừ claimed_at đổi 1 lần, đã ghi rõ); run 161 được đọc đầy đủ 7 lần (started_at đổi đúng 1 lần tại #63, khớp events); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa.
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 07:50:50Z + DR 07:00Z thuộc cửa 160 theo quy ước đứng (T7-160 đã đếm); slot DR 08:00Z + HB 08:20:50Z thuộc cửa 161 (sau kiểm cuối T7-160 lúc 07:47Z). HB 11:20:50Z + DR 11:00Z thuộc cửa T7-162.
6. **1 sleep bị giết trong phiên này** (sleep 5, 1.560 s, bị SIGTERM sau 679 s — quanh btime #63; xem F-161-T7-2). Các sleep khác hoàn thành bình thường (sleep 1: 1.200 s; sleep 2/3/4: 1.500 s ×3; sleep 6: 780 s). Boot đổi 1 lần trong phiên (39d46ba0 → 94d22520 tại #63, giữa đọc #5 và #6).
7. T7 đóng cờ ~10:47Z — trong hạn cờ ~11:00Z (~13' còn), trong hạn cứng toàn đợt 11:30Z (~43' còn). Run 161 vẫn running lúc đóng cờ — kết cục thuộc T7-162 (hạn ngân sách 11:35:51Z).
8. **Phụ lục số liệu (§8) viết bằng script** `appendix161.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay).

## 4. Cập nhật lũy kế (nối tiếp đợt 160, cùng phương pháp)

- Heartbeat: 44/351 → **44/357 slot thiếu** (cửa sổ 14/11 07:50:50 → 21/11 17:50:50 +07). Kiểm toán cửa sổ: 351 + 6 slot mới = 357 ✓. Số thiếu +0 (slot muộn tính vào mẫu số, không tính thiếu).
- Deterministic-doctor: 49/246 → **49/249 slot thiếu** (cửa sổ 11/11 09:00 → 21/11 17:00 +07). Kiểm toán: 246 + 3 = 249 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/357 = 12,3% (giảm từ 12,5% — 0 thiếu mới); DR 49/249 = 19,7% (giảm từ 19,9% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **8 → 9 lần** (+887 s ×6, +889 s, +891 s, **+888 s mới**; kỷ lục +1.252 s đợt 129) — 1 muộn mới đợt này (phá chuỗi 8 đợt vắng muộn: 153–160).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 160: SUCCEEDED theo hồ sơ daemon (wall 8.865 s, margin 1.935 s)** — 7 lần đọc DB đầy đủ khớp nhau + events đầy đủ (2 event, 0 event sau succeeded eid 9668). Margin rộng nhất từ đợt 150 (vượt 151: 1.828 s đúng 107 s; rộng hơn 159 đúng 632 s — chuỗi hẹp lại từ 151 ĐẢO CHIỀU và ĐẠT ĐỈNH MỚI).
2. **Run 160 bị 0 lần viết lại** — run đầu tiên sau chuỗi 4 run liên tiếp bị viết lại (156–159) mà kết thúc với 0 lần viết lại. Claimed→finished 7 s — trở lại họ 7–11 s sau ngoại lệ 66 s của run 159.
3. **Reboot #62 (btime 07:59:29Z, boot 39d46ba0): OVERLAP 824–854 s với boot cũ — lần đầu quan sát overlap dài.** Boot cũ 52c957d5 sống tới thật ~08:13:13Z (poller log liên tục, cadence 30/31 s, 0 NEWBOOT). T2 xác minh độc lập KHỚP T7. Phân kỳ: T0/T5 chọn H2 (btime ghi chậm ~841 s), T2/T7 chọn OVERLAP — **chờ T10 phán**. Hệ quả: các số nghịch lý cũ (+19/+28/+32 s) có thể là overlap ngắn, không phải clock skew — số không đổi, cơ chế đổi; T7 KHÔNG tự sửa quyết (v) đợt 160.
4. **Điểm (m) #62: ỨNG VIÊN ĐIỂM ÂM — T7 lean CHẤP NHẬN (đồng ý T2-161), parent quyết.** 1 run (160) đang chạy tại btime thật, 0 requeue — chữ ký đúng #45. Overlap là cơ chế giải thích, không phải lý do loại điểm (lý do: claimed_at đổi sang sau btime + đối chứng #60). N GIỮ 18/19 cho tới khi parent quyết; nếu chấp nhận → 19/20.
5. **Reboot #63 (btime 10:30:42Z, boot 94d22520) GIỮA PHIÊN: ĐIỂM (m) DƯƠNG ỨNG VIÊN** — viết lại run 161 lần 1, requeue +37,128 s (trong dải 33–49,8 s; dương đầu tiên kể từ #60). Dải GIỮ 33–49,8 s. N nếu chấp nhận #63 → 19/20; chấp nhận cả #62 + #63 → 20/21. Số hiệu #63 theo đếm tuần tự — chờ parent xác nhận. T0/T2-162 xác minh độc lập.
6. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-161 không thu hẹp được cửa lần thứ tư: R 2,56251–2,66817 s / J 2,566–2,80753 s) — chờ parent chốt J (quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 vẫn đứng). Dải dương ứng viên GIỮ 33–49,8 s. Điều tra (m) VẪN ĐÓNG.
7. **Cửa slot: HB 6/6 + DR 3/3, 0 thiếu mới — nhưng 1 slot MUỘN (+888 s, muộn thứ 9 lũy kế).** Lũy kế: HB 44/357, DR 49/249. Chuỗi 8 đợt vắng muộn (153–160) đã đứt.
8. **Run 161 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 7.808 s, còn 2.992 s tới hạn ngân sách 11:35:51Z; 1 lần viết lại tại #63) — kết cục thuộc T7-162. Run 161 là run đầu tiên bị viết lại sau run 160 (0 lần) — chuỗi viết lại không đứt hẳn.
9. **T9-161 chưa đóng lúc T7 đóng cờ (~10:47Z)** — T10 thu thập (không phải nợ của T7). T8-161 đã đóng 10:22:57Z (trước #63): O8 PASS 3/3, harness 6/6 + 0 kẹt — T8 không thấy #63, ghi nhận đúng lúc đóng.
10. **Mù #93? (#61) ĐÓNG theo T2-161 — chờ quyết parent** (verdict M phụ thuộc mốc nội dung HAI nguồn; lần thứ tư liên tiếp phụ thuộc mốc nội dung). **Mù #94? (#62) SƠ BỘ MỞ, giao T2-162** (đoạn N file/union 1.422 s, hố 08:11:54–08:35:36Z trống). **Mù #88? VẪN MỞ** (hole-recheck lần thứ năm: 345 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91; ứng viên CERT93/FULL108.
11. **INSIDE #62: NGOÀI dải FULL108 → chuỗi 2 KẾT THÚC; chuỗi mới từ #62 (độ dài 1)** (T2-161; T7 chỉ ghi nhận). INSIDE #63 giao T2-162 (btime 10:30:42Z).
12. **Watcher-160 chết ~08:13:13Z cùng boot cũ (không phải tại btime #62); watcher-161 chết theo #63** (poll cuối 10:30:39Z, 3 s trước btime). POSTBOOT_PASS #62 ĐÃ CÓ 08:59:30Z (T5-161, mode repair-sớm); POSTBOOT_PASS #63 CHƯA CÓ (T5-162 sở hữu); POSTBOOT_PASS #60 KHÔNG CÓ, không bù được — boot thứ 6 không có cờ.
13. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T2-161: 0 thử lần thứ 15 liên tiếp). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-161-T7-1 — Lean về điểm (m) #62 đổi giữa phiên (nháp đọc #1 → verdict cuối):** nháp NOTES đọc #1 (viết ~08:42Z, trước khi có bằng chứng claimed_at + đối chứng #60) lean "#62 gần #52/#61 hơn là #45" (không phải điểm). T2-161 đọc nháp đó và ghi "T7 lean ngược". Sau khi cân bằng chứng đầy đủ (claimed_at run 160 đổi sang sau btime 08:03:29Z — daemon mới đã re-claim mà không requeue; đối chứng #60: overlap ~32 s mà run vẫn bị viết lại +46,642 s), **T7 ĐỔI LEAN SANG CHẤP NHẬN #62 LÀ ĐIỂM ÂM** (đồng ý T2-161). ĐÃ SỬA trong file này (§2.3) + NOTES đọc #2. Không ảnh hưởng số liệu cứng nào (chữ ký 1-run-đang-chạy + 0-requeue không đổi; chỉ verdict lean đổi). Bài học: không lean sớm khi mới có chữ ký hình thức mà chưa có bằng chứng tương tác daemon (claimed/reconcile) + đối chứng — ghi "chưa đủ bằng chứng để lean" thay vì lean tạm.
- **F-161-T7-2 — Sleep 5 bị SIGTERM giết, giờ spawn không ghi chính xác:** sleep 5 (1.560 s) bị SIGTERM sau 679 s, quanh btime #63 — cùng mẫu đợt 156/157/158 (1 sleep bị giết sau btime). T7 không ghi timestamp lúc spawn sleep nên không xác định được giờ chết chính xác của sleep (ước ~10:31:39Z ±40 s, tức sau btime ~1 phút — không đủ chắc để kết luận overlap #63 dài ~1 phút; watcher-161 log dừng 10:30:39Z là bằng chứng chắc chắn hơn: overlap #63 ≤ ~30 s). Không mất dữ kiện nào (mọi lần đọc DB đều đủ; sleep 6 thay thế hoàn thành 780 s). Bài học: ghi `date -u` ngay trước mỗi lần spawn sleep (như T7-160 đã làm gián tiếp qua log sleep-done) để còn timestamp kill.
- **F-161-T7-0 — Không có sai số nào khác trong đợt này:** 7 lần đọc DB đầy đủ khớp nhau ở mọi trường trùng (run 160 + run 161) + events đối chiếu trực tiếp (run 160: 2 event, 0 event sau succeeded eid 9668; run 161: 4 event, 0 event mới sau reattach eid 9700) + truy vấn requeue theo cửa (#62: 07:59:29–08:35:51Z = 0; #63: 10:30:42–10:31:30Z = 1, 10:30:42–10:46:00Z = 1) + truy vấn spanning btime #62 (1 dòng: run 160) và #63 (0 dòng, có ghi rõ caveat run bị viết lại tự loại) + phân tích delta timestamp toàn bộ replay-watch-160.log bằng script (308 dòng, mọi delta 30/31 s, 0 NEWBOOT) + kiểm boot_id SAU khi đọc started_at ở mọi lần đọc (bài học F-142-T7-1 đã áp dụng); kết cục run 160 có 7 lần đọc DB độc lập khớp nhau + events đối chiếu trực tiếp (succeeded 08:03:36.487Z, eid 9668), không suy đoán sau; btime #62 xác minh 6+ nguồn + Cloudflare 3 lần trong phiên (đồng hồ boot mới đúng giờ thật, local chậm 1 s); btime #63 xác minh 6 nguồn + Cloudflare 2 lần (10:32Z, 10:46Z — đều chậm 1 s); github Date KHÔNG dùng làm chuẩn (bài học F-159-T7-1 đã áp dụng); 1 sleep bị SIGTERM giết trong phiên này (sleep 5, quanh btime #63 — khác đợt 159/160: 0 sleep bị giết; giống đợt 156/157/158: 1 sleep bị giết sau btime).

## 7. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round161-t7-scheduler.txt` — NUL-delimited, 1 entry (file LIMITS này), text-only, 0 binary. Verify read-back sau khi ghi (od -c).
- Ghi chú điều tra đầy đủ + bảng slot + script phụ lục: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t7/NOTES.md` + `appendix161.py` + `appendix161.txt` (không nằm trong repo nên không stage).
- **Cờ `.done` CÓ NỘI DUNG** (quyết parent (l) đợt 152 + (p) đợt 153 — không để 0 byte như T7-152): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round161-t7.done` ghi tóm tắt kết quả + giờ UTC đóng cờ.

## 8. Phụ lục số liệu (viết bằng script `appendix161.py` từ epoch thô — xem file `appendix161.txt` trong round161-t7)

### Phu luc A — Run 160 (ket cuc SUCCEEDED, T7-161)
- sched 1795239351 = 2026-11-21T05:35:51Z; started GOC 1795239351 = 2026-11-21T05:35:51Z (jitter 0 s)
- finished 1795248216 = 2026-11-21T08:03:36Z; status succeeded; attempt 1; error null; timed_out false
- claimed 1795248209 = 2026-11-21T08:03:29Z (finished - 7 s)
- wall tu started GOC: 1795248216 - 1795239351 = 8865 s (2h27m45s)
- han ngan sach: 1795250151 = 2026-11-21T08:35:51Z; margin: 1795250151 - 1795248216 = 1935 s (0h32m15s)
- finished SAU btime #62: 1795248216 - 1795247969 = 247 s (0h04m07s) sau
- KHONG co event nao cho run 160 sau succeeded 08:03:36.487Z (eid 9668); tong 2 event
- Margin rong NHAT tu dot 150 (151: 1828 s; 160: 1935 s — hon 151 dung 107 s; hon 159: 1303 s dung 632 s)

### Phu luc B — Reboot #62 (truoc phien 161) + #63 (giua phien 161)
- #61: btime 1795238749 = 2026-11-21T05:25:49Z, boot 52c957d5
- #62: btime 1795247969 = 2026-11-21T07:59:29Z, boot 39d46ba0
- #63: btime 1795257042 = 2026-11-21T10:30:42Z, boot 94d22520
- gap #61->#62 (btime-btime): 1795247969 - 1795238749 = 9220 s (2h33m40s)
- gap #62->#63 (btime-btime): 1795257042 - 1795247969 = 9073 s (2h31m13s)
- doi that boot #61 (btime #61 -> chet boot cu ~08:13:13Z): 1795248793 - 1795238749 = 10044 s (can duoi, chet trong (08:13:13Z, 08:13:43Z])
- overlap #62: chet boot cu - btime #62 = 824 s (can duoi) den 854 s (can tren)
- requeue #62: 0 requeue trong cua 07:59:29-08:35:51Z (moi job)
- requeue #63: 1 requeue (run 161, eid 9698, 10:31:19.128Z) = btime + 37,128 s — TRONG dai 33-49,8 s

### Phu luc C — Run 161 (van running luc dong co T7-161, 1 lan viet lai tai #63)
- sched 1795250151 = 2026-11-21T08:35:51Z; started GOC 1795250151 = 2026-11-21T08:35:51Z (jitter 0 s)
- started sau viet lai lan 1 #63 1795257079 = 2026-11-21T10:31:19Z (requeue 10:31:19.128Z = btime #63 + 37,128 s)
- claimed 1795250151 = 2026-11-21T08:35:51Z (goc, khong viet lai)
- han ngan sach (started goc + 10800): 1795260951 = 2026-11-21T11:35:51Z (ket cuc thuoc T7-162)
- tuoi goc luc doc cuoi (2026-11-21T10:45:59Z): 1795257959 - 1795250151 = 7808 s (2h10m08s); con 2992 s toi han
- tuoi tu started viet lai luc doc cuoi: 1795257959 - 1795257079 = 880 s (0h14m40s)
- events: 4 (dispatched 08:35:51.069Z eid 9673; requeued 10:31:19.128Z eid 9698; dispatched 10:31:19.186Z eid 9699; reattached 10:31:19.243Z eid 9700)

### Phu luc D — Slot HB/DR cua T7-161 (doc #1-#7, 08:37Z-10:46Z)
- HB sched 2026-11-21T08:20:50Z: started 2026-11-21T08:35:38Z, jitter 888 s, succeeded
- HB sched 2026-11-21T08:50:50Z: started 2026-11-21T08:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T09:20:50Z: started 2026-11-21T09:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T09:50:50Z: started 2026-11-21T09:45:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T10:20:50Z: started 2026-11-21T10:15:34Z, jitter -316 s, succeeded
- HB sched 2026-11-21T10:50:50Z: started 2026-11-21T10:45:34Z, jitter -316 s, succeeded
- DR sched 2026-11-21T08:00:00Z: started 2026-11-21T08:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T09:00:00Z: started 2026-11-21T09:00:00Z, jitter 0 s, succeeded
- DR sched 2026-11-21T10:00:00Z: started 2026-11-21T10:00:00Z, jitter 0 s, succeeded
- TONG CUA: HB 6/6 (1 muon +888 s, 5 chuan -316 s; 0 thieu), DR 3/3 (0 thieu) — CUA LANH (tru 1 slot muon)
- Luy ke: HB 44/351 -> 44/357 (so thieu +0); DR 49/246 -> 49/249 (so thieu +0)
- Ti le thieu: HB 12.3%; DR 19.7%
- Muon HB luy ke: 8 -> 9 (+887 s x6, +889 s, +891 s, +888 s moi; ky luc +1.252 s dot 129)

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
- #56 CO DIEU KIEN (quyet (e) dot 157; T2-158 + T2-159 + T2-160 + T2-161 KHONG thu hep duoc cua: R 2,56251-2,66817 s / J 2,566-2,80753 s — lan thu TU)
- #57 DUONG (+47,698 s) — CHAP NHAN (quyet (f) dot 157)
- #58 DUONG (+42,529 s) — viet lai run 157 lan 2; TINH BANG GIO THAT
- #59 DUONG (+35,173 s) — viet lai run 158 lan 1; TINH BANG GIO THAT
- #60 DUONG (+46,642 s) — CHAP NHAN (quyet (f) dot 159); viet lai run 159 lan 1; TINH BANG GIO THAT
- #61 KHONG PHAI diem du lieu (T7-160: 0 run dang chay tai btime 05:25:49Z; 0 requeue trong cua 05:25:49-05:35:51Z) — cung mau #52
- #62 UNG VIEN DIEM AM (T7-161 + T2-161 lean CHAP NHAN; parent quyet): run 160 dang chay tai btime 07:59:29Z (that), 0 requeue — chu ky nhu #45; overlap 824-854 s la co che giai thich
- #63 DUONG UNG VIEN (T7-161; parent quyet): viet lai run 161 lan 1, requeue 10:31:19.128Z = btime + 37,128 s — TRONG dai 33-49,8 s
- n CHINH THUC (ung vien, quyet (g) dot 156) = 14 (12 duong + 2 am #38/#45) — GIU cho toi khi parent quyet
- n ung vien truoc #62/#63 = 18 (16 duong + 2 am, nhanh khuyen nghi) hoac 19 (16 duong + 3 am, nhanh #56 AM) — GIU
- NEU parent chap nhan #62 AM: n = 19 (16+3) hoac 20 (16+4)
- NEU parent chap nhan #63 DUONG: n = 19 (17+2) hoac 20 (17+3)
- NEU parent chap nhan CA #62 AM + #63 DUONG: n = 20 (17+3) hoac 21 (17+4)
- Dai requeue duong ung vien GIU 33-49,8 s (#63 +37,128 s nam trong dai, khong pha min/max)
- LUU Y SO HIEU: 348dab54=#56; bcbaa3ad=#57; 28366bd0=#58; eec65561=#59; e590ae0a=#60; 52c957d5=#61; 39d46ba0=#62 (T0/T2/T7 xac minh doc lap); 94d22520=#63 (T7-161, dem tuan tu — cho parent xac nhan)
