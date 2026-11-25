# PHASE9 ROUND186 T7 — Scheduler LIMITS

Đợt 186 MỞ MUỘN: lượt cron 21:35 +07 24/11/2026 (= 14:35:51Z) chỉ đóng đợt 185, không spawn luồng 186 nào (parent kiểm trực tiếp lúc ~15:00Z: 0 file round186 trên đĩa). Đợt 186 thực chạy ở lượt cron 00:35 +07 25/11 (= 17:35:51Z, run 187) — 9 luồng spawn lúc ~17:40Z; hạn cờ T7 ~20:00Z, hạn cứng ~20:35Z. T7 đóng cờ ~19:58Z (trong hạn cờ). Mọi số dưới đây đọc từ DB tươi (`scheduler.job_runs` + `scheduler.events`, truy vấn theo đúng `scheduled_for_utc`) và kiểm trực tiếp trên máy sống (boot_id, btime, uptime). Script tính toán: `hidden_files/round186-t7/appendix186.py` → `appendix186.txt`. KHÔNG PUSH.

## §1. Run 185 SUCCEEDED 14:31:59Z — margin +232 s, CA ≥60 s MỚI (thứ 17)

- **Run 185 (3d57c217) SUCCEEDED 14:31:59Z** (finished 1795530719; status `succeeded`, timed_out false, attempt 1). Hạn started-gốc = hạn sched = 14:35:51Z (jitter 0) → **margin +232 s**. Wall từ sched: 10.568 s = 2h56m08s.
- **claimed→finished = 94 s** (claimed cuối 1795530625 = 14:30:25Z). **94 s ≥ 60 s → CA ≥60 s MỚI — ca thứ 17 toàn lịch sử, thứ 15 trong cửa sổ** (xem §3). T2-186 đã flag trước (".done": "claimed→finished 94 s — FLAG ca CA ≥60 s có thể mới"); T0-186 đối chiếu độc lập: "claimed→finished 94 s / 128 s — 2 ỨNG VIÊN CA ≥60 s mới" — KHỚP T7.
- **Viết lại ×1 tại #105** (requeue eid 10756, 13:14:06.931Z = btime #105 +34,931 s — KHỚP T7-185 từng số; T0-186 xác nhận: gap #104→#105 = 7.190 s, requeue = btime +34,931 s). 5 event: dispatched, requeued, dispatched, reattached, succeeded. Wall từ lần viết lại cuối: 4.672 s (1h17m52s).

## §2. Run 186 SUCCEEDED 14:52:42Z — margin +9.789 s, CA ≥60 s MỚI (thứ 18)

- **Run 186 (08d940ea) SUCCEEDED 14:52:42Z** (finished 1795531962; status `succeeded`, timed_out false, attempt 1). Hạn started-gốc = hạn sched = 17:35:51Z (jitter 0) → **margin +9.789 s = 2h43m09s**. Wall từ sched: chỉ 1.011 s = 16m51s.
- **claimed→finished = 128 s** (claimed cuối 1795531834 = 14:50:34Z). **128 s ≥ 60 s → CA ≥60 s MỚI — ca thứ 18 toàn lịch sử, thứ 15 trong cửa sổ** (xem §3). T0-186 đã đối chiếu độc lập (94/128 s) — KHỚP T7.
- **KHÔNG viết lại** (0 event requeue; 2 event: dispatched, succeeded). Run 186 chỉ chạy 16m51s vì phiên cron 21:35 +07 kết thúc sau khi đóng đợt 185, không spawn luồng 186 nào — đợt 186 thực chạy ở phiên 00:35 +07 (run 187). Đây KHÔNG phải timeout, KHÔNG phải lỗi run — là hệ quả của việc mở muộn (ghi nhận cho parent/T10, không phán verdict về đợt).
- **Run 182 + 183 + 184 + 185 + 186 SUCCEEDED liên tiếp — 5 lượt, KHÔNG có timeout mới** (sau 2 timeout 180/181). Chuỗi jitter: 0 (183) → 0 (184) → 0 (185) → 0 (186) → 0 (187, xem §7).

## §3. Họ CA ≥60 s đếm lại toàn bộ từ DB tươi: 18 ca toàn lịch sử, 15 ca trong cửa sổ

- Truy vấn trực tiếp `job_runs` (job `vcut-build-loop`, `finished − claimed ≥ 60`): **18 dòng**. 16 ca cũ **KHỚP HỆT list T7-185 từng số** (244/141/95/123/66/66/64/108/110/82/109/88/86/163/110/85) + 2 ca mới: run 185 cf **94 s**, run 186 cf **128 s**.
- **Số ca: 16 → 18 toàn lịch sử; 13 → 15 trong cửa sổ** (từ run 154, sched ≥ 1795196151). Trong họ: 16 succeeded + 2 timeout (86/163 s = run 180/181); run 185 = succeeded thứ 15, run 186 = succeeded thứ 16 trong họ.
- Đính chính kỳ vọng trong brief T7-186: brief giao "số ca 16 toàn lịch sử / 13 trong cửa sổ" (số đợt 185) — số ĐÚNG sau đợt này là **18 / 15** (2 ca mới đều SUCCEEDED, không phải timeout).

## §4. OUTAGE scheduler LẶP LẠI 8.406 s (F-186-T7-1 mới) — giống hệt OUTAGE 179, lần này NẰM TRONG cửa đợt

- **Im lặng hoàn toàn 15:15:34Z–17:35:40Z = 8.406 s = 2h20m06s, 0 execution mọi job** (truy vấn trực tiếp: 0 dòng có `started_at` trong (15:15:34Z, 17:35:40Z)). Run cuối trước khoảng im: HB 15:20:50Z started 15:15:34Z. Hồi phục: event `reconciled` 17:35:40.687Z (jobs=28, changed=4, new_runs=2) → dispatch feed-pulse-23 + HB 17:20:50Z lúc 17:35:40Z; `reconciled` tiếp 17:35:51Z → dispatch vcut run 187. 0 event scheduler nào 16:40–17:35Z.
- **Thiếu: HB 15:50:50Z + 16:20:50Z + 16:50:50Z (3 — không có row) + DR 16:00Z + 17:00Z (2 — không có row).** DR chạy mỗi giờ, jitter 0, 13 run liền trước đều đủ — 2 slot này là lỗ duy nhất.
- **Muộn: HB 17:20:50Z +890 s** (started 17:35:40Z — muộn HB mới, **10 → 11**); **feed-pulse-23 (sched 16:41:54Z) +3.226 s** (started 17:35:40Z).
- **Đối chiếu OUTAGE 179 (23/11, T7-179 — §2.5 LIMITS T7-179): im 15:15:35Z–17:35:39Z (8.406 s); 3 HB + 2 DR thiếu; HB 17:20:50Z +890 s; feed-pulse-23 (sched 16:41:54Z) +3.226 s; hồi phục 17:35:40Z; #94 (17:17:09Z) trong khoảng im.** Lần này lặp lại **gần như tuyệt đối (lệch 1 s ở hai đầu mốc)**; chỉ khác: reboot trong khoảng im là #107 (17:19:50Z) thay vì #94, và lần này outage **NẰM TRONG cửa đợt 186** (đợt 179 thì outage nằm NGOÀI cửa, ở khoảng trống giữa hai đợt).
- **Kiểm 22/11 (cùng khung 15:20:50–18:20:50Z): HB 7/7 toàn −316 s, DR 16:00Z + 17:00Z đều có — KHÔNG có stall.** Vậy stall lặp lại **2 ngày liên tiếp (23/11 + 24/11)**, không phải 3 ngày trở lên. Nguyên nhân VẪN chưa xác định (host-side, nghi ngờ — xem F-186-T7-1). T7 KHÔNG tự kết luận đây là OUTAGE #2 hay "cùng một outage kéo dài" — parent/doctor quyết (xem §9).
- **#107 (btime 17:19:50Z) nằm TRONG khoảng im (60 s trước slot HB 17:20:50Z), nhưng im lặng bắt đầu từ 15:15:34Z — TRƯỚC #107 gần 2h; #107 KHÔNG phải nguyên nhân khởi đầu.** Cùng kết luận với OUTAGE 179 (#94 cũng nằm trong khoảng im, không phải nguyên nhân).

## §5. Cửa slot đợt 186 KHÔNG LÀNH — chuỗi cửa lành 11 lần DỪNG (parent quyết)

- **HB 9/12 có (3 thiếu, 1 muộn):** nợ 14:20:50Z ✓ −316 s + trong cửa 14:50:50 ✓, 15:20:50 ✓, **[15:50:50 THIẾU]**, **[16:20:50 THIẾU]**, **[16:50:50 THIẾU]**, 17:20:50 **+890 s muộn**, 17:50:50 ✓, 18:20:50 ✓, 18:50:50 ✓, 19:20:50 ✓, 19:50:50 ✓ (7 slot cuối toàn −316 s, succeeded).
- **DR 3/5 có (2 thiếu):** 15:00 ✓ 0 s, **[16:00 THIẾU]**, **[17:00 THIẾU]**, 18:00 ✓ 0 s, 19:00 ✓ 0 s. (DR 14:00Z đã tính ở đợt 185 — không đếm lại; DR 20:00Z sau giờ đóng, thuộc T7-187.)
- **Lũy kế: HB 47/507 → 50/519** (12 slot mới, thiếu +3); **DR 53/326 → 55/331** (5 slot mới, thiếu +2); **muộn HB 10 → 11** (muộn mới +1: HB 17:20:50Z +890 s).
- **Cửa slot đợt 186 KHÔNG LÀNH** (3 HB + 2 DR thiếu, 1 HB muộn — tất cả do outage §4). **Chuỗi cửa lành 11 lần (đợt 175–185) DỪNG Ở 11** nếu parent tính tiếp — parent quyết ở §12.3 aggregate 186. Đây là lần đầu cửa trong đợt không lành kể từ đợt 178 (đợt 179 lành trong cửa dù outage nằm ngoài cửa).

## §6. Reboot #106 / #107 / #108 — (m) thô + F-186-T7-2

- **#107: boot `cea79500-c3bc-4a95-ae6e-28ebdd36e06d`, btime 1795540790 = 17:19:50Z — T0-186 XÁC NHẬN 9 nguồn TƯƠI** (uptime bracket btime −0,47 s; /proc/1 +15,344 s; journal/wtmp +15 s; Cloudflare +2 s — T7 đối chiếu độc lập bằng /proc/stat + uptime lúc 17:41Z, KHỚP). **(m) #107 thô: 0 requeue trong cửa hẹp** (0 event `requeued_after_restart` nào từ 14:35:51Z tới 19:09:52Z). Marker sống qua 59 reboot #49–#107 (T0-186; T8-186 kiểm trực tiếp mtime không đổi). libevent-2.1.so.7 VẮNG lúc 17:41Z → CÓ lúc 17:50Z sau replay (T0-186: "libevent heal lần 2") — T8 theo dõi.
- **#106: CHƯA XÁC MINH (F-186-T0-1)** — không có btime đo được; khung cứng (14:52:42Z, 17:19:50Z); ước tính mẫu ~15:13:32Z (KHÔNG khẳng định). **(m) #106 thô: 0 requeue trong cửa hẹp** (cùng cơ sở: 0 event requeue từ 14:35:51Z). Số hiệu + btime chính xác chờ T0-187 (journal chỉ liệt kê #107 — cùng hạn chế F-183-T0-1 như #103). Lưu ý: #106 nằm TRONG khoảng im lặng outage (15:15:34Z–17:35:40Z) theo ước tính ~15:13:32Z — nếu btime thật ~15:13:32Z thì #106 xảy ra 2 s TRƯỚC khi im lặng bắt đầu (15:15:34Z); T7 không khẳng định quan hệ nhân quả — T0-187/T2-187 xem xét.
- **#108 MỚI giữa phiên: boot `7ea9d047-963a-4dec-a864-643cf2f01c47`, btime 1795547392 = 19:09:52Z** (uptime -s 19:09:52Z, uptime 56,27 s lúc 19:10:49Z, KHỚP; uptime 2.774,84 s lúc đóng 19:56:07Z, KHỚP). Gap #107→#108 = **6.602 s = 1h50m02s** (T8-186 tính độc lập — KHỚP T7). **(m) #108 thô: requeue run 187 (eid 10818) 19:10:31.438Z = btime +39,438 s — TRỞ LẠI mẫu btime + ~35–40 s** (#102 +40,341; #103 +37,543; #105 +34,931; #108 +39,438). Số hiệu chờ T0-187; phân loại cuối thuộc T2-187.
- **F-186-T7-2 (mới — ghi nhận, KHÔNG phải lỗi T7): sleep chờ cửa của T7-186 bị SIGTERM theo #108.** Sleep spawn ~17:58Z, chết sau ~4.298 s (đúng lúc #108, btime 19:09:52Z) — cùng mẫu F-185-T7-1 (sleep SIGTERM theo #105) và F-184-T7-1. T7 dậy đọc DB ngay, ghi nhận #108 + (m) #108 thô, rồi ngủ tiếp sleep thứ hai (19:11Z → 19:56Z, xong sạch) và đóng cờ đúng hạn. Bài học đứng: sleep chờ dài luôn có thể chết theo reboot giữa phiên — dậy sớm thì đọc DB ngay, ghi nhận reboot, rồi ngủ tiếp.
- Đối chiếu (m) #104/#105 (phân loại cuối thuộc T2-186 theo quyết (p) đợt 185): T2-186 đã phân loại **(m) #104 KHÔNG CÓ ĐIỂM** (0 requeue cửa hẹp + cửa rộng tới btime #105) và **(m) #105 DƯƠNG (+34,931 s, TRONG [33; 49,8], SÁT biên dưới 1,931 s; overlap +24 s không lật)**; **INSIDE #104 TRUE (FULL150, chuỗi 5 → 6) + INSIDE #105 TRUE (FULL151, chuỗi 6 → 7)** — T7 chỉ đối chiếu số thô (+34,931 s KHỚP T7-185; 0 requeue #104 KHỚP T0-185), không phán thay T2/parent.

## §7. Run 187 lúc đóng: vẫn RUNNING — viết lại ×1 tại #108, jitter 0

- **Run 187 (887c998d) vẫn RUNNING lúc đóng 19:56:07Z** (sched = started-gốc = 17:35:51Z, **jitter 0**; claimed 1795541752 KHÔNG đổi; attempt 1; phase execute; boot_gen `cron_boot_7a69fe82…` sau #108). **Viết lại ×1 tại #108** (started → 19:10:31Z; 4 event: dispatched, requeued, dispatched, reattached). Tuổi gốc lúc đóng: 8.416 s = 2h20m16s; còn 2.384 s (~39m44s) tới hạn 20:35:51Z. **Kết cục thuộc T7-187.**
- Boot lúc đóng vẫn #108 (7ea9d047), btime 1795547392 — **KHÔNG có #109.**

## §8. Daemon restart không kèm reboot (e) — KHÔNG có sự kiện tương tự F-185-T0-1

- **0 event `requeued_after_restart` từ 14:35:51Z tới 19:09:52Z.** Requeue duy nhất trong cửa (19:10:31Z) GẮN VỚI #108 (btime +39,438 s — hợp lệ, xem §6), không phải restart độc lập.
- Hồi phục sau stall lúc 17:35:40Z là event `reconciled` (không phải daemon restart có requeue — không có run nào đang chạy để viết lại: run 186 xong 14:52:42Z, run 187 mới bắt đầu 17:35:51Z). T7 không có bằng chứng daemon restart nào trong cửa đợt 186; T0-187 có thể bổ sung từ journal nếu có.

## §9. F- mới + đính chính chéo

- **F-186-T7-1 (mới — PHÁT HIỆN LỚN): OUTAGE scheduler 8.406 s LẶP LẠI y hệt sau 1 ngày.** Mọi số đo được đều trùng với OUTAGE 179 (23/11) tới từng giây: im lặng 15:15:34Z–17:35:40Z (8.406 s); 3 HB + 2 DR thiếu; HB 17:20:50Z +890 s; feed-pulse-23 (sched 16:41:54Z) +3.226 s; hồi phục 17:35:40Z; có reboot trong khoảng im (#107). Kiểm 22/11 cùng khung: SẠCH (HB 7/7, DR 2/2) → stall lặp 2 ngày liên tiếp, chưa rõ có phải chu kỳ cố định theo giờ không. T7 đề xuất parent/doctor: (1) có tính đây là OUTAGE #2 không (lần này nằm TRONG cửa đợt, khác đợt 179 nằm ngoài cửa); (2) có mở điều tra nguyên nhân host-side theo hướng "cố định theo giờ" không (2 ngày liên tiếp cùng khung giờ là bằng chứng mới — OUTAGE 179 chưa có); (3) muộn HB 10 → 11 + lũy kế HB 50/519, DR 55/331 có chấp nhận không. T7 KHÔNG tự phán verdict thay parent.
- **F-186-T7-2 (mới — ghi nhận): sleep SIGTERM theo #108** (xem §6).
- **F-186-T7-3 (mới — T7 tự bắt, ĐÃ SỬA trước khi đóng): bản nháp PHẦN 1 của appendix ghi sai epoch HB** (13:20:50Z/13:50:50Z là slot đợt 185, không phải nợ đợt 186) **và stall 3.006 s** (do cộng nhầm +1h khi tính epoch bằng tay). Đã sửa trước khi đóng bằng cách truy vấn lại DB theo đúng `scheduled_for_utc` từng slot + đối chiếu chéo với LIMITS T7-179 (OUTAGE 179) và LIMITS T7-185; mọi số trong file này đã kiểm 2 lần (truy vấn SQL trực tiếp + appendix tính từ epoch thô). File nháp sai đã xóa khỏi `round186-t7/` (chỉ giữ `appendix186.py` + `appendix186.txt` đúng). Bài học cho các T7 sau: luôn truy vấn theo sched epoch chính xác, không cộng nhầm +1800 s bằng tay — cùng họ lỗi với F-185-T1-2 (sắp lexicographic) và F-173-T1-3.
- **Đính chính chéo với các luồng khác (đọc .done trước khi đóng):** T0-186 KHỚP T7 từng số (run 185 +232 s, run 186, cf 94/128 s, gap outage 8.406 s, #105 xác nhận +34,931 s); T2-186 KHỚP (m) #105 + INSIDE #104/#105; T1-186 verify đợt 185 PASS (đếm khớp lần thứ 97); T5-186: POSTBOOT_PASS #105 KHÔNG CÓ (tổng boot không cờ 23 → 24 nếu parent chấp nhận), #107 CÓ 17:48:46Z (repair, poll=1, caveat); T6-186: (A) 120/120 lần 36, #105/#107 KHÔNG GIẾT HOLDER (chuỗi 10/11), prune 61; T4-186: lượt yên #55 KHÔNG CÓ LƯỢT HỢP LỆ (chuỗi 47 → 0 ĐỨT); T8-186: harness 6/6 trên #107, B2 ĐÃ MỞ, FULL PASS đề xuất 1 → 0 (ĐỨT, thiếu chân lượt yên). **T9-186 CHƯA đóng cờ lúc T7 đóng (~19:58Z)** — T10 xử lý theo quy tắc gộp muộn nếu có.

## §10. Hạn chế + nguồn

- Mọi số run/slot/event đọc từ DB tươi lúc 17:41–17:58Z, 19:10–19:11Z và 19:56–19:58Z; boot/btime/uptime kiểm trực tiếp trên máy sống. T7 KHÔNG tự phân loại (m) cuối, KHÔNG tự chứng nhận số hiệu reboot, KHÔNG phán thay parent về chuỗi cửa lành / chuỗi 9/9 / OUTAGE #2 — parent quyết ở §12.3 aggregate 186.
- T7 KHÔNG chạy script nặng, KHÔNG probe dpkg trong cửa sổ attempt của T4 (toàn bộ phiên chỉ đọc DB + lệnh nhẹ `date`/`cat`/`uptime`/`ps` + 2 sleep chờ cửa).
- Kích thước file này: xem `stat` lúc stage (mục tiêu < 37.768 B). KHÔNG PUSH.
