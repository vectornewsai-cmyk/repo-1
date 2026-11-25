# PHASE9 ROUND181 T7 — RUN 180 TIMEOUT (−191 S, CF 86 S — CA ≥60 S THỨ MƯỜI) + REBOOT #99 MỚI GIỮA PHIÊN (RUN 181 VIẾT LẠI ×1) + CỬA SLOT LÀNH LẦN THỨ BẢY

- **Luồng:** T7 đợt 181 (lượt cron 06:35:51 +07 24/11/2026 = 23:35:51Z 23/11). Nhiệm vụ theo brief T7-181: (1) kết cục run 180; (2) slot HB 23:50:50Z + DR 00:00Z; (3) cửa slot đợt 181 + lũy kế; (4) outage theo dõi; (5) run 181 theo dõi.
- **Boot trong phiên:** mở phiên đã là **e62eef3f** (#98, btime 23:12:23Z — **T0-181 XÁC NHẬN 9 nguồn**, cờ 00:22Z). **1 reboot mới giữa phiên:** #99 (9897d4b4, btime 01:11:46Z 24/11) — T7 xác minh 9 nguồn; số hiệu chờ T0-182. **Boot lúc đóng cờ vẫn 9897d4b4 (#99).**
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (run 180/181 đầy đủ; HB/DR theo slot; requeue cửa hẹp #99; runs spanning btime; đếm lại toàn bộ họ claimed→finished ≥60 s từ DB tươi), LIMITS T7-180 + aggregate 180 §11 + §12.3 (parent đã quyết (a)–(r), đợt 180 CHẤP NHẬN) + NOTES T7-180 + cờ/LIMITS các luồng đợt 181 (T0/T1/T2/T4/T5/T6/T8/T9 đã đóng — **8/9 cờ có nội dung lúc T7 đóng**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc + script python thuần tính số).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T7 đóng cờ ~02:25Z — trễ ~25' so với hạn cờ ~02:00Z (để kiểm DR 02:00Z + HB 02:20:50Z + xác minh reboot #99 + đếm cuối cửa hẹp #99 sau khi khép 01:30:46Z — cùng mẫu T7-180 trễ ~34'), trong hạn cứng ~02:35Z. T7 không bỏ slot nào trong cửa.

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 180 kết cục? | **`timeout` 23:39:30Z, margin −191 s** (theo hạn started-gốc; −219 s theo hạn sched — xem §2.1), wall gốc 11.019 s, **claimed→finished 86 s** | §2.1 |
| Run 180 có phải ca ≥60 s thứ mười? | **CÓ — ca thứ MƯỜI** (cf 86 s ≥ 60 s; đếm lại toàn bộ họ từ DB tươi; số ca 9 → 10; toàn lịch sử 13 ca) | §2.1 |
| Run 180 viết lại mấy lần? | **×3 (#96/#97/#98)**, 11 event, 0 event sau timeout | §2.1 |
| Run 181? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 9.692 s, còn 1.108 s tới hạn 02:39:30Z); **jitter +219 s**; **viết lại ×1** (#99); claimed không đổi | §2.2 |
| Reboot #99? | **GIỜ THẬT, T7 xác minh 9 nguồn**; gap #98→#99 = 7.163 s (trở lại mẫu ~2h); số hiệu chờ T0-182 | §2.3 |
| (m) #99? | **DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +40,109 s, TRONG dải, KHÔNG sát biên; 1 run sống + 1 requeue duy nhất | §2.3 |
| Cửa slot đợt 181? | **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — 0 thiếu, 0 muộn.** Chuỗi cửa lành 6 lần (175–180) → **LÀNH LẦN THỨ BẢY** (parent quyết cuối) | §2.4 |
| Outage scheduler? | **KHÔNG có outage mới trong cửa đợt 181** — mọi slot có đúng giờ; 6 job có run trong cửa 23:39–02:21Z | §2.5 |
| Đồng hồ trong phiên? | **Cloudflare chênh ~1 s** (lúc mở ~1 s; lúc phát hiện #99 ~1 s — CF nhanh hơn) — khớp các đợt trước | §2.3 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–180 — SỐ SLOT THIẾU, chỉ cộng tử số khi có slot thiếu thật): heartbeat **47/484 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **53/314 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 10** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 180 — TIMEOUT 23:39:30Z, margin −191 s (started-gốc) / −219 s (sched), cf 86 s — CA ≥60 S THỨ MƯỜI; VIẾT LẠI ×3 (đọc #1 + events đối chiếu trực tiếp + NOTES T7-180)

Run 180 (`6ee0f154-4e49-452b-9f64-cdf5aa42662a`, sched 1795466151 = 20:35:51Z 23/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795466151 = 20:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×3) | 1795466179 → 1795468897 → 1795475006 → **1795475580 = 23:13:00Z** (#98) — KHÔNG đổi sau đó |
| finished_at_utc | 1795477170 = 23:39:30Z (event `timeout` 23:39:30.758Z, eid 10557) |
| status | **`timeout`** — attempt 1, worker_execution_timed_out true |
| error_text | "Ran out of its 10800s time budget before finishing; steps it finished stand, the rest did not run." |
| worker_claimed_at_utc | **1795477084 = 23:38:04Z** (finished − 86 s) — ĐÃ ĐỔI so với lúc T7-180 đóng cờ (1795466179) |
| worker_boot_generation | cron_boot_473f9460… (#98) |
| Wall từ scheduled | 1795477170 − 1795466151 = **11.019 s** (3h03m39s) |
| Wall từ started gốc | 1795477170 − 1795466179 = **10.991 s** (3h03m11s) |
| Wall từ started viết lại lần 3 | 1795477170 − 1795475580 = **1.590 s** (26m30s thực thi trên boot #98 sau viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795476979 = 23:36:19Z — finished TRỄ hạn **191 s (margin −191 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795476951 = 23:35:51Z — finished TRỄ hạn **219 s (margin −219 s)** |

- **Hai cách tính margin chênh nhau 28 s = đúng jitter run 180 (+28 s).** T7 lấy **−191 s (started-gốc) làm số chính** — ngân sách 10.800 s của worker tính từ lúc worker bắt đầu (started gốc), cùng quy ước các đợt trước (run 179 hai cách trùng nhau vì jitter 0 nên không lộ khác biệt; T7-174 đã ghi tiền lệ T0 tính theo sched chênh đúng jitter — verdict không đổi theo cách tính nào). **T0-181 tính −219 s theo hạn sched — KHỚP số học với T7 theo cách tính đó** (không phải lệch dữ liệu).
- **Timeout ghi nhận 191 s SAU hạn ngân sách (started-gốc)** — trễ hơn nhiều run 178 (38 s) và run 179 (28 s): daemon ghi timeout trễ nhất trong 3 run timeout liên tiếp. **3 run timeout liên tiếp (178 + 179 + 180)** — lần đầu 3 timeout liên tiếp trong chuỗi gần đây (chuỗi succeeded 4 run 174–177 đã đứt tại 178).
- Events run 180 (đầy đủ, **đúng 11 event, 0 event sau timeout**): dispatched 20:36:19.085Z (10510) + requeued 21:21:37.129Z (10523) + dispatched 10524 + reattached 10525 + requeued 23:03:26.441Z (10547) + dispatched 10548 + reattached 10549 + requeued 23:13:00.030Z (10550) + dispatched 10551 + reattached 10552 + **`timeout` 23:39:30.758Z (10557)**. **ĐÚNG 3 LẦN VIẾT LẠI** (#96/#97/#98) — khớp hoàn toàn NOTES + LIMITS T7-180 (10 event tới lúc đóng + timeout).
- **Claimed→finished = 86 s — THUỘC họ ≥60 s.** Claimed_at đổi lúc cuối từ 1795466179 (T7-180 đọc 6 lần không đổi tới 23:34Z) thành 1795477084 = finished − 86 s (cùng mẫu run 171–179: claimed đổi thành finished − X s lúc cuối). **Đếm lại toàn bộ họ từ DB tươi** (truy vấn `finished − claimed ≥ 60`, mọi status có finished, giá trị claimed CUỐI CÙNG — định nghĩa thống nhất F-173-T7-2, parent đã dùng ở (n) đợt 179): **13 ca toàn lịch sử** (134: 244 s, 138: 141 s, 146: 95 s, 156: 123 s, 159: 66 s, 164: 66 s, 166: 64 s, 167: 108 s, 170: 110 s, 171: 82 s, 172: 109 s, 175: 88 s, **180: 86 s**); **cửa sổ từ run 154: 10 ca** (156/159/164/166/167/170/171/172/175/**180**). **Run 180 = ca thứ MƯỜI — số ca 9 → 10.** Run 180 là **ca timeout ĐẦU TIÊN trong họ ≥60 s** (12 ca trước đều `succeeded`).
- **Đối chiếu NOTES T7-180:** started ×3, claimed 1795466179 lúc đóng, 10 event — KHỚP hoàn toàn với DB tươi; chỉ claimed đổi sau khi T7-180 đóng cờ (cùng mẫu các đợt trước — T0-181 cũng ghi nhận độc lập claimed đã đổi).

### 2.2 Run 181 — vẫn `running` lúc đóng cờ, jitter +219 s, viết lại ×1 (#99), claimed không đổi

Run 181 (`c5bcb54f-5f1b-403b-8017-15c98767b285`, sched 1795476951 = 23:35:51Z 23/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795476951 | 23:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795477170 → **1795482746** | 23:39:30Z → **01:12:26Z 24/11** |
| worker_claimed_at | 1795477170 | 23:39:30Z (KHÔNG đổi qua mọi lần đọc) |
| worker_boot_generation | cron_boot_473f9460… → **7e85b461…** | #98 → **#99** |
| Hạn ngân sách (started gốc + 10.800 s) | 1795487970 | 02:39:30Z 24/11 |

- **Jitter +219 s** — run 181 dispatch 23:39:30Z, đúng giây run 180 timeout (finished 23:39:30Z); scheduler chờ run 180 timeout xong mới dispatch lượt kế (cùng mẫu run 180 jitter +28 s do run 179 timeout trễ). **Chuỗi jitter run vcut: 0 s (175–179) → +28 s (180) → +219 s (181).**
- 7 lần đọc DB trong phiên (đọc #1 ~23:54Z, #2 ~00:02Z, #3 ~00:22Z, #4 ~00:52Z, #5 ~01:12Z, #6 ~01:32Z, #7 ~01:52Z, đọc cuối ~02:21Z): run 181 `running` ở mọi lần đọc; started_at đổi đúng 1 lần (sau reboot #99); claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): lúc 01:52Z ~7.950 s; lúc đóng 02:21:02Z **9.692 s, còn 1.108 s** tới hạn ngân sách 02:39:30Z. **Kết cục thuộc T7-182** (hạn cứng đóng đợt 181 là ~02:35Z, TRƯỚC hạn run 02:39:30Z — cùng mẫu các đợt trước).
- Events run 181 tới lúc đóng cờ: đúng 4 event — dispatched 23:39:30.791Z (10558) + **requeued 01:12:26.108Z (10580) + dispatched 01:12:26.203Z (10581) + reattached 01:12:26.301Z (10582)**.

### 2.3 Reboot #99 MỚI GIỮA PHIÊN (btime 01:11:46Z, boot 9897d4b4) — RUN 181 VIẾT LẠI LẦN 1 + (m) #99 DƯƠNG ỨNG VIÊN

- **Reboot #99: boot 9897d4b4-8736-4ca5-accb-3eb55b32f78a, btime 1795482706 = 01:11:46Z 24/11.** Xác minh T7 (lúc phát hiện ~01:12:42Z + kiểm lại lúc đóng ~02:21Z — cả hai lần đều 9897d4b4, btime 1795482706): boot_id + btime /proc/stat + `uptime -s` 01:11:46Z (khớp) + /proc/1 mtime 01:12:02.118Z (+16,118 s) + journal idx 0 duy nhất, first entry 01:12:02Z (+16 s) + wtmp begins 01:12:02Z (+16 s) + `last` reboot 01:12 still running + `who -b` 01:12. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 01:12:43 GMT vs 01:12:42 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #99 theo đếm tuần tự — CHỜ T0-182 xác minh 9 nguồn** (T0-181 đóng cờ 00:22Z, TRƯỚC #99).
- **Ghi chú:** /proc/1 mtime +16,118 s (journal/wtmp cũng +16 s) — LỚN HƠN +11,x s ở #96/#97/#98 (T7-180: +11,494 / +11,711 / +11,842 s; T0-181 cho #98: +11,842 s). T7 ghi nhận khác biệt, không suy đoán nguyên nhân (boot chậm lên userspace hơn ~4–5 s hoặc clock — giao T0-182 xem xét cùng xác minh số hiệu).
- **T7 phát hiện #99 trong ~56 s sau btime** (btime 01:11:46Z → kiểm đầu 01:12:42Z; sleep bị SIGTERM trùng thời điểm — xem F-181-T7-1).
- **Gap #98→#99 (btime−btime): 1795482706 − 1795475543 = 7.163 s (1h59m23s — TRỞ LẠI mẫu ~2h).** Chuỗi gap gần đây: 6.111 / 576 / **7.163 s** (gap 576 s #97→#98 vẫn là ca ngắn bất thường duy nhất trong chuỗi #93–#99).
- **#99 xảy ra TRONG lúc run 181 chạy:** run 181 dispatch gốc 23:39:30Z, btime #99 01:11:46Z (tuổi gốc lúc btime **5.536 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 181)** — theo EVENTS (dispatched trước btime, chưa finish) + truy vấn DB (scheduled ≤ btime AND (finished NULL OR finished > btime): ĐÚNG 1 dòng — run 181). (Truy vấn lần đầu thêm điều kiện started_at ≤ btime cho 0 dòng vì started_at đã viết lại sau btime — T7 sửa lại đúng phương pháp sự kiện + scheduled, ghi rõ để T2-182 khỏi lặp lại.)
- **Run 181 BỊ VIẾT LẠI LẦN 1 tại #99:** started 1795477170 → **1795482746 = 01:12:26Z** (dịch **+5.576 s**); boot_gen đổi 473f9460 (#98) → **7e85b461** (#99); **claimed_at KHÔNG ĐỔI (1795477170)**; vẫn running, attempt 1, error null.
- **Requeue do #99 (cửa hẹp [01:11:46Z, 01:30:46Z], kiểm sau khi cửa khép hẳn ở đọc #6 ~01:32Z): ĐÚNG 1 DÒNG** — run 181, eid 10580, 01:12:26.108Z. Không job nào khác bị requeue do #99. Band (m) [01:12:19Z, 01:12:35,8Z]: ĐÚNG 1 requeue (cùng dòng).
- **Requeue offset +40,109 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 7,109 s, cách biên TRÊN 9,691 s** (01:12:26.108Z − btime nguyên 1795482706). **(m) #99 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-182 phân loại cuối + parent 182. **KHÔNG sát biên:** offset thật ∈ (39,109 s, 40,109 s] — margin xấu nhất tới biên dưới 6,109 s >> 1 s — **caveat phân số KHÔNG lật được**.
- **DR 01:00Z (slot ngay trước btime #99 11m46s) XONG TRƯỚC #99** (started = finished = 01:00:00Z — xem §2.4) — #99 KHÔNG ảnh hưởng slot này. **HB 01:20:50Z dispatch SAU #99** (started 01:15:34Z, trên boot #99) — scheduler hồi phục nhanh sau reboot.
- **Sleep của T7 bị giết theo #99** (xem F-181-T7-1): sleep 1.740 s spawn ~00:52Z, chết lúc reboot 01:11:46Z sau ~1.172 s; T7 phát hiện boot mới trong 56 s, 0 số liệu mất, 0 số sai. **Đợt 181 có 1 sleep bị giết (đợt 180 có 3).**

### 2.4 Slot HB/DR — TRONG CỬA ĐỢT 181: HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — 0 THIẾU, 0 MUỘN

**Trong cửa đợt 181 (sau giờ mở 23:35:51Z) — HB 6/6 + DR 3/3:**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 06:50:50 (23:50:50Z) | 13f6d224 | 23:45:34 | **−316 s** | CÓ |
| 07:20:50 (00:20:50Z) | a4259696 | 00:15:34 | **−316 s** | CÓ |
| 07:50:50 (00:50:50Z) | 44efd4bd | 00:45:34 | **−316 s** | CÓ |
| 08:20:50 (01:20:50Z) | 0549a8f2 | 01:15:34 | **−316 s** | CÓ |
| 08:50:50 (01:50:50Z) | 33f0da90 | 01:45:34 | **−316 s** | CÓ |
| 09:20:50 (02:20:50Z) | c06b69bc | 02:15:34 | **−316 s** | CÓ |

- Cả 6 slot `succeeded`, attempt=1, error_text=null. **Toàn −316 s.** 0 muộn mới trong cửa. (HB 01:20:50Z dispatch trên #99, sau btime #99 3m48s; HB 23:50:50Z dispatch trên #98.)

**Deterministic-doctor trong cửa: 3/3 có — DR 00:00Z + 01:00Z + 02:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 07:00 (00:00Z) | 52178be4 | 00:00:00 | 0 s | CÓ |
| 08:00 (01:00Z) | a856a49f | 01:00:00 | 0 s | CÓ |
| 09:00 (02:00Z) | 4932d854 | 02:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 00:00Z + 01:00Z + 02:00Z CÓ đúng giờ** — nợ chính của T7-181 (cùng HB 23:50:50Z), nay đã trả. (DR 01:00Z xong trước #99 11m46s; DR 02:00Z dispatch trên #99.)
- **Cửa slot TRONG đợt 181: LÀNH (HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn).** Chuỗi cửa lành 6 lần (175–180, parent quyết (o) đợt 180) **có tính tiếp lần thứ bảy không — parent quyết**: trong cửa đợt 181 không có slot thiếu/muộn nào; reboot #99 giữa phiên KHÔNG làm thiếu/muộn slot nào (DR 01:00Z xong trước #99 11m46s; HB 01:20:50Z dispatch sau #99 3m48s — scheduler hồi phục nhanh).

### 2.5 OUTAGE scheduler 8.406 s đợt 179 — theo dõi thêm: KHÔNG có outage mới trong cửa đợt 181

- **Không có khoảng im lặng nào trong cửa đợt 181:** mọi slot HB (6/6) + DR (3/3) đều có đúng giờ; run 181 dispatch 23:39:30Z (ngay sau run 180 timeout); requeue #99 ghi trong 40 s sau btime; **6 job có run started trong cửa sổ 23:39:30Z–02:21:02Z** (deterministic-doctor 3, feed-pulse-06/07/08 ×1 mỗi job, heartbeat 6, vcut-build-loop 1). Scheduler sống suốt 23:39–02:21Z.
- **Nguyên nhân outage 8.406 s (15:15:35Z–17:35:39Z) VẪN chưa xác định (host-side)** — không có thêm bằng chứng mới đợt này (không outage mới để đối chiếu). Giao parent/T0-182 xem xét tiếp. **Muộn HB lũy kế GIỮ 10** (0 muộn mới đợt 181).

### 2.6 Đối chiếu chéo các luồng đợt 181 (chỉ ghi nhận, từ cờ `.done` + LIMITS trên đĩa)

- **T0-181** (cờ 00:22Z): **#98 XÁC NHẬN 9 nguồn** (nợ đợt 180 đã trả; marker sống qua **50 reboot #49–#98**); **(m) #96/#97/#98 KHỚP T7-180** (+41,129 / +39,441 / +37,030 s — phân loại cuối thuộc T2-181); **run 180 TIMEOUT margin −219 s theo hạn sched** (khớp T7-181 theo cách tính đó; T7 lấy −191 s theo hạn started-gốc — xem §2.1); **claimed→finished 86 s** (khớp T7-181); **POSTBOOT_PASS #98 ĐÃ CÓ 00:16:31Z** (repair, poll=1, caveat); **O8 trên #98 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21, 00:17:24–00:20:11Z). **Lưu ý: T0-181 đóng cờ 00:22Z, TRƯỚC #99 (01:11:46Z) — #99 chờ T0-182.** LIMITS 14.413 B.
- **T1-181** (cờ 23:58Z): **verify đợt 180: PASS** — mọi số quyết parent đợt 180 (§12.3 (q)) KHỚP từng số. LIMITS 9.119 B.
- **T2-181** (cờ 00:37Z): **(m) #96/#97/#98 DƯƠNG (CUỐI cấp T2)**; **INSIDE #96 TRUE (FULL142) — chuỗi 1 → 2; INSIDE #97 TRUE (FULL143) — chuỗi 2 → 3; INSIDE #98 FALSE (FULL144) — chuỗi 3 → 0**; **mù #96?/#95?/#94?/#88?/#77? VẪN MỞ** (hole-recheck lần 25); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 24**. LIMITS 36.087 B.
- **T4-181** (cờ 00:31Z): **lượt yên #50: CÓ lượt hợp lệ** — attempt1-`e62eef3f` 20/20 + B 5/5, tickCost median 50,0 ms — **chuỗi lượt yên hợp lệ 43 → 44**; gate0=T5 (POSTBOOT_PASS #98 00:16:31Z, repair, caveat); **0 reboot TRONG cửa sổ attempt**. LIMITS 36.102 B.
- **T5-181** (cờ 00:28Z): **POSTBOOT_PASS #98 ĐÃ CÓ 00:16:31Z** (repair-sớm-quyết-h, poll=1, dpkg 804 — CÙNG profile #96; GST symlink → debroot, **CÓ caveat repair**; tools CHƯA cài); **POSTBOOT_PASS #97 KHÔNG CÓ — KHÔNG bù được** (chết ở boot+576 s, trước trigger repair boot+900 s; không watcher nào sống sau 23:03:16Z). **Lưu ý: T5-181 đóng cờ 00:28Z, TRƯỚC #99 — POSTBOOT_PASS #99 thuộc T5-182.** LIMITS 37.643 B (sát giới hạn push, chỉ dư 125 B).
- **T6-181** (cờ 00:10Z): **(A) 120/120 lần thứ 31** (tổng 3.720/3.720); **#96/#97/#98 ĐỀU KHÔNG GIẾT HOLDER** — chuỗi mới "không giết holder" = 3 reboot (#96–#98) nếu parent tính tiếp từ #96; **prune lần 56: xóa 2 file**, queue 102 → 100 file. LIMITS 37.159 B.
- **T8-181** (cờ 01:06Z): **B1 LIVE SẠCH** (quyết (j) đợt 180: B1 triển khai từ 181); **5 chân FULL PASS CÙNG BOOT #98** (parent/T10 quyết — lượt yên #50 + O8 T0 + O8 T8 + harness + gate (a) cùng #98); **reboot #99 giữa phiên** (T8 ghi #99, btime khớp T7). LIMITS 34.804 B.
- **T9-181** (cờ 02:02Z): **headroom 0** (lần thứ 41); **E-209 (9) / E-210 (5) trên #98; E-211 (7) / E-212 (8) trên #99; E-213 (5) ĐANG GHIM**; tổng ghim 34/123 (27,6%); **cửa sổ thoáng #99 QUAN SÁT ĐƯỢC nhưng 0**; **ENOSPC đợt thứ 30**; **birefnet 0 thử lần thứ 35**. LIMITS 36.057 B.
- **Cờ đợt 181 lúc T7 đóng (~02:25Z): 8/9 có nội dung** (T0/T1/T2/T4/T5/T6/T8/T9; T7 là cờ thứ 9). 7/9 trong hạn cờ ~02:00Z (T0/T1/T2/T4/T5/T6/T8); **T9 đóng cờ 02:02Z (trễ ~2')**; T10-181 chưa đóng sổ lúc T7 đóng — batch T7 gộp muộn theo tiền lệ nếu T10 đóng trước. **Chuỗi 9/9 cờ (mới = 2 từ đợt 180) có giữ được không — T10-181 chốt đếm cuối.**

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 180/181 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #99 — đã khép hẳn lúc đóng; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. **Đợt này T7 xác minh thiếu bằng SQL trực tiếp** (COUNT theo scheduled_for + truy vấn theo started_at — 0 slot thiếu trong cửa nên không cần truy vấn khoảng im lặng; xem §2.4/§2.5).
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + F-176-T7-5). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #99 là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning = 1 theo cả EVENTS lẫn truy vấn DB (finished NULL vẫn tính là sống; started_at đã viết lại sau btime nên truy vấn spanning KHÔNG được lọc started_at ≤ btime — xem §2.3).
4. Cửa kiểm đợt này ~2h27' (23:54Z → 02:21Z 24/11), đủ 6 slot HB + 3 slot DR trong cửa + run vcut 180 (kết cục) và 181 (theo dõi + viết lại ×1 tại #99) + 1 reboot mới giữa phiên. Tám lần đọc DB đầy đủ (đọc #1–#8, gồm đọc #5 phát hiện #99); run 180 đọc đầy đủ 1 lần (khớp hoàn toàn với T7-180 + NOTES ở mọi trường + events); run 181 đọc đầy đủ 8 lần (started_at đổi đúng 1 lần, sau reboot #99; claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; HB 02:20:50Z + DR 02:00Z thuộc cửa đợt 181 (trong hạn cờ ~02:00Z + trễ đóng cờ để kiểm đủ slot — cùng mẫu T7-180). HB 02:50:50Z + DR 03:00Z (ngày 24/11) thuộc cửa T7-182.
6. **1 sleep bị SIGTERM trong phiên này** (sleep #4 ~00:52Z chết theo #99 — F-181-T7-1); 6 sleep còn lại hoàn thành. **Boot ĐỔI 1 lần trong phiên** (e62eef3f → 9897d4b4) — T7 phát hiện boot mới trong ~56 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn 9897d4b4 (#99).
7. T7 đóng cờ ~02:25Z — trễ ~25' so với hạn cờ ~02:00Z (để kiểm DR 02:00Z + HB 02:20:50Z + xác minh #99 + đếm cuối cửa hẹp #99 sau khi khép 01:30:46Z — cùng mẫu T7-180 trễ ~34'), trong hạn cứng ~02:35Z. T7 không bỏ slot nào trong cửa; T10-181 chưa đóng sổ lúc T7 đóng — batch T7 gộp muộn theo tiền lệ nếu T10 đóng trước.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix181.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Mọi tuổi run / margin / offset trong LIMITS này đều lấy từ `appendix181.py` — KHÔNG lặp lại F-176-T7-5/F-179-T7-2.

## 4. Cập nhật lũy kế (nối tiếp đợt 180, cùng phương pháp — SỐ SLOT THIẾU)

- Heartbeat: 47/478 → **47/484 slot thiếu** (cửa sổ 14/11 07:50:50 → 24/11 09:20:50 +07). Kiểm toán cửa sổ: 478 + 6 slot mới = 484 ✓ (23:50:50, 00:20:50, 00:50:50, 01:20:50, 01:50:50, 02:20:50). Số thiếu +0 (0 slot thiếu mới); muộn mới +0 (0 HB muộn mới).
- Deterministic-doctor: 53/311 → **53/314 slot thiếu** (cửa sổ 11/11 09:00 → 24/11 09:00 +07). Kiểm toán: 311 + 3 = 314 ✓ (00:00, 01:00, 02:00). Số thiếu +0 (0 slot thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 47/484 = 9,7% (giảm từ 9,8% — 0 thiếu mới, mẫu tăng); DR 53/314 = 16,9% (giảm từ 17,0% — 0 thiếu mới, mẫu tăng).
- Mẫu muộn HB lũy kế: **GIỮ 10 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; **+890 s đợt 179 (HB 17:20:50Z)**; kỷ lục +1.252 s đợt 129) — **0 muộn mới đợt 181**.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 180: TIMEOUT theo hồ sơ daemon (wall gốc 11.019 s; margin −191 s theo hạn started-gốc, −219 s theo hạn sched — chênh 28 s = jitter; T0-181 tính −219 s theo sched, KHỚP số học theo cách tính đó)** — đọc #1 + events đầy đủ (11 event, 0 event sau timeout eid 10557) + NOTES T7-180 đối chiếu khớp (run 180 viết lại ×3 tại #96/#97/#98, claimed đổi sau khi T7-180 đóng cờ). 3 lần viết lại; claimed→finished 86 s. **CA ≥60 S THỨ MƯỜI — số ca 9 → 10** (đếm lại toàn bộ họ từ DB tươi: 13 ca toàn lịch sử, 10 ca trong cửa sổ từ 154; run 180 là ca timeout ĐẦU TIÊN trong họ). **3 run timeout liên tiếp (178 + 179 + 180)** — lần đầu 3 timeout liên tiếp trong chuỗi gần đây; timeout ghi nhận trễ 191 s sau hạn ngân sách (started-gốc) — trễ nhất trong 3 run.
2. **Run 181 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 9.692 s, còn 1.108 s tới hạn ngân sách 02:39:30Z; **viết lại ×1 tại #99**) — kết cục thuộc T7-182. **Claimed_at run 181 vẫn giữ nguyên (23:39:30Z) lúc đóng** — T7-182 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 181 = +219 s** (scheduler chờ run 180 timeout xong — chuỗi jitter: 0 s (175–179) → +28 s (180) → +219 s (181)).
3. **Reboot #98 (btime 23:12:23Z, boot e62eef3f): XÁC NHẬN 9 nguồn (T0-181)** — nợ đợt 180 đã trả; marker sống qua 50 reboot #49–#98. **#99: T7 xác minh 9 nguồn (giờ thật) — số hiệu CHỜ T0-182 xác minh 9 nguồn.** Gap: #97→#98 = 576 s (ngắn bất thường, nguyên nhân chưa xác định — T0-181 không tìm thấy dấu hiệu host-side trong log truy cập được, F-181-T0-4); #98→#99 = 7.163 s (trở lại mẫu ~2h). **/proc/1 mtime #99 +16,118 s (lớn hơn +11,x s ở #96/#97/#98)** — ghi nhận, giao T0-182 xem xét.
4. **Điểm (m) #96/#97/#98: T2-181 phán CUỐI — DƯƠNG** (phân loại cuối cấp T2 đợt này; n ứng viên 38/39 → 39/40 → 40/41 → 41/42 nếu parent chấp nhận — T10-181 tính chính thức). **(m) #99: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +40,109 s, TRONG dải, KHÔNG sát biên (margin xấu nhất tới biên dưới 6,109 s — caveat phân số KHÔNG lật được); 1 run sống (run 181) + 1 requeue duy nhất; T2-182 phân loại cuối + parent 182. **INSIDE #96 TRUE (FULL142) — chuỗi 1 → 2; INSIDE #97 TRUE (FULL143) — chuỗi 2 → 3; INSIDE #98 FALSE (FULL144) — chuỗi 3 → 0 (T2-181). INSIDE #99 (FULL145) thuộc T2-182.**
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-181 không thu hẹp được cửa lần thứ hai mươi tư — xem LIMITS T2-181) — chờ parent chốt J. T2-182 tiếp tục thu hẹp cửa.
6. **Cửa slot TRONG đợt 181: HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn trong cửa. DR 00:00Z + 01:00Z + 02:00Z CÓ đúng giờ** (nợ chính T7-181 đã trả). **Chuỗi cửa lành 6 lần (175–180) có tính tiếp lần thứ bảy không — parent quyết** (xem §2.4). **Jitter run vcut +219 s (181).** Toàn bộ 6 slot HB trong cửa đều −316 s; 3 slot DR có đều 0 s. Lũy kế: **HB 47/484, DR 53/314. Muộn HB lũy kế GIỮ 10.**
7. **F-181-T7-1 — Sleep #4 bị SIGTERM theo reboot #99** (cùng mẫu F-180-T7-1/T7-2/T7-3 + F-179-T7-1/F-178-T7-1/F-177-T7-1/F-176-T7-1/F-175-T7-1/F-174-T7-1): sleep 1.740 s spawn ~00:52Z, chết lúc reboot 01:11:46Z sau ~1.172 s; T7 phát hiện boot mới trong 56 s, 0 số sai. **Đợt 181 có 1 sleep bị giết (đợt 180 có 3).**
8. **F-180-T7-3 — Cờ round178-t8.done VẪN VẮNG trên đĩa** (nội dung T8-178 đã xác minh trên đĩa qua late merge đợt 178 — chỉ thiếu cờ; không có cờ nào được viết thêm sau đó). **Ở mức T8: ĐÃ HẾT từ đợt 179** (T8-179 + T8-180 + T8-181 ĐÃ CÓ cờ). T10-181 kiểm lại trước khi chốt đếm cờ 9/9 đợt 181.
9. **OUTAGE scheduler 8.406 s đợt 179 (F-179-T7-3): NGUYÊN NHÂN VẪN CHƯA XÁC ĐỊNH (host-side)** — đợt 181 KHÔNG có outage mới, không thêm bằng chứng. Giao parent/T0-182 xem xét tiếp. Outage scheduler đầu tiên ghi nhận trong chuỗi T7 (trước đây chỉ có slot thiếu rời rạc).
10. **Mù #96? (#64) VẪN MỞ** theo T2-181 (hole-recheck lần 25 NEW=0 mọi hố). **Mù #95? (#63) MỞ**; **mù #94? (#62) MỞ**; **mù #88? VẪN MỞ** (hole-recheck lần 25); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức: INSIDE #96 TRUE (FULL142, chuỗi 1 → 2) + INSIDE #97 TRUE (FULL143, chuỗi 2 → 3) + INSIDE #98 FALSE (FULL144, chuỗi 3 → 0) (T2-181).
11. **POSTBOOT_PASS #98 ĐÃ CÓ 00:16:31Z (T5-181, repair, poll=1, CÓ caveat repair — GST symlink, tools CHƯA cài)** — chờ parent quyết giá trị chân gate (a) (tiền lệ #96/#94/#90: CÓ caveat). **POSTBOOT_PASS #97 KHÔNG CÓ — KHÔNG bù được** (T5-181: chết ở boot+576 s, trước trigger repair boot+900 s) — tổng boot không cờ tăng thêm 1 (T10-181 tính chính thức). **POSTBOOT_PASS #99 CHƯA CÓ** — T5-182 lo (watcher-181 hạn 02:35:00Z nhiều khả năng chết theo #99). **#96/#97/#98 ĐỀU KHÔNG GIẾT HOLDER** (T6-181) — chuỗi mới "không giết holder" = 3 reboot (#96–#98) nếu parent tính tiếp từ #96. **#99 có giết holder không — thuộc T6-182.** Marker sống qua 50 reboot #49–#98 (T0-181 đếm độc lập 50); sống qua #99 chưa đếm — giao T0-182.
12. **Chuỗi WebKit FULL PASS: T8-181 ghi 5 chân CÙNG BOOT #98** (lượt yên #50 + O8 T0 + O8 T8 + harness + gate (a) — B1 live sạch) — **parent/T10 quyết có lên 1 không** (T7 không đề xuất số chuỗi). Lượt yên #50 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 43 → 44 (T4-181, attempt1 trên #98 qua gate (a) có caveat repair). **Chuỗi 0 vi phạm 2 → 3** (T4-181: 0 vi phạm; T7-181: 0 vi phạm — chỉ date/sleep/curl -sI + DB đọc + python thuần; không probe dpkg; không script nặng trong cửa sổ attempt). Quy tắc nhắc lại cho đợt 182: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **0/8 file LIMITS đợt 181 đã có VƯỢT giới hạn push 37.768 B** (T5 37.643 B — chỉ dư 125 B) — đề nghị các T sau gọn file LIMITS lại; T7-181 giữ gọn dưới giới hạn.
13. **Harness + (c')/(f') + headroom + ENOSPC + birefnet + E-209–E-213: thuộc T8/T9-181** — T7 không ghi thay. (c')/(f') B1 LIVE SẠCH (T8-181); headroom 0 lần thứ 41; ENOSPC đợt thứ 30; birefnet 0 thử lần thứ 35; cửa sổ thoáng #99 QUAN SÁT ĐƯỢC nhưng 0.

## 6. Phụ lục — số liệu từ script `appendix181.py` (epoch thô, không gõ tay)

Xem `~/workspace/goals/capcut-clone-video-editor/hidden_files/round181-t7/appendix181.txt` (chạy từ `appendix181.py` cùng thư mục). Tóm tắt: run 180 TIMEOUT, margin −191 s (started-gốc) / −219 s (sched), cf 86 s — ca ≥60 s thứ MƯỜI, 11 event, viết lại ×3; run 181 jitter +219 s, viết lại ×1 (#99), tuổi gốc 9.692 s lúc 02:21:02Z (còn 1.108 s); reboot #99 btime 01:11:46Z gap 7.163 s (m) +40,109 s — DƯƠNG ỨNG VIÊN; trong cửa HB 6/6 toàn −316 s, DR 3/3 toàn 0 s; lũy kế HB 47/484, DR 53/314; muộn HB giữ 10; không outage mới.
