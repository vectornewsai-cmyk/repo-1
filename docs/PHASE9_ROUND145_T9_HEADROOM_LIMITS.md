# LIMITS — Phase 9 đợt 145, T9: headroom inotify + RAM + guard birefnet + B2/tải tự sinh (DƯỚI NGƯỠNG <1.800 LẦN THỨ NĂM; DROP −222 KỶ LỤC MỚI; REBOOT #33 GIỮA CỬA SỔ ĐO; CỬA SỔ THOÁNG >20.000 XUẤT HIỆN TRỞ LẠI)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 1.074** (đo 2 lần trên boot e146ca67 btime **07:56:16Z**: 1.074 lúc 08:42:53Z và **1.074** lúc 08:42:57Z 19/11, chênh **0**) — **GIẢM MẠNH KỶ LỤC**: 1.296 (đợt 144) → **1.074 (−222, −17,1%)**. Xem §1.
- **⚠️ VẪN DƯỚI NGƯỠNG BÁO USER (< ~1.800) — thấp hơn ngưỡng 726, lần thứ năm liên tiếp.** Quyết parent (k) đợt 144: VẪN CHỈ THEO DÕI, không hành động mới — đợt này **KHÔNG báo riêng, không yêu cầu user hành động**; can thiệp host ngoài tầm cell. **Tỉ lệ/vite chỉ còn ~0,68** (đợt 144: 0,82). Xem §1.3, F-145-T9-1.
- **Đo lần 3 sau reboot (boot mới 98a7c93f, ~62 giây tuổi): headroom >20.000** — **CỬA SỔ THOÁNG XUẤT HIỆN TRỞ LẠI** (khác đợt 144 khi lần 3 đo muộn ~123 giây tuổi dừng ở 1.194). Ủng hộ giả thuyết đợt 144: cửa sổ thoáng có thể đã đóng trước khi đo muộn. Xem §1.4, F-145-T9-3.
- **Trần inotify ĐỔI GIỮA HAI BOOT: 63.747 (e146ca67) → 63.756 (98a7c93f), +9** — lần đầu trần thay đổi trong chuỗi T9. Không đổi kết luận đợt này (giá trị chuỗi lấy trên boot mở đợt, trần 63.747) nhưng T10 lưu ý khi đối chiếu chuỗi dài. Xem §1.4, F-145-T9-4.
- **RAM:** đỉnh **61,41% guard** — cao nhất kể từ đợt 138 (thiếu 57 MiB). Max toàn cửa sổ (147 mẫu, hai vòng): **3.863.484 kB = 3.772,9 MiB lúc 08:58:04Z** (boot e146ca67), thiếu **2.427.972 kB (~2.371,1 MiB)** mới tới guard 6.291.456 kB. Min toàn cửa sổ: **429.392 kB (419,3 MiB) lúc 09:33:07Z** (boot e146ca67). **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** T5-145 sampler riêng ghi đỉnh 63,8% guard (cadence/cửa sổ khác — không mâu thuẫn, vẫn 0 mẫu ≥ guard). Xem §2.
- **Balloon virtio:** ĐÓNG BĂNG ở 6.443.824 kB trong **58/147 mẫu (39,5%)** — giá trị đóng băng y hệt đợt 138/139/140/141/142/143/144 — **đợt thứ tám liên tiếp**; balloon KHÔNG xả bền. Xem §2.2.
- **REBOOT GIỮA CỬA SỔ ĐO #33: boot e146ca67 chết, boot mới 98a7c93f lên thay, btime 09:54:03Z.** Sampler vòng 1 bị SIGTERM giết cùng lúc (72 mẫu, 08:43:01–09:54:09Z); khởi động lại vòng 2 lúc 09:55:21Z (gap lấy mẫu ~72 giây). **Nghịch lý đồng hồ lặp lại: mẫu cuối boot cũ ghi 09:54:09Z (đồng hồ cũ) MUỘN HƠN btime boot mới 09:54:03Z (đồng hồ mới) 6 giây** — khung chết KHÔNG chốt được bằng dữ kiện T9; giao T2/T6. Boot cũ sống 07:56:16Z → 09:54:03Z = **1h57m47s**. Xem §5, F-145-T9-2.
- **B2 / tải tự sinh: CÓ tải tự sinh — nhưng KHÔNG phải từ stack đo.** 32 spike load1 ≥3,0 cả đợt (vòng 1: 28, vòng 2: 4): (a) cụm mở 08:43–08:46Z — harness T8 O8 + setup attempt T4 (+ một phần nhỏ từ lệnh `find` của chính T9, xem F-145-T9-5); (b) cụm dài 09:03–09:15Z (~12 phút) — harness T8 clicktest WebKit (WebKitWebProcess 89–91%); (c) cụm sau reboot 09:55–09:56Z — replay apt (apt-get cài hunspell-en-us 91,5% CPU); (d) 1 spike 10:19:55Z không quy được nguồn (đuôi decay, xem F-145-T9-6). **Trong cửa sổ attempt1 của T4 (08:53–08:56Z): 0 spike** — khớp T4 ghi load1_max 1,78. Xem §2.5.
- **Lượt yên WebKit #20 (T4, đợt 145): HỢP LỆ ngay attempt1** (median tickCost **58,0 ms**, lớp B ĐẠT 5/5 với B4 đã vá). T9 chỉ cung cấp dữ kiện sampler độc lập (§2.4), không phán verdict #20. Xem §2.3, F-145-T9-8.
- **F-144-T9-9 ĐÃ ĐƯỢC T5-145 ĐỐI CHIẾU XONG, DỨT KHOÁT:** KHÔNG có apt-get trong cửa sổ attempt2/3 đợt 144 (06:03–06:11Z); hai điểm quan sát của T9-144 nằm trên 2 boot khác nhau, không điểm nào trong cửa sổ B4. NHƯNG tiền đề quyết (j) đợt 144 sai một nửa: **apt history.log CŨNG RESET mỗi reboot** (F-145-T5-1) — T5 kết luận B4 nhờ dpkg.log đóng băng đã ghi trên workspace. Xem §2.5, §5.
- T5-145 đối chiếu độc lập headroom: **1074 (mở 08:43Z) → 1070 (cuối 09:23Z)** — khớp 1074/1074 của T9.
- Không có vite/chrome nào đang chạy lúc T9 đóng (kiểm tra lúc 11:13:03Z), không có ENOSPC nào (journal 0 dòng "No space left"/ENOSPC trên boot mới). Replay dpkg trên boot e146ca67: 1.545 dòng (gói cuối gstreamer1.0-tools 1.24.2-**1ubuntu0.2** — y hệt đợt 143/144). Trên boot mới 98a7c93f: dpkg.log đủ 1.545 dòng lúc 09:58:17Z (boot +4m14s) — replay xong trên cả hai boot. T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747 trên boot mở đợt)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** trên boot e146ca67 (không đổi so với đợt 144; xem F-145-T9-4 về trần 63.756 trên boot mới).

### 1.2 Số đo đợt 145 (boot e146ca67, btime 07:56:16Z — boot lúc mở đợt)

| Thời điểm (UTC 19/11) | Headroom | Bối cảnh |
|---|---|---|
| 08:42:53Z | **1.074** | lần đo 1, boot ~46'37" tuổi; RAM trước đo 1.375.964 kB, balloon 4.635.484 kB |
| 08:42:57Z | **1.074** | lần đo 2 (chênh **0** so với lần 1); RAM trước đo 1.402.748 kB, balloon 4.635.484 kB |

- Probe dừng ở `i=1074` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố. File tạm đã dọn sạch sau mỗi lần đo (`/tmp/k8-watch-probe` không còn).
- Số watch đang giữ ngoài cell suy ra: 63.747 − 1.074 = **62.673 watch** (tăng ~222 so với 62.451 đợt 144).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 1.074 / 1.578 ≈ **0,68 lần** — sâu hơn dưới 1,0 (đợt 144: 0,82; đợt 143: 0,95). Headroom chỉ còn ~68% nhu cầu một vite dev server đầy đủ.
- Đối chiếu độc lập (T5-145 §6.1, cùng probe K8): **1074 lúc mở (08:43Z) → 1070 lúc cuối (09:23Z)** — T5 đo 1074 khớp đúng 1074 của T9 lúc mở; drift −4 trong ~40 phút trên cùng boot. Hai luồng độc lập cùng kết luận.
- Lưu ý: RAM trước đo lần 1 là 1.375.964 kB (balloon 4.635.484 kB — đang xả sâu sau boot); headroom **không đi theo RAM khả dụng trong cell**, mà theo watch ngoài cell (như đợt 141, 142, 143, 144).

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–144 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **145** | **1.074 → 1.074** | **đo 08:42:53Z → 08:42:57Z, boot e146ca67 btime 07:56:16Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840 → 1.739 → 1.617 → 1.498 → 1.296 → 1.074**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU — VÀ BƯỚC GIẢM KỶ LỤC MỚI.** Từ đỉnh chuỗi 4.438 xuống 1.074 = **−3.364 (−75,8%)**. Bước giảm đợt này: −222 so với đợt 144 (−17,1%) — **PHÁ KỶ LỤC −202 vừa lập đợt 144**; dải 101–127 của mười bốn đợt trước đó nay đã bị phá hai đợt liên tiếp (144: −202; **145: −222**). Hai đợt gần nhất giảm tổng −424 (−28,3% so với 1.498 đợt 143).
- **⚠️ NGƯỠNG BÁO USER < ~1.800: VẪN DƯỚI NGƯỠNG — 1.074, thấp hơn ngưỡng 726, lần thứ năm liên tiếp.** Quyết parent đợt 144 (k): VẪN CHỈ THEO DÕI, không hành động mới, không nhắc lại riêng — **đợt này T9 chỉ tiếp tục theo dõi, không báo riêng**. Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell. T9 không tự đổi ngưỡng báo.
- **Mốc mới: tỉ lệ/vite 0,68 — sâu hơn dưới 1,0.** Headroom chỉ còn ~68% nhu cầu một vite đầy đủ (~1.578 watch). Đây là diễn biến đáng ghi cho parent/T10, nhưng quyết "chỉ theo dõi" vẫn đứng (brief đợt này + quyết parent đợt 141/142/143/144); T9 không tự nâng mức báo hay yêu cầu user hành động.
- Trần 63.747 vẫn đầy ở mức ~62,7k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới 98a7c93f (ngoài chuỗi, chỉ để đối chiếu)

- **Lần 3, 09:55:05Z (boot ~62 giây tuổi, btime 09:54:03Z): probe chạy tới 20.000 watch KHÔNG gặp errno 28** — headroom trên boot mới **>20.000**. RAM trước đo 1.905.664 kB, balloon 5.019.732 kB, SwapFree ~1.040.624 kB (swap gần trống sau reboot). File tạm đã dọn sạch. Lần 3 đo đúng trong ~60 giây đầu sau boot như brief yêu cầu (đo lúc 09:55:05Z, boot 62 giây tuổi).
- **CỬA SỔ THOÁNG headroom >20.000 ngay sau boot XUẤT HIỆN TRỞ LẠI** — khác đợt 144 (lần 3 lúc boot ~123 giây tuổi dừng ở 1.194), giống đợt 140/142/143 (>20.000 lúc boot ~50–80 giây tuổi). Ủng hộ giả thuyết đợt 144 (F-144-T9-3): cửa sổ thoáng có thể đã đóng trước khi đo muộn ~123 giây tuổi. Tỉ lệ: xuất hiện 4/6 đợt gần nhất (140, 142, 143, 145), vắng 2/6 đợt (141, 144).
- **Trần trên boot mới: 63.756** (đọc lúc đo lần 3, xác nhận lại 11:13:21Z) — **khác 63.747 trên boot cũ (+9)**. Xem F-145-T9-4.
- **Không đưa >20.000 vào chuỗi §1.3** — chuỗi lấy giá trị ổn định trên boot lúc mở đợt (1.074, đo 2 lần chênh 0). Giá trị lần 3 chỉ là quan sát đối chiếu sau reboot.
- Hệ quả thực hành: **cửa sổ thoáng sau boot KHÔNG đáng tin** — xuất hiện ở 4/6 đợt gần nhất và vắng ở 2/6 đợt; khi vắng, headroom trên boot mới thậm chí thấp hơn trên boot cũ (đợt 144: 1.194 < 1.296). Reboot KHÔNG reset chuỗi suy giảm headroom — giá trị ổn định của đợt vẫn lấy trên boot mở đợt. Với đà giảm (hai đợt gần nhất −202 rồi −222), các đợt sau sẽ đi sâu hơn dưới ngưỡng nếu không can thiệp host (chỉ là phép chia số học minh họa — KHÔNG phải dự báo).

## 2. RAM khả dụng (tổng 8.124.900 kB, swap 1.023 MB) — sampler dài 147 mẫu, 08:43:01Z–11:09:28Z

### 2.1 Hình dạng cửa sổ: vòng 1 đỉnh cao kỷ lục rồi cắt bởi reboot; vòng 2 đỉnh sớm rồi kẹt thấp tới hết

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 08:43:01–09:54:09Z, 72 mẫu, boot e146ca67 — bị SIGTERM giết cùng lúc reboot 09:54:03Z (xem F-145-T9-2 về nghịch lý đồng hồ 6 giây). Vòng 2: 09:55:21–11:09:28Z, 75 mẫu, boot mới 98a7c93f — chạy tới hết hạn 11:10Z.** Tổng **147 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 429.392 kB (419,3 MiB) lúc 09:33:07Z (boot cũ). Max toàn cửa sổ: 3.863.484 kB (3.772,9 MiB) lúc 08:58:04Z (boot cũ).** Mean vòng 1 ~1.246,7 MiB; mean vòng 2 ~751,6 MiB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot e146ca67 (72 mẫu, 08:43:01–09:54:09Z) — RAM hồi mạnh đầu vòng, đỉnh kỷ lục, rồi rơi về vùng trũng trước reboot:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 08:43:01Z | 1.361,6 MiB (1.394.232 kB) | mẫu đầu (balloon 4.635.484 kB — đang xả sâu sau boot; load1 6,59 — cụm spike mở, xem §2.5) |
| 08:44:02–08:46:03Z | 1.448,1 → ~1,7 GB | dao động trong cụm spike mở (T8 O8 + setup T4) |
| 08:53:03Z | 2.021,9 MiB (2.070.384 kB) | mẫu trùng poll #7 của T4 (T4 ghi RAM 2.021 MB — khớp đúng) — trong cửa sổ attempt1 #20 |
| 08:57:04–09:00:04Z | 3.135,5 → 3.772,9 MiB | leo sau khi attempt1 T4 kết thúc (08:56:39Z): balloon xả sâu 3.662.776 → **3.007.404 kB (min toàn cửa sổ)** |
| 08:58:04Z | **3.772,9 MiB (3.863.484 kB)** | **MAX toàn cửa sổ, 61,41% guard** (balloon 3.007.404 kB — xả sâu nhất chuỗi T9 từ trước tới nay; SwapFree 764.596 kB) |
| 08:59:04–09:11:05Z | 3.368,9 → 1.048,9 MiB | rơi dần về gate A; **chuỗi 29 mẫu liên tục ≥1024 MiB (#1–#29, 08:43:01–09:11:05Z)** kết thúc tại đây |
| 09:12:05–09:17:06Z | ~0,8–1,0 GB | dưới gate A (trừ mẫu lẻ); cụm spike T8 09:03–09:15Z kết thúc 09:15:38Z |
| 09:18:06–09:23:06Z | 1.048,9 → ~1,2 GB | **chuỗi 6 mẫu liên tục ≥1024 MiB (#2, 09:18:06–09:23:06Z)** — chuỗi ≥1024 cuối cùng vòng 1 |
| 09:24:06–09:29:07Z | ~0,6–0,9 GB | rơi dưới gate A, không hồi lại |
| 09:30:07–09:36:07Z | ~0,4–0,6 GB | **đợt đóng băng 1**: balloon 6.443.824 kB (**7 mẫu liên tục**); **MIN toàn cửa sổ 419,3 MiB (429.392 kB) lúc 09:33:07Z** |
| 09:37:07–09:39:08Z | ~0,5–0,7 GB | xả nhẹ (balloon 6.379.144 kB) |
| 09:40:08–09:41:08Z | ~0,5 GB | **đợt đóng băng 2** (2 mẫu) |
| 09:42:08–09:48:09Z | ~0,5–0,7 GB | nhô nhẹ (balloon xả 6.091.060 kB) |
| 09:49:09–09:52:09Z | ~0,5–0,6 GB | **đợt đóng băng 3** (4 mẫu) |
| 09:53:09–09:54:09Z | 648,0 → 554,1 MiB | xả nhẹ rồi mẫu cuối vòng 1 (balloon 6.401.708 kB); sampler bị giết cùng reboot ngay sau đó |

- **35/72 mẫu ≥1024 MiB** (chuỗi 29 + chuỗi 6). **13 mẫu ≥2.000.000 kB** (tập trung 08:53:03–09:05:03Z).
- Balloon vòng 1: 4.635.484 kB (mẫu đầu) → xả sâu **min 3.007.404 kB lúc 08:58:04Z (37,0% tổng RAM, đúng lúc đỉnh RAM vòng 1 — xả sâu nhất chuỗi T9 từ trước tới nay, sâu hơn min 3.488.084 kB đợt 144)** → phình lại **6.443.824 kB** rồi đóng băng qua 13 mẫu → **0 mẫu đóng băng trước 09:30Z**.
- Load1 vòng 1: 0,04–6,59 (max 6,59 lúc 08:43:01Z — cụm spike mở; xem §2.5). 14/72 mẫu load1 ≥3,0.
- Swap: SwapFree 625.428 kB lúc mẫu đầu → 628.428 kB lúc mẫu cuối vòng 1 (swap đang dùng ~400 MB).

**Boot mới 98a7c93f (75 mẫu, 09:55:21–11:09:28Z) — đỉnh sớm rồi rơi đơn điệu về vùng trũng, balloon đóng băng tới hết:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 09:55:21Z | 1.739,8 MiB (1.781.544 kB) | mẫu đầu sau reboot (balloon 5.094.544 kB; SwapFree 1.040.624 kB — swap gần trống); load1 4,32 (replay apt + hatch daemon — xem §2.5) |
| 09:56:21Z | **1.952,7 MiB (1.999.544 kB)** | **MAX vòng 2, 31,78% guard** (balloon 4.780.056 kB — min vòng 2) |
| 09:55:21–10:03:22Z | 1.739,8 → 1.115,5 MiB | **chuỗi 9 mẫu liên tục ≥1024 MiB (#1–#9)** |
| 10:04:22–10:08:22Z | 980,9 → 528,4 MiB | rơi dưới gate A; **MIN vòng 2 528,4 MiB (541.104 kB) lúc 10:08:22Z** |
| 10:09:22–10:29:24Z | ~0,5–0,7 GB | **đợt đóng băng dài**: balloon 6.443.824 kB (**21 mẫu liên tục**) |
| 10:30:24–10:34:25Z | ~0,6 GB | xả nhẹ (balloon 6.379.144 kB) |
| 10:35:25–10:45:26Z | ~0,5–0,7 GB | **đợt đóng băng 2**: balloon 6.443.824 kB (**11 mẫu liên tục**) |
| 10:46:26–10:50:26Z | ~0,5–0,7 GB | xả nhẹ |
| 10:51:26–11:02:27Z | ~0,5–0,6 GB | **đợt đóng băng 3**: balloon 6.443.824 kB (**12 mẫu liên tục**) |
| 11:03:27Z | 1.048,6 MiB (1.073.696 kB) | **mẫu lẻ duy nhất ≥1024 MiB sau 10:03Z** (nhô một mẫu rồi rơi lại) |
| 11:04:27–11:09:28Z | ~0,5–0,6 GB | rơi lại vùng trũng; mẫu cuối 575,6 MiB lúc 11:09:28Z (balloon đóng băng 6.443.824 kB) |

- **10/75 mẫu vòng 2 ≥1024 MiB**; sau 10:03:22Z, **chỉ 1 mẫu vượt 1.048.576 kB trong 66 phút cuối** (11:03:27Z). **0 mẫu ≥2.000.000 kB** vòng 2.
- Load1 vòng 2: 0,04–4,32 (max 4,32 lúc 09:55:21Z — ngay sau reboot, replay apt; xem §2.5). Nửa sau cửa sổ (10:30–11:09Z) load1 0,00–0,37 mà RAM vẫn phẳng ~0,55–0,65 GB: RAM thấp không phải do tải trong cell.
- Swap: SwapFree 1.040.624 kB (mẫu đầu vòng 2) → 746.328 kB lúc cuối (swap đang dùng ~290 MB sau ~75 phút).

### 2.2 Balloon virtio — xả sâu kỷ lục đầu vòng 1 rồi đóng băng y hệt đợt 138/139/140/141/142/143/144

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 4.635.484 kB (08:43:01Z) → xả sâu **min 3.007.404 kB lúc 08:58:04Z (37,0% tổng RAM, đúng lúc đỉnh RAM vòng 1 — xả sâu nhất chuỗi T9)** → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 13 mẫu** (3 đợt: 09:30:07–09:36:07Z 7 mẫu; 09:40:08–09:41:08Z 2 mẫu; 09:49:09–09:52:09Z 4 mẫu) → reboot cắt trước khi xả bền.
- Boot mới: 5.094.544 kB (09:55:21Z) → xả **min 4.780.056 kB lúc 09:56:21Z** (trong cửa sổ đỉnh RAM vòng 2) → phình lại **6.443.824 kB** rồi **ĐÓNG BĂNG đúng giá trị này qua 45 mẫu** (4 đợt: 10:09:22–10:29:24Z 21 mẫu; 10:35:25–10:45:26Z 11 mẫu; 10:51:26–11:02:27Z 12 mẫu; 11:09:28Z 1 mẫu) → không xả bền tới hết sampler.
- Tổng: balloon đóng băng 6.443.824 kB trong **58/147 mẫu (39,5% cửa sổ)**. Giá trị 6.443.824 kB lặp lại y hệt qua **tám đợt (138 + 139 + 140 + 141 + 142 + 143 + 144 + 145)** và nhiều boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (mẫu đầu 08:43:01Z → mẫu cuối 11:09:28Z): balloon 4.635.484 kB → 6.443.824 kB = **+1.808.340 kB** (phình ròng). Lúc đóng (11:13:03Z, sau sampler): balloon 6.443.824 kB, RAM 567.476 kB (554,2 MiB).
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 145 VẪN KHÔNG thấy xả bền:** balloon đóng băng 6.443.824 kB trong 58/147 mẫu và RAM phẳng ~0,5 GB suốt nửa sau vòng 2. Đây là **đợt thứ tám liên tiếp** balloon đóng băng ở đúng giá trị này. Quyết parent đợt 139 đã ghi: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 146.
- Số học lúc đỉnh RAM 08:58:04Z: tổng RAM 8.124.900 kB − balloon 3.007.404 kB = 5.117.496 kB còn lại cho hệ thống; trong đó MemAvailable 3.863.484 kB + free/cache ~1,25 GB. Lúc cuối cửa sổ 11:09:28Z: tổng RAM − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 589.432 kB.
- Đối chiếu T5-145: T5 sampler riêng (40 mẫu, 08:43–09:22:50Z, cửa sổ khác) ghi **0/40 mẫu ghim trần** — đợt thứ hai liên tiếp T5 ghi 0 (đợt 144: 0/53). Không mâu thuẫn với T9 (13/72 vòng 1): balloon T9 bắt đầu đóng băng từ 09:30:07Z, **sau khi sampler T5 đã kết thúc 09:22:50Z** — hai cửa sổ không chồng lấn ở đoạn đóng băng.

### 2.3 Lượt yên WebKit #20 (T4, đợt 145) — HỢP LỆ NGAY ATTEMPT1

- **T4-145 ĐÃ xuất bản LIMITS trước khi T9 đóng:** `docs/PHASE9_ROUND145_T4_WEBKIT_QUIET20_LIMITS.md`. T9 chỉ trích verdict, không tự đo tickCost (không thuộc phạm vi T9).
- **Attempt1-e146ca67 (08:53:03–08:56:39Z): 20/20 exit 0, tickCost median 58,0 ms** (n=508; post-flip 58,0; p90 88,3; max 239; min 31). **Lớp B ĐẠT 5/5** (với B4 đã vá — pgrep -x=0, dpkg delta=0, ps trước/sau). **LƯỢT YÊN #20 HỢP LỆ.** Cộng dồn **17 lượt hợp lệ:** P1 51/51, P2 42/42, P3-A1 46/51, P3' 23/23, P7 37/37. Chuỗi median 17 lượt: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 / 47,0 / 49,0 / 55,0 / **58,0 ms** (trung bình 48,8 ms).
- B4 đã vá theo quyết parent (b) đợt 144: bỏ grep chuỗi con, kiểm process thật + dpkg delta trong cửa sổ attempt; sampler tag theo boot; attempt-tagging + ngân sách retry 3 attempt/đợt (không tính attempt bị reboot giết). Vá xong TRƯỚC khi đo #20 — gate0 mới kiểm chứng lần đầu đợt 144 nay chạy đúng quy trình.
- Dữ kiện độc lập từ sampler T9 cho T4/T10 (§2.4): gate A (RAM ≥1024 MiB) giữ suốt cửa sổ attempt1; load1 T9 trong cửa sổ attempt thấp (tối đa 1,65 theo cadence 60 s — T4 sampler riêng mịn hơn ghi max 1,78, khớp nhau).
- **Đợt 146 đo #21.**

### 2.4 Dữ kiện sampler T9 trong cửa sổ attempt của T4 (độc lập, cadence 60 s)

| Attempt | Cửa sổ (UTC) | Boot | load1 (T9) | RAM (T9) | Ghi chú |
|---|---|---|---|---|---|
| 1 | 08:53:03–08:56:39Z | e146ca67 | 0,50 / 1,65 / 1,25 / 0,54 | 2.021,9 → 1.334,2 MiB | 4 mẫu; RAM ≥1024 cả 4 mẫu; **mẫu 08:53:03Z 2.021,9 MiB khớp đúng poll #7 của T4 (2.021 MB)**; load1 T9 tối đa 1,65 — T4 sampler riêng ghi max 1,78 (khớp trong sai số cadence) |

- Attempt1 chạy hoàn toàn trong chuỗi 29 mẫu liên tục ≥1024 MiB (08:43:01–09:11:05Z) — gate A mở rộng rãi. **0 spike load1 ≥3,0 của watcher B2 trong cửa sổ attempt** (spike gần nhất trước attempt: 08:46:03Z; spike gần nhất sau attempt: 09:03:36Z) — khớp T4 ghi "không có spike load nào trong lượt (max 1,78)".
- T9 KHÔNG phán verdict #20 (đã có file T4-145: HỢP LỆ, median 58,0 ms), không phán B4/B2 đúng/sai — chỉ cung cấp bảng trên + §2.5 để parent/T10 đối chiếu.

### 2.5 B2 — tải tự sinh của stack đo: CÓ, NHƯNG KHÔNG PHẢI TỪ STACK ĐO (khẳng định lại đợt 144)

**Câu hỏi mở từ đợt 143/144:** sampler T9 có thấy tải tự sinh không? Trả lời đợt 145: **CÓ tải tự sinh trong cửa sổ đo — nhưng nguồn không phải stack đo (sampler/poller/watcher), mà là (a) harness T8, (b) setup attempt T4, (c) replay apt sau reboot, (d) một spike lẻ không quy được nguồn.** Stack đo (sampler/poller/watcher) không sinh load1 ≥3,0 lần nào.

Bằng chứng — watcher spike (ngưỡng load1 ≥3,0, kiểm tra mỗi 30 s; tổng **32 spike** cả đợt: vòng 1: 28, vòng 2: 4):

| Cụm | Thời điểm (UTC) | load1 | Process gây tải (ps snapshot) | Kết luận |
|---|---|---|---|---|
| A (7 spike) | 08:43:02–08:46:03Z | 3,54–8,01 (max 8,01 lúc 08:43:32Z) | WebKitWebProcess ~49% + MiniBrowser ~30% + vite :5560 (T8 O8 clicktest-87o8) + `find` của T9 12,8% + ps artifact 33,3% | Tải do **harness T8 O8 + setup attempt T4**; một phần nhỏ từ **lệnh `find` của chính T9** (xem F-145-T9-5) |
| B (21 spike) | 09:03:36–09:15:38Z | 3,13–6,57 (sustained ~12 phút) | WebKitWebProcess **89–91%** + MiniBrowser ~28% + vite + esbuild (T8 clicktest-85m4/86n2, run-webkit-145t8.sh) | Tải do **harness T8** chạy WebKit rồi Chromium — công việc thật của luồng khác |
| C (3 spike) | 09:55:21–09:56:21Z | 3,66–5,06 | apt-get replay 91,5% (cài hunspell-en-us, --no-download) + hatch daemon 31,1% | Tải do **replay apt sau reboot** |
| D (1 spike) | 10:19:55Z | 3,11 (load5 1,06, load15 0,62) | Không có process nặng nào (top: hatch daemon 4,0%) | **Không quy được nguồn** — đuôi decay của burst đã kết thúc trước snapshot (xem F-145-T9-6) |

- **Sau 10:19:55Z: 0 spike load1 ≥3,0 trong ~50 phút còn lại** (tới 11:10Z) — dù sampler/poller/watcher/T10-waiter vẫn chạy suốt. Stack đo (vài lệnh grep/ps mỗi phút) không sinh tải đo được.
- **Cụm load1 ≥2,0 ngoài spike (sampler 60 s):** vòng 1: 08:44:02Z (5,59) + 08:45:02Z (4,87) — trong cụm A; 09:03–09:15Z — trong cụm B (harness T8). Vòng 2: 09:57:21Z (2,38) + 09:58:22Z (2,52) — đuôi cụm C (replay apt); 10:19:55Z đã nêu. Tất cả đều là công việc thật của các luồng / replay, không phải stack đo.
- **Caveat (cùng lớp F-144-T9-7):** snapshot ps của chính watcher đôi khi tự lọt top (ps 33,3% lúc 08:43:02Z — artifact của lệnh ps, không phải tải thật).
- **F-144-T9-9 — ĐỐI CHIẾU XONG (T5-145 §3.7, dứt khoát):** KHÔNG có apt-get trong cửa sổ attempt2/3 đợt 144 (06:03–06:11Z) — dpkg.log boot cc222c8a đóng băng 1.545 dòng từ 05:58:41Z; hai điểm quan sát của T9-144 (05:55:28Z libmanette, 07:59Z libpipewire) nằm trên **2 boot khác nhau**, không điểm nào trong cửa sổ B4. B4 vi phạm ở attempt2/3 đợt 144 là giả-dương — ủng hộ quyết parent (b) đợt 144 (chấp nhận attempt3 làm #19 hợp lệ). **NHƯNG tiền đề quyết (j) đợt 144 sai một nửa: apt history.log CŨNG RESET mỗi reboot** (F-145-T5-1: file live chỉ còn 50 Start-Date của replay boot e146ca67, 07:57:37–08:00:09Z) — T5 kết luận B4 nhờ dpkg.log đóng băng đã ghi trên workspace + ps, không nhờ history.log. Parent xem có cần sửa quyết (j) ở đợt 145 (xem §12 aggregate — T9 chỉ ghi nhận, không đề xuất).
- **Hệ quả cho T4/T10:** attempt đo WebKit tự nó + harness T8 là nguồn tải lớn nhất trong cửa sổ yên (WebKitWebProcess + MiniBrowser + vite ≈ 100%+ CPU cộng dồn) — lớp B (load1 max ≤4) vì vậy luôn ở sát ngưỡng khi attempt/harness chạy; attempt1 #20 "sống sót" B2 nhờ load1 max chỉ 1,78 (harness T8 không chạy trùng cửa sổ attempt). Đây là dữ kiện, không phải đề xuất đổi ngưỡng lớp B — T4/T10 cân nhắc.
- **Replay apt os-intent (quan sát độc lập của T9, đợt 145):** wrapper `sh -c` (pid 782, khởi động từ boot) tồn tại suốt lượt trên boot mới; apt-get THẬT chạy theo đợt sau reboot (quan sát trực tiếp: 09:55:21Z cài aspell; 09:55:51Z cài hunspell-en-us 91,5% CPU) — nên B4 không thể bác bỏ hoàn toàn bằng lý do wrapper; cần đối chiếu nhịp đợt của replay với cửa sổ attempt (T5-145 đã làm cho đợt 144; T4-145 đã vá B4 kiểm process thật).

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
| **145** | ****~1,36 GB (brief không ghi; T9 đo trực tiếp 1.375.964 kB lúc 08:42:53Z, 1.394.232 kB lúc 08:43:01Z)**** | ****419–3.773 MiB (boot cũ, 72 mẫu, 08:43:01–09:54:09Z) rồi 528–1.953 MiB (boot mới, 75 mẫu, 09:55:21–11:09:28Z); REBOOT 09:54:03Z cắt giữa hai pha; gap lấy mẫu ~72 giây** (sampler dài của T9, ~147 phút)** | ****576 MiB lúc 11:09:28Z**** |

## 3. Guard birefnet — KHÔNG ĐẠT (61,41%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) + đợt 142 + đợt 143 (k) + đợt 144 (n) GIỮ NGUYÊN quy trình + guard 6.144 MiB): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này (sampler T9, 147 mẫu, hai vòng): **3.863.484 kB = 3.772,9 MiB = 61,41% guard** lúc **08:58:04Z** (boot cũ, balloon 3.007.404 kB) — thiếu **2.427.972 kB (~2.371,1 MiB, ~38,6%)**.
- Không có mẫu nào trên boot cũ vượt 3.863.484 kB (61,41% guard); không có mẫu nào trên boot mới vượt 1.999.544 kB (31,78% guard). **0 mẫu ≥ 6.144 MiB ở bất kỳ vòng nào.** Không có cửa sổ nào để thử. Watcher guard chạy suốt cả hai vòng tới 11:12:22Z — cờ guard-open.flag KHÔNG xuất hiện (cả hai vòng; watcher vòng 2 kết thúc đúng hạn với dòng "WATCHER END — no guard window", khác F-144-T9-5).
- Đỉnh đợt này (61,41%) cao nhất kể từ đợt 138 (thiếu 57 MiB) và cao hơn mọi đợt 139–144 (44,16–48,70%); chuỗi đỉnh các đợt 136→145: 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, 2.242 MB, 2.860 MB, 2.992 MB, 2.778 MB, 2.947 MB, **3.863 MB**. Vẫn cách guard hơn một phần ba — khác hẳn đợt 138 (thiếu 57 MiB).
- Đối chiếu T5-145 (sampler riêng, 40 mẫu, cadence/cửa sổ khác): đỉnh **63,8% guard** — cao hơn đỉnh T9 61,41% nhưng vẫn **0 mẫu ≥ guard**. Chênh lệch là do pha lấy mẫu khác nhau, không mâu thuẫn; cả hai đều xa guard.
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Quy trình "thử ngay" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 11:10:28Z, watcher guard chạy suốt cả hai vòng), cửa sổ chỉ không mở.

### 3.1 Sẵn sàng thử đã xác minh lại (08:43Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được (kiểm lại đợt này, khớp đợt 138/139/140/141/142/143/144).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-145-birefnet/out-birefnet-145.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-145-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc T9 đóng** (kiểm tra `ps` lúc 11:13:03Z; chỉ có tiến trình hệ thống + các luồng đợt 145) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 1.074 chỉ còn ~0,68 vite — **sâu hơn dưới 1 vite đầy đủ**, xem §1.2).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=1074, i=1074; lần 3 trên boot mới không gặp errno 28 tới 20.000 watch) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal trên boot mới 98a7c93f: **0 dòng "No space left" / ENOSPC** (kiểm tra 11:13:03Z, từ 09:54:00Z).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 145 = boot lúc T9 đo đầu:** btime **07:56:16Z** 19/11 (`uptime -s` 07:56:16 + `btime 1795074976` trong `/proc/stat` + boot_id `e146ca67-20a5-4452-9112-69155233ab99` + `who -b`: system boot Nov 19 07:56). Đây là boot mới lên sau đợt 144 (reboot #32, quyết parent (f) đợt 144 đã xác nhận). **Theo cách đếm chặt (quyết parent (h) đợt 144): e146ca67 = #108?** (quyết parent (f) đợt 144).
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9 — #33: boot mới 98a7c93f, btime 09:54:03Z** (`uptime -s` 09:54:03 + `btime 1795082043` + boot_id `98a7c93f-83d3-40e5-8043-ee6dda19c5f1` + `who -b`: system boot Nov 19 09:54 + journal first entry sau 09:54Z). Boot cũ sống 07:56:16Z → 09:54:03Z = **1h57m47s**. **T2-145: 98a7c93f = ứng viên #109? TẠM** (tiếp sau #108?); reboot này là **#33** theo đếm nối tiếp (#32 là e146ca67 lên thay cc222c8a) — T2/T10 chốt số. **Lưu ý: file T2-145 đã xuất bản TRƯỚC reboot #33 nên không nhắc tới boot 98a7c93f** (xem F-145-T9-9) — merged mù #64 + số boot #109? giao T2-146/T10.
- **Khung chết boot cũ: KHÔNG CHỐT ĐƯỢC BẰNG DỮ KIỆN T9 (nghịch lý đồng hồ 6 giây — xem F-145-T9-2).** Mốc cuối chắc chắn còn sống trên boot cũ theo dữ liệu T9 là mẫu sampler 09:54:09Z (567.416 kB) — nhưng mốc này (đồng hồ cũ) MUỘN HƠN btime boot mới 09:54:03Z (đồng hồ mới) 6 giây. Các mốc độc lập trên đồng hồ mới: `stat /proc/1` mtime (chưa đo đợt này — giao T2/T6). T6/T2 là chủ quản chốt khung chết boot e146ca67 — T9 chỉ giao các mốc thô này.
- **Runtime restart đi kèm reboot:** phiên exec sleep chờ của T9 bị SIGTERM giết cùng lúc reboot (~09:54Z, sau ~71 phút chờ); sampler vòng 1 (nohup) và watcher vòng 1 + B2 watcher vòng 1 cũng bị giết cùng lúc. T9 khởi động lại sampler vòng 2 + watcher vòng 2 + B2 watcher vòng 2 lúc 09:55:21Z (gap lấy mẫu ~72 giây, 09:54:09Z → 09:55:21Z — xem F-145-T9-2). Không mất mẫu nào khác.
- **Replay dpkg: 1.545 dòng lúc T9 mở** (ghi cuối 08:00:09Z `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.2` — **y hệt đợt 143/144**, cùng boot e146ca67). T5-145: replay boot e146ca67 **xong hẳn trước khi T5 mở** (1545/221, bracket boot +43s → +3m53s, postboot PASS poll=2, cờ 08:45:28Z). **Replay trên boot mới (quan sát T9): dpkg.log đủ 1.545 dòng lúc 09:58:17Z (boot +4m14s, gói cuối y hệt)** — replay xong trên cả hai boot; apt-get THẬT vẫn chạy theo đợt sau reboot (09:55:21Z cài aspell; 09:55:51Z cài hunspell-en-us 91,5% CPU, wrapper pid 782 tồn tại suốt lượt) — hai loại replay khác nhau (dpkg log đóng băng sớm, os-intent chạy tiếp); **T5 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log + quan sát ps.
- Các cờ .done lúc T9 đóng (11:13Z): t1, t2, t4, t5, t6, t7, t8 (t10 chưa có — waiter vẫn chạy).

## 6. Sai số của chính T9 (ghi rõ)

- **F-145-T9-1 — Headroom VẪN DƯỚI ngưỡng báo < ~1.800 (1.074, thấp hơn ngưỡng 726), lần thứ năm liên tiếp; bước giảm −222 PHÁ KỶ LỤC −202 đợt 144; tỉ lệ/vite ~0,68:** hai lần đo chính trên boot e146ca67 là 1.074 và 1.074 (chênh 0), cùng probe, cùng phương pháp, đối chiếu độc lập T5-145 cũng đo 1.074 lúc mở — giá trị là thật, không phải sai số đo. Ngưỡng đã chạm ở đợt 141 và user đã được báo trong báo cáo đợt 141; quyết parent đợt 144 (k) VẪN CHỈ THEO DÕI — đợt này T9 chỉ tiếp tục theo dõi, không báo riêng. T9 không tự nâng mức báo hay yêu cầu user hành động.
- **F-145-T9-2 — Reboot #33 giữa cửa sổ đo + NGHỊCH LÝ ĐỒNG HỒ 6 giây (mẫu cuối boot cũ 09:54:09Z muộn hơn btime boot mới 09:54:03Z 6 giây):** khoảng trống lấy mẫu 09:54:09Z → 09:55:21Z (~72 giây) không có mẫu (vòng 2 khởi động lại 09:55:21Z). Phiên exec sleep chờ của T9 bị SIGTERM giết cùng lúc reboot (cùng họ F-144-T9-2 / F-143-T10-1 / F-142-T10-1). Mẫu 09:54:09Z được ghi bởi sampler vòng 1 TRƯỚC khi nó chết — đồng hồ boot cũ chạy nhanh hơn đồng hồ boot mới ít nhất ~6 giây (dị thường đồng hồ tới ~29 giây đã ghi nhận trong quyết parent (e) đợt 143 và F-144-T9-2 29 giây — cùng cỡ, lần này nhỏ hơn). Hệ quả: **khung chết boot e146ca67 không thể chốt bằng dữ kiện T9** (mốc cuối "còn sống" nằm sau mốc "boot mới lên" nếu đọc hai đồng hồ như một). Một lần vượt guard ngắn hơn 72 giây nằm trong khoảng trống này có thể không được quan sát — nhưng khoảng cách tới guard rất lớn (thiếu ~2.371,1 MiB lúc đỉnh) nên khả năng vượt lén là không đáng kể. (Cùng lớp F-144-T9-2.)
- **F-145-T9-3 — Cửa sổ thoáng headroom >20.000 ngay sau boot XUẤT HIỆN TRỞ LẠI ở boot 98a7c93f:** đo lần 3 lúc boot ~62 giây tuổi (09:55:05Z) probe chạy tới 20.000 watch không gặp errno 28, khác đợt 144 (1.194 lúc boot ~123 giây tuổi), giống đợt 140/142/143 (>20.000 lúc boot ~50–80 giây tuổi). Ba đợt dùng cùng phương pháp — chênh lệch là thật, không phải sai số đo. Ủng hộ giả thuyết đợt 144 đo muộn (~123 giây tuổi — cửa sổ thoáng có thể đã đóng trước khi đo). Tỉ lệ xuất hiện: 4/6 đợt gần nhất (140, 142, 143, 145), vắng 2/6 đợt (141, 144). Giá trị chuỗi vẫn lấy 1.074; >20.000 không đưa vào chuỗi.
- **F-145-T9-4 — Trần inotify ĐỔI GIỮA HAI BOOT: 63.747 (e146ca67) → 63.756 (98a7c93f), +9:** lần đầu trần thay đổi trong chuỗi T9 (mọi đợt 124–144 đều ghi 63.747; T5-145 §6.1 cũng ghi 63.747 trên boot e146ca67). Trần đọc trực tiếp từ `/proc/sys/fs/inotify/max_user_watches` lúc đo lần 3 (09:55:05Z) và xác nhận lại 11:13:21Z — là thật, không phải sai số đọc. Không ảnh hưởng giá trị headroom đợt này (1.074 lấy trên boot mở đợt với trần 63.747); chênh ±9 watch không đổi bất kỳ kết luận nào (dưới ngưỡng, phá dải). T10 lưu ý khi đối chiếu chuỗi dài: headroom là hiệu số tuyệt đối (trần − watch ngoài cell), trần khác nhau giữa các boot làm chuỗi kém "sạch" hơn ±9 — ghi rõ để lần sau không nhầm là lỗi đo.
- **F-145-T9-5 — Một phần tải cụm spike mở (08:43:02Z) đến từ chính T9:** lệnh `find ~/workspace -name k8-headroom.py` của T9 (chạy nền từ phiên kiểm tra đầu đợt, tổng 144 giây) chiếm **12,8% CPU** trong snapshot ps lúc 08:43:02Z. Không phải nguồn chính (WebKitWebProcess ~49% + MiniBrowser ~30% của harness T8 O8 mới là chính) nhưng ghi rõ: một phần tải lúc mở là tự sinh từ thao tác tìm file của T9 — lần sau tìm file bằng `ls` đường dẫn trực tiếp thay vì `find` toàn workspace.
- **F-145-T9-6 — Spike 10:19:55Z (load1 3,11) KHÔNG QUY ĐƯỢC NGUỒN:** snapshot ps lúc đó không có process nào trên 4,0% CPU (top: hatch daemon 4,0%); load5 1,06 / load15 0,62 cho thấy đây là đuôi decay của một burst đã kết thúc trước khi snapshot chụp. Ghi rõ là spike không quy được nguồn, không gán cho bất kỳ luồng nào — khác 31 spike còn lại đều quy được nguồn rõ ràng.
- **F-145-T9-7 — Khoảng trống lấy mẫu 60 giây + gap reboot 72 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu (hoặc trong gap reboot 72 giây) có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Đợt này khoảng cách tới guard rất lớn (thiếu ~2.371,1 MiB lúc đỉnh; T5 đỉnh 63,8% vẫn thiếu ~36,2%) nên khả năng vượt lén là không đáng kể — khác đợt 138 (thiếu 57 MiB). (Cùng lớp F-144-T9-6.)
- **F-145-T9-8 — T9 KHÔNG phán verdict #20 (đã có file T4-145: HỢP LỆ, median 58,0 ms):** file này trích verdict T4 từ `docs/PHASE9_ROUND145_T4_WEBKIT_QUIET20_LIMITS.md` và chỉ cung cấp dữ kiện sampler độc lập (§2.4–2.5). T9 KHÔNG phán B4 đúng/sai (B4 đã vá theo quyết parent (b) đợt 144 + T5 đối chiếu xong F-144-T9-9), không phán B2 (T4 sampler riêng mịn hơn; T9 cadence 60 s chỉ ghi tối đa 1,65 trong cửa sổ attempt, khớp max 1,78 của T4). T10 đối chiếu khi gộp.
- **F-145-T9-9 — T2-145 xuất bản TRƯỚC reboot #33, không có dữ kiện T2 cho boot 98a7c93f trong đợt này:** file T2-145 không nhắc tới boot 98a7c93f (grep 0 kết quả); số boot #109? + gap danh nghĩa 7.067 s (e146ca67→98a7c93f) + khung chết boot e146ca67 chờ T2-146/T10 chứng nhận bằng merged mù #64. (Khác với F-144-T9-9 — câu hỏi B4 đó ĐÃ được T5-145 đối chiếu xong dứt khoát, xem §2.5.)
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 146 (phần T9)

1. **⚠️ Headroom VẪN DƯỚI < ~1.800 (1.074, thấp hơn ngưỡng 726) — lần thứ năm liên tiếp dưới ngưỡng** (user đã được báo ở đợt 141; quyết parent đợt 144 (k): vẫn chỉ theo dõi). **Tỉ lệ/vite ~0,68 — sâu hơn dưới 1,0.** Bước giảm −222 PHÁ KỶ LỤC −202 đợt 144; hai đợt gần nhất giảm tổng −424. Tốc độ giảm không đều, không dự báo ngày chạm ngưỡng sâu hơn (chỉ là phép chia số học — KHÔNG phải dự báo). Quyết "chỉ theo dõi" đứng cho tới khi parent/user đổi; can thiệp host (dọn watch ngoài cell / tăng trần) vẫn ngoài tầm cell.
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d) + đợt 139 (e) + đợt 140 (f)(g) + đợt 141 (j) + đợt 142 + đợt 143 (k) + đợt 144 (n)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đỉnh đợt này 61,41% guard (T5: 63,8%) — cao nhất kể từ đợt 138 nhưng vẫn cách guard hơn một phần ba; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau**.
3. **Balloon đóng băng 6.443.824 kB trong 58/147 mẫu (39,5% cửa sổ)** — **đợt thứ tám liên tiếp** ở đúng giá trị này; quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" chưa thấy hiệu quả ở đợt 139/140/141/142/143/144/145 (chỉ xả răng cưa đầu mỗi vòng rồi đóng băng trở lại); nếu đợt 146 vẫn ~500–600 MB thì parent/T10 mới xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A). Quyết parent đợt 139: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB.
4. **Reboot #33 giữa lượt 09:54:03Z, khung chết boot e146ca67 KHÔNG CHỐT ĐƯỢC (nghịch lý đồng hồ 6 giây)** — giao T2/T6 chốt khung bằng nguồn khác; số boot mới 98a7c93f (#109? TẠM theo cách đếm chặt) + gap danh nghĩa 7.067 s chờ T2-146 chứng nhận (T2-145 xuất bản trước reboot nên không có dữ kiện này); replay boot mới: dpkg.log đủ 1.545 dòng lúc 09:58:17Z (boot +4m14s) nhưng replay os-intent vẫn chạy theo đợt sau đó — giao T5 đợt 146 đối chiếu. **Cửa sổ thoáng sau boot XUẤT HIỆN TRỞ LẠI (>20.000 lúc boot ~62 giây tuổi):** xuất hiện 4/6 đợt gần nhất, vắng 2/6 đợt (141, 144) — vẫn KHÔNG đáng tin làm cơ chế.
5. **Lượt yên #20 HỢP LỆ (T4, median 58,0 ms, attempt1).** Đợt 146 đo #21. B4 đã vá + sampler tag theo boot + attempt-tagging đã giao T4-145 làm xong trước khi đo #20 — quy trình mới chạy đúng.
6. **B2/tải tự sinh: ĐÃ CÓ ĐÁP ÁN KHẲNG ĐỊNH LẠI** — stack đo không sinh tải ≥3,0; tải cao đến từ harness T8 + setup attempt T4 + replay apt sau reboot (§2.5). Giao T4/T10 dùng dữ kiện này khi xét lại lớp B; T9-146 tiếp tục watcher spike để kiểm chứng. **Tiền đề quyết (j) đợt 144 sai một nửa (apt history.log CŨNG reset mỗi reboot — F-145-T5-1)** — parent xem có cần sửa quyết (j) ở đợt 145.
7. **Trần inotify đổi giữa boot (63.747 → 63.756, +9)** — lần đầu trong chuỗi T9; T10 lưu ý khi đối chiếu chuỗi dài (xem F-145-T9-4).
8. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 144 §11: mù #64 mới mở (T2-146: probe #64 + chứng nhận gap e146ca67→98a7c93f + khung chết #108?/e146ca67 bằng merged mù #64), G1 chờ user quyết, R9 (a) số đếm 16, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND145_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (do Phụ lục A+B: bảng sampler đầy đủ 147 mẫu theo yêu cầu brief — không cắt dữ liệu cần thiết) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 138/139/140/141/142/143/144). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round145-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.

## Phụ lục A — Bảng sampler đầy đủ, vòng 1 (boot e146ca67, 72 mẫu, 08:43:01–09:54:09Z)

| # | ts_utc | memavail_kb | memavail_mib | balloon_kb | swapfree_kb | load1 |
|---|---|---|---|---|---|---|
| 1 | 2026-11-19T08:43:01Z | 1394232 | 1361.6 | 4635484 | 625428 | 6.59 |
| 2 | 2026-11-19T08:44:02Z | 1700008 | 1660.2 | 4578732 | 614256 | 5.59 |
| 3 | 2026-11-19T08:45:02Z | 1482880 | 1448.1 | 4489912 | 611236 | 4.87 |
| 4 | 2026-11-19T08:46:02Z | 2673268 | 2610.6 | 4152424 | 608816 | 3.54 |
| 5 | 2026-11-19T08:47:03Z | 2395632 | 2339.5 | 4429056 | 618088 | 1.96 |
| 6 | 2026-11-19T08:48:03Z | 2292536 | 2238.8 | 4205288 | 618440 | 2.43 |
| 7 | 2026-11-19T08:49:03Z | 2510920 | 2452.1 | 4189888 | 638492 | 2.39 |
| 8 | 2026-11-19T08:50:03Z | 2853308 | 2786.4 | 3892156 | 654956 | 2.01 |
| 9 | 2026-11-19T08:51:03Z | 2605968 | 2544.9 | 4188984 | 658896 | 2.36 |
| 10 | 2026-11-19T08:52:03Z | 2306744 | 2252.7 | 4467620 | 659268 | 1.14 |
| 11 | 2026-11-19T08:53:03Z | 2070384 | 2021.9 | 4720956 | 659224 | 0.50 |
| 12 | 2026-11-19T08:54:03Z | 1366260 | 1334.2 | 4455372 | 632228 | 1.65 |
| 13 | 2026-11-19T08:55:03Z | 1909592 | 1864.8 | 4414916 | 637000 | 1.25 |
| 14 | 2026-11-19T08:56:03Z | 1679484 | 1640.1 | 4636216 | 638564 | 0.54 |
| 15 | 2026-11-19T08:57:04Z | 3210620 | 3135.4 | 3662776 | 753948 | 0.67 |
| 16 | 2026-11-19T08:58:04Z | 3863484 | 3772.9 | 3007404 | 764596 | 0.51 |
| 17 | 2026-11-19T08:59:04Z | 3451896 | 3371.0 | 3397672 | 765728 | 0.61 |
| 18 | 2026-11-19T09:00:04Z | 3090456 | 3018.0 | 3755644 | 769496 | 0.79 |
| 19 | 2026-11-19T09:01:04Z | 2730252 | 2666.3 | 4079936 | 770896 | 0.48 |
| 20 | 2026-11-19T09:02:04Z | 1781068 | 1739.3 | 4344636 | 771068 | 0.33 |
| 21 | 2026-11-19T09:03:04Z | 1659736 | 1620.8 | 4572404 | 771104 | 1.46 |
| 22 | 2026-11-19T09:04:04Z | 1481404 | 1446.7 | 4761408 | 711976 | 4.43 |
| 23 | 2026-11-19T09:05:04Z | 1489512 | 1454.6 | 4638420 | 714248 | 6.57 |
| 24 | 2026-11-19T09:06:04Z | 1528876 | 1493.0 | 4657096 | 700748 | 4.65 |
| 25 | 2026-11-19T09:07:04Z | 1378828 | 1346.5 | 4831824 | 686460 | 5.98 |
| 26 | 2026-11-19T09:08:05Z | 1300512 | 1270.0 | 4998228 | 688136 | 4.12 |
| 27 | 2026-11-19T09:09:05Z | 1166468 | 1139.1 | 5156244 | 686504 | 2.65 |
| 28 | 2026-11-19T09:10:05Z | 1102736 | 1076.9 | 5021492 | 652172 | 3.25 |
| 29 | 2026-11-19T09:11:05Z | 1815976 | 1773.4 | 5078848 | 647920 | 2.40 |
| 30 | 2026-11-19T09:12:05Z | 924892 | 903.2 | 5194148 | 641328 | 3.16 |
| 31 | 2026-11-19T09:13:05Z | 762184 | 744.3 | 5312568 | 632276 | 3.42 |
| 32 | 2026-11-19T09:14:06Z | 853312 | 833.3 | 5337908 | 622744 | 3.20 |
| 33 | 2026-11-19T09:15:06Z | 674276 | 658.5 | 5451128 | 619180 | 3.42 |
| 34 | 2026-11-19T09:16:06Z | 679660 | 663.7 | 5566440 | 619960 | 2.64 |
| 35 | 2026-11-19T09:17:06Z | 542132 | 529.4 | 5684524 | 620224 | 1.98 |
| 36 | 2026-11-19T09:18:06Z | 1535224 | 1499.2 | 5353200 | 619504 | 1.44 |
| 37 | 2026-11-19T09:19:06Z | 1370304 | 1338.2 | 5528976 | 622168 | 1.09 |
| 38 | 2026-11-19T09:20:06Z | 1432524 | 1398.9 | 5490920 | 625444 | 2.07 |
| 39 | 2026-11-19T09:21:06Z | 1428992 | 1395.5 | 5419440 | 648740 | 1.15 |
| 40 | 2026-11-19T09:22:06Z | 1325588 | 1294.5 | 5590780 | 651496 | 0.71 |
| 41 | 2026-11-19T09:23:06Z | 1188452 | 1160.6 | 5749500 | 652844 | 0.30 |
| 42 | 2026-11-19T09:24:06Z | 1027132 | 1003.1 | 5890820 | 654560 | 0.11 |
| 43 | 2026-11-19T09:25:07Z | 901048 | 879.9 | 6018968 | 656516 | 0.75 |
| 44 | 2026-11-19T09:26:07Z | 735848 | 718.6 | 6134284 | 656696 | 0.47 |
| 45 | 2026-11-19T09:27:07Z | 687996 | 671.9 | 6239940 | 658032 | 0.29 |
| 46 | 2026-11-19T09:28:07Z | 559620 | 546.5 | 6336480 | 655372 | 0.18 |
| 47 | 2026-11-19T09:29:07Z | 517200 | 505.1 | 6424640 | 652124 | 0.06 |
| 48 | 2026-11-19T09:30:07Z | 482144 | 470.8 | 6443824 | 652872 | 0.18 |
| 49 | 2026-11-19T09:31:07Z | 466824 | 455.9 | 6443824 | 651192 | 0.06 |
| 50 | 2026-11-19T09:32:07Z | 518484 | 506.3 | 6443824 | 650548 | 0.02 |
| 51 | 2026-11-19T09:33:07Z | 429392 | 419.3 | 6443824 | 647356 | 0.01 |
| 52 | 2026-11-19T09:34:07Z | 476744 | 465.6 | 6443824 | 641300 | 0.18 |
| 53 | 2026-11-19T09:35:07Z | 474296 | 463.2 | 6443824 | 641488 | 0.18 |
| 54 | 2026-11-19T09:36:07Z | 560192 | 547.1 | 6443824 | 617796 | 1.24 |
| 55 | 2026-11-19T09:37:08Z | 757944 | 740.2 | 6217208 | 608468 | 0.93 |
| 56 | 2026-11-19T09:38:08Z | 670848 | 655.1 | 6319976 | 607292 | 0.72 |
| 57 | 2026-11-19T09:39:08Z | 580352 | 566.8 | 6412664 | 608360 | 0.26 |
| 58 | 2026-11-19T09:40:08Z | 542564 | 529.8 | 6443824 | 607188 | 0.10 |
| 59 | 2026-11-19T09:41:08Z | 517512 | 505.4 | 6443824 | 612080 | 0.27 |
| 60 | 2026-11-19T09:42:08Z | 812856 | 793.8 | 6050608 | 628540 | 0.10 |
| 61 | 2026-11-19T09:43:08Z | 780372 | 762.1 | 6163224 | 629964 | 0.14 |
| 62 | 2026-11-19T09:44:08Z | 665632 | 650.0 | 6265920 | 636688 | 0.17 |
| 63 | 2026-11-19T09:45:08Z | 756664 | 738.9 | 6120280 | 636544 | 0.89 |
| 64 | 2026-11-19T09:46:08Z | 697508 | 681.2 | 6225660 | 664372 | 0.49 |
| 65 | 2026-11-19T09:47:08Z | 601576 | 587.5 | 6324768 | 661828 | 0.42 |
| 66 | 2026-11-19T09:48:08Z | 506516 | 494.6 | 6411376 | 659392 | 0.31 |
| 67 | 2026-11-19T09:49:09Z | 480848 | 469.6 | 6443824 | 654148 | 0.11 |
| 68 | 2026-11-19T09:50:09Z | 466356 | 455.4 | 6443824 | 653004 | 0.07 |
| 69 | 2026-11-19T09:51:09Z | 466176 | 455.2 | 6443824 | 652584 | 0.09 |
| 70 | 2026-11-19T09:52:09Z | 531680 | 519.2 | 6443824 | 631156 | 0.81 |
| 71 | 2026-11-19T09:53:09Z | 663572 | 648.0 | 6309016 | 627920 | 0.44 |
| 72 | 2026-11-19T09:54:09Z | 567416 | 554.1 | 6401708 | 628428 | 0.29 |

## Phụ lục B — Bảng sampler đầy đủ, vòng 2 (boot 98a7c93f, 75 mẫu, 09:55:21–11:09:28Z)

| # | ts_utc | memavail_kb | memavail_mib | balloon_kb | swapfree_kb | load1 |
|---|---|---|---|---|---|---|
| 73 | 2026-11-19T09:55:21Z | 1781544 | 1739.8 | 5094544 | 1040624 | 4.32 |
| 74 | 2026-11-19T09:56:21Z | 1999544 | 1952.7 | 4780056 | 988000 | 3.66 |
| 75 | 2026-11-19T09:57:21Z | 1763204 | 1721.9 | 5069544 | 909776 | 2.38 |
| 76 | 2026-11-19T09:58:22Z | 1924736 | 1879.6 | 4941528 | 824660 | 2.52 |
| 77 | 2026-11-19T09:59:22Z | 1814456 | 1771.9 | 5161904 | 818380 | 1.11 |
| 78 | 2026-11-19T10:00:22Z | 1622480 | 1584.5 | 5363316 | 816224 | 0.56 |
| 79 | 2026-11-19T10:01:22Z | 1469136 | 1434.7 | 5547052 | 796784 | 0.24 |
| 80 | 2026-11-19T10:02:22Z | 1284960 | 1254.8 | 5713588 | 784324 | 0.22 |
| 81 | 2026-11-19T10:03:22Z | 1142304 | 1115.5 | 5865740 | 782732 | 0.12 |
| 82 | 2026-11-19T10:04:22Z | 1004452 | 980.9 | 6002948 | 779280 | 0.04 |
| 83 | 2026-11-19T10:05:22Z | 862340 | 842.1 | 6128056 | 760664 | 0.11 |
| 84 | 2026-11-19T10:06:22Z | 780044 | 761.8 | 6242176 | 753340 | 0.04 |
| 85 | 2026-11-19T10:07:22Z | 652564 | 637.3 | 6345472 | 753084 | 0.01 |
| 86 | 2026-11-19T10:08:22Z | 541104 | 528.4 | 6438740 | 750244 | 0.00 |
| 87 | 2026-11-19T10:09:22Z | 580748 | 567.1 | 6443824 | 748792 | 0.00 |
| 88 | 2026-11-19T10:10:23Z | 576556 | 563.0 | 6443824 | 740592 | 0.03 |
| 89 | 2026-11-19T10:11:23Z | 561104 | 548.0 | 6443824 | 740428 | 0.01 |
| 90 | 2026-11-19T10:12:23Z | 567420 | 554.1 | 6443824 | 740156 | 0.00 |
| 91 | 2026-11-19T10:13:23Z | 560348 | 547.2 | 6443824 | 740000 | 0.04 |
| 92 | 2026-11-19T10:14:23Z | 647036 | 631.9 | 6443824 | 699420 | 0.78 |
| 93 | 2026-11-19T10:15:23Z | 563160 | 550.0 | 6443824 | 694820 | 0.35 |
| 94 | 2026-11-19T10:16:23Z | 590196 | 576.4 | 6443824 | 691124 | 0.16 |
| 95 | 2026-11-19T10:17:23Z | 602440 | 588.3 | 6443824 | 691772 | 0.06 |
| 96 | 2026-11-19T10:18:23Z | 619040 | 604.5 | 6443824 | 692148 | 0.10 |
| 97 | 2026-11-19T10:19:23Z | 597512 | 583.5 | 6443824 | 692380 | 1.84 |
| 98 | 2026-11-19T10:20:23Z | 611748 | 597.4 | 6443824 | 694380 | 2.95 |
| 99 | 2026-11-19T10:21:24Z | 549628 | 536.7 | 6443824 | 690272 | 2.19 |
| 100 | 2026-11-19T10:22:24Z | 580040 | 566.4 | 6443824 | 691196 | 1.94 |
| 101 | 2026-11-19T10:23:24Z | 587956 | 574.2 | 6443824 | 692168 | 1.86 |
| 102 | 2026-11-19T10:24:24Z | 570636 | 557.3 | 6443824 | 695396 | 1.39 |
| 103 | 2026-11-19T10:25:24Z | 589916 | 576.1 | 6443824 | 698156 | 1.28 |
| 104 | 2026-11-19T10:26:24Z | 574684 | 561.2 | 6443824 | 698568 | 1.28 |
| 105 | 2026-11-19T10:27:24Z | 571752 | 558.4 | 6443824 | 698552 | 1.10 |
| 106 | 2026-11-19T10:28:24Z | 577344 | 563.8 | 6443824 | 698508 | 1.09 |
| 107 | 2026-11-19T10:29:24Z | 571004 | 557.6 | 6443824 | 698472 | 1.24 |
| 108 | 2026-11-19T10:30:24Z | 777596 | 759.4 | 6247216 | 685124 | 2.16 |
| 109 | 2026-11-19T10:31:24Z | 946152 | 924.0 | 6092728 | 681364 | 2.21 |
| 110 | 2026-11-19T10:32:25Z | 846240 | 826.4 | 6213668 | 677420 | 1.92 |
| 111 | 2026-11-19T10:33:25Z | 743092 | 725.7 | 6323356 | 665360 | 1.99 |
| 112 | 2026-11-19T10:34:25Z | 628208 | 613.5 | 6422068 | 666004 | 2.51 |
| 113 | 2026-11-19T10:35:25Z | 601956 | 587.8 | 6443824 | 669580 | 2.04 |
| 114 | 2026-11-19T10:36:25Z | 593100 | 579.2 | 6443824 | 668668 | 1.24 |
| 115 | 2026-11-19T10:37:25Z | 611440 | 597.1 | 6443824 | 668264 | 0.58 |
| 116 | 2026-11-19T10:38:25Z | 605744 | 591.5 | 6443824 | 668044 | 0.21 |
| 117 | 2026-11-19T10:39:25Z | 601468 | 587.4 | 6443824 | 668000 | 0.34 |
| 118 | 2026-11-19T10:40:25Z | 592300 | 578.4 | 6443824 | 670808 | 0.26 |
| 119 | 2026-11-19T10:41:25Z | 566780 | 553.5 | 6443824 | 670528 | 0.23 |
| 120 | 2026-11-19T10:42:25Z | 551652 | 538.7 | 6443824 | 682272 | 1.14 |
| 121 | 2026-11-19T10:43:25Z | 560688 | 547.5 | 6443824 | 679300 | 1.40 |
| 122 | 2026-11-19T10:44:26Z | 556644 | 543.6 | 6443824 | 680644 | 0.69 |
| 123 | 2026-11-19T10:45:26Z | 570976 | 557.6 | 6443824 | 680068 | 0.46 |
| 124 | 2026-11-19T10:46:26Z | 894844 | 873.9 | 6050608 | 663800 | 1.37 |
| 125 | 2026-11-19T10:47:26Z | 867484 | 847.2 | 6130872 | 666572 | 0.86 |
| 126 | 2026-11-19T10:48:26Z | 754744 | 737.1 | 6243456 | 665772 | 0.61 |
| 127 | 2026-11-19T10:49:26Z | 644940 | 629.8 | 6345888 | 664036 | 0.36 |
| 128 | 2026-11-19T10:50:26Z | 559472 | 546.4 | 6440068 | 662076 | 0.27 |
| 129 | 2026-11-19T10:51:26Z | 559104 | 546.0 | 6443824 | 661936 | 0.45 |
| 130 | 2026-11-19T10:52:26Z | 556060 | 543.0 | 6443824 | 661888 | 0.20 |
| 131 | 2026-11-19T10:53:26Z | 562000 | 548.8 | 6443824 | 663424 | 0.27 |
| 132 | 2026-11-19T10:54:26Z | 566516 | 553.2 | 6443824 | 664160 | 0.32 |
| 133 | 2026-11-19T10:55:27Z | 640928 | 625.9 | 6443824 | 768404 | 0.17 |
| 134 | 2026-11-19T10:56:27Z | 613328 | 599.0 | 6443824 | 769976 | 0.26 |
| 135 | 2026-11-19T10:57:27Z | 618248 | 603.8 | 6443824 | 769508 | 0.30 |
| 136 | 2026-11-19T10:58:27Z | 621500 | 606.9 | 6443824 | 769288 | 0.11 |
| 137 | 2026-11-19T10:59:27Z | 591668 | 577.8 | 6443824 | 769212 | 0.07 |
| 138 | 2026-11-19T11:00:27Z | 595224 | 581.3 | 6443824 | 773400 | 0.29 |
| 139 | 2026-11-19T11:01:27Z | 594944 | 581.0 | 6443824 | 773624 | 0.15 |
| 140 | 2026-11-19T11:02:27Z | 616032 | 601.6 | 6443824 | 772652 | 0.56 |
| 141 | 2026-11-19T11:03:27Z | 1124316 | 1098.0 | 5854000 | 752924 | 1.05 |
| 142 | 2026-11-19T11:04:27Z | 987848 | 964.7 | 5993876 | 753800 | 0.49 |
| 143 | 2026-11-19T11:05:27Z | 878252 | 857.7 | 6118864 | 750124 | 0.86 |
| 144 | 2026-11-19T11:06:27Z | 772584 | 754.5 | 6234180 | 749184 | 0.37 |
| 145 | 2026-11-19T11:07:28Z | 682544 | 666.5 | 6340456 | 749288 | 0.13 |
| 146 | 2026-11-19T11:08:28Z | 584188 | 570.5 | 6436324 | 747560 | 0.05 |
| 147 | 2026-11-19T11:09:28Z | 589432 | 575.6 | 6443824 | 746328 | 0.29 |
