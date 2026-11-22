# LIMITS — Phase 9 đợt 140, T9: headroom inotify + RAM + guard birefnet (REBOOT GIỮA LƯỢT, SAMPLER KHỞI ĐỘNG LẠI)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 1.840** (đo 2 lần trên boot af558fb5 btime **15:54:37Z**: 1.840 lúc 17:38:54Z và **1.840** lúc 17:38:59Z 18/11, chênh **0**) — **TIẾP TỤC GIẢM**: 1.954 (đợt 139) → **1.840 (−114, −5,8%)**. Bước giảm nằm trong dải 106–127 của **mười một đợt gần nhất (130–140)**. Xem §1.
- **CHƯA tới ngưỡng báo user (< ~1.800) — nhưng chỉ còn cách 40.** Ngưỡng có thể chạm ngay đợt 141 nếu đà giữ nguyên (40 / ~114 ≈ 0,35 đợt — chỉ là phép chia số học, KHÔNG phải dự báo). **Cờ cho T10/parent: nếu đợt 141 chạm <1.800 thì báo user lúc đó theo quyết parent đợt 139.** Vẫn gấp ~1,17 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi.**
- **Cùng boot af558fb5 với vòng 2 đợt 139 — headroom GIẢM NGAY TRONG CÙNG BOOT:** 1.945 (đo lần 3 đợt 139, 15:56:41Z) → 1.840 (17:38:54Z) = **−105 trong 1h42' trên cùng một boot**. Suy giảm không chỉ xảy ra qua reboot. Xem §1.4, F-140-T9-1.
- **REBOOT GIỮA CỬA SỔ ĐO (sự kiện mới): boot af558fb5 chết, boot mới 90392aa5 lên thay, btime 17:52:56Z.** Sampler vòng 1 bị SIGTERM giết cùng lúc (15 mẫu, 17:39:13–17:53:15Z); đã khởi động lại vòng 2 trên boot mới lúc ~17:55Z (gap lấy mẫu ~2 phút). Đo headroom lần 3 trên boot mới: probe thêm **20.000 watch không gặp ENOSPC lúc 17:54:16Z** (boot 80 giây tuổi — cửa sổ thoáng ngay sau boot), nhưng đo lại 29 giây sau (17:54:45Z, probe trần cao) đã về **1.840** — giá trị ổn định trên boot mới **Y HỆT boot cũ (chênh 0)**. Giá trị chuỗi vẫn lấy 1.840 (đo trên boot lúc mở đợt). Xem §1.5, §5.
- **RAM:** đỉnh chỉ 36,49% guard. Max toàn cửa sổ (92 mẫu, hai vòng): **2.295.468 kB = 2.241,7 MiB lúc 17:57:20Z** (boot mới), thiếu **3.995.988 kB (~3.902,3 MiB)** mới tới guard 6.291.456 kB. Min toàn cửa sổ: **474.204 kB (463,1 MiB) lúc 18:43:24Z**. **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** Xem §2.
- **Balloon virtio:** ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM) trong 48/92 mẫu — vòng 1: 0 mẫu; vòng 2: 48 mẫu thành 5 đợt (4 + 12 + 14 + 14 + 4 mẫu). Giá trị đóng băng y hệt đợt 138/139 — balloon KHÔNG xả bền; RAM phẳng ~0,5 GB suốt nửa sau cửa sổ vòng 2. Xem §2.2.
- **Median tickCost lượt yên #17 (T4): CHƯA CÓ lúc T9 đóng — giao T10 (T4-140 chưa xuất bản LIMITS lúc 19:13Z; chỉ có file phân tích attempt1)** Xem §2.3.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào** (journal 0 dòng "No space left"/ENOSPC từ btime 15:54:37Z). Replay dpkg 1.545 dòng lúc T9 mở (ghi cuối 16:11:16Z — y hệt lúc T9-139 đóng); số lúc đóng xem §5. T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 140 (boot af558fb5, btime 15:54:37Z — cùng boot với vòng 2 đợt 139)

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| 17:38:54Z | **1.840** | lần đo 1, boot ~1h44' tuổi; RAM trước đo 910.388 kB, balloon 5.930.172 kB |
| 17:38:59Z | **1.840** | lần đo 2 (chênh **0** so với lần 1) |

- Probe dừng ở `i=1840` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 0 trong cùng boot:** lần thứ ba liên tiếp chuỗi T9 ghi chênh 0 ở cả hai lần đo chính (đợt 138, 139 cũng 0). Giá trị đợt lấy **1.840**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 1.840 = **61.907 watch** (tăng ~114 so với 61.793 đợt 139).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 1.840 / 1.578 ≈ **1,17 lần** — đủ cho ~1 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–139 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **140** | **1.840 → 1.840** | **đo 17:38:54Z → 17:38:59Z, boot af558fb5 btime 15:54:37Z (cùng boot với vòng 2 đợt 139)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954 → 1.840**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 1.840 = **−2.598 (−58,5%)**. Bước giảm đợt này: −114 so với đợt 139 (−5,8%) — **đợt thứ mười một liên tiếp bước giảm nằm trong dải 106–127** (130: −116; 131: −117; 132: −108; 133: −106; 134: −127; 135: −110; 136: −114; 137: −106; 138: −111; 139: −110; 140: −114).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM — còn cách 40** (đợt 139 còn 154). Con số giảm ~106–127/đợt chỉ là phép chia số học minh họa (40 / ~114 ≈ 0,35 đợt nếu đà giữ nguyên) — **KHÔNG phải dự báo** (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot; quyết parent đứng). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user. **Lưu ý: với đà này, ngưỡng ~1.800 có thể chạm ngay đợt 141 — T10/parent lưu ý khi gộp, nhưng T9 không tự đổi quyết theo dõi.**
- Trần 63.747 vẫn đầy ở mức ~61,9k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Giảm ngay trong cùng boot af558fb5 (đối chiếu với đo lần 3 đợt 139)

- Đợt 139 đo lần 3 trên boot mới af558fb5: **1.945 lúc 15:56:41Z** (boot ~2' tuổi). Đợt 140 đo lại trên **cùng boot** lúc 17:38:54Z: **1.840** — giảm **−105 trong 1h42'** mà không có reboot nào ở giữa (boot_id không đổi af558fb5, btime không đổi 15:54:37Z).
- **Kết luận: suy giảm headroom xảy ra cả trong cùng một boot, không chỉ qua reboot.** Các đợt trước thường chỉ đối chiếu giá trị giữa các boot khác nhau; đây là lần đầu chuỗi T9 ghi được một cặp đo cách nhau ~2 giờ trên cùng boot với mức giảm −105 (cùng bậc với bước giảm liên đợt ~106–127). T9 ghi nhận, không kết luận cơ chế (watch ngoài cell tăng do tiến trình host — ngoài tầm xác minh của cell). Xem F-140-T9-1.

### 1.5 Đo lần 3 + 3b — boot mới 90392aa5 (ngoài chuỗi, chỉ để đối chiếu)

- **Lần 3, 17:54:16Z (boot 80 giây tuổi): probe thêm 20.000 watch KHÔNG gặp ENOSPC** — chạm trần CAP=20.000 của script K8, dừng với thông báo "no failure after 20000 watches; headroom > 20000". RAM trước đo 1.773.640 kB, balloon 5.095.928 kB, SwapFree 1.040.624 kB. File tạm đã dọn sạch.
- **Lần 3b, 17:54:45Z (boot 109 giây tuổi, script trần cao CAP=63.747): STOP ở `i=1840`, errno=28** — **headroom ổn định trên boot mới = 1.840, Y HỆT boot cũ (chênh 0)**. RAM trước đo 1.606.232 kB, SwapFree 1.025.164 kB. File tạm đã dọn sạch.
- **Giải thích thận trọng (ghi nhận, không kết luận cơ chế):** cửa sổ thoáng >20.000 chỉ tồn tại trong ~1–2 phút đầu sau boot — các tiến trình giữ watch ngoài cell chưa kịp đăng ký lại watch sau reboot; tới 17:54:45Z chúng đã đăng ký lại xong và headroom trở về đúng giá trị trước reboot (1.840). Bằng chứng ủng hộ: giá trị ổn định sau reboot khớp tuyệt đối với trước reboot (1.840 = 1.840), giống mẫu đợt 139 (1.945 sau reboot so với 1.954 trước — chênh 9). **Không đưa giá trị >20.000 vào chuỗi §1.3** — chuỗi lấy giá trị ổn định trên boot lúc mở đợt (1.840); giá trị thoáng ngay sau boot không phải mức headroom vận hành (chỉ tồn tại <2 phút, không dùng được cho vite chạy dài). Xem F-140-T9-2.
- Hệ quả thực hành: **reboot KHÔNG reset chuỗi suy giảm headroom** — giá trị ổn định sau reboot bằng đúng giá trị trước reboot. Ngưỡng ~1.800 vẫn chỉ còn cách 40.

## 2. RAM khả dụng (tổng 8.124.896 kB, swap 1.023 MB) — sampler dài 92 mẫu, 17:39:13–19:11:26Z

### 2.1 Hình dạng cửa sổ: nhô sớm sau reboot rồi kẹt ~0,5 GB

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 17:39:13–17:53:15Z, 15 mẫu, boot cũ af558fb5 — bị SIGTERM giết cùng lúc reboot 17:52:56Z. Vòng 2: 17:55:20–19:11:26Z, 77 mẫu, boot mới 90392aa5 — chạy tới hết hạn 19:12Z.** Tổng **92 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 474.204 kB (463,1 MiB) lúc 18:43:24Z (boot mới). Max toàn cửa sổ: 2.295.468 kB (2.241,7 MiB) lúc 17:57:20Z (boot mới).** Mean vòng 1 ~899.471 kB; mean vòng 2 ~715.385 kB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot cũ af558fb5 = #97? (tạm) (15 mẫu, 17:39:13–17:53:15Z) — dao động hẹp 695–1.146 MiB, không đợt hồi:**

| Thời điểm (UTC) | RAM khả dụng | Balloon | Ghi chú |
|---|---|---|---|
| 17:38:54Z | 889,0 MiB (910.388 kB) | 5.930.172 kB | trước probe 1 |
| 17:39:13Z | 815,6 MiB (835.168 kB) | 5.930.172 kB | mẫu sampler đầu |
| 17:46:14Z | **694,9 MiB (711.628 kB)** | 6.166.872 kB | **MIN vòng 1** |
| 17:47:14Z | **1.146,2 MiB (1.173.700 kB)** | 5.721.016 kB | **MAX vòng 1, 18,66% guard** |
| 17:52:15Z | 750,9 MiB (768.972 kB) | 5.518.696 kB | mẫu cuối chắc chắn boot cũ |
| 17:53:15Z | 874,2 MiB (895.172 kB) | 5.387.196 kB | mẫu cuối vòng 1 — boot chưa rõ (F-140-T9-3) |

- Vòng 1 không có đợt hồi nào đáng kể: RAM loanh quanh 695–1.146 MiB, balloon 5.136.712–6.166.872 kB, **không mẫu nào đóng băng 6.443.824 kB**. Load1 0,93–3,93 — máy bận hơn các đợt trước lúc mở (các luồng đợt 140 đang chạy).

**Boot mới 90392aa5 = #98? (tạm) (77 mẫu, 17:55:20–19:11:26Z) — nhô sớm rồi kẹt thấp, balloon đóng băng trở lại:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 17:55:20Z | 1.494,0 MiB (1.529.816 kB) | mẫu đầu sau reboot (balloon 5.285.524 kB; SwapFree 1.018.164 kB — swap gần trống) |
| 17:57:20Z | **2.241,7 MiB (2.295.468 kB)** | **MAX cửa sổ, 36,49% guard** (balloon min cửa sổ 4.547.464 kB) |
| 17:58:20–18:05:21Z | 1.959,6 → 879,9 MiB | rơi đơn điệu sau đỉnh |
| 18:06:21–18:11:21Z | 932,8 → 522,9 MiB | lùi về trũng; balloon phình lại 6.416.616 kB |
| 18:12:21–18:15:22Z | 507,3 → 531,1 MiB | **vùng trũng 1**: balloon đóng băng 6.443.824 kB (4 mẫu) |
| 18:16:22Z | 934,6 MiB | nhô ngắn 1 mẫu (balloon xả tạm về 6.020.068 kB), rồi lùi |
| 18:21:22–18:32:23Z | 519,1 → 566,0 MiB | **vùng trũng 2**: balloon đóng băng suốt 12 mẫu |
| 18:33:23Z | 718,6 MiB | nhô ngắn 1 mẫu (balloon 6.277.568 kB), rồi lùi |
| 18:35:24–18:48:24Z | 508,2 → 548,3 MiB | **vùng trũng 3**: balloon đóng băng suốt 14 mẫu |
| 18:49:24Z | 680,8 MiB | nhô ngắn 1 mẫu (balloon 6.281.448 kB), rồi lùi |
| 18:51:24–19:04:25Z | 539,4 → 551,5 MiB | **vùng trũng 4**: balloon đóng băng suốt 14 mẫu |
| 19:05:25Z | 816,4 MiB | nhô ngắn 1 mẫu (balloon 6.181.680 kB), rồi lùi |
| 19:08:26–19:11:26Z | 563,9 → 523,1 MiB | **vùng trũng 5**: balloon đóng băng 4 mẫu cuối tới hết cửa sổ |

- Min boot mới 474.204 kB (463,1 MiB) lúc 18:43:24Z; max boot mới 2.295.468 kB (2.241,7 MiB) lúc 17:57:20Z — chỉ 36,49% guard.
- Sau đỉnh 17:57:20Z, **không mẫu nào trên boot mới vượt 1.529.816 kB** (mẫu đầu). Bốn lần nhô (18:16:22Z, 18:33:23Z, 18:49:24Z, 19:05:25Z) đều chỉ 1 mẫu rồi lùi ngay — không đợt hồi nào bền.
- Load1 trong cửa sổ: 0,11–3,93 — máy gần như yên trong phần lớn cửa sổ vòng 2 (nhiều mẫu load1 0,11–0,47) mà RAM vẫn kẹt ~0,5 GB: RAM thấp không phải do tải trong cell, mà do balloon host giữ.
- Swap: SwapFree 646.996 kB lúc mẫu đầu vòng 1 → **1.042.168 kB ngay sau reboot** (swap gần như trống, chỉ ~4 MB đang dùng — reboot xả swap) → 1.018.164 kB (mẫu đầu vòng 2) → 695.588 kB lúc cuối (swap đang dùng ~350 MB). Xem F-139-T9-4 (cùng lớp quan sát).

### 2.2 Balloon virtio — xả nông đầu boot mới rồi đóng băng y hệt đợt 138/139

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 5.930.172 kB (17:38:54Z, lúc đo đầu) → **min 5.136.712 kB lúc 17:49:15Z (63,2% tổng RAM)** → 5.387.196 kB (17:53:15Z, mẫu chưa rõ boot). **Không mẫu nào đóng băng 6.443.824 kB trên boot cũ.**
- Boot mới: 5.285.524 kB (17:55:20Z) → **min 4.547.464 kB lúc 17:57:20Z (56,0% tổng RAM, đúng lúc đỉnh RAM)** → phình lại **6.443.824 kB (79,3% tổng RAM)** rồi **ĐÓNG BĂNG đúng giá trị này qua 48 mẫu** (5 đợt: 18:12:21–18:15:22Z 4 mẫu; 18:21:22–18:32:23Z 12 mẫu; 18:35:24–18:48:24Z 14 mẫu; 18:51:24–19:04:25Z 14 mẫu; 19:08:26–19:11:26Z 4 mẫu; chỉ gián đoạn bởi các lần nhô 1 mẫu khi balloon xả tạm ~160–420 MB). Giá trị 6.443.824 kB lặp lại y hệt qua ba đợt (138 + 139 + 140) và ba boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (đo đầu 17:38:54Z → mẫu cuối 19:11:26Z): balloon 5.930.172 kB → 6.443.824 kB = **+513.652 kB (~+0,50 GB)**. Lúc đóng (19:12:58Z, sau sampler): balloon vẫn đóng băng 6.443.824 kB, RAM 504.144 kB.
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 140 VẪN KHÔNG thấy xả bền:** balloon đóng băng 6.443.824 kB trong 48/92 mẫu (52,2% cửa sổ — cao hơn 23/109 mẫu đợt 139) và RAM phẳng ~0,5 GB suốt nửa sau cửa sổ vòng 2. Đây là **đợt thứ ba liên tiếp** balloon đóng băng ở đúng giá trị này. Quyết parent đợt 139 đã ghi: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 141.
- Số học lúc đỉnh RAM 17:57:20Z: tổng RAM 8.124.896 kB − balloon 4.547.464 kB = 3.577.432 kB còn lại cho hệ thống; trong đó MemAvailable 2.295.468 kB + free/cache ~1,28 GB. Lúc cuối cửa sổ 19:11:26Z: tổng RAM − balloon 6.443.824 kB = 1.681.072 kB còn lại; MemAvailable chỉ 535.628 kB.

### 2.3 Median tickCost lượt yên #17 (T4) — CHƯA CÓ, GIAO T10

- **T4-140 chưa xuất bản LIMITS lúc T9 đóng (19:13Z).** `docs/` chỉ có T1/T2/T5/T6/T9 đợt 140; thư mục `hidden_files/round140-t4/` chỉ có file phân tích attempt1 (`analyze-t4-attempt1-*.txt`) và script poll — chưa có file LIMITS, chưa có cờ `.done`. T9 không tự đo tickCost (không thuộc phạm vi T9) và không suy đoán số. **Giao T10 lấy median tickCost #17 từ T4 khi gộp** (theo brief: nếu T4 chưa xong lúc đóng thì ghi rõ "giao T10"). Chuỗi median 13 lượt đã biết: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / 41,0 ms (trung bình ≈ 47,9 ms). Ngưỡng ≤60 ms KHÔNG BÀN LẠI.

### 2.4 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

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
| **140** | ****~0,89 GB (brief không ghi; T9 đo trực tiếp 910.388 kB lúc 17:38:54Z, 835.168 kB lúc 17:39:13Z)**** | ****695–1.146 MiB (boot cũ, 15 mẫu, 17:39:13–17:53:15Z) rồi 463–2.242 MiB (boot mới, 77 mẫu, 17:55:20–19:11:26Z); REBOOT 17:52:56Z cắt giữa hai pha; gap lấy mẫu ~2 phút** (sampler dài của T9, ~92 phút)** | ****523 MiB lúc 19:11:26Z (504 MB lúc 19:12:58Z, sau sampler)**** |

## 3. Guard birefnet — KHÔNG ĐẠT (36,49%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9 thử ngay khi cửa sổ mở; quyết parent đợt 139 (e) GIỮ NGUYÊN quy trình + guard 6.144 MiB, không thử ở ~99% như đợt 138): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- - Số lớn nhất quan sát được đợt này (sampler T9, 92 mẫu, hai vòng): **2.295.468 kB = 2.241,7 MiB = 36,49% guard** lúc **17:57:20Z** (boot mới, 4 phút sau boot) — thiếu **3.995.988 kB (~3.902,3 MiB, ~63,5%)**.
- Không có mẫu nào trên boot cũ vượt 1.173.700 kB (18,66% guard). **0 mẫu ≥ 6.144 MiB ở bất kỳ vòng nào.** Không có cửa sổ nào để thử — khác hẳn đợt 138 (đỉnh 99,07% rồi bị reboot cắt): đợt này đỉnh còn cách guard gần hai phần ba.
- Đỉnh đợt này (36,49%) thấp hơn đợt 139 (42,44%) — **đỉnh THẤP thứ hai trong các đợt hồi gần đây** (sau đợt 135: ~27,6%); chuỗi đỉnh các đợt 136→140: 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB, **2.242 MB**.
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Quy trình "thử ngay" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 19:12:26Z, watcher guard chạy suốt cả hai vòng — cờ guard-open.flag KHÔNG xuất hiện), cửa sổ chỉ không mở.

### 3.1 Sẵn sàng thử đã xác minh lại (17:39Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được (kiểm lại đợt này, khớp đợt 138/139).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-140-birefnet/out-birefnet-140.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-140-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (kiểm tra `ps` lúc 17:38Z , 17:54Z và lúc 19:12Z; chỉ có tiến trình hệ thống + các luồng đợt 140) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 1.840 chỉ đủ ~1 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=1840, i=1840) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 15:54:37Z: **0 dòng "No space left" / ENOSPC** (kiểm tra 17:38Z, "-- No entries --" ; kiểm tra lại 19:12Z trên boot mới cũng 0 dòng). `journalctl --list-boots` chỉ hiện boot mới 90392aa5 (first entry 17:53:12Z) — boot cũ không còn trong journal của cell, như đợt 138/139.
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 140 = boot lúc T9 đo đầu = boot vòng 2 đợt 139:** btime **15:54:37Z** 18/11 (`uptime -s` 15:54:37 + `btime 1795017277` trong `/proc/stat` + boot_id `af558fb5-e964-4116-a69b-ec784f3defab` + `who -b`: system boot Nov 18 15:54). Không có reboot nào giữa đợt 139 và đợt 140. Số boot #97? (tạm, theo T8-139) — chờ T2 đợt 140 / T10 chốt.
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9: boot mới 90392aa5, btime 17:52:56Z** (`uptime -s` 17:52:56 + `btime 1795024376` + boot_id `90392aa5-f13b-4048-9c57-e4defc8e74d9` + `who -b`: system boot Nov 18 17:53 + journal first entry 17:53:12Z). Boot cũ sống 15:54:37Z → 17:52:56Z = **1h58m19s**. Số sự kiện reboot + số boot mới chờ T6 chốt; số boot mới #98? là **tạm, chờ T2 đợt 140 / T10 chốt** (nối tiếp #97? của T8-139).
- **Khung chết boot cũ:** mốc cuối chắc chắn còn sống trên boot cũ là mẫu sampler 17:52:15Z (768.972 kB) → khung **(17:52:15Z, 17:52:56Z] (41 s)**. Mẫu 17:53:15Z (895.172 kB, balloon 5.387.196 kB, SwapFree 644.096 kB) mang timestamp **19 giây SAU btime boot mới** nhưng do vòng lặp cũ ghi — boot của mẫu này **chưa rõ**, xếp vào pha boot cũ theo quỹ đạo giá trị (SwapFree nối tiếp quỹ đạo boot cũ, trong khi mẫu đầu sau reboot đã là SwapFree 1.042.168 kB — swap gần trống sau reboot) — xem F-140-T9-3. (Cùng lớp F-139-T9-3.)
- **Runtime restart đi kèm reboot:** phiên exec sampler vòng 1 của T9 bị SIGTERM giết cùng lúc reboot (duration 854.708 ms ≈ 14'15", kết thúc ~17:53:28Z). T9 khởi động lại sampler vòng 2 lúc ~17:55Z (gap lấy mẫu ~2 phút, 17:53:15Z → ~17:55Z — xem F-140-T9-3). Không mất mẫu nào khác.
- **Replay: 1.545 dòng lúc T9 mở** (ghi cuối 16:11:16Z `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.1` — cùng gói cuối như replay hoàn tất boot 17db9652 đợt 138 và lúc T9-139 đóng). **Replay trên boot mới: 2 dòng lúc 17:54:20Z** (ghi cuối 17:53:48Z `startup packages configure` — replay mới bắt đầu). **Lúc T9 đóng: 795 dòng.** **T5 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-140-T9-1 — Headroom giảm −105 ngay trong cùng boot af558fb5:** đợt 139 đo lần 3 trên boot này 1.945 (15:56:41Z); đợt 140 đo lại 1.840 (17:38:54Z) — giảm 105 trong 1h42' không reboot. Hai lần đo dùng cùng probe, cùng phương pháp, cùng boot_id/btime — chênh lệch là thật, không phải sai số đo (chênh 0 giữa hai lần đo chính trong mỗi đợt). T9 không kết luận cơ chế (watch ngoài cell tăng do host — ngoài tầm cell). Hệ quả: bước giảm liên đợt ~106–127 không chỉ là hiệu ứng đổi boot.
- **F-140-T9-2 — Cửa sổ thoáng headroom >20.000 ngay sau boot chỉ tồn tại <2 phút:** probe lần 3 (17:54:16Z, boot 80 giây tuổi) thêm 20.000 watch không gặp ENOSPC; probe 3b (17:54:45Z, boot 109 giây tuổi, trần cao) dừng ở i=1840. Hai lần đo dùng cùng phương pháp, cùng boot — chênh lệch là thật, không phải sai số đo (chênh 0 giữa hai lần đo chính trong mỗi đợt; lần 3b khớp tuyệt đối giá trị boot cũ). T9 ghi nhận cửa sổ thoáng này là **quan sát**, không kết luận cơ chế (tiến trình giữ watch ngoài cell đăng ký lại sau reboot — ngoài tầm xác minh của cell). Giá trị >20.000 KHÔNG đưa vào chuỗi; giá trị vận hành sau reboot là 1.840.
- **F-140-T9-3 — Khoảng trống lấy mẫu do reboot + mẫu 17:53:15Z chưa rõ boot:** sampler vòng 1 bị SIGTERM giết cùng lúc reboot; khoảng trống 17:53:15Z → ~17:55Z (~2 phút) không có mẫu (vòng 2 khởi động lại ~17:55Z). Mẫu cuối vòng 1 (17:53:15Z, 895.172 kB, balloon 5.387.196 kB, SwapFree 644.096 kB) mang timestamp **19 giây SAU btime boot mới (17:52:56Z)** nhưng do vòng lặp cũ ghi — boot của mẫu này **chưa rõ**: giá trị SwapFree 644.096 kB nối tiếp đúng quỹ đạo boot cũ (657.968 kB lúc 17:52:15Z → 644.096 kB), trong khi RAM đo tay ngay sau reboot (17:54:00Z) đã là 1.888.184 kB với SwapFree 1.042.168 kB (swap gần trống sau reboot) — nên T9 xếp mẫu 17:53:15Z vào pha boot cũ, nhưng ghi rõ là **xếp theo quỹ đạo giá trị, không phải bằng chứng boot**. Nếu mẫu đó thực ra thuộc boot mới thì max boot cũ vẫn là 1.173.700 kB (17:47:14Z, chắc chắn boot cũ) và min boot cũ vẫn là 711.628 kB (17:46:14Z, chắc chắn boot cũ) — **verdict guard không đổi** (cả hai đều xa guard). T6/T2 là chủ quản chốt khung chết boot #97?. (Cùng lớp F-139-T9-3.)
- **F-140-T9-4 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Đợt này khoảng cách tới guard rất lớn (thiếu 3.902,3 MiB) nên khả năng vượt lén là không đáng kể — khác đợt 138 (thiếu 57 MiB).
- **F-140-T9-5 — Median tickCost #17 lấy từ T4, T4 chưa xong lúc T9 đóng:** T9 không tự đo tickCost; số #17 giao T10 lấy từ file T4 khi gộp (xem §2.3). Nếu T4 xuất bản file sau khi T9 đóng thì T10 đối chiếu chéo khi gộp.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 141 (phần T9)

1. **Headroom CHỈ CÒN 40 trên ngưỡng báo < ~1.800** — tốc độ giảm mười một đợt gần nhất ~106–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~0,35 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo). **Với đà này ngưỡng có thể chạm ngay đợt 141 — T10/parent lưu ý khi gộp; quyết "chỉ theo dõi, chưa đưa lên user" vẫn đứng cho tới khi parent đổi (quyết đợt 126 §12(h)); NẾU đợt 141 chạm <1.800 thì báo user lúc đó (quyết parent đợt 139).**
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d) + đợt 139 (e)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đợt 140 max chỉ 36,49% guard (thiếu 3.902,3 MiB) — thấp hơn đợt 139 (42,44%); đợt hồi RAM giữa lượt không ổn định theo đợt; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau**.
3. **Balloon đóng băng 6.443.824 kB trong 48/92 mẫu (52,2% cửa sổ — cao hơn 23/109 đợt 139)** — quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" chưa thấy hiệu quả ở đợt 139; nếu đợt 141 vẫn ~500 MB thì parent/T10 mới xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A). Quyết parent đợt 139: điều kiện can thiệp host ĐÃ THỎA nhưng KHÔNG CÓ KÊNH can thiệp từ cell — ghi rõ; GIỮ NGUYÊN gate A ≥1024 MB.
4. **Reboot giữa lượt 17:52:56Z, khung (17:52:15Z, 17:52:56Z] (41 s, theo dữ liệu T9) + mẫu 17:53:15Z chưa rõ boot (F-140-T9-3)** — khung chết boot #97? + số boot mới 90392aa5 = #98? (tạm) chờ T2 đợt 140 / T10 chốt; replay boot mới 2 dòng lúc 17:54:20Z — giao T5 đợt 140 đối chiếu. **Reboot KHÔNG reset chuỗi headroom:** giá trị ổn định sau reboot = 1.840, bằng đúng trước reboot (xem §1.5, F-140-T9-2).
5. **Median tickCost lượt yên #17 (T4) CHƯA CÓ lúc T9 đóng — giao T10 lấy khi gộp** — chuỗi 13 lượt, ngưỡng ≤60 ms giữ; lượt #18 đo lại ở đợt 141 theo kế hoạch đứng.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 139 §11: mù #59 (T2), G1 chờ user quyết, R9 (a) số đếm 16, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND140_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (do Phụ lục A+B: bảng sampler đầy đủ 92 mẫu theo yêu cầu brief) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 138/139: T2/T6/T5/T9). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round140-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round140-t9/headroom-measure-1.log` (đo lần 1), `headroom-measure-2.log` (đo lần 2), `headroom-measure-3-postreboot.log` (đo lần 3, boot mới), `headroom-measure-3b-postreboot.log` (đo lần 3b trần cao, boot mới), `k8-headroom-highcap.py` (script trần cao), `ram-sampler-long.log` (vòng 1: 15 mẫu, 17:39:13–17:53:15Z), `ram-sampler-long-2.log` (vòng 2: 77 mẫu, 17:55:20–19:11:26Z), `ram-sampler-long.sh` + `ram-sampler-long-2.sh` (script hai vòng), `appendix-vong1.md` + `appendix-vong2.md` (bảng sampler đã sinh) — không nằm trong repo nên không stage.
- Cờ `round140-t9.done` đã tạo khi xong.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard).

## Phụ lục A. Bảng sampler đầy đủ — vòng 1 (15 mẫu, 60 s/mẫu, boot cũ af558fb5)

Nguồn: `hidden_files/round140-t9/ram-sampler-long.log` (17:39:13–17:53:15Z). Guard = 6.291.456 kB. Mẫu 17:53:15Z chưa rõ boot (xem F-140-T9-3).
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 1 | 17:39:13 | 835168 | 815.6 | 5930172 | 646996 | 2.68 |
| 2 | 17:40:14 | 816004 | 796.9 | 6044224 | 643332 | 2.15 |
| 3 | 17:41:14 | 984192 | 961.1 | 5927660 | 631464 | 3.11 |
| 4 | 17:42:14 | 1079832 | 1054.5 | 5804688 | 632216 | 2.81 |
| 5 | 17:43:14 | 916032 | 894.6 | 5936652 | 637852 | 1.65 |
| 6 | 17:44:14 | 808640 | 789.7 | 6058312 | 639596 | 0.93 |
| 7 | 17:45:14 | 755876 | 738.2 | 6166872 | 639276 | 1.20 |
| 8 | 17:46:14 | 711628 | 694.9 | 6071828 | 629432 | 1.56 | **← min**
| 9 | 17:47:14 | 1173700 | 1146.2 | 5721016 | 625612 | 2.30 | **← max**
| 10 | 17:48:14 | 894256 | 873.3 | 5356552 | 624304 | 3.42 |
| 11 | 17:49:15 | 957216 | 934.8 | 5136712 | 645148 | 3.93 |
| 12 | 17:50:15 | 1029512 | 1005.4 | 5268784 | 655804 | 3.10 |
| 13 | 17:51:15 | 865864 | 845.6 | 5401152 | 659504 | 1.61 |
| 14 | 17:52:15 | 768972 | 750.9 | 5518696 | 657968 | 1.69 |
| 15 | 17:53:15 | 895172 | 874.2 | 5387196 | 644096 | 1.39 | **← boot chưa rõ (F-140-T9-3)**

## Phụ lục B. Bảng sampler đầy đủ — vòng 2 (77 mẫu, 60 s/mẫu, boot mới 90392aa5)

Nguồn: `hidden_files/round140-t9/ram-sampler-long-2.log` (17:55:20–19:11:26Z, SAMPLER-2 END 19:12:26Z). Guard = 6.291.456 kB. Số thứ tự nối tiếp vòng 1 (#16–#92).
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 16 | 17:55:20 | 1529816 | 1494.0 | 5285524 | 1018164 | 3.16 |
| 17 | 17:56:20 | 1374464 | 1342.2 | 5464968 | 998448 | 1.63 |
| 18 | 17:57:20 | 2295468 | 2241.7 | 4547464 | 900000 | 1.30 | **← max**
| 19 | 17:58:20 | 2006680 | 1959.6 | 4802636 | 900656 | 1.05 |
| 20 | 17:59:20 | 1791964 | 1750.0 | 5030196 | 901248 | 0.89 |
| 21 | 18:00:20 | 1647996 | 1609.4 | 5233712 | 907020 | 1.12 |
| 22 | 18:01:21 | 1487172 | 1452.3 | 5423160 | 837492 | 0.65 |
| 23 | 18:02:21 | 1334788 | 1303.5 | 5595964 | 817080 | 0.33 |
| 24 | 18:03:21 | 1155112 | 1128.0 | 5753820 | 817584 | 0.38 |
| 25 | 18:04:21 | 1022192 | 998.2 | 5895896 | 810828 | 0.85 |
| 26 | 18:05:21 | 901064 | 879.9 | 6020288 | 796656 | 0.36 |
| 27 | 18:06:21 | 955188 | 932.8 | 5900328 | 789176 | 0.65 |
| 28 | 18:07:21 | 892848 | 871.9 | 6026532 | 788264 | 0.95 |
| 29 | 18:08:21 | 792696 | 774.1 | 6143924 | 782940 | 0.35 |
| 30 | 18:09:21 | 689404 | 673.2 | 6249616 | 781524 | 0.53 |
| 31 | 18:10:21 | 500024 | 488.3 | 6347508 | 779744 | 0.64 |
| 32 | 18:11:21 | 535452 | 522.9 | 6416616 | 759972 | 0.73 |
| 33 | 18:12:21 | 519428 | 507.3 | 6443824 | 751020 | 0.91 |
| 34 | 18:13:21 | 495812 | 484.2 | 6443824 | 749268 | 0.90 |
| 35 | 18:14:21 | 540080 | 527.4 | 6443824 | 743316 | 0.87 |
| 36 | 18:15:22 | 543888 | 531.1 | 6443824 | 677304 | 0.93 |
| 37 | 18:16:22 | 957052 | 934.6 | 6020068 | 676420 | 1.19 |
| 38 | 18:17:22 | 873512 | 853.0 | 6100660 | 678700 | 0.86 |
| 39 | 18:18:22 | 768816 | 750.8 | 6214652 | 678672 | 0.77 |
| 40 | 18:19:22 | 684544 | 668.5 | 6317516 | 676856 | 0.73 |
| 41 | 18:20:22 | 587424 | 573.7 | 6411284 | 677144 | 0.69 |
| 42 | 18:21:22 | 531576 | 519.1 | 6443824 | 677764 | 1.02 |
| 43 | 18:22:22 | 523752 | 511.5 | 6443824 | 678428 | 0.64 |
| 44 | 18:23:22 | 489264 | 477.8 | 6443824 | 681276 | 0.77 |
| 45 | 18:24:22 | 516944 | 504.8 | 6443824 | 686916 | 0.64 |
| 46 | 18:25:22 | 518860 | 506.7 | 6443824 | 692864 | 0.33 |
| 47 | 18:26:23 | 496224 | 484.6 | 6443824 | 693152 | 0.43 |
| 48 | 18:27:23 | 518076 | 505.9 | 6443824 | 695792 | 0.40 |
| 49 | 18:28:23 | 506688 | 494.8 | 6443824 | 696204 | 0.29 |
| 50 | 18:29:23 | 518312 | 506.2 | 6443824 | 696116 | 0.30 |
| 51 | 18:30:23 | 516740 | 504.6 | 6443824 | 696624 | 0.25 |
| 52 | 18:31:23 | 502160 | 490.4 | 6443824 | 696644 | 0.18 |
| 53 | 18:32:23 | 579624 | 566.0 | 6443824 | 685864 | 1.10 |
| 54 | 18:33:23 | 735852 | 718.6 | 6277568 | 665552 | 0.81 |
| 55 | 18:34:23 | 619604 | 605.1 | 6375456 | 665384 | 0.54 |
| 56 | 18:35:23 | 520372 | 508.2 | 6443824 | 666000 | 1.06 |
| 57 | 18:36:23 | 512648 | 500.6 | 6443824 | 666168 | 0.43 |
| 58 | 18:37:23 | 531408 | 519.0 | 6443824 | 667608 | 0.41 |
| 59 | 18:38:23 | 517396 | 505.3 | 6443824 | 667832 | 0.19 |
| 60 | 18:39:23 | 521344 | 509.1 | 6443824 | 666440 | 0.16 |
| 61 | 18:40:24 | 500580 | 488.8 | 6443824 | 669116 | 0.16 |
| 62 | 18:41:24 | 488088 | 476.6 | 6443824 | 669296 | 0.26 |
| 63 | 18:42:24 | 479636 | 468.4 | 6443824 | 667384 | 0.16 |
| 64 | 18:43:24 | 474204 | 463.1 | 6443824 | 666740 | 0.48 | **← min**
| 65 | 18:44:24 | 512444 | 500.4 | 6443824 | 664704 | 0.22 |
| 66 | 18:45:24 | 499188 | 487.5 | 6443824 | 673140 | 0.26 |
| 67 | 18:46:24 | 510300 | 498.3 | 6443824 | 686804 | 0.20 |
| 68 | 18:47:24 | 490820 | 479.3 | 6443824 | 687788 | 0.11 |
| 69 | 18:48:24 | 561416 | 548.3 | 6443824 | 675520 | 1.33 |
| 70 | 18:49:24 | 697128 | 680.8 | 6281448 | 665564 | 1.12 |
| 71 | 18:50:24 | 628700 | 614.0 | 6379796 | 659708 | 1.09 |
| 72 | 18:51:24 | 552344 | 539.4 | 6443824 | 650264 | 0.92 |
| 73 | 18:52:24 | 556396 | 543.4 | 6443824 | 652132 | 0.83 |
| 74 | 18:53:24 | 530680 | 518.2 | 6443824 | 653444 | 0.63 |
| 75 | 18:54:25 | 628572 | 613.8 | 6443824 | 768892 | 0.87 |
| 76 | 18:55:25 | 590680 | 576.8 | 6443824 | 773740 | 0.47 |
| 77 | 18:56:25 | 576784 | 563.3 | 6443824 | 773384 | 0.23 |
| 78 | 18:57:25 | 564432 | 551.2 | 6443824 | 775272 | 0.40 |
| 79 | 18:58:25 | 556100 | 543.1 | 6443824 | 776324 | 0.21 |
| 80 | 18:59:25 | 542084 | 529.4 | 6443824 | 776408 | 0.89 |
| 81 | 19:00:25 | 547684 | 534.8 | 6443824 | 788252 | 0.60 |
| 82 | 19:01:25 | 534984 | 522.4 | 6443824 | 788528 | 0.62 |
| 83 | 19:02:25 | 538812 | 526.2 | 6443824 | 788828 | 0.66 |
| 84 | 19:03:25 | 514812 | 502.7 | 6443824 | 789284 | 0.47 |
| 85 | 19:04:25 | 564740 | 551.5 | 6443824 | 772668 | 1.17 |
| 86 | 19:05:25 | 835964 | 816.4 | 6181680 | 694260 | 1.39 |
| 87 | 19:06:26 | 747948 | 730.4 | 6291592 | 695496 | 1.04 |
| 88 | 19:07:26 | 618500 | 604.0 | 6390948 | 698256 | 0.44 |
| 89 | 19:08:26 | 577440 | 563.9 | 6443824 | 696680 | 0.65 |
| 90 | 19:09:26 | 509904 | 498.0 | 6443824 | 693540 | 0.36 |
| 91 | 19:10:26 | 557960 | 544.9 | 6443824 | 694528 | 0.29 |
| 92 | 19:11:26 | 535628 | 523.1 | 6443824 | 695588 | 0.38 |
