# PHASE9 ROUND170 T7 — RUN 169 SUCCEEDED (wall 9.713 s, margin 1.087 s; claimed→finished 35 s — NGOÀI HỌ 6–11 s) + REBOOT #79 TRƯỚC KHI MỞ (VIẾT LẠI RUN 169 LẦN 2, REQUEUE +251,007 s — NGOÀI DẢI → (m) #79 KHÔNG PHẢI ĐIỂM) + CỬA SLOT 6/6 + 3/3 (0 MUỘN, 0 THIẾU)

- **Luồng:** T7 đợt 170 (lượt cron 18:35 +07 22/11/2026 = 11:35:51Z). Nhiệm vụ theo brief T7-170: (1) kết cục run 169 — run này vẫn `running` lúc T7-169 đóng cờ (~11:05Z, tuổi gốc 8.983 s, còn 1.817 s tới hạn cứng 11:35:51Z = đúng lúc đợt 170 mở; 1 lần viết lại tại reboot #78); (2) nếu boot mới (#79) viết lại run 169: requeue offset so với btime, số lần viết lại, đánh giá ứng viên (m) DƯƠNG hay không (dải dương 33–49,8 s — đối chiếu với T2-170, không tự chốt phân loại cuối); (3) (m) #78: hỗ trợ T2-170 từ phía scheduler (requeue btime+40,693 s, viết lại run 169 lần 1 — xác nhận lại từ DB); (4) theo dõi run 170 (job vcut-build-loop, scheduled 11:35:51Z): events đã thấy tới lúc đóng cờ; (5) ghi F-170-T7-*.
- **Boot trong phiên:** mở phiên là **5df1871f-7e19-45e1-a357-1ca4fd89bc33** (btime /proc/stat 1795345865 = 11:11:05Z — **reboot #79, GIỜ THẬT**, T7 xác minh 9 nguồn; T0-170 xác minh 9 nguồn độc lập — KHỚP; số sơ bộ ~11:12Z trong brief LỆCH 55 s so với btime thật 11:11:05Z — xem F-170-T7-2); **KHÔNG có reboot mới trong phiên** (boot lúc đọc DB cuối #9 vẫn 5df1871f — KHÔNG đổi sau đọc đầu; ghi rõ cả hai mốc, bài học T7-166).
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 169/170 đầy đủ; HB/DR theo slot; kiểm requeue theo cửa + kiểm run spanning btime), LIMITS T7-169 + NOTES round169-t7, cờ round170-t0.done / t2.done / t5.done / t9.done (đối chiếu chéo; t1/t4/t6/t8 đã đóng nhưng T7 chưa đọc chi tiết — giao T10-170 tổng hợp). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới (vấn đề nằm phía scheduler / reboot / đồng hồ, ngoài repo).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 169 kết cục? | **`succeeded`** 11:17:44Z (event 11:17:44.354Z, eid 10060), wall từ started gốc **9.713 s**, margin **1.087 s** (18m07s) tới hạn 11:35:51Z | §2.1, Phụ lục A |
| Run 169 có bị #79 viết lại lần 2 không? | **CÓ** — requeue 11:15:16.007Z = btime +251,007 s; started_at 09:15:19Z → 11:15:16Z | §2.1, §2.2 |
| Reboot #79 có ảnh hưởng run 169 không? | **CÓ — viết lại lần 2** (run đang chạy tại btime; finish 399 s SAU btime, vẫn đúng hạn) | §2.2 |
| (m) #79? | **KHÔNG PHẢI ĐIỂM** — requeue +251,007 s NGOÀI dải 33–49,8 s (vượt biên trên 201,2 s); T0-170 + T2-170 đối chiếu độc lập **ĐỒNG Ý** | §2.2, §2.7 |
| (m) #78 (xác nhận lại)? | **ỨNG VIÊN DƯƠNG — T2-170 đối chiếu độc lập: DƯƠNG** (requeue +40,693 s trong dải); caveat MỚI F-170-T5-1 (poll cuối watcher-169 muộn hơn btime 11 s) đã được T2-170 xử lý ở F-170-T2-5 — T7 chỉ ghi nhận | §2.3, §2.7 |
| (m) #77? | **Parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM** (đợt 169) — chỉ ghi chú tham chiếu, KHÔNG mở lại | §2.7 |
| (m) #76? | **Parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM** (quyết (e) đợt 168) — chỉ ghi chú tham chiếu, KHÔNG mở lại | §2.7 |
| (m) #74? | **DƯƠNG ĐÃ CHẤP NHẬN** (quyết (f) đợt 168) → n ứng viên **27 (nhánh khuyến nghị) / 28 (nhánh #56 ÂM)**; n chính thức GIỮ 14 | §2.7 |
| #56 (m)? | **VẪN CÓ ĐIỀU KIỆN — T2-170 KHÔNG thu hẹp được cửa LẦN THỨ MƯỜI BA**; R 2,56251–2,66817 s; J 2,566–2,80753 s | §2.4 |
| Cửa slot đợt 170? | **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s), 0 thiếu, 0 muộn** — cửa LÀNH HOÀN TOÀN (đợt thứ chín liên tiếp) | §2.6 |
| Run 170? | **Jitter 0 s** (lần thứ 23 liên tiếp), **0 lần viết lại**, **vẫn `running` lúc đóng cờ** (~14:02Z, tuổi gốc 8.766 s, còn 2.034 s tới hạn 14:35:51Z). Kết cục thuộc T7-171 | §2.5 |
| Đồng hồ lúc mở? | **Cloudflare ±1 s** (4 lần trong phiên: 11:37Z, 12:28Z, 13:19Z, 14:02Z — đều chênh đúng 1 s) — khớp T0-170/T5-170 | §2.2, §2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–169): heartbeat **44/411 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **49/277 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 169 — SUCCEEDED, margin 1.087 s (đọc #1 + kiểm lại cuối đọc #9 khớp nhau + events đối chiếu trực tiếp + T0/T2-170 đối chiếu số học)

Run 169 (`1ad9d142-743a-415e-91c7-5257648dd692`, sched 1795336551 = 08:35:51Z 22/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795336551 = 08:35:51Z 22/11 |
| started_at (gốc) | 1795336551 = 08:35:51Z — jitter 0 s |
| started_at sau viết lại lần 1 (#78) | 1795338919 = 09:15:19Z 22/11 |
| started_at sau viết lại lần 2 (#79) | 1795346116 = 11:15:16Z 22/11 |
| finished_at_utc | 1795346264 = 11:17:44Z (event `succeeded` 11:17:44.354Z, eid 10060) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795346229 = 11:17:09Z (finished − 35 s) |
| worker_boot_generation (sau viết lại lần 2) | cron_boot_82e24f95b2574c1a85d5aa34bf57980e |
| Wall từ started gốc | 1795346264 − 1795336551 = **9.713 s** (2h41m53s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795347351 = 11:35:51Z — finished TRƯỚC hạn **1.087 s** (18m07s) |
| Finished sau btime #79 | 1795346264 − 1795345865 = 399 s (6m39s) SAU btime #79 (11:11:05Z) |
| Finished trước lúc đợt 170 mở | 1795347351 − 1795346264 = 1.087 s TRƯỚC 11:35:51Z |

- Events run 169 (đầy đủ, 8 event, không thiếu, **0 event mới sau succeeded** — kiểm lại ở đọc cuối #9: vẫn đúng 8 event, cuối eid 10060): `dispatched` 08:35:51.105Z (eid 10017, detail "scheduled") + `requeued_after_restart` 09:15:18.693Z (10027, "daemon startup recovery", #78) + `dispatched` 09:15:19.644Z (10028) + `reattached_after_restart` 09:15:19.705Z (10029, "execute turn already complete (model-output evidence)") + **`requeued_after_restart` 11:15:16.007Z (10054, "daemon startup recovery", #79)** + `dispatched` 11:15:16.127Z (10055) + `reattached_after_restart` 11:15:16.184Z (10056, "execute turn already complete (model-output evidence)") + **`succeeded` 11:17:44.354Z (10060)**. **2 lần viết lại** (#78 + #79).
- 2 lần đọc DB đầy đủ run 169 trong phiên khớp nhau ở mọi trường (đọc #1 ~11:37Z, #9 ~14:02Z — đọc #1 xác nhận kết cục; đọc #9 xác nhận không đổi + 0 event sau succeeded). T0-170 + T2-170 đối chiếu số học độc lập: **SUCCEEDED 11:17:44Z, wall 9.713 s, margin 1.087 s, claimed→finished 35 s, 2 lần viết lại, 8 event** — KHỚP T7 từng số (cờ T0-170 ~11:41Z, cờ T2-170 ~12:1xZ). Verdict SUCCEEDED chắc chắn **theo hồ sơ daemon**.
- **Chuỗi run vcut gần đây (margin):** 150: 177 s; 151: 1.828 s; 152: 1.210 s; 153: 1.191 s; 154: 1.265 s; 155: 1.162 s; 156: 977 s; 157: 345 s; 158: 520 s; 159: 1.303 s; 160: **1.935 s** (rộng nhất từ đợt 150); 161: 1.452 s; 162: 1.065 s; 163: 1.058 s; 164: 454 s; 165: 982 s; 166: 531 s; 167: 587 s; 168: 1.016 s; 169: **1.087 s** — **hẹp thứ 12/20** trong chuỗi từ đợt 150. T7 chỉ ghi nhận, không suy luận nguyên nhân.
- **Ghi chú claimed_at:** run 169 claimed 11:17:09Z (finished − **35 s**) — **NGOÀI họ 6–11 s** (154: 7 s, 155: 8 s, 158: 10 s, 160: 7 s, 161: 6 s, 162: 11 s, 163: 8 s, 165: 8 s, 168: 7 s) **và NGOÀI ca 60+ s** (164: 66 s, 166: 64 s, 167: 108 s). 35 s là giá trị trung gian đầu tiên kể từ khi họ 6–11 s được ghi nhận — T7 ghi đúng 35 s, không làm tròn, không suy đoán nguyên nhân. T2-170 ghi nhận cùng chi tiết ở F-170-T2-7 ("ca đầu tiên kể từ 108 s của run 167" — theo nghĩa ngoài họ 6–11 s).
- **T7-169 đóng cờ ~11:05Z — run 169 finish 11:17:44Z SAU khi T7-169 đóng** (~764 s = ~12m44s sau, ước tính từ ~11:05:00Z). Claim "run 169 chưa có kết cục" của T7-169 ĐÚNG lúc đóng (cùng mẫu run 161: finish 44 s sau T10-161 đóng; run 162: 87 s; run 163: 96 s; run 164: finish sau T10-164 đóng; run 165: finish 11m29s sau T7-165 đóng; run 166: finish 18m21s sau T7-166 đóng; run 167: finish ~15m04s sau T7-167 đóng; run 168: finish ~11m54s sau T7-168 đóng).
- **Run 169 bị 2 lần viết lại** (#78 + #79) — chuỗi run bị viết lại: 156 (3 lần), 157 (2), 158 (1), 159 (2), 160 (0), 161 (1), 162 (0), 163 (1), 164 (2), 165 (1), 166 (**2**), 167 (**1**), 168 (**1**), 169 (**2**), 170 (**0** — tính tới lúc đóng cờ T7-170).

### 2.2 Reboot #79 (btime 11:11:05Z, TRƯỚC khi đợt mở 24m46s) — VIẾT LẠI RUN 169 LẦN 2, REQUEUE +251,007 s — NGOÀI DẢI → (m) #79 KHÔNG PHẢI ĐIỂM

- **Reboot #79: boot 5df1871f-7e19-45e1-a357-1ca4fd89bc33, btime 1795345865 = 11:11:05Z 22/11.** Xác minh T7 (lúc mở phiên + đọc #1): boot_id + btime + `uptime -s` 11:11:05Z (khớp) + /proc/1 mtime 11:11:15.986Z (+10,986 s) + journal idx 0 duy nhất, first entry 11:11:16Z (+11 s) + wtmp begins 11:11:16Z (+11 s) + `last` reboot 11:11 still running + `who -b` 11:11. **Số sơ bộ ~11:12Z trong brief LỆCH 55 s so với btime thật 11:11:05Z** (brief yêu cầu không tin số sơ bộ — T7 đã xác minh độc lập 9 nguồn, không dùng số brief làm bằng chứng; xem F-170-T7-2). **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 11:37:59 vs 11:37:58 (chênh 1 s, lúc mở), 12:28:59 vs 12:28:58 (chênh 1 s), 13:19:25 vs 13:19:24 (chênh 1 s), 14:02:05 vs 14:02:04 (chênh 1 s) — bốn lần trong phiên, đều trong ±1 s. **Github Date KHÔNG dùng làm chuẩn** (bài học F-159-T7-1). T0-170 xác minh 9 nguồn độc lập — KHỚP T7.
- **Gap #78→#79 (btime−btime): 1795345865 − 1795338878 = 6.987 s (1h56m27s).** T0-170 + T2-170 xác minh độc lập cùng số — KHỚP T7.
- **Run 169 ĐANG CHẠY tại btime #79:** đọc #9 đợt 169 (11:05:34Z) running; 0 event finish trước requeue 11:15:16Z; requeue + reattach tại btime +251,007 s; finish 11:17:44Z (399 s sau btime). Run 170 start 11:35:51Z sau btime 1.486 s, trên boot #79.
- **1 requeue do #79:** cửa 11:11:05–11:30:00Z (mọi job, event `requeued_after_restart`): đúng 1 dòng — requeue run 169 (eid 10054). Không job nào khác bị requeue do #79.
- **Spanning btime #79: 0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI, không phải bằng chứng "0 run đang chạy".** Run 169 started_at đã viết lại thành 11:15:16Z (sau btime) nên tự loại khỏi truy vấn `started_at ≤ btime AND (finished IS NULL OR finished > btime)`. Đây đúng là caveat T7-162 §2.2 đã cảnh báo và trường hợp #66/#68/#69/#70/#71/#72/#74/#76/#78 — verdict NGOÀI DẢI dựa trên EVENTS (requeue + reattach), không dựa trên spanning.
- **(m) #79 — KHÔNG PHẢI ĐIỂM (lean T7; T0-170 + T2-170 đối chiếu độc lập ĐỒNG Ý):** run đang chạy tại btime + viết lại lần 2, NHƯNG requeue **11:15:16.007Z = btime +251,007 s — NGOÀI dải dương 33–49,8 s** (vượt biên trên 201,207 s). Chữ ký GIỐNG #76 (viết lại run đang chạy NHƯNG requeue NGOÀI dải — #76 dưới biên 0,691 s, #79 trên biên 201,2 s); KHÁC #78 (trong dải → ứng viên DƯƠNG); KHÁC #77 (0 run đang chạy, 0 requeue). **n không đổi vì #79.** Độ trễ requeue sau #79 (251 s) gấp ~6× sau #78 (40,7 s) — T2-170 ghi nhận ở F-170-T2-8; T7 chỉ ghi nhận, không suy cơ chế. Parent quyết cuối.
- **Số hiệu #79 theo đếm tuần tự** — T0-170 chứng nhận 9 nguồn; chờ parent xác nhận.

### 2.3 Điểm (m) #78 — XÁC NHẬN LẠI TỪ PHÍA SCHEDULER (T2-170 đối chiếu độc lập: DƯƠNG) + CAVEAT MỚI F-170-T5-1

- **Run 169 ĐANG CHẠY tại btime #78 (09:14:38Z).** Bằng chứng (xác nhận lại từ DB đợt 170): events 10017/10027/10028/10029 không đổi; requeue 09:15:18.693Z = **btime +40,693 s — TRONG dải dương 33–49,8 s**; viết lại lần 1 (started_at 1795336551 → 1795338919, delta 2.368 s); 0 event finish trước btime.
- **T2-170 đối chiếu độc lập: (m) #78 DƯƠNG** (DB đọc tươi 11:38–11:42Z; requeue duy nhất trong cửa [09:14:38Z, 09:30:00Z]; runs live tại btime theo events: đúng 1 — run 169; spanning 0 là artifact). **Nếu parent CHẤP NHẬN #78 DƯƠNG: n ứng viên 27→28 (nhánh khuyến nghị) hoặc 28→29 (nhánh #56 ÂM)** — T7 chỉ nêu hệ quả số học, không đề xuất phân loại.
- **CAVEAT MỚI — F-170-T5-1 (T5-170, phát hiện chính):** poll cuối watcher-169 09:14:49Z MUỘN HƠN btime #78 (09:14:38Z) **11 s** — mâu thuẫn trực tiếp; /proc/1 mtime trên #78 09:14:49.824Z cùng giây với poll cuối. Giả thuyết mạnh nhất (CHƯA CHỨNG MINH): shutdown container cũ chồng lấp. Hệ quả: nếu btime dịch +11 s thì requeue #78 +40,693 s → +29,7 s, NGOÀI dải dương. T5 KHÔNG phán (m), giao T2-170 + parent đối chiếu. **T2-170 ĐÃ xử lý ở F-170-T2-5: counterfactual lệch khung #78 MIXED** (các neo trái chiều: btime 40,693 s TRONG; /proc/1 28,869 s + poll cuối 29,693 s DƯỚI; sampler cuối 58,693 s TRÊN) — **verdict DƯƠNG theo quy tắc đứng + tiền lệ #71**. T7 chỉ ghi nhận caveat + cách xử lý của T2, KHÔNG phán lại, KHÔNG tự cộng/trừ n.
- **(m) #77 — parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM (đợt 169):** 0 run đang chạy tại btime + 0 requeue — T7 chỉ ghi chú tham chiếu, KHÔNG mở lại. **(m) #76 — parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM (quyết (e) đợt 168):** requeue +32,309 s NGOÀI dải dưới biên 0,691 s — T7 chỉ ghi chú tham chiếu, KHÔNG mở lại.

### 2.4 Điểm (m) #56 — VẪN CÓ ĐIỀU KIỆN, T2-170 KHÔNG thu hẹp được cửa LẦN THỨ MƯỜI BA

- T2-170 DONE (cờ ~12:1xZ): **KHÔNG thu hẹp được cửa (m) #56 LẦN THỨ MƯỜI BA** (7 hướng MỚI đều âm tính: wtmp/btmp rotated không tồn tại; journal persistent chỉ 1 file; shell histories TẤT CẢ MISSING; apt history 0 Start-Date Nov 20 19:/20:; birth-time scan BỊ CHẶN; dpkg rotated beyond .1 không tồn tại; ctime scan 351 file, 0 neo mới); cửa giữ nguyên R 2,56251–2,66817 s; J 2,566–2,80753 s; n ứng viên GIỮ 27/28 (28/29 nếu #78 được chấp nhận); n chính thức GIỮ 14.
- **Verdict #56 (m) VẪN CÓ ĐIỀU KIỆN theo quyết (e) đợt 157 + quyết (d)/(e) đợt 159 + quyết (d)/(e) đợt 160 + quyết (d)/(e) đợt 161 + quyết (f) đợt 162 + quyết (f) đợt 163 + quyết (f) đợt 165 + quyết (f) đợt 166 + quyết (e) đợt 167 + quyết (e) đợt 168 + quyết đợt 169** — chờ parent chốt J: nếu J ≥ 2.807 s → #56 KHÔNG phải điểm dữ liệu → n ứng viên = 27 (nhánh khuyến nghị, đã cộng #74, chưa cộng #78); nếu J < 2.807 s → #56 là điểm ÂM → n = 28 (chưa cộng #78). Quyết (d) đợt 160 cho phép giữ có điều kiện vô hạn — chấp nhận được. T7 chỉ ghi nhận, KHÔNG tự chọn nhánh.
- T2-170 thêm: mù **#96? (#64) VẪN MỞ** (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — y hệt T2-164→T2-169, lần thứ sáu liên tiếp không đổi một giây; S/T đóng; U đóng theo union); mù **#88? VẪN MỞ** (hole-recheck lần thứ mười bốn: 337 hit, 0 mốc mới); mù **#95? (#63) MỞ**; mù **#94? (#62) MỞ**; mù **#77? VẪN MỞ**; CERT/FULL chính thức GIỮ 76/91. INSIDE: **#77 INSIDE dải FULL123** [07:58:29Z, 09:57:51Z] (biên 1.523/5.639 s) NHƯNG **NGOÀI FULL122 còn hiệu lực** (muộn 1.528 s) — chuỗi tiếp tục dài 4; **#78 INSIDE dải FULL124** [08:49:59Z, 10:49:10Z] (biên 1.479/5.672 s) → chuỗi tiếp tục dài 5; đối chiếu FULL123: CŨNG INSIDE (biên 4.569/2.593 s) — hai dải ĐỒNG THUẬN (lần đầu); **chuỗi mới từ #73 dài 5** (#74–#78); FULL121/FULL122 kiểm lại độc lập: **ĐẠT** (nợ §10.5 (ix) aggregate 169 đã trả). T7 chỉ ghi nhận các verdict T2, KHÔNG tự tính INSIDE/CERT/FULL.
- Lệch khung: **#77 KHÔNG OVERLAP; #78 OVERLAP thứ bảy** (watcher-169 poll cuối 09:14:49Z (+11 s, nhãn boot cũ); sampler-169 dòng c44cc3ba cuối 09:14:20Z (−18 s), dòng e298bb52 đầu 09:16:09Z (+91 s); /proc/1 mới 09:14:49.824Z (+11,824 s, đến SAU poll cũ 0,824 s → khoảng neo "thật" [11; 11,824] KHÔNG RỖNG, rộng 0,824 s — khác #76 RỖNG); **#79 KHÔNG OVERLAP** (sampler-169 dòng e298bb52 cuối 10:54:11Z (−1.014 s); watcher-169 đã chết từ #78; sampler-170 dòng đầu 11:38:04Z (+1.619 s)) — T2-170. T7 chỉ ghi nhận.

### 2.5 Run 170 — Jitter 0 s, 0 lần viết lại, vẫn `running` lúc đóng cờ

Run 170 (`439b9d87-c422-4067-ac09-665920305bfc`, sched 1795347351 = 11:35:51Z 22/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795347351 | 11:35:51Z 22/11 |
| started_at | 1795347351 | 11:35:51Z — **jitter 0 s** |
| worker_claimed_at | 1795347351 | 11:35:51Z (started + 0 s) |
| worker_boot_generation | cron_boot_f0510b465f88417f87347e8c43c00dc9 | boot #79 |
| Hạn ngân sách (started gốc + 10.800 s) | 1795358151 | 14:35:51Z 22/11 |

- 9 lần đọc DB trong phiên (đọc #1–#9, 11:37Z–14:02Z): run 170 `running` ở mọi lần đọc; started_at KHÔNG đổi lần nào, claimed_at KHÔNG đổi lần nào. **0 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay): đọc #3 (12:03:41Z) 1.670 s, còn 9.130 s tới hạn; đọc #4 (12:28:53Z) 3.182 s, còn 7.618 s; đọc #5 (12:54:03Z) 4.692 s, còn 6.108 s; đọc #6 (13:19:15Z) 6.204 s, còn 4.596 s; đọc #7 (13:39:39Z) 7.428 s, còn 3.372 s; đọc #8 (13:51:46Z) 8.155 s, còn 2.645 s; đọc #9 (14:01:57Z) 8.766 s, còn 2.034 s tới hạn ngân sách 14:35:51Z. **Kết cục thuộc T7-171** (hạn cứng đóng đợt 170 là 14:30Z, trước hạn run 170 14:35:51Z).
- Run 170 dispatch trên boot #79 (start sau btime #79 1.486 s trên boot #79). **Jitter 0 s** — lần thứ hai mươi ba liên tiếp run vcut jitter 0 (169 là lần thứ hai mươi hai).
- Events run 170 tới lúc đóng cờ: T7 không liệt kê events run 170 trong LIMITS này (chỉ đọc row job_runs 9 lần; events đầy đủ thuộc T7-171 khi run có kết cục). Không suy đoán.

### 2.6 Slot HB/DR trong cửa 11:20Z → 14:02Z 22/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH HOÀN TOÀN

Cửa kiểm ~2h25' (9 lần đọc DB; thừa quy tắc "kiểm 3 lần trước khi kết luận THIẾU").

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:20:50 (11:20:50Z) | 080659ea | 11:15:34 | **−316 s** | CÓ |
| 18:50:50 (11:50:50Z) | 2b241b6b | 11:45:34 | **−316 s** | CÓ |
| 19:20:50 (12:20:50Z) | ee1e298d | 12:15:34 | **−316 s** | CÓ |
| 19:50:50 (12:50:50Z) | f48453c0 | 12:45:34 | **−316 s** | CÓ |
| 20:20:50 (13:20:50Z) | 5b247f61 | 13:15:34 | **−316 s** | CÓ |
| 20:50:50 (13:50:50Z) | 785e4e94 | 13:45:34 | **−316 s** | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started. **Toàn −316 s — KHÔNG có ngoại lệ −315 s như slot 08:50:50Z đợt 169.** 0 muộn mới — muộn HB lũy kế GIỮ 9 (đợt thứ chín liên tiếp vắng muộn mới).
- HB 11:20:50Z dispatch 11:15:34Z, tức 269 s sau btime #79 (11:11:05Z) trên boot mới #79, đúng mẫu :15:34Z — daemon boot mới dispatch bình thường.
- Slot HB 11:20:50Z đã dispatch trước khi T7-170 mở phiên đọc đầu (11:37Z) — T7 chỉ đọc lại đối chiếu, KHÔNG bỏ. Slot HB 14:20:50Z chưa dispatch lúc đóng cờ — thuộc cửa T7-171.

**Deterministic-doctor (lưới :00:00Z): 3/3 có, 0 thiếu mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 19:00 (12:00Z) | 8219c1d0 | 12:00:00 | 0 s | CÓ |
| 20:00 (13:00Z) | 086aa25a | 13:00:00 | 0 s | CÓ |
| 21:00 (14:00Z) | 74a7701e | 14:00:00 | 0 s | CÓ |

- Cả 3 đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Slot DR 11:00Z đã đếm ở đợt 169 — không đếm lại. DR 12:00Z dispatch trên boot #79. DR 14:00Z dispatch 2h48m55s sau btime #79 trên boot #79.
- Cửa này chỉ có 3 slot DR (đợt 169 có 3) — mẫu số lũy kế cộng đúng +3, không phải thiếu slot.

### 2.7 Số hiệu reboot + đối chiếu chéo các luồng đợt 170 (chỉ ghi nhận)

- Chuỗi boot sau #55 theo T7 (mỗi boot xác minh bằng boot_id + btime + journal + last/wtmp + bằng chứng DB): #56 = 348dab54 (19:32:47Z, giờ thật), #57 = bcbaa3ad (21:05:15Z, giờ thật), #58 = 28366bd0 (23:06:08Z, giờ thật), #59 = eec65561 (01:33:47Z, giờ thật), #60 = e590ae0a (03:05:59Z, giờ thật), #61 = 52c957d5 (05:25:49Z, giờ thật), #62 = 39d46ba0 (07:59:29Z, giờ thật — XÁC NHẬN quyết (o) đợt 161), #63 = 94d22520 (10:30:42Z, giờ thật — XÁC NHẬN quyết (p) đợt 161), #64 = d9a8d1ce (11:15:18Z, giờ thật — XÁC NHẬN quyết (o) đợt 162), #65 = 1c1cf10c (14:34:57Z, giờ thật — XÁC NHẬN quyết (d) đợt 163), #66 = edb2acdb (16:06:45Z, giờ thật — XÁC NHẬN quyết (e) đợt 163), #67 = f1d4ce1a (17:33:27Z, giờ thật — T0/T2/T5/T7-164 xác minh độc lập, chờ parent xác nhận), #68 = 0c8a94aa (18:06:30Z, giờ thật — T7-164 xác minh 9 nguồn; T2-165 đối chiếu ĐỒNG Ý DƯƠNG; parent quyết (e) đợt 165 GIỮ DƯƠNG), #69 = 9a1a9319 (20:09:31Z, giờ thật — T0/T2/T5/T7-165 xác minh độc lập; parent quyết (d)/(f) đợt 165 XÁC NHẬN số hiệu + DƯƠNG), #70 = d1ddd946 (22:05:25Z, giờ thật — T7-165 xác minh 9 nguồn; T0-166 xác minh đầy đủ 9 nguồn; parent quyết (d)/(n) đợt 165 XÁC NHẬN số hiệu + CHẤP NHẬN ứng viên DƯƠNG), #71 = ea73ac4f (00:08:00Z, giờ thật — T7-166 xác minh 9 nguồn; parent quyết (d)/(f) đợt 166 XÁC NHẬN số hiệu + CHẤP NHẬN DƯƠNG; T2-167 đối chiếu độc lập ĐỒNG Ý DƯƠNG), #72 = 9e089ef6 (02:05:05Z, giờ thật — T10-166 xác minh btime + uptime + journal + wtmp; parent quyết (d) đợt 166 XÁC NHẬN số hiệu + CHẤP NHẬN DƯƠNG (quyết (f) đợt 167); **T0-167 xác minh bổ sung chỉ 7/9 nguồn** — 2 nguồn không khôi phục được), #73 = b643911f (02:28:01Z, giờ thật — T7-167 + T0-167 xác minh 9 nguồn; parent quyết (d) đợt 167 XÁC NHẬN số hiệu), #74 = 194efd93 (04:05:29Z, giờ thật — T7-167 xác minh 9 nguồn; parent quyết (d) đợt 167 XÁC NHẬN số hiệu; T2-168 đối chiếu độc lập ĐỒNG Ý DƯƠNG; parent quyết (f) đợt 168 CHẤP NHẬN DƯƠNG), #75 = 576ca271 (05:32:46Z, giờ thật — T7-168 + T0-168 xác minh 9 nguồn; parent quyết (d) đợt 168 XÁC NHẬN số hiệu), #76 = f2b97695 (07:32:23Z, giờ thật — T7-168 xác minh 9 nguồn trong phiên; parent quyết (d) đợt 168 XÁC NHẬN số hiệu; (m) KHÔNG PHẢI ĐIỂM theo quyết (e) đợt 168), #77 = c44cc3ba (08:23:52Z, giờ thật — T7-169 + T0-169 xác minh 9 nguồn; parent quyết đợt 169 XÁC NHẬN số hiệu; (m) KHÔNG PHẢI ĐIỂM theo quyết đợt 169), #78 = e298bb52 (09:14:38Z, giờ thật — T7-169 xác minh 9 nguồn trong phiên; T0-170 xác minh 9 nguồn — KHỚP gap 3.046 s; chờ parent xác nhận; (m) ứng viên DƯƠNG — T2-170 đối chiếu độc lập: DƯƠNG), #79 = 5df1871f (11:11:05Z, giờ thật — T7-170 + T0-170 xác minh 9 nguồn; chờ parent xác nhận; (m) KHÔNG PHẢI ĐIỂM — T0-170 + T2-170 đối chiếu độc lập ĐỒNG Ý).
- Đối chiếu chéo (đọc cờ, chỉ ghi nhận — T7 không kiểm lại công việc luồng khác):
  - **T0-170** (cờ ~11:41Z): #79 xác minh 9/9 nguồn; gap #78→#79 = 6.987 s — KHỚP T7; run 169 SUCCEEDED 11:17:44Z (2 lần viết lại, margin 1.087 s, wall 9.713 s, claimed→finished 35 s, 8 event) — KHỚP T7 từng số; **(m) #79 KHÔNG PHẢI ỨNG VIÊN** (requeue +251,007 s) — KHỚP lean T7; marker sống qua **31 reboot #49–#79**; POSTBOOT_PASS #78 KHÔNG CÓ, #79 CHƯA CÓ lúc đóng; cửa sổ chết #78 = (11:08:54Z, 11:11:05Z] = 131 s; O8 đợt 169 KHỚP TỪNG MD5 với GAP §98; /tmp/.X11-unix TRỐNG; **F-170-T0-1: T10-169 khẳng định sai "boot lúc đóng e298bb52, không reboot mới"** — #79 xảy ra 226 s TRƯỚC khi .done/GAP của T10 được viết (11:14:51Z); GAP §98 cần đính chính (giao T10-170); F-170-T0-2 (dpkg.log ephemeral theo boot — 1.545 dòng đã mất, chỉ còn 2 dòng trên #79); F-170-T0-3 (actor dpkg 11:35:39Z chưa xác định); F-170-T0-4 (tự kiểm X11 — đã kiểm lại: TRỐNG).
  - **T2-170** (cờ ~12:1xZ): **(m) #78 DƯƠNG** (đối chiếu độc lập, DB tươi 11:38–11:42Z — requeue +40,693 s) — KHỚP T7-169; **(m) #79 KHÔNG PHẢI ĐIỂM** (requeue +251,007 s) — KHỚP lean T7; run 169 số liệu KHỚP T7 từng số; **FULL121/FULL122 kiểm lại độc lập: ĐẠT**; #77 INSIDE FULL123 → chuỗi dài 4; #78 INSIDE FULL124 → **chuỗi mới từ #73 dài 5**; **#56 lần thứ MƯỜI BA không thu hẹp được**; mù #96? VẪN MỞ; mù #88? VẪN MỞ (hole-recheck lần 14: 337 hit, 0 mới); CERT/FULL GIỮ 76/91; lệch khung: #77 KHÔNG OVERLAP, **#78 OVERLAP thứ bảy**, #79 KHÔNG OVERLAP; F-170-T2-1..12 (trong đó F-170-T2-5: counterfactual #78 MIXED; F-170-T2-7: claimed→finished 35 s; F-170-T2-8: requeue #79 trễ ~6× #78).
  - **T5-170** (cờ 11:53Z): **POSTBOOT_PASS #79 ĐÃ CÓ 11:49:14Z** (boot+38m09s, replay-đầy-đủ, poll=0, verify độc lập 11/11 gói + 5/5 lib, GST 269, ledger 170/170); **POSTBOOT_PASS #78 KHÔNG CÓ — boot lọt thứ 14**; watcher-170 START 11:42:42Z pid 20516 ALIVE; khoảng không-watcher 8.873 s; **F-170-T5-1 (PHÁT HIỆN CHÍNH): poll cuối watcher-169 09:14:49Z MUỘN HƠN btime #78 11 s** — có thể ảnh hưởng (m) #78, giao T2-170 + parent (T2-170 đã xử lý ở F-170-T2-5); ENOSPC #79: 11 dòng (số đếm trước dòng thứ 12 — T9 đóng băng 39 dòng, không mâu thuẫn); X11: 3 socket X193/X194/X195 mtime 11:44Z — giao T8-170 dọn; điều tra replay #75 ĐÃ GHI NHẬN ĐÓNG theo quyết parent (j) đợt 169, không mở lại; B4 GIỮ NGUYÊN (0 probe dpkg); hướng (3) VẪN ĐỨNG lần thứ 17.
  - **T9-170** (cờ 13:49Z): headroom 2 lúc đóng — dưới ngưỡng lần thứ 30 liên tiếp (dao động 0→2→0→2 trong phiên, lần đầu quay lại 0 sau khi lên 2); **cửa sổ thoáng sau reboot KHÔNG QUAN SÁT ĐƯỢC lần thứ 3 liên tiếp (168+169+170)**; **E-173 KẾT THÚC trong khoảng mù — GIỮ 57 mẫu**; **E-174 MỚI** (47 mẫu, đang ghim lúc đóng — kết cục thuộc T9-171); ENOSPC 39 dòng trên #79 — đợt thứ 19 liên tiếp có lỗi thật; birefnet 0 thử lần thứ 24; **lượt yên #39 HỢP LỆ — chuỗi 33→34**; T8 O8 PASS 3/3 trên #79, đề xuất chuỗi FULL PASS 21→22; harness 5/6 + 1 kẹt thật 84l10 (chuỗi "P3 không kẹt" 4→0 ĐỨT); (1c') giữ nguyên, 0 FP.
  - T1/T4/T6/T8-170 đã đóng cờ (chưa đọc chi tiết — giao T10-170 tổng hợp).
- Mù đi kèm: #96? (#64) VẪN MỞ (T2-170 theo dõi tiếp); #95? (#63) MỞ theo quyết (b) đợt 163; #94? (#62) MỞ theo quyết (b) đợt 162; #88? VẪN MỞ (hole-recheck lần thứ mười bốn: 337 hit, 0 mốc mới); #77? VẪN MỞ. CERT/FULL chính thức GIỮ 76/91. INSIDE: #77/#78 theo T2-170 (chuỗi mới từ #73 dài 5 — giao parent quyết theo dải nào). **Lệch khung #77/#78/#79 theo T2-170** (xem §2.4). POSTBOOT_PASS #79 ĐÃ CÓ 11:49:14Z (T5-170, replay-đầy-đủ); POSTBOOT_PASS #78 KHÔNG CÓ — boot thứ 14 không cờ; POSTBOOT_PASS #77 ĐÃ CÓ 08:46:44Z (T5-169, replay-đầy-đủ); #75 còn (mode repair). Marker sống qua 31 reboot #49–#79 (T0-170 đếm độc lập 31). Watcher-170 pid 20516 ĐANG CHẠY trên #79 lúc T5 đóng — ALIVE tới hạn cứng 14:30:00Z. Khoảng không-watcher sau #78: 8.873 s (poll cuối watcher-169 09:14:49Z → START watcher-170 11:42:42Z).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 169/170 đầy đủ; events lọc theo run_id; requeue theo cửa thời gian; runs spanning btime — cả lọc và không lọc). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop. Feed-pulse: sched == started mọi lượt, lịch :41:54Z ổn định — là lịch cấu trúc của job, KHÔNG dùng làm mốc neo đồng hồ.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây), đối chiếu bằng `date -u -d @<epoch>` — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1: phụ lục chỉ viết bằng script, không gõ tay; epoch slot luôn kiểm bằng `date -u` TRƯỚC khi truy vấn). Số giây requeue lấy từ `created_at` timestamptz trực tiếp (vd 11:15:16.007Z), không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3) + ghi chú đứng quyết (e) đợt 165: dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối (khung giờ boot mới); dữ kiện khung giờ boot cũ không đổi verdict (m).** Đợt này: run 169/170 dispatch sau khi sửa đồng hồ (#56) nên epoch DB run 169/170 ở khung thật; btime #79 xác minh giờ thật nhiều bên độc lập (T0/T2/T5/T7 + Cloudflare); spanning #79 = 0 là ARTIFACT viết-lại-tự-loại — verdict NGOÀI DẢI dựa trên EVENTS, không dựa trên spanning (xem §2.2); spanning #78 = 0 là ARTIFACT tương tự (xem §2.3).
4. Cửa kiểm đợt này ~2h25' (11:37Z → 14:02Z 22/11), đủ 6 slot HB + 3 slot DR + run vcut 169 (kết cục) và 170 (theo dõi). Chín lần đọc DB đầy đủ (đọc #1–#9); run 169 được đọc đầy đủ 2 lần khớp hoàn toàn nhau ở mọi trường (đọc #1/#9) + events đọc 2 lần khớp + T0/T2-170 đối chiếu số học khớp; run 170 được đọc đầy đủ 9 lần (started_at/claimed_at không đổi lần nào); quy tắc "kiểm 3 lần trước khi kết luận THIẾU" đã thỏa thừa (DR 14:00Z: chưa dispatch lúc đọc #8 13:51Z — đọc #9 xác nhận có, không kết luận thiếu vội).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 11:20:50Z + DR 12:00Z thuộc cửa 170 (sau kiểm cuối T7-169 lúc 11:05Z; HB 11:20:50Z T7-169 giao lại rõ trong LIMITS). HB 14:20:50Z + DR 15:00Z thuộc cửa T7-171.
6. **0 sleep bị SIGTERM giết trong phiên này** (7/7 sleep hoàn thành: 5 sleep 1500 s + 1 sleep 1200 s + 1 sleep 700 s + 1 sleep 600 s); ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2 đã áp dụng). Boot KHÔNG đổi trong phiên (5df1871f suốt 11:37Z → 14:02Z) — lần đầu tiên kể từ đợt 163 không có reboot trong phiên T7 (đợt 164: #68 giết sleep; 165: #70; 166: #71; 167: #74; 168: #76; 169: #78 — chuỗi 6 đợt liên tiếp có sleep bị giết DỪNG ở đợt 170).
7. T7 đóng cờ ~14:0xZ — trễ ~5' so với hạn cờ ~14:00Z (để bắt slot DR 14:00Z + viết LIMITS — cùng mẫu T7-169 trễ ~5' để bắt slot DR 11:00Z, T7-168 trễ ~7' để bắt slot DR 08:00Z), trong hạn cứng 14:30Z (~25' còn). Run 170 vẫn running lúc đóng cờ — kết cục thuộc T7-171 (hạn ngân sách 14:35:51Z).
8. **Phụ lục số liệu (§7) viết bằng script** `appendix170.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 170 trong NOTES đều tính bằng script (xem F-170-T7-1). LIMITS chỉ dùng số từ appendix170.txt — không lọt số sai nào vào LIMITS.

## 4. Cập nhật lũy kế (nối tiếp đợt 169, cùng phương pháp)

- Heartbeat: 44/405 → **44/411 slot thiếu** (cửa sổ 14/11 07:50:50 → 22/11 20:50:50 +07). Kiểm toán cửa sổ: 405 + 6 slot mới = 411 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 49/274 → **49/277 slot thiếu** (cửa sổ 11/11 09:00 → 22/11 21:00 +07). Kiểm toán: 274 + 3 = 277 ✓. Số thiếu +0.
- Tỉ lệ thiếu lũy kế: HB 44/411 = 10,7% (giảm từ 10,9% — 0 thiếu mới); DR 49/277 = 17,7% (giảm từ 17,9% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ chín liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 169: SUCCEEDED theo hồ sơ daemon (wall 9.713 s, margin 1.087 s)** — 2 lần đọc DB đầy đủ khớp nhau + events đầy đủ (8 event, 0 event sau succeeded eid 10060) + T0/T2-170 đối chiếu số học khớp. Margin xếp thứ 12/20 hẹp nhất trong chuỗi từ đợt 150; 2 lần viết lại (#78 + #79), claimed→finished 35 s — **NGOÀI họ 6–11 s, NGOÀI ca 60+ s** (ghi nhận, không suy đoán nguyên nhân).
2. **Run 169 BỊ reboot #79 viết lại lần 2** — run đang chạy tại btime, finish 399 s SAU btime, vẫn đúng hạn (margin 1.087 s). (m) #79 KHÔNG PHẢI ĐIỂM — T0-170 + T2-170 đối chiếu độc lập ĐỒNG Ý.
3. **Reboot #79 (btime 11:11:05Z, boot 5df1871f): TRƯỚC khi đợt mở 24m46s, giờ thật, KHÔNG nghịch lý đồng hồ.** Gap #78→#79 = 6.987 s. Số hiệu #79 theo đếm tuần tự — T0-170 chứng nhận 9 nguồn; chờ parent xác nhận. Đối chiếu độc lập: T0-170 xác minh 9/9 nguồn — KHỚP T7.
4. **Điểm (m) #78: ỨNG VIÊN DƯƠNG (requeue +40,693 s TRONG dải 33–49,8 s) — T2-170 đối chiếu độc lập: DƯƠNG.** **Caveat MỚI F-170-T5-1:** poll cuối watcher-169 muộn hơn btime #78 11 s — nếu btime dịch +11 s thì requeue → +29,7 s, NGOÀI dải; T2-170 đã xử lý ở F-170-T2-5 (counterfactual MIXED, verdict DƯƠNG theo quy tắc btime + tiền lệ #71). T7 chỉ ghi nhận, KHÔNG phán lại. Đối chiếu độc lập + phân loại thuộc T2-170 + parent quyết — T7 KHÔNG tự phán, KHÔNG tự cộng/trừ n. Nếu parent CHẤP NHẬN: n ứng viên 27→28 / 28→29. Đây là ứng viên DƯƠNG đầu tiên kể từ #74.
5. **Điểm (m) #79: KHÔNG PHẢI ĐIỂM (requeue +251,007 s NGOÀI dải trên biên 201,2 s)** — T0-170 + T2-170 đối chiếu độc lập ĐỒNG Ý; parent quyết cuối. n không đổi vì #79.
6. **Điểm (m) #77: KHÔNG PHẢI ĐIỂM — parent ĐÃ QUYẾT (đợt 169), T7 chỉ ghi chú tham chiếu, KHÔNG mở lại.** **Điểm (m) #76: KHÔNG PHẢI ĐIỂM — parent ĐÃ QUYẾT (quyết (e) đợt 168), T7 chỉ ghi chú tham chiếu, KHÔNG mở lại.**
7. **Điểm (m) #74: DƯƠNG ĐÃ CHẤP NHẬN (quyết (f) đợt 168).** n ứng viên 27 / 28; n chính thức GIỮ 14.
8. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-170 không thu hẹp được cửa lần thứ mười ba: R 2,56251–2,66817 / J 2,566–2,80753 s) — chờ parent chốt J (quyết (d)/(e) đợt 163 + quyết (f) đợt 166 + quyết (e) đợt 167 + quyết (e) đợt 168 + quyết đợt 169 vẫn đứng). T2-171 tiếp tục thu hẹp cửa (tìm neo mới).
9. **Cửa slot: HB 6/6 + DR 3/3, 0 thiếu, 0 muộn — CỬA LÀNH HOÀN TOÀN (đợt thứ chín liên tiếp).** Lũy kế: HB 44/411, DR 49/277. Muộn HB lũy kế GIỮ 9. Jitter run vcut 0 s lần thứ 23 liên tiếp. Toàn bộ 6 slot HB đều −316 s (không có ngoại lệ −315 s như đợt 169).
10. **Run 170 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.766 s, còn 2.034 s tới hạn ngân sách 14:35:51Z; 0 lần viết lại) — kết cục thuộc T7-171.
11. **T7 đóng cờ trễ ~5' so với hạn cờ ~14:00Z** (để bắt slot DR 14:00Z + viết LIMITS — cùng mẫu T7-169 trễ ~5' để bắt slot DR 11:00Z, T7-168 trễ ~7' để bắt slot DR 08:00Z) — trong hạn cứng 14:30Z. T7 không bỏ slot nào trong cửa.
12. **Mù #96? (#64) VẪN MỞ** theo T2-170 (R file 1.238 s / union-A 1.222 s / union-B 1.211 s — y hệt lần thứ sáu liên tiếp không đổi một giây). **Mù #95? (#63) MỞ** theo quyết (b) đợt 163. **Mù #94? (#62) MỞ** theo quyết (b) đợt 162. **Mù #88? VẪN MỞ** (hole-recheck lần thứ mười bốn: 337 hit, 0 mốc mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91.
13. **INSIDE #77/#78: chuỗi mới từ #73 dài 5** (T2-170; #77 INSIDE FULL123 nhưng NGOÀI FULL122 còn hiệu lực — mâu thuẫn dải còn hiệu lực, cùng mẫu #71; #78 INSIDE cả FULL124 lẫn FULL123 — hai dải ĐỒNG THUẬN lần đầu; T7 chỉ ghi nhận; giao parent quyết theo dải nào). **Lệch khung #77/#78/#79 theo T2-170** (#77 không overlap; #78 OVERLAP thứ bảy; #79 không overlap).
14. **POSTBOOT_PASS #79 ĐÃ CÓ 11:49:14Z (T5-170, replay-đầy-đủ)** — khác #75 mode repair; chờ parent quyết có được tính cho gate (a) không caveat mode repair (đề xuất (b) của T5-170). **POSTBOOT_PASS #78 KHÔNG CÓ** — boot thứ 14 không cờ. **POSTBOOT_PASS #77 ĐÃ CÓ 08:46:44Z (T5-169, replay-đầy-đủ)**. Marker sống qua 31 reboot #49–#79 (T0-170 đếm độc lập 31). Watcher-170 pid 20516 ĐANG CHẠY trên #79 lúc T5 đóng — ALIVE tới hạn cứng 14:30:00Z.
15. **O8 chuỗi WebKit FULL PASS 21→22 — chờ parent ghi nhận** (T8-170 theo T9-170: O8 PASS 3/3 trên boot #79; T7 chỉ ghi nhận, không phán O8). Lượt yên #39 CÓ lượt hợp lệ — chuỗi 33 → 34 (T4-170 theo T9-170).
16. **Headroom 2 (dưới ngưỡng lần thứ 30 liên tiếp); cửa sổ thoáng sau reboot KHÔNG QUAN SÁT ĐƯỢC lần thứ 3 liên tiếp (168+169+170)** (T9-170). **ENOSPC 39 dòng trên #79 (đợt thứ 19 liên tiếp có lỗi thật).** Birefnet 0 thử lần thứ 24. Balloon: **E-173 KẾT THÚC trong khoảng mù — GIỮ 57 mẫu**; **E-174 MỚI** (47 mẫu, đang ghim — kết cục thuộc T9-171); E-172 giữ 3, E-171 giữ 12, E-170 giữ 48, E-169 giữ 20; tổng ghim 47/121 (38,8%).
17. **F-170-T0-1: T10-169 khẳng định sai "boot lúc đóng e298bb52, không reboot mới"** — #79 xảy ra 226 s TRƯỚC khi .done/GAP của T10 được viết (11:14:51Z); GAP §98 cần đính chính (giao T10-170). **F-170-T0-2: dpkg.log ephemeral theo boot** — 1.545 dòng đã mất, chỉ còn 2 dòng trên #79; dpkg.log không còn là nhân chứng xuyên boot.
18. **Harness 5/6 + 1 kẹt thật 84l10** (T9-170) — chuỗi "P3 không kẹt" 4→0 ĐỨT; (1c') giữ nguyên, 0 FP. **0 sleep bị SIGTERM giết trong phiên này** — chuỗi 6 đợt liên tiếp có sleep bị giết DỪNG ở đợt 170.
19. **Mâu thuẫn full boot_id b47f7932: KHÔNG có dữ kiện mới — VẪN ĐỂ MỞ theo quyết parent (g) đợt 143.** G1 + mù #22/#28–#31/#35/#37/#38 G: chờ user quyết. **Birefnet: 0 lần thành công — chỉ thử lại khi RAM đổi** (u2net là fallback chính thức; T9-170: 0 thử lần thứ 24). **Không kiểm lại TTS 39.** ci-security.yml vẫn 403 (chờ user). **T45_thực: KHÔNG mở lại** — verdict run 152 đã được parent GỠ PROVISIONAL ở quyết (d) đợt 154.

## 6. Sai số của chính T7

- **F-170-T7-1 — Sai epoch ref 3 lần đọc trong appendix170.py bản nháp, bắt được trước khi viết LIMITS, KHÔNG lọt vào LIMITS:** refs đọc #3/#4/#5 ghi 1795350221 (12:23:41Z) / 1795351138 (12:38:58Z) / 1795352049 (12:54:09Z) thay vì 1795349021 (12:03:41Z) / 1795350533 (12:28:53Z) / 1795352043 (12:54:03Z) — tuổi run 170 sai +1.200 s / +605 s / +6 s. Phát hiện khi đối chiếu tuổi script với tuổi đã ghi trong NOTES (1.670 / 3.182 / 4.692 s). Đã sửa script + chạy lại + kiểm `date -u` từng ref: KHỚP NOTES. Bài học: ref epoch trong script phải lấy từ timestamp sleep-end đã ghi trong NOTES, không gõ từ trí nhớ (cùng họ F-169-T7-2).
- **F-170-T7-2 — Số sơ bộ btime #79 trong brief (~11:12Z) LỆCH 55 s so với btime thật 11:11:05Z:** brief ghi "btime ~11:12Z". T7 xác minh độc lập 9 nguồn: btime /proc/stat 1795345865 = 11:11:05Z; uptime -s 11:11:05Z; journal first entry 11:11:16Z; wtmp 11:11:16Z. Số brief KHÔNG dùng làm bằng chứng (đúng quy tắc brief: không tin số sơ bộ). Đã ghi rõ cả hai số trong LIMITS để parent thấy độ lệch. Không ảnh hưởng verdict nào (mọi phép tính dùng epoch thật 1795345865; T0-170 + T2-170 xác minh độc lập cùng số).

## 7. Phụ lục số liệu (viết bằng script — xem file kèm)

Phụ lục đầy đủ trong `~/workspace/goals/capcut-clone-video-editor/hidden_files/round170-t7/appendix170.txt` (tạo bằng `appendix170.py` từ epoch thô; đã sửa F-170-T7-1 + kiểm `date -u` từng ref).
