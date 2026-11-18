# LIMITS — Phase 9 đợt 135, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.395** (đo 2 lần: 2.403 lúc 02:40:57Z và **2.395** lúc 02:43:11Z 18/11, cùng boot 78b55838 btime 02:27:27Z) — **TIẾP TỤC GIẢM**: 2.505 (đợt 134) → **2.395 (−110, −4,4%)**. Chênh −8 giữa hai lần đo trong cùng boot (các đợt trước: −10, −11, −7, −1, −10/−2, 0, −7), xem §1.2.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **595**; vẫn gấp ~1,52 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại các đợt 127–134).
- **RAM khả dụng đợt này: 844–1.734 MB theo sampler của T9** (02:40:37–02:44:17Z) — **đợt hồi RAM giữa lượt lần thứ ba liên tiếp** (đợt 133: 479 → 1.549 MB; đợt 134: 460 → 2.438 MB): available rơi xuống 844 MB lúc 02:41:04Z rồi vọt lên 1.734 MB lúc 02:43:04Z, sau đó lùi về 1.462 MB lúc đóng cửa sổ đo. Tất cả đều **< 6 GB guard** (6.144 MB).
- **Balloon virtio: XẢ RÕ nhưng NHẸ HƠN đợt 134** — 6.016.276 → 5.396.928 kB (ròng −619.348 kB ≈ −0,59 GB trong ~3,5 phút), không đơn điệu (+33.980 kB rồi −837.720 kB rồi +184.392 kB). Balloon lúc đóng cửa sổ ~5,29 GB, ~66,4% tổng RAM (đợt 134 lúc đóng: ~52,7%; đợt 133: ~79,3%). Balloon do host điều khiển, ngoài tầm luồng này.
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 1.734 MB chỉ bằng ~28,2% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào.** Journal từ lúc boot: 0 dòng "No space left"/ENOSPC.
- **Boot lúc mở đợt 135 = boot lúc T9 đo** (78b55838, btime 02:27:27Z) — không có reboot trong cửa sổ đo của T9. Replay trên boot mới **ĐÃ XONG** lúc T9 kiểm (dpkg.log đứng ở 1.545 dòng, không có apt/dpkg nào đang chạy; dòng cuối 02:37:47Z) — cùng hình dạng baseline 1.545/221 như các boot trước.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 135

| Thời điểm (UTC 18/11) | Headroom | Bối cảnh |
|---|---|---|
| 02:40:57Z | **2.403** | lần đo 1, boot ~13,5' tuổi |
| 02:43:11Z | **2.395** | lần đo 2 (cuối lượt T9, chênh −8 so với lần 1) |

- Probe dừng ở `i=2403` rồi `i=2395`, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh −8 trong cùng boot:** trong dải các đợt trước (−10, −11, −7, −1, −10/−2, 0, −7). Trong ~2 phút giữa hai lần đo, balloon đang xả và RAM dao động mạnh (xem §2) — cửa sổ đo không yên tĩnh như đợt 133 (balloon đứng yên, chênh 0), nên chênh −8 là hợp lý. Giá trị cuối đợt lấy **2.395**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.395 = **61.352 watch** (tăng ~110 so với 61.242 đợt 134).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.395 / 1.578 ≈ **1,52 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + LIMITS T9 đợt 131 §1.3 + LIMITS T9 đợt 132 §1.3 + LIMITS T9 đợt 133 §1.3 + LIMITS T9 đợt 134 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **135** | **2.403 → 2.395** | **đo 02:40:57Z → 02:43:11Z, boot 78b55838 btime 02:27:27Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505 → 2.395**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.395 = **−2.043 (−46,0%)**. Bước giảm đợt này: −110 so với đợt 134 (−4,4%) — cùng bậc độ lớn với năm bước giảm trước (−116, −117, −108, −106, −127); sáu đợt gần nhất giảm 106–127/đợt.
- Trong một boot, headroom đợt này giảm −8 trong ~2 phút (các đợt trước: −10, −11, −7, −1, −10/−2, 0, −7); bước giảm chủ yếu xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **595**. Con số giảm ~106–127/đợt chỉ là phép chia số học minh họa (595 / ~112 ≈ 5,3 đợt nếu đà giữ nguyên) — **KHÔNG phải dự báo** (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot; quyết parent đứng). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~61,4k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 135 (trực tiếp, theo sampler của T9)

| Thời điểm (UTC 18/11) | RAM khả dụng | Balloon | Nguồn |
|---|---|---|---|
| 02:40:37Z | 1.004 MB (MemAvailable 1.004.336 kB) | 6.016.276 kB | `free` / `/proc/meminfo`, T9 đo, trước probe 1 |
| 02:40:57Z | 888 MB (MemAvailable 887.744 kB) | 6.016.276 kB | ngay trước probe 1 |
| 02:40:57Z | 889 MB (MemAvailable 889.448 kB) | 6.016.276 kB | ngay sau probe 1 |
| 02:41:04Z | 844 MB (MemAvailable 843.892 kB) | 6.050.256 kB | kèm top RSS |
| 02:43:04Z | 1.734 MB (MemAvailable 1.733.612 kB) | 5.212.536 kB | mẫu RAM sau 120 giây |
| 02:43:11Z | 1.695 MB (MemAvailable 1.694.664 kB) | 5.212.536 kB | ngay trước probe 2 |
| 02:43:11Z | 1.697 MB (MemAvailable 1.697.132 kB) | 5.212.536 kB | ngay sau probe 2 |
| 02:44:17Z | 1.462 MB (MemAvailable 1.461.892 kB) | 5.396.928 kB | mẫu RAM đóng cửa sổ đo |

- **Dao động trong cửa sổ đo (~3,5 phút): 844 → 1.734 MB theo sampler của T9 (biên độ ~890 MB), XU HƯỚNG TĂNG RỒI LÙI** — đợt hồi RAM giữa lượt lần thứ ba liên tiếp, nhưng yếu hơn đợt 134 (biên độ đợt 134 ~1.978 MB, đỉnh 2.438 MB) và mạnh hơn đợt 133 (433–512 MB, biên độ ~79 MB). Đỉnh 1.734 MB lúc 02:43:04Z là chớp ngắn: ~73 giây sau đã lùi về 1.462 MB. **Min theo sampler của T9 là 844 MB; max theo sampler của T9 là 1.734 MB** (ghi rõ "theo sampler của mình" — bài học F-133-8: các sampler khác nhau cùng cửa sổ có thể cho min khác nhau).
- **Số mở đợt cao hơn lần đo trực tiếp đầu tiên của T9:** brief đợt 135 ghi RAM khả dụng lúc mở ~1.177 MB; lần đo trực tiếp đầu tiên của T9 (02:40:37Z, ~4 phút sau giờ mở 02:36Z) là 1.004 MB — thấp hơn ~173 MB, rồi tiếp tục rơi xuống 844 MB lúc 02:41:04Z trước khi hồi. Chênh này có thể do RAM đã rơi giữa lúc mở đợt và lúc T9 đo rồi mới hồi lại, hoặc do dao động giữa các thời điểm đo; T9 chỉ ghi nhận cả hai số, không kết luận số nào "đúng" hơn. Tương tự đợt 133 (brief ~547 MB vs T9 đo 433 MB) và đợt 134 (brief ~1.295 MB vs T9 đo 460 MB).
- Swap đã dùng ~318–409 MB / 1.023 MB trong cửa sổ đo (SwapFree 730.380 → 639.128 kB) — trong dải các đợt trước (đợt 134: 279–387 MB; đợt 133: 253–344 MB); không phải mức báo động mới, chỉ ghi nhận.
- Top RSS lúc 02:41:04Z: `hatch` 293.260 kB (~286 MB) là tiến trình lớn nhất; các tiến trình còn lại đều < 10 MB (`systemd` 8.988 kB, `hatch-execd` 6.424 kB, `systemd-journald` 4.548 kB...). **Không có tiến trình người dùng nào ngốn RAM** — RAM thấp lúc đầu không phải do workload trong cell. Không có apt/dpkg nào đang chạy lúc đo.

### 2.2 Balloon virtio — xả rõ, nhẹ hơn đợt 134

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo** của T9, giá trị **không đơn điệu trong cửa sổ đo**: 6.016.276 → 6.050.256 (+33.980 kB) → 5.212.536 (−837.720 kB) → 5.396.928 (+184.392 kB). Ròng **−619.348 kB (≈ −0,59 GB) trong ~3,5 phút** — xả rõ nhưng chỉ bằng ~30% mức xả đợt 134 (−2,05 GB trong ~4,5 phút).
- Số học lúc đóng cửa sổ đo: tổng RAM 8.124.896 kB − balloon 5.396.928 kB = 2.727.968 kB (~2,66 GB) còn lại cho hệ thống; trong đó buff/cache + available ~1.462 MB + free ~1.030 MB. **Balloon chiếm ~66,4% tổng RAM lúc đóng cửa sổ** (đợt 134 lúc đóng: ~52,7%; đợt 133: ~79,3%) — nằm giữa hai đợt trước.
- **Chỉ ghi nhận tương quan, không kết luận** balloon sẽ tiếp tục xả hay phình lại sau cửa sổ đo của T9; các luồng cần RAM (lượt yên WebKit #11 của T4, harness của T8) đang ở trong cửa sổ RAM tốt hơn đợt 133 nhưng kém hơn đợt 134 — T4/T8 đợt 135 là chủ quản xác nhận, T9 chỉ ghi nhận số.
- Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp (không có lệnh nào để xả balloon từ trong cell).

### 2.3 Cửa sổ RAM đợt này thuộc nguồn nào? (đối chiếu cơ chế chờ RAM, quyết parent đợt 132 §12.3(a))

- **Đây là đợt hồi RAM giữa lượt, KHÔNG phải cửa sổ vàng sau boot.** Căn cứ: (a) boot đã ~13–17 phút tuổi trong cửa sổ đo của T9 (btime 02:27:27Z; đo 02:40–02:44Z); (b) replay trên boot mới đã xong từ 02:37:47Z (~10 phút sau boot), tức ~3 phút trước khi T9 bắt đầu đo; (c) RAM lúc T9 bắt đầu đo còn kẹt thấp 844–1.004 MB — không phải mức cao ngay sau boot; (d) đợt hồi diễn ra sau đó (844 → 1.734 MB trong ~2 phút) đi kèm balloon xả −837.720 kB. Hình dạng giống đợt hồi RAM giữa lượt của đợt 133 và đợt 134 — nhưng đợt này hồi yếu hơn đợt 134 (~2,1× so với min, so với ~5,3× đợt 134).
- **Caveat:** thời điểm bắt đầu đợt hồi không xác định chính xác — mẫu tăng đầu tiên T9 quan sát được là 02:43:04Z (844 → 1.734 MB); đợt hồi có thể đã bắt đầu trước đó trong khoảng 02:41–02:43Z mà T9 không lấy mẫu. Phân loại "đợt hồi giữa lượt" dựa trên tuổi boot (~13–17 phút) + replay đã xong + RAM kẹt thấp lúc bắt đầu đo — không dựa trên mốc bắt đầu chính xác.
- **Cơ chế chờ RAM (quyết parent đợt 132 §12.3(a)):** đợt 133 và đợt 134 đã chứng minh hoạt động với đợt hồi giữa lượt; đợt này đợt hồi còn yếu hơn — T4 đợt 135 là chủ quản xác nhận gate có mở được nhờ đợt hồi này không. T9 chỉ ghi nhận số.

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
| **135** | **~1.177 MB (brief; T9 đo trực tiếp 1.004 MB lúc 02:40:37Z)** | **844–1.734 MB theo sampler của T9, hồi giữa lượt rồi lùi** (cửa sổ đo của T9, ~3,5 phút) | — (không thuộc T9) |

- Mẫu chung giữ nguyên qua 12 đợt: mọi số đo đều xoay quanh ~0,4–2,5 GB, **chưa bao giờ chạm guard 6 GB**. Đợt này max 1.734 MB cao hơn max đợt 133 (512 MB) nhưng thấp hơn max đợt 134 (2.438 MB); min 844 MB cao hơn min đợt 133/134 (~433–460 MB) — cửa sổ đo đợt này **ít cực đoan hơn** hai đợt trước.

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **1.734 MB = 28,2% guard** — thiếu 4.410 MB. (Thấp hơn max đợt 134 là 2.438 MB / 39,7% guard, cao hơn max đợt 133 là 512 MB / 8,3% guard.)
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~3,5×, hạ guard không có cơ sở đo). Lưu ý số học (không phải đề nghị): nếu balloon ~5,40 GB lúc đóng cửa sổ được xả hết thì available lý thuyết ~6,8 GB mới vượt guard — nhưng việc xả balloon thuộc về host, T9 không kiểm soát và không thử.

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 02:40–02:44Z; một dòng `ps` lúc 02:40:57Z bắt được lệnh `find` của luồng khác, không phải vite/chrome) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.395 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2403 và i=2395) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 02:27:27Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về "-- No entries --").
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 135 = boot lúc T9 đo:** btime **02:27:27Z** 18/11 (`uptime -s` + `btime 1794968847` trong `/proc/stat` + boot_id `78b55838-d09e-4cfc-b491-a15935b7a447`). Không có reboot trong cửa sổ đo của T9 (02:40–02:44Z). Boot trước (đợt 134, btime 23:26:58Z sau reboot giữa lượt) sống ~3h00m29s tới boot này — **số boot mới chờ T6 đợt 135 chốt** (như thông lệ mọi đợt).
- **Replay trên boot mới: ĐÃ XONG lúc T9 kiểm.** dpkg.log đứng ở **1.545 dòng** trong toàn bộ cửa sổ đo (không tăng), không có apt/dpkg nào đang chạy; dòng cuối 02:37:47Z (`status installed gstreamer1.0-tools`). Cùng hình dạng baseline các boot trước (1.545 dòng / 221 installs). **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-135-T9-1 — RAM lúc mở đợt:** brief ghi ~1.177 MB lúc mở (02:36Z); T9 đo trực tiếp 1.004 MB lúc 02:40:37Z rồi 844 MB lúc 02:41:04Z. T9 không có mẫu nào trong khoảng 02:36–02:40Z nên không xác định được RAM rơi khi nào hay số nào "đúng" hơn — ghi cả hai số (tiền lệ đợt 133/134). Không đổi verdict (cả hai số đều < guard).
- **F-135-T9-2 — Đỉnh RAM 1.734 MB là chớp ngắn:** mẫu 02:43:04Z ghi 1.734 MB nhưng mẫu ~73 giây sau (02:44:17Z) chỉ còn 1.462 MB. Max "theo sampler của T9" là 1.734 MB nhưng không phải mức ổn định — các luồng khác không nên lấy 1.734 MB làm mức RAM sẵn có bền vững. Ghi rõ để tránh hiểu lầm.
- **F-135-T9-3 — Thời điểm bắt đầu đợt hồi RAM không xác định chính xác:** mẫu tăng đầu tiên quan sát được 02:43:04Z; đợt hồi có thể đã bắt đầu trong khoảng 02:41–02:43Z mà T9 không lấy mẫu. Phân loại "đợt hồi giữa lượt" dựa trên tuổi boot (~13–17 phút) + replay đã xong + RAM kẹt thấp lúc bắt đầu đo — không dựa trên mốc bắt đầu chính xác.
- **F-135-T9-4 — Balloon xả không đơn điệu:** balloon tăng +33.980 kB (02:40:57Z → 02:41:04Z) rồi xả −837.720 kB rồi lại tăng +184.392 kB (02:43:11Z → 02:44:17Z). Ròng −619.348 kB trong ~3,5 phút; không kết luận balloon sẽ tiếp tục xả sau cửa sổ đo.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 136 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 595 trên ngưỡng báo < ~1.800; tốc độ giảm sáu đợt gần nhất ~106–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~5 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo).
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Balloon virtio theo dõi** — đợt này balloon xả −0,59 GB (nhẹ hơn đợt 134: −2,05 GB); nếu balloon giữ mức thấp, harness/suite đợt sau có thể bớt phải chờ RAM — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
4. **Boot mới 78b55838 + replay đã xong (1.545 dòng)** — giao T5 đợt 135 đối chiếu sau khi xong pha 2; số boot mới chờ T6 chốt.
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 134 §11: giữ fix T3 530e10a7 + lượt yên #11 (T3/T4), mù #54 + mù #53 B mở, A2 watcher chết theo boot, T6 chốt lại chuỗi boot với #89?, G1 chờ user quyết, birefnet chỉ thử lại khi quan sát được available ≥ 6 GB, ci-security.yml vẫn 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND135_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round135-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round135-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot + journal + dpkg), `headroom-measure-2.log` (đo lần 2 + RAM + dpkg + journal), `ram-snapshot-1.log` (balloon + top RSS + mẫu RAM sau 120 s), `ram-snapshot-2.log` (mẫu RAM đóng cửa sổ) — không nằm trong repo nên không stage.
- Cờ `round135-t9.done` đã tạo khi xong. Hạn cứng 04:00Z 18/11 — xong lúc ~02:45Z 18/11, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.
