# PHASE9 ROUND182 T7 — RUN 181 TIMEOUT (−231 S, CF 163 S — CA ≥60 S THỨ MƯỜI MỘT; 4 TIMEOUT LIÊN TIẾP) + REBOOT #100 MỚI GIỮA PHIÊN (RUN 182 VIẾT LẠI ×1) + CỬA SLOT LÀNH LẦN THỨ TÁM

- **Luồng:** T7 đợt 182 (lượt cron 09:35:51 +07 24/11/2026 = 02:35:51Z). Nhiệm vụ theo brief T7-182: (1) kết cục run 181; (2) slot HB 02:50:50Z + DR 03:00Z; (3) cửa slot đợt 182 + lũy kế; (4) outage theo dõi; (5) run 182 theo dõi; (6) reboot mới trong phiên (nếu có).
- **Boot trong phiên:** mở phiên đã là **9897d4b4** (#99, btime 01:11:46Z — **T0-182 XÁC NHẬN 9 nguồn**, cờ 03:05Z). **1 reboot mới giữa phiên:** #100 ứng viên (7a83ab15, btime 03:09:07Z 24/11) — T7 xác minh 9 nguồn; số hiệu chờ T0-183. **Boot lúc đóng cờ vẫn 7a83ab15 (#100 ứng viên).**
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (run 181/182 đầy đủ; HB/DR theo slot; requeue cửa hẹp #100; runs spanning btime; đếm lại toàn bộ họ claimed→finished ≥60 s từ DB tươi), LIMITS T7-181 + aggregate 181 §11 + §12.3 (parent đã quyết (a)–(r), đợt 181 CHẤP NHẬN) + NOTES T7-181 + cờ/LIMITS các luồng đợt 182 (T0/T1/T2/T4/T5/T6/T8/T9 đã đóng — **8/8 cờ có nội dung lúc T7 đóng**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc + script python thuần tính số).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T7 đóng cờ ~05:05Z — trễ ~5' so với hạn cờ ~05:00Z (để kiểm DR 05:00Z + đọc cuối run 182 — cùng mẫu T7-181 trễ ~25'), trong hạn cứng ~05:35Z. T7 không bỏ slot nào trong cửa (HB 05:20:50Z thuộc cửa đợt 182 nhưng SAU lúc đóng — giao T7-183 kiểm, xem §2.4).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 181 kết cục? | **`timeout` 02:43:21Z, margin −231 s** (theo hạn started-gốc; −450 s theo hạn sched — xem §2.1), wall gốc 11.250 s, **claimed→finished 163 s** | §2.1 |
| Run 181 có phải ca ≥60 s thứ mười một? | **CÓ — ca thứ MƯỜI MỘT** (cf 163 s ≥ 60 s; đếm lại toàn bộ họ từ DB tươi; số ca 10 → 11; toàn lịch sử 14 ca) | §2.1 |
| Run 181 viết lại mấy lần? | **×1 (#99)**, 5 event, 0 event sau timeout | §2.1 |
| 4 timeout liên tiếp? | **CÓ — 178+179+180+181, lần đầu 4 timeout liên tiếp** | §2.1 |
| Run 182? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 8.418 s, còn 2.382 s tới hạn 05:43:21Z); **jitter +450 s**; **viết lại ×1** (#100); claimed không đổi | §2.2 |
| Reboot #100? | **GIỜ THẬT, T7 xác minh 9 nguồn**; gap #99→#100 = 7.041 s (mẫu ~2h); số hiệu chờ T0-183 | §2.3 |
| (m) #100? | **DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +42,577 s, TRONG dải, KHÔNG sát biên; 1 run sống + 1 requeue duy nhất | §2.3 |
| Cửa slot đợt 182? | **HB 5/5 (toàn −316 s) + DR 3/3 (toàn 0 s) — 0 thiếu, 0 muộn.** Chuỗi cửa lành 7 lần (175–181) → **LÀNH LẦN THỨ TÁM** (parent quyết cuối) | §2.4 |
| Outage scheduler? | **KHÔNG có outage mới trong cửa đợt 182** — mọi slot có đúng giờ; 5 job có run trong cửa 02:43–05:03Z | §2.5 |
| Đồng hồ trong phiên? | **Cloudflare chênh ~1 s** (lúc phát hiện #100 ~1 s — CF nhanh hơn) — khớp các đợt trước | §2.3 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–181 — SỐ SLOT THIẾU, chỉ cộng tử số khi có slot thiếu thật): heartbeat **47/489 slot thiếu** (số thiếu +0, mẫu số +5); deterministic-doctor **53/317 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 10** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 181 — TIMEOUT 02:43:21Z, margin −231 s (started-gốc) / −450 s (sched), cf 163 s — CA ≥60 S THỨ MƯỜI MỘT; VIẾT LẠI ×1 (đọc #1 + events đối chiếu trực tiếp + NOTES T7-181)

Run 181 (`c5bcb54f-5f1b-403b-8017-15c98767b285`, sched 1795476951 = 23:35:51Z 23/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795476951 = 23:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795477170 → **1795482746 = 01:12:26Z** (#99) — KHÔNG đổi sau đó |
| finished_at_utc | 1795488201 = 02:43:21Z (event `timeout` 02:43:21.203Z, eid 10602) |
| status | **`timeout`** — attempt 1, worker_execution_timed_out true |
| error_text | "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run." |
| worker_claimed_at_utc | **1795488038 = 02:40:38Z** (finished − 163 s) — ĐÃ ĐỔI so với lúc T7-181 đóng cờ (1795477170) |
| worker_boot_generation | cron_boot_7e85b461… (#99) |
| Wall từ scheduled | 1795488201 − 1795476951 = **11.250 s** (3h07m30s) |
| Wall từ started gốc | 1795488201 − 1795477170 = **11.031 s** (3h03m51s) |
| Wall từ started viết lại | 1795488201 − 1795482746 = **5.455 s** (1h30m55s thực thi trên boot #99 sau viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795487970 = 02:39:30Z — finished TRỄ hạn **231 s (margin −231 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795487751 = 02:35:51Z — finished TRỄ hạn **450 s (margin −450 s)** |

- **Hai cách tính margin chênh nhau 219 s = đúng jitter run 181 (+219 s).** T7 lấy **−231 s (started-gốc) làm số chính** — cùng quy ước các đợt trước. **T0-182 tính −450 s theo hạn sched — KHỚP số học với T7 theo cách tính đó** (không phải lệch dữ liệu; T0-182 ghi độc lập margin −231 s theo started-gốc trong cờ .done — KHỚP T7 cả hai cách).
- **Timeout ghi nhận 231 s SAU hạn ngân sách (started-gốc)** — trễ nhất trong chuỗi 4 run timeout: 178 (−38 s) → 179 (−28 s) → 180 (−191 s) → **181 (−231 s)**. Daemon ghi timeout ngày càng trễ. **4 run timeout liên tiếp (178 + 179 + 180 + 181)** — lần đầu 4 timeout liên tiếp trong chuỗi gần đây (chuỗi succeeded 4 run 174–177 đã đứt tại 178).
- Events run 181 (đầy đủ, **đúng 5 event, 0 event sau timeout**): dispatched 23:39:30.791Z (10558) + requeued 01:12:26.108Z (10580) + dispatched 10581 + reattached 10582 + **`timeout` 02:43:21.203Z (10602)**. **ĐÚNG 1 LẦN VIẾT LẠI** (#99) — khớp hoàn toàn NOTES + LIMITS T7-181 (4 event tới lúc đóng + timeout).
- **Claimed→finished = 163 s — THUỘC họ ≥60 s.** Claimed_at đổi lúc cuối từ 1795477170 (T7-181 đọc 8 lần không đổi tới 02:21Z) thành 1795488038 = finished − 163 s (cùng mẫu run 171–180: claimed đổi thành finished − X s lúc cuối). **Đếm lại toàn bộ họ từ DB tươi** (truy vấn `finished − claimed ≥ 60`, mọi status có finished, giá trị claimed CUỐI CÙNG — định nghĩa thống nhất F-173-T7-2, parent đã dùng ở (n) đợt 179/180/181): **14 ca toàn lịch sử** (134: 244 s, 138: 141 s, 146: 95 s, 156: 123 s, 159: 66 s, 164: 66 s, 166: 64 s, 167: 108 s, 170: 110 s, 171: 82 s, 172: 109 s, 175: 88 s, 180: 86 s, **181: 163 s**); **cửa sổ từ run 154: 11 ca** (156/159/164/166/167/170/171/172/175/180/**181**). **Run 181 = ca thứ MƯỜI MỘT — số ca 10 → 11.** Run 181 là **ca timeout THỨ HAI trong họ ≥60 s** (180 là ca đầu tiên).
- **Đối chiếu NOTES T7-181:** started ×1 (#99), claimed 1795477170 lúc đóng, 4 event — KHỚP hoàn toàn với DB tươi; chỉ claimed đổi sau khi T7-181 đóng cờ (cùng mẫu các đợt trước — T0-182 cũng ghi nhận độc lập claimed đã đổi).

### 2.2 Run 182 — vẫn `running` lúc đóng cờ, jitter +450 s, viết lại ×1 (#100), claimed không đổi

Run 182 (`8d3c3cb4-a3d0-4e28-b608-e8dec1e1c863`, sched 1795487751 = 02:35:51Z 24/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795487751 | 02:35:51Z 24/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795488201 → **1795489789** | 02:43:21Z → **03:09:49Z** |
| worker_claimed_at | 1795488202 | 02:43:22Z (KHÔNG đổi qua mọi lần đọc) |
| worker_boot_generation | 7e85b461… → **4ac4ff66…** | #99 → **#100 ứng viên** |
| Hạn ngân sách (started gốc + 10.800 s) | 1795499001 | 05:43:21Z 24/11 |

- **Jitter +450 s** — run 182 dispatch 02:43:21Z, đúng giây run 181 timeout (finished 02:43:21Z); scheduler chờ run 181 timeout xong mới dispatch lượt kế (cùng mẫu run 181 jitter +219 s do run 180 timeout trễ). **Chuỗi jitter run vcut: 0 s (175–179) → +28 s (180) → +219 s (181) → +450 s (182)** — tăng theo độ trễ timeout của run trước.
- 6 lần đọc DB trong phiên (đọc #1 ~02:52Z, #2 ~03:10Z, #3 ~03:51Z, #4 ~04:20Z, #5 ~04:50Z, đọc cuối ~05:03Z): run 182 `running` ở mọi lần đọc; started_at đổi đúng 1 lần (sau reboot #100); claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): lúc 04:50Z ~7.593 s; lúc đóng 05:03:39Z **8.418 s, còn 2.382 s** tới hạn ngân sách 05:43:21Z. **Hạn run 182 (05:43:21Z) SAU hạn cứng đợt 182 (~05:35Z) — kết cục thuộc T7-183** (cùng mẫu các đợt trước).
- Events run 182 tới lúc đóng cờ: đúng 4 event — dispatched 02:43:21.243Z (10603) + **requeued 03:09:49.577Z (10610) + dispatched 03:09:49.811Z (10611) + reattached 03:09:49.988Z (10612)**.

### 2.3 Reboot #100 MỚI GIỮA PHIÊN (btime 03:09:07Z, boot 7a83ab15) — RUN 182 VIẾT LẠI LẦN 1 + (m) #100 DƯƠNG ỨNG VIÊN

- **Reboot #100 ứng viên: boot 7a83ab15-7321-43c3-8105-06e5977c4e80, btime 1795489747 = 03:09:07Z 24/11.** Xác minh T7 (lúc phát hiện ~03:09:56Z — sleep #1 bị SIGTERM, kiểm lại lúc đóng ~05:03Z — cả hai lần đều 7a83ab15, btime 1795489747): boot_id + btime /proc/stat + `uptime -s` 03:09:07Z (khớp) + /proc/1 mtime 03:09:18.136Z (+11,136 s) + journal idx 0 duy nhất, first entry 03:09:18Z (+11 s) + wtmp begins 03:09:18Z (+11 s) + `last` reboot 03:09 still running + `who -b` 03:09. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 03:10:21 GMT vs 03:10:20 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #100 theo đếm tuần tự — CHỜ T0-183 xác minh 9 nguồn** (T0-182 đóng cờ 03:05Z, TRƯỚC #100; T2-182 ghi số liệu thô khớp T7: btime 03:09:07Z, gap 7.041 s, boot 7a83ab15).
- **Ghi chú:** /proc/1 mtime +11,136 s — **TRỞ LẠI +11,x s ở #96/#97/#98** (T7-180: +11,494 / +11,711 / +11,842 s); #99 là +16,118 s (T0-182 F-182-T0-2: boot #99 chậm lên userspace ~5 s, KHÔNG phải lệch đồng hồ — đã làm rõ ghi chú T7-181).
- **T7 phát hiện #100 trong ~49 s sau btime** (btime 03:09:07Z → kiểm đầu 03:09:56Z; sleep bị SIGTERM trùng thời điểm — xem F-182-T7-1).
- **Gap #99→#100 (btime−btime): 1795489747 − 1795482706 = 7.041 s (1h57m21s — mẫu ~2h).** Chuỗi gap gần đây: 6.111 / 576 / 7.163 / **7.041 s** (gap 576 s #97→#98 vẫn là ca ngắn bất thường duy nhất trong chuỗi #93–#100).
- **#100 xảy ra TRONG lúc run 182 chạy:** run 182 dispatch gốc 02:43:21Z, btime #100 03:09:07Z (tuổi gốc lúc btime **1.546 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 182)** — theo EVENTS (dispatched trước btime, chưa finish) + truy vấn DB (scheduled ≤ btime AND (finished NULL OR finished > btime): ĐÚNG 1 dòng — run 182).
- **Run 182 BỊ VIẾT LẠI LẦN 1 tại #100:** started 1795488201 → **1795489789 = 03:09:49Z** (dịch **+1.588 s**); boot_gen đổi 7e85b461 (#99) → **4ac4ff66** (#100 ứng viên); **claimed_at KHÔNG ĐỔI (1795488202)**; vẫn running, attempt 1, error null.
- **Requeue do #100 (cửa hẹp [03:09:07Z, 03:28:07Z], kiểm sau khi cửa khép hẳn ở đọc #3 ~03:51Z): ĐÚNG 1 DÒNG** — run 182, eid 10610, 03:09:49.577Z. Không job nào khác bị requeue do #100. Band (m) [03:09:40Z, 03:09:56,8Z]: ĐÚNG 1 requeue (cùng dòng).
- **Requeue offset +42,577 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 9,577 s, cách biên TRÊN 7,223 s** (03:09:49.577Z − btime nguyên 1795489747). **(m) #100 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-183 phân loại cuối + parent 183. **KHÔNG sát biên:** offset thật ∈ (41,577 s, 42,577 s] — margin xấu nhất tới biên dưới 8,577 s >> 1 s — **caveat phân số KHÔNG lật được**.
- **DR 03:00Z (slot ngay trước btime #100 9m07s) XONG TRƯỚC #100** (started = 03:00:00Z, finished 03:00:01Z — xem §2.4) — #100 KHÔNG ảnh hưởng slot này. **HB 03:20:50Z dispatch SAU #100** (started 03:15:34Z, trên boot #100) — scheduler hồi phục nhanh sau reboot.
- **Sleep của T7 bị giết theo #100** (xem F-182-T7-1): sleep 1.620 s spawn ~02:53Z, chết lúc reboot 03:09:07Z sau ~951 s; T7 phát hiện boot mới trong 49 s, 0 số liệu mất, 0 số sai. **Đợt 182 có 1 sleep bị giết (đợt 181 có 1).**

### 2.4 Slot HB/DR — TRONG CỬA ĐỢT 182: HB 5/5 (toàn −316 s) + DR 3/3 (toàn 0 s) — 0 THIẾU, 0 MUỘN

**Trong cửa đợt 182 (sau giờ mở 02:35:51Z, tới lúc đóng ~05:03Z) — HB 5/5 + DR 3/3:**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 09:50:50 (02:50:50Z) | 3b817433 | 02:45:34 | **−316 s** | CÓ |
| 10:20:50 (03:20:50Z) | 7e31185f | 03:15:34 | **−316 s** | CÓ |
| 10:50:50 (03:50:50Z) | 486e09a0 | 03:45:34 | **−316 s** | CÓ |
| 11:20:50 (04:20:50Z) | eba09ded | 04:15:34 | **−316 s** | CÓ |
| 11:50:50 (04:50:50Z) | 19868fd5 | 04:45:34 | **−316 s** | CÓ |

- Cả 5 slot `succeeded`, attempt=1, error_text=null. **Toàn −316 s.** 0 muộn mới trong cửa. (HB 03:20:50Z dispatch trên #100, sau btime #100 6m27s; HB 02:50:50Z dispatch trên #99.)
- Kiểm COUNT trực tiếp cuối cửa: heartbeat scheduled_for ∈ [02:35:51Z, 05:00:00Z] = **5 dòng** — khớp 5 slot trên; 0 slot thiếu.

**Deterministic-doctor trong cửa: 3/3 có — DR 03:00Z + 04:00Z + 05:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 10:00 (03:00Z) | 26695ce5 | 03:00:00 | 0 s | CÓ |
| 11:00 (04:00Z) | fe0dca80 | 04:00:00 | 0 s | CÓ |
| 12:00 (05:00Z) | 3d90cfe4 | 05:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started (DR 03:00Z finished 03:00:01Z).
- **HB 02:50:50Z + DR 03:00Z CÓ đúng giờ** — nợ chính của T7-182 (cùng các slot còn lại trong cửa) nay đã trả. (DR 03:00Z xong trước #100 9m07s; DR 05:00Z dispatch trên #100.)
- **Cửa slot TRONG đợt 182: LÀNH (HB 5/5 + DR 3/3 — 0 thiếu, 0 muộn).** Chuỗi cửa lành 7 lần (175–181, parent quyết (o) đợt 181) **có tính tiếp lần thứ tám không — parent quyết**: trong cửa đợt 182 không có slot thiếu/muộn nào; reboot #100 giữa phiên KHÔNG làm thiếu/muộn slot nào (DR 03:00Z xong trước #100 9m07s; HB 03:20:50Z dispatch sau #100 6m27s — scheduler hồi phục nhanh).
- **HB 05:20:50Z thuộc cửa đợt 182 (trong span 02:35:51Z–05:35:51Z) nhưng SAU lúc T7 đóng cờ (~05:03Z) — giao T7-183 kiểm** (cùng mẫu run 182: kết cục thuộc lượt sau khi slot nằm sau hạn đóng cờ).

### 2.5 OUTAGE scheduler 8.406 s đợt 179 — theo dõi thêm: KHÔNG có outage mới trong cửa đợt 182

- **Không có khoảng im lặng nào trong cửa đợt 182:** mọi slot HB (5/5) + DR (3/3) đều có đúng giờ; run 182 dispatch 02:43:21Z (ngay sau run 181 timeout); requeue #100 ghi trong 43 s sau btime; **5 job có run started trong cửa sổ 02:43:21Z–05:03:39Z** (deterministic-doctor 3, feed-pulse-10 ×1, feed-pulse-11 ×1, heartbeat 5, vcut-build-loop 1). Scheduler sống suốt 02:43–05:03Z.
- **Nguyên nhân outage 8.406 s (15:15:35Z–17:35:39Z) VẪN chưa xác định (host-side)** — không có thêm bằng chứng mới đợt này (không outage mới để đối chiếu). Giao parent/T0-183 xem xét tiếp. **Muộn HB lũy kế GIỮ 10** (0 muộn mới đợt 182).

### 2.6 Đối chiếu chéo các luồng đợt 182 (chỉ ghi nhận, từ cờ `.done` + LIMITS trên đĩa)

- **T0-182** (cờ 03:05Z): **#99 XÁC NHẬN 9 nguồn** (nợ đợt 181 đã trả; marker sống qua **51 reboot #49–#99**); **(m) #99 số liệu thô +40,109 s** (KHÔNG tự phân loại cuối — thuộc T2-182); **run 181 TIMEOUT margin −231 s theo hạn started-gốc / −450 s theo hạn sched** (KHỚP T7-182 cả hai cách; claimed→finished 163 s — KHỚP T7-182); **POSTBOOT_PASS #99 ĐÃ CÓ 02:55:07Z** (replay-đầy-đủ, poll=0, KHÔNG caveat); **O8 trên #99 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21). **Lưu ý: T0-182 đóng cờ 03:05Z, TRƯỚC #100 (03:09:07Z) — #100 chờ T0-183.** F-182-T0-2: /proc/1 #99 +16,118 s là boot chậm lên userspace ~5 s, KHÔNG phải lệch đồng hồ (làm rõ ghi chú T7-181). F-182-T0-7: MEMORY.md cập nhật trong phiên ghi §12.3 đợt 180/181 là ĐÃ ĐIỀN SẴN (lần 14/15) — ghi nhận nguồn gốc, không đổi verdict. LIMITS 13.835 B.
- **T1-182** (cờ 03:08Z): **verify đợt 181: PASS** — mọi số quyết parent đợt 181 (§12.3 (q)) KHỚP từng số. **Chuỗi khớp lần thứ 85** (84 parent + lần này). **F-181-T1-1 ĐÃ SỬA XONG** (aggregate 180 §10.3 "1.335" → "1.336" — chỉ prose). LIMITS 10.840 B.
- **T2-182** (cờ 03:45Z): **(m) #99 DƯƠNG (CUỐI cấp T2)** — +40,109 s; **INSIDE #99 TRUE (FULL145) — chuỗi 0 → 1** (hai dải FULL145 + FULL144 ĐỒNG THUẬN TRUE — lần đầu đồng thuận kể từ #95; chuỗi mâu thuẫn ngược hướng DỪNG ở 12); **mù #96?/#95?/#94?/#88?/#77? VẪN MỞ** (hole-recheck lần 26); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 25**. **Reboot #100 số liệu thô KHỚP T7** (btime 03:09:07Z, gap 7.041 s, boot 7a83ab15; requeue eid 10610 +42,577 s; run 182 viết lại ×1) — số hiệu + (m) #100 thuộc T7-182/T2-183. EPERM probe #100: ok=2 fail=0. LIMITS 32.401 B.
- **T4-182** (cờ 04:32Z): **lượt yên #51: KHÔNG CÓ lượt hợp lệ (0 attempt)** — POSTBOOT_PASS #100 CHƯA CÓ + gate A không mở trên #99; **chuỗi lượt yên hợp lệ GIỮ 44**; **0 vi phạm — chuỗi 0 vi phạm 3 → 4**; reboot #100 giết poller instance 1. LIMITS 37.171 B.
- **T5-182** (cờ 03:01Z): **POSTBOOT_PASS #99 ĐÃ CÓ 02:55:07Z** (replay-đầy-đủ, poll=0, KHÔNG caveat); **#97 VẪN KHÔNG CÓ — tổng boot không cờ GIỮ 21**; watcher-181 chết theo #99 (poll cuối +22 s); watcher-182 pid 236906 START 02:55:07Z, hạn 05:35:00Z. **Lưu ý: T5-182 đóng cờ 03:01Z, TRƯỚC #100 — POSTBOOT_PASS #100 thuộc T5-183.** LIMITS 35.818 B.
- **T6-182** (cờ 03:14Z): **(A) 120/120 lần thứ 32** (tổng 3.840/3.840); **#99 KHÔNG GIẾT HOLDER** — chuỗi mới "không giết holder" = 4 nếu parent tính tiếp; **#100 ứng viên KHÔNG GIẾT HOLDER theo log** (số hiệu chờ T0-183); **prune lần 57**; F-147-T6-1 chuỗi VẪN 0 (lần thứ tư liên tiếp). LIMITS 37.620 B.
- **T8-182** (cờ ~04:35Z): **harness 0/6 KHÔNG ĐO ĐƯỢC** (replay host DỪNG, dpkg GIỮ 309 từ 03:20:44Z, POSTBOOT #100 CHƯA CÓ, WebKitWebProcess thiếu 3 lib hệ thống); **kẹt harness cộng dồn GIỮ 25**; 86n2-P1 KHÔNG ĐO ĐƯỢC (chuỗi 6 lần không kẹt GIỮ NGUYÊN); O8 T8 KHÔNG CHẠY; B1 0 dòng HB mới; **(c')/(f') ĐƯỢC GIỮ (đề xuất)**; **chuỗi FULL PASS GIỮ 1 (đề xuất — parent quyết)**; F-181-T8-3 ĐÃ SỬA; F-181-T8-1 ĐÃ HẾT. LIMITS 37.380 B.
- **T9-182** (cờ 04:50Z): **E-213 KẾT THÚC BỞI SAG** (mẫu đầu 02:52:01Z); **E-214 (7) / E-215 (7) / E-216 (14) / E-217 (9) mới trên #100; E-218 (7) ĐANG GHIM**; tổng ghim 44/114 (38,6%); **headroom đóng 2** (dưới ngưỡng lần thứ 42); **ENOSPC 86 dòng — đợt thứ 31**; **birefnet 0 thử lần thứ 36**; #51 không lượt hợp lệ; 0 vi phạm (chuỗi 3 → 4). LIMITS 37.764 B (chỉ dư 4 B so với giới hạn push — sát nhất đợt này).
- **Cờ đợt 182 lúc T7 đóng (~05:05Z): 9/9 có nội dung** (T0/T1/T2/T4/T5/T6/T8/T9 + T7). 8/8 luồng kia trong hạn cờ ~05:00Z (T9 04:50Z muộn nhất trong hạn); **T7 đóng cờ ~05:05Z (trễ ~5')** nhưng trong hạn cứng ~05:35Z. T10-182 chưa đóng sổ lúc T7 đóng — batch T7 gộp muộn theo tiền lệ nếu T10 đóng trước. **Chuỗi 9/9 cờ có nội dung = 4 (nếu parent tính tiếp — đợt 181 = 3).**

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 181/182 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #100 — đã khép hẳn lúc đóng; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. **Đợt này T7 xác minh thiếu bằng SQL trực tiếp** (COUNT theo scheduled_for — HB = 5, DR = 3 trong cửa; 0 slot thiếu trong cửa nên không cần truy vấn khoảng im lặng; xem §2.4/§2.5).
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + F-176-T7-5). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #100 là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning = 1 theo cả EVENTS lẫn truy vấn DB (finished NULL vẫn tính là sống; started_at đã viết lại sau btime nên truy vấn spanning KHÔNG được lọc started_at ≤ btime — xem §2.3).
4. Cửa kiểm đợt này ~2h11' (02:52Z → 05:03Z 24/11), đủ 5 slot HB + 3 slot DR trong cửa + run vcut 181 (kết cục) và 182 (theo dõi + viết lại ×1 tại #100) + 1 reboot mới giữa phiên. Sáu lần đọc DB đầy đủ (đọc #1–#6, gồm đọc #2 phát hiện #100); run 181 đọc đầy đủ 1 lần (khớp hoàn toàn với T7-181 + NOTES ở mọi trường + events); run 182 đọc đầy đủ 6 lần (started_at đổi đúng 1 lần, sau reboot #100; claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; HB 04:50:50Z + DR 05:00Z thuộc cửa đợt 182 (trong hạn cờ ~05:00Z + trễ đóng cờ để kiểm đủ slot — cùng mẫu T7-181). **HB 05:20:50Z thuộc span đợt 182 nhưng SAU lúc T7 đóng cờ — giao T7-183 kiểm** (cùng mẫu kết cục run 182 thuộc T7-183).
6. **1 sleep bị SIGTERM trong phiên này** (sleep #1 ~02:53Z chết theo #100 — F-182-T7-1); 4 sleep còn lại hoàn thành. **Boot ĐỔI 1 lần trong phiên** (9897d4b4 → 7a83ab15) — T7 phát hiện boot mới trong ~49 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn 7a83ab15 (#100 ứng viên).
7. T7 đóng cờ ~05:05Z — trễ ~5' so với hạn cờ ~05:00Z (để kiểm DR 05:00Z + đọc cuối run 182 — cùng mẫu T7-181 trễ ~25'), trong hạn cứng ~05:35Z. T7 không bỏ slot nào trong cửa; T10-182 chưa đóng sổ lúc T7 đóng — batch T7 gộp muộn theo tiền lệ nếu T10 đóng trước.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix182.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Mọi tuổi run / margin / offset trong LIMITS này đều lấy từ `appendix182.py` — KHÔNG lặp lại F-176-T7-5/F-179-T7-2.

## 4. Cập nhật lũy kế (nối tiếp đợt 181, cùng phương pháp — SỐ SLOT THIẾU)

- Heartbeat: 47/484 → **47/489 slot thiếu** (cửa sổ 14/11 07:50:50 → 24/11 11:50:50 +07). Kiểm toán cửa sổ: 484 + 5 slot mới = 489 ✓ (02:50:50, 03:20:50, 03:50:50, 04:20:50, 04:50:50). Số thiếu +0 (0 slot thiếu mới); muộn mới +0 (0 HB muộn mới).
- Deterministic-doctor: 53/314 → **53/317 slot thiếu** (cửa sổ 11/11 09:00 → 24/11 12:00 +07). Kiểm toán: 314 + 3 = 317 ✓ (03:00, 04:00, 05:00). Số thiếu +0 (0 slot thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 47/489 = 9,6% (giảm từ 9,7% — 0 thiếu mới, mẫu tăng); DR 53/317 = 16,7% (giảm từ 16,9% — 0 thiếu mới, mẫu tăng).
- Mẫu muộn HB lũy kế: **GIỮ 10 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; **+890 s đợt 179 (HB 17:20:50Z)**; kỷ lục +1.252 s đợt 129) — **0 muộn mới đợt 182**.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 181: TIMEOUT theo hồ sơ daemon (wall gốc 11.250 s; margin −231 s theo hạn started-gốc, −450 s theo hạn sched — chênh 219 s = jitter; T0-182 tính −450 s theo sched, KHỚP số học theo cách tính đó)** — đọc #1 + events đầy đủ (5 event, 0 event sau timeout eid 10602) + NOTES T7-181 đối chiếu khớp (run 181 viết lại ×1 tại #99, claimed đổi sau khi T7-181 đóng cờ). 1 lần viết lại; claimed→finished 163 s. **CA ≥60 S THỨ MƯỜI MỘT — số ca 10 → 11** (đếm lại toàn bộ họ từ DB tươi: 14 ca toàn lịch sử, 11 ca trong cửa sổ từ 154; run 181 là ca timeout THỨ HAI trong họ). **4 run timeout liên tiếp (178 + 179 + 180 + 181)** — lần đầu 4 timeout liên tiếp; timeout ghi nhận trễ 231 s sau hạn ngân sách (started-gốc) — trễ nhất trong chuỗi 4 run.
2. **Run 182 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.418 s, còn 2.382 s tới hạn ngân sách 05:43:21Z; **viết lại ×1 tại #100**) — kết cục thuộc T7-183 (hạn run SAU hạn cứng đợt 182). **Claimed_at run 182 vẫn giữ nguyên (02:43:22Z) lúc đóng** — T7-183 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 182 = +450 s** (scheduler chờ run 181 timeout xong — chuỗi jitter: 0 s (175–179) → +28 s (180) → +219 s (181) → +450 s (182)).
3. **Reboot #99 (btime 01:11:46Z, boot 9897d4b4): XÁC NHẬN 9 nguồn (T0-182)** — nợ đợt 181 đã trả; marker sống qua 51 reboot #49–#99. **#100 ứng viên: T7 xác minh 9 nguồn (giờ thật) — số hiệu CHỜ T0-183 xác minh 9 nguồn.** Gap: #98→#99 = 7.163 s; #99→#100 = 7.041 s (mẫu ~2h; gap 576 s #97→#98 vẫn là ca ngắn bất thường duy nhất). **/proc/1 mtime #100 +11,136 s (trở lại +11,x s như #96/#97/#98)** — F-182-T0-2 đã làm rõ #99 +16,118 s là boot chậm lên userspace ~5 s, KHÔNG phải lệch đồng hồ.
4. **Điểm (m) #99: T2-182 phán CUỐI — DƯƠNG** (phân loại cuối cấp T2 đợt này; n ứng viên 41/42 → 42/43 nếu parent chấp nhận — T10-182 tính chính thức). **(m) #100: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +42,577 s, TRONG dải, KHÔNG sát biên (margin xấu nhất tới biên dưới 8,577 s — caveat phân số KHÔNG lật được); 1 run sống (run 182) + 1 requeue duy nhất; T2-183 phân loại cuối + parent 183. **INSIDE #99 TRUE (FULL145) — chuỗi 0 → 1** (T2-182; hai dải đồng thuận TRUE lần đầu kể từ #95; chuỗi mâu thuẫn ngược hướng DỪNG ở 12). **INSIDE #100 (FULL146) thuộc T2-183.**
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-182 không thu hẹp được cửa lần thứ hai mươi lăm — xem LIMITS T2-182) — chờ parent chốt J. T2-183 tiếp tục thu hẹp cửa.
6. **Cửa slot TRONG đợt 182: HB 5/5 + DR 3/3 — 0 thiếu, 0 muộn trong cửa. HB 02:50:50Z + DR 03:00Z CÓ đúng giờ** (nợ chính T7-182 đã trả). **Chuỗi cửa lành 7 lần (175–181) có tính tiếp lần thứ tám không — parent quyết** (xem §2.4). **Jitter run vcut +450 s (182).** Toàn bộ 5 slot HB trong cửa đều −316 s; 3 slot DR có đều 0 s. Lũy kế: **HB 47/489, DR 53/317. Muộn HB lũy kế GIỮ 10. HB 05:20:50Z giao T7-183 kiểm** (sau lúc T7 đóng cờ).
7. **F-182-T7-1 — Sleep #1 bị SIGTERM theo reboot #100** (cùng mẫu F-181-T7-1/F-180-T7-1/T7-2/T7-3 + F-179-T7-1/F-178-T7-1/F-177-T7-1/F-176-T7-1/F-175-T7-1/F-174-T7-1): sleep 1.620 s spawn ~02:53Z, chết lúc reboot 03:09:07Z sau ~951 s; T7 phát hiện boot mới trong 49 s, 0 số sai. **Đợt 182 có 1 sleep bị giết (đợt 181 có 1).**
8. **F-180-T7-3 — Cờ round178-t8.done VẪN VẮNG trên đĩa** (nội dung T8-178 đã xác minh trên đĩa qua late merge đợt 178 — chỉ thiếu cờ; không có cờ nào được viết thêm sau đó). **Ở mức T8: ĐÃ HẾT từ đợt 179** (T8-179 + T8-180 + T8-181 + T8-182 ĐÃ CÓ cờ). T10-182 kiểm lại trước khi chốt đếm cờ 9/9 đợt 182.
9. **OUTAGE scheduler 8.406 s đợt 179 (F-179-T7-3): NGUYÊN NHÂN VẪN CHƯA XÁC ĐỊNH (host-side)** — đợt 182 KHÔNG có outage mới, không thêm bằng chứng. Giao parent/T0-183 xem xét tiếp. Outage scheduler đầu tiên ghi nhận trong chuỗi T7 (trước đây chỉ có slot thiếu rời rạc).
10. **Mù #96? (#64) VẪN MỞ** theo T2-182 (hole-recheck lần 26 NEW=0 mọi hố). **Mù #95? (#63) MỞ**; **mù #94? (#62) MỞ**; **mù #88? VẪN MỞ** (hole-recheck lần 26); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức: INSIDE #99 TRUE (FULL145, chuỗi 0 → 1) (T2-182).
11. **POSTBOOT_PASS #99 ĐÃ CÓ 02:55:07Z (T5-182, replay-đầy-đủ, poll=0, KHÔNG caveat — giá trị chân gate (a) thuộc parent quyết)** — chờ parent quyết. **POSTBOOT_PASS #100 CHƯA CÓ** — T4/T8-182: replay host DỪNG (dpkg GIỮ 309 từ 03:20:44Z), postboot FAIL; watcher-182 pid 236906 hạn 05:35:00Z nhiều khả năng đã chết theo #100 — **thuộc T5-183 xác nhận** (tổng boot không cờ 21 → 22 nếu #100 KHÔNG CÓ cờ). **#99 KHÔNG GIẾT HOLDER** (T6-182) — chuỗi mới "không giết holder" = 4 nếu parent tính tiếp. **#100 có giết holder không — T6-182 ghi KHÔNG GIẾT theo log (số hiệu chờ T0-183).** Marker sống qua 51 reboot #49–#99 (T0-182 đếm độc lập 51); sống qua #100 chưa đếm — giao T0-183.
12. **Chuỗi WebKit FULL PASS: T8-182 đề xuất GIỮ 1** (harness 0/6 KHÔNG ĐO ĐƯỢC đợt này — không phải kẹt; lượt yên #51 KHÔNG CÓ lượt hợp lệ — 0 attempt; O8 T8 KHÔNG CHẠY) — **parent/T10 quyết có giữ 1 không** (T7 không đề xuất số chuỗi). Lượt yên #51 KHÔNG CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ GIỮ 44 (T4-182). **Chuỗi 0 vi phạm 3 → 4** (T4-182: 0 vi phạm; T7-182: 0 vi phạm — chỉ date/sleep/curl -sI + DB đọc + python thuần; không probe dpkg; không script nặng trong cửa sổ attempt). Quy tắc nhắc lại cho đợt 183: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **1/9 file LIMITS đợt 182 SÁT giới hạn push 37.768 B** (T9 37.764 B — chỉ dư 4 B; T6 37.620 B; T8 37.380 B; T4 37.171 B) — đề nghị các T sau gọn file LIMITS lại; T7-182 giữ gọn dưới giới hạn.
13. **Harness + (c')/(f') + headroom + ENOSPC + birefnet + E-214–E-218: thuộc T8/T9-182** — T7 không ghi thay. (c')/(f') ĐƯỢC GIỮ (đề xuất T8-182; replay C5.1 ĐẠT, 0 FP); headroom đóng 2 (dưới ngưỡng lần thứ 42); ENOSPC đợt thứ 31; birefnet 0 thử lần thứ 36; E-213 KẾT THÚC BỞI SAG, E-214–E-217 mới trên #100, E-218 ĐANG GHIM.

## 6. Phụ lục — số liệu từ script `appendix182.py` (epoch thô, không gõ tay)

Xem `~/workspace/goals/capcut-clone-video-editor/hidden_files/round182-t7/appendix182.txt` (chạy từ `appendix182.py` cùng thư mục). Tóm tắt: run 181 TIMEOUT, margin −231 s (started-gốc) / −450 s (sched), cf 163 s — ca ≥60 s thứ MƯỜI MỘT, 5 event, viết lại ×1; 4 timeout liên tiếp lần đầu; run 182 jitter +450 s, viết lại ×1 (#100), tuổi gốc 8.418 s lúc 05:03:39Z (còn 2.382 s); reboot #100 btime 03:09:07Z gap 7.041 s (m) +42,577 s — DƯƠNG ỨNG VIÊN; trong cửa HB 5/5 toàn −316 s, DR 3/3 toàn 0 s; lũy kế HB 47/489, DR 53/317; muộn HB giữ 10; không outage mới.
