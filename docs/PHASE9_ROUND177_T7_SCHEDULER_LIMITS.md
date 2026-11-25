# PHASE9 ROUND177 T7 — RUN 176 SUCCEEDED 08:34:05Z (MARGIN +106 S, CF 8 S — KHÔNG PHẢI CA THỨ MƯỜI) + RUN 177 JITTER 0 S, ĐANG CHẠY, VIẾT LẠI ×1 TẠI #91 + CỬA SLOT LÀNH LẦN BA LIÊN TIẾP (HB 6/6 + DR 3/3)

- **Luồng:** T7 đợt 177 (lượt cron 15:35:51 +07 23/11/2026 = 08:35:51Z). Nhiệm vụ theo brief T7-177: (1) kết cục run 176 — vẫn `running` lúc T7-176 đóng cờ (tuổi gốc 9.964 s, hạn 08:35:51Z; đã viết lại ×1 tại #90; jitter 0 s); (2) run 177: trạng thái, claimed_at, tuổi, jitter; (3) slot DR 09:00Z + HB 08:20:50Z; (4) reboot mới trong phiên (nếu có sau #90); (5) boot lúc đóng cờ + mọi F-177-T7-x.
- **Boot trong phiên:** mở phiên đã là **94247dfa-0716-4de9-bdc6-080161a73701** (#90, btime 07:10:29Z — **T0-177 XÁC NHẬN 9 nguồn**). **Reboot #91 MỚI GIỮA PHIÊN** (boot 8c0ec92d, btime 09:07:40Z — T7 xác minh 9 nguồn, phát hiện trong 57 s; T4-177 xác nhận độc lập btime + gap). **Boot lúc đóng cờ vẫn 8c0ec92d**.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 176/177 đầy đủ; HB/DR theo slot; requeue cửa hẹp #91 — đã khép hẳn lúc đóng, xem §2.4), LIMITS T7-176 + aggregate 176 §7 + §12.3 (n)/(o) + GAP §105 + cờ/LIMITS các luồng đợt 177 (T0/T1/T2/T4/T5/T6/T8 đã đóng; **T9 LIMITS đã có nhưng cờ .done CHƯA CÓ lúc T7 đóng — xem F-177-T7-3**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (quy tắc đứng sau vi phạm F-175-T4-2 — T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T7 đóng cờ ~11:0xZ — trễ ~5' so với hạn cờ ~11:00Z (để kiểm DR 11:00Z + HB 10:50:50Z + viết LIMITS — cùng mẫu T7-176 trễ ~24' do DR 08:00Z + #90), trong hạn cứng ~11:30Z. T7 không bỏ slot nào trong cửa.

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 176 kết cục? | **`succeeded` 08:34:05Z**, wall gốc 10.694 s, **margin +106 s** (theo cả hai cách tính — jitter 0 s), claimed→finished **8 s** | §2.1, Phụ lục |
| Run 176 có phải ca ≥60 s thứ mười? | **KHÔNG — số ca GIỮ 9** (cf 8 s < 60 s; run 175 = thứ chín) | §2.1 |
| Run 176 có bị viết lại lần 2 không? | **KHÔNG** — đúng 1 lần viết lại (#90), 5 event, 0 event sau succeeded | §2.1 |
| Run 177? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 8.754 s, còn 2.046 s tới hạn 11:35:51Z); **jitter 0 s** (chuỗi jitter 0 s: run 175 → 176 → 177); **viết lại ×1** (#91); claimed không đổi | §2.2 |
| Reboot #90 (trước khi mở)? | **Boot 94247dfa, btime 07:10:29Z, GIỜ THẬT** (T0-177 XÁC NHẬN 9 nguồn — KHỚP T7; marker sống qua 42 reboot #49–#90) | §2.3 |
| (m) #90? | **DƯƠNG (CUỐI cấp T2)** — T2-177 phân loại CUỐI: +35,313 s, cách biên dưới 2,313 s; boot_est T2 +0,32 s khớp T0-177 tới 0,01 s | §2.3 |
| Reboot #91 (mới giữa phiên)? | **Boot 8c0ec92d, btime 09:07:40Z, GIỜ THẬT** (T7 xác minh 9 nguồn; T4-177 xác nhận độc lập btime + gap); gap #90→#91 = **7.031 s**; số hiệu #91 chờ T0-178 xác minh 9 nguồn | §2.4 |
| (m) #91? | **ÂM ỨNG VIÊN (sơ bộ)** — requeue +50,157 s NGOÀI dải, vượt biên TRÊN 0,357 s; 1 run sống + 1 requeue duy nhất cửa hẹp (đã khép, đếm cuối) | §2.4 |
| Cửa slot đợt 177? | **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — CỬA LÀNH, lần thứ ba liên tiếp (175 + 176 + 177)** | §2.5 |
| DR 09:00Z? | **CÓ** — đúng giờ, jitter 0 s (nợ chính của T7-177, nay đã trả) | §2.5 |
| Đồng hồ lúc mở / trong phiên? | **Cloudflare chênh ~1 s** (lúc mở ~1 s; lúc phát hiện #91 ~1 s, CF nhanh hơn) — khớp T0/T2/T5-177 | §2.3/§2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–176 — SỐ SLOT THIẾU, chỉ cộng tử số khi có slot thiếu thật): heartbeat **44/453 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **51/299 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới — đợt thứ mười sáu liên tiếp vắng muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 176 — SUCCEEDED 08:34:05Z, margin +106 s, cf 8 s, KHÔNG PHẢI CA THỨ MƯỜI (đọc #1 + events đối chiếu trực tiếp + T0/T2-177 đối chiếu độc lập)

Run 176 (`2b4a5671-cda6-44c3-a337-c5da5d40b5fb`, sched 1795412151 = 05:35:51Z 23/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795412151 = 05:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795412151 → **1795417864 = 07:11:04Z** (dịch +5.713 s) — KHÔNG đổi sau đó |
| finished_at_utc | 1795422845 = 08:34:05Z (event `succeeded` 08:34:05.488Z, eid 10357) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795422837 = 08:33:57Z (finished − 8 s) — **ĐÃ ĐỔI** so với T7-176 (1795412151 không đổi qua 11 lần đọc tới 08:21:55Z); đổi trong (08:21:55Z, 08:33:57Z] |
| worker_boot_generation | cron_boot_3af1984b937c4619b9161a2e7ee2b1dd (boot #90) |
| Wall từ started gốc | 1795422845 − 1795412151 = **10.694 s** (2h58m14s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795422951 = 08:35:51Z — finished TRƯỚC hạn **106 s (margin +106 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795422951 = 08:35:51Z — **cùng hạn** (jitter 0 s) → margin **+106 s theo cả hai cách tính** |
| Wall từ started viết lại lần 1 | 1795422845 − 1795417864 = **4.981 s** (1h23m01s thực thi trên boot #90 sau viết lại) |

- Events run 176 (đầy đủ, **đúng 5 event, 0 event sau succeeded**): `dispatched` 05:35:51.091Z (10317) + `requeued_after_restart` 07:11:04.313Z (10339) + `dispatched` 07:11:04.360Z (10340) + `reattached_after_restart` 07:11:04.436Z (10341) + **`succeeded` 08:34:05.489Z (10357)**. **ĐÚNG 1 LẦN VIẾT LẠI** (#90) — không có lần viết lại thứ hai.
- **Run 176 finish 08:34:05Z — SAU khi T7-176 đóng cờ (08:24:28Z) 9m37s và TRƯỚC khi lượt 177 mở (08:35:51Z) 1m46s** → kết cục này là nợ chính của T7-177, nay đã trả.
- **Claimed_at đổi lúc cuối (cùng mẫu run 171/172/173/174/175 — nhưng cf KHÁC hẳn):** T7-176 đọc 11 lần đều thấy claimed = 1795412151 (không đổi tới 08:21:55Z); DB tươi lúc T7-177 đọc #1 (~08:39Z) đã là 1795422837 = finished − 8 s. Theo quy ước họ ca (claimed_at CUỐI CÙNG trong DB), **claimed→finished = 8 s — KHÔNG thuộc họ ≥60 s**. Số ca **GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. **Run 176 KHÔNG phải ca thứ mười.**
- **Chuỗi run vcut gần đây (margin, theo hạn started-gốc):** 173: **−13 s (TIMEOUT)**; 174: **+721 s (SUCCEEDED)**; 175: **+690 s (SUCCEEDED)**; 176: **+106 s (SUCCEEDED)**. Chuỗi succeeded: 174 → 175 → 176 (3 run). Margin thu hẹp mạnh (+690 s → +106 s) nhưng vẫn succeeded — T7-178 theo dõi run 177 có giữ chuỗi không.
- T0-177 + T2-177 đối chiếu độc lập: **SUCCEEDED 08:34:05Z, margin +106 s, cf 8 s, KHÔNG phải ca ≥60 s** — KHỚP T7 từng số.

### 2.2 Run 177 — vẫn `running` lúc đóng cờ, jitter 0 s, viết lại ×1 (#91), claimed không đổi

Run 177 (`2e0ce3f4-7d34-465a-a3e1-b1ef69b28739`, sched 1795422951 = 08:35:51Z 23/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795422951 | 08:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795422951 → **1795424910** | 08:35:51Z → **09:08:30Z** (dịch +1.959 s) |
| worker_claimed_at | 1795422951 | 08:35:51Z (KHÔNG đổi qua 10 lần đọc) |
| worker_boot_generation | cron_boot_c29591c723764bb3a96628a659dad778 | boot #91 (gốc: 3af1984b, #90) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795433751 | 11:35:51Z 23/11 |

- **Jitter 0 s** — run 177 dispatch đúng giây sched 08:35:51Z. **Chuỗi jitter 0 s: run 175 → 176 → 177 (3 run liên tiếp).**
- 10 lần đọc DB trong phiên (đọc #1–#10, 08:39Z–11:01Z): run 177 `running` ở mọi lần đọc; started_at gốc KHÔNG đổi ở đọc #1–#3 (08:39Z–09:01Z), đổi lần 1 tại đọc #3b (~09:08Z, sau #91), KHÔNG đổi ở đọc #4–#10; claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): đọc #1 (08:39:27Z) 216 s; #2 (08:51:52Z) 961 s; #3 (09:01:03Z) 1.512 s; #3b (09:08:50Z) 1.979 s; #4 (09:22:13Z) 2.782 s; #5 (09:27:24Z) 3.093 s; #6 (09:51:47Z) 4.556 s; #7 (10:01:43Z) 5.152 s; #8 (10:21:01Z) 6.310 s; #9 (10:51:54Z) 8.163 s; #10 (11:01:45Z) **8.754 s, còn 2.046 s** tới hạn ngân sách 11:35:51Z. **Kết cục thuộc T7-178** (hạn cứng đóng đợt 177 là ~11:30Z, trước hạn run 11:35:51Z — cùng mẫu run 174/175/176).
- Events run 177 tới lúc đóng cờ: đúng 4 event — dispatched 08:35:51.076Z (10359) + **requeued 09:08:30.157Z (10369) + dispatched 09:08:30.241Z (10370) + reattached 09:08:30.442Z (10371)**.

### 2.3 Reboot #90 TRƯỚC KHI MỞ PHIÊN (btime 07:10:29Z, boot 94247dfa) — T0-177 XÁC NHẬN 9 NGUỒN + (m) #90 DƯƠNG (CUỐI)

- **Reboot #90: boot 94247dfa-0716-4de9-bdc6-080161a73701, btime 1795417829 = 07:10:29Z 23/11.** T7 mở phiên đã thấy boot này (uptime -s 07:10:29Z khớp; Cloudflare Date vs local chênh ~1 s, CF nhanh hơn — GIỜ THẬT). **T0-177 ĐÃ XÁC NHẬN 9 nguồn** (cờ 08:58Z; marker sống qua **42 reboot #49–#90** — tăng từ 41 sau #89).
- **Gap #89→#90 = 6.243 s** (T0-177 + T7-176 khớp).
- **(m) #90 — DƯƠNG (CUỐI cấp T2):** T2-177 phân loại CUỐI — requeue +35,313 s, cách biên dưới 2,313 s; boot_est T2 +0,32 s khớp T0-177 tới 0,01 s; watcher overlap +3 s (nhỏ nhất chuỗi). **n ứng viên 35/36 → 36/37** nếu parent chấp nhận #90; n chính thức GIỮ 14.
- **INSIDE #89 FALSE CUỐI (FULL135)** theo T2-177 — sớm 240 s; **chuỗi dài 7 ĐỨT tại #89 → 0** (phân loại cuối đã có, không còn sơ bộ). **INSIDE #90 TRUE (FULL136)** — chuỗi MỚI 1, hai dải đồng thuận.
- **POSTBOOT_PASS #90 ĐÃ CÓ 08:51:55Z** (T5-177, mode repair-sớm-quyet-h, poll=1 — KHÔNG phải replay-đầy-đủ; caveat repair, parent quyết §9(b)); watcher-176 pid 7604 CHẾT theo #90 (poll cuối 07:10:32Z, +3 s — F-177-T5-1, overlap thứ tám, NHỎ NHẤT); watcher-177 pid 114543 ĐANG CHẠY (hạn 11:30:00Z).
- **O8 trên #90: T0 PASS 3/3** (WebKit 21/21 ×2 pid206006 md5 5a87b5bf + pid206616 md5 44c04a6d; Chromium 21/21 pid207136 md5 3f05caf6) — sau POSTBOOT_PASS #90. **#90 KHÔNG giết holder** (T6-177: lock trống 2.335 s trước btime — chuỗi "không giết holder" từ #69: **21 → 22 reboot**).

### 2.4 Reboot #91 MỚI GIỮA PHIÊN (btime 09:07:40Z, boot 8c0ec92d) — RUN 177 VIẾT LẠI LẦN 1 + (m) #91 ÂM ỨNG VIÊN

- **Reboot #91: boot 8c0ec92d-9f49-49f1-b0b0-deaf40b95f46, btime 1795424860 = 09:07:40Z 23/11.** Xác minh T7 (lúc phát hiện ~09:08:37Z + kiểm lại lúc đọc #4 ~09:22Z + kiểm lại lúc đóng ~11:01Z — cả ba lần đều 8c0ec92d, btime 1795424860): boot_id + btime /proc/stat + `uptime -s` 09:07:40Z (khớp) + /proc/1 mtime 09:07:56.022Z (+16,022 s) + journal idx 0 duy nhất, first entry 09:07:56Z (+16 s) + wtmp begins 09:07:56Z (+16 s) + `last` reboot 09:07 still running + `who -b` 09:07. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 09:08:50 GMT vs 09:08:49 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #91 theo đếm tuần tự — CHỜ T0-178 xác minh 9 nguồn** (T0-177 đóng cờ 08:58Z, TRƯỚC #91).
- **T4-177 xác nhận độc lập:** reboot #91 (ứng viên) 09:07:40Z, boot 8c0ec92d, gap 7.031 s — KHỚP T7 từng số (T4 phát hiện lúc viết cờ 09:10:41Z, sau phiên đo #46 — KHÔNG ảnh hưởng verdict #46).
- **Gap #90→#91 (btime−btime): 1795424860 − 1795417829 = 7.031 s (1h57m11s — trở lại mẫu ~2h).**
- **#91 xảy ra TRONG lúc run 177 chạy:** run 177 dispatch gốc 08:35:51Z, btime #91 09:07:40Z (tuổi gốc lúc btime **1.909 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 177)** — theo EVENTS (dispatched trước btime, chưa finish); spanning theo truy vấn started_at = **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at đã viết lại thành 09:08:30Z, sau btime — cùng mẫu #87/#88/#89/#90). T7 dựa verdict (m) trên EVENTS + REQUEUE, không dựa trên spanning-artifact.
- **Run 177 BỊ VIẾT LẠI LẦN 1 tại #91:** started 1795422951 → **1795424910 = 09:08:30Z** (dịch **+1.959 s**); boot_gen đổi 3af1984b (#90) → **c29591c723764bb3a96628a659dad778** (#91); **claimed_at KHÔNG ĐỔI (1795422951)**; vẫn running, attempt 1, error null.
- **Requeue do #91 (cửa hẹp [09:07:40Z, 09:26:40Z], kiểm sau khi cửa khép hẳn ở đọc #5 ~09:27Z): ĐÚNG 1 DÒNG** — run 177, eid 10369, 09:08:30.157Z. Không job nào khác bị requeue do #91.
- **Requeue offset +50,157 s — NGOÀI dải (m) 33–49,8 s, VƯỢT BIÊN TRÊN 0,357 s** (09:08:30.157Z − btime nguyên 1795424860). Reattach +50,442 s; dispatch lần 2 +50,241 s. **(m) #91 — ÂM ỨNG VIÊN (sơ bộ, lean T7).** T2-178 phân loại cuối + parent 178. Đây là lần sát biên trên nhất từng ghi (đối xứng #88 sát biên dưới 0,431 s, DƯƠNG). Caveat phân số (ngược chiều #88): **DƯƠNG ⟺ boot_est−btime ≥ 0,357 s** — T2-178 phán (theo mẫu #90: boot_est T2 +0,32 s; nếu #91 có boot_est tương tự thì vẫn NGOÀI dải — nhưng T7 không tự suy ra, chỉ ghi số thô).
- Nếu parent CHẤP NHẬN #90 (n 35/36 → 36/37) rồi #91 ÂM: n ứng viên **GIỮ 36/37** (số học nối tiếp T2-177; T7 chỉ ghi số học, T2-178 tính chính thức). n chính thức GIỮ 14.
- **Sleep của T7 bị giết theo #91** (xem F-177-T7-1): sleep 1.140 s spawn 09:01:14Z, chết lúc reboot 09:07:40Z sau ~386 s; T7 phát hiện boot mới trong 57 s, 0 số liệu mất, 0 số sai.
- **INSIDE #91 + FULL137 + POSTBOOT_PASS #91 + #91 có giết holder không: thuộc T2-178 / T5-178 / T6-178.** T7 không tự tính INSIDE/CERT/FULL. T8-177 ghi POSTBOOT_PASS #91 VẮNG (T5-177 không resume sau #91 — gate T8-check-only, cần parent/T10 xác nhận lại); T9-177 ghi cửa sổ thoáng #91 KHÔNG quan sát được (chuỗi 5 lần đứt — xem §2.6).

### 2.5 Slot HB/DR trong cửa 08:39Z → 11:01Z 23/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH LẦN BA LIÊN TIẾP

Cửa kiểm ~2h22' (10 lần đọc DB).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 15:20:50 (08:20:50Z) | 19471cd5 | 08:15:34 | **−316 s** | CÓ |
| 15:50:50 (08:50:50Z) | cbb68161 | 08:45:34 | **−316 s** | CÓ |
| 16:20:50 (09:20:50Z) | d0011d59 | 09:15:34 | **−316 s** | CÓ |
| 16:50:50 (09:50:50Z) | 191cce3b | 09:45:34 | **−316 s** | CÓ |
| 17:20:50 (10:20:50Z) | 7064b34e | 10:15:34 | **−316 s** | CÓ |
| 17:50:50 (10:50:50Z) | 98a521ef | 10:45:34 | **−316 s** | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started. **Toàn −316 s — KHÔNG có ngoại lệ.** 0 muộn mới — muộn HB lũy kế GIỮ 9 (đợt thứ mười sáu liên tiếp vắng muộn mới).
- HB 08:20:50Z + 08:50:50Z dispatch trên boot #90 (sau btime #90 1h10m / 1h40m); HB 09:20:50Z–10:50:50Z dispatch trên boot #91 (sau btime #91 7m54s / 37m54s / 1h07m54s / 1h37m54s).

**Deterministic-doctor (lưới :00:00Z): 3/3 có — DR 09:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 16:00 (09:00Z) | f25186d5 | 09:00:00 | 0 s | CÓ |
| 17:00 (10:00Z) | 8bc36365 | 10:00:00 | 0 s | CÓ |
| 18:00 (11:00Z) | 11149584 | 11:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 09:00Z CÓ, đúng giờ** — khác DR 23:00Z đợt 174 (không bao giờ xuất hiện sau 8 lần kiểm; slot mất hẳn trong cửa sổ recovery sau #85). DR 09:00Z dispatch 09:00:00Z trên boot #90, 7m40s TRƯỚC btime #91 — không bị #91 chạm. DR 10:00Z + 11:00Z dispatch trên boot #91 (sau btime #91 52m20s / 1h52m20s).
- **Cửa slot đợt 177 LÀNH (HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn). Lần thứ ba liên tiếp cửa lành hoàn toàn (đợt 175 + 176 + 177)** — sau chuỗi cửa lành 11 đợt 162–172 đã dứt ở đợt 173.

### 2.6 Đối chiếu chéo các luồng đợt 177 (chỉ ghi nhận)

- **T0-177** (cờ 08:58Z): **#90 XÁC NHẬN 9 nguồn** (nợ đợt 176 đã trả; marker sống qua **42 reboot #49–#90**); run 176 SUCCEEDED 08:34:05Z, margin +106 s, cf 8 s — KHỚP T7; **(m) #90 +35,313 s**; **O8 trên #90 PASS 3/3** (WebKit 21/21 ×2 pid206006/206616 md5 5a87b5bf/44c04a6d; Chromium 21/21 pid207136 md5 3f05caf6); **POSTBOOT_PASS #90 ĐÃ CÓ 08:51:55Z** (T5-177, repair-sớm-quyet-h, poll=1). T0-177 đóng TRƯỚC #91 — **#91 chờ T0-178 xác minh 9 nguồn**.
- **T1-177** (cờ 08:44Z): **verify đợt 176: PASS** — đợt 176 = 10/15/15/13; lũy kế 111–176 = 648/1.135/985/807; chờ push 166–176 = 110/156/146/143; tổng 1–176 = 1.296/7.005/3.790; 0 file thiếu; đếm khớp lần thứ 75 liên tiếp; F-177-T1-1 (aggregate §10.3 "1.294 file" thực 1.296); F-177-T1-2 (tổng cũ 1.295/7.004/3.789).
- **T2-177** (cờ 09:17Z): **(m) #90 DƯƠNG (CUỐI cấp T2)** — requeue +35,313 s — KHỚP T7-176 từng số; **INSIDE #89 FALSE CUỐI (FULL135)** — chuỗi dài 7 ĐỨT tại #89 → 0; **INSIDE #90 TRUE (FULL136)** — chuỗi MỚI 1; n ứng viên 35/36 → 36/37 nếu #90 được chấp nhận; **mù #96? VẪN MỞ** (R 1.238 s lần 13 không đổi; U union-A 1.118 → 1.276 s MỞ do pruning xóa mốc 08:38:24Z; U union-B 1.118 s cách sàn 29 s); **mù #88? VẪN MỞ** (hole-recheck lần 21: 337 hit, 0 mới); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 20** (5 hướng mới (xviii)–(xxii), tổng 72 hướng).
- **T4-177** (cờ 09:11Z): **lượt yên #46: CÓ LƯỢT HỢP LỆ** — attempt1-94247dfa DUY NHẤT 20/20, B 5/5, tickCost median 50,0 ms — **chuỗi lượt yên hợp lệ 39 → 40** (ngân sách 1/3); **#91 (ứng viên) 09:07:40Z, boot 8c0ec92d, gap 7.031 s — KHỚP T7 từng số**; 0 vi phạm luật script nặng (chuỗi 0 vi phạm giữ 2 đợt liên tiếp 176 + 177).
- **T5-177** (cờ ~08:59Z): **POSTBOOT_PASS #90 ĐÃ CÓ 08:51:55Z** (mode repair-sớm-quyet-h, poll=1 — KHÔNG phải replay-đầy-đủ; caveat repair; dpkg 2 → 795 dòng); **#87/#88 VẪN KHÔNG CÓ cờ — KHÔNG bù được** (tổng boot không cờ GIỮ 18); watcher-176 pid 7604 **CHẾT theo #90** (poll cuối 07:10:32Z, +3 s — F-177-T5-1, overlap thứ tám, NHỎ NHẤT); watcher-177 pid 114543 ĐANG CHẠY, hạn 11:30:00Z; hướng (3) VẪN ĐỨNG lần 24; LIMITS 37.653 B.
- **T6-177** (cờ 08:50:05Z): **(A) 120/120 lần thứ 27** (tổng 3.240/3.240); **#90 KHÔNG giết holder** (lock trống 2.335 s trước btime — chuỗi "không giết holder" từ #69: **21 → 22 reboot**); **prune lần 52: xóa 1 file**, queue 101 → 100 file; watcher KHÔNG lệch (114543 = replay-watch-177.sh T5, 90734 = b2-watcher.sh T9); X11 trống cả 3 thời điểm.
- **T8-177** (cờ 10:52Z): **harness 6/6 SẠCH trên #91, 0 kẹt** (10:28:52–10:45:08Z, boot 8c0ec92d); **kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2**; 86n2-P1 KHÔNG tái diễn lần 2; (f') V1 live 0 kích hoạt (0 FP, 0 kẹt để bỏ lỡ); **O8 T8 PASS 3/3 trên #91** (WebKit 21/21 ×2 pid 16268 md5 febee244 + pid 16643 md5 a5002552; Chromium 21/21 pid 17020 md5 617b2bde); **GATE KHÔNG MỞ qua (a)/(b)** (waiter WAIT-DEADLINE 10:30Z poll=82; T5-177 không resume sau #91 — **POSTBOOT_PASS #91 VẮNG**); T8 chạy O8 + harness theo fallback T8-check-only (F-177-T8-4 — CẦN parent/T10 xác nhận lại); **4 CHÂN TÁCH BOOT** — T8 KHÔNG ĐỀ XUẤT chuỗi lên 27 (**GIỮ 26**); **phương án mở rộng (c')/(f') cho 86n2 ĐÃ ĐỀ XUẤT** (file proposal-f177-t8-7-expand-cf-86n2.md — chỉ đề xuất, không triển khai live — parent quyết sau); checklist (o) 21/21; X11 không tái xuất; LIMITS 37.690 B.
- **T9-177: LIMITS đã có trên đĩa (38.500 B lúc T7 đóng — VƯỢT giới hạn push 37.768 B, hơn 732 B) NHƯNG cờ .done CHƯA CÓ lúc T7 đọc cuối 11:02:17Z — xem F-177-T7-3 (cùng mẫu F-176-T7-3/F-175-T7-3).** Nội dung LIMITS T9 (đọc trực tiếp): headroom 0 lúc đóng (12 lần đo: 11×0, 1×2; trần 63.747), dưới ngưỡng lần thứ 37; **cửa sổ thoáng #91 KHÔNG QUAN SÁT ĐƯỢC — CHUỖI 5 LẦN LIÊN TIẾP (172–176) ĐỨT** (phát hiện reboot lúc boot+59s, probe boot+108s đọc 0, 0); **Balloon: E-195 KẾT THÚC BỞI SAG (11 mẫu); E-196 (1) + E-197 (4) + E-198 (36) + E-199 (2, ĐANG GHIM) mới; tổng ghim 43/134 (32,1%)**; RAM 134 mẫu (#90: 28; #91: 106): min 454.712 / max 2.628.608 / mean 928.110,0 kB, gate A 42/134; **birefnet 0 lần thử, lần thứ 31**; B2: 2 spike thật, 2/2 quy driver; 0 spike trong cửa sổ attempt T4 và harness T8; **ENOSPC 72 dòng trực tiếp (27 trên #90 + 45 trên #91; ngoại suy ≈73) — đợt thứ 26 liên tiếp**; trên #91: 2 PHA (30 dòng 09:09:40–09:43:00Z, IM LẶNG 42m50s, chạy lại 15 dòng 10:25:50–10:54:50Z); reboot #91 giữa phiên (btime ~09:07:40Z uptime-based — chờ T0-178; gap ~7.031 s — KHỚP T7); sampler khởi động lại trong ~93 s gap mẫu; mẫu cuối trên #90 lúc 09:07:55Z — OVERLAP BIỂU KIẾN +15 s (F-177-T9-2).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 176/177 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #91 — đã khép hẳn lúc đóng; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. (Đợt này 0 slot thiếu — HB 6/6 + DR 3/3 đều có trong DB tươi.)
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + **F-176-T7-5: tuổi run đợt 176 cộng thừa 600 s ở 3 lần đọc vì tính tay — đợt này MỌI tuổi run đều tính bằng script appendix177.py, KHÔNG tính tay; phụ lục và NOTES khớp từng số**). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #90/#91 đều là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng ở §2.4 — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning #91 = 0 theo truy vấn là ARTIFACT viết-lại-tự-loại; verdict (m) dựa trên EVENTS + REQUEUE.
4. Cửa kiểm đợt này ~2h22' (08:39Z → 11:01Z 23/11), đủ 6 slot HB + 3 slot DR + run vcut 176 (kết cục) và 177 (theo dõi + viết lại tại #91). Mười lần đọc DB đầy đủ (đọc #1–#10, gồm đọc #3b phát hiện #91); run 176 được đọc đầy đủ 1 lần khớp hoàn toàn với T0-177/T2-177 ở mọi trường + events; run 177 được đọc đầy đủ 10 lần (started_at đổi đúng 1 lần tại đọc #3b, claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 08:20:50Z + DR 09:00Z thuộc cửa 177 (sau kiểm cuối T7-176 lúc ~08:21Z). HB 11:20:50Z + DR 12:00Z (ngày 23/11) thuộc cửa T7-178.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #3 spawn 09:01:14Z, chết lúc reboot 09:07:40Z sau ~386 s — F-177-T7-1); 9/10 sleep hoàn thành (3 lần sleep kết thúc ngay trước slot 3–46 s, phải chờ thêm ~90–100 s mới đọc được slot — ghi rõ trong NOTES, không giấu); ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2). **Boot ĐỔI 1 lần trong phiên** (94247dfa → 8c0ec92d tại #91; #90 đã xảy ra trước khi lượt mở) — T7 phát hiện #91 trong vòng 57 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn 8c0ec92d.
7. T7 đóng cờ ~11:0xZ — trễ ~5' so với hạn cờ ~11:00Z (để kiểm DR 11:00Z + HB 10:50:50Z + viết LIMITS — cùng mẫu T7-176 trễ ~24' do DR 08:00Z + #90), trong hạn cứng ~11:30Z. T7 không bỏ slot nào trong cửa. **T10-177 chưa đóng sổ lúc T7 đóng** (khác đợt 176 T10 đóng trước T7) — aggregate 177 sẽ gộp số T7 đúng hạn nếu T10 đọc LIMITS này; nếu T10 đóng trước khi đọc, batch T7 gộp muộn theo tiền lệ.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix177.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 177 trong NOTES đều lấy từ script — KHÔNG lặp lại F-176-T7-5.

## 4. Cập nhật lũy kế (nối tiếp đợt 176, cùng phương pháp — SỐ SLOT THIẾU)

- Heartbeat: 44/447 → **44/453 slot thiếu** (cửa sổ 14/11 07:50:50 → 23/11 17:50:50 +07). Kiểm toán cửa sổ: 447 + 6 slot mới = 453 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 51/296 → **51/299 slot thiếu** (cửa sổ 11/11 09:00 → 23/11 18:00 +07). Kiểm toán: 296 + 3 = 299 ✓. Số thiếu +0 (0 thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 44/453 = 9,7% (giảm từ 9,8% — 0 thiếu mới); DR 51/299 = 17,1% (giảm từ 17,2% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ mười sáu liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 176: SUCCEEDED theo hồ sơ daemon (wall gốc 10.694 s, margin +106 s theo cả hai cách tính)** — đọc #1 + events đầy đủ (5 event, 0 event sau succeeded eid 10357) + T0-177/T2-177 đối chiếu khớp. 1 lần viết lại tại #90; claimed→finished 8 s (claimed đổi thành finished − 8 s lúc cuối — cùng mẫu run 171–175 nhưng cf khác hẳn). **KHÔNG phải ca ≥60 s thứ mười — số ca GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. Margin thu hẹp mạnh (+690 s → +106 s) — T7-178 theo dõi run 177 có giữ chuỗi succeeded 3 run không.
2. **Run 177 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.754 s, còn 2.046 s tới hạn ngân sách 11:35:51Z; viết lại ×1 tại #91) — kết cục thuộc T7-178. **Claimed_at run 177 vẫn giữ nguyên (08:35:51Z) lúc đóng** — T7-178 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 177 = 0 s** (chuỗi jitter 0 s: run 175 → 176 → 177).
3. **Reboot #90 (btime 07:10:29Z, boot 94247dfa): TRƯỚC KHI MỞ PHIÊN, giờ thật, T0-177 XÁC NHẬN 9 nguồn.** Gap #89→#90 = 6.243 s. Số hiệu #90 ĐÃ ĐƯỢC T0-177 xác nhận (không còn chờ). **(m) #90: DƯƠNG (CUỐI cấp T2)** (+35,313 s; boot_est T2 +0,32 s khớp T0-177 tới 0,01 s). **INSIDE #89 FALSE CUỐI (FULL135) — chuỗi dài 7 ĐỨT tại #89 → 0; INSIDE #90 TRUE (FULL136) — chuỗi MỚI 1.** Marker sống qua 42 reboot #49–#90.
4. **Reboot #91 (btime 09:07:40Z, boot 8c0ec92d): GIỮA PHIÊN, giờ thật, T7 xác minh 9 nguồn + T4-177 xác nhận độc lập btime + gap.** Gap #90→#91 = 7.031 s. Số hiệu #91 theo đếm tuần tự — **CHỜ T0-178 xác minh 9 nguồn**. **Điểm (m) #91: ÂM ỨNG VIÊN (sơ bộ, lean T7)** — requeue +50,157 s NGOÀI dải, **vượt biên TRÊN 0,357 s** (sát biên trên nhất từng ghi); 1 run sống tại btime + 1 requeue duy nhất cửa hẹp (đã khép — đếm cuối); caveat phân số: DƯƠNG ⟺ boot_est−btime ≥ 0,357 s; T2-178 phân loại cuối + parent 178. **INSIDE #91 + FULL137 thuộc T2-178.**
5. **Điểm (m) #90: T2-177 phán CUỐI — DƯƠNG** (+35,313 s; boot_est #90 chưa có ước lượng điểm — caveat phân số F-176-T0-4: DƯƠNG ⟺ boot_est−btime ≤ 0,431 s — T2-177 đã phán DƯƠNG với boot_est +0,32 s). **Parent quyết cuối đợt 177.** (m) #88: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 176 — KHÔNG mở lại. (m) #86/#87: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 175 — KHÔNG mở lại. (m) #84/#85: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 174 — KHÔNG mở lại. (m) #83: KHÔNG PHẢI ĐIỂM — parent ĐÃ CHẤP NHẬN đợt 173 — KHÔNG mở lại. (m) #89: ÂM (CUỐI) — parent quyết cuối đợt 177 (T2-177 đã phán CUỐI; T7 chỉ ghi nhận).
6. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-177 không thu hẹp được cửa lần thứ hai mươi — xem LIMITS T2-177) — chờ parent chốt J. T2-178 tiếp tục thu hẹp cửa.
7. **Cửa slot: HB 6/6 + DR 3/3 — CỬA LÀNH, lần thứ ba liên tiếp (175 + 176 + 177).** Lũy kế: HB 44/453, DR 51/299. Muộn HB lũy kế GIỮ 9. **Jitter run vcut 0 s (run 175 + 176 + 177) — chuỗi jitter 0 s 3 run liên tiếp.** Toàn bộ 6 slot HB đều −316 s; 3 slot DR có đều 0 s. **DR 09:00Z CÓ, đúng giờ** (khác DR 23:00Z đợt 174 không bao giờ xuất hiện).
8. **F-177-T7-1 — Sleep #3 bị SIGTERM theo reboot #91** (cùng mẫu F-174-T7-1/F-175-T7-1/F-176-T7-1): sleep 1.140 s spawn 09:01:14Z, chết lúc reboot 09:07:40Z sau ~386 s (runtime báo duration 419 s do trễ giao kết quả — xem NOTES); T7 phát hiện boot mới trong 57 s, 0 số sai. Đợt 177 có 1 sleep bị giết (đợt 176 có 1).
9. **F-177-T7-2 — 3 lần sleep kết thúc ngay trước slot 3–46 s** (sleep #1 kết thúc 08:50:17Z, trước HB 08:50:50Z 33 s; sleep #4 kết thúc 09:20:40Z, trước HB 09:20:50Z 10 s; sleep #7 kết thúc 09:59:57Z, trước DR 10:00Z 3 s; sleep #9 kết thúc 10:50:11Z, trước HB 10:50:50Z 39 s; sleep #10 kết thúc 11:00:00Z, đúng giây DR 11:00Z): T7 chờ thêm ~90–100 s rồi mới đọc slot — 0 slot nào bị đọc sớm, 0 số sai vào verdict. Bài học: căn sleep kết thúc SAU slot ít nhất 60 s (đã ghi trong NOTES từng lần).
10. **F-177-T7-3 — Cờ round177-t9.done CHƯA CÓ trên đĩa lúc T7 đọc cuối (11:02:17Z) dù LIMITS T9 đã có (38.500 B, mtime 11:02Z).** Cùng mẫu F-176-T7-3/F-175-T7-3. T10-177 kiểm lại trước khi chốt đếm cờ 9/9 (T9-177 ghi "7/9 + T9 = 8/9 — T7 CHƯA đóng" lúc T9 đóng).
11. **Mù #96? (#64) VẪN MỞ** theo T2-177 (R 1.238 s lần 13 không đổi; U union-A 1.118 → 1.276 s MỞ do pruning xóa mốc 08:38:24Z; U union-B 1.118 s cách sàn 29 s — theo dõi sát). **Mù #95? (#63) MỞ** (quyết (b) đợt 163). **Mù #94? (#62) MỞ** (quyết (b) đợt 162). **Mù #88? VẪN MỞ** (hole-recheck lần 21: 337 hit, 0 mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức: INSIDE #89 FALSE CUỐI → chuỗi dài 7 ĐỨT → 0; INSIDE #90 TRUE (FULL136) → chuỗi MỚI 1 (T2-177; FULL136 hai dải đồng thuận).
12. **POSTBOOT_PASS #90 ĐÃ CÓ 08:51:55Z (T5-177, repair-sớm-quyet-h, poll=1 — CÓ caveat repair, KHÔNG phải replay-đầy-đủ)** — chờ parent quyết có được tính cho gate (a) không (§9(b) LIMITS T5). **POSTBOOT_PASS #89 VẪN CÓ (replay-đầy-đủ, không caveat)** — parent đã chấp nhận (c) đợt 176. **POSTBOOT_PASS #87/#88 CHƯA CÓ — KHÔNG bù được** (tổng boot không cờ GIỮ 18). **POSTBOOT_PASS #91 VẮNG — T5-177 không resume sau #91** (T8-177: gate T8-check-only, cần parent/T10 xác nhận lại; thuộc T5-178). Marker sống qua 42 reboot #49–#90 (T0-177 đếm độc lập 42); sống qua #91 chưa đếm — giao T0-178.
13. **O8 chuỗi WebKit FULL PASS: GIỮ 26 (T8-177 KHÔNG đề xuất lên 27 — 4 chân TÁCH BOOT: lượt yên #46 + gate (a) #90 + O8 T0 trên #90; O8 T8 + harness trên #91).** Lượt yên #46 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 39 → 40 (T4-177). Harness 6/6 sạch trên #91, kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 1 → 2 (T8-177). **#90 KHÔNG giết holder — chuỗi từ #69 lên 22 reboot** (T6-177; (A) 120/120 lần 27 + prune lần 52). **#91 có giết holder không — thuộc T6-178.**
14. **T7 đóng cờ ~11:0xZ — trễ ~5' so với hạn cờ ~11:00Z** (để kiểm DR 11:00Z + HB 10:50:50Z + viết LIMITS — cùng mẫu T7-176 trễ ~24' do DR 08:00Z + #90), trong hạn cứng ~11:30Z. T7 không bỏ slot nào trong cửa. **T10-177 chưa đóng sổ lúc T7 đóng** — aggregate 177 gộp số T7 đúng hạn nếu T10 đọc LIMITS này; nếu không, batch T7 gộp muộn theo tiền lệ (đợt 176: T7 đóng 08:24Z sau T10 08:14Z, gộp muộn §12.4).
15. **Harness 6/6 sạch + (1c')/(f') + 84l10 + H3 + headroom + ENOSPC + birefnet: xem LIMITS T8-177/T9-177.** T8-177: harness 6/6 sạch trên #91, 0 kẹt, kẹt cộng dồn GIỮ 21, chuỗi "P3 không kẹt" 1 → 2; (f') V1 live 0 kích hoạt đúng theo phạm vi; **phương án mở rộng (c')/(f') cho 86n2 ĐÃ ĐỀ XUẤT** (file proposal-f177-t8-7-expand-cf-86n2.md — chỉ đề xuất, không triển khai live — parent quyết sau; F-176-T8-7 đã có phương án). T9-177: headroom 0 lúc đóng (lần thứ 37); **cửa sổ thoáng #91 KHÔNG QUAN SÁT ĐƯỢC — chuỗi 5 lần liên tiếp (172–176) ĐỨT**; E-195 kết thúc bởi SAG, E-196–E-199 mới, E-199 đang ghim, tổng ghim 43/134 (32,1%); ENOSPC 72 dòng — đợt thứ 26; birefnet 0 lần thử lần thứ 31; **LIMITS T9 38.500 B VƯỢT giới hạn push 37.768 B (hơn 732 B)** — lúc push cần ENABLE_PRIVSEP=0.
16. **(1c') GIỮ NGUYÊN diag-only — (f') V1 live 0 kích hoạt ĐÚNG THEO PHẠM VI (0 FP trên 13 log sạch) → ĐƯỢC GIỮ; Q3 heartbeat 84l10 đúng thiết kế; F-177-T8-7 (phương án mở rộng (c')/(f') cho 86n2) ĐÃ CÓ PHƯƠNG ÁN — KHÔNG mở rộng phạm vi trong đợt này; parent quyết sau.** Balloon: E-195 kết thúc bởi SAG; E-196–E-199 mới, E-199 đang ghim; tổng ghim 43/134 (32,1%).

## 6. Phụ lục — số liệu từ script `appendix177.py` (epoch thô, không gõ tay)

Xem `~/workspace/repo-1/hidden_files/round177-t7/appendix177.txt` (chạy từ `appendix177.py` cùng thư mục). Tóm tắt các số đã kiểm:

- Run 176 SUCCEEDED 08:34:05Z, wall gốc 10.694 s, margin +106 s (cả hai cách tính, jitter 0 s), cf 8 s — KHÔNG phải ca thứ mười, 5 event, 1 lần viết lại.
- Run 177 jitter 0 s, viết lại ×1 (#91), tuổi gốc 8.754 s lúc 11:01:45Z (còn 2.046 s tới hạn).
- Reboot #91: btime 09:07:40Z, gap 7.031 s, requeue +50,157 s (m) ÂM ỨNG VIÊN (vượt biên trên 0,357 s).
- HB 6/6 toàn −316 s; DR 3/3 toàn 0 s; lũy kế HB 44/453, DR 51/299; cửa LÀNH lần thứ ba liên tiếp.
