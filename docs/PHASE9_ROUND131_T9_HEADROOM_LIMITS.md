# LIMITS — Phase 9 đợt 131, T9: headroom inotify + RAM + guard birefnet

## 0. Tóm tắt (đọc trước)

- **Headroom inotify hiện tại: 2.846** (đo 2 lần khớp nhau tuyệt đối: 14:42:07Z và 14:44:42Z 17/11, boot mới btime 14:26:41Z) — **TIẾP TỤC GIẢM**: 2.963 (đợt 130) → **2.846 (−117, −3,9%)**. Bước giảm gần như giống hệt đợt trước (−116).
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng **1.046**; vẫn gấp ~1,80 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại các đợt 127–130).
- **RAM khả dụng đợt này: 502–546 MB** (đo trực tiếp của T9 trong 14:41:45–14:44:42Z; brief lúc mở nói ~831 MB — **số đo trực tiếp thấp hơn brief ~320 MB**, xem §2.1). Tất cả đều **< 6 GB guard** (6.144 MB).
- **Balloon virtio: 6.443.824 kB (~6,29 GB), ĐỨNG YÊN tuyệt đối qua mọi mẫu đo** — đây là nguyên nhân trực tiếp khiến RAM khả dụng kẹt quanh ~500 MB (tổng RAM 7.934 MB trừ balloon ~6,29 GB còn ~1,6 GB cho hệ thống + cache + available). Balloon do host điều khiển, ngoài tầm luồng này. Đã biết từ đợt 130 (T4 + LIMITS gộp §5b: balloon ~6,5 GB, Gate A của T5 kẹt 3 cửa sổ vì RAM ~500 MB) — đợt này xác nhận lại bằng số meminfo trực tiếp.
- **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 546 MB chỉ bằng ~8,9% guard 6.144 MB. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- **Không có vite/chrome nào đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8** (probe tự dừng ở errno 28 khi hết headroom — đó là cách đo, không phải lỗi). Journal boot mới: 0 dòng "No space left"/ENOSPC.
- **Boot mới giữa hai đợt (lần thứ 6 liên tiếp):** btime 14:26:41Z 17/11, boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`; boot trước (#78, btime 13:02:41Z) sống ~1h24m00s. Số boot mới tạm gọi #79 — **chờ T6 đợt 131 chốt** (như mọi đợt trước). Replay trên boot mới **MỚI BẮT ĐẦU lúc T9 kiểm** (dpkg.log chỉ 2 dòng `startup packages configure` lúc 14:35:39–14:35:40Z, chưa có dòng install nào tới 14:44:42Z) — quan sát thô cho T5, T9 không kết luận.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet. Làm việc nhẹ (chỉ đo).

## 1. Headroom inotify (probe K8, trần 63.747)

### 1.1 Phương pháp

Script `hidden_files/round109-k8/k8-headroom.py` (dùng lại verbatim từ các đợt trước): mở một inotify fd, thêm watch từng file tạm khác nhau cho tới khi `inotify_add_watch` trả errno 28 (ENOSPC), đếm số watch thêm được = headroom hiệu dụng từ góc cell; sau đó đóng fd (nhả toàn bộ watch) và xóa file tạm. Trần đọc từ `/proc/sys/fs/inotify/max_user_watches` = **63.747** (không đổi).

### 1.2 Số đo đợt 131

| Thời điểm (UTC 17/11) | Headroom | Bối cảnh |
|---|---|---|
| 14:42:07Z | **2.846** | lần đo 1, boot mới (~15' tuổi) |
| 14:44:42Z | **2.846** | lần đo 2 (cuối lượt T9, khớp tuyệt đối) |

- Probe dừng ở `i=2846` cả hai lần, errno=28 (No space left on device) — đúng cơ chế dừng của probe, không phải sự cố.
- Số watch đang giữ ngoài cell suy ra: 63.747 − 2.846 = **60.901 watch**.
- Tỉ lệ so với nhu cầu vite thường (~1.578 watch, 1 vite = 1.578 watch theo ghi nhận đợt 127): 2.846 / 1.578 ≈ **1,80 lần** — đủ cho ~2 vite dev server chạy nối tiếp, không đủ cho nhiều vite song song nếu mỗi cái giữ ~1.578 watch.

### 1.3 Chuỗi headroom dài hạn (nối tiếp)

Chuỗi từ LIMITS gộp đợt 128 §9 + LIMITS T9 đợt 129 §1.3 + LIMITS T9 đợt 130 §1.3 + số đo đợt này (các giá trị là headroom cuối mỗi đợt / mỗi boot, trần 63.747):

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
| **131** | **2.846 → 2.846** | **đo 14:42:07Z → 14:44:42Z, boot mới btime 14:26:41Z** |

Chuỗi đầy đủ: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079 → 2.963 → 2.846**.

- **Xu hướng: GIẢM DÀI HẠN, CHƯA ĐẢO CHIỀU.** Từ đỉnh chuỗi 4.438 xuống 2.846 = **−1.592 (−35,9%)**. Bước giảm đợt này: −117 so với đợt 130 (−3,9%) — gần như giống hệt bước giảm đợt trước (−116).
- Trong một boot, headroom đứng yên tuyệt đối đợt này (2.846 → 2.846 trong ~155 giây; các đợt trước: −11, −7, −1, −10/−2); bước giảm xảy ra **giữa các boot/đợt** (lớn nhất trong chuỗi: 4.318 → 3.645 = −673). Đợt này cũng vậy: toàn bộ −117 xảy ra giữa cuối đợt 130 (boot #77/#78) và đầu đợt 131 (boot mới).
- **Ngưỡng báo user < ~1.800: CHƯA CHẠM.** Còn cách ngưỡng **1.046**. Với tốc độ giảm hai đợt gần nhất (~116–117/đợt, mỗi đợt ~3 giờ) thì còn ~9 đợt nữa mới chạm ngưỡng *nếu* tốc độ giữ nguyên — đây chỉ là phép chia số học minh họa, KHÔNG phải dự báo (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 2–17 trong boot). Quyết đứng: tiếp tục theo dõi, chưa đưa lên user.
- Trần 63.747 vẫn đầy ở mức ~60,9k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này** (như mọi đợt trước).

## 2. RAM khả dụng (tổng 7.934 MB, swap 1.023 MB)

### 2.1 Số đo đợt 131 (trực tiếp)

| Thời điểm (UTC 17/11) | RAM khả dụng | Balloon | Nguồn |
|---|---|---|---|
| ~14:35:51Z (mở đợt) | **~831 MB** | — | brief giao đợt (không phải số T9 đo trực tiếp) |
| 14:41:45Z | 509 MB (MemAvailable 521.888 kB) | 6.443.824 kB | `free -m` / `/proc/meminfo`, T9 đo |
| 14:42:07Z | 505 MB (MemAvailable 516.736 kB) | 6.443.824 kB | ngay trước probe headroom lần 1 |
| 14:42:08Z | 502 MB (MemAvailable 513.984 kB) | 6.443.824 kB | ngay sau probe headroom lần 1 |
| 14:42:26Z | 504 MB (MemAvailable 516.596 kB) | 6.443.824 kB | kèm top RSS |
| 14:44:24Z | 507 MB (MemAvailable 520.008 kB) | 6.443.824 kB | mẫu RAM 2 |
| 14:44:42Z | 507 MB (MemAvailable 519.200 kB) | 6.443.824 kB | ngay trước probe headroom lần 2 |
| 14:44:42Z | 532 MB (MemAvailable 546.048 kB) | 6.443.824 kB | ngay sau probe headroom lần 2 |

- **Dao động trong cửa sổ đo (~3 phút): 502 → 546 MB (biên độ chỉ ~44 MB)** — hẹp hơn hẳn các đợt trước (~400–558 MB), vì không có luồng nặng nào khởi động trong cửa sổ đo của T9 lần này; RAM kẹt cứng quanh ~505 MB.
- **Chênh lệch với brief:** brief lúc mở nói ~831 MB nhưng số đo trực tiếp đầu tiên của T9 (14:41:45Z, ~6 phút sau giờ mở đợt) chỉ 509 MB — thấp hơn ~322 MB. T9 không kết luận nguyên nhân (có thể RAM rơi trong 6 phút đó khi các luồng đợt 131 khởi động, hoặc brief lấy số ở thời điểm khác); chỉ ghi nhận chênh lệch để parent đối chiếu. Dù lấy số nào thì cũng **< 6 GB guard** với biên độ lớn.
- **Gần kỷ lục thấp:** thấp nhất quan sát 502 MB, chỉ cao hơn kỷ lục thấp 483 MB (T10 đợt 127 lúc chạy suite) 19 MB; thấp hơn mọi số T9 các đợt 128 (1.286 MB), 129 (908 MB), 130 (688 MB).
- Swap đã dùng 366–371 MB / 1.023 MB trong cửa sổ đo — cao hơn đợt 130 (256 MB) nhưng chưa tới mức 428 MB lúc 85m4 kẹt (đợt 127); không phải mức báo động mới, chỉ ghi nhận.
- Top RSS lúc 14:42:26Z: `hatch` 257.712 kB (~252 MB) là tiến trình lớn nhất; các tiến trình còn lại đều < 12 MB (`store` 11.780 kB, `systemd` 7.264 kB, `apt-get` 7.048 kB...). **Không có tiến trình người dùng nào ngốn RAM** — RAM thấp không phải do workload trong cell.

### 2.2 Balloon virtio — nguyên nhân RAM kẹt (quan sát trực tiếp lần đầu của T9)

- `/proc/meminfo` có trường `Balloon: 6.443.824 kB` (~6,29 GB) trong **mọi mẫu đo** của T9, giá trị **không đổi tuyệt đối** (6.443.824 kB ở cả 14:41:45Z, 14:42:07Z, 14:42:26Z, 14:44:24Z, 14:44:42Z) — balloon không co giãn trong cửa sổ ~3 phút này.
- Số học: tổng RAM 8.124.900 kB − balloon 6.443.824 kB = 1.681.076 kB (~1,64 GB) còn lại cho hệ thống; trong đó buff/cache ~680 MB + available ~505 MB + free ~145 MB. **Balloon chiếm ~79,3% tổng RAM** — đây là lời giải thích đầy đủ cho RAM khả dụng ~500 MB, không cần giả thuyết thêm.
- Đã biết từ đợt 130 (LIMITS gộp §5b + T4: driver `virtio_balloon` + `virtio_mem` có mặt, balloon ~6,5 GB, Gate A của T5 kẹt 3 cửa sổ vì RAM ~500 MB rồi mở ở cửa sổ 4 khi RAM lên 1.540 MB). Đợt này **xác nhận lại bằng số meminfo trực tiếp của T9** và ghi nhận balloon đứng yên trong cửa sổ đo — khác với đợt 130 khi balloon co giãn (RAM lên tới 1.540 MB rồi rơi lại). **Chỉ ghi nhận tương quan, không kết luận** balloon sẽ co lại hay không trong đợt 131.
- Balloon do host điều khiển — **ngoài tầm luồng này**, không thử can thiệp (không có lệnh nào để xả balloon từ trong cell).

### 2.3 RAM có ảnh hưởng gì tới suite/harness không? (chỉ tương quan)

- **Trong cửa sổ đo của T9 (14:41–14:44Z): không có suite/harness nào đang chạy** — `ps` không thấy vite/chrome/MiniBrowser/Xvfb nào; chỉ có một shell của luồng khác trong đợt 131 đang chạy lệnh kiểm tra đĩa lúc 14:44Z. Nên **không có quan sát trực tiếp** nào về ảnh hưởng của RAM ~500 MB tới suite/harness đợt này — T9 không kết luận nhân quả.
- Bối cảnh từ đợt 130 (để parent/T8 đối chiếu, không phải kết luận đợt này): RAM kẹt ~500 MB (balloon) đã khiến Gate A của T5 KHÔNG MỞ 3 cửa sổ đầu, phải chờ 34 phút tới khi RAM lên 1.540 MB mới mở. Nếu balloon đợt này giữ nguyên ~6,29 GB không co lại, các luồng cần RAM (harness WebKit/Chromium, suite) có thể gặp cùng kiểu chờ — nhưng đây là **suy luận từ đợt trước, chưa có bằng chứng đợt này**; T8/T5 đợt 131 là chủ quản xác nhận.
- Swap dùng 366–371 MB cho thấy hệ thống đã phải đẩy một phần ra swap — tương quan với RAM kẹt, không phải bằng chứng suite bị ảnh hưởng.

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
| **131** | **~831 MB** (brief; T9 đo trực tiếp 509 MB lúc 14:41:45Z) | **502–546 MB** (cửa sổ đo của T9, ~3 phút) | — (không thuộc T9) |

- Mẫu chung giữ nguyên qua 8 đợt: mọi số đo đều xoay quanh ~0,5–2,5 GB, **chưa bao giờ chạm guard 6 GB**. Đợt này là đợt **thấp nhất về RAM khả dụng trong cửa sổ đo của T9** (502–546 MB) — nhưng biên độ dao động lại hẹp nhất (~44 MB), phản ánh RAM kẹt cứng bởi balloon đứng yên chứ không phải do luồng khác khởi động/dừng.

## 3. Guard birefnet — KHÔNG ĐẠT, KHÔNG CHẠY

- Guard đứng (quyết parent, giữ nguyên mọi đợt): **chỉ thử lại birefnet khi quan sát được available RAM ≥ 6 GB (6.144 MB)**; u2net là fallback chính thức.
- Số lớn nhất quan sát được đợt này: **546 MB = 8,9% guard** — thiếu 5.598 MB. (Số brief lúc mở ~831 MB cũng chỉ bằng 13,5% guard.)
- **Kết luận: KHÔNG CHẠY birefnet đợt này. Không có lần chạy nào được thử.** Birefnet vẫn **0 lần chạy thành công** trong gói.
- Không có quan sát mới nào làm đổi quyết guard; không đề nghị hạ guard (RAM thực tế còn cách guard ~7–12×, hạ guard không có cơ sở đo). Lưu ý số học (không phải đề nghị): nếu balloon ~6,29 GB được xả hết thì available lý thuyết ~6,8 GB sẽ vượt guard — nhưng việc xả balloon thuộc về host, T9 không kiểm soát và không thử.

## 4. ENOSPC / vite watch

- **Không có vite nào đang chạy lúc đo** (`ps` không thấy vite/chrome/MiniBrowser/Xvfb nào lúc 14:41–14:44Z) — nên không có ENOSPC vite nào để ghi nhận đợt này. Vite nối tiếp bắt buộc vẫn đứng (1 vite = 1.578 watch; headroom 2.846 chỉ đủ ~2 vite nối tiếp, không đủ chạy song song nhiều vite).
- **ENOSPC duy nhất quan sát được là lần dừng có chủ đích của probe K8** (errno 28 ở i=2846 cả hai lần) — đó là tín hiệu đo, probe đã nhả toàn bộ watch sau đó (đóng fd + xóa file tạm `/tmp/k8-watch-probe`, đã kiểm tra thư mục không còn sau mỗi lần đo).
- Journal boot mới từ 14:26:41Z: **0 dòng "No space left" / ENOSPC** (`journalctl --grep` trả về rỗng).
- Không có lock vite sót liên quan tới T9; T6 là chủ quản lock.

## 5. Boot mới — quan sát thô cho T5 (không thuộc verdict T9)

- **Boot mới giữa hai đợt** (sau khi đợt 130 đóng ~13:xxZ, trước khi đợt 131 mở 14:35:51Z): btime **14:26:41Z** 17/11 (`uptime -s` + `btime 1794925601` trong `/proc/stat` + boot_id `f868abad-66fb-46e7-bbaa-cd3ec0cddf34`). Đây là **reboot giữa đợt lần thứ 6 liên tiếp**.
- **Boot trước (#78, btime 13:02:41Z) sống ~1h24m00s** (13:02:41Z → 14:26:41Z). Số boot mới tạm gọi **#79 — chờ T6 đợt 131 chốt** (như thông lệ mọi đợt).
- **Replay trên boot mới: MỚI BẮT ĐẦU lúc T9 kiểm.** dpkg.log chỉ 2 dòng lúc 14:44:42Z, cả hai đều `startup packages configure` (14:35:39Z và 14:35:40Z) — replay bắt đầu +8m58s sau boot và **chưa có dòng install nào** khi T9 đo. So sánh: đợt 130 replay bắt đầu +39m08s sau boot. **T5 là chủ quản replay — T9 chỉ ghi nhận, không kết luận "bình thường"/"bất thường"; T5 đợt 131 kiểm lại sau khi replay xong để đối chiếu hình dạng 1.509 dòng.**
- Không có apt/dpkg nào được T9 chạy; T9 chỉ đọc dpkg.log.

## 6. Nợ mở chuyển đợt 132 (phần T9)

1. **Headroom tiếp tục theo dõi mỗi đợt** — còn 1.046 trên ngưỡng báo < ~1.800; tốc độ giảm hai đợt gần nhất ~116–117/đợt nhưng không đều, không dự báo ngày chạm ngưỡng.
2. **Guard birefnet giữ nguyên** — chỉ thử lại khi quan sát được available ≥ 6 GB; u2net là fallback chính thức.
3. **Balloon virtio theo dõi** — đợt này balloon đứng yên 6.443.824 kB trong cửa sổ đo, RAM kẹt ~500 MB; nếu các đợt sau balloon vẫn không co lại thì harness/suite có thể phải chờ RAM như Gate A đợt 130 — T5/T8 là chủ quản xác nhận, T9 chỉ ghi nhận số.
4. **Boot mới + replay mới bắt đầu lúc 14:35:39Z** — giao T5 đợt 131 xác nhận hình dạng replay sau khi xong (đối chiếu 1.509 dòng của #73/#74/#75/#76); số boot mới (#79 tạm) chờ T6 chốt.
5. **Chênh lệch brief vs đo trực tiếp (~831 MB vs 509 MB)** — parent đối chiếu khi tổng hợp đợt 131; T9 không kết luận nguyên nhân.
6. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 130 §11: lượt yên WebKit #9 (T4, đợt 131, bật log draw + T5 phân tích), mù #49/#50 probe thường lệ, G1 chờ user quyết, R9 (a) chờ user, ci-security.yml 403 chờ user, TTS 39 cấm kiểm lại, release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 7. File đổi + stage

- **File đổi (1, text):** `docs/PHASE9_ROUND131_T9_HEADROOM_LIMITS.md` (file này).
- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round131-t9-headroom.txt` — 1 entry, NUL-delimited, 0 binary, verify read-back.
- Hồ sơ đo: `hidden_files/round131-t9/headroom-measure-1.log` (đo lần 1 + RAM + boot + journal + dpkg), `headroom-measure-2.log` (đo lần 2 + RAM + dpkg), `ram-snapshot-1.log` (balloon + top RSS), `ram-snapshot-2.log` (mẫu RAM 2) — không nằm trong repo nên không stage.
- Cờ `round131-t9.done` đã tạo khi xong. Hạn cứng 17:35Z 17/11 — xong lúc ~14:45Z, trong hạn.
- Không push, không sửa production, không chạy TTS 39, không thử birefnet.
