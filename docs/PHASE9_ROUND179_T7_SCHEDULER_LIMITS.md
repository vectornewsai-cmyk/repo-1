# PHASE9 ROUND179 T7 — RUN 178 TIMEOUT (−38 S, CF 7 S — KHÔNG PHẢI CA THỨ MƯỜI) + OUTAGE SCHEDULER 2H20M (3 HB + 2 DR THIẾU, 1 HB MUỘN MỚI +890 S) + REBOOT #95 GIỮA PHIÊN, RUN 179 VIẾT LẠI ×1

- **Luồng:** T7 đợt 179 (lượt cron 00:35:51 +07 24/11/2026 = 17:35:51Z 23/11). Nhiệm vụ theo brief T7-179: (1) kết cục run 178; (2) (m) #93 kiểm lại; (3) cửa slot đợt 179 (DR 18:00Z/19:00Z/20:00Z + HB 20:20:50Z; HB 17:20:50Z trước giờ mở); (4) F-178-T7-3; (5) F-178-T7-4 ghi nhận.
- **Boot trong phiên:** mở phiên đã là **ae2a9a47** (#94, btime 17:17:09Z — **T0-179 XÁC NHẬN 9 nguồn**). **Reboot #95 MỚI GIỮA PHIÊN** (boot 95b483a2, btime 19:10:22Z — T7 xác minh 9 nguồn, phát hiện trong 52 s; giết sleep của T7). **Boot lúc đóng cờ vẫn 95b483a2**.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (run 178/179 đầy đủ; HB/DR theo slot; requeue cửa hẹp #93/#95 — cả hai đã khép lúc đóng; runs spanning btime), LIMITS T7-178 + aggregate 178 §7 + §11 + §12.3 + cờ/LIMITS các luồng đợt 179 (T0/T1/T2/T4/T5/T6/T8/T9 đã đóng — **8/9 cờ có nội dung lúc T7 đóng**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc + script python thuần tính số).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T7 đóng cờ ~20:25Z — trễ ~25' so với hạn cờ ~20:00Z (để kiểm HB 20:20:50Z + xác minh reboot #95 + đối chiếu T8/T9 cuối — cùng mẫu T7-178 trễ ~14' do DR 14:00Z + reboot #93), trong hạn cứng ~20:35Z. T7 không bỏ slot nào trong cửa.

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 178 kết cục? | **`timeout` 14:36:29Z, margin −38 s** (trễ hạn 38 s), wall gốc 10.838 s, **claimed→finished 7 s** | §2.1 |
| Run 178 có phải ca ≥60 s thứ mười? | **KHÔNG — số ca GIỮ 9** (cf 7 s < 60 s; run 175 = thứ chín) | §2.1 |
| Run 178 viết lại mấy lần? | **×1 (#93)**, 5 event, 0 event sau timeout | §2.1 |
| Reboot #94 ảnh hưởng run 178? | **KHÔNG** — #94 (17:17:09Z) xảy ra SAU khi run 178 timeout 2h40m40s | §2.3 |
| (m) #93 kiểm lại? | **+36,248 s — KHỚP T7-178 từng ms**; T2-179 phán CUỐI: DƯƠNG | §2.1/§2.6 |
| Reboot #95 (mới giữa phiên)? | **Boot 95b483a2, btime 19:10:22Z, GIỜ THẬT** (T7 xác minh 9 nguồn, phát hiện trong 52 s); gap #94→#95 = **6.793 s**; số hiệu #95 chờ T0-180 | §2.4 |
| (m) #95? | **DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — requeue +38,743 s TRONG dải; 1 run sống + 1 requeue duy nhất cửa hẹp (đã khép, đếm cuối); KHÔNG sát biên | §2.4 |
| Run 179? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 9.963 s, còn 837 s tới hạn 20:35:51Z); **jitter 0 s**; **viết lại ×1** (#95); claimed không đổi | §2.2 |
| Cửa slot đợt 179? | **Trong cửa: HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — 0 thiếu, 0 muộn.** NHƯNG: **HB 17:20:50Z (trước giờ mở) MUỘN +890 s — muộn mới đầu tiên sau 17 đợt**; khoảng trống giữa đợt: **3 HB + 2 DR THIẾU do outage scheduler 8.406 s** | §2.5 |
| Chuỗi cửa lành 4 lần (175–178)? | **Parent quyết** — trong cửa thì lành lần thứ năm; tính cả HB muộn + slot thiếu ngoài cửa thì ĐỨT tại 179 | §2.5 |
| Đồng hồ lúc mở / trong phiên? | **Cloudflare chênh ~1 s** (lúc mở ~1 s; lúc phát hiện #95 ~1 s, CF nhanh hơn) — khớp các đợt trước | §2.3/§2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–178 — SỐ SLOT THIẾU, chỉ cộng tử số khi có slot thiếu thật): heartbeat **47/472 slot thiếu** (số thiếu +3, mẫu số +13); deterministic-doctor **53/308 slot thiếu** (số thiếu +2, mẫu số +6). Muộn HB lũy kế **9 → 10** (1 muộn mới — đợt đầu tiên có muộn mới sau 17 đợt vắng).

## 2. Bằng chứng

### 2.1 Kết cục run 178 — TIMEOUT 14:36:29Z, margin −38 s, cf 7 s, KHÔNG PHẢI CA THỨ MƯỜI; VIẾT LẠI ×1 (đọc #1 + events đối chiếu trực tiếp + T0/T2-179 đối chiếu độc lập)

Run 178 (`1949f57a-4454-4d02-a323-29ba7dd06bed`, sched 1795433751 = 11:35:51Z 23/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795433751 = 11:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795433751 → **1795439291 = 13:08:11Z** (#93) — KHÔNG đổi sau đó |
| finished_at_utc | 1795444589 = 14:36:29Z (event `timeout` 14:36:29.756Z, eid 10447) |
| status | **`timeout`** — attempt 1, worker_execution_timed_out true |
| error_text | "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run." |
| worker_claimed_at_utc | 1795444582 = 14:36:22Z (finished − 7 s) |
| worker_boot_generation | cron_boot_92e3cfb8508d49a58fc4cdd864e315b5 (boot #93) |
| Wall từ started gốc | 1795444589 − 1795433751 = **10.838 s** (3h00m38s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795444551 = 14:35:51Z — finished TRỄ hạn **38 s (margin −38 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795444551 = 14:35:51Z — **cùng hạn** (jitter 0 s) → margin **−38 s theo cả hai cách tính** |
| Wall từ started viết lại | 1795444589 − 1795439291 = **5.298 s** (1h28m18s thực thi trên boot #93 sau viết lại) |

- Events run 178 (đầy đủ, **đúng 5 event, 0 event sau timeout**): `dispatched` 11:35:51.165Z (10404) + `requeued_after_restart` 13:08:11.248Z (10428) + `dispatched` 13:08:11.642Z (10429) + `reattached_after_restart` 13:08:11.724Z (10430) + **`timeout` 14:36:29.756Z (10447)**. **ĐÚNG 1 LẦN VIẾT LẠI** (#93).
- **Timeout ghi nhận 38 s SAU hạn ngân sách** (14:36:29Z vs hạn 14:35:51Z) — daemon ghi timeout trễ 38 s, cùng mẫu run 177 claimed đổi lúc cuối. T7-178 đọc #9 lúc 14:02:33Z thấy còn 1.998 s; run tiếp tục 33m56s rồi timeout.
- **Chuỗi succeeded 4 run (174 → 175 → 176 → 177) ĐỨT tại 178** — run timeout đầu tiên kể từ chuỗi này (margin các run trước: 174 +721 s; 175 +690 s; 176 +106 s; 177 +1,554 s; 178 −38 s).
- **Claimed→finished = 7 s — KHÔNG thuộc họ ≥60 s.** Claimed_at run 178 đổi lúc cuối thành finished − 7 s (cùng mẫu run 171–177: claimed đổi thành finished − 7 s / − 8 s lúc cuối). Số ca **GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. **Run 178 KHÔNG phải ca thứ mười.**
- **Run 14:35:51Z (lượt closing T10-178, `17c51ba6`) — SUCCEEDED 14:53:32Z** (started 14:36:29Z = đúng giây run 178 timeout; **jitter +38 s**; cf 8 s; wall 1.061 s). Lượt này chỉ chạy T10 đóng sổ đợt 178 (17 phút), không phải đợt lớn — jitter +38 s phản ánh scheduler chờ run 178 timeout xong mới dispatch lượt kế; không tính vào chuỗi jitter 0 s các run đợt (175 → 179).
- T0-179 + T2-179 đối chiếu độc lập: **TIMEOUT 14:36:29Z, margin −38 s, cf 7 s, KHÔNG phải ca ≥60 s, viết lại ×1** — KHỚP T7 từng số. **(m) #93: T2-179 phán CUỐI — DƯƠNG** (+36,248 s, xem §2.6) — kiểm lại của T7 (§2.1, dưới) KHỚP từng ms.
- **(m) #93 kiểm lại (T7-179, độc lập):** requeue duy nhất eid 10428, 13:08:11.24816Z = btime #93 +**36,248 s**; cửa hẹp [13:07:35Z, 13:26:35Z] ĐÚNG 1 requeue (run 178); band (m) [13:08:08Z, 13:08:24,8Z] cùng 1 requeue — **KHỚP T7-178 từng số**. T7 không phân loại cuối (thuộc T2-179 + parent 179); T2-179 đã phán DƯƠNG (CUỐI cấp T2).

### 2.2 Run 179 — vẫn `running` lúc đóng cờ, jitter 0 s, viết lại ×1 (#95), claimed không đổi

Run 179 (`f253dced-0650-4541-9418-88badac6f1ed`, sched 1795455351 = 17:35:51Z 23/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795455351 | 17:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795455351 → **1795461060** | 17:35:51Z → **19:11:00Z** (dịch +5.709 s) |
| worker_claimed_at | 1795455351 | 17:35:51Z (KHÔNG đổi qua 9 lần đọc) |
| worker_boot_generation | cron_boot_32a2a7ed… → **cron_boot_d67600a2…** | #94 → **#95** |
| Hạn ngân sách (started gốc + 10.800 s) | 1795466151 | 20:35:51Z 23/11 |

- **Jitter 0 s** — run 179 dispatch đúng giây sched 17:35:51Z. **Chuỗi jitter 0 s (run đợt): 175 → 176 → 177 → 178 → 179 (5 run liên tiếp).**
- 9 lần đọc DB trong phiên (đọc #1–#9, 17:41Z–20:21Z): run 179 `running` ở mọi lần đọc; started_at gốc KHÔNG đổi ở đọc #1–#5 (17:41Z–19:06Z), đổi lần 1 tại đọc #5b (~19:11Z, sau #95), KHÔNG đổi ở đọc #6–#9; claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): đọc #2 (18:05:40Z) 1.789 s; #3 (18:26:09Z) 3.018 s; #4 (18:51:31Z) 4.540 s; #5 (19:06:55Z) 5.464 s; #5b (19:11:28Z) 5.737 s; #6 (19:27:26Z) 6.695 s; #7 (19:52:54Z) 8.223 s; #8 (20:08:34Z) 9.163 s; #9 (20:21:54Z) **9.963 s, còn 837 s** tới hạn ngân sách 20:35:51Z. Wall từ started viết lại lúc đóng: 4.254 s. **Kết cục thuộc T7-180** (hạn cứng đóng đợt 179 là ~20:35Z, cùng hạn run 20:35:51Z — cùng mẫu run 174/175/176/177/178).
- Events run 179 tới lúc đóng cờ: đúng 4 event — dispatched 17:35:51.044Z (10468) + **requeued 19:11:00.743Z (10490) + dispatched 19:11:00.897Z (10491) + reattached 19:11:01.032Z (10492)**.

### 2.3 Reboot #94 TRƯỚC KHI MỞ PHIÊN (btime 17:17:09Z, boot ae2a9a47) — T0-179 XÁC NHẬN 9 NGUỒN; KHÔNG ẢNH HƯỞNG RUN 178

- **Reboot #94: boot ae2a9a47-2de7-48ef-853d-0023b47bdc0b, btime 1795454229 = 17:17:09Z 23/11.** T7 mở phiên đã thấy boot này (uptime -s 17:17:09Z khớp; /proc/1 mtime +11,378 s; journal idx 0 duy nhất, first entry 17:17:20Z; wtmp begins 17:17:20Z; `last` reboot 17:17 still running; `who -b` 17:17; Cloudflare Date vs local chênh ~1 s, CF nhanh hơn — GIỜ THẬT). **T0-179 ĐÃ XÁC NHẬN 9 nguồn** (cờ 18:14Z; marker sống qua **46 reboot #49–#94** — tăng từ 44 sau #92).
- **Gap #93→#94 = 14.974 s (4h09m34s — DÀI GẤP ĐÔI mẫu ~2 giờ).** Chuỗi gap gần đây: 6.827 / 7.568 / 14.974 s.
- **#94 KHÔNG ảnh hưởng run 178:** run 178 timeout 14:36:29Z; #94 btime 17:17:09Z — **SAU kết cục run 178 đúng 2h40m40s** (17:17:09Z − 14:36:29Z = 9.640 s) và TRƯỚC khi đợt 179 mở (17:35:51Z) 18m42s. Brief giao "ghi rõ ảnh hưởng nếu có" — kết luận: **không có ảnh hưởng nào** (đính chính giả định trong brief rằng #94 "rơi vào lúc run 178 chạy/kết thúc" — không đúng: #94 rơi vào khoảng trống giữa hai đợt).
- **(m) #94: KHÔNG CÓ ĐIỂM** (T0-179: 0 requeue cửa hẹp + cửa rộng). **#93 + #94 KHÔNG giết holder** (T6-179: lock trống 4.107 s trước btime #93, 10.182 s trước btime #94 — chuỗi "không giết holder" từ #69 lên **26 reboot**).
- **POSTBOOT_PASS #94 ĐÃ CÓ 18:03:08Z** (T5-179, repair-sớm-quyết-h, poll=1, dpkg 795 — CÓ caveat repair); **POSTBOOT_PASS #93 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được** (T5-179; watcher-179 pid 61023 ALIVE, hạn 20:35:00Z) → tổng boot không cờ **19 → 20**. Hướng (3) VẪN ĐỨNG lần 26.
- **F-178-T7-4 LÀM RÕ (T0-179):** worker_boot_generation theo daemon start, KHÔNG phải OS boot; daemon restart 1 lần thêm trên #92 (11:09:06Z–11:35:51Z); trigger không xác định được (host-side). T7 chỉ ghi nhận — F-178-T7-4 ĐÃ HẾT ở mức làm rõ cơ chế.

### 2.4 Reboot #95 MỚI GIỮA PHIÊN (btime 19:10:22Z, boot 95b483a2) — RUN 179 VIẾT LẠI LẦN 1 + (m) #95 DƯƠNG ỨNG VIÊN

- **Reboot #95: boot 95b483a2-2c91-4dd1-882b-d8f6481391be, btime 1795461022 = 19:10:22Z 23/11.** Xác minh T7 (lúc phát hiện ~19:11:14Z + kiểm lại lúc đóng ~20:22Z — cả hai lần đều 95b483a2, btime 1795461022): boot_id + btime /proc/stat + `uptime -s` 19:10:22Z (khớp) + /proc/1 mtime 19:10:34.106Z (+12,106 s) + journal idx 0 duy nhất, first entry 19:10:34Z (+12 s) + wtmp begins 19:10:34Z (+12 s) + `last` reboot 19:10 still running + `who -b` 19:10. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 19:11:30 GMT vs 19:11:29 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #95 theo đếm tuần tự — CHỜ T0-180 xác minh 9 nguồn** (T0-179 đóng cờ 18:14Z, TRƯỚC #95; T8-179 + T9-179 cũng ghi #95 giữa phiên, gap khớp).
- **T7 phát hiện #95 trong 52 s sau btime** (btime 19:10:22Z → kiểm đầu 19:11:14Z; sleep bị SIGTERM trùng thời điểm — xem F-179-T7-1).
- **Gap #94→#95 (btime−btime): 1795461022 − 1795454229 = 6.793 s (1h53m13s — trở lại mẫu ~2h).** Chuỗi gap gần đây: 6.827 / 7.568 / 14.974 / 6.793 s.
- **#95 xảy ra TRONG lúc run 179 chạy:** run 179 dispatch gốc 17:35:51Z, btime #95 19:10:22Z (tuổi gốc lúc btime **5.671 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 179)** — theo EVENTS (dispatched trước btime, chưa finish) + truy vấn DB (scheduled ≤ btime AND (finished NULL OR finished > btime): ĐÚNG 1 dòng — run 179).
- **Run 179 BỊ VIẾT LẠI LẦN 1 tại #95:** started 1795455351 → **1795461060 = 19:11:00Z** (dịch **+5.709 s**); boot_gen đổi 32a2a7ed (#94) → **d67600a2** (#95); **claimed_at KHÔNG ĐỔI (1795455351)**; vẫn running, attempt 1, error null.
- **Requeue do #95 (cửa hẹp [19:10:22Z, 19:29:22Z], kiểm sau khi cửa khép hẳn ở đọc #7 ~19:52Z): ĐÚNG 1 DÒNG** — run 179, eid 10490, 19:11:00.743Z. Không job nào khác bị requeue do #95. Band (m) [19:10:55Z, 19:11:11,8Z]: ĐÚNG 1 requeue (cùng dòng).
- **Requeue offset +38,743 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 5,743 s, cách biên TRÊN 11,057 s** (19:11:00.743Z − btime nguyên 1795461022). Reattach +39,032 s; dispatch lần 2 +38,897 s. **(m) #95 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-180 phân loại cuối + parent 180. **KHÔNG sát biên:** offset thật ∈ (37,743 s, 38,743 s] — đều trong band; margin xấu nhất tới biên dưới 4,743 s >> 1 s — **caveat phân số KHÔNG lật được**. T7 chưa có boot_est #95 (T0-180 đo).
- **Requeue NHANH (+38,743 s, cùng mẫu #90 +35,313 s / #93 +36,248 s) — KHÁC #92 muộn bất thường (+459,816 s) và #94 không có điểm;** daemon hồi phục nhanh sau #95.
- Nếu parent CHẤP NHẬN (m) #93 DƯƠNG (T2-179 phán CUỐI) rồi #95 DƯƠNG: n ứng viên **37/38 → 38/39** (số học nối tiếp T2-179; T7 chỉ ghi số học, T2-180 tính chính thức). n chính thức GIỮ 14.
- **Sleep của T7 bị giết theo #95** (xem F-179-T7-1): sleep 1.200 s spawn 19:07:19Z, chết lúc reboot 19:10:22Z sau ~209 s; T7 phát hiện boot mới trong 52 s, 0 số liệu mất, 0 số sai.
- **INSIDE #95 + FULL140 + POSTBOOT_PASS #95 + #95 có giết holder không: thuộc T2-180 / T5-180 / T6-180.** T7 không tự tính INSIDE/CERT/FULL. Watcher-179 pid 61023 (hạn 20:35:00Z) vẫn ALIVE lúc T5 đóng (18:24Z) — nhiều khả năng CHẾT theo #95; T5-180 lo. T8-179 ghi root CÒN NGUYÊN sau #95 (libs 6/6, GST 269, dpkg 1.265), chỉ /tmp bị wipe.

### 2.5 Slot HB/DR — OUTAGE SCHEDULER 8.406 s GIỮA HAI ĐỢT (3 HB + 2 DR THIẾU, 1 HB MUỘN +890 S); TRONG CỬA ĐỢT 179: HB 6/6 + DR 3/3

**Phát hiện lớn của đợt: scheduler im lặng hoàn toàn 15:15:35Z–17:35:39Z (8.406 s = 2h20m06s, 0 run mọi job).** Run cuối trước khoảng im: HB 15:20:50Z started 15:15:34Z. Run đầu sau khoảng im: HB 17:20:50Z + feed-pulse-23, cùng started 17:35:40Z. Reboot #94 (17:17:09Z) nằm TRONG khoảng im lặng. Scheduler hồi phục 18m31s sau btime #94. Feed-pulse-23 (sched 16:41:54Z) chạy bù trễ +3.226 s. T7 không xác định được nguyên nhân outage (host-side) — giao parent/T0-180 xem xét.

**Khoảng trống giữa hai đợt (sau kiểm cuối T7-178 ~14:02Z tới mở đợt 179 17:35:51Z) — 7 slot HB + 3 slot DR mới so với đếm T7-178:**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 21:20:50 (14:20:50Z) | 45f5223a | 14:15:34 | **−316 s** | CÓ |
| 21:50:50 (14:50:50Z) | fbe57291 | 14:45:34 | **−316 s** | CÓ |
| 22:20:50 (15:20:50Z) | 90914d3e | 15:15:34 | **−316 s** | CÓ |
| 22:50:50 (15:50:50Z) | — | — | — | **THIẾU (0 dòng DB)** |
| 23:20:50 (16:20:50Z) | — | — | — | **THIẾU (0 dòng DB)** |
| 23:50:50 (16:50:50Z) | — | — | — | **THIẾU (0 dòng DB)** |
| 00:20:50 (17:20:50Z) | 4e941e98 | 17:35:40 | **+890 s** | **CÓ — MUỘN MỚI** |

- DR khoảng trống: 15:00Z (b2d29ff4) **CÓ, 0 s**; 16:00Z **THIẾU**; 17:00Z **THIẾU** (cả hai 0 dòng DB).
- "Thiếu" ở đây là thiếu thật trong DB (truy vấn SQL trực tiếp, đếm COUNT(*) + truy vấn theo started_at — không phải lịch sử API bị cắt; xem §3.2). 3 slot HB + 2 slot DR thiếu đều nằm trong khoảng im lặng 15:15:35Z–17:35:39Z — **cùng một nguyên nhân (outage), không phải 5 lỗi rời rạc**.
- **HB 17:20:50Z MUỘN +890 s** (started 17:35:40Z, finished cùng giây, succeeded, attempt 1) — thuộc họ muộn cũ (+887 s ×6, +888 s, +889 s, +891 s đợt 161; kỷ lục +1.252 s đợt 129). **Muộn HB lũy kế 9 → 10 — muộn mới đầu tiên sau 17 đợt vắng muộn mới (đợt 162–178).**

**Trong cửa đợt 179 (sau giờ mở 17:35:51Z) — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s):**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 00:50:50 (17:50:50Z) | 45a31600 | 17:45:34 | **−316 s** | CÓ |
| 01:20:50 (18:20:50Z) | c9faee5b | 18:15:34 | **−316 s** | CÓ |
| 01:50:50 (18:50:50Z) | a5721b98 | 18:45:34 | **−316 s** | CÓ |
| 02:20:50 (19:20:50Z) | ea4e0ed5 | 19:15:34 | **−316 s** | CÓ |
| 02:50:50 (19:50:50Z) | a11f1b9e | 19:45:34 | **−316 s** | CÓ |
| 03:20:50 (20:20:50Z) | ac92f535 | 20:15:34 | **−316 s** | CÓ |

- Cả 6 slot `succeeded`, attempt=1, error_text=null. **Toàn −316 s.** 0 muộn mới trong cửa.
- HB 17:50:50Z + 18:20:50Z + 18:50:50Z dispatch trên boot #94 (sau btime #94 28m25s / 58m25s / 1h28m25s); HB 19:20:50Z + 19:50:50Z + 20:20:50Z dispatch trên boot #95 (sau btime #95 5m12s / 35m12s / 1h05m12s).

**Deterministic-doctor trong cửa: 3/3 có — DR 18:00Z + 19:00Z + 20:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 01:00 (18:00Z) | e23c13db | 18:00:00 | 0 s | CÓ |
| 02:00 (19:00Z) | cf74786b | 19:00:00 | 0 s | CÓ |
| 03:00 (20:00Z) | 90dcb6b5 | 20:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 18:00Z CÓ, đúng giờ** — nợ chính của T7-179 (cùng DR 19:00Z + DR 20:00Z), nay đã trả. DR 18:00Z + 19:00Z dispatch trên boot #94 (sau btime #94 42m51s / 1h42m51s); DR 20:00Z dispatch trên boot #95 (sau btime #95 49m38s).
- **Cửa slot TRONG đợt 179: LÀNH (HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn).** Nhưng chuỗi "cửa lành hoàn toàn" 4 lần (175–178) có tính tiếp không — **parent quyết**: HB 17:20:50Z ngay trước giờ mở MUỘN +890 s, và 3 HB + 2 DR thiếu trong khoảng trống giữa đợt (outage) — nếu tính cả các slot ngoài cửa thì chuỗi ĐỨT tại 179; nếu chỉ tính cửa trong đợt thì lành lần thứ năm. T7 không tự quyết chuỗi; T10-179 ghi cả hai cách đếm.

### 2.6 Đối chiếu chéo các luồng đợt 179 (chỉ ghi nhận, từ cờ `.done` + LIMITS trên đĩa)

- **T0-179** (cờ 18:14Z): **#94 XÁC NHẬN 9 nguồn** (nợ đợt 178 đã trả; marker sống qua **46 reboot #49–#94**); **#93 XÁC NHẬN** (T7-178 9 nguồn + T4-178 độc lập + T0-179 đối chiếu DB); **(m) #94: KHÔNG CÓ ĐIỂM** (0 requeue cửa hẹp + cửa rộng); **(m) #93 +36,248 s TRONG band — khớp T7-178**; **O8 trên #94 PASS 3/3** (WebKit 21/21 ×2 md5 `11a6f1bf`/`b32e23b8` + Chromium 21/21 md5 `d58b9a3c`, 18:06:38–18:09:23Z, sau POSTBOOT_PASS #94 18:03:08Z); F-178-T7-4 LÀM RÕ (worker_boot_generation theo daemon start). LIMITS 13.380 B.
- **T1-179** (cờ 17:48Z): **verify đợt 178: PASS** — đợt 178 = 10/16/16/14; lũy kế 111–178 = 668/1.165/1.012/834; chờ push 166–178 = 130/186/173/170; tái kiểm 111–177 = 658/1.149/998/820 — khớp lần thứ 78 liên tiếp; 0 file thiếu trên 3.817 đường dẫn. F-179-T1-1/F-179-T1-2 (lệch prose, giao T10-179 sửa nếu parent đồng ý).
- **T2-179** (cờ 18:29Z): **(m) #93 DƯƠNG (CUỐI cấp T2)** — +36,248 s (khớp T7-178/T7-179 từng ms); **n ứng viên 36/37 → 37/38** (nếu parent chấp nhận); **INSIDE #93 TRUE (FULL139) — chuỗi 3 → 4** (mâu thuẫn lần thứ 8); **mù #96?/#95?/#94?/#88?/#77? VẪN MỞ** (hole-recheck lần 23 NEW=0); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 22** (6 hướng DB mới đều âm tính; tổng 83 hướng); 0 chồng chéo (chờ poller T4 thoát hẳn mới walk mù). LIMITS 30.405 B.
- **T4-179** (cờ 18:24Z): **lượt yên #48: CÓ lượt hợp lệ** — attempt1-ae2a9a47 20/20 + B 5/5, tickCost median 49,5 ms — **chuỗi lượt yên hợp lệ 41 → 42** (ngân sách 1/3); gate0=T5 (POSTBOOT_PASS #94); **0 vi phạm theo T4** (F-179-T4-5 ghi nhẹ 18:13:20Z — parent quyết). LIMITS 34.780 B.
- **T5-179** (cờ 18:24Z, 237 B): **POSTBOOT_PASS #94 ĐÃ CÓ 18:03:08Z** (repair-sớm-quyết-h, poll=1); **#93 KHÔNG CÓ cờ — ĐÃ XÁC NHẬN, KHÔNG bù được** (tổng boot không cờ **19 → 20**); watcher-179 pid 61023 ALIVE, hạn 20:35:00Z; hướng (3) VẪN ĐỨNG lần 26.
- **T6-179** (cờ 18:01Z): **(A) 120/120 lần thứ 29** (tổng 3.480/3.480); **#93 + #94 KHÔNG giết holder — chuỗi "không giết holder" từ #69 lên 26 reboot**; **prune lần 54: xóa 2 file**, queue 102 → 100 file. LIMITS 37.059 B.
- **T8-179** (cờ 19:38Z): **harness WebKit 2/3** (84l10 PASS, **85m4 KẸT mới ở resetPlayhead0:320**, 86n2 PASS) + Chromium 3/3; **O8 PASS 3/3 trên #94**; kẹt cộng dồn 24 → 25; **pilot 86n2-hb128 WebKit SẠCH (lần đầu live)** + Chromium SẠCH — driver GIỮ NGUYÊN; **(c')/(f') 0 kích hoạt — BỎ LỠ kẹt 179** (F-179-T8-5); **F-178-T8-6 diag W2-setup**: lần 1 bị #95 giết, lần 2 trên #95 PASS; **F-178-T8-9 + F-178-T8-8 ĐÃ XONG; F-178-T8-10 ĐÃ HẾT**; **reboot #95 giữa phiên** (gap 6.793 s — khớp T7); checklist (o) 21/21. LIMITS 37.744 B (dưới giới hạn 24 B).
- **T9-179** (cờ 20:02Z, trễ ~2'): **headroom 0** (lần thứ 39); **E-201 KẾT THÚC BỞI REBOOT #93**; E-202 + E-203 + E-204 mới, E-205 ĐANG GHIM; tổng ghim 27/131 (20,6%); **ENOSPC 78 dòng (ngoại suy ≈100–101) — đợt thứ 28**; **birefnet 0 thử lần thứ 33**; #95 giữa phiên (gap mẫu 110 s); F-179-T9-2 (giao T0-180). LIMITS 33.110 B.
- **Cờ đợt 179 lúc T7 đóng (~20:22Z): 8/9 có nội dung** (T0/T1/T2/T4/T5/T6/T8/T9; T7 là cờ thứ 9). 7/9 trong hạn cờ ~20:00Z (T9 trễ ~2'); T8 CÓ cờ (khác đợt 178). **Chuỗi 9/9 cờ tính lại từ đợt 179** (đứt tại 178) — T10-179 chốt đếm cuối.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 178/179 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #93/#95 — cả hai đã khép hẳn lúc đóng; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. **Đợt này T7 xác minh thiếu bằng SQL trực tiếp** (COUNT(*) theo scheduled_for + truy vấn theo started_at + truy vấn toàn bộ job_runs trong khoảng im lặng — 0 dòng mọi job), nên 3 HB + 2 DR thiếu là thiếu thật trong DB, không phải cắt lịch sử.
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + F-176-T7-5). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #94/#95 đều là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng ở §2.3/§2.4 — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning #95 = 1 theo cả EVENTS lẫn truy vấn DB (finished NULL vẫn tính là sống).
4. Cửa kiểm đợt này ~2h41' (17:41Z → 20:22Z 23/11), đủ 6 slot HB + 3 slot DR trong cửa + HB 17:20:50Z trước giờ mở + 7 slot HB/DR khoảng trống giữa đợt + run vcut 178 (kết cục) và 179 (theo dõi + viết lại tại #95) + reboot #95 giữa phiên. Chín lần đọc DB đầy đủ (đọc #1–#9, gồm đọc #5b phát hiện #95); run 178 đọc đầy đủ 1 lần khớp hoàn toàn với T0-179/T2-179 ở mọi trường + events; run 179 đọc đầy đủ 9 lần (started_at đổi đúng 1 lần tại đọc #5b, claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 17:20:50Z + DR 15:00Z/16:00Z/17:00Z thuộc khoảng trống giữa đợt (sau kiểm cuối T7-178 lúc ~14:02Z, trước mở đợt 179 17:35:51Z) — không thuộc cửa đợt nào nhưng vẫn vào lũy kế. HB 20:50:50Z + DR 21:00Z (ngày 23/11) thuộc cửa T7-180.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #6 spawn 19:07:19Z, chết lúc reboot 19:10:22Z sau ~209 s — F-179-T7-1); 8/9 sleep hoàn thành. **Boot ĐỔI 1 lần trong phiên** (ae2a9a47 → 95b483a2 tại #95; #94 đã xảy ra trước khi lượt mở) — T7 phát hiện #95 trong vòng 52 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn 95b483a2.
7. T7 đóng cờ ~20:2xZ — trễ ~25' so với hạn cờ ~20:00Z (để kiểm HB 20:20:50Z + xác minh #95 + đối chiếu T8/T9 cuối — cùng mẫu T7-178 trễ ~14'), trong hạn cứng ~20:35Z. T7 không bỏ slot nào trong cửa; T10-179 chưa đóng sổ lúc T7 đóng — batch T7 gộp muộn theo tiền lệ nếu T10 đóng trước.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix179.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 179 trong NOTES đều lấy từ script — KHÔNG lặp lại F-176-T7-5 (xem F-179-T7-2: tuổi đọc #9 trong NOTES gõ tay epoch sai 1795464114 đã sửa thành 9.963 s theo script).

## 4. Cập nhật lũy kế (nối tiếp đợt 178, cùng phương pháp — SỐ SLOT THIẾU)

- Heartbeat: 44/459 → **47/472 slot thiếu** (cửa sổ 14/11 07:50:50 → 24/11 03:20:50 +07). Kiểm toán cửa sổ: 459 + 13 slot mới = 472 ✓ (14:20:50, 14:50:50, 15:20:50, 15:50:50✗, 16:20:50✗, 16:50:50✗, 17:20:50 muộn, 17:50:50, 18:20:50, 18:50:50, 19:20:50, 19:50:50, 20:20:50). Số thiếu +3 (3 slot thiếu trong outage); muộn mới +1 (HB 17:20:50Z +890 s).
- Deterministic-doctor: 51/302 → **53/308 slot thiếu** (cửa sổ 11/11 09:00 → 24/11 03:00 +07). Kiểm toán: 302 + 6 = 308 ✓ (15:00, 16:00✗, 17:00✗, 18:00, 19:00, 20:00). Số thiếu +2 (2 slot thiếu trong outage).
- Tỉ lệ thiếu lũy kế: HB 47/472 = 10,0% (tăng từ 9,6% — 3 thiếu mới); DR 53/308 = 17,2% (tăng từ 16,9% — 2 thiếu mới).
- Mẫu muộn HB lũy kế: **9 → 10 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; **+890 s đợt 179 (HB 17:20:50Z)**; kỷ lục +1.252 s đợt 129) — **đợt đầu tiên có muộn mới sau 17 đợt vắng muộn mới (đợt 162–178)**.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 178: TIMEOUT theo hồ sơ daemon (wall gốc 10.838 s, margin −38 s theo cả hai cách tính)** — đọc #1 + events đầy đủ (5 event, 0 event sau timeout eid 10447) + T0-179/T2-179 đối chiếu khớp. 1 lần viết lại tại #93; claimed→finished 7 s (claimed đổi thành finished − 7 s lúc cuối — cùng mẫu run 171–177). **KHÔNG phải ca ≥60 s thứ mười — số ca GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. **Chuỗi succeeded 4 run (174–177) ĐỨT tại 178.**
2. **Run 179 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 9.963 s, còn 837 s tới hạn ngân sách 20:35:51Z; **viết lại ×1 tại #95**) — kết cục thuộc T7-180. **Claimed_at run 179 vẫn giữ nguyên (17:35:51Z) lúc đóng** — T7-180 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 179 = 0 s** (chuỗi jitter 0 s run đợt: 175 → 176 → 177 → 178 → 179).
3. **Reboot #94 (btime 17:17:09Z, boot ae2a9a47): TRƯỚC KHI MỞ PHIÊN, giờ thật, T0-179 XÁC NHẬN 9 nguồn.** Gap #93→#94 = 14.974 s (dài gấp đôi mẫu ~2 giờ). Số hiệu #94 ĐÃ ĐƯỢC T0-179 xác nhận (không còn chờ). **#94 KHÔNG ảnh hưởng run 178** (sau timeout 2h40m40s). **(m) #94: KHÔNG CÓ ĐIỂM** (T0-179: 0 requeue cửa hẹp + cửa rộng). **INSIDE #93 TRUE (FULL139) — chuỗi 3 → 4** (T2-179; mâu thuẫn lần thứ 8, dải phương pháp chi phối).
4. **Reboot #95 (btime 19:10:22Z, boot 95b483a2): GIỮA PHIÊN, giờ thật, T7 xác minh 9 nguồn trong 52 s.** Gap #94→#95 = 6.793 s. Số hiệu #95 theo đếm tuần tự — **CHỜ T0-180 xác minh 9 nguồn**. **Điểm (m) #95: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — requeue +38,743 s TRONG dải, KHÔNG sát biên (margin xấu nhất 4,743 s — caveat phân số không lật được); 1 run sống tại btime + 1 requeue duy nhất cửa hẹp (đã khép — đếm cuối); T2-180 phân loại cuối + parent 180. **INSIDE #95 + FULL140 thuộc T2-180.**
5. **Điểm (m) #93: T2-179 phán CUỐI — DƯƠNG** (+36,248 s; T7-179 kiểm lại KHỚP từng ms). **Parent quyết cuối đợt 179.** (m) #92: ÂM — parent ĐÃ CHẤP NHẬN đợt 178 (hòa giải nhãn T2/T0) — KHÔNG mở lại. (m) #91: ÂM — parent ĐÃ CHẤP NHẬN đợt 178 — KHÔNG mở lại. (m) #90: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 177 — KHÔNG mở lại.
6. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-179 không thu hẹp được cửa lần thứ hai mươi hai — xem LIMITS T2-179) — chờ parent chốt J. T2-180 tiếp tục thu hẹp cửa.
7. **Cửa slot TRONG đợt 179: HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn trong cửa. DR 18:00Z + 19:00Z + 20:00Z CÓ đúng giờ** (nợ chính T7-179 đã trả). **NHƯNG: HB 17:20:50Z (trước giờ mở) MUỘN +890 s — muộn mới đầu tiên sau 17 đợt; khoảng trống giữa đợt: 3 HB + 2 DR THIẾU do outage scheduler 8.406 s.** Lũy kế: **HB 47/472, DR 53/308. Muộn HB lũy kế 9 → 10. Chuỗi "cửa lành hoàn toàn" 4 lần (175–178) — parent quyết có tính tiếp không** (xem §2.5). **Jitter run vcut 0 s (175 → 179) — chuỗi 5 run liên tiếp.** Toàn bộ 6 slot HB trong cửa đều −316 s; 3 slot DR có đều 0 s.
8. **F-179-T7-1 — Sleep #6 bị SIGTERM theo reboot #95** (cùng mẫu F-178-T7-1/F-177-T7-1/F-176-T7-1/F-175-T7-1/F-174-T7-1): sleep 1.200 s spawn 19:07:19Z, chết lúc reboot 19:10:22Z sau ~209 s (runtime báo SIGTERM lúc ~19:10:48Z); T7 phát hiện boot mới trong 52 s, 0 số sai. Đợt 179 có 1 sleep bị giết (đợt 178 có 1).
9. **F-179-T7-2 — Tuổi run 179 đọc #9 trong NOTES gõ tay epoch sai (1795464114 thay vì 1795465314) → 8.763 s, SAI 1.200 s, script sửa thành 9.963 s** (20:21:54Z − 17:35:51Z = 2h46m03s = 9.963 s; còn tới hạn 837 s, không phải 2.037 s). Mọi tuổi run trong LIMITS này đều lấy từ `appendix179.py` — KHÔNG lặp lại F-176-T7-5/F-178-T7-2. 8/9 tuổi đọc khớp NOTES; chỉ đọc #9 lệch.
10. **F-178-T7-3 — Cờ round178-t8.done VẪN VẮNG trên đĩa lúc T7 kiểm cuối đợt 179 (20:22Z)** (nội dung T8-178 đã xác minh trên đĩa qua late merge đợt 178 — chỉ thiếu cờ; không có cờ nào được viết thêm sau đó). **Ở mức T9: ĐÃ HẾT từ đợt 178** (cờ T9-178 có mặt 14:06Z). **Ở mức đợt 179: T8-179 ĐÃ CÓ cờ** (`round179-t8.done` 2.682 B @19:38Z, trong hạn cờ) — khác đợt 178. T10-179 kiểm lại trước khi chốt đếm cờ 9/9 đợt 179.
11. **F-178-T7-4 ĐÃ HẾT** (T0-179 làm rõ: worker_boot_generation theo daemon start, không phải OS boot; daemon restart 1 lần thêm trên #92; trigger không xác định được, host-side).
12. **OUTAGE scheduler 8.406 s (F-179-T7-3 mới): 0 run mọi job started 15:15:35Z–17:35:39Z; 3 HB + 2 DR thiếu; HB 17:20:50Z muộn +890 s; feed-pulse-23 chạy bù trễ +3.226 s.** Nguyên nhân chưa xác định (host-side; reboot #94 nằm trong khoảng im) — giao parent/T0-180 xem xét. Outage scheduler đầu tiên ghi nhận trong chuỗi T7 (trước đây chỉ có slot thiếu rời rạc).
13. **Mù #96? (#64) VẪN MỞ** theo T2-179 (R 1.238 s lần 15 không đổi; hole-recheck lần 23 NEW=0 mọi hố). **Mù #95? (#63) MỞ**; **mù #94? (#62) MỞ**; **mù #88? VẪN MỞ** (hole-recheck lần 23: 337 hit, 0 mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức: INSIDE #93 TRUE (FULL139) → chuỗi 3 → 4 (T2-179; dải cross-check mâu thuẫn lần thứ 8, dải phương pháp chi phối).
14. **POSTBOOT_PASS #94 ĐÃ CÓ 18:03:08Z (T5-179, repair-sớm-quyết-h, poll=1 — CÓ caveat repair)** — chờ parent quyết có được tính cho gate (a) không (khác cờ replay-đầy-đủ #92, giống cờ repair #90 — parent đã chấp nhận (c) đợt 177 cho #90). **POSTBOOT_PASS #93 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được** (tổng boot không cờ **19 → 20**). **POSTBOOT_PASS #95 CHƯA CÓ** — T5-180 lo (watcher-179 pid 61023 hạn 20:35:00Z nhiều khả năng chết theo #95). Marker sống qua 46 reboot #49–#94 (T0-179 đếm độc lập 46); sống qua #95 chưa đếm — giao T0-180.
15. **Chuỗi WebKit FULL PASS đang 0** (đứt đợt 178); T7 không đề xuất số chuỗi. Lượt yên #48 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 41 → 42 (T4-179, attempt1 trên #94 qua gate (a) có cờ T5 repair). Harness WebKit 2/3 trên #94 (85m4 kẹt mới ở resetPlayhead0:320 — T8-179) + pilot hb128 WebKit SẠCH lần đầu live. **#93 + #94 KHÔNG giết holder — chuỗi từ #69 lên 26 reboot** (T6-179). **#95 có giết holder không — thuộc T6-180.**
16. **Chuỗi "0 vi phạm" đếm lại từ 0 ở đợt 179** (parent quyết (p) đợt 178: F-178-T2-8 CÓ VI PHẠM NHẸ — chuỗi 2 đợt (176, 177) đứt tại 178). **Đợt 179: 0 vi phạm theo T4** (F-179-T4-5 ghi nhẹ 18:13:20Z — parent quyết); **T2-179: 0 chồng chéo**; **T9-179: 0 vi phạm**; **T7-179: 0 vi phạm** (chỉ date/sleep/curl -sI + DB đọc + python thuần; không probe dpkg; không script nặng trong cửa sổ attempt). Quy tắc nhắc lại cho đợt 180: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **0/8 file LIMITS đợt 179 đã có VƯỢT giới hạn push 37.768 B** (T8 37.744 B — chỉ còn 24 B; T6 37.059 B; T4 34.780 B; T9 33.110 B; T2 30.405 B) — đề nghị các T sau gọn file LIMITS lại.
17. **Harness + (1c')/(f') + headroom + ENOSPC + birefnet + E-202–E-205: thuộc T8/T9-179** — T7 không ghi thay. (c')/(f') 0 kích hoạt — BỎ LỠ kẹt 179 (F-179-T8-5); ENOSPC 78 dòng trực tiếp (đợt thứ 28); birefnet 0 thử lần thứ 33.

## 6. Phụ lục — số liệu từ script `appendix179.py` (epoch thô, không gõ tay)

Xem `~/workspace/goals/capcut-clone-video-editor/hidden_files/round179-t7/appendix179.txt` (chạy từ `appendix179.py` cùng thư mục). Tóm tắt: run 178 TIMEOUT, margin −38 s, cf 7 s, 5 event, viết lại ×1; run 179 jitter 0 s, viết lại ×1 (#95, +38,743 s), tuổi gốc 9.963 s lúc 20:21:54Z (còn 837 s); reboot #95 btime 19:10:22Z, gap 6.793 s, (m) DƯƠNG ỨNG VIÊN; outage 8.406 s — 3 HB + 2 DR thiếu, HB 17:20:50Z muộn +890 s (muộn HB 9 → 10); trong cửa HB 6/6 toàn −316 s, DR 3/3 toàn 0 s; lũy kế HB 47/472, DR 53/308.
