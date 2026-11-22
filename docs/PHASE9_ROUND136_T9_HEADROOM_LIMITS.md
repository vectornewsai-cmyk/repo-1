# LIMITS — Phase 9 đợt 136, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.281** (đo 2 lần: 2.286 lúc 05:41:01Z và **2.281** lúc 05:43:14Z 18/11, cùng boot 1ca1feaa btime 05:29:18Z) — **TIẾP TỤC GIẢM**: 2.395 (đợt 135) → **2.281 (−114, −4,8%)**. Chênh −5 giữa hai lần đo trong cùng boot (các đợt trước: −10, −11, −7, −1, −10/−2, 0, −7, −8), xem §1.2.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **481**; vẫn gấp ~1,45 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại các đợt 127–135).
- **RAM khả dụng đợt này: 1.406–6.081 MB theo sampler của T9** (05:40:43–05:46:09Z) — **đợt hồi RAM giữa lượt lần thứ tư liên tiếp** (đợt 133: 433–512 MB; đợt 134: 460–2.438 MB; đợt 135: 844–1.734 MB), **và mạnh nhất từ trước tới nay**: available vọt từ ~1,41 GB lên **~6,08 GB** lúc 05:44:35Z (biên độ ~4.675 MB), rồi lùi về 5.653 MB lúc 05:46:09Z. Đỉnh là chớp ngắn (~90 giây), xem F-136-T9-2.
- **Balloon virtio: XẢ MẠNH NHẤT TỪ TRƯỚC TỚI NAY** — 5.406.736 → 481.320 kB (ròng **−4.925.416 kB ≈ −4,70 GB trong ~3,7 phút**), rồi phình lại +524.288 kB lúc 05:46:09Z. Balloon lúc 05:44:35Z chỉ ~5,9% tổng RAM (đợt 135 lúc đóng: ~66,4%). Balloon do host điều khiển, ngoài tầm luồng này.
- **Guard birefnet: SUÝT ĐẠT — NHƯNG KHÔNG ĐẠT, KHÔNG CHẠY birefnet.** Max quan sát được đợt này 6.228.132 kB = **6.082 MiB = 98,99% guard 6.144 MiB** — thiếu **63.324 kB (~61,8 MiB, ~1,0%)**. Đây là lần gần guard nhất từ trước tới nay (đợt 134: 39,7%; đợt 135: 28,2%). **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói. Lưu ý nhạy cảm về định nghĩa guard, xem F-136-T9-7 — **T9 không tự diễn giải lại guard**, giao parent quyết.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào.** Journal từ lúc boot: 0 dòng "No space left"/ENOSPC.
- **Boot lúc mở đợt 136 = boot lúc T9 đo** (1ca1feaa, btime 05:29:18Z — brief ghi ~05:29:34Z, chênh 16 giây, xem F-136-T9-5) — không có reboot trong cửa sổ đo của T9. Replay trên boot mới **ĐÃ XONG TRONG CỬA SỔ ĐO** của T9 (dpkg.log 2 → 1.545 dòng, dòng cuối 05:45:44Z `status installed gstreamer1.0-tools`) — cùng hình dạng baseline 1.545/221 như các boot trước.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 136

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| 05:41:01Z | **2.286** | lần đo 1, boot ~11,7' tuổi; replay vẫn đang chạy (dpkg.log 2 dòng, apt-get update đang chạy) |
| 05:43:14Z | **2.281** | lần đo 2 (cuối lượt T9, chênh −5 so với lần 1); replay đang chạy giữa chừng (dpkg.log 402 dòng) |

- Probe dừng ở `i=2286` rồi `i=2281`, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh −5 trong cùng boot:** trong dải các đợt trước (−10, −11, −7, −1, −10/−2, 0, −7, −8). Giá trị cuối đợt lấy **2.281**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.281 = **61.466 watch** (tăng ~114 so với 61.352 đợt 135).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.281 / 1.578 ≈ **1,45 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + LIMITS T9 đợt 131 §1.3 + LIMITS T9 đợt 132 §1.3 + LIMITS T9 đợt 133 §1.3 + LIMITS T9 đợt 134 §1.3 + LIMITS T9 đợt 135 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **136** | **2.286 → 2.281** | **đo 05:41:01Z → 05:43:14Z, boot 1ca1feaa btime 05:29:18Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395 → 2.281**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.281 = **−2.157 (−48,6%)**. Bước giảm đợt này: −114 so với đợt 135 (−4,8%) — cùng bậc độ lớn với sáu bước giảm trước (−116, −117, −108, −106, −127, −110); bảy đợt gần nhất giảm 106–127/đợt.
- Trong một boot, headroom đợt này giảm −5 trong ~2 phút (các đợt trước: −10, −11, −7, −1, −10/−2, 0, −7, −8); bước giảm chủ yếu xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **481**. Con số giảm ~106–127/đợt chỉ là phép chia số học minh họa (481 / ~114 ≈ 4,2 đợt nếu đà giữ nguyên) — **KHÔNG phải dự báo** (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot; quyết parent đứng). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~61,5k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 136 (trực tiếp, theo sampler của T9)

| Thời điểm (UTC 18/11) | RAM khả dụng | Balloon | Nguồn |
|---|---|---|---|
| 05:40:43Z | 1.406 MB (MemAvailable 1.440.296 kB) | 5.406.736 kB | kiểm tra mở đầu T9 (trước probe 1) |
| 05:41:01Z | 1.425 MB (MemAvailable 1.459.220 kB) | 5.341.200 kB | ngay trước probe 1 |
| 05:41:01Z | 1.427 MB (MemAvailable 1.461.472 kB) | 5.341.200 kB | ngay sau probe 1 |
| 05:43:14Z | 3.503 MB (MemAvailable 3.587.044 kB) | 2.971.688 kB | mẫu RAM sau 120 giây |
| 05:43:15Z | 3.656 MB (MemAvailable 3.743.664 kB) | 2.775.080 kB | ngay sau probe 2 |
| 05:44:35Z | **6.081 MB (MemAvailable 6.228.132 kB)** | 481.320 kB | mẫu RAM đóng cửa sổ đo |
| 05:46:09Z | 5.653 MB (MemAvailable 5.789.680 kB) | 1.005.608 kB | mẫu RAM thêm (theo dõi guard) |

- **Dao động trong cửa sổ đo (~5,5 phút): 1.406 → 6.081 MB theo sampler của T9 (biên độ ~4.675 MB), XU HƯỚNG TĂNG MẠNH RỒI LÙI** — đợt hồi RAM giữa lượt lần thứ tư liên tiếp, **mạnh nhất từ trước tới nay** (đợt 133 biên độ ~79 MB; đợt 134 ~1.978 MB, đỉnh 2.438 MB; đợt 135 ~890 MB, đỉnh 1.734 MB). Đỉnh 6.081 MB lúc 05:44:35Z là chớp ngắn: ~94 giây sau đã lùi về 5.653 MB. **Min theo sampler của T9 là 1.406 MB; max theo sampler của T9 là 6.081 MB** (ghi rõ "theo sampler của mình" — bài học F-133-8: các sampler khác nhau cùng cửa sổ có thể cho min khác nhau).
- **Số mở đợt khớp lần đo trực tiếp đầu tiên của T9:** brief đợt 136 ghi RAM khả dụng lúc mở ~1.374 MB; lần đo trực tiếp đầu tiên của T9 (05:40:43Z, ~5 phút sau giờ mở 05:35Z) là 1.406 MB — chênh chỉ ~32 MB, khớp tốt hơn hẳn các đợt trước (đợt 133: brief ~547 MB vs T9 đo 433 MB; đợt 134: brief ~1.295 MB vs T9 đo 460 MB; đợt 135: brief ~1.177 MB vs T9 đo 1.004 MB). T9 chỉ ghi nhận cả hai số, không kết luận số nào "đúng" hơn.
- Swap đã dùng ~237–251 MB / 1.023 MB trong cửa sổ đo (SwapFree 805.548 → 791.532 kB) — trong dải các đợt trước (đợt 135: 318–409 MB; đợt 134: 279–387 MB); không phải mức báo động mới, chỉ ghi nhận.
- Top RSS lúc 05:41:01Z: `hatch` 298.996 kB (~292 MB) là tiến trình lớn nhất; các tiến trình còn lại đều < 15 MB (apt methods ~8–14 MB, apt-get 8.628 kB). Lúc 05:43:14Z có một tiến trình `python3` 364.996 kB — xem F-136-T9-6 (không quy cho T9, không phải workload của T9). **Không có tiến trình người dùng nào ngốn RAM một cách bền vững** — RAM thấp lúc đầu không phải do workload trong cell.
- Probe K8 gần như không ảnh hưởng RAM: available 1.459.220 → 1.461.472 kB qua probe 1 (+2.252 kB).

### 2.2 Balloon virtio — xả mạnh nhất từ trước tới nay

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo** của T9, giá trị **không đơn điệu trong cửa sổ đo**: 5.406.736 → 5.341.200 (−65.536 kB) → 2.971.688 (−2.369.512 kB) → 2.775.080 (−196.608 kB) → 481.320 (−2.293.760 kB) → 1.005.608 (+524.288 kB). Ròng **−4.925.416 kB (≈ −4,70 GB) trong ~3,7 phút** (05:40:43Z → 05:44:35Z); tính tới mẫu thêm 05:46:09Z ròng −4.401.128 kB (≈ −4,20 GB). Mức xả này gấp ~8 lần đợt 135 (−0,59 GB) và ~2,4 lần đợt 134 (−2,05 GB).
- Số học lúc 05:44:35Z: tổng RAM 8.124.900 kB − balloon 481.320 kB = 7.643.580 kB (~7,46 GB) còn lại cho hệ thống; trong đó buff/cache + available ~6.081 MB + free ~287 MB. **Balloon chiếm ~5,9% tổng RAM lúc 05:44:35Z** (đợt 135 lúc đóng: ~66,4%; đợt 134: ~52,7%; đợt 133: ~79,3%) — **thấp nhất từ trước tới nay**, rồi phình lại ~12,4% lúc 05:46:09Z.
- **Chỉ ghi nhận tương quan, không kết luận** balloon sẽ tiếp tục xả hay phình lại sau cửa sổ đo của T9; đợt hồi RAM này đi kèm balloon xả gần như toàn bộ trong lúc replay apt đang chạy (dpkg.log 2 → 1.545 dòng trong cùng cửa sổ). Các luồng cần RAM (lượt yên WebKit #13 của T4, harness của T8) đang ở trong cửa sổ RAM tốt nhất từ trước tới nay — T4/T8 đợt 136 là chủ quản xác nhận, T9 chỉ ghi nhận số.
- Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp (không có lệnh nào để xả balloon từ trong cell).

### 2.3 Cửa sổ RAM đợt này thuộc nguồn nào? (đối chiếu cơ chế chờ RAM, quyết parent đợt 132 §12.3(a))

- **Đây là đợt hồi RAM giữa lượt, KHÔNG phải cửa sổ vàng sau boot.** Căn cứ: (a) boot đã ~11–17 phút tuổi trong cửa sổ đo của T9 (btime 05:29:18Z; đo 05:40–05:46Z); (b) RAM lúc T9 bắt đầu đo còn kẹt thấp 1.406–1.425 MB — không phải mức cao ngay sau boot; (c) đợt hồi diễn ra sau đó (1.406 → 6.081 MB trong ~4 phút) đi kèm balloon xả −4,93 GB. Hình dạng giống đợt hồi RAM giữa lượt của đợt 133/134/135 — nhưng đợt này hồi mạnh hơn hẳn (~4,3× so với min, so với ~5,3× đợt 134 nhưng từ min cao hơn nhiều và đạt đỉnh tuyệt đối cao nhất).
- **Caveat:** thời điểm bắt đầu đợt hồi không xác định chính xác — mẫu tăng đầu tiên T9 quan sát được là 05:43:14Z (1.425 → 3.503 MB); đợt hồi có thể đã bắt đầu trước đó trong khoảng 05:41–05:43Z mà T9 không lấy mẫu. Phân loại "đợt hồi giữa lượt" dựa trên tuổi boot (~11–17 phút) + RAM kẹt thấp lúc bắt đầu đo — không dựa trên mốc bắt đầu chính xác. **Điểm khác đợt này:** replay trên boot mới CHƯA xong lúc T9 bắt đầu đo và hoàn thành trong cửa sổ đo (05:45:44Z) — đợt hồi RAM trùng với quá trình replay + balloon xả, không tách được nguyên nhân.
- **Cơ chế chờ RAM (quyết parent đợt 132 §12.3(a)):** đợt 133–135 đã chứng minh hoạt động với đợt hồi giữa lượt; đợt này đợt hồi mạnh nhất từ trước tới nay và suýt chạm guard — T4 đợt 136 là chủ quản xác nhận gate có mở được nhờ đợt hồi này không. T9 chỉ ghi nhận số.

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
| **136** | **~1.374 MB (brief; T9 đo trực tiếp 1.406 MB lúc 05:40:43Z)** | **1.406–6.081 MB theo sampler của T9, hồi giữa lượt mạnh nhất, rồi lùi về 5.653 MB** (cửa sổ đo của T9, ~5,5 phút) | — (không thuộc T9) |

- Mẫu chung thay đổi đợt này: 12 đợt trước mọi số đo đều xoay quanh ~0,4–2,5 GB, **chưa bao giờ chạm guard 6 GB**; đợt này max 6.081 MB lần đầu vượt 6.000 MB (số thập phân) và chỉ thiếu guard 6.144 MiB ~63 MB. Min 1.406 MB cao nhất kể từ đợt 128 — cửa sổ đo đợt này **ít cực đoan ở đầu thấp, cực đoan ở đầu cao**.

## 3. Guard birefnet — SUÝT ĐẠT (98,99%), KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **6.228.132 kB = 6.082 MiB = 98,99% guard** — thiếu **63.324 kB (~61,8 MiB, ~1,0%)**.
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- **Không có quan sát mới nào làm đổi quyết guard** (T9 không tự hạ guard — xem F-136-T9-7); nhưng đợt này là lần đầu tiên RAM quan sát được tiến sát guard tới ~1% — nếu đợt 137 quan sát được ≥ 6.144 MiB thì birefnet được thử theo đúng quyết đứng. Lưu ý số học (không phải đề nghị): lúc 05:44:35Z balloon chỉ còn 481.320 kB (~0,47 GB) nên không còn balloon để xả thêm — available lúc đó đã là mức gần như tối đa của boot này; việc vượt guard (nếu có) ở đợt sau sẽ phụ thuộc host phình/xả balloon và workload, không phải T9.
- Không chạy TTS 39 (cấm kiểm lại — không đụng tới).

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 05:40–05:46Z; chỉ có tiến trình replay apt/dpkg của host và các tiến trình hệ thống) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.281 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2286 và i=2281) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 05:29:18Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về "-- No entries --").
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 136 = boot lúc T9 đo:** btime **05:29:18Z** 18/11 (`uptime -s` + `btime 1794979758` trong `/proc/stat` + boot_id `1ca1feaa-af3b-41dc-aaae-34376329b0a3`). Không có reboot trong cửa sổ đo của T9 (05:40–05:46Z). Boot trước (đợt 135, btime 02:27:27Z sau reboot giữa lượt) sống ~3h01m51s tới boot này — **số boot mới chờ T6 đợt 136 chốt** (như thông lệ mọi đợt).
- **Replay trên boot mới: ĐÃ XONG TRONG CỬA SỔ ĐO của T9.** dpkg.log đi từ **2 dòng** (05:40:43Z, chỉ có 2 dòng `startup packages configure` 05:35:43Z) lên **402 dòng** (05:43:14Z) → **432 dòng** (05:43:15Z) → **1.149 dòng** (05:44:35Z) → **1.545 dòng** (05:46:09Z, dòng cuối 05:45:44Z `status installed gstreamer1.0-tools`); sau đó không còn apt/dpkg nào đang chạy. Cùng hình dạng baseline các boot trước (1.545 dòng / 221 installs). **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-136-T9-1 — RAM lúc mở đợt:** brief ghi ~1.374 MB lúc mở (05:35Z); T9 đo trực tiếp 1.406 MB lúc 05:40:43Z. Chênh chỉ ~32 MB, khớp tốt hơn hẳn các đợt trước — ghi cả hai số. Không đổi verdict (cả hai số đều < guard).
- **F-136-T9-2 — Đỉnh RAM 6.081 MB là chớp ngắn:** mẫu 05:44:35Z ghi 6.081 MB nhưng mẫu ~94 giây sau (05:46:09Z) chỉ còn 5.653 MB, balloon phình lại +524.288 kB. Max "theo sampler của T9" là 6.081 MB nhưng không phải mức ổn định — các luồng khác không nên lấy 6.081 MB làm mức RAM sẵn có bền vững. Ghi rõ để tránh hiểu lầm.
- **F-136-T9-3 — Thời điểm bắt đầu đợt hồi RAM không xác định chính xác:** mẫu tăng đầu tiên quan sát được 05:43:14Z (1.425 → 3.503 MB); đợt hồi có thể đã bắt đầu trong khoảng 05:41–05:43Z mà T9 không lấy mẫu. Phân loại "đợt hồi giữa lượt" dựa trên tuổi boot (~11–17 phút) + RAM kẹt thấp lúc bắt đầu đo — không dựa trên mốc bắt đầu chính xác. Thêm caveat đợt này: replay hoàn thành trong cửa sổ đo nên không tách được nguyên nhân đợt hồi (balloon xả / replay / cả hai).
- **F-136-T9-4 — Balloon xả không đơn điệu:** balloon xả −4.925.416 kB (05:40:43Z → 05:44:35Z) rồi phình lại +524.288 kB (→ 05:46:09Z). Ròng phụ thuộc điểm cuối cửa sổ đo (−4,70 GB tới 05:44:35Z, −4,20 GB tới 05:46:09Z); không kết luận balloon sẽ tiếp tục xả hay phình lại sau cửa sổ đo.
- **F-136-T9-5 — Chênh btime boot:** brief đợt 136 ghi boot mới 1ca1feaa, btime ~05:29:34Z; `/proc/stat` ghi btime 1794979758 = **05:29:18Z** (chênh 16 giây), `uptime -s` cũng ghi 05:29:18Z. T9 dùng 05:29:18Z (số đọc trực tiếp từ máy). Chênh nhỏ, không đổi verdict.
- **F-136-T9-6 — Tiến trình python3 364.996 kB RSS lúc 05:43:14Z:** xuất hiện trong top RSS của mẫu RAM sau 120 giây, trước khi probe 2 của T9 chạy — T9 không quy cho luồng mình và không xác định được chủ (có thể là harness của luồng khác đang chạy song song). Chỉ ghi nhận, không kết luận về workload.
- **F-136-T9-7 — Nhạy cảm về định nghĩa guard (QUAN TRỌNG, giao parent):** max quan sát được 6.228.132 kB. Theo guard đứng **6.144 MiB (= 6.291.456 kB)** thì thiếu 63.324 kB — KHÔNG ĐẠT. Nhưng nếu guard được hiểu theo GB thập phân (6.000.000 kB) thì 6.228.132 kB đã VƯỢT. T9 giữ nguyên cách hiểu các đợt trước (6.144 MiB, như LIMITS đợt 135 §3 ghi "guard 6.144 MB") và KHÔNG chạy birefnet, KHÔNG tự diễn giải lại guard. **Giao parent quyết:** giữ nguyên 6.144 MiB hay chốt lại định nghĩa — và nếu đợt 137 quan sát được ≥ 6.144 MiB thì birefnet được thử theo quyết đứng.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 137 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 481 trên ngưỡng báo < ~1.800; tốc độ giảm bảy đợt gần nhất ~106–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~4 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo).
2. **Guard birefnet giữ nguyên cho tới khi parent quyết F-136-T9-7** — chỉ thử lại khi quan sát được available ≥ 6.144 MiB (cách hiểu đứng); u2net là fallback chính thức. Đợt 136 suýt đạt (98,99%) — đợt 137 cần sampler canh guard sát hơn, và nếu quan sát được ≥ 6.144 MiB thì thử birefnet theo quyết đứng.
3. **Balloon virtio theo dõi** — đợt này balloon xả −4,70 GB (mạnh nhất từ trước tới nay), xuống ~5,9% tổng RAM; nếu balloon giữ mức thấp, harness/suite đợt sau có thể bớt phải chờ RAM — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
4. **Boot mới 1ca1feaa + replay đã xong (1.545 dòng)** — giao T5 đợt 136 đối chiếu sau khi xong pha 2; số boot mới chờ T6 chốt.
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 135 §11: giữ fix T3 530e10a7 + lượt yên #13 (T3/T4), mù #55 + mù #54 đã đóng, điều tra chung ba lần kẹt (T8), G1 chờ user quyết, birefnet chỉ thử lại khi quan sát được available ≥ 6 GB, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND136_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round136-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round136-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot + journal + dpkg), `headroom-measure-2.log` (đo lần 2 + RAM + dpkg + journal), `ram-snapshot-1.log` (mẫu RAM sau 120 s), `ram-snapshot-2.log` (mẫu RAM đóng cửa sổ), `ram-snapshot-3.log` (mẫu RAM thêm theo dõi guard) — không nằm trong repo nên không stage.
- Cờ `round136-t9.done` đã tạo khi xong.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.
