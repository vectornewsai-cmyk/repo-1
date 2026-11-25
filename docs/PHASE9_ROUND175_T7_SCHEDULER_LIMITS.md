# PHASE9 ROUND175 T7 — RUN 174 SUCCEEDED 02:24:03Z (MARGIN +721 S, CF 11 S — KHÔNG PHẢI CA ≥60 S THỨ CHÍN) + RUN 175 JITTER 0 S, ĐANG CHẠY, VIẾT LẠI ×2 TẠI #87 + #88 + CỬA SLOT LÀNH ĐẦU TIÊN KỂ TỪ ĐỢT 172 (HB 6/6 + DR 3/3)

- **Luồng:** T7 đợt 175 (lượt cron 09:35:51 +07 23/11/2026 = 02:35:51Z). Nhiệm vụ theo brief T7-175: (1) kết cục run 174 — vẫn `running` lúc T7-174 đóng cờ (tuổi gốc 8.757 s lúc 02:01:48Z, hạn 02:35:51Z; đã viết lại 1 lần tại #86; jitter +13 s); (2) run 175: trạng thái, claimed_at, tuổi, jitter; (3) slot DR 03:00Z + HB 02:20:50Z; (4) reboot mới trong phiên (nếu có sau #86); (5) boot lúc đóng cờ + mọi F-175-T7-x.
- **Boot trong phiên:** mở phiên đã là **70b7f7ee-2e0b-4565-b019-bdabc2c6e92c** (#86, btime 01:01:37Z — **T0-175 XÁC NHẬN 9 nguồn**, khớp T7-174). **Reboot #87 MỚI GIỮA PHIÊN** (boot ca31fac1, btime 03:06:05Z — T7 xác minh 9 nguồn, phát hiện 45 s sau btime; T2-175 xác minh trực tiếp 6 nguồn, khớp từng số). **Reboot #88 MỚI GIỮA PHIÊN** (boot 9131fbc6, btime 05:04:17Z — T7 xác minh 9 nguồn, phát hiện 44 s sau btime). **Boot lúc đóng cờ vẫn 9131fbc6**.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 174/175 đầy đủ; HB/DR theo slot; requeue cửa hẹp + cửa rộng #87, cửa hẹp #88 chưa khép hẳn — xem §2.4), LIMITS T7-174 + aggregate 174 §7 + §12.3 (n)/(o) + cờ/LIMITS các luồng đợt 175 (T0/T1/T2/T4/T5/T6/T8 đã đóng; **T9 LIMITS đã có nhưng cờ .done CHƯA CÓ — xem F-175-T7-3**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (quy tắc đứng sau vi phạm F-174-T2-5 — T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 174 kết cục? | **`succeeded` 02:24:03Z**, wall gốc 10.079 s, **margin +721 s** (theo hạn started-gốc + 10.800 s; +708 s theo hạn sched + 10.800 s — xem §2.1), claimed→finished **11 s** | §2.1, Phụ lục |
| Run 174 có phải ca ≥60 s thứ chín? | **KHÔNG** — cf 11 s < 60 s; số ca GIỮ 8 (run 172 = thứ tám, theo định nghĩa thống nhất parent đã chọn) | §2.1 |
| Run 174 có bị viết lại lần 2 không? | **KHÔNG** — đúng 1 lần viết lại (#86), 5 event, 0 event sau succeeded | §2.1 |
| Run 175? | **Vẫn `running` lúc đóng cờ** (tuổi gốc ~9.340 s, còn ~1.460 s tới hạn 05:35:51Z); **jitter 0 s** (trở lại 0 sau +13 s ở run 174); **viết lại ×2** (#87 + #88); claimed không đổi | §2.2 |
| Reboot #87 (mới giữa phiên)? | **Boot ca31fac1, btime 03:06:05Z, GIỜ THẬT** (T7 xác minh 9 nguồn); gap #86→#87 = **7.468 s**; số hiệu #87 chờ T0-176 xác minh 9 nguồn | §2.3 |
| (m) #87? | **DƯƠNG ỨNG VIÊN (sơ bộ)** — requeue +39,864 s TRONG dải, cách biên dưới 6,864 s; 1 run sống + 1 requeue duy nhất cửa hẹp (T2-175 đã phán CUỐI ở cấp T2: DƯƠNG — KHỚP T7 từng số) | §2.3 |
| Reboot #88 (mới giữa phiên)? | **Boot 9131fbc6, btime 05:04:17Z, GIỜ THẬT** (T7 xác minh 9 nguồn); gap #87→#88 = **7.092 s**; số hiệu #88 chờ T0-176 xác minh 9 nguồn | §2.4 |
| (m) #88? | **DƯƠNG ỨNG VIÊN (sơ bộ)** — requeue +33,431 s TRONG dải, **cách biên DƯỚI chỉ 0,431 s (sát biên nhất từng ghi ở biên dưới — sát hơn #81 0,477 s)**; 1 run sống + 1 requeue từ btime tới lúc đọc (cửa hẹp chưa khép — đếm cuối thuộc T2-176) | §2.4 |
| Cửa slot đợt 175? | **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — CỬA LÀNH, lần đầu kể từ đợt 172** | §2.5 |
| DR 03:00Z? | **CÓ** — đúng giờ, jitter 0 s (khác DR 23:00Z đợt 174 không bao giờ xuất hiện) | §2.5 |
| Đồng hồ lúc mở / trong phiên? | **Cloudflare chênh 0–1 s** (lúc phát hiện #87 chênh 0 s; lúc phát hiện #88 chênh ~1 s, CF nhanh hơn) — khớp T0/T2/T5-175 | §2.3/§2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–174): heartbeat **44/441 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **51/293 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới — đợt thứ mười bốn liên tiếp vắng muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 174 — SUCCEEDED 02:24:03Z, margin +721 s, cf 11 s, CHỈ 1 lần viết lại (đọc #1 + events đối chiếu trực tiếp + T0-175 đối chiếu độc lập)

Run 174 (`3bcde515-6550-43bd-9753-ef1e990b0b7e`, sched 1795390551 = 23:35:51Z 22/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795390551 = 23:35:51Z 22/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795390564 → **1795395746 = 01:02:26Z** (dịch +5.182 s) — KHÔNG đổi sau đó |
| finished_at_utc | 1795400643 = 02:24:03Z (event `succeeded` 02:24:03.966Z, eid 10270) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795400632 = 02:23:52Z (finished − 11 s) — **ĐÃ ĐỔI** so với T7-174 (1795390564 không đổi tới 02:01:48Z); đổi trong (02:01:48Z, 02:24:03Z] |
| worker_boot_generation | cron_boot_0762915dd0b340129cec9e524f6c0834 (boot #86) |
| Wall từ started gốc | 1795400643 − 1795390564 = **10.079 s** (2h47m59s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795401364 = 02:36:04Z — finished TRƯỚC hạn **721 s (margin +721 s)** |
| Wall từ started viết lại lần 1 | 1795400643 − 1795395746 = **4.897 s** (1h21m37s thực thi trên boot #86 sau viết lại) |

- Events run 174 (đầy đủ, **đúng 5 event, 0 event sau succeeded**): `dispatched` 23:36:04.686Z (10230) + `requeued_after_restart` 01:02:26.418Z (10252) + `dispatched` 01:02:26.505Z (10253) + `reattached_after_restart` 01:02:26.564Z (10254) + **`succeeded` 02:24:03.966Z (10270)**. **ĐÚNG 1 LẦN VIẾT LẠI** (#86) — không có lần viết lại thứ hai.
- **Run 174 finish 02:24:03Z — SAU khi T7-174 đóng cờ (~02:10Z) nhưng TRƯỚC khi đợt 175 mở (02:35:51Z).** Kết cục này là nợ chính của T7-175, nay đã trả.
- **Claimed_at đổi lúc cuối (cùng mẫu run 171/172/173):** T7-174 đọc 8 lần đều thấy claimed = 1795390564 (không đổi tới 02:01:48Z); DB tươi lúc T7-175 đọc #1 (~02:39Z) đã là 1795400632 = finished − 11 s. Theo quy ước họ ca (claimed_at CUỐI CÙNG trong DB), **claimed→finished = 11 s — KHÔNG thuộc họ ≥60 s**. Số ca giữ 8 (156/159/164/166/167/170/171/172); run 172 vẫn là ca thứ TÁM. **Run 174 KHÔNG phải ca thứ chín.**
- **Caveat margin (ghi rõ, không giấu):** T0-175 tính wall sched→finished = 10.092 s và margin +708 s theo hạn sched + 10.800 s (02:35:51Z). T7 giữ quy ước T7-174 (hạn = started gốc + 10.800 s → margin +721 s). Hai số chênh nhau đúng 13 s = jitter run 174 (started gốc muộn hơn sched 13 s). **Cả hai đều đúng theo định nghĩa riêng của mình; verdict SUCCEEDED không đổi theo cách tính nào** (finished trước cả hai hạn). T10/parent lưu ý khi trích số.
- T0-175 đối chiếu độc lập: **SUCCEEDED 02:24:03Z, 5 event, 1 lần viết lại, claimed 02:23:52Z → cf 11 s** — KHỚP T7 từng số (xem F-175-T0-3). T2-175 cũng đối chiếu claimed run 174 (F-175-T2-... — xem LIMITS T2-175 §1, khớp T7).
- **Chuỗi run vcut gần đây (margin, theo hạn started-gốc):** 171: 385 s; 172: 1.132 s; 173: **−13 s (TIMEOUT)**; 174: **+721 s (SUCCEEDED)**. Chuỗi succeeded: TIMEOUT 173 đứt chuỗi 150–172; run 174 succeeded — chuỗi succeeded mới bắt đầu từ 174 (1 run).

### 2.2 Run 175 — vẫn `running` lúc đóng cờ, jitter 0 s, viết lại ×2 (#87 + #88), claimed không đổi

Run 175 (`f0ac7900-cc16-41b5-9299-70f52dbcee3b`, sched 1795401351 = 02:35:51Z 23/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795401351 | 02:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×2) | 1795401351 → 1795403205 → **1795410290** | 02:35:51Z → 03:06:45Z → **05:04:50Z** (dịch +1.854 s rồi +7.085 s; tổng +8.939 s) |
| worker_claimed_at | 1795401352 | 02:35:52Z (KHÔNG đổi qua 8 lần đọc) |
| worker_boot_generation | cron_boot_1f908a9c0e5d4246999b12c111eb419c | boot #88 (gốc: 0762915d, #86; giữa: 7f2165b9, #87) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795412151 | 05:35:51Z 23/11 |

- **Jitter 0 s** — run 175 dispatch đúng giây sched 02:35:51Z. **Chuỗi jitter 0 s bắt đầu lại từ run 175** (sau +13 s ở run 174 đứt chuỗi 26 đợt). T0-175 cũng ghi jitter 0 s — khớp.
- 8 lần đọc DB trong phiên (đọc #1–#8, 02:39Z–05:05Z): run 175 `running` ở mọi lần đọc; started_at gốc KHÔNG đổi ở đọc #1–#2 (02:39Z–03:04Z), đổi lần 1 tại đọc #3 (~03:06Z, sau #87), KHÔNG đổi ở đọc #4–#7, đổi lần 2 tại đọc #8 (~05:05Z, sau #88); claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 2 lần (cùng lúc started). **2 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay): đọc #2 (03:04:53Z) 1.742 s; đọc #4 (03:32:21Z) 3.390 s; đọc #5 (03:57:39Z) 4.908 s; đọc #6 (04:22:50Z) 6.419 s; đọc #7 (04:48:22Z) 7.951 s; đọc #8 (05:05:01Z) **~9.310 s, còn ~1.490 s** tới hạn ngân sách 05:35:51Z. **Kết cục thuộc T7-176** (hạn cứng đóng đợt 175 là 05:30Z, trước hạn run 175 05:35:51Z — cùng mẫu run 174 thuộc T7-175).
- Events run 175 tới lúc đóng cờ: đúng 7 event — dispatched 02:35:51.224Z (10272) + requeued 03:06:44.864Z (10282) + dispatched 03:06:45.045Z (10283) + reattached 03:06:45.210Z (10284) + **requeued 05:04:50.431Z (10309) + dispatched 05:04:50.523Z (10310) + reattached 05:04:50.608Z (10311)**.

### 2.3 Reboot #87 MỚI GIỮA PHIÊN (btime 03:06:05Z, boot ca31fac1) — RUN 175 VIẾT LẠI LẦN 1 + (m) #87 DƯƠNG ỨNG VIÊN

- **Reboot #87: boot ca31fac1-9e71-4de3-97b6-0dd7904a426c, btime 1795403165 = 03:06:05Z 23/11.** Xác minh T7 (lúc phát hiện ~03:06:50Z + kiểm lại lúc đọc #4 ~03:32Z + kiểm lại lúc đọc #7 ~04:48Z — cả ba lần đều ca31fac1, btime 1795403165): boot_id + btime /proc/stat + `uptime -s` 03:06:05Z (khớp) + /proc/1 mtime 03:06:15.966Z (+10,966 s) + journal idx 0 duy nhất, first entry 03:06:16Z (+11 s) + wtmp begins 03:06:16Z (+11 s) + `last` reboot 03:06 still running + `who -b` 03:06. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 03:07:01 vs 03:07:01 (**chênh 0 s**, lúc phát hiện). **Số hiệu #87 theo đếm tuần tự — CHỜ T0-176 xác minh 9 nguồn** (T0-175 đóng cờ 02:48Z, TRƯỚC #87; T2-175 xác minh trực tiếp 6 nguồn — khớp T7 từng số).
- **Gap #86→#87 (btime−btime): 1795403165 − 1795395697 = 7.468 s (2h04m28s).**
- **#87 xảy ra TRONG lúc run 175 chạy:** run 175 dispatch gốc 02:35:51Z, btime #87 03:06:05Z (tuổi gốc lúc btime **1.814 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 175)** — theo EVENTS (dispatched trước btime, chưa finish); spanning theo truy vấn started_at = **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at đã viết lại thành 03:06:45Z, sau btime — cùng mẫu #78/#79/#81/#82/#84/#85/#86). T7 dựa verdict (m) trên EVENTS + REQUEUE, không dựa trên spanning-artifact.
- **Run 175 BỊ VIẾT LẠI LẦN 1 tại #87:** started 1795401351 → **1795403205 = 03:06:45Z** (dịch **+1.854 s**); boot_gen đổi 0762915d (#86) → **7f2165b970fc4686a666ce5fcc6af724** (#87); **claimed_at KHÔNG ĐỔI (1795401352)**; vẫn running, attempt 1, error null.
- **1 requeue duy nhất do #87:** cửa hẹp [03:06:05Z, 03:25:05Z] (mọi job): **1 dòng** — run 175, eid 10282, 03:06:44.864Z (kiểm lại sau khi cửa khép hẳn ở đọc #4 ~03:32Z — vẫn đúng 1 dòng). Không job nào khác bị requeue do #87.
- **Requeue offset +39,864 s — TRONG dải (m) 33–49,8 s, cách biên dưới 6,864 s, biên trên 9,936 s** (03:06:44.864Z − btime nguyên 1795403165). Reattach +40,210 s; dispatch lần 2 +40,045 s. **(m) #87 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-175 đã phán **CUỐI ở cấp T2: DƯƠNG** (requeue +39,864 s — KHỚP T7 từng số; caveat F-175-T2-9: verdict KHÔNG bền với neo watcher (+7 s → counterfactual +32,864 s, DƯỚI dải chỉ 0,136 s — hụt nhỏ nhất từng ghi) và neo sampler (+16 s → +23,864 s); bền với neo T4-poller (−8 s → +47,864 s)). Nếu parent CHẤP NHẬN cả #86 (n 32/33 → 33/34) rồi #87: n ứng viên **33/34 → 34/35** (số học nối tiếp T2-175). n chính thức GIỮ 14 cho tới khi parent chốt.
- **Sleep của T7 bị giết theo #87** (xem F-175-T7-1): sleep 1500 s spawn 03:05:02Z bị SIGTERM sau ~87 s; T7 phát hiện boot mới ngay lần kiểm sau (03:06:50Z, 45 s sau btime), 0 số liệu mất, 0 số sai.
- **INSIDE #87 + FULL133: T2-175 đã phán — TRUE (FULL133), chuỗi dài 6** (hai dải mâu thuẫn, FULL132 nói NGOÀI muộn 5.970 s; dải phương pháp chi phối theo F-165-T2-1). T7 không tự tính INSIDE/CERT/FULL.
- **POSTBOOT_PASS #87: thuộc T5-176** (T5-175 đóng cờ trước #87; watcher-175 chết theo reboot — T8-175 ghi waiter1 + poller T4 + watcher T5 đều chết theo #87). Marker sống qua #87: chưa đếm — giao T0-176.
- **#86 XÁC NHẬN bởi T0-175** (9 nguồn; gap #85→#86 = 7.321 s — KHỚP T7-174; marker sống qua 38 reboot #49–#86). **(m) #86: T2-175 phán CUỐI — DƯƠNG** (requeue +49,418 s — KHỚP T7-174; caveat phân số F-175-T0-4: boot_est +0,897 s → offset ≈ +48,521 s, vẫn trong dải). **INSIDE #86 TRUE (FULL132) — chuỗi dài 5** (T2-175). Parent quyết cuối đợt 175.

### 2.4 Reboot #88 MỚI GIỮA PHIÊN (btime 05:04:17Z, boot 9131fbc6) — RUN 175 VIẾT LẠI LẦN 2 + (m) #88 DƯƠNG ỨNG VIÊN SÁT BIÊN DƯỚI NHẤT

- **Reboot #88: boot 9131fbc6-d99b-4a28-b1b6-08183db3317d, btime 1795410257 = 05:04:17Z 23/11.** Xác minh T7 (lúc phát hiện ~05:05:01Z + kiểm lại lúc viết LIMITS ~05:06:38Z — cả hai lần đều 9131fbc6, btime 1795410257): boot_id + btime /proc/stat + `uptime -s` 05:04:17Z (khớp) + /proc/1 mtime 05:04:28.180Z (+11,181 s) + journal idx 0 duy nhất, first entry 05:04:28Z (+11 s) + wtmp begins 05:04:28Z (+11 s) + `last` reboot 05:04 still running + `who -b` 05:04. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 05:05:13 GMT vs 05:05:12 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #88 theo đếm tuần tự — CHỜ T0-176 xác minh 9 nguồn** (T0-175 đóng cờ 02:48Z, TRƯỚC #88; không luồng nào đợt 175 đóng sau #88 ngoài T7/T9 — T9 đóng ~05:04Z, xem F-175-T7-3).
- **Gap #87→#88 (btime−btime): 1795410257 − 1795403165 = 7.092 s (1h58m12s).**
- **#88 xảy ra TRONG lúc run 175 chạy:** run 175 dispatch gốc 02:35:51Z, btime #88 05:04:17Z (tuổi gốc lúc btime **8.906 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 175)** — theo EVENTS; spanning theo truy vấn started_at = **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at đã viết lại thành 05:04:50Z, sau btime — cùng mẫu #87). T7 dựa verdict (m) trên EVENTS + REQUEUE.
- **Run 175 BỊ VIẾT LẠI LẦN 2 tại #88:** started 1795403205 → **1795410290 = 05:04:50Z** (dịch **+7.085 s**; tổng dịch từ gốc +8.939 s); boot_gen đổi 7f2165b9 (#87) → **1f908a9c0e5d4246999b12c111eb419c** (#88); **claimed_at KHÔNG ĐỔI (1795401352)**; vẫn running, attempt 1, error null.
- **Requeue do #88 (tới lúc đọc): 1 dòng** — run 175, eid 10309, 05:04:50.431Z (truy vấn mọi job từ btime trở đi, lúc ~05:05:34Z). **Cửa hẹp [05:04:17Z, 05:23:17Z] CHƯA khép lúc T7 đóng cờ** — đếm requeue cuối cùng trong cửa hẹp thuộc T2-176 (kiểm lại sau khi cửa khép hẳn).
- **Requeue offset +33,431 s — TRONG dải (m) 33–49,8 s, SÁT BIÊN DƯỚI 0,431 s** (05:04:50.431Z − btime nguyên 1795410257). Reattach +33,608 s; dispatch lần 2 +33,523 s. Đây là điểm (m) **sát biên nhất từng ghi ở biên dưới** (sát hơn #81 0,477 s ở biên dưới; #86 0,382 s ở biên TRÊN vẫn giữ kỷ lục sát biên tuyệt đối). **Robust với caveat phân số theo hướng ngược #86:** boot thật ∈ [btime, btime+1 s) → offset thật ∈ (32,431 s, 33,431 s] — nếu boot_est lệch +0,5 s trở lên, offset thật DƯỚI 33 s → verdict KHÔNG bền với neo phân số (cùng họ caveat #71/#81/#85 — T2-176 đối chiếu neo watcher/sampler/poller; parent quyết cuối). **(m) #88 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7; T2-176 phân loại cuối + parent 176).** Nếu parent CHẤP NHẬN cả #86/#87 (n 34/35) rồi #88: n ứng viên **34/35 → 35/36** (số học nối tiếp T2-175; T7 chỉ ghi số học, T2-176 tính chính thức). n chính thức GIỮ 14.
- **Sleep của T7 bị giết theo #88** (xem F-175-T7-2): sleep 1200 s spawn 04:49:03Z bị SIGTERM sau ~934 s; T7 phát hiện boot mới ngay lần kiểm sau (05:05:01Z, 44 s sau btime), 0 số liệu mất, 0 số sai. **Đợt 175 có 2 sleep bị giết (lần đầu 2 lần trong một đợt của T7).**
- **INSIDE #88 + FULL134 + POSTBOOT_PASS #88 + #88 có giết holder không: thuộc T2-176 / T5-176 / T6-176.** T7 không tự tính INSIDE/CERT/FULL.
- **Run 174 đã finish 02:24:03Z nên KHÔNG bị #87/#88 chạm.** DR 05:00Z dispatch 05:00:00Z trên boot #87, 4m17s TRƯỚC btime #88 — không bị #88 chạm (xem §2.5).

### 2.5 Slot HB/DR trong cửa 02:39Z → 05:05Z 23/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH

Cửa kiểm ~2h26' (8 lần đọc DB; DR 03:00Z kiểm 2 lần trong cửa này + đã có từ trước).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:20:50 (02:20:50Z) | 5f9a5f76 | 02:15:34 | **−316 s** | CÓ |
| 09:50:50 (02:50:50Z) | 37ab054e | 02:45:34 | **−316 s** | CÓ |
| 10:20:50 (03:20:50Z) | 4acc0028 | 03:15:34 | **−316 s** | CÓ |
| 10:50:50 (03:50:50Z) | 9942e77c | 03:45:34 | **−316 s** | CÓ |
| 11:20:50 (04:20:50Z) | 85dc070e | 04:15:34 | **−316 s** | CÓ |
| 11:50:50 (04:50:50Z) | c3b64081 | 04:45:34 | **−316 s** | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started. **Toàn −316 s — KHÔNG có ngoại lệ.** 0 muộn mới — muộn HB lũy kế GIỮ 9 (đợt thứ mười bốn liên tiếp vắng muộn mới).
- HB 02:20:50Z + 02:50:50Z dispatch trên boot #86; HB 03:20:50Z + 03:50:50Z + 04:20:50Z + 04:50:50Z dispatch trên boot #87 (sau btime #87 9m29s, 39m29s, 1h09m29s, 1h39m29s).

**Deterministic-doctor (lưới :00:00Z): 3/3 có — DR 03:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 10:00 (03:00Z) | 6dd2a46d | 03:00:00 | 0 s | CÓ |
| 11:00 (04:00Z) | 2ebb5ba1 | 04:00:00 | 0 s | CÓ |
| 12:00 (05:00Z) | bb0e825d | 05:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 03:00Z CÓ, đúng giờ** — khác DR 23:00Z đợt 174 (không bao giờ xuất hiện sau 8 lần kiểm; slot mất hẳn trong cửa sổ recovery sau #85). DR 03:00Z dispatch 03:00:00Z trên boot #86, 6m05s TRƯỚC btime #87 — không bị #87 chạm. DR 05:00Z dispatch trên boot #87, 4m17s trước btime #88.
- **Cửa slot đợt 175 LÀNH (HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn). Lần đầu tiên cửa lành hoàn toàn kể từ đợt 172** (chuỗi cửa lành 11 đợt 162–172 đã dứt ở đợt 173; đợt 173 HB 6/6 + DR 3/4, đợt 174 HB 6/6 + DR 3/4 — cả hai đều thiếu DR 23:00Z).

### 2.6 Đối chiếu chéo các luồng đợt 175 (chỉ ghi nhận)

- **T0-175** (cờ 02:48Z): **#86 XÁC NHẬN 9 nguồn** (boot_est +0,897 s — F-175-T0-4: offset (m) #86 ≈ +48,521 s, vẫn trong dải); gap #85→#86 = 7.321 s — KHỚP T7-174; **marker sống qua 38 reboot #49–#86**; run 174 SUCCEEDED 02:24:03Z, 5 event, 1 lần viết lại — KHỚP T7 từng số; **claimed_at run 174 DB hiện tại 02:23:52Z → cf 11 s** (F-175-T0-3 — khớp T7); run 175 jitter 0 s — khớp T7; **O8 trên boot #86: WebKit PASS 21/21 ×2 + Chromium PASS 21/21** (02:40:52–02:46:17Z). T0-175 đóng TRƯỚC #87/#88 — **#87/#88 chờ T0-176 xác minh 9 nguồn**.
- **T1-175** (cờ ~02:54Z): **verify đợt 174: PASS** — đợt 174 = 10/14/14/13; lũy kế 111–174 = 628/1.106/959/781; chờ push 166–174 = 90/127/119/117 — **KHỚP từng số quyết parent (q) §12.3 đợt 174, lần thứ 73 liên tiếp**; suite **28/28 exit 0 trên boot 70b7f7ee**; npm test 12 pass. F-175-T1-3: tổng mọi round (1–174) đúng là **1.276/6.976/3.764** (T10-174 ghi thiếu 1 batch / 2 entry / 1 đường dẫn). F-175-T1-7: hai bản cờ T9-174 KHÔNG giống nhau (aggregate §10.1 nói "giống nhau" chưa chính xác). F-175-T1-1: 3 socket X11 X193/X194/X195 mồ côi — giao T8-175 dọn.
- **T2-175** (cờ ~03:xxZ): **(m) #86 DƯƠNG (CUỐI)** + **(m) #87 DƯƠNG (CUỐI cấp T2)** — requeue +39,864 s, KHỚP T7 từng số; **INSIDE #86 TRUE (FULL132) — chuỗi dài 5** + **INSIDE #87 TRUE (FULL133) — chuỗi dài 6**; n ứng viên 33/34 → 34/35 nếu cả hai được chấp nhận; **#56 lần thứ 18 không thu hẹp được**; mù #96?/#88?/#94?/#95?/#77? VẪN MỞ (hole-recheck lần 19); CERT/FULL GIỮ 76/91. T2-175 đóng TRƯỚC #88 — **(m) #88 + INSIDE #88 + FULL134 thuộc T2-176**.
- **T4-175** (cờ ~03:24Z): **lượt yên WebKit #44: CÓ LƯỢT HỢP LỆ** — attempt1-ca31fac1 20/20, B 5/5, tickCost median 41,0 ms — **chuỗi lượt yên hợp lệ 37 → 38** (đạt ngay attempt1, ngân sách 1/3). **F-175-T4-2: T2 CHẠY `m56-175.py` TRONG CỬA SỔ ATTEMPT1 (vi phạm quy tắc đứng — lần thứ hai liên tiếp sau F-174-T4-2)** — ps-before bắt 4 process (pid 6010/6011/6012/6019), chỉ ~4 s đầu, trước khi pass chạy; T2-175 tự ghi "KHÔNG vi phạm" (§4.2 LIMITS T2-175) — **MÂU THUẪN giữa hai luồng, thuộc T10-175 + parent 175 phán**; T7 chỉ ghi nhận. Lượt hợp lệ #44 vẫn đứng theo T4 (script chỉ trong 4 s đầu, trước pass chạy).
- **T5-175** (cờ ~02:4xZ): **POSTBOOT_PASS #86 ĐÃ CÓ 02:40:29Z** (boot+1h38m52s, replay-đầy-đủ 170/170, poll=0 — **cờ replay-đầy-đủ đầu tiên kể từ #80**, KHÔNG caveat repair); #85/#84 VẪN CÓ; #83/#82 KHÔNG CÓ; hướng (3) VẪN ĐỨNG lần thứ 22. Watcher-174 chết theo #86 (poll cuối 01:02:13Z, +36 s sau btime — overlap LỚN NHẤT, F-175-T5-1); watcher-175 pid 16528 ALIVE, hạn 05:30:00Z — T5-176 tiếp quản (watcher này chết theo #87/#88 — xem T8-175/T9-175). T5-175 đóng TRƯỚC #87/#88 — **POSTBOOT_PASS #87/#88 thuộc T5-176**.
- **T6-175** (cờ ~02:55Z): **(A) KIỂM CHỨNG LẠI LẦN THỨ 25: 120/120 PASS dưới churn (100%)**; **#86 KHÔNG giết holder** (lock trống 881 s trước btime — chuỗi "không giết holder" từ #69 lên **18 reboot**); **PRUNE LẦN 50: xóa 1 file**. T6-175 đóng TRƯỚC #87/#88 — **#87/#88 có giết holder không thuộc T6-176**.
- **T8-175** (cờ ~04:31Z): **harness 5/6** (86n2-P1 KẸT MỚI, exit 124 — **kẹt cộng dồn 20 → 21; chuỗi "P3 không kẹt" 3 → 0, ĐỨT**); (f') V1 live 0 kích hoạt — ĐÚNG THEO PHẠM VI; Q3 heartbeat 84l10 chạy kiểm lại PASS lần thứ tư liên tiếp; **O8 T8 PASS 3/3 trên boot #87** (03:34:40–03:37:12Z) — **đề xuất chuỗi WebKit FULL PASS GIỮ 25** (4 chân lệch boot + harness có kẹt; parent/T10 quyết cuối); checklist (o) 21/21; X11 trống lúc đóng. T8-175 đóng TRƯỚC #88.
- **T9-175: LIMITS đã có trên đĩa (41.845 B, mtime 05:04Z) NHƯNG cờ .done CHƯA CÓ ở cả hai vị trí lúc T7 kiểm lần cuối 05:06:38Z — xem F-175-T7-3.** Nội dung LIMITS T9 (đọc trực tiếp): headroom 2; **cửa sổ thoáng lần thứ 4 liên tiếp** (30.001, 30.001 lúc boot+57s trên #87); **E-186 KẾT THÚC (37 mẫu), E-187–E-190 MỚI, E-190 ĐANG GHIM; tổng ghim 38/133 (28,6%)**; RAM min 270.084 kB (trũng sâu hơn đợt 174 đúng 132.376 kB); **ENOSPC 60 dòng — đợt thứ 24**; **birefnet 0 lần thử, lần thứ 29**; 38 spike B2 thật (1 spike trong cửa sổ attempt T4 03:18:04Z; 1 spike trong cửa sổ O8 T8). T9 chưa biết #88 lúc viết LIMITS (mtime 05:04Z, cùng phút btime #88).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 174/175 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #87 + từ btime #88 tới lúc đọc; runs spanning btime — cả lọc và không lọc). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. (Đợt này 0 slot thiếu — HB 6/6 + DR 3/3 đều có trong DB tươi.)
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1: phụ lục chỉ viết bằng script, không gõ tay; epoch slot luôn kiểm bằng `date -u` TRƯỚC khi truy vấn — đợt này 0 lần truy vấn sai epoch). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #87/#88 đều là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng ở §2.3/§2.4 — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning #87/#88 = 0 theo truy vấn là ARTIFACT viết-lại-tự-loại; verdict (m) dựa trên EVENTS + REQUEUE.
4. Cửa kiểm đợt này ~2h26' (02:39Z → 05:05Z 23/11), đủ 6 slot HB + 3 slot DR + run vcut 174 (kết cục) và 175 (theo dõi + viết lại tại #87/#88). Tám lần đọc DB đầy đủ (đọc #1–#8); run 174 được đọc đầy đủ 2 lần khớp hoàn toàn nhau ở mọi trường (đọc #1 + events) + T0/T1/T2-175 đối chiếu khớp; run 175 được đọc đầy đủ 8 lần (started_at đổi đúng 2 lần tại đọc #3/#8, claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 02:20:50Z + DR 03:00Z thuộc cửa 175 (sau kiểm cuối T7-174 lúc ~02:01Z; DR 03:00Z T7-174 chưa kiểm — T7-175 kiểm 2 lần, đều CÓ). HB 05:20:50Z + DR 06:00Z (ngày 23/11) thuộc cửa T7-176.
6. **2 sleep bị SIGTERM giết trong phiên này** (sleep #3 spawn 03:05:02Z, chết sau ~87 s do #87 — F-175-T7-1; sleep #8 spawn 04:49:03Z, chết sau ~934 s do #88 — F-175-T7-2); 6/8 sleep hoàn thành; ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2). **Boot ĐỔI 2 lần trong phiên** (70b7f7ee → ca31fac1 tại #87; → 9131fbc6 tại #88) — T7 phát hiện trong vòng 45 s sau btime ở cả hai lần và xác minh 9 nguồn ngay; boot lúc đóng vẫn 9131fbc6.
7. T7 đóng cờ ~05:1xZ — trễ ~10–15' so với hạn cờ ~05:00Z (để viết LIMITS + kiểm chéo các luồng + kiểm lại DR 05:00Z + HB 04:50:50Z + xác minh 9 nguồn cho #88 — cùng mẫu T7-174 trễ ~10' do #86), trong hạn cứng 05:30Z. T7 không bỏ slot nào trong cửa. DR 06:00Z + HB 05:20:50Z thuộc cửa T7-176.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix175.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 175 trong NOTES đều tính bằng script — LIMITS chỉ dùng số từ appendix175.txt.

## 4. Cập nhật lũy kế (nối tiếp đợt 174, cùng phương pháp)

- Heartbeat: 44/435 → **44/441 slot thiếu** (cửa sổ 14/11 07:50:50 → 23/11 11:50:50 +07). Kiểm toán cửa sổ: 435 + 6 slot mới = 441 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 51/290 → **51/293 slot thiếu** (cửa sổ 11/11 09:00 → 23/11 12:00 +07). Kiểm toán: 290 + 3 = 293 ✓. Số thiếu +0 (0 thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 44/441 = 10,0% (giảm từ 10,1% — 0 thiếu mới); DR 51/293 = 17,4% (giảm từ 17,6% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ mười bốn liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 174: SUCCEEDED theo hồ sơ daemon (wall gốc 10.079 s, margin +721 s theo hạn started-gốc)** — đọc #1 + events đầy đủ (5 event, 0 event sau succeeded eid 10270) + T0-175 đối chiếu khớp. 1 lần viết lại tại #86; claimed→finished 11 s (claimed đổi thành finished − 11 s lúc cuối — cùng mẫu run 171/172/173). **KHÔNG phải ca ≥60 s thứ chín — số ca giữ 8.** Caveat: T0-175 tính margin +708 s theo hạn sched + 10.800 s (chênh 13 s = jitter) — verdict không đổi theo cách tính nào.
2. **Run 175 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc ~9.310 s, còn ~1.490 s tới hạn ngân sách 05:35:51Z; viết lại ×2 tại #87 + #88) — kết cục thuộc T7-176. **Claimed_at run 175 vẫn giữ nguyên (02:35:52Z) lúc đóng** — T7-176 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 175 = 0 s** (chuỗi jitter 0 s bắt đầu lại từ run 175 sau +13 s ở run 174).
3. **Reboot #87 (btime 03:06:05Z, boot ca31fac1): GIỮA PHIÊN, giờ thật, T7 xác minh 9 nguồn.** Gap #86→#87 = 7.468 s. Số hiệu #87 theo đếm tuần tự — **CHỜ T0-176 xác minh 9 nguồn** (T0-175 đóng trước #87; T2-175 xác minh trực tiếp 6 nguồn — khớp T7). **(m) #87: T2-175 phán CUỐI ở cấp T2 — DƯƠNG** (requeue +39,864 s; caveat F-175-T2-9 neo watcher — parent quyết cuối đợt 175). **INSIDE #87 TRUE (FULL133) — chuỗi dài 6** (T2-175).
4. **Reboot #88 (btime 05:04:17Z, boot 9131fbc6): GIỮA PHIÊN, giờ thật, T7 xác minh 9 nguồn.** Gap #87→#88 = 7.092 s. Số hiệu #88 theo đếm tuần tự — **CHỜ T0-176 xác minh 9 nguồn**. **Điểm (m) #88: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — requeue +33,431 s TRONG dải, **cách biên DƯỚI chỉ 0,431 s (sát biên nhất từng ghi ở biên dưới)**; 1 run sống tại btime + 1 requeue từ btime tới lúc đọc (cửa hẹp chưa khép — đếm cuối thuộc T2-176); caveat phân số: offset thật ∈ (32,431 s, 33,431 s] — verdict KHÔNG bền với neo phân số ≥ +0,5 s. T2-176 phân loại cuối + parent 176.
5. **Điểm (m) #86: T2-175 phán CUỐI — DƯƠNG** (requeue +49,418 s; boot_est #86 = btime +0,897 s → offset ≈ +48,521 s, vẫn trong dải). **Parent quyết cuối đợt 175.** (m) #84/#85: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 174 — KHÔNG mở lại. (m) #82: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 173 — KHÔNG mở lại. (m) #83: KHÔNG PHẢI ĐIỂM — parent ĐÃ CHẤP NHẬN đợt 173 — KHÔNG mở lại.
6. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-175 không thu hẹp được cửa lần thứ mười tám — xem LIMITS T2-175) — chờ parent chốt J. T2-176 tiếp tục thu hẹp cửa.
7. **Cửa slot: HB 6/6 + DR 3/3 — CỬA LÀNH, lần đầu kể từ đợt 172.** Lũy kế: HB 44/441, DR 51/293. Muộn HB lũy kế GIỮ 9. **Jitter run vcut 0 s (run 175) — chuỗi jitter 0 s bắt đầu lại.** Toàn bộ 6 slot HB đều −316 s; 3 slot DR có đều 0 s. **DR 03:00Z CÓ, đúng giờ** (khác DR 23:00Z đợt 174 không bao giờ xuất hiện).
8. **F-175-T7-1 — Sleep #3 bị SIGTERM theo reboot #87** (cùng mẫu F-174-T7-1): sleep 1500 s spawn 03:05:02Z, chết sau ~87 s lúc ~03:06:30Z; T7 phát hiện boot mới trong 45 s, 0 số sai.
9. **F-175-T7-2 — Sleep #8 bị SIGTERM theo reboot #88** (cùng mẫu F-174-T7-1, lần thứ hai đợt này): sleep 1200 s spawn 04:49:03Z, chết sau ~934 s lúc ~05:04:37Z; T7 phát hiện boot mới trong 44 s, 0 số sai. **Đợt 175 là đợt đầu tiên T7 có 2 sleep bị giết.**
10. **F-175-T7-3 — Cờ round175-t9.done CHƯA CÓ trên đĩa lúc T7 kiểm lần cuối (05:06:38Z) dù LIMITS T9 đã có (41.845 B, mtime 05:04Z).** Không có ở cả hai vị trí (gốc + thư mục con `round175-t9/`). T9 LIMITS tự ghi "7/9 + T9 = 8/9" lúc đóng (~04:56Z) — cờ có thể được viết sau khi T7 kiểm, hoặc T9 chưa viết cờ. **T10-175 kiểm lại cờ T9 trước khi chốt đếm cờ 9/9.** T7 không suy đoán thêm.
11. **F-175-T4-2 — VI PHẠM quy tắc đứng lần thứ hai liên tiếp (T2 chạy `m56-175.py` trong cửa sổ attempt1 của T4 ~4 s đầu):** T4 ghi VI PHẠM (ps-before bắt 4 process); T2 tự ghi "KHÔNG vi phạm" — MÂU THUẪN giữa hai luồng. Lượt hợp lệ #44 vẫn đứng theo T4 (script chỉ trong 4 s đầu, trước pass chạy). **Thuộc T10-175 + parent 175 phán** — T7 chỉ ghi nhận, không phán. Nhắc lại quy tắc cho mọi luồng đợt 176: KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt.
12. **Mù #96? (#64) VẪN MỞ** theo T2-175 (hole-recheck lần 19). **Mù #95? (#63) MỞ** (quyết (b) đợt 163). **Mù #94? (#62) MỞ** (quyết (b) đợt 162). **Mù #88? VẪN MỞ** (hole-recheck lần thứ mười chín); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91.
13. **INSIDE #86 TRUE (FULL132) — chuỗi dài 5; INSIDE #87 TRUE (FULL133) — chuỗi dài 6** (T2-175; FULL131 nói NGOÀI ở #86 — hai dải MÂU THUẪN, dải phương pháp chi phối theo F-165-T2-1). **INSIDE #88 + FULL134: thuộc T2-176.**
14. **POSTBOOT_PASS #86 ĐÃ CÓ 02:40:29Z (T5-175, replay-đầy-đủ 170/170, poll=0 — KHÔNG caveat repair, cờ replay-đầy-đủ đầu tiên kể từ #80)** — chờ parent quyết có được tính cho gate (a) không. **POSTBOOT_PASS #85/#84 VẪN CÓ, còn hiệu lực** (parent đã chấp nhận). **POSTBOOT_PASS #83 KHÔNG CÓ** (boot thứ 16 không cờ; #86 có cờ nên tổng giữ 16). **POSTBOOT_PASS #87/#88 thuộc T5-176.** Marker sống qua 38 reboot #49–#86 (T0-175 đếm độc lập 38); sống qua #87/#88 chưa đếm — giao T0-176.
15. **O8 chuỗi WebKit FULL PASS: T8-175 ĐỀ XUẤT GIỮ 25** (4 chân lệch boot #86/#87 + harness trên #87 có 1 kẹt 86n2-P1) — **parent quyết cuối**. Lượt yên #44 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 37 → 38 (T4-175). Harness 5/6, kẹt cộng dồn 20 → 21; chuỗi "P3 không kẹt" 3 → 0, ĐỨT (T8-175). **#86 KHÔNG giết holder — chuỗi từ #69 lên 18 reboot** (T6-175; (A) 120/120 lần thứ 25 + prune lần 50 xóa 1 file). **#87/#88 có giết holder không — thuộc T6-176.**
16. **T7 đóng cờ ~05:1xZ — trễ ~10–15' so với hạn cờ ~05:00Z** (để viết LIMITS + kiểm chéo các luồng + kiểm lại DR 05:00Z + HB 04:50:50Z + xác minh 9 nguồn cho #88 — cùng mẫu T7-174 trễ ~10' do #86), trong hạn cứng 05:30Z. T7 không bỏ slot nào trong cửa. DR 06:00Z + HB 05:20:50Z thuộc cửa T7-176.
17. **Harness 5/6 + kẹt + (1c')/(f') + 84l10 + H3 + headroom + ENOSPC + birefnet: xem LIMITS T8-175/T9-175.** T9-175: headroom 2; cửa sổ thoáng lần thứ 4 liên tiếp; E-186 kết thúc 37 mẫu, E-187–E-190 mới, E-190 đang ghim, tổng ghim 38/133 (28,6%); ENOSPC 60 dòng — đợt thứ 24; birefnet 0 lần thử lần thứ 29.

## 6. Phụ lục — số liệu từ script `appendix175.py` (epoch thô, không gõ tay)

Xem `~/workspace/repo-1/hidden_files/round175-t7/appendix175.txt` (chạy từ `appendix175.py` cùng thư mục). Tóm tắt các số đã kiểm:

- Run 174 SUCCEEDED 02:24:03Z, wall gốc 10.079 s, margin +721 s (started-gốc) / +708 s (sched), cf 11 s, 5 event, 1 lần viết lại.
- Run 175 jitter 0 s, viết lại ×2 (#87 + #88), tuổi gốc 7.951 s lúc 04:48:22Z.
- Reboot #87: btime 03:06:05Z, gap 7.468 s, requeue +39,864 s. Reboot #88: btime 05:04:17Z, gap 7.092 s, requeue +33,431 s (sát biên dưới 0,431 s).
- HB 6/6 toàn −316 s; DR 3/3 toàn 0 s; lũy kế HB 44/441, DR 51/293; cửa LÀNH.
