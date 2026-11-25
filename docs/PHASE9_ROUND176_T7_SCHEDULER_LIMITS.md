# PHASE9 ROUND176 T7 — RUN 175 SUCCEEDED 05:24:21Z (MARGIN +690 S, CF 88 S — CA ≥60 S THỨ CHÍN) + RUN 176 JITTER 0 S, ĐANG CHẠY, VIẾT LẠI ×1 TẠI #90 + CỬA SLOT LÀNH LẦN HAI LIÊN TIẾP (HB 6/6 + DR 3/3)

- **Luồng:** T7 đợt 176 (lượt cron 12:35:51 +07 23/11/2026 = 05:35:51Z). Nhiệm vụ theo brief T7-176: (1) kết cục run 175 — vẫn `running` lúc T7-175 đóng cờ (tuổi gốc ~9.340 s, hạn 05:35:51Z; đã viết lại ×2 tại #87/#88; jitter 0 s); (2) run 176: trạng thái, claimed_at, tuổi, jitter; (3) slot DR 06:00Z + HB 05:20:50Z; (4) reboot mới trong phiên (nếu có sau #88); (5) boot lúc đóng cờ + mọi F-176-T7-x.
- **Boot trong phiên:** mở phiên đã là **15618ce8-2e0b-4565-b019-bdabc2c6e92c** (#89, btime 05:26:26Z — **T0-176 XÁC NHẬN 9 nguồn**, khớp T7; reboot xảy ra TRƯỚC khi lượt mở 9m25s). **Reboot #90 MỚI GIỮA PHIÊN** (boot 94247dfa, btime 07:10:29Z — T7 xác minh 9 nguồn, phát hiện 37 s sau btime). **Boot lúc đóng cờ vẫn 94247dfa**.
- **Phạm vi tuân thủ:** Đọc `scheduler.job_runs` + `scheduler.events` qua muse.db (vcut run 175/176 đầy đủ; HB/DR theo slot; requeue cửa hẹp #89 + #90 — cả hai đã khép hẳn lúc đóng, xem §2.3/§2.4), LIMITS T7-175 + aggregate 175 §7 + §11 + §12.3 (n)/(o) + cờ/LIMITS các luồng đợt 176 (T0/T1/T2/T4/T5/T6/T8/T9 đã đóng; **T9 LIMITS đã có nhưng cờ .done CHƯA CÓ lúc T7 đọc #10 — xem F-176-T7-3, ĐÃ HẾT lúc T10 đóng**). Không push, không release/tag, không code giả, không kiểm lại mù, không đụng TTS 39 / birefnet, không binary vào batch. Không sửa production code. Không có test mới. **KHÔNG chạy script nặng / KHÔNG probe dpkg trong cửa sổ attempt của T4** (quy tắc đứng sau vi phạm F-174-T2-5 — T7 chỉ chạy `date`/`sleep`/`curl -sI` Cloudflare + truy vấn DB đọc).
- **LƯU Ý VỀ THỜI GIAN ĐÓNG:** T10-176 đã đóng sổ ~08:14Z, TRƯỚC khi T7 đóng cờ (aggregate 176 §7 dựa trên NOTES.md của T7, đọc #1–#10 tới 07:52:23Z; §10.1 ghi 8/9 cờ, T7 chưa có). LIMITS này gộp muộn theo tiền lệ; nội dung mới so với aggregate: DR 08:00Z CÓ (§2.5), đọc #11 run 176 (§2.2), và **ĐÍNH CHÍNH tuổi run 176 ở đọc #8/#9/#10** (xem F-176-T7-5 — NOTES.md của T7 cộng thừa 600 s ở ba lần đọc đó; aggregate §7 đã sao lại số sai ở đọc #10).

## 1. Verdict

| Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|
| Run 175 kết cục? | **`succeeded` 05:24:21Z**, wall gốc 10.110 s, **margin +690 s** (theo cả hai cách tính — jitter 0 s), claimed→finished **88 s** | §2.1, Phụ lục |
| Run 175 có phải ca ≥60 s thứ chín? | **CÓ — ca thứ chín** (cf 88 s ≥ 60 s; run 172 = thứ tám, theo định nghĩa thống nhất parent đã chọn) | §2.1 |
| Run 175 có bị viết lại lần 3 không? | **KHÔNG** — đúng 2 lần viết lại (#87 + #88), 8 event, 0 event sau succeeded | §2.1 |
| Run 176? | **Vẫn `running` lúc đóng cờ** (tuổi gốc 9.964 s, còn 836 s tới hạn 08:35:51Z); **jitter 0 s** (chuỗi jitter 0 s: run 175 → 176); **viết lại ×1** (#90); claimed không đổi | §2.2 |
| Reboot #89 (trước khi mở)? | **Boot 15618ce8, btime 05:26:26Z, GIỜ THẬT** (T0-176 XÁC NHẬN 9 nguồn — KHỚP T7 từng số); gap #88→#89 = **1.329 s (22m09s — ngắn nhất chuỗi gần đây)** | §2.3 |
| (m) #89? | **ÂM** (T2-176 phân loại CUỐI cấp T2: 0 requeue, 0 run sống — KHỚP T7 từng số) | §2.3 |
| Reboot #90 (mới giữa phiên)? | **Boot 94247dfa, btime 07:10:29Z, GIỜ THẬT** (T7 xác minh 9 nguồn); gap #89→#90 = **6.243 s**; số hiệu #90 chờ T0-177 xác minh 9 nguồn | §2.4 |
| (m) #90? | **DƯƠNG ỨNG VIÊN (sơ bộ)** — requeue +35,313 s TRONG dải, cách biên dưới 2,313 s; 1 run sống + 1 requeue duy nhất cửa hẹp (đã khép, đếm cuối) | §2.4 |
| Cửa slot đợt 176? | **HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s) — CỬA LÀNH, lần thứ hai liên tiếp (175 + 176)** | §2.5 |
| DR 06:00Z? | **CÓ** — đúng giờ, jitter 0 s (khác DR 23:00Z đợt 174 không bao giờ xuất hiện) | §2.5 |
| Đồng hồ lúc mở / trong phiên? | **Cloudflare chênh ~1–2 s** (lúc phát hiện #89 chênh ~1 s; lúc phát hiện #90 chênh ~2 s, CF nhanh hơn) — khớp T0/T2/T5-176 | §2.3/§2.4 |

- Cập nhật lũy kế (cùng phương pháp đợt 125–175): heartbeat **44/447 slot thiếu** (số thiếu +0, mẫu số +6); deterministic-doctor **51/296 slot thiếu** (số thiếu +0, mẫu số +3). Muộn HB lũy kế **GIỮ 9** (0 muộn mới — đợt thứ mười lăm liên tiếp vắng muộn mới).

## 2. Bằng chứng

### 2.1 Kết cục run 175 — SUCCEEDED 05:24:21Z, margin +690 s, cf 88 s, CA THỨ CHÍN (đọc #1 + events đối chiếu trực tiếp + T0-176 đối chiếu độc lập)

Run 175 (`f0ac7900-cc16-41b5-9299-70f52dbcee3b`, sched 1795401351 = 02:35:51Z 23/11):

| Trường | Giá trị |
|---|---|
| scheduled_for_utc | 1795401351 = 02:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×2) | 1795401351 → 1795403205 → **1795410290 = 05:04:50Z** (dịch +1.854 s rồi +7.085 s; tổng +8.939 s) — KHÔNG đổi sau đó |
| finished_at_utc | 1795411461 = 05:24:21Z (event `succeeded` 05:24:21.712Z, eid 10315) |
| status | **`succeeded`** — attempt 1, error_text null, worker_execution_timed_out false |
| worker_claimed_at_utc | 1795411373 = 05:22:53Z (finished − 88 s) — **ĐÃ ĐỔI** so với T7-175 (1795401352 không đổi tới 05:11:03Z); đổi trong (05:11:03Z, 05:22:53Z] |
| worker_boot_generation | cron_boot_1f908a9c0e5d4246999b12c111eb419c (boot #88) |
| Wall từ started gốc | 1795411461 − 1795401351 = **10.110 s** (2h48m30s) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795412151 = 05:35:51Z — finished TRƯỚC hạn **690 s (margin +690 s)** |
| Hạn ngân sách (sched + 10.800 s) | 1795412151 = 05:35:51Z — **cùng hạn** (jitter 0 s) → margin **+690 s theo cả hai cách tính** |
| Wall từ started viết lại lần 2 | 1795411461 − 1795410290 = **1.171 s** (19m31s thực thi trên boot #88 sau viết lại) |

- Events run 175 (đầy đủ, **đúng 8 event, 0 event sau succeeded**): `dispatched` 02:35:51.224Z (10272) + `requeued_after_restart` 03:06:44.864Z (10282) + `dispatched` 03:06:45.045Z (10283) + `reattached_after_restart` 03:06:45.210Z (10284) + `requeued_after_restart` 05:04:50.431Z (10309) + `dispatched` 05:04:50.523Z (10310) + `reattached_after_restart` 05:04:50.608Z (10311) + **`succeeded` 05:24:21.712Z (10315)**. **ĐÚNG 2 LẦN VIẾT LẠI** (#87 + #88) — không có lần viết lại thứ ba tại #89.
- **Run 175 finish 05:24:21Z — TRƯỚC btime #89 (05:26:26Z) 125 s → #89 KHÔNG chạm kết cục run 175.** Kết cục này là nợ chính của T7-176, nay đã trả.
- **Claimed_at đổi lúc cuối (cùng mẫu run 171/172/173/174 — nhưng cf KHÁC hẳn):** T7-175 đọc 8 lần đều thấy claimed = 1795401352 (không đổi tới 05:11:03Z); DB tươi lúc T7-176 đọc #1 (~05:41Z) đã là 1795411373 = finished − 88 s. Theo quy ước họ ca (claimed_at CUỐI CÙNG trong DB), **claimed→finished = 88 s — THUỘC họ ≥60 s**. Số ca **8 → 9** (156/159/164/166/167/170/171/172/**175**); run 172 vẫn là ca thứ TÁM, **run 175 là ca thứ CHÍN**. Đây là ca ≥60 s đầu tiên kể từ run 172 — và là ca đầu tiên có cf 88 s (các ca trước: run 172 cf chưa công bố lại ở đây; 4 run gần nhất 171–174 đều cf 11–13 s, KHÔNG thuộc họ).
- **Không còn caveat margin hai cách tính:** run 175 jitter 0 s nên hạn started-gốc và hạn sched trùng nhau (05:35:51Z) — margin +690 s duy nhất, khác run 174 (chênh 13 s = jitter). T0-176 đối chiếu độc lập: **SUCCEEDED 05:24:21Z, 8 event, 2 lần viết lại, margin +690 s, claimed→finished 88 s** — KHỚP T7 từng số (xem F-176-T0-3; T0 giao T7-176 phán số thứ tự ca — T7 phán: **thứ chín**).
- **Chuỗi run vcut gần đây (margin, theo hạn started-gốc):** 171: 385 s; 172: 1.132 s; 173: **−13 s (TIMEOUT)**; 174: **+721 s (SUCCEEDED)**; 175: **+690 s (SUCCEEDED)**. Chuỗi succeeded: 174 → 175 (2 run).

### 2.2 Run 176 — vẫn `running` lúc đóng cờ, jitter 0 s, viết lại ×1 (#90), claimed không đổi

Run 176 (`2b4a5671-cda6-44c3-a337-c5da5d40b5fb`, sched 1795412151 = 05:35:51Z 23/11):

| Mốc | Epoch | `date -u` |
|---|---|---|
| scheduled_for | 1795412151 | 05:35:51Z 23/11 |
| started_at (gốc → VIẾT LẠI ×1) | 1795412151 → **1795417864** | 05:35:51Z → **07:11:04Z** (dịch +5.713 s) |
| worker_claimed_at | 1795412151 | 05:35:51Z (KHÔNG đổi qua 11 lần đọc) |
| worker_boot_generation | cron_boot_3af1984b937c4619b9161a2e7ee2b1dd | boot #90 (gốc: 82890fac, #89) |
| Hạn ngân sách (started gốc + 10.800 s) | 1795422951 | 08:35:51Z 23/11 |

- **Jitter 0 s** — run 176 dispatch đúng giây sched 05:35:51Z. **Chuỗi jitter 0 s: run 175 → run 176 (2 run liên tiếp).** T0-176 cũng ghi jitter 0 s — khớp.
- 11 lần đọc DB trong phiên (đọc #1–#11, 05:41Z–08:21Z): run 176 `running` ở mọi lần đọc; started_at gốc KHÔNG đổi ở đọc #1–#6 (05:41Z–07:02Z), đổi lần 1 tại đọc #7 (~07:11Z, sau #90), KHÔNG đổi ở đọc #8–#11; claimed_at KHÔNG đổi lần nào; boot_gen đổi đúng 1 lần (cùng lúc started). **1 lần viết lại.** Attempt 1; error_text null; worker_execution_timed_out false.
- Tuổi run từ gốc (script, không ghi tay — xem Phụ lục §6): đọc #1 (05:42:12Z) 381 s; #2 (05:52:22Z) 991 s; #3 (06:02:22Z) 1.591 s; #4 (06:22:37Z) 2.806 s; #5 (06:52:11Z) 4.580 s; #6 (07:02:22Z) 5.191 s; #8 (07:21:40Z) **6.349 s**; #9 (07:31:49Z) **6.958 s**; #10 (07:52:23Z) **8.192 s**; #11 (08:21:55Z) **9.964 s, còn 836 s** tới hạn ngân sách 08:35:51Z. **Kết cục thuộc T7-177** (hạn cứng đóng đợt 176 là ~08:30Z, trước hạn run 08:35:51Z — cùng mẫu run 174/175).
- **ĐÍNH CHÍNH (F-176-T7-5):** NOTES.md của T7 ghi tuổi run 176 ở đọc #8/#9/#10 là 6.949/7.558/8.792 s — **thừa 600 s** (cộng nhầm khi tính tay trong lúc ghi NOTES; các lần đọc khác đều đúng). Số đúng theo script (Phụ lục §6): **6.349 / 6.958 / 8.192 s**; còn tới hạn: **4.451 / 3.842 / 2.608 s**. Aggregate 176 §7 đã sao lại số sai ở đọc #10 (8.792 s / còn 2.008 s) — T10-177/parent lưu ý khi trích số. Verdict `running` + jitter 0 s + viết lại ×1 KHÔNG đổi theo cách tính nào.
- Events run 176 tới lúc đóng cờ: đúng 4 event — dispatched 05:35:51.091Z (10317) + **requeued 07:11:04.313Z (10339) + dispatched 07:11:04.360Z (10340) + reattached 07:11:04.436Z (10341)**.

### 2.3 Reboot #89 TRƯỚC KHI MỞ PHIÊN (btime 05:26:26Z, boot 15618ce8) — T0-176 XÁC NHẬN 9 NGUỒN + (m) #89 ÂM

- **Reboot #89: boot 15618ce8-2ec6-477e-b0b0-2f7e7c3ba4da, btime 1795411586 = 05:26:26Z 23/11.** Xác minh T7 (lúc phát hiện ~05:41:20Z + kiểm lại ~05:43Z — cả hai lần đều 15618ce8, btime 1795411586): boot_id + btime /proc/stat + `uptime -s` 05:26:26Z (khớp) + /proc/1 mtime 05:26:37.030Z (+11,030 s) + journal idx 0 duy nhất, first entry 05:26:37Z (+11 s) + wtmp begins 05:26:37Z (+11 s) + `last` reboot 05:26 still running + `who -b` 05:26. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 05:43:13 GMT vs 05:43:12 (**chênh ~1 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #89 theo đếm tuần tự — T0-176 ĐÃ XÁC NHẬN 9 nguồn** (round176-t0.done 05:52Z; marker sống qua 41 reboot #49–#89).
- **Gap #88→#89 (btime−btime): 1795411586 − 1795410257 = 1.329 s (22m09s — gap NGẮN NHẤT trong chuỗi gần đây; các gap trước ~7,1–7,5 nghìn s ≈ 2h).** T0-176 ghi F-176-T0-1 (gap ngắn bất thường, chỉ ~18,3% trung bình mẫu 7.245,5 s).
- **T7 phát hiện lần đầu lúc 05:41:20Z = btime + 894 s (~14m54s) — KHÔNG phải 44–45 s như #87/#88:** reboot xảy ra TRƯỚC khi lượt mở (05:35:51Z), nên không thể phát hiện nhanh trong phiên; ghi nhận trung thực, không giấu. Không sleep nào của T7 bị giết theo #89 (phiên mở sau #89).
- **#89 xảy ra SAU khi run 175 finish (05:24:21Z) và TRƯỚC khi run 176 dispatch (05:35:51Z):** run 175 finish trước btime 125 s; run 176 dispatch sau btime 565 s. **Spanning THẬT = 0 (không run nào sống tại btime)** — theo EVENTS. **Requeue trong cửa hẹp [05:26:26Z, 05:45:26Z] (mọi job, kiểm sau khi cửa khép hẳn ở đọc #2 ~05:52Z): 0 DÒNG. Requeue trong cửa rộng (tới lúc đọc ~05:52Z): vẫn 0 dòng.** T0-176 đối chiếu độc lập: **0 requeue cửa hẹp lẫn cửa rộng** (cửa rộng khép 05:41:26Z) — KHỚP T7. **(m) #89 — ÂM (T2-176 phân loại CUỐI cấp T2 — parent quyết cuối; T7 chỉ ghi số thô, KHỚP T2 từng số).**
- **INSIDE #89 (sơ bộ): FALSE (FULL135)** theo T2-176 — chuỗi INSIDE dài 7 (tới #88) ĐỨT tại #89 → 0 (phân loại cuối thuộc T2-177). T7 không tự tính INSIDE/CERT/FULL.
- **POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z** (T5-176, replay-đầy-đủ 170/170, poll=0 — cờ replay-đầy-đủ thứ hai liên tiếp sau #86). Cửa sổ thoáng #89 KHÔNG quan sát được (đợt mở boot+9m25s — T9-176).

### 2.4 Reboot #90 MỚI GIỮA PHIÊN (btime 07:10:29Z, boot 94247dfa) — RUN 176 VIẾT LẠI LẦN 1 + (m) #90 DƯƠNG ỨNG VIÊN

- **Reboot #90: boot 94247dfa-0716-4de9-bdc6-080161a73701, btime 1795417829 = 07:10:29Z 23/11.** Xác minh T7 (lúc phát hiện ~07:11:06Z + kiểm lại lúc đọc #8 ~07:21Z + kiểm lại lúc đóng ~08:21Z — cả ba lần đều 94247dfa, btime 1795417829): boot_id + btime /proc/stat + `uptime -s` 07:10:29Z (khớp) + /proc/1 mtime 07:10:40.779Z (+11,779 s) + journal idx 0 duy nhất, first entry 07:10:41Z (+12 s) + wtmp begins 07:10:40Z (+11 s) + `last` reboot 07:10 still running + `who -b` 07:10. **Đồng hồ boot mới ĐÚNG (giờ thật):** Cloudflare Date vs local: 07:11:16 GMT vs 07:11:14 (**chênh ~2 s**, CF nhanh hơn — cùng họ các đợt trước). **Số hiệu #90 theo đếm tuần tự — CHỜ T0-177 xác minh 9 nguồn** (T0-176 đóng cờ 05:52Z, TRƯỚC #90).
- **Gap #89→#90 (btime−btime): 1795417829 − 1795411586 = 6.243 s (1h44m03s — trở lại mẫu ~2h sau gap ngắn 1.329 s).**
- **#90 xảy ra TRONG lúc run 176 chạy:** run 176 dispatch gốc 05:35:51Z, btime #90 07:10:29Z (tuổi gốc lúc btime **5.678 s**), vẫn running lúc đóng cờ. **Spanning THẬT = 1 (run 176)** — theo EVENTS (dispatched trước btime, chưa finish); spanning theo truy vấn started_at = **0 dòng — ARTIFACT VIẾT-LẠI-TỰ-LOẠI** (started_at đã viết lại thành 07:11:04Z, sau btime — cùng mẫu #87/#88/#89). T7 dựa verdict (m) trên EVENTS + REQUEUE, không dựa trên spanning-artifact.
- **Run 176 BỊ VIẾT LẠI LẦN 1 tại #90:** started 1795412151 → **1795417864 = 07:11:04Z** (dịch **+5.713 s**); boot_gen đổi 82890fac (#89) → **3af1984b937c4619b9161a2e7ee2b1dd** (#90); **claimed_at KHÔNG ĐỔI (1795412151)**; vẫn running, attempt 1, error null.
- **Requeue do #90 (cửa hẹp [07:10:29Z, 07:29:29Z], kiểm sau khi cửa khép hẳn ở đọc #9 ~07:31Z): ĐÚNG 1 DÒNG** — run 176, eid 10339, 07:11:04.313Z. Không job nào khác bị requeue do #90.
- **Requeue offset +35,313 s — TRONG dải (m) 33–49,8 s, cách biên dưới 2,313 s, biên trên 14,487 s** (07:11:04.313Z − btime nguyên 1795417829). Reattach +35,436 s; dispatch lần 2 +35,360 s. **(m) #90 — DƯƠNG ỨNG VIÊN (sơ bộ, lean T7).** T2-177 phân loại cuối + parent 177. Nếu parent CHẤP NHẬN #88 (n 35/36) rồi #90: n ứng viên **35/36 → 36/37** (số học nối tiếp T2-176; T7 chỉ ghi số học, T2-177 tính chính thức). n chính thức GIỮ 14.
- **Sleep của T7 bị giết theo #90** (xem F-176-T7-1): sleep 1200 s spawn 07:02:49Z, chết sau ~482 s lúc ~07:10:50Z; T7 phát hiện boot mới trong 37 s, 0 số liệu mất, 0 số sai.
- **INSIDE #90 + FULL136 + POSTBOOT_PASS #90 + #90 có giết holder không: thuộc T2-177 / T5-177 / T6-177.** T7 không tự tính INSIDE/CERT/FULL. T9-176 ghi cửa sổ thoáng #90 quan sát được (30.001 lúc boot+53s) + sampler khởi động lại trong ~51 s.

### 2.5 Slot HB/DR trong cửa 05:41Z → 08:21Z 23/11 — HB 6/6 (toàn −316 s) + DR 3/3 (toàn 0 s); CỬA LÀNH LẦN HAI LIÊN TIẾP

Cửa kiểm ~2h40' (11 lần đọc DB).

**Heartbeat (lưới :20:50/:50:50Z): 6/6 có, 0 thiếu mới, 0 muộn mới.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 12:20:50 (05:20:50Z) | cc34a566 | 05:15:34 | **−316 s** | CÓ |
| 12:50:50 (05:50:50Z) | 97fe9df8 | 05:45:34 | **−316 s** | CÓ |
| 13:20:50 (06:20:50Z) | c8381d06 | 06:15:34 | **−316 s** | CÓ |
| 13:50:50 (06:50:50Z) | b3c20469 | 06:45:34 | **−316 s** | CÓ |
| 14:20:50 (07:20:50Z) | 91f08e37 | 07:15:34 | **−316 s** | CÓ |
| 14:50:50 (07:50:50Z) | f1ea247b | 07:45:34 | **−316 s** | CÓ |

- Cả 6 slot đều `succeeded`, attempt=1, error_text=null, finished cùng giây started. **Toàn −316 s — KHÔNG có ngoại lệ.** 0 muộn mới — muộn HB lũy kế GIỮ 9 (đợt thứ mười lăm liên tiếp vắng muộn mới).
- HB 05:20:50Z + 05:50:50Z dispatch trên boot #89 (sau btime #89 49m08s / 1h19m08s); HB 06:20:50Z + 06:50:50Z dispatch trên boot #89; HB 07:20:50Z + 07:50:50Z dispatch trên boot #90 (sau btime #90 5m05s / 35m05s).

**Deterministic-doctor (lưới :00:00Z): 3/3 có — DR 06:00Z CÓ.**

| Slot (+07) | run_id | started (Z) | Jitter | Kết quả |
|---|---|---|---|---|
| 13:00 (06:00Z) | bf494843 | 06:00:00 | 0 s | CÓ |
| 14:00 (07:00Z) | 5fb03d4d | 07:00:00 | 0 s | CÓ |
| 15:00 (08:00Z) | b05dfb80 | 08:00:00 | 0 s | CÓ |

- 3 slot có đều `succeeded`, attempt=1, error_text=null, jitter 0 s, finished cùng giây started.
- **DR 06:00Z CÓ, đúng giờ** — khác DR 23:00Z đợt 174 (không bao giờ xuất hiện sau 8 lần kiểm; slot mất hẳn trong cửa sổ recovery sau #85). DR 06:00Z dispatch 06:00:00Z trên boot #89, 1h10m29s TRƯỚC btime #90 — không bị #90 chạm. DR 08:00Z dispatch trên boot #90, 49m31s sau btime #90.
- **Cửa slot đợt 176 LÀNH (HB 6/6 + DR 3/3 — 0 thiếu, 0 muộn). Lần thứ hai liên tiếp cửa lành hoàn toàn (đợt 175 + 176)** — sau chuỗi cửa lành 11 đợt 162–172 đã dứt ở đợt 173.

### 2.6 Đối chiếu chéo các luồng đợt 176 (chỉ ghi nhận)

- **T0-176** (cờ 05:52Z): **#87 + #88 + #89 XÁC NHẬN 9 nguồn** (nợ đợt 175 đã trả + #89; marker sống qua **41 reboot #49–#89**); gap #88→#89 = 1.329 s — KHỚP T7; run 175 SUCCEEDED 05:24:21Z, margin +690 s, 8 event, 2 lần viết lại — KHỚP T7; **claimed→finished 88 s ≥ 60 s (F-176-T0-3 — KHỚP T7; T0 giao T7-176 phán số thứ tự ca)**; (m) #89: 0 requeue cửa hẹp lẫn cửa rộng, 0 run sống — KHỚP T7; **O8 trên #89 PASS 3/3** (05:43:33–05:47:10Z); **POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z** (T5-176). T0-176 đóng TRƯỚC #90 — **#90 chờ T0-177 xác minh 9 nguồn**.
- **T1-176** (cờ 05:54Z): **verify đợt 175: PASS** — đợt 175 = 10/14/14/13; lũy kế 111–175 = 638/1.120/972/794; chờ push 166–175 = 100/141/132/130 — **KHỚP từng số quyết parent (q) §12.3 đợt 175**; suite **28/28 exit 0 trên boot 15618ce8**; npm test 12 pass; 0 file thiếu; 9/9 cờ đợt 175 có nội dung.
- **T2-176** (cờ 06:20Z): **(m) #88 DƯƠNG (CUỐI cấp T2)** — requeue +33,431 s — KHỚP T7-175 từng số; **(m) #89 ÂM** — 0 requeue — KHỚP T7; **INSIDE #88 TRUE (FULL134) — chuỗi dài 7**; INSIDE #89 sơ bộ FALSE (FULL135) — chuỗi 7 ĐỨT tại #89 → 0 (phân loại cuối thuộc T2-177); n ứng viên 34/35 → 35/36 nếu #88 được chấp nhận; **mù #88? VẪN MỞ** (hole-recheck lần 20: 337 hit, 0 mới); **(m) #56 VẪN CÓ ĐIỀU KIỆN lần 19**.
- **T4-176** (cờ 06:11Z): **lượt yên #45: CÓ LƯỢT HỢP LỆ** — attempt2-15618ce8 20/20, B 5/5, tickCost median 46,0 ms — **chuỗi lượt yên hợp lệ 38 → 39** (ngân sách 2/3; attempt1 wedged pass 15). 0 vi phạm luật script nặng (theo T4/T9 — chuỗi vi phạm 2 đợt đứt).
- **T5-176** (cờ 05:48Z): **POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z** (boot+15m53s, **replay-đầy-đủ 170/170, poll=0** — cờ replay-đầy-đủ thứ hai liên tiếp sau #86, KHÔNG caveat repair); replay #89 đầy đủ (dpkg 1545 dòng, 50 transaction 05:36:07–05:37:44Z, term.log 0 lỗi); F-174-T5-6 KHÔNG lặp lại lần thứ hai liên tiếp; **#87/#88 CHƯA CÓ cờ — KHÔNG bù được** (tổng boot không cờ 16 → 18); watcher-175 CHẾT theo #87 (poll cuối 03:06:12Z, +7 s sau btime #87 — overlap thứ bảy, F-176-T5-1); khoảng không-watcher 9.367 s; F-175-T5-3 ĐÃ SỬA trong script repo. Lưu ý: T5 viết "số hiệu #89 CHƯA XÁC NHẬN — chờ T0-176" (viết trước khi T0 đóng cờ 05:52Z — nay T0 ĐÃ XÁC NHẬN).
- **T6-176** (cờ 06:00Z): **(A) 120/120 lần thứ 26** (tổng 3.120/3.120); **#87/#88/#89 KHÔNG giết holder** (lock trống 19m48s / 59m08s / 1h21m17s trước btime — chuỗi "không giết holder" từ #69: **18 → 21 reboot**); **prune lần 51: xóa 2 file**, queue 102 → 100 file; watcher KHÔNG lệch (7604 = replay-watch-176.sh T5, 7754 = b2-watcher.sh T9); X11: 3 socket X193/X194/X195 tạo 05:50Z (trở lại như đợt 172–175).
- **T8-176** (cờ 06:39Z): **harness 6/6 SẠCH, 0 kẹt** (06:16:15–06:31:34Z, boot #89); 86n2-P1 KHÔNG tái diễn; **kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1**; P4-lần3 PASS lần thứ năm liên tiếp; (f') V1 live 0 kích hoạt (0 FP, 0 kẹt để bỏ lỡ); **O8 T8 PASS 3/3 trên #89** (WebKit 21/21 ×2 pid 73002 md5 a533aba9 + pid 73388 md5 324ee0c8; Chromium 21/21 pid 73764 md5 eabc8684) — **CÙNG BOOT bộ T0** (pid 27289/47727/53755, md5 c5cb621a/943e3caf/16671297); **ĐỀ XUẤT chuỗi WebKit FULL PASS LÊN 26** (4 chân cùng boot #89 + gate (a) có cờ T5 thật + harness sạch — parent/T10 quyết cuối); checklist (o) thuộc T8-176/T10-176.
- **T9-176: LIMITS đã có trên đĩa (51.699 B lúc T7 đọc 07:52Z; T10 ghi đã trim còn 46.293 B — VẪN VƯỢT giới hạn push 37.768 B) NHƯNG cờ .done CHƯA CÓ lúc T7 đọc #10 — xem F-176-T7-3 (ĐÃ HẾT: T10 xác nhận cờ T9 có mặt 07:55:22Z, viết lại 08:01:23Z, byte-identical md5 0c89d672).** Nội dung LIMITS T9 (đọc trực tiếp): headroom 0 lúc đóng (14 lần đo: 12×0, 2×30.001; trần 63.747), dưới ngưỡng lần thứ 36; **cửa sổ thoáng lần thứ 5 liên tiếp** (30.001, 30.001 lúc boot+53s trên #90, chênh 0; về 0 lúc boot+243s); **E-188/E-189/E-190 ĐỀU KẾT THÚC; E-191–E-195 MỚI, E-195 ĐANG GHIM; tổng ghim 37/123 (30,1%)**; RAM 123 mẫu: min 407.580 / max 3.052.340 / mean 1.022.359,4 kB, gate A 46/123; **birefnet 0 lần thử, lần thứ 30**; B2: 15 spike thật, 13/15 quy driver, max load1 10,44; **ENOSPC 86 dòng trực tiếp (≈111 ngoại suy) — đợt thứ 25 liên tiếp**; reboot #90 giữa phiên (sampler khởi động lại trong ~51 s, bắt được cửa sổ thoáng boot+53s; mẫu cuối #89 lúc 07:10:23Z — 6 s TRƯỚC btime, KHÔNG overlap).

## 3. Ghi chú phương pháp

1. Nguồn: `scheduler.job_runs` + `scheduler.events` qua muse.db (HB/DR theo slot, vcut run 175/176 đầy đủ; events lọc theo run_id; requeue theo cửa hẹp [btime, btime+19m] #89 + #90 — cả hai đã khép hẳn lúc đóng; runs spanning btime — cả lọc và không lọc). Job IDs đã xác minh: heartbeat / deterministic-doctor / vcut-build-loop.
2. Caveat giữ nguyên đợt 125: `history_may_be_truncated=true` — "thiếu" = thiếu trong lịch sử API trả về. (Đợt này 0 slot thiếu — HB 6/6 + DR 3/3 đều có trong DB tươi.)
3. Jitter tính bằng `started_at_utc − scheduled_for_utc` (giây) — MỌI phép đổi epoch ↔ giờ và mọi phép trừ epoch đều kiểm lại bằng `date -u` từ epoch thô hoặc script trước khi ghi (bài học F-146/F-147/F-148-T7-1 + F-162-T7-1 + F-169-T7-2 + F-170-T7-1 + F-171-T7-1 + **F-176-T7-2**: epoch slot luôn kiểm bằng `date -u` TRƯỚC khi truy vấn — đợt này 1 lần truy vấn sai epoch do gõ nháp, đã bắt và sửa trước khi kết luận, 0 số sai vào verdict). Số giây requeue lấy từ `created_at` timestamptz trực tiếp, không qua extract-epoch làm tròn. **Quy tắc đứng từ đợt 157 (§3.3): dải (m) 33–49,8 s định nghĩa theo offset btime-tương đối.** Btime #89/#90 đều là số nguyên từ /proc/stat (quy ước đứng); caveat boot_est phân số ghi riêng ở §2.3/§2.4 — T7 KHÔNG tự đổi quy ước giữa chừng. Spanning #89/#90 = 0 theo truy vấn là ARTIFACT viết-lại-tự-loại; verdict (m) dựa trên EVENTS + REQUEUE.
4. Cửa kiểm đợt này ~2h40' (05:41Z → 08:21Z 23/11), đủ 6 slot HB + 3 slot DR + run vcut 175 (kết cục) và 176 (theo dõi + viết lại tại #90). Mười một lần đọc DB đầy đủ (đọc #1–#11); run 175 được đọc đầy đủ 2 lần khớp hoàn toàn nhau ở mọi trường (đọc #1 + events) + T0-176 đối chiếu khớp; run 176 được đọc đầy đủ 11 lần (started_at đổi đúng 1 lần tại đọc #7, claimed_at không đổi lần nào).
5. Quy ước đếm slot theo `scheduled_for` ≤ thời điểm kiểm cuối; slot HB 05:20:50Z + DR 06:00Z thuộc cửa 176 (sau kiểm cuối T7-175 lúc ~05:11Z). HB 08:20:50Z + DR 09:00Z (ngày 23/11) thuộc cửa T7-177.
6. **1 sleep bị SIGTERM giết trong phiên này** (sleep #6 spawn 07:02:49Z, chết sau ~482 s do #90 — F-176-T7-1); 9/10 sleep hoàn thành; ghi `date -u` trước mỗi lần spawn (bài học F-161-T7-2). **Boot ĐỔI 1 lần trong phiên** (15618ce8 → 94247dfa tại #90; #89 đã xảy ra trước khi lượt mở) — T7 phát hiện #90 trong vòng 37 s sau btime và xác minh 9 nguồn ngay; boot lúc đóng vẫn 94247dfa.
7. T7 đóng cờ ~08:2xZ — trễ ~20' so với hạn cờ ~08:00Z (để kiểm DR 08:00Z + HB 07:50:50Z + xác minh 9 nguồn cho #90 + viết LIMITS — cùng mẫu T7-175 trễ ~11' do #88), trong hạn cứng ~08:30Z. T7 không bỏ slot nào trong cửa. **T10-176 đã đóng sổ ~08:14Z TRƯỚC T7** (aggregate §7 dựa trên NOTES.md T7 đọc #1–#10; LIMITS này gộp muộn theo tiền lệ + bổ sung DR 08:00Z, đọc #11 và đính chính F-176-T7-5). DR 09:00Z + HB 08:20:50Z thuộc cửa T7-177.
8. **Phụ lục số liệu (§6) viết bằng script** `appendix176.py` trích từ epoch thô (bài học đứng từ T9-151: phụ lục chỉ viết bằng script, không gõ tay). Tuổi run 176 trong NOTES có sai số +600 s ở đọc #8/#9/#10 (xem F-176-T7-5) — LIMITS chỉ dùng số từ appendix176.txt.

## 4. Cập nhật lũy kế (nối tiếp đợt 175, cùng phương pháp)

- Heartbeat: 44/441 → **44/447 slot thiếu** (cửa sổ 14/11 07:50:50 → 23/11 14:50:50 +07). Kiểm toán cửa sổ: 441 + 6 slot mới = 447 ✓. Số thiếu +0 (0 muộn mới, 0 thiếu mới).
- Deterministic-doctor: 51/293 → **51/296 slot thiếu** (cửa sổ 11/11 09:00 → 23/11 15:00 +07). Kiểm toán: 293 + 3 = 296 ✓. Số thiếu +0 (0 thiếu mới).
- Tỉ lệ thiếu lũy kế: HB 44/447 = 9,8% (giảm từ 10,0% — 0 thiếu mới); DR 51/296 = 17,2% (giảm từ 17,4% — 0 thiếu mới).
- Mẫu muộn HB lũy kế: **GIỮ 9 lần** (+887 s ×6, +889 s, +891 s, +888 s đợt 161; kỷ lục +1.252 s đợt 129) — 0 muộn mới đợt này (đợt thứ mười lăm liên tiếp vắng muộn mới).

## 5. Giới hạn trung thực / nợ mở / cần parent quyết

1. **Kết cục run 175: SUCCEEDED theo hồ sơ daemon (wall gốc 10.110 s, margin +690 s theo cả hai cách tính)** — đọc #1 + events đầy đủ (8 event, 0 event sau succeeded eid 10315) + T0-176 đối chiếu khớp. 2 lần viết lại tại #87/#88; claimed→finished 88 s (claimed đổi thành finished − 88 s lúc cuối — cùng mẫu run 171/172/173/174 nhưng cf khác hẳn). **CA ≥60 s THỨ CHÍN — số ca 8 → 9** (156/159/164/166/167/170/171/172/175); run 172 vẫn là ca thứ tám.
2. **Run 176 vẫn RUNNING lúc T7 đóng cờ** (tuổi gốc 9.964 s, còn 836 s tới hạn ngân sách 08:35:51Z; viết lại ×1 tại #90) — kết cục thuộc T7-177. **Claimed_at run 176 vẫn giữ nguyên (05:35:51Z) lúc đóng** — T7-177 kiểm claimed→finished cuối cùng khi run có kết cục. **Jitter run 176 = 0 s** (chuỗi jitter 0 s: run 175 → 176).
3. **Reboot #89 (btime 05:26:26Z, boot 15618ce8): TRƯỚC KHI MỞ PHIÊN, giờ thật, T0-176 XÁC NHẬN 9 nguồn.** Gap #88→#89 = 1.329 s (ngắn nhất chuỗi gần đây). Số hiệu #89 ĐÃ ĐƯỢC T0-176 xác nhận (không còn chờ). **(m) #89: ÂM** (T2-176 phân loại CUỐI cấp T2: 0 requeue, 0 run sống — KHỚP T7 từng số). **INSIDE #89 (sơ bộ): FALSE (FULL135)** — chuỗi dài 7 ĐỨT tại #89 → 0 (phân loại cuối thuộc T2-177). Marker sống qua 41 reboot #49–#89.
4. **Reboot #90 (btime 07:10:29Z, boot 94247dfa): GIỮA PHIÊN, giờ thật, T7 xác minh 9 nguồn.** Gap #89→#90 = 6.243 s. Số hiệu #90 theo đếm tuần tự — **CHỜ T0-177 xác minh 9 nguồn**. **Điểm (m) #90: DƯƠNG ỨNG VIÊN (sơ bộ, lean T7)** — requeue +35,313 s TRONG dải, **cách biên DƯỚI 2,313 s**; 1 run sống tại btime + 1 requeue duy nhất cửa hẹp (đã khép — đếm cuối); T2-177 phân loại cuối + parent 177. **INSIDE #90 + FULL136 thuộc T2-177.**
5. **Điểm (m) #88: T2-176 phán CUỐI — DƯƠNG** (requeue +33,431 s; boot_est #88 chưa có ước lượng điểm — caveat phân số F-176-T0-4: DƯƠNG ⟺ boot_est−btime ≤ 0,431 s). **Parent quyết cuối đợt 176.** (m) #86/#87: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 175 — KHÔNG mở lại. (m) #84/#85: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 174 — KHÔNG mở lại. (m) #82: DƯƠNG — parent ĐÃ CHẤP NHẬN đợt 173 — KHÔNG mở lại. (m) #83: KHÔNG PHẢI ĐIỂM — parent ĐÃ CHẤP NHẬN đợt 173 — KHÔNG mở lại.
6. **#56 VẪN CÓ ĐIỀU KIỆN** (T2-176 không thu hẹp được cửa lần thứ mười chín — xem LIMITS T2-176) — chờ parent chốt J. T2-177 tiếp tục thu hẹp cửa.
7. **Cửa slot: HB 6/6 + DR 3/3 — CỬA LÀNH, lần thứ hai liên tiếp (175 + 176).** Lũy kế: HB 44/447, DR 51/296. Muộn HB lũy kế GIỮ 9. **Jitter run vcut 0 s (run 175 + run 176) — chuỗi jitter 0 s 2 run liên tiếp.** Toàn bộ 6 slot HB đều −316 s; 3 slot DR có đều 0 s. **DR 06:00Z CÓ, đúng giờ** (khác DR 23:00Z đợt 174 không bao giờ xuất hiện).
8. **F-176-T7-1 — Sleep #6 bị SIGTERM theo reboot #90** (cùng mẫu F-174-T7-1/F-175-T7-1): sleep 1200 s spawn 07:02:49Z, chết sau ~482 s lúc ~07:10:50Z; T7 phát hiện boot mới trong 37 s, 0 số sai. Đợt 176 có 1 sleep bị giết (đợt 175 có 2).
9. **F-176-T7-2 — Epoch HB 05:20:50Z gõ nháp sai ở lần truy vấn đầu** (1795412450 = 05:40:50Z, không phải slot — DB trả 0 dòng); T7 bắt lỗi nhờ kiểm `date -u` và sửa thành 1795411250 trước khi kết luận (HB 05:20:50Z CÓ — run cc34a566, jitter −316 s). 0 số sai vào verdict. Bài học: kiểm epoch bằng `date -u` TRƯỚC mọi truy vấn slot (đã là quy tắc đứng — lần này quy tắc đã cứu).
10. **F-176-T7-3 — Cờ round176-t9.done CHƯA CÓ trên đĩa lúc T7 đọc #10 (07:52:27Z) dù LIMITS T9 đã có (51.699 B, mtime 07:51Z). ĐÃ HẾT** (T10-176 xác nhận: cờ T9 có mặt 07:55:22Z, viết lại 08:01:23Z, byte-identical md5 0c89d672; cờ T10 đóng 08:14Z). Cùng mẫu F-175-T7-3.
11. **F-176-T7-4 — Lỗi nhãn nhỏ trong LIMITS T9-176:** ghi "#90 chờ T0-176 xác minh"; thực ra T0-176 đã đóng cờ 05:52Z, TRƯỚC #90 (07:10:29Z), nên xác minh số hiệu #90 thuộc T0-177, không phải T0-176. Không ảnh hưởng số đo. Thuộc T10-176 (T10 đã ghi nhận trong aggregate).
12. **F-176-T7-5 — ĐÍNH CHÍNH tuổi run 176 ở đọc #8/#9/#10 trong NOTES.md của T7 (cộng thừa 600 s khi tính tay):** đọc #8 đúng 6.349 s (NOTES ghi 6.949 s), đọc #9 đúng 6.958 s (NOTES ghi 7.558 s), đọc #10 đúng 8.192 s (NOTES ghi 8.792 s); còn tới hạn đúng 4.451 / 3.842 / 2.608 s (NOTES ghi 3.851 / 3.242 / 2.008 s). Aggregate 176 §7 đã sao lại số sai ở đọc #10 — T10-177/parent lưu ý khi trích số. Số đúng lấy từ script appendix176.py (epoch thô). Verdict `running` + jitter 0 s + viết lại ×1 KHÔNG đổi.
13. **Mù #96? (#64) VẪN MỞ** theo T2-176 (hole-recheck lần 20: 337 hit, 0 mới). **Mù #95? (#63) MỞ** (quyết (b) đợt 163). **Mù #94? (#62) MỞ** (quyết (b) đợt 162). **Mù #88? VẪN MỞ** (hole-recheck lần thứ hai mươi); **mù #77? VẪN MỞ** (T7 không chứng nhận mù nào). CERT/FULL chính thức GIỮ 76/91 (INSIDE #88 TRUE → chuỗi dài 7; INSIDE #89 sơ bộ FALSE — chuỗi ĐỨT, phân loại cuối thuộc T2-177).
14. **INSIDE #88 TRUE (FULL134) — chuỗi dài 7; INSIDE #89 (sơ bộ) FALSE (FULL135) — chuỗi 7 ĐỨT tại #89 → 0** (T2-176; FULL134 nói NGOÀI ở #89 theo hướng ngược — hai dải MÂU THUẪN ngược hướng; dải phương pháp chi phối theo F-165-T2-1). **INSIDE #90 + FULL136: thuộc T2-177.**
15. **POSTBOOT_PASS #89 ĐÃ CÓ 05:42:19Z (T5-176, replay-đầy-đủ 170/170, poll=0 — KHÔNG caveat repair, cờ replay-đầy-đủ thứ hai liên tiếp sau #86)** — chờ parent quyết có được tính cho gate (a) không. **POSTBOOT_PASS #86 VẪN CÓ, còn hiệu lực** (parent đã chấp nhận (c) đợt 175). **POSTBOOT_PASS #87/#88 CHƯA CÓ — KHÔNG bù được** (tổng boot không cờ 16 → 18). **POSTBOOT_PASS #90 thuộc T5-177.** Marker sống qua 41 reboot #49–#89 (T0-176 đếm độc lập 41); sống qua #90 chưa đếm — giao T0-177.
16. **O8 chuỗi WebKit FULL PASS: T8-176 ĐỀ XUẤT LÊN 26** (4 chân cùng boot #89 + gate (a) có cờ T5 thật + harness sạch — parent quyết cuối). Lượt yên #45 CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ 38 → 39 (T4-176). Harness 6/6 sạch, kẹt cộng dồn GIỮ 21; chuỗi "P3 không kẹt" 0 → 1 (T8-176). **#87/#88/#89 KHÔNG giết holder — chuỗi từ #69 lên 21 reboot** (T6-176; (A) 120/120 lần thứ 26 + prune lần 51 xóa 2 file). **#90 có giết holder không — thuộc T6-177.**
17. **T7 đóng cờ ~08:2xZ — trễ ~20' so với hạn cờ ~08:00Z** (để kiểm DR 08:00Z + HB 07:50:50Z + xác minh 9 nguồn cho #90 + viết LIMITS — cùng mẫu T7-175 trễ ~11' do #88), trong hạn cứng ~08:30Z. T7 không bỏ slot nào trong cửa. **T10-176 đã đóng sổ ~08:14Z TRƯỚC T7** — LIMITS này gộp muộn theo tiền lệ; đếm cuối §10.3 của aggregate tính theo trạng thái đĩa lúc T10 đóng (8 batch luồng + closing — chưa gồm batch T7); batch T7 (LIMITS này, 1 entry) thuộc đợt 176 nhưng đếm gộp muộn — T1-177/T10-177 kiểm lại khi verify đợt 176.
18. **Harness 6/6 sạch + (1c')/(f') + 84l10 + H3 + headroom + ENOSPC + birefnet: xem LIMITS T8-176/T9-176.** T9-176: headroom 0 lúc đóng; cửa sổ thoáng lần thứ 5 liên tiếp (172–176); E-188/E-189/E-190 đều kết thúc, E-191–E-195 mới, E-195 đang ghim, tổng ghim 37/123 (30,1%); ENOSPC 86 dòng — đợt thứ 25; birefnet 0 lần thử lần thứ 30.

## 6. Phụ lục — số liệu từ script `appendix176.py` (epoch thô, không gõ tay)

Xem `~/workspace/repo-1/hidden_files/round176-t7/appendix176.txt` (chạy từ `appendix176.py` cùng thư mục). Tóm tắt các số đã kiểm:

- Run 175 SUCCEEDED 05:24:21Z, wall gốc 10.110 s, margin +690 s (cả hai cách tính, jitter 0 s), cf 88 s — CA THỨ CHÍN, 8 event, 2 lần viết lại.
- Run 176 jitter 0 s, viết lại ×1 (#90), tuổi gốc 9.964 s lúc 08:21:55Z (còn 836 s tới hạn).
- Reboot #89: btime 05:26:26Z, gap 1.329 s, 0 requeue (m) ÂM. Reboot #90: btime 07:10:29Z, gap 6.243 s, requeue +35,313 s (m) DƯƠNG ỨNG VIÊN.
- HB 6/6 toàn −316 s; DR 3/3 toàn 0 s; lũy kế HB 44/447, DR 51/296; cửa LÀNH lần thứ hai liên tiếp.
