# LIMITS — Phase 9 đợt 148, T9: headroom inotify + RAM + TỰ ĐỘNG HÓA birefnet (0 lần kích hoạt lần thứ hai liên tiếp; REBOOT giữa phiên cắt sampler; headroom 554 → 446, dưới ngưỡng lần thứ tám)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 554/554 (17:40:27Z, boot d8a11644) → đóng 446/446 (19:36:35Z, boot MỚI 1d610e56 sau reboot)** — giảm −114 so với 668 đợt 147 (−17,1%) ở đầu phiên và −108 nữa qua reboot; **dưới ngưỡng < ~1.800 lần thứ tám liên tiếp** (thấp hơn ngưỡng 1.354); tỉ lệ/vite chỉ còn ~0,35 mở đợt, ~0,28 đóng phiên. Quyết parent "chỉ theo dõi" (m) đợt 146 vẫn đứng — đợt này T9 chỉ theo dõi, không báo riêng. Xem §1.
- **🔥 REBOOT GIỮA PHIÊN (sự kiện lớn nhất đợt này):** boot d8a11644 chết giữa mẫu sampler cuối **19:34:40Z** và lần kiểm **19:35:25Z**; boot mới **1d610e56, btime 19:34:32Z** (epoch 1795116872). **Nghịch lý đồng hồ 8 s:** btime boot mới (19:34:32Z) SỚM HƠN 8 s so với mẫu cuối trên boot cũ (19:34:40Z) — cùng họ nghịch lý đồng hồ đã ghi các đợt trước; T9 không tự chốt giây reboot chính xác, giao T2/T5 phán. Sampler + B2 watcher **chết theo reboot** (không phải T9 kill); sleep chờ của T9 nhận SIGTERM ~19:36Z — khớp reboot. Không có mẫu sampler nào trên boot mới. Xem §5.
- **RAM:** sampler **115 mẫu, 17:40:34–19:34:40Z, chỉ boot d8a11644** (không gap lấy mẫu, cadence 60 s): min **334.880 kB (327,0 MiB) lúc 18:41:38Z**, max **3.602.816 kB (3.518,4 MiB = 57,26% guard) lúc 18:04:36Z** (trong cửa sổ attempt2 của T4), mean 1.209.964 kB (1.181,6 MiB). Gate A ≥1024 MiB: **43/115 mẫu** (chuỗi dài 17:43:34–18:22:37Z, 40 mẫu + 3 mẫu lẻ). **0/115 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt lần nào (đúng thiết kế, không false positive) — lần thứ hai liên tiếp 0 lần thử birefnet.** Xem §2, §3.
- **Balloon virtio: ĐÓNG BĂNG TRỞ LẠI — 38/115 mẫu ghim 6.443.824 kB trong MỘT chuỗi liên tục 18:57:38–19:34:40Z (37 phút)** — sau đợt 147 ghi 0/107 (T10 phán chuỗi 9 đợt đã đứt). T9 không tự chốt chuỗi mới, giao T10 phán; dữ kiện: frozen tại spot check mở đợt 17:39:36Z, xả sâu tới min 2.461.672 kB lúc 18:04:36Z, rồi phình lại và ghim trần 37 phút tới lúc boot chết. Xem §2.2.
- **B2: 19 spike load1 ≥3,0 — TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN (không còn cụm vô chủ như F-147-T9-6):** cụm 1 (17:40–17:45Z, 10 spike, đỉnh **12,56** — cao nhất từ trước tới nay trong watcher T9) = O8 WebKit của T8 + ffmpeg hevc + tsc + vite build + Chromium chồng nhau đầu phiên; cụm 2 (17:49–17:53Z, 8 spike, đỉnh 7,37) = render.js/mask_anim.py/ffmpeg (U4 round93) + smoke T4 + T2 blind67/hole-recheck + tsc; spike 18:00:44Z (4,18) = chính attempt1 của T4 (B2 vi phạm — khớp verdict T4). **Sau 18:00:44Z: 0 spike tới hết sampler (~94 phút yên).** Phương pháp snapshot tức thời mới (`top -b -n1` + delta `/proc/<pid>/stat` + nr_running) đã chứng minh được giá trị: nr_running tới **28/680** lúc 17:44:43Z, delta tick bắt được ffmpeg 129 tick/s, mask_anim.py 98 tick/s. Xem §2.5.
- **Lượt yên #21 (T4): ĐÓNG — attempt3 20/20, tickCost median đúng 60,0 ms (sát nút tuyệt đối).** Dữ kiện sampler T9 trong 3 cửa sổ attempt: A1 (17:59:48–18:03:21Z) load1 tới 3,62 + watcher spike 4,18 → B2 vi phạm (khớp T4); A2 load 1,07–1,83 sạch, RAM 3,20–3,60 MB (đỉnh phiên); A3 load 0,64–2,16 sạch. Xem §2.3, §2.4.
- **Khoảng ~6,5 GB "không nằm trong RSS" (T4 §6 đợt 147) — T5-148 ĐÃ QUY ĐƯỢC = BALLOON (đối chiếu định lượng):** dữ kiện T9 corroborate — balloon 6.443.824 kB = 6,29 GiB, đúng cỡ khoảng thiếu. Nợ này coi như đóng ở phía T9 (chờ T10 xác nhận). Xem §2.2.
- Import check rembg **KHÔNG làm lại** (brief: đã hoàn thành đợt 147, F-146-T9-2 đã đóng; không có thay đổi). Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round148-t9/k8-headroom.py` (copy y nguyên từ đợt 147 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** trên cả hai boot (d8a11644 lúc mở đợt, 1d610e56 lúc đóng — không đổi).

### 1.2 Số đo đợt 148

| Thời điểm (UTC 19/11) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 17:40:27Z | **554** | d8a11644 (btime 17:27:53Z) | lần đo 1, boot ~12'34" tuổi; RAM trước đo 621.828 kB, balloon 6.181.680 kB |
| 17:40:27Z | **554** | d8a11644 | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 627.764 kB, balloon 6.181.680 kB |
| 19:36:35Z | **446** | **1d610e56 (btime 19:34:32Z)** | lần đo 3 (đóng phiên, TRÊN BOOT MỚI sau reboot), boot ~2'03" tuổi; RAM trước đo 1.916.380 kB, balloon 4.972.736 kB |
| 19:36:35Z | **446** | 1d610e56 | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 1.906.888 kB, balloon 4.972.736 kB |

- Probe dừng ở `i=554` cả hai lần mở đợt và `i=446` cả hai lần đóng phiên, errno=28 — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau lần 4).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 554 = **63.193 watch** lúc mở (tăng ~114 so với 63.079 đợt 147); 63.747 − 446 = **63.301 watch** lúc đóng trên boot mới (tăng thêm ~108 qua reboot — reboot KHÔNG nhả watch ngoài cell).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 554 / 1.578 ≈ **0,35** mở đợt; 446 / 1.578 ≈ **0,28** đóng phiên — sâu hơn dưới 1,0 (đợt 147: 0,42).
- Đối chiếu độc lập (T5-148 §1/§6.1, cùng boot d8a11644): **mở 548 → cuối 455** — T5 đo 548, T9 đo 554 cùng khoảng mở đợt (chênh 6 watch — sai số pha lấy mẫu + thời điểm đo khác nhau: T5 đo 17:42:42Z, T9 đo 17:40:27Z); T5 đóng 455 lúc ~18:22Z trên d8a11644, T9 đóng 446 lúc 19:36:35Z trên boot MỚI 1d610e56 (khác boot nên không so trực tiếp — nhưng cùng hướng giảm; tổng giảm trong phiên trên d8a11644 theo T5 là −93, rồi −9 nữa qua reboot theo T9).
- Lưu ý: RAM trước đo lần 1 là 621.828 kB (balloon 6.181.680 kB) — thấp hơn nhiều so với 1.916.380 kB trước đo lần 3 (balloon 4.972.736 kB, boot mới vừa lên). Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot cũng không khôi phục headroom.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–147 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 147 | 668 → 668 | đo 14:42:51Z, boot 6fb582df btime 12:13:26Z |
| **148** | **554 → 446** | **mở 17:40:27Z boot d8a11644 btime 17:27:53Z → đóng 19:36:35Z boot MỚI 1d610e56 btime 19:34:32Z (reboot giữa phiên)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — và reboot không khôi phục.** Từ đỉnh chuỗi 4.438 xuống 446 = **−3.992 (−89,9%)**. Bước giảm đợt này: −114 so với đợt 147 (−17,1%) ở đầu phiên; thêm −108 trong phiên (qua reboot). Ba đợt gần nhất giảm tổng −628 (đợt 146→147) rồi −222 (147→148).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 446, thấp hơn ngưỡng 1.354, lần thứ tám liên tiếp.** Quyết parent đợt 146 (m): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite 0,28 lúc đóng — sâu nhất từ trước tới nay.** Headroom chỉ còn ~28% nhu cầu một vite đầy đủ (~1.578 watch). Đây là diễn biến đáng ghi cho parent/T10, nhưng quyết "chỉ theo dõi" vẫn đứng (brief đợt này + quyết parent đợt 146 (m)); T9 không tự nâng mức báo hay yêu cầu user hành động.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 17:39:36Z, lúc đo probe 17:40:27Z, lúc đóng 19:35:25Z và 19:36:35Z — cùng giá trị trên cả hai boot; T5-148 cũng ghi trần 63.747 không đổi). Chuỗi trần qua các boot gần nhất: 63.747 (e146ca67) → 63.756 (98a7c93f) → 63.747 (6fb582df, đợt 146+147) → **63.747 (d8a11644, đợt 148) → 63.747 (1d610e56, đợt 148)**. Flip-flop ±9 đã dừng ở 63.747 bốn lần đo liên tiếp trên ba boot — ghi làm chú thích chuẩn chuỗi theo quyết (m) đợt 146, không hành động.
- Trần 63.747 vẫn đầy ở mức ~63,3k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 115 mẫu, 17:40:34–19:34:40Z, boot d8a11644

### 2.1 Hình dạng cửa sổ: leo đầu phiên, đỉnh giữa phiên (trong attempt2 T4), rồi rơi về vùng trũng + balloon ghim trần

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **115 mẫu, 17:40:34–19:34:40Z, một boot duy nhất d8a11644 — không gap lấy mẫu trong cửa sổ sampler, nhưng sampler CHẾT theo reboot sau mẫu cuối (xem §5).** Tổng quan: **min 334.880 kB (327,0 MiB) lúc 18:41:38Z; max 3.602.816 kB (3.518,4 MiB) lúc 18:04:36Z — 57,26% guard; mean 1.209.964 kB (1.181,6 MiB).**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 17:40:34Z | 642,6 MiB (657.976 kB) | mẫu đầu (balloon 5.788.464 kB — đang xả khỏi giá trị đóng băng; load1 3,09) |
| 17:41:34Z | 1.093,7 MiB (1.120.012 kB) | balloon xả tiếp 5.002.032 kB; load1 4,83 (cụm spike O8, xem §2.5) |
| 17:43:34–18:22:37Z | 1.024–3.518 MiB | **chuỗi 40 mẫu liên tục ≥1024 MiB**; balloon xả sâu tới min 2.461.672 kB lúc 18:04:36Z (đúng lúc đỉnh RAM — trong cửa sổ attempt2 T4) |
| 18:04:36Z | **3.518,4 MiB (3.602.816 kB) — MAX phiên (57,26% guard)** | balloon **min phiên 2.461.672 kB**; load1 1,38 |
| 18:23:37Z → 18:41:38Z | 1,0 GB → **327,0 MiB (334.880 kB) — MIN phiên** | rơi dưới gate A, balloon phình lại 5,4M → 6,1M |
| 18:44:38Z + 18:51:38Z | 1.024,9 / 1.030,4 MiB | 2 mẫu lẻ vượt gate A (nhô ngắn rồi rơi lại) |
| 18:57:38Z → 19:34:40Z | ~0,49–0,51 GB | **balloon GHIM TRẦN 6.443.824 kB cả 38 mẫu** (xem §2.2); RAM phẳng ~500 MiB; load1 0,08–0,32 |
| 19:34:40Z | 503,4 MiB (515.488 kB) | mẫu cuối trên boot d8a11644 (balloon 6.443.824 kB — đang ghim); reboot sau đó |

- **43/115 mẫu ≥1024 MiB** (chuỗi 40 mẫu 17:43:34–18:22:37Z + 1 mẫu 17:41:34Z + 2 mẫu lẻ 18:44:38Z/18:51:38Z); **28/115 mẫu ≥2.000.000 kB** (tất cả trong chuỗi 17:43–18:22Z); **0 mẫu ≥ guard**.
- Load1 (sampler 60 s): 0,08–11,63 (max 11,63 lúc 17:44:36Z — cụm spike đầu phiên; watcher 30 s ghi tối đa 12,56 lúc 17:44:06Z); **12/115 mẫu load1 ≥3,0** (tất cả trong 17:40–18:00Z); **sau 18:00:36Z: 0 mẫu load1 ≥3,0 tới hết sampler** — nửa sau phiên yên hoàn toàn về tải.
- Swap: SwapFree 725.304 kB (mẫu đầu) → 749.544 kB (mẫu cuối); dao động 695–765k cả phiên (swap đang dùng ~260–330 MB).
- Đối chiếu T5-148 (sampler riêng n=40, cửa sổ khác trên cùng boot d8a11644): max 57,2% guard, 0 mẫu ≥ guard — **khớp gần như tuyệt đối với T9 (57,26%)**; mean T5 cao hơn (pha lấy mẫu khác nhau).

### 2.2 Balloon virtio — xả sâu đầu phiên, rồi GHIM TRẦN 37 phút liên tục tới lúc boot chết

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Lúc T9 kiểm mở đợt 17:39:36Z: balloon 6.443.824 kB — đúng giá trị đóng băng** (như đợt 147: frozen tại spot check mở đợt). Rồi xả nhanh: 6.181.680 kB lúc 17:40:11Z → 5.788.464 kB (mẫu sampler đầu 17:40:34Z) → 5.002.032 kB lúc 17:41:34Z → min **2.461.672 kB lúc 18:04:36Z** (đúng lúc đỉnh RAM).
- Trong cửa sổ 115 mẫu: balloon **min 2.461.672 kB lúc 18:04:36Z → phình lại răng cưa → max 6.443.824 kB, 38/115 mẫu chạm đúng 6.443.824 kB — tất cả trong MỘT chuỗi liên tục 18:57:38–19:34:40Z (37 phút, 38 mẫu)**. Balloon ghim trần không nhúc nhích suốt 37 phút cuối của boot d8a11644, tới tận mẫu cuối trước reboot.
- **Đây là lần đầu tiên kể từ đợt 146 sampler ghi mẫu ghim trần trở lại** (đợt 147: 0/107 — T10 phán chuỗi 9 đợt đã đứt trong cửa sổ đo đợt 147). Diễn biến đợt này: balloon xả sâu đầu phiên (min 2,46M — sâu hơn min 4,07M đợt 147) rồi phình lại và **ghim trần 37 phút liên tục**. **T9 không tự chốt chuỗi đóng băng "nối lại" hay "chuỗi mới"** — dữ kiện: 38/115 ghim trong cửa sổ + frozen tại spot check mở đợt + ghim tới tận lúc boot chết. Giao T10 phán chuỗi khi gộp (ghi rõ cả ba dữ kiện để khỏi nhầm).
- **Khoảng ~6,5 GB "không nằm trong RSS" (T4 §6 đợt 147) — T5-148 ĐÃ QUY ĐƯỢC = BALLOON:** T5 đối chiếu định lượng (xem LIMITS T5-148 §1). Dữ kiện T9 corroborate: balloon 6.443.824 kB = 6.443.824 / 1.048.576 = **6,29 GiB** (6,44 GB thập phân) — đúng cỡ khoảng ~6,5 GB mà T4 ghi "sập" mà không nằm trong RSS process nào. Nợ này coi như đóng ở phía T9 (chờ T10 xác nhận khi gộp).
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 19:34:40Z: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 515.488 kB.
- Sau reboot (boot mới 1d610e56): balloon 5.020.304 kB lúc 19:35:25Z → 4.972.736 kB lúc 19:36:35Z (đang xả chậm, chưa về sâu).

### 2.3 Lượt yên WebKit #21 (T4, đợt 148) — #21 ĐÓNG (T4 đã xuất bản LIMITS)

- **T4-148 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND148_T4_WEBKIT_QUIET21_LIMITS.md`) — khác đợt 147 (T4 chưa xuất bản lúc T9 đóng). T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại.
- **Verdict T4: #21 ĐÓNG — LƯỢT HỢP LỆ ĐẦU TIÊN SAU 2 ĐỢT (attempt3, 20/20).** Attempt1 (17:59:48–18:03:21Z): 20/20 pass, tickCost median 66,0 ms (n=470), **B2 VI PHẠM** (poller RETRY 1→2, không cộng dồn). Attempt2 (18:04:20–18:07:53Z): 20/20 pass, median 65,5 ms (n=506), cổng tickCost LOẠI live lần đầu. Attempt3 (18:08:37–18:12:08Z): 20/20 pass, median **60,0 ms** (n=525) — **đúng ngưỡng, lượt hợp lệ, #21 ĐÓNG**. Caveat T4: median A3 = 60,0 ĐÚNG NGƯỠNG — lượt sát nút tuyệt đối; load/RAM không giải thích được (r ≈ 0 cả hai).
- **Số cộng dồn lượt yên hợp lệ: #21 là lượt hợp lệ — chuỗi lượt yên tăng lên (T10 xác nhận số cuối khi gộp; T9 chỉ ghi dữ kiện).**
- Probe đã sửa theo F-147-T4-1: **0 kẹt trong 3 attempt** (không còn writePartial TIMEOUT như đợt 147).

### 2.4 Dữ kiện sampler T9 trong cửa sổ attempt của T4 (độc lập, cadence 60 s)

| Attempt | Cửa sổ (UTC) | Boot | load1 (T9) | RAM (T9) | Ghi chú |
|---|---|---|---|---|---|
| 1 | 17:59:48–18:03:21Z | d8a11644 | 3,62 / 3,36 / 1,62 | 1.305,3 → 1.311,9 MiB | 3 mẫu; RAM ≥1024 MiB cả 3 mẫu; **watcher spike 18:00:44Z load1 4,18 (WebKitWebProcess 67,4% + MiniBrowser 30,2% — chính probe T4)** → B2 vi phạm trong cửa sổ attempt1 — **khớp verdict T4** |
| 2 | 18:04:20–18:07:53Z | d8a11644 | 1,38 / 1,82 / 1,83 / 1,07 | 3.518,4 → 3.133,9 MiB | 4 mẫu; **đỉnh RAM phiên 3.602.816 kB lúc 18:04:36Z** (balloon min phiên 2.461.672 kB); load1 < 2 cả 4 mẫu, 0 spike watcher — sạch |
| 3 | 18:08:37–18:12:08Z | d8a11644 | 2,16 / 1,39 / 0,64 | 2.110,3 → 2.251,5 MiB | 3 mẫu; load1 < 2,2, 0 spike watcher — sạch; lượt hợp lệ theo T4 |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. Dữ kiện T9 corroborate cả ba phán của T4: A1 B2 vi phạm (spike 4,18 trong cửa sổ), A2/A3 sạch (0 spike, load < 2,2).

### 2.5 B2 — tải tự sinh của stack đo: 19 spike, TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN

**Câu hỏi mở từ đợt 147 (F-147-T9-6):** cụm spike C không quy được nguồn vì `%CPU` của ps là trung bình tích lũy. Trả lời đợt 148: **phương pháp mới đã đóng được lỗ hổng — 19/19 spike quy được nguồn.** Watcher mới (`b2-watcher.sh` viết lại cho đợt này): mỗi spike ghi thêm (a) `top -b -n1` tức thời, (b) delta `/proc/<pid>/stat` (utime+stime) trong 1 s cho top-5 pid, (c) nr_running + số process D-state. **Không còn cụm spike vô chủ nào đợt này** (khác đợt 147: cụm C 5 spike không quy được).

Bằng chứng — watcher spike (ngưỡng load1 ≥3,0, kiểm tra mỗi 30 s; tổng **19 spike**: cụm 1: 10 + cụm 2: 8 + attempt1: 1):

| Cụm | Thời điểm (UTC) | load1 | Process gây tải (ps + top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|
| 1a (2 spike) | 17:40:34Z + 17:41:08Z | 3,09 / 4,55 | ffmpeg pid 7727 **118,2% tức thời (top), delta 119 tick/s** — encode hevc testsrc2 `/tmp/round76-d8/hevc-a.mp4`; rồi vite :5560 + MiniBrowser + WebKitWebProcess (O8 T8) | ffmpeg hevc (không rõ chủ — cùng họ F-147-T9-3, cmdline đầy đủ lần này: testsrc2 hevc 2 s) + O8 WebKit của T8 |
| 1b (6 spike) | 17:41:43Z → 17:44:43Z | 4,55 → **12,56** → 10,69 | WebKitWebProcess delta 61 tick/s + MiniBrowser 35 tick/s (17:41:43Z); **tsc --noEmit pid 9644 delta 37–41 tick/s** (17:42:55–17:44:06Z); vite :5554 headed clicktest (T8 O8) delta 25 tick/s; **vite build pid 15318 delta 58 tick/s** (17:44:43Z); nr_running **28/680** lúc 17:44:43Z (tải runnable thật, không phải D-state) | Chồng nhau đầu phiên: **O8 T8 (2 vite + WebKit/Chromium) + tsc verify (T1) + vite build** — đỉnh **12,56 lúc 17:44:06Z là cao nhất từ trước tới nay trong watcher T9** (vượt 4,80 đợt 147). Tất cả đều là công việc có chủ của các luồng khác, không phải stack đo |
| 1c (2 spike) | 17:45:19Z + 17:45:55Z | 6,90 / 4,06 | (đuôi cụm 1b — loadavg suy chậm sau đỉnh 12,56; snapshot vẫn thấy dư âm O8/tsc) | Đuôi loadavg, không phải tải mới |
| 2a (2 spike) | 17:49:01Z + 17:49:36Z | 4,82 / 6,36 | render.js u4-mkf60 **100%** (node render libx264) + **mask_anim.py pid 22032 delta 98 tick/s** + T4 smoke-wall45 (vite :5187 + MiniBrowser/WebKit) + T2 blind67-sessions.py | Render U4 round93 + mask_anim + smoke T4 + T2 chồng nhau |
| 2b (3 spike) | 17:50:12Z + 17:50:47Z + 17:51:23Z | 7,37 / 6,29 / 4,96 | mask_anim.py 47–55% + **ffmpeg ffv1 pid 23552 delta 129 tick/s** + **tsc pid 24240 80,6%** + T2 hole-recheck.py 42,9–51,6% | mask_anim + ffmpeg ffv1 + tsc + T2 hole-recheck |
| 2c (2 spike) | 17:51:58Z + 17:52:33Z | 4,48 / 4,25 | T2 hole-recheck.py 44,3–51,6% (chủ lực) | T2 hole-recheck |
| 2-đuôi (1 spike) | 17:53:09Z | 3,04 | Snapshot GẦN NHƯ TRỐNG + **top 95,2% idle, 0,0% us, nr_running 1/459** — không có process nóng | **Đuôi loadavg thuần túy** (phương pháp mới phân biệt được: top tức thời idle + nr_running = 1 → không phải tải mới) |
| A1 (1 spike) | 18:00:44Z | 4,18 | **WebKitWebProcess 67,4% + MiniBrowser 30,2%** (chính probe attempt1 T4: `probe121t3-ghost-k7.webkit.mjs`, vite :5187) | Tải do **chính probe attempt1 của T4** — B2 vi phạm trong cửa sổ attempt1 (khớp T4 §3) |

- **Sau 18:00:44Z: 0 spike tới hết sampler (19:34:40Z)** — ~94 phút yên dù sampler/watcher vẫn chạy suốt và T4/T7/T8 còn làm việc. Stack đo (vài lệnh grep/ps mỗi phút) không sinh tải đo được.
- **Caveat (cùng lớp F-144-T9-7 / F-145-T9-5):** snapshot ps của chính watcher đôi khi tự lọt top (đợt này: ps 100% trong snapshot spike 18:00:44Z). Giá trị load1 vẫn là thật (đọc từ /proc/loadavg, không qua ps). **Caveat mới của phương pháp delta:** vòng lặp delta đọc `/proc/<pid>/stat` từng pid kèm `sleep 1` — pid nào chết giữa chừng thì mất dòng delta (vd spike 17:41:43Z chỉ còn 1 dòng delta); nhưng `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution.
- **Kết luận phương pháp (F-147-T9-6 ĐÓNG ở phía T9):** snapshot tức thời + delta tick + nr_running đã quy được 19/19 spike đợt này, kể cả spike đuôi loadavg (phân biệt bằng top idle + nr_running thấp). T9 giữ nguyên watcher này cho đợt sau.

### 2.6 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt (sampler T9) | Cuối lượt |
|---|---|---|---|
| 147 | ~1,62 GB (T9 đo trực tiếp 1.651.784 kB lúc 14:42:51Z; mẫu sampler đầu 1.400.548 kB lúc 14:44:04Z) | 262–2.512 MiB (boot duy nhất 6fb582df, 107 mẫu, 14:44:04–16:30:08Z); leo đầu phiên rồi rơi đơn điệu về vùng trũng, KHÔNG hồi lại; KHÔNG reboot, KHÔNG gap lấy mẫu (sampler dài của T9, ~106 phút) | 334,0 MiB lúc 16:30:08Z (315.856 kB lúc 16:30:58Z, sau sampler) |
| **148** | **~0,61 GB (T9 đo trực tiếp 621.828 kB lúc 17:40:27Z; mẫu sampler đầu 657.976 kB lúc 17:40:34Z)** | **327–3.518 MiB (boot duy nhất d8a11644, 115 mẫu, 17:40:34–19:34:40Z); leo đầu phiên, đỉnh giữa phiên trong cửa sổ attempt2 T4 (18:04:36Z), rồi rơi về vùng trũng + balloon ghim trần 37 phút; REBOOT sau mẫu cuối — sampler chết theo reboot, KHÔNG có mẫu nào trên boot mới (sampler dài của T9, ~114 phút)** | **503,4 MiB lúc 19:34:40Z (mẫu cuối trên boot cũ); RAM trên boot mới 1.916.380 kB lúc 19:36:35Z (balloon 4.972.736 kB)** |

(Các đợt 124–146 xem LIMITS T9 đợt 147 §2.6 — không chép lại để file khỏi phình; dòng đợt 147 chép lại làm neo nối tiếp.)

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN; CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ hai liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148 giữ nguyên): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **3.602.816 kB = 3.518,4 MiB = 57,26% guard lúc 18:04:36Z** — xa guard 2.688.640 kB. Đối chiếu T5-148 (sampler riêng n=40): max 57,2% guard, 0 mẫu ≥ guard — **khớp gần như tuyệt đối** (chênh 0,06 điểm phần trăm — pha lấy mẫu).
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ hai liên tiếp.** Cơ chế tự động armed cả phiên (sampler `round148-t9/sampler.sh`, pid 7779, chạy 17:40:34–19:34:40Z) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→148 (theo sampler T9): 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, 2.860 MB, 2.992 MB, 2.778 MB, 2.947 MB, 3.863 MB, **6.752 MB**, 2.573 MB, **3.603 MB**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler pid 7779 sống suốt 17:40:34–19:34:40Z (115 mẫu đều đặn, không gap); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 147 nằm trong dir round147-t9 nên không chặn đợt này (dir mới round148-t9, lock riêng — đúng thiết kế).
- **Sẵn sàng thử (không đổi từ đợt 147 — import check KHÔNG làm lại theo brief):** venv `server/bgremove/.venv/bin/python` + rembg 2.0.87 / onnxruntime 1.23.2 đã xác minh đợt 147 (import 6,9 s); model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4`; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-148-birefnet/out-birefnet-148.mov` — thư mục đã tạo sẵn, trống lúc mở). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-148-T9-5); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-148-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l); T10 phán ô nhiễm nếu xảy ra). **Thêm điểm yếu mới (d): reboot giữa phiên giết sampler — cửa sổ guard (nếu mở) trên boot mới sau reboot sẽ KHÔNG được quan sát cho tới khi T9 đợt sau khởi động sampler mới (F-148-T9-6).**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên.

## 4. ENOSPC / vite watch

- **Journal trên boot mới 1d610e56: 0 dòng "No space left" / ENOSPC** (kiểm tra 19:38:20Z, `journalctl -b -0 --grep` — "No entries"). Journal chỉ liệt kê **1 boot** (`journalctl --list-boots`: chỉ 1d610e56, first entry 19:34:48Z) — journald không giữ lại journal của boot d8a11644 (volatile), nên **không kiểm được ENOSPC trên boot cũ sau reboot** — ghi rõ giới hạn này (T5/T6 có nguồn khác thì đối chiếu).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới; boot mới lúc đóng chỉ ~2 phút tuổi nên số steal chưa có ý nghĩa) — ghi rõ, không bịa số.
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=554, i=554, i=446, i=446) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 446 chỉ còn ~0,28 vite — **sâu nhất từ trước tới nay dưới 1 vite đầy đủ**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2 (không thuộc verdict T9)

- **Boot lúc mở đợt 148 = d8a11644** (btime **17:27:53Z** — `uptime -s` 17:27:53 + `/proc/stat` btime 1795109273 KHỚP nhau; T5-148 cũng ghi btime này; brief nói ~17:28:08Z là lệch 15 s — T5 đã ghi F-148-T5-2). Reboot này xảy ra TRƯỚC khi đợt 148 mở (17:35:51Z), trong lúc T10-147 đóng sổ.
- **🔥 REBOOT MỚI trong phiên T9:** boot **1d610e56-6970-429a-a385-f0ba67dbc191**, btime **19:34:32Z** (epoch 1795116872 — `uptime -s` 19:34:32 + `/proc/stat` btime KHỚP nhau). Reboot xảy ra giữa mẫu sampler cuối **19:34:40Z** (vẫn boot d8a11644) và lần kiểm **19:35:25Z** (đã boot 1d610e56).
- **Nghịch lý đồng hồ 8 s (ghi rõ, không tự chốt):** btime boot mới 19:34:32Z SỚM HƠN 8 s so với mẫu cuối trên boot cũ 19:34:40Z — nếu btime là đúng thì boot mới đã lên trước khi mẫu cuối của boot cũ được ghi (vô lý). Cùng họ nghịch lý đồng hồ đã ghi các đợt trước (T2 §2.4 đợt 147: nghịch lý ≥23 s đã giải thích tới từng file). T9 chỉ ghi cả hai mốc thô; **giao T2/T5 phán giây reboot chính xác + số thứ tự reboot** (T5 ghi d8a11644 là "reboot #35? chờ T2 xác nhận" — reboot mới này sẽ là #36? nếu đếm tiếp; T9 không tự đánh số).
- **Tuổi thọ boot d8a11644 (cận dưới):** btime 17:27:53Z → mẫu cuối 19:34:40Z = **7.607 s = 2h06m47s** (boot chết sau mẫu cuối; tuổi thật ≥ 7.607 s; T7/T2 đối chiếu mốc neo khi gộp).
- **Hậu quả trực tiếp cho T9:** sampler pid 7779 + B2 watcher pid 7780 **chết theo reboot** (không phải T9 kill — T9 không kill process của mình bằng tay lúc đóng vì chúng đã chết; `pgrep` lúc 19:35:25Z không còn thấy). Lệnh `sleep 7200` chờ đóng phiên của T9 nhận **SIGTERM ~19:36Z** — khớp thời điểm reboot (process bị giết cùng boot cũ). **Gap phủ sóng: không có mẫu sampler nào trên boot mới 1d610e56** (từ ~19:34:40Z tới lúc T9 đóng 19:38:20Z) — cửa sổ guard (nếu mở) trên boot mới không được quan sát (F-148-T9-6).
- **Replay dpkg boot mới:** T5 là chủ quản — T9 không chạy apt/dpkg nào; chỉ ghi nhận T5-148: replay boot d8a11644 CHẠY TỐT (1.545 dòng / 221 installs, xong boot +3m47s — KHÔNG phá kỷ lục +2m56s), postboot PASS poll=2, cờ mới 17:44:24Z → T4-148 đo lại #21 bằng cờ này. T9 không kết luận "xong"/"chưa xong" về replay boot mới 1d610e56 (chưa có dữ kiện — T5-149 sẽ replay).
- Các cờ .done lúc T9 đóng (19:38:20Z): t1, t2, t4, t5, t6, t8 (t7 chưa có — T10 đối chiếu khi gộp).

## 6. Sai số của chính T9 (ghi rõ)

- **F-148-T9-1 — Headroom 554 → 446: dưới ngưỡng lần thứ tám liên tiếp, tỉ lệ/vite ~0,28 lúc đóng (sâu nhất từ trước tới nay).** Không phải sai số đo (2 lần đo mở đợt chênh 0, 2 lần đo đóng phiên chênh 0; T5 đối chiếu độc lập 548/455 trên cùng boot d8a11644 — chênh 6 watch mở đợt, sai số pha lấy mẫu). Ghi rõ: quyết "chỉ theo dõi" (m) đợt 146 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động. Trần 63.747 không đổi trong phiên trên cả hai boot.
- **F-148-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ hai liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-148-T9-3 — Job ffmpeg hevc đầu phiên không rõ chủ (cùng họ F-147-T9-3):** ffmpeg pid 7727 (118,2% tức thời, delta 119 tick/s) encode testsrc2 → `/tmp/round76-d8/hevc-a.mp4` lúc 17:40:34Z. Lần này cmdline đầy đủ (nhờ watcher mới ghi `args`) nên biết rõ nó làm gì, nhưng vẫn không quy được chủ (process nào spawn nó) — ghi rõ là không quy được chủ, không gán cho bất kỳ luồng nào.
- **F-148-T9-4 — T9 KHÔNG phán verdict #21, không phán B4 đúng/sai — chỉ đối chiếu dữ kiện:** T4 đã xuất bản LIMITS nên T9 trích verdict T4 (attempt3 median 60,0 ms → #21 ĐÓNG) + bảng sampler độc lập §2.4. T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối).
- **F-148-T9-5 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-147-T9-5):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành.
- **F-148-T9-6 — Reboot giết sampler/watcher: gap phủ sóng trên boot mới (MỚI):** từ mẫu cuối 19:34:40Z tới lúc T9 đóng 19:38:20Z không có mẫu nào trên boot 1d610e56; cửa sổ guard (nếu mở) trên boot mới không được quan sát. Sampler không tự khởi động lại sau reboot (thiết kế: chạy nền trong phiên, không có systemd unit). Đợt sau nếu reboot lặp lại giữa phiên thì gap tương tự sẽ tái diễn — T9 ghi rõ để parent/T10 quyết có cần cơ chế tự hồi phục không (T9 không tự thêm unit/systemd ngoài brief).
- **F-148-T9-7 — Nghịch lý đồng hồ 8 s quanh reboot (MỚI):** btime boot mới 19:34:32Z sớm hơn 8 s so với mẫu cuối boot cũ 19:34:40Z. T9 không tự chốt giây reboot chính xác; giao T2/T5 phán (cùng họ nghịch lý đồng hồ T2 §2.4 đợt 147). Số tuổi boot d8a11644 (≥7.607 s) là cận dưới theo mẫu cuối, không phải số chốt.
- **F-148-T9-8 — Journal boot cũ không còn sau reboot:** `journalctl --list-boots` trên boot mới chỉ liệt kê 1 boot (1d610e56); journal của d8a11644 không giữ lại nên T9 không kiểm được ENOSPC trên boot cũ sau reboot. Chỉ kiểm được 0 ENOSPC trên boot mới.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 147, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 149 (phần T9)

1. **Cơ chế tự động (a) armed nhưng chưa có lần kích hoạt thật — lần thứ hai liên tiếp** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 149 (lockfile + log theo phiên mới — lockfile đợt 148 nằm trong dir round148-t9 nên không chặn đợt 149; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức.
2. **⚠️ Headroom 554 → 446 — VẪN DƯỚI < ~1.800, lần thứ tám liên tiếp dưới ngưỡng** (quyết parent đợt 146 (m): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,28 lúc đóng — sâu nhất từ trước tới nay.** Bước giảm −114 so với đợt 147; reboot không khôi phục headroom (−108 qua reboot). Trần 63.747 không đổi trong phiên trên cả hai boot (đã dừng flip-flop ở 63.747 bốn lần đo liên tiếp trên ba boot).
3. **Balloon: GHIM TRẦN TRỞ LẠI — 38/115 mẫu trong một chuỗi liên tục 37 phút (18:57:38–19:34:40Z)** sau đợt 147 ghi 0/107; giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146; giao T10 phán chuỗi khi gộp (§2.2 ghi đủ cả ba dữ kiện: frozen tại spot check mở đợt + xả sâu min 2,46M + ghim trần 37 phút tới lúc boot chết).
4. **Reboot giữa phiên (~19:34:40–19:35:25Z, boot mới 1d610e56, btime 19:34:32Z) — giao T2/T5:** chốt giây reboot chính xác (nghịch lý đồng hồ 8 s — F-148-T9-7), số thứ tự reboot, tuổi thọ boot d8a11644 (cận dưới ≥7.607 s), khung chết mới (nếu có). T5-149 replay boot mới.
5. **Lượt yên #21 ĐÃ ĐÓNG (attempt3 median đúng 60,0 ms — sát nút tuyệt đối):** đợt 149 đo #22 (hay #21 lại theo quyết parent — chờ §12.3 đợt 148); cổng tickCost đã kích hoạt live lần đầu ở attempt2.
6. **Khoảng ~6,5 GB "không nằm trong RSS" (T4 §6 đợt 147): T5-148 đã quy = BALLOON** — dữ kiện T9 corroborate (balloon 6,29 GiB); chờ T10 xác nhận khi gộp.
7. Các nợ đứng khác giữ nguyên từ đợt 147 §11 (mù #67 + chứng nhận gap 8.867 s? chờ T2-148; watchdog chưa được thử bằng kẹt thật — đợt thứ bảy liên tiếp (ghi theo T8); G1 khung (a) M2 vẫn hoãn chờ user; R9 (a) vẫn chờ user; ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB vẫn chưa quyết; TTS 39 cấm kiểm lại).

## Phụ lục A — Bảng sampler đầy đủ (boot d8a11644, 115 mẫu, 17:40:34–19:34:40Z)

(File gốc: `hidden_files/round148-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)

Thống kê: samples: 115; mem min: 334880 kB (327.0 MiB); mem max: 3602816 kB (3518.4 MiB = 57.26% guard); mem mean: 1209964 kB (1181.6 MiB); count >=1024 MiB (gate A): 43/115; count >= guard 6144 MiB: 0/115; balloon frozen 6443824: 38/115; balloon min: 2461672 kB; balloon max: 6443824 kB; load1 max: 11.63; load1 >=3.0 samples: 12/115

| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|
| 1 | 2026-11-19T17:40:34Z | 657,976 | 642.6 | 10.46% | 5,788,464 | 725,304 | 3.09 |
| 2 | 2026-11-19T17:41:34Z | 1,120,012 | 1093.8 | 17.80% | 5,002,032 | 695,716 | 4.83 |
| 3 | 2026-11-19T17:42:34Z | 960,508 | 938.0 | 15.27% | 5,139,104 | 705,640 | 5.77 |
| 4 | 2026-11-19T17:43:34Z | 1,194,572 | 1166.6 | 18.99% | 4,789,124 | 697,540 | 10.86 |
| 5 | 2026-11-19T17:44:35Z | 1,330,216 | 1299.0 | 21.14% | 4,262,980 | 690,616 | 11.63 |
| 6 | 2026-11-19T17:45:35Z | 2,554,160 | 2494.3 | 40.60% | 4,076,784 | 694,272 | 5.57 |
| 7 | 2026-11-19T17:46:35Z | 2,162,692 | 2112.0 | 34.38% | 4,358,616 | 696,456 | 2.22 |
| 8 | 2026-11-19T17:47:35Z | 2,405,076 | 2348.7 | 38.23% | 3,855,232 | 694,624 | 2.24 |
| 9 | 2026-11-19T17:48:35Z | 2,802,020 | 2736.3 | 44.54% | 3,684,976 | 697,320 | 1.86 |
| 10 | 2026-11-19T17:49:36Z | 2,644,440 | 2582.5 | 42.03% | 3,158,804 | 696,028 | 6.36 |
| 11 | 2026-11-19T17:50:36Z | 3,341,216 | 3262.9 | 53.11% | 3,319,556 | 709,208 | 6.07 |
| 12 | 2026-11-19T17:51:36Z | 3,021,308 | 2950.5 | 48.02% | 3,666,392 | 710,320 | 5.23 |
| 13 | 2026-11-19T17:52:36Z | 3,146,664 | 3072.9 | 50.01% | 3,625,264 | 707,032 | 4.39 |
| 14 | 2026-11-19T17:53:36Z | 2,776,900 | 2711.8 | 44.14% | 3,953,728 | 705,640 | 2.23 |
| 15 | 2026-11-19T17:54:36Z | 2,617,188 | 2555.8 | 41.60% | 4,055,552 | 700,964 | 1.46 |
| 16 | 2026-11-19T17:55:36Z | 2,769,948 | 2705.0 | 44.03% | 3,956,804 | 713,200 | 1.84 |
| 17 | 2026-11-19T17:56:36Z | 2,825,456 | 2759.2 | 44.91% | 3,977,080 | 715,248 | 1.27 |
| 18 | 2026-11-19T17:57:36Z | 2,531,488 | 2472.2 | 40.24% | 4,275,492 | 717,368 | 1.24 |
| 19 | 2026-11-19T17:58:36Z | 2,254,292 | 2201.5 | 35.83% | 4,547,584 | 718,696 | 0.92 |
| 20 | 2026-11-19T17:59:36Z | 2,013,752 | 1966.6 | 32.01% | 4,794,076 | 722,848 | 0.78 |
| 21 | 2026-11-19T18:00:36Z | 1,336,332 | 1305.0 | 21.24% | 4,680,460 | 727,196 | 3.62 |
| 22 | 2026-11-19T18:01:36Z | 1,510,872 | 1475.5 | 24.01% | 4,849,284 | 726,908 | 3.36 |
| 23 | 2026-11-19T18:02:36Z | 1,342,948 | 1311.5 | 21.35% | 5,032,628 | 727,584 | 1.62 |
| 24 | 2026-11-19T18:03:36Z | 1,091,072 | 1065.5 | 17.34% | 4,755,432 | 719,896 | 1.14 |
| 25 | 2026-11-19T18:04:36Z | 3,602,816 | 3518.4 | 57.27% | 2,461,672 | 722,444 | 1.38 |
| 26 | 2026-11-19T18:05:36Z | 3,236,940 | 3161.1 | 51.45% | 2,711,572 | 728,016 | 1.82 |
| 27 | 2026-11-19T18:06:36Z | 3,383,696 | 3304.4 | 53.78% | 3,081,040 | 728,100 | 1.83 |
| 28 | 2026-11-19T18:07:36Z | 3,206,244 | 3131.1 | 50.96% | 3,439,196 | 731,772 | 1.07 |
| 29 | 2026-11-19T18:08:36Z | 3,261,912 | 3185.5 | 51.85% | 3,511,632 | 731,844 | 1.43 |
| 30 | 2026-11-19T18:09:36Z | 2,161,780 | 2111.1 | 34.36% | 3,789,468 | 732,208 | 2.16 |
| 31 | 2026-11-19T18:10:36Z | 2,393,968 | 2337.9 | 38.05% | 4,040,152 | 732,308 | 1.39 |
| 32 | 2026-11-19T18:11:36Z | 2,307,316 | 2253.2 | 36.67% | 4,314,492 | 732,440 | 0.64 |
| 33 | 2026-11-19T18:12:36Z | 3,036,500 | 2965.3 | 48.26% | 3,632,668 | 732,508 | 1.07 |
| 34 | 2026-11-19T18:13:37Z | 3,130,320 | 3057.0 | 49.76% | 3,683,424 | 733,228 | 0.60 |
| 35 | 2026-11-19T18:14:37Z | 2,817,204 | 2751.2 | 44.78% | 4,013,472 | 733,400 | 0.37 |
| 36 | 2026-11-19T18:15:37Z | 2,508,280 | 2449.5 | 39.87% | 4,311,628 | 735,456 | 0.67 |
| 37 | 2026-11-19T18:16:37Z | 2,184,480 | 2133.3 | 34.72% | 4,584,540 | 735,692 | 0.35 |
| 38 | 2026-11-19T18:17:37Z | 1,992,820 | 1946.1 | 31.68% | 4,830,540 | 735,856 | 0.45 |
| 39 | 2026-11-19T18:18:37Z | 1,749,668 | 1708.7 | 27.81% | 5,050,948 | 736,004 | 0.54 |
| 40 | 2026-11-19T18:19:37Z | 1,543,384 | 1507.2 | 24.53% | 5,250,080 | 736,428 | 0.42 |
| 41 | 2026-11-19T18:20:37Z | 1,402,324 | 1369.5 | 22.29% | 5,432,116 | 739,720 | 0.47 |
| 42 | 2026-11-19T18:21:37Z | 1,254,864 | 1225.5 | 19.95% | 5,603,556 | 734,872 | 0.54 |
| 43 | 2026-11-19T18:22:37Z | 1,105,884 | 1080.0 | 17.58% | 5,757,388 | 731,200 | 0.30 |
| 44 | 2026-11-19T18:23:37Z | 964,188 | 941.6 | 15.33% | 5,897,108 | 730,284 | 0.76 |
| 45 | 2026-11-19T18:24:37Z | 840,420 | 820.7 | 13.36% | 5,417,208 | 616,268 | 2.32 |
| 46 | 2026-11-19T18:25:37Z | 1,032,160 | 1008.0 | 16.41% | 5,550,504 | 618,820 | 1.69 |
| 47 | 2026-11-19T18:26:37Z | 612,720 | 598.4 | 9.74% | 5,650,880 | 612,136 | 2.56 |
| 48 | 2026-11-19T18:27:37Z | 639,724 | 624.7 | 10.17% | 5,738,548 | 615,516 | 2.69 |
| 49 | 2026-11-19T18:28:37Z | 837,956 | 818.3 | 13.32% | 5,510,040 | 752,376 | 2.24 |
| 50 | 2026-11-19T18:29:37Z | 701,476 | 685.0 | 11.15% | 5,622,280 | 753,132 | 2.12 |
| 51 | 2026-11-19T18:30:37Z | 722,336 | 705.4 | 11.48% | 5,729,956 | 756,068 | 1.13 |
| 52 | 2026-11-19T18:31:37Z | 595,132 | 581.2 | 9.46% | 5,832,128 | 755,388 | 0.56 |
| 53 | 2026-11-19T18:32:37Z | 507,596 | 495.7 | 8.07% | 5,916,384 | 751,952 | 0.73 |
| 54 | 2026-11-19T18:33:37Z | 433,704 | 423.5 | 6.89% | 6,000,344 | 730,384 | 0.65 |
| 55 | 2026-11-19T18:34:37Z | 389,804 | 380.7 | 6.20% | 6,065,600 | 716,072 | 0.83 |
| 56 | 2026-11-19T18:35:37Z | 337,304 | 329.4 | 5.36% | 6,132,076 | 685,736 | 0.41 |
| 57 | 2026-11-19T18:36:37Z | 503,496 | 491.7 | 8.00% | 5,892,552 | 663,488 | 0.54 |
| 58 | 2026-11-19T18:37:37Z | 479,728 | 468.5 | 7.63% | 5,976,992 | 659,628 | 0.60 |
| 59 | 2026-11-19T18:38:37Z | 399,196 | 389.8 | 6.35% | 6,054,348 | 661,992 | 0.65 |
| 60 | 2026-11-19T18:39:38Z | 337,400 | 329.5 | 5.36% | 6,125,232 | 659,772 | 0.69 |
| 61 | 2026-11-19T18:40:38Z | 382,384 | 373.4 | 6.08% | 6,103,744 | 647,876 | 0.83 |
| 62 | 2026-11-19T18:41:38Z | 334,880 | 327.0 | 5.32% | 6,166,924 | 638,228 | 0.53 |
| 63 | 2026-11-19T18:42:38Z | 386,228 | 377.2 | 6.14% | 6,080,484 | 622,228 | 0.44 |
| 64 | 2026-11-19T18:43:38Z | 438,440 | 428.2 | 6.97% | 5,945,844 | 592,704 | 0.85 |
| 65 | 2026-11-19T18:44:38Z | 1,687,740 | 1648.2 | 26.83% | 5,271,788 | 608,760 | 1.30 |
| 66 | 2026-11-19T18:45:38Z | 760,952 | 743.1 | 12.10% | 5,418,072 | 611,864 | 1.37 |
| 67 | 2026-11-19T18:46:38Z | 593,560 | 579.6 | 9.43% | 5,531,484 | 611,284 | 1.94 |
| 68 | 2026-11-19T18:47:38Z | 901,232 | 880.1 | 14.32% | 5,357,404 | 602,864 | 2.18 |
| 69 | 2026-11-19T18:48:38Z | 761,876 | 744.0 | 12.11% | 5,373,668 | 607,632 | 2.11 |
| 70 | 2026-11-19T18:49:38Z | 760,284 | 742.5 | 12.08% | 5,496,120 | 612,424 | 1.66 |
| 71 | 2026-11-19T18:50:38Z | 625,328 | 610.7 | 9.94% | 5,620,584 | 617,744 | 0.82 |
| 72 | 2026-11-19T18:51:38Z | 1,200,620 | 1172.5 | 19.08% | 5,762,768 | 623,872 | 0.79 |
| 73 | 2026-11-19T18:52:38Z | 1,024,996 | 1001.0 | 16.29% | 5,903,944 | 624,412 | 0.44 |
| 74 | 2026-11-19T18:53:38Z | 920,796 | 899.2 | 14.64% | 6,032,228 | 624,648 | 0.43 |
| 75 | 2026-11-19T18:54:38Z | 780,364 | 762.1 | 12.40% | 6,150,772 | 622,336 | 0.52 |
| 76 | 2026-11-19T18:55:38Z | 702,140 | 685.7 | 11.16% | 6,259,444 | 623,232 | 0.30 |
| 77 | 2026-11-19T18:56:38Z | 588,084 | 574.3 | 9.35% | 6,357,360 | 624,472 | 0.31 |
| 78 | 2026-11-19T18:57:38Z | 517,308 | 505.2 | 8.22% | 6,443,824 | 627,416 | 0.88 |
| 79 | 2026-11-19T18:58:39Z | 506,648 | 494.8 | 8.05% | 6,443,824 | 625,908 | 0.60 |
| 80 | 2026-11-19T18:59:39Z | 475,876 | 464.7 | 7.56% | 6,443,824 | 625,500 | 0.47 |
| 81 | 2026-11-19T19:00:39Z | 506,348 | 494.5 | 8.05% | 6,443,824 | 633,720 | 0.32 |
| 82 | 2026-11-19T19:01:39Z | 492,028 | 480.5 | 7.82% | 6,443,824 | 638,436 | 0.21 |
| 83 | 2026-11-19T19:02:39Z | 480,056 | 468.8 | 7.63% | 6,443,824 | 639,056 | 0.08 |
| 84 | 2026-11-19T19:03:39Z | 510,644 | 498.7 | 8.12% | 6,443,824 | 639,808 | 0.19 |
| 85 | 2026-11-19T19:04:39Z | 498,352 | 486.7 | 7.92% | 6,443,824 | 639,680 | 0.10 |
| 86 | 2026-11-19T19:05:39Z | 500,012 | 488.3 | 7.95% | 6,443,824 | 639,428 | 0.22 |
| 87 | 2026-11-19T19:06:39Z | 493,348 | 481.8 | 7.84% | 6,443,824 | 639,728 | 0.08 |
| 88 | 2026-11-19T19:07:39Z | 506,900 | 495.0 | 8.06% | 6,443,824 | 639,608 | 0.12 |
| 89 | 2026-11-19T19:08:39Z | 511,580 | 499.6 | 8.13% | 6,443,824 | 639,936 | 0.04 |
| 90 | 2026-11-19T19:09:39Z | 493,696 | 482.1 | 7.85% | 6,443,824 | 639,656 | 0.06 |
| 91 | 2026-11-19T19:10:39Z | 500,156 | 488.4 | 7.95% | 6,443,824 | 642,712 | 0.08 |
| 92 | 2026-11-19T19:11:39Z | 495,252 | 483.6 | 7.87% | 6,443,824 | 642,284 | 0.03 |
| 93 | 2026-11-19T19:12:39Z | 501,932 | 490.2 | 7.98% | 6,443,824 | 642,372 | 0.01 |
| 94 | 2026-11-19T19:13:39Z | 523,836 | 511.6 | 8.33% | 6,443,824 | 641,656 | 0.24 |
| 95 | 2026-11-19T19:14:39Z | 495,896 | 484.3 | 7.88% | 6,443,824 | 641,864 | 0.70 |
| 96 | 2026-11-19T19:15:39Z | 502,480 | 490.7 | 7.99% | 6,443,824 | 641,932 | 0.44 |
| 97 | 2026-11-19T19:16:39Z | 502,320 | 490.5 | 7.98% | 6,443,824 | 643,324 | 0.74 |
| 98 | 2026-11-19T19:17:39Z | 503,328 | 491.5 | 8.00% | 6,443,824 | 642,820 | 0.32 |
| 99 | 2026-11-19T19:18:39Z | 500,476 | 488.7 | 7.95% | 6,443,824 | 643,088 | 0.24 |
| 100 | 2026-11-19T19:19:39Z | 498,148 | 486.5 | 7.92% | 6,443,824 | 642,728 | 0.13 |
| 101 | 2026-11-19T19:20:39Z | 509,628 | 497.7 | 8.10% | 6,443,824 | 642,836 | 0.13 |
| 102 | 2026-11-19T19:21:39Z | 505,844 | 494.0 | 8.04% | 6,443,824 | 642,460 | 0.04 |
| 103 | 2026-11-19T19:22:39Z | 504,004 | 492.2 | 8.01% | 6,443,824 | 642,776 | 0.01 |
| 104 | 2026-11-19T19:23:39Z | 505,912 | 494.1 | 8.04% | 6,443,824 | 642,024 | 0.00 |
| 105 | 2026-11-19T19:24:39Z | 513,816 | 501.8 | 8.17% | 6,443,824 | 642,596 | 0.08 |
| 106 | 2026-11-19T19:25:39Z | 481,040 | 469.8 | 7.65% | 6,443,824 | 643,132 | 0.03 |
| 107 | 2026-11-19T19:26:39Z | 540,212 | 527.6 | 8.59% | 6,443,824 | 643,484 | 0.19 |
| 108 | 2026-11-19T19:27:39Z | 489,784 | 478.3 | 7.78% | 6,443,824 | 643,680 | 0.07 |
| 109 | 2026-11-19T19:28:39Z | 551,192 | 538.3 | 8.76% | 6,443,824 | 704,952 | 0.16 |
| 110 | 2026-11-19T19:29:39Z | 566,772 | 553.5 | 9.01% | 6,443,824 | 749,604 | 0.13 |
| 111 | 2026-11-19T19:30:39Z | 498,564 | 486.9 | 7.92% | 6,443,824 | 749,372 | 0.11 |
| 112 | 2026-11-19T19:31:39Z | 540,140 | 527.5 | 8.59% | 6,443,824 | 749,816 | 0.04 |
| 113 | 2026-11-19T19:32:40Z | 514,692 | 502.6 | 8.18% | 6,443,824 | 749,932 | 0.08 |
| 114 | 2026-11-19T19:33:40Z | 516,356 | 504.3 | 8.21% | 6,443,824 | 749,480 | 0.11 |
| 115 | 2026-11-19T19:34:40Z | 515,488 | 503.4 | 8.19% | 6,443,824 | 749,544 | 0.16 |
