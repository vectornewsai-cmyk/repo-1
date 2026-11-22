# LIMITS — Phase 9 đợt 147, T9: headroom inotify + RAM + TỰ ĐỘNG HÓA thử birefnet (phương án (a) ĐÃ NỐI — sampler tự kích hoạt; cửa sổ guard KHÔNG mở lại; headroom 668, dưới ngưỡng lần thứ bảy)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 668** (đo 2 lần trên boot 6fb582df btime **12:13:26Z**: 668 lúc 14:42:51Z và **668** lúc 14:42:51Z 19/11, chênh **0**) — **GIẢM TIẾP −212** so với 880 đợt 146 (−24,1%); đo đóng phiên lần 3: **658** lúc 16:30:55Z (−10 trong phiên). Xem §1.
- **⚠️ VẪN DƯỚI NGƯỠNG BÁO USER (< ~1.800) — thấp hơn ngưỡng 1.132, lần thứ bảy liên tiếp.** Quyết parent (m) đợt 146: VẪN CHỈ THEO DÕI, không hành động mới — đợt này **KHÔNG báo riêng, không yêu cầu user hành động**; can thiệp host ngoài tầm cell. **Tỉ lệ/vite chỉ còn ~0,42** (đợt 146: 0,56). Xem §1.3, F-147-T9-1.
- **🔥 TỰ ĐỘNG HÓA (a) ĐÃ NỐI XONG + KIỂM CHỨNG BẰNG CHẠY THỬ CƠ CHẾ (quyết parent (l) đợt 146):** sampler mới `round147-t9/sampler.sh` tự kích hoạt lệnh birefnet khi một mẫu ≥ guard 6.144 MiB: lockfile dùng một lần (mkdir nguyên tử), kiểm lại RAM ngay trước khi chạy (dưới guard thì hủy + nhả lock để mẫu sau thử lại), log đầy đủ (thời điểm / RAM kiểm lại / lệnh / pid / trạng thái T4 lúc kích hoạt). Cơ chế đã được **chạy thử khô (dry-run) trên dữ liệu thật**: mô phỏng mẫu ≥ guard bằng file sampler giả → lock chiếm đúng, recheck đọc đúng, lệnh fire đúng (đã chặn ở bước chạy thật bằng cờ khô — xem §3.2). Trong phiên sampler thật (107 mẫu, 14:44–16:30Z): **0 mẫu ≥ guard → cơ chế KHÔNG kích hoạt lần nào (đúng thiết kế — không có false positive), birefnet 0 lần thử.** Xem §3.
- **Cửa sổ guard đợt 146 KHÔNG tái mở:** đỉnh RAM phiên này **2.572.644 kB = 40,89% guard** (14:46:05Z), xa guard 3.718.812 kB. T5-147 đối chiếu độc lập: max 2.724.360 kB = 43,3% guard, 0 mẫu ≥ guard — khớp hướng (chênh do pha lấy mẫu). Xem §2, §3.
- **RAM:** sampler 107 mẫu (14:44:04–16:30:08Z): min **267.976 kB (261,7 MiB) lúc 16:03:07Z**, max 2.572.644 kB, mean 567.545 kB (554,2 MiB). Gate A ≥1024 MiB chỉ **11/107 mẫu — cả 11 đều trong chuỗi leo đầu phiên 14:44–14:54Z**; sau 14:54:05Z, 0 mẫu vượt gate A trong ~96 phút còn lại. Xem §2.
- **Balloon virtio: 0/107 mẫu đóng băng 6.443.824 kB** — balloon KHÔNG đóng băng lại trong cửa sổ sampler (dao động 4.068.524–6.136.248 kB); nhưng lúc T9 kiểm mở đợt 14:40:29Z balloon đang ở đúng giá trị đóng băng 6.443.824 kB, rồi xả trong ~2 phút trước probe. Chuỗi "đóng băng" của T9 (9 đợt liên tiếp tới đợt 146) **không tái hiện trong cửa sổ đo đợt này** — xem §2.2 (ghi rõ để T10 phán chuỗi, T9 không tự chốt).
- **B2 / tải tự sinh: 11 spike load1 ≥3,0** (xem §2.5): cụm A 14:45–14:46Z (2 spike, job python3+ffmpeg **không rõ chủ**, ffmpeg 123% CPU) + 1 spike đuôi loadavg + cụm B 14:48–14:49Z (3 spike, chính attempt1 của T4, max 3,52 < 4 — không vi phạm B2) + **cụm C 15:59:57–16:03:57Z (5 spike, load1 tới 4,80 — cao nhất đợt — nhưng snapshot ps gần như trống, không quy được nguồn; xem F-147-T9-6)**. Sau 16:03:57Z: **0 spike tới hết sampler (16:30:08Z)**.
- **Lượt yên WebKit #21 (T4, đợt 147 — đo lại trên boot mới 6fb582df theo quyết (h) đợt 146): T4 CHƯA xuất bản LIMITS lúc T9 đóng (16:30:58Z)** — T9 chỉ cung cấp dữ kiện sampler độc lập (§2.4), không phán verdict. Dữ kiện thô đọc được từ file T4 lúc kiểm: attempt1 mở cửa 14:47:43Z, JSON partial **17/20 pass** (writePartial c2DrawLog TIMEOUT 30 s lúc 14:50:29Z; tickCost timeout n=472); không có file attempt2/attempt3 lúc đóng; vite :5187 + MiniBrowser + WebKitWebProcess của attempt1 vẫn sống lúc đóng (probe node + inner script đã thoát — không còn trong ps lúc đóng). Sampler T9 trong cửa sổ attempt1: RAM ≥1024 MiB cả 4 mẫu, load1 tối đa 3,52 (< 4 — B2 sạch theo cadence 60 s). Xem §2.3, §2.4, F-147-T9-7.
- **Không có reboot mới trong phiên** (boot 6fb582df sống suốt phiên T9; tuổi boot lúc đóng 15.452 s = 4h17m32s). Journal trên boot này: **0 dòng "No space left"/ENOSPC**. Steal CPU tích lũy từ btime tới lúc đóng: 21.755 / 6.166.347 tick ≈ **0,35%**. Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).
- Import check rembg **CHẠY LẠI TRỌN VẸN, HOÀN THÀNH** (F-146-T9-2 đã đóng): `import rembg, onnxruntime` xong trong **6,9 giây** lúc 14:42Z (rembg 2.0.87, onnxruntime 1.23.2 — khớp đợt 145), chạy TRƯỚC khi T4 mở cửa attempt1 nên không ô nhiễm phép đo T4. Xem §3.1.

## 1. Headroom inotify (probe K8, cap 30.000 thống nhất từ đợt này, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round147-t9/k8-headroom.py` (copy y nguyên từ đợt 146 — đã cap 30.000 theo quyết (m) đợt 146): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** trên boot 6fb582df lúc mở đợt (không đổi so với lúc T9-146 xác nhận lại 13:52:55Z đợt 146).

### 1.2 Số đo đợt 147 (boot 6fb582df, btime 12:13:26Z — boot lúc mở đợt)

| Thời điểm (UTC 19/11) | Headroom | Bối cảnh |
|---|---|---|
| 14:42:51Z | **668** | lần đo 1, boot ~2h29'25" tuổi; RAM trước đo 1.651.784 kB, balloon 5.102.448 kB |
| 14:42:51Z | **668** | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 1.646.104 kB, balloon 5.102.448 kB |
| 16:30:55Z | **658** | lần đo 3 (đóng phiên), boot ~4h17'29" tuổi; RAM trước đo 281.468 kB, balloon 5.992.544 kB; chênh −10 so với lần 1/2 |

- Probe dừng ở `i=668` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố. Lần 3 dừng ở `i=658` (errno 28). File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau lần 3).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 668 = **63.079 watch** (tăng ~203 so với 62.876 đợt 146; tăng ~406 so với 62.673 đợt 145).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 668 / 1.578 ≈ **0,42 lần** — sâu hơn dưới 1,0 (đợt 146: 0,56; đợt 145: 0,68). Headroom chỉ còn ~42% nhu cầu một vite dev server đầy đủ.
- Đối chiếu độc lập (T5-147 §6.1): **mở 669 → cuối 661** — T5 đo 669, T9 đo 668 cùng khoảng mở đợt (chênh 1 watch — sai số pha lấy mẫu, không phải sai số đo; cùng mẫu chênh 1 như đợt 146: T5 879 vs T9 880); cuối phiên T5 đo 661, T9 đo lần 3 **658** (chênh 3 — cùng hướng giảm trong phiên, sai số pha lấy mẫu); cả hai cùng kết luận dưới ngưỡng lần thứ bảy liên tiếp.
- Lưu ý: RAM trước đo lần 1 là 1.651.784 kB (balloon 5.102.448 kB) — cao hơn nhiều so với 425.620 kB lúc T9 kiểm lúc 14:40:29Z (balloon khi đó 6.443.824 kB — đóng băng). Balloon xả ~1,34M kB trong ~2 phút trước probe; headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–146 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

| Đợt | Headroom | Ghi chú |
|---|---|---|
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
| 135 | 2.403 → 2.395 | đo 02:40:57Z → 02:43:11Z, boot 78b55838 btime 02:27:27Z |
| 136 | 2.286 → 2.281 | đo 05:41:01Z → 05:43:14Z, boot 1ca1feaa btime 05:29:18Z |
| 137 | 2.179 → 2.175 | đo 08:41:12Z → 08:43:35Z, boot 2104246b btime 08:07:11Z |
| 138 | 2.064 → 2.064 | đo 11:39:22Z → 11:39:31Z, boot 17db9652 btime 09:36:01Z |
| 139 | 1.954 → 1.954 | đo 14:41:18Z → 14:41:29Z, boot 541524e2 btime 13:53:41Z (đính chính T1-139 F-139-T1-1) |
| 140 | 1.840 → 1.840 | đo 17:38:54Z → 17:38:59Z, boot af558fb5 btime 15:54:37Z (cùng boot với vòng 2 đợt 139) |
| 141 | 1.739 → 1.739 | đo 20:40:21Z → 20:40:29Z, boot 2c0efe57 btime 19:54:12Z |
| 142 | 1.617 → 1.617 | đo ~23:40Z → 23:41:20Z, boot bde599df btime 22:48:05Z |
| 143 | 1.498 → 1.498 | đo 02:40:53Z → 02:41:01Z, boot 70a5b0fc btime 01:55:25Z |
| 144 | 1.296 → 1.295 | đo 05:39:17Z → 05:39:26Z, boot 691a7403 btime 03:55:45Z |
| 145 | 1.074 → 1.074 | đo 08:42:53Z → 08:42:57Z, boot e146ca67 btime 07:56:16Z |
| 146 | 880 → 880 | đo 11:37:51Z → 11:37:52Z, boot 98a7c93f btime 09:54:03Z |
| **147** | **668 → 668** | **đo 14:42:51Z, boot 6fb582df btime 12:13:26Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 668 = **−3.770 (−85,0%)**. Bước giảm đợt này: −212 so với đợt 146 (−24,1%) — lớn thứ ba trong chuỗi sau −222 (đợt 145) và −202 (đợt 144); ba đợt gần nhất giảm tổng −628 (−48,5% so với 1.296 đợt 144).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 668, thấp hơn ngưỡng 1.132, lần thứ bảy liên tiếp.** Quyết parent đợt 146 (m): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite 0,42 — sâu hơn dưới 1,0.** Headroom chỉ còn ~42% nhu cầu một vite đầy đủ (~1.578 watch). Đây là diễn biến đáng ghi cho parent/T10, nhưng quyết "chỉ theo dõi" vẫn đứng (brief đợt này + quyết parent đợt 146 (m)); T9 không tự nâng mức báo hay yêu cầu user hành động.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 14:40:29Z, lúc đo probe 14:42:51Z và lúc đóng 16:30:58Z — cùng giá trị; T5-147 §6.1 cũng ghi trần 63.747 không đổi so với boot 2 đợt 146). Chuỗi trần qua các boot gần nhất: 63.747 (e146ca67) → 63.756 (98a7c93f) → 63.747 (6fb582df, đợt 146) → **63.747 (6fb582df, đợt 147 — cùng boot, đo lại)**. Flip-flop ±9 đã dừng ở 63.747 hai lần đo liên tiếp trên cùng boot (đợt 146 + đợt 147) — ghi làm chú thích chuẩn chuỗi theo quyết (m) đợt 146, không hành động.
- **Trong phiên headroom cũng giảm: 668 (14:42:51Z) → 658 (16:30:55Z), −10.** Cùng hướng với T5 (669 → 661, −8). Không đảo chiều trong phiên.
- Trần 63.747 vẫn đầy ở mức ~63,1k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 107 mẫu, 14:44:04–16:30:08Z

### 2.1 Hình dạng cửa sổ: leo đầu phiên rồi rơi đơn điệu về vùng trũng, không hồi lại

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **107 mẫu, 14:44:04–16:30:08Z, một boot duy nhất 6fb582df — không reboot, không gap lấy mẫu.** Tổng quan: **min 267.976 kB (261,7 MiB) lúc 16:03:07Z; max 2.572.644 kB (2.512,3 MiB) lúc 14:46:05Z — 40,89% guard; mean 567.545 kB (554,2 MiB).**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 14:44:04Z | 1.367,7 MiB (1.400.548 kB) | mẫu đầu (balloon 5.291.744 kB; load1 0,83) |
| 14:45:05–14:46:05Z | 2.103,9 → **2.512,3 MiB (2.572.644 kB)** | leo lên **MAX phiên (40,89% guard)**; balloon xả 4.354.176 → **4.068.524 kB (min phiên)** |
| 14:47:05–14:51:05Z | 2.365,9 → 1.514,8 MiB | rơi dần trong cửa sổ attempt1 của T4 (14:47:43–14:50:29Z); balloon phình lại 4.265.112 → 4.563.764 kB |
| 14:52:05–14:54:05Z | 1.374,1 → 1.087,7 MiB | **chuỗi 11 mẫu liên tục ≥1024 MiB kết thúc ở đây** (14:44:04–14:54:05Z); mẫu 14:54:05Z 1.113.872 kB là mẫu cuối ≥ gate A |
| 14:55:05Z → 16:30:08Z | ~0,26–0,99 GB | **rơi dưới gate A và không vượt lại trong ~96 phút còn lại**; dao động vùng trũng 267.976–~1.010.000 kB; balloon phình dần 4,5M → 5,7–6,1M |
| 16:00:07Z | 300,1 MiB (307.252 kB) | load1 **4,29 — max sampler** (cụm spike C, xem §2.5); balloon 5.994.648 kB |
| 16:03:07Z | **261,7 MiB (267.976 kB) — MIN phiên** | đúng phút spike 4,38 (16:03:27Z); load1 3,34; balloon 6.077.500 kB |
| 16:30:08Z | 334,0 MiB (341.992 kB) | mẫu cuối (balloon 5.948.144 kB); T9 chủ động dừng sampler 16:30:5xZ |

- **11/107 mẫu ≥1024 MiB** (chuỗi 11 đầu + 0 sau đó); **0/107 mẫu ≥2.000.000 kB sau 14:47:05Z** (chỉ 3 mẫu đầu ≥2M: 14:45/14:46/14:47Z); **0 mẫu ≥ guard**.
- Load1 (sampler 60 s): 0,08–4,29 (max 4,29 lúc 16:00:07Z — cụm C); **4/107 mẫu load1 ≥3,0** (14:46:05Z 3,65; 14:49:05Z 3,52; 16:00:07Z 4,29; 16:03:07Z 3,34). Nửa sau cửa sổ load1 0,2–2,8 mà RAM vẫn phẳng ~0,3–0,5 GB: RAM thấp không phải do tải trong cell.
- Swap: SwapFree 700.268 kB (mẫu đầu) → 610.460 kB (mẫu cuối); min 572.312 kB lúc 16:03:07Z (swap đang dùng ~320–450 MB).
- Đối chiếu T5-147 (sampler riêng n=40, cửa sổ khác): max 2.724.360 kB = 43,3% guard, mean 910.780 kB, 0 mẫu ≥ guard — khớp hướng (đỉnh T5 cao hơn đỉnh T9 151.716 kB — pha lấy mẫu khác nhau: T5 lấy mẫu ở giây :20–:21, T9 ở giây :05–:08; RAM dao động nhanh trong 1 phút — vd T4 load-mid ghi RAMavail 401 MB lúc 16:16:15Z rồi 314 MB lúc 16:16:17Z, chênh 87 MB trong 2 giây).

### 2.2 Balloon virtio — xả khỏi giá trị đóng băng rồi dao động tự do, KHÔNG đóng băng lại trong cửa sổ

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Lúc T9 kiểm mở đợt 14:40:29Z: balloon 6.443.824 kB — đúng giá trị đóng băng** (T9-146 ghi đóng băng 67/134 mẫu, đợt thứ chín liên tiếp). Nhưng sampler bắt đầu 14:44:04Z đã ghi **5.291.744 kB — xả 1.152.080 kB trong ~3,5 phút** (cùng lúc RAM nhô lên 1.400.548 kB).
- Trong cửa sổ 107 mẫu: balloon **min 4.068.524 kB lúc 14:46:05Z** (đúng lúc đỉnh RAM) → phình lại răng cưa → **max 6.136.248 kB**, **0/107 mẫu chạm 6.443.824 kB**. Balloon dao động tự do 4,07M–6,14M cả phiên, phình dần về cuối (5,7–6,0M trong giờ cuối) nhưng không chạm trần.
- **Đây là lần đầu tiên trong chuỗi T9 (từ đợt 138) sampler ghi 0 mẫu đóng băng.** T5-147 (sampler riêng n=40) cũng ghi 0/40. Diễn biến mới: balloon **đã xả khỏi giá trị đóng băng trong phiên này** (xả từ 14:40–14:44Z) và dao động tự do — nhưng xả không sâu (min 4,07M, không về 0 như khoảnh khắc 11:51–11:52Z đợt 146) và phình lại gần trần về cuối (6,14M, thiếu 307.576 kB). **T9 không tự chốt chuỗi đóng băng "đứt" hay "tiếp"** — dữ kiện: 0/107 trong cửa sổ + frozen tại spot check mở đợt (14:40:29Z, trước sampler). Giao T10 phán chuỗi khi gộp (ghi rõ cả hai dữ kiện để khỏi nhầm).
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 16:30:08Z: tổng RAM 8.124.900 kB − balloon 5.948.144 kB = 2.176.756 kB còn lại; MemAvailable chỉ 341.992 kB.

### 2.3 Lượt yên WebKit #21 (T4, đợt 147) — đo lại trên boot mới 6fb582df; T4 CHƯA xuất bản LIMITS lúc T9 đóng

- **T4-147 CHƯA xuất bản LIMITS lúc T9 đóng (16:30:58Z).** T9 chỉ trích dữ kiện thô đọc được từ file T4, không phán verdict (cùng họ F-146-T9-8).
- **Attempt1:** mở cửa poll #4 **14:47:43Z** (gate0 T5 `POSTBOOT_PASS` 14:41:57Z + gateA RAM 2322 MB theo poller T4; cây preview.tsx 530e10a7). Probe 20 pass nhưng JSON **partial 17/20** (`partialReason: 'sau pass'`) — writePartial c2DrawLog **TIMEOUT sau 30.000 ms lúc 14:50:29Z** (tickCost timeout n=472, blendTick timeout n=384, c2DrawLog timeout n=915 tích lũy). Không có file attempt2/attempt3 lúc T9 đóng (16:30:58Z).
- **T4 vẫn đang hoạt động lúc T9 đóng:** load-mid logger của T4 vẫn ghi mỗi 2 s tới 16:16:17Z (RAMavail 401 MB lúc 16:16:15Z → 314 MB lúc 16:16:17Z — chênh 87 MB trong 2 giây, khớp tính dao động nhanh của RAM mà sampler T9 thấy); vite :5187 + MiniBrowser + WebKitWebProcess (3,1% CPU tích lũy, 3:13 CPU time) vẫn sống lúc đóng; probe node 33904 + inner script 33893 đã thoát (không còn trong ps lúc đóng, trong khi lúc 16:03:27Z vẫn còn).
- **Số cộng dồn lượt yên hợp lệ: KHÔNG ĐỔI cho tới khi T4 xuất bản** (vẫn 17 lượt theo đợt 146 — T9 không tự cập nhật; nếu attempt1 tính là fail thì ngân sách còn 2/3, chờ T4/T10 phán).
- **Đo lại #21 trên boot mới (quyết (h) đợt 146):** thí nghiệm phân biệt vẫn chưa có kết quả cuối lúc T9 đóng — median attempt1 chưa có trong file T4 (chỉ có partial JSON + timeout). T10 đối chiếu khi T4 xuất bản.

### 2.4 Dữ kiện sampler T9 trong cửa sổ attempt của T4 (độc lập, cadence 60 s)

| Attempt | Cửa sổ (UTC) | Boot | load1 (T9) | RAM (T9) | Ghi chú |
|---|---|---|---|---|---|
| 1 | 14:47:43–14:50:29Z (mở cửa → JSON partial) | 6fb582df | 2,03 / 2,23 / **3,52** / 2,61 | 2.365,9 → 1.457,2 MiB | 4 mẫu; RAM ≥1024 MiB cả 4 mẫu; load1 T9 tối đa 3,52 < 4 — B2 sạch theo cadence 60 s; JSON partial 17/20 pass (xem §2.3) |
| 2 | Không có dữ kiện — T4 chưa xuất bản LIMITS; không có file attempt2 lúc T9 đóng (16:30:58Z) | | | | |
| 3 | Không có dữ kiện — T4 chưa xuất bản LIMITS; không có file attempt3 lúc T9 đóng (16:30:58Z) | | | | |

- T9 KHÔNG phán verdict #21 (T4 chưa xuất bản LIMITS lúc T9 đóng), không phán B4/B2 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — tải tự sinh của stack đo

**Câu hỏi mở từ đợt 143/144/145/146:** sampler T9 có thấy tải tự sinh không? Trả lời đợt 147: **CÓ tải tự sinh trong cửa sổ đo — nhưng nguồn không phải stack đo (sampler/poller/watcher), mà là (a) job python3+ffmpeg không rõ chủ, (b) chính probe attempt1 của T4, (c) cụm C 15:59–16:03Z không rõ nguồn.** Stack đo (sampler/poller/watcher) không sinh load1 ≥3,0 lần nào.

Bằng chứng — watcher spike (ngưỡng load1 ≥3,0, kiểm tra mỗi 30 s; tổng **11 spike**: cụm A 2 + đuôi 1 + cụm B 3 + cụm C 5):

| Cụm | Thời điểm (UTC) | load1 | Process gây tải (ps snapshot) | Kết luận |
|---|---|---|---|---|
| A (2 spike) | 14:45:35Z + 14:46:05Z | 3,73 / 3,65 | python3 pid 32732 **98,1%** (14:45:35Z) rồi ffmpeg con của nó **123%** + python3 pid 32947 27,5% (14:46:05Z) | Job python3+ffmpeg **không rõ chủ** (xem F-147-T9-3); KHÔNG phải T4 (vite/WebKit chưa chạy — vite :5187 khởi động 14:47Z); KHÔNG phải stack đo của T9 (sampler/watcher là bash) |
| A-đuôi (1 spike) | 14:46:35Z | 3,07 | snapshot gần như trống (hatch 2,5% cao nhất) — không có process nóng | Đuôi loadavg của 2 spike trước (load1 là trung bình 1 phút, suy chậm), không phải tải mới |
| B (3 spike) | 14:48:35Z + 14:49:05Z + 14:49:35Z | 3,07 / **3,52** / 3,19 | WebKitWebProcess **48,0–67,7%** + MiniBrowser **21,0–29,7%** + python3 pid 33682 ~14% (không rõ chủ, hiện diện cả 3 snapshot) + vite/esbuild/Xvfb nhỏ | Tải do **chính probe attempt1 của T4** (vite :5187 + MiniBrowser); load1 tối đa 3,52 < 4 nên **không vi phạm B2** theo cadence watcher |
| C (5 spike) | 15:59:57Z + 16:00:27Z + 16:02:57Z + 16:03:27Z + 16:03:57Z | **4,80** / 3,44 / 3,59 / **4,38** / 3,16 | Snapshot cả 5 lần GẦN NHƯ TRỐNG: cao nhất là hatch daemon 3,9%, WebKitWebProcess 3,4%, MiniBrowser 1,0%, còn lại ≤0,7% — các process attempt1 của T4 (vite :5187, MiniBrowser, probe node 33904, inner script 33893) vẫn sống nhưng idle (0,0–0,1%) | **Tải KHÔNG giải thích được bằng snapshot CPU** — xem F-147-T9-6 (nghi burst ngắn / D-state; ps %CPU là trung bình tích lũy nên không bắt được burst). Sampler độc lập xác nhận: 16:00:07Z load1 **4,29**, 16:03:07Z load1 3,34. **Load1 4,80 là cao nhất đợt** (vượt 4,67 của attempt2 đợt 146 — nhưng khác ngữ cảnh: đợt 146 là B2 vi phạm trong cửa sổ attempt T4; đợt này cụm C nằm ngoài cửa sổ attempt1, không rõ chủ) |

- **Sau 16:03:57Z: 0 spike tới hết sampler (16:30:08Z)** — dù sampler/watcher vẫn chạy suốt và T4/T7/T10 còn làm việc. Stack đo (vài lệnh grep/ps mỗi phút) không sinh tải đo được.
- **Caveat (cùng lớp F-144-T9-7 / F-145-T9-5):** snapshot ps của chính watcher đôi khi tự lọt top (chưa thấy đợt này tới 15:51Z). Giá trị load1 vẫn là thật (đọc từ /proc/loadavg, không qua ps). **Thêm caveat mới (F-147-T9-6):** `%CPU` của `ps` là trung bình tích lũy từ lúc process khởi động — với process sống lâu (vite/MiniBrowser từ 14:47Z) nó gần như đứng yên qua các snapshot, nên watcher không thể quy nguồn cho tải burst ngắn; cần snapshot tức thời (vd `top -b -n1` hoặc delta `/proc/<pid>/stat`) ở đợt sau.

### 2.6 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt (sampler T9) | Cuối lượt |
|---|---|---|---|
| 146 | ~1,28 GB (T9 đo trực tiếp 1.319.080 kB lúc 11:37:51Z) | 1.211–6.594 MiB (boot cũ, 36 mẫu) rồi 483–1.922 MiB (boot mới, 98 mẫu); REBOOT 12:13:26Z cắt giữa hai pha; gap lấy mẫu ~73 giây (sampler dài của T9, ~133 phút) | 515,5 MiB lúc 13:51:21Z |
| **147** | **~1,62 GB (T9 đo trực tiếp 1.651.784 kB lúc 14:42:51Z; mẫu sampler đầu 1.400.548 kB lúc 14:44:04Z)** | **262–2.512 MiB (boot duy nhất 6fb582df, 107 mẫu, 14:44:04–16:30:08Z); leo đầu phiên rồi rơi đơn điệu về vùng trũng, KHÔNG hồi lại; KHÔNG reboot, KHÔNG gap lấy mẫu (sampler dài của T9, ~106 phút)** | **334,0 MiB lúc 16:30:08Z (315.856 kB lúc 16:30:58Z, sau sampler)** |

(Các đợt 124–145 xem LIMITS T9 đợt 146 §2.6 — không chép lại để file khỏi phình; dòng đợt 146 chép lại làm neo nối tiếp.)

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ĐÃ NỐI; CỬA SỔ KHÔNG MỞ LẠI; 0 LẦN THỬ

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.572.644 kB = 2.512,3 MiB = 40,89% guard lúc 14:46:05Z** — xa guard 3.718.812 kB. Đối chiếu T5-147 (sampler riêng n=40): max 2.724.360 kB = 43,3% guard, 0 mẫu ≥ guard — khớp hướng (chênh do pha lấy mẫu khác nhau).
- **Birefnet: 0 LẦN THỬ đợt này.** Cơ chế tự động đã nối nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không false positive; xem §3.2 kiểm chứng khô). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→147 (theo sampler T9): 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, 2.860 MB, 2.992 MB, 2.778 MB, 2.947 MB, 3.863 MB, **6.752 MB**, **2.573 MB**.

### 3.1 Sẵn sàng thử đã xác minh lại (14:42Z — import check CHẠY TRỌN VẸN, F-146-T9-2 ĐÃ ĐÓNG)

- **Import check HOÀN THÀNH đợt này (14:42Z, trước khi T4 mở cửa attempt1 14:47:43Z — không ô nhiễm phép đo T4):** `server/bgremove/.venv/bin/python -c "import rembg, onnxruntime"` xong trong **6,9 giây** (real 0m6.897s; user 2,019s; sys 0,496s), exit 0: **rembg 2.0.87, onnxruntime 1.23.2** — khớp phiên bản đã xác minh đợt 145. (Đợt 146 import này chạy ~5 phút ở ~28% CPU dưới tải rồi bị T9 kill — chậm là do tranh CPU dưới load1 ~15, không phải do import nặng; đợt này load1 lúc kiểm ~0,5 nên xong trong 7 giây.)
- Venv: `server/bgremove/.venv/bin/python` tồn tại (symlink → /usr/bin/python3.12). `py_compile` bgremove.py OK.
- **Guard nội bộ của bgremove.py (lớp an toàn thứ hai — đọc code lúc 14:43Z):** `--min-ram-mb` mặc định **6144** (MiB — `get_mem_available_mb` trả `MemAvailable kB // 1024`); dưới ngưỡng script **fallback sang u2net** thay vì chết OOM (mặc định fallback BẬT; tắt bằng `--no-fallback`). Nghĩa là: ngay cả khi RAM tụt giữa lúc recheck của sampler và lúc script kiểm tra, lệnh kích hoạt cũng không chết OOM — nó chạy u2net. Một lần chạy fallback như vậy **KHÔNG tính là lần thử birefnet** (ghi rõ để T10 không đếm nhầm nếu log chạy xuất hiện mà không có birefnet).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử (đã nối vào sampler — xem §3.2): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-147-birefnet/out-birefnet-147.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-147-birefnet/` đã tạo sẵn, trống (kiểm tra lúc mở — 0 file).
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

### 3.2 Cơ chế tự động (a) — đã nối + kiểm chứng khô

- File: `hidden_files/round147-t9/sampler.sh` (sampler lấy mẫu 60 s + trigger tích hợp; pid 31971, chạy 14:44:04–16:30:5xZ, 107 mẫu; dừng bằng `kill` theo PID lúc đóng — không dùng pkill -f, theo F-146-T9-9).
- Luồng kích hoạt (ghi trong code + log `birefnet-trigger.log`):
  1. Một mẫu MemAvailable ≥ 6.291.456 kB → ghi `GUARD-OPEN` vào `guard-open.flag` (thời điểm + mem + balloon + load1).
  2. Chiếm lockfile dùng một lần bằng `mkdir birefnet-trigger.lock` (nguyên tử — chỉ 1 lần thử / đợt; nếu mkdir thất bại thì ghi "already triggered, skip" và không chạy lại).
  3. **Kiểm lại RAM ngay trước khi chạy** (đọc lại `/proc/meminfo`): dưới guard → ghi `ABORT recheck_below_guard` + `rmdir` lock để mẫu sau trong cùng cửa sổ có thể thử lại; đủ guard → ghi `FIRE` (kèm trạng thái T4 lúc kích hoạt: danh sách file dir round147-t4 + ps snapshot WebKit/MiniBrowser/vite — để T10 phán ô nhiễm nếu attempt đang chạy) rồi chạy lệnh birefnet nền (`nohup`, `OMP_NUM_THREADS=2`, log `birefnet-run.log`), sampler vẫn lấy mẫu tiếp.
  4. Ghi `birefnet-fired.flag` (thời điểm + pid + RAM kiểm lại).
- **Kiểm chứng khô (dry-run) trên dữ liệu thật — ĐÃ CHẠY 15:58:29Z, PASS cả 4 nhánh** (script `dryrun-trigger.sh`: khối trigger copy verbatim từ `sampler.sh`, chỉ đổi DIR sang thư mục dry-run riêng + GUARD/recheck lấy từ tham số + bước FIRE thật thay bằng ghi dòng DRY-RUN-FIRE — KHÔNG chạy birefnet; RAM thật lúc kiểm chứng 295.040–298.136 kB):
  - **Case A (fire):** GUARD=200.000 kB (< RAM thật), recheck=/proc/meminfo → `TRIGGER-ATTEMPT sample=295.348` → `RECHECK 295.764 ≥ 200.000` → `FIRE` + ghi `birefnet-fired.flag`. ✓
  - **Case B (skip khi đã trigger):** chạy lại cùng DIR → `GUARD-OPEN ... but lock exists — already triggered once this round, skip`, không FIRE lần 2. ✓ (lock dùng một lần hoạt động)
  - **Case C1 (abort):** recheck từ file meminfo giả (MemAvailable 100.000 kB) → `ABORT recheck_below_guard 100.000 < 200.000` + lock được nhả (kiểm tra `ls` — thư mục lock không còn). ✓
  - **Case C2 (thử lại sau abort):** chạy lại với recheck thật → `TRIGGER-ATTEMPT` → `RECHECK 297.700` → `FIRE`. ✓ (nhả lock cho phép mẫu sau trong cùng cửa sổ thử lại)
  - **Sampler thật không bị chạm:** sau dry-run, `guard-open.flag` / `birefnet-trigger.log` / `birefnet-trigger.lock` thật đều chưa tồn tại; sampler pid 31971 vẫn sống. ✓
  - Giới hạn kiểm chứng: dry-run kiểm tra nhánh quyết định (guard → lock → recheck → fire/abort/skip + log), KHÔNG kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help` §3.1 + tham số đúng P7 §7; lần chạy thật đầu tiên sẽ là bằng chứng cuối). Xem F-147-T9-2.
- **Kết quả phiên thật: 0 lần kích hoạt** (0 mẫu ≥ guard trong 107 mẫu) → `guard-open.flag`, `birefnet-trigger.log`, `birefnet-fired.flag`, `birefnet-run.log` đều KHÔNG tồn tại lúc đóng (đúng thiết kế). Lock `birefnet-trigger.lock` không tồn tại (chưa từng chiếm).
- **Đánh giá cơ chế:** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại (2–4 lần lấy mẫu trong cửa sổ). Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-147-T9-5); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-147-T9-2); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l); T10 phán ô nhiễm nếu xảy ra).
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã xong kịp trong phiên.

## 4. ENOSPC / vite watch

- **Vite :5187 + MiniBrowser + WebKitWebProcess của attempt1 T4 VẪN SỐNG lúc T9 đóng** (kiểm tra `ps` lúc 16:30:58Z; cây process attempt1 từ 14:47Z: lock-v2 bash 33759, npm vite 33846, node vite 33862, MiniBrowser 33946, WebKitNetworkProcess 33971, WebKitWebProcess 33992 — đều idle, WebKitWebProcess 3,1% CPU tích lũy / 3:13 CPU time; probe node 33904 + inner script 33893 đã thoát). Đây là cây của T4, không phải của T9 — T9 không kill process của luồng khác; ghi rõ để T10/T4 đối chiếu (vite :5187 còn giữ lock? — T6 là chủ quản lock; T9 không kiểm lock queue).
- **Journal trên boot 6fb582df: 0 dòng "No space left" / ENOSPC** (kiểm tra 16:30:58Z, từ btime 12:13:26Z).
- Steal CPU trên boot này (tích lũy từ btime tới lúc đóng): `/proc/stat` cpu steal 21.755 / 6.166.347 tick ≈ **0,35%** (cùng cỡ 0,12% đợt 146 trên boot mới — steal nhỏ, không giải thích được chậm ~100 ms của #21 đợt 146).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=668, i=668, i=658) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 668 chỉ còn ~0,42 vite — **sâu hơn dưới 1 vite đầy đủ**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 147 = boot lúc T9 đo đầu:** btime **12:13:26Z** 19/11 (`uptime -s` 12:13:26 + `btime 1795090406` trong `/proc/stat` + boot_id `6fb582df-455d-47cd-99dc-8bef48018536`) — cùng boot với boot 2 đợt 146 (reboot #34; **6fb582df = #110? chặt** theo quyết parent (g) đợt 146).
- **KHÔNG có reboot mới trong phiên T9** (boot_id 6fb582df ở mọi mẫu sampler từ 14:44Z tới lúc đóng; T5-147 cũng ghi không reboot mới trong phiên). Boot sống tới lúc T9 đóng: **15.452 s = 4h17m32s** (btime 12:13:26Z → đóng 16:30:58Z).
- **Replay dpkg:** T5-147 ghi replay boot 6fb582df CHẠY TỐT, 1.545 dòng / 221 installs, xong boot +2m56s (vẫn kỷ lục nhanh nhất), postboot PASS poll=2, cờ mới 14:41:57Z — T4-147 đo lại lượt yên #21 bằng cờ này. T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong" (T5 là chủ quản replay).
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log + quan sát ps (trừ import check + probe K8 + sampler/watcher của chính mình).
- Các cờ .done lúc T9 đóng (16:30:58Z): t1, t2, t5, t6 (t4, t7, t8 chưa có — waiter của T10 vẫn chạy; t9 là cờ này; t10 chưa có — waiter vẫn chạy).

## 6. Sai số của chính T9 (ghi rõ)

- **F-147-T9-1 — Headroom 668: dưới ngưỡng lần thứ bảy liên tiếp, giảm −212 (−24,1%), tỉ lệ/vite ~0,42.** Không phải sai số đo (2 lần đo chênh 0; T5 đối chiếu độc lập 669/661 — chênh 1 watch, sai số pha lấy mẫu). Ghi rõ: quyết "chỉ theo dõi" (m) đợt 146 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động. Trần 63.747 không đổi trong phiên (đã dừng flip-flop ở 63.747 hai lần đo liên tiếp trên cùng boot).
- **F-147-T9-2 — Cơ chế tự động (a) đã nối + kiểm chứng khô PASS 4 nhánh, NHƯNG chưa có lần kích hoạt thật:** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run (§3.2) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net — xem §3.1), exit code, file output.
- **F-147-T9-3 — Hai job gây spike B2 không rõ chủ (python3+ffmpeg 14:45–14:46Z + python3 ~14% trong 3 snapshot attempt1):** python3 pid 32732 (98,1% CPU, parent MainThread) sinh ffmpeg con 123% CPU lúc 14:46:05Z; python3 pid 33682 (~14% CPU) hiện diện cả 3 snapshot cụm B. Cả hai đều đã chết lúc T9 kiểm cmdline (~15:0xZ) nên không quy được chủ — ghi rõ là không quy được chủ, không gán cho bất kỳ luồng nào (cùng họ F-146-T9-3). Bài học: snapshot ps chỉ ghi `comm` (tên ngắn) nên không truy được script — T9 đã vá watcher giữa phiên (xem F-147-T9-4) để các spike sau ghi full `args`.
- **F-147-T9-4 — Watcher B2 khởi động lại giữa phiên (đổi snapshot từ `comm` sang `args`):** T9 dừng watcher cũ (pid 31972) bằng `kill` theo PID lúc 15:18:2xZ và khởi động lại (pid 72768) sau khi sửa `b2-watcher.sh` (ps `-eo ... args` thay vì `comm`). Gap phủ sóng ≤1 chu kỳ kiểm (30 s) — 0 spike nào rơi vào gap (spike gần nhất trước đó 14:49:35Z, spike tiếp theo 15:59:57Z — sau khi watcher mới chạy 41 phút). Thay đổi ghi rõ trong `b2-spikes.log` (dòng marker `WATCHER-RESTART 2026-11-19T15:18:28Z`). Không mất mẫu sampler nào (sampler pid 31971 chạy liên tục, không động tới).
- **F-147-T9-5 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". (Cùng lớp F-146-T9-7.) Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành.
- **F-147-T9-6 — Cụm spike C (5 spike, 15:59:57–16:03:57Z, load1 tới 4,80 — cao nhất đợt) KHÔNG quy được nguồn:** cả 5 snapshot ps đều gần như trống (cao nhất hatch daemon 3,9% — là trung bình tích lũy, không phải tức thời; WebKitWebProcess 3,4%, MiniBrowser 1,0%; mọi process attempt1 của T4 đều idle 0,0–0,1%). load1 4,80 trong khi `/proc/loadavg` ghi chỉ 1 task runnable tại thời điểm kiểm (1/548) → tải là burst ngắn (process sinh rồi chết giữa hai lần snapshot 30 s) hoặc D-state (I/O wait) — watcher hiện tại không phân biệt được hai trường hợp. Giới hạn phương pháp: `%CPU` của `ps` là trung bình tích lũy từ lúc process khởi động nên với process sống lâu nó đứng yên qua các snapshot; đợt sau nên chụp thêm snapshot tức thời (`top -b -n1` hoặc delta `/proc/<pid>/stat`) + ghi `nr_running` từ loadavg để quy nguồn burst. Sampler 60 s độc lập xác nhận tải là thật (16:00:07Z load1 4,29; 16:03:07Z 3,34). Ghi rõ: T9 không gán cụm C cho bất kỳ luồng nào (kể cả T4 — process attempt1 của T4 idle trong mọi snapshot cụm C; và cụm C nằm ngoài cửa sổ probe attempt1 14:47–14:50Z).
- **F-147-T9-7 — T9 KHÔNG phán verdict #21 (T4 chưa xuất bản LIMITS lúc T9 đóng — hoặc trích verdict T4 nếu đã có lúc đóng):** file này chỉ cung cấp dữ kiện sampler độc lập (§2.4) + dữ kiện thô đọc từ file T4 (attempt1 JSON partial 17/20, writePartial TIMEOUT 14:50:29Z). T9 KHÔNG phán B4 đúng/sai, không phán B2 (T4 sampler riêng mịn hơn; T9 cadence 60 s chỉ ghi tối đa 3,52 trong cửa sổ attempt1 — dưới 4). T10 đối chiếu khi gộp.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 146, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 148 (phần T9)

1. **Cơ chế tự động (a) ĐÃ NỐI nhưng chưa có lần kích hoạt thật** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 148 (lockfile + log theo phiên mới — lưu ý lockfile đợt 147 nằm trong dir round147-t9 nên không chặn đợt 148; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức.
2. **⚠️ Headroom 668 — VẪN DƯỚI < ~1.800, lần thứ bảy liên tiếp dưới ngưỡng** (quyết parent đợt 146 (m): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,42 — sâu hơn dưới 1,0.** Bước giảm −212; ba đợt gần nhất giảm tổng −628. Trần 63.747 không đổi trong phiên (đã dừng flip-flop ở 63.747 hai lần đo liên tiếp trên cùng boot).
3. **Balloon: 0/107 mẫu đóng băng trong cửa sổ sampler** (nhưng frozen tại spot check mở đợt 14:40:29Z) — chuỗi đóng băng 9 đợt của T9 không tái hiện trong cửa sổ đo đợt này; giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146; giao T10 phán chuỗi khi gộp (§2.2 ghi đủ cả hai dữ kiện).
4. **Lượt yên #21 đo lại trên boot mới 6fb582df — T4 chưa xuất bản lúc T9 đóng (16:30:58Z):** attempt1 JSON partial 17/20 (writePartial TIMEOUT 14:50:29Z); không có file attempt2/attempt3; T10 đối chiếu khi T4 xuất bản — T9 không phán verdict (§2.3–2.4).
5. Các nợ đứng khác giữ nguyên từ đợt 146 §11 (mù #66 + chứng nhận gap 8.363 s giao T2-147; watchdog chưa được thử bằng kẹt thật — đợt thứ sáu liên tiếp (ghi theo T8); G1 khung (a) M2 vẫn hoãn chờ user; R9 (a) vẫn chờ user; ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB vẫn chưa quyết; TTS 39 cấm kiểm lại).

## Phụ lục A — Bảng sampler đầy đủ (boot 6fb582df, 107 mẫu, 14:44:04–16:30:08Z)

(File gốc: `hidden_files/round147-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)

Thống kê: samples: 107; mem min: 267976 kB (261.7 MiB); mem max: 2572644 kB (2512.3 MiB = 40.89% guard); mem mean: 567545 kB (554.2 MiB); count >=1024 MiB (gate A): 11/107; count >= guard 6144 MiB: 0/107; balloon frozen 6443824: 0/107; balloon min: 4068524 kB; balloon max: 6136248 kB; load1 max: 4.29; load1 >=3.0 samples: 4/107

| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|
| 1 | 2026-11-19T14:44:04Z | 1,400,548 | 1367.7 | 22.26% | 5,291,744 | 700,268 | 0.83 |
| 2 | 2026-11-19T14:45:05Z | 2,154,560 | 2104.1 | 34.25% | 4,354,176 | 688,068 | 2.85 |
| 3 | 2026-11-19T14:46:05Z | 2,572,644 | 2512.3 | 40.89% | 4,068,524 | 687,144 | 3.65 |
| 4 | 2026-11-19T14:47:05Z | 2,482,212 | 2424.0 | 39.45% | 4,265,112 | 688,056 | 2.03 |
| 5 | 2026-11-19T14:48:05Z | 1,794,820 | 1752.8 | 28.53% | 4,315,004 | 678,652 | 2.23 |
| 6 | 2026-11-19T14:49:05Z | 1,527,004 | 1491.2 | 24.27% | 4,446,292 | 657,100 | 3.52 |
| 7 | 2026-11-19T14:50:05Z | 1,771,396 | 1729.9 | 28.16% | 4,426,188 | 665,076 | 2.61 |
| 8 | 2026-11-19T14:51:05Z | 1,550,928 | 1514.6 | 24.65% | 4,563,764 | 666,172 | 1.54 |
| 9 | 2026-11-19T14:52:05Z | 1,407,092 | 1374.1 | 22.37% | 4,750,772 | 676,540 | 0.92 |
| 10 | 2026-11-19T14:53:05Z | 1,271,540 | 1241.7 | 20.21% | 4,924,304 | 675,928 | 0.8 |
| 11 | 2026-11-19T14:54:05Z | 1,113,872 | 1087.8 | 17.70% | 5,081,996 | 676,204 | 0.29 |
| 12 | 2026-11-19T14:55:05Z | 990,960 | 967.7 | 15.75% | 5,216,840 | 683,400 | 0.38 |
| 13 | 2026-11-19T14:56:05Z | 858,100 | 838.0 | 13.64% | 5,342,500 | 680,512 | 0.55 |
| 14 | 2026-11-19T14:57:05Z | 743,976 | 726.5 | 11.83% | 5,460,452 | 680,724 | 0.52 |
| 15 | 2026-11-19T14:58:05Z | 660,408 | 644.9 | 10.50% | 5,571,336 | 676,404 | 0.27 |
| 16 | 2026-11-19T14:59:05Z | 598,292 | 584.3 | 9.51% | 5,668,120 | 678,632 | 0.23 |
| 17 | 2026-11-19T15:00:05Z | 502,940 | 491.2 | 7.99% | 5,761,004 | 648,964 | 0.08 |
| 18 | 2026-11-19T15:01:05Z | 398,052 | 388.7 | 6.33% | 5,842,724 | 638,088 | 0.16 |
| 19 | 2026-11-19T15:02:05Z | 560,872 | 547.7 | 8.91% | 5,720,660 | 613,188 | 0.48 |
| 20 | 2026-11-19T15:03:05Z | 491,516 | 480.0 | 7.81% | 5,779,500 | 616,112 | 1.06 |
| 21 | 2026-11-19T15:04:05Z | 432,360 | 422.2 | 6.87% | 5,861,296 | 617,820 | 1.14 |
| 22 | 2026-11-19T15:05:05Z | 368,640 | 360.0 | 5.86% | 5,936,408 | 616,596 | 1.15 |
| 23 | 2026-11-19T15:06:05Z | 397,648 | 388.3 | 6.32% | 5,940,780 | 584,612 | 1.58 |
| 24 | 2026-11-19T15:07:05Z | 353,756 | 345.5 | 5.62% | 5,988,880 | 587,196 | 1.28 |
| 25 | 2026-11-19T15:08:05Z | 476,076 | 464.9 | 7.57% | 5,859,736 | 566,868 | 1.63 |
| 26 | 2026-11-19T15:09:05Z | 489,364 | 477.9 | 7.78% | 5,850,900 | 586,360 | 1.62 |
| 27 | 2026-11-19T15:10:05Z | 370,572 | 361.9 | 5.89% | 5,929,768 | 578,868 | 1.39 |
| 28 | 2026-11-19T15:11:05Z | 344,716 | 336.6 | 5.48% | 6,000,060 | 576,072 | 1.58 |
| 29 | 2026-11-19T15:12:05Z | 477,744 | 466.5 | 7.59% | 5,854,824 | 577,820 | 1.51 |
| 30 | 2026-11-19T15:13:05Z | 391,832 | 382.6 | 6.23% | 5,931,872 | 578,712 | 1.78 |
| 31 | 2026-11-19T15:14:05Z | 618,952 | 604.4 | 9.84% | 5,694,064 | 598,796 | 1.78 |
| 32 | 2026-11-19T15:15:05Z | 554,096 | 541.1 | 8.81% | 5,779,116 | 655,288 | 1.44 |
| 33 | 2026-11-19T15:16:05Z | 485,068 | 473.7 | 7.71% | 5,867,500 | 691,776 | 0.71 |
| 34 | 2026-11-19T15:17:05Z | 389,216 | 380.1 | 6.19% | 5,948,912 | 681,332 | 0.33 |
| 35 | 2026-11-19T15:18:05Z | 345,568 | 337.5 | 5.49% | 6,019,156 | 673,360 | 0.42 |
| 36 | 2026-11-19T15:19:05Z | 320,092 | 312.6 | 5.09% | 6,078,268 | 640,368 | 0.56 |
| 37 | 2026-11-19T15:20:05Z | 276,432 | 270.0 | 4.39% | 6,136,248 | 622,172 | 0.2 |
| 38 | 2026-11-19T15:21:06Z | 490,360 | 478.9 | 7.79% | 5,836,612 | 639,120 | 0.32 |
| 39 | 2026-11-19T15:22:06Z | 404,200 | 394.7 | 6.42% | 5,918,128 | 659,792 | 0.52 |
| 40 | 2026-11-19T15:23:06Z | 524,208 | 511.9 | 8.33% | 5,795,316 | 621,756 | 0.38 |
| 41 | 2026-11-19T15:24:06Z | 461,268 | 450.5 | 7.33% | 5,851,168 | 631,728 | 0.47 |
| 42 | 2026-11-19T15:25:06Z | 383,148 | 374.2 | 6.09% | 5,930,392 | 626,768 | 0.2 |
| 43 | 2026-11-19T15:26:06Z | 357,896 | 349.5 | 5.69% | 6,000,628 | 610,516 | 0.79 |
| 44 | 2026-11-19T15:27:06Z | 466,804 | 455.9 | 7.42% | 5,830,632 | 624,596 | 0.65 |
| 45 | 2026-11-19T15:28:06Z | 386,168 | 377.1 | 6.14% | 5,907,488 | 618,920 | 0.35 |
| 46 | 2026-11-19T15:29:06Z | 339,144 | 331.2 | 5.39% | 5,980,892 | 610,920 | 0.35 |
| 47 | 2026-11-19T15:30:06Z | 511,392 | 499.4 | 8.13% | 5,780,620 | 601,912 | 0.68 |
| 48 | 2026-11-19T15:31:06Z | 478,092 | 466.9 | 7.60% | 5,837,524 | 608,648 | 0.3 |
| 49 | 2026-11-19T15:32:06Z | 370,292 | 361.6 | 5.89% | 5,916,904 | 608,744 | 0.24 |
| 50 | 2026-11-19T15:33:06Z | 353,712 | 345.4 | 5.62% | 5,985,612 | 603,212 | 0.38 |
| 51 | 2026-11-19T15:34:06Z | 376,400 | 367.6 | 5.98% | 5,966,064 | 597,040 | 0.74 |
| 52 | 2026-11-19T15:35:06Z | 318,568 | 311.1 | 5.06% | 6,027,340 | 597,440 | 1.06 |
| 53 | 2026-11-19T15:36:06Z | 536,172 | 523.6 | 8.52% | 5,722,828 | 595,704 | 0.96 |
| 54 | 2026-11-19T15:37:06Z | 527,144 | 514.8 | 8.38% | 5,780,320 | 603,496 | 0.65 |
| 55 | 2026-11-19T15:38:06Z | 447,144 | 436.7 | 7.11% | 5,862,544 | 605,628 | 0.63 |
| 56 | 2026-11-19T15:39:06Z | 389,564 | 380.4 | 6.19% | 5,936,000 | 601,324 | 0.53 |
| 57 | 2026-11-19T15:40:06Z | 325,552 | 317.9 | 5.17% | 6,001,116 | 596,596 | 1.1 |
| 58 | 2026-11-19T15:41:06Z | 348,840 | 340.7 | 5.54% | 5,992,772 | 589,020 | 0.65 |
| 59 | 2026-11-19T15:42:06Z | 455,216 | 444.5 | 7.24% | 5,851,104 | 600,548 | 0.64 |
| 60 | 2026-11-19T15:43:06Z | 381,312 | 372.4 | 6.06% | 5,927,952 | 598,276 | 0.59 |
| 61 | 2026-11-19T15:44:06Z | 344,036 | 336.0 | 5.47% | 5,991,500 | 587,356 | 0.48 |
| 62 | 2026-11-19T15:45:06Z | 518,420 | 506.3 | 8.24% | 5,788,844 | 594,572 | 0.36 |
| 63 | 2026-11-19T15:46:06Z | 425,036 | 415.1 | 6.76% | 5,861,932 | 600,472 | 0.36 |
| 64 | 2026-11-19T15:47:06Z | 376,180 | 367.4 | 5.98% | 5,935,300 | 595,140 | 0.58 |
| 65 | 2026-11-19T15:48:06Z | 401,656 | 392.2 | 6.38% | 5,911,568 | 584,756 | 0.53 |
| 66 | 2026-11-19T15:49:06Z | 341,468 | 333.5 | 5.43% | 5,980,332 | 590,892 | 0.42 |
| 67 | 2026-11-19T15:50:06Z | 348,140 | 340.0 | 5.53% | 5,959,248 | 587,672 | 0.7 |
| 68 | 2026-11-19T15:51:06Z | 309,336 | 302.1 | 4.92% | 6,025,744 | 588,824 | 0.74 |
| 69 | 2026-11-19T15:52:06Z | 486,064 | 474.7 | 7.73% | 5,780,760 | 582,992 | 0.52 |
| 70 | 2026-11-19T15:53:06Z | 437,212 | 427.0 | 6.95% | 5,834,852 | 587,668 | 0.37 |
| 71 | 2026-11-19T15:54:06Z | 611,040 | 596.7 | 9.71% | 5,649,456 | 588,264 | 0.43 |
| 72 | 2026-11-19T15:55:06Z | 551,592 | 538.7 | 8.77% | 5,712,116 | 603,112 | 0.2 |
| 73 | 2026-11-19T15:56:07Z | 473,424 | 462.3 | 7.52% | 5,798,968 | 603,176 | 0.33 |
| 74 | 2026-11-19T15:57:07Z | 394,080 | 384.8 | 6.26% | 5,879,316 | 597,644 | 0.12 |
| 75 | 2026-11-19T15:58:07Z | 341,712 | 333.7 | 5.43% | 5,949,556 | 591,664 | 0.19 |
| 76 | 2026-11-19T15:59:07Z | 387,876 | 378.8 | 6.17% | 5,928,304 | 588,280 | 0.91 |
| 77 | 2026-11-19T16:00:07Z | 307,252 | 300.1 | 4.88% | 5,994,648 | 592,328 | 4.29 |
| 78 | 2026-11-19T16:01:07Z | 277,416 | 270.9 | 4.41% | 6,056,804 | 582,908 | 2.94 |
| 79 | 2026-11-19T16:02:07Z | 305,096 | 297.9 | 4.85% | 6,013,996 | 573,996 | 2.64 |
| 80 | 2026-11-19T16:03:07Z | 267,976 | 261.7 | 4.26% | 6,077,500 | 572,312 | 3.34 |
| 81 | 2026-11-19T16:04:07Z | 440,368 | 430.0 | 7.00% | 5,863,456 | 577,004 | 2.98 |
| 82 | 2026-11-19T16:05:07Z | 548,908 | 536.0 | 8.72% | 5,742,068 | 570,556 | 2.06 |
| 83 | 2026-11-19T16:06:07Z | 482,356 | 471.1 | 7.67% | 5,799,404 | 585,088 | 1.67 |
| 84 | 2026-11-19T16:07:07Z | 409,108 | 399.5 | 6.50% | 5,879,392 | 588,640 | 1.58 |
| 85 | 2026-11-19T16:08:07Z | 451,876 | 441.3 | 7.18% | 5,839,132 | 580,380 | 1.78 |
| 86 | 2026-11-19T16:09:07Z | 391,540 | 382.4 | 6.22% | 5,915,964 | 580,072 | 2.83 |
| 87 | 2026-11-19T16:10:07Z | 399,324 | 390.0 | 6.35% | 5,897,592 | 574,352 | 2.19 |
| 88 | 2026-11-19T16:11:07Z | 335,916 | 328.0 | 5.34% | 5,967,492 | 576,544 | 1.27 |
| 89 | 2026-11-19T16:12:07Z | 369,876 | 361.2 | 5.88% | 5,946,168 | 572,600 | 1.35 |
| 90 | 2026-11-19T16:13:07Z | 321,088 | 313.6 | 5.10% | 5,990,112 | 574,600 | 1.6 |
| 91 | 2026-11-19T16:14:07Z | 511,772 | 499.8 | 8.13% | 5,791,164 | 589,796 | 0.86 |
| 92 | 2026-11-19T16:15:07Z | 458,416 | 447.7 | 7.29% | 5,846,472 | 612,872 | 0.46 |
| 93 | 2026-11-19T16:16:07Z | 395,992 | 386.7 | 6.29% | 5,922,588 | 649,836 | 0.35 |
| 94 | 2026-11-19T16:17:07Z | 355,356 | 347.0 | 5.65% | 5,995,104 | 667,140 | 0.66 |
| 95 | 2026-11-19T16:18:07Z | 286,840 | 280.1 | 4.56% | 6,063,000 | 656,716 | 0.42 |
| 96 | 2026-11-19T16:19:07Z | 402,596 | 393.2 | 6.40% | 5,953,720 | 642,188 | 0.66 |
| 97 | 2026-11-19T16:20:07Z | 317,272 | 309.8 | 5.04% | 6,025,176 | 634,400 | 0.48 |
| 98 | 2026-11-19T16:21:07Z | 520,824 | 508.6 | 8.28% | 5,802,156 | 658,592 | 0.55 |
| 99 | 2026-11-19T16:22:07Z | 450,164 | 439.6 | 7.16% | 5,887,316 | 651,140 | 0.29 |
| 100 | 2026-11-19T16:23:07Z | 345,516 | 337.4 | 5.49% | 5,963,196 | 648,452 | 0.25 |
| 101 | 2026-11-19T16:24:07Z | 301,100 | 294.0 | 4.79% | 6,031,512 | 631,400 | 0.39 |
| 102 | 2026-11-19T16:25:07Z | 337,484 | 329.6 | 5.36% | 5,936,684 | 615,348 | 1.02 |
| 103 | 2026-11-19T16:26:08Z | 635,780 | 620.9 | 10.11% | 5,610,900 | 625,720 | 0.92 |
| 104 | 2026-11-19T16:27:08Z | 537,248 | 524.7 | 8.54% | 5,706,640 | 627,064 | 0.45 |
| 105 | 2026-11-19T16:28:08Z | 472,940 | 461.9 | 7.52% | 5,794,932 | 627,944 | 0.26 |
| 106 | 2026-11-19T16:29:08Z | 424,160 | 414.2 | 6.74% | 5,874,436 | 618,060 | 0.58 |
| 107 | 2026-11-19T16:30:08Z | 341,992 | 334.0 | 5.44% | 5,948,144 | 610,460 | 0.29 |

## Phụ lục B — Log watcher B2 (11 spike)

(File gốc: `hidden_files/round147-t9/b2-spikes.log` — 11 spike, mỗi spike kèm ps snapshot top-12 (6 spike đầu ghi `comm`, 5 spike sau ghi full `args` — xem F-147-T9-4); tóm tắt quy nguồn ở §2.5.)
