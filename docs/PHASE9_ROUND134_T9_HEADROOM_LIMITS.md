# LIMITS — Phase 9 đợt 134, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.505** (đo 2 lần: 2.515 lúc 23:45:29Z và **2.505** lúc 23:48:01Z 17/11, cùng boot d2e66749 btime 23:26:58Z) — **TIẾP TỤC GIẢM**: 2.632 (đợt 133) → **2.505 (−127, −4,8%)**. Chênh −10 giữa hai lần đo trong cùng boot (các đợt trước: −11, −7, −1, −10/−2, 0, −7), xem §1.2.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **705**; vẫn gấp ~1,59 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại các đợt 127–133).
- **RAM khả dụng đợt này: 460–2.438 MB theo sampler của T9** (23:45:07–23:49:29Z) — **đợt hồi RAM lớn giữa lượt, balloon xả mạnh rồi dao động**: balloon 6.371.088 → 4.276.284 kB (ròng −2.094.804 kB ≈ −2,05 GB trong ~4,5 phút), available vọt 460 → 2.438 MB (đỉnh chớp 23:49:01Z) rồi lùi về 1.480 MB lúc đóng cửa sổ đo. Tất cả đều **< 6 GB guard** (6.144 MB).
- **Balloon virtio: KHÔNG đứng yên đợt này** — xả nhanh liên tục trong cửa sổ đo (6.371.088 → 6.174.480 → 5.977.872 → 5.256.064 → 5.318.704 → 4.179.380 → 4.276.284 kB), khác hẳn đợt 133 (đứng yên tuyệt đối 6.443.824 kB). Balloon lúc đóng cửa sổ ~4,18 GB, ~52,7% tổng RAM (đợt 133: ~79,3%). Balloon do host điều khiển, ngoài tầm luồng này.
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 2.438 MB chỉ bằng ~39,7% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8.** Journal từ lúc boot: 0 dòng "No space left"/ENOSPC.
- **Boot lúc mở đợt 134 = boot lúc T9 đo** (d2e66749, btime 23:26:58Z) — không có reboot trong cửa sổ đo của T9. Replay trên boot mới **ĐÃ XONG** lúc T9 kiểm (dpkg.log đứng ở 1.545 dòng, không có apt/dpkg nào đang chạy; dòng cuối 23:37:47Z) — cùng hình dạng baseline 1.545/221 như các boot trước.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 134

| Thời điểm (UTC 17/11) | Headroom | Bối cảnh |
|---|---|---|
| 23:45:29Z | **2.515** | lần đo 1, boot ~18,5' tuổi |
| 23:48:01Z | **2.505** | lần đo 2 (cuối lượt T9, chênh −10 so với lần 1) |

- Probe dừng ở `i=2515` rồi `i=2505`, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh −10 trong cùng boot:** trong dải các đợt trước (−11, −7, −1, −10/−2, 0, −7). Trong ~2,5 phút giữa hai lần đo, balloon đang xả mạnh và RAM dao động lớn (xem §2) — cửa sổ đo không yên tĩnh như đợt 133 (balloon đứng yên, chênh 0), nên chênh −10 là hợp lý. Giá trị cuối đợt lấy **2.505**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.505 = **61.242 watch** (tăng ~127 so với 61.115 đợt 133).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.505 / 1.578 ≈ **1,59 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + LIMITS T9 đợt 131 §1.3 + LIMITS T9 đợt 132 §1.3 + LIMITS T9 đợt 133 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **134** | **2.515 → 2.505** | **đo 23:45:29Z → 23:48:01Z, boot d2e66749 btime 23:26:58Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632 → 2.505**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.505 = **−1.933 (−43,6%)**. Bước giảm đợt này: −127 so với đợt 133 (−4,8%) — lớn hơn một chút so với bốn bước giảm trước (−116, −117, −108, −106) nhưng cùng bậc độ lớn; năm đợt gần nhất giảm 106–127/đợt.
- Trong một boot, headroom đợt này giảm −10 trong ~2,5 phút (các đợt trước: −11, −7, −1, −10/−2, 0, −7); bước giảm chủ yếu xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **705**. Con số giảm ~106–127/đợt chỉ là phép chia số học minh họa (705 / ~112 ≈ 6,3 đợt nếu đà giữ nguyên) — **KHÔNG phải dự báo** (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot; quyết parent đứng). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~61,2k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 134 (trực tiếp, theo sampler của T9)

| Thời điểm (UTC 17/11) | RAM khả dụng | Balloon | Nguồn |
|---|---|---|---|
| 23:45:07Z | 460 MB (MemAvailable 460.756 kB) | 6.371.088 kB | `free` / `/proc/meminfo`, T9 đo, trước probe 1 |
| 23:45:15Z | 504 MB (MemAvailable 504.140 kB) | 6.371.088 kB | mẫu RAM |
| 23:45:29Z | 745 MB (MemAvailable 745.412 kB) | 6.174.480 kB | ngay trước probe 1 |
| 23:45:30Z | 750 MB (MemAvailable 750.900 kB) | 6.174.480 kB | ngay sau probe 1 |
| 23:45:45Z | 933 MB (MemAvailable 933.496 kB) | 5.977.872 kB | kèm top RSS |
| 23:47:45Z | 1.619 MB (MemAvailable 1.619.152 kB) | 5.256.064 kB | mẫu RAM sau 120 giây |
| 23:48:01Z | 1.509 MB (MemAvailable 1.509.296 kB) | 5.318.704 kB | ngay trước probe 2 |
| 23:48:01Z | 1.508 MB (MemAvailable 1.508.248 kB) | 5.318.704 kB | ngay sau probe 2 |
| 23:49:01Z | 2.438 MB (MemAvailable 2.438.752 kB) | 4.179.380 kB | mẫu RAM đóng cửa sổ đo |
| 23:49:29Z | 1.480 MB (MemAvailable 1.480.396 kB) | 4.276.284 kB | mẫu RAM cuối (trước khi viết LIMITS) |

- **Dao động trong cửa sổ đo (~4,5 phút): 460 → 2.438 MB theo sampler của T9 (biên độ ~1.978 MB), XU HƯỚNG TĂNG MẠNH NHƯNG DAO ĐỘNG** — khác hẳn đợt 133 (433–512 MB, kẹt thấp, biên độ ~79 MB) và đợt 132 (857–1.095 MB, rơi đơn điệu ~238 MB). Đỉnh 2.438 MB lúc 23:49:01Z là chớp ngắn: 28 giây sau đã lùi về 1.480 MB. **Min theo sampler của T9 là 460 MB; max theo sampler của T9 là 2.438 MB** (ghi rõ "theo sampler của mình" — bài học F-133-8: các sampler khác nhau cùng cửa sổ có thể cho min khác nhau).
- **Số mở đợt cao hơn lần đo trực tiếp đầu tiên của T9:** brief đợt 134 ghi RAM khả dụng lúc mở ~1.295 MB; lần đo trực tiếp đầu tiên của T9 (23:45:07Z, ~10 phút sau giờ mở 23:35Z) là 460 MB — thấp hơn ~835 MB. Chênh này có thể do RAM đã rơi giữa lúc mở đợt và lúc T9 đo (balloon lúc đó 6.371.088 kB, gần mức cao nhất chuỗi) rồi mới hồi lại, hoặc do dao động giữa các thời điểm đo; T9 chỉ ghi nhận cả hai số, không kết luận số nào "đúng" hơn. Tương tự đợt 133 (brief ~547 MB vs T9 đo 433 MB).
- Swap đã dùng ~279–387 MB / 1.023 MB trong cửa sổ đo (SwapFree 769.124 → 661.348 kB) — trong dải các đợt trước (đợt 133: 253–344 MB; đợt 132: 293–312 MB); không phải mức báo động mới, chỉ ghi nhận.
- Top RSS lúc 23:45:45Z: `hatch` 312.632 kB (~305 MB) là tiến trình lớn nhất; các tiến trình còn lại đều < 7 MB (`hatch-execd` 6.288 kB, `systemd` 6.116 kB, `systemd-journald` 2.652 kB...). **Không có tiến trình người dùng nào ngốn RAM** — RAM thấp lúc đầu không phải do workload trong cell. Không có apt/dpkg nào đang chạy lúc đo.

### 2.2 Balloon virtio — xả mạnh, KHÔNG đứng yên (khác đợt 133)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo** của T9, giá trị **giảm gần như đơn điệu trong cửa sổ đo**: 6.371.088 → 6.174.480 → 5.977.872 → 5.256.064 → 5.318.704 → 4.179.380 → 4.276.284 kB. Ròng **−2.094.804 kB (≈ −2,05 GB) trong ~4,5 phút**. Hai lần tăng nhỏ giữa chừng (+62.640 kB lúc 23:48:01Z, +96.904 kB lúc 23:49:29Z) là dao động trong lúc xả, không đảo xu hướng.
- Số học lúc đóng cửa sổ đo: tổng RAM 8.124.900 kB − balloon 4.276.284 kB = 3.848.616 kB (~3,76 GB) còn lại cho hệ thống; trong đó buff/cache + available ~1.480 MB + free ~599 MB. **Balloon chiếm ~52,7% tổng RAM lúc đóng cửa sổ** (đợt 133 lúc đóng: ~79,3%; đợt 132 lúc đóng: ~74,1%) — **thấp nhất kể từ đợt 131 trở lại đây**.
- **Chỉ ghi nhận tương quan, không kết luận** balloon sẽ tiếp tục xả hay phình lại sau cửa sổ đo của T9; các luồng cần RAM (lượt yên WebKit #11 của T4, harness của T8) đang ở trong cửa sổ RAM tốt hơn nhiều so với đợt 133 — T4/T8 đợt 134 là chủ quản xác nhận, T9 chỉ ghi nhận số.
- Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp (không có lệnh nào để xả balloon từ trong cell).

### 2.3 Cửa sổ RAM đợt này thuộc nguồn nào? (đối chiếu cơ chế chờ RAM, quyết parent đợt 132 §12.3(a))

- **Đây là đợt hồi RAM giữa lượt, KHÔNG phải cửa sổ vàng sau boot.** Căn cứ: (a) boot đã ~18–22 phút tuổi trong cửa sổ đo của T9 (btime 23:26:58Z; đo 23:45–23:49Z); (b) replay trên boot mới đã xong từ 23:37:47Z (~11 phút sau boot), tức ~7 phút trước khi T9 bắt đầu đo; (c) RAM lúc T9 bắt đầu đo còn kẹt thấp 460 MB — không phải mức cao ngay sau boot; (d) đợt hồi diễn ra sau đó (460 → 2.438 MB trong ~4 phút) đi kèm balloon xả mạnh −2,05 GB. Hình dạng giống đợt hồi RAM giữa lượt của đợt 133 (479 → 1.549 MB trong 9 phút, T4 lượt #10) — nhưng đợt này hồi mạnh hơn (~5,3× so với min) và balloon xả rõ ràng hơn (đợt 133 balloon đứng yên trong lúc hồi, nguyên nhân chưa xác định; đợt này balloon xả là tương quan trực tiếp).
- **Caveat:** thời điểm bắt đầu đợt hồi không xác định chính xác — mẫu tăng đầu tiên T9 quan sát được là 23:45:15Z (460 → 504 MB); brief ghi ~1.295 MB lúc mở đợt 23:35Z, nghĩa là RAM có thể đã rơi từ ~1.295 MB xuống 460 MB trong 10 phút đầu rồi mới hồi — T9 không có mẫu nào trong khoảng 23:35–23:45Z để khẳng định. Ghi nhận cả hai số, không suy diễn thêm.
- **Cơ chế chờ RAM (quyết parent đợt 132 §12.3(a)):** đợt 133 đã chứng minh hoạt động với đợt hồi giữa lượt; đợt này đợt hồi còn mạnh hơn — T4 đợt 134 là chủ quản xác nhận gate có mở được nhờ đợt hồi này không. T9 chỉ ghi nhận số.

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
| **134** | **~1.295 MB (brief; T9 đo trực tiếp 460 MB lúc 23:45:07Z)** | **460–2.438 MB theo sampler của T9, hồi mạnh rồi dao động** (cửa sổ đo của T9, ~4,5 phút) | — (không thuộc T9) |

- Mẫu chung giữ nguyên qua 11 đợt: mọi số đo đều xoay quanh ~0,4–2,5 GB, **chưa bao giờ chạm guard 6 GB**. Đợt này là đợt **max cao nhất T9 từng đo trực tiếp kể từ đợt 127** (2.438 MB, vượt max đợt 132 là 1.095 MB và max đợt 133 là 512 MB), đồng thời min 460 MB vẫn kẹt thấp như đợt 133 — biên độ dao động lớn nhất T9 từng ghi (~1.978 MB trong một cửa sổ đo).

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **2.438 MB = 39,7% guard** — thiếu 3.706 MB. (Cao hơn hẳn max đợt 133 là 512 MB và max đợt 132 là 1.095 MB, nhưng vẫn cách guard ~2,5×.)
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~2,5×, hạ guard không có cơ sở đo). Lưu ý số học (không phải đề nghị): nếu balloon ~4,28 GB lúc đóng cửa sổ được xả hết thì available lý thuyết ~5,7 GB vẫn chưa vượt guard — nhưng việc xả balloon thuộc về host, T9 không kiểm soát và không thử.

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 23:45–23:49Z) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.505 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2515 và i=2505) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 23:26:58Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về rỗng).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 134 = boot lúc T9 đo:** btime **23:26:58Z** 17/11 (`uptime -s` + `btime 1794958018` trong `/proc/stat` + boot_id `d2e66749-2840-49f8-930d-7e54c9554b96`). Không có reboot trong cửa sổ đo của T9 (23:45–23:49Z). Boot trước (đợt 133, btime 21:41:40Z sau reboot giữa lượt) sống ~1h45m18s tới boot này — **số boot mới chờ T6 đợt 134 chốt** (như thông lệ mọi đợt).
- **Replay trên boot mới: ĐÃ XONG lúc T9 kiểm.** dpkg.log đứng ở **1.545 dòng** trong toàn bộ cửa sổ đo (không tăng), không có apt/dpkg nào đang chạy; dòng cuối 23:37:47Z (`status installed gstreamer1.0-tools`). Cùng hình dạng baseline các boot trước (1.545 dòng / 221 installs). **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Sai số của chính T9 (ghi rõ)

- **F-134-T9-1 — RAM lúc mở đợt:** brief ghi ~1.295 MB lúc mở (23:35Z); T9 đo trực tiếp 460 MB lúc 23:45:07Z. T9 không có mẫu nào trong khoảng 23:35–23:45Z nên không xác định được RAM rơi khi nào hay số nào "đúng" hơn — ghi cả hai số (tiền lệ đợt 133: brief ~547 MB vs T9 đo 433 MB). Không đổi verdict (cả hai số đều < guard).
- **F-134-T9-2 — Đỉnh RAM 2.438 MB là chớp ngắn:** mẫu 23:49:01Z ghi 2.438 MB nhưng mẫu 28 giây sau (23:49:29Z) chỉ còn 1.480 MB. Max "theo sampler của T9" là 2.438 MB nhưng không phải mức ổn định — các luồng khác không nên lấy 2.438 MB làm mức RAM sẵn có bền vững. Ghi rõ để tránh hiểu lầm.
- **F-134-T9-3 — Thời điểm bắt đầu đợt hồi RAM không xác định chính xác:** mẫu tăng đầu tiên quan sát được 23:45:15Z; đợt hồi có thể đã bắt đầu trước đó. Phân loại "đợt hồi giữa lượt" dựa trên tuổi boot (~18–22 phút) + replay đã xong + RAM kẹt thấp lúc bắt đầu đo — không dựa trên mốc bắt đầu chính xác.
- Không có sai số nào khác phát hiện trong lúc đo. Probe K8 chạy đúng phương pháp các đợt trước; file tạm đã dọn sạch sau mỗi lần đo.

## 7. Nợ mở chuyển đợt 135 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 705 trên ngưỡng báo < ~1.800; tốc độ giảm năm đợt gần nhất ~106–127/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~6 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo).
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Balloon virtio theo dõi** — đợt này balloon xả mạnh lần đầu sau nhiều đợt đứng yên/phình (6.371.088 → 4.276.284 kB trong ~4,5 phút); nếu balloon giữ mức thấp, harness/suite đợt sau có thể bớt phải chờ RAM — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
4. **Boot mới d2e66749 + replay đã xong (1.545 dòng)** — giao T5 đợt 134 đối chiếu sau khi xong pha 2; số boot mới chờ T6 chốt.
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 133 §11: sửa instrumentation log draw + lượt yên #11 (T3/T4 đợt 134, đã phê duyệt), nhánh A2 watcher v6 chờ kích hoạt live, probe #53 + mù #53, G1 chờ user quyết, R9 (a) chờ user, ci-security.yml 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 8. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND134_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round134-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round134-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot + journal + dpkg), `headroom-measure-2.log` (đo lần 2 + RAM + dpkg + journal), `ram-snapshot-1.log` (balloon + top RSS + mẫu RAM sau 120 s), `ram-snapshot-2.log` (mẫu RAM đóng cửa sổ) — không nằm trong repo nên không stage.
- Cờ `round134-t9.done` đã tạo khi xong. Hạn cứng 02:00Z 18/11 — xong lúc ~23:50Z 17/11, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.
