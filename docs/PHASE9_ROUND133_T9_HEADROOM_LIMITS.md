# LIMITS — Phase 9 đợt 133, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.632** (đo 2 lần: 2.632 lúc 20:40:32Z và 2.632 lúc 20:42:53Z 17/11, cùng boot 07da9c50 btime 19:34:15Z) — **TIẾP TỤC GIẢM**: 2.738 (đợt 132) → **2.632 (−106, −3,9%)**. Bước giảm gần như giống hệt ba đợt trước (−116, −117, −108). Chênh **0** giữa hai lần đo trong cùng boot — ổn định tuyệt đối trong-boot đợt này (các đợt trước: −11, −7, −1, −10/−2, 0, −7), xem §1.2.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **832**; vẫn gấp ~1,67 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại các đợt 127–132).
- **RAM khả dụng đợt này: 433–512 MB** (đo trực tiếp của T9 trong 20:40:31–20:43:09Z) — **kẹt thấp, dao động hẹp (~79 MB)**, khác đợt 132 (857–1.095 MB, rơi đơn điệu ~238 MB). Tất cả đều **< 6 GB guard** (6.144 MB).
- **Balloon virtio: ĐỨNG YÊN TUYỆT ĐỐI 6.443.824 kB trong toàn bộ cửa sổ đo** — đúng bằng giá trị đứng yên của đợt 131, và cao hơn lúc đóng đợt 132 (6.021.740 kB) +422.084 kB. Balloon hiện ~6,29 GB, ~79,3% tổng RAM. Balloon do host điều khiển, ngoài tầm luồng này.
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 512 MB chỉ bằng ~8,3% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8.** Journal từ lúc boot: 0 dòng "No space left"/ENOSPC.
- **Boot lúc mở đợt 133 = boot lúc T9 đo** (07da9c50, btime 19:34:15Z) — không có reboot trong cửa sổ đo của T9. Replay trên boot mới **ĐÃ XONG** lúc T9 kiểm (dpkg.log đứng ở 1.545 dòng, không có apt/dpkg nào đang chạy; dòng cuối 19:36:48Z) — khớp hình dạng T5 pha 1 báo (1.545 dòng / 221 installs).
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 133

| Thời điểm (UTC 17/11) | Headroom | Bối cảnh |
|---|---|---|
| 20:40:32Z | **2.632** | lần đo 1, boot ~66' tuổi |
| 20:42:53Z | **2.632** | lần đo 2 (cuối lượt T9, chênh 0 so với lần 1) |

- Probe dừng ở `i=2632` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Chênh 0 trong cùng boot:** lần đầu tiên trong chuỗi gần đây hai lần đo cho cùng một số tuyệt đối (các đợt trước: −11, −7, −1, −10/−2, 0, −7). Trong ~2 phút giữa hai lần đo, balloon đứng yên tuyệt đối và không có apt replay nào đang chạy (replay đã xong) — cửa sổ đo yên tĩnh, nên số đo ổn định là hợp lý. Giá trị cuối đợt lấy **2.632**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.632 = **61.115 watch** (tăng ~106 so với 61.009 đợt 132).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.632 / 1.578 ≈ **1,67 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + LIMITS T9 đợt 131 §1.3 + LIMITS T9 đợt 132 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **133** | **2.632 → 2.632** | **đo 20:40:32Z → 20:42:53Z, boot 07da9c50 btime 19:34:15Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738 → 2.632**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.632 = **−1.806 (−40,7%)**. Bước giảm đợt này: −106 so với đợt 132 (−3,9%) — gần như giống hệt ba bước giảm trước (−116, −117, −108). Bốn đợt gần nhất giảm đều ~106–117/đợt.
- Trong một boot, headroom đợt này ổn định tuyệt đối (chênh 0 trong ~2 phút; các đợt trước: −11, −7, −1, −10/−2, 0, −7); bước giảm chủ yếu xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **832**. Với tốc độ giảm bốn đợt gần nhất (~106–117/đợt, trung bình ~112/đợt, mỗi đợt ~3 giờ) thì còn ~7–8 đợt nữa mới chạm ngưỡng *nếu* tốc độ giữ nguyên — đây chỉ là phép chia số học minh họa, KHÔNG phải dự báo (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 0–17 trong boot). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~61,1k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 133 (trực tiếp)

| Thời điểm (UTC 17/11) | RAM khả dụng | Balloon | Nguồn |
|---|---|---|---|
| 20:40:31Z | 433 MB (MemAvailable 444.268 kB) | 6.443.824 kB | `free -m` / `/proc/meminfo`, T9 đo, ngay trước probe 1 |
| 20:40:32Z | 444 MB (MemAvailable 454.824 kB) | 6.443.824 kB | ngay sau probe 1 |
| 20:40:41Z | 437 MB (MemAvailable 448.132 kB) | 6.443.824 kB | kèm top RSS |
| 20:42:42Z | 499 MB (MemAvailable 512.280 kB) | 6.443.824 kB | mẫu RAM sau 120 giây |
| 20:42:53Z | 478 MB (MemAvailable 489.604 kB) | 6.443.824 kB | ngay trước probe 2 |
| 20:42:53Z | 488 MB (MemAvailable 501.016 kB) | 6.443.824 kB | ngay sau probe 2 |
| 20:43:09Z | 495 MB (MemAvailable 508.056 kB) | 6.443.824 kB | mẫu RAM đóng cửa sổ đo |

- **Dao động trong cửa sổ đo (~2,5 phút): 433 → 512 MB (biên độ ~79 MB), XU HƯỚNG HƠI TĂNG VỀ CUỐI** (433 → 495 MB từ đầu tới cuối cửa sổ) — khác đợt 132 (857–1.095 MB, rơi đơn điệu ~238 MB) và giống đợt 131 hơn (502–546 MB, kẹt cứng, biên độ ~44 MB). RAM đợt này kẹt quanh ~450–500 MB.
- **Số mở đợt thấp hơn brief ghi:** brief đợt 133 ghi RAM khả dụng lúc mở ~547 MB; lần đo trực tiếp đầu tiên của T9 (20:40:31Z, ~5 phút sau giờ mở 20:35Z) là 433 MB — thấp hơn ~114 MB. Chênh này có thể do balloon đã phình về mức đợt 131 trước khi T9 đo (xem §2.2) hoặc do dao động giữa các thời điểm đo; T9 chỉ ghi nhận cả hai số, không kết luận số nào "đúng" hơn.
- Swap đã dùng 253–344 MB / 1.023 MB trong cửa sổ đo — trong dải các đợt trước (đợt 132: 293–312 MB; đợt 131: 366–371 MB); không phải mức báo động mới, chỉ ghi nhận.
- Top RSS lúc 20:40:41Z: `hatch` 282.216 kB (~276 MB) là tiến trình lớn nhất; các tiến trình còn lại đều < 8 MB (`hatch-execd` 7.660 kB, `systemd` 5.056 kB, `systemd-journald` 3.224 kB...). **Không có tiến trình người dùng nào ngốn RAM** — RAM thấp không phải do workload trong cell. Không có apt/dpkg nào đang chạy lúc đo.

### 2.2 Balloon virtio — đứng yên tuyệt đối, trở về đúng mức đợt 131

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo** của T9, giá trị **đứng yên tuyệt đối 6.443.824 kB** trong toàn bộ cửa sổ đo (7 mẫu, 20:40:31–20:43:09Z). Đây là **đúng bằng giá trị đứng yên của đợt 131** (6.443.824 kB) — balloon đã phình trở lại mức đó trong khoảng giữa lúc đóng đợt 132 (6.021.740 kB) và lúc T9 đợt 133 bắt đầu đo (+422.084 kB giữa hai đợt).
- Số học lúc đóng cửa sổ đo: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB (~1,64 GB) còn lại cho hệ thống; trong đó buff/cache ~637 MB + available ~495 MB + free ~188 MB. **Balloon chiếm ~79,3% tổng RAM** (đợt 132 lúc đóng: ~74,1%; đợt 131: ~79,3%).
- **Chỉ ghi nhận tương quan, không kết luận** balloon sẽ tiếp tục phình hay co lại sau cửa sổ đo của T9; các luồng cần RAM (harness WebKit/Chromium, suite) có thể gặp RAM kẹt ~450–500 MB như đợt 131 — đợt 131 RAM kẹt ~500 MB đã khiến Gate A của T5 (đợt 130) phải chờ; T5/T8 đợt 133 là chủ quản xác nhận, T9 chỉ ghi nhận số.
- Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp (không có lệnh nào để xả balloon từ trong cell).

### 2.3 RAM có ảnh hưởng gì tới suite/harness không? (chỉ tương quan)

- **Trong cửa sổ đo của T9 (20:40–20:43Z): không có suite/harness nào đang chạy** — `ps` không thấy vite/chrome/MiniBrowser/Xvfb nào; chỉ có các shell của luồng đợt 133 đang khởi động. Nên **không có quan sát trực tiếp** nào về ảnh hưởng của RAM ~0,43–0,51 GB tới suite/harness đợt này — T9 không kết luận nhân quả.
- Bối cảnh từ đợt 130 (để parent/T8 đối chiếu, không phải kết luận đợt này): RAM kẹt ~500 MB (balloon) đã khiến Gate A của T5 KHÔNG MỞ 3 cửa sổ đầu, phải chờ 34 phút tới khi RAM lên 1.540 MB mới mở. Đợt này RAM kẹt ~450–500 MB ngay từ đầu và balloon đứng yên ở mức cao nhất chuỗi — nếu balloon không co lại, các luồng cần RAM có thể gặp cùng kiểu chờ — nhưng đây là **suy luận từ đợt trước, chưa có bằng chứng đợt này**; T8/T5 đợt 133 là chủ quản xác nhận. Lưu ý: quyết parent đợt 132 đã phê duyệt cơ chế chờ RAM cho lượt yên WebKit #10 — đúng bối cảnh RAM kẹt này.

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
| **133** | **~547 MB (brief; T9 đo trực tiếp 433 MB lúc 20:40:31Z)** | **433–512 MB, hơi tăng về cuối** (cửa sổ đo của T9, ~2,5 phút) | — (không thuộc T9) |

- Mẫu chung giữ nguyên qua 10 đợt: mọi số đo đều xoay quanh ~0,4–2,5 GB, **chưa bao giờ chạm guard 6 GB**. Đợt này là đợt **thấp nhất T9 từng đo trực tiếp** (min 433 MB, thấp hơn min đợt 131 là 502 MB) — phản ánh balloon đã trở về đúng mức cao nhất chuỗi (6.443.824 kB) trước khi T9 đo.

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **512 MB = 8,3% guard** — thiếu 5.632 MB. (Thấp hơn hẳn max đợt 132 là 1.095 MB; gần bằng max đợt 131 là 546 MB.)
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~12×, hạ guard không có cơ sở đo). Lưu ý số học (không phải đề nghị): nếu balloon ~6,44 GB được xả hết thì available lý thuyết ~6,9 GB sẽ vượt guard — nhưng việc xả balloon thuộc về host, T9 không kiểm soát và không thử.

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 20:40–20:43Z) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.632 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2632 cả hai lần) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal từ lúc boot 19:34:15Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về rỗng).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot — quan sát thô cho T5/T6 (không thuộc verdict T9)

- **Boot lúc mở đợt 133 = boot lúc T9 đo:** btime **19:34:15Z** 17/11 (`uptime -s` + `btime 1794944055` trong `/proc/stat` + boot_id `07da9c50-5836-4481-a4a4-7e22c6260325`). Không có reboot trong cửa sổ đo của T9 (20:40–20:43Z). Boot trước (đợt 132, btime 17:24:08Z) sống ~2h10m07s — **số boot mới chờ T6 đợt 133 chốt** (như thông lệ mọi đợt).
- **Replay trên boot mới: ĐÃ XONG lúc T9 kiểm.** dpkg.log đứng ở **1.545 dòng** trong toàn bộ cửa sổ đo (không tăng), không có apt/dpkg nào đang chạy; dòng cuối 19:36:48Z (`configure gstreamer1.0-tools ... status installed`). Khớp hình dạng T5 pha 1 báo trong brief đợt 133 (replay boot mới 1.545 dòng / 221 installs; `gstreamer1.0-gl` đã cài bởi replay, không cần --repair). **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường".**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Nợ mở chuyển đợt 134 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 832 trên ngưỡng báo < ~1.800; tốc độ giảm bốn đợt gần nhất ~106–117/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~7–8 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo).
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Balloon virtio theo dõi** — đợt này balloon đứng yên tuyệt đối ở đúng mức cao nhất chuỗi (6.443.824 kB, ~79,3% tổng RAM) và RAM kẹt thấp nhất T9 từng đo (433 MB); nếu balloon giữ mức này, harness/suite đợt sau có thể phải chờ RAM như Gate A đợt 130 — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
4. **Boot mới + replay đã xong (1.545 dòng)** — giao T5 đợt 133 đối chiếu sau khi xong pha 2 (c2); số boot mới chờ T6 chốt.
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 132 §11: lượt yên WebKit #10 với cơ chế chờ RAM mới (T4, đợt 133), mù #51/#52 probe thường lệ, G1 chờ user quyết, R9 (a) chờ user, ci-security.yml 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 7. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND133_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round133-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round133-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot + journal + dpkg), `headroom-measure-2.log` (đo lần 2 + RAM + dpkg), `ram-snapshot-1.log` (balloon + top RSS), `ram-snapshot-2.log` (mẫu RAM đóng cửa sổ) — không nằm trong repo nên không stage.
- Cờ `round133-t9.done` đã tạo khi xong. Hạn cứng 22:30Z 17/11 — xong lúc ~20:43Z, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.
