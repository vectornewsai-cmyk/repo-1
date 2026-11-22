# LIMITS — Phase 9 đợt 144, T9: headroom inotify + RAM + guard birefnet + B2/tải tự sinh (DƯỚI NGƯỠNG <1.800 LẦN THỨ TƯ; DROP −202 PHÁ DẢI; LẦN 3 KHÔNG CÓ CỬA SỔ THOÁNG; REBOOT GIỮA CỬA SỔ ĐO)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 1.296** (đo 2 lần trên boot 691a7403 btime **03:55:45Z**: 1.296 lúc 05:39:17Z và **1.295** lúc 05:39:26Z 19/11, chênh **1** — LẦN ĐẦU chênh khác 0 sau sáu đợt chênh 0) — **GIẢM MẠNH**: 1.498 (đợt 143) → **1.296 (−202, −13,5%)**. Xem §1.
- **⚠️ VẪN DƯỚI NGƯỠNG BÁO USER (< ~1.800) — thấp hơn ngưỡng 504, lần thứ tư liên tiếp.** Quyết parent (h) đợt 143: VẪN CHỈ THEO DÕI, nhắc lại một dòng trong báo cáo đợt — đợt này **KHÔNG báo riêng, không yêu cầu user hành động**; can thiệp host ngoài tầm cell. **Tỉ lệ/vite chỉ còn ~0,82** (đợt 143: 0,95). Xem §1.3, F-144-T9-1.
- **Đo lần 3 sau reboot (boot mới cc222c8a, ~2 phút tuổi): headroom 1.194** — **CỬA SỔ THOÁNG >20.000 KHÔNG XUẤT HIỆN** (khác đợt 140/142/143, giống đợt 141 khi lần 3 đã dừng ở 1.719). Tỉ lệ/vite trên boot mới chỉ ~0,76. Xem §1.4, F-144-T9-3.
- **RAM:** đỉnh **46,84% guard** — cao hơn đợt 143 (44,16%). Max toàn cửa sổ (135 mẫu, hai vòng): **2.946.832 kB = 2.877,8 MiB lúc 06:12:30Z** (boot cc222c8a), thiếu **3.344.624 kB (~3.266,2 MiB)** mới tới guard 6.291.456 kB. Min toàn cửa sổ: **494.656 kB (483,1 MiB) lúc 06:46:33Z** (boot cc222c8a). **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** Xem §2.
- **Balloon virtio:** ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM) trong **60/135 mẫu (44,4%)** — vòng 1: 0/15; vòng 2: 60/120 (50,0%), đợt dài nhất 30 mẫu liên tục (07:06:34–07:35:36Z). Giá trị đóng băng y hệt đợt 138/139/140/141/142/143 — **đợt thứ bảy liên tiếp**; balloon KHÔNG xả bền. Xem §2.2.
- **REBOOT GIỮA CỬA SỔ ĐO #31: boot 691a7403 chết, boot mới cc222c8a lên thay, btime 05:53:15Z.** Sampler vòng 1 bị SIGTERM giết cùng lúc (15 mẫu, 05:39:42–05:53:44Z); khởi động lại vòng 2 lúc 05:55:28Z (gap lấy mẫu ~1'44"). **Nghịch lý đồng hồ: mẫu cuối boot cũ ghi 05:53:44Z (đồng hồ cũ) MUỘN HƠN btime boot mới 05:53:15Z (đồng hồ mới) 29 giây** — hai đồng hồ lệch nhau, khung chết KHÔNG chốt được bằng dữ kiện T9; giao T2/T6. Boot cũ sống 03:55:45Z → 05:53:15Z = **1h57m30s**. Xem §5, F-144-T9-2.
- **B2 / tải tự sinh (câu hỏi mở từ đợt 143): CÓ tải tự sinh — nhưng KHÔNG phải từ stack đo.** Stack đo (sampler/poller/watcher) không sinh load1 ≥3,0 lần nào ngoài cửa sổ sau boot. Tải cao đến từ: (a) **chính phép đo của T4** — attempt WebKit + vite tự tạo load1 tới 4,06 rồi bị lớp B loại (attempt1 boot cũ: WebKitWebProcess 70–74% CPU); (b) **replay apt os-intent sau reboot** — apt-get chạy theo đợt suốt lượt (05:55:28Z cài libmanette; **vẫn chạy lúc T9 đóng 07:59Z, cài libpipewire-0.3-common**); (c) công việc thật các luồng khác (ffmpeg x265, harness T8 06:27–06:36Z). Ngoài cửa sổ sau boot, **0 spike load1 ≥3,0 trong ~118 phút**. Xem §2.5.
- **Lượt yên WebKit #19 (T4, đợt 144): 0 LƯỢT HỢP LỆ theo quy tắc đã lập trình (5 attempt 20/20, 4 hoàn chỉnh bị lớp B loại; poller thoát exit 11 lúc 06:11:55Z) — NHƯNG T4 hậu kiểm cho rằng 2 trong 3 lần loại ở boot mới là SAI (B4 giả-dương + B2 tính trên mẫu sampler cũ), attempt3 đủ điều kiện làm #19 (median 55,0 ms), CHỜ QUYẾT PARENT.** T9 chỉ cung cấp dữ kiện sampler độc lập (§2.4), không phán verdict #19. Xem §2.3, F-144-T9-8.
- Không có vite/chrome nào đang chạy lúc T9 đóng (kiểm tra lúc 08:10:06Z), không có ENOSPC nào (journal 0 dòng "No space left"/ENOSPC trên boot mới). Replay dpkg trên boot 691a7403: 1.545 dòng (gói cuối gstreamer1.0-tools 1.24.2-**1ubuntu0.2** — y hệt đợt 143). Trên boot mới, dpkg_lines leo 539 → 1.545 lúc 05:58:07Z (theo poll T4) — nhưng replay os-intent vẫn chạy sau đó (xem §5). T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 144 (boot 691a7403, btime 03:55:45Z — boot lúc mở đợt)

| Thời điểm (UTC 19/11) | Headroom | Bối cảnh |
|---|---|---|
| 05:39:17Z | **1.296** | lần đo 1, boot ~1h43' tuổi; RAM trước đo 494.400 kB, balloon 6.324.344 kB |
| 05:39:26Z | **1.295** | lần đo 2 (chênh **1** so với lần 1); RAM trước đo 859.380 kB, balloon 5.931.128 kB (xả tạm) |

- Probe dừng ở `i=1296` lần 1 và `i=1295` lần 2, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 1 trong cùng boot — LẦN ĐẦU chênh khác 0 sau sáu đợt liên tiếp chênh 0** (đợt 138, 139, 140, 141, 142, 143 đều 0). Giá trị đợt lấy **1.296** (lần đo 1, như quy ước các đợt trước khi hai lần bằng nhau — nay lần 1 cao hơn lần 2 đúng 1 watch; xem F-144-T9-4).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 1.296 = **62.451 watch** (tăng ~202 so với 62.249 đợt 143).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 1.296 / 1.578 ≈ **0,82 lần** — sâu hơn dưới 1,0 (đợt 143: 0,95). Headroom chỉ còn ~82% nhu cầu một vite dev server đầy đủ.
- Lưu ý: RAM trước đo lần 1 chỉ 494.400 kB (balloon 6.324.344 kB); trước đo lần 2 là 859.380 kB (balloon đã xả tạm 5.931.128 kB) — headroom **gần như không đổi** (1.296 → 1.295): headroom không đi theo RAM khả dụng trong cell, mà theo watch ngoài cell (như đợt 141, 142, 143).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–143 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **144** | **1.296 → 1.295** | **đo 05:39:17Z → 05:39:26Z, boot 691a7403 btime 03:55:45Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — VÀ BƯỚC GIẢM LỚN NHẤT TỪ TRƯỚC TỚI NAY.** Từ đỉnh chuỗi 4.438 xuống 1.296 = **−3.142 (−70,8%)**. Bước giảm đợt này: −202 so với đợt 143 (−13,5%) — **PHÁ VỠ dải 101–127 của mười bốn đợt gần nhất** (130: −116; 131: −117; 132: −108; 133: −106; 134: −127; 135: −110; 136: −114; 137: −106; 138: −111; 139: −110; 140: −114; 141: −101; 142: −122; 143: −119; **144: −202**). Đây là bước giảm lớn nhất trong toàn chuỗi (kỷ lục cũ −127 đợt 134).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 1.296, thấp hơn ngưỡng 504, lần thứ tư liên tiếp.** Quyết parent đợt 143 (h): VẪN CHỈ THEO DÕI, nhắc lại một dòng trong báo cáo đợt — **đợt này KHÔNG báo riêng**, chỉ tiếp tục theo dõi. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite 0,82 — sâu hơn dưới 1,0.** Headroom chỉ còn ~82% nhu cầu một vite đầy đủ (~1.578 watch). Đây là diễn biến đáng ghi cho parent/T10, nhưng quyết "chỉ theo dõi" vẫn đứng (brief đợt này + quyết parent đợt 141/142/143); T9 không tự nâng mức báo hay yêu cầu user hành động.
- Trần 63.747 vẫn đầy ở mức ~62,5k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới cc222c8a (ngoài chuỗi, chỉ để đối chiếu)

- **Lần 3, 05:55:18Z (boot ~2 phút 03 giây tuổi, btime 05:53:15Z): dừng ở `i=1194`, errno=28** — headroom trên boot mới **1.194**. RAM trước đo 1.780.048 kB, balloon 4.888.488 kB, SwapFree 972.916 kB (swap gần trống sau reboot). File tạm đã dọn sạch.
- **Cửa sổ thoáng headroom >20.000 ngay sau boot KHÔNG XUẤT HIỆN** — khác đợt 140 (lần 3 lúc boot 80 giây tuổi), đợt 142 (lần 3 lúc boot ~50 giây tuổi) và đợt 143 (lần 3 lúc boot ~57 giây tuổi, >20.000), giống đợt 141 (lần 3 lúc boot 68 giây tuổi đã dừng ở 1.719). Tỉ lệ/vite trên boot mới: 1.194 / 1.578 ≈ **0,76**. Số watch ngoài cell suy ra: 63.747 − 1.194 = **62.553**.
- **Không đưa 1.194 vào chuỗi §1.3** — chuỗi lấy giá trị ổn định trên boot lúc mở đợt (1.296, đo 2 lần chênh 1). Giá trị lần 3 chỉ là quan sát đối chiếu sau reboot.
- Hệ quả thực hành: **cửa sổ thoáng sau boot KHÔNG đáng tin** — xuất hiện ở 3/5 đợt gần nhất (140, 142, 143) và vắng ở 2/5 đợt (141, 144); khi vắng, headroom trên boot mới thậm chí thấp hơn trên boot cũ (1.194 < 1.296). Reboot KHÔNG reset chuỗi suy giảm headroom — giá trị ổn định của đợt vẫn lấy trên boot mở đợt. Với đà giảm (14 đợt ~101–127/đợt rồi đợt này −202), các đợt sau sẽ đi sâu hơn dưới ngưỡng nếu không can thiệp host (chỉ là phép chia số học minh họa — KHÔNG phải dự báo).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler dài 135 mẫu, 05:39:42Z–07:54:38Z

### 2.1 Hình dạng cửa sổ: vòng 1 ngắn, RAM cao rồi cắt bởi reboot; vòng 2 đỉnh sớm rồi kẹt thấp tới hết

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 05:39:42–05:53:44Z, 15 mẫu, boot 691a7403 — bị SIGTERM giết cùng lúc reboot 05:53:15Z (xem F-144-T9-2 về nghịch lý đồng hồ). Vòng 2: 05:55:28–07:54:38Z, 120 mẫu, boot mới cc222c8a — chạy tới hết hạn 07:55Z.** Tổng **135 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 494.656 kB (483,1 MiB) lúc 06:46:33Z (boot mới). Max toàn cửa sổ: 2.946.832 kB (2.877,8 MiB) lúc 06:12:30Z (boot mới).** Mean vòng 1 ~1.621,9 MiB; mean vòng 2 ~949,3 MiB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot 691a7403 (15 mẫu, 05:39:42–05:53:44Z) — RAM cao suốt vòng, balloon xả sâu rồi cắt bởi reboot:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 05:39:42Z | 822,1 MiB (841.820 kB) | mẫu đầu (balloon 5.931.128 kB); RAM lúc mở đợt đo trực tiếp 511.164 kB (499,2 MiB) lúc 05:39:12Z, trước sampler ~30 giây |
| 05:40:42Z | 871,2 MiB | mẫu duy nhất dưới 1024 MiB ngoài mẫu đầu (cùng mẫu đầu: 2/15 mẫu <1024) |
| 05:41:43–05:47:43Z | 1.048,9 → 1.480,3 MiB | ≥1024 liên tục; load1 max vòng 1 **3,37 lúc 05:45:43Z** — trùng attempt1 WebKit của T4 trên boot cũ (xem §2.5) |
| 05:48:43–05:53:44Z | 2.021,2 → **2.631,4 MiB** | leo sau khi attempt1 T4 kết thúc (05:48:05Z): balloon xả sâu 3.493.476 → 3.488.084 kB; **MAX vòng 1 2.631,4 MiB (42,83% guard) lúc 05:53:44Z** — mẫu cuối trước reboot |
| 05:53:44Z | 2.631,4 MiB | mẫu cuối vòng 1; sampler bị giết cùng reboot ngay sau đó |

- **13/15 mẫu ≥1024 MiB** (chuỗi liên tục #3–#15, 05:41:43–05:53:44Z). **6 mẫu ≥2.000.000 kB** (05:48:43–05:53:44Z, một đợt xả duy nhất cuối vòng).
- Balloon vòng 1: 5.931.128 kB (mẫu đầu) → xả sâu **min 3.488.084 kB lúc 05:53:44Z** → **0 mẫu đóng băng 6.443.824 kB**.
- Load1 vòng 1: 0,68–3,37 (max 3,37 lúc 05:45:43Z — trong cửa sổ attempt1 T4; xem §2.5).
- Swap: SwapFree 606.896 kB lúc mẫu đầu → 592.600 kB lúc mẫu cuối vòng 1 (swap đang dùng ~440 MB).

**Boot mới cc222c8a (120 mẫu, 05:55:28–07:54:38Z) — đỉnh sớm rồi rơi đơn điệu về vùng trũng, balloon đóng băng tới hết:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 05:55:28Z | 1.431,0 MiB (1.465.300 kB) | mẫu đầu sau reboot (balloon 4.763.084 kB; SwapFree 939.416 kB — swap gần trống); load1 max vòng 2 **3,76** (replay apt + ffmpeg — xem §2.5) |
| 05:56:28–06:20:30Z | 1.233,8 → 2.877,8 MiB | **chuỗi 26 mẫu liên tục ≥1024 MiB (#1–#26)**; đỉnh vòng 2 trong chuỗi này |
| 06:12:30Z | **2.877,8 MiB (2.946.832 kB)** | **MAX toàn cửa sổ, 46,84% guard** (balloon 3.948.376 kB — xả sâu sau khi attempt3 T4 kết thúc 06:11:34Z) |
| 06:21:30–06:26:31Z | ~0,6–1,0 GB | rơi dưới gate A, chỉ còn mẫu lẻ ≥1024 (06:23:31Z, 06:26:31Z) |
| 06:27:31–06:36:32Z | 600,8 → 1.233,8 MiB | cụm load1 ≥2 (5 mẫu — harness T8 chạy WebKit rồi Chromium, xem §2.5); 3 mẫu ≥1024 trong cụm (06:31:31–06:35:32Z) |
| 06:37:32–06:40:32Z | ~0,6–1,0 GB | 2 mẫu cuối ≥1024 (06:39:32Z, **06:40:32Z — mẫu cuối ≥1024 MiB toàn cửa sổ**) |
| 06:41:32–06:46:33Z | ~0,5–0,9 GB | rơi dưới gate A, không hồi lại; **MIN toàn cửa sổ 483,1 MiB (494.656 kB) lúc 06:46:33Z** (balloon 6.429.464 kB, gần đóng băng) |
| 06:47:33Z | ~0,6 GB | balloon đóng băng 6.443.824 kB (1 mẫu, lẻ) |
| 06:48:33–06:51:33Z | ~0,6–0,7 GB | nhô nhẹ (balloon xả 6.091.060 kB) |
| 06:52:33–07:03:34Z | ~0,5–0,7 GB | **đợt đóng băng 1**: balloon 6.443.824 kB (**12 mẫu liên tục**) |
| 07:04:34–07:05:34Z | ~0,6 GB | xả nhẹ (balloon 6.379.144 kB) |
| 07:06:34–07:35:36Z | ~0,5–0,7 GB | **đợt đóng băng dài**: balloon 6.443.824 kB (**30 mẫu liên tục**) |
| 07:36:36–07:37:37Z | ~0,6 GB | xả nhẹ (balloon 6.379.144 kB) |
| 07:38:37–07:54:38Z | 548,5–~0,7 GB | **đợt đóng băng cuối**: balloon 6.443.824 kB (**17 mẫu liên tục tới hết sampler**); mẫu cuối 588,4 MiB lúc 07:54:38Z |

- **35/120 mẫu vòng 2 ≥1024 MiB**; sau 06:40:32Z, **không mẫu nào vượt 1.048.576 kB trong 74 phút cuối**. **13 mẫu ≥2.000.000 kB** (tập trung 05:58:28–06:20:30Z).
- Load1 vòng 2: 0,03–3,76 (max 3,76 lúc 05:55:28Z — ngay sau reboot, replay apt + ffmpeg; xem §2.5). Nửa sau cửa sổ (07:06–07:54Z) load1 0,00–0,30 mà RAM vẫn phẳng ~0,55–0,65 GB: RAM thấp không phải do tải trong cell.
- Swap: SwapFree 939.416 kB (mẫu đầu vòng 2) → 731.500 kB lúc cuối (swap đang dùng ~310 MB sau ~2 giờ).

### 2.2 Balloon virtio — xả sâu đầu mỗi vòng rồi đóng băng y hệt đợt 138/139/140/141/142/143

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 5.931.128 kB (05:39:42Z) → xả sâu **min 3.488.084 kB lúc 05:53:44Z (42,9% tổng RAM, đúng lúc đỉnh RAM vòng 1)** → reboot cắt trước khi phình lại; **0 mẫu đóng băng**.
- Boot mới: 4.763.084 kB (05:55:28Z) → xả **min 3.879.008 kB lúc 06:08:29Z** (trong cửa sổ attempt3 T4) → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 60 mẫu** (4 đợt: 06:47:33Z 1 mẫu; 06:52:33–07:03:34Z 12 mẫu; 07:06:34–07:35:36Z 30 mẫu; 07:38:37–07:54:38Z 17 mẫu) → không xả bền tới hết sampler.
- Tổng: balloon đóng băng 6.443.824 kB trong **60/135 mẫu (44,4% cửa sổ)**. Giá trị 6.443.824 kB lặp lại y hệt qua **bảy đợt (138 + 139 + 140 + 141 + 142 + 143 + 144)** và nhiều boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (mẫu đầu 05:39:42Z → mẫu cuối 07:54:38Z): balloon 5.931.128 kB → 6.443.824 kB = **+512.696 kB** (phình ròng). Lúc đóng (08:10:06Z, sau sampler): balloon 6.359.364 kB, RAM 575.980 kB (562,5 MiB).
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 144 VẪN KHÔNG thấy xả bền:** balloon đóng băng 6.443.824 kB trong 60/135 mẫu và RAM phẳng ~0,5 GB suốt nửa sau vòng 2. Đây là **đợt thứ bảy liên tiếp** balloon đóng băng ở đúng giá trị này. Quyết parent đợt 139 đã ghi: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 145.
- Số học lúc đỉnh RAM 06:12:30Z: tổng RAM 8.124.900 kB − balloon 3.948.376 kB = 4.176.524 kB còn lại cho hệ thống; trong đó MemAvailable 2.946.832 kB + free/cache ~1,23 GB. Lúc cuối cửa sổ 07:54:38Z: tổng RAM − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 602.476 kB.

### 2.3 Lượt yên WebKit #19 (T4, đợt 144) — 0 LƯỢT HỢP LỆ THEO QUY TẮC, NHƯNG T4 HẬU KIỂM CHỜ QUYẾT PARENT

- **T4-144 ĐÃ xuất bản LIMITS lúc T9 đóng (08:10:06Z):** `docs/PHASE9_ROUND144_T4_WEBKIT_QUIET19_LIMITS.md`. T9 chỉ trích verdict, không tự đo tickCost (không thuộc phạm vi T9).
- **Lớp 1 (quy tắc đã lập trình, poller tự chạy): 0 lượt hợp lệ.** Poller chạy **5 attempt 20/20 trên 2 boot** (1 boot cũ 05:44–05:48Z + 3 boot mới hoàn chỉnh 05:58–06:11Z + 1 boot cũ dở dang bị reboot giết); lớp B loại cả 4 attempt hoàn chỉnh; hết 3 attempt ở boot mới → poller thoát exit 11 lúc 06:11:55Z ("DA HET 3 ATTEMPT, khong co luot hop le"). Theo lớp này, chuỗi lượt hợp lệ **đứng nguyên 15 lượt**, không median mới, #19 đo lại ở đợt 145.
- **Lớp 2 (hậu kiểm hiệu chỉnh của T4, CHỜ PARENT CHẤP NHẬN): attempt3 boot mới (06:07:30–06:11:04Z) ĐỦ MỌI ĐIỀU KIỆN làm lượt #19 HỢP LỆ.** tickCost median **55,0 ms** (n=566, post-flip 54,0; ≤60); B1/B2/B3/B5 ĐẠT; B4-hiệu-chỉnh ĐẠT (T4: không có process apt/dpkg thật nào trong cửa sổ — xem §6.1 file T4); P1 DUNG 4/4 (p=0,00059), P3-A1 DUNG 4/4 (p=0,0038), P3' ĐẠT 4/4. **T4 KHÔNG tự tuyên bố — chờ quyết parent.** T10 đối chiếu khi gộp; không được lấy số median này làm số chính thức nếu parent không chấp nhận.
- Dữ kiện độc lập từ sampler T9 cho T4/T10 (§2.4): gate A (RAM ≥1024 MiB) giữ suốt chuỗi 26 mẫu đầu vòng 2 (05:55:28–06:20:30Z) — cửa RAM mở trong toàn bộ 3 attempt boot mới; load1 T9 trong các cửa sổ attempt thấp (tối đa 2,65 theo cadence 60 s — T4 sampler riêng mịn hơn ghi max 4,06 ở attempt1 boot mới, xem §2.4).
- Chuỗi median 15 lượt hợp lệ tới đợt 143: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / **49,0 ms** (trung bình 47,9 ms) — số đợt 142/143 lấy từ file T4-142/T4-143.

### 2.4 Dữ kiện sampler T9 trong các cửa sổ attempt của T4 (độc lập, cadence 60 s)

| Attempt | Cửa sổ (UTC) | Boot | load1 (T9) | RAM (T9) | Ghi chú |
|---|---|---|---|---|---|
| 1 (boot cũ) | 05:44:12–05:48:05Z | 691a7403 | 2,17 / 3,37 / 1,40 / 0,97 / 2,06 | 1.230,1 → 2.416,2 MiB | peak load1 3,37 lúc 05:45:43Z — trùng spike B2 (WebKitWebProcess 70–74%, xem §2.5); RAM ≥1024 cả 5 mẫu |
| 1 (boot mới) | 05:58:52–06:03:03Z | cc222c8a | 1,01 / 2,01 / 1,49 / 1,13 / 0,65 / 1,33 | 1.596,7 → 2.222,0 MiB | T4 sampler riêng ghi load1 max 4,06 (cadence mịn hơn bắt được spike giữa hai mẫu 60 s của T9); RAM ≥1024 cả 6 mẫu |
| 2 (boot mới) | ~06:03–06:07:20Z | cc222c8a | 2,65 / 1,71 / 0,73 / 1,29 | 1.665,7 → 2.853,4 MiB | mẫu 06:07:29Z 2.853,4 MiB (ngay sau khi attempt2 kết thúc); RAM ≥1024 cả 4 mẫu |
| 3 (boot mới) | ~06:07:20–06:11:34Z | cc222c8a | 1,28 / 2,07 / 1,28 / 1,45 | 1.865,8 → 2.296,6 MiB | load1 T9 tối đa 2,07; T4 sampler riêng ghi max 2,90; RAM ≥1024 cả 4 mẫu |

- Cả 4 attempt hoàn chỉnh đều chạy trong cửa sổ RAM ≥1024 MiB (gate A mở) — RAM không phải nguyên nhân loại. Lớp B loại cả 4: attempt1 boot cũ + attempt1 boot mới vi phạm B2 (load1 max) và/hoặc B4 (apt/dpkg); attempt2 + attempt3 boot mới chỉ vi phạm B4 theo check-classb (xem file T4). **T4 hậu kiểm cho rằng B4 ở attempt2/3 là giả-dương** (không có process apt/dpkg thật trong cửa sổ) và B2 attempt1 boot mới tính trên mẫu sampler cũ — T9 không phán xét, chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.
- **Mâu thuẫn bề mặt cần T4/T5 đối chiếu (T9 chỉ nêu, không kết luận):** poll T4 #4 lúc 05:58:07Z ghi `apt=0 (aptx=0, dpkgx=0)` — nhưng check-classb lúc 06:02:32Z / 06:06:47Z / 06:11:04Z đều ghi "apt/dpkg dang chay: 1". Giải thích ứng viên (T9 quan sát, xem §2.5): replay os-intent chạy theo đợt — giữa các gói có khoảng trống không có process apt-get (poll bắt được khoảng trống), rồi apt-get tiếp theo khởi động lại (classb bắt được lúc đang chạy). T5 là chủ quản replay — giao T5-145 xác nhận nhịp đợt của replay.

### 2.5 B2 — tải tự sinh của stack đo: CÓ, NHƯNG KHÔNG PHẢI TỪ STACK ĐO

**Câu hỏi mở từ đợt 143:** T4 ghi 16 poll thỏa mọi thứ trừ cờ T5; sampler T9 có thấy tải tự sinh không? Trả lời đợt 144: **CÓ tải tự sinh trong cửa sổ đo — nhưng nguồn không phải stack đo (sampler/poller/watcher), mà là (a) chính phép đo của T4, (b) replay apt sau reboot, (c) công việc thật của các luồng khác.**

Bằng chứng — watcher spike (ngưỡng load1 ≥3,0, kiểm tra mỗi 30 s; tổng 5 spike cả đợt):

| # | Thời điểm (UTC) | load1 | Process gây tải (ps snapshot) | Kết luận |
|---|---|---|---|---|
| 1 | 05:45:00Z | 3,51 | WebKitWebProcess 70,0% + MiniBrowser 31,2% + probe121t3 .mjs 5,1% + vite 4,5% + Xvfb (attempt1 T4, boot cũ) | Tải do **chính attempt đo của T4** tự tạo |
| 2 | 05:45:30Z | 4,06 | WebKitWebProcess 74,3% + MiniBrowser 33,2% + probe .mjs 6,0% + vite 2,7% (attempt1 T4, boot cũ) | Như trên — **phép đo tự tạo tải rồi bị lớp B loại** |
| 3 | 05:55:28Z | 3,76 | ffmpeg x265 88,4% (luồng khác render test) + apt-get replay os-intent 32,7% (cài libmanette) + hatch daemon 27,1% | Tải do **replay apt sau reboot + công việc luồng khác** |
| 4 | 05:55:58Z | 3,17 | (như #3 — replay + ffmpeg tiếp diễn) | Như trên |
| 5 | 05:56:58Z | 3,57 | (như #3 — replay + ffmpeg tiếp diễn) | Như trên |

- **Sau 05:57Z: 0 spike load1 ≥3,0 trong ~118 phút còn lại** (tới 07:55Z) — dù sampler/poller/watcher/T10-waiter vẫn chạy suốt. Stack đo (vài lệnh grep/ps mỗi phút) không sinh tải đo được.
- **Cụm load1 ≥2,0 ngoài spike (sampler 60 s):** 06:04:29Z (2,65) + 06:09:29Z (2,07) — trong cửa sổ attempt2/3 T4 (vite + WebKit của chính attempt); **06:27:31–06:36:32Z (5 mẫu, max 2,73)** — harness T8 chạy WebKit rồi Chromium từ 06:30:50Z (log ram-144t8.log của T8 xác nhận: WebKit phase → CHROMIUM PHASE 06:30:50Z; avail 569–1.571 MB trong cụm). Tất cả đều là công việc thật của các luồng, không phải stack đo.
- **Caveat (F-144-T9-7):** snapshot ps của chính watcher đôi khi tự lọt top (ps 100% CPU lúc chụp — artifact của lệnh ps, không phải tải thật).
- **Hệ quả cho T4/T10:** attempt đo WebKit tự nó là nguồn tải lớn nhất trong cửa sổ yên (WebKitWebProcess + MiniBrowser + vite ≈ 100%+ CPU cộng dồn) — lớp B (load1 max ≤4) vì vậy luôn ở sát ngưỡng khi attempt chạy; 2/3 attempt boot mới chỉ "sống sót" B2 nhờ load1 max 3,15 / 2,90 (theo sampler riêng của T4). Đây là dữ kiện, không phải đề xuất đổi ngưỡng lớp B — T4/T10 cân nhắc.
- **Replay apt os-intent (quan sát độc lập của T9):** wrapper `sh -c` (pid 780, khởi động từ boot) tồn tại suốt lượt; cmdline của nó chứa text `apt-get ...` (chuỗi reseed + replay dài) — **một lệnh `pgrep -f apt` sẽ match wrapper này CẢ KHI không có apt-get nào đang chạy**. Đây là cơ chế giả-dương ứng viên cho B4 của T4 (T4 hậu kiểm §6.1 kết luận tương tự — T9 ghi nhận độc lập, T4/T5 xác nhận). Đồng thời apt-get THẬT cũng chạy theo đợt (quan sát trực tiếp: 05:55:28Z cài libmanette; 07:59Z cài libpipewire-0.3-common, pid 5189) — nên B4 không thể bác bỏ hoàn toàn bằng lý do wrapper; cần T5 đối chiếu nhịp đợt của replay với cửa sổ attempt2/3 (06:03–06:11Z).

### 2.6 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt (sampler T9) | Cuối lượt |
|---|---|---|---|
| 124 | — | — | 1.664 MB |
| 125 | 1.140 MB | 987–2.378 MB | 1.788 MB |
| 126 | 1.247 MB | 834–2.551 MB | 1.666 MB |
| 127 | 547 MB (kỷ lục thấp T5) | 547–2.551 MB; 1.098–1.551 MB | ~1.102 MB |
| 128 | 1.557 MB (brief) | 1.286–1.557 MB (cửa sổ đo của T9, 45 giây) | — (không thuộc T9) |
| 129 | ~1.152 MB (brief) | 908–1.339 MB (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |
| 130 | ~1.025 MB (brief) | 688–1.246 MB (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |
| 131 | ~831 MB (brief; T9 đo trực tiếp 509 MB lúc 14:41:45Z) | 502–546 MB (cửa sổ đo của T9, ~3 phút) | — (không thuộc T9) |
| 132 | 1.095 MB (T9 đo trực tiếp lúc 17:40:33Z) | 857–1.095 MB, rơi đơn điệu (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |
| 133 | ~547 MB (brief; T9 đo trực tiếp 433 MB lúc 20:40:31Z) | 433–512 MB, hơi tăng về cuối (cửa sổ đo của T9, ~2,5 phút) | — (không thuộc T9) |
| 134 | ~1.295 MB (brief; T9 đo trực tiếp 460 MB lúc 23:45:07Z) | 460–2.438 MB theo sampler của T9, hồi mạnh rồi dao động (cửa sổ đo của T9, ~4,5 phút) | — (không thuộc T9) |
| 135 | ~1.177 MB (brief; T9 đo trực tiếp 1.004 MB lúc 02:40:37Z) | 844–1.734 MB theo sampler của T9, hồi giữa lượt rồi lùi (cửa sổ đo của T9, ~3,5 phút) | — (không thuộc T9) |
| 136 | ~1.374 MB (brief; T9 đo trực tiếp 1.406 MB lúc 05:40:43Z) | 1.406–6.081 MB theo sampler của T9, hồi giữa lượt mạnh nhất, rồi lùi về 5.653 MB (cửa sổ đo của T9, ~5,5 phút) | — (không thuộc T9) |
| 137 | — (brief không ghi; T9 đo trực tiếp 861 MB lúc 08:40:27Z, 787 MB lúc 08:41:12Z) | 787–2.123 MB theo sampler của T9, hồi giữa lượt rồi lùi về 1.635 MB (cửa sổ đo của T9, ~7,7 phút) | — (không thuộc T9) |
| 138 | — (brief không ghi; T9 đo trực tiếp 495.600 kB lúc 11:37:48Z, 771.924 kB lúc 11:39:22Z) | 772–6.087 MB (boot cũ, 14 mẫu, 11:39:50–11:52:51Z) rồi 462–1.819 MB (boot mới, 97 mẫu, 11:53:32–13:29:39Z); REBOOT 11:52:20Z cắt giữa hai pha (sampler dài của T9, ~111 phút) | 515 MiB lúc 13:29:39Z |
| 139 | ~547 MB (brief; T9 đo trực tiếp 489.600 kB lúc 14:39:53Z, 634.376 kB lúc 14:40:06Z) | 478–2.607 MB (boot cũ, 74 mẫu, 14:41:57–15:55:02Z) rồi 531–1.529 MB (boot mới, 35 mẫu, 15:57:11–16:31:13Z); REBOOT 15:54:37Z cắt giữa hai pha; gap lấy mẫu ~2'09" (sampler dài của T9, ~109 phút) | 557 MiB lúc 16:31:13Z (1.102 MB lúc 16:32:31Z, sau sampler) |
| 140 | ~0,89 GB (brief không ghi; T9 đo trực tiếp 910.388 kB lúc 17:38:54Z, 835.168 kB lúc 17:39:13Z) | 695–1.146 MiB (boot cũ, 15 mẫu, 17:39:13–17:53:15Z) rồi 463–2.242 MiB (boot mới, 77 mẫu, 17:55:20–19:11:26Z); REBOOT 17:52:56Z cắt giữa hai pha; gap lấy mẫu ~2 phút (sampler dài của T9, ~92 phút) | 523 MiB lúc 19:11:26Z (504 MB lúc 19:12:58Z, sau sampler) |
| 141 | ~0,39 GB (brief không ghi; T9 đo trực tiếp 403.376 kB lúc 20:40:21Z, 978.516 kB lúc 20:40:29Z) | 295–2.860 MiB (boot cũ, 72 mẫu, 20:40:47–21:51:52Z) rồi 564–1.891 MiB (boot mới, 35 mẫu, 21:53:23–22:27:25Z); REBOOT 21:52:21Z cắt giữa hai pha; gap lấy mẫu ~1'31" (sampler dài của T9, ~107 phút) | 592 MiB lúc 22:27:25Z (551 MB lúc 22:30:33Z, sau sampler) |
| 142 | ~0,45 GB (brief không ghi; T9 đo trực tiếp 464.260 kB lúc ~23:40Z, 495.108 kB lúc 23:41:20Z) | 485–1.149 MiB (boot cũ, 13 mẫu, 23:41:37–23:53:38Z) rồi 530–2.992 MiB (boot mới, 100 mẫu, 23:55:26Z–01:34:32Z); REBOOT 23:54:20Z cắt giữa hai pha; gap lấy mẫu ~1'48" (sampler dài của T9, ~113 phút) | 538 MiB lúc 01:34:32Z (576 MB lúc 01:39:26Z, sau sampler) |
| 143 | ~0,41 GB (brief không ghi; T9 đo trực tiếp 417.728 kB lúc 02:40:36Z, 430.000 kB lúc 02:40:53Z) | 419–2.713 MiB (boot cũ, 75 mẫu, 02:41:10–03:55:15Z) rồi 492–2.367 MiB (boot mới, 39 mẫu, 03:56:52–04:34:54Z); REBOOT 03:55:45Z cắt giữa hai pha; gap lấy mẫu ~1'37" (sampler dài của T9, ~114 phút) | 743 MiB lúc 04:34:54Z (630 MB lúc 04:39:44Z, sau sampler) |
| **144** | ****~0,50 GB (brief không ghi; T9 đo trực tiếp 511.164 kB lúc 05:39:12Z, 494.400 kB lúc 05:39:17Z)**** | ****822–2.631 MiB (boot cũ, 15 mẫu, 05:39:42–05:53:44Z) rồi 483–2.878 MiB (boot mới, 120 mẫu, 05:55:28–07:54:38Z); REBOOT 05:53:15Z cắt giữa hai pha; gap lấy mẫu ~1'44"** (sampler dài của T9, ~135 phút)** | ****588 MiB lúc 07:54:38Z**** |

## 3. Guard birefnet — KHÔNG ĐẠT (46,84%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) + đợt 142 + đợt 143 (k) GIỮ NGUYÊN quy trình + guard 6.144 MiB): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này (sampler T9, 135 mẫu, hai vòng): **2.946.832 kB = 2.877,8 MiB = 46,84% guard** lúc **06:12:30Z** (boot mới, balloon 3.948.376 kB) — thiếu **3.344.624 kB (~3.266,2 MiB, ~53,2%)**.
- Không có mẫu nào trên boot cũ vượt 2.694.588 kB (42,83% guard); không có mẫu nào trên boot mới vượt 2.946.832 kB (46,84% guard). **0 mẫu ≥ 6.144 MiB ở bất kỳ vòng nào.** Không có cửa sổ nào để thử. Watcher guard chạy suốt cả hai vòng tới 07:57Z — cờ guard-open.flag KHÔNG xuất hiện (cả hai vòng).
- Đỉnh đợt này (46,84%) cao hơn đợt 143 (44,16%) và đợt 141 (46,55%) nhưng thấp hơn đợt 142 (48,70%); chuỗi đỉnh các đợt 136→144: 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, 2.860 MB, 2.992 MB, 2.778 MB, **2.947 MB**. Vẫn cách guard hơn một nửa — khác hẳn đợt 138 (thiếu 57 MiB).
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Quy trình "thử ngay" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 07:55:38Z, watcher guard chạy suốt cả hai vòng), cửa sổ chỉ không mở.

### 3.1 Sẵn sàng thử đã xác minh lại (05:40Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được (kiểm lại đợt này, khớp đợt 138/139/140/141/142/143).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-144-birefnet/out-birefnet-144.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-144-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc T9 đóng** (kiểm tra `ps` lúc 08:10:06Z; chỉ có tiến trình hệ thống + các luồng đợt 144) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 1.296 chỉ còn ~0,82 vite — **sâu hơn dưới 1 vite đầy đủ**, xem §1.2).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=1296, i=1295; lần 3 i=1194 trên boot mới) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal trên boot mới cc222c8a: **0 dòng "No space left" / ENOSPC** (kiểm tra 08:10:06Z). `journalctl --list-boots` chỉ hiện boot mới cc222c8a (first entry 05:53:31Z) — boot cũ không còn trong journal của cell, như đợt 138/139/140/141/142/143.
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 144 = boot lúc T9 đo đầu:** btime **03:55:45Z** 19/11 (`uptime -s` 03:55:45 + `btime 1795060545` trong `/proc/stat` + boot_id `691a7403-512b-4055-bb55-de0d7516eeeb` + `who -b`: system boot Nov 19 03:55). Đây là boot mới lên sau đợt 143 (đợt 143 đóng trên boot này). **Theo cách đếm chặt (quyết parent (c) đợt 143): 691a7403 = #106? TẠM** (T2-144 chốt).
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9: boot mới cc222c8a, btime 05:53:15Z** (`uptime -s` 05:53:15 + `btime 1795067595` + boot_id `cc222c8a-d8e2-4244-bcbc-1997b4099864` + `who -b`: system boot Nov 19 05:53 + journal first entry 05:53:31Z). Boot cũ sống 03:55:45Z → 05:53:15Z = **1h57m30s**. **T2-144: cc222c8a = ứng viên #107? TẠM** (tiếp sau #106?); reboot này là **#31** theo đếm nối tiếp (#30 là 691a7403 lên thay 70a5b0fc) — T2/T10 chốt số.
- **Khung chết boot cũ: KHÔNG CHỐT ĐƯỢC BẰNG DỮ KIỆN T9 (nghịch lý đồng hồ — xem F-144-T9-2).** Mốc cuối chắc chắn còn sống trên boot cũ theo dữ liệu T9 là mẫu sampler 05:53:44Z (2.694.588 kB) — nhưng mốc này (đồng hồ cũ) MUỘN HƠN btime boot mới 05:53:15Z (đồng hồ mới) 29 giây. Các mốc độc lập trên đồng hồ mới: journal first entry 05:53:31Z; `stat /proc/1` mtime 05:53:30,7Z (process 1 khởi động muộn hơn btime ~15 giây — cùng mẫu đợt 143: /proc/1 muộn hơn btime ~10 giây). T6/T2 là chủ quản chốt khung chết boot 691a7403 — T9 chỉ giao các mốc thô này.
- **Runtime restart đi kèm reboot:** hai phiên exec sleep chờ của T9 bị SIGTERM giết cùng lúc reboot (~05:53Z); sampler vòng 1 (nohup) và watcher vòng 1 + B2 watcher vòng 1 cũng bị giết cùng lúc. T9 khởi động lại sampler vòng 2 + watcher vòng 2 + B2 watcher vòng 2 lúc 05:55:28Z (gap lấy mẫu ~1'44", 05:53:44Z → 05:55:28Z — xem F-144-T9-2). Không mất mẫu nào khác.
- **Replay dpkg: 1.545 dòng lúc T9 mở** (ghi cuối 04:00:38Z `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2` — **y hệt đợt 143**, cùng boot 691a7403). **Replay trên boot mới (theo poll T4): dpkg_lines 539 (05:55:51Z) → 1.256 (05:56:37Z) → 1.497 (05:57:22Z) → 1.545 (05:58:07Z)** — replay dpkg xong ~05:58Z. **NHƯNG replay os-intent (apt-get) vẫn chạy sau đó:** T9 quan sát trực tiếp apt-get cài libmanette lúc 05:55:28Z và cài libpipewire-0.3-common lúc 07:59Z (pid 5189, wrapper pid 780 tồn tại suốt lượt) — hai loại replay khác nhau; **T5 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log + quan sát ps.
- T7-144 chưa có cờ `.done` lúc T9 kiểm tra lần cuối (08:10:06Z) — T10 đối chiếu khi gộp. Các cờ .done lúc T9 đóng: t1, t2, t4, t5, t6, t8 (t7 + t10 chưa có).

## 6. Sai số của chính T9 (ghi rõ)

- **F-144-T9-1 — Headroom VẪN DƯỚI ngưỡng báo < ~1.800 (1.296, thấp hơn ngưỡng 504), lần thứ tư liên tiếp; bước giảm −202 PHÁ DẢI 101–127; tỉ lệ/vite ~0,82 (boot mới 0,76):** hai lần đo chính trên boot 691a7403 là 1.296 và 1.295 (chênh 1), cùng probe, cùng phương pháp — giá trị là thật, không phải sai số đo. Ngưỡng đã chạm ở đợt 141 và user đã được báo trong báo cáo đợt 141; quyết parent đợt 143 (h) VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. T9 không tự nâng mức báo hay yêu cầu user hành động.
- **F-144-T9-2 — Reboot giữa cửa sổ đo + NGHỊCH LÝ ĐỒNG HỒ (mẫu cuối boot cũ 05:53:44Z muộn hơn btime boot mới 05:53:15Z 29 giây):** khoảng trống lấy mẫu 05:53:44Z → 05:55:28Z (~1'44") không có mẫu (vòng 2 khởi động lại 05:55:28Z). Hai phiên exec sleep chờ của T9 bị SIGTERM giết cùng lúc reboot (cùng họ F-143-T10-1 / F-142-T10-1). Mẫu 05:53:44Z được ghi bởi sampler vòng 1 TRƯỚC khi nó chết — đồng hồ boot cũ chạy nhanh hơn đồng hồ boot mới ít nhất ~29 giây (dị thường đồng hồ tới ~32 giây đã ghi nhận trong quyết parent (e) đợt 143 — cùng cỡ). Hệ quả: **khung chết boot 691a7403 không thể chốt bằng dữ kiện T9** (mốc cuối "còn sống" nằm sau mốc "boot mới lên" nếu đọc hai đồng hồ như một). Một lần vượt guard ngắn hơn 104 giây nằm trong khoảng trống này có thể không được quan sát — nhưng khoảng cách tới guard rất lớn (thiếu ~3.266,2 MiB lúc đỉnh) nên khả năng vượt lén là không đáng kể. (Cùng lớp F-143-T9-2.)
- **F-144-T9-3 — Cửa sổ thoáng headroom >20.000 ngay sau boot KHÔNG XUẤT HIỆN ở boot cc222c8a:** đo lần 3 lúc boot ~2 phút 03 giây tuổi dừng ở 1.194, khác đợt 140/142/143 (>20.000 lúc boot ~50–80 giây tuổi), giống đợt 141 (1.719 lúc boot 68 giây tuổi). Ba đợt dùng cùng phương pháp — chênh lệch là thật, không phải sai số đo. Khác biệt có thể do lần 3 đợt này đo muộn hơn (~123 giây tuổi so với ~50–80 giây) — cửa sổ thoáng (nếu có) có thể đã đóng trước khi đo — T9 ghi nhận là **quan sát**, không kết luận cơ chế (tiến trình giữ watch ngoài cell đăng ký lại nhanh hơn sau reboot lần này, hoặc cửa sổ thoáng không tồn tại trên boot này — ngoài tầm xác minh của cell). Giá trị chuỗi vẫn lấy 1.296; 1.194 không đưa vào chuỗi.
- **F-144-T9-4 — Chênh đo 1 (1.296 → 1.295) — LẦN ĐẦU chênh khác 0 sau sáu đợt chênh 0:** hai lần đo cách nhau 9 giây, cùng probe, cùng boot. Chênh 1 watch có thể do một watch ngoài cell được đăng ký/giải phóng giữa hai lần đo — dao động thật ở mức ±1, không phải sai số phương pháp. Giá trị đợt lấy lần đo 1 (1.296) theo quy ước các đợt trước; lấy 1.295 cũng không đổi kết luận (vẫn dưới ngưỡng, vẫn phá dải). Ghi rõ để lần sau không nhầm là "chênh 0" nữa.
- **F-144-T9-5 — Watcher guard vòng 2 (guard-watcher-2.sh, pid 3588) biến mất lặng lẽ giữa 07:56:19Z và 08:00:21Z, không để lại dòng WATCHER END:** lúc 07:56:19Z ps còn thấy process (etime 02:00:51); lúc 08:00:21Z process đã mất, file guard-watcher-2.out 0 byte (không có dòng WATCHER END dù hạn 07:57Z đã qua). Nguyên nhân chưa xác định (không có reboot nào sau 05:53Z). Việc phát hiện guard không phụ thuộc watcher (sampler tự ghi cờ guard-open.flag) — không có cờ guard nào xuất hiện ở cả hai vòng, và sampler vòng 2 chạy tới 07:55:38Z đầy đủ 120 mẫu — không có cửa sổ guard nào bị bỏ sót ngoài gap reboot ở F-144-T9-2. Ghi rõ để lần sau kiểm tra watcher còn sống trước khi đóng.
- **F-144-T9-6 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Đợt này khoảng cách tới guard rất lớn nên khả năng vượt lén là không đáng kể — khác đợt 138 (thiếu 57 MiB). (Cùng lớp F-143-T9-7.)
- **F-144-T9-7 — Snapshot ps của watcher B2 tự lọt vào top process:** trong spike 05:55:28Z, process `ps` của chính watcher ghi 100% CPU (đứng đầu bảng) — artifact của lệnh ps lúc đang sắp xếp theo %cpu, không phải tải thật. Các process còn lại trong snapshot (ffmpeg, apt-get, hatch daemon) là thật. Không ảnh hưởng kết luận §2.5 (nguồn tải là attempt T4 / replay / công việc luồng khác), nhưng ghi rõ để không ai trích "ps 100%" làm bằng chứng tải.
- **F-144-T9-8 — T4-144 có HAI lớp kết quả (0 lượt hợp lệ theo quy tắc; attempt3 đủ điều kiện theo hậu kiểm, chờ parent):** file này trích verdict T4 từ `docs/PHASE9_ROUND144_T4_WEBKIT_QUIET19_LIMITS.md` và chỉ cung cấp dữ kiện sampler độc lập (§2.4–2.5). T9 KHÔNG phán verdict #19 (median 55,0 ms chỉ là số hậu kiểm chờ parent), không phán B4 đúng/sai (cần T5 đối chiếu nhịp replay), không phán B2 attempt1 boot mới (T4 sampler riêng mịn hơn; T9 cadence 60 s chỉ ghi tối đa 2,01 trong cửa sổ đó). T10 đối chiếu khi gộp.
- **F-144-T9-9 — Replay apt-get os-intent VẪN CHẠY lúc T9 đóng (07:59Z, cài libpipewire-0.3-common):** T9 quan sát trực tiếp process apt-get + wrapper pid 780 lúc đóng, nhưng KHÔNG theo dõi liên tục nhịp đợt của replay (chỉ có 2 điểm quan sát: 05:55:28Z libmanette, 07:59Z libpipewire) — không kết luận được apt-get có đang chạy trong từng cửa sổ attempt2/3 (06:03–06:11Z) hay không. Đây là khoảng trống bằng chứng cho câu hỏi B4 của T4 — giao T5-145 đối chiếu log replay theo thời gian.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 145 (phần T9)

1. **⚠️ Headroom VẪN DƯỚI < ~1.800 (1.296, thấp hơn ngưỡng 504) — lần thứ tư liên tiếp dưới ngưỡng** (user đã được báo ở đợt 141; quyết parent đợt 143 (h): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,82 (boot mới 0,76) — sâu hơn dưới 1,0.** Bước giảm −202 PHÁ DẢI 101–127 (kỷ lục mới) + chênh đo lần đầu khác 0 (1) + cửa sổ thoáng sau reboot KHÔNG xuất hiện (1.194 lúc boot ~2 phút tuổi). Tốc độ giảm không đều, không dự báo ngày chạm ngưỡng sâu hơn (chỉ là phép chia số học — KHÔNG phải dự báo). Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell.
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d) + đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) + đợt 142 + đợt 143 (k)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đỉnh đợt này 46,84% guard (thiếu ~3.266,2 MiB) — cao hơn đợt 143 nhưng vẫn cách guard hơn một nửa; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau**.
3. **Balloon đóng băng 6.443.824 kB trong 60/135 mẫu (44,4% cửa sổ)** — **đợt thứ bảy liên tiếp** ở đúng giá trị này; quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" chưa thấy hiệu quả ở đợt 139/140/141/142/143/144 (chỉ xả răng cưa đầu mỗi vòng rồi đóng băng trở lại); nếu đợt 145 vẫn ~500–600 MB thì parent/T10 mới xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A). Quyết parent đợt 139: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB.
4. **Reboot #31 giữa lượt 05:53:15Z, khung chết boot 691a7403 KHÔNG CHỐT ĐƯỢC (nghịch lý đồng hồ 29 giây)** — giao T2/T6 chốt khung bằng nguồn khác; số boot mới cc222c8a (#107? TẠM theo cách đếm chặt) chờ T2/T10 chốt; replay boot mới: dpkg_lines đủ 1.545 lúc 05:58:07Z nhưng replay os-intent vẫn chạy tới ít nhất 07:59Z — giao T5 đợt 145 đối chiếu. **Cửa sổ thoáng sau boot KHÔNG đáng tin:** xuất hiện 3/5 đợt gần nhất, vắng 2/5 đợt (141, 144).
5. **Median tickCost lượt yên #19 (T4): HAI LỚP — chờ quyết parent.** Lớp 1: 0 lượt hợp lệ (poller thoát exit 11, 06:11:55Z). Lớp 2 (hậu kiểm T4): attempt3 boot mới đủ điều kiện, median 55,0 ms. T9 cung cấp dữ kiện sampler độc lập (§2.4–2.5): gate A mở suốt 3 attempt boot mới; B4 cần T5 đối chiếu nhịp replay (F-144-T9-9); B2 attempt1 boot mới cần đối chiếu sampler mịn của T4 (F-144-T9-8). Ngưỡng ≤60 ms giữ.
6. **B2/tải tự sinh: ĐÃ CÓ ĐÁP ÁN SƠ BỘ** — stack đo không sinh tải ≥3,0 ngoài cửa sổ sau boot; tải cao đến từ chính attempt T4 + replay apt sau reboot + công việc luồng khác (§2.5). Giao T4/T10 dùng dữ kiện này khi xét lại lớp B; T9-145 tiếp tục watcher spike để kiểm chứng.
7. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 143 §11: mù #63 mới mở (T2-145: probe #63 + chứng nhận gap + khung chết #103?/b47f7932 bằng merged mù #63), G1 chờ user quyết, R9 (a) số đếm 16, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND144_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (do Phụ lục A+B: bảng sampler đầy đủ 135 mẫu theo yêu cầu brief — không cắt dữ liệu cần thiết) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 138/139/140/141/142/143). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round144-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round144-t9/headroom-measure-1.log` (đo lần 1), `headroom-measure-2.log` (đo lần 2), `headroom-measure-3-postreboot.log` (đo lần 3, boot mới), `ram-sampler-long.log` (vòng 1: 15 mẫu, 05:39:42–05:53:44Z), `ram-sampler-long-2.log` (vòng 2: 120 mẫu, 05:55:28–07:54:38Z), `ram-sampler-long.sh` + `ram-sampler-long-2.sh` (script hai vòng), `guard-watcher.sh` + `guard-watcher-2.sh` (watcher hai vòng), `b2-spike-watch.sh` + `b2-spike-watch-2.sh` + `b2-spikes.log` + `b2-spikes-2.log` (watcher spike B2 hai vòng), `birefnet-readiness.log` (xác minh sẵn sàng, chỉ đọc), `appendix-vong1.md` + `appendix-vong2.md` (bảng sampler đã sinh), `guard-watcher.out` + `guard-watcher-2.out` (log watcher), `b2-spike-watch.out` + `b2-spike-watch-2.out`, `make-appendix.py` — không nằm trong repo nên không stage.
- Cờ `round144-t9.done` đã tạo khi xong.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard).

## Phụ lục A. Bảng sampler đầy đủ — vòng 1 (15 mẫu, 60 s/mẫu, boot 691a7403)

Nguồn: `hidden_files/round144-t9/ram-sampler-long.log` (05:39:42–05:53:44Z, bị SIGTERM giết cùng lúc reboot 05:53:15Z — xem F-144-T9-2). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 1 | 2026-11-19T05:39:42Z | 841820 | 822.1 | 5931128 | 606896 | 1.57 **← min** |
| 2 | 2026-11-19T05:40:42Z | 892072 | 871.2 | 5971196 | 606268 | 0.68 |
| 3 | 2026-11-19T05:41:43Z | 1294044 | 1263.7 | 4670552 | 557204 | 1.51 |
| 4 | 2026-11-19T05:42:43Z | 1278488 | 1248.5 | 4725464 | 610608 | 1.41 |
| 5 | 2026-11-19T05:43:43Z | 1104044 | 1078.2 | 4872056 | 602440 | 1.18 |
| 6 | 2026-11-19T05:44:43Z | 1259596 | 1230.1 | 4751848 | 586456 | 2.17 |
| 7 | 2026-11-19T05:45:43Z | 1515840 | 1480.3 | 4851388 | 585472 | 3.37 |
| 8 | 2026-11-19T05:46:43Z | 1403912 | 1371.0 | 5028200 | 592196 | 1.40 |
| 9 | 2026-11-19T05:47:43Z | 1074100 | 1048.9 | 5197412 | 591560 | 0.97 |
| 10 | 2026-11-19T05:48:43Z | 2474192 | 2416.2 | 3493476 | 605540 | 2.06 |
| 11 | 2026-11-19T05:49:43Z | 2355720 | 2300.5 | 3674420 | 627660 | 1.74 |
| 12 | 2026-11-19T05:50:43Z | 2146992 | 2096.7 | 3909176 | 626568 | 1.14 |
| 13 | 2026-11-19T05:51:43Z | 2069664 | 2021.2 | 4137880 | 621476 | 0.92 |
| 14 | 2026-11-19T05:52:44Z | 2506760 | 2448.0 | 3684692 | 583412 | 1.25 |
| 15 | 2026-11-19T05:53:44Z | 2694588 | 2631.4 | 3488084 | 592600 | 1.16 **← max** |
## Phụ lục B. Bảng sampler đầy đủ — vòng 2 (120 mẫu, 60 s/mẫu, boot cc222c8a)

Nguồn: `hidden_files/round144-t9/ram-sampler-long-2.log` (05:55:28–07:54:38Z, SAMPLER END 07:55:38Z). Số thứ tự nối tiếp vòng 1 (#16–#135). Guard = 6.291.456 kB.
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 16 | 2026-11-19T05:55:28Z | 1465300 | 1431.0 | 4763084 | 939416 | 3.76 |
| 17 | 2026-11-19T05:56:28Z | 1862396 | 1818.7 | 4846240 | 918368 | 2.81 |
| 18 | 2026-11-19T05:57:28Z | 1710324 | 1670.2 | 5061888 | 889432 | 2.66 |
| 19 | 2026-11-19T05:58:28Z | 1635068 | 1596.7 | 5264980 | 882520 | 1.01 |
| 20 | 2026-11-19T05:59:28Z | 1972072 | 1925.9 | 4149132 | 778296 | 2.01 |
| 21 | 2026-11-19T06:00:28Z | 1842776 | 1799.6 | 4102984 | 766348 | 1.49 |
| 22 | 2026-11-19T06:01:29Z | 2275364 | 2222.0 | 4368488 | 766140 | 1.13 |
| 23 | 2026-11-19T06:02:29Z | 2257932 | 2205.0 | 4617888 | 766928 | 0.65 |
| 24 | 2026-11-19T06:03:29Z | 2003940 | 1957.0 | 4093600 | 764952 | 1.33 |
| 25 | 2026-11-19T06:04:29Z | 1705680 | 1665.7 | 4312596 | 761704 | 2.65 |
| 26 | 2026-11-19T06:05:29Z | 2160456 | 2109.8 | 4538060 | 761416 | 1.71 |
| 27 | 2026-11-19T06:06:29Z | 1779896 | 1738.2 | 4771932 | 762568 | 0.73 |
| 28 | 2026-11-19T06:07:29Z | 2921924 | 2853.4 | 3989992 | 750520 | 1.29 |
| 29 | 2026-11-19T06:08:29Z | 2120496 | 2070.8 | 3879008 | 752432 | 1.28 |
| 30 | 2026-11-19T06:09:29Z | 2351704 | 2296.6 | 4123312 | 752888 | 2.07 |
| 31 | 2026-11-19T06:10:30Z | 2302104 | 2248.1 | 4390476 | 753580 | 1.28 |
| 32 | 2026-11-19T06:11:30Z | 1910616 | 1865.8 | 4100080 | 751008 | 1.45 |
| 33 | 2026-11-19T06:12:30Z | 2946832 | 2877.8 | 3948376 | 751608 | 0.89 **← max** |
| 34 | 2026-11-19T06:13:30Z | 2647616 | 2585.6 | 4258884 | 752168 | 0.86 |
| 35 | 2026-11-19T06:14:30Z | 2333180 | 2278.5 | 4538540 | 757732 | 0.91 |
| 36 | 2026-11-19T06:15:30Z | 2086780 | 2037.9 | 4791076 | 757876 | 1.62 |
| 37 | 2026-11-19T06:16:30Z | 1863664 | 1820.0 | 5020008 | 759048 | 0.86 |
| 38 | 2026-11-19T06:17:30Z | 1672856 | 1633.6 | 5227840 | 758916 | 1.02 |
| 39 | 2026-11-19T06:18:30Z | 1474348 | 1439.8 | 5415884 | 751188 | 0.70 |
| 40 | 2026-11-19T06:19:30Z | 1325452 | 1294.4 | 5589268 | 749796 | 0.80 |
| 41 | 2026-11-19T06:20:30Z | 1178640 | 1151.0 | 5737172 | 740824 | 0.72 |
| 42 | 2026-11-19T06:21:30Z | 968684 | 946.0 | 5880036 | 740784 | 0.83 |
| 43 | 2026-11-19T06:22:30Z | 908268 | 887.0 | 6000656 | 737580 | 1.05 |
| 44 | 2026-11-19T06:23:31Z | 1127844 | 1101.4 | 5083152 | 712380 | 1.57 |
| 45 | 2026-11-19T06:24:31Z | 994336 | 971.0 | 5264692 | 712296 | 1.22 |
| 46 | 2026-11-19T06:25:31Z | 840140 | 820.4 | 5391364 | 712048 | 1.14 |
| 47 | 2026-11-19T06:26:31Z | 1368436 | 1336.4 | 5507452 | 709872 | 1.92 |
| 48 | 2026-11-19T06:27:31Z | 698432 | 682.1 | 5545508 | 688084 | 2.73 |
| 49 | 2026-11-19T06:28:31Z | 615212 | 600.8 | 5645440 | 675948 | 2.08 |
| 50 | 2026-11-19T06:29:31Z | 659664 | 644.2 | 5747316 | 673312 | 1.57 |
| 51 | 2026-11-19T06:30:31Z | 600208 | 586.1 | 5845852 | 673624 | 0.88 |
| 52 | 2026-11-19T06:31:31Z | 1263460 | 1233.8 | 4939600 | 629396 | 2.14 |
| 53 | 2026-11-19T06:32:32Z | 2095644 | 2046.5 | 4692100 | 640552 | 1.70 |
| 54 | 2026-11-19T06:33:32Z | 1393400 | 1360.7 | 4689776 | 639632 | 1.56 |
| 55 | 2026-11-19T06:34:32Z | 1346824 | 1315.3 | 4864368 | 647744 | 1.87 |
| 56 | 2026-11-19T06:35:32Z | 1057996 | 1033.2 | 5054768 | 645396 | 2.16 |
| 57 | 2026-11-19T06:36:32Z | 835100 | 815.5 | 5161844 | 639580 | 2.20 |
| 58 | 2026-11-19T06:37:32Z | 882436 | 861.8 | 5307344 | 640948 | 1.36 |
| 59 | 2026-11-19T06:38:32Z | 781000 | 762.7 | 5447036 | 640876 | 0.58 |
| 60 | 2026-11-19T06:39:32Z | 1268532 | 1238.8 | 5604052 | 643468 | 0.62 |
| 61 | 2026-11-19T06:40:32Z | 1136136 | 1109.5 | 5757540 | 646640 | 0.23 |
| 62 | 2026-11-19T06:41:32Z | 1029120 | 1005.0 | 5897104 | 646844 | 0.16 |
| 63 | 2026-11-19T06:42:32Z | 870920 | 850.5 | 6024556 | 660928 | 0.21 |
| 64 | 2026-11-19T06:43:33Z | 756012 | 738.3 | 6139248 | 662504 | 0.39 |
| 65 | 2026-11-19T06:44:33Z | 687864 | 671.7 | 6246572 | 664536 | 0.25 |
| 66 | 2026-11-19T06:45:33Z | 577452 | 563.9 | 6344172 | 667152 | 0.13 |
| 67 | 2026-11-19T06:46:33Z | 494656 | 483.1 | 6429464 | 666688 | 0.08 **← min** |
| 68 | 2026-11-19T06:47:33Z | 532784 | 520.3 | 6443824 | 656808 | 0.54 |
| 69 | 2026-11-19T06:48:33Z | 678084 | 662.2 | 6091060 | 648544 | 0.52 |
| 70 | 2026-11-19T06:49:33Z | 750296 | 732.7 | 6205340 | 648168 | 0.34 |
| 71 | 2026-11-19T06:50:33Z | 657664 | 642.2 | 6309784 | 648296 | 0.19 |
| 72 | 2026-11-19T06:51:33Z | 566236 | 553.0 | 6405572 | 636596 | 0.07 |
| 73 | 2026-11-19T06:52:33Z | 516604 | 504.5 | 6443824 | 636168 | 0.02 |
| 74 | 2026-11-19T06:53:33Z | 532932 | 520.4 | 6443824 | 639636 | 0.17 |
| 75 | 2026-11-19T06:54:33Z | 611340 | 597.0 | 6443824 | 764244 | 0.27 |
| 76 | 2026-11-19T06:55:33Z | 588340 | 574.6 | 6443824 | 766844 | 0.13 |
| 77 | 2026-11-19T06:56:33Z | 574216 | 560.8 | 6443824 | 767024 | 0.11 |
| 78 | 2026-11-19T06:57:34Z | 568576 | 555.2 | 6443824 | 766644 | 0.04 |
| 79 | 2026-11-19T06:58:34Z | 559592 | 546.5 | 6443824 | 766660 | 0.08 |
| 80 | 2026-11-19T06:59:34Z | 578764 | 565.2 | 6443824 | 766008 | 0.21 |
| 81 | 2026-11-19T07:00:34Z | 573664 | 560.2 | 6443824 | 772316 | 0.07 |
| 82 | 2026-11-19T07:01:34Z | 556508 | 543.5 | 6443824 | 772436 | 0.02 |
| 83 | 2026-11-19T07:02:34Z | 553312 | 540.3 | 6443824 | 772528 | 0.16 |
| 84 | 2026-11-19T07:03:34Z | 584488 | 570.8 | 6443824 | 771912 | 0.51 |
| 85 | 2026-11-19T07:04:34Z | 770508 | 752.4 | 6247216 | 737624 | 0.77 |
| 86 | 2026-11-19T07:05:34Z | 691876 | 675.7 | 6354916 | 715840 | 0.41 |
| 87 | 2026-11-19T07:06:34Z | 598464 | 584.4 | 6443824 | 704696 | 0.33 |
| 88 | 2026-11-19T07:07:34Z | 594712 | 580.8 | 6443824 | 704996 | 0.20 |
| 89 | 2026-11-19T07:08:34Z | 592992 | 579.1 | 6443824 | 705396 | 0.75 |
| 90 | 2026-11-19T07:09:34Z | 588584 | 574.8 | 6443824 | 704716 | 0.39 |
| 91 | 2026-11-19T07:10:34Z | 574016 | 560.6 | 6443824 | 705572 | 0.43 |
| 92 | 2026-11-19T07:11:34Z | 587120 | 573.4 | 6443824 | 705956 | 0.16 |
| 93 | 2026-11-19T07:12:35Z | 591944 | 578.1 | 6443824 | 706036 | 0.18 |
| 94 | 2026-11-19T07:13:35Z | 587528 | 573.8 | 6443824 | 706260 | 0.12 |
| 95 | 2026-11-19T07:14:35Z | 601624 | 587.5 | 6443824 | 705180 | 0.17 |
| 96 | 2026-11-19T07:15:35Z | 592308 | 578.4 | 6443824 | 706520 | 0.06 |
| 97 | 2026-11-19T07:16:35Z | 576972 | 563.4 | 6443824 | 706616 | 0.25 |
| 98 | 2026-11-19T07:17:35Z | 578860 | 565.3 | 6443824 | 706656 | 0.37 |
| 99 | 2026-11-19T07:18:35Z | 598540 | 584.5 | 6443824 | 706500 | 0.18 |
| 100 | 2026-11-19T07:19:35Z | 607452 | 593.2 | 6443824 | 705112 | 0.29 |
| 101 | 2026-11-19T07:20:35Z | 601992 | 587.9 | 6443824 | 695388 | 0.57 |
| 102 | 2026-11-19T07:21:35Z | 596036 | 582.1 | 6443824 | 697276 | 0.29 |
| 103 | 2026-11-19T07:22:35Z | 576172 | 562.7 | 6443824 | 697716 | 0.16 |
| 104 | 2026-11-19T07:23:35Z | 561720 | 548.6 | 6443824 | 697920 | 0.06 |
| 105 | 2026-11-19T07:24:35Z | 576096 | 562.6 | 6443824 | 699648 | 0.07 |
| 106 | 2026-11-19T07:25:36Z | 567452 | 554.2 | 6443824 | 702624 | 0.10 |
| 107 | 2026-11-19T07:26:36Z | 556444 | 543.4 | 6443824 | 701256 | 0.11 |
| 108 | 2026-11-19T07:27:36Z | 570932 | 557.6 | 6443824 | 701268 | 0.08 |
| 109 | 2026-11-19T07:28:36Z | 571344 | 558.0 | 6443824 | 701652 | 0.12 |
| 110 | 2026-11-19T07:29:36Z | 575212 | 561.7 | 6443824 | 701732 | 0.31 |
| 111 | 2026-11-19T07:30:36Z | 555936 | 542.9 | 6443824 | 701880 | 0.11 |
| 112 | 2026-11-19T07:31:36Z | 566896 | 553.6 | 6443824 | 702016 | 0.04 |
| 113 | 2026-11-19T07:32:36Z | 565880 | 552.6 | 6443824 | 702488 | 0.01 |
| 114 | 2026-11-19T07:33:36Z | 550912 | 538.0 | 6443824 | 702616 | 0.00 |
| 115 | 2026-11-19T07:34:36Z | 558144 | 545.1 | 6443824 | 702640 | 0.00 |
| 116 | 2026-11-19T07:35:36Z | 576996 | 563.5 | 6443824 | 702272 | 0.22 |
| 117 | 2026-11-19T07:36:36Z | 785492 | 767.1 | 6247216 | 694156 | 0.78 |
| 118 | 2026-11-19T07:37:36Z | 657952 | 642.5 | 6353428 | 682996 | 0.32 |
| 119 | 2026-11-19T07:38:37Z | 579200 | 565.6 | 6443824 | 681552 | 0.11 |
| 120 | 2026-11-19T07:39:37Z | 583312 | 569.6 | 6443824 | 681844 | 0.09 |
| 121 | 2026-11-19T07:40:37Z | 568592 | 555.3 | 6443824 | 686036 | 0.03 |
| 122 | 2026-11-19T07:41:37Z | 544244 | 531.5 | 6443824 | 688968 | 0.01 |
| 123 | 2026-11-19T07:42:37Z | 528308 | 515.9 | 6443824 | 698916 | 0.00 |
| 124 | 2026-11-19T07:43:37Z | 528784 | 516.4 | 6443824 | 697956 | 0.00 |
| 125 | 2026-11-19T07:44:37Z | 540684 | 528.0 | 6443824 | 701012 | 0.10 |
| 126 | 2026-11-19T07:45:37Z | 538380 | 525.8 | 6443824 | 700176 | 0.12 |
| 127 | 2026-11-19T07:46:37Z | 528324 | 515.9 | 6443824 | 700548 | 0.04 |
| 128 | 2026-11-19T07:47:37Z | 525188 | 512.9 | 6443824 | 700360 | 0.10 |
| 129 | 2026-11-19T07:48:37Z | 532860 | 520.4 | 6443824 | 700508 | 0.04 |
| 130 | 2026-11-19T07:49:37Z | 515708 | 503.6 | 6443824 | 700556 | 0.09 |
| 131 | 2026-11-19T07:50:37Z | 519908 | 507.7 | 6443824 | 701532 | 0.03 |
| 132 | 2026-11-19T07:51:38Z | 532500 | 520.0 | 6443824 | 701704 | 0.21 |
| 133 | 2026-11-19T07:52:38Z | 568880 | 555.5 | 6443824 | 681084 | 0.83 |
| 134 | 2026-11-19T07:53:38Z | 561672 | 548.5 | 6443824 | 679144 | 0.30 |
| 135 | 2026-11-19T07:54:38Z | 602476 | 588.4 | 6443824 | 731500 | 0.15 |
