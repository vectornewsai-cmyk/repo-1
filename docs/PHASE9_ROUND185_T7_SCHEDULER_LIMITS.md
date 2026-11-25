# PHASE9 ROUND185 T7 — Scheduler LIMITS

Đợt 185 mở lượt cron 18:35 +07 24/11/2026 (= 11:35:51Z), hạn cờ ~14:00Z, hạn cứng ~14:35Z. T7 đóng cờ ~14:05Z (trễ ~5' so với hạn cờ, trong hạn cứng). Mọi số dưới đây đọc từ DB tươi (`scheduler.job_runs` + `scheduler.events`) và kiểm trực tiếp trên máy sống (boot_id, btime, uptime). Script tính toán: `hidden_files/round185-t7/appendix185.py` → `appendix185.txt`. KHÔNG PUSH.

## §1. Run 184 SUCCEEDED 11:16:07Z — margin +1.184 s, KHÔNG phải ca CA ≥60 s mới

- **Run 184 (b8fc08e4) SUCCEEDED 11:16:07Z** (finished 1795518967; status `succeeded`, timed_out false, attempt 1). Hạn started-gốc = hạn sched = 11:35:51Z (jitter 0) → **margin +1.184 s**. Wall từ sched: 9.616 s = 2h40m16s.
- **claimed→finished = 48 s** (claimed cuối 1795518919 = 11:15:19Z — T7-184 đọc 11:00:29Z vẫn là 1795509351 không đổi; claimed đổi lúc cuối, cùng mẫu run 183). **48 s < 60 s → KHÔNG phải ca CA ≥60 s mới.**
- **Họ CA ≥60 s đếm lại toàn bộ từ DB tươi: 16 ca toàn lịch sử, 13 ca trong cửa sổ từ run 154 (sched ≥ 1795196151) — KHỚP HỆT list T7-184 từng số** (244/141/95/123/66/66/64/108/110/82/109/88/86/163/110/85). **Số ca GIỮ 13 trong cửa sổ, 16 toàn lịch sử — KHÔNG có ca thứ mười bốn.** Run 183 vẫn là ca succeeded thứ 14 trong họ (chỉ 180/181 là timeout).
- **Run 182 + 183 + 184 SUCCEEDED liên tiếp — 3 lượt liên tiếp, KHÔNG có timeout mới.** Chuỗi jitter: 0 (183) → 0 (184) → 0 (185, xem §4).
- **Viết lại ×2, 8 event:** dispatched 08:35:51Z → requeued 09:15:32Z (#103) → dispatched → reattached → **requeued 11:11:06Z (lần 2, xem §2)** → dispatched → reattached → succeeded 11:16:07Z. Wall từ lần viết lại cuối: chỉ 301 s (5m01s).

## §2. Reboot #104 — (m) #104 thô: 0 requeue trong cửa hẹp (T0-185 đã xác minh 9 nguồn)

- **#104: boot `9161bfd1-861f-4f9f-90ed-eee0387081de`, btime 1795518822 = 11:13:42Z — T0-185 XÁC NHẬN 9 nguồn tươi** (gap #103→#104 = **7.127 s = 1h58m47s**; uptime T7 kiểm 1.701,87 s lúc 11:42:04Z KHỚP btime). #104 KHÔNG GIẾT HOLDER (T0-185: lock trống 1.910 s — T6-185 phán cuối).
- **(m) #104 (số thô): 0 requeue trong cửa hẹp.** Requeue lần 2 của run 184 (eid 10724) lúc **11:11:06.655Z = btime − 155,345 s** — TRƯỚC btime, không phải requeue của #104. **ĐÍNH CHÍNH ước ban đầu của T7:** T7 lúc 11:42Z ước btime thật #104 ≈ 11:10:26–11:10:32Z (đồng hồ ghi nhanh ~190–196 s) theo mẫu requeue = btime+35..40 s — **ƯỚC NÀY SAI. T0-185 xác minh 9 nguồn tươi: btime 11:13:42Z ĐÚNG, và lần khởi động daemon 11:11:06Z là KHỞI ĐỘNG LẠI DAEMON KHÔNG KÈM REBOOT (F-185-T0-1)** — daemon restart độc lập, không liên quan #104. T7 rút lại ước đồng-hồ-nhanh; (m) #104 = 0 requeue trong cửa hẹp là hiện tượng mới (F-185-T0-2). Phạm vi phân loại cuối: T0 ghi thuộc T2-185, mẫu đứng nói thuộc T2-186 — parent quyết (T2-185 không phân loại cuối, chờ parent).
- Đối chiếu (m) #103 (số thô — T2-185 đã phân loại CUỐI: DƯƠNG): requeue eid 10697 lúc 09:15:32.543Z = btime #103 **+37,543 s** — TRONG dải [33; 49,8], cách biên dưới 4,543 s, cách biên trên 12,257 s; KHỚP từng số với T7-184 và T2-185. Đúng 1 requeue trong cửa hẹp #103; spanning = đúng 1 run (run 184). **Overlap +9 s** (watcher-184 poll cuối 09:15:04Z trên boot cũ — mẫu 17) KHÔNG lật verdict theo tiền lệ #87/#90. **Đính chính F-185-T2-1: T7-184 viết "(m) #103 KHÔNG có overlap" là SAI** — overlap +9 s có thật (T2-185 phát hiện); số offset +37,543 s thì đúng.
- Run 184 kết thúc 11:16:07Z — SAU btime #104 (11:13:42Z) — mà KHÔNG bị requeue thêm lần nào: phù hợp với việc worker chạy ngoài cell và daemon restart 11:11:06Z không kèm reboot (F-185-T0-1); #104 không giết worker đang chạy.
- Bối cảnh thêm (T0-185, đã đóng ~11:49Z, trước khi T7 đóng): O8 trên #104 PASS 3/3 (WebKit 21/21 ×2 + Chromium 21/21; libevent ĐÃ HEAL — launch-fail #103 hết); POSTBOOT_PASS #104 ĐÃ CÓ 11:42:15Z (replay-đầy-đủ, poll=0); **#103 CHƯA CÓ cờ** (tổng boot không cờ có thể 22 → 23 — parent quyết); F-184-T2-11 ĐÃ TRẢ LỜI: KHÔNG nhảy lùi (đồng hồ nhanh trước #103, delta > 9 s).

## §3. Reboot #105 mới giữa phiên — (m) #105 thô +34,931 s, TRỞ LẠI mẫu

- **#105: boot `053a35c3-5b54-4bcf-adf9-7d2eda54d26d`, btime 1795526012 = 13:13:32Z** (uptime 45,80 s lúc 13:14:17Z → boot ~13:13:31Z, KHỚP; uptime 2.940,22 s lúc đóng → boot ~13:13:32Z, KHỚP). Gap #104→#105 (btime ghi) = **7.190 s = 1h59m50s**.
- **(m) #105 (số thô — T2-185/T2-186 phân loại cuối):** requeue run 185 (eid 10756) lúc 13:14:06.931Z = btime #105 **+34,931 s — TRỞ LẠI mẫu btime + ~35–40 s** (#102 +40,341; #103 +37,543; #105 +34,931). Số hiệu #105 chờ T0-186 xác minh 9 nguồn (T7 chỉ ghi nhận boot + btime + đối chiếu thô).
- #105 giết sleep chờ cửa của T7-185 — xem F-185-T7-1 (§6).

## §4. Run 185 lúc đóng: vẫn RUNNING — viết lại ×1 tại #105, jitter 0

- **Run 185 (3d57c217) vẫn RUNNING lúc đóng 14:02:32Z** (started_gốc = sched = 11:35:51Z, **jitter 0**; claimed 1795520151 KHÔNG đổi; attempt 1; phase execute; boot_gen `cron_boot_a5f49c21…` sau #105). **Viết lại ×1 tại #105** (started → 13:14:07Z; 4 event: dispatched, requeued, dispatched, reattached). Tuổi gốc lúc đóng: 8.801 s = 2h26m41s; còn 1.999 s (~33m19s) tới hạn 14:35:51Z. **Kết cục thuộc T7-186.**
- Boot lúc đóng vẫn #105 (053a35c3), btime 1795526012 — **KHÔNG có #106.**

## §5. Cửa slot đợt 185 LÀNH — lần thứ mười một liên tiếp (nếu parent tính tiếp)

- **HB 6/6: 11:20:50Z (nợ — T7-184 đóng 11:05Z trước slot này) + 11:50:50Z + 12:20:50Z + 12:50:50Z + 13:20:50Z + 13:50:50Z — TẤT CẢ −316 s, succeeded.** 0 thiếu, 0 muộn.
- **DR 3/3: 12:00Z + 13:00Z + 14:00Z — TẤT CẢ 0 s, succeeded.** 0 thiếu, 0 muộn.
- **Lũy kế: HB 47/501 → 47/507 (6 slot mới; thiếu +0); DR 53/323 → 53/326 (3 slot mới; thiếu +0); muộn HB GIỮ 10 (muộn mới +0).**
- **KHÔNG có outage mới.** 6 job có run trong cửa 11:35:51Z–14:02:32Z (vcut-build-loop, heartbeat, deterministic-doctor, feed-pulse-18/19/20), tất cả succeeded trừ vcut-build-loop đang running. HB 17:20:50Z muộn +890 s (nợ OUTAGE 179): không có theo dõi mới — số muộn GIỮ 10.
- Tự đính chính phương pháp: một truy vấn HB lúc 13:14Z trả 0 dòng do T7 tính sai epoch (−1.000 s) — KHÔNG phải slot thiếu; đã truy vấn lại đúng epoch, cả 3 slot đều có (−316 s). Ghi lại để T7 sau không lặp lỗi tính epoch.

## §6. F-184-T7-1 + F-185-T7-1 (mới)

- **F-184-T7-1 (sleep #3 bị SIGTERM theo #103): ĐÃ XỬ LÝ — parent chấp nhận/ghi nhận ở §12.3 (k) đợt 184.** Không còn dấu vết cần xử lý thêm; T7-185 không tìm thấy sleep sót nào của T7-184 (các sleep đang chạy lúc 11:41Z đều spawn sau #104).
- **F-185-T7-1 (mới — ghi nhận, KHÔNG phải lỗi T7): sleep chờ cửa của T7-185 bị SIGTERM theo #105.** Sleep spawn 11:42:33Z, chết ~13:13:51Z sau ~5.478 s (đúng lúc #105, btime 13:13:32Z) — cùng mẫu F-184-T7-1 (sleep #3 SIGTERM theo #103) và F-183-T7-1 (sleep #6 SIGTERM theo #102). T7-185 khởi động lại sleep thứ hai (13:16Z → 14:02Z, xong sạch) và đóng cờ đúng hạn. Bài học đứng: sleep chờ dài luôn có thể chết theo reboot giữa phiên — dậy sớm thì đọc DB ngay, ghi nhận reboot, rồi ngủ tiếp.

## §7. Quan sát ngoài phạm vi slot (ghi nhận, không phán verdict)

- **feed-pulse-18 chạy trùng 2 run cách nhau 1 s** (sched 11:41:54Z + 11:41:55Z, cả hai succeeded, attempt 1) — ngoài phạm vi slot T7 (HB/DR/vcut). Ghi nhận cho parent/doctor; không phải outage (0 run thiếu, cả hai run đều xong).

## §8. Hạn chế + nguồn

- Mọi số run/slot/event đọc từ DB tươi lúc 11:40–11:42Z, 13:14–13:16Z và 14:02:32Z; boot/btime/uptime kiểm trực tiếp trên máy sống. T7 KHÔNG tự phân loại (m) cuối, KHÔNG tự chứng nhận số hiệu reboot, KHÔNG phán thay parent về chuỗi cửa lành / chuỗi 9/9 — parent quyết ở §12.3 aggregate 185.
- T7 KHÔNG chạy script nặng, KHÔNG probe dpkg trong cửa sổ attempt của T4 (toàn bộ phiên chỉ đọc DB + lệnh nhẹ `date`/`cat`/`uptime`/`ps`).
- Kích thước file này: xem `stat` lúc stage (mục tiêu < 37.768 B). KHÔNG PUSH.
