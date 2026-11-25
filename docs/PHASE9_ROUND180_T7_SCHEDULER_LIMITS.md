# PHASE9 ROUND180 T7 — RUN 179 TIMEOUT (−28 S, CF 7 S — KHÔNG PHẢI CA THỨ MƯỜI) + 3 REBOOT MỚI GIỮA PHIÊN (#96/#97/#98; RUN 180 VIẾT LẠI ×3) + CỬA SLOT LÀNH LẦN THỨ SÁU

- **Luồng:** T7 đợt 180 (lượt cron 03:35:51 +07 24/11/2026 = 20:35:51Z 23/11). Nhiệm vụ theo brief T7-180: (1) kết cục run 179; (2) slot HB 20:50:50Z (đã đính chính — KHÔNG lấy HB 20:20:50Z, slot đó thuộc cửa đợt 179) + DR 21:00Z/22:00Z/23:00Z; (3) outage scheduler 8.406 s theo dõi thêm; (4) run 180 theo dõi.
- **Boot trong phiên:** mở phiên đã là **95b483a2** (#95, btime 19:10:22Z — **T0-180 XÁC NHẬN 9 nguồn**, cờ 21:18Z). **3 reboot mới giữa phiên:** #96 (8d2a69df, btime 21:20:56Z), #97 (9e440707, btime 23:02:47Z), #98 (e62eef3f, btime 23:12:23Z) — cả ba T7 xác minh 9 nguồn; số hiệu chờ T0-181. **Boot lúc đóng cờ vẫn e62eef3f (#98).**
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (run 179/180 đầy đủ; HB/DR theo slot; requeue cửa hẹp #96/#97/#98; runs spanning btime), LIMITS T7-179 + aggregate 179 §11 + §12.3 + cờ/LIMITS các luồng đợt 180 (T0/T1/T2/T4/T5/T6/T8/T9 đã đóng — **8/9 cờ có nội dung lúc T7 đóng**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc + script python thuần tính số).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T7 đóng cờ ~23:32Z — trễ ~32' so với hạn cờ ~23:00Z (để kiểm DR 23:00Z + xác minh 3 reboot mới giữa phiên + đếm cuối cửa hẹp #98 sau khi khép 23:31:23Z — cùng mẫu T7-179 trễ ~29' do DR 20:00Z + reboot #95), trong hạn cứng ~23:35Z. T7 không bỏ slot nào trong cửa.

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 179 kết cục? | **`timeout` 20:36:19Z, margin −28 s** (trễ hạn 28 s), wall gốc 10.828 s, **claimed→finished 7 s** | §2.1 |
| Run 179 có phải ca ≥60 s thứ mười? | **KHÔNG — số ca GIỮ 9** (cf 7 s < 60 s; run 175 = thứ chín) | §2.1 |
| Run 179 viết lại mấy lần? | **×1 (#95)**, 5 event, 0 event sau timeout | §2.1 |
| Run 180? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 10.560 s, còn 240 s tới hạn 23:35:51Z); **jitter +28 s**; **viết lại ×3** (#96/#97/#98); claimed không đổi | §2.2 |
| Reboot #96/#97/#98? | **Cả ba GIỜ THẬT, T7 xác minh 9 nguồn**; gap 7.834 / 6.111 / **576 s** (#97→#98 ngắn bất thường); số hiệu chờ T0-181 | §2.3/§2.4/§2.5 |
| (m) #96/#97/#98? | **Cả ba DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +41,129 / +39,441 / +37,030 s, đều TRONG dải, KHÔNG sát biên; mỗi cái 1 run sống + 1 requeue duy nhất | §2.3/§2.4/§2.5 |
| Cửa slot đợt 180? | **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — 0 thiếu, 0 muộn.** Chuỗi cửa lành 5 lần (175–179) → **LÀNH LẦN THỨ SÁU** (parent quyết cuối) | §2.6 |
| Outage scheduler? | **KHÔNG có outage mới trong cửa đợt 180** — mọi slot có đúng giờ; scheduler sống 20:36–23:31Z | §2.7 |
| Đồng hồ trong phiên? | **Cloudflare chênh ~0–1 s** (lúc mở ~0 s; lúc phát hiện #96 ~1 s; #97 ~1 s; #98 ~0 s — CF nhanh hơn hoặc bằng) — khớp các đợt trước | §2.3/§2.4/§2.5 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–179 — SỐ SLOT THIẾU, chỉ cộng tử số khi có slot thiếu thật): heartbeat **47/478 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **53/311 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 10** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 179 — TIMEOUT 20:36:19Z, margin −28 s, cf 7 s, KHÔNG PHẢI CA THỨ MƯỜI; VIẾT LẠI ×1 (đọc #1 + events đối chiếu trực tiếp)

Run 179 (`f253dced-0650-4541-9418-88badac6f1ed`, sched 1795455351 = 17:35:51Z 23/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795455351 = 17:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795455351 → **1795461060 = 19:11:00Z** (#95) — KHÔNG đổi sau đó |
| finished_at_utc | 1795466179 = 20:36:19Z (event `timeout` 20:36:19.057Z, eid 10509) |
| status | **`timeout`** — attempt 1, worker_execution_timed_out true |
| error_text | "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run." |
| worker_claimed_at_utc | 1795466172 = 20:36:12Z (finished − 7 s) |
| worker_boot_generation | cron_boot_d67600a2… (boot #95) |
| Wall từ started gốc | 1795466179 − 1795455351 = **10.828 s** (3h00m28s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795466151 = 20:35:51Z — finished TRỄ hạn **28 s (margin −28 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795466151 = 20:35:51Z — **cùng hạn** (jitter 0 s) → margin **−28 s theo cả hai cách tính** |
| Wall từ started viết lại | 1795466179 − 1795461060 = **5.119 s** (1h25m19s thực thi trên boot #95 sau viết lại) |

- Events run 179 (đầy đủ, **đúng 5 event, 0 event sau timeout**): `dispatched` 17:35:51.044Z (10468) + `requeued_after_restart` 19:11:00.743Z (10490) + `dispatched` 19:11:00.897Z (10491) + `reattached_after_restart` 19:11:01.032Z (10492) + **`timeout` 20:36:19.057Z (10509)**. **ĐÚNG 1 LẦN VIẾT LẠI** (#95).
- **Timeout ghi nhận 28 s SAU hạn ngân sách** (20:36:19Z vs hạn 20:35:51Z) — daemon ghi timeout trễ 28 s, cùng mẫu run 178 (trễ 38 s) và run 177 (claimed đổi lúc cuối). T7-179 đọc #9 lúc 20:21:54Z thấy còn 837 s; run tiếp tục 14m25s rồi timeout.
- **Claimed→finished = 7 s — KHÔNG thuộc họ ≥60 s.** Claimed_at run 179 đổi lúc cuối thành finished − 7 s (cùng mẫu run 171–178: claimed đổi thành finished − 7 s / − 8 s lúc cuối). Số ca **GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. **Run 179 KHÔNG phải ca thứ mười.**
- **Chuỗi succeeded: run 178 TIMEOUT rồi run 179 TIMEOUT — 2 run timeout liên tiếp** (chuỗi succeeded 4 run 174–177 đã đứt tại 178; nay thêm 179 timeout — lần đầu 2 timeout liên tiếp trong chuỗi gần đây).
- **Run 179 KHÔNG bị viết lại lần 2 tại reboot nào sau #95:** started_at giữ nguyên 1795461060 từ đọc #5b T7-179 tới khi timeout; 0 event sau eid 10509; các reboot #96/#97/#98 đều xảy ra SAU khi run 179 đã timeout (20:36:19Z < btime #96 21:20:56Z).

### 2.2 Run 180 — vẫn `running` lúc đóng cờ, jitter +28 s, viết lại ×3 (#96/#97/#98), claimed không đổi

Run 180 (`6ee0f154-4e49-452b-9f64-cdf5aa42662a`, sched 1795466151 = 20:35:51Z 23/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795466151 | 20:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×3) | 1795466179 → 1795468897 → 1795475006 → **1795475580** | 20:36:19Z → 21:21:37Z → 23:03:26Z → **23:13:00Z** |
| worker_claimed_at | 1795466179 | 20:36:19Z (KHÔNG đổi qua mọi lần đọc) |
| worker_boot_generation | cron_boot_d67600a2… → 132a5d7a… → **473f9460…** | #95 → #96 → #97 → **#98** |
| Hạn ngân sách (started gốc + 10.800 s) | 1795476951 | 23:35:51Z 23/11 |

- **Jitter +28 s** — run 180 dispatch 20:36:19Z, đúng giây run 179 timeout; scheduler chờ run 179 timeout xong mới dispatch lượt kế. **Chuỗi jitter 0 s các run đợt (175 → 179) ĐỨT tại 180** (jitter +28 s do run trước timeout trễ — không phải lỗi dispatch của run 180).
- 5 lần đọc DB trong phiên (đọc #1 ~20:57Z, #3 ~21:22Z, #6 ~22:52Z, #7 ~23:03Z, #8 ~23:13Z, đọc cuối ~23:31Z): run 180 `running` ở mọi lần đọc; started_at đổi đúng 3 lần (mỗi lần sau một reboot); claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 3 lần (cùng lúc started). **3 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): lúc 23:03:29Z 8.858 s; lúc 23:13:03Z 9.432 s; lúc đóng 23:31:51Z **10.560 s, còn 240 s** tới hạn ngân sách 23:35:51Z. **Kết cục thuộc T7-181** (hạn cứng đóng đợt 180 là ~23:35Z, cùng hạn run 23:35:51Z — cùng mẫu các đợt trước).
- Events run 180 tới lúc đóng cờ: đúng 10 event — dispatched 20:36:19.085Z (10510) + **requeued 21:21:37.129Z (10523) + dispatched 21:21:37.298Z (10524) + reattached 21:21:37.396Z (10525)** + **requeued 23:03:26.441Z (10547) + dispatched 23:03:26.600Z (10548) + reattached 23:03:26.688Z (10549)** + **requeued 23:13:00.030Z (10550) + dispatched 23:13:00.128Z (10551) + reattached 23:13:00.185Z (10552)**.

### 2.3 Reboot #96 MỚI GIỮA PHIÊN (btime 21:20:56Z, boot 8d2a69df) — RUN 180 VIẾT LẠI LẦN 1 + (m) #96 DƯƠNG ỨNG VIÊN

- **Reboot #96: boot 8d2a69df-2471-4349-b5a1-aa340da85c01, btime 1795468856 = 21:20:56Z 23/11.** Xác minh T7 (lúc phát hiện ~21:21:43Z + kiểm lại lúc đóng ~23:31Z — cả hai lần đều 8d2a69df lúc đó, btime 1795468856): boot_id + btime /proc/stat + `uptime -s` 21:20:56Z (khớp) + /proc/1 mtime 21:21:07.494Z (+11,494 s) + journal idx 0 duy nhất, first entry 21:21:07Z (+11 s) + wtmp begins 21:21:07Z (+11 s) + `last` reboot 21:21 still running + `who -b` 21:21. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 21:22:05 GMT vs 21:22:04 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #96 theo đếm tuần tự — CHỜ T0-181 xác minh 9 nguồn** (T0-180 đóng cờ 21:18Z, TRƯỚC #96; T8-180 + T9-180 cũng ghi #96 giữa phiên, gap khớp).
- **T7 phát hiện #96 trong ~47 s sau btime** (btime 21:20:56Z → kiểm đầu 21:21:43Z; sleep bị SIGTERM trùng thời điểm — xem F-180-T7-1).
- **Gap #95→#96 (btime−btime): 1795468856 − 1795461022 = 7.834 s (2h10m34s — trở lại mẫu ~2h).** Chuỗi gap gần đây: 6.827 / 7.568 / 14.974 / 6.793 / 7.834 s.
- **#96 xảy ra TRONG lúc run 180 chạy:** run 180 dispatch gốc 20:36:19Z, btime #96 21:20:56Z (tuổi gốc lúc btime **2.717 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 180)** — theo EVENTS (dispatched trước btime, chưa finish) + truy vấn DB (scheduled ≤ btime AND (finished NULL OR finished > btime): ĐÚNG 1 dòng — run 180).
- **Run 180 BỊ VIẾT LẠI LẦN 1 tại #96:** started 1795466179 → **1795468897 = 21:21:37Z** (dịch **+2.718 s**); boot_gen đổi d67600a2 (#95) → **132a5d7a** (#96); **claimed_at KHÔNG ĐỔI (1795466179)**; vẫn running, attempt 1, error null.
- **Requeue do #96 (cửa hẹp [21:20:56Z, 21:39:56Z], kiểm sau khi cửa khép hẳn ở đọc #4 ~21:52Z): ĐÚNG 1 DÒNG** — run 180, eid 10523, 21:21:37.129Z. Không job nào khác bị requeue do #96. Band (m) [21:21:29Z, 21:21:45,8Z]: ĐÚNG 1 requeue (cùng dòng).
- **Requeue offset +41,129 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 8,129 s, cách biên TRÊN 8,671 s** (21:21:37.129Z − btime nguyên 1795468856). Reattach +41,396 s; dispatch lần 2 +41,298 s. **(m) #96 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-181 phân loại cuối + parent 181. **KHÔNG sát biên:** offset thật ∈ (40,129 s, 41,129 s] — đều trong band; margin xấu nhất tới biên dưới 7,129 s >> 1 s — **caveat phân số KHÔNG lật được**.
- **HB 21:20:50Z (slot ngay trước btime #96 6 s) XONG TRƯỚC #96** (started 21:15:34Z, finished cùng giây — xem §2.6) — #96 KHÔNG ảnh hưởng slot này.
- **Sleep của T7 bị giết theo #96** (xem F-180-T7-1): sleep 1.200 s spawn ~21:03Z, chết lúc reboot 21:20:56Z sau ~1.083 s; T7 phát hiện boot mới trong 47 s, 0 số liệu mất, 0 số sai.

### 2.4 Reboot #97 MỚI GIỮA PHIÊN (btime 23:02:47Z, boot 9e440707) — RUN 180 VIẾT LẠI LẦN 2 + (m) #97 DƯƠNG ỨNG VIÊN

- **Reboot #97: boot 9e440707-028c-4102-9d14-b119b5b4e136, btime 1795474967 = 23:02:47Z 23/11.** Xác minh T7 (lúc phát hiện ~23:03:29Z + kiểm lại lúc đóng ~23:31Z — boot lúc đóng đã là #98, nhưng btime/boot #97 đã ghi từ đọc #7): boot_id + btime /proc/stat + `uptime -s` 23:02:47Z (khớp) + /proc/1 mtime 23:02:58.711Z (+11,711 s) + journal idx 0 duy nhất, first entry 23:02:59Z (+12 s) + wtmp begins 23:02Z + `last` reboot 23:02 still running + `who -b` 23:02. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 23:03:46 GMT vs 23:03:45 (**chênh ~1 s**, CF nhanh hơn). **Số hiệu #97 theo đếm tuần tự — CHỜ T0-181 xác minh 9 nguồn.**
- **T7 phát hiện #97 trong ~42 s sau btime** (btime 23:02:47Z → kiểm đầu 23:03:29Z; sleep bị SIGTERM — xem F-180-T7-2).
- **Gap #96→#97 (btime−btime): 1795474967 − 1795468856 = 6.111 s (1h41m51s — mẫu ~2h, ngắn hơn chút).** Chuỗi gap gần đây: 6.793 / 7.834 / 6.111 s.
- **#97 xảy ra TRONG lúc run 180 chạy:** tuổi gốc lúc btime **8.756 s**; vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 180)** — theo EVENTS + truy vấn DB (ĐÚNG 1 dòng).
- **Run 180 BỊ VIẾT LẠI LẦN 2 tại #97:** started 1795468897 → **1795475006 = 23:03:26Z** (dịch **+6.109 s**); **claimed_at KHÔNG ĐỔI (1795466179)**; vẫn running, attempt 1, error null. (Boot_gen trung gian sau #97 T7 không đọc riêng — chỉ xác nhận boot_gen lúc đóng là 473f9460… (#98) và claimed không đổi qua mọi lần đọc.)
- **Requeue do #97: ĐÚNG 1 DÒNG trong phần cửa quan sát được** — run 180, eid 10547, 23:03:26.441Z. **CAVEAT: cửa hẹp #97 [23:02:47Z, 23:21:47Z] BỊ #98 CẮT NGANG ở +576 s** (btime #98 23:12:23Z) — mọi requeue sau 23:12:23Z thuộc #98, không thuộc #97; đếm cuối cho #97 là requeue trong [23:02:47Z, 23:12:23Z) = ĐÚNG 1 dòng. T7 ghi rõ caveat này, không giấu.
- **Requeue offset +39,441 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 6,441 s, cách biên TRÊN 10,359 s** (23:03:26.441Z − btime nguyên 1795474967). **(m) #97 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-181 phân loại cuối + parent 181. **KHÔNG sát biên:** offset thật ∈ (38,441 s, 39,441 s] — margin xấu nhất tới biên dưới 5,441 s >> 1 s — **caveat phân số KHÔNG lật được**.
- **DR 23:00Z (slot ngay trước btime #97 2m47s) XONG TRƯỚC #97** (started = finished = 23:00:00Z — xem §2.6) — #97 KHÔNG ảnh hưởng slot này.
- **Sleep của T7 bị giết theo #97** (xem F-180-T7-2): sleep 720 s spawn ~22:52Z, chết lúc reboot 23:02:47Z sau ~619 s; T7 phát hiện boot mới trong 42 s, 0 số liệu mất.

### 2.5 Reboot #98 MỚI GIỮA PHIÊN (btime 23:12:23Z, boot e62eef3f) — RUN 180 VIẾT LẠI LẦN 3 + (m) #98 DƯƠNG ỨNG VIÊN; GAP 576 S NGẮN BẤT THƯỜNG

- **Reboot #98: boot e62eef3f-9a53-4d67-8a8b-7077ee917156, btime 1795475543 = 23:12:23Z 23/11.** Xác minh T7 (lúc phát hiện ~23:13:03Z + kiểm lại lúc đóng ~23:31Z — cả hai lần đều e62eef3f, btime 1795475543): boot_id + btime /proc/stat + `uptime -s` 23:12:23Z (khớp) + /proc/1 mtime 23:12:34.842Z (+11,842 s) + journal idx 0 duy nhất, first entry 23:12:35Z (+12 s) + wtmp begins 23:12Z + `last` reboot 23:12 still running + `who -b` 23:12. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 23:13:23 GMT vs 23:13:23 (**chênh ~0 s**). **Số hiệu #98 theo đếm tuần tự — CHỜ T0-181 xác minh 9 nguồn.**
- **T7 phát hiện #98 trong ~40 s sau btime** (btime 23:12:23Z → kiểm đầu 23:13:03Z; sleep bị SIGTERM — xem F-180-T7-3).
- **Gap #97→#98 (btime−btime): 1795475543 − 1795474967 = 576 s (9m36s — NGẮN BẤT THƯỜNG, khác mẫu ~2h; lần đầu ghi nhận gap <1.000 s trong chuỗi #93–#98).** Chuỗi gap gần đây: 14.974 / 6.793 / 7.834 / 6.111 / **576 s**. T7 không xác định được nguyên nhân gap ngắn (host-side) — giao parent/T0-181 xem xét.
- **#98 xảy ra TRONG lúc run 180 chạy:** tuổi gốc lúc btime **9.392 s**; vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 180)** — theo EVENTS + truy vấn DB (ĐÚNG 1 dòng).
- **Run 180 BỊ VIẾT LẠI LẦN 3 tại #98:** started 1795475006 → **1795475580 = 23:13:00Z** (dịch **+574 s**); boot_gen đổi → **473f9460…** (#98); **claimed_at KHÔNG ĐỔI (1795466179)**; vẫn running, attempt 1, error null.
- **Requeue do #98 (cửa hẹp [23:12:23Z, 23:31:23Z], kiểm sau khi cửa khép hẳn ở đọc cuối ~23:31:51Z): ĐÚNG 1 DÒNG** — run 180, eid 10550, 23:13:00.030Z. Không job nào khác bị requeue do #98. Band (m) [23:12:56Z, 23:13:12,8Z]: ĐÚNG 1 requeue (cùng dòng).
- **Requeue offset +37,030 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 4,030 s, cách biên TRÊN 12,770 s** (23:13:00.030Z − btime nguyên 1795475543). **(m) #98 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-181 phân loại cuối + parent 181. **KHÔNG sát biên:** offset thật ∈ (36,030 s, 37,030 s] — margin xấu nhất tới biên dưới 3,030 s >> 1 s — **caveat phân số KHÔNG lật được**.
- **Nếu parent CHẤP NHẬN (m) #95 DƯƠNG (T2-180 phán CUỐI) rồi #96/#97/#98 DƯƠNG: n ứng viên 38/39 → 39/40 → 40/41 → 41/42** (số học nối tiếp T2-180; T7 chỉ ghi số học, T2-181 tính chính thức). n chính thức GIỮ 14.
- **Sleep của T7 bị giết theo #98** (xem F-180-T7-3): sleep 1.100 s spawn ~23:04Z, chết lúc reboot 23:12:23Z sau ~529 s; T7 phát hiện boot mới trong 40 s, 0 số liệu mất, 0 số sai.

### 2.6 Slot HB/DR — TRONG CỬA ĐỢT 180: HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — 0 THIẾU, 0 MUỘN

**Trong cửa đợt 180 (sau giờ mở 20:35:51Z) — HB 6/6 + DR 3/3:**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 03:50:50 (20:50:50Z) | 315da0b0 | 20:45:34 | **−316 s** | CÓ |
| 04:20:50 (21:20:50Z) | f37dfc50 | 21:15:34 | **−316 s** | CÓ |
| 04:50:50 (21:50:50Z) | bbc74dd9 | 21:45:34 | **−316 s** | CÓ |
| 05:20:50 (22:20:50Z) | 934a5b90 | 22:15:34 | **−316 s** | CÓ |
| 05:50:50 (22:50:50Z) | c579bcf7 | 22:45:34 | **−316 s** | CÓ |
| 06:20:50 (23:20:50Z) | c98e7d07 | 23:15:34 | **−316 s** | CÓ |

- Cả 6 slot `succeeded`, attempt=1, error_text=null. **Toàn −316 s.** 0 muộn mới trong cửa. (HB 21:20:50Z dispatch trên #95, trước btime #96 5m22s; HB 23:20:50Z dispatch trên #98, sau btime #98 3m11s.)

**Deterministic-doctor trong cửa: 3/3 có — DR 21:00Z + 22:00Z + 23:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 04:00 (21:00Z) | 2c21d5f0 | 21:00:00 | 0 s | CÓ |
| 05:00 (22:00Z) | d57da831 | 22:00:00 | 0 s | CÓ |
| 06:00 (23:00Z) | 734d4aa9 | 23:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 21:00Z + 22:00Z + 23:00Z CÓ đúng giờ** — nợ chính của T7-180 (cùng HB 20:50:50Z), nay đã trả. (DR 23:00Z dispatch trên #96, TRƯỚC btime #97 2m47s.)
- **Cửa slot TRONG đợt 180: LÀNH (HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn).** Chuỗi cửa lành 5 lần (175–179, parent quyết (o) đợt 179) **có tính tiếp lần thứ sáu không — parent quyết**: trong cửa đợt 180 không có slot thiếu/muộn nào; 3 reboot #96/#97/#98 giữa phiên đều KHÔNG làm thiếu/muộn slot nào (HB 21:20:50Z xong trước #96 5m22s; DR 23:00Z xong trước #97 2m47s; HB 23:20:50Z dispatch sau #98 3m11s — scheduler hồi phục nhanh sau mỗi reboot).
- **Đính chính slot (theo (o) đợt 179): HB 20:50:50Z là slot đầu cửa đợt 180 — T7-180 đã KHÔNG lấy HB 20:20:50Z** (slot đó thuộc cửa đợt 179, T7-179 đã ghi CÓ −316 s).

### 2.7 OUTAGE scheduler 8.406 s đợt 179 — theo dõi thêm: KHÔNG có outage mới trong cửa đợt 180

- **Không có khoảng im lặng nào trong cửa đợt 180:** mọi slot HB (6/6) + DR (3/3) đều có đúng giờ; run 180 dispatch 20:36:19Z (ngay sau run 179 timeout); các job khác (feed-pulse-03) cũng có run trong cửa sổ 20:36–21:00Z (đọc #1: 4 job có run started). Scheduler sống suốt 20:36–23:31Z.
- **Nguyên nhân outage 8.406 s (15:15:35Z–17:35:39Z) VẪN chưa xác định (host-side)** — không có thêm bằng chứng mới đợt này (không outage mới để đối chiếu). Giao parent/T0-181 xem xét tiếp. **Muộn HB lũy kế GIỮ 10** (0 muộn mới đợt 180).

### 2.8 Đối chiếu chéo các luồng đợt 180 (chỉ ghi nhận, từ cờ `.done` + LIMITS trên đĩa)

- **T0-180** (cờ 21:18Z): **#95 XÁC NHẬN 9 nguồn** (nợ đợt 179 đã trả; marker sống qua **47 reboot #49–#95**); **O8 trên #95 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21, 21:13:23–21:16:02Z, sau POSTBOOT_PASS #95 replay-đầy-đủ 20:59:47Z); 0 attempt chồng. LIMITS 12.407 B. **Lưu ý: T0-180 đóng cờ 21:18Z, TRƯỚC #96 (21:20:56Z) — #96/#97/#98 chờ T0-181.**
- **T1-180** (cờ 21:03Z): **verify đợt 179: PASS** — đợt 179 = 10/15/15/14; lũy kế 111–179 = 678/1.180/1.026/848; chờ push 166–179 = 140/201/187/184; tái kiểm 111–178 = 668/1.165/1.012/834 — khớp lần thứ 80 liên tiếp; 0 file thiếu; **đã sửa 3 lệch prose aggregate 178 §10.3 + GAP theo quyết (p) đợt 179** (stage thành batch đợt 180). LIMITS 8.838 B.
- **T2-180** (cờ 21:30Z): **(m) #95 DƯƠNG (CUỐI cấp T2)** — +38,743 s (khớp T7-179 từng ms); **n ứng viên 37/38 → 38/39** (nếu parent chấp nhận); **INSIDE #94 FALSE (FULL140) — chuỗi 4 → 0 (ĐỨT tại #94)**; **INSIDE #95 TRUE (FULL141) — chuỗi MỚI = 1**; **mù #96?/#95?/#94?/#88?/#77? VẪN MỞ** (hole-recheck lần 24 NEW=0); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 23**. LIMITS 29.938 B.
- **T4-180** (cờ 21:29Z): **lượt yên #49: CÓ lượt hợp lệ** — attempt1-95b483a2 20/20 + B 5/5, tickCost median 44,0 ms — **chuỗi lượt yên hợp lệ 42 → 43**; gate0=T5 (POSTBOOT_PASS #95 replay-đầy-đủ, không caveat); **0 vi phạm — chuỗi 0 vi phạm 1 → 2**. LIMITS 36.551 B.
- **T5-180** (cờ 21:05Z): **POSTBOOT_PASS #95 ĐÃ CÓ 20:59:47Z** (replay-đầy-đủ, poll=0, **KHÔNG caveat** — khác #94 repair); watcher-180 hạn 23:35:00Z; hướng (3) VẪN ĐỨNG. **Lưu ý: T5-180 đóng cờ 21:05Z, TRƯỚC #96 — POSTBOOT_PASS #96/#97/#98 thuộc T5-181.** LIMITS 34.463 B.
- **T6-180** (cờ 21:19Z): **(A) 120/120 lần thứ 30** (tổng 3.600/3.600); **#95 CÓ GIẾT HOLDER — chuỗi "không giết holder" từ #69 ĐỨT ở 26 reboot** (#69–#94; #95 là ca giết holder đầu tiên kể từ #68 — diag attempt 1 của T8-179 giữ lock 87 s, bị #95 giết); **prune lần 55: xóa 2 file**, queue 102 → 100 file. LIMITS 37.747 B (sát giới hạn push, chỉ dư 21 B).
- **T8-180** (cờ 22:55Z): **driver hb128 CHUẨN MỚI: WebKit 3/3 + Chromium 3/3 — SẠCH 6/6 trên #96**; **kẹt cộng dồn GIỮ 25**; 86n2-P1 KHÔNG kẹt lần thứ năm liên tiếp; **đối chứng bản chuẩn cũ 86n2 WebKit KẸT ở P4-lần1** (ngoài harness, không đếm); **reboot #96 giữa phiên** (gap 7.834 s — khớp T7); **POSTBOOT_PASS #96 ĐÃ CÓ 22:08:08Z** (repair, poll=1, CÓ caveat); **chuỗi WebKit FULL PASS VẪN 0** (chân tách boot); checklist (o) 21/21. LIMITS 37.197 B.
- **T9-180** (cờ 22:58Z): **headroom 0** (lần thứ 40); **cửa sổ thoáng #96 QUAN SÁT ĐƯỢC lần đầu kể từ #91** (boot+70s = 2.903, dưới chuẩn "mở lớn"); **E-205 KẾT THÚC BỞI SAG; E-206/E-207/E-208 mới; tổng ghim 19/116 (16,4%)**; **ENOSPC 157 dòng (đợt thứ 29)**; **birefnet 0 thử lần thứ 34**. LIMITS 33.703 B.
- **Cờ đợt 180 lúc T7 đóng (~23:32Z): 8/9 có nội dung** (T0/T1/T2/T4/T5/T6/T8/T9; T7 là cờ thứ 9). 6/9 trong hạn cờ ~23:00Z (T0/T1/T2/T4/T5/T6); **T8 đóng cờ 22:55Z (trong hạn)** và **T9 đóng cờ 22:58Z (trong hạn)** — cả hai sau #96 nhưng trước #97; T10-180 chưa đóng sổ lúc T7 đóng — batch T7 gộp muộn theo tiền lệ nếu T10 đóng trước. **Chuỗi 9/9 cờ (mới = 1 từ đợt 179) có giữ được không — T10-180 chốt đếm cuối.**

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 179/180 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #96/#98 — cả hai đã khép hẳn lúc đóng; #97 bị #98 cắt ngang ở +576 s — đếm trong phần cửa quan sát được [btime, btime #98), ghi rõ caveat; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. **Đợt này T7 xác minh thiếu bằng SQL trực tiếp** (COUNT(*) theo scheduled_for + truy vấn theo started_at — 0 slot thiếu trong cửa nên không cần truy vấn khoảng im lặng; xem §2.6/§2.7).
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + F-176-T7-5). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #96/#97/#98 đều là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning = 1 theo cả EVENTS lẫn truy vấn DB (finished NULL vẫn tính là sống).
4. Cửa kiểm đợt này ~2h35' (20:57Z → 23:32Z 23/11), đủ 6 slot HB + 3 slot DR trong cửa + run vcut 179 (kết cục) và 180 (theo dõi + viết lại ×3 tại #96/#97/#98) + 3 reboot mới giữa phiên. Tám lần đọc DB đầy đủ (đọc #1–#8, gồm đọc #3 phát hiện #96, đọc #7 phát hiện #97, đọc #8 phát hiện #98); run 179 đọc đầy đủ 1 lần (khớp hoàn toàn với T7-179 ở mọi trường + events); run 180 đọc đầy đủ 6 lần (started_at đổi đúng 3 lần, mỗi lần sau một reboot; claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; HB 23:20:50Z + DR 23:00Z thuộc cửa đợt 180 (trong hạn cờ ~23:00Z + trễ đóng cờ để kiểm đủ slot — cùng mẫu T7-179). HB 23:50:50Z + DR 00:00Z (ngày 24/11) thuộc cửa T7-181.
6. **3 sleep bị SIGTERM trong phiên này** (sleep #2 ~21:03Z chết theo #96; sleep #3 ~22:52Z chết theo #97; sleep #4 ~23:04Z chết theo #98 — F-180-T7-1/T7-2/T7-3); 4 sleep còn lại hoàn thành. **Boot ĐỔI 3 lần trong phiên** (95b483a2 → 8d2a69df → 9e440707 → e62eef3f) — T7 phát hiện mỗi boot mới trong ~40–47 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn e62eef3f (#98).
7. T7 đóng cờ ~23:32Z — trễ ~32' so với hạn cờ ~23:00Z (để kiểm DR 23:00Z + HB 23:20:50Z + xác minh #96/#97/#98 + đếm cuối cửa hẹp #98 sau khi khép 23:31:23Z — cùng mẫu T7-179 trễ ~29'), trong hạn cứng ~23:35Z. T7 không bỏ slot nào trong cửa; T10-180 chưa đóng sổ lúc T7 đóng — batch T7 gộp muộn theo tiền lệ nếu T10 đóng trước.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix180.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Mọi tuổi run / margin / offset trong LIMITS này đều lấy từ `appendix180.py` — KHÔNG lặp lại F-176-T7-5/F-179-T7-2.

## 4. Cập nhật lũy kế (nối tiếp đợt 179, cùng phương pháp — SỐ SLOT THIẾU)

- Heartbeat: 47/472 → **47/478 slot thiếu** (cửa sổ 14/11 07:50:50 → 24/11 06:20:50 +07). Kiểm toán cửa sổ: 472 + 6 slot mới = 478 ✓ (20:50:50, 21:20:50, 21:50:50, 22:20:50, 22:50:50, 23:20:50). Số thiếu +0 (0 slot thiếu mới); muộn mới +0 (0 HB muộn mới).
- Deterministic-doctor: 53/308 → **53/311 slot thiếu** (cửa sổ 11/11 09:00 → 24/11 06:00 +07). Kiểm toán: 308 + 3 = 311 ✓ (21:00, 22:00, 23:00). Số thiếu +0 (0 slot thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 47/478 = 9,8% (giảm từ 10,0% — 0 thiếu mới, mẫu tăng); DR 53/311 = 17,0% (giảm từ 17,2% — 0 thiếu mới, mẫu tăng).
- Mẫu muộn HB lũy kế: **GIỮ 10 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; **+890 s đợt 179 (HB 17:20:50Z)**; kỷ lục +1.252 s đợt 129) — **0 muộn mới đợt 180**.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 179: TIMEOUT theo hồ sơ daemon (wall gốc 10.828 s, margin −28 s theo cả hai cách tính)** — đọc #1 + events đầy đủ (5 event, 0 event sau timeout eid 10509) + T7-179 đối chiếu khớp (run 179 viết lại ×1 tại #95, claimed không đổi lúc T7-179 đóng). 1 lần viết lại tại #95; claimed→finished 7 s (claimed đổi thành finished − 7 s lúc cuối — cùng mẫu run 171–178). **KHÔNG phải ca ≥60 s thứ mười — số ca GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. **2 run timeout liên tiếp (178 + 179)** — chuỗi succeeded đã đứt tại 178, nay thêm 179.
2. **Run 180 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 10.560 s, còn 240 s tới hạn ngân sách 23:35:51Z; **viết lại ×3 tại #96/#97/#98**) — kết cục thuộc T7-181. **Claimed_at run 180 vẫn giữ nguyên (20:36:19Z) lúc đóng** — T7-181 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 180 = +28 s** (scheduler chờ run 179 timeout xong — chuỗi jitter 0 s run đợt 175–179 ĐỨT tại 180, ghi rõ nguyên nhân).
3. **Reboot #95 (btime 19:10:22Z, boot 95b483a2): XÁC NHẬN 9 nguồn (T0-180)** — nợ đợt 179 đã trả; marker sống qua 47 reboot #49–#95. **#96/#97/#98: T7 xác minh 9 nguồn (giờ thật) — số hiệu CHỜ T0-181 xác minh 9 nguồn.** Gap: #95→#96 = 7.834 s; #96→#97 = 6.111 s; **#97→#98 = 576 s (9m36s — NGẮN BẤT THƯỜNG, lần đầu gap <1.000 s trong chuỗi #93–#98)** — nguyên nhân chưa xác định, giao parent/T0-181.
4. **Điểm (m) #95: T2-180 phán CUỐI — DƯƠNG** (+38,743 s; T7-179 kiểm lại KHỚP từng ms; parent quyết cuối đợt 180). **(m) #96/#97/#98: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +41,129 / +39,441 / +37,030 s, đều TRONG dải, KHÔNG sát biên (margin xấu nhất tới biên dưới: #96 7,129 s; #97 5,441 s; #98 3,030 s — caveat phân số KHÔNG lật được); mỗi cái 1 run sống + 1 requeue duy nhất; **caveat #97: cửa hẹp bị #98 cắt ngang ở +576 s** — đếm trong phần cửa quan sát được; T2-181 phân loại cuối + parent 181. **INSIDE #94 FALSE (FULL140) — chuỗi 4 → 0 (T2-180); INSIDE #95 TRUE (FULL141) — chuỗi MỚI = 1 (T2-180). INSIDE #96 (FULL142) + INSIDE #97 (FULL143) + INSIDE #98 (FULL144) thuộc T2-181.**
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-180 không thu hẹp được cửa lần thứ hai mươi ba — xem LIMITS T2-180) — chờ parent chốt J. T2-181 tiếp tục thu hẹp cửa.
6. **Cửa slot TRONG đợt 180: HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn trong cửa. DR 21:00Z + 22:00Z + 23:00Z CÓ đúng giờ** (nợ chính T7-180 đã trả). **Chuỗi cửa lành 5 lần (175–179) có tính tiếp lần thứ sáu không — parent quyết** (xem §2.6). **Jitter run vcut +28 s (180) — chuỗi jitter 0 s (175–179) ĐỨT.** Toàn bộ 6 slot HB trong cửa đều −316 s; 3 slot DR có đều 0 s. Lũy kế: **HB 47/478, DR 53/311. Muộn HB lũy kế GIỮ 10.**
7. **F-180-T7-1 — Sleep #2 bị SIGTERM theo reboot #96** (cùng mẫu F-179-T7-1/F-178-T7-1/F-177-T7-1/F-176-T7-1/F-175-T7-1/F-174-T7-1): sleep 1.200 s spawn ~21:03Z, chết lúc reboot 21:20:56Z sau ~1.083 s; T7 phát hiện boot mới trong 47 s, 0 số sai.
8. **F-180-T7-2 — Sleep #3 bị SIGTERM theo reboot #97:** sleep 720 s spawn ~22:52Z, chết lúc reboot 23:02:47Z sau ~619 s; T7 phát hiện boot mới trong 42 s, 0 số sai.
9. **F-180-T7-3 — Sleep #4 bị SIGTERM theo reboot #98:** sleep 1.100 s spawn ~23:04Z, chết lúc reboot 23:12:23Z sau ~529 s; T7 phát hiện boot mới trong 40 s, 0 số sai. **Đợt 180 có 3 sleep bị giết (đợt 179 có 1).**
10. **F-178-T7-3 — Cờ round178-t8.done VẪN VẮNG trên đĩa** (nội dung T8-178 đã xác minh trên đĩa qua late merge đợt 178 — chỉ thiếu cờ; không có cờ nào được viết thêm sau đó). **Ở mức T8: ĐÃ HẾT từ đợt 179** (T8-179 + T8-180 ĐÃ CÓ cờ). T10-180 kiểm lại trước khi chốt đếm cờ 9/9 đợt 180.
11. **OUTAGE scheduler 8.406 s đợt 179 (F-179-T7-3): NGUYÊN NHÂN VẪN CHƯA XÁC ĐỊNH (host-side)** — đợt 180 KHÔNG có outage mới, không thêm bằng chứng. Giao parent/T0-181 xem xét tiếp. Outage scheduler đầu tiên ghi nhận trong chuỗi T7 (trước đây chỉ có slot thiếu rời rạc).
12. **Mù #96? (#64) VẪN MỞ** theo T2-180 (hole-recheck lần 24 NEW=0 mọi hố). **Mù #95? (#63) MỞ**; **mù #94? (#62) MỞ**; **mù #88? VẪN MỞ** (hole-recheck lần 24: 337 hit, 0 mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức: INSIDE #94 FALSE (FULL140, chuỗi 4 → 0) + INSIDE #95 TRUE (FULL141, chuỗi mới = 1) (T2-180).
13. **POSTBOOT_PASS #95 ĐÃ CÓ 20:59:47Z (T5-180, replay-đầy-đủ, poll=0, KHÔNG caveat)** — chờ parent quyết có được tính cho gate (a) không (khác cờ repair-caveat #94 — cờ này sạch như #92). **POSTBOOT_PASS #96 ĐÃ CÓ 22:08:08Z (T8-180, repair-sớm-quyết-h, poll=1 — CÓ caveat repair)** — chờ T5-181 xác nhận chính thức. **POSTBOOT_PASS #97/#98 CHƯA CÓ** — T5-181 lo (watcher-180 hạn 23:35:00Z nhiều khả năng chết theo #97/#98). **#95 CÓ GIẾT HOLDER — chuỗi "không giết holder" từ #69 ĐỨT ở 26 reboot** (T6-180). **#96/#97/#98 có giết holder không — thuộc T6-181.** Marker sống qua 47 reboot #49–#95 (T0-180 đếm độc lập 47); sống qua #96/#97/#98 chưa đếm — giao T0-181.
14. **Chuỗi WebKit FULL PASS đang 0** (T8-180: harness hb128 SẠCH 6/6 trên #96 nhưng chân tách boot — chuỗi vẫn 0; T7 không đề xuất số chuỗi). Lượt yên #49 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 42 → 43 (T4-180, attempt1 trên #95 qua gate (a) có cờ T5 replay-đầy-đủ). Harness hb128 WebKit 3/3 + Chromium 3/3 trên #96 (T8-180) + đối chứng chuẩn cũ 86n2 WebKit KẸT P4-lần1 (ngoài harness). **Chuỗi 0 vi phạm 1 → 2 ở đợt 180** (T4-180: 0 vi phạm; T7-180: 0 vi phạm — chỉ date/sleep/curl -sI + DB đọc + python thuần; không probe dpkg; không script nặng trong cửa sổ attempt).
15. **Chuỗi "0 vi phạm" tính lại từ 1 ở đợt 179** (parent quyết (p) đợt 179: F-179-T4-5 KHÔNG tính vi phạm). **Đợt 180: 0 vi phạm theo T4** (chuỗi 1 → 2); **T7-180: 0 vi phạm** (chỉ date/sleep/curl -sI + DB đọc + python thuần; không probe dpkg; không script nặng trong cửa sổ attempt). Quy tắc nhắc lại cho đợt 181: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **0/8 file LIMITS đợt 180 đã có VƯỢT giới hạn push 37.768 B** (T6 37.747 B — chỉ dư 21 B) — đề nghị các T sau gọn file LIMITS lại; T7-180 giữ gọn dưới giới hạn.
16. **Harness + (c')/(f') Plan B + headroom + ENOSPC + birefnet + E-206–E-208: thuộc T8/T9-180** — T7 không ghi thay. (c')/(f') Plan B F-179-T8-5 thuộc T8-180 (xem LIMITS T8); ENOSPC 157 dòng trực tiếp (đợt thứ 29); birefnet 0 thử lần thứ 34; cửa sổ thoáng #96 QUAN SÁT ĐƯỢC lần đầu từ #91.

## 6. Phụ lục — số liệu từ script `appendix180.py` (epoch thô, không gõ tay)

Xem `~/workspace/goals/capcut-clone-video-editor/hidden_files/round180-t7/appendix180.txt` (chạy từ `appendix180.py` cùng thư mục). Tóm tắt: run 179 TIMEOUT, margin −28 s, cf 7 s, 5 event, viết lại ×1; run 180 jitter +28 s, viết lại ×3 (#96/#97/#98), tuổi gốc 10.560 s lúc 23:31:51Z (còn 240 s); reboot #96 btime 21:20:56Z gap 7.834 s (m) +41,129 s, #97 btime 23:02:47Z gap 6.111 s (m) +39,441 s, #98 btime 23:12:23Z gap 576 s (m) +37,030 s — cả ba DƯƠNG ỨNG VIÊN; trong cửa HB 6/6 toàn −316 s, DR 3/3 toàn 0 s; lũy kế HB 47/478, DR 53/311; muộn HB giữ 10; không outage mới.
