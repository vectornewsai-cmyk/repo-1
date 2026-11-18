# LIMITS — Phase 9 đợt 132, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.738** (đo 2 lần: 2.745 lúc 17:40:47Z và 2.738 lúc 17:42:07Z 17/11, boot mới btime 17:24:08Z) — **TIẾP TỤC GIẢM**: 2.846 (đợt 131) → **2.738 (−108, −3,8%)**. Bước giảm gần như giống hệt hai đợt trước (−116, −117). Chênh −7 giữa hai lần đo trong cùng boot là dao động trong-boot đã biết (các đợt trước: −11, −7, −1, −10/−2, 0), xem §1.2.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **938**; vẫn gấp ~1,74 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại các đợt 127–131).
- **RAM khả dụng đợt này: 857–1.095 MB** (đo trực tiếp của T9 trong 17:40:33–17:42:19Z) — **đang RƠI trong cửa sổ đo**: từ 1.095 MB xuống 857 MB trong ~2 phút, do balloon virtio phình lại (5,76 → 6,02 GB) trong lúc apt replay chạy `apt-get update`. Tất cả đều **< 6 GB guard** (6.144 MB).
- **Balloon virtio: 5.763.684 → 6.021.740 kB trong cửa sổ đo (+258 MB), KHÔNG đứng yên đợt này** — ngược với đợt 131 (đứng yên tuyệt đối 6.443.824 kB). Balloon hiện ~5,88 GB, ~74,1% tổng RAM. Balloon do host điều khiển, ngoài tầm luồng này.
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 1.095 MB chỉ bằng ~17,8% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8.** Journal boot mới: 0 dòng "No space left"/ENOSPC.
- **Boot mới giữa hai đợt (lần thứ 7 liên tiếp):** btime 17:24:08Z 17/11, boot_id `b379ecd7-311c-4053-a43f-507d21432ecc`; boot trước (#79 tạm, btime 14:26:41Z) sống ~2h57m27s. Số boot mới tạm gọi #80 — **chờ T6 đợt 132 chốt** (như mọi đợt trước). Replay trên boot mới **MỚI BẮT ĐẦU lúc T9 kiểm** (dpkg.log chỉ 2 dòng `startup packages configure` lúc 17:35:39Z, chưa có dòng install nào tới 17:42:19Z; `apt-get update` đang chạy) — quan sát thô cho T5, T9 không kết luận.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 132

| Thời điểm (UTC 17/11) | Headroom | Bối cảnh |
|---|---|---|
| 17:40:47Z | **2.745** | lần đo 1, boot mới (~17' tuổi) |
| 17:42:07Z | **2.738** | lần đo 2 (cuối lượt T9, −7 so với lần 1) |

- Probe dừng ở `i=2745` (lần 1) và `i=2738` (lần 2), errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- **Giải thích chênh −7 trong cùng boot:** dao động trong-boot đã biết, nằm trong dải các đợt trước (−11, −7, −1, −10/−2, 0). Trong ~80 giây giữa hai lần đo, balloon phình thêm ~175 MB (5.809.984 → 5.985.508 kB), apt replay đang chạy `apt-get update`, và các luồng đợt 132 khác đang khởi động — bất kỳ yếu tố nào cũng có thể giữ thêm vài watch ngoài cell. Không có bằng chứng nào cho thấy đây là giảm đột biến; giá trị cuối đợt lấy **2.738**.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.738 = **61.009 watch** (tăng ~108 so với 60.901 đợt 131).
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.738 / 1.578 ≈ **1,74 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + LIMITS T9 đợt 131 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **132** | **2.745 → 2.738** | **đo 17:40:47Z → 17:42:07Z, boot mới btime 17:24:08Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846 → 2.738**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.738 = **−1.700 (−38,3%)**. Bước giảm đợt này: −108 so với đợt 131 (−3,8%) — gần như giống hệt hai bước giảm trước (−116, −117). Ba đợt gần nhất giảm đều ~108–117/đợt.
- Trong một boot, headroom dao động nhẹ đợt này (−7 trong ~80 giây; các đợt trước: −11, −7, −1, −10/−2, 0); bước giảm chủ yếu xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **938**. Với tốc độ giảm ba đợt gần nhất (~108–117/đợt, mỗi đợt ~3 giờ) thì còn ~8–9 đợt nữa mới chạm ngưỡng *nếu* tốc độ giữ nguyên — đây chỉ là phép chia số học minh họa, KHÔNG phải dự báo (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 2–17 trong boot). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~61,0k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 132 (trực tiếp)

| Thời điểm (UTC 17/11) | RAM khả dụng | Balloon | Nguồn |
|---|---|---|---|
| 17:40:33Z | 1.095 MB (MemAvailable 1.122.088 kB) | 5.763.684 kB | `free -m` / `/proc/meminfo`, T9 đo |
| 17:40:46Z | 1.041 MB (MemAvailable 1.066.836 kB) | 5.809.984 kB | ngay trước probe headroom lần 1 |
| 17:40:47Z | 1.047 MB (MemAvailable 1.072.476 kB) | 5.809.984 kB | ngay sau probe headroom lần 1 |
| 17:40:56Z | 900 MB (MemAvailable 922.004 kB) | 5.853.632 kB | kèm top RSS |
| 17:41:56Z | 885 MB (MemAvailable 906.660 kB) | 5.985.508 kB | mẫu RAM sau 60 giây |
| 17:42:07Z | 880 MB (MemAvailable 902.056 kB) | 5.985.508 kB | ngay trước probe headroom lần 2 |
| 17:42:07Z | 865 MB (MemAvailable 886.768 kB) | 5.985.508 kB | ngay sau probe headroom lần 2 |
| 17:42:19Z | 857 MB (MemAvailable 877.988 kB) | 6.021.740 kB | mẫu RAM đóng cửa sổ đo |

- **Dao động trong cửa sổ đo (~2 phút): 857 → 1.095 MB (biên độ ~238 MB), XU HƯỚNG RƠI ĐƠN ĐIỆU** — khác đợt 131 (502–546 MB, biên độ ~44 MB, kẹt cứng). RAM rơi ~238 MB trong 2 phút, song song balloon phình +258 MB (5.763.684 → 6.021.740 kB). Tương quan rõ ràng: balloon phình là phía gây rơi RAM.
- **Số mở đợt cao hơn đợt 131 nhưng vẫn thấp:** 1.095 MB lúc mở cao hơn hẳn max đợt 131 (546 MB), nhưng vẫn chỉ bằng ~17,8% guard 6 GB. Đợt này RAM không kẹt cứng quanh ~500 MB như đợt 131 — balloon đã co từ 6.443.824 kB (đợt 131) xuống 5.763.684 kB lúc T9 bắt đầu đo, rồi phình lại trong lúc đo.
- Swap đã dùng 293–312 MB / 1.023 MB trong cửa sổ đo — thấp hơn đợt 131 (366–371 MB); không phải mức báo động mới, chỉ ghi nhận.
- Top RSS lúc 17:40:56Z: `hatch` 284.776 kB (~278 MB) là tiến trình lớn nhất; các tiến trình còn lại đều < 11 MB (`store` 10.620 kB, `hatch-execd` 6.452 kB, `systemd` 6.316 kB, `apt-get` 4.856 kB...). **Không có tiến trình người dùng nào ngốn RAM** — RAM thấp không phải do workload trong cell. `apt-get update` (PID 814) đang chạy lúc đo — thuộc replay boot mới của host, xem §5.

### 2.2 Balloon virtio — phình lại trong lúc đo (khác đợt 131)

- `/proc/meminfo` có trường `Balloon` trong **mọi mẫu đo** của T9, giá trị **tăng đơn điệu** trong cửa sổ đo: 5.763.684 → 5.809.984 → 5.853.632 → 5.985.508 → 6.021.740 kB (+258 MB trong ~2 phút). Ngược với đợt 131 khi balloon đứng yên tuyệt đối 6.443.824 kB.
- Số học lúc đóng cửa sổ đo: tổng RAM 8.124.900 kB − balloon 6.021.740 kB = 2.103.160 kB (~2,05 GB) còn lại cho hệ thống; trong đó buff/cache ~936 MB + available ~857 MB + free ~261 MB. **Balloon chiếm ~74,1% tổng RAM** (lúc mở cửa sổ đo: ~70,9%).
- **Chỉ ghi nhận tương quan, không kết luận** balloon sẽ tiếp tục phình hay co lại sau cửa sổ đo của T9; các luồng cần RAM (harness WebKit/Chromium, suite) có thể gặp RAM rơi tiếp nếu balloon phình thêm — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
- Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp (không có lệnh nào để xả balloon từ trong cell).

### 2.3 RAM có ảnh hưởng gì tới suite/harness không? (chỉ tương quan)

- **Trong cửa sổ đo của T9 (17:40–17:42Z): không có suite/harness nào đang chạy** — `ps` không thấy vite/chrome/MiniBrowser/Xvfb nào; chỉ có `apt-get update` của replay boot mới và các shell của luồng đợt 132 đang khởi động. Nên **không có quan sát trực tiếp** nào về ảnh hưởng của RAM ~0,9–1,1 GB tới suite/harness đợt này — T9 không kết luận nhân quả.
- Bối cảnh từ đợt 130 (để parent/T8 đối chiếu, không phải kết luận đợt này): RAM kẹt ~500 MB (balloon) đã khiến Gate A của T5 KHÔNG MỞ 3 cửa sổ đầu, phải chờ 34 phút tới khi RAM lên 1.540 MB mới mở. Đợt này RAM mở ở 1.095 MB và đang rơi — nếu balloon tiếp tục phình về ~6,44 GB như đợt 131 thì RAM sẽ về lại ~500 MB và các luồng cần RAM có thể gặp cùng kiểu chờ — nhưng đây là **suy luận từ đợt trước, chưa có bằng chứng đợt này**; T8/T5 đợt 132 là chủ quản xác nhận.

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
| **132** | **1.095 MB** (T9 đo trực tiếp lúc 17:40:33Z) | **857–1.095 MB, rơi đơn điệu** (cửa sổ đo của T9, ~2 phút) | — (không thuộc T9) |

- Mẫu chung giữ nguyên qua 9 đợt: mọi số đo đều xoay quanh ~0,5–2,5 GB, **chưa bao giờ chạm guard 6 GB**. Đợt này là đợt **đầu tiên T9 quan sát RAM rơi đơn điệu ~238 MB trong cửa sổ đo** (các đợt trước dao động hẹp hoặc kẹt cứng) — phản ánh balloon phình lại trong lúc apt replay chạy, không phải workload của luồng.

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **1.095 MB = 17,8% guard** — thiếu 5.049 MB. (Cao hơn max đợt 131 là 546 MB, nhưng vẫn cách guard ~5,6×.)
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~5,6–7,2×, hạ guard không có cơ sở đo). Lưu ý số học (không phải đề nghị): nếu balloon ~6,02 GB được xả hết thì available lý thuyết ~6,9 GB sẽ vượt guard — nhưng việc xả balloon thuộc về host, T9 không kiểm soát và không thử.

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 17:40–17:42Z) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.738 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2745 và i=2738) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal boot mới từ 17:24:08Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về rỗng).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot mới — quan sát thô cho T5 (không thuộc verdict T9)

- **Boot mới giữa hai đợt** (sau khi đợt 131 đóng, trước khi đợt 132 mở 00:35:51 +07 = 17:35:51Z): btime **17:24:08Z** 17/11 (`uptime -s` + `btime 1794936248` trong `/proc/stat` + boot_id `b379ecd7-311c-4053-a43f-507d21432ecc`). Đây là **reboot giữa đợt lần thứ 7 liên tiếp**.
- **Boot trước (#79 tạm, btime 14:26:41Z) sống ~2h57m27s** (14:26:41Z → 17:24:08Z). Số boot mới tạm gọi **#80 — chờ T6 đợt 132 chốt** (như thông lệ mọi đợt).
- **Replay trên boot mới: MỚI BẮT ĐẦU lúc T9 kiểm.** dpkg.log chỉ 2 dòng lúc 17:42:19Z, cả hai đều `startup packages configure` (17:35:39Z) — replay bắt đầu +11m31s sau boot và **chưa có dòng install nào** khi T9 đo. So sánh: đợt 131 replay bắt đầu +8m58s sau boot; đợt 130 bắt đầu +39m08s. `apt-get update` (PID 814, bắt đầu 17:35) đang chạy lúc T9 đo — replay đang trong giai đoạn update, chưa tới install. **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường"; T5 đợt 132 kiểm lại sau khi replay xong để đối chiếu hình dạng 1.509 dòng.**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Nợ mở chuyển đợt 133 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 938 trên ngưỡng báo < ~1.800; tốc độ giảm ba đợt gần nhất ~108–117/đợt nhưng không đều, không dự báo ngày chạm ngưỡng (ước tính số học ~8–9 đợt nữa nếu đà giữ nguyên — chỉ là phép chia, KHÔNG phải dự báo).
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Balloon virtio theo dõi** — đợt này balloon phình lại +258 MB trong 2 phút đo (5,76 → 6,02 GB) trong lúc apt replay chạy; nếu các đợt sau balloon phình về ~6,44 GB như đợt 131 thì RAM sẽ về lại ~500 MB và harness/suite có thể phải chờ RAM như Gate A đợt 130 — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
4. **Boot mới + replay mới bắt đầu lúc 17:35:39Z** — giao T5 đợt 132 xác nhận hình dạng replay sau khi xong (đối chiếu 1.509 dòng của #73/#74/#75/#76); số boot mới (#80 tạm) chờ T6 chốt.
5. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 131 §11: lượt yên WebKit #10 (T4, đợt 132, bật log draw phủ post-flip + T5 đối chiếu với seq (c2)), mù #51 probe thường lệ, G1 chờ user quyết, R9 (a) chờ user, ci-security.yml 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 7. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND132_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round132-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round132-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot + journal + dpkg), `headroom-measure-2.log` (đo lần 2 + RAM + dpkg), `ram-snapshot-1.log` (balloon + top RSS), `ram-snapshot-2.log` (mẫu RAM đóng cửa sổ) — không nằm trong repo nên không stage.
- Cờ `round132-t9.done` đã tạo khi xong. Hạn cứng 20:35Z 17/11 — xong lúc ~17:43Z, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.
