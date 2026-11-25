# LIMITS — Phase 9 đợt 169, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi ba liên tiếp; headroom 2 lúc đóng, dưới ngưỡng lần thứ 29 liên tiếp; CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC LẦN THỨ HAI LIÊN TIẾP; balloon E-172 MỚI 3 mẫu ĐÃ KẾT THÚC + E-173 MỚI 57 mẫu ĐANG GHIM — TÁCH vì sag sâu + gate A mở 10 lần; E-171 KẾT THÚC GIỮ 12 mẫu; ENOSPC ≥54 dòng (cận dưới); REBOOT #78 GIỮA PHIÊN + #77 TRƯỚC KHI MỞ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2 lúc đóng (14 lần đo hợp lệ: 8 lần 0, 6 lần 2), dưới ngưỡng < ~1.800 lần thứ hai mươi chín liên tiếp** — giá trị ổn định cuối phiên là **2** (đợt 168: 2; đợt 167: 0; đợt 166: 6). Trần **63.747 trên cả hai boot #77 và #78**. Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT KHÔNG QUAN SÁT ĐƯỢC LẦN THỨ HAI LIÊN TIẾP (đợt 168 + đợt 169).** Trên boot #78 (btime 09:14:38Z, GIỮA phiên): probe cửa sổ lúc boot+91s đã là **0, 0**; ENOSPC-count trên #78 vẫn 0 lúc đó, lên 19 lúc 09:42:31Z. Trên boot #77 (btime 08:23:52Z, TRƯỚC khi đợt mở): ENOSPC đầu tiên lúc 08:37:11Z (boot+799s) — trước khi T9 mở; probe mở 08:44:16Z (boot+1224s) đã là 0. Xem §1.2, F-169-T9-1.
- **Balloon — E-172 MỚI (3 mẫu, 1 chuỗi, 0 sag, ĐÃ KẾT THÚC) + E-173 MỚI (57 mẫu, 1 chuỗi, 0 sag, ĐANG GHIM lúc đóng):** **E-172: 09:28:09–09:30:09Z, 3 mẫu ghim LIÊN TIẾP, boot #78**, đứt QUAN SÁT ĐƯỢC (sag bắt đầu 09:31:09Z, balloon xả xuống 5.526.320 kB). **Sag 09:31:09–09:57:10Z, 27 mẫu — SÂU (balloon tối thiểu 5.045.740 kB = 78,3% trần) + gate A MỞ 10/27 mẫu** → KHÔNG áp dụng quy tắc "không tách" (mẫu T10-166: dip nông + gate A không mở trong dip mới không tách — cả hai điều kiện đều KHÔNG thỏa; đối chiếu E-169 đợt 167: 3 sag, balloon không dưới 89,9% trần, gate A đóng suốt 50 mẫu → 1 episode). **E-173: 09:58:10–10:54:11Z, 57 mẫu ghim LIÊN TIẾP, boot #78, ĐANG GHIM lúc đóng** — kết cục thuộc đợt sau. **E-171 KẾT THÚC — GIỮ 12 mẫu** (mẫu ghim cuối 07:54:32Z trên #76 đợt 168; quan sát đầu tiên trên #77 lúc 08:42:00Z balloon đã xả 5.876.448 kB = 91,2% trần — đứt không quan sát được, trong khoảng mù giữa hai đợt 2.867 s có reboot #77). **E-170 GIỮ 48 mẫu, E-169 GIỮ 20 mẫu.** **Tổng ghim đợt này 60/132 mẫu (45,5%).** Xem §2.2.
- **RAM:** sampler **132 mẫu, 08:42:19Z–10:54:11Z, HAI boot (#77: 33 mẫu; #78: 99 mẫu)**. Max **3.135.944 kB (2.990,7 MiB = 49,84% guard) lúc 08:59:20Z** trên #77 — **thấp hơn đợt 168 (52,03%)**; min **437.868 kB lúc 09:30:09Z** (mẫu ghim E-172 chuỗi 1) — **sâu hơn đợt 168 (414.364 kB)? KHÔNG — 437.868 > 414.364, trũng NÔNG hơn đợt 168 đúng 23.504 kB**; mean toàn phiên **988.986,6 kB — tính bằng 3 cách (python + awk 988.987 + trung bình có trọng số) KHỚP NHAU**. Gate A **42/132 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi ba liên tiếp.** Xem §2, §3.
- **B2: 9 spike THẬT (grep '^=== SPIKE' = grep không neo = 9), 9/9 QUY ĐƯỢC DRIVER CỤ THỂ, 0 load1 dư.** Bão mở đợt #77: 9 spike (08:46:45–08:51:27Z — T1 verify suite ffmpeg/mask_anim/testsrc2 + T4 attempt1 WebKit + script phân tích T4/T5 + T2 blind-investigate). **6 spike TRONG cửa sổ attempt1** (08:46:45–08:49:41Z — T4 attempt1 đã nhiễm, KHÔNG dùng verdict; xem F-169-T9-6: script analyze của chính T4 chạy TRONG cửa sổ attempt1, khác mẫu đợt 168 là chạy sau khi probe xong). **0 spike trong attempt2, attempt3, O8, harness, span ghim E-172/E-173.** 4 pid delta-miss (3 spike). Delta tick lớn nhất 135 tick/s (ffmpeg testsrc2 1920x1080, 08:51:27Z). Xem §2.5.
- **Lượt yên WebKit #38 (T4): CÓ LƯỢT HỢP LỆ — CHUỖI LÊN 33.** Attempt3-c44cc3ba (08:59:49–09:03:41Z): probe 20/20, lớp B 5/5, tickCost median 53,5 ≤ 60 — HỢP LỆ ở lần thử thứ ba trên boot #77. Sampler T9 đối chiếu: gate A MỞ 4/4 mẫu trong cửa sổ; load1 0,91–1,96; **0 spike B2 trong cửa sổ attempt3** (6 spike B2 đều trong attempt1 — lượt nhiễm). Poller 13 poll, 3 lần cửa mở. Xem §2.3.
- **REBOOT #78 GIỮA PHIÊN (e298bb52, btime 09:14:38Z; gap #77→#78 = 3.046 s) + REBOOT #77 TRƯỚC KHI ĐỢT MỞ (c44cc3ba, btime 08:23:52Z; gap #76→#77 = 3.089 s):** sampler + watcher + probe-loop **CHẾT theo reboot #78** (điểm yếu (d) đợt 148 tái diễn lần thứ bảy liên tiếp); T9 khởi động lại cả ba lúc 09:16:09Z (boot+91s) và bắt được cặp cửa sổ ở boot+91s — đã là 0, 0. Khoảng trống trong log sampler **109 s** (09:14:20Z → 09:16:09Z) — **1 gap >90 s (lần đầu kể từ đợt 163: 113 s)**; 0 gap >90 s nào khác (max 61 s). Mẫu sampler cuối #77 (09:14:20Z) TRƯỚC btime #78 18 s — **KHÔNG có mẫu overlap sau btime lần này** (khác đợt 168: mẫu cuối sau btime 14 s — overlap thứ sáu). Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #77 ≥30 dòng (cận dưới — journal mất theo reboot #78, KHÔNG cộng số ước) + #78 24 dòng = ≥54 dòng đếm được (cận dưới). Đợt thứ mười tám liên tiếp bảng watch cạn gây lỗi thật thấy được.** Trên #78 ENOSPC dừng sau 09:47:16Z trong khi headroom về 2 lúc đóng (cùng mẫu đợt 168: ENOSPC dừng, headroom 2). Xem §4.
- **T8-169 (đối chiếu): ĐÃ đóng cờ (~09:55Z)** — O8 PASS 3/3 trên boot #78 (09:30:06–09:32:46Z) NHƯNG **chuỗi WebKit FULL PASS GIỮ 21, KHÔNG LÊN 22** (lượt yên #38 hợp lệ ở boot CŨ #77, gate cho boot đo #78 KHÔNG FOUND); harness 6/6 + 0 kẹt; (1c') giữ nguyên, 0 FP. **T7-169 (đối chiếu): CHƯA đóng cờ lúc T9 đóng (10:58Z)** — run 169 vẫn running lúc 10:53:36Z (tuổi 8.265 s, còn 2.535 s tới hạn 11:35:51Z theo T7 NOTES). Xem §5.3/§5.4.
- **T5-169 (đối chiếu): POSTBOOT_PASS #77 ĐÃ CÓ 08:46:44Z (replay-đầy-đủ, poll=0); watcher-169 pid 25426 CHẾT theo reboot #78** (T9 xác minh pid đã mất lúc đóng — khởi động lại thuộc T5-170). Xem §5.2.
- **T2-169 (đối chiếu): (m) #77 KHÔNG PHẢI ĐIỂM; (m) #76 parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM (quyết (e) đợt 168) — chỉ ghi chú tham chiếu; run 168 SUCCEEDED 08:18:55Z, margin 1.016 s.** Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round169-t9/k8-headroom.py` (copy y nguyên từ đợt 168 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 169 (14 lần đo hợp lệ, 2 boot + 2 lần đo LỖI đường dẫn)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 08:43:24Z 22/11 | **LỖI** | #77 c44cc3ba | 63.747 | lần đo 1–2, LỖI `python3: can't open file '/home/hatch/k8-headroom.py'` — `cd && nohup ... &` chạy nền cả cụm nên thư mục làm việc không đổi (xem F-169-T9-1); ENOSPC-count=3; balloon 6.045.220 kB |
| 08:44:16Z 22/11 | **0** | #77 c44cc3ba | 63.747 | lần đo 1–2 (retry, boot+1224s); ENOSPC-count=4 (dòng đầu tiên trên #77 lúc 08:37:11Z = boot+799s); balloon 5.727.976 kB |
| 08:44:16Z 22/11 | **0** | #77 c44cc3ba | 63.747 | lần đo 2 (chênh **0**) |
| 09:14:14Z 22/11 | **0** | #77 c44cc3ba | 63.747 | lần đo 3–4, probe-loop lan-2 (vòng 1); ENOSPC-count=30 (dòng mới nhất 09:13:48Z); balloon 5.884.612 kB |
| 09:14:14Z 22/11 | **0** | #77 c44cc3ba | 63.747 | lần đo 4 (chênh **0**) |
| 09:16:09Z 22/11 | **0** | #78 e298bb52 (btime 09:14:38Z) | 63.747 | lần đo 5–6, cặp cửa sổ (boot+91s); **KHÔNG chạm CAP 30.000 — gặp ENOSPC ở 0**; RAM 1.705.152 kB, balloon 5.163.460 kB; ENOSPC-count=0 trên boot mới |
| 09:16:09Z 22/11 | **0** | #78 e298bb52 | 63.747 | lần đo 6, cặp cửa sổ (boot+91s; chênh **0**) |
| 09:46:09Z 22/11 | **0** | #78 e298bb52 | 63.747 | lần đo 7–8, probe-loop lan-2 (vòng 2); ENOSPC-count=23 (dòng mới nhất 09:46:06Z); balloon 5.257.000 kB |
| 09:46:09Z 22/11 | **0** | #78 e298bb52 | 63.747 | lần đo 8 (chênh **0**) |
| 10:16:09Z 22/11 | **2** | #78 e298bb52 | 63.747 | lần đo 9–10, probe-loop lan-3; ENOSPC-count=24 (dòng mới nhất 09:47:16Z — ENOSPC đã dừng); balloon ĐANG GHIM TRẦN (E-173), RAM 597.436 kB |
| 10:16:09Z 22/11 | **2** | #78 e298bb52 | 63.747 | lần đo 10 (chênh **0**) |
| 10:46:09Z 22/11 | **2** | #78 e298bb52 | 63.747 | lần đo 11–12, probe-loop lan-4; ENOSPC-count=24; balloon ĐANG GHIM TRẦN (E-173), RAM 540.644 kB |
| 10:46:09Z 22/11 | **2** | #78 e298bb52 | 63.747 | lần đo 12 (chênh **0**) |
| 10:54:29Z 22/11 | **2** | #78 e298bb52 | 63.747 | lần đo 13–14, đóng phiên; balloon ĐANG GHIM TRẦN (E-173), RAM 494.336 kB; ENOSPC-count=24 |
| 10:54:29Z 22/11 | **2** | #78 e298bb52 | 63.747 | lần đo 14 (chênh **0**) |

- Probe dừng ở `i=0` trong 8/14 lần đo hợp lệ; dừng ở `i=2` trong 6 lần đo cuối. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi lần đo).
- **Cửa sổ thoáng sau reboot: KHÔNG QUAN SÁT ĐƯỢC trên cả hai boot — LẦN THỨ HAI LIÊN TIẾP (đợt 168 + đợt 169).** Trên #77: ENOSPC đầu tiên 08:37:11Z (boot+799s) — trước khi T9 mở (T9 nhận việc ~08:41Z, sampler khởi động 08:42:19Z = boot+1147s); probe mở 08:44:16Z (boot+1224s) đã là 0. Trên #78: cặp cửa sổ lúc boot+91s đã là 0, 0 (T9 khởi động lại sau reboot #78 lúc boot+91s — lần đo đầu tiên ngay khi khởi động lại xong); ENOSPC-count trên #78 vẫn 0 lúc đó, lên 19 lúc 09:42:31Z. T9 ghi đúng mốc đo, không claim cửa sổ có mở hay không (chỉ biết: nếu có mở thì đã đóng trước boot+91s trên #78 và trước boot+799s trên #77). Xem F-169-T9-1.
- **Headroom cuối phiên: 2 (cặp đóng 10:54:29Z, chênh 0).** ENOSPC trên #78 dừng sau 09:47:16Z (24 dòng rồi im tới đóng) trong khi headroom về 2 — 2 slot trống có thể là lý do systemd ngừng lỗi (T9 ghi tương quan, không phán nhân quả — cùng mẫu đợt 168). Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 2 = **63.745 watch** trên #78.
- **So sánh với đợt 168:** đợt 168 mở 0 trên #75 (8 lần đo) → reboot #76 giữa phiên → 0 ngay từ boot+71s → 2 lúc đóng (13 lần đo, 11 lần 0, 2 lần 2). Đợt này mở 0 trên #77 (4 lần đo) → reboot #78 giữa phiên → **0 ngay từ boot+91s** → **2 lúc đóng** (14 lần đo hợp lệ, 8 lần 0, 6 lần 2). **Không lần nào chạm CAP 30.000 đợt này** (đợt 168: 0 lần chạm CAP; đợt 167: đỉnh cửa sổ 14.072, không chạm CAP; đợt 163–166: chạm CAP mỗi đợt).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **2 / 1.578 ≈ 0,001** — một vite mới (~1.578 watch) vẫn không khởi động được.
- T5-169 KHÔNG probe lại headroom đợt này (như đợt 151–168) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 14 lần đo hợp lệ + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal hai boot đợt này có ≥30 + 24 = ≥54 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI giữa hai boot đợt này: 63.747 trên cả #77 và #78** (đợt 168: 63.747 trên cả #75 và #76 — lần thứ năm liên tiếp hai boot có cùng trần). T9 chỉ ghi số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (494.336 kB — mẫu ghim E-173) THẤP hơn RAM lúc mở (939.136 kB — mẫu đầu #77) trong khi headroom 0 → 2. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop vòng 1 lan-3 (dự kiến ~09:44:14Z) KHÔNG chạy — probe-loop vòng 1 chết theo reboot #78 lúc 09:14:38Z; probe-loop MỚI (vòng 2, khởi động lại 09:16:09Z) có lan-2 09:46:09Z, lan-3 10:16:09Z, lan-4 10:46:09Z; cặp probe đóng 10:54:29Z thay thế lan-5 (dự kiến ~11:16:09Z — sau khi T9 đóng).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–168 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

| 124 | 4.438 | mở đợt 124 |
| 124 | 4.318 | (giá trị giữa chuỗi, xem §5 đợt 127) |
| 125 | 3.645 | |
| 126 | 3.451 → 3.434 | mở → cuối đợt 126 |
| 127 | 3.334 → 3.324 | mở → trạng thái ban đầu |
| 127 | 3.317 → 3.315 | mở trên boot mới → cuối lượt |
| 128 | 3.212 | đo 05:40:28Z, boot #74 (lần 2: 3.211) |
| 129 | 3.086 → 3.079 | đo 08:39:03Z → 08:40:47Z, boot #75 |
| 130 | 2.974 → 2.963 | đo 11:37:45Z → 11:39:54Z, boot mới btime 10:56:31Z |
| 131 | 2.846 → 2.846 | đo 14:42:07Z → 14:44:42Z, boot mới btime 14:26:41Z |
| 132 | 2.745 → 2.738 | đo 17:40:47Z → 17:42:07Z, boot mới btime 17:24:08Z |
| 133 | 2.632 → 2.632 | đo 20:40:32Z → 20:42:53Z, boot 07da9c50 btime 19:34:15Z |
| 134 | 2.515 → 2.505 | đo 23:45:29Z → 23:48:01Z, boot d2e66749 btime 23:26:58Z |
| 135 | 2.403 → 2.395 | đo 02:40:57Z → 02:43:11Z, boot 78b55878 btime 02:27:27Z |
| 136 | 2.286 → 2.281 | đo 05:41:01Z → 05:43:14Z, boot 1ca1feaa btime 05:29:18Z |
| 137 | 2.179 → 2.175 | đo 08:41:12Z → 08:43:35Z, boot 2104246b btime 08:07:11Z |
| 138 | 2.064 → 2.064 | đo 11:39:22Z → 11:39:31Z, boot 17db9652 btime 09:36:01Z |
| 139 | 1.954 → 1.954 | đo 14:41:18Z → 14:41:29Z, boot 1ca1feaa btime 13:53:41Z (đính chính T1-139 F-139-T1-1) |
| 140 | 1.840 → 1.840 | đo 17:38:54Z → 17:38:59Z, boot af558fb5 btime 15:54:37Z (cùng boot với vòng 2 đợt 139) |
| 141 | 1.739 → 1.739 | đo 20:40:21Z → 20:40:29Z, boot 2c0efe57 btime 19:54:12Z |
| 142 | 1.617 → 1.617 | đo ~23:40Z → 23:41:20Z, boot bde599df btime 22:48:05Z |
| 143 | 1.498 → 1.498 | đo 02:40:53Z → 02:41:01Z, boot 70a5b0fc btime 01:55:25Z |
| 144 | 1.296 → 1.295 | đo 05:39:17Z → 05:39:26Z, boot 691a7403 btime 03:55:45Z |
| 145 | 1.074 → 1.074 | đo 08:42:53Z → 08:42:57Z, boot e146ca67 btime 07:56:16Z |
| 146 | 880 → 880 | đo 11:37:51Z → 11:37:52Z, boot 98a7c93f btime 09:54:03Z |
| 147 | 668 → 668 | đo 14:42:51Z, boot 6fb582df btime 12:13:26Z |
| 148 | 554 → 446 | mở 17:40:27Z boot d8a11644 btime 17:27:53Z → đóng 19:36:35Z boot MỚI 1d610e56 btime 19:34:32Z (reboot giữa phiên) |
| 149 | 438 → 339 → 331 | mở 20:41:27Z boot 70025d3e btime 20:00:33Z → sau reboot #39 21:26:10Z boot MỚI 802f358f btime 21:23:51Z → đóng 22:42:09Z cùng boot 802f358f |
| 150 | 323 → 308 | mở 23:43:42Z → đóng 01:19:57Z, CÙNG boot e9295700 btime 23:32:09Z (reboot #40 TRƯỚC phiên, không reboot giữa phiên) |
| 151 | 194 → 90 | mở 02:40:42Z boot 2e430750 btime 01:25:51Z → đóng 04:52:32Z boot MỚI fad2aab9 btime 03:25:16Z (reboot #42 GIỮA phiên) |
| 152 | 82 → 0 | mở 05:39:00Z boot 18e179e0 btime 05:20:57Z → đóng 07:42:43Z boot MỚI c741f5e6 btime 07:04:11Z (reboot #44 GIỮA phiên; lần đo xác nhận thứ ba 07:43:11Z cũng 0) |
| 153 | 0 → 0 | mở 08:38:02Z boot 401fca75 btime 07:32:38Z → đóng 10:47:35Z boot MỚI 1450ac80 btime 09:04:49Z (reboot #46 GIỮA phiên; lần đo xác nhận thứ ba 10:47:44Z cũng 0) |
| 154 | 0 → 0 | mở 11:37:41Z boot #48 2c0a7985 btime 11:26:05Z → đóng 13:41:4xZ boot MỚI #49 12fc68a3 btime 13:05:12Z (reboot #49 GIỮA phiên; lần đo xác nhận thứ ba cũng 0) |
| 155 | 0 → 0 | mở 14:40:42Z boot #49 12fc68a3 btime 13:05:12Z → đóng 16:32:50Z boot MỚI #50 d849728b btime 15:04:07Z (reboot #50 GIỮA phiên; lần đo xác nhận thứ ba cũng 0) |
| 156 | 0 → 2 | mở 17:40:07Z boot #52 5353ed19 btime 17:19:09Z → đóng 19:56:34Z boot MỚI #55 c99a1045 btime 19:04:44Z (BA reboot giữa phiên; 4 lần đo đóng đều 2) |
| 157 | 0 → 0 | mở 20:43:59Z boot #56 348dab54 btime 19:32:47Z → đóng 22:48:34Z boot MỚI #57 bcbaa3ad btime 21:05:15Z (MỘT reboot giữa phiên; 4 lần đo đóng đều 0) |
| 158 | 0 → 0 | mở 23:40Z boot #58 28366bd0 btime 23:06:08Z → giữa phiên 01:35Z boot MỚI #59 eec65561 btime 01:33:47Z → đóng 01:54:51Z cùng boot #59 (MỘT reboot giữa phiên; 6 lần đo đều 0) |
| 159 | 0 → 0 | mở 02:39:58Z boot #59 eec65561 btime 01:33:47Z → sau reboot #60 03:07:33Z boot MỚI e590ae0a btime 03:05:59Z: THOÁNG 23.503 rồi 18.447 (boot+~95–100 s), về 0 lúc 03:08:27Z (boot+148 s) → đóng 04:55:08Z cùng boot #60 (MỘT reboot giữa phiên; 10 lần đo, 8 lần 0) |
| 160 | 0 → 2 | mở 05:40:07Z boot #61 52c957d5 btime 05:25:49Z: 0, 0 → giữa phiên 06:10:37Z: 2, 2 → đóng 07:51:23Z cùng boot #61: 2, 2 (KHÔNG reboot giữa phiên; 10 lần đo, 8 lần 2) |
| 161 | 0 → 0 → 2 | mở 08:37:38Z boot #62 39d46ba0 btime ghi 07:59:29Z: 0 ×8 (08:37:38–10:07:59Z) → sau reboot #63 10:30:42Z boot MỚI 94d22520: 0, 0 lúc boot+2m43s (10:33:25Z) → đóng 10:55:51Z cùng boot #63: 2, 2 (MỘT reboot giữa phiên; 12 lần đo, 10 lần 0, 2 lần 2) |
| 162 | 0 → 0 (thoáng 2 một lần) | mở 11:37:48Z boot #64 d9a8d1ce btime 11:15:18Z: 0, 2 (cặp mở) → 0 ×10 (12:08:03–13:55:56Z) → đóng 13:55:56Z cùng boot #64: 0, 0 (KHÔNG reboot giữa phiên; 12 lần đo, 11 lần 0, 1 lần 2 thoáng qua) |
| 163 | 0 → 30.001 (thoáng, boot+71s) → 2 | mở 14:40:24Z boot #65 1c1cf10c btime 14:34:57Z (trần 63.756): 0 ×6 (14:40:24–15:40:13Z) → sau reboot #66 16:06:45Z boot MỚI edb2acdb (trần 63.747): 30.001, 30.001 lúc boot+71s → 0, 0 lúc boot+110s/201s → 2 ×5 (16:11:36–16:52:45Z) → đóng 16:52:45Z cùng boot #66: 2, 2 (MỘT reboot giữa phiên; 15 lần đo, 8 lần 0, 2 lần 30.001, 5 lần 2) |
| 164 | 0 → 30.001 (thoáng, boot+81s) → 0 | mở 17:40:09Z boot #67 f1d4ce1a btime 17:33:27Z (trần 63.756): 0, 0 (17:40:09Z) → sau reboot #68 18:06:30Z boot MỚI 0c8a94aa (trần 63.747): 30.001, 30.001 lúc boot+81s → 0 ×3 (boot+112s/202s/212s) → 1, 2 lúc 18:37:49Z → 2, 2 lúc 19:07:49Z → 0 ×4 (19:37:49–19:53:55Z) → đóng 19:53:55Z cùng boot #68: 0, 0 (MỘT reboot giữa phiên; 15 lần đo, 9 lần 0, 1 lần 1, 3 lần 2, 2 lần 30.001) |
| 165 | 0 → 30.001 (thoáng, boot+63s) → 2 | mở 20:39:01Z boot #69 9a1a9319 btime 20:09:31Z (trần 63.747): 0 ×6 (20:39:01–21:38:51Z) → sau reboot #70 22:05:25Z boot MỚI d1ddd946 (trần 63.747): 30.001, 30.001 lúc boot+63s → 0 lúc boot+130s → 2 ×5 (boot+220s → boot+2776s) → đóng 22:51:41Z cùng boot #70: 2, 2 (MỘT reboot giữa phiên; 14 lần đo, 7 lần 0, 5 lần 2, 2 lần 30.001) |
| 166 | 0 → 30.001 (thoáng, boot+66s) → 6 | mở 23:39:01Z boot #70 d1ddd946 btime 22:05:25Z (trần 63.747): 0, 0 (23:39:01Z) → sau reboot #71 00:08:00Z boot MỚI ea73ac4f (trần 63.747): 30.001, 30.001 lúc boot+66s → 0 lúc boot+160s → 6 lúc boot+250s → 0, 0 lúc 00:39:04Z → 6 ×6 (01:09:04Z → 01:41:43Z) → đóng 01:41:43Z cùng boot #71: 6, 6 (MỘT reboot giữa phiên; 14 lần đo, 5 lần 0, 7 lần 6, 2 lần 30.001) |
| 167 | 0 → 14.072 → 8.708 (thoáng, boot+86s, đang đóng) → 0 | mở 02:39:46Z boot #73 b643911f btime 02:28:01Z (trần 63.747): 0 ×6 (02:39:46–03:38:33Z) → sau reboot #74 04:05:29Z boot MỚI 194efd93 (trần 63.747): 14.072, 8.708 lúc boot+86s → 0 lúc boot+180s → 0 ×4 (04:36:52–04:46:20Z) → đóng 04:46:20Z cùng boot #74: 0, 0 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 13 lần đo, 11 lần 0, 1 lần 14.072, 1 lần 8.708) |
| 168 | 0 → 0 (không quan sát được cửa sổ) → 2 | mở 05:40:51Z boot #75 576ca271 btime 05:32:46Z (trần 63.747): 0 ×8 (05:40:51–07:10:35Z) → sau reboot #76 07:32:23Z boot MỚI f2b97695 (trần 63.747): 0, 0 lúc boot+71s → 0 lúc boot+192s → 2, 2 lúc boot+1.348s → đóng 07:54:51Z cùng boot #76: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 13 lần đo, 11 lần 0, 2 lần 2; KHÔNG lần nào chạm CAP) |
| **169** | **0 → 0 (không quan sát được cửa sổ) → 2** | **mở 08:44:16Z boot #77 c44cc3ba btime 08:23:52Z (trần 63.747): 0 ×4 (08:44:16–09:14:14Z) → sau reboot #78 09:14:38Z boot MỚI e298bb52 (trần 63.747): 0, 0 lúc boot+91s → 0, 0 lúc boot+1920s → 2 ×6 (10:16:09–10:54:29Z) → đóng 10:54:29Z cùng boot #78: 2, 2 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 14 lần đo hợp lệ, 8 lần 0, 6 lần 2; KHÔNG lần nào chạm CAP; + 2 lần đo LỖI đường dẫn 08:43:24Z — xem F-169-T9-1)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0 → 2 → 2**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 2** (đợt 168 đóng 2; đợt 167 đóng 0; đợt 166 đóng 6). Từ đỉnh chuỗi 4.438 xuống 2 = **−4.436 (−99,95%)**.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 2, thấp hơn ngưỡng 1.800, lần thứ hai mươi chín liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 168 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal hai boot đợt này có ≥30 + 24 = ≥54 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười tám liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp; đợt 169: ≥54 dòng — T9 đếm trực tiếp, xem §4). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong từng boot** (63.747 trên #77 suốt 4 lần đo hợp lệ; 63.747 trên #78 suốt 10 lần đo hợp lệ) và **KHÔNG ĐỔI giữa hai boot** (63.747 = 63.747 — lần thứ năm liên tiếp hai boot có cùng trần). T9 ghi đúng số đo từng boot, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên cả #77 và #78 — xem ghi chú; swap 1.048.572 kB) — sampler 132 mẫu, 08:42:19Z–10:54:11Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở cả mẫu đầu #77 và lúc đóng trên #78 (KHÔNG chênh giữa hai boot — giống đợt 168; mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên RAM cao + balloon xả sâu → bão mở đợt (9 spike B2, load1 tới 7,90) → T4 attempt3 HỢP LỆ → REBOOT #78 cắt ngang → balloon leo lại tới trần → E-172 ghim ngắn 3 mẫu → sag sâu 27 mẫu (gate A mở 10 lần) → E-173 ghim dài 57 mẫu tới lúc đóng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log đóng băng 109 s (qua reboot #78 — xem §5.1); 1 gap >90 s; các gap còn lại max 61 s**). **132 mẫu, 08:42:19Z–10:54:11Z, HAI boot (#77: 33 mẫu; #78: 99 mẫu).** Tổng quan: **min 437.868 kB (427,6 MiB) lúc 09:30:09Z** (mẫu ghim E-172 chuỗi 1); **max 3.135.944 kB (2.990,7 MiB) lúc 08:59:20Z — 49,84% guard** (balloon xả 3.651.964 kB, trên #77); **mean toàn phiên 988.986,6 kB (965,8 MiB) — tính bằng 3 cách (python + awk 988.987 + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 08:42:19–09:14:20Z | #77 | 560.312–3.135.944 kB | Mở phiên: balloon 5.921.520 kB (91,9% trần) rồi xả sâu về 3.651.964 kB (56,7% trần) lúc 08:59:20Z (đỉnh RAM phiên) rồi leo lại; **0 mẫu ghim trên #77** (balloon cao nhất 6.045.220 kB = 93,8% trần lúc 08:43:19Z); **BÃO MỞ ĐỢT (9 spike B2, load1 tới 7,90 — xem §2.5)**; T4 attempt1 NHIỄM (08:44:34–08:49:53Z, median 103,0) + attempt2 vi phạm B4 (+1 dòng dpkg) + **attempt3 HỢP LỆ (08:59:49–09:03:41Z — xem §2.3)**; **RAM max trên #77 3.135.944 kB lúc 08:59:20Z** (49,84% guard); gate A MỞ 27/33 mẫu; load1 ≥3,0 ở 5/33 mẫu; reboot #78 cắt ngang lúc 09:14:38Z |
| 09:16:09–10:54:11Z | #78 | 437.868–1.704.408 kB | Boot mới: headroom 0 ngay từ boot+91s (xem §1.2); balloon leo từ 5.163.460 kB (80,2% trần) lên ghim lúc 09:28:09Z; **E-172: 3 mẫu ghim 09:28:09–09:30:09Z → sag sâu 27 mẫu 09:31:09–09:57:10Z (gate A mở 10 lần) → E-173: 57 mẫu ghim 09:58:10–10:54:11Z, ĐANG GHIM lúc đóng** (xem §2.2); **O8 PASS 3/3 (09:30:06–09:32:46Z) + harness 6/6 (09:33:01–09:48:31Z)** — cả hai đều trong sag E-172/E-173 (xem §2.5); **0 spike B2 trên #78**; gate A MỞ 15/99 mẫu; load1 ≥3,0 ở 0/99 mẫu (sampler); load1 max 2,26 |

- **Gate A ≥1024 MiB: 42/132 mẫu** (#77: 27/33; #78: 15/99); **0 mẫu ≥ guard**; load1 max (sampler) **7,90 lúc 08:49:19Z** (bão mở đợt #77, trong cửa sổ attempt1 — watcher bắt 7,87 lúc 08:49:06Z, xem §2.5); **5/132 mẫu load1 ≥3,0** (tất cả trên #77 trong bão mở đợt; 0 trên #78). **RAM <512.000 kB: 4 mẫu** (tất cả trên #78: 09:27:09Z 505.496 kB — ngay trước khi ghim E-172; 09:30:09Z 437.868 kB — mẫu ghim E-172; 09:36:10Z 511.420 kB — trong sag; 10:03:10Z 511.380 kB — mẫu ghim E-173); **RAM <300.000 kB: 0 mẫu** (đợt 168: 0 mẫu — giữ 0 lần thứ tư liên tiếp).
- Swap: SwapFree 786.312 kB (mẫu đầu) → 601.076 kB (thấp nhất phiên, lúc 09:35:10Z, trong sag) → 748.020 kB (mẫu cuối #78, 10:54:11Z). Nhịp nhảy SwapFree qua reboot #78: 687.624 kB (mẫu cuối trước reboot, 09:14:20Z) → 1.026.564 kB (mẫu đầu #78, 09:16:09Z) — swap được nhả ~338.940 kB qua reboot (đợt 168: 682.556 → 1.006.396 kB qua reboot #76).
- Mẫu 08:59:20Z (đỉnh phiên): RAM 3.135.944 kB, balloon xả 3.651.964 kB — balloon xả sâu nhất phiên đúng lúc T4 chuyển từ attempt2 (vi phạm B4) sang attempt3 (hợp lệ). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 437.868 kB (đợt 168: 414.364 kB; đợt 167: 383.116 kB; đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng NÔNG hơn đợt 168 đúng 23.504 kB** (437.868 > 414.364). 4 mẫu <512.000 kB trong 132 mẫu (3,0% — thấp hẳn đợt 168: 37,0%, vì đợt này ghim tập trung cuối phiên trên #78: E-172 3 mẫu + E-173 57 mẫu ghim lúc RAM 437–615.000 kB, nhưng chỉ 2/60 mẫu ghim dưới 512.000 kB); riêng trong span E-173 (57 mẫu ghim): 1/57 mẫu <512.000 kB (1,8% — 10:03:10Z 511.380 kB); trong span E-172 (3 mẫu): 1/3 mẫu <512.000 kB (33,3% — 09:30:09Z 437.868 kB).

**Bảng tổng hợp số RAM (từ script `t9-169-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 132 dòng — KHÔNG tính tay, đã đối chiếu lại từ log đóng băng lúc đóng cờ bằng script `t9-169-recheck.py` — RECHECK OK):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #77 c44cc3ba | 33 | 560.312 | 3.135.944 | 1.821.506,1 | 27/33 | 0 | 7,90 | 0 |
| #78 e298bb52 | 99 | 437.868 | 1.704.408 | 711.480,1 | 15/99 | 60 | 2,26 | 4 |
| **Toàn phiên** | **132** | **437.868** | **3.135.944** | **988.986,6** | **42/132** | **60/132 (45,5%)** | **7,90** | **4** |

- **Mean toàn phiên 988.986,6 kB — tính bằng 3 cách độc lập: python `sum/n = 988.986,6` VÀ awk `sum/n = 988.987` VÀ trung bình có trọng số từ mean từng boot: (33×1.821.506,1 + 99×711.480,1)/132 = 988.986,6 — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163). Mean từng boot cũng khớp python/awk từng số (xem §6 — script recheck assert cả hai mean từng boot qua tổng có trọng số).
- 4 mẫu RAM <512.000 kB (từ log đóng băng): 09:27:09Z 505.496 (ngay trước khi ghim E-172); 09:30:09Z 437.868 (mẫu ghim E-172); 09:36:10Z 511.420 (trong sag); 10:03:10Z 511.380 (mẫu ghim E-173).

### 2.2 Balloon virtio — E-172 MỚI (3 mẫu, 1 chuỗi, 0 sag, ĐÃ KẾT THÚC) + E-173 MỚI (57 mẫu, 1 chuỗi, 0 sag, ĐANG GHIM lúc đóng) + E-171 KẾT THÚC GIỮ 12 MẪU

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #77 (c44cc3ba): GHIM TRẦN 0/33 mẫu (0%) — KHÔNG có episode mới.** Balloon leo từ 5.921.520 kB (91,9% trần) lúc 08:42:19Z, xả sâu về 3.651.964 kB (56,7% trần) lúc 08:59:20Z, leo lại tới tối đa 6.045.220 kB (93,8% trần) lúc 08:43:19Z — **KHÔNG chạm trần lần nào**. E-171 (đợt 168, trên #76) đã kết thúc trước khi T9 mở (xem dưới).
- **Boot #78 (e298bb52): GHIM TRẦN 60/99 mẫu (60,6%), trong 2 chuỗi — 2 EPISODE MỚI (E-172 + E-173, TÁCH NHAU — xem phán dưới).**
  - Leo lên trần trên boot #78: từ 09:16:09Z (5.163.460 kB, 80,2% trần) lên ghim lúc 09:28:09Z trong ~12 phút.
  - **E-172 — chuỗi 1 (duy nhất): 09:28:09–09:30:09Z, 3 mẫu** (RAM 437.868–615.824 kB; gate A ĐÓNG cả 3 mẫu).
  - **E-172 ĐÃ KẾT THÚC — đứt QUAN SÁT ĐƯỢC:** mẫu sau 09:31:09Z balloon xả xuống 5.526.320 kB (85,8% trần), RAM nhảy lên 1.127.748 kB (gate A MỞ) — thời điểm đứt quan sát được chính xác tại mẫu 09:31:09Z (khác E-170/E-171: đứt trong khoảng mù reboot).
  - **Sag 09:31:09–09:57:10Z, 27 mẫu — SÂU:** balloon tụt khỏi trần xuống tối thiểu **5.045.740 kB (78,3% trần)** lúc 09:43:10Z rồi leo lại tới 6.360.812 kB (98,7% trần) lúc 09:57:10Z; **gate A MỞ 10/27 mẫu** (09:31:09Z 1.127.748; 09:34:10Z 1.349.384; 09:42:10Z 1.650.416; 09:43:10Z 1.052.192; 09:45:10Z 1.055.348; 09:49:10Z 1.698.216; 09:50:10Z 1.536.100; 09:51:10Z 1.351.884; 09:52:10Z 1.191.900; 09:53:10Z 1.052.944 — T9 liệt kê đủ 10 mốc để T10 kiểm lại).
  - **E-173 — chuỗi 1 (duy nhất tới lúc đóng): 09:58:10–10:54:11Z, 57 mẫu** (RAM 511.380–614.072 kB; gate A ĐÓNG cả 57 mẫu) — **không một sag nào; vẫn ghim lúc T9 đóng cờ**.
  - **E-173 ĐANG GHIM lúc đóng — kết cục thuộc đợt sau (T9-170).** T9 không claim E-173 sẽ kéo dài bao lâu hay đứt lúc nào.
  - **Tổng E-172 tới lúc kết thúc: 3 mẫu ghim / 1 chuỗi / 0 sag / 1 boot (#78). Tổng E-173 tới lúc đóng: 57 mẫu ghim / 1 chuỗi / 0 sag / 1 boot (#78).**
- **E-171 — KẾT CỤC: GIỮ 12 mẫu, KHÔNG cộng thêm.** E-171 ghim cuối 07:54:32Z trên #76 (đợt 168); khoảng mù giữa hai đợt **2.867 s (07:54:32Z → 08:42:19Z)** có **MỘT reboot (#77 btime 08:23:52Z)**. Balloon trên #77 lúc T9 mở (08:42:00Z) đã 5.876.448 kB (91,2% trần) và **KHÔNG chạm trần lần nào trong 33 mẫu trên #77** (tối đa 6.045.220 kB = 93,8% trần) — E-171 đã kết thúc trong khoảng mù (xem §2.2 đợt 168: E-171 đang ghim lúc đóng đợt 168). Thời điểm đứt thật nằm trong (07:54:32Z, 08:42:00Z] — T9 không claim cụ thể.
- **Tổng ghim trần đợt này: 60/132 mẫu (45,5%)** (đợt 168: 60/135 = 44,4%; đợt 167: 20/128 = 15,6%; đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **2 episode mới trong đợt 169 (E-172: 3 mẫu, 1 chuỗi, 0 sag, đã kết thúc; E-173: 57 mẫu, 1 chuỗi, 0 sag, đang ghim)** + E-171 GIỮ 12 mẫu (kết thúc trong khoảng mù) + E-170 GIỮ 48 mẫu + E-169 GIỮ 20 mẫu.
- **Phán theo quy tắc quyết (e)/(g) + mẫu T10-166 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-172 và E-173 là 2 EPISODE RIÊNG BIỆT, KHÔNG gộp thành 1 episode 60 mẫu / 2 chuỗi / 1 sag.** Căn cứ: sag giữa hai chuỗi **SÂU** (balloon tối thiểu 78,3% trần — thấp hơn hẳn sag sâu nhất của E-169 đợt 167: 89,9% trần) **VÀ gate A MỞ 10/27 mẫu trong sag** (E-169: gate A ĐÓNG cả 24 mẫu sag sâu nhất + ĐÓNG suốt span 50 mẫu → 1 episode). Quy tắc mẫu T10-166 ("dip nông + gate A không mở trong dip → KHÔNG tách") yêu cầu CẢ HAI điều kiện — đợt này cả hai đều KHÔNG thỏa, nên TÁCH. T9 trình đủ dữ kiện sag (27 mốc, balloon min 5.045.740 kB, 10 mốc gate A mở liệt kê trên) để T10/parent kiểm lại hoặc phán ngược.
  - **Đợt 169 = 2 EPISODE GHIM MỚI (E-172: 3 mẫu, 1 chuỗi, 0 sag, đã kết thúc; E-173: 57 mẫu, 1 chuỗi, 0 sag, đang ghim)** + E-171 GIỮ 12 mẫu (quyết (g) đợt 168 — kết cục trong khoảng mù).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim E-173 chỉ ~511–614.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim E-173 (10:54:11Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 519.284 kB (log thật).

### 2.3 Lượt yên WebKit #38 (T4, đợt 169) — CÓ LƯỢT HỢP LỆ, CHUỖI LÊN 33 (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-169 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND169_T4_WEBKIT_QUIET38_LIMITS.md`) + cờ `round169-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#38 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ LÊN 33 (32 → 33).**
- **Attempt3-c44cc3ba (08:59:49–09:03:41Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 53,5 ms ≤ 60 — HỢP LỆ ở lần thử thứ ba trên boot #77.** Poller thoát 09:03:41Z vì LUOT HOP LE (trước hạn cắt poller 10:30Z 1h26m19s). Attempt1 (08:44:34–08:49:53Z): 20/20 NHƯNG lớp B VI PHẠM (B1+B2+B5) + tickCost median 103,0 — lượt nhiễm tải, KHÔNG dùng verdict. Attempt2 (08:55:10–08:59:03Z): 20/20, tickCost median 49,0 — NHƯNG lớp B VI PHẠM CHỈ B4 (dpkg delta=1, +1 dòng 08:55:22Z) — lượt nhiễm, KHÔNG dùng verdict.
- **Poller — 1 instance thật + 1 test, 13 poll, 3 lần cửa mở, trên 1 boot (không reboot)** — gate0: T4-check-only 2 poll đầu, T5 10 poll sau (cờ T5-169 xuất hiện 08:46:44Z, trong lúc attempt1). **0 reboot trong phiên T4** (T4 đóng cờ 09:14:13Z, TRƯỚC reboot #78 09:14:38Z — xem F-169-T9-7).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt3-#77: gate A MỞ **4/4 mẫu** trong cửa sổ (08:59:49–09:03:41Z: 08:59:20Z 3.135.944 kB — mẫu ngay trước cửa sổ; các mẫu trong cửa sổ 09:00:20Z 2.355.116, 09:01:20Z 2.404.540, 09:02:20Z 2.308.844, 09:03:20Z 2.049.952 — cả 4 đều ≥1024 MiB; load1 1,35 / 1,96 / 1,32 / 0,91 — xem script analyze — window() đếm 4 mẫu trong [08:59:49, 09:03:41Z]).
  - Tải: sampler load1 trong cửa sổ attempt3 **0,91–1,96**; **0 spike B2 trong cửa sổ attempt3** (khác attempt1: 6 spike — xem §2.5).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt3** (khớp T4: "RAM <500 MB: 0/13 poll — SẠCH").
  - Attempt1: gate A MỞ **4/5 mẫu** trong cửa sổ (mẫu 08:49:19Z 2.423.132 kB; 1 mẫu dưới gate); load1 sampler **0,45–7,90**; **6 spike B2 trong cửa sổ attempt1** (xem §2.5, F-169-T9-6).
  - Attempt2: gate A MỞ **3/4 mẫu**; load1 **0,79–2,85**; **0 spike B2 trong cửa sổ attempt2**.
- **Cộng dồn (theo T4-169): chuỗi lượt yên hợp lệ LÊN 33; cộng dồn 33 lượt hợp lệ: P1 124/127, P2 118/118, P3-A1 107/127, P3' 91/99 occ = 83/86 distinct-seq, P7 67/67.** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 / O8 / harness (độc lập, cadence 60 s)

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| Attempt1 08:44:34–08:49:53Z | #77 | 0,45–7,90 (5 mẫu) | 721.744–2.423.132 kB — **gate A MỞ 4/5** | T4 attempt1 — **6 spike B2 trong cửa sổ** (08:46:45–08:49:41Z — T1 suite + T4 WebKit + script analyze T4/T5; xem F-169-T9-6); attempt1 NHIỄM (B1+B2+B5, median 103,0), KHÔNG dùng verdict |
| Attempt2 08:55:10–08:59:03Z | #77 | 0,79–2,85 (4 mẫu) | 1.041.932–1.463.348 kB — **gate A MỞ 3/4** | T4 attempt2 — **0 spike B2 trong cửa sổ**; vi phạm CHỈ B4 (dpkg +1 dòng 08:55:22Z), KHÔNG dùng verdict |
| Attempt3 08:59:49–09:03:41Z | #77 | 0,91–1,96 (4 mẫu) | 2.049.952–2.404.540 kB — **gate A MỞ 4/4** | T4 attempt3 — **0 spike B2 trong cửa sổ**; attempt3 HỢP LỆ (lớp B 5/5 + tickCost median 53,5) |
| O8 09:30:06–09:32:46Z | #78 | 0,38–2,26 (3 mẫu trong cửa sổ: 09:30:09Z 0,38; 09:31:09Z 1,02; 09:32:09Z 2,26) | 437.868–1.127.748 kB — **gate A MỞ 1/3** (09:30:09Z 437.868 kB — mẫu ghim E-172 cuối; 09:31:09Z 1.127.748 kB — MỞ, mẫu đầu sag; 09:32:09Z 882.328 kB — ĐÓNG) | T8 O8 — **0 spike B2 trong cửa sổ**; O8 chạy TRONG sag E-172/E-173 (ghim → xả đúng lúc O8 chạy) |
| Harness 09:33:01–09:48:31Z | #78 | 0,49–2,22 (16 mẫu) | 511.420–1.698.216 kB — **gate A MỞ 4/16** (09:34:10Z 1.349.384; 09:42:10Z 1.650.416; 09:43:10Z 1.052.192; 09:45:10Z 1.055.348) | T8 harness — **0 spike B2 trong cửa sổ**; harness chạy TRONG sag (balloon 5.045.740–6.019.220 kB, không ghim) |

### 2.5 B2 — 9 spike THẬT, 9/9 QUY ĐƯỢC DRIVER CỤ THỂ, 0 load1 dư (6 spike TRONG cửa sổ attempt1 — T1 suite + T4 WebKit + script analyze T4/T5; 0 spike trong attempt2/attempt3/O8/harness; 0 spike trong span ghim E-172/E-173)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-169-T9-8). **9 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 9, `grep '=== SPIKE'` không neo cũng = 9 — KHÔNG lặp F-166-T9-3): 9 spike bão mở đợt #77 (08:46:45–08:51:27Z); 0 spike trên boot #78 sau khi watcher khởi động lại; 0 spike trong span ghim E-172 (09:28:09–09:30:09Z, 3 mẫu) và E-173 (09:58:10–10:54:11Z, 57 mẫu).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt #77 (9 spike) | 08:46:45–08:51:27Z | 3,03 → 7,90 → 3,03 | 9 | 08:46:45Z: ffmpeg delta **73** (vidstab red60, round93-u4/work/media/red60.mp4) + WebKitWebProcess delta **24** + MiniBrowser delta **11** (T4 attempt1) + T8 python3 50,0% tích lũy; 08:47:20Z: mask_anim delta **92** + find delta 10; 08:47:56Z: **ffmpeg delta-miss** (126% tích lũy, ffv1 từ frame mask_anim; top -b tức thời 81,8%) + mask_anim 67,5% tích lũy — delta-miss ×2; 08:48:30Z: mask_anim delta **90**; 08:49:06Z: T4 analyze-t4-labellag.py delta **41** + T5 t5-stats-169.py delta **47**; 08:49:41Z: T5 t5-stats-169.py delta **41** + T4 analyze-t4-lag5.py delta **40**; 08:50:17Z: **ffmpeg delta-miss** (100% tích lũy, testsrc2 640x360 lutrgb; top -b tức thời 160,0%); 08:50:51Z: **ffmpeg delta-miss** (130% tích lũy, testsrc2 854x480 geq; top -b tức thời 110,0%); 08:51:27Z: ffmpeg delta **135** (testsrc2 1920x1080 geq) | **Bão mở đợt 169: T1 verify suite (ffmpeg vidstab red60/mask_anim/testsrc2) + T4 attempt1 (WebKit) + script phân tích T4/T5 + T2 blind-investigate (phụ, delta 7–17)** — nhiều luồng mở cùng lúc trên boot #77 (cùng mẫu đợt 163/164/165/166/167/168). Load1 max đợt (sampler) **7,90 lúc 08:49:19Z** (watcher bắt 7,87 lúc 08:49:06Z). **6 spike (08:46:45–08:49:41Z) NẰM TRONG cửa sổ attempt1** (08:44:34–08:49:53Z) — attempt1 nhiễm, KHÔNG dùng verdict; **3 spike (08:50:17–08:51:27Z) nằm GIỮA attempt1 và attempt2** (sau attempt1 24 s – 1m34s, trước attempt2 3m43s – 4m53s) |

- **Tổng kết đếm: 9/9 spike có driver process cụ thể + 0 spike lớp "load1 dư"** (đợt 168: 12/15 quy được + 3 load1 dư; đợt 167: 16/22 quy được + 6 load1 dư; đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư). Đợt này tỉ lệ load1 dư 0/9 = 0% (thấp nhất kể từ đợt 163).
- **Caveat đếm (F-169-T9-5):** 4 pid delta-miss trong 3 spike (spike 08:47:56Z: ffmpeg 27034 + mask_anim 26530; spike 08:50:17Z: ffmpeg 30939; spike 08:50:51Z: ffmpeg 32957) — quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165), F-166-T9-6 (4 spike đợt 166), F-167-T9-6 (6 spike đợt 167) và F-168-T9-10 (1 spike đợt 168). `grep -c 'WebKit\|MiniBrowser'` = **5 dòng** (1 spike: 08:46:45Z — WebKit attempt1; WebKit xuất hiện trong 1/9 spike).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: 3 spike (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 9 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 9/9 spike — 0 spike lớp load1 dư đợt này.
- **Delta tick lớn nhất đợt: 135 tick/s** (ffmpeg testsrc2 1920x1080 geq, spike 08:51:27Z, load1 3,03). (Đợt 168: max 113 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 08:44:1xZ CÙNG lúc sampler (khác đợt 163: watcher mở muộn 67 s sau sampler) — **0 khoảng mù đầu phiên đợt này** (spike đầu tiên watcher bắt được là 08:46:45Z, ~2 phút sau khi mở — trước đó load1 < 3,0; sampler load1 lúc mở 0,96–1,27). **Khoảng mù duy nhất: reboot #78 giết watcher, khởi động lại 09:16:09Z (gap ~109 s cùng sampler — xem §5.1)** — **0 spike trên #78 sau khởi động lại** (load1 sampler trên #78 max 2,26 < 3,0; hai đầu khoảng mù load1 0,50 và 2,03 — không spike nào bị lỡ chắc chắn). **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/mask_anim.py/testsrc2 xuất hiện trong 7 spike của bão mở đợt** (vidstab red60 + mask_anim ellipse + ffmpeg ffv1/testsrc2 lutrgb/geq — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 3 spike delta-miss — xem §2.5). **T4 analyze script (analyze-t4-labellag.py + analyze-t4-lag5.py) xuất hiện trong 2 spike** (08:49:06Z + 08:49:41Z — phân tích trong cửa sổ attempt1, xem F-169-T9-6). **T5 t5-stats-169.py xuất hiện trong 2 spike** (08:49:06Z + 08:49:41Z — thống kê infra, cùng lúc với script T4). **T2 blind9696-investigate.py xuất hiện trong 4 spike** (08:49:06Z delta 9; 08:49:41Z delta 10; 08:50:17Z delta 17; 08:50:51Z delta 7 — điều tra mù, chỉ là tải phụ). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T4 analyze + T5 stats + T2 điều tra + T8 python3 + hatch daemon; **5 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 1 spike, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi ba liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt (xem F-169-T9-2 về gap phủ sóng đầu phiên + §5.1 về gap qua reboot #78):** sampler `round169-t9/sampler.sh` chạy liên tục 08:42:19Z–09:14:20Z (instance 1, chết theo reboot #78) rồi 09:16:09Z–10:54:11Z (instance 2, khởi động lại bằng tay), **132 mẫu, gap trong log đóng băng lớn nhất 109 s (qua reboot #78), 1 gap >90 s**; các gap còn lại max 61 s (đợt 168: gap 55 s qua reboot #76; đợt 167: gap 77 s qua reboot #74; đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **3.135.944 kB = 49,84% guard** (đợt 168: 52,03%; đợt 167: 40,10% — thấp nhất chuỗi; đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **3.155.512 kB (50,16%)**.
- **Guard giữ nguyên: 6.291.456 kB (6.144 MiB).** Không mẫu nào chạm 6.144 MiB — cơ chế (a) **armed** (sampler chạy liên tục) và **KHÔNG kích hoạt** suốt 2h12m.
- **0 lần thử birefnet trong đợt 169 — lần thứ hai mươi ba liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0; đợt 168: 0; đợt 169: 0). **Chuỗi 0 lần thử: 23 đợt liên tiếp** (đợt 147–169).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 23 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round169-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 168); `bgremove.py` **23.500 B** (không đổi so với đợt 168); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-169-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt (xem F-169-T9-2 về gap đầu phiên).**
- **Không cần chạy lại birefnet trong đợt 169** (guard chưa từng mở; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #77 ≥30 dòng + boot #78 = 24 dòng; tổng ≥54 dòng, cận dưới — đợt thứ mười tám liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#77** (c44cc3ba, btime 08:23:52Z): **≥30 dòng** (T9 đếm trực tiếp: 2 dòng lúc 08:42:00Z → 4 dòng lúc 08:44:16Z → **30 dòng lúc 09:14:14Z** (đếm cuối trước reboot #78); **phần còn lại 09:14:14Z → reboot #78 (09:14:38Z) mất theo reboot, KHÔNG cộng số ước** — journal của #77 không đọc được nữa sau #78, `journalctl --list-boots` lúc đóng chỉ còn #78, xem F-169-T9-3). Dòng đầu tiên trên #77: **08:37:11Z (boot+799s)**; dòng thứ hai 08:40:38Z. Nhịp ~1 dòng/phút trong lúc headroom 0 (4 → 30 trong ~30 phút).
- Boot **#78** (e298bb52, btime 09:14:38Z): **24 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước**). Dòng đầu tiên trên #78: **sau 09:16:09Z** (ENOSPC-count=0 lúc probe cửa sổ 09:16:09Z) và **trước hoặc tại 09:42:31Z** (đếm được 19 dòng lúc đó) — thời điểm dòng đầu tiên chính xác KHÔNG ghi lại được (T9 chỉ đếm tổng ở các mốc kiểm tra, xem F-169-T9-4); dòng cuối cùng: **09:47:16Z** — sau đó IM tới đóng (10:54:29Z) trong khi headroom về 2 (xem §1.2). Nhịp 24 dòng trong ~31 phút rồi im — **khác hẳn #77 (tăng đều ~1 dòng/phút không ngừng)** và giống #76 đợt 168 (3 dòng rồi im).
- **Tổng đợt 169: ≥30 + 24 = ≥54 dòng đếm được (cận dưới)** — đợt thứ mười tám liên tiếp có lỗi thật (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng; đợt 165: ≥64 dòng; đợt 166: ≥56 dòng; đợt 167: ≥76 dòng; đợt 168: ≥102 dòng — T9 đếm trực tiếp; đợt 169: ≥54 dòng — T9 đếm trực tiếp). **Caveat: số đợt này là CẬN DƯỚI** — phần còn lại boot #77 (09:14:14Z → 09:14:38Z) mất theo reboot #78, không đếm được; và 0 dòng trong 30 thuộc về khoảng trước khi đợt mở (dòng đầu tiên 08:37:11Z đã SAU khi đợt mở 08:35:51Z) — **số dòng thuộc về đợt 169 = ≥54 (toàn bộ đếm được)**. T9 trình cả hai số (≥54 đếm được / ≥54 thuộc về đợt) để T10/parent không đếm trùng.
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 168: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 168:** đợt 168 có ≥102 dòng (boot #75 ≥99 + boot #76 3). Đợt này **≥54 dòng** — thấp hơn đợt 168 đúng 48 dòng, vì boot #77 chỉ có ≥30 dòng (headroom 0 nhưng phiên trên #77 chỉ ~52 phút: 08:42:19–09:14:20Z) so với boot #75 đợt 168 (≥99 dòng trong ~107 phút) và boot #78 đợt này (24 dòng — ENOSPC dừng sau 09:47:16Z trong khi headroom về 2).
- **Điểm mới (giao parent/T10 xem lại quyết (g) — T9 chỉ nêu dữ kiện):** đợt này là đợt có ENOSPC đếm được THẤP NHẤT kể từ đợt 156 (≥39 dòng; đợt 157: ≥106; đợt 158: ≥50 — đợt này 54 cao hơn 158 đúng 4 dòng). Headroom 0 suốt phiên trên #77 + ENOSPC tăng đều không ngừng — bằng chứng độc lập (ngoài probe) rằng headroom 0 là thật (systemd không thêm được watch nào trong cả phiên trên #77).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #77 + #78 — 2 reboot trong/anh quanh đợt 169 (cùng mẫu đợt 168: 2 reboot)

- **Reboot #77 (c44cc3ba, btime 08:23:52Z; gap #76→#77 = 3.089 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ** (đợt mở 08:35:51Z, boot+719s), SAU khi T10-168 đóng sổ (~08:2xZ trên boot #76). Đợt 169 mở trên chính boot này — **KHÔNG có reboot giữa T10-168 đóng sổ và đợt mở ngoài #77** (số hiệu #77 theo đếm tuần tự — T0-169 xác minh 9/9 nguồn, T2-169 xác minh btime bằng 7 nguồn; parent đã xác nhận ở quyết đợt 169).
- **Reboot #78 (e298bb52, btime 09:14:38Z; gap #77→#78 = 3.046 s):** xảy ra **GIỮA PHIÊN** (09:14:38Z, 38m47s sau khi đợt mở). Sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ bảy liên tiếp — đợt 163 chết theo #66, đợt 164 chết theo #68, đợt 165 chết theo #70, đợt 166 chết theo #71, đợt 167 chết theo #74, đợt 168 chết theo #76, đợt này chết theo #78); T9 khởi động lại cả ba bằng tay **09:16:09Z (boot+91s)** — **khoảng trống trong log sampler 109 s** (09:14:20Z → 09:16:09Z), **1 gap >90 s trong log đóng băng** (max 109 s — xem §2.1). **1 lệnh sleep-wait dài của T9 (25 phút) bị runtime restart trùng với reboot #78 gián đoạn** (không có kết quả cuối xác nhận — runtime recovery; chỉ là timer chờ, không có side effect; mọi trạng thái đã trên đĩa; xem F-169-T9-7).
- **Mẫu sampler cuối #77 (09:14:20Z) TRƯỚC btime #78 (09:14:38Z) 18 s — KHÔNG có mẫu overlap sau btime lần này** (khác đợt 168: mẫu cuối sau btime 14 s — overlap thứ sáu; đợt 167: 6 s; đợt 166: ≥6 s; đợt 165: ≥11 s; đợt 161: 824 s). Mẫu đầu #78 (09:16:09Z) mang nhãn boot mới `e298bb52` đúng — sampler khởi động lại sau reboot nên nhãn đúng ngay từ mẫu đầu.
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T0-169 đo; T9 không đo lại — T7 NOTES 10:53Z ghi Cloudflare Date 10:53:38 vs local 10:53:37, chênh 1 s).
- **Khoảng trống phủ sóng đầu phiên (F-169-T9-2):** đợt mở 08:35:51Z (boot+719s), T9 nhận việc ~08:41:2xZ (boot+~1050s), sampler khởi động 08:42:19Z (boot+1147s) — **gap 388 s từ lúc đợt mở tới khi sampler chạy** (đợt 168: gap 283 s; đợt 167: gap 162 s; đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Trong 388 s này: balloon ở ~92% trần lúc mở (mẫu đầu 08:42:19Z bal 5.921.520 kB), headroom về 0 (probe mở 08:44:16Z đã là 0; ENOSPC đầu tiên 08:37:11Z đã TRƯỚC khi T9 mở nhưng SAU khi đợt mở). **Cửa sổ thoáng của #77 (nếu có) nằm trong 388 s này + trước đó — KHÔNG quan sát được** (xem §1.2). T9 ghi gap này để T10/parent biết, không giấu.
- **Khoảng mù giữa hai đợt 2.867 s (07:54:32Z → 08:42:19Z):** sampler đợt 168 dừng lúc đóng (07:54:32Z); sampler đợt 169 khởi động 08:42:19Z. Trong 2.867 s này có 1 reboot (#77 08:23:52Z) — E-171 đã kết thúc trong khoảng mù (xem §2.2); cửa sổ thoáng của #77 (nếu có, ~08:24–08:37Z) đã đóng trước khi T9 mở.

### 5.2 T5-169 (infra) — POSTBOOT_PASS #77 ĐÃ CÓ; watcher-169 CHẾT theo #78 (thuộc T5-170)

- **POSTBOOT_PASS #77 ĐÃ CÓ lúc 08:46:44Z** (boot+22m52s — theo T5-169; replay-đầy-đủ, poll=0, verify độc lập exit 0, 11/11 gói + 5/5 lib, GST 269 = debroot 269).
- **POSTBOOT_PASS #78 CHƯA CÓ lúc T9 đóng** (T5-169 đóng cờ ~09:02Z, TRƯỚC reboot #78 09:14:38Z — thuộc T5-170 theo dõi tiếp). **POSTBOOT_PASS #76 KHÔNG CÓ** (boot thứ 13 lọt — không bù được, theo T5-169/T2-169).
- **Watcher-169 (T5, pid 25426): CHẾT theo reboot #78** (T9 xác minh pid đã mất lúc đóng 10:58Z — cùng số phận sampler/watcher/probe-loop của T9; khởi động lại thuộc T5-170). **Watcher-168 KẾT THÚC THEO LỊCH? KHÔNG — watcher-168 CHẾT theo #76** (pid 13133, 191 poll, poll cuối 07:32:18Z — theo T5-169). Khoảng không-watcher: **4.465 s = 74m25s** (poll cuối watcher-168 → START watcher-169 08:46:43Z — theo T5-169).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T0-169 đếm 28 reboot #49–#76, 29 tính tới #77 — theo T2-169; #78 thêm vào → 30 nếu parent xác nhận #77/#78 — giao T0-170/T5-170 đếm).
- **X11 (T9 kiểm tra lúc đóng phiên 10:54Z):** `/tmp/.X11-unix/` **TRỐNG** (0 socket — reboot #78 đã xóa hết; T8-169 đã dọn trước đó: socket của chính T8 đã được driver tự unlink, không có socket mới nào của T1 suite trên boot mới).

### 5.3 T8-169 (vite harness + O8) — ĐÃ đóng cờ (~09:55Z); O8 PASS 3/3 NHƯNG chuỗi GIỮ 21, harness 6/6

- **T8-169 ĐÃ xuất bản LIMITS + viết cờ `round169-t8.done` (~09:55Z)** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 PASS 3/3 trên boot #78** (09:30:06–09:32:46Z — WebKit 21/21 ×2 + Chromium 21/21): **0 spike B2 trong cửa sổ O8** (khác đợt 168: 1 spike trong cửa sổ O8). **T8 đề xuất chuỗi WebKit FULL PASS GIỮ 21, KHÔNG LÊN 22** — vì lượt yên #38 hợp lệ ở boot CŨ #77, gate cho boot đo #78 KHÔNG FOUND — chờ T10/parent phán.
- **Đối chiếu sampler T9 trong cửa sổ O8 (09:30:06–09:32:46Z): 3 mẫu, gate A MỞ 1/3** (09:30:09Z 437.868 kB — mẫu ghim E-172 cuối, dưới gate 610.708 kB; 09:31:09Z 1.127.748 kB — MỞ, mẫu đầu sag; 09:32:09Z 882.328 kB — ĐÓNG), balloon 85,8–100% trần (ghim → xả đúng lúc O8 chạy), load1 0,38–2,26 (sampler).
- **Harness 6/6 PASS + 0 kẹt** (09:33:01–09:48:31Z): **0 spike B2 trong cửa sổ harness** (khác đợt 168: 2 spike trong cửa sổ harness). Đối chiếu sampler T9 trong cửa sổ harness: gate A MỞ 4/16 (09:34:10Z 1.349.384; 09:42:10Z 1.650.416; 09:43:10Z 1.052.192; 09:45:10Z 1.055.348). Harness chạy TRONG sag E-172/E-173 (balloon 5.045.740–6.019.220 kB, không ghim).
- **(1c') (c') đã triển khai diag-only — 0 kích hoạt, 0 FP (T8-169 sở hữu; T9 không kiểm tra triển khai).** T8 ghi "1 REBOOT TRONG PHIÊN — #78" — viết SAU reboot #78 (T8 đóng ~09:55Z); T9 ghi rõ để T10 không đọc nhầm (xem F-169-T9-7).

### 5.4 T7-169 (scheduler) + T2-169 — T7 CHƯA đóng cờ lúc T9 đóng; run 168 SUCCEEDED, (m) #77 KHÔNG PHẢI ĐIỂM

- **T7-169 CHƯA xuất bản LIMITS + CHƯA viết cờ `round169-t7.done` lúc T9 đóng (10:58Z)** — T9 chỉ đối chiếu bằng dữ kiện T0/T2 đã xuất bản, không phán thay T7. Theo T7 NOTES lúc 10:53:36Z: **run 169 vẫn running** (tuổi 8.265 s, còn 2.535 s tới hạn 11:35:51Z); HB 6/6 đầy; boot lúc đọc #78, btime không đổi.
- **Run 168 SUCCEEDED 08:18:55Z theo DB** (theo T2-169: wall 9.784 s; margin 1.016 s; claimed→finished 7 s — trở lại họ 6–11 s sau ca 108 s của run 167); **#77 KHÔNG viết lại run nào** (run 168 finish 297 s trước btime; run 169 start 719 s sau btime; 0 requeue — theo T2-169).
- **Run 169 vẫn running lúc T9 đóng** (hạn 11:35:51Z) — kết cục + (m) #78 thuộc T7-169/T2-170. **Reboot #78 (09:14:38Z) xảy ra TRONG phiên run 169** — run 169 có bị viết lại tại #78 không, requeue offset có trong dải không — thuộc T7-169/T2-170 (T9 không phán).
- **(m) #77: KHÔNG PHẢI ĐIỂM** (theo T2-169: 0 requeue trong cửa 08:23:52–09:00:00Z; run 168 finish 297 s trước btime; run 169 start 719 s sau btime). **(m) #76: parent ĐÃ QUYẾT KHÔNG PHẢI ĐIỂM (quyết (e) đợt 168) — T2-169 chỉ ghi chú tham chiếu, KHÔNG mở lại phân loại.** **(m) #56 vẫn có điều kiện** (theo T2-169 — thuộc T2-170).
- T7-169 đóng cờ sau T9 (nếu có) — T9 không chờ T7 (hạn cờ T9 ~11:00Z).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T8 đã đóng cờ lúc 10:58Z (7/9)** — T7 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T2-169:** (m) #77 KHÔNG PHẢI ĐIỂM + (m) #76 đã quyết KHÔNG PHẢI ĐIỂM (tham chiếu) + run 168 SUCCEEDED margin 1.016 s + gap #76→#77 = 3.089 s + marker 28 reboot #49–#76 (29 tính tới #77); INSIDE #75/#76 (dải FULL121/FULL122 — T2-169 sở hữu); mù #96?/#95?/#94?/#88?/#77? VẪN MỞ (T2-169 sở hữu); hole-recheck lần 13 (T2-169 sở hữu). T9 không trích số — thuộc T2-169/T10.
- **T1-169:** verify đợt 168 (T9 không trích số — thuộc T1-169/T10).
- **T6-169:** prune lần 44 (T9 không trích số — thuộc T6-169/T10).
- **T4-169:** xem §2.3 (LIMITS đã xuất bản).
- **T0-169:** boot #77 xác minh 9/9 nguồn (T9 không trích số — thuộc T0-169/T10; số hiệu #77/#78 theo đếm tuần tự, chờ parent xác nhận #78).

## 6. Sai số / caveat (F-169-T9-*)

- **F-169-T9-1 — 2 lần đo headroom LỖI đường dẫn lúc mở (08:43:24Z) + cửa sổ thoáng sau reboot KHÔNG quan sát được trên cả hai boot — lần thứ hai liên tiếp (đợt 168 + 169).** Lệnh khởi động vòng lặp của T9 viết `cd DIR && nohup bash sampler.sh ... &` — `&` chạy nền CẢ CỤM `cd && nohup` dưới dạng subshell, nên shell chính vẫn ở `/home/hatch`: (a) 2 lần đo probe-open 08:43:24Z lỗi `can't open file '/home/hatch/k8-headroom.py'` (không có số đo); (b) `b2-watcher.sh` + `probe-loop.sh` khởi động bằng đường dẫn tương đối nên CHẾT NGAY (không có file nohup tương ứng trong round169-t9/); (c) `headroom-log.txt` rơi vào `/home/hatch/headroom-log.txt` thay vì round169-t9/. T9 phát hiện sau ~2 phút (kiểm tra disk lúc 08:44–08:46Z): sampler VẪN CHẠY (dùng đường dẫn tuyệt đối trong script, 2 mẫu đã có); khởi động lại b2-watcher + probe-loop bằng đường dẫn tuyệt đối 08:44:1xZ; dời nội dung headroom-log lạc vào file đúng; đo lại cặp mở 08:44:16Z (0, 0). Hậu quả: **mất 2 lần đo mở (08:43:24Z) + b2-watcher mù ~2 phút đầu phiên** (08:42–08:44Z; load1 sampler trong 2 phút này 0,96–1,27 < 3,0 nên không spike nào bị lỡ chắc chắn); probe-loop vòng 1 lan-1 (mở) mất nhưng lan-2 09:14:14Z vẫn chạy. Bài học: không bao giờ `cd && nohup ... &` trong một lệnh exec — dùng đường dẫn tuyệt đối + `setsid nohup` cho mọi vòng lặp. Trên #78: cặp cửa sổ lúc boot+91s đã 0, 0; ENOSPC đầu tiên trên #78 sau 09:16:09Z. T9 không claim cửa sổ có mở hay không — chỉ biết nếu có mở thì đã đóng trước boot+91s (#78) / boot+799s (#77). Đây là dữ kiện mới (đợt thứ hai liên tiếp kể từ 163 không bắt được cửa sổ dù có reboot giữa phiên), không phải lỗi đo: T9 có mặt trên #78 từ boot+91s (khởi động lại loop) nhưng lần đo đầu tiên chỉ tới được boot+91s (cần ~90 s để phát hiện reboot + khởi động lại 3 loop + chạy probe).
- **F-169-T9-2 — Khoảng mù giữa hai đợt 2.867 s (07:54:32Z → 08:42:19Z) + gap phủ sóng đầu phiên 388 s + cửa sổ #77 không quan sát được.** Sampler đợt 168 dừng lúc đóng (07:54:32Z); sampler đợt 169 khởi động 08:42:19Z. Trong 2.867 s này có 1 reboot (#77 08:23:52Z) — E-171 đã kết thúc trong khoảng mù (xem §2.2); cửa sổ thoáng của #77 (nếu có, ~08:24–08:37Z) đã đóng trước khi T9 mở. Gap đầu phiên đợt này 388 s (đợt mở 08:35:51Z → sampler 08:42:19Z) — dài hơn đợt 168 (283 s) và đợt 167 (162 s), ngắn hơn đợt 165 (1.760 s). Trong 388 s này: balloon ở ~92% trần lúc mở (mẫu đầu 08:42:19Z bal 5.921.520 kB), headroom về 0 (probe mở 08:44:16Z đã là 0; ENOSPC đầu tiên 08:37:11Z đã trước khi T9 mở nhưng sau khi đợt mở).
- **F-169-T9-3 — ENOSPC #77 ≥30 là cận dưới (phần 09:14:14Z → 09:14:38Z mất theo reboot #78, KHÔNG cộng số ước); 0 dòng trong 30 thuộc về khoảng trước khi đợt mở (dòng đầu tiên 08:37:11Z đã SAU khi đợt mở 08:35:51Z).** Tổng đợt 169 ≥54 dòng đếm được (cận dưới) = ≥30 (#77) + 24 (#78); số dòng thuộc về đợt 169 = ≥54 (toàn bộ). T9 ghi cả hai số để T10/parent không đếm trùng. `journalctl --list-boots` lúc đóng chỉ còn #78 — journal #77 không đọc được nữa (cùng họ EPERM như `dmesg` — xem F-163-T9-1).
- **F-169-T9-4 — Thời điểm dòng ENOSPC đầu tiên trên #78 KHÔNG ghi lại được chính xác.** T9 chỉ đếm tổng ở các mốc kiểm tra: 0 lúc 09:16:09Z; 19 lúc 09:42:31Z; 23 lúc 09:46:09Z; 24 lúc đóng (dòng cuối 09:47:16Z). Dòng đầu tiên nằm trong (09:16:09Z, 09:42:31Z] — T9 không claim thời điểm cụ thể. (Đợt 168 ghi được dòng đầu #76 lúc 07:34:08Z vì T9 đếm ở mốc gần hơn.)
- **F-169-T9-5 — 4 pid delta-miss trong 3 spike (08:47:56Z ×2, 08:50:17Z, 08:50:51Z).** Quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165), F-166-T9-6 (4 spike đợt 166), F-167-T9-6 (6 spike đợt 167) và F-168-T9-10 (1 spike đợt 168). **Nhãn "0 reboot TRONG phiên" của T4-169 chỉ đúng tới lúc T4 đóng cờ (09:14:13Z) — reboot #78 (09:14:38Z) xảy ra SAU khi T4 đóng 25 s; T9 ghi rõ để T10 không đọc nhầm thành "đợt 169 không có reboot giữa phiên".**
- **F-169-T9-6 — 6 spike B2 TRONG cửa sổ attempt1 (08:46:45–08:49:41Z), trong đó 2 spike do chính script phân tích của T4/T5 (08:49:06Z: analyze-t4-labellag.py delta 41 + t5-stats-169.py delta 47; 08:49:41Z: t5-stats-169.py delta 41 + analyze-t4-lag5.py delta 40).** Script phân tích của chính T4 chạy TRONG cửa sổ attempt1 (12–47 s trước khi attempt1 kết thúc 08:49:53Z) — khác mẫu đợt 168 (script analyze chạy 2 s trước khi poller thoát, SAU khi probe chạy xong). T4-169 ghi "mọi phân tích nặng SAU khi attempt kết thúc" — T9 đối chiếu thấy 2 script analyze của T4 (labellag + lag5) chạy trong cửa sổ attempt1; T9 KHÔNG phán câu của T4 đúng/sai (có thể T4 nói về attempt3, hoặc script chạy phân tích dữ liệu từng phần) — chỉ ghi đúng thời điểm + driver + delta để T4/T10 đối chiếu. Attempt1 đã nhiễm (median 103,0, B1+B2+B5) và KHÔNG dùng verdict nên 2 spike này không ảnh hưởng verdict hợp lệ của attempt3 (0 spike trong cửa sổ attempt3).
- **F-169-T9-7 — 1 lệnh sleep-wait dài của T9 (25 phút) bị runtime restart trùng với reboot #78 gián đoạn + sampler gap 109 s qua reboot (1 gap >90 s đầu tiên kể từ đợt 163).** Sleep-wait bắt đầu ~09:10Z, bị gián đoạn sau 5m14s (runtime recovery lúc ~09:15:29Z); T9 kiểm tra lại từ disk ngay sau đó và phát hiện reboot #78 (btime 09:14:38Z) + cả ba loop đã chết; khởi động lại cả ba lúc 09:16:09Z (boot+91s). Khoảng trống trong log sampler 109 s (09:14:20Z → 09:16:09Z) — dài hơn đợt 168 (55 s) vì T9 chỉ phát hiện reboot sau khi runtime restart báo về. Không mất dữ liệu (mọi trạng thái đã trên đĩa; log đủ 132 dòng trước khi đóng). Cùng mẫu F-168-T9-4 (sleep-wait bị reboot #76 giết) và F-167-T9-4. **Watcher-169 của T5 (pid 25426) cũng CHẾT theo #78** (T9 xác minh pid đã mất lúc đóng 10:58Z — khởi động lại thuộc T5-170).
- **F-169-T9-8 — Watcher/sampler của chính T9 xuất hiện trong snapshot B2: `grep -c 'b2-watcher.sh'` = 4 dòng — đều 0,0% CPU, delta 0** (chỉ là process nền nằm cuối top12 khi ít process bận; không ảnh hưởng attribution vì delta đều 0 — cùng mẫu F-168-T9-11). `grep -c 'sampler.sh'` = 0 dòng.
- **F-169-T9-9 — Bản nháp đầu của LIMITS này có phụ lục sampler/headroom GÕ TAY với nhiều dòng mẫu bịa (không phải copy verbatim) + giá trị attempt3 gán sai mốc + số dòng headroom sai (ghi 60, thực 52) + 1 dòng mem của probe lan-2 09:46:09Z chép nhầm từ lan-2 09:14:14Z.** T9 tự phát hiện khi đối chiếu lại với log đóng băng TRƯỚC khi stage/cắm cờ: (a) toàn bộ phụ lục sampler (132 dòng) và headroom (52 dòng) đã được viết lại bằng script từ file FROZEN (md5 khớp `c7ec94dcd49f80b256269ea52778e0cf` / `d39aef68354b25c59ee1509bd95a14cb`); (b) 4 mốc attempt3 trong §2.3 đã sửa đúng giá trị log thật (09:00:20Z 2.355.116; 09:01:20Z 2.404.540; 09:02:20Z 2.308.844; 09:03:20Z 2.049.952 — load1 1,35/1,96/1,32/0,91); (c) số dòng headroom sửa 60 → 52. Các số trong thân file (§0–§5) đã được đối chiếu lại với output của `t9-169-analyze.py` + `t9-169-recheck.py` (RECHECK OK) và log đóng băng — KHÔNG phát hiện sai khác khác ngoài 2 điểm trên. Bài học: phụ lục log CHỈ được tạo bằng script từ file FROZEN, không bao giờ gõ tay — cùng họ bẫy F-164-T9-10 (đảo ngược: đợt 164 cấm gõ tay, đợt này T9 vẫn gõ tay ở bản nháp đầu).
- **F-169-T9-10 — T9 đóng cờ TRỄ ~5 phút so với hạn cờ ~11:00Z (cờ viết lúc ~11:05Z, trong hạn cứng 11:30Z).** Nguyên nhân: viết LIMITS + phát hiện/sửa lỗi phụ lục ở F-169-T9-9. Không do reboot (không reboot mới sau #78).
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được — đợt này không quan sát được cửa sổ nào); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 168 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (132 mẫu, 08:42:19Z–10:54:11Z)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round169-t9/ram-sampler-FROZEN.log` (md5 `c7ec94dcd49f80b256269ea52778e0cf`) — không gõ lại bằng tay (xem F-164-T9-10).

```
2026-11-22T08:42:19Z boot=c44cc3ba mem=939136 bal=5921520 swapfree=786312 load1=0.96
2026-11-22T08:43:19Z boot=c44cc3ba mem=822936 bal=6045220 swapfree=780068 load1=1.27
2026-11-22T08:44:19Z boot=c44cc3ba mem=560312 bal=5662440 swapfree=673260 load1=1.58
2026-11-22T08:45:19Z boot=c44cc3ba mem=721744 bal=5334760 swapfree=657248 load1=0.78
2026-11-22T08:46:19Z boot=c44cc3ba mem=1278164 bal=4583200 swapfree=624800 load1=0.45
2026-11-22T08:47:19Z boot=c44cc3ba mem=1580200 bal=4768248 swapfree=643900 load1=5.69
2026-11-22T08:48:19Z boot=c44cc3ba mem=2021952 bal=4453276 swapfree=659216 load1=4.67
2026-11-22T08:49:19Z boot=c44cc3ba mem=2423132 bal=4020988 swapfree=681620 load1=7.90
2026-11-22T08:50:19Z boot=c44cc3ba mem=2748068 bal=3868840 swapfree=686052 load1=5.84
2026-11-22T08:51:19Z boot=c44cc3ba mem=2492632 bal=4168208 swapfree=692276 load1=3.20
2026-11-22T08:52:19Z boot=c44cc3ba mem=2461140 bal=4275512 swapfree=687856 load1=1.94
2026-11-22T08:53:20Z boot=c44cc3ba mem=2208636 bal=4544524 swapfree=688312 load1=0.71
2026-11-22T08:54:20Z boot=c44cc3ba mem=1970948 bal=4790152 swapfree=688720 load1=0.52
2026-11-22T08:55:20Z boot=c44cc3ba mem=1379576 bal=4753600 swapfree=680164 load1=0.79
2026-11-22T08:56:20Z boot=c44cc3ba mem=1041932 bal=4856200 swapfree=656976 load1=2.85
2026-11-22T08:57:20Z boot=c44cc3ba mem=1447332 bal=5015472 swapfree=651036 load1=2.23
2026-11-22T08:58:20Z boot=c44cc3ba mem=1463348 bal=5167412 swapfree=651736 load1=1.96
2026-11-22T08:59:20Z boot=c44cc3ba mem=3135944 bal=3651964 swapfree=646208 load1=1.43
2026-11-22T09:00:20Z boot=c44cc3ba mem=2355116 bal=3642576 swapfree=654052 load1=1.35
2026-11-22T09:01:20Z boot=c44cc3ba mem=2404540 bal=3899036 swapfree=647328 load1=1.96
2026-11-22T09:02:20Z boot=c44cc3ba mem=2308844 bal=4169888 swapfree=656724 load1=1.32
2026-11-22T09:03:20Z boot=c44cc3ba mem=2049952 bal=4368204 swapfree=657116 load1=0.91
2026-11-22T09:04:20Z boot=c44cc3ba mem=3115560 bal=3696000 swapfree=652972 load1=0.69
2026-11-22T09:05:20Z boot=c44cc3ba mem=2782424 bal=4021092 swapfree=656280 load1=0.60
2026-11-22T09:06:20Z boot=c44cc3ba mem=2414928 bal=4313876 swapfree=665056 load1=0.40
2026-11-22T09:07:20Z boot=c44cc3ba mem=2123284 bal=4574856 swapfree=670912 load1=0.66
2026-11-22T09:08:20Z boot=c44cc3ba mem=1960468 bal=4816764 swapfree=673316 load1=0.94
2026-11-22T09:09:20Z boot=c44cc3ba mem=1776952 bal=5039192 swapfree=673612 load1=0.50
2026-11-22T09:10:20Z boot=c44cc3ba mem=1544748 bal=5242264 swapfree=674984 load1=0.74
2026-11-22T09:11:20Z boot=c44cc3ba mem=1371392 bal=5425104 swapfree=676432 load1=0.44
2026-11-22T09:12:20Z boot=c44cc3ba mem=1219488 bal=5593668 swapfree=685664 load1=0.19
2026-11-22T09:13:20Z boot=c44cc3ba mem=1069464 bal=5746324 swapfree=684636 load1=0.51
2026-11-22T09:14:20Z boot=c44cc3ba mem=915408 bal=5884612 swapfree=687624 load1=0.50
2026-11-22T09:16:09Z boot=e298bb52 mem=1704408 bal=5163460 swapfree=1026564 load1=2.03
2026-11-22T09:17:09Z boot=e298bb52 mem=1529772 bal=5363760 swapfree=1009748 load1=0.93
2026-11-22T09:18:09Z boot=e298bb52 mem=1350860 bal=5543724 swapfree=1002028 load1=0.64
2026-11-22T09:19:09Z boot=e298bb52 mem=1218564 bal=5707664 swapfree=992080 load1=0.23
2026-11-22T09:20:09Z boot=e298bb52 mem=1058440 bal=5858184 swapfree=967436 load1=0.14
2026-11-22T09:21:09Z boot=e298bb52 mem=895300 bal=5995000 swapfree=930584 load1=0.21
2026-11-22T09:22:09Z boot=e298bb52 mem=970936 bal=5972608 swapfree=853676 load1=0.16
2026-11-22T09:23:09Z boot=e298bb52 mem=826732 bal=6099536 swapfree=854364 load1=0.13
2026-11-22T09:24:09Z boot=e298bb52 mem=713680 bal=6214216 swapfree=854572 load1=0.20
2026-11-22T09:25:09Z boot=e298bb52 mem=662636 bal=6318560 swapfree=846988 load1=0.11
2026-11-22T09:26:09Z boot=e298bb52 mem=557680 bal=6414424 swapfree=788424 load1=0.15
2026-11-22T09:27:09Z boot=e298bb52 mem=505496 bal=6378288 swapfree=686348 load1=0.83
2026-11-22T09:28:09Z boot=e298bb52 mem=607788 bal=6443824 swapfree=674624 load1=1.37
2026-11-22T09:29:09Z boot=e298bb52 mem=615824 bal=6443824 swapfree=675400 load1=0.63
2026-11-22T09:30:09Z boot=e298bb52 mem=437868 bal=6443824 swapfree=677880 load1=0.38
2026-11-22T09:31:09Z boot=e298bb52 mem=1127748 bal=5526320 swapfree=603436 load1=1.02
2026-11-22T09:32:09Z boot=e298bb52 mem=882328 bal=5542988 swapfree=602812 load1=2.26
2026-11-22T09:33:09Z boot=e298bb52 mem=839544 bal=5569616 swapfree=603184 load1=1.52
2026-11-22T09:34:10Z boot=e298bb52 mem=1349384 bal=5667756 swapfree=602900 load1=1.12
2026-11-22T09:35:10Z boot=e298bb52 mem=558616 bal=5797988 swapfree=601076 load1=2.14
2026-11-22T09:36:10Z boot=e298bb52 mem=511420 bal=5886244 swapfree=609412 load1=1.52
2026-11-22T09:37:10Z boot=e298bb52 mem=577524 bal=5726312 swapfree=605992 load1=1.88
2026-11-22T09:38:10Z boot=e298bb52 mem=607308 bal=5726020 swapfree=611864 load1=1.68
2026-11-22T09:39:10Z boot=e298bb52 mem=625324 bal=5824712 swapfree=612200 load1=1.90
2026-11-22T09:40:10Z boot=e298bb52 mem=550024 bal=5917580 swapfree=613428 load1=0.82
2026-11-22T09:41:10Z boot=e298bb52 mem=877904 bal=6019220 swapfree=610088 load1=0.49
2026-11-22T09:42:10Z boot=e298bb52 mem=1650416 bal=5307884 swapfree=607716 load1=1.13
2026-11-22T09:43:10Z boot=e298bb52 mem=1052192 bal=5045740 swapfree=623580 load1=2.22
2026-11-22T09:44:10Z boot=e298bb52 mem=833224 bal=5194040 swapfree=628144 load1=1.77
2026-11-22T09:45:10Z boot=e298bb52 mem=1055348 bal=5112104 swapfree=618052 load1=1.87
2026-11-22T09:46:10Z boot=e298bb52 mem=788188 bal=5257000 swapfree=614212 load1=1.76
2026-11-22T09:47:10Z boot=e298bb52 mem=844112 bal=5402524 swapfree=613760 load1=0.86
2026-11-22T09:48:10Z boot=e298bb52 mem=732828 bal=5540916 swapfree=610264 load1=0.51
2026-11-22T09:49:10Z boot=e298bb52 mem=1698216 bal=5217808 swapfree=609704 load1=0.22
2026-11-22T09:50:10Z boot=e298bb52 mem=1536100 bal=5412108 swapfree=610560 load1=0.08
2026-11-22T09:51:10Z boot=e298bb52 mem=1351884 bal=5589592 swapfree=611064 load1=0.03
2026-11-22T09:52:10Z boot=e298bb52 mem=1191900 bal=5750096 swapfree=611228 load1=0.01
2026-11-22T09:53:10Z boot=e298bb52 mem=1052944 bal=5896088 swapfree=611488 load1=0.00
2026-11-22T09:54:10Z boot=e298bb52 mem=952612 bal=6029604 swapfree=612248 load1=0.06
2026-11-22T09:55:10Z boot=e298bb52 mem=820276 bal=6151328 swapfree=607500 load1=0.22
2026-11-22T09:56:10Z boot=e298bb52 mem=733288 bal=6260552 swapfree=620756 load1=0.18
2026-11-22T09:57:10Z boot=e298bb52 mem=625240 bal=6360812 swapfree=620684 load1=0.06
2026-11-22T09:58:10Z boot=e298bb52 mem=562884 bal=6443824 swapfree=619908 load1=0.15
2026-11-22T09:59:10Z boot=e298bb52 mem=544276 bal=6443824 swapfree=619076 load1=0.05
2026-11-22T10:00:10Z boot=e298bb52 mem=548328 bal=6443824 swapfree=622124 load1=0.14
2026-11-22T10:01:10Z boot=e298bb52 mem=539688 bal=6443824 swapfree=622448 load1=0.09
2026-11-22T10:02:10Z boot=e298bb52 mem=533368 bal=6443824 swapfree=622236 load1=0.21
2026-11-22T10:03:10Z boot=e298bb52 mem=511380 bal=6443824 swapfree=622964 load1=0.08
2026-11-22T10:04:10Z boot=e298bb52 mem=527404 bal=6443824 swapfree=622172 load1=0.13
2026-11-22T10:05:10Z boot=e298bb52 mem=525020 bal=6443824 swapfree=622036 load1=0.09
2026-11-22T10:06:10Z boot=e298bb52 mem=527040 bal=6443824 swapfree=621700 load1=0.03
2026-11-22T10:07:10Z boot=e298bb52 mem=521552 bal=6443824 swapfree=621112 load1=0.01
2026-11-22T10:08:10Z boot=e298bb52 mem=520480 bal=6443824 swapfree=621548 load1=0.10
2026-11-22T10:09:10Z boot=e298bb52 mem=514076 bal=6443824 swapfree=621804 load1=0.03
2026-11-22T10:10:10Z boot=e298bb52 mem=516212 bal=6443824 swapfree=621732 load1=0.01
2026-11-22T10:11:10Z boot=e298bb52 mem=541228 bal=6443824 swapfree=621872 load1=0.00
2026-11-22T10:12:10Z boot=e298bb52 mem=533700 bal=6443824 swapfree=621716 load1=0.00
2026-11-22T10:13:10Z boot=e298bb52 mem=526252 bal=6443824 swapfree=621932 load1=0.00
2026-11-22T10:14:10Z boot=e298bb52 mem=524200 bal=6443824 swapfree=622492 load1=0.00
2026-11-22T10:15:10Z boot=e298bb52 mem=523252 bal=6443824 swapfree=622560 load1=0.04
2026-11-22T10:16:10Z boot=e298bb52 mem=614072 bal=6443824 swapfree=729452 load1=0.05
2026-11-22T10:17:10Z boot=e298bb52 mem=594256 bal=6443824 swapfree=745788 load1=0.02
2026-11-22T10:18:10Z boot=e298bb52 mem=582948 bal=6443824 swapfree=745832 load1=0.23
2026-11-22T10:19:10Z boot=e298bb52 mem=589492 bal=6443824 swapfree=745864 load1=0.17
2026-11-22T10:20:10Z boot=e298bb52 mem=593720 bal=6443824 swapfree=745964 load1=0.39
2026-11-22T10:21:10Z boot=e298bb52 mem=589672 bal=6443824 swapfree=746164 load1=0.14
2026-11-22T10:22:11Z boot=e298bb52 mem=576512 bal=6443824 swapfree=746472 load1=0.05
2026-11-22T10:23:11Z boot=e298bb52 mem=565440 bal=6443824 swapfree=746456 load1=0.02
2026-11-22T10:24:11Z boot=e298bb52 mem=582460 bal=6443824 swapfree=745012 load1=0.00
2026-11-22T10:25:11Z boot=e298bb52 mem=578780 bal=6443824 swapfree=745048 load1=0.00
2026-11-22T10:26:11Z boot=e298bb52 mem=569108 bal=6443824 swapfree=744484 load1=0.03
2026-11-22T10:27:11Z boot=e298bb52 mem=594916 bal=6443824 swapfree=742824 load1=0.01
2026-11-22T10:28:11Z boot=e298bb52 mem=579740 bal=6443824 swapfree=743084 load1=0.00
2026-11-22T10:29:11Z boot=e298bb52 mem=554988 bal=6443824 swapfree=743536 load1=0.00
2026-11-22T10:30:11Z boot=e298bb52 mem=557576 bal=6443824 swapfree=743616 load1=0.00
2026-11-22T10:31:11Z boot=e298bb52 mem=561880 bal=6443824 swapfree=741624 load1=0.20
2026-11-22T10:32:11Z boot=e298bb52 mem=558144 bal=6443824 swapfree=741956 load1=0.07
2026-11-22T10:33:11Z boot=e298bb52 mem=547980 bal=6443824 swapfree=742336 load1=0.02
2026-11-22T10:34:11Z boot=e298bb52 mem=547356 bal=6443824 swapfree=742740 load1=0.13
2026-11-22T10:35:11Z boot=e298bb52 mem=543068 bal=6443824 swapfree=748508 load1=0.23
2026-11-22T10:36:11Z boot=e298bb52 mem=538468 bal=6443824 swapfree=748012 load1=0.08
2026-11-22T10:37:11Z boot=e298bb52 mem=545180 bal=6443824 swapfree=748064 load1=0.07
2026-11-22T10:38:11Z boot=e298bb52 mem=554036 bal=6443824 swapfree=748092 load1=0.02
2026-11-22T10:39:11Z boot=e298bb52 mem=551112 bal=6443824 swapfree=748120 load1=0.09
2026-11-22T10:40:11Z boot=e298bb52 mem=558664 bal=6443824 swapfree=748148 load1=0.08
2026-11-22T10:41:11Z boot=e298bb52 mem=529184 bal=6443824 swapfree=752624 load1=0.03
2026-11-22T10:42:11Z boot=e298bb52 mem=559608 bal=6443824 swapfree=758656 load1=0.38
2026-11-22T10:43:11Z boot=e298bb52 mem=544748 bal=6443824 swapfree=753872 load1=0.30
2026-11-22T10:44:11Z boot=e298bb52 mem=559080 bal=6443824 swapfree=753784 load1=0.11
2026-11-22T10:45:11Z boot=e298bb52 mem=537296 bal=6443824 swapfree=750064 load1=0.04
2026-11-22T10:46:11Z boot=e298bb52 mem=541048 bal=6443824 swapfree=751704 load1=0.01
2026-11-22T10:47:11Z boot=e298bb52 mem=541544 bal=6443824 swapfree=751464 load1=0.00
2026-11-22T10:48:11Z boot=e298bb52 mem=541708 bal=6443824 swapfree=751632 load1=0.06
2026-11-22T10:49:11Z boot=e298bb52 mem=542500 bal=6443824 swapfree=750572 load1=0.02
2026-11-22T10:50:11Z boot=e298bb52 mem=539544 bal=6443824 swapfree=749504 load1=0.01
2026-11-22T10:51:11Z boot=e298bb52 mem=538840 bal=6443824 swapfree=749592 load1=0.00
2026-11-22T10:52:11Z boot=e298bb52 mem=542412 bal=6443824 swapfree=748488 load1=0.00
2026-11-22T10:53:11Z boot=e298bb52 mem=547952 bal=6443824 swapfree=747652 load1=0.09
2026-11-22T10:54:11Z boot=e298bb52 mem=519284 bal=6443824 swapfree=748020 load1=0.15
```

---

## Phụ lục — headroom log (52 dòng, 14 lần đo hợp lệ + 2 lần đo lỗi)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round169-t9/headroom-log-FROZEN.txt` — không gõ lại bằng tay (xem F-164-T9-10).

```
=== probe-open 2026-11-22T08:43:24Z boot=c44cc3ba tran=63747
python3: can't open file '/home/hatch/k8-headroom.py': [Errno 2] No such file or directory
python3: can't open file '/home/hatch/k8-headroom.py': [Errno 2] No such file or directory
ENOSPC-count=3
mem: MemAvailable:     834168 kB | Balloon:         6045220 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-open-RETRY 2026-11-22T08:44:16Z boot=c44cc3ba tran=63747
0
0
ENOSPC-count=4
mem: MemAvailable:     533068 kB | Balloon:         5727976 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T09:14:14Z boot=c44cc3ba tran=63747
0
0
ENOSPC-count=30
ENOSPC-last: Nov 22 09:13:48 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     887964 kB | Balloon:         5884612 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-window-78 2026-11-22T09:16:09Z boot=e298bb52 tran=63747 btime=2026-11-22 09:14:38
0
0
ENOSPC-count=0
mem: MemAvailable:    1705152 kB | Balloon:         5163460 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T09:46:09Z boot=e298bb52 tran=63747
0
0
ENOSPC-count=23
ENOSPC-last: Nov 22 09:46:06 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     793800 kB | Balloon:         5257000 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-22T10:16:09Z boot=e298bb52 tran=63747
2
2
ENOSPC-count=24
ENOSPC-last: Nov 22 09:47:16 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     597436 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-4 2026-11-22T10:46:09Z boot=e298bb52 tran=63747
2
2
ENOSPC-count=24
ENOSPC-last: Nov 22 09:47:16 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     540644 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-close 2026-11-22T10:54:29Z boot=e298bb52 tran=63747
2
2
ENOSPC-count=24
mem: MemAvailable:     494336 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```
