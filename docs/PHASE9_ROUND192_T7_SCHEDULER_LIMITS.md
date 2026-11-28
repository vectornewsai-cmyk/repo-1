# PHASE9 ROUND192 T7 — Scheduler LIMITS

Đợt 192 MỞ ở lượt cron 21:35 +07 25/11/2026 (= 14:35:51Z). T7 đóng cờ ~16:52Z 25/11 (trong hạn cờ ~17:00Z, hạn cứng ~17:35Z). Mọi số dưới đây đọc từ DB tươi (`scheduler.job_runs` + `scheduler.events`, truy vấn theo đúng `scheduled_for_utc`) và kiểm trực tiếp trên máy sống (boot_id, btime, uptime). Mọi epoch đã kiểm lại bằng `date -d @<epoch> -u` trước khi dùng. Script tính toán: `hidden_files/round192-t7/appendix192.py` → `appendix192.txt` (số học đã kiểm lại bằng assert + kiểm chéo độc lập). KHÔNG PUSH.

## §1. Run 192 (d3d9408b) FAILED 10:56:00Z — CA ≥60 s MỚI, BÁO CÁO BÙ

- **Run d3d9408b FAILED 10:56:00Z** (finished 1795604160; status `failed`, timed_out false, attempt 1). Sched 1795595751 (08:35:51Z = 15:35:51 +07) → hạn 11:35:51Z → **margin +2.391 s = xong TRƯỚC hạn 39m51s — KHÔNG phải timeout**. Wall từ sched: 8.409 s = 2h20m09s.
- **Start đúng giờ, jitter 0** (started = sched = 1795595751).
- **claimed→finished = 103 s** (claimed 1795604057 = 10:54:17Z) — **103 s ≥ 60 s → CA ≥60 s MỚI — ca thứ 23 toàn lịch sử, thứ 20 trong cửa sổ** (xem §3). Ca failed thứ 2 trong họ (sau run 187, cf 202 s).
- **Viết lại ×0, 2 event:** dispatched 08:35:51.058Z eid 10998 + failed 10:56:00.065Z eid 11029 — KHÔNG requeue, KHÔNG reattached. Boot_gen `cron_boot_cdd48e77…` (boot b0aab705, #114).
- **Lý do FAILED (error_text + result_summary): worker báo cáo công việc chưa xong.** Lúc 10:56Z, T10-191 CHƯA đóng sổ (aggregate + file paths closing + quyết parent §14.2-191 còn trống; 4 lỗi tsc của P1 chưa sửa) — lượt cron của run 192 kết thúc ở đó với báo cáo "chưa hoàn tất". Việc đóng sổ sau đó hoàn thành trong lượt run 193 (xem §2): **FAILED này là FAILED về tiến độ lượt, không phải lỗi hạ tầng** — run xong trước hạn 39m51s, 0 requeue, 0 timeout. T7 KHÔNG tự phán lại verdict lượt 191 (parent đã CHẤP NHẬN đợt 191 ở §14.2(a)-191); chỉ ghi kết cục run đúng như DB.
- **Kết cục này CHƯA TỪNG ĐƯỢC BÁO CÁO:** T7-191 đóng lúc ~10:48Z khi run này vẫn RUNNING và giao kết cục cho T7-192 — T7-192 báo cáo ở đây (như eb18559f ở đợt 191).

## §2. Run 193 = 82d3d1b9 (sched 18:35:51 +07 — lượt đóng đợt 191) SUCCEEDED 11:43:03Z

- **Run 82d3d1b9 SUCCEEDED 11:43:03Z** (finished 1795606983; status `succeeded`, timed_out false, attempt 1). Sched 1795606551 (11:35:51Z = 18:35:51 +07) → hạn 14:35:51Z → **margin +10.368 s = xong TRƯỚC hạn 2h52m48s**. Wall từ sched: 432 s = 7m12s.
- **Start đúng giờ, jitter 0** (started = sched).
- **claimed→finished = 5 s** (claimed 1795606978 = 11:42:58Z) — **5 s < 60 s → KHÔNG phải CA mới**.
- **Viết lại ×0, 2 event:** dispatched 11:35:51.113Z eid 11037 + succeeded 11:43:03.785Z eid 11043 — KHÔNG requeue, KHÔNG reattached. Boot_gen `cron_boot_cdd48e77…` — CÙNG boot b0aab705 (#114) như run 192.
- **result_summary = báo cáo đóng sổ đợt 191** (11/11 cờ có nội dung, T10 đóng đúng hạn cứng ~11:35Z, đếm cuối 12/45/42/31, chuỗi khớp lần thứ 114, FULL PASS đề xuất 1 → 2, P4 harness 31/33). Đây là lượt cron mà parent viết quyết §14.2-191 (~11:47Z).
- **Chuỗi SUCCEEDED: … → 814be71a SUCCEEDED (lần 3) → run 192 FAILED (ĐỨT, 3 → 0) → run 193 SUCCEEDED (khởi động lại lần 1).** Run hiện tại đang chạy (xem §6).

## §3. Họ CA ≥60 s đếm lại từ DB tươi: 23 ca toàn lịch sử, 20 ca trong cửa sổ

- Truy vấn trực tiếp `job_runs` (job `vcut-build-loop`, `finished − claimed ≥ 60`, giá trị claimed CUỐI CÙNG — định nghĩa thống nhất F-173-T7-2): **DB tươi có 21 dòng** — 95/123/66/66/64/108/110/82/109/88/86/163/110/85/94/128/202/146/158/63/**103** (run 192 mới).
- **So với list T7-191 (21 dòng): KHỚP 20/20 — TRỪ (1795001751, 141) = run 138 + THÊM (1795595751, 103) = run 192.** Run 138 rụng khỏi DB lúc 11:35:51Z 25/11 đúng như T7-191 đã báo (earliest sched nay 1795012551; run 138 nay giữ từ hồ sơ như run 134). Run 134 (sched 1794958551, cf 244) VẪN VẮNG trong DB.
- **Số ca: 22 → 23 toàn lịch sử** (21 dòng DB + run 134 GIỮ TỪ HỒ SƠ + run 138 GIỮ TỪ HỒ SƠ — run 138 rụng đợt này, là ca thứ 2 mang theo từ hồ sơ); **19 → 20 trong cửa sổ** (từ run 154, sched ≥ 1795196151 — cả 20 ca đều còn trong DB tươi). Trong họ 23 ca: **18 succeeded + 3 timeout (86/163/146 = run 180/181/188) + 2 failed (202 = run 187; 103 = run 192).** Run 193 (cf 5 s) KHÔNG vào họ.
- **Giữ 7 ngày (F-189-T7-1) VẪN ĐÚNG:** COUNT vcut = 57 run; earliest sched 1795012551; latest sched 1795617351 (run hiện tại); 1795617351 − 1795012551 = **604.800 s = ĐÚNG 7 ngày**. Purge lăn tiếp tục đúng nhịp: mỗi lượt rụng đúng 1 sched cũ nhất (+10.800 s) khi sched mới nhất tiến lên.

## §4. F-192-T7-1 (mới — NHÃN "run 193" CỦA BRIEF SAI −1, lặp lại mẫu F-191-T7-1)

- **Brief T7-192 gọi lượt cron hiện tại (sched 21:35:51 +07) là "run 193"** và ghi đó là "SỐ ĐÚNG THEO QUYẾT PARENT §14.2-191". Kiểm lại §14.2(n)-191: parent chỉ quyết tới **d3d9408b = run 192** (chọn (a) cách đếm nối tiếp) — **KHÔNG quyết số hiệu lượt 21:35**.
- **Theo cách đếm nối tiếp đã quyết (a): 82d3d1b9 (sched 1795606551, 18:35:51 +07, lượt đóng đợt 191) = run 193; 8c0c386d (sched 1795617351, 21:35:51 +07, lượt hiện tại) = run 194.** Brief BỎ QUA lượt đóng 18:35 (lượt có result_summary là báo cáo đóng sổ đợt 191) nên lệch −1 — đúng mẫu lỗi của T01-191 (bỏ qua 814be71a) mà F-191-T7-1 đã ghi.
- **T7-192 KHÔNG tự đổi nhãn:** mọi kết cục trong file này ghi bằng run_id + sched + epoch (không mơ hồ); nhãn "run 193"/"run 194" trong ngoặc là nhãn theo cách đếm nối tiếp đã quyết. Parent quyết ở §14.2-192: xác nhận 82d3d1b9 = run 193 và lượt hiện tại = run 194, hay đổi cách đếm. Nội dung số (SUCCEEDED/FAILED, cf, margin) KHÔNG tranh chấp — chỉ nhãn số hiệu. Brief các đợt sau PHẢI đếm cả lượt đóng (lượt cron nào cũng là 1 run, kể cả lượt chỉ đóng sổ).

## §5. Hai boot mới trong ngày — ebc5a3b9 (14:23:56Z, ứng viên #115) + 4dda8234 (16:21:33Z, ứng viên #116, TRONG khung OUTAGE)

- **Boot ebc5a3b9, btime 1795616636 = 14:23:56Z (ứng viên #115 — T0-192 quyết số hiệu).** Gap #114 (b0aab705, btime 08:25:43Z) → boot này = **21.493 s = 5h58m13s**. Xác minh: /proc/stat btime 1795616636, `who -b` Nov 25 14:24, uptime 18 phút lúc 14:42:39Z — KHỚP. Boot xảy ra SAU khi run 193 xong (11:43:03Z), TRƯỚC khi lượt hiện tại mở (14:35:51Z, = btime + 715 s).
- **(m) boot ebc5a3b9: KHÔNG CÓ ĐIỂM (số thô).** 0 event `requeued_after_restart` — không run nào spanning (run 193 đã xong; run hiện tại dispatch SAU boot). T2-192 xác nhận cuối.
- **Boot 4dda8234, btime 1795623693 = 16:21:33Z (ứng viên #116 — T0-192 quyết số hiệu).** Gap từ boot trước = **7.057 s = 1h57m37s**. Xác minh: /proc/stat btime 1795623693, `who -b` Nov 25 16:21, uptime 0 phút lúc 16:22:27Z, boot_id `4dda8234-2f0f-4414-8a51-25ab2e7e5d6a` — KHỚP. **Boot này rơi TRONG khung OUTAGE 15:15:34–17:35:40Z** (xem §7). Sleep 2 của T7-192 chết theo reboot này (SIGTERM ~16:21:50Z, sau 2.281 s) — phiên đã hồi phục, 0 số liệu mất (mọi số đã đọc trước đó nằm trong DB, đọc lại sau reboot KHỚP).
- **(m) boot 4dda8234 (SỐ THÔ): requeue eid 11103 lúc 16:22:16.986Z → offset ≈ +43,99 s, TRONG [33; 49,8].** Biên phân số: btime nguyên giây 16:21:33Z → offset thật ∈ [42,987; 43,986] — VẪN TRONG cả hai biên (trên biên dưới 9,99 s; dưới biên trên 5,81 s) — sạch hơn hẳn #113 (biên dưới chỉ 0,15 s ở trường hợp xấu nhất). T2-192 phán CUỐI (phân loại DƯƠNG hay không).
- **Run hiện tại SPANNING reboot 16:21:33Z** (xem §6): requeue 16:22:16.986Z eid 11103 (daemon startup recovery) → dispatched 16:22:17.195Z eid 11104 → reattached 16:22:17.308Z eid 11105 ("execute turn already complete (model-output evidence)").
- **F-191-T7-2 — BẰNG CHỨNG MẠNH THÊM (boot_gen đổi theo boot, 2 lần trong ngày):** boot_gen run hiện tại lúc dispatch (trên boot ebc5a3b9) là `cron_boot_30d363b8…` — KHÁC `cdd48e77…` (boot b0aab705); sau reboot 16:21:33Z đổi thành `cron_boot_a080cf74…` (thế hệ thứ 3 trong ngày: cdd48e77 → 30d363b8 → a080cf74). Hai lần đổi đều khớp đúng thời điểm reboot — ủng hộ giả thuyết boot_gen gắn với boot, không phải daemon-generation. T0-192 kiểm lại (theo quyết (e)-191); nếu xác nhận, b0aab705 giữ #114, ebc5a3b9 = #115, 4dda8234 = #116.
- **Marker sống qua 66 reboot #49–#114 (đã quyết) + 2 boot ứng viên = 68 nếu cả hai được xác nhận** (mtime 2026-11-20 11:39:47Z không đổi, 239 B).

## §6. Run hiện tại lúc đóng: vẫn RUNNING — kết cục thuộc T7-193

- **Run 8c0c386d (sched 1795617351 = 14:35:51Z = 21:35:51 +07 — brief gọi "run 193", theo cách đếm nối tiếp là run 194, xem §4) vẫn RUNNING lúc đóng ~16:52Z** (sched = claimed = 1795617351, jitter 0; finished null; attempt 1; timed_out false). Hạn 17:35:51Z. **Tuổi lúc đóng ~2h12m (7.969 s); còn ~44 phút tới hạn. Kết cục thuộc T7-193.**
- **started_at VIẾT LẠI sau reboot:** 1795623737 = 16:22:17Z (lúc requeue/reattach, = btime 4dda8234 + 44 s); claimed_at GIỮ NGUYÊN 1795617351 — cùng mẫu eb18559f sau reboot #113 (started viết lại, claimed giữ). Boot_gen hiện tại `cron_boot_a080cf74…` (boot 4dda8234).
- Lúc mở: 1 event dispatched 14:35:51.287Z eid 11078 — KHÔNG viết lại lúc mở. 0 event `requeued_after_restart` nào cho boot ebc5a3b9 (xem §5).

## §7. Cửa slot đợt 192 LÀNH — HB 12/12, DR 6/6, 0 thiếu, 0 muộn

- **Cửa sổ đếm: sau khi T7-191 đóng (~10:48Z) tới khi T7-192 đóng (~16:52Z).** DR 11:00Z thuộc T7-192 theo chỉ định của T7-191; DR 17:00Z thuộc T7-193 (tại/sau giờ đóng — tiền lệ DR 05:00Z → T7-190, DR 11:00Z → T7-192).
- **HB 12/12 có, TẤT CẢ −316 s, succeeded:** 11:20:50Z (start 11:15:34Z), 11:50:50Z (11:45:34Z), 12:20:50Z (12:15:34Z), 12:50:50Z (12:45:34Z), 13:20:50Z (13:15:34Z), 13:50:50Z (13:45:34Z), 14:20:50Z (14:15:34Z), 14:50:50Z (14:45:34Z), 15:20:50Z (15:15:34Z), 15:50:50Z (15:45:34Z), 16:20:50Z (16:15:34Z), 16:50:50Z (16:45:34Z). 0 thiếu, 0 muộn.
- **DR 6/6 có, TẤT CẢ 0 s, succeeded:** 11:00Z, 12:00Z, 13:00Z, 14:00Z, 15:00Z, 16:00Z. 0 thiếu, 0 muộn. (DR = job `deterministic-doctor` — xác minh bằng truy vấn theo sched: đúng 1 row mỗi sched, started = finished = sched.)
- **Cửa slot đợt 192 LÀNH — chuỗi lành đề xuất 1 → 2** (quyết (n)-191 đặt chuỗi = 1 sau cửa 191; parent quyết). Lũy kế: **HB 50/549 → 50/561** (12 slot mới; thiếu +0; muộn +0); **DR 55/346 → 55/352** (6 slot mới; thiếu +0). Boot 4dda8234 (16:21:33Z) rơi GIỮA hai lần start HB (16:15:34Z và 16:45:34Z) — không mất slot nào; HB 16:50:50Z start 16:45:34Z sau reboot, hồi phục bình thường.

## §8. OUTAGE "cố định theo giờ" — BẰNG CHỨNG DAEMON CHO T7-193, CHƯA PHÁN ONSET (bàn giao T7-193)

- Parent quyết (n) §14.2-191: T7-188 kết luận mẫu "cố định theo giờ" **ĐƯỢC ỦNG HỘ MẠNH, CHƯA KHẲNG ĐỊNH TUYỆT ĐỐI** (stall 23/11 + 24/11 cùng khung 15:15:34Z–17:35:40Z tới từng giây, 8.406 s; 20–22/11 sạch); **giao T7-194 phán cuối, T7-193 kiểm onset khung 25/11**.
- **3 khoảng chết lặng sáng nay (mang theo từ T7-191 §6):** ~06:00–06:27Z, ~06:45–07:34Z, ~07:45–08:35Z (0 event; mỗi lần hồi phục bằng 1 event `reconciled` rồi dispatch slot trễ ngay sau đó; 2 slot DR mất hẳn, 3 slot HB trễ). Daemon chết lặng là hiện tượng CÓ THẬT ngoài khung OUTAGE.
- **Bằng chứng daemon trong khung OUTAGE 25/11 tới lúc đóng 16:52Z (cho T7-193 dùng — T7-192 CHƯA PHÁN ONSET):**
  - Daemon CÒN SỐNG, dispatch đúng lịch: `reconciled` 15:15:34Z eid 11088 (**đúng giây mở khung** — HB 15:20:50Z start đúng 15:15:34Z), 15:41:54Z eid 11091, 15:45:34Z eid 11094, 16:00:00Z eid 11097, 16:15:34Z eid 11100.
  - Khoảng trống `reconciled` dài nhất trong khung: 15:15:34 → 15:41:54Z (26m20s) — NHƯNG không có slot nào tới hạn trong khoảng đó (HB 15:20:50Z đã start 15:15:34Z) nên KHÔNG phải chết lặng theo nghĩa T7-191 (chết lặng = slot tới hạn bị trễ/mất).
  - **Reboot 16:21:33Z (boot 4dda8234) là SỰ KIỆN THẬT trong khung:** daemon ngưng ~43 s, hồi phục bằng requeue eid 11103 16:22:16.986Z; `reconciled` trở lại 16:41:54Z eid 11106 + 16:45:34Z eid 11109 (mới nhất lúc đóng). **0 slot HB/DR thiếu/muộn vì reboot này** — HB 16:50:50Z start đúng 16:45:34Z sau reboot.
  - 0 slot HB/DR thiếu/muộn trong khung tới lúc đóng. **T7-193 kiểm tiếp 16:52–17:35:40Z** (DR 17:00Z + HB 17:20:50Z thuộc cửa T7-193) rồi phán onset; **T7-194 phán cuối**. Lưu ý cho T7-193: đừng nhầm reboot 16:21:33Z (daemon chết ~43 s rồi hồi phục, slot vẫn đúng giờ) thành OUTAGE — và đừng để OUTAGE thật (nếu có sau 16:52Z) chìm trong nhiễu reboot này.
- **Uptime/boot lúc đóng (cho T7-193 đối chiếu):** boot 4dda8234, btime 1795623693 = 16:21:33Z, uptime 27 phút lúc 16:48:40Z, boot_id `4dda8234-2f0f-4414-8a51-25ab2e7e5d6a`. Event `reconciled` gần nhất lúc đóng: 16:45:34Z eid 11109.

## §9. F mới + đính chính chéo + hạn chế + nguồn

- **F-192-T7-1 (mới — nhãn "run 193" của brief sai −1):** xem §4. Brief bỏ qua lượt đóng 18:35 (82d3d1b9) — cùng mẫu lỗi F-191-T7-1. Parent quyết số hiệu ở §14.2-192.
- **F-191-T7-2 (theo dõi — boot_gen gắn với boot):** xem §5. Bằng chứng mạnh thêm: boot_gen đổi đúng 2 lần reboot trong ngày (cdd48e77 → 30d363b8 → a080cf74). T0-192 kiểm lại; nếu xác nhận thì ebc5a3b9 = #115, 4dda8234 = #116, marker 66 → 68.
- **KHÔNG có F-192-T7-x nào về sai số của T7:** mọi số trong file này đã kiểm 2 lần (truy vấn SQL trực tiếp theo đúng `scheduled_for_utc` + appendix tính từ epoch thô + assert số học + kiểm chéo độc lập bằng `date -d`). Ghi chú phương pháp (không phải F): T7 suýt nhầm DR 11:00Z thành 1795600800 (đó là DR 10:00Z) — bắt được bằng đối chiếu DR 10:00Z 1795600800 + 3.600 s TRƯỚC khi ghi file nào, 0 ảnh hưởng. Bài học đứng: mọi epoch dùng trong LIMITS phải qua `date -d`, không trừ tay.
- **§14.2 aggregate 191 — nguồn gốc SẠCH, tổng điền sẵn GIỮ 18** (parent viết quyết trực tiếp, kiểm đếm độc lập lần thứ 115; §14.2 TRỐNG khi parent đọc — lần sạch thứ ba kể từ đợt 179). T7 dùng đúng bản này (81.567 B) làm nguồn đối chiếu. Các quyết parent-191 T7 dùng: (e) b0aab705 = #114 XÁC NHẬN, #113 = f7632121 chấp nhận từ hồ sơ; (f) (m) #113 DƯƠNG (CUỐI), (m) #114 KHÔNG CÓ ĐIỂM, n 51/52; (n) run 192 thuộc T7-192 + cửa lành chuỗi 1 + OUTAGE giao T7-193/T7-194 + F-191-T7-1 chọn (a) nối tiếp; (o) auto-trigger GIỮ LIVE; (p) chuỗi 0 vi phạm 5 → 0 (ĐỨT — F-191-T10-2 light violation); (q) đếm cuối đợt 191 = 12/45/42/31, chuỗi đếm 115, chuỗi 11/11 = 12; (r) KHÔNG PUSH.
- **Đính chính chéo với các luồng khác (đọc .done lúc đóng ~16:52Z):** 8 cờ đã có — P1 (14:59Z), P2 (15:06Z), P3 (15:41Z), P4 (16:05Z), T01 (16:28Z), T2 (15:19Z), T4 (16:41Z), T56 (15:06Z). **T9 CHƯA đóng nhưng CÒN SỐNG** (dir round192-t9 viết file mới sau 16:41Z — ram-sampler.log, headroom-log.txt, t9-192-analyze-output.txt; dir mtime 16:54Z). **T8 CHƯA có dấu vết nào trên đĩa lúc đóng** (không có dir round192-t8, không có round192-t8.done — T10 kiểm lại theo quy tắc gộp muộn; KHÔNG kết luận mất trước khi kiểm đĩa, nhưng hiện tại là 0 file). T10 chưa bắt đầu (spawn lúc hạn cứng ~17:35Z).
- T7 KHÔNG tự phân loại (m) cuối, KHÔNG tự chứng nhận số hiệu reboot, KHÔNG phán thay parent về chuỗi cửa lành / chuỗi SUCCEEDED / chuỗi đếm khớp / mẫu "cố định theo giờ" — trừ các quyết (e)/(f)/(n)/(o)/(p)/(q) đợt 191 đã có.
- T7 KHÔNG chạy script nặng, KHÔNG probe dpkg trong cửa sổ attempt của T4 (toàn bộ phiên chỉ đọc DB + lệnh nhẹ `date`/`cat`/`uptime` + 3 sleep chờ cửa: sleep 1 (3.600 s) + sleep 2 (2.281 s, CHẾT theo reboot 16:21:33Z — SIGTERM, phiên hồi phục, 0 số liệu mất) + sleep 3 (1.500 s) xong sạch, exit 0).
- Kích thước file này: xem `stat` lúc stage (mục tiêu < 37.768 B). KHÔNG PUSH.
