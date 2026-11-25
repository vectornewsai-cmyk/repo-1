# PHASE9 ROUND178 T7 — RUN 177 SUCCEEDED 11:09:57Z (MARGIN +1.554 S, CF 7 S — KHÔNG PHẢI CA THỨ MƯỜI) + REBOOT #93 MỚI GIỮA PHIÊN, RUN 178 VIẾT LẠI ×1 + CỬA SLOT LÀNH LẦN THỨ TƯ LIÊN TIẾP (HB 6/6 + DR 3/3)

- **Luồng:** T7 đợt 178 (lượt cron 18:35:51 +07 23/11/2026 = 11:35:51Z). Nhiệm vụ theo brief T7-178: (1) kết cục run 177 — vẫn `running` lúc T7-177 đóng cờ (tuổi gốc 8.754 s, hạn 11:35:51Z; đã viết lại ×1 tại #91; jitter 0 s); (2) run 178: trạng thái, claimed_at, tuổi, jitter; (3) slot DR 12:00Z + HB 11:20:50Z; (4) reboot mới trong phiên (nếu có sau #92); (5) boot lúc đóng cờ + mọi F-178-T7-x.
- **Boot trong phiên:** mở phiên đã là **985bc2a3-f5b0-451f-af26-fac9d89a5419** (#92, btime 11:01:27Z — **T0-178 XÁC NHẬN 9 nguồn**). **Reboot #93 MỚI GIỮA PHIÊN** (boot 97054ac6, btime 13:07:35Z — T7 xác minh 9 nguồn, phát hiện trong 64 s; giết sleep #6 của T7 + poller T4 + runtime restart trùng thời điểm). **Boot lúc đóng cờ vẫn 97054ac6**.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 177/178 đầy đủ; HB/DR theo slot; requeue cửa hẹp #92/#93 — cả hai đã khép hẳn lúc đóng), LIMITS T7-177 + aggregate 177 §7 + §11 + cờ/LIMITS các luồng đợt 178 (T0/T1/T2/T4/T5/T6 đã đóng; **T8/T9 LIMITS + cờ CHƯA CÓ lúc T7 đóng — xem F-178-T7-3**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc + script python thuần tính số).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T7 đóng cờ ~14:14Z — trễ ~14' so với hạn cờ ~14:00Z (để kiểm DR 14:00Z + xác minh reboot #93 + đối chiếu T2/T4 cuối — cùng mẫu T7-177 trễ ~4' do DR 11:00Z), trong hạn cứng ~14:35Z. T7 không bỏ slot nào trong cửa.

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 177 kết cục? | **`succeeded` 11:09:57Z**, wall gốc 9.246 s, **margin +1.554 s** (theo cả hai cách tính — jitter 0 s), claimed→finished **7 s** | §2.1, Phụ lục |
| Run 177 có phải ca ≥60 s thứ mười? | **KHÔNG — số ca GIỮ 9** (cf 7 s < 60 s; run 175 = thứ chín) | §2.1 |
| Run 177 có bị viết lại lần 2 không? | **CÓ — đúng 2 lần viết lại** (#91 + #92), 8 event, 0 event sau succeeded | §2.1 |
| Viết lại lần 2 có ảnh hưởng kết cục/margin? | **KHÔNG** — vẫn SUCCEEDED; margin +1.554 s (lớn nhất chuỗi gần đây); finish 51 s sau reattach lần 2 | §2.1 |
| Run 178? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 8.802 s, còn 1.998 s tới hạn 14:35:51Z); **jitter 0 s**; **viết lại ×1** (#93); claimed không đổi | §2.2 |
| Reboot #92 (trước khi mở)? | **Boot 985bc2a3, btime 11:01:27Z, GIỜ THẬT** (T0-178 XÁC NHẬN 9 nguồn — KHỚP T7; marker sống qua 44 reboot #49–#92) | §2.3 |
| (m) #92? | **ÂM (CUỐI cấp T2)** — requeue +459,816 s, ngoài 410,016 s; **T0-178 ghi "KHÔNG CÓ ĐIỂM"** — khác nhãn, số thô khớp; parent hòa giải | §2.3 |
| Reboot #93 (mới giữa phiên)? | **Boot 97054ac6, btime 13:07:35Z, GIỜ THẬT** (T7 xác minh 9 nguồn; phát hiện trong 64 s); gap #92→#93 = **7.568 s**; số hiệu #93 chờ T0-179 xác minh 9 nguồn | §2.4 |
| (m) #93? | **DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — requeue +36,248 s TRONG dải; 1 run sống + 1 requeue duy nhất cửa hẹp (đã khép, đếm cuối); KHÔNG sát biên | §2.4 |
| Cửa slot đợt 178? | **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — CỬA LÀNH, lần thứ tư liên tiếp (175 + 176 + 177 + 178)** | §2.5 |
| DR 12:00Z? | **CÓ** — đúng giờ, jitter 0 s (nợ chính của T7-178, nay đã trả) | §2.5 |
| Đồng hồ lúc mở / trong phiên? | **Cloudflare chênh ~1 s** (lúc mở ~0–1 s; lúc phát hiện #93 ~1 s, CF nhanh hơn) — khớp T0/T2/T5-178 | §2.3/§2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–177 — SỐ SLOT THIẾU, chỉ cộng tử số khi có slot thiếu thật): heartbeat **44/459 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **51/302 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới — đợt thứ mười bảy liên tiếp vắng muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 177 — SUCCEEDED 11:09:57Z, margin +1.554 s, cf 7 s, KHÔNG PHẢI CA THỨ MƯỜI; VIẾT LẠI ×2 (đọc #1 + events đối chiếu trực tiếp + T0/T2-178 đối chiếu độc lập)

Run 177 (`2e0ce3f4-7d34-465a-a3e1-b1ef69b28739`, sched 1795422951 = 08:35:51Z 23/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795422951 = 08:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×2) | 1795422951 → **1795424910 = 09:08:30Z** (#91) → **1795432146 = 11:09:06Z** (#92) — KHÔNG đổi sau đó |
| finished_at_utc | 1795432197 = 11:09:57Z (event `succeeded` 11:09:57.056Z, eid 10399) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795432190 = 11:09:50Z (finished − 7 s) — **ĐÃ ĐỔI** so với T7-177 (1795422951 không đổi qua 10 lần đọc tới 11:01:45Z); đổi trong (11:01:45Z, 11:09:50Z] |
| worker_boot_generation | cron_boot_c92a2dd53e184af3909fa8d67a1d6577 (boot #92) |
| Wall từ started gốc | 1795432197 − 1795422951 = **9.246 s** (2h34m06s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795433751 = 11:35:51Z — finished TRƯỚC hạn **1.554 s (margin +1.554 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795433751 = 11:35:51Z — **cùng hạn** (jitter 0 s) → margin **+1.554 s theo cả hai cách tính** |
| Wall từ started viết lại lần 2 | 1795432197 − 1795432146 = **51 s** (thực thi trên boot #92 sau viết lại lần 2) |

- Events run 177 (đầy đủ, **đúng 8 event, 0 event sau succeeded**): `dispatched` 08:35:51.076Z (10359) + `requeued_after_restart` 09:08:30.157Z (10369) + `dispatched` 09:08:30.241Z (10370) + `reattached_after_restart` 09:08:30.442Z (10371) + **`requeued_after_restart` 11:09:06.815Z (10396)** + `dispatched` 11:09:06.877Z (10397) + `reattached_after_restart` 11:09:06.941Z (10398) + **`succeeded` 11:09:57.056Z (10399)**. **ĐÚNG 2 LẦN VIẾT LẠI** (#91 + #92) — run đầu tiên bị viết lại 2 lần trong 2 reboot liên tiếp, không timeout (T0-178 cùng kết luận).
- **Run 177 finish 11:09:57Z — SAU khi T7-177 đóng cờ (~11:04Z) 5m53s và TRƯỚC khi lượt 178 mở (11:35:51Z) 25m54s** → kết cục này là nợ chính của T7-178, nay đã trả.
- **Viết lại lần 2 tại #92 — CÓ, và KHÔNG ảnh hưởng kết cục/margin:** requeue #92 tới 11:09:06.815Z (btime #92 +459,816 s — muộn bất thường, xem §2.3); run finish 51 s sau reattach lần 2 (11:09:57Z), trước hạn 1.554 s. T7-177 đọc #10 lúc 11:01:45Z (18 s SAU btime #92) vẫn thấy trạng thái #91 — vì requeue #92 chỉ xử lý lúc 11:09:06Z. **Margin +1.554 s là lớn nhất chuỗi gần đây** (174: +721 s; 175: +690 s; 176: +106 s; 177: +1.554 s). Chuỗi succeeded: 174 → 175 → 176 → 177 (4 run).
- **Claimed_at đổi lúc cuối (cùng mẫu run 171–176):** T7-177 đọc 10 lần đều thấy claimed = 1795422951 (không đổi tới 11:01:45Z); DB tươi lúc T7-178 đọc #1 (~11:37Z) đã là 1795432190 = finished − 7 s. Theo quy ước họ ca (claimed_at CUỐI CÙNG trong DB), **claimed→finished = 7 s — KHÔNG thuộc họ ≥60 s**. Số ca **GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. **Run 177 KHÔNG phải ca thứ mười.**
- T0-178 + T2-178 đối chiếu độc lập: **SUCCEEDED 11:09:57Z, margin +1.554 s, cf 7 s, KHÔNG phải ca ≥60 s, viết lại ×2** — KHỚP T7 từng số.

### 2.2 Run 178 — vẫn `running` lúc đóng cờ, jitter 0 s, viết lại ×1 (#93), claimed không đổi

Run 178 (`1949f57a-4454-4d02-a323-29ba7dd06bed`, sched 1795433751 = 11:35:51Z 23/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795433751 | 11:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795433751 → **1795439291** | 11:35:51Z → **13:08:11Z** (dịch +5.540 s) |
| worker_claimed_at | 1795433751 | 11:35:51Z (KHÔNG đổi qua 9 lần đọc) |
| worker_boot_generation | cron_boot_dcf769fae1fb4691bd927c2abf6db813 → **cron_boot_92e3cfb8508d49a58fc4cdd864e315b5** | #92 → **#93** |
| Hạn ngân sách (started gốc + 10.800 s) | 1795444551 | 14:35:51Z 23/11 |

- **Jitter 0 s** — run 178 dispatch đúng giây sched 11:35:51Z. **Chuỗi jitter 0 s: run 175 → 176 → 177 → 178 (4 run liên tiếp).**
- 9 lần đọc DB trong phiên (đọc #1–#9, 11:37Z–14:02Z): run 178 `running` ở mọi lần đọc; started_at gốc KHÔNG đổi ở đọc #1–#6 (11:37Z–13:02Z), đổi lần 1 tại đọc #6b (~13:08Z, sau #93), KHÔNG đổi ở đọc #7–#9; claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): đọc #2 (11:51:52Z) 961 s; #3 (12:02:07Z) 1.576 s; #4 (12:22:26Z) 2.795 s; #5 (12:52:42Z) 4.611 s; #6 (13:02:02Z) 5.171 s; #7 (13:22:42Z) 6.411 s; #8 (13:53:02Z) 8.231 s; #9 (14:02:33Z) **8.802 s, còn 1.998 s** tới hạn ngân sách 14:35:51Z. **Kết cục thuộc T7-179** (hạn cứng đóng đợt 178 là ~14:35Z, cùng hạn run 14:35:51Z — cùng mẫu run 174/175/176/177).
- Events run 178 tới lúc đóng cờ: đúng 4 event — dispatched 11:35:51.165Z (10404) + **requeued 13:08:11.248Z (10428) + dispatched 13:08:11.642Z (10429) + reattached 13:08:11.724Z (10430)**.

### 2.3 Reboot #92 TRƯỚC KHI MỞ PHIÊN (btime 11:01:27Z, boot 985bc2a3) — T0-178 XÁC NHẬN 9 NGUỒN + (m) #92 ÂM (CUỐI cấp T2) / T0 GHI "KHÔNG CÓ ĐIỂM"

- **Reboot #92: boot 985bc2a3-f5b0-451f-af26-fac9d89a5419, btime 1795431687 = 11:01:27Z 23/11.** T7 mở phiên đã thấy boot này (uptime -s 11:01:27Z khớp; Cloudflare Date vs local chênh ~0–1 s, CF nhanh hơn — GIỜ THẬT). **T0-178 ĐÃ XÁC NHẬN 9 nguồn** (cờ 12:02Z; marker sống qua **44 reboot #49–#92** — tăng từ 42 sau #90).
- **Gap #91→#92 = 6.827 s** (T0-178 + T2-178 + T7 khớp).
- **(m) #92 — HAI NHÃN, MỘT SỐ THÔ:** requeue duy nhất eid 10396, 11:09:06.815565Z = btime +**459,816 s**, NGOÀI dải (m) [33; 49,8], vượt biên TRÊN 410,016 s; với boot_est T0-178 (+0,396 s): 459,420 s — vẫn ngoài 409,620 s; **KHÔNG phải sát biên** (margin 410 s >> 1 s — caveat phân số không ảnh hưởng). **T2-178 phán CUỐI: ÂM** (n ứng viên GIỮ 36/37). **T0-178 ghi: "KHÔNG CÓ ĐIỂM"** (0 requeue trong band (m) [11:02:00Z, 11:02:16,8Z]; 1 requeue duy nhất cửa rộng [11:01:27Z, 11:16:27Z]). Theo cách đếm T7-177 (cửa [btime, btime+19m]): #92 có ĐÚNG 1 requeue. **Số thô KHỚP nhau hoàn toàn; chỉ khác nhãn** — T7 không hòa giải, parent 178 quyết nhãn cuối. Dù nhãn nào, n ứng viên GIỮ 36/37.
- **Requeue #92 MUỘN BẤT THƯỜNG (F-178-T0-4):** +459,816 s sau btime — chậm hơn mọi requeue trước (#86: 49,418 s; #87: 39,864 s; #88: 33,431 s; #90: 35,313 s; #91: 50,157 s). Scheduler/DB mất ~7m40s mới viết lại run 177 sau #92 (run 177 vẫn sống tới 11:09:57Z rồi SUCCEEDED — không mất mát).
- **(m) #91 — ÂM (CUỐI cấp T2):** requeue +50,157 s, NGOÀI dải, vượt biên TRÊN 0,357 s; n ứng viên GIỮ 36/37; n chính thức GIỮ 14. Caveat phân số: KHÔNG CÓ boot_est #91 — prior δ#90 +0,32 s → ngoài 0,037 s; prior δ#92 +0,396 s → trong 0,04 s — **KHÔNG PHÂN ĐỊNH ĐƯỢC bằng dữ liệu hiện có** (F-178-T2-2); theo quy ước đứng (btime): ÂM. Overlap sampler +15 s / watcher +17 s (#91, lớn nhất chuỗi) là caveat, KHÔNG BAO GIỜ lật verdict btime (tiền lệ #87/#90, áp dụng đối xứng). Parent quyết cuối.
- **POSTBOOT_PASS #92 ĐÃ CÓ 11:53:41Z** (T5-178, mode replay-đầy-đủ, poll=0 — KHÔNG caveat, khác cờ repair #90); **POSTBOOT_PASS #91 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được** (T5-178: watcher-177 chết theo #91; 0 file nhắc 8c0ec92d) → tổng boot không cờ **18 → 19**.
- **#92 KHÔNG giết holder** (T6-178: lock trống 979 s trước btime — chuỗi "không giết holder" từ #69 lên 24 reboot cùng #91).

### 2.4 Reboot #93 MỚI GIỮA PHIÊN (btime 13:07:35Z, boot 97054ac6) — RUN 178 VIẾT LẠI LẦN 1 + (m) #93 DƯƠNG ỨNG VIÊN

- **Reboot #93: boot 97054ac6-0ad1-4bd9-abda-5c91466292a9, btime 1795439255 = 13:07:35Z 23/11.** Xác minh T7 (lúc phát hiện ~13:08:39Z + kiểm lại lúc đọc #7 ~13:22Z + kiểm lại lúc đóng ~14:02Z — cả ba lần đều 97054ac6, btime 1795439255): boot_id + btime /proc/stat + `uptime -s` 13:07:35Z (khớp) + /proc/1 mtime 13:07:46.530Z (+11,530 s) + journal idx 0 duy nhất, first entry 13:07:46Z (+11 s) + wtmp begins 13:07:46Z (+11 s) + `last` reboot 13:07 still running + `who -b` 13:07. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 13:08:40 GMT vs 13:08:39 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #93 theo đếm tuần tự — CHỜ T0-179 xác minh 9 nguồn** (T0-178 đóng cờ 12:02Z, TRƯỚC #93; T4-178 ghi "chờ T0-178" là lỗi ghi — xem §2.6).
- **T7 phát hiện #93 trong 64 s sau btime** (btime 13:07:35Z → kiểm đầu 13:08:39Z; runtime restart trùng thời điểm báo gián đoạn lúc ~13:08:08Z — xem F-178-T7-1).
- **Gap #92→#93 (btime−btime): 1795439255 − 1795431687 = 7.568 s (2h06m08s — trở lại mẫu ~2h).** Chuỗi gap gần đây: 6.243 / 7.031 / 6.827 / 7.568 s.
- **#93 xảy ra TRONG lúc run 178 chạy:** run 178 dispatch gốc 11:35:51Z, btime #93 13:07:35Z (tuổi gốc lúc btime **5.504 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 178)** — theo EVENTS (dispatched trước btime, chưa finish) + truy vấn DB (scheduled ≤ btime AND (finished NULL OR finished > btime): ĐÚNG 1 dòng — run 178).
- **Run 178 BỊ VIẾT LẠI LẦN 1 tại #93:** started 1795433751 → **1795439291 = 13:08:11Z** (dịch **+5.540 s**); boot_gen đổi dcf769fa (#92) → **92e3cfb8508d49a58fc4cdd864e315b5** (#93); **claimed_at KHÔNG ĐỔI (1795433751)**; vẫn running, attempt 1, error null.
- **Requeue do #93 (cửa hẹp [13:07:35Z, 13:26:35Z], kiểm sau khi cửa khép hẳn ở đọc #8 ~13:53Z): ĐÚNG 1 DÒNG** — run 178, eid 10428, 13:08:11.248Z. Không job nào khác bị requeue do #93. Band (m) [13:08:08Z, 13:08:24,8Z]: ĐÚNG 1 requeue (cùng dòng).
- **Requeue offset +36,248 s — TRONG dải (m) 33–49,8 s, cách biên DƯỚI 3,248 s, cách biên TRÊN 13,552 s** (13:08:11.248Z − btime nguyên 1795439255). Reattach +36,724 s; dispatch lần 2 +36,642 s. **(m) #93 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-179 phân loại cuối + parent 179. **KHÔNG sát biên:** offset thật ∈ (35,248 s, 36,248 s] (btime nguyên, boot thật ∈ [btime, btime+1 s)) — đều trong band; margin xấu nhất tới biên dưới 2,248 s >> 1 s — **caveat phân số KHÔNG lật được** (khác #91 sát biên trên 0,357 s, không phân định được). T7 chưa có boot_est #93 (T0-179 đo).
- **Requeue NHANH (+36,248 s, cùng mẫu #90 +35,313 s) — KHÁC #92 muộn bất thường (+459,816 s);** daemon hồi phục nhanh sau #93.
- Nếu parent CHẤP NHẬN #91 ÂM + #92 ÂM (n ứng viên GIỮ 36/37) rồi #93 DƯƠNG: n ứng viên **36/37 → 37/38** (số học nối tiếp T2-178; T7 chỉ ghi số học, T2-179 tính chính thức). n chính thức GIỮ 14.
- **Sleep của T7 bị giết theo #93** (xem F-178-T7-1): sleep 1.200 s spawn 13:03:35Z, chết lúc reboot 13:07:35Z sau ~240 s; T7 phát hiện boot mới trong 64 s, 0 số liệu mất, 0 số sai.
- **INSIDE #93 + FULL139 + POSTBOOT_PASS #93 + #93 có giết holder không: thuộc T2-179 / T5-179 / T6-179.** T7 không tự tính INSIDE/CERT/FULL. Watcher-178 pid 92180 (hạn 14:35:00Z) vẫn ALIVE lúc T5 đóng (12:03Z) — nhiều khả năng CHẾT theo #93; T5-179 lo.

### 2.5 Slot HB/DR trong cửa 11:37Z → 14:02Z 23/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH LẦN THỨ TƯ LIÊN TIẾP

Cửa kiểm ~2h25' (9 lần đọc DB).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 18:20:50 (11:20:50Z) | 94898e7b | 11:15:34 | **−316 s** | CÓ |
| 18:50:50 (11:50:50Z) | 7027e875 | 11:45:34 | **−316 s** | CÓ |
| 19:20:50 (12:20:50Z) | f89335d3 | 12:15:34 | **−316 s** | CÓ |
| 19:50:50 (12:50:50Z) | 9efe02d2 | 12:45:34 | **−316 s** | CÓ |
| 20:20:50 (13:20:50Z) | 79b9fd1e | 13:15:34 | **−316 s** | CÓ |
| 20:50:50 (13:50:50Z) | 32228069 | 13:45:34 | **−316 s** | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started. **Toàn −316 s — KHÔNG có ngoại lệ.** 0 muộn mới — muộn HB lũy kế GIỮ 9 (đợt thứ mười bảy liên tiếp vắng muộn mới).
- HB 11:20:50Z + 11:50:50Z + 12:20:50Z + 12:50:50Z dispatch trên boot #92 (sau btime #92 14m07s / 44m07s / 1h14m07s / 1h44m07s); HB 13:20:50Z + 13:50:50Z dispatch trên boot #93 (sau btime #93 7m59s / 37m59s).

**Deterministic-doctor (lưới :00:00Z): 3/3 có — DR 12:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 19:00 (12:00Z) | cc83b626 | 12:00:00 | 0 s | CÓ |
| 20:00 (13:00Z) | 3f43e586 | 13:00:00 | 0 s | CÓ |
| 21:00 (14:00Z) | a4219905 | 14:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 12:00Z CÓ, đúng giờ** — nợ chính của T7-178, nay đã trả. DR 12:00Z + 13:00Z dispatch trên boot #92 (sau btime #92 58m33s / 1h58m33s); DR 14:00Z dispatch trên boot #93 (sau btime #93 52m25s).
- **Cửa slot đợt 178 LÀNH (HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn). Lần thứ tư liên tiếp cửa lành hoàn toàn (đợt 175 + 176 + 177 + 178)** — sau chuỗi cửa lành 11 đợt 162–172 đã dứt ở đợt 173.

### 2.6 Đối chiếu chéo các luồng đợt 178 (chỉ ghi nhận)

- **T0-178** (cờ 12:02Z): **#92 XÁC NHẬN 9 nguồn** (nợ đợt 177 đã trả; marker sống qua **44 reboot #49–#92**); **#91 XÁC NHẬN** (gián tiếp — F-178-T0-2: journal/wtmp hiện tại chỉ còn #92; dựa trên bản ghi 9 nguồn T7-177 + T4-177 + DB boot_gen đổi đúng 2 lần #90→#91→#92); run 177 SUCCEEDED 11:09:57Z, margin +1.554 s, cf 7 s — KHỚP T7; **(m) #92 KHÔNG CÓ ĐIỂM** (requeue +459,816 s; 0 requeue band (m); 1 requeue cửa rộng — xem §2.3); **O8 trên #92 PASS 3/3** (WebKit 21/21 ×2 md5 cd482875…/eb1cedf8…; Chromium 21/21 md5 2a8721a1…, 11:55:45–11:59:08Z, SAU POSTBOOT_PASS #92 124 s); **POSTBOOT_PASS #92 ĐÃ CÓ 11:53:41Z** (replay-đầy-đủ, poll=0, KHÔNG caveat). T0-178 đóng TRƯỚC #93 — **#93 chờ T0-179 xác minh 9 nguồn**.
- **T1-178** (cờ 11:45Z): **verify đợt 177: PASS** — đợt 177 = 10/14/14/13; lũy kế 111–177 = 658/1.149/998/820; chờ push 166–177 = 120/170/159/156; đếm khớp lần thứ 76 liên tiếp.
- **T2-178** (cờ 13:31Z): **(m) #91 ÂM (CUỐI cấp T2)** — requeue +50,157 s — KHỚP T7-177 từng số; **(m) #92 ÂM (CUỐI cấp T2)** — requeue +459,816 s (xem §2.3 về khác nhãn với T0); **INSIDE #91 TRUE (FULL137) — chuỗi 1 → 2** (dải neo #90; cách biên trên 1,748 s; cross-check FULL136 neo #89 FALSE, trễ 4,487 s — hai dải MÂU THUẪN lần thứ 6; dải phương pháp chi phối F-165-T2-1); **INSIDE #92 TRUE (FULL138) — chuỗi 2 → 3** (dải neo #91; cách biên trên 1,944 s; cross-check FULL137 neo #90 FALSE, trễ 5,079 s — MÂU THUẪN lần thứ 7); **INSIDE #90 KIỂM LẠI (F-178-T2-1):** m-check177 dùng sai neo #88 cho FULL136 (phải là #89) — kiểm lại neo đúng: TRUE (biên 4.672 s / 2.544 s) — verdict KHÔNG ĐỔI; **mù #96?/#95?/#94?/#88?/#77? VẪN MỞ** (hole-recheck lần 22: NEW=0 mọi hố; H-E1-88 337 hit, 0 mới; CERT/FULL GIỮ 76/91; U union-B cách sàn 29 s); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 21** (5 hướng DB mới (xxiii)–(xxvii) + hướng file-based đều âm tính; tổng 77 hướng); EPERM probe #96: 11:42:49Z, boot 985bc2a3, ok=2 fail=0; sweep #96: 0 sóng thật (156 *.log, 3 file có marker); **§4.2 — 1 CHỒNG CHÉO KHÔNG CHỦ Ý với attempt1 sau #93 của T4** (walk mù T2 13:09:50–13:11:33Z trong cửa sổ attempt1; merged/content/sessions/witness ~13:11:35–13:14:30Z chồng pha đo nhưng là script NHẸ; hole-recheck + m56 + sweep SAU attempt; T2 KHÔNG tự kết luận 0 vi phạm nữa — để parent quyết; xem §5.15). LIMITS 37.751 B (dưới giới hạn 17 B).
- **T4-178** (cờ 13:25Z): **lượt yên #47: CÓ LƯỢT HỢP LỆ** — attempt1-97054ac6 20/20 + B 5/5, tickCost median 45,0 ms — **chuỗi lượt yên hợp lệ 40 → 41** (ngân sách 1/3); **#93 giết poller giữa chừng** (instance 2: 118 poll trên #92, 0 cửa mở; poll cuối #118 13:07:43Z — đồng hồ boot cũ nhanh ~8 s so với btime #93, overlap biểu kiến +8 s; T4 khởi động lại tay 13:09:15Z, instance 3: 5 poll, 1 cửa mở → attempt1 13:12:16–13:16:08Z trên #93); **GATE0 = T4-CHECK-ONLY (KHÔNG CÓ CỜ T5 CHO #93)** — cửa KHÔNG MỞ lần nào trên #92 (RAM balloon ghìm 67/118 poll <500 MB); **0 VI PHẠM luật script nặng theo T4** (F-178-T4-1: chỉ 1 tick probe-mo-93c nhẹ của T9 lúc 13:13:10Z trong cửa sổ attempt); F-178-T4-2: chuỗi median ĐÃ SỬA (LIMITS 177 §7 in thiếu median #45 là 46,0 ms). LIMITS 37.679 B sau trim.
- **T5-178** (cờ 12:04Z): **POSTBOOT_PASS #92 ĐÃ CÓ 11:53:41Z** (mode replay-đầy-đủ, poll=0 — KHÔNG caveat; dpkg 1.545 dòng; cache 178; GST 269); **#91 KHÔNG CÓ cờ — ĐÃ XÁC NHẬN, KHÔNG bù được** (tổng boot không cờ **18 → 19**); watcher-177 pid 114543 **CHẾT theo #91** (poll cuối 09:07:57Z, +17 s sau btime #91 — overlap thứ chín, F-178-T5-1); watcher-178 START 11:43:08Z pid 92180, hạn 14:35:00Z, REPLAY_DONE + FLAG-WRITTEN 11:53:41Z, vẫn ALIVE lúc T5 đóng; khoảng không-watcher ~9.311 s (2h35m11s); replay #92 bắt đầu 11:35:44Z (heal dpkg, boot+34m17s), replay chính 11:50:40–11:53:11Z; T4-178 ĐÃ CÓ gate (a) từ poll #27 11:59:06Z. LIMITS 36.050 B.
- **T6-178** (cờ 11:57Z): **(A) 120/120 lần thứ 28** (tổng 3.360/3.360); **#91 + #92 KHÔNG giết holder** (lock trống 450 s trước btime #91, 979 s trước btime #92 — chuỗi "không giết holder" từ #69: **22 → 24 reboot**); **prune lần 53: xóa 2 file**, queue 102 → 100 file; 1 zombie thoáng qua (F-178-T6-5, tự reap ~12 s); X11 trống cả 3 thời điểm. LIMITS 37.680 B.
- **T8/T9-178: LIMITS + cờ CHƯA CÓ lúc T7 đóng (~14:03Z) — xem F-178-T7-3.** Scratch T8 có `build-86n2-hb128.py` (triển khai phương án A F-177-T8-7); scratch T9 có probe-loop-93 + headroom-log + ram-sampler (đang làm việc trên #93). T10-178 kiểm lại trước khi chốt đếm cờ 9/9.

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 177/178 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #92/#93 — cả hai đã khép hẳn lúc đóng; runs spanning btime). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. (Đợt này 0 slot thiếu — HB 6/6 + DR 3/3 đều có trong DB tươi.)
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + F-176-T7-5). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #92/#93 đều là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng ở §2.3/§2.4 — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning #93 = 1 theo cả EVENTS lẫn truy vấn DB (finished NULL vẫn tính là sống — T7 ghi rõ điều kiện truy vấn; khác mẫu #91/#92 finished đã có).
4. Cửa kiểm đợt này ~2h25' (11:37Z → 14:02Z 23/11), đủ 6 slot HB + 3 slot DR + run vcut 177 (kết cục) và 178 (theo dõi + viết lại tại #93). Chín lần đọc DB đầy đủ (đọc #1–#9, gồm đọc #6b phát hiện #93); run 177 được đọc đầy đủ 1 lần khớp hoàn toàn với T0-178/T2-178 ở mọi trường + events; run 178 được đọc đầy đủ 9 lần (started_at đổi đúng 1 lần tại đọc #6b, claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 11:20:50Z + DR 12:00Z thuộc cửa 178 (sau kiểm cuối T7-177 lúc ~11:01Z). HB 14:20:50Z + DR 15:00Z (ngày 23/11) thuộc cửa T7-179.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #6 spawn 13:03:35Z, chết lúc reboot 13:07:35Z sau ~240 s — F-178-T7-1); 8/9 sleep hoàn thành; ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2). **Boot ĐỔI 1 lần trong phiên** (985bc2a3 → 97054ac6 tại #93; #92 đã xảy ra trước khi lượt mở) — T7 phát hiện #93 trong vòng 64 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn 97054ac6. **Runtime restart trùng #93** (sleep #6 của T7 + lệnh watch nền của T2 đều không có kết quả xác nhận sau restart — T7 xác minh lại trực tiếp, không qua lệnh watch).
7. T7 đóng cờ ~14:0xZ — trễ ~5–10' so với hạn cờ ~14:00Z (để kiểm DR 14:00Z + xác minh #93 + đối chiếu T2/T4 cuối — cùng mẫu T7-177 trễ ~4' do DR 11:00Z), trong hạn cứng ~14:35Z. T7 không bỏ slot nào trong cửa. **T10-178 chưa đóng sổ lúc T7 đóng** — aggregate 178 gộp số T7 đúng hạn nếu T10 đọc LIMITS này; nếu T10 đóng trước khi đọc, batch T7 gộp muộn theo tiền lệ.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix178.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 178 trong NOTES đều lấy từ script — KHÔNG lặp lại F-176-T7-5 (xem F-178-T7-2: tuổi đọc #3 trong NOTES ghi tay 1.596 s đã sửa thành 1.576 s theo script).

## 4. Cập nhật lũy kế (nối tiếp đợt 177, cùng phương pháp — SỐ SLOT THIẾU)

- Heartbeat: 44/453 → **44/459 slot thiếu** (cửa sổ 14/11 07:50:50 → 23/11 20:50:50 +07). Kiểm toán cửa sổ: 453 + 6 slot mới = 459 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 51/299 → **51/302 slot thiếu** (cửa sổ 11/11 09:00 → 23/11 21:00 +07). Kiểm toán: 299 + 3 = 302 ✓. Số thiếu +0 (0 thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 44/459 = 9,6% (giảm từ 9,7% — 0 thiếu mới); DR 51/302 = 16,9% (giảm từ 17,1% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ mười bảy liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 177: SUCCEEDED theo hồ sơ daemon (wall gốc 9.246 s, margin +1.554 s theo cả hai cách tính)** — đọc #1 + events đầy đủ (8 event, 0 event sau succeeded eid 10399) + T0-178/T2-178 đối chiếu khớp. 2 lần viết lại tại #91 + #92; claimed→finished 7 s (claimed đổi thành finished − 7 s lúc cuối — cùng mẫu run 171–176). **KHÔNG phải ca ≥60 s thứ mười — số ca GIỮ 9** (156/159/164/166/167/170/171/172/175); run 175 vẫn là ca thứ CHÍN. Margin lớn nhất chuỗi gần đây (+1.554 s vs 174 +721, 175 +690, 176 +106).
2. **Run 178 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 8.802 s, còn 1.998 s tới hạn ngân sách 14:35:51Z; viết lại ×1 tại #93) — kết cục thuộc T7-179. **Claimed_at run 178 vẫn giữ nguyên (11:35:51Z) lúc đóng** — T7-179 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 178 = 0 s** (chuỗi jitter 0 s: run 175 → 176 → 177 → 178).
3. **Reboot #92 (btime 11:01:27Z, boot 985bc2a3): TRƯỚC KHI MỞ PHIÊN, giờ thật, T0-178 XÁC NHẬN 9 nguồn.** Gap #91→#92 = 6.827 s. Số hiệu #92 ĐÃ ĐƯỢC T0-178 xác nhận (không còn chờ). **(m) #92: T2-178 phán CUỐI — ÂM** (+459,816 s; boot_est T0 +0,396 s; không sát biên); **T0-178 ghi "KHÔNG CÓ ĐIỂM"** — khác nhãn, số thô khớp (xem §2.3); parent hòa giải nhãn cuối đợt 178. **INSIDE #92 TRUE (FULL138) — chuỗi 2 → 3** (T2-178; hai dải mâu thuẫn lần thứ 7, dải phương pháp chi phối).
4. **Reboot #93 (btime 13:07:35Z, boot 97054ac6): GIỮA PHIÊN, giờ thật, T7 xác minh 9 nguồn trong 64 s.** Gap #92→#93 = 7.568 s. Số hiệu #93 theo đếm tuần tự — **CHỜ T0-179 xác minh 9 nguồn**. **Điểm (m) #93: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — requeue +36,248 s TRONG dải, KHÔNG sát biên (margin xấu nhất 2,248 s — caveat phân số không lật được); 1 run sống tại btime + 1 requeue duy nhất cửa hẹp (đã khép — đếm cuối); T2-179 phân loại cuối + parent 179. **INSIDE #93 + FULL139 thuộc T2-179.**
5. **Điểm (m) #91: T2-178 phán CUỐI — ÂM** (+50,157 s; KHÔNG CÓ boot_est #91 — KHÔNG PHÂN ĐỊNH ĐƯỢC bằng dữ liệu hiện có; theo quy ước đứng (btime): ÂM). **Parent quyết cuối đợt 178.** (m) #90: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 177 — KHÔNG mở lại. (m) #88: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 176 — KHÔNG mở lại. (m) #86/#87: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 175 — KHÔNG mở lại. (m) #84/#85: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 174 — KHÔNG mở lại. (m) #83: KHÔNG PHẢI ĐIỂM — parent ĐÃ CHẤP NHẬN đợt 173 — KHÔNG mở lại. (m) #89: ÂM (CUỐI) — parent quyết cuối đợt 177 (T2-177 đã phán CUỐI; T7 chỉ ghi nhận).
6. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-178 không thu hẹp được cửa lần thứ hai mươi mốt — xem LIMITS T2-178) — chờ parent chốt J. T2-179 tiếp tục thu hẹp cửa.
7. **Cửa slot: HB 6/6 + DR 3/3 — CỬA LÀNH, lần thứ tư liên tiếp (175 + 176 + 177 + 178).** Lũy kế: HB 44/459, DR 51/302. Muộn HB lũy kế GIỮ 9. **Jitter run vcut 0 s (run 175 + 176 + 177 + 178) — chuỗi jitter 0 s 4 run liên tiếp.** Toàn bộ 6 slot HB đều −316 s; 3 slot DR có đều 0 s. **DR 12:00Z CÓ, đúng giờ** (nợ chính T7-178 đã trả).
8. **F-178-T7-1 — Sleep #6 bị SIGTERM theo reboot #93** (cùng mẫu F-177-T7-1/F-176-T7-1/F-175-T7-1/F-174-T7-1): sleep 1.200 s spawn 13:03:35Z, chết lúc reboot 13:07:35Z sau ~240 s (runtime báo restart, recovery nhận biết gián đoạn lúc ~13:08:08Z); T7 phát hiện boot mới trong 64 s, 0 số sai. Đợt 178 có 1 sleep bị giết (đợt 177 có 1).
9. **F-178-T7-2 — Tuổi run 178 đọc #3 trong NOTES ghi tay 1.596 s — SAI 20 s, script sửa thành 1.576 s** (12:02:07Z − 11:35:51Z = 26m16s = 1.576 s; còn tới hạn 9.224 s, không phải 9.204 s). Mọi tuổi run trong LIMITS này đều lấy từ `appendix178.py` — KHÔNG lặp lại F-176-T7-5. 8/9 tuổi đọc khớp NOTES; chỉ đọc #3 lệch.
10. **F-178-T7-3 — Cờ round178-t8.done + round178-t9.done CHƯA CÓ trên đĩa lúc T7 đọc cuối (14:03:11Z) dù scratch T8/T9 đang làm việc** (T8: `build-86n2-hb128.py` — triển khai phương án A F-177-T8-7; T9: probe-loop-93 + headroom-log + ram-sampler). Cùng mẫu F-177-T7-3/F-176-T7-3/F-175-T7-3. T10-178 kiểm lại trước khi chốt đếm cờ 9/9.
11. **F-178-T7-4 — Hai giá trị worker_boot_generation khác nhau trên cùng boot OS #92:** run 177 sau viết lại #92 mang `cron_boot_c92a2dd5…` (11:09:06Z); run 178 dispatch 11:35:51Z mang `cron_boot_dcf769fa…`. T0-178 ghi dcf769fa là (#92); T2-178 §1.2 ghi cả hai gen trong ngữ cảnh #92 mà không nêu lệch. T7 chỉ ghi nhận — có thể daemon restart giữa 11:09:57Z và 11:35:51Z; cơ chế thuộc T0/T5-179. Không ảnh hưởng verdict run/boot (boot OS xác minh độc lập bằng boot_id + btime + journal 1 boot duy nhất).
12. **Mù #96? (#64) VẪN MỞ** theo T2-178 (R 1.238 s lần 14 không đổi; hole-recheck lần 22 NEW=0 mọi hố). **Mù #95? (#63) MỞ**; **mù #94? (#62) MỞ**; **mù #88? VẪN MỞ** (hole-recheck lần 22: 337 hit, 0 mới); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức: INSIDE #91 TRUE (FULL137) → chuỗi 1 → 2; INSIDE #92 TRUE (FULL138) → chuỗi 2 → 3 (T2-178; cả hai có dải cross-check mâu thuẫn, dải phương pháp chi phối).
13. **POSTBOOT_PASS #92 ĐÃ CÓ 11:53:41Z (T5-178, replay-đầy-đủ, poll=0 — KHÔNG caveat)** — chờ parent quyết có được tính cho gate (a) không (khác cờ repair #90, giống cờ replay-đầy-đủ #89 — parent đã chấp nhận (c) đợt 176 cho #89). **POSTBOOT_PASS #91 KHÔNG CÓ — ĐÃ XÁC NHẬN, KHÔNG bù được** (tổng boot không cờ **18 → 19**). **POSTBOOT_PASS #93 CHƯA CÓ** — T5-179 lo (watcher-178 pid 92180 hạn 14:35:00Z nhiều khả năng chết theo #93). Marker sống qua 44 reboot #49–#92 (T0-178 đếm độc lập 44); sống qua #93 chưa đếm — giao T0-179.
14. **O8 chuỗi WebKit FULL PASS: T8-178 chưa đóng — T7 không đề xuất số chuỗi.** Lượt yên #47 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 40 → 41 (T4-178, attempt1 trên #93 qua gate T4-check-only, KHÔNG có cờ T5 cho #93 — giá trị cho chuỗi FULL PASS thuộc T8/T10-178 + parent). Harness + O8 T8 trên #92/#93 + checklist (o) + F-177-T8-7 (phương án A — parent đã DUYỆT; T8-178 triển khai bản copy chẩn đoán 86n2-hb128): thuộc T8-178 (chưa đóng lúc T7 đóng). **#91 + #92 KHÔNG giết holder — chuỗi từ #69 lên 24 reboot** (T6-178). **#93 có giết holder không — thuộc T6-179.**
15. **Chuỗi "0 vi phạm" 2 đợt (176, 177) — ĐỢT 178 CÓ 1 CHỒNG CHÉO KHÔNG CHỦ Ý, parent quyết:** T2-178 §4.2 ghi walk mù 13:09:50–13:11:33Z trong cửa sổ attempt1 sau #93 của T4 (T4 khởi động lại tay 13:09:15Z, T2 chỉ biết khi đọc cờ T4 lúc 13:26Z); merged/content/sessions/witness ~13:11:35–13:14:30Z chồng pha đo nhưng là script NHẸ; hậu quả KHÔNG ĐO ĐƯỢC (attempt1 PASS SẠCH); **T2 KHÔNG tự kết luận 0 vi phạm nữa — để parent quyết**; T4-178 ghi 0 vi phạm. **T7-178: 0 vi phạm** (chỉ date/sleep/curl -sI + DB đọc + python thuần tính số; không probe dpkg; không script nặng trong cửa sổ attempt). Quy tắc nhắc lại cho đợt 179: KHÔNG khởi động script nặng khi T4 gate0wait với cả hai gate xanh — guard chỉ là lưới an toàn, không phải giấy phép. **0/6 file LIMITS đợt 178 đã có VƯỢT giới hạn push 37.768 B** (T2 37.751 B — chỉ còn 17 B; T4 37.679 B sau trim từ 37.856 B; T6 37.680 B — cả ba sát giới hạn) — đề nghị các T sau gọn file LIMITS lại.
16. **Harness + (1c')/(f') + headroom + ENOSPC + birefnet + E-199: thuộc T8/T9-178 (chưa đóng lúc T7 đóng)** — T7 không ghi thay.

## 6. Phụ lục — số liệu từ script `appendix178.py` (epoch thô, không gõ tay)

Xem `~/workspace/goals/capcut-clone-video-editor/hidden_files/round178-t7/appendix178.txt` (chạy từ `appendix178.py` cùng thư mục). Tóm tắt các số đã kiểm:

- Run 177 SUCCEEDED 11:09:57Z, wall gốc 9.246 s, margin +1.554 s (cả hai cách tính, jitter 0 s), cf 7 s — KHÔNG phải ca thứ mười, 8 event, 2 lần viết lại.
- Run 178 jitter 0 s, viết lại ×1 (#93, requeue +36,248 s), tuổi gốc 8.802 s lúc 14:02:33Z (còn 1.998 s tới hạn).
- Reboot #93: btime 13:07:35Z, gap 7.568 s, requeue +36,248 s (m) DƯƠNG ỨNG VIÊN (trong band, không sát biên).
- HB 6/6 toàn −316 s; DR 3/3 toàn 0 s; lũy kế HB 44/459, DR 51/302; cửa LÀNH lần thứ tư liên tiếp.
