# LIMITS — Phase 9 đợt 164, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ mười tám liên tiếp; headroom 0 lúc đóng, dưới ngưỡng lần thứ 24 liên tiếp; CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT LẦN THỨ HAI LIÊN TIẾP (boot #68); balloon 1 EPISODE MỚI E-165 (3 chuỗi, 35 mẫu, 2 sag — mọi điểm đứt đều quan sát được); E-164 ĐỨT KHÔNG QUAN SÁT ĐƯỢC CHÍNH XÁC; ENOSPC ≥53 dòng (cận dưới); reboot #68 GIỮA PHIÊN)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 0 lúc đóng (5 lần đo cuối [2, 0, 0, 0, 0]), dưới ngưỡng < ~1.800 lần thứ hai mươi bốn liên tiếp** — giá trị ổn định đợt này là **0** (khác đợt 163: 2). Trần thay đổi theo boot: **63.756 trên #67, 63.747 trên #68** (đợt 163: 63.756 trên #65, 63.747 trên #66). Quyết (k) đợt 163 "GIỮ quyết (k) chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT — LẦN THỨ HAI LIÊN TIẾP (đợt 163 + 164):** trên boot mới #68 (btime 18:06:30Z), headroom **30.001 (chạm CAP 30.000) cả hai probe lúc 18:07:51Z (boot+81s)** — bảng watch trống hẳn; tới **18:08:22Z (boot+112s) đã về 0**. **Cửa sổ mở trong khoảng boot+81s → boot+112s (< 31 s)** — hẹp hơn đợt 163 (< 40 s: boot+71s → boot+110s). Xem §1.2, F-164-T9-1.
- **Balloon 1 EPISODE MỚI E-165, 35/135 mẫu (25,9%), 3 chuỗi, MỘT boot (#68):** **chuỗi 1: 13 mẫu 18:29:49–18:41:50Z; sag 1: 7 mẫu, thấp nhất 91,6%; chuỗi 2: 10 mẫu 18:49:50–18:58:50Z; sag 2: 4 mẫu, thấp nhất 95,1%; chuỗi 3: 12 mẫu 19:03:50–19:14:51Z.** Gate A đóng suốt cả hai sag → **1 episode** theo tiêu chí cứng đứng (quyết (j) đợt 163); **cả ba điểm đứt đều ĐÃ quan sát được** (18:42:50Z, 18:59:50Z, 19:15:51Z). **Caveat: sag 1 (91,6%, 7 mẫu) SÂU HƠN và DÀI HƠN dip E-163 (94,5%, 4 mẫu) — sâu nhất/dài nhất từng không tách; nếu parent đặt ngưỡng độ sâu/thời gian mới thì E-165 thành 2–3 episode.** Xem §2.2, F-164-T9-5.
- **E-164 đợt 163: ĐỨT KHÔNG QUAN SÁT ĐƯỢC CHÍNH XÁC.** Mẫu ghim cuối 16:52:21Z (đợt 163 đóng); mẫu đầu đợt 164 (17:39:50Z) balloon đã là 5.735.404 kB (89,0%). Điểm đứt nằm trong khoảng (16:52:21Z, 17:39:50Z] (47m29s) có chứa reboot #67 (17:33:27Z) — không phân biệt được đứt trước/trong/sau reboot. E-164 KHÔNG nối sang E-165: trên #67 balloon không ghim lần nào (max 89,7%), E-165 bắt đầu trên #68 sau ~1h37m không ghim. Xem §2.2.
- **RAM:** sampler **135 mẫu, 17:39:50Z–19:53:52Z, HAI boot (#67: 28 mẫu; #68: 107 mẫu)**. Max **2.871.796 kB (2.803,5 MiB = 45,65% guard) lúc 17:56:52Z** trên #67; min **309.116 kB lúc 19:45:52Z** (trong lúc leo gần trần 95,5%, chưa ghim); mean toàn phiên **1.148.242,2 kB — tính bằng 2 cách độc lập (python + awk) KHỚP NHAU và khớp trung bình có trọng số — KHÔNG lặp F-163-T9-1**. Gate A **59/135 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ mười tám liên tiếp.** Xem §2, §3.
- **B2: 36 spike, 30 QUY ĐƯỢC DRIVER CỤ THỂ + 6 load1 dư.** Bão mở đợt #67: 17 spike (17:40:50–17:55:46Z — T1 suite + T2 điều tra mù #96? + T5 replay + hatch daemon); T4 attempt1: 2 spike + attempt2-#67 bị giết: 1 spike (cả 3 do chính WebKit attempt / find T2); bão sau reboot #68: 6 spike (18:07:49–18:11:16Z — apt-get/dpkg replay T5 + hatch daemon + phân tích T4); 18:22:51Z + 18:23:57Z: 2 spike (dpkg/apt-get T5); T4 attempt2-#68 HỢP LỆ: **2 spike TRONG cửa sổ attempt** (19:17:33Z WebKit delta 83 — do chính attempt gây; 19:18:39Z load1 dư — cả hai load1 ≤ 3,24 < 4 nên KHÔNG vi phạm B2 của T4, verdict HỢP LỆ đứng); O8: **3 spike TRONG cửa sổ O8** (19:31:15Z + 19:31:51Z WebKit + 19:32:26Z Chromium renderer — cả ba do chính O8 gây); harness: 2 spike (19:33:37Z + 19:35:43Z WebKit). **0 spike trong cửa sổ ghim E-165 (cả 3 chuỗi).** Delta tick lớn nhất 126 tick/s (ffmpeg). Xem §2.5.
- **Lượt yên WebKit #33 (T4): CÓ LƯỢT HỢP LỆ #29 — chuỗi lượt yên hợp lệ NỐI DÀI (#22 → … → #28 → #29).** Attempt1-#67 (18:00:10–18:03:52Z) KHÔNG HỢP LỆ (lớp B vi phạm load1 max 4,09 + tickCost median 68,0 ms > 60); attempt2-#67 BỊ REBOOT #68 GIẾT giữa chừng (không tính ngân sách); attempt2-#68 (19:16:46–19:20:59Z) ĐẠT (20/20, lớp B 5/5, tickCost median 57,0 ms ≤ 60). Sampler T9 đối chiếu: attempt2-#68 gate A MỞ 3/5, 2 spike B2 trong cửa sổ (đều load1 < 4 — không vi phạm B2). Xem §2.3.
- **REBOOT #68 GIỮA PHIÊN (0c8a94aa, btime 18:06:30Z; gap #67→#68 = 1.983 s — NGẮN NHẤT chuỗi):** sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ hai liên tiếp); khoảng trống phủ sóng trong log **57 s** (18:06:52Z → 18:07:49Z); T9 khởi động lại cả ba lúc 18:07:49Z (boot+79s) và bắt được cửa sổ thoáng headroom ở boot+81s bằng probe tay. T7-164: reboot #68 **viết lại run 164 lần 1, requeue 18:07:17.131Z = btime +47,131 s — TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-165). Xem §5.
- **REBOOT #67 GIỮA HAI ĐỢT (f1d4ce1a, btime 17:33:27Z; gap #66→#67 = 5.202 s):** T7-164 + T2-164 xác nhận KHÔNG PHẢI điểm (m) (0 run đang chạy tại btime, 0 requeue); run 163 SUCCEEDED 17:18:13Z, margin 1.058 s — KHÔNG bị #67 giết (xong trước btime 914 s).
- **ENOSPC THẬT TRONG JOURNAL: ≥18 dòng trên boot #67 (T5 đếm lúc 17:55:51Z; phần còn lại mất theo reboot #68, KHÔNG cộng số ước) + 35 dòng trên boot #68 = ≥53 dòng đếm được (cận dưới). Đợt thứ mười ba liên tiếp bảng watch cạn gây lỗi thật thấy được.** Điểm mới: trên #68, ENOSPC IM 53m06s (18:24:03Z → 19:17:09Z) đúng lúc headroom là 1–2, rồi trở lại khi headroom về 0 — xem §4.
- **T8-164 (đối chiếu):** GATE-FOUND poll=81 lúc 19:29:20Z qua **đường (b)** (postboot-t4 gate0wait, tuổi 889 s — KHÔNG phải đường chuẩn (a) vì POSTBOOT_PASS #68 CHƯA CÓ); O8 DONE 19:32:56Z webkit1=0 webkit2=0 chromium=0 (exit 0 ×3 theo log driver — T8 CHƯA đóng cờ lúc T9 đóng nên chi tiết thuộc T8-164/T10); harness bắt đầu 19:33:17Z, 84l10 exit 0 (19:34:30Z), chromium W1/W2/E4 PASS (19:54–19:55Z — ghi nhận lúc phân tích, sau khi T9 đóng). Chuỗi WebKit FULL PASS 18 → ? chờ T10/parent phán (gate lần này KHÔNG phải đường chuẩn). Xem §5.3.
- **T7-164 (đối chiếu):** run 163 SUCCEEDED 17:18:13Z, margin 1.058 s; run 164 vẫn running lúc đóng — kết cục thuộc T7-165. HB 6/6 + DR 3/3 — cửa lành hoàn toàn đợt thứ ba liên tiếp. Xem §5.4.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round164-t9/k8-headroom.py` (copy y nguyên từ đợt 163 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 164 (15 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 17:40:09Z 21/11 | **0** | #67 f1d4ce1a (btime 17:33:27Z) | 63.756 | lần đo 1, lúc mở (boot+402s); RAM 1.037.240 kB, balloon 5.780.912 kB, load1 ~1,2 (bão mở đợt đã qua đỉnh) |
| 17:40:09Z 21/11 | **0** | #67 f1d4ce1a | 63.756 | lần đo 2 (chênh **0** so với lần 1) |
| 18:07:51Z 21/11 | **30.001** | #68 0c8a94aa (btime 18:06:30Z) | 63.747 | lần đo 3, cặp cửa sổ (boot+81s); **chạm CAP 30.000 — không gặp ENOSPC**; RAM 1.756.568 kB, balloon 5.089.268 kB |
| 18:07:51Z 21/11 | **30.001** | #68 0c8a94aa | 63.747 | lần đo 4, cặp cửa sổ (boot+~85s); **chạm CAP 30.000** |
| 18:08:22Z 21/11 | **0** | #68 0c8a94aa | 63.747 | lần đo 5, window-map-1 (boot+112s); **cửa sổ ĐÃ ĐÓNG**; ENOSPC-count vẫn 0 (dòng ENOSPC đầu tiên trên #68 xuất hiện 7 s sau đó, 18:08:29Z) |
| 18:09:52Z 21/11 | **0** | #68 0c8a94aa | 63.747 | lần đo 6, window-map-2 (boot+202s); ENOSPC-count 2 |
| 18:10:02Z 21/11 | **0** | #68 0c8a94aa | 63.747 | lần đo 7, window-map-3 (boot+212s); ENOSPC-count 2 |
| 18:37:49Z 21/11 | **1** | #68 0c8a94aa | 63.747 | lần đo 8 (probe-loop lan-2); balloon ĐANG GHIM TRẦN (E-165 chuỗi 1), RAM 528.964 kB |
| 18:37:49Z 21/11 | **2** | #68 0c8a94aa | 63.747 | lần đo 9 (chênh **+1** so với lần 8 — lần duy nhất trong đợt hai lần đo liên tiếp chênh nhau; xem §1.2 cuối) |
| 19:07:49Z 21/11 | **2** | #68 0c8a94aa | 63.747 | lần đo 10 (probe-loop lan-3); balloon ĐANG GHIM TRẦN (E-165 chuỗi 3), RAM 547.676 kB |
| 19:07:49Z 21/11 | **2** | #68 0c8a94aa | 63.747 | lần đo 11 (chênh **0**) |
| 19:37:49Z 21/11 | **0** | #68 0c8a94aa | 63.747 | lần đo 12 (probe-loop lan-4); balloon 5.397.612 kB, RAM 1.022.492 kB; ENOSPC-count 22 (dòng mới nhất đúng lúc probe, 19:37:49Z) |
| 19:37:49Z 21/11 | **0** | #68 0c8a94aa | 63.747 | lần đo 13 (chênh **0**) |
| 19:53:55Z 21/11 | **0** | #68 0c8a94aa | 63.747 | lần đo 14 (đóng phiên); balloon 5.785.504 kB, RAM 584.664 kB; ENOSPC-count 35 |
| 19:53:55Z 21/11 | **0** | #68 0c8a94aa | 63.747 | lần đo 15 (chênh **0**) |

- Probe dừng ở `i=0` trong 9/15 lần đo; dừng ở `i=1` trong 1 lần đo (18:37:49Z — lần đầu tiên giá trị 1 xuất hiện kể từ đợt 162 trở lại đây); dừng ở `i=2` trong 3 lần đo; chạm CAP 30.000 trong 2 lần đo (cặp cửa sổ 18:07:51Z — đúng cơ chế dừng của probe, không phải sự cố; stderr `CAP 30000 reached without ENOSPC`). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi cặp đo / mỗi lần map).
- **Cửa sổ thoáng sau reboot (boot #68): MỞ lúc boot+81s (≥30.001), ĐÓNG trước boot+112s (0).** Khoảng mở < 31 s — hẹp hơn đợt 163 (< 40 s: boot+71s → boot+110s) và hẹp nhất từng quan sát (đợt 159: cửa sổ ~95–148s với giá trị trung gian 23.503/18.447). Giá trị đỉnh thật của cửa sổ không biết được (probe cap 30.000 — chỉ biết ≥30.001; xem F-163-T9-1, vẫn đứng). ENOSPC đầu tiên trên #68 (18:08:29Z, boot+119s) xuất hiện 7 s SAU khi headroom về 0 (boot+112s) — khác đợt 163 (ENOSPC đầu tiên trùng đúng mốc cửa sổ đóng, boot+110s).
- **Cửa sổ thoáng sau reboot #67: KHÔNG QUAN SÁT ĐƯỢC (xem F-164-T9-1).** Đợt mở 17:35:51Z (boot+144s), T9 nhận việc 17:39:17Z (boot+350s), lần đo đầu 17:40:09Z (boot+402s) đã là 0. ENOSPC đầu tiên trên #67 lúc 17:36:35Z (boot+188s) — nếu có cửa sổ thì nó đã đóng trong khoảng boot+144s → boot+188s, trước khi T9 kịp đo. T9 không claim cửa sổ #67 có hay không.
- **So sánh với đợt 163:** đợt 163 mở 0 trên #65 (6 lần đo đều 0) → reboot #66 giữa phiên → thoáng ≥30.001 trong <40 s → 0 (2 lần) → **2 ổn định 5 lần đo tới đóng**. Đợt này mở 0 trên #67 (2 lần đo đều 0) → reboot #68 giữa phiên → thoáng ≥30.001 trong <31 s → 0 (3 lần) → **1, 2 (2 lần đo lan-2/lan-3 — headroom nhích lên 1–2 trong lúc E-165 đang ghim, ENOSPC im 53 phút, xem §4)** → 0 (4 lần đo tới đóng). **Cửa sổ thoáng sau reboot ĐƯỢC quan sát lần thứ hai liên tiếp** (đợt 163 + 164) — hai lần liên tiếp đều nhờ reboot xảy ra GIỮA phiên nên T9 có mặt đúng lúc.
- Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 0 = **63.747 watch** (bảng đầy hẳn, 0 slot trống) trên #68.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** — một vite mới (~1.578 watch) vẫn không khởi động được.
- T5-164 KHÔNG probe lại headroom đợt này (như đợt 151–163) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 15 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #67 có ≥18 dòng + journal boot #68 có 35 dòng systemd không thêm được inotify watch do ENOSPC (xem §4)** — cùng kết luận bằng nguồn khác.
- **Trần thay đổi theo boot: 63.756 trên #67, 63.747 trên #68** (đợt 163: 63.756 trên #65, 63.747 trên #66; đợt 162: 63.747 trên #64). T9 chỉ ghi số đo, không phán cơ chế.
- Lưu ý: lần đo 8–9 (lan-2, 18:37:49Z) chênh nhau +1 (1 rồi 2) — lần duy nhất trong đợt hai lần đo liên tiếp trong một cặp chênh nhau (mọi cặp khác đều chênh 0). T9 ghi đúng số đo, không làm tròn hay gộp; giá trị 1 là giá trị đo được thật (probe dừng ở i=1 do ENOSPC), không phải lỗi probe (probe chạy lại ngay sau đó cho 2 — bảng watch có 1 slot được nhả giữa hai lần đo, xem §4: ENOSPC im trong khoảng này).
- Lưu ý: RAM lúc đóng (~584.664 kB) thấp hơn nhiều RAM lúc mở (~1.037.240 kB) trong khi headroom 0 → 0. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop lan-5 (dự kiến ~20:07:49Z) KHÔNG chạy — probe-loop đã dừng lúc T9 đóng (19:53:57Z); cặp probe đóng 19:53:55Z thay thế. Probe-loop đợt này khởi động lại sau reboot #68 nên nhãn "probe-lan-2" chỉ xuất hiện MỘT lần (18:37:49Z) — KHÔNG lặp F-163-T9-6 (nhãn trùng sau khởi động lại).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–163 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **164** | **0 → 30.001 (thoáng, boot+81s) → 0** | **mở 17:40:09Z boot #67 f1d4ce1a btime 17:33:27Z (trần 63.756): 0, 0 (17:40:09Z) → sau reboot #68 18:06:30Z boot MỚI 0c8a94aa (trần 63.747): 30.001, 30.001 lúc boot+81s → 0 ×3 (boot+112s/202s/212s) → 1, 2 lúc 18:37:49Z → 2, 2 lúc 19:07:49Z → 0 ×4 (19:37:49–19:53:55Z) → đóng 19:53:55Z cùng boot #68: 0, 0 (MỘT reboot giữa phiên; 15 lần đo, 9 lần 0, 1 lần 1, 3 lần 2, 2 lần 30.001)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 0** (lần đầu đóng 0 kể từ đợt 162; xen giữa đợt 163 đóng 2). Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Giá trị 30.001 chỉ xuất hiện trong cặp cửa sổ boot+81s trên #68, không phải giá trị ổn định (cửa sổ đóng trước boot+112s).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ hai mươi bốn liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 163 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal hai boot đợt này có ≥18 + 35 = ≥53 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười ba liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng đếm được — cận dưới, phần còn lại boot #67 mất theo reboot #68). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong từng boot** (63.756 trên #67 suốt 2 lần đo; 63.747 trên #68 suốt 13 lần đo) nhưng **khác nhau giữa hai boot** (63.756 vs 63.747 — chênh 9). T9 ghi đúng số đo từng boot, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.125.908 kB trên #67 / 8.125.900 kB trên #68 — xem ghi chú; swap 1.048.572 kB) — sampler 135 mẫu, 17:39:50Z–19:53:52Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.125.908 kB ở mẫu đầu #67 và 8.125.900 kB ở #68 (chênh 8 kB giữa hai boot — T9 ghi đúng số đọc được, không phán; mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: RAM cao đầu phiên (bão mở đợt) → balloon leo đều → REBOOT #68 cắt ngang → cửa sổ thoáng headroom → balloon leo lại → ghim trần E-165 (35 mẫu, 3 chuỗi) → xả, đứt đã quan sát → leo lại gần trần rồi xả (không ghim chuỗi 4)

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log 61 s; 0 gap >90 s trong log** — xem §5.1; khoảng trống phủ sóng ĐẦU PHIÊN 383 s tính từ btime #67 tới khi T9 khởi động sampler — xem F-164-T9-2). **135 mẫu, 17:39:50Z–19:53:52Z, HAI boot (#67: 28 mẫu; #68: 107 mẫu).** Tổng quan: **min 309.116 kB (301,9 MiB) lúc 19:45:52Z** (lúc leo gần trần 95,5%, chưa ghim, trên #68); **max 2.871.796 kB (2.803,5 MiB) lúc 17:56:52Z — 45,65% guard** (balloon xả 3.880.720 kB); **mean toàn phiên 1.148.242,2 kB (1.121,3 MiB) — tính bằng 2 cách độc lập (python + awk) KHỚP NHAU và khớp trung bình có trọng số (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 17:39:50–17:53:52Z | #67 | 1.043.424–2.478.948 kB | Mở phiên: BÃO MỞ ĐỢT (17 spike B2 liên tục, load1 tới 10,65 — xem §2.5); balloon xả từ 5.735.404 kB (mẫu đầu) xuống 3.907.188 kB lúc 17:41:50Z rồi leo lại; gate A MỞ 14/15 mẫu (chỉ mẫu đầu 1.043.424 kB thấp hơn gate 5.152 kB); load1 ≥3,0 ở 8/15 mẫu; load1 max 10,07 lúc 17:41:50Z |
| 17:54:52–18:06:52Z | #67 | 1.245.764–2.871.796 kB | Yên sau bão: RAM đỉnh phiên 17:56:52Z (2.871.796 kB, balloon xả 3.880.720 kB); T4 attempt1 (18:00:10–18:03:52Z, KHÔNG HỢP LỆ tickCost 68,0 ms) + attempt2-#67 (18:04:37Z–, BỊ REBOOT #68 GIẾT — xem §2.3); balloon leo lại tới 4.768.880 kB (74,0% trần) lúc 18:06:52Z thì reboot #68 cắt ngang; gate A MỞ 12/12 mẫu; load1 ≥3,0 ở 2/12 mẫu |
| 18:07:49–18:28:49Z | #68 | 658.660–2.590.560 kB | Boot mới: bão sau reboot (6 spike B2 18:07:49–18:11:16Z — apt-get/dpkg replay T5 + hatch daemon, xem §2.5); cửa sổ thoáng headroom (boot+81s, xem §1.2); balloon leo từ 5.089.268 kB lên 6.360.592 kB (98,7% trần lúc 18:28:49Z — đang leo tới lần ghim đầu); gate A MỞ 13/22 mẫu; RAM min giai đoạn 658.660 kB lúc 18:25:49Z (balloon 6.285.896 kB, 97,6% trần); RAM max boot #68 đợt này 2.590.560 kB lúc 18:11:49Z (41,18% guard) |
| 18:29:49–19:14:51Z | #68 | 409.760–923.284 kB | **Ghim trần E-165, 35 mẫu trong 3 chuỗi + 2 sag** (xem §2.2); **RAM min trong cửa sổ ghim 409.760 kB** (chuỗi 3, 19:03:50Z); gate A ĐÓNG cả 46 mẫu cửa sổ (35 ghim + 11 sag); load1 ≤1,55; **RAM <512.000 kB: 4 mẫu trong cửa sổ này** (18:40:50Z 505.772; 18:54:50Z 508.236; 18:55:50Z 510.332; 19:03:50Z 409.760 — cả 4 đều lúc balloon ghim trần) |
| 19:15:51–19:41:52Z | #68 | 611.072–2.821.760 kB | Sau E-165: balloon xả về 4.166.652 kB (64,7% trần) lúc 19:21:51Z rồi leo lại tới 5.849.628 kB (90,7% trần) lúc 19:41:52Z; T4 attempt2-#68 HỢP LỆ #29 (19:16:46–19:20:59Z — xem §2.3); O8 (GATE-FOUND 19:29:20Z, O8 DONE 19:32:56Z — 3 spike B2 trong cửa sổ, xem §2.5); harness bắt đầu 19:33:17Z; gate A MỞ 18/27 mẫu; load1 ≤5,42 (mẫu 19:31:51Z, trong cửa sổ O8) |
| 19:42:52–19:53:52Z | #68 | 309.116–1.376.228 kB | Leo gần trần lần hai rồi xả: balloon 5.937.348 → 6.156.532 kB (95,5% trần lúc 19:45:52Z) rồi **xả đột ngột về 5.476.512 kB (85,0%) lúc 19:47:52Z — KHÔNG ghim chuỗi 4**; **RAM min phiên 309.116 kB lúc 19:45:52Z** (trong lúc leo gần trần, chưa ghim); **RAM <512.000 kB: 5 mẫu trong cửa sổ này** (19:42:52Z 502.436; 19:43:52Z 459.380; 19:44:52Z 353.728; 19:45:52Z 309.116; 19:46:52Z 382.432 — cả 5 đều lúc balloon 92–96% trần, chưa ghim); gate A MỞ 1/12 mẫu (chỉ 19:49:52Z 1.376.228 kB) |

- **Gate A ≥1024 MiB: 59/135 mẫu** (#67: 27/28; #68: 32/107); **0 mẫu ≥ guard**; load1 max (sampler) **10,07 lúc 17:41:50Z** (bão mở đợt — watcher bắt 10,65 lúc 17:42:01Z, xem §2.5); **16/135 mẫu load1 ≥3,0** (phân bổ theo giai đoạn: 8 + 2 + 3 + 0 + 3 + 0 = 16 — xem bảng trên). **RAM <512.000 kB: 9 mẫu** (4 trong cửa sổ ghim E-165 + 5 trong lúc leo gần trần 19:42:52–19:46:52Z — xem danh sách cuối §2.1); **RAM <300.000 kB: 0 mẫu** (đợt 163: 0 mẫu; đợt 162: 0 mẫu; đợt 161: 0 mẫu; đợt 158: 4 mẫu).
- Swap: SwapFree 873.548 kB (mẫu đầu) → 626.704 kB (thấp nhất phiên, lúc 19:47:52Z) → 631.860 kB (mẫu cuối). Nhịp nhảy SwapFree sau reboot #68: 691.444 kB (mẫu cuối #67, 18:06:52Z) → 1.039.968 kB (mẫu đầu #68, 18:07:49Z) — swap được nhả ~348.524 kB qua reboot (đợt 163: 642.272 → 1.007.972 kB qua reboot #66 — T9 ghi số đợt 163 theo LIMITS T9-163, không verify lại).
- Mẫu 17:56:52Z (đỉnh phiên): RAM 2.871.796 kB, balloon xả 3.880.720 kB — balloon xả sâu nhất phiên ~4 phút sau bão mở đợt (cùng mẫu đợt 152–163: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 309.116 kB (đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — 9 mẫu <512.000 kB trong 135 mẫu (6,7% — thấp hơn hẳn đợt 163: 18 mẫu, 13,5%, vì đợt này ghim ít hơn: 35 mẫu so với 49 mẫu); riêng trong cửa sổ ghim E-165: 4/35 mẫu <512.000 kB (11,4%); trong lúc leo gần trần 19:42:52–19:46:52Z: 5/5 mẫu <512.000 kB (100% — RAM trũng nhất phiên nằm ở đây, KHÔNG phải trong cửa sổ ghim). T8-164 đo độc lập RAM trong lúc O8/harness: xem §5.3 (sampler T9 là nguồn duy nhất cho trũng ghim).

**Bảng tổng hợp số RAM (từ script `t9-164-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 135 dòng — KHÔNG tính tay, đã đối chiếu lại từ log đóng băng lúc đóng cờ bằng script `t9-164-recheck.py`):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #67 f1d4ce1a | 28 | 1.043.424 | 2.871.796 | 1.951.135,9 | 27/28 | 0 | 10,07 | 0 |
| #68 0c8a94aa | 107 | 309.116 | 2.821.760 | 938.139,2 | 32/107 | 35 | 5,42 | 9 |
| **Toàn phiên** | **135** | **309.116** | **2.871.796** | **1.148.242,2** | **59/135** | **35/135 (25,9%)** | **10,07** | **9** |

- **Mean toàn phiên 1.148.242,2 kB — tính bằng 2 cách độc lập: python `sum/n = 1.148.242,2` VÀ awk `sum/n = 1.148.242,2` — KHỚP NHAU TỪNG SỐ THẬP PHÂN; đối chiếu trung bình có trọng số từ mean từng boot: (28×1.951.135,9 + 107×938.139,2)/135 = 1.148.242,2 — KHỚP. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163). Mean từng boot cũng khớp python/awk từng số (xem §6).
- 9 mẫu RAM <512.000 kB (từ log đóng băng): 18:40:50Z 505.772 (ghim, chuỗi 1); 18:54:50Z 508.236 (ghim, chuỗi 2); 18:55:50Z 510.332 (ghim, chuỗi 2); 19:03:50Z 409.760 (ghim, chuỗi 3); 19:42:52Z 502.436 (leo 92,1%); 19:43:52Z 459.380 (leo 93,4%); 19:44:52Z 353.728 (leo 94,5%); 19:45:52Z 309.116 (leo 95,5% — min phiên); 19:46:52Z 382.432 (leo 95,2%).

### 2.2 Balloon virtio — 1 EPISODE MỚI E-165, 35/135 mẫu, 3 chuỗi, MỘT boot (#68) + E-164 đứt không quan sát được chính xác

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #67 (f1d4ce1a): GHIM TRẦN 0/28 mẫu (0%) — KHÔNG ghim lần nào.** Balloon max 5.735.404 kB (89,0% trần) lúc 17:39:50Z (mẫu đầu); max quan sát trong phiên trên #67 là 5.780.912 kB (89,7% trần) lúc 17:40:09Z (dòng mem của probe headroom). Balloon xả sâu tới 3.880.720 kB (60,2% trần) lúc 17:56:52Z rồi leo lại tới 4.768.880 kB (74,0% trần) lúc 18:06:52Z thì reboot #68 cắt ngang.
- **Boot #68 (0c8a94aa): GHIM TRẦN 35/107 mẫu (32,7%), trong 3 chuỗi — 1 EPISODE (E-165):**
  - Leo lên trần lần 1: từ 18:07:49Z (5.089.268 kB) lên 6.360.592 kB (98,7% trần) lúc 18:28:49Z trong ~21 phút, rồi ghim chuỗi 1 lúc 18:29:49Z.
  - **E-165 — chuỗi 1: 18:29:49–18:41:50Z, 13 mẫu** (span 721 s, 12 phút); RAM min trong chuỗi 505.772 kB lúc 18:40:50Z.
  - **Sag 1: 18:42:50–18:48:50Z, 7 mẫu** — balloon 6.247.216 kB (96,9% trần) lúc 18:42:50Z → thấp nhất **5.901.376 kB (91,6% trần)** lúc 18:43:50Z → leo lại tới sát trần trước chuỗi 2; RAM trong sag tối đa **923.284 kB, gate A KHÔNG mở lần nào**; 0 mẫu trong sag dưới 512.000 kB.
  - **E-165 — chuỗi 2: 18:49:50–18:58:50Z, 10 mẫu** (span 540 s, 9 phút); RAM min trong chuỗi 508.236 kB lúc 18:54:50Z (510.332 kB lúc 18:55:50Z cũng <512k). (Đính chính đếm tay sơ bộ: T9 đếm tay chuỗi này là 9 mẫu trong các bản tin trạng thái giữa phiên — script đếm lại từ log đóng băng là **10 mẫu**; xem F-164-T9-5. Số đúng trong file này là 10.)
  - **Sag 2: 18:59:50–19:02:50Z, 4 mẫu** — balloon 6.126.256 kB (95,1% trần) lúc 18:59:50Z là điểm thấp nhất, rồi leo lại tới 6.432.812 kB (99,8% trần) lúc 19:02:50Z; RAM trong sag tối đa **852.132 kB, gate A KHÔNG mở lần nào**.
  - **E-165 — chuỗi 3: 19:03:50–19:14:51Z, 12 mẫu** (span 661 s, 11 phút); RAM min chuỗi 409.760 kB lúc 19:03:50Z (mẫu ghim đầu chuỗi 3).
  - **ĐỨT ĐÃ QUAN SÁT ĐƯỢC (cả ba chuỗi): chuỗi 1 đứt 18:42:50Z** (balloon xả về 96,9%); **chuỗi 2 đứt 18:59:50Z** (xả về 95,1%); **chuỗi 3 đứt 19:15:51Z** (balloon xả về 6.050.608 kB = 93,9% trần); RAM nhảy lên 962.820 kB.
  - Sau chuỗi 3: balloon xả về 4.166.652 kB (64,7% trần) lúc 19:21:51Z, leo lại tới 6.156.532 kB (95,5% trần) lúc 19:45:52Z rồi **xả đột ngột về 5.476.512 kB (85,0%) lúc 19:47:52Z — KHÔNG ghim chuỗi 4** (xem §2.1).
- **Tổng ghim trần đợt này: 35/135 mẫu (25,9%)** (đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **1 episode mới (E-165: 35 mẫu / 3 chuỗi / 1 boot, cả ba điểm đứt đều quan sát được)** — khác đợt 163 (2 episode, 2 boot, E-164 còn mở) và đợt 162 (1 episode, 1 boot, còn mở).
- **Phán theo quy tắc quyết (e)/(g) + quyết (j) đợt 163 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-165 (chuỗi 1+2+3): 1 EPISODE.** Ba chuỗi cùng boot, cách nhau bởi 2 sag — gate A đóng suốt cả hai sag. Theo tiêu chí cứng đứng (gate A có mở trong sag hay không — quy tắc (g) đợt 152 + quyết (k) đợt 157/158/159 + quyết (j) đợt 160 + quyết (j) đợt 161 + quyết (j) đợt 162 + quyết (j) đợt 163 đã CHẤP NHẬN cách đếm 1 episode cho E-163 đợt 163 trên đúng tiêu chí này), các sag KHÔNG tách: sag 1 (91,6%, 7 mẫu) và sag 2 (95,1%, 4 mẫu) đều có gate A đóng suốt — đếm 1 episode là chắc chắn dưới tiêu chí đứng. **Caveat (xem F-164-T9-5/F-164-T9-9):** sag 1 SÂU HƠN (91,6% so với 94,5%) và DÀI HƠN (7 mẫu so với 4 mẫu) dip E-163 — sag sâu nhất/dài nhất từng không tách; nếu parent đặt ngưỡng độ sâu (ví dụ sag <92% thì tách) thì E-165 tách thành 2 episode (chuỗi 1 | chuỗi 2+3); nếu đặt thêm ngưỡng thời gian (ví dụ sag >5 mẫu thì tách) thì thành 3 episode; T9 trình rõ để parent quyết, không giấu điểm khác biệt. E-165 là episode đầu tiên có 3 chuỗi.
  - **Đợt 164 = 1 EPISODE GHIM MỚI** (E-165: 35 mẫu / 3 chuỗi / 1 boot, đã đứt hoàn toàn, mọi điểm đứt quan sát được).
  - **E-164 đợt 163 (theo dõi, giao T10 ghi nhận): đứt KHÔNG quan sát được chính xác.** Balloon lúc T9-164 mở (17:39:50Z) đã là 5.735.404 kB (89,0% trần) và không ghim lần nào trên #67; khoảng trống không quan sát 16:52:21Z → 17:39:50Z (47m29s) có chứa reboot #67 (17:33:27Z) nên điểm đứt E-164 không xác định được trong khoảng đó (xem F-164-T9-2). E-164 không nối sang E-165: giữa lần ghim cuối E-164 (16:52:21Z, boot #66) và lần chạm đầu E-165 (18:29:49Z, boot #68) có **HAI reboot (#67 + #68) + balloon xả về 3.880.720 kB (60,2% trần) lúc 17:56:52Z + ~1h37m không ghim**.
  - **E-164 không nối sang E-165 theo bất kỳ tiêu chí nào** (khác boot ×2, có 2 reboot ở giữa, xả sâu, khoảng trống dài).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~409–594.000 kB trong khi tổng RAM 8.125.900 kB − balloon 6.443.824 kB = 1.682.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ ghim E-165 chuỗi 3 (19:14:51Z): tổng RAM 8.125.900 kB − balloon 6.443.824 kB = 1.682.076 kB còn lại; MemAvailable 578.564 kB (log thật).

### 2.3 Lượt yên WebKit #33 (T4, đợt 164) — CÓ LƯỢT HỢP LỆ #29, CHUỖI NỐI DÀI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-164 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND164_T4_WEBKIT_QUIET33_LIMITS.md`) + cờ `round164-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **Attempt1-f1d4ce1a (18:00:10–18:03:52Z): probe 20/20, lớp B VI PHẠM (B2 load1 max 4,09 > 4) + tickCost median 68,0 ms > 60 — KHÔNG HỢP LỆ, KHÔNG cộng dồn.**
- **Attempt2-f1d4ce1a (18:04:37Z–): BỊ REBOOT #68 GIẾT giữa chừng — KHÔNG tính ngân sách** (không có attempt-done; poller khởi động lại bằng tay 18:11:09Z).
- **Attempt2-0c8a94aa (19:16:46–19:20:59Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 57,0 ms ≤ 60 — HỢP LỆ, ngân sách 3/3 dùng 2/3 theo nghĩa attempt-done; poller thoát vì LUOT HOP LE.**
- **Kết luận T9 (đối chiếu bằng dữ kiện sampler độc lập, không phán lại T4): CÓ 1 attempt hợp lệ cho lượt yên #33 (#29)** — chuỗi lượt yên hợp lệ **NỐI DÀI lên #29** (#22 đợt 157 → #23 đợt 158 → #24 đợt 159 → #25 đợt 160 → #26 đợt 161 → #27 đợt 162 → #28 đợt 163 → #29 đợt 164).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#67: gate A MỞ **4/4 mẫu** trong cửa sổ (các mẫu 18:00:52Z 1.765.376 kB; 18:01:52Z 1.539.860 kB; 18:02:52Z 1.998.228 kB; 18:03:52Z 2.008.956 kB — cả 4 đều ≥1024 MiB). Tải: sampler load1 trong cửa sổ attempt1 **1,35–3,62**; **2 spike B2 trong cửa sổ attempt1** (18:01:21Z WebKit delta 66 + 18:01:56Z find delta 16 — xem §2.5).
  - Attempt2-#67 (bị giết): gate A MỞ **2/2 mẫu** trong cửa sổ (18:04:52Z 1.245.764 kB; 18:05:52Z 1.259.100 kB). **1 spike B2 trong cửa sổ** (18:05:31Z WebKit delta 89).
  - Attempt2-#68 (HỢP LỆ #29): gate A MỞ **3/5 mẫu** trong cửa sổ (19:16:51Z 924.728 kB — thấp hơn gate 123.848 kB; 19:17:51Z 615.272 kB — thấp hơn gate 433.304 kB; 19:18:51Z 1.352.832 kB; 19:19:51Z 1.190.928 kB; 19:20:51Z 1.695.032 kB — 3 mẫu sau đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt2-#68 **0,91–2,97**; **2 spike B2 trong cửa sổ attempt2-#68** (19:17:33Z WebKit delta 83 + 19:18:39Z load1 dư — xem §2.5). **KHÁC đợt 163 (0 spike trong cửa sổ attempt): đợt này CÓ 2 spike trong cửa sổ attempt hợp lệ — nhưng cả hai đều load1 ≤ 3,24 < 4 nên KHÔNG vi phạm B2 của T4 (load1 max ≤ 4); spike 19:17:33Z do chính process attempt gây (WebKitWebProcess của attempt2-#68); verdict HỢP LỆ của T4 ĐỨNG.**
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cả ba cửa sổ attempt**.
- **Cộng dồn mới (29 lượt hợp lệ, theo T4-164): P1 109/112, P2 103/103, P3-A1 93/112, P3' 76/84 occ = 71/74 distinct-seq, P7 63/63.** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 chạy attempt1 18:00:10–18:03:52Z + attempt2-#67 18:04:37Z–bị giết + attempt2-#68 19:16:46–19:20:59Z.

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 18:00:52–18:03:52Z | #67 | 1,35–3,62 (4 mẫu) | 1.539.860–2.008.956 kB — **gate A MỞ 4/4** | T4 attempt1 — **2 spike B2 trong cửa sổ** (18:01:21Z + 18:01:56Z); attempt1 KHÔNG HỢP LỆ (B2 load1 max 4,09 > 4 + tickCost median 68,0 ms > 60) |
| 18:04:52–18:05:52Z | #67 | 1,43–3,14 (2 mẫu) | 1.245.764–1.259.100 kB — **gate A MỞ 2/2** | T4 attempt2-#67 — **1 spike B2 trong cửa sổ** (18:05:31Z); attempt BỊ REBOOT #68 GIẾT, không tính ngân sách |
| 19:16:51–19:20:51Z | #68 | 0,91–2,97 (5 mẫu) | 615.272–1.695.032 kB — **gate A MỞ 3/5** (2 mẫu đầu thấp hơn gate) | T4 attempt2-#68 — **2 spike B2 trong cửa sổ** (19:17:33Z + 19:18:39Z, đều load1 < 4); attempt2 HỢP LỆ #29 (tickCost median 57,0 ms ≤ 60) |

### 2.5 B2 — 36 spike, 30 QUY ĐƯỢC DRIVER CỤ THỂ + 6 load1 dư (0 spike trong cửa sổ ghim E-165; 2 spike TRONG cửa sổ attempt hợp lệ — đều load1 < 4; 3 spike TRONG cửa sổ O8 — cả ba do chính O8 gây)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-164-T9-6). **36 spike: 17 spike bão mở đợt #67 (17:40:50–17:55:46Z) + 2 spike attempt1 T4 + 1 spike attempt2-#67 bị giết + 6 spike bão sau reboot #68 (18:07:49–18:11:16Z) + 2 spike dpkg/apt-get (18:22:51Z + 18:23:57Z) + 2 spike attempt2-#68 HỢP LỆ (19:17:33Z + 19:18:39Z) + 4 spike O8 (19:31:15Z + 19:31:51Z + 19:32:26Z + 19:33:02Z) + 2 spike harness (19:33:37Z + 19:35:43Z); 0 spike trong cửa sổ ghim E-165 (cả 3 chuỗi 18:29:49–18:41:50Z, 18:49:50–18:58:50Z, 19:03:50–19:14:51Z).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt #67 (17 spike liên tục) | 17:40:50–17:55:46Z | 3,13 → 10,65 → 3,13 | 17 | tsc `--noEmit` + vite build + node test `binOrphan60Q7.test.ts` + ffmpeg render/testsrc2 (delta max 126 lúc 17:43:47Z) + ffprobe + PIL + grep/find/blind9696-investigate.py (T2 điều tra mù #96?) + t5-stats-164.py + apt-get/dpkg/perl (T5 replay) + hatch daemon + **1 load1 dư** (17:55:46Z) | **Bão mở đợt 164: T1 verify suite 163 + T2 điều tra mù #96? + T5 replay — ba luồng mở cùng lúc trên boot mới** (xem F-163-T9-3 — cùng mẫu đợt 163). T5 replay (apt-get/dpkg) bắt đầu ngay trong bão (khác đợt 163: replay T5 xảy ra TRƯỚC khi watcher khởi động nên không có trong log B2). Load1 max đợt **10,65 lúc 17:42:01Z** (watcher; sampler bắt 10,07 lúc 17:41:50Z) |
| 2 — T4 attempt1 | 18:01:21Z + 18:01:56Z | 3,02 / 3,81 | 2 | 18:01:21Z: WebKitWebProcess delta **66** + MiniBrowser (chính process attempt1); 18:01:56Z: find `*.log` (T2, delta 16) + hatch daemon | **T4 attempt1-f1d4ce1a** — cả hai spike NẰM TRONG cửa sổ attempt1 (18:00:10–18:03:52Z); attempt1 KHÔNG HỢP LỆ (B2 load1 max 4,09 theo T4 + tickCost 68,0 ms) |
| 3 — T4 attempt2-#67 bị giết | 18:05:31Z | 3,13 | 1 | WebKitWebProcess delta **89** + MiniBrowser (chính process attempt2-#67) | **T4 attempt2-f1d4ce1a** — spike NẰM TRONG cửa sổ attempt2-#67 (18:04:37Z–18:06:30Z); attempt BỊ REBOOT #68 GIẾT, không tính ngân sách |
| 4 — bão sau reboot #68 (6 spike liên tục) | 18:07:49–18:11:16Z | 3,26 → 4,79 → 3,26 | 6 | apt methods/store + hatch daemon (delta 70 lúc 18:07:49Z) + analyze-t4-skiplatest.py (delta 62 lúc 18:10:40Z) + **3 load1 dư** (18:09:00Z, 18:09:35Z, 18:11:16Z — delta max 3/3/8) | **Bão sau reboot #68: T5 replay (apt-get/dpkg) + hatch daemon + phân tích T4** — watcher khởi động lại 18:07:49Z bắt được ngay spike đầu tiên cùng giây (khác bão mở đợt #67: watcher mở cùng lúc sampler). 3/6 spike trong bão này là load1 dư (delta quá nhỏ để giải thích load1 — xem §2.5 cuối) |
| 5 — dpkg/apt-get T5 | 18:22:51Z + 18:23:57Z | 3,10 / 3,25 | 2 | 18:22:51Z: dpkg `--unpack` delta **79**; 18:23:57Z: apt-get delta **75** | **T5 replay (dpkg/apt-get) kéo dài sau reboot** — 2 spike đơn lẻ, cách bão sau reboot ~11 phút |
| 6 — T4 attempt2-#68 HỢP LỆ | 19:17:33Z + 19:18:39Z | 3,24 / 3,16 | 2 | 19:17:33Z: WebKitWebProcess delta **83** + MiniBrowser (chính process attempt2-#68); 19:18:39Z: **load1 dư** (delta max 5 — hatch daemon 8,4% tích lũy, probe T4 5,9% tích lũy) | **T4 attempt2-0c8a94aa** — cả hai spike NẰM TRONG cửa sổ attempt hợp lệ #29 (19:16:46–19:20:59Z); **cả hai đều load1 < 4 nên KHÔNG vi phạm B2 của T4** (ngưỡng load1 max ≤ 4); spike 19:17:33Z do chính attempt gây, như spike 18:01:21Z/18:05:31Z. **KHÁC đợt 163 (0 spike trong cửa sổ attempt)** — đợt này có 2, nhưng không đổi verdict (xem §2.3) |
| 7 — T8 O8 | 19:31:15Z + 19:31:51Z + 19:32:26Z | 3,26 / 5,02 / 5,09 | 3 | 19:31:15Z: WebKitWebProcess delta **89** + MiniBrowser; 19:31:51Z: WebKitWebProcess delta **83** + MiniBrowser delta 47; 19:32:26Z: chrome renderer delta **65** | **T8 O8** — cả ba spike NẰM TRONG cửa sổ O8 (GATE-FOUND 19:29:20Z → O8 DONE 19:32:56Z); driver là chính process O8, không phải tải lạ (cùng mẫu đợt 163: 2 spike O8 do chính O8 gây; đợt này O8 gây 3 spike) |
| 8 — T8 O8/harness (ranh giới) | 19:33:02Z | 3,38 | 1 | hatch daemon 8,6% tích lũy, **delta max 6 — load1 dư** | 6 s SAU O8 DONE (19:32:56Z), 15 s TRƯỚC khi harness bắt đầu (19:33:17Z) — **KHÔNG nằm trong cửa sổ O8 lẫn cửa sổ harness**; phân loại load1 dư, không gán cho O8/harness |
| 9 — T8 harness | 19:33:37Z + 19:35:43Z | 3,13 / 3,03 | 2 | 19:33:37Z: WebKitWebProcess delta **103** + MiniBrowser; 19:35:43Z: WebKitWebProcess delta **103** + MiniBrowser | **T8 harness WebKit** — trong cửa sổ harness (bắt đầu 19:33:17Z, 84l10 exit 0 lúc 19:34:30Z; chromium W1/W2/E4 PASS 19:54–19:55Z — xem §5.3); driver là chính process harness |

- **Tổng kết đếm: 30/36 spike có driver process cụ thể + 6 spike lớp "load1 dư"** (17:55:46Z; 18:09:00Z; 18:09:35Z; 18:11:16Z; 19:18:39Z; 19:33:02Z — xem dưới). Đợt 163: 17/18 quy được + 1 load1 dư; đợt 162: 17/17 quy được; đợt 161: 3/3 quy được; đợt 160: 13/15 quy được + 2 load1 dư. Đợt này tỉ lệ load1 dư cao nhất kể từ đợt 160 (6/36 = 16,7%).
- **6 spike load1 dư (định nghĩa: delta tick max ≤ 15 trong 1 s, không process nào đủ tải để giải thích load1 ≥ 3,0 — theo đúng tiền lệ đợt 160/163):**
  - 17:55:46Z, load1 3,13: top tức thời chỉ có hatch daemon 19,2% + hatch-execd 6,0% (mọi process khác ~0%); delta tick top-3 chỉ 15 + 3 + 0. Không có process nào đủ tải — **load1 dư**.
  - 18:09:00Z, load1 4,02: top tức thời hatch daemon 22,8% tích lũy + apt methods/store 6,2%; delta tick top-3 chỉ 3 + 1 + 0. Không có process nào đủ tải — **load1 dư** (load1 cao nhất trong 6 spike dư, 4,02).
  - 18:09:35Z, load1 3,24: top tức thời hatch daemon 19,5% tích lũy + apt store 4,5%; delta tick top-3 chỉ 3 + 2 + 0. **Load1 dư.**
  - 18:11:16Z, load1 3,26: top tức thời hatch daemon 17,2% tích lũy + apt store 2,6%; delta tick top-3 chỉ 8 + 3 + 0. **Load1 dư.**
  - 19:18:39Z, load1 3,16 (TRONG cửa sổ attempt hợp lệ #29): top tức thời hatch daemon 8,4% tích lũy + probe T4 5,9%; delta tick top-3 chỉ 5 + 3 + 0 (probe T4 delta 0). **Load1 dư** — không gán cho attempt (probe delta 0).
  - 19:33:02Z, load1 3,38 (6 s sau O8 DONE): top tức thời hatch daemon 8,6% tích lũy + hatch-execd 2,8%; delta tick top-3 chỉ 6 + 0 + 0. **Load1 dư** — không gán cho O8/harness.
  - T9 không giấu 6 spike này vào nhóm "quy được" (cùng mẫu F-163-T9-9).
- **Caveat đếm (F-164-T9-6 + F-164-T9-7):** chuỗi `ps -eo args` xuất hiện **1 lần** trong b2-spikes-FROZEN.log (spike 17:49:05Z, pid 25463, ppid 25462, 33,3% tích lũy) — là **lệnh `ps` ngắn ngủi của một luồng khác, chủ không xác định được** (pid/ppid đều đã chết lúc phân tích); **KHÔNG phải lệnh `ps` của watcher** (watcher dùng `ps -eo pid,ppid,%cpu,%mem,args` và `ps -eo pid,args` — cả hai đều đã loại theo quyết (n) đợt 150; 0 lần watcher tự lọt top với vai trò driver). Fix (n) đợt 150 VẪN ĐÓNG. `grep -c 'WebKit\|MiniBrowser'` = **42 dòng** (spike attempt1 + attempt2-#67 + attempt2-#68 + O8 ×2 + harness ×2 — WebKit xuất hiện trong 7/36 spike). Spike 17:47:53Z (ffmpeg sine 100% tích lũy, delta 0 — pid chết giữa chừng trong vòng delta 1 s) quy driver bằng ps top tức thời (ffmpeg + apt-get), như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: spike 17:47:53Z (ffmpeg sine 100% tích lũy, delta 0 — pid chết giữa chừng). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 30 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 30/36 spike — 6 spike lớp load1 dư đợt này (tỉ lệ cao nhất kể từ đợt 160 — 3/6 spike dư tập trung trong bão sau reboot #68, lúc apt-get/dpkg replay + hatch daemon cùng chạy nhưng delta tick đều nhỏ).
- **Delta tick lớn nhất đợt: 126 tick/s** (ffmpeg, spike 17:43:47Z, load1 4,50); WebKitWebProcess 103 tick/s (19:33:37Z + 19:35:43Z, harness); WebKitWebProcess 89 tick/s (18:05:31Z + 19:31:15Z). (Đợt 163: max 136 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 17:39:50Z CÙNG lúc sampler (khác đợt 163: watcher mở muộn 67 s sau sampler) — **0 khoảng mù đầu phiên đợt này**; spike đầu tiên watcher bắt được là 17:40:50Z (60 s sau khi mở). **Khoảng mù duy nhất: reboot #68 giết watcher, khởi động lại 18:07:49Z (gap 57 s cùng sampler — xem §5.1)** — spike đầu tiên sau khởi động lại bị bắt ngay cùng giây 18:07:49Z (load1 4,79). **0 gap phủ sóng watcher nào khác trong phiên.**
- **O8/harness chạy đợt này:** O8 (GATE-FOUND 19:29:20Z → O8 DONE 19:32:56Z) gây **3 spike B2** (19:31:15Z WebKit + 19:31:51Z WebKit + 19:32:26Z Chromium — cả ba do chính process O8); harness gây **2 spike B2** (19:33:37Z + 19:35:43Z, WebKit delta 103) — khác đợt 163 (O8 gây 2 spike, harness gây 1 spike) và đợt 162 (O8 gây 1 spike, harness gây 1 spike); đợt này O8 gây 3 spike, harness gây 2 spike (tính tới lúc T9 đóng; harness vẫn chạy sau 19:53:57Z — spike sau đó (nếu có) thuộc T8/T10).
- **Kẹt harness: chưa biết lúc T9 đóng** (T8 chưa đóng cờ — xem §5.3; harness bắt đầu 19:33:17Z, 84l10 exit 0; chromium W1/W2/E4 PASS 19:54–19:55Z ghi nhận lúc phân tích) nên không có cửa sổ kẹt để đối chiếu B2 lúc đóng.

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/ffprobe xuất hiện trong nhiều spike của bão mở đợt** (testsrc2/sine/color/geq — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 1 spike delta-miss 17:47:53Z — xem §2.5). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra + T5 replay + T4 attempt + T8 O8/harness + hatch daemon; **42 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 7 spike attempt/O8/harness, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ mười tám liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt (xem F-164-T9-2 về gap phủ sóng đầu phiên):** sampler `round164-t9/sampler.sh` chạy liên tục 17:39:50Z–19:53:52Z, **135 mẫu, gap trong log lớn nhất 61 s, 0 gap >90 s**; khởi động lại bằng tay 18:07:49Z (boot+79s) sau reboot #68 — khoảng trống trong log 57 s (18:06:52Z → 18:07:49Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.871.796 kB = 45,65% guard** (đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). Khoảng cách tới guard lúc đỉnh: **3.419.660 kB (54,35%)** — xa nhất kể từ đợt 158.
- **Guard giữ nguyên: 6.291.456 kB (6.144 MiB).** Không mẫu nào chạm 6.144 MiB — cơ chế (a) **armed** (sampler chạy liên tục) và **KHÔNG kích hoạt** suốt 2h14m.
- **0 lần thử birefnet trong đợt 164 — lần thứ mười tám liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0). **Chuỗi 0 lần thử: 18 đợt liên tiếp** (đợt 147–164).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 18 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round164-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `bin/python3.11`); `bgremove.py` **23.500 B** (không đổi so với đợt 163); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-164-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt (xem F-164-T9-2 về gap đầu phiên).**
- **Không cần chạy lại birefnet trong đợt 164** (guard chưa từng mở; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #67 ≥18 dòng + boot #68 = 35 dòng; tổng ≥53 dòng, cận dưới — đợt thứ mười ba liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#67** (f1d4ce1a, btime 17:33:27Z): **≥18 dòng** (T5-164 đếm lúc 17:55:51Z — T9 ghi số đếm của T5, không tự đếm lại; T9 đếm được 4 dòng lúc 17:40:09Z, **phần còn lại 17:55:51Z → reboot #68 (18:06:30Z) mất theo reboot, KHÔNG cộng số ước** — xem F-164-T9-2). Dòng đầu tiên trên #67 lúc **17:36:35Z (boot+188s)** — tức là ENOSPC bắt đầu ngay sau khi đợt mở (17:35:51Z, boot+144s), trước khi T9 đo headroom lần đầu (17:40:09Z, boot+402s) — xem F-164-T9-1.
- Boot **#68** (0c8a94aa, btime 18:06:30Z): **35 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước**). Hai cụm:
  - Cụm 1: **15 dòng, 18:08:29–18:24:03Z** — dòng đầu 18:08:29Z (boot+119s), 7 s sau khi headroom về 0 (boot+112s); nhịp ~70 s.
  - **Khoảng im: 53m06s (18:24:03Z → 19:17:09Z)** — đúng lúc headroom là 1–2 (lan-2 1/2 lúc 18:37:49Z, lan-3 2/2 lúc 19:07:49Z) và balloon đang ghim trần E-165 (chuỗi 1–3); **không có dòng ENOSPC nào trong 53 phút này** — bảng watch có 1–2 slot trống nên systemd thêm được watch (xem §1.2: probe lan-2/lan-3 đo được 1–2).
  - Cụm 2: **20 dòng, 19:17:09–19:52:49Z** — dòng đầu 19:17:09Z, đúng lúc T4 attempt2-#68 đang chạy (19:16:46–19:20:59Z) và headroom đã về 0 (lan-4 19:37:49Z đo 0,0; dòng cuối cùng 19:52:49Z — ENOSPC-last lúc probe đóng 19:53:55Z; ENOSPC-count=35 lúc probe đóng).
- **Tổng đợt 164: ≥18 + 35 = ≥53 dòng đếm được (cận dưới)** — đợt thứ mười ba liên tiếp có lỗi thật (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng — T9 đếm trực tiếp 35 dòng boot #68 + ghi số đếm T5 18 dòng boot #67). **Caveat: số đợt này là CẬN DƯỚI** — phần còn lại boot #67 (17:55:51Z → 18:06:30Z) mất theo reboot #68, không đếm được; T10 không đếm lại được từ cell vì journalctl trả 0 dòng (cùng họ EPERM như dmesg — xem F-163-T9-1).
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for ...: No space left on device` (đợt 163: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 163:** đợt 163 có 58 dòng (boot #65 ≥56 + boot #66 2 dòng — T5 đếm; T9 ghi lại); đợt này **≥53 dòng** (boot #67 ≥18 + boot #68 35). Số dòng đợt này **thấp hơn** đợt 163 (58) dù có 2 boot — vì boot #67 chỉ đếm được tới 17:55:51Z (phần còn lại mất) và boot #68 có khoảng im 53 phút lúc headroom 1–2.
- **Điểm mới (giao parent/T10 xem lại quyết (g) — T9 chỉ nêu dữ kiện):** khoảng im ENOSPC 53m06s trùng khớp chính xác với headroom 1–2 (lan-2/lan-3) — lần đầu tiên trong chuỗi 13 đợt có một khoảng im dài như vậy giữa hai cụm ENOSPC trong cùng một boot; và ENOSPC trở lại đúng lúc headroom về 0. Đây là **bằng chứng độc lập (ngoài probe)** rằng headroom 1–2 là thật (không phải lỗi probe) — systemd thêm được watch trong khoảng đó.

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #67 + #68 — 2 reboot trong/anh quanh đợt 164 (cùng mẫu đợt 163: 2 reboot)

- **Reboot #67 (f1d4ce1a, btime 17:33:27Z; gap #66→#67 = 5.202 s):** xảy ra GIỮA hai đợt (sau khi T10-163 đóng sổ ~17:16Z, trước khi đợt 164 mở 17:35:51Z). T7-164 + T2-164 xác nhận **KHÔNG PHẢI điểm (m)** (0 run đang chạy tại btime, 0 requeue). Run 163 SUCCEEDED 17:18:13Z, margin 1.058 s — KHÔNG bị #67 giết (xong trước btime 914 s; btime chỉ 144 s trước deadline của run).
- **Reboot #68 (0c8a94aa, btime 18:06:30Z; gap #67→#68 = 1.983 s — NGẮN NHẤT chuỗi gần đây theo T7-164):** xảy ra **GIỮA PHIÊN** (18:06:30Z, 31 phút sau khi đợt mở). Sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ hai liên tiếp — đợt 163 cũng chết theo reboot #66); T9 khởi động lại cả ba bằng tay **18:07:49Z (boot+79s)** — **khoảng trống phủ sóng trong log 57 s** (18:06:52Z → 18:07:49Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 163: gap 113 s). **3 lệnh sleep-wait của T9 bị reboot #68 giết** (runtime restart recovery — xem F-164-T9-3; chỉ là timer chờ, không có side effect, trạng thái đã verify lại từ disk).
- **Mẫu sampler cuối #67 (18:06:52Z) mang nhãn boot cũ `f1d4ce1a` dù btime #68 là 18:06:30Z (22 s TRƯỚC mẫu)** — cùng mẫu watcher-163 đợt 163 (poll 16:06:54Z, 9 s sau btime #66): sampler đọc boot-id từ `/proc/sys/kernel/random/boot_id` TRƯỚC khi reboot xảy ra trong cùng chu kỳ lấy mẫu, hoặc đọc sau khi reboot nhưng boot-id chưa cập nhật — dữ liệu mẫu vẫn đúng (RAM/balloon/load1 đo được là số thật lúc 18:06:52Z trên boot #68 mới, chỉ nhãn boot là cũ); xem F-164-T9-4. **T9 ghi đúng số đo, không sửa nhãn.**
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T7-164 đo; T9 không đo lại).
- **Khoảng trống phủ sóng đầu phiên (F-164-T9-2):** đợt mở 17:35:51Z (boot+144s), T9 nhận việc 17:39:17Z (boot+350s), sampler khởi động 17:39:50Z (boot+383s) — **gap 383 s từ btime #67 tới khi sampler chạy** (đợt 163: gap 113 s từ btime #66 tới khi sampler chạy — đợt này gap DÀI HƠN vì đợt mở muộn hơn sau reboot: 144 s so với 71 s). Trong 383 s này: E-164 đứt (không quan sát được chính xác), cửa sổ thoáng #67 (nếu có) đã đóng, ENOSPC bắt đầu (17:36:35Z, boot+188s). T9 ghi gap này để T10/parent biết, không giấu.

### 5.2 T5-164 (infra) — POSTBOOT_PASS #67 ĐÃ CÓ, #66/#68 CHƯA CÓ; watcher-164 CHẾT theo reboot #68 (T9 phát hiện mới)

- **POSTBOOT_PASS #67 ĐÃ CÓ lúc 17:54:38Z** (boot+21m11s, replay đầy đủ, poll=0; postboot độc lập exit 0 lúc 17:55:51Z, 11/11 package + 5/5 lib) — T5-164 xác nhận.
- **POSTBOOT_PASS #66 KHÔNG CÓ** (boot thứ 8 không có postboot pass — T5-164 xác nhận; không bù được).
- **POSTBOOT_PASS #68 KHÔNG CÓ** (T5-164 đóng cờ 17:57Z, trước reboot #68 18:06:30Z — T5 không có mặt lúc #68; **thuộc T5-165**).
- **Watcher-164 CHẾT theo reboot #68 (T9 phát hiện mới, T5-164 không biết vì đã đóng cờ trước #68):** watcher-164 bắt đầu 17:40:59Z pid 5451, END 20:30:00Z (theo file watcher-164.log); T9 kiểm tra lúc **18:38:30Z: pid 5451 ĐÃ CHẾT** (không còn trong `ps`), file watcher-164.log không có dòng nào sau 18:06:30Z — **chết theo reboot #68** (cùng mẫu watcher-163 đợt 163: chết theo reboot #66). T5-164 không ghi nhận vì đã đóng cờ 17:57Z. **Marker vẫn còn, qua 19 reboot #49–#67** (T5-164 đếm; T9 không đếm lại).
- **X11 (T9 kiểm tra lúc đóng phiên 19:58–19:59Z):** `/tmp/.X11-unix/` chỉ còn **X199** (mtime 19:33Z) + **Xvfb :199 pid 30431 ĐANG CHẠY** — là Xvfb của harness T8 (bắt đầu 19:33:17Z), **không phải socket mồ côi**. 3 socket X193/X194/X195 (mtime 17:47:27Z, T5-164 giao T8 dọn) **không còn** — đã dọn (T8 sở hữu chi tiết). T9 không dọn gì thêm.
- **Direction (3) vẫn giữ** (lần thứ 11 — T5-164 xác nhận).

### 5.3 T8-164 (vite harness + O8) — CHƯA đóng cờ lúc T9 đóng (19:59:21Z); GATE-FOUND qua đường (b), O8 DONE exit 0 ×3

- **GATE-FOUND poll=81 lúc 19:29:20Z qua đường (b)** (`postboot-t4-164-gate0wait-85.log`, tuổi 889 s, btime 18:06:30Z) — **KHÔNG phải đường chuẩn (a)** vì POSTBOOT_PASS #68 không tồn tại (xem §5.2). **Chuỗi "gate FOUND đường chuẩn" 6 đợt liên tiếp (đợt 158–163) BỊ PHÁ** — T10/parent phán hệ quả chuỗi (T9 chỉ nêu dữ kiện).
- **O8 DONE 19:32:56Z, webkit1=0 webkit2=0 chromium=0 (exit 0 ×3 theo log driver)** — T8 LIMITS chưa xuất bản lúc T9 đóng nên T9 không trích số chi tiết O8 (thuộc T8-164/T10).
- **Harness bắt đầu 19:33:17Z; 84l10 exit 0 (kết thúc 19:34:30Z); chromium W1 (×2), W2, E4 PASS timestamp 19:54:36–19:55:20Z** — ghi nhận lúc T9 phân tích (sau khi T9 đóng sampler 19:53:57Z — thuộc T8/T10; T9 chỉ nêu).
- **Đối chiếu sampler T9 trong cửa sổ O8 (19:29:20–19:33:52Z): 5 mẫu, gate A MỞ 4/5** (chỉ mẫu 19:30:51Z 1.006.612 kB thấp hơn gate 41.964 kB), balloon 70,3–90,7% (không ghim), load1 max 5,42 (mẫu 19:31:51Z — trong cửa sổ O8, trùng spike B2 19:31:51Z WebKit delta 83).
- **O8 gây 3 spike B2 trong cửa sổ** (19:31:15Z + 19:31:51Z WebKit + 19:32:26Z Chromium — xem §2.5); **harness gây 2 spike B2** (19:33:37Z + 19:35:43Z WebKit delta 103).
- **T8 CHƯA đóng cờ lúc T9 đóng (19:59:21Z)** — T9 không chờ T8 (hạn cờ T9 ~20:00Z). Chi tiết O8/harness đầy đủ thuộc T8-164/T10.

### 5.4 T7-164 (scheduler) — run 163 SUCCEEDED margin 1.058 s; run 164 vẫn running lúc đóng; cửa lành hoàn toàn đợt thứ ba liên tiếp

- **Run 163 SUCCEEDED 17:18:13Z, wall 9.742 s, margin 1.058 s, 1 lần viết lại tại #66, KHÔNG bị #67 giết** (xong trước btime 914 s).
- **Reboot #68 viết lại run 164 lần 1, requeue 18:07:17.131Z = btime +47,131 s — TRONG dải 33–49,8 s → ỨNG VIÊN DƯƠNG (m)** (chờ parent quyết; đối chiếu độc lập thuộc T2-165). T2-164 đã đồng ý (m) #66 là dương (requeue +45,460 s, kiểm tra 3 nguồn) → n ứng viên 20→21 (nhánh khuyến nghị) hoặc 21→22.
- **Run 164 vẫn running lúc T7 đóng** (tuổi 8.072 s, còn 2.728 s tới deadline 20:35:51Z; jitter 0 s, lần thứ 17 liên tiếp) — kết cục thuộc T7-165.
- **Slot: HB 6/6 (đều −316 s) + DR 3/3 (đều 0 s), 0 thiếu, 0 trễ — lành hoàn toàn, đợt thứ ba liên tiếp**; cộng dồn HB 44/375, DR 49/258; HB-late cộng dồn GIỮ 9. n ứng viên 21 (18 dương + 3 âm) hoặc 22 (18 + 4) sau quyết (e) đợt 163; n chính thức GIỮ 14; #56 vẫn có điều kiện (T2-164 không thu hẹp được lần thứ 7).
- T7-164 đóng cờ 19:56Z (T9 ghi lại từ file cờ).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6/T7 đã đóng cờ lúc 19:57:45Z (7/9)** — T8 đang chạy, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T2-164:** probe #83 17:44:45Z boot f1d4ce1a, ok=2 fail=0, log 238→241 (+3), window 10.997 s; #67 XÁC NHẬN (btime 17:33:27Z giờ thật); **#96? MỞ SƠ BỘ** (R 1.238/1.222/1.211 s); **#88? vẫn MỞ** (lần thứ 8: 345 hit, 0 mốc mới); **INSIDE #66 FULL112 → chuỗi 1 lên 2; #67 FULL113 → chuỗi 2 lên 3**; (m) #66 ĐỒNG Ý DƯƠNG → n 20→21 / 21→22 nếu parent chấp nhận; (m) #67 KHÔNG phải điểm; (m) #56 vẫn có điều kiện (lần thứ 7 không thu hẹp được); RAM peak 57,60% guard (số đợt 163 — T2 chưa cập nhật đợt 164 lúc T9 đóng); WFS #70 diff 0 (992+25=1.017); EPERM 0 sóng thật.
- **T1-164:** suite 28/28 (theo bản tin trạng thái giữa phiên; T9 không verify lại).
- **T6-164:** prune lần 38 (theo bản tin trạng thái giữa phiên; T9 không verify lại).
- **T4-164:** xem §2.3 (LIMITS đã xuất bản).
- **T0-164:** boot #67/#68 xác nhận độc lập (T0/T2/T5/T7 đều xác nhận btime #67 = 17:33:27Z; T7 xác nhận btime #68 = 18:06:30Z).

## 6. Sai số / caveat (F-164-T9-*)

- **F-164-T9-1 — Cửa sổ thoáng sau reboot #67 KHÔNG quan sát được.** Đợt mở 17:35:51Z (boot+144s), T9 nhận việc 17:39:17Z (boot+350s), lần đo đầu 17:40:09Z (boot+402s) đã là 0. ENOSPC đầu tiên trên #67 lúc 17:36:35Z (boot+188s) — nếu có cửa sổ thì nó đã đóng trong khoảng boot+144s → boot+188s, trước khi T9 kịp đo. T9 không claim cửa sổ #67 có hay không. (Cửa sổ #68 thì quan sát được: boot+81s → boot+112s, <31 s — xem §1.2.)
- **F-164-T9-2 — Khoảng trống phủ sóng đầu phiên 383 s (btime #67 17:33:27Z → sampler khởi động 17:39:50Z).** Trong 383 s này: E-164 đứt (không quan sát được chính xác), cửa sổ thoáng #67 (nếu có) đã đóng, ENOSPC bắt đầu (17:36:35Z). Gap này DÀI HƠN đợt 163 (113 s) vì đợt mở muộn hơn sau reboot (144 s so với 71 s). T9 ghi gap để T10/parent biết, không giấu. **Sampler/watcher/probe-loop khởi động 17:39:50Z trên boot #67 (pid 2457/2458/2459), chết theo reboot #68, khởi động lại bằng tay 18:07:49Z trên boot #68 (pid 1948/1949/1950), dừng theo PID lúc đóng 19:53:57Z — 0 process T9 sót lại (kiểm tra lúc đóng).**
- **F-164-T9-3 — 3 lệnh sleep-wait của T9 bị reboot #68 giết** (runtime restart recovery cho các session proc_73053c417501, proc_b9eb8a0b0726, proc_8b21b662dd3b — chỉ là timer chờ, không có side effect; trạng thái đã verify lại từ disk sau đó). Không cần làm lại.
- **F-164-T9-4 — Mẫu sampler cuối #67 (18:06:52Z) mang nhãn boot cũ `f1d4ce1a` dù btime #68 là 18:06:30Z (22 s TRƯỚC mẫu).** Cùng mẫu watcher-163 đợt 163 (poll 16:06:54Z, 9 s sau btime #66): sampler đọc boot-id trước khi reboot xảy ra trong cùng chu kỳ lấy mẫu, hoặc boot-id chưa cập nhật — dữ liệu mẫu vẫn đúng (RAM/balloon/load1 đo được là số thật lúc 18:06:52Z trên boot #68 mới, chỉ nhãn boot là cũ). T9 ghi đúng số đo, không sửa nhãn. **Ảnh hưởng đếm: mẫu 18:06:52Z được tính vào #67 trong bảng §2.1 (n=28) theo nhãn log — nếu tính theo btime thì #67 n=27, #68 n=108; mean toàn phiên KHÔNG đổi (cùng 135 mẫu).**
- **F-164-T9-5 — Đếm tay chuỗi 2 E-165 sai: T9 đếm tay là 9 mẫu trong các bản tin trạng thái giữa phiên; script đếm lại từ log đóng băng là 10 mẫu (18:49:50–18:58:50Z).** Số đúng trong file này là **10** (script). Tổng ghim 35 = 13+10+12. **Caveat đi kèm: sag 1 (91,6%, 7 mẫu) SÂU HƠN và DÀI HƠN dip E-163 (94,5%, 4 mẫu) — sag sâu nhất/dài nhất từng không tách; nếu parent đặt ngưỡng độ sâu/thời gian mới thì E-165 thành 2–3 episode (xem §2.2).**
- **F-164-T9-6 — 1 dòng `ps -eo args` trong b2-spikes-FROZEN.log (spike 17:49:05Z, pid 25463, ppid 25462, 33,3% tích lũy).** Là lệnh `ps` ngắn ngủi của một luồng khác, chủ không xác định được (pid/ppid đều đã chết lúc phân tích); **KHÔNG phải lệnh `ps` của watcher** (watcher dùng `ps -eo pid,ppid,%cpu,%mem,args` và `ps -eo pid,args` — cả hai đều đã loại theo quyết (n) đợt 150; 0 lần watcher tự lọt top với vai trò driver). Fix (n) đợt 150 VẪN ĐÓNG. Dòng này **không được đếm làm driver** cho spike 17:49:05Z (spike đó quy driver bằng ffmpeg testsrc2 delta 96 + apt-get).
- **F-164-T9-7 — Delta-miss spike 17:47:53Z (ffmpeg sine 100% tích lũy, delta 0 — pid chết giữa chừng trong vòng delta 1 s).** Quy driver bằng ps top tức thời (ffmpeg + apt-get), như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163). Cùng mẫu: spike 17:51:24Z (ffprobe 38,8% tích lũy trong ps top nhưng delta ffmpeg 86 — pid ffmpeg chết giữa chừng, attribution dựa vào cả hai nguồn).
- **F-164-T9-8 — Bảng giai đoạn §2.1 trong bản nháp đầu được T9 ghi bằng tay và chứa số sai (gate A từng giai đoạn, dải RAM, số mẫu).** Lúc đóng cờ T9 đối chiếu lại toàn bộ từ log đóng băng bằng script (`t9-164-recheck.py`) và **viết lại cả bảng §2.1 bằng số script** (gate A giai đoạn: 14/15, 12/12, 13/22, 0/46, 18/27, 1/12; load1 ≥3,0 phân bổ 8+2+3+0+3+0=16). **Bài học: không ghi số gate A/load1 theo giai đoạn bằng tay — chỉ ghi số từ script.**
- **F-164-T9-9 — T10 không đếm lại độc lập B2 đợt 163 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).** T9 đếm 36 spike từ log đóng băng bằng script + grep tay từng spike; T10 có thể đếm lại từ `b2-spikes-FROZEN.log` (1.711 dòng).
- **F-164-T9-10 — Bản nháp đầu của LIMITS này chứa HAI phụ lục bịa: phụ lục sampler (135 dòng) và phụ lục headroom (15 dòng) được T9 viết lại từ trí nhớ/suy đoán lúc soạn, KHÔNG copy từ file đóng băng — nhiều số trong đó sai so với log thật (ví dụ mẫu 17:40:50Z thật là mem=2.161.764, load1=4,16; các mẫu 19:37:51Z trở đi trong phụ lục nháp là số suy đoán).** Lúc đóng cờ T9 phát hiện, **xóa cả hai phụ lục nháp và thay bằng nội dung thật copy trực tiếp từ `ram-sampler-FROZEN.log` (135 dòng, md5 3f0b7650) và `headroom-log.txt` (59 dòng)** — xem phụ lục cuối file. Cùng đợt kiểm tra lại này còn sửa: nhịp nhảy SwapFree qua reboot #68 (691.444 → 1.039.968 kB, nhả ~348.524 kB — nháp ghi sai 642.272/~397.696 kB); mẫu dưới gate trong cửa sổ O8 (19:30:51Z 1.006.612 kB — nháp ghi sai 19:32:52Z 615.272 kB); dòng ENOSPC cuối cụm 2 (19:52:49Z — nháp ghi sai 19:53:55Z); MemAvailable lúc 19:14:51Z (578.564 kB — nháp ghi sai 546.500 kB). **Bài học: phụ lục log chỉ được copy bằng script từ file đóng băng, không bao giờ gõ lại bằng tay.**
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được, chỉ biết ≥30.001); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl trả 0 dòng (cùng họ EPERM như dmesg — xem F-163-T9-1).

---

---

## Phụ lục — log sampler đóng băng (135 mẫu, 17:39:50Z–19:53:52Z)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round164-t9/ram-sampler-FROZEN.log` (md5 `3f0b7650c0945bc9d165e0393164591c`) — không gõ lại bằng tay (xem F-164-T9-10).

```
2026-11-21T17:39:50Z boot=f1d4ce1a mem=1043424 bal=5735404 swapfree=873548 load1=1.21
2026-11-21T17:40:50Z boot=f1d4ce1a mem=2161764 bal=4142512 swapfree=862920 load1=4.16
2026-11-21T17:41:50Z boot=f1d4ce1a mem=2136412 bal=3907188 swapfree=863908 load1=10.07
2026-11-21T17:42:50Z boot=f1d4ce1a mem=2478948 bal=4200424 swapfree=872136 load1=8.73
2026-11-21T17:43:51Z boot=f1d4ce1a mem=2189204 bal=4471512 swapfree=875320 load1=4.14
2026-11-21T17:44:51Z boot=f1d4ce1a mem=2178696 bal=4573460 swapfree=875432 load1=2.62
2026-11-21T17:45:51Z boot=f1d4ce1a mem=1933712 bal=4731068 swapfree=866108 load1=2.01
2026-11-21T17:46:51Z boot=f1d4ce1a mem=1967804 bal=4752276 swapfree=866076 load1=1.61
2026-11-21T17:47:51Z boot=f1d4ce1a mem=1812488 bal=4971376 swapfree=850492 load1=2.54
2026-11-21T17:48:51Z boot=f1d4ce1a mem=1489892 bal=5169068 swapfree=854196 load1=7.97
2026-11-21T17:49:51Z boot=f1d4ce1a mem=1472016 bal=5076048 swapfree=829548 load1=6.49
2026-11-21T17:50:51Z boot=f1d4ce1a mem=1422344 bal=5256368 swapfree=827488 load1=7.61
2026-11-21T17:51:51Z boot=f1d4ce1a mem=2174904 bal=4331136 swapfree=826736 load1=4.76
2026-11-21T17:52:51Z boot=f1d4ce1a mem=2061428 bal=4492376 swapfree=831084 load1=2.83
2026-11-21T17:53:51Z boot=f1d4ce1a mem=1924504 bal=4731392 swapfree=820884 load1=2.83
2026-11-21T17:54:51Z boot=f1d4ce1a mem=2137152 bal=4692964 swapfree=799688 load1=2.40
2026-11-21T17:55:52Z boot=f1d4ce1a mem=2699300 bal=4044216 swapfree=756920 load1=2.88
2026-11-21T17:56:52Z boot=f1d4ce1a mem=2871796 bal=3880720 swapfree=755224 load1=1.83
2026-11-21T17:57:52Z boot=f1d4ce1a mem=2613676 bal=4187056 swapfree=750696 load1=1.15
2026-11-21T17:58:52Z boot=f1d4ce1a mem=2292864 bal=4462296 swapfree=747248 load1=0.68
2026-11-21T17:59:52Z boot=f1d4ce1a mem=1934508 bal=4712372 swapfree=744204 load1=0.38
2026-11-21T18:00:52Z boot=f1d4ce1a mem=1765376 bal=4200864 swapfree=737108 load1=2.19
2026-11-21T18:01:52Z boot=f1d4ce1a mem=1539860 bal=4403940 swapfree=726692 load1=3.62
2026-11-21T18:02:52Z boot=f1d4ce1a mem=1998228 bal=4637408 swapfree=730020 load1=2.37
2026-11-21T18:03:52Z boot=f1d4ce1a mem=2008956 bal=4858732 swapfree=721324 load1=1.35
2026-11-21T18:04:52Z boot=f1d4ce1a mem=1245764 bal=4867380 swapfree=694208 load1=1.43
2026-11-21T18:05:52Z boot=f1d4ce1a mem=1259100 bal=4701408 swapfree=683068 load1=3.14
2026-11-21T18:06:52Z boot=f1d4ce1a mem=1817684 bal=4768880 swapfree=691444 load1=1.90
2026-11-21T18:07:49Z boot=0c8a94aa mem=1740360 bal=5089268 swapfree=1039968 load1=4.79
2026-11-21T18:08:49Z boot=0c8a94aa mem=1459140 bal=5240724 swapfree=932384 load1=4.23
2026-11-21T18:09:49Z boot=0c8a94aa mem=1462152 bal=5306912 swapfree=932784 load1=2.98
2026-11-21T18:10:49Z boot=0c8a94aa mem=1266432 bal=4643572 swapfree=812336 load1=3.73
2026-11-21T18:11:49Z boot=0c8a94aa mem=2590560 bal=4093660 swapfree=823356 load1=2.48
2026-11-21T18:12:49Z boot=0c8a94aa mem=2294412 bal=4387476 swapfree=826072 load1=1.89
2026-11-21T18:13:49Z boot=0c8a94aa mem=2047484 bal=4654212 swapfree=826536 load1=1.32
2026-11-21T18:14:49Z boot=0c8a94aa mem=1775740 bal=4892264 swapfree=826760 load1=1.30
2026-11-21T18:15:49Z boot=0c8a94aa mem=1578308 bal=5110636 swapfree=828116 load1=1.25
2026-11-21T18:16:49Z boot=0c8a94aa mem=1556460 bal=5310308 swapfree=822632 load1=1.93
2026-11-21T18:17:49Z boot=0c8a94aa mem=1423320 bal=5492396 swapfree=826400 load1=1.42
2026-11-21T18:18:49Z boot=0c8a94aa mem=1264372 bal=5659428 swapfree=820540 load1=1.18
2026-11-21T18:19:49Z boot=0c8a94aa mem=1113656 bal=5811868 swapfree=816372 load1=1.12
2026-11-21T18:20:49Z boot=0c8a94aa mem=956220 bal=5949700 swapfree=810436 load1=1.27
2026-11-21T18:21:49Z boot=0c8a94aa mem=935660 bal=5968700 swapfree=781092 load1=1.32
2026-11-21T18:22:49Z boot=0c8a94aa mem=961244 bal=5983044 swapfree=742260 load1=2.76
2026-11-21T18:23:49Z boot=0c8a94aa mem=814716 bal=6061568 swapfree=711088 load1=2.60
2026-11-21T18:24:49Z boot=0c8a94aa mem=827040 bal=6176700 swapfree=704148 load1=2.26
2026-11-21T18:25:49Z boot=0c8a94aa mem=718408 bal=6285896 swapfree=700940 load1=1.61
2026-11-21T18:26:49Z boot=0c8a94aa mem=859348 bal=6155768 swapfree=693868 load1=1.90
2026-11-21T18:27:49Z boot=0c8a94aa mem=759188 bal=6259772 swapfree=694848 load1=1.56
2026-11-21T18:28:49Z boot=0c8a94aa mem=658660 bal=6360592 swapfree=691180 load1=1.40
2026-11-21T18:29:49Z boot=0c8a94aa mem=569856 bal=6443824 swapfree=691364 load1=1.23
2026-11-21T18:30:49Z boot=0c8a94aa mem=558524 bal=6443824 swapfree=692372 load1=1.55
2026-11-21T18:31:49Z boot=0c8a94aa mem=546932 bal=6443824 swapfree=693800 load1=1.41
2026-11-21T18:32:50Z boot=0c8a94aa mem=530624 bal=6443824 swapfree=694656 load1=0.83
2026-11-21T18:33:50Z boot=0c8a94aa mem=528836 bal=6443824 swapfree=697112 load1=1.39
2026-11-21T18:34:50Z boot=0c8a94aa mem=534036 bal=6443824 swapfree=697240 load1=0.63
2026-11-21T18:35:50Z boot=0c8a94aa mem=512432 bal=6443824 swapfree=697704 load1=0.23
2026-11-21T18:36:50Z boot=0c8a94aa mem=527248 bal=6443824 swapfree=699144 load1=0.20
2026-11-21T18:37:50Z boot=0c8a94aa mem=528160 bal=6443824 swapfree=704604 load1=0.13
2026-11-21T18:38:50Z boot=0c8a94aa mem=514108 bal=6443824 swapfree=708144 load1=0.33
2026-11-21T18:39:50Z boot=0c8a94aa mem=529124 bal=6443824 swapfree=708016 load1=0.43
2026-11-21T18:40:50Z boot=0c8a94aa mem=505772 bal=6443824 swapfree=710208 load1=0.32
2026-11-21T18:41:50Z boot=0c8a94aa mem=513556 bal=6443824 swapfree=710696 load1=0.21
2026-11-21T18:42:50Z boot=0c8a94aa mem=669364 bal=6247216 swapfree=705668 load1=0.77
2026-11-21T18:43:50Z boot=0c8a94aa mem=837656 bal=5901376 swapfree=696064 load1=0.77
2026-11-21T18:44:50Z boot=0c8a94aa mem=923284 bal=6033836 swapfree=695000 load1=0.44
2026-11-21T18:45:50Z boot=0c8a94aa mem=921092 bal=6051976 swapfree=690888 load1=0.30
2026-11-21T18:46:50Z boot=0c8a94aa mem=793336 bal=6169824 swapfree=691056 load1=0.25
2026-11-21T18:47:50Z boot=0c8a94aa mem=705588 bal=6277124 swapfree=695576 load1=0.29
2026-11-21T18:48:50Z boot=0c8a94aa mem=637392 bal=6376832 swapfree=695568 load1=0.26
2026-11-21T18:49:50Z boot=0c8a94aa mem=540716 bal=6443824 swapfree=694692 load1=0.23
2026-11-21T18:50:50Z boot=0c8a94aa mem=541192 bal=6443824 swapfree=694708 load1=0.15
2026-11-21T18:51:50Z boot=0c8a94aa mem=530024 bal=6443824 swapfree=692512 load1=0.23
2026-11-21T18:52:50Z boot=0c8a94aa mem=567548 bal=6443824 swapfree=692556 load1=0.08
2026-11-21T18:53:50Z boot=0c8a94aa mem=529556 bal=6443824 swapfree=692796 load1=0.18
2026-11-21T18:54:50Z boot=0c8a94aa mem=508236 bal=6443824 swapfree=692732 load1=0.21
2026-11-21T18:55:50Z boot=0c8a94aa mem=510332 bal=6443824 swapfree=692940 load1=0.34
2026-11-21T18:56:50Z boot=0c8a94aa mem=517960 bal=6443824 swapfree=693324 load1=0.38
2026-11-21T18:57:50Z boot=0c8a94aa mem=520012 bal=6443824 swapfree=693428 load1=0.30
2026-11-21T18:58:50Z boot=0c8a94aa mem=580152 bal=6443824 swapfree=683884 load1=1.10
2026-11-21T18:59:50Z boot=0c8a94aa mem=852132 bal=6126256 swapfree=681036 load1=0.75
2026-11-21T19:00:50Z boot=0c8a94aa mem=730348 bal=6238532 swapfree=688784 load1=0.83
2026-11-21T19:01:50Z boot=0c8a94aa mem=652092 bal=6340152 swapfree=688472 load1=0.38
2026-11-21T19:02:50Z boot=0c8a94aa mem=568780 bal=6432812 swapfree=685676 load1=0.32
2026-11-21T19:03:50Z boot=0c8a94aa mem=409760 bal=6443824 swapfree=679876 load1=0.33
2026-11-21T19:04:50Z boot=0c8a94aa mem=520184 bal=6443824 swapfree=680464 load1=0.23
2026-11-21T19:05:50Z boot=0c8a94aa mem=533304 bal=6443824 swapfree=684096 load1=0.14
2026-11-21T19:06:50Z boot=0c8a94aa mem=513468 bal=6443824 swapfree=685272 load1=0.18
2026-11-21T19:07:50Z boot=0c8a94aa mem=548288 bal=6443824 swapfree=772708 load1=0.21
2026-11-21T19:08:51Z boot=0c8a94aa mem=594076 bal=6443824 swapfree=788732 load1=0.11
2026-11-21T19:09:51Z boot=0c8a94aa mem=548608 bal=6443824 swapfree=788792 load1=0.19
2026-11-21T19:10:51Z boot=0c8a94aa mem=567808 bal=6443824 swapfree=788892 load1=0.14
2026-11-21T19:11:51Z boot=0c8a94aa mem=557032 bal=6443824 swapfree=789108 load1=0.08
2026-11-21T19:12:51Z boot=0c8a94aa mem=546500 bal=6443824 swapfree=787964 load1=0.03
2026-11-21T19:13:51Z boot=0c8a94aa mem=543680 bal=6443824 swapfree=788664 load1=0.32
2026-11-21T19:14:51Z boot=0c8a94aa mem=578564 bal=6443824 swapfree=785024 load1=0.62
2026-11-21T19:15:51Z boot=0c8a94aa mem=962820 bal=6050608 swapfree=748660 load1=0.89
2026-11-21T19:16:51Z boot=0c8a94aa mem=924728 bal=5874816 swapfree=734496 load1=0.91
2026-11-21T19:17:51Z boot=0c8a94aa mem=615272 bal=5579544 swapfree=690624 load1=2.97
2026-11-21T19:18:51Z boot=0c8a94aa mem=1352832 bal=5439328 swapfree=687048 load1=2.62
2026-11-21T19:19:51Z boot=0c8a94aa mem=1190928 bal=5595588 swapfree=687904 load1=0.96
2026-11-21T19:20:51Z boot=0c8a94aa mem=1695032 bal=4650628 swapfree=678956 load1=1.07
2026-11-21T19:21:51Z boot=0c8a94aa mem=2821760 bal=4166652 swapfree=680640 load1=0.46
2026-11-21T19:22:51Z boot=0c8a94aa mem=2447260 bal=4460712 swapfree=688936 load1=0.48
2026-11-21T19:23:51Z boot=0c8a94aa mem=2244164 bal=4704076 swapfree=689344 load1=0.35
2026-11-21T19:24:51Z boot=0c8a94aa mem=1946348 bal=4946232 swapfree=690476 load1=0.50
2026-11-21T19:25:51Z boot=0c8a94aa mem=1765636 bal=5162544 swapfree=693896 load1=0.50
2026-11-21T19:26:51Z boot=0c8a94aa mem=1495344 bal=5360908 swapfree=695316 load1=0.36
2026-11-21T19:27:51Z boot=0c8a94aa mem=1386608 bal=5540368 swapfree=695596 load1=0.21
2026-11-21T19:28:51Z boot=0c8a94aa mem=1128380 bal=5700700 swapfree=695888 load1=0.77
2026-11-21T19:29:51Z boot=0c8a94aa mem=1064696 bal=5843612 swapfree=699972 load1=0.98
2026-11-21T19:30:51Z boot=0c8a94aa mem=1006612 bal=5115948 swapfree=675540 load1=2.90
2026-11-21T19:31:51Z boot=0c8a94aa mem=1273452 bal=4779212 swapfree=658600 load1=5.42
2026-11-21T19:32:52Z boot=0c8a94aa mem=1559924 bal=4531728 swapfree=657220 load1=3.82
2026-11-21T19:33:52Z boot=0c8a94aa mem=1505008 bal=4762032 swapfree=657616 load1=2.72
2026-11-21T19:34:52Z boot=0c8a94aa mem=1472152 bal=4954204 swapfree=659156 load1=2.57
2026-11-21T19:35:52Z boot=0c8a94aa mem=1113672 bal=5111044 swapfree=661948 load1=3.02
2026-11-21T19:36:52Z boot=0c8a94aa mem=1138784 bal=5256068 swapfree=662928 load1=1.83
2026-11-21T19:37:52Z boot=0c8a94aa mem=1021584 bal=5397612 swapfree=669196 load1=0.75
2026-11-21T19:38:52Z boot=0c8a94aa mem=896144 bal=5523556 swapfree=668956 load1=0.48
2026-11-21T19:39:52Z boot=0c8a94aa mem=808920 bal=5642500 swapfree=667088 load1=0.28
2026-11-21T19:40:52Z boot=0c8a94aa mem=690948 bal=5750036 swapfree=669232 load1=0.23
2026-11-21T19:41:52Z boot=0c8a94aa mem=611072 bal=5849628 swapfree=666688 load1=0.28
2026-11-21T19:42:52Z boot=0c8a94aa mem=502436 bal=5937348 swapfree=668576 load1=0.29
2026-11-21T19:43:52Z boot=0c8a94aa mem=459380 bal=6018812 swapfree=662904 load1=0.58
2026-11-21T19:44:52Z boot=0c8a94aa mem=353728 bal=6088884 swapfree=659540 load1=1.30
2026-11-21T19:45:52Z boot=0c8a94aa mem=309116 bal=6156532 swapfree=653488 load1=0.54
2026-11-21T19:46:52Z boot=0c8a94aa mem=382432 bal=6131872 swapfree=633928 load1=0.77
2026-11-21T19:47:52Z boot=0c8a94aa mem=959144 bal=5476512 swapfree=626704 load1=1.61
2026-11-21T19:48:52Z boot=0c8a94aa mem=968432 bal=5454196 swapfree=628140 load1=0.97
2026-11-21T19:49:52Z boot=0c8a94aa mem=1376228 bal=5579316 swapfree=628240 load1=0.73
2026-11-21T19:50:52Z boot=0c8a94aa mem=788956 bal=5471544 swapfree=630020 load1=1.97
2026-11-21T19:51:52Z boot=0c8a94aa mem=717896 bal=5577760 swapfree=630144 load1=2.77
2026-11-21T19:52:52Z boot=0c8a94aa mem=730760 bal=5683472 swapfree=630792 load1=2.19
2026-11-21T19:53:52Z boot=0c8a94aa mem=632152 bal=5785504 swapfree=631860 load1=1.79
```

---

## Phụ lục — headroom log (59 dòng, 9 lần probe)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round164-t9/headroom-log.txt` — không gõ lại bằng tay (xem F-164-T9-10).

```
=== probe-mo 2026-11-21T17:40:09Z boot=f1d4ce1a tran=63756 uptime_s=402
0
0
ENOSPC-count=4
ENOSPC-lines:
Nov 21 17:36:35 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
Nov 21 17:37:45 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
Nov 21 17:38:55 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
Nov 21 17:39:57 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1037240 kB | Balloon:         5780912 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-pair-68 2026-11-21T18:07:51Z boot=0c8a94aa tran=63747 uptime_s=81
30001
30001
ENOSPC-count=0
ENOSPC-last: 
mem: MemAvailable:    1756568 kB | Balloon:         5089268 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-map-68-1 2026-11-21T18:08:22Z boot=0c8a94aa tran=63747 uptime_s=112
0
ENOSPC-count=0
mem: MemAvailable:    1573856 kB | Balloon:         5226256 kB
=== window-map-68-2 2026-11-21T18:09:52Z boot=0c8a94aa tran=63747 uptime_s=202
0
ENOSPC-count=2
ENOSPC-last: Nov 21 18:09:39 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1466740 kB | Balloon:         5306912 kB
=== window-map-68-3 2026-11-21T18:10:02Z boot=0c8a94aa tran=63747 uptime_s=212
0
ENOSPC-count=2
mem: MemAvailable:    1353112 kB | Balloon:         5369080 kB
=== probe-lan-2 2026-11-21T18:37:49Z boot=0c8a94aa tran=63747
1
2
ENOSPC-count=15
ENOSPC-last: Nov 21 18:24:03 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     528964 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-21T19:07:49Z boot=0c8a94aa tran=63747
2
2
ENOSPC-count=15
ENOSPC-last: Nov 21 18:24:03 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     547676 kB | Balloon:         6443824 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-4 2026-11-21T19:37:49Z boot=0c8a94aa tran=63747
0
0
ENOSPC-count=22
ENOSPC-last: Nov 21 19:37:49 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1022492 kB | Balloon:         5397612 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-dong 2026-11-21T19:53:55Z boot=0c8a94aa tran=63747
0
0
ENOSPC-count=35
ENOSPC-last: Nov 21 19:52:49 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     584664 kB | Balloon:         5785504 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```

---

*LIMITS này do T9 đợt 164 viết, đóng cờ 20:16Z 21/11/2026 (trước hạn cứng đóng 20:30Z; sau hạn cờ ~20:00Z 16 phút do kiểm tra lại toàn bộ số liệu từ log đóng băng — xem F-164-T9-10). Không push GitHub. Không sửa production. Không chạy TTS 39. Không thử birefnet (guard không mở).*
