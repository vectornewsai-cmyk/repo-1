# LIMITS — Phase 9 đợt 137, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.175** (đo 2 lần: 2.179 lúc 08:41:12Z và **2.175** lúc 08:43:35Z 18/11, cùng boot 2104246b btime 08:07:11Z) — **TIẾP TỤC GIẢM**: 2.281 (đợt 136) → **2.175 (−106, −4,6%)**. Chênh −4 giữa hai lần đo trong cùng boot (các đợt trước: −5, −10, −11, −7, −1, −10/−2, 0, −7, −8), xem §1.2.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **375**; vẫn gấp ~1,38 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại đợt 136 §12.3(k)).
- **RAM khả dụng đợt này: 806–2.174 MB theo sampler của T9** (08:40:27–08:48:08Z) — **đợt hồi RAM giữa lượt lần thứ năm liên tiếp** (đợt 133: 433–512 MB; đợt 134: 460–2.438 MB; đợt 135: 844–1.734 MB; đợt 136: 1.406–6.081 MB), **nhưng YẾU HƠN HẲN đợt 136**: available vọt từ ~806 MB lên đỉnh **~2.174 MB** lúc 08:45:53Z rồi lùi về 1.675 MB lúc 08:48:08Z (biên độ ~1.368 MB). Đỉnh chỉ bằng ~35,7% đỉnh đợt 136 — xem F-137-T9-2.
- **Balloon virtio: XẢ RỒI PHÌNH LẠI TRONG CỬA SỔ ĐO** — 6.066.272 → 4.673.452 kB (−1.392.820 kB ≈ −1,33 GB) rồi phình lại +447.524 kB lên 5.120.976 kB lúc 08:48:08Z. Ròng **−945.296 kB (≈ −0,90 GB)** trong ~7 phút. Balloon lúc đỉnh RAM chỉ ~57,5% tổng RAM (đợt 136 lúc đóng: ~5,9%) — **không còn gần xả hết như đợt 136**. Balloon do host điều khiển, ngoài tầm luồng này.
- **Guard birefnet: KHÔNG ĐẠT, KHÔNG CHẠY birefnet.** Max quan sát được đợt này 2.173.756 kB = **2.123 MiB = 34,6% guard 6.144 MiB** — thiếu **4.117.700 kB (~3,93 GiB)**. Guard giữ nguyên 6.144 MiB theo quyết parent đợt 136 §12.3(f) — KHÔNG chốt lại theo GB thập phân. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói. Đợt 136 suýt đạt 98,99%; đợt này lùi xa — xem §3.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào.** Journal từ lúc boot: 0 dòng "No space left"/ENOSPC.
- **Boot lúc mở đợt 137 = boot lúc T9 đo** (2104246b, btime 08:07:11Z — khớp brief) — không có reboot trong cửa sổ đo của T9. Replay trên boot mới **CHƯA XONG TRONG CỬA SỔ ĐO** của T9 (dpkg.log 2 → 133 dòng lúc 08:48:08Z, vẫn đang chạy; baseline các boot trước 1.545 dòng) — khác đợt 136 (xong trong cửa sổ đo), xem F-137-T9-3. T5 là chủ quản replay — T9 chỉ ghi nhận.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 137

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| 08:41:12Z | **2.179** | lần đo 1, boot ~34' tuổi; replay mới bắt đầu (dpkg.log 2 dòng, apt-get update đang chạy) |
| 08:43:35Z | **2.175** | lần đo 2 (cuối lượt T9, chênh −4 so với lần 1); replay đang chạy giữa chừng (dpkg.log 40 dòng) |

- Probe dừng ở `i=2179` rồi `i=2175`, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh −4 trong cùng boot:** trong dải các đợt trước (−5, −10, −11, −7, −1, −10/−2, 0, −7, −8). Giá trị cuối đợt lấy **2.175**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.175 = **61.572 watch** (tăng ~106 so với 61.466 đợt 136).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.175 / 1.578 ≈ **1,38 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + LIMITS T9 đợt 131 §1.3 + LIMITS T9 đợt 132 §1.3 + LIMITS T9 đợt 133 §1.3 + LIMITS T9 đợt 134 §1.3 + LIMITS T9 đợt 135 §1.3 + LIMITS T9 đợt 136 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **137** | **2.179 → 2.175** | **đo 08:41:12Z → 08:43:35Z, boot 2104246b btime 08:07:11Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281 → 2.175**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.175 = **−2.263 (−51,0%)** — lần đầu chuỗi giảm quá một nửa so với đỉnh. Bước giảm đợt này: −106 so với đợt 136 (−4,6%) — cùng bậc độ lớn với bảy bước giảm trước (−114, −110, −127, −106, −108, −117, −116); **tám đợt gần nhất giảm 106–127/đợt**.
- Trong một boot, headroom đợt này giảm −4 trong ~2 phút (các đợt trước: −5, −10, −11, −7, −1, −10/−2, 0, −7, −8); bước giảm chủ yếu xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **375**. Con số giảm ~106–127/đợt chỉ là phép chia số học minh họa (375 / ~114 ≈ 3,3 đợt nếu đà giữ nguyên) — **KHÔNG phải dự báo** (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot; quyết parent đứng). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~61,6k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 137 (trực tiếp, theo sampler của T9)

| Thời điểm (UTC 18/11) | RAM khả dụng | Balloon | Nguồn |
|---|---|---|---|
| 08:40:27Z | 861 MB (MemAvailable 880.784 kB) | 5.987.940 kB | kiểm tra mở đầu T9 (trước probe 1) |
| 08:41:12Z | 787 MB (MemAvailable 805.576 kB) | 6.066.272 kB | ngay trước probe 1 |
| 08:41:12Z | 837 MB (MemAvailable 857.096 kB) | 6.066.272 kB | ngay sau probe 1 |
| 08:43:23Z | 2.087 MB (MemAvailable 2.136.764 kB) | 4.687.016 kB | mẫu RAM sau 120 giây |
| 08:43:35Z | 1.943 MB (MemAvailable 1.988.912 kB) | 4.766.776 kB | ngay trước probe 2 |
| 08:43:35Z | 1.925 MB (MemAvailable 1.971.212 kB) | 4.766.776 kB | ngay sau probe 2 |
| 08:45:53Z | **2.123 MB (MemAvailable 2.173.756 kB)** | 4.673.452 kB | mẫu RAM sau ~2,3 phút nữa |
| 08:48:08Z | 1.635 MB (MemAvailable 1.674.776 kB) | 5.120.976 kB | mẫu RAM thêm (theo dõi guard) |

- **Dao động trong cửa sổ đo (~7,7 phút): 787 → 2.123 MB theo sampler của T9 (biên độ ~1.336 MB), XU HƯỚNG HỒI RỒI LÙI** — đợt hồi RAM giữa lượt lần thứ năm liên tiếp, **nhưng yếu hơn hẳn đợt 136** (đợt 133 biên độ ~79 MB; đợt 134 ~1.978 MB, đỉnh 2.438 MB; đợt 135 ~890 MB, đỉnh 1.734 MB; đợt 136 ~4.675 MB, đỉnh 6.081 MB). Đỉnh 2.123 MB lúc 08:45:53Z chỉ bằng ~35% đỉnh đợt 136 và chỉ ~34,6% guard. Đỉnh là chớp ngắn: ~135 giây sau đã lùi về 1.635 MB, balloon phình lại +447.524 kB. **Min theo sampler của T9 là 787 MB; max theo sampler của T9 là 2.123 MB** (ghi rõ "theo sampler của mình" — bài học F-133-8: các sampler khác nhau cùng cửa sổ có thể cho min khác nhau).
- **Số RAM lúc mở đợt:** brief đợt 137 không ghi số RAM lúc mở (chỉ ghi boot mới btime 08:07:11Z) — xem F-137-T9-1. Lần đo trực tiếp đầu tiên của T9 (08:40:27Z, ~33 phút sau boot) là 861 MB; ~45 giây sau còn 787 MB. Cả hai số đều < guard.
- Swap đã dùng ~314–368 MB / 1.023 MB trong cửa sổ đo (SwapFree 727.544 → 671.480 kB) — trong dải các đợt trước (đợt 136: 237–251 MB; đợt 135: 318–409 MB; đợt 134: 279–387 MB); không phải mức báo động mới, chỉ ghi nhận.
- Top RSS lúc 08:43:23Z: `hatch` 366.608 kB (~358 MB) là tiến trình lớn nhất; các tiến trình còn lại đều < 90 MB (apt-get ~87 MB, apt methods ~10 MB). Lúc 08:45:53Z `hatch` 370.688 kB. **Không có tiến trình người dùng nào ngốn RAM một cách bền vững** — RAM thấp lúc đầu không phải do workload trong cell.
- Probe K8 gần như không ảnh hưởng RAM: available 805.576 → 857.096 kB qua probe 1 (+51.520 kB); 1.988.912 → 1.971.212 kB qua probe 2 (−17.700 kB) — cả hai đều trong nhiễu đo của balloon/replay, không phải tác động của probe.

### 2.2 Balloon virtio — xả rồi phình lại trong cửa sổ đo

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo** của T9, giá trị **không đơn điệu trong cửa sổ đo**: 5.987.940 → 6.066.272 (+78.332 kB) → 4.687.016 (−1.379.256 kB) → 4.766.776 (+79.760 kB) → 4.673.452 (−93.324 kB) → 5.120.976 (+447.524 kB). Ròng **−945.296 kB (≈ −0,90 GB) trong ~7,7 phút** (08:40:27Z → 08:48:08Z); tính tới mẫu đỉnh RAM 08:45:53Z ròng −1.314.488 kB (≈ −1,25 GB). Mức xả ròng này chỉ bằng ~19% đợt 136 (−4,70 GB) và ~44% đợt 134 (−2,05 GB).
- Số học lúc 08:45:53Z: tổng RAM 8.124.900 kB − balloon 4.673.452 kB = 3.451.448 kB (~3,37 GB) còn lại cho hệ thống; trong đó buff/cache + available ~2.123 MB + free ~1.016 MB. **Balloon chiếm ~57,5% tổng RAM lúc 08:45:53Z** (đợt 136 lúc đóng: ~5,9%; đợt 135 lúc đóng: ~66,4%; đợt 134: ~52,7%; đợt 133: ~79,3%) — **không còn gần xả hết như đợt 136**, rồi phình lại ~63,0% lúc 08:48:08Z.
- **Chỉ ghi nhận tương quan, không kết luận** balloon sẽ tiếp tục xả hay phình lại sau cửa sổ đo của T9; đợt hồi RAM này đi kèm balloon xả −1,39 GB trong lúc replay apt đang chạy (dpkg.log 2 → 133 dòng trong cùng cửa sổ, chưa xong) — không tách được nguyên nhân.
- Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp (không có lệnh nào để xả balloon từ trong cell).

### 2.3 Cửa sổ RAM đợt này thuộc nguồn nào? (đối chiếu cơ chế chờ RAM, quyết parent đợt 132 §12.3(a))

- **Đây là đợt hồi RAM giữa lượt, KHÔNG phải cửa sổ vàng sau boot.** Căn cứ: (a) boot đã ~33–41 phút tuổi trong cửa sổ đo của T9 (btime 08:07:11Z; đo 08:40–08:48Z); (b) RAM lúc T9 bắt đầu đo còn kẹt thấp 787–861 MB — không phải mức cao ngay sau boot; (c) đợt hồi diễn ra sau đó (787 → 2.123 MB trong ~5 phút) đi kèm balloon xả −1,39 GB. Hình dạng giống đợt hồi RAM giữa lượt của đợt 133/134/135/136 — nhưng đợt này hồi yếu hơn hẳn đợt 136.
- **Caveat:** thời điểm bắt đầu đợt hồi không xác định chính xác — mẫu tăng đầu tiên T9 quan sát được là 08:43:23Z (837 → 2.087 MB); đợt hồi có thể đã bắt đầu trước đó trong khoảng 08:41–08:43Z mà T9 không lấy mẫu. Phân loại "đợt hồi giữa lượt" dựa trên tuổi boot (~33–41 phút) + RAM kẹt thấp lúc bắt đầu đo — không dựa trên mốc bắt đầu chính xác. Thêm caveat đợt này: replay chưa xong lúc T9 đóng cửa sổ đo nên không tách được nguyên nhân đợt hồi (balloon xả / replay / cả hai).
- **Cơ chế chờ RAM (quyết parent đợt 132 §12.3(a)):** đợt 133–136 đã chứng minh hoạt động với đợt hồi giữa lượt; đợt này đợt hồi yếu (đỉnh chỉ 2.123 MB, ~34,6% guard) — T4 đợt 137 (lượt yên #14, lượt quyết định) là chủ quản xác nhận gate có mở được nhờ đợt hồi này không. T9 chỉ ghi nhận số. Xem thêm F-137-T9-5 về median tickCost của T4 (chưa có lúc T9 đóng).

### 2.4 Chuỗi RAM qua các đợt (số T5 ghi trong §4.2 mỗi đợt + số T9)

| Đợt | Lúc mở | Dao động trong lượt | Cuối lượt |
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
| **137** | **— (brief không ghi; T9 đo trực tiếp 861 MB lúc 08:40:27Z, 787 MB lúc 08:41:12Z)** | **787–2.123 MB theo sampler của T9, hồi giữa lượt rồi lùi về 1.635 MB** (cửa sổ đo của T9, ~7,7 phút) | — (không thuộc T9) |

- Mẫu chung thay đổi đợt này: sau đợt 136 lần đầu chạm ~99% guard, đợt 137 **lùi xa về ~35% guard** — đợt hồi giữa lượt không ổn định theo đợt: đỉnh các đợt hồi 133→137 là 512 MB, 2.438 MB, 1.734 MB, 6.081 MB, 2.123 MB. **Không có đợt nào đảm bảo đợt hồi sau sẽ mạnh**; các luồng cần RAM (T4 lượt yên #14, harness T8) không nên trông chờ đỉnh RAM đợt 136 lặp lại.

## 3. Guard birefnet — KHÔNG ĐẠT (34,6%), KHÔNG CHẠY

- Guard đứng (quyết parent đợt 136 §12.3(f), giữ nguyên 6.144 MiB — KHÔNG chốt lại theo GB thập phân): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6.144 MiB**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **2.173.756 kB = 2.123 MiB = 34,6% guard** — thiếu **4.117.700 kB (~3,93 GiB, ~65,4%)**.
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- **Không có quan sát mới nào làm đổi quyết guard.** Đợt 136 suýt đạt (98,99%) là ngoại lệ — đợt này max chỉ 34,6% guard, cho thấy đỉnh đợt 136 không phải mức nền mới. Nếu đợt sau quan sát được ≥ 6.144 MiB thì birefnet được thử theo đúng quyết đứng.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 08:40–08:48Z; chỉ có tiến trình replay apt/dpkg của host và các tiến trình hệ thống) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.175 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2179 và i=2175) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 08:07:11Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về "-- No entries --").
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 137 = boot lúc T9 đo:** btime **08:07:11Z** 18/11 (`uptime -s` + `btime 1794989231` trong `/proc/stat` + boot_id `2104246b-04b2-4252-a642-b1a7cadeefe1`). Không có reboot trong cửa sổ đo của T9 (08:40–08:48Z). Boot trước (đợt 136, btime 05:29:18Z) sống ~2h37m53s tới boot này — **số boot mới chờ T6 đợt 137 chốt** (như thông lệ mọi đợt).
- **Replay trên boot mới: CHƯA XONG TRONG CỬA SỔ ĐO của T9.** dpkg.log đi từ **2 dòng** (08:40:27Z, chỉ có 2 dòng `startup packages configure` 08:31:35–36Z) lên **40 dòng** (08:43:23Z) → **73 dòng** (08:45:53Z) → **133 dòng** (08:48:08Z, dòng cuối 08:45:59Z `status installed glib-networking`); apt-get vẫn đang chạy lúc T9 đóng (đang cài `gstreamer1.0-gl`). Khác đợt 136 (replay xong trong cửa sổ đo, 1.545 dòng / 221 installs) — **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-137-T9-1 — RAM lúc mở đợt không có trong brief:** brief đợt 137 chỉ ghi boot mới btime 08:07:11Z, không ghi số RAM khả dụng lúc mở (khác các đợt trước có số brief ~1.374 MB đợt 136, ~1.177 MB đợt 135). T9 chỉ có số đo trực tiếp của mình: 861 MB lúc 08:40:27Z và 787 MB lúc 08:41:12Z. Không đổi verdict (cả hai số đều < guard).
- **F-137-T9-2 — Đỉnh RAM 2.123 MB là chớp ngắn và yếu hơn hẳn đợt 136:** mẫu 08:45:53Z ghi 2.123 MB nhưng mẫu ~135 giây sau (08:48:08Z) chỉ còn 1.635 MB, balloon phình lại +447.524 kB. Max "theo sampler của T9" là 2.123 MB nhưng không phải mức ổn định — các luồng khác không nên lấy 2.123 MB làm mức RAM sẵn có bền vững. So với đỉnh đợt 136 (6.081 MB), đợt hồi này chỉ đạt ~35% — đợt hồi giữa lượt không ổn định theo đợt (xem §2.4).
- **F-137-T9-3 — Replay chưa xong trong cửa sổ đo:** dpkg.log mới 133 dòng lúc T9 đóng (baseline các boot trước 1.545 dòng), apt vẫn đang chạy. T9 không biết replay xong lúc nào sau cửa sổ đo — T5 đợt 137 là chủ quản xác nhận. Việc replay chưa xong cũng là caveat cho phân loại đợt hồi RAM (§2.3): không tách được nguyên nhân (balloon xả / replay / cả hai).
- **F-137-T9-4 — Khoảng trống lấy mẫu RAM:** T9 không lấy mẫu trong khoảng 08:43:35Z (sau probe 2) → 08:45:53Z (~2,3 phút); đỉnh RAM trong khoảng trống này (nếu có) không được quan sát. Tuy nhiên xu hướng các mẫu quanh khoảng trống (1.971 → 2.174 MB) và balloon vẫn ~4,67–4,77 GB trong khoảng đó khiến khả năng vọt lên ≥ 6.144 MiB trong ~2 phút là không đáng kể — guard không bị chạm lén. Ghi rõ để tránh hiểu lầm.
- **F-137-T9-5 — Median tickCost của T4 (lượt yên #14) chưa có lúc T9 đóng:** brief dặn nếu T4 báo median ≥55 ms thì ghi nhận vào headroom context. Lúc T9 đóng cửa sổ đo (08:48:08Z), file LIMITS của T4 đợt 137 chưa xuất hiện trên đĩa nên T9 không có số median để ghi nhận — **T10 đợt 137 đối chiếu chéo khi gộp** (quyết parent đợt 136 §12.3(c): ngưỡng ≤60 ms GIỮ NGUYÊN; nếu median #14 vẫn ≥55 ms thì parent bàn lại). T9 không tự suy đoán median từ số RAM/headroom của mình.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 138 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 375 trên ngưỡng báo < ~1.800; tốc độ giảm tám đợt gần nhất ~106–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~3,3 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo).
2. **Guard birefnet giữ nguyên 6.144 MiB** (quyết parent đợt 136 §12.3(f)) — chỉ thử lại khi quan sát được available ≥ 6.144 MiB; u2net là fallback chính thức. Đợt 137 max chỉ 34,6% guard — đỉnh đợt 136 (98,99%) không phải mức nền mới; đợt hồi RAM giữa lượt không ổn định theo đợt.
3. **Balloon virtio theo dõi** — đợt này balloon xả ròng chỉ −0,90 GB (đợt 136: −4,70 GB) rồi phình lại trong cửa sổ đo; nếu balloon giữ mức cao (~57–63% tổng RAM), harness/suite đợt sau vẫn phải chờ RAM — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
4. **Boot mới 2104246b + replay CHƯA xong trong cửa sổ đo của T9 (133 dòng)** — giao T5 đợt 137 đối chiếu sau khi xong pha 2; số boot mới chờ T6 chốt.
5. **Median tickCost lượt yên #14 (T4) chưa có lúc T9 đóng** — giao T10 đợt 137 đối chiếu chéo khi gộp (quyết parent đợt 136 §12.3(c)).
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 136 §11: giữ fix T3 530e10a7 + lượt yên #14 là lượt quyết định (T3/T4), mù #55 + mù #56, điều tra chung ba lần kẹt 4 bước (T8), G1 chờ user quyết, birefnet chỉ thử lại khi quan sát được available ≥ 6.144 MiB, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND137_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round137-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round137-t9/headroom-measure-1.log` (đo lần 1 + RAM + dpkg), `headroom-measure-2.log` (đo lần 2 + RAM + dpkg), `ram-snapshot-1.log` (mẫu RAM sau 120 s), `ram-snapshot-2.log` (mẫu RAM sau ~2,3 phút + journal + vite check), `ram-snapshot-3.log` (mẫu RAM thêm theo dõi guard) — không nằm trong repo nên không stage.
- Cờ `round137-t9.done` đã tạo khi xong.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.
