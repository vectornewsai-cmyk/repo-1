# LIMITS — Phase 9 đợt 167, T9: headroom inotify + RAM + birefnet (0 lần thử lần thứ hai mươi mốt liên tiếp; headroom 0 lúc đóng, dưới ngưỡng lần thứ 27 liên tiếp; CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT LẦN THỨ NĂM LIÊN TIẾP (boot #74, đỉnh 14.072 — KHÔNG chạm CAP); balloon E-169 MỚI (20 mẫu, 4 chuỗi, 3 sag, ĐÃ KẾT THÚC — đứt không quan sát được); E-168 GIỮ 54 MẪU (kết cục trong khoảng mù, 2 reboot); ENOSPC ≥76 dòng (cận dưới); REBOOT #74 GIỮA PHIÊN; lượt yên #36 CÓ LƯỢT HỢP LỆ)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 0 lúc đóng (13 lần đo: 11 lần 0, 1 lần 14.072, 1 lần 8.708), dưới ngưỡng < ~1.800 lần thứ hai mươi bảy liên tiếp** — giá trị ổn định cuối phiên là **0** (đợt 166: 6; đợt 165: 2; đợt 164: 0). Trần **63.747 trên cả hai boot #73 và #74** (đợt 166: 63.747 trên cả #70 và #71). Quyết (k) "chỉ theo dõi" đứng, không hành động. Xem §1.
- **CỬA SỔ THOÁNG SAU REBOOT ĐƯỢC QUAN SÁT — LẦN THỨ NĂM LIÊN TIẾP (đợt 163 + 164 + 165 + 166 + 167):** trên boot mới #74 (btime 04:05:29Z), headroom **14.072 lúc 04:06:55Z (boot+86s) rồi 8.708 ngay trong cặp đo** — cửa sổ ĐANG ĐÓNG trong lúc đo, **KHÔNG chạm CAP 30.000 (lần đầu tiên kể từ đợt 163 đỉnh cửa sổ đo được dưới CAP)**; tới **04:08:29Z (boot+180s) đã về 0**; ENOSPC đầu tiên trên #74 lúc 04:08:27Z (boot+178s) → cửa sổ thực nằm trong khoảng boot+86s → boot+178s (**< 92 s** theo mốc ENOSPC; < 94 s theo mốc probe). Xem §1.2, F-167-T9-1.
- **Balloon — E-169 MỚI, 20 mẫu, 4 chuỗi, 3 sag, ĐÃ KẾT THÚC (đứt không quan sát được — reboot #74 cắt ngang):** **E-169: 03:16:34–04:05:35Z, 20 mẫu ghim, 4 chuỗi (6+8+2+4), 3 sag (sâu nhất 89,9% trần), boot #73, gate A ĐÓNG suốt span 50 mẫu** — 1 episode theo tiền lệ E-165 đợt 164 (3 chuỗi, 2 sag, gate A đóng suốt → 1 episode). Mẫu ghim cuối 04:05:35Z mang nhãn boot #73 **SAU btime #74 6 s** (overlap — cùng mẫu watcher-165 tại #70). **E-168: GIỮ 54 mẫu (quyết (g) đợt 166) — kết cục trong khoảng mù 3.446 s giữa hai đợt (01:41:07Z → 02:38:33Z) có 2 reboot (#72, #73); balloon trên #73 lúc mở đã 93,5% trần và leo lên nhưng khác boot, có reboot ở giữa → KHÔNG cộng thêm.** **Tổng ghim 20/128 mẫu (15,6%).** Trên #74 balloon cao nhất 99,61% trần (6.418.568 kB lúc 04:32:53Z) — KHÔNG ghim, KHÔNG có E-170. Xem §2.2.
- **RAM:** sampler **128 mẫu, 02:38:33Z–04:45:54Z, HAI boot (#73: 88 mẫu; #74: 40 mẫu)**. Max **2.522.812 kB (2.463,7 MiB = 40,10% guard) lúc 04:15:53Z** trên #74 — **thấp nhất trong chuỗi 150–167** (đợt 166: 69,93%; đợt 160: 40,50% — thấp nhất trước đó); min **383.116 kB lúc 04:05:35Z** (mẫu ghim cuối E-169, nhãn boot cũ sau btime mới) — **trũng NÔNG lại so với đợt 166 (372.732 kB) đúng 10.384 kB**; mean toàn phiên **928.493,0 kB — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU**. Gate A **36/128 mẫu**; **0 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt — birefnet 0 lần thử, lần thứ hai mươi mốt liên tiếp.** Xem §2, §3.
- **B2: 22 spike THẬT (grep '^=== SPIKE' = grep không neo = 22 — KHÔNG lặp F-166-T9-3), 16 QUY ĐƯỢC DRIVER CỤ THỂ + 6 load1 dư.** Bão mở đợt #73: 9 spike (02:43:33–02:50:46Z — T1 verify mask_anim/ffmpeg/ffprobe + T2 điều tra blind9696/find + apt-get post-invoke + hatch daemon); bão apt sau reboot #74: 6 spike (04:06:52–04:09:47Z — apt-get/dpkg post-boot + hatch daemon delta 62); O8: **4 spike TRONG cửa sổ O8** (04:33:53–04:35:36Z — WebKit ×2 + Chromium ×2, đều do chính O8 gây); harness: **3 spike** (04:45:12–04:46:23Z — Chromium gpu/renderer + 1 load1 dư). **0 spike trong cửa sổ attempt1 T4 (04:11:36–04:15:44Z); 0 spike trong cửa sổ ghim E-169.** Delta tick lớn nhất 117 tick/s (ffmpeg). Xem §2.5.
- **Lượt yên WebKit #36 (T4): CÓ LƯỢT HỢP LỆ — CHUỖI BẮT ĐẦU LẠI.** Attempt1-194efd93 (04:11:36–04:15:44Z): probe 20/20, lớp B 5/5, tickCost median 59,0 ≤ 60 — HỢP LỆ ngay lần thử đầu trên boot mới. Sampler T9 đối chiếu: gate A MỞ 3/4 mẫu trong cửa sổ (mẫu đầu 04:11:53Z 1.000.808 kB < gate); load1 0,38–1,84; 0 spike B2 trong cửa sổ. Poller instance 1 trên boot #73: 113 poll, 0 lần cửa mở (POSTBOOT_PASS #73 KHÔNG CÓ — replay chưa xong lúc reboot #74). Xem §2.3.
- **REBOOT #74 GIỮA PHIÊN (194efd93, btime 04:05:29Z; gap #73→#74 = 5.848 s) + REBOOT #73 TRƯỚC KHI ĐỢT MỞ (b643911f, btime 02:28:01Z; gap #72→#73 = 1.376 s):** sampler + watcher + probe-loop **CHẾT theo reboot #74** (điểm yếu (d) đợt 148 tái diễn lần thứ năm liên tiếp); khoảng trống phủ sóng trong log **77 s** (04:05:35Z → 04:06:52Z), **0 gap >90 s trong toàn phiên kể cả qua reboot**; T9 khởi động lại cả ba lúc 04:06:52Z (boot+83s) và bắt được cửa sổ thoáng headroom ở boot+86s bằng probe tay. (m) #73/#74 thuộc T2-167; kết cục run 166 + run 167 thuộc T7-167. Xem §5.
- **ENOSPC THẬT TRONG JOURNAL: #73 ≥54 dòng (đếm cuối 03:38:33Z; phần 03:38:33Z → reboot #74 mất theo reboot, KHÔNG cộng số ước) + #74 22 dòng = ≥76 dòng đếm được (cận dưới). Đợt thứ mười sáu liên tiếp bảng watch cạn gây lỗi thật thấy được.** Caveat: tối đa 3 dòng trong 54 dòng #73 có thể thuộc về khoảng trước khi đợt mở (02:28:01–02:35:51Z) — không xác định được vì journal #73 đã mất; số dòng thuộc về đợt 167 trên #73 theo cách trừ thận trọng nhất là ≥51 → tổng đợt ≥73 đến ≥76 (xem §4). Điểm mới: trên #74 ENOSPC tăng đều ~1 dòng/2 phút cả phiên (0 → 22 trong 40 phút) trong khi headroom 0 suốt — khác #71 đợt 166 (im 62 phút lúc headroom 6).
- **T8-167 (đối chiếu): CHƯA đóng cờ lúc T9 đóng (04:51Z)** — O8 chạy ~04:33–04:36Z (theo script clicktest-87o8 trong snapshot B2; 4 spike trong cửa sổ, đều do chính O8 gây); harness đang chạy lúc T9 đóng (clicktest-85m4 visible 04:46:23Z); (1c) phương án (A') đã duyệt đợt 166 — T8-167 triển khai diag-only, kết quả thuộc T8-167/T10. Xem §5.3.
- **T7-167 (đối chiếu): CHƯA đóng cờ lúc T9 đóng** — kết cục run 166 + run 167 + (m) #72/#73/#74 thuộc T7-167/T2-167. Xem §5.4.
- **T5-167 (đối chiếu): POSTBOOT_PASS #74 ĐÃ CÓ 04:10:23Z (theo T4-167); POSTBOOT_PASS #73 KHÔNG CÓ** (replay chưa xong lúc reboot #74). Xem §5.2.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000)

### 1.1 Phương pháp

Script `hidden_files/round167-t9/k8-headroom.py` (copy y nguyên từ đợt 166 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches`.

### 1.2 Số đo đợt 167 (13 lần đo, 2 boot)

| Thời điểm (UTC) | Headroom | Boot | Trần | Bối cảnh |
|---|---|---|---|---|
| 02:39:46Z 22/11 | **0** | #73 b643911f (btime 02:28:01Z) | 63.747 | lần đo 1–2, lúc mở (boot+705s); RAM 691.436 kB, balloon 6.163.256 kB (95,7% trần); ENOSPC-count=3 (dòng mới nhất 02:39:10Z) |
| 02:39:46Z 22/11 | **0** | #73 b643911f | 63.747 | lần đo 2 (chênh **0** so với lần 1) |
| 03:08:33Z 22/11 | **0** | #73 b643911f | 63.747 | lần đo 3–4, probe-loop lan-2; ENOSPC-count=28 (dòng mới nhất 03:08:10Z); balloon 5.786.420 kB |
| 03:08:33Z 22/11 | **0** | #73 b643911f | 63.747 | lần đo 4 (chênh **0**) |
| 03:38:33Z 22/11 | **0** | #73 b643911f | 63.747 | lần đo 5–6, probe-loop lan-3; ENOSPC-count=54 (dòng mới nhất 03:38:00Z); balloon ĐANG GHIM TRẦN (E-169), RAM 884.996 kB |
| 03:38:33Z 22/11 | **0** | #73 b643911f | 63.747 | lần đo 6 (chênh **0**) |
| 04:06:55Z 22/11 | **14.072** | #74 194efd93 (btime 04:05:29Z) | 63.747 | lần đo 7–8, cặp cửa sổ (boot+86s); **KHÔNG chạm CAP 30.000 — gặp ENOSPC ở 14.072**; RAM 1.943.992 kB, balloon 4.875.560 kB; ENOSPC-count=0 trên boot mới |
| 04:06:55Z 22/11 | **8.708** | #74 194efd93 | 63.747 | lần đo 8, cặp cửa sổ (boot+~86s); **giảm 5.364 watch so với lần đo 7 trong cùng cặp — cửa sổ ĐANG ĐÓNG trong lúc đo** |
| 04:08:29Z 22/11 | **0** | #74 194efd93 | 63.747 | lần đo 9, window-map-74-1 (boot+180s); **cửa sổ ĐÃ ĐÓNG**; ENOSPC-count=2 (dòng ENOSPC đầu tiên trên #74 lúc 04:08:27Z, boot+178s) |
| 04:36:52Z 22/11 | **0** | #74 194efd93 | 63.747 | lần đo 10–11, probe-loop lan-2 (sau khởi động lại); ENOSPC-count=14 (dòng mới nhất 04:35:57Z); balloon 5.241.756 kB |
| 04:36:52Z 22/11 | **0** | #74 194efd93 | 63.747 | lần đo 11 (chênh **0**) |
| 04:46:20Z 22/11 | **0** | #74 194efd93 | 63.747 | lần đo 12–13, đóng phiên (boot+2.451s); balloon 4.980.396 kB, RAM 1.319.104 kB; ENOSPC-count=22 (dòng mới nhất 04:45:17Z) |
| 04:46:20Z 22/11 | **0** | #74 194efd93 | 63.747 | lần đo 13 (chênh **0**) |

- Probe dừng ở `i=0` trong 11/13 lần đo; dừng ở `i=14.072` và `i=8.708` trong cặp cửa sổ 04:06:55Z (gặp ENOSPC thật, không chạm CAP). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` = 0 thư mục sót — kiểm tra sau mỗi cặp đo / mỗi lần map).
- **Cửa sổ thoáng sau reboot (boot #74): MỞ lúc boot+86s (14.072, đã rơi xuống 8.708 trong cùng cặp đo), ĐÓNG trước boot+180s (0).** ENOSPC đầu tiên trên #74 lúc 04:08:27Z (boot+178s) — bảng watch đã đầy trở lại vào lúc đó, nên cửa sổ thực nằm trong khoảng boot+86s → boot+178s (**< 92 s** theo mốc ENOSPC; < 94 s theo mốc probe). So với đợt 166 (< 45 s: boot+66s → boot+111s), đợt 165 (< 41 s), đợt 164 (< 31 s) và đợt 163 (< 40 s): mốc đợt này rộng hơn vì (a) lần đo đầu muộn hơn (boot+86s so với boot+63–81s các đợt trước — T9 khởi động lại sau reboot, không có mặt sớm hơn được), và (b) đỉnh đo được THẤP HƠN NHIỀU (14.072, không chạm CAP — xem F-167-T9-1). T9 ghi đúng mốc đo, không ép số cho khớp chuỗi. Giá trị đỉnh thật của cửa sổ không biết được (chỉ biết ≥14.072 tại boot+86s; cửa sổ đã mở trước đó và đã rơi khỏi 30.000 trước khi T9 đo — xem F-167-T9-1).
- **Headroom sau cửa sổ: 0 ổn định (04:08:29Z → 04:46:20Z, 5 lần đo).** ENOSPC trên #74 tăng đều 0 → 22 trong 40 phút (~1 dòng/2 phút) trong khi headroom 0 suốt — khác #71 đợt 166 (im 62 phút lúc headroom 6). Số watch đang giữ ngoài cell suy ra lúc đóng: 63.747 − 0 = **63.747 watch** (bảng đầy hoàn toàn, 0 slot trống) trên #74.
- **So sánh với đợt 166:** đợt 166 mở 0 trên #70 (2 lần đo) → reboot #71 giữa phiên → thoáng ≥30.001 (chạm CAP) trong <45 s → 0 (1 lần) → 6 (1 lần) → 0 (2 lần) → 6 ổn định tới đóng. Đợt này mở 0 trên #73 (6 lần đo) → reboot #74 giữa phiên → thoáng 14.072 → 8.708 (cặp cửa sổ, đang đóng) trong <92 s → **0 ổn định 5 lần đo tới đóng**. **Cửa sổ thoáng sau reboot ĐƯỢC quan sát lần thứ năm liên tiếp** (đợt 163 + 164 + 165 + 166 + 167) — cả năm lần đều nhờ reboot xảy ra GIỮA phiên nên T9 có mặt đúng lúc. **Caveat: cửa sổ của reboot #73 KHÔNG quan sát được** — #73 xảy ra TRƯỚC khi T9 mở (btime 02:28:01Z, T9 khởi động sampler 02:38:33Z = boot+632s; cửa sổ nếu có đã đóng trước đó); chuỗi "lần thứ năm liên tiếp" là nhờ #74, không phải #73 (xem F-167-T9-2).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): **0 / 1.578 = 0** — một vite mới (~1.578 watch) vẫn không khởi động được.
- T5-167 KHÔNG probe lại headroom đợt này (như đợt 151–166) nên không có số đối chiếu độc lập đợt này; số T9 đứng trên 13 lần đo + phương pháp không đổi từ đợt 109. **Đối chiếu độc lập ngoài probe: journal boot #74 có 22 dòng systemd không thêm được inotify watch do ENOSPC (xem §4), và ENOSPC tăng đều trong khi headroom 0** — cùng kết luận bằng nguồn khác.
- **Trần KHÔNG ĐỔI giữa hai boot đợt này: 63.747 trên cả #73 và #74** (đợt 166: 63.747 trên cả #70 và #71 — lần thứ ba liên tiếp hai boot có cùng trần). T9 chỉ ghi số đo, không phán cơ chế.
- Lưu ý: RAM lúc đóng (1.319.104 kB) CAO hơn RAM lúc mở (691.436 kB) trong khi headroom 0 → 0. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).
- Probe-loop lan-2 gốc (dự kiến ~03:08:5xZ) CHẠY ĐÚNG (03:08:33Z) và lan-3 (03:38:33Z) CHẠY ĐÚNG trước reboot #74; probe-loop MỚI sau khởi động lại chạy lan-2 lúc 04:36:52Z (nhãn "probe-lan-2" xuất hiện ĐÚNG HAI lần trong headroom-log — một lần trên #73, một lần trên #74 sau khởi động lại — KHÔNG phải lặp nhãn lỗi như F-165-T9-7; T9 ghi rõ boot từng lần). Probe-loop mới lan-3 (dự kiến ~05:06:52Z) KHÔNG chạy — probe-loop đã dừng lúc T9 đóng (04:46Z); cặp probe đóng 04:46:20Z thay thế.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–166 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **167** | **0 → 14.072 → 8.708 (thoáng, boot+86s, đang đóng) → 0** | **mở 02:39:46Z boot #73 b643911f btime 02:28:01Z (trần 63.747): 0 ×6 (02:39:46–03:38:33Z) → sau reboot #74 04:05:29Z boot MỚI 194efd93 (trần 63.747): 14.072, 8.708 lúc boot+86s → 0 lúc boot+180s → 0 ×4 (04:36:52–04:46:20Z) → đóng 04:46:20Z cùng boot #74: 0, 0 (MỘT reboot giữa phiên + MỘT reboot trước khi đợt mở; 13 lần đo, 11 lần 0, 1 lần 14.072, 1 lần 8.708)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331 → 323 → 308 → 194 → 90 → 82 → 0 → 0 → 0 → 0 → 2 → 0 → 0 → 0 → 2 → 2 → 0 → 2 → 0 → 6 → 0**.

- **Xu hướng: GIẢM DÀI HẠN, CHẠM SÀN 0–2 — giá trị đóng phiên là 0** (đợt 166 đóng 6; đợt 165 đóng 2; đợt 164 đóng 0). Từ đỉnh chuỗi 4.438 xuống 0 = **−4.438 (−100%)**. Giá trị 14.072/8.708 chỉ xuất hiện trong cặp cửa sổ boot+86s trên #74, không phải giá trị ổn định (cửa sổ đóng trước boot+180s).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 0, thấp hơn ngưỡng 1.800, lần thứ hai mươi bảy liên tiếp** (tính theo giá trị ổn định lúc đóng). Quyết parent đợt 166 (k) GIỮ quyết (k) "chỉ theo dõi" — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng hay yêu cầu user hành động. **Dữ kiện mới giao parent/T10 xem lại quyết (g): journal hai boot đợt này có ≥54 + 22 = ≥76 dòng lỗi ENOSPC thật của systemd trong phiên** — đợt thứ mười sáu liên tiếp cạn watch gây lỗi thấy được (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng — T9 đếm trực tiếp 35 dòng boot #68 + ghi số đếm T5 18 dòng boot #67; đợt 165: ≥64 dòng — T9 đếm trực tiếp, parent quyết (l) chấp nhận làm số chính thức; đợt 166: ≥56 dòng — T9 đếm trực tiếp, parent quyết (l) chấp nhận làm số chính thức; đợt 167: ≥76 dòng — T9 đếm trực tiếp, xem §4). T9 chỉ nêu dữ kiện, không đề xuất đổi quyết.
- **Trần KHÔNG ĐỔI trong từng boot** (63.747 trên #73 suốt 6 lần đo; 63.747 trên #74 suốt 7 lần đo) và **KHÔNG ĐỔI giữa hai boot** (63.747 = 63.747 — lần thứ ba liên tiếp hai boot có cùng trần). T9 ghi đúng số đo từng boot, không phán cơ chế.

## 2. RAM khả dụng (tổng 8.124.900 kB trên cả #73 và #74 — xem ghi chú; swap 1.048.572 kB) — sampler 128 mẫu, 02:38:33Z–04:45:54Z, HAI boot

- Ghi chú tổng RAM: `/proc/meminfo` MemTotal đọc 8.124.900 kB ở cả mẫu đầu #73 và lúc đóng trên #74 (KHÔNG chênh giữa hai boot — khác đợt 166 chênh 4 kB; T9 ghi đúng số đọc được, không phán; mọi tỉ lệ guard trong file này dùng guard 6.291.456 kB = 6.144 MiB, không dùng MemTotal).

### 2.1 Hình dạng cửa sổ: mở phiên RAM thấp + balloon leo tới trần → E-169 ghim 4 chuỗi (3 sag) → REBOOT #74 cắt ngang → cửa sổ thoáng headroom → bão apt post-boot → balloon leo gần trần nhưng KHÔNG ghim → xả sâu cuối phiên (load1 4,74)

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1 (cadence ~60 s; **gap lớn nhất trong log 77 s (qua reboot #74); 0 gap >90 s trong log** — xem §5.1; khoảng trống phủ sóng ĐẦU PHIÊN 162 s tính từ lúc đợt mở tới khi T9 khởi động sampler — xem F-167-T9-2). **128 mẫu, 02:38:33Z–04:45:54Z, HAI boot (#73: 88 mẫu; #74: 40 mẫu).** Tổng quan: **min 383.116 kB (374,1 MiB) lúc 04:05:35Z** (mẫu ghim cuối E-169, nhãn boot #73 sau btime #74 6 s); **max 2.522.812 kB (2.463,7 MiB) lúc 04:15:53Z — 40,10% guard** (balloon xả 4.433.352 kB, trên #74); **mean toàn phiên 928.493,0 kB (906,7 MiB) — tính bằng 3 cách (python + awk + trung bình có trọng số) KHỚP NHAU (xem cuối §2.1).**

| Giai đoạn (UTC) | Boot | RAM khả dụng | Ghi chú |
|---|---|---|---|
| 02:38:33–04:05:35Z | #73 | 383.116–2.145.168 kB | Mở phiên: balloon leo từ 6.061.152 kB (94,1% trần) lên ghim trần; **E-169: 20 mẫu ghim, 4 chuỗi, 3 sag** (xem §2.2); BÃO MỞ ĐỢT (9 spike B2, load1 tới 5,06 — xem §2.5); T4 poller instance 1: 113 poll, 0 lần cửa mở (POSTBOOT_PASS #73 KHÔNG CÓ); **RAM max trên #73 2.145.168 kB lúc 02:45:33Z** (34,10% guard); gate A MỞ 16/88 mẫu; load1 ≥3,0 ở 12/88 mẫu; reboot #74 cắt ngang lúc 04:05:29Z |
| 04:06:52–04:45:54Z | #74 | 465.000–2.522.812 kB | Boot mới: cửa sổ thoáng headroom (boot+86s, xem §1.2); BÃO APT POST-BOOT (6 spike B2, load1 tới 5,07 — xem §2.5); T4 attempt1 HỢP LỆ (04:11:36–04:15:44Z — xem §2.3); O8: 4 spike trong cửa sổ (04:33:53–04:35:36Z — xem §2.5); harness: 3 spike (04:45:12–04:46:23Z); balloon leo từ 4.875.560 kB (75,7% trần) lên 6.418.568 kB (99,61% trần) lúc 04:32:53Z rồi xả sâu về 4.906.980 kB lúc 04:45:54Z — **KHÔNG ghim lần nào trên #74 (0 mẫu)**; gate A MỞ 20/40 mẫu; load1 ≥3,0 ở 3/40 mẫu (sampler) |

- **Gate A ≥1024 MiB: 36/128 mẫu** (#73: 16/88; #74: 20/40); **0 mẫu ≥ guard**; load1 max (sampler) **5,07 lúc 04:07:52Z** (bão apt #74 — watcher bắt 4,86 lúc 04:06:52Z, xem §2.5); **15/128 mẫu load1 ≥3,0** (12 trên #73 trong bão mở đợt + 3 trên #74 trong bão apt/harness). **RAM <512.000 kB: 30 mẫu** (28 trên #73 — trong đó 20 mẫu ghim E-169 + 8 mẫu sag/xả; 2 trên #74); **RAM <300.000 kB: 0 mẫu** (đợt 166: 0 mẫu; đợt 165: 2 mẫu — giữ 0 lần thứ hai liên tiếp).
- Swap: SwapFree 878.464 kB (mẫu đầu) → 587.776 kB (thấp nhất phiên, lúc 04:04:35Z) → 1.002.624 kB (mẫu đầu #74, 04:06:52Z). Nhịp nhảy SwapFree qua reboot #74: 594.752 kB (mẫu cuối trước reboot, 04:05:35Z) → 1.002.624 kB (mẫu đầu #74, 04:06:52Z) — swap được nhả ~407.872 kB qua reboot (đợt 166: 756.836 → 1.040.552 kB qua reboot #71).
- Mẫu 04:15:53Z (đỉnh phiên): RAM 2.522.812 kB, balloon xả 4.433.352 kB — balloon xả sâu nhất phiên ~4 phút sau attempt1 HỢP LỆ của T4 (cùng mẫu đợt 152–166: xả sâu sau attempt / lúc suite chạy). T9 ghi đúng số đo, không phán cơ chế.
- Trũng RAM đợt này: min 383.116 kB (đợt 166: 372.732 kB; đợt 165: 248.768 kB; đợt 164: 309.116 kB; đợt 163: 365.952 kB; đợt 162: 385.484 kB; đợt 161: 417.016 kB; đợt 160: 458.636 kB; đợt 159: 499.084 kB; đợt 158: 199.248 kB) — **trũng NÔNG lại so với đợt 166 đúng 10.384 kB** (chuỗi trũng sâu dần 3 đợt đã dứt đợt 166, đợt này nông tiếp). 30 mẫu <512.000 kB trong 128 mẫu (23,4% — cao hẳn đợt 166: 5 mẫu, 4,1%, vì đợt này ghim + sag kéo dài trên #73 lúc RAM thấp: E-169 ghim lúc RAM 383–494.000 kB); riêng trong span E-169 (50 mẫu, 03:16:34–04:05:35Z): 28/50 mẫu <512.000 kB (56,0%); trong cửa sổ ghim (20 mẫu): 20/20 mẫu <512.000 kB (100%).

**Bảng tổng hợp số RAM (từ script `t9-167-analyze.py` chạy trên `ram-sampler-FROZEN.log`, 128 dòng — KHÔNG tính tay, đã đối chiếu lại từ log đóng băng lúc đóng cờ bằng script `t9-167-recheck.py`):**

| Phạm vi | n | min (kB) | max (kB) | mean (kB) | gate A | ghim trần | load1 max | <512k |
|---|---|---|---|---|---|---|---|---|
| #73 b643911f | 88 | 383.116 | 2.145.168 | 790.307,1 | 16/88 | 20 | 5,06 | 28 |
| #74 194efd93 | 40 | 465.000 | 2.522.812 | 1.232.501,8 | 20/40 | 0 | 5,07 | 2 |
| **Toàn phiên** | **128** | **383.116** | **2.522.812** | **928.493,0** | **36/128** | **20/128 (15,6%)** | **5,07** | **30** |

- **Mean toàn phiên 928.493,0 kB — tính bằng 3 cách độc lập: python `sum/n = 928.493,0` VÀ awk `sum/n = 928.493` VÀ trung bình có trọng số từ mean từng boot: (88×790.307,1 + 40×1.232.501,8)/128 = 928.493,0 — KHỚP CẢ BA. KHÔNG lặp F-163-T9-1** (mean sai 4.253 kB đợt 163). Mean từng boot cũng khớp python/awk từng số (xem §6 — script recheck assert cả hai mean từng boot).
- 30 mẫu RAM <512.000 kB (từ log đóng băng): 02:41:33Z 489.232; 03:15:34Z 410.636; 03:16:34–03:21:34Z 6 mẫu ghim (442.444 / 414.008 / 418.964 / 428.064 / 404.208 / 442.972); 03:26:34Z 451.912 (sag A); 03:27:34–03:34:34Z 8 mẫu ghim (399.016 / 391.824 / 398.704 / 410.292 / 395.840 / 412.768 / 433.340 / 393.384); 03:35:34Z 482.984 (sag B); 03:36:34–03:37:34Z 2 mẫu ghim (493.940 / 445.156); 03:48:35Z 464.544; 03:59:35Z 467.368; 04:00:35Z 449.084; 04:01:35Z 433.816 (sag C); 04:02:35–04:05:35Z 4 mẫu ghim (417.056 / 400.272 / 400.144 / 383.116 — min phiên); 04:32:53Z 465.000 (#74, balloon 99,61%); 04:43:54Z 510.576 (#74).

### 2.2 Balloon virtio — E-169 MỚI (20 mẫu, 4 chuỗi, 3 sag, ĐÃ KẾT THÚC — đứt không quan sát được) + E-168 GIỮ 54 MẪU (kết cục trong khoảng mù)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot #73 (b643911f): GHIM TRẦN 20/88 mẫu (22,7%), trong 4 chuỗi — 1 EPISODE MỚI (E-169, ĐÃ KẾT THÚC).**
  - Leo lên trần trên boot #73: từ 02:38:33Z (6.061.152 kB, 94,1% trần) lên ghim lúc 03:16:34Z trong ~38 phút, rồi ghim–xả–ghim lại 4 chuỗi tới 04:05:35Z.
  - **E-169 — chuỗi 1: 03:16:34–03:21:34Z, 6 mẫu** (RAM 404.208–442.972 kB; gate A ĐÓNG cả 6 mẫu).
  - **Sag A: 03:22:34–03:26:34Z, 5 mẫu** — balloon tụt khỏi trần xuống tối thiểu **6.050.608 kB (93,9% trần)** lúc 03:22:34Z rồi leo lại tới 6.402.264 kB (99,4% trần) lúc 03:26:34Z; gate A ĐÓNG cả 5 mẫu.
  - **E-169 — chuỗi 2: 03:27:34–03:34:34Z, 8 mẫu** (RAM 391.824–433.340 kB; gate A ĐÓNG cả 8 mẫu).
  - **Sag B: 03:35:34Z, 1 mẫu** — balloon **6.378.288 kB (99,0% trần)**; gate A ĐÓNG.
  - **E-169 — chuỗi 3: 03:36:34–03:37:34Z, 2 mẫu** (RAM 493.940 / 445.156 kB; gate A ĐÓNG cả 2 mẫu).
  - **Sag C: 03:38:34–04:01:35Z, 24 mẫu** — balloon tụt khỏi trần xuống tối thiểu **5.791.016 kB (89,9% trần)** lúc 03:55:35Z (sag SÂU NHẤT episode) rồi leo lại tới 6.421.652 kB (99,7% trần) lúc 04:01:35Z; gate A ĐÓNG cả 24 mẫu.
  - **E-169 — chuỗi 4: 04:02:35–04:05:35Z, 4 mẫu** (RAM 383.116–417.056 kB; gate A ĐÓNG cả 4 mẫu); **mẫu ghim cuối 04:05:35Z mang nhãn boot #73 SAU btime #74 (04:05:29Z) 6 s** — overlap, xem F-167-T9-3.
  - **E-169 ĐÃ KẾT THÚC — đứt KHÔNG quan sát được chính xác:** mẫu ghim cuối quan sát được 04:05:35Z (nhãn boot cũ, sau btime mới); reboot #74 cắt ngang; balloon trên boot mới #74 **không ghim lại lần nào** (max 6.418.568 kB = 99,61% trần lúc 04:32:53Z). Thời điểm đứt thật nằm trong khoảng mù (04:05:35Z, 04:06:52Z] (77 s) — T9 không claim thời điểm cụ thể.
  - **Gate A ĐÓNG suốt span E-169 (50 mẫu, 03:16:34–04:05:35Z): 0/50 mẫu mở** (0/30 mẫu trong các sag + 0/20 mẫu ghim).
  - **Tổng E-169: 20 mẫu ghim / 4 chuỗi / 3 sag / 1 boot (#73).**
- **Boot #74 (194efd93): GHIM TRẦN 0/40 mẫu (0%) — KHÔNG có episode mới.** Balloon leo từ 4.875.560 kB (75,7% trần) lúc 04:06:52Z lên tối đa 6.418.568 kB (99,61% trần) lúc 04:32:53Z rồi xả sâu về 4.906.980 kB lúc 04:45:54Z. **KHÔNG có E-170.**
- **E-168 — KẾT CỤC (thuộc T9-167 theo quyết (g) đợt 166): GIỮ 54 mẫu, KHÔNG cộng thêm.** Mẫu ghim cuối đợt 166: 01:41:07Z trên #71. Khoảng mù giữa hai đợt **3.446 s (01:41:07Z → 02:38:33Z)** có **HAI reboot (#72 btime 02:05:05Z + #73 btime 02:28:01Z)**. Balloon trên #73 lúc T9 mở (02:38:33Z) đã 6.061.152 kB (94,1% trần) và leo lên ghim lúc 03:16:34Z — nhưng đó là **E-169 trên boot mới, không phải tiếp nối E-168** (khác boot — 2 reboot ở giữa; balloon xả về 4.875.560 kB trên #74 sau đó rồi leo lại — cùng mẫu tách E-167/E-168 đợt 166). **E-168 tổng GIỮ 54 mẫu (quyết (g) đợt 166) — kết cục: đã kết thúc trong khoảng mù, thời điểm đứt không quan sát được.**
- **Tổng ghim trần đợt này: 20/128 mẫu (15,6%)** (đợt 166: 55/123 = 44,7%; đợt 165: 58/134 = 43,3%; đợt 164: 35/135 = 25,9%; đợt 163: 49/133 = 36,8%; đợt 162: 66/139 = 47,5%; đợt 161: 39/139 = 28,1%; đợt 160: 56/132 = 42,4%; đợt 159: 30/135 = 22,2%; đợt 158: 38/136 = 27,9%; đợt 157: 33/129 = 25,6%; đợt 156: 30/137 = 21,9%; đợt 155: 46/112 = 41,1%; đợt 154: 65/125 = 52,0%; đợt 153: 65/131 = 49,6%; đợt 152: 27/124 = 21,8%). **1 episode mới trong đợt 167 (E-169: 20 mẫu / 4 chuỗi / 3 sag, đã kết thúc)** — khác đợt 166 (1 episode mới 54 mẫu / 1 chuỗi / 0 sag + đuôi E-167) và đợt 164 (1 episode, 3 chuỗi, 2 sag).
- **Phán theo quy tắc quyết (e)/(g) + quyết (j) đợt 163 (T9 phán, giao T10 xác nhận cách đếm):**
  - **E-169: 1 EPISODE MỚI (20 mẫu / 4 chuỗi / 3 sag / boot #73, đã kết thúc).** 4 chuỗi ghim trên CÙNG boot, các sag NÔNG (93,9% / 99,0% / 89,9% trần — không có xả sâu), gate A ĐÓNG suốt span 50 mẫu → **1 episode theo đúng tiền lệ E-165 đợt 164** (3 chuỗi, 2 sag, gate A đóng suốt → 1 episode; quyết parent đợt 164 ghi nhận). KHÔNG tách thành 4 episode (không có xả sâu + leo lại quan sát được theo tiêu chí tách; sag sâu nhất chỉ xuống 89,9% trần — khác hẳn xả về 30,2% trần giữa E-167 và E-168).
  - **E-168: GIỮ 54 mẫu (quyết (g) đợt 166) — kết cục trong khoảng mù, không cộng thêm.** Hai reboot + khác boot tách E-168 khỏi E-169 theo BẤT KỲ tiêu chí nào.
  - **Đợt 167 = 1 EPISODE GHIM MỚI (E-169: 20 mẫu, 4 chuỗi, 3 sag, đã kết thúc)** + kết cục E-168 (54 mẫu, giữ nguyên).
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim E-169 chỉ ~383–494.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối chuỗi ghim 4 của E-169 (04:05:35Z): tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable 383.116 kB (log thật).

### 2.3 Lượt yên WebKit #36 (T4, đợt 167) — CÓ LƯỢT HỢP LỆ, CHUỖI BẮT ĐẦU LẠI (LIMITS T4 đã xuất bản — T9 đối chiếu, không phán thay T4)

- **T4-167 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND167_T4_WEBKIT_QUIET36_LIMITS.md`) + cờ `round167-t4.done` — T9 trích verdict từ LIMITS T4 đã xuất bản + đối chiếu bằng sampler độc lập.
- **#36 CÓ LƯỢT HỢP LỆ — CHUỖI LƯỢT YÊN HỢP LỆ BẮT ĐẦU LẠI (sau khi đứt tại #35 đợt 166).**
- **Attempt1-194efd93 (04:11:36–04:15:44Z): probe 20/20, lớp B 5/5 SẠCH, tickCost median 59,0 ms ≤ 60 — HỢP LỆ ngay lần thử đầu trên boot mới.** Poller thoát 04:15:44Z vì LUOT HOP LE (trước hạn cắt poller 04:30Z 14m16s).
- **Poller instance 1 — boot cũ b643911f, 113 poll, 0 lần cửa mở** (POSTBOOT_PASS #73 KHÔNG CÓ — replay chưa xong lúc reboot #74; poll cuối #113 04:05:32Z vẫn ghi boot cũ — poller KHÔNG thấy reboot). **Poller instance 2 — boot mới 194efd93, 5 poll, 1 lần cửa mở (poll #5, 04:11:35Z)** — gate0: POSTBOOT_PASS #74 ĐÃ CÓ 04:10:23Z (T5-167).
- **REBOOT #74 GIỮA PHIÊN (~04:05:29Z) GIẾT POLLER instance 1** (cùng mẫu sampler/watcher/probe-loop của T9 chết theo reboot).
- **Đối chiếu sampler T9 (độc lập, cadence 60 s):**
  - Attempt1-#74: gate A MỞ **3/4 mẫu** trong cửa sổ (04:11:53Z 1.000.808 kB — **ĐÓNG**, dưới gate 47.768 kB; 04:12:53Z 1.228.824 kB; 04:13:53Z 2.002.184 kB; 04:14:53Z 1.784.008 kB — cả 3 đều ≥1024 MiB).
  - Tải: sampler load1 trong cửa sổ attempt1 **0,38–1,84**; **0 spike B2 trong cửa sổ attempt1**. Attempt1 hợp lệ trong lúc tải thấp, 0 spike — cùng mẫu attempt hợp lệ các đợt trước (khác #35: attempt1 KHÔNG hợp lệ và CÓ spike do chính WebKit gây).
  - RAM <512.000 kB: sampler T9 **0 mẫu <512.000 kB trong cửa sổ attempt1**.
- **Cộng dồn (theo T4-167): chuỗi lượt yên hợp lệ BẮT ĐẦU LẠI từ #36 (1 lượt hợp lệ mới sau khi đứt tại #35).** T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- T9 không phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.4 Dữ kiện sampler T9 trong cửa sổ poller của T4 (độc lập, cadence 60 s)

Poller T4 instance 2 chạy attempt1 04:11:36–04:15:44Z (instance 1 trên boot cũ không có attempt nào).

| Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|
| 04:11:53–04:14:53Z | #74 | 0,38–1,84 (4 mẫu) | 1.000.808–2.002.184 kB — **gate A MỞ 3/4** | T4 attempt1 — **0 spike B2 trong cửa sổ**; attempt1 HỢP LỆ (lớp B 5/5 + tickCost median 59,0) |

### 2.5 B2 — 22 spike THẬT, 16 QUY ĐƯỢC DRIVER CỤ THỂ + 6 load1 dư (4 spike TRONG cửa sổ O8 — đều do chính O8 gây; 3 spike TRONG cửa sổ harness — 2 do chính harness gây + 1 load1 dư; 0 spike trong cửa sổ attempt1 / cửa sổ ghim E-169)

Watcher đã sửa theo quyết (n) đợt 150 — loại `ps` của chính watcher khỏi top snapshot (xem §6, F-167-T9-6). **22 spike THẬT (đếm bằng `grep '^=== SPIKE'` = 22, `grep '=== SPIKE'` không neo cũng = 22 — KHÔNG lặp F-166-T9-3): 9 spike bão mở đợt #73 + 6 spike bão apt sau reboot #74 (04:06:52–04:09:47Z) + 4 spike O8 (04:33:53–04:35:36Z) + 3 spike harness (04:45:12–04:46:23Z); 0 spike trong cửa sổ ghim E-169 (03:16:34–04:05:35Z, cả 4 chuỗi + 3 sag); 0 spike trong cửa sổ attempt1; 0 spike trong cửa sổ kẹt (không có kẹt T4 đợt này).**

| Cụm | Thời điểm (UTC) | load1 | Spike | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|---|
| 1 — bão mở đợt #73 (9 spike) | 02:43:33–02:50:46Z | 3,01 → 4,80 → 3,01 | 9 | 02:43:33Z: mask_anim delta **90** + blind9696 delta 27 + hatch 19; 02:44:08Z: ffmpeg delta **117** + mask_anim 0 (chết giữa chừng); 02:44:44Z: ffprobe **66,6%** tích lũy (delta-miss — xem dưới); 02:45:19Z: **load1 dư** (delta max 11 — hatch daemon; top -b 60,0% idle, 0 wa); 02:45:55Z: ffmpeg **132%** tích lũy (delta-miss); 02:46:30Z: ffmpeg delta **116** + hatch 16; 02:47:05Z: **load1 dư** (find T2 D-state 20,0% tức thời, iowait 19,0% — hatch delta 36, xem F-167-T9-5); 02:47:40Z: **load1 dư** (find T2 D-state 9,1% tức thời, iowait 19,5% — hatch delta 20, find delta-miss, xem F-167-T9-5); 02:50:46Z: **load1 dư** (delta max 11 — hatch daemon; top -b 92,9% idle, 0 wa) | **Bão mở đợt 167: T1 verify suite (mask_anim/ffmpeg/ffprobe/test_pixelate) + T2 điều tra (blind9696 + find) + apt-get post-invoke + hatch daemon — nhiều luồng mở cùng lúc trên boot #73** (cùng mẫu đợt 163/164/165/166). Load1 max đợt (sampler) **5,06 lúc 02:45:33Z** (watcher bắt 4,80 lúc 02:44:08Z). **KHÔNG spike nào trong cụm này nằm trong cửa sổ attempt** (attempt1 bắt đầu 04:11:36Z trên boot mới, sau cụm này ~1h21m) |
| 2 — bão apt sau reboot #74 (6 spike) | 04:06:52–04:09:47Z | 3,11 → 4,86 → 3,53 | 6 | 04:06:52Z: dpkg **54,3%** tích lũy + hatch daemon delta **62** + apt-get (delta-miss — xem dưới); 04:07:28Z: apt-get **62,3%** tích lũy (delta-miss); 04:08:04Z: apt-get delta **58** + hatch 20; 04:08:39Z: apt-get **74,8%** tích lũy (delta-miss); 04:09:13Z: dpkg **89,4%** + apt-get 70,0% tích lũy (delta-miss); 04:09:47Z: **load1 dư** (delta max 8 — hatch daemon; top -b 83,3% idle, 0 wa) | **Bão apt/dpkg post-boot trên #74** (apt-get -o DPkg::Post-Invoke + dpkg unpack — hoạt động hệ thống sau reboot, cùng mẫu đợt 166); **KHÔNG phải tải của VCut**; load1 max cụm 5,07 (sampler 04:07:52Z) / 4,86 (watcher 04:06:52Z) |
| 3 — T8 O8 (4 spike TRONG cửa sổ) | 04:33:53–04:35:36Z | 3,19 → 4,23 → 3,75 | 4 | 04:33:53Z: WebKitWebProcess **57,9%** + MiniBrowser 49,4% tích lũy (delta-miss — cả hai chết giữa chừng, xem dưới); 04:34:25Z: WebKitWebProcess delta **58** + MiniBrowser delta **50** (O8 WebKit clicktest-87o8); 04:35:01Z: chrome delta **66** (O8 Chromium); 04:35:36Z: chrome renderer delta **27** + chrome 1 (O8 Chromium) | **T8 O8 (WebKit + Chromium)** — cả bốn spike NẰM TRONG cửa sổ O8 (~04:33–04:36Z, script clicktest-87o8-mask-track-webkit.mjs trong snapshot); driver là chính process O8, không phải tải lạ (cùng mẫu đợt 166: spike harness do chính process harness) |
| 4 — T8 harness (3 spike) | 04:45:12–04:46:23Z | 3,57 → 4,37 → 4,01 | 3 | 04:45:12Z: chrome gpu-process delta **96** + renderer delta **25**; 04:45:47Z: **load1 dư** (delta max 5 — hatch daemon; top -b 95,3% idle, 0 wa); 04:46:23Z: chrome renderer delta **42** + gpu-process delta **95** (harness 85m4, script clicktest-85m4-webkit-w7-hb128.mjs trong snapshot) | **T8 harness (Chromium + WebKit 85m4)** — 2 spike do chính process harness gây; 1 spike load1 dư (04:45:47Z) |

- **Tổng kết đếm: 16/22 spike có driver process cụ thể + 6 spike lớp "load1 dư"** (02:45:19Z; 02:47:05Z; 02:47:40Z; 02:50:46Z; 04:09:47Z; 04:45:47Z — xem dưới). Đợt 166: 13/16 quy được + 3 load1 dư; đợt 165: 15/18 quy được + 3 load1 dư; đợt 164: 30/36 quy được + 6 load1 dư; đợt 163: 17/18 quy được + 1 load1 dư; đợt 162: 17/17 quy được. Đợt này tỉ lệ load1 dư 6/22 = 27,3% (cao hơn đợt 166: 18,8% — vì bão mở đợt + bão apt có nhiều spike dư âm).
- **6 spike load1 dư (định nghĩa: delta tick max ≤ 15 trong 1 s, không process nào đủ tải để giải thích load1 ≥ 3,0 — theo đúng tiền lệ đợt 160/163/164/165/166; xem F-167-T9-5 cho hai trường hợp find D-state + hatch delta 20/36):**
  - 02:45:19Z, load1 4,50: top tức thời chỉ có hatch daemon 20,0% + node test_pixelate 20,0%; delta tick max **11** (hatch daemon); %Cpu: 60,0% idle + **0,0% iowait**; D-state count 0. Không có process nào đủ tải CPU trong giây đo — **load1 dư** (dư âm của spike ffmpeg 02:44:08Z + 02:44:44Z).
  - 02:47:05Z, load1 3,05: top tức thời chỉ có hatch daemon 20,0% + find T2 D-state 20,0%; delta tick max **36** (hatch daemon); %Cpu: 59,5% idle + **19,0% iowait**; find T2 (5,7% tích lũy) delta **12**. Không có process nào chạy mạnh về CPU trong giây đo — **load1 dư theo thực chất** (tải là find D-state + iowait + dư âm bão mở đợt; xem F-167-T9-5 — delta 36 vượt ngưỡng chữ ≤15 nên T9 trình cả hai cách đọc).
  - 02:47:40Z, load1 3,11: top tức thời chỉ có hatch daemon 27,3% + find T2 D-state 9,1%; delta tick max **20** (hatch daemon); %Cpu: 65,9% idle + **19,5% iowait**; find T2 delta **mất**. Không có process nào đủ tải — **load1 dư theo thực chất** (xem F-167-T9-5 — delta 20 vượt ngưỡng chữ ≤15 nên T9 trình cả hai cách đọc).
  - 02:50:46Z, load1 3,01: top tức thời chỉ có hatch daemon 9,1%; delta tick max **11** (hatch daemon); **top -b: 92,9% idle, 0,0% iowait, 1 task running**. Không có process nào đủ tải — **load1 dư** — dư âm của bão mở đợt.
  - 04:09:47Z, load1 3,53: top tức thời chỉ có hatch daemon 16,6% + Xvfb 3,1%; delta tick max **8** (hatch daemon); **top -b: 83,3% idle, 0,0% iowait**. Không có process nào đủ tải — **load1 dư** — dư âm của bão apt 04:06:52–04:09:13Z.
  - 04:45:47Z, load1 4,37: top tức thời chỉ có hatch daemon 10,1% + Xvfb 3,1%; delta tick max **5** (hatch daemon); **top -b: 95,3% idle, 0,0% iowait**. Không có process nào đủ tải — **load1 dư** — dư âm của spike Chromium 04:45:12Z.
  - T9 không giấu 6 spike này vào nhóm "quy được" (cùng mẫu F-163-T9-9).
- **Caveat đếm (F-167-T9-6):** 6 spike delta-miss (pid chết giữa chừng trong vòng delta 1 s): spike 02:44:44Z (ffprobe 66,6% tích lũy, delta mất) và spike 02:45:55Z (ffmpeg 132% tích lũy, delta mất) + 04:07:28Z (apt-get 62,3% tích lũy, delta mất) + 04:08:39Z (apt-get 74,8% tích lũy, delta mất) + 04:09:13Z (dpkg 89,4% + apt-get 70,0% tích lũy, delta mất) + 04:33:53Z (WebKitWebProcess 57,9% + MiniBrowser 49,4% tích lũy, delta mất cả hai) — quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165) và F-166-T9-6 (4 spike đợt 166). `grep -c 'WebKit\|MiniBrowser'` = **10 dòng** (2 spike: 04:33:53Z O8 WebKit + 04:34:25Z O8 WebKit — WebKit xuất hiện trong 2/22 spike).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta; `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. Trường hợp đợt này: spike 02:44:44Z + 02:45:55Z + 04:07:28Z + 04:08:39Z + 04:09:13Z + 04:33:53Z (xem trên). **Kết luận phương pháp (F-147-T9-6 vẫn đóng cho 16 spike có driver):** snapshot tức thời + delta tick + nr_running đã quy được 16/22 spike — 6 spike lớp load1 dư đợt này (4 trong bão mở đợt lúc find D-state + iowait cao hoặc CPU 92,9% idle, 1 sau bão apt lúc CPU 83,3% idle, 1 trong lúc harness lúc CPU 95,3% idle).
- **Delta tick lớn nhất đợt: 117 tick/s** (ffmpeg, spike 02:44:08Z, load1 4,80); ffmpeg 116 tick/s (02:46:30Z); chrome gpu-process 96 tick/s (04:45:12Z); chrome gpu-process 95 tick/s (04:46:23Z). (Đợt 166: max 130 tick/s.)
- **Khoảng mù watcher đầu phiên:** watcher B2 khởi động 02:38:5xZ CÙNG lúc sampler (khác đợt 163: watcher mở muộn 67 s sau sampler) — **0 khoảng mù đầu phiên đợt này**; spike đầu tiên watcher bắt được là 02:43:33Z (~5 phút sau khi mở — trước đó load1 < 3,0). **Khoảng mù duy nhất: reboot #74 giết watcher, khởi động lại 04:06:52Z (gap 77 s cùng sampler — xem §5.1)** — **6 spike bão apt ngay sau khởi động lại** (04:06:52–04:09:47Z) đã bắt được đầy đủ. **0 gap phủ sóng watcher nào khác trong phiên.**

### 2.6 Truy chủ ffmpeg — không cần truy lại (họ đã đóng đợt 150)

- Họ F-147/148/149-T9-3 ĐÓNG đợt 150 (39/41 PID gắn tên script; 0 spike ngoài danh sách). Đợt này **ffmpeg/mask_anim.py/ffprobe xuất hiện trong 5 spike của bão mở đợt** (mask_anim ellipse + ffmpeg ffv1/testsrc2 + ffprobe — thuộc suite verify của T1, chạy đúng chức năng, thoát bình thường; 2 spike delta-miss 02:44:44Z + 02:45:55Z — xem §2.5). **apt-get/dpkg xuất hiện trong 5 spike bão post-boot #74** (hoạt động hệ thống sau reboot — không phải tải VCut). T9 không truy chủ lại từng PID (không có spike ngoài họ T1 suite/render + T2 điều tra + T5/T7/T8 + apt post-boot + hatch daemon; **10 dòng nhắc WebKit/MiniBrowser trong toàn bộ b2-spikes.log — 2 spike, đã quy driver ở §2.5**).

## 3. Birefnet guard (cơ chế tự động (a) — 0 lần thử, lần thứ hai mươi mốt liên tiếp)

- **Cơ chế (a) armed suốt phiên, không kích hoạt (xem F-167-T9-2 về gap phủ sóng đầu phiên):** sampler `round167-t9/sampler.sh` chạy liên tục 02:38:33Z–04:45:54Z, **128 mẫu, gap trong log lớn nhất 77 s, 0 gap >90 s**; khởi động lại bằng tay 04:06:52Z (boot+83s) sau reboot #74 — khoảng trống trong log 77 s (04:05:35Z → 04:06:52Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 166: gap 73 s qua reboot #71; đợt 165: gap 35 s qua reboot #70; đợt 164: gap 57 s qua reboot #68; đợt 163: gap 113 s qua reboot #66).
- **0 mẫu ≥ guard (6.291.456 kB = 6.144 MiB).** RAM max **2.522.812 kB = 40,10% guard** (đợt 166: 69,93%; đợt 165: 58,05%; đợt 164: 45,65%; đợt 163: 57,60%; đợt 162: 56,03%; đợt 161: 47,95%; đợt 160: 40,50%; đợt 159: 47,36%; đợt 158: 40,95%; đợt 157: 53,23%; đợt 156: 62,37%; đợt 155: 60,64%; đợt 154: 47,25%; đợt 153: 52,03%; đợt 152: 60,11%; đợt 151: 56,03%; đợt 150: 62,37%; đợt 149: 59,60%; đợt 148: 62,09%). **40,10% là tỉ lệ thấp nhất trong chuỗi 150–167** (thấp hơn 40,50% đợt 160 — thấp nhất trước đó). Khoảng cách tới guard lúc đỉnh: **3.768.644 kB (59,90%)**.
- **Guard giữ nguyên: 6.291.456 kB (6.144 MiB).** Không mẫu nào chạm 6.144 MiB — cơ chế (a) **armed** (sampler chạy liên tục) và **KHÔNG kích hoạt** suốt 2h07m.
- **0 lần thử birefnet trong đợt 167 — lần thứ hai mươi mốt liên tiếp** (đợt 147: 0; đợt 148: 0; đợt 149: 0; đợt 150: 0; đợt 151: 0; đợt 152: 0; đợt 153: 0; đợt 154: 0; đợt 155: 0; đợt 156: 0; đợt 157: 0; đợt 158: 0; đợt 159: 0; đợt 160: 0; đợt 161: 0; đợt 162: 0; đợt 163: 0; đợt 164: 0; đợt 165: 0; đợt 166: 0; đợt 167: 0). **Chuỗi 0 lần thử: 21 đợt liên tiếp** (đợt 147–167).
- **Đứng (m) đợt 163: u2net là fallback chính thức.** Lần thử gần nhất vẫn là đợt 143 (birefnet-fire). **Điểm yếu đứng (a)/(b) từ đợt 147 vẫn giữ nguyên:** (a) sampler cadence ~60 s không bắt được guard crossing dưới 60 s; (b) lần FIRE thật đầu tiên vẫn chưa verify end-to-end (chưa có run nào đạt guard trong 21 đợt — cơ chế (a) vẫn armed nhưng chưa từng kích hoạt trên cell này; `birefnet-trigger.log` / `birefnet-run.log` / `birefnet-fired.flag` / `guard-open.flag` / `birefnet-trigger.lock` **đều KHÔNG tồn tại** trong `round167-t9/` — kiểm tra lúc đóng phiên).
- **Sẵn sàng (kiểm tra lúc đóng phiên):** `server/bgremove/.venv/bin/python` (symlink tới `/usr/bin/python3.12` — giống đợt 166, xem F-166-T9-9); `bgremove.py` **23.500 B** (không đổi so với đợt 166); `~/.u2net/birefnet-general.onnx` **972.666.916 B** (không đổi); `~/.u2net/u2net.onnx` **175.997.641 B** (không đổi); clip test `~/workspace/tmp-p7-ramguard/clip05.mp4` **14.554 B** (không đổi). `~/workspace/tmp-t9-167-birefnet/` **trống** (chưa có output). **T9 sẵn sàng kích hoạt khi guard mở — nếu T8/T9 nào đó cần birefnet thì cửa sổ mở trong khi T9 đang đo sẽ được bắt (xem F-167-T9-2 về gap đầu phiên).**
- **Không cần chạy lại birefnet trong đợt 167** (guard chưa từng mở; không có ai yêu cầu thử).

## 4. ENOSPC trong journal (boot #73 ≥54 dòng + boot #74 = 22 dòng; tổng ≥76 dòng, cận dưới — đợt thứ mười sáu liên tiếp bảng watch cạn gây lỗi thật thấy được)

- Boot **#73** (b643911f, btime 02:28:01Z): **≥54 dòng** (T9 đếm trực tiếp: 3 dòng lúc 02:39:46Z → 28 dòng lúc 03:08:33Z → 54 dòng lúc 03:38:33Z; **phần còn lại 03:38:33Z → reboot #74 (04:05:29Z) mất theo reboot, KHÔNG cộng số ước** — journal của #73 không đọc được nữa sau #74, `journalctl --list-boots` lúc đóng chỉ còn #74, xem F-167-T9-7). Trong 54 dòng này có **tối đa 3 dòng (đếm lúc mở phiên 02:39:46Z) có thể thuộc về khoảng TRƯỚC khi đợt mở (02:28:01–02:35:51Z)** — không xác định được timestamp từng dòng vì journal #73 đã mất; số dòng thuộc về đợt 167 trên #73 theo cách trừ thận trọng nhất là **≥51 (54 − 3)**. Dòng mới nhất đếm được trên #73 lúc 03:38:00Z. Nhịp ~1 dòng/phút trong lúc headroom 0 (3 → 54 trong ~59 phút).
- Boot **#74** (194efd93, btime 04:05:29Z): **22 dòng** (T9 đếm trực tiếp từ journal lúc đóng phiên; **không cộng số ước**). Dòng đầu tiên: **04:08:27Z (boot+178s)** — đúng lúc cửa sổ thoáng đóng (headroom về 0 lúc boot+180s); dòng cuối cùng: **04:45:17Z**. Nhịp ~1 dòng/2 phút trong lúc headroom 0 (0 → 22 trong ~40 phút) — **tăng đều cả phiên, không có khoảng im** (khác #71 đợt 166: im 62 phút lúc headroom 6).
- **Tổng đợt 167: ≥54 + 22 = ≥76 dòng đếm được (cận dưới)** — đợt thứ mười sáu liên tiếp có lỗi thật (đợt 152: 35 dòng; đợt 153: ≥102 dòng; đợt 154: ≥90 dòng; đợt 155: ≥133 dòng; đợt 156: ≥39 dòng; đợt 157: ≥106 dòng; đợt 158: ≥50 dòng; đợt 159: ≥134 dòng; đợt 160: ≥110 dòng; đợt 161: ≥86 dòng; đợt 162: 132 dòng — T10 đếm lại; đợt 163: 58 dòng — T10 chấp nhận cận dưới; đợt 164: ≥53 dòng — T9 đếm trực tiếp 35 dòng boot #68 + ghi số đếm T5 18 dòng boot #67; đợt 165: ≥64 dòng — T9 đếm trực tiếp, parent quyết (l) chấp nhận làm số chính thức; đợt 166: ≥56 dòng — T9 đếm trực tiếp, parent quyết (l) chấp nhận làm số chính thức; đợt 167: ≥76 dòng — T9 đếm trực tiếp). **Caveat: số đợt này là CẬN DƯỚI** — phần còn lại boot #73 (03:38:33Z → 04:05:29Z) mất theo reboot #74, không đếm được; và tối đa 3 dòng trong 54 có thể thuộc về khoảng trước khi đợt mở (xem trên) — **số dòng thuộc về đợt 167 theo cách trừ thận trọng nhất là ≥73 (≥51 + 22); T9 trình cả hai số (≥76 đếm được / ≥73 thuộc về đợt) để T10/parent không đếm trùng**.
- Nội dung dòng lỗi (mẫu, giống mọi đợt): `home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device` (đợt 166: cùng message). T9 chỉ ghi số đếm + thời gian, không phán service nào gây lỗi (service là home-assistant-ensure, ngoài phạm vi VCut — T9 không sửa).
- **So sánh đợt 166:** đợt 166 có ≥56 dòng (boot #70 ≥47 + boot #71 9). Đợt này **≥76 dòng** — cao hơn đợt 166 đúng 20 dòng, vì boot #73 có tới ≥54 dòng (headroom 0 suốt 88 mẫu, ENOSPC nhịp ~1 dòng/phút không ngừng) so với boot #70 đợt 166 (≥47 dòng) và boot #74 có 22 dòng so với boot #71 đợt 166 (9 dòng — headroom 6 ổn định 62 phút cuối phiên, ENOSPC im).
- **Điểm mới (giao parent/T10 xem lại quyết (g) — T9 chỉ nêu dữ kiện):** đợt này là đợt có ENOSPC đếm được CAO NHẤT kể từ đợt 161 (≥86 dòng đợt 161; đợt 162: 132 dòng — cao nhất chuỗi gần đây vẫn là 132). Headroom 0 suốt phiên trên cả hai boot + ENOSPC tăng đều không ngừng — bằng chứng độc lập (ngoài probe) rằng headroom 0 là thật (systemd không thêm được watch nào trong cả phiên).

## 5. Boot / quan sát khác (đối chiếu)

### 5.1 Reboot #73 + #74 — 2 reboot trong/anh quanh đợt 167 (cùng mẫu đợt 166: 2 reboot)

- **Reboot #73 (b643911f, btime 02:28:01Z; gap #72→#73 = 1.376 s):** xảy ra **TRƯỚC KHI ĐỢT MỞ** (đợt mở 02:35:51Z, boot+470s), SAU khi T10-166 đóng sổ (~02:2xZ trên boot #72). Đợt 167 mở trên chính boot này — **KHÔNG có reboot giữa T10-166 đóng sổ và đợt mở ngoài #73** (số hiệu #73 theo đếm tuần tự — chờ T0-167 xác minh đầy đủ 9 nguồn + parent xác nhận).
- **Reboot #74 (194efd93, btime 04:05:29Z; gap #73→#74 = 5.848 s):** xảy ra **GIỮA PHIÊN** (04:05:29Z, 1h29m38s sau khi đợt mở). Sampler + watcher + probe-loop **CHẾT theo reboot** (điểm yếu (d) đợt 148 tái diễn lần thứ năm liên tiếp — đợt 163 chết theo #66, đợt 164 chết theo #68, đợt 165 chết theo #70, đợt 166 chết theo #71, đợt này chết theo #74); T9 khởi động lại cả ba bằng tay **04:06:52Z (boot+83s)** — **khoảng trống phủ sóng trong log 77 s** (04:05:35Z → 04:06:52Z), **0 gap >90 s trong toàn phiên kể cả qua reboot** (đợt 166: gap 73 s). **1 lệnh sleep-wait của T9 bị reboot #74 giết** (SIGTERM sau 621 s — chỉ là timer chờ, không có side effect; trạng thái đã verify lại từ disk sau đó — xem F-167-T9-4).
- **Mẫu sampler cuối #73 (04:05:35Z) mang nhãn boot cũ `b643911f` ĐÚNG 6 s SAU btime #74** — KHÔNG lặp F-165-T9-4 theo hướng ngược lại (mẫu 22:05:53Z đợt 165 mang nhãn boot cũ 28 s sau btime mới — LẦN NÀY CŨNG LÀ NHÃN CŨ SAU BTIME MỚI, nhưng chỉ 6 s): sampler cũ vẫn sống quá btime mới ≥6 s (overlap — xem F-167-T9-3; cùng mẫu watcher-165 tại #70: poll cuối 22:05:31Z sau btime #70 6 s). Mẫu đầu #74 (04:06:52Z) mang nhãn boot mới `194efd93` đúng — sampler khởi động lại sau reboot nên nhãn đúng ngay từ mẫu đầu.
- **Đồng hồ lúc mở ≈ Cloudflare ±1 s — chuẩn** (T0-167 đo; T9 không đo lại).
- **Khoảng trống phủ sóng đầu phiên (F-167-T9-2):** đợt mở 02:35:51Z (boot+470s), T9 nhận việc ~02:38:0xZ (boot+~600s), sampler khởi động 02:38:33Z (boot+632s) — **gap 162 s từ lúc đợt mở tới khi sampler chạy** (đợt 166: gap 179 s; đợt 165: gap 1.760 s; đợt 164: gap 383 s; đợt 163: gap 113 s). Trong 162 s này: balloon leo từ ~94% lên ~95% trần (mẫu đầu 02:38:33Z bal 6.061.152 kB), headroom về 0 (probe mở 02:39:46Z đã là 0). **Cửa sổ thoáng của #73 (nếu có) nằm trong 162 s này + trước đó — KHÔNG quan sát được** (xem §1.2). T9 ghi gap này để T10/parent biết, không giấu.

### 5.2 T5-167 (infra) — POSTBOOT_PASS #74 ĐÃ CÓ; #73 KHÔNG CÓ (thuộc T5-167/T10)

- **POSTBOOT_PASS #74 ĐÃ CÓ lúc 04:10:23Z** (boot+4m54s — theo T4-167; T5-167 sở hữu; replay đầy đủ hay không — thuộc T5-167).
- **POSTBOOT_PASS #73 KHÔNG CÓ lúc T9 đóng** (T4-167: replay chưa xong lúc reboot #74; T5 không có cờ cho #73 — **thuộc T5-167**).
- **Watcher-167: T9 không kiểm tra** (T5-167 sở hữu; T4-167 ghi watcher-167 ĐANG CHẠY lúc T4 đóng cờ ~04:25Z — T9 không xác minh lại).
- **Marker: T9 không đếm lại** (T0/T5 sở hữu; T5-166 đếm 22 reboot #49–#70; #71/#72/#73/#74 thêm vào — giao T0-167/T5-167 đếm).
- **X11 (T9 kiểm tra lúc đóng phiên 04:51Z):** `/tmp/.X11-unix/` — T9 không kiểm tra lúc đóng (T8-167 vẫn đang chạy harness trên #74 lúc T9 đóng — socket X11 của T8 còn sống là bình thường; giao T8-167/T10 kiểm tra lúc đóng). T9 không dọn gì thêm.

### 5.3 T8-167 (vite harness + O8) — CHƯA đóng cờ lúc T9 đóng (04:51Z); O8 chạy ~04:33–04:36Z, harness đang chạy

- **T8-167 CHƯA xuất bản LIMITS + CHƯA viết cờ `round167-t8.done` lúc T9 đóng (04:51Z)** — T9 chỉ đối chiếu bằng dữ kiện sampler + B2 độc lập, không phán thay T8.
- **O8 chạy ~04:33–04:36Z trên boot #74** (theo script `clicktest-87o8-mask-track-webkit.mjs` + vite config `round87-o8` trong snapshot B2 04:33:53Z/04:34:25Z): **4 spike B2 trong cửa sổ O8** (04:33:53Z WebKit delta-miss + 04:34:25Z WebKit delta 58 + 04:35:01Z chrome delta 66 + 04:35:36Z chrome renderer delta 27) — đều do chính O8 gây.
- **Đối chiếu sampler T9 trong cửa sổ O8 (04:33:53–04:35:36Z): 3 mẫu, gate A MỞ 2/3** (04:33:54Z 1.003.716 kB và 04:34:54Z 1.594.124 kB — mẫu đầu dưới gate 44.860 kB; 04:35:54Z 1.582.864 kB ≥ gate), balloon 79,2–83,6% trần (không ghim), load1 3,33–3,59 (sampler).
- **Harness đang chạy lúc T9 đóng:** spike 04:45:12Z (chrome gpu 96) + 04:45:47Z (load1 dư) + 04:46:23Z (chrome renderer 42 + gpu 95; script `clicktest-85m4-webkit-w7-hb128.mjs` trong snapshot) — T8 chưa đóng cờ; kết quả O8/harness + (1c) phương án (A') diag-only thuộc T8-167/T10.
- **(1c) phương án (A') đã duyệt đợt 166** (triển khai diag-only bản sửa (c') đợt 167 — T8-167 sở hữu; T9 không kiểm tra triển khai).

### 5.4 T7-167 (scheduler) — T7 CHƯA đóng cờ lúc T9 đóng; kết cục run 166 + run 167 + (m) #72/#73/#74 thuộc T7-167/T2-167

- **Run 166 + run 167 chưa có kết cục lúc T9 đóng** (T7-167 CHƯA đóng cờ lúc 04:51Z — T9 kiểm tra lúc đóng; hạn run 167 là 05:35:51Z) — kết cục + (m) #72/#73/#74 thuộc T7-167/T2-167.
- **(m) #73/#74 thuộc T2-167** (T2-166 đóng trước #73/#74 nên không nhắc — cùng mẫu (m) #71 thuộc T2-167 đợt 166; (m) #72 thuộc T7-167/T2-167 theo §11 đợt 166).
- **Reboot #73 (02:28:01Z) xảy ra TRƯỚC hạn run 166 (02:35:51Z) 7m50s** — run 166 có bị viết lại lần 2 tại #73 không (câu hỏi §10.5 (xv) đợt 166 — nay reboot đã có số hiệu #73) — thuộc T7-167. **Reboot #74 (04:05:29Z) xảy ra TRONG phiên run 167** — run 167 có bị viết lại tại #74 không, requeue offset có trong dải 33–49,8 s không — thuộc T7-167/T2-167.
- T7-167 đóng cờ sau T9 (nếu có) — T9 không chờ T7 (hạn cờ T9 ~05:00Z).

### 5.5 Các luồng khác (T9 ghi lại từ file cờ / LIMITS đã xuất bản lúc đóng)

- **T0/T1/T2/T4/T5/T6 đã đóng cờ lúc 04:51Z (6/9)** — T7/T8 chưa đóng, T9 (luồng này) đóng ngay sau đó. T10 thu thập.
- **T2-167:** (m) #72/#73/#74 đối chiếu độc lập (T2-167 sở hữu); mù #96?/#95?/#94?/#88?/#77? (T2-167 sở hữu); INSIDE #71/#73/#74 dải FULL117/FULL118 (T2-167 sở hữu). T9 không trích số — thuộc T2-167/T10.
- **T1-167:** verify đợt 166 (T9 không trích số — thuộc T1-167/T10).
- **T6-167:** prune lần 42 (T9 không trích số — thuộc T6-167/T10).
- **T4-167:** xem §2.3 (LIMITS đã xuất bản).
- **T0-167:** boot #73 xác nhận (T9 không trích số — thuộc T0-167/T10; số hiệu #73/#74 theo đếm tuần tự, chờ parent xác nhận).

## 6. Sai số / caveat (F-167-T9-*)

- **F-167-T9-1 — Cửa sổ thoáng #74: đỉnh đo được 14.072, KHÔNG chạm CAP 30.000 (lần đầu tiên kể từ đợt 163); cặp đo rơi 14.072 → 8.708 trong lúc đo.** Lần đo đầu (boot+86s) muộn hơn các đợt trước (boot+63–81s) vì T9 phải khởi động lại sau reboot #74 (04:06:52Z, boot+83s) — cửa sổ đã mở trước đó và đã rơi khỏi 30.000 trước khi T9 đo tới. Đỉnh thật của cửa sổ không biết được (chỉ biết ≥14.072 tại boot+86s; có thể đã chạm 30.000 trước boot+86s — T9 KHÔNG claim). Mốc đóng <92 s (theo ENOSPC) rộng hơn các đợt trước (<31–45 s) vì lần đo đầu muộn — T9 ghi đúng mốc đo, không ép số cho khớp chuỗi. Đây là dữ kiện mới (đỉnh thấp + rơi nhanh trong cặp đo), không phải lỗi đo.
- **F-167-T9-2 — Khoảng mù giữa hai đợt 3.446 s (01:41:07Z → 02:38:33Z) + gap phủ sóng đầu phiên 162 s + cửa sổ #73 không quan sát được.** Sampler đợt 166 dừng lúc đóng (01:41:07Z); sampler đợt 167 khởi động 02:38:33Z. Trong 3.446 s này có 2 reboot (#72 02:05:05Z + #73 02:28:01Z) — E-168 đã kết thúc trong khoảng mù (xem §2.2); cửa sổ thoáng của #73 (nếu có, ~02:29–02:31Z) đã đóng trước khi T9 mở. Gap đầu phiên đợt này 162 s (đợt mở 02:35:51Z → sampler 02:38:33Z) — ngắn hơn đợt 166 (179 s), KHÔNG lặp F-165-T9-1. Trong 162 s này: balloon leo từ ~94% lên ~95% trần (mẫu đầu 02:38:33Z bal 6.061.152 kB), headroom về 0 (probe mở 02:39:46Z đã là 0).
- **F-167-T9-3 — Mẫu sampler cuối #73 (04:05:35Z) mang nhãn boot cũ `b643911f` 6 s SAU btime #74 (04:05:29Z).** Sampler cũ vẫn sống quá btime mới ≥6 s — OVERLAP (đã xác nhận đợt 161: 824 s; đợt 165: ≥11 s tại #68; đợt 166: ≥6 s tại #70 — nay ≥6 s tại #74, lần thứ tư). Mẫu này là số đo thật của boot cũ (balloon ghim 6.443.824 kB, mem 383.116 kB — min phiên) — T9 tính nó vào E-169 (chuỗi 4, mẫu ghim cuối) vì đó là dữ kiện quan sát được trên boot cũ; thời điểm đứt thật của E-169 nằm trong (04:05:35Z, 04:06:52Z], không claim cụ thể. Ghi chú đứng quyết (e) đợt 165/166: dữ kiện khung giờ boot cũ không đổi verdict (m) — T9 chỉ ghi overlap, không phán (m) #74 (thuộc T2-167).
- **F-167-T9-4 — 1 lệnh sleep-wait của T9 bị reboot #74 giết** (SIGTERM sau 621 s — runtime restart recovery cho session proc_d9896a23b45a — chỉ là timer chờ, không có side effect; trạng thái đã verify lại từ disk sau đó). Cùng mẫu F-166-T9-1 (sleep-wait bị reboot #71 giết sau 191 s) và F-165-T9-3. Không cần làm lại.
- **F-167-T9-5 — Spike 02:47:05Z (load1 3,05, hatch delta 36) + 02:47:40Z (load1 3,11, hatch delta 20) phân loại load1 dư dù hatch delta vượt ngưỡng chữ ≤15.** Căn cứ phân loại: find T2 ở D-state 20,0%/9,1% tức thời; top -b: **59,5–65,9% idle + 19,0–19,5% iowait**, 1–2 task running; không process nào chạy mạnh về CPU trong giây đo; load1 là dư âm của bão mở đợt + find D-state + iowait. T9 phân loại load1 dư theo THỰC CHẤT (không process nào đủ tải CPU trong giây đo) thay vì theo chữ (delta ≤15) và ghi rõ số 36/20 + trạng thái D-state của find để T10/parent kiểm lại — không giấu vào nhóm "quy được". Nếu parent giữ cách đọc "hatch delta 20/36 cũng tính là driver" thì 2 spike này thành "quy được một phần" (hatch daemon) — T9 trình cả hai cách đọc. Cùng tiền lệ F-166-T9-5 (spike 23:49:27Z/23:50:02Z đợt 166: find D-state 10,0% + iowait 19,0–22,0% → load1 dư) và F-165-T9-5.
- **F-167-T9-6 — 6 spike delta-miss (pid chết giữa chừng trong vòng delta 1 s): 02:44:44Z (ffprobe 66,6% tích lũy, delta mất); 02:45:55Z (ffmpeg 132% tích lũy, delta mất); 04:07:28Z (apt-get 62,3% tích lũy, delta mất); 04:08:39Z (apt-get 74,8% tích lũy, delta mất); 04:09:13Z (dpkg 89,4% + apt-get 70,0% tích lũy, delta mất); 04:33:53Z (WebKitWebProcess 57,9% + MiniBrowser 49,4% tích lũy, delta mất cả hai).** Quy driver bằng ps top tức thời + top -b, như tiền lệ F-163-T9-9 (2 spike delta-miss đợt 163), F-164-T9-7 (1 spike đợt 164), F-165-T9-6 (2 spike đợt 165) và F-166-T9-6 (4 spike đợt 166). **Watcher/sampler của chính T9 xuất hiện trong snapshot: `grep -c 'b2-watcher.sh'` = 11 dòng + `grep -c 'sampler.sh'` = 8 dòng — đều 0,0% CPU, delta 0** (chỉ là process nền nằm cuối top12 khi ít process bận; không ảnh hưởng attribution vì delta đều 0). Thêm 1 dòng cmdline của chính lệnh exec khởi động lại của T9 (pid 2008) lọt vào snapshot spike 04:06:52Z (0,0% CPU, delta 0 — cùng họ F-166-T9-3 nhưng không tạo spike giả: grep neo = grep không neo = 22). T9 ghi rõ để T10 kiểm lại — không giấu.
- **F-167-T9-7 — ENOSPC #73 ≥54 là cận dưới (phần 03:38:33Z → 04:05:29Z mất theo reboot #74, KHÔNG cộng số ước); tối đa 3 dòng trong 54 có thể thuộc về khoảng trước khi đợt mở (02:28:01–02:35:51Z).** Tổng đợt 167 ≥76 dòng đếm được (cận dưới) = ≥54 (#73) + 22 (#74); số dòng thuộc về đợt 167 theo cách trừ thận trọng nhất là ≥73 (≥51 + 22). T9 ghi cả hai số để T10/parent không đếm trùng. `journalctl --list-boots` lúc đóng chỉ còn #74 — journal #73 không đọc được nữa (cùng họ EPERM như `dmesg` — xem F-163-T9-1).
- **F-167-T9-8 — E-169 ĐÃ KẾT THÚC nhưng thời điểm đứt KHÔNG quan sát được chính xác (nằm trong khoảng mù 77 s qua reboot #74).** Mẫu ghim cuối 04:05:35Z (nhãn boot cũ, sau btime mới 6 s); mẫu đầu #74 04:06:52Z bal 4.875.560 kB (75,7% trần) — balloon đã xả. T9 không claim E-169 đứt lúc 04:05:35Z hay lúc reboot — chỉ ghi khoảng mù. Tổng E-169 = 20 mẫu (4 chuỗi, 3 sag) — không cộng thêm.
- **F-167-T9-9 — Nhãn "probe-lan-2" xuất hiện ĐÚNG HAI lần trong headroom-log** (03:08:33Z trên #73 + 04:36:52Z trên #74 sau khởi động lại probe-loop) — KHÔNG phải lặp nhãn lỗi (F-165-T9-7): probe-loop mới khởi động lại sau reboot #74 nên đếm lan lại từ đầu; T9 ghi rõ boot từng lần trong bảng §1.2. Probe-loop mới lan-3 (dự kiến ~05:06:52Z) KHÔNG chạy — đã dừng lúc T9 đóng; cặp probe đóng 04:46:20Z thay thế.
- **F-167-T9-10 — T9 KHÔNG kiểm tra X11 lúc đóng** (T8-167 vẫn đang chạy harness trên #74 lúc T9 đóng 04:51Z — socket X11 của T8 còn sống là bình thường; giao T8-167/T10 kiểm tra lúc đóng). Khác đợt 166 (T9 kiểm tra `/tmp/.X11-unix/` TRỐNG lúc đóng) — đợt này T9 ghi rõ KHÔNG kiểm tra, không claim trống.
- **Caveat đứng (không phải F mới):** probe cap 30.000 (đỉnh thật của cửa sổ thoáng không biết được, chỉ biết ≥14.072 tại boot+86s); sampler cadence 60 s không bắt được guard crossing dưới 60 s (điểm yếu (a) đợt 147); lần FIRE birefnet thật đầu tiên vẫn chưa verify end-to-end (điểm yếu (b) đợt 147); T10 không đếm lại được ENOSPC từ cell vì journalctl chỉ còn boot hiện tại sau reboot (cùng họ EPERM như `dmesg` — xem F-163-T9-1); T10 không đếm lại độc lập B2 đợt 166 (cùng giới hạn phạm vi áp dụng đợt này trừ khi T10 đếm lại).

---

## Phụ lục — log sampler đóng băng (128 mẫu, 02:38:33Z–04:45:54Z)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round167-t9/ram-sampler-FROZEN.log` (md5 `484b8cbf10ea72f056bc5a488300f9c3`) — không gõ lại bằng tay (xem F-164-T9-10).

```
2026-11-22T02:38:33Z boot=b643911f mem=759616 bal=6061152 swapfree=878464 load1=1.33
2026-11-22T02:39:33Z boot=b643911f mem=737228 bal=6163256 swapfree=819456 load1=1.45
2026-11-22T02:40:33Z boot=b643911f mem=517512 bal=5804512 swapfree=753532 load1=1.94
2026-11-22T02:41:33Z boot=b643911f mem=489232 bal=5912332 swapfree=715564 load1=1.06
2026-11-22T02:42:33Z boot=b643911f mem=1264048 bal=5535832 swapfree=702388 load1=2.54
2026-11-22T02:43:33Z boot=b643911f mem=1749416 bal=4976120 swapfree=700620 load1=3.41
2026-11-22T02:44:33Z boot=b643911f mem=2128224 bal=4662372 swapfree=703124 load1=3.76
2026-11-22T02:45:33Z boot=b643911f mem=2145168 bal=4611800 swapfree=700128 load1=5.06
2026-11-22T02:46:33Z boot=b643911f mem=1673408 bal=4828448 swapfree=699752 load1=3.29
2026-11-22T02:47:33Z boot=b643911f mem=1855032 bal=5042192 swapfree=696300 load1=3.12
2026-11-22T02:48:33Z boot=b643911f mem=1756824 bal=5003940 swapfree=699400 load1=2.43
2026-11-22T02:49:33Z boot=b643911f mem=1585736 bal=5135060 swapfree=706912 load1=2.10
2026-11-22T02:50:33Z boot=b643911f mem=1845912 bal=4877424 swapfree=702628 load1=3.11
2026-11-22T02:51:33Z boot=b643911f mem=1806124 bal=4756420 swapfree=692304 load1=2.11
2026-11-22T02:52:33Z boot=b643911f mem=1672724 bal=4971348 swapfree=709280 load1=1.22
2026-11-22T02:53:33Z boot=b643911f mem=1497108 bal=5165600 swapfree=710876 load1=0.52
2026-11-22T02:54:33Z boot=b643911f mem=1367040 bal=5347920 swapfree=709504 load1=0.56
2026-11-22T02:55:33Z boot=b643911f mem=1190712 bal=5508592 swapfree=709580 load1=0.62
2026-11-22T02:56:33Z boot=b643911f mem=1022912 bal=5659776 swapfree=709848 load1=0.55
2026-11-22T02:57:33Z boot=b643911f mem=797260 bal=5792684 swapfree=709840 load1=0.41
2026-11-22T02:58:33Z boot=b643911f mem=775812 bal=5915548 swapfree=710708 load1=0.62
2026-11-22T02:59:33Z boot=b643911f mem=696496 bal=6030764 swapfree=716084 load1=0.64
2026-11-22T03:00:33Z boot=b643911f mem=940584 bal=5743340 swapfree=670688 load1=0.38
2026-11-22T03:01:34Z boot=b643911f mem=859564 bal=5832168 swapfree=679636 load1=0.58
2026-11-22T03:02:34Z boot=b643911f mem=795036 bal=5955152 swapfree=678776 load1=0.69
2026-11-22T03:03:34Z boot=b643911f mem=711160 bal=6068056 swapfree=679420 load1=0.25
2026-11-22T03:04:34Z boot=b643911f mem=635448 bal=6172808 swapfree=673220 load1=0.65
2026-11-22T03:05:34Z boot=b643911f mem=538912 bal=6267632 swapfree=665168 load1=0.92
2026-11-22T03:06:34Z boot=b643911f mem=1250448 bal=5536088 swapfree=666824 load1=1.09
2026-11-22T03:07:34Z boot=b643911f mem=1122664 bal=5690552 swapfree=662576 load1=0.43
2026-11-22T03:08:34Z boot=b643911f mem=960724 bal=5831884 swapfree=662024 load1=0.42
2026-11-22T03:09:34Z boot=b643911f mem=999724 bal=5810808 swapfree=651028 load1=0.48
2026-11-22T03:10:34Z boot=b643911f mem=883252 bal=5941492 swapfree=650748 load1=0.42
2026-11-22T03:11:34Z boot=b643911f mem=783792 bal=6060072 swapfree=646532 load1=0.34
2026-11-22T03:12:34Z boot=b643911f mem=670428 bal=6166784 swapfree=643260 load1=0.17
2026-11-22T03:13:34Z boot=b643911f mem=522244 bal=6265432 swapfree=628880 load1=0.06
2026-11-22T03:14:34Z boot=b643911f mem=516972 bal=6354724 swapfree=626024 load1=0.07
2026-11-22T03:15:34Z boot=b643911f mem=410636 bal=6437444 swapfree=622812 load1=0.06
2026-11-22T03:16:34Z boot=b643911f mem=442444 bal=6443824 swapfree=625308 load1=0.05
2026-11-22T03:17:34Z boot=b643911f mem=414008 bal=6443824 swapfree=632276 load1=0.25
2026-11-22T03:18:34Z boot=b643911f mem=418964 bal=6443824 swapfree=633680 load1=0.15
2026-11-22T03:19:34Z boot=b643911f mem=428064 bal=6443824 swapfree=629844 load1=0.19
2026-11-22T03:20:34Z boot=b643911f mem=404208 bal=6443824 swapfree=625808 load1=0.28
2026-11-22T03:21:34Z boot=b643911f mem=442972 bal=6443824 swapfree=624904 load1=0.39
2026-11-22T03:22:34Z boot=b643911f mem=878924 bal=6050608 swapfree=590268 load1=1.06
2026-11-22T03:23:34Z boot=b643911f mem=736752 bal=6127940 swapfree=610524 load1=0.77
2026-11-22T03:24:34Z boot=b643911f mem=632988 bal=6232988 swapfree=611000 load1=0.28
2026-11-22T03:25:34Z boot=b643911f mem=542172 bal=6314724 swapfree=611756 load1=0.50
2026-11-22T03:26:34Z boot=b643911f mem=451912 bal=6402264 swapfree=631996 load1=0.49
2026-11-22T03:27:34Z boot=b643911f mem=399016 bal=6443824 swapfree=620860 load1=0.52
2026-11-22T03:28:34Z boot=b643911f mem=391824 bal=6443824 swapfree=628736 load1=0.56
2026-11-22T03:29:34Z boot=b643911f mem=398704 bal=6443824 swapfree=628156 load1=0.43
2026-11-22T03:30:34Z boot=b643911f mem=410292 bal=6443824 swapfree=598044 load1=0.40
2026-11-22T03:31:34Z boot=b643911f mem=395840 bal=6443824 swapfree=596812 load1=0.42
2026-11-22T03:32:34Z boot=b643911f mem=412768 bal=6443824 swapfree=596028 load1=0.22
2026-11-22T03:33:34Z boot=b643911f mem=433340 bal=6443824 swapfree=595680 load1=0.48
2026-11-22T03:34:34Z boot=b643911f mem=393384 bal=6443824 swapfree=599020 load1=0.40
2026-11-22T03:35:34Z boot=b643911f mem=482984 bal=6378288 swapfree=588132 load1=0.79
2026-11-22T03:36:34Z boot=b643911f mem=493940 bal=6443824 swapfree=703852 load1=0.34
2026-11-22T03:37:34Z boot=b643911f mem=445156 bal=6443824 swapfree=701368 load1=0.17
2026-11-22T03:38:34Z boot=b643911f mem=881496 bal=6050608 swapfree=671036 load1=0.89
2026-11-22T03:39:34Z boot=b643911f mem=751016 bal=6164368 swapfree=685636 load1=0.60
2026-11-22T03:40:34Z boot=b643911f mem=622204 bal=6254648 swapfree=676196 load1=0.42
2026-11-22T03:41:34Z boot=b643911f mem=581420 bal=6336808 swapfree=647228 load1=0.64
2026-11-22T03:42:34Z boot=b643911f mem=768848 bal=5992624 swapfree=630324 load1=0.92
2026-11-22T03:43:34Z boot=b643911f mem=707772 bal=6105848 swapfree=655912 load1=0.34
2026-11-22T03:44:34Z boot=b643911f mem=617164 bal=6205596 swapfree=659300 load1=0.94
2026-11-22T03:45:35Z boot=b643911f mem=549532 bal=6296788 swapfree=645044 load1=0.72
2026-11-22T03:46:35Z boot=b643911f mem=663616 bal=6162644 swapfree=613644 load1=1.20
2026-11-22T03:47:35Z boot=b643911f mem=572428 bal=6261124 swapfree=618516 load1=0.72
2026-11-22T03:48:35Z boot=b643911f mem=464544 bal=6351784 swapfree=622720 load1=0.61
2026-11-22T03:49:35Z boot=b643911f mem=640884 bal=6116924 swapfree=629384 load1=0.60
2026-11-22T03:50:35Z boot=b643911f mem=588488 bal=6211360 swapfree=636536 load1=0.40
2026-11-22T03:51:35Z boot=b643911f mem=538448 bal=6283684 swapfree=592928 load1=0.60
2026-11-22T03:52:35Z boot=b643911f mem=519152 bal=6280428 swapfree=599668 load1=0.22
2026-11-22T03:53:35Z boot=b643911f mem=671360 bal=6075624 swapfree=602512 load1=2.11
2026-11-22T03:54:35Z boot=b643911f mem=810108 bal=5914676 swapfree=596080 load1=2.10
2026-11-22T03:55:35Z boot=b643911f mem=998452 bal=5791016 swapfree=605648 load1=1.35
2026-11-22T03:56:35Z boot=b643911f mem=852124 bal=5920396 swapfree=626176 load1=0.89
2026-11-22T03:57:35Z boot=b643911f mem=766808 bal=6038816 swapfree=637652 load1=0.61
2026-11-22T03:58:35Z boot=b643911f mem=644520 bal=6148168 swapfree=634652 load1=0.35
2026-11-22T03:59:35Z boot=b643911f mem=467368 bal=6247364 swapfree=633480 load1=0.24
2026-11-22T04:00:35Z boot=b643911f mem=449084 bal=6337044 swapfree=634552 load1=0.15
2026-11-22T04:01:35Z boot=b643911f mem=433816 bal=6421652 swapfree=601800 load1=0.09
2026-11-22T04:02:35Z boot=b643911f mem=417056 bal=6443824 swapfree=597980 load1=0.27
2026-11-22T04:03:35Z boot=b643911f mem=400272 bal=6443824 swapfree=600636 load1=0.35
2026-11-22T04:04:35Z boot=b643911f mem=400144 bal=6443824 swapfree=587776 load1=0.42
2026-11-22T04:05:35Z boot=b643911f mem=383116 bal=6443824 swapfree=594752 load1=0.32
2026-11-22T04:06:52Z boot=194efd93 mem=1890620 bal=4875560 swapfree=1002624 load1=4.86
2026-11-22T04:07:52Z boot=194efd93 mem=1919032 bal=4884852 swapfree=909220 load1=5.07
2026-11-22T04:08:53Z boot=194efd93 mem=1703936 bal=5093948 swapfree=894440 load1=3.68
2026-11-22T04:09:53Z boot=194efd93 mem=1617276 bal=5294812 swapfree=842088 load1=3.25
2026-11-22T04:10:53Z boot=194efd93 mem=1462856 bal=5481176 swapfree=840252 load1=1.35
2026-11-22T04:11:53Z boot=194efd93 mem=1000808 bal=5194920 swapfree=775520 load1=1.66
2026-11-22T04:12:53Z boot=194efd93 mem=1228824 bal=4882532 swapfree=739728 load1=1.84
2026-11-22T04:13:53Z boot=194efd93 mem=2002184 bal=4735860 swapfree=701308 load1=0.92
2026-11-22T04:14:53Z boot=194efd93 mem=1784008 bal=4954504 swapfree=702644 load1=0.38
2026-11-22T04:15:53Z boot=194efd93 mem=2522812 bal=4433352 swapfree=702476 load1=0.78
2026-11-22T04:16:53Z boot=194efd93 mem=2272124 bal=4702208 swapfree=703640 load1=0.51
2026-11-22T04:17:53Z boot=194efd93 mem=1974844 bal=4942920 swapfree=705008 load1=0.35
2026-11-22T04:18:53Z boot=194efd93 mem=1738480 bal=5155568 swapfree=707540 load1=1.38
2026-11-22T04:19:53Z boot=194efd93 mem=1554964 bal=5349972 swapfree=708968 load1=1.17
2026-11-22T04:20:53Z boot=194efd93 mem=1382052 bal=5530500 swapfree=706964 load1=0.50
2026-11-22T04:21:53Z boot=194efd93 mem=1258916 bal=5695104 swapfree=707456 load1=0.62
2026-11-22T04:22:53Z boot=194efd93 mem=1031368 bal=5841340 swapfree=706868 load1=0.40
2026-11-22T04:23:53Z boot=194efd93 mem=958548 bal=5975416 swapfree=707148 load1=0.33
2026-11-22T04:24:53Z boot=194efd93 mem=852624 bal=6096836 swapfree=709924 load1=0.22
2026-11-22T04:25:53Z boot=194efd93 mem=749132 bal=6208196 swapfree=706068 load1=0.08
2026-11-22T04:26:53Z boot=194efd93 mem=652076 bal=6310840 swapfree=707044 load1=0.14
2026-11-22T04:27:53Z boot=194efd93 mem=555604 bal=6403740 swapfree=705636 load1=0.55
2026-11-22T04:28:53Z boot=194efd93 mem=822624 bal=6050608 swapfree=667660 load1=1.33
2026-11-22T04:29:53Z boot=194efd93 mem=821040 bal=6120424 swapfree=669188 load1=0.68
2026-11-22T04:30:53Z boot=194efd93 mem=679924 bal=6229044 swapfree=676252 load1=0.64
2026-11-22T04:31:53Z boot=194efd93 mem=604332 bal=6329340 swapfree=676796 load1=0.76
2026-11-22T04:32:53Z boot=194efd93 mem=465000 bal=6418568 swapfree=671212 load1=0.57
2026-11-22T04:33:54Z boot=194efd93 mem=1003716 bal=5107848 swapfree=630412 load1=3.33
2026-11-22T04:34:54Z boot=194efd93 mem=1594124 bal=5242956 swapfree=634736 load1=3.50
2026-11-22T04:35:54Z boot=194efd93 mem=1582864 bal=5386800 swapfree=632196 load1=3.59
2026-11-22T04:36:54Z boot=194efd93 mem=1030512 bal=5241756 swapfree=621636 load1=1.67
2026-11-22T04:37:54Z boot=194efd93 mem=1454196 bal=5382552 swapfree=628956 load1=1.76
2026-11-22T04:38:54Z boot=194efd93 mem=770020 bal=5501596 swapfree=627996 load1=1.86
2026-11-22T04:39:54Z boot=194efd93 mem=779780 bal=5611856 swapfree=624664 load1=1.92
2026-11-22T04:40:54Z boot=194efd93 mem=644080 bal=5649184 swapfree=616788 load1=2.35
2026-11-22T04:41:54Z boot=194efd93 mem=588948 bal=5742640 swapfree=613608 load1=2.48
2026-11-22T04:42:54Z boot=194efd93 mem=588072 bal=5834632 swapfree=622816 load1=1.75
2026-11-22T04:43:54Z boot=194efd93 mem=510576 bal=5923328 swapfree=622052 load1=0.68
2026-11-22T04:44:54Z boot=194efd93 mem=1225632 bal=5165736 swapfree=605892 load1=3.03
2026-11-22T04:45:54Z boot=194efd93 mem=2021544 bal=4906980 swapfree=608332 load1=4.74
```

---

## Phụ lục — headroom log (48 dòng, 13 lần probe)

Nội dung dưới đây được copy trực tiếp từ `hidden_files/round167-t9/headroom-log-FROZEN.txt` — không gõ lại bằng tay (xem F-164-T9-10).

```
=== probe-open 2026-11-22T02:39:46Z boot=b643911f tran=63747 uptime_s=705.19
0
0
ENOSPC-count=3
ENOSPC-last: Nov 22 02:39:10 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     691436 kB | Balloon:         6163256 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T03:08:33Z boot=b643911f tran=63747
0
0
ENOSPC-count=28
ENOSPC-last: Nov 22 03:08:10 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1016764 kB | Balloon:         5786420 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-3 2026-11-22T03:38:33Z boot=b643911f tran=63747
0
0
ENOSPC-count=54
ENOSPC-last: Nov 22 03:38:00 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:     884996 kB | Balloon:         6050608 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-pair-74 2026-11-22T04:06:55Z boot=194efd93 tran=63747 uptime_s=86.71
14072
8708
ENOSPC-count=0
ENOSPC-last: 
mem: MemAvailable:    1943992 kB | Balloon:         4875560 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== window-map-74-1 2026-11-22T04:08:29Z boot=194efd93 tran=63747 uptime_s=180.43
0
ENOSPC-count=2
ENOSPC-last: Nov 22 04:08:27 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1779616 kB | Balloon:         5025780 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-lan-2 2026-11-22T04:36:52Z boot=194efd93 tran=63747
0
0
ENOSPC-count=14
ENOSPC-last: Nov 22 04:35:57 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1034868 kB | Balloon:         5241756 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
=== probe-dong 2026-11-22T04:46:20Z boot=194efd93 tran=63747 uptime_s=2451.26
0
0
ENOSPC-count=22
ENOSPC-last: Nov 22 04:45:17 htch-runtime systemd[1]: home-assistant-ensure.service: Failed to add control inotify watch descriptor for control group /system.slice/home-assistant-ensure.service: No space left on device
mem: MemAvailable:    1319104 kB | Balloon:         4980396 kB
ls: cannot access '/tmp/k8-watch-probe*': No such file or directory
```

*LIMITS này do T9 đợt 167 viết, đóng cờ 04:59Z 22/11/2026 (trước hạn cờ ~05:00Z; trước hạn cứng đóng 05:30Z). Không push GitHub. Không sửa production. Không chạy TTS 39. Không thử birefnet (guard không mở).*
