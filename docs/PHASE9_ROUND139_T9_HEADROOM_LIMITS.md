# LIMITS — Phase 9 đợt 139, T9: headroom inotify + RAM + guard birefnet (REBOOT GIỮA LƯỢT, SAMPLER KHỞI ĐỘNG LẠI)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 1.954** (đo 2 lần trên boot lúc mở đợt: 1.954 lúc 14:41:18Z và **1.954** lúc 14:41:29Z 18/11, boot 541524e2 btime **13:53:41Z**, chênh **0**) — **TIẾP TỤC GIẢM**: 2.064 (đợt 138) → **1.954 (−110, −5,3%)**. Bước giảm nằm trong dải 106–127 của **mười đợt gần nhất (130–139)**. Xem §1.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **154**; vẫn gấp ~1,24 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại đợt 138 §12.3(j)).
- **Đính chính btime boot mở đợt (T1-139 F-139-T1-1, đã verify độc lập): boot 541524e2 có btime THẬT là 13:53:41Z (epoch 1795010021), KHÔNG phải 14:03:07Z như brief/marker đợt 139 đang ghi** — 4 nguồn độc lập khớp (`/proc/stat`, journal first entry 13:53:53Z, `who -b`/`uptime`, `/` birth). Reboot xảy ra TRƯỚC cờ đóng đợt 138 (14:01:14Z). Toàn bộ LIMITS này dùng **13:53:41Z**. Xem §5, F-139-T9-1.
- **REBOOT GIỮA CỬA SỔ ĐO (sự kiện mới — T6/T10 chốt số): boot 541524e2 (#96? tạm) chết, boot mới af558fb5 = #97? (tạm) lên thay, btime 15:54:37Z.** Sampler vòng 1 của T9 bị SIGTERM giết cùng lúc; đã khởi động lại vòng 2 trên boot mới lúc 15:57:11Z (gap lấy mẫu ~2 phút 9 giây, 15:55:02Z → 15:57:11Z — xem F-139-T9-3). Đo thêm headroom lần 3 trên boot mới: **1.945** lúc 15:56:41Z — giá trị này KHÔNG thay thế 1.954 trong chuỗi (khác boot), chỉ để T6/T10 đối chiếu. Xem §1.4, §5.
- **RAM: KHÔNG CÓ ĐỢT HỒI MẠNH NÀO — đỉnh chỉ 42,44% guard.** Max toàn cửa sổ (109 mẫu, hai vòng): **2.669.952 kB = 2.607,4 MiB lúc 15:13:59Z** (boot cũ), thiếu **3.621.504 kB (~3.536,6 MiB)** mới tới guard 6.291.456 kB. Đây là đỉnh THẤP NHẤT trong các đợt hồi gần đây (đợt 138: 99,07%; đợt 137: vượt guard; đợt 136: 98,99%) — đợt này RAM dao động 0,39–2,61 GB rồi kẹt ~0,5 GB mỗi khi balloon đóng băng. **0 mẫu ≥ 6.144 MiB. Birefnet KHÔNG THỬ.** Xem §3.
- **Balloon virtio ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM) trong cả hai vòng** — vòng 1: 8 mẫu liên tiếp (15:28:00–15:35:00Z); vòng 2: 15 mẫu (16:13:12–16:15:12Z + 16:20:13–16:31:13Z). Giá trị đóng băng y hệt đợt 138 — balloon KHÔNG xả như kỳ vọng ở quyết parent đợt 138 §12.3(c) ("chờ balloon tự xả"); đợt 139 RAM vẫn ~500 MB trong phần lớn cửa sổ vòng 2. Xem §2.2.
- **Median tickCost lượt yên #16 (T4) ĐÃ CÓ: 41,0 ms (n=630), HỢP LỆ, ≤60 ms** — lượt yên đầu tiên đo được sau #14 (chuỗi median nay 13 lượt: … / 58,0 / 59,0 / **41,0 ms**). Xem §2.3.
- **Không có vite/chrome nào đang chạy lúc đo (cả hai boot), không có ENOSPC nào** (journal 0 dòng "No space left"/ENOSPC cả boot cũ lẫn boot mới). Replay boot cũ 1.545 dòng (ghi cuối 13:57:33Z); replay boot mới 1.545 dòng lúc T9 đóng (ghi cuối 16:11:16Z) — T5 là chủ quản replay.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi, cả hai boot).

### 1.2 Số đo đợt 139 (boot lúc mở đợt 541524e2, btime 13:53:41Z — đính chính theo T1-139 F-139-T1-1)

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| 14:41:18Z | **1.954** | lần đo 1, boot ~47' tuổi; RAM trước đo ~1.726 MB, balloon 5.087.316 kB |
| 14:41:29Z | **1.954** | lần đo 2 (chênh **0** so với lần 1) |

- Probe dừng ở `i=1954` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 0 trong cùng boot:** lần thứ hai liên tiếp chuỗi T9 ghi chênh 0 ở cả hai lần đo chính (đợt 138 cũng 0). Giá trị đợt lấy **1.954**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 1.954 = **61.793 watch** (tăng ~110 so với 61.683 đợt 138).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 1.954 / 1.578 ≈ **1,24 lần** — đủ cho ~1 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 các đợt 129–138 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **139** | **1.954 → 1.954** | **đo 14:41:18Z → 14:41:29Z, boot 541524e2 btime 13:53:41Z (đính chính T1-139 F-139-T1-1)** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064 → 1.954**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 1.954 = **−2.484 (−56,0%)**. Bước giảm đợt này: −110 so với đợt 138 (−5,3%) — **đợt thứ mười liên tiếp bước giảm nằm trong dải 106–127** (130: −116; 131: −117; 132: −108; 133: −106; 134: −127; 135: −110; 136: −114; 137: −106; 138: −111; 139: −110).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **154** (đợt 138 còn 264). Con số giảm ~106–127/đợt chỉ là phép chia số học minh họa (154 / ~110 ≈ 1,4 đợt nếu đà giữ nguyên) — **KHÔNG phải dự báo** (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot; quyết parent đứng). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user. **Lưu ý: với đà này, ngưỡng ~1.800 có thể chạm ngay đợt 140 — T10/parent lưu ý khi gộp, nhưng T9 không tự đổi quyết theo dõi.**
- Trần 63.747 vẫn đầy ở mức ~61,8k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới af558fb5 (ngoài chuỗi, chỉ để đối chiếu)

- **1.945 lúc 15:56:41Z** (boot mới btime 15:54:37Z, ~2' tuổi; RAM trước đo 1.613.108 kB, sau đo 1.611.440 kB; balloon 5.203.728 kB; dpkg.log 2 dòng, replay mới bắt đầu). Probe dừng ở `i=1945`, errno=28; file tạm đã dọn sạch.
- Chênh so với giá trị boot cũ: −9. Trong dải biến thiên giữa các boot đã thấy (đợt 138: −8 giữa hai boot). **Không đưa 1.945 vào chuỗi §1.3** — chuỗi nối tiếp lấy giá trị trên boot lúc mở đợt (1.954).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB) — sampler dài 109 mẫu, 14:41:57–16:31:13Z, hai vòng

### 2.1 Hình dạng cửa sổ: dao động 0,39–2,61 GB trên boot cũ, rồi kẹt ~0,5 GB trên boot mới

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1. **Vòng 1: 14:41:57–15:55:02Z, 74 mẫu, boot cũ 541524e2 — bị SIGTERM giết cùng lúc reboot 15:54:37Z. Vòng 2: 15:57:11–16:31:13Z, 35 mẫu, boot mới af558fb5 — chạy tới hết hạn 16:32Z.** Tổng **109 mẫu** (xem bảng đầy đủ ở Phụ lục A + B). **Min toàn cửa sổ: 400.704 kB (391,3 MiB) lúc 15:50:02Z (boot cũ). Max toàn cửa sổ: 2.669.952 kB (2.607,4 MiB) lúc 15:13:59Z (boot cũ).** Mean vòng 1 ~1.132.260 kB; mean vòng 2 ~842.591 kB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot cũ 541524e2 = #96? (tạm) (74 mẫu, 14:41:57–15:55:02Z) — dao động mạnh, không đợt hồi bền:**

| Thời điểm (UTC) | RAM khả dụng | Balloon | Ghi chú |
|---|---|---|---|
| 14:39:53Z | 478,1 MiB (489.600 kB) | ~6.247.216 kB | kiểm tra mở đầu (trước probe 1) |
| 14:41:18Z | 1.686,3 MiB (1.726.464 kB) | 5.087.316 kB | trước probe 1 — đã hồi từ lúc mở |
| 14:41:57Z | 1.609,0 MiB (1.647.620 kB) | 5.151.204 kB | mẫu sampler đầu |
| 14:46:57Z | 2.070,4 MiB | 4.615.428 kB | nhô ngắn đầu cửa sổ |
| 14:59:58Z | 2.383,1 MiB | 4.383.316 kB | nhô lần 2 |
| 15:13:59Z | **2.607,4 MiB (2.669.952 kB)** | **4.280.860 kB** | **MAX cửa sổ, 42,44% guard** |
| 15:14:59–15:17:59Z | 2.317 → 1.620 MiB | 4.561.412 → 5.249.128 kB | lùi ngay sau đỉnh |
| 15:28:00–15:35:00Z | 466 → 477 MiB | **6.443.824 kB (đóng băng, 8 mẫu)** | **vùng trũng 1**: 462–509 MB |
| 15:36:00Z | 1.105,4 MiB | 5.854.000 kB | nhô ngắn (1 mẫu), rồi lùi |
| 15:47:01Z | 392,3 MiB (401.760 kB) | 6.051.636 kB | gần min |
| 15:50:02Z | **391,3 MiB (400.704 kB)** | 5.669.132 kB | **MIN cửa sổ** — thấp nhất chuỗi T9 (sau 433 MB đợt 133; thấp hơn min đợt 138 là 461,7 MiB) |
| 15:51:02–15:54:02Z | 890 → 868 MiB | 5.774.808 → 5.339.612 kB | hồi nhẹ cuối boot cũ |
| 15:55:02Z | 1.458,2 MiB (1.493.168 kB) | 5.497.940 kB | mẫu cuối vòng 1 — boot chưa rõ, xem F-139-T9-3 |

- Không có đợt hồi nào vượt 2,7 GB; sau đỉnh 15:13:59Z RAM lùi đơn điệu về vùng trũng ~0,5 GB rồi chỉ nhô ngắn 1–2 mẫu. Khác hẳn đợt 138 (đợt hồi lên 6,09 GB trong 12 phút): **đợt này balloon không xả sâu** — min balloon vòng 1 là 4.280.860 kB (52,7% tổng RAM), chưa bao giờ xuống dưới 4,2 GB như đợt 138 (585.796 kB).
- RAM lúc mở đợt: brief ghi "~547 MB" — số đo trực tiếp của T9: 489.600 kB (478,1 MiB) lúc 14:39:53Z, 634.376 kB lúc 14:40:06Z, 654.560 kB lúc 14:40:49Z — cả ba đều < guard và đều dưới 1 GB. Xem F-139-T9-1 (lặp lại từ đợt 137/138: brief chỉ ghi số làm tròn, T9 lấy số đo trực tiếp làm chuẩn).

**Boot mới af558fb5 = #97? (tạm) (35 mẫu, 15:57:11–16:31:13Z) — kẹt thấp, balloon đóng băng trở lại:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 15:57:11Z | 1.463,1 MiB (1.498.204 kB) | mẫu đầu sau reboot (balloon 5.333.740 kB; swap gần trống 1.006.632 kB) |
| 15:58:11–16:09:12Z | 1.338 → 553 MiB | rơi đơn điệu |
| 16:10:12Z | 830,3 MiB | nhô ngắn 1 mẫu |
| 16:11:12–16:15:12Z | 629 → 596 MiB | lùi về trũng; balloon đóng băng 6.443.824 kB từ 16:13:12Z |
| 16:16:12Z | 962,1 MiB | nhô ngắn lần 2 (1 mẫu) |
| 16:17:12–16:19:13Z | 874 → 603 MiB | lùi |
| 16:20:13–16:31:13Z | 572 → 557 MiB | **vùng trũng 2**: 531–572 MB tới cuối cửa sổ; balloon đóng băng 6.443.824 kB suốt 12 mẫu cuối |

- Min boot mới 543.912 kB (531,2 MiB) lúc 16:30:13Z; max boot mới 1.565.676 kB (1.529,0 MiB) lúc 16:00:11Z — chỉ 24,9% guard.
- Sau mẫu đầu, **không mẫu nào trên boot mới vượt 1.565.676 kB**. Hai lần nhô (16:10:12Z, 16:16:12Z) đều chỉ 1 mẫu rồi lùi ngay — không đợt hồi nào bền.
- Load1 trong cửa sổ: 0,01–2,46 — máy gần như yên trong phần lớn cửa sổ vòng 2 (nhiều mẫu load1 0,01–0,33) mà RAM vẫn kẹt ~0,55 GB: RAM thấp không phải do tải trong cell, mà do balloon host giữ.
- Swap: SwapFree 660.184 kB lúc mở → **1.044.296 kB ngay sau reboot** (swap gần như trống, chỉ ~4 MB đang dùng — reboot xả swap) → 1.006.632 kB (mẫu đầu vòng 2) → 677.780 kB lúc cuối (swap đang dùng ~370.220 kB). Xem F-138-T9-4 (cùng lớp quan sát).

### 2.2 Balloon virtio — xả nông rồi đóng băng y hệt đợt 138

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 6.247.216 kB (14:40:06Z, lúc đo đầu) → **min 4.280.860 kB lúc 15:13:59Z (52,7% tổng RAM, đúng lúc đỉnh RAM)** → 6.443.824 kB (15:28:00–15:35:00Z, đóng băng 8 mẫu) → 5.497.940 kB (15:55:02Z, mẫu chưa rõ boot).
- Boot mới: 5.333.740 kB (15:57:11Z) → phình lại **6.443.824 kB (79,3% tổng RAM)** rồi **ĐÓNG BĂNG đúng giá trị này qua 15 mẫu** (16:13:12–16:15:12Z + 16:20:13–16:31:13Z, chỉ gián đoạn bởi lần nhô 16:16:12Z khi balloon xả tạm ~393 MB). Giá trị 6.443.824 kB lặp lại y hệt qua hai đợt (138 + 139) và hai boot — dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (đo đầu 14:40:06Z → mẫu cuối 16:31:13Z): balloon 6.247.216 kB → 6.443.824 kB = **+196.608 kB (~+0,19 GB)**. Lúc đóng (16:32:31Z, sau sampler): balloon đã xả về 5.854.000 kB, RAM 1.102.356 kB — balloon bắt đầu xả ngay sau khi sampler kết thúc (ngoài cửa sổ đo; chỉ ghi nhận, không lấy làm số cửa sổ).
- **Quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" — đợt 139 KHÔNG thấy xả bền:** balloon vẫn đóng băng 6.443.824 kB trong 23/109 mẫu và RAM phẳng ~0,5 GB suốt nửa sau cửa sổ. T9 không đề xuất đổi ngưỡng gate A (quyết đứng), chỉ ghi rõ dữ kiện để parent/T10 cân nhắc ở đợt 140.
- Số học lúc đỉnh RAM 15:13:59Z: tổng RAM 8.124.900 kB − balloon 4.280.860 kB = 3.844.040 kB còn lại cho hệ thống; trong đó MemAvailable 2.669.952 kB + free/cache ~1,17 GB. Lúc cuối cửa sổ 16:31:13Z: tổng RAM − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 570.016 kB.

### 2.3 Median tickCost lượt yên #16 (T4) — ĐÃ CÓ

- **Lượt yên WebKit #16 HỢP LỆ (T4-139, attempt3, 20/20 pass): tickCost median 41,0 ms (n=630; hậu flip+2000ms n=457 median 41,0 ms) ≤60 ms** — file `docs/PHASE9_ROUND139_T4_WEBKIT_QUIET16_LIMITS.md` (27.095 B, lúc 15:24Z). Chuỗi median tickCost nay **13 lượt**: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 / 58,0 / 59,0 / **41,0 ms** (trung bình 13 lượt ≈ 47,9 ms). Ngưỡng ≤60 ms KHÔNG BÀN LẠI.
- Ghi nhận chéo: T4 mở được cửa yên lúc 14:48:38Z (poll #9, RAM 1.859 MB) — đúng trong đợt hồi đầu cửa sổ của T9 (mẫu 14:48:57Z: 1.799,4 MiB). Attempt1/2 của T4 gặp lỗi setup + wedged (không phải do RAM), attempt3 mới hợp lệ — T4 là chủ quản chi tiết.

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
| **139** | **~547 MB (brief; T9 đo trực tiếp 489.600 kB lúc 14:39:53Z, 634.376 kB lúc 14:40:06Z)** | **478–2.607 MB (boot cũ, 74 mẫu, 14:41:57–15:55:02Z) rồi 531–1.529 MB (boot mới, 35 mẫu, 15:57:11–16:31:13Z); REBOOT 15:54:37Z cắt giữa hai pha; gap lấy mẫu ~2'09"** (sampler dài của T9, ~109 phút) | **557 MiB lúc 16:31:13Z (1.102 MB lúc 16:32:31Z, sau sampler)** |

- Mẫu chung: đợt hồi giữa lượt vẫn không ổn định theo đợt — đỉnh các đợt hồi 133→139 là 512 MB, 2.438 MB, 1.734 MB, 6.081 MB, 2.123 MB, 6.087 MB, **2.607 MB**. Đợt 139 lần thứ hai liên tiếp có **hai pha RAM hoàn toàn khác nhau trong một đợt** (dao động → reboot → kẹt thấp), vì reboot cắt giữa chừng. Đỉnh đợt này thấp nhất kể từ đợt 135.

## 3. Guard birefnet — KHÔNG ĐẠT (42,44%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 138 §12.3(d) giao rõ T9-139 thử ngay khi cửa sổ mở): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này (sampler T9, 109 mẫu, hai vòng): **2.669.952 kB = 2.607,4 MiB = 42,44% guard** lúc **15:13:59Z** (boot cũ) — thiếu **3.621.504 kB (~3.536,6 MiB, ~57,6%)**.
- Không có mẫu nào trên boot mới vượt 1.565.676 kB (24,9% guard). **0 mẫu ≥ 6.144 MiB ở bất kỳ vòng nào.** Không có cửa sổ nào để thử — khác hẳn đợt 138 (đỉnh 99,07% rồi bị reboot cắt): đợt này đỉnh còn cách guard hơn một nửa.
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Quy trình "thử ngay" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 16:32:13Z, watcher guard chạy suốt cả hai vòng), cửa sổ chỉ không mở.
- Đợt hồi RAM giữa lượt không ổn định theo đợt (xem §2.4): đỉnh các đợt 136→139 là 6.081 MB, 2.123 MB, 6.087 MB, **2.607 MB** — không có cơ sở nào để dự báo đợt sau sẽ vượt guard; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau** theo quyết parent đợt 138 §12.3(d).

### 3.1 Sẵn sàng thử đã xác minh lại (14:40:49Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được (kiểm lại đợt này, khớp đợt 138).
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-139-birefnet/out-birefnet-139.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-139-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (kiểm tra `ps` lúc 14:40Z, 15:55Z và lúc 16:32Z; chỉ có tiến trình hệ thống + các luồng đợt 139) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 1.954 chỉ đủ ~1 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=1954, i=1954, i=1945) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot cũ 13:53:41Z: **0 dòng "No space left" / ENOSPC** (kiểm tra 14:40:49Z, "-- No entries --"). Journal từ lúc boot mới 15:54:37Z: **0 dòng** (kiểm tra 16:32:31Z, "-- No entries --"; `journalctl --list-boots` chỉ hiện boot mới — boot cũ không còn trong journal của cell, như đợt 138). Lưu ý: journal boot cũ không còn để kiểm lại sau reboot — T6 là chủ quản chuỗi boot, T9 chỉ ghi nhận.
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 139 = boot lúc T9 đo đầu:** btime **13:53:41Z** 18/11 (`uptime -s` 13:53:41 + `btime 1795010021` trong `/proc/stat` + boot_id `541524e2-...` + `who -b`: system boot Nov 18 13:53). **Đính chính theo T1-139 F-139-T1-1: btime này KHÔNG phải 14:03:07Z như brief/marker đợt 139 đang ghi** — T1 đã verify độc lập bằng 4 nguồn (`/proc/stat`, journal first entry 13:53:53Z, `who -b`/`uptime`, `/` birth); reboot xảy ra TRƯỚC cờ đóng đợt 138 (14:01:14Z). Số boot theo T8-139: 541524e2 là **#96? (tạm)** — chờ T2 đợt 140 / T10 chốt.
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9: boot mới af558fb5 = #97? (tạm), btime 15:54:37Z** (`uptime -s` 15:54:37 + `btime 1795017277` + boot_id `af558fb5-e964-4116-a69b-ec784f3defab` + `who -b`: system boot Nov 18 15:54 + journal first entry 15:54:53Z). Boot cũ sống 13:53:41Z → 15:54:37Z = **2h00m56s**. Số sự kiện reboot chờ T6 chốt (T8-139 đã xong 16:00Z — T9 không chốt số); số boot mới #97? là **tạm, chờ T2 đợt 140 / T10 chốt** (theo bổ sung T8-139).
- **Khung chết boot cũ:** mốc cuối chắc chắn còn sống trên boot cũ là mẫu sampler 15:54:02Z (888.280 kB) → khung **(15:54:02Z, 15:54:37Z] (35 s)**. **Caveat dị thường đồng hồ (F-139-T8-3, T8-139): btime 15:54:37Z sớm hơn mốc cuối trên boot cũ 5 s** — tức có luồng khác ghi mốc cuối boot cũ lúc ~15:54:42Z, SAU btime boot mới; cùng lớp dị thường F-138-T8-1. T9 ghi nhận, không tự giải thích cơ chế đồng hồ; T2/T6 là chủ quản chốt khung chết.
- **Runtime restart đi kèm reboot:** phiên exec sampler vòng 1 của T9 bị SIGTERM giết cùng lúc reboot (duration 4.385.756 ms ≈ 73'06", kết thúc ~15:55:03Z); watcher guard + waiter 30' cũng bị SIGTERM cùng thời điểm. T9 khởi động lại sampler vòng 2 lúc 15:57:11Z (gap lấy mẫu ~2'09", 15:55:02Z → 15:57:11Z — xem F-139-T9-3). Không mất mẫu nào khác.
- **Replay trên boot mới: 1.545 dòng lúc T9 đóng** (ghi cuối 16:11:16Z `status installed gstreamer1.0-tools:amd64 1.24.2-1ubuntu0.1` — cùng gói cuối như replay hoàn tất boot 17db9652 đợt 138). Lúc 15:56:41Z mới 2 dòng (`startup packages configure` 15:55:19Z) — replay chạy trong cửa sổ vòng 2. **T5-139 là chủ quản replay — T9 chỉ ghi nhận số, không kết luận "xong"/"chưa xong".** Replay boot cũ: 1.545 dòng, ghi cuối 13:57:33Z (đo lúc 14:40:49Z).
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-139-T9-1 — RAM lúc mở đợt trong brief chỉ là số làm tròn:** brief đợt 139 ghi "~547 MB"; T9 đo trực tiếp 489.600 kB (478,1 MiB) lúc 14:39:53Z, 634.376 kB lúc 14:40:06Z, 654.560 kB lúc 14:40:49Z — RAM biến thiên ~±170 MB trong 1 phút lúc mở. Không đổi verdict (cả ba số đều < guard, đều dưới 1 GB). **Đính chính btime kèm theo (nguồn T1-139 F-139-T1-1, không phải sai số của T9):** brief/marker ghi btime boot mở đợt là 14:03:07Z là SAI; btime thật 13:53:41Z (epoch 1795010021) đã verify độc lập 4 nguồn. T9 dùng 13:53:41Z xuyên suốt LIMITS này.
- **F-139-T9-2 — Đỉnh 42,44% là đỉnh của sampler, không phải mức RAM sẵn có bền vững:** mẫu 15:13:59Z ghi 2.669.952 kB nhưng mẫu 60 giây sau (15:14:59Z) chỉ còn 2.373.044 kB, và 3 phút sau (15:17:59Z) chỉ còn 1.658.488 kB. Max "theo sampler của T9" là 2.669.952 kB nhưng không phải mức ổn định — không được lấy làm mức RAM sẵn có bền vững. Đợt hồi giữa lượt không ổn định theo đợt (xem §2.4): đỉnh các đợt 133→139 là 512 MB, 2.438 MB, 1.734 MB, 6.081 MB, 2.123 MB, 6.087 MB, 2.607 MB.
- **F-139-T9-3 — Khoảng trống lấy mẫu do reboot + mẫu 15:55:02Z chưa rõ boot:** sampler vòng 1 bị SIGTERM giết cùng lúc reboot; khoảng trống 15:55:02Z → 15:57:11Z (~2'09") không có mẫu (vòng 2 khởi động lại lúc 15:57:11Z). Mẫu cuối vòng 1 (15:55:02Z, 1.493.168 kB, balloon 5.497.940 kB, SwapFree 754.648 kB) mang timestamp **25 giây SAU btime boot mới (15:54:37Z)** nhưng do vòng lặp cũ ghi — boot của mẫu này **chưa rõ**: giá trị SwapFree 754.648 kB nối tiếp đúng quỹ đạo boot cũ (606.936 kB lúc 15:54:02Z → 754.648 kB), trong khi mẫu đầu vòng 2 (15:57:11Z) đã là SwapFree 1.006.632 kB (swap gần trống sau reboot) — nên T9 xếp mẫu 15:55:02Z vào pha boot cũ, nhưng ghi rõ là **xếp theo quỹ đạo giá trị, không phải bằng chứng boot**. Nếu mẫu đó thực ra thuộc boot mới thì max boot cũ vẫn là 2.669.952 kB (15:13:59Z, chắc chắn boot cũ) và min boot cũ vẫn là 400.704 kB (15:50:02Z, chắc chắn boot cũ) — **verdict guard không đổi**. T6/T2 là chủ quản chốt khung chết boot #96?. (Cùng lớp F-138-T9-3.)
- **F-139-T9-4 — Swap xả sau reboot là quan sát, không phải kết luận:** SwapFree nhảy 606.936 kB (15:54:02Z) → 1.044.296 kB (15:55:32Z, đo tay sau reboot) → 1.006.632 kB (15:57:11Z, mẫu đầu vòng 2), rồi lùi dần về 677.780 kB lúc 16:32:31Z (~370 MB đang dùng). T9 ghi đây là **tương quan thời gian với reboot**, không khẳng định reboot "gây ra" việc xả swap (có thể do tiến trình giữ swap chết theo reboot — ngoài tầm xác minh của T9). (Cùng lớp F-138-T9-4.)
- **F-139-T9-5 — Median tickCost #16 lấy từ file T4, không phải T9 tự đo:** số 41,0 ms (n=630) trong §2.3 là số T4-139 công bố trong `PHASE9_ROUND139_T4_WEBKIT_QUIET16_LIMITS.md` (27.095 B, 15:24Z); T9 chỉ đối chiếu chéo (chuỗi 13 lượt, ngưỡng ≤60 ms giữ) chứ không chạy lại phép đo tickCost. Nếu T4 sửa file sau khi T9 đóng thì số trong LIMITS này có thể lệch — T10 đối chiếu chéo khi gộp.
- **F-139-T9-6 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Đợt này khoảng cách tới guard quá lớn (thiếu 3.536,6 MiB) nên khả năng vượt lén là không đáng kể — khác đợt 138 (thiếu 57 MiB).
- **F-139-T9-7 — Dị thường đồng hồ btime vs mốc cuối boot cũ (nguồn T8-139 F-139-T8-3):** btime boot mới 15:54:37Z sớm hơn mốc cuối trên boot cũ 5 s (mốc ~15:54:42Z của luồng khác). T9 ghi nhận caveat này từ T8, không tự xác minh mốc 15:54:42Z (không thuộc dữ liệu của T9 — mốc cuối của T9 là 15:54:02Z, TRƯỚC btime). Khung chết (15:54:02Z, 15:54:37Z] trong §5 là khung theo dữ liệu riêng của T9; khung chuẩn cuối cùng chờ T2/T6 chốt.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 140 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 154 trên ngưỡng báo < ~1.800; tốc độ giảm mười đợt gần nhất ~106–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~1,4 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo). **Với đà này ngưỡng có thể chạm ngay đợt 140** — T10/parent lưu ý khi gộp; quyết "chỉ theo dõi, chưa đưa lên user" vẫn đứng cho tới khi parent đổi (quyết đợt 126 §12(h)).
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 138 §12.3(d)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đợt 139 max chỉ 42,44% guard (thiếu 3.536,6 MiB) — xa nhất kể từ đợt 135; đợt hồi RAM giữa lượt không ổn định theo đợt; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau**.
3. **Balloon đóng băng 6.443.824 kB KHÔNG xả bền đợt này** (23/109 mẫu; RAM phẳng ~0,5 GB nửa sau cửa sổ) — quyết parent đợt 138 §12.3(c) "chờ balloon tự xả" chưa thấy hiệu quả ở đợt 139; nếu đợt 140 vẫn ~500 MB thì parent/T10 mới xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A).
4. **Reboot giữa lượt 15:54:37Z, khung (15:54:02Z, 15:54:37Z] (35 s, theo dữ liệu T9) + caveat dị thường đồng hồ F-139-T8-3** — khung chết boot #96? + số boot mới af558fb5 = #97? (tạm) chờ T2 đợt 140 / T10 chốt; replay boot mới 1.545 dòng lúc T9 đóng — giao T5 đợt 139/140 đối chiếu.
5. **Đính chính btime boot mở đợt 13:53:41Z (T1-139 F-139-T1-1)** — marker/brief đợt 139 đang ghi sai 14:03:07Z; T10 gộp đợt 139 và các luồng khác lưu ý dùng 13:53:41Z khi ghi boot/btime.
6. **Median tickCost lượt yên #16 (T4) HỢP LỆ 41,0 ms** — chuỗi 13 lượt, ngưỡng ≤60 ms giữ; lượt #17 đo lại ở đợt 140 theo kế hoạch đứng.
7. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 138 §11: mù #58 (T2), G1 chờ user quyết, R9 (a) số đếm 16, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND139_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (do Phụ lục A+B: bảng sampler đầy đủ 109 mẫu theo yêu cầu brief) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 138: T2/T6/T5/T9). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round139-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round139-t9/headroom-measure-1.log` (đo lần 1, boot cũ), `headroom-measure-2.log` (đo lần 2, boot cũ), `headroom-measure-3-postreboot.log` (đo lần 3, boot mới), `ram-sampler-long.log` (vòng 1: 74 mẫu, 14:41:57–15:55:02Z), `ram-sampler-long-2.log` (vòng 2: 35 mẫu, 15:57:11–16:31:13Z), `ram-sampler-long.sh` + `ram-sampler-long-2.sh` (script hai vòng), `appendix-vong1.md` + `appendix-vong2.md` (bảng sampler đã sinh) — không nằm trong repo nên không stage.
- Cờ `round139-t9.done` đã tạo khi xong (ở lại tới 16:32Z theo đúng brief — sampler dài hai vòng).
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard).

## Phụ lục A. Bảng sampler đầy đủ — vòng 1 (74 mẫu, 60 s/mẫu, boot cũ 541524e2)

Nguồn: `hidden_files/round139-t9/ram-sampler-long.log` (14:41:57–15:55:02Z). Guard = 6.291.456 kB. Mẫu 15:55:02Z chưa rõ boot (xem F-139-T9-3).
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 1 | 14:41:57Z | 1647620 | 1609.0 | 5151204 | 652148 | 1.55 |
| 2 | 14:42:57Z | 1522452 | 1486.8 | 5330612 | 657096 | 1.66 |
| 3 | 14:43:57Z | 1262724 | 1233.1 | 5496284 | 653024 | 2.31 |
| 4 | 14:44:57Z | 1802680 | 1760.4 | 4956232 | 652596 | 2.27 |
| 5 | 14:45:57Z | 1620340 | 1582.4 | 5150780 | 653932 | 2.00 |
| 6 | 14:46:57Z | 2120076 | 2070.4 | 4615428 | 635788 | 2.46 |
| 7 | 14:47:57Z | 2070032 | 2021.5 | 4767688 | 637808 | 2.46 |
| 8 | 14:48:57Z | 1842608 | 1799.4 | 4989136 | 646504 | 1.06 |
| 9 | 14:49:57Z | 1631896 | 1593.6 | 5196344 | 647664 | 1.15 |
| 10 | 14:50:57Z | 1465012 | 1430.7 | 5383916 | 664276 | 1.03 |
| 11 | 14:51:58Z | 1281840 | 1251.8 | 5554360 | 661088 | 0.57 |
| 12 | 14:52:58Z | 1240252 | 1211.2 | 5462112 | 669732 | 1.19 |
| 13 | 14:53:58Z | 1322616 | 1291.6 | 5376136 | 669600 | 1.11 |
| 14 | 14:54:58Z | 1093260 | 1067.6 | 4986692 | 737600 | 0.73 |
| 15 | 14:55:58Z | 872492 | 852.0 | 5073744 | 742304 | 0.86 |
| 16 | 14:56:58Z | 858576 | 838.5 | 5200216 | 742628 | 1.37 |
| 17 | 14:57:58Z | 978232 | 955.3 | 5331344 | 743728 | 1.24 |
| 18 | 14:58:58Z | 841772 | 822.0 | 5458280 | 741124 | 0.66 |
| 19 | 14:59:58Z | 2440248 | 2383.1 | 4383316 | 758144 | 1.06 |
| 20 | 15:00:58Z | 2475044 | 2417.0 | 4378352 | 763512 | 0.59 |
| 21 | 15:01:58Z | 2040444 | 1992.6 | 4646472 | 768620 | 0.67 |
| 22 | 15:02:58Z | 1316692 | 1285.8 | 4819148 | 744304 | 1.20 |
| 23 | 15:03:58Z | 1532528 | 1496.6 | 4732592 | 719292 | 1.09 |
| 24 | 15:04:58Z | 1392616 | 1360.0 | 4912488 | 724468 | 0.49 |
| 25 | 15:05:58Z | 1194100 | 1166.1 | 5076412 | 727416 | 0.18 |
| 26 | 15:06:59Z | 905320 | 884.1 | 5221104 | 726716 | 0.22 |
| 27 | 15:07:59Z | 1354036 | 1322.3 | 5387340 | 727632 | 0.25 |
| 28 | 15:08:59Z | 1178132 | 1150.5 | 5557508 | 728268 | 0.27 |
| 29 | 15:09:59Z | 810500 | 791.5 | 5401600 | 658440 | 0.31 |
| 30 | 15:10:59Z | 861088 | 840.9 | 5114032 | 663412 | 1.27 |
| 31 | 15:11:59Z | 1230716 | 1201.9 | 5257472 | 665208 | 0.86 |
| 32 | 15:12:59Z | 1319600 | 1288.7 | 5406896 | 665960 | 0.39 |
| 33 | 15:13:59Z | 2669952 | 2607.4 | 4280860 | 661052 | 0.53 | **← max**
| 34 | 15:14:59Z | 2373044 | 2317.4 | 4561412 | 665340 | 0.23 |
| 35 | 15:15:59Z | 2111700 | 2062.2 | 4814764 | 666372 | 0.08 |
| 36 | 15:16:59Z | 1866928 | 1823.2 | 5041744 | 666800 | 0.03 |
| 37 | 15:17:59Z | 1658488 | 1619.6 | 5249128 | 667732 | 0.15 |
| 38 | 15:18:59Z | 1396008 | 1363.3 | 5431052 | 668404 | 0.71 |
| 39 | 15:19:59Z | 1316364 | 1285.5 | 5600412 | 667908 | 0.69 |
| 40 | 15:20:59Z | 1157232 | 1130.1 | 5753264 | 668536 | 0.30 |
| 41 | 15:21:59Z | 1015424 | 991.6 | 5893088 | 673532 | 0.35 |
| 42 | 15:22:59Z | 919260 | 897.7 | 6020708 | 677328 | 0.16 |
| 43 | 15:24:00Z | 788348 | 769.9 | 6135760 | 680480 | 0.06 |
| 44 | 15:25:00Z | 698964 | 682.6 | 6238716 | 682272 | 0.11 |
| 45 | 15:26:00Z | 589196 | 575.4 | 6335944 | 682248 | 0.28 |
| 46 | 15:27:00Z | 538592 | 526.0 | 6426400 | 682576 | 0.29 |
| 47 | 15:28:00Z | 477260 | 466.1 | 6443824 | 676868 | 0.22 |
| 48 | 15:29:00Z | 489888 | 478.4 | 6443824 | 676196 | 0.34 |
| 49 | 15:30:00Z | 481740 | 470.4 | 6443824 | 674972 | 0.20 |
| 50 | 15:31:00Z | 510308 | 498.3 | 6443824 | 670048 | 0.07 |
| 51 | 15:32:00Z | 496328 | 484.7 | 6443824 | 668544 | 0.07 |
| 52 | 15:33:00Z | 517108 | 505.0 | 6443824 | 666956 | 0.06 |
| 53 | 15:34:00Z | 521072 | 508.9 | 6443824 | 667084 | 0.02 |
| 54 | 15:35:00Z | 488280 | 476.8 | 6443824 | 656956 | 0.61 |
| 55 | 15:36:00Z | 1131884 | 1105.4 | 5854000 | 633264 | 0.70 |
| 56 | 15:37:00Z | 946496 | 924.3 | 5990612 | 635012 | 0.26 |
| 57 | 15:38:00Z | 865056 | 844.8 | 6115292 | 635436 | 0.30 |
| 58 | 15:39:00Z | 680804 | 664.8 | 6226004 | 624416 | 1.15 |
| 59 | 15:40:01Z | 640048 | 625.0 | 5603668 | 602212 | 1.22 |
| 60 | 15:41:01Z | 721980 | 705.1 | 5648820 | 602004 | 1.48 |
| 61 | 15:42:01Z | 579976 | 566.4 | 5712308 | 602112 | 1.78 |
| 62 | 15:43:01Z | 635700 | 620.8 | 5804496 | 604808 | 1.09 |
| 63 | 15:44:01Z | 518580 | 506.4 | 5815156 | 599336 | 1.83 |
| 64 | 15:45:01Z | 447328 | 436.8 | 5894636 | 600844 | 1.29 |
| 65 | 15:46:01Z | 504348 | 492.5 | 5975528 | 603576 | 0.69 |
| 66 | 15:47:01Z | 401760 | 392.3 | 6051636 | 604304 | 0.37 |
| 67 | 15:48:01Z | 706524 | 690.0 | 5461812 | 597472 | 0.84 |
| 68 | 15:49:02Z | 657692 | 642.3 | 5587276 | 596584 | 1.91 |
| 69 | 15:50:02Z | 400704 | 391.3 | 5669132 | 593260 | 1.64 | **← min**
| 70 | 15:51:02Z | 911476 | 890.1 | 5774808 | 596364 | 1.57 |
| 71 | 15:52:02Z | 1031412 | 1007.2 | 5040668 | 606416 | 1.84 |
| 72 | 15:53:02Z | 1017344 | 993.5 | 5191760 | 608376 | 1.35 |
| 73 | 15:54:02Z | 888280 | 867.5 | 5339612 | 606936 | 0.53 |
| 74 | 15:55:02Z | 1493168 | 1458.2 | 5497940 | 754648 | 0.31 | **← boot chưa rõ (F-139-T9-3)**

## Phụ lục B. Bảng sampler đầy đủ — vòng 2 (35 mẫu, 60 s/mẫu, boot mới af558fb5)

Nguồn: `hidden_files/round139-t9/ram-sampler-long-2.log` (15:57:11–16:31:13Z, SAMPLER END 16:32:13Z). Guard = 6.291.456 kB. Số thứ tự nối tiếp vòng 1 (#75–#109).
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 75 | 15:57:11Z | 1498204 | 1463.1 | 5333740 | 1006632 | 1.76 |
| 76 | 15:58:11Z | 1369776 | 1337.7 | 5515136 | 998840 | 0.72 |
| 77 | 15:59:11Z | 1265424 | 1235.8 | 5680172 | 944596 | 0.55 |
| 78 | 16:00:11Z | 1565676 | 1529.0 | 5345464 | 811032 | 1.08 | **← max**
| 79 | 16:01:11Z | 1484412 | 1449.6 | 5468436 | 792424 | 0.49 |
| 80 | 16:02:11Z | 1476336 | 1441.7 | 5392676 | 780344 | 0.58 |
| 81 | 16:03:11Z | 1365272 | 1333.3 | 5567728 | 775892 | 0.32 |
| 82 | 16:04:11Z | 1240544 | 1211.5 | 5730668 | 775812 | 0.12 |
| 83 | 16:05:11Z | 1087644 | 1062.2 | 5880588 | 772828 | 0.21 |
| 84 | 16:06:11Z | 966652 | 944.0 | 6017636 | 764524 | 0.17 |
| 85 | 16:07:11Z | 824220 | 804.9 | 6141076 | 762600 | 0.11 |
| 86 | 16:08:12Z | 763276 | 745.4 | 6254260 | 761280 | 0.19 |
| 87 | 16:09:12Z | 565752 | 552.5 | 6347004 | 740688 | 0.71 |
| 88 | 16:10:12Z | 850212 | 830.3 | 6208788 | 678044 | 1.10 |
| 89 | 16:11:12Z | 644456 | 629.4 | 6311076 | 671796 | 1.41 |
| 90 | 16:12:12Z | 618288 | 603.8 | 6407732 | 672300 | 0.61 |
| 91 | 16:13:12Z | 587468 | 573.7 | 6443824 | 673276 | 0.22 |
| 92 | 16:14:12Z | 588788 | 575.0 | 6443824 | 674304 | 0.27 |
| 93 | 16:15:12Z | 609876 | 595.6 | 6443824 | 674172 | 0.33 |
| 94 | 16:16:12Z | 985224 | 962.1 | 6050608 | 673032 | 0.85 |
| 95 | 16:17:12Z | 894828 | 873.9 | 6133428 | 674788 | 0.31 |
| 96 | 16:18:12Z | 765928 | 748.0 | 6248084 | 674632 | 0.11 |
| 97 | 16:19:13Z | 617400 | 602.9 | 6352436 | 673364 | 0.04 |
| 98 | 16:20:13Z | 585416 | 571.7 | 6443824 | 672836 | 0.07 |
| 99 | 16:21:13Z | 580224 | 566.6 | 6443824 | 677040 | 0.06 |
| 100 | 16:22:13Z | 584604 | 570.9 | 6443824 | 677024 | 0.05 |
| 101 | 16:23:13Z | 580536 | 566.9 | 6443824 | 676796 | 0.25 |
| 102 | 16:24:13Z | 575684 | 562.2 | 6443824 | 676556 | 0.09 |
| 103 | 16:25:13Z | 576952 | 563.4 | 6443824 | 680360 | 0.08 |
| 104 | 16:26:13Z | 581060 | 567.4 | 6443824 | 685924 | 0.13 |
| 105 | 16:27:13Z | 582224 | 568.6 | 6443824 | 688672 | 0.12 |
| 106 | 16:28:13Z | 544924 | 532.2 | 6443824 | 692676 | 0.04 |
| 107 | 16:29:13Z | 549492 | 536.6 | 6443824 | 692724 | 0.01 |
| 108 | 16:30:13Z | 543912 | 531.2 | 6443824 | 692904 | 0.08 | **← min**
| 109 | 16:31:13Z | 570016 | 556.7 | 6443824 | 692076 | 0.21 |
