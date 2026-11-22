# LIMITS — Phase 9 đợt 138, T9: headroom inotify + RAM + guard birefnet (Ở LẠI MUỘN)

## 0. Tóm tắt (đọc trước)

- **Headroom inotify: 2.064** (đo 2 lần trên boot lúc mở đợt: 2.064 lúc 11:39:22Z và **2.064** lúc 11:39:31Z 18/11, boot 17db9652 btime 09:36:01Z, chênh **0**) — **TIẾP TỤC GIẢM**: 2.175 (đợt 137) → **2.064 (−111, −5,1%)**. Bước giảm nằm trong dải 106–127 của **chín đợt gần nhất (130–138)**. Xem §1.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **264**; vẫn gấp ~1,31 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại đợt 137 §12.3(j)).
- **REBOOT GIỮA CỬA SỔ ĐO (sự kiện #19? — T6 chốt số): boot 17db9652 (#94?) chết 11:52:20Z, boot mới 914964c3 = #95? (tạm) lên thay; cửa sổ reboot (11:51:36Z, 11:52:20Z] (T2-138 xác nhận — mốc cuối boot cũ là lần đo T2 lúc 11:51:36Z, MemAvailable 6.204.548 kB).** Sampler của T9 bị runtime restart giết cùng lúc; đã khởi động lại sau ~41 giây, KHÔNG mất mẫu nào ngoài khoảng trống đó (xem F-138-T9-3). Đo thêm headroom lần 3 trên boot mới: **2.056** lúc 13:31:54Z — giá trị này KHÔNG thay thế 2.064 trong chuỗi (khác boot), chỉ để T6/T10 đối chiếu. Xem §1.4, §5.
- **RAM: ĐỈNH SUÝT VƯỢT GUARD — 99,07%, THIẾU CHỈ ~57 MiB — NHƯNG KHÔNG VƯỢT, KHÔNG THỬ birefnet.** Max theo sampler của T9: **6.232.924 kB = 6.086,8 MiB lúc 11:51:51Z** (boot cũ), thiếu **58.532 kB (~57,2 MiB)** mới tới guard 6.291.456 kB. Đây là **đỉnh cao nhất mọi sampler đợt này** (T2: 6.204.548 kB = 98,6% lúc 11:51:36Z; T5: 6.112.624 kB = 97,2% lúc 11:51:59Z) và là **kỷ lục mới của T9** (vượt đỉnh đợt 136: 6.081 MB = 98,99%). Cả ba sampler đều đỉnh trong cùng cửa sổ ~11:51:36–11:51:59Z và **không sampler nào quan sát được ≥ 6.144 MiB** — quyết "thử ngay khi quan sát được" đã được trực đúng (T9 ở lại muộn, sampler chạy tới 13:30Z), cửa sổ chỉ không mở. Xem §3.
- **Đỉnh là CHỚP NGẮN, không phải mức bền:** 5.700.224 kB (11:50:51Z) → 6.232.924 kB (11:51:51Z) → 5.863.552 kB (11:52:51Z, boot chưa rõ — xem F-138-T9-3). Kể cả nếu đã vượt, mức đó cũng không giữ đủ ~7 phút cho một lần thử birefnet (P7 §5); reboot 11:52:20Z cắt đứt đợt hồi ngay sau đó. **Birefnet vẫn 0 lần chạy thành công trong gói. u2net vẫn là fallback chính thức.** Xem §3, F-138-T9-2.
- **Boot mới RAM KẸT THẤP suốt cửa sổ còn lại (97 mẫu, 11:53:32–13:29:39Z): max chỉ 1.862.908 kB (1.819,2 MiB) lúc 11:53:32Z, min 472.784 kB (461,7 MiB) lúc 12:06:33Z** — min thấp thứ hai trong chuỗi T9 gần đây (sau 433 MB đợt 133). Vùng trũng 462–572 MB kéo dài, chỉ có ba lần nhô ngắn 816–1.085 MB. Xem §2.
- **Balloon virtio: xả sâu nhất chuỗi T9 tới 585.796 kB (7,2% tổng RAM) lúc đỉnh RAM, rồi phình lại và ĐÓNG BĂNG ở 6.443.824 kB (79,3% tổng RAM)** trong phần lớn cửa sổ boot mới — giá trị này lặp lại y hệt qua hàng chục mẫu. Ròng cả cửa sổ: +364.724 kB (~+0,35 GB) so với lúc đo đầu. Balloon do host điều khiển, ngoài tầm luồng này. Xem §2.2.
- **Không có vite/chrome nào đang chạy lúc đo (cả hai boot), không có ENOSPC nào** (journal 0 dòng "No space left"/ENOSPC cả boot cũ lẫn boot mới). Replay boot cũ XONG (dpkg.log 1.545 dòng); replay boot mới CHƯA XONG lúc T9 đóng (795 dòng, ghi cuối 12:21:19Z) — T5 là chủ quản replay.
- **Median tickCost lượt yên #15 (T4) CHƯA CÓ lúc T9 đóng** (không có file LIMITS T4-138 trên đĩa lúc 13:31Z; T4 chưa có cờ .done) — giao T10 đối chiếu chéo khi gộp (như F-137-T9-5).
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard — xem §3). Làm việc nhẹ (chỉ đo + sampler).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi, cả hai boot).

### 1.2 Số đo đợt 138 (boot lúc mở đợt 17db9652, btime 09:36:01Z)

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| 11:39:22Z | **2.064** | lần đo 1, boot ~2h03' tuổi; replay boot cũ đã xong (dpkg.log 1.545 dòng) |
| 11:39:31Z | **2.064** | lần đo 2 (chênh **0** so với lần 1) |

- Probe dừng ở `i=2064` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 0 trong cùng boot:** lần đầu tiên chuỗi T9 ghi chênh 0 ở cả hai lần đo chính (đợt 137: −4; các đợt trước: −5, −10, −11, −7, −1, −10/−2, 0, −7, −8 — đợt 129 cũng từng ghi 0 ở một cặp đo). Giá trị đợt lấy **2.064**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.064 = **61.683 watch** (tăng ~111 so với 61.572 đợt 137).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.064 / 1.578 ≈ **1,31 lần** — đủ cho ~1–2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + LIMITS T9 đợt 131 §1.3 + LIMITS T9 đợt 132 §1.3 + LIMITS T9 đợt 133 §1.3 + LIMITS T9 đợt 134 §1.3 + LIMITS T9 đợt 135 §1.3 + LIMITS T9 đợt 136 §1.3 + LIMITS T9 đợt 137 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **138** | **2.064 → 2.064** | **đo 11:39:22Z → 11:39:31Z, boot 17db9652 btime 09:36:01Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175 → 2.064**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.064 = **−2.374 (−53,5%)**. Bước giảm đợt này: −111 so với đợt 137 (−5,1%) — **đợt thứ chín liên tiếp bước giảm nằm trong dải 106–127** (130: −116; 131: −117; 132: −108; 133: −106; 134: −127; 135: −110; 136: −114; 137: −106; 138: −111).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **264** (đợt 137 còn 375). Con số giảm ~106–127/đợt chỉ là phép chia số học minh họa (264 / ~111 ≈ 2,4 đợt nếu đà giữ nguyên) — **KHÔNG phải dự báo** (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot; quyết parent đứng). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~61,7k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

### 1.4 Đo lần 3 — boot mới 914964c3 (ngoài chuỗi, chỉ để đối chiếu)

- **2.056 lúc 13:31:54Z** (boot mới btime 11:52:20Z, ~1h40' tuổi; RAM trước đo 446.972 kB, sau đo 486.688 kB; balloon 6.443.824 kB; dpkg.log 795 dòng, replay chưa xong). Probe dừng ở `i=2056`, errno=28; file tạm đã dọn sạch.
- Chênh so với giá trị boot cũ: −8. Trong dải biến thiên giữa các boot đã thấy (đợt 137: trong-boot −4; các đợt trước có bước nhảy lớn giữa boot). **Không đưa 2.056 vào chuỗi §1.3** — chuỗi nối tiếp lấy giá trị trên boot lúc mở đợt (2.064).
- Đối chiếu chéo: T5-138 cũng ghi headroom "2065→2058→2056" — giá trị 2056 cuối của T5 **khớp đúng** lần đo 3 của T9; giá trị 2065 đầu của T5 chênh +1 so với 2064 của T9 (cùng khoảng 11:39Z, nhiễu watch churn giữa hai lần đo cách nhau vài chục giây). Xem F-138-T9-5.

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB) — sampler dài 111 mẫu, 11:39:50–13:29:39Z

### 2.1 Hình dạng cửa sổ: một đợt hồi mạnh trên boot cũ, rồi kẹt thấp suốt boot mới

Sampler: mỗi 60 giây một mẫu MemAvailable + Balloon + SwapFree + load1, chạy 11:39:50Z → 13:30:39Z (111 mẫu; xem bảng đầy đủ ở Phụ lục A). **Min toàn cửa sổ: 472.784 kB (461,7 MiB) lúc 12:06:33Z (boot mới). Max toàn cửa sổ: 6.232.924 kB (6.086,8 MiB) lúc 11:51:51Z (boot cũ).** Mean toàn cửa sổ 987.378 kB (trộn hai boot — chỉ để tham khảo, không dùng làm chỉ số).

**Boot cũ 17db9652 (14 mẫu, 11:39:50–11:52:51Z) — đợt hồi mạnh nhất chuỗi T9:**

| Thời điểm (UTC) | RAM khả dụng | Balloon | Ghi chú |
|---|---|---|---|
| 11:39:50Z | 772,3 MiB (790.820 kB) | 5.962.220 kB | mở sampler |
| 11:40:50Z | 1.288,2 MiB | 5.575.260 kB | +516 MB / 60 s |
| 11:41:50Z | 1.340,3 MiB | 5.483.484 kB | |
| 11:42:50Z | 1.585,8 MiB | 4.290.276 kB | balloon xả −1,19 GB / 60 s |
| 11:43:50Z | 2.874,1 MiB | 3.622.276 kB | +1.288 MB / 60 s |
| 11:44:50Z | 2.460,8 MiB | 3.945.664 kB | lùi |
| 11:45:50Z | 2.604,9 MiB | 4.047.892 kB | |
| 11:46:50Z | 2.442,4 MiB | 4.244.960 kB | |
| 11:47:50Z | 3.072,6 MiB | 3.640.508 kB | |
| 11:48:50Z | 3.908,3 MiB | 2.772.964 kB | |
| 11:49:51Z | 5.643,7 MiB | 1.003.492 kB | balloon xả −1,77 GB / 60 s |
| 11:50:51Z | 5.566,6 MiB | 1.052.100 kB | |
| 11:51:51Z | **6.086,8 MiB (6.232.924 kB)** | **585.796 kB** | **MAX cửa sổ, 99,07% guard** |
| 11:52:51Z | 5.726,1 MiB (5.863.552 kB) | 979.012 kB | boot chưa rõ — xem F-138-T9-3 |

- Đợt hồi từ 772 MB lên 6.087 MB trong ~12 phút (biên độ ~5.315 MB) — **mạnh nhất chuỗi T9** (vượt đợt 136: 1.406 → 6.081 MB, biên độ ~4.675 MB). Min boot cũ 790.820 kB; max boot cũ 6.232.924 kB.
- Số RAM lúc mở đợt: brief không ghi số RAM lúc mở (chỉ ghi boot 17db9652 = #94?); số đo trực tiếp đầu tiên của T9 là 495.600 kB lúc 11:37:48Z (kiểm tra mở đầu, trước probe 1) và 771.924 kB lúc 11:39:22Z (trước probe 1) — cả hai đều < guard. Xem F-138-T9-1 (lặp lại từ đợt 137: brief không ghi RAM lúc mở).

**Boot mới 914964c3 = #95? (tạm) (97 mẫu, 11:53:32–13:29:39Z) — kẹt thấp, không có đợt hồi thứ hai:**

| Giai đoạn (UTC) | RAM khả dụng | Ghi chú |
|---|---|---|
| 11:53:32Z | 1.819,2 MiB (1.862.908 kB) | mẫu đầu sau reboot (max boot mới); balloon 5.008.208 kB |
| 11:54:32–12:02:33Z | 1.548 → 737 MiB | rơi đơn điệu |
| 12:03:33–12:11:33Z | 527 → 498 MiB | **vùng trũng 1**: 462–572 MB; min 461,7 MiB lúc 12:06:33Z |
| 12:12:33–12:16:34Z | 900 → 840 MiB | nhô ngắn (đỉnh 1.084,9 MiB lúc 12:14:34Z), rồi lùi |
| 12:17:34–12:27:35Z | 749 → 489 MiB | **vùng trũng 2**: 462–510 MB |
| 12:28:35–12:30:35Z | 884 → 757 MiB | nhô ngắn lần 2 (đỉnh 975,6 MiB lúc 12:29:35Z) |
| 12:31:35–13:00:37Z | 647 → 558 MiB | lùi dần về trũng |
| 13:01:37–13:03:37Z | 766 → 587 MiB | nhô ngắn lần 3 (yếu nhất) |
| 13:04:38–13:29:39Z | 531 → 515 MiB | **vùng trũng 3**: 470–570 MB tới cuối cửa sổ |

- Min boot mới 472.784 kB (461,7 MiB) — **thấp thứ hai trong chuỗi T9 gần đây** (sau 433 MB đợt 133; thấp hơn min đợt 137 là 787 MB). Max boot mới 1.862.908 kB (1.819,2 MiB) — chỉ 29,6% guard.
- Sau mẫu đầu, **không mẫu nào trên boot mới vượt 1.110.904 kB (1.084,9 MiB)**. Ba lần nhô (12:12–12:16Z, 12:28–12:30Z, 13:01–13:03Z) đều lùi trong 2–5 phút — không đợt hồi nào bền như boot cũ.
- Load1 trong cửa sổ: 0,06–4,06 — máy gần như yên trong phần lớn cửa sổ boot mới (nhiều mẫu load1 0,06–0,57) mà RAM vẫn kẹt ~500 MB: RAM thấp không phải do tải trong cell, mà do balloon host giữ.
- Swap: SwapFree 662.808 kB lúc mở → **1.040.616 kB ngay sau reboot** (swap gần như trống, chỉ ~8 MB đang dùng — reboot xả swap) → 688.716 kB lúc cuối (swap đang dùng ~359.856 kB). Xem F-138-T9-4.

### 2.2 Balloon virtio — xả sâu nhất chuỗi rồi đóng băng

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo**. Boot cũ: 6.079.100 kB (11:39:22Z, lúc đo đầu) → **585.796 kB lúc 11:51:51Z (min toàn cửa sổ, 7,2% tổng RAM)** → 979.012 kB (11:52:51Z). Mức xả này là **sâu thứ hai trong chuỗi T9** (sau đợt 136 lúc đóng ~5,9% tổng RAM theo ghi nhận đợt 137 §2.2).
- Boot mới: 5.008.208 kB (11:53:32Z) → phình lại **6.443.824 kB (79,3% tổng RAM)** rồi **ĐÓNG BĂNG đúng giá trị này qua hàng chục mẫu** (12:06:33–13:29:39Z, chỉ gián đoạn bởi ba lần nhô ngắn khi balloon xả tạm 162–393 MB). Giá trị 6.443.824 kB lặp lại y hệt là dấu hiệu host giữ balloon ở một mức trần cố định — T9 chỉ ghi nhận, không kết luận cơ chế host.
- Ròng cả cửa sổ (đo đầu 11:39:22Z → mẫu cuối 13:29:39Z): **+364.724 kB (~+0,35 GB)** — ngược với đợt 137 (xả ròng −0,90 GB). Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp.
- Số học lúc đỉnh RAM 11:51:51Z: tổng RAM 8.124.900 kB − balloon 585.796 kB = 7.539.104 kB còn lại cho hệ thống; trong đó MemAvailable 6.232.924 kB + free/cache ~1,3 GB. Lúc cuối cửa sổ 13:29:39Z: tổng RAM − balloon 6.443.824 kB = 1.681.076 kB còn lại; MemAvailable chỉ 527.168 kB.

### 2.3 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

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
| **138** | **— (brief không ghi; T9 đo trực tiếp 495.600 kB lúc 11:37:48Z, 771.924 kB lúc 11:39:22Z)** | **772–6.087 MB (boot cũ, 14 mẫu, 11:39:50–11:52:51Z) rồi 462–1.819 MB (boot mới, 97 mẫu, 11:53:32–13:29:39Z); REBOOT 11:52:20Z cắt giữa hai pha** (sampler dài của T9, ~111 phút) | **515 MiB lúc 13:29:39Z** |

- Mẫu chung: đợt hồi giữa lượt vẫn không ổn định theo đợt — đỉnh các đợt hồi 133→138 là 512 MB, 2.438 MB, 1.734 MB, 6.081 MB, 2.123 MB, **6.087 MB**. Đợt 138 lần đầu tiên trong chuỗi có **hai pha RAM hoàn toàn khác nhau trong một đợt** (hồi mạnh → reboot → kẹt thấp), vì reboot cắt giữa chừng.

## 3. Guard birefnet — KHÔNG ĐẠT (99,07%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân; quyết parent đợt 137 §12.3(f) giao rõ T9-138 thử ngay khi cửa sổ mở): **chỉ thử birefnet khi quan sát được available RAM ≥ 6.144 MiB (6.291.456 kB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này (sampler T9): **6.232.924 kB = 6.086,8 MiB = 99,07% guard** lúc **11:51:51Z** (boot cũ) — thiếu **58.532 kB (~57,2 MiB, ~0,93%)**.
- Đối chiếu ba sampler độc lập trong cùng cửa sổ ~11:51:36–11:51:59Z: **T9 6.232.924 kB (99,07%) > T2 6.204.548 kB (98,6%, thiếu ~85 MiB tới guard, đang hồi nhanh) > T5 6.112.624 kB (97,2%)** — cả ba đều dưới guard, chênh nhau tối đa 120.300 kB (~117 MiB) trong 15 giây, phù hợp với tốc độ biến thiên RAM lúc đó (~±100–500 MB/phút). **0 mẫu ≥ 6.144 MiB ở bất kỳ sampler nào.** Reboot 11:52:20Z đã reset trạng thái RAM — cửa sổ mới trên boot #95? (tạm) phải đo lại từ đầu (xem §2.1: 97 mẫu boot mới, max chỉ 1.819,2 MiB).
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói. Đây là lần suýt nhất từ trước tới nay theo sampler T9 (vượt 98,99% đợt 136), nhưng "suýt" vẫn là "không đạt" — guard là ngưỡng cứng, không có ngoại lệ "gần đủ".
- **Quy trình "thử ngay" đã được trực đúng, chỉ là cửa sổ không mở:** T9 ở lại muộn tới 13:30:39Z (sampler 111 mẫu, ~111 phút — dài nhất chuỗi T9); lệnh thử đã chuẩn bị sẵn từ 11:50:05Z (xem §3.1); đỉnh 99,07% xuất hiện lúc 11:51:51Z, chỉ 1 phút sau khi sẵn sàng. Không có lỗi quy trình kiểu đợt 137 (T9 đóng trước khi cửa sổ mở) — lần này T9 đang trực khi đỉnh xuất hiện, và đỉnh vẫn thiếu 57 MiB.
- **Kể cả nếu đã vượt, đỉnh cũng không đủ bền cho một lần thử:** 5.700.224 kB (11:50:51Z) → 6.232.924 kB (11:51:51Z) → 5.863.552 kB (11:52:51Z) — đỉnh chỉ tồn tại trong một mẫu 60 giây; ngay mẫu sau đã lùi 369.372 kB. Một lần thử birefnet cần ~7 phút RAM ổn định (P7 §5). Ghi rõ để parent khỏi hiểu "chỉ thiếu 57 MiB" thành "lần sau chắc chắn thử được".

### 3.1 Sẵn sàng thử đã xác minh (11:50:05Z, chỉ đọc — không chạy)

- Venv: `server/bgremove/.venv/bin/python` tồn tại; `rembg 2.0.87`, `onnxruntime 1.23.2` import được.
- Model: `~/.u2net/birefnet-general.onnx` 972.666.916 byte, `u2net.onnx` 175.997.641 byte — có sẵn, không tải.
- Clip: `~/workspace/tmp-p7-ramguard/clip05.mp4` 14.554 byte (0,5 s, 17 frame — đúng clip P7 dùng).
- Lệnh thử đã chuẩn bị (chưa chạy — không đủ điều kiện guard): `server/bgremove/.venv/bin/python server/bgremove/bgremove.py --input ~/workspace/tmp-p7-ramguard/clip05.mp4 --output ~/workspace/tmp-t9-138-birefnet/out-birefnet-138.mov --mode alpha --session birefnet-general --temporal 0.4 --feather 1` (đúng tham số P7 §7; output ngoài repo để không đưa binary vào batch). Thư mục `~/workspace/tmp-t9-138-birefnet/` đã tạo sẵn, trống.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (kiểm tra `ps` lúc 11:39Z và lúc 13:31Z; chỉ có tiến trình hệ thống + các luồng đợt 138) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.064 chỉ đủ ~1–2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2064, i=2064, i=2056) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot cũ 09:36:01Z: **0 dòng "No space left" / ENOSPC** (kiểm tra 11:40:03Z, "-- No entries --"). Journal từ lúc boot mới 11:52:20Z: **0 dòng** (kiểm tra 13:31Z, "-- No entries --"). Lưu ý: `journalctl --list-boots` chỉ hiện boot mới (boot cũ không còn trong journal của cell) — T6 là chủ quản chuỗi boot, T9 chỉ ghi nhận.
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 138 = boot lúc T9 đo đầu:** btime **09:36:01Z** 18/11 (`uptime -s` + `btime 1794994561` trong `/proc/stat` + boot_id `17db9652-...` — khớp brief: 17db9652 = #94? theo quyết parent đợt 137 §12.3(g)).
- **REBOOT GIỮA CỬA SỔ ĐO CỦA T9: boot mới 914964c3 = #95? (tạm), btime 11:52:20Z** (`uptime -s` + `btime 1795002740` + boot_id `914964c3-c36a-4893-bf24-d8321e75d299` + `who -b`: system boot Nov 18 11:52). **Cửa sổ reboot (11:51:36Z, 11:52:20Z]** (T2-138 xác nhận). Boot cũ sống 09:36:01Z → 11:52:20Z = **2h16m19s**. Số sự kiện reboot chờ T6 chốt (T5-138 gọi là sự kiện #19? — T9 không chốt số); số boot mới #95? là **tạm, chờ T6 chốt**.
- **Runtime restart đi kèm reboot:** phiên exec sampler của T9 bị giết cùng lúc reboot; T9 khởi động lại sampler lúc 11:53:32Z (gap lấy mẫu ~41 giây, 11:52:51Z → 11:53:32Z — xem F-138-T9-3). Không mất mẫu nào khác.
- **Replay trên boot mới: CHƯA XONG lúc T9 đóng.** dpkg.log đi từ **1.545 dòng** (boot cũ, replay xong) xuống **795 dòng** (boot mới, ghi cuối 12:21:19Z `status installed libc-bin`) lúc 13:31:54Z. T5-138 ghi boot mới "kẹt update" + luật (C) kích hoạt lần đầu (kill 802, --repair PASS, cờ viết 12:22:38Z poll 28) — **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-138-T9-1 — RAM lúc mở đợt không có trong brief:** brief đợt 138 chỉ ghi boot 17db9652 = #94?, không ghi số RAM khả dụng lúc mở (giống đợt 137). T9 chỉ có số đo trực tiếp của mình: 495.600 kB lúc 11:37:48Z và 771.924 kB lúc 11:39:22Z. Không đổi verdict (cả hai số đều < guard).
- **F-138-T9-2 — Đỉnh 99,07% là chớp ngắn, không phải mức bền:** mẫu 11:51:51Z ghi 6.232.924 kB nhưng mẫu 60 giây sau (11:52:51Z) chỉ còn 5.863.552 kB, và reboot 11:52:20Z cắt đứt đợt hồi ngay sau đó. Max "theo sampler của T9" là 6.232.924 kB nhưng không phải mức ổn định — không được lấy làm mức RAM sẵn có bền vững, và không được hiểu là "lần sau chắc chắn vượt". Đợt hồi giữa lượt không ổn định theo đợt (xem §2.3): đỉnh các đợt 133→138 là 512 MB, 2.438 MB, 1.734 MB, 6.081 MB, 2.123 MB, 6.087 MB.
- **F-138-T9-3 — Khoảng trống lấy mẫu do runtime restart + mẫu 11:52:51Z chưa rõ boot:** sampler vòng 1 bị giết cùng lúc reboot; khoảng trống 11:52:51Z → 11:53:32Z (~41 giây) không có mẫu. Mẫu cuối vòng 1 (11:52:51Z, 5.863.552 kB, balloon 979.012 kB) mang timestamp **31 giây SAU btime boot mới (11:52:20Z)** nhưng do vòng lặp cũ ghi — boot của mẫu này **chưa rõ**: giá trị balloon/RAM nối tiếp đúng quỹ đạo boot cũ (balloon 585.796 → 979.012 kB), trong khi mẫu đầu boot mới (11:53:32Z) đã là balloon 5.008.208 kB — nên T9 xếp mẫu 11:52:51Z vào pha boot cũ, nhưng ghi rõ là **xếp theo quỹ đạo giá trị, không phải bằng chứng boot**. Nếu mẫu đó thực ra thuộc boot mới thì max boot cũ vẫn là 6.232.924 kB (11:51:51Z, chắc chắn boot cũ) — **verdict guard không đổi**. T6/T2 là chủ quản chốt khung chết boot #94?.
- **F-138-T9-4 — Swap xả sau reboot là quan sát, không phải kết luận:** SwapFree nhảy 703.432 kB (11:51:51Z) → 1.040.616 kB (11:53:32Z) ngay sau reboot (swap gần như trống, ~8 MB đang dùng), rồi lùi dần về 688.716 kB lúc 13:29:39Z (~360 MB đang dùng). T9 ghi đây là **tương quan thời gian với reboot**, không khẳng định reboot "gây ra" việc xả swap (có thể do tiến trình giữ swap chết theo reboot — ngoài tầm xác minh của T9).
- **F-138-T9-5 — Headroom đối chiếu T5 chênh nhỏ:** T5-138 ghi headroom "2065→2058→2056"; T9 đo 2064/2064 (boot cũ, 11:39Z) và 2056 (boot mới, 13:31Z). Chênh +1 ở lần đầu (2065 vs 2064) là nhiễu watch churn giữa hai lần đo cách nhau vài chục giây, không phải mâu thuẫn phương pháp — cả hai đều dùng probe K8. Giá trị 2056 cuối **khớp đúng** giữa hai luồng. Chuỗi §1.3 lấy số T9 (2064) theo thông lệ mọi đợt.
- **F-138-T9-6 — Median tickCost lượt yên #15 (T4) chưa có lúc T9 đóng:** brief các đợt trước dặn nếu T4 báo median ≥55 ms thì ghi nhận vào headroom context. Lúc T9 đóng cửa sổ đo (13:31:54Z), file LIMITS của T4 đợt 138 chưa xuất hiện trên đĩa và cờ round138-t4.done chưa có — **T10 đợt 138 đối chiếu chéo khi gộp** (quyết parent đợt 137 §12.3(c): ngưỡng ≤60 ms GIỮ; điều tra tải song song trước khi bàn lại). T9 không tự suy đoán median từ số RAM/headroom của mình.
- **F-138-T9-7 — Khoảng trống lấy mẫu 60 giây:** sampler lấy mẫu mỗi 60 giây; một lần vượt guard ngắn hơn 60 giây nằm giữa hai mẫu có thể không được quan sát. "Không quan sát được ≥ 6.144 MiB" (kết luận §3) nghĩa đúng là **không có mẫu nào ≥ guard**, không phải chứng minh tuyệt đối "không lúc nào vượt". Ba sampler độc lập (T2/T5/T9) cùng đỉnh 97–99% trong cùng cửa sổ 15 giây làm khả năng vượt lén là thấp, nhưng không triệt tiêu hoàn toàn.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 139 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 264 trên ngưỡng báo < ~1.800; tốc độ giảm chín đợt gần nhất ~106–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~2,4 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo).
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f) + đợt 137 §12.3(f)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đợt 138 max 99,07% guard (kỷ lục T9 mới) nhưng vẫn thiếu 57 MiB và đỉnh chỉ tồn tại ~1 mẫu — đợt hồi RAM giữa lượt không ổn định theo đợt; **giữ quy trình T9 ở lại muộn + sampler dài ở đợt sau** (quy trình đã chứng minh trực được đỉnh — lần này đỉnh xuất hiện lúc 11:51:51Z, trong cửa sổ trực).
3. **Reboot giữa lượt 11:52:20Z, cửa sổ (11:51:36Z, 11:52:20Z] (T2-138 xác nhận; sự kiện #19? — chờ T6 chốt số)** — khung chết boot #94? + số boot mới 914964c3 = #95? (tạm) chờ T6 chốt; replay boot mới chưa xong lúc T9 đóng (795 dòng) — giao T5 đợt 138/139 đối chiếu.
4. **Balloon virtio theo dõi** — đợt này balloon xả tới 585.796 kB (7,2% tổng RAM) rồi phình lại và đóng băng ở 6.443.824 kB (79,3% tổng RAM) suốt boot mới; nếu balloon giữ mức cao, harness/suite đợt sau vẫn phải chờ RAM — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
5. **Median tickCost lượt yên #15 (T4) chưa có lúc T9 đóng** — giao T10 đợt 138 đối chiếu chéo khi gộp (quyết parent đợt 137 §12.3(c)).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 137 §11: giữ fix T3 530e10a7 + DEF v0.5 (T3 viết đợt 138), mù #56 A + mù #57 (T2), G1 chờ user quyết, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND138_T9_HEADROOM_LIMITS.md` (file này) — **VƯỢT ngưỡng push thường 37.768 byte** (do Phụ lục A: bảng sampler đầy đủ 111 mẫu theo yêu cầu brief) — push cần `ENABLE_PRIVSEP=0` (như các file oversize đợt 137: T2/T6/T5 54.245 B). Kích thước/md5 chính xác lấy trên đĩa lúc T10 gộp (file đã sửa 2 lần sau khi đóng: đính chính §2.2 + bổ sung nhãn #95? (tạm) theo thông báo parent) — không ghi số tuyệt đối ở đây để khỏi lệch sau mỗi lần sửa.
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round138-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round138-t9/headroom-measure-1.log` (đo lần 1 + RAM + dpkg, boot cũ), `headroom-measure-2.log` (đo lần 2, boot cũ), `headroom-measure-3-postreboot.log` (đo lần 3, boot mới), `ram-sampler-long.log` (111 mẫu, 11:39:50–13:29:39Z, gồm 1 lần restart sampler sau reboot), `ram-sampler-long.sh` (script vòng sampler 1) — không nằm trong repo nên không stage.
- Cờ `round138-t9.done` đã tạo khi xong (về muộn nhất trong 9 luồng theo đúng brief — ở lại tới 13:30Z; T4/T8 chưa có cờ lúc T9 đóng).
- Không push, không sửa production, không chạy TTS 39, không thử birefnet (không đủ điều kiện guard).

## Phụ lục A. Bảng sampler đầy đủ (111 mẫu, 60 s/mẫu)

Nguồn: `hidden_files/round138-t9/ram-sampler-long.log` (vòng 1: 11:39:50–11:52:51Z, 14 mẫu, boot cũ — bị runtime restart giết cùng lúc reboot 11:52:20Z; vòng 2: 11:53:32–13:29:39Z, 97 mẫu, boot mới). Guard = 6.291.456 kB. Mẫu 11:52:51Z chưa rõ boot (xem F-138-T9-3).
| # | Thời điểm (UTC) | MemAvailable (kB) | MiB | Balloon (kB) | SwapFree (kB) | load1 |
|---|---|---|---|---|---|---|
| 1 | 11:39:50Z | 790820 | 772.3 | 5962220 | 662808 | 3.15 |
| 2 | 11:40:50Z | 1319084 | 1288.2 | 5575260 | 672684 | 3.00 |
| 3 | 11:41:50Z | 1372484 | 1340.3 | 5483484 | 704836 | 2.05 |
| 4 | 11:42:50Z | 1623908 | 1585.8 | 4290276 | 706536 | 4.06 |
| 5 | 11:43:50Z | 2943084 | 2874.1 | 3622276 | 710288 | 2.89 |
| 6 | 11:44:50Z | 2519872 | 2460.8 | 3945664 | 712940 | 2.90 |
| 7 | 11:45:50Z | 2667372 | 2604.9 | 4047892 | 716504 | 1.83 |
| 8 | 11:46:50Z | 2501000 | 2442.4 | 4244960 | 718240 | 1.93 |
| 9 | 11:47:50Z | 3146324 | 3072.6 | 3640508 | 701032 | 2.39 |
| 10 | 11:48:50Z | 4002108 | 3908.3 | 2772964 | 701008 | 2.13 |
| 11 | 11:49:51Z | 5779116 | 5643.7 | 1003492 | 702880 | 3.55 |
| 12 | 11:50:51Z | 5700224 | 5566.6 | 1052100 | 703156 | 3.02 |
| 13 | 11:51:51Z | 6232924 | 6086.8 | 585796 | 703432 | 2.56 | **← max**
| 14 | 11:52:51Z | 5863552 | 5726.1 | 979012 | 706528 | 1.37 |
| 15 | 11:53:32Z | 1862908 | 1819.2 | 5008208 | 1040616 | 3.91 |
| 16 | 11:54:32Z | 1585264 | 1548.1 | 5211816 | 1028292 | 2.45 |
| 17 | 11:55:32Z | 1412508 | 1379.4 | 5397800 | 1014480 | 1.08 |
| 18 | 11:56:32Z | 1286112 | 1256.0 | 5563920 | 883248 | 1.41 |
| 19 | 11:57:32Z | 1387588 | 1355.1 | 5479144 | 812376 | 1.00 |
| 20 | 11:58:32Z | 1231800 | 1202.9 | 5630760 | 806424 | 0.78 |
| 21 | 11:59:32Z | 1088364 | 1062.9 | 5775248 | 797080 | 0.52 |
| 22 | 12:00:33Z | 950780 | 928.5 | 5907876 | 793824 | 0.54 |
| 23 | 12:01:33Z | 844388 | 824.6 | 6028240 | 789016 | 0.44 |
| 24 | 12:02:33Z | 754196 | 736.5 | 6141808 | 787536 | 0.22 |
| 25 | 12:03:33Z | 539328 | 526.7 | 6247888 | 781028 | 0.40 |
| 26 | 12:04:33Z | 585612 | 571.9 | 6342896 | 779500 | 0.30 |
| 27 | 12:05:33Z | 493348 | 481.8 | 6431288 | 753380 | 0.19 |
| 28 | 12:06:33Z | 472784 | 461.7 | 6443824 | 746580 | 0.44 | **← min**
| 29 | 12:07:33Z | 495824 | 484.2 | 6443824 | 746820 | 0.29 |
| 30 | 12:08:33Z | 509540 | 497.6 | 6443824 | 729948 | 0.67 |
| 31 | 12:09:33Z | 490912 | 479.4 | 6443824 | 728144 | 0.55 |
| 32 | 12:10:33Z | 491008 | 479.5 | 6443824 | 722328 | 0.88 |
| 33 | 12:11:33Z | 509852 | 497.9 | 6443824 | 724056 | 0.46 |
| 34 | 12:12:33Z | 921296 | 899.7 | 6050608 | 692384 | 1.19 |
| 35 | 12:13:34Z | 835568 | 816.0 | 6127208 | 703836 | 0.67 |
| 36 | 12:14:34Z | 1110904 | 1084.9 | 5817848 | 705084 | 1.16 |
| 37 | 12:15:34Z | 929516 | 907.7 | 5954408 | 705852 | 0.84 |
| 38 | 12:16:34Z | 860512 | 840.3 | 6074368 | 703680 | 0.51 |
| 39 | 12:17:34Z | 766664 | 748.7 | 6186372 | 707740 | 0.63 |
| 40 | 12:18:34Z | 648444 | 633.2 | 6287048 | 705776 | 0.83 |
| 41 | 12:19:34Z | 565756 | 552.5 | 6380384 | 705108 | 0.97 |
| 42 | 12:20:34Z | 736668 | 719.4 | 6184040 | 685832 | 0.92 |
| 43 | 12:21:34Z | 685344 | 669.3 | 6285496 | 689032 | 1.14 |
| 44 | 12:22:34Z | 571248 | 557.9 | 6380192 | 691708 | 0.71 |
| 45 | 12:23:34Z | 539244 | 526.6 | 6443824 | 695328 | 0.98 |
| 46 | 12:24:34Z | 524580 | 512.3 | 6443824 | 692560 | 0.83 |
| 47 | 12:25:34Z | 493892 | 482.3 | 6443824 | 699484 | 0.40 |
| 48 | 12:26:35Z | 511164 | 499.2 | 6443824 | 699540 | 0.29 |
| 49 | 12:27:35Z | 500800 | 489.1 | 6443824 | 700100 | 0.35 |
| 50 | 12:28:35Z | 905400 | 884.2 | 6050608 | 682384 | 1.46 |
| 51 | 12:29:35Z | 999060 | 975.6 | 5944680 | 679284 | 1.18 |
| 52 | 12:30:35Z | 775524 | 757.3 | 6068952 | 676124 | 0.83 |
| 53 | 12:31:35Z | 662108 | 646.6 | 6179220 | 674480 | 0.41 |
| 54 | 12:32:35Z | 635648 | 620.8 | 6280424 | 678196 | 0.31 |
| 55 | 12:33:35Z | 543612 | 530.9 | 6374028 | 683804 | 0.20 |
| 56 | 12:34:35Z | 495336 | 483.7 | 6443824 | 684496 | 0.26 |
| 57 | 12:35:35Z | 481016 | 469.7 | 6443824 | 683924 | 0.20 |
| 58 | 12:36:35Z | 490432 | 478.9 | 6443824 | 686544 | 0.54 |
| 59 | 12:37:35Z | 490088 | 478.6 | 6443824 | 687256 | 0.23 |
| 60 | 12:38:36Z | 514996 | 502.9 | 6443824 | 687452 | 0.08 |
| 61 | 12:39:36Z | 503580 | 491.8 | 6443824 | 687476 | 0.06 |
| 62 | 12:40:36Z | 505080 | 493.2 | 6443824 | 690080 | 0.68 |
| 63 | 12:41:36Z | 512540 | 500.5 | 6443824 | 689536 | 0.56 |
| 64 | 12:42:36Z | 516820 | 504.7 | 6443824 | 700908 | 0.49 |
| 65 | 12:43:36Z | 509652 | 497.7 | 6443824 | 707460 | 0.57 |
| 66 | 12:44:36Z | 523072 | 510.8 | 6443824 | 699040 | 0.91 |
| 67 | 12:45:36Z | 666864 | 651.2 | 6281948 | 689024 | 1.17 |
| 68 | 12:46:36Z | 601460 | 587.4 | 6378732 | 676172 | 0.94 |
| 69 | 12:47:36Z | 537164 | 524.6 | 6443824 | 659028 | 0.50 |
| 70 | 12:48:36Z | 545296 | 532.5 | 6443824 | 654640 | 0.75 |
| 71 | 12:49:36Z | 517696 | 505.6 | 6443824 | 655372 | 0.95 |
| 72 | 12:50:36Z | 518380 | 506.2 | 6443824 | 655692 | 0.59 |
| 73 | 12:51:37Z | 507784 | 495.9 | 6443824 | 658440 | 0.84 |
| 74 | 12:52:37Z | 522828 | 510.6 | 6443824 | 660504 | 0.84 |
| 75 | 12:53:37Z | 573588 | 560.1 | 6443824 | 769496 | 0.78 |
| 76 | 12:54:37Z | 584300 | 570.6 | 6443824 | 773180 | 0.65 |
| 77 | 12:55:37Z | 535884 | 523.3 | 6443824 | 775416 | 0.31 |
| 78 | 12:56:37Z | 551212 | 538.3 | 6443824 | 774944 | 0.37 |
| 79 | 12:57:37Z | 545900 | 533.1 | 6443824 | 774988 | 0.28 |
| 80 | 12:58:37Z | 543752 | 531.0 | 6443824 | 775180 | 0.57 |
| 81 | 12:59:37Z | 535032 | 522.5 | 6443824 | 775320 | 0.73 |
| 82 | 13:00:37Z | 570860 | 557.5 | 6443824 | 780744 | 0.98 |
| 83 | 13:01:37Z | 784096 | 765.7 | 6247216 | 713268 | 1.26 |
| 84 | 13:02:37Z | 663368 | 647.8 | 6350256 | 704208 | 1.42 |
| 85 | 13:03:37Z | 601540 | 587.4 | 6442592 | 701008 | 0.81 |
| 86 | 13:04:38Z | 543224 | 530.5 | 6443824 | 697284 | 0.88 |
| 87 | 13:05:38Z | 565112 | 551.9 | 6443824 | 701372 | 0.77 |
| 88 | 13:06:38Z | 514260 | 502.2 | 6443824 | 700352 | 0.79 |
| 89 | 13:07:38Z | 514556 | 502.5 | 6443824 | 700108 | 0.43 |
| 90 | 13:08:38Z | 517196 | 505.1 | 6443824 | 700412 | 0.24 |
| 91 | 13:09:38Z | 522648 | 510.4 | 6443824 | 701344 | 0.27 |
| 92 | 13:10:38Z | 524552 | 512.3 | 6443824 | 702732 | 0.23 |
| 93 | 13:11:38Z | 516856 | 504.7 | 6443824 | 703764 | 0.38 |
| 94 | 13:12:38Z | 545464 | 532.7 | 6443824 | 702596 | 0.20 |
| 95 | 13:13:38Z | 543016 | 530.3 | 6443824 | 702960 | 0.26 |
| 96 | 13:14:38Z | 551496 | 538.6 | 6443824 | 702920 | 0.09 |
| 97 | 13:15:38Z | 547592 | 534.8 | 6443824 | 703336 | 0.29 |
| 98 | 13:16:38Z | 550792 | 537.9 | 6443824 | 703128 | 0.39 |
| 99 | 13:17:39Z | 568088 | 554.8 | 6443824 | 683048 | 0.84 |
| 100 | 13:18:39Z | 584044 | 570.4 | 6443824 | 671936 | 1.04 |
| 101 | 13:19:39Z | 566736 | 553.5 | 6443824 | 667904 | 0.50 |
| 102 | 13:20:39Z | 553096 | 540.1 | 6443824 | 670288 | 0.23 |
| 103 | 13:21:39Z | 554232 | 541.2 | 6443824 | 673340 | 0.22 |
| 104 | 13:22:39Z | 536728 | 524.1 | 6443824 | 674000 | 0.19 |
| 105 | 13:23:39Z | 552136 | 539.2 | 6443824 | 678392 | 0.20 |
| 106 | 13:24:39Z | 538780 | 526.2 | 6443824 | 681040 | 0.11 |
| 107 | 13:25:39Z | 491400 | 479.9 | 6443824 | 687400 | 0.30 |
| 108 | 13:26:39Z | 502948 | 491.2 | 6443824 | 688584 | 0.33 |
| 109 | 13:27:39Z | 519600 | 507.4 | 6443824 | 688596 | 0.31 |
| 110 | 13:28:39Z | 520640 | 508.4 | 6443824 | 688664 | 0.36 |
| 111 | 13:29:39Z | 527168 | 514.8 | 6443824 | 688716 | 0.34 |
