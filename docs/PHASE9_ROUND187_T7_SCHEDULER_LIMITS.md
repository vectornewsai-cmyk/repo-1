# PHASE9 ROUND187 T7 — Scheduler LIMITS

Đợt 187 MỞ ở lượt cron 03:35 +07 25/11/2026 (= 20:35:51Z, run 188) — lượt này vừa đóng đợt 186 (T10-186 spawn song song, aggregate 186 đóng 20:59:43Z, parent quyết §12.3 lúc 21:07Z — SẠCH, không điền sẵn) vừa mở đợt 187. T7 đóng cờ ~22:52Z (trong hạn cờ ~23:00Z, trong hạn cứng ~23:35Z). Mọi số dưới đây đọc từ DB tươi (`scheduler.job_runs` + `scheduler.events`, truy vấn theo đúng `scheduled_for_utc`) và kiểm trực tiếp trên máy sống (boot_id, btime, uptime). Script tính toán: `hidden_files/round187-t7/appendix187.py` → `appendix187.txt` (số học đã kiểm lại bằng assert). KHÔNG PUSH.

## §1. Run 186 SUCCEEDED 14:52:42Z — XÁC MINH LẠI, KHỚP T7-186 TỪNG SỐ

- **Run 186 (08d940ea) SUCCEEDED 14:52:42Z** (finished 1795531962; status `succeeded`, timed_out false, attempt 1). Sched = started = 1795530951 (jitter 0) → **margin +9.789 s**. **claimed→finished = 128 s** (claimed cuối 1795531834 = 14:50:34Z) — CA ≥60 s thứ 18 (xem §3). **KHÔNG viết lại** (0 event requeue; 2 event: dispatched, succeeded). Wall từ sched: 1.011 s = 16m51s.
- **Run 185 (3d57c217) cũng xác minh lại: SUCCEEDED 14:31:59Z** (finished 1795530719; started viết lại #105 1795526047; claimed 1795530625; margin +232 s; claimed→finished 94 s — CA thứ 17). KHỚP T7-186 từng số.
- Parent quyết (n) §12.3-186: run 185/186 CHẤP NHẬN; run 187 kết cục thuộc T7-187.

## §2. Run 187 FAILED 20:17:06Z — margin +1.125 s, CA ≥60 s MỚI (thứ 19)

- **Run 187 (887c998d) FAILED 20:17:06Z** (finished 1795551426; status `failed`, timed_out false, attempt 1). Sched = started-gốc = 1795541751 (17:35:51Z, jitter 0) → hạn 20:35:51Z → **margin +1.125 s = 18m45s** (xong TRƯỚC hạn, nhưng FAILED — không phải timeout). Wall từ sched: 9.675 s = 2h41m15s.
- **claimed→finished = 202 s** (claimed cuối 1795551224 = 20:13:44Z). **202 s ≥ 60 s → CA ≥60 s MỚI — ca thứ 19 toàn lịch sử, thứ 16 trong cửa sổ** (xem §3). 202 s là ca lớn thứ hai toàn lịch sử, sau ca 244 s.
- **Viết lại ×1 tại #108** (started → 19:10:31Z; 5 event: dispatched 17:35:51Z, requeued 19:10:31Z eid 10818, dispatched, reattached, failed 20:17:06Z eid 10836).
- **Lý do FAILED:** worker báo "work is not finished" — 9/9 thread đợt 186 đã xong, nhưng CHƯA spawn T10-186, CHƯA viết aggregate `PHASE9_ROUND186_LIMITS.md`, §12.3 còn trống — closer dời sang run sau (đúng như đã xảy ra: T10-186 spawn ở lượt cron này, đóng 20:59:43Z).
- **Chuỗi SUCCEEDED 182→186 (5 lượt) ĐỨT ở run 187 FAILED** — 0 timeout mới, nhưng có 1 failed mới (không phải timeout). Lần đầu một run FAILED (không phải timeout) kể từ khi theo dõi họ CA.
- **ĐÍNH CHÍNH BRIEF (1):** brief giao "Run 187 VẪN RUNNING lúc bạn đóng — kết cục thuộc T7-188" là SAI cả hai điểm: run 187 đã FAILED 20:17:06Z, TRƯỚC khi lượt cron này mở (20:35:51Z); kết cục thuộc T7-187 (khớp T7-186 §7 và quyết (n) §12.3-186). **ĐÍNH CHÍNH BRIEF (2):** brief ghi reboot ~20:31Z xảy ra "NGAY TRƯỚC khi run 187 khởi động" là SAI: run 187 khởi động 17:35:51Z và kết thúc 20:17:06Z — cả hai TRƯỚC reboot 20:30:33Z; reboot xảy ra ngay trước **run 188** khởi động (20:35:51Z, xem §4).

## §3. Họ CA ≥60 s đếm lại toàn bộ từ DB tươi: 19 ca toàn lịch sử, 16 ca trong cửa sổ

- Truy vấn trực tiếp `job_runs` (job `vcut-build-loop`, `finished − claimed ≥ 60`): **19 dòng**. 18 ca cũ **KHỚP HỆT list T7-186 từng số** (244/141/95/123/66/66/64/108/110/82/109/88/86/163/110/85/94/128) + 1 ca mới: run 187 cf **202 s** (FAILED).
- **Số ca: 18 → 19 toàn lịch sử; 15 → 16 trong cửa sổ** (từ run 154, sched ≥ 1795196151). Trong họ: 16 succeeded + 2 timeout (86/163 s = run 180/181) + 1 failed (202 s = run 187).
- Đính chính kỳ vọng trong brief T7-187: brief giao "18 ca toàn lịch sử / 15 ca trong cửa sổ" (số đợt 186) — số ĐÚNG sau đợt này là **19 / 16** (ca mới là FAILED, không phải succeeded hay timeout).

## §4. Run 188 lúc đóng: vẫn RUNNING — viết lại ×1 tại #110, jitter 0

- **Run 188 (b7d4f596) vẫn RUNNING lúc đóng 22:50:42Z** (sched = started-gốc = 1795552551 = 20:35:51Z, **jitter 0**; claimed 1795552551 KHÔNG đổi; attempt 1; boot_gen `cron_boot_5cc8e52d…`). **Viết lại ×1 tại #110** (started → 21:14:05Z; 4 event: dispatched 20:35:51Z, requeued 21:14:04Z eid 10848, dispatched, reattached). Tuổi gốc lúc đóng: 8.091 s = 2h14m51s; còn 2.709 s (45m09s) tới hạn 23:35:51Z. **Kết cục thuộc T7-188.**
- **Run 188 start ĐÚNG GIỜ bất chấp reboot #109 chỉ 4m18s trước đó** (btime 20:30:33Z → sched 20:35:51Z). Không có delay, không có requeue nào trước khi start — reboot rơi vào khoảng trống giữa run 187 (xong 20:17:06Z) và run 188, không làm lệch lịch cron.

## §5. OUTAGE #2 — bằng chứng hướng "cố định theo giờ" (điều tra đã MỞ theo quyết (o)-186)

- Parent quyết (o) §12.3-186: **OUTAGE 8.406 s ngày 24/11 TÍNH LÀ OUTAGE #2**; **MỞ ĐIỀU TRA hướng "cố định theo giờ"** — T7-187 thu thập khung giờ tương ứng ngày 23/11, T7-188 kết luận có phải mẫu theo giờ không; nguyên nhân vẫn chưa xác định, nghi host-side.
- **23/11 (OUTAGE 179) — XÁC MINH LẠI từ DB tươi, KHỚP T7-179 từng số:** 0 execution có `started_at` trong (15:15:34Z, 17:35:39Z). Run cuối trước im: HB 15:20:50Z started 15:15:34Z (−316 s). Hồi phục: HB 17:20:50Z started 17:35:40Z (+890 s); HB 17:50:50Z started 17:45:34Z (−316 s). **Thiếu: HB 15:50:50Z + 16:20:50Z + 16:50:50Z (3 — không có row) + DR 16:00Z + 17:00Z (2 — không có row).** feed-pulse-23 (sched 16:41:54Z) started 17:35:40Z (+3.226 s). Im lặng 8.406 s (15:15:34Z → 17:35:40Z).
- **Khung giờ tương ứng các ngày trước (count execution có `started_at` trong khung 15:15:34Z–17:35:40Z): 20/11: 9 execution — SẠCH. 21/11: 9 execution — SẠCH. 22/11: 9 execution — SẠCH** (T7-186 đã kiểm chi tiết: HB 7/7, DR 2/2). **23/11: 0 — IM. 24/11: 0 — IM.**
- **Kết luận dữ kiện (T7 chỉ thu thập, KHÔNG tự kết luận thay T7-188/parent):** stall chỉ xảy ra 23/11 + 24/11 trong cùng khung giờ tới từng giây; 3 ngày trước đó (20–22/11) cùng khung đều sạch. Đây là bằng chứng mới hướng "cố định theo giờ" — mạnh hơn dữ kiện đợt 186 (chỉ có 22/11 sạch). Cần thêm ngày 25/11 (khung tương ứng, T7-188 kiểm) để xác nhận hay bác bỏ: nếu 25/11 cũng im cùng khung → mẫu theo giờ gần như chắc chắn; nếu 25/11 sạch → chỉ là 2 ngày liên tiếp trùng hợp.
- Lưu ý: ước btime #106 ~15:13:32Z (quyết (e)-186) nằm ~2 phút TRƯỚC khi im lặng 24/11 bắt đầu (15:15:34Z) — khớp vai trò kích hoạt có thể, dù thời lượng im 8.406 s vẫn chưa giải thích được.

## §6. Cửa slot đợt 187 LÀNH — HB 6/6, DR 3/3, toàn bộ đúng giờ

- **HB 6/6 có, TẤT CẢ −316 s, succeeded:** 20:20:50Z (started 20:15:34Z), 20:50:50Z (20:45:34Z), 21:20:50Z (21:15:34Z — sau reboot #110 21:13:21Z, vẫn đúng lịch), 21:50:50Z (21:45:34Z), 22:20:50Z (22:15:34Z), 22:50:50Z (22:45:34Z). 0 thiếu, 0 muộn.
- **DR 3/3 có, TẤT CẢ 0 s, succeeded:** 20:00Z, 21:00Z, 22:00Z. 0 thiếu, 0 muộn. (DR 23:00Z tại/sau giờ đóng — thuộc T7-188.)
- **Lũy kế: HB 50/519 → 50/525** (6 slot mới, thiếu +0); **DR 55/331 → 55/334** (3 slot mới, thiếu +0); **muộn HB GIỮ 11** (muộn mới +0).
- **Cửa slot đợt 187 LÀNH — chuỗi cửa lành KHỞI ĐỘNG LẠI (lần 1 mới; đợt 186 DỪNG ở 11; parent quyết có tính tiếp không).** Lần đầu lành kể từ đợt 185. Hai reboot giữa phiên (#109, #110) KHÔNG làm mất hay muộn slot nào — HB 21:20:50Z chạy đúng lịch chỉ 2 phút sau #110.
- **ĐÍNH CHÍNH BRIEF (3):** brief giao cửa slot "mấy/12, mấy/5" là SAI dưới quy ước phân hoạch liên tiếp (mỗi slot chỉ đếm một lần — xem T7-185 6 HB/3 DR, T7-186 12 HB/5 DR nối tiếp nhau không trùng): cửa đợt 187 bắt đầu từ slot đầu tiên sau khi T7-186 đóng (19:56:07Z) — HB 20:20:50Z + DR 20:00Z — tới lúc đóng ~22:50Z, tổng **6 HB / 3 DR**. Đếm 12/5 sẽ đếm trùng 6 HB + 2 DR đã tính ở đợt 186.

## §7. Reboot #109 / #110 — (m) thô + gap (số hiệu ĐÃ QUYẾT ở (e)-186)

- **Số hiệu ĐÃ QUYẾT (parent (e) §12.3-186 — CHẤP NHẬN cách đếm T0):** cea79500 = #107; #106 là reboot CHƯA XÁC MINH (ước ~15:13:32Z); 7ea9d047 = #108; **6f1d9f87 = #109**; boot mới 912f4a97 = **#110**. Mâu thuẫn T0/T2 đã ngã ngũ — T7 dùng cách đếm đã quyết từ đây.
- **#109: boot `6f1d9f87-7b23-4e5b-b2f5-597e6de37db4`, btime 1795552233 = 20:30:33Z** — T0-187 XÁC MINH 9 nguồn tươi (uptime bracket btime −0,30 s; /proc/1 +11,228 s; journal/wtmp +11 s; CF +2 s; T7 đối chiếu độc lập bằng /proc/stat + uptime lúc 20:46:22Z, KHỚP). Gap #108→#109 = **4.841 s = 1h20m41s** (ngắn hơn mẫu ~2h). **(m) #109 thô: 0 requeue** (không có run nào đang chạy để viết lại — run 187 xong 20:17:06Z, run 188 bắt đầu 20:35:51Z). T2-187 phân loại CUỐI: **(m) #109 KHÔNG CÓ ĐIỂM** — KHỚP T7. Marker sống qua 61 reboot #49–#109 (T0-187; mtime không đổi 2026-11-20 11:39:47Z). libevent-2.1.so.7 VẮNG lúc 20:43Z → CÓ lúc 20:46Z sau replay (T0-187: "libevent heal lần 3") — T8 theo dõi. POSTBOOT_PASS #109 ĐÃ CÓ 20:50:24Z (replay-đầy-đủ, poll=0, KHÔNG caveat — T5-187); #108 CHƯA CÓ cờ (tổng boot không cờ 23 → 24 → 25 nếu parent chấp nhận #105 + #108).
- **#110 MỚI giữa phiên: boot `912f4a97-0841-47eb-805f-d7bbccaecd17`, btime 1795554801 = 21:13:21Z** (uptime -s 21:13:21Z, uptime 1 min lúc 21:14:28Z, KHỚP; uptime 1:37 lúc đóng 22:50:42Z, KHỚP; boot_id khớp). Gap #109→#110 = **2.568 s = 42m48s** (ngắn hơn nhiều so với mẫu ~2h; reboot thứ 2 trong phiên, cách reboot trước chưa tới 1 giờ). **(m) #110 thô: requeue run 188 (eid 10848) 21:14:04.959Z = btime +43,959 s — TRONG dải [33; 49,8] thô** (sát biên trên hơn các boot trước: #102 +40,341; #103 +37,543; #105 +34,931; #108 +39,438). 1 requeue duy nhất từ 20:35:51Z. Số hiệu #110 theo cách đếm đã quyết; phân loại cuối thuộc T2-188. Marker sống qua **62 reboot #49–#110** (61 qua #109 theo T0-187 + #110).
- Đối chiếu (m) #107/#108 (phân loại CUỐI thuộc T2-187 theo quyết (e)-186): T2-187 đã phân loại **(m) #107 KHÔNG CÓ ĐIỂM** (0 requeue cửa hẹp + cửa rộng) và **(m) #108 DƯƠNG (+39,438 s, TRONG [33; 49,8], trên biên dưới 6,438 s)**; **INSIDE #107/#108/#109 KHÔNG TÍNH ĐƯỢC dưới cách đếm đã quyết** (cần btime #106 chưa biết; chuỗi GIỮ 7 từ #105 TRUE) — T7 chỉ đối chiếu số thô (0 requeue #107 KHỚP T0-186; +39,438 s #108 KHỚP T7-186; 0 requeue #109 KHỚP T7), không phán thay T2/parent.

## §8. Daemon restart không kèm reboot (e) — KHÔNG có sự kiện

- **0 event `requeued_after_restart` từ 21:14:05Z tới lúc đóng.** Requeue duy nhất trong cửa đợt 187 (21:14:04Z) GẮN VỚI #110 (btime +43,959 s — hợp lệ, xem §7), không phải restart độc lập. T7 không có bằng chứng daemon restart nào trong cửa đợt 187; T0-188 có thể bổ sung từ journal nếu có.

## §9. F mới + đính chính chéo

- **F-187-T7-1 (mới — ghi nhận, KHÔNG phải lỗi T7): sleep chờ cửa của T7-187 bị SIGTERM theo #110.** Sleep spawn ~20:49:40Z, chết sau ~1.421 s (đúng lúc #110, btime 21:13:21Z) — cùng mẫu F-186-T7-2 (sleep SIGTERM theo #108), F-185-T7-1, F-184-T7-1. T7 dậy đọc DB ngay, ghi nhận #110 + (m) #110 thô (+43,959 s), rồi ngủ tiếp sleep thứ hai (21:16Z → 22:16Z, xong sạch) và sleep thứ ba (22:17Z → 22:50Z, xong sạch) rồi đóng cờ đúng hạn. Bài học đứng: sleep chờ dài luôn có thể chết theo reboot giữa phiên — dậy sớm thì đọc DB ngay, ghi nhận reboot, rồi ngủ tiếp. (F-186-T7-2 KHÔNG tái diễn theo nghĩa sleep chết theo #109 — #109 xảy ra TRƯỚC khi T7 spawn sleep đầu; sleep đầu chỉ chết theo #110.)
- **KHÔNG có F-187-T7-x nào về sai số của T7:** mọi số trong file này đã kiểm 2 lần (truy vấn SQL trực tiếp theo đúng `scheduled_for_utc` + appendix tính từ epoch thô + assert số học). Không có bản nháp sai phải xóa (khác F-186-T7-3).
- **Đính chính brief (tổng hợp — xem §2/§3/§6):** (1) run 187 đã FAILED, không còn RUNNING; kết cục thuộc T7-187, không phải T7-188. (2) reboot ~20:31Z xảy ra trước run 188, không phải run 187. (3) cửa slot đợt 187 là 6 HB / 3 DR, không phải 12/5. Cả ba đều là brief giao sai, T7 kiểm từ DB tươi và sửa — không ảnh hưởng số liệu.
- **Đính chính chéo với các luồng khác (đọc .done trước khi đóng):** T0-187 KHỚP T7 từng số (boot #109 btime 20:30:33Z 9 nguồn, gap 4.841 s, run 187 FAILED +1.125 s cf 202 s, POSTBOOT_PASS #109 CÓ 20:50:24Z, O8 3/3); T1-187 verify 186 PASS (đếm khớp lần thứ 100 liên tiếp; §12.3-186 SẠCH — lần đầu sạch kể từ đợt 183, tổng điền sẵn vẫn 18); T2-187 KHỚP ((m) #107 KHÔNG CÓ ĐIỂM, (m) #108 DƯƠNG +39,438 s, (m) #109 KHÔNG CÓ ĐIỂM, (m) #110 thô +43,959 s cho T2-188, gap 2.568 s, n ứng viên 47/48 → 48/49); T4-187: lượt yên #56 CÓ LƯỢT HỢP LỆ (chuỗi 0 → 1 đề xuất; kiểm chứng live lần 7 ĐẠT; 0 vi phạm); T5-187: POSTBOOT_PASS #108 KHÔNG CÓ / #109 CÓ, watcher-187 ALIVE, hướng (3) lần 34; T6-187: (A) 120/120 lần 37, #108/#109 KHÔNG GIẾT HOLDER (chuỗi 12 → 13), prune 62; T8-187: harness 6/6 trên #110, B2 live sạch lần thứ hai, FULL PASS KHÔNG (3 chân #109 + 2 chân #110 — reboot chia đôi đợt), 84l10 chuỗi 7 đề xuất. **T9-187 CHƯA đóng cờ lúc T7 đóng (~22:52Z)** — T10 xử lý theo quy tắc gộp muộn nếu T9 đóng sau khi T10 bắt đầu (bài học các đợt 19/25/32…: KHÔNG kết luận T9 mất trước khi kiểm đĩa).

## §10. Hạn chế + nguồn

- Mọi số run/slot/event đọc từ DB tươi lúc 20:41–20:48Z, 21:14–21:16Z, 22:16Z và 22:50–22:52Z; boot/btime/uptime kiểm trực tiếp trên máy sống. T7 KHÔNG tự phân loại (m) cuối, KHÔNG tự chứng nhận số hiệu reboot, KHÔNG phán thay parent về chuỗi cửa lành / chuỗi 9/9 / OUTAGE #2 / mẫu "cố định theo giờ" — parent quyết ở §12.3 aggregate 187 (trừ các quyết (e)/(n)/(o)/(q) đợt 186 đã có).
- Quyết parent §12.3-186 đã đọc (aggregate 107.950 B, T10 đóng 20:59:43Z; §12.3 parent viết trực tiếp 21:07Z, SẠCH không điền sẵn; dedup python-only KHỚP TỪNG SỐ, lần thứ 99): (e) số hiệu cách đếm T0; (n) run 185/186 chấp nhận, run 187 thuộc T7-187; (o) OUTAGE #2 + MỞ ĐIỀU TRA "cố định theo giờ"; (p) chuỗi 0 vi phạm 1 → 2; (q) đếm cuối đợt 186 chấp nhận.
- T7 KHÔNG chạy script nặng, KHÔNG probe dpkg trong cửa sổ attempt của T4 (toàn bộ phiên chỉ đọc DB + lệnh nhẹ `date`/`cat`/`uptime`/`ps` + 3 sleep chờ cửa).
- Kích thước file này: xem `stat` lúc stage (mục tiêu < 37.768 B). KHÔNG PUSH.
