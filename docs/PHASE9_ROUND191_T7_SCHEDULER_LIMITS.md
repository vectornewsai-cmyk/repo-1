# PHASE9 ROUND191 T7 — Scheduler LIMITS

Đợt 191 MỞ ở lượt cron 15:35 +07 25/11/2026 (= 08:35:51Z). T7 đóng cờ ~10:50Z 25/11 (trong hạn cờ ~11:00Z, trong hạn cứng ~11:35Z). Mọi số dưới đây đọc từ DB tươi (`scheduler.job_runs` + `scheduler.events`, truy vấn theo đúng `scheduled_for_utc`) và kiểm trực tiếp trên máy sống (boot_id, btime, uptime). Mọi epoch đã kiểm lại bằng `date -d @<epoch> -u` trước khi dùng. Script tính toán: `hidden_files/round191-t7/appendix191.py` → `appendix191.txt` (số học đã kiểm lại bằng assert + kiểm chéo độc lập). KHÔNG PUSH.

## §1. Run 814be71a (brief gọi "run 190") SUCCEEDED 05:53:41Z — KHÔNG phải CA mới

- **Run 814be71a SUCCEEDED 05:53:41Z** (finished 1795586021; status `succeeded`, timed_out false, attempt 1). Sched 1795584951 (05:35:51Z = 12:35:51 +07) → hạn 08:35:51Z → **margin +9.730 s = xong TRƯỚC hạn 2h42m10s**. Wall từ sched: 1.070 s = 17m50s.
- **Start đúng giờ, jitter 0** (started = sched = 1795584951).
- **claimed→finished = 10 s** (claimed 1795586011 = 05:53:31Z) — **10 s < 60 s → KHÔNG phải CA ≥60 s mới**.
- **Viết lại ×0, 2 event:** dispatched 05:35:51.140Z eid 10964 + succeeded 05:53:41.242Z eid 10971 — KHÔNG requeue, KHÔNG reattached. Boot_gen `cron_boot_d9ab3da6…` — KHÁC eb18559f (`cron_boot_9a3a6bd6…`, boot #113) và KHÁC run hiện tại (`cron_boot_cdd48e77…`) — xem F-191-T7-2.
- **ĐÍNH CHÍNH BRIEF (sai nhãn giờ): finished 1795586021 = 05:53:41Z = 12:53:41 +07 — brief ghi "13:13:41 +07" SAI 20 phút** (epoch đúng, nhãn +07 sai; 13:13:41 +07 ứng với epoch 1795587221, không phải epoch trong brief). Số 12:53:41 +07 trùng giờ handoff của parent — nhiều khả năng brief nhầm giờ handoff thành giờ finished.
- **Theo brief, run này là lượt cron ĐÓNG đợt 189** (không phải lượt chạy luồng 190 — đợt 190 VOID, xem §2/§4).

## §2. Run eb18559f (T7-189 gọi "run 190") SUCCEEDED 05:01:25Z — CA ≥60 s MỚI, BỊ MỒ CÔI, T7-191 BÁO CÁO BÙ

- **Run eb18559f SUCCEEDED 05:01:25Z** (finished 1795582885; status `succeeded`, timed_out false, attempt 1). Sched 1795574151 (02:35:51Z = 09:35:51 +07) → hạn 05:35:51Z → **margin +2.066 s = xong TRƯỚC hạn 34m26s**. Wall từ sched: 8.734 s = 2h25m34s.
- **Start VIẾT LẠI sau reboot #113** (started 1795581419 = 04:36:59Z = btime #113 +35,149 s; xem §8).
- **claimed→finished = 63 s** (claimed 1795582822 = 05:00:22Z) — **63 s ≥ 60 s → CA ≥60 s MỚI — ca thứ 22 toàn lịch sử, thứ 19 trong cửa sổ** (xem §3). Ca succeeded thứ 18 trong họ.
- **Viết lại ×1 + reattach ×1, 5 event:** dispatched 02:35:51.066Z eid 10922; `requeued_after_restart` 04:36:59.149Z eid 10947 (daemon startup recovery); dispatched 04:36:59.238Z eid 10948; `reattached_after_restart` 04:36:59.318Z eid 10949 ("execute turn already complete"); succeeded 05:01:25.740Z eid 10959.
- **Kết cục này CHƯA TỪNG ĐƯỢC BÁO CÁO:** T7-189 §4 + §12.3-189 (n) đều giao cho T7-190 — nhưng T7-190 CHƯA TỪNG CHẠY (đợt 190 VOID: 0 agent, 0 file, 0 cờ — MEMORY.md đã cập nhật "đợt 190 chưa từng chạy — không tồn tại"). T7-191 báo cáo bù ở đây; parent quyết ở §12.3-191 có tính ca này vào họ CA hay không.
- **Chuỗi SUCCEEDED: run 189 SUCCEEDED (khởi động lại lần 1) → eb18559f SUCCEEDED (lần 2) → 814be71a SUCCEEDED (lần 3).** Run hiện tại đang chạy (xem §5).

## §3. Họ CA ≥60 s đếm lại từ DB tươi: 22 ca toàn lịch sử, 19 ca trong cửa sổ

- Truy vấn trực tiếp `job_runs` (job `vcut-build-loop`, `finished − claimed ≥ 60`, giá trị claimed CUỐI CÙNG — định nghĩa thống nhất F-173-T7-2): **DB tươi có 21 dòng** — 141/95/123/66/66/64/108/110/82/109/88/86/163/110/85/94/128/202/146/158/**63** (eb18559f mới).
- **So với list T7-189 (20 dòng): KHỚP 20/20 — THÊM (1795574151, 63) = eb18559f.** Run 134 (sched 1794958551, cf 244) VẪN VẮNG trong DB (giữ 7 ngày — xem dưới).
- **Số ca: 21 → 22 toàn lịch sử** (21 dòng DB + run 134 GIỮ TỪ HỒ SƠ ĐÃ GHI — T7-183/T7-184/T7-185/T7-186/T7-187/T7-188/T7-189, 7 đợt liên tiếp, đọc từ DB tươi khi row còn tồn tại); **18 → 19 trong cửa sổ** (từ run 154, sched ≥ 1795196151). Trong họ 22 ca: **18 succeeded + 3 timeout (86/163/146 = run 180/181/188) + 1 failed (202 = run 187).** 814be71a (cf 10 s) KHÔNG vào họ.
- **Giữ 7 ngày (F-189-T7-1) VẪN ĐÚNG:** COUNT vcut = 57 run; earliest sched 1794990951; latest sched 1795595751 (run hiện tại); 1795595751 − 1794990951 = **604.800 s = ĐÚNG 7 ngày**. Run 138 (sched 1795001751, cf 141 s) VẪN CÒN trong DB lúc 08:40Z — rụng lúc **11:35:51Z 25/11** như đã báo (sau giờ T7-191 đóng ~11 phút; T7-192 trở đi KHÔNG còn thấy nó trong DB tươi, phải mang theo từ hồ sơ đã ghi như run 134).
- **Chuỗi đếm khớp:** T7-191 KHÔNG đếm chuỗi này (thuộc T10-191/T1-192/parent) — chỉ ghi mốc: parent-189 kiểm lần thứ 112 (§12.3-189 (q)).

## §4. F-191-T7-1 (mới — NHÃN "run 190" MƠ HỒ, hai run khác nhau cùng mang một nhãn)

- **Brief T7-191 gọi 814be71a (sched 1795584951, 12:35:51 +07) là "run 190".** Nhưng toàn bộ hồ sơ đứng gọi eb18559f (sched 1795574151, 09:35:51 +07) là "run 190": T7-189 §1/§4, §12.3-189 (n) ("run 190 kết cục thuộc T7-190"), MEMORY.md (run 187 = sched 1795541751, run 188 = sched 1795552551, run 189 = sched 1795563351 — nối tiếp +10.800 s thì run 190 = sched 1795574151 = eb18559f), T01-191 và T2-191 (cả hai đều ghi "run 190 (sched 1795574151)").
- **Theo cách đếm nối tiếp từ mốc đã quyết, 814be71a là run 191 và run hiện tại (sched 1795595751, 15:35:51 +07) là run 192** — brief gọi chúng là run 190 / run 191 (lệch −1). T01-191 còn mâu thuẫn nội bộ: gọi eb18559f là run 190 (đúng theo hồ sơ) nhưng gọi run hiện tại là run 191 (theo số đợt 191 — bỏ qua 814be71a, không đánh số cho nó).
- **T7-191 KHÔNG tự đổi nhãn:** mọi kết cục trong file này ghi bằng run_id + sched + epoch (không mơ hồ); nhãn "run 190"/"run 191" trong ngoặc là nhãn của brief. Parent quyết ở §12.3-191: (a) giữ cách đếm nối tiếp (eb18559f = run 190, 814be71a = run 191, hiện tại = run 192 — brief đợt này lệch −1), hay (b) đổi sang cách đếm theo đợt mở (12:35 = run 190, 15:35 = run 191 — thì T7-189 §4 + §12.3-189 (n) + MEMORY.md + T01/T2-191 đều cần đính chính). Nội dung số (SUCCEEDED, cf, margin) KHÔNG tranh chấp — chỉ nhãn số hiệu.

## §5. Run hiện tại lúc đóng: vẫn RUNNING — kết cục thuộc T7-192

- **Run d3d9408b (sched 1795595751 = 08:35:51Z = 15:35:51 +07 — brief gọi "run 191") vẫn RUNNING lúc đóng ~10:48Z** (sched = started = claimed = 1795595751, jitter 0; finished null; attempt 1; timed_out false; boot_gen `cron_boot_cdd48e77…` — boot b0aab705). Hạn 11:35:51Z. **Tuổi lúc đóng ~2h12m (7.929 s); còn ~48 phút tới hạn. Kết cục thuộc T7-192.**
- Lúc mở: 1 event dispatched 08:35:51.058Z eid 10998 — KHÔNG viết lại. 0 event `requeued_after_restart` nào mới trong phiên (kiểm tới eid 11004).

## §6. Cửa slot đợt 190-VOID (KIỂM BÙ — không có T7-190): HB 3 MUỘN, DR 2 THIẾU — KHÔNG LÀNH

- **HB 7/7 có, succeeded — 0 thiếu, 3 MUỘN:** 05:20:50Z −316 s; 05:50:50Z −316 s; **06:20:50Z +415 s (start 06:27:45Z)**; 06:50:50Z −316 s; **07:20:50Z +822 s (start 07:34:32Z)**; 07:50:50Z −319 s (sớm 3 s so với mẫu −316 — start TRƯỚC sched nên KHÔNG tính muộn, chỉ ghi lệch); **08:20:50Z +887 s (start 08:35:37Z)**.
- **DR 2/4 có, 0 s, succeeded — 2 THIẾU:** 05:00Z ✓; 06:00Z ✓; **07:00Z (sched 1795590000) KHÔNG CÓ ROW; 08:00Z (sched 1795593600) KHÔNG CÓ ROW** (truy vấn lại theo dải sched — không phải lỗi truy vấn; 0 row cho cả hai sched).
- **Daemon im lặng 3 khoảng (0 event): ~06:00–06:27Z, ~06:45–07:34Z, ~07:45–08:35Z.** Mỗi lần hồi phục bằng 1 event `reconciled` (eid 10975 06:27:44Z; eid 10984 07:34:32Z, changed_jobs=2; eid 10994 08:35:37Z) rồi dispatch slot trễ ngay sau đó. Đáng chú ý: reconciled 08:02:38Z eid 10993 (new_runs=0) — daemon tỉnh lúc 08:02:38Z nhưng KHÔNG dispatch gì (DR 08:00Z không được backfill), rồi im tiếp tới 08:35:37Z.
- **Cửa VOID KHÔNG LÀNH — chuỗi cửa lành liên tục (187/188/189 = 3) ĐỨT ở cửa sổ này theo nghĩa slot.** Đề xuất (parent quyết): đợt 191 lành (xem §7) thì chuỗi tính lại từ **1**, không nối thành 4 — vì đã có 3 muộn HB + 2 thiếu DR xen giữa. Cách đếm khác (chỉ đếm các đợt có T7, bỏ qua đợt VOID) thì chuỗi là 3 → 4 — T7 nêu cả hai, parent quyết.

## §7. Cửa slot đợt 191 LÀNH — HB 5/5, DR 2/2, 0 thiếu, 0 muộn

- **HB 5/5 có, TẤT CẢ −316 s, succeeded:** 08:50:50Z (start 08:45:34Z), 09:20:50Z (09:15:34Z), 09:50:50Z (09:45:34Z), 10:20:50Z (10:15:34Z), 10:50:50Z (10:45:34Z). 0 thiếu, 0 muộn.
- **DR 2/2 có, TẤT CẢ 0 s, succeeded:** 09:00Z, 10:00Z. 0 thiếu, 0 muộn. (DR 11:00Z tại/sau giờ đóng — thuộc T7-192, theo tiền lệ DR 05:00Z → T7-190.)
- **Lũy kế (kiểm bù VOID + đợt 191 — đề xuất, parent quyết): HB 50/537 → 50/549** (12 slot mới: 7 VOID + 5 đợt 191; thiếu +0; **muộn 11 → 14** — cả 3 muộn đều ở cửa VOID, 0 muộn ở đợt 191); **DR 55/340 → 55/346** (6 slot mới: 4 VOID + 2 đợt 191; **thiếu +2** — cả 2 thiếu đều ở cửa VOID, 0 thiếu ở đợt 191).
- **Cửa slot đợt 191 LÀNH — chuỗi cửa lành đề xuất tính lại từ 1** (xem §6 — cửa VOID xen giữa không lành). Boot b0aab705 (btime 08:25:43Z) rơi GIỮA hai lần start HB (08:15:34Z và 08:45:34Z) — không có slot nào start trong lúc reboot; HB 08:50:50Z start 08:45:34Z sau reboot, hồi phục bình thường.

## §8. Boot b0aab705, btime 08:25:43Z — T01-191 đánh số #114 (ứng viên); F-191-T7-2: boot_gen gợi ý có thể là #115

- **Số liệu tươi (T01-191 xác minh 9 nguồn, survey 08:44:31Z; T7 đối chiếu độc lập):** boot_id `b0aab705-7ef5-47fd-95e0-e97910fbfa88`; btime 1795595143 = 08:25:43Z (uptime 20 phút lúc 08:45:59Z, 2:22 lúc 10:48Z — KHỚP); gap #113→boot này = **13.759 s = 3h49m19s** (dài nhất chuỗi gần đây: #111→#112 12.155 s, #112→#113 7.385 s). Run hiện tại sched = btime + 608 s.
- **(m) boot này: KHÔNG TÍNH ĐƯỢC từ requeue** — 0 event `requeued_after_restart` có eid > 10947 (kiểm tới eid 11004 lúc 08:45:34Z; T01-191 đồng ý: 0 requeue trong [08:20; 08:35]Z và trong cả 25/11 00:00–09:00Z chỉ có eid 10947). T2-191 + parent phán sau.
- **F-191-T7-2 (mới — số hiệu #114 CHƯA CHẮC):** boot_gen của 814be71a (`cron_boot_d9ab3da6…`) KHÁC boot_gen của eb18559f sau requeue #113 (`cron_boot_9a3a6bd6…`). Bằng chứng đứng cho thấy boot_gen gắn với boot (cùng boot #111 ⇒ run 188/189 cùng `cron_boot_f5bbd5f4…`; boot mới #113 ⇒ boot_gen đổi sang `9a3a6bd6…`). NẾU boot_gen đúng là theo boot, thì đã có MỘT BOOT NỮA giữa 05:01:25Z (eb18559f xong) và 05:35:51Z (814be71a dispatch) mà không T0 nào xác minh — và b0aab705 thực ra là **#115**, không phải #114. Ủng hộ thêm: 3 khoảng daemon im lặng ở cửa VOID (§6) phù hợp với reboot/restart mà journal/wtmp KHÔNG còn lưu (cả hai chỉ giữ boot hiện tại — T01-191 F-191-T01-1 đã ghi). T7 KHÔNG tự đổi số hiệu (chỉ ghi số thô + bằng chứng) — T0-192 kiểm lại (xác định boot_gen gắn với boot hay với daemon-generation; kiểm nhật ký giữ lại) và parent quyết (e) ở §12.3-191.
- **Đính chính chéo (m) #113 (T2-191 đã phán — nợ mồ côi từ T2-190 nay có chủ): (m) #113 DƯƠNG (CUỐI ở cấp T2)** — requeue eid 10947, +35,149752 s, TRONG [33; 49,8]; n ứng viên 50/51 → **51/52** nếu parent chấp nhận (rủi ro dư trường hợp xấu nhất 32,149752 s, DƯỚI biên 0,850248 s — parent quyết). INSIDE #112/#113 (đếm A) KHÔNG TÍNH ĐƯỢC (thiếu btime #106) — chuỗi GIỮ 7.
- **Marker sống qua 66 reboot #49–#114** nếu số hiệu T01-191 đúng (67 nếu boot này thực ra là #115 — xem F-191-T7-2); mtime không đổi 2026-11-20 11:39:47Z.
- **(e) đã quyết dùng để đối chiếu:** #112 = 27e6714f (parent-189 (e) XÁC NHẬN); #113 = f7632121 chỉ xác minh từ HỒ SƠ (T0-190 VOID — F-191-T01-1); b0aab705 = #114 ứng viên (T01-191).

## §9. OUTAGE "cố định theo giờ" — BÀN GIAO NGUYÊN VẸN, KHÔNG KIỂM ĐƯỢC TRONG ĐỢT NÀY (F-188-T7-1 vẫn đứng)

- Parent quyết (n) §12.3-189: T7-188 kết luận mẫu "cố định theo giờ" **ĐƯỢC ỦNG HỘ MẠNH, CHƯA KHẲNG ĐỊNH TUYỆT ĐỐI** (stall 23/11 + 24/11 cùng khung 15:15:34Z–17:35:40Z tới từng giây, 8.406 s; 20–22/11 sạch); **giao T7-194 phán cuối, T7-193 kiểm onset khung 25/11**.
- **Khung 25/11 (15:15:34Z–17:35:40Z = 1795619734–1795628140) bắt đầu ~4h27m SAU khi T7-191 đóng (~10:48Z) — KHÔNG nằm trong đợt 191, KHÔNG kiểm được trong đợt này** (đúng tiền lệ F-188-T7-1/F-189-T7-§5: brief giao kiểm 25/11 trong đợt 188/189 đều là không thể). **T7-191 KHÔNG tự kết luận thêm** về giả thuyết: bàn giao nguyên vẹn — **T7-193 (đóng ~17:00Z 25/11) kiểm onset** (có dừng sau 15:15:34Z không), **T7-194 (đóng ~20:00Z 25/11, sau khi khung kết thúc) phán cuối**. Nếu 25/11 cũng im cùng khung → 3/3, gần như chắc chắn là mẫu theo giờ; nếu 25/11 sạch → chỉ là 2 ngày trùng hợp, giả thuyết yếu đi.
- **Cảnh báo cho T7-193 (mới — từ §6): daemon ĐÃ im lặng 3 khoảng trong sáng nay** (~06:00–06:27Z, ~06:45–07:34Z, ~07:45–08:35Z; 2 slot DR mất hẳn, 3 slot HB trễ) — daemon chết lặng là hiện tượng CÓ THẬT ngoài khung OUTAGE. Khi kiểm onset, T7-193 phải kiểm daemon còn sống hay không (event `reconciled` gần nhất, uptime, boot) chứ không chỉ đếm event vắng — nếu không, một lần daemon chết trong khung 15:15–17:35Z sẽ bị nhầm thành OUTAGE (hoặc ngược lại, OUTAGE thật bị chìm trong nhiễu daemon chết).

## §10. F mới + đính chính chéo + hạn chế + nguồn

- **F-191-T7-1 (mới — nhãn "run 190" mơ hồ):** xem §4. Hai run khác nhau (eb18559f sched 1795574151 và 814be71a sched 1795584951) cùng mang nhãn "run 190" trong hồ sơ — parent quyết cách đếm ở §12.3-191.
- **F-191-T7-2 (mới — số hiệu boot #114 chưa chắc):** xem §8. Boot_gen 814be71a khác boot_gen sau requeue #113 — gợi ý một boot chưa xác minh giữa #113 và b0aab705; T0-192 kiểm lại, parent quyết (e).
- **F-191-T7-3 (mới — cửa VOID không lành):** xem §6. Đợt 190 VOID để lại 3 HB muộn + 2 DR thiếu không có T7 nào đếm — T7-191 kiểm bù; chuỗi cửa lành liên tục đứt ở cửa sổ này (đề xuất tính lại từ 1 nếu đợt 191 lành).
- **KHÔNG có F-191-T7-x nào về sai số của T7:** mọi số trong file này đã kiểm 2 lần (truy vấn SQL trực tiếp theo đúng `scheduled_for_utc` + appendix tính từ epoch thô + assert số học + kiểm chéo độc lập). Ghi chú phương pháp (không phải F): T7 suýt nhầm sched DR 05:00Z (1795586400 SAI, đúng 1795582800 — bắt được bằng đối chiếu DR 04:00Z 1795579200 + 3.600 s TRƯỚC khi ghi file nào, 0 ảnh hưởng) và suýt nhầm sched HB 05:20:50Z (cùng lỗi dải truy vấn — bắt được bằng truy vấn lại dải đúng, 0 ảnh hưởng). Bài học đứng: mọi epoch dùng trong LIMITS phải qua `date -d`, không trừ tay.
- **§12.3 aggregate 189 — nguồn gốc CHƯA NGÃ NGŨ, tổng điền sẵn GIỮ 18** (parent kiểm độc lập lần thứ 112; nội dung (a)–(r) không tranh chấp). T7 dùng đúng bản parent-kiểm này (78.048 B) làm nguồn đối chiếu — KHÔNG dùng mục AGENTS.md ghi "SẠCH" (F-189-T10-1 đã xác định các mục đó là sai). Các quyết parent-189 T7 dùng: (e) #112 = 27e6714f, #113 chờ T0-190; (f) (m) #111 DƯƠNG (CUỐI), (m) #113 thô +35,149 s chờ T2-190, n 50/51; (g) n GIỮ 14; (n) run 189 SUCCEEDED CA #21 + run 190 thuộc T7-190 + cửa lành chuỗi 3 + OUTAGE giao T7-193/T7-194; (o) auto-trigger GIỮ LIVE; (p) 0 vi phạm 4 → 5, live lần 9 ĐẠT (chuỗi 7 → 8); (q) đếm cuối đợt 189 = 10/16/15/14, chuỗi đếm 112, chuỗi 9/9 = 10 → 11; (r) KHÔNG PUSH.
- **Đính chính chéo với các luồng khác (đọc .done lúc đóng ~10:48Z):** 9 cờ đã có — P1 (09:52Z), P2, P3, P4, T01 (10:46Z), T2, T4, T56, T8. **T9 CHƯA đóng nhưng CÒN SỐNG** (b2-spikes.log viết 10:47:36Z; headroom-log.txt 10:46:01Z — sau lần đọc .done cuối của T7) — T10 xử lý theo quy tắc gộp muộn nếu T9 đóng sau khi T10 bắt đầu (bài học các đợt 19/25/32…: KHÔNG kết luận T9 mất trước khi kiểm đĩa — đã kiểm: T9 đang chạy). T10 chưa bắt đầu (chưa có dir round191-t10).
- **Ghi nhận ngoài luồng (không phải F của T7 — chỉ ghi bằng chứng, KHÔNG phán tác giả): MEMORY.md bị sửa từ bên ngoài trong phiên này** (hệ thống báo file đổi lúc ~08:5xZ; nội dung: mục "Chưa lên" đổi thành "đợt 190 chưa từng chạy — không tồn tại; đợt 191 đang chạy" — KHỚP sự thật T7 xác minh độc lập từ DB; T7 KHÔNG sửa MEMORY.md, luật cứng). T7 chỉ ghi nhận, KHÔNG đọc sâu, KHÔNG phán tác giả.
- T7 KHÔNG tự phân loại (m) cuối, KHÔNG tự chứng nhận số hiệu reboot, KHÔNG phán thay parent về chuỗi cửa lành / chuỗi 9/9 / chuỗi đếm khớp / mẫu "cố định theo giờ" — trừ các quyết (e)/(f)/(n)/(o)/(p)/(q) đợt 189 đã có.
- T7 KHÔNG chạy script nặng, KHÔNG probe dpkg trong cửa sổ attempt của T4 (toàn bộ phiên chỉ đọc DB + lệnh nhẹ `date`/`cat`/`uptime` + 2 sleep chờ cửa: sleep 1 (3.600 s) + sleep 2 (3.150 s) xong sạch, exit 0 — 0 sleep chết theo reboot).
- Kích thước file này: xem `stat` lúc stage (mục tiêu < 37.768 B). KHÔNG PUSH.
