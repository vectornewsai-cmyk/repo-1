# PHASE9 ROUND184 T7 — RUN 183 SUCCEEDED (+1.313 S, CF 85 S — CA ≥60 S THỨ MƯỜI BA) + REBOOT #103 MỚI GIỮA PHIÊN (RUN 184 VIẾT LẠI ×1) + CỬA SLOT LÀNH LẦN THỨ MƯỜI?

- **Luồng:** T7 đợt 184 (lượt cron 15:35:51 +07 24/11/2026 = 08:35:51Z). Nhiệm vụ theo brief T7-184: (1) kết cục run 183; (2) run 184 theo dõi; (3) cửa slot HB 08:50:50Z/09:20:50Z/09:50:50Z/10:20:50Z/10:50:50Z + DR 09:00Z/10:00Z/11:00Z; (4) outage theo dõi; (5) đóng trong hạn cờ ~11:00Z, nếu trễ vẫn trong hạn cứng ~11:35Z.
- **Tiền đề dùng:** quyết parent §12.3 aggregate 183 (bản SẠCH — §12.3 TRỐNG khi parent đọc, lần đầu kể từ đợt 179; pre-fill GIỮ 16 — T1-184 xác nhận): **(n) run 182 SUCCEEDED, CA ≥60 s thứ mười hai, số ca 11 → 12; run 183 kết cục thuộc T7-184**; **(o) cửa slot đợt 183 LÀNH lần thứ chín; lũy kế HB 47/495, DR 53/320; muộn HB GIỮ 10**; (q) đếm khớp lần thứ 90 (parent) → T1-184 lần thứ 91.
- **Boot trong phiên:** mở phiên đã là **6ecd948e** (#102, btime 07:07:05Z — **T0-184 XÁC NHẬN 9 nguồn**, cờ 08:52Z). **1 reboot mới giữa phiên:** #103 ứng viên (e0921bda, btime 09:14:55Z 24/11) — T7 xác minh 9 nguồn; số hiệu chờ T0-185. **Boot lúc đóng cờ vẫn e0921bda (#103 ứng viên).**
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (run 183/184 đầy đủ; HB/DR theo slot; requeue cửa hẹp #103; runs spanning btime; đếm lại toàn bộ họ claimed→finished ≥60 s từ DB tươi), LIMITS T7-183 + aggregate 183 §7 + §12.3 (n)(o) + cờ/LIMITS các luồng đợt 184 (T0/T1/T2/T4/T5/T6/T8/T9 đã đóng — **8/8 cờ có nội dung lúc T7 đóng**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc + script python thuần).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T7 đóng cờ ~11:05Z — trễ ~5' so với hạn cờ ~11:00Z (kiểm DR 11:00Z + gọn LIMITS), trong hạn cứng ~11:35Z. Cùng mẫu T7-183 (08:08Z, trễ ~8'). T7 không bỏ slot nào trong cửa.

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 183 kết cục? | **`succeeded` 08:13:58Z, TRƯỚC hạn started-gốc 1.313 s** (margin +1.313 s; +1.313 s theo hạn sched — jitter 0 nên hai hạn trùng nhau), wall gốc 9.487 s, **claimed→finished 85 s** | §2.1 |
| Run 183 có phải ca ≥60 s thứ mười ba? | **CÓ — ca thứ MƯỜI BA** (cf 85 s ≥ 60 s; đếm lại toàn bộ họ từ DB tươi; số ca 12 → 13; toàn lịch sử 16 ca) | §2.1 |
| Run 183 viết lại mấy lần? | **×1 (#102)**, 5 event, 0 event sau succeeded | §2.1 |
| 2 run succeeded liên tiếp? | **CÓ — 182 + 183 đều SUCCEEDED** (chuỗi timeout đã đứt từ 182; không có timeout mới) | §2.1 |
| Run 184? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 8.678 s, còn 2.122 s tới hạn 11:35:51Z); **jitter 0 s**; **viết lại ×1** (#103); claimed không đổi | §2.2 |
| Reboot #103? | **GIỜ THẬT, T7 xác minh 9 nguồn**; gap #102→#103 = 7.670 s (mẫu ~2h); số hiệu chờ T0-185 | §2.2 |
| (m) #103? | **DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +37,543 s, TRONG dải, KHÔNG sát biên; 1 run sống + 1 requeue duy nhất | §2.2 |
| Cửa slot đợt 184? | **HB 5/5 (4× −316 s + 1× −318 s) + DR 3/3 (toàn 0 s) — 0 thiếu, 0 muộn.** Chuỗi cửa lành 9 lần (175–183) → **LÀNH LẦN THỨ MƯỜI** (parent quyết cuối) | §2.3 |
| HB 08:20:50Z (nợ T7-183)? | **CÓ, −316 s** — thuộc span đợt 183, sau lúc T7-183 đóng cờ; không đổi quyết (o) đợt 183 (đã CHẤP NHẬN lành ×9) | §2.3 |
| Outage scheduler? | **KHÔNG có outage mới trong cửa đợt 184** — mọi slot có đúng giờ; 6 job có run trong cửa 08:35–11:00Z | §2.4 |
| Đồng hồ trong phiên? | **#102: Cloudflare chênh ~0–1 s** (lúc mở phiên, theo T0/T6-184); **#103: chênh ~1 s** (CF 09:15:42 GMT vs local 09:15:41 lúc phát hiện) — boot mới đúng giờ | §2.2 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–183 — SỐ SLOT THIẾU, chỉ cộng tử số khi có slot thiếu thật): heartbeat **47/501 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **53/323 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 10** (0 muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 183 — SUCCEEDED 08:13:58Z, TRƯỚC hạn 1.313 s (started-gốc = sched, jitter 0), cf 85 s — CA ≥60 S THỨ MƯỜI BA; VIẾT LẠI ×1 (đọc #1 + events đối chiếu trực tiếp + NOTES T7-183)

Run 183 (`6d832bfb-ecfd-4956-ada9-2bb08acf2992`, sched 1795498551 = 05:35:51Z 24/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795498551 = 05:35:51Z 24/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795498551 → **1795504065 = 07:07:45Z** (#102) |
| finished_at_utc | 1795508038 = 08:13:58Z (event `succeeded` 08:13:58.019Z, eid 10682) |
| status | **`succeeded`** — attempt 1, worker_execution_timed_out false |
| error_text | null |
| worker_claimed_at_utc | **1795507953 = 08:12:33Z** (finished − 85 s) — ĐÃ ĐỔI so với lúc T7-183 đóng cờ (1795498551 = 05:35:51Z) |
| worker_boot_generation | cron_boot_6638cc3a… (#102) |
| Wall từ scheduled | 1795508038 − 1795498551 = **9.487 s** (2h38m07s) |
| Wall từ started gốc | 1795508038 − 1795498551 = **9.487 s** (jitter 0) |
| Wall từ started viết lại #102 | 1795508038 − 1795504065 = **3.973 s** (1h06m13s thực thi trên boot #102 sau viết lại) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795509351 = 08:35:51Z — finished TRƯỚC hạn **1.313 s (margin +1.313 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795509351 = 08:35:51Z — finished TRƯỚC hạn **1.313 s (margin +1.313 s)** |

- **Hai cách tính margin TRÙNG NHAU (1.313 s) vì jitter run 183 = 0 s.** T7 lấy **+1.313 s làm số chính** (margin = hạn − finished; dương = xong sớm). **T0-184 tính +1.313 s độc lập — KHỚP T7 từng số** (xem §2.5).
- **Run 183 là run succeeded thứ hai liên tiếp (182 + 183)** — chuỗi 4 run timeout (178–181) đã đứt tại 182 và KHÔNG nối lại. **KHÔNG có timeout mới.**
- Events run 183 (đầy đủ, **đúng 5 event, 0 event sau succeeded**): dispatched 05:35:51.103Z (10645) + requeued 07:07:45.341Z (10667, #102) + dispatched 07:07:45.415Z (10668) + reattached 07:07:45.711Z (10669) + **`succeeded` 08:13:58.019Z (10682)**. **ĐÚNG 1 LẦN VIẾT LẠI** (#102) — khớp hoàn toàn dự báo T7-183 ("viết lại ×1 tại #102").
- **Requeue #102 offset +40,341 s — TRONG dải (m) 33–49,8 s** (07:07:45.341Z − btime nguyên 1795504025). **(m) #102 — T2-184 phán CUỐI: DƯƠNG** (xem §2.5). T7-183 phán sơ bộ DƯƠNG ỨNG VIÊN — nay T2-184 chốt CUỐI.
- **Claimed→finished = 85 s — THUỘC họ ≥60 s.** Claimed_at đổi lúc cuối từ 1795498551 (T7-183 đọc 9 lần không đổi tới 08:00Z) thành 1795507953 = finished − 85 s (cùng mẫu run 171–182; T0-184 ghi nhận độc lập "claimed→finished 85 s — số thô, thuộc T7-184"). **Đếm lại toàn bộ họ từ DB tươi** (truy vấn `finished − claimed ≥ 60`, mọi status có finished, giá trị claimed CUỐI CÙNG — định nghĩa thống nhất F-173-T7-2): **16 ca toàn lịch sử** (134: 244 s, 138: 141 s, 146: 95 s, 156: 123 s, 159: 66 s, 164: 66 s, 166: 64 s, 167: 108 s, 170: 110 s, 171: 82 s, 172: 109 s, 175: 88 s, 180: 86 s, 181: 163 s, 182: 110 s, **183: 85 s**); **cửa sổ từ run 154: 13 ca** (156/159/164/166/167/170/171/172/175/180/181/182/**183**). **Run 183 = ca thứ MƯỜI BA — số ca 12 → 13.** Run 183 là **ca succeeded THỨ MƯỜI BỐN trong họ** (chỉ 180/181 là timeout trong họ 16 ca).
- **Đối chiếu NOTES T7-183:** started ×1 (#102), claimed 1795498551 lúc đóng, 4 event — KHỚP hoàn toàn với DB tươi ở thời điểm đó; chỉ claimed đổi + event succeeded sau khi T7-183 đóng cờ (cùng mẫu các đợt trước).

### 2.2 Run 184 + reboot #103 MỚI GIỮA PHIÊN (btime 09:14:55Z, boot e0921bda) — RUN 184 VIẾT LẠI LẦN 1 + (m) #103 DƯƠNG ỨNG VIÊN

Run 184 (`b8fc08e4-e2b8-49c0-b865-81921d27855e`, sched 1795509351 = 08:35:51Z 24/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795509351 | 08:35:51Z 24/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795509351 → **1795511732** | 08:35:51Z → **09:15:32Z** |
| worker_claimed_at | 1795509351 | 08:35:51Z (KHÔNG đổi qua mọi lần đọc) |
| worker_boot_generation | 6638cc3a… → **ae630cdd…** | #102 → **#103 ứng viên** |
| Hạn ngân sách (started gốc + 10.800 s) | 1795520151 | 11:35:51Z 24/11 |

- **Jitter 0 s** — run 184 dispatch đúng giây sched (08:35:51Z = run 183 finished + 1.313 s; scheduler không còn chờ timeout). **Chuỗi jitter run vcut: 0 s (175–179) → +28 s (180) → +219 s (181) → +450 s (182) → 0 s (183) → 0 s (184)** — 0 lần thứ hai liên tiếp sau khi run trước succeeded sớm.
- 3 lần đọc DB đầy đủ trong phiên (đọc #1 ~08:42Z, #2 ~09:15Z sau reboot, đọc cuối ~11:00Z): run 184 `running` ở mọi lần đọc; started_at đổi đúng 1 lần (sau reboot #103); claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): lúc đọc cuối 11:00:29Z **8.678 s, còn 2.122 s** tới hạn ngân sách 11:35:51Z. **Hạn run 184 (11:35:51Z) SAU hạn cứng đợt 184 (~11:35Z) — kết cục thuộc T7-185** (cùng mẫu các đợt trước).
- Events run 184 tới lúc đóng cờ: đúng 4 event — dispatched 08:35:51.106Z (10687) + **requeued 09:15:32.543Z (10697) + dispatched 09:15:32.768Z (10699) + reattached 09:15:32.858Z (10702)**.

**Reboot #103 ứng viên: boot e0921bda-b0da-4445-b83f-e494f4e52182, btime 1795511695 = 09:14:55Z 24/11.** Xác minh T7 (lúc phát hiện ~09:15:40Z — sleep #3 bị SIGTERM, kiểm lại lúc đóng ~11:00Z — cả hai lần đều e0921bda, btime 1795511695): boot_id + btime /proc/stat + `uptime -s` 09:14:55Z (khớp) + /proc/1 mtime 09:15:06.753Z (+11,753 s) + journal idx 0 duy nhất, first entry 09:15:07Z (+12 s) + wtmp begins 09:15:06Z (+11 s) + `last` reboot 09:15 still running + `who -b` 09:15. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 09:15:42 GMT vs 09:15:41 (**chênh ~1 s**). **Số hiệu #103 theo đếm tuần tự — CHỜ T0-185 xác minh 9 nguồn** (T0-184 đóng cờ 08:52Z, TRƯỚC #103; T2-184 đóng 09:18Z, ghi số liệu thô khớp T7: boot e0921bda, btime 09:14:55Z, gap 7.670 s; T8/T9-184 ghi khớp).
- **Ghi chú:** /proc/1 mtime +11,753 s — **TRỞ LẠI +11,x s ở #96/#97/#98/#100/#101/#102** (T7-183: #102 +11,145 s).
- **T7 phát hiện #103 trong ~45 s sau btime** (btime 09:14:55Z → kiểm đầu 09:15:40Z; sleep bị SIGTERM trùng thời điểm — xem F-184-T7-1).
- **Gap #102→#103 (btime−btime): 1795511695 − 1795504025 = 7.670 s (2h07m50s — mẫu ~2h).** Chuỗi gap gần đây: 7.041 / 7.400 / 6.878 / **7.670 s** (gap 576 s #97→#98 vẫn là ca ngắn bất thường duy nhất trong chuỗi #93–#103).
- **#103 xảy ra TRONG lúc run 184 chạy:** run 184 dispatch gốc 08:35:51Z, btime #103 09:14:55Z (tuổi gốc lúc btime **2.344 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 184)** — theo EVENTS (dispatched trước btime, chưa finish) + truy vấn DB (scheduled ≤ btime AND (finished NULL OR finished > btime): ĐÚNG 1 dòng — run 184).
- **Run 184 BỊ VIẾT LẠI LẦN 1 tại #103:** started 1795509351 → **1795511732 = 09:15:32Z** (dịch **+37 s**); boot_gen đổi 6638cc3a (#102) → **ae630cdd** (#103 ứng viên); **claimed_at KHÔNG ĐỔI (1795509351)**; vẫn running, attempt 1, error null.
- **Requeue do #103 (cửa hẹp [09:14:55Z, 09:33:55Z], kiểm sau khi cửa khép hẳn ở đọc ~09:40Z): ĐÚNG 1 DÒNG** — run 184, eid 10697, 09:15:32.543Z. Không job nào khác bị requeue do #103. Band (m) [09:15:28Z, 09:15:44,8Z]: ĐÚNG 1 requeue (cùng dòng).
- **Requeue offset +37,543 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 4,543 s, cách biên TRÊN 12,257 s** (09:15:32.543Z − btime nguyên 1795511695). **(m) #103 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-185 phân loại cuối + parent 185 (T2-184 đóng cờ 09:18Z, giao (m) #103 + INSIDE #103 cho T2-185 — xem §2.6). **KHÔNG sát biên:** offset thật ∈ (36,543 s, 37,543 s] — margin xấu nhất tới biên dưới 3,543 s >> 1 s — **caveat phân số KHÔNG lật được**. **KHÔNG có overlap** (trước #103 không có dấu hiệu clock-fast nào trong phiên T7: CF chênh ~1 s lúc phát hiện; T6-184: đồng hồ ở giờ thật CF ~0–1 s).
- **DR 09:00Z XONG TRƯỚC #103** (started = finished = 09:00:00Z — xem §2.3) — #103 KHÔNG ảnh hưởng slot này. **HB 09:20:50Z dispatch SAU #103** (started 09:15:32Z, trên boot #103) — scheduler hồi phục nhanh sau reboot (cùng mẫu #102 đợt 183).
- **Sleep của T7 bị giết theo #103** (xem F-184-T7-1): sleep 1.210 s spawn ~09:00:40Z, chết lúc reboot 09:14:55Z sau ~855 s; T7 phát hiện boot mới trong 45 s, 0 số liệu mất, 0 số sai. **Đợt 184 có 1 sleep bị giết (đợt 183 có 1, đợt 182 có 1, đợt 181 có 1).**

### 2.3 Slot HB/DR — HB 08:20:50Z (nợ T7-183) CÓ + TRONG CỬA ĐỢT 184: HB 5/5 (4× −316 s + 1× −318 s) + DR 3/3 (toàn 0 s) — 0 THIẾU, 0 MUỘN

**HB 08:20:50Z — nợ chính của T7-184 (thuộc span đợt 183, sau lúc T7-183 đóng cờ):**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:20:50 (08:20:50Z) | 3b1313b4 | 08:15:34 | **−316 s** | CÓ |

- Slot `succeeded`, attempt=1, error_text=null. **HB 08:20:50Z CÓ đúng mẫu −316 s** — nợ T7-183 đã trả. Dispatch trên boot #102 (sau btime #102 1h08m29s). **Không đổi quyết (o) đợt 183** (parent đã CHẤP NHẬN cửa lành ×9; slot này chỉ hoàn thiện kế toán span 183: nay đủ 6 HB trong span, tất cả có).

**Trong cửa đợt 184 (sau giờ mở 08:35:51Z, tới lúc đóng ~11:00Z) — HB 5/5 + DR 3/3:**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:50:50 (08:50:50Z) | c37abbe3 | 08:45:34 | **−316 s** | CÓ |
| 16:20:50 (09:20:50Z) | a6a54f07 | 09:15:32 | **−318 s** | CÓ |
| 16:50:50 (09:50:50Z) | ee2d1e32 | 09:45:34 | **−316 s** | CÓ |
| 17:20:50 (10:20:50Z) | 9ec39fc1 | 10:15:34 | **−316 s** | CÓ |
| 17:50:50 (10:50:50Z) | 608c4a63 | 10:45:34 | **−316 s** | CÓ |

- Cả 5 slot `succeeded`, attempt=1, error_text=null. **HB 09:20:50Z −318 s** (sớm hơn mẫu −316 s thường lệ 2 s — dispatch trùng giây viết lại run 184 sau reboot #103; KHÔNG phải muộn — jitter âm là sớm). 0 muộn mới trong cửa. (HB 09:20:50Z dispatch trên #103, sau btime #103 37 s; các HB còn lại dispatch trên #102/#103 theo thời điểm.)
- Kiểm COUNT trực tiếp cuối cửa: heartbeat scheduled_for ∈ [08:35:51Z, 11:00:29Z] = **5 dòng** — khớp 5 slot trên; 0 slot thiếu.

**Deterministic-doctor trong cửa: 3/3 có — DR 09:00Z + 10:00Z + 11:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 16:00 (09:00Z) | 95b8bffb | 09:00:00 | 0 s | CÓ |
| 17:00 (10:00Z) | 6621ddb2 | 10:00:00 | 0 s | CÓ |
| 18:00 (11:00Z) | 7487dbd8 | 11:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- Kiểm COUNT trực tiếp cuối cửa: deterministic-doctor scheduled_for ∈ [08:35:51Z, 11:00:29Z] = **3 dòng** — khớp 3 slot trên; 0 slot thiếu.
- **HB 08:20:50Z + HB 08:50:50Z + DR 09:00Z CÓ đúng giờ** — nợ chính của T7-184 (cùng các slot còn lại trong cửa) nay đã trả. (DR 09:00Z xong trước #103 14m55s; HB 09:20:50Z dispatch sau #103 37 s — scheduler hồi phục nhanh.)
- **Cửa slot TRONG đợt 184: LÀNH (HB 5/5 + DR 3/3 — 0 thiếu, 0 muộn).** Chuỗi cửa lành 9 lần (175–183, parent quyết (o) đợt 183) **có tính tiếp lần thứ mười không — parent quyết**: trong cửa đợt 184 không có slot thiếu/muộn nào; reboot #103 giữa phiên KHÔNG làm thiếu/muộn slot nào (DR 09:00Z xong trước #103 14m55s; HB 09:20:50Z dispatch sau #103 37 s — scheduler hồi phục nhanh).

### 2.4 OUTAGE scheduler 8.406 s đợt 179 — theo dõi thêm: KHÔNG có outage mới trong cửa đợt 184

- **Không có khoảng im lặng nào trong cửa đợt 184:** mọi slot HB (5/5) + DR (3/3) đều có đúng giờ; run 184 dispatch 08:35:51Z (đúng giây sched); requeue #103 ghi trong 38 s sau btime; **6 job có run started trong cửa sổ 08:35:51Z–11:00:29Z** (deterministic-doctor 3, feed-pulse-15 ×1, feed-pulse-16 ×1, feed-pulse-17 ×1, heartbeat 5, vcut-build-loop 1). Scheduler sống suốt 08:35–11:00Z.
- **Nguyên nhân outage 8.406 s (15:15:35Z–17:35:39Z 23/11) VẪN chưa xác định (host-side)** — không có thêm bằng chứng mới đợt này (không outage mới để đối chiếu). Giao parent/T0-185 xem xét tiếp. **Muộn HB lũy kế GIỮ 10** (0 muộn mới đợt 184).

### 2.5 Đối chiếu chéo #102 (T0-184 + T2-184 + T7 — KHỚP từng số)

- **#102: T0-184 XÁC NHẬN 9 nguồn** (boot 6ecd948e, btime 07:07:05Z, gap #101→#102 = 6.878 s) — **KHỚP T7-183** (T7-183 xác minh 9 nguồn trong phiên, giờ thật). **Nợ số hiệu #102 đã trả.** Marker sống qua **54 reboot #49–#102** (T0-184 đếm độc lập; T0-183: 53 reboot #49–#101).
- **(m) #102: T2-184 phán CUỐI — DƯƠNG** (+40,341 s, eid 10667, run 183, 1 run sống; overlap +17 s watcher-183 không lật verdict) — **KHỚP T7-183 từng số** (số liệu thô +40,341 s; T7-183 phán sơ bộ DƯƠNG ỨNG VIÊN). **n ứng viên đề xuất 44/45 → 45/46** (nếu parent chấp nhận #102 DƯƠNG; n chính thức GIỮ 14).
- **INSIDE #102 TRUE (FULL148) — chuỗi 3 → 4** (T2-184; dải chéo FALSE — mâu thuẫn ngược hướng lần thứ 15, chuỗi mới = 3).
- **#102 KHÔNG GIẾT HOLDER — chuỗi "không giết holder" = 7 (#96–#102)** nếu parent tính tiếp (T0-184 + T6-184 độc lập; T6-184: lock trống 170 s trước btime #102). **#103 có giết holder không — thuộc T6-185.**
- **POSTBOOT_PASS #102 ĐÃ CÓ 08:43:59Z (T5-184, replay-đầy-đủ, poll=0, KHÔNG caveat — giá trị chân gate (a) thuộc parent quyết)** — chờ parent quyết. **POSTBOOT_PASS #103 CHƯA CÓ** — thuộc T5-185 (watcher-184 pid 211325 hạn 11:35:00Z nhiều khả năng đã chết theo #103).

### 2.6 Đối chiếu chéo các luồng đợt 184 (chỉ ghi nhận, từ cờ `.done` + LIMITS trên đĩa)

- **T0-184** (cờ 08:52Z): **#102 XÁC NHẬN 9 nguồn**; **O8 trên #102 PASS 3/3** (WebKit 21/21 ×2 + Chromium 21/21, sau POSTBOOT_PASS #102 77 s); **run 183 SUCCEEDED margin +1.313 s — KHỚP T7**; (m) #102 +40,341 s — KHỚP T7-183; **#102 KHÔNG GIẾT HOLDER**; **marker 54 reboot**. LIMITS 12.611 B.
- **T1-184** (cờ 08:51Z): **verify đợt 183: PASS** — mọi số quyết parent đợt 183 (§12.3 (q)) KHỚP từng số. **Chuỗi khớp lần thứ 91** (90 parent + lần này). **F-184-T1-1:** GAP §112 vẫn ghi số TRƯỚC gộp muộn T7 (9/14/14/13; 717/1.243/1.081/903; 179/264/243/239) — lệch đúng +1/+1/+1/+1 so với số CHÍNH THỨC sau gộp muộn; ghi nhận, KHÔNG sửa GAP. **§12.3 đợt 183 SẠCH** (không điền sẵn); **số lần điền sẵn GIỮ 16**. LIMITS 11.878 B.
- **T2-184** (cờ 09:18Z): **(m) #102 DƯƠNG (CUỐI)** — +40,341 s; **INSIDE #102 TRUE (FULL148) — chuỗi 3 → 4**; **mù #96?/#95?/#94?/#88?/#77? VẪN MỞ** (hole-recheck lần 28); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 27**. **F-184-T2-8 — VI PHẠM TUÂN THỦ:** hole-recheck chồng lên T4 attempt1 khởi động (~16 s); class-B B2 VI PHẠM (load1_max 4,48), attempt1 20/20 BỊ HỦY, T4 retry (attempt2 HỢP LỆ). **Reboot #103 mới trong lúc đóng cờ** (boot e0921bda, btime 09:14:55Z, gap 7.670 s — KHỚP T7 từng số); **(m) #103 + INSIDE #103 thuộc T2-185**. LIMITS 34.619 B.
- **T4-184** (cờ 09:33Z): **lượt yên #53 CÓ LƯỢT HỢP LỆ: attempt2 20/20 + lớp B ĐẠT 5/5 + tickCost median 43,5 ms** — **chuỗi lượt yên hợp lệ 45 → 46**; ngân sách dùng 2/3 (attempt1 20/20 NHIỄM TẢI — B2 VI PHẠM do hole-recheck T2 chồng cửa sổ attempt, F-184-T2-8; retry attempt2 sạch); **chuỗi 0 vi phạm GIỮ 0** (vi phạm mới F-184-T2-8 thuộc T2 — parent quyết cuối); quyết (p) kiểm chứng live lần 4: **ĐẠT**. **Reboot #103 xảy ra SAU khi poller thoát 09:12:01Z — không ảnh hưởng #53.** LIMITS 37.683 B.
- **T5-184** (cờ 08:50Z): **POSTBOOT_PASS #102 ĐÃ CÓ 08:43:59Z** (replay-đầy-đủ, poll=0, KHÔNG caveat); **#100 KHÔNG CÓ cờ** (nợ ĐÃ ĐÓNG đợt 183); **tổng boot không cờ GIỮ 22**; watcher-184 pid 211325 ALIVE, hạn 11:35:00Z; **hướng (3) VẪN ĐỨNG lần 31**. LIMITS 34.106 B.
- **T6-184** (cờ 08:57Z): **(A) 120/120 lần thứ 34** (tổng 4.080/4.080); **#102 KHÔNG GIẾT HOLDER — chuỗi mới = 7** (#96–#102) nếu parent tính tiếp; **prune lần 59: xóa 3 file** (queue 103 → 100); **F-147-T6-1 chuỗi VẪN 0** (lần thứ sáu liên tiếp). LIMITS 37.574 B.
- **T8-184** (cờ 10:54Z): **harness 3/6 trên #102/#103: WebKit 0/3 KHÔNG ĐO ĐƯỢC (launch-fail libevent-2.1.so.7 trên #103, exit=1, exitCode 127)** + Chromium 3/3 PASS; **kẹt cộng dồn GIỮ 26 (0 kẹt mới)**; **O8 T8 1/3** (WebKit ×2 KHÔNG ĐO ĐƯỢC + Chromium 21/21 PASS); **FULL PASS: KHÔNG CÓ — chuỗi GIỮ 0** (đề xuất, parent quyết); **(c')/(f') V1: replay C5.1 ĐẠT, 0 FP trên 16 log sạch; THIẾT KẾ V2 ĐÃ CHUẨN BỊ XONG (LIMITS §C4 — parent quyết đợt 184)**; **B1 live CHƯA KIỂM (WebKit launch-fail) — B1 live sạch GIỮ 2; B2 VẪN HOÃN.** F-183-T8-7 ĐÃ SỬA + KIỂM LIVE ĐẠT. LIMITS 37.708 B.
- **T9-184** (cờ 10:47Z): **headroom đóng 0** (lần 44 dưới ngưỡng); **cửa sổ thoáng #103 MỞ 30.000 chạm cap lúc boot+61s, đóng trước boot+70s (≤9 s)**; Balloon: **E-220 (7) KẾT THÚC BỞI SAG 08:43:23Z; E-221 (5) + E-222 (12) + E-223 (5) + E-224 (9) + E-225 (6) mới trên #103, tất cả kết thúc bởi sag**; tổng ghim 38/119 (31,9%). **ENOSPC 148 dòng (73 #102 + 75 #103) — đợt thứ 33**; **birefnet 0 thử lần 38**. Lượt yên #53 CÓ lượt hợp lệ — chuỗi 45 → 46; **F-184-T2-8 vi phạm nặng — chuỗi 0 vi phạm GIỮ 0**. LIMITS 36.727 B.
- **Cờ đợt 184: 9/9 cờ luồng có nội dung** (T0/T1/T2/T4/T5/T6/T8/T9 + T7). 8/8 luồng kia trong hạn cờ ~11:00Z (T8 10:54Z muộn nhất trong hạn); **T7 đóng cờ ~11:05Z (trễ ~5')** nhưng trong hạn cứng ~11:35Z. **Chuỗi 9/9 cờ có nội dung = 6 (nếu parent tính tiếp — đợt 183 = 5).**

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 183/184 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #103 — đã khép hẳn lúc đóng; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. **Đợt này T7 xác minh thiếu bằng SQL trực tiếp** (COUNT theo scheduled_for — HB = 5, DR = 3 trong cửa; 0 slot thiếu trong cửa nên không cần truy vấn khoảng im lặng; xem §2.3/§2.4).
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + F-176-T7-5). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #103 là số nguyên từ /proc/stat (quy ước đứng). Spanning = 1 theo cả EVENTS lẫn truy vấn DB (finished NULL vẫn tính là sống; started_at đã viết lại sau btime nên truy vấn spanning KHÔNG được lọc started_at ≤ btime — xem §2.2).
4. Cửa kiểm đợt này ~2h20' (08:40Z → 11:00Z 24/11), đủ 6 slot HB + 3 slot DR + run vcut 183 (kết cục) và 184 (theo dõi + viết lại ×1 tại #103) + 1 reboot mới giữa phiên. Ba lần đọc DB đầy đủ (đọc #1 ~08:42Z, #2 ~09:15Z, đọc cuối ~11:00Z); run 183 đọc đầy đủ 1 lần (khớp T7-183 + NOTES ở mọi trường + events); run 184 đọc đầy đủ 3 lần (started_at đổi đúng 1 lần, sau reboot #103; claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; HB 10:50:50Z + DR 11:00Z thuộc cửa đợt 184 (trong hạn cờ ~11:00Z + trễ đóng cờ để kiểm đủ slot — cùng mẫu T7-183). **HB 08:20:50Z thuộc span đợt 183 nhưng SAU lúc T7-183 đóng cờ — T7-184 kiểm theo giao**; slot này tính vào lũy kế (mẫu số +1 trong 6 slot HB mới) nhưng KHÔNG tính vào cửa đợt 184 (trước giờ mở 08:35:51Z).
6. **1 sleep bị SIGTERM trong phiên này** (sleep #3 ~09:00:40Z chết theo #103 — F-184-T7-1); 9 sleep còn lại hoàn thành. **Boot ĐỔI 1 lần trong phiên** (6ecd948e → e0921bda) — T7 phát hiện boot mới trong ~45 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn e0921bda (#103 ứng viên).
7. T7 đóng cờ ~11:05Z — trễ ~5' so với hạn cờ ~11:00Z (kiểm DR 11:00Z + gọn LIMITS), trong hạn cứng ~11:35Z. T7 không bỏ slot nào trong cửa; 8/8 luồng kia đã đóng trong hạn cờ.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix184.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Mọi tuổi run / margin / offset trong LIMITS này đều lấy từ `appendix184.py` — KHÔNG lặp lại F-176-T7-5/F-179-T7-2.

## 4. Cập nhật lũy kế (nối tiếp đợt 183, cùng phương pháp — SỐ SLOT THIẾU)

- Heartbeat: 47/495 → **47/501 slot thiếu** (cửa sổ 14/11 07:50:50 → 24/11 17:50:50 +07). Kiểm toán cửa sổ: 495 + 6 slot mới = 501 ✓ (08:20:50, 08:50:50, 09:20:50, 09:50:50, 10:20:50, 10:50:50). Số thiếu +0 (0 slot thiếu mới); muộn mới +0 (0 HB muộn mới).
- Deterministic-doctor: 53/320 → **53/323 slot thiếu** (cửa sổ 11/11 09:00 → 24/11 18:00 +07). Kiểm toán: 320 + 3 = 323 ✓ (09:00, 10:00, 11:00). Số thiếu +0 (0 slot thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 47/501 = 9,4% (giảm từ 9,5% — 0 thiếu mới, mẫu tăng); DR 53/323 = 16,4% (giảm từ 16,6% — 0 thiếu mới, mẫu tăng).
- Mẫu muộn HB lũy kế: **GIỮ 10 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; **+890 s đợt 179 (HB 17:20:50Z)**; kỷ lục +1.252 s đợt 129) — **0 muộn mới đợt 184**.

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 183: SUCCEEDED theo hồ sơ daemon (finished 08:13:58Z, TRƯỚC hạn started-gốc = hạn sched 1.313 s — jitter 0 nên hai hạn trùng nhau; T0-184 tính +1.313 s độc lập, KHỚP T7)** — đọc #1 + events đầy đủ (5 event, 0 event sau succeeded eid 10682) + NOTES T7-183 đối chiếu khớp (run 183 viết lại ×1 tại #102, claimed đổi sau khi T7-183 đóng cờ). 1 lần viết lại; claimed→finished 85 s. **CA ≥60 S THỨ MƯỜI BA — số ca 12 → 13** (đếm lại toàn bộ họ từ DB tươi: 16 ca toàn lịch sử, 13 ca trong cửa sổ từ 154; run 183 là ca succeeded THỨ MƯỜI BỐN trong họ — chỉ 180/181 là timeout). **Run 182 + 183 SUCCEEDED liên tiếp — KHÔNG có timeout mới.**
2. **Run 184 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.678 s lúc 11:00:29Z, còn 2.122 s tới hạn ngân sách 11:35:51Z; **viết lại ×1 tại #103**) — kết cục thuộc T7-185 (hạn run SAU hạn cứng đợt 184). **Claimed_at run 184 vẫn giữ nguyên (08:35:51Z) lúc đóng** — T7-185 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 184 = 0 s**.
3. **Reboot #102 (btime 07:07:05Z, boot 6ecd948e): XÁC NHẬN 9 nguồn (T0-184)** — nợ đợt 183 đã trả; marker sống qua 54 reboot #49–#102. **#103 ứng viên: T7 xác minh 9 nguồn (giờ thật, CF chênh ~1 s) — số hiệu CHỜ T0-185 xác minh 9 nguồn.** Gap: #101→#102 = 6.878 s; **#102→#103 = 7.670 s** (mẫu ~2h; gap 576 s #97→#98 vẫn là ca ngắn bất thường duy nhất). **/proc/1 mtime #103 +11,753 s (trở lại +11,x s như #96/#97/#98/#100/#101/#102)**.
4. **Điểm (m) #102: T2-184 phán CUỐI — DƯƠNG** (+40,341 s; n ứng viên đề xuất 44/45 → 45/46; n chính thức GIỮ 14). **(m) #103: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — +37,543 s, TRONG dải, KHÔNG sát biên; 1 run sống + 1 requeue duy nhất; KHÔNG có overlap; T2-185 phân loại cuối + parent 185. **INSIDE #102 TRUE (FULL148) — chuỗi 3 → 4** (T2-184). **INSIDE #103 (FULL149) thuộc T2-185.**
5. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-184 không thu hẹp được cửa lần thứ hai mươi bảy — xem LIMITS T2-184) — chờ parent chốt J. T2-185 tiếp tục thu hẹp cửa.
6. **Cửa slot TRONG đợt 184: HB 5/5 + DR 3/3 — 0 thiếu, 0 muộn trong cửa. HB 08:20:50Z + HB 08:50:50Z + DR 09:00Z CÓ đúng giờ** (nợ chính T7-184 đã trả). **Chuỗi cửa lành 9 lần (175–183) có tính tiếp lần thứ mười không — parent quyết** (xem §2.3). Lũy kế: **HB 47/501, DR 53/323. Muộn HB lũy kế GIỮ 10.**
7. **F-184-T7-1 — Sleep #3 bị SIGTERM theo reboot #103** (cùng mẫu các đợt 174–183): sleep 1.210 s spawn ~09:00:40Z, chết lúc reboot 09:14:55Z sau ~855 s; T7 phát hiện boot mới trong 45 s, 0 số sai. **Đợt 184 có 1 sleep bị giết (đợt 183 có 1, đợt 182 có 1, đợt 181 có 1).**
8. **F-184-T2-8 — VI PHẠM TUÂN THỦ của T2-184** (hole-recheck chồng lên T4 attempt1 khởi động ~16 s; class-B B2 VI PHẠM load1_max 4,48; attempt1 20/20 BỊ HỦY, T4 retry attempt2 HỢP LỆ) — **chuỗi 0 vi phạm GIỮ 0** (T4-184 + T9-184 đồng ý; đã ĐỨT ở đợt 183 bởi F-183-T2-7, vi phạm mới thuộc T2 — parent quyết cuối). T7 chỉ ghi nhận, không phán thay T4/parent.
9. **OUTAGE scheduler 8.406 s đợt 179 (F-179-T7-3): NGUYÊN NHÂN VẪN CHƯA XÁC ĐỊNH (host-side)** — đợt 184 KHÔNG có outage mới, không thêm bằng chứng. Giao parent/T0-185 xem xét tiếp.
10. **Mù #96? (#64) VẪN MỞ** theo T2-184 (hole-recheck lần 28 NEW=0 mọi hố). **Mù #95? (#63) MỞ**; **mù #94? (#62) MỞ**; **mù #88? VẪN MỞ** (hole-recheck lần 28); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức: INSIDE #102 TRUE (FULL148, chuỗi 3 → 4) (T2-184).
11. **POSTBOOT_PASS #102 ĐÃ CÓ 08:43:59Z (T5-184, replay-đầy-đủ, poll=0, KHÔNG caveat — giá trị chân gate (a) thuộc parent quyết)** — chờ parent quyết. **POSTBOOT_PASS #103 CHƯA CÓ** — thuộc T5-185 (watcher-184 pid 211325 hạn 11:35:00Z nhiều khả năng đã chết theo #103). **#100 KHÔNG CÓ cờ — KHÔNG bù được (quyết (c) đợt 183 đã chốt); tổng boot không cờ GIỮ 22.** **#102 KHÔNG GIẾT HOLDER** — chuỗi mới "không giết holder" = 7 nếu parent tính tiếp. **#103 có giết holder không — T6-185.** Marker sống qua 54 reboot #49–#102 (T0-184); sống qua #103 chưa đếm — giao T0-185.
12. **Chuỗi WebKit FULL PASS: GIỮ 0 (T8-184 đề xuất — parent quyết)** (đợt 184: lượt yên #53 ✓ + gate (a) #102 ✓ KHÔNG caveat + O8 T0 ✓ 3/3 — cùng boot #102; chân harness KHÔNG ĐO ĐƯỢC — WebKit launch-fail libevent-2.1.so.7 trên #103; O8 T8 chỉ 1/3). **Lượt yên #53 CÓ lượt hợp lệ (attempt2) — chuỗi lượt yên hợp lệ 45 → 46** (T4-184). **Kẹt cộng dồn GIỮ 26 (0 kẹt mới)**. **(c')/(f') V1 ĐƯỢC GIỮ — THIẾT KẾ V2 ĐÃ CHUẨN BỊ XONG (T8-184 LIMITS §C4 — parent quyết đợt 184 có nâng V2 lên làm phương án chính không)**. **B1 live CHƯA KIỂM đợt này (WebKit launch-fail) — B1 live sạch GIỮ 2; B2 VẪN HOÃN.** Quy tắc nhắc lại cho đợt 185: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép (F-184-T2-8: hole-recheck chồng attempt — vi phạm mới). **5/9 file LIMITS đợt 184 SÁT giới hạn push 37.768 B** (T8 37.708 B — chỉ dư 60 B; T4 37.683 B; T6 37.574 B; T2 34.619 B; T9 36.727 B) — đề nghị các T sau gọn file LIMITS lại; T7-184 giữ gọn dưới giới hạn.
13. **Harness + (c')/(f') + headroom + ENOSPC + birefnet + E-220/E-221–E-225: thuộc T8/T9-184** — T7 không ghi thay. Headroom đóng 0 (lần 44); **cửa sổ thoáng #103 MỞ 30.000 chạm cap lúc boot+61s, đóng trước boot+70s (≤9 s)**; ENOSPC đợt thứ 33 (148 dòng); birefnet 0 thử lần 38; E-220 KẾT THÚC BỞI SAG, E-221–E-225 mới trên #103 (tất cả kết thúc bởi sag), tổng ghim 38/119 (31,9%).

## 6. Phụ lục — số liệu từ script `appendix184.py` (epoch thô, không gõ tay)

Xem `~/workspace/goals/capcut-clone-video-editor/hidden_files/round184-t7/appendix184.txt` (chạy từ `appendix184.py` cùng thư mục). Tóm tắt: run 183 SUCCEEDED, TRƯỚC hạn 1.313 s (started-gốc = sched, jitter 0), cf 85 s — ca ≥60 s thứ MƯỜI BA, 5 event, viết lại ×1; 2 run succeeded liên tiếp (182 + 183); run 184 jitter 0 s, viết lại ×1 (#103), tuổi gốc 8.678 s lúc 11:00:29Z (còn 2.122 s); reboot #103 btime 09:14:55Z gap 7.670 s (m) +37,543 s — DƯƠNG ỨNG VIÊN; trong cửa HB 5/5 (4× −316 s + 1× −318 s), DR 3/3 toàn 0 s; HB 08:20:50Z CÓ −316 s; lũy kế HB 47/501, DR 53/323; muộn HB giữ 10; không outage mới.
