# LIMITS — Phase 9 đợt 149, T9: headroom inotify + RAM + TỰ ĐỘNG HÓA birefnet (0 lần kích hoạt lần thứ ba liên tiếp; REBOOT #39 giữa phiên — sampler khởi động lại; balloon GHIM TRẦN TRỞ LẠI trên boot mới, 49/125 mẫu, 2 chuỗi)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: mở 438/438 (20:41:27Z, boot 70025d3e) → sau reboot #39: 339/339 (21:26:10Z, boot 802f358f) → đóng 331/331 (22:42:09Z, boot 802f358f)** — giảm −107 so với 446 đóng đợt 148; **dưới ngưỡng < ~1.800 lần thứ chín liên tiếp**; tỉ lệ/vite chỉ còn ~0,28 mở đợt, ~0,21 đóng phiên — **sâu nhất từ trước tới nay**. Quyết parent "chỉ theo dõi" (i) đợt 148 vẫn đứng — đợt này T9 chỉ theo dõi, không báo riêng. Xem §1.
- **🔥 REBOOT #39 GIỮA PHIÊN:** boot 70025d3e chết giữa mẫu sampler cuối **21:23:38Z** và btime boot mới **21:23:51Z**; boot mới **802f358f** (btime /proc/stat 1795123431). Sampler + B2 watcher **chết theo reboot**; **T9 KHỞI ĐỘNG LẠI cả hai 21:25:05Z trên boot mới** (khác đợt 148 — sampler chết hẳn) — gap phủ sóng chỉ **87 s** (mất 1 mẫu). Sleep chờ của T9 nhận SIGTERM ~21:24Z — khớp reboot. **Không có nghịch lý đồng hồ trong dữ kiện T9** (btime boot mới muộn hơn 13 s so với mẫu cuối boot cũ). Xem §5.
- **⚠️ PHÁT HIỆN QUAN TRỌNG — T8 phán chuỗi ghim trần "ĐỨT" bằng dữ kiện T9 CŨ:** T8-149 (F-149-T8-7) viết "sampler T9 đối chiếu: 0/61 mẫu (max 6.150.008 kB)" — con số đó là log T9 lúc ~21:41Z (61 mẫu, max đúng bằng max boot 70025d3e), **TRƯỚC khi balloon bắt đầu ghim trần 21:51:06Z**. Dữ kiện đầy đủ phiên T9: **balloon GHIM TRẦN 49/125 mẫu, trong HAI chuỗi liên tục trên boot mới — 21:51:06–22:12:06Z (22 mẫu, 22 phút) + 22:20:07–22:46:07Z (27 mẫu, 27 phút, vẫn ghim lúc đóng)**. T10 PHẢI phán lại chuỗi bằng dữ kiện đầy đủ này; phán "đứt" của T8 là sớm/thiếu dữ kiện. Xem §2.2, F-149-T9-7.
- **RAM:** sampler **125 mẫu, 20:41:35–22:46:07Z, hai boot** (70025d3e: 43 mẫu; 802f358f: 82 mẫu; gap 87 s do reboot): min **469.816 kB (458,8 MiB) lúc 22:22:07Z**, max **2.219.984 kB (2.168,0 MiB = 35,29% guard) lúc 21:05:37Z** (trong cửa sổ attempt3 T4), mean 900.016 kB. Gate A ≥1024 MiB: **40/125 mẫu**. **0/125 mẫu ≥ guard → cơ chế tự động (a) KHÔNG kích hoạt lần nào — lần thứ ba liên tiếp 0 lần thử birefnet.** Xem §2, §3.
- **B2: 26 spike load1 ≥3,0 — TẤT CẢ trên boot 70025d3e, 20:44:05–21:10:53Z, TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN** (phương pháp snapshot tức thời đợt 148 giữ nguyên); đỉnh **11,10 lúc 21:00:18Z** (nr_running 25/655 — cao nhất đợt; trong cửa sổ attempt3 T4). **Sau 21:10:53Z: 0 spike tới hết phiên (~95 phút yên, gồm toàn bộ thời gian trên boot mới — load1 max 2,55).** Driver chính: ffmpeg testsrc2 (chủ vẫn không rõ — họ F-147-T9-3, lần thứ ba liên tiếp) + probe WebKit của T4 + grep quét của T2 (pid 12340, delta tới 64 tick/s) + python3 tmp-u4-old (tới 83 tick/s) + apt replay T5 đầu phiên + blind68-investigate.py của T2 ở đuôi. Xem §2.5.
- **Lượt yên #22 (T4): VẪN MỞ — KHÔNG CÓ LƯỢT HỢP LỆ (hết 3/3 attempt).** A1 partial 4/20, probe exit 3 — đường abort-3-timeout (vá đợt 148) kích hoạt live LẦN ĐẦU ở attempt thật, probe KHÔNG kẹt; A2 20/20 median 138,0 ms; A3 20/20 median 112,0 ms; cả ba đều vi phạm lớp B (B2 max 6,03 / 7,23 / 11,10 — khớp dữ kiện T9). Số cộng dồn giữ 18 lượt hợp lệ. T4-150 đo lại #22. Xem §2.3, §2.4.
- **O8 (T8): DONE 21:17:59Z trên boot 70025d3e — SAU cờ T4 (21:11Z), tuân quyết (j) lần đầu; 21/21 ×2 WebKit + 21/21 Chromium, exit 0.** O8 KHÔNG bị reboot #39 ảnh hưởng (xong trước reboot ~6 phút). Harness WebKit debroot 3/3 PASS trên boot mới 802f358f (21:38:35–21:46:39Z). **Boot chạy O8 = 70025d3e; boot chạy harness debroot = 802f358f** — ghi rõ theo yêu cầu bổ sung của parent. Xem §5.4.
- Import check rembg **KHÔNG làm lại** (đã hoàn thành đợt 147; readiness chỉ kiểm lại bằng sự tồn tại file — xem §3). Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ không mở — xem §3).

## 1. Headroom inotify (probe K8, cap 30.000, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round149-t9/k8-headroom.py` (copy y nguyên từ đợt 148 — cap 30.000 thống nhất): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** trên cả hai boot (70025d3e lúc mở đợt, 802f358f lúc sau reboot và lúc đóng — không đổi).

### 1.2 Số đo đợt 149

| Thời điểm (UTC 19/11) | Headroom | Boot | Bối cảnh |
|---|---|---|---|
| 20:41:27Z | **438** | 70025d3e (btime 20:00:33Z) | lần đo 1, boot ~40'54" tuổi; RAM trước đo 972.244 kB, balloon 5.910.804 kB |
| 20:41:27Z | **438** | 70025d3e | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 969.736 kB, balloon 5.910.804 kB |
| 21:26:10Z | **339** | **802f358f (btime 21:23:51Z)** | lần đo 3 (sau reboot #39, TRÊN BOOT MỚI), boot ~2'19" tuổi; RAM trước đo 1.141.152 kB, balloon 5.282.532 kB |
| 21:26:11Z | **339** | 802f358f | lần đo 4 (chênh **0** so với lần 3); RAM trước đo 1.142.052 kB, balloon 5.282.532 kB |
| 22:42:09Z | **331** | 802f358f | lần đo 5 (đóng phiên, cùng boot 802f358f); RAM trước đo 481.876 kB, balloon 6.443.824 kB (đang ghim trần) |
| 22:42:09Z | **331** | 802f358f | lần đo 6 (chênh **0** so với lần 5); RAM trước đo 480.012 kB, balloon 6.443.824 kB |

- Probe dừng ở `i=438` cả hai lần mở đợt, `i=339` cả hai lần sau reboot, `i=331` cả hai lần đóng phiên, errno=28 — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn — kiểm tra 0 thư mục sót sau lần 2, 4 và 6).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 438 = **63.309 watch** lúc mở; 63.747 − 339 = **63.408 watch** sau reboot (+99 qua reboot — reboot KHÔNG nhả watch ngoài cell, còn tăng thêm); 63.747 − 331 = **63.416 watch** lúc đóng (+8 nữa trong phiên trên boot mới; **+107 cả đợt**).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch): 438 / 1.578 ≈ **0,28** mở đợt; 339 / 1.578 ≈ **0,21** sau reboot; 331 / 1.578 ≈ **0,21** đóng phiên — **sâu nhất từ trước tới nay** (đợt 148: 0,28 lúc đóng).
- Đối chiếu độc lập (T5-149 §1/§2.1, boot 802f358f): **headroom 336 lúc boot 1m41s tuổi** — T9 đo 339 lúc boot ~2m19s tuổi (21:26:10Z), chênh 3 watch — sai số pha lấy mẫu, khớp.
- Lưu ý: RAM trước đo lần 3 (1.141.152 kB) cao hơn nhiều so với lần 5 (481.876 kB) trong khi headroom chỉ giảm 339 → 331. Headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước) — reboot cũng không khôi phục headroom, còn làm giảm thêm.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–148 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| 148 | 554 → 446 | mở 17:40:27Z boot d8a11644 btime 17:27:53Z → đóng 19:36:35Z boot MỚI 1d610e56 btime 19:34:32Z (reboot giữa phiên) |
| **149** | **438 → 339 → 331** | **mở 20:41:27Z boot 70025d3e btime 20:00:33Z → sau reboot #39 21:26:10Z boot MỚI 802f358f btime 21:23:51Z → đóng 22:42:09Z cùng boot 802f358f** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880 → 668 → 554 → 446 → 438 → 339 → 331**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — và reboot không khôi phục, còn làm giảm thêm.** Từ đỉnh chuỗi 4.438 xuống 331 = **−4.107 (−92,5%)**. Bước giảm đợt này: −8 so với đóng đợt 148 (446 → 438) ở đầu phiên; thêm −99 qua reboot #39; thêm −8 trong phiên trên boot mới.
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 331, thấp hơn ngưỡng 1.469, lần thứ chín liên tiếp.** Quyết parent đợt 148 (i): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite 0,21 lúc đóng — sâu nhất từ trước tới nay.** Headroom chỉ còn ~21% nhu cầu một vite đầy đủ (~1.578 watch). Đây là diễn biến đáng ghi cho parent/T10, nhưng quyết "chỉ theo dõi" vẫn đứng (brief đợt này + quyết parent đợt 148 (i)); T9 không tự nâng mức báo hay yêu cầu user hành động.
- **Trần 63.747 KHÔNG ĐỔI trong phiên** (đọc lúc mở đợt 20:41:20Z, lúc đo probe 20:41:27Z, lúc sau reboot 21:26:10Z và lúc đóng 22:42:09Z — cùng giá trị trên cả hai boot; T5-149 cũng ghi trần 63.747 không đổi). Trần 63.747 vẫn đầy ở mức ~63,4k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler 125 mẫu, 20:41:35–22:46:07Z, hai boot

### 2.1 Hình dạng cửa sổ: boot 1 leo đầu phiên rồi rơi; boot 2 trũng sâu + balloon ghim trần

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **125 mẫu, 20:41:35–22:46:07Z, hai boot — gap duy nhất 87 s do reboot #39 (mẫu cuối boot 1: 21:23:38Z; mẫu đầu boot 2: 21:25:05Z).** Tổng quan: **min 469.816 kB (458,8 MiB) lúc 22:22:07Z (boot 2); max 2.219.984 kB (2.168,0 MiB) lúc 21:05:37Z (boot 1, trong cửa sổ attempt3 T4) — 35,29% guard; mean 900.016 kB (879,0 MiB).**

**Boot 70025d3e (43 mẫu, 20:41:35–21:23:38Z):**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 20:41:35Z | 1.004.160 kB (980,6 MiB) | mẫu đầu (balloon 5.910.804 kB — đang phình; load1 1,09) |
| 20:42:35–20:43:35Z | 891.044 → 737.760 kB | balloon phình 6.037.116 → 6.150.008 kB (max boot 1, 95,4% trần) |
| 20:44:35–20:58:36Z | 816.724–1.873.772 kB | dao động răng cưa; balloon xả sâu tới min **3.961.308 kB lúc 20:59:36Z** |
| 21:05:37Z | **2.219.984 kB — MAX phiên (35,29% guard)** | balloon 4.199.924 kB; load1 0,44 — trong cửa sổ attempt3 T4 |
| 21:06:37–21:10:37Z | 1.977.624 → 1.397.624 kB | load1 3,90–7,94 (cụm spike sau attempt3, xem §2.5) |
| 21:20:37–21:23:38Z | 817.080 → **619.064 kB (min boot 1)** | balloon phình lại 5.352.236 → 5.559.124 kB; mẫu cuối trước reboot |

- **30/43 mẫu ≥1024 MiB** (gate A); **0 mẫu ≥ guard**; load1 max 10,54 (sampler) lúc 21:00:36Z; **15/43 mẫu load1 ≥3,0** (tất cả trong 20:48–21:10Z — cửa sổ attempt T4 + cụm sau attempt3).
- Swap: SwapFree 785.252 kB (mẫu đầu) → 607.252 kB (mẫu cuối); dao động 607–785k.

**Boot 802f358f (82 mẫu, 21:25:05–22:46:07Z):**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 21:25:05Z | 1.675.720 kB (1.636,4 MiB) | mẫu đầu boot 2 — **MAX boot 2 (26,63% guard)**; balloon 5.084.744 kB; load1 2,55 |
| 21:25:05–21:50:06Z | 624.600–1.675.720 kB | balloon leo răng cưa 4.934.728 → 6.392.636 kB; RAM rơi dần |
| 21:51:06–22:12:06Z | 469.816–~700.000 kB | **balloon GHIM TRẦN 6.443.824 kB — chuỗi ghim 1 (22 mẫu, 22 phút)** |
| 22:13:06–22:19:07Z | ~500.000–825.844 kB | balloon xả khỏi trần (min 6.042.864 kB lúc 22:14:06Z) rồi phình lại |
| 22:20:07–22:46:07Z | 469.816–~520.000 kB | **balloon GHIM TRẦN — chuỗi ghim 2 (27 mẫu, 27 phút, vẫn ghim lúc sampler dừng)** |
| 22:46:07Z | 490.580 kB | mẫu cuối (balloon 6.443.824 kB — đang ghim); T9 dừng sampler lúc đóng |

- **10/82 mẫu ≥1024 MiB** (gate A, tất cả trong 21:25–21:38Z đầu boot 2); **0 mẫu ≥ guard**; load1 max **2,55** lúc 21:25:05Z; **0/82 mẫu load1 ≥3,0** — toàn bộ boot 2 yên về tải (dù T8 chạy harness debroot 21:38–21:46Z — không spike nào ≥3,0).
- Swap: SwapFree 1.025.940 kB (mẫu đầu boot 2) → 743.584 kB (mẫu cuối); dao động 626–1.026k.
- Đối chiếu T5-149 (sampler riêng n=40, boot 70025d3e): max **37,2% guard**, 0 mẫu ≥ guard, gate A 28/40 — **khớp với T9 (35,29%, 30/43)** trong sai số pha lấy mẫu (T5 max cao hơn ~1,9 điểm phần trăm — T5 bắt được đỉnh giữa hai mẫu T9).

### 2.2 Balloon virtio — boot 1 xả sâu không ghim; boot 2 GHIM TRẦN 2 chuỗi (49/125 mẫu)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**.
- **Boot 70025d3e: 0/43 mẫu ghim trần.** Lúc T9 kiểm mở đợt 20:41:20Z: balloon 5.910.804 kB — **KHÔNG ghim** (khác đợt 148: frozen tại spot check mở đợt). Phình tới max **6.150.008 kB lúc 20:43:35Z (95,4% trần)** rồi xả sâu tới min **3.961.308 kB lúc 20:59:36Z**, phình lại tới 5.559.124 kB lúc mẫu cuối 21:23:38Z.
- **Boot 802f358f: 49/82 mẫu ghim trần 6.443.824 kB, trong HAI chuỗi liên tục:**
  - **Chuỗi 1: 21:51:06–22:12:06Z, 22 mẫu, 22 phút** (span 1.320 s). Trước chuỗi: balloon leo 6.295.152 (21:49:06Z) → 6.392.636 (21:50:06Z) → chạm trần 21:51:06Z.
  - **Khoảng xả giữa hai chuỗi: 22:13:06–22:19:07Z (~8 phút, 7 mẫu không ghim)** — balloon xả tới min 6.042.864 kB lúc 22:14:06Z rồi phình lại 6.154.392 → 6.255.512 kB.
  - **Chuỗi 2: 22:20:07–22:46:07Z, 27 mẫu, 27 phút (span 1.620 s), VẪN GHIM lúc sampler dừng** — đầu chuỗi chạm trần 22:20:07Z; mẫu cuối 22:46:07Z vẫn 6.443.824 kB. Độ dài thật của chuỗi 2 KHÔNG quan sát được tới cuối (sampler dừng lúc T9 đóng; T10 ghi rõ "≥27 phút, chưa biết điểm kết thúc").
- **Tổng ghim trần đợt này: 49/125 mẫu (39,2%) — tất cả trên boot 2.** So với đợt 148: 38/115 mẫu trong MỘT chuỗi 37 phút tới lúc boot chết.
- **⚠️ ĐÍNH CHÍNH PHÁN T8 (F-149-T9-7 — quan trọng nhất đợt này ở phía T9):** T8-149 (F-149-T8-7) phán "Chuỗi ghim trần balloon: ĐỨT — sampler T9 đối chiếu: 0/61 mẫu (max 6.150.008 kB = 95,4%)". Con số 0/61 + max 6.150.008 kB là **đúng với log T9 lúc ~21:41Z** (61 mẫu, max đúng bằng max boot 70025d3e) — nhưng T8 đóng cờ ~21:52Z, **chỉ ~1 phút sau khi chuỗi ghim 1 bắt đầu (21:51:06Z)**; phán "đứt" được viết trên dữ kiện cắt tại ~21:41Z, thiếu toàn bộ 49 mẫu ghim trần sau đó (21:51–22:46Z). **T9 không phán chuỗi nối hay đứt** — nhưng dữ kiện đầy đủ để T10 phán lại: (a) boot 1: 0/43 ghim (max 95,4% trần); (b) boot 2: 49/82 ghim trong 2 chuỗi (22 + 27 phút) cách nhau ~8 phút xả; (c) chuỗi ghim 1 bắt đầu 27 phút sau khi boot 2 lên (21:23:51Z → 21:51:06Z), KHÔNG nối liền với chuỗi 37 phút đợt 148 (chuỗi đó chết cùng boot d8a11644 lúc ~19:34Z, cách đó hơn 2 giờ + 1 reboot #38 + 1 reboot #39). Giao T10 phán: chuỗi mới (= 1, đợt 148) có nối sang đợt 149 thành (= 2) hay dừng ở 1 — và ghi rõ phán của T8 dựa trên dữ kiện cắt sớm.
- **Khoảng ~6,5 GB "không nằm trong RSS": đã đóng nợ đợt 148 (quy = balloon, quyết parent (j)).** Dữ kiện đợt này corroborate tiếp: balloon 6.443.824 kB = **6,29 GiB** khi ghim; RAM khả dụng lúc ghim chỉ ~470–520.000 kB trong khi tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB.
- Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146 — T9 không đề xuất đổi ngưỡng.
- Số học lúc cuối cửa sổ 22:46:07Z: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 490.580 kB.

### 2.3 Lượt yên WebKit #22 (T4, đợt 149) — #22 VẪN MỞ (T4 đã xuất bản LIMITS)

- **T4-149 ĐÃ xuất bản LIMITS** (`docs/PHASE9_ROUND149_T4_WEBKIT_QUIET22_LIMITS.md`) — T9 trích verdict T4 + đối chiếu bằng dữ kiện sampler độc lập, không phán lại.
- **Verdict T4: #22 VẪN MỞ — KHÔNG CÓ LƯỢT HỢP LỆ (hết ngân sách 3/3 attempt; poller thoát exit 11 lúc 21:05:11Z).** Attempt1 (20:48:19–20:52:35Z): partial 4/20, probe exit 3 (pass-timeout) — pass 5 kẹt rAF/renderer 120 s wall-clock ngay sau FLIP; writePartial cả 3 fetch timeout 30 s → **đường abort-3-timeout (vá đợt 148) kích hoạt live LẦN ĐẦU ở attempt thật**: partial JSON 4/20 giữ nguyên, probe thoát 3, KHÔNG kẹt. Lớp B VI PHẠM (B1 load5 cuối 3,31; B2 load1 max 6,03). Attempt2 (20:52:45–20:58:51Z): 20/20 pass, median **138,0 ms** (n=305) — lớp B VI PHẠM (B1 load5 cuối 2,72; B2 load1 max 7,23). Attempt3 (20:59:01–21:05:11Z): 20/20 pass, median **112,0 ms** (n=327) — lớp B VI PHẠM (B1 load5 cuối 4,73; B2 load1 max **11,10 — nặng nhất đợt**). Median tái tính độc lập khớp analyzer (A1 partial 47,0; A2 138,0; A3 112,0). **Số cộng dồn (c2) VẪN 18 lượt hợp lệ, không đổi** (P1 52/52, P2 43/43, P3-A1 47/52, P3' 24/24, P7 38/38).
- **Chạy lại:** T4-149 chạy lại sau khi T4 trước chết giữa chừng (exec lỗi output_drain_timeout); vòng poll-wait cũ (PID 3248 + waiter 3376) vẫn chạy và được dùng chung. Cửa chỉ canh attempt1: vòng retry chạy attempt2/3 ngay sau attempt trước (sleep 10 s, KHÔNG poll lại gate) — lúc start attempt2 load1 đã 5,91; attempt3 load1 6,74 — cả hai khởi động trong tải nặng (F-149-T4-3 — điểm yếu thiết kế đứng, đợt này phơi ra; dữ kiện T9 §2.4 corroborate).
- **Số cộng dồn lượt yên hợp lệ: #22 không đóng — T4-150 đo lại #22** (cùng cổng tickCost ≤60 ms + probe đã vá). T9 không tự cộng dồn (giao T10 xác nhận số cuối).
- Probe kẹt F-147-T4-1: không tái diễn kiểu cũ (abort-3-timeout đã cứu attempt1 khỏi kẹt — xem F-149-T9-4).

### 2.4 Dữ kiện sampler T9 trong cửa sổ attempt của T4 (độc lập, cadence 60 s)

Cửa sổ theo giờ probe-start/poller của T4 (xem LIMITS T4 §0); mẫu sampler là cadence 60 s trong cửa sổ.

| Attempt | Cửa sổ (UTC) | Boot | load1 (T9 sampler) | RAM (T9) | Ghi chú |
|---|---|---|---|---|---|
| 1 | 20:48:19–20:52:35Z | 70025d3e | 1,47 / 0,79 / 6,03 / 5,09 / 5,64 | 1.150,5 → 1.829,9 MiB | 5 mẫu; **mẫu 6,03 lúc 20:51:36Z = đúng B2 max 6,03 của T4** — khớp verdict T4; spike watcher 20:50:14Z (5,53) + 20:50:50Z (4,98) + 20:51:25Z (5,49) trong cửa sổ |
| 2 | 20:52:45–20:58:51Z | 70025d3e | 5,64 / 6,35 / 4,20 / 2,23 / 1,40 / 0,98 / 5,42 | 841,3–1.829,9 MiB | 7 mẫu; watcher spike 20:52:36Z (5,64) + 20:53:11Z (7,07) + 20:53:47Z (6,89) + 20:54:24Z (5,31) trong cửa sổ; **T4 B2 max 7,23 — watcher T9 bắt 7,07, chênh 0,16 (pha lấy mẫu)** |
| 3 | 20:59:01–21:05:11Z | 70025d3e | 9,27 / 10,54 / 7,80 / 4,78 / 2,17 / 0,94 | 1.365,6–1.707,5 MiB | 6 mẫu; **đỉnh RAM phiên 2.219.984 kB lúc 21:05:37Z nằm ngay sau cửa sổ attempt3** (mẫu sampler 21:05:37Z, 26 s sau poller 21:05:11Z); watcher spike 20:59:06Z (7,16) + 20:59:42Z (9,33) + 21:00:18Z (**11,10 — đúng B2 max 11,10 của T4**) + 21:00:54Z (10,20) + 21:01:30Z (8,13) + 21:02:06Z (6,11) + 21:02:41Z (4,40) trong cửa sổ |

- T9 KHÔNG phán B4 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu. Dữ kiện T9 corroborate cả ba phán B2 của T4: A1 max 6,03 (sampler bắt đúng), A2 max ~7,1–7,2 (watcher 7,07 vs T4 7,23), A3 max 11,10 (watcher bắt đúng).
- **Caveat cửa sổ attempt (F-149-T4-3, corroborate bởi T9):** attempt2/3 khởi động trong tải nặng — sampler T9 ghi load1 lúc start A2 ~5,64–6,35 và lúc start A3 ~9,27–10,54; cả hai attempt đều chạy trọn trong tải ≥4 (xem §2.5). Đây là nguyên nhân trực tiếp khiến median tickCost vọt 138,0 / 112,0 ms (so với ngưỡng 60 ms).

### 2.5 B2 — tải tự sinh của stack đo: 26 spike, TẤT CẢ ĐÃ QUY ĐƯỢC NGUỒN (toàn bộ trên boot 70025d3e)

Watcher giữ nguyên phương pháp đợt 148 (snapshot tức thời `top -b -n1` + delta `/proc/<pid>/stat` 1 s + nr_running + D-state). **26 spike, tất cả trong 20:44:05–21:10:53Z trên boot 70025d3e; 0 spike trên boot 802f358f (~95 phút yên cuối phiên, gồm cả lúc T8 chạy harness debroot).**

| Cụm | Thời điểm (UTC) | load1 | Process gây tải (top tức thời + delta tick) | Kết luận |
|---|---|---|---|---|
| 0 — trước A1 (2 spike) | 20:44:05Z + 20:45:09Z | 3,01 / 3,10 | apt-get 60,0% tức thời, delta 13 tick/s (20:44:05Z); 20:45:09Z top gần như idle, nr_running 1/464 | **T5 apt replay** (dpkg_lines 2 → 480 → 1265 theo poller T4) + đuôi loadavg sau burst apt |
| 1 — cửa sổ A1 + đuôi (8 spike) | 20:50:14Z → 20:54:24Z | 5,53 / 4,98 / 5,49 / 4,05 / 5,64 / 7,07 / 6,89 / 5,31 | ffmpeg testsrc2 66,7–120,0% tức thời, delta 84–133 tick/s (20:50:14Z, 20:52:36Z, 20:53:11Z, 20:53:47Z); WebKitWebProcess delta 17–43 tick/s (20:53:11Z, 20:53:47Z, 20:54:24Z); grep pid 12340 (`grep -rln DEAD detected by status /home/...`) delta 6–64 tick/s, top 10–36% | **ffmpeg testsrc2 (chủ không rõ — họ F-147-T9-3) + probe WebKit attempt1/2 của T4 + grep quét của T2** |
| 2 — đuôi A2 + A3 (8 spike) | 20:58:30Z → 21:02:41Z | 5,02 / 7,16 / 9,33 / **11,10** / 10,20 / 8,13 / 6,11 / 4,40 | ffmpeg testsrc2 63,6–100,0%, delta 67–95 tick/s; python3 tmp-u4-old delta 20–83 tick/s (đỉnh 83t lúc 21:02:06Z); WebKitWebProcess 25–63,6% + MiniBrowser 17,6–18,8% (21:00:18Z, 21:00:54Z, 21:01:30Z); node 19–50 tick/s; **nr_running 25/655 lúc 21:00:18Z — cao nhất đợt** | **Chồng nhau nặng nhất đợt: probe attempt3 T4 (WebKit/MiniBrowser) + ffmpeg testsrc2 + python3 U4 + grep T2** — đỉnh 11,10 = B2 max của T4 ở A3 |
| 3 — sau A3 (8 spike) | 21:06:46Z → 21:10:53Z | 4,59 / 7,06 / 9,40 / 8,07 / 6,93 / 5,08 / 3,97 / 3,20 | ffmpeg testsrc2 ĐƠN ĐỘC: 2 ffmpeg song song 72,7% + 54,5% (21:06:46Z); delta 109–141 tick/s (đỉnh **141t lúc 21:09:07Z — delta lớn nhất đợt**); đuôi: python3 blind68-investigate.py delta 9–18 tick/s (21:09:43Z, 21:10:18Z, 21:10:53Z); `npm test` xuất hiện trong delta list (0t, không nóng) | **ffmpeg testsrc2 (sau A3, không còn probe T4) + đuôi blind68-investigate.py của T2** — cụm này chứng minh tải nặng tồn tại độc lập với attempt T4 |

- **Sau 21:10:53Z: 0 spike tới hết sampler (22:46:07Z)** — ~95 phút yên dù sampler/watcher vẫn chạy suốt và T8 còn chạy harness debroot (21:38–21:46Z) + T5 repair (22:31–22:35Z). Stack đo (vài lệnh grep/ps mỗi phút) không sinh tải đo được; harness debroot + repair cũng không đẩy load1 ≥3,0.
- **Phân biệt rõ (không nhầm với caveat F-144-T9-7):** grep pid 12340 (`grep -rln DEAD detected by status`) là process quét dài hạn của T2 (RSS ~166 MB, TIME tích lũy tới 2:54+), KHÔNG phải grep của chính watcher T9. Watcher đợt này không tự lọt top snapshot (khác đợt 148: ps 100% trong 1 snapshot).
- **Caveat phương pháp (giữ nguyên):** pid nào chết giữa chừng trong vòng delta 1 s thì mất dòng delta (vd spike 20:44:05Z chỉ còn 3 dòng delta); `top -b -n1` trong cùng snapshot vẫn bắt được process đó nên không mất attribution. **Kết luận phương pháp (F-147-T9-6 vẫn đóng):** snapshot tức thời + delta tick + nr_running đã quy được 26/26 spike đợt này, kể cả spike đuôi loadavg (phân biệt bằng top idle + nr_running thấp, vd 20:45:09Z nr_running 1/464).

### 2.6 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt (sampler T9) | Cuối lượt |
|---|---|---|---|
| 148 | ~0,61 GB (T9 đo trực tiếp 621.828 kB lúc 17:40:27Z; mẫu sampler đầu 657.976 kB lúc 17:40:34Z) | 327–3.518 MiB (boot duy nhất d8a11644, 115 mẫu, 17:40:34–19:34:40Z); leo đầu phiên, đỉnh giữa phiên trong cửa sổ attempt2 T4 (18:04:36Z), rồi rơi về vùng trũng + balloon ghim trần 37 phút; REBOOT sau mẫu cuối — sampler chết theo reboot, KHÔNG có mẫu nào trên boot mới (sampler dài của T9, ~114 phút) | 503,4 MiB lúc 19:34:40Z (mẫu cuối trên boot cũ); RAM trên boot mới 1.916.380 kB lúc 19:36:35Z (balloon 4.972.736 kB) |
| **149** | **~0,95 GB (T9 đo trực tiếp 972.244 kB lúc 20:41:27Z; mẫu sampler đầu 1.004.160 kB lúc 20:41:35Z)** | **458,8–2.168,0 MiB (HAI boot, 125 mẫu, 20:41:35–22:46:07Z); boot 1 leo đầu phiên, đỉnh trong cửa sổ attempt3 T4 (21:05:37Z), rồi rơi; REBOOT #39 giữa phiên — sampler KHỞI ĐỘNG LẠI trên boot mới (gap 87 s); boot 2 trũng sâu + balloon ghim trần 2 chuỗi (22 + 27 phút); load1 ≥3,0 chỉ trên boot 1 (sampler dài của T9, ~124 phút)** | **490,6 MiB lúc 22:46:07Z (mẫu cuối, balloon đang ghim 6.443.824 kB)** |

(Các đợt 124–147 xem LIMITS T9 đợt 148 §2.6 — không chép lại để file khỏi phình; dòng đợt 148 chép lại làm neo nối tiếp.)

## 3. Guard birefnet — TỰ ĐỘNG HÓA (a) ARMED CẢ PHIÊN; CỬA SỔ KHÔNG MỞ; 0 LẦN THỬ (lần thứ ba liên tiếp)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 146 (l) DUYỆT tự động hóa phương án (a), giao T9-147; đợt 148/149 giữ nguyên): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD KHÔNG MỞ trong phiên này:** đỉnh RAM sampler **2.219.984 kB = 2.168,0 MiB = 35,29% guard lúc 21:05:37Z** — xa guard 4.071.472 kB. Đối chiếu T5-149 (sampler riêng n=40, boot 70025d3e): max 37,2% guard, 0 mẫu ≥ guard — **khớp với T9** (chênh ~1,9 điểm phần trăm — pha lấy mẫu).
- **Birefnet: 0 LẦN THỬ đợt này — lần thứ ba liên tiếp (147, 148, 149).** Cơ chế tự động armed cả phiên (sampler `round149-t9/sampler.sh`, pid 2958 trên boot 1 rồi pid 3055 trên boot 2 sau khi khởi động lại — xem §5) nhưng không có mẫu nào ≥ guard để kích hoạt (đúng thiết kế — không có false positive). Birefnet vẫn **0 lần chạy thành công** trong gói. Chuỗi đỉnh các đợt 136→149 (theo sampler T9, MB thập phân): 6.081, 2.123, 6.087, 2.607, 2.242, 2.860, 2.992, 2.778, 2.947, 3.863, **6.752**, 2.573, 3.603, **2.220**.
- **Bằng chứng cơ chế armed (không phải chết lặng):** sampler sống suốt 20:41:35–21:23:38Z (boot 1, 43 mẫu đều đặn) + 21:25:05–22:46:07Z (boot 2, 82 mẫu đều đặn — sau khi T9 khởi động lại); `guard-open.flag`, `birefnet-trigger.log`, `birefnet-trigger.lock`, `birefnet-fired.flag`, `birefnet-run.log` đều **KHÔNG tồn tại** lúc đóng — đúng trạng thái khi 0 mẫu ≥ guard (cơ chế chỉ ghi file khi có mẫu chạm guard). Lockfile đợt 148 nằm trong dir round148-t9 nên không chặn đợt này (dir mới round149-t9, lock riêng — đúng thiết kế). Thư mục output `~/workspace/tmp-t9-149-birefnet/` đã tạo sẵn, **trống** lúc đóng.
- **Sẵn sàng thử (kiểm lại bằng sự tồn tại file đợt này — import KHÔNG làm lại theo brief, đã xác minh đợt 147):** venv `server/bgremove/.venv/bin/python` (symlink → /usr/bin/python3.12) + `bgremove.py` (23.500 byte, có `ram_guard_decision` + `--min-ram-mb`) tồn tại; model `~/.u2net/birefnet-general.onnx` 972.666.916 byte + `u2net.onnx` 175.997.641 byte có sẵn; clip `~/workspace/tmp-p7-ramguard/clip05.mp4` (14.554 byte) có sẵn; lệnh thử đã nối vào sampler (output `~/workspace/tmp-t9-149-birefnet/out-birefnet-149.mov`). Guard nội bộ bgremove.py `--min-ram-mb` 6144 (fallback u2net nếu RAM tụt — một lần chạy fallback như vậy KHÔNG tính là lần thử birefnet).
- **Đánh giá cơ chế (giữ nguyên từ đợt 147/148):** độ trễ phát hiện ≤60 s (cadence lấy mẫu); cửa sổ đợt 146 dài tối thiểu 2 phút, tối đa <4 phút nên cơ chế bắt được nếu cửa sổ mở lại. Điểm yếu còn lại: (a) vượt guard ngắn hơn 60 s giữa hai mẫu thì không thấy (F-149-T9-5); (b) lần FIRE thật đầu tiên chưa được kiểm chứng end-to-end (F-149-T9-2 — dry-run đợt 147 chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật); (c) nếu cửa sổ mở đúng lúc T4 đang attempt, lệnh birefnet sẽ gây tải CPU/RAM trong cửa sổ đo của T4 — sampler chỉ GHI trạng thái T4 lúc kích hoạt, không hoãn lệnh (theo quyết (l); T10 phán ô nhiễm nếu xảy ra). **Điểm yếu (d) đợt 148 (reboot giết sampler — gap phủ sóng) ĐÃ ĐƯỢC GIẢM đợt này: T9 khởi động lại sampler/watcher bằng tay trên boot mới (gap chỉ 87 s) — nhưng đây là can thiệp tay, chưa phải cơ chế tự hồi phục (F-149-T9-6).**
- Phương án (b) (chu kỳ kiểm ≤60 s) **không cần dùng** — (a) đã armed kịp trong phiên (kể cả sau khi khởi động lại trên boot mới).

## 4. ENOSPC / vite watch

- **Journal trên boot mới 802f358f: 0 dòng "No space left" / ENOSPC** (kiểm tra 22:42Z, `journalctl -b -0 --grep` — "No entries"). Journal chỉ liệt kê **1 boot** (`journalctl --list-boots`: chỉ 802f358f, first entry 21:24:02Z) — journald không giữ lại journal của boot 70025d3e (volatile), nên **không kiểm được ENOSPC trên boot cũ sau reboot** — ghi rõ giới hạn này (T5/T6 có nguồn khác thì đối chiếu).
- Steal CPU: **không đo được trên boot cũ sau reboot** (`/proc/stat` đã reset theo boot mới) — ghi rõ, không bịa số.
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=438, i=438, i=339, i=339, i=331, i=331) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 331 chỉ còn ~0,21 vite — **sâu nhất từ trước tới nay dưới 1 vite đầy đủ**, xem §1.2).

## 5. Boot — quan sát thô cho T5/T6/T2/T7 (không thuộc verdict T9)

### 5.1 Reboot #38 (trước phiên) + reboot #39 (giữa phiên)

- **Boot lúc mở đợt 149 = 70025d3e** (btime **20:00:33Z** — `uptime -s` 20:00:33 + `/proc/stat` btime 1795118433 KHỚP nhau; T5-149 cũng ghi btime này; /proc/1 20:00:43Z, offset ~10 s). Reboot #38 xảy ra TRƯỚC khi đợt 149 mở (20:35:51Z), trong lúc T10-148 đóng sổ (T1-149 kiểm lại claim đóng sổ 148 — T9 không phán).
- **🔥 REBOOT #39 trong phiên T9:** boot **802f358f-0f12-4824-8eb9-419f0ccd67ec**, btime **21:23:51Z** (epoch 1795123431 — `uptime -s` 21:23:51 + `/proc/stat` btime KHỚP nhau; /proc/1 21:24:01Z, offset 10 s theo T5-149). Reboot xảy ra giữa mẫu sampler cuối trên boot cũ **21:23:38Z** và mẫu đầu trên boot mới **21:25:05Z**.
- **Không có nghịch lý đồng hồ trong dữ kiện T9:** btime boot mới 21:23:51Z MUỘN HƠN 13 s so với mẫu cuối boot cũ 21:23:38Z — thứ tự thời gian nhất quán (khác đợt 148: btime boot mới sớm hơn 8 s so với mẫu cuối). **Ghi rõ:** T8-149 ghi sampler run 1 của T8 có mẫu đóng dấu 21:24:05Z — muộn hơn btime boot mới 14 s (cùng họ nghịch lý đồng hồ) — đó là dữ kiện của T8, T9 chỉ ghi lại để T2/T7 đối chiếu, không phán.
- **Tuổi thọ boot 70025d3e:** btime 20:00:33Z → btime boot mới 21:23:51Z = **4.998 s = 1h23m18s** (stat→stat, theo T5-149); cận dưới theo mẫu cuối T9: ≥4.985 s (20:00:33Z → 21:23:38Z). T7/T2 đối chiếu mốc neo khi gộp.
- **Hậu quả trực tiếp cho T9:** sampler pid 2958 + B2 watcher pid 2959 **chết theo reboot** (không phải T9 kill). Lệnh `sleep 1500` chờ checkpoint của T9 nhận **SIGTERM ~21:24Z** — khớp thời điểm reboot. **T9 KHỞI ĐỘNG LẠI sampler + watcher bằng tay 21:25:05Z trên boot mới (pid 3055/3056)** — gap phủ sóng chỉ **87 s** (mất 1 mẫu ~21:24:38Z). Khác đợt 148 (sampler chết hẳn, gap tới lúc T9 đóng). Quyết định khởi động lại là của T9 trong phiên để giữ phủ sóng cho câu hỏi chuỗi ghim trần + guard birefnet; T9 ghi rõ để parent/T10 biết đây là can thiệp tay, chưa phải cơ chế tự hồi phục (xem F-149-T9-6).
- **Boot 802f358f lúc T9 đóng:** còn sống, btime 21:23:51Z, tuổi ~1h23m lúc 22:46:07Z. T5-149: replay boot 2 KHÔNG tới trong 60' (watcher timeout 22:28:01Z) → --repair 1 lần 22:31:03–22:35:23Z (GST symlink → debroot + cài đủ 11 gói, re-check toàn PASS); cờ mới POSTBOOT_PASS 22:35:39Z poll=1. T9 không kết luận về replay (T5 là chủ quản).
- Các cờ .done lúc T9 đóng (22:46Z): t0, t1, t2, t4, t5, t6, t7, t8 (8/8 — chỉ còn T9).

### 5.2 O8 + harness (T8) — boot attribution theo yêu cầu bổ sung của parent

- **O8 chính: chạy trên boot 70025d3e, DONE 21:17:59Z — TRƯỚC reboot #39 ~6 phút, KHÔNG bị ảnh hưởng.** Driver start 21:15:27Z (sau cờ T4 21:11Z — tuân quyết (j) lần đầu); WebKit attempt1 exit 0 lúc 21:16:18Z, attempt2 exit 0 lúc 21:17:07Z (cả hai ghi boot 70025d3e); **Chromium 21/21 + WebKit 21/21, exit 0**; lock vite đã nhả 21:17:59Z. Chuỗi WebKit FULL PASS 6 → 7 (chờ T10 xác nhận độc lập).
- **Harness lần 2 trên boot mới 802f358f: WebKit 0/3 — FAIL lúc launch** (MiniBrowser: `libevent-2.1.so.7` không có — libs hệ thống vắng sau reboot #39; apt replay không tiến triển). Chromium 3/3 PASS cùng boot.
- **Harness lần 3 (WebKit-only, DEBROOT) trên boot 802f358f: WebKit 3/3 PASS exit 0 (21:38:35–21:46:39Z)** — run này T9 quan sát đang chạy live lúc 21:39Z (MiniBrowser + WebKitWebProcess sống); **không gây spike B2 nào ≥3,0** (load1 max 2,55 trên boot 2 — xem §2.1). Tổng kết harness đợt 149 (T8): 6/6 PASS trên boot 802f358f + 2/2 WebKit PASS trên boot 70025d3e trước reboot; 0 kẹt.
- T9 KHÔNG chạy O8/harness (đó là phạm vi T8); T9 chỉ ghi boot attribution + đối chiếu tải (B2) như trên, theo yêu cầu bổ sung của parent.

### 5.3 Điều tra mẫu (m) (T7) — dữ kiện thô liên quan reboot #39

- T7-149 đã đóng LIMITS: điều tra mẫu (m) XONG (cơ chế xác định, n=2); run 148 SUCCEEDED; run 149 jitter 0 s gốc nhưng **BỊ VIẾT LẠI tại reboot #39 (offset 40 s — bằng chứng trực tiếp thứ 16)**; #38 là bằng chứng âm duy nhất (không viết lại). Tranh chấp clock T1–T2 chưa chốt. T9 chỉ ghi lại để T10 đối chiếu với mốc reboot #39 của mình (21:23:51Z stat / 21:24:01Z proc/1); không phán.

## 6. Sai số của chính T9 (ghi rõ)

- **F-149-T9-1 — Headroom 438 → 339 → 331: dưới ngưỡng lần thứ chín liên tiếp, tỉ lệ/vite ~0,21 lúc đóng (sâu nhất từ trước tới nay).** Không phải sai số đo (2 lần đo mở đợt chênh 0, 2 lần đo sau reboot chênh 0, 2 lần đo đóng phiên chênh 0; T5 đối chiếu độc lập 336 trên cùng boot 802f358f — chênh 3 watch, sai số pha lấy mẫu). Ghi rõ: quyết "chỉ theo dõi" (i) đợt 148 vẫn đứng; T9 không tự đổi ngưỡng hay yêu cầu user hành động. Trần 63.747 không đổi trong phiên trên cả hai boot.
- **F-149-T9-2 — Cơ chế tự động (a) armed cả phiên NHƯNG chưa có lần kích hoạt thật (lần thứ ba liên tiếp):** trong phiên thật 0 mẫu ≥ guard nên trigger chưa từng chạy nhánh FIRE với lệnh birefnet thật. Dry-run đợt 147 (§3.2 LIMITS T9-147) chỉ kiểm tra nhánh quyết định + log, không kiểm tra lệnh birefnet thật (lệnh đã xác minh cờ qua `--help`; tham số đúng P7 §7). Lần chạy thật đầu tiên (nếu cửa sổ mở ở đợt sau) vẫn là bằng chứng cuối cho toàn bộ chuỗi — T9 đợt sau cần ghi rõ lệnh có chạy không, session nào thực sự chạy (birefnet hay fallback u2net), exit code, file output.
- **F-149-T9-3 — Job ffmpeg testsrc2 không rõ chủ (cùng họ F-147-T9-3 / F-148-T9-3 — lần thứ ba liên tiếp):** ffmpeg testsrc2 là driver chính của 16/26 spike đợt này (delta tới 141 tick/s), cmdline đầy đủ (`ffmpeg -y -v error -f lavfi -i testsrc2=...`) nhưng vẫn không quy được chủ (process nào spawn nó) — ghi rõ là không quy được chủ, không gán cho bất kỳ luồng nào. Khác đợt 148 (chỉ 1 job hevc đầu phiên), đợt này ffmpeg testsrc2 chạy rải suốt 20:50–21:09Z (3 cụm), gồm cả sau khi attempt T4 đã xong (cụm 3, 21:06–21:09Z).
- **F-149-T9-4 — T9 KHÔNG phán verdict #22, không phán B4 đúng/sai — chỉ đối chiếu dữ kiện:** T4 đã xuất bản LIMITS nên T9 trích verdict T4 (#22 VẪN MỞ; A1 partial 4/20 exit 3; A2 median 138,0 ms; A3 median 112,0 ms; cả ba vi phạm lớp B) + bảng sampler độc lập §2.4. T9 không tự cộng dồn số lượt yên hợp lệ (giao T10 xác nhận số cuối). Ghi nhận: đường abort-3-timeout đã kích hoạt live lần đầu ở attempt thật (A1) và cứu probe khỏi kẹt — T9 corroborate bằng dữ kiện tải (spike 20:50–20:52Z trong cửa sổ A1).
- **F-149-T9-5 — Khoảng trống lấy mẫu 60 giây (cùng lớp F-148-T9-5):** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "0 mẫu ≥ guard" nghĩa đúng là **0 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "không có thời điểm nào vượt". Cơ chế tự động chỉ kích hoạt trên mẫu quan sát được — đây là giới hạn thiết kế đã biết, không phải lỗi vận hành.
- **F-149-T9-6 — Reboot giết sampler/watcher; T9 KHỞI ĐỘNG LẠI BẰNG TAY (MỚI — khác đợt 148):** sampler + watcher chết theo reboot #39; T9 khởi động lại bằng tay 21:25:05Z trên boot mới (pid 3055/3056), gap phủ sóng 87 s (mất 1 mẫu). Đây là can thiệp tay trong phiên, KHÔNG phải cơ chế tự hồi phục (không có systemd unit; sampler không tự khởi động lại sau reboot theo thiết kế). Nếu parent/T10 muốn phủ sóng liền mạch qua reboot thì cần quyết có thêm cơ chế tự hồi phục không — T9 không tự thêm unit/systemd ngoài brief. Chuỗi ghim 2 vẫn ghim lúc sampler dừng (22:46:07Z) — độ dài thật của chuỗi 2 không quan sát được tới cuối.
- **F-149-T9-7 — T8 phán chuỗi ghim trần "ĐỨT" bằng dữ kiện T9 CŨ (MỚI — quan trọng):** T8-149 (F-149-T8-7) viết "sampler T9 đối chiếu: 0/61 mẫu (max 6.150.008 kB = 95,4%)" và phán chuỗi mới (= 1, đợt 148) DỪNG ở 1. Con số 0/61 + max 6.150.008 kB đúng với log T9 lúc ~21:41Z — **trước khi chuỗi ghim 1 bắt đầu (21:51:06Z)**. Dữ kiện đầy đủ phiên T9: 49/125 mẫu ghim, 2 chuỗi (22 + 27 phút) trên boot 802f358f. Phán "đứt" của T8 là sớm/thiếu dữ kiện (T8 đóng ~21:52Z, ~1 phút sau khi ghim bắt đầu). T9 không phán chuỗi nối hay đứt — giao T10 phán lại bằng dữ kiện đầy đủ §2.2. T9 cũng ghi rõ: chuỗi ghim đợt 148 (37 phút, chết cùng boot d8a11644) và 2 chuỗi đợt 149 cách nhau 2 reboot (#38, #39) + hơn 2 giờ — việc gọi là "nối" hay "mới" là phán của T10, không phải của T9.
- **F-149-T9-8 — Đồng hồ quanh reboot #39 (MỚI):** trong dữ kiện T9 KHÔNG có nghịch lý (btime boot mới 21:23:51Z muộn hơn 13 s so với mẫu cuối boot cũ 21:23:38Z). Nhưng T8 ghi sampler của T8 có mẫu 21:24:05Z (muộn hơn btime 14 s) và T5 ghi /proc/1 btime 21:24:01Z (offset 10 s so với /proc/stat). Ba nguồn (T9/T8/T5) không mâu thuẫn nhau về giây reboot theo /proc/stat (21:23:51Z — cả ba khớp), chỉ khác ở /proc/1 và timestamp mẫu — giao T2/T7 phán (T7 đã ghi bằng chứng #16 với offset 40 s; tranh chấp clock T1–T2 chưa chốt).
- **F-149-T9-9 — Cửa attempt của T4 chỉ canh attempt1 (F-149-T4-3 — T9 corroborate):** attempt2/3 khởi động trong tải nặng (sampler T9: load1 lúc start A2 ~5,64–6,35; lúc start A3 ~9,27–10,54). T9 không phán thiết kế poller đúng/sai — chỉ ghi dữ kiện tải độc lập để parent/T10 đối chiếu khi quyết có sửa vòng retry không.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (copy y nguyên script đợt 148, cap 30.000 thống nhất); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 150 (phần T9)

1. **Cơ chế tự động (a) armed nhưng chưa có lần kích hoạt thật — lần thứ ba liên tiếp** (0 mẫu ≥ guard đợt này): giữ nguyên sampler + trigger cho đợt 150 (lockfile + log theo phiên mới — lockfile đợt 149 nằm trong dir round149-t9 nên không chặn đợt 150; mỗi đợt dùng dir riêng). Nếu cửa sổ mở lại, cơ chế sẽ bắt trong ≤60 s. Guard giữ nguyên 6.144 MiB; u2net là fallback chính thức.
2. **⚠️ Headroom 438 → 339 → 331 — VẪN DƯỚI < ~1.800, lần thứ chín liên tiếp dưới ngưỡng** (quyết parent đợt 148 (i): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,21 lúc đóng — sâu nhất từ trước tới nay.** Bước giảm −8 so với đóng đợt 148; thêm −99 qua reboot #39; thêm −8 trong phiên trên boot mới. Trần 63.747 không đổi trong phiên trên cả hai boot.
3. **Balloon: GHIM TRẦN TRỞ LẠI trên boot mới — 49/125 mẫu trong HAI chuỗi liên tục (22 + 27 phút), chuỗi 2 vẫn ghim lúc đóng** sau đợt 148 ghi 38/115 trong một chuỗi 37 phút; boot 1 đợt này 0/43 ghim. **Giao T10 phán lại chuỗi** (F-149-T9-7: phán "đứt" của T8 dựa trên dữ kiện T9 cắt sớm ~21:41Z, trước khi ghim bắt đầu 21:51:06Z). Giữ nguyên gate A ≥1024 MB theo quyết (o) đợt 146.
4. **Reboot #39 (21:23:51Z, boot mới 802f358f) — giao T2/T5/T7:** số thứ tự reboot đã rõ (#39); tuổi thọ boot 70025d3e 4.998 s (stat→stat, T5); khung chết mới (nếu có); tranh chấp clock T1–T2 chưa chốt. T5-150 replay boot mới (replay đợt này không tới trong 60', đã --repair 1 lần + cờ mới 22:35:39Z).
5. **Lượt yên #22 VẪN MỞ (không có lượt hợp lệ đợt này):** đợt 150 đo lại #22 (cùng cổng tickCost ≤60 ms + probe đã vá); cổng tickCost đã kích hoạt live lần đầu ở attempt2 đợt 148; đường abort-3-timeout kích hoạt live lần đầu ở attempt1 đợt này.
6. **ffmpeg testsrc2 không rõ chủ — lần thứ ba liên tiếp** (driver chính 16/26 spike đợt này, delta tới 141 tick/s). Giao parent/T10 quyết có cần truy chủ không (T9 không tự gán).
7. Các nợ đứng khác giữ nguyên từ đợt 148 §11 (mù #68/#69? + mù #70?/#71? chờ T2-149/150; G1 khung (a) M2 vẫn hoãn chờ user; R9 (a) vẫn chờ user; ci-security.yml vẫn 403 chờ user; file oversize 6,4 MB vẫn chưa quyết; TTS 39 cấm kiểm lại; mẫu (m) T7-149 đã điều tra xong — chờ quyết parent).

## Phụ lục A — Bảng sampler đầy đủ (125 mẫu: boot 70025d3e 43 mẫu + boot 802f358f 82 mẫu; gap 87 s do reboot #39)

(File gốc: `hidden_files/round149-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)

Thống kê: samples: 125; mem min: 469816 kB (458.8 MiB) lúc 22:22:07Z (boot 802f358f); mem max: 2219984 kB (2168.0 MiB = 35.29% guard) lúc 21:05:37Z (boot 70025d3e); mem mean: 900016 kB (879.0 MiB); count >=1024 MiB (gate A): 40/125 (boot 1: 30/43; boot 2: 10/82); count >= guard 6144 MiB: 0/125; balloon frozen 6443824: 49/125 (boot 1: 0/43; boot 2: 49/82 — chuỗi 1: 21:51:06–22:12:06Z n=22; chuỗi 2: 22:20:07–22:46:07Z n=27, vẫn ghim lúc sampler dừng); balloon min: 3961308 kB lúc 20:59:36Z (boot 1); balloon max: 6443824 kB; load1 max (sampler): 10.54 lúc 21:00:36Z; load1 >=3.0 samples: 15/125 (tất cả trên boot 1); reboot gap: 87 s (21:23:38Z → 21:25:05Z).

| # | Thời điểm (UTC) | Boot | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-19T20:41:35Z | 70025d3e | 1,004,160 | 980.6 | 15.96% | 5,910,804 | 785,252 | 1.09 |
| 2 | 2026-11-19T20:42:35Z | 70025d3e | 891,044 | 870.2 | 14.16% | 6,037,116 | 770,936 | 0.6 |
| 3 | 2026-11-19T20:43:35Z | 70025d3e | 737,760 | 720.5 | 11.73% | 6,150,008 | 731,440 | 0.96 |
| 4 | 2026-11-19T20:44:35Z | 70025d3e | 1,121,768 | 1095.5 | 17.83% | 5,706,776 | 685,868 | 2.83 |
| 5 | 2026-11-19T20:45:35Z | 70025d3e | 1,058,844 | 1034.0 | 16.83% | 5,818,424 | 688,740 | 2.04 |
| 6 | 2026-11-19T20:46:35Z | 70025d3e | 993,488 | 970.2 | 15.79% | 5,951,316 | 686,464 | 1.8 |
| 7 | 2026-11-19T20:47:35Z | 70025d3e | 835,736 | 816.1 | 13.28% | 6,073,728 | 684,324 | 1.18 |
| 8 | 2026-11-19T20:48:35Z | 70025d3e | 1,150,476 | 1123.5 | 18.29% | 5,060,932 | 647,432 | 1.47 |
| 9 | 2026-11-19T20:49:35Z | 70025d3e | 902,916 | 881.8 | 14.35% | 5,086,212 | 677,780 | 0.79 |
| 10 | 2026-11-19T20:50:35Z | 70025d3e | 816,724 | 797.6 | 12.98% | 5,203,100 | 675,992 | 6.03 |
| 11 | 2026-11-19T20:51:35Z | 70025d3e | 967,232 | 944.6 | 15.37% | 5,340,592 | 687,540 | 5.09 |
| 12 | 2026-11-19T20:52:35Z | 70025d3e | 1,873,772 | 1829.9 | 29.78% | 5,026,024 | 651,200 | 5.64 |
| 13 | 2026-11-19T20:53:35Z | 70025d3e | 1,244,108 | 1214.9 | 19.77% | 4,631,112 | 632,612 | 6.35 |
| 14 | 2026-11-19T20:54:35Z | 70025d3e | 861,452 | 841.3 | 13.69% | 4,498,616 | 619,344 | 4.2 |
| 15 | 2026-11-19T20:55:35Z | 70025d3e | 1,228,400 | 1199.6 | 19.52% | 4,594,736 | 640,052 | 2.23 |
| 16 | 2026-11-19T20:56:36Z | 70025d3e | 1,455,716 | 1421.6 | 23.14% | 4,783,284 | 645,552 | 1.4 |
| 17 | 2026-11-19T20:57:36Z | 70025d3e | 1,277,884 | 1247.9 | 20.31% | 4,931,868 | 646,836 | 0.98 |
| 18 | 2026-11-19T20:58:36Z | 70025d3e | 1,609,552 | 1571.8 | 25.58% | 4,014,364 | 644,356 | 5.42 |
| 19 | 2026-11-19T20:59:36Z | 70025d3e | 1,547,132 | 1510.9 | 24.59% | 3,961,308 | 645,988 | 9.27 |
| 20 | 2026-11-19T21:00:36Z | 70025d3e | 1,579,396 | 1542.4 | 25.10% | 4,160,748 | 654,820 | 10.54 |
| 21 | 2026-11-19T21:01:36Z | 70025d3e | 1,407,192 | 1374.2 | 22.37% | 4,345,372 | 655,656 | 7.8 |
| 22 | 2026-11-19T21:02:36Z | 70025d3e | 1,628,944 | 1590.8 | 25.89% | 4,553,276 | 657,016 | 4.78 |
| 23 | 2026-11-19T21:03:37Z | 70025d3e | 1,748,524 | 1707.5 | 27.79% | 4,746,460 | 658,816 | 2.17 |
| 24 | 2026-11-19T21:04:37Z | 70025d3e | 1,398,380 | 1365.6 | 22.23% | 4,060,160 | 633,212 | 0.94 |
| 25 | 2026-11-19T21:05:37Z | 70025d3e | 2,219,984 | 2168.0 | 35.29% | 4,199,924 | 642,500 | 0.44 |
| 26 | 2026-11-19T21:06:37Z | 70025d3e | 1,977,624 | 1931.3 | 31.43% | 4,442,356 | 650,452 | 3.9 |
| 27 | 2026-11-19T21:07:37Z | 70025d3e | 1,677,656 | 1638.3 | 26.67% | 4,659,812 | 654,720 | 7.94 |
| 28 | 2026-11-19T21:08:37Z | 70025d3e | 1,767,456 | 1726.0 | 28.09% | 4,853,252 | 658,200 | 7.83 |
| 29 | 2026-11-19T21:09:37Z | 70025d3e | 1,653,584 | 1614.8 | 26.28% | 5,030,016 | 659,404 | 5.35 |
| 30 | 2026-11-19T21:10:37Z | 70025d3e | 1,626,228 | 1588.1 | 25.85% | 5,036,984 | 658,324 | 3.83 |
| 31 | 2026-11-19T21:11:37Z | 70025d3e | 1,851,716 | 1808.3 | 29.43% | 4,914,512 | 654,912 | 1.82 |
| 32 | 2026-11-19T21:12:37Z | 70025d3e | 1,576,104 | 1539.2 | 25.05% | 5,126,252 | 662,540 | 0.98 |
| 33 | 2026-11-19T21:13:37Z | 70025d3e | 1,439,508 | 1405.8 | 22.88% | 5,308,280 | 660,740 | 0.94 |
| 34 | 2026-11-19T21:14:37Z | 70025d3e | 1,671,248 | 1632.1 | 26.56% | 5,035,632 | 659,496 | 0.98 |
| 35 | 2026-11-19T21:15:37Z | 70025d3e | 1,430,356 | 1396.8 | 22.73% | 4,579,084 | 635,152 | 2.3 |
| 36 | 2026-11-19T21:16:37Z | 70025d3e | 1,279,200 | 1249.2 | 20.33% | 4,693,052 | 636,564 | 1.87 |
| 37 | 2026-11-19T21:17:37Z | 70025d3e | 1,168,416 | 1141.0 | 18.57% | 4,875,876 | 628,708 | 1.81 |
| 38 | 2026-11-19T21:18:37Z | 70025d3e | 1,108,608 | 1082.6 | 17.62% | 5,055,012 | 622,808 | 1.46 |
| 39 | 2026-11-19T21:19:37Z | 70025d3e | 1,602,840 | 1565.3 | 25.48% | 5,220,268 | 622,768 | 1.14 |
| 40 | 2026-11-19T21:20:37Z | 70025d3e | 817,080 | 797.9 | 12.99% | 5,352,236 | 623,220 | 1.21 |
| 41 | 2026-11-19T21:21:37Z | 70025d3e | 764,888 | 747.0 | 12.16% | 5,474,948 | 621,912 | 1.17 |
| 42 | 2026-11-19T21:22:38Z | 70025d3e | 724,848 | 707.9 | 11.52% | 5,467,000 | 611,572 | 0.75 |
| 43 | 2026-11-19T21:23:38Z | 70025d3e | 619,064 | 604.6 | 9.84% | 5,559,124 | 607,252 | 1.5 |
| 44 | 2026-11-19T21:25:05Z | 802f358f | 1,675,720 | 1636.4 | 26.63% | 5,084,744 | 1,025,940 | 2.55 |
| 45 | 2026-11-19T21:26:05Z | 802f358f | 1,549,448 | 1513.1 | 24.63% | 5,282,532 | 1,008,436 | 1.04 |
| 46 | 2026-11-19T21:27:05Z | 802f358f | 1,398,832 | 1366.0 | 22.23% | 5,465,912 | 961,444 | 0.64 |
| 47 | 2026-11-19T21:28:05Z | 802f358f | 1,264,016 | 1234.4 | 20.09% | 4,934,728 | 791,308 | 1.86 |
| 48 | 2026-11-19T21:29:05Z | 802f358f | 1,125,116 | 1098.7 | 17.88% | 5,114,752 | 772,372 | 1.52 |
| 49 | 2026-11-19T21:30:05Z | 802f358f | 776,348 | 758.2 | 12.34% | 5,258,340 | 757,544 | 1.87 |
| 50 | 2026-11-19T21:31:06Z | 802f358f | 1,551,452 | 1515.1 | 24.66% | 5,415,420 | 749,380 | 1.4 |
| 51 | 2026-11-19T21:32:06Z | 802f358f | 575,356 | 561.9 | 9.15% | 5,534,032 | 713,356 | 1.65 |
| 52 | 2026-11-19T21:33:06Z | 802f358f | 541,196 | 528.5 | 8.60% | 5,642,128 | 704,764 | 1.47 |
| 53 | 2026-11-19T21:34:06Z | 802f358f | 497,788 | 486.1 | 7.91% | 5,757,976 | 700,060 | 0.66 |
| 54 | 2026-11-19T21:35:06Z | 802f358f | 1,458,036 | 1423.9 | 23.17% | 5,558,592 | 687,776 | 0.64 |
| 55 | 2026-11-19T21:36:06Z | 802f358f | 1,290,528 | 1260.3 | 20.51% | 5,669,564 | 693,052 | 0.27 |
| 56 | 2026-11-19T21:37:06Z | 802f358f | 1,117,644 | 1091.4 | 17.76% | 5,823,216 | 694,088 | 0.35 |
| 57 | 2026-11-19T21:38:06Z | 802f358f | 1,000,204 | 976.8 | 15.90% | 5,958,108 | 695,056 | 0.33 |
| 58 | 2026-11-19T21:39:06Z | 802f358f | 696,716 | 680.4 | 11.07% | 5,516,124 | 648,292 | 1.96 |
| 59 | 2026-11-19T21:40:06Z | 802f358f | 1,310,744 | 1280.0 | 20.83% | 5,606,236 | 660,672 | 1.32 |
| 60 | 2026-11-19T21:41:06Z | 802f358f | 850,472 | 830.5 | 13.52% | 5,434,732 | 666,936 | 1.7 |
| 61 | 2026-11-19T21:42:06Z | 802f358f | 888,236 | 867.4 | 14.12% | 5,547,856 | 669,756 | 1.73 |
| 62 | 2026-11-19T21:43:06Z | 802f358f | 661,896 | 646.4 | 10.52% | 5,678,852 | 661,196 | 1.81 |
| 63 | 2026-11-19T21:44:06Z | 802f358f | 593,968 | 580.0 | 9.44% | 5,774,388 | 656,996 | 1.49 |
| 64 | 2026-11-19T21:45:06Z | 802f358f | 601,708 | 587.6 | 9.56% | 5,868,324 | 661,388 | 0.83 |
| 65 | 2026-11-19T21:46:06Z | 802f358f | 547,864 | 535.0 | 8.71% | 5,959,968 | 660,788 | 0.3 |
| 66 | 2026-11-19T21:47:06Z | 802f358f | 906,592 | 885.3 | 14.41% | 6,074,460 | 657,868 | 0.17 |
| 67 | 2026-11-19T21:48:06Z | 802f358f | 778,560 | 760.3 | 12.37% | 6,189,088 | 660,008 | 0.11 |
| 68 | 2026-11-19T21:49:06Z | 802f358f | 694,336 | 678.1 | 11.04% | 6,295,152 | 658,784 | 0.04 |
| 69 | 2026-11-19T21:50:06Z | 802f358f | 624,600 | 610.0 | 9.93% | 6,392,636 | 656,580 | 0.08 |
| 70 | 2026-11-19T21:51:06Z | 802f358f | 584,776 | 571.1 | 9.29% | 6,443,824 | 656,380 | 0.03 |
| 71 | 2026-11-19T21:52:06Z | 802f358f | 561,056 | 547.9 | 8.92% | 6,443,824 | 656,584 | 0.05 |
| 72 | 2026-11-19T21:53:06Z | 802f358f | 568,268 | 554.9 | 9.03% | 6,443,824 | 659,688 | 0.02 |
| 73 | 2026-11-19T21:54:06Z | 802f358f | 509,304 | 497.4 | 8.10% | 6,443,824 | 661,404 | 0.16 |
| 74 | 2026-11-19T21:55:06Z | 802f358f | 555,300 | 542.3 | 8.83% | 6,443,824 | 669,768 | 0.18 |
| 75 | 2026-11-19T21:56:06Z | 802f358f | 532,584 | 520.1 | 8.47% | 6,443,824 | 672,868 | 0.06 |
| 76 | 2026-11-19T21:57:06Z | 802f358f | 546,932 | 534.1 | 8.69% | 6,443,824 | 673,140 | 0.06 |
| 77 | 2026-11-19T21:58:06Z | 802f358f | 556,036 | 543.0 | 8.84% | 6,443,824 | 673,316 | 0.02 |
| 78 | 2026-11-19T21:59:06Z | 802f358f | 550,620 | 537.7 | 8.75% | 6,443,824 | 673,532 | 0.0 |
| 79 | 2026-11-19T22:00:06Z | 802f358f | 559,276 | 546.2 | 8.89% | 6,443,824 | 676,988 | 0.05 |
| 80 | 2026-11-19T22:01:06Z | 802f358f | 562,648 | 549.5 | 8.94% | 6,443,824 | 677,696 | 0.02 |
| 81 | 2026-11-19T22:02:06Z | 802f358f | 562,072 | 548.9 | 8.93% | 6,443,824 | 678,068 | 0.18 |
| 82 | 2026-11-19T22:03:06Z | 802f358f | 562,744 | 549.6 | 8.94% | 6,443,824 | 678,044 | 0.06 |
| 83 | 2026-11-19T22:04:06Z | 802f358f | 543,184 | 530.5 | 8.63% | 6,443,824 | 678,304 | 0.02 |
| 84 | 2026-11-19T22:05:06Z | 802f358f | 563,080 | 549.9 | 8.95% | 6,443,824 | 682,352 | 0.01 |
| 85 | 2026-11-19T22:06:06Z | 802f358f | 562,292 | 549.1 | 8.94% | 6,443,824 | 682,228 | 0.06 |
| 86 | 2026-11-19T22:07:06Z | 802f358f | 556,004 | 543.0 | 8.84% | 6,443,824 | 681,916 | 0.02 |
| 87 | 2026-11-19T22:08:06Z | 802f358f | 544,208 | 531.5 | 8.65% | 6,443,824 | 681,948 | 0.01 |
| 88 | 2026-11-19T22:09:06Z | 802f358f | 557,192 | 544.1 | 8.86% | 6,443,824 | 681,936 | 0.0 |
| 89 | 2026-11-19T22:10:06Z | 802f358f | 557,380 | 544.3 | 8.86% | 6,443,824 | 681,984 | 0.0 |
| 90 | 2026-11-19T22:11:06Z | 802f358f | 554,832 | 541.8 | 8.82% | 6,443,824 | 682,040 | 0.08 |
| 91 | 2026-11-19T22:12:06Z | 802f358f | 549,112 | 536.2 | 8.73% | 6,443,824 | 680,380 | 0.08 |
| 92 | 2026-11-19T22:13:06Z | 802f358f | 1,042,308 | 1017.9 | 16.57% | 5,919,536 | 641,012 | 0.65 |
| 93 | 2026-11-19T22:14:06Z | 802f358f | 825,844 | 806.5 | 13.13% | 6,042,864 | 643,700 | 0.32 |
| 94 | 2026-11-19T22:15:06Z | 802f358f | 806,464 | 787.6 | 12.82% | 6,154,392 | 643,848 | 0.66 |
| 95 | 2026-11-19T22:16:06Z | 802f358f | 491,644 | 480.1 | 7.81% | 6,255,512 | 642,956 | 0.56 |
| 96 | 2026-11-19T22:17:07Z | 802f358f | 497,772 | 486.1 | 7.91% | 6,345,556 | 641,848 | 0.4 |
| 97 | 2026-11-19T22:18:07Z | 802f358f | 659,752 | 644.3 | 10.49% | 6,327,372 | 626,664 | 2.45 |
| 98 | 2026-11-19T22:19:07Z | 802f358f | 546,876 | 534.1 | 8.69% | 6,416,904 | 628,056 | 1.53 |
| 99 | 2026-11-19T22:20:07Z | 802f358f | 531,872 | 519.4 | 8.45% | 6,443,824 | 629,488 | 0.61 |
| 100 | 2026-11-19T22:21:07Z | 802f358f | 505,828 | 494.0 | 8.04% | 6,443,824 | 632,560 | 0.26 |
| 101 | 2026-11-19T22:22:07Z | 802f358f | 469,816 | 458.8 | 7.47% | 6,443,824 | 638,492 | 0.22 |
| 102 | 2026-11-19T22:23:07Z | 802f358f | 492,000 | 480.5 | 7.82% | 6,443,824 | 640,264 | 0.16 |
| 103 | 2026-11-19T22:24:07Z | 802f358f | 511,952 | 500.0 | 8.14% | 6,443,824 | 641,648 | 1.3 |
| 104 | 2026-11-19T22:25:07Z | 802f358f | 587,984 | 574.2 | 9.35% | 6,443,824 | 751,252 | 1.71 |
| 105 | 2026-11-19T22:26:07Z | 802f358f | 590,644 | 576.8 | 9.39% | 6,443,824 | 769,524 | 1.71 |
| 106 | 2026-11-19T22:27:07Z | 802f358f | 577,744 | 564.2 | 9.18% | 6,443,824 | 769,612 | 1.52 |
| 107 | 2026-11-19T22:28:07Z | 802f358f | 559,808 | 546.7 | 8.90% | 6,443,824 | 769,708 | 1.19 |
| 108 | 2026-11-19T22:29:07Z | 802f358f | 550,748 | 537.8 | 8.75% | 6,443,824 | 771,264 | 1.07 |
| 109 | 2026-11-19T22:30:07Z | 802f358f | 547,136 | 534.3 | 8.70% | 6,443,824 | 772,172 | 1.58 |
| 110 | 2026-11-19T22:31:07Z | 802f358f | 520,928 | 508.7 | 8.28% | 6,443,824 | 772,556 | 1.28 |
| 111 | 2026-11-19T22:32:07Z | 802f358f | 522,392 | 510.1 | 8.30% | 6,443,824 | 772,872 | 1.81 |
| 112 | 2026-11-19T22:33:07Z | 802f358f | 523,432 | 511.2 | 8.32% | 6,443,824 | 773,396 | 1.48 |
| 113 | 2026-11-19T22:34:07Z | 802f358f | 557,512 | 544.4 | 8.86% | 6,443,824 | 754,616 | 1.15 |
| 114 | 2026-11-19T22:35:07Z | 802f358f | 516,228 | 504.1 | 8.21% | 6,443,824 | 759,488 | 0.89 |
| 115 | 2026-11-19T22:36:07Z | 802f358f | 546,092 | 533.3 | 8.68% | 6,443,824 | 734,776 | 0.92 |
| 116 | 2026-11-19T22:37:07Z | 802f358f | 533,176 | 520.7 | 8.47% | 6,443,824 | 735,076 | 0.34 |
| 117 | 2026-11-19T22:38:07Z | 802f358f | 503,352 | 491.6 | 8.00% | 6,443,824 | 735,608 | 0.44 |
| 118 | 2026-11-19T22:39:07Z | 802f358f | 500,684 | 488.9 | 7.96% | 6,443,824 | 734,424 | 0.2 |
| 119 | 2026-11-19T22:40:07Z | 802f358f | 519,196 | 507.0 | 8.25% | 6,443,824 | 727,876 | 0.82 |
| 120 | 2026-11-19T22:41:07Z | 802f358f | 500,708 | 489.0 | 7.96% | 6,443,824 | 741,628 | 0.79 |
| 121 | 2026-11-19T22:42:07Z | 802f358f | 505,488 | 493.6 | 8.03% | 6,443,824 | 743,248 | 0.29 |
| 122 | 2026-11-19T22:43:07Z | 802f358f | 516,368 | 504.3 | 8.21% | 6,443,824 | 743,704 | 0.1 |
| 123 | 2026-11-19T22:44:07Z | 802f358f | 478,140 | 466.9 | 7.60% | 6,443,824 | 743,432 | 0.16 |
| 124 | 2026-11-19T22:45:07Z | 802f358f | 478,284 | 467.1 | 7.60% | 6,443,824 | 745,316 | 0.11 |
| 125 | 2026-11-19T22:46:07Z | 802f358f | 490,580 | 479.1 | 7.80% | 6,443,824 | 743,584 | 0.16 |
