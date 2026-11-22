# LIMITS — Phase 9 đợt 146, T9: headroom inotify + RAM + guard birefnet + B2/tải tự sinh (DƯỚI NGƯỠNG LẦN THỨ SÁU; CỬA SỔ GUARD ĐẦU TIÊN MỞ — 3 MẪU ≥ 6.144 MiB — NHƯNG 0 LẦN THỬ BIREFNET; REBOOT #34 GIỮA CỬA SỔ ĐO)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 880** (đo 2 lần trên boot 98a7c93f btime **09:54:03Z**: 880 lúc 11:37:51Z và **880** lúc 11:37:52Z 19/11, chênh **0**) — **GIẢM TIẾP −194** so với 1.074 đợt 145 (−18,1%). Xem §1.
- **⚠️ VẪN DƯỚI NGƯỠNG BÁO USER (< ~1.800) — thấp hơn ngưỡng 920, lần thứ sáu liên tiếp.** Quyết parent (i) đợt 145: VẪN CHỈ THEO DÕI, không hành động mới — đợt này **KHÔNG báo riêng, không yêu cầu user hành động**; can thiệp host ngoài tầm cell. **Tỉ lệ/vite chỉ còn ~0,56** (đợt 145: 0,68). Xem §1.3, F-146-T9-1.
- **Đo lần 3 sau reboot #34 (boot mới 6fb582df, ~52 giây tuổi): headroom >30.000** (probe chạm cap 30.000 không gặp errno 28) — **CỬA SỔ THOÁNG XUẤT HIỆN TRỞ LẠI** (lần thứ 5 trong 7 đợt gần nhất). T5 đo boot mới lúc +4m30s đã về 784 → cửa sổ chỉ tồn tại ~3,5 phút sau boot. Xem §1.4, F-146-T9-6.
- **Trần inotify ĐỔI NGƯỢC: 63.756 (98a7c93f) → 63.747 (6fb582df)** — flip-flop qua 3 boot (63.747 → 63.756 → 63.747). Chuỗi headroom "bẩn" ±9. Xem §1.4, F-146-T9-5.
- **🔥 CỬA SỔ GUARD ĐẦU TIÊN TRONG CHUỖI T9: 3 mẫu liên tiếp ≥ 6.144 MiB** — 11:51:06Z 6.587.692 kB (104,71%), **11:52:06Z 6.752.292 kB (6.594,0 MiB = 107,32% guard — ĐỈNH MỚI)**, 11:53:06Z 6.316.928 kB (100,40%). Balloon **XẢ HẲN VỀ 0 kB** ở 2 mẫu đỉnh (lần đầu tiên balloon = 0 trong chuỗi T9). Cửa sổ chỉ kéo dài (11:50:06Z, 11:54:06Z] — **tối đa ~4 phút, tối thiểu 2 phút**. T5 đối chiếu độc lập: 2 mẫu ≥ guard (11:51:28Z 6.618.252 kB = 105,2% + 11:52:28Z 6.596.072 kB = 104,8%), balloon 0 lúc 11:51:28Z — khớp. Xem §2, §3.
- **⚠️ Birefnet: 0 LẦN THỬ — cửa sổ mở rồi đóng TRƯỚC khi T9 phát hiện** (phát hiện lúc kiểm 12:02:51Z, ~9–10 phút sau khi cửa sổ đóng ~11:53–11:54Z; RAM lúc phát hiện chỉ 2.769.112 kB = 44% guard — chạy lúc đó sẽ vi phạm guard). Nguyên nhân: chu kỳ kiểm tra của T9 là 10 phút, dài hơn cửa sổ <4 phút. Xem §3, **F-146-T9-1** (sai số chính của đợt — kèm đề xuất nối sampler tự kích hoạt lần thử cho đợt 147).
- **RAM:** đỉnh **107,32% guard** (vòng 1) / 31,28% (vòng 2). Min toàn cửa sổ: **494.312 kB (482,7 MiB) lúc 12:58:20Z** (boot mới). Vòng 1: 36/36 mẫu ≥1024 MiB; vòng 2: chỉ 7/98 mẫu ≥1024 MiB. Xem §2.
- **Balloon virtio:** vòng 1 xả sâu kỷ lục về **0 kB** (11:51–11:52Z) rồi phình lại; vòng 2 **ĐÓNG BĂNG ở 6.443.824 kB trong 67/98 mẫu (68,4%)**, trong đó **62 mẫu liên tục (12:50:20Z–13:51:21Z, ~61 phút tới hết sampler)** — **đợt thứ chín liên tiếp** đóng băng ở đúng giá trị này. Tổng đóng băng 67/134 mẫu (50,0%). Xem §2.2.
- **REBOOT #34 GIỮA CỬA SỔ ĐO: boot 98a7c93f chết, boot mới 6fb582df lên thay, btime 12:13:26Z.** Sampler vòng 1 bị SIGTERM giết cùng lúc (36 mẫu, 11:38:03–12:13:07Z); khởi động lại vòng 2 lúc 12:14:20Z (gap lấy mẫu ~73 giây). Lần này **KHÔNG có nghịch lý đồng hồ** trong dữ kiện T9 (mẫu cuối boot cũ 12:13:07Z TRƯỚC btime boot mới 12:13:26Z 19 giây). Boot cũ sống 09:54:03Z → 12:13:26Z = **2h19m23s (8.363 s)**. Xem §5, F-146-T9-4.
- **B2 / tải tự sinh: 29 spike load1 ≥3,0 cả đợt** (vòng 1: 27, vòng 2: 2): (a) cụm mở 11:38–11:52Z (24 spike, load1 tối đa **15,52** lúc 11:43:35Z) — harness T8 + hai lần import rembg chạy song song (một của chính T9, một không rõ chủ) + grep dài của luồng khác; (b) cụm 12:07–12:08Z (3 spike) — **chính probe attempt2 của T4** (WebKitWebProcess ~76%) → B2 vi phạm, load1_max 4,67 (khớp đúng số T4); (c) cụm 12:15–12:16Z (2 spike) — replay apt trên boot mới (apt-get 94–96%). **Sau 12:16:20Z: 0 spike trong ~95 phút còn lại.** Xem §2.5.
- **Lượt yên WebKit #21 (T4, đợt 146): KHÔNG CÓ LƯỢT HỢP LỆ — lần đầu tiên trong 18 lượt.** Cả 3 attempt đều fail tickCost median (99,0 / 101,0 / 97,0 ms > 60 ms); attempt2 thêm B2 vi phạm; attempt3 bị reboot #34 giết finalization. Cộng dồn giữ nguyên 17 lượt (P1 51/51, P2 42/42, P3-A1 46/51, P3' 23/23, P7 37/37). T9 chỉ cung cấp dữ kiện sampler độc lập (§2.4), không phán verdict #21. Xem §2.3, F-146-T9-8.
- Không có vite/chrome nào đang chạy lúc T9 đóng (kiểm tra lúc 13:52:55Z), không có ENOSPC nào (journal 0 dòng "No space left"/ENOSPC trên boot mới). Replay dpkg trên boot mới: 1.545 dòng lúc 12:16:22Z (boot +2m56s, gói cuối gstreamer1.0-tools 1.24.2-**1ubuntu0.2** — y hệt các đợt trước; khớp T5 "replay nhanh nhất"). T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (cửa sổ đã đóng trước khi phát hiện — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.756 trên boot mở đợt)

### 1.1 Phương pháp

Script `hidden_files/round146-t9/k8-headroom.py` (viết mới đợt này theo đúng phương pháp các đợt trước — script cũ ở `hidden_files/round109-k8/` không còn tìm thấy trên đĩa nên viết lại verbatim theo mô tả đợt 145 §1.1): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. **Khác duy nhất so với probe đợt 145: cap dừng 30.000 watch** (đợt 145 cap 20.000) — chỉ ảnh hưởng lần đo 3 trên boot mới (xem F-146-T9-6). Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.756** trên boot 98a7c93f lúc mở đợt.

### 1.2 Số đo đợt 146 (boot 98a7c93f, btime 09:54:03Z — boot lúc mở đợt)

| Thời điểm (UTC 19/11) | Headroom | Bối cảnh |
|---|---|---|
| 11:37:51Z | **880** | lần đo 1, boot ~1h43'48" tuổi; RAM trước đo 1.319.080 kB, balloon 5.331.412 kB |
| 11:37:52Z | **880** | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 1.294.716 kB, balloon 5.331.412 kB |

- Probe dừng ở `i=880` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe*` không còn).
- Số watch đang giữ ngoài cell suy ra: 63.756 − 880 = **62.876 watch** (tăng ~203 so với 62.673 đợt 145; tăng ~425 so với 62.451 đợt 144).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 880 / 1.578 ≈ **0,56 lần** — sâu hơn dưới 1,0 (đợt 145: 0,68; đợt 144: 0,82). Headroom chỉ còn ~56% nhu cầu một vite dev server đầy đủ.
- Đối chiếu độc lập (T5-146 §6.1, cùng probe K8): **879 lúc mở (11:37:3xZ) → 880 (11:37:4xZ, lưu file)** — T5 đo 879, T9 đo 880 cùng phút mở đợt (chênh 1 watch — sai số pha lấy mẫu, không phải sai số đo); cả hai cùng kết luận dưới ngưỡng lần thứ sáu liên tiếp.
- Lưu ý: RAM trước đo lần 1 là 1.319.080 kB (balloon 5.331.412 kB); headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như mọi đợt trước).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–145 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747 trừ khi ghi khác):

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
| **146** | **880 → 880** | **đo 11:37:51Z → 11:37:52Z, boot 98a7c93f btime 09:54:03Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074 → 880**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 880 = **−3.558 (−80,2%)**. Bước giảm đợt này: −194 so với đợt 145 (−18,1%) — nhỏ hơn hai kỷ lục −202 (đợt 144) và −222 (đợt 145) nhưng vẫn trong dải giảm mạnh; ba đợt gần nhất giảm tổng −618 (−41,2% so với 1.498 đợt 143).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 880, thấp hơn ngưỡng 920, lần thứ sáu liên tiếp.** Quyết parent đợt 145 (i): VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite 0,56 — sâu hơn dưới 1,0.** Headroom chỉ còn ~56% nhu cầu một vite đầy đủ (~1.578 watch). Đây là diễn biến đáng ghi cho parent/T10, nhưng quyết "chỉ theo dõi" vẫn đứng (brief đợt này + quyết parent đợt 141/142/143/144/145); T9 không tự nâng mức báo hay yêu cầu user hành động.
- Trần 63.756 vẫn đầy ở mức ~62,9k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới 6fb582df sau reboot #34 (ngoài chuỗi, chỉ để đối chiếu)

- **Lần 3, 12:14:18Z (boot ~52 giây tuổi, btime 12:13:26Z): probe chạy tới 30.000 watch KHÔNG gặp errno 28** — headroom trên boot mới **>30.000** (cap probe đợt này; xem F-146-T9-6). RAM trước đo 1.929.892 kB, balloon 4.903.712 kB, SwapFree ~1.040.608 kB (swap gần trống sau reboot). File tạm đã dọn sạch. Lần 3 đo đúng trong ~60 giây đầu sau boot như thông lệ (đo lúc 12:14:18Z, boot 52 giây tuổi).
- **CỬA SỔ THOÁNG headroom >30.000 ngay sau boot XUẤT HIỆN TRỞ LẠI** — giống đợt 140/142/143/145 (>20.000 lúc boot ~50–80 giây tuổi), khác đợt 144 (1.194 lúc boot ~123 giây tuổi) và đợt 141 (vắng). Tỉ lệ xuất hiện: **5/7 đợt gần nhất** (140, 142, 143, 145, 146), vắng 2/7 đợt (141, 144).
- **Cửa sổ thoáng đóng rất nhanh:** T5 đo boot mới lúc +4m30s (12:17Z) đã về **784**, cuối đợt 772 — tức cửa sổ >30.000 chỉ tồn tại **~3,5 phút sau boot**. Trên boot 98a7c93f, T5 đo mở 879/880 lúc 11:37Z (boot đã ~1h43' tuổi) — không có lần đo sớm nào trên boot đó để đối chiếu.
- **Trần trên boot mới: 63.747** (đọc lúc đo lần 3, xác nhận lại 13:52:55Z) — **đổi ngược so với 63.756 trên boot cũ (−9)**. Chuỗi trần qua 3 boot: 63.747 (e146ca67) → 63.756 (98a7c93f) → 63.747 (6fb582df). Xem F-146-T9-5.
- **Không đưa >30.000 vào chuỗi §1.3** — chuỗi lấy giá trị ổn định trên boot lúc mở đợt (880, đo 2 lần chênh 0). Giá trị lần 3 chỉ là quan sát đối chiếu sau reboot.
- Hệ quả thực hành: **cửa sổ thoáng sau boot KHÔNG đáng tin** — xuất hiện ở 5/7 đợt gần nhất, vắng ở 2/7 đợt, và khi xuất hiện thì đóng trong ~3,5 phút; reboot KHÔNG reset chuỗi suy giảm headroom — giá trị ổn định của đợt vẫn lấy trên boot mở đợt. Với đà giảm (ba đợt gần nhất −202, −222, −194), các đợt sau sẽ đi sâu hơn dưới ngưỡng nếu không can thiệp host (chỉ là phép chia số học minh họa — KHÔNG phải dự báo).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler dài 134 mẫu, 11:38:03Z–13:51:21Z

### 2.1 Hình dạng cửa sổ: vòng 1 đỉnh guard kỷ lục rồi cắt bởi reboot; vòng 2 rơi đơn điệu về vùng trũng rồi đóng băng

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 11:38:03–12:13:07Z, 36 mẫu, boot 98a7c93f — bị SIGTERM giết cùng lúc reboot #34 12:13:26Z (xem F-146-T9-4). Vòng 2: 12:14:20–13:51:21Z, 98 mẫu, boot mới 6fb582df — chạy tới khi T9 chủ động dừng lúc 13:51:36Z.** Tổng **134 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 494.312 kB (482,7 MiB) lúc 12:58:20Z (boot mới). Max toàn cửa sổ: 6.752.292 kB (6.594,0 MiB) lúc 11:52:06Z (boot cũ) — 107,32% guard.** Mean vòng 1 3.507,3 MiB; mean vòng 2 650,6 MiB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot 98a7c93f (36 mẫu, 11:38:03–12:13:07Z) — RAM hồi mạnh, balloon xả hẳn về 0, đỉnh guard kỷ lục, rồi rơi về vùng trũng trước reboot:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 11:38:03Z | 1.284,8 MiB (1.315.544 kB) | mẫu đầu (balloon 5.069.268 kB; load1 4,60 — cụm spike mở, xem §2.5) |
| 11:39:03–11:41:04Z | 1.478,9 → 1.211,3 MiB | dao động trong cụm spike mở (T8 harness + 2 import rembg + grep dài); **MIN vòng 1 1.211,3 MiB (1.240.420 kB) lúc 11:41:04Z** |
| 11:42:04–11:44:05Z | 1.416,1 → 1.992,6 MiB | leo dần dù load1 13,54–15,24 (cao nhất đợt); balloon xả 4.237.184 → 3.725.508 kB |
| 11:45:05–11:46:05Z | 1.775,6 → 2.586,1 MiB | hồi tiếp; balloon xả 3.955.440 → 3.260.632 kB |
| 11:47:05Z | 4.213,3 MiB (4.314.068 kB) | nhảy vọt: balloon xả sâu 3.260.632 → **1.481.644 kB** trong 1 phút |
| 11:48:06Z | 5.992,0 MiB (6.134.612 kB) | 97,51% guard — sát guard; balloon 564.140 kB |
| 11:49:06Z | 5.629,9 MiB (5.764.860 kB) | nhích xuống (balloon 912.236 kB) |
| 11:50:06Z | 6.036,3 MiB (6.181.212 kB) | 98,25% guard — vẫn dưới guard; balloon 434.324 kB |
| 11:51:06Z | **6.431,3 MiB (6.587.692 kB)** | **≥ guard lần 1 (104,71%) — balloon 0 kB (lần đầu = 0 trong chuỗi T9)**; load1 5,06 |
| 11:52:06Z | **6.594,0 MiB (6.752.292 kB)** | **MAX toàn cửa sổ, 107,32% guard — balloon 0 kB**; load1 3,64 |
| 11:53:06Z | 6.168,9 MiB (6.316.928 kB) | **≥ guard lần 3 (100,40%)** — balloon 393.144 kB; load1 2,06 |
| 11:54:06–11:59:06Z | 5.719,4 → 3.962,0 MiB | rơi khỏi guard; balloon phình lại 785.980 → 2.745.668 kB |
| 12:00:06–12:03:06Z | 2.751,0 → 2.587,2 MiB | trong cửa sổ attempt1 T4 (11:59–12:03Z); balloon phình 3.089.944 → 4.022.632 kB |
| 12:04:06Z | 4.430,6 MiB (4.536.980 kB) | nhô lại (balloon xả 2.266.848 kB) — giữa attempt1 và attempt2 |
| 12:05:06–12:10:06Z | 4.179,3 → 2.343,7 MiB | rơi dần trong cửa sổ attempt2 T4 (12:06–12:10Z); balloon phình 2.528.992 → 4.145.464 kB |
| 12:11:06Z | 3.675,2 MiB (3.764.440 kB) | nhô (balloon xả 3.056.732 kB) — đầu cửa sổ probe attempt3 |
| 12:12:06–12:13:07Z | 2.640,0 → 2.283,0 MiB | rơi lại; mẫu cuối vòng 1 lúc 12:13:07Z (balloon 3.563.960 kB); sampler bị giết cùng reboot ngay sau đó |

- **36/36 mẫu ≥1024 MiB** (cả vòng 1 trên gate A). **29 mẫu ≥2.000.000 kB. 3 mẫu ≥ guard** (11:51/11:52/11:53Z).
- Balloon vòng 1: 5.069.268 kB (mẫu đầu) → xả đơn điệu gần như liên tục xuống **min 0 kB lúc 11:51:06Z và 11:52:06Z (xả hẳn — lần đầu trong chuỗi T9)** → phình lại 4.022.632 kB lúc 12:03:06Z → dao động răng cưa 2,27–4,15M tới hết vòng → **0 mẫu đóng băng 6.443.824 kB**.
- Load1 vòng 1: 0,41–15,24 (max 15,24 lúc 11:43:04Z — cụm spike mở; xem §2.5). 14/36 mẫu load1 ≥3,0.
- Swap: SwapFree 634.044 kB lúc mẫu đầu → 784.672 kB lúc mẫu cuối vòng 1 (swap đang dùng ~240 MB).

**Boot mới 6fb582df (98 mẫu, 12:14:20–13:51:21Z) — đỉnh ở mẫu đầu rồi rơi đơn điệu về vùng trũng, balloon đóng băng tới hết:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 12:14:20Z | 1.921,7 MiB (1.967.840 kB) | mẫu đầu sau reboot (**MAX vòng 2, 31,28% guard**; balloon 4.903.712 kB; SwapFree 1.040.608 kB — swap gần trống); load1 2,62 (replay apt — xem §2.5) |
| 12:15:20–12:18:20Z | 1.776,7 → 1.602,9 MiB | **chuỗi 5 mẫu liên tục ≥1024 MiB (#1–#5)** — chuỗi ≥1024 dài nhất vòng 2 |
| 12:19:20Z | 986,2 MiB (1.009.812 kB) | rơi dưới gate A |
| 12:20:20–12:22:20Z | ~0,6–0,9 GB | dưới gate A; balloon phình 5,4M → 5,48M |
| 12:23:20Z | 1.303,7 MiB (1.334.884 kB) | **mẫu lẻ ≥1024 MiB** (nhô một mẫu rồi rơi lại) |
| 12:24:20–12:34:20Z | ~0,6–1,2 GB | dao động dưới gate A; load1 0,03–3,34 |
| 12:35:20Z | 1.172,3 MiB (1.200.612 kB) | **mẫu lẻ ≥1024 MiB thứ hai** |
| 12:36:20–12:40:20Z | ~0,5–0,7 GB | rơi về vùng trũng |
| 12:41:20–12:45:20Z | ~0,5–0,6 GB | **đợt đóng băng 1**: balloon 6.443.824 kB (**5 mẫu liên tục**) |
| 12:46:20–12:49:20Z | ~0,5–0,8 GB | xả nhẹ (balloon 6.168.148–6.375.180 kB) |
| 12:50:20Z–13:51:21Z | ~0,48–0,65 GB | **đợt đóng băng 2**: balloon 6.443.824 kB (**62 mẫu liên tục tới hết sampler**, ~61 phút); **MIN toàn cửa sổ 482,7 MiB (494.312 kB) lúc 12:58:20Z** |
| 13:51:21Z | 515,5 MiB (527.848 kB) | mẫu cuối (balloon đóng băng 6.443.824 kB); T9 chủ động dừng sampler 13:51:36Z |

- **7/98 mẫu vòng 2 ≥1024 MiB** (chuỗi 5 đầu + 2 mẫu lẻ); sau 12:35:20Z, **0 mẫu vượt 1.048.576 kB trong 76 phút cuối**. **0 mẫu ≥2.000.000 kB** vòng 2.
- Load1 vòng 2: 0,00–3,34 (max 3,34 lúc 12:16:20Z — replay apt; xem §2.5). Nửa sau cửa sổ (13:00–13:51Z) load1 0,00–0,10 mà RAM vẫn phẳng ~0,51–0,53 GB: RAM thấp không phải do tải trong cell.
- Swap: SwapFree 1.040.608 kB (mẫu đầu vòng 2) → 801.872 kB lúc cuối (swap đang dùng ~240 MB sau ~97 phút).

### 2.2 Balloon virtio — xả hẳn về 0 kB (lần đầu) rồi đóng băng y hệt 8 đợt trước

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 5.069.268 kB (11:38:03Z) → xả đơn điệu gần như liên tục xuống **min 0 kB lúc 11:51:06Z và 11:52:06Z (xả hẳn 100% — lần đầu tiên balloon = 0 trong toàn bộ chuỗi T9/T5)** → phình lại 4.022.632 kB rồi dao động răng cưa tới hết vòng 1 → **0 mẫu đóng băng 6.443.824 kB vòng 1**.
- Boot mới: 4.903.712 kB (12:14:20Z) → xả **min 4.787.900 kB lúc 12:16:20Z** → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 67 mẫu** (2 đợt: 12:41:20–12:45:20Z 5 mẫu; 12:50:20Z–13:51:21Z **62 mẫu liên tục** — ~61 phút tới hết sampler) → không xả bền tới hết sampler.
- Tổng: balloon đóng băng 6.443.824 kB trong **67/134 mẫu (50,0% cửa sổ)** — 67/98 mẫu vòng 2 (68,4%). Giá trị 6.443.824 kB lặp lại y hệt qua **chín đợt (138 + 139 + 140 + 141 + 142 + 143 + 144 + 145 + 146)** và nhiều boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (mẫu đầu 11:38:03Z → mẫu cuối 13:51:21Z): balloon 5.069.268 kB → 6.443.824 kB = **+1.374.556 kB** (phình ròng). Lúc đóng (13:52:55Z, sau sampler): balloon 6.443.824 kB, RAM 491.256 kB (479,8 MiB).
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 146 THẤY XẢ HẲN MỘT LẦN (về 0 kB lúc 11:51–11:52Z) nhưng xả không bền:** balloon phình lại ngay trong vòng 1 và đóng băng trở lại suốt vòng 2 (62 mẫu liên tục). Đây là **đợt thứ chín liên tiếp** balloon đóng băng ở đúng giá trị này. Quyết parent đợt 139 đã ghi: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 147.
- Số học lúc đỉnh RAM 11:52:06Z: tổng RAM 8.124.900 kB − balloon 0 kB = 8.124.900 kB còn lại cho hệ thống; trong đó MemAvailable 6.752.292 kB + free/cache ~1,37 GB. Lúc cuối cửa sổ 13:51:21Z: tổng RAM − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 527.848 kB.
- Đối chiếu T5-146: T5 sampler riêng series 1 (37 mẫu, 11:37–12:13Z, cửa sổ khác) ghi **0/37 mẫu ghim trần** (đợt thứ ba liên tiếp T5 ghi 0: đợt 144: 0/53, đợt 145: 0/40, đợt 146: 0/37) — không mâu thuẫn với T9 (0/36 vòng 1): hai sampler cùng cửa sổ vòng 1 đều ghi 0 ghim; balloon T9 bắt đầu đóng băng từ 12:41:20Z, **sau khi sampler T5 series 1 đã kết thúc** (series 2 của T5: 9/40 mẫu ghim — cửa sổ khác, khớp hướng).

### 2.3 Lượt yên WebKit #21 (T4, đợt 146) — KHÔNG CÓ LƯỢT HỢP LỆ (lần đầu trong 18 lượt)

- **T4-146 ĐÃ xuất bản LIMITS trước khi T9 đóng:** `docs/PHASE9_ROUND146_T4_WEBKIT_QUIET21_LIMITS.md`. T9 chỉ trích verdict, không tự đo tickCost (không thuộc phạm vi T9).
- **Attempt1-98a7c93f (11:59:13–12:03:07Z): 20/20 exit 0, lớp B ĐẠT 5/5, NHƯNG tickCost median 99,0 ms** (n=411; post-flip 100,0; p90 137,0; max 281; min 53) > 60 ms → KHÔNG ĐẠT. (c2)=0.
- **Attempt2-98a7c93f (12:06:24–12:10:24Z): 20/20 exit 0, NHƯNG lớp B VI PHẠM B2 (load1_max=4,67 > 4) VÀ tickCost median 101,0 ms** (n=398; post-flip 102,0) > 60 ms → KHÔNG ĐẠT. (c2)=0.
- **Attempt3-98a7c93f (probe 12:11:13–12:13:13Z): probe 20/20 hoàn tất, lớp B hậu kiểm ĐẠT 5/5, NHƯNG tickCost median 97,0 ms** (n=425; post-flip 98,5) > 60 ms → KHÔNG ĐẠT. (c2)=0. Finalization bị reboot #34 giết — T4 đã chạy hậu kiểm bằng tay.
- **Số cộng dồn KHÔNG ĐỔI (vẫn 17 lượt hợp lệ):** P1 **51/51**, P2 **42/42**, P3-A1 **46/51**, P3' **23/23**, P7 **37/37**. Chuỗi median 17 lượt giữ nguyên 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / 58,0 ms. Ba median đợt này (99,0 / 101,0 / 97,0) đều đứng ngoài chuỗi. **Lần đầu tiên trong 18 lượt: không có attempt nào đạt.** Điều tra (c2) vẫn ĐÓNG, verdict "ghost-freeze ĐƯỢC ỦNG HỘ MẠNH" đứng nguyên — 0 occurrence không ủng hộ cũng không bác.
- **Chậm là hệ thống, không phải tải (kết luận của T4, T9 chỉ ghi dữ kiện ủng hộ):** attempt3 chạy YÊN (load1 0,71–1,54 cả lượt theo T4; sampler T9 ghi 0,71 lúc 12:12:06Z và 1,42 lúc 12:13:07Z) vẫn median 97 ms; min tick 52–54 ms (so với 31 ms ở #20). Nghi boot/host 98a7c93f — cần quyết parent / điều tra (T4 §10).
- **Đợt 147 đo lại #21 trên boot mới 6fb582df** (đề xuất T4 §10(a) — để phân biệt chậm do boot 98a7c93f vs chậm hệ thống).

### 2.4 Dữ kiện sampler T9 trong cửa sổ attempt của T4 (độc lập, cadence 60 s)

| Attempt | Cửa sổ (UTC) | Boot | load1 (T9) | RAM (T9) | Ghi chú |
|---|---|---|---|---|---|
| 1 | 11:59:13–12:03:07Z | 98a7c93f | 2,13 / 2,53 / 1,03 / 0,41 | 2.751,0 → 2.587,2 MiB | 4 mẫu; RAM ≥1024 cả 4 mẫu; load1 T9 tối đa 2,53 — T4 sampler riêng ghi max 2,76 (khớp trong sai số cadence) |
| 2 | 12:06:24–12:10:24Z | 98a7c93f | 2,20 / **4,67** / 2,16 / 0,79 | 2.630,8 → 2.343,7 MiB | 4 mẫu; RAM ≥1024 cả 4 mẫu; **load1 4,67 lúc 12:08:06Z khớp ĐÚNG load1_max=4,67 của T4** → B2 vi phạm được sampler độc lập xác nhận |
| 3 (probe) | 12:11:13–12:13:13Z | 98a7c93f | 0,71 / 1,42 | 2.640,0 → 2.283,0 MiB | 2 mẫu; RAM ≥1024 cả 2 mẫu; load1 T9 tối đa 1,42 — T4 ghi 1,54 (khớp trong sai số cadence); RAM min T9 2.283,0 MiB nằm trong dải 2.252–3.582 MB của T4 |

- Attempt1 chạy hoàn toàn trong chuỗi 36 mẫu liên tục ≥1024 MiB vòng 1 (11:38:03–12:13:07Z) — gate A mở rộng rãi. **0 spike load1 ≥3,0 của watcher B2 trong cửa sổ attempt1 và attempt3** (spike gần nhất trước attempt1: 11:52:08Z; spike đầu tiên trong attempt2: 12:07:38Z) — attempt1 "sạch" về B2 nhưng vẫn fail tickCost (99,0 ms), ủng hộ kết luận chậm hệ thống của T4.
- T9 KHÔNG phán verdict #21 (đã có file T4-146: KHÔNG CÓ LƯỢT HỢP LỆ), không phán B4/B2 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — tải tự sinh của stack đo: CÓ, NHƯNG KHÔNG PHẢI TỪ STACK ĐO (khẳng định lại đợt 145)

**Câu hỏi mở từ đợt 143/144/145:** sampler T9 có thấy tải tự sinh không? Trả lời đợt 146: **CÓ tải tự sinh trong cửa sổ đo — nhưng nguồn không phải stack đo (sampler/poller/watcher), mà là (a) harness T8 + hai lần import rembg chạy song song + grep dài, (b) chính probe attempt2 của T4, (c) replay apt sau reboot.** Stack đo (sampler/poller/watcher) không sinh load1 ≥3,0 lần nào — trừ artifact `ps` của chính watcher trong snapshot (xem caveat dưới).

Bằng chứng — watcher spike (ngưỡng load1 ≥3,0, kiểm tra mỗi 30 s; tổng **29 spike** cả đợt: vòng 1: 27, vòng 2: 2):

| Cụm | Thời điểm (UTC) | load1 | Process gây tải (ps snapshot) | Kết luận |
|---|---|---|---|---|
| A (24 spike) | 11:38:03–11:52:08Z | 3,26–15,52 (max **15,52** lúc 11:43:35Z — cao nhất đợt) | WebKitWebProcess ~25–30% + MiniBrowser ~15–20% + vite :5560 (T8 clicktest) + **import rembg của T9 28% (pid 21050) + import rembg thứ hai 26–27% (pid 25714, không rõ chủ)** + `grep -rln probe DEAD detected` 17–30% (pid 19079, chạy ~6 phút) + `find` của T2 | Tải do **harness T8 + hai import rembg song song + grep dài**; một phần từ **chính T9** (xem F-146-T9-2) và một import không rõ chủ (F-146-T9-3) |
| B (3 spike) | 12:07:38–12:08:38Z | 3,38 / **4,67** / 3,56 | WebKitWebProcess **74,5–75,9%** + MiniBrowser ~39% + vite (T4 attempt2: clicktest-87o8 node + vite :5187) | Tải do **chính probe attempt2 của T4** → B2 vi phạm (load1_max 4,67 > 4); sampler T9 ghi đúng 4,67 lúc 12:08:06Z |
| C (2 spike) | 12:15:50Z + 12:16:20Z | 3,31 / 3,34 | apt-get **94–96%** (replay trên boot mới, parent `sh` pid 784) | Tải do **replay apt sau reboot #34** (T5 là chủ quản; dpkg.log đủ 1.545 dòng lúc 12:16:22Z) |

- **Sau 12:16:20Z: 0 spike load1 ≥3,0 trong ~95 phút còn lại** (tới 13:51:21Z) — dù sampler/watcher vẫn chạy suốt và T7/T10 còn làm việc. Stack đo (vài lệnh grep/ps mỗi phút) không sinh tải đo được.
- **Cụm load1 ≥2,0 ngoài spike (sampler 60 s):** vòng 1: 11:39:03Z (2,68) — đuôi cụm A; 11:51:06Z (5,06) + 11:52:06Z (3,64) — trong cụm A, đúng lúc cửa sổ guard (xem §3: cửa sổ guard mở WHILE load cao — balloon xả là sự kiện host, không phải do tải trong cell giảm). Vòng 2: 12:14:20Z (2,62) + 12:15:20Z (2,65) — đuôi cụm C (replay apt). Tất cả đều là công việc thật của các luồng / replay, không phải stack đo.
- **Caveat (cùng lớp F-144-T9-7 / F-145-T9-5):** snapshot ps của chính watcher đôi khi tự lọt top (`ps` 100% lúc 12:08:08Z — artifact của lệnh ps, không phải tải thật; `ps` 33,3–50% ở vài snapshot khác trong cụm A). Giá trị load1 vẫn là thật (đọc từ /proc/loadavg, không qua ps).
- **Hệ quả cho T4/T10:** attempt2 #21 vi phạm B2 vì chính probe WebKit của attempt (WebKitWebProcess + MiniBrowser ≈ 115% CPU cộng dồn) — giống mẫu đợt 145 (harness T8 là nguồn tải lớn nhất); attempt1 và attempt3 "sạch" B2 nhưng vẫn fail tickCost ~100 ms → chậm không phải do tải (kết luận T4 §0/§5, dữ kiện T9 ủng hộ). Đây là dữ kiện, không phải đề xuất đổi ngưỡng lớp B — T4/T10 cân nhắc.

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
| 144 | ~0,50 GB (brief không ghi; T9 đo trực tiếp 511.164 kB lúc 05:39:12Z, 494.400 kB lúc 05:39:17Z) | 822–2.631 MiB (boot cũ, 15 mẫu, 05:39:42–05:53:44Z) rồi 483–2.878 MiB (boot mới, 120 mẫu, 05:55:28–07:54:38Z); REBOOT 05:53:15Z cắt giữa hai pha; gap lấy mẫu ~1'44" (sampler dài của T9, ~135 phút) | 588 MiB lúc 07:54:38Z |
| 145 | ~1,36 GB (brief không ghi; T9 đo trực tiếp 1.375.964 kB lúc 08:42:53Z, 1.394.232 kB lúc 08:43:01Z) | 419–3.773 MiB (boot cũ, 72 mẫu, 08:43:01–09:54:09Z) rồi 528–1.953 MiB (boot mới, 75 mẫu, 09:55:21–11:09:28Z); REBOOT 09:54:03Z cắt giữa hai pha; gap lấy mẫu ~72 giây (sampler dài của T9, ~147 phút) | 576 MiB lúc 11:09:28Z |
| **146** | ****~1,28 GB (brief không ghi; T9 đo trực tiếp 1.319.080 kB lúc 11:37:51Z, 1.315.544 kB lúc 11:38:03Z)**** | ****1.211–6.594 MiB (boot cũ, 36 mẫu, 11:38:03–12:13:07Z) rồi 483–1.922 MiB (boot mới, 98 mẫu, 12:14:20–13:51:21Z); REBOOT 12:13:26Z cắt giữa hai pha; gap lấy mẫu ~73 giây** (sampler dài của T9, ~133 phút)** | ****515,5 MiB lúc 13:51:21Z**** |

## 3. Guard birefnet — CỬA SỔ ĐẦU TIÊN MỞ (107,32%) NHƯNG 0 LẦN THỬ (ĐÃ ĐÓNG TRƯỚC KHI PHÁT HIỆN)

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) + đợt 142 + đợt 143 (k) + đợt 144 (n) + đợt 145 (l) GIỮ NGUYÊN quy trình + guard 6.144 MiB): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- **CỬA SỔ GUARD ĐẦU TIÊN TRONG CHUỖI T9 (đợt 136–146): 3 mẫu liên tiếp ≥ guard** (sampler T9, cadence 60 s, boot 98a7c93f):
  - 11:51:06Z — **6.587.692 kB = 6.431,3 MiB = 104,71% guard** (balloon 0 kB; load1 5,06)
  - 11:52:06Z — **6.752.292 kB = 6.594,0 MiB = 107,32% guard** (balloon 0 kB; load1 3,64) — **ĐỈNH MỚI, vượt guard 460.836 kB (450,0 MiB)**
  - 11:53:06Z — **6.316.928 kB = 6.168,9 MiB = 100,40% guard** (balloon 393.144 kB; load1 2,06)
  - Biên cửa sổ: mẫu trước 11:50:06Z 6.181.212 kB (98,25% — dưới guard) và mẫu sau 11:54:06Z 5.854.996 kB (93,06% — dưới guard) → cửa sổ nằm trong (11:50:06Z, 11:54:06Z]: **tối thiểu 2 phút (11:51:06–11:53:06Z), tối đa <4 phút**.
- Đối chiếu T5-146 (sampler riêng, cadence/cửa sổ khác): **2 mẫu ≥ guard** (11:51:28Z 6.618.252 kB = 105,2% + 11:52:28Z 6.596.072 kB = 104,8%), balloon 0 kB lúc 11:51:28Z — khớp hoàn toàn về sự kiện (khác nhau do pha lấy mẫu: đỉnh T9 6.752.292 kB lúc 11:52:06Z cao hơn đỉnh T5 6.618.252 kB lúc 11:51:28Z vì RAM rơi nhanh trong cửa sổ).
- **Birefnet: 0 LẦN THỬ.** Cửa sổ mở 11:51–11:53Z và đóng ~11:53–11:54Z; T9 phát hiện cờ guard-open.flag lúc kiểm 12:02:51Z — **~9–10 phút sau khi cửa sổ đóng**; RAM lúc phát hiện chỉ 2.769.112 kB (44,03% guard). Chạy birefnet lúc đó sẽ vi phạm guard (thiếu ~3.522.344 kB) nên KHÔNG chạy. Đây là lần đầu tiên cửa sổ guard mở trong 11 đợt (136–146) — và là lần đầu tiên quy trình "thử ngay" không thực thi được vì cửa sổ ngắn hơn chu kỳ kiểm tra của người vận hành. Xem **F-146-T9-1** (đề xuất tự động hóa cho đợt 147).
- Không có mẫu nào trên boot mới vượt 1.967.840 kB (31,28% guard). **Tổng cộng: 3 mẫu ≥ 6.144 MiB trong toàn đợt (cả 3 đều trong cửa sổ 11:51–11:53Z).**
- Chuỗi đỉnh các đợt 136→146 (theo sampler T9): 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, 2.860 MB, 2.992 MB, 2.778 MB, 2.947 MB, 3.863 MB, **6.752 MB**. Đợt 146 phá kỷ lục đỉnh RAM của chuỗi — lần đầu vượt guard.
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói — nhưng lần đầu tiên điều kiện guard đã thỏa (dù chỉ ~2–4 phút). Quy trình "thử ngay" cần được tự động hóa (xem §7 nợ 1 + F-146-T9-1): nếu cửa sổ mở lại ở đợt 147, sampler phải tự kích hoạt lần thử thay vì chờ người vận hành kiểm tra theo chu kỳ.

### 3.1 Sẵn sàng thử đã xác minh lại (11:38–11:43Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại (symlink → /usr/bin/python3.12); `rembg 2.0.87`, `onnxruntime 1.23.2` import được — **xác minh lần cuối đợt 145; đợt này import check CHƯA HOÀN THÀNH** (xem F-146-T9-2: T9 kill tiến trình import của mình lúc 11:43:45Z sau ~5 phút chạy ở ~28% CPU để tránh ô nhiễm cửa sổ attempt của T4; một import song song khác cũng chưa xong — F-146-T9-3). File và phiên bản lấy theo đợt 145 (không đổi trên đĩa).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — cửa sổ đã đóng trước khi phát hiện): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-146-birefnet/out-birefnet-146.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-146-birefnet/` đã tạo sẵn, trống. (Lưu ý: thư mục `~/workspace/tmp-t9-145-birefnet/` đợt trước không còn trên đĩa lúc kiểm đợt này — chỉ còn tới `tmp-t9-144-birefnet`; không ảnh hưởng gì vì các thư mục này đều trống.)
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc T9 đóng** (kiểm tra `ps` lúc 13:52:55Z; 0 process vite/chrome/chromium/webkit/MiniBrowser) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 880 chỉ còn ~0,56 vite — **sâu hơn dưới 1 vite đầy đủ**, xem §1.2).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=880, i=880; lần 3 trên boot mới không gặp errno 28 tới 30.000 watch) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal trên boot mới 6fb582df: **0 dòng "No space left" / ENOSPC** (kiểm tra 13:52:55Z, từ 12:13:26Z).
- Steal CPU trên boot mới (tích lũy từ btime tới lúc đóng): `/proc/stat` cpu steal 2.790 / 2.364.472 tick ≈ **0,12%** (T4 đo 0,38% lúc 12:17:08Z, boot ~3 phút tuổi, 335/88.064 tick — hai cửa sổ khác nhau, cùng kết luận: steal nhỏ, không giải thích được chậm ~100 ms của #21).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 146 = boot lúc T9 đo đầu:** btime **09:54:03Z** 19/11 (`uptime -s` 09:54:03 + `btime 1795082043` trong `/proc/stat` + boot_id `98a7c93f-83d3-40e5-8043-ee6dda19c5f1` + `who -b`: system boot Nov 19 09:54). Đây là boot mới lên sau đợt 145 (reboot #33, quyết parent (g) đợt 145 đã xác nhận; **98a7c93f = #109? chặt**).
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9 — #34: boot mới 6fb582df, btime 12:13:26Z** (`uptime -s` 12:13:26 + `btime 1795090406` + boot_id `6fb582df-455d-47cd-99dc-8bef48018536` + `who -b`: system boot Nov 19 12:13 + `stat /proc/1` mtime 12:13:42Z, chênh +16 s — cùng mẫu các đợt trước). Boot cũ sống 09:54:03Z → 12:13:26Z = **2h19m23s (8.363 s)**. **T2-146: 6fb582df = ứng viên #110? TẠM** (tiếp sau #109?; T5-146 §1 ghi #110? TẠM — đếm chặt); reboot này là **#34** theo đếm nối tiếp (#33 là 98a7c93f lên thay e146ca67) — T2/T10 chốt số.
- **Khung chết boot cũ (98a7c93f): dữ kiện thô T9 — mẫu sampler cuối cùng trên boot cũ 12:13:07Z** (2.338.232 kB, load1 1,42); mẫu đầu boot mới 12:14:20Z. **Lần này KHÔNG có nghịch lý đồng hồ trong dữ kiện T9** (mẫu cuối boot cũ 12:13:07Z TRƯỚC btime boot mới 12:13:26Z 19 giây — thứ tự đúng). T4 ghi clock skew ~23 s theo hướng ngược lại (attempt-done 12:13:49Z đồng hồ cũ vs btime 12:13:26Z đồng hồ mới) và cửa sổ chết (12:13:15Z, 12:13:26Z] theo đồng hồ boot mới — T9 không tự chốt khung, giao T2/T6 (T4 §10(d)).
- **Runtime restart đi kèm reboot:** phiên exec sleep chờ của T9 bị SIGTERM giết cùng lúc reboot (~12:13:5x, sau ~40 giây chờ — xem F-146-T9-4); sampler vòng 1 (nohup) và B2 watcher vòng 1 cũng bị giết cùng lúc. T9 khởi động lại sampler vòng 2 + B2 watcher vòng 2 lúc 12:14:20Z (gap lấy mẫu ~73 giây, 12:13:07Z → 12:14:20Z — xem F-146-T9-4). Không mất mẫu nào khác.
- **Replay dpkg: 1.545 dòng lúc T9 mở** (ghi cuối 08:00:09Z `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2` — **y hệt đợt 143/144/145**, cùng boot 98a7c93f). T5-146: replay boot 98a7c93f **xong hẳn trước khi T5 mở** (1545/221, bracket boot +43s → +4m14s, postboot PASS poll=2, cờ 11:37:57Z). **Replay trên boot mới (quan sát T9): dpkg.log đủ 1.545 dòng lúc 12:16:22Z (boot +2m56s, gói cuối y hệt)** — replay xong trên cả hai boot; apt-get THẬT vẫn chạy theo đợt sau reboot (12:15:50Z + 12:16:20Z apt-get 94–96% CPU, wrapper `sh` pid 784 tồn tại suốt lượt) — hai loại replay khác nhau (dpkg log đóng băng sớm, os-intent chạy tiếp); **T5 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".** T5-146: replay boot mới **NHANH NHẤT (+2m56s)**, postboot PASS, cờ mới 12:17:25Z poll=2.
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log + quan sát ps.
- Các cờ .done lúc T9 đóng (13:52Z): t1, t2, t4, t5, t6, t8 (t7 chưa có — waiter vẫn chạy; t10 chưa có — waiter vẫn chạy).

## 6. Sai số của chính T9 (ghi rõ)

- **F-146-T9-1 — CỬA SỔ GUARD ĐẦU TIÊN MỞ NHƯNG 0 LẦN THỬ BIREFNET (sai số chính của đợt):** 3 mẫu liên tiếp ≥ guard 11:51:06–11:53:06Z (đỉnh 6.752.292 kB = 107,32% guard, balloon 0 kB) — cửa sổ chỉ kéo dài tối thiểu 2 phút, tối đa <4 phút (biên (11:50:06Z, 11:54:06Z]). T9 phát hiện cờ guard-open.flag lúc kiểm 12:02:51Z, ~9–10 phút sau khi cửa sổ đóng; RAM lúc phát hiện chỉ 2.769.112 kB (44,03% guard) nên không thể chạy (vi phạm guard). Nguyên nhân trực tiếp: **chu kỳ kiểm tra thủ công của T9 là 10 phút (sleep 600 s), dài hơn cửa sổ <4 phút** — quy trình "thử ngay" theo quyết (l) không thể thực thi bằng kiểm tra thủ công ở cadence đó. Giá trị cửa sổ là thật (3 mẫu T9 + 2 mẫu T5 độc lập, cùng balloon 0 kB). Đề xuất cho đợt 147 (giao parent/T10 quyết): **nối sampler tự kích hoạt** — khi một mẫu ≥ guard xuất hiện, sampler (hoặc một watcher riêng) chạy ngay lệnh birefnet đã chuẩn bị (§3.1) dưới lockfile dùng một lần, ghi log đầy đủ; nếu cửa sổ chỉ kéo dài ~2–4 phút thì đây là cách duy nhất bắt kịp. Phương án dự phòng: T9 giữ chu kỳ kiểm tra ≤60 s trong lúc sampler chạy (tốn lượt nhưng bắt được cửa sổ ≥2 phút). T9 không tự đổi quy trình — chờ quyết.
- **F-146-T9-2 — Import rembg của chính T9 góp tải cụm spike mở + import check chưa hoàn thành:** lệnh kiểm tra `import rembg, onnxruntime` của T9 (pid 21050) chạy **~5 phút ở ~28% CPU** (11:38–11:43:45Z) trong cụm spike mở (load1 tới 15,52). T9 **kill tiến trình này lúc 11:43:45Z** để tránh ô nhiễm cửa sổ attempt của T4 (poller T4 mở cửa 11:59:10Z — import đã chết trước đó ~15 phút nên không ảnh hưởng attempt). Hệ quả: **import check đợt này chưa hoàn thành** — sẵn sàng birefnet (§3.1) ghi theo file hiện hữu + phiên bản đã xác minh đợt 145 (rembg 2.0.87, onnxruntime 1.23.2), không phải theo lần import thành công đợt này. Bài học: kiểm tra import (nặng, chậm dưới tải) nên chạy TRƯỚC khi các luồng khác bắt đầu harness, hoặc bỏ qua khi file/phiên bản đã xác minh nhiều đợt liên tiếp.
- **F-146-T9-3 — Import rembg thứ hai không rõ chủ chạy song song:** tiến trình `python -c import rembg` (pid 25714, parent bash 25712) chạy ~27% CPU từ ~11:41Z tới khi chết theo reboot #34 (~12:13Z), song song với import của T9. Chủ sở hữu không xác định được (parent đã chết theo reboot; không có dòng log nào ghi chủ) — ghi rõ là không quy được chủ, không gán cho bất kỳ luồng nào. Hai import cùng lúc làm chậm lẫn nhau (cả hai đều chưa xong sau nhiều phút dưới tải 1,5 CPU chia sẻ). Nếu luồng nào đó cũng kiểm tra sẵn sàng birefnet thì nên ghi rõ chủ trong LIMITS của mình để lần sau không trùng.
- **F-146-T9-4 — Reboot #34 giữa cửa sổ đo + gap lấy mẫu 73 giây:** sampler vòng 1 chết cùng reboot (mẫu cuối 12:13:07Z); vòng 2 khởi động lại 12:14:20Z (gap 12:13:07Z → 12:14:20Z = 73 giây, cùng cỡ gap 72 giây đợt 145). Phiên exec sleep chờ 300 s của T9 bị SIGTERM giết cùng lúc reboot (cùng họ F-145-T9-2 / F-144-T9-2). Một lần vượt guard ngắn hơn 73 giây nằm trong gap này có thể không được quan sát — nhưng RAM lúc 12:13:07Z chỉ 2.338.232 kB và lúc 12:14:20Z 1.967.840 kB, cách guard ~4,3M kB, nên khả năng vượt lén trong gap là không đáng kể. Lần này không có nghịch lý đồng hồ trong dữ kiện T9 (xem §5).
- **F-146-T9-5 — Trần inotify đổi ngược giữa hai boot: 63.756 (98a7c93f) → 63.747 (6fb582df), −9:** lần thứ hai trần thay đổi trong chuỗi T9 (đợt 145: +9; đợt 146: −9). Chuỗi trần qua 3 boot: 63.747 → 63.756 → 63.747. Trần đọc trực tiếp từ `/proc/sys/fs/inotify/max_user_watches` lúc đo lần 3 (12:14:18Z) và xác nhận lại 13:52:55Z — là thật, không phải sai số đọc. Không ảnh hưởng giá trị headroom đợt này (880 lấy trên boot mở đợt với trần 63.756); chênh ±9 watch không đổi bất kỳ kết luận nào (dưới ngưỡng, tỉ lệ/vite). T10 lưu ý khi đối chiếu chuỗi dài: headroom là hiệu số tuyệt đối (trần − watch ngoài cell), trần khác nhau giữa các boot làm chuỗi kém "sạch" hơn ±9 — ghi rõ để lần sau không nhầm là lỗi đo.
- **F-146-T9-6 — Headroom lần 3 >30.000 là giới hạn dưới, không phải giá trị chính xác:** probe đợt này cap 30.000 watch (đợt 145 cap 20.000) — lần 3 chạm cap mà không gặp errno 28 nên chỉ khẳng định **>30.000**, không biết giá trị thật (có thể 35.000 hay 60.000). Không đưa vào chuỗi §1.3. T5 đo boot mới lúc +4m30s đã về 784 → cửa sổ thoáng đóng trong ~3,5 phút sau boot. Cap khác nhau giữa các đợt làm các lần đo 3 không so sánh trực tiếp được với nhau ngoài tính chất "có/không có cửa sổ thoáng" — ghi rõ để lần sau thống nhất cap (đề xuất: giữ cap 30.000 từ đợt này trở đi).
- **F-146-T9-7 — Khoảng trống lấy mẫu 60 giây + gap reboot 73 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu (hoặc trong gap reboot 73 giây) có thể không được quan sát. "3 mẫu ≥ guard" (kết luận §3) nghĩa đúng là **3 mẫu quan sát được ≥ guard**, không phải chứng minh tuyệt đối "chỉ có 3 thời điểm vượt". Ngược lại, đợt này đã quan sát được cửa sổ thật — khác các đợt trước chỉ ghi "0 mẫu ≥ guard". (Cùng lớp F-145-T9-7.)
- **F-146-T9-8 — T9 KHÔNG phán verdict #21 (đã có file T4-146: KHÔNG CÓ LƯỢT HỢP LỆ, median 99,0 / 101,0 / 97,0 ms):** file này trích verdict T4 từ `docs/PHASE9_ROUND146_T4_WEBKIT_QUIET21_LIMITS.md` và chỉ cung cấp dữ kiện sampler độc lập (§2.4–2.5). T9 KHÔNG phán B4 đúng/sai, không phán B2 (T4 sampler riêng mịn hơn; T9 cadence 60 s chỉ ghi tối đa 2,53 trong cửa sổ attempt1 — khớp max 2,76 của T4 — và ghi đúng 4,67 trong attempt2, khớp max 4,67 của T4). T10 đối chiếu khi gộp.
- **F-146-T9-9 — pkill của T9 tự giết session exec của mình khi dừng sampler:** lệnh `pkill -f "round146-t9/sampler.sh"` khớp luôn dòng lệnh của chính shell gọi pkill (SIGTERM, exec chết sau 8 ms) — sampler và watcher vẫn sống (chúng là tiến trình khác). T9 dừng sampler/watcher bằng `kill` theo PID (2079/2080) sau đó; mẫu cuối 13:51:21Z đầy đủ, tổng 134 mẫu, không mất mẫu nào. Bài học: dừng tiến trình nền bằng PID, không dùng pkill -f với pattern trùng tên script.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước (viết lại verbatim — script cũ không còn trên đĩa, xem §1.1); file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 147 (phần T9)

1. **🔥 CỬA SỔ GUARD ĐÃ MỞ LẦN ĐẦU (3 mẫu ≥ guard, đỉnh 107,32%) NHƯNG 0 LẦN THỬ — tự động hóa việc thử cho đợt 147 (F-146-T9-1):** chờ quyết parent/T10 — hoặc (a) nối sampler tự kích hoạt lệnh birefnet khi mẫu ≥ guard (lockfile dùng một lần, log đầy đủ), hoặc (b) T9 giữ chu kỳ kiểm tra ≤60 s trong lúc sampler chạy. Nếu không đổi gì, cửa sổ ~2–4 phút sẽ lại bị lỡ. Guard giữ nguyên 6.144 MiB (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d) + ... + đợt 145 (l)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Lệnh thử + thư mục output đã chuẩn bị sẵn (§3.1); import check cần chạy lại trọn vẹn đợt 147 (F-146-T9-2).
2. **⚠️ Headroom 880 — VẪN DƯỚI < ~1.800, lần thứ sáu liên tiếp dưới ngưỡng** (user đã được báo ở đợt 141; quyết parent đợt 145 (i): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,56 — sâu hơn dưới 1,0.** Bước giảm −194; ba đợt gần nhất giảm tổng −618. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. Trần flip-flop 63.747 → 63.756 → 63.747 qua 3 boot — chuỗi "bẩn" ±9 (F-146-T9-5).
3. **Balloon đóng băng 6.443.824 kB — đợt thứ chín liên tiếp** (67/134 mẫu đợt này, 68,4% vòng 2; đợt đóng băng dài 62 mẫu liên tục ~61 phút tới hết sampler); **nhưng đã thấy xả hẳn về 0 kB một lần** (11:51–11:52Z — lần đầu trong chuỗi). Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" nay có một lần xả thật nhưng không bền; giữ nguyên gate A ≥1024 MB theo quyết (k) đợt 145; T4 không tự ý hạ ngưỡng gate A.
4. **Lượt yên #21 KHÔNG có lượt hợp lệ (lần đầu trong 18 lượt)** — 3 attempt fail tickCost median ~100 ms trên boot 98a7c93f dù attempt1/attempt3 sạch B2; T4 đề xuất đo lại #21 trên boot mới 6fb582df ở đợt 147 để phân biệt chậm do boot vs chậm hệ thống (T4 §10(a)); nợ T4-147 thêm cổng tickCost vào poller (F-146-T4-1). T9 đối chiếu sampler khi đó như thường lệ.
5. **Reboot #34 giữa lượt (btime 12:13:26Z), khung chết boot 98a7c93f giao T2-146/T10** — dữ kiện thô T9: mẫu cuối boot cũ 12:13:07Z, gap lấy mẫu 73 s, không có nghịch lý đồng hồ trong dữ kiện T9 (T4 ghi skew ~23 s + cửa sổ chết (12:13:15Z, 12:13:26Z]); số boot mới 6fb582df = #110? TẠM theo đếm chặt; gap danh nghĩa 8.363 s chờ T2-146 chứng nhận (mù #65 đã mở từ reboot #33; reboot #34 mở mù #66? — giao T2-146).
6. **Cửa sổ thoáng headroom sau boot (>30.000 lúc boot ~52 giây tuổi) xuất hiện trở lại** — 5/7 đợt gần nhất, nhưng đóng trong ~3,5 phút (T5 đo 784 lúc +4m30s) — vẫn KHÔNG đáng tin làm cơ chế; thống nhất cap probe 30.000 từ đợt này (F-146-T9-6).
7. Các nợ đứng khác giữ nguyên từ đợt 145 §11 (mù #65 + khung chết #106?/#107? đã chốt, quyết (j) đã cập nhật, watchdog chưa được thử bằng kẹt thật — đợt thứ năm liên tiếp, G1 khung (a) M2 vẫn hoãn chờ user, R9 (a) vẫn chờ user, ci-security.yml vẫn 403 chờ user, file oversize 6,4 MB vẫn chưa quyết, TTS 39 cấm kiểm lại, run 144 TIMEOUT + run 145 chạy muộn +187 s — chỉ ghi nhận là dữ kiện).

## Phụ lục A — Bảng sampler đầy đủ vòng 1 (boot 98a7c93f, 36 mẫu, 11:38:03–12:13:07Z)

(File gốc: `hidden_files/round146-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)


| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|
| 1 | 2026-11-19T11:38:03Z | 1,315,544 | 1284.7 | 20.91% | 5,069,268 | 634,044 | 4.60 |
| 2 | 2026-11-19T11:39:03Z | 1,515,624 | 1480.1 | 24.09% | 5,183,312 | 638,008 | 2.68 |
| 3 | 2026-11-19T11:40:03Z | 1,277,344 | 1247.4 | 20.30% | 4,642,200 | 632,100 | 1.59 |
| 4 | 2026-11-19T11:41:04Z | 1,240,420 | 1211.3 | 19.72% | 4,580,840 | 639,348 | 5.87 |
| 5 | 2026-11-19T11:42:04Z | 1,450,156 | 1416.2 | 23.05% | 4,237,184 | 672,480 | 13.54 |
| 6 | 2026-11-19T11:43:04Z | 1,707,496 | 1667.5 | 27.14% | 3,993,400 | 685,096 | 15.24 |
| 7 | 2026-11-19T11:44:05Z | 2,040,204 | 1992.4 | 32.43% | 3,725,508 | 686,600 | 14.56 |
| 8 | 2026-11-19T11:45:05Z | 1,818,124 | 1775.5 | 28.90% | 3,955,440 | 684,940 | 6.70 |
| 9 | 2026-11-19T11:46:05Z | 2,648,216 | 2586.1 | 42.09% | 3,260,632 | 687,736 | 5.50 |
| 10 | 2026-11-19T11:47:05Z | 4,314,068 | 4213.0 | 68.57% | 1,481,644 | 681,600 | 5.20 |
| 11 | 2026-11-19T11:48:06Z | 6,134,612 | 5990.8 | 97.51% | 564,140 | 682,528 | 3.26 |
| 12 | 2026-11-19T11:49:06Z | 5,764,860 | 5629.7 | 91.63% | 912,236 | 683,908 | 3.79 |
| 13 | 2026-11-19T11:50:06Z | 6,181,212 | 6036.3 | 98.25% | 434,324 | 684,412 | 4.19 |
| 14 | 2026-11-19T11:51:06Z | 6,587,692 | 6433.3 | 104.71% | 0 | 685,352 | 5.06 |
| 15 | 2026-11-19T11:52:06Z | 6,752,292 | 6594.0 | 107.32% | 0 | 685,948 | 3.64 |
| 16 | 2026-11-19T11:53:06Z | 6,316,928 | 6168.9 | 100.40% | 393,144 | 689,684 | 2.06 |
| 17 | 2026-11-19T11:54:06Z | 5,854,996 | 5717.8 | 93.06% | 785,980 | 690,236 | 1.52 |
| 18 | 2026-11-19T11:55:06Z | 5,624,256 | 5492.4 | 89.40% | 1,178,684 | 769,632 | 1.43 |
| 19 | 2026-11-19T11:56:06Z | 5,237,804 | 5115.0 | 83.25% | 1,571,816 | 804,816 | 1.04 |
| 20 | 2026-11-19T11:57:06Z | 4,843,612 | 4730.1 | 76.99% | 1,959,652 | 805,184 | 0.80 |
| 21 | 2026-11-19T11:58:06Z | 4,438,668 | 4334.6 | 70.55% | 2,352,840 | 805,368 | 0.66 |
| 22 | 2026-11-19T11:59:06Z | 4,051,180 | 3956.2 | 64.39% | 2,745,668 | 805,368 | 0.54 |
| 23 | 2026-11-19T12:00:06Z | 2,816,844 | 2750.8 | 44.77% | 3,089,944 | 804,708 | 2.13 |
| 24 | 2026-11-19T12:01:06Z | 2,578,036 | 2517.6 | 40.98% | 3,392,340 | 804,652 | 2.53 |
| 25 | 2026-11-19T12:02:06Z | 2,769,112 | 2704.2 | 44.01% | 3,720,628 | 804,672 | 1.03 |
| 26 | 2026-11-19T12:03:06Z | 2,649,276 | 2587.2 | 42.11% | 4,022,632 | 804,744 | 0.41 |
| 27 | 2026-11-19T12:04:06Z | 4,536,980 | 4430.6 | 72.11% | 2,266,848 | 784,964 | 1.34 |
| 28 | 2026-11-19T12:05:06Z | 4,278,740 | 4178.5 | 68.01% | 2,528,992 | 784,984 | 0.83 |
| 29 | 2026-11-19T12:06:06Z | 3,853,540 | 3763.2 | 61.25% | 2,922,208 | 785,008 | 0.48 |
| 30 | 2026-11-19T12:07:06Z | 2,693,908 | 2630.8 | 42.82% | 3,276,684 | 786,156 | 2.20 |
| 31 | 2026-11-19T12:08:06Z | 2,243,032 | 2190.5 | 35.65% | 3,565,924 | 786,452 | 4.67 |
| 32 | 2026-11-19T12:09:06Z | 2,548,924 | 2489.2 | 40.51% | 3,852,056 | 787,360 | 2.16 |
| 33 | 2026-11-19T12:10:06Z | 2,400,336 | 2344.1 | 38.15% | 4,145,464 | 787,412 | 0.79 |
| 34 | 2026-11-19T12:11:06Z | 3,764,440 | 3676.2 | 59.83% | 3,056,732 | 784,568 | 0.79 |
| 35 | 2026-11-19T12:12:06Z | 2,706,384 | 2643.0 | 43.02% | 3,273,336 | 784,600 | 0.71 |
| 36 | 2026-11-19T12:13:07Z | 2,338,232 | 2283.4 | 37.17% | 3,563,960 | 784,672 | 1.42 |

## Phụ lục B — Bảng sampler đầy đủ vòng 2 (boot 6fb582df, 98 mẫu, 12:14:20–13:51:21Z)

(File gốc: `hidden_files/round146-t9/ram-sampler.log` — bảng dưới đây trích đúng file đó.)


| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | % guard | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|---|
| 1 | 2026-11-19T12:14:20Z | 1,967,840 | 1921.7 | 31.28% | 4,903,712 | 1,040,608 | 2.62 |
| 2 | 2026-11-19T12:15:20Z | 1,819,128 | 1776.5 | 28.91% | 5,098,120 | 910,496 | 2.65 |
| 3 | 2026-11-19T12:16:20Z | 1,965,620 | 1919.6 | 31.24% | 4,787,900 | 850,224 | 3.34 |
| 4 | 2026-11-19T12:17:20Z | 1,841,188 | 1798.0 | 29.26% | 5,016,588 | 856,600 | 1.44 |
| 5 | 2026-11-19T12:18:20Z | 1,640,584 | 1602.1 | 26.08% | 5,224,880 | 857,080 | 1.07 |
| 6 | 2026-11-19T12:19:20Z | 1,009,812 | 986.1 | 16.05% | 5,412,288 | 859,172 | 1.54 |
| 7 | 2026-11-19T12:20:20Z | 1,028,060 | 1004.0 | 16.34% | 5,207,612 | 791,712 | 1.92 |
| 8 | 2026-11-19T12:21:20Z | 931,956 | 910.1 | 14.81% | 5,361,664 | 785,968 | 1.11 |
| 9 | 2026-11-19T12:22:20Z | 818,184 | 799.0 | 13.00% | 5,484,516 | 766,104 | 2.68 |
| 10 | 2026-11-19T12:23:20Z | 1,334,884 | 1303.6 | 21.22% | 5,600,996 | 758,800 | 1.65 |
| 11 | 2026-11-19T12:24:20Z | 635,456 | 620.6 | 10.10% | 5,720,252 | 714,408 | 1.46 |
| 12 | 2026-11-19T12:25:20Z | 660,432 | 645.0 | 10.50% | 5,811,752 | 689,972 | 2.16 |
| 13 | 2026-11-19T12:26:20Z | 568,300 | 555.0 | 9.03% | 5,905,244 | 687,460 | 0.85 |
| 14 | 2026-11-19T12:27:20Z | 960,836 | 938.3 | 15.27% | 5,992,804 | 685,208 | 0.42 |
| 15 | 2026-11-19T12:28:20Z | 639,764 | 624.8 | 10.17% | 5,616,456 | 636,948 | 0.88 |
| 16 | 2026-11-19T12:29:20Z | 773,464 | 755.3 | 12.29% | 5,509,100 | 640,444 | 1.02 |
| 17 | 2026-11-19T12:30:20Z | 529,384 | 517.0 | 8.41% | 5,573,464 | 639,880 | 1.86 |
| 18 | 2026-11-19T12:31:20Z | 798,180 | 779.5 | 12.69% | 5,691,740 | 631,972 | 2.45 |
| 19 | 2026-11-19T12:32:20Z | 563,828 | 550.6 | 8.96% | 5,469,020 | 636,284 | 1.79 |
| 20 | 2026-11-19T12:33:20Z | 717,700 | 700.9 | 11.41% | 5,580,932 | 637,652 | 1.09 |
| 21 | 2026-11-19T12:34:20Z | 604,360 | 590.2 | 9.61% | 5,691,632 | 644,068 | 0.82 |
| 22 | 2026-11-19T12:35:20Z | 1,085,304 | 1059.9 | 17.25% | 5,816,072 | 647,808 | 0.52 |
| 23 | 2026-11-19T12:36:20Z | 998,204 | 974.8 | 15.87% | 5,951,156 | 652,196 | 0.23 |
| 24 | 2026-11-19T12:37:20Z | 887,028 | 866.2 | 14.10% | 6,076,616 | 652,620 | 0.16 |
| 25 | 2026-11-19T12:38:20Z | 799,288 | 780.6 | 12.70% | 6,190,636 | 655,720 | 0.09 |
| 26 | 2026-11-19T12:39:20Z | 739,088 | 721.8 | 11.75% | 6,296,576 | 653,304 | 0.03 |
| 27 | 2026-11-19T12:40:20Z | 616,760 | 602.3 | 9.80% | 6,395,652 | 654,780 | 0.07 |
| 28 | 2026-11-19T12:41:20Z | 570,512 | 557.1 | 9.07% | 6,443,824 | 655,152 | 0.06 |
| 29 | 2026-11-19T12:42:20Z | 553,880 | 540.9 | 8.80% | 6,443,824 | 665,188 | 0.22 |
| 30 | 2026-11-19T12:43:20Z | 526,784 | 514.4 | 8.37% | 6,443,824 | 666,264 | 0.08 |
| 31 | 2026-11-19T12:44:20Z | 532,528 | 520.0 | 8.46% | 6,443,824 | 680,164 | 0.12 |
| 32 | 2026-11-19T12:45:20Z | 516,064 | 504.0 | 8.20% | 6,443,824 | 683,948 | 0.66 |
| 33 | 2026-11-19T12:46:20Z | 799,628 | 780.9 | 12.71% | 6,050,608 | 664,828 | 0.50 |
| 34 | 2026-11-19T12:47:20Z | 792,308 | 773.7 | 12.59% | 6,168,148 | 666,032 | 0.22 |
| 35 | 2026-11-19T12:48:20Z | 675,736 | 659.9 | 10.74% | 6,276,132 | 665,604 | 0.22 |
| 36 | 2026-11-19T12:49:20Z | 615,332 | 600.9 | 9.78% | 6,375,180 | 660,556 | 0.14 |
| 37 | 2026-11-19T12:50:20Z | 531,968 | 519.5 | 8.46% | 6,443,824 | 661,292 | 0.05 |
| 38 | 2026-11-19T12:51:20Z | 519,104 | 506.9 | 8.25% | 6,443,824 | 654,008 | 0.05 |
| 39 | 2026-11-19T12:52:20Z | 542,640 | 529.9 | 8.63% | 6,443,824 | 654,676 | 0.17 |
| 40 | 2026-11-19T12:53:20Z | 527,280 | 514.9 | 8.38% | 6,443,824 | 653,264 | 0.06 |
| 41 | 2026-11-19T12:54:20Z | 517,344 | 505.2 | 8.22% | 6,443,824 | 656,288 | 0.08 |
| 42 | 2026-11-19T12:55:20Z | 502,288 | 490.5 | 7.98% | 6,443,824 | 657,288 | 0.03 |
| 43 | 2026-11-19T12:56:20Z | 524,376 | 512.1 | 8.33% | 6,443,824 | 657,788 | 0.01 |
| 44 | 2026-11-19T12:57:20Z | 494,512 | 482.9 | 7.86% | 6,443,824 | 657,060 | 0.15 |
| 45 | 2026-11-19T12:58:20Z | 494,312 | 482.7 | 7.86% | 6,443,824 | 654,548 | 0.05 |
| 46 | 2026-11-19T12:59:21Z | 496,624 | 485.0 | 7.89% | 6,443,824 | 654,988 | 0.08 |
| 47 | 2026-11-19T13:00:21Z | 500,612 | 488.9 | 7.96% | 6,443,824 | 661,432 | 0.11 |
| 48 | 2026-11-19T13:01:21Z | 503,232 | 491.4 | 8.00% | 6,443,824 | 661,940 | 0.04 |
| 49 | 2026-11-19T13:02:21Z | 511,088 | 499.1 | 8.12% | 6,443,824 | 662,252 | 0.01 |
| 50 | 2026-11-19T13:03:21Z | 503,784 | 492.0 | 8.01% | 6,443,824 | 661,636 | 0.00 |
| 51 | 2026-11-19T13:04:21Z | 508,692 | 496.8 | 8.09% | 6,443,824 | 663,084 | 0.06 |
| 52 | 2026-11-19T13:05:21Z | 526,588 | 514.2 | 8.37% | 6,443,824 | 667,420 | 0.02 |
| 53 | 2026-11-19T13:06:21Z | 509,988 | 498.0 | 8.11% | 6,443,824 | 667,996 | 0.01 |
| 54 | 2026-11-19T13:07:21Z | 514,620 | 502.6 | 8.18% | 6,443,824 | 667,376 | 0.03 |
| 55 | 2026-11-19T13:08:21Z | 524,392 | 512.1 | 8.33% | 6,443,824 | 667,428 | 0.05 |
| 56 | 2026-11-19T13:09:21Z | 507,380 | 495.5 | 8.06% | 6,443,824 | 667,484 | 0.29 |
| 57 | 2026-11-19T13:10:21Z | 513,808 | 501.8 | 8.17% | 6,443,824 | 667,652 | 0.10 |
| 58 | 2026-11-19T13:11:21Z | 509,044 | 497.1 | 8.09% | 6,443,824 | 667,756 | 0.04 |
| 59 | 2026-11-19T13:12:21Z | 513,368 | 501.3 | 8.16% | 6,443,824 | 668,032 | 0.01 |
| 60 | 2026-11-19T13:13:21Z | 508,424 | 496.5 | 8.08% | 6,443,824 | 668,780 | 0.00 |
| 61 | 2026-11-19T13:14:21Z | 622,720 | 608.1 | 9.90% | 6,443,824 | 792,272 | 0.06 |
| 62 | 2026-11-19T13:15:21Z | 605,672 | 591.5 | 9.63% | 6,443,824 | 795,064 | 0.02 |
| 63 | 2026-11-19T13:16:21Z | 583,964 | 570.3 | 9.28% | 6,443,824 | 795,460 | 0.09 |
| 64 | 2026-11-19T13:17:21Z | 578,304 | 564.8 | 9.19% | 6,443,824 | 795,488 | 0.03 |
| 65 | 2026-11-19T13:18:21Z | 560,740 | 547.6 | 8.91% | 6,443,824 | 796,076 | 0.05 |
| 66 | 2026-11-19T13:19:21Z | 580,124 | 566.5 | 9.22% | 6,443,824 | 796,008 | 0.08 |
| 67 | 2026-11-19T13:20:21Z | 567,496 | 554.2 | 9.02% | 6,443,824 | 796,072 | 0.03 |
| 68 | 2026-11-19T13:21:21Z | 565,140 | 551.9 | 8.98% | 6,443,824 | 798,436 | 0.01 |
| 69 | 2026-11-19T13:22:21Z | 544,528 | 531.8 | 8.66% | 6,443,824 | 800,244 | 0.06 |
| 70 | 2026-11-19T13:23:21Z | 541,920 | 529.2 | 8.61% | 6,443,824 | 800,292 | 0.02 |
| 71 | 2026-11-19T13:24:21Z | 524,256 | 512.0 | 8.33% | 6,443,824 | 800,780 | 0.07 |
| 72 | 2026-11-19T13:25:21Z | 518,888 | 506.7 | 8.25% | 6,443,824 | 800,696 | 0.02 |
| 73 | 2026-11-19T13:26:21Z | 517,272 | 505.1 | 8.22% | 6,443,824 | 800,672 | 0.01 |
| 74 | 2026-11-19T13:27:21Z | 533,264 | 520.8 | 8.48% | 6,443,824 | 800,724 | 0.05 |
| 75 | 2026-11-19T13:28:21Z | 530,664 | 518.2 | 8.43% | 6,443,824 | 800,752 | 0.02 |
| 76 | 2026-11-19T13:29:21Z | 524,564 | 512.3 | 8.34% | 6,443,824 | 800,280 | 0.00 |
| 77 | 2026-11-19T13:30:21Z | 534,876 | 522.3 | 8.50% | 6,443,824 | 800,288 | 0.00 |
| 78 | 2026-11-19T13:31:21Z | 545,108 | 532.3 | 8.66% | 6,443,824 | 800,448 | 0.00 |
| 79 | 2026-11-19T13:32:21Z | 532,916 | 520.4 | 8.47% | 6,443,824 | 800,624 | 0.00 |
| 80 | 2026-11-19T13:33:21Z | 521,268 | 509.1 | 8.29% | 6,443,824 | 800,640 | 0.00 |
| 81 | 2026-11-19T13:34:21Z | 525,420 | 513.1 | 8.35% | 6,443,824 | 800,668 | 0.00 |
| 82 | 2026-11-19T13:35:21Z | 534,192 | 521.7 | 8.49% | 6,443,824 | 800,728 | 0.00 |
| 83 | 2026-11-19T13:36:21Z | 513,432 | 501.4 | 8.16% | 6,443,824 | 801,116 | 0.08 |
| 84 | 2026-11-19T13:37:21Z | 524,276 | 512.0 | 8.33% | 6,443,824 | 801,240 | 0.03 |
| 85 | 2026-11-19T13:38:21Z | 526,764 | 514.4 | 8.37% | 6,443,824 | 801,260 | 0.08 |
| 86 | 2026-11-19T13:39:21Z | 535,288 | 522.7 | 8.51% | 6,443,824 | 801,256 | 0.03 |
| 87 | 2026-11-19T13:40:21Z | 520,684 | 508.5 | 8.28% | 6,443,824 | 804,784 | 0.01 |
| 88 | 2026-11-19T13:41:21Z | 530,168 | 517.7 | 8.43% | 6,443,824 | 804,888 | 0.00 |
| 89 | 2026-11-19T13:42:21Z | 522,712 | 510.5 | 8.31% | 6,443,824 | 808,380 | 0.15 |
| 90 | 2026-11-19T13:43:21Z | 517,416 | 505.3 | 8.22% | 6,443,824 | 806,724 | 0.19 |
| 91 | 2026-11-19T13:44:21Z | 529,072 | 516.7 | 8.41% | 6,443,824 | 806,748 | 0.07 |
| 92 | 2026-11-19T13:45:21Z | 520,188 | 508.0 | 8.27% | 6,443,824 | 806,760 | 0.02 |
| 93 | 2026-11-19T13:46:21Z | 528,940 | 516.5 | 8.41% | 6,443,824 | 806,864 | 0.01 |
| 94 | 2026-11-19T13:47:21Z | 520,152 | 508.0 | 8.27% | 6,443,824 | 806,904 | 0.00 |
| 95 | 2026-11-19T13:48:21Z | 514,384 | 502.3 | 8.18% | 6,443,824 | 806,912 | 0.10 |
| 96 | 2026-11-19T13:49:21Z | 512,760 | 500.7 | 8.15% | 6,443,824 | 804,172 | 0.08 |
| 97 | 2026-11-19T13:50:21Z | 525,532 | 513.2 | 8.35% | 6,443,824 | 801,532 | 0.03 |
| 98 | 2026-11-19T13:51:21Z | 527,848 | 515.5 | 8.39% | 6,443,824 | 801,872 | 0.01 |

## Phụ lục C — Log watcher B2 (29 spike)

(File gốc: `hidden_files/round146-t9/b2-spikes.log` — 29 spike, mỗi spike kèm ps snapshot top-12; tóm tắt quy nguồn ở §2.5.)
